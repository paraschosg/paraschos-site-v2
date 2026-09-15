import { test, expect } from "@playwright/test";

test.describe("homepage", () => {
  test("renders the hero and the essential sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const id of ["work", "stack", "github", "contact"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("has the security headers we ship", async ({ page }) => {
    const res = await page.goto("/");
    const csp = res?.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("nonce-");
    expect(csp).toContain("strict-dynamic");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(res?.headers()["x-frame-options"]).toBe("DENY");
    expect(res?.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("logs no console errors under CSP", async ({ page }) => {
    const errors: string[] = [];
    // CSP violations and runtime errors surface as console errors. Resource
    // 404s are tracked by URL instead, because the console text omits it and
    // Vercel Analytics scripts (/_vercel/*) only exist on Vercel.
    page.on("console", (m) => {
      const t = m.text();
      if (m.type() === "error" && !t.startsWith("Failed to load resource") && !t.includes("/_vercel/")) errors.push(t);
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("/_vercel/")) errors.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/");
    await page.getByRole("button", { name: /switch to .* theme/i }).click();
    await openPalette(page);
    await page.keyboard.press("Escape");
    expect(errors).toEqual([]);
  });
});

test.describe("terminal", () => {
  test("runs a command and prints output", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Terminal command");
    await input.fill("whoami");
    await input.press("Enter");
    await expect(page.getByRole("log")).toContainText("George Paraschos");
  });

  test("rejects unknown commands helpfully", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Terminal command");
    await input.fill("nonsense");
    await input.press("Enter");
    await expect(page.getByRole("log")).toContainText("command not found");
  });

  test("open <project> expands and reveals it", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Terminal command");
    await input.fill("open airline");
    await input.press("Enter");
    await expect(page.locator("#project-airline")).toHaveAttribute("open", "");
  });
});

// Keyboard shortcuts only work once React has attached its listeners, which
// can land after the page is visually ready. Retry the shortcut until the
// dialog appears instead of racing hydration.
async function openPalette(page: import("@playwright/test").Page) {
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(async () => {
    if (!(await dialog.isVisible())) await page.keyboard.press("Control+k");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  return dialog;
}

test.describe("command palette", () => {
  test("opens with the keyboard, filters, and navigates", async ({ page }) => {
    await page.goto("/");
    const dialog = await openPalette(page);
    await page.getByRole("combobox").fill("contact");
    await expect(dialog.getByRole("option")).toHaveCount(1);
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#contact$/);
  });

  test("closes on Escape", async ({ page }) => {
    await page.goto("/");
    await openPalette(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});

test.describe("theme", () => {
  test("persists across reloads with no flash", async ({ page }) => {
    await page.goto("/");
    const before = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.getByRole("button", { name: /switch to .* theme/i }).click();
    const after = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(after).not.toBe(before);

    await page.reload();
    // The inline script sets the attribute before first paint, so it must
    // already be correct at DOMContentLoaded, not after hydration.
    const onLoad = await page.evaluate(() => document.documentElement.dataset.theme);
    expect(onLoad).toBe(after);
  });
});

test.describe("contact form", () => {
  test("validates client-side before sending", async ({ page }) => {
    let requests = 0;
    await page.route("**/api/contact", (route) => {
      requests++;
      route.fulfill({ status: 200, body: "{}" });
    });
    await page.goto("/#contact");
    await page.getByLabel("Name").fill("A");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Message").fill("too short");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText(/tell me who you are/i)).toBeVisible();
    await expect(page.getByText(/doesn.t look like an email/i)).toBeVisible();
    await expect(page.getByText(/at least 20 characters/i)).toBeVisible();
    expect(requests).toBe(0);
  });

  test("shows the success state on a 200", async ({ page }) => {
    await page.route("**/api/contact", (route) => route.fulfill({ status: 200, body: '{"ok":true}' }));
    await page.goto("/#contact");
    await page.getByLabel("Name").fill("Test Person");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Message").fill("This is a long enough message for the form.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator(".form-status[data-state=ok]")).toContainText("Sent");
  });

  test("shows the error state on a 429", async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 429, body: '{"error":"Too many messages in a short time."}' }),
    );
    await page.goto("/#contact");
    await page.getByLabel("Name").fill("Test Person");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Message").fill("This is a long enough message for the form.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator(".form-status[data-state=err]")).toContainText("Too many messages");
  });

  // The rate limiter keys on x-forwarded-for, and every test here shares one
  // machine. Give each call its own address so the limiter never decides the
  // outcome of a test that isn't about the limiter.
  let n = 0;
  const from = () => ({
    headers: { "x-forwarded-for": `203.0.113.${Date.now() % 250}.${n++}` },
  });

  test("API rejects invalid payloads server-side", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: { name: "", email: "x", message: "" },
      ...from(),
    });
    expect(res.status()).toBe(422);
  });

  test("API silently accepts honeypot hits", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: { name: "Bot", email: "bot@example.com", message: "x".repeat(30), website: "http://spam" },
      ...from(),
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("API rate-limits repeated posts from one address", async ({ request }) => {
    const ip = from();
    const codes: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await request.post("/api/contact", {
        data: { name: "Flooder", email: "flood@example.com", message: "y".repeat(30) },
        ...ip,
      });
      codes.push(res.status());
    }
    expect(codes.at(-1)).toBe(429);
  });
});

test.describe("project pages", () => {
  test("render with their own metadata", async ({ page }) => {
    await page.goto("/work/airline");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Airline");
    await expect(page).toHaveTitle(/Airline management system/);
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(og).toContain("/work/airline/opengraph-image");
  });

  test("serve an OG image per project", async ({ request }) => {
    const res = await request.get("/work/airline/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});

test.describe("not found", () => {
  test("returns a real 404 with the designed page", async ({ page }) => {
    const res = await page.goto("/this-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("doesn’t exist");
    await expect(page.getByRole("link", { name: "Back to the homepage" })).toBeVisible();
  });
});

test.describe("motion", () => {
  test("stats are the real numbers in the server HTML, not zeros", async ({ request }) => {
    // The count-up must never be what puts the figure on the page: a crawler
    // or a visitor without JavaScript has to see the true value.
    const html = await (await request.get("/")).text();
    const stats = [...html.matchAll(/<div class="gh-stat"><strong><span>(\d+)<\/span>/g)].map((m) => Number(m[1]));
    expect(stats.length).toBeGreaterThan(0);
    expect(stats.some((n) => n > 0)).toBe(true);
  });

  test("stats count up to the server's number once scrolled into view", async ({ page, request }) => {
    const html = await (await request.get("/")).text();
    const expected = html.match(/<div class="gh-stat"><strong><span>(\d+)<\/span>/)?.[1];
    expect(expected).toBeDefined();

    await page.goto("/");
    const first = page.locator(".gh-stat strong").first();
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveText(expected!, { timeout: 5000 });
  });

  test("terminal shows a caret until it is used", async ({ page }) => {
    await page.goto("/");
    const row = page.locator(".term-input-row");
    await expect(row).toHaveAttribute("data-empty", "");
    await page.getByLabel("Terminal command").fill("whoami");
    await expect(row).not.toHaveAttribute("data-empty", "");
  });

  test("terminal types its hint, then clears it on focus", async ({ page }) => {
    await page.goto("/");
    const hint = page.locator(".term-hint");
    await expect(hint).toContainText("help", { timeout: 5000 });
    await page.getByLabel("Terminal command").click();
    await expect(hint).toBeHidden();
  });

  test("underlines are as wide as the text, not the column", async ({ page }) => {
    // .link is a grid item in the contact list; without justify-items: start
    // it stretches and the underline runs the full column width.
    await page.goto("/#contact");
    const link = page.locator(".contact-links a.link").last();
    const box = await link.boundingBox();
    const column = await page.locator(".contact-links").boundingBox();
    expect(box!.width).toBeLessThan(column!.width * 0.8);
  });

  test("underline is hidden at rest and wipes in on hover", async ({ page }) => {
    await page.goto("/");
    const link = page.locator(".contact-links a.link").first();
    await link.scrollIntoViewIfNeeded();
    // scaleX lives in the first value of the transform matrix: 0 hidden, 1 drawn.
    const scaleX = () =>
      link.evaluate((el) => getComputedStyle(el, "::before").transform.split("(")[1]?.split(",")[0]);

    expect(await scaleX()).toBe("0");
    // Re-hover each poll: smooth scrolling can slide the link out from under
    // the pointer before the transition has run.
    await expect
      .poll(async () => {
        await link.hover();
        return scaleX();
      }, { timeout: 5000 })
      .toBe("1");
  });
});

test.describe("wireframe backdrop", () => {
  test("is present, decorative, and behind the content", async ({ page }) => {
    await page.goto("/");
    const wire = page.locator(".wire");
    await expect(wire).toHaveAttribute("aria-hidden", "true");
    const z = await wire.evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(z)).toBeLessThan(0);
    // The canvas must not intercept clicks meant for the page.
    const pe = await wire.evaluate((el) => getComputedStyle(el).pointerEvents);
    expect(pe).toBe("none");
  });

  test("draws something", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(400);
    const painted = await page.locator(".wire canvas").evaluate((c) => {
      const canvas = c as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4 * 97) if (data[i] > 0) return true;
      return false;
    });
    expect(painted).toBe(true);
  });
});

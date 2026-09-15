import { test, expect } from "@playwright/test";

test.describe("homepage", () => {
  test("renders the hero and the essential sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const id of ["work", "stack", "now", "github", "contact"]) {
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

// The terminal is a floating window now; open it the way a visitor would,
// retrying until hydration has attached the click handler.
async function openTerminal(page: import("@playwright/test").Page) {
  await page.goto("/");
  const input = page.getByLabel("Terminal command");
  await expect(async () => {
    if (!(await input.isVisible())) await page.getByRole("button", { name: "Open terminal" }).click();
    await expect(input).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  return input;
}

test.describe("terminal", () => {
  test("runs a command and prints output", async ({ page }) => {
    const input = await openTerminal(page);
    await input.fill("whoami");
    await input.press("Enter");
    await expect(page.getByRole("log")).toContainText("George Paraschos");
  });

  test("rejects unknown commands helpfully", async ({ page }) => {
    const input = await openTerminal(page);
    await input.fill("nonsense");
    await input.press("Enter");
    await expect(page.getByRole("log")).toContainText("command not found");
  });

  test("open <project> moves to that station", async ({ page }) => {
    const input = await openTerminal(page);
    await input.fill("open airline");
    await input.press("Enter");
    await expect(page.getByRole("log")).toContainText("Moved to Airline management system");
    await expect(page).toHaveURL(/#project-airline$/);
  });
});

test.describe("filmstrip", () => {
  test("the ruler moves to a station", async ({ page }) => {
    await page.goto("/");
    const strip = page.locator("[data-filmstrip]");
    // Horizontal mode switches on after hydration, and only with a fine pointer.
    await expect(strip).toHaveAttribute("data-mode", /h|v/);
    await page.waitForTimeout(500);
    test.skip((await strip.getAttribute("data-mode")) !== "h", "horizontal mode not active on this device");
    const ruler = page.getByRole("navigation", { name: "Stations" });
    await ruler.getByRole("button", { name: "Contact" }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(ruler.getByRole("button", { name: "Contact" })).toHaveAttribute("aria-current", "location");
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
    const stats = [...html.matchAll(/<dd><span>(\d+)<\/span><\/dd>/g)].map((m) => Number(m[1]));
    expect(stats.length).toBeGreaterThan(0);
    expect(stats.some((n) => n > 0)).toBe(true);
  });

  test("stats count up to the server's number once their station is in view", async ({ page, request }) => {
    const html = await (await request.get("/")).text();
    const expected = html.match(/<dd><span>(\d+)<\/span><\/dd>/)?.[1];
    expect(expected).toBeDefined();

    await page.goto("/#github");
    await expect(page.locator(".signals-stats dd").first()).toHaveText(expected!, { timeout: 5000 });
  });

  test("terminal shows a caret until it is used", async ({ page }) => {
    const input = await openTerminal(page);
    const row = page.locator(".term-input-row");
    await input.blur();
    await expect(row).toHaveAttribute("data-empty", "");
    await input.fill("whoami");
    await expect(row).not.toHaveAttribute("data-empty", "");
  });

  test("filmstrip drawings are complete without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const offset = await page.locator(".station-project .s-main").first().evaluate((el) => getComputedStyle(el).strokeDashoffset);
    expect(parseFloat(offset)).toBe(0);
    await context.close();
  });

  test("underlines are as wide as the text, not the column", async ({ page }) => {
    await page.goto("/#contact");
    const link = page.locator(".postcard-links a.link").last();
    const box = await link.boundingBox();
    const column = await page.locator(".postcard-links").boundingBox();
    expect(box!.width).toBeLessThan(column!.width * 0.8);
  });
});

import { NextResponse } from "next/server";
import { site } from "@/lib/content";

export const runtime = "nodejs";

// Tiny in-memory rate limit per instance. Good enough to stop a script;
// for real abuse protection move this to Upstash/KV.
const hits = new Map<string, number[]>();
function limited(ip: string, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many messages in a short time. Try again later." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Honeypot filled → pretend success, drop silently.
  if (typeof body.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 5000);

  if (name.length < 2 || !EMAIL.test(email) || message.length < 20) {
    return NextResponse.json({ error: "Please fill in every field properly." }, { status: 422 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[contact] RESEND_API_KEY missing; message not delivered", { name, email });
    return NextResponse.json({ error: "Email delivery isn’t configured yet." }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "paraschos.site <contact@paraschos.site>",
      to: [process.env.CONTACT_TO ?? site.email],
      reply_to: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\nIP: ${ip}\n\n${message}`,
    }),
  });

  if (!res.ok) {
    console.error("[contact] Resend failed", res.status, await res.text());
    return NextResponse.json({ error: "The email service rejected the message." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse, type NextRequest } from "next/server";

// Content-Security-Policy with a per-request nonce.
//
// Next.js needs inline scripts for hydration, so a static CSP would either
// block them or require 'unsafe-inline', which defeats the point. Instead we
// mint a nonce per request; Next.js reads it from the request header and
// stamps it on its own scripts, and the layout stamps it on ours.
//
// 'strict-dynamic' lets nonce'd scripts load further scripts (Next chunks)
// without listing every URL. Vercel Analytics and Speed Insights load from
// this origin, so 'self' covers them.

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self' https://vitals.vercel-insights.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only. Static assets and prefetches don't need a policy.
      source: "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

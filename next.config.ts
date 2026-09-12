import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pages render per request (CSP nonce), which makes Next.js stream
  // <title>/<meta> into the body instead of the head. Our metadata is
  // static and instant, so there is nothing to gain from streaming it and
  // real costs: Lighthouse and simpler crawlers only read the head.
  // Matching every user agent here keeps metadata blocking for everyone.
  htmlLimitedBots: /./,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;

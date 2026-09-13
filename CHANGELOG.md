# Changelog

All notable changes to this site are recorded here. The file is maintained by
[release-please](https://github.com/googleapis/release-please) from commit
messages; entries below the first release heading were written by hand.

## [2.1.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.0.0...v2.1.0) (2026-09-13)


### Features

* refresh the Now section ([0d0996d](https://github.com/paraschosg/paraschos-site-v2/commit/0d0996d747f7cb19eac3e6fc0515e12ed0d5639c))

## 2.0.0 (2026-09-08)

Complete rebuild. The VS Code–themed static site was replaced with a Next.js
15 app: content-first layout, a working terminal in the hero, `⌘K` command
palette, flash-free theme switching, server-rendered GitHub activity, and a
contact form backed by Resend.

Since the initial release, without a version bump:

- Project pages at `/work/[slug]` with per-project Open Graph images
- Designed 404 page
- CI: type check, build, bundle budget, Lighthouse, Playwright suite
- Vercel Analytics and Speed Insights (cookie-free)
- Nonce-based Content-Security-Policy; shared rate limiting via Upstash

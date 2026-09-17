# Changelog

All notable changes to this site are recorded here. The file is maintained by
[release-please](https://github.com/googleapis/release-please) from commit
messages; entries below the first release heading were written by hand.

## [2.7.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.6.0...v2.7.0) (2026-09-17)


### Features

* **dock:** fade-and-rise page transitions ([cd83c03](https://github.com/paraschosg/paraschos-site-v2/commit/cd83c032ff34efbee79ee6b5365da579a9bb0056))
* **nav:** switch-panel menu replaces the dock ([c66ca87](https://github.com/paraschosg/paraschos-site-v2/commit/c66ca874116a9330eb61fa55cb00c7567408898e))

## [2.6.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.5.0...v2.6.0) (2026-09-17)


### Features

* **dock:** zoom-from-icon page transitions ([c3df169](https://github.com/paraschosg/paraschos-site-v2/commit/c3df1697aa0987068ce93c3d0d980a25d30b5592))
* **landing:** flip board rotates through messages every 5 seconds ([bef1b84](https://github.com/paraschosg/paraschos-site-v2/commit/bef1b84b5ed0cd9f79e7ad99b2e23a928153ee64))
* split-flap landing page, one page per dock item ([f415b2e](https://github.com/paraschosg/paraschos-site-v2/commit/f415b2e27e63603eec9f157af410afa318a72875))

## [2.5.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.4.0...v2.5.0) (2026-09-16)


### Features

* **nav:** macOS-style magnetic dock for the site menu ([3ec7daa](https://github.com/paraschosg/paraschos-site-v2/commit/3ec7daad2d66e84911258ebdede171dc498dd443))

## [2.4.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.3.0...v2.4.0) (2026-09-16)


### Features

* Field Notes redesign — horizontal filmstrip homepage ([ed207e6](https://github.com/paraschosg/paraschos-site-v2/commit/ed207e67e1844e1612ead2409481d51566e38b8c))
* **nav:** replace the bottom ruler with a magnetic dock ([5e23fa9](https://github.com/paraschosg/paraschos-site-v2/commit/5e23fa96a905d910833712c0f1dbc9f8b997815a))

## [2.3.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.2.1...v2.3.0) (2026-09-15)


### Features

* links show no underline until hover ([c0464a9](https://github.com/paraschosg/paraschos-site-v2/commit/c0464a9a33450e2621a54b8d91551071e24759e6))

## [2.2.1](https://github.com/paraschosg/paraschos-site-v2/compare/v2.2.0...v2.2.1) (2026-09-14)


### Fixes

* underline spans the text, not the whole column ([070faf8](https://github.com/paraschosg/paraschos-site-v2/commit/070faf85298d65cab0cc0b9dbfabfc493188f7e9))

## [2.2.0](https://github.com/paraschosg/paraschos-site-v2/compare/v2.1.0...v2.2.0) (2026-09-14)


### Features

* restrained motion on links, stats and the terminal ([6ef3224](https://github.com/paraschosg/paraschos-site-v2/commit/6ef32248df83960246cb153aa1651d17a8b4206a))

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

# paraschos.site

[![CI](https://github.com/paraschosg/paraschos-site-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/paraschosg/paraschos-site-v2/actions/workflows/ci.yml)

Personal site of George Paraschos. Next.js 15 (App Router), React 19, plain CSS with custom properties, self-hosted fonts.

## Run

```bash
npm install
cp .env.example .env.local   # fill in RESEND_API_KEY for the contact form
npm run dev
```

## What's in here

- **Theme** — `data-theme` on `<html>`, set by an inline script before first paint (no flash), persisted in `localStorage`, defaults to `prefers-color-scheme`.
- **Terminal** — the hero. `help`, `whoami`, `projects`, `open <project|section>`, `stack`, `contact`, `theme`, `history`, `clear`. Tab completion, arrow-key history, Ctrl+L.
- **Command palette** — `⌘K` / `Ctrl+K`. Keyboard-navigable listbox with proper ARIA.
- **GitHub section** — React Server Component, fetched with `next: { revalidate: 1800 }`. Visitors never hit the GitHub API. Degrades to a link if the API is down.
- **Contact form** — client validation → `POST /api/contact` → server validation, honeypot, per-IP rate limit, delivery via Resend.
- **Project pages** — `/work/[slug]`, statically generated from `lib/content.ts` via `generateStaticParams`. Each has its own metadata and a generated OG image (`app/work/[slug]/opengraph-image.tsx`), so shared links show a per-project card.
- **SEO/meta** — `generateMetadata`, generated `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`, JSON-LD `Person`.
- **CI** — every push runs type checking, a production build, a gzipped bundle budget (`scripts/check-bundle.mjs`, 120 kB ceiling), and Lighthouse against the homepage and a project page. Thresholds live in `.lighthouserc.json`; accessibility and SEO must score 100.
- **Analytics** — Vercel Analytics and Speed Insights. No cookies, no cross-site identifiers, so no consent banner is required.
- **Security headers** — set in `next.config.ts`.
- **Accessibility** — skip link, landmarks, visible focus, `prefers-reduced-motion`, labelled form fields with `aria-invalid`/`aria-describedby`.

## Deploy

Push to GitHub, import in Vercel, add the env vars from `.env.example`. Point `contact@paraschos.site` at a verified Resend domain (or change `from` in `app/api/contact/route.ts`).

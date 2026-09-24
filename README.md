# paraschos.site — v3

Personal portfolio of George Paraschos, live at [paraschos.site](https://paraschos.site).

A single-screen, non-scrolling site with four "channels" (Index, Work, About, Contact).

- **Index:** an interactive 3D fabric banner built with Three.js and a Verlet cloth simulation. Grab and pull it, press into it with the cursor, or click for a gust.
- **Page transitions:** CRT "channel switch". A blue band with static opens from the centre, the page name decodes, and the picture collapses to a line and a dot.
- **Style:** archive typography (big grotesk, typewriter labels with dotted leaders, dashed frames, grain), inspired by the Virgil Abloh Archive and AWGE.

No build step and no dependencies to install. Three.js and the fonts load from CDNs.

## Run locally

```bash
python -m http.server 5173
# open http://localhost:5173
```

ES modules need an `http://` origin, so opening `index.html` straight from disk won't work.

## Edit content

- `main.js`: `CONFIG` (name, email, optional Formspree endpoint) and `PROJECTS`
- `index.html`: About / CV / skills / contact text
- `cloth.js`: the text printed on the fabric (`paintTexture`)
- `style.css`: colour tokens at the top (`--blue: #063278`)

## Deploy

Pushing to `main` deploys to Vercel. `vercel.json` sets the framework preset to "Other", so the files are served as-is.

The previous Next.js version of the site is kept under the git tag `v2-nextjs`.

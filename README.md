# paraschos.site — v4 "GP-64"

Personal portfolio of George Paraschos, live at [paraschos.site](https://paraschos.site).

The site is a retro console with a CRT screen, in the spirit of awge.com and the KUKI concept site. It doesn't scroll: every "channel" fits on one screen.

| Route | Screen |
|---|---|
| `/` | Start screen: 3D George and his tabby cat, **PRESS START** |
| `#home` | Main menu with six spinning 3D objects |
| `#work` | "Select game": the three projects |
| `#work/<id>` | One project: drag to spin, tap to bounce, stats, stack and source link |
| `#about` | "Player 1": typewriter dialogue and a character card |
| `#skills` | "Inventory": skills as item slots |
| `#quests` | "Side quests": what I'm working on now |
| `#contact` | "Multiplayer": contact form and links |

You can also navigate with the keyboard: arrows move, Enter selects, Esc goes back.

## Run locally

```bash
python -m http.server 5174
# open http://localhost:5174
```

The site needs a local server because ES modules don't load from `file://`. There's no build step and nothing to install. Three.js and the fonts load from CDNs.

## Edit

- `js/data.js`: all the content (projects, stats, player card, dialogue, skills, quests, ticker, links).
- `api/contact.js`: the contact form endpoint, a Vercel function that sends the message through [Resend](https://resend.com) from `contact@paraschos.site`, with `reply-to` set to the visitor. It needs `RESEND_API_KEY` and `CONTACT_TO` in the Vercel project's environment variables. With the local Python server the endpoint doesn't exist, so the form shows an error there; `vercel dev` runs it.
- `js/avatar.js`: the 3D George (`AVATAR` colours at the top) and the cat.
- `js/props.js`: the other 3D objects and the colour palette (`PALETTE`).
- `js/stage.js`: one WebGL canvas that renders many small 3D scenes onto page elements.
- `js/main.js`: the router, sounds, keyboard input, loading screen, dialogue and form.
- `css/style.css`: all the styling. The colour tokens are in `:root` (`--bezel` for the grey TV, `--accent: #38070e` for the details).

## History

- `v3-cloth`: the previous archive-style site with the 3D fabric banner.
- `v2-nextjs`: the earlier Next.js site.

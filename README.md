# BIH JHS Tech Club: Study Packs

The website for the Bozoma Innovation Hub JHS Tech Club. It has a page for each of the 22 sessions, with an interactive workbook, at least one 3D lab with guided 🎯 missions, a downloadable offline study pack (.zip), a print-ready PDF and a mentor guide.

Live at https://bih-tech-club.vercel.app

## Branding
The site, workbooks, PDFs, 3D labs and link previews use the Bozoma Innovation Hub brand, taken from [bozomainnovationhub.com](https://bozomainnovationhub.com):

| Token | Value | Used for |
|---|---|---|
| Plum | `#24182E` | Header, footer, headings, hero bands |
| Red | `#CA1F3F` | Main buttons, accents, workbook badges |
| Gold | `#FFBE00` (text on white: `#8A5C00`) | Highlights, labels, the call-to-action band |
| Fonts | Outfit (headings), Rubik (text) | Self-hosted from `@fontsource-variable`, and embedded in each workbook so offline packs and PDFs match |

The tokens live at the top of `src/site.css`. The workbooks are rebranded when published (`scripts/lib/workbook.mjs`): the old purple/orange palette is swapped for these colours, while colours that draw real software (Excel green, Word blue, Scratch blocks) are kept. `npm run og` makes the preview cards, icons and the transparent and white logo versions from `assets/logo.png`.

## Self-study
Every session page has a numbered path (learn → 3D lab → Lab Mission → check → save). Learners tick steps as they go, the lab step ticks itself when its missions are done, and *Finished? Check your answers* shows the answer key from the mentor guide. Progress is stored only in that browser (`bih-progress`). The home page shows *Continue* and a status on each session card. `/start/` explains how to study. The step wording is in `stepsFor()` in `scripts/build.mjs`; Sessions 20 and 22 (capstone) have their own paths. Each session's *What you need* line is `needs` in `content/sessions.json`.

The review and recommendations are in [`docs/PLANNING.md`](docs/PLANNING.md).

## Project layout

```
content/
  sessions.json          Course map: titles, levels, summaries, which 3D lab
  workbooks/             The 20 authored workbooks (the master copy, so edit these)
  mentor/                Mentor guides, one Markdown file per session (_TEMPLATE.md shows the headings)
src/
  labs/                  three.js 3D labs (one file per lab + runtime.js)
  workbook.js            Autosave + toolbar added to every workbook
  sw.js                  Service worker: the site keeps working offline after one visit
  site.css               Website styles (brand tokens at the top)
  site.js                Progress ticks, Continue, status chips and offline saving
scripts/
  build.mjs              Builds the site into dist/ (Vercel runs this)
  pdf.mjs                Renders workbooks to A4 PDFs in packs/pdf/
  og.mjs                 Makes the link-preview cards (assets/og/), app icons and logo versions
  lib/workbook.mjs       Shared workbook transform (hints, toolbar, autosave)
  lib/markdown.mjs       Small Markdown renderer for the mentor guides
packs/pdf/               Generated PDFs (committed, so Vercel needs no browser)
assets/                 Logo, app icons and link-preview cards
docs/                    Planning notes and the original Word study pack
```

## Everyday tasks

```bash
pnpm install           # once (the project uses pnpm; Vercel does too)
pnpm run dev           # build and preview at http://localhost:4321
```

**Update a session**
1. Edit `content/workbooks/session-07.html` (or change its title/summary in `content/sessions.json`).
2. Regenerate its PDF: `npm run pdf -- 7` (or `npm run pdf` for all). This uses Google Chrome if installed, or set `CHROME_PATH`.
3. Commit and push. Vercel rebuilds, and the session's "Last updated" date comes from the git history.

The build prints a warning if a PDF is missing or older than its workbook. If you change a session **title**, also run `npm run og` so its WhatsApp preview card matches.

**Update a mentor guide:** edit `content/mentor/session-07.md` and push. Keep the headings from `_TEMPLATE.md`. Use plain Markdown: headings, paragraphs, `- ` bullets, `1. ` lists, `- [ ] ` checklists, tables, `**bold**`, `*italic*`. Guides appear at `/mentors/07/`. They contain answer keys, so they are linked only from the mentors page and hidden from search engines. They are not password-protected.

**3D lab style.** The labs are drawn like technical illustrations: a fixed-angle orthographic camera, ink outlines on every solid (added automatically by `inkScene()` in `src/labs/runtime.js`), soft shadows on a paper-and-grid background, and a view toolbar (turn, zoom, labels on/off, reset). A lab can opt out of the orthographic camera with `config.perspective = true` (the slides lab does, for its slide-show fly-in), and set `config.frame` to frame the scene tighter (<1) or looser (>1). Give an object `userData.noInk = true` to skip its outline.

- `stage.callout(object, { icon, title, text, at, dx, dy, onClick })` pins a card to a part with a dot and a dashed leader line. `at` is a point on the object, and `dx`/`dy` move the card in pixels; cards push each other apart if they overlap. Clicking a card can do the same as clicking the part (see `computer.js`). It returns `{ card, at, set(title, text, icon), remove() }`; change `at` to move the dot when the part moves.
- The toolbar's **▶ Show me around** button tours a lab's callout cards in order: the camera glides to each part and its card lights up. It only shows; pupils still click parts to finish missions.
- `npm run thumbs` photographs every lab (model only) into `assets/labs/<lab>.jpg`. The pictures appear on the session cards and in the labs gallery; run it after changing how a lab looks.
- On phone-sized canvases only the first four cards a lab adds are shown (so add the most important first); the tour still visits all of them. Small tags under a card are hidden.
- Model building blocks: `rbox(w, h, d, color, radius)` (rounded box), `cable(points, color, radius)` (a smooth wire through `[x, y, z]` points) and `decal(w, h, (g, W, H) => …)` (a flat printed detail drawn on a canvas: legends, screens, labels).
- Tweens (`stage.tween`, `stage.wait`) keep running when the lab is scrolled off-screen, so timers and programs don't stall; idle animations from `onTick` pause. Call `stage.reveal()` from "watch this" buttons to scroll the model into view on phones.
- `label(text, { scale, color, bg })` and `setLabel()` make small floating text tags. They are drawn as HTML, so they stay sharp and never shrink below 11px.

**Add a 3D lab to a session:** create `src/labs/<name>.js`, which exports a default `(stage, ui, host) => {}`, an optional `config` and an optional `missions` list (`[{ id, text, hint }]`; call `ui.complete(id)` when a student does each step). Copy the pattern of an existing lab, register it in `LABS` in `scripts/build.mjs`, and set `"lab": "<name>"` (or a list, e.g. `["password", "phishing"]`) on the session in `sessions.json`.

## Deploying to Vercel

The repository is ready as is (`vercel.json` sets the build command and the `dist` output).

- **From GitHub (recommended):** push this repo to GitHub, then in Vercel choose *Add New → Project → Import* and pick the repo. Every push to `main` deploys.
- **From this computer:** `vercel` (preview) or `vercel --prod`.

## Notes
- **Offline, two ways.** (1) On each lab PC, open the Mentors page with internet and press **Save the whole course on this computer**. After that every page, workbook, guide and lab works offline there, and it refreshes itself after updates. (Pupils' phones only save the pages they open, to spare their data.) (2) `downloads/BIH-Tech-Club-Offline-Kit.zip` is the whole site as plain files for a USB drive: open `index.html`, no internet or web server needed (the labs are bundled into one script with esbuild for this).
- Link previews use `site` in `content/sessions.json`. If you move to a custom domain, change it there (or set `SITE_URL` in Vercel).
- Typed answers are saved only in the browser on the computer being used (localStorage). Nothing is sent anywhere.
- three.js is served from the site itself (`/vendor/three@<version>/`), not a CDN, so labs load on school networks that block CDNs. The version in the path means browsers never keep an old copy after an upgrade.
- "Last updated" dates come from git history. If Vercel's dates look wrong, set the environment variable `VERCEL_DEEP_CLONE=true` in the Vercel project.
- In the published copies, the sample text in fill-in boxes becomes a faint hint, so it does not print. The authored files are not changed.

# BIH JHS Tech Club: Study Packs

The website for the Bozoma Innovation Hub JHS Tech Club. It has a page for each of the 20 sessions, with an interactive workbook, at least one 3D lab with guided 🎯 missions, a downloadable offline study pack (.zip), a print-ready PDF and a mentor guide.

Live at https://bih-tech-club.vercel.app

The review, recommendations and the Inter-Schools Tech Championship plan are in [`docs/PLANNING.md`](docs/PLANNING.md).

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
  site.css               Website styles
scripts/
  build.mjs              Builds the site into dist/ (Vercel runs this)
  pdf.mjs                Renders workbooks to A4 PDFs in packs/pdf/
  og.mjs                 Makes the link-preview cards (assets/og/) and app icons
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

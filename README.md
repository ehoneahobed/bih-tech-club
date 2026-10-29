# BIH JHS Tech Club: Study Packs

The website for the Bozoma Innovation Hub JHS Tech Club. It has a page for each of the 20 sessions, with an interactive workbook, a 3D lab (13 of them have one), a downloadable offline study pack (.zip) and a print-ready PDF.

The review, recommendations and the Inter-Schools Tech Championship plan are in [`docs/PLANNING.md`](docs/PLANNING.md).

## Project layout

```
content/
  sessions.json          Course map: titles, levels, summaries, which 3D lab
  workbooks/             The 20 authored workbooks (the master copy, so edit these)
src/
  labs/                  three.js 3D labs (one file per lab + runtime.js)
  workbook.js            Autosave + toolbar added to every workbook
  site.css               Website styles
scripts/
  build.mjs              Builds the site into dist/ (Vercel runs this)
  pdf.mjs                Renders workbooks to A4 PDFs in packs/pdf/
  lib/workbook.mjs       Shared workbook transform (hints, toolbar, autosave)
packs/pdf/               Generated PDFs (committed, so Vercel needs no browser)
assets/logo.png
docs/                    Planning notes and the original Word study pack
```

## Everyday tasks

```bash
npm install            # once
npm run dev            # build and preview at http://localhost:4321
```

**Update a session**
1. Edit `content/workbooks/session-07.html` (or change its title/summary in `content/sessions.json`).
2. Regenerate its PDF: `npm run pdf -- 7` (or `npm run pdf` for all). This uses Google Chrome if installed, or set `CHROME_PATH`.
3. Commit and push. Vercel rebuilds, and the session's "Last updated" date comes from the git history.

The build prints a warning if a PDF is missing or older than its workbook.

**Add a 3D lab to a session:** create `src/labs/<name>.js`, which exports a default `(stage, ui, host) => {}` and an optional `config`. Copy the pattern of an existing lab, register it in `LABS` in `scripts/build.mjs`, and set `"lab": "<name>"` on the session in `sessions.json`.

## Deploying to Vercel

The repository is ready as is (`vercel.json` sets the build command and the `dist` output).

- **From GitHub (recommended):** push this repo to GitHub, then in Vercel choose *Add New → Project → Import* and pick the repo. Every push to `main` deploys.
- **From this computer:** `vercel` (preview) or `vercel --prod`.

## Notes
- Typed answers are saved only in the browser on the computer being used (localStorage). Nothing is sent anywhere.
- three.js is served from the site itself (`/vendor/three`), not a CDN, so labs load on school networks that block CDNs.
- In the published copies, the sample text in fill-in boxes becomes a faint hint, so it does not print. The authored files are not changed.

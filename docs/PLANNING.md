# BIH Tech Club & Inter-Schools Tech Championship: Review and Plan

_Prepared 29 October 2026. This is a working document: edit it as decisions are made._

## 1. Where things stand

| Asset | State |
|---|---|
| 20 session workbooks (`content/workbooks/`) | Complete. Each is 6 pages and follows the same design. |
| Word study pack (`docs/source/…Study_Packs.docx`) | A condensed 11-unit version of the same journey (about 5,200 words). |
| Logo | 1600 × 500 PNG. |
| Website | **New:** session pages, 8 interactive 3D labs, offline ZIP packs and print-ready PDFs (this repository). |
| Inter-Schools Tech Championship | **No materials yet.** A draft structure is in section 4. |

## 2. Review of the session workbooks

### What's working well
- **Locally grounded teaching.** The analogies are memorable and Ghanaian: the corn mill (input/process/output), kelewele (algorithms), fufu pounding (loops), *nnoboa* (collaboration), the market trader's ledger (spreadsheets) and the "Kwesi" spell-check dilemma.
- **Separate desktop and laptop paths** from Session 1. This suits mixed school labs.
- **A consistent rhythm.** Each session moves from plain-talk concept to vocabulary, a guided lab, a "panic button" troubleshooting box, a knowledge check and a self-rating.
- **Safety throughout.** Pupils use fictional data, never write real passwords, and ask before deleting or sharing. Session 15 brings these together.
- **A real progression to a product.** Sessions 18–20 take pupils from charter to prototype to tested v1.1 to a 3-minute pitch, across four sensible tracks.

### Fixed in this pass
1. **Session 15 numbering.** Page 1 had two headings numbered "2.". The second is now "3. The School Uniform Rule".
2. **Sample text in fill-in boxes.** Boxes held text like "Type your full name here…", "PC-01" and (in Sessions 19–20) a whole example team, "EcoTech Ghana Innovators". Pupils had to delete it, and it printed. The build now turns this text into a faint hint that disappears when typing or printing. The source files are unchanged.
3. **Printing overflowed A4.** The 6-page workbooks printed as 9 pages, with half-empty sheets. PDFs are now auto-fitted so each workbook page fills exactly one A4 sheet. Scaling ranges from 78% (Session 9) to 100%.
4. **Answers were lost on refresh.** Typed answers, ticks and self-ratings now autosave in the browser. A "Clear my answers" button is provided for shared PCs.
5. **No phone layout.** Workbooks now stack to one column on narrow screens.

### Recommendations (need a decision)
| # | Issue | Recommendation |
|---|---|---|
| R1 | **Two sources of truth.** The Word study pack and the HTML workbooks cover the same content with different wording and groupings. For example, the Word pack puts typing in Sessions 4–5, while the workbooks teach it in Session 2. They will drift apart. | Make the HTML workbooks the master copy. Either retire the Word pack or treat it as a "take-home summary" and review it each term against the workbooks. |
| R2 | **No mentor guide.** The workbooks are for pupils. There are no timings, materials lists, answer keys or "common mistakes" notes for mentors. | Add a 1-page mentor sheet per session (`content/mentor/session-NN.md`), rendered on the site behind a simple link. Start with Sessions 1, 10 and 16. These are the hardest to run. |
| R3 | **Small print size.** Body text is 12.5–13px. After PDF fitting, Session 9 prints at about 10px, which is small for JHS 1. | Split Session 9 page 1 (the tallest page) or trim it. Consider a 14px base size next revision. |
| R4 | **Software names.** Most sessions name Word/Excel/PowerPoint and a few mention Google Docs or LibreOffice. | Add one standard line to each office session: "Using Google Docs or LibreOffice? The buttons look different but do the same job." Schools will have a mix. |
| R5 | **Progress isn't captured.** Self-ratings and mentor signatures are on paper or in one browser. | For now, collect the printed self-rating page. If you want a dashboard later, the site can add a simple sign-in-free progress form (see roadmap). |
| R6 | **Shared lab PCs and privacy.** Autosaved answers stay on that PC's browser. | Mentors should remind pupils to "Print / Save as PDF, then Clear my answers" at the end of each session. This is already on the Mentors page. |

## 3. How the website works

- **Share per session:** `https://<your-domain>/sessions/01/` … `/sessions/20/`. Each page has the workbook, the 3D lab (where there is one), a ZIP pack and a PDF.
- **Offline:** the ZIP contains a workbook that runs with no internet, the PDF and a README. Download it to a USB drive before going to a school without internet.
- **3D labs:** Computer (S1), Keyboard (S2), Desktop windows (S3), Filing tree (S4–5), Internet town (S6, S7, S14), Spreadsheet charts (S10–11), Password fortress (S15) and Code the Sprite (S16–17). They need WebGL, which almost every browser since 2015 supports. If it is missing, the page says so and the workbook still works.
- **Keeping it up to date:** edit `content/workbooks/session-NN.html`, run `npm run pdf -- NN`, then commit and push. Vercel rebuilds automatically. The "Last updated" date comes from git, and the build warns when a PDF is older than its workbook. See `README.md`.

## 4. Inter-Schools Tech Championship: draft structure

> This is a proposal to react to. Nothing below exists in the current materials.

**Purpose:** give every club a goal to work towards and a public stage for the capstone work, and bring the participating schools together.

### Format: two stages
1. **School round (Session 20 Demo Day).** Each club holds its Demo Day as normal and picks **one capstone team** plus **two individual skills competitors** to represent the school.
2. **Championship Day (one day, one venue).** All schools come together.

### Championship events
| Event | Who | What it tests | Format |
|---|---|---|---|
| **Capstone Showcase** (main prize) | School team (3–4) | Sessions 18–20 | 3-minute pitch + 2-minute Q&A, using the existing pitch formula. Entered in one of the four capstone tracks: A Health & Environment, B Market & Canteen Bookkeeper, C Educational Game (Scratch), D Culture & Community Tourism. |
| **Digital Skills Relay** | 2 per school | Sessions 1–11 | Timed stations: home-row typing accuracy, create the BIH folder structure and correctly named file, fix a broken spreadsheet formula and chart, format a one-page notice. Judges check accuracy first, then time. |
| **Code Sprint** | 1–2 per school | Sessions 16–17 | 30 minutes to build a set Scratch mini-game from a brief (loop + condition + score variable). Brief is revealed on the day. |
| **Digital Citizen Quiz** | Whole team | Sessions 6, 7, 14, 15 | Buzzer quiz: spot the phishing email, HTTPS or not, T.H.I.N.K., the right sharing permission. |

### Judging the Capstone Showcase (suggested 100 points)
| Criterion | Points |
|---|---|
| Problem is real and local, and the team shows evidence | 20 |
| The digital product works and uses the taught tools correctly | 25 |
| Testing and iteration (change log v0.1 → v1.1) | 20 |
| Pitch: clarity, every member speaks, within 3 minutes | 20 |
| Safe and ethical practice (fictional data, sources cited, permissions) | 15 |

### Decisions needed from the BIH team
1. **Date and venue.** Does it need a lab with enough PCs for the Relay and Code Sprint? About 2 PCs per school.
2. **How many schools,** and whether the club has run all 20 sessions in each one by then.
3. **Eligibility:** JHS 1 only, or JHS 1–3? Is there a team size limit?
4. **Judges:** suggest 3 per panel (an industry volunteer, a teacher from a non-competing school, a BIH mentor).
5. **Prizes and certificates.** Every participant should get a certificate, not only the winners.
6. **Consent and media.** Collect caregiver photo and video consent before the day (this matches the workbooks' own safety rules).
7. **Internet on the day.** Assume none. The offline ZIP packs and Scratch offline editor should be pre-installed.

### Suggested timeline (counting back from Championship Day = **C**)
| When | Milestone |
|---|---|
| C − 12 weeks | Confirm schools, date, venue, judges. Publish the rules and rubric on the site. |
| C − 8 weeks | Clubs reach Session 18; teams choose a track. |
| C − 4 weeks | School Demo Days (Session 20) select representatives. |
| C − 2 weeks | Teams submit project title, track and a 1-paragraph summary. Mentors receive the judging pack. |
| C − 1 week | Device check at the venue; offline software installed. |
| C | Championship Day. |
| C + 1 week | Results, certificates and winning projects published on the site (with consent). |

## 5. Platform roadmap

| Priority | Item | Notes |
|---|---|---|
| Now | Deploy to Vercel and connect the GitHub repo | Pushes rebuild automatically. |
| Next | Mentor notes per session (R2) | Markdown files → site pages. |
| Next | Championship page: rules, rubric, timeline and FAQ | Once section 4 is agreed. |
| Later | 3D labs for Sessions 8–9 (formatting), 12–13 (slide design and a pitch timer), 18–20 (a capstone "build the house" progress tracker) | All 20 sessions would then have a lab. |
| Later | Championship registration form and results board | Needs a small backend or a form service. |
| Later | Progress tracking per learner (R5) | Only with a clear consent and privacy plan for minors. |

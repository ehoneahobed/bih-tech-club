# BIH Tech Club: Review and Plan

_Prepared 29 October 2026. This is a working document: edit it as decisions are made._

## 1. Where things stand

| Asset | State |
|---|---|
| 22 session workbooks (`content/workbooks/`) | Complete. Sessions 18–19 (AI) were added on 30 Oct 2026, and the capstone moved from 18–20 to 20–22. Each is 6 pages and follows the same design. |
| Word study pack (`docs/source/…Study_Packs.docx`) | A condensed 11-unit version of the same journey (about 5,200 words). |
| Logo | 1600 × 500 PNG. |
| Website | Live at https://bih-tech-club.vercel.app: session pages, 14 interactive 3D labs, offline ZIP packs, print-ready PDFs, an Offline Club Kit for USB and 22 mentor guides. |

## 2. Review of the session workbooks

### What's working well
- **Locally grounded teaching.** The analogies are memorable and Ghanaian: the corn mill (input/process/output), kelewele (algorithms), fufu pounding (loops), *nnoboa* (collaboration), the market trader's ledger (spreadsheets) and the "Kwesi" spell-check dilemma.
- **Separate desktop and laptop paths** from Session 1. This suits mixed school labs.
- **A consistent rhythm.** Each session moves from plain-talk concept to vocabulary, a guided lab, a "panic button" troubleshooting box, a knowledge check and a self-rating.
- **Safety throughout.** Pupils use fictional data, never write real passwords, and ask before deleting or sharing. Session 15 brings these together.
- **A real progression to a product.** Sessions 20–22 take pupils from charter to prototype to tested v1.1 to a 3-minute pitch, across four sensible tracks.

### Fixed in this pass
1. **Session 15 numbering.** Page 1 had two headings numbered "2.". The second is now "3. The School Uniform Rule".
2. **Sample text in fill-in boxes.** Boxes held text like "Type your full name here…", "PC-01" and (in Sessions 21–22) a whole example team, "EcoTech Ghana Innovators". Pupils had to delete it, and it printed. The build now turns this text into a faint hint that disappears when typing or printing. The source files are unchanged.
3. **Printing overflowed A4.** The 6-page workbooks printed as 9 pages, with half-empty sheets. PDFs are now auto-fitted so each workbook page fills exactly one A4 sheet. Scaling ranges from 78% (Session 9) to 100%.
4. **Answers were lost on refresh.** Typed answers, ticks and self-ratings now autosave in the browser. A "Clear my answers" button is provided for shared PCs.
5. **No phone layout.** Workbooks now stack to one column on narrow screens.

### Recommendations (need a decision)
| # | Issue | Recommendation |
|---|---|---|
| R1 | **Two sources of truth.** The Word study pack and the HTML workbooks cover the same content with different wording and groupings. For example, the Word pack puts typing in Sessions 4–5, while the workbooks teach it in Session 2. They will drift apart. | Make the HTML workbooks the master copy. Either retire the Word pack or treat it as a "take-home summary" and review it each term against the workbooks. |
| R2 | ~~**No mentor guide.**~~ **Drafted 30 Oct 2026.** All 20 guides are at `/mentors/NN/` (source `content/mentor/`). Each has timings for a 90-minute session, preparation, common mistakes, what to do when things go wrong, and an answer key. | A BIH mentor should check each guide before its session is first taught, starting with the answer keys. Confirm the 90-minute assumption. The guides are public but unlisted; if answer keys must be private, move them to a password-protected space. |
| R3 | **Small print size.** Body text is 12.5–13px. After PDF fitting, Session 9 prints at about 10px, which is small for JHS 1. | Split Session 9 page 1 (the tallest page) or trim it. Consider a 14px base size next revision. |
| R4 | **Software names.** Most sessions name Word/Excel/PowerPoint and a few mention Google Docs or LibreOffice. | Add one standard line to each office session: "Using Google Docs or LibreOffice? The buttons look different but do the same job." Schools will have a mix. |
| R5 | **Progress isn't captured.** Self-ratings and mentor signatures are on paper or in one browser. | For now, collect the printed self-rating page. If you want a dashboard later, the site can add a simple sign-in-free progress form (see roadmap). |
| R6 | **Shared lab PCs and privacy.** Autosaved answers stay on that PC's browser. | Mentors should remind pupils to "Print / Save as PDF, then Clear my answers" at the end of each session. This is already on the Mentors page. |

### Content review and fixes (30 October 2026)
About 60 problems were found in three rounds: while writing the mentor guides, then two independent adversarial reviews of all 20 workbooks, guides and labs. All are fixed in the workbooks, guides and labs, and the PDFs are regenerated (every workbook still prints as 6 A4 pages). The main kinds:
- **Technical errors:**
  - right-click called the middle button;
  - `=VALUE!` instead of `#VALUE!`;
  - #NAME? blamed on a missing `=`;
  - a chart axis that misread every bar;
  - Scratch's `move` said to glide;
  - the default sprite called "Cat1";
  - Recycle Bin claims that ignored USB drives.
- **Things that would fail in class:**
  - a Notes folder never created;
  - Google Docs pupils told to Save As to a local folder;
  - a score that kept rising in the Scratch game;
  - pictures with no source;
  - Windows 11 Notepad silently keeping one pupil's text for the next.
- **Contradictions:**
  - keyboard zones (workbook 4, lab 5; the lab now shows the workbook's 4);
  - capstone tracks, roles, file names and pitch acts across the capstone sessions (then 18–20, now 20–22) and the capstone lab (all aligned; the lab's pitch timer now uses the workbook's 3 acts);
  - password advice versus the Password Fortress lab (now five random words everywhere; the lab also counts CamelCase words).
- **Honesty and safety:**
  - an unsourced statistic credited to a real agency, and two other unsourced figures, removed or marked as practice data;
  - real-looking email domains replaced with example ones or "the address your mentor writes on the board";
  - pupils' age added to personal information;
  - pupils no longer handle cables during a power fault.

**Still needs a person to check:**
1. The Twi proverb in Session 2 ("Tikro nkɔ agyina": "One head does not hold council"). Ask a Twi speaker.
2. The 90-minute session length assumed by the mentor guides.
3. The Windows 11 Notepad setting named in the Session 3 guide, on your lab PCs.
4. Whether pupils have school-managed Google accounts (Sessions 8–14).

## 3. How the website works

- **Share per session:** `https://<your-domain>/sessions/01/` … `/sessions/22/`. Each page has the workbook, the 3D lab (where there is one), a ZIP pack and a PDF.
- **Offline, three ways:** (1) on each lab PC, open the Mentors page while online and press **Save the whole course on this computer**; the whole course, labs included, then works offline on that PC (phones save only the pages they open); (2) the **Offline Club Kit** ZIP on the Mentors page is the whole site for a USB drive (open `index.html`); (3) each session's own ZIP has the workbook, the PDF and a README.
- **Sharing on WhatsApp:** every page has a preview card with the logo and session title.
- **Mentor guides:** `/mentors/01/` … `/mentors/22/`, linked from the Mentors page.
- **3D labs (every session has at least one):** Computer (S1), Keyboard (S2), Desktop windows (S3), Filing tree (S4–5), Internet town (S6, S7, S14), Spot the Phish (S7, S15), Document formatting (S8–9), Spreadsheet charts (S10–11), Slide design & slide show (S12–13), Password fortress (S15), Code the Sprite (S16–17), Teach the Robot (S18), AI Helper Check (S19) and Build the Whole House capstone planner (S20–22).
- **Guided missions:** every lab has a 🎯 checklist that always shows the next step and a hint, saves progress on that computer and celebrates when finished. A 🔊 button reads the instructions aloud. The capstone lab saves the team's charter, change log and pitch plan between Sessions 20, 21 and 22, and prints a project card. They need WebGL, which almost every browser since 2015 supports. If it is missing, the page says so and the workbook still works.
- **Keeping it up to date:** edit `content/workbooks/session-NN.html`, run `npm run pdf -- NN`, then commit and push. Vercel rebuilds automatically. The "Last updated" date comes from git, and the build warns when a PDF is older than its workbook. See `README.md`.

## 4. Platform roadmap

| Priority | Item | Notes |
|---|---|---|
| Done | Deploy to Vercel and connect the GitHub repo | Pushes rebuild automatically. |
| Done | Mentor guides (R2), offline mode, USB kit, link previews, 404 page, sitemap | 30 Oct 2026. The guides need a BIH review. |
| Done | BIH branding and self-study path | 30 Oct 2026: BIH colours and fonts across the site, workbooks, PDFs and labs; step-by-step session path with progress, answer check and a Start here page. |
| Done | AI literacy | 30 Oct 2026: Session 18 "What Is AI? Machines That Learn" (Teach the Robot lab) and Session 19 "Using AI Wisely & Safely" (AI Helper Check lab). Pupils learn the ideas without accounts; real AI tools only with a mentor, at the Hub or with a parent. Saved progress and answers for the old Sessions 18–20 move to 20–22 automatically. |
| Next | Links to the GES JHS Computing curriculum | Needs a decision from BIH. |
| Next | Short self-marking quiz per session | Reuses the workbook review questions. |
| Later | Progress tracking per learner (R5) | Only with a clear consent and privacy plan for minors. |

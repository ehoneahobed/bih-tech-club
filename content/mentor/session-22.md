# Session 22: Spreadsheets 3: Working with Data

> **At a glance:** pupils take the class survey answers from Session 21 (or a sample data set), freeze the header row, sort without breaking rows, filter, count answers with COUNTIF, label rows with IF, highlight with conditional formatting, chart the results and write one-sentence findings. · **Time:** 90 minutes (adjust the timings if your period is shorter) · **Workbook pages:** 6

## Learning outcomes
By the end of the session, pupils can:
1. Freeze the header row, sort a table by one column (A to Z, largest to smallest) without breaking the rows, and filter it to show only some rows.
2. Count answers with COUNTIF (for example `=COUNTIF(C2:C21,"Walk")`) and label rows with IF (for example `=IF(B2>=50,"Pass","Try again")`), and use conditional formatting to highlight cells.
3. Make a clear chart from a summary table and write a one-sentence finding that states a fact with a number.

## Before the session
- [ ] Prepare `Class_Survey.xlsx` in `Documents > BIH_Practice` on every PC (and on USB). Use **your master form's answers from Session 21** if there are at least 10: open its linked sheet, then tidy it into the layout below (delete the Timestamp, after-school and ideas columns; shorten the headers to No., Class, Travel, Minutes, Food, Screen hours, Enjoy (1–5); type 1, 2, 3… in column A; fix any odd spellings in Travel and Food), then File → Download → Microsoft Excel (.xlsx). Otherwise type the **sample data set** below. Keeping the same columns means the workbook's cell addresses (C2:C21, D2…) work. If your class data has more or fewer than 20 rows, tell pupils the last row number (for example C2:C31).
- [ ] Work through the Page 5 lab yourself on one PC in each programme you have (Excel, LibreOffice Calc, Google Sheets): the sort, filter and conditional formatting menus differ.
- [ ] Test the Data Sorter 3D lab on the projector PC and keep the offline pack on USB.
- [ ] Write the four assembly commands (sort, filter, COUNTIF, IF) on the board.

**Sample data set** (type it into rows 1–21, columns A–G):

| No. | Class | Travel | Minutes | Food | Screen hours | Enjoy (1–5) |
|---|---|---|---|---|---|---|
| 1 | JHS 1 | Walk | 15 | Jollof | 2 | 5 |
| 2 | JHS 2 | Trotro or bus | 40 | Waakye | 4 | 4 |
| 3 | JHS 1 | Walk | 10 | Banku | 1 | 5 |
| 4 | JHS 3 | Taxi | 25 | Jollof | 3 | 3 |
| 5 | JHS 2 | Walk | 20 | Fufu | 2 | 4 |
| 6 | JHS 1 | Trotro or bus | 55 | Jollof | 5 | 5 |
| 7 | JHS 3 | Bicycle | 30 | Kenkey | 1 | 4 |
| 8 | JHS 2 | Walk | 5 | Waakye | 6 | 2 |
| 9 | JHS 1 | Car | 35 | Jollof | 3 | 5 |
| 10 | JHS 3 | Walk | 25 | Red-red | 2 | 3 |
| 11 | JHS 2 | Trotro or bus | 45 | Jollof | 4 | 4 |
| 12 | JHS 1 | Walk | 12 | Fufu | 0 | 5 |
| 13 | JHS 3 | Trotro or bus | 60 | Waakye | 3 | 4 |
| 14 | JHS 2 | Walk | 18 | Banku | 2 | 5 |
| 15 | JHS 1 | Taxi | 30 | Jollof | 7 | 3 |
| 16 | JHS 3 | Walk | 8 | Kenkey | 1 | 4 |
| 17 | JHS 2 | Bicycle | 22 | Waakye | 2 | 5 |
| 18 | JHS 1 | Walk | 14 | Jollof | 4 | 4 |
| 19 | JHS 3 | Trotro or bus | 50 | Fufu | 3 | 2 |
| 20 | JHS 2 | Walk | 16 | Waakye | 5 | 5 |

## Running order
| Time | Activity | Workbook | What the mentor does |
|---|---|---|---|
| 0–10 min | Typing warm-up | – | Pupils open the typing trainer and do their 10-minute warm-up. |
| 10–17 min | Morning assembly | Page 1 | Act out the four commands with 6 volunteers: line up by height (sort), only those wearing a watch step forward (filter), hands up if you walked (COUNTIF), "if your birthday is in the first half of the year go left" (IF). |
| 17–30 min | Freeze and sort | Page 2 | On the projector, make the classic mistake on purpose: select only column D and choose "Continue with the current selection". Ask "Does Ama really walk for 55 minutes?" Ctrl + Z, then do it properly. |
| 30–40 min | Filter and COUNTIF | Page 3 | Filter Travel live; point at the blue row numbers. Build `=COUNTIF(C2:C21,"Walk")` piece by piece. Pupils do Be the Computer. |
| 40–50 min | IF, highlights, findings | Page 4 | Teach IF with the Pass / Try again example and the four Your turn boxes. Show conditional formatting. Read the good and bad findings together. |
| 50–57 min | Data Sorter 3D lab | Page 5 | Demonstrate the first mission, then pairs continue. |
| 57–78 min | Lab Mission: our class in numbers | Page 5 | Circulate. Check rows are still intact after sorting, the empty column I, and that the chart uses J1:K6. |
| 78–84 min | Data Detective race and findings | Page 5 | Teams race to answer questions from the data (see below). Then each team reads its best finding; the class votes for the clearest (2 points). |
| 84–88 min | Review questions | Page 6 | Pupils answer alone, then check with a partner. |
| 88–90 min | Self-assessment and sign-off | Page 6 | Sign off pupils who meet the evidence below. |

**Data Detective race** (sample data; 1 team point per correct answer, 2 for the first team to answer): Which food does the pupil with the longest journey like? (Waakye.) How many JHS 2 pupils walk? (4.) How many pupils enjoy Tech Club 5 out of 5? (8, with `=COUNTIF(G2:G21,5)`.) What is the shortest journey? (5 minutes.) How many pupils chose jollof? (7.)

## Key ideas and how to explain them
- **Data:** one row = one person; one column = one question; row 1 = the header row.
- **Morning assembly:** sort = line up in order; filter = only some step forward, the rest are still there; COUNTIF = hands up and count; IF = go left or right depending on a rule.
- **Freeze the header row:** so you never lose track of which column is which while scrolling.
- **The classic sort mistake:** sorting one column on its own breaks every row, and the data becomes wrong without any error message. Click one cell, then sort; if Excel shows a Sort Warning, choose Expand the selection. Ctrl + Z at once if it goes wrong.
- **Filter hides, never deletes:** blue row numbers and missing row numbers are the clue. Data → Clear (Excel) brings them back.
- **COUNTIF(where, what):** the range (leave out the header) and the rule in quotation marks for words. Spelling must match the cells exactly; capital letters don't matter. Excel's COUNTIF also counts rows hidden by a filter.
- **IF(test, if true, if false):** the teacher marking: 50 or more → Pass, otherwise Try again. `>=` means "greater than or equal to", so 50 passes.
- **Conditional formatting:** a highlighter that reads the numbers and updates itself.
- **Chart from the summary, not the raw rows:** a column chart of five counts is clear; a chart of 20 raw rows is noise. Title says what it shows (Session 20's rules still apply).
- **A finding:** one sentence, one fact, one number. "Half of our class (10 of 20) walk" is a finding; "pupils love walking" is a guess.
- **Excel vs Google Sheets vs LibreOffice:** the formulas are identical. The menus differ: freeze (View → Freeze Panes / View → Freeze / View → Freeze Cells), sort (Data → Sort Largest to Smallest / Data → Sort sheet / Data → Sort Descending), filter (Data → Filter / Data → Create a filter / Data → AutoFilter), conditional formatting (Home → Conditional Formatting / Format → Conditional formatting / Format → Conditional). In Google Sheets, freeze row 1 before "Sort sheet", or the header is sorted with the data.

## The 3D lab
**Data Sorter** lets pupils sort and filter a table of survey answers and use IF to label each row, while 3D columns rearrange themselves. On the projector, demonstrate the sorting mission and ask the class to predict which column will end up first. Pairs then do the filter and IF missions. Point out that the 3D columns move as whole rows, which is exactly what must happen in a real sheet, and link the IF mission to step 3 of the lab (Long trip / Short trip).

## Common mistakes and quick fixes
| Pupils often… | Try this |
|---|---|
| Select the whole column and sort only that column | Ctrl + Z straight away. Click one cell, then sort; choose Expand the selection. If they saved the broken file, give them a fresh copy from USB. |
| Sort the header row into the data (Google Sheets) | Ctrl + Z, freeze row 1 (View → Freeze → 1 row), then sort again. |
| Think filtered rows are deleted | Point at the blue row numbers and the funnel icon on the arrow; Data → Clear. |
| Type `=COUNTIF(C2:C21,Walk)` without quotation marks | Words need "quotation marks". Show the `#NAME?` (Excel) or `0` result and fix it. |
| Get 0 from COUNTIF | Check the spelling and spaces: "Trotro or bus" must match the cells exactly. |
| Type `=IF(D2>=30,Long trip,Short trip)` | Both text answers need quotation marks. |
| Put the summary right next to the data | Leave column I empty, so sorting and filtering don't grab the summary. |
| Make a chart of all 20 rows | Delete it; select J1:K6 only and insert again. |

## When things go wrong
- **No internet:** nothing needs the internet if `Class_Survey.xlsx` is already on each PC; Google Sheets pupils move to Excel or LibreOffice. Run the 3D lab from the offline pack.
- **Not enough PCs:** pairs, swapping the mouse at each step; the partner reads the step aloud and checks "do the rows still make sense?" after every sort.
- **A PC freezes or the power goes:** Ctrl + S after each step. If the file is lost, give a fresh copy from USB and jump to step 3 (the IF column): sorting and filtering can be shown on the projector.

## Answer key
**Be the Computer (Page 3):** `=COUNTIF(E2:E7,"Jollof")` → **3**; `=COUNTIF(E2:E7,"Waakye")` → **2**; `=COUNTIF(E2:E7,"Kenkey")` → **0**.

**Your turn: IF (Page 4):** 72 → **Pass**; 50 → **Pass** (50 is "greater than or equal to" 50); 49 → **Try again**; 35 → **Try again**.

**Lab results (Page 5), sample data set** (class data will differ):
- Sorted by Minutes, largest to smallest, the top row is No. 13: **JHS 3, Trotro or bus, 60 minutes, Waakye**. The bottom row is No. 8 (5 minutes).
- Filter Travel = Trotro or bus: **5 rows** (No. 2, 6, 11, 13, 19), with 40, 55, 45, 60 and 50 minutes.
- COUNTIF: Walk **10**, Trotro or bus **5**, Taxi **2**, Bicycle **2**, Car **1** (total 20).
- Long trips (30 minutes or more): **8**; short trips 12.
- Screen hours greater than 4: **4 cells** glow (5, 6, 7 and 5).
- Good findings, for example: "Half of our class (10 of 20) walk to school." "Every pupil who comes by trotro or bus takes 40 minutes or more." "Jollof is the most popular food (7 of 20), then waakye (5)." "The average screen time yesterday was 3 hours." "8 of 20 pupils enjoy Tech Club 5 out of 5."

**What Should You Do? (Page 6)**
- A: Click one cell in column D, then Data → Sort, so whole rows move together.
- B: They are only hidden; clearing the filter brings them back.
- C: `=COUNTIF(E2:E21,"Waakye")`
- D: "7 of the 20 pupils chose jollof, more than any other food."

**Written Review Questions**
1. `=IF(F2>4,"Too much","OK")`
2. So the spreadsheet treats the summary as a separate table: when you sort or filter the data, the summary is not mixed in or hidden with it.

## Support and stretch
- **Needs more support:** do steps 1, 2 and 4 only (sort, filter, COUNTIF for Walk and Trotro or bus). Let them say each formula aloud ("count, in C2 through to C21, the word Walk") before typing.
- **Finished early:** make a food summary table (J10:K16) with COUNTIF and a pie chart of it. Use `=AVERAGEIF(B2:B21,"JHS 1",D2:D21)` to compare journey times by class. Add a second rule to conditional formatting (screen hours of 1 or less in green). Use the filter on two columns at once (JHS 2 and Walk).

## Evidence for sign-off
The pupil shows a saved `Class_Survey_YourName` with: the top row frozen; the data sorted with every row still intact; a working IF column H; a COUNTIF summary in J1:K6 (and K8) with the correct counts; screen hours over 4 highlighted; and a titled column chart made from J1:K6. They can show a filter and clear it, and they have written at least two findings that state a fact with a number.

## Safety and wellbeing
The survey was anonymous: keep it that way. Do not add names to the class data, and do not try to work out who gave which answer ("the one who takes 60 minutes must be Yaw"). If a row could identify one pupil (for example the only pupil who comes by car), share totals only and do not read that row aloud. Screen-time results can lead to teasing or worry; keep the tone factual and kind ("a fact about our class, not a judgement of anyone"). Delete the class data from shared PCs at the end of the block.

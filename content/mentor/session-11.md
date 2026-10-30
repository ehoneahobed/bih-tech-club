# Session 11: Functions, Ranges & Visual Charts

> **At a glance:** pupils use ranges and the Core 4 functions to total a whole column, then turn their stationery data into a correctly selected column chart. · **Time:** 90 minutes (adjust the timings if your period is shorter) · **Workbook pages:** 6

## Learning outcomes
By the end of the session, pupils can:
1. Write a range using colon notation (for example `D2:D5`) and say that the colon means "through to".
2. Use `=SUM`, `=AVERAGE`, `=MAX` and `=MIN` and explain the difference between a formula and a function.
3. Select the labels and numbers (leaving out the Total row) and insert a column chart with a title.

## Before the session
- [ ] Check that each PC still has `Stationery_Store_Ama.xlsx` in the BIH_Practice folder from Session 10. Keep a spare copy on USB for pupils whose file is missing.
- [ ] Note which spreadsheet each PC has (Excel, LibreOffice Calc or Google Sheets); the chart menus differ slightly.
- [ ] Test the 3D Spreadsheet Charts lab on the projector PC, and have the offline pack on USB.
- [ ] Set cell formatting to two decimal places on your demo file so the average shows as 3.88. Pupils do the same in Step 3 (Home → Number format → 2 decimal places); without it Excel and Calc show 3.875 and 8.

## Running order
| Time | Activity | Workbook | What the mentor does |
|---|---|---|---|
| 0–10 min | Hook: "100 items, 20 minutes of typing" | Page 1 | Recall `=B2*C2` from Session 10. Build `=SUM(D2:D5)` on the board piece by piece. |
| 10–25 min | Formula vs function and the Core 4 | Pages 1–2 | Work through Figure 11.1 with the exam scores. Pupils do Check Your Thinking A–C. |
| 25–35 min | Why charts, and the chart types | Page 3 | Compare column/bar, pie and line charts, then read the stationery stock chart. |
| 35–45 min | 3D lab demo | – | Run the chart lab missions on the projector. |
| 45–50 min | The Total row trap and troubleshooting | Page 4 | Show a wrong selection live so pupils see the giant bar. |
| 50–75 min | Guided lab: totals, stats and chart | Page 5 | Circulate. Check `D6` shows 162.50 and the selection stops at row 5. |
| 75–85 min | Review questions and matching | Page 6 | Pupils work alone, then compare with a partner. |
| 85–90 min | Self-assessment and sign-off | Page 6 | Sign off pupils who meet the evidence below. |

## Key ideas and how to explain them
- **Range and the colon:** the colon means "through to". Say `D2:D5` aloud as "D2 through to D5" every time until pupils say it with you.
- **Formula vs function:** a formula is manual maths you type with symbols; a function is a preset magic word that crunches a whole list.
- **The Core 4:** SUM gives the grand total, AVERAGE the typical (mean) score, MAX the highest, MIN the lowest. Use the 90, 70, 80, 60 exam scores from Figure 11.1.
- **Charts as pictures of numbers:** a headteacher's eyes tire on 500 rows; a chart shows the pattern in one second. Column/bar compares separate items; pie (slices of a cake) shows parts of a 100% whole; line shows change over time, such as rainfall or attendance by month.
- **The Golden Rule of selection:** never include the Grand Total row, or it dwarfs everything else.

## The 3D lab
Use **3D Spreadsheet Charts**. On the projector, demonstrate *Click a column to find out which cell it comes from* (links to cell addresses) and *Change one of the sales numbers in column B* (the SUM changes by itself, just like step 6 of the workbook lab). In pairs, pupils then do *Make a different day the best day* (the gold MAX column) and *Switch to a pie chart*. Ask pairs: "Which chart is better for comparing days? Which for showing the share of the whole week?"

## Common mistakes and quick fixes
| Pupils often… | Try this |
|---|---|
| Forget the `=` and the cell shows the words `SUM(D2:D5)` | Remind them of the Golden Law: every calculation starts with `=`. |
| Type a semicolon or full stop instead of a colon | Point to the colon key (Shift + the ; key) and say "through to". |
| Include row 6 (Total) in the chart | Press Del on the chart, reselect A1 to B5, insert again. |
| Get a blank chart | They highlighted empty cells. Delete it and select the real table. |
| Get bars with no names | They selected only column B. Select from A1 across to B5. |

## When things go wrong
- **No internet:** Excel and LibreOffice Calc work offline. Pupils on Google Sheets can pair with a pupil on an offline PC. Run the 3D lab from the offline pack.
- **Not enough PCs:** pair pupils, swapping the mouse at each step. The partner reads the step aloud and checks the result against the Visual Target.
- **A PC freezes or the power goes:** remind pupils to press Ctrl + S after each step. If the file is lost, give them the spare copy and have them redo steps 2 to 6 quickly.

## Answer key
**Check Your Thinking (Page 2)**
1. A: `=SUM(A1:A4)` = **100**
2. B: `=MAX(A1:A4)` = **40**
3. C: `=AVERAGE(A1:A4)` = **25**

**Match the Function to its Job (Page 6)**
| Item | Correct job |
|---|---|
| `=SUM(B2:B10)` | Adds up all numbers to give a grand total |
| `=AVERAGE(B2:B10)` | Calculates the typical mean score |
| `=MAX(B2:B10)` | Finds the largest / highest value |
| `=MIN(B2:B10)` | Finds the smallest / lowest value |
| `D2:D20` | A range of cells from D2 through to D20 |

**Written Review Questions**
1. The Total is much bigger than any single item, so its bar is huge and makes the other bars look like tiny flat slivers. Look for: "it is not an item" or "it squashes the other bars".
2. "Through to" (every cell from A1 through to A50).
3. A **pie chart**.

**Lab check (Page 5):** Grand Total 162.50; Average Price 3.88 (shows 3.875 if the 2-decimal format step was skipped); Highest 8.00; Lowest 1.50. After changing B2 to 35, the Books bar grows and the Grand Total rises (to 362.50 if D2 is the formula `=B2*C2` from Session 10).

## Support and stretch
- **Needs more support:** have them do only SUM and the chart first. Let them say each range aloud before typing it. Pair them with a confident partner for steps 4 and 5.
- **Finished early:** add a pie chart of the same data and say which chart suits the data better and why. Try `=SUM(B2:B5)` for total quantity, or change several numbers and predict the new MAX before pressing Enter.

## Evidence for sign-off
The pupil shows a saved sheet with working `=SUM`, `=AVERAGE`, `=MAX` and `=MIN` cells (formulas visible when you click the cell), a titled column chart built from A1:B5 without the Total row, and correct answers to Check Your Thinking A–C. They can say what the colon means in their own words.

## Safety and wellbeing
The stationery data is fictional; keep it that way and don't put real names or prices from a real shop on shared PCs. Pupils should ask before deleting or overwriting any file in a shared folder, especially another class's work. Praise careful checking as much as speed: a calm pupil who spots the Total-row mistake is doing exactly the right thing.

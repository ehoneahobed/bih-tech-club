# Session 10: Spreadsheets, Tables & Basic Formulas

> **At a glance:** pupils find any cell by its address, tell text from numbers, write formulas that start with = and use cell addresses, and AutoFill a stationery store table. · **Time:** 90 minutes (adjust the timings if your period is shorter) · **Workbook pages:** 6

## Learning outcomes
By the end of the session, pupils can:
1. Name columns, rows, cells, the active cell, the Name Box and the Formula Bar, and give any cell's address (column letter first, then row number).
2. Tell text (labels, left-aligned) from numbers (values, right-aligned).
3. Write formulas that start with = and use the four operators + - * /, using cell addresses rather than fixed numbers.
4. Copy a formula down a column with the AutoFill handle and fix #####, #NAME? and #VALUE!.

## Before the session
- [ ] Check which spreadsheet each PC has: Excel, LibreOffice Calc or Google Sheets (needs internet).
- [ ] Google Sheets needs a Google account. Pupils under 13 must use a school-managed account (Google Workspace for Education); otherwise use the desktop app. Google Sheets users download the file as .xlsx into BIH_Practice (page 5, step 5).
- [ ] Check Documents > BIH_Practice exists on every PC for saving.
- [ ] Load the 3D Spreadsheet Charts lab on the projector PC and test it.
- [ ] Draw the Rice / Gari / Beans grid from page 2 on the board.

## Running order
| Time | Activity | Workbook | What the mentor does |
|---|---|---|---|
| 0–10 min | The market trader's ledger and the grid | Page 1 | The Makola trader adding up by hand. Point out the Name Box and Formula Bar. |
| 10–20 min | Cell addresses and data types | Page 2 | Click cells; the class calls the address. Type a word and a number and see which side each goes. |
| 20–30 min | The Golden Law and the four operators | Page 3 | Type B2*C2 without = and let it fail. Contrast =10*8 with =B2*C2. |
| 30–40 min | AutoFill and error messages | Page 4 | Demonstrate the thin black cross. Create ##### on purpose and double-click to widen. |
| 40–55 min | 3D Spreadsheet Charts lab | — | Demonstrate, then pairs continue. |
| 55–75 min | Hands-on lab: school stationery store | Page 5 | Check the = in D2, the AutoFill to D5 and the save. |
| 75–85 min | Review and verification | Page 6 | Pupils work alone on paper, then mark together. |
| 85–90 min | Self-assessment and sign-off | Page 6 | Sign off pupils who meet the evidence below. |

## Key ideas and how to explain them
- **The market trader's ledger:** a spreadsheet is a ledger that does its own adding. Change one price and every total updates in less than a millisecond.
- **Cell address:** column letter first, row number second, like C3. Rows run across (horizontal), columns stand up (vertical, like pillars).
- **Text vs numbers:** text labels hug the left so they read naturally; numbers go to the right so units, tens and hundreds sit under each other for easy adding. If a "number" sits on the left, the computer may be treating it as text.
- **The Golden Law:** every formula starts with =. Without it the computer thinks you are typing plain words.
- **Operators:** + and -, then * (Shift + 8) for multiply, never the letter x, and / for divide.
- **Dynamic calculation:** =10*8 is "dead maths" that stays 80 when the price changes; =B2*C2 follows whatever is in the cells.
- **AutoFill handle:** the small square at the bottom-right of the active cell. Drag the thin black cross down and the row numbers update by themselves.

## The 3D lab
Use **3D Spreadsheet Charts**, which shows a canteen sales sheet (Monday to Friday) as 3D columns. On the projector, demonstrate **Click a column to find out which cell it comes from** to reinforce column letter plus row number. Pairs then do **Change one of the sales numbers in column B** and watch the column and the SUM change by themselves; this is dynamic calculation in action. Then **Make a different day the best day** (beat Friday's 90). Leave **Switch to a pie chart** for early finishers; charts are Session 11. The SUM, AVERAGE, MAX and MIN rows are Session 11 too.

## Common mistakes and quick fixes
| Pupils often… | Try this |
|---|---|
| Read the address row first ("3C") | "Letter first, then number", like C3 on the board. |
| Forget the = sign | The cell shows B2*C2 as text. Click it, add = at the start, press Enter. |
| Type x instead of * | Shift + 8 for the asterisk; x is just a letter to the computer. |
| Type the answer (80) instead of a formula | Click D2 and look at the Formula Bar: it should show =B2*C2, not 80. |
| Drag the cell instead of the handle and move it | Ctrl + Z, then hover until the pointer becomes a thin black cross before dragging. |
| See ##### | Double-click the line between the column letters to widen. |
| See #NAME? | A function or name is misspelt, for example =SUMM(B2:B5). Fix the spelling in the Formula Bar. |
| Save in LibreOffice Calc as .ods | Choose the Excel format (.xlsx) in the file type box in Save As, so Session 11 can open the same file. |
| Expect 8.00 but see 8 | Both are fine; the decimal places in the visual target are only display formatting. |

## When things go wrong
- **No internet:** Excel and LibreOffice Calc work offline; move Google Sheets pupils to those PCs. The formula practice on page 6 is on paper anyway.
- **Not enough PCs:** pairs: one calls out the cells and values, the other types; swap for the formula and AutoFill steps.
- **A PC freezes or the power goes:** save early (File > Save As after step 2) and press Ctrl + S often. The table is small enough to retype in five minutes.

## Answer key
**Page 2, Check Your Thinking**
- A. Gari: **B1**.
- B. Cassava: **C2**.

**Page 5 lab, expected line totals:** D2 = 80, D3 = 40, D4 = 20, D5 = 22.50.

**1. Formula Writing Practice**
1. Multiply B3 by C3: **=B3*C3**
2. Add A1 and A2: **=A1+A2**
3. Divide D10 by E10: **=D10/E10**
4. Subtract C5 from B5: **=B5-C5** (not =C5-B5; "subtract C5 from B5" means B5 minus C5).

**2. Written Review Questions**
1. Numbers line up on the right so the units, tens and hundreds sit under each other, which makes them easy to add and compare. Text lines up on the left so it reads naturally, like a book (page 2).
2. They forgot the equals sign. Without = at the start, the spreadsheet treats B2*C2 as plain text and does not calculate.
3. The number is too wide to fit in the column. Fix it by moving the pointer to the line between the column letters (for example between D and E) and double-clicking to widen the column.

## Support and stretch
- **Needs more support:** have the table already typed (from USB) so they only write =B2*C2 and AutoFill. Use the Rice / Gari / Beans grid for extra address practice.
- **Finished early:** add a fifth item in row 6 and AutoFill the formula to D6, change a price and watch the total update, or try the pie chart mission in the 3D lab.

## Evidence for sign-off
The pupil shows the saved Stationery_Store_AmaMensah.xlsx file (with their own name) in BIH_Practice with the four headers and four items, D2 showing =B2*C2 in the Formula Bar, and D3 to D5 filled by AutoFill with the right totals. They give two cell addresses correctly and write all four page 6 formulas with = and the right operator.

## Safety and wellbeing
The stationery data is fictional; pupils should not type real family money, phone numbers or other personal details into spreadsheets on shared PCs. Each pupil saves only their own file and asks before deleting or overwriting anything in BIH_Practice.

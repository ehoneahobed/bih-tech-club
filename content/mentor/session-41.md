# Session 41: Skills Lab 5: Code & AI Challenge

> **At a glance:** a practice-only Skills Lab. Pupils do a 3-minute typing check and four timed stations (a Scratch mini-game from a brief, a one-page website or HTML page, training the sorting robot to 5 out of 5, and fact-checking AI answers with a C.L.E.A.R. prompt rewrite), then fix and re-try. The Code & AI part of the Gold Passport is signed off. · **Time:** 90 minutes (adjust the timings if your period is shorter) · **Workbook pages:** 6

## Learning outcomes
By the end of the session, pupils can:
1. Build a working Scratch game from a written brief, using a loop, an if-then condition and a Score variable, and debug it one change at a time.
2. Build a one-page website in Google Sites, or an HTML page with `<h1>`, `<p>`, `<img>` and `<a>`, that follows the brief and contains no personal details.
3. Train the sorting robot to 5 out of 5 and explain why good training data worked, and fact-check AI answers against trusted sources and rewrite a vague prompt with C.L.E.A.R.

## Before the session
- [ ] **Station 1:** check Scratch on every PC (scratch.mit.edu, or the Scratch app offline). Make sure the *Apple* and *Bowl* sprites are in the library (any similar sprites will do).
- [ ] **Station 2:** decide the route for each PC: **Route A** (Google Sites, needs the internet and learning accounts) or **Route B** (Notepad and a browser, works offline). Put a **MyWebPage** folder on each desktop containing one picture named **robot.jpg** (a picture you may reuse; no faces). For Route A, set up publishing to the Hub as in Session 38.
- [ ] **Station 3:** test the Teach the Robot lab on each PC; keep the offline pack on USB.
- [ ] **Station 4:** put a Science textbook, a Social Studies textbook and, if you have one, a children's encyclopedia at the station. If the PCs have internet, pupils may also use a search engine to find a trusted website.
- [ ] Prepare a class score chart on the board (team names × stations) for team points.

## Running order
| Time | Activity | Workbook | What the mentor does |
|---|---|---|---|
| 0–10 min | Typing warm-up and 3-minute typing check | Page 1 | Pupils do a short warm-up, then the 3-minute check, and record it next to their Silver result. Work out together how far each pupil is from Gold. |
| 10–13 min | How today works | Page 1 | Explain stations, time limits, the honest checklist and team points. "Bugs are clues." |
| 13–38 min | Station 1: Mango Catch Game | Page 2 | Pupils work alone. When a game works, play it! Tick checklists and ask each pupil to show you one bug they fixed. |
| 38–53 min | Station 2: Club Web Page | Page 3 | Check for personal details before anyone publishes. For Route B, check the file ends in `.html`, not `.txt`. |
| 53–63 min | Station 3: Robot Trainer Challenge | Page 4 | Watch the screen at 5 out of 5 before you tick. Read the explanations. |
| 63–78 min | Station 4: AI Fact-Checker | Page 5 | Make sure pupils name a real source for every answer, not "I just knew". |
| 78–86 min | Fix and re-try, typing re-try | Pages 2–6 | Pupils return to unfinished stations with the hints, or take the typing check again. |
| 86–90 min | Score sheet, sign-off and reflection | Page 6 | Fill in the score sheet together; sign off the Code & AI part. Announce the team points winner and play the highest-scoring Mango Catch game on the projector. |

**Rotation for few PCs:** Station 4 is mostly paper and books, so run it as the "home base" table. Half the class does Stations 1 and 2 on PCs while the other half does Station 4 and then Station 3 (which needs only a short time on a PC, or can be done in pairs on one PC); swap after about 35 minutes. Station 3 can also be done on a Hub tablet.

**Team points:** 1 point for each station passed first time, 1 point for each station fixed in the re-try, 1 bonus point for the team with the highest Mango Catch score in the final play-off, and 1 for any pupil who helps a classmate debug by asking questions, not by taking the mouse.

## Key ideas and how to explain them
- **A Skills Lab proves, it doesn't teach:** nothing new today. Every task uses Sessions 36–40.
- **Station 1 (Sessions 36–37):** reading a brief is part of coding. Find the loop (the mango keeps falling), the condition (did the basket catch it?) and the variable (the score). Debug with spot it, trace it, fix one thing. A few blocks were not taught in Sessions 36–37 (`when [key] pressed`, `change x/y by`, `pick random`, `touching`, `y position` and `<`): the "New blocks you may need" box on Page 2 explains each in one line. Point to it before pupils start.
- **Station 2 (Session 38):** a website follows the brief and the safety rules: no names, faces or contact details; only allowed pictures; published to the Hub only. In HTML, tags come in pairs except `<img>`; `href` is where a link goes and `src` is the picture file.
- **Station 3 (Session 39):** AI learns patterns from training data. Varied, correct examples of every kind give good guesses; one-sided or wrong data gives bad ones (garbage in, garbage out).
- **Station 4 (Session 40):** chatbots predict likely words and can be confidently wrong, so check in a trusted source. C.L.E.A.R.: Context, Limits, Examples and details, Ask one clear task, Review.
- **The Gold Passport:** Sessions 36–44, awarded on Demo Day. Today signs off the Code & AI part; the capstone and the 35 wpm at 95% typing target come later.

## The 3D lab
Two labs support today's stations. **Code the Sprite** (snap together motion, loop and pen blocks, run them on an x/y stage, collect litter for points and debug step by step) is a warm-up for Station 1: a pupil stuck on their game can step through the litter-collecting mission in Debug mode and then return to Scratch. **Teach the Robot** (show a recycling robot examples of plastic, paper and cans, then watch it sort things it has never seen) *is* Station 3. Don't demonstrate either to the whole class; point waiting or stuck pupils to them.

## Common mistakes and quick fixes
| Pupils often… | Try this |
|---|---|
| Put the `set [Score] to (0)` block inside the forever loop | "Watch the score: why does it never go above 1?" Trace it, then move the block above `forever`. |
| Make a Score variable but never change it | Find the `if` block: what should happen *inside* it when the basket catches the mango? |
| Write `if` for "touching" the wrong sprite (for example "touching mouse-pointer") | Open the drop-down and choose the basket sprite's name. |
| Mango stuck at the bottom | It missed the basket and Scratch keeps sprites on the stage. Point to the second `if` in the Mango hint: `if <(y position) < (-170)> then go to x: (pick random -200 to 200) y: (170)`. This rule is required. |
| Save the Scratch file as "Untitled" or in the wrong place | File → Save to your computer, and rename with the BIH naming standard. |
| Save the HTML file as `club-page.html.txt` | *Save as type: All files*, and show file name extensions in File Explorer. |
| Teach the robot only one kind of item | Ask "What will it do when it sees a can?" One-sided data. |
| Write "I knew it" as the source | "What would you show a teacher to prove it?" Name the book or website. |
| Write a prompt with no task ("I am a JHS pupil in Ghana") | The A in C.L.E.A.R. is the task: what exactly do you want it to do? |

## When things go wrong
- **No internet:** use the Scratch app, Route B for Station 2, the Teach the Robot lab from the offline pack and books for Station 4. Everything except Route A works offline.
- **Not enough PCs:** use the rotation above. Pairs may share a PC for Station 3 if both explain the result.
- **A PC freezes or the power goes:** Scratch online saves only if signed in, and the offline app saves only when you save, so teach "save every 5 minutes". Add the lost minutes to the pupil's time. If the power is out, do Station 4 and design the Mango Catch code on paper ("Be the computer").
- **A pupil gets stuck and frustrated on Station 1:** let them move on and come back in the re-try. Show them the hint blocks one at a time, not all at once.

## Answer key
**Typing check (Page 1):** record the result. Gold is **35 wpm or more with 95% accuracy or more**, both at once; it is awarded on Demo Day, so today pupils only note how far they have to go.

**Station 1, Mango Catch (Page 2):** a working game in which the green flag sets Score to 0; a `forever` (or `repeat`) loop makes the mango fall with `change y by (-5)`; an `if <touching [Bowl]?> then` block adds 1 to Score and sends the mango back to the top (ideally at a random x); a second `if <(y position) < (-170)> then` block inside the loop sends a missed mango back to the top; the basket starts at `go to x: (0) y: (-140)` when the green flag is clicked, and the right and left arrow keys move it with `change x by`. Saved as **Scratch_MangoCatch_[YourName].sb3**. The bug and fix can be anything real, for example "the score never went up because I chose touching mouse-pointer; I changed it to Bowl".

**Station 2, Club Web Page (Page 3):** a heading *Our Tech Club*; a paragraph of 2–3 correct sentences about the club; robot.jpg (or another allowed picture) showing correctly; a link with the words *Try Scratch* to `https://scratch.mit.edu`; no names, faces or contact details. Route A: checked in phone preview and published to the Hub only. Route B: the four lines from the hint with the pupil's own sentences and alt text, saved as **club-page.html** and opening in a browser.

**Station 3, Robot Trainer Challenge (Page 4):** the lab shows 5 out of 5. Typically at least 2 correctly labelled examples of each kind (6 or more in all). **Why it worked:** the training data had correct labels and enough varied examples of every kind, so the robot could find the pattern for Plastic, Paper and Cans and match new items to the most similar example. **6 Plastic and nothing else:** the robot would call everything Plastic, so it would get paper and cans wrong. That is one-sided data (bias).

**Station 4, AI Fact-Checker (Page 5)**
1. Lake Volta is natural: **Wrong.** It is a **man-made** lake (a reservoir), formed in the 1960s when the **Akosombo Dam** was built on the Volta River.
2. Water boils at 100 °C at sea level: **Right.**
3. Saturn is the largest planet: **Wrong.** **Jupiter** is the largest planet in our Solar System.
4. Ghana became independent on 6 March 1957: **Right.**
5. An adult skeleton has 32 bones: **Wrong.** An adult has about **206 bones**. (Adults usually have 32 *teeth*: a likely mix-up.)
- Sources: a named textbook, an encyclopedia, an official `.gov.gh` website or another trusted site, not "the chatbot" or "I knew it".
- **C.L.E.A.R. prompt**, for example: "I am a JHS 1 pupil in Ghana preparing a 3-minute class presentation (**C**). Use simple English and keep it under 150 words (**L**). Describe 3 popular Ghanaian dishes such as waakye, banku with tilapia and kenkey, saying where each is popular and what it is made from (**E**). Write it as 3 short bullet points I can put on a slide (**A**)." **Review:** "I will check each fact in my Social Studies textbook or with my teacher, and read it to make sure it makes sense." No names, school or other P.I.I.

## Support and stretch
- **Needs more support:** in Station 1, give the Mango sprite's hint stack first and let them build the basket themselves. In Station 2, choose Route A. In Station 4, check two answers together, then let them do the rest.
- **Finished early:** add a `Lives` variable to Mango Catch that goes down when a mango hits the ground, and a "Game over" message when it reaches 0. Add a second page to the website, or `<h2>` and a list (`<ul>`, `<li>`) to the HTML page. Or write their own "5 AI answers" quiz with 2 hidden mistakes for a partner to check.

## Evidence for sign-off
Sign off the **Code & AI part of the Gold Passport** when the pupil has every checklist item ticked by a mentor for all four stations (first time or in the re-try): a working Mango Catch game with a loop, a condition, a Score variable and missed mangoes going back to the top; a web page that meets the brief with no personal details; the robot at 5 out of 5 with a correct explanation; and all five AI answers checked with sources plus a full C.L.E.A.R. prompt. Record today's typing result; the Gold typing target is checked on Demo Day.

## Safety and wellbeing
No real AI chatbot is used today; the "AI answers" are on paper. Pupils use the Hub's learning accounts only, and websites are published to the Hub only, with no names, faces or contact details. The C.L.E.A.R. prompt must contain no personal information. Some pupils find coding under time pressure stressful: praise calm debugging as much as finished games, and remind them that this is practice and the re-try is part of the plan.

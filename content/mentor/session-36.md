# Session 36: Block Programming & Algorithms

> **At a glance:** pupils write, run and save their first Scratch program, an "Akwaaba" greeting cat, and explain why the order of instructions matters. · **Time:** 90 minutes (adjust the timings if your period is shorter) · **Workbook pages:** 6

## Learning outcomes
By the end of the session, pupils can:
1. Explain what an algorithm is and why sequence matters, using the kelewele recipe.
2. Name the main parts of Scratch (Block Palette, Coding Workspace, Stage, Sprites, Green Flag) and the words sprite, backdrop and script.
3. Explain that a script needs an Event hat block (like `when green flag clicked`) before anything happens.
4. Use X (left/right) and Y (up/down) coordinates to describe where a sprite is, and rescue a lost sprite with `go to x: (0) y: (0)`.
5. Build, run and save the Event, Motion, Looks script `Akwaaba_Cat_[Name].sb3`.

## Before the session
- [ ] Check which PCs have Scratch Desktop (offline) and which need `scratch.mit.edu`. Keep the offline installer on USB.
- [ ] Check each PC has `Documents > BIH_Practice` for saving.
- [ ] Test the Code the Sprite 3D lab on the projector PC.
- [ ] Make four kelewele recipe cards (peel, cut, mix spices, fry).
- [ ] Draw an X/Y cross on the board: (0, 0) in the middle, ±240 across, ±180 up and down.

## Running order
| Time | Activity | Workbook | What the mentor does |
|---|---|---|---|
| 0–10 min | Typing warm-up | – | Pupils open the typing trainer (Typing in the menu, or the warm-up banner on the session page) and do the 10-minute warm-up. Walk round checking posture and home-row fingers. |
| 10–20 min | The kelewele recipe: what is an algorithm? | Page 1 | Pupils fix the recipe cards held in the wrong order. Contrast typed code with snap-together blocks. |
| 20–29 min | Tour of the Scratch Studio and vocabulary | Page 2 | Point to each of the five zones on the projector: Block Palette, Code Area (Workspace), Stage, Sprite Pane, Green Flag & Stop. Go through the four vocabulary words. |
| 29–38 min | Block shapes and the Event spark plug | Page 3 | Build a stack with no hat block and press the Green Flag: nothing. Add the hat block: it runs. |
| 38–48 min | The X/Y stage grid and the panic button | Page 4 | Call out "x: 100, y: 0" and pupils point on the board cross. Send a sprite off-screen, then rescue it. |
| 48–56 min | 3D lab: Code the Sprite | – | Demonstrate the first mission on the projector, then pairs try it. |
| 56–80 min | Guided lab: the "Akwaaba" animation | Page 5 | Pairs follow the 6 steps. Check stacks against the Visual Target and check saving. |
| 80–90 min | Review questions and self-assessment | Page 6 | Pupils answer alone, then check together. Sign off. |

## Key ideas and how to explain them
- **Algorithm:** "Computers are as dumb as a stone." The kelewele recipe only works in order: fry before peeling and dinner is ruined.
- **Block-based coding:** blocks are puzzle pieces that refuse to snap together if they don't make sense; no "missing semicolon" crashes.
- **Sprite, backdrop, script, Green Flag:** actor, scenery, stack of instructions, and "GO".
- **No event = no action:** the yellow Event hat block is the spark plug. Ten motion blocks with no hat block will just sit there.
- **X and Y:** like spreadsheet cell coordinates. X is side to side (positive = right), Y is up and down (positive = up).

## The 3D lab
Use **Code the Sprite**. On the projector, demonstrate the mission "Press ▶ Run and watch the sprite draw a square". Ask pupils to read the blocks aloud as the sprite moves: this is "sequence" from the kelewele recipe. Pairs then repeat it. Point out the X/Y grid on the lab floor and link it to Page 4. Save the loop, debug, star and litter missions for Session 37.

## Common mistakes and quick fixes
| Pupils often… | Try this |
|---|---|
| Press the Green Flag and nothing happens | Check that `when green flag clicked` is at the very top and the other blocks are snapped on, not just touching. |
| Drop blocks loosely below the stack | Drag the block until a grey shadow appears under the stack, then let go. |
| Lose the sprite off the edge of the stage | Use the panic button: in the blue Motion palette, type 0 into both white circles of `go to x: () y: ()`, then click the block once. (Scratch keeps a sliver of the sprite at the edge; the palette block is pre-filled with the sprite's current position, so clicking it unchanged does nothing.) |
| Save to Downloads with a random name | Use File, Save to your computer, and name it `Akwaaba_Cat_Ama.sb3` (with their own name) in `BIH_Practice`. |

## When things go wrong
- **No internet:** use the Scratch Desktop app. If a PC has neither the app nor internet, pair that pupil with a working PC. The kelewele cards, the X/Y board game and Page 6 need no computer.
- **Not enough PCs:** pairs, with a driver on the mouse and a navigator reading Page 5; swap after step 3.
- **A PC freezes or the power goes:** unsaved work is lost, so save after step 4 too. Rebuild from the Visual Target; it takes minutes.
- **Mixed Scratch versions:** older PCs may show slightly different colours or menus; tell pupils to look for the words on the block.

## Answer key
**1. Fix the Broken Algorithm Challenge**
- Fill the washing basin with clean water and soap powder: **Step 1**
- Scrub the uniform gently to remove mud and dirt spots: **Step 2**
- Rinse the uniform in clean water to wash out the soap suds: **Step 3**
- Hang the clean uniform on the drying line in the sun: **Step 4**

**Question 1:** An algorithm is a step-by-step list of clear, ordered instructions to accomplish a specific goal. Accept any answer that includes "steps", "in order" and "a goal".

**Question 2:** The program does not start; the sprite sits completely still when the Green Flag is clicked, because there is no event to trigger the script. (Some pupils will notice that clicking the stack itself still runs it in Scratch. That is a good observation, but the workbook answer is "nothing happens".)

**Question 3:** The **Y** coordinate (increase it).

## Support and stretch
- **Needs more support:** build steps 2 and 3 only, press the Green Flag, then add one block at a time.
- **Finished early:** change the greeting, add a second `move` and `say` block, or try `go to x: () y: ()` with numbers from the board grid and predict where the cat will land before clicking.

## Evidence for sign-off
- A saved file `Akwaaba_Cat_[Name].sb3` in `BIH_Practice` that, when the Green Flag is clicked, walks 50 steps, says the greeting for 2 seconds and turns 15 degrees.
- Correct order for the uniform algorithm and a sensible answer to Questions 1 to 3.
- The pupil can point to the five zones and say what X and Y control.

## Safety and wellbeing
On `scratch.mit.edu`, pupils should not create accounts or share projects today; save to the computer only. Greetings must be kind and must not tease classmates by name. Pupils ask before deleting anything on a shared PC.

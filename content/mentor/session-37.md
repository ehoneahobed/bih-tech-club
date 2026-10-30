# Session 37: Loops, Decisions & Debugging

> **At a glance:** pupils build a sachet clean-up mini-game in Scratch that uses a loop, an IF-THEN condition and a Score variable, and they fix bugs calmly one change at a time. · **Time:** 90 minutes (adjust the timings if your period is shorter) · **Workbook pages:** 6

## Learning outcomes
By the end of the session, pupils can:
1. Explain the difference between a counted loop (`repeat (10)`) and an infinite loop (`forever`), using the fufu pounding analogy.
2. Use an `if <> then` block with a diamond-shaped sensing block such as `touching [mouse-pointer]?`.
3. Create a Score variable, reset it with `set [Score] to (0)` and change it with `change [Score] by (1)`.
4. Follow the 3-step debugging protocol: Spot it, Trace it, Fix one thing.
5. Save a working game as `Cleanup_Game_[Name].sb3`.

## Before the session
- [ ] Check Scratch Desktop (offline) on each PC, or internet for `scratch.mit.edu`. Keep the offline installer on USB.
- [ ] Test the Code the Sprite 3D lab on the projector, including the Debug and Next step buttons.
- [ ] Bring a pot and some bottle tops or cowries for the calabash demonstration.
- [ ] Write the Page 6 "Be the Computer" code on the board for the review.

## Running order
| Time | Activity | Workbook | What the mentor does |
|---|---|---|---|
| 0–10 min | Fufu pounding: what is a loop? | Page 1 | Clap "pound, turn". Compare `repeat (10)` and `forever`. |
| 10–20 min | Conditions: the IF-THEN law | Page 2 | "IF it rains, THEN open my umbrella." Show diamond blocks and the sensing table. |
| 20–28 min | Variables: the storage calabash | Page 3 | 5 cowries, add 2, take 3. Link to `set` and `change`. |
| 28–38 min | Debugging and Grace Hopper's moth | Page 4 | Tell the moth story (her team found it in 1947). Bugs are clues; change one thing, then test. |
| 38–53 min | 3D lab: loops and debugging | – | Demonstrate, then pairs do the missions. |
| 53–80 min | Guided lab: Sachet Clean-up Game | Page 5 | Pupils follow the 6 steps. Check stacks against the Visual Target. |
| 80–90 min | "Be the Computer", Spot the Bug, self-assessment | Page 6 | Answer alone, then discuss. Sign off. |

## Key ideas and how to explain them
- **Loop (iteration):** one person repeats the pounding until the fufu is smooth; you don't hire 50 people to strike once each. "Lazy programmers are smart programmers": one `repeat (100)` with `move (1) steps` inside saves 99 blocks.
- **Counted vs forever:** `repeat` runs a set number of times and stops. `forever` keeps going until someone clicks the red Stop.
- **Condition:** a true/false question. If true, the blocks inside the C-mouth run; if false, they are skipped. Diamond blocks fit only diamond holes.
- **Variable:** a named calabash that holds a value that can change. `set` empties it to a starting value; `change` adds or takes away.
- **Bug and debugging:** any mistake is a bug; debugging is calm detective work, one change at a time.

## The 3D lab
Use **Code the Sprite**. On the projector, demonstrate:
1. "Load 'Square — the long way', then 'Square — with a loop'. Which is shorter?" Count the blocks with the class; the loop version does the same job with just 4 Scratch blocks, because `repeat` is one C-shaped block that holds the others.
2. "Load 'Buggy star' and run it in Debug mode, step by step." Press Debug, then Next step repeatedly, and ask pupils to watch the numbers. This is the "Trace it" step.

In pairs, pupils then:
1. "Fix the bug so the sprite draws a 5-pointed star." Let them try to spot it first. The fix is to change the turn from 72 to 144 degrees. Point out that they changed only one number: the debugging law in action.
2. "Change the clean-up route so the sprite collects ALL 7 pieces of litter." They read the x and y of each piece and can add `go to x: y:` blocks. This revisits Session 36 coordinates and links to the clean-up theme of the Page 5 game.

## Common mistakes and quick fixes
| Pupils often… | Try this |
|---|---|
| Put `set [Score] to (0)` inside the forever loop | Score never rises above 1. Move `set` above the loop, straight under the hat block. |
| Sachet flips upside down when it bounces | In the sprite pane, click Direction → Left/Right (step 1). |
| Put the `if` block outside the forever loop | It checks only once at the start. Drag it inside the C-mouth, below `if on edge, bounce`. |
| Can't fit `touching [mouse-pointer]?` into the `if` | Drag it by its left edge into the diamond hole until it highlights. |
| Score shoots up while the pointer rests on the sprite | The `go to [random position v]` block is missing. Add it inside the `if`, straight after `change [Score v] by (1)`, so the sprite jumps away and one touch scores one point. |
| Change lots of blocks when something breaks | Stop them. Spot it, trace it, change one thing, test. |

## When things go wrong
- **No internet:** use Scratch Desktop. The calabash, fufu clapping and Page 6 need no connection; load the 3D lab in advance or use the offline pack.
- **Not enough PCs:** pairs, with a driver and a navigator reading Page 5 aloud; swap roles after step 3.
- **A PC freezes or the power goes:** remind pupils to save after step 3 and again at the end. Browser projects that were not saved are lost; rebuild quickly from the Visual Target on Page 5.
- **Mixed Scratch versions:** colours may differ; look for palette names (Variables, Control, Sensing).

## Answer key
**1. "Be the Computer" Logic Tracing Challenge:** Final Score value = **25** (10 + 5 + 5 + 5 = 25).

**2. Spot the Bug Challenge:** Kwesi forgot **`set [Score] to (0)`**, placed under `when green flag clicked` at the top of his script, so the score resets every new game. Accept "set Score to 0" or "the reset block".

## Support and stretch
- **Needs more support:** build and test steps 1 to 3 before adding the `if` block.
- **Finished early:** add a Timer variable that starts at 60 and goes down by 1 each second, or try `change [Score v] by (10)` for a bigger reward. Always test after each single change.

## Evidence for sign-off
- A saved `Cleanup_Game_[Name].sb3` that resets Score to 0 on the Green Flag, moves and bounces continuously, and, when the pointer touches the sprite, adds 1 to Score, jumps to a random position and says "Cleaned!".
- Correct answers to the two Page 6 challenges.
- The pupil can explain `repeat` vs `forever` and name the 3 debugging steps.

## Safety and wellbeing
No Scratch accounts or online sharing; save to the computer only. Bugs are normal: praise calm detective work and never allow mocking. Ask before deleting files on shared PCs. Keep names and speech bubbles kind and fictional.

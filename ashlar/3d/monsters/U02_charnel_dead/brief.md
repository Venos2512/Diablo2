# U02 Charnel Dead A — Tripo preparation

Concept: `concept.png` (copy of `ashlar/art/map-01-concepts/monsters/U02_charnel_dead/vA/concept_r2b.png`, 1536x1024: row 1 H, 3/4, WEAPON, LEFT, RIGHT; row 2 H, FRONT, BACK). Canon text: `concept_r2b.prompt.txt`; checklist row U02 (Prologue: skeleton of mismatched ossuary bones, a woman's skull on a man's frame, one arm longer, rotted grave-goods as armour; sword and shield; no accent colour).

## Height and proportions (measured on the model views)
- 1H silhouette = 366-368 px. Figure 349-354 px = **0.96 H** (crown line 0.95 H).
- About 7 heads tall, narrow shoulders (0.29 of the height). Arms are long: FRONT span 478 px = 1.35 times the figure height, each arm about 0.55 of the height. The tool's span check (0.80-1.12) will warn: this is the concept's stylization, kept on purpose.
- Canon says the LEFT arm is much longer than the right; the approved model views draw both arms the same length, so the T-pose keeps them equal (only the 3/4 view shows the long left arm through its pose). Flag for the rig/asset owner if the canon asymmetry is wanted later.

## Silhouette
Tall vertical skeleton, one round iron pauldron on the right shoulder, coffin-plank breastplate on the left chest and back, belt and ragged olive-brown skirt to above the knees, sandal wraps.

## Materials and colours
Aged bone ivory #D8CCB0 (primary), rotted dark-brown coffin wood and leather #4A3526 with dull iron #5A5F66 (secondary), olive-brown rag skirt. Prologue: no accent colour.

## Asymmetric details
- Pauldron on the RIGHT shoulder (FRONT image-left, BACK image-right).
- Planks on the LEFT chest (FRONT image-right), whole back behind.
- Diagonal strap: front left shoulder to right ribs; back right shoulder to left waist.
- The concept's LEFT/RIGHT views contradict FRONT/BACK (pauldron on the near shoulder of the view facing image-left): `design.txt` follows FRONT/BACK.

## Parts Tripo cannot build, and what to do
- Thin bones and gaps between ribs: thick plain bone bars, ribs as three or four broad bars (Tripo will likely fill the ribcage partly; acceptable).
- Ragged skirt: few big thick pointed panels.
- Plank ends: a few big ragged ends, no splinters.

## Hand-held items (NOT in the T-pose; separate assets later)
- Short broad sword (long left hand in the 3/4 view).
- Round coffin-lid board shield with iron boss and rim (short right arm in the 3/4 view).

## WRONG IN THE PREVIOUS ATTEMPT (run 1, 2026-10-22; kept in `_rejected/run1/`)
- ARMS TOO SHORT: the accepted run-1 sheet had an arm span of only 1.16 times the figure height (its first attempt 0.93). The concept's FRONT and BACK views draw this skeleton with LONG arms: arm span 1.35 times the figure height, each arm from the shoulder to the fingertips about 0.55 of the height, the upper arm and the forearm each clearly longer than on a normal human. Put these numbers FIRST in both prompts and say that the template's normal "0.44 of the height / span about equals height" rule does NOT apply to this skeleton. Because the arms are long, the figure is SMALL in the image: the total height (skull top to soles) is only about 0.74 of the arm span, about 48 % of the image height, so the long span still fits inside its half of the sheet with margin. The tool WARN "span/height outside 0.80-1.12" is expected here and is not a reason to shorten the arms.
- SIDE VIEWS: the near hands were curled into closed fists. The near hand must be open and flat, palm down, the fingers straight and slightly apart, pointing at the camera.
- Everything else of run 1 passed and stays: pauldron on the creature's RIGHT shoulder, planks on the LEFT chest and the whole back, both straps, belt, skirt lengths, sandal wraps, straight parallel legs, level shoulders.

For T-pose: use the existing design.txt unchanged. Read ashlar/artdirection.md; prepend verbatim STYLE CORE (§3.1), T-POSE RULES (§3.6), CONTENT (§3.8) to each filled skill template and save the full prompts next to the sheets (tpose_front_back.prompt.txt, tpose_sides.prompt.txt, *_retry.prompt.txt). Use built-in image_gen only. Self-QA each image against §11 and the concept. Do not run Tripo or spend credits in the image session.

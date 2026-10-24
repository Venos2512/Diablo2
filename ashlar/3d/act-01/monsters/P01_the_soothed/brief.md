# P01 The Soothed A — Tripo preparation

Concept: `concept.png` (copy of `ashlar/art/act-01/monsters/P01_the_soothed/vA/concept_r2.png`, 2172x724: H, 3/4, LEFT, RIGHT, FRONT, BACK). Canon text: `concept_r2.prompt.txt`; checklist row P01 (sleepwalker in a nightshirt, EYES CLOSED, mouth stitched into a gentle smile; a victim, gentle, not horrifying).

## Height and proportions (measured on the model views)
- 1H silhouette = 482 px. Figure 462-468 px = **0.97 H** (cap top; crown line 0.95 H).
- About 7 heads tall, slim, narrow shoulders (about 0.22 of the height). Arm span in the FRONT view 462 px = 0.99 of the figure height. Gown hem at about 86 % from the top.

## Silhouette
Tall narrow column: long straight nightgown to mid-shin, wide bell sleeves, a slate-blue shawl over the shoulders with a big triangular back point, soft cloth cap, long hair down the back, bare feet.

## Materials and colours
Cream linen #E8E1D0 (gown and cap; primary), faded slate-blue #5F6B7A (shawl; secondary), small poppy-red stitch mark #B3262A on the mouth (accent), brown hair, soft brown mud stains on the hem and shins, pale skin.

## Asymmetric details
- Practically none. The concept tilts the head onto her left shoulder: per the task the T-pose keeps the head LEVEL.
- The concept's side views put the reaching arm forward and the shawl strips much longer behind (to about 85 %) than the BACK view (73 %): `design.txt` VIEWS sets one length (75 %).

## Parts Tripo cannot build, and what to do
- Loose long hair: one thick smooth mass on the back plus two thick locks in front, no strands.
- Thin shawl hanging from the arms (concept FRONT): one thick piece on the shoulders and upper back; the front ends hang beside the chest, not from the arms, so no web between arm and body.
- Wide bell sleeves: thick, their lower edge close under the arm.
- Ragged hem and shawl strips: a few big shallow points.
- Stitch mark: painted only (texture), not geometry.

## Hand-held items
None.

## WRONG IN THE PREVIOUS ATTEMPT (run 1, 2026-10-22; kept in `_rejected/run1/`, run-1 sheet 1 after an arm edit pass)
- ARMS TOO SHORT: the run-1 front/back sheet had an arm span of only 0.87 of the figure height. The concept's FRONT view has an arm span of 0.99 of the height: each arm from the shoulder to the fingertips about 0.40 of the height, the hands reaching clearly beyond the bell sleeves (the forearm shows well out of the sleeve, the hand is a normal adult hand). Put this number first in the front/back prompt: arm span (fingertip to fingertip) EQUAL to the body height. Keep the figure small enough that the span fits inside its half of the sheet.
- ARMS SAGGED 4-5 degrees toward the hands in the first try of run 1: each arm one perfectly horizontal line, the hand at exactly shoulder height.
- SIDE VIEWS: the near hand sat 3-4 % of the height below the front view's shoulder line and its fingers were curled. The near hand points straight at the camera at exactly shoulder height, open and flat.
- Everything else of run 1 passed and stays: level head (not tilted), cap with the knot at the back, the hair mass on the back to about 38 %, the thick shawl (front ends beside the chest to about 50 %, back triangle to about 68-75 % in every view, not bridging arms and body), the gown with the hem at 84-88 %, mud stains, bare feet, straight legs.

For T-pose: use the existing design.txt unchanged. Read ashlar/art-direction/artdirection.md; prepend verbatim STYLE CORE (§3.1), T-POSE RULES (§3.6), CONTENT (§3.8) to each filled skill template and save the full prompts next to the sheets (tpose_front_back.prompt.txt, tpose_sides.prompt.txt, *_retry.prompt.txt). Use built-in image_gen only. Self-QA each image against §11 and the concept. Do not run Tripo or spend credits in the image session.

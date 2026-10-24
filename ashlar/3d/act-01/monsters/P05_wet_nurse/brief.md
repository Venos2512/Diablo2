# P05 Wet-Nurse, variant B: Tripo preparation (Phase A, 2026-10-22)

Concept: `concept.png` (copy of `ashlar/art/act-01/monsters/P05_wet_nurse/vB/concept_r2.png`, 1536x1024, approved in
group `ashlar-chot`; row 1 H, 3/4, PROP, LEFT, RIGHT; row 2 H, FRONT, BACK). Canon text: `concept_r2.prompt.txt`.
Canon: Act I Garden of Hush / Cradle. A bloated hospice corpse in a stained apron carrying linen bundles; set down, the
bundles crawl (Swaddlings: linen and bone). Production rule: every bundle reads as a tied linen roll with bone stubs, NEVER as
an infant (no face, no head bump, no limbs). Adult corpse, fully clothed, no gore.

## Size and proportions (measured on the sheet)
- H silhouette 348-357 px; figure (bone-stub tips to soles) 350-363 px = about 1.02 H (prompt: crown 1.04 H).
- Bulky, hunched old woman: very broad shoulders under the shawl (about 0.6 of the figure height), long gaunt arms
  (each about 0.37 of the figure height) so the T-pose span is about 1.4 x the figure height (concept FRONT).
- Concept FRONT arms sag (shoulder about 20 %, hands about 25 %) and the feet stand wide; the T-pose straightens both.

## Silhouette and parts
- Head: an olive hooded shawl over the head and shoulders (one broad shape with big jagged points at its hem); the face is
  wrapped in linen strips with one dark eye slit.
- Back-worn (STAYS): two fat linen bundles side by side on the upper back, tilted outward in a V, each tied at its top end
  with a poppy-red ribbon knot and two short crossed bone stubs; one broad linen sling cradles both from below and its ends
  go over the shoulders and cross on the chest.
- Long olive-grey dress #5B6248 in ragged tiers to the ankles, elbow-length ragged linen sleeves, gaunt bare forearms and
  long bony hands, a wide linen apron #E8E1D0 with a few large soft brown stains and one grey-mauve square patch, wrapped
  cloth shoes. Accent: poppy-red ribbons #B3262A on the bundles.

## Asymmetry
- Apron patch on the creature's RIGHT hip (FRONT image-left). The concept also paints a patch in its LEFT side view; the
  design keeps one patch only (FRONT is the clearest view), so the LEFT view shows no patch.

## Parts Tripo cannot build, and the fix
- Long red ribbon ends dangling from the bundles: short ribbon ends lying flat on the bundles.
- Ragged shawl, sleeves and dress tiers: thick cloth with a few big clean jagged points, no fringe.
- Gaps between bundles, sling and back: bundles rest on the back and touch each other and the hood; no air gaps.

## Hand-held items (built separately)
- The single linen bundle on its knotted cloth carried in the left hand (PROP panel): REMOVE from the T-pose; separate prop
  asset `P05_wet_nurse_bundle` later (it is also the Swaddling look).

## WRONG IN THE PREVIOUS ATTEMPT (session 1, 2026-10-22; sheets in `_rejected/*_s1_*`, logs in `_tasks/failed_1/`)
Fix every item below; name them first in both prompts.
1. FRONT/BACK: both arms sloped DOWN from the shoulder to the hand by 7-12 degrees (the shawl sat high on the shoulders and
   the arms left the body below it). Each arm must be ONE PERFECTLY HORIZONTAL straight line from the armpit to the
   fingertips, hand exactly at shoulder height; the shawl lies ON the shoulders and upper arms and follows the horizontal arm.
2. SIDES: the near hand hung about 5 % of the figure height LOWER than the shoulder row, with the fingers curled down. It
   must be a straight arm pointing straight at the camera at shoulder height (the same row as the FRONT hands), the open
   hand flat, palm down, fingers straight; nothing hangs.
3. Proportions drifted from the concept: the body came out narrow and the arms short (arm span about 1.0 x the figure
   height). The concept is BULKY and wide (shoulders with the shawl about 0.6, hips about 0.55 of the figure height) with
   long gaunt arms (span about 1.4 x the figure height; the figure may be about 45 % of the image height so the span fits).
4. Keep from session 1 (it was right): the two bundles side by side in a V on the back with red knots and bone stubs, the
   sling under them, the wrapped face in the olive hood, the patch on the creature's right hip (FRONT image-left, RIGHT view,
   hidden in LEFT and BACK), the ragged olive tiers, the stained apron, empty hands, true BACK.

For T-pose: use the existing design.txt unchanged. Read ashlar/art-direction/artdirection.md; prepend verbatim STYLE CORE (§3.1), T-POSE RULES (§3.6), CONTENT (§3.8) to each filled skill template and save the full prompts next to the sheets (tpose_front_back.prompt.txt, tpose_sides.prompt.txt, *_retry.prompt.txt). Use built-in image_gen only. Self-QA each image against §11 and the concept. Do not run Tripo or spend credits in the image session.

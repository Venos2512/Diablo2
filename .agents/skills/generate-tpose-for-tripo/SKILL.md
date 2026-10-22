---
name: generate-tpose-for-tripo
description: Generate T-pose concept for Tripo. Reads a monster/character concept image and produces four T-pose reference images (front.png, back.png, left.png, right.png) ready to drop into Tripo Studio's multi-view slots. Use for steps 2-3 of art-output/tripo-models/Agent.md (T-pose by Astra, split into four views).
---

# Generate T-pose concept for Tripo

Input: one concept image of a creature/character (usually a lineup: H silhouette + 3/4 + LEFT + RIGHT + FRONT + BACK).
Output, in the asset folder `<ASSET>` (for example `E:\Diablo2\ashlar\3d\monsters\D01_hodling`; ASHLAR models live under `E:\Diablo2\ashlar\3d\`):

| File | What |
| --- | --- |
| `views/front.png` `views/back.png` `views/left.png` `views/right.png` | the four T-pose views, same square canvas, same scale, soles on one pixel row |
| `views/_contact.png` | the four views side by side, for a quick look |
| `views/_guides.png` | HUMANOID only: the four views cropped tight with shared guide lines (head top, shoulder/hand, crotch, knee, soles) |
| `tpose_front_back.png` | sheet 1: left = FRONT, right = BACK |
| `tpose_sides.png` | sheet 2: left = LEFT side, right = RIGHT side |
| `design.txt` | the design notes you wrote from the concept (step 1) |
| `tpose.log` | what you generated, measurements, retries, problems |

`<ASSET>/concept.png` must exist. Tools: `scripts/tpose_tools.py` in this skill folder (`E:\Diablo2\.agents\skills\generate-tpose-for-tripo\scripts\`).
Run Python with `python -I` (it only crops and measures; never draw or edit art with code).

## Hard rules

- Make every bitmap with your BUILT-IN `image_gen` tool, one call per sheet. Never draw with PIL/SVG/canvas/HTML, never use an API key or `scripts/image_gen.py`, never start a nested `codex`. If `image_gen` fails, write the exact error in `tpose.log` and stop.
- Do not redesign the creature. The concept is the identity reference for design, colours, materials, proportions.
- Art direction: `E:\Diablo2\ashlar\artdirection.md` governs every image in this project (style = moderately stylized like Diablo Immortal). The templates here already carry its T-pose rules (§3.6) and content rules (§3.8); keep the concept's style, never restyle it.
- At most 2 generations per sheet (1 + one retry). Keep rejected images in `<ASSET>/_rejected/` with a suffix; never delete them.
- Generated images land in `<CODEX_HOME>\generated_images\<session>\`; copy the one you accept into `<ASSET>` (a shell copy is fine).

## 0. Humanoid or not

HUMANOID = a human-type biped with shoulders, two arms and two legs that stand under the hips: heroes, NPCs, humanoid monsters (goblin, zombie, skeleton, cultist). Anything else (quadruped, insect, serpent, bird, blob, winged or multi-limbed) is NOT humanoid. Write `HUMANOID: yes|no` first in `design.txt`. When yes, every step below also applies its HUMANOID lines (extra `PROPORTIONS` section, `templates/humanoid.block.md` pasted into the prompts, numeric `humanoid` checks, the `guides` image). When no, skip those lines and read the CREATURE flow at the end of this file: a creature that cannot stand in a T-pose gets a neutral rest pose of its body plan instead (write `FAMILY: Q|A|W|L|F|O` after HUMANOID). Pose blocks exist for family Q (four-legged animal, sample B01, 2026-10-21) and family A (many-legged, DRAFT, pilot W07 Shroud-Spinner, 2026-10-22); a human-type body on all fours (ghoul on hands and feet, person on hands and knees) uses the Q variant `Qh` (DRAFT 2026-10-22, U04 Charnel Ghoul and P04 Hive-Sleeper), because the Q text names paws, a tail and a closed mouth. Family W (winged: bird, moth, winged insect; DRAFT, pilot W02 Gibbet-Crow 2026-10-22, Tripo multi-view built it clean) spreads both wings in one upright display plane. Family O (static object) has a draft that has not been run yet: run it only as a pilot, one asset first. Family L (and F) has no block: stop and report, and never feed it to the T-pose templates.

## 1. Read the concept, write `design.txt`

If `<ASSET>/design.txt` already exists (written by the orchestrator from the canon), USE IT as is and do not rewrite it; also read `<ASSET>/brief.md` if present. Otherwise open `concept.png` (view it) and write `<ASSET>/design.txt` with the sections below, plain English, short (`HUMANOID:` / `FAMILY:` lines first; see step 0):

```text
DESIGN: <one paragraph: species, size, build, head/face, horns/hat, clothing, sack/armour/props worn on the body, skin/material, the 3-4 key colours with hex if known, which large cracks/marks exist and where. No glow.>
ASYMMETRY: <every detail that sits on ONE side of the body (which hand holds what, which shoulder has the strap/pauldron, hat tilted to which side, crack position, scar), stated as the creature's own left/right, and where it must appear in the FRONT, BACK, LEFT and RIGHT views>
REMOVE: <hand-held weapons and loose props to leave out of the T-pose (they are built separately); say "nothing" if there are none>
PROPORTIONS (HUMANOID only): <the concept's own numbers, read off its FRONT view, as one sentence: total height in head heights (for example "about 7 heads tall"), shoulder width in heads, arm length shoulder-to-fingertip as a share of height (a normal figure: about 0.44, so arm span about equals height), leg type (plantigrade human, digitigrade, hoofed, bird-like: it stays exactly as in the concept) and leg length (human: crotch at about 0.5 of height, knee about 0.27), neck length, hand size, and what hides the legs (long skirt, robe, coat, armour skirt). Stylized proportions (big head, short legs, long arms) stay as drawn; write them down so the T-pose keeps them.>
VIEWS (required for creatures, recommended for humanoids with a cape, hood, backpack, sash, belt or chain): <the landmark table of step 4b in words: for every feature that wraps around the body or can be hidden (collar, belt, chain, strap, cape, hood, tail, ears, patches, marks), its height band in % of the figure height (0 % = highest point, 100 % = soles) and what hides it in which view. Measure it on the side views; the side views are the 3D truth.>
```

Rules: describe BODY BUILD and POSTURE of the concept exactly (lean vs stocky, thin vs muscular, hunched vs upright, proportions of head, arms and legs) and keep the concept's surface treatment: if the concept is smooth, painted and low-detail, say so; never invent anatomy the concept does not show (muscle definition, abs, veins, claws, extra ears, teeth). If the concept's identity is a material (clay, stone, bone), say it in DESIGN. Look at how the concept's LEFT and RIGHT views differ before writing ASYMMETRY. Loose cloth strips, dangling cords, floating or glowing parts: replace by one thick simple shape hugging the body (Tripo cannot build thin loose parts). Parts that belong to the body (a backpack/sack, a hat, horns) stay.

## 2. Sheet 1: FRONT + BACK

Attach `concept.png` as the reference and call `image_gen` once with the prompt in `templates/front_back.prompt.md` (fill `{{DESIGN}}`, `{{ASYMMETRY}}`, `{{REMOVE}}` from `design.txt`; the `{{IF_RETRY: ...}}` sentence only on a retry, with the rejected image attached). `{{HUMANOID}}` = the "For front_back.prompt.md" section of `templates/humanoid.block.md` with `{{PROPORTIONS}}` filled from `design.txt` when HUMANOID is yes, otherwise delete the line. Copy the result to `<ASSET>/tpose_front_back.png`.

### QA of sheet 1 (view the image; every line must pass)

1. TWO full figures, FRONT left, BACK right (the back is the true back, not a mirrored front), nothing cropped (arm tips included), clean flat grey background, no text.
2. STRICT T-POSE: both arms fully straight, horizontal, at shoulder height, forming one straight line with the shoulders; palms down; arms clearly separated from torso, sack and head. Arms hanging down, bent, raised, or a relaxed "A" = FAIL.
3. Torso nearly upright (a slight lean is fine; hunched or crouched = FAIL), legs apart, both feet flat on the floor, head level.
4. Same size and same floor line in both views; asymmetric details on the right sides (see ASYMMETRY); no hand-held props.
5. DESIGN FIDELITY (compare side by side with `concept.png`; every line must pass): same body build (lean/thin stays lean/thin, no added muscle, abs or six-pack), same head and face type, same ears, same hat/horns/armour and body-worn parts, same material and surface (smooth painted clay does not become "rocky" or "scaly"), same colours, the same light-and-shadow volume as the concept (big folds keep large dark shadow planes in the recesses, under capes, hoods and sashes and inside splits; cloth painted as one evenly lit flat colour with only thin fold lines = FAIL), nothing added that the concept does not show (claws, teeth, belts, jewellery), nothing from the concept missing except the REMOVE items. The only allowed change from the concept is the pose (T-pose instead of hunched/crouched). Any difference = FAIL.
6. `python -I scripts\tpose_tools.py measure <ASSET>\tpose_front_back.png`: no WARNING (figure at least 12 px from every edge). If an arm tip touches the edge, retry asking for a smaller figure (about 45 % of the image height).
7. HUMANOID only, look at the image for every line (the shoulder line is judged by eye as well as by the tool):
   - SHOULDERS: both at the same height, one straight line with the arms; no shrug, no sloped or drooping shoulder; a pauldron or mantle on one side does not lift or drop that shoulder; the arms leave the body at shoulder height.
   - ARMS: each arm one straight horizontal line, hand at shoulder height (not sagging, not rising); elbows and wrists straight; the two arms equal in length and height; arm length and arm span match PROPORTIONS (normal: span about equals height; not stubby, not spidery); hands open and flat, palms down.
   - LEGS: both identical, no contrapposto, no hip tilt, no stepping or crossed leg, feet flat, parallel, pointing forward, about one shoulder width apart (not a wide stance); human legs straight from hip to ankle with straight knees, digitigrade or hoofed legs exactly as in the concept (hock bend kept, never turned into human legs); skirt or slit hangs straight and symmetric.
   - Same head size, shoulder height, hip height and floor line in the FRONT and the BACK; the BACK shows the same pose.
   - `python -I scripts\tpose_tools.py humanoid <ASSET>\tpose_front_back.png --kind fb`: no WARN line (arms within 4 degrees of horizontal, hand at 13-28 % from the top, span/height 0.80-1.12, feet centres at most 0.22 H apart, front and back alike). A WARN means retry or a logged reason; the tool is a heuristic, a clean result does not replace looking.

Fail: one retry with the failure named first in the prompt ("The previous attempt had X; fix X"). Still failing: keep the best one, log it, and report it as the problem.

## 3. Sheet 2: LEFT + RIGHT

Run `measure` on sheet 1 and note its figure height as a percent of the image height (`FIG_PCT`). Attach `concept.png` and the accepted `tpose_front_back.png`, call `image_gen` once with `templates/sides.prompt.md` (same fills, plus `{{FIG_PCT}}`; `{{HUMANOID}}` = the "For sides.prompt.md" section of `templates/humanoid.block.md` when HUMANOID is yes, otherwise delete the line). Copy the result to `<ASSET>/tpose_sides.png`.

### QA of sheet 2

1. TWO full figures: LEFT side toward the camera, facing screen-left; RIGHT side toward the camera, facing screen-right (the true opposite side, not a mirrored copy). Exactly 90 degrees, no 3/4.
2. Same T-pose as sheet 1 seen from the side: the near arm points straight at the camera (foreshortened, hand at shoulder height), the far arm is hidden. Arms hanging or drawn along the body = FAIL.
3. Same design, proportions (leg length vs body, head size, sack size), surface treatment and asymmetric details as sheet 1 (and the same fidelity checks vs the concept as sheet 1 item 5).
4. `measure` the sheet and compare its figure height with sheet 1. The generator often draws the sides larger. Within +-12 % is fine (the split step rescales it). Beyond that, or if leg length / body proportions clearly differ from sheet 1, retry once with the numbers in the prompt; if still off, accept and log it. Never rescale only part of a figure.
5. HUMANOID only (look at the image for every line):
   - Standing straight: spine and legs vertical, both legs identical (human legs: knees straight; digitigrade or hoofed legs as in the concept), both legs side by side so one hides the other and the feet overlap; no stride, no step, no bent knee, no lifted heel, no hip tilt, no forward lean, no open slit from a stepping leg.
   - Shoulder line at the same height as in sheet 1 (same head-to-shoulder and shoulder-to-floor distances); near arm straight at the camera at shoulder height, foreshortened, hand open and flat (not hanging, not bent, not angled, not along the torso).
   - Same head size, hip height, knee height, leg length, neck length as sheet 1; legs not lengthened, head not shrunk.
   - `python -I scripts\tpose_tools.py humanoid <ASSET>\tpose_sides.png --kind sides`: no WARN line (soles span at most 0.26 H).

## 4. Split into four views

```text
python -I E:\Diablo2\.agents\skills\generate-tpose-for-tripo\scripts\tpose_tools.py split <ASSET>
```

This cuts each sheet in two at the empty column between the figures, rescales the sides sheet to the front/back sheet's figure height, and writes `views/front.png`, `back.png`, `left.png`, `right.png` (1024x1024, soles on the same row, 7 % margin) and `views/_contact.png`. View `_contact.png` and check: order is front, back, left, right; all four same size; feet on one line; nothing cut. HUMANOID only: also run `python -I scripts\tpose_tools.py guides <ASSET>` and VIEW `views/_guides.png`: the same lines run across all four views (head top, hand/shoulder row from the front view in red, 50 % crotch in yellow, 27 % knee in green, soles) with a white centre line per figure. Check that the arms of FRONT and BACK lie on the red line and the near hand of LEFT and RIGHT sits on it; the shoulders are level; the head top and the soles sit on the same lines in all four views; the crotch and knees fall near their lines (or where PROPORTIONS says); the legs are straight, symmetric about the white line in FRONT and BACK, and overlap in LEFT and RIGHT. A view that breaks any of these goes back to the sheet it came from (retry rules above). `left.png` shows the creature's LEFT side (face toward screen-left); `right.png` its RIGHT side (face toward screen-right).

## 4b. Cross-view check (mandatory; humanoid and creature)

Every sheet is QA'd on its own, so errors BETWEEN views slip through. B01 (2026-10-21): the user found the iron collar in the BACK view lying across the top of the back, although in the side views the shoulder hump (the highest point of the animal) stands directly behind the collar and is nearer the camera from behind, so from behind it must hide the collar. The BACK tail also hung to 88 % of the figure height while the side views end it at 70 %. Do this check after the split and again after every retry, before reporting:
1. Landmark table BEFORE generating: put it into `design.txt` as `VIEWS:` (see step 1), measured on the concept's side views or, once accepted, on the side sheet. One row per feature that wraps around the body or can be hidden (collar, belt, chain, strap, sash, cape, hood, tail, ears, patches, marks): height band in % of the figure height (0 % = highest point, 100 % = soles), and what hides it in each view. Wrapping parts and the tail are the usual offenders: what a nearer body mass hides in one view stays hidden in every view that looks from the same side, and a feature on the body axis (collar top, chain end, tail tip, belt) sits at the same % in every view where it shows.
2. After the split run `python -I scripts\tpose_tools.py strip <ASSET> --from-pct 0 --to-pct 60` and `--from-pct 40 --to-pct 100` and VIEW both `views/_strip_*.png`: the same band of the figure cut from FRONT, BACK, LEFT and RIGHT at one scale with a tick every 10 %.
3. Walk the table row by row against the strips: height %, occlusion order, size, number of rivets or segments, colours, which side. The side views decide heights and depth order; FRONT and BACK are checked against them. Any mismatch fails the view that disagrees: retry that sheet with the mismatch named first (`fill_prompt.py --retry`), the VIEWS rows in the prompt, and the side sheet attached as a reference.
4. Write the table with the measured percentages (feature, LEFT, RIGHT, FRONT, BACK, verdict) into `tpose.log`.

## 5. Report

Write `tpose.log` and reply with: the four file paths, the measured heights of both sheets and the rescale factor, retries and why, anything that still deviates (pose, proportions, asymmetry), and the Codex session ids / source paths of the images used. Never say the pose is correct without having viewed the images.

## CREATURE flow (HUMANOID: no, FAMILY: Q, A or W; O drafted)

DRAFT 2026-10-21, first run on B01 Sexton's Dog (`ashlar/3d/monsters/B01_sextons_dog/`); family A (many legs) added 2026-10-22, pilot W07 Shroud-Spinner (`ashlar/3d/monsters/W07_shroud_spinner/`). Tripo documents no pose for creatures, so the neutral stand below is a hypothesis until a Tripo run confirms it (research: `art-output/tripo-models/Agent.md`).

What differs from the T-pose flow:
- `design.txt`: `HUMANOID: no`, `FAMILY: Q`, `DESIGN`, `ASYMMETRY`, `REMOVE`, `PROPORTIONS` (the concept's own numbers: height at the shoulders and body length in H units, head share, leg type, tail).
- Prompts are built ONLY with `scripts/fill_prompt.py`, never by hand: it pastes STYLE CORE (§3.1), T-POSE RULES (§3.6) and CONTENT (§3.8) verbatim from `ashlar/artdirection.md` into `templates/front_back_creature.prompt.md` / `templates/sides_creature.prompt.md` and the pose text of `templates/creature_pose.blocks.md` (`--pose-section "Q front_back"` / `"Q sides"`; family A: `"A front_back"` / `"A sides"`; human-type body on all fours: `"Qh front_back"` / `"Qh sides"`, with the ground contacts, the back carriage and the mouth stated in `design.txt` PROPORTIONS / DESIGN; family W: `"W front_back"` / `"W sides"`; `O` sections are an unrun draft). The two creature templates no longer name a body plan: the POSE section states it.
- Placement templates: `scripts/make_view_template.py` writes a 3:1 flat grey canvas with two lighter size blocks (one per view). They fix the canvas shape, the floor line and the scale, so sheet 1 and sheet 2 come out at one scale. Measure the block sizes from the concept's silhouettes in H units (its H silhouette = 1 H): FRONT/BACK block = width x height of the neutral stand (narrower than a braced stance), side block = nose-to-tail-tip length x height. B01: `--blocks 0.50x0.72 0.50x0.72` for sheet 1 and `--blocks 1.42x0.72 1.42x0.72` for sheet 2 (640 px per H).
- Running Astra: the main agent runs one session per sheet with the batch runner (outside the repo) `python E:\map01-batch\map01_batch.py --jobfile <jobs.json> --jobs <id> --parallel 1`, with `CODEX_HOME=E:\map01-batch\home` and `TEMP`/`TMP` on E: (C: is nearly full). A job is `{id, promptPath, outputPath, referenceImages:[{path}]}`; references in this order: sheet 1 = `concept.png`, `template_fb.png`; sheet 2 = `concept.png`, the accepted `tpose_front_back.png`, `template_sides.png`. Attempts, task text and logs stay in `<ASSET>/_tasks/`; copy the accepted PNGs to `<ASSET>/tpose_front_back.png` and `tpose_sides.png`; rejected ones go to `_rejected/`. `run_session.sh` runs the T-pose flow only.
- Numeric checks: `python -I scripts\tpose_tools.py creature <sheet> --kind fb|sides` (mirror symmetry at least 0.85, at least 2 paw groups, heights within 4 %, widths within 12 %). WARN lines only; they do not replace looking.
- Split with `python -I scripts\tpose_tools.py split <ASSET> --vcenter` (a long low animal fills the width of the square canvas, so `--vcenter` puts the figure in the middle instead of the bottom; all four views keep one common scale and one floor row), then `python -I scripts\tpose_tools.py guides <ASSET> --creature` and view `views/_guides.png` (top, 50 %, soles lines and a centre line per figure).
- Observed on B01 (2026-10-21): sheet 1 passed its own QA on the first try (193 s) but failed the CROSS-VIEW check of step 4b (collar and tail in BACK disagreed with the side views; the user caught it first): three generations, then an edit pass for the tail, with the VIEWS table in the prompt. Sheet 2 failed once (the far legs stepped ahead of the near legs and the RIGHT view mirrored that, so LEFT and RIGHT disagreed about which leg is forward) and passed on the retry with "only TWO legs show, the far legs are completely hidden behind them" in the LEGS text. Do the VIEWS table BEFORE the first generation: it would have saved the extra rounds. The generator ignored the template block height (it drew 87 % of the image height instead of 64 %): harmless, `split` normalises, but do not rely on the blocks for absolute size.
- Observed on W07 (family A, 2026-10-22; sheet 1: 2 generations + 2 effective edits, sheet 2: 2 generations + 1 edit, about 10 min of Astra in total):
  - The concept's model views paint the far legs pale and semi-transparent, and the first sheet copied them as ghost legs. Say in REMOVE that this is a drawing convention. Naming it first in the retry fixed it.
  - Sheet 1 came out from a slightly high camera: the far leg tips end 6 % of the height above the near ones. Neither the retry nor an edit pass moved them, so it is logged.
  - The concept's FRONT and side views disagreed about the head height (eye 53 % against 38 %), and each sheet copied its own concept view. The side views decide (step 4b). Moving the FRONT head up with an edit pass worked in 47 s, and so did rounding the belly outline in 63 s.
  - Side sheet retries trade one leg error for another: the retry hid the far legs but dropped a near leg (3 instead of 4). An edit pass that only REMOVES the far legs from attempt 1 worked (56 s). For a creature with many legs, prefer removal edits to retries.
  - `edit_creature.prompt.md` describes a FRONT/BACK sheet. For a sides edit, say so at the start of the `--retry` text.
  - Astra drew the side views 25 % longer than their block (length/height 1.81 against 1.44); the FRONT/BACK width followed the concept.
  - The `creature` symmetry WARN (0.58 / 0.65) is a false alarm for eight thin legs. Compare the leg-tip positions instead (they mirrored within 16 px).
- Observed on U04 and P04 (Qh, 2026-10-22; each 1 generation per sheet + 1 effective edit, about 5 min of Astra): both sheets passed their own QA first time, and step 4b found one fault in the BACK view each time. On U04 a thin tie band showed at the nape, although in the side views the hump hides it. On P04 the feet stood upright with the toes tucked under, although the side views lay them flat. An edit fixed each one. An edit that names the wrong detail vaguely can do nothing (U04 nape edit 1: 0.2 % of the pixels changed). Naming the colour and the place exactly ("a thin dark-red stripe right below the hood; no red pixels in the right figure") worked. The generator keeps the concept's limb shape (U04 hind legs with a backward-pointing joint) over a different PROPORTIONS wording: write PROPORTIONS from the concept's own limbs. The `creature` symmetry WARN (0.69-0.82) was a false alarm both times: check that the silhouette centre column stays the same at every height.
- Observed on W02 (family W, 2026-10-22; sheet 1: 1 generation + 1 head edit, sheet 2: 2 generations, about 5 min of Astra; Tripo: all 4 variants built both wings solid and symmetric, legs and toes separate):
  - The display that works for an eye-level four-view input: both wings in ONE UPRIGHT plane just behind the shoulders (heraldic eagle / cormorant drying its wings), FRONT = whole underside, BACK = whole upper side. A horizontal flight spread would be edge-on in FRONT and BACK.
  - The first side sheet drew the near wing as a surface sweeping up and back over the body. The retry that worked names the geometry: the wing points AT THE CAMERA and shows END-ON, like the near arm of a T-pose seen from the side, as one narrow upright column over the shoulder from the wing-tip height down to the lowest wing edge, with the head in front and the back, rear and tail visible behind. That text is now in `W sides`.
  - Sheet 1 drew a taller domed head than the side views (head top 18 % against 27 %), and in the side views the nape ruff stands above the low head, so it must hide the head in BACK. An edit pass on sheet 1 fixed both in 58 s.
  - The concept's wingspan bracket measured the half-spread drooping mantle (0.80 H); the fully spread wings of the drawing span about 0.9 H. Measure the wing length on the drawing.
  - The `creature` WARN "one paw group" is a false alarm for a bird: the contact shadow joins the two feet.

CREATURE QA (look at the image; every line must pass; at most 2 generations per sheet as before):
1. Sheet 1: FRONT left and BACK right, one animal each, nothing cropped; the background is flat grey with no placement rectangle, outline or floor line visible; no text.
2. NEUTRAL STAND: all four paws flat on one ground line; front legs vertical and parallel with a visible gap of background, hind legs the same; paws pointing forward; spine level; head straight along the body axis (not turned, tilted or lowered further), mouth closed; tail hanging as one simple shape; no crouch, lunge, braced or lifted leg, no leg crossed. Family A: every leg tip on one ground line, legs in mirror pairs, every visible leg solid (no pale or ghost legs), exactly the near legs in the side views (4 for a spider), the same leg count per side in FRONT and BACK.
3. ORTHOGRAPHIC: no perspective (head not enlarged in FRONT, rump not enlarged in BACK), no view from above.
4. FRONT and BACK have the same height, body width and floor line.
5. Sheet 2: LEFT faces screen-left, RIGHT faces screen-right, exactly 90 degrees, RIGHT is the true opposite side (not a mirror where the design is asymmetric); far legs exactly behind the near legs (no stagger, no stride); same stance, proportions, head, tail and height as sheet 1; belly above the ground.
6. DESIGN FIDELITY as step 2 item 5: same build, head, ears, worn parts, colours and markings as the concept, no added anatomy, form shading kept.
7. CROSS-VIEW CHECK of step 4b: the landmark table (VIEWS) holds in all four views (heights, occlusion order, tail length).
Fail: one retry with the failure named first (`fill_prompt.py --retry "The previous attempt had X; fix X."`, rejected image attached as image 3). Still failing: keep the best, log it, report it.
When ONE detail of an otherwise good sheet is wrong (B01: the BACK tail 10 % too long after two full retries had not moved it), use an EDIT PASS instead of another retry: `fill_prompt.py templates\edit_creature.prompt.md <ASSET> --retry "EDIT: <only this changes> ... Do not change anything else." --out <prompt>`, the accepted sheet as the only reference image, run with the batch runner. It took 39 s and changed the rest of the sheet by 2 grey levels on average. Re-run `creature`, `split`, `strip` and the table of step 4b afterwards, because an edit can still touch other places.

## Lessons already paid for

- A concept lineup drawn hunched/crouched makes the generator keep the hunch in the "T-pose". The prompt must say "arms horizontal at shoulder height, torso nearly upright, NOT hunched" and must say that any attached earlier attempt has the wrong pose.
- Over-long arms make the T wider than the body is tall: ask for a smaller figure rather than letting arm tips touch the edge.
- The sides sheet comes out bigger than the front/back sheet (measured 706 px vs 534 px on D01 Hodling); the split step normalises height. That is the only per-sheet scaling allowed.
- Left to itself the generator turns a lean, scrawny concept creature into a muscular goblin (abs, claws, pointed ears) as soon as the pose is straightened. Keep "thin, lean, smooth, low detail, same build as the concept" in the prompt and fail the sheet on any added anatomy.
- Loincloth fringes and rag strips come out as noisy detail: ask for one plain clean shape.
- "Soft even neutral light" flattens cloth. FL Flagellant (2026-10-20): the crimson habit came out as one evenly lit red with thin fold lines (13-24 % of the cloth darker than L* 18, against 25-38 % in the concept; median L* 30 against 22), and the user rejected it ("mất khối sáng tối vải"). The templates now ask for the concept's hand-painted form shading under a top light that is the same in every view; "low detail" must not turn into "flat".
- Humanoid turnaround, 2026-10-21 (hero with fur mantle and long split skirt): the generator drew the T with arms sagging about 5.5 degrees toward the hands, arms leaving below an uneven shoulder line (one fur pauldron lifted a shoulder), the feet 0.26 H apart in a wide stance, and the side views with one leg stepping forward, a bent knee and the skirt slit open, so FRONT and LEFT/RIGHT did not describe the same skeleton. The user asked for a careful check of shoulders, limb proportions and straight legs in every view. Hence the HUMANOID block, the PROPORTIONS line, the numeric `humanoid` check and the `guides` image. A skirt slit invites a stepping leg: ask for a skirt hanging straight and symmetric. Concept lineups that stand in contrapposto or with a stride make the generator copy it, so the prompt must forbid it explicitly.
- Cross-view errors, B01 2026-10-21: each sheet passed its own QA, yet the collar in BACK lay on top of the shoulder hump (the side views put the hump directly behind it, so it hides the collar from behind) and the BACK tail was 18 % of the height longer than in the side views. Found by the user, not by the checks. Hence step 4b (VIEWS table before generating, `strip` after the split, table in `tpose.log`). The generator copies whatever the concept sheet drew, and a concept sheet is 2D art whose back view need not agree with its side views: never trust the concept for what hides what.
- Tripo's multi-view mode is the cube icon with four slots Front / Left / Right / Back (not the "Batch Images to 3D" icon, which makes one model per image).

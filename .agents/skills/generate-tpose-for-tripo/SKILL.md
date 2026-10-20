---
name: generate-tpose-for-tripo
description: Generate T-pose concept for Tripo. Reads a monster/character concept image and produces four T-pose reference images (front.png, back.png, left.png, right.png) ready to drop into Tripo Studio's multi-view slots. Use for steps 2-3 of art-output/tripo-models/Agent.md (T-pose by Astra, split into four views).
---

# Generate T-pose concept for Tripo

Input: one concept image of a creature/character (usually a lineup: H silhouette + 3/4 + LEFT + RIGHT + FRONT + BACK).
Output, in the asset folder `<ASSET>` (for example `E:\Diablo2\art-output\tripo-models\monsters\D01_hodling`):

| File | What |
| --- | --- |
| `views/front.png` `views/back.png` `views/left.png` `views/right.png` | the four T-pose views, same square canvas, same scale, soles on one pixel row |
| `views/_contact.png` | the four views side by side, for a quick look |
| `tpose_front_back.png` | sheet 1: left = FRONT, right = BACK |
| `tpose_sides.png` | sheet 2: left = LEFT side, right = RIGHT side |
| `design.txt` | the design notes you wrote from the concept (step 1) |
| `tpose.log` | what you generated, measurements, retries, problems |

`<ASSET>/concept.png` must exist. Tools: `scripts/tpose_tools.py` in this skill folder (`E:\Diablo2\.agents\skills\generate-tpose-for-tripo\scripts\`).
Run Python with `python -I` (it only crops and measures; never draw or edit art with code).

## Hard rules

- Make every bitmap with your BUILT-IN `image_gen` tool, one call per sheet. Never draw with PIL/SVG/canvas/HTML, never use an API key or `scripts/image_gen.py`, never start a nested `codex`. If `image_gen` fails, write the exact error in `tpose.log` and stop.
- Do not redesign the creature. The concept is the identity reference for design, colours, materials, proportions.
- At most 2 generations per sheet (1 + one retry). Keep rejected images in `<ASSET>/_rejected/` with a suffix; never delete them.
- Generated images land in `<CODEX_HOME>\generated_images\<session>\`; copy the one you accept into `<ASSET>` (a shell copy is fine).

## 1. Read the concept, write `design.txt`

If `<ASSET>/design.txt` already exists (written by the orchestrator from the canon), USE IT as is and do not rewrite it; also read `<ASSET>/brief.md` if present. Otherwise open `concept.png` (view it) and write `<ASSET>/design.txt` with exactly three sections, plain English, short:

```text
DESIGN: <one paragraph: species, size, build, head/face, horns/hat, clothing, sack/armour/props worn on the body, skin/material, the 3-4 key colours with hex if known, which large cracks/marks exist and where. No glow.>
ASYMMETRY: <every detail that sits on ONE side of the body (which hand holds what, which shoulder has the strap/pauldron, hat tilted to which side, crack position, scar), stated as the creature's own left/right, and where it must appear in the FRONT, BACK, LEFT and RIGHT views>
REMOVE: <hand-held weapons and loose props to leave out of the T-pose (they are built separately); say "nothing" if there are none>
```

Rules: describe BODY BUILD and POSTURE of the concept exactly (lean vs stocky, thin vs muscular, hunched vs upright, proportions of head, arms and legs) and keep the concept's surface treatment: if the concept is smooth, painted and low-detail, say so; never invent anatomy the concept does not show (muscle definition, abs, veins, claws, extra ears, teeth). If the concept's identity is a material (clay, stone, bone), say it in DESIGN. Look at how the concept's LEFT and RIGHT views differ before writing ASYMMETRY. Loose cloth strips, dangling cords, floating or glowing parts: replace by one thick simple shape hugging the body (Tripo cannot build thin loose parts). Parts that belong to the body (a backpack/sack, a hat, horns) stay.

## 2. Sheet 1: FRONT + BACK

Attach `concept.png` as the reference and call `image_gen` once with the prompt in `templates/front_back.prompt.md` (fill `{{DESIGN}}`, `{{ASYMMETRY}}`, `{{REMOVE}}` from `design.txt`; the `{{IF_RETRY: ...}}` sentence only on a retry, with the rejected image attached). Copy the result to `<ASSET>/tpose_front_back.png`.

### QA of sheet 1 (view the image; every line must pass)

1. TWO full figures, FRONT left, BACK right (the back is the true back, not a mirrored front), nothing cropped (arm tips included), clean flat grey background, no text.
2. STRICT T-POSE: both arms fully straight, horizontal, at shoulder height, forming one straight line with the shoulders; palms down; arms clearly separated from torso, sack and head. Arms hanging down, bent, raised, or a relaxed "A" = FAIL.
3. Torso nearly upright (a slight lean is fine; hunched or crouched = FAIL), legs apart, both feet flat on the floor, head level.
4. Same size and same floor line in both views; asymmetric details on the right sides (see ASYMMETRY); no hand-held props.
5. DESIGN FIDELITY (compare side by side with `concept.png`; every line must pass): same body build (lean/thin stays lean/thin, no added muscle, abs or six-pack), same head and face type, same ears, same hat/horns/armour and body-worn parts, same material and surface (smooth painted clay does not become "rocky" or "scaly"), same colours, the same light-and-shadow volume as the concept (big folds keep large dark shadow planes in the recesses, under capes, hoods and sashes and inside splits; cloth painted as one evenly lit flat colour with only thin fold lines = FAIL), nothing added that the concept does not show (claws, teeth, belts, jewellery), nothing from the concept missing except the REMOVE items. The only allowed change from the concept is the pose (T-pose instead of hunched/crouched). Any difference = FAIL.
6. `python -I scripts\tpose_tools.py measure <ASSET>\tpose_front_back.png`: no WARNING (figure at least 12 px from every edge). If an arm tip touches the edge, retry asking for a smaller figure (about 45 % of the image height).

Fail: one retry with the failure named first in the prompt ("The previous attempt had X; fix X"). Still failing: keep the best one, log it, and report it as the problem.

## 3. Sheet 2: LEFT + RIGHT

Run `measure` on sheet 1 and note its figure height as a percent of the image height (`FIG_PCT`). Attach `concept.png` and the accepted `tpose_front_back.png`, call `image_gen` once with `templates/sides.prompt.md` (same fills, plus `{{FIG_PCT}}`). Copy the result to `<ASSET>/tpose_sides.png`.

### QA of sheet 2

1. TWO full figures: LEFT side toward the camera, facing screen-left; RIGHT side toward the camera, facing screen-right (the true opposite side, not a mirrored copy). Exactly 90 degrees, no 3/4.
2. Same T-pose as sheet 1 seen from the side: the near arm points straight at the camera (foreshortened, hand at shoulder height), the far arm is hidden. Arms hanging or drawn along the body = FAIL.
3. Same design, proportions (leg length vs body, head size, sack size), surface treatment and asymmetric details as sheet 1 (and the same fidelity checks vs the concept as sheet 1 item 5).
4. `measure` the sheet and compare its figure height with sheet 1. The generator often draws the sides larger. Within +-12 % is fine (the split step rescales it). Beyond that, or if leg length / body proportions clearly differ from sheet 1, retry once with the numbers in the prompt; if still off, accept and log it. Never rescale only part of a figure.

## 4. Split into four views

```text
python -I E:\Diablo2\.agents\skills\generate-tpose-for-tripo\scripts\tpose_tools.py split <ASSET>
```

This cuts each sheet in two at the empty column between the figures, rescales the sides sheet to the front/back sheet's figure height, and writes `views/front.png`, `back.png`, `left.png`, `right.png` (1024x1024, soles on the same row, 7 % margin) and `views/_contact.png`. View `_contact.png` and check: order is front, back, left, right; all four same size; feet on one line; nothing cut. `left.png` shows the creature's LEFT side (face toward screen-left); `right.png` its RIGHT side (face toward screen-right).

## 5. Report

Write `tpose.log` and reply with: the four file paths, the measured heights of both sheets and the rescale factor, retries and why, anything that still deviates (pose, proportions, asymmetry), and the Codex session ids / source paths of the images used. Never say the pose is correct without having viewed the images.

## Lessons already paid for

- A concept lineup drawn hunched/crouched makes the generator keep the hunch in the "T-pose". The prompt must say "arms horizontal at shoulder height, torso nearly upright, NOT hunched" and must say that any attached earlier attempt has the wrong pose.
- Over-long arms make the T wider than the body is tall: ask for a smaller figure rather than letting arm tips touch the edge.
- The sides sheet comes out bigger than the front/back sheet (measured 706 px vs 534 px on D01 Hodling); the split step normalises height. That is the only per-sheet scaling allowed.
- Left to itself the generator turns a lean, scrawny concept creature into a muscular goblin (abs, claws, pointed ears) as soon as the pose is straightened. Keep "thin, lean, smooth, low detail, same build as the concept" in the prompt and fail the sheet on any added anatomy.
- Loincloth fringes and rag strips come out as noisy detail: ask for one plain clean shape.
- "Soft even neutral light" flattens cloth. FL Flagellant (2026-10-20): the crimson habit came out as one evenly lit red with thin fold lines (13-24 % of the cloth darker than L* 18, against 25-38 % in the concept; median L* 30 against 22), and the user rejected it ("mất khối sáng tối vải"). The templates now ask for the concept's hand-painted form shading under a top light that is the same in every view; "low detail" must not turn into "flat".
- Tripo's multi-view mode is the cube icon with four slots Front / Left / Right / Back (not the "Batch Images to 3D" icon, which makes one model per image).

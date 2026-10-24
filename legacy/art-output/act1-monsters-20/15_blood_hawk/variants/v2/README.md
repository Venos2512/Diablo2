# Redwing Glider — Blood Hawk color reinterpretation

This is an original reinterpretation, not canonical Blizzard art.

## Method and files

Generated once with the enabled built-in `image_gen` tool in this Codex session, using the complete existing `prompt.txt` unchanged and `source-reference-frames.png` as a palette reference. No API/Python fallback, procedural artwork, agents, or extra CLI sessions were used. No retries.

Actual generated source PNG:
`C:/Users/HLC_2021/.codex/generated_images/01a14ad2-1b20-79c3-82ab-0c918ba85369/exec-66e4f642-d33a-4828-94f7-5873b86a6a1f.png`

Copied unchanged to:
`E:/Diablo2/legacy/art-output/act1-monsters-20/15_blood_hawk/variants/v2/concept.png`

Saved file inspected with `view_image`. PNG signature verified as `89 50 4E 47 0D 0A 1A 0A`; dimensions 1672 × 941 pixels (approximately 16:9, not an exact integer 16:9 ratio); size 1,817,991 bytes. The generated source was retained. Parent concept.png and README were not edited.

## Palette evidence

- Original animation: `E:/Diablo2/legacy/bestiary/assets/references/blood-hawk.gif`.
- Inspected reference contact sheet: `E:/Diablo2/legacy/art-output/act1-monsters-20/15_blood_hawk/variants/v2/source-reference-frames.png`. This contains source animation frames, not generated art.
- Metadata: `E:/Diablo2/legacy/bestiary/src/data/images.json`, Blood Hawk entry. Structured parsing confirmed the source and animation URLs:
  - https://classic.battle.net/diablo2exp/monsters/act1-bloodhawk.shtml
  - https://classic.battle.net/images/battle/diablo2exp/images/animations/bestiary/act1/bloodhawk.gif

The small source sprites visibly combine near-black charcoal/umber shadows, muted olive-brown/tan surfaces, rusty ochre-orange body accents, and small pale grey/ivory tips. The new design translates those relationships into russet leather membranes, dark umber supporting forelimbs and dorsal skin, tan/olive folds, ochre throat/joint accents, and ivory hooks. This is a visual palette interpretation of the Blood Hawk reference, not an extracted canonical hex palette or a claim about all family variants.

## Visual QA

Accepted with minor deviations; no clear substantial defect requiring a retry.

- Anatomy: four-limb construction is readable: two elongated membrane-supporting forelimbs and two short hooked rear legs. Both rear feet are visible in the main view. Broad torso, shoulder-nestled blunt tooth-bearing head, low grounded stance, and flattened rudder tail distinguish it from a conventional bird. No feathers, beak, long bird neck, horns, ears, clothing, or equipment observed. Tail has ribbed fin-like folds.
- Layout: one large elevated three-quarter gliding view on the left; smaller front grounded, side grounded, and rear spread studies stacked at right. Views are separated, appendages remain in frame, and there is no text, logo, panel border, scenery, or gore. The main forelimb hook approaches the lower margin but is not clipped.
- Color: clearly rusty red-brown membranes, dark umber structural areas, ochre accents, tan folds, and ivory hooks; sufficient chroma against a dark neutral grey background. No neon or bloom.
- Limitations: the spread silhouette is more triangular than the requested rounded quadrilateral hide sail; membranes have many small tears and more fine surface texture than the requested few large healed tears and low detail. Background shows subtle tonal variation rather than a perfectly flat verified #3A3A3A. Proportions are broadly consistent across views, but these are generated concept studies rather than exact measured orthographics. Human-relative height is not verifiable without a scale reference. Aspect ratio is approximate as recorded above.

## Exact actual generation prompt

The following is the unchanged content passed as the tool's prompt argument; the reference image was supplied separately as a referenced image path.

```text
Use case: stylized-concept
Create ONE new original dark fantasy creature concept sheet, landscape 16:9. Creature: Redwing Glider, inspired ONLY by the color mood of the original Diablo II Blood Hawk family, not by its anatomy and not by any previous generated hawk.
ANATOMY PRIORITY: a low gliding carrion organism with a flattened broad torso, short blunt tooth-bearing head nestled directly into its shoulders, extremely elongated forelimbs extending sideways and broad continuous SKIN MEMBRANES stretched between forelimbs and flanks. Two short rear legs end in hooked grasping feet, held behind the body during gliding. A short flattened rudder tail. Four limbs total: two elongated forelimbs supporting membranes and two hooked rear feet. No separate bird wings, no conventional raptor chest, no feathers, no long bird neck, no beak, no bat ears, no horns. Broad rounded quadrilateral gliding silhouette like a worn hide sail; muscular leading forearm edges, thick rounded joints, scalloped trailing membrane edges with a few large healed tears. Grounded pose is low and sprawling, locomotion by crouched scrabbling and low gliding. No clothing, falconry rings, jesses or equipment. Body height target 0.5 human H, but sheet focuses on anatomy rather than scale charts.
COLOR PRIORITY: original source reference is E:/Diablo2/legacy/bestiary/assets/references/blood-hawk.gif, identified by E:/Diablo2/legacy/bestiary/src/data/images.json as the Blood Hawk animation from classic.battle.net. Inspected animation shows near-black charcoal/umber wing shadows, muted olive-brown/tan wing surfaces, warm ochre-orange or rusty amber accents around body, and small pale grey/dirty ivory tips. Reinterpret these visible hue/material relationships in skin rather than copying feathers. Broad membranes should be warm russet/red-brown with ochre tan folds, dark umber leading forelimbs and dorsal ridge, muted olive-brown flank skin, small ochre-orange throat and joint accents, dirty ivory hook claws. Keep enough chroma to distinguish rusty membrane surfaces clearly from neutral grey background. Redwing means earthy reddish leather, not neon crimson. Palette is a visual interpretation of the real source GIF, not a claimed exact canonical hex palette. Do not make the entire creature generic desaturated grey or uniform chocolate brown.
LAYOUT: one large elevated game three-quarter view of the creature gliding low, occupying the left two-thirds with membranes fully spread and both hooked rear feet visible. At right, three smaller separated consistent orthographic studies stacked vertically: front grounded with membranes half folded, side grounded, rear with membranes spread. Same anatomy, colors, joints and proportions throughout. All appendages in frame; generous negative space; no overlap between views. Flat dark neutral grey #3A3A3A backdrop, no scenery or scenery props. No lettering, captions, numbers, labels, watermark, logos, frames or panel rules.
STYLE: semi-realistic low-detail game asset concept sheet, broad anatomical forms, matte worn leather-like skin, grouped planar folds and 2-3 readable value masses. Restrained European gothic Act I carrion horror; believable animal construction, no gore. Soft neutral-cool upper-left lighting with modest soft shadows. Upper surfaces clearly visible against background. No bloom, rim lighting, neon, glossy CGI, tiny etched skin pores, exaggerated spikes, cartoon anatomy or copied Blizzard art. Anatomy must be a substantially different creature, not a recolored/re-equipped eagle or vulture.

```

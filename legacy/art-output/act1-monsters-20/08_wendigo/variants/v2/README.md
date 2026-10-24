# Hollow Prowler — V2

## Method and measured output

Generated once using account-authenticated Codex built-in `image_gen` (`image_gen__imagegen`), with `transparent_background: false`. The complete existing prompt.txt was submitted verbatim, without added text. No API key, Python/API fallback, procedural art, agents, new sessions, commits or pushes were used. No retries, cropping, resampling or image alterations were performed. Previous deliverables were left untouched.

Native generated source: `C:/Users/HLC_2021/.codex/generated_images/01a14ad1-ce88-74e1-8b22-f21c52a95b1e/exec-a3255e64-1245-4e03-a6a0-4f9ec3503ffd.png`

Copied actual PNG to `E:/Diablo2/legacy/art-output/act1-monsters-20/08_wendigo/variants/v2/concept.png` without overwrite.

Measured PNG IHDR dimensions: **1672 × 941 pixels**. Actual size: **2,066,014 bytes**. Although the prompt requested 16:9, the native result is approximately 1.7768:1, **not exactly 16:9**: 1672 × 9 = 15048, while 941 × 16 = 15056.

## Source palette evidence

Inspected `E:/Diablo2/legacy/art-output/act1-monsters-20/08_wendigo/variants/v2/source-reference-preview.png` with view_image before generation. This is an enlarged first-frame preview of the ORIGINAL `E:/Diablo2/legacy/bestiary/assets/references/wendigo.gif`, not a generated concept.

Observed hues: dark warm brown fur with earthy brown/taupe highlights, lighter warm taupe/tan face and hands, and near-black brown shadows. These are visual observations, not exact pixel extraction. The HEX values in the prompt are approximate chosen art-direction anchors, not measured canonical source colors. No exact generated HEX match is asserted.

Read `E:/Diablo2/legacy/bestiary/src/data/catalog.js`: Wendigo is in the brutes family. Read metadata for key Wendigo in `E:/Diablo2/legacy/bestiary/src/data/images.json`, without dumping its base64 src field. It maps `assets/references/wendigo.gif` to:

- Sprite URL: https://classic.battle.net/images/battle/diablo2exp/images/animations/bestiary/act1/wendigo.gif
- Source page: https://classic.battle.net/diablo2exp/monsters/act1-wendigo.shtml

These URLs record local metadata provenance; no new web fetch is claimed. The optional cart and bonfire style references were not inspected in this pass or used as palette authority.

## Actual visual QA

Inspected the actual native generated PNG with view_image after generation and verified the saved copy's dimensions and byte size.

- Four-view layout: one dominant three-quarter full-body view at left, with smaller front, side and rear studies on the right. No labels, equipment, borders or scenery. All paws fit. The main view extends past the left half into the center, and its camera appears less steep than the requested approximately 50-degree overhead angle. The studies are not guaranteed mathematical orthographic projections.
- Changed anatomy: relative to the prior upright Ashwood Wendigo described in the task, this creature has an elongated horizontal trunk, small forward animal muzzle, four grounded limbs, high forequarters and low hindquarters. The prior concept was not re-inspected or modified in this pass. No antlers, upright stance or equipment appear.
- Limb count: four limbs read in the main view; paired forelimbs and hindlegs read in front/rear studies. Far limbs overlap in side profile. No obvious extra limb is visible. This is visual review, not topology verification.
- Proportions: very long forelimbs, shorter bent rear legs and tucked underside read clearly. Bone length ratio cannot be reliably measured through fur. Shoulders and forearms are bulkier than the requested narrow build; the head reads canine and body retains some bear-like mass. The trunk is elongated and quadrupedal. Claws are longer and more curved than the requested blunt digging claws.
- Color retention: chocolate/umber fur, warm brown highlights and tan muzzle/paws preserve the original brown-versus-tan relationship. No white/grey fur replacement or blue grading is apparent. The backdrop reads dark neutral grey; exact #3A3A3A is not asserted.
- Cross-view consistency: small head, back ridge, large forepaws, short rear legs, warm palette and absent tail recur. Shoulder breadth, hindleg stance, paw detail and fur contours vary between views; front/rear studies appear more compact. Fur has more fine strands than the requested broad low-detail clumps. Anatomy/proportion reconciliation is needed before modeling; this is not production-ready rig-consistent reference.

## Exact submitted prompt

Complete prompt.txt contents, submitted without additional generation instructions:

```text
Use case: stylized-concept
Create ONE original 16:9 landscape dark fantasy creature concept sheet for HOLLOW PROWLER, a new species drawing ONLY color and fur/skin mood from the original Diablo II Wendigo family reference. This is not canonical monster artwork, not an upright ape, not a re-equipped or recolored version of the previous Ashwood Wendigo.
COLOR PRIORITY: Use the inspected original Wendigo sprite in legacy/bestiary/assets/references/wendigo.gif as color/material reference only. The sprite has dark chocolate and earthy umber-brown fur, muted ochre-brown and warm taupe highlights, and lighter warm stone-tan bare face and extremities against near-black brown shadow masses. Preserve this warm brown fur versus lighter tan skin relationship. Do not substitute ivory fur, generic cold grey, snowy white, blue fur or uniformly desaturated grey. Retain restrained but visible earthy hue and material differences under neutral lighting. Approximate useful color anchors: deep umber #312820, brown fur #4A3C31, worn warm taupe #7B6D63, face/knuckle tan #948263; these are visual art-direction anchors, not claims of exact canonical color extraction. Simplified broad fur clumps with a few broad warm highlights; no fine hair noise.
ANATOMY: Long-bodied furred cave ambush predator with narrow elevated shoulders, small low wedge head, extremely long weight-bearing front limbs and very short bent rear legs. A true prowling quadruped in every view: all four animal limbs support a horizontal elongated torso. Front-limb bones are roughly twice rear-leg length; tall narrow shoulder arch drops into a long low back and compact low pelvis. Elongated thorax and tucked narrow belly produce a clear concave underside. Small head projects forward beneath shoulder crest on a short neck; blunt narrow muzzle with small dark eyes and flattened ears, no gorilla face or human face. Front feet are long splayed gripping animal paws with thick blunt digging claws, not human hands; hindfeet compact. No tail. Anatomically plausible muscle attachments and weight transfer, not skeletal or emaciated. Fur forms a broken rough ridge along upper shoulders and back, sparse short brown fur over barrel flanks, bare warm tan muzzle and toe pads, dark brown belly shadow. Distinct long low body silhouette with high forequarters; not a stocky bear, hyena, upright gorilla, deer or crawling man. Creeps over cave rubble by placing giant forepaws far ahead; no props or cave scenery are shown.
SHEET LAYOUT: ONE large elevated game three-quarter full-body view occupies the left half of the sheet, camera down around 50 degrees, showing the length of torso and unequal limb proportions. Three smaller matching full-body orthographic studies occupy the right half in orderly separate positions: front, true side profile, rear. Side profile must clearly show long horizontal trunk, high narrow shoulders, exceptionally long forelimbs and short hindlegs, with all feet supported on the ground. Exactly the SAME creature anatomy, four-limb count, fur masses, coloration and proportions across all four views. Keep full body, all paws and comfortable margins, no overlaps. No additional monsters, no humans, no equipment, no text, no borders, no palette chips. Anatomy reference sheet, not an action scene.
ART DIRECTION: Semi-realistic low-detail game creature asset, grounded dark fantasy of abandoned European gothic countryside and caves, restrained horror without gore. Broad sculptural planes and 2-3 strong value masses. Material and readable form treatment akin to the project cart turnaround and bonfire references. Soft neutral upper-left lighting preserves the original brown/tan hue relationships; no dramatic blue color grading, rim lights, bloom, glow or shiny wet fur. Flat dark neutral grey #3A3A3A backdrop with soft localized contact shadows only. No scenery or ground diorama.
AVOID: antlers, horns, deer skull, skull mask, pale ivory shoulder mantle, upright ape or humanoid anatomy, human hands, yoke, chain, bindings, armor, weapons, clothes, generic grey palette, all-black unreadable creature, saturated neon, excessive tiny fur texture, cartoon, copied sprites, logos, watermarks, lettering, numbers or labels.

```

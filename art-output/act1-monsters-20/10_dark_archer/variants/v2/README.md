# Sinew Spitter — V2

## Generation and files

Method: Codex CLI built-in image_gen via authorized recovery. The existing T3 session piped cli-task.txt to local `codex exec --enable image_generation`, using account login and the CLI runtime's built-in image_gen. No agents, extra T3 threads, Python image_gen.py, direct API/key fallback, procedural art, or web art. One generation, zero retries. The exact submitted prompt is in prompt.txt. No prior generated Widow Bow Rogue image was used as a palette/design reference for this variant.

Real generated source (retained):
`C:/Users/HLC_2021/.codex/generated_images/01a14ad3-931e-7302-8360-57fec0690547/exec-07db3715-6e63-4986-94d5-6b79f104b34f.png`

Copied unchanged to concept.png in this folder. No prior concept outside this folder was overwritten; no commits or pushes.

## References and metadata

- Original family sprite: `E:/Diablo2/bestiary/assets/references/corrupt-rogue-archer.gif`.
- Inspected faithful frame-0 conversions in this folder: source-archer-frame.png and source-archer-enlarged.png.
- `bestiary/src/data/catalog.js`: Corrupt Rogue Archer, group rogues, role Ranged, base Corrupt Rogue; description describes a corrupted archer turning her torso toward the target, with bow/release consistency notes. The catalog marks its scope as a reference index whose exact spawns by version/difficulty are not audited.
- Parsed relevant entry from `bestiary/src/data/images.json`: key Corrupt Rogue Archer; file `assets/references/corrupt-rogue-archer.gif`; URL `https://classic.battle.net/images/battle/diablo2exp/images/animations/bestiary/act1/corruptrogue-archer.gif`; source `https://classic.battle.net/diablo2exp/monsters/act1-corruptrogue-archer.shtml`. These are local metadata, not newly browsed evidence.
- This identifies the Corrupt Rogue Archer family reference, not a confirmed specific named Dark Archer variant.
- Broad low-detail style only: `E:/Diablo2/art-output/mmo-hub-bloodmoor/assets_2d/asset_01_cart_turnaround.png` and `E:/Diablo2/art-output/mmo-hub-bloodmoor/assets_2d/_refs/ref_v3_bonfire.png`. Inspected using view_image. The latter was located under assets_2d/_refs after the abbreviated path did not resolve.
- Read VARIANTS_V2_BRIEF.md, variant-designs.json, CLI_RECOVERY.md and BRIEF.md. The V2 layout and current user prompt override the older multi-row composition.

## Palette evidence

The existing T3 session sampled non-background original GIF frame-0 pixels with Pillow before invoking the CLI: (173,138,115), (156,113,90), (107,81,66), (33,28,24), (33,24,16), (41,36,24), (99,77,57). These are actual sprite pixel samples, not a complete canonical palette extraction or verified named-variant colors. Frame inspection supports warm tan/brown flesh, near-black brown leather/clothes/hair, and ochre-brown bow wood.

Translated those relationships into tan flanks/limbs, a very dark brown dorsal saddle/head cap, and ochre-brown grown shoulder horn. The generated colors are a family-mood interpretation, not exact pixel reproduction. No burgundy wool design reference was used.

## View order and redesign

Large left: elevated game three-quarter. Right, top to bottom: front, side facing left, rear. All depict the same intended quadrupedal design. The humanoid rogue's upright torso, hands, clothes and carried bow have been replaced by a low wedge torso, long splayed animal forelegs, folded muscular rear legs, short tail, integrated scapular horn arches, and a forward chest launcher with a tan tendon cradle and single horn dart. Its ranged role survives through anatomy rather than equipment.

## Honest visual QA

The actual generated output was displayed, then the saved concept.png was inspected with view_image. Four views are present, without labels, borders, figures, environment or logos. Warm flesh / dark hide / ochre arches are readable. The launcher and dart are visible in the large and front views, and an underside profile appears in the side view. No gore or carried weapons. No obvious extra limbs; front/rear and perspective views have expected overlap/occlusion, so four limbs are not individually countable in every projection. Arch roots appear body-connected.

Deviations: the muzzle is longer and more pointed/reptilian than the requested small blunt recessed split muzzle. The large camera reads shallower than the requested 50–60 degrees; exact elevation cannot be verified from the artwork. Fine hide wrinkles and horn striations exceed the intended broad low-detail finish. The launcher has a rigid tubular appearance despite organic materials, and the cradle uses several thin strands instead of one clearly thick tendon mass. Side-view limb overlap limits count verification. Arch shape/attachment and small proportions vary somewhat among projections; this is concept art, not an exact orthographic model sheet. The background is visually neutral dark grey with soft contact shading, not verified as pixel-uniform #3A3A3A. No retry was used because the core anatomy, palette, and layout were achieved and these deviations are disclosed.

## File verification

- concept.png exists; 2,028,911 bytes.
- Actual PNG signature: 89 50 4E 47 0D 0A 1A 0A.
- IHDR dimensions: 1672 × 941 pixels, approximately 16:9 (not mathematically exact).
- SHA-256: `44987353A1F28ADFAB17718B524E2DF94230C33B4F2C1382027A2A7EE9871F64`.

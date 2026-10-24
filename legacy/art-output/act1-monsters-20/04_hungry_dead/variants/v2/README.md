# Shroud Crawler — v2

Created 2026-10-18 with this Codex runtime's actual built-in image_gen tool (image_gen__imagegen). One generation attempt; no retries, API/key fallback, procedural drawing, agents, or additional sessions. The existing cli-task.txt was retained unchanged. prompt.txt contains the exact prompt string, saved before generation. References were visually inspected; no image-reference arguments were submitted to the generator.

## Delivered image

- Saved PNG: E:/Diablo2/legacy/art-output/act1-monsters-20/04_hungry_dead/variants/v2/concept.png
- Exact generated source: C:/Users/HLC_2021/.codex/generated_images/01a14ad2-0876-78b1-a066-7a9592a80a80/exec-707f2fb7-8bbd-4bed-8c98-2b62a8caf116.png
- Dimensions: 1672 × 940 pixels; approximately 16:9, not mathematically exact. Copied without resizing, cropping or painting.
- Size: 1,917,991 bytes.
- Source and copy SHA-256: F6CD34745D8DB20864D79F7236CDB485163B8B103FDCC33EC7C055036EC13B51
- Views: large elevated three-quarter view on left; right column top front, middle side, bottom rear.

## Palette evidence and disclosure

Palette source inspected with view_image: E:/Diablo2/legacy/bestiary/assets/references/zombie.gif. This is the ORIGINAL Diablo II base Zombie FAMILY sprite, not an exact Hungry Dead variant. Small ochre/tan flesh masses and earthy dark brown/olive shadows support the supplied palette wording, which was kept unchanged. Rusty wine-brown cloth is a harmonizing interpretation, not a claimed extraction of canonical Hungry Dead cloth color.

Metadata was parsed from E:/Diablo2/legacy/bestiary/src/data/images.json without dumping embedded image data. The Zombie entry's file field is assets/references/zombie.gif. Its exact verified metadata URL is https://classic.battle.net/images/battle/diablo2exp/images/animations/bestiary/act1/zombie.gif . Verification here means checked against the parsed local metadata. Independent remote retrieval was unsuccessful: web open rejected image/gif, PowerShell reported a connection error, and curl reported an unavailable proxy. No remote-content comparison is claimed.

An exact separately identified Hungry Dead reference was not found by the parent. Local images.json has Zombie and Corpsefire, but no Hungry Dead entry. This is explicitly a FAMILY PALETTE APPROXIMATION, never a canonical Hungry Dead palette extraction.

Family context checked in E:/Diablo2/legacy/bestiary/src/data/catalog.js: Zombie is an undead melee shambling corpse with slumped shoulders and heavy torso. Production advice favors large decay shapes and a weighted gait. Corpsefire links to Zombie. The file explicitly describes production notes and suggested motions as unverified game clips.

Broad material reference inspected with view_image: E:/Diablo2/legacy/art-output/mmo-hub-bloodmoor/assets_2d/asset_01_cart_turnaround.png. Used for matte material masses and restrained studio presentation only. No previous generated monster was used as a color source. No Torchlight or Titan Quest references were used.

Instructions read:

- C:/Users/HLC_2021/.codex/skills/.system/imagegen/SKILL.md
- E:/Diablo2/legacy/art-output/act1-monsters-20/VARIANTS_V2_BRIEF.md
- E:/Diablo2/legacy/art-output/act1-monsters-20/variant-designs.json (04_hungry_dead)
- E:/Diablo2/legacy/art-output/act1-monsters-20/CLI_RECOVERY.md

## Original anatomical reinterpretation

The upright shambling corpse becomes a continuous long ribbed carrion body close to the ground. Two braced forelimbs pull a tapered, legless rear; a narrow hooded skull leads it. The low silhouette, crawling locomotion and elongated proportions make this a new anatomical design rather than a recolor or equipment swap of Grave Hunger. Existing concepts were not edited.

## Visual QA and remaining defects

The actual generated source and saved concept.png were opened with view_image. Dimensions were read from the PNG header; SHA-256 confirms an identical copy.

Observed: four separated uncropped views in the requested arrangement; two forelimbs and continuous trailing rear with no hindlegs; narrow toothless-looking skull with no prominent fangs or glowing eyes. The side view shows the near forelimb with the far one occluded. Ochre/tan flesh, brown-olive shadows and rusty burgundy cloth remain distinct. No text, logos, borders, weapons, armor, environmental props or open gore cavity were observed.

Remaining deviations: fine mottling, rib definition, claw detail and ragged cloth are busier than the requested broad low-detail planes. Ribs look more skeletal/exposed than subtle ridges under skin. Forefeet retain handlike digits, though the overall body remains horizontal and animal-like. Hood folds and cloth tears vary slightly across views; this is not a mechanically exact turnaround. Background has subtle tonal variation/contact shading rather than perfectly uniform #3A3A3A. Actual dimensions are approximately, not exactly, 16:9. No anatomy/layout/palette defect warranted another generation.

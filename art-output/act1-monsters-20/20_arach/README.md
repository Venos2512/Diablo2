# Cloister Crypt Weaver

Original concept reinterpretation inspired by the Arach / Giant Spider family identity. This is not canonical Diablo II or Blizzard artwork. The low crypt ambusher, shield-shaped abdomen, incidental coffin handles and burial-cloth scrap establish the redesign.

## Files and method

- `concept.png`: actual generated PNG, copied without image manipulation from the built-in default location.
- `prompt.txt`: exact full final image_gen tool prompt (trailing file newline is not part of the submitted prompt). Contains the supplied full prompt and targeted anatomy/scale clarifications.
- Method: actual built-in `image_gen` through the available `image_gen__imagegen` tool, using the account-backed session. No Python generator, API fallback, procedural drawing, agents or new CLI sessions.
- Three sequential generations total: initial attempt, then two retries for clear anatomy/scale defects. No concurrent generation. Final attempt selected; retry limit reached.
- Original selected output: `C:/Users/HLC_2021/.codex/generated_images/01a14ac7-2e09-7050-8375-97b6d4f88d07/exec-4e602d5c-7b20-4add-80f0-2de6e7a72d7f.png`. Original retained.
- Read BRIEF.md, CLI_RECOVERY.md, required art-direction chapters 00, 06 and 12, and BRIEF_NATURE_PROPS.md. Inspected the cart turnaround and the correctly located `_refs/ref_v3_bonfire.png` before generation. Used their composition/material language as references, not their subjects.
- Final copied PNG inspected with `view_image` at its delivered path.

## View order

Top row, left to right: neutral grey adult human scale silhouette beside front view; side view; rear view; elevated game three-quarter view.

Bottom row, left to right: attack anticipation; solid black spider silhouette; small elevated game-scale view.

## Honest visual QA

- Layout: all four upper views and three lower views are present, with clear spacing and no visibly cropped limbs, text, logos or borders. Bottom-right view is smaller. The image is wide 16:9. Background reads as dark neutral grey with mild tonal variation rather than a mathematically flat guaranteed #3A3A3A.
- Eight-leg anatomy: black silhouette now visibly has four long walking-leg projections on each side, eight total, plus short mouth appendages. The attack pose reads as two raised front legs and six supporting legs. In colored front/side/rear and small views, occlusion and overlapping joints prevent confidently tracing every leg root to tip; exact coherent eight-leg topology across every view is therefore not fully verified. This is a concept reference, not a rigging-ready anatomical specification.
- Scale: human comparison is present, but the neutral front spider's ground-to-body/knee height visually reads roughly 0.55–0.65 H, above the requested 0.45 H (0.81 m versus a 1.8 m adult). This criterion remains unmet; width was not used as the height measurement. Perspective and differing foot positions make pixel estimates approximate.
- Consistency: broad dark shield abdomen, squat cephalothorax, grey-brown chitin, rusty loops and ragged grey cloth recur. The two loops and cloth remain incidental to the abdomen, with no tall pack. Their precise shapes, placement and cloth tears vary between views; strict turnaround identity is not achieved. Body proportions and apparent size also vary somewhat with perspective.
- Style: muted cold grey-brown palette, worn matte surfaces, restrained horror and soft contact shadows broadly fit the references. Carapace texture, hairs and edge highlights are busier than the requested two-to-three broad value masses. Some hard chitin segments read somewhat armor-like. No fluorescent sacs, glowing eyes, large web backdrop, humanoid weapons or gore are visible.
- Game-scale readability: the small view retains the broad spider silhouette and abdomen, but fine leg separation and crypt remnants become harder to read. No engine-resolution or animation validation was performed.

Result: actual image delivered; useful concept sheet with documented scale, occlusion, detail-level and cross-view consistency limitations. It should not be described as passing every art-direction requirement. Both allowed retries have been used.
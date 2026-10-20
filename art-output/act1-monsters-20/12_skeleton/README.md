# Ossuary Watchman — Skeleton family

## Generation and files

- Method: built-in image_gen inside authorized local Codex CLI, using account login; no API fallback, Python generator, procedural drawing, web artwork, or placeholder artwork.
- One image generated; no retries or variants. The original generated PNG was copied without image edits to `concept.png`.
- Exact submitted prompt: `prompt.txt`, unchanged from the user's complete prompt; no additions. Tool setting: `transparent_background: false`.
- Actual generated source: `C:/Users/HLC_2021/.codex/generated_images/01a14ac7-4253-7f12-ac6b-5d85915c93ea/exec-23623b60-bff7-4191-9418-13e481e09f29.png`.
- Verified PNG signature: `89 50 4E 47 0D 0A 1A 0A`.
- Verified IHDR dimensions: **1672 × 941 pixels**, approximately 16:9 (not mathematically exact 16:9).
- Source and copied PNG SHA-256 match: `79801EA84657FCCD1F226F780731FE811718CE49B087F6039E544036A4BEB779`.
- Existing `cli-task.txt` preserved.

## Original reinterpretation

A monastery ossuary sentry keeps its former duty through a salvaged burial-niche hatch shield, damaged nasal helmet, asymmetric collapsed mail shoulder and diagonal leather repairs. Human skeletal anatomy retains family readability; the practical hatch shield and abandoned sentry role distinguish this concept from a generic round-shield skeleton. This is an original reinterpretation, not a claim to canonical Diablo design or an exact sprite reconstruction.

## References and guidance actually inspected

Both images were opened with view_image as style/presentation references only, not edit targets:

- `E:/Diablo2/art-output/mmo-hub-bloodmoor/assets_2d/asset_01_cart_turnaround.png`: neutral grey sheet, spaced views, scale silhouette, muted worn materials.
- `E:/Diablo2/art-output/mmo-hub-bloodmoor/assets_2d/_refs/ref_v3_bonfire.png`: subdued semi-realistic game rendering, worn countryside materials and restrained values.

Read the imagegen SKILL.md, parent BRIEF.md and CLI_RECOVERY.md, art-direction/00_TOM_TAT_ART_DIRECTION.md, 06_NHAN_VAT_VA_QUAI.md, 12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md, and assets_2d/BRIEF_NATURE_PROPS.md. References were visually inspected in the conversation; the generation call submitted the text prompt without image-path parameters.

## Visual QA and limitations

The actual generated source was inspected using view_image after generation.

- Layout: exactly two rows. Top row contains a plain adult human silhouette, front, side, rear and elevated three-quarter monster views. Bottom row contains a sword attack pose, black silhouette with sword/shield, and a smaller elevated rendering. All figures are inside the canvas; no visible labels, watermark, scenery, panels or borders.
- Scale: main views are broadly comparable to the adult silhouette in height, with near-human proportions. This is a visual comparison, not a measured physical 1.8 m calibration. The small rendering is visibly larger than the requested approximately 75-pixel target; its exact figure height was not measured.
- Anatomy and handedness: visible poses maintain a human skeleton with two arms and two legs. Sword appears in anatomical right hand and shield in left; rear screen placement reverses as expected. Occlusion prevents certainty about every grip or joint. Fingers and toes are more detailed than requested.
- Equipment: the arch-shaped dark wood shield, rusted rim, horizontal strap, helmet, left shoulder mail and diagonal back strap recur recognizably. Exact shield damage, mail edges and sword shape vary. Sword tips appear beveled/pointed in several views rather than consistently square-broken. The helmet looks more intact than the requested one-side-torn design. The mail skirt hangs more centrally than the specified one-hip skirt.
- Pose and camera: front/side/rear are readable; top-right and small views are elevated, but no exact 55-degree camera was measured. The attack pose has a broad, readable sword wind-up. The guard is somewhat more upright and less strongly tucked toward the left shoulder than requested.
- Background and light: visually dark neutral grey with soft contact shadows and restrained upper-left illumination. Exact uniform #3A3A3A across the background was not pixel-verified; some tonal variation is visible. The black silhouette reads clearly, but pure black throughout was not sampled.
- Style and materials: dirty ivory bones, dark oak, brown leather and dull rust match the subdued gothic direction. No visible glowing eyes, magic, gore, chrome or saturated accents. Chainmail rings, bone detail and surface texture exceed the requested broad-plane low-detail treatment. Overall equipment and bone masses remain readable, although the small view is too large to validate actual 75-pixel gameplay readability.

This sheet is a useful concept with the above deviations; it is not a perfectly consistent model turnaround or a production-ready game sprite sheet. No exact pixel measurements are claimed beyond the verified file dimensions.

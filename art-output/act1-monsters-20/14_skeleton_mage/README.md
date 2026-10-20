# Cinder Ossuary Mage

Original concept derived from the Skeleton Mage family. The burned monastery ossuary fire-keeper story, fallen cowl, ash pots and kinked candle-snuffer staff are this project's reinterpretation, not a canonical Diablo II monster design or copied game artwork. The 1.05 H / 1.89 m height is an art-direction target, not canonical game data.

## Deliverable and method

- `concept.png`: actual AI-generated PNG, 1672 x 941 pixels, 1,599,530 bytes. Landscape and approximately 16:9; the dimensions are not mathematically exact 16:9.
- Generated once with the session's built-in `image_gen` tool through `functions.exec` calling `tools.image_gen__imagegen({prompt: ..., transparent_background: false})`. The existing T3 session launched the user-authorized local Codex CLI with image_generation enabled; the built-in tool was callable inside that CLI runtime. Account login was used; no OPENAI_API_KEY was required. No Python/API fallback, procedural drawing, agents, commits or pushes.
- Exact submitted image prompt: `prompt.txt`, read as UTF-8 and submitted unchanged apart from trimming surrounding whitespace. No creative additions or corrective prompt were submitted.
- Actual returned source: `C:/Users/HLC_2021/.codex/generated_images/01a14ac6-fd8c-7103-bac1-fcc032c33b45/exec-772c64ce-076a-43f5-adb4-35e2568f28ac.png`.
- Copied that PNG byte-for-byte to `concept.png` with PowerShell `Copy-Item`; no resizing, painting or compositing. Inspected the saved final with `view_image` and read dimensions from its PNG header.
- Both specified local references were inspected with `view_image` before generation. They informed composition/material/light interpretation only; no image paths were passed as edit targets or reference-image inputs. The detailed prompt describes their intended influence.

## Sheet order

Top, left to right: neutral adult human scale silhouette; front; right-facing side; rear; elevated three-quarter view.

Bottom, left to right: forward casting pose; black casting silhouette with staff; small elevated game view.

## Visual QA

All requested slots are present, full bodies and complete staffs fit within the sheet, and figures do not overlap. No visible letters, numbers, labels, logo, watermark, border, scenery or ground diorama. Dirty ivory bones contrast well against charcoal cloth and grey background. Eye sockets are dark. Warm accents are confined to small hand flames; no huge fireball, broad bloom or flame storm. The attack extends the flame hand while the staff braces behind the body.

The front and rear support anatomical right-hand staff / left-hand ember placement; no obvious hand swap is visible. The side view hides the far flame hand, so its placement cannot be independently verified there. Fallen cowl, diagonal strap, paired ash pots, exposed skeleton and bent snuffer staff recur, though exact tears, pot visibility and folds vary across angles. Rear cowl and strap are readable. The snuffer reads as an empty rusty bell-shaped tool.

Observed drift and limitations:

- The mage appears slightly taller than the human, broadly near the intended human scale; the exact 1.05 ratio is not certified. Perspective and head/baseline variations prevent a precise physical-height claim.
- Staffs are roughly body height or longer rather than the specified 0.8 H. Their bend and head angles also vary somewhat.
- The small game view is roughly 190 pixels tall in this PNG, not approximately 79 pixels. Its skull, staff and ember remain readable, but fine bones/pots would need a separate 79-pixel production check.
- Side is near-profile rather than a guaranteed orthographic side. The elevated view is only moderately elevated. Top-view baselines and scales are close, not exact.
- Cloth is more shredded and finely perforated than the requested blunt burned hems and broad low-detail masses. Added ankle wraps and a fuller hanging cloth remnant are visible. The short sleeve and asymmetric raised shoulder are less distinct than specified.
- Casting flame and sparks extend beyond a palm-sized ember, though still occupy a very small fraction of the sheet. Background has subtle tonal variation/contact shading rather than a verified uniform #3A3A3A fill.

Accepted as the requested concept sheet with the above drift disclosed. One generation, no retries. This is a concept reference, not a verified production turnaround or game sprite.


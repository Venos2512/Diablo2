# Bottom HUD bar sprite sheet

Generated directly with the built-in image_gen tool. Initial prompt supplied verbatim by the user, with 01_hud_gameplay.png as the style reference. One corrective generation was made because sampled background pixels were not uniform pure green. Both outputs are preserved without pixel editing.

## Sources and PNG sizes

- h2_bottom_bar.png: C:\Users\HLC_2021\.codex\generated_images\01a151c9-5da5-7fe0-bb97-cd6d0541d4f1\exec-392efe38-3e97-4bfb-958c-96aa531e74c4.png — 1672 x 941 px; 1,704,543 bytes.
- h2_bottom_bar_v2.png: C:\Users\HLC_2021\.codex\generated_images\01a151c9-5da5-7fe0-bb97-cd6d0541d4f1\exec-78648513-1f3d-4e20-b455-7f217eb6589e.png — 1672 x 941 px; 1,664,347 bytes.

## Elements in reading order

Original, top to bottom and left to right within each horizontal band:
1. Long centre stone-and-iron panel.
2. Left end-cap.
3. Empty experience trough.
4. Right end-cap.
5. Pale-gold experience fill with a thin enclosing iron border.
6. Empty stamina trough.
7. Warm-yellow stamina fill with a thin enclosing iron border.

Corrective v2:
1. Long centre stone-and-iron panel.
2. Empty experience trough.
3. Pale-gold experience fill with a thin enclosing iron border.
4. Left end-cap.
5. Right end-cap.
6. Empty stamina trough.
7. Warm-yellow stamina fill with a thin enclosing iron border.

## Honest QA

- Visually inspected both outputs. Seven discernible pieces each, front-facing, dark weathered stone and riveted iron. No visible text, watermark, game world, statues or creatures. No touching or overlap observed.
- Background FAILS the strict flat #00FF00 requirement in both versions. Original samples at (0,0), (800,30), (800,650): #13F10C, #04F802, #03F903. V2 at the same points: #13F113, #02F809, #04F80B. These are unedited generator outputs; neither is ready for exact single-colour chroma-key slicing.
- Wide green separation is visible overall, but the minimum 40 px gap is not certified; the original end-cap/trough gaps and the v2 end-cap/stamina band appear tight.
- Dimensions are approximately 16:9 (1672 x 941), not exact 16:9.
- Centre panel is visibly wider than the requested 5:1 proportion. Fill strips retain iron borders instead of being strictly bare fill-only sprites. The requested three-row layout is spread across additional horizontal bands.
- The single permitted correction did not resolve exact green uniformity. No further generations or raster modifications were made.

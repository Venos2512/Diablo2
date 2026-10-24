# h4_frames_bars

Generated directly with the built-in image_gen tool. The initial call used the user's exact prompt and the approved gameplay reference at E:/Diablo2/legacy/art-output/ui-concepts/01_hud_gameplay.png. One corrective generation was made because the background was not uniform pure green. Both original generated PNGs were copied without pixel edits and without overwriting existing PNGs.

## Files and sources

- h4_frames_bars.png: 1672 x 941 pixels; 1,677,831 bytes.
  Source: C:/Users/HLC_2021/.codex/generated_images/01a151c9-5da5-7311-b6ae-64ea855d5b15/exec-a693686a-8c07-4a2f-beff-2f5efac8391f.png
- h4_frames_bars_v2.png: 1672 x 941 pixels; 1,619,878 bytes.
  Source: C:/Users/HLC_2021/.codex/generated_images/01a151c9-5da5-7311-b6ae-64ea855d5b15/exec-12fc76b5-5e4b-4945-93d9-bcde8cfe8cdd.png

## Elements in reading order

1. Row 1, left: round empty portrait ring joined to a horizontal dark party bar trough.
2. Row 1, right: long monster plate with dark trough and iron end finials.
3. Row 2, first: red life strip.
4. Row 2, second: blue mana strip.
5. Row 2, third: orange champion strip.
6. Row 2, fourth: pale grey shield strip.
7. Row 3, left: round minimap ring with a top compass ornament and empty green center.
8. Row 3, right: square minimap frame with corner brackets and empty green center.

## Honest QA

Both sheets were visually inspected. All eight elements are present, separated by visible green gaps, with no touching or overlapping between sprites. No game world, text, numbers, watermark, characters, skulls or statues are visible. Frames are front-facing, weathered dark metal with rivets and engraving. The dark fantasy material treatment is broadly consistent with the reference, but an exact material match cannot be certified. Output is approximately 16:9, not mathematically exact (1672 x 941).

Initial sheet: coloured strips have iron frames, which deviates from standalone fill strips. Background appears green but is NOT flat pure #00FF00. Sample RGB values at (0,0), (800,0), (0,400), (800,400), (800,900): (18,242,12), (5,247,4), (3,248,2), (3,248,2), (3,249,2).

Corrective v2: iron surrounds were removed from the four fill strips. However, the background still is NOT flat pure #00FF00 and has subtle variation/noise. At the same sample coordinates RGB values are (16,239,17), (5,246,8), (4,248,6), (2,247,5), (3,249,6). Therefore v2 also fails the strict chroma-key background requirement and needs background cleanup before exact-colour slicing. No further generation or pixel editing was performed, respecting the one-correction limit. Visual gaps appear at least 40 pixels; no exhaustive edge or gap measurement was performed. Some strips have bright shading despite the request for no glossy gradients; the champion fill reads more orange than orange-brown.

## Corrective prompt

Correct this HUD sprite sheet. Preserve the eight separated sprites, their reading order, materials and layout. Replace ALL background around and between sprites and the empty insides of the portrait ring and both minimap frames with perfectly flat uniform pure RGB (0,255,0), hex #00FF00. Absolutely no background texture, noise, shading, vignette, shadow, or glow. Keep at least 40 pixels of green separation. No game world, text, letters, numbers or watermark. Make the four coloured strips standalone thin fill strips without surrounding iron frames. Keep front orthographic view and 16:9 landscape composition.

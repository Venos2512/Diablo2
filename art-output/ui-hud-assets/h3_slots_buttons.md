# Slots and buttons sprite sheet

Generated with the built-in image_gen tool. The first call used the user's exact prompt and approved gameplay HUD reference at `E:/Diablo2/art-output/ui-concepts/01_hud_gameplay.png`. One corrective generation was made because the background was not uniform pure green. Both original generated files and both copied PNGs are retained without overwriting.

## Files and sources

| Saved PNG | Source generated_images path | Dimensions |
| --- | --- | --- |
| h3_slots_buttons.png | C:/Users/HLC_2021/.codex/generated_images/01a151c9-5da5-72a0-a680-25da44158221/exec-3a33fce9-7a71-4507-8a7a-5a9eb2968197.png | 1672 x 941 px |
| h3_slots_buttons_v2.png | C:/Users/HLC_2021/.codex/generated_images/01a151c9-5da5-72a0-a680-25da44158221/exec-87ce5a43-e004-465c-b179-6dcab2826971.png | 1672 x 941 px |

## Elements in reading order

Both sheets have the same 19-element layout, left to right within each row:

1. Large square riveted mouse-skill frame, empty green interior.
2. Smaller square hotkey-skill frame, empty green interior.
3. Round potion-slot frame, empty green interior.
4. Square warm ember-gold hover frame, empty green interior.
5. Square pale silver selected frame, empty green interior.
6. Normal character button: helmet.
7. Normal inventory button: bag.
8. Normal skills button: open book.
9. Normal quests button: scroll.
10. Normal map button: compass.
11. Normal system button: gear.
12. Warm hover character button: helmet.
13. Warm hover inventory button: bag.
14. Warm hover skills button: open book.
15. Warm hover quests button: scroll.
16. Warm hover map button: compass.
17. Warm hover system button: gear.
18. Wide rectangular iron/leather plate, normal.
19. Wide rectangular iron/leather plate, warm hover.

## Honest QA

- Visually inspected both saved PNGs. All 19 elements are present, separate and front-facing; no visible game world, readable text, labels, watermark, touching or overlapping sprites.
- Dark weathered iron, stone and leather materials broadly follow the approved reference. Hover illumination is stronger than the requested subtle ember light.
- FAIL: neither background is perfectly flat #00FF00. Pixel samples from the first PNG: (0,0) #11F20E, (800,10) #03F904, (20,400) #02F803, empty slot interior (500,200) #07F806. Corrective PNG: corresponding samples #12F214, #03F80B, #04F80B, #05F70C. Variation remains visible on inspection. Exact single-colour chroma-key extraction is therefore not ready.
- FAIL: some vertical green gaps appear around 20-35 px, below the requested minimum 40 px, although no sprites touch.
- The potion frame is a round ring rather than a clear rounded iron cup. Hover and selected frames retain substantial iron framing rather than being thin rims only.
- Both files are approximately 16:9 (1672 x 941), not mathematically exact 16:9.
- No pixel editing or background replacement was performed. Generation stopped after the one permitted corrective call. Neither version fully meets the slicing specification; v2 is retained as the corrective attempt, not certified as fixed.

## Corrective prompt

Correct this GAME UI SPRITE SHEET. Keep the same 19 isolated stone, blackened iron and dark leather slots and buttons in the same four rows, front orthographic view, no text or game world. REQUIRED CORRECTION: replace ALL background and empty frame interiors with absolutely uniform solid RGB(0,255,0), hex #00FF00. No noise, shading, gradients, shadows, halos or glow outside sprite boundaries. Keep at least 40 pixels of pure green between every sprite, including between rows. Row 1: large square empty mouse skill frame, smaller square empty hotkey frame, rounded iron cup empty potion slot, thin square ember-gold hover rim only, thin square pale silver selected rim only. Row 2: six round normal menu buttons with helmet, bag, open book, scroll, compass, gear. Row 3: same six round buttons with restrained warm ember hover illumination confined inside the sprites. Row 4: two wide rectangular iron framed dark leather plates, normal and hover. All 19 separate, no overlaps, no touching, no letters, no numbers, no labels. ONE 16:9 landscape sprite sheet. Flat pure #00FF00 background is essential.

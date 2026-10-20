# h1_orbs sprite sheet

Generated with the built-in image_gen tool. The first generation used the user's exact prompt and approved gameplay image as reference. One corrective generation was made because sampled background pixels were not uniform pure green. Both originals are preserved without pixel edits.

## Files and sources

- h1_orbs.png — 1672 x 941 pixels. Source: C:\Users\HLC_2021\.codex\generated_images\01a151c9-5da5-7a70-b68d-be21df1e863f\exec-947239c3-9825-49a6-994a-e6b8688b1c74.png
- h1_orbs_v2.png — 1672 x 941 pixels. Source: C:\Users\HLC_2021\.codex\generated_images\01a151c9-5da5-7a70-b68d-be21df1e863f\exec-342c812a-7040-42d9-bcd3-f98722a5089c.png

## Elements in reading order

1. Top left: life-orb housing, blackened iron and weathered stone, green circular opening.
2. Top right: matching mana-orb housing, green circular opening.
3. Bottom left: deep red life liquid and glass circle.
4. Bottom second: deep blue mana liquid and glass circle.
5. Bottom third: dark smoky drained glass circle.
6. Bottom right: reflection circle; green-tinted in the first output, corrected to dark grey with white highlights in v2.

## Honest QA

Both PNGs were opened and visually inspected. Six sprites are present, isolated and front-facing, with no visible text, watermark, game world, characters or statues. No sprites visibly touch or overlap. Dark stone and iron broadly follow the reference, with simplified housings and strongly glossy interiors.

Neither output fully passes the prompt. The background looks green but is not flat #00FF00: original samples include #12F111 at (0,0), #02F806 at (100,100), and #04FA07 at (835,100); v2 samples include #14F115, #04F809, and #03F808 at those same positions. Green variation also appears in housing holes. Pixel samples demonstrate nonuniformity; a full segmentation audit was not performed.

The four lower circles look similar in diameter, but exact equality, exact fit into the larger housing openings, and exact mirrored housing geometry are not verified. Openings appear slightly larger than the lower circles. Some lower-row gaps appear around 30–35 pixels, below the requested 40-pixel minimum. The canvas is approximately 16:9 (1672 x 941), not mathematically exact. V2 corrects the reflection interior to grey, but its background remains noncompliant. Reflection is opaque grey rather than a ready-to-composite alpha overlay, consistent with the requested grey backing. Neither sheet should be described as fully slice-ready without chroma cleanup and alignment checks.

Stopped after the single authorized corrective generation. No other assets were modified.

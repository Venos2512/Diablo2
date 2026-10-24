# Gutter Skimmer — Foul Crow color mood, v2

Final image: [concept.png](concept.png), actual generated PNG, 1672 × 941 pixels (approximately 16:9; not mathematically exact). One sheet, four views, no text. Generated on 2026-10-18.

Method: built-in `image_gen` in this Codex CLI runtime through account login. One generation call; no API fallback, API key, procedural illustration, agents, or additional threads. The full exact submitted prompt is the existing [prompt.txt](prompt.txt), submitted unchanged. The generated PNG was copied without alteration; the source remains in place.

Tool-returned source output path:
`C:/Users/HLC_2021/.codex/generated_images/01a14ad2-7269-7a90-b9f0-4a966f98686a/exec-6808dd95-ffe8-4135-afa3-3e954670b015.png`

Final output path:
`E:/Diablo2/legacy/art-output/act1-monsters-20/16_foul_crow/variants/v2/concept.png`

SHA-256: `A8D10AE5F12902080DC9ED3F43E997832B1222A708E4FE736786DC5098CD9A6B`.

## Source evidence and palette status

- Original family animation: `E:/Diablo2/legacy/bestiary/assets/references/blood-hawk.gif`.
- Visually inspected reference-only montage: `E:/Diablo2/legacy/art-output/act1-monsters-20/16_foul_crow/variants/v2/reference-view.png`. This was the palette observation source; no previous generated crow was used as palette input. No reference image was attached to the generation call; the exact prompt conveys the observed color relationships.
- Source metadata: `E:/Diablo2/legacy/bestiary/src/data/images.json`, key `Blood Hawk`, records file `assets/references/blood-hawk.gif`, original Blizzard animation URL `https://classic.battle.net/images/battle/diablo2exp/images/animations/bestiary/act1/bloodhawk.gif`, and source page `https://classic.battle.net/diablo2exp/monsters/act1-bloodhawk.shtml`.
- Family identity: `E:/Diablo2/legacy/bestiary/src/data/catalog.js`, line 35, identifies Blood Hawk.
- Assignment and layout: `E:/Diablo2/legacy/art-output/act1-monsters-20/variant-designs.json`, entry 16, and `E:/Diablo2/legacy/art-output/act1-monsters-20/VARIANTS_V2_BRIEF.md`. Runtime instructions: `E:/Diablo2/legacy/art-output/act1-monsters-20/CLI_RECOVERY.md`.

No exact Foul Crow sprite was found. This is explicitly a Blood Hawk family palette approximation for the assigned Foul Crow color mood, not a canonical Foul Crow palette extraction. The observed warm dark brown / ochre-orange / pale grey relationships informed the prompt and are visible in the result. Coldcrow is an unrelated unique and was not used as a bird reference.

## View order and visual QA

Large elevated game three-quarter view on the left; smaller front, side, and rear views run top to bottom on the right. The saved final PNG was opened with `view_image` after copying, and the tool-displayed generation was visually reviewed.

The main view visibly has two separate membrane wings and four perching feet, a long curved neck, a blunt flattened shovel beak, sparse crest, and a naked tapering tail. The low, nearly featherless quadrupedal body is visibly distinct from a conventional feathered crow. Warm ochre neck and orange-brown limbs contrast with dark brown membranes and pale grey-ivory beak and claws. All four views are fully framed on a dark neutral backdrop with no lettering or props. Front and rear studies support the same six-limb construction.

Material weaknesses: wing membranes are broader and more raised than the requested narrow, partly extended forewings. Surface texture is denser than the requested low-detail treatment. The small side study overlaps the far limbs and wings, so all six limb attachments are less independently readable there. Exact toe counts, wing folds, and crest density vary slightly across views; this is concept guidance rather than an anatomically locked modeling turnaround. Background has subtle shading/contact shadow rather than a perfectly flat sampled #3A3A3A fill. Aspect ratio is approximately, rather than exactly, 16:9. No retry was made because the core anatomy, head silhouette, palette, and four-view composition are present.

Only this folder received deliverables. Existing prompt and reference files were preserved; earlier concepts were not overwritten. No commit or push was performed.

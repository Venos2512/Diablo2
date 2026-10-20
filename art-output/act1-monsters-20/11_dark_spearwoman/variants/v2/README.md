# Reed Stalker — v2

Method: Codex CLI built-in image_gen, using the runtime's account-login route. One generation call; no retries, agents, extra threads, API calls, keys, fallback script, or procedural art. Submitted prompt is reproduced verbatim below and in prompt.txt.

Original returned source path:
C:/Users/HLC_2021/.codex/generated_images/01a14ad2-088d-7cc1-998d-38656aff1189/exec-8d3ed60c-0aa4-4d1f-86bd-b774e85225a4.png

The actual returned PNG was copied unchanged to concept.png and inspected with view_image. The tool-managed original remains in place. All task-authored files are inside this v2 directory; prior deliverables were not edited. No commit was made.

## Reference evidence

Inspected with view_image:
- E:/Diablo2/art-output/act1-monsters-20/11_dark_spearwoman/variants/v2/corrupt-rogue-spearwoman-reference.png
- E:/Diablo2/art-output/act1-monsters-20/11_dark_spearwoman/variants/v2/corrupt-rogue-reference.png

These are resized first-frame previews from bestiary/assets/references/corrupt-rogue-spearwoman.gif and bestiary/assets/references/corrupt-rogue.gif respectively. The previews show warm tawny peach/tan exposed flesh contrasted with near-black charcoal equipment and hair, dull grey steel and subdued brown accents. This is a visual family palette interpretation, not an exact canonical palette extraction. Source filenames identify the family; exact shipped variant provenance is unverified.

Read bestiary/src/data/catalog.js: Corrupt Rogue Spearwoman belongs to the rogues group and derives from Corrupt Rogue. Its long spear extends its silhouette. The group's #a26969 UI color is editorial, not canonical source palette evidence. Also read VARIANTS_V2_BRIEF.md, variant-designs.json and CLI_RECOVERY.md. No large embedded image JSON was searched.

Original reinterpretation: a new nonhuman creature concept inspired by the source family, not canonical Blizzard artwork and not a copied source sprite. References informed palette interpretation; the exact supplied text was used for new-image generation without reference-image edit inputs.

## Visual QA

Actual concept.png exists: 1,656,076 bytes; PNG header dimensions 1672 × 941, approximately 16:9 (not mathematically exact).

Observed strengths:
- Four complete, separated full-body depictions: larger left three-quarter, front, side and rear studies; beaks and feet remain inside the canvas.
- Clearly transformed creature anatomy: long folded S-neck, biological spear-like beak, narrow ribbed body, two long jointed hindlegs and two folded hooked forelimbs. No wings, carried weapon, human face, armor suit, text, logo or visible gore.
- Warm tan/peach hide contrasts with charcoal lower legs, hooked forelimbs, bindings and nape filaments; beak is muted slate grey. No neon, luminous eye effect or colored glow.
- Neutral dark grey backdrop and restrained toe contact shadows; no scenery.

Deviations and limits:
- The three right studies are close to the large view's overall height, rather than clearly smaller studies; the left view occupies less than half the canvas. The side study is near-profile, with paired limbs offset for visibility.
- Skin wrinkles, ribs and tendon texture exceed the requested low surface detail. The silhouette is somewhat heavier through shoulders and thighs than the very narrow brief.
- Nape filaments are long and prominent rather than a small sparse crest.
- Bindings cluster around waist/hip and back rather than unambiguously around the thorax and one upper leg. Binding and buckle placement varies across views.
- Three prominent splayed toes are visible on the clearest feet, but overlapping side/rear toes and small claw-like projections prevent certifying exact toe-count consistency in every view. Hook shapes and beak proportions also vary slightly with view.
- Background appears dark neutral grey but has subtle tonal variation; exact uniform #3A3A3A is not verified. No pixel-exact palette claim is made.

Retained the first result: the anatomy transformation and warm/dark palette relationship are clear. This is a concept sheet with the consistency limitations above, not a mechanically exact turnaround.

## Exact submitted prompt

```text
Use case: stylized-concept
Asset type: ONE original dark fantasy creature concept sheet, 16:9 landscape PNG.
Primary request: Reed Stalker. Transform the Dark Spearwoman / Corrupt Rogue source family into a substantially DIFFERENT CREATURE with different anatomy, locomotion and head silhouette. A tall, very narrow nonhuman wading predator: two long stilt hindlegs with high backward hocks and broad three-toed splayed feet, small narrow ribbed torso suspended above the knees, a long folded S-neck, a smooth wedge-shaped skull terminating in a long rigid spear-shaped BEAK, and two slender folded hooked raptorial FORELIMBS held tight against the chest. Four limbs total: two weight-bearing hindlegs plus two hooked forelimbs, no wings. Beak is biological keratin, not a carried weapon. No human face, hands, breasts, torso or upright soldier posture. No humanoid spearwoman, no carried spear, no armor suit. Neck and back form a narrow broken reed silhouette; stilt steps and sudden forward beak strike suggest its ambush locomotion. A few rotted leather rogue bindings remain knotted around one upper leg and the thorax, with a tiny dull iron buckle, showing corrupted ancestry without turning the beast into an equipped fighter. Small ragged charcoal filament crest along nape; sparse skin texture, no full bird plumage. Believable tendon and joint mechanics, restrained horror, no gore.
Color priority: use the ORIGINAL local Corrupt Rogue Spearwoman and Corrupt Rogue sprite family palette relationship, not the previous generated sheet. Dominant exposed hide on neck, flank and thighs is warm dusty tawny peach/tan, bruised muted warm brown in shade; near-black brown-charcoal at lower legs, raptorial forelimbs, narrow nape filaments and old bindings. Dull slate-steel grey on long beak tip and hooked keratin edges, a little worn umber leather. Preserve visible warmth and contrast between bare warm hide and very dark extremities; do not wash everything into cold grey or olive green. These hues are a visual interpretation of local sprite references, not a claim of exact canonical palette extraction. No neon, emissive colors, luminous eyes or bright accents.
Composition: spacious clean sheet, ONE large full-body elevated game three-quarter view on left taking about half the canvas, and three smaller equal-scale front, true side and rear full-body studies arranged on the right. All four views depict exactly the same anatomy, toe count, folded forelimbs, beak length, skin palette and binding locations. Large view clearly shows the S-neck, beak, long legs and folded hooked forelimbs. Front and rear emphasize narrow thorax and leg separation; side clearly shows nonhuman hock joints and biological beak. Leave generous margins and negative space; no cropped beak or feet, no touching views, no weapons or accessories laid out. No labels or extra panels.
Style: semi-realistic grounded dark fantasy production concept, broad forms and only 2-3 major value masses with low surface detail. Restrained Act I medieval countryside corruption. Soft neutral slightly cool upper-left lighting supports the warm source flesh palette, no rim light, bloom or dramatic colored light. Every form legible at small game scale. Flat dark neutral grey #3A3A3A background, no scene, no water or reeds, only minimal soft contact shadows beneath toes.
Constraints: ONE original creature design, no human fighters, no source sprite copying, no previous Briar Spear Rogue design, no text, letters, numbers, watermark or logos. Anatomical transformation must be obvious immediately. Do not add wings, horns, a carried spear, shields, ornate equipment, cartoon features or gratuitous gore. Concept art inspired by a source family, not canonical Blizzard artwork.
```


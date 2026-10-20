# Storm Gullet — assignment 19, v2

Original creature reinterpretation inspired by the color mood of Diablo II's Tainted family. This is new generated concept art, not a canonical Diablo II asset, sprite reconstruction, or exact turnaround model.

## Deliverables and generation

- `concept.png`: actual PNG, 1672 × 941 pixels. Landscape, approximately 16:9 (not mathematically exact 16:9).
- `prompt.txt`: supplied full prompt, used verbatim in wording without added instructions. Original file preserved.
- Method: Codex account-login runtime built-in `image_gen` (`image_gen__imagegen`), opaque background. One generation call; no retries, API script, API key, or procedural drawing.
- Built-in source: `C:/Users/HLC_2021/.codex/generated_images/01a14ad2-7735-74f3-b0c6-2d203de077e2/exec-58cc57af-928a-4417-b269-d6322a637157.png`.
- Copied byte-for-byte without editing, resizing, or recompression. Source and delivered SHA-256: `9176DAEC3A946FCAAF97884F21CDF1A5E52BB6C24B259417B752294E92F1B677`.
- No earlier concept or Bell Thief asset was modified. No agents, additional CLI threads, commits, or pushes.

## Source evidence and palette

Inspected `E:/Diablo2/art-output/act1-monsters-20/19_tainted/variants/v2/source-tainted-frame.png` using view_image before generation. This supplied enlargement represents frame 0 of `E:/Diablo2/bestiary/assets/references/tainted.gif` (original reported as 125 × 150, 10 frames). The enlargement was used as a visual color reference, not an anatomy template. The GIF animation itself was not decoded during this run.

Visible relationships: very dark green limbs/lower body, olive-brown head/shoulders, worn ivory horns, and small reddish cloth. The generated creature translates these into green legs, ochre/olive upper hide and gullet, ivory jaw nubs/claws, and restrained reddish crease/mouth accents. These are visual approximations, not sampled canonical hex values. Lighting, low sprite resolution, and enlargement limit color certainty.

`E:/Diablo2/bestiary/src/data/catalog.js` identifies Tainted as a horned heavy-bodied hybrid with melee/projectile attacks and Pitspawn Fouldog as a named Tainted-family beast. No enormous embedded image JSON was read. No Grim Dawn Tainted Hound material was used.

Read assignment context from `E:/Diablo2/art-output/act1-monsters-20/VARIANTS_V2_BRIEF.md`, `variant-designs.json`, and `CLI_RECOVERY.md`. Optional cart/bonfire sheets were not inspected or supplied as image inputs. The built-in call received the exact textual prompt; no separate image-reference argument was attached. Palette interpretation came from the inspected source frame and the prompt's description.

## View order and honest visual QA

Large left: full-body three-quarter game concept. Right column, top to bottom: front, side-oriented profile, rear. One low, broad, tailless toadlike demon; no equipment, labels, scenery, watermark, or giant electrical effect. Green limbs and ochre gullet remain perceptible. Four weight-bearing legs are depicted or accounted for through occlusion; some far limbs are hidden. The main mouth has a small yellow electrical filament. Small ivory jaw nubs and broad clawed feet are present.

Limitations/deviations visible in the built-in full-size render:

- The front view's largest sac bulge appears on the viewer's left (creature's anatomical right), rather than the requested anatomical left. Handedness across all views cannot be certified; this is not an exact consistent turnaround.
- The main camera appears lower than the specified 50–60-degree downward angle. The middle view is slightly three-quarter rather than a strict orthographic side.
- Feet/toe counts, leg placement, sac shape, and jaw-nub visibility vary with view and occlusion. Exact three-toed consistency is not established.
- Sac folds and hide have substantially more surface texture and highlight variation than the requested broad, low-detail 2–3 value groups. Some highlights read slightly moist rather than uniformly matte.
- The sac nearly touches the ground, and belly clearance is difficult to assess. The rear has a pointed folded skin silhouette despite no distinct tail.
- The front resting mouth is visibly open; the requested closed resting mouths are not fully achieved.
- Background is neutral dark grey with tonal variation/contact shadows; exact flat #3A3A3A was not established. Margins are narrow near the left foot.
- Pixel dimensions approximate the requested aspect ratio rather than matching it exactly.

Verification: inspected the built-in generation's large displayed render. Invoked view_image on the delivered PNG twice (including original detail); those local tool previews rendered unusually tiny, so they did not provide an independent full-size visual inspection. The delivered file was successfully decoded with System.Drawing at 1672 × 941, and its SHA-256 matches the fully displayed generated source. Visual QA therefore refers to that identical built-in render, with this preview limitation explicitly disclosed. Kept the one generated sheet and documented deviations; no exact consistency claim is made.

## Session verification addendum

The outer session independently opened and inspected the delivered concept.png at full visible sheet size after CLI completion. It confirms a substantially new quadrupedal toadlike creature, enormous off-center gullet, small recessed head, original-source green/ochre color relationship, restrained mouth electricity, and all four requested views. The earlier CLI preview limitation does not apply to this final independent inspection. The turnaround-consistency and excess-texture limitations above remain.

The outer session decoded frame 0 directly from the original GIF using Pillow to create the nearest-neighbor inspection enlargement (no generated artwork was drawn procedurally). Exact source metadata read from bestiary/src/data/images.json, Tainted entry:
- Local original: E:/Diablo2/bestiary/assets/references/tainted.gif
- Original asset URL: https://classic.battle.net/images/battle/diablo2exp/images/animations/bestiary/act1/bighead.gif
- Source family page: https://classic.battle.net/diablo2exp/monsters/act1-tainted.shtml
These URLs are recorded from local project metadata; no live-source verification or canonical hex extraction is claimed.

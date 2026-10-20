# Third-party software and assets

Everything procedural in this project — Act I environments, forged textures, shaders, VFX, spells,
training dummies — is original to Sanctuary Lookdev Lab. The items below are third-party and keep
their own licenses.

## Software

| Package | Version | License | Notes |
| --- | --- | --- | --- |
| three.js | 0.180.0 | MIT | Renderers, TSL, loaders, post-processing nodes, lil-gui (MIT) and the Draco / Basis (KTX2) decoders shipped in `examples/jsm/libs` (Apache-2.0). |
| three.quarks + quarks.core | 0.16.0 | MIT | Particle engine in the VFX tab (© Alchemist0823) — [github.com/Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks). 0.17+ needs three ≥ 0.182. |
| esbuild | 0.25.10 | MIT | Build tool only (not shipped). |

The offline HTML build embeds the Draco decoder (`draco_wasm_wrapper.js`, `draco_decoder.wasm`, Apache-2.0,
© Google) and the Basis Universal transcoder (`basis_transcoder.js` / `.wasm`, Apache-2.0, © Binomial LLC).

## Sample models and HDRIs (`assets/samples/`)

| Asset | License | Credit | Source |
| --- | --- | --- | --- |
| USD Shader Ball | CC-BY-4.0 | Geometry and textures: Chris Rydalch; original specification and validation: André Mazzone; original scene, inspiration and consultation: Thomas Anagnostou; glTF conversion: Eric Chadwick | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/USDShaderBallForGltf) |
| Lantern | CC0-1.0 | sbtron (Microsoft); Frank Galligan | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Lantern) |
| Pot of Coals | CC-BY-4.0 | Eric Chadwick / Darmstadt Graphics Group GmbH (Khronos logo is a trademark of the Khronos Group) | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/PotOfCoals) |
| Glass Hurricane Candle Holder | CC-BY-4.0 | Eric Chadwick / Wayfair, LLC (Khronos logo is a trademark of the Khronos Group) | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/GlassHurricaneCandleHolder) |
| Compare Roughness | CC0-1.0 | Eric Chadwick and DGG (glTF logo is a trademark of the Khronos Group) | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CompareRoughness) |
| Compare Metallic | CC0-1.0 | Eric Chadwick and DGG (glTF logo is a trademark of the Khronos Group) | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CompareMetallic) |
| Fox (animated) | CC0-1.0 + CC-BY-4.0 | Model: PixelMannen (CC0); rigging and animation: tomkranis (CC-BY 4.0); glTF conversion: @AsoboStudio and @scurest (CC-BY 4.0) | [glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox) |
| Robot Expressive (animated) | CC0-1.0 | Tomás Laulhé (Quaternius); modifications by Don McCurdy | [three.js examples r180](https://github.com/mrdoob/three.js/tree/r180/examples/models/gltf/RobotExpressive) |
| KayKit Knight | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| KayKit Barbarian | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| KayKit Mage | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| KayKit Rogue | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| KayKit animations (Knight / Barbarian / Mage rig) | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| KayKit animations (Rogue rig) | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| KayKit weapons & shields | CC0-1.0 | Kay Lousberg (KayKit · Adventurers Character Pack 1.0) | [KayKit Adventurers 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) · [itch.io](https://kaylousberg.itch.io/kaykit-adventurers) |
| Moonless Golf (night) | CC0-1.0 | Poly Haven | [polyhaven.com](https://polyhaven.com/a/moonless_golf) |
| Quarry 01 (overcast) | CC0-1.0 | Poly Haven | [polyhaven.com](https://polyhaven.com/a/quarry_01) |
| Royal Esplanade (sun) | CC0-1.0 | Poly Haven | [polyhaven.com](https://polyhaven.com/a/royal_esplanade) |

Textures of Lantern, Pot of Coals and Glass Hurricane Candle Holder were re-encoded to 1024 px to keep
the offline build small; geometry is unchanged. HDRIs are the 1k versions.

KayKit characters were split by `scripts/prepare-kaykit.py`: each character file keeps its rig, skinned
meshes, built-in weapons and texture; the 76 animations are stored once per rig (Knight, Barbarian and
Mage share the same rig and clips) with the channels of IK/control bones and rest-pose tracks removed,
redundant linear keys dropped and rotations stored as normalized 16-bit values. Weapons and shields from
the pack's `Assets/gltf` folder are merged into one file. Thank you, Kay Lousberg — www.kaylousberg.com.

Project art (not third-party): the painted terrain textures — Painted terrain · dry dirt (albedo),
Painted terrain · dry dirt (height), Painted terrain · wet dirt + puddles (albedo),
Painted terrain · wet dirt + puddles (height), Painted terrain · grass (albedo), Painted terrain · grass (height) — are cut from the
project's own concept sheet `art-direction/reference/moor_campfire_terrain_concept.png` and made
tileable by `scripts/prepare-terrain-swatches.py`.
The painted tiles Painted tile · transition (dirt + grass) (albedo), Painted tile · transition (dirt + grass) (height), Painted tile · mud + puddles (albedo), Painted tile · mud + puddles (height), Painted tile · grass (albedo), Painted tile · grass (height)
are project tiles from `art-direction/reference/terrain-tiles`, made tileable by `scripts/prepare-terrain-swatches.py --tiles`.
The D2R moor set — D2R moor · dry dirt + transition (albedo), D2R moor · dry dirt + transition (height),
D2R moor · wet dirt + puddles (albedo), D2R moor · wet dirt + puddles (height), D2R moor · grass pattern mix (albedo),
D2R moor · grass pattern mix (height), D2R moor · road wheel ruts (albedo + alpha), D2R moor · road wheel ruts (height),
D2R moor · creek water (albedo), D2R moor · grass cards (RGBA atlas) — are project tiles generated with Codex image generation
(`art-direction/reference/terrain-moor`), made tileable and mixed by `scripts/prepare-terrain-moor.py`.
The Act I biome sets — Act I biome · Cold Plains · base (albedo), Act I biome · Cold Plains · base (height), Act I biome · Cold Plains · wet (albedo), Act I biome · Cold Plains · wet (height), Act I biome · Cold Plains · cover (albedo), Act I biome · Cold Plains · cover (height), Act I biome · Burial Grounds · base (albedo), Act I biome · Burial Grounds · base (height), Act I biome · Burial Grounds · wet (albedo), Act I biome · Burial Grounds · wet (height), Act I biome · Burial Grounds · cover (albedo), Act I biome · Burial Grounds · cover (height), Act I biome · Stony Field · base (albedo), Act I biome · Stony Field · base (height), Act I biome · Stony Field · wet (albedo), Act I biome · Stony Field · wet (height), Act I biome · Stony Field · cover (albedo), Act I biome · Stony Field · cover (height), Act I biome · Tristram · base (albedo), Act I biome · Tristram · base (height), Act I biome · Tristram · wet (albedo), Act I biome · Tristram · wet (height), Act I biome · Tristram · cover (albedo), Act I biome · Tristram · cover (height), Act I biome · Dark Wood · base (albedo), Act I biome · Dark Wood · base (height), Act I biome · Dark Wood · wet (albedo), Act I biome · Dark Wood · wet (height), Act I biome · Dark Wood · cover (albedo), Act I biome · Dark Wood · cover (height), Act I biome · Black Marsh · base (albedo), Act I biome · Black Marsh · base (height), Act I biome · Black Marsh · wet (albedo), Act I biome · Black Marsh · wet (height), Act I biome · Black Marsh · cover (albedo), Act I biome · Black Marsh · cover (height), Act I biome · Tamoe Highland · base (albedo), Act I biome · Tamoe Highland · base (height), Act I biome · Tamoe Highland · wet (albedo), Act I biome · Tamoe Highland · wet (height), Act I biome · Tamoe Highland · cover (albedo), Act I biome · Tamoe Highland · cover (height), Act I biome · Monastery Courtyard · base (albedo), Act I biome · Monastery Courtyard · base (height), Act I biome · Monastery Courtyard · wet (albedo), Act I biome · Monastery Courtyard · wet (height), Act I biome · Monastery Courtyard · cover (albedo), Act I biome · Monastery Courtyard · cover (height), Act I biome · Cave · base (albedo), Act I biome · Cave · base (height), Act I biome · Cave · wet (albedo), Act I biome · Cave · wet (height), Act I biome · Cave · cover (albedo), Act I biome · Cave · cover (height), Act I biome · Catacombs · base (albedo), Act I biome · Catacombs · base (height), Act I biome · Catacombs · wet (albedo), Act I biome · Catacombs · wet (height), Act I biome · Catacombs · cover (albedo), Act I biome · Catacombs · cover (height) — are project tiles generated with Codex image generation in the style of the D2R moor tiles (`art-output/terrain-biomes`), made tileable by that folder's `process.py` and resized by `scripts/prepare-terrain-biomes.py`.

The Dark Wood sets — Dark Wood (realistic) · loam ground (albedo), Dark Wood (realistic) · loam ground (height), Dark Wood (realistic) · loam ground (normal), Dark Wood (realistic) · loam ground (roughness), Dark Wood (realistic) · wet ground (albedo), Dark Wood (realistic) · wet ground (height), Dark Wood (realistic) · wet ground (normal), Dark Wood (realistic) · wet ground (roughness), Dark Wood (realistic) · shade grass (albedo), Dark Wood (realistic) · shade grass (height), Dark Wood (realistic) · shade grass (normal), Dark Wood (realistic) · shade grass (roughness), Dark Wood (realistic) · cobble path (albedo + alpha), Dark Wood (realistic) · cobble path (height), Dark Wood (realistic) · cobble path (normal), Dark Wood (realistic) · grass cards (RGBA atlas) (realistic), and Dark Wood (stylized) · loam ground (albedo), Dark Wood (stylized) · loam ground (height), Dark Wood (stylized) · loam ground (normal), Dark Wood (stylized) · loam ground (roughness), Dark Wood (stylized) · wet ground (albedo), Dark Wood (stylized) · wet ground (height), Dark Wood (stylized) · wet ground (normal), Dark Wood (stylized) · wet ground (roughness), Dark Wood (stylized) · shade grass (albedo), Dark Wood (stylized) · shade grass (height), Dark Wood (stylized) · shade grass (normal), Dark Wood (stylized) · shade grass (roughness), Dark Wood (stylized) · cobble path (albedo + alpha), Dark Wood (stylized) · cobble path (height), Dark Wood (stylized) · cobble path (normal), Dark Wood (stylized) · grass cards (RGBA atlas) (stylized) — are project textures generated with Codex image generation after a Diablo Immortal Dark Wood screenshot (`art-output/terrain-darkwood`; the stylized set is its `stylized2` repaint, kept with the Ashlar art in `ashlar/art/terrain-dark-wood/stylized2`), made tileable by `scripts/prepare-terrain-darkwood.py`; normal and roughness maps are derived from the height maps by the same script.

The greener Dark Wood set — Dark Wood (stylized, green) · loam ground (albedo), Dark Wood (stylized, green) · loam ground (height), Dark Wood (stylized, green) · loam ground (normal), Dark Wood (stylized, green) · loam ground (roughness), Dark Wood (stylized, green) · wet ground (albedo), Dark Wood (stylized, green) · wet ground (height), Dark Wood (stylized, green) · wet ground (normal), Dark Wood (stylized, green) · wet ground (roughness), Dark Wood (stylized, green) · shade grass (albedo), Dark Wood (stylized, green) · shade grass (height), Dark Wood (stylized, green) · shade grass (normal), Dark Wood (stylized, green) · shade grass (roughness), Dark Wood (stylized, green) · cobble path (albedo + alpha), Dark Wood (stylized, green) · cobble path (height), Dark Wood (stylized, green) · cobble path (normal), Dark Wood (stylized, green) · grass cards (RGBA atlas) — is the stylized set recoloured in CIELAB hue and chroma only (same strokes) by `ashlar/art/terrain-dark-wood/recolor_green.py` and built with `scripts/prepare-terrain-darkwood.py` from `ashlar/art/terrain-dark-wood/stylized2_green`.

The Dark Wood cobble road tiles — Dark Wood (stylized) · cobble road tile (albedo, repeats in u and v), Dark Wood (stylized) · cobble road tile (normal), Dark Wood (stylized, green) · cobble road tile (albedo, repeats in u and v), Dark Wood (stylized, green) · cobble road tile (normal) — are cut and joined by `scripts/prepare-road-tile.py` from the Codex-generated stylized2 Dark Wood path strip (ashlar/art/terrain-dark-wood); project-internal.

The Poly Haven terrain scans — Poly Haven · Brown Mud 02 (albedo, Act I palette), Poly Haven · Brown Mud 02 (height), Poly Haven · Brown Mud 02 (normal), Poly Haven · Brown Mud 02 (roughness), Poly Haven · Brown Mud 03 (albedo, Act I palette), Poly Haven · Brown Mud 03 (height), Poly Haven · Brown Mud 03 (normal), Poly Haven · Brown Mud 03 (roughness), Poly Haven · Forest Ground 01 (albedo, Act I palette), Poly Haven · Forest Ground 01 (height), Poly Haven · Forest Ground 01 (normal), Poly Haven · Forest Ground 01 (roughness) — are CC0 1.0 (public domain) from Poly Haven: brown_mud_02, brown_mud_03 and forrest_ground_01 by Rob Tuytel (https://polyhaven.com). Resized to 1024 px, heights re-centred and albedos matched to the Act I palette by `scripts/prepare-terrain-polyhaven.py`.

The D2R lush grass set — D2R lush grass · grass patch mix (albedo), D2R lush grass · grass patch mix (height), D2R lush grass · sparse grass + soil (albedo), D2R lush grass · sparse grass + soil (height), D2R lush grass · damp ground + puddles (albedo), D2R lush grass · damp ground + puddles (height) — are project tiles generated with Codex image generation after a D2R gameplay screenshot (`art-output/terrain-grass-d2r`), made tileable and mixed by `scripts/prepare-terrain-meadow.py`.
The prop kits Wooden fence kit (15 pieces), Wooden palisade kit (15 pieces, PBR), Medieval tent kit (8 pieces, PBR) and
Stylized shrub kit (18 pieces) are project prop sheets (generated with Tripo) split into real-size pieces by
`scripts/prepare-prop-kit.py`. Moor boulder (Tripo, on ground patch) is a single prop generated with Tripo from
the project concept sheet `asset_08_rock_sheet.png`, split into boulder and ground patch by the same script
(`--height 2.0`). The camp kits (Camp tents B (6 pieces), Camp kitchen kit (7 pieces), Camp storage kit (7 pieces), Training yard kit (6 pieces), Drying lines & crafts kit (6 pieces), Camp lights kit (6 pieces), Banners & signs kit (6 pieces), Camp seating kit, Shrine & graves kit, Animal pen kit, Ground clutter kit, Work stations kit) come from the project camp prop sheets asset_13–24, made 3D with Tripo and split by `scripts/prepare-camp-kits.py`.
The nature kits (Moor rocks kit (9 pieces), Mossy rocks kit (6 pieces), Buried monster remains kit (6 pieces),
Dead trees kit (14 pieces), Burned trees kit (8 pieces)) come from the project nature prop sheets asset_08–12 (and
one-row images composed from their lower rows), made 3D with Tripo and split, levelled and cut off their mud ovals by
`scripts/prepare-nature-kits.py`.

The gameplay HUD sprites (`src/gameplay/hud/*.webp`: orb housings and globes, stone bar, slots, buttons, name plate, skill and potion icons)
are project art generated with Codex image generation as chroma-key sheets (`art-output/ui-hud-assets`), cut by that folder's
`slice.py` and resized by `scripts/prepare-hud.py`.

The same credits are shown in the app (Help → Sample asset credits) and stored in
`src/assets/samples.json`.

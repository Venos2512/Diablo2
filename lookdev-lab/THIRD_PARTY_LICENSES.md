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
The prop kits Wooden fence kit (15 pieces), Wooden palisade kit (15 pieces, PBR), Medieval tent kit (8 pieces, PBR) and
Stylized shrub kit (18 pieces) are project prop sheets (generated with Tripo) split into real-size pieces by
`scripts/prepare-prop-kit.py`. Moor boulder (Tripo, on ground patch) is a single prop generated with Tripo from
the project concept sheet `asset_08_rock_sheet.png`, split into boulder and ground patch by the same script
(`--height 2.0`).

The same credits are shown in the app (Help → Sample asset credits) and stored in
`src/assets/samples.json`.

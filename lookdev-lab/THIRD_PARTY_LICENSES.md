# Third-party software and assets

Everything procedural in this project — Act I environments, forged textures, shaders, VFX, spells,
training dummies — is original to Sanctuary Lookdev Lab. The items below are third-party and keep
their own licenses.

## Software

| Package | Version | License | Notes |
| --- | --- | --- | --- |
| three.js | 0.180.0 | MIT | Renderers, TSL, loaders, post-processing nodes, lil-gui (MIT) and the Draco / Basis (KTX2) decoders shipped in `examples/jsm/libs` (Apache-2.0). |
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
| Moonless Golf (night) | CC0-1.0 | Poly Haven | [polyhaven.com](https://polyhaven.com/a/moonless_golf) |
| Quarry 01 (overcast) | CC0-1.0 | Poly Haven | [polyhaven.com](https://polyhaven.com/a/quarry_01) |
| Royal Esplanade (sun) | CC0-1.0 | Poly Haven | [polyhaven.com](https://polyhaven.com/a/royal_esplanade) |

Textures of Lantern, Pot of Coals and Glass Hurricane Candle Holder were re-encoded to 1024 px to keep
the offline build small; geometry is unchanged. HDRIs are the 1k versions.

The same credits are shown in the app (Help → Sample asset credits) and stored in
`src/assets/samples.json`.

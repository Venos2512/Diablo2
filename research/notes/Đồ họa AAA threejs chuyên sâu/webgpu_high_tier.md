# WebGPU high tier for an isometric Diablo II-style ARPG: compute/TSL techniques and WebGPU platform status (as of 19 Oct 2026)

Scope notes for the report writer:
- Project context: the lab is pinned to three.js r180, with WebGLRenderer+GLSL and WebGPURenderer+TSL side by side. The camera is orthographic with near = -300. The WebGPU terrain already hit the 16-samplers-per-stage cap. The latest three.js is r186 (0.186.1); r187 is in development.
- "Source" below means I read the code: three.js npm 0.186.1 via jsDelivr, the `dev` branch via raw.githubusercontent, the gpuweb spec sources, the WebKit and Firefox sources, and the Chrome Platform Status JSON API.
- Every "Inference" is mine and is not stated by the cited source.

## 1. Screen-space GI on the web: SSGINode internals, Radiance Cascades (web demos, holographic, 3D/screen-space, PoE2's "2D + 1D" variant), fit for a fixed iso camera with many spell lights, browser benchmarks

### Takeaway
**SSGINode (r181).** It is a TSL port of Unity's SSRT3. It walks GTAO-style horizon slices and tracks occlusion in a 32-sector visibility bitmask, taking `sliceCount × stepCount × 2` depth samples per pixel (default 1 × 12 → 24). It is designed around TRAA. Limitations:
- It always renders at full drawing-buffer resolution (open issue #34797).
- It needs `rg11b10ufloat-renderable`.
- Its code assumes a perspective camera.

**Radiance Cascades on the web.** These exist as 2D demos and packages (jason.today's WebGL posts, TypeGPU's holographic/SDF runners) and one unlicensed WebGL 3D experiment (three-rc).

**Best conceptual fit: Path of Exile 2's variant.** PoE2 uses a "flatland-like" screen-space cascade hierarchy:
- a 2D screen probe grid whose angular resolution grows only in 1D (probes scale as 2^i × 1);
- screen-space raymarching of 4 rays at once into a 128-bit occlusion bitmask;
- about 3 ms on a GTX 1050.

This is the closest match to a fixed iso camera with many spell lights. Cost does not depend on light count, and the method is noiseless, with no temporal lag. But no web implementation exists to adopt.

### Cited Findings
**SSGINode: release, provenance, parameters**
- SSGINode shipped in r181 (released 19 Nov 2025). It came from PR #31839 plus follow-ups #31865, #31867, #31863, #31873, #31881, #31890 and #31882 (Mugen87, zalo). It is absent from r180. — [r181 release](https://github.com/mrdoob/three.js/releases/tag/r181); [r180 has no SSGINode.js (jsDelivr listing)](https://data.jsdelivr.com/v1/packages/npm/three@0.180.0?structure=flat)
- PR #31839 was opened 7 Sep 2025 and merged 8 Sep 2025. It is "a complete port of the Unity code" (SSRT3). The PR also states:
  - default settings run "with 60 FPS on a Pixel 8a and a macMini" (with a high-resolution Studio Display);
  - slice count "has a huge performance impact";
  - the node "works best with temporal filtering", with `denoise()` suggested for the non-temporal path.

  — [PR #31839](https://github.com/mrdoob/three.js/pull/31839)
- The source docs cite SSRT3, the "ssaovb" code post and the SSILVB slides. They give total samples per pixel as `sliceCount * stepCount * 2`.
  - Presets with temporal filtering: Low 1/12, Medium 2/8, High 3/16.
  - Presets without temporal filtering: Low 2/6, Medium 3/8, High 4/12.
  - Defaults: sliceCount 1 (range 1–4), stepCount 12 (1–32), radius 12 world units, giIntensity 10, expFactor 2, thickness 1, useScreenSpaceSampling true, backfaceLighting 0.

  — [SSGINode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/display/SSGINode.js)

**SSGINode: algorithm, temporal filtering, outputs (from source)**
- Bitmask algorithm, per slice and side:
  - Horizon samples are converted into front/back horizon angles with the GTAO fast-acos approximation.
  - These become a 32-bit sector bitfield (`MAX_RAY = 32`), which is OR-accumulated into a per-slice occlusion mask.
  - Newly occluded sectors, counted with `countOneBits`, weight the beauty-pass colour at the sample, times the receiver N·L and the emitter-facing term.
  - AO = occluded sectors / 32. GI luminance is clamped to 7.

  — [SSGINode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/display/SSGINode.js)
- Temporal filtering. With `useTemporalFiltering = true` (the default), the slice direction rotates per frame through [60, 300, 180, 240, 120, 0]° and the step offset through [0, 0.5, 0.25, 0.75]. Both sequences come from the Activision GTAO paper. This mode "requires the usage of TRAANode"; otherwise a manual DenoiseNode is required. — [SSGINode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/display/SSGINode.js)
- Outputs go to a 2-attachment MRT: AO in R8, GI in RG11B10 (`UnsignedInt101111Type`). On the WebGPU backend the node logs an error if the device lacks `rg11b10ufloat-renderable`. — [SSGINode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/display/SSGINode.js)
- r185 changes to SSGINode: "Use a half float render target" (#33769), "Optimize code" (#33782), "Reduce bandwidth with RG11B10" (#33822). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)
- In `dev` (r187), SSGINode extends `Node` instead of `TempNode` and uses `isBackgroundDepth()`. — [SSGINode.js dev](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/tsl/display/SSGINode.js)
- The r186 example feeds SSGI with MRT view normals (packed RGB8), uses sliceCount 2 and stepCount 8, then TRAA. — [webgpu_postprocessing_ssgi.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_postprocessing_ssgi.html)

**SSGINode: perspective assumptions, resolution, known issues**
- Perspective assumptions in the code, with no orthographic branch:
  - `_halfProjScale = height / (tan(camera.fov/2) * 2) * 0.5`, used only when `useScreenSpaceSampling = false`;
  - the view direction is `normalize(-viewPosition)`;
  - the constructor documents `camera` as a PerspectiveCamera.

  — [SSGINode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/display/SSGINode.js)
- Resolution: SSGINode, TemporalReprojectNode and RecurrentDenoiseNode size their targets from `renderer.getDrawingBufferSize()` every frame, not from their inputs (issue #34797, opened 5 Oct 2026, open).
  - At a 1/1.5 render scale SSGI shades about 2.25× the needed pixels.
  - Pinning SSGI to its input size cut whole-frame GPU time from 9.9 ms to 5.8 ms on an Apple M5 Pro.
  - Mugen87: resolution scaling "isn't supported yet", and effects can break below scale 1.
  - A `resolutionScale` PR (#33770) was closed unmerged.

  — [issue #34797](https://github.com/mrdoob/three.js/issues/34797)
- Other known issues:
  - "AO/SSGI: Noise reduction" is open (June 2026). — [issue #33915](https://github.com/mrdoob/three.js/issues/33915)
  - "SSGI calculation is not correct" was closed in Nov 2025. — [three.js issue search "SSGI"](https://github.com/mrdoob/three.js/issues?q=is%3Aissue+SSGI)
  - During review, output on the WebGL fallback "looked wrong" (zalo), and the GLSL AO looked darker (Mugen87). — [PR #31839](https://github.com/mrdoob/three.js/pull/31839)
  - Ghosting appears under camera motion, as with temporal techniques generally. — [PR #31839](https://github.com/mrdoob/three.js/pull/31839)

**SSRT3: the original the port is based on**
- SSRT3 (Unity HDRP) is horizon-based (GTAO family). The README gives:
  - "around 2-3 ms on an RTX 3060 for the entire effect";
  - a 32-bit bitmask to let light pass behind thin surfaces;
  - "using 4 slices per pixel instead of 1 is roughly 4x more costly";
  - extra options (mip optimization, normal approximation) that I did not find in the three.js port.

  — [SSRT3 README](https://github.com/cdrinmatane/SSRT3)

**Radiance Cascades: Sannikov's paper and PoE2**
- The paper uses the JCGT template but was "never sent to any journal". — [RadianceCascadesPaper README](https://github.com/Raikiri/RadianceCascadesPaper)
- PoE2 uses "a flatland-like screenspace radiance cascade hierarchy and populates them using screenspace raymarching — a choice motivated by PoE2's fixed camera." — [Sannikov, Radiance Cascades (PDF)](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Flatland/screen-space scaling:
  - cascade 0 stores directions "uniformly distributed ... in image space";
  - cascade i+1 has 1/4 of the probes (half per axis) and 2× the directions;
  - memory per cascade halves, so all cascades together cost exactly 2× cascade 0.

  — [paper PDF](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- PoE2 GI "raymarches 4 rays simultaneously, basically for free and stores occlusion in 128-bit bitmask, that is equivalent to storing 128 binary occlusion rays per radiance cascade texel." Figure 15: "running in 3ms on GTX1050 and used to calculate indirect light coming from a glowing character." The detailed scheme is "outside of the scope of this article". — [paper PDF](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Two layouts compared:
  - Screen-space probes with world-space intervals use 2^i × 2^i octahedral probes placed on the depth buffer 2^i px apart. They interpolate bilaterally in space and bilinearly in direction, and they capture off-screen and occluded emitters.
  - PoE2's probes "scale as 2^i × 1 (same as flatland), can't capture offscreen light sources, but it works 1 to 2 orders of magnitude faster."

  — [paper PDF](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Merging:
  - Adjacent intervals combine as L_a,c = L_a,b + β_a,b·L_b,c, with β_a,c = β_a,b·β_b,c. Back-to-front and front-to-back give identical results.
  - For diffuse lighting, cascades N−1..0 are merged onto cascade 0 "by just averaging 2 or 4 texels of cascade i+1".
  - Cascade data is linearly interpolable in space and direction under the penumbra condition, "without the need of any bilateral filtering or disocclusion schemes".

  — [paper PDF](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Stated limits of the screen-space version:
  - "light sources outside of the view don't cast indirect light, invisible occluders don't cast shadows";
  - no data behind the depth buffer;
  - cascade 0 at high detail "can take milliseconds".

  The 2D prototype's cost is scene-independent: "2, 10² and 100² particles in the same amount of time of about 12ms". — [paper PDF](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)

**Radiance Cascades: web and other implementations**
- jason.today "Radiance Cascades" (2D, GLSL fragment passes on three.js render targets, ping-pong):
  - base ray count 4 or 16; rays per cascade base^(i+1); probe spacing sqrtBase^i; cascade count ceil(log(diagonal)/log(base)) + 1;
  - jump-flood distance field for sphere marching;
  - bilinear merge "nearly free smoothing"; unresolved ringing;
  - half-resolution radiance by default (`rcScale` 2);
  - no measured FPS/ms;
  - links to an earlier post (./gi) on raymarching, JFA and distance fields.

  — [jason.today/rc](https://jason.today/rc)
- Holographic Radiance Cascades (Freeman, Sannikov, Margel; arXiv, 4 May 2025): 2D, single-shot, noiseless, constant cost for a given scene size. 1.85 ms at 512×512 and 7.67 ms at 1024×1024 on an RTX 3080 Laptop GPU. — [arXiv:2505.02041](https://arxiv.org/abs/2505.02041)
- `@typegpu/radiance-cascades` (Software Mansion, ©2026, WebGPU):
  - 2D only;
  - a holographic runner (cites Freeman et al. 2025; `tracedLevels` default 3; four sectors; one compute pass) and an SDF runner;
  - `rgba16float` output;
  - memory O(N² log N): about 38 MiB at 512² and 160 MiB at 1024².

  — [TypeGPU RC docs](https://docs.swmansion.com/TypeGPU/ecosystem/typegpu-radiance-cascades/)
- three-rc (Cody Bennett): 3D RC with screen-space probes stored in "a screen-sized texture" and BVH tracing (three-mesh-bvh).
  - It captures off-screen occluders and emitters, and is "noise-free ... without any temporal accumulation".
  - Tracing can be swapped for a screen-space raymarcher (Tiny Glade's).
  - It uses Sannikov's depth-aware upscaler, so it has no license ("All rights reserved").
  - It is WebGL and depends on three ^0.181.2.

  — [three-rc README](https://github.com/CodyJasonBennett/three-rc)
- Chalmers MSc thesis (Abou Dan & Jensen 2025, for the game *As We Descend*): RC combined with visibility-bitmask GI, with screen-space probes and no temporal accumulation.
  - 2 ms low, 6 ms medium, 26 ms high; memory 0.03–3.9 GiB (GPU not stated).
  - Flicker under small movements is "the worst issue".
  - Positioned for a "fixed, on-screen camera".

  — [Chalmers thesis](https://odr.chalmers.se/items/9e42007a-bb60-440f-ba28-04410822758f/full)
- The Babylon.js forum thread on radiance cascades (July 2024) is a feature request with no implementation. — [Babylon.js forum](https://forum.babylonjs.com/t/radiance-cascades-lighting/51754)
- The luma.gl SSGI pass is WebGPU-only:
  - screen-space hemisphere trace, `rayCount` 7, `stepCount` 8;
  - six render passes;
  - `rgba16float` history reprojected by velocity;
  - on-screen data only.

  — [luma.gl SSGI pass](https://luma.gl/next/docs/api-reference/shadertools/shader-passes/screen-space-global-illumination)

### Inferences
**Fit for many short-lived spell lights**
- Screen-space gatherers that read the lit beauty buffer (SSGINode, PoE2-style RC) turn every on-screen spell light into bounce light at no per-light cost. Cost scales with resolution and settings only.
  - RC's scene independence is shown explicitly in the paper.
  - SSGINode's loop is per pixel, with no light loop.
  - VXGI (max 8 injected lights) and baked probe grids cannot do this.

**SSGINode in the lab**
- Usable as a high-tier option now (r181+), with caveats:
  1. **Ortho patch needed.** For an orthographic projection the view vector should be the constant (0,0,1) in view space, not `normalize(-viewPosition)`. Keep `useScreenSpaceSampling = true` to avoid the fov-based path. Depth reconstruction via `getViewPosition(uv, depth, projInv)` works for any projection matrix.
  2. **Full resolution only.** No `resolutionScale`; the only workaround is the `getDrawingBufferSize` override described in #34797.
  3. **TRAA dependency.** It relies on TRAA for convergence, and fast, flashy spell VFX will ghost.
  4. **Short reach.** The effective reach is a screen-space neighbourhood. That suits spell-on-floor/wall bounce, not long-range GI.
- Rough load: 1080p is about 2.07 Mpx × 24–32 depth taps (default/example settings), plus beauty/normal fetches on hits, every frame at full resolution.

**PoE2-style screen-space RC**
- Best quality/cost fit for this genre: an iso ARPG with a fixed camera and glowing-character lighting is exactly PoE2's case.
  - No temporal accumulation, so no lag on flashing spells.
  - About 3 ms on a 2016 entry-level discrete GPU (GTX 1050), though resolution is not stated.
- But the key part (packing the 128-bit bitmask raymarch, cascade parameters) is unpublished. A TSL compute implementation would be an R&D project.
- An orthographic camera should make screen-space marching simpler: linear depth, constant world-units-per-pixel, parallel view rays.

**Off-screen loss**
- With an iso camera, lights just off-screen pop in at the edges. A guard band (computing depth/GI over a slightly larger viewport) is the usual mitigation.

**Suggested path**
- High tier v1: SSGINode, patched for ortho and run at reduced resolution.
- High tier v2: custom PoE2-style screen-space RC if the bounce look is central to the art direction.
- three-rc cannot be reused: it has no license, and Sannikov's upscaler is unlicensed.

### Gaps
- No in-browser (WebGPU) benchmarks of SSGI or RC on integrated GPUs (Intel Iris Xe/UHD, AMD APUs) were found. The only data points are the Pixel 8a/Mac mini anecdotes, one M5 Pro whole-frame figure, and native numbers (GTX 1050, RTX 3060, RTX 3080 Laptop).
- The paper omits PoE2's exact parameters: probe spacing, cascade count, the resolution behind the 3 ms, and how the 4 rays map into the 128-bit mask. No Grinding Gear Games source was found.
- SSGINode's behaviour with an orthographic camera was not tested; the perspective assumptions are inferred from code only.
- "Split Radiance Cascades" (Freeman & Sannikov, sparse world-space hash-map probes) surfaced in a search snippet on gamedev.net, but the page returned HTTP 403. Details and date are unverified.
- No Shadertoy 3D/screen-space RC demos were verified (search budget).

## 2. Other GI: VXGINode (r186), LightProbeGrid (r184 WebGL / r186 WebGPU), DDGI-style probes in WebGPU compute

### Takeaway
**VXGINode (r186, merged 31 Aug 2026).** Dense voxel cone tracing for diffuse GI and AO. Static meshes are voxelized in compute. Up to 8 direct lights are injected per voxel from the renderer's existing shadow maps, and bounces are cached in a 3D mip chain. Default voxel resolution is 128 (maximum 256). It is WebGPU-only, gives 60 FPS on a Pixel 8a with defaults, and is a poor fit for large open scenes and dynamic occluders.

**LightProbeGrid (r184 for WebGLRenderer, r186 for WebGPURenderer).** A baked L2-SH irradiance volume, cheap at runtime. Baking is GPU-resident and incremental since r186 (`start`/`count`/`pass`), and grids can fade out (`falloff`) to blend overlapping volumes. It has no visibility data, so it leaks.

**DDGI on the web.** It exists only as third-party code: speedball-gi (BVH-traced, three r185–r186) and Usnul's own engine "Shade".

### Cited Findings
**VXGINode: PR and node API**
- PR #34402 "VXGINode: Voxel Cone Tracing for Diffuse GI" was merged 31 Aug 2026 (r186 milestone). From the PR:
  - It uses a dense voxel grid instead of the paper's sparse octree: "much better performance" but a poor fit for large, open scenes.
  - An opt-in `directionalRadiance` reduces leaking at extra cost.
  - Defaults (3 cones, 40°) give "60 FPS in both demos with a medium-tier mobile device (Pixel 8a)".
  - It needs compute shaders and storage buffers, so WebGPU only.
  - BatchedMesh is unsupported.
  - Occluders should stay static because voxelization is costly; dynamic occluder updates are on the roadmap.
  - It has noise and disocclusion artifacts and can look darker than ground truth.

  — [PR #34402](https://github.com/mrdoob/three.js/pull/34402)
- r186 was released 24 Sep 2026. — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)
- Node docs:
  - described as a "middle path between SSGI and Light Probe Grids";
  - `coneCount` 2–8 (default 3; "2 - 4 is the recommended setting. Use 2 for performance restricted use cases");
  - aperture 10–90° (default 40);
  - "Lights and their shadow maps are picked up automatically. Only direct lights are injected.";
  - temporal mode requires TRAANode, with cones rotated per frame;
  - `resolution` default 128 voxels along the longest axis, "Should not exceed 256" (storage-buffer size of the voxelizer);
  - "can only be used with WebGPURenderer and a WebGPU backend".

  — [VXGINode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/vxgi/VXGINode.js)

**VXGIVolume and scene collector internals**
- Representation and voxelization:
  - a dense-mip-chain variant of Crassin et al. 2011 (cone samples need two texture fetches);
  - anisotropic per-axis opacity;
  - radiance premultiplied by occupancy;
  - indirect bounces (0–2, default 1) cached in the volume;
  - conservative voxelization along the dominant triangle axis in a compute shader (`atomicOr` into an occupancy buffer).

  — [VXGIVolume.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/vxgi/VXGIVolume.js)
- Direct light injection:
  - every occupied voxel samples the renderer's shadow maps (2D maps for directional/spot lights, cube maps for point lights);
  - lights without a shadow map fall back to a visibility cone traced through the volume;
  - cost is proportional to "the number of occupied voxels times lights";
  - only diffuse outgoing radiance is stored;
  - `maxLights` defaults to 8.

  — [VXGIVolume.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/vxgi/VXGIVolume.js)
- Texture formats: opacity RGBA8; radiance, ping-pong and direct volumes RGBA16F (half float), with mip chains. — [VXGIVolume.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/vxgi/VXGIVolume.js)
- The scene collector voxelizes Mesh objects only: not BatchedMesh, not sky meshes, and only those passing the layer test. InstancedMesh is handled. — [VXGISceneCollector.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/vxgi/VXGISceneCollector.js)

**VXGI follow-ups and LightMapper**
- Follow-ups:
  - #34933 "VXGIVolume: Improve disposal", merged 9 Oct 2026;
  - a moving light was added to the VXGI Sponza example (#34493) and then reverted (#34495);
  - "[WIP] Instant Radiosity via Virtual Point Lights" (#34915) was closed unmerged.

  — [three.js search "VXGI"](https://github.com/mrdoob/three.js/issues?q=VXGI)
- LightMapper PR #34991 (open, r187 milestone, WebGPU-only):
  - bakes diffuse lightmaps from `lightProbeGridIrradiance()` or `vxgiIrradiance()`;
  - auto-unwraps UVs;
  - exports glTF via MOZ_lightmap.

  Mugen87 noted that VXGI resolution in the example was too low: "128 or 256 with an updated normal offset reduces light bleeding". — [PR #34991](https://github.com/mrdoob/three.js/pull/34991)

**LightProbeGrid: releases and design**
- PR #33125 (r184, merged 16 Apr 2026) added LightProbeGrid for WebGLRenderer:
  - L2 SH (upgraded from L1 in review because L2 "can retain almost all characteristics of an irradiance environment map");
  - one RGBA 3D atlas with hardware trilinear filtering;
  - "zero CPU readback" GPU bake;
  - the Sponza example uses 147 probes (7×7×3);
  - mrdoob: "light leaking is hard to solve";
  - +891 B gzipped.

  — [PR #33125](https://github.com/mrdoob/three.js/pull/33125)
- Later releases:
  - r185: indirect bounces option for `bake()` (#33657). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)
  - r186: renamed to LightProbeGridWebGL (#33911), added the WebGPURenderer version (#33913), added incremental baking (#34486). — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)

**LightProbeGrid: API (WebGPU version)**
- It is a `Light`: adding it to the scene applies the baked irradiance "to every lit node material automatically".
  - Constructor: `(width, height, depth, widthProbes, heightProbes, depthProbes)`; probe counts default to `max(2, round(size)+1)`.
  - `bake(renderer, scene, {cubemapSize=8, near=0.1, far=100, bounces=0, sampleCount=512, start, count, pass})`. Ranges fill X, then Z, then Y (horizontal layers bottom to top).
  - Shadow-casting SunLights are temporarily replaced by directional lights during the bake.
  - `falloff` (default 0): "Use a small positive value to blend multiple overlapping grids".
  - Storage: seven packed SH sub-volumes in one RGBA `RenderTarget3D` (HalfFloat in the WebGPU version).

  — [LightProbeGrid.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/LightProbeGrid.js)
- Shading offsets the sample position "along the normal by half a probe spacing" and evaluates L2 SH irradiance. Texel padding prevents trilinear bleeding between sub-volumes. — [LightProbeGridNode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/lighting/LightProbeGridNode.js)
- The WebGL version is "only used with WebGLRenderer", uses a `WebGL3DRenderTarget` atlas, and is also a GPU-resident bake. — [LightProbeGridWebGL.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/LightProbeGridWebGL.js)
- PR #34486 (merged 7 Sep 2026, r186) added incremental baking:
  - Sponza examples bake "four probes per frame";
  - complete and incremental bakes "produced identical coefficients" on WebGPU, the WebGL fallback and WebGLRenderer.

  — [PR #34486](https://github.com/mrdoob/three.js/pull/34486)

**DDGI-style probes on the web**
- speedball-gi (MIT; latest 0.8.0, 23 Sep 2026): "Real-time BVH-traced dynamic diffuse global illumination for three.js WebGPU and its WebGL2 fallback".
  - Peer dependencies: three >=0.185 <0.187 and three-mesh-bvh.
  - Example settings: `divisions: 16, rays: 64, cascades: 1`.
  - Continuous solving, with auto change detection or explicit dirty events.
  - Not compatible with classic WebGLRenderer.

  — [speedball-gi (npm)](https://www.npmjs.com/package/speedball-gi)
- speedball-gi advanced docs:
  - The WebGL path uses fragment passes with history copies and "lacks compute workgroup sharing".
  - The `clusteredLighting` option swaps in three's Forward+ clustered node; GI keeps "a fixed 64-light arena".
  - Receivers use probe visibility and depth-moment parallax correction for reflections.
  - Convergence is temporal; large worlds waste probes.
  - Its Limitations list says "WebGPU only" and "Tested against Three >=0.185.0 <0.186.0", which contradicts the README and package peer range.

  — [speedball ADVANCED.md](https://cdn.jsdelivr.net/npm/speedball-gi@0.8.0/docs/ADVANCED.md)
- Shade (Usnul's own WebGPU engine, not three.js), post of 28 Dec 2025: DDGI "largely based on" Gentle Light Probing, with:
  - about 2,500 probes;
  - per-probe depth maps;
  - normal-based visibility and parallax correction;
  - 4 probes sampled per pixel.

  — [three.js forum, Shade #116](https://discourse.threejs.org/t/shade-webgpu-graphics/66969/116)

### Inferences
**LightProbeGrid for tiled dungeons**
- This is the best GI baseline for tiled dungeons on both tiers: LightProbeGridWebGL for WebGLRenderer, LightProbeGrid for WebGPURenderer.
  - Bake one grid per room/tile and blend at doorways with `falloff`. Bake at load incrementally (four probes per frame in the examples) or offline.
  - Characters and loot moving through a room receive GI, because the lookup is per fragment world position.
- Bake cost from the code: each probe renders the scene into 6 cube faces at 8×8 by default, plus an SH projection pass. A 490-probe Sponza grid is therefore about 2,940 small scene renders per pass, multiplied by bounce passes.
- Weaknesses:
  - Leaks through thin dungeon walls: the atlas holds 27 SH floats per probe and no depth/visibility data, and the only mitigation is the half-spacing normal offset. Align grids to room bounds.
  - No contribution from transient spell lights.
- **Sampler-cap risk for the lab:** the grid adds one more sampled 3D texture (texture + sampler) to every lit node material. A WebGPU terrain material already at the 16-sampler cap would overflow.

**VXGI: memory and fit**
- Memory estimate from the formats in VXGIVolume (not published): about 39 bytes per voxel (RGBA8 opacity plus three RGBA16F volumes with mips, plus two u32 per-voxel buffers).
  - Cubic 128³ volume: about 80 MB.
  - 128×32×128 (flat outdoor tile): about 20 MB.
  - `directionalRadiance` adds more.
- Fits small static dungeon rooms with a few "hero" lights (torches, the player's aura). Poor for many spell lights: 8-light cap, cost proportional to occupied voxels × lights, and re-injection whenever a light changes.
- Tiles streaming in force re-voxelization.
- It is WebGPU-backend-only, so strictly high tier.
- Its cone tracing is world-space from G-buffer positions; the camera position is only used in the debug view. It is probably the least camera-projection-sensitive of the GI nodes, but this is unverified for an orthographic camera.

**DDGI**
- speedball-gi is the only reusable three.js DDGI. It is BVH-based, pinned to r185–r186 and a one-person project. It suits outdoor fields with day/night more than tiled dungeons, and it adds BVH maintenance cost. It is not a near-term fit for an r180-pinned lab.

### Gaps
- Not published:
  - desktop or iGPU millisecond timings for VXGI;
  - VXGI memory use;
  - the cost of re-voxelization.
- No LightProbeGrid bake-time measurements exist; PRs only give "four probes per frame".
- No speedball-gi performance numbers appear in the README or ADVANCED docs I read.
- Not verified whether VXGI works correctly with an orthographic camera and a negative near plane.

## 3. Many lights: ClusteredLighting (r185) internals and limits, r187 spot/WebGL2 additions, tiled vs clustered culling for top-down cameras

### Takeaway
**ClusteredLighting (r185).** It replaced TiledLighting and implements Forward+ clustered shading:
- 32-px tiles × 24 exponential depth slices;
- a GPU compute pass builds per-cluster light lists (up to 64 per cluster, 1,024 lights total), after the CPU sorts lights by view Z each frame;
- in r185/r186 only non-shadow-casting point lights are clustered.

**r187-dev.** PR #34978 (merged 15 Oct 2026) adds spot lights and a WebGL2-backend fallback that uses transform-feedback compute.

**Not usable with the lab camera.** Both r186 and dev assume a perspective camera: slices use `log(depth/near)`, and cluster bounds use focal-length math. With the lab's orthographic camera (near = −300) the cluster grid would be NaN or wrong. For an iso ARPG, 2D screen tiles or a world-space XZ light grid fit better. Just Cause 2 shipped such a world grid, and three.js draft PR #34931 adds one for static lights.

### Cited Findings
**ClusteredLighting r185/r186: API and internals**
- Constructor: `ClusteredLighting(maxLights = 1024, tileSize = 32, zSlices = 24, maxLightsPerCluster = 64)`; usage is `renderer.lighting = new ClusteredLighting()`. — [ClusteredLighting.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/lighting/ClusteredLighting.js)
- Internals (r186):
  - Light data lives in a Float32 RGBA DataTexture (2 rows per light).
  - Each frame the CPU sorts lights by view-space Z and uploads per-slice index ranges for Z culling.
  - A compute pass runs one thread per cluster, testing sphere vs. view-space AABB, only over lights within the slice's Z range.
  - Fragments find their cluster as `floor(screenCoord/tileSize)` and `slice = floor(log(depth/near)/log(far/near)·NZ)`.
  - Cluster XY bounds come from `view_x = ndc_x·(−view_z)/projMatrix[0][0]`.
  - Lights are clustered only if `isPointLight && castShadow !== true`; all others stay on the per-material path.

  — [ClusteredLightsNode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/lighting/ClusteredLightsNode.js)
- PR #33406 (opened 17 Apr 2026, merged 22 Apr 2026, r185):
  - Defaults "32 px tiles, 24 depth slices, 64 lights per cluster, 1024 max lights". CPU-side Z-slice culling was added later.
  - sunag: "120 FPS using M2 Pro with 1000 lights", "never less of 100FPS". An early version ran at 9 FPS on a Mac mini.
  - The demo defaults to 700 lights.
  - Resize stutter was noted.
  - SpotLight support was listed as future work.

  — [PR #33406](https://github.com/mrdoob/three.js/pull/33406)
- r185 related changes: TiledLighting removed (#33751); "keep castShadow point lights on the material-lights path" (#33792); VolumetricLightingModel crash fix with clustered lights (#33896). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)

**r187-dev additions (PR #34978)**
- PR #34978 "ClusteredLighting: Add spot lights and WebGL2 fallback support" (opened 12 Oct, merged 15 Oct 2026, r187 milestone):
  - Spot lights are culled with the smallest sphere enclosing the cone.
  - On WebGL2, transform-feedback computes "can only write their own element", so each invocation fills one chunk. The light index buffer is an `instancedArray` with a PBO.
  - Shadowed spots, spots with a `map` or `colorNode`, IESSpotLight and ProjectorLight fall back to the default path.
  - Benchmark on an RTX 4070 / i9-13900K, Chrome 147, 1,024 point + 512 spot lights:
    - 720p: 708 fps (1.41 ms) vs 753 fps for the static grid of #34931;
    - 1440p: 342 fps (2.93 ms) vs 319 fps.
  - No WebGL2 numbers were given.

  — [PR #34978](https://github.com/mrdoob/three.js/pull/34978)
- The dev version stores 4 rows per light (position/cutoff, colour/decay, spot direction/cone, bounding sphere). It still uses exponential slicing with `log(depth/near)` and still excludes shadow-casting and `colorNode` lights. — [ClusteredLightsNode.js dev](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/tsl/lighting/ClusteredLightsNode.js)

**Related three.js work: static world grid and DynamicLighting**
- PR #34931 "WebGPURenderer: Batch static point and spot lights in a world-space grid" (draft, r187 milestone, opened 9 Oct 2026):
  - lights with `light.static = true`;
  - "the grid is not rebuilt when the camera moves";
  - WebGL support via PBOs was added;
  - no shadows or projected textures;
  - +2.09 kB gzipped.

  — [PR #34931](https://github.com/mrdoob/three.js/pull/34931)
- DynamicLighting (r184, #33042) batches analytic lights into uniform arrays and loops. Defaults: 8 directional, 16 point, 16 spot, 4 hemisphere. Shadow-casting lights, projected spot lights and node lights keep the default per-light path. — [DynamicLightsNode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/lighting/DynamicLightsNode.js); [r184 release](https://github.com/mrdoob/three.js/releases/tag/r184)

**Tiled vs clustered, and world-space grids (Humus, SIGGRAPH 2013)**
- Avalanche engine (Just Cause 3): 64×64 px tiles, 16 depth slices, CPU light assignment, exponential slicing with a special near cluster.
- Depth discontinuity across segments A–F:
  - default tiled culling pays A+B+C+D+E+F;
  - tiled with 2.5D culling pays A+F;
  - clustered pays about max(A, F).
- Depth slopes:
  - tiled with 2.5D still pays A+…+F;
  - clustered pays about max(A..F).
- Just Cause 2 used "World-space XZ-tiled light-indexing": 4 lights per 4 m × 4 m tile in a 128×128 RGBA8 index texture.
- "World space" clustering is listed as future work, since it "allows light evaluation outside of view-frustum".

— [Persson, Practical Clustered Shading (PDF)](https://www.humus.name/Articles/PracticalClusteredShading.pdf)

### Inferences
**ClusteredLighting is perspective-only (from code)**
- With an orthographic projection:
  - the exponential slice formula and `log(viewDepth/near)` are undefined when near ≤ 0 (lab: −300) and badly distributed even with near > 0;
  - the cluster XY reconstruction scales with depth (a perspective assumption), whereas ortho bounds should be `view_x = (ndc_x − P[3][0]) / P[0][0]`.
- Options: patch the node (linear Z slices, ortho bounds), use DynamicLighting for ≤16 point/spot lights, or build a world-space grid.

**Why depth clustering buys little in an iso view**
- The ground is a gentle slope relative to the view, so a 32-px tile's view-depth range is small. Example: at a 45° pitch with ~20 world units of screen height, a tile spans roughly 0.6 units of depth.
- Most spell-light spheres span several units, so Z slices add little. Only tall walls and props create real depth discontinuities.
- A world-space XZ grid (Just Cause 2 style; three.js #34931 for static lights) fits best: lights hug the ground plane, the grid is camera-independent and works with ortho, and it builds cheaply on CPU (hundreds of lights) or in compute.

**Practical setup for spell lights**
- Pool lights: keep a fixed array of PointLights and toggle intensity and position, to avoid scene-graph churn. Whether light-count changes force material recompiles under ClusteredLighting is unverified.
- Keep spell lights unshadowed. Shadow-casting point lights fall back to the per-material path and add cube shadow maps, which collides with the 16-sampler cap the lab already hit. Use contact/screen-space shadows for spell lights.

**Tier placement**
- With #34978 (r187) the clustered path also runs on WebGPURenderer's WebGL2 backend (not classic WebGLRenderer). Light culling is therefore not strictly a WebGPU-only feature.

### Gaps
- No three.js source, PR or doc mentions orthographic support for ClusteredLighting or TiledLighting. The incompatibility is inferred from code.
- No WebGL2-backend performance numbers for #34978. No integrated-GPU numbers for any clustered config.
- I found no source specific to top-down or isometric cameras on tiled vs clustered culling. The iso depth-range argument above is my own.
- Whether adding or removing clustered lights triggers node rebuilds or material recompiles was not verified.

## 4. Volumetric fog: froxel implementations for WebGPU/three.js, and r183 volumetric lighting with TRAA (how it works, cost)

### Takeaway
**three.js volumetrics.** three.js ships no froxel system. Its volumetrics are `VolumeNodeMaterial` + `VolumetricLightingModel`, both present since before r180: a per-pixel raymarch inside a volume mesh (default 25 steps) that evaluates every point, spot and rect-area light and its shadow map at each step. Directional lights are skipped.
- r183 (PR #32953) added a TRAA variant: 12 steps, IGN noise plus temporal jitter, full resolution in the main pass. It contrasts with the older ¼-resolution layer pass plus Gaussian blur.
- r183 also added GodraysNode (screen-space, shadow-map-based, one point or directional light) and exponential height fog.
- r186 added a post-process fog raymarch example that runs at 0.4× resolution (16 steps, joint-bilateral upsampling).

**Froxels on the web.** These exist outside three.js: Hilo3D 2.0-alpha (WebGPU) and Usnul's Shade engine.

### Cited Findings
**three.js volumetric material and lighting model**
- `VolumeNodeMaterial`: `steps` default 25; `offsetNode` for dithering; `scatteringNode` for density. The class exists in r180. — [VolumeNodeMaterial.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/materials/nodes/VolumeNodeMaterial.js); [VolumeNodeMaterial.js r180](https://cdn.jsdelivr.net/npm/three@0.180.0/src/materials/nodes/VolumeNodeMaterial.js)
- `VolumetricLightingModel`:
  - The ray runs between `cameraPosition` and the fragment's world position, reversed when inside 2× the model radius.
  - At each step it sets `shadowPositionWorld = positionRay` and accumulates in-scattering from the lights.
  - Beer's law: `exp(−density·0.01·stepSize)`.
  - `direct()` returns early for non-analytic lights and for lights whose `distance` is undefined (i.e., directional lights), and multiplies by the light's `shadowNode`.
  - Rect-area lights go through `LTC_Evaluate_Volume`.

  — [VolumetricLightingModel.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/nodes/functions/VolumetricLightingModel.js)

**Release history**
- r183 (released 20 Feb 2026):
  - "Add Volumetric Lighting using TRAA" (#32953);
  - `GodraysNode` (#32888);
  - `exponentialHeightFogFactor()` (#32659);
  - a basic fog scattering demo (#32613).

  — [r183 release](https://github.com/mrdoob/three.js/releases/tag/r183)
- r185: volumetric fire example enhancing the model (#33848); crash fix when combined with clustered lights (#33896). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)
- r186: "Add post-processing volumetric fog example" (#34319); "Improve fog scattering trees and performance" (#34491). — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)

**Example configurations (r186)**
- TRAA example:
  - a 20×10×20 additive transparent volume box with `steps = 12`;
  - `offsetNode = fract(IGN(screenCoordinate + temporalJitter·100) + temporalOffset)`;
  - a depth prepass supplies `depthNode`;
  - the scene pass with MRT velocity feeds `traa()`;
  - the GUI step range is 2–16.

  — [webgpu_volume_lighting_traa.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_volume_lighting_traa.html)
- Non-TRAA example: the volume is drawn on its own layer in a `pass()` with `setResolutionScale(.25)`, denoised by `gaussianBlur`, with `bayer16` dithering. — [webgpu_volume_lighting.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_volume_lighting.html)
- Post-processing fog example:
  - "Volumetric Cloud Fog using Depth Reconstruction, JBU & Gaussian Filtering";
  - `resolutionScale` 0.4, 16 steps;
  - density from a 96³ 3D noise texture;
  - rays start at the camera position;
  - a 5×5 joint-bilateral upsample.

  — [webgpu_postprocessing_fog.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_postprocessing_fog.html)

**GodraysNode (r183)**
- Screen-space raymarched godrays from three-good-godrays:
  - "Only point and directional lights";
  - "requires a full shadow setup";
  - bilateral blur plus `depthAwareBlend()` recommended.

  — [GodraysNode.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/tsl/display/GodraysNode.js)

**Froxel implementations outside three.js**
- Hilo3D froxel volumetric lighting (2.0.0-alpha.9), WebGPU-only, an optional path of its clustered Forward+ pipeline:
  - froxel XY = cluster tile grid × `resolutionScale` (presets 0.25–0.75), logarithmic Z (showcase: 0.375 XY, 20 Z slices);
  - injection after the depth prepass and the clustered local-light pass, then one integration per XY column, then per-pixel apply;
  - directional, point and spot lights with volumetric shadows from a shared shadow atlas;
  - temporal reprojection with depth rejection and a 3×3 clamp; any light or medium change rejects the history;
  - no timings.

  — [Hilo3D doc](https://hilo3d.js.org/docs/media/VOLUMETRIC_LIGHTING.md)
- Usnul (Shade engine, Nov 2025):
  - three passes: media integration into froxels, light integration with a multiple-scattering approximation, back-to-front gather with polynomial integration;
  - a 128×128×64 grid (1,048,576 samples) vs a 256×256×12 post-process raymarch (786,432);
  - an earlier froxel version took "sub-1ms ... even on 10 year old hardware";
  - TAA for the volumetrics;
  - a device-lost report on Intel Iris Xe;
  - credits Wronski 2014 (Ubisoft) as the froxel origin.

  — [three.js forum "Volumetric lighting in WebGPU"](https://discourse.threejs.org/t/volumetric-lighting-in-webgpu/87959)
- luma.gl volumetric fog pass: WebGPU-only, a fixed 20 depth samples per pixel, directional light only (does "not inspect application point-light buffers"), and one history texture. — [luma.gl volumetric fog](https://luma.gl/docs/api-reference/shadertools/shader-passes/volumetric-fog)

### Inferences
**Cost model of the three.js volume material**
- Per covered pixel: steps × (number of lights) × (one shadow lookup per shadowed light).
  - TRAA example: 12 steps × 2 shadowed lights ≈ 24 shadow taps per pixel at full resolution. Both its PointLight and SpotLight have `castShadow = true` ([example](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_volume_lighting_traa.html)).
  - With 30–50 spell lights this becomes hundreds of light evaluations per pixel, which is impractical.
- Froxels decouple light count from pixel count. Lights are injected once per froxel (for example 160×90×32 ≈ 0.46 M cells), ideally reusing the many-lights grid, and each pixel does one lookup.
- That is the only volumetric approach that scales to many spell lights. three.js offers no froxel implementation, so it would be custom TSL compute.

**Orthographic camera**
- Both the volume material and the fog example start rays at `cameraPosition`. That is correct for perspective; for ortho the rays must be parallel along the view direction, so a patch is needed.
- Froxels for an ortho iso view are simply boxes with linear Z. Ground fog is thin, so few slices are needed.

**Outdoor fields**
- The volumetric model ignores directional lights. Sun shafts need GodraysNode (single light, full shadows) or plain height fog.

**Suggested tiers**
- Low tier: height fog plus sprite/billboard volumes.
- High tier: ortho froxel fog lit by the same light grid.
- The r183 TRAA raymarch suits only a handful of lights in small volumes.

### Gaps
- No published ms costs for any three.js volumetric example, the Hilo3D froxel path or Shade's froxels.
- No three.js roadmap item for froxels was found.
- Not verified how TRAA's reprojection behaves with an orthographic camera.

## 5. GPU-driven rendering in three.js WebGPU: compute culling + indirect draws, BundleGroup, occlusion queries, BatchedMesh multi-draw, three-virtual-geometry

### Takeaway
**What three.js r186 provides.** The primitives are there:
- `IndirectStorageBufferAttribute` + `geometry.setIndirect()` → `drawIndirect` / `drawIndexedIndirect`;
- indirect compute dispatch (since r181);
- BundleGroup (render bundles);
- occlusion queries (`object.occlusionTest`, `renderer.isOccluded`).

**What it lacks.** There is no multi-draw-indirect. BatchedMesh on WebGPU still issues one `drawIndexed` per sub-draw in r186 and dev, and an array of indirect offsets becomes one `drawIndexedIndirect` call per offset.

**three-virtual-geometry (Oct 2026).** It shows what GPU-driven LOD and culling can do (one draw per mesh, billions of triangles), but:
- it is days old;
- it handles static meshes only;
- it switches off occlusion culling for non-perspective cameras.

### Cited Findings
**Indirect draw and dispatch**
- `IndirectStorageBufferAttribute` is a Uint32 storage attribute "intended for compute shaders ... to encode draw parameters for indirect draw calls", usable only with WebGPURenderer and a WebGPU backend. — [IndirectStorageBufferAttribute.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/common/IndirectStorageBufferAttribute.js)
- Example: `new THREE.IndirectStorageBufferAttribute(new Uint32Array(5), 5)` + `geometry.setIndirect(drawBuffer)`, with draw arguments filled by compute through a `struct`. — [webgpu_struct_drawindirect.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_struct_drawindirect.html)

**BatchedMesh and draw submission in the WebGPU backend**
- WebGPU backend r186:
  - For a BatchedMesh it loops over `_multiDrawCount`, issuing `drawIndexed(count, 1, start, 0, i)` per entry.
  - For indirect geometry it issues `drawIndexedIndirect(buffer, offset)` for each offset in the array.

  — [WebGPUBackend.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webgpu/WebGPUBackend.js)
- Dev is the same, plus `dispatchWorkgroupsIndirect` when a compute dispatch size is an `IndirectStorageBufferAttribute`. — [WebGPUBackend.js dev](https://raw.githubusercontent.com/mrdoob/three.js/dev/src/renderers/webgpu/WebGPUBackend.js)
- `batchIndirectIndex` (r186) is a varying holding the BatchedMesh indirect id. It is read from the indirect texture using `drawIndex` when the builder supports it, else `instanceIndex`. — [Batch.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/nodes/accessors/Batch.js)

**Related release changes, r181–r186**
- r181:
  - `dispatchWorkgroupsIndirect` (#31488) plus types and example (#32129);
  - Render Bundles working with MRT (#31906).

  — [r181 release](https://github.com/mrdoob/three.js/releases/tag/r181)
- r184:
  - WebGLRenderer `WEBGL_multi_draw` fallback (#33238);
  - BatchedMesh deprecated instancing paths removed (#33234);
  - render bundle reuse fix (#33335).

  — [r184 release](https://github.com/mrdoob/three.js/releases/tag/r184)
- r186:
  - `batchIndirectIndex` (#34111);
  - BatchedMesh draw offset fix (#34212);
  - "Improve BundleGroup" (#34305);
  - read_write storage buffers and atomics in non-compute stages (#33626);
  - atomic workgroup arrays (#34428);
  - compute `updateBefore`/`updateAfter` (#34401);
  - `compileComputeAsync()` (#32551);
  - timestamp query limit fixes (#34236).

  — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)

**BundleGroup and occlusion queries**
- BundleGroup:
  - "Only renderable 3D objects are allowed"; lights must stay outside;
  - fully supported only on the WebGPU backend; on WebGL it renders "but without any performance improvements".

  — [BundleGroup.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/common/BundleGroup.js)
- The render-bundle example toggles `group.static` and `group.needsUpdate` (4,000 meshes by default). — [webgpu_performance_renderbundle.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_performance_renderbundle.html)
- Occlusion queries: set `mesh.occlusionTest = true` and read `renderer.isOccluded(object)`. — [webgpu_occlusion.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_occlusion.html)
- The backend allocates one occlusion query set per render context and resolves it into a read buffer (8 bytes per query). — [WebGPUBackend.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webgpu/WebGPUBackend.js)

**Compute rasterizer example**
- `webgpu_compute_rasterizer` (renamed in r185 from `webgpu_compute_nanite-style`; an IBL variant was added in #33783):
  - meshlets;
  - software rasterization using `atomicMax` on a packed 32-bit depth+payload (`TRIANGLE_INDEX_BITS = 14`);
  - indirect dispatch;
  - a hardware-raster queue for large triangles driven by `IndirectStorageBufferAttribute`.

  — [webgpu_compute_rasterizer.html r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_compute_rasterizer.html); [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)

**three-virtual-geometry**
- Package facts:
  - npm package created 8 Oct 2026; latest 0.1.3 on 10 Oct 2026;
  - MIT; peer `three >=0.180.0`; depends on meshoptimizer;
  - "Independent implementation, not affiliated with Epic Games".

  — [three-virtual-geometry (npm)](https://www.npmjs.com/package/three-virtual-geometry)
- How it works: clusters of up to 128 triangles in an error-monotonic hierarchy; per-cluster LOD selection plus frustum, size and occlusion culling in compute; "One draw call per mesh".
- Self-reported benchmarks (M4 Pro, Chrome 154): 5.7 B-triangle ruins at 160–230 FPS at 1080p; at most 0.6 ms CPU per frame.
- Limitations:
  - "Static meshes (no skinning or morph targets)";
  - one UV channel;
  - hardware raster only;
  - "Occlusion culling needs a perspective camera with standard depth; it turns itself off otherwise".
- It is based on the MIT-licensed nanite-webgpu (Scthe).

— [three-virtual-geometry (GitHub)](https://github.com/elad12390/three-virtual-geometry)

### Inferences
**Value for a fixed iso camera**
- The view footprint is bounded, so GPU-driven work pays off mainly for dense foliage, grass and clutter in outdoor fields.
- Frustum culling against an ortho box is trivial. HZB occlusion helps less from a steep top-down view, where few occluders hide much behind them.

**Without multi-draw-indirect**
- Practical pattern: one InstancedMesh per prop type, a compute frustum-cull pass that writes a compacted instance-index buffer and an atomic `instanceCount` into an `IndirectStorageBufferAttribute`, then one `drawIndexedIndirect` per type.
- That is N draws for N prop types, which is acceptable.
- BatchedMesh on WebGPU does not cut GPU-API draw calls; it only shares pipeline and bindings.

**three-virtual-geometry**
- Not worth adopting now: it is static-only, its occlusion culling is off for ortho, iso views do not need billions of triangles, and the project is about two weeks old.

**64-bit atomics**
- The compute-rasterizer pattern packs depth and ID into 32 bits because the web lacks 64-bit atomics (see section 6). Any visibility-buffer or software-raster idea must do the same until `atomic-vec2u-min-max` ships widely.

### Gaps
- No official three.js example combines compute frustum culling with indirect instanced draws; the drawIndirect example only fills arguments.
- No measured BundleGroup gains were found.
- No independent benchmark of three-virtual-geometry was found.
- Not verified whether `isOccluded()` results arrive one or more frames late in r186.

## 6. WebGPU platform status in October 2026: bindless, multi-draw-indirect, subgroups, f16, 64-bit atomics, texture compression, timestamps, dual-source blending, clip distances, read-write storage textures, compatibility mode, adapter limits, HDR canvas; Safari 26/27 and Firefox matrix; caniuse vs MDN

### Takeaway
**Shipped or in the spec.**
- Subgroups: Chrome 134, Safari on Metal 3 GPUs per WebKit source; not in Firefox.
- shader-f16: about 94% of adapters.
- Clip distances; dual-source blending (not exposed by Safari).
- Read-write storage textures: about 99%.
- Texture formats tier1/2: Chrome 142.
- Compatibility mode: Chrome 146, OpenGL ES 3.1 on Android.
- Immediates: Chrome 150.
- HDR canvas: Chrome 129 and Safari 26, not Firefox.

**Not available.**
- Bindless and sized binding arrays: Draft proposals only.
- Multi-draw-indirect: Chrome-experimental flag only (0.13% of reports), with no proposal file.
- 64-bit atomics (`atomic-vec2u-min-max`): in the spec, but first ships in Chrome 157 on 3 Nov 2026.

**Timestamps.** Coarsened to at least 100 µs by spec.

**Samplers.** 83% of adapters expose exactly 16 samplers per stage (Safari 22), so the lab's 16-sampler cap is the real-world ceiling.

**Platform matrix.**
- Chrome: Windows, macOS and ChromeOS since 113; Android 12+ since 121; Linux on Intel Gen12+ since 144 and NVIDIA on Wayland since 147.
- Safari 26/27: macOS Tahoe 26+, iOS/iPadOS/visionOS 26+ only. Not on Sequoia/Sonoma, even with Safari 26/27 installed.
- Firefox: Windows since 141; Apple Silicon Macs since 145 (Tahoe) and 147 (all macOS). No Intel Macs, no Linux stable, no Android.

### Cited Findings
**Spec state (gpuweb `main`, Oct 2026)**
- `GPUFeatureName` contains:
  - core-features-and-limits, depth-clip-control, depth32float-stencil8;
  - texture-compression-bc, -bc-sliced-3d, -etc2, -astc, -astc-sliced-3d;
  - timestamp-query, indirect-first-instance, shader-f16;
  - rg11b10ufloat-renderable, bgra8unorm-storage, float32-filterable, float32-blendable;
  - clip-distances, dual-source-blending, subgroups;
  - texture-formats-tier1, texture-formats-tier2, primitive-index, texture-component-swizzle;
  - subgroup-size-control, texture-compression-unaligned, atomic-vec2u-min-max.

  There is no multi-draw-indirect or bindless feature. — [WebGPU spec source (index.bs)](https://github.com/gpuweb/gpuweb/blob/main/spec/index.bs)
- The spec also contains `featureLevel: "compatibility"` (default "core") and immediates (`maxImmediateSize`, `GPUPipelineLayoutDescriptor.immediateSize`). — [WebGPU spec source](https://github.com/gpuweb/gpuweb/blob/main/spec/index.bs)
- Compatibility-mode limit example: `maxStorageBuffersInFragmentStage` is 8 in core and 4 in compat. — [WebGPU spec source](https://github.com/gpuweb/gpuweb/blob/main/spec/index.bs)
- WGSL language extensions: readonly_and_readwrite_storage_textures, packed_4x8_integer_dot_product, unrestricted_pointer_parameters, pointer_composite_access, uniform_buffer_standard_layout, subgroup_id, subgroup_uniformity, texture_and_sampler_let, texture_formats_tier1, linear_indexing, immediate_address_space, fragment_depth, buffer_view, swizzle_assignment. — [WGSL spec source](https://github.com/gpuweb/gpuweb/blob/main/wgsl/index.bs)

**Proposals: bindless, binding arrays, 64-bit atomics**
- Proposals index:
  - Merged: compatibility-mode, subgroups, immediate-data, texture-component-swizzle, primitive-index, buffer-view, transient-attachments, subgroup-size-control.
  - Draft: texel-buffers, sized-binding-arrays, atomic-64-min-max, subgroup-id, subgroup-matrix, fragment-depth, bindless, bindless-filterability-validation, view-instancing, multisampled-array-textures, enums, namespaces.
  - Inactive: pipeline-statistics-query, timestamp-query-inside-passes.
  - No multi-draw-indirect proposal file exists (`proposals/multi-draw-indirect.md` returns 404).

  — [gpuweb proposals README](https://github.com/gpuweb/gpuweb/blob/main/proposals/README.md)
- Bindless: "Status: Draft", created 2025-10-13, issue #380. Motivation: visibility buffers, ray tracing, many-image 2D. — [bindless.md](https://github.com/gpuweb/gpuweb/blob/main/proposals/bindless.md)
- Sized binding arrays: Draft (2024-10-25), a "stepping stone towards bindless" with "ubiquitous hardware support". — [sized-binding-arrays.md](https://github.com/gpuweb/gpuweb/blob/main/proposals/sized-binding-arrays.md)
- 64-bit atomics: Draft (2025-09-15). `atomic<vec2u>` maps to u64.
  - Metal allows only 64-bit min/max (Apple 9 family).
  - D3D12 needs SM 6.6.
  - Vulkan needs VK_KHR_shader_atomic_int64; the 1.2 feature is reported on 87.7% of Linux and 31% of Android devices.

  — [atomic-64-min-max.md](https://github.com/gpuweb/gpuweb/blob/main/proposals/atomic-64-min-max.md)

**Chrome shipping milestones (Chrome Platform Status) and dates**
- Shipping milestones:
  - f16: 120
  - timestamp queries: 121
  - read-write storage textures: 124
  - extended-range (HDR) canvas: 129
  - dual-source blending: 130
  - clip distances: 131
  - subgroups: 134
  - core-features-and-limits and BC/ASTC sliced-3D: 139
  - texture formats tier1/tier2 and primitive_index: 142
  - texture component swizzle: 143
  - subgroup_id and uniform_buffer_standard_layout: 144
  - subgroup_uniformity: 145
  - compatibility mode (origin trial 139–145), transient attachments, texture_and_sampler_let: 146
  - linear_indexing: 148
  - immediates: 150
  - subgroup-size-control: 152
  - buffer_view: 153
  - WGSL fragment depth: 156
  - atomic-vec2u-min-max: 157 (developer trial from 155)
  - texture-compression-unaligned: no milestone yet

  — [f16](https://chromestatus.com/feature/5180552617656320), [timestamps](https://chromestatus.com/feature/5136606877188096), [RW storage textures](https://chromestatus.com/feature/6469283075063808), [HDR](https://chromestatus.com/feature/6196313866895360), [dual-source](https://chromestatus.com/feature/5167711051841536), [clip distances](https://chromestatus.com/feature/5141929256550400), [subgroups](https://chromestatus.com/feature/5126409856221184), [core-features-and-limits](https://chromestatus.com/feature/4744775089258496), [sliced 3D](https://chromestatus.com/feature/5080855386783744), [tier1/2](https://chromestatus.com/feature/5116926821007360), [primitive_index](https://chromestatus.com/feature/6467722716250112), [swizzle](https://chromestatus.com/feature/5110223547269120), [compat mode](https://chromestatus.com/feature/6436406437871616), [transient](https://chromestatus.com/feature/5562829589577728), [immediates](https://chromestatus.com/feature/5199437611794432), [subgroup-size-control](https://chromestatus.com/feature/5077657663438848), [buffer_view](https://chromestatus.com/feature/5094091886034944), [fragment depth](https://chromestatus.com/feature/5663304168112128), [atomic-vec2u-min-max](https://chromestatus.com/feature/4882016087703552), [unaligned](https://chromestatus.com/feature/5080544005193728)
- Chrome stable dates: 146 = 10 Mar 2026; 150 = 30 Jun; 152 = 25 Aug; 153 = 8 Sep; 154 = 22 Sep; 155 = 6 Oct; 156 = 20 Oct; 157 = 3 Nov 2026. So Chrome 155 is the stable release on 19 Oct 2026. — [Chromium Dash schedule API](https://chromiumdash.appspot.com/fetch_milestone_schedule?mstone=157)
- Chrome Platform Status API queries for "bindless", "multi-draw" and "drawIndirect" return no WebGPU entries. — [chromestatus API](https://chromestatus.com/api/v0/features?q=bindless)
- Chrome 146 notes (25 Feb 2026):
  - compatibility mode "lets you run WebGPU on older graphics APIs like OpenGL ES 3.1", starting on Android; ChromeOS (GLES 3.1) and Windows (Direct3D 11) are being explored;
  - opt in with `requestAdapter({ featureLevel: "compatibility" })`;
  - transient attachments;
  - `texture_and_sampler_let` "prepares for bindless support";
  - Dawn raised `maxStorageBuffersPerShaderStage` to 16 and `maxSampledTexturesPerShaderStage` to 48.

  — [What's New in WebGPU (Chrome 146)](https://developer.chrome.com/blog/new-in-webgpu-146)

**Timestamp precision**
- Chrome 121: timestamps "quantized with a resolution of 100 microseconds" because of timing-attack concerns. Quantization can be disabled via `chrome://flags/#enable-webgpu-developer-features`. — [What's New in WebGPU (Chrome 121)](https://developer.chrome.com/blog/new-in-webgpu-121)
- The spec says timestamp "precision must be reduced" via HR-Time *coarsen time*, with `crossOriginIsolatedCapability` set to false and never true for queue timelines. — [WebGPU spec source](https://github.com/gpuweb/gpuweb/blob/main/spec/index.bs)
- HR-Time: coarsened resolution is "100 microseconds, or a higher implementation-defined value" when not cross-origin isolated (5 µs when isolated). — [HR-Time spec source](https://github.com/w3c/hr-time/blob/gh-pages/index.html)

**Adapter features and limits in the field (web3dsurvey)**
- The page states neither sample size nor date range.
- Overall: 83.34% of reports had a working adapter (Linux 17.29%, Firefox 61.11%, Safari 80.12%).
- Features: bgra8unorm-storage 96.13%, clip-distances 80.8%, core-features-and-limits 99.06%, dual-source-blending 83.17%, float32-filterable 92.13%, float32-blendable 90.46%, primitive-index 83.81%, rg11b10ufloat-renderable 99.98%, shader-f16 93.84%, subgroups 69.57%, subgroup-size-control 58.5%, texture-formats-tier1 93.27%, tier2 83.85%, texture-compression-bc 88.11%, -bc-sliced-3d 87.27%, -etc2 45.32%, -astc 45.11%, -unaligned 0.52%, timestamp-query 98.58%.
- Experimental features: chromium-experimental-multi-draw-indirect 0.13%, chromium-experimental-sampling-resource-table 0.13%, chromium-experimental-timestamp-query-inside-passes 0.16%.
- Limits:
  - maxSamplersPerShaderStage: ≥16 100%, ≥22 17%, ≥64 4%.
  - maxSampledTexturesPerShaderStage: ≥44 91%, ≥48 78%.
  - maxStorageBuffersPerShaderStage: ≥10 98%, ≥16 80%.
  - maxStorageTexturesPerShaderStage: ≥8 94%.
  - maxComputeWorkgroupStorageSize: ≥32767 99%, ≥49152 7%.
  - maxColorAttachmentBytesPerSample: ≥64 98%, ≥128 84%.
  - maxBindGroups: ≥7 19%.
- WGSL language features: readonly_and_readwrite_storage_textures 99.19%, immediate_address_space 75.98%, texture_and_sampler_let 78.26%.

— [web3dsurvey WebGPU](https://web3dsurvey.com/webgpu)

**Safari / WebKit**
- WebKit `main` HardwareCapabilities features:
  - always: float16/float32-renderable, float32-blendable, clip-distances, depth-clip-control, depth32float-stencil8, indirect-first-instance, rg11b10ufloat-renderable, shader-f16, bgra8unorm-storage;
  - conditional:
    - BC and BC-sliced-3D: if the device supports BC;
    - ETC2/ASTC: "filled in by the caller";
    - texture-formats-tier1/2: on ARM64;
    - primitive-index: if barycentrics are supported;
    - subgroups: on Metal 3 GPUs;
    - float32-filterable: if supported;
    - timestamp-query: if a timestamp counter set exists.
  - There is no dual-source-blending.
  - Limits: maxBindGroups 11; samplers per stage 22 (11×2); sampled textures, storage buffers and storage textures 44 (11×4); workgroup storage 32 KB.

  — [WebKit HardwareCapabilities.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebGPU/WebGPU/HardwareCapabilities.mm)
- Safari 26 release notes: "Added support for WebGPU." and "Added HDR support in WebGPU Canvas." — [Apple Safari 26 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes)
- WebKit's Safari 26.0 post: WebGPU is "now shipping in Safari 26.0 for macOS, iOS, iPadOS, and visionOS" and "supersedes WebGL on macOS, iOS, iPadOS, and visionOS". — [WebKit features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- WebKit bug 299237:
  - Safari 26.0.1 on macOS Sequoia 15.7 had no `navigator.gpu`.
  - An Apple WebKit engineer explained: "navigator.gpu requires macOS Tahoe, iOS 26, visionOS 26 or later."
  - The fix hid the feature flag on older macOS (301759@main, 17 Oct 2025).

  — [WebKit bug 299237](https://bugs.webkit.org/show_bug.cgi?id=299237)
- Safari 27.0 (post dated 17 Sep 2026):
  - adds WGSL `clip_distances`;
  - fixes `GPUDevice.onuncapturederror`;
  - "Restored maxStorageBuffersInFragmentStage and related WebGPU limits";
  - ships with "macOS 27 Golden Gate, iOS 27, iPadOS27 and visionOS 27" and is installable on macOS 26 Tahoe and macOS 15 Sequoia.

  — [WebKit Features for Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)

**Firefox**
- Firefox `main` adapter feature mapping:
  - implemented: depth-clip-control, depth32float-stencil8, BC/BC-3D/ETC2/ASTC/ASTC-3D, timestamp-query, indirect-first-instance, shader-f16, rg11b10ufloat-renderable, bgra8unorm-storage, float32-filterable/blendable, clip-distances, dual-source-blending, core-features-and-limits (always reported);
  - unimplemented: subgroups (bug 1955417), primitive-index (bug 1989116).

  — [Firefox dom/webgpu/Adapter.cpp](https://github.com/mozilla-firefox/firefox/blob/main/dom/webgpu/Adapter.cpp)
- Firefox's WebIDL has canvas `toneMapping` commented out ("TODO bug 1834395"), so there is no HDR canvas. — [Firefox WebGPU.webidl](https://github.com/mozilla-firefox/firefox/blob/main/dom/webidl/WebGPU.webidl)
- Firefox 147 (13 Jan 2026): "WebGPU support is now enabled for devices with Apple Silicon processors on all supported macOS versions." — [Firefox 147 release notes](https://www.firefox.com/en-US/firefox/147.0/releasenotes/)

**Browser-by-OS matrix and the caniuse vs MDN conflicts**
- gpuweb Implementation Status wiki (last edited 2 Oct 2026):
  - Chromium:
    - Mac/Windows/ChromeOS since 113;
    - Android 12+ on ARM/Qualcomm/Intel GPUs since 121; Imagination GPUs on Android 16+ since 139;
    - Linux: Intel Gen12+ since 144; NVIDIA (driver 535.183.01+) on Wayland since 147; others behind a flag;
    - Windows ARM64 behind a flag.
  - Firefox: Linux in Nightly only ("expects to ship on Linux in 2026"); Android behind a flag.
  - Safari: "supported and enabled by default" on macOS Tahoe 26, iOS 26, iPadOS 26 and visionOS 26.

  — [gpuweb Implementation Status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)
- MDN BCD:
  - Chrome 144 "Supported on ChromeOS, macOS, Windows, and Linux (Intel Gen12+ GPUs only)"; Chrome Android 121;
  - Firefox 141 partial: Windows since 141, macOS Tahoe on Apple Silicon since 145, older macOS on Apple Silicon since 147, "Does not support macOS on Intel CPUs", "Does not support Linux", Firefox Android not supported;
  - Safari `version_added: "26"` with no OS caveat.

  — [MDN BCD api/GPU.json](https://github.com/mdn/browser-compat-data/blob/main/api/GPU.json)
- caniuse:
  - Safari macOS 26.0 is partial: "only being enabled by default on macOS 26 Tahoe or later". iOS Safari 26.0 is full.
  - Firefox 141 partial (Windows only); 145 partial (Windows plus macOS 26 Tahoe on Apple Silicon).
  - Chrome 144: Linux "depends on hardware and drivers".
  - Global usage: 85.8% full + 3.66% partial.

  — [caniuse WebGPU data](https://github.com/Fyrd/caniuse/blob/main/features-json/webgpu.json) / [caniuse.com/webgpu](https://caniuse.com/webgpu)

**three.js behaviour on the platform**
- three.js r186 WebGPUBackend:
  - requests the adapter with `featureLevel: 'compatibility'`;
  - then requests every adapter-supported feature from its own list (core-features-and-limits through texture-formats-tier2);
  - sets `compatibilityMode = !device.features.has('core-features-and-limits')`, and in compat mode disables MSAA (`renderer._samples = 0`);
  - `requiredLimits` defaults to `{}`.

  — [WebGPUBackend.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webgpu/WebGPUBackend.js)
- three.js's r186 feature list omits primitive-index, texture-component-swizzle, subgroup-size-control and atomic-vec2u-min-max, so these are never requested. — [WebGPUConstants.js r186](https://cdn.jsdelivr.net/npm/three@0.186.1/src/renderers/webgpu/utils/WebGPUConstants.js)
- r180 used `featureLevel: 'compatibility'` only when `parameters.compatibilityMode` was true (default false). The unconditional compat request first appears in npm 0.183.0; 0.181/0.182 lack it. — [WebGPUBackend.js r180](https://cdn.jsdelivr.net/npm/three@0.180.0/src/renderers/webgpu/WebGPUBackend.js); [WebGPUBackend.js r183](https://cdn.jsdelivr.net/npm/three@0.183.0/src/renderers/webgpu/WebGPUBackend.js)

### Inferences
**caniuse vs MDN: resolved**
- Safari: caniuse's "partial on macOS (Tahoe-only)" is correct. MDN's bare "26" misses the OS gate, confirmed by an Apple engineer in WebKit bug 299237 and by the gpuweb wiki.
  - A Mac on Sequoia or Sonoma running Safari 26 or 27 has no WebGPU and must fall back to WebGL2.
  - Apple's release notes simply do not state the OS gate.
- Firefox: MDN is more current than caniuse. Firefox 147 enabled all macOS versions on Apple Silicon (release notes); Intel Macs and Linux remain unsupported.
  - The gpuweb wiki's "147 on all macOS versions" is imprecise: Apple Silicon only, per the release notes and MDN.
  - caniuse's Firefox entry stops at 145.

**What the high tier can rely on (desktop, Oct 2026)**
- Safe to use:
  - rg11b10ufloat-renderable (SSGI needs it): 99.98%;
  - read-write storage textures: ~99%, good for RC and froxel ping-pong;
  - timestamp-query: 98.6%, but ≥100 µs granularity, so aggregate many frames or use the Chrome developer flag in the lab;
  - shader-f16: ~94% (Chrome, Safari, Firefox), worth it for RC/SSGI bandwidth.
- Optional fast paths only:
  - subgroups: ~70%, and absent in Firefox;
  - texture-formats-tier1/2: Chrome 142+, Safari ARM64 only.
- Do not design around:
  - dual-source blending and clip distances (not needed for these techniques);
  - 64-bit atomics (Chrome 157+, Apple 9-family Metal only);
  - bindless or multi-draw-indirect (Draft or flag-only through at least 2027).

**The 16-sampler cap**
- It is the norm: ~83% of reports expose exactly 16 (Chrome/Dawn on all OSes; Safari exposes 22). Raising `requiredLimits` cannot fix it on Chrome.
- High-tier features that add sampled textures to every lit material (LightProbeGrid atlas, per-material shadow maps of shadowed lights) compete with terrain splat maps.
- Mitigations: texture arrays/atlases and shared samplers. Sized binding arrays and bindless are future work.

**Compatibility mode and the three.js version**
- Since r183, three.js asks for compat devices. On Chrome 146+ Android devices with only GLES 3.1, WebGPURenderer now gets a compat device instead of failing over to WebGL2; the r180-pinned lab does not.
- High-tier compute effects must check compat limits (for example, 4 storage buffers in the fragment stage) or require `core-features-and-limits`.

**HDR canvas**
- Available on Chrome 129+ and Safari 26+ (Tahoe/iOS 26); not in Firefox. Treat it as an optional enhancement.

**Overall shortlist across sections 1–6 for the iso ARPG high tier**
1. **Worth it:**
   - **Many-light culling suited to ortho.** A world-space XZ grid (custom or #34931-style) or an ortho-patched ClusteredLighting. Not strictly WebGPU-only from r187.
   - **Screen-space GI from spell lights.** SSGINode patched for ortho at reduced resolution now; PoE2-style screen-space RC as an R&D upgrade.
2. **Both tiers, cheap:**
   - LightProbeGrid per dungeon tile/room (WebGL r184, WebGPU r186) as the baked GI baseline, watching the sampler budget;
   - height fog.
3. **Situational:**
   - VXGI for small static rooms with ≤8 hero lights (WebGPU-backend-only);
   - custom ortho froxel fog if lit fog with spell lights is central to the look.
4. **Skip for now:**
   - three-virtual-geometry;
   - BVH DDGI (speedball-gi);
   - anything requiring bindless, multi-draw-indirect or 64-bit atomics.

**Version note for the r180 pin**
- SSGINode: r181+
- GodraysNode and the TRAA volumetric example: r183+ (VolumeNodeMaterial itself is in r180)
- LightProbeGrid WebGL: r184+
- ClusteredLighting: r185+
- LightProbeGrid WebGPU, VXGI and incremental baking: r186+
- Clustered spot lights and the WebGL2 fallback: r187 (unreleased)

### Gaps
- Safari's optional-feature set per shipping version (26.x, 27.0) is not enumerated in release notes. I read only WebKit `main` source, which may be ahead of shipping Safari. In particular:
  - when subgroups and HDR canvas details shipped;
  - whether Safari implements immediates or compat-mode restrictions.
- Firefox per-version feature additions (148–156) were not enumerated; only `main` source and the 147 notes were read.
- web3dsurvey gives no sample size, date range or per-browser feature breakdown.
- The current status of Chrome's timestamp quantization beyond the Chrome 121 article was not re-verified. The spec mandates coarsening regardless.
- Real compat-mode limits on GLES 3.1 Android devices (for example, whether vertex-stage storage buffers can be 0) were not checked.
- No 2026 statement from the gpuweb group on a multi-draw-indirect timeline was found; only the absence of a proposal file and the flag-only experimental feature.

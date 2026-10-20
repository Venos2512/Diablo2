# three.js recipes for the lab's lighting, shadow and post-processing roadmap (r180 WebGLRenderer+GLSL and WebGPURenderer+TSL, with r181–r186 deltas)

Conventions used below:
- **Version labels.** "r180" is the lab's current three.js, and "dev/r187" is the development branch as of October 2026. File links point at release tags.
- **Backends.** "WebGL path" means the classic `WebGLRenderer` with `EffectComposer` and GLSL. "WebGPU path" means `WebGPURenderer` with TSL.
- **Lab post chain.** Both backends run: scene pass (HDR, optional MSAA) → GTAO → height fog → premultiplied VFX layer → bloom → display transform → FXAA/SMAA. On WebGPU, TRAA resolves after the VFX composite and bloom, so VFX pass through TRAA ([webgpu/pipeline.js](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js), lines 2–3 and 197–216; [webgl/pipeline.js](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js), lines 1–5).
- **Lab camera.** `OrthographicCamera(-1, 1, 1, -1, -300, 600)` ([first-round report](file:///E:/Diablo2/reports/K%C4%A9%20thu%E1%BA%ADt%20%C4%91%E1%BB%93%20h%E1%BB%8Da%20AAA%20cho%20threejs.md)).
- **Search budget.** This note used 25 web searches. Every other source was fetched directly: GitHub raw files, PRs, docs, and the Bend code archive.

---

## Q1. Local exposure / local tonemapping, average-luminance auto-exposure (WebGL2 mip chain vs WebGPU compute histogram), and excluding VFX from metering

### Takeaway
Bart Wronski's three.js exposure-fusion demo is public domain and the best starting point. It is about 300 lines and works like this:
- It packs three synthetic exposures into RGB.
- It builds manual bilinear pyramids for exposures and weights.
- It blends Laplacians level by level, from mip 6 down to mip 2 (¼ resolution).
- It upsamples with a guided filter into a per-pixel exposure multiplier, applied just before the tonemapper.

In the lab chain, that multiplier slots in after bloom (after TRAA on WebGPU) and inside the display transform. No ready bilateral-grid local-tonemapping port to GLSL or TSL was found.

Global auto-exposure:
- **WebGL2:** use a power-of-two luminance render target with `generateMipmaps`, read at the 1×1 mip, plus a 1×1 ping-pong adaptation target. This is the pmndrs pattern.
- **WebGPU:** use a compute histogram. A workgroup-atomics-plus-reduction histogram ran in under 1 ms on a 3.7 MP image. Pair it with Bevy/UE-style percentile filtering and a metering mask.

To keep spells from pumping exposure, meter the HDR buffer *before* the VFX composite (the lab already has that buffer), optionally with a mask.

### Cited Findings

#### Exposure fusion (Wronski): algorithm, code, cost, artifacts
- **Algorithm.** Tonemap the HDR image at several synthetic exposures ("3 are a pretty good starting choice") and compute a lightness per exposure. Weight each exposure by closeness to mid-grey; the author recommends only the exposure weight, not contrast or saturation. Blend Laplacians per level starting from a coarse level ("5th or 6th mip-map"). Then "transfer the lightness to the full target image and do the rest of your tonemapping and color grading." — [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- **Resolution.** "every single result that I have shown in this post was produced in ¼ x ¼ resolution and guided upsampled!" — [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- **Cost.** It is not profiled, but "it should definitely be under 1ms on even previous generation consoles." The main cost is tonemapping the synthetic exposures, so a cheaper "proxy" operator may be used. Other levels cost "a little bit of ALU and 3 texture fetches from very low resolution textures." — [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- **License and design scope.** "I release it to public domain, feel free to use or modify as much of it as you want." The method is "designed for blending LDR exposures and producing an LDR image," and HDR pipelines "may need modifications." — [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- **Artifacts.**
  - Gaussian blending produces halos that are "distracting when the camera moves."
  - Bilateral blending gives "gradient reversals and edge ringing."
  - The guided filter can "blur out some edges and reduce the local contrast."
  - Bilinear down/upsampling can "alias and flicker under motion."
  — [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- **Demo code structure.** Demo at [bartwronski.github.io/local_tonemapping_js_demo](https://bartwronski.github.io/local_tonemapping_js_demo/), source in [main.js](https://bartwronski.github.io/local_tonemapping_js_demo/main.js).
  - It uses a pre-r152 three.js (`outputEncoding`) with `ShaderPass` and `CopyShader`.
  - Each pyramid level has three HalfFloat linear-filtered targets: `mips` (RGBA), `mipsWeights` (RGBA) and `mipsAssemble` (Red). The pyramid is built manually with CopyShader rather than GPU mipmaps.
  - The passes run in this order:
    1. `LuminanceShader` packs `vec3(highlights, midtones, shadows)`, each `sqrt(dot(clamp(ACES(color*exposure_i)), vec3(0.1,0.7,0.2)))`.
    2. `ExposureWeightsShader` computes `exp(-0.5*diff²*sigma²)` and normalizes across the three channels.
    3. The pyramid is downsampled.
    4. `BlendShader` builds the coarsest base.
    5. `BlendLaplacianShader` loops from `mip` down to `display_mip+1`, blending fine-minus-coarse Laplacians, with optional `|laplacian|` contrast boost.
    6. `FinalCombinePassShader` runs a 3×3 Gaussian guided filter (local linear A, B from the midtone guide). It computes `finalMultiplier = max(A*lum + B, 0)/lum`, softened toward 1 below 0.007, and applies `ACES(color*exposure*finalMultiplier)`.
  - Defaults: exposure 0.7, shadows 1.5 (×2^1.5), highlights 2.0 (×2^−2), sigma 5, coarsest mip 6, display_mip 2.
  — [main.js](https://bartwronski.github.io/local_tonemapping_js_demo/main.js)

#### UE5 local exposure (the "bilateral" and "fusion" reference designs)
- UE offers two local-exposure methods. Bilateral "will decompose the image into base and detail layers using a bilateral blur"; Fusion "fuses multiple exposures according to quality measures." — [UE Auto Exposure docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- **Parameter guidance:**
  - Highlight and Shadow Contrast: "usually found between 0.6 and 1."
  - Detail Strength: "should be set to 1 in most cases."
  - Blurred Luminance Blend: "usually in the range of 0.4 and 0.6."
  - Blurred Luminance Kernel Size Percent: "the percentage of the screen ... used to blur frame luminance."
  - Middle Grey Bias is logarithmic ("-1 is twice as dark").
  — [UE Auto Exposure docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- **UE metering:**
  - Histogram is the default mode with a 64-bin histogram. Basic mode "computes single values by downsampling exposure."
  - Suggested starting ranges are Low Percent 70–80 and High Percent 80–95.
  - An Exposure Metering Mask weights pixels and works in both modes.
  — [UE Auto Exposure docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)

#### Auto-exposure on WebGL2 without compute (mip chain)
- pmndrs `ToneMappingEffect` (adaptive mode) works like this:
  - It renders a luminance target sized to a power of two (default `resolution = 256`) with `generateMipmaps = true` and `LinearMipmapLinearFilter`.
  - It sets `mipLevel1x1 = ceil(log2(resolution))` (level 8 for 256).
  - Defaults: `middleGrey 0.6`, `whitePoint 4.0`, `minLuminance 0.01`, `adaptationRate 1.0`. A class comment says adaptive mode requires `EXT_shader_texture_lod` (WebGL1-era).
  — [ToneMappingEffect.js](https://github.com/pmndrs/postprocessing/blob/main/src/effects/ToneMappingEffect.js)
- `AdaptiveLuminancePass` keeps two 1×1 `NearestFilter` targets: the previous adapted value and the new value. It copies the new value back each frame using frame `deltaTime`. — [AdaptiveLuminancePass.js](https://github.com/pmndrs/postprocessing/blob/main/src/passes/AdaptiveLuminancePass.js)
- The adaptation shader reads `textureLod(luminanceBuffer1, vUv, MIP_LEVEL_1X1).r`, clamps both values to `minLuminance`, and computes `adaptedLum = l0 + (l1 - l0) * (1.0 - exp(-deltaTime * tau))`. — [adaptive-luminance.frag](https://github.com/pmndrs/postprocessing/blob/main/src/materials/glsl/adaptive-luminance.frag)
- luma.gl's WebGPU auto-exposure avoids a histogram:
  - It uses 7 passes: center-weighted 4×4 log-luminance extraction, four reductions, adaptation, and application. It derives "geometric-mean scene brightness without copying results back to the CPU."
  - Defaults: `meteringScale 0.25`, `keyValue 0.48`, `minimumExposure 0.45`, `maximumExposure 2.4`, `brightenSpeed 1.6`, `darkenSpeed 2.8`.
  — [luma.gl HDR Auto Exposure](https://luma.gl/docs/api-reference/shadertools/shader-passes/hdr-auto-exposure)

#### Auto-exposure with WebGPU compute (histogram)
- WebGPUFundamentals benchmarked histogram strategies on a 2448×1505 image (~3.7 MP):
  - Global `atomicAdd` per pixel was about 4× faster than JavaScript.
  - Workgroup-shared bins plus a chunk merge took 0.2 ms for the histogram, but 11 ms for the naive merge on one machine. On another machine it was 1.7 ms against 4.4 ms for global atomics.
  - Replacing the merge with a stride-halving reduction ran "under 1ms on both machines I tested!"
  - It uses 256 bins and `@workgroup_size(256,1,1)`.
  — [WebGPUFundamentals histogram](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders-histogram.html)
- Bevy's `AutoExposure` defaults:
  - `range -8.0..=8.0` EV. Values below the range are ignored, and values above count in the top bin.
  - `filter 0.10..=0.90`, so the darkest and brightest 10% are ignored.
  - `exponential_transition_distance 1.5` stops.
  - `metering_mask` uses the red channel, quantized to 16 levels.
  - "Auto Exposure requires compute shaders and is not compatible with WebGL2."
  — [Bevy docs (0.15)](https://docs.rs/bevy_core_pipeline/0.15.0/bevy_core_pipeline/auto_exposure/struct.AutoExposure.html)
- Unity HDRP offers metering modes Average, Spot, Center Weighted, Mask Weighted (a texture) and Procedural Mask. Automatic Histogram "allows the exposure calculation to discard unwanted outlying values." Unity advises setting Light→Dark speed lower than Dark→Light. — [HDRP Exposure (12.0)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@12.0/manual/Override-Exposure.html)
- **TSL compute primitives in r180.** The `webgpu_compute_reduce` example uses `instancedArray`, `storage`, `workgroupArray`, `workgroupBarrier()`, `subgroupAdd`, `Loop` and `If`, with workgroup size from `device.limits.maxComputeWorkgroupSizeX`. It has no subgroup fallback. — [webgpu_compute_reduce.html (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_compute_reduce.html)
- TSL atomics (`AtomicFunctionNode`) "can only be used with a WebGPU backend," so they don't work on `WebGPURenderer`'s WebGL2 fallback. — [AtomicFunctionNode docs](https://threejs.org/docs/pages/AtomicFunctionNode.html)
- No official three.js auto-exposure or local-exposure example exists by name in r180 or dev. The example lists have no `exposure`, `luminance` or `histogram` entries. — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json); [dev files.json](https://github.com/mrdoob/three.js/blob/dev/examples/files.json)

### Inferences
**Placement in the lab chain:**
- **Meter input.** Take the HDR *after* height fog and *before* the VFX composite.
  - WebGPU: this is the `hdr` node just before `hdr.mul(vfx.a.oneMinus()).add(vfx.rgb)` in `pipeline.js`.
  - WebGL: the composite shader merges AO, fog and VFX in one pass, so add a ¼-res "meter" pass. It reads `sceneRT` + depth, re-evaluates the analytic fog, and writes `log2(lum)` (and optionally a weight). Spells, telegraphs and hit flashes then never pump exposure.
- **Local exposure input.** Use the same pre-VFX buffer, so a spell burst doesn't locally darken the area around it. Apply the multiplier to the post-VFX/post-bloom HDR inside the display transform (`final.frag.glsl` / `displayTransform`), before the tonemap and LUT.

**WebGL2 global exposure recipe (r180):**
- Use a ¼-res RG16F POT target (e.g. 256×128) holding `w·log2(L)` in R and `w` (center weight or metering mask) in G. Set `generateMipmaps = true`.
- Sample `textureLod(lumRT, uv, maxLevel)` and compute `exp2(R/G)` for the weighted geometric mean.
- Adapt in a 1×1 ping-pong pair with pmndrs' exponential formula, using asymmetric speeds (darkening faster than brightening, per the UE/Unity/luma.gl guidance).
- Feed the 1×1 result to the final shader as a texture. This avoids `readPixels` stalls.
- Keep POT sizes: box mips over non-POT sizes weight texels unevenly. HalfFloat mip generation relies on `EXT_color_buffer_float`, which the lab already uses for its HalfFloat targets.

**WebGPU histogram recipe:**
1. A compute pass over the ¼-res pre-VFX buffer with 64–256 log-EV bins in `workgroupArray` with atomics.
2. A reduction pass.
3. A one-workgroup "percentile + adapt" pass writing exposure to a storage buffer the display transform reads.

WebGPUFundamentals' numbers suggest well under 1 ms at ¼ res. Fall back to the mip path on the WebGL2 backend, because atomics are WebGPU-only.

**Local exposure (Wronski adapted to the lab):**
- Run the whole pyramid at ¼ res (Wronski's `display_mip 2`).
- Use the lab's own tonemapper, or a cheap `x/(1+x)` proxy, for the synthetic exposures.
- Start from the coarsest level 6 relative to full res, which is level 4 of the ¼-res pyramid.
- Do the guided upsample in the final pass with a 3×3 tap set.

The expected cost is well under 1 ms (Wronski's estimate). Give each mood preset artist-facing "shadows" and "highlights" EV controls, since Wronski and UE both say tuning is per scene.

**Pitfalls:**
- **Halos under camera motion.** The iso camera pans continuously. Prefer the guided filter, and consider a short temporal blend of the multiplier on WebGPU.
- **Readability colours.** Apply local exposure before telegraph and outline overlays, which the roadmap draws after the tone map, so signal colours stay fixed.
- **Not affected:** the ortho near = −300 camera and the 16-sampler cap. All passes here are screen-space post passes with their own shader stage.

**r181–r186 alternative:** none found as a ready node. r185's `RTTNode.setResolutionScale()` (#33606) and r181's `PassNode.setResolutionScale()` rename only make ¼-res TSL passes easier ([r185 release](https://github.com/mrdoob/three.js/releases/tag/r185); [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)).

### Gaps
- No GLSL or TSL bilateral-grid local-tonemapping implementation was found; the search returned only patents and theses. No ms cost for UE local exposure.
- Wronski's demo is unprofiled.
- Bevy's default adaptation speeds were not shown on the fetched page.
- I did not verify whether pmndrs' `LuminanceMaterial` stores log luminance or linear luminance, which matters for geometric versus arithmetic mean.

---

## Q2. Contact / screen-space shadows: Bend Studio code, three.js SSSNode (r181+) internals, light limits, cost, and options for several point lights

### Takeaway
There are two families.

**three.js `SSSNode` (r181, TSL, WebGPU path):**
- It supports a single directional light.
- Each pixel ray-marches in screen space toward the light. The step count is the longest screen-space span × `quality`, with interleaved-gradient-noise jitter.
- Output is an R8 target, with an optional four-phase temporal offset for TRAA.
- It should be composited through r182's `builtinShadowContext()` after a depth/velocity prepass, so it multiplies the light's shadow term instead of darkening like AO.

**Bend Studio's code (Apache-2.0):**
- It is a compute shader (wave of 64, groupshared depth, 60 samples per pixel by default).
- It handles directional *and* point/spot lights from a homogeneous light position.
- It needs 1–2 dispatches when the light is off-screen and 4–6 when it is on-screen.
- It maps to WGSL compute but not to WebGL2. On the WebGL path the practical choice is a GLSL fragment port of SSSNode-style marching.

No three.js cost is published. The closest measured proxy is Keijiro's Unity contact shadows: 1.5–2.0 ms at 1080p on an RX 480.

### Cited Findings

#### three.js SSSNode (added r181)
- **Release.** r181 notes: "Add new node for Screen-Space Shadows." (#32050). — [r181 release](https://github.com/mrdoob/three.js/releases/tag/r181)
- **Inputs and camera handling.**
  - Signature: `constructor(depthNode, camera, mainLight)`. The docs say it "can only be used with a single directional light."
  - `getViewZ` branches on `isPerspectiveCamera` (`perspectiveDepthToViewZ`) versus `orthographicDepthToViewZ`, with a logarithmic-depth path.
  - The start position comes from `getViewPosition(uv, depth, projectionMatrixInverse)`.
  — [SSSNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSSNode.js)
- **Algorithm.**
  1. Background pixels are discarded (`depth >= 1.0`).
  2. The ray runs from the view position along the view-space light direction × `maxDistance`, and both ends are projected to pixels.
  3. `totalStep = int(max(|xLen|,|yLen|) * quality)`, jittered by `interleavedGradientNoise` plus a temporal offset.
  4. A sample counts as occluded when `0 < -(rayZ - sceneZ) < thickness`. The loop sets `occlusion = shadowIntensity` and breaks.
  5. It returns `1 - occlusion`.
  — [SSSNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSSNode.js)
- **Defaults and output.**
  - `maxDistance 0.1` (world units), `thickness 0.01`, `shadowIntensity 1`, `quality 0.5`, `resolutionScale 1`, `useTemporalFiltering false`.
  - Temporal filtering cycles offsets `[0, 0.5, 0.25, 0.75]` and "requires the usage of TRAANode."
  - Output is a `RedFormat`/`UnsignedByteType` target cleared to white.
  — [SSSNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSSNode.js)
- **Documented limits.**
  - "Ideally the maximum shadow length should not exceed `1` meter."
  - SSS "can only honor objects ... currently visible within the camera's view."
  - Edges can be too hard, so blur (box, Gaussian or hash) before compositing.
  — [SSSNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSSNode.js)
- **PR #32050 discussion.**
  - Bend's technique is "fully tailored to compute shaders."
  - "a pure compute shader solution won't work with WebGL2."
  - The initial blend "is similar to AO so the shadow or occlusion is accumulated." gkjohnson argued SSS should "correctly blend with the existing light shadow."
  - No performance numbers were given.
  — [PR #32050](https://github.com/mrdoob/three.js/pull/32050)
- **Correct compositing (r186 example).**
  - A prepass renders depth plus a `velocity` MRT.
  - `sss(prePassDepth, camera, dirLight)` is sampled at `screenUV`, wrapped by `builtinShadowContext(sssSample, dirLight)`, and assigned to `scenePass.contextNode`. TRAA consumes the prepass depth and velocity.
  - Settings: `maxDistance 0.2`, `useTemporalFiltering true`, 1024² shadow map with `bias -0.001`, `radius 2`.
  — [webgpu_postprocessing_sss.html (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_postprocessing_sss.html)
- **Shadow and AO context APIs.** `builtinShadowContext()` and `builtinAOContext()` arrived in r182 (#32384/#32378) to "simplify the use of built-in shadows as used in the webgpu_postprocessing_sss example." They chain: `builtinShadowContext(sssSample, dirLight).builtinAOContext(aoSample)`. — [PR #32384](https://github.com/mrdoob/three.js/pull/32384); [r182 release](https://github.com/mrdoob/three.js/releases/tag/r182)

#### Bend Studio screen-space shadows (Days Gone, PS4 2019)
- The blog post links the code archive and the SIGGRAPH 2023 slides. It states no license on the page. — [Bend blog](https://www.bendstudio.com/blog/inside-bend-screen-space-shadows/); [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- The archive holds `bend_sss_gpu.h` (484 lines) and `bend_sss_cpu.h` (255 lines). Both headers say: "Copyright 2023 Sony Interactive Entertainment. Licensed under the Apache License, Version 2.0." — [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- **GPU macros:**
  - `WAVE_SIZE 64`: only 64 has been tested.
  - `SAMPLE_COUNT 60`: "Determines overall cost ... controls the length of the shadow (in pixels)"; reads per thread = (SAMPLE_COUNT/WAVE_SIZE + 2)·2.
  - `HARD_SHADOW_SAMPLES 4` and `FADE_OUT_SAMPLES 8`.
  - The bulk of samples average in groups of 4.
  — [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- **Parameter defaults:** `SurfaceThickness 0.005`, `BilinearThreshold 0.02`, `ShadowContrast 4`, `IgnoreEdgePixels false`, `UsePrecisionOffset false`, `BilinearSamplingOffsetMode false`, `DepthBounds (0,1)`, `UseEarlyOut false`.
  - `SurfaceThickness` is defined as a percentage of non-linear depth relative to `FarDepthValue`.
  - `NearDepthValue` and `FarDepthValue` are explicit inputs, so both reversed and standard Z are supported.
  - A `PointBorderSampler` with the border colour set to far depth is required.
  — [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- **Groupshared depth.** Depth is shared through `groupshared float DepthData[READ_COUNT * WAVE_SIZE]`. Light rays are "perspective corrected" so that "all light rays are parallel" in that space. — [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- **API and platform.** The code targets the DX12 DXC compiler and was "tested on PS5." DX11 "requires some modifications (e.g., early-out's use of wave intrinsics...)." — [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- **Lights and dispatches.**
  - `BuildDispatchList(inLightProjection, ...)` takes the light × ViewProjection without W divide. Directional lights use `float4(normalized light direction, 0)`; "point/spot lights use {light} = float4(light world position, 1)."
  - There are "Typically ... just one or two dispatches when the light is off-screen, and 4 to 6 when the light is on-screen," with at most 8.
  - Near-zero W is clamped (`FP_limit`) for lights "very far off screen."
  — [code zip](https://www.bendstudio.com/assets/cms/downloads/code_final_candidate.zip)
- **No ports found.** A search found no WGSL, GLSL, Godot or three.js port of Bend's code. — [search result context: Bend blog / bgfx sample](https://www.bendstudio.com/blog/inside-bend-screen-space-shadows/)

#### Measured proxy
- Keijiro's ContactShadows (Unity) is a screen-space ray-traced shadow with a temporal reprojection filter.
  - It supports directional lights only.
  - "Average GPU time is 1.5ms - 2.0ms under FHD (1080p) /w Radeon RX 480."
  - The temporal filter "introduces gaps between objects and shadows while moving the camera."
  - License: "you can use the code freely in your projects."
  — [keijiro/ContactShadows](https://github.com/keijiro/ContactShadows)

### Inferences
**WebGL path recipe (r180, GLSL), a port of SSSNode logic:**
- Add a ShaderMaterial pass after the scene pass that reads `sceneRT.depthTexture` at ½ res with a depth-aware upsample.
- Reconstruct view position from the inverse projection. For the ortho camera, `viewZ = depth*(near-far) - near` is linear and valid with near = −300.
- March toward `viewMatrix * moonDirection`. Use `maxDistance` of about 0.3–0.5 m for character-scale contacts, 8–24 steps (screen span × quality, clamped), and IGN jitter.
- Write R8.

There is no depth prepass on the WebGL path, so composite in the existing composite shader. Two refinements avoid the AO-style double darkening raised in PR #32050:
- Reconstruct world position and look up the lab's static baked moon shadow there. This adds one sampler to the *composite* shader, not the terrain. Darken only pixels the moon actually lights.
- Scale the darkening by the moon's share of lighting for the mood, so ambient and fill light survive.

**WebGPU path on r180:**
- `SSSNode` does not exist in r180. Its file is self-contained TSL (`getViewPosition`, `getScreenPosition`, `interleavedGradientNoise`), so vendor it as a custom node under three.js's MIT license.
- Composite it in post exactly as on WebGL, because `builtinShadowContext` needs r182.

**r182+ path:**
- Use a depth (+velocity) prepass → `sss()` → `builtinShadowContext(sss, moonLight)` on the scene pass, plus `builtinAOContext(gtao)` for AO, exactly as in the r186 example.
- Move the lab's velocity MRT into the prepass.
- Cost: the prepass is an extra geometry pass, so skinned monsters get skinned twice. It is only worth it if the AO/SSS lighting-correct blend matters.

**16-sampler pitfall (important for the lab).** With `builtinShadowContext` / `builtinAOContext`, the SSS and AO textures are sampled *inside every lit material*, terrain included. The example samples `sssPass.getTextureNode().sample(screenUV)` within the scene pass. That adds bindings to the terrain shader, which already sits at WebGPU's 16-sampler default. Do one of these first:
- Consolidate terrain layers into a `DataArrayTexture`.
- Request higher limits. WebGPURenderer r180 forwards `parameters.requiredLimits` to `requestDevice` ([WebGPUBackend.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js)). The defaults are 16 samplers and 16 sampled textures per stage, and browsers report tiers ([MDN GPUSupportedLimits](https://developer.mozilla.org/en-US/docs/Web/API/GPUSupportedLimits)).

**Several point lights:**
- Bend's design supports them natively, at one dispatch set per light.
- In fragment form, march toward each of the K most important shadowless point lights (torches and spell lights near the hero).
- Pack up to four lights' results into an RGBA8 target and multiply each into its own light's contribution. That requires light-index-aware injection:
  - WebGL: patch the `lights_fragment_begin` point-light loop.
  - WebGPU: try `builtinShadowContext(..., light)` per light; per-light use is unverified.
- Cost grows linearly with K, so cap K at 2–4.

**WebGPU compute port of Bend (r180):**
- `groupshared` → `var<workgroup>`, and `numthreads(64,1,1)` → `@workgroup_size(64)`.
- Replace the wave-intrinsic early-out with the existing `LdsEarlyOut` flag and `workgroupBarrier()`.
- Use `textureLoad` with manual border handling, since WGSL has no border-colour sampler.
- Pass `Near=0, Far=1` for standard three.js depth.
- With the ortho camera and a directional light, the projected light W is 0. The CPU code clamps it to `FP_limit`, which turns screen-space rays into near-parallel lines; this should work but needs testing.
- `SurfaceThickness` is tuned for non-linear perspective depth, so retune it for linear ortho depth.

**Other pitfalls:**
- **MSAA on WebGL.** three.js resolves multisampled depth with `blitFramebuffer(..., NEAREST)`, i.e., a single sample ([WebGLTextures.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl/WebGLTextures.js)). SSS, AO and fog therefore see edge depth that does not match the averaged colour, which shows as fringes. Upsample with nearest-depth selection.
- **Half-res.** Use a min-depth downsample so thin casters such as weapons and grass survive.

### Gaps
- No ms cost for `SSSNode` or Bend's shader. The Bend SIGGRAPH slide archive (`screen_space_shadows.zip`) was not downloaded or read.
- I did not verify whether `builtinShadowContext` works for point or spot lights, or how it interacts with the lab's custom baked moon shadow (a custom PCSS chunk, not a stock three.js shadow).
- No existing WGSL, GLSL or TSL port of Bend's code was found.

---

## Q3. Outlines and x-ray silhouettes: OutlinePass / OutlineNode internals and cost, jump-flood wide outlines, depth-Greater / stencil x-ray, pmndrs OutlineEffect, dozens of outlined monsters

### Takeaway
`OutlinePass` (WebGL) and `OutlineNode` (WebGPU) both cost two extra scene renders plus about 7 full-screen quads at ½ and ¼ res every frame while anything is selected. The extra renders are a depth pass of the non-selected objects and a mask pass of the selected ones. `OutlinePass` also traverses the whole scene twice per frame. The cost scales with *scene* complexity, not the number of selected objects. That is fine for one hover target and wasteful for an ARPG crowd.

The cheapest robust set for the lab:
1. **Hero x-ray.** Draw the hero a second time with `depthFunc: GreaterDepth, depthWrite: false`, with a `renderOrder` *after* the world but *before* the hero itself. Since the hero is not in the depth buffer yet, its own limbs don't x-ray each other, and no stencil is needed (stencil has been off by default since r163).
2. **Outline masks for hover and elites.** Draw only the selected meshes into a ½-res mask, depth-compared against the existing scene depth texture, and edge-detect in the existing final pass.
3. **Jump flooding** for wide or animated boss auras. gkjohnson's MIT three.js demo shows it: ~log2(width) passes, scissored to the object's screen bounds.

### Cited Findings
- **OutlineNode (r180).** `updateBefore()` does 2 scene renders and 7 quad draws:
  - A depth pre-pass of non-selected objects (via `setRenderObjectFunction` filtering and `scene.overrideMaterial`), into a `FloatType` depth texture.
  - A mask pass of selected objects that compares against that depth (`vec4(0, depthTest, 1, 1)`).
  - Downsample "to (at least) half resolution", then edge detection.
  - Two separable 9-tap blurs (at ½ and ¼ res), then a composite.
  - Defaults: `edgeThickness 1`, `edgeGlow 0`, `downSampleRatio 2`, visible-edge colour red and hidden-edge colour green (as channels for custom TSL).
  - Ortho is handled at build time through `orthographicDepthToViewZ`. It traverses each selected subtree every frame.
  — [OutlineNode.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/OutlineNode.js)
- **OutlinePass (r180).**
  - Same structure with two `renderer.render` calls. `_changeVisibilityOfNonSelectedObjects` runs `renderScene.traverse` over the *entire scene*, twice per frame.
  - Depth and mask targets are full-res HalfFloat. Edge and blur targets are at ½ and ¼ res.
  - Blurs use `MAX_EDGE_THICKNESS 4` and `MAX_EDGE_GLOW 4` (9 taps).
  - The token `DEPTH_TO_VIEW_Z` is replaced with the orthographic variant when `!camera.isPerspectiveCamera`, at construction time.
  - It does nothing when `selectedObjects` is empty.
  — [OutlinePass.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/OutlinePass.js)
- **OutlineNode r184 changes.** It gained "Support sprites." (#33112) and "Early out when nothing is selected." (#33358). — [r184 release](https://github.com/mrdoob/three.js/releases/tag/r184)
- **pmndrs OutlineEffect.**
  - It uses a `Selection` with a render layer. Each update runs a `DepthPass` with the selection hidden and a mask `RenderPass` with a `DepthComparisonMaterial`.
  - Defaults: `resolutionScale 0.5`, `xRay true`, `hiddenEdgeColor 0x22090a`, `blur false` (KawaseBlurPass, `VERY_SMALL`), `multisampling 0` (experimental; applies to the mask target only).
  - It "re-renders the scene for depth and again for the mask" every frame while the selection is non-empty.
  — [OutlineEffect.js](https://github.com/pmndrs/postprocessing/blob/main/src/effects/OutlineEffect.js)
- **User report.** One user found pmndrs' outline "proved to be too performance heavy to run optimally at all times." This is anecdotal. — [three.js forum](https://discourse.threejs.org/t/visual-indication-or-effect-to-show-when-an-object-is-occluded/29924)
- **Jump-flood outline in three.js.** gkjohnson's demo computes a signed distance field with JFA, including the interior with a negative sign, and notes "room for improvement around performance and anti-aliasing quality." Repo [three-jumpflood-demo](https://github.com/gkjohnson/three-jumpflood-demo) is MIT. — [forum post](https://discourse.threejs.org/t/demo-realtime-sdf-effects-with-the-jump-flood-algorithm/88012)
- **three-jumpflood-demo internals.**
  - It uses `WebGLRenderer` + GLSL `ShaderMaterial`.
  - JFA ping-pong targets are RGBA `FloatType` with `NearestFilter`, storing (x, y, signed distance).
  - The low-res R8 mask, scaled by thickness, is dilated 4× with 3×3 passes.
  - JFA work is scissored to the projected bounding sphere.
  - Steps start at `min(maxDim, thickness)` and halve. For thickness 30 that gives 30, 15, 8, 4, 2, 1, i.e. 6 passes.
  - The outline is anti-aliased with `smoothstep` over a fixed half-pixel width, because "this fwidth call is breaking on Android."
  — [index.js](https://github.com/gkjohnson/three-jumpflood-demo/blob/main/index.js)
- **Background.** Ben Golus's "The Quest for Very Wide Outlines" is the canonical JFA-outline reference, cited by the three.js demo. It returned HTTP 403 to my fetches, so its timings could not be extracted. — [Golus (Medium)](https://bgolus.medium.com/the-quest-for-very-wide-outlines-ba82ed442cd9)
- **X-ray via depth function.** gkjohnson's forum answer for occluded lines:

  ```js
  new LineBasicMaterial({ color, depthFunc: THREE.GreaterDepth, depthWrite: false })
  ```

  with `renderOrder = 1`; the normally depth-tested lines get `renderOrder = 2`. It works "so they only render when they're behind something that's already been rendered." — [three.js forum](https://discourse.threejs.org/t/dynamic-face-outlines-based-on-occlusion/77098)
- **Stencil default.** "The `stencil` context attribute of `WebGLRenderer` is now `false` by default for performance reasons." (r162→r163) — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- **Depth/stencil formats in r180 WebGL.** `DepthStencilFormat` + `FloatType` maps to `DEPTH32F_STENCIL8`, and `UnsignedInt248Type`/`UnsignedIntType` map to `DEPTH24_STENCIL8`. MSAA stencil resolve is slow on D3D (source comment citing #27799). — [WebGLTextures.js (r180)](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl/WebGLTextures.js)
- **Cut-away alternative (dev branch).** `webgpu_tsl_occlusion_dither` dithers walls inside an analytic world-space cone from the camera to the character. It uses a 16×16 Bayer pattern, with `maskNode: threshold.greaterThanEqual(occlusionCut)` and `maskShadowNode: bool(true)` to keep shadows. Defaults: radius 1.6, stopDistance 0.5, ditherScale 1. No raycasts or depth reads are involved. — [webgpu_tsl_occlusion_dither.html (dev)](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_tsl_occlusion_dither.html)
- **`maskShadowNode`** arrived in r183 (#32598). — [r183 release](https://github.com/mrdoob/three.js/releases/tag/r183)
- **Shared depth texture.** r186 added "Support shared depth texture between multiple passes." (#34042). — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)

### Inferences
**Hero x-ray, both backends, r180:**
- Create a sibling `SkinnedMesh(hero.geometry, xrayMat)` and call `xray.bind(hero.skeleton, hero.bindMatrix)`. For VAT monsters, reuse the same VAT material with a define instead.
- `xrayMat`: unlit colour, `depthTest: true`, `depthWrite: false`, `depthFunc: GreaterDepth`, `transparent: false` (so it stays in the opaque list), `fog: false`.
- Order: world `renderOrder 0` → x-ray `1` → hero `2`. The opaque list sorts by `renderOrder` first.
- A flat opaque colour avoids uneven alpha where several hidden layers overlap. A translucent ghost needs a stencil "draw once" (`stencilWrite`, `NotEqualStencilFunc`). That requires `stencil: true` on the WebGL context and a `DepthStencilFormat` scene depth, ideally `FloatType` → `DEPTH32F_STENCIL8`, which keeps the lab's float depth.
- The lab's WebGL composite applies AO and fog after the scene pass, so the silhouette gets darkened by AO computed from the wall depth. Use an emissive x-ray colour, or tag x-ray pixels (alpha or stencil) and skip AO/fog on them.

**Hover and elite outlines without OutlinePass (both backends):**
- Render only the selected meshes into a ½-res RG8 mask. Compare the fragment depth to `sceneDepth` at `gl_FragCoord` in the mask shader: visible when `fragDepth <= sceneDepth + eps`.
- This reuses the scene depth and skips OutlinePass/OutlineNode's extra full-scene depth render and whole-scene traversals.
- For ortho, raw depth is linear: 1 m ≈ 1/900 for near −300 / far 600. A fixed `eps` therefore works across the whole view, unlike with perspective.
- Do edge detection (4–8 taps) and hidden/visible colouring in the final pass, *after* tonemapping, consistent with the roadmap's rule that telegraph and outline draw after the tone map.
- Cost: one draw per selected object plus a few taps per pixel. For a crowd of instanced or VAT monsters, draw the mask with the same `InstancedMesh` and an override material reading a per-instance "outlined" attribute, which is one draw call.

**JFA for boss and elite auras:**
- Seed from the mask, then run ceil(log2(width_px)) passes at ½ res, scissored to the selection's screen rectangle.
- HalfFloat RG (or RGBA16F) is enough at ½ res. gkjohnson lists lower precision as a potential improvement.
- Cost scales with the scissor area times the pass count, so keep it for a few large targets, not dozens.

**Dozens of outlined monsters:**
- OutlinePass/OutlineNode cost stays about the same as for one object: two full scene renders plus fixed full-screen passes. That is the wrong shape for an ARPG.
- The mask approach costs roughly one extra vertex pass for the outlined monsters only, plus fixed full-screen cost.
- No measurements exist, so benchmark in the lab's `bench.js` with 10, 30 and 60 outlined monsters.

**Other notes:**
- **16-sampler cap.** Masks and outlines are post passes, so terrain is unaffected.
- **MSAA.** The x-ray draw works inside the MSAA scene pass. The outline mask can be non-MSAA because the blur/JFA `smoothstep` provides AA.
- **r181–r186.**
  - OutlineNode gains sprites and an early-out (r184).
  - r186 shared depth textures let a TSL mask pass depth-test against the scene depth directly.
  - The occlusion-dither example (dev) is a cheaper "cut-away wall" alternative to x-ray for tall occluders. It needs `maskNode`, and `maskShadowNode` (r183) to keep shadows.

### Gaps
- No published ms costs for OutlinePass, OutlineNode, pmndrs OutlineEffect or any three.js JFA outline.
- Ben Golus's per-technique timings could not be read (Medium 403 on both URL forms).
- Not verified: whether `maskNode` exists in r180 TSL, or only in later releases.

---

## Q4. Cheap volumetrics: light-shaft cards, analytic local fog volumes, cloud-shadow cookies, and r183 GodraysNode / height-fog nodes

### Takeaway
All three cheap techniques run on r180 for both backends without adding samplers to the terrain shader, if built carefully:
- **Light-shaft cards** are additive, unlit meshes in the existing VFX layer, using near/far distance fades, a `pow(N·V)` facing term and a depth feather against scene depth. Godot's CC0 "Spatial Light Shaft" shader is a complete formula reference; r186 adds `softParticles()`.
- **Local fog volumes** use Íñigo Quílez's analytic sphere-density integral, or UE's "sphere of exponential height fog combined with radially faded fog," evaluated in the composite pass against scene depth. UE culls them in 128-px tiles with at most 32 per tile.
- **Cloud cookies** go into the moon/sun direct term. In TSL use the light's `colorNode` hook (AnalyticLightNode, r180); in GLSL use `onBeforeCompile`. Prefer procedural noise or a packed channel over a new texture. `SpotLight.map` only works with `castShadow`.

r183's `GodraysNode` runs at ½ res, takes about 60–70 shadow-map taps per pixel and uses an IGN-varied step count, followed by a bilateral blur and `depthAwareBlend`. It supports directional or point lights that have a three.js shadow map, and needs WebGPURenderer. It is a TSL port of the r183 WebGL demo, which now uses Ameobea's `three-good-godrays` (pmndrs-postprocessing based; point or directional light; tested on three 0.125–0.182). r183 also removed the old radial-blur `GodRaysShader`. r183's `exponentialHeightFogFactor` is a stylized `1−exp(−(d·max(h−y,0)·viewZ)²)`, not an integral, so the lab's analytic height fog is already better.

### Cited Findings
- **Light-shaft shader (Godot, CC0).**
  - Near fade `smoothstep(near_fade_start, near_fade_end, dist)` × far fade `1 - smoothstep(far_fade_start, far_fade_end, dist)`.
  - Facing `1 + facing_boost * location_weight * pow(NdotV, facing_power)`.
  - Depth feather `smoothstep(0, depth_fade_distance, sceneDepth - fragDepth)`.
  - Apex falloff `pow(max(1 - UV.y, 0.001), falloff_power)`.
  - `render_mode unshaded, blend_add`.
  — [godotshaders.com](https://godotshaders.com/shader/spatial-light-shaft/)
- **`softParticles()`.** r186: "Add `softParticles()`." (#33887). — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)
- **IQ fog formulas.**
  - Exponential: `1 - exp(-t*b)`.
  - Sun-tinted: mix to a warm colour by `pow(max(dot(rd, lig), 0), 8)`.
  - Analytic height fog: `fogAmount = (a/b) * exp(-ro.y*b) * (1.0-exp(-t*rd.y*b))/rd.y`, constant per frame apart from the division.
  — [IQ "Better fog"](https://iquilezles.org/articles/fog/)
- **IQ sphere density.** `computeFog(ro, rd, sc, sr, dbuffer)` intersects the ray with the sphere, clips to the camera and depth buffer, and analytically integrates a density that "peaks at the center ... and decays quadratically until it reaches zero at the surface." It does this "without raymarching, by using only a few maths operations." — [IQ sphere density](https://iquilezles.org/articles/spheredensity/)
- **UE Local Fog Volumes.**
  - "A sphere of participating media representing a mixture of exponential height fog combined with a radially faded out fog," with uniform scale only.
  - Lighting uses "fast analytical integrals," so "Shadows and light functions are ignored."
  - Sorted by the distance from each volume's centre to the camera, and culled by screen tiles (`r.LocalFogVolume.TilePixelSize 128`, `TileMaxInstanceCount 32`).
  - Composited after exponential height fog. The cost is "similar to dynamic lights," and overlapping should be limited on low-end hardware.
  — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/local-fog-volumes-in-unreal-engine)
- **Ray-marched volume in r180 (WebGPU).** The `webgpu_volume_lighting` example works like this:
  - `VolumeNodeMaterial` with `steps = 12` and `offsetNode = bayer16(screenCoordinate)`.
  - A 128³ `Data3DTexture` Perlin noise sampled 3× per step, with `depthNode` set to scene depth.
  - A separate layer-filtered `pass()` with `setResolution(.25)`, then `gaussianBlur(…, 0.6)` added to the scene pass.
  - Point and spot lights with shadows.
  — [webgpu_volume_lighting.html (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_volume_lighting.html)
- **TRAA-synced volumetric dithering (r183, #32953).** "TRAANode jitters the camera using a 32-sample Halton cycle. By using the same sequence for volumetric dithering, both patterns stay in sync." It was initially broken on Android and then fixed. — [PR #32953](https://github.com/mrdoob/three.js/pull/32953)
- **Post-processing volumetric fog (r186, #34319).** It uses joint bilateral upsampling. Mugen87's measurements: 15 FPS at first; after optimization, JBU 55 FPS against Gaussian blur 30 FPS and fog disabled 60 FPS (machine not stated). — [PR #34319](https://github.com/mrdoob/three.js/pull/34319)
- **GodraysNode (r183, #32888).**
  - It supports only `isPointLight` (cube shadow map) or `isDirectionalLight` (2D shadow map via `lightShadowMatrix`); anything else throws.
  - The march is clipped to the shadow-camera box or frustum planes. Rays outside are discarded.
  - `raymarchSteps 60`, jittered per pixel to about 60–70.
  - Defaults `density 0.7` (÷100), `maxDensity 0.5`, `distanceAttenuation 2`, `resolutionScale 0.5`.
  - Output is `vec4(godray, depth)` for `depthAwareBlend()`. The docs recommend a bilateral blur.
  — [GodraysNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/GodraysNode.js); [PR #32888](https://github.com/mrdoob/three.js/pull/32888)
- **GodraysNode PR notes.** The rewritten `inShadow()` is "more performant." The Poisson-disk depth-aware blend needs "3 times less texture samples," and the separable bilateral blur lets "larger kernels perform way better." — [PR #32888](https://github.com/mrdoob/three.js/pull/32888)
- **GodraysNode depth handling (read from the r186 source).**
  - Main-camera positions come from `getViewPosition(uv, depth, cameraProjectionMatrixInverse)`, which is projection-agnostic.
  - For the directional path, the shadow coordinate's z is converted with `perspectiveDepthToViewZ(shadowCoord.z, shadowNear, shadowFar)`. That value feeds the distance-attenuation term, even though directional shadow cameras are orthographic.
  — [GodraysNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/GodraysNode.js)
- **WebGL god-ray demo (r183, #32801).** The PR "Examples: Update Godrays demo." included the commit "Addons: Remove GodRaysShader."
  - The old demo's radial blur over the depth buffer has problems; "Users are advised to use [three-good-godrays]."
  - The demo uses a point light. A directional-light `GL_INVALID_OPERATION` was fixed in three-good-godrays 0.8.2, at "a minor perf hit for the texture copy."
  - three-good-godrays "was based on an original demo by @N8python."
  — [PR #32801](https://github.com/mrdoob/three.js/pull/32801)
- **three-good-godrays (WebGL, pmndrs postprocessing).**
  - Light sources: "godrays can be cast from either `PointLight`s or `DirectionalLight`s." "shadowmaps are needed for this effect."
  - Defaults: `density 1/128`, `maxDensity 0.5`, `edgeStrength 2`, `edgeRadius 2`, `distanceAttenuation 2`, `raymarchSteps 60`, `blur true`, `gammaCorrection true`.
  - With `PCFShadowMap` it copies shadow depth to a separate texture every frame.
  - "tested to work with Three.JS versions >= 0.125.0 <= 0.182.0."
  - The README does not mention ortho or WebGPU support or name the licence (it links a LICENSE file).
  — [Ameobea/three-good-godrays](https://github.com/Ameobea/three-good-godrays)
- **Height fog factor (r183, #32659).** "the simplest exponential height fog I can think of," aimed at stylized looks. The code: `distance = max(height - positionWorld.y, 0)`; `m = distance * viewZ`; `return 1 - exp(-(density*m)²)`; applied through `scene.fogNode = fog(color, factor)`. — [PR #32659](https://github.com/mrdoob/three.js/pull/32659); [Fog.js (r186)](https://github.com/mrdoob/three.js/blob/r186/src/nodes/fog/Fog.js)
- **r185 volumetric fixes.** "Add volumetric fire, enhances the `VolumetricLightingModel`." (#33848) and "Fix crash when used with clustered lights." (#33896). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)
- **`SpotLight.map`.** "A texture used to modulate the color of the light ... Warning: This property is disabled if Object3D#castShadow is set to false." — [SpotLight docs](https://threejs.org/docs/pages/SpotLight.html)
- **TSL light colour hook (r180).**
  - `this.colorNode = ( light && light.colorNode ) || uniform( this.color )`.
  - Shadows multiply it: `shadowColorNode = this.colorNode.mul( shadowNode )`.
  - So a user `light.colorNode` acts as a per-light cookie or mask.
  — [AnalyticLightNode.js (r180)](https://github.com/mrdoob/three.js/blob/r180/src/nodes/lighting/AnalyticLightNode.js)
- **ClusteredLighting exclusion (r187).** Lights with a `colorNode` (and spot lights with a `map`) are not clustered and fall back to built-in lighting. — [PR #34978](https://github.com/mrdoob/three.js/pull/34978)

### Inferences
**Light-shaft cards (both backends, r180):**
- Put them in the lab's VFX scene: premultiplied additive with `rgb` only and `a = 0`. They then inherit the full/½/¼-res VFX target and its scene-depth uniform (`uSceneDepth` on WebGL, the shared depth node on WebGPU). That means zero new samplers in material shaders.
- With a fixed iso camera, author cards to face the camera's elevation. Rely on distance-to-hero and screen-edge fades plus the depth feather. Keep the facing term for camera rotation.
- Ortho makes the depth feather simple: linear raw depth × 900 = metres.

**Local fog volumes (both backends):**
- Loop over ≤ 8 spheres from a uniform array in the composite shader (WebGL) or the `heightFog` TSL node (WebGPU), after height fog and before VFX, matching UE's order.
- For ortho, use the per-pixel ray origin on the near plane with `rd = camera forward`.
- Clip with the scene-depth distance and use IQ's integral × density × colour.
- On the CPU, cull volumes whose screen rectangle doesn't overlap the viewport. Expect a few dozen ALU per volume per covered pixel.
- For the downward-looking camera `rd.y` is strongly negative, so IQ's `1/rd.y` term is stable. Clamp it anyway.

**Cloud cookies:**
- **Procedural:** `moon.colorNode = uniform(moonColor).mul(cloud(positionWorld.xz + wind*time))` (TSL), or patch the directional-light loop after `getDirectionalLightInfo` (GLSL). Here `cloud()` is 2–3 octaves of value noise through a smoothstep, ALU only.
- **Projection:** project along the light, `p.xz - L.xz * (p.y / L.y)`, so walls and ground agree.
- **Texture option:** a texture in `colorNode` is sampled in *every* lit material, including terrain, which breaks the WebGPU 16-sampler terrain shader. Pack the cookie into an already-bound texture channel (as the first round proposed), or keep it procedural.
- Don't use `SpotLight.map` for this. It needs a shadow-casting spot light and a big frustum, i.e. an extra shadow map, which is exactly the WebGPU sampler problem.

**God rays:**
- **WebGL r180:** core three.js ships only the radial-blur `GodRaysShader`, which is removed in r183. The shadow-map raymarched option is `three-good-godrays` (point/directional, 60 steps, blur).
  - It is built on pmndrs `postprocessing`, so it would need adapting to the lab's own composer.
  - It needs a stock three.js shadow map, which the lab's custom baked moon shadow may not be.
  - Its ortho support is undocumented.
  - For most scenes, cards plus fog volumes remain the cheaper route.
- **WebGPU r183+:** GodraysNode needs `light.shadow.map.depthTexture` from a three.js shadow-casting light. The lab's moon shadow is a custom baked map, so GodraysNode may not see it without adaptation (unverified).
  - The camera reconstruction is ortho-safe.
  - The directional-light attenuation uses perspective math on an orthographic shadow depth. Expect the falloff shape to differ, which is cosmetic.
  - Budget: ½ res × 60–70 compare taps per pixel. Try `raymarchSteps` 24–32 with the bilateral blur.
- **Froxel or ray-marched fog on WebGPU r180:** start from `webgpu_volume_lighting` (12 steps, ¼ res). Upgrade the blur to JBU (r186 example) or TRAA-synced dithering (r183) after migrating.

### Gaps
- No ms numbers for GodraysNode, three-good-godrays, VolumeNodeMaterial or shaft cards. three-good-godrays' licence was not read from its LICENSE file.
- UE does not publish its Local Fog Volume formulas, so IQ's are the concrete ones.
- Not verified: GodraysNode with the lab's custom baked shadow, and GodraysNode/height fog with the ortho camera at near = −300 in practice.
- No three.js directional-light cookie example was found; the search returned only Unity docs and SpotLight.

---

## Q5. Many lights on the WebGL path: clustered/tiled forward for WebGLRenderer, porting HypeHype STB lighting, and limits of r184 DynamicLighting, r185 ClusteredLighting and the r187 WebGL2 fallback

### Takeaway
Classic `WebGLRenderer` has no official many-light system anywhere from r180 to r186:
- Light counts are part of the program cache key, so adding or removing a light recompiles every lit material.
- The best-known WebGL clustered forward+ ("Dr. Strangelight": CPU light assignment, clusters in a 3D texture with two-level indirection, ~100 FPS with 500 moving lights) is closed source.

All the official solutions are WebGPURenderer TSL addons:
- **r184 DynamicLighting:** uniform arrays capped at 8 directional, 16 point, 16 spot and 4 hemisphere lights; no shadows; removes a 3–6 s recompile freeze.
- **r185 ClusteredLighting:** compute-built; 32-px tiles × 24 exponential slices × 64 lights per cluster, 1024 max; point lights only; 120 FPS on an M2 Pro with 1000 lights.
- **r187 (merged 2026-10-15):** adds spot lights and a transform-feedback WebGL2 fallback. By all evidence this targets WebGPURenderer's WebGL2 *backend*, not classic WebGLRenderer.

HypeHype's Stochastic Tile-Based lighting runs in pixel shaders only and adds +0.66 to +1.5 ms on a $99 phone at 1 spp. But it needs a G-buffer, a min/max depth pyramid, a shadow atlas and a noise-tolerant TAA denoiser, none of which the lab's WebGL path has. For the lab's WebGL path, the practical answer is a fixed-size importance-selected light pool now. Possibly add a world-space 2D light grid in data textures later, which suits a top-down camera.

### Cited Findings
- **Light counts in the program key.** `WebGLPrograms.getProgramCacheKeyParameters` pushes `numDirLights`, `numPointLights`, `numSpotLights`, `numSpotLightMaps`, `numHemiLights`, `numRectAreaLights`, the shadow counts and `numLightProbes` into the program cache key. A different light count produces a new `WebGLProgram`. — [WebGLPrograms.js (r180)](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl/WebGLPrograms.js)
- **Recompile cost.** "Updating any light in Three.js will force invalidate all the materials of the scene." Adding lights froze for "~3/4 seconds in WebGPU or ~5/6 seconds in WebGL on a typical Three.js scene." With `DynamicLighting`, "it doesn't even drop 1 fps." It "doesn't cover the shadows." Merged for r184. — [PR #33042](https://github.com/mrdoob/three.js/pull/33042)
- **DynamicLighting API.** It "batches supported analytic lights into uniform arrays so light count changes do not recompile materials." Defaults `maxDirectionalLights 8`, `maxPointLights 16`, `maxSpotLights 16`, `maxHemisphereLights 4`. Usage: `renderer.lighting = new DynamicLighting({ maxPointLights: 64 })`. — [DynamicLighting docs](https://threejs.org/docs/pages/DynamicLighting.html)
- **ClusteredLighting (r185, #33406).**
  - It "partitions the view frustum into a 3D cluster grid (screen tiles × exponential depth slices)." "A compute pass builds a per-cluster light list via sphere-vs-AABB tests."
  - Defaults: 32-px tiles, 24 depth slices, 64 lights per cluster, 1024 max lights.
  - Measured: initially 9 FPS (Mac mini) and about 20 FPS (M2 Pro); after shortening light ranges, "120 FPS using M2 Pro with 1000 lights."
  - Overfull clusters may drop lights. TiledLighting "drops lights that share screen pixels at different depths."
  — [PR #33406](https://github.com/mrdoob/three.js/pull/33406); [ClusteredLighting docs](https://threejs.org/docs/pages/ClusteredLighting.html)
- **r185 follow-ups.** Point-light attenuation fixed (#33679); "keep castShadow point lights on the material-lights path" (#33792); TiledLighting removed (#33751). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)
- **r186 lighting changes.** Dynamic swapping of the lighting system (#34050), per-`pass()` lighting (#34051), `getBuiltinLights` (#33909), and ClusteredLightsNode `dispose()` plus `create()` optimization (#34375). — [r186 release](https://github.com/mrdoob/three.js/releases/tag/r186)
- **r187 (PR #34978, merged 2026-10-15).**
  - Spot lights without shadows, `map` or `colorNode` are now clustered, culled by the cone's bounding sphere.
  - "Transform-feedback computes can only write their own element" (the WebGL2 fallback), with `WebGPU.isAvailable()` checks removed.
  - Benchmark on an i9-13900K + RTX 4070 in headless Chrome 147, with 1024 point + 512 spot lights:
    - 1280×720: static grid (#34931) 1.33 ms vs clustered 1.41 ms.
    - 2560×1440 at DPR 2: 3.13 ms vs 2.93 ms.
  - The grid rebuild costs about 0.33 ms CPU + 0.14 ms GPU per frame.
  — [PR #34978](https://github.com/mrdoob/three.js/pull/34978)
- **TiledLighting in r180.** It exists as a WebGPU addon (`webgpu_lights_tiled`), delegating to `TiledLightsNode`. — [TiledLighting.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/lighting/TiledLighting.js); [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- **"Dr. Strangelight" (Usnul, 2021).**
  - Forward+ was chosen because three.js lacked MRT for deferred.
  - Clusters live in "a 3d texture encoding clusters" with two levels of de-referencing into a growable light-index texture. Assignment runs on the CPU after spatial-index culling.
  - Measured:
    - 500 moving lights at about 100 FPS.
    - 90–120 FPS on an M1 MacBook Pro.
    - 30–40 FPS on an iPhone 12.
    - A Sponza test with 5000 lights (147 in the frustum) was "roughly equivalent to having only 2 lights."
  - Point lights only, no shadows mentioned, and "I'm not planning on releasing this for free."
  — [three.js forum](https://discourse.threejs.org/t/dr-strangelight-or-how-i-learned-to-stop-worrying-and-love-the-cluster/23104)
- **No open WebGL implementation found.** A search found no open-source clustered forward for WebGLRenderer via `onBeforeCompile` plus DataTextures; only student WebGL projects and the closed Strangelight. — [forum "Optimizing Point Lights"](https://discourse.threejs.org/t/optimizing-point-lights/36153)
- **HypeHype STB (SIGGRAPH 2025, Jarkko Lempiäinen), design.**
  - "Must use of pixel shaders (instead of compute shaders)" to benefit from tile-based rendering on mobile.
  - CPU frustum-culls lights.
  - Big tiles are 128×128 px with a 16-light reservoir, filled by Stratified Reservoir Sampling: 16 streams × one-sample A-Chao WRS, with a PDF built from the tile's depth bounds in the Hi-Z min/max buffer at LOD6.
  - Small tiles are 256 px interleaved over 32×32-px footprints (64 2×2 quads each), with 1–4 lights resampled per tile using a Lambert + Blinn-Phong shadowed PDF.
  - Light samples are 32-bit in render targets: a 60×36 RT for big tiles and 120×68 for small tiles at 1080p.
  — [STB notes PDF](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf); [course page](https://advances.realtimerendering.com/s2025/index.html)
- **HypeHype STB, shadows and lighting.**
  - Deferred shadows are evaluated once per 2×2 quad as 8-bit terms with 1-bit temporal noise, 0.5–2 MB at 1080p.
  - A persistent 16-bpp atlas holds spot maps and octahedral omni maps, static or dynamic, with priority-queue load balancing. Filtering is 4-tap hardware PCF plus stochastic PCF ("only 1 gather").
  - The lighting pass maps pixels back to tiles through a 16×16 8-bpp inverse LUT and has a "fixed cost independent of the scene lighting."
  — [STB notes PDF](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- **HypeHype STB, cost and limits.**
  - Direct lighting at 1 spp added 0.66 ms on an Adreno 610 over sun-only, and about 0.35 ms on an Adreno 830 and an RTX 4070.
  - With 50 lights in view: +1.5 ms on the budget phone and about 0.5 ms on the high-end phone and laptop.
  - Big-tile sampling with 500 lights costs 0.02 ms everywhere.
  - Denoising is WIP: TAA's 3×3 history clamp causes "flashing lighting splotch artifacts."
  - "The lighting algorithm supports currently only fully opaque surfaces rendered in the G-Buffer."
  — [STB notes PDF](https://advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)

### Inferences
**WebGL path (r180), ranked:**
1. **Constant-count light pool.** Extend the lab's existing VFX light pool.
   - Each frame, select the N most important shadowless point lights on the CPU: intensity × radius² ÷ distance² to the camera footprint, with hysteresis.
   - Fade spells by animating intensity, never by adding or removing lights. That avoids the program-key recompiles.
   - N ≈ 8–16. Cost is per pixel × N, the same as now.
2. **World-space 2D light grid for the top-down camera.**
   - The ortho camera sees a bounded box of ground. Bin lights on the CPU into XZ cells (e.g. 4 m) covering the camera footprint, using radius-vs-cell tests.
   - Upload an RGBA32F `DataTexture` of light data and an R16UI/R32UI index texture holding a fixed 16–32 slots per cell.
   - In materials, replace the point-light loop via `onBeforeCompile` with "fetch cell → loop slots → `texelFetch` light."
   - It costs two extra samplers in *every* material, so on WebGPU-terrain it competes with the 16-sampler cap; on WebGL the fragment texture-unit limit is usually 16 too.
   - This is the Strangelight idea simplified for a camera with no depth complexity. It is unbenchmarked.
3. **STB port.** Not recommended for the WebGL path now. The lab is forward (no G-buffer), has no Hi-Z or shadow atlas, and has no TAA on WebGL, while STB depends on TAA for denoising and even HypeHype hasn't solved TAA clamp flicker. Revisit on WebGPU with compute, which HypeHype itself names as future work.

**WebGPU path:**
- r180 has `TiledLighting`, but it was removed in r185 and is lossy for overlapping depths.
- After upgrading: `DynamicLighting` (r184) for the base set of mood lights, then `ClusteredLighting` (r185) for spell and torch point lights, plus spot lights from r187. Shadow casters stay on the standard path.
- Pitfalls:
  - Exponential depth slicing with an ortho camera, and especially with near = −300, is untested. Shifting the camera back 300 units and using near 0 / far 900 gives an identical ortho projection and removes the negative-near risk; check fog distances and LOD, which depend on camera position.
  - On the WebGL2 fallback the light-index buffer becomes a PBO-backed texture, i.e. another texture unit.

### Gaps
- No open-source clustered/tiled forward package for classic WebGLRenderer was verified.
- `ClusteredLighting` with `OrthographicCamera` is undocumented.
- The r187 "static grid" path (#34931) was not read.
- No source states outright that the r187 WebGL2 fallback does not apply to classic WebGLRenderer; this is inferred from the TSL/transform-feedback design.

---

## Q6. Temporal AA and upscaling on the WebGL path: TAARenderPass limits, a GLSL port of TRAANode, pmndrs alternatives, FSR1 and Snapdragon GSR ports, dynamic-resolution controllers

### Takeaway
`TAARenderPass` is not temporal reprojection. It is `SSAARenderPass` accumulating up to 32 jittered sub-pixel renders of the *same* view ("This effect uses no reprojection so it is no TRAA implementation"). It converges only while nothing moves, and the app must reset `accumulateIndex`.

A real WebGL TAA means porting r186's `TRAANode` + `TAAUtils`, which are short and fully specified:
- Halton(2,3) × 32 jitter through `camera.setViewOffset`, with the unjittered projection used for velocity.
- Velocity sampled at the closest depth in a 3×3 neighbourhood.
- Depth disocclusion (0.0005) with an edge exemption (0.001).
- Variance clipping (γ = mix(0.5, 1, (1−motion)²)) through `clipAABB`.
- Current weight 0.05 + 0.25 × sub-pixel correction + motion factor (over 128 px).
- Luminance-weighted `flickerReduction`.
- Ortho supported through `viewZToOrthographicDepth` since r184.

The WebGL path also needs its own velocity source. pmndrs has no TAA, and realism-effects' TRAA is MIT but perspective-only.

Upscaling:
- FSR1 (MIT) must come after AA and the tone map, in perceptual space, before grain/CA/UI.
- three.js r184's `FSR1Node` is a ready reference for a GLSL port: 12-tap EASU via `textureLoad`, 5-tap RCAS, `sharpness 0.2`, no `textureGather` because WebGL2 lacks it.
- Snapdragon GSR1 (BSD-3, GLSL + HLSL, one pass, 12-tap) costs 0.29–0.48 ms on Snapdragon for a 1240×576 input.
- GSR2 (BSD-3, `glsl_2_pass` fragment variant, 0.9–1.1 ms on an SD 8 Gen 3) needs depth, velocity and jitter.

Dynamic resolution: drei's PerformanceMonitor pattern is a tested controller shape. WebGPU timestamp queries are quantized to 100 µs in release Chrome.

### Cited Findings
- **TAARenderPass (r180).**
  - It extends `SSAARenderPass`. With `accumulate` on, the first frame is an unjittered "hold" render; then each frame adds `2^sampleLevel` samples (default 1) from `_JitterVectors[5]` (32 entries × 1/16 px) at weight 1/32, until `accumulateIndex` reaches 32.
  - There is no motion detection, velocity, reprojection or clamping: "Note: This effect uses no reprojection so it is no TRAA implementation."
  - Targets are HalfFloat.
  — [TAARenderPass.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/TAARenderPass.js)
- **TRAANode as shipped in r180 (the lab's current version).**
  - Jitter is a fixed 32-entry integer table; one entry is never used because of `% (length - 1)`.
  - It clamps history to the 3×3 min/max box, with no variance clipping and no explicit disocclusion.
  - Weights use tone-compressed luminance, with `currentWeight 0.05` base.
  - No orthographic or linearized-depth handling.
  — [TRAANode.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/TRAANode.js)
- **TRAANode changes in r181–r182.** Ghosting reduction (#31895), robust depth copy (#31908), adaptive blend weights (#32139), motion factor and disocclusion (#32296), "Replace MSAA sample pattern with Halton sequence." (#32319), and reduced smearing (#32322). — [r181 release](https://github.com/mrdoob/three.js/releases/tag/r181); [r182 release](https://github.com/mrdoob/three.js/releases/tag/r182)
- **TRAANode r184.** It added reversed/log depth and ortho: "It looks like no special care is needed for orthographic cameras." — [PR #33364](https://github.com/mrdoob/three.js/pull/33364)
- **TRAANode r186 logic.**
  - Halton(2,3) with 32 entries, applied as `camera.setViewOffset(W, H, jx - 0.5, jy - 0.5, W, H)` in `OnBeforeRenderPipeline` and cleared in `OnAfterRenderPipeline`. It acts as the pipeline's `viewOffsetOwner`, and the unjittered projection goes to the velocity node.
  - History and resolve targets are HalfFloat, plus a history `DepthTexture` (Float when depth is reversed).
  - Velocity is read at the closest-depth texel and turned into a UV offset through `* vec2(0.5, -0.5)`.
  - `isEdge = farthest - closest > 0.001`, `isDisocclusion = closest - previousDepth > 0.0005`, `valid = inUV && (isEdge || !isDisocclusion)`.
  - `motionFactor = saturate(len(Δuv*size)/128)`. Weight is `0.05 (+0.25·subpixelCorrection) + motionFactor`, or 1 when history is invalid.
  - Variance clip over 9 taps with γ = mix(0.5, 1, (1−motion)²).
  — [TRAANode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/TRAANode.js)
- **TAAUtils (r186), portable helpers.**
  - `clipAABB` clips toward the box centre by `vClip / max(|vClip/eClip|)`.
  - `flickerReduction` compresses each colour by `1/(max(rgb)+1)` and weights current/history by `w/(lum+1)`.
  - `samplePreviousDepth` reprojects through the previous inverse projection and world matrices and returns `viewZToOrthographicDepth` when `camera.isOrthographicCamera`, `viewZToPerspectiveDepth` otherwise.
  - `computeHaltonOffsets(n)` returns `[halton(i+1,2), halton(i+1,3)]` in [0, 1].
  — [TAAUtils.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/utils/TAAUtils.js)
- **TAAUNode (r184, #33368).**
  - "essentially a TAA but combined with upscaling," with an RCAS `SharpenNode`.
  - 9-tap Gaussian (Blackman-Harris approximation) reconstruction of the current frame, variance clipping and a thin-feature "lock."
  - `currentFrameWeight 0.025`, and "MSAA must be disabled when TAAU is in use."
  — [PR #33368](https://github.com/mrdoob/three.js/pull/33368); [TAAUNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/TAAUNode.js)
- **FSR1Node (r184, #33339).**
  - `FSR1Node(textureNode, sharpness = 0.2, denoise = false)`. Sharpness runs from 0 (maximum) to 2 (none), applied as `exp2(-sharpness)`.
  - EASU uses a "12-tap cross pattern" via `textureLoad` and RCAS uses 5 taps, with two HalfFloat targets at drawing-buffer size.
  - It "does not make use of textureGather() yet" because it is WebGPU-only and WebGL2 would need a fallback. No packed FP16.
  - It is worth it only if "fragment-shader bound."
  — [FSR1Node.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/FSR1Node.js); [PR #33339](https://github.com/mrdoob/three.js/pull/33339)
- **FSR1 placement and inputs (AMD).**
  - Integrate FSR1 "after anti-aliased rendering and tone mapping, but before any post-processing effects that introduce noise such as Film Grain, Chromatic Aberration etc or User Interface rendering."
  - Input should be "well anti-aliased," in perceptual [0–1] space, "noise free," and rendered with negative mip bias. "A negative input to RCAS will output NaN!"
  — [GPUOpen FSR1 manual](https://gpuopen.com/manuals/fidelityfx_sdk/fidelityfx_sdk-page_techniques_super-resolution-spatial/)
- **FSR1 source license.** MIT, "Copyright (c) 2021 Advanced Micro Devices." — [FidelityFX-FSR](https://github.com/GPUOpen-Effects/FidelityFX-FSR)
- **Snapdragon GSR, licence and SGSR1.**
  - The repo is BSD 3-clause.
  - SGSR1 "integrates upscaling and sharpening in one single GPU shader pass" with a "12-tap Lanczos-like scaling filter."
  - It "doesn't require an anti-aliased input but works best with one." Edge threshold 8/255 (mobile) or 4/255 (VR), edge sharpness 2 (range 1–2), RGBA/RGBY/LERP modes.
  - Timings for a 1240×576 input: SD888 0.476 ms, SD8 Gen1 0.356 ms, SD8 Gen2 0.295 ms. Bilinear is 0.248, 0.196 and 0.156 ms.
  - Shader folders are `glsl/` and `hlsl/`.
  — [snapdragon-gsr](https://github.com/SnapdragonStudios/snapdragon-gsr); [sgsr/v1](https://github.com/SnapdragonStudios/snapdragon-gsr/tree/main/sgsr/v1); [sgsr/v1/include](https://github.com/SnapdragonStudios/snapdragon-gsr/tree/main/sgsr/v1/include)
- **SGSR2.**
  - Variants: 2-pass-fs ("recommended", fragment shaders), 2-pass-cs and 3-pass-cs, under `include/glsl_2_pass` and `glsl_3_pass`.
  - Inputs: color, D24S8 depth, and velocity encoded `velocity*0.2495 + 32767/65535`, "Calculated for dynamic objects only -- pass zero for static objects." Halton jitter in [−0.5, 0.5]; 3-pass also needs opaque colour.
  - Timings on an SD 8 Gen 3 to 1260×2800 (2-pass-fs): 0.905 ms at 2.0×, 1.024 ms at 1.7×, 1.107 ms at 1.5×.
  — [sgsr/v2](https://github.com/SnapdragonStudios/snapdragon-gsr/tree/main/sgsr/v2)
- **Existing ports.** No WebGL or three.js port of SGSR was found by search. mpv carries GLSL FSR ports (agyild), but I did not verify their licence or code. — [search context: Doom9 thread](https://forum.doom9.org/archive/index.php/t-185324.html?pda=1)
- **realism-effects.** MIT. "OrthographicCamera isn't supported yet." `TRAAEffect` consumes a `VelocityDepthNormalPass`, and a v2 is "currently in the works." — [0beqz/realism-effects](https://github.com/0beqz/realism-effects)
- **pmndrs postprocessing.** It lists "Antialiasing" (SMAA/FXAA) but no temporal AA among its included effects. — [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing)
- **drei PerformanceMonitor.**
  - It averages FPS over `ms = 250` windows across `iterations = 10`.
  - It inclines or declines when more than `threshold = 0.75` of samples sit above or below the bounds: `refreshrate > 100 ? [60, 100] : [40, 60]`.
  - `factor` starts at 0.5 and changes in `step = 0.1` increments. `flipflops` (default Infinity) triggers `onFallback`.
  - It samples `performance.now()` in `useFrame`, not GPU time.
  — [PerformanceMonitor.tsx](https://github.com/pmndrs/drei/blob/master/src/core/PerformanceMonitor.tsx)
- **WebGPU timestamp quantization.** Chrome quantizes WebGPU timestamp queries to 100 µs unless the "WebGPU Developer Features" flag is enabled. — [Chrome WebGPU developer features](https://developer.chrome.com/docs/web-platform/webgpu/developer-features)
- **MSAA depth semantics.**
  - In WebGL, `resolveDepthBuffer` (default true) resolves multisampled depth into the depth texture.
  - "WebGPU does not support depth resolves; sampling the depth texture of a multisampled render target accesses the multisampled data directly." `storeMultisampledDepthBuffer` must stay true when depth is sampled.
  — [RenderTarget docs](https://threejs.org/docs/pages/RenderTarget.html)

### Inferences
**WebGL TRAA port (r180):**
1. **Jitter.** `camera.setViewOffset` with Halton(2,3) − 0.5 at the full render size. Keep an unjittered copy of `projectionMatrix` for reprojection. Disable MSAA when TAA is on.
2. **Velocity.**
   - Static world: reconstruct velocity from depth. Take the world position from `depth` and the inverse jittered view-projection, then `prevUV = prevViewProj * worldPos`. For the ortho camera this is exact.
   - Dynamic objects (hero, monsters, grass sway) need real per-object velocity, or they will ghost. Either render a small velocity pass for the `dynamic` layer only (RG16F; previous model matrices kept per object; skinned meshes need previous bone matrices, which is costly), or tag dynamic pixels in a stencil/mask and raise `currentWeight` there.
   - SGSR2 explicitly treats static pixels as zero-velocity and reprojects them from depth plus camera matrices, which supports this split.
3. **Resolve.** Translate the TRAANode r186 resolve and the four TAAUtils functions above to GLSL ES 3.0 (`texelFetch`, `textureSize`). Use a HalfFloat history plus a copied previous depth (a FloatType depth-copy shader, since the lab's depth texture is `FloatType`).
4. **Placement.** Resolve the opaque HDR (after AO and fog, before the VFX composite), then composite VFX with an *unjittered* camera clone so particles neither smear nor jitter, then bloom. This applies the first round's "draw VFX after TAA."
   - The current WebGPU chain feeds VFX *into* TRAA. Because `TRAANode` jitters the shared camera for every pass in the pipeline (`OnBeforeRenderPipeline`), moving VFX after TRAA on WebGPU also needs a separate unjittered camera for the VFX pass.

**Upscaling order for the lab:**
- Render at scale s, apply TAA (or FXAA/SMAA) at render resolution, then exposure + tone map + LUT at render resolution.
- Then run FSR1 EASU + RCAS (or SGSR1 for one cheaper pass) to the output size.
- Then grain, dither and UI at output size.
- This means splitting the lab's final shader: today it does exposure, tone map, LUT, grain and dither in one pass. FSR needs grain after the upscale.
- Translate EASU/RCAS from `FSR1Node.js` (it already avoids `textureGather`) or from AMD's `ffx_fsr1.h` under MIT.

**Dynamic-resolution controller:**
- Use the lab's GPU timer (WebGL `EXT_disjoint_timer_query_webgl2`; WebGPU timestamps at 100 µs granularity, fine for ms-level control) with rAF deltas as a fallback.
- Target about 90% of the frame budget. Adjust `s` in steps of 0.05–0.1 with drei-style windowed voting (e.g. 10 × 250 ms, 75% agreement), hysteresis between incline and decline, and a flip-flop cap.
- Snap sizes to multiples of 8 px to limit render-target reallocations.

**r184–r186 options (WebGPURenderer only):** TRAA with ortho (r184), `TAAUNode` + `SharpenNode` (r184), and `FSR1Node` (r184). TRAA keeps improving through r182.

### Gaps
- No published ms costs for TRAANode, TAAUNode or FSR1Node in three.js.
- No three.js or WebGL port of SGSR; no verified GLSL FSR1 port licence or details beyond AMD's MIT original.
- No published three.js dynamic-resolution controller driven by GPU timers; drei's uses CPU frame timing.

---

## Q7. Reflections for wet floors and water under a top-down camera: SSRNode/SSRPass cost and ortho support, box-projected cubemap probes, planar Reflector cost

### Takeaway
With a steep isometric camera, most of what a floor should reflect is off-screen, so screen-space reflections (SSR) contribute little. The cheap, robust layer is box-projected cubemap probes per room or area. In r180 TSL that is `pmremTexture(cube, getParallaxCorrectNormal(reflectVector, boxSize, boxCenter))` (the `bpcem` example). In WebGL it is drei's MIT `onBeforeCompile` patch of `envmap_physical_pars_fragment`.

SSR then becomes an optional short-range add-on for wet floors on WebGPU:
- `SSRNode` already supports ortho in r180 (orthographic branch, linear Z interpolation, incident direction (0,0,−1)).
- Its steps scale with the screen-space ray length × `quality`, and it skips non-metals by default.
- It gained distance-based step scaling and roughness blur in r183, and a stochastic mode plus denoiser in r185.

The WebGL `SSRPass` adds 2–3 scene renders (beauty, normals, and metalness when selective) and a `MAX_STEP` equal to the diagonal pixel count. It also does not set its `PERSPECTIVE_CAMERA` define from the camera, so ortho requires flipping that define by hand.

A planar `Reflector` re-renders the whole scene per reflector at `resolutionScale`, with MSAA ×4 by default on WebGL. Its ortho support arrived only in r184.

### Cited Findings
- **SSRNode (r180).**
  - `_isPerspectiveCamera = uniform(camera.isPerspectiveCamera)`. `getViewZ` uses the orthographic or perspective function; the incident direction is `normalize(viewPosition)` or `vec3(0,0,-1)`; ray Z is interpolated linearly for ortho.
  - The near-plane clamp applies to perspective only.
  - Defaults `maxDistance 1`, `thickness 0.1`, `opacity 1`, `quality 0.5`, `blurQuality 2`, `resolutionScale 1`.
  - `totalStep = max(|xLen|,|yLen|) * quality`.
  - Roughness blur is an optional `boxBlur` mip chain.
  — [SSRNode.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/SSRNode.js)
- **SSRNode (r186).**
  - Ortho handled by a build-time JS branch.
  - `reflectNonMetals false`, with dielectrics discarded "for a noticeable performance gain."
  - `MAX_STEPS 64` (scaled by quality) in stochastic mode, plus optional `binaryRefine` (8 extra iterations).
  - Stochastic GGX mode "expects a temporal/spatial denoiser downstream."
  - Alpha carries hit distance.
  — [SSRNode.js (r186)](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSRNode.js)
- **SSRNode r183.** "Performance optimizations." (#32637: distance-based step scaling at 0.5×–1× by depth, backfaces treated as opaque, precomputed step factor; no numbers given), "Add distance-aware blur for roughness." (#32834), and squared-roughness blur LOD (#32993). — [PR #32637](https://github.com/mrdoob/three.js/pull/32637); [r183 release](https://github.com/mrdoob/three.js/releases/tag/r183)
- **SSRNode r185.** "Spatiotemporal Denoiser for SSR." (#33843). The Migration Guide says the API "slightly changed and the implementation improved with a new optional denoiser" (r185) and that "The blend of `SSRNode` has been changed" (r183). — [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185); [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- **SSRPass (r180, WebGL).**
  - It always renders a beauty pass and a `MeshNormalMaterial` override pass, plus a metalness pass when `selects` is an array, plus an optional ground reflector pass.
  - Defaults `maxDistance 180`, `thickness .018`, `opacity 0.5`, `blur true`.
  - The beauty, normal and metalness targets stay full size regardless of `resolutionScale`.
  — [SSRPass.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/SSRPass.js)
- **SSRPass step count and ortho define (read from source).**
  - `MAX_STEP = sqrt(w² + h²)` of the effective resolution.
  - The pass never references `isPerspectiveCamera`. The shader's `PERSPECTIVE_CAMERA` define defaults to `true`, with an orthographic `#else` branch (`orthographicDepthToViewZ`, `viewIncidentDir = vec3(0,0,-1)`).
  — [SSRPass.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/SSRPass.js); [SSRShader.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/shaders/SSRShader.js)
- **Box-projected probes in TSL (r180 `bpcem` example).**
  - `WebGLCubeRenderTarget(512)` with HalfFloat, `LinearMipmapLinearFilter` and `generateMipmaps`; `CubeCamera(1, 1000, rt)`.
  - Updated *every frame*, with the ground hidden during capture.
  - `envNode = pmremTexture(rt.texture, getParallaxCorrectNormal(reflectVector, vec3(200,100,100), vec3(0,-50,0)))`.
  — [webgpu_materials_envmaps_bpcem.html (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_materials_envmaps_bpcem.html)
- **Box-projected probes in GLSL (drei `useBoxProjectedEnv`).**
  - It replaces `#include <worldpos_vertex>` to output `vWorldPosition`.
  - It swaps `envmap_physical_pars_fragment` and inserts `parallaxCorrectNormal(dir, envMapSize, envMapPosition)` after both the irradiance-normal and reflect-vector transforms.
  - `customProgramCacheKey` depends on box position and size, so moving the box recompiles.
  - It relies on fragile exact-string `replace()` calls.
  — [useBoxProjectedEnv.tsx](https://github.com/pmndrs/drei/blob/master/src/core/useBoxProjectedEnv.tsx)
- **ReflectorNode (r180, TSL).**
  - `resolutionScale 1` (`resolution` deprecated in r180), `generateMipmaps false`, `bounces true`, `depth false`, `samples 0`.
  - `updateBefore` mirrors a cloned camera, makes an oblique near plane (Lengyel), and calls `renderer.render(scene, virtualCamera)` into a HalfFloat target. It skips the render when the reflector faces away.
  - It has no camera-type checks.
  — [ReflectorNode.js (r180)](https://github.com/mrdoob/three.js/blob/r180/src/nodes/utils/ReflectorNode.js)
- **Reflector (r180, WebGL).**
  - Defaults `textureWidth 512`, `clipBias 0`, `multisample 4` (HalfFloat target).
  - The oblique clip uses `q.w = (1.0 + P[10]) / P[14]`, which is perspective math.
  - r184's #33249 says "The projective texture mapping required some updates so it works with orthographic projections as well." r185 made `getReflectionCamera()` public (#33556).
  — [Reflector.js (r180)](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/Reflector.js); [PR #33249](https://github.com/mrdoob/three.js/pull/33249); [r185 release](https://github.com/mrdoob/three.js/releases/tag/r185)

### Inferences
**Box probes:**
- Use one box probe per dungeon room or outdoor zone: a 128–256 px HalfFloat cube with PMREM.
- Capture on load and when lights change. If it must refresh, time-slice the six faces across frames. The `bpcem` example's every-frame 512² capture costs six extra scene renders per frame, which is unacceptable.
- On WebGPU, use `getParallaxCorrectNormal` in `envNode`.
- On WebGL, port drei's patch into the lab's own shader-chunk system rather than string-replacing stock chunks.
- **Sampler budget:** the probe *replaces* the material's existing env map, so the count stays the same. Blending two probes adds a sampler, so don't do that in the terrain shader.

**Wet floors:**
- Darken the albedo and lower the roughness (the roadmap's Lagarde wetness), then rely on the box probe plus the moon specular highlight.
- On WebGPU only, optionally add `SSRNode` at `resolutionScale 0.5`, low `quality`, metals only or a wet mask. This requires adding metalness/roughness to the lab's MRT.

**Water:**
- A `Reflector` makes sense only for one large water plane: `resolutionScale` 0.25–0.5 (or `textureWidth` ≈ 0.5 × screen on WebGL), `multisample 0`, and layers that exclude grass and particles.
- Each reflector equals one full extra scene render.
- With the lab's ortho camera, Reflector needs r184+ (or a backport of #33249). On r180 WebGL, ortho with Reflector produces wrong clipping and projective mapping.

**SSRPass on WebGL with ortho:**
- Set `ssrPass.ssrMaterial.defines.PERSPECTIVE_CAMERA = false` and mark `needsUpdate`.
- Even so, the two extra full scene renders plus diagonal-length marching make it a poor fit for the WebGL path. Skip SSR there.

### Gaps
- No ms costs for SSRNode, SSRPass, Reflector or ReflectorNode in three.js.
- No three.js multi-probe blending system was found.
- I did not test Reflector/ReflectorNode with ortho on r180, or SSRNode with near = −300 (its ortho path uses linear depth and should be safe).

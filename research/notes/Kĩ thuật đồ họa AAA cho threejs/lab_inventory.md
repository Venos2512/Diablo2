# Sanctuary Lookdev Lab: inventory of the rendering features it already has (three r180 + three.quarks 0.16, WebGL2/GLSL vs WebGPU/TSL)

> Scope: a read-only audit of the `E:\Diablo2\lookdev-lab` working tree on 2026-10-19. Many of the files read are uncommitted edits in a checkout that other threads share, so line numbers may drift. Every link points to a local file. Link text is the path relative to `E:/Diablo2/lookdev-lab/` (or `E:/Diablo2/` for art-direction), followed by line numbers. Dependencies are `three 0.180.0`, `three.quarks 0.16.0` and `esbuild 0.25.10` ([package.json:15-21](file:///E:/Diablo2/lookdev-lab/package.json)). No web research was done: anything said here about three.js internals comes only from the lab's own code comments, its docs and the user's memory notes.

## 1. Post-processing chain per backend: effects, order, and how WebGL and WebGPU differ

### Takeaway
Both backends run the same HDR chain:
1. Scene pass (HalfFloat, optional MSAA 4×).
2. GTAO with denoise.
3. Analytic exponential height fog.
4. Premultiplied VFX layer.
5. Bloom.
6. Display transform: exposure → white balance → contrast → saturation → tone map → lift/gamma/gain → vignette → sRGB → 3D LUT → grain → IGN dither.
7. FXAA or SMAA.
8. Optional retro low-res preview.

WebGPU adds TRAA. It uses a velocity MRT and resolves after bloom, before tone mapping. On WebGPU, AO normals and the debug channels come from the scene pass's MRT. WebGL instead reconstructs normals from depth and uses an onBeforeCompile debug patch.

None of these exist: SSR, DOF, motion blur, volumetric fog or god rays, lens flare, an outline/selection post pass, auto-exposure.

### Cited Findings
**WebGL2 chain (`WebGLPipeline`)**
- **Execution order in `render()`:**
  1. Scene into the HDR target.
  2. GTAO from the scene depth.
  3. VFX scene into its own target.
  4. Composite (AO, height fog, VFX).
  5. Bloom, in place on the HDR buffer.
  6. Final display transform.
  7. FXAA or SMAA.
  8. Retro.

  [src/backends/webgl/pipeline.js:232-335](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js)
- **Render targets:** the scene target is `HalfFloatType` with a `DepthTexture(FloatType)` and `samples: 0`; samples switch to 4 when `aa === 'msaa'`. The VFX and HDR targets are HalfFloat. Two 8-bit LDR targets serve AA and retro. [webgl/pipeline.js:45-50, 171-178](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js)
- **GTAO:** three's `GTAOPass`, fed the scene pass's depth via `setGBuffer(depthTexture)`. Normals are reconstructed from depth, and the pass's normal render target is replaced by a stub. AO runs at 0.5× or 1× resolution. Parameters: radius, distanceExponent, thickness, scale. Denoise is Poisson (comment "GTAO + Poisson denoise"). [webgl/pipeline.js:52-59, 165-168, 182-183, 247](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js)
  - The README adds that AO "follows wind and dissolve". [README.md:186-187](file:///E:/Diablo2/lookdev-lab/README.md)
- **Bloom:** three's `UnrealBloomPass` (defaults: strength 0.35, radius 0.4, threshold 1.0), added onto the HDR buffer before tone mapping. [webgl/pipeline.js:60, 296-300](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js)
  - The threshold is in scene-referred units, so emissive values above 1 bloom. [src/panels/post.js:46-47](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)
- **AA:** a `FXAAShader` material and `SMAAPass` run after the final pass, which is tone-mapped and display-referred. MSAA 4× multisamples the HDR scene target. [webgl/pipeline.js:61-69, 302-325](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [post.js:36-40](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)
- **Renderer setup:** `antialias:false`; `toneMapping = NoToneMapping` because the display transform runs in the final pass; `outputColorSpace = SRGB`; default shadow type `PCFSoftShadowMap`. [src/backends/webgl/index.js:14-19](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js)

**Shared GLSL post shaders**
- **Composite (linear HDR), in order:**
  - AO multiply: `mix(1, ao, intensity)`.
  - Analytic exponential height fog, integrated along the view ray: density·exp(−falloff·(camY−fogHeight)), with a start distance; sky pixels sit at a max distance.
  - A sun in-scatter lobe `pow(max(dot(dir,sunDir),0),8)·inscatter`.
  - Premultiplied VFX: `color·(1−a)+rgb`.

  [src/shaders/post/composite.frag.glsl:1, 30-52, 61-79](file:///E:/Diablo2/lookdev-lab/src/shaders/post/composite.frag.glsl)
- **Final display transform, in order:**
  1. Exposure (or the exposure false-colour view instead).
  2. White balance.
  3. Log contrast around 0.18.
  4. Saturation.
  5. Tone map.
  6. Display-referred lift/gamma/gain.
  7. Aspect-corrected vignette.
  8. Linear→sRGB.
  9. 3D LUT in display space (texel-centre scaled).
  10. Luminance-weighted film grain.
  11. Half-step interleaved-gradient-noise dither, which removes banding.

  [src/shaders/post/final.frag.glsl:1-3, 48-96](file:///E:/Diablo2/lookdev-lab/src/shaders/post/final.frag.glsl)
- **Tone mappers:** None (clamp), Linear, Reinhard, Cineon, ACES Filmic, AgX, Khronos PBR Neutral. [final.frag.glsl:29-37](file:///E:/Diablo2/lookdev-lab/src/shaders/post/final.frag.glsl); [src/core/grading.js:4-12](file:///E:/Diablo2/lookdev-lab/src/core/grading.js)
  - Scenes you have not tuned start on AgX. [post.js:34](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)
  - Weeping Fields uses ACES at its Night preset. [docs/HUONG_DAN.md:196-197](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
- **Chromatic aberration:** a radial R/B sampling offset of `(uv−0.5)·chromatic·0.012`. [final.frag.glsl:39-46](file:///E:/Diablo2/lookdev-lab/src/shaders/post/final.frag.glsl)
- **Grading helpers** ([grading.js:18-50](file:///E:/Diablo2/lookdev-lab/src/core/grading.js)):
  - Exposure in EV: `2^ev`.
  - Luminance-preserving white balance: warm/cool lerp plus tint.
  - Kelvin→RGB using the Tanner Helland fit.
- **Retro preview:** low internal height (480/600/720/360p), per-channel level quantisation, closed-form 4×4 Bayer dither, applied to the display-referred image. [src/shaders/post/retro.frag.glsl:1-30](file:///E:/Diablo2/lookdev-lab/src/shaders/post/retro.frag.glsl); [post.js:115-120](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)

**WebGPU chain (`WebGPUPipeline`, a three `PostProcessing` node graph)**
- **Stated order:**
  1. Scene pass (MRT: output + normal [+velocity] [+debug]).
  2. GTAO with denoise.
  3. Height fog.
  4. VFX pass.
  5. [TRAA].
  6. Bloom.
  7. Display transform.
  8. FXAA/SMAA.
  9. Retro.

  Uniform changes apply live; structural changes rebuild the graph. [src/backends/webgpu/pipeline.js:1-6](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
- **Actual graph** ([webgpu/pipeline.js:136-243](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)):
  1. `pass(scene, camera, {samples: msaa?4:0})`.
  2. MRT: `normal: normalView` when AO is on, `velocity` when TRAA is on.
  3. `ao(depth, normal, camera)` (GTAONode), then `denoise(...)` (DenoiseNode), then the AO multiply.
  4. `heightFog(u)`.
  5. A `TransparentPassNode` composites the VFX scene.
  6. `bloom()` (BloomNode).
  7. `traa(hdr, depth, velocity, camera)`.
  8. `displayTransform`.
  9. `fxaa()` or `smaa()` nodes.
  10. `retroPreview`.
- **TRAA placement:** "TRAA resolves after bloom so the jittered bloom is stabilised with everything else", i.e. in HDR before the display transform. [webgpu/pipeline.js:213-217](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
  - The panel offers TRAA only on the WebGPU renderer. [post.js:37-40](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)
- **Structural rebuild key:** scene/vfxScene/camera uuids, AA type, AO/bloom/fog on-off, tone mapping, false colour, retro, `chromatic>0`, debug channel, LUT. [webgpu/pipeline.js:127-134](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
- **Renderer setup:** `outputColorTransform=false` on the post graph; the renderer uses `NoToneMapping`, `antialias:false` and `trackTimestamp:true`. [webgpu/pipeline.js:45-46](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js); [src/backends/webgpu/index.js:13-18](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
- **TSL ports mirror the GLSL:** `heightFog` uses the same integral; `displayTransform` calls TSL `toneMapping(type, 1, c)`; `retroPreview` matches retro.frag. [src/backends/webgpu/tsl/post.js:1, 43-144](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/tsl/post.js)
  - Shared luma, sRGB, false-colour and PBR-validate functions: [tsl/common.js:1-43](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/tsl/common.js)
- **Chromatic aberration on WebGPU** needs `convertToTexture`, i.e. an extra render-to-texture. [webgpu/pipeline.js:219-224](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)

**Where the two backends differ**
- **AO normals:** WebGL reconstructs them from depth; WebGPU reads `normalView` from the MRT. [webgl/pipeline.js:52-54](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:149, 164-170](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
  - **Stale doc/UI text:** the Post panel note still says "WebGL2 renders an extra normal/depth pass for GTAO" ([post.js:57](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)). The WebGL pipeline header still says "AO (GTAO, own G-buffer)" ([webgl/pipeline.js:2](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js)). The code contradicts both.
- **Debug channel views:**
  - WebGL uses a `lab-debug` onBeforeCompile patch on every MeshStandardMaterial: albedo, normal, roughness, metalness, material AO, emissive, PBR validation. The SSAO buffer view comes from the composite pass. [src/backends/webgl/patches.js:202-240](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/patches.js); [webgl/index.js:92-97](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js)
  - WebGPU uses extra MRT attachments, packed into three RGBA16F targets because "WebGPU caps colour attachments at 32 bytes per sample". [webgpu/pipeline.js:146-157, 172-191](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
  - The material AO channel is WebGL2-only. [README.md:32-35](file:///E:/Diablo2/lookdev-lab/README.md)
- **LUT:** WebGL samples a `Data3DTexture` via `sampler3D`. WebGPU samples a 2D strip instead: blue slices side by side, two bilinear fetches blended by hand. The reason: three r180 uploads 3D textures slice by slice, and Dawn/SwiftShader then drops the whole frame. [src/core/lut.js:1-10](file:///E:/Diablo2/lookdev-lab/src/core/lut.js); [tsl/post.js:100-112](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/tsl/post.js)
- **TRAA** is WebGPU only; WebGL has FXAA, SMAA and MSAA. [post.js:37-38](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)
- **VFX pass:** WebGPU uses `TransparentPassNode`, which forces a transparent-black clear because nodes such as SMAA reset the clear colour. [webgpu/pipeline.js:22-37](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
- **GPU timing:** WebGL reports per pass (Scene, AO, VFX, Composite, Bloom, Final, SMAA/FXAA, Retro); WebGPU reports the total only (`passes: []`). [webgl/pipeline.js:236-333](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/index.js:235-237](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)

**Extras**
- **LUT looks:** None, Teal & orange, Bleach bypass, Sanctuary gloom, plus mood looks such as `act1Tristram` and `v1Moor`; .cube files can also be loaded. LUTs are stored as HalfFloat RGBA, and the generated looks are 33³. [lut.js:15-26, 108-135](file:///E:/Diablo2/lookdev-lab/src/core/lut.js); [src/lighting/moods.js:20, 159](file:///E:/Diablo2/lookdev-lab/src/lighting/moods.js); [post.js:77-106](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)
- **Readability check views:** value greyscale, deuteranopia, protanopia, tritanopia (Machado 2009, full severity). They are baked into the LUT, so there is no extra pass. [lut.js:234-252](file:///E:/Diablo2/lookdev-lab/src/core/lut.js); [post.js:108-113](file:///E:/Diablo2/lookdev-lab/src/panels/post.js); [README.md:52-53](file:///E:/Diablo2/lookdev-lab/README.md)
- **Per-scene memory:** tone mapping, exposure, fog and the framing grade are saved per scene. [src/app/App.js:433-459](file:///E:/Diablo2/lookdev-lab/src/app/App.js)
- **UI ranges:** exposure −6…+6 EV; bloom strength 0–3, radius 0–1, threshold 0–8; AO intensity 0–1.5, radius 0.02–2, half or full resolution; VFX layer full, half or quarter resolution. [post.js:31-56, 122-124](file:///E:/Diablo2/lookdev-lab/src/panels/post.js)

### Inferences
- The stack is a classic forward-plus-post HDR pipeline. The AAA gaps:
  - No temporal AA on WebGL.
  - No SSR or SSGI.
  - No volumetrics.
  - No auto-exposure.
  - No DOF or motion blur.
  - No outline/selection post effect.
- TRAA already writes a velocity MRT on WebGPU, so motion blur or a temporal upscaler would be incremental work there. WebGL has no MRT scene pass, so the same work would be much larger on that path.

### Gaps
- **Auto-exposure / eye adaptation:** none found. Greps for `autoExposure|eye adapt|adaptation|histogram|averageLum` returned no hits. Exposure is a fixed EV per scene or per mood.
- **Pass costs:** not measured (read-only audit, nothing was run). Real numbers would come from the lab's own Performance tab.

## 2. Lighting & shadows: light types, shadow maps, baked shadows, IBL, fog, GI/probes

### Takeaway
- **Lights:**
  - Directional (moon/sun).
  - Hemisphere ambient.
  - Point: fires, lanterns, torches, candles, pooled VFX lights.
  - Spot: the hero "light radius", studio lights.
  - RectArea: studio, with LTC set up on both backends.
  - All use physical units, Kelvin colour and flicker.
- **Shadows:**
  - three's PCF-soft by default (Basic, PCF, PCFSoft and VSM are selectable).
  - One orthographic directional map per scene; no CSM.
  - A few 512 px point-light shadows.
  - Weeping Fields adds a custom moon shadow: static casters are baked once, moving casters are drawn every frame, and the result is filtered with PCSS (contact hardening).
- **IBL:** PMREM from 1k HDRIs or from `RoomEnvironment`.
- **No light probes or real-time GI.** A CPU-baked sky-visibility AO and a stylised "shadow fill" stand in for GI.
- **Fog** is a post-process height fog, not `scene.fog`.

### Cited Findings
- **Default shadow settings** ([src/panels/lighting.js:8-27](file:///E:/Diablo2/lookdev-lab/src/panels/lighting.js)):
  - pcfsoft, 2048 px map, bias −0.0002, normalBias 0.02, radius 3.
  - Point-light maps are capped at 1024.
  - Changing the map size sets `mapSize` and disposes the light's live map at runtime, on both backends, with no guard.
- **Shadow type switch** (Basic, PCF, PCFSoft, VSM) on both renderers. [webgl/index.js:70-76](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js); [webgpu/index.js:141-144](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
- **Shadow maps are re-rendered every frame:** WebGL sets `autoUpdate=false` and then `needsUpdate=true` each frame; WebGPU uses `autoUpdate=true`. [webgl/pipeline.js:238, 243](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:267](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
- **Quality presets set the shadow map size:** 1024 (Low), 2048 (Medium, High), 4096 (Ultra). [src/core/quality.js:2-7, 19](file:///E:/Diablo2/lookdev-lab/src/core/quality.js)
- **Weeping Fields lights** ([src/scenes/weepingFields.js:2159-2255](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)):
  - Moon `DirectionalLight`: 2048 map, 80×80 m orthographic frustum (±40), near 1, far 160, bias −0.0004, normalBias 0.03.
  - The baked moon shadow (described below).
  - `HemisphereLight` for sky/ground ambient.
  - Burning-cart `PointLight`: 1850 K, 512 shadow map.
  - Lanterns, the shrine candle and camp fires: PointLights without shadows.
  - Hero "player light radius": a `SpotLight` with an 80° cone, 12 m range, 1024 map and focus 0.8. It casts shadows only when the backend is WebGL.
- **Moor terrain scene** ([src/scenes/terrain.js:1001-1050](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js)):
  - Moon with a 2048 map over a 60×60 m frustum.
  - Campfire PointLight with a 512 shadow.
  - Torches and camp-prop lights without shadows, because "each shadow map counts against WebGPU's 16 sampled textures per stage".
  - Hero PointLight with decay 1.1.
- **Catacombs:** torch PointLights with 512 maps; the `torchShadows` setting turns shadows on for a subset of them. [src/scenes/catacombs.js:213-222, 237](file:///E:/Diablo2/lookdev-lab/src/scenes/catacombs.js)
- **Graveyard:** moon at 2048 plus torch shadows at 512. [src/scenes/graveyard.js:349-372](file:///E:/Diablo2/lookdev-lab/src/scenes/graveyard.js)
- **Studio rigs:**
  - RectAreaLight softboxes, a SpotLight key and rim, a DirectionalLight, candle PointLights with flicker.
  - Physical units: lux, candela, nits.

  [src/lighting/studioRigs.js:1-13, 51-92](file:///E:/Diablo2/lookdev-lab/src/lighting/studioRigs.js)
  - RectArea LTC is initialised on both backends. [webgl/index.js:113-115](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js); [webgpu/index.js:222-224](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
- **Act I moods:**
  - Each mood sets the scene's lights, exposure, fog and grade.
  - It adds a hero PointLight with decay 1 (inverse-linear falloff) that follows the character.
  - It adds a fresnel rim on the character, rain and splashes, wet ground with puddle ripples, lightning flashes, dust and ground mist.
  - Mood lights stay in the scene and are switched by intensity, so the light count never changes (changing it recompiles every lit material).

  [src/lighting/moodController.js:1-11, 38-39](file:///E:/Diablo2/lookdev-lab/src/lighting/moodController.js); [README.md:107-115, 193-196](file:///E:/Diablo2/lookdev-lab/README.md)
- **Pooled VFX point lights:** fixed pool size "so casting never changes the light count". [src/vfx/lights.js:1-2](file:///E:/Diablo2/lookdev-lab/src/vfx/lights.js)
- **Baked static shadow (Weeping Fields moon):**
  - **How it works:**
    - Static casters are rendered once per light direction into a second target.
    - Every frame, a cover quad that fills the shadow frustum writes that baked depth into the live map, and only the moving casters are drawn on top.
    - Receivers sample the light's normal map, so no material patch and no extra sampler are needed.

    [src/env/bakedShadow.js:1-8](file:///E:/Diablo2/lookdev-lab/src/env/bakedShadow.js)
  - **Re-bake trigger:** a change in light position or target, map size or frustum (`bakeKey`). [env/bakedShadow.js:85-95](file:///E:/Diablo2/lookdev-lab/src/env/bakedShadow.js)
  - **WebGL half:**
    - It uses three's own shadow pass, called from `scene.onAfterRender`.
    - `onBeforeShadow` drops the static meshes by zeroing their draw range.
    - The quad's material copies the RGBA-packed baked depth with `texelFetch`.

    [src/backends/webgl/bakedShadow.js:1-5, 40-55, 88-141](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/bakedShadow.js)
  - **WebGPU half:** a `ShadowNode` subclass that swaps the node's shadow map for the bake render. [src/backends/webgpu/bakedShadow.js:1-6, 51-124](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/bakedShadow.js)
  - **Documented behaviour** ([docs/HUONG_DAN.md:427-434](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)):
    - Re-bake takes under 1 ms.
    - Static casters: houses, kit pieces, fences, rocks, the shrine, the waypoint, chests, veins.
    - Moving casters: characters, monsters, crows, wind-blown trees and shrubs.
    - Default softness is 2.5°.
- **PCSS** ([src/shaders/chunks/pcss.glsl:1-62](file:///E:/Diablo2/lookdev-lab/src/shaders/chunks/pcss.glsl); [env/bakedShadow.js:11-25](file:///E:/Diablo2/lookdev-lab/src/env/bakedShadow.js)):
  - Algorithm: Fernando 2005, with a 16-tap blocker search and a 24-tap filter.
  - Taps follow a Vogel spiral rotated per shadow texel with IGN.
  - A receiver-plane depth bias keeps the wide kernels off sloped ground; reads use an explicit LOD.
  - A negative shadow radius turns it on; the radius encodes penumbra texels per unit of depth, derived from the light's angular radius.
  - **WebGL install:** wraps three's `getShadow()` inside `shadowmap_pars_fragment`. [webgl/bakedShadow.js:10-38](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/bakedShadow.js)
  - **WebGPU install:** the TSL twin `pcssFilter` is the ShadowNode's filter on a real WebGPU device only. The WebGL2 fallback "cannot load texels of a comparison depth texture and keeps three's filter"; VSM also keeps three's. [webgpu/bakedShadow.js:4-6, 11-49, 124](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/bakedShadow.js)
- **Moving effects carried into shadows:**
  - WebGL attaches per-mesh shadow depth/distance "twins" that carry the `shadow:true` patches, so wind sway and dissolve holes also appear in shadows. [patches.js:6-9, 123-170](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/patches.js)
  - WebGPU: `positionNode` carries over automatically; dissolve gets a masked copy of the shadow material through a `renderObject` override. [webgpu/index.js:49-80](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js); [README.md:184-185](file:///E:/Diablo2/lookdev-lab/README.md)
- **Cast-shadow strength** uses `LightShadow.intensity` on the moon and fire lights. [weepingFields.js:2435-2436](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [terrain.js:1153-1154](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js); [HUONG_DAN.md:349-350](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
- **IBL:**
  - `scene.environment` comes from either an equirect HDRI (three converts it to PMREM on demand) or `RoomEnvironment` through `PMREMGenerator.fromScene(…, 0.04)`.
  - Environment intensity and rotation are set, and the background is blurred.

  [src/scenes/studio.js:162-217](file:///E:/Diablo2/lookdev-lab/src/scenes/studio.js); [webgl/index.js:117-124](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js); [webgpu/index.js:226-233](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
  - Bundled HDRIs: `moonless_golf_1k.hdr`, `quarry_01_1k.hdr`, `royal_esplanade_1k.hdr`. [src/assets/samples.json](file:///E:/Diablo2/lookdev-lab/src/assets/samples.json)
  - The Act I scenes load an HDRI per time of day or mood. [weepingFields.js:2373-2417](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [terrain.js:1087-1134](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js)
- **Baked sky-visibility AO (Weeping Fields):**
  - **Bake:** at load, buildings and solid props are rasterised into an occluder height field; each splat texel searches 16 directions for its horizon within 9 m and keeps the cosine-weighted visible sky.
  - **Ground:** the result goes into the splat alpha. The code comment explains: "no extra texture (WebGPU's 16 samplers are spent)".
  - **Props:** the result also goes into prop vertex colours over their bottom 1.6 m.

  [weepingFields.js:1463-1474, 1589-1629](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - The doc gives about 0.5 s and 25 cm cells, and notes it darkens indirect light only. [HUONG_DAN.md:419-425](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
  - The terrain applies it to indirect diffuse and specular in GLSL, and through `aoNode` in TSL. [src/backends/webgl/effects.js:404-407](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js); [src/backends/webgpu/effects.js:607](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/effects.js)
- **Shadow fill:**
  - Lit results below a luminance threshold are lifted toward a half-desaturated, tinted copy of the albedo: the "painted-game fill".
  - It is not a light, and already-lit areas are untouched.

  [src/shaders/effects/shadow_fill.glsl:1-16](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/shadow_fill.glsl); [HUONG_DAN.md:347-350](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
- **Fog:**
  - Post-process height fog only (see §1). `scene.fog`/FogExp2 appears only in a comment about matching the v1 game's FogExp2. [moods.js:146-150](file:///E:/Diablo2/lookdev-lab/src/lighting/moods.js)
  - Moods set fog per scene: colour, density, falloff, start, inscatter, height. [moods.js:141](file:///E:/Diablo2/lookdev-lab/src/lighting/moods.js)
- **No probes, GI or cascades:** greps for LightProbe, irradiance, SH9, sphericalHarmonic, CSM, Cascad and SSGI over `src/**/*.js` found nothing except false positives inside the base64 blob `src/procedural/baked_data.js`. GLSL greps for cascade, CSM and probe found no relevant hits. [src/](file:///E:/Diablo2/lookdev-lab/src)

### Inferences
- Lighting goes through three's forward path: every extra light or shadow adds per-fragment cost and, on WebGPU, uses up samplers. That is why the lab freezes light counts and limits which lights cast shadows.
- The baked static/dynamic moon shadow with PCSS is the most AAA-like lighting system in the lab. It can serve as a template for any static/dynamic shadow cache, but it covers one directional light only.

### Gaps
- I did not trace whether the HemisphereLight and the IBL are both active in every Weeping Fields time preset; the `WEEPING_TIMES` table was not read in full.

## 3. Materials & surfaces: terrain, splat/height blending, triplanar, vegetation/wind, water, decals, flames/emissive, overrides

### Takeaway
- **Terrain:** a three-layer, height-blended splat shader. Layers are dry dirt, wet dirt, grass, plus a blood-soaked tint layer.
  - Inigo Quilez "texture repetition technique 3" anti-tiling, sampled with `textureGrad`.
  - Macro brightness variation and edge noise.
  - Standing water in the hollows.
  - A grass contact shadow, and baked AO in the splat alpha.
  - Planar world-XZ projection only: no triplanar, parallax or displacement.
- **Vegetation:**
  - CPU-placed InstancedMesh grass tufts and alpha-tested grass cards.
  - Instanced shrubs and cloth.
  - A world-space vertex wind that also moves the shadows.
- **Water:**
  - Shader puddles with analytic rain ripples.
  - Standing water inside the terrain shader.
  - The creek is a transparent glossy ribbon with UV-scrolled flow. No reflection, refraction or depth fade.
- **Decals:** mesh quads with `polygonOffset`. No projected decals.
- **Flames:** instanced billboard flames that drive light flicker.
- **Material system:**
  - On WebGL, a composable `onBeforeCompile` patch system.
  - On WebGPU, a node-patch system that folds effects into node slots.
  - GLSL hot reload, in-browser shader edits, and a GLSL texture forge.

### Cited Findings
- **Terrain shader** (WebGL GLSL; the TSL twin is functionally identical):
  - **Layering:** three layers stacked dirt → wet dirt → grass, driven by a world-space splat (R = wet, G = grass, B = blood-soaked, A = baked sky visibility). Each layer's height sits in its normal map's alpha, so transitions follow the relief. [src/shaders/effects/terrain.glsl:1-11](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)
  - **Anti-tiling:** Inigo Quilez technique 3. An area noise picks one of 8 virtual UV offsets; two lookups are cross-faded, biased by their colour difference; `textureGrad` takes gradients from the plain UV so the offset jumps cause no mip seams. [terrain.glsl:56-75](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)
  - **Blending:** a height-biased smoothstep mask with softness and height-blend controls. Noise breaks up only partial weights, so edges wander and full areas stay full. [terrain.glsl:77-86](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)
  - **Surface details** ([terrain.glsl:100-146](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)):
    - A damp halo darkens dry dirt around wet areas.
    - Standing water collects in the wet layer's hollows: dark, glossy, flat normal.
    - Grass reads as a raised mat: a contact shadow falls on the ground beside it (one splat tap toward the light), and the blades darken toward their roots at the edge.
    - Blood-soaked ground tints whatever lies under it and draws ridged-noise vein lines.
    - Texture AO is folded into albedo, a macro brightness noise is applied, and a layer-weight debug view exists.
  - **Normals:** a world-UV tangent frame (T=+x, B=−z) follows the slope through the normal. [terrain.glsl:148-158](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)
  - **Samplers:** the shader declares 9 layer samplers (albedo, normal, ORM × 3) plus the splat, i.e. 10 textures. [terrain.glsl:13-23](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)
    - The moor scene's comment agrees: "the terrain shader already samples 10 textures". [terrain.js:1032-1033](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js)
  - **Mapping:** planar only. UVs are `st = vec2(worldPos.x, -worldPos.z)`. [terrain.glsl:89](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl)
    - No triplanar, parallax/POM or displacement code anywhere: greps for triplanar, parallax, POM and displacementMap found no real hits in `.js` or `.glsl`. [src/](file:///E:/Diablo2/lookdev-lab/src)
  - **Install and parity:** WebGL injects it as a `lab-terrain` patch on MeshStandardMaterial (albedo/roughness/normal hooks, indirect light × sky). [webgl/effects.js:334-411](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
    - The TSL twin also uses `.grad()` sampling and a `mix`-based stack. [webgpu/effects.js:509-610](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/effects.js)
- **Splat map:**
  - 512² RGBA8 texture over 120 m, blurred.
  - A brush paints dirt, wet, grass or blood, with undo and PNG export/import.

  [src/env/terrain.js:235-253, 338-339, 387-418](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js); [README.md:72-76](file:///E:/Diablo2/lookdev-lab/README.md)
  - **Stale comment:** terrain.js's header still calls channel A "unused" ([env/terrain.js:1-2](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js)), while the texture's name says it holds baked sky visibility ([env/terrain.js:248](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js)).
- **Terrain texture sets:** D2R moor (generated tiles), painted tiles, concept swatches, and procedural (forge). [env/terrain.js:19-27](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js)
  - Layer textures are RGBA8 `DataTexture`s with mipmaps and anisotropy up to 8. The normal map's alpha carries height; ORM is packed. [env/terrain.js:36-47, 49-107](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js)
- **Texture forge:** bakes tileable PBR sets (albedo, normal, ORM) from GLSL recipes on a private WebGL2 context and hands plain DataTextures to either renderer; recipes hot-reload. [src/env/forge.js:1-4](file:///E:/Diablo2/lookdev-lab/src/env/forge.js)
  - Forge resolution is 512 at Low quality and 1024 otherwise. [src/env/materials.js:5-11](file:///E:/Diablo2/lookdev-lab/src/env/materials.js)
- **Vegetation:**
  - **Grass tufts:** an InstancedMesh with per-instance colour. At density 1 the caps are about 3.1k meadow tufts, 3.6k clumps and 2.6k stubble. [weepingFields.js:1729-1753](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - **Grass cards:** an InstancedMesh per cell of a 2×2 alpha atlas, with `alphaTest 0.45` and `frustumCulled=false`. [weepingFields.js:1824, 1846-1867](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [env/terrain.js:174-215](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js)
  - **Shrubs:** instanced shrub kit with wind. [weepingFields.js:1872-1900](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - **Cloth:** instanced banner cloth with wind. [weepingFields.js:1952-1966](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
- **Wind:**
  - **Shader:** world-space vertex displacement after instancing. A height mask (squared toward the tips) scales two-sine sway plus noise gusts. [src/shaders/effects/wind.glsl:1-18](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/wind.glsl); [webgl/effects.js:90-121](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
  - **Shadows:** the patch has `shadow: true`, so shadows sway too.
  - **Per class:** separate instances for grass, trees, shrubs and cloth. [weepingFields.js:634-649](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [terrain.js:326-332](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js); [graveyard.js:85-88](file:///E:/Diablo2/lookdev-lab/src/scenes/graveyard.js)
- **Water:**
  - **Puddle/liquid effect (water or blood):**
    - Noise-shaped puddles on upward-facing surfaces.
    - Wet darkening and gloss elsewhere.
    - Analytic rain-ripple normals from a 3×3 grid of ring cells.

    [src/shaders/effects/liquid.glsl:1-54](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/liquid.glsl); [webgl/effects.js:191-218](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
  - **Creek:** a transparent `MeshStandardMaterial` ribbon (roughness 0.08, `envMapIntensity` 1.5, alphaMap, vertex colours, `depthWrite:false`). [weepingFields.js:716-722](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
    - Flow is a scrolled `map.offset.y`. [weepingFields.js:2651](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [terrain.js:1316](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js)
  - **Not present:** Reflector, Refractor, SSR or depth-based water code.
- **Decals and ground markings:**
  - **Wall decals:** handprint and claw-mark quads (MeshStandardMaterial, transparent, `depthWrite:false`, `polygonOffset -3`), merged with StaticBatch. [weepingFields.js:1631-1650](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - **Road ruts:** a ribbon mesh with `polygonOffset -2`. [weepingFields.js:709-715](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - **Telegraphs and rings:** draped on the ground through a height function, using vertex alpha. [src/env/signals.js:1-10](file:///E:/Diablo2/lookdev-lab/src/env/signals.js)
  - **Splat particles:** the particle shader's `splat (decal)` shape. [src/shaders/vfx/particle.frag.glsl:14](file:///E:/Diablo2/lookdev-lab/src/shaders/vfx/particle.frag.glsl)
  - **Not present:** `DecalGeometry`, projector decals or deferred decals.
- **Bump from albedo:** the camp-kit atlases have no normal map, so their albedo doubles as a bump map. [weepingFields.js:788-803](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
- **Flames:**
  - `FlameField` draws every flame of a scene in one call (`InstancedBufferGeometry`), each with its own seed, size and flicker; the flicker can drive a PointLight. [src/env/flames.js:1-77](file:///E:/Diablo2/lookdev-lab/src/env/flames.js)
  - The flame shader is premultiplied-additive, in GLSL and TSL. [webgl/effects.js:221-240](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
- **Emissive materials:**
  - An embers material with `emissiveIntensity` 3. [src/env/materials.js:25](file:///E:/Diablo2/lookdev-lab/src/env/materials.js)
  - Dissolve adds an HDR emissive edge. [webgl/effects.js:124-151](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
- **Shader-lab effects (each written in GLSL and TSL with one parameter schema):** vertex wind, flame, dissolve, status overlays (frozen/burning/poisoned/hit flash), fresnel rim, puddles, town portal, waypoint runes. [README.md:54-58](file:///E:/Diablo2/lookdev-lab/README.md); [webgl/effects.js:31-41](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
  - Non-lab effects on the same system: cutaway, hero rim, shadow fill, terrain, baked shadow. [webgl/effects.js:295-435](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js); [webgpu/effects.js:476-627](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/effects.js)
  - The hero rim weights the fresnel toward the upper silhouette. [src/shaders/effects/hero_rim.glsl:1-14](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/hero_rim.glsl)
  - Interactables get a proximity rim "glint". [weepingFields.js:2084-2090](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
- **Procedural character material:** flash, tint, frozen, rim, highlight and ghost are ported to TSL; the Hollow King's lava cracks are not, so they are WebGL-only. [src/procedural/nodeMaterial.js:1-4](file:///E:/Diablo2/lookdev-lab/src/procedural/nodeMaterial.js); [README.md:43-46](file:///E:/Diablo2/lookdev-lab/README.md)
- **MeshPhysicalMaterial features:** clearcoat, transmission, sheen and iridescence can be edited in the material inspector. A grep found these properties only in `panels/lookdev.js`, so no scene uses them. [src/panels/lookdev.js:123-164](file:///E:/Diablo2/lookdev-lab/src/panels/lookdev.js)
- **Material-override infrastructure:**
  - **WebGL patch system:** composable `onBeforeCompile` patches with `order`, `needs` (shared varyings for object position, world position and world normal, aware of batching and instancing) and `shadow` flags. The program cache key includes every patch id plus the shader hot-reload version. [patches.js:1-121](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/patches.js)
  - **WebGPU node patches:** they fold into the `positionNode`, `colorNode`, `roughnessNode`, `metalnessNode`, `emissiveNode`, `normalNode`, `aoNode`, `output` and `maskNode` slots of a node-material twin of each built-in material. [webgpu/effects.js:1-6, 32-140](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/effects.js)
  - **Shader registry:** `src/shaders/chunks/*.glsl` are published as `THREE.ShaderChunk.lab_*`, and dev-server edits recompile every material that uses them. [src/core/shaderRegistry.js:1-61](file:///E:/Diablo2/lookdev-lab/src/core/shaderRegistry.js); [src/backends/webgl/hot.js:1-32](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/hot.js); [scripts/esbuild-plugins.mjs:7-32](file:///E:/Diablo2/lookdev-lab/scripts/esbuild-plugins.mjs)
  - **In-browser edits:** GLSL edited in the browser is kept in localStorage. [src/core/shaderOverrides.js:1-56](file:///E:/Diablo2/lookdev-lab/src/core/shaderOverrides.js)
- **Palette lock:** each material's mean colour is shifted to a Valdren swatch while the texture keeps its detail; terrain layers can be locked too. [HUONG_DAN.md:436-439](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md); [README.md:77-79](file:///E:/Diablo2/lookdev-lab/README.md)

### Inferences
- The terrain is already close to an AAA layered-terrain shader: height blend, anti-tiling, macro variation, wetness and a corruption layer. The missing AAA pieces are triplanar on slopes, parallax/POM or displacement, detail normal maps, runtime virtual texturing, and more than 3 layers. More layers are constrained by the WebGPU sampler budget; texture arrays would ease that, though none exist yet.
- Water is stylised and deliberately cheap: no reflections, no refraction.

### Gaps
- I did not read `env/valdren.js` (palette lock) or `env/forge.js` beyond their headers.
- The shrub, tree and crow instancing sections were not read line by line.

## 4. Gameplay-facing rendering: camera rig, wall cutaway, VFX (three.quarks), floaters/damage numbers, HUD

### Takeaway
- **Cameras:** orbit, game ¾ perspective, true isometric 2:1 (orthographic, 30° elevation), play follow, and third-person chase.
- **Cutaway:** a Diablo-style screen-space circle that Bayer-dithers out geometry in front of the character.
- **VFX:**
  - CPU-simulated instanced particles in a separate premultiplied, depth-softened layer that can run at half resolution.
  - A three.quarks skill library (WebGL2 only) with a BatchedRenderer and soft particles.
  - Lightning ribbons, and a WebGPU-only compute particle demo of up to 1M particles.
- **Damage numbers and HUD** are DOM elements, not GPU-rendered.
- **Gameplay FX stubs:** in the gameplay FX module, decals, weapon trails, auras and curses are no-ops.

### Cited Findings
- **Camera rig** ([src/core/cameraRig.js:1-14, 19-20, 83-106, 163-174](file:///E:/Diablo2/lookdev-lab/src/core/cameraRig.js)):
  - **Modes:** Free orbit, Game ¾ (perspective), Isometric 2:1 (orthographic), Play (follow, click to move), Third person (follow).
  - **Perspective camera:** FOV 35, near 0.05, far 600.
  - **Game/Play:** polar angle locked at 42°, azimuth at 45°, distance 5–40 m.
  - **Iso:** polar angle 60°, i.e. 30° elevation, which squashes the ground 2:1.
  - **Follow:** exponential smoothing of the focus point.
- **Weeping Fields default view:** iso play view on the hero by the burning cart (the D2_LOOK preset). [weepingFields.js:11-13, 31-36](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [README.md:87-91](file:///E:/Diablo2/lookdev-lab/README.md)
- **Wall cutaway (see-through circle):**
  - Geometry between the camera and the character is Bayer-dithered and discarded inside a screen-space circle.
  - Floors and low clutter are never cut (world Y < feet + 0.35).
  - The patch is applied once per scene material and then switched by uniform, so there are no recompiles while playing.
  - Instanced and skinned meshes are skipped.

  [src/shaders/effects/cutaway.glsl:1-22](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/cutaway.glsl); [src/character/cutaway.js:1-57](file:///E:/Diablo2/lookdev-lab/src/character/cutaway.js)
  - It only applies to opaque MeshStandardMaterial. [webgl/effects.js:299-317](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js)
- **CPU particle system:**
  - Each emitter is one instanced-quad draw in the VFX layer, and every emitter shares one material.
  - Shapes: soft, smoke, spark, ring, flare, splat, shard. Alignment: camera, ground, velocity.
  - Depth fade against the scene is the `softness` parameter.

  [src/vfx/particles.js:1-8, 33-60](file:///E:/Diablo2/lookdev-lab/src/vfx/particles.js)
  - Additive glow and alpha blending are mixed in one draw. [src/shaders/vfx/particle.frag.glsl:1-3](file:///E:/Diablo2/lookdev-lab/src/shaders/vfx/particle.frag.glsl)
  - Soft-particle uniforms come from the scene depth texture. [webgl/pipeline.js:127-135](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js)
- **Weeping Fields ambient particles:** embers and smoke over the fires, dust in the hero's light, flies over the dead, low mist. [weepingFields.js:2257-2300](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
- **three.quarks skill VFX:**
  - Named effects built from a compact description.
  - Pooled: systems are restarted, never rebuilt per cast.
  - One `BatchedRenderer` merges every system that shares a material and render mode into a single draw.
  - Render modes include stretched billboards, trails and flipbooks.

  [src/skills/fx.js:1-12, 55-60, 81, 106](file:///E:/Diablo2/lookdev-lab/src/skills/fx.js)
  - Soft particles use the scene depth texture (`softFarFade` 0.35). [skills/fx.js:363-399](file:///E:/Diablo2/lookdev-lab/src/skills/fx.js)
  - 12 Act I class skills. quarks builds GLSL `ShaderMaterial`s, so the skills run on WebGL2 only. [README.md:59-71](file:///E:/Diablo2/lookdev-lab/README.md); [HUONG_DAN.md:297](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
  - Gameplay skills are likewise WebGL2-only. [src/gameplay/host.js:371, 454](file:///E:/Diablo2/lookdev-lab/src/gameplay/host.js)
- **Lightning:** camera-facing strips along a jagged, re-rolled path, with forks, using a plain MeshBasicMaterial so they work on both renderers. [src/skills/lightning.js:1-3](file:///E:/Diablo2/lookdev-lab/src/skills/lightning.js)
- **WebGPU compute particles ("soul storm"):**
  - Init and update compute shaders over `instancedArray` storage buffers, with nothing read back to the CPU.
  - Drawn as one instanced Sprite batch.
  - Written with `fragmentNode` because the `colorNode` path discards alpha ≤ 0.

  [src/backends/webgpu/vfx.js:1-2, 84-192](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/vfx.js)
  - The doc gives a range of 10k to 1M particles. [HUONG_DAN.md:295](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
  - It is null on WebGL. [src/backends/webgl/vfx.js:29-30](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/vfx.js)
- **VFX tooling:** slow motion, an overdraw heat view, and training dummies that react with surface shaders (status, hit flash, dissolve death). [README.md:59-62](file:///E:/Diablo2/lookdev-lab/README.md); [webgl/vfx.js:31-33](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/vfx.js)
- **Damage numbers:**
  - `Floaters` sends world positions to the VFX lab's DOM text layer. [src/gameplay/floaters.js:1-14](file:///E:/Diablo2/lookdev-lab/src/gameplay/floaters.js); [host.js:82](file:///E:/Diablo2/lookdev-lab/src/gameplay/host.js)
  - Each number is a `<div>` placed every frame with `Vector3.project` and a CSS transform, with a 1.1 s life, a rise, a scale pop and a fade. [src/vfx/vfxLab.js:723-755](file:///E:/Diablo2/lookdev-lab/src/vfx/vfxLab.js)
- **Gameplay HUD:** built from DOM WebP sprite sheets: life/mana orbs, stone bar, skill and potion slots, XP bar, name plate. [src/gameplay/hud.js:1-4](file:///E:/Diablo2/lookdev-lab/src/gameplay/hud.js)
- **Performance HUD:** FPS, CPU time, GPU time (total, plus per pass when available), draw calls/triangles, frame graph. [src/ui/hud.js:1-2](file:///E:/Diablo2/lookdev-lab/src/ui/hud.js)
- **Gameplay FX module:**
  - Calls map onto quarks effects when the library is available (WebGL2); otherwise projectiles are small emissive meshes.
  - Unknown effects return a handle that does nothing ("curses, auras, decals, weapon trails…").

  [src/gameplay/fx.js:1-3, 40-68, 139-149](file:///E:/Diablo2/lookdev-lab/src/gameplay/fx.js)
- **Ground telegraphs:**
  - Shape first: a ring with inward ticks, or a frame with chevrons, in the danger colour.
  - The function-colour fill grows over the wind-up.
  - Colours are display-matched so the hex survives tone mapping.

  [src/env/signals.js:1-10](file:///E:/Diablo2/lookdev-lab/src/env/signals.js); [src/core/displayMatch.js:1-7](file:///E:/Diablo2/lookdev-lab/src/core/displayMatch.js)

### Inferences
- On WebGPU, skill VFX fall back to plain meshes because quarks is GLSL-only. A TSL particle path, or a quarks WebGPU port, is a real gap for a WebGPU-first game.
- DOM floaters suit low hit counts. In a dense ARPG fight, an instanced SDF/bitmap-font text layer would scale better (inference; not measured).

### Gaps
- `src/procedural/rig.js` (champion/unique colour outlines on monsters) was not read. Art-direction 13 mentions those colours ([legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md:85-87](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)), but how they are implemented is unverified.
- Camera shake exists (`updateShake`, [vfxLab.js:785](file:///E:/Diablo2/lookdev-lab/src/vfx/vfxLab.js)); its implementation was not read.

## 5. Performance tooling & scalability: quality presets, GPU timers, bench/stress, instancing/batching, texture formats, asset pipeline

### Takeaway
**Measurement tooling is strong:**
- Per-pass WebGL timer queries; total WebGPU timestamps, compute included.
- Burst wall-time measured with a GPU fence.
- Median-of-raw A/B tests with alternating rounds.
- Scene and feature benchmarks with history kept per renderer.
- Stress tests and shader precompile.

**Scalability is basic:**
- 4 quality presets plus a manual render scale.
- InstancedMesh for vegetation, plus CPU merging (`StaticBatch`).

**Missing:**
- BatchedMesh, LOD, occlusion culling, dynamic resolution.
- Compressed textures and meshes in practice: KTX2, Draco and Meshopt loaders are wired, but no shipped asset uses them. Assets are JPEG/PNG-in-GLB plus raw RGBA8 DataTextures.

### Cited Findings
- **Quality presets** ([src/core/quality.js:1-21](file:///E:/Diablo2/lookdev-lab/src/core/quality.js)):

  | Preset | Max pixel ratio | Shadow map | AA | AO | VFX layer |
  | --- | --- | --- | --- | --- | --- |
  | Low | 1 | 1024 | FXAA | off | 0.5 |
  | Medium | 1 | 2048 | SMAA | on, 0.5 res | 0.5 |
  | High | 1.5 | 2048 | SMAA | on, 0.5 res | 1 |
  | Ultra | 2 | 4096 | MSAA | on, full res | 1 |

  - Bloom is on in every preset.
  - The pixel ratio is `min(devicePixelRatio, maxPixelRatio) × renderScale`, with render scale set manually. [src/app/App.js:586-589](file:///E:/Diablo2/lookdev-lab/src/app/App.js)
  - Greps for dynamic/adaptive resolution or a target-FPS controller found nothing. [src/](file:///E:/Diablo2/lookdev-lab/src)
- **GPU timers:**
  - **WebGL:** `EXT_disjoint_timer_query_webgl2`, sequential (non-nested) queries resolved a few frames later. The HUD shows an EMA-smoothed value; benchmarks read the raw value. [src/backends/webgl/gpuTimer.js:1-98](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/gpuTimer.js)
  - **WebGPU:** `resolveTimestampsAsync` for the RENDER and COMPUTE query pools, divided by the number of frames each resolve covers. [webgpu/index.js:196-219](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
- **Benchmark harness** ([src/app/bench.js:1-121](file:///E:/Diablo2/lookdev-lab/src/app/bench.js)):
  - **Burst:** N frames with the render loop paused, GPU-synced at both ends (fence or `queue.onSubmittedWorkDone`).
  - **GPU sample:** median of the raw per-frame timer values; the first sample is skipped.
  - **A/B:** conditions alternate over rounds, with warm-up frames after each switch.
  - **History:** kept in localStorage.
- **Scripted benchmarks** ([src/app/benchRunner.js:1-114](file:///E:/Diablo2/lookdev-lab/src/app/benchRunner.js)):
  - **Scene benchmark:** every scene measured from its home camera, recording wall time, GPU time, calls and triangles.
  - **Feature costs:** off/on A/B for GTAO, bloom, SMAA, height fog and shadow maps.
- **Stress tests:** crowds of the current model (draw calls, skinning), moving point lights (forward cost per light), particle emitters (CPU simulation and overdraw). [src/app/stress.js:1-3](file:///E:/Diablo2/lookdev-lab/src/app/stress.js)
  - The doc gives 4–64 moving lights and 4–40 fire+smoke emitters. [HUONG_DAN.md:496](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
- **Shader precompile:**
  - The previous frame stays on screen until the new scene's programs are linked through `compileAsync`. This avoids "seconds per PBR program on D3D11 with many lights". [App.js:414-431](file:///E:/Diablo2/lookdev-lab/src/app/App.js)
  - On WebGL it compiles against the scene target, with a 4 s timeout. [webgl/index.js:147-162](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js)
  - The monster shader is linked before the first spawn. [host.js:284](file:///E:/Diablo2/lookdev-lab/src/gameplay/host.js)
- **Instancing:**
  - **InstancedMesh:**
    - Grass tufts and cards, kit pieces, crows and banner cloth. [weepingFields.js:1216, 1736, 1852, 1900, 1966](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [terrain.js:856, 878, 983](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js); [graveyard.js:311](file:///E:/Diablo2/lookdev-lab/src/scenes/graveyard.js)
    - Footprints. [src/character/footCheck.js:43](file:///E:/Diablo2/lookdev-lab/src/character/footCheck.js)
  - **InstancedBufferGeometry:** flames ([env/flames.js:7-31](file:///E:/Diablo2/lookdev-lab/src/env/flames.js)) and particles ([vfx/particles.js:1-2](file:///E:/Diablo2/lookdev-lab/src/vfx/particles.js)).
  - **quarks `BatchedRenderer`.** [skills/fx.js:1-3](file:///E:/Diablo2/lookdev-lab/src/skills/fx.js)
- **Static batching:**
  - `StaticBatch` bakes transforms and world-space UVs, then `mergeGeometries` produces one mesh per material and shadow-flag combination. [src/env/kit.js:1-4, 391-441](file:///E:/Diablo2/lookdev-lab/src/env/kit.js)
  - Used by catacombs, graveyard, moor props, and the Weeping Fields obstacles, destructibles, decor, interactables and decals. [kit grep results: catacombs.js:113, graveyard.js:161, terrain.js:517, weepingFields.js:875-877, 1444, 1635](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
- **Not used:**
  - **BatchedMesh:** the only mention is a type check that excludes it from collision. [src/character/collision.js:31](file:///E:/Diablo2/lookdev-lab/src/character/collision.js)
  - **LOD:** `THREE.LOD` / `addLevel` have zero hits.
  - **Frustum culling** is turned off on several instanced meshes (19 `frustumCulled = false` hits in 11 files).

  [src/](file:///E:/Diablo2/lookdev-lab/src)
- **Loaders and texture formats:**
  - `GLTFLoader` is set up with `DRACOLoader`, `KTX2Loader` (with `detectSupport(renderer)`) and `MeshoptDecoder`. The offline build embeds the Draco and Basis decoders. [src/core/assets.js:1-11, 17-22, 50-75](file:///E:/Diablo2/lookdev-lab/src/core/assets.js); [HUONG_DAN.md:18](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
  - **Bundled assets** in `assets/`: 37 `.glb`, 22 `.png` and 3 `.hdr` files, about 61 MB in total. [assets/](file:///E:/Diablo2/lookdev-lab/assets)
  - **No GLB uses compression.** A byte search found 0 files containing `KHR_texture_basisu`, `KHR_draco_mesh_compression`, `EXT_meshopt_compression`, `KHR_mesh_quantization` or `EXT_texture_webp`. 27 GLBs embed `image/jpeg` and 8 embed `image/png`. [assets/](file:///E:/Diablo2/lookdev-lab/assets)
  - **Runtime-built textures** are uncompressed RGBA8 `DataTexture`s: terrain layers and the splat ([env/terrain.js:36-47, 247-253](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js)) and the forge output ([env/forge.js:1-4](file:///E:/Diablo2/lookdev-lab/src/env/forge.js)). LUTs are HalfFloat ([lut.js:15-26](file:///E:/Diablo2/lookdev-lab/src/core/lut.js)).
- **Asset pipeline:**
  - **`prepare-prop-kit.py`** splits a Tripo-generated kit sheet into real-size pieces (pipeline below), writes one GLB with a shared material, and re-encodes the maps as JPEG at `--texture` px (default 1024). [scripts/prepare-prop-kit.py:1-24, 257, 341-357](file:///E:/Diablo2/lookdev-lab/scripts/prepare-prop-kit.py)
    1. Connected components.
    2. Group into rows and columns.
    3. Scale from the grey human figure.
    4. Align each piece and put its pivot at the bottom centre.
  - **esbuild plugins:**
    - GLSL files become shader-registry entries.
    - `?raw` imports return the source as text.
    - `.webp` files load as data URLs.
    - The bundle format is IIFE, targeting es2022.

    [scripts/esbuild-plugins.mjs:7-68](file:///E:/Diablo2/lookdev-lab/scripts/esbuild-plugins.mjs)
  - **Single-file offline build:** about 20 MB. [README.md:13](file:///E:/Diablo2/lookdev-lab/README.md)
  - **Static checks:** GLSL/TSL parity, reserved words, reversed smoothstep edges, TSL `If` pitfalls, additive materials on `colorNode`, asset credits. [README.md:17](file:///E:/Diablo2/lookdev-lab/README.md); [scripts/check.mjs:1-3](file:///E:/Diablo2/lookdev-lab/scripts/check.mjs)
- **Renderer stats:** calls, triangles, geometries, textures and programs (programs on WebGL only). [webgl/index.js:126-145](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js); [webgpu/index.js:239-254](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
  - WebGPU reports `maxSamples: 4`. [webgpu/index.js:121-128](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)

### Inferences
- Measurement is near production quality. The scalability gaps for a full ARPG zone:
  - No LOD or impostors.
  - No BatchedMesh, so there is no multi-geometry single draw that keeps per-object culling.
  - No GPU-driven or occlusion culling.
  - No texture compression in practice (VRAM, download size).
  - No dynamic resolution.
- Instancing is CPU-placed. Grass card meshes disable frustum culling, so the whole field is drawn every frame.

### Gaps
- No benchmark results were collected (read-only). Draw-call and triangle counts per scene are unknown from static reading.
- `src/panels/perf.js` was not read line by line; its contents are summarised from [HUONG_DAN.md:488-505](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md).

## 6. Documented features (README, HUONG_DAN) and art-direction readability/colour rules that bear on rendering

### Takeaway
- **Docs match the code.** README and HUONG_DAN describe the same features as above, plus: A/B snapshots, PBR validation, false colour, drag-and-drop texture sets, video capture and presentation mode, a list of three r180 lessons, and the claim that every scene and effect exists for both renderers.
- **Art-direction doc 13 sets measurable rules that the pipeline has to honour:**
  - Signal colours are display colours, i.e. measured after tone mapping.
  - Danger and poison must differ by shape, not only hue, for colour-blind players.
  - Greyscale and colour-vision-deficiency checks.
  - Telegraph overlay ≤ 45 % opacity, with the outline always on top.
  - Numeric L\*/C\* tiers.
  - Tone mapper choice matters: AgX shifts hexes by ΔE 5.5–12.6; ACES by 3.0–9.5; Khronos Neutral by 1.6–5.3.

### Cited Findings
- **Renderer modes:** WebGL2·GLSL (per-pass GPU timer queries); WebGPU·TSL (compute particles, TRAA, automatic fallback to WebGL2); WebGPU renderer on a WebGL2 backend (TSL compiled to GLSL ES 3.0). [README.md:22-28](file:///E:/Diablo2/lookdev-lab/README.md)
- **Lookdev tab:** view modes (lit, albedo, normal, roughness, metalness, material AO, emissive, PBR validation, SSAO buffer, clay, UV checker, wireframe), exposure false colour, material inspector, A/B compare that survives a renderer switch. [README.md:32-35](file:///E:/Diablo2/lookdev-lab/README.md); [HUONG_DAN.md:76-77](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
- **"Things learned (three r180)"** ([README.md:167-200](file:///E:/Diablo2/lookdev-lab/README.md)):
  - TSL `If` pitfalls.
  - The `normalNode` sub-build evaluates shared vars twice.
  - The node frame advances only in the renderer's own rAF tick.
  - Program cache keys on node materials must keep the node-graph hash.
  - Alpha-0 fragments are discarded on `colorNode`.
  - 3D textures fail on WebGPU (Dawn/SwiftShader).
  - The shadow pass replaces materials, and only `positionNode` carries over.
  - MRT is capped at 32 B per sample.
  - Light count = recompiles.
  - Hero light falloff: decay 1 reads like a game light.
  - `active` is reserved in GLSL ES 3.00.
- **Performance doc:** quality presets, render scale, scene and feature benchmarks, a renderer comparison table, stress tests, WebM capture, presentation mode, settings presets. Its guidance on reading the numbers ([HUONG_DAN.md:488-505](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)):
  - Frame cost = CPU + GPU, whichever bounds.
  - WebGPU GPU time includes compute passes.
  - SwiftShader numbers are meaningless.
- **Art-direction 13, method:** ΔE2000, WCAG-style luminance contrast and L\*, Machado-2009 colour-vision simulation at full severity, and three r180's tone-mapping code as used by the lab. [legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md:3-7](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)
- **Top three fixes** ([13:10-20](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)):
  1. Mandatory shape language per function colour: Danger vs Poison are ΔE 3.9 / 1.2 for deuteranopes.
  2. Separate Divine from Interact (ΔE 8.6 / 6.2).
  3. Signal colours are defined as display colours, after tone mapping.
- **Tone mapping shifts signal hexes** ([13:37-50](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)):
  - AgX: ΔE 5.5–12.6 (`#FFB16B` shows as `#CEA985`), and some hexes are unreachable.
  - ACES: 3.0–9.5.
  - Khronos Neutral: 1.6–5.3.
  - Proposal: draw telegraphs after tone mapping (an overlay), or compensate per tone mapper; lock the project's tone mapper before freezing hexes.
  - The lab already auto-compensates (display-matched signal colours) and shows a ΔE table.
- **Visual tier ranges** ([13:52-66](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)):

  | Tier | Range |
  | --- | --- |
  | Background environment | L\* 15–30, C\* ≤ 15 |
  | Structures | L\* 20–45 |
  | Normal monsters | ΔL\* ≥ 12 vs background, or a rim |
  | Interact/reward | L\* ≥ 80 when glinting |
  | Important gameplay FX | L\* ≥ 60, C\* ≥ 40 |
  | Danger | outline L\* ≥ 75, plus a dark outline, plus inward ticks, plus wind-up time |

- **Corruption caps:** veins L\* ≤ 30, C\* ≤ 25, no glow except at the source (emissive ≤ 0.2). Blood-soaked ground stays in the background's luminance band and changes hue only. [13:72-75](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)
- **Rule edits:** telegraph overlay ≤ 45 % opacity with outline and ticks always on top (I.5); add greyscale, CVD and swap-the-tone-mapper passes to the checklist (VII). [13:101-112](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)
- **Conflict with the gameplay core:** it outlines elites in champion `#6080FF` and unique `#FFC060`, which collide with function colours. [13:81-88](file:///E:/Diablo2/legacy/art-direction/13_KIEM_TRA_QUY_TAC_MAU_GAMEPLAY.md)
- **Display matching in code:** `displayMatch.js` inverts the final pass (exposure → white balance → contrast → saturation → tone mapping → lift/gain/gamma) to find the linear colour that displays as a given hex. It leaves out vignette, fog, bloom and the LUT. [src/core/displayMatch.js:1-7](file:///E:/Diablo2/lookdev-lab/src/core/displayMatch.js)
- **Weeping Fields D2 default look:** night light radius with ACES, isometric view, QA overlays off, shadow fill off, puddle roughness 0.32 so the hero's light leaves a sheen rather than a white blot. [weepingFields.js:29-36](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)

### Inferences
- Any AAA post technique the final report recommends (TAA, SSR, volumetric fog, auto-exposure, bloom changes) must be validated against these rules, because each one shifts the displayed hex. Auto-exposure and volumetric fog would directly break display-matched signal colours unless telegraphs are drawn as a post-tone-mapping overlay. The art doc recommends exactly that overlay.

### Gaps
- `legacy/art-direction/12_QUY_CHUAN…` and the colour-rule bible docs 01–10 were not read (out of scope); only doc 13 was reviewed.

## 7. Project-known WebGPU constraints: do code comments confirm them?

### Takeaway
Four of the five known constraints are confirmed in code comments or code workarounds. The `shadowMap.render` one is confirmed as a workaround, but the "silently kills the loop" consequence is documented only in the user's memory note. The fifth, "changing shadow mapSize breaks WebGPU", is not in the code: the Lighting tab still changes mapSize at runtime with no WebGPU guard, and only the memory note records the failure. The code also records several further WebGPU constraints (list at the end).

### Cited Findings
- **(1) 16 samplers per shader stage; an extra shadow map broke terrain on WebGPU, so it is gated to WebGL. CONFIRMED:**
  - **Hero spotlight gated:** "Its shadow map is one more texture and sampler on every lit material; on WebGPURenderer the layered terrain already uses the 16 samplers per stage that browsers allow, so the shadow is WebGL2-only", followed by `castShadow = backend.kind === 'webgl'`. [weepingFields.js:2241-2243](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - **Baked AO placement:** stored in the splat alpha with "no extra texture (WebGPU's 16 samplers are spent)". [weepingFields.js:1471](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - **Moor torches:** no torch shadows because the "terrain shader already samples 10 textures, and each shadow map counts against WebGPU's 16 sampled textures per stage (moon + campfire + environment use the rest)". [terrain.js:1032-1034](file:///E:/Diablo2/lookdev-lab/src/scenes/terrain.js)
  - **User guide:** the hero light casts shadows only on WebGL2 because the terrain has used all 16 samplers. [HUONG_DAN.md:410-412](file:///E:/Diablo2/lookdev-lab/docs/HUONG_DAN.md)
  - **Memory note detail:** `CreateBindGroupLayout` fails with "number of samplers (17) … exceeds 16". The adapter (NVIDIA, Chrome/D3D12) offers 48 sampled textures but only 16 samplers, so raising `requiredLimits` does not help. [memory: lab-webgpu-sampler-limit.md](file:///C:/Users/HLC_2021/.claude/projects/E--Diablo2/memory/lab-webgpu-sampler-limit.md)
  - **Wording mismatch:** the terrain.js comment says "16 sampled textures per stage", while the memory note and weepingFields.js say samplers. The note says the binding limit is samplers, not sampled textures.
- **(2) 3-byte Uint8 vertex attributes stall WebGPU boot; use itemSize 4. CONFIRMED:**
  - "RGBA bytes: WebGPU has no 3-byte vertex format (unorm8x4 is the smallest colour that works on both renderers)", with `new BufferAttribute(new Uint8Array(count*4), 4, true)`. [weepingFields.js:1600-1601](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js)
  - Other colour attributes with itemSize 3 use Float32, which is fine. Example: the grass-tuft colours. [src/env/kit.js:375-381](file:///E:/Diablo2/lookdev-lab/src/env/kit.js)
  - The memory note adds that the failure shows only "Uncaught (in promise)" and the boot screen never clears. [memory: lab-webgpu-no-3byte-vertex.md](file:///C:/Users/HLC_2021/.claude/projects/E--Diablo2/memory/lab-webgpu-no-3byte-vertex.md)
- **(3) Calling `shadowMap.render` outside `renderer.render()` silently kills the loop; extra shadows render from `scene.onAfterRender`. CONFIRMED (workaround), consequence only in the memory note:**
  - The bake is deferred to a `scene.onAfterRender` hook. [webgl/bakedShadow.js:88-94](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/bakedShadow.js)
  - Comment: "Runs inside a render (scene.onAfterRender): three's shadow pass needs its render state". [webgl/bakedShadow.js:111](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/bakedShadow.js)
  - The memory note gives the error ("Cannot read properties of null (reading 'state')"), says it escapes `setAnimationLoop` and stops frames silently, and that it fails intermittently. [memory: three-shadowmap-render-outside-render.md](file:///C:/Users/HLC_2021/.claude/projects/E--Diablo2/memory/three-shadowmap-render-outside-render.md)
  - **Scope:** this is a classic WebGLRenderer issue. The WebGPU path uses a `ShadowNode.updateShadow` override instead. [webgpu/bakedShadow.js:62-75](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/bakedShadow.js)
- **(4) Dark environment PMREM at load, rebuilt at frames 30 and 120. CONFIRMED:** "The PMREM three builds from an equirect environment … comes out too dark when that happens while the scene loads (Weeping Fields at Overcast: objects ~25 % darker …). Rebuild it 30 and 120 frames after each environment change", implemented with `env.needsPMREMUpdate = true`. [webgpu/index.js:184-194](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
  - The memory note adds the measured frame mean (46.8 vs 61.5) and that the root cause in three r180 was not found. [memory: lab-webgpu-boot-env-pmrem.md](file:///C:/Users/HLC_2021/.claude/projects/E--Diablo2/memory/lab-webgpu-boot-env-pmrem.md)
- **(5) Changing shadow mapSize breaks WebGPU. NOT CONFIRMED in code comments:**
  - `applyShadowSettings` still calls `o.shadow.mapSize.set(size,size)` and then `o.shadow.map?.dispose(); o.shadow.map = null` on every backend. There is no WebGPU guard and no comment. [src/panels/lighting.js:10-27](file:///E:/Diablo2/lookdev-lab/src/panels/lighting.js)
  - Quality presets also change `shadowMapSize`. [quality.js:19](file:///E:/Diablo2/lookdev-lab/src/core/quality.js)
  - Only the memory note documents it: "three r180's WebGPU ShadowNode cannot take a runtime `shadow.mapSize` change ('Destroyed texture used in a submit', any scene) … not fixed". [memory: lab-webgpu-boot-env-pmrem.md](file:///C:/Users/HLC_2021/.claude/projects/E--Diablo2/memory/lab-webgpu-boot-env-pmrem.md)
  - The WebGPU baked-shadow target is also created at the initial `mapSize` and never resized. [webgpu/bakedShadow.js:85-89](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/bakedShadow.js)
- **Further WebGPU constraints recorded in code:**
  - **Chromatic aberration:** "chromatic > 0 adds a render-to-texture pass that breaks the WebGPU post graph ('Invalid CommandBuffer')", so the v1game mood leaves it off. [moods.js:150-151](file:///E:/Diablo2/lookdev-lab/src/lighting/moods.js) The pipeline still builds that pass whenever chromatic > 0. [webgpu/pipeline.js:219-224](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js)
  - **MRT budget:** colour attachments are capped at 32 bytes per sample, so debug channels are packed. [webgpu/pipeline.js:146-148](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js); [README.md:188](file:///E:/Diablo2/lookdev-lab/README.md)
  - **3D textures:** `Data3DTexture` slice uploads fail to lazy-clear on Dawn/SwiftShader and drop the frame, so the LUT uses a 2D strip. [lut.js:5-10](file:///E:/Diablo2/lookdev-lab/src/core/lut.js); [README.md:181-183](file:///E:/Diablo2/lookdev-lab/README.md)
  - **Comparison depth on the fallback:** WebGPU's WebGL2 fallback cannot `textureLoad` a comparison depth texture, so PCSS is off on that path. [webgpu/bakedShadow.js:4-6, 124](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/bakedShadow.js)
  - **Program cache:** three r180 caches node-builder state per material, not per MRT layout. The lab therefore folds the layout id into every material's program cache key. [webgpu/index.js:25-46](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
  - **Shadow-pass material replacement:** the shadow pass swaps in one shared material, so dissolve needs a masked shadow material via a `renderObject` override. [webgpu/index.js:49-80](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
  - **Node frame:** frames rendered outside three's rAF tick must call `nodeFrame.update()`; otherwise TRAA history and time go stale. [webgpu/index.js:174-181](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js)
  - **Alpha-0 discard:** `colorNode` discards alpha ≤ 0, so purely additive output must use `fragmentNode`. [webgpu/vfx.js:148-150](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/vfx.js)
  - **quarks:** GLSL-only, so skill VFX run on WebGL2 only. [README.md:63](file:///E:/Diablo2/lookdev-lab/README.md)
  - **Effects not ported to TSL:** the material AO view and the lava cracks remain WebGL-only. [README.md:35, 46](file:///E:/Diablo2/lookdev-lab/README.md); [nodeMaterial.js:4](file:///E:/Diablo2/lookdev-lab/src/procedural/nodeMaterial.js)
  - **Canvas capture:** the WebGPU canvas cannot be read with `drawImage` outside a frame; use `app.captureFrame()`. [memory: lab-headless-measure-by-frames.md](file:///C:/Users/HLC_2021/.claude/projects/E--Diablo2/memory/lab-headless-measure-by-frames.md); [App.js:675](file:///E:/Diablo2/lookdev-lab/src/app/App.js)

### Inferences
- The sampler ceiling is the main design constraint for any AAA addition on WebGPU, e.g. more terrain layers, CSM cascades, more shadowed lights, or detail maps. Ways around it: texture arrays, atlases, or merging samplers. Note the limit is counted per sampler binding, not per texture.
- The Lighting tab and the quality presets can trigger the unconfirmed mapSize failure. A WebGPU guard (reload, or rebuild the ShadowNode) would be a low-cost hardening step (inference).

### Gaps
- I did not reproduce any constraint at runtime (read-only). Confirmation status rests on code comments, docs and memory notes only.

## 8. AAA technique status matrix: already in the lab / partial / missing

### Takeaway
- **Already:** standard HDR post, GTAO, bloom, tone mapping and LUTs, height fog, PBR+IBL, the height-blend terrain with anti-tiling, vertex wind, soft particles, cutaway, instancing, and a static shadow cache with PCSS.
- **Partial:**
  - TAA: WebGPU only.
  - Baked AO/GI: sky visibility only.
  - Compressed assets: loaders only.
  - GPU particles: WebGPU demo only.
  - Water and decals: simple meshes.
  - Dynamic resolution: manual render scale only.
- **Missing:**
  - Shadows: CSM.
  - Post and screen-space: SSR, SSGI, DOF, motion blur, volumetric fog and god rays, auto-exposure, outline pass, screen-space contact shadows.
  - Lighting: light probes and irradiance volumes, clustered lighting.
  - Geometry and surfaces: LOD and impostors, BatchedMesh, occlusion or GPU culling, triplanar, POM, displacement, projected decals.

### Cited Findings
| Technique (three.js-applicable) | Status | Evidence |
| --- | --- | --- |
| HDR linear pipeline (HalfFloat targets) | Already, both | [webgl/pipeline.js:45-50](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:145](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| MSAA 4× | Already, both | [webgl/pipeline.js:174-178](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:145](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| FXAA / SMAA | Already, both | [webgl/pipeline.js:61-69, 314-325](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:234-235](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| TAA (TRAA) | Partial: WebGPU only | [webgpu/pipeline.js:143, 213-217](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js); [post.js:37-38](file:///E:/Diablo2/lookdev-lab/src/panels/post.js) |
| Temporal upscaling / dynamic resolution | Partial: manual render scale, preset pixel-ratio caps, half/quarter-res VFX and half-res AO; no automatic controller or upscaler | [App.js:586-589](file:///E:/Diablo2/lookdev-lab/src/app/App.js); [quality.js:2-7](file:///E:/Diablo2/lookdev-lab/src/core/quality.js) |
| SSAO / GTAO (+denoise) | Already, both | [webgl/pipeline.js:52-59, 247-254](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:164-170](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| Bloom (HDR threshold, mip chain) | Already, both | [webgl/pipeline.js:60, 296-300](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js); [webgpu/pipeline.js:206-210](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| Filmic tone mapping (ACES/AgX/Neutral) | Already, both | [final.frag.glsl:29-37](file:///E:/Diablo2/lookdev-lab/src/shaders/post/final.frag.glsl); [grading.js:4-12](file:///E:/Diablo2/lookdev-lab/src/core/grading.js) |
| Colour grading + 3D LUT (.cube) | Already, both (3D texture vs 2D strip) | [final.frag.glsl:61-84](file:///E:/Diablo2/lookdev-lab/src/shaders/post/final.frag.glsl); [lut.js:1-10](file:///E:/Diablo2/lookdev-lab/src/core/lut.js) |
| Vignette, grain, chromatic aberration, anti-banding dither | Already. Chromatic aberration is risky on WebGPU | [final.frag.glsl:39-96](file:///E:/Diablo2/lookdev-lab/src/shaders/post/final.frag.glsl); [moods.js:150-151](file:///E:/Diablo2/lookdev-lab/src/lighting/moods.js) |
| Auto-exposure / eye adaptation | Missing | no hits for autoExposure, adaptation or histogram in [src/](file:///E:/Diablo2/lookdev-lab/src) |
| Height fog (analytic, sun in-scatter) | Already, both | [composite.frag.glsl:37-52](file:///E:/Diablo2/lookdev-lab/src/shaders/post/composite.frag.glsl); [tsl/post.js:43-64](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/tsl/post.js) |
| Volumetric fog / light shafts / god rays | Missing (ground mist is particles) | no hits for volumetric, godray or lensflare; mist emitter at [weepingFields.js:2297-2300](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| SSR / planar reflections | Missing | no SSR, Reflector or reflect() hits in .js or .glsl; creek is a glossy transparent ribbon at [weepingFields.js:716](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| SSGI / real-time GI | Missing | no SSGI hits in [src/](file:///E:/Diablo2/lookdev-lab/src) |
| DOF / motion blur / lens flare | Missing (TRAA's velocity MRT exists on WebGPU) | no hits; [webgpu/pipeline.js:150](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| Outline / selection post pass | Missing (fresnel rim and interact glint instead) | no OutlinePass or outline hits; [weepingFields.js:2084-2090](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| Debug / validation views (PBR validate, false colour, buffers) | Already. Material AO view is WebGL only | [patches.js:202-232](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/patches.js); [webgpu/pipeline.js:172-191](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/pipeline.js) |
| Accessibility checks (greyscale, CVD) | Already (baked into the LUT) | [lut.js:234-252](file:///E:/Diablo2/lookdev-lab/src/core/lut.js) |
| PCF / PCFSoft / VSM shadows | Already (three built-ins) | [webgl/index.js:70-76](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/index.js) |
| PCSS contact-hardening shadows | Partial: Weeping Fields moon only; WebGL plus a real WebGPU device, not the WebGPU-on-WebGL2 fallback | [pcss.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/chunks/pcss.glsl); [webgpu/bakedShadow.js:124](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/bakedShadow.js) |
| Static shadow caching (static bake + dynamic casters) | Already, one directional light | [env/bakedShadow.js:1-8](file:///E:/Diablo2/lookdev-lab/src/env/bakedShadow.js) |
| Cascaded shadow maps (CSM) | Missing (one ortho frustum: 80 m in WF, 60 m in the moor) | [weepingFields.js:2164-2168](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); no CSM hits |
| Screen-space contact shadows | Missing. Analogues: splat-based grass contact shadow and PCSS contact hardening | [terrain.glsl:126-131](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl) |
| Many-light rendering (clustered / forward+) | Missing (three forward; fixed light counts; moving-light stress test) | [stress.js:1-3](file:///E:/Diablo2/lookdev-lab/src/app/stress.js); [README.md:193-194](file:///E:/Diablo2/lookdev-lab/README.md) |
| IBL (PMREM from HDRI / RoomEnvironment) | Already. WebGPU needs the frame-30/120 PMREM rebuild | [studio.js:162-197](file:///E:/Diablo2/lookdev-lab/src/scenes/studio.js); [webgpu/index.js:184-194](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/index.js) |
| Light probes / irradiance volumes / SH GI | Missing | no LightProbe, irradiance or SH hits |
| Baked AO / lightmaps | Partial: CPU sky-visibility AO into splat alpha and prop vertex colours (Weeping Fields); no lightmaps | [weepingFields.js:1463-1474, 1616-1629](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| Area lights (LTC RectAreaLight) | Already (studio) | [studioRigs.js:52-58](file:///E:/Diablo2/lookdev-lab/src/lighting/studioRigs.js) |
| Physical light units / Kelvin / flicker | Already | [studioRigs.js:1-2](file:///E:/Diablo2/lookdev-lab/src/lighting/studioRigs.js); [grading.js:34-50](file:///E:/Diablo2/lookdev-lab/src/core/grading.js); [flames.js:58-67](file:///E:/Diablo2/lookdev-lab/src/env/flames.js) |
| Stylised shadow fill / hero light radius / character rim | Already (lab-specific) | [shadow_fill.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/shadow_fill.glsl); [weepingFields.js:2235-2250](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [hero_rim.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/hero_rim.glsl) |
| PBR metal/rough with ORM packing | Already | [env/terrain.js:49-107](file:///E:/Diablo2/lookdev-lab/src/env/terrain.js); [forge.js:1-4](file:///E:/Diablo2/lookdev-lab/src/env/forge.js) |
| Height-blended splat terrain | Already (3 layers + blood tint) | [terrain.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl) |
| Texture anti-tiling + macro variation | Already (IQ technique 3, textureGrad) | [terrain.glsl:56-75, 145](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl) |
| Triplanar mapping | Missing (planar XZ) | [terrain.glsl:89](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/terrain.glsl) |
| Parallax / POM / tessellation displacement | Missing | no parallax, POM or displacementMap hits |
| Detail / bump maps | Partial: albedo-as-bump on camp kits; no detail-normal layer | [weepingFields.js:788-803](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| Vertex wind on vegetation and cloth (shadows included) | Already, both | [wind.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/wind.glsl); [patches.js:6-9](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/patches.js) |
| Instanced grass and cards | Already (CPU placement; no GPU or compute grass; cards not frustum-culled) | [weepingFields.js:1729-1867](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| Water rendering | Partial: puddles with rain ripples, terrain standing water, scrolling transparent creek; no reflection, refraction or depth fade | [liquid.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/liquid.glsl); [weepingFields.js:716-722, 2651](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js) |
| Decals | Partial: mesh quads and ribbons with polygonOffset, ground-draped telegraphs; no projected or deferred decals | [weepingFields.js:1631-1650](file:///E:/Diablo2/lookdev-lab/src/scenes/weepingFields.js); [signals.js:1-10](file:///E:/Diablo2/lookdev-lab/src/env/signals.js) |
| Character FX shaders (dissolve, status, hit flash, rim) | Already, both | [webgl/effects.js:124-188](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/effects.js) |
| Physical extras (transmission, clearcoat, sheen) | Partial: editable in the inspector, unused in scenes | [panels/lookdev.js:123-164](file:///E:/Diablo2/lookdev-lab/src/panels/lookdev.js) |
| Isometric / ¾ ARPG camera | Already | [cameraRig.js:83-106](file:///E:/Diablo2/lookdev-lab/src/core/cameraRig.js) |
| Occluder cutaway (see-through) | Already (dithered circle) | [cutaway.glsl](file:///E:/Diablo2/lookdev-lab/src/shaders/effects/cutaway.glsl) |
| Soft particles / separate VFX layer | Already (half/quarter res option) | [particles.js:1-4](file:///E:/Diablo2/lookdev-lab/src/vfx/particles.js); [webgl/pipeline.js:159-163, 256-271](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/pipeline.js) |
| GPU (compute) particles | Partial: WebGPU-only demo field; skills run on CPU or quarks (WebGL2-only) | [webgpu/vfx.js:84-192](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/vfx.js); [README.md:63](file:///E:/Diablo2/lookdev-lab/README.md) |
| Ribbon / trail VFX | Partial: quarks Trail mode in skills, lightning ribbons; gameplay weapon trails are a no-op | [skills/fx.js:106, 282](file:///E:/Diablo2/lookdev-lab/src/skills/fx.js); [gameplay/fx.js:139-149](file:///E:/Diablo2/lookdev-lab/src/gameplay/fx.js) |
| Damage numbers | Partial: DOM text, not GPU | [vfxLab.js:723-755](file:///E:/Diablo2/lookdev-lab/src/vfx/vfxLab.js) |
| Telegraphs with tone-mapping-proof colours | Already | [signals.js:1-10](file:///E:/Diablo2/lookdev-lab/src/env/signals.js); [displayMatch.js:1-7](file:///E:/Diablo2/lookdev-lab/src/core/displayMatch.js) |
| GPU timers / benchmark / stress harness | Already. Per-pass breakdown on WebGL only | [gpuTimer.js](file:///E:/Diablo2/lookdev-lab/src/backends/webgl/gpuTimer.js); [bench.js](file:///E:/Diablo2/lookdev-lab/src/app/bench.js); [benchRunner.js](file:///E:/Diablo2/lookdev-lab/src/app/benchRunner.js) |
| Quality presets | Already (4 tiers) | [quality.js](file:///E:/Diablo2/lookdev-lab/src/core/quality.js) |
| Shader warm-up / precompile | Already (compileAsync hold) | [App.js:414-431](file:///E:/Diablo2/lookdev-lab/src/app/App.js) |
| InstancedMesh | Already | see §5 |
| BatchedMesh | Missing | [collision.js:31](file:///E:/Diablo2/lookdev-lab/src/character/collision.js) (type check only) |
| Static mesh merging | Already (StaticBatch) | [kit.js:391-441](file:///E:/Diablo2/lookdev-lab/src/env/kit.js) |
| LOD / impostors | Missing | no LOD hits |
| Occlusion / GPU-driven culling | Missing. Frustum culling is three's default and is disabled on 19 objects | no hits; 19 `frustumCulled = false` in [src/](file:///E:/Diablo2/lookdev-lab/src) |
| KTX2 / Basis texture compression | Partial: loader wired and decoders embedded; 0 assets use it | [assets.js:6, 59-75](file:///E:/Diablo2/lookdev-lab/src/core/assets.js); [assets/](file:///E:/Diablo2/lookdev-lab/assets) byte search |
| Draco / Meshopt geometry compression | Partial: loaders wired; 0 assets use them | [assets.js:5-7, 58-60](file:///E:/Diablo2/lookdev-lab/src/core/assets.js) |
| Texture arrays / streaming / virtual texturing | Missing (not found) | none found |
| Compute shaders in the frame | Partial: WebGPU particle demo only | [webgpu/vfx.js:111-177](file:///E:/Diablo2/lookdev-lab/src/backends/webgpu/vfx.js) |

### Inferences
- Wins that fit the current architecture (inference):
  - TAA on WebGL (or committing to WebGPU).
  - Auto-exposure gated off for signal colours, or telegraphs drawn as a post-tone-mapping overlay.
  - CSM or more static shadow caches.
  - KTX2 conversion in the asset pipeline (`prepare-prop-kit.py` currently writes JPEG).
  - LOD or BatchedMesh for the kit props.
  - A sampler-saving terrain refactor (texture arrays) to unlock more WebGPU shadow maps.

### Gaps
- Status was judged by static reading and keyword greps. A technique implemented under a name I did not search for could be missed. False positives in the base64 blob `src/procedural/baked_data.js` were excluded by hand.
- No runtime verification: whether the WebGPU path renders identically at a given setting was not checked.

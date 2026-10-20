# three.js + web graphics platform (WebGL2 / WebGPU): capability inventory for AAA techniques, as of Oct 2026

Context for the report writer: the project lab is pinned to three@0.180.0 (r180). It runs WebGLRenderer+GLSL and WebGPURenderer+TSL side by side, with three.quarks 0.16.0, and has both a 35° PerspectiveCamera and an OrthographicCamera with near = -300 (local file `lookdev-lab/src/core/cameraRig.js`). "Local r180 source" below means the installed copy in `E:\Diablo2\lookdev-lab\node_modules\three`. It is cited by the matching GitHub tag URL. "r186 tarball" means three@0.186.1 from npm, unpacked and read without running anything.

## 1. What three.js added after r180 (r181 → r186, plus r187-dev), with release numbers

### Takeaway
Since r180 (Sep 2025) there have been six releases. r186 (0.186.1, 24 Sep 2026) is the latest as of 19 Oct 2026, and r187 is in development. Nearly every AAA-relevant addition is WebGPURenderer/TSL-only:
- **GI:** SSGINode (r181), LightProbeGrid irradiance volumes (r184 WebGL, r186 WebGPU), VXGINode voxel cone tracing (r186).
- **Shadows:** SSSNode screen-space/contact shadows (r181); GodraysNode, height fog and volumetric lighting with TRAA (r183); SunLight with cascaded shadows (r186).
- **AA and upscaling:** TAAUNode and FSR1Node (r184).
- **Lighting:** ClusteredLighting Forward+ (r185, replaces TiledLighting); DynamicLighting with no recompile on light-count change (r184).
- **Other:** OIT (r186), Gaussian splats (r186).

Breaking changes are steady but mostly renames, notably PostProcessing → RenderPipeline (r183). The main behaviour changes:
- deprecated async render calls (r181);
- PCFSoftShadowMap removed (deprecated r182 on WebGL, removed r186 on WebGPU);
- shadow-bias retuning (r183);
- `positionLocal` semantics (r185);
- premultiplied alpha (r185);
- PMREM internals (r187-dev).

### Cited Findings
**Release timeline (npm publish dates are primary; GitHub release pages show the later patch dates)**
- 0.180.0 = 2025-09-03. 0.181.0 = 2025-10-31 (0.181.2 = 2025-11-19). 0.182.0 = 2025-12-10. 0.183.0 = 2026-02-18 (0.183.2 = 2026-02-28). 0.184.0 = 2026-04-16. 0.185.0 = 2026-06-25 (0.185.1 = 2026-07-01). 0.186.0 = 2026-09-08. 0.186.1 = 2026-09-24, dist-tag `latest` — [npm registry: three](https://registry.npmjs.org/three)
- GitHub release pages carry patch dates: r181 "19 Nov", r185 "01 Jul", r186 "24 Sep" — [r181](https://github.com/mrdoob/three.js/releases/tag/r181), [r185](https://github.com/mrdoob/three.js/releases/tag/r185), [r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- r187 is unreleased. The Migration Guide already has a "186 → 187" section — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) — and PRs are being merged into `dev` under milestone r187 (e.g. #34978, merged 2026-10-15) — [PR #34978](https://github.com/mrdoob/three.js/pull/34978)

**r181 (0.181.0, Oct 31 2025)** — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- **SSGINode**, "New node for screen-space global illumination" (#31839 + follow-ups). It ports SSRT3, a Unity SSGI component. It adds indirect diffuse and AO, "works best with temporal filtering", is "an expensive FX effect", and runs "60 FPS on a Pixel 8a". Reviewers saw GLSL (WebGL2-backend) output differ from WGSL ("AO looks darker"). Merged 2025-09-08 — [PR #31839](https://github.com/mrdoob/three.js/pull/31839)
- **SSSNode**: "Add new node for Screen-Space Shadows" (#32050) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- TRAANode got less ghosting (#31895) and adaptive blend weights (#32139). GTAONode got basic temporal filtering (#32076). Also new: a BitonicSort addon (#31852), `Inspector` (#31869), `CanvasTarget` (#31919) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- Lighting: multi-scattering energy compensation for direct light (#32072 WebGL, #32089 WebGPU) and a DFG LUT instead of the analytic approximation (#32054). PMREM uses GGX VNDF importance sampling (#32114…) and better rough IBL mixing (#32102/#32108) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- Compute: `dispatchWorkgroupsIndirect` (#31488); manual mipmaps for StorageTexture (#31983) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- Shadows: shadow-node cache (#31880), "Fix shadows in first frame" (#32021), "Enable dynamic shadowMap type switching" (#32105) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- WebGPU HDR example `webgpu_hdr` (#31893) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- Deprecated `renderAsync()`, `computeAsync()` and related methods (#32022…). Removed `waitForGPU()` (#32024) and WebGL 1 compatibility code (#32071) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181)
- Migration 180→181 — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide):
  - PBR indirect specular changed and rough materials got brighter; PMREM reflections improved.
  - Sync methods need an initialised renderer (`await renderer.init()`).
  - `KTX2Loader.detectSupportAsync()` → `detectSupport()`; TSL `PI2` → `TWO_PI`.
  - GTAONode AO now lives only in the `r` channel.
  - PassNode resolution accessors → `…ResolutionScale()`; `WaterMesh.resolution` → `resolutionScale`.
- "Set OrthographicCamera near plane >= 0" (#31912, r181) only touched the **examples**, not the API. It cites the docs' valid range [0, far]; a commenter asking about negative near planes got no answer — [PR #31912](https://github.com/mrdoob/three.js/pull/31912)

**r182 (0.182.0, Dec 10 2025)** — [release r182](https://github.com/mrdoob/three.js/releases/tag/r182)
- WebGLRenderer "Modernized shadow mapping" (#32181, #32303, #32407, #32443). WebGPURenderer: "PCF shadow filtering with Vogel disk sampling and IGN" (#32381, #32407), VSM optimised/fixed (#32209, #32327), point-light shadows fixed (#32365), and PointShadowNode refactored to a native cube depth texture (#32379) — [release r182](https://github.com/mrdoob/three.js/releases/tag/r182)
- Migration 181→182: "`PCFSoftShadowMap` with `WebGLRenderer` is deprecated; use `PCFShadowMap`, which is now soft". `colorBufferType` → `outputBufferType` — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- TRAA: Halton jitter in place of the MSAA pattern (#32319), better motion factor/disocclusion (#32296), less smearing (#32322) — [release r182](https://github.com/mrdoob/three.js/releases/tag/r182)
- TSL: `builtinShadowContext()` / `builtinAOContext()` (#32384/#32378) and `texture3DLoad()` / `texture3DLevel()` (#32171). BufferGeometry gets an `indirectOffset` for indirect drawing (#32392). InstanceNode supports StorageInstancedBufferAttribute (#32240) — [release r182](https://github.com/mrdoob/three.js/releases/tag/r182)
- Examples "Add WebGPU Contact Shadows" (#32262) → `webgpu_shadow_contact`, plus `webgpu_shadowmap_pointlight`. There is also a guide on post-processing with WebGPURenderer (#32279) — [release r182](https://github.com/mrdoob/three.js/releases/tag/r182)

**r183 (0.183.0, Feb 18 2026)** — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- "Rename `PostProcessing` to `RenderPipeline`" (#32789); the internal RenderPipeline became RenderObjectPipeline (#32785). In r186 `PostProcessing` is still exported as a `@deprecated since r183` wrapper that `warnOnce`s — [r186 PostProcessing.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/common/PostProcessing.js)
- "Add `GodraysNode`" (#32888), "Add Volumetric Lighting using TRAA" (#32953), "Add basic fog scattering demo" (#32613), "Add `exponentialHeightFogFactor()`" (#32659) — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- SSRNode got performance optimisations (#32637) and a distance-aware roughness blur (#32834). Water/WaterMesh got "Improve realism" (#32681) and bloom in the ocean examples (#32680). Sky/SkyMesh got "Added procedural clouds" (#32682). Also new: `retroPass` (#32930) — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- Shadows: `biasNode` (#32811), `maskShadowNode` (#32598), "Shadow map improvements" (#32705), Adreno comparison fix (#32548) — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- New `renderer.shadowMap.transmitted` flag, default `false` (#32596; renamed via #32608 → `colored` → #32611 → `transmitted`). Before this, a WebGPU shadow light always sampled 2 textures and 2 samplers: depth plus coloured/transmitted shadow. With the flag off, ShadowNode samples only depth. Mugen87 had confirmed WebGPURenderer "uses two textures per shadow light" — [PR #32596](https://github.com/mrdoob/three.js/pull/32596); [issue #32588](https://github.com/mrdoob/three.js/issues/32588); [r186 ShadowNode.js](https://github.com/mrdoob/three.js/blob/r186/src/nodes/lighting/ShadowNode.js)
- MeshLambert/Phong now use `scene.environment` IBL (#32791/#32795). Clearcoat works with rect area lights (#32809). InstanceNode supports velocity (#32586) — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- WebGPU: better uniform-buffer limit checks (#32949); "Fall back to default texture when texture creation fails" (#32853); "Always request compatibility mode and upgrade to core" (#32762); shared BindGroup via hash (#32936) — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- Migration 182→183 — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide):
  - SSRNode now blends additively.
  - `Clock` deprecated → `Timer`.
  - "WebGPU shadows were improved, so old shadow bias values may need reducing".
  - RoomEnvironment moved, which changes PMREM.
  - Sky/SkyMesh legacy gamma removed.
  - `MeshPostProcessingMaterial` removed.
  - `WebGLCubeRenderTarget` no longer works with WebGPURenderer; use `CubeRenderTarget`.

**r184 (0.184.0, Apr 16 2026)** — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- "Adding new node for TAA with Upsampling" (#33368) → **TAAUNode**. "Add FSR 1 port for `WebGPURenderer`" (#33339) → **FSR1Node**. TRAANode gained "support for reversed/logarithmic depth buffers and orthographic cameras" (#33364) and a velocity node source (#32274) — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- TRAA orthographic support: the author found "no special care is needed for orthographic cameras". Merged 2026-04-11, milestone r184 — [PR #33364](https://github.com/mrdoob/three.js/pull/33364)
- "Add position-dependent diffuse Global Illumination" (#33125) → **LightProbeGrid**, at first for WebGLRenderer only — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184); [PR #33125](https://github.com/mrdoob/three.js/pull/33125)
- "Introduce Dynamic Lights" (#33042) → `DynamicLighting`. "Add NodeMaterial compatibility layer" for WebGLRenderer (#32851) → `WebGLNodesHandler`. `HTMLTexture` (#31233) — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- Performance: "Make `compileAsync()` truly non-blocking" (#32984); "Improves compilation performance by 3.0x" (#33120) — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- Compute and readback: compute bounds check (#33186), unfilterable float32 StorageTextures (#33155), `ReadbackBuffer` and partial readback (#33300/#33322) — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- Formats and backends: depth32float with reversedDepthBuffer (#33184), a `WEBGL_multi_draw` fallback (#33238), EXT_texture_norm16 (#33303). BatchedMesh lost its deprecated instancing render paths (#33234) — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- Migration 183→184: background/environment rotation now matches object rotation; FBXLoader converts Z-up to Y-up; `FileLoader.load()` returns nothing — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

**r185 (0.185.0, Jun 25 2026)** — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- "Added ClusteredLighting (Forward+ clustered) shading" (#33406) and "Removed `TiledLighting`" (#33751) — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- ClusteredLighting details:
  - Built by a compute pass using sphere-vs-AABB tests.
  - Defaults: 32 px tiles × 24 depth slices, 64 lights per cluster, 1024 max lights.
  - Point lights only in r185.
  - "120 FPS using M2 Pro with 1000 lights".
  - Replaced TiledLighting because the 2D tiled version "drops lights that share screen pixels at different depths" — [PR #33406](https://github.com/mrdoob/three.js/pull/33406)
- Volumetric fire "enhances the `VolumetricLightingModel`" (#33848). GTAO uses cosine-weighted integration (#33654). SSR has a "Spatiotemporal Denoiser" (#33843). SSGI moved to a half-float render target (#33769), then RG11B10 (#33822). Light probes: "Add indirect bounces option to bake()" (#33657). Grounded-skybox TSL function (#33611) — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- Shadows: PCFSoftShadowFilter uses `textureGatherCompare` (#33534); textureGather/textureGatherCompare are supported (#33475); CSM handles reversed depth (#33506) — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- Platform:
  - WebXR on WebGPU (#33583), rendering to texture arrays (#33507), all BPTC formats (#33482), full ExternalTexture (#33816).
  - "Surface uncaptured GPU errors and WGSL diagnostics" (#33418).
  - InstancedMesh fully works with render bundles (#33839) — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- Examples: "Add nanite-style rasterizer" (#33605) → `webgpu_compute_rasterizer`, plus `webgpu_compute_rasterizer_ibl` (#33783) and `webgpu_furnace_test` (#33516) — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- "WebGPURenderer: Correctly honor 4-byte stride alignment" (#33787, merged 2026-06-12, fixes #33781 "Runtime errors with quantized vertex attributes"). Non-interleaved attributes whose byte stride isn't a multiple of 4 are now padded per vertex on upload — [PR #33787](https://github.com/mrdoob/three.js/pull/33787); [r186 WebGPUAttributeUtils.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/utils/WebGPUAttributeUtils.js)
- The nanite-style rasterizer is an **example only**: an "experimental, GPU-Driven Software Rasterizer implemented in TSL via compute shaders" that "renders 1+ billion triangles". No fps numbers are given — [PR #33605](https://github.com/mrdoob/three.js/pull/33605)
- Migration 184→185 — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide):
  - WebGPURenderer premultiplied-alpha change.
  - `AnamorphicNode` removed (use BloomNode).
  - GTAO "more physically correct AO, which is darker and wider".
  - TSL `positionLocal` no longer updates skinning; use `positionGeometry`.
  - `directionToColor()` → `packNormalToRGB()`.
  - `updateWorldMatrix()` honours `matrixWorldNeedsUpdate`.
  - TiledLighting removed (use ClusteredLighting).
  - SSRNode API changed (optional denoiser).
  - SSGINode uses RG11B10.
  - DRACO will always use WASM.

**r186 (0.186.0, Sep 8 2026; 0.186.1, Sep 24 2026)** — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- "Voxel Cone Tracing for Diffuse GI" (#34402) → **VXGINode**. "Add node for Order Independent Transparency" (#34253) → **OITPassNode**. "Add `SSAONode` and `depthAwareBlur`" (#33921). Faster BloomNode blur (#33923). GTAO quadratic ray stepping (#33895) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- VXGI details — [PR #34402](https://github.com/mrdoob/three.js/pull/34402):
  - Merged 2026-08-31. Default 3 cones at 40° "produce 60 FPS in both demos with a medium-tier mobile device (Pixel 8a)".
  - Needs compute shaders and storage buffers, so no WebGL 2.
  - Best with static occluders. No BatchedMesh. A poor fit for large open scenes; a future `SDFGINode` is on the roadmap.
- "Add SunLight with cascaded shadow maps" (#34221), WebGPU support (#34259), then "Move to addons" (#34326). LightProbeGrid "Add WebGPURenderer version" (#33913), with the old one renamed `LightProbeGridWebGL` (#33911). Incremental probe baking (#34486) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- Shadows: "Remove remaining PCFSoftShadowMap code" (#33987); "Detect dynamic shadow map size changes" (#34360); "Track shadow map sizes" (#34361) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- PMREM: spiral blur replaces separable blur in both renderers (#32367); "Handle unresolved PMREM during setup" (#33881) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- #33881 is a **crash** fix: setup could run "before an asynchronously loaded texture has an image" and then dereference `null`. It fixes a regression from #33482 and does not address dark IBL. Merged 2026-06-25 — [PR #33881](https://github.com/mrdoob/three.js/pull/33881)
- "WebGLAnimation: Schedule next frame before the loop callback" (#34448, merged 2026-09-03). After this, one uncaught error inside the `setAnimationLoop` callback no longer kills the classic WebGLRenderer loop for the rest of the session — [PR #34448](https://github.com/mrdoob/three.js/pull/34448); [r180 WebGLAnimation.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl/WebGLAnimation.js)
- RenderPipeline: "Add DirectRenderPipeline" (#34166) and `OnBeforeRenderPipeline` / `OnAfterRenderPipeline` hooks (#34025) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- DirectRenderPipeline "applies output processing directly in material shaders", which avoids the intermediate framebuffer. It "changes blending" and does not work with transmissive or framebuffer-sampling materials. WebGPURenderer only — [r186 DirectRenderPipeline.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/common/DirectRenderPipeline.js)
- Compute:
  - `compileComputeAsync()` (#32551); compute `updateBefore` / `updateAfter` (#34401).
  - "Allow read_write storage buffers and atomic ops in non-compute stages" (#33626); atomic workgroup arrays (#34428).
  - `batchIndirectIndex` (#34111).
  - Occlusion-query robustness fixes (#33959, #33972, #34286) and timestamp-query limit fixes (#34236) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- BatchedMesh: `positionPrevious` support, i.e. velocity (#34100), and a draw-offset fix (#34212). Gaussian splats get raycasting (#34284), per-mesh bounding box and frustum culling (#34254), and renames (`GaussianSplat` #34306, `GaussianSplatPLYLoader` #34292) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- Examples new since r185, from the files.json diff: `webgpu_gaussian_splat`, `webgpu_vxgi`, `webgpu_oit`, `webgpu_lights_sunlight`, `webgpu_lightprobes`, `webgpu_deferred` (#34049), `webgpu_postprocessing_fog` (#34319) — [r185 files.json](https://github.com/mrdoob/three.js/blob/r185/examples/files.json); [r186 files.json](https://github.com/mrdoob/three.js/blob/r186/examples/files.json)
- Platform: bone counts above the UBO limit (#34200), `packed_4x8_integer_dot_product` (#34451), `TRANSIENT_ATTACHMENT` (#33977). The CommonJS build is deprecated (#33891) and minified builds are removed (#33893) — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- Migration 185→186 — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide):
  - `Object3D.dispose()` added.
  - GTAO `distanceExponent` / `distanceFallOff` no longer do anything.
  - LightProbeGrid renamed with a WebGL suffix.
  - "`PCFSoftShadowMap` was removed from `WebGPURenderer`; use `PCFShadowMap`".
  - `SimplifyModifier` is meshoptimizer-based and async.
  - `Source` → `TextureSource`.
  - The Sky `up` uniform was removed.

**r187 (dev, unreleased as of 2026-10-19)**
- ClusteredLighting gains spot lights (no shadow/map/colorNode) and WebGL2 support: "WebGL2 emulates compute with transform feedback… 'Transform-feedback computes can only write their own element'". A new example `webgpu_lights_clustered_city` has 1,024 point and 512 spot lights. Merged 2026-10-15, milestone r187 — [PR #34978](https://github.com/mrdoob/three.js/pull/34978)
- Other examples on `dev` that are not in r186: `webgpu_renderer_pathtracer` (imports `WebGPUPathTracer` from `three-gpu-pathtracer/webgpu`), `webgpu_tsl_occlusion_dither` (Bayer-dither fade using `bayer16`; useful for isometric "see-through walls"), `webgpu_lights_clustered_city`, `webgl_loader_vdb`, `webgpu_materials_node_proxy`, `webgpu_loader_gltf_diffuse_roughness`. Removed relative to r180: `webgl_renderer_pathtracer`, `webgpu_lights_tiled` — [dev files.json](https://github.com/mrdoob/three.js/blob/dev/examples/files.json); [webgpu_renderer_pathtracer.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_renderer_pathtracer.html); [webgpu_tsl_occlusion_dither.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_tsl_occlusion_dither.html)
- Migration 186→187 (pending) — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide):
  - TSL math operands are implicitly coerced.
  - "PMREMs are based on cube render targets; `CubeUVReflectionMapping` was removed, and materials look slightly different".
  - `setViewport()` / `setScissor()` no longer apply pixel ratio when a render target is bound.
  - Custom light registration: `CustomLight.registerNode( CustomLightNode )`.
  - Struct storage buffers are always arrays.

**Topic index (the specific questions asked)**
- **SSGI / indirect lighting:** SSGINode r181; LightProbeGrid r184 (WebGL) / r186 (WebGPU); VXGINode r186 (WebGPU backend only). There is no RTGI, DDGI or radiance-cascades node — sources as above.
- **Screen-space / contact shadows:** SSSNode r181. The `webgpu_shadow_contact` example (r182) is the older blurred-depth ground contact-shadow trick (it imports `gaussianBlur` and `depth`) — [webgpu_shadow_contact.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_shadow_contact.html)
- **New shadow techniques:**
  - r182: Vogel-disk PCF with IGN (WebGPU) and modernised soft-PCF WebGL shadows.
  - r183: biasNode and maskShadowNode.
  - r185: textureGatherCompare.
  - r186: SunLight CSM addon, and PCFSoft removed from WebGPU.
  - No PCSS node was added — releases above.
- **Clustered / tiled lighting:** TiledLighting (r180) → DynamicLighting (r184) → ClusteredLighting (r185; spot lights and WebGL2 in r187-dev).
- **Volumetrics:**
  - Already in r180: VolumeNodeMaterial and the `webgpu_volume_lighting` example.
  - r183: GodraysNode, TRAA-based volumetric lighting, height fog.
  - r185: volumetric fire.
  - r186: post-processing fog example.
  - Sources: [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json) and the releases above.
- **Water / ocean:**
  - Still the r180-era `Water`/`Water2`/`WaterMesh`/`Water2Mesh` (normal-map planar reflection).
  - r183 realism pass; the r186 `webgpu_ocean` example uses `WaterMesh` + `SkyMesh` + `bloom`.
  - **No FFT ocean in core** — [webgpu_ocean.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_ocean.html)
- **TAA / upscaling:** TRAA quality work (r181–r182), TAAUNode + FSR1Node (r184), TRAA orthographic support (r184), TAAUtils (r186). No FSR2/3, DLSS or XeSS (TAAU is offered as "an alternative to FSR2/3") — [r186 TAAUNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/TAAUNode.js)
- **Post-processing API renames:**
  - r181: `setResolution` → `setResolutionScale`.
  - r183: `PostProcessing` → `RenderPipeline`.
  - r186: `DirectRenderPipeline`.
- **Compute / indirect / occlusion:** dispatchWorkgroupsIndirect (r181); indirectOffset (r182); ReadbackBuffer (r184); compileComputeAsync, batchIndirectIndex, storage and atomics in render stages, occlusion fixes (r186).
- **BatchedMesh:** wireframe and per-instance opacity (r183); deprecated instancing path removed (r184); velocity and offset fixes (r186). The r186 WebGPU backend **still issues one `drawIndexed` per sub-draw** in a loop, since WebGPU has no multi-draw — [r186 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPUBackend.js)

### Inferences
- **Upgrading r180 → r186** unlocks SSGI, SSS, TAAU/FSR1, LightProbeGrid (WebGPU), ClusteredLighting, SunLight CSM, VXGI, OIT, GodraysNode and height fog. Most are directly useful for a dark ARPG lookdev: torches via clustered lights, baked GI via probe grids, contact shadows, god rays.
  - Expect to retune shadow bias (r183), AO intensity (GTAO changes in r181, r185, r186), IBL look (r181, r187) and premultiplied-alpha blending (r185).
  - Expect to rename PostProcessing, PI2, the PassNode resolution accessors and outputBufferType.
- **Lab code that uses `renderAsync`, `waitForGPU`, `PCFSoftShadowMap` or `positionLocal` for skinned meshes will need changes.** three.quarks 0.17 requires three ≥ 0.182 (see section 6).
- **Waiting for r187** (expected Q4 2026) would add WebGL2 clustered lights and spot-light clustering, but also brings the PMREM cube-RT change.

### Gaps
- Exact r187 release date is unknown; past cadence was every 2–3 months.
- Release pages are summaries; some items under "Read more" may have been missed (the fetch tool truncated long pages).
- No official perf numbers for most new nodes beyond PR anecdotes (Pixel 8a 60 FPS, M2 Pro).

## 2. Built-in effect inventory at r180 (TSL nodes) and the WebGL EffectComposer equivalents

### Takeaway
r180 already has a fairly complete TSL post stack for WebGPURenderer: GTAO, SSR, TRAA, bloom, DoF, motion blur, SMAA/FXAA/SSAA, LUT, outline, lens flare, denoise. It also has tiled lights and tiled shadows. All of these run on **WebGPURenderer** (WebGPU backend, and mostly also its WebGL2 fallback backend) and **not on classic WebGLRenderer**. The WebGLRenderer EffectComposer set has the same composer passes from r180 through r186. Compared with TSL it has no SSGI, no screen-space shadows, no reprojection TAA (TAARenderPass only accumulates while static), no motion-blur pass and no upscalers.

### Cited Findings
**r180 TSL node inventory (verified file list)**
- `examples/jsm/tsl/display/` contains AfterImageNode, AnaglyphPassNode, AnamorphicNode, BleachBypass, BloomNode, ChromaticAberrationNode, DenoiseNode, DepthOfFieldNode, DotScreenNode, FXAANode, FilmNode, GTAONode, GaussianBlurNode, LensflareNode, Lut3DNode, MotionBlur, OutlineNode, ParallaxBarrierPassNode, PixelationPassNode, RGBShiftNode, SMAANode, SSAAPassNode, SSRNode, Sepia, SobelOperatorNode, StereoCompositePassNode, StereoPassNode, TRAANode, TransitionNode, boxBlur, hashBlur. Plus `lighting/TiledLightsNode`, `shadows/TileShadowNode` (+Helper), `utils/Raymarching`, `math/Bayer` — [r180 tsl dir](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/tsl)
- Core nodes in r180 (`src/nodes/display`) include:
  - `PassNode` (scene pass with MRT), `ToneMappingNode`, `RenderOutputNode`, `ToonOutlinePassNode`.
  - `ViewportTextureNode`, `ViewportSharedTextureNode`, `ViewportDepthTextureNode` (refraction/backdrop/soft-particle building blocks).
  - `BlendModes`, `ColorAdjustment`, `PosterizeNode`.
  - In `utils/`: `ReflectorNode` (planar reflections), `RTTNode`, `TriplanarTextures`, `SpriteSheetUVNode`.
  - Source: [r180 src/nodes/display](https://github.com/mrdoob/three.js/tree/r180/src/nodes/display); [r180 src/nodes/utils](https://github.com/mrdoob/three.js/tree/r180/src/nodes/utils)
- The r186 tarball adds BilateralBlurNode, CRT, FSR1Node, GodraysNode, ImportanceSampledEnvironment, OITPassNode, RecurrentDenoiseNode, RetroPassNode, SSAONode, SSGINode, SSSNode, Shape, SharpenNode, TAAUNode, TemporalReprojectNode, depthAwareBlend/Blur, radialBlur. Also `lighting/` ClusteredLightsNode, DynamicLightsNode, LightProbeGridNode; `math/` curlNoise, voronoiNoise; `utils/` GroundedSkybox, RNoise, SoftParticles, SpecularHelpers, TAAUtils. It drops AnamorphicNode and TiledLightsNode — [r186 tsl dir](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/tsl)

**What the important r180 nodes do, and their caveats**
- **GTAONode** `ao(depthNode, normalNode, camera)`: Ground Truth AO (Activision). Needs a depth+normal pre-pass or MRT. In r186 the result is applied through `builtinAOContext()` — [r180 GTAONode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/GTAONode.js); [r186 GTAONode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/GTAONode.js). Quality changed in r181, r185 and r186 (see section 1).
- **DenoiseNode** `denoise(node, depth, normal, camera)`: Poisson denoise for raw AO. It "can noticeably improve the quality of ambient occlusion but also add quite some overhead… make its usage optional (e.g. via graphic settings)" — [r180 DenoiseNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/DenoiseNode.js)
- **SSRNode**:
  - r180 signature: `ssr(color, depth, normal, metalness, roughness, camera)`, so it needs metalness/roughness in MRT. It is based on lettier's ray-march SSR, and its source has explicit orthographic-camera handling — [r180 SSRNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/SSRNode.js)
  - r185+ signature: `ssr(color, depth, normal, options)`, with an optional spatiotemporal denoiser — [r186 SSRNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSRNode.js)
- **TRAANode** `traa(beauty, depth, velocity, camera)`: temporal reprojection AA that needs a velocity MRT. "Note: MSAA must be disabled when TRAA is in use." Orthographic and reversed-depth support were only added in r184 (#33364) — [r180 TRAANode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/TRAANode.js); [r186 TRAANode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/TRAANode.js); [PR #33364](https://github.com/mrdoob/three.js/pull/33364)
- **BloomNode** `bloom(node, strength, radius, threshold)`:
  - Selective bloom works by feeding an `emissive` MRT output.
  - Its internal render targets are named `UnrealBloomPass.*`, so it is the same mip-chain design as UnrealBloomPass (inferred from the source).
  - Source: [r180 BloomNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/BloomNode.js)
- **DepthOfFieldNode** `dof(node, viewZ, focusDistance, focalLength, bokehScale)`: a new implementation in r180 ("new implementation with a new API"), referencing the Doom 2016 bokeh DoF — [r180 DepthOfFieldNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/DepthOfFieldNode.js); [Migration Guide 179→180](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
- **MotionBlur** `motionBlur(input, velocity, numSamples = 16)`: a velocity-buffer blur — [r180 MotionBlur.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/MotionBlur.js)
- **OutlineNode** `outline(scene, camera, { selectedObjects, edgeGlow, edgeThickness })`: returns visible and hidden edge masks for custom compositing (useful for hover/selection highlights). Its source handles orthographic cameras — [r180 OutlineNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/OutlineNode.js)
- **SSAAPassNode**: re-renders the scene once per jittered sample. It is "extremely expensive because of its brute-force approach" — [r180 SSAAPassNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/SSAAPassNode.js)
- **LensflareNode**: a "bloom-based lens flare" that needs a bloom pass first (John Chapman's pseudo lens flare) — [r180 LensflareNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/LensflareNode.js)
- **Lut3DNode** `lut3D(node, lut, size, intensity)` does colour grading; SMAANode and FXAANode do post AA — [r180 tsl/display](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/tsl/display)
- **TiledLightsNode**: tiled lighting built by a compute pass (`renderer.compute(this._compute)`), defaults `maxLights = 1024`, `tileSize = 32`, used through the `TiledLighting` addon. Removed in r185 for ClusteredLighting — [r180 TiledLightsNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/lighting/TiledLightsNode.js); [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- **TileShadowNode**: "allows splitting a shadow map into multiple tiles, each with its own light and camera, to improve shadow quality and performance for large scenes". "This class does not support `VSMShadowMap`" — [r180 TileShadowNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/shadows/TileShadowNode.js)
- **Raymarching**: a `RaymarchingBox(count, ({ positionRay }) => …)` helper for volumes (used by the volume examples). **Bayer**: an ordered-dither texture (e.g. `bayer16`) — [r180 Raymarching.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/utils/Raymarching.js); [r180 Bayer.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/math/Bayer.js)
- **ToonOutlinePassNode** (core): an outline pass applied only to `MeshToonMaterial` / `MeshToonNodeMaterial` objects — [r180 ToonOutlinePassNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/display/ToonOutlinePassNode.js)

**Which renderer runs the TSL nodes**
- TSL nodes need WebGPURenderer. WebGPURenderer has a WebGL 2 backend (`forceWebGL`, or automatic fallback when WebGPU is unavailable) — [r180 WebGPURenderer.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPURenderer.js)
- From r184, classic WebGLRenderer can render NodeMaterials via `renderer.setNodesHandler( new WebGLNodesHandler() )` — [r186 webgl_tsl_shadowmap.html](https://github.com/mrdoob/three.js/blob/r186/examples/webgl_tsl_shadowmap.html). The handler's own limitations list — [r186 WebGLNodesHandler.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/WebGLNodesHandler.js):
  - "VSM shadows not supported";
  - "MRT not supported";
  - "Transmission not supported";
  - "WebGPU postprocessing stack not supported";
  - "Storage textures not supported";
  - fog and environment do not auto-update.
- Some newer nodes are explicitly backend-limited:
  - VXGINode "can only be used with `WebGPURenderer` and a WebGPU backend" — [r186 VXGINode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/lighting/vxgi/VXGINode.js)
  - GaussianSplat supports WebGPURenderer, including its `forceWebGL` fallback, but not WebGLRenderer — [r186 GaussianSplat.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/objects/GaussianSplat.js)
  - OITPassNode: "MSAA is only supported with the WebGPU backend" — [r186 OITPassNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/OITPassNode.js)

**Classic WebGLRenderer EffectComposer equivalents (r180; same file list in r186)**
- Passes: AfterimagePass, BloomPass, BokehPass, ClearPass, CubeTexturePass, DotScreenPass, EffectComposer, FXAAPass, FilmPass, GTAOPass, GlitchPass, HalftonePass, LUTPass, MaskPass, OutlinePass, OutputPass, RenderPass, RenderPixelatedPass, RenderTransitionPass, SAOPass, SMAAPass, SSAARenderPass, SSAOPass, SSRPass, SavePass, ShaderPass, TAARenderPass, TexturePass, UnrealBloomPass. A diff of the r180 and r186 directories shows no additions — [r180 postprocessing dir](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/postprocessing); [r186 postprocessing dir](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/postprocessing)
- **TAARenderPass**: "When there is no motion in the scene, the TAA render pass accumulates jittered camera samples… This effect uses no reprojection so it is no TRAA implementation" — [r180 TAARenderPass.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/TAARenderPass.js)
- **AO passes**: GTAOPass "provides better quality than SSAOPass but is also more expensive" and has a built-in Denoise output. SAOPass likewise beats SSAOPass but costs more — [r180 GTAOPass.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/GTAOPass.js); [r180 SAOPass.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/SAOPass.js); [r180 SSAOPass.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/SSAOPass.js)
- **SSRPass** is "A pass for a basic SSR effect" (with `ReflectorForSSRPass` for planar cases). **OutputPass** applies tone mapping and colour-space conversion and must come before sRGB-input passes such as FXAA — [r180 SSRPass.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/SSRPass.js); [r180 OutputPass.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/OutputPass.js)
- Shader-only building blocks for WebGL: GodRaysShader (`webgl_postprocessing_godrays`), SubsurfaceScatteringShader, VolumeShader, ToonShader, VelocityShader, BokehShader2, GTAOShader, SSRShader — [r180 shaders dir](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/shaders)
- r180 WebGL examples include `webgl_postprocessing_gtao`, `_sao`, `_ssao`, `_ssr`, `_taa`, `_unreal_bloom(_selective)`, `_dof(2)`, `_outline`, `_smaa`, `_godrays`, `_3dlut`, `_material_ao`, plus `webgl_shadowmap_pcss`, `webgl_shadowmap_csm`, `webgl_shadow_contact`, `webgl_shadowmap_progressive`, `webgl_volume_cloud`, `webgl_shaders_ocean`, `webgl_gpgpu_water`, `webgl_batch_lod_bvh` — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)

**Orthographic-camera notes (important for the isometric camera)**
- Files that explicitly handle orthographic cameras: r180 — OutlineNode, SSRNode; r186 — also SSSNode, depthAwareBlend, CSM/CSMShadowNode, SunLightShadow / SunShadowNode, LightProbeGridWebGL. Found by grepping for `isOrthographicCamera` — [r186 tsl dir](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/tsl)
- TRAANode got orthographic support in r184 — [PR #33364](https://github.com/mrdoob/three.js/pull/33364)

### Inferences
- **WebGPU side:** r180 can already cover AO (GTAO + denoise), SSR, TRAA, bloom, DoF, motion blur, LUT grading, outlines and lens flare. TRAA with the ortho camera, SSGI, SSS, godrays, TAAU and FSR1 need ≥ r184.
- **WebGL side:** the composer stack plus GLSL shader chunks can do bloom, GTAO/SAO, basic SSR, static-only TAA, SMAA/FXAA, LUT, outline, bokeh, godrays shader and PCSS (example). SSGI, TRAA, SSS and upscaling would be custom GLSL ports, or come from pmndrs/N8AO (section 6).
- **Isometric camera, treat as unverified:** a missing `isOrthographicCamera` branch does not prove a node is broken; GTAO, SSGI and Godrays reconstruct view positions from the projection matrix. Their orthographic behaviour is unverified and should be tested in the lab.

### Gaps
- No per-node GPU cost tables exist in the official docs. Only PR anecdotes.
- No source confirms how well each TSL node works on WebGPURenderer's WebGL2 backend, beyond the SSGI GLSL discrepancy noted in PR #31839 and the explicit WebGPU-only notes.

## 3. Lighting, shadows and materials capabilities

### Takeaway
Both renderers offer the standard PBR set: MeshStandard/Physical with clearcoat, sheen, transmission, iridescence, anisotropy and dispersion; shadow types Basic/PCF/PCFSoft/VSM; CSM; light probes; PMREM IBL; 8 tone-mapping operators.
- **WebGPURenderer adds:**
  - node hooks on every material stage;
  - MRT and velocity buffers;
  - MeshSSSNodeMaterial;
  - TileShadowNode and CSMShadowNode;
  - IES and projector lights;
  - volumetric lighting;
  - HDR canvas output;
  - after r180: SSGI, LightProbeGrid, VXGI, clustered lights, SunLight CSM.
- **Shadow softness is now "PCF only":** PCFSoftShadowMap was deprecated (WebGL r182) and removed (WebGPU r186).
- **Missing everywhere:** a built-in PCSS (only a WebGL example), ray-traced shadows, area-light shadows.

### Cited Findings
**Shadow maps**
- r180 shadow constants: `BasicShadowMap` ("unfiltered… fastest"), `PCFShadowMap`, `PCFSoftShadowMap` ("better soft shadows especially when using low-resolution shadow maps"), `VSMShadowMap` ("all shadow receivers will also cast shadows") — [r180 constants.js](https://github.com/mrdoob/three.js/blob/r180/src/constants.js)
- r180 WebGPU shadow filters in TSL: `BasicShadowFilter`, `PCFShadowFilter`, `PCFSoftShadowFilter`, `VSMShadowFilter` (VSM uses separable vertical/horizontal blur passes driven by `shadow.radius`) — [r180 ShadowFilterNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/lighting/ShadowFilterNode.js); [r180 ShadowNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/lighting/ShadowNode.js)
- After r180:
  - WebGL PCF became soft and PCFSoft was deprecated (r182).
  - WebGPU PCF switched to Vogel disk + IGN (r182).
  - PCFSoft was removed from WebGPURenderer (r186).
  - textureGatherCompare is used (r185).
  - Sources: [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide); [release r182](https://github.com/mrdoob/three.js/releases/tag/r182); [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- **CSM**:
  - `CSM` (addon) "can only be used with WebGLRenderer", while `CSMShadowNode` "can only be used with WebGPURenderer" — [r180 CSM.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/csm/CSM.js); [r180 CSMShadowNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/csm/CSMShadowNode.js)
  - r186 adds `SunLight` (addon) with built-in cascaded shadows via `SunLightShadow`. With WebGPURenderer it must be registered (`renderer.library.addLight( SunLightNode, SunLight )`) — [r186 SunLight.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/lights/SunLight.js)
- **TileShadowNode** (r180, WebGPU): a tiled shadow map for large scenes, with no VSM — [r180 TileShadowNode.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/shadows/TileShadowNode.js)
- **PCSS**: only `webgl_shadowmap_pcss` (a WebGL example using shader-chunk overrides). No WebGPU PCSS example exists in r180, r186 or dev — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json); [dev files.json](https://github.com/mrdoob/three.js/blob/dev/examples/files.json)
- **NodeMaterial shadow hooks** (r180): `castShadowNode`, `receivedShadowNode`, `castShadowPositionNode`, `receivedShadowPositionNode`. r183 adds `biasNode` and `maskShadowNode` — [r180 NodeMaterial.js](https://github.com/mrdoob/three.js/blob/r180/src/materials/nodes/NodeMaterial.js); [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- **Screen-space / contact shadows**: SSSNode (r181) is for "a single directional light". It is best with max shadow length ≤ 1 m (cost rises with length), may need a blur for soft edges, and only sees on-screen occluders. Intended as "Shadow Maps for the foundation and Screen-Space Shadows for the details" — [r186 SSSNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/SSSNode.js)
- **Godrays** (r183 GodraysNode) are "screen-space raymarched" and need a full shadow setup. Point and directional lights only. Bilateral blur plus `depthAwareBlend` composite are recommended. Ported from three-good-godrays — [r186 GodraysNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/GodraysNode.js)

**Lights, probes, GI**
- r180 WebGPU light nodes: Ambient, Directional, Hemisphere, Point (+PointShadowNode), Spot, IESSpotLight, ProjectorLight, RectArea, LightProbe, plus AONode, IrradianceNode, EnvironmentNode, BasicLightMapNode — [r180 src/nodes/lighting](https://github.com/mrdoob/three.js/tree/r180/src/nodes/lighting)
- **LightProbeGenerator** (r180): `fromCubeTexture()` (CPU), and `async fromCubeRenderTarget(renderer, cubeRT)`. The async one accepts WebGPURenderer or WebGLRenderer via `readRenderTargetPixelsAsync` — [r180 LightProbeGenerator.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/lights/LightProbeGenerator.js)
- **LightProbeGrid** (r184 WebGL; r186 WebGPU) — [r186 LightProbeGrid.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/lighting/LightProbeGrid.js); [PR #33125](https://github.com/mrdoob/three.js/pull/33125):
  - A "3D grid of L2 Spherical Harmonic irradiance probes that provides position-dependent diffuse global illumination".
  - Baking is "fully GPU-resident… zero CPU readback". Data goes into one RGBA `RenderTarget3D` atlas.
  - It is a `Light`, so it applies to all lit node materials.
  - mrdoob: "light leaking is hard to solve"; e.g. "147 light probes (7x7x3)" for Sponza.
- **Other GI options**:
  - SSGINode (r181, screen-space).
  - VXGINode (r186; dynamic lights, static occluders, WebGPU only).
  - ProgressiveLightMap / ProgressiveLightMapGPU (r180; accumulates a lightmap at runtime; `webgpu_shadowmap_progressive`).
  - Sources: [r180 misc dir](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/misc); [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- **Many lights**:
  - `DynamicLighting` (r184) "batches supported analytic lights into uniform arrays so light count changes do not recompile materials" — [r186 DynamicLighting.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/lighting/DynamicLighting.js)
  - `ClusteredLighting` (r185) is "Forward+ Clustered Shading… Suitable for 3D scenes with many point lights", set via `renderer.lighting = new ClusteredLighting()` — [r186 ClusteredLighting.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/lighting/ClusteredLighting.js)
  - A deferred-rendering example (`webgpu_deferred`, r186) builds a G-buffer through `mrt()` and `overrideNodes` — [webgpu_deferred.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_deferred.html)

**PMREM / IBL**
- r180 WebGPU PMREMGenerator methods: `fromScene` / `fromSceneAsync`, `fromEquirectangular(Async)`, `fromCubemap(Async)`, `compileCubemapShader`, `compileEquirectangularShader` — [r180 common/extras/PMREMGenerator.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/extras/PMREMGenerator.js)
- Quality changes after r180: VNDF importance sampling and multi-scattering (r181), Blender-matched roughness (r182), spiral blur (r186), PMREM on cube render targets (r187-dev) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181); [release r182](https://github.com/mrdoob/three.js/releases/tag/r182); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186); [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

**Materials**
- MeshPhysicalNodeMaterial hooks (r180): clearcoat (+roughness, normal), sheen (+roughness), iridescence (+IOR, thickness), specularIntensity/Color, ior, transmission, thickness, attenuationDistance/Color, **dispersion**, **anisotropy**, plus metalness/roughness/emissive — [r180 MeshPhysicalNodeMaterial.js](https://github.com/mrdoob/three.js/blob/r180/src/materials/nodes/MeshPhysicalNodeMaterial.js)
- r180 also has glTF examples for anisotropy, dispersion, iridescence, sheen and transmission on WebGPU — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- **MeshSSSNodeMaterial** (r180) is "an experimental extension of MeshPhysicalNodeMaterial that implements a Subsurface scattering (SSS) term", with `thicknessColorNode`, `thicknessDistortionNode`, `thicknessAmbientNode`, `thicknessAttenuationNode`, `thicknessPowerNode`, `thicknessScaleNode` — [r180 MeshSSSNodeMaterial.js](https://github.com/mrdoob/three.js/blob/r180/src/materials/nodes/MeshSSSNodeMaterial.js)
- **Toon**: MeshToonNodeMaterial and ToonLightingModel, plus ToonOutlinePassNode (r180) and the `webgpu_materials_toon` example — [r180 materials/nodes](https://github.com/mrdoob/three.js/tree/r180/src/materials/nodes); [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- Other node materials in r180: VolumeNodeMaterial, ShadowNodeMaterial, SpriteNodeMaterial, PointsNodeMaterial, Line2NodeMaterial, Matcap, Lambert, Phong, Basic, Normal — [r180 materials/nodes](https://github.com/mrdoob/three.js/tree/r180/src/materials/nodes)
- **NodeMaterial hooks** (r180): `colorNode`, `normalNode`, `opacityNode`, `alphaTestNode`, `maskNode`, `positionNode`, `geometryNode`, `depthNode`, `outputNode`, `mrtNode`, `fragmentNode`, `vertexNode`, `lightsNode`, `envNode`, `aoNode`, `backdropNode`, `backdropAlphaNode`, plus the shadow hooks above — [r180 NodeMaterial.js](https://github.com/mrdoob/three.js/blob/r180/src/materials/nodes/NodeMaterial.js)
- The `positionLocal` semantics changed in r185 (use `positionGeometry` for raw geometry) — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

**MRT, velocity, tone mapping, HDR, fog, volumes, water, transparency**
- **MRT and velocity**:
  - r180 exports `mrt()` and `velocity` in TSL; `pass(scene, camera).setMRT( mrt({ output, normal, velocity, emissive… }) )` is the standard G-buffer pattern — [r180 MRTNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/core/MRTNode.js); [r180 VelocityNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/accessors/VelocityNode.js)
  - Instanced velocity arrived in r183 and BatchedMesh velocity in r186 — [release r183](https://github.com/mrdoob/three.js/releases/tag/r183); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **Tone mapping**: identical in r180 and r186 — `NoToneMapping`, `LinearToneMapping`, `ReinhardToneMapping`, `CineonToneMapping`, `ACESFilmicToneMapping`, `CustomToneMapping`, `AgXToneMapping`, `NeutralToneMapping` — [r180 constants.js](https://github.com/mrdoob/three.js/blob/r180/src/constants.js); [r186 constants.js](https://github.com/mrdoob/three.js/blob/r186/src/constants.js)
- **HDR canvas output**:
  - r180 already supports it in WebGPURenderer. `ExtendedSRGBColorSpace` (addons `math/ColorSpaces.js`) declares `toneMappingMode: 'extended'`, and the backend passes `toneMapping: { mode }` to `context.configure()`. Also set `outputType: HalfFloatType` — [r180 ColorSpaces.js](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/math/ColorSpaces.js); [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js)
  - The official `webgpu_hdr` example (r181) uses exactly `ExtendedSRGBColorSpace` + `outputType: THREE.HalfFloatType` — [webgpu_hdr.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_hdr.html). For browser support see section 5.
- **Fog**:
  - TSL `rangeFogFactor`, `densityFogFactor` and `fog()` (r180), plus `exponentialHeightFogFactor` (r183) — [r186 Fog.js](https://github.com/mrdoob/three.js/blob/r186/src/nodes/fog/Fog.js)
  - Examples: `webgpu_custom_fog(_background)` (r180), `webgpu_fog_height`, `webgpu_custom_fog_scattering`, `webgpu_postprocessing_fog` (r183–r186) — [dev files.json](https://github.com/mrdoob/three.js/blob/dev/examples/files.json)
- **Volumes**:
  - r180 has `VolumeNodeMaterial` + `VolumetricLightingModel` and the examples `webgpu_volume_lighting`, `webgpu_volume_lighting_rectarea`, `webgpu_volume_cloud`, `webgpu_volume_caustics`, `webgpu_volume_perlin` — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json); [r186 src/nodes/functions](https://github.com/mrdoob/three.js/tree/r186/src/nodes/functions)
  - Added later: `webgpu_volume_lighting_traa` (r183) and `webgpu_volume_fire` (r185) — [r186 files.json](https://github.com/mrdoob/three.js/blob/r186/examples/files.json)
- **Water / sky**:
  - r180 objects: `Water`, `Water2`, `WaterMesh`, `Water2Mesh`, `Sky`, `SkyMesh`, `Reflector`, `Refractor`, `GroundedSkybox`, `Lensflare(Mesh)` — [r180 objects dir](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/objects)
  - Compute water: `webgpu_compute_water` (heightfield) — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- **Transparency**: OITPassNode (r186) is weighted blended OIT. Only `NormalBlending`, non-transmissive materials qualify; OIT objects do not write custom MRT outputs — [r186 OITPassNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/OITPassNode.js)
- **Soft particles**: `softParticles()` TSL util (r186), based on NVIDIA's Soft Particles paper — [r186 SoftParticles.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/utils/SoftParticles.js)

### Inferences
- **Shadows for a Diablo-like:** directional "sun/moon" CSM (CSM.js on WebGL; CSMShadowNode, or SunLight on r186, on WebGPU), PCF soft shadows, SSSNode for contact detail (r181+), point-light torch shadows (6-face cube; expensive, so budget a few).
- **Many unshadowed torches and spells:** ClusteredLighting (r185+) or DynamicLighting (r184+) on WebGPU. On WebGL there is no built-in clustered path until r187's transform-feedback fallback in WebGPURenderer, and none at all for classic WebGLRenderer.
- **Baked GI for static dungeons:** LightProbeGrid (WebGL r184, WebGPU r186) is the cheapest "AAA-ish" GI. VXGI suits small static interiors on WebGPU only. SSGI suits fully dynamic scenes but is noisy and screen-space.
- **PCSS** remains custom work: GLSL on WebGL (example exists) or a custom TSL filter on WebGPU.

### Gaps
- I could not confirm whether `shadow.radius` controls PCF softness identically on both renderers after r182's "modernized shadow mapping"; the release notes don't detail it.
- No official doc covers HDR output on Firefox/Safari with three.js; see section 5 for browser-level data.

## 4. GPU / performance features (compute, storage, indirect, queries, batching, assets, compile, info)

### Takeaway
- **r180's WebGPURenderer already exposes most "GPU-driven" primitives:**
  - TSL compute;
  - storage buffers and textures (2D/3D/array);
  - atomics, barriers, workgroup memory, subgroups;
  - indirect draws;
  - occlusion and timestamp queries;
  - render bundles;
  - `compileAsync`;
  - all adapter optional features.
- **Gaps in r180:**
  - no multi-draw-indirect (BatchedMesh on WebGPU loops one draw per sub-mesh, even in r186);
  - limits stay at spec defaults unless `requiredLimits` is passed;
  - compute on the WebGL2 backend is transform-feedback emulation (each invocation writes only its own element).
- **Later releases add mostly polish:** indirect dispatch, readback buffers, faster/non-blocking compile, compute in render stages.
- **Performance through r186:** WebGPURenderer is still about 1.3–4× slower on the CPU than WebGLRenderer for many-draw scenes, on both of its backends, and 6–36× slower to initialise materials. The causes are per-object UBO/bind-group management and per-call `queue.submit`, tracked in open issues #30560 and #33821. WebGPU's advantage is compute and TSL, not draw throughput.

### Cited Findings
**Compute and storage**
- r180 gpgpu nodes: `ComputeNode`, `AtomicFunctionNode`, `BarrierNode`, `ComputeBuiltinNode`, `SubgroupFunctionNode`, `WorkgroupInfoNode` — [r180 src/nodes/gpgpu](https://github.com/mrdoob/three.js/tree/r180/src/nodes/gpgpu)
- Storage accessors: `StorageBufferNode` and `StorageTextureNode`. Renderer classes: `StorageBufferAttribute`, `StorageInstancedBufferAttribute`, `StorageTexture`, `Storage3DTexture`, `StorageArrayTexture`, `IndirectStorageBufferAttribute` — [r180 src/nodes/accessors](https://github.com/mrdoob/three.js/tree/r180/src/nodes/accessors); [r180 src/renderers/common](https://github.com/mrdoob/three.js/tree/r180/src/renderers/common)
- r180 compute examples: `webgpu_compute_particles(_fluid/_rain/_snow)`, `_birds`, `_cloth`, `_geometry`, `_points`, `_reduce`, `_sort_bitonic`, `_texture(_3d/_pingpong)`, `_water`, `_audio`, `webgpu_storage_buffer`, `webgpu_struct_drawindirect` — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- **WebGL2 fallback compute**: r180's WebGL backend runs `compute()` via transform feedback (`gl.beginTransformFeedback( gl.POINTS )`) — [r180 WebGLBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl-fallback/WebGLBackend.js). The limitation is stated in the r187 PR: "Transform-feedback computes can only write their own element" — [PR #34978](https://github.com/mrdoob/three.js/pull/34978)
- Post-r180 compute additions:
  - `dispatchWorkgroupsIndirect` (r181).
  - Bounds checks and float32 unfilterable storage textures (r184).
  - `storageTexture3D` (r185).
  - `compileComputeAsync`, read_write storage and atomics in vertex/fragment, atomic workgroup arrays (r186).
  - BitonicSort (r181) and CountingSort (`examples/jsm/gpgpu` in r186) addons.
  - Sources: [release r181](https://github.com/mrdoob/three.js/releases/tag/r181); [release r184](https://github.com/mrdoob/three.js/releases/tag/r184); [release r185](https://github.com/mrdoob/three.js/releases/tag/r185); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186); [r186 gpgpu dir](https://github.com/mrdoob/three.js/tree/r186/examples/jsm/gpgpu)

**Indirect draws, batching, instancing, LOD, bundles**
- r180 `BufferGeometry` has `indirect` and `setIndirect()`. The WebGPU backend calls `drawIndexedIndirect` / `drawIndirect` when a render object has an indirect buffer — [r180 BufferGeometry.js](https://github.com/mrdoob/three.js/blob/r180/src/core/BufferGeometry.js); [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js)
- Later: r182 adds `indirectOffset` (r186 accepts an array of offsets → several indirect draws), and r186 adds `batchIndirectIndex` — [release r182](https://github.com/mrdoob/three.js/releases/tag/r182); [r186 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPUBackend.js); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **BatchedMesh on each backend**:
  - WebGL backend: uses `WEBGL_multi_draw` (`renderMultiDraw`) and warns if it is missing — [r180 WebGLBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl-fallback/WebGLBackend.js)
  - WebGPU backend: loops `drawIndexed(count, 1, start, 0, i)` per sub-draw in both r180 and r186. That is CPU-side draw submission, not multi-draw — [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js); [r186 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPUBackend.js)
  - r184 added a `WEBGL_multi_draw` fallback (#33238) — [release r184](https://github.com/mrdoob/three.js/releases/tag/r184)
- **Render bundles**: `BundleGroup` "enables applications access to the Render Bundle API of WebGPU". With a WebGL backend it renders "but without any performance improvements" — [r180 BundleGroup.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/BundleGroup.js). InstancedMesh became fully supported in bundles in r185 — [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- Instancing, batching and LOD examples in r180: `webgpu_instance_mesh`, `webgpu_mesh_batch`, `webgpu_performance_renderbundle`, `webgl_batch_lod_bvh`, `webgl_lod`, `webgl_instancing_performance` — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)

**Queries and profiling**
- **Occlusion queries** (r180): set `object.occlusionTest = true` and read `renderer.isOccluded(object)`. They are implemented in both the WebGPU and WebGL backends (`webgpu_occlusion` example). r185–r186 fixed stale or robustness issues (#33765, #33959, #33972) and blocked bundle+occlusion combinations (#34286) — [r180 RenderList.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/RenderList.js); [r180 WebGLBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl-fallback/WebGLBackend.js); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **Timestamp queries**: `trackTimestamp: true` plus `renderer.resolveTimestampsAsync( 'render' | 'compute' )`, through `TimestampQueryPool` (r180). r186 fixed query limits (#34236) — [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js); [r180 Renderer.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/Renderer.js); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **`renderer.info`** (WebGPURenderer, r180):
  - `render.{calls, frameCalls, drawCalls, triangles, points, lines, timestamp}`
  - `compute.{calls, frameCalls, timestamp}`
  - `memory.{geometries, textures}`
  - Source: [r180 Info.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/Info.js)
- r181 added the `Inspector` developer tool (#31869), which examples now import from `three/addons/inspector/Inspector.js` — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181); [webgpu_ocean.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_ocean.html)

**Shader compilation**
- r180 has `renderer.compileAsync(scene, camera)`. In r184 it became "truly non-blocking" (#32984), alongside a "3.0x" node-compilation speed-up (#33120). r186 adds `compileComputeAsync()` and skips shadow-map rendering during precompile (#33924) — [r180 Renderer.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/Renderer.js); [release r184](https://github.com/mrdoob/three.js/releases/tag/r184); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)

**Asset compression**
- r180 ships decoders for Basis/KTX2 (`libs/basis`, `ktx-parse`, `zstddec`), Draco (`libs/draco`) and meshopt (`meshopt_decoder.module.js`). `webgpu_loader_texture_ktx2` and `webgpu_loader_gltf_compressed` exist for WebGPU — [r180 libs dir](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/libs); [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- Later: r181 deprecates `KTX2Loader.detectSupportAsync()`; r184 adds RGBA16 unorm in KTX2Loader; r185 adds all BPTC formats; Draco is moving to WASM-only — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide); [release r184](https://github.com/mrdoob/three.js/releases/tag/r184); [release r185](https://github.com/mrdoob/three.js/releases/tag/r185)

**Device setup (limits and features)**
- r180 WebGPUBackend:
  - requests **every optional feature the adapter has**, including `timestamp-query`, `shader-f16`, `subgroups`, `float32-filterable`, `float32-blendable`, `texture-compression-bc/etc2/astc`, `texture-formats-tier1/2`, `clip-distances` and `dual-source-blending`;
  - passes `requiredLimits` only as given (default `{}`);
  - also takes `compatibilityMode`, `powerPreference`, and a user-supplied `device`.
  - Source: [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js); [r180 WebGPUConstants.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/utils/WebGPUConstants.js)
- r186 always requests a `featureLevel: 'compatibility'` adapter and upgrades to core when `core-features-and-limits` is available (from r183, #32762). Limits still come only from `requiredLimits`. So the device still gets spec-default limits (e.g. 16 sampled textures per stage) unless the app asks for more — [r186 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPUBackend.js); [release r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- r186 pads any vertex attribute whose `itemSize × BYTES_PER_ELEMENT` is not a multiple of 4 ("arrayStride must be a multiple of 4"), e.g. Uint8 × 3 → 4 — [r186 WebGPUAttributeUtils.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/utils/WebGPUAttributeUtils.js). Whether r180 already did this is covered in section 7.

**Experimental GPU-driven geometry**
- `webgpu_compute_rasterizer` (r185) is a software rasteriser in TSL compute with LOD by geometric error and an atomic visibility buffer. It is an example, not an addon — [PR #33605](https://github.com/mrdoob/three.js/pull/33605); [webgpu_compute_rasterizer.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html)

**WebGPURenderer vs WebGLRenderer performance (2025–2026)**
- **Issue #30560** (opened Feb 2025, labelled High priority, **still open**) — [issue #30560](https://github.com/mrdoob/three.js/issues/30560):
  - Cause: every object gets its own UBO, so each frame issues many `setBindGroup` / `writeBuffer` calls (or `bindBufferBase` / `bufferData` on WebGL2).
  - Original report: r173, M1 Pro, 20k meshes, ~15 FPS on WebGPURenderer vs ~60 FPS on WebGLRenderer.
  - Mugen87 (Jan 2026): Chrome WebGL2 backend 12 vs 60 FPS; Firefox 28 vs 60; Pixel 8a 19 vs 57.
  - Contributor (Sep 2026), r186 on M4 Max: CPU submit 2.88 ms vs 2.20 ms (+31%), about 2,350 vs 1,300 GL calls per frame.
  - Planned fix (sunag): a shared buffer per group of similar objects, partly done.
- **Forum benchmark** (29 May 2026; r183, Chrome 148, RTX 4090 laptop; 4,000 meshes over 200 geometries) — [forum thread](https://discourse.threejs.org/t/webgpurenderer-2x-slower-cpu-and-5-10x-slower-first-frame-than-webglrenderer-on-many-mesh-scenes-r183-same-on-both-backends/91904):

  | Renderer | CPU per `render()` | First frame |
  |---|---|---|
  | WebGLRenderer | 4.5 ms | 32 ms |
  | WebGPURenderer, WebGPU backend | 9.7 ms | 167 ms |
  | WebGPURenderer, `forceWebGL` | 10.3 ms | 344 ms |

  A forum regular advised staying on WebGLRenderer unless WebGPU-only features are needed.
- **Init cost, issue #33821** (opened Jun 2026 by gkjohnson, **still open**), about 10k meshes — [issue #33821](https://github.com/mrdoob/three.js/issues/33821):
  - one material per mesh: ~2,100 ms vs ~131 ms (16×);
  - one shared material: ~1,029 ms vs ~28 ms (36×);
  - `device.queue.submit()` takes about 70% (one submit per call, which greggman called an anti-pattern);
  - a uniform-system refactor and immediates (#33576) are planned.
- **donmccurdy** (Sep 2025): "I would not expect performance improvement simply by swapping WebGPURenderer in for WebGLRenderer today", and "the cost of sending 10,000 draw calls … is significant regardless of the API". He recommends BatchedMesh, instancing or merged geometry. A user measured about 30% less memory at similar FPS — [forum](https://discourse.threejs.org/t/understanding-about-webgpurenderer/86635). Mugen87 traced the early gap to uniform management — [forum, Feb 2025](https://discourse.threejs.org/t/why-webgpurenderer-performance-significantly-lower-than-webglrenderer/77629)
- **Optimisations since r180** — [releases](https://github.com/mrdoob/three.js/releases):
  - r182: bind-group-layout cache, O(1) WebGL program lookup.
  - r183: shared BindGroup via hash (#32936), `Object3D.static` documented (#32679).
  - r184: non-blocking `compileAsync` (#32984); TSL compile 3.0× faster (MaterialX example 1,550 → 515 ms) — [PR #33120](https://github.com/mrdoob/three.js/pull/33120).
  - r185: UBO updates without GC churn; InstancedMesh in render bundles.
  - r186: no shadow-map render during precompile; `compileComputeAsync`.
  - r187-dev: node/WGSL slimming (mrdoob's 3 lights + shadows + env case: 10,656 → 5,688 nodes, JS build 48 → 36 ms, GPU compile 404 → 333 ms) — [issue #34386](https://github.com/mrdoob/three.js/issues/34386).

### Inferences
- **Feasible on WebGPU with r180 primitives (custom TSL work):**
  - GPU particle simulation;
  - GPU frustum or Hi-Z culling that writes indirect args;
  - GPU sorting;
  - froxel/clustered light binning;
  - FFT ocean.
  - Multi-draw-indirect and bindless are not available, so "one draw per material batch" remains the practical floor.
- **On the WebGL2 backend, compute is restricted** (no scatter writes or atomics through transform feedback). GPU-driven techniques need a WebGPU-only path or a CPU fallback.
- **For BatchedMesh-heavy scenes** (dungeon kits), WebGL's `WEBGL_multi_draw` path may have lower CPU cost than WebGPU's per-sub-draw loop. Measure in the lab.
- **Draw-call budget:** a Diablo-like with many props and monsters should treat WebGPURenderer as having a *higher per-draw CPU cost* through r186–r187, so instancing, BatchedMesh, BundleGroup for static dungeon geometry and merged meshes are mandatory. The slow first frames match the project's own note that boot frames are slow.

### Gaps
- No official benchmark of BatchedMesh on WebGPU vs WebGL in three.js.
- No official three.js benchmark suite comparing r186 directly with r180, and no measured gains for BundleGroup / render bundles. No Safari 26 or Firefox WebGPU-specific data beyond the numbers in #30560 and #33821.
- I did not verify whether the TSL subgroup functions are used by any built-in addon, or how they behave when `subgroups` is absent.

## 5. Hard web-platform limits relevant to AAA techniques, and browser support in 2026

### Takeaway
The web has **no hardware ray tracing, no mesh shaders, no bindless and no standard multi-draw-indirect** in 2026. These are proposals or flag-gated experiments at best.
- **WebGL2:** no compute (beyond transform feedback), no storage buffers, no indirect draws.
- **WebGPU spec-default limits are low:** 16 sampled textures and 16 samplers per stage, 8 storage buffers, 4 storage textures, 8 colour attachments at 32 B/sample, 3-byte vertex formats unsupported. Most adapters report far more, but three.js (r180 and r186) requests only spec defaults unless `requiredLimits` is passed.
- **Browser support:** WebGPU is on by default in Chrome/Edge (Windows, macOS, ChromeOS, Android 12+, and Linux for some GPUs since Chrome 144) and Safari 26. Firefox has it on Windows (141+) and Apple Silicon macOS (145/147+) only. caniuse puts global support at about 88%.

### Cited Findings
**WebGPU default limits (spec)**
- Defaults: maxTextureDimension2D 8192, maxTextureDimension3D 2048, maxTextureArrayLayers 256, maxBindGroups 4, maxBindGroupsPlusVertexBuffers 24, maxBindingsPerBindGroup 1000, maxDynamicUniformBuffersPerPipelineLayout 8, maxDynamicStorageBuffersPerPipelineLayout 4 — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- Per-stage: maxSampledTexturesPerShaderStage **16**, maxSamplersPerShaderStage **16**, maxStorageBuffersPerShaderStage 8, maxStorageTexturesPerShaderStage 4, maxUniformBuffersPerShaderStage 12. Newer per-stage splits: maxStorageBuffersInVertexStage / InFragmentStage 8; maxStorageTexturesInVertex / FragmentStage 4 — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- Buffers, vertices, attachments: maxUniformBufferBindingSize 65,536 B; maxStorageBufferBindingSize 128 MiB; maxBufferSize 256 MiB; uniform/storage offset alignment 256 B; maxVertexBuffers 8; maxVertexAttributes 16; maxVertexBufferArrayStride 2048; maxInterStageShaderVariables 16; maxColorAttachments 8; maxColorAttachmentBytesPerSample 32 — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- Compute: maxComputeWorkgroupStorageSize 16,384 B; maxComputeInvocationsPerWorkgroup 256; workgroup size X/Y/Z 256/256/64; maxComputeWorkgroupsPerDimension 65,535; maxImmediateSize 64 (push-constant-style data) — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- The compatibility feature level has lower defaults (e.g. maxTextureDimension2D 4096, maxColorAttachments 4, maxUniformBufferBindingSize 16,384, 0 storage buffers in the vertex stage, maxComputeInvocationsPerWorkgroup 128). The column mapping came through a fetch tool, so treat it as slightly uncertain. `featureLevel: "core"` (default) includes `core-features-and-limits` — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- Real adapters exceed the defaults widely (web3dsurvey; no date or sample size given) — [web3dsurvey WebGPU](https://web3dsurvey.com/webgpu):
  - maxSampledTexturesPerShaderStage: 100% ≥16, 91% ≥44, 78% ≥48, 5% ≥64.
  - maxStorageBuffersPerShaderStage: 80% ≥16.
  - maxColorAttachments: 100% ≥8.
  - maxComputeWorkgroupStorageSize: 99% ≥32,767 B.
  - maxBufferSize: 79% ≥2 GiB.
- three.js r180 requests all supported features but only `parameters.requiredLimits` (default `{}`) for limits. JSDoc: "The request will fail if the adapter cannot provide these limits". r186 behaves the same — [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js); [r186 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/WebGPUBackend.js)

**Vertex formats**
- No 3-component 8- or 16-bit vertex formats exist; 8/16-bit formats come only as x2 or x4 (wgpu's mirror of GPUVertexFormat lists Uint8x2 and Uint8x4, no x3) — [wgpu-types VertexFormat](https://docs.rs/wgpu-types/29.0.4/wgpu_types/enum.VertexFormat.html)
- The vertex-buffer arrayStride must be a multiple of 4 (a Metal requirement enforced by Dawn: "Vertex buffer arrayStride (3) is not a multiple of 4") — [Dawn commit](https://dawn.googlesource.com/dawn/+/b58435c6f9d5a27375c13faf99718b2be5285eb2); [Babylon forum](https://forum.babylonjs.com/t/there-is-a-webgpu-sample-that-doesnt-work-with-babylon-js-6-0/40035)
- Chrome 133 (Jan 2025) added `unorm8x4-bgra` and 1-component formats (uint8, sint8, unorm8, snorm8, uint16, sint16, unorm16, snorm16, float16) — [Chrome 133](https://developer.chrome.com/blog/new-in-webgpu-133). `snorm10-10-10-2` came in Chrome 155–156 (unorm10-10-10-2 earlier, in 119) — [Chrome 155-156](https://developer.chrome.com/blog/new-in-webgpu-155-156)

**Optional features and their availability**
- Spec feature names: core-features-and-limits, depth-clip-control, depth32float-stencil8, texture-compression-bc (+sliced-3d), -etc2, -astc (+sliced-3d), timestamp-query, indirect-first-instance, shader-f16, rg11b10ufloat-renderable, bgra8unorm-storage, float32-filterable, float32-blendable, clip-distances, dual-source-blending, subgroups, subgroup-size-control, texture-formats-tier1/2, primitive-index, texture-component-swizzle, texture-compression-unaligned, atomic-vec2u-min-max — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- Share of reports with each feature — [web3dsurvey WebGPU](https://web3dsurvey.com/webgpu):
  - Near-universal: indirect-first-instance, rg11b10ufloat-renderable, depth32float-stencil8 99.98%; timestamp-query 98.58%.
  - Common: shader-f16 93.84%; texture-formats-tier1 93.27%; float32-filterable 92.13%; float32-blendable 90.46%; texture-compression-bc 88.11%.
  - Less common: tier2 83.85%; primitive-index 83.81%; dual-source-blending 83.17%; clip-distances 80.8%; subgroups 69.57%.
  - Mostly mobile and Apple: etc2 45.32%; astc 45.11%.
- Chrome shipping: float32-filterable (119), shader-f16 (120), timestamp queries in passes (121), HDR canvas tone mapping (129), dual-source blending (130), clip distances (131), float32 blending (132), subgroups (134), texture-formats tiers + primitive-index (142), texture component swizzle (143), subgroup size control (151–152) — [WebGPU news index](https://developer.chrome.com/docs/web-platform/webgpu/news); [Chrome 134](https://developer.chrome.com/blog/new-in-webgpu-134); [Chrome 142](https://developer.chrome.com/blog/new-in-webgpu-142)
- Timestamp queries are quantised to 100 µs unless a dev flag is set — [Chrome 121](https://developer.chrome.com/blog/new-in-webgpu-121)
- Compressed formats are gated per family (BC, ETC2/EAC, ASTC); using a format without its feature throws — [WebGPU spec](https://gpuweb.github.io/gpuweb/)
- Transient attachments (Chrome 146) keep pass-local targets in tile memory — [Chrome 146](https://developer.chrome.com/blog/new-in-webgpu-146). three.js added `TRANSIENT_ATTACHMENT` support in r186 — [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- Immediates (push-constant-like `setImmediates()`, `var<immediate>`) appeared in Chrome 149–150 (Jun 2026); default enablement is unconfirmed — [Chrome 149-150](https://developer.chrome.com/blog/new-in-webgpu-149-150)
- Compatibility mode: opt-in via `featureLevel` (Chrome 133), an origin trial (139), and OpenGL ES 3.1 on Android (Chrome 146, Feb 2026) — [Chrome 146](https://developer.chrome.com/blog/new-in-webgpu-146); [WebGPU news index](https://developer.chrome.com/docs/web-platform/webgpu/news)
- WGSL extensions recently added in Chrome: subgroup_id, uniform_buffer_standard_layout (144); subgroup_uniformity (145); texture_and_sampler_let (146, "prepares for bindless"); linear_indexing (147–148); buffer_view, swizzle_assignment (153–154); fragment_depth (155–156, "temporarily disabled on all platforms") — [WebGPU news index](https://developer.chrome.com/docs/web-platform/webgpu/news); [Chrome 155-156](https://developer.chrome.com/blog/new-in-webgpu-155-156)

**Missing features and proposals**
- **Bindless**: not shipped. Chrome called it "a prerequisite for most leading-edge rendering algorithms" (Nov 2024 roadmap, alongside multi-draw indirect and 64-bit atomics). Design notes remain informal — [What's next for WebGPU](https://developer.chrome.com/blog/next-for-webgpu); [HackMD bindless proposal](https://hackmd.io/PCwnjLyVSqmLfTRSqH0viA)
- **Multi-draw indirect**: only `chromium-experimental-multi-draw-indirect` behind `chrome://flags/#enable-unsafe-webgpu` (Chrome 131) — [Chrome 131](https://developer.chrome.com/blog/new-in-webgpu-131)
- **64-bit atomics**: a roadmap item. `atomic-vec2u-min-max` is in the spec feature list; Dawn implements min/max only, storage memory only, no return value (Metal Apple8+/M2-class, Vulkan, DX12) — [WebGPU spec](https://gpuweb.github.io/gpuweb/); [Dawn Metal commit](https://dawn.googlesource.com/dawn/+/b620b2fe514a5ee2e6a2d924fd998c514019da87)
- **Mesh shaders**: gpuweb #3015 (2022) was deferred to post-V1. Native wgpu v28 has them, but they don't reach browsers — [gpuweb #3015](https://github.com/gpuweb/gpuweb/issues/3015); [wgpu v28 notes](https://newreleases.io/project/github/gfx-rs/wgpu/release/v28.0.0)
- **Hardware ray tracing**: only a 2018 "possible in the future" WG discussion; not on the 2024 roadmap. Compute-only RT exists (e.g. WebRTX) — [public-gpu 2018](https://lists.w3.org/Archives/Public/public-gpu/2018Dec/0003.html); [WebRTX](https://github.com/codedhead/webrtx)

**WebGL2 limits**
- No compute: Khronos halted WebGL 2.0 Compute and points to WebGPU — [Khronos WebGL 2.0 Compute](https://registry.khronos.org/webgl/specs/latest/2.0-compute/)
- Availability: 98.05% of reports. MAX_TEXTURE_IMAGE_UNITS (fragment) is 100% ≥16 but only 13% ≥24. MAX_COMBINED_TEXTURE_IMAGE_UNITS 100% ≥32. MAX_DRAW_BUFFERS 100% ≥4, 97% ≥7. MAX_SAMPLES 100% ≥4, 65% ≥8. MAX_UNIFORM_BLOCK_SIZE 100% ≥16 KB — [web3dsurvey WebGL2](https://web3dsurvey.com/webgl2)
- Extensions — [web3dsurvey WebGL2](https://web3dsurvey.com/webgl2):
  - Widely available: EXT_color_buffer_float 99.96%; EXT_float_blend 94.01%; WEBGL_multi_draw 92.95%; OES_texture_float_linear 90.99%; EXT_depth_clamp 90.97%; EXT_clip_control 88.53%; S3TC 86.56%; BPTC 84.37%; WEBGL_clip_cull_distance 82.2%.
  - Partial: KHR_parallel_shader_compile 77.58%; EXT_disjoint_timer_query_webgl2 66.55%; OVR_multiview2 56.51%; ETC 47.61%; ASTC 47.05%.
  - Effectively absent: base_vertex_base_instance multi-draw at 0.19%.
- MDN: be conservative with limits; S3TC (desktop) + ETC (mobile) covers WebGL2, and Basis can serve one file for all; RGBA32F rendering can fail on mobile; use KHR_parallel_shader_compile for non-blocking compiles — [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

**Browser support (2026)**
- caniuse WebGPU: 85.8% full + 2.02% partial = 87.82% global. web3dsurvey: 83.34% of reports got a working adapter — [caniuse WebGPU](https://caniuse.com/webgpu); [web3dsurvey WebGPU](https://web3dsurvey.com/webgpu)
- Chrome/Edge: 113+ on Windows/macOS/ChromeOS — [MDN BCD GPU.json](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/GPU.json); Android since 121 (Android 12+, Qualcomm/ARM) — [Chrome 121](https://developer.chrome.com/blog/new-in-webgpu-121); Linux since 144 (Jan 2026; Intel Gen12+ on Vulkan) — [Chrome 144](https://developer.chrome.com/blog/new-in-webgpu-144); NVIDIA on Wayland in 147–148 — [Chrome 147-148](https://developer.chrome.com/blog/new-in-webgpu-147-148). The latest WebGPU news post covers Chrome 155–156 (updated 2026-10-15) — [Chrome 155-156](https://developer.chrome.com/blog/new-in-webgpu-155-156)
- Safari 26: WebGPU on macOS, iOS, iPadOS and visionOS. WebKit says WebGPU "supersedes WebGL" there and names three.js as working well — [WebKit Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/). **Conflict**: caniuse marks Safari 26 on macOS as partial ("only enabled by default on macOS 26 Tahoe or later"), while MDN BCD says full — [caniuse JSON](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgpu.json); [MDN BCD](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/GPU.json)
- Firefox: Windows since 141. Apple Silicon on macOS Tahoe since 145, older macOS since 147 (Jan 13, 2026). Not on Intel Macs, Linux or Android — [MDN BCD](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/GPU.json); [Firefox 147 notes](https://www.firefox.com/firefox/147.0/releasenotes/). **Conflict**: caniuse note 8 still says "Windows as well as macOS 26 Tahoe or later on Apple Silicon" — [caniuse JSON](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgpu.json)

**HDR output**
- Chrome 129: `context.configure({ toneMapping: { mode: "extended" } })` with an rgba16float canvas — [Chrome 129](https://developer.chrome.com/blog/new-in-webgpu-129). Chrome 155–156: `srgb-linear` / `display-p3-linear` canvas colour spaces — [Chrome 155-156](https://developer.chrome.com/blog/new-in-webgpu-155-156)
- Safari: toneMapping.mode is marked fixed in WebKit, but a tester reports macOS accepts the setting without displaying HDR (iOS works); unresolved — [WebKit bug 272702](https://bugs.webkit.org/show_bug.cgi?id=272702)

### Inferences
- **The "16 per stage" problem is two different limits:**
  - **Sampled textures:** a spec default (16) that three.js doesn't raise, while about 91% of adapters report ≥44. This one *can* be raised with `new WebGPURenderer({ requiredLimits: { maxSampledTexturesPerShaderStage: N } })` after reading `adapter.limits` (or by passing your own `device`); otherwise device creation fails.
  - **Samplers:** `maxSamplersPerShaderStage` is often *reported* as only 16 by the adapter itself. The project saw "number of samplers (17) … exceeds 16" on NVIDIA/Chrome/D3D12, where the adapter offered 48 sampled textures but 16 samplers. A maintainer said "three.js can not change the limits/capabilities the browser reports" — [issue #33190](https://github.com/mrdoob/three.js/issues/33190) (see section 7). I found no web3dsurvey distribution for maxSamplersPerShaderStage.
  - **WebGL2:** a near-identical real cap (only 13% of devices exceed 16 fragment texture units).
  - **Portable fixes:** fewer samplers per shader (texture arrays/atlases, `shadowMap.transmitted = false` in r183+, fewer shadowed lights per material).
- **GPU-driven pipelines:** Nanite-style clustered/visibility-buffer rendering, GPU-driven multi-draw and bindless materials need compute workarounds (one indirect draw per batch, texture arrays). 64-bit atomics exist only where `atomic-vec2u-min-max` is exposed.
- **RT effects** (reflections, GI, shadows) can only be compute/BVH-based. **WebGL2** cannot run compute-heavy techniques (GPU culling, froxels, FFT ocean) except with fragment ping-pong.
- **Practical late-2026 target:** Chrome/Edge desktop + Safari 26. Firefox Linux/Android and Intel-Mac users fall back to WebGL2.

### Gaps
- Default enablement in stable Chrome (Oct 2026) of Immediates, atomic-vec2u-min-max and multi-draw-indirect is unconfirmed. No 2026 status was found for the bindless proposal.
- Safari 26 and Firefox optional-feature sets and adapter limits are unknown (web3dsurvey isn't broken down by browser).
- Firefox HDR canvas support is unknown.
- No single page explicitly states "WebGL2 has no SSBO/indirect draw"; this follows from WebGL2 = OpenGL ES 3.0 plus the abandoned compute spec.

## 6. Ecosystem libraries and web ports of AAA techniques (maintenance + WebGPU status)

### Takeaway
Most mature three.js post-FX and lighting libraries are still **WebGL-only**: pmndrs/postprocessing (v6 and the v7 beta), N8AO 2.x, realism-effects (abandoned), three-good-godrays, three-custom-shader-material and Spark. three.quarks's shipped bundle is also GLSL-only. In 2025–2026 some moved to WebGPU/TSL:
- three-gpu-pathtracer: `WebGPUPathTracer` in v0.0.25, needs r185+; WebGL path tracer deprecated;
- @takram/three-atmosphere: WIP `/webgpu` entry, r182+;
- three-nebula 13.x: `/webgpu` batched renderer;
- three-mesh-bvh: WebGPU compute examples;
- three-virtual-geometry: Nanite-style, WebGPU, Oct 2026, days old.

Radiance cascades, FFT ocean, virtual texturing and GPU-driven culling exist only as demos or one-person projects.

### Cited Findings
**pmndrs/postprocessing**
- Stable 6.39.5 (2026-09-09) has peer `three >= 0.168.0 < 0.187.0`. v7 is still pre-release (7.0.0-beta.16, 2026-02-19) — [npm registry](https://registry.npmjs.org/postprocessing)
- v7.0.0-beta.16 "Requires three ≥ 0.179.0 < 0.184.0", so the beta lags current three. No WebGPU statement in any release — [GitHub releases](https://github.com/pmndrs/postprocessing/releases)
- The README has no WebGPU/TSL mention. Effects: AA, bloom, blur, LUT grading, DoF, chromatic aberration/noise, god rays, pixelation, outline, shock wave, SSAO, tone mapping. No TAA, SSR, SSGI or motion blur — [README](https://github.com/pmndrs/postprocessing)
- Repo active (last push 2026-10-05) — [GitHub API](https://api.github.com/repos/pmndrs/postprocessing)

**N8AO**
- 2.0.0 (2026-07-12, "Release N8AO 2.0.0 with neural denoising") and 2.0.1 (2026-08-10). Peers: postprocessing ≥6.30.0, three ≥0.137 — [npm](https://registry.npmjs.org/n8ao); [commits](https://github.com/N8python/n8ao/commits/master)
- The README says "N8AO is not yet compatible with WebGPU" — [README](https://github.com/N8python/n8ao):
  - Runs as `N8AOPass` (EffectComposer) or `N8AOPostPass` (pmndrs).
  - Half-res mode is about 2–4× faster but loses detail.
  - Changing quality recompiles shaders.
  - Transparent objects are rendered twice.
  - Accumulation does not use motion vectors.
  - Off-screen occluders are missed.

**realism-effects (0beqz: SSGI, SSR, TRAA, motion blur, AO)**
- Last npm release 1.1.2 (2023-05-12), peers postprocessing ≥6.30.1 and three ≥0.148 — [npm](https://registry.npmjs.org/realism-effects). Last push 2024-02-04 — [GitHub API](https://api.github.com/repos/0beqz/realism-effects)
- README: a "new version of SSGI… currently in the works" on a WIP branch. **Only PerspectiveCamera is supported; OrthographicCamera is not.** No WebGPU — [README](https://github.com/0beqz/realism-effects)

**@takram/three-atmosphere and @takram/three-clouds**
- three-atmosphere 0.19.1 (2026-05-06) exports `./webgpu`; the WebGL build has peers postprocessing ≥6.36.7 and three ≥0.170 — [npm](https://registry.npmjs.org/@takram%2Fthree-atmosphere). three-clouds 0.7.6 (2026-05-06) has **no** `/webgpu` export — [npm](https://registry.npmjs.org/@takram%2Fthree-clouds)
- Repo status: atmosphere WebGPU "Done", clouds "Work in progress". "The new API will be incompatible with the current one", and WebGPU "already performs much better" — [README](https://github.com/takram-design-engineering/three-geospatial)
- WebGPU doc ("Work-in-progress WebGPU support", three ≥0.182) — [WEBGPU.md](https://github.com/takram-design-engineering/three-geospatial/blob/main/packages/atmosphere/WEBGPU.md):
  - Nodes: `AtmosphereContext` (via `renderer.contextNode`), `AtmosphereLight` (via `renderer.library.addLight`), `aerialPerspective`, `sky`/`skyBackground`, `skyEnvironment` (PMREM), `shadowLength` (light shafts), `AtmosphereLUTNode`.
  - Model: Bruneton plus Hillaire's multiple-scattering LUT; pipeline is three's `RenderPipeline`.
  - Caveat: the STBN noise needs temporal AA.
- **Conflict**: the package README still says WebGPU is "not supported, but… planned" (likely stale) — [atmosphere README](https://github.com/takram-design-engineering/three-geospatial/tree/main/packages/atmosphere)

**three-gpu-pathtracer**
- v0.0.25 (2026-09-28) added `WebGPUPathTracer` (`three-gpu-pathtracer/webgpu`), requires three r185, and "Deprecated WebGLPathTracer". v0.0.27 (2026-10-08) added SunLight support. v0.0.24 (2026-02-21) is the last WebGL-centred release (r180+) — [releases](https://github.com/gkjohnson/three-gpu-pathtracer/releases); [npm](https://registry.npmjs.org/three-gpu-pathtracer)
- README: "The project requires WebGPU". Only MeshStandard/Physical materials; progressive (`renderSample()` per frame) — [README](https://github.com/gkjohnson/three-gpu-pathtracer)
- three.js `dev` now ships the `webgpu_renderer_pathtracer` example built on it — [webgpu_renderer_pathtracer.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_renderer_pathtracer.html)

**three-mesh-bvh**
- 0.9.16 (2026-10-08), peer three ≥0.159, last push 2026-10-18 — [npm](https://registry.npmjs.org/three-mesh-bvh); [GitHub API](https://api.github.com/repos/gkjohnson/three-mesh-bvh)
- Features: raycast/shapecast acceleration, Points/Line BVH, SkinnedMeshBVH, ObjectBVH, worker builds, refit, BVH queries in GLSL. A "WebGPU Compute Shaders" section covers `webgpu_gpuPathTracingSimple.html`, `webgpu_sdfGeneration.html` and `WEBGPU_API.md` — [README](https://github.com/gkjohnson/three-mesh-bvh)

**three.quarks (project uses 0.16.0)**
- Latest 0.17.1 (2026-05-21), peer three ≥0.182. 0.17.0 came out 2026-02-04. 0.16.0 (2025-03-29) has peer three ≥0.165 — [npm](https://registry.npmjs.org/three.quarks); [0.16.0](https://registry.npmjs.org/three.quarks/0.16.0)
- 0.17.0 changelog: new `quarks.r3f` package, "Added WebGPU shader support", three 0.165 → 0.182 — [CHANGELOG](https://raw.githubusercontent.com/Alchemist0823/three.quarks/master/CHANGELOG.md)
- **Conflict**: the README roadmap leaves "WebGPU rendering support" unchecked. `quarks.nodes` (experimental WebGPU compute) has not been published since 0.15.2 (2024-07-28) — [README](https://github.com/Alchemist0823/three.quarks); [npm quarks.nodes](https://registry.npmjs.org/quarks.nodes)
- The shipped 0.17.1 and 0.16.0 ESM bundles use `ShaderMaterial` + `onBeforeCompile`. Grep finds zero matches for `WebGPURenderer`, `three/webgpu`, `three/tsl`, `NodeMaterial` or WGSL — [unpkg bundle](https://unpkg.com/three.quarks@0.17.1/dist/three.quarks.esm.js)

**three-nebula**
- Revived: 12.1.0 (2026-08-09), 13.0.0 (2026-08-22), 13.3.0 (2026-09-19). Exports `.` and `./webgpu` — [npm](https://registry.npmjs.org/three-nebula)
- "Optional WebGPU rendering via a batched `GPURenderer`" (instanced quads in one draw, texture atlas), using `three/webgpu` + `three/tsl`, "Built and tested against `three@0.185.1`"; seeded determinism — [README](https://github.com/creativelifeform/three-nebula)

**glTF-Transform and meshoptimizer**
- `@gltf-transform/core` 4.5.1 (2026-09-28) — [npm](https://registry.npmjs.org/@gltf-transform%2Fcore). It offers an `optimize` CLI, Draco, Meshopt, WebP, KTX2/Basis (uastc/etc1s), resize, prune, dedup, resample. Runs in Node and browsers (sharp/WebP is Node-only) — [README](https://github.com/donmccurdy/glTF-Transform)
- meshoptimizer 1.0.0 (2025-12-08); latest 1.3.0 (2026-09-25) — [npm](https://registry.npmjs.org/meshoptimizer)
- JS/WASM modules — [js README](https://github.com/zeux/meshoptimizer/tree/master/js):
  - `MeshoptDecoder`: "1-3 GB/s" with SIMD.
  - `MeshoptSimplifier`: `simplify`, `simplifyWithAttributes`, `simplifySloppy`, `simplifyPrune`, `simplifyPoints`.
  - `MeshoptClusterizer`: `buildMeshlets` (≤256 verts / 512 tris), `buildMeshletsFlex`, `buildMeshletsSpatial`, `computeMeshletBounds` (sphere + normal cone).
  - `MeshoptTangents`.
- three.js's own `SimplifyModifier` became meshoptimizer-based and async in r186 — [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

**three-custom-shader-material**
- 6.4.0 (2025-10-12), peer three ≥0.159 — [npm](https://registry.npmjs.org/three-custom-shader-material). The README has no WebGPU/TSL mention; it injects GLSL (`csm_*` outputs, `patchMap`) — [README](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)

**Gaussian splats**
- Spark 2.3.1 (2026-10-01), peer three ≥0.180 — [npm](https://registry.npmjs.org/@sparkjsdev%2Fspark). 2.0.0 (2026-04-14) added an LOD system and 2.3.0 on-demand rendering; no WebGPU in any release — [releases](https://github.com/sparkjsdev/spark/releases)
- The Spark README says it is "targeting 98%+ WebGL2 support" with WebGLRenderer, and reads PLY/SPZ/SPLAT/KSPLAT/SOG — [README](https://github.com/sparkjsdev/spark)
- mkkellogg/GaussianSplats3D is "no longer in active development… I recommend checking out Spark" — [README](https://github.com/mkkellogg/GaussianSplats3D)
- Built-in alternative: three.js r186 `GaussianSplat` (WebGPURenderer only; raycast and frustum culling) — [r186 GaussianSplat.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/objects/GaussianSplat.js); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)

**Radiance cascades**
- CodyJasonBennett/three-rc does 3D radiance cascades with screen-space probes + three-mesh-bvh. It claims "noise-free diffuse and specular global illumination without any temporal accumulation"; the screen-space fallback misses off-screen emitters. WebGL only, **no license ("All rights reserved")**, known bugs — [README](https://github.com/CodyJasonBennett/three-rc)
- `@typegpu/radiance-cascades` 0.12.2 (2026-10-16) is a 2D runner for TypeGPU, not three.js — [npm](https://registry.npmjs.org/@typegpu%2Fradiance-cascades)
- A July 2026 "Split Radiance Cascades" paper was seen only as a search snippet — [alphaXiv](https://www.alphaxiv.org/abs/2607.20384)

**Nanite-style virtual geometry and GPU-driven culling**
- Scthe/nanite-webgpu — [README](https://github.com/Scthe/nanite-webgpu):
  - Raw WebGPU/WGSL, not three.js. Meshlet DAG built in-browser with WASM meshoptimizer + METIS; frustum + previous-frame Hi-Z occlusion culling per instance and per meshlet.
  - Software raster packs depth and normal into 32 bits because there is no `atomic<u64>`; "Nearly 98% of the triangles are software rasterized".
  - No visibility buffer, no two-pass occlusion culling, no streaming. The author claims "WebGPU does not have early-z". Chrome's 128 MB storage-buffer limit applies.
  - The author is "moving on", so it is a reference only.
- three-virtual-geometry 0.1.3 (published 2026-10-08 to 10-10; peer three ≥0.180; meshoptimizer ^1.3.0) — [npm](https://registry.npmjs.org/three-virtual-geometry); [README](https://unpkg.com/three-virtual-geometry@0.1.3/README.md):
  - 128-triangle clusters in a crack-free hierarchy. "Frustum, size and occlusion culling and level selection run in compute shaders"; "One draw call per mesh, millions of instances".
  - Needs WebGPURenderer. "Node materials, lights, shadows, fog and tone mapping work unchanged".
  - Static meshes only, one UV channel, no software raster. "Occlusion culling needs a perspective camera with standard depth; it turns itself off otherwise".
  - Author's benchmark: M4 Pro / Chrome 154, 5.7B triangles at 160–230 FPS (1080p), "at most 0.6 ms of CPU time per frame".
- @three.ez/instanced-mesh (InstancedMesh2) 0.3.16 (2026-07-26) does CPU per-instance frustum culling with a dynamic BVH, LOD, shadow LOD and sorting. No WebGPU mention — [npm](https://registry.npmjs.org/@three.ez%2Finstanced-mesh); [README](https://unpkg.com/@three.ez/instanced-mesh@0.3.16/README.md)
- Seen in search snippets only: gfxlite (drawIndexedIndirect + compute frustum culling) and the Shade WebGPU engine — [gfxlite](https://github.com/somepablo/gfxlite); [Shade thread](https://discourse.threejs.org/t/shade-webgpu-graphics/66969)
- In-core reference: three.js `webgpu_compute_rasterizer` example (r185) — [PR #33605](https://github.com/mrdoob/three.js/pull/33605)

**Virtual texturing**
- Usnul's 2023 WebGL virtual-texture demos on three.js (8k–32k maps, 2048² physical texture, 128² tiles with 4 px borders). No source released — [three.js forum](https://discourse.threejs.org/t/virtual-textures/53353)
- A 2012 thesis prototyped WebGL virtual texturing — [Chalmers PDF](https://www.cse.chalmers.se/~uffe/xjobb/Virtual_Texturing_with_WebGL.pdf). gpuweb sparse-texture request (status unverified) — [gpuweb #455](https://github.com/gpuweb/gpuweb/issues/455)

**FFT ocean**
- Spiri0's three.js WebGPU IFFT ocean: JONSWAP + IFFT. In March 2025 it moved the IFFT to storage buffers with 3×512 cascades. Targets three r174, MIT, 142 stars — [GitHub](https://github.com/Spiri0/Threejs-WebGPU-IFFT-Ocean-V2)
- A forum post says IFFT oceans are practical only with WebGPU compute (snippet only) — [three.js forum](https://discourse.threejs.org/t/good-progress-in-developing-a-real-ocean/55834)

**Other**
- three-good-godrays 0.12.1 (2026-08-06): raymarches the shadow map for point/directional lights, on pmndrs postprocessing. Tested with three ">= 0.125.0 <= 0.182.0". No WebGPU. three.js r183's GodraysNode is a TSL port of it — [README](https://github.com/Ameobea/three-good-godrays); [r186 GodraysNode.js](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/display/GodraysNode.js)
- tsl-textures 3.0.5 (2026-09-09) is "A collection of Three.js Shading Language (TSL) textures" — [npm](https://registry.npmjs.org/tsl-textures)

### Inferences
- **The WebGPU/TSL backend gets almost nothing from the third-party post-FX ecosystem.** AO, SSR, SSGI, TRAA and godrays must come from three's own TSL nodes (section 2) or custom TSL. The WebGL backend can use pmndrs v6, N8AO and three-good-godrays. realism-effects is effectively abandoned and has no orthographic support.
- **three.quarks** almost certainly cannot render in WebGPURenderer as shipped (it uses GLSL ShaderMaterial and onBeforeCompile). This is an inference from the bundle grep. Upgrading to 0.17 also forces three ≥ r182. three-nebula 13.x is the only maintained particle library found with a TSL renderer. three's own compute-particle examples are the other route.
- **Orthographic camera:** three-virtual-geometry disables occlusion culling and realism-effects does not work.
- **Asset pipeline:** glTF-Transform + meshoptimizer 1.x is the strongest maintained option (meshopt/Draco, KTX2, simplification, meshlets).

### Gaps
- No official pmndrs WebGPU roadmap statement; N8AO 2.0 notes beyond neural denoising are missing; nobody verified realism-effects on r180.
- What three.quarks 0.17's "WebGPU shader support" means is unclear.
- No independent benchmarks for three-virtual-geometry; Spark has no WebGPU roadmap.
- GitHub API rate limits blocked last-commit checks for several repos, so npm publish dates stand in for activity.

## 7. Known three.js WebGPU pitfalls (project issues 1–5): documented / fixed upstream?

### Takeaway
Four of the five are documented upstream and fixed or mitigated after r180:
- **(1) Sampler overflow:** mitigated in r183 by `shadowMap.transmitted = false` (default), which saves 1 texture + 1 sampler per shadow light. The browser-reported 16-sampler cap itself cannot be lifted by three.js.
- **(2) Uint8×3 vertex attribute:** fixed in r185 by automatic 4-byte stride padding.
- **(3) Frame loop dying:** the WebGL loop no longer dies on an uncaught error from r186. Calling `shadowMap.render()` outside `render()` is still unsupported (open since 2022), and WebGPURenderer has no such method.
- **(5) Runtime `shadow.mapSize` change:** fixed in r186 (#34360). A closely related "Destroyed texture ShadowDepthTexture" bug is still open as of 18–19 Oct 2026 (#35085, PR #35088).
- **(4) Dark PMREM at load:** no matching upstream issue found. The r187-dev PMREM rewrite may change the behaviour.

### Cited Findings
**(1) Extra shadow map pushes a shader past 16 per stage**
- **Project symptom:** CreateBindGroupLayout fails with "number of samplers (17) … exceeds 16". The adapter (NVIDIA Lovelace, Chrome/D3D12) offers 48 sampled textures but 16 samplers, so raising `requiredLimits` did not help. WebGL2 handled the extra shadow — project memory note `C:\Users\HLC_2021\.claude\projects\E--Diablo2\memory\lab-webgpu-sampler-limit.md` (local file, no URL)
- r180 already accepts `requiredLimits` (passed to `adapter.requestDevice()`; "The request will fail if the adapter cannot provide these limits") and `compatibilityMode` — [r180 WebGPUBackend.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js)
- **Root cause in r180:** ShadowNode always samples two textures per shadow light, the depth texture through a compare sampler plus `shadowMap.texture` (`let shadowColor = texture( shadowMap.texture, shadowCoord )`). That is 2 textures and 2 samplers per light — [r180 ShadowNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/lighting/ShadowNode.js)
- **Maintainer confirmation:** Mugen87 confirmed WebGPURenderer uses two textures per shadow light, so it fits fewer lights than WebGLRenderer, and said "colored shadows should be optional". A test showed 31 sampled textures where 15 were expected — [issue #32588](https://github.com/mrdoob/three.js/issues/32588)
- **Fix (r183):** `renderer.shadowMap.color` was added with default `false` (merged 2025-12-22) — [PR #32596](https://github.com/mrdoob/three.js/pull/32596). It was renamed to `colored` (#32608) and then `transmitted` (#32611). In r186 the default is `shadowMap = { enabled: false, transmitted: false, type: PCFShadowMap }`, and ShadowNode samples the colour texture only when `transmitted === true` — [PR #32608](https://github.com/mrdoob/three.js/pull/32608); [r186 Renderer.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/common/Renderer.js); [r186 ShadowNode.js](https://github.com/mrdoob/three.js/blob/r186/src/nodes/lighting/ShadowNode.js)
- **Samplers are still one binding per texture:** r181 "Decouple samplers from textures" shares GPUSampler *objects* but says nothing about per-stage binding limits — [PR #31899](https://github.com/mrdoob/three.js/pull/31899). The r186 WGSL builder still declares one `<name>_sampler` binding per filterable, cube or gather texture; unfilterable and storage textures need no sampler — [r186 WGSLNodeBuilder.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/nodes/WGSLNodeBuilder.js)
- **Browser-reported cap:** for a Chrome adapter stuck at `maxSamplersPerShaderStage` 16, Mugen87 said "three.js can not change the limits/capabilities the browser reports" and closed the issue as not planned — [issue #33190](https://github.com/mrdoob/three.js/issues/33190). An open request asks for an option to request maximum *buffer* limits, not samplers — [issue #34344](https://github.com/mrdoob/three.js/issues/34344)
- **WebGL side regressed in r182:** the modernized shadows (#32303) raised texture-unit use ("Trying to use xx texture units while this GPU supports only 16" with five shadowed point lights). r183 fixed shadow uniform management (#32590) — [forum thread](https://discourse.threejs.org/t/max-texture-units-in-threejs-r182/88721); [PR #32303](https://github.com/mrdoob/three.js/pull/32303)

**(2) Uint8 itemSize-3 attribute stalls WebGPU boot**
- **Project symptom:** `BufferAttribute(Uint8Array, 3, true)` fails pipeline creation and the console shows only "Uncaught (in promise)". itemSize 4 works — project memory note `lab-webgpu-no-3byte-vertex.md` (local file)
- **Root cause in r180:**
  - `_getVertexFormat` pads the format (3 bytes → `unorm8x4`), but `arrayStride` stays `itemSize × bytes = 3`, which is invalid because WebGPU needs a multiple of 4.
  - Data is repacked only for *storage* attributes with itemSize 3.
  - Non-normalized 8/16-bit arrays are widened to Uint32/Int32, so only normalized ones break.
  - Source: [r180 WebGPUAttributeUtils.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/utils/WebGPUAttributeUtils.js)
- **Known upstream since Sep 2025:** "Vertex buffer arrayStride (3) is not a multiple of 4" with Draco + KHR_mesh_quantization. At first it was fixed only inside DRACOLoader (#31991, r181) — [issue #31959](https://github.com/mrdoob/three.js/issues/31959)
- **General fix in r185:** "WebGPURenderer: Correctly honor 4-byte stride alignment" (merged 2026-06-12; fixes #33781) — [PR #33787](https://github.com/mrdoob/three.js/pull/33787). In r186 every non-interleaved attribute with itemSize > 1 and a non-4-aligned byte stride is repacked, `arrayStride` is rounded up to 4, and partial updates are re-padded. Interleaved attributes still use `data.stride` unpadded — [r186 WebGPUAttributeUtils.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/utils/WebGPUAttributeUtils.js)
- Platform background: there are no x3 8/16-bit vertex formats in WebGPU, and the stride must be a multiple of 4 (section 5) — [Dawn commit](https://dawn.googlesource.com/dawn/+/b58435c6f9d5a27375c13faf99718b2be5285eb2)

**(3) Calling `shadowMap.render` outside `renderer.render()` stops the frame loop**
- **Project symptom (WebGLRenderer):** the call throws "Cannot read properties of null (reading 'state')", because `currentRenderState` exists only inside `render()`. The throw escapes `setAnimationLoop` and frames stop — project memory note `three-shadowmap-render-outside-render.md` (local file)
- **Long-known and still unsupported:**
  - `shadowMap.render()` "relies on currentRenderState being set up" and skips `clipping.beginShadows()`; open since 2022 — [issue #23461](https://github.com/mrdoob/three.js/issues/23461)
  - PR #23585 "Add .renderShadowMap()" is still open, and a newer open PR (#34239, Aug 2026) would prepare WebGL shadow maps during `compile()` — [GitHub search](https://github.com/mrdoob/three.js/issues?q=%22shadowMap.render%22)
- **Loop death fixed in r186:** "WebGLAnimation: Schedule next frame before the loop callback" (merged 2026-09-03) is motivated by exactly this: one uncaught error stopped the loop for the session. In r180 WebGLAnimation called the callback before `requestAnimationFrame`; WebGPURenderer's `Animation` already scheduled first — [PR #34448](https://github.com/mrdoob/three.js/pull/34448); [r180 WebGLAnimation.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl/WebGLAnimation.js); [r186 WebGLAnimation.js](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgl/WebGLAnimation.js)
- **WebGPURenderer has no `shadowMap.render`.** Its `shadowMap` is `{ enabled, type }` in r180, plus `transmitted` from r183. The supported on-demand path is per light: `light.shadow.autoUpdate = false` + `light.shadow.needsUpdate = true` — [issue #31007](https://github.com/mrdoob/three.js/issues/31007)
- **Open bug on that path:** if the first shadow update happens *after* the first frame, r186 throws "Destroyed texture ShadowDepthTexture used in a submit" every frame. The workaround is to set `needsUpdate` before the first `render()`. Opened 2026-10-18; PR #35088 is open and unreviewed — [issue #35085](https://github.com/mrdoob/three.js/issues/35085); [PR #35088](https://github.com/mrdoob/three.js/pull/35088)
- **Related fixes:** "Fix shadows in first frame" (r181, #32021, fixes #31925) and "Do not render shadow maps when precompile" (r186, #33924) — [release r181](https://github.com/mrdoob/three.js/releases/tag/r181); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)

**(4) Environment PMREM renders dark at load (WebGPU)**
- **Project symptom:** IBL about 25% darker (frame mean 46.8 vs 61.5) until the PMREM is rebuilt. The lab rebuilds it 30 and 120 frames after each environment change — project memory note `lab-webgpu-boot-env-pmrem.md` (local file)
- **r180 mechanism:** PMREMNode builds the PMREM lazily inside `render()` (`updateBefore`). Its only gates are `pmremVersion` and `isEquirectangularMapReady(image)`. The WebGPU PMREMGenerator warns and falls back to the `*Async()` variants if called before `init` — [r180 PMREMNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/pmrem/PMREMNode.js); [r180 PMREMGenerator.js](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/extras/PMREMGenerator.js)
- **No matching upstream issue found.** PMREM changes since r180 — [releases](https://github.com/mrdoob/three.js/releases); [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide); [PR #32941](https://github.com/mrdoob/three.js/pull/32941); [PR #33587](https://github.com/mrdoob/three.js/pull/33587):
  - r181: VNDF importance sampling.
  - r183: per-renderer PMREM cache (#32941).
  - r185: `await renderer.init()` policy (#33587) and an internal-PMREM dispose fix.
  - r186: spiral blur; #33881, which is only a null-texture crash fix ([PR #33881](https://github.com/mrdoob/three.js/pull/33881)).
  - r187-dev: PMREMs on cube render targets, `CubeUVReflectionMapping` removed (#34585).
- **Analogous bug, WebGL only:** PMREM generation nested inside the first `render()` corrupted the texture-unit counter. Fixed in r184 (#33217) — [issue #33207](https://github.com/mrdoob/three.js/issues/33207)

**(5) Changing a light's `shadow.mapSize` at runtime breaks WebGPU rendering**
- **Root cause in r180:** `renderShadow()` calls `shadowMap.setSize(mapSize)`, and `RenderTarget.setSize()` calls `dispose()` when the size changes. Materials holding bind groups to the old depth texture then submit a destroyed texture — [r180 ShadowNode.js](https://github.com/mrdoob/three.js/blob/r180/src/nodes/lighting/ShadowNode.js); [r180 RenderTarget.js](https://github.com/mrdoob/three.js/blob/r180/src/core/RenderTarget.js)
- **Exact upstream match (r185):** a runtime mapSize change with several meshes sharing one material produces "Destroyed texture … ShadowDepthTexture used in a submit", because only the first render object per material refreshes its bindings. Mugen87 said resizes should work as they do in WebGLRenderer — [issue #34324](https://github.com/mrdoob/three.js/issues/34324)
- **Fixed in r186:** "LightsNode: Detect dynamic shadow map size changes" (merged 2026-08-24), plus "NodeMaterialObserver: Track shadow map sizes" (#34361) — [PR #34360](https://github.com/mrdoob/three.js/pull/34360); [release r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **Possible residue:** the reporter saw one error at the moment of resize with his own patch; unconfirmed whether #34360 covers it. The same error family appears in #34301, #34600/#34608 (Line2 + setSize, closed for r187) and the open #35085 — [GitHub search](https://github.com/mrdoob/three.js/issues?q=%22destroyed+texture%22)

### Inferences
- **Upgrading to ≥ r186** addresses (1) partly, (2), (3)'s loop death and (5).
  - For (1), with `transmitted` off each shadow light costs 1 sampler instead of 2. The structural fix is still fewer sampler bindings in the terrain shader: pack splat layers into a `DataArrayTexture` (one sampler for N layers) or an atlas. This is an inference, not lab-verified.
- **(2) after r185:** non-interleaved Uint8×3 should work, but *interleaved* buffers with a non-4-aligned stride probably still fail (r186 pads only non-interleaved attributes). Keep padding to 4 bytes manually as policy.
- **(3):** keep the project's workaround (render extra shadows from `scene.onAfterRender`). On WebGPU, use `light.shadow.autoUpdate = false` + `needsUpdate` set before the first frame (avoids #35085).
- **(4) is probably the same fragility class as #33207/#31925** (state built lazily inside the first frames' `render()`). That is a hypothesis. Re-test the frame-30/120 rebuild workaround after any upgrade, especially with r187's PMREM rewrite.
- **(5):** on r180, avoid runtime `mapSize` changes on WebGPU (recreate the light, or set the size once before first render). On r186+, it should work, but test with shared materials.

### Gaps
- No upstream report found for (4). Discourse search was cut short by the search budget.
- Not verified whether r186 still throws on a manual WebGL `shadowMap.render()` outside `render()` (nothing suggests it changed).
- No independent source confirms Dawn/D3D12 caps samplers at 16 on NVIDIA. Only the project's observation and #33190 support it.
- Whether r187 PR #34531 merged all the TSL optimisations from #34386 is unknown.

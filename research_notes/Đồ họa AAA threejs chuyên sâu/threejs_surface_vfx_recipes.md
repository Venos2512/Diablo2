# three.js r180 implementation recipes: terrain, decals and ground paint, water and wetness, VFX, crowds, GPU damage numbers, asset pipeline (WebGLRenderer + GLSL and WebGPURenderer + TSL, with r181–r186 deltas)

Researched 19 Oct 2026 against the three.js `r180` and `r186` tags and the `dev` branch. Lab constraints used throughout: `OrthographicCamera(-1, 1, 1, -1, -300, 600)` (2:1 iso), WebGPU sampler cap already hit by the 10-texture terrain shader (splat + 3 layers × albedo/normal+height/ORM), optional MSAA on the HalfFloat scene target, full/½/¼ VFX buffers, three.quarks 0.16 (WebGL only), DOM damage numbers, and 37 GLBs with embedded JPEG/PNG. "(search snippet)" marks a claim seen only in a search-result summary, not on a fetched page.

## 1. Terrain: hex-tiling and other anti-tiling, triplanar, texture-array layers (DataArrayTexture / CompressedArrayTexture / KTX2), height blending across layers, the WebGPU 16-sampler cap, detail normals

### Takeaway
Texture arrays are the only lever that cuts texture slots on both backends:
- three.js r180 and r186 still emit one WGSL `sampler` binding per filterable texture.
- `maxSamplersPerShaderStage` is 16 on about 83% of WebGPU devices.
- WebGL2 has 16 texture units on about 98% of Windows and macOS devices.

On r180 TSL, though, array sampling via `.grad()`, `.level()` or `.bias()` drops the layer index. That bug was fixed in r183, and it collides with gradient-based anti-tiling, so on WebGPU the array migration is best paired with an r183+ upgrade. Until then there are two r180-compatible escape hatches:
- Nearest/Nearest data textures get no sampler binding (they go down the `textureLoad` path).
- `requiredLimits` can raise `maxSampledTexturesPerShaderStage` to 48 on about 98% of Windows adapters.

No TSL port of hex-tiling exists. For the lab's custom terrain shader the practical route is a hand port of Mikkelsen's MIT `hextiling.h`: 3 `textureGrad` fetches per map, γ = 7, β = 0.6, r ≈ 0.65–0.75.

### Cited Findings

#### 1.1 Hex-tiling (Mikkelsen 2022) and other anti-tiling code
- Mikkelsen, "Practical Real-Time Hex-Tiling", *JCGT* 11(2), 2022 (Unity Technologies). It adapts Heitz–Neyret by-example noise and drops histogram preservation, which needs a precomputed transform and inverse-transform texture "which must both be sampled in the shader rather than the original source texture". It replaces that with a blending method that samples the original texture directly. A luminance metric diffuses tile transitions, and an S-curve contrast function on the weights reduces contrast loss for colour. The emphasis is on normal maps — [JCGT paper](https://jcgt.org/published/0011/03/05/paper-lowres.pdf)
- Paper parameters: "we are using γ = 7 and β = 0.6 … good choices in general". The contrast input r has no effect at 0.5, and "a conservative choice is in the range r ∈ [0.65, 0.75]". Per-tile random rotation is supported, and for normals each sample is rotated with its tile before blending — [JCGT paper](https://jcgt.org/published/0011/03/05/paper-lowres.pdf)
- "When hex-tiling we must use SampleGrad() due to the randomized offset applied to the sampling coordinate". Normal maps are blended as derivatives (surface-gradient framework) and converted back with `normalize(float3(-deriv.xy, 1.0))` — [JCGT paper](https://jcgt.org/published/0011/03/05/paper-lowres.pdf)
- I found no millisecond timings in the paper's text (full-text check). Cost is structural: three gradient fetches per map — [JCGT paper](https://jcgt.org/published/0011/03/05/paper-lowres.pdf)
- Reference code is mmikk/hextile-demo (MIT, about 1.0k stars). `hextiling.h` holds `TriangleGrid`, `hash`, `MakeCenST`, `LoadRot2x2(idx, rotStrength)`, `Gain3`, `ProduceHexWeights`, `hex2colTex` and `bumphex2derivNMap`. `hextiling_rws.h` keeps fractional precision far from the origin, for planar or triplanar projection on large levels — [hextile-demo](https://github.com/mmikk/hextile-demo)
- Inside `hex2colTex`, each tile is fetched with `tex.SampleGrad(samp, st_i, mul(dSTdx, rot_i), mul(dSTdy, rot_i))` using derivatives of the unrotated `st`. The weights are:
  - `Lw = (0.299, 0.587, 0.114)` luminance per sample
  - `Dw = lerp(1.0, Dw, g_fallOffContrast)` with `g_fallOffContrast = 0.6`
  - `W = Dw*pow(float3(w1,w2,w3), g_exp)` with `g_exp = 7`
  - `W /= (W.x+W.y+W.z)`, then `Gain3` only when r ≠ 0.5

  — [hextiling.h](https://github.com/mmikk/hextile-demo/blob/main/hextile-demo/hextiling.h)
- A Godot 4 port of Mikkelsen's demo (MIT, header "Copyright (c) 2022 mmikk, noddingSloth"; posted March 2026) uses `textureGrad(tex, st1, rot1 * dSTdx, rot1 * dSTdy)`, with derivatives taken before rotation "to prevent seam artifacts". It exposes `tile_scale`, `rot_strength` (0.5) and contrast r (0.75), hardcodes 0.6 and 7, and handles albedo only, with no normal-map path — [godotshaders](https://godotshaders.com/shader/stochastic-hex-tiling-mikkelsens-adaptation/)
- three-hex-tiling (Ameobea, MIT):
  - Patches `MeshStandardMaterial`/`MeshPhysicalMaterial` (`map`, `normalMap`, `roughnessMap`, `metalnessMap`) and installs its own `onBeforeCompile`, which can conflict with user code.
  - Tested on three 0.151–0.173.
  - Makes up to 3 fetches per map per fragment. `lookupSkipThreshold` (default 0.01) skips lookups whose coefficient falls below it, and `textureSampleCoefficientExponent` (default 8) steepens the cutoff so more are skipped.
  - Its shader is adapted from a Neyret Shadertoy, not from Mikkelsen. There is no WebGPU/TSL mention.

  — [three-hex-tiling](https://github.com/Ameobea/three-hex-tiling); [discourse](https://discourse.threejs.org/t/three-hex-tiling-infinite-non-repeating-seamless-texture-tiling-for-three-js/58251)
- Combining hex-tiling with triplanar multiplies fetches, "to a whopping 27 for each map used" — [cprimozic.net](https://cprimozic.net/blog/tools-and-techniques-for-procedural-gamedev/) (search snippet)

#### 1.2 Triplanar and biplanar in three.js
- In r180 TSL, `triplanarTextures(textureXNode, textureYNode = null, textureZNode = null, scaleNode = float(1), positionNode = positionLocal, normalNode = normalLocal)` (alias `triplanarTexture`) makes 3 `texture()` samples per call. Weights are |n| normalised by their sum. It works in local space by default, so pass `positionWorld`/`normalWorld` for world-space terrain — [TriplanarTextures.js r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/utils/TriplanarTextures.js)
- In r180 the node appears only in the ice material of `webgpu_backdrop_water` (no dedicated triplanar example) — [webgpu_backdrop_water r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_backdrop_water.html); [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- Inigo Quilez's biplanar mapping makes 2 fetches instead of 3. It keeps the major and median axes and needs `textureGrad`, with derivatives computed before the axis selection, to avoid one-pixel seam lines. Differences from triplanar remain only near (±1,±1,±1) normals; "I'd definitely use it in situations where fetching textures is a bottleneck" — [IQ biplanar](https://iquilezles.org/articles/biplanar/)

#### 1.3 Array textures: creation, KTX2, sampling (GLSL `sampler2DArray`, TSL `.depth()`)
- r180 already ships array examples on both backends:
  - WebGL: `webgl_texture2darray`, `webgl_texture2darray_compressed`, `webgl_texture2darray_layerupdate`, `webgl_rendertarget_texture2darray`
  - WebGPU: `webgpu_textures_2d-array`, `webgpu_textures_2d-array_compressed`, `webgpu_rendertarget_2d-array_3d`

  — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- GLSL (WebGLRenderer): `precision highp sampler2DArray; uniform sampler2DArray diffuse; … texture( diffuse, vec3( vUv, depth ) )`. The texture loads via `KTX2Loader().setTranscoderPath('jsm/libs/basis/')`, `.detectSupport(renderer)` and `.load('textures/spiritedaway.ktx2')` — [webgl_texture2darray_compressed r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_texture2darray_compressed.html)
- TSL: `material.colorNode = texture( texturearray, uv().flipY() ).depth( depth )` with `const depth = uniform( 0 )` — [webgpu_textures_2d-array_compressed r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_textures_2d-array_compressed.html)
- r180 `TextureNode` chainables: `sample`, `load` (no interpolation), `level`, `bias`, `grad(gradX, gradY)`, `depth(depthNode)`, `compare`, `offset`, `size`, `blur` — [TextureNode.js r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/accessors/TextureNode.js)
- r180 WGSL handling of arrays:
  - Arrays (`isArrayTexture`/`isDataArrayTexture`/`isCompressedArrayTexture`) are declared `texture_2d_array<f32>`.
  - The fragment `textureSample( t, t_sampler, uv, layer )` forwards the layer.
  - The filterable branch of `generateTextureSampleLevel()` emits `textureSampleLevel( t, t_sampler, uv, level )`, which drops the layer index.

  — [WGSLNodeBuilder r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/nodes/WGSLNodeBuilder.js)
- r183 fixed "array texture layer support for filtered sampling". PR #32990 makes `textureSampleLevel`, `textureSampleGrad` and `textureSampleBias` emit the array layer index for filtered textures, and adds a `tsl_biquadraticTexture_array` helper (merged 10 Feb 2026). #33008 applies the same fix to the GLSL builder — [PR #32990](https://github.com/mrdoob/three.js/pull/32990); [r183](https://github.com/mrdoob/three.js/releases/tag/r183)
- In r186 WGSL, `textureSampleGrad( t, t_sampler, uv, layer, ddx, ddy )` and `textureSampleBias( …, layer, bias )` are fragment-only (other stages call `error()`), and `textureSampleLevel` passes the layer before the level — [WGSLNodeBuilder r186](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/nodes/WGSLNodeBuilder.js)
- Later array fixes:
  - r184: "TSL: Fix array texture with no `.depth()` defined breaks shader compilation" (#33096); "Honor layerUpdates for array textures" (#33072)
  - r185: layerUpdates for compressed arrays (#33417); "Support rendering to texture arrays" (#33507); TSL `textureGather` (#33475)
  - r186: `layerUpdates` for `CompressedArrayTexture` (#33996); integer array bindings fixed (#34422)

  — [r184](https://github.com/mrdoob/three.js/releases/tag/r184); [r185](https://github.com/mrdoob/three.js/releases/tag/r185); [r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- r180 KTX2Loader:
  - Layered Basis files become `new CompressedArrayTexture( mipmaps, width, height, container.layerCount, format, type )`, and `faceCount === 6` becomes `CompressedCubeTexture`.
  - The raw (non-Basis) path ignores `layerCount`.
  - `DataArrayTexture` is never produced.

  — [KTX2Loader r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/loaders/KTX2Loader.js). r186 behaves the same — [KTX2Loader r186](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/KTX2Loader.js)
- Producing arrays: `ktx create` has `--layers` ("If set the texture will be an array texture"), `--levels`, `--generate-mipmap`, `--encode` (basis-lz, uastc/uastc-ldr-4x4, uastc-hdr-…), `--zstd` (not with BasisLZ), `--normal-mode` and `--assign-tf`. The docs specify input ordering only for cubemaps (+X, −X, +Y, −Y, +Z, −Z), not for layers/levels, and record 4.3 as the page's initial version — [ktx create](https://github.khronos.org/KTX-Software/ktxtools/ktx_create.html)
- toktx has supported array and 3D textures since the KTX2 work — [Khronos forum](https://community.khronos.org/t/toktx-tool-3d-array-textures/104844) (search snippet). Basis Universal v2.5 (Apache-2.0) says .basis and .KTX2 support "texture arrays, cubemaps, cubemap arrays, mipmaps, and texture video in all modes" — [basis_universal](https://github.com/BinomialLLC/basis_universal)
- KHR_texture_basisu requires material KTX2 images to be "of **2D** type" (arrays and cubemaps excluded by implication) — [KHR_texture_basisu](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)
- WebGPU mipmaps: r180 `WebGPUTextureUtils.generateMipmaps` loops `for` each of `texture.image.depth` layers (or 6 cube faces), calling the pass utils with `baseArrayLayer = i` — [WebGPUTextureUtils r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/utils/WebGPUTextureUtils.js); [WebGPUTexturePassUtils r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/utils/WebGPUTexturePassUtils.js)
- WebGPU default `maxTextureArrayLayers` = 256 — [MDN GPUSupportedLimits](https://developer.mozilla.org/en-US/docs/Web/API/GPUSupportedLimits)

#### 1.4 The 16-sampler cap: what three.js does, what devices report
- WebGPU base limits: `maxSampledTexturesPerShaderStage` 16, `maxSamplersPerShaderStage` 16, `maxBindingsPerBindGroup` 640, `maxBindGroups` 4. Browsers report tier values rather than exact hardware limits, and higher limits are requested via `requiredLimits` in `requestDevice` — [MDN GPUSupportedLimits](https://developer.mozilla.org/en-US/docs/Web/API/GPUSupportedLimits)
- `maxSampledTexturesPerShaderStage` ≥48 appears in 78% of all reports. By platform: Windows 98%, Android 91%, macOS 70%, Linux 63%, ChromeOS 18%. ≥64 appears in 5% — [web3dsurvey](https://web3dsurvey.com/webgpu/limits/maxSampledTexturesPerShaderStage)
- `maxSamplersPerShaderStage`: ≥16 in 100%, ≥22 in only 17% (iOS 99%, macOS 28%), ≥64 in 4% (Windows 7%, Linux 10%) — [web3dsurvey](https://web3dsurvey.com/webgpu/limits/maxSamplersPerShaderStage)
- A Dawn commit added a "tier2" that raises `maxSampledTexturesPerShaderStage` to 48, "mainly because of Vulkan and Metal" — [Dawn commit](https://dawn.googlesource.com/dawn/+/a082d8e7cb9118e9df5965e63c4ff64e62e5fd14) (search snippet)
- WebGL2 `MAX_TEXTURE_IMAGE_UNITS`: ≥16 in 100%. ≥32 appears on only 2% of Windows and 1% of macOS/iOS; Linux reaches ≥24 at 90% and ChromeOS ≥32 at 84% — [web3dsurvey](https://web3dsurvey.com/webgl2/parameters/MAX_TEXTURE_IMAGE_UNITS)
- r180 `WebGPUBackend`:
  - `this.parameters.requiredLimits = ( parameters.requiredLimits === undefined ) ? {} : parameters.requiredLimits` is passed to `adapter.requestDevice({ requiredFeatures: supportedFeatures, requiredLimits })`.
  - Every adapter-supported feature (e.g. `float32-filterable`, `texture-compression-bc`) is requested automatically.
  - A caller-supplied `parameters.device` skips adapter/device creation.

  — [WebGPUBackend r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/WebGPUBackend.js)
- r180 WGSL emits a separate `var ${ uniform.name }_sampler : sampler;` (or `sampler_comparison`) for every filterable, non-storage texture uniform, with no sharing or deduplication — [WGSLNodeBuilder r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/nodes/WGSLNodeBuilder.js)
- r186 is unchanged: `needsSampler = texture.isCubeTexture || ( !isUnfilterable && !isStorageTextureNode ) || textureNode.gatherNode !== null`, with a `new NodeSampler( name + '_sampler', … )` per texture and no sampler map or `sharedSampler` — [WGSLNodeBuilder r186](https://github.com/mrdoob/three.js/blob/r186/src/renderers/webgpu/nodes/WGSLNodeBuilder.js)
- Sampler objects did change in later releases:
  - r180's `createSampler` creates a new `GPUSampler` per texture without a cache — [WebGPUTextureUtils r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/utils/WebGPUTextureUtils.js)
  - r181 "Decouple samplers from textures" (#31899): "Samplers can be shared across different textures if their configuration matches", with caching in `WebGPUTextureUtils`. The PR says nothing about binding counts or the per-stage limit — [PR #31899](https://github.com/mrdoob/three.js/pull/31899)
  - r185 #33847 moved the cache to per-binding data to fix a comparison/non-comparison sampler collision — [PR #33847](https://github.com/mrdoob/three.js/pull/33847)
- In r180, `isUnfilterable(texture)` is true when any of these holds; unfilterable textures are read with `textureLoad` and get no sampler binding:
  - the component type isn't float;
  - it is a `FloatType` DataTexture and `float32Filterable` is unavailable;
  - it isn't compare-sampled and both `minFilter` and `magFilter` are `NearestFilter`;
  - it is multisampled.

  — [WGSLNodeBuilder r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/nodes/WGSLNodeBuilder.js)

#### 1.5 Height blending and detail normals
- Mishkinis (Game Developer, 16 July 2013) height blend: `float ma = max(texture1.a + a1, texture2.a + a2) - depth;` with `depth = 0.2`. Each weight is the clamped amount its height-plus-opacity rises above `ma`, and the result is the normalised weighted sum. The article covers only the two-texture case — [Game Developer](https://www.gamedeveloper.com/programming/advanced-terrain-texture-splatting)
- Detail-normal blending (Barré-Brisebois & Hill), with RNM recommended because it "retains more detail … at a similar instruction cost" and UDN as the cheaper fallback:
  - Whiteout: `normalize(float3(n1.xy + n2.xy, n1.z*n2.z))`, 7 ALU
  - UDN: `normalize(float3(n1.xy + n2.xy, n1.z))`, 5 ALU
  - RNM: `t = base*float3(2,2,2)+float3(-1,-1,0); u = detail*float3(-2,-2,2)+float3(1,1,-1); r = normalize(t*dot(t,u) - u*t.z)`, 8 ALU (6 without normalisation)

  — [Blending in Detail](https://blog.selfshadow.com/publications/blending-in-detail/)
- r182 changed the default anisotropy value of `Texture` (#32346), which affects terrain sharpness and cost after an upgrade — [r182](https://github.com/mrdoob/three.js/releases/tag/r182)

### Inferences
- **Slot arithmetic for the lab's terrain:**
  - Today the shader uses 1 splat + 9 layer maps. Re-packing into three arrays (albedo sRGB, normal+height, ORM) gives 1 splat + 3 arrays = 4 slots on both backends, and adding layers 4–8 costs zero slots; a second splat map, or an index+weight map, covers more than 4 layers.
  - On WebGPU r180 each array still costs one texture plus one sampler binding, so the gain is real for both `maxSampledTextures…` and `maxSamplers…`.
  - glTF cannot carry arrays (KHR_texture_basisu is 2D only), so terrain arrays must be standalone `.ktx2` files. Load them with `KTX2Loader`, which yields a `CompressedArrayTexture`, or build them at runtime as `DataArrayTexture`. glTF-Transform plays no part here.
- **Backend split for arrays plus anti-tiling:**
  - WebGLRenderer (GLSL ES 3.0) handles `textureGrad(sampler2DArray, vec3(uv, layer), dx, dy)` natively, so the lab's IQ anti-tiling or a hex port works on arrays today.
  - On WebGPURenderer r180, `.grad()`/`.level()`/`.bias()` on arrays lose the layer index, which renders the wrong layer or fails. Either upgrade to ≥ r183 before moving the TSL terrain to arrays, or keep plain fragment `texture(arr, uv).depth(i)` on r180. The latter uses implicit derivatives, so expect mip seams at anti-tiling cell borders.
  - An unverified third option is a custom `wgslFn` that calls `textureSampleGrad` with a texture and sampler parameter.
- **Sampler-budget tactics that work on r180 WebGPU:**
  - (a) Arrays.
  - (b) Set data textures that don't need hardware filtering to `NearestFilter`/`NearestFilter`: splat or index maps, VAT/bone textures, the paint-layer mask if blocky is acceptable. three.js then emits `textureLoad` and no sampler binding. Do manual bilinear with 4 loads if needed.
  - (c) Then raise `maxSampledTexturesPerShaderStage` only. Query `navigator.gpu.requestAdapter()` first, then pass `requiredLimits: { maxSampledTexturesPerShaderStage: Math.min(48, adapter.limits.maxSampledTexturesPerShaderStage) }` to `new WebGPURenderer(...)`, or hand over your own `device`. Raising it alone does not help, because each filterable texture also adds a sampler and that limit stays at 16 on most devices.
  - (d) Keep channel-packing: height in normal alpha (already done) and ORM.
  - (e) On WebGL only arrays and packing help (16 combined units).
- **Hex-tiling port plan (GLSL first, TSL after r183):**
  - Port `TriangleGrid`/`hash`/`MakeCenST`/`LoadRot2x2`/`Gain3`/`hex2colTex` from `hextiling.h`. Mind HLSL→GLSL matrix order: HLSL `mul(v, M)` corresponds to GLSL `v * M`.
  - Replace `SampleGrad` with `textureGrad(arr, vec3(st_i, layer), rot_i * dx, rot_i * dy)`.
  - Use luminance weights on albedo and reuse the same `W` for the ORM fetch. Blend normals as derivatives, via `bumphex2derivNMap`, before height blending.
  - Fetch count for 3 layers × 3 maps × 3 hex taps = 27, against 18 for the lab's current IQ two-tap scheme. To cut it, hex-tile only albedo+normal of the two strongest layers per pixel, use one plain fetch for ORM, and skip taps with weight < 0.01 via a branch (the three-hex-tiling idea).
- **Ortho iso specifics:**
  - With a fixed-pitch orthographic camera, UV derivatives over flat ground are nearly constant across the screen and change only with zoom. Gradient fetches therefore keep stable mip selection, and the hex cell size can be chosen in pixels for the default zoom.
  - Triplanar/biplanar is only needed on cliffs. Branch on `normalWorld.y`: planar XZ above about 0.7, biplanar below. That keeps the flat majority at one projection.
- **Height blend across N array layers:** generalise Mishkinis by taking `ma = max_i(h_i + w_i) − depth`, `b_i = max(h_i + w_i − ma, 0)`, and `Σ c_i b_i / Σ b_i` over a fixed-count loop. This is my generalisation; the article only shows two layers. The lab's existing `labTerrainMask` already does a variant, and it ports unchanged once heights come from `texture(normalHeightArr, vec3(uv, i)).a`.
- **Detail normals:** put a small tiling detail normal in a spare layer of the normal array, blend with UDN (cheapest) or RNM, and fade by zoom. It costs zero extra slots.

### Gaps
- No three.js or TSL port of Mikkelsen's hex-tiling was found, only three-hex-tiling (Neyret-based, onBeforeCompile, tested to three 0.173, untested on r180) and the Godot port. No published ms cost exists for hex-tiling, triplanar or biplanar in three.js.
- The `ktx create` docs don't state how multiple input files map to layers vs mip levels. Check with `ktx create --help` or a test build. Whether ETC1S/BasisLZ arrays transcode correctly through r180 KTX2Loader on WebGPU was not tested; `webgpu_textures_2d-array_compressed` loads a Basis array, but its encoding was not checked.
- Not verified whether `DataArrayTexture` upload on Dawn/SwiftShader suffers the frame drops the lab saw with 3D LUT textures (`Data3DTexture`).
- Not verified whether TSL `wgslFn` accepts `texture_2d_array` and `sampler` parameters on r180, which would enable a hand-written `textureSampleGrad` workaround.
- `maxSamplersPerShaderStage` per-OS breakdown for Windows below the 64 threshold is not shown by web3dsurvey. "16 on Windows" is inferred from ≥22 not being listed there.

## 2. Decals and a ground "paint" layer: camera-following top-down render target, projected box/screen-space decals reading depth in a forward renderer, DecalGeometry limits, sorting and fade budgets

### Takeaway
three.js r180–r186 has no depth-reading decal system and no RVT-style ground cache. The only built-in decal is CPU-clipped `DecalGeometry`: one draw call per decal, rebuilt when the target changes, distorted around corners. For an iso ARPG the efficient split is two-part:
- **Paint render target:** a world-anchored, camera-following top-down RT (blood, scorch, wetness), snapped to texels and ping-ponged for persistence, sampled by world XZ in the terrain shader at the cost of one texture slot.
- **Projected box decals:** instanced boxes that reconstruct world position from scene depth, for items that must land on props and slopes. With the ortho camera they can choose mip analytically, which avoids Wronski's depth-discontinuity mip artefacts.

### Cited Findings
- `DecalGeometry(mesh, position, orientation, size)` builds a decal mesh by projecting a box onto a mesh. Its docs warn that "decal projections can be distorted when used around corners" (issue #21187) and cite Wolfire's "How to project decals" — [DecalGeometry docs](https://threejs.org/docs/pages/DecalGeometry.html)
- The r180 `webgl_decals` example:
  - One `Mesh(new DecalGeometry(...), material.clone())` per shot.
  - `MeshPhongMaterial` with `polygonOffset: true, polygonOffsetFactor: -4, depthTest: true, depthWrite: false, transparent: true`, and `renderOrder` set to the decal count.
  - No maximum count, and `removeDecals()` doesn't dispose geometries or materials.

  — [webgl_decals r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_decals.html)
- The community view of geometry decals: "Each decal is a separate draw call"; generation "can be very slow if your source geometry is large"; decals must be rebuilt when the source moves, and fail across intersecting geometries — [discourse "How to draw stuff on stuff"](https://discourse.threejs.org/t/how-to-draw-stuff-on-stuff/48934)
- Usnul's clustered Forward+ decals in three.js claim "Practically 0 CPU cost per decal" and "no additional draw calls", demonstrated with 100,000 decals and 181 textures, but give no measurements. Usnul doesn't plan to open-source the code. Fyrestar's box-projected decals work with a G-buffer "but can be rendered forward or deferred" and fade by slope; no repo is linked — [discourse](https://discourse.threejs.org/t/how-to-draw-stuff-on-stuff/48934)
- three-projected-material (marcofugaro, MIT) projects a texture from a camera onto the mesh using that material, with a `project(mesh)` snapshot and instancing via `allocateProjectionData()`/`projectInstanceAt()`. It is a material replacement, not a depth-reading decal; no version range or WebGPU support is stated — [three-projected-material](https://github.com/marcofugaro/three-projected-material)
- Screen-space decals sample with UVs reprojected from depth. At depth discontinuities some quad pixels land outside the box, the derivative jumps (an example "difference of 1.5 in the UV space"), and the GPU picks a blurry mip; discard doesn't help, because those pixels still feed the derivatives. Fixes considered:
  - `SampleLevel` limited to mips 0–3
  - depth-based derivatives (Humus), "probably the best 'easy' solution"
  - decal normal plus vertex-shader derivatives (Mitton)
  - storing mip or derivative data in the G-buffer
  - a commenter says `ddx_fine/ddy_fine` with MinLod "removes 90% of the artifacts"

  — [Wronski 2015](https://bartwronski.com/2015/03/12/fixing-screen-space-deferred-decals/)
- Depth access in r180:
  - `RenderTarget` options include `samples` (default 0), `depthBuffer` (true), `resolveDepthBuffer` (true: "Whether to resolve the depth buffer or not"), `depthTexture` (null) and `count` (MRT) — [RenderTarget.js r180](https://github.com/mrdoob/three.js/blob/r180/src/core/RenderTarget.js)
  - TSL `getViewPosition(screenPosition, depth, projectionMatrixInverse)` multiplies by any inverse projection and divides by w, with no perspective branch. WebGPU passes depth through; WebGL remaps xyz with `*2-1` — [PostProcessingUtils r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/utils/PostProcessingUtils.js)
- Depth helpers in r180 and r186:
  - r180 `PassNode.getViewZNode()` always uses `perspectiveDepthToViewZ`. `getLinearDepthNode()` carries "TODO: just if ( builder.camera.isPerspectiveCamera )" and converts unconditionally — [PassNode r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/display/PassNode.js). r186 still behaves this way — [PassNode r186](https://github.com/mrdoob/three.js/blob/r186/src/nodes/display/PassNode.js)
  - GLSL helpers in r180 `packing`: `orthographicDepthToViewZ(depth, near, far) = depth * (near - far) - near` and `viewZToOrthographicDepth(viewZ, near, far) = (viewZ + near) / (near - far)` — [packing.glsl.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/shaders/ShaderChunk/packing.glsl.js)
- The camera-following capture technique (snow trails, Unreal):
  - Move the capture with the player, snapped to whole texels: pixel world size = `(1 / RenderTargetResolution) * CaptureSize`, snapped position = `(floor(Position / PixelWorldSize) + 0.5) * PixelWorldSize`.
  - The persistent buffer must shift as the capture moves, "Otherwise, the capture and persistent buffer will desync".
  - Capture and persistent targets ping-pong.
  - Data outside the moving window is discarded.

  — [Kodeco snow trails p.3](https://www.kodeco.com/5760-creating-snow-trails-in-unreal-engine-4?page=3)
- Release notes r181–r186 contain no decal-specific features. The only decal-related line is a docs typo fix in r182 (#32366) — [r182](https://github.com/mrdoob/three.js/releases/tag/r182)
- Adjacent changes:
  - r183 BatchedMesh "Enable per-instance opacity" (#32725) — [r183](https://github.com/mrdoob/three.js/releases/tag/r183)
  - r186 WebGPURenderer "Support shared depth texture between multiple passes" (#34042) — [r186](https://github.com/mrdoob/three.js/releases/tag/r186)

### Inferences
- **Paint-layer recipe (same three.js API on both backends):**
  - Use two `RenderTarget(1024, 1024, { type: HalfFloatType, depthBuffer: false })` targets covering about 64 m (6.25 cm per texel), centred on the player with Kodeco's texel snap.
  - Each frame, or only when the snapped origin moves or stamps were added:
    1. Draw a full-screen quad that reads the previous target at `uv + (origin − prevOrigin)/size`, times a per-channel decay.
    2. Draw new stamps as one `InstancedMesh` of quads into the same target, with an orthographic projection looking down −Y over `origin ± size/2` and additive or max blending.
  - Channels: R = blood, G = scorch/char, B = wetness/puddle (feeds §3), A = burn glow or spare. Fade the paint toward the window edges so the hard cut where data is discarded never shows.
  - Terrain lookup: `uvPaint = (worldPos.xz − origin.xz) / size + 0.5`. That is one more texture on WebGPU/WebGL, so free a slot with arrays (§1) first.
  - No MSAA on these targets. Keep linear filtering, since blood and scorch are soft.
- **Telegraphs:**
  - Don't route them through the low-res paint target. Evaluate them analytically in the terrain/ground shader from a small uniform array (circles, cones, lines as SDFs, crisp at any zoom), or draw them as projected boxes after tone mapping, per the first-round recommendation.
  - Animated fill (charge-up) is a uniform per telegraph.
- **Depth-reading box decals (props, slopes, multi-mesh surfaces):**
  - Render a unit box per decal as one `InstancedMesh`, with front faces, `depthWrite: false`, and depth test on so occluders still hide decals.
  - Per pixel:
    1. Read scene depth.
    2. Get view position (TSL `getViewPosition(screenUV, viewportDepthTexture(), cameraProjectionMatrixInverse)`; GLSL: the same with NDC z = `d*2−1`).
    3. Take world position via the camera world matrix.
    4. Transform into decal-local space with a per-instance inverse matrix stored as an instanced attribute, computed on the CPU when the decal spawns.
    5. Discard outside `[−0.5, 0.5]³` and sample with `local.xz + 0.5`.
  - Fade by `dot(surfaceNormal, decalUp)` from `getNormalFromDepth` or by box height.
  - Ortho bonus for Wronski's mip problem: in an orthographic view, world units per pixel are constant, `(top − bottom)/zoom/viewportHeight`, so compute LOD analytically and sample with `.level()`/`textureLod`. Equivalently, compute analytic gradients from the camera basis for anisotropic filtering. That is temporally stable and immune to depth discontinuities.
  - WebGL caveat: the depth texture being sampled must not be the one attached to the framebuffer being drawn into. Use the resolved depth texture of an MSAA scene target, or a copy.
  - TSL caveat: don't use `PassNode.getViewZNode()`/`getLinearDepthNode()` with the ortho camera, because they assume perspective in r180 and r186. Use `orthographicDepthToViewZ` or `getViewPosition`.
- **Budgets:**
  - Pool decals in one `InstancedMesh` or `BatchedMesh` with a ring buffer of N (e.g. 256 box decals) and recycle the oldest first. Drive fade-out with a per-instance attribute; BatchedMesh gains per-instance opacity natively in r183.
  - Sorting is unnecessary if decals use premultiplied/max blending and are drawn in spawn order. Persistent blood and scorch belong in the paint target, which has a fixed cost regardless of count.
  - Keep `DecalGeometry` only for rare, large, static hero decals on small meshes, given its CPU clip per triangle and one draw call per decal.

### Gaps
- No open-source three.js or TSL screen-space/box decal implementation was found. Usnul's is closed and Fyrestar's is unreleased. No GPU timings for any three.js decal approach were found.
- Not verified: WebGL2 feedback-loop rules when sampling a depth texture while the same texture is attached with `depthWrite: false`. Assume it is invalid and use a copy or resolve.
- Not verified: how WebGPURenderer's `viewportDepthTexture()` behaves when the scene pass is MSAA (`antialias: true`).
- No three.js-specific camera-following paint or trail implementation was found; the Kodeco Unreal tutorial is the cited mechanism.

## 3. Water and wetness for a top-down camera: flow maps, depth-based absorption/refraction (TSL and WebGL), fixed-camera highlights, rain ripples, Lagarde wet-surface parameters on MeshStandardMaterial

### Takeaway
For a fixed iso camera:
- Use Water2's two-phase flow-map cross-fade on normals, but drop its Reflector and Refractor render targets.
- Take refraction and absorption from the opaque scene's own colour and depth: TSL `viewportSharedTexture`/`viewportDepthTexture`, or a copied backdrop plus depth texture on WebGL.
- Rescale depth thresholds for the ortho camera. Its linear depth spans `far − near = 900` world units, so constants tuned in the perspective examples are wrong by orders of magnitude.
- Wetness is a few lines on `MeshStandardMaterial`, from Lagarde's published constants.
- Rain ripples are one shared procedural normal map (0.14 ms at 256² on PS3) applied only where water accumulates.

### Cited Findings
- r180 `Water2` flow maps:
  - Optional `flowMap` (`USE_FLOWMAP`), otherwise a constant `flowDirection` (1, 0); `flowSpeed` 0.03, `reflectivity` 0.02, `scale` 1, two normal maps.
  - `cycle = 0.15`, `halfCycle = cycle*0.5`. The CPU advances `flowMapOffset0 += flowSpeed*delta` and keeps `flowMapOffset1` half a cycle apart, wrapping both.
  - The shader samples `texture2D(tNormalMap0, vUv*scale + flow*flowMapOffset0)` and `…1`, mixed with `flowLerp = abs(halfCycle - flowMapOffset0)/halfCycle`, where `flow = texture2D(tFlowMap, vUv).rg*2.0-1.0; flow.x *= -1.0`.
  - It creates `Reflector` and `Refractor` children with their own render targets (default 512²). Fresnel is Schlick: `reflectivity + (1-reflectivity)*pow(1-theta, 5)`.

  — [Water2.js r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/objects/Water2.js)
- r180 `webgpu_backdrop_water` (TSL):
  - `depthWater = viewportLinearDepth.sub( depth )`, where `depth = linearDepth()` of the water fragment; `depthEffect = depthWater.remapClamp( -.002, .04 )`.
  - Refraction: `refractionUV = screenUV.add( vec2( 0, waterIntensity.mul( .1 ) ) )`, then `depthTestForRefraction = linearDepth( viewportDepthTexture( refractionUV ) ).sub( depth )` and `finalUV = depthTestForRefraction.lessThan( 0 ).select( screenUV, refractionUV )` to reject foreground leaks, then `viewportSharedTexture( finalUV )`.
  - `waterMaterial.backdropAlphaNode = depthRefraction.oneMinus()`. Ripples come from two `mx_worley_noise_float` layers over `positionWorld`.

  — [webgpu_backdrop_water r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_backdrop_water.html)
- r180 depth conversions in `ViewportDepthNode`: `orthographicDepthToViewZ = (near − far)·depth − near` and `perspectiveDepthToViewZ = near·far / ((far − near)·depth − far)`. The `LINEAR_DEPTH` scope with a value node converts only for perspective cameras ("Any other camera passes the value through unchanged"). Without a value node it uses `viewZToOrthographicDepth(positionView.z)`. `viewportLinearDepth = linearDepth( viewportDepthTexture() )` — [ViewportDepthNode r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/display/ViewportDepthNode.js)
- The WebGL transmission path in r180: `renderTransmissionPass` re-renders `opaqueObjects` into a `transmissionRenderTarget`. That target has `samples: 4`, is HalfFloat when available, uses `generateMipmaps: true` with `LinearMipmapLinearFilter`, and is sized by `transmissionResolutionScale` (default 1). `copyFramebufferToTexture( texture, position = null, level = 0 )` exists — [WebGLRenderer r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/WebGLRenderer.js)
- Diablo IV's GDC 2024 talk "H2O in H3LL: The Various Forms of Water in Diablo IV" (Aaron Aikman) covers shorelines, accumulating puddles, Helltide rivers and icy caves, plus "the trade-offs of deferred-rendered water and avoiding highlights that clash with the fixed camera angle" and shaping waves through terrain. It is paywalled, abstract only — [GDC schedule](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730) (search snippet); [GDC Vault](https://gdcvault.com/play/1034490/Technical-Artist-Summit-H2O-in)
- Lagarde wet surfaces (Water drop 3b, 2013):
  - `factor = lerp(1, 0.2, Porosity)`; `Diffuse *= lerp(1.0, factor, WetLevel)`; `Gloss = lerp(1.0, Gloss, lerp(1, factor, 0.5 * WetLevel))`.
  - Porosity without a mask: `saturate(-2.5 * Gloss + 1.25)`. For metals and smooth materials: `factor = lerp(1, 0.2, (1 - Metalness) * Porosity)`.
  - Water F0 0.02 vs 0.04 is "not visible enough in game"; water gloss = 1.0.
  - Puddles: a thin layer slightly smooths normals and boosts specular. Full flooding flattens the normal toward the vertex normal and blends to water properties, with `AccumulatedWater` driven by heightmap or vertex colour.

  — [Lagarde 3b](https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/)
- Lagarde rain ripples (Water drop 2b):
  - One ripple normal map is regenerated every frame and shared across the world. It is built from non-overlapping circles: R = inverted distance, GB = direction, A = random time offset.
  - Four layers fade in at quarter steps of rain intensity. Mipmaps were "not fully satisfactory".
  - Ripples appear only where water has accumulated (`AccumulatedWater`), and a vertex-colour mask keeps them off vertical surfaces.
  - Rain occlusion uses a top-down 256² depth map.
  - Costs at 720p (PS3/X360): ripple texture generation 0.14/0.15 ms, depth map ~0.32/0.20 ms, total "rain core" ~2.8/2.86 ms against a stated 3 ms budget at 30 fps.

  — [Lagarde 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)
- In the r180 standard/physical fragment shader the includes run in this order: `map_fragment` → `color_fragment` → `roughnessmap_fragment` → `metalnessmap_fragment` → `normal_fragment_begin` → `normal_fragment_maps` → `clearcoat_normal_fragment_begin` — [meshphysical.glsl.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/shaders/ShaderLib/meshphysical.glsl.js). `normal_fragment_begin` declares `vec3 nonPerturbedNormal = normal;` — [normal_fragment_begin r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js)
- r181–r186 water-related lines:
  - r181: WaterMesh resolution scale fix (#32056)
  - r183: Water/WaterMesh "Improve realism" (#32681); HalfFloat reflection RT (#32678); `viewportSharedTexture()` perf fix in Line2NodeMaterial (#32639); ViewportTextureNode update type RENDER (#32664); reversed-depth support in viewZ functions (#33001)
  - r184: ViewportDepthTextureNode framebuffer caching fix (#32690)
  - r185: Water2Mesh "Simplify `flowMap` setup" (#33540)
  - r186: "Optimize backdrop water demo" (#34086)

  — [r181](https://github.com/mrdoob/three.js/releases/tag/r181); [r183](https://github.com/mrdoob/three.js/releases/tag/r183); [r184](https://github.com/mrdoob/three.js/releases/tag/r184); [r185](https://github.com/mrdoob/three.js/releases/tag/r185); [r186](https://github.com/mrdoob/three.js/releases/tag/r186)

### Inferences
- **Ortho depth scaling (critical):**
  - For an orthographic camera, both `viewportLinearDepth` and `linearDepth()` are linear depth normalised over `far − near`, which is 900 for the lab.
  - The example's `remapClamp(-.002, .04)` therefore means -1.8 m to 36 m of water. Write thickness in metres instead: `thickness = viewportLinearDepth.sub(linearDepth()).mul(cameraFar.sub(cameraNear))`, then `absorb = exp(-sigma_rgb * thickness)` with sigma in 1/m, and remap foam/shore over 0–0.3 m.
  - The orthographic formulas are linear, so a negative near (−300) is fine as long as the same `cameraNear`/`cameraFar` uniforms feed the projection.
- **TSL recipe (WebGPU):**
  1. Water is a transparent `MeshBasicNodeMaterial` or `MeshStandardNodeMaterial`.
  2. Normal from two flow-mapped normal-map phases (Water2 math) plus a small noise layer.
  3. Refraction UV = `screenUV + normal.xz * k * saturate(thickness / 0.5 m)`, with the example's depth-test fallback for foreground leaks.
  4. Colour = `mix(backdrop * absorb, deepColor, 1 − exp(−thickness·k2))`.
  5. Specular from a single artist-controlled light vector (see below) and a dim probe.
- **WebGL recipe:**
  - Don't use `MeshPhysicalMaterial.transmission` for water. It forces a second full opaque render into a 4× MSAA mipmapped target.
  - After the opaque pass, copy the lab's HDR scene target to a (½-res) backdrop texture, by blit or a full-screen copy pass. Then draw water sampling backdrop + scene depth, with `#include <packing>` and `orthographicDepthToViewZ`.
  - With MSAA, copy from the resolved target, since `copyTexSubImage2D` cannot read a multisampled framebuffer.
- **Fixed-camera highlights:**
  - With a constant view vector, a moon or sun specular on flat water lands on a fixed screen band and does not move as the player walks.
  - Options: compute water specular from a separate "water light" direction tuned per scene so the glint sits off the gameplay focus; clamp specular intensity; drive it with flow-noise normals so it breaks up and moves with the current; rely on a low-intensity probe for sheen.
  - This is my inference from the D4 abstract; the talk's actual solution is unknown.
- **Rain ripples in three.js:** render Lagarde's ripple map once per frame into a 256² RT with a full-screen pass, or bake a 16–32-frame tiling ripple flipbook, which is cheaper. Sample it in the terrain/ground shader only where `puddleMask > 0` (from the paint target's B channel or the height-flood rule) and only on upward-facing normals.
- **Wet `MeshStandardMaterial` via `onBeforeCompile` (WebGL):**
  - Inject after `#include <metalnessmap_fragment>`, which comes after `map_fragment` and `roughnessmap_fragment` in the standard fragment shader, so `diffuseColor`, `roughnessFactor` and `metalnessFactor` all exist there:
    ```glsl
    float gloss = 1.0 - roughnessFactor;
    float porosity = clamp(-2.5 * gloss + 1.25, 0.0, 1.0) * (1.0 - metalnessFactor);  // Lagarde 3b
    float f = mix(1.0, 0.2, porosity);
    diffuseColor.rgb *= mix(1.0, f, uWet);
    gloss = mix(1.0, gloss, mix(1.0, f, 0.5 * uWet));
    roughnessFactor = mix(1.0 - gloss, 0.03, uPuddle);   // puddle: water-smooth
    ```
  - For puddles, flatten the normal toward the geometric normal after `normal_fragment_maps` with `normal = normalize(mix(normal, nonPerturbedNormal, uPuddle))`. `nonPerturbedNormal` is declared in r180's `normal_fragment_begin`, which runs before `normal_fragment_maps`.
  - TSL equivalent: `colorNode = base.mul(mix(1, f, wet))`, `roughnessNode = …`, `normalNode = mix(mappedNormal, normalView, puddle)`. `wet`/`puddle` come from a uniform, the paint target or the height-flood test.

### Gaps
- Diablo IV's actual water and highlight techniques: GDC Vault is paywalled, so only the abstract is known.
- Rain-occlusion maps and wet propagation for an iso view were not researched beyond Lagarde.
- No measured three.js cost for `viewportSharedTexture` copies, or for the WebGL transmission pass at 1440p, was found.
- The onBeforeCompile wet-material snippet is untested; the chunk order and `nonPerturbedNormal` were checked against r180 source, but not the compiled result.

## 4. VFX: half/quarter-res particles with depth-aware upsampling and edge fix-up, soft particles (r186 node and WebGL), stateless vertex-shader particles vs TSL compute, three.quarks / three-nebula status, six-way smoke, motion-vector flipbooks, shared distortion buffer

### Takeaway
- **Reduced-resolution particles:** the canonical recipe (GPU Gems 3 ch. 23) combines a max-of-4 depth downsample, soft particles in the low-res pass, separate-alpha compositing and a Sobel/stencil full-res edge fix-up. It doubled frame rate at 1600×1200 (25 → 51 fps with 4×4 mixed). three.js has no example of it.
- **Soft particles:** r186's new `softParticles()` TSL helper assumes a perspective camera, so the lab must use its own 3-line orthographic version, which also works on r180 and in GLSL.
- **Stateless particles:** these already exist in r180 as `webgpu_particles` (`range()` + `time` + instancing, no compute) and port directly to GLSL instancing, which makes them the one particle path that runs everywhere. TSL compute (`instancedArray`, `Fn().compute()`) is WebGPU-first; the WebGL2 fallback uses transform feedback.
- **Libraries:** three.quarks is still WebGL-only (0.17.1 needs three ≥0.182; WebGPU is on its roadmap as not done). three-nebula 13.3 has a `./webgpu` single-draw instanced renderer tested on three 0.185.1.

### Cited Findings
- **GPU Gems 3 ch. 23 "High-Speed, Off-Screen Particles" (Cantlay):**
  - Point-sampled depth downsampling causes halos. Taking the maximum of 4 depth samples shrinks silhouettes so particles extend into solid geometry ("no physical or theoretical basis").
  - Soft particles: `zFade = saturate(scale*(myDepth − sceneDepth))`.
  - Edge fix-up: a Sobel filter on the low-res colour/alpha builds a stencil mask, and particles are re-rendered at full res only on edges.
  - Blending: colour SrcAlpha/InvSrcAlpha, alpha Zero/InvSrcAlpha (accumulating ∏(1−α)), cleared to black. Additive particles just add.
  - Measured (GeForce 8800 GTX, 1600×1200, 73-instruction shader): high-res 25 fps; mixed 4×4 51; low-res max-z 4×4 61; mixed 2×2 44; low-res 2×2 46. At ~3.5 M high-res pixels, high-res (64.4) slightly beats mixed (63.3), so overhead wins for small effects.
  - Artefacts: residual halos, missed thin features, fuzzier high frequencies.

  — [GPU Gems 3 ch. 23](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles)
- NVIDIA's Particle Upsampling sample renders particles into a lower-resolution surface. It downsamples depth with a point filter (`GL_EXT_framebuffer_blit`), uses depth textures for "a soft depth test" and a depth-aware filter, and calls its upsample "cross-bilateral". No filter details or timings are given — [NVIDIA sample](https://archive.docs.nvidia.com/gameworks/content/gameworkslibrary/graphicssamples/opengl_samples/particleupsamplingsample.htm)
- Nearest-depth upsampling is described in NVIDIA's opacity-mapping whitepaper and forum threads: naive upsampling "inevitably creates blocky artifacts where opaque geometry is in front of the particles" — [Khronos forum](https://community.khronos.org/t/nearest-depth-upsampling/71981) (search snippet); [NVIDIA whitepaper](https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/OpacityMappingSDKWhitePaper.pdf) (search snippet, not fetched)
- No three.js example combines a low-res particle target with depth-aware upsampling (search result) — [discourse soft particles perf](https://discourse.threejs.org/t/soft-particles-rendering-performance/27610) (search snippet)
- Unity HDRP has a separate "Low Resolution Transparent" pass ("perform a low resolution render pass") and a Distortion pass ("causes HDRP to calculate a distortion pass") as frame settings (HDRP 7.1.8 docs) — [HDRP Frame Settings](https://docs.unity3d.com/Packages/hdrp/manual/Frame-Settings.html)
- r180 `PassNode`:
  - `setResolution()` scales the internal target, so `setResolution(0.5)` gives half size. Its HalfFloat target with `samples = options.samples ?? renderer.samples` and a `DepthTexture` attached.
  - `setLayers(layers)` filters objects.
  - In r181 `setResolution` was deprecated in favour of `setResolutionScale()`.

  — [PassNode r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/display/PassNode.js); [PassNode r186](https://github.com/mrdoob/three.js/blob/r186/src/nodes/display/PassNode.js)
- r185–r186 render-target and MSAA lines:
  - r185: RTTNode `setResolutioScale()` (#33606); TSL `textureGather` (#33475)
  - r186: "Don't use MSAA for fullscreen-passes" (#33936); RTTNode `autoUpdate`, `resolutionScale` (#34307); "Support shared depth texture between multiple passes" (#34042)

  — [r185](https://github.com/mrdoob/three.js/releases/tag/r185); [r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **r186 `softParticles()`:** TSL in `examples/jsm/tsl/utils/SoftParticles.js`, based on the NVIDIA white paper, merged 28 June 2026, with example `webgpu_particles_soft` — [PR #33887](https://github.com/mrdoob/three.js/pull/33887)
  - Signature: `softParticles({ opacity = float(1), distance = 1, contrast = 2, viewportDepth = viewportDepthTexture() })`, returning an opacity node.
  - It computes `sceneViewZ = perspectiveDepthToViewZ(viewportDepth, cameraNear, cameraFar)` and `saturate((positionView.z − sceneViewZ)/distance)`, then applies a symmetric contrast curve. There is "no orthographic branch".

  — [SoftParticles.js r186](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/tsl/utils/SoftParticles.js)
- The example uses `mix(baseOpacity, softParticles({ opacity: baseOpacity, distance: softDistance, contrast: softContrast }), softEnabled)` with a PerspectiveCamera, `antialias: true` and direct `renderer.render` — [webgpu_particles_soft r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_particles_soft.html)
- **Stateless TSL particles in r180 (`webgpu_particles`):**
  - `SpriteNodeMaterial` with `positionNode = offsetRange.mul(lifeTime)`, `scaleNode`, `opacityNode` and `colorNode` driven by `range()` (per-instance random) and `time`.
  - Instancing via `mesh.count` (2000 smoke, 1000 fire). No compute and no soft particles.

  — [webgpu_particles r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_particles.html)
- **TSL compute particles in r180 (`webgpu_compute_particles`):**
  - `instancedArray(particleCount, 'vec3')` for positions, velocities and colours; `Fn(() => {...})().compute(particleCount)`; `renderer.computeAsync(...)`.
  - The render material uses `material.positionNode = positions.toAttribute()` and `colors.element(instanceIndex)`.
  - The code has 200,000 particles; the page heading says 500k.

  — [webgpu_compute_particles r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_compute_particles.html)
- r180 `WebGLBackend.compute()` (WebGPURenderer's WebGL2 fallback) runs compute as a point draw with `gl.beginTransformFeedback(gl.POINTS)` … `gl.RASTERIZER_DISCARD`, capturing outputs to buffers and swapping dual buffers — [WebGLBackend r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgl-fallback/WebGLBackend.js)
- r181–r186 compute and particle lines:
  - r181: BitonicSort addon (#31852); `dispatchWorkgroupsIndirect` (#31488)
  - r183: SpriteSheetUVNode transformed to a TSL function, fixing `countNode` access (#32693)
  - r186: `billboarding()` `horizontalRotation` (#34197); read_write storage and atomics allowed in non-compute stages (#33626); `compileComputeAsync()` (#32551); OITPassNode (#34253)

  — [r181](https://github.com/mrdoob/three.js/releases/tag/r181); [r183](https://github.com/mrdoob/three.js/releases/tag/r183); [r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- **three.quarks:**
  - npm latest 0.17.1, peer `three >=0.182.0`, MIT, entry `three.quarks.esm.js`, no WebGPU/TSL keywords — [npm](https://registry.npmjs.org/three.quarks/latest)
  - README: batched rendering, trails, mesh particles, visual editor (quarks.art). The roadmap lists "WebGPU rendering support" as not done. A separate `quarks.nodes` package is "Experimental node-based VFX with … WebGPU compute support" — [three.quarks](https://github.com/Alchemist0823/three.quarks)
- **three-nebula:**
  - npm 13.3.0, peer `three >=0.122.0 <1.0.0`, description still "WebGL based 3D particle engine", with a `./webgpu` export (`three-nebula-webgpu.mjs`) — [npm](https://registry.npmjs.org/three-nebula/latest)
  - README: the optional `GPURenderer` at `three-nebula/webgpu` "draws every particle as a camera-facing instanced quad in a single draw call" and packs textures into an atlas. It imports `three/webgpu` and `three/tsl` and needs roughly r167+; built and tested against three 0.185.1; MIT.
  - Simulation runs from JS `tick()` with `fixedTimeStep` 1/60 and `maxSubSteps` 6.

  — [three-nebula](https://github.com/creativelifeform/three-nebula)
- **Six-way lighting (Unity VFX Graph):**
  - Two RGBA textures. Lightmap A = R right, G top, B back, A transparency. Lightmap B = R left, G bottom, B front, A emissive — [Unity docs](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/six-way-lighting.html)
  - At runtime each light's direction relative to the particle blends the maps; area lights use a Most Representative Point; probes are evaluated in the vertex shader; smoke is fully diffuse (no reflection-probe specular).
  - Cost is "comparable to a traditional lit sprite".
  - Authoring: a Houdini HDA (OpenGL ROP "very fast", or Karma), the Blender add-on `unity_6way.py`, EmberGen's "Six point" render (not officially supported), and baking six renders under white directional lights relative to the camera.

  — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph)
- No three.js six-way implementation was found by search — [search: Unity docs/O3DE results only](https://www.docs.o3de.org/docs/learning-guide/tutorials/rendering/six-point-lighting-tutorial/) (search snippet)
- **Motion-vector flipbooks:** blending "is not special, it blends 2 frames using motion vectors to distort UVs", and quality depends on the baked vectors — [polycount](https://polycount.com/discussion/comment/2762047) (search snippet). Houdini Labs Motion Vector shader: distortion multiplier "Generally this should be 1 / $FPS" — [SideFX docs](https://sidefx.com/docs/houdini/nodes/shop/labs--motionvector_shader.html) (search snippet)

### Inferences
- **Half-res particles in the lab (both backends):**
  1. After opaque (and its MSAA resolve), run a ½-res (or ¼) pass that writes max-of-4 depth into an R16F/R32F target. GLSL: four `texelFetch`. TSL: four `.load()` on r180, or one `textureGather` from r185. The lab's depth convention means larger = farther, so "max" keeps the far sample, as in GPU Gems.
  2. Render particles into a ½-res HalfFloat RGBA target with `samples: 0`, depth test off in hardware, and a soft test against the downsampled depth in the shader.
  3. Composite with premultiplied colour and accumulated transmittance (GPU Gems blend: `CustomBlending`, colour `One/OneMinusSrcAlpha`, alpha `Zero/OneMinusSrcAlpha`, clear (0,0,0,1)).
  4. Upsample with nearest-depth. Fetch the 4 low-res depths around a full-res pixel; if all are within a threshold (e.g. 0.5 m in ortho view-Z), use bilinear, else take the colour of the depth-nearest sample.
  5. Optionally add the Sobel-edge mask and full-res re-render only for large, hard-edged effects. GPU Gems shows the overhead loses on small effects, so gate it by on-screen particle area.
  - On WebGPU, `PassNode.setResolution(0.5)` (renamed `setResolutionScale` in r181) with `setLayers(VFX_LAYER)` gives the low-res target, but its depth buffer is its own. Keep the soft test against the downsampled scene depth.
- **Ortho soft particles (all versions):**
  - TSL: `opacityNode = base.mul(saturate(positionView.z.sub(orthographicDepthToViewZ(viewportDepthTexture(), cameraNear, cameraFar)).div(fade)))`. All of these nodes exist in r180, so this is a backport-free "softParticles for ortho". Do not use r186 `softParticles()` as is: it calls `perspectiveDepthToViewZ`.
  - GLSL: `#include <packing>` then `float sceneZ = orthographicDepthToViewZ(texture(tDepth, uvScreen).x, cameraNear, cameraFar); float fade = clamp((vViewZ - sceneZ) / uFade, 0.0, 1.0);`.
  - Ortho depth is linear, so precision is uniform (24-bit over 900 m ≈ 0.05 mm steps).
- **One particle path for both backends:**
  - Stateless particles: per-instance attributes `spawnTime`, `seed`, `emitterId`; age = `time − spawnTime`; position, size, colour and frame are analytic functions of (age, seed); dead instances collapse to zero area.
  - In GLSL this is `InstancedBufferGeometry` plus a `ShaderMaterial`. In TSL it is `SpriteNodeMaterial` with `instancedBufferAttribute()` and `range()`, as `webgpu_particles` shows.
  - Spawning means writing a ring-buffer range of the attributes (`addUpdateRange`), with one draw per blend mode, using an atlas.
  - This replaces three.quarks for most ARPG bursts (hits, sparks, embers, dust) and leaves TSL compute for WebGPU-only heavy systems (rain fields, swarms). Compute could then use r181's BitonicSort for back-to-front order.
- **Six-way smoke in three.js:**
  - Two RGBA flipbooks (Unity packing). In the fragment shader, express the light direction in billboard space (camera right, up, toward-camera) and weight the maps: `R=max(L.x,0)`, `Le=max(−L.x,0)`, `T=max(L.y,0)`, `Bo=max(−L.y,0)`, `F=max(L.z,0)`, `Ba=max(−L.z,0)`. Sum `w·map` per light, add an ambient term from the averaged maps, and drive emission from B.a. The exact Unity weighting is unpublished; this is a common-sense formulation.
  - Iso shortcut: the camera and moon are fixed per scene, so for non-dynamic lights the six-way result can be pre-collapsed offline into one lit flipbook per lighting mood. Keep runtime six-way for spell-light reactivity.
- **Motion-vector flipbooks:**
  - `t = fract(frame)`; `uvA' = uvA − mv(uvA)·t·s`; `uvB' = uvB + mv(uvB)·(1−t)·s`; `color = mix(A(uvA'), B(uvB'), t)`, with s ≈ 1/FPS per SideFX.
  - On r180 TSL, `spritesheetUV`/SpriteSheetUVNode gives frame UVs (its `countNode` access was fixed in r183). GLSL needs a few lines of atlas math.
  - It halves the frame count for the same smoothness, and sheets should stay square, per the RealtimeVFX bug reports.
- **Shared distortion buffer:**
  - Render all heat-haze, shockwave and portal-warp sprites into one ½-res RG16F target, signed offsets with additive blending, then apply once in the final pass as `scene.sample(uv + offset)`.
  - Cost: one extra texture in post and zero per-effect scene copies. It works identically on both backends. On WebGPU use `pass(vfxScene).setLayers(DISTORT).setResolution(0.5)`; on WebGL an extra `RenderTarget`.
  - This matches HDRP's separate distortion pass.

### Gaps
- No three.js or TSL implementation of half-res particles with depth-aware upsampling was found. The NVIDIA nearest-depth whitepaper was not fetched, so its exact threshold logic is unverified.
- No measured WebGL/WebGPU costs for half-res particle passes, soft particles or stateless vs compute particles in three.js were found.
- Not verified: how the WebGL2 fallback compute handles `instancedArray` writes beyond attributes (storage textures, atomics); transform feedback suggests attribute-only.
- three.quarks: no date for when WebGPU support might land; `quarks.nodes` maturity not assessed.
- Six-way: no three.js implementation and no published Unity weighting formula.
- Motion-vector sources are community forums (search snippets).

## 5. Crowds: vertex animation textures (OpenVAT, SideFX Labs, Blender VAT toolkit), InstancedMesh + VAT shaders, baked bone-texture instanced skinning, instanced skinned-mesh libraries, animation LOD, measured costs with hundreds of monsters

### Takeaway
With hundreds of `SkinnedMesh`es, three.js becomes CPU-bound (mixer, skeleton and matrix work) well before the GPU limits:
- 25-bone, 700-vertex units fall below 60 fps past about 200 meshes on a 2015 laptop CPU.
- Throttling animation to every 4th frame gives 500 meshes at 60 fps, and shared skeleton pools give 1000.

The scalable paths remove per-instance CPU animation:
- **VAT:** positions per frame; best for small, short loops.
- **Baked bone-matrix textures:** frames × bones, sampled in the vertex shader, with per-instance clip/phase attributes.

Both run on WebGL2 and WebGPU. Ready-made pieces:
- `InstancedMesh.setMorphAt`, built in, but CPU-sampled per instance.
- InstancedMesh2 (MIT): per-instance bone texture, but the CPU still computes the matrices.
- r185's `webgpu_skinning_instancing_individual`: compute skinning reused by shadows, WebGPU only.
- manthrax/three-vat and vat3-wgsl-ts, for Houdini/Blender VATs.

### Cited Findings
- **OpenVAT (Luke Stilson):** a Blender add-on, 1.1.2, Blender 4.2+ and 5.x. The core is GPL-3.0 and the `OpenVAT-Engine_Tools` are MIT.
  - Encodes position and normal (packed rows or a separate texture) or custom attributes, as PNG 8/16-bit or EXR16 (half, ZIP) / EXR32 ("only format that supports absolute values").
  - Exports a `*-remap_info.json` with per-channel min/max plus clip names, frame ranges, fps and loop flags, and FBX or glTF meshes.
  - Engine paths cover Unity (best documented), Unreal 5 (forward rendering, RGB16) and Godot. There is no three.js mention.

  — [OpenVAT](https://github.com/sharpen3d/openvat)
- **Vertex Animation Toolkit (Blender extension by Flement, GPL-3.0+, 1.0.12, Blender 4.2+):** "Tested with three.js".
  - Track A: `positions.exr` (half-float) or PNG plus `normals.png` and a `.glb`; it "ports to any engine with vertex texture fetch".
  - Track B: a gzipped `.bin` + JSON for storage buffers (u8/u16/f32 offsets, oct normals), WebGPU only.

  — [Blender extensions](https://extensions.blender.org/add-ons/vat/)
- **SideFX Labs VAT 3.0:** Soft-Body, Rigid-Body, Dynamic Remeshing (fluid) and Particle Sprites modes.
  - Textures: Position (+ Position 2 for split 8-bit precision), Rotation (replacing Normal; normals + tangents), Color and Lookup.
  - "Select 'HDR' if your performance budget can afford it." "Export Compressed Normals in Position Alpha" gives "medium-quality normals".
  - Max points per frame = target width × 1980. "You normally do not need to pad animation textures to powers of two."

  — [SideFX VAT 3.0](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.0.html)
- **three.js VAT runtimes:**
  - manthrax/three-vat plays Houdini VAT2/VAT3-style soft, fluid, rigid and particle data (and an OpenVAT-style sample) by patching standard materials via `onBeforeCompile`, with per-instance `setInstanceTimeOffset()`/`setInstanceSpeedScale()`; no license is shown — [three-vat](https://github.com/manthrax/three-vat)
  - floating-world-lda/vat3-wgsl-ts (MIT, 2026) supports Softbody, Rigidbody, DynamicMesh and Particles, with "TSL/WebGPU shader implementations" for three.js and Babylon — [vat3-wgsl-ts](https://github.com/floating-world-lda/vat3-wgsl-ts)
  - Its author doesn't intend to support WebGL. Interpolation smooths low-fps exports except fluids, and the animation data can be 32-bit float with 8-bit colour — [discourse](https://discourse.threejs.org/t/houdini-vertex-animation-textures-vat-3-0-for-wgsl/92245)
- **Built-in per-instance morph animation:** r180 `webgl_instancing_morph` creates `InstancedMesh(dummy.geometry, dummy.material, 1024)` (Horse.glb). Each frame it does `mixer.setTime(time + timeOffsets[i]); mesh.setMorphAt(i, dummy)` for all 1024 instances, then `mesh.morphTexture.needsUpdate = true` — [webgl_instancing_morph r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_instancing_morph.html). `webgpu_instancing_morph` exists in r180 — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- r180 `webgpu_skinning_instancing` hand-sets `child.isInstancedMesh = true`, `instanceMatrix` and `count = 30` on a `SkinnedMesh`, so all instances share one skeleton and one pose — [webgpu_skinning_instancing r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_skinning_instancing.html)
- **r185 `webgpu_skinning_instancing_individual` (#33644):** "computes per-instance skinned positions/normals into storage buffers before rendering", so beauty and shadow passes reuse the result.
  - The CPU still sets the mixer to `elapsed + timeOffsets[i]` per instance and copies bone matrices into one storage buffer at `i * boneCount * 16`.
  - Compute dispatches `instanceCount * vertexCount` threads, and the render mesh reads `vertices.element(...)` via `positionNode`/`normalNode`.
  - 30 instances; no WebGL2 fallback.

  — [PR #33644](https://github.com/mrdoob/three.js/pull/33644); [example r186](https://github.com/mrdoob/three.js/blob/r186/examples/webgpu_skinning_instancing_individual.html)
- r186 "Nodes (Skinning): Support bone counts exceeding UBO limit" (#34200) — [r186](https://github.com/mrdoob/three.js/releases/tag/r186). r183 "Consider skinning / instancing when sorting objects" (#28125); InstanceNode velocity (#32586) — [r183](https://github.com/mrdoob/three.js/releases/tag/r183). r185 "Fully support `InstancedMesh` with render bundles" (#33839) — [r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- **InstancedMesh2 (@three.ez/instanced-mesh, MIT):**
  - Features: per-instance frustum culling (optional BVH), sorting, visibility and opacity, per-instance uniforms, LOD and shadow LOD, skinning; WebGPU not mentioned — [instanced-mesh](https://github.com/agargaro/instanced-mesh)
  - Skinning allocates `new SquareDataTexture(Float32Array, 4, 4 * bones.length, capacity)`.
  - `setBonesAt(id)` recomputes each bone's world matrix on the CPU, writes `matrixWorld × boneInverse` into the texture with a hand-unrolled multiply, and calls `enqueueUpdate(id)` for partial upload.
  - Cost scales with instances × bones.

  — [Skeleton.ts](https://github.com/agargaro/instanced-mesh/blob/master/src/core/feature/Skeleton.ts)
- **Measured numbers (discourse, Nov–Dec 2023), units of 700 vertices / 900 triangles / 25 bones:**
  - Frames "start dropping below 60, after the number of Skinned Meshes exceeds 200" on an i7-4720HQ, and three CPU culprits take 75% of the scene's CPU work.
  - Updating animation every 4 frames gives "500 Skinned Meshes on the screen at 60fps".
  - A shared-skeleton manager gives "1000 animated skinned meshes … w 60fps" on a low-end laptop.
  - luisherasme's instanced skinned mesh went from 10 fps to 144 fps at 2,000 instances after throttling and instancing. Another user saw 5 fps (Firefox) and 10 fps (Chrome) at 2000.
  - WebAssembly made it worse.

  — [discourse 58196](https://discourse.threejs.org/t/optimization-of-large-amounts-100-1000-of-skinned-meshes-cpu-bottlenecks/58196)
- **Bone-texture atlas (Fyrestar, discourse):** "Essentially a texture atlas for the bone texture", with frame lerp and bone LOD (LOD0 67 bones, 32×32 texture, 1 MB; LOD1 14 bones, 8×8, 0.0625 MB; 256 instances per LOD). "100 bones, 100 meshes would already take up a 400x400 32bit texture that is uploaded every frame" — [discourse 41958](https://discourse.threejs.org/t/animated-instanced-skinned-meshes-gltf/41958)
- **Procedural crowd extreme:** one merged geometry in one InstancedMesh with shader LOD and frame-spread updates; "sub-2 ms GPU and ~0.1 CPU up to 100,000 people". This is shader-animated, not skeletal, and the hardware is unspecified — [discourse 89928](https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928)
- **Babylon.js baked texture animations, as a design reference:** per-instance `Vector4(from, to, offset, fps)`, half-float baking when supported, "You cannot blend animations", no interpolation between frames, bake offline and load JSON — [Babylon docs](https://doc.babylonjs.com/features/featuresDeepDive/animation/baked_texture_animations)
- r180 `LOD.update` computes `distance = cameraPos.distanceTo(objectPos) / camera.zoom` with optional hysteresis and no orthographic special-case — [LOD.js r180](https://github.com/mrdoob/three.js/blob/r180/src/objects/LOD.js)

### Inferences
- **Tiering for an iso ARPG:**
  - Heroes, bosses and elites: `SkinnedMesh` + `AnimationMixer` (blending, IK, attachments).
  - Normal monsters (hundreds): baked bone-matrix texture + `InstancedMesh`, one draw per monster type, per-instance attribute `(clipStartRow, clipLength, phase, speed)`.
  - Tiny swarm critters and cloth/flags: VAT.
  - Corpses: freeze to a last-frame pose (attribute) and cull from animation entirely.
- **Memory arithmetic** (my calculation, 4 clips × 30 frames = 120 frames):
  - Bone texture for a 30-bone monster: 30 × 4 texels × 120 frames = 14,400 RGBA32F texels ≈ 230 KB, independent of vertex count. Halved with RGBA16F if precision allows; test for joint jitter at large world coordinates.
  - VAT for a 1,500-vertex monster: 1,500 × 120 RGBA16F ≈ 1.4 MB position, plus normals ≈ 2.9 MB.
  - Bone textures win for anything humanoid. VAT wins for non-skeletal deformation.
- **Bone-texture shader (both backends):**
  - The vertex stage reads 4 bones × 4 texels × 2 frames = 32 fetches per vertex with frame lerp, or 16 without. Use nearest filtering and `texelFetch`/`.load()`.
  - With NearestFilter, three.js r180 WGSL emits no sampler binding for this texture (see §1.4), which helps the sampler budget.
  - WebGL: patch `MeshStandardMaterial` via `onBeforeCompile` (replace `skinning_pars_vertex`/`skinning_vertex` with texture-driven matrices indexed by `instanceAttr` + `skinIndex`), or write a `ShaderMaterial`.
  - TSL: compute `positionNode` from `skinIndex`/`skinWeight` attributes and `texture(boneTex).load(ivec2(...))`. Mind r185's "positionLocal no longer updates skinning" migration note from the first round.
- **Animation LOD with an ortho camera:**
  - All monsters on screen are the same pixel size, so distance LOD is meaningless. `LOD.update` divides camera distance by `zoom`, which is nearly constant across the view, so it effectively becomes zoom LOD.
  - Better levers: update CPU-animated (elite) skeletons at full rate only near the player or on screen, and every 2–4 frames otherwise (the measured 200 → 500 gain).
  - For GPU-baked monsters, animation costs no CPU. Reduce vertex work by switching to a lower-bone or lower-vertex geometry when zoomed out, and freeze offscreen instances.
- **Shadow cost:** baked-bone instancing re-skins in the shadow pass too. If the lab's baked moon shadow handles static geometry, give monsters a cheap shadow LOD (InstancedMesh2 has "Shadow LOD") or blob shadows when crowds exceed a threshold. r185's compute-skinning example shows that WebGPU can skin once and reuse for shadows.

### Gaps
- No controlled three.js benchmark of bone-texture or VAT instancing with hundreds of monsters (ms per frame on specified hardware) was found. All numbers are forum anecdotes, and the 2023 numbers predate r180.
- three-vat's license is not shown on its README. three-vat and vat3-wgsl-ts were not tested against r180.
- InstancedMesh2's WebGPU compatibility and version range were not stated.
- No source quantified the per-vertex cost of 16–32 texel fetches for bone-texture skinning on iGPUs.
- Unity Animation-Instancing's README lacks technique and performance details (only features: root motion, attachments, LOD, culling).

## 6. Damage numbers and world text on the GPU: instanced glyph-atlas quads, MSDF text (troika-three-text, three-msdf-text-utils), cost compared with DOM elements

### Takeaway
DOM damage numbers cost layout, paint and compositing per element. Chromium frame rates have been reported collapsing at around 50 HTML labels (anecdotal). Even ideal compositor-only animation (`transform`/`opacity`) burns layer memory.

On the GPU, the cheapest robust design is one instanced quad mesh drawn after tone mapping:
- Each instance is a glyph (digit, sign, crit marker) from a small MSDF or bitmap atlas.
- Animation (rise, scale-pop, fade) is evaluated in the vertex shader from a spawn time.
- The result is one draw call for all numbers on both backends.

troika's `BatchedText` (experimental, WebGL2-only) batches arbitrary text into one draw. three-msdf-text-utils 1.5 has a WebGPU `MSDFTextNodeMaterial`.

### Cited Findings
- Only `transform` and `opacity` animate on the compositor without layout and paint. Every promoted layer "requires memory and management, and that's not free", and the compositing target is "around 4-5ms" during critical interactions — [web.dev](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- Forum reports:
  - Chrome dropped below 5 fps with about 50 drei `Html` labels while Firefox was fine — [discourse](https://discourse.threejs.org/t/many-html-elements-from-three-js-fiber-drei-causes-low-framerate-in-chrome/28540) (search snippet)
  - CSS2DRenderer took "over 80%" of CPU on idle with many labels — [discourse](https://discourse.threejs.org/t/does-css2drenderer-ignore-automatrixupdate-false/67064) (search snippet)
- **troika-three-text 0.52.5 (MIT, peer three ≥0.125):**
  - Parses fonts with Typr and generates SDF glyphs on the fly into an atlas, in a web worker or on the GPU (`gpuAccelerateSDF`).
  - Has outline, stroke and blur options. `sync()` is async, and `preloadFont` pre-generates glyphs.
  - No WebGPU/TSL mention.

  — [npm](https://registry.npmjs.org/troika-three-text/latest); [troika-three-text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text)
- troika `BatchedText extends Text` "accepts any number of `Text` children and automatically batches them together to render in a single draw call":
  - 32 floats per member (matrix, bounds, clip rect, colour, opacity, stroke/outline) in a float `DataTexture` indexed by the `aTroikaTextBatchMemberIndex` attribute.
  - "NOTE: This only works in WebGL2 or where the OES_texture_float extension is available."
  - Marked `@experimental`, and member materials are ignored.

  — [troika esm bundle 0.52.5](https://unpkg.com/troika-three-text@0.52.5/dist/troika-three-text.esm.js)
- Each separate troika `Text` is its own draw call, so 100+ labels mean 100+ draw calls, and calling `.sync()` on hundreds causes frame drops. One suggested workaround, a shared canvas text layer, reached 140+ fps with 135 panels × 4 texts updated every second on an old machine — [discourse](https://discourse.threejs.org/t/100-dynamic-troika-three-text-labels-with-1s-updates/90287)
- **three-msdf-text-utils 1.5.0 (ISC, peer three ≥0.178):**
  - `MSDFTextGeometry` (BMFont layout with per-glyph `letterIndex`/`wordIndex`/`lineIndex` attributes for animation) and `MSDFTextMaterial`.
  - A `./webgpu` export with `MSDFTextNodeMaterial`.
  - Fonts are pre-generated with msdf-bmfont-xml (recommended) or at runtime (`generateMSDF`, worker + WASM).

  — [npm](https://registry.npmjs.org/three-msdf-text-utils/latest); [GitHub](https://github.com/leochocolat/three-msdf-text-utils)
- r180 has no WebGPU text, SDF or font examples (only WebGL TextGeometry/TTF examples) — [r180 files.json](https://github.com/mrdoob/three.js/blob/r180/examples/files.json)
- r181–r186 text lines: FontLoader text direction (r181, #31683); `HTMLTexture` (r184, #31233) and WICG HTML-in-Canvas signatures (r185, #33788). There is no GPU damage-number feature — [r181](https://github.com/mrdoob/three.js/releases/tag/r181); [r184](https://github.com/mrdoob/three.js/releases/tag/r184); [r185](https://github.com/mrdoob/three.js/releases/tag/r185)

### Inferences
- **Recipe (identical design on both backends):**
  - **Atlas:** an MSDF atlas of `0–9 + - ! K M` and a crit glyph, generated with msdf-bmfont-xml or msdf-atlas-gen. This is a 256² RGBA8 texture, so one slot.
  - **Mesh:** one `InstancedMesh(planeGeometry, material, 4096)` used as a ring buffer of glyph instances.
  - **Per-instance attributes:** `aAnchor` (vec3 world position of the hit), `aGlyph` (atlas rect index or uv offset), `aOffsetPx` (x offset inside the number, in pixels), `aSpawn` (float time), `aStyle` (colour index / crit / damage type).
  - **Vertex stage:**
    1. Project `aAnchor` to clip space.
    2. Add a screen-space offset in pixels: glyph layout, rise `= v·age − ½g·age²`, crit scale-pop. Numbers then keep a constant size at every zoom of the ortho camera.
    3. Set `alpha = 1 − smoothstep(0.7, 1.0, age/life)`.
    4. Dead instances collapse.
  - **Fragment stage:** MSDF median + outline from the distance field, giving a crisp outline and drop shadow for readability.
  - **Material state:** `depthTest: false`, drawn after tone mapping so it doesn't bloom or get graded, matching the first-round rule that signal colours bypass grading.
  - **Spawning:** write up to K glyphs into the ring with `InstancedBufferAttribute.addUpdateRange(start, count)`. That is a few dozen bytes per hit, versus creating and laying out a DOM node.
  - **Merging and capping:** stack and merge rapid hits on one target, e.g. 50 ms coalescing, and cap visible numbers per category for clarity.
- **Library choice:**
  - troika is excellent for UI labels and names but is WebGL-only. `BatchedText` is experimental and goes through async `sync()`, which suits slowly changing text, not 50+ spawns per second.
  - three-msdf-text-utils covers both backends for static or slowly changing world text: zone names, NPC names, boss bars.
  - Damage numbers deserve the custom instanced path, about 150 lines.
- **Cost expectation:**
  - GPU: one draw call and a few thousand small quads, which is negligible fill if glyphs are small; overdraw is limited to the glyph rects.
  - CPU: one buffer sub-update per frame.
  - DOM: per-element style, layout and composite work that scales with count and spikes in AoE scenes.
  - No published side-by-side measurement exists, so measure with the lab's bench at 200 simultaneous numbers.

### Gaps
- No published benchmark compares DOM damage numbers with GPU text (ms per frame at N numbers). The DOM numbers above are forum anecdotes.
- troika `BatchedText` performance and member-count limits are undocumented. A Uint16 index suggests about 65k members, which is my inference.
- three-msdf-text-utils' WebGPU material was not tested on r180, even though its peer range ≥0.178 includes r180.

## 7. Asset pipeline: glTF-Transform settings for web games (ETC1S vs UASTC, mipmaps, resize, meshopt, quantize, simplify/LOD), KTX2 in three r180 (transcoder setup, GPU formats per platform), calling it from Python; BatchedMesh and LOD patterns in r180

### Takeaway
`gltf-transform optimize in.glb out.glb --texture-compress ktx2` already does the right split:
- UASTC (level 4, RDO λ 4) for normal, occlusion and metallicRoughness slots, and ETC1S (quality 255) for the rest.
- Meshopt compression, a texture resize cap (default 2048) and a conservative simplify (error 0.01% of radius).
- It needs Node plus KTX-Software ≥ 4.4 (`ktx` binary).

From Python this is a `subprocess` call. The lab's script should also stop writing JPEG intermediates, which the Khronos artist guide says to avoid. In r180:
- KTX2Loader needs `setTranscoderPath()` and `detectSupport(renderer)` (after `await renderer.init()` on WebGPU). It prefers ASTC → BC7 → ETC2 → ETC1 → BC1/3 for UASTC.
- r180 sorted ETC1S by the UASTC order by accident (fixed r181).

`BatchedMesh` in r180 does CPU per-instance sphere culling and sorting but has no LOD; use `setGeometryIdAt` or `@three.ez/batched-mesh-extensions`. `LOD` divides camera distance by `zoom`, so under the ortho camera it behaves as zoom-LOD.

### Cited Findings
- **glTF-Transform `optimize` defaults** (current main):
  - `--compress meshopt`, `--texture-compress auto` ("recompresses in original format"), `--texture-size 2048`.
  - `--simplify true`, `--instance true`, `--join true`, `--flatten true`, `--palette true`, `--prune true`, `--weld true`, `--resample true`.
  - Help text: "KTX2 optimizes VRAM usage and performance; AVIF and WebP optimize transmission size."
  - Transform order: dedup → instance → palette → flatten → join → weld → simplify → resample → prune → sparse → texture compression → draco/meshopt/quantize.

  — [cli.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)
- `optimize --texture-compress ktx2` runs two `toktx` passes, both resized to `[textureSize, textureSize]`:
  - UASTC with `slots: '{normalTexture,occlusionTexture,metallicRoughnessTexture}'`, `level: 4, rdo: true, rdoLambda: 4`.
  - Then ETC1S with `quality: 255` on the remaining slots.

  — [cli.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)
- glTF-Transform's KTX transform spawns `ktx create …` with `KTX_SOFTWARE_VERSION_MIN = '4.4.0'` ("Confirm KTX-Software 4.4.0+ is installed"):
  - ETC1S defaults: quality 128, compression 1, rdo true, rdoThreshold 1.25.
  - UASTC defaults: level 2, rdo false, rdoLambda 1.0, zstd 18.
  - Global options: mipmaps true, filter `lanczos4`, resize (`nearest-pot`/`ceil-pot`/`floor-pot`), jobs = 2 × CPUs.
  - Colour space comes from glTF slot semantics: sRGB gets `--assign-tf srgb --assign-primaries bt709`, others linear. Normal-map slots disable RDO.

  — [toktx.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/transforms/toktx.ts)
- Simplify defaults are `ratio: 0.0`, `error: 0.0001` ("as a fraction of mesh radius"), `lockBorder: false`. It welds internally, and the meshoptimizer simplifier must be provided and awaited. The CLI `simplify` takes `--ratio`, `--error` and `--lock-border` — [simplify.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/functions/src/simplify.ts); [cli.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/cli/src/cli.ts)
- Quantize defaults: position 14, normal 10, texcoord 12, colour 8, weight 8, generic 12 bits, volume `mesh`. It adds `KHR_mesh_quantization`; bits must be 8–16; UVs outside [0,1] are not quantized — [quantize.ts](https://github.com/donmccurdy/glTF-Transform/blob/main/packages/functions/src/quantize.ts)
- The CLI installs with `npm install --global @gltf-transform/cli` and uses Sharp for image work. The docs page lists commands but not option details (use `-h`) — [gltf-transform.dev/cli](https://gltf-transform.dev/cli)
- **Khronos KTX Artist Guide:**
  - ETC1S suits large flat or mostly monochrome areas and non-PBR (toon, UI). UASTC suits high-contrast detail and packed textures (normal, ORM).
  - toktx flags: UASTC `--t2 --encode uastc --uastc_quality 4 --uastc_rdo_l .5 --uastc_rdo_d 65536 --zcmp 22`, with `--uastc_rdo_l .25` for normals/ORM; ETC1S `--clevel 4 --qlevel 255`; non-colour data `--assign_oetf linear --assign_primaries none`; mipmaps `--genmipmap`.
  - Results: a lamp asset went from 13 MB disk / 96 MB GPU to 10 MB / 21 MB, while the ETC1S-only version showed "obvious block compression artifacts". A 512² duck went from 1.5 MB to 277 KB of GPU memory.
  - "The lossy compression in JPEG textures should be avoided". Dimensions must be multiples of 4 (POT preferred), and ORM can be about ¼ of base-colour resolution.

  — [KTX Artist Guide](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md)
- Basis Universal v2.5: ETC1S "roughly .3-3bpp low to medium quality"; UASTC LDR 4x4 "8 bits/pixel"; transcodes to ASTC, BC1–5, BC7, ETC1/ETC2/EAC, PVRTC and others; use `-linear` for normal maps with ETC1S — [basis_universal](https://github.com/BinomialLLC/basis_universal)
- **r180 KTX2Loader:**
  - `transcoderPath` defaults to `''`, so `setTranscoderPath()` must point at `basis_transcoder.js/.wasm`.
  - WebGPU `detectSupport` maps `texture-compression-astc`, `texture-compression-etc2` and `texture-compression-bc` features (with ASTC HDR forced off). WebGL uses extensions.
  - Priority for UASTC/ETC1S: ASTC 4×4 (UASTC only) 1, BC7 2, ETC2 3, ETC1 4, BC1/BC3 5, PVRTC 6 (power-of-two only), RGBA32 100. Single-channel formats are skipped when alpha is present.
  - Zstd is decoded only on the raw path.

  — [KTX2Loader r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/loaders/KTX2Loader.js)
- r181 "Fix ETC1S/UASTC prioritization" (#31871): "Due to a historical accident, the list of formats for ETC1S was sorted using UASTC priority". The fix exposed Mesa drivers advertising ETC2/ASTC without hardware support, so those are filtered on Firefox (follow-up #33697 disables ETC1 on Chrome with Mesa) — [PR #31871](https://github.com/mrdoob/three.js/pull/31871)
- r186 ETC1S order: ETC2 1, ETC1 2, BC7 3, BC1/BC3 4, PVRTC 5, RGBA 100 (ASTC never for ETC1S). On Linux non-Android with all formats reported, ASTC, ETC1 and ETC2 are disabled — [KTX2Loader r186](https://github.com/mrdoob/three.js/blob/r186/examples/jsm/loaders/KTX2Loader.js)
- The r180 WebGPU KTX2 example calls `await renderer.init()` before `new KTX2Loader().setTranscoderPath('jsm/libs/basis/').setPath(...).detectSupport(renderer)` — [webgpu_loader_texture_ktx2 r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgpu_loader_texture_ktx2.html)
- Other KTX2 and format lines:
  - r181: KTX2Loader honours `setRequestHeader()` (#32115); compressed-texture feature detection fixed for the WebGL backend (#31980)
  - r182: more EAC formats (#32308)
  - r183: BC3 alpha fix (#32772)
  - r184: RGBA16 unorm (#33245); EXT_texture_norm16 (#33303)
  - r185: "Support all BPTC formats" (WebGPU, #33482); relative file URLs by default (#33603)

  — [r181](https://github.com/mrdoob/three.js/releases/tag/r181); [r182](https://github.com/mrdoob/three.js/releases/tag/r182); [r183](https://github.com/mrdoob/three.js/releases/tag/r183); [r184](https://github.com/mrdoob/three.js/releases/tag/r184); [r185](https://github.com/mrdoob/three.js/releases/tag/r185)
- **r180 `BatchedMesh`:**
  - API: `constructor(maxInstanceCount, maxVertexCount, maxIndexCount = maxVertexCount*2, material)`, `addGeometry`, `addInstance`, `setGeometryIdAt`, `setMatrixAt`, `setColorAt`, `setVisibleAt`, `deleteInstance`, `optimize`, `setInstanceCount`, `setGeometrySize`, `perObjectFrustumCulled` (true), `sortObjects` (true), `setCustomSort`.
  - `onBeforeRender` loops over instances on the CPU. It tests each instance's geometry bounding sphere against the frustum, computes depth when sorting (transparent back-to-front, opaque front-to-back), and fills multi-draw start/count arrays plus an indirect ID texture.
  - "no built-in LOD support", so use several geometries with `setGeometryIdAt`.

  — [BatchedMesh.js r180](https://github.com/mrdoob/three.js/blob/r180/src/objects/BatchedMesh.js)
- r180 `webgl_batch_lod_bvh` imports `@three.ez/batched-mesh-extensions@0.0.8`, `three-mesh-bvh@0.9.0`, `@three.ez/simplify-geometry@0.0.1` and `meshoptimizer@0.23.0`. It uses `batchedMesh.addGeometryLOD(geometryId, geometryLOD[1], 50)` (further LODs at 100, 125, 200), `computeBoundsTree()` (BLAS) and `computeBVH(THREE.WebGLCoordinateSystem)` (TLAS), with `instancesCount = 500000` and `simplifyGeometriesByErrorLOD(geometries, 4, …)` — [webgl_batch_lod_bvh r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_batch_lod_bvh.html)
- BatchedMesh changes after r180:
  - r182: `optimize()` index/attribute fix (#32185)
  - r183: per-instance opacity (#32725); wireframe (#32948)
  - r184: "Remove deprecated instancing render paths" (#33234)
  - r186: visibility dirty in `setGeometryIdAt()` (#34096); WebGPU draw-offset fix (#34212); TSL `batchIndirectIndex` (#34111); `positionPrevious` (#34100)

  — [r182](https://github.com/mrdoob/three.js/releases/tag/r182); [r183](https://github.com/mrdoob/three.js/releases/tag/r183); [r184](https://github.com/mrdoob/three.js/releases/tag/r184); [r186](https://github.com/mrdoob/three.js/releases/tag/r186)
- r180 progressive LOD example: `webgl_loader_gltf_progressive_lod` uses `@needle-tools/gltf-progressive@3.2.0` via `useNeedleProgressive(loader, renderer)`. "Mesh and texture LODs are loaded on demand depending on the mesh size on screen", from 2.9 MB initial versus 46.3 MB of LODs, with assets on Needle Cloud; no license is stated — [webgl_loader_gltf_progressive_lod r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_loader_gltf_progressive_lod.html)
- `LOD.update` computes `distance = |camPos − objPos| / camera.zoom` with `addLevel(object, distance = 0, hysteresis = 0)`, and has no camera-type check — [LOD.js r180](https://github.com/mrdoob/three.js/blob/r180/src/objects/LOD.js)

### Inferences
- **Lab pipeline change (`scripts/prepare-prop-kit.py`):**
  1. Write PNG, not JPEG, as the intermediate, because re-encoding JPEG artefacts into UASTC/ETC1S compounds error.
  2. Call glTF-Transform per GLB:
  ```python
  import shutil, subprocess
  GT = shutil.which("gltf-transform")            # npm i -g @gltf-transform/cli ; KTX-Software >= 4.4 'ktx' on PATH
  def optimize_glb(src, dst, tex=1024):
      subprocess.run([GT, "optimize", src, dst,
                      "--compress", "meshopt",
                      "--texture-compress", "ktx2",   # UASTC: normal/ORM/occlusion; ETC1S: the rest
                      "--texture-size", str(tex),
                      "--simplify", "false"],         # keep authored topology; make LODs explicitly
                     check=True)
  ```
  - On Windows `shutil.which` returns the `.cmd` shim, which `subprocess` can launch from its full path.
  - For finer control, run the separate commands `uastc --level 4 --rdo --rdo-lambda 4 --zstd 18 --slots …`, then `etc1s --quality 255`, then `meshopt --level high`, or write a small Node script using `@gltf-transform/functions` and call that.
  - `--texture-size 1024`, or 512 for small props, suits an iso camera where props rarely exceed a few hundred pixels.
  - ETC1S suits hand-painted, flat-toned albedo. Prefer UASTC for hero props and anything with fine detail. Check banding on dark night palettes, since ETC1S is ~0.3–3 bpp.
- **VRAM reality on desktop:**
  - ETC1S and UASTC both transcode to BC7 on Windows/macOS desktop in both r180 and r186. That is 8 bpp, 1 byte per pixel, versus 4 bytes for RGBA8, so about 4× less VRAM than today's decoded JPEG/PNG, but disk savings for ETC1S don't carry into VRAM there.
  - The r181 priority fix mostly matters on devices exposing both ETC2 and BC7.
- **LOD generation:**
  - Run `gltf-transform simplify in.glb lod1.glb --ratio 0.5 --error 0.001` and `--ratio 0.25 --error 0.005` for LOD2.
  - Load the files as separate geometries into one `BatchedMesh` per material, switching with `setGeometryIdAt` by zoom band, or let `@three.ez/batched-mesh-extensions` `addGeometryLOD` handle it.
  - `@three.ez/simplify-geometry` can generate LODs at load time instead, as the r180 example does.
- **BatchedMesh in the iso lab:**
  - Static props share materials via the texture atlas, or KTX2 arrays per kit, giving one BatchedMesh per material.
  - Leave `perObjectFrustumCulled = true`. Re-enable culling where the lab disabled it, but check bounding spheres after any vertex-shader displacement such as wind.
  - Set `sortObjects = false` for opaque props to skip the per-frame CPU sort.
  - CPU cost is one sphere test per instance per frame. For tens of thousands of instances, move to the BVH extension.
- **Ortho LOD rule:** distances in `LOD.addLevel` are effectively in "camera-offset distance / zoom" units, roughly constant over the screen for a fixed iso rig. Key LOD switches to zoom thresholds directly, and keep hysteresis to avoid popping at zoom boundaries.

### Gaps
- Python bindings for KTX-Software (pyktx) could not be verified because the PyPI page failed to load. The recipe assumes CLI subprocess calls.
- Not verified: whether glTF-Transform supports writing `MSFT_lod`, or any LOD container, so LODs are assumed to be separate files or runtime-generated.
- `SIMPLIFY_DEFAULTS` only confirmed the ratio/error meanings. No three.js-specific guidance on good `--error` values for game props was found.
- Not measured: the actual size and VRAM change for the lab's 37 GLBs (~61 MB) after KTX2/meshopt. Run it in the lab.
- Not verified: r180 WebGPU BatchedMesh behaviour given r186's "Fix draw offsets of BatchedMesh" (#34212). Test multi-geometry batches on the WebGPU path before relying on them.

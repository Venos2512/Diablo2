# Material/shading models and surface rendering in AAA games (2024–2026), with notes on what a three.js (WebGL2/WebGPU) isometric ARPG can use

> How to read these notes. Each technique block uses the tags **Mechanism / Shipped in / Cost / Scalability ladder / Web / Top-down relevance**. Everything under "Cited Findings" has a source. Background knowledge I could not re-verify in this session is labelled "(background, unverified)" and kept under "Inferences" or "Gaps". The shared web-search budget ran out partway through. After that I only fetched known primary-source pages directly, so a few areas (RE Engine/Decima material models, caustics, eye shading internals, splat height-blend docs) remain gaps. Current date of research: 19 Oct 2026. UE docs fetched were already the **UE 5.8** versions.

## 1. Core shading: BRDF/PBR conventions, layered materials (Substrate et al.), and where clear coat / sheen / anisotropy / thin-film / transmission are used

### Takeaway
The default real-time material is still metal/rough Cook-Torrance GGX (height-correlated Smith, Schlick Fresnel) with Lambert diffuse. It is augmented with three near-free fixes: LUT-based multiscatter energy compensation, specular occlusion, and geometric specular AA. Energy-preserving rough diffuse (EON) is the new offline/standard direction (OpenPBR). Layering became mainstream with UE5 Substrate, reported production-ready in UE 5.7 (Nov 2025). However, its default "Blendable GBuffer" mode and all mobile paths collapse materials to **one closure per pixel** via parameter blending. In practice the shipping model is "one GGX lobe plus cheap optional fuzz, clear coat or SSS", which is the tier a WebGL2/WebGPU renderer can afford.

### Cited Findings

#### 1.1 Baseline BRDF conventions (metal/rough GGX)
- **Mechanism.** Filament's reference model uses a Cook-Torrance microfacet specular with a GGX NDF (chosen for its long tails and compact peak), height-correlated Smith-GGX visibility (Heitz found it more accurate than uncorrelated forms), Schlick Fresnel, and Lambert diffuse. Lambert is preferred because it is very cheap and close enough to more complex models. Disney diffuse adds grazing retro-reflection but costs more and is not energy-conserving as written — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **Cost/mobile ladder (Filament, explicitly mobile-first, GLES 3.x).** The fast Smith visibility approximation "saves two square root operations and is good enough for real-time mobile applications". Roughness is clamped to about 0.089 to avoid fp16 precision problems, and "this clamping has the added benefit of correcting specular aliasing". Frostbite clamps analytical-light roughness to 0.045, which is only possible in fp32. Texture fetches are expensive on mobile. Pre-exposed lighting keeps shading in half precision — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **IBL convention.** Split-sum approximation. The DFG term goes in a 2D LUT indexed by (N·V, α); RG16F is recommended because "8-bits textures don't have enough precision". Analytic DFG approximations can replace the LUT, but they are **incompatible with multiscatter energy compensation**. The prefiltered radiance cubemap stores one roughness per mip, with lod = perceptualRoughness (γ=2 remap). Diffuse uses an irradiance cubemap or 2–3 SH bands, and SH is much cheaper — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **Specular occlusion / horizon occlusion.** Lagarde's empirical specular occlusion returns diffuse AO unchanged for rough surfaces and darkens more at grazing angles on smooth ones. Horizon occlusion removes reflection vectors that point into the surface using a clamped `1+dot(r,n)` term squared — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **Shipped in.**
  - *Diablo IV* (2023): PBR with real-world values, deviating "where it felt fitting for the game" (e.g. dark magic that pulls light away). Artists author emission, roughness and metallic per material. Uses a deferred renderer to share material work across many lights — [Blizzard: Peeling Back the Varnish](https://news.blizzard.com/en-us/article/23964183/iv)
  - *Indiana Jones and the Great Circle* (2024, MOTOR engine derived from idTech): Forward+ that also writes a mini G-buffer (normal, albedo, smoothness) for GI. They did not go deferred because "we have a few different BRDFs, as well as some shaders doing light calculations in custom ways" — [REAC 2025 MachineGames slides](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
  - *Call of Duty: Infinite Warfare* (2016): multilayer physically based surface pipeline for Forward+. Each layer is a simple BRDF/BSSRDF with thickness, scattering and absorption. Opaque, alpha-blend and refractive-blend modes, sized for a 60 Hz budget — [Activision Research](https://research.activision.com/publications/archives/practical-multilayered-materials-in-call-of-dutyinfinite-warfare)
  - *Call of Duty: WWII* (SIGGRAPH 2018 Advances): multiscattering diffuse BRDF and a method for mipmapping normal and gloss maps together — [Activision Research](https://research.activision.com/publications/archives/material-advances-in-call-of-dutywwii)
  - *Gears of War 4* (2016): "Creating a Layered Material System for 60fps" (title only verified; foundational) — [SIGGRAPH history](https://history.siggraph.org/learning/gears-of-war-4-creating-a-layered-material-system-for-60fps)

#### 1.2 Energy-preserving rough diffuse — EON (2024/2025)
- **Mechanism.** EON is an energy-preserving Oren–Nayar variant with *analytical* energy compensation. The popular "qualitative Oren–Nayar" (QON) is overly bright when backlit and shows a dark-ring discontinuity on spheres. The paper ships self-contained **GLSL** for evaluation and Clipped-LTC importance sampling. Authors are Portsmouth (Autodesk), Kutz (Adobe) and Hill (Lucasfilm); arXiv Oct 2024, JCGT 2025 — [arXiv 2410.18026](https://arxiv.org/abs/2410.18026v1)
- **Adoption.** The authors state it has been "chosen as the rough diffuse model used in the proposed industry standard OpenPBR" übershader — [arXiv 2410.18026](https://arxiv.org/abs/2410.18026v1). It was presented in the SIGGRAPH 2025 *Physically Based Shading* course alongside OpenPBR, ILM's "Strand" hair model, NVIDIA's neural materials, and *Gran Turismo 7* physically based tone mapping (with code) — [Self Shadow s2025 course page](https://blog.selfshadow.com/publications/s2025-shading-course/)
- **Web.** The GLSL listing is directly portable to WebGL2/WGSL (inference from the paper shipping GLSL).

#### 1.3 Multiscatter energy compensation (specular)
- **Mechanism.** Single-scattering microfacet BRDFs lose energy at high roughness, so rough metals look too dark. Kulla-Conty adds an accurate extra lobe. Lagarde/Golubev simplify it to scaling the existing lobe: `f = f_ss + F0·(1/r − 1)·f_ss`, with r stored in the DFG LUT at "negligible cost" — [Filament docs](https://google.github.io/filament/Filament.md.html)
- Fdez-Agüera (JCGT 2019) showed that the single-scatter IBL pre-integrals already contain the information needed to approximate the remaining bounces, so the run-time cost stays low — [JCGT 2019](https://www.jcgt.org/published/0008/01/03/paper.pdf). Blender EEVEE implements it with McAuley's simplification, `FssEss / (1 − Ems·Favg)` — [Blender PR #111634](https://projects.blender.org/blender/blender/pulls/111634/files). ILM's Turquin paper compares fixes for the "unexpected darkening of rough specular lobes" — [Turquin, ILM](https://blog.selfshadow.com/publications/turquin/ms_comp_final.pdf)
- **Cost.** One extra LUT channel (shared with IBL). It does **not** work with the analytic-DFG mobile shortcut — [Filament docs](https://google.github.io/filament/Filament.md.html)

#### 1.4 Specular anti-aliasing (geometric + normal-map)
- **Mechanism.** NDF filtering widens roughness where the normal varies within a pixel. Kaplanyan et al. 2016 filter in slope space and are "practically used in multiple game engines, such as Amazon Lumberyard and Unity 2018.2+, and in shipped games". Tokuyoshi & Kaplanyan (JCGT 2021) filter in *projected* space to fix grazing-angle/rim instabilities that come from GPU quad derivatives — [JCGT 2021](https://www.jcgt.org/published/0010/02/02/paper-lowres.pdf)
- **Shipped.** Unity HDRP exposes "Geometric Specular AA" per material. It reduces smoothness by an offset that depends on geometric curvature, controlled by screen-space variance and a clamp threshold — [Unity HDRP docs](https://docs.unity3d.com/Packages/hdrp/manual/Geometric-Specular-Anti-Aliasing.html). Glint AA extends the idea to glinty BRDFs — [Chermain et al. 2021](https://publis.icube.unistra.fr/docs/15022/Chermain2021RealTime.pdf). *CoD WWII* prefilters normal+gloss mips — [Activision Research](https://research.activision.com/publications/archives/material-advances-in-call-of-dutywwii)
- **Web.** A three.js forum thread (Dec 2024 – Sep 2025) has no built-in geometric specular AA. It proposes Valve's GDC 2015 trick: take ddx/ddy of the interpolated normal, convert to a roughness floor, and max it with material roughness, plus a centroid-normal fix. MSAA with tonemap-before-resolve is discussed for bright edges — [three.js discourse](https://discourse.threejs.org/t/having-geometric-specular-antialiasing-would-be-incredible/74816)

#### 1.5 Layered materials: UE5 Substrate (status 2025–2026)
- **Status.** Third-party coverage of UE 5.7 reports Substrate is "now production-ready", alongside PCG — [GameFromScratch](https://gamefromscratch.com/unreal-engine-5-7-released/), [CGPress](https://cgpress.org/archives/unreal-engine-5-7-released.html). UE 5.7 shipped in Nov 2025 — [Digital Production](https://digitalproduction.com/2025/11/12/unreal-engine-5-7-foliage-pcg-and-in-editor-ai/). Epic backed this in Feb 2026 with 280+ free Substrate automotive materials for 5.7 — [Epic news](https://www.unrealengine.com/news/get-over-280-production-ready-automotive-substrate-materials-for-ue-5-7-free-on-fab)
  - **Conflict:** the (5.8) docs still warn "Platform support and testing is currently incomplete" and "Features and UX are subject to change such that existing assets may behave differently or be invalidated". Substrate is **enabled by default for new projects**, while projects upgraded to 5.7+ stay on the legacy path unless they opt in — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- **Mechanism.** Substrate "replaces the fixed suite of shading models and blend modes". Materials are "slabs" of principled BSDF. Slab parameters:
  - F0/F90 (F90 brightness fixed at 1), roughness, anisotropy
  - Haziness (second roughness + weight)
  - Fuzz amount/roughness/color (retroreflective fabric)
  - SSS mean free path (cm)
  - Glint density/UVs (needs `r.Substrate.Glints=1`)
  - Specular profile (LUT, approximated on Blendable)
  - Thin-film helper that outputs F0/F90

  Operators: **Vertical Layer** (accounts for top-layer thickness, transmittance and scattering; the docs say this suits car paint or wetness), **Horizontal Blend**, **Add** (not physically plausible, "should be avoided"), **Coverage Weight**, and **Select** (forces a single closure) — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- **Cost.**
  - "It is twice as slow to evaluate the lighting for two BSDFs as it is a single one."
  - A closures-per-pixel budget applies. `r.Substrate.BytesPerPixel` defaults to 80 bytes/pixel, and materials over budget are iteratively simplified.
  - **Blendable GBuffer** is the default for new projects: "fixed-memory footprint and predictable speed", performance parity with the legacy path, and **one closure per pixel**.
  - **Adaptive GBuffer** is used by the Automotive/Architectural templates. Its cost "depends on the material's complexity visible on screen", it forces DBuffer decals, and it is only available on current-gen consoles plus SM6 desktop. SM5 falls back to Blendable.

  Sources: [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine), [Substrate GBuffer programming](https://dev.epicgames.com/documentation/unreal-engine/programming-with-substrate-gbuffer-formats)
- **Scalability ladder.** "On lower-end platforms, such as mobile, the compiler automatically enables parameter blending", which merges slabs into one before lighting. Mobile has no diffusion SSS. `r.Substrate.BlendableGBuffer` forces the legacy G-buffer. Legacy materials are converted at compile time — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- **UE 5.8 additions.** Experimental **Substrate Toon Shading** (NPR), built on Blendable GBuffer. Import of measured X-Rite AxF materials as Substrate. Mobile now defaults to multi-pass deferred and gains FP16 shader paths — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)
- **Legacy (pre-Substrate) UE shading-model menu**, still the mental model for most content:
  - Clear Coat (lacquer/car paint; an optional second normal map under the coat suits materials like carbon fiber)
  - Cloth ("a thin 'fuzz' layer")
  - Hair (two specular highlights: one light-coloured, one mixing hair and light colour)
  - Two Sided Foliage (transmission through leaves)
  - Preintegrated Skin ("prioritizes lower performance cost while sacrificing some accuracy")
  - Subsurface Profile ("higher-end skin")
  - Eye
  - Single Layer Water (transparent look with an Opaque blend mode, which "reduces the cost and complexity")
  - Thin Translucent (tinted glass in one pass)

  Source: [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine)

#### 1.6 Interchange standards relevant to web assets
- **OpenPBR 1.0** (June 2024) is an ASWF/MaterialX subproject by Adobe + Autodesk. It succeeds Autodesk Standard Surface and Adobe Standard Material, under Apache 2.0 — [CG Channel](https://www.cgchannel.com/2024/06/aswf-adobe-autodesk-launch-openpbr), [Adobe blog](https://blog.adobe.com/en/publish/2024/06/04/openpbr-surface-v-10-major-step-forward-for-digital-materials). OpenPBR 1.1 shipped in MaterialX 1.39.2 / OpenUSD 25.02 — [ASWF MaterialX TAC 2025](https://tac.aswf.io/meetings/2025-02-05/MaterialX_TAC_Update_2025_Final.pdf)
- **glTF ratified material extensions:** KHR_materials_anisotropy, _clearcoat, _dispersion, _emissive_strength, _ior, _iridescence (thin-film), _sheen, _specular, _transmission, _unlit, _variants, _volume. _diffuse_transmission is a Release Candidate and _subsurface is an Initial Draft. KHR_texture_basisu and KHR_texture_transform are ratified — [Khronos glTF extensions](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)
- **Neural materials** (research frontier, not web-feasible today): Zeltner et al. (ACM TOG 2024) approximate layered reference materials with neural BRDFs. Their motivation is that deeply layered materials and shading graphs, common offline, are often far too costly for real-time use — [arXiv 2305.02678](https://arxiv.org/pdf/2305.02678); see also NVIDIA's SIGGRAPH 2025 PBS talk — [Self Shadow](https://blog.selfshadow.com/publications/s2025-shading-course/)

#### 1.7 Where the "extra lobes" are actually used
- **Clear coat.** Car paint, lacquer and carbon fibre — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine). Filament's version is a second isotropic GGX lobe with fixed IOR 1.5 (F0 0.04) and Kelemen visibility ("not physically based" but cheap). The base layer is scaled by (1−Fc), and inter-reflection/refraction are not simulated — [Filament docs](https://google.github.io/filament/Filament.md.html). Substrate Vertical Layer is described as suiting car paint or wetness — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- **Sheen/fuzz.** Fabrics. Filament uses the "Charlie" NDF (Estevez–Kulla) or Ashikhmin velvet with Neubelt's smooth denominator, **removes Fresnel**, and offers a sheen colour for two-tone fabrics — [Filament docs](https://google.github.io/filament/Filament.md.html). Also UE Cloth and Substrate Fuzz.
- **Anisotropy.** Brushed metal and hair. Filament: αt = α(1+a), αb = α(1−a). It needs tangent frames, and IBL uses a bent reflection vector — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **Thin film / iridescence.** Substrate thin-film helper ([Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)) and glTF KHR_materials_iridescence ([Khronos](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)).
- **Transmission / refraction.**
  - Leaves use Two Sided Foliage, and glass uses Thin Translucent — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine)
  - **Cautionary example:** *Indiana Jones*' Nepal ice and icicle refraction shaders were designed for sparse use, but became "the most expensive parts of the game, some bit below 30Hz in places". The fixes were cheaper shaders, reduced overdraw, and a depth-tested refraction-mask pass (the mask is a normal-extruded mesh) — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

### Inferences
- In a top-down ARPG the right target is "UE Blendable-GBuffer-equivalent": one GGX+Lambert closure (optionally EON diffuse), plus optional sheen for cloth and clear coat for lacquered/wet props. Achieve this by **parameter blending** layers before lighting, which is the same trick UE applies automatically on mobile. Per-pixel multi-closure layering (Adaptive) is reserved for automotive/archviz.
- Multiscatter compensation (one LUT channel) and a derivative-based roughness floor are near-free and matter more under an isometric camera. Most surfaces are small on screen with high-frequency normal detail (stone, chainmail, wet ground), which produces specular shimmer, especially without TAA.
- Fixed camera: with a near-constant view direction, sun highlights sit at a predictable place on screen. Diablo IV explicitly worked on "avoiding distracting highlights based upon the fixed camera angle" for water ([GDC 2024 abstract](https://gdcvault.com/play/1034490/Technical-Artist-Summit-H2O-in)). The same consideration applies to glossy/wet ground materials.
- Grazing Fresnel is rarer under a ~45–60° pitched camera, except on vertical walls and silhouettes. Spending ALU on accurate F90/rough-diffuse retro-reflection has lower payoff than in third-person games (inference).
- The glTF extension set is a practical "material model spec" for a web pipeline. Authoring in OpenPBR/Substance and exporting the glTF subset maps cleanly to what three.js physical materials already implement (pointer only; another researcher covers three.js).

### Gaps
- **RE Engine, Decima and current Frostbite opaque material models.** No primary 2024–26 sources were found before the search budget ran out. Frostbite appears only indirectly (the Filament footnote on 0.045 roughness, Lagarde's specular occlusion). For Decima, see only the HFW deferred-texturing abstract in §5.
- **Which shipped 2025–26 UE5 games use Substrate.** None confirmed. No measured per-pixel cost for Blendable versus legacy beyond Epic's "parity" claim.
- **Whether UE5 enables multiscatter energy conservation by default.** Not verified.
- **Titan Quest II (UE5 isometric ARPG).** Technical claims (Lumen/Nanite/Substance workflow) come from a single secondary article with no official confirmation — [foro3d, May 2026](https://foro3d.com/en/2026/mayo/titan-quest-2-y-unreal-engine-5-el-salto-grafico-del-arpg-isometrico.html)

## 2. Characters: skin SSS, eyes, hair, cloth — and what non-cinematic / top-down games use instead

### Takeaway
High-end character rendering uses separable/Burley screen-space SSS and strand hair. *Indiana Jones* shipped strands at 60 Hz in 2024, and RTX Hair adds path-traced strands on RTX 50. Dedicated eye and cloth models round this out. Every engine keeps a cheap ladder:
- pre-integrated or wrap-diffuse skin
- hair cards with alpha-to-coverage or dither+TAA
- sheen-only cloth

Forward/mobile paths drop screen-space SSS entirely. The closest genre reference, Diablo IV, reserves SSS and high-res textures for close-ups. In gameplay it spends shader budget on readable status-effect layers: burning, poison, stealth, wet, bloody.

### Cited Findings

#### 2.1 Skin subsurface scattering
- **Separable SSS** (Jimenez et al., CGF 2015; foundational, still the basis of UE's default). It approximates the 2D diffusion profile with one separable kernel, using two 1D convolutions instead of "up to twelve". "Only seven samples per pixel are required" with importance sampling and jitter. Cost is "under 0.5 milliseconds per frame" (resolution/GPU not stated) — [iryoku.com](https://www.iryoku.com/separable-sss/)
- **UE Subsurface Profile** (default skin path).
  - **Mechanism.** A two-pass separable post-process blurs the diffuse lighting with per-profile coloured kernels. An optional **Burley normalized diffusion** mode is "more physically accurate" and "requires Temporal Anti-Aliasing to display properly". Diffuse and specular were previously split into a checkerboard. They are now packed per pixel at full resolution, which needs ≥64-bit scene colour or it falls back to checkerboard.
  - **Parameters.** Mean free path colour/distance, scatter radius, transmission (tint and extinction, Burley only), dual specular lobes.
  - **Scalability.** "The feature does not work in the non-deferred (mobile) rendering mode". Lower `r.SSS.SampleSet` trades quality for speed.

  Source: [UE Subsurface Profile docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/subsurface-profile-shading-model-in-unreal-engine)
- **Substrate SSS** is driven by MFP. Mobile/low-end has no diffusion SSS and falls back to parameter blending — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- **Pre-integrated skin** (Penner, GPU Pro 2, 2011; foundational, the standard low-end fallback). A LUT indexed by curvature and N·L models scattering due to curvature, small bump detail and shadow falloff in a **single pass**, versus multi-pass texture-space diffusion — [NVIDIA FaceWorks GTC 2014](https://reedbeta.com/talks/faceworks/gtc-2014-faceworks.pdf). It needs the LUT plus per-vertex curvature — [Game Developer: skin shading in Unity](https://www.gamedeveloper.com/programming/in-depth-skin-shading-in-unity3d). FaceWorks adds "deep scatter" for ears and nose using shadow-map thickness — [FaceWorks](https://reedbeta.com/talks/faceworks/gtc-2014-faceworks.pdf). UE's Preintegrated Skin model is the cheaper legacy option — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine)
- **Wrap diffuse.** Filament implements "subsurface" as energy-conserving wrapped diffuse (w = 0.5) with a subsurface colour. This is the cheapest rung — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **Frontier (not web-feasible).** NVIDIA's hybrid ReSTIR path-traced single scattering plus a new diffusion profile for multiple scattering (SIGGRAPH 2025 Advances) — [Advances 2025](https://advances.realtimerendering.com/s2025/)
- **Top-down reference.** Diablo IV's team considers SSS essential for close-up faces and swaps in high-detail textures during close-ups — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)

#### 2.2 Eyes
- UE's Eye shading model has controls for iris shape and distance. Epic calls it "highly technical" and recommends using the Digital Humans eye material as-is rather than building one — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine)

#### 2.3 Hair: strands vs cards
- **Strands (Groom).** UE renders "each individual strand", which the docs say enables hundreds of thousands of hairs in real time. Card techniques remain the traditional real-time path, and MetaHuman grooms show both representations — [UE hair docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/hair-rendering-and-simulation-in-unreal-engine)
  - UE 5.8 adds Chaos Hair: "Nanite compatible rendering and simulation", "Prototype strand rendering", and "Card generation to skeletal mesh" — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)
- **Shipped strands.**
  - *Indiana Jones* (2024) uses strand-based hair and fur with GPU optimisations across hardware to ship at 60 Hz (SIGGRAPH 2025 Advances, Kulikov) — [Advances 2025](https://advances.realtimerendering.com/s2025/). It also places clipping spheres to discard strands that would poke through headwear — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
  - **RTX Hair** (Linear-Swept-Spheres primitives, path-traced) arrived as a PC-only, RTX 50-series-only patch in Sept 2025 — [GamingBolt](https://gamingbolt.com/indiana-jones-and-the-great-circle-on-pc-will-get-nvidia-rtx-hair-support-on-september-4)
  - ILM's "Strand" production model for hair, fur and feathers is offline-oriented (SIGGRAPH 2025 PBS) — [Self Shadow](https://blog.selfshadow.com/publications/s2025-shading-course/)
- **Hair shading.** UE's legacy Hair model "simulates multiple specular highlights" (one tinted by light, one by hair colour) — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine). Anisotropic GGX alternative: [Filament](https://google.github.io/filament/Filament.md.html)
- **Card transparency handling.**
  - **Alpha-to-coverage.** "Sub-pixel" screen-door transparency that needs MSAA, useful for foliage and hair — [Wikipedia](https://en.wikipedia.org/wiki/Alpha_to_coverage). Practitioners call hair "a perfect case for alpha to coverage" because strands need test plus AA, not blending — [Khronos forum](https://community.khronos.org/t/alpha-to-coverage-how-does-it-actualy-work/66043)
  - **Alpha-hash dithering.** Better suited to true semi-transparency than to opaque strands with soft edges — [Godot PR #40364](https://github.com/godotengine/godot/pull/40364)
  - **Dithered cards + TAA.** Shimmer when the camera moves, sensitive to the clip threshold — [Unigine forum](https://developer.unigine.com/forum/topic/8445-hair-shader-artifacts-when-camera-moves/)

#### 2.4 Cloth
- Substrate Fuzz (amount/roughness/colour) — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine). UE Cloth "fuzz" layer — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine). Filament cloth uses the Charlie sheen NDF without Fresnel, a sheen colour, and wrap-diffuse subsurface colour — [Filament docs](https://google.github.io/filament/Filament.md.html)

#### 2.5 Top-down / ARPG practice
- **Diablo IV** character shaders convey status effects (burning, poisoned, stealth), wetness from rain that dries indoors, and bloodying from skills — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)
- **Path of Exile 2.** A dedicated ExileCon 2023 rendering talk by Alexander Sannikov exists — [devtrackers](https://devtrackers.gg/pathofexile/p/e45d8539-rendering-path-of-exile-2) — but I could not verify its contents (see Gaps).
- **Scalability reference (Switch 2).** Digital Foundry's analysis of *Indiana Jones* on Switch 2 found:
  - 540p–1080p docked and 360p–720p handheld, with DLSS, targeting 30 fps
  - RTGI kept, textures equal to Series S
  - reduced shadows, lower LODs and draw distance, VRS

  Source: [Nintendo Everything summary of DF](https://nintendoeverything.com/indiana-jones-and-the-great-circle-nintendo-switch-2-tech-analysis-including-frame-rate-and-resolution/)

### Inferences
- At isometric gameplay distance a hero occupies a small part of the screen (exact pixel heights vary by camera; not sourced). Screen-space SSS, strand hair and eye refraction give little visible return there. The defensible ladder:
  - **Gameplay:** wrap-diffuse or pre-integrated skin LUT, hair cards with anisotropic highlights, sheen cloth.
  - **Portrait/inventory/cutscene cameras:** separable SSS and higher-res textures, as Diablo IV does with close-up texture swaps.
- **Readability.** A top-down ARPG gains more from a shared "status overlay layer" in the character shader (wet, burning, frozen, poisoned, bloody, stealth dissolve) than from more physically correct skin. Diablo IV treats these as first-class shader features.
- **Web.** Dithered/hashed hair cards depend on TAA to resolve. Without TAA, alpha-to-coverage with MSAA is the cleaner choice for cards. WebGL2 and WebGPU both offer MSAA render targets (background, unverified this session; WebGPU allows sampleCount 4).

### Gaps
- Marschner R/TT/TRT versus Kajiya-Kay in specific 2024–26 shipped games, and how strand rasterisation is budgeted (visibility buffer, sample counts). The UE hair page fetched was only an overview.
- Eye rendering internals (iris refraction, caustics, limbal darkening) in 2024–26 games: no sources fetched.
- How Diablo IV / PoE2 render hair and skin at gameplay distance. The PoE2 ExileCon talk contents (an earlier search summary mentioned point-light shadows, screen-space GI, "subsurface refraction" for ice/water and precomputed-ray-traced grass/fur) could **not** be verified, and that summary appeared to mix sources.

## 3. Texturing: virtual texturing, arrays/bindless, detail maps, triplanar, stochastic/hex tiling, decals, POM vs displacement, vertex-colour/height blending

### Takeaway
The current state of the art:
- virtual texturing, both streaming and runtime-baked shading caches, to collapse many-layer blends into a few fetches
- stochastic/hex tiling to hide repetition
- deferred/DBuffer/mesh decals for detail
- real micro-polygon displacement replacing POM at the top end (Nanite Tessellation, AC Shadows "Micropolygons")

For a renderer bounded by WebGPU's 16-sampled-texture default, the most transferable lessons are:
- Diablo IV's "pre-combine terrain layers once into a virtual texture"
- texture arrays (256 layers default)
- Mikkelsen hex-tiling (3 fetches, no precomputation)
- Lagarde-style vertex-colour/heightmap masks

### Cited Findings

#### 3.1 Virtual texturing (SVT and RVT)
- **Mechanism (RVT).** Texels are generated "on demand using the GPU at runtime" and cached in pages. RVT is a **shading cache**, good for landscapes and decal-like materials. Objects render into it with an orthographic projection.
  - **Layouts:** BaseColor (BC1); BaseColor+Normal+Roughness+Specular (2×BC3, default); YCoCg variants (BC3+BC5+BC1, about +25% memory); World Height (R16); Displacement (BC4); Mask4.
  - World-space normals are recommended when several primitives write to the RVT.

  Source: [UE RVT docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/runtime-virtual-texturing-in-unreal-engine)
- **Cost/limits.** RVT content "isn't fully updated on every frame", so writers should be static, not skinned. Rendering low mips over a large world is slow, so low mips can be **baked to a streaming VT** while high mips render at runtime. Virtual textures cannot be used inside materials that fill RVTs. On platforms without VT, components "render to the main pass instead" through a landscape fallback path — [UE RVT docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/runtime-virtual-texturing-in-unreal-engine). UE supports both RVT and SVT — [UE VT overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-texturing-in-unreal-engine). UE 5.7 releases unused VT spaces after 150 frames (`r.VT.SpaceReleaseFrames`) — [Tom Looman](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)
- **Shipped in.**
  - *Far Cry 4* (2014; GDC 2015 "Adaptive Virtual Texture Rendering"): terrain plus a large number of decals rendered into an adaptive VT. 10 km × 10 km at 10 texels/cm, which the talk puts at about 20× traditional VT — [GDC Vault](https://gdcvault.com/play/1021760/Adaptive-Virtual-Texture-Rendering-in)
  - ***Diablo IV*** (2023): terrain blends many tileable textures, and virtual textures pre-combine them once to reduce per-frame cost — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)
  - Unity's VT was still marked experimental in its 2023.1 docs. Its `Resolver` reads GPU feedback back to the CPU asynchronously — [Unity docs](https://docs-alpha.unity3d.com/2023.1/Documentation/ScriptReference/Rendering.VirtualTexturing.Resolver.html)
- **Web.** No WebGPU virtual-texturing implementation was found (one search; see Gaps).

#### 3.2 Texture arrays, bindless and the WebGPU limits
- **WebGPU core defaults:**
  - **maxSampledTexturesPerShaderStage = 16**, maxSamplersPerShaderStage = 16, maxStorageBuffersPerShaderStage = 8
  - **maxTextureArrayLayers = 256**, maxTextureDimension2D = 8192, maxBindGroups = 4
  - BC, ETC2 and ASTC compression are **optional features** (`texture-compression-bc/etc2/astc`)

  Source: [W3C WebGPU spec](https://www.w3.org/TR/webgpu/)
- KHR_texture_basisu (a supercompressed universal texture format) is ratified — [Khronos](https://github.com/KhronosGroup/glTF/blob/main/extensions/README.md)
- **Filtering as a scalability knob.** *Indiana Jones* ties anisotropic filtering to dynamic-resolution scale: 4× at 100%, rising to 8× while 60 Hz holds, and 2× below 100% — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 3.3 Stochastic and hex tiling (anti-repetition)
- **Heitz & Neyret** (HPG 2018). A triangle lattice of hex tiles, each sampled at a random offset and blended by barycentrics. Plain blending loses contrast, so they use a histogram-preserving operator: Gaussianise the texture T, variance-preserving blend, inverse LUT T⁻¹. This needs precomputed transform textures — [Mikkelsen JCGT 2022 (summarising HN)](https://jcgt.org/published/0011/03/05/paper.pdf). Burley (JCGT 2019) replaced the 3D transform with per-channel 1D LUTs, noting that HN's preprocessing "took several minutes for a 256×256 texture" — [JCGT 2019](https://www.jcgt.org/published/0008/04/02/paper.pdf). Community demo in OKLab with PCA — [GitHub](https://github.com/HybridDog/stochastic_texture_sampling_demo/)
- **Mikkelsen, "Practical Real-Time Hex-Tiling"** (Unity, JCGT 2022).
  - Drops histogram preservation and samples the **original** texture 3 times.
  - Must use `SampleGrad` because of the random offsets.
  - Blend weights are driven by luminance with a contrast function on the weights (falloff contrast ≈ 0.6).
  - Supports **random rotation for normal maps** by blending derivatives, which is "particularly sensible for a normal map".
  - HLSL listings in the appendix.

  Source: [JCGT 2022](https://jcgt.org/published/0011/03/05/paper.pdf). Community ports exist as an Unreal material-node network ([Alouda](https://alouda.myportfolio.com/implementing-hex-tiling)) and OSL for Redshift/Arnold ([ArtStation](https://engelmanna.artstation.com/projects/ArB0aX)).
- **Cost.** 3 gradient fetches per hex-tiled texture plus hash and weight math. Same texture binding, so no extra sampler slots (derived from the paper's listings).

#### 3.4 Detail maps and procedural surface variation
- **Detail normals.** Filament combines base and detail normal maps with Reoriented Normal Mapping (RNM) or UDN blending — [Filament docs](https://google.github.io/filament/Filament.md.html)
- **Diablo IV environment shading:** directional blending (e.g. snow on rocks), adaptive texture scaling, dissolve effects, and curvature-driven colour and roughness changes on edges and cavities — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)

#### 3.5 Triplanar mapping (foundational, GPU Gems 3, 2007)
- **Mechanism.** Project along X, Y and Z. Weights start as |N|, tightened as `(w−0.2)·7` clamped, then normalised ("very important!"). A blend range of "roughly 10 to 20 degrees tends to work well". Bump mapping needs a tangent basis per projection, built by swizzling the normal — [GPU Gems 3 ch.1](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu)
- **Cost.** The listing does 3 colour + 3 bump fetches per pixel in a single pass — [GPU Gems 3 ch.1](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu)

#### 3.6 Decals (deferred / DBuffer / mesh)
- **UE deferred decals** write into the G-buffer. Cost depends on decal shader complexity and the projected box's screen size, not on the complexity of the receiving meshes. "Efficient" modes touch few G-buffer properties — [UE decal docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-actors-in-unreal-engine)
- **Substrate.** Adaptive GBuffer forces **DBuffer** decals; Blendable supports both — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- **UE 5.8** brings **deferred decals to the mobile renderer** — [UE 5.8 notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)
- **Forward+ engines.** *Indiana Jones* sets up visible "geometry decals" after the full depth pass, alongside water setup — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **Decals baked into VT/RVT.** Far Cry 4 AVT ([GDC Vault](https://gdcvault.com/play/1021760/Adaptive-Virtual-Texture-Rendering-in)). UE RVT supports static meshes and foliage instances used for decal scattering ([UE RVT docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/runtime-virtual-texturing-in-unreal-engine)).

#### 3.7 Parallax occlusion mapping vs real displacement
- **Nanite Tessellation/Displacement** first shipped as experimental in UE 5.4 (2024). A 5.4 bug made Nanite landscapes stop rendering with displacement enabled (fixed in 5.5) — [UE-210759](https://issues.unrealengine.com/issue/UE-210759). In 5.7.3, scaling displacement with Multiply causes "floating terrain ghost" artifacts; the workaround is to scale only via DisplacementScaling Magnitude — [UE-370671](https://issues.unrealengine.com/issue/UE-370671). A user reports a regression in 5.8 versus 5.7.4 — [UE forum](https://forums.unrealengine.com/t/nanite-displacement-bugged-in-exact-same-landscape-in-ue-5-8-but-not-in-ue-5-7/2739815). A Russian-language summary of an Epic talk dates the feature to UE 5.4 / 2024 (secondary) — [zeli.app](https://zeli.app/ru/story/49697444)
- **UE 5.8 "Mesh Terrain"** (Experimental) aims to "replace and remove the typical constraints of the current heightfield-only landscape solution". It uses variable tessellation, Nanite and virtual texture — [UE 5.8 notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)
- ***AC Shadows*** (2025) uses Anvil's "Micropolygons" for the first time ("a virtualized geometry system which allows us to render more polygons with more level of details continuity"), scaling from Low to Ultra — [Ubisoft tech Q&A](https://www.ubisoft.com/es-mx/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
- **Displacement without tessellation hardware.** *Indiana Jones* snow deformation uses "No HW tessellation". It spawns fixed patches of detail mesh where deformation exists (details in §4) — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 3.8 Vertex-colour and height-based material blending
- **Lagarde, rain puddles.**
  - A vertex-colour channel encodes puddle depth with soft gradients at the edges: `saturate((FloodLevel.y − VertexColor.g)/0.4)`.
  - A heightmap floods cracks first: `min(FloodLevel.x, 1 − Height)`.
  - The final mask is the max of the two.

  Source: [Lagarde, Water drop 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)
- *Indiana Jones* uses vertex painting on static low-poly base meshes to hide seams with the deformable detail-snow patches — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

### Inferences
- **Top-down relevance is high.** The ground fills most of an isometric frame, so tiling repetition is the most visible artefact. Hex-tiling the ground's albedo, normal and roughness (3× fetches, same bindings) is one of the highest value-for-cost techniques for this project.
- **Texture budget.** WebGPU's default of 16 sampled textures per stage is the hard constraint for splat terrain. A 4-layer PBR splat (albedo, normal, ORM per layer = 12) plus splat masks, shadow map and IBL already reaches the limit. The project's own lab notes record that adding one extra shadow map broke terrain on WebGPU for this reason. Escape routes, in order of AAA precedent:
  - `texture_2d_array` per channel type (up to 256 layers)
  - packing (ORM + height in one texture)
  - Diablo IV-style **pre-combined/baked terrain texture** (a VT or a simple camera-centred RVT-like clipmap baked by render-to-texture)
- **POM vs displacement.** Under a near-overhead camera the parallax offset is small and silhouettes of the ground are rarely seen. Normal/bump plus cheap POM, or none, captures most of the benefit. Real displacement (Nanite-style) mainly pays off at grazing views. On the web there is no tessellation stage (background, unverified this session: WebGPU exposes only vertex, fragment and compute). Displacement therefore means pre-tessellated meshes, compute-generated patches (the Indiana Jones approach) or POM.
- **Decals.** A three.js renderer is forward by default, so deferred decals need a G-buffer pre-pass. "Mesh decals" (geometry with polygon offset) or decals baked into a terrain cache are the forward-friendly options. This mirrors *Indiana Jones*' Forward+ "geometry decals" and Far Cry 4 baking decals into its VT.

### Gaps
- No WebGPU/WebGL virtual-texturing implementation found (single search). WebGPU's lack of sparse/tiled resources (background, unverified) means any VT would be an indirection-texture plus atlas scheme.
- Status of "bindless"/descriptor-indexing proposals for WebGPU in 2026 is not verified.
- UE landscape layer-blend docs (LB Height Blend, weightmap packing, sampler limits) returned an empty page. Splat height-blend specifics are therefore unsourced here (background: per-layer height plus weight blend with a contrast/sharpness term).
- No 2024–26 source on POM usage in shipped games, and no direct Nanite Tessellation doc page fetched (status in 5.7/5.8 inferred from bug reports; Experimental/Beta unconfirmed).

## 4. Terrain: heightmap LOD, splat blending, terrain VT, blending meshes into terrain, deformation, procedural placement

### Takeaway
AAA terrain stacks several layers:
- **heightmap LOD:** geometry clipmaps, CDLOD, quadtrees; UE 5.8 adds experimental Mesh Terrain with variable tessellation
- **splat layers baked into runtime virtual textures:** Far Cry 4 AVT, UE RVT, Diablo IV
- **RVT world-height/colour sampling** so props blend into the ground
- **render-target deformation:** *Indiana Jones* uses a camera-centred 2k² top-down deformation map with detail mesh patches and no tessellation
- **GPU procedural scatter:** UE PCG, production-ready in 5.7; idTech-derived "ecotopes"

A top-down camera with short view distance removes most long-range LOD problems, and the camera-centred techniques fit it naturally.

### Cited Findings

#### 4.1 Heightmap LOD
- **Geometry clipmaps** (Asirvatham & Hoppe, GPU Gems 2, 2005; foundational). Nested regular grids centred on the viewer shift as it moves, sampling height from vertex textures. Interactive flight over a 20-billion-sample US dataset at about 90 fps — [GPU Gems 2 ch.2](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-2-terrain-rendering-using-gpu-based-geometry)
- **CDLOD** (Strugar 2010; foundational). A quadtree of regular grids rendered directly from the heightmap, with better LOD distribution than clipmaps — [CDLOD source release](https://github.com/CarsF/CDLOD)
- **Web design guide** (design doc, figures unverified): GPU-driven CDLOD with compute culling and indirect draw on WebGPU, and clipmaps with CPU ring updates on WebGL2, with a 3.5 ms terrain budget — [Cinevva guide](https://app.cinevva.com/guides/landscape-generation-browser)
- **UE 5.8 Mesh Terrain** (Experimental): moves beyond heightfield-only landscapes, with variable tessellation, Nanite and virtual texture — [UE 5.8 notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)

#### 4.2 Splat layers, terrain virtual texturing, mesh-to-terrain blending
- **Diablo IV:** many tileable textures pre-combined once via VT ([Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)). **Far Cry 4:** terrain and decals in an adaptive VT ([GDC Vault](https://gdcvault.com/play/1021760/Adaptive-Virtual-Texture-Rendering-in)). **UE:** landscape RVT as a shading cache ([UE RVT docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/runtime-virtual-texturing-in-unreal-engine)).
- **Blending meshes into terrain.** Non-landscape actors write into the same RVT as the landscape (e.g. road splines), so their shading merges with it. Meshes can also sample the RVT's World Height (R16) and colour to blend their bases into the ground — [UE RVT quick start](https://dev.epicgames.com/documentation/en-us/unreal-engine/runtimevirtual-texturing-quick-start-in-unreal-engine), [UE RVT docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/runtime-virtual-texturing-in-unreal-engine)

#### 4.3 Deformation (snow/mud trails) — *Indiana Jones* (2024) as the current, tessellation-free reference
- **Mechanism.**
  - A **camera-centred top-down projection** of deformers draws deformation depth into a **2k × 2k render target**.
  - The target is downsampled with group-shared memory and wave ops, then tiles are classified so only touched tiles get blurred. This "saved ~1ms on Series S on average" versus a full blur.
  - **Detail patches** map to 16×16 pixels of the target with **one vertex per pixel**, generated via indirect draw args.
  - The low-poly base snow mesh is discarded under detail patches, and **a dither hides the intersection**. Neither mesh goes into ray-tracing acceleration structures.
  - The split allows static low-poly, vertex-painted base meshes.

  Source: [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)
- **Snow normals after displacement** must be recomputed from neighbouring height samples via a cross product — [A. Riccardi, deformable snow blog](https://andreariccardi.artstation.com/blog)
- ***AC Shadows*** snow is gameplay-relevant ("snow can slow down Naoe, but not Yasuke"); no rendering details given — [Ubisoft tech Q&A](https://www.ubisoft.com/es-mx/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)

#### 4.4 Procedural placement
- **UE PCG** is "now Production-Ready" in 5.7 and "almost twice as fast as it was in UE 5.5". GPU compute nodes are "better suited for multiplatforms, including the use of FastGeo" — [GameFromScratch 5.7 preview](https://gamefromscratch.com/unreal-engine-5-7-preview-release/). Epic still "recommends verifying runtime performance and scalability before adoption" — [Digital Production](https://digitalproduction.com/2025/11/12/unreal-engine-5-7-foliage-pcg-and-in-editor-ai/). PCG GPU spawns dense statics through FastGeometry components — [Tom Looman](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)
- **UE 5.8:** "PCG GPU runtime scatter is now within the same performance range as the landscape GPU grass system", plus non-destructive manual editing of PCG output — [UE 5.8 notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes). The Procedural Vegetation Editor remains Experimental — [Digital Production](https://digitalproduction.com/2025/11/12/unreal-engine-5-7-foliage-pcg-and-in-editor-ai/)
- ***Indiana Jones*** "ecotopes": "GPU based vegetation placement systems which runs periodically and updates visible vegetation instances", run at frame start together with terrain and wind setup — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

### Inferences
- **Isometric ARPG maps** (fixed pitch, limited zoom) see perhaps tens of metres of terrain, never horizons (inference). A single-level grid, or 2–3 ring clipmaps per chunk, is enough. Clipmap/CDLOD machinery built for flight-sim ranges is unnecessary.
- **Camera-centred caches fit a top-down camera.** The Indiana Jones snow deformation target, an RVT-like baked terrain colour/normal cache, and a wind/interaction field all follow the player. A browser-feasible version is a camera-following ortho render target that re-renders only newly exposed strips when the camera scrolls.
- **Mesh-to-terrain blending.** A shared terrain-height/colour texture sampled by props, the RVT idea, is cheap on the web: one extra texture. It hides the "props stuck on a plane" look that is very visible from above.
- **PCG-style GPU scatter** (compute shader writing instance buffers, culled per tile) is feasible on WebGPU. On WebGL2 the scatter moves to CPU/worker or transform feedback (background, unverified).

### Gaps
- No primary 2024–26 sources on terrain splat height blending (UE layer-blend docs unreadable), Frostbite/Decima terrain, or Far Cry 5/6 terrain tech beyond the FC4 AVT abstract.
- No WebGPU terrain implementation was verified; only a design guide.

## 5. Vegetation: GPU grass, wind, interaction, Nanite foliage, impostors, alpha-to-coverage, dithered LOD cross-fade

### Takeaway
Vegetation now splits into three tiers.
1. **GPU-generated grass blades** (Ghost of Tsushima) with noise-driven wind, clumping and view-space widening.
2. **Hierarchical wind from baked pivots/branch data** (Pivot Painter 2, SpeedTree "Games" wind). This is increasingly driven by global GPU wind simulations: a fluid-sim wind in *AC Shadows*, wind fields in *Horizon Zero Dawn* and *God of War*.
3. **Nanite Foliage at the very top** (experimental in UE 5.7/5.8): assemblies, voxel LOD, and bone skinning instead of WPO. The Witcher 4 tech demo ran it at 60 fps on base PS5.

The fallback tier is octahedral impostors, alpha-to-coverage or dither+TAA, and heavy triangle budgeting. For an isometric ARPG, dense interactive grass and bending bushes matter far more than distant-tree LOD.

### Cited Findings

#### 5.1 GPU-generated grass — *Ghost of Tsushima* (2020; GDC 2021)
- **Mechanism.** Sucker Punch rendered fields by "generating individual blades of grass on the GPU that could each have their own procedural appearance and animation". The talk covers memory and performance budgets, rendering, animation, and making thousands of blades read as a natural field — [GDC Vault](https://gdcvault.com/play/1027214/Advanced-Graphics-Summit-Procedural-Grass). The companion wind talk says the game's systems handle "millions of blades of grass" — [GDC Vault, Blowing from the West](https://gdcvault.com/play/1027124/Blowing-from-the-West-Simulating)
- **Reimplementations** (detail not in the official abstract):
  - Cubic Bézier blade shape; scrolling Perlin noise into a sine-based wind; Voronoi clumps that share parameters; no LOD yet — [Unity recreation](https://cainrademan.artstation.com/projects/QndNax)
  - Blades seen edge-on are **widened horizontally in view space**, "as suggested in the Ghost of Tsushima GDC talk"; Voronoi clumping of rotation, height and bend; multi-frequency Perlin wind plus a simplex domain warp for tip jitter; base-to-tip colour, a fake rounded normal and height AO; tile LOD with a high/low blade mesh (swaps are noticeable); shadows have "a _very_ high performance cost" — [GodotGrass](https://github.com/2Retr0/GodotGrass)

#### 5.2 Wind systems
- **Pivot Painter 2** (UE). A 3ds Max script bakes per-element pivots (16-bit RGB), basis vectors (8-bit), parent index, hierarchy depth and random values into two textures, sampled with NoMipMaps and Nearest. "Each Wind Setting group controls the meshes at a specific hierarchical depth" (trunk, then branch, then leaf). The shader runs the wind code 4×, so disable unused levels. Results are "less accurate but far cheaper" — [UE Pivot Painter 2 docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/pivot-painter-tool-2.0-in-unreal-engine)
- **SpeedTree.** "Games" wind mode is preferred for v9+ in the SDK, Unreal and Unity — [SpeedTree docs](https://docs.unity3d.com/speedtree-modeler/manual/wind-games.html). Branch independence and leaf/frond ripple are driven by noise against per-vertex wind weights — [SpeedTree fan settings](https://docs.unity3d.com/speedtree-modeler/manual/fan-games.html). Legacy presets form a **scalability ladder**: "Fastest" (global sway only) up to "Palm" (branch motion, leaf ripple and tumble, frond ripple) — [SpeedTree legacy wind](https://docs.unity3d.com/speedtree-modeler/manual/wind-legacy.html). The SDK's example D3D11 vertex shader reads wind data from branch vertex attributes — [SpeedTree SDK](https://docs.unity3d.com/speedtree-runtime-sdk/manual/example-wind-shader.html)
- **Global GPU wind fields.**
  - *AC Shadows* (2025): "all the vegetation in AC Shadows is physically animated on the GPU based on a dynamic wind system" driven by a fluid simulation — [Ubisoft tech Q&A](https://www.ubisoft.com/es-mx/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
  - *God of War* (2018; GDC 2019): "dynamic and spatially-varying 3D wind simulation", interactive, boneless tree and leaf sway — [GDC Vault](https://gdcvault.com/play/1026036/Interactive-Wind-and-Vegetation-in)
  - *Horizon Zero Dawn*: a global wind force field computed in a compute shader each frame, at highest resolution near the player (unofficial transcript mirror; treat with care) — [transcript mirror](https://wiki.kwonsh.duckdns.org/Between-Tech-and-Art--The-Vegetation-of-/Between-Tech-and-Art--The-Vegetation-of-.html)
  - *Indiana Jones* sets up wind each frame before culling — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 5.3 Player/skill interaction
- **Diablo IV:** vertex shaders animate foliage in response to characters, skills and wind. Flesh growths and blood also move via shader math — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)
- **Nanite Foliage's Dynamic Wind plugin** still has no collision with players or objects and supports only global wind direction (Experimental) — [UE Nanite Foliage docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-foliage)

#### 5.4 Nanite Foliage (UE 5.7, Nov 2025; still Experimental in 5.8 docs)
- **Mechanism.**
  - **Nanite Assemblies:** trees built from reusable instanced parts, "up to 65k instances of other meshes", which greatly reduces disk and streaming size.
  - **Nanite Voxels:** clusters are voxelised into bricks of ≤128 4×4×4 voxels when that gives lower error than triangles. They are rasterised with a separate shader permutation, sorted front to back.
  - **Nanite Skinning:** bone hierarchies replace WPO. WPO adds per-vertex cost and forces conservative bounds, whereas skinning allows "optimal cluster bounds".
  - **Non-Nanite platforms:** "the triangles of the parts are transformed and merged together into a single mesh".
  - **Guidance:** with Virtual Shadow Maps, disable animation at distance. Skinning stops below a screen size (default 0.1).

  Source: [UE Nanite Foliage docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-foliage). Coverage: [80.lv](https://80.lv/articles/check-out-new-features-arriving-with-unreal-engine-5-7), [Tom Looman](https://tomlooman.com/unreal-engine-5-7-performance-highlights/) (also notes TSR thin-geometry detection for foliage).
- **Claims.** Epic targets "realistic foliage at 60 FPS on current-gen hardware" (stated target) — [Digital Production](https://digitalproduction.com/2025/11/12/unreal-engine-5-7-foliage-pcg-and-in-editor-ai/). The Witcher 4 UE5 tech demo (State of Unreal, June 2025, UE 5.6) showed Nanite Foliage and FastGeo streaming at 60 fps with ray tracing on base PS5. It was "a tech demo… not The Witcher 4 itself" — [VGC](https://www.videogameschronicle.com/news/witcher-4-tech-demo-shows-the-game-running-at-60-fps-with-ray-tracing-on-base-ps5/). A single source says the voxel approach is used in The Witcher 4 — [80.lv](https://80.lv/articles/picturesque-forest-scene-created-with-ue5-7-s-nanite-foliage)

#### 5.5 Impostors, alpha handling, LOD transitions, budgets
- **Octahedral impostors.** Ryan Brucks' Impostor Baker (UE4) uses an octahedral layout to save memory and was used in *Fortnite Battle Royale* — [80.lv](https://80.lv/articles/impostor-baker-for-ue4/). GDC 2018 "Realistic Foliage Imposter and Forest Rendering in UE4" — [GDC news](https://gdconf.com/news/make-like-tree-leave-time-gdc-2018-talk-ue4-foliage-rendering). A secondary source says Microsoft Flight Simulator uses similar methods — [ModDB](https://www.moddb.com/news/ue5-update-the-foliage-is-improved)
- **Alpha-to-coverage.** Screen-door transparency at sub-sample level, needs MSAA, useful for dense foliage or grass — [Wikipedia](https://en.wikipedia.org/wiki/Alpha_to_coverage). It has no effect without MSAA, and practitioners report stipple in motion — [gamedev.net thread](https://gamedev.net/forums/topic/455616-drawing-alpha-tested-foliage-nicely-warning-image-heavy?page=1)
- **Deferred texturing for foliage (Decima).** *Horizon Forbidden West* uses "a novel loosely tiled deferred texturing system" with a visibility-buffer pre-pass and compute shading to accelerate foliage and alpha-tested geometry — [GDC Vault](https://www.gdcvault.com/play/1027553)
- ***Indiana Jones* production practices** — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf):
  - Alpha-tested pipelines are drawn last, which helps depth and shadow passes.
  - Draws are coarsely sorted in buckets of 1024 within a pipeline to cut overdraw.
  - Dynamic vegetation renders as static in far shadow cascades.
  - For RT, alpha-tested vegetation drops triangles in proportion to transparent texels.
  - "Almost all of the 500 models where [sic] remade and optimized during the last two months" (vegetation models).
  - Dither blending is used between snow meshes.

### Inferences
- **Top-down relevance.**
  - **High:** GPU grass, interaction bending (player, skills, explosions, as in Diablo IV) and wind on bushes/crops. These sit right under the camera.
  - **Low:** octahedral impostors and voxel far-LOD, since there are no horizons. They may matter only for backdrop trees in vista shots.
  - **Medium:** alpha handling (A2C vs dither), because foliage is seen from above against noisy ground.
- **Web feasibility.**
  - Ghost of Tsushima-style blades map to WebGPU compute (per-tile blade generation into an instance buffer plus indirect draw). On WebGL2 they become instanced static blade meshes with vertex-shader wind and clump noise.
  - Pivot Painter-style hierarchical wind is pure vertex shader plus 1–2 nearest-sampled data textures, so it is fully web-feasible.
  - A camera-centred 2D "interaction/wind" render target (player and skill impulses splatted each frame) is the web-friendly analogue of GoW/HZD/AC wind fields.
- **Shadows on grass are expensive** (GodotGrass; Indiana Jones renders vegetation as static in far cascades). Under an isometric sun, contact-shadow or AO-based darkening at blade bases is the usual cheap substitute (inference).

### Gaps
- Exact Ghost of Tsushima blade vertex counts and LOD scheme: the talk is paywalled and no primary write-up was found.
- Dithered LOD cross-fade: only secondary or commercial sources (not used). The well-known Ben Golus A2C article returned 403.
- Interactive bending specifics (render-target impulse fields vs analytic sphere lists) in 2024–26 games beyond Diablo IV's one-line description.

## 6. Water: FFT/Gerstner oceans, flow maps, refraction/absorption, foam, caustics, ripples; rivers, swamps and puddles in non-ocean games

### Takeaway
Open-ocean games use FFT (Tessendorf) spectra or Gerstner sums. Non-ocean games such as Diablo IV and Portal 2 / Left 4 Dead 2 rely on cheap pixel tricks instead:
- flow-mapped normals and layered distorted noise
- depth-based colour/absorption and fake refraction
- terrain-shaped "waves"
- character-driven wakes and foam
- dynamically accumulating puddles

UE's Single Layer Water (water in the opaque pass with absorption and scattering coefficients) is the engine-level standard. Diablo IV's GDC 2024 talk explicitly addresses deferred-water trade-offs and highlights under a fixed camera, which applies directly to an isometric ARPG.

### Cited Findings

#### 6.1 FFT / Tessendorf ocean (foundational) and web implementations
- **Mechanism.** A statistical wave spectrum is synthesised per frame with inverse FFTs into height and choppy-displacement maps — [Tessendorf, Simulating Ocean Water](https://jtessen.people.clemson.edu/reports/papers_files/simdoc.pdf). NVIDIA's canonical compute version runs three 512² inverse FFTs per frame — [NVIDIA OceanCS slides](https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/OceanCS_Slides.pdf)
- **Web.**
  - luma.gl's experimental, WebGPU-only spectral ocean uses a Phillips spectrum, power-of-two sizes 8–1024, and has no shallow-water or shoreline solve — [luma.gl docs](https://luma.gl/docs/api-reference/experimental/spectral-ocean-simulation)
  - A 2026 bachelor's thesis implements a JONSWAP iFFT ocean in WebGPU compute with foam — [Masaryk University](https://is.muni.cz/th/xftbr?lang=en)
  - A WebGPU iFFT wave generator is discussed on the three.js forum — [three.js discourse](https://discourse.threejs.org/t/animated-ocean-waves/43814)

#### 6.2 Engine water systems
- **UE Water plugin:** spline-based rivers, lakes and oceans "that all interact and work together with your Landscape terrains" — [UE Water system](https://dev.epicgames.com/documentation/en-us/unreal-engine/water-system-in-unreal-engine)
- **UE Single Layer Water:** a physically based single-depth-layer translucency with inputs for Scattering/Absorption Coefficients, PhaseG and Color Scale Behind Water. It runs "after the base pass and deferred lighting, but before regular translucency". Opacity balances volume BSDF against surface BRDF — [UE Single Layer Water](https://dev.epicgames.com/documentation/unreal-engine/single-layer-water-shading-model-in-unreal-engine). Its Opaque blend mode "reduces the cost and complexity" versus transparent water — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine)
- **UE 5.8** lists "higher-quality water rendering" for the mobile renderer — [UE 5.8 notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)

#### 6.3 Flow maps (rivers, sewage, swamps) — Valve, SIGGRAPH 2010 (foundational, still standard)
- **Mechanism.**
  - Artists author a 2D flow-vector texture (Houdini), which distorts normal-map UVs along the flow.
  - Distortion looks plausible only for about the first 1/3 of UV space, so **two layers offset by half a phase** are cross-faded to hide each restart.
  - A noise texture offsets phase to remove **pulsing**, and per-layer offsets remove repetition.
  - Normal strength is scaled down by flow speed.
  - A colour/debris variant uses an offset distortion interval centred at rest.

  Source: [Vlachos, Water Flow in Portal 2](https://alex.vlachos.com/graphics/Vlachos-SIGGRAPH10-WaterFlow.pdf)
- **Shipped in:** *Left 4 Dead 2* (2009; the swamps motivated it) and *Portal 2* (2011) — [Vlachos](https://alex.vlachos.com/graphics/Vlachos-SIGGRAPH10-WaterFlow.pdf)
- **Cost:** versus two scrolling normal maps, 2 additional texture fetches (flow and noise) and 21 additional arithmetic pixel-shader instructions — [Vlachos](https://alex.vlachos.com/graphics/Vlachos-SIGGRAPH10-WaterFlow.pdf)

#### 6.4 Diablo IV (2023) — the isometric reference
- **Shipped shading:** layered noise masks distort over time, with simulated subsurface refraction and depth-based colouring. Characters and monsters create wakes and foam. Vertex displacement drives ocean waves and explosion effects — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv)
- **GDC 2024 "H2O in H3LL"** (Aaron Aikman, Lead Technical Artist):
  - pixel and vertex shader techniques for **shorelines**, **dynamically accumulating puddles**, **snow-topped rocks**, **Helltide rivers** and **icy caves**
  - "the pros and cons of deferred-rendered water"
  - "**avoiding distracting highlights based upon the fixed camera angle**"
  - "'sculpting the waves' via terrain shaping"

  Sources: [GDC Vault](https://gdcvault.com/play/1034490/Technical-Artist-Summit-H2O-in), [GDC schedule](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730)

#### 6.5 Refraction cost in practice
- *Indiana Jones* sets up water after the full-depth pass. Its refraction (ice) required a refraction-mask pre-pass whose overdraw had to be depth-tested and artist-tuned, and the refractive shaders had to be swapped for cheaper ones — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

### Inferences
- **For an isometric ARPG (rivers, swamps, blood/acid pools, puddles, shallow coasts):**
  - Flow-mapped normals plus depth-based absorption (scene-depth difference → colour/opacity ramp, the same idea as UE's absorption coefficients)
  - Screen-space refraction offset by the normal
  - Shoreline foam from depth difference
  - Character wakes from a camera-centred ripple/impulse render target

  This combination is what Diablo IV describes, and it is entirely web-feasible. FFT oceans are optional, for a coast level only, and WebGPU compute versions exist.
- **Fixed camera highlights.** With a fixed view direction, the sun's specular reflection on water sits at a stable screen location and can dominate the frame. Diablo IV specifically tuned around this. Options include clamping or attenuating sun specular on water, using roughness/normal variation to break up the glint, or an art-directed reflection probe (inference).
- **Forward vs deferred water.** In a forward three.js pipeline, water is naturally a transparent pass that samples the opaque scene's colour and depth (one copy of the opaque buffer). That is the same structure as UE's Single Layer Water pass ordering.

### Gaps
- **Caustics:** no 2024–26 source fetched. Projected animated caustic textures and light-space caustics are background only.
- **Gerstner waves:** only third-party mentions in UE context; no primary doc fetched.
- Diablo IV talk details beyond the abstract (members-only); UE river/water-zone internals; Crimson Desert, AC Shadows and other 2025 water talks: no sources found.

## 7. Weather & wetness: wet-surface darkening/porosity, puddles, rain ripples, snow accumulation, seasons

### Takeaway
Wetness practice is still Lagarde's 2013 recipe:
- porosity-scaled albedo darkening down to about 0.2
- gloss pushed toward water
- flattened normals in puddles
- vertex-colour and heightmap flood levels
- one shared procedural ripple normal map
- a rain-occlusion depth map

It is now expressible as a physical vertical layer in Substrate (documented as suiting wetness) and driven by global weather systems. *AC Shadows*' Atmos controls rain, wind, precipitation and cloud, and puddles evaporate. Its seasons change GI under snow cover and remove winter vegetation. Snow is a world-up mask with normal-map breakup, plus optional deformation (§4).

### Cited Findings

#### 7.1 Physically based wet surfaces — Lagarde (used partly in *Remember Me*, 2013; foundational, still the reference)
- **Darkening by porosity.**
  - Diffuse factor = lerp(1, ~0.2, porosity), then lerp by wetness. The 0.2 floor comes from measured data.
  - Metals are not darkened: `lerp(1, 0.2, (1−metalness)·porosity)`.
  - Without a porosity map, derive it from gloss: `saturate(−2.5·Gloss + 1.25)`. This is coarse; rough non-porous materials get wetted too.

  Source: [Lagarde, Water drop 3b](https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/)
- **Gloss/specular.** Water gloss is 1.0. Blend toward it with the factor scaled by 0.5 "to limit the specular boost". The IOR change (0.04 → ~0.02) is ignored as "not visible enough in game" — [Water drop 3b](https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/)
- **Thin layer vs puddle.** A thin layer blends the normal slightly toward the vertex normal. Puddles are "totally flat and… blended to water properties", driven by one AccumulatedWater value — [Water drop 3b](https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/)
- **Drying.** About 1 minute for gameplay; real-world times (>30 min) are "useless". Puddles dry slower than wet areas — [Water drop 3b](https://seblagarde.wordpress.com/2013/04/14/water-drop-3b-physically-based-wet-surfaces/). *Remember Me* shipped mostly authored wet textures because its rain was static — same source.

#### 7.2 Dynamic rain effects — Lagarde, Water drop 2b (foundational, with console costs)
- **Ripples.**
  - "A single ripple normal map is use[d] for the entire world for performance reasons", regenerated per frame at 256² and sampled with world XY.
  - It stores falloff, normal XY and a random time offset per circle.
  - **4 layers** are enabled progressively with rain intensity, each with its own speed and offset.
  - Ripples appear only where accumulated water exists, and mips were unsatisfying.
  - Cost: about 0.14 ms on PS3.

  Source: [Lagarde, Water drop 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)
- **Puddles.** Vertex-colour depth and heightmap cracks (formulas in §3.8). Flood and dry speeds scale per rain intensity — [Water drop 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)
- **Occlusion and splashes.** A depth map rendered from the rain direction (like a shadow map) decides exposure, so there is no wetness or splashes under roofs. Costs about 0.32 ms (PS3). Foot splashes read vertex colour and are "almost free" — [Water drop 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)
- **Where to apply.** Streaks on walls are "not something expected in real world". Limit wet and ripple effects to ground-parallel surfaces — [Water drop 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)
- **Budget.** "A budget of 3ms (on a base of a 30 fps game) for all the rain core effects is reasonable"; measured about 2.8 ms on PS3/X360 — [Water drop 2b](https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/)

#### 7.3 Current engines and games
- **Substrate Vertical Layer** (top-slab thickness/transmittance over base) is documented as suiting car paint or wetness — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine)
- ***AC Shadows* (2025), Atmos.**
  - Atmos is "a group of systems that manage simulating weather"; "the system can control rainfall, windspeed, and direction, and even precipitation and cloud cover".
  - Wind-driven rain runs off eaves onto clothing and hair.
  - Puddles dry as their water evaporates into clouds that wind carries away.

  Source: [Ubisoft, Inside Anvil (Apr 2026)](https://news.ubisoft.com/en-us/article/6u0kflsdY20YlnZks7rUeG/inside-anvil-the-technology-powering-assassins-creed-shadows)
- ***AC Shadows* seasons.** "The global illumination of a scene is drastically different if there is a snow cover". "Some bushes/vegetation are simply gone in the winter months". Icicles fall and make noise. PS5/XSX target 60 fps "2160p upscaled" in performance mode. PC minimum GPU is a GTX 1070, with five presets and software RT on GPUs without hardware RT — [Ubisoft tech Q&A](https://www.ubisoft.com/es-mx/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
- **Diablo IV (2023):** rain wetness on characters that dries indoors, dynamically accumulating puddles, snow-topped rocks via directional blending — [Blizzard](https://news.blizzard.com/en-us/article/23964183/iv), [GDC 2024 abstract](https://gdcvault.com/play/1034490/Technical-Artist-Summit-H2O-in)
- **Indiana Jones (2024):** dither-blended snow, snow particles, icicles and ice blocks — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

#### 7.4 Snow accumulation masks (tutorial-level sources; standard practice)
- **World-up mask:** world-normal Y shaped with smoothstep or a power — [godotshaders](https://godotshaders.com/shader/snow-covered-surface/)
- **Breakup:** use the world-space normal-map Z (blue) to break up the mask edge — [80.lv UE4 shader guide](https://80.lv/articles/shader-guide-for-ue4)
- **Combine:** take the max of vertex-normal and normal-map masks so coverage isn't lost on flat maps — [godotshaders](https://godotshaders.com/shader/snow-covered-surface/)
- **Deformed snow:** recompute normals after displacement — [A. Riccardi](https://andreariccardi.artstation.com/blog)

### Inferences
- **Top-down relevance is very high.** Lagarde recommends restricting wetness and ripples to ground-parallel surfaces, and an isometric camera sees mostly ground-parallel surfaces. Wet darkening, gloss boost, puddles in heightmap cavities and ripples therefore give an unusually large visual return per millisecond.
- **Web cost.** The whole Lagarde stack is a few ALU ops plus one shared ripple texture, which can be a pre-baked animated atlas instead of per-frame generation. Rain occlusion can reuse an existing ortho depth render, such as the sun shadow map when sun and rain directions are close, or a dedicated low-res top-down depth. All of this is WebGL2-feasible.
- **Seasons for a dark-fantasy ARPG.** Use global material parameters (snow amount, wetness, frost) applied through world-up and height masks in all terrain and prop shaders, plus per-season vegetation sets. Lighting/GI changes (AC Shadows' note that snow changes GI) suggest at least swapping or retinting baked ambient/probe data per season.
- **Diablo IV's indoor-drying character wetness** suggests a per-character wetness scalar driven by gameplay (rain exposure from the occlusion map or indoor volumes) feeding the character shader's status layer (§2).

### Gaps
- No primary 2024–26 talk on AC Shadows' snow accumulation/deformation rendering; Ubisoft's public articles only describe Atmos and seasons at a high level.
- Lagarde's other parts (ripples/streak details in 2a, 3a observations) were not fetched; streak/flow-on-wall techniques are not covered.

## 8. Shader-authoring practice: uber-shaders vs permutations, material instances/parameter collections, keeping shader/PSO counts manageable

### Takeaway
Permutation explosion (render passes × vertex factories × keywords/static switches) is the core shader-management problem. Engines respond with:
- PSO precaching and caches (UE 5.1–5.2+: compile asynchronously at load, skip the draw until ready)
- variant stripping (Unity)
- per-cook shader statistics
- few-BRDF uber-shaders in GPU-driven engines (MOTOR/idTech)
- Substrate's closure budgets and parameter blending

On the web the same trade-off becomes "uniform-driven uber-shader with dynamic branches versus many pipelines compiled at first use".

### Cited Findings

#### 8.1 Why counts explode
- **UE.** "A single component might need a lot of PSOs to render correctly in all the different passes, such as base, custom depth, depth, distortion, shadow…". Precaching iterates "over all possible mesh pass processors", and "all global compute shaders permutations which can be used by the game are precached" — [UE PSO precaching docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/pso-precaching-for-unreal-engine). Epic's tech blog notes separate vertex shaders per mesh type (static, skinned, spline). A single draw's PSO can take tens of milliseconds to compile, and PSO precaching arrived in UE 5.2 (from search snippets; the page returned 403 to direct fetch) — [Epic tech blog](https://www.unrealengine.com/en-US/tech-blog/game-engines-and-shader-stuttering-unreal-engines-solution-to-the-problem)
- **Unity 6.6.** One variant per combination of keywords; for example, ten sets of two on/off keywords produce 1024 variants. Large counts mean "longer build times, high shader memory usage, and shader compilation stutters". Variants avoid GPU dynamic-branch cost but add build, memory and load overhead. "It is always best to strip unneeded variants" — [Unity manual: shader variants](https://docs.unity3d.com/Manual/shader-variants.html)

#### 8.2 PSO precaching and caching (UE)
- **Mechanism.** Primitive components "precache all the PSOs needed for rendering immediately after loading (during PostLoad)", compiled asynchronously.
- **If not ready**, the default strategy delays proxy creation, which "will effectively skip the draw until the PSO is ready". The alternatives are swapping to the default material or blocking (a hitch).
- **Numbers:** initial compile with an empty driver cache "should take less than a minute on medium spec CPUs"; up to 2 GB of memory per compile thread; 20 ms hitch threshold; validation mode to find outliers.

Source: [UE PSO precaching docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/pso-precaching-for-unreal-engine). Earlier (UE 4.26) bundled PSO caches were recorded by playing the game — [UE 4.26 PSO caching](https://docs.unrealengine.com/4.26/en-US/SharingAndReleasing/PSOCaching). In 5.1, objects whose PSOs aren't ready are skipped (secondary) — [DSOGaming](https://www.dsogaming.com/news/epic-games-adds-new-pso-precaching-mechanism-to-unreal-engine-5-1-to-reduce-shader-compilation-stutters)
- **UE 5.7 housekeeping:** disabling 128-bit base-pass pixel shader variations "can save 50k shaders / 15 MiB". A new per-cook `ShaderTypeStats.csv` tracks shader growth over time. FastGeo PSO precaching moved off the game thread — [Tom Looman](https://tomlooman.com/unreal-engine-5-7-performance-highlights/)

#### 8.3 Material-model-level control
- **Substrate.** The closures-per-pixel budget and bytes per pixel bound the cost of layering. **Select** chooses one of two paths, enforcing a single closure per pixel. **Parameter blending** merges slabs before lighting and is automatic on mobile. The legacy "From Material Expression" option lets one material switch shading models in-graph — [Substrate overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-substrate-materials-in-unreal-engine), [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine). Nanite voxels render with "a separate shader permutation" — [Nanite Foliage docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-foliage)
- **GPU-driven forward engine (*Indiana Jones*, MOTOR/idTech-derived)** — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf):
  - "a few different BRDFs" in Forward+
  - Draws are ordered by pipeline, with alpha-tested pipelines last.
  - Empty draws are compacted and **pipelines with zero draws are predicated off**, saving about 0.5 ms "in scenes with a lot of pipelines but very few at time showing on screen".
  - Hit shaders were optimised to fit VGPR limits.
- **Artist-facing practice.** *Indiana Jones* reports that showing artists PIX captures of what costs time "helped us get very far". Expensive refraction shaders were swapped for cheaper ones late in production — [REAC 2025](https://www.enginearchitecture.org/downloads/REAC_2025_Indy.pdf)

### Inferences
- **For three.js/WebGPU,** "PSO" means render-pipeline objects compiled by the browser and driver. Each distinct material permutation (defines, vertex layout, blend/depth state, shadow/depth variants) adds a pipeline. The AAA lessons translate to:
  1. Keep a **small set of uber materials** (terrain, prop, character, foliage, water, FX) whose features toggle through uniforms and dynamic branches where branches are coherent (per-material or per-draw). Reserve compile-time defines for features that change vertex inputs or heavy sampling.
  2. **Precompile/warm** every pipeline variant during loading (UE-style precaching; asynchronous pipeline creation exists in WebGPU, background, unverified).
  3. Track variant counts per build, like UE's ShaderTypeStats.
  4. Mirror Substrate's parameter blending: blend layer parameters (wet, snow, blood) into one BRDF input set before lighting, instead of evaluating multiple lobes.
- **Material instances / parameter collections** map naturally to shared uniform buffers in a web engine. Per-instance data covers tints, wetness and damage masks, and a global "weather/season" block covers snow amount, wetness and wind. This keeps the pipeline count constant while art varies (inference).

### Gaps
- No sources fetched on UE Material Instances / Material Parameter Collections or Unity's SRP Batcher-era guidance (searches exhausted). Background: instances change only uniforms, not permutations, unless static switches are used.
- No primary source on idTech/Doom shader-count philosophy (e.g. "few hundred pipelines") or Call of Duty's ubershader practice; claims about those engines' shader counts are omitted.
- Browser-specific pipeline-compile costs and caching behaviour for WebGPU and WebGL2 were not researched here (outside scope; three.js researcher).

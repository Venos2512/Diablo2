# Atmosphere/volumetric rendering, real-time VFX/particles and stylized (NPR) rendering in current AAA games (2023–2026): technique notes for an isometric dark-fantasy ARPG targeting three.js

*Compiled 2026-10-19.*
- **Per-technique fields:** Mechanism / Shipped in / Cost/HW / Scalability ladder / Web impl.
- **Where the analysis lives:** each technique's relevance to an isometric camera, and rough three.js feasibility hints (WebGL2 vs WebGPU/TSL), are in that section's **Inferences**.
- **Labels:** older foundational work is marked "[Foundational YYYY]".
- **Sourcing:** the session's shared web-search quota ran out partway through. Many findings therefore come from direct fetches of primary pages (engine docs, SIGGRAPH/GDC PDFs, studio articles). Anything that could not be verified is listed under each section's **Gaps** rather than stated as fact.

## Sky & atmosphere (physically based sky, time of day)

### Takeaway
The production standard is Hillaire's 2020 LUT method, which ships in UE SkyAtmosphere and Fortnite (mobile included) and has also been ported to WebGPU. It rebuilds four small LUTs every frame for about 0.31 ms total at 720p on a GTX 1080 and about 1 ms on an iPhone 6s, so a fully dynamic time of day costs almost nothing. Two cheaper tiers sit below it:
- **Bruneton precomputed LUTs:** cheap to sample but about 250 ms to rebuild.
- **Analytic skies (Preetham, Prague):** close to free.

With an isometric camera the sky dome is rarely in frame. The useful outputs are the sun and moon colour (transmittance), ambient sky irradiance and fog colour, so the view-dependent sky-view and aerial-perspective LUTs can mostly be dropped.

### Cited Findings

#### Hillaire 2020 LUT-based sky + aerial perspective (UE SkyAtmosphere)
- **Mechanism:** The method replaces per-pixel atmosphere ray marching with four LUTs:
  - **Transmittance LUT** (Bruneton-style parameterisation). It removes the secondary march toward the sun at each sample.
  - **Multiple-scattering LUT** (32×32). Scattering orders ≥2 are assumed isotropic, and the infinite series is summed in closed form as F_ms = 1/(1−f_ms). All orders come from one pass instead of one iteration per order, as Bruneton, Elek and Yusov need.
  - **Sky-View LUT.** A low-resolution lat/long texture around the camera's local up vector, rebuilt every frame. A quadratic latitude remap packs more texels near the horizon, and the sun disk is composited afterwards.
  - **Aerial-perspective LUT.** A froxel volume fitted to the camera frustum (RGB = in-scattering, A = mean transmittance). The default is 32×32 over the screen × 32 slices over 32 km, which the paper calls "enough for most applications and games", including Fortnite's ~3 km² map. It is applied to opaque surfaces as a post-process and per-vertex on forward-rendered transparents. — [Hillaire 2020, CGF/EGSR paper](https://sebh.github.io/publications/egsr2020.pdf); [EG digital library entry](https://diglib.eg.org/handle/10.1111/cgf14050)
- **Shipped in:** UE's SkyAtmosphere component, listed as supported on Mobile, XB1/PS4, XSX/PS5 and low/high-end PC. — [UE docs: Sky Atmosphere Component](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine)
  - Fortnite uses it, including the mobile ES3.1 build. The design goal was performance "decoupled from screen resolution". — [Hillaire, SIGGRAPH 2020 PBS course slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
  - Which UE version introduced the component was not verified in this session.
- **Cost/HW:** Table 2 of the paper, PC (GTX 1080) vs iPhone 6s. Row labels were reconstructed from PDF text extraction. Both sums match the totals stated in the slides (0.31 ms and 1.03 ms).

  | LUT | PC resolution | PC steps | PC time | iPhone 6s resolution | iPhone 6s steps | iPhone 6s time |
  |---|---|---|---|---|---|---|
  | Transmittance | 256×64 | 40 | 0.01 ms | 256×64 | 40 | 0.53 ms |
  | Sky-View | 200×100 | 30 | 0.05 ms | 96×50 | 8 | 0.27 ms |
  | Aerial perspective | 32³ | 30 | 0.04 ms | 32²×16 | 8 | 0.11 ms |
  | Multi-scattering | 32² | 20 | 0.07 ms | 32² | 20 | 0.12 ms |

  — [paper](https://sebh.github.io/publications/egsr2020.pdf); [slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
  - On PC, the on-screen sky + aerial perspective costs 0.14 ms, for **0.31 ms total at 1280×720**. — [paper](https://sebh.github.io/publications/egsr2020.pdf)
  - On iPhone 6s, the LUTs cost **1.03 ms**. — [slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
  - Fortnite's total sky cost was "roughly 1ms on iPhone 6s". — [paper](https://sebh.github.io/publications/egsr2020.pdf)
  - For the same view, Bruneton 2008 renders in 0.22 ms, but rebuilding all its LUTs with the reference code costs 250 ms, 99% of it in the multiple-scattering iterations. — [paper](https://sebh.github.io/publications/egsr2020.pdf)
  - Volumetric shadowing (mountains or clouds onto the atmosphere) must be ray marched. With 32 samples per pixel, jitter and TAA, the sky cost rises to 1.0 ms. — [paper](https://sebh.github.io/publications/egsr2020.pdf)
  - The space view switches to plain on-screen ray marching: 0.33 ms for planet + atmosphere, 0.5 ms total. — [paper](https://sebh.github.io/publications/egsr2020.pdf)
  - Hardware needs are 2D render targets plus one small 3D volume. No compute is required.
  - A third-party DX11 reimplementation reports a 64×64 sky-view LUT at 0.036 ms and a 64×64×32 aerial-perspective LUT (no volumetric shadow) at 0.03 ms on a GTX 1060. These figures come from a search-result summary; the README was not opened. — [AirGuanZ/AtmosphereRenderer](https://github.com/AirGuanZ/AtmosphereRenderer)
- **Scalability ladder:**
  - The mobile configuration keeps the 256×64 transmittance LUT but cuts the sky-view LUT to 96×50 @ 8 steps and the aerial-perspective LUT to 32×32×16 @ 8 steps. The paper says the visual difference is "not noticeable to the naked eye", and the transmittance LUT could be reduced further. — [paper](https://sebh.github.io/publications/egsr2020.pdf)
  - The technique is "scalable from mobile to high-end PCs by simply tweaking the LUT resolution and ray marching sample count". — [slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
  - UE exposes these cvars. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine)
    - `r.SkyAtmosphere.FastSkyLUT` (0 disables the fast path), `.FastSkyLUT.Width/Height` (256 suggested when cloud shadows are used) and `.FastSkyLUT.SampleCountMax`
    - `r.SkyAtmosphere.AerialPerspectiveLUT.Width` (the 3D texture "can use significant memory") and `.DepthResolution`
    - `r.SkyAtmosphere.SampleCountMax` and `r.SkyAtmosphere.DistanceToSamplesCountMax`
  - Defaults: the aerial-perspective LUT depth is 96 km and the aerial-perspective start depth is 100 m. — [UE SkyAtmosphere properties](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-properties-in-unreal-engine)
  - On mobile, a skydome mesh whose material has **Is Sky** enabled is required. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine)
  - Volumetric shadows can be traced at lower resolution and temporally reprojected, as RDR2 and UE already do. — [paper](https://sebh.github.io/publications/egsr2020.pdf)
- **Web impl.:**
  - **webgpu-sky-atmosphere** (MIT, npm `webgpu-sky-atmosphere`) is a WebGPU port of Hillaire's demo, with a [live demo](https://jolifantobambla.github.io/webgpu-sky-atmosphere/demo/). — [GitHub: JolifantoBambla/webgpu-sky-atmosphere](https://github.com/JolifantoBambla/webgpu-sky-atmosphere)
    - It offers compute, raster and LUT-only renderers, optional full-resolution ray marching or a hybrid mode, sun + moon, and a WGSL `get_shadow` hook.
    - Transmittance and multi-scattering LUTs are rendered once per atmosphere; sky-view and aerial-perspective LUTs are rendered per frame.
    - `rgba32float` LUTs need the `float32-filterable` feature. Low-resolution LUTs band, so dithering or TAA is recommended.
  - The original DX11 code plus a path-traced reference is MIT-licensed. — [sebh/UnrealEngineSkyAtmosphere](https://github.com/sebh/UnrealEngineSkyAtmosphere)

#### Bruneton precomputed atmospheric scattering [Foundational 2008; 2017 reimplementation]
- **Mechanism:** Precomputes multiple scattering iteratively, one pass per scattering order, into transmittance, scattering and irradiance tables that are then sampled at runtime. The 2017 rewrite adds documentation, tests, an optional luminance precomputation (vs RGB conversion) and Earth-independent texture mapping, so other planets work. Light shafts are only partly implemented (Eqs. 17–18, no shadow volumes). — [Bruneton 2017 page](https://ebruneton.github.io/precomputed_atmospheric_scattering/)
  - Iterating per order becomes impractical for dense atmospheres, and the LUTs can show horizon artifacts. — [Hillaire 2020](https://sebh.github.io/publications/egsr2020.pdf)
- **Shipped in:** Not established in this session. It is widely cited as the basis for later work, and Frostbite 2016 built on LUT approaches. — [Hillaire 2020](https://sebh.github.io/publications/egsr2020.pdf)
- **Cost/HW:** Rendering costs 0.22 ms per view on a GTX 1080, but a full LUT update costs 250 ms. Updates can be time-sliced over frames, at the price of latency. — [Hillaire 2020](https://sebh.github.io/publications/egsr2020.pdf)
- **Scalability ladder:** Precompute once offline, or on load, for a fixed atmosphere, then only sample at runtime. A changing atmosphere (weather) requires a time-sliced rebuild. — [Hillaire 2020](https://sebh.github.io/publications/egsr2020.pdf)
- **Web impl.:**
  - An official WebGL2 demo exists; its source is in `atmosphere/demo/webgl`. — [Bruneton 2017 page](https://ebruneton.github.io/precomputed_atmospheric_scattering/)
  - **@takram/three-atmosphere** describes itself as "An implementation of Precomputed Atmospheric Scattering". It is beta, MIT, and its WebGPU support is marked done. The monorepo is moving from WebGL shader chunks to a node-based WebGPU API that is not compatible with the current one; a WebGL fallback is planned. — [takram three-geospatial](https://github.com/takram-design-engineering/three-geospatial)

#### Analytic sky models: Preetham [Foundational 1999] and the Prague model (2021/2022), the cheapest tier
- **Mechanism:** Closed-form fits of sky radiance as a function of sun elevation, view direction and turbidity. Nothing is precomputed on the GPU.
  - three.js's `Sky` uses the Preetham model, which the code describes as "the de facto standard for analytical skydomes". — [three.js Sky.js source](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/objects/Sky.js)
  - The Prague Sky Model (Wilkie et al., SIGGRAPH 2021; Vévoda et al., CGF 2022 wide-spectral-range extension) is a fitted radiance + attenuation model with a C++ implementation under Apache-2.0. — [PetrVevoda/pragueskymodel](https://github.com/PetrVevoda/pragueskymodel); [Wilkie et al. 2021](https://cgg.mff.cuni.cz/publications/skymodel-2021/)
- **Shipped in:** Godot 4's `PhysicalSkyMaterial` is Preetham-based, with Rayleigh/Mie coefficients and colours, turbidity, ground colour, an additive `night_sky` texture and debanding. It supports one sun only, taken from the first DirectionalLight3D, and is "slightly slower" than ProceduralSkyMaterial. — [Godot PhysicalSkyMaterial](https://docs.godotengine.org/en/stable/classes/class_physicalskymaterial.html)
- **Cost/HW:** Effectively one fragment-shader evaluation per sky pixel, or per env-map texel. No LUTs. — [three.js Sky.js](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/objects/Sky.js); [Godot](https://docs.godotengine.org/en/stable/classes/class_physicalskymaterial.html)
- **Scalability ladder:** This is the bottom rung. No aerial-perspective volume, no multiple scattering beyond what the fit encodes, and no second light.
- **Web impl.:** three.js `Sky` works with WebGLRenderer only; WebGPURenderer users should use `SkyMesh`. — [three.js Sky.js](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/jsm/objects/Sky.js)

#### Unity HDRP Physically Based Sky
- **Mechanism:** A Volume override that models air and aerosol density as participating media. Aerosols "can simulate real-world pollution or fog". Only lights with **Affect Physically Based Sky** contribute, and baked lights are ignored after baking. — [Unity HDRP 17 docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/create-a-physically-based-sky.html)
- **Shipped in:** Unity HDRP. It is a PC/console pipeline; HDRP is not used for mobile. — [Unity HDRP docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/create-a-physically-based-sky.html)
- **Cost/HW:** The sunlight attenuation LUT covers at most 128 km. Turning off `PrecomputedAtmosphericAttenuation` gives exact attenuation for a "slight performance cost". The docs give a 130,000 lux sun for physical correctness and say the planet is not written to depth. — [Unity HDRP docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/create-a-physically-based-sky.html)
- **Scalability ladder / update modes:** Not verified (see Gaps).
- **Web impl.:** N/A.

#### Time-of-day: updating sky-derived lighting (sky-light capture, radiance/ambient re-bake, sun + moon)
- **Mechanism:** Atmosphere LUTs are cheap to rebuild every frame. The expensive part of a time-of-day system is re-capturing and convolving the sky into reflection and ambient probes, so engines time-slice or lower that update.
- **Shipped in / Cost:**
  - **UE.** The Sky Light **Real Time Capture** mode provides cloud reflections and time-of-day support. The docs' illustrative cost is specular convolution 0.8 ms + sky and cloud 0.6 ms, with the capture time-sliced over 9 frames. — [UE Volumetric Cloud docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)
  - **UE sun and moon.** Two atmospheric directional lights are supported (Atmosphere Sun Light Index 0 = sun, 1 = moon), but multi-scattering is not evaluated for the second light. — [UE Sky Atmosphere docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine)
  - **UE reference illuminances.** These are useful for exposure across day and night. — [UE Sky Atmosphere docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/sky-atmosphere-component-in-unreal-engine)
    - Sun at zenith ≈ 120,000 lux, 0.545° disk.
    - The sky contributes ≈ 20% of the ≈ 150,000 lux total on a white surface.
    - Moon at zenith ≈ 0.26 lux, 0.568° disk.
  - **Godot 4.** `Sky.process_mode` controls radiance-map updates. — [Godot Sky class](https://docs.godotengine.org/en/stable/classes/class_sky.html)
    - **Quality:** importance-sampled; "should not be used if you plan on changing the sky at runtime".
    - **Incremental:** same sampling, spread over several frames, "for a sky that updates slowly".
    - **Realtime:** a fast filter usable every frame, limited to 256×256 radiance.
    - The default radiance size is 256; sizes ≥512 can strain some hardware.
- **Scalability ladder:** Per-frame capture → time-sliced capture (UE: 9 frames; Godot: incremental) → recapture only when the sky changes → static baked probes. — [UE](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine); [Godot](https://docs.godotengine.org/en/stable/classes/class_sky.html)
- **Web impl.:** webgpu-sky-atmosphere renders the constant LUTs once and the view LUTs per frame. — [GitHub](https://github.com/JolifantoBambla/webgpu-sky-atmosphere)

#### Frostbite physically based sky/atmosphere/clouds [Foundational 2016]
- **Mechanism / shipped:** Hillaire's "Physically Based Sky, Atmosphere and Cloud Rendering in Frostbite" was presented in the SIGGRAPH 2016 PBS course (pptx only). — [course page](https://blog.selfshadow.com/publications/s2016-shading-course/)
  - The 2020 paper says its aerial-perspective froxel volume follows Hillaire 2016, and that 2016 showed LUT updates can be time-sliced. — [Hillaire 2020](https://sebh.github.io/publications/egsr2020.pdf)
  - Details, timings and shipped titles were not extracted (see Gaps).

### Inferences
- **Isometric relevance by output:**
  - **Low relevance: sky-view LUT and sky dome.** With a pitched ARPG camera the sky is almost never on screen. It is still needed for title/menu scenes, cinematics, zoomed-out map views and reflections in water or wet stone.
  - **High relevance: transmittance and multi-scattering LUTs.** They give a physically consistent sun colour vs elevation and sky ambient (hemisphere/SH) colour, which drive the whole scene's lighting mood across a day/night cycle.
  - **Low relevance: physical aerial perspective.** It is designed for kilometre-scale depth (32 km default, UE start depth 100 m). A top-down view spans only tens of metres of depth, so physical aerial perspective is ≈ zero. Artistic height/distance fog matters more (fog section).
- **Cheapest viable plan for a web ARPG:**
  - Build Hillaire's transmittance and multi-scattering LUTs once per sun-angle change, or offline per time-of-day key.
  - Derive the sun illuminance colour, an ambient SH or hemisphere colour (sample the sky in a few directions, or render a tiny sky-view LUT occasionally) and a fog in-scatter colour.
  - Store the results as a 1D time-of-day gradient that artists can override with grading. Physically correct blue skies conflict with a dark gothic palette, so heavy aerosol/Mie density (HDRP's "pollution or fog" knob) plus grading is the likely look.
- **WebGL2 feasibility:**
  - All four LUTs are fragment-shader passes into small float/half-float targets.
  - The 3D aerial-perspective LUT can be rendered slice-by-slice into a 3D texture, or skipped as argued above.
  - Expected cost is <0.5 ms on desktop dGPUs and roughly ~1 ms on weak integrated or mobile GPUs, by analogy with the GTX 1080 / iPhone 6s data.
- **WebGPU:** The compute path maps directly; webgpu-sky-atmosphere already exists, and takram's WebGPU atmosphere is a three.js-ecosystem option.
- **Preetham (three.js `Sky`, Godot):** Fine for a menu skybox or reflections. It has no moon or second light (Godot docs) and was not verified for twilight quality. The night sky needs a separate star or moon texture, as Godot's additive `night_sky` does.
- **Time-of-day re-baking is the real cost on the web.**
  - Regenerating a three.js PMREM environment every frame is expensive. Amortise it the way UE (9-frame time slicing) and Godot (incremental mode) do, or update only when the sun moves more than a threshold.
  - Sky reflections are rarely visible top-down, so a very low-resolution environment map (e.g., 32–64 px faces) is likely enough.
  - Dynamic moonlight for night levels should be a second directional light with its own colour/intensity table (UE treats the moon as light index 1, without multi-scattering).

### Gaps
- **Hillaire 2020 Table 2:** the per-LUT rows were reconstructed from pdftotext output by row order (two-column layout). The totals match the slides' 0.31 ms and 1.03 ms, so confidence is high but not absolute.
- **UE versions:** the version that introduced SkyAtmosphere (believed 4.24) was not confirmed.
- **UE defaults:** most cvar defaults are missing from the docs, and no console or mobile ms timings were found beyond the paper.
- **Unity HDRP Physically Based Sky:** the update modes (On Changed / On Demand / Realtime) and the underlying algorithm (LUT vs analytic) were not on the fetched page.
- **Not fetched:** Hosek-Wilkie 2012, Unity URP sky options, and a Babylon.js atmosphere add-on (rumoured). The web-search budget for the session ran out mid-research.
- **Frostbite 2016:** the course (pptx only) was not parsed, so its timings and shipped titles are not captured.
- **No sky-specific data found** for Switch 2 or for 2024–2026 game-specific time-of-day talks (e.g., Assassin's Creed Shadows, Monster Hunter Wilds).

## Volumetric clouds

### Takeaway
Real-time volumetric clouds evolved through four stages:
- **Horizon Zero Dawn / Nubis (2015):** procedural noise ray-marched at quarter resolution with 4×4 temporal reprojection, about 2 ms on PS4.
- **Nubis Evolved (Forbidden West, 2022):** flyable "envelope" clouds with distance-field stepping (4.2 → 1.3 ms).
- **Nubis³ (Burning Shores, 2023):** compressed voxel clouds plus an SDF at 2.1–4 ms on PS5.
- **UE Volumetric Cloud:** material-graph clouds traced at quarter resolution, with Beer shadow maps. Epic says it is "not reasonably achievable on mobile".

For a top-down ARPG the clouds themselves are rarely visible. What carries over cheaply is **cloud shadows** (a 2D map or light cookie), **2D cloud layers** and the cost tricks (low resolution, temporal reprojection, early-out, distance-field skipping).

### Cited Findings

#### Horizon Zero Dawn "vertical-profile" clouds / Nubis [Foundational 2015; talks 2015 and 2017]
- **Mechanism:**
  - **Noise and density.** Density is assembled from tiling noise:
    - a 128³ texture holding Perlin-Worley in the first channel plus 3 Worley octaves
    - a 32³ Worley detail texture
    - a 128² curl-noise texture that fakes swirl and fluid motion
    
    It is shaped by 3 height-gradient presets for the cloud types. A weather texture supplies R = coverage, G = precipitation, B = cloud type.
  - **Lighting.** Beer's law + Henyey-Greenstein phase + a "powder" term for dark edges facing the light (Beer-Powder).
  - **Layers.** Low-altitude volumetric strato clouds sit between 1,500 and 4,000 m. Alto and cirrus clouds above 4,000 m are 2D scrolling textures.
  
  — [Schneider, "The Real-time Volumetric Cloudscapes of Horizon: Zero Dawn", SIGGRAPH 2015 Advances (PDF)](https://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf); [Advances 2015 page](https://advances.realtimerendering.com/s2015/index.html)
- **Shipped in:** Horizon Zero Dawn, PS4. The talk calls it "under two milliseconds on the PlayStation 4". The game's 2017 release year is general knowledge, not verified in this session. — [Guerrilla: Nubis Evolved page](https://www.guerrilla-games.com/read/nubis-evolved)
- **Cost/HW:** About 2 ms and 20 MB of RAM on PS4, replacing earlier asset-based clouds. The first version cost ~20 ms. — [HZD 2015 PDF](https://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf)
  - **Ray march:** 64 potential samples, rising to 128 at the horizon. Cheap large steps are taken until a cloud is hit; the march steps back one sample and switches to full detail, then returns to cheap steps after several consecutive zero-density samples, and exits early when alpha reaches 1.
  - **Lighting samples:** 6 in a cone toward the sun (5 near + 1 long-distance). They switch to cheap samples beyond a certain depth.
  - **Temporal reconstruction:** "Every frame we could use a quarter res buffer to update 1 out of 16 pixels for each 4x4 pixel block". The previous frame is reprojected, and low-resolution results fill in at screen edges. This made the shader "10x faster or more".
- **Scalability ladder:** In-talk options were temporal amortisation (1/16 pixels per frame), cheap vs full noise sampling and 2D layers for high clouds. — [HZD 2015 PDF](https://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf)
  - Hillaire contrasts the two reconstruction styles. Schneider 15/17 updates 1 pixel per 4×4 tile: "16 frame latency but looks full-res". Bauer 19 (RDR2) traces at quarter resolution with TAA upsampling: "instant result but looks blurrier". — [Hillaire SIGGRAPH 2020 slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
- **Web impl.:** None verified (see Gaps).

#### Nubis Evolved: envelope model + VFX superstorms (Horizon Forbidden West, SIGGRAPH 2022)
- **Mechanism:** Moves from the HZD 2.5D field (2D maps lifted into 3D density at render time) to an "envelope model" for flyable cloud environments. Clouds are also used as VFX, for example fast-spinning superstorms with internal lightning flashes. — [Guerrilla: Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved); [slides PDF](https://advances.realtimerendering.com/s2022/SIGGRAPH2022-Advances-NubisEvolved-NoVideos.pdf)
  - Ray marching is accelerated with sphere-tracing / cone-step-mapping ideas. The slides cite Hart 1995 and Dummer 2006, and the Nubis³ recap labels the step "Cone Step Mapping + Distance Step Mapping". — [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf)
- **Shipped in:** Horizon Forbidden West (PS4/PS5; 2022 release, general knowledge). The superstorms have a separate GDC 2022 talk, "The Real-Time Volumetric Superstorms of Horizon Forbidden West", which is cited in the Nubis³ references. — [Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved); [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf)
- **Cost/HW:**
  - It targets "1080p without temporal upscaling" and adds internal lighting at "near zero cost". — [Nubis Evolved](https://www.guerrilla-games.com/read/nubis-evolved)
  - With cone-step + distance-step marching, an in-engine render drops from **4.2 ms to 1.3 ms**. — [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf); [Nubis Evolved slides](https://advances.realtimerendering.com/s2022/SIGGRAPH2022-Advances-NubisEvolved-NoVideos.pdf)
- **Scalability ladder (superstorm VFX, PS4 vs PS5):** Column alignment was reconstructed from text extraction. — [Nubis Evolved slides](https://advances.realtimerendering.com/s2022/SIGGRAPH2022-Advances-NubisEvolved-NoVideos.pdf)

  | Setting | PS4 | PS5 |
  |---|---|---|
  | Max resolution | 960×540 | 1920×1080 |
  | Light-ray samples | 6 | 10 |
  | View-ray samples | 60–90 | 96–180 |
  | Blur scale | 2× | 1× |
  | Noise MIP | 1 | 0 |
  | Cost | ≤ 4 ms | ≤ 2–3 ms |
- **Web impl.:** None found.

#### Nubis³ (Nubis Cubed): voxel clouds (Horizon Forbidden West: Burning Shores, SIGGRAPH 2023)
- **Mechanism:** Clouds are grown with fluid simulations in Houdini and stored as voxel grids, then sampled through an "up-rez" density sampler. The sampler gives "seamless high detail over distance" with "0.5 meter precision" while avoiding memory bottlenecks.
  - Ray marching is a hybrid of SDF, adaptive and jittered steps (`step = max(sdf_distance, adaptive_step) + jitter`), using a compressed SDF (BC1, 0.5 B/texel).
  - Lighting stores summed density for some samples. Many other approximations were simplified as a result.
  - The renderer was built in "less than six months". The abstract mentions SDF compression, fluid-sim modelling and accelerated light sampling with dark-edge / inner-glow approximations.
  
  — [Guerrilla: Nubis Cubed](https://www.guerrilla-games.com/read/nubis-cubed); [slides PDF](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf)
- **Shipped in:** The slides show "The Burning Shores" trailer and section, with clouds acting as volumetric skyboxes with time of day and supporting flight on a mount. The DLC's 2023 release is general knowledge. — [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf); [Nubis Cubed page](https://www.guerrilla-games.com/read/nubis-cubed)
- **Cost/HW (PS5):** — [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf)
  - **Memory per voxel grid:**

    | Grid (voxels) | Uncompressed (2 B/texel) | BC4 (0.5 B/texel) |
    |---|---|---|
    | 4096×4096×512 | 17.18 GB | 4.29 GB |
    | 2048×2048×256 | 2.15 GB | 537 MB |
    | 1024×1024×128 | 268 MB | 67 MB |
    | 512×512×64 | 33.5 MB | 8.4 MB |

    A 512×512×64 grid (~16.8 MB) and a 128³ noise volume (4.19 MB at 2 B/texel) appear in the sampling slides.
  - **Density sampler:** 10 ms at 960×540, against 30+ ms for dense-grid sampling.
  - **Optimisation table (cloud cost in ms, three views):**

    | View | Base | + Voxel-based lighting | + Adaptive & SDF ray-march |
    |---|---|---|---|
    | 1 | 10 | 6.1 | 2.2 |
    | 2 | 12 | 8.2 | 4.0 |
    | 3 | 10 | 8.0 | 4.0 |

    The final ray-marcher costs "2.2 to 4 Milliseconds". Voxel lighting amortises at "0.1 to 0.2ms every 8 frames" and cuts render time by 40%.
  - **Rendering modes:** the frame is split at 200 m (<200 m rendered at 480×270, >200 m at 960×540), which "saves around 50%". 30 Hz mode at 960×540 costs 4 ms; 40/60 Hz mode at 960×540 + 480×270 costs 2.1 ms.
- **Scalability ladder:** The slides' comparison table covers the three Guerrilla methods. — [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf)

  | Feature | Vertical profile (HZD) | Envelope (HFW) | Voxel (Nubis³) |
  |---|---|---|---|
  | Evolution | Yes | Pseudomotion only | Pseudomotion only |
  | Time of day | Yes | Yes | Yes |
  | Lightning | Yes | No | Yes |
  | Terrain-cast shadows | No | Yes | Yes |
  | High frame rates | Yes | Yes | Yes |
  | Flight-capable | No | Yes | Yes |
  | Freeform modelling | No | No | Yes |
- **Web impl.:** None found. A UPenn CIS 565 student project lists a Vulkan implementation of the Nubis³ method (desktop, not web; seen in search results). — [GitHub: YueZhang1027/CIS5650-Final-Project-Frostnova](https://github.com/YueZhang1027/CIS5650-Final-Project-Frostnova)

#### UE Volumetric Cloud component (UE 4.26+ / UE5)
- **Mechanism:** Ray-marches a layer whose density comes from a **Volume material graph**, so clouds can take any shape, including tornadoes and "bunny" clouds. This lifts the static noise-recipe restriction of Schneider and Bauer. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine); [Hillaire 2020 slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
  - Multiple scattering is approximated with "multiple octaves of single scattering" (Wrenninge 2013), with 0–2 octaves. The default is 0, and games are advised to use 1.
  - Self- and scene shadowing is either **ray-marched** (sharp and coloured, limited distance) or uses **Beer Shadow Maps**: cascaded, far-reaching and faster, recommended for XB1/PS4. A Beer shadow map is stored as R11G11B10F. Hillaire notes exponential shadow maps "are exactly Beer's law" but with one constant, which is why RDR2 used ESM.
- **Shipped in:** UE5 projects. No specific 2023–2026 title was verified in this session. The docs' platform table lists Volumetric Clouds as **not supported on Mobile**, "Yes" on XB1/PS4 (shadow maps recommended), XSX/PS5 and PC. The UE version that introduced it (believed 4.26) was not verified. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)
- **Cost/HW:**
  - `r.VolumetricRenderTarget.Mode` controls resolution:
    - **Mode 0:** traces at quarter resolution, reconstructs at half and upsamples to full. This is the quality default for ground-to-space and flying.
    - **Mode 1:** traces at half resolution, for ground views, at higher cost.
    - **Mode 2:** full-resolution look, fast to trace, but no intersection with opaque meshes.
  - Sample-count scales cover view, reflection and shadow, with cvars such as `r.VolumetricCloud.ViewRaySampleMaxCount`, `r.VolumetricCloud.ReflectionRaySampleMaxCount`, `r.VolumetricCloud.SampleMinCount` and `r.VolumetricCloud.DistanceToSampleMaxCount`. They can be set per platform through Device Profiles.
  - Cheapening options are **Conservative Density** (skip the material when density ≤ 0), a **Gray Scale** material and leaving **Ground Contribution** off.
  - Clouds do not appear in ray tracing; they show up in reflections only through the Sky Light capture.
  - No ms timings are given apart from an illustrative capture example.
  
  — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)
- **Scalability ladder:** Mobile has atmosphere only, no clouds. Hillaire: "Only cloud rendering is not reasonably achievable on mobile. For now." — [Hillaire 2020 slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
  - XB1/PS4 use Beer shadow maps instead of secondary ray marching, and lower sample-count scales and render-target modes cover the rest. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)
  - Cinematic quality (`r.VolumetricCloud.HighQualityAerialPerspective 1`, per-sample transmittance) "bypasses optimizations". — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)
- **Web impl.:** **@takram/three-clouds** provides geospatial volumetric clouds for three.js. It is beta and its WebGPU port is a work in progress. — [takram three-geospatial](https://github.com/takram-design-engineering/three-geospatial)

#### Red Dead Redemption 2: unified clouds/fog/sky [SIGGRAPH 2019 talk; game 2018, release year general knowledge]
- **Mechanism:** Fabian Bauer's "Creating the Atmospheric World of Red Dead Redemption 2: A Complete and Integrated Solution" voxelizes and ray-marches scattering and transmittance. The same data serves the main viewport, reflection maps and a sky irradiance probe grid, with clouds, fog and volumetrics sharing data and optimised for PS4/XB1. — [Advances 2019 page](https://advances.realtimerendering.com/s2019/index.htm)
  - Later work cites it for tracing at quarter resolution with TAA upsampling and for exponential shadow maps for volumetric shadowing. — [Hillaire 2020 slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf); [Hillaire 2020 paper](https://sebh.github.io/publications/egsr2020.pdf)
- **Cost/HW and scalability:** Not extracted. The 232 MB pptx was not parsed.
- **Web impl.:** None.

#### Unity HDRP Volumetric Clouds (2021 LTS+)
- **Mechanism / controls:** — [HDRP 14 docs: Volumetric Clouds](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Volumetric-Clouds.html)
  - Temporally accumulated ray-marched clouds with **Temporal Accumulation Factor** (higher means less noise but more ghosting), **Ghosting Reduction** and **Perceptual Blending**.
  - **Num Primary Steps** has a linear cost; **Num Light Steps** controls lighting cost.
  - **Cloud Map Resolution**: lower is faster.
  - **Local Clouds**: when on, clouds are part of the scene and interact with geometry; when off, they render into the skybox behind everything.
  - Clouds are disabled by default in realtime and planar reflection probes for cost reasons. Where enabled, they render at low resolution with no temporal accumulation.
- **Shipped in:** HDRP, "now included in 2021 LTS". Unity says the clouds "can cast believable shadows onto the landscape" and respond to global wind (search-result snippet). — [Unity blog (es)](https://blog.unity.com/es/technology/experience-true-volumetric-clouds-with-hdrp-unity-20212)
- **Cost/HW:** No ms numbers on the fetched page. Resolution presets were not documented there.
- **Scalability ladder:** Fewer steps, a lower cloud-map resolution and the skybox (non-local) mode. Cloud Layer (below) is the cheap alternative. — [HDRP docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Volumetric-Clouds.html)
- **Web impl.:** N/A.

#### 2D cloud layers (cheap tier)
- **Mechanism:** A 2D cloud texture composited onto the sky. HDRP's **Cloud Layer** works this way: — [HDRP 14 docs: Cloud Layer](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Cloud-Layer.html)
  - The map uses a LatLong layout with 4 opacity channels, up to 2 layers, and wind as horizontal scroll or flowmap.
  - "Raymarching" approximates sun self-shadowing, controlled by Steps, Density and an Ambient Probe Dimmer.
  - The map and its lighting are baked into an intermediate texture that is recomputed only when a parameter changes.
  - HZD also rendered its high-altitude alto and cirrus clouds as 2D scrolling textures instead of ray-march samples. — [HZD 2015 PDF](https://advances.realtimerendering.com/s2015/The%20Real-time%20Volumetric%20Cloudscapes%20of%20Horizon%20-%20Zero%20Dawn%20-%20ARTR.pdf)
- **Shipped in:** Unity HDRP; newer docs separate "Create simple clouds (Cloud Layer)" from "Create realistic clouds (volumetric clouds)". The HZD high-altitude layer is a second example. — [HDRP 17.2 TOC](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.2/manual/toc.html)
- **Cost/HW:** Cost is mostly one texture sample per sky pixel, plus a re-bake when parameters change. The docs give no ms figures. — [HDRP Cloud Layer](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Cloud-Layer.html)
- **Scalability ladder:** This is the fallback for platforms without volumetric clouds.
- **Web impl.:** None verified. The approach is trivial in any engine.

#### Cloud shadows (cloud shadow maps, Beer shadow maps, light cookies), the most useful piece for top-down games
- **Mechanism:** Project cloud transmittance from the sun's direction onto the scene as a shadow map or light cookie centred on the camera.
  - **UE.** On atmospheric directional lights: — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine)
    - **Cast Cloud Shadows** lets clouds shadow the scene and create sunlight shafts.
    - **Cloud Shadow Extent** sets the radius around the camera in km.
    - **Cloud Shadow Map Resolution Scale** and **Cloud Shadow Ray Sample Count Scale** set cost; the latter also drives sky-light cloud AO.
  - **HDRP Cloud Layer.** **Cast Shadows** "projects clouds onto the ground through the main directional Light's cookie", with Shadow Multiplier, Tint, Resolution and Size. — [HDRP Cloud Layer](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Cloud-Layer.html)
  - **HDRP Volumetric Clouds.** Shadows override the directional light's cookie and take precedence over Cloud Layer shadows, with Shadow Resolution, Shadow Distance, Shadow Plane Height Offset and Shadow Opacity/Fallback. — [HDRP Volumetric Clouds](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Volumetric-Clouds.html)
  - **Beer shadow maps (UE).** They store a transmittance curve per texel, which is better than ESM for clouds. Shadows can be baked into the sky-view and aerial-perspective LUTs when per-pixel tracing is too costly. — [Hillaire 2020 slides](https://blog.selfshadow.com/publications/s2020-shading-course/hillaire/s2020_pbs_hillaire_slides.pdf)
- **Shipped in:** UE5, HDRP, and Horizon Forbidden West / Burning Shores, whose envelope and voxel methods support terrain-cast cloud shadows. — [Nubis³ slides](https://advances.realtimerendering.com/s2023/Nubis%20Cubed%20(Advances%202023).pdf)
- **Cost/HW:** A cookie or shadow-map lookup per lit pixel, plus generating the map, which is cheap for 2D layers since it is re-baked only on change. — [HDRP Cloud Layer](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Cloud-Layer.html)
- **Scalability ladder:** Ray-marched shadows → Beer shadow map → 2D cookie from a cloud layer → none. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-cloud-component-in-unreal-engine); [HDRP docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Cloud-Layer.html)
- **Web impl.:** None verified (see Gaps).

#### Stable volume sampling under camera motion [Foundational 2015]
- **Mechanism / Web impl.:** Bowles & Zimmermann, "A Novel Sampling Algorithm for Fast and Stable Real-Time Volume Rendering" (SIGGRAPH 2015 Advances), places samples to reduce aliasing in volumetric clouds as the camera moves. Code is a Unity 5 project at github.com/huwb/volsample. — [Advances 2015 page](https://advances.realtimerendering.com/s2015/index.html)

### Inferences
- **Isometric relevance by technique:**
  - **Full volumetric cloudscapes (Nubis, UE Volumetric Cloud, HDRP volumetric): low ROI.**
    - The camera looks at the ground, so clouds are seldom in frame, yet they cost 2–4 ms on PS5-class hardware even with heavy tricks.
    - Worthwhile exceptions:
      - cinematics, title screens and zoomed-out world-map views
      - "cloud sea below" levels (cliffs, abysses, sky citadels), where the camera looks down onto clouds
      - a localised boss storm as a VFX volume, in the spirit of Nubis superstorms
  - **Cloud shadows: high value, very low cost.** Slow, soft, drifting light/dark patches on the ground add scale and life to an isometric map and suit the oppressive overcast mood.
    - Implementation: a tileable cloud-density texture (2 octaves, optionally with a Beer-law falloff for soft edges), projected along the sun direction in world XZ, scrolled by wind and multiplied into the directional light in the lit shader.
    - The same term should feed the volumetric fog / god-ray system so the light shafts move with the shadows (fog section).
    - This is one texture fetch per pixel and works in WebGL2 as well as WebGPU/TSL.
    - On WebGPU three.js, add it to an existing texture or packed channel rather than a new sampler. This project's lab has already hit the 16-sampler limit on terrain.
  - **2D cloud layer: medium value.** Use it for sky reflections in water and for menu or cinematic shots, or as a "clouds far below" plane with parallax for chasm levels.
  - **Storm and lightning:** the "near zero cost" internal lightning of Nubis Evolved maps to a directional-light intensity pulse, a flash in the cloud-shadow texture and an emissive pulse in the 2D layer.
- **If a ray-marched cloud volume is ever wanted on the web:**
  - **Reconstruction:** copy HZD's quarter-res buffer with 1/16 pixels updated per frame plus reprojection (full-res look, 16-frame latency), or UE mode 0 / Bauer-style quarter-res + TAA (instant but blurrier).
  - **Data and marching:** tiny noise volumes (HZD totals ~20 MB), coarse-then-fine stepping with step-back, early exit and SDF / cone-step skipping (4.2 → 1.3 ms in HFW).
  - **API:** WebGL2 has 3D textures and fragment-shader ray marching, so this is feasible. WebGPU compute helps with tiled and temporal scheduling.
  - **Cost:** expect several ms on integrated GPUs. Reserve it for a localised effect, not a sky.
- **Nubis³-style voxels:** memory runs from 8.4 MB (512×512×64 BC4) to gigabytes. On the web, BC compression for 3D textures is not reliably available (desktop-only features or extensions), so plan on R8 volumes (512×512×64 R8 ≈ 16.8 MB). That suits one hero cloud or a storm mass, not an open world.
- **Dark gothic look:** physically based clouds are less important than value control. The practical recipe is overcast density via the cloud-shadow texture, desaturated sky ambient and occasional lightning, all of which work without volumetric clouds.

### Gaps
- **Nubis tables:** column alignment in the Nubis Evolved superstorm table and the Nubis³ optimisation and voxel tables was reconstructed from pdftotext output. The values are reliable; the row/column mapping is high-confidence but should be checked against the slides if quoted exactly.
- **Talk/release metadata:** the 2017 Nubis talk title and HZD's release year were not verified in this session, and neither were HFW's (2022) or Burning Shores' (2023), except where the slides say so.
- **UE Volumetric Cloud:** no console or PC ms timings in the official docs; the introduction version (believed 4.26) is unconfirmed.
- **HDRP Volumetric Clouds:** default step counts, resolution presets and timings were not on the fetched page.
- **RDR2 (2019) and Frostbite (2016):** the talks were not parsed (huge pptx files), so their concrete costs are missing.
- **Not found:**
  - Microsoft Flight Simulator 2020/2024 cloud tech
  - 2024–2026 game-specific cloud talks (e.g., Assassin's Creed Shadows, Monster Hunter Wilds, Black Myth: Wukong)
  - Switch 2 cloud scalability data
  - cloud-shadow use in isometric ARPGs (Diablo IV, PoE2)
  - UE "2D cloud planes" or light-function cloud-shadow workflows
  - a Babylon.js atmosphere/cloud add-on
  - the three.js volume-cloud examples
  
  The session's web-search budget ran out mid-research, so these leads could not be checked.

## Volumetric fog and light

### Takeaway
Froxel (frustum-voxel) volumetric fog has been the standard AAA method since Assassin's Creed IV (2013/14) and Frostbite (2015). It uses a low-resolution 3D grid aligned to the camera, roughly 160×90×64 to 240×135×64 cells. Each cell is lit once, the grid is integrated front to back, and the result is temporally reprojected. The cost is about 1 ms on a PS4-class GPU, and it now ships in UE5, HDRP and Godot 4. Newer work (2023–2026) adds cheap, placeable local fog: UE Local Fog Volumes use analytic integrals, are culled per screen tile and also run on low-end platforms, while HDRP and Godot voxelize their local volumes into the froxel grid. At the high end, UE adds VDB-style Heterogeneous Volumes and Sparse Volume Textures, but the UE 5.8 docs still mark both Experimental, they need Windows DX11/12 and they do not work on mobile. For a top-down ARPG the practical stack is:
- analytic height fog;
- a few local fog volumes;
- for light shafts, either a small froxel grid (WebGPU compute) or a quarter-resolution shadow-map raymarch.

Screen-space radial god rays fit poorly because the sun is almost never on screen. Mesh or card shafts remain the cheapest option that artists can direct. The genre reference, Diablo IV (2023), replaced card-based dust with lit volumetric air, including stained-glass windows that light the air.

### Cited Findings

#### 1. Froxel volumetric fog: Assassin's Creed IV (Wronski) [Foundational 2014]
- **Mechanism:** The method uses a 3D texture aligned to the camera frustum. Width and height follow normalized device coordinates (NDC), and the depth slices use an exponential distribution concentrated near the camera, "where we need the most precision". It runs as compute passes:
  - (1) lighting and shadowing for every cell;
  - (2) density estimation and animation (one octave of wind-animated Perlin noise plus exponential vertical falloff, because heavy particles gather near the ground);
  - (3) a 2D raymarch through the depth slices, writing the accumulated result back into the volume;
  - (4) an apply step that does a bilinear 3D-texture lookup plus one fused multiply-add, for both forward and deferred shading.

  The apply step "is compatible with any number of transparent objects layers". — [Wronski slides pp. 24–25, 37, 45](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
- **Key idea:** The design came from the future-work section of Light Propagation Volumes (Kaplanyan 2009). The scene is raymarched once, regardless of how many lights there are, and "if we added simple shadowing term, we would gain light shafts/god rays just for the cost of calculating the shadowing". — [Wronski slides p. 17](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
- **Shipped in:** *Assassin's Creed IV: Black Flag* (2013) on next-gen consoles and PC, presented at the SIGGRAPH 2014 Advances course under the title "Volumetric Fog: Unified Compute Shader-Based Solution to Atmospheric Scattering". It handles fog, smoke, haze, god rays and volumetric shadows with multiple lights. — [Advances 2014 course page](https://advances.realtimerendering.com/s2014/index.html)
  - The same course included Guerrilla's "Reflections and Volumetrics of Killzone Shadow Fall" (Valient), which covers volumetric reprojection and integration with transparent effects. — [Advances 2014 course page](https://advances.realtimerendering.com/s2014/index.html)
- **Cost/HW:**
  - **Grid and range:** The volume is 160×90×64 or 160×90×128 depending on platform. The cost is fixed and independent of screen resolution, because "160x90x64 … is equal to number of texels in 720p surface". The effect range was 50–128 m. — [Wronski p. 25](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
  - **Requirements:** compute shaders and writes to 3D textures through UAVs (unordered access views). — [Wronski p. 22](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
  - **Shadows:** The cascaded shadow maps (4 cascades at 1536² or 1k²) are downsampled 4× into a 1024×256 R32F exponential shadow map (ESM) with a separable box blur. ESM light leaking "wasn't noticeable in our case in participating media". — [Wronski pp. 31–33](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
  - **Lights:** sun or moon, a constant ambient term, and artist-flagged dynamic point lights. — [Wronski p. 37](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
  - **Timings:** "Total cost was surprisingly small, around 1.1ms". Running at double resolution cost 1.6 ms. Density plus lighting was the biggest step at about 0.43 ms, and every other pass was under 0.2 ms. — [Wronski p. 47](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf) *(The text extraction did not capture which console these timings were for.)*
- **Optimizations / scalability:** The talk lists several:
  - reuse the shadow-map setup and the lit volume to light particles and transparent surfaces;
  - drop lighting detail (LOD it away) at distance;
  - skip cells behind geometry using a hierarchical Z buffer;
  - cull fog lights with Forward+ or clustered shading;
  - run the fog on async compute alongside the G-buffer pass.

  — [Wronski pp. 48–49](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
- **Post-ship extensions:** physically based phase functions, plus temporal jitter and reprojection. "Reprojection is much easier in 3D than in 2D case." The simplest 1-sample temporal jitter removed "almost all edge artifacts". — [Wronski pp. 51, 56–60](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
- **Web impl.:** See the web list in §11.

#### 2. Frostbite unified, physically based volumetrics (Hillaire) [Foundational 2015]
- **Mechanism:** The SIGGRAPH 2015 Advances talk "Towards Unified and Physically-Based Volumetric Lighting in Frostbite" puts particles, depth fog and other media under shared physically based parameters. Its components are:
  - a cascaded extinction volume;
  - voxelization of particles into that volume;
  - a volumetric shadow map, so any light can cast shadows;
  - a final participating-media rendering pass.

  — [Advances 2015 course page](https://advances.realtimerendering.com/s2015/index.html); [EA/Frostbite news post](https://www.ea.com/news/physically-based-unified-volumetric-rendering-in-frostbite)
- **Shipped in:** The course page says the framework "will be used for all games powered by Frostbite in the future". — [Advances 2015](https://advances.realtimerendering.com/s2015/index.html)
  - Before this, Frostbite volumetrics were limited to global distance/height fog, screen-space light shafts and particles. — [SlideShare deck](https://www.slideshare.net/DICEStudio/physically-based-and-unified-volumetric-rendering-in-frostbite) *(this comes from a search-result summary; the deck itself was not opened)*
- **Cost/HW:** The course page gives no performance figures. The slides are a 158 MB PPTX that was not reviewed. — [Advances 2015](https://advances.realtimerendering.com/s2015/index.html)
- **Scalability ladder / Web impl.:** Nothing specific found.

#### 3. Unreal Engine Volumetric Fog (froxel, UE4 → UE 5.8 docs)
- **Mechanism:** Volumetric Fog is an optional part of the Exponential Height Fog component. It computes "participating media density and lighting at every point in the camera frustum", using low-resolution voxels aligned to the camera with "a heavy temporal reprojection filter with a different sub-voxel jitter each frame". View Distance sets the range, and `r.VolumetricFog.GridSizeZ` sets the number of depth slices. — [UE docs: Volumetric Fog](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
- **Lights:**
  - Supported: one directional light (cascaded shadow maps or static shadowing, plus a light function), any number of point and spot lights, sky lights (shadowed by distance-field AO), and particle lights.
  - A per-light **Volumetric Scattering Intensity** controls each light's contribution.
  - Enabling **Cast Volumetric Shadow** makes point and spot lights "approximately three times more expensive".

  — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
- **Density authoring:** Volume-domain materials output albedo, emissive and extinction, but "currently only work on particles", so they are limited to each particle's radius. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
  - Sparse Volume Texture materials applied to meshes are also supported in Volumetric Fog. — [UE docs: SVT](https://dev.epicgames.com/documentation/en-us/unreal-engine/sparse-volume-textures-in-unreal-engine)
- **Shipped in:** Standard UE4/UE5 feature; the page is labelled "Unreal Engine 5.8 Documentation". — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
- **Cost/HW:** "Volumetric Fog costs 1 millisecond on PlayStation 4 at High settings" and "3 milliseconds on an NVIDIA 970 GTX on Epic settings, which has eight times more voxels". The grid resolution follows the engine's Shadow scalability level. Volume particles add a significant extra cost. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
- **Limitations:**
  - Not supported: IES profiles and light functions on point/spot lights, self-shadowing, and Start Distance / Max Opacity / Cutoff on Exponential Height Fog. The volume cannot be decoupled from the camera.
  - Fast-changing lights such as flashlights and muzzle flashes leave trails through the temporal filter; the suggested fix is to set Volumetric Scattering Intensity to 0 on those lights.
  - Translucent surfaces evaluate fog per vertex unless "Compute Fog Per-Pixel" is enabled.

  — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
- **Scalability ladder:** The Local Fog Volumes page says Volumetric Fog "does not work on all platforms", while Local Fog Volumes "work across low-end and high-end platforms". So the fallback chain is Volumetric Fog → Local Fog Volumes plus Exponential Height Fog. — [UE docs: Local Fog Volumes](https://dev.epicgames.com/documentation/en-us/unreal-engine/local-fog-volumes-in-unreal-engine)

#### 4. Unity HDRP volumetric fog + Local Volumetric Fog
- **Mechanism (global):**
  - The HDRP Fog override offers Low/Medium/High/Custom quality presets.
  - "Balance" mode exposes a **Volumetric Fog Budget** (0 to 1) and a **Resolution Depth Ratio**, which splits resources between screen x/y and depth z. "Manual" mode exposes Screen Resolution Percentage and Volume Slice Count.
  - Slice Distribution Uniformity of 0 gives exponential slices, with more precision near the camera.
  - Denoising can be None, Reprojection (which ghosts with dynamic lights), Gaussian, or Both ("significantly increases the resource intensity").
  - Height fog is controlled by Base Height and Maximum Height.

  — [HDRP Fog override](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Fog.html)
- **Cost/HW:** The default grid is "240x135x64" at 1080p, and the docs advise keeping the frustum small. "Directional Lights Only" reduces cost. A non-zero light Emission Radius reduces reprojection ghosting. Anisotropy has a moderate cost (experimental). — [HDRP Fog override](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Fog.html)
- **Local Volumetric Fog:**
  - Each volume is an oriented bounding box with constant density, or shaped by a 3D Density Mask (for example a 1024×32 flipbook turned into a 32×32×32 texture). Fog Volume Shader Graph materials are also supported.
  - "HDRP voxelizes Local Volumetric Fog at 64 or 128 slices along the camera's focal axis".
  - The mask texture's size "doesn't affect the amount of memory a local volumetric fog uses".
  - Local fog casts no volumetric shadowing.

  — [HDRP Local Volumetric Fog](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/create-a-local-fog-effect.html)
- **Shipped in:** HDRP is Unity's high-end pipeline. No specific 2023–2026 titles were verified (see Gaps).
- **Scalability ladder:** Quality presets plus the budget slider. The global fog "offers the best performance and quality compared with local fog". — [HDRP Fog override](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Override-Fog.html)

#### 5. Godot 4 volumetric fog + FogVolume (2023)
- **Shipped in:** Godot 4.0 (1 March 2023), where volumetric fog makes "its first appearance in Godot 4". The release credits temporal reprojection for its look and speed, and supports FogVolume nodes with custom fog shaders. — [Godot 4.0 release article](https://godotengine.org/article/godot-4-0-sets-sail/)
- **Mechanism:**
  - The froxel buffer is set by **Volume Size** (base x/y size, scaled by screen aspect ratio) and **Volume Depth** (number of slices). Further settings are Use Filter (a blur before integration), Detail Spread (packs slices closer to the camera) and Temporal Reprojection, which ghosts with fast-moving volumes and lights.
  - FogVolume shapes are ellipsoid, cone, cylinder, box and world.
  - FogMaterial properties: density (negative values subtract fog), albedo, emission, height falloff, edge fade and a density texture. The docs recommend density textures of 64³ or smaller.

  — [Godot docs: Volumetric fog and fog volumes](https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html)
- **Cost/HW:** It is "only supported in the Forward+ renderer, not the Mobile or Compatibility renderers". GI Inject and Ambient Inject each add a small cost. Thin volumes flicker, and high densities show banding. — [Godot docs](https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html)
- **Scalability ladder:** The docs name quads as the cheaper alternative that works in every renderer, at the price of weaker falloff and transparency-sorting problems. Volumetric fog has a finite range, so distant areas need non-volumetric fog too. — [Godot docs](https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html)

#### 6. UE Local Fog Volumes (analytic local fog; low-end friendly)
- **Mechanism:**
  - Each volume is a placeable "spherical area of fog that fades out radially". It combines a radial density with an exponential height density inside the unit sphere (Height Fog Falloff defaults to 1000, Height Fog Offset to 0).
  - Lighting "is evaluated using fast analytical integrals". Shadows and light functions are ignored.
  - Volumes composite after Sky Atmosphere aerial perspective and Exponential Height Fog. They are sorted by the distance from each volume's centre to the camera, and Fog Sort Priority can override the order.
  - When Volumetric Fog is on, the volumes are instead voxelized into it (`r.LocalFogVolume.RenderIntoVolumetricFog`=1) and gain volumetric lighting and shadowing. For shafts in that mode, the docs recommend a Scattering Distribution (phase g) near 0.

  — [UE docs: Local Fog Volumes](https://dev.epicgames.com/documentation/en-us/unreal-engine/local-fog-volumes-in-unreal-engine)
- **Cost/HW:**
  - Volumes are culled per screen tile (`TilePixelSize` 128), so "their cost is similar to dynamic lights" and scales with on-screen size. At most 32 volumes are considered per tile.
  - Cost grows when the camera sits inside several overlapping volumes.
  - Volumes appear from 2000 cm (20 m) from the camera by default (`GlobalStartDistance`).
  - Translucent surfaces are not fogged by default (`ApplyOnTranslucent`=0).

  — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/local-fog-volumes-in-unreal-engine)
- **Scalability ladder:** The volumes "work across low-end and high-end platforms with multiple scalability levels". `r.LocalFogVolume.HalfResolution` renders at half resolution with upsampling, on mobile rendering paths only. — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/local-fog-volumes-in-unreal-engine)
- **Shipped in:** UE5. The UE 5.3 introduction date from the assignment could not be verified; the fetched page is the 5.8 version and does not say when the feature arrived. See Gaps.

#### 7. UE Heterogeneous Volumes + Sparse Volume Textures (VDB-class volumes; high-end only)
- **Mechanism (Heterogeneous Volumes):**
  - The Heterogeneous Volume actor renders volume-domain materials that sample Sparse Volume Textures, either static or animated. It works both in real time (ray marching) and in the Path Tracer.
  - Lighting is stored in a dense internal cache (capped at 1024×1024×512 voxels, with a downsample factor).
  - Shadow resolution defaults to 512.
  - There is a frustum grid (512 depth slices) and an orthographic grid, both with a shading rate of 4 and a bottom-level memory limit of 128 MB.
  - `MaxStepCount` defaults to 512. Indirect lighting is off by default and suggested only for high-end PC / cinematic settings.
  - Niagara Fluids "3D Gas" simulations can render through it.

  — [UE docs: Heterogeneous Volumes](https://dev.epicgames.com/documentation/en-us/unreal-engine/heterogeneous-volumes-in-unreal-engine)
- **Status:** The UE 5.8 docs mark it **Experimental** ("use caution when shipping with it"). Path-tracer mode requires DX12 and hardware ray tracing. — [UE docs: HV](https://dev.epicgames.com/documentation/en-us/unreal-engine/heterogeneous-volumes-in-unreal-engine)
- **Mechanism (Sparse Volume Textures):**
  - A Page Table texture indirects into Physical Tile Data textures. Attributes A and B give up to 8 channels in 8, 16 or 32-bit formats, and one page-table lookup serves both, for 2–3 lookups in total.
  - SVTs can be static or animated like a flipbook.
  - Consumers: Heterogeneous Volumes, Volumetric Fog (applied to meshes) and Volumetric Clouds.
  - OpenVDB import supports Float/Double/Half grids and works only in Windows editor builds.

  — [UE docs: Sparse Volume Textures](https://dev.epicgames.com/documentation/en-us/unreal-engine/sparse-volume-textures-in-unreal-engine)
- **Cost/HW:**
  - Streaming performance "usually starts to suffer for SVT frames larger than 30 - 50 megabytes (MB)" at the default 24 fps.
  - An example of five "Aerial Explosion" instances would need about 25 GB/s without the bandwidth limiter.
  - The page table is capped at 2 GB; maximum virtual resolution is 32k × 32k × 16k.
  - Platforms: "Windows with DX11, DX12 (SM5/SM6)"; "SVTs do not work with the Mobile Renderer".
  - Status: Experimental.

  — [UE docs: SVT](https://dev.epicgames.com/documentation/en-us/unreal-engine/sparse-volume-textures-in-unreal-engine)
- **Workflow:** A March 2025 community guide covers importing a VDB, which creates an SVT asset, then duplicating the engine's SparseVolumeMat material and assigning it to a Heterogeneous Volume actor. — [versluis.com guide (2025)](https://www.versluis.com/2025/03/how-to-use-vdbs-in-unreal-engine/)
- **Scalability ladder:** Coarser mips, smaller pixel formats or lower frame rates for animated SVTs. Stochastic mip filtering roughly halves texture samples. — [UE docs: SVT](https://dev.epicgames.com/documentation/en-us/unreal-engine/sparse-volume-textures-in-unreal-engine)

#### 8. Exponential / analytic height fog
- **Mechanism (UE Exponential Height Fog):**
  - Fog is denser at low altitude with a smooth falloff and no hard cutoff.
  - It uses two colours, for the hemisphere facing the dominant directional light and the opposite one.
  - Options: an optional second fog layer, a directional inscattering lobe, Start Distance, Fog Cutoff Distance, Max Opacity, and an Inscattering Color Cubemap that matches distant fog to the sky.

  — [UE docs: Exponential Height Fog](https://dev.epicgames.com/documentation/en-us/unreal-engine/exponential-height-fog-in-unreal-engine)
- **Cost/HW:** It costs about the same as "two layers of constant density height fog". The Start Distance optimization draws a full-screen quad with depth testing and can bring the cost to "50% or less". — [UE docs: EHF](https://dev.epicgames.com/documentation/en-us/unreal-engine/exponential-height-fog-in-unreal-engine)
  - Volumetric Fog cannot exactly match Exponential Height Fog, which "has non-physical behavior". Volumetric Fog replaces the height fog's inscattering within its View Distance. — [UE docs: EHF](https://dev.epicgames.com/documentation/en-us/unreal-engine/exponential-height-fog-in-unreal-engine); [UE docs: Volumetric Fog](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
- **Analytic formulas (Quílez) [Foundational]:**
  - Basic fog: `fogAmount = 1.0 - exp(-t*b)`.
  - Sun-tinted fog: `pow(max(dot(rd,lig),0),8)` shifts the fog colour toward the sun.
  - Split extinction and inscattering, each with its own per-channel RGB coefficients.
  - Analytic integral for density `a·e^(-b·y)`: `fogAmount = (a/b) * exp(-ro.y*b) * (1.0-exp(-t*rd.y*b))/rd.y`, which adds "no more than one division".

  — [Quílez: Better fog](https://iquilezles.org/articles/fog/)
- **Shipped in:** Every engine. This is the universal lowest tier and also the "far" fog beyond the froxel range (see §5, Godot's finite-range note).
- **Scalability ladder:** This is the bottom of the ladder; it costs almost nothing.

#### 9. God rays: volumetric vs screen-space radial blur vs epipolar sampling
- **Volumetric (froxel or shadow-map raymarch):** Shafts come out of froxel fog automatically once lights shadow the medium. In Wronski's words, god rays come "just for the cost of calculating the shadowing". — [Wronski p. 17](https://advances.realtimerendering.com/s2014/wronski/bwronski_volumetric_fog_siggraph2014.pdf)
  - UE: shadowed point/spot lights cost about 3×. — [UE Volumetric Fog](https://dev.epicgames.com/documentation/en-us/unreal-engine/volumetric-fog-in-unreal-engine)
  - UE: a Scattering Distribution near 0 shows shafts seen from the side, while 0.9 scatters mostly toward the light. — [UE EHF](https://dev.epicgames.com/documentation/en-us/unreal-engine/exponential-height-fog-in-unreal-engine)
- **Screen-space radial blur (Mitchell, GPU Gems 3 ch. 13) [Foundational 2007]:**
  - Mechanism: For each pixel, samples step toward the light's screen-space position, weighted by an exponential decay and scaled by exposure. Occlusion comes from a pre-pass that draws occluders black, or a stencil mask.
  - Parameters: samples, density, weight, decay, exposure.
  - Artifacts: shafts from background objects can appear in front of foreground objects; shafts flicker as occluders cross the screen edge; sample spacing blows up when the light is about 90° away or behind the camera.
  - Cost: downsampling the source reduces bandwidth; no timings are given.

  — [GPU Gems 3, ch. 13](https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process)
- **UE Light Shafts (screen-space):**
  - Occlusion method: a depth mask blurred away from the light, used to mask fog and atmosphere.
  - Bloom method: a radial blur of bright scene colour near the light. It is not physically based but is more controllable.
  - Shafts fade as the view nears 90° from the sun.
  - Cost at 1080p on a GTX 680: occlusion about 0.5 ms; bloom about 0.68 ms per light.

  — [UE docs: Light Shafts](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-light-shafts-in-unreal-engine)
- **Epipolar sampling [Foundational, about 2010–2013]:** Expensive raymarch samples are placed along epipolar lines that start at the light source, and radiance is interpolated between them, with extra samples at depth discontinuities. Optional 1D min/max trees speed up shadow-map marching at high shadow resolution. It is based on Intel's OutdoorLightScattering sample and is available in Diligent Engine's DiligentFX library. — [DiligentFX EpipolarLightScattering README](https://raw.githubusercontent.com/DiligentGraphics/DiligentFX/master/PostProcess/EpipolarLightScattering/README.md) *(The original Engelhardt & Dachsbacher / Yusov papers were not opened.)*
- **Scalability ladder:** volumetric shafts (high) → screen-space radial blur (medium) → baked or card shafts (low). Each source above places these methods at different cost and capability levels; the ladder order is a synthesis.

#### 10. Fake light shafts via cards/meshes
- **Mechanism / examples:**
  - *Doom 3* "volumetric glow" [Foundational 2004]: a generated, vertex-coloured mesh around light polygons. It is drawn only when the viewer is in front of the light and fades by view angle "by turning down the vertex colors". Because it rotates toward the camera it shows artifacts; hand-placed planes would avoid them. — [Simon Schreibeis: Doom 3 Volumetric Glow](https://simonschreibt.de/gat/doom-3-volumetric-glow/)
  - Other card/mesh volume tricks catalogued: *World of Warcraft*'s "faked lit translucent volume by using fresnel" and *Homeworld 2*'s multi-layer meshes for a volumetric feel. — [Game Art Tricks index](https://simonschreibt.de/game-art-tricks/)
  - Godot names quads as the all-renderer, cheaper alternative to volumetric fog, with weaker falloff and possible sorting issues. — [Godot docs](https://docs.godotengine.org/en/stable/tutorials/3d/volumetric_fog.html)
- **Shipped in (2023–2026):** No documented recent examples were found (see Gaps).
- **Cost/HW:** One transparent draw per card or mesh. The main cost is overdraw. *(No measured figures were found.)*
- **Web impl.:** The Game Art Tricks article links a WebGL port of the Doom 3 glow (by michaeldll) and a Unity port, "DoomGlowUnity". The Unity port targets mobile VR, where image effects are impractical, and adds distance fade. — [Simon Schreibeis: Doom 3 Volumetric Glow](https://simonschreibt.de/gat/doom-3-volumetric-glow/)

#### 11. Web (WebGL/WebGPU) implementations found
- **three.js `webgpu_volume_lighting` example (TSL):**
  - A `VolumeNodeMaterial` on a 20×10×20 box, raymarched in `steps = 12`.
  - Density comes from a 128³ Perlin `Data3DTexture`, sampled three times at different scales and speeds.
  - `bayer16(screenCoordinate)` dither offsets reduce banding, and scene depth occludes the fog.
  - A shadowed point light and spot light light the volume.
  - The volume pass runs at `setResolutionScale(.25)` with a `gaussianBlur` denoise and is composited additively.

  — [three.js example source](https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/webgpu_volume_lighting.html)
- **three-good-godrays:** Screen-space raymarching that samples the shadow map, for `PointLight` or `DirectionalLight` with shadows enabled. Built on pmndrs `postprocessing`, tested with three.js 0.125–0.182, `raymarchSteps` default 60, blur on by default. It notes that `PCFSoftShadowMap` behaves like `PCFShadowMap` in r183+. — [GitHub: Ameobea/three-good-godrays](https://github.com/Ameobea/three-good-godrays)
- **pmndrs postprocessing GodRaysEffect:** Uses a light-source mesh, with defaults samples 60, density 0.96, decay 0.9, weight 0.4, exposure 0.6, resolutionScale 0.5, plus a Kawase blur. — [pmndrs docs](https://pmndrs.github.io/postprocessing/public/docs/class/src/effects/GodRaysEffect.js~GodRaysEffect.html) *(The docs do not name the algorithm; the parameter set matches GPU Gems 3 ch. 13.)*
- **Babylon.js:**
  - `VolumetricLightScatteringPostProcess` uses a mesh as the light source, with `ratio`/`passRatio` resolution controls and `samplesNum` defaulting to 100.
  - The newer **`FrameGraphVolumetricLightingTask` (Babylon 9.0+)** requires frame graphs. On **WebGPU a compute shader updates the lighting volume**, while on WebGL the volume is updated on the CPU from a read-back shadow map. It is based on "Participating media using extruded light volumes" (GPU Zen 1).

  — [Babylon docs: Volumetric Light Scattering](https://doc.babylonjs.com/features/featuresDeepDive/lights/volumetricLightScattering)

#### 12. Research-trend signal (2023–2025 SIGGRAPH Advances)
- No talk in SIGGRAPH Advances 2024 addressed fog or volumetrics. — [Advances 2024](https://advances.realtimerendering.com/s2024/index.html)
- In 2025, Epic's "MegaLights: Stochastic Direct Lighting in Unreal Engine 5" lists "translucency, volumetric effects" among its topics. — [Advances 2025](https://advances.realtimerendering.com/s2025/index.html)
- 2025 also had Activision's "Adaptive Voxel-Based Order-Independent Transparency" (*Call of Duty*), which is relevant to the VFX/OIT section. — [Advances 2025](https://advances.realtimerendering.com/s2025/index.html)
- 2023's in-scope talk was Nubis³ (clouds), covered by the clouds section. — [Advances 2023](https://advances.realtimerendering.com/s2023/index.html)

#### 13. Shipped isometric-ARPG reference: Diablo IV (2023) volumetric "lit air"
- **Mechanism (as Blizzard describes it):** Diablo IV's volumetric rendering models dust and particles in the air: "we modeled the air, so that particles in the air are lit", with light both scattered and absorbed.
  - "Even the stained-glass windows emit light into the air itself."
  - Blizzard calls the older approach to airborne dust (particle systems and flat textured cards) "primitive".
  - The team describes the volumetrics as an unplanned but important part of reaching the game's "invitingly dark" tone.
  - — [Blizzard, "Peeling Back the Varnish: The Graphics of Diablo IV"](https://news.blizzard.com/en-us/article/23964183/)
- **Rendering context:**
  - Deferred renderer.
  - A custom shadow system caches shadows for static geometry (floors, walls) and overlays dynamic objects such as the character.
  - Shadow work for many lights is scheduled across frames, because dungeons are randomly generated.
  - — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)
- **Shipped in:**
  - Diablo IV (5 June 2023). — [Wikipedia: Diablo IV](https://en.wikipedia.org/wiki/Diablo_IV)
  - Platforms are PC and "two generations of consoles". Xbox targets run from 30 fps at 1080p on Xbox One / One S to 60 fps at 4K on Series X. — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)
- **Cost/HW:** The article does not say whether the volume is froxel-based, and gives no grid sizes, ms costs or volumetric-specific settings. PC offers Low/Medium/High/Ultra presets plus a Resolution Percentage slider and DLSS 3. — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)
- **Web impl.:** N/A.

### Inferences
- **Genre precedent (Diablo IV):** Diablo IV shows that lit volumetric air, including stained-glass light spilling into the air, is a shipped, signature part of the current isometric-ARPG look. It is the closest precedent for this project's high (WebGPU) tier. The article does not say whether volumetrics are reduced on Xbox One-class targets, so the low-end ladder still has to come from the engine docs above.
- **Froxel fog with an isometric camera:** In a top-down ARPG the frustum's depth range over the play area is short, roughly 10–40 m from the camera's near plane to the ground at the far screen edge. A small grid fits well, e.g. 160×90 with 32–64 slices. The slices should be distributed over that playfield depth band, not packed near the camera as Wronski and HDRP do for first-person views.
  - With an orthographic projection the froxel grid becomes a box grid with uniform slices, which is simpler still.
  - The main cost driver will be the many point lights from spells, torches and braziers. Clustered light culling into froxels matters, and only the moon/sun (plus perhaps one hero light) should cast volumetric shadows; UE's 3× cost for shadowed point lights supports this.
- **Temporal reprojection vs heavy spell VFX:** UE warns that fast-changing lights such as muzzle flashes leave trails. An ARPG with dozens of short-lived spell lights should exclude transient spell lights from fog injection (as with UE's scattering intensity = 0), or inject them without history, and keep only steady lights (torches, braziers, moon) in the reprojected volume.
- **three.js feasibility of froxel fog:**
  - *WebGPU/TSL:* A Wronski-style pipeline (inject+light → front-to-back integrate → apply) maps directly onto compute shaders writing to 3D storage textures. Memory is modest: 160×90×64 = 921,600 cells × 8 B (RGBA16F) ≈ 7.4 MB per volume, or about 22 MB including the integrated volume and history.
  - *WebGL2:* There is no compute, but the passes can be emulated with fragment shaders writing one slice per draw (render to a 3D-texture layer, or use a 2D atlas). This is slower and fiddlier.
  - *Simpler alternative for both backends:* the three.js example's approach (raymarch a bounded volume at ¼ resolution with 8–16 dithered steps plus a blur), or three-good-godrays-style shadow-map raymarching.
- **Local fog volumes are the best fit for ARPG level dressing:** graveyard mist pockets, swamp ground fog, crypt dust, ritual circles. UE's analytic sphere-plus-height model with tile culling and no shadows is cheap and portable to WebGL2: draw a proxy sphere or box per volume, read scene depth, and evaluate the closed-form integral. HDRP/Godot-style voxelization into the froxel grid makes sense only on a WebGPU tier.
- **Height fog:** The top-down camera looks steeply down, so height fog reads as ground-hugging mist in pits, rivers and valleys rather than as distant haze. Quílez's analytic formula is essentially free and should be the always-on base layer, with sun or moon tinting for mood. three.js's built-in `Fog`/`FogExp2` are distance-only, so a custom height-fog chunk or node is needed (not deep-dived).
- **Heterogeneous Volumes / SVT:** Not relevant to the web target. They are Experimental, need Windows DX11/12, do not run on mobile, and stream tens of MB per frame. The ARPG equivalent is small pre-baked 3D noise textures (Godot recommends 64³ or smaller) or flipbook smoke.
- **God rays with a top-down camera:**
  - Screen-space radial blur (GPU Gems 3, UE Light Shafts, pmndrs GodRaysEffect) needs the light on or near the screen, and the effect fades toward 90° from the light. In an isometric view the sun or moon is essentially never on screen, so it is nearly useless for sky lights. It might still suit on-screen local emitters such as a portal or a glowing altar.
  - Volumetric shafts from shadow-map raymarching work regardless of where the light is. They are the right choice for moonlight through windows, canopies or broken roofs, visible on the ground from above.
  - Epipolar sampling also assumes the light source is in screen space, so it is of little value here.
- **Card/mesh shafts are especially attractive for an isometric camera:** With a fixed camera angle, Doom 3's view-dependent artifacts largely disappear. Artists can author shafts for a known view, add depth fade at ground intersections (the soft-particle technique) and fade them near the player. They work on WebGL2 and cost only overdraw. This is likely the best value per millisecond for a gothic look, e.g. stained-glass beams and crypt light slits.
- **Budget anchor:** About 1 ms on PS4 for UE's froxel fog at High, and about 1.1 ms for AC4's on next-gen consoles. That suggests a reduced froxel grid is affordable on mid-range desktop WebGPU. Integrated GPUs and WebGL2 should drop to analytic height fog, local fog spheres and cards.
- **Suggested scalability ladder for the web ARPG** (synthesis):
  - **Ultra (WebGPU):** froxel grid with temporal reprojection, clustered light injection, and volumetric shadow for the key light.
  - **High (WebGPU):** fewer slices, no point-light shadowing, spell lights excluded.
  - **Medium (WebGL2):** a ¼-resolution shadow-map raymarch for key-light shafts only, plus analytic height fog and local fog spheres.
  - **Low:** analytic height fog plus card shafts.
- **Trend:** Froxel fog is now a commodity: it ships by default in UE, HDRP and Godot, and Advances 2024 had no fog talk. Current work is on authorable local volumes, VDB-grade volumes for cinematics, and integrating volumetrics with many-light stochastic lighting (MegaLights 2025). For a web ARPG, "SOTA" means the 2014–2015 froxel design on WebGPU plus 2023-style analytic local volumes.

### Gaps
- **Web search ran out partway through the task** (the limit is shared across agents). I could not verify specific 2023–2026 shipped titles using froxel fog, such as *Silent Hill 2* remake (2024), *Alan Wake 2* (2023) or *Black Myth: Wukong* (2024), nor the fog/volumetric settings of *Path of Exile 2*. PCGamingWiki pages for D4 and PoE2 returned HTTP 403.
- **Diablo IV:** the Blizzard deep-dive confirms volumetric "lit air" (§13), but not the algorithm (froxel or otherwise), its resolution or its per-platform settings.
- **When each UE feature arrived was not verified.** Volumetric Fog is commonly cited as UE 4.16 (2017), Local Fog Volumes as 5.3, Sparse Volume Textures as 5.3, and Heterogeneous Volumes as 5.2/5.3. The UE 5.3 release-notes page did not render in fetch, and the feature pages fetched are the 5.8 versions, which do not state when each feature was introduced.
- **Frostbite 2015 timings:** none on the course page, and the 158 MB slide deck was not reviewed.
- **Wronski 1.1 ms:** the text extraction did not capture the target console.
- **Epipolar sampling:** the original papers (Engelhardt & Dachsbacher 2010; Yusov / Intel 2013) were not opened; the mechanism is cited from the DiligentFX README.
- **Unity URP:** whether Unity 6.x URP ships built-in froxel volumetric fog was not verified.
- **Low-end platforms:** no specific Switch 2 or mobile fog implementations were found beyond UE's Local Fog Volume half-resolution mobile path and Godot's Mobile renderer lacking volumetric fog.
- **Card/mesh shafts:** no documented 2023–2026 shipped examples or artist breakdowns were found; the searches that would have found them could not run.
- **Heterogeneous Volumes / SVT:** no millisecond cost figures were found; the docs give only memory and streaming limits.

## VFX & particles, Part I: particle systems, flipbooks, particle lighting, ribbons, mesh particles, budgets and overdraw

### Takeaway
GPU-simulated, data-driven particle systems (UE Niagara, Unity VFX Graph) are the AAA baseline. The 2024–2026 work has gone into cutting per-system overhead rather than raising particle counts: UE 5.4 stateless "lightweight emitters", Niagara Data Channels that merge many impact bursts into one shared simulation, Effect-Type scalability and pooling. In parallel, studios fake volume on flat sprites (motion-vector flipbook blending, six-way baked lightmaps, soft particles, low-res lighting atlases). The genre reference, Diablo IV (2023), builds mists, fire and poison pools from procedurally combined tiling noise instead of frame-by-frame textures. For an isometric ARPG with many simultaneous spells the bottleneck is fill-rate/overdraw and per-effect overhead, not raw particle count, so batching/shared simulations, texture-driven fake lighting and strict overdraw control matter most.

### Cited Findings

#### GPU particle systems — Unreal Engine Niagara (CPU/GPU sim, Lightweight Emitters, Data Channels)
- **Mechanism:** Niagara systems are built from emitters that simulate either on the CPU or on the GPU. Epic's guidance: "in most cases GPU sims are more performant, and allow for a greater number of particles", but "for emitters with a small number of particles a CPU sim may be better suited" because "a simulation of 1 particle can potentially take up the same resources as one with 64 particles" (GPU thread-group granularity) — [UE docs: Scalability and Best Practices for Niagara](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara)
- **Lightweight (stateless) emitters, UE 5.4:** "Unreal Engine 5.4 introduces Niagara lightweight emitters… also called stateless emitters… optimized to minimize (and in some cases eliminate) the use of tick during the simulation". There are "no scripts or particle information in memory", no compilation step, lower Game-Thread/Render-Thread cost and lower memory use, and "a pure stateless system will be the most performant". Trade-off: a fixed-function set of about 18 modules (Initialize Particle, Shape Location, Gravity/Acceleration/Drag, Scale Color, Scale Sprite/Mesh Size, Sub UV Animation…). No custom modules, scratch pads or dynamic inputs; extensible only via C++; stateless and stateful emitters can be mixed in one system — [UE docs: Niagara Lightweight Emitters Overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-lightweight-emitters-overview)
  - Tooling caveat: a forum thread reports lightweight-emitter GPU cost was not tracked in the Niagara Debugger in UE 5.6.1. Epic staff later said support was added as a combined `NiagaraStateless` stat with no per-emitter breakdown — [Unreal forums](https://forums.unrealengine.com/t/niagara-debugger-lightweight-stateless-emitters/2733793)
  - Note: the doc page header reads "Unreal Engine 5.8 Documentation" (current docs version as of this research), while the body still says the feature was introduced in 5.4 — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-lightweight-emitters-overview)
- **Niagara Data Channels (NDC):** "Niagara Data Channels (NDCs) facilitate communication between game code and Niagara Systems". The headline use case is impact effects: rather than rapidly spawning many copies of the same burst system, game code writes into a channel and one shared simulation processes "all burst particles assigned to the data channel", giving "significant performance gains" (no benchmark numbers given). The "islands" channel type exposes the initial/max island extents and the island pool size. The introduction version is not stated; the page links a 5.4 update tutorial — [UE docs: Niagara Data Channels Overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-data-channels-overview); see also [Data Channels in Niagara](https://dev.epicgames.com/documentation/unreal-engine/data-channels-in-niagara-for-unreal-engine)
  - The best-practices page likewise recommends "systems-as-a-service" (adding particles to an existing system instead of spawning new systems) for "short bursts of effects like projectiles and impacts", noting that 5.4 adds features for it — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara)
- **Shipped in:** Niagara is UE5's built-in VFX system (documented through UE 5.8) — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara). Specific 2023–2026 game credits were not verified in this pass (see Gaps).
- **Cost/HW:** Per-instance game-thread cost: "the more instances there are of the system, the more work needs to be done on the game thread". Simulating the same particle count across more instances is less efficient, but smaller instances cull more granularly. Fixed bounds are "more performant than dynamic bounds". Warmup and single-frame large bursts cause hitches, so spread spawns over frames. Disabling "Require Current Frame Data" lets ticks start earlier in the frame — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara)
- **Scalability ladder:** Effect Type assets carry reusable scalability settings "based on scalability levels e.g. Medium, High and Epic and per-platform". They cull system instances, reduce spawn counts, disable expensive renderers, or disable emitters/systems entirely. GPU-bound platforms (the page cites mobile, with less GPU memory) "may benefit from CPU sims" — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara)
- **Web impl.:** three.js ships a WebGPU "compute particles" example labelled "500k Particles" — [threejs.org example](https://threejs.org/examples/webgpu_compute_particles.html). three.quarks is an MIT TypeScript particle/VFX library for three.js with batched rendering ("minimizes draw calls"), trails, mesh particles and a visual editor (quarks.art/create, JSON export). WebGPU rendering is on its roadmap, and an experimental `quarks.nodes` package offers "WebGPU compute support" — [GitHub three.quarks](https://github.com/Alchemist0823/three.quarks)

#### GPU particle systems — Unity VFX Graph (compute-based)
- **Mechanism:** VFX Graph simulates particles in compute shaders. The minimum requirements are compute-shader support (`SystemInfo.supportsComputeShaders`) and SSBO support in the vertex stage — [Unity VFX Graph 17 manual: System Requirements](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/System-Requirements.html)
- **Shipped in / platform status:** HDRP has been supported since Unity 2018.3 and verified since 2019.3. URP is supported in package 12.x–16.x, but early URP (2019.3–2021.1) "only supports unlit particles". VFX Graph "isn't out of preview for mobile platforms", "does not support Open GL ES", and doesn't support gamma colour space in URP. Package 17.x is the Unity 6 version — [Unity manual](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/System-Requirements.html)
- **Unity 6 (VFX Graph 17) changes:** URP camera-buffer sampling ("sample URP camera buffers to obtain the scene's depth and color"), which enables GPU collision/spawning against the depth buffer. Also: a new Debug panel with GPU/CPU timings, GPU memory and texture usage; Shader Graph keyword support in VFX outputs (incl. a Forward Decal output); merged Collider blocks with new collision attributes; trigger-on-collide; Flipbook Player improvements (cycle mode, start-frame offset, animation range, auto sizing) — [Unity: What's new in VFX Graph 17](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/whats-new-17.html)
- **Cost/HW (output-level optimisations):** "Indirect Draw" renders only alive particles (use it when below capacity or for many-vertex meshes). "Compute Culling" culls dead particles in a compute pass instead of the vertex shader. "Frustum Culling" culls off-screen particles in compute, but "can cause issues with shadow casting". Transparent outputs that generate motion vectors or cast shadows need an alpha-threshold port because those passes cannot blend — [Unity: Output shared settings](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html)
- **Scalability ladder:** On platforms without compute (GLES, which includes WebGL-class targets), VFX Graph is unavailable and Unity falls back to its CPU Shuriken particle system — [Unity manual](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/System-Requirements.html) (the Shuriken-fallback part is a general Unity fact not stated on this page; see Inferences).
- **Web impl.:** none specific to VFX Graph (see three.js/three.quarks above).

#### CPU vs GPU particles (collisions, events, gameplay coupling)
- **Mechanism / evidence:** GPU sims scale to large counts but work in coarse thread groups; CPU sims suit low counts — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara). GPU particles typically collide against screen-space buffers. DOOM (2016) updates particle position/velocity/lifetime in a compute shader that reads "the normal and depth buffer (for collision detection)" — [Adrian Courrèges, DOOM (2016) Graphics Study](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study) [Foundational 2016]. Unity 6 VFX Graph added depth-buffer collision/spawning in URP via camera buffers — [Unity](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/whats-new-17.html)
- **Gameplay coupling:** Niagara recommends the attribute-reader data interface "over events where possible", and Data Channels as the channel for game code ↔ Niagara communication — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara); [NDC overview](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-data-channels-overview)

#### Flipbooks (sub-UV) with motion-vector frame blending
- **Mechanism:** A flipbook atlas is played by advancing a frame index. Plain linear frame blending ghosts, so a per-frame motion-vector (flow) texture warps the UVs of the current and next frames toward each other by the sub-frame blend factor before cross-fading. A Naughty Dog–style UE4 node "computes gradients, scales them by a flow factor, offsets the previous and current UVs, and lerps the samples by the subframe blend". Sources of vectors include optical-flow tools (Twixtor Pro, NukeX `oflow`, Facedown FX Slate), Houdini velocity passes (raw sim velocity works for internal detail but is less reliable as the main blend; "closest hit" sampling avoids diluting vectors), or runtime luminance-gradient flow based on Matthew Radford's SIGGRAPH 2015 talk "Chasing Film in 5ms" (ported to UE4; it "trade[s] texture memory for instruction count") — [Real-Time VFX forum thread (2016)](https://realtimevfx.com/t/motion-vectors-for-animated-textures-how-do-you-generate-them/575)
- **Tuning:** Flow strength is tied to the maximum frame-to-frame displacement and is "incredibly hard to figure out". Too little gives stepping/ghosting, too much gives pulsing or frames visibly sliding past each other — [RTVFX 2016 thread](https://realtimevfx.com/t/motion-vectors-for-animated-textures-how-do-you-generate-them/575); [RTVFX "Increasing flipbook based effects duration"](https://realtimevfx.com/t/increasing-flipbook-based-effects-duration/27592) (as summarised in search results)
- **Savings:** One artist reports a 72-frame flipbook (reduced from about 200 frames) lasting 300+ seconds by simulating with a high frame stride and blending with motion vectors. The technique pays off on long sequences rather than particles living 1–2 s. A commercial baker (TFlow) says the vector texture usually needs only half the flipbook resolution — [RTVFX thread](https://realtimevfx.com/t/increasing-flipbook-based-effects-duration/27592) (search-result summary; not separately fetched)
- **Shipped in / engine support:** Unity VFX Graph outputs offer UV modes `Flipbook` (no interpolation), `FlipbookBlend` ("uses linear interpolation to blend between frames") and `FlipbookMotionBlend` ("uses an additional motion vector texture", with Motion Vector Map and Motion Vector Scale inputs) — [Unity: Output shared settings](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html). Unity URP's Particles shader offers "Flip-Book Blending" to smooth few-frame textures, noting it "might reduce performance" — [Unity 6 manual: URP Particles Unlit shader](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/particles-unlit-shader.html)
- **Authoring tools:** JangaFX EmberGen (real-time GPU fire/smoke/explosion simulator) exports image sequences/flipbooks (EXR/PNG/TGA), OpenVDB, "motion vectors, six-point lighting, normal maps, and depth maps", and claims use by "over 200 leading game studios" (testimonials from Twisted Pixel Games, Sharkmob, Alchemy VFX) — [JangaFX EmberGen](https://jangafx.com/software/embergen/)
- **Cost/HW:** Requires an extra RG motion-vector texture (half-res is usually enough per the TFlow claim) and extra texture fetches per pixel — [RTVFX thread](https://realtimevfx.com/t/increasing-flipbook-based-effects-duration/27592); the fetch count is my reading of the shader described in the [2016 thread](https://realtimevfx.com/t/motion-vectors-for-animated-textures-how-do-you-generate-them/575)
- **Scalability ladder:** MV blend → linear FlipbookBlend → plain Flipbook (no interpolation), as exposed by Unity's UV modes — [Unity](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html)
- **Web impl.:** three.quarks supports texture animation/atlases (no motion-vector blending mentioned) — [GitHub](https://github.com/Alchemist0823/three.quarks)

#### Six-way lighting for smoke/dust flipbooks (a.k.a. 6-point lighting, 6D lightmaps)
- **Mechanism:** Offline, the smoke is rendered six times under a white directional light from top, bottom, left, right, front and back. The six greyscale responses are packed into two RGBA textures (A = Right/Top/Back + alpha, B = Left/Bottom/Front + spare channel, e.g. emissive mask). At runtime the shader blends the six maps according to the incoming light direction(s), so a flat sprite reacts plausibly to sun, sky and moving point/spot lights — [Unity blog, Jan 2023](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph); [Unity VFX Graph 17 manual: Six-way lighting](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/six-way-lighting.html)
- **Shipped in:** Unity introduced a "Six-Way Smoke Lit" output in the 2022.2 Tech Stream (HDRP only at the time; URP listed as future work) — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph); [Unity forum announcement](https://discussions.unity.com/t/vfx-graph-introducing-six-way-lighting-for-smoke-dust-and-clouds-vfx/906564). The VFX Graph 17 (Unity 6) manual lists it "in both URP and HDRP", lit by Light Probes, Adaptive Probe Volumes, ambient probes, LPPVs and "dynamic point, spot, area, and directional lights" — [Unity manual](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/six-way-lighting.html). Unity says the technique is "used in multiple AAA games" but names none; the overview it links has a URL referencing Skull and Bones (unconfirmed attribution) — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph)
- **Cost/HW:** "Smoke effects are actually quite cost-effective to render, comparable to a traditional lit sprite". Fully volumetric lighting "is too expensive for a real-time budget" — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph). Memory is two RGBA flipbooks instead of one.
- **Limitations:** "It is still a texture sheet and not a 3D volumetric effect". Probe lighting is evaluated in the vertex shader, so a quad gets probe data only at its four corners (artifacts near walls with spatially varying probes like APV; tessellate the quad). Smoke is purely diffuse: "does not support specular contributions from reflection probes". Lightmaps ignore occlusion by neighbouring particles — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph); [Unity manual](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/six-way-lighting.html)
- **Authoring:** Unity's VFXToolbox offers a Houdini HDA (fast OpenGL-ROP variant and Karma variant), a Blender add-on (`unity_6way.py`) and an Image Sequencer for repacking. EmberGen has a "Six point" render-node option, which Unity says is "not officially supported" — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph); EmberGen confirms "six-point lighting" export — [JangaFX](https://jangafx.com/software/embergen/)
- **Scalability ladder:** Suggested uses are background/ornamental effects (steam) and explosions, plus "more particles or volumetric effects" for hero depth — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph). Cheaper tiers: single-light evaluation or unlit/emissive flipbook (inference).
- **Web impl.:** none found in this pass.

#### Soft (depth-faded) particles and camera fading [Foundational 2007]
- **Origin:** NVIDIA whitepaper "Soft Particles", Tristan Lorach, January 2007 (DirectX 10 SDK) — [NVIDIA PDF](https://developer.download.nvidia.com/whitepapers/2007/SDK10/SoftParticles_hi.pdf) (title/author/date verified; body text not machine-readable)
- **Mechanism:** The particle shader reads scene depth and fades alpha as the particle approaches opaque geometry, between a "Near" distance (fully faded) and a "Far" distance (fully opaque) in world units. "Camera Fading" similarly fades particles approaching the camera — [Unity 6 manual: URP Particles Unlit shader](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/particles-unlit-shader.html). VFX Graph equivalent: "Use Soft Particle" ("remove hard intersections between particles and geometry") plus a world-space fade distance — [Unity](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html)
- **Shipped in:** standard in all major engines; Unity URP/VFX Graph as above.
- **Cost/HW:** Requires a readable scene depth texture. In URP, Soft Particles, Camera Fading and Distortion all require the Depth Texture to be enabled in the URP Asset (a depth copy/prepass in a forward renderer) — [Unity manual](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/particles-unlit-shader.html)
- **Scalability ladder:** Disable soft fade on low tiers if the depth copy is the only reason it exists, and accept hard intersections — this is my inference (see below); Unity only documents the dependency.
- **Web impl.:** not verified in this pass (three.js exposes `DepthTexture`; see Inferences).

#### Lit / normal-mapped particles (incl. DOOM 2016 particle lighting atlas)
- **DOOM (2016) particle lighting atlas [Foundational 2016]:** Each particle sprite is lit "as if it were in world space", using the clustered light list and shadow maps. The result is written into a tile of a 4k atlas with "dedicated regions for sprites of the same resolution". Tile size varies with camera distance and quality settings, so "particle lighting is always computed and stored in these tiny fixed-size tiles" regardless of output resolution. The final draw multiplies the full-resolution particle texture by the upscaled lighting tile — [Courrèges, DOOM (2016) Graphics Study](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study). Primary source: Sousa & Geffroy, "The Devil is in the Details: idTech 666", SIGGRAPH 2016 Advances — [slides PDF](https://www.advances.realtimerendering.com/s2016/Siggraph2016_idTech6.pdf) (too large to fetch here; details via Courrèges)
- **Unity lit particles:** the six-way output takes probe lighting (per-vertex) plus dynamic point/spot/area/directional lights — [Unity manual](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/six-way-lighting.html); [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph). URP Particles Lit/Unlit shaders implement features (normal map, emission, etc.) as shader variants that "affect batching performance" — [Unity manual](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/particles-unlit-shader.html). Trail geometry can be built with normals/tangents ("Generate Lighting Data") for lit materials — [Unity Trail Renderer](https://docs.unity3d.com/Manual/class-TrailRenderer.html)
- **Cost/HW:** The DOOM approach decouples lighting cost from overdraw and screen resolution (lighting is done once per particle tile, not per overlapping pixel) — [Courrèges](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study). Per-vertex probe lighting is cheapest but coarse (artifacts on large quads) — [Unity blog](https://unity.com/blog/engine-platform/realistic-smoke-with-6-way-lighting-in-vfx-graph)
- **Scalability ladder:** per-pixel lighting (normal-mapped) → lighting atlas (DOOM) → per-vertex lighting / probes → unlit + emissive. The ordering is inferred from the costs above.
- **Web impl.:** none found in this pass.

#### Ribbons / trails / beams
- **Mechanism (Unity Trail Renderer):** Points are emitted along the object's path. Each point lives for "Time" seconds, with spacing set by "Min Vertex Distance". Texture modes are Stretch, Tile, DistributePerSegment and RepeatPerSegment. Alignment is View (camera-facing) or TransformZ. A width curve and colour gradient are "sampled at each vertex", so fidelity scales with vertex count. Corner/end-cap vertices round the shape, and "Generate Lighting Data" adds normals/tangents — [Unity manual: Trail Renderer](https://docs.unity3d.com/Manual/class-TrailRenderer.html)
- **Niagara ribbon renderer:** exists as a Niagara renderer type, but its reference page returned only a table of contents when fetched, so details are unverified (see Gaps).
- **Web impl.:** three.quarks has "ribbon trails that follow particles" — [GitHub](https://github.com/Alchemist0823/three.quarks)

#### Mesh particles (debris, shockwaves, slash meshes)
- **Mechanism / engine support:** Particle systems can instance arbitrary meshes per particle. Niagara's stateless module set includes "Scale Mesh Size" (mesh output) — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-lightweight-emitters-overview). Epic's mesh hygiene for particle meshes: remove collisions, disable cast shadow where unneeded, set Distance Field Resolution Scale to 0.0, avoid extra UV channels — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara). In VFX Graph, enable Indirect Draw/Compute Culling when "meshes have many vertices per particle" — [Unity](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html)
- **Web impl.:** three.quarks supports "3D geometry used as particles" — [GitHub](https://github.com/Alchemist0823/three.quarks)
- Stylized slash meshes with panning/erosion textures: common practice, but no primary source was verified in this pass (see Gaps).

#### Procedural, noise-composited VFX materials (tiling/scrolling noise instead of frame-by-frame flipbooks)
- **Mechanism:** The shader combines several tiling noise textures, distorted by 2D directional-data textures, to build endlessly varying drifting mists, "fiery infernos" and poisonous pools. This replaces frame-by-frame textures. — [Blizzard, "Peeling Back the Varnish: The Graphics of Diablo IV"](https://news.blizzard.com/en-us/article/23964183/)
- **Shipped in:** Diablo IV (2023), for ground hazards and atmospheric effects.
  - Blizzard calls the older approach of particle systems plus flat textured cards for such effects "primitive".
  - Other shader-driven effects in the same article: dissolving environment shaders; blood globules and limbs animated in shaders; character shaders that show burning, poison and stealth states.
  - — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)
- **Cost/HW, scalability ladder:** Not given in the article (see Inferences).
- **Web impl.:** None verified (see Inferences).

#### Particle budgets, scalability and pooling
- **Niagara:** Effect Types (per quality level and per platform) cull instances, reduce spawn counts, or disable renderers/emitters. Pooling keeps "allocated components that are no longer in use" to avoid allocation/GC. Pool priming "can reduce runtime allocations, but can cause hitches if the asset is loaded dynamically". Avoid warmup, spread big bursts across frames, move shared work into system/emitter scripts, avoid duplicate data interfaces — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara). Data Channels and lightweight emitters (above) are the 5.4+ tools for many short-lived impacts — [NDC](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-data-channels-overview); [Lightweight emitters](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-lightweight-emitters-overview)
- **Unity VFX Graph:** system capacity plus Indirect Draw / compute culling / frustum culling, and a Unity 6 Debug panel showing per-graph GPU/CPU timing and GPU memory — [Unity output settings](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html); [Unity what's new 17](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/whats-new-17.html)

#### Overdraw control (particle trimming / cutout geometry) and sorting
- **Particle trimming [Foundational 2009]:** Emil Persson's (Humus) "Particle trimmer" (May 21, 2009) is a command-line tool that "generates an optimized polygon that fully encloses the particle in as tight area as possible", using a user alpha threshold and a vertex limit, with atlas support. He says it "can save a considerable amount of fillrate on particle systems" (no numbers) — [humus.name](http://www.humus.name/index.php?page=Cool&ID=8). UE's later "particle cutout" (SubUV bounding-geometry) feature is based on this idea, but the UE 4.11 release post returned HTTP 403, so this is unverified (see Gaps).
- **Sorting cost (Niagara):** "Sorting is disabled by default, but when enabled sort tasks default to running on the GPU". Sorting adds GPU overhead and index-buffer memory and "can result in poor draw performance". CVars (`Niagara.GPUSorting.CPUToGPUThreshold`, `Niagara.GPUCulling.CPUToGPUThreshold`) control when CPU emitters sort/cull on the GPU — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-best-practices-for-niagara)
- **Sorting rules (VFX Graph):** Sorting is automatically on for the non-commutative Alpha and Premultiplied blend modes. Turning it off there causes flicker because order isn't deterministic, while Additive needs no sort. Criteria: Distance To Camera, Youngest in Front, Camera Depth, Custom sort key — [Unity](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Context-OutputSharedSettings.html)

### Inferences
- **Isometric relevance — soft particles (very high):** with a top-down camera nearly every ground-level effect (AoE rings, dust, ground fog cards, blood mist, fire on the floor) intersects the ground plane. Depth-faded particles are therefore mandatory, not optional. Camera fading matters little (the camera is far away) except for tall pillars or bursts near the camera. In three.js this needs a depth texture (depth prepass or `DepthTexture` on the render target) on both WebGL2 and WebGPU.
- **Isometric relevance — flipbooks + motion vectors (medium):** valuable for long-lived ambient loops (braziers, smoke columns, chimney smoke, swamp mist, burning debris) where frame count and VRAM matter. Less valuable for 0.3–1 s spell bursts, consistent with the RTVFX note that it pays off on long sequences. It is a pure fragment-shader technique (3 texture fetches + lerp), so it is fully feasible in WebGL2.
- **Isometric relevance — six-way lighting (high for a dark gothic look):** dungeons lit by torches and spell lights make lit smoke/dust read as volumetric at sprite cost. Evaluate one directional "key" light plus 1–4 nearest point lights per vertex (or per pixel for hero effects); feasible in WebGL2 with a small uniform light list. Bake with EmberGen "six point" or Unity's free Houdini/Blender tools.
- **Lighting atlas (DOOM-style):** attractive for heavy overdraw because lighting cost becomes per-particle rather than per-pixel. It needs a compute-or-render pass writing tiles, so it is realistic on WebGPU (compute) and possible but awkward on WebGL2 (render-to-atlas with instanced quads). For an ARPG, most spell VFX are emissive/additive and need no lighting, so reserve lit particles for smoke/dust/debris.
- **Lightweight/stateless emitters → web analogue:** UE's docs say stateless emitters keep no scripts or particle data in memory. The closest web analogue is a vertex-shader-only particle where position, colour and size are closed-form functions of (spawn time, seed, now). Such particles need no per-frame CPU or compute update and suit hundreds of short impact bursts, and they work on WebGL2 via one instanced draw per material. This is my analogy; UE's doc does not say particles are evaluated analytically.
- **Data-Channel-style batching → web analogue:** instead of one particle system object per fireball hit, keep one pooled emitter per effect type and append spawn requests to a shared instance buffer each frame (`InstancedMesh`/`BatchedMesh`, or three.quarks' batch renderer). This cuts draw calls and per-object overhead, which is critical with many enemies.
- **GPU vs CPU sim for the web:** WebGPU compute (TSL) handles 10^5–10^6 particles (three.js' 500k example). WebGL2 can do texture ping-pong GPGPU or transform feedback, but has no compute shaders, no GPU sort and no indirect draw, so per-emitter CPU sort plus additive/premultiplied blending is the practical path. Following Niagara's guidance, small emitters (<64 particles) are better on the CPU anyway.
- **Gameplay coupling:** keep gameplay-relevant collision (projectile hits, damage) in game code and let particles be visual only. With a top-down camera, screen-space depth/normal collision (as in DOOM and Unity 6 URP) is reliable because the floor is almost always visible. This suits sparks, debris and blood bouncing on the ground (WebGPU compute or WebGL2 texture-sim reading the depth buffer).
- **Overdraw is the dominant ARPG cost:** in isometric fights, effects pile up in the same screen region around the player (packs of enemies, overlapping AoEs). Apply trimmed/cutout sprite geometry (Humus-style 4–8-vertex hulls, generated offline), smaller sprites with more opaque cores, per-effect caps, and screen-size-based LOD. Part II covers half-resolution transparent rendering.
- **Sorting under an isometric camera:** view-space depth ("Camera Depth") sorting is adequate and stable for an orthographic or near-orthographic view. Premultiplied-alpha blending lets additive and alpha-blended content share one sorted draw. Additive effects can skip sorting entirely, which matters on WebGL2 where sorting is CPU-side.
- **Ribbons/trails:** core to ARPG readability (weapon arcs, projectile trails, chain lightning beams). With a high camera pitch, camera-facing ribbons rarely degenerate. Ground-plane-aligned ribbons work well for dashes and ground slashes. Width/colour are sampled per vertex, so budget enough segments for fast swings. Easy on WebGL2 (CPU-built strip geometry or three.quarks trails).
- **Noise-composited ground and atmosphere effects (Diablo IV style), high relevance:**
  - Persistent ARPG hazards (poison pools, burning ground, crypt mist, desecrated ground) are large, long-lived and seen from above, which is exactly where flipbooks show repetition and waste memory.
  - A ground-aligned quad or decal whose shader blends two or three scrolling tiling noises, plus a flow/direction texture, a colour ramp and an erosion threshold, runs at any duration with no flipbook memory.
  - It is plain fragment-shader work, so it is fully feasible in WebGL2 and in TSL.
  - Cost is a few texture fetches per covered pixel; that figure is my inference, as Blizzard gives no numbers.
  - Cheaper tiers drop noise layers or the flow distortion.
- **Mesh particles:** slash arcs, shockwave rings, ground cracks and shields are cheap in fill-rate (thin geometry, alpha-clipped/eroded edges) compared with large additive sprites, which is why action/ARPG VFX lean on them. On the web they map to instanced meshes with custom ShaderMaterial/TSL.
- **Scalability ladder for the web (synthesis):** High (WebGPU): compute sim + GPU sort + six-way/lit smoke + MV flipbooks + soft particles. Medium (WebGL2): vertex-shader/CPU particles, CPU sort per emitter, MV flipbooks, soft particles, six-way with a single light. Low: unlit additive/premultiplied flipbooks without frame blending, soft particles off, halved spawn rates, trimmed geometry and per-effect caps always on.
- **Unity fallback note:** since VFX Graph requires compute and does not support GLES, Unity projects targeting such platforms rely on the CPU particle system. This is general Unity knowledge, not stated on the fetched page.

### Gaps
- **Search budget exhausted:** the session-wide WebSearch cap (200 searches shared by all agents) was hit early in this fork. The items below could therefore not be verified and are excluded from Cited Findings.
- GDC/VFX-summit talks 2023–2025 on particle pipelines for Diablo IV, God of War Ragnarök, Marvel's Spider-Man 2 and Path of Exile 2: no verified URLs or content.
- Niagara Fluids and Niagara simulation stages (versions/years, cost): not verified. Sibling Part II covers baked/real-time fluid sims.
- Niagara ribbon and sprite renderer reference pages (ribbon UV/tessellation modes, sprite sort modes, SubUV cutout vertex counts) returned only a table of contents when fetched.
- UE "particle cutouts" (introduced around UE 4.11): the release post returned HTTP 403, so the overdraw savings figures are unverified.
- UE translucency lighting volume / lit translucency, and Frostbite or other engines' particle lighting: not fetched.
- Niagara significance handlers, cull distance, max-instance and global-budget scaling: these exist, but the fetched best-practices page does not cover them, so they are unverified.
- No UE built-in six-way output found; community material functions likely exist but are unverified. No specific shipped titles verified for six-way lighting or motion-vector flipbooks (Unity only says "multiple AAA games").
- Klemen Lozar's original motion-vector flipbook post (often cited as the popular UE reference) is linked from RTVFX but was not opened.
- The DOOM 2016 SIGGRAPH slide PDF exceeded the fetch size limit, so particle-atlas details rely on Courrèges' frame analysis (secondary source).
- The NVIDIA 2007 soft-particles whitepaper yielded only title/author/date (its body is images), so the mechanism is cited via Unity's documentation.
- Babylon.js GPU particles / Node Particle Editor and three-nebula: not verified.
- No Switch 2 or mobile particle budget numbers (counts, ms) were found in this pass.

## VFX & particles, Part II: distortion, dissolve, VAT and baked sims, decals, half-res transparency, OIT

### Takeaway
Shipped AAA games still render most VFX transparency with sorted emitters plus additive or premultiplied blending, and they rely on baking (flipbooks, VAT, decals) and reduced-resolution buffers to keep overdraw affordable. The newest shipped-scale OIT work is Activision's 2025 voxel/froxel-based OIT. It says weighted blended OIT is the most common approximate OIT in games, and that exact A-buffers were "shipped" by Treyarch at more than 2.5x the cost. For a web ARPG, the techniques with the best payoff are the cheap baked ones: low-res distortion buffers, alpha-tested dissolve, VAT crowds, flipbooks from EmberGen/LiquiGen, pooled decals, and a half-res particle buffer. OIT is optional and best kept to glass or ghost-type cases.

### Cited Findings

#### Distortion / heat haze / refraction (scene-colour offset)
- **Mechanism:** Effects write screen-space offset vectors, which a post pass uses to re-sample the already-rendered scene colour. DOOM (2016) renders a low-resolution distortion map tested against the depth buffer, with red/green holding horizontal/vertical distortion and blue holding blur amount, then applies it as a post-process. — [Courrèges, DOOM 2016 graphics study](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/)
  - In UE, refraction needs the Translucent blend mode plus the Surface Translucency Volume lighting model, and is driven by an IOR input. Docs recommend a Fresnel lerp (stronger refraction at glancing angles) and "Panner nodes animating two normal maps" for ripple or heat-haze motion. "Refraction Depth Bias" stops closer objects bleeding into the distorted surface. — [UE docs: Using Refraction](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-refraction-in-unreal-engine)
  - Activision's 2025 OIT talk lists distortion as an extension: "accumulate distortion and weight by transmittance integral" (the same approach for motion vectors and DOF optical depth). — [Drobot, Adaptive Voxel-Based OIT, SIGGRAPH 2025 Advances](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Shipped in:** DOOM (2016, idTech 6) [Foundational 2016]. Decals there also vary how blurry glass refraction is. — [Courrèges](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/). UE and Unity HDRP expose it as a standard material feature. HDRP has a project-level "Distortion" checkbox, and disabling it when unused "reduces build time". — [HDRP Asset docs (HDRP 17)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/HDRP-Asset.html). HDRP refraction needs Blend Mode = Alpha and is unsupported in the "Before Refraction" pass. — [HDRP Lit Shader docs (HDRP 14)](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Lit-Shader.html)
- **Cost/HW:** Needs a copy of scene colour (a resolve or copy) and one extra post pass. DOOM's whole frame took "less than 16ms" on a GTX 980 (Vulkan, Ultra) with the low-res distortion map included; no per-pass number is given. — [Courrèges](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/)
- **Scalability ladder:** UE's Effects scalability turns refraction off at Low and Medium (`r.RefractionQuality` = 0, 0, 2, 2 for Low, Medium, High, Epic). — [UE Scalability Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-reference-for-unreal-engine). Lower tiers: a lower-res distortion buffer (the DOOM approach), then distortion off with an additive "shimmer" sprite in its place (inference, see Inferences).
- **Web impl.:** No dedicated WebGL/WebGPU distortion-buffer implementation verified in this pass (see Inferences for three.js notes).

#### Dissolve shaders (noise-threshold death, spawn and erosion)
- **Mechanism:** `Step(noise, Amount)` drives alpha and pixels below the clip threshold are discarded. A second step at `Amount + EdgeWidth` (about 0.05) minus the first step gives a thin edge band. Multiplying that band by an HDR colour (intensity about 2) into Emission makes the edge glow under bloom. — [Cyanilux, Dissolve Shader Breakdown (Feb 2020)](https://www.cyanilux.com/tutorials/dissolve-shader-breakdown/)
  - Noise space options: object-space noise stays fixed to the mesh whatever its transform; world-space noise is fixed to the world; UV noise can show seams. Adding negated Y position to the noise, remapped with a MinMaxY property, gives a directional top-to-bottom dissolve. — [Cyanilux](https://www.cyanilux.com/tutorials/dissolve-shader-breakdown/)
  - The tutorial keeps the material Opaque with hard alpha clipping rather than true blending, so depth writes and no sorting are retained. — [Cyanilux](https://www.cyanilux.com/tutorials/dissolve-shader-breakdown/)
- **Shipped in:**
  - Diablo IV (2023) lists "dissolving" among its environment-shader features. The exact noise and edge recipe is not described. — [Blizzard, "Peeling Back the Varnish: The Graphics of Diablo IV"](https://news.blizzard.com/en-us/article/23964183/)
  - No primary source tying a specific 2023–2026 title's enemy death or spawn effect to this shader was found in this pass (see Gaps).
  - The technique is ubiquitous in engine tutorials (Unity Shader Graph above).
- **Cost/HW:** One noise texture fetch plus a compare. Works in any shader model. Alpha-test keeps early-Z benefits only partially, because `discard` disables early depth on many GPUs (general knowledge, not sourced here).
- **Scalability ladder:** The same shader works at every tier. On low end, drop the emissive edge or bloom, or replace the dissolve with a quick scale-down or fade (inference).
- **Web impl.:** None verified in this pass. Trivial in three.js via `onBeforeCompile` or TSL (inference).

#### Vertex Animation Textures (VAT) for baked deformation, destruction, fluids and crowds
- **Mechanism:** The animation is baked offline into textures (per-vertex positions plus rotations/normals, or per-piece pivots and rotations, or per-joint transforms). The vertex shader fetches the texel for the current frame and moves vertices, so playback is pure GPU work. — [80.lv guide to SideFX VAT (Aug 2021)](https://80.lv/articles/a-complete-guide-on-sidefx-s-vertex-animation-textures-tool/); [SideFX Labs VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
  - Labs VAT 3.1 modes:
    - **Soft-Body:** constant topology.
    - **Rigid-Body:** packed RBD pieces.
    - **Dynamic Remeshing (Fluid):** changing topology; needs two export passes plus a lookup table.
    - **Particle Sprites:** cards.
    - **Bone:** new in 3.1. It bakes per-joint transforms, "supports up to 128 joints and clamps capture weights to the four highest per vertex", trading smaller textures for slightly more runtime work. Its runtime shaders are currently Unreal-only and need Nanite disabled.
    — [SideFX VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
  - Playback "do[es] not have to be played in complete loops or at a constant speed". Interpolation options include slerp with angular velocity for fast-spinning rigid pieces and particle interframe interpolation. One FBX can hold multiple LODs that share one texture set. — [SideFX VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
- **Shipped in / tooling:**
  - SideFX Labs VAT (free; UE and Unity shaders, with Unity's in a "URP_VAT3" package). — [SideFX docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
  - OpenVAT (2025): a free, open-source Blender add-on by Luke Stilson that encodes VATs from animated or Geometry-Nodes geometry for Unity, Unreal and Godot. It is listed as v1.0.2 for Blender 4.2+, and a later Unity integration added frame blending. — [Blender Extensions: OpenVAT](https://extensions.blender.org/add-ons/openvat/); [Digital Production, Jul 2025](https://digitalproduction.com/2025/07/01/openvat-adds-vat-encoding-to-blender-real-time-asset-ready/); [Unity Discussions thread](https://discussions.unity.com/t/vertex-animation-textures-an-elegant-solution-for-baked-simulations-and-advanced-deforming-animation-openvat/1680369)
  - Godot community shader for OpenVAT: glTF-binary export, with min/max bounds read from the exported JSON. — [Godot Shaders](https://godotshaders.com/shader/vertex-animation-texture-uses-openvat-output/)
  - JangaFX LiquiGen exports liquid sims as "Mesh flipbooks and VAT". — [JangaFX LiquiGen](https://jangafx.com/software/liquigen/)
  - Named shipped games: none confirmed as using VAT in this pass (see Gaps).
  - A related shipped case with an unspecified technique: Diablo IV (2023) says blood globules and limbs are "animated in shaders". That suggests vertex-shader or baked animation, but VAT is not named. — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)
- **Cost/HW:**
  - Needs vertex texture fetch, ideally HDR (EXR/TIFF) float textures. "Split Positions into Two Textures" falls back to two 8-bit textures when an engine lacks HDR. — [SideFX VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
  - Hard limits: points ≤ texture width × 1980 ("1980 is the hard upper limit of the animation UV row count"); fluid triangles ≤ lookup width × 660. — [SideFX VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
  - Advantage: "much lighter performance impact on the CPU, compared to traditional skeletal mesh animations". — [80.lv](https://80.lv/articles/a-complete-guide-on-sidefx-s-vertex-animation-textures-tool/)
  - Documented limits: "the lack of animated collisions", "relatively limited real-time interactability", and texture memory on low-end hardware. — [SideFX VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html)
  - UE5 UV precision changes can make VAT meshes glitch; the fixes are "UE4 Compatible UVs" or the more expensive "Use Full Precision UVs". Fluid remeshing can flicker normals. — [SideFX forum VAT 3.0 FAQ](https://www.sidefx.com/forum/topic/81422/)
- **Scalability ladder:** Use LODs that share one texture set (built in), Bone mode instead of per-vertex mode to shrink textures, and 8-bit split textures where HDR is unavailable. — [SideFX VAT 3.1 docs](https://www.sidefx.com/docs/houdini/nodes/out/labs--vertex_animation_textures-3.1.html). Further rungs (fewer frames, lower frame rate with interpolation, flipbook impostors for distant crowds) are inference.
- **Web impl.:** No three.js/WebGPU VAT implementation was verified in this pass. OpenVAT's glTF export plus the Godot shader shows a glTF-friendly path (inference: the same files can feed a three.js shader).

#### Baked fluid sims: EmberGen / Houdini to flipbooks and VDB; LiquiGen; Niagara Fluids
- **Mechanism:** Fire, smoke or liquid is simulated offline, or interactively on the GPU in a DCC tool, and exported as flipbook atlases with extra channels such as motion vectors, normals and lighting data. Volumes go out as VDB. At runtime only cheap sprites or meshes are drawn. — [JangaFX EmberGen](https://jangafx.com/software/embergen/)
- **Shipped in / tooling:**
  - EmberGen is JangaFX's real-time GPU fluid simulator for fire, smoke and explosions. It exports EXR/PNG/TGA image sequences and flipbooks, VDB, and "game-oriented data: final renders, motion vectors, six-point lighting, normal maps, and depth maps". It claims use by "over 200 leading game studios" without naming games; testimonials come from Twisted Pixel Games, Sharkmob and Alchemy VFX. — [JangaFX EmberGen](https://jangafx.com/software/embergen/)
  - LiquiGen (JangaFX) is a real-time liquid simulator with real-time meshing and sparse domains. It exports Alembic (particles, meshes, foam), mesh flipbooks and VAT, image flipbooks, normal and refraction maps, and "animated decals". — [JangaFX LiquiGen](https://jangafx.com/software/liquigen/)
  - UE Niagara Fluids (UE 5.8 docs) provides "2D templates that are optimized for games, or 3D templates designed for cinematics". Sims "can be heavy", and the doc suggests baking a Fluids emitter "to a flipbook that works on any Material". — [UE docs: Niagara Fluids](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-fluids-in-unreal-engine)
- **Cost/HW:** Runtime cost is a flipbook sprite or VAT mesh. Live Niagara Fluids scenes "can be graphically intensive, and may result in a GPU crash on Windows". — [UE docs: Niagara Fluids](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-fluids-in-unreal-engine)
- **Scalability ladder:** Live 3D sim (cinematics) → live 2D sim (games) → baked flipbook. — [UE docs: Niagara Fluids](https://dev.epicgames.com/documentation/en-us/unreal-engine/niagara-fluids-in-unreal-engine). Flipbook rungs (smaller atlas, fewer frames with motion-vector blending, dropping six-way lighting to unlit) are covered in Part I.
- **Web impl.:** None verified in this pass. Flipbooks and VAT outputs are engine-agnostic textures (inference).

#### Impact decals (deferred/DBuffer, clustered/forward, mesh decals; scorch marks and blood pools)
- **Mechanism (deferred/DBuffer):** Decal volumes are projected onto the depth buffer. UE5 accumulates decals into a DBuffer before the base pass (base colour, normal, roughness), and receiving materials sample it. Emissive and AO decals bypass the DBuffer through extra draws. — [UE docs: Decal Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-materials-in-unreal-engine)
  - Unlike regular deferred (GBuffer) decals, "DBuffer decals correctly affect Lightmap and sky lighting", but enabling them "forces a full Pre-Pass". — [UE Rendering project settings](https://dev.epicgames.com/documentation/en-us/unreal-engine/rendering-settings-in-the-unreal-engine-project-settings)
  - DBuffer decals support only Translucent and Alpha Composite blend modes. Overlapping DBuffer decals using DBuffer expressions don't blend with each other. Each decal actor has a sort order. — [UE docs: Decal Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-materials-in-unreal-engine)
- **Mechanism (clustered/forward):** DOOM (2016) applies decals inside the clustered forward pass from a texture atlas. Each cluster can reference "up to 256 lights, 256 decals and 256 cubemaps", and the pass uses an EQUAL depth test after a depth pre-pass [Foundational 2016]. — [Courrèges, DOOM 2016 study](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/)
  - HDRP likewise uses a decal atlas plus "Maximum Clustered Decals on Screen" for decals on transparent objects. — [HDRP Asset docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/HDRP-Asset.html)
- **Shipped in:** UE5 (DBuffer default "for all Unreal Engine 5 projects"). — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-materials-in-unreal-engine). Unity 6 URP Decal Renderer Feature: "does not work on transparent surfaces"; no SRP Batcher "by design"; GPU-instanced when sharing a material; atlases via UV offset. — [Unity 6 URP: Decal Renderer Feature](https://docs.unity3d.com/6000.0/Documentation/Manual/urp/renderer-feature-decal.html). DOOM 2016 [Foundational].
- **Cost/HW:**
  - "Screen coverage and material complexity are the biggest factors in the cost of rendering decals."
  - DBuffer requires a depth prepass, which is free when Nanite, Lumen or Virtual Textures already use one.
  - Turn off "Receives Decals" on characters walking through decal volumes.
  — [UE docs: Decal Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-materials-in-unreal-engine)
- **Lifetime/budget:**
  - UE decal actors have Fade Start Delay and Fade Duration (both 0 means persistent), Fade In, Fade Screen Size (fade below a screen size), and "Destroy Owner After Fade". — [UE docs: Decal Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-materials-in-unreal-engine)
  - HDRP has a decal Draw Distance, decal Layers, and atlas resolution tiers. — [HDRP Asset docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/HDRP-Asset.html)
- **Scalability ladder:** Mobile has no DBuffer. Mobile forward approximates decals by applying BaseColor and Emissive to the lit scene colour; mobile deferred uses GBuffer decals without AO. Feature Level Switch nodes simplify decal graphs for low-end paths. — [UE docs: Decal Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/decal-materials-in-unreal-engine)
- **Animated decals:** LiquiGen exports "animated decals" (for example liquid or blood spread). — [JangaFX LiquiGen](https://jangafx.com/software/liquigen/)
- **Web impl.:** None re-verified in this pass (three.js's mesh-decal helper is noted under Inferences; three.js itself is covered by another researcher).

#### Half-resolution / off-screen transparency and particles with upsampling
- **Mechanism [Foundational 2007]:** Draw opaque geometry, downsample depth, render particles into a target at 1/2 to 1/8 resolution (depth-tested against the small depth), then upsample and composite. Point-sampled depth causes halos, so the chapter takes the max of 4 depth samples, admitting this is a heuristic. The blend stores destination transmittance (the product of inverse alphas) in alpha via separate alpha blending. A "mixed resolution" refinement Sobel-filters the low-res result, builds a stencil mask of edges, and re-renders particles at full res only there. — [Cantlay, GPU Gems 3 ch. 23 "High-Speed, Off-Screen Particles"](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles)
- **Cost/HW (GPU Gems 3; GeForce 8800 GTX, 1600×1200):**

  | Mode | FPS |
  |---|---|
  | Full res | 25 |
  | Mixed 4×4 | 51 |
  | Low-res 4×4 | 61 |
  | Mixed 2×2 | 44 |
  | Low-res 2×2 | 46 |

  At 4×4, particle pixels drop from 46.9M to 3.5M. Gains shrink when the effect is small on screen. — [GPU Gems 3 ch. 23](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles)
- **Shipped in (engines):**
  - Unity HDRP has a transparent Rendering Pass "Low Resolution" that "draws the GameObject in half resolution after the Default pass". — [HDRP Lit Shader docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@14.0/manual/Lit-Shader.html)
  - HDRP dynamic resolution has a "Low Res Transparency Min Threshold". — [HDRP Asset docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/HDRP-Asset.html)
  - UE's "Separate Translucency" renders translucency "to a separate render target" composited after DOF. — [UE Rendering project settings](https://dev.epicgames.com/documentation/en-us/unreal-engine/rendering-settings-in-the-unreal-engine-project-settings) (its screen-percentage/upsample cvars were not verified, see Gaps)
  - Call of Duty (2025 talk): the transparency transmittance prepass runs at 1/8 resolution, with "multi resolution rendering" listed as a benefit. A test config is "VRS 4k | RGB VBOIT 480x270 | PS5". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Related, decoupled lighting resolution [Foundational 2016]:** DOOM lights each particle into tiles of a 4k atlas whose tile size depends on camera distance and quality (example 64×64). The lighting is then upscaled and blended with the full-res sprite texture, so particle lighting cost is independent of render resolution. — [Courrèges](https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/)
- **Variable-rate shading (hardware alternative):**
  - D3D12 VRS Tier 1 is per-draw; Tier 2 adds a screen-space rate image, per-primitive rates and combiners. Microsoft suggests lowering the rate for "assets behind semitransparency".
  - A Firaxis test at 4K on an RTX 2060 gained about 20% FPS with Tier 1 and 14% with a Tier 2 edge-detect image.
  — [Microsoft DirectX blog (Mar 2019)](https://devblogs.microsoft.com/directx/variable-rate-shading-a-scalpel-in-a-world-of-sledgehammers/)
  - UE exposes VRS mainly for VR foveation in its project settings (Tier 2 GPUs). — [UE Rendering project settings](https://dev.epicgames.com/documentation/en-us/unreal-engine/rendering-settings-in-the-unreal-engine-project-settings)
- **Scalability ladder:** Full res → 1/2-res with mixed-resolution edges → 1/2-res plain → 1/4-res (GPU Gems figures above). HDRP can drop low-res transparency further under dynamic resolution down to its min threshold. — [HDRP Asset docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/HDRP-Asset.html)
- **Web impl.:** None verified in this pass. VRS is not used on the web (see Inferences).

#### Status quo: per-emitter sorting + additive / premultiplied blending (what most shipped games do)
- **Mechanism:**
  - Call of Duty's Infinity Ward technology uses manual sort orders (emitters, materials, meshes), CPU sorting, "inter-emitter sorting" on CPU or GPU, and a "Blend Add RGB mode" via "hardware dual blend". It also keeps an "8-bit accumulated alpha buffer for culling of flares". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
  - Its pros are "Fast" and "No memory overhead"; its cons are "Labor intensive" and "Sometimes doesn't work". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Premultiplied alpha:** Changes the blend to `Src.rgb*One + Dest.rgb*(1−Src.a)` and gives correct colours under mip generation and filtering, where post-multiplied alpha bleeds wrong colours. — [NVIDIA: Alpha Blending, To Pre or Not To Pre](https://developer.nvidia.com/content/alpha-blending-pre-or-not-pre)
- **Engine sort policies:** UE offers Sort by Distance (default, "3D games"), Sort by Projected Z, and Sort Along Axis ("2D games") for translucent primitives. — [UE Rendering project settings](https://dev.epicgames.com/documentation/en-us/unreal-engine/rendering-settings-in-the-unreal-engine-project-settings)
  - Babylon.js sorts blended meshes by `alphaIndex`, then by bounding-sphere-centre depth, and draws particles and sprites in their own fixed stages. — [Babylon.js docs: Transparent Rendering](https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering)
- **Industry framing:** "most games have ad-hoc and scene-dependent ways of working around transparent surface rendering limitations." — [LearnOpenGL: Weighted Blended OIT (2020)](https://learnopengl.com/Guest-Articles/2020/OIT/Weighted-Blended)

#### Weighted blended OIT (WBOIT) [Foundational 2013]
- **Mechanism:** Transparent surfaces are rendered in any order into two targets:
  - accum (RGBA16F), blend ONE/ONE, holding premultiplied colour × weight;
  - revealage (R8, R16F suggested), blend ZERO/ONE_MINUS_SRC_COLOR.
  A full-screen composite outputs `accum.rgb/accum.a` with alpha `1−revealage`. The weight is a clamped function of alpha and depth that down-weights faint and distant fragments. — [McGuire, Casual Effects blog (26 Mar 2015)](http://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html); original: McGuire & Bavoil, JCGT 2013 (as cited in [LearnOpenGL](https://learnopengl.com/Guest-Articles/2020/OIT/Weighted-Blended))
- **Shipped in:**
  - Activision's 2025 survey labels WBOIT "Most common in games". It cites "Improvements in [KIR18]", which is Kircher, "Rendering Technology in 'Agents of Mayhem'", GDC 2018 (implying a shipped variant in Agents of Mayhem, 2017; not independently verified). — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
  - McGuire integrated it into the G3D engine 10.1 and says he worked with "several companies to integrate our transparency method into their games", none named. — [Casual Effects](http://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html)
  - Qt Quick 3D exposes it as an option (`OITWeightedBlended`). — [Qt 6.10 docs](https://doc.qt.io/qt-6.10/qtquick3d-orderindependenttransparency-example.html)
- **Cost/HW:**
  - Needs float render targets, MRT and per-render-target blend state. — [Casual Effects](http://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html)
  - Activision lists the family as low complexity, bandwidth and memory, with cons "Frequency soup", "Hard to tune" and "Hard to represent occlusion". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
  - Measured at 4K on PS5: 5.908 ms total (draws 5.6 ms), against 4.4 ms for no OIT in the same scene. — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
  - Limitations: poor separation of layers close in depth, per-scene weight tuning, no refraction, averaged coloured transmission, and fp16 overflow or underflow artifacts. — [Casual Effects](http://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html)
- **Scalability ladder:** R8 revealage halves bandwidth and memory versus R16F at some precision cost. — [Casual Effects](http://casual-effects.blogspot.com/2015/03/implemented-weighted-blended-order.html)
- **Web impl.:**
  - `three-wboit` (stevinz, MIT) is a `WboitPass` plus `MeshWboitMaterial` for three.js. It claims to be "WebGL 1 compatible and mobile friendly". Opacity near 1.0 stays artificially transparent, and a v152+ renderer change is noted. — [GitHub: stevinz/three-wboit](https://github.com/stevinz/three-wboit)
  - WebGL2 per-target blend state comes from `OES_draw_buffers_indexed` (WebGL2-only), marked "Baseline: Widely available" since Dec 2022. — [MDN: OES_draw_buffers_indexed](https://developer.mozilla.org/en-US/docs/Web/API/OES_draw_buffers_indexed)

#### Exact OIT: A-buffers, per-pixel linked lists (PPLL), depth peeling
- **Mechanism:** Every transparent fragment is captured (linked lists, depth peeling, or bounded A/K-buffers), then sorted and composited. This gives an exact result at the price of "High bandwidth", "High complexity", "High memory usage", plus a fallback to approximation when memory runs out. — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Shipped in:**
  - Treyarch's Black Ops 4 (2018) used a 9-layer A-buffer ([KOH16]: Köhler, "Practical Order Independent Transparency", Treyarch 2016). Meshes rasterize with UAVs, VFX rasterize in a software compute path, and an adaptive-transparency structure handles other media. The talk notes it "Shipped". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
  - AMD TressFX 3.1 added an OIT option called "ShortCut" for hair. — [GPUOpen TressFX](https://gpuopen.com/tressfx/) (PPLL details and title list not on that page)
- **Cost/HW (Black Ops 4 A-buffer):**
  - Memory at 4K was about 530 MB (monochrome) or 754 MB (RGB).
  - Performance hit was ">2.5x vs non-OIT".
  - Other cons: "No simple support for multi-resolution", and "More modern VFX use less camera-oriented cards", which forces more overflows.
  — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Web impl.:**
  - The official WebGPU samples include "A-Buffer": "order independent transparency using a per-pixel linked-list of translucent fragments", with memory limiting by rendering horizontal slices. The shader uses `atomicAdd` on a fragment counter and `atomicExchange` on per-pixel heads in storage buffers. — [webgpu-samples a-buffer meta.ts](https://raw.githubusercontent.com/webgpu/webgpu-samples/main/sample/a-buffer/meta.ts); [translucent.wgsl](https://raw.githubusercontent.com/webgpu/webgpu-samples/main/sample/a-buffer/translucent.wgsl)
  - Babylon.js (since 5.0) has `scene.useOrderIndependentTransparency = true`, which uses dual depth peeling with `passCount` default 5 (up to 10 layers). It requires WebGL2 or WebGPU and renders transparent meshes multiple times. Known issues: it is beta, may break post-processes, has no anti-aliasing, does not support refraction textures, and RG16Float precision on WebGPU causes artifacts (fix: `useReverseDepthBuffer`). — [Babylon.js docs](https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering)

#### Moment-based OIT and stochastic transparency
- **Moment-based OIT:** Listed by Activision under "what other games use", alongside WBOIT and bounded A-buffers. It approximates the transmittance-over-depth function with power or trigonometric moments from a prepass. At 4K on PS5 it cost 5.705 ms total (prepass 0.196 ms, draws 5.4 ms). — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf). Specific shipped titles were not identified (see Gaps).
- **Stochastic transparency:** "Rasterize with stochastic dither" based on pixel transparency, then supersample spatially or over time and converge. Described as "Often used in games", "Cheap", "Situational". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)

#### Adaptive Voxel-Based OIT (AVBOIT), Activision 2025 (newest production-scale approach)
- **Mechanism:**
  1. Transparent surfaces are splatted (rasterization or U32 atomics) into a low-res froxel extinction buffer along a log-distributed depth curve.
  2. A compute job integrates extinction along view rays into a 3D transmittance LUT; Drobot calls this a "similar framework used in volumetric fog".
  3. Transparencies render in any order, multiplying their opacity by the looked-up transmittance.
  4. A resolve normalizes the accumulated colour and extinction.
  - "Adaptive" means slice resolution is redistributed through a depth LUT according to measured occupancy.
  - A "zero-transmittance depth" lets draws behind fully opaque smoke be culled.
  — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Shipped in:** Call of Duty technology (talk by Activision Central Tech with Infinity Ward Poland and Raven Software; Treyarch acknowledged). It was motivated by "modes that are full of hundreds of NPCs with absolute visual mayhem on screen mixing explosions with magic". The exact title is not named in the slides. — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Cost/HW (PS5):** numbers read from the PDF text; per-pass layout partly garbled. All from [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf).
  - **Totals at 4K:**

    | Method | Total |
    |---|---|
    | MBOIT | 5.705 ms |
    | WBOIT | 5.908 ms |
    | AVBOIT | 5.667 ms |
    | AVBOIT + cull | 4.967 ms |
    | No OIT | 4.4 ms |

  - **RGB scene at 4K:** no OIT 2.8 ms; AVBOIT 2.95 ms (monochrome), 3.02 ms (total extinction only), 3.11 ms (RGB transmittance).
  - **Splatting:** 0.75–0.95 ms for "17mil pixels overdraw @ 1080p".
  - **Memory at a 1440p target:** 320×180×32 scalar plus 320×180×128 RGB extinction, and a 320×180×128 RGBA8 integral, totalling 66.5 MB.
  - **Occupancy skipping:** cuts clear plus integrate from 0.353 ms to 0.05 ms.
  - **Zero-transmittance early-out:** brings the transparency pass to about 1.78 ms, against 1.73 ms for plain alpha blending (VRS 4K, 480×270 VBOIT).
- **Production impact:** Environment artists no longer need manual sort orders. VFX artists lose "manual sort" tricks (such as a fireball forced through smoke) and must use depth or "camera offset", which "Forces content to make more volumetric assets". — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Scalability ladder:** Integration cost scales with slice occupancy, through a tunable physical memory pool, precision and slice count. Monochrome extinction is used for most VFX and RGB for coloured glass. — [Drobot, SIGGRAPH 2025](https://www.activision.com/cdn/research/AVBOIT_SIG2025_MDROBOT-final.pdf)
- **Web impl.:** None (2025 research). See Inferences on WebGPU feasibility.

### Inferences
- **Distortion:**
  - **Isometric relevance:** High. The camera mostly looks at the ground plane, so heat-haze over fire walls, shockwave rings, portals and spell-impact ripples read clearly against terrain detail.
  - **Recommended approach:** One shared low-res (1/2 or 1/4) RG(+B blur) distortion buffer in the DOOM style, applied once in post. Per-material scene-colour copies don't scale to dozens of spell effects.
  - **three.js feasibility:** WebGL2 works: distortion sprites render into a small RGBA8 or RG16F target, then a final pass offsets UVs into the scene texture. three.js's MeshPhysicalMaterial transmission path already renders a scene-colour copy, which shows the pattern works, but it is per-material and heavier.
  - **Depth handling:** Depth-test the distortion sprites, as UE's "Refraction Depth Bias" does, so characters in front of a shockwave don't smear.
  - **Low tier:** Disable it entirely, as UE does at Low/Medium.
- **Dissolve:**
  - **Isometric relevance:** Very high, with three uses: enemy death and corpse cleanup (alpha-tested, so no sorting cost with hundreds of enemies), demon spawn-in (directional bottom-up dissolve with emissive edges), and camera-occlusion cutaways for walls or trees between the camera and the hero.
  - **Instancing:** Pass the dissolve amount per instance (InstancedBufferAttribute or TSL instance attribute).
  - **Shadows:** Use the same clip in the shadow or depth material, otherwise shadows don't dissolve.
  - **Edge glow:** Goes through bloom (HDR emissive), so it needs an HDR pipeline.
- **VAT:**
  - **Isometric relevance:** Very high for "many enemies". Swarms (skeletons, zombies, imps) can be instanced meshes driven by VAT or bone textures instead of per-enemy SkinnedMesh CPU skinning, which is a known three.js bottleneck. Bone-mode VAT (≤128 joints, 4 weights) is the most memory-efficient for skinned crowds. Rigid-body VAT suits crumbling tombstones and pillars; LiquiGen or OpenVAT fluid VAT suits blood bursts.
  - **WebGL2 feasibility:** Supports vertex texture fetch with `texelFetch` on RGBA16F/RGBA32F textures (no filtering needed). The 1980-row limit is a Houdini export limit, not a GPU one.
  - **WebGPU:** Allows storage buffers instead of textures.
  - **Interactivity:** VAT lacks collisions and interactivity, so gameplay-critical motion such as hit reactions needs blending or swapping to skeletal animation for nearby or hero enemies.
- **Baked sims:**
  - **Default choice:** EmberGen flipbooks with motion vectors and six-point lighting are the best quality-per-cost choice for fire, smoke and explosions on both WebGL2 and WebGPU.
  - **Live sims:** Avoid live 3D fluid sims. A live 2D sim (as in Niagara's "2D templates optimized for games") fits a top-down camera unusually well, since poison clouds, spreading fire or ground mist live on a plane. A 128²–256² grid is cheap as a WebGL2 ping-pong fragment pass or a WebGPU compute pass (inference, not measured).
- **Decals:**
  - **Isometric relevance:** Extreme. The ground fills most of the screen, so blood pools, scorch marks, cracks, footprints and AoE telegraphs are core to the look. three.js's forward renderer has no built-in deferred or DBuffer decal path. Options, roughly by cost:
    1. **Mesh decals:** projected-and-clipped geometry, which three.js ships as a DecalGeometry helper (not re-verified here). Robust, but costs CPU per spawn and adds draw calls.
    2. **Screen-space box decals:** read the depth texture and reconstruct position and normal. This requires a depth prepass or depth texture; UE's DBuffer path has the same requirement.
    3. **World-space ground decal layer:** a "paint" render target covering the area around the player, sampled by the terrain shader. This suits a top-down camera best: one texture fetch per ground pixel regardless of decal count.
    4. **Clustered decals from an atlas, DOOM style:** feasible on WebGPU with storage buffers, and with data textures on WebGL2.
  - **Budget:** Pool decals and copy UE's lifetime controls (fade-in, fade delay, fade duration, fade by screen size).
  - **Characters:** Must not receive ground decals; the equivalent of UE's "Receives Decals" off.
- **Half-res particles:**
  - **Payoff:** Probably the single most valuable VFX optimisation for a web ARPG. Fill rate is the bottleneck on integrated GPUs and high-DPI screens (devicePixelRatio 2–3), and heavy spell VFX are overdraw-bound. GPU Gems 3 measured roughly 2x frame rate.
  - **WebGL2 recipe:** Depth texture → max- or min-depth downsample → particles into a 1/2-res RGBA16F target (needs EXT_color_buffer_half_float/float) using separate alpha to store transmittance → nearest-depth or bilateral upsample → composite.
  - **Why it suits an isometric camera:** The narrow depth range means discontinuities sit mostly at character silhouettes, which nearest-depth upsampling handles.
  - **No VRS on the web:** WebGL2 and WebGPU expose no VRS (not verified in this pass), so off-screen low-res buffers are the only reduced-rate option.
  - **Lighting at low resolution:** DOOM's particle lighting atlas shows lighting can also be computed at low resolution, independent of screen size.
- **Sorting and OIT:**
  - **Default for ARPG VFX:** Keep the shipped-game default of sorted emitters with premultiplied blending. With premultiplied blending (ONE, ONE_MINUS_SRC_ALPHA), a fragment that outputs alpha = 0 blends additively. Additive fire or arcane glows and alpha-blended smoke can therefore share one blend state and one sorted pass, cutting three.js material and state switches. Additive-only effects never need sorting because addition is commutative.
  - **Sorting with a near-orthographic camera:** Sorting by view-space Z is stable, the equivalent of UE's "Sort by Projected Z".
  - **When to add WBOIT:** Only for specific content such as ghost or ethereal enemies, stained glass or overlapping volumetric smoke. three-wboit shows it runs in three.js. Weight tuning per scene depth range is required, and occlusion between dense smoke and glass is weak (Activision's critique).
  - **Exact OIT:** Depth peeling (Babylon) or PPLL A-buffers (WebGPU sample) cost too much for particle-heavy scenes. Keep them for a few hero glass or hair objects at most.
  - **AVBOIT-style froxel OIT:** Plausible only on WebGPU, which has compute and storage-buffer atomics. It could share the froxel grid with volumetric fog, but it is a large engineering project and the 66.5 MB footprint at 1440p needs a smaller grid for the web.
- **Dual-source blending:** CoD's "Blend Add RGB … hardware dual blend" relies on it. WebGL2 lacks it, and WebGPU exposes it only as an optional feature (unverified in this pass), so a premultiplied single blend is the portable equivalent.

### Gaps
- **Search budget ran out:** The shared WebSearch budget for the session was exhausted early in this fork. Everything after the first two searches came from direct fetches of known primary URLs, which limited discovery of 2023–2026 shipped-title evidence.
- **Not verified:**
  - Named shipped games using VAT for crowds or destruction (for example UE's AnimToTexture or City Sample crowds).
  - Specific games' dissolve death or spawn effects.
  - Gears 5 / Gears Tactics VRS details.
  - UE5 `r.OIT.SortedPixels` (experimental sorted-pixel OIT) documentation; not on the UE rendering-settings page fetched.
  - UE `r.SeparateTranslucencyScreenPercentage` and its upsample modes; not on the scalability or rendering-settings pages fetched.
  - HDRP's low-res transparency upsample filter (the Lit page only says "half resolution") and HDRP distortion settings (distortion-only, blur).
  - URP decal technique choices (DBuffer vs Screen Space) and their platform defaults; the fetched Unity 6 page didn't cover them.
  - DOOM 2016 primary slides; Courrèges' reverse-engineering study was used instead.
  - Content of Kircher's GDC 2018 Agents of Mayhem talk; only its citation in the Activision slides.
  - Shipped titles using moment-based OIT.
  - TressFX's PPLL implementation and its shipped-title list (the GPUOpen page lacks them).
  - WebGPU dual-source blending availability.
- **Unconfirmed in the AVBOIT talk:** The slides don't name the Call of Duty title that ships AVBOIT, so production use is implied but not confirmed. Per-pass AVBOIT timings came from PDF text extraction and the table layout was partly garbled; only the totals are reliable.
- **No figures found:** No source gave runtime cost figures for dissolve shaders or VAT playback, and no web-specific benchmarks were found for any technique in this section.

## Stylized/NPR rendering, Part I: cel/toon shading and outlines

### Takeaway
Cel/toon shading in shipped games is cheap at its core: a thresholded or ramp-mapped N·L. What makes it look good is the art-control layer on top: authored shadow colours, per-material ramps, mask textures, edited normals, face-shadow maps and controlled "toon lights". The most recent AAA-level reference is Hi-Fi Rush, whose GDC 2024 talk describes a *deferred* toon renderer in a customised UE4 holding 60 fps at native resolution. Outlines come in four families: inverted hull, screen-space edge detection, mask/blur selection outlines (with X-ray), and jump-flood wide outlines. For a top-down ARPG with many enemies, the mask-based selection outline with X-ray and screen-space edges usually pay off better than per-mesh inverted hulls or anime face tricks.

### Cited Findings

#### 1. Threshold / ramp cel shading (core lighting model)
- **Mechanism:** Start from Blinn-Phong N·L and pass it through a step, using `smoothstep` over a tiny range (0 to 0.01) so the light/dark terminator stays sharp without aliasing. For more than two bands, sample a 1D ramp texture with N·L as the UV. Specular (N·H raised to a gloss power) and rim (1 − N·V) are each thresholded the same way. Shadow attenuation is multiplied into N·L so cast shadows fall into the dark band. — [Roystan, "Toon Shader" (Unity 2018.3 tutorial)](https://roystan.net/articles/toon-shader/)
- The rim term is multiplied by N·L so it appears only on lit sides; otherwise it "tends to resemble an outline". — [Roystan](https://roystan.net/articles/toon-shader/)
- **Shipped in:**
  - *Guilty Gear Xrd* (Arc System Works, 2014; GDC 2015 talk "GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D", Junya Christopher Motomura). Its stated goal was to "rebuild a classic 2D fighting game within a modern full-3D graphical framework" while keeping the 2D look. **[Foundational 2015]** — [GDC Vault](https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The)
  - *Hi-Fi Rush* (Tango Gameworks, 2023): toon shading over the entire world, characters and environments alike (see technique 3). — [GDC Vault 2024](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
  - *Genshin Impact*-style shading as reverse-engineered by the community: ramp textures plus a separate specular ramp (see technique 2). — [PrimoToon (GitHub)](https://github.com/festivities/PrimoToon)
- **Cost/HW:** One extra texture fetch (the ramp) over Lambert/Blinn-Phong; no special hardware. The ramp textures should be uncompressed, have no mipmaps and use Clamp wrap mode, or band edges smear. — [PrimoToon](https://github.com/festivities/PrimoToon). No ms figures were found.
- **Scalability ladder:** The commercial NiloToonURP shader (used for live/MV content) explicitly targets mobile, VR and WebGL across Unity 2021.3 to Unity 6 (URP 12.x to 17.x). This shows a full anime toon stack fits low-end and web targets. — [NiloToon example repo README](https://raw.githubusercontent.com/ColinLeung-NiloCat/UnityURPToonLitShaderExample/master/README.md). Unity's own Unity Toon Shader (UTS3) runs on Built-in, URP and HDRP with different feature sets per pipeline; partial 2D-URP support starts in Unity 6.3. — [Unity-Technologies/com.unity.toonshader](https://github.com/Unity-Technologies/com.unity.toonshader)
- **Web impl.:**
  - three.js ships `MeshToonMaterial` (WebGL) and `MeshToonNodeMaterial` (node/TSL path); the WebGPU-side toon outline pass is restricted to these two materials. — [three.js ToonOutlinePassNode.js](https://github.com/mrdoob/three.js/blob/dev/src/nodes/display/ToonOutlinePassNode.js)
  - NiloToonURP builds to WebGL (Unity web export). — [README](https://raw.githubusercontent.com/ColinLeung-NiloCat/UnityURPToonLitShaderExample/master/README.md)

#### 2. Art-control layer on top of the ramp (shadow-colour design, mask textures, custom normals, face shadows, hair highlight, rim, MatCap)
- **Mechanism (Unity Toon Shader, UTS3):**
  - Colours are designed in tiers: base, 1st shade and 2nd shade colours, plus a highlight colour, with a "Shading Step and Feather" control.
  - Shadow and light areas can use fixed authored colours *regardless of scene light colours*, and a per-material switch decides whether the directional light's colour affects the material.
  - Extra lighting layers: highlight, rim light, emission, MatCap and "angel ring" (anime hair-highlight) projection.
  - HDRP-only extras include Box Light and "Toon EV Adjustment".
  - UTS3 succeeds Unity-chan Toon Shader 2.0.
  - — [Unity-Technologies/com.unity.toonshader](https://github.com/Unity-Technologies/com.unity.toonshader)
- **Mechanism (Genshin-style, community replication):** The shader uses per-material ramp textures, a separate specular ramp, linear "lightmap" mask textures, a dedicated face-shadow texture and normal maps. Imported models must keep their *custom tangents*: the project ships an `AverageNormals.cs` tangent-regeneration script and a separate outlines HLSL file, consistent with smoothed outline normals stored in tangents. The author warns it "isn't meant to be 100% accurate"; the repo was archived on 21 July 2025. — [PrimoToon](https://github.com/festivities/PrimoToon). (How the face map is used, SDF vs threshold, is *not* stated on that page; see Gaps.)
- **Mechanism (Hi-Fi Rush):** The GDC 2024 talk lists "toon lights", dynamic and static shadow-map strategies, a dedicated face-shadow implementation, light-probe GI and "comic shaders" as the main components. — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
- **Shipped in:**
  - *Hi-Fi Rush* (2023). — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
  - The UTS lineage is used for toon-shaded film work such as *The Phantom Knowledge*. — [com.unity.toonshader](https://github.com/Unity-Technologies/com.unity.toonshader)
  - HoYoverse titles (Genshin Impact 2020, Honkai: Star Rail 2023, Zenless Zone Zero 2024): no first-party rendering talk could be verified this session. The HoYoverse GDC talks found were design talks: GDC 2024 "'Genshin Impact': Creating Time-Limited Open Worlds for Summer Events" (Terry Li) [GDC Vault](https://gdcvault.com/play/1034374/-Genshin-Impact-Creating-Time), and GDC 2025 "'Honkai: Star Rail': Reimagining RPGs for Mass Audiences and Broad Appeal" (Chengnan An) [GDC Vault](https://gdcvault.com/play/1035480/-Honkai-Star-Rail-Reimagining).
- **Cost/HW:** Mostly authoring cost: custom normals/tangents, mask textures and per-material ramps. Runtime is a few extra texture fetches per pixel. No figures found.
- **Scalability ladder:** UTS feature sets differ per pipeline, with the full set on HDRP and reduced sets on URP/Built-in. — [com.unity.toonshader](https://github.com/Unity-Technologies/com.unity.toonshader)
- **Web impl.:** none verified beyond `MeshToonMaterial`/`MeshToonNodeMaterial` (above).

#### 3. Deferred toon renderer with stylized post-process passes (Hi-Fi Rush, GDC 2024)
- **Mechanism:**
  - Tango built a *deferred* toon renderer that makes a 3D world look 2D, applying toon shading to characters and environments while "still using modern 3D graphics features".
  - The team customised Unreal Engine 4 render passes, added extra passes, then stylized and combined them in *deferred post-process volumes*. Artists can therefore vary the toon look per area through volumes rather than per material.
  - Listed components: toon lights, dynamic + static shadow maps, face shadows, light-probe GI, comic shaders.
  - — [GDC 2024, "3D Toon Rendering in 'Hi-Fi RUSH'", Kosuke Tanaka & Takashi Komada, Tango Gameworks](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
- **Shipped in:** *Hi-Fi Rush* (2023, customised UE4; the exact UE4 version is not stated on the session page). — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
- **Cost/HW:** The game holds **60 fps at native resolution** with this pipeline (per the session description; platforms not stated there). — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
- **Scalability ladder:** not described on the session page.
- **Web impl.:** none found.

#### 4. Inverted-hull (vertex-extrusion) outlines
- **Mechanism:**
  - Render a second copy of the mesh behind the original in a flat colour, with vertices pushed outward. Mask it either by culling front faces (depth test ≤) or with a stencil; the stencil variant gives no inner lines and merges the outlines of overlapping objects.
  - Extrusion choices: object-space position, normalised position, normal, normal baked into vertex colour, or *clip-space normal* (equal pixel width, scaled by screen size).
  - Plain normals leave gaps at hard edges. The fix is to author or bake smoothed normals into vertex colours (or tangents), which a script can automate.
  - — [Alexander Ameye, "5 ways to draw an outline" (Aug 2021)](https://ameye.dev/notes/rendering-outlines/)
- **three.js specifics:**
  - `OutlineEffect` (WebGL only) temporarily swaps each mesh's material for a `BackSide` ShaderMaterial. It extrudes along the (negated) normal *in clip space*, scaling by `pos.w` so width stays roughly constant with distance.
  - Defaults: thickness 0.003, black, alpha 1. Per-material overrides go in `material.userData.outlineParameters` (`thickness`, `color`, `alpha`, `visible`, `keepAlive`); cached outline materials are freed after 60 unused frames.
  - For `WebGPURenderer` the file points to `ToonOutlinePassNode`.
  - — [three.js OutlineEffect.js](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/effects/OutlineEffect.js)
  - `ToonOutlinePassNode` is a node-system inverted hull: a `BackSide` NodeMaterial extruded along negated normals, with `toonOutlinePass(scene, camera, color, thickness, alpha)` defaults black/0.003/1. It only outlines `MeshToonMaterial`/`MeshToonNodeMaterial`. — [ToonOutlinePassNode.js](https://github.com/mrdoob/three.js/blob/dev/src/nodes/display/ToonOutlinePassNode.js)
- **Shipped in:**
  - Genshin-style replication keeps custom tangents and ships a normal-averaging script plus an outlines shader, i.e. smoothed-normal inverted hulls. — [PrimoToon](https://github.com/festivities/PrimoToon)
  - The GGXrd and Hi-Fi Rush outline methods were *not* stated on the pages opened (see Gaps).
- **Cost/HW:** The mesh is drawn a second time: double vertex/skinning work and draw calls for every outlined object. Fill cost is small, since only a thin rim of pixels survives. — [Ameye](https://ameye.dev/notes/rendering-outlines/). No ms figures found.
- **Scalability ladder:** Typical drops are disabling outlines on distant or minor meshes and dropping per-vertex thickness control (inference; no source found).
- **Web impl.:** three.js `OutlineEffect` (WebGL) and `ToonOutlinePassNode` (node/WebGPU path). — [OutlineEffect.js](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/effects/OutlineEffect.js); [ToonOutlinePassNode.js](https://github.com/mrdoob/three.js/blob/dev/src/nodes/display/ToonOutlinePassNode.js)

#### 5. Screen-space edge detection (depth / normal / colour / ID buffers)
- **Mechanism:**
  - A full-screen pass finds discontinuities and draws lines where they exceed a threshold. Kernels: Roberts cross (2×2, 4 samples) or Sobel (3×3, 9 samples).
  - Sources: depth, normals and colour, each with its own weight and threshold, plus custom render targets (e.g. rendered vertex colours or object IDs) for per-object control.
  - Refinements: scale the depth threshold with scene depth, and mask edges at grazing angles with a fresnel term.
  - Downside: less per-object control unless a custom source is used, and tuning is needed to suppress unwanted lines.
  - — [Ameye](https://ameye.dev/notes/rendering-outlines/)
- **Shipped in:** no shipped-title confirmation was obtained this session (see Gaps).
- **Cost/HW:** One full-screen pass, 4 to 9 taps per source. Cost scales with resolution, not with object count. A normal/ID source needs an extra buffer (MRT or a separate pass). — [Ameye](https://ameye.dev/notes/rendering-outlines/) (taps); no ms figures found.
- **Scalability ladder:** Roberts instead of Sobel, depth-only instead of depth+normal, or half-resolution edge buffers (inference).
- **Web impl.:** see technique 6 for the pmndrs mask-based variant. No full-scene depth/normal Sobel implementation was verified this session.

#### 6. Mask / blurred-buffer selection outlines (with X-ray through occluders)
- **Mechanism (blurred buffer):** Render the selected objects' silhouettes to a buffer, blur it (box or Gaussian; downscale first; separable two-pass reduces O(N²) to O(2N)), then composite. Kernel size sets the width; stepping the blurred mask gives hard lines, while the raw blur gives glow. A stencil keeps the outline from drawing over the object. It "can have a larger performance impact" than the other methods. — [Ameye](https://ameye.dev/notes/rendering-outlines/)
- **Mechanism (pmndrs `postprocessing` OutlineEffect, WebGL):**
  - Each update renders a depth pass of the *non-selected* scene, then a mask pass of the selection layer with `DepthComparisonMaterial`, so the mask knows which selected pixels are occluded.
  - An edge-detection `OutlineMaterial` pass runs over the mask, with an optional Kawase blur.
  - `xRay` (default **true**) draws occluded parts of selected objects in `hiddenEdgeColor` (default `0x22090a`) versus `visibleEdgeColor`.
  - Other options: optional pulse animation (`pulseSpeed`), pattern texture, `edgeStrength`, and `resolutionScale` (default **0.5**, i.e. internal targets at half resolution). MSAA on the mask needs WebGL 2.
  - — [pmndrs/postprocessing OutlineEffect.js](https://github.com/pmndrs/postprocessing/blob/main/src/effects/OutlineEffect.js)
- **Shipped in:** no title-specific confirmation obtained this session (see Gaps).
- **Cost/HW:** Two extra scene renders (scene depth + selection mask) plus 1 to 2 full-screen passes; cheap when the selection is small and rendered at 0.5 scale. — [pmndrs OutlineEffect.js](https://github.com/pmndrs/postprocessing/blob/main/src/effects/OutlineEffect.js)
- **Web impl.:** pmndrs `postprocessing` OutlineEffect (above). three.js core also has an `OutlinePass` (mask + edge + blur), not opened this session.

#### 7. Jump Flood Algorithm (JFA) wide outlines
- **Mechanism:** JFA (Rong & Tan, i3D 2006) computes an *approximate* Voronoi diagram / distance transform of seed pixels on the GPU in "constant time". It does this through a fixed sequence of full-screen passes with halving step sizes (the log₂ pass count is a known property but was not stated on the source page). Errors relative to the exact result exist but are "hardly noticeable". **[Foundational 2006]** — [Rong & Tan, JFA project page](https://www.comp.nus.edu.sg/~tants/jfa.html)
- For outlines, seed the selection mask's edge pixels, run JFA, then shade pixels whose distance to the nearest seed is below the desired width. This gives arbitrarily wide, crisp outlines at a cost that grows with log(width) rather than width². — [Ameye](https://ameye.dev/notes/rendering-outlines/) describes JFA as giving wide outlines at "very reasonable" cost and defers to Ben Golus's article "The Quest for Very Wide Outlines" (2020, <https://bgolus.medium.com/the-quest-for-very-wide-outlines-ba82ed442cd9>). That article returned HTTP 403 and **its timings could not be verified**.
- **Shipped in:** none verified this session.
- **Cost/HW:** about log₂(max width in px) full-screen passes on a 2-channel (seed-coordinate) target; needs a float/integer render target to store coordinates (inference from algorithm structure).
- **Web impl.:** none verified this session.

#### 8. Rim / fresnel "outlines"
- **Mechanism:** `pow(1 − saturate(dot(N, V)), P)` brightens or darkens toward the silhouette. It is always an *inner* line, works on spheres and capsules, breaks on cubes and gives uneven widths on complex meshes ("simple but only work well on spherical objects"). — [Ameye](https://ameye.dev/notes/rendering-outlines/). In toon shaders the rim is usually masked by N·L and thresholded. — [Roystan](https://roystan.net/articles/toon-shader/)
- **Shipped in:** UTS3 exposes rim light as a standard toon feature. — [com.unity.toonshader](https://github.com/Unity-Technologies/com.unity.toonshader)
- **Cost/HW:** a few ALU ops per pixel; free compared with every other outline type.
- **Web impl.:** trivial in any three.js material via node or onBeforeCompile (no specific library verified).

### Inferences
- **Fit with a dark gothic, D2-like art direction:** a full anime cel pipeline (face SDF maps, angel-ring hair, hand-edited normals) is the wrong target. The transferable parts are:
  - authored shadow-colour ramps, e.g. cold desaturated shadows and warm torch-lit terminators, applied over painted or PBR albedo for value grouping;
  - Hi-Fi Rush-style area-wide stylization through post-process volumes, which an ARPG could use per zone (crypt vs. moor);
  - readability outlines.
- **Top-down/isometric relevance by technique:**
  - (1) Ramp shading: *relevant but subtle*. Characters cover roughly 60 to 200 px on screen, so ramps mainly matter for terrain and large props; the extra texture fetch is negligible.
  - (2) Face SDF shadows, angel rings, MatCap hair: *mostly irrelevant* at isometric zoom; skip them.
  - (3) Deferred stylized passes: *relevant* as a concept, because a global post-process toon/paint pass costs the same regardless of enemy count.
  - (4) Inverted hull: *risky with many enemies*, since it doubles skinned-mesh vertex work and draw calls. Use it only for the hovered target, the player or bosses. With an orthographic camera, clip-space extrusion gives exactly constant pixel width.
  - (5) Screen-space edges: *good fit*. Cost is fixed per frame, ortho depth is linear and easy to threshold, and an object-ID or "team" buffer gives readable silhouettes for every enemy at once.
  - (6) Mask outline with X-ray: *highly relevant*. In isometric views players and enemies constantly pass behind walls and pillars; an X-ray silhouette in a hidden-edge colour is the standard ARPG answer, and hover/target highlighting uses the same pass.
  - (7) JFA: *relevant for elite/boss auras or wide selection rings*, when a soft wide band reads better than a 1 to 2 px line.
  - (8) Rim: *relevant as a cheap hit/selection highlight* on round-ish creature silhouettes.
- **three.js feasibility hints (to be checked by the three.js researcher):**
  - Ramp shading: trivial on WebGL2 and TSL.
  - `OutlineEffect` swaps materials per mesh. Behaviour with `InstancedMesh`/`BatchedMesh`/skinned crowds needs checking before relying on it for hordes.
  - Screen-space edges need a normals/ID target: MRT on WebGL2 render targets, or `mrt()` in TSL.
  - JFA ping-pong passes need float/integer render targets (WebGL2: `EXT_color_buffer_float`; native in WebGPU).
  - Whether the pmndrs `postprocessing` library supports `WebGPURenderer` was not verified. A WebGPU build may need a custom TSL port of the mask + X-ray outline.
- **Synthesis for the report:** the cheapest high-value NPR subset for this game is: tinted ramp/shadow colour + rim highlight in the material, one global screen-space edge pass (depth plus an ID/team buffer), and a mask-based X-ray/selection outline for hovered and occluded actors. Per-mesh inverted hulls and anime face techniques are low value here.

### Gaps
- **Search outage:** the shared WebSearch budget for the turn was exhausted before this sub-task began. Every finding comes from direct fetches of URLs known in advance: GDC Vault, GitHub source, engine/tool docs and developer blogs. More searching is needed to close the items below. A later direct fetch of a guessed Game Developer URL for Motomura's GGXrd article also failed (it returned a section index).
- **HoYoverse rendering talks (Genshin 2020 / Honkai: Star Rail 2023 / Zenless Zone Zero 2024):** the GDC 2024/2025 HoYoverse talks found are design talks. No first-party rendering talk (e.g. a Unite/Unity China talk) could be located or verified. Commonly reported details remain **unverified this session**: per-material ramp rows for day/night, mask-texture channels selecting ramp rows/spec/AO, face shading via a threshold/SDF map indexed by light direction relative to head forward, screen-space depth-offset rim light.
- **Wuthering Waves (2024, UE):** not researched.
- **Guilty Gear Xrd specifics:** the GDC Vault page gives only title, speaker and goal. Widely circulated talk content is **unverified this session**: UE3 base, artist-controlled per-character light direction, hand-edited normals, vertex-colour channels for shadow-threshold bias and outline thickness, UV-aligned inner lines in textures ("Motomura lines"), stepped limited-frame animation.
- **Zelda BotW (2017) / TotK (2023):** the GDC 2017 "Change and Constant" talk (Dohta, Fujibayashi, Takizawa) exists ([GDC Vault](https://www.gdcvault.com/play/1024562/Change-and-Constant-Breaking-Conventions)), but its page does not describe the art style. CEDEC 2017 art-talk coverage could not be found without search. No TotK-specific rendering source was verified.
- **Hi-Fi Rush:** only the session abstract was available. The outline method, comic/halftone shader details, platforms and per-pass costs were not available.
- **Other 2023–2026 titles:** Granblue Fantasy Relink (2024), Dragon Ball Sparking! Zero (2024) and Metaphor: ReFantazio (2024) were not researched.
- **Ben Golus, "The Quest for Very Wide Outlines" (2020):** HTTP 403. Its brute-force vs blur vs JFA timings remain unverified.
- **Costs:** no millisecond costs for any outline or toon technique were found in sources that could be opened.
- **Shipped examples of full-scene depth/normal edge-detection outlines** (e.g. as often claimed for Borderlands) were not verified.
- **Diablo IV / Path of Exile 2 hover and occlusion outline implementations:** not verified (overlaps with the feedback/readability section).
- **three.js docs:** the `MeshToonMaterial` docs (gradientMap ramp details) and core `OutlinePass` were not opened; their existence comes only from source files referenced above.

## Stylized/NPR rendering, Part II: painterly, hand-painted + PBR, stylized PBR, pixel-art 3D

### Takeaway
Neither of the two 2023–2026 "painted" dark-fantasy ARPGs with public information uses an image-space painterly filter. Both get the painting from assets and art-directed lighting on a fixed camera:
- **No Rest for the Wicked:** hand-painted textures projected from concept art, plus Caravaggio-style chiaroscuro and heavy rim light, in a modified Unity.
- **Diablo IV:** a physically based deferred renderer with volumetric "lit air", steered toward old-masters / Frazetta / Brom art direction, with one deliberate non-physical exception ("negative light" for dark magic). Kuwahara-family painterly post filters are well understood and real-time on GPUs, including in WebGL, but I found **no verified shipped AAA game** that uses one. Pixel-art-in-3D (HD-2D, Dead Cells, t3ssel8r-style) is built from cheap raster tricks: low-res render targets, texel-snapped orthographic cameras with sub-pixel compensation, depth/normal edge outlines, and diorama post effects (tilt-shift DoF, bloom, fog). HD-2D shipped on the original Nintendo Switch.

### Cited Findings

#### 1. Painterly look from hand-painted assets + art-directed lighting: No Rest for the Wicked (Moon Studios)
- **Mechanism:**
  - Moon Studios' guiding principle is "painting comes to life". The team uses a heavily modified Unity build called **"Moonity"**: "We have source code access, so we build a lot of our own render pipelines" (Patrick Williams, gameplay tech lead). The custom rendering and lighting "mostly tie the assets together to produce the look we are after" (Daniel van Leeuwen) — [80.lv interview, 21 Apr 2026](https://80.lv/articles/interview-inside-the-tech-and-artistic-inspirations-of-no-rest-for-the-wicked-from-moon-studios)
  - **Lighting is the main stylisation lever:**
    - Caravaggio is the main reference for light, shadow and focused compositions. Environments draw on Shishkin, Kuindzhi and Levitan.
    - The team "moved away from PBR realism toward artistic expression and dramatic lighting".
    - **Rim lighting is used extensively**, following *Vagrant Story* cutscenes.
    - *Ori and the Will of the Wisps* influenced the final look.
    - Source: [80.lv](https://80.lv/articles/interview-inside-the-tech-and-artistic-inspirations-of-no-rest-for-the-wicked-from-moon-studios)
  - **Asset pipeline:**
    - The studio "value[s] handcrafted and painted assets", and 3DCoat is the main texture-painting tool.
    - For enemies the pipeline runs design doc → concept → model with "a focus on hand-painted textures". The textures are **projected from the concept art and polished for the in-game camera angle**.
    - Characters get "strong stylization rather than realistic proportions", e.g. larger hands so movement reads from a distance.
    - Source: [80.lv](https://80.lv/articles/interview-inside-the-tech-and-artistic-inspirations-of-no-rest-for-the-wicked-from-moon-studios)
  - The team deliberately avoided photorealism, believing it could dilute the game's identity. It also avoided cel shading because it wanted the game detailed and "immersive" — [Wikipedia](https://en.wikipedia.org/wiki/No_Rest_for_the_Wicked_(video_game)) citing [IGN "How No Rest for the Wicked's Gorgeous Art Direction Was Found"](https://www.ign.com/articles/how-no-rest-for-the-wickeds-gorgeous-art-direction-was-found-ign-first) (IGN page itself blocked).
  - The look was described as Caravaggio-inspired, with "strong contrasts of light and shadow and highly saturated colors" — [Wikipedia](https://en.wikipedia.org/wiki/No_Rest_for_the_Wicked_(video_game)) citing [FullTime GameDev podcast ep. 62](https://www.youtube.com/watch?v=dePFAcBLLpc)
- **Shipped in:**
  - Early access on Windows from **18 Apr 2024**. Played from a top-down camera; previews call it an "isometric action RPG". In June 2026 the 1.0 release was announced for October 2026 on PC/PS5, with Xbox Series and **Switch 2 later** (per the Gematsu headline). In September 2026 it was **delayed to March 2027**. Source: [Wikipedia](https://en.wikipedia.org/wiki/No_Rest_for_the_Wicked_(video_game)) citing [Gematsu (Jun 2026)](https://www.gematsu.com/2026/06/no-rest-for-the-wicked-launches-in-october-for-ps5-and-pc-later-for-xbox-series-and-switch-2) and [Gematsu (Sep 2026)](https://www.gematsu.com/2026/09/no-rest-for-the-wicked-delayed-to-march-2027)
- **Cost/HW:**
  - No frame budgets are published.
  - The fixed camera lets the team "predict what the player sees and optimize accordingly". It also helps lighting and art polish.
  - VFX are pooled ("Instead of spawning effects every time, we pre-load them and reuse them").
  - The world streams in visibility/distance-based chunks.
  - Simulating 4 players (including off-screen ones) was the main performance challenge.
  - Source: [80.lv](https://80.lv/articles/interview-inside-the-tech-and-artistic-inspirations-of-no-rest-for-the-wicked-from-moon-studios)
- **Scalability ladder:** No public details. A Switch 2 version is planned "later" (Gematsu headline above), which implies the look must scale to that hardware tier.
- **Web impl.:** None found.

#### 2. "Hand-painted feel" on standard 3D/PBR-era assets: Diablo IV (Blizzard)
- **Mechanism / art direction:**
  - The art aimed between *Diablo II* and *Diablo III*: D2's darkness combined with D3's "hand-painted feel" and medieval fine art — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV) citing [Eurogamer, Feb 2021](https://www.eurogamer.net/articles/2021-02-19-blizzard-on-the-rogue-and-how-diablo-4-pvp-works-within-the-open-world) (Eurogamer blocked)
  - Art director **John Mueller** cited the **old masters** and modern fantasy painters **Frank Frazetta and Gerald Brom** as inspirations — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV) citing [El País, 6 Jun 2023](https://english.elpais.com/culture/2023-06-06/diablo-iv-the-devil-is-in-the-details.html) (El País blocked)
  - Designer Jesse McCree said the aesthetic was inspired by heavy metal — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV) citing [PCGamesN](https://www.pcgamesn.com/diablo-4/exorcist)
  - For the first time in the series **all assets are standard 3D game assets and terrain has elevation**, which enables in-engine cinematics and environment interaction. The camera is overhead isometric — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV) citing [VentureBeat, Nov 2019](https://venturebeat.com/2019/11/02/blizzard-explains-how-diablo-iv-is-different-from-diablo-iii/) (the VentureBeat URL now returns 404)
- **Shipped in:** Diablo IV, 5 Jun 2023 (early access from 1 Jun). *Vessel of Hatred* expansion, 8 Oct 2024 — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV) citing [Blizzard news](https://news.blizzard.com/en-us/diablo4/23954935/diablo-iv-launches-soon-here-s-what-you-need-to-know)
- **Rendering model (primary source, Blizzard's graphics deep-dive):**
  - The look is "invitingly dark", tied to the gothic tones of the original games.
  - Technically it is **PBR**: the team "chose to ground our technology in real-world physics" and "only deviated from reality where it felt fitting for the game". The named exception is dark magic, which can pull light away from the world, a "negative light source" that does not exist in reality.
  - **Renderer:** deferred, with a custom many-light shadow system (static shadows cached, dynamic objects overlaid, work spread across frames).
  - **Air:** volumetric "lit air", including stained-glass windows that emit light into the air.
  - **Materials:** subsurface scattering on faces, so skin doesn't "look like plastic". Characters get wet in rain, dry indoors and become bloodied.
  - **Terrain:** terrain shaders blend many tileable textures, with virtual texturing to cut per-frame blending cost.
  - **Readability:** emissive elements on prop shaders "light up and draw attention to interactable objects".
  - — [Blizzard, "Peeling Back the Varnish: The Graphics of Diablo IV"](https://news.blizzard.com/en-us/article/23964183/)
  - **Conflict/nuance:** the deep-dive itself does **not** mention a painted look or old masters. Those art-direction claims come only from interviews (via Wikipedia, above). The "painted" quality is therefore an art-direction outcome on top of a physically based deferred renderer, not a separate NPR shading model.
- **Cost/HW, scalability ladder:**
  - PC: Low/Medium/High/Ultra presets plus manual tuning; a Resolution Percentage slider; upscalers including DLSS 3.
  - Ultra textures need the High-Resolution Assets pack and at least 32 GB of memory.
  - Consoles: Xbox Series X 60 fps at 4K, Series S 60 fps at 1440p, One X 30 fps at 1440p, One / One S 30 fps at 1080p.
  - — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)
- **Web impl.:** None found.

#### 3. Image-space painterly filters: Kuwahara family (classic → generalized → anisotropic) [Foundational: Kuwahara 1976 medical imaging; anisotropic 2009]
- **Mechanism:**
  - **Classic Kuwahara:** take an odd-sized square window around each pixel and split it into **4 overlapping quadrants**. Compute each quadrant's mean and standard deviation, and output the mean of the **lowest-variance quadrant**. Larger windows give more abstraction. Known artefacts are blockiness in textured regions and noise sensitivity. For colour, select the quadrant on brightness only — [Wikipedia: Kuwahara filter](https://en.wikipedia.org/wiki/Kuwahara_filter)
  - **Generalized (Papari):** a circular kernel with **8 sectors** and Gaussian weighting; Papari found 8 sectors the best quality/performance balance. **Polynomial weighting** (Kang et al.) replaces the Gaussian to save cost — [Maxime Heckel, "On Crafting Painterly Shaders", 29 Oct 2024](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/)
  - **Anisotropic (Kyprianidis, Kang, Döllner 2009):**
    - The kernel becomes **elliptical and rotated along the local edge direction**, derived from a smoothed **structure tensor**. The filter flattens regions along feature directions while keeping boundaries, giving "directional brushwork" — [Kyprianidis project page](https://www.kyprianidis.com/p/pg2009/); paper: *Computer Graphics Forum* 28:1955–1963 ([ResearchGate](https://www.researchgate.net/publication/220507613_Image_and_Video_Abstraction_by_Anisotropic_Kuwahara_Filtering))
    - Typical real-time structure is **multi-pass**: a structure-tensor pass (Sobel derivatives), then the Kuwahara pass, then a final tone/detail pass — [Heckel 2024](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/)
- **Shipped in:**
  - **No shipped game verified.** The Wikipedia article lists medical imaging, art photography, ML clustering and Blender, but no games or films — [Wikipedia](https://en.wikipedia.org/wiki/Kuwahara_filter)
  - Blender ships a Kuwahara compositor node — [Blender manual](https://docs.blender.org/manual/en/latest/compositing/types/creative/kuwahara.html)
  - Acerola (Garrett Gunnell) has a Unity 2021.3 built-in-pipeline repo with **Basic, Generalized and Anisotropic (polynomial-weighted) Kuwahara**. It also has Difference-of-Gaussians (basic/extended), depth edge detection and pixel-art effects. Each effect is a separate pass; the author says they "can be condensed into a singular pass" but are not production-ready — [GitHub GarrettGunnell/Post-Processing](https://github.com/GarrettGunnell/Post-Processing)
- **Cost/HW:**
  - The anisotropic paper claims "The GPU implementation of our method processes video in real-time" and "temporally coherent video abstraction without extra processing". The project page gives no frame times or GPU model — [Kyprianidis](https://www.kyprianidis.com/p/pg2009/)
  - Heckel reports Gaussian weighting is "quite expensive" inside the nested sampling loops ("costing us a lot of frames"), with polynomial weighting as the fix. At large kernel sizes the image "falls apart" — [Heckel 2024](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/)
  - Cost scales roughly with kernel area × sectors × pixels (my inference from the algorithm; no ms numbers found).
- **Scalability ladder:** No published ladder. My inferences are in the Inferences section.
- **Web impl.:** [Maxime Heckel (2024)](https://blog.maximeheckel.com/posts/on-crafting-painterly-shaders/) implements basic, Papari and anisotropic Kuwahara as GLSL post passes in **WebGL / React Three Fiber**, using the `postprocessing` library's `Pass` class: "a real-time 3D painting running in the browser".

#### 4. Arcane / Fortiche-inspired look (hand-painted 3D + 2D FX)
- **Mechanism:** Only review-level descriptions were verifiable: "a spectacular mix of 2D and 3D animation" (Rotten Tomatoes consensus), and "each frame looks like a gorgeous piece of hand-painted concept art" (The Verge) — [Wikipedia: Arcane](https://en.wikipedia.org/wiki/Arcane_(TV_series)). No technical pipeline description was found.
- **Shipped in (games):** **None verified.** The Arcane article lists only cross-promotions (Fortnite, PUBG Mobile, Among Us), not games adopting the visual style — [Wikipedia: Arcane](https://en.wikipedia.org/wiki/Arcane_(TV_series))
- **Cost/HW, scalability ladder, web impl.:** Not found.

#### 5. Hades II (Supergiant): painted 2D/3D look
- **Facts found:**
  - Jen Zee remained art director — [Wikipedia: Hades II](https://en.wikipedia.org/wiki/Hades_II) citing [Kotaku](https://kotaku.com/hades-2-release-date-early-access-chronos-melinoe-1849876057)
  - Release history: early access in May 2024 (Wikipedia gives 5 May; its cited Verge piece is dated 6 May); **1.0 on 25 Sep 2025 for Windows, Switch and Switch 2**; PS5/Xbox Series on 14 Apr 2026 — [Wikipedia](https://en.wikipedia.org/wiki/Hades_II) citing [Polygon](https://www.polygon.com/hades-2-release-date-switch-2-pc/) and [Gematsu](https://www.gematsu.com/2026/03/hades-ii-coming-to-ps5-xbox-series-on-april-14)
  - The IGN article cited there is titled (per its URL) as running at **120 fps in TV mode on Switch 2** — [IGN URL as cited by Wikipedia](https://www.ign.com/articles/hades-2-is-a-timed-console-exclusive-on-nintendo-switch-1-and-2-plays-at-120fps-in-tv-mode) (not opened)
  - The game is Lua-scripted, and its source code shipped in the game files — [Wikipedia](https://en.wikipedia.org/wiki/Hades_II)
- **Mechanism (3D-to-painted-2D pipeline):** **Not documented in any source I could open** (see Gaps).

#### 6. Stylized PBR (Fortnite and peers)
- **Facts found:**
  - Fortnite moved to **Unreal Engine 5 with Chapter 3 on 5 Dec 2021** — [Wikipedia: Fortnite Battle Royale](https://en.wikipedia.org/wiki/Fortnite_Battle_Royale)
  - The Switch version runs at **30 fps with reduced graphical fidelity** — [Wikipedia](https://en.wikipedia.org/wiki/Fortnite_Battle_Royale)
  - The style is described as "cartoon-like" — [Wikipedia](https://en.wikipedia.org/wiki/Fortnite_Battle_Royale)
- **Conflict / uncertainty:** I expected Chapter 4 (Dec 2022) to be when UE 5.1's Nanite/Lumen/Virtual Shadow Maps/TSR were enabled on PS5/XSX/PC. The Epic news page that would confirm this returned HTTP 403, and Wikipedia's fetched portion mentions only the Chapter 3 UE5 move. Treat the Chapter 4 feature list as **unverified**.
- **Valorant, Sea of Thieves, Overwatch, Clair Obscur: Expedition 33:** not researched (quota), see Gaps.

#### 7. Pixel art in 3D: HD-2D (Square Enix Team Asano + Acquire) [Foundational: Octopath Traveler 2018]
- **Mechanism:**
  - Pixel-art character **sprites/billboards inside fully 3D environments**.
  - A **point light** makes characters and objects cast shadows.
  - Post effects: **tilt-shift, depth of field, bloom, volumetric lighting and fog, particle effects**, combined with parallax scrolling.
  - Source: [Wikipedia: HD-2D](https://en.wikipedia.org/wiki/HD-2D) citing [RPGamer (2022)](https://rpgamer.com/2022/01/how-modern-pixel-art-rpgs-shine/) (RPGamer blocked)
  - Backgrounds are rendered entirely in 3D with complex camerawork, unlike traditional 2.5D — [Wikipedia: HD-2D](https://en.wikipedia.org/wiki/HD-2D) citing the [Unreal Engine Octopath Traveler II interview](https://www.unrealengine.com/en-US/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style) (UE page 403)
  - The Octopath developers tuned depth, resolution, saturation, and whether water should be pixel-style or photorealistic — [Wikipedia: Octopath Traveler](https://en.wikipedia.org/wiki/Octopath_Traveler) (uncited in the article; treat as weak)
- **Shipped in:**
  - *Octopath Traveler* (Switch, 13 Jul 2018) on **Unreal Engine 4**: Acquire's lead programmer said the team "relied heavily on Unreal Engine 4" — [Wikipedia: HD-2D](https://en.wikipedia.org/wiki/HD-2D) citing the [UE spotlight](https://www.unrealengine.com/en-US/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true); [Wikipedia: Octopath Traveler](https://en.wikipedia.org/wiki/Octopath_Traveler)
  - Other games:
    - *Octopath Traveler II*
    - *Triangle Strategy*
    - *Live A Live* remake
    - ***Dragon Quest III HD-2D Remake* (2024)**
    - ***Dragon Quest I & II HD-2D Remake* (2025)**
    - *Octopath Traveler 0* (launching 4 Dec, likely 2025)
    - Non-Square Enix look-alikes: *Wandering Sword* (2023) and *Eiyuden Chronicle: Hundred Heroes* (2024)
    - Source: [Wikipedia: HD-2D](https://en.wikipedia.org/wiki/HD-2D). The page did not state years for OT2, Triangle Strategy or Live A Live (commonly 2023/2022/2022; unverified here).
  - Square Enix trademarked "HD-2D" in January 2019 — [Wikipedia: HD-2D](https://en.wikipedia.org/wiki/HD-2D)
- **Cost/HW:** The full stack (DoF/tilt-shift, bloom, volumetric fog, shadows from sprites) shipped on the **original Nintendo Switch in 2018** — [Wikipedia: Octopath Traveler](https://en.wikipedia.org/wiki/Octopath_Traveler). No per-effect ms numbers found.
- **Scalability ladder:** Not published. The Switch-class origin is itself the low end.
- **Web impl.:** None found.

#### 8. 3D → pre-rendered pixel sprites with normal maps: Dead Cells (Motion Twin) [Foundational 2017–2018]
- **Mechanism:**
  - The character and skeleton are built in **3ds Max** from a 2D pixel model sheet and exported as FBX.
  - A **homebrew tool renders the mesh "in a very small size and without antialiasing"**. Characters are ~**50 px tall**.
  - Animation is keyframed pose-to-pose ("Never in-between").
  - **Each frame is exported as a PNG plus its normal map**. In game, a **basic toon shader uses the normal map** to render volume, and a lighting system handles shadows.
  - Source: [Thomas Vasseur, Game Developer, 25 Jan 2018](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)
- **Shipped in:** *Dead Cells* (Motion Twin). The pipeline descends from the earlier *ScarKrow* prototype, which ran its animations at 30 fps — [Game Developer](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)
- **Cost/HW:**
  - The bake is offline. At runtime the cost is only sprite drawing plus normal-mapped toon lighting.
  - Reported benefits: retakes "dozens of times in minutes", animation reuse across models, attaching armour to existing rigs, reusing parts of older sprites for new monsters.
  - Reported costs: "we still haven't found any solution for flickering pixels" (cel shading on low-res un-anti-aliased models), and limited detail.
  - Source: [Game Developer](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)
- **Scalability ladder:** Not discussed (sprite pipelines are inherently cheap).
- **Web impl.:** None found.

#### 9. Real-time 3D pixel art, t3ssel8r style (texel-snapped ortho camera, sub-pixel smoothing, pixel-scale outlines)
- **Mechanism (David Holland's reconstruction, custom Godot 4.3 build, inspired by t3ssel8r's Unity work):**
  - **Resolution and camera:**
    - Render at low resolution; the article tests at 640×360.
    - **"Snap the camera to a view-aligned, texel-sized grid"**. This removes pixel creep but makes motion choppy.
    - Then **"shift it back in screen space by the snap error, regaining smooth movement"** (sub-pixel camera smoothing).
  - **Outlines:** edge detection on the **depth and normal** buffers with a **4-texel (cross) kernel**, which keeps lines 1 px thick. Depth drives object outlines and normals drive **convex-edge highlights**, with per-scene heuristics.
  - **Lighting:**
    - Directional light attenuation is smoothed to cut shadow flicker, and noise is added to normals to stop shadow popping on flat surfaces.
    - **Cloud shadows** come from a noise texture exposed as a global uniform (`get_cloud_attenuation(world_pos)`).
  - **Grass:** billboard quads lit evenly to blend with terrain.
  - **Water:** refraction plus **orthographic planar reflections** via an oblique projection matrix.
  - **Particles and night:** rain/splash/dust particles are looping 2D textures made in Pixel Composer. Night is a light-colour change plus vignette and film grain.
  - Source: [David Holland, "3D Pixel Art Rendering", 24 Sep 2024, updated 26 May 2025](https://www.davidhol.land/articles/3d-pixel-art-rendering/)
- **Shipped in:** t3ssel8r's work is an unreleased Unity project (per Holland). Holland's is a personal Godot project. **No 2023–2026 commercial release verified** for this exact technique set.
- **Cost/HW:**
  - God rays were rewritten from instanced light-aligned planes to a **single fullscreen raymarch post-process at ≈1.7 ms on a GTX 1060 laptop**. The instanced version needed ~7 px blur radius × ≥10 planes and was too slow.
  - Many tree-leaf billboards are acceptable because few fit on screen with the fixed camera.
  - Source: [Holland](https://www.davidhol.land/articles/3d-pixel-art-rendering/)
- **Scalability ladder:** Not published. The low internal resolution is itself the main saving.
- **Web impl.:** None found for the full stack. Related non-web pieces: Acerola's Unity repo has pixel-art downsampling, dithering, palette swapping and an "anti-aliased pixel art upscaler" — [GitHub](https://github.com/GarrettGunnell/Post-Processing)

### Inferences
- **Painted ARPG look = assets + lighting, not a filter.**
  - Both 2023–2026 painted dark-fantasy ARPGs with sourced information (D4, NRftW) get the look from hand-painted or projected textures and art-directed lighting. That is the safest path for a three.js isometric ARPG.
  - In WebGL2 it costs essentially nothing beyond standard materials: painted albedo with baked light/AO cues in MeshStandard or MeshLambert, or a custom ShaderMaterial/TSL node with a stylised diffuse wrap and rim term.
  - NRftW's point that a **fixed camera lets you paint textures for the known viewing angle** applies directly to an isometric camera. Painted top-lit gradients, dirt and edge highlights can replace expensive runtime effects (AO, GI, specular detail).
- **Rim light as a readability tool:** NRftW's heavy rim lighting is a cheap fresnel/N·V term per material. It separates characters and enemies from dark gothic backgrounds, which is useful when many enemies crowd the screen. Feasible on both WebGL2 and WebGPU/TSL.
- **Kuwahara/painterly post for an ARPG: use cautiously.**
  - It smears small gameplay-critical detail (projectiles, telegraphs, enemy silhouettes) and costs roughly O(kernel area × sectors) per pixel.
  - If used, apply it **only to the environment layer** (render terrain/props first, filter, then composite characters, VFX and UI unfiltered), or as a low-strength stylisation.
  - WebGL2 can do classic or generalized Kuwahara in one fullscreen fragment pass. Anisotropic needs about 3 passes (structure tensor, blur, filter) with float render targets, which is fine in WebGL2.
  - On WebGPU a compute version could cache the neighbourhood in workgroup shared memory to cut texture fetches. That is an optimisation idea, not something found in a source.
  - Half-resolution filtering plus upsample would be the obvious scalability step. Expect stroke size to change with resolution, so tie kernel radius to output pixels.
- **Temporal stability matters more top-down.** The isometric camera pans constantly. Kuwahara's claimed temporal coherence (Kyprianidis) helps, but filters on noisy inputs (sparkly specular, dithered transparency) will shimmer. Feed it a stable, TAA-free or already-resolved image.
- **HD-2D-style diorama post is highly relevant to isometric cameras.**
  - Tilt-shift DoF keyed to screen-space depth or Y, bloom and height fog shipped on 2018 Switch hardware, so they are within WebGL2 budgets.
  - Tilt-shift reinforces the "miniature" read that top-down ARPGs already have, but it must not blur the playfield where enemies are. Keep the in-focus band wide around the player.
- **Sprites vs 3D enemies.**
  - Dead Cells' pipeline (3D → low-res sprites with per-frame normal maps → runtime toon lighting) is essentially a modernised version of how the original Diablo II pre-rendered its characters. That is my own historical inference and is not sourced here.
  - For "many enemies" it is the cheapest possible runtime path: instanced quads with normal-mapped lighting.
  - Downsides: 8- or 16-direction sprite sets cost texture memory, and the look clashes with a fully 3D, dynamically lit gothic environment unless done HD-2D-style.
- **Pixel-art 3D fits an orthographic isometric camera perfectly.**
  - Render to a low-res render target with nearest filtering.
  - Snap the camera to texel-size steps in view space, then offset the upscale blit by the snap remainder (Holland's method).
  - Draw outlines from depth and normal edges using a 4-tap kernel.
  - This needs a normal buffer (MRT): available in WebGL2 via multi-attachment render targets and in three.js WebGPU/TSL via MRT nodes. That is a feasibility inference, not deep-dived here. The approach is very cheap.
  - The low internal resolution also makes otherwise expensive effects affordable (≈1.7 ms raymarched god rays on a laptop GTX 1060).
- **Cloud shadows as a global noise uniform** (Holland) are a near-free trick that suits top-down cameras, where the ground fills the frame and the sky is barely visible.
- **Stylized PBR is compatible with a modern PBR pipeline.** Fortnite runs a cartoon look on UE5 and still ships a 30 fps reduced-fidelity Switch build. For three.js this suggests: keep MeshStandardMaterial (PBR) for lighting consistency and stylise through painted albedo, constrained roughness ranges, colour grading and rim light, rather than writing a fully custom NPR lighting model.
- **Scalability ladder proposal (inferred, not sourced):** painted textures + baked lighting cues + rim (all tiers) → add height fog, bloom and tilt-shift (mid) → add environment-only Kuwahara or other painterly post and volumetric light (high/WebGPU). The pixel-art route instead scales mainly by internal resolution.

### Gaps
- **Search quota:** WebSearch was exhausted (shared limit) before any query ran. All findings come from direct fetches of known URLs, so coverage is narrower than intended.
  - Several primary pages blocked the fetcher: IGN, Eurogamer, El País, unrealengine.com and fortnite.com returned "unable to fetch" or HTTP 403.
  - Claims labelled "via Wikipedia" are primary sources as cited inside a Wikipedia article. The primary pages themselves could not be opened.
- **Diablo IV:** Blizzard's deep-dive gives the renderer type, PBR stance, lit air, terrain blending, presets and console targets. Still unverified:
  - whether textures are hand-painted or photo-sourced;
  - the GI method;
  - the post chain;
  - any GDC/BlizzCon art-talk URLs. The primary interview pages were blocked or returned 404.
- **No Rest for the Wicked render pipeline:** the 80.lv interview does not disclose forward/deferred, GI, shadow technique, fog or post-processing, or frame budgets. Switch 2 scalability details are unknown.
- **Kuwahara in shipped games:** I found no shipped AAA (or verified indie) game using a Kuwahara or anisotropic-Kuwahara post filter, and no ms costs at 1080p/4K on any GPU. The Kyprianidis page states only "real-time".
- **Arcane/Fortiche pipeline and games emulating it:** the technical pipeline (3D with hand-painted textures, 2D FX overlays, animation on twos) and any 2023–2026 games adopting the look are unverified.
- **Not researched (quota):** Darkest Dungeon II (2023) look; Valorant, Overwatch and Sea of Thieves stylized-PBR specifics; Clair Obscur: Expedition 33 (2025).
- **Fortnite:** the Chapter 4 / UE 5.1 feature set per platform (Nanite, Lumen, VSM, TSR) is unverified because the Epic page returned 403. Wikipedia only confirms UE5 from Chapter 3 (Dec 2021).
- **Hades II:** whether it uses pre-rendered 3D→2D sprites like Hades or real-time 3D is undocumented in the sources opened.
- **HD-2D:** per-effect costs, engine versions for DQ3/DQ1&2 HD-2D (UE4 vs UE5) and release years for OT2, Triangle Strategy and Live A Live were not confirmed in fetched text.
- **t3ssel8r:** no first-party written description. The technique is documented through David Holland's reconstruction only.

## Feedback/readability VFX in action games (ARPG focus)

### Takeaway
Combat-feedback VFX are individually cheap. Hit flash, status tint, rim, outlines, damage numbers, telegraph decals, camera impulses and post-process pulses are each one per-instance material parameter, a depth/stencil mask, a projected decal or one merged full-screen pass. In a many-enemy ARPG the real problem is clarity. That needs a strict visual hierarchy and per-category intensity controls, kept within published accessibility limits:
- contrast of at least 3:1 or 4.5:1, and 7:1 in high-contrast mode;
- no more than about 3 flashes per second over about 20% or more of the screen;
- sliders for shake and blur;
- colour is never the only cue.

All of it can be built in three.js on WebGL2. None of it needs compute, ray tracing or mesh shaders.

### Cited Findings

#### 1. Hit flash, status tint and hit-stop
- **Mechanism:** (unsourced) On a damage event, the target's material is pushed toward white or red for a few frames. This is usually an emissive/additive term or an albedo lerp, driven by a per-object "last hit time" with a fast decay. It is often paired with hit-stop (attacker and victim animations frozen for a few frames) and knockback.
- **Diablo IV state shading:** Diablo IV extends this into character shaders that show gameplay state: "burning, poison, and stealth". Characters also get wet in rain, dry indoors and get bloodied during combat. Faces use subsurface scattering. — [Blizzard, "Peeling Back the Varnish: The Graphics of Diablo IV" (page shows no date)](https://news.blizzard.com/en-us/article/23964183/)
- **Shipped in:**
  - Diablo IV (June 2023) status-effect character shading — [Blizzard](https://news.blizzard.com/en-us/article/23964183/).
  - "Juice" foundations [Foundational 2013 / ~2012]: Jan Willem Nijman (Vlambeer), "The art of screenshake", INDIGO Classes 2013 — [YouTube](https://www.youtube.com/watch?v=AJdEqssNZ-U).
  - Martin Jonasson & Petri Purho, "Juice it or lose it" — [YouTube](https://www.youtube.com/watch?v=Fy0aCDmgnxg).
  - For both talks the fetched pages showed only title and speakers. The specific tips in each talk, and the year of "Juice it or lose it", are not verified.
- **Cost/HW:** (unsourced) One float or colour per instance plus a few ALU in the fragment shader, so negligible.
- **Scalability ladder:** (unsourced) None needed. On the lowest tier, a vertex-colour tint can replace the per-pixel flash.
- **Accessibility limit (applies to large or full-screen flashes):**
  - A "flash" is a luminance change of 10% or more, where the darker value is below 0.8.
  - It fails when flashes occur more than about 3 times per second and cover about 20% or more of the screen. Lower-intensity flashing can also fail if it lasts a long time.
  - Saturated-red flashes, where R/(R+G+B) ≥ 0.8, have a stricter test: a change in (R−G−B)×320 greater than 20.
  - Fixes: lower the contrast, the frequency or the size, or desaturate the red.
  - About 1 in 4,000 people are photosensitive. Test with the Harding FPA tool.
  - — [Microsoft XAG 118](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118)
- **Web impl.:** None fetched.

#### 2. Rim / fresnel highlight
- **Mechanism:** (unsourced) Add an emissive rim term, roughly `pow(1 − saturate(N·V), k) × colour`. It marks hit, hover, elite or "hero light" states, and separates a dark character from a dark floor without changing the scene lighting.
- **Shipped in:** The Diablo IV graphics article does not mention rim lighting, outlines, silhouettes, see-through when occluded, or wall cutaways — [Blizzard](https://news.blizzard.com/en-us/article/23964183/). So there is no verified Diablo IV claim here.
- **Cost/HW:** (unsourced) A few ALU per pixel.
- **Scalability ladder:** (unsourced) Per-pixel fresnel, then per-vertex fresnel, then a flat emissive tint.
- **Web impl.:** None fetched.

#### 3. Selection/hover outlines and occlusion ("X-ray") silhouettes
- **Mechanism (UE):** Unreal can render chosen objects into a separate **Custom Depth** buffer, optionally with a per-object **Custom Stencil** value from 1 to 255. A post-process material reads these to draw outlines or silhouettes, or to colour an object only where it is occluded. Epic's sample colours each stencil ID only in its occluded region. — [Epic docs, Post Process Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/post-process-materials-in-unreal-engine)
- **Cost/HW:**
  - Custom Depth "adds extra draw calls but no more materials" and is "fairly cheap as we only output depth".
  - An outline material at the end of the post chain jitters about 1 px under TAA. Epic recommends running it before tonemapping.
  - Post-process passes should be used sparingly and combined where possible.
  - — [Epic](https://dev.epicgames.com/documentation/en-us/unreal-engine/post-process-materials-in-unreal-engine)
- **Readability guidance:**
  - Outlining characters raises their contrast against the background.
  - Eagle Island offers "outline characters" and "outline platforms" (white outlines), plus a backdrop-dim slider that goes down to solid black.
  - For Honor's icons use a black inner outline plus a white outer outline, so they read on both dark and light backgrounds.
  - — [Microsoft XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
- **Shipped in:** This is a core UE engine feature. Specific 2023–2026 titles were not verified this session.
- **Scalability ladder:** (unsourced) Post-process outline from a depth/stencil mask, then inverted-hull outline, then rim highlight only.
- **Web impl.:** The pmndrs `postprocessing` library ships an Outline effect. Its `EffectPass` merges effects into a single pass — [GitHub](https://github.com/pmndrs/postprocessing). The wide-outline jump-flood write-up by Ben Golus could not be fetched (HTTP 403); the stylized-rendering section covers outlines in depth.

#### 4. Damage numbers
- **Mechanism:** (unsourced) Each hit spawns a pooled, camera-facing text quad anchored to the target, animated with rise, scale and fade. Crits get a larger size and different colour. Rapid ticks are merged or summed per target. Games usually offer settings such as Off / Crits only / All.
- **Legibility thresholds (directly applicable):**
  - Standard-size text and gameplay-critical visual elements need at least 4.5:1 contrast against their background.
  - Large text needs at least 3:1. "Large" means 36 px at 1080p on PC, or 52 px at 1080p on console.
  - A high-contrast mode should reach at least 7:1.
  - Over a non-solid background, measure against the lowest-contrast area.
  - Recommended fixes are a solid or opacity-adjustable backing behind the text, or borders/outlines on it.
  - — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
  - Opacity-adjustable text backing is also recommended when gameplay moves behind the text — [XAG 117](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117).
- **Cost/HW:** (unsourced) Dominated by draw calls and CPU work for spawning and pooling. See Inferences for a one-draw-call design.
- **Scalability ladder:** (unsourced) Fewer numbers (merge or crits-only), shorter lifetime, no per-glyph outline.
- **Web impl.:** `troika-three-text` renders SDF text in three.js.
  - It parses .ttf/.otf/.woff fonts with Typr and builds the glyph SDF atlas on the fly in a web worker, GPU-accelerated through WebGL by default.
  - It patches any three.js material, so lighting and fog still apply.
  - It requires `sync()` after layout changes and `dispose()` when done.
  - — [GitHub](https://github.com/protectwise/troika/tree/main/packages/troika-three-text)

#### 5. Telegraph / AoE ground indicators and persistent ground hazards
- **Mechanism — projected box decal (Unity URP):**
  - Projector settings: box size (width, height, projection depth), opacity, draw distance, start fade, and angle fade (fades by the angle between the decal direction and the receiving surface normal).
  - **DBuffer technique:** decals are written to a decal buffer and applied during opaque shading. They can carry albedo, normal, and metallic/smoothness/AO. It requires a DepthNormal prepass, which is less efficient on tile-based GPUs, and does not affect particles or terrain details.
  - **Screen Space technique:** decals are drawn as meshes after opaques, with normals reconstructed from depth using 1, 3 or 5 samples (Low/Medium/High). It is recommended for tile-based mobile GPUs.
  - Limits: no projection onto transparent surfaces, and no SRP Batcher support. GPU instancing and decal atlases reduce draw calls and material count.
  - — [Unity URP 14 docs, Decal Renderer Feature](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-feature-decal.html)
- **Mechanism — mesh-clipped decal (three.js):** `DecalGeometry` clips the target mesh's triangles against an oriented box on the CPU and generates UVs from projector-space XY. From the source code:
  - it is built once in the constructor;
  - it tests every triangle of the target, with no spatial culling;
  - it allocates many per-vertex objects.
  - The page warns that projections distort around corners.
  - — [three.js source](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/geometries/DecalGeometry.js)
- **Ground-hazard look (Diablo IV):** Mists, fire and poison pools are built by procedurally combining tiling noise textures, distorted by 2D directional-data textures, instead of frame-by-frame flipbooks — [Blizzard](https://news.blizzard.com/en-us/article/23964183/).
- **Colour/shape conventions:**
  - Never carry essential information by colour alone. Pair it with shape, pattern, symbol or text.
  - Red appears darker to many colour-deficient players.
  - Offer colour customisation, with presets for deuteranopia, protanopia and tritanopia, ideally plus a custom option. Whole-palette filters are a blunt last resort.
  - For a two-way distinction (e.g., friend/foe), orange vs blue works for the most common deficiencies.
  - Red/green deficiency affects about 8–10% of males.
  - — [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-colour-alone/)
  - XAG warns against red/green targeting cues. It cites Battlefield 2042's custom colour pickers, which are previewed in shadowy, midtone and bright scenes — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102).
- **Incoming-attack cue:** Immortals Fenyx Rising shows a white, black-outlined directional arrow pointing at an enemy that is readying an attack — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102).
- **Shipped in:** Projected decals are standard in UE and Unity. Specific ARPG/MMO telegraph implementations (fill-progress timing, colour codes) were not verified this session; see Gaps.
- **Cost/HW:** (unsourced) One decal or quad draw per telegraph, at fill-rate cost over its screen area. DBuffer adds a prepass cost per the Unity doc above.
- **Scalability ladder:** (unsourced) Box decal with normals, then a ground-aligned SDF quad, then a flat ring outline only.
- **Web impl.:** `DecalGeometry` (above). No WebGPU decal examples were fetched.

#### 6. Screen shake / camera impulses
- **Foundations:**
  - Squirrel Eiserloh (SMU Guildhall), "Math for Game Programmers: Juicing Your Cameras With Math", GDC 2016 Programming track. It covers framing, kinds of smoothed motion, camera shake and dynamic split-screen. — [GDC Vault](https://www.gdcvault.com/play/1023557/Math-for-Game-Programmers-Juicing) [Foundational 2016]
  - The widely reproduced "trauma" model is attributed to this talk: trauma from 0 to 1 accumulates on hits and decays; shake = trauma² or trauma³; smooth Perlin noise drives offset and rotation. **Not verified**, because the vault page does not describe it.
  - Vlambeer, "The art of screenshake" [Foundational 2013] — [YouTube](https://www.youtube.com/watch?v=AJdEqssNZ-U).
- **Engine pattern (Unity Cinemachine Impulse):** An Impulse Source emits a signal from a point in space that propagates outward. The signal has a direction and a strength-over-time curve. An Impulse Listener extension on the camera reacts by shaking. — [Unity Cinemachine 3.1 docs](https://docs.unity3d.com/Packages/com.unity.cinemachine@3.1/manual/CinemachineImpulse.html). The fetched page does not describe distance attenuation.
- **Accessibility:**
  - "Avoid the use of camera shake, camera bobbing effects, motion blur… or provide an option to turn off these behaviors."
  - Halo Infinite lets players set radial blur, screen shake, full-screen effects and speed lines separately, each on a 0–100% slider.
  - Cyberpunk 2077 scales "additive camera motions".
  - — [XAG 117](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117)
- **Cost/HW:** (unsourced) CPU only: a camera-transform offset each frame.
- **Scalability ladder:** None needed. A user slider is required for accessibility.
- **Web impl.:** None fetched.

#### 7. Chromatic aberration / radial blur / vignette / shockwave pulses
- **Mechanism:** (unsourced) Time-limited post-process parameters pulsed on heavy hits, ultimates, boss slams or low health:
  - radial chromatic offset that grows toward the screen edges;
  - radial blur centred on the impact point;
  - vignette darkening or tint for low health;
  - a screen-space distortion ring for shockwaves.
- **Web impl.:** The pmndrs `postprocessing` library provides ChromaticAberration, Noise, Vignette, ShockWave (with depth picking), Bloom, Outline, God Rays and LUT, among others.
  - `EffectPass` "organizes and merges any combination of effects", which reduces render operations.
  - Full-screen passes use a single screen-covering triangle.
  - HalfFloat buffers are recommended for HDR.
  - The page does not state WebGPU support.
  - — [GitHub](https://github.com/pmndrs/postprocessing)
- **Accessibility:** Radial blur and "full screen effects" are examples of effects that should get an intensity slider (Halo Infinite) — [XAG 117](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117). Red low-health pulses fall under the red-flash rule — [XAG 118](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/118).
- **Cost/HW:** (unsourced) A few extra ALU inside an existing merged full-screen pass.
- **Scalability ladder:** (unsourced) Drop chromatic aberration and radial blur first, keep the vignette.

#### 8. Elite/champion auras and affix VFX
- **Mechanism:** (unsourced) A stacked identity signal:
  - a ground ring or decal under the monster;
  - a body tint, rim or emissive pulse;
  - a particle aura;
  - nameplate or health-bar colour plus affix icons;
  - larger scale.
  - Affix hazards (for example, frozen or poisoned ground) reuse the ground-telegraph language.
- **Shipped in:** The only verified data point is Diablo IV's shader-level status states (burning, poison, stealth) — [Blizzard](https://news.blizzard.com/en-us/article/23964183/). Specific Diablo IV elite-affix visuals and PoE1/PoE2 rare-monster aura visuals were not verified; see Gaps.
- **Cost/HW / ladder:** (unsourced) Cost scales with how many elites are on screen. Particle auras are the expensive part; tint, rim and decal are cheap.

#### 9. VFX clarity and density controls (multiplayer, crowded screens)
- **Per-effect sliders:** Halo Infinite has separate 0–100% sliders for radial blur, screen shake, full-screen effects and speed lines — [XAG 117](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117).
- **Background de-emphasis:** Eagle Island combines a backdrop-dim slider with character outlines — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102).
- **WoW:** The Warcraft Wiki page for Patch 10.0.0 (Dragonflight pre-patch, released October 25, 2022) does **not** list a "Spell Density"/spell-visibility setting — [Warcraft Wiki](https://warcraft.wiki.gg/wiki/Patch_10.0.0). The patch that introduced WoW's spell-density option remains unverified.
- **Diablo IV scalability context:** The graphics deep-dive does not discuss VFX budgets, overdraw or half-res transparency.
  - PC: Low/Medium/High/Ultra presets plus custom, a Resolution Percentage slider, and DLSS 3. Consoles combine upscaling with dynamic resolution.
  - Xbox targets: Series X 60 fps at 4K, Series S 60 fps at 1440p, One X 30 fps at 1440p, One / One S 30 fps at 1080p.
  - — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)

#### 10. Readability principles (value contrast, hierarchy, dark palettes)
- **High-contrast mode intent:** XAG says its true intent is to increase (1) the visibility of important elements, (2) separation between different types of important elements, and (3) separation between important and unimportant elements. UI elements in that mode should reach at least 7:1. — [XAG 102](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/102)
- **Colour redundancy and customisation:** see item 5 — [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-colour-alone/).
- **Diablo IV's dark gothic direction (closest reference for this project):**
  - "Invitingly dark", with gothic tones echoing D1 and D2.
  - PBR, except dark magic, which can "pull light away from the world".
  - Volumetric air: "we modeled the air, so that particles in the air are lit". Stained-glass windows emit light into the air.
  - This replaces older sprite and layered-image dust fakes, which the article calls "primitive".
  - A deferred renderer with a custom many-light shadow system: static-geometry shadows are cached and dynamic objects layered on top, with shadow work spread across frames.
  - — [Blizzard](https://news.blizzard.com/en-us/article/23964183/)

### Inferences
- **Visual hierarchy for a dark gothic, many-enemy ARPG.** Assign brightness, saturation and motion in this priority order:
  1. enemy danger telegraphs;
  2. the player character;
  3. enemies (elite above normal);
  4. the player's own spell VFX;
  5. allies' spell VFX;
  6. ambient VFX.

  A dark base palette, as in Diablo IV, leaves headroom for this. Reserve the brightest values and one hue family exclusively for danger. This follows the XAG 102 high-contrast intent (separate important element types from each other and from unimportant ones).
- **Hit flash (high relevance, trivial cost).** Enemies are small on screen in an isometric view, so a strong, short flash plus a scale "punch" reads better than subtle shading.
  - Store `lastHitTime` and `hitColor` per instance: an `InstancedBufferAttribute` on WebGL2, or a storage buffer on WebGPU/TSL.
  - Compute the decay in the shader from a global time uniform. The CPU then only writes on hit events, and there is no per-frame upload.
  - Keep full-screen white flashes for rare events, because frequent full-screen flashing breaks the XAG 118 limit (more than 3 per second over 20% or more of the screen).
- **Hit-stop.** A global time freeze on every hit would stutter a screen with 100+ enemies. Prefer per-entity micro hit-stop (only the struck target and the attacker's swing pause briefly), or global hit-stop only on crits and elite/boss kills. Exact frame counts used by shipped games are unverified.
- **Rim/fresnel.** At high camera pitch the view vector hits mostly heads and shoulders. An N·V rim still lights side silhouettes, but a screen-space outline gives a steadier silhouette at any pitch. Both are trivial in three.js (`onBeforeCompile` or TSL nodes) on WebGL2.
- **Occlusion silhouettes and hover outlines (very high relevance).** Walls, pillars and arches in isometric dungeons hide the hero and enemies.
  - Cheapest X-ray: draw the hero a second time after the world, with `depthFunc = GreaterDepth`, a flat or fresnel material and depthWrite off. That is one extra draw and no post-process.
  - Hover/target outlines: render a stencil or mask target, then add an edge-detect step to the existing final post pass. three.js materials expose stencil ops; the renderer needs `stencil: true`.
  - Jump-flood wide outlines (log2(width) ping-pong passes) work on WebGL2 but are only worth it for outlines wider than a few pixels.
- **Damage numbers (biggest clutter source).**
  - Aggregate per target over 100–200 ms windows, cap the number visible on screen, scale size by significance, and offer Off / Crits / All.
  - Implementation: a glyph atlas (0–9, k, M, %, !) on one instanced quad mesh, with per-instance value, colour and spawn time, animated entirely in the vertex shader. That is one draw call for thousands of numbers.
  - troika-three-text suits UI text but is a poor fit for hundreds of short-lived numbers, since each instance is its own mesh with an async sync.
  - Give glyphs a dark SDF outline or shadow to meet roughly 4.5:1 contrast on any floor.
- **Telegraphs (the most genre-critical technique).** A top-down camera makes ground indicators the main combat language.
  - **Cheapest:** a ground-aligned quad per telegraph whose shader draws SDF shapes (circle, cone, line, ring, donut). Fill = elapsed / castTime, with a crisp, brighter edge and an edge pulse just before impact. No depth reads, and it can be instanced.
  - **Uneven terrain or stairs:** a box decal that reconstructs position from the scene depth texture. On WebGL2 that needs a `DepthTexture` on the opaque render target; on WebGPU, TSL depth nodes.
  - **Alternative for many telegraphs:** splat them into a top-down "ground overlay" render target that the terrain shader samples once.
  - Avoid `DecalGeometry` for transient telegraphs (CPU clipping, GC churn). Use it only for static, persistent decals.
  - Draw order: above blood and scorch decals, below characters.
  - Colour and redundancy: enemy telegraphs in one reserved hue family (orange/red) with an animated edge pattern; ally/self effects in blue, cyan or white. Shape and animation must carry meaning by themselves for colour-blind players.
  - Avoid large saturated-red full-screen pulses (XAG 118 red-flash rule).
  - Persistent hazards (poison pools, burning ground) can follow Diablo IV's procedural tiling-noise-plus-flow approach. That is cheaper than flipbooks and avoids repetition.
- **Screen shake.**
  - With an isometric or orthographic camera, apply shake in the screen plane (camera right/up) plus a tiny roll. Moving along the view axis does nothing in ortho.
  - For heavy hits, a zoom punch (a brief ortho zoom) gives a "kick".
  - Use trauma accumulation with clamping so 20 simultaneous explosions do not stack into chaos. Use smooth noise, not white noise, and attenuate by distance from the player.
  - Expose a 0–100% slider (XAG 117).
- **Chromatic, radial and vignette pulses.** Fold these as uniforms into the lab's existing final post shader, so there is no extra pass (`final.frag.glsl` already exists in `lookdev-lab/src/shaders/post`).
  - Keep them for rare events: boss slam, ultimate, near death.
  - Pulse the low-health vignette below about 1–2 Hz, and avoid saturated-red full-screen swings.
- **Elites and champions in crowds.** Use several channels at once: about 10–30% larger scale, a unique rim or emissive pulse, an instanced ground ring decal, and a nameplate with affix icons.
  - Use a hue distinct from boss telegraphs for affix hazards.
  - Budget particle auras by the number of elites on screen, scaling down spawn rate as the count grows.
- **Clarity controls to build in from day one.**
  - Tag every emitter, decal and post pulse with an owner: self, party, enemy or environment.
  - Expose per-tag opacity and spawn-rate multipliers, plus "screen shake", "flashing" and "full-screen effects" sliders, following the Halo Infinite pattern in XAG 117.
  - Enemy telegraphs are always exempt from reduction.
- **Feasibility summary.** Every technique here runs on WebGL2 with standard three.js features: instanced attributes, stencil, depth textures and one post pass. WebGPU/TSL helps optionally (storage buffers for per-instance hit state, compute-driven damage-number or aura particles) but is not required. Nothing needs hardware RT or mesh shaders.

### Gaps
- **No web searches ran for this section.** The shared WebSearch budget for the turn was already exhausted, so only directly fetched primary pages were used. The following remain **unverified**:
  - **WoW spell density.** Which patch introduced it and its option names. The Patch 10.0.0 page does not list it.
  - **FFXIV "Battle Effects" settings** (Self / Party / Others: Show All / Limited / None). The wiki fetch returned 403.
  - **Ally-effect opacity and damage-number options** in Lost Ark, Last Epoch, Path of Exile 2 and Diablo IV, plus Diablo IV elite-affix visuals and PoE rare-monster aura visuals.
  - **GDC/studio talks on VFX readability:** Riot League of Legends VFX clarity guidelines, Overwatch, Hades/Hades II, Diablo IV and PoE2 (2023–2025). None could be located without search.
  - **Eiserloh's trauma model** (trauma², Perlin noise, rotational vs translational shake). The GDC Vault page confirms only that camera shake is covered.
  - **Content and year of the Vlambeer and "Juice it or lose it" talks.** The YouTube pages exposed only titles and speakers.
  - **Hit-stop frame counts and conventions** (for example, Masahiro Sakurai's videos on hitstop). Not located.
  - **Ben Golus, "The Quest for Very Wide Outlines"** (JFA). Medium returned 403, so its timing numbers are not captured.
- **No GPU timings were found** for telegraph decals, stencil outlines or damage-number rendering on any specific hardware.
- **No WebGPU/TSL-specific implementations** of these feedback effects were fetched.
- **About "(unsourced)" tags:** items tagged **(unsourced)** in Cited Findings describe standard industry practice that could not be verified this session. They are kept there only to complete the per-technique template and should be treated as inferences.


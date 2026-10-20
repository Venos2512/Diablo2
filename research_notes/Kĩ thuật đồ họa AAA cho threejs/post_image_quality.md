# Post-processing ("beautification"), colour pipeline & image quality in AAA games 2024–2026 — technique notes for an isometric dark-fantasy ARPG on three.js (WebGL2 / WebGPU-TSL)

Source legend used throughout: **[V]** = page fetched/verified in this session; **[S]** = secondary press/community coverage seen via search-result summaries (treat numbers as reported, not independently checked); **[M]** = canonical/foundational source cited from prior knowledge, URL not re-fetched this session (spot-check before quoting). The shared web-search budget ran out partway through the session, so some planned lookups (HGIG, tilt-shift game examples, DLSS cost tables, Path of Exile 2 settings, Godot AgX) were not done. They are listed under Gaps. "Iso-ARPG" = relevance for a top-down/isometric Diablo-like with low-key lighting and heavy emissive spell VFX.

---

## Q1. Colour pipeline: scene-referred linear workflow, working colour spaces, HDR intermediates (RGBA16F / R11G11B10), HDR10/scRGB output & paper white, banding/dithering

### Takeaway
AAA pipelines light, blend and grade in scene-referred linear RGB (mostly Rec.709 primaries), keep the frame in a float HDR target until one display-rendering step at the end (exposure → tonemap → grade/LUT → encode), then output SDR sRGB or HDR (scRGB FP16 / HDR10 PQ) relative to a user-set reference ("paper") white. Dithering before 8-bit quantization is effectively mandatory for dark gradients. All of this ports to WebGPU, and Chromium even exposes real HDR canvas output.

### Cited Findings
**Scene-referred linear vs display-referred stages**
- In UE, the parametric colour-grading controls (Global / Shadows / Midtones / Highlights × Saturation, Contrast, Gamma, Gain, Offset) "do their work in Scene Referred Linear Space" before tonemapping. LUT-based colour correction, by contrast, "happens in LDR and on the final color that was output to the monitor in sRGB color space" — [V] [UE docs: Color Grading and the Filmic Tonemapper](https://dev.epicgames.com/documentation/en-us/unreal-engine/color-grading-and-the-filmic-tonemapper-in-unreal-engine)
- Windows' HDR composition space (CCCS) is scRGB: BT.709/sRGB primaries, linear gamma, IEEE FP16. Values may go outside [0,1], and FP16 can represent luminance "over 5 million nits" — [V] [Microsoft Learn: DirectX Advanced Color / HDR](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/high-dynamic-range)
- Khronos PBR Neutral assumes Rec.709 gamut for inputs and lighting "as in glTF" and applies no gamut mapping. It only outputs to sRGB. This shows that the glTF/web ecosystem is Rec.709-linear by default — [V] [KhronosGroup/ToneMapping PBR_Neutral README](https://github.com/KhronosGroup/ToneMapping/blob/main/PBR_Neutral/README.md)

**Working colour spaces (Rec.709 vs ACEScg / Rec.2020)**
- The ACES 2.0 Output Transforms do their gamut mapping in a modified **Hellwig 2022** colour-appearance model, using the correlates J (lightness), M (colourfulness) and h (hue). The compression is designed to be invertible — [V] [ACES docs: gamut compression](https://draftdocs.acescentral.com/output-transforms/technical-details/gamut-compression); [ACES docs: what's new](https://draftdocs.acescentral.com/background/whats-new)
- OpenColorIO 2.4 ships ACES 2 built-in transforms but labels them a preview ("work-in-progress that is not yet ready for production use") — [V] [OCIO 2.4 release notes](https://opencolorio.readthedocs.io/en/latest/releases/ocio_2_4.html)
- No verified source was found on which 2024–2026 games use an ACEScg or Rec.2020 *working* space. See Gaps.

**HDR intermediate formats**
- An FP16 (R16G16B16A16_FLOAT) swapchain "consumes 64 bits per pixel, which doubles GPU bandwidth and memory consumption" compared with 8-bit. The HDR10 alternative (R10G10B10A2_UNORM + ST.2084/BT.2020) costs 32 bpp but only applies to D3D11/12, an HDR display, and no alpha blending in the swapchain — [V] [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/high-dynamic-range)
- R11G11B10 is commonly used where alpha isn't needed. LearnOpenGL's COD:AW-style bloom stores its mip chain as `GL_R11F_G11F_B10F` "because no alpha channel is needed" — [V] [LearnOpenGL: Physically Based Bloom](https://learnopengl.com/Guest-Articles/2022/Phys.-Based-Bloom). UE TSR exposes `r.TSR.History.R11G11B10` to store history in that format — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)
- R11G11B10F layout is a 5-bit exponent with 6-bit mantissas for R/G, a 5-bit mantissa for B, and **no sign bit**. That means less precision than FP16 and possible hue drift and banding in dark tones — [M] [EXT_packed_float spec](https://registry.khronos.org/OpenGL/extensions/EXT/EXT_packed_float.txt)
- Web specifics: WebGL2 needs `EXT_color_buffer_float` to render into float formats — [M] [WebGL EXT_color_buffer_float](https://registry.khronos.org/webgl/extensions/EXT_color_buffer_float/). In WebGPU, `rgba16float` is renderable, but `rg11b10ufloat` only becomes renderable with the optional `"rg11b10ufloat-renderable"` feature — [M] [WebGPU spec](https://www.w3.org/TR/webgpu/)

**HDR10 / scRGB output and paper white**
- On HDR displays, scRGB 1.0 = 80 nits (nominal reference white). On SDR "Advanced Color" displays, 1.0 = the display's reference white. scRGB (12.5,12.5,12.5) = 1000 nits — [V] [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/high-dynamic-range)
- "Your HDR app must allow the user to either set their desired reference white level, or to read the value configured by the system." SDR content and UI should be multiplied by `SdrWhiteLevelInNits / 80` in linear space. "On desktop HDR monitors, SDR reference white levels are typically set to around 200 nits" — [V] [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/high-dynamic-range)
- HDR tonemapping must adapt to the display's colour volume. "The most important single parameter to adapt for is max luminance." Microsoft names ACES Filmic, Reinhard and **ITU-R BT.2390-3 EETF** as common HDR tonemappers — [V] [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/high-dynamic-range)
- **Web HDR output**: Chrome 129 (2024) added a WebGPU canvas `toneMapping` setting. "standard" (the default) clamps to SDR. "extended" preserves values >1.0 on HDR displays. The example configures the canvas with `format: "rgba16float"` and `toneMapping: { mode: "extended" }` — [V] [Chrome for Developers: What's New in WebGPU 129](https://developer.chrome.com/blog/new-in-webgpu-129)
- In UE 5.8, a user on Epic's forum reports a split workflow: "Film" tonemapper for SDR and "Standard ACES" for HDR. HDR cvars such as `r.HDR.Aces.SceneColorMultiplier` only take effect with Standard ACES (user report, not official docs) — [V] [Epic forum: TonemappingMethod](https://forums.unrealengine.com/t/tonemappingmethod/2747218)

**Banding and dithering**
- Mainstream displays are 8-bit per channel, while "the human eye requires at least 10-12 bits of precision to avoid perceivable distortions" — [V] [Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/direct3darticles/high-dynamic-range)
- Playdead's (INSIDE) "Banding in Games: A Noisy Rant" (2016) is the reference for adding noise before quantization, recommending triangular-distributed noise of about ±1 LSB — [M] [Gjøl, loopit.dk PDF](http://loopit.dk/banding_in_games.pdf). Free blue-noise textures for dithering: [M] [Christoph Peters, Free blue noise textures](http://momentsingraphics.de/BlueNoise.html)
- Modern open engines do the dither in the tonemapping pass. Bevy's `Tonemapping::None` "bypasses tonemapping, so no color grading, exposure, or dither is applied", which implies all three live in that pass — [V] [Bevy Tonemapping docs](https://docs.rs/bevy/latest/bevy/core_pipeline/tonemapping/enum.Tonemapping.html)
- Jimenez's Interleaved Gradient Noise (COD: Advanced Warfare, 2014) gives cheap per-pixel noise that is temporally stable. It was used to rotate shadow-filter samples — [V] [iryoku.com: Next-Gen Post Processing in COD:AW](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare)
- Enthusiast opinion: film grain "when done right could reduce/eliminate color banding" — [S] [Patreon post on visual clarity settings](https://www.patreon.com/posts/83362050)

### Inferences
- For a web ARPG, keep lighting in **linear Rec.709** (the three.js/glTF native space). An ACEScg working space buys little for an SDR-first game and complicates authoring. Use an RGBA16F scene target. Use R11G11B10 only for bloom/blur mips, and only where it is renderable (feature-gated on WebGPU).
- Low-key gothic scenes are full of large, smooth dark gradients (fog, vignette, night ground) that will band in 8-bit. A blue-noise or IGN dither of about ±1 LSB in the final pass costs almost nothing and should be on by default. If film grain is used, it can double as the dither.
- HDR output pays off most for emissive spells. Chromium's WebGPU "extended" canvas makes real HDR possible. If offered, it needs paper-white and peak-brightness sliders, and the UI should be composited at paper white (per Microsoft's guidance).

### Gaps
- HGIG (HDR Gaming Interest Group) guidance on peak/paper-white calibration screens: not researched (search budget exhausted).
- Which shipped games use ACEScg or Rec.2020 working spaces (e.g., Gran Turismo Sport's wide-gamut pipeline; UE5's "Working Color Space" setting): not verified this session.
- Frostbite's "HDR Color Grading and Display" (Fry, GDC 2017): the EA page returned 404, so hue-preserving display mapping and PQ-space LUTs in Frostbite are unverified.
- HDR canvas support in Firefox and Safari: not checked.

---

## Q2. Tonemapping: ACES 1.x vs ACES 2.0, AgX, Khronos PBR Neutral, GT/Uchimura, Hable, Lottes, OpenDRT, UE5 changes — who uses what and why

### Takeaway
The field is moving away from per-channel ACES 1.x fits (strong hue skews in bright saturated colours) toward display transforms with a controlled "path to white" and more stable hue: AgX, Tony McMapface (Bevy default), ACES 2.0 (CAM-based gamut compression, reportedly now UE 5.8's ACES default) and Khronos PBR Neutral (product viz, May 2024). For an ARPG whose spells are colour-coded, how saturated bright colours shift in hue matters more than filmic contrast.

### Cited Findings
**ACES 1.x and its fits (UE "Film", Godot 4.0, Narkowicz fit)**
- *Mechanism / look*: Bevy describes `AcesFitted` ("the base ACES implementation also used by Godot 4.0") as "not neutral… a strong, deliberate look and high contrast". It notes that "bright greens and reds turn orange, bright blues turn magenta", while brights desaturate across the spectrum — [V] [Bevy docs](https://docs.rs/bevy/latest/bevy/core_pipeline/tonemapping/enum.Tonemapping.html)
- *Shipped*: UE's Filmic tonemapper "matches the industry standard set by" ACES. Its defaults are Slope 0.88, Toe 0.55, Shoulder 0.26, Black Clip 0, White Clip 0.04 — [V] [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/color-grading-and-the-filmic-tonemapper-in-unreal-engine). The widely copied cheap analytic fit is Narkowicz (2016) — [M] [Narkowicz: ACES Filmic Tone Mapping Curve](https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/)
- *Cost*: analytic, a few ALU ops per pixel (fit). Open code: the fit's source is in the blog post above [M].

**ACES 2.0 (2024–2025)**
- *Mechanism*: a new suite of rendering transforms with "a less aggressive tone scale and robust gamut mapping to improve perceptual uniformity". Gamut compression works in Hellwig-2022 JMh and is invertible — [V] [ACES docs: what's new](https://draftdocs.acescentral.com/background/whats-new); [V] [ACES gamut compression](https://draftdocs.acescentral.com/output-transforms/technical-details/gamut-compression). The ACES 2.0 materials list "Hue Preservation and Gamut Compression" as a headline feature — [S] [CineGear 2025 ACES deck](https://acescentral.com/wp-content/uploads/2025/06/CineGear-2025-Deck-FIN-1.pdf)
- Community feedback reports "less hue bending in highlights, less subjective contrast… substantially less posterization" — [S] [ACESCentral: ACES 2.0 Output Rendering](https://community.acescentral.com/t/aces-2-0-output-rendering/5770)
- *UE5 change (UE 5.8, reported on Epic forums, not confirmed in release notes)*: a **Method** option on Film in the PostProcessVolume selects "Film" or "Standard ACES". The default of `r.HDR.Aces.Version` changed from **1.3 to 2.0**. Epic staff say Standard ACES has no Slope/Toe/Shoulder controls, and `r.LUT.TonemappingMethod` can override the method — [V] [Epic forum thread](https://forums.unrealengine.com/t/tonemappingmethod/2747218). A separate forum thread warns that ACES 2.0 "could change hues in highlight effects" (users, not Epic) — [V] [Epic forum thread 2](https://forums.unrealengine.com/t/tonemapping/2700529)
- *Open code*: the reference implementation is distributed via OCIO 2.4 built-ins (preview) — [V] [OCIO 2.4](https://opencolorio.readthedocs.io/en/latest/releases/ocio_2_4.html). The CAM-based math is heavier than a curve, so a real-time port would most likely be baked to a 3D LUT (inference).

**AgX (Troy Sobotka; Blender default since 4.0)**
- *Look*: "very neutral and somewhat desaturated compared to other options… little to no hue shifting, with subtle Abney shifting". LUT-based in Bevy — [V] [Bevy docs](https://docs.rs/bevy/latest/bevy/core_pipeline/tonemapping/enum.Tonemapping.html)
- *Shipped*: Blender 4.0 (Nov 2023) replaced Filmic with AgX as default — [M] [Blender 4.0 colour-management release notes](https://developer.blender.org/docs/release_notes/4.0/color_management/). Blender's AgX config is open — [M] [EaryChow/AgX](https://github.com/EaryChow/AgX)

**Khronos PBR Neutral (released 16 May 2024)**
- *Purpose*: PBR "where true-to-life colors matter, such as eCommerce, architecture, and CAD". Base colours match 1:1 up to a set maximum, and the remaining range is used as highlight-compression headroom. Adopters listed at launch: `<model-viewer>`, Babylon.js, Blender (4.2 alpha), Filament, **three.js**, Autodesk, Dassault and others — [V] [Khronos press release](https://www.khronos.org/news/press/khronos-pbr-neutral-tone-mapper-released-for-true-to-life-color-rendering-of-3d-products)
- *Mechanism*: constants F90 = 0.04, Ks = 0.76 (compression start), Kd = 0.15 (desaturation speed). Below Ks it only subtracts a small toe offset f. Above Ks it compresses toward pn and blends toward white. Hue is preserved (changes stay in the plane of the colour and the [1,1,1] axis), and the mapping is analytically invertible. A GLSL sample, OCIO config and LUT are provided — [V] [PBR Neutral README](https://github.com/KhronosGroup/ToneMapping/blob/main/PBR_Neutral/README.md)
- *Critique*: Bevy says "Despite its name, not neutral. Produces highly saturated colors and high contrast, aimed at e-commerce brand colors… significant Abney shifting. Tends to crush grays and desaturated colors" — [V] [Bevy docs](https://docs.rs/bevy/latest/bevy/core_pipeline/tonemapping/enum.Tonemapping.html)

**Tony McMapface & SomewhatBoringDisplayTransform (Tomasz Stachowiak; Bevy)**
- Tony McMapface is "designed… for real-time games. Very neutral, leaving contrast and saturation unchanged… subtle but intentional hue shifting. Brights desaturate across the spectrum". It is LUT-based and the **current Bevy default**. SomewhatBoringDisplayTransform has "little hue shift in darks and mids, but significant shift in brights" — [V] [Bevy docs](https://docs.rs/bevy/latest/bevy/core_pipeline/tonemapping/enum.Tonemapping.html). The LUT and source are open — [M] [h3r2tic/tony-mc-mapface](https://github.com/h3r2tic/tony-mc-mapface)

**Reinhard variants and Blender Filmic (baseline comparison)**
- Reinhard: "heavy hue shifting… bright primaries and secondaries don't desaturate at all". ReinhardLuminance: "brights barely desaturate". BlenderFilmic: "suffers from hue shifting" — [V] [Bevy docs](https://docs.rs/bevy/latest/bevy/core_pipeline/tonemapping/enum.Tonemapping.html)

**Foundational parametric curves (older, still common in custom engines)**
- **Hable / Uncharted 2 (2010)**: a filmic curve with toe, linear and shoulder segments and a white point. Hable's later "piecewise power curves" (2017) give direct artist parameters and public code — [M] [filmicworlds: Filmic Tonemapping Operators](http://filmicworlds.com/blog/filmic-tonemapping-operators/); [M] [filmicworlds: Piecewise Power Curves](http://filmicworlds.com/blog/filmic-tonemapping-with-piecewise-power-curves/)
- **Lottes (AMD, GDC 2016)**: a parametric HDR/SDR tonemapper (contrast/shoulder/hdrMax/mid-point controls) applied in a way that preserves colour ratios, with explicit control of desaturation toward white. Details are from memory — [M] [Lottes, "Advanced Techniques and Optimization of HDR Color Pipelines"](https://gpuopen.com/wp-content/uploads/2016/03/GdcVdrLottes.pdf)
- **GT / Uchimura (Polyphony Digital, CEDEC 2017)**: a curve with a toe, an explicit linear mid-section (start and length), a shoulder and a max-brightness parameter. It is popular because the mid-section keeps albedo contrast linear — [M] [Uchimura, "HDR Theory and Practice" (JP slides)](https://www.slideshare.net/nikuque/hdr-theory-and-practicce-jp)
- **OpenDRT (Jed Smith)**: an open-source display rendering transform for film/VFX with explicit hue/purity controls, available as DCTL/Nuke code — [M] [jedypod/open-display-transform](https://github.com/jedypod/open-display-transform)

### Inferences
- **Iso-ARPG, emissive spells**: with ACES 1.x per-channel mapping, the bright cores of blue (cold) spells drift toward magenta and green (poison) cores toward yellow/orange, per Bevy's description. Cold and shadow/void effects could then collide in hue, which would hurt gameplay readability. AgX, Tony McMapface, ACES 2.0 (via LUT) or a hue-preserving curve with deliberate desaturation keep each element's identity while still letting the hottest cores go to white.
- PBR Neutral is attractive for "albedo-as-authored" lookdev, but it targets product shots under grey light, and Bevy notes it crushes greys. It is probably not the right default for a low-key night scene with HDR emissives. It is useful as a lookdev check view.
- Every option above is either a few ALU ops or one 3D-LUT fetch, so the cost is negligible (well under 0.1 ms) on WebGL2 and WebGPU. LUT-based transforms (AgX, Tony McMapface, ACES 2.0) can be baked offline to a 3D texture.
- The UE 5.8 switch to ACES 2.0 (if confirmed) signals that AAA HDR pipelines are standardising on CAM-based gamut compression. For SDR-first web output, a baked ACES 2.0 or AgX LUT gets most of the benefit.

### Gaps
- No verified data on which tonemapper Diablo IV, Path of Exile 2, Last Epoch or Titan Quest II use.
- UE 5.8 change: only forum evidence; the official release notes and cvar reference were not checked. The UE version that made Filmic the default (believed to be 4.15, 2017) was not verified.
- Exact ACES 2.0 release date not pinned down (OCIO 2.4 preview support; 2025 ACES materials).
- Godot 4.4's AgX tonemapper (believed added in 2025): not verified because the search budget ran out.
- No 2024–2026 game-specific confirmation of Hable, Lottes or Uchimura use.

---

## Q3. Grading & exposure: 3D LUTs, lift/gamma/gain, per-area volumes, histogram auto-exposure, EV100 physical camera, local exposure / local tonemapping

### Takeaway
The standard grading setup is parametric lift/gamma/gain-style controls in scene-linear plus a baked 3D LUT applied in the tonemap pass, blended between zones by post-process volumes. Exposure is histogram-metered (EV100, clamped range, metering masks, asymmetric adaptation speeds). It is increasingly paired with **local exposure / local tonemapping** (UE5 Bilateral/Fusion, God of War, Ghost of Tsushima), which keeps shadows readable when bright sources are on screen. That makes it the most directly relevant AAA technique for "low-key but readable".

### Cited Findings
**Grading controls and LUTs**
- UE: Global/Shadows/Midtones/Highlights groups, each with Saturation, Contrast, Gamma, Gain and Offset, plus Temperature/Tint. These run in scene-referred linear before the tonemapper, while LUTs run in LDR sRGB on the final output — [V] [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/color-grading-and-the-filmic-tonemapper-in-unreal-engine)
- UE Local Exposure settings live in the Post Process Volume (Lens > Local Exposure). Grading and exposure are therefore per-volume and blendable, the standard "per-area grading volume" mechanism — [V] [UE docs: Auto Exposure](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine). The bloom dirt mask is a stated exception that "cannot be blended with other Post Process Volumes" — [V] [UE docs: Bloom](https://dev.epicgames.com/documentation/en-us/unreal-engine/bloom-in-unreal-engine)

**Histogram auto-exposure / eye adaptation**
- UE metering modes: **Auto Exposure Histogram** (default, 64-bin histogram), **Auto Exposure Basic** (faster, "computes single values by downsampling"), and **Manual** (camera Shutter/ISO/Aperture). Both automatic modes treat the computed average luminance as middle grey (about 18%) — [V] [UE docs: Auto Exposure](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- Recommended starting values: Low Percent 70–80 and High Percent 80–95 (the histogram percentile window). Min/Max EV100 clamp the range, Speed Up/Down are in f-stops per second, and an Exposure Compensation Curve maps average scene EV100 to compensation. Adaptation is linear far from target and exponential within 1.5 stops (`r.EyeAdaptation.ExponentialTransitionDistance`) — [V] [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- An **Exposure Metering Mask** texture weights pixels' influence (e.g., centre-weighting to stabilise exposure). It replaced `r.EyeAdaptation.Focus` in UE 4.25 — [V] [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- Foundational write-up of histogram-based auto exposure with code-level detail — [M] [Narkowicz: Automatic Exposure (2016)](https://knarkowicz.wordpress.com/2016/01/09/automatic-exposure/)

**Physical camera exposure (EV100)**
- UE: with "Apply Physical Camera Exposure", EV100 = log2(Aperture² / ShutterSpeed × 100/ISO) and exposure = 1/2^(EV100 + ExposureCompensation). Pixel brightness B = Exposure × L, where L is luminance in cd/m² — [V] [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- Foundational: Frostbite's physical camera and photometric light units (2014) — [M] [Lagarde & de Rousiers, Moving Frostbite to PBR](https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf)

**Local exposure / local tonemapping**
- UE Local Exposure "adds local adjustments on top of global exposure to preserve highlight and shadow detail". Epic recommends it whenever Lumen GI is used. **Methods**: *Bilateral* splits the image into base and detail layers with a bilateral blur and compresses only base-layer contrast. *Fusion* "fuses multiple exposures based on quality measures". **Parameters**: Highlight/Shadow Contrast (good values 0.6–1), Highlight/Shadow Contrast Curves (vs average scene luminance), Highlight/Shadow Threshold, Detail Strength (1 in most cases), Blurred Luminance Blend (0.4–0.6, "helps preserve highlights and reduces ringing"), Blurred Luminance Kernel Size Percent, and Middle Grey Bias — [V] [UE docs: Auto Exposure → Local Exposure](https://dev.epicgames.com/documentation/en-us/unreal-engine/auto-exposure-in-unreal-engine)
- **Exposure-fusion LTM** (Wronski 2022): (1) tonemap about 3 synthetic exposures; (2) compute lightness (sqrt as a perceptual proxy); (3) build Laplacian pyramids; (4) use exposure-only weights; (5) blend the coarsest levels around mip 5–6, then add Laplacian detail back up; (6) transfer lightness to the full-res image. Results were computed "in ¼ x ¼ resolution and guided upsampled", with an estimated cost of "under 1ms on even previous generation consoles" (not profiled) — [V] [Wronski: Exposure Fusion – local tonemapping for real-time rendering](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- *Shipped / prior art*: God of War used a Gaussian-based LTM, which produced halos. Ghost of Tsushima (Jasmin Patry) blends bilateral-grid and Gaussian results to avoid both halos and gradient reversals — [V] [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- *Why games need it*: high contrast may be an artistic choice, but "very often, you cannot have important detail not visible". Faking it with brighter albedos or extra fill lights breaks physical consistency — [V] [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- *Artifacts and mitigations*: Gaussian blending gives halos, bilateral gives gradient reversals and ringing, and plain bilinear pyramids can flicker in motion (use better downsample filters) — [V] [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
- *Open code*: Wronski's demo is **WebGL/three.js**, released to the public domain (bartwronski.github.io/local_tonemapping_js_demo), with about 300 lines of core logic — [V] [Wronski 2022](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)

### Inferences
- **Iso-ARPG exposure policy**: a dark-fantasy ARPG wants a *stable mood*. Global auto exposure will "pump" (darken the whole screen) when a screen-filling fire nova or lightning storm goes off. Practical options, cheapest first:
  1. Manual/fixed EV per zone, blended by volumes.
  2. A narrow Min/Max EV clamp with slow adaptation.
  3. Excluding or clamping emissive VFX luminance before metering (metering mask or luminance cap).
  4. Local exposure to compress highlights while keeping the area around the hero readable.
- **Feasibility on web**:
  - LUT grading and parametric controls are trivial in a fragment shader (3D textures exist in WebGL2).
  - Histogram metering needs compute atomics, so WebGPU. On WebGL2, use a "Basic"-style downsampled log-average via the mip chain.
  - Wronski's 1/4-res fusion LTM is fragment-only plus mips, so it is feasible on both backends with an existing three.js reference.
  - UE-style bilateral-grid LTM is easier with WebGPU compute (grid splatting).
- Per-zone grading volumes map naturally onto ARPG biomes and dungeon interiors. Blending two LUTs plus parameter lerps by player position is cheap.

### Gaps
- LUT size and encoding conventions (e.g., 32³ in log or PQ space) were not verified from primary docs this session.
- The UE version that introduced Local Exposure (believed 5.1) and the Fusion method was not verified, and no ms cost for UE local exposure was found.
- No ms costs found for histogram eye adaptation.

---

## Q4. Bloom: COD:AW dual-filter downsample/upsample (Jimenez 2014), FFT/convolution bloom, energy conservation, lens dirt, halation

### Takeaway
The de-facto standard is still the COD:AW progressive downsample/upsample chain: no threshold, firefly suppression on the first downsample, and a small lerp blend (~4%). It is cheap, temporally stable, does not add energy, and ports directly to WebGL2. FFT/convolution bloom remains a cinematic/high-end option. Lens dirt is a stylistic add-on. No documentation of halation in games was found.

### Cited Findings
- **COD:AW bloom mechanism** (Jimenez, SIGGRAPH 2014): a "pyramidal filter hierarchy" for temporal stability. Firefly suppression weights samples by `1/(1+luma)` per 2×2 block and renormalises. There are 6 downsample passes (mip 0–6), and upsampling uses a 3×3 tent whose radius is fixed in UV space, accumulated mip by mip (E′=blur(E), D′=blur(D)+E′, …). The bloom is blended with a weight of about **0.04**, with no threshold under PBR, and exposure is applied after bloom ("equivalent") — [V] [iryoku.com: COD:AW post processing (blog + author comments)](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare); course listing [V] [SIGGRAPH 2014 Advances](https://advances.realtimerendering.com/s2014/index.html)
- **Open, GL-level implementation**: LearnOpenGL "Physically Based Bloom" (A. Christensen, 2022). It uses a 13-tap downsample ("effectively 36 lookups" with bilinear), a Karis average on the first downsample against fireflies, a clamp to 0.0001 to prevent "black boxes", and a 3×3 tent upsample (1-2-1/2-4-2/1-2-1 ÷16) with additive accumulation and a radius of about 0.005 UV. It uses 5 mips in `R11F_G11F_B10F` and a final lerp of 0.04 (0.03–0.15 works). It is said to be "an order of magnitude faster" than a large-kernel blur — [V] [LearnOpenGL](https://learnopengl.com/Guest-Articles/2022/Phys.-Based-Bloom)
- **UE Standard bloom**: five Gaussian blurs from 1/2 to 1/32 resolution, each with a Tint and Size. It is **"not energy-conserving and can brighten the overall image"**. The threshold uses a 1-unit linear transition, and −1 lets all pixels contribute — [V] [UE docs: Bloom](https://dev.epicgames.com/documentation/en-us/unreal-engine/bloom-in-unreal-engine)
- **FFT / convolution bloom (UE)**: an arbitrary kernel image is applied through an FFT-accelerated convolution. It is "designed for use with in-game or offline cinematics or on high-end hardware", and "the Standard bloom should be used for most game applications". It is more conservative in energy, and a larger Convolution Buffer has an "adverse performance impact". UE gives no ms numbers, only "moderate render performance cost" for bloom in general — [V] [UE docs: Bloom](https://dev.epicgames.com/documentation/en-us/unreal-engine/bloom-in-unreal-engine)
- **Lens dirt**: UE's Bloom Dirt Mask "uses a texture to brighten up the bloom in some defined screen areas" (lens-dirt or war-camera look). A low-res texture suffices because dirt is out of focus — [V] [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/bloom-in-unreal-engine). LearnOpenGL adds dirt additively on top of bloom, so it shows across the whole screen — [V] [LearnOpenGL](https://learnopengl.com/Guest-Articles/2022/Phys.-Based-Bloom)

### Inferences
- **Iso-ARPG**: with heavy emissive VFX, threshold-less lerp bloom keeps the image from washing out when dozens of spells overlap, because it redistributes energy rather than adding it. UE-style additive multi-Gaussian bloom brightens the whole frame as VFX density rises. For art control, per-mip tints, or bloom fed only from an emissive buffer, let spell glow stay strong without hazing the dark environment (common stylised practice; not sourced).
- **Web cost**: 5–6 mips of 1-pass down plus 1-pass up, starting at half res, is a handful of tiny fragment passes, well under 1 ms at 1080p on mid GPUs (inference; measure in the lab). R11G11B10 mips halve bandwidth where renderable.
- Lens dirt is a gimmick for a top-down camera. If used at all, keep it subtle and behind a toggle.
- A "halation" look (a warm/red fringe around bright highlights, as on film) could suit a gothic film aesthetic. It is cheap to fake as an extra small-radius, red-tinted bloom term (inference; no game source found).

### Gaps
- No published ms cost for the COD:AW bloom (the slides, a 400+ MB PPTX, could not be read) or for FFT bloom in shipped games.
- Dual-Kawase blur (Bjørge, ARM, SIGGRAPH 2015) as the mobile fallback: primary URL not verified.
- No games found documenting film halation as a post effect.

---

## Q5. Depth of field, motion blur, chromatic aberration, vignette, film grain, lens flares, anamorphic streaks — good taste vs gimmicks; user toggles

### Takeaway
DoF (scatter-as-gather bokeh) and per-object motion blur (tile-based reconstruction filters) are mature and still ship in cinematic third-person AAA. For a top-down isometric camera they are mostly irrelevant during gameplay and can hurt readability. Chromatic aberration, film grain, lens dirt and heavy vignettes are widely seen by players as gimmicks and commonly have toggles. Where these effects are kept, they belong after upscaling and mostly in cinematics and close-ups.

### Cited Findings
**Depth of field**
- *Mechanism (COD:AW)*: scatter-as-gather bokeh DoF that tracks transparency (alpha masks for growing and shrinking silhouettes), with tile-max CoC and foreground/background classification by depth comparison. A separate DoF pass for translucency was too expensive, so artists got a per-material checkbox to render transparents before or after post — [V] [iryoku.com COD:AW](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare)
- *UE*: "Temporal Super Resolution happens after depth of field", and translucent materials default to "After DOF" — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine). UE's Diaphragm DOF is described in Abadie's "A Life of a Bokeh" (SIGGRAPH 2018) — [M] [SIGGRAPH 2018 Advances](https://advances.realtimerendering.com/s2018/index.htm)
- *Placement*: AMD's FSR2 guidance places DoF after the upscaler, at presentation resolution — [V] [FSR2 GitHub README](https://github.com/GPUOpen-Effects/FidelityFX-FSR2)

**Motion blur**
- *Mechanism*: tile-based max velocity plus a neighbourhood reconstruction filter (McGuire et al. 2012) — [M] [McGuire 2012, A Reconstruction Filter for Plausible Motion Blur](https://casual-effects.com/research/McGuire2012Blur/index.html). COD:AW builds on McGuire's tile/centre velocity approach, adds a "mirror filter", and **removed camera-rotation motion blur** — [V] [iryoku.com COD:AW](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare)
- *UE*: motion blur runs after TSR, and `r.MotionBlur.HalfResInput` makes TSR output half-res scene colour for a cheaper blur (a low-end fallback) — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)

**Chromatic aberration, vignette, film grain: placement and sentiment**
- FSR2 guidance applies **film grain, chromatic aberration and vignette after upscaling** (with tonemapping, bloom, DoF and motion blur), because "an upscaler might amplify noise placed before it" — [V] [FSR2 README](https://github.com/GPUOpen-Effects/FidelityFX-FSR2)
- Player sentiment (anecdotal, not survey data). Motion blur, film grain and chromatic aberration are called "the unholy trinity of garbage graphic effects" in a Steam thread — [S] [Steam forum thread](https://steamcommunity.com/discussions/forum/12/4625855673284955112). CA is the most disliked of the three — [S] [CommonSenseGamer: chromatic aberration on or off](https://commonsensegamer.com/what-is-chromatic-aberration-in-games-keep-it-on-or-off/). Opinion on grain is split (it can mask banding and suit horror) — [S] [Patreon: visual clarity suggestions](https://www.patreon.com/posts/83362050)
- Toggle practice: Ghostwire: Tokyo has separate on/off toggles for film grain and chromatic aberration plus a motion-blur quality setting — [S] [SeekingTech guide](https://seekingtech.com/how-to-turn-off-ghostwire-tokyo-film-grain-chromatic-aberration-and-motion-blur/). Senua's Saga: Hellblade II players complained that CA remained "even if you rewrite the ini file and set all post processing effects to off" — [S] [Steam: Hellblade II discussion](https://steamcommunity.com/app/2461850/discussions/0/6761670312892891069)
- ARPG data point: a Diablo IV forum user recommends to "Disable Distortion & Chromatic Aberration" (along with DLSS Balanced and a 60 fps cap), which implies both are toggles in D4's PC menu. This is anecdotal — [S] [Blizzard D4 forum](https://us.forums.blizzard.com/en/d4/t/diablo-4-graphics-problem/214026/2)

**Lens flares and anamorphic streaks**
- Physically based lens-flare rendering by tracing ghosts through a lens system (Hullin et al. 2011) is foundational. Games usually ship cheaper screen-space or sprite flares instead — [M] [Hullin et al., Physically-Based Real-Time Lens Flare Rendering](https://resources.mpi-inf.mpg.de/lensflareRendering/)

### Inferences
- **Iso-ARPG DoF**: the depth range across an isometric screen is small, so a physical CoC gives almost uniform focus. The classic stylised alternative is **tilt-shift**, where CoC grows with distance from a focal band in screen Y or from a tilted ground plane, giving a miniature look. It blurs the top of the screen, where enemies approach, so it should be off or very subtle in gameplay. Use real DoF for dialogue close-ups, the character/inventory screen and cinematics.
- **Iso-ARPG motion blur**: the camera follows the hero smoothly, so camera blur adds nothing and costs readability. Per-object blur for fast projectiles is better authored as VFX trails, which are cheaper and art-directable. If implemented, McGuire-style tile max plus reconstruction at half res is the standard.
- **CA / grain / vignette**: CA is best avoided as a constant effect. A brief CA pulse on taking damage is a legitimate feedback use. A subtle vignette helps focus on the centred hero in top-down framing but darkens edges where threats enter, so keep it mild. Use low-amplitude luminance grain mainly as anti-banding dither, applied after TAA/upscaling.
- **Settings menu**: offer toggles for motion blur, DoF, chromatic aberration, film grain, vignette, lens dirt/flares and screen shake. This matches player expectations evidenced above. Tilt-shift and anamorphic streaks fall into "stylised gimmick" territory for this genre.

### Gaps
- Xbox Accessibility Guidelines / Game Accessibility Guidelines wording on toggles for blur, shake and flashing: not fetched (search budget exhausted).
- No verified examples of shipped isometric games with tilt-shift DoF.
- No verified per-pass ms costs for DoF or motion blur (COD:AW slide timings were inaccessible).
- Anamorphic streaks: no game-documentation sources found.

---

## Q6. Anti-aliasing: FXAA, SMAA (1x/T2x), MSAA in forward renderers, TAA (Karis 2014) and ghosting/blur mitigations, UE5 TSR, specular AA, alpha-to-coverage

### Takeaway
The TAA family (TAA, then TSR/DLSS/FSR/XeSS/PSSR temporal upscalers) is the default in deferred AAA renderers. SMAA and FXAA survive as cheap fallbacks, and MSAA is mainly viable in forward renderers, which is the three.js case. For a particle-heavy spell-VFX game the critical details are the ghosting mitigations: neighbourhood clipping, reactive/transparency masks, rendering VFX after the temporal pass, and flicker analysis. Specular AA and alpha-to-coverage are cheap wins that work in any renderer.

### Cited Findings
**TAA (Karis 2014, UE4) — foundational**
- *Mechanism*: TAA "does not require MSAA" (good for deferred), reduces both geometric and shading aliasing, and "uses no spatial edge finding and instead purely uses a form of temporal super-sampling". The talk covers fixes for HDR, ghosting, translucency, edges in motion, flickering, and integration into post — [V] [SIGGRAPH 2014 Advances course page](https://advances.realtimerendering.com/s2014/index.html). The same course included Drobot's "Hybrid Reconstruction Anti-Aliasing" (Ubisoft) — [V] [same page](https://advances.realtimerendering.com/s2014/index.html)
- *Ghosting/blur mitigations in the literature*: variance clipping of the history colour (Salvi, GDC 2016) — [M] [Salvi, An Excursion in Temporal Supersampling](https://developer.download.nvidia.com/gameworks/events/GDC2016/msalvi_temporal_supersampling.pdf). Survey of jitter sequences, reprojection, history rectification, velocity dilation and sharpening — [M] [Yang, Liu, Salvi 2020: A Survey of Temporal Antialiasing Techniques](http://behindthepixels.io/assets/files/TemporalAA.pdf)
- *Particles and transparency*: FSR2 formalises a **reactive mask** (R8, 0–1, recommended max ~0.9) and a **transparency & composition mask** that reduce reliance on history for alpha-blended or animated pixels — [V] [FSR2 README](https://github.com/GPUOpen-Effects/FidelityFX-FSR2). COD:AW gave artists a per-material "render before/after post" checkbox for transparents — [V] [iryoku.com](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare)

**UE5 TSR (2021+)**
- *Mechanism*: history is kept at display resolution (200% history at Epic/Cinematic scalability, "based on the Nyquist-Shannon theorem" with a Mitchell-Netravali downsample). Core algorithms are History, Parallax Disocclusion, Shading Rejection, Flickering Temporal Analysis and History Resurrection, plus an FXAA-style spatial anti-aliaser for under-accumulated areas. It "can't solve the problem of transforming details that are 1 pixel thick" moving by half a pixel. Translucency without velocity is hard. A "Has Pixel Animation" material flag excludes animated pixels from flicker analysis — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)
- *Cost*: Valley of the Ancient "~0.79ms at r.ScreenPercentage=100" and "~0.43ms at r.ScreenPercentage=50". In Fortnite Chapter 4 on **PS5/Xbox Series X**, async compute hides ~0.5 ms, "bringing down the effective TSR cost to 1.5 ms" (1.1 ms on the critical path). It needs SM5+ (D3D11/12, Vulkan, Metal) and is optimised for RDNA 16-bit packed math — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)
- *Low-end fallback*: 100% instead of 200% history (lower scalability groups) and the `r.TSR.History.R11G11B10` history format — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)

**SMAA (Jimenez et al., 2011–2012)**
- *Modes*: 1x (morphological); **T2x** = morphological plus temporal supersampling with reprojection (v2.5, Oct 2011); **S2x/4x** add multisampling/supersampling for subpixel features (v2.7, Jan 2012). It claims "extremely fast execution times" but the page gives no ms figures. The source is on GitHub, and a CryEngine 3 integration demo exists — [V] [iryoku.com/smaa](https://www.iryoku.com/smaa/); [V] [github.com/iryoku/smaa](https://github.com/iryoku/smaa)
- *Portability*: SMAA uses 3 fullscreen passes (edge detection, blend weights with precomputed area/search textures, neighbourhood blend) in plain HLSL/GLSL with no compute, so it is WebGL2-portable (inference from the repo's structure).

**FXAA (Lottes, NVIDIA, 2009–2011) — foundational**
- *Mechanism*: a single-pass luminance-edge-detecting post filter. It is the cheapest common post-AA and the usual fallback — [M] [NVIDIA FXAA whitepaper](https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf)

**MSAA in forward renderers, specular AA, alpha-to-coverage**
- Forward rendering with MSAA plus geometric specular anti-aliasing was Valve's recommended VR approach — [M] [Vlachos, Advanced VR Rendering, GDC 2015](https://media.steampowered.com/apps/valve/2015/Alex_Vlachos_Advanced_VR_Rendering_GDC2015.pdf)
- **Specular AA**: increase roughness from screen-space normal variance or curvature to stop specular shimmer. Filament exposes `specularAntiAliasingVariance/Threshold` per material — [M] [Filament Materials docs](https://google.github.io/filament/Materials.html). The rigorous version is projected-space NDF filtering — [M] [Tokuyoshi & Kaplanyan, JCGT 2021](https://jcgt.org/published/0010/02/02/)
- **Alpha-to-coverage**: with MSAA, alpha-tested foliage, hair and grass get anti-aliased, dithered edges, and sharpening the alpha by its screen-space derivative keeps edges crisp — [M] [Ben Golus, Anti-aliased Alpha Test: The Esoteric Alpha To Coverage](https://bgolus.medium.com/anti-aliased-alpha-test-the-esoteric-alpha-to-coverage-8b177335ae4f)

### Inferences
- **three.js is a forward renderer**, so the AAA-standard deferred argument against MSAA doesn't apply. MSAA 4x (WebGL2 multisampled renderbuffers; WebGPU sampleCount 4) plus specular AA plus alpha-to-coverage covers geometric edges, specular shimmer and foliage. Add SMAA 1x or FXAA when MSAA is too costly.
- **When TAA is worth it on web**: an isometric camera views lots of small geometry and specular detail from a distance, so subpixel shimmer is common. Its motion is slow and predictable, so history stays valid and TAA performs better than in a fast FPS. Risks are ghost trails on particles and spell VFX that don't write velocity. Mitigations: render most translucent VFX after the TAA resolve (UE "After DOF" / COD:AW checkbox approach), write a reactive mask for the rest, write velocity for skinned and animated meshes, and use YCoCg variance clipping.
- Blur complaints about TAA are usually handled with a light post-TAA sharpen (RCAS/CAS, see Q7) plus a negative mip bias (FSR2 uses log2(render/display) − 1).

### Gaps
- No verified ms timings for SMAA 1x/T2x, FXAA or generic TAA (the SMAA page gives none; the paper's tables were not fetched).
- No verified list of 2024–2026 AAA games still shipping MSAA (forward+ titles).

---

## Q7. Upscaling & frame generation: DLSS 4/4.5/5, FSR 3.1/4/"Redstone", XeSS 2/3, PSSR (+2026 update), Switch 2 DLSS, TSR, DRS, spatial upscalers; vendor-locked vs open/portable

### Takeaway
By October 2026 the state of the art is ML temporal upscaling plus ML frame generation, moving toward "neural rendering":
- **Upscalers**: DLSS 4.5's second-generation transformer, FSR 4.1 (FP8 on RDNA 4, INT8 on RDNA 3), the upgraded FSR-4-derived PSSR on PS5 Pro, and two DLSS variants on Switch 2.
- **Frame generation**: DLSS 4.5 Dynamic MFG up to 6×, XeSS 3 MFG up to 4× on all Arc GPUs, and FSR ML frame generation.
- **Neural rendering**: DLSS 5 (announced March 2026 for fall 2026) and FSR Ray Regeneration.

Every ML option is vendor-locked and closed. What can actually be ported to web shaders: FSR 1 (spatial), FSR 2/3.1 (MIT, compute-heavy), Arm ASR (MIT, FSR2-derived for mobile), Snapdragon GSR 1/2 (fragment-shader paths), and CAS/RCAS sharpening.

### Cited Findings
**NVIDIA DLSS**
- **DLSS 4 (6 Jan 2025)**: a transformer model replaces the CNN for Super Resolution, Ray Reconstruction and DLAA on **all RTX GPUs**, with "double the parameters of the CNN model" (SR initially beta). **Multi Frame Generation** generates "up to three additional frames per traditionally rendered frame" on **RTX 50 only**. The new FG model is "40% faster and uses 30% less VRAM", replaces hardware optical flow with an AI model, and Blackwell adds hardware **Flip Metering** for pacing. 75 MFG games at launch, plus an NVIDIA-app override for models and presets — [V] [NVIDIA: DLSS 4](https://www.nvidia.com/en-us/geforce/news/dlss4-multi-frame-generation-ai-innovations/)
- **DLSS 4.5 (CES, 6 Jan 2026)**: the second-gen SR transformer uses "five times the compute power of the original transformer model" and a larger dataset. It **trains and infers in linear space**, preserving highlight detail that "earlier logarithmic-space methods muted or crushed" (neon and bright reflections keep full colour range). FP8 doubles inference throughput on RTX 40/50, at a "minor performance tradeoff" versus the first transformer. RTX 20/30 lack FP8, so models M and L cost more there and NVIDIA suggests Model K (DLSS 4.0). Presets: Model M = Performance, L = Ultra Performance, K = the rest. 400+ games. **Dynamic MFG and 6× mode** (up to 5 generated frames, multiplier adapts to display refresh) are RTX 50 only, announced for spring 2026, with 4×→6× giving "up to 35%" more fps at 4K in path-traced titles. 250+ MFG games — [V] [NVIDIA: DLSS 4.5](https://www.nvidia.com/en-us/geforce/news/dlss-4-5-dynamic-multi-frame-gen-6x-2nd-gen-transformer-super-res/). The full feature set was later reported as pushed to the NVIDIA app beta — [S] [CG Channel, Mar 2026](https://www.cgchannel.com/?p=173154); [S] [MSFS Addons](https://msfsaddons.com/?p=44596)
- **DLSS 5 (GTC, 16 Mar 2026)**: presented as a real-time **neural rendering** model that enhances lighting and materials (hair, skin, fabric) from colour plus motion vectors. It is *not* a frame-rate or frame-generation technology. Launch is planned for **fall 2026**, reportedly RTX 50-only (sources differ). Demos used Resident Evil Requiem, Hogwarts Legacy and Starfield. Critics note the demo compared against no upscaling rather than DLSS 4.5 — [S] [Igor's Lab](https://www.igorslab.de/en/with-the-geforce-rtx-6090-and-dlss-5-nvidia-has-brought-forward-its-true-next-gen-feature/); [S] [Ubergizmo](https://www.ubergizmo.com/2026/03/nvidia-dlss-5/); [S] [Techloy](https://www.techloy.com/nvidia-dlss-5-everything-you-need-to-know-about-the-ai-graphics-update-coming-in-2026/); [S] [AInauten](https://news.ainauten.com/en/story/nvidia-claims-dlss-5-will-deliver-photoreal-image-quality-with-ai-this-fall); [S] [texxr](https://texxr.com/1165344)
- **Switch 2 (Digital Foundry, Oct 2025)**: two DLSS variants. A "standard" CNN-like model is used when upscaling to about 1080p (e.g., Cyberpunk 2077, Street Fighter 6). A lighter **"tiny" model** is used above 1080p (Star Wars Outlaws, Hogwarts Legacy, The Touryst, Fast Fusion): sharper stills but much worse anti-aliasing in motion, at roughly **half the frame-time cost** of the standard model. Nintendo and NVIDIA have not confirmed details — [S] [Nintendo Life on DF analysis](https://www.nintendolife.com/news/2025/10/digital-foundry-delivers-a-technical-breakdown-of-switch-2s-dlss); [S] [GoNintendo](https://gonintendo.com/contents/53583-digital-foundry-s-switch-2-dlss-analysis-discovers-two-different-approaches-to-the); [S] [Notebookcheck](https://www.notebookcheck.net/The-Nintendo-Switch-2-reportedly-supports-two-different-versions-of-Nvidia-s-DLSS-offering.1131627.0.html). Pokémon Legends: Z-A uses DLSS to 1440p docked, and the FF7 Remake Intergrade demo appears to use the tiny model — [S] [GoNintendo: Z-A](https://www.gonintendo.com/contents/54976-digital-foundry-offers-a-tech-analysis-of-pokemon-legends-z-a-on-switch-and-switch-2); [S] [GoNintendo: FF7R](https://www.gonintendo.com/contents/56149-digital-foundry-offers-a-tech-analysis-of-the-final-fantasy-vii-remake-intergrade)
- ARPG data point: Diablo IV patch 1.3.5 enabled DLSS 3 Frame Generation on RTX 40 and DLSS 2 Super Resolution on other RTX cards — [S] [Blizzard news](https://news.blizzard.com/diablo4/24077218/)

**AMD FSR**
- **FSR 2 (open source; foundational temporal upscaler)**:
  - *Mechanism and inputs*: linear colour (with an HDR flag), depth (inverted infinite recommended), motion vectors, reactive mask, transparency & composition mask, and exposure (or auto-exposure), plus jitter from `ffxFsr2GetJitterOffset` and a reset on camera cuts.
  - *Quality modes*: 1.5× / 1.7× / 2.0× / 3.0×, with jitter sequences of 18/23/32/72 and mip bias −1.58 to −2.58. RCAS sharpening is the final stage.
  - *Shaders*: HLSL CS_6_2, with GLSL for Vulkan in the repo. FP16 path is preferred, with an FP32 fallback. MIT-style licence.
  - Source for all of the above: [V] [GPUOpen-Effects/FidelityFX-FSR2](https://github.com/GPUOpen-Effects/FidelityFX-FSR2)
- **FSR 2 cost (AMD table, DX12, ms)**: 1080p output, Quality mode: RX 7900 XTX 0.2, RX 6800 XT 0.3, RX 6700 XT 0.5, RX 5700 XT 0.6, Vega 56 1.0, RX 590 1.3. 1440p Quality: 0.3 / 0.5 / 0.9 / 1.1 / 1.9 / 2.3. 4K Quality: 0.7 / 1.2 / 2.0 / 2.4 / 4.9 / 5.4 — [V] [FSR2 README](https://github.com/GPUOpen-Effects/FidelityFX-FSR2)
- **FSR 3 / 3.1 (open source, MIT)**:
  - *Mechanism*: frame interpolation plus optical flow (building on AMD Fluid Motion Frames), running on the present queue or async.
  - *UI*: must be handled separately, either as a separate UI target, UI rendered over generated frames, or UI detection.
  - *Base frame rate*: "best when interpolating from at least 60 fps", and "Sub 30fps frame rate pre-interpolation should be absolutely avoided".
  - *FSR 3.1*: decouples upscaling from frame generation, and FG can work with third-party upscalers.
  - *FG cost at 4K ("up to")*: RX 7900 XTX 2.4 ms (Native AA) / 1.7 (Quality) / 1.5 (Performance); RX 6800 XT 3.8/2.4/2.1; RX 5700 XT 7.3/5.0/4.5.
  - AMD now recommends FSR Upscaling via the FSR SDK v2 over FSR 3 for new integrations.
  - Source for all of the above: [V] [GPUOpen: FSR 3](https://gpuopen.com/fidelityfx-super-resolution-3/)
- **FSR 4 (RDNA 4, 2025, ML) and the leak**: in Aug 2025, AMD briefly published FSR 4 source inside FidelityFX SDK 2.0 on GitHub, carrying an MIT licence, then pulled it. The code included an **INT8** variant — [S] [Guru3D](https://www.guru3d.com/story/amd-accidentally-opensources-fsr-4-code-on-github); [S] [Igor's Lab](https://www.igorslab.de/en/amd-fsr-4-leak-and-fidelityfx-sdk-2-0-a-sober-evaluation/)
- **FSR "Redstone" (launched 10 Dec 2025, RDNA 4 / RX 9000 only)**: the suite comprises FSR Upscaling (ML), FSR Frame Generation (ML), **FSR Ray Regeneration** (an ML denoiser similar to NVIDIA Ray Reconstruction, first shipped in Call of Duty: Black Ops 7) and FSR Radiance Caching — [S] [Guru3D](https://www.guru3d.com/story/fsr-4-redstone-amd-new-ai-upscaling-arrives-december-10-officially/); [S] [HWBusters](https://hwbusters.com/news/amd-fsr-redstone-debuts/); [S] [Notebookcheck](https://www.notebookcheck.net/AMD-FSR-Redstone-promises-faster-RDNA-4-ray-tracing-with-ML-Ray-Regeneration-and-more.1021290.0.html). The current repo is "AMD FSR SDK 2.3.0 (Redstone)", listing FSR 2.3.4, FSR 3.1.5, **FSR Upscaling (ML) 4.1.1**, Frame Generation 3.1.6, **Frame Generation (ML) 4.0.1**, **Ray Regeneration 1.2.0** and Radiance Caching (preview). The page states only that the *samples* are MIT, and "Vulkan is currently not supported in SDK" — [V] [GPUOpen FidelityFX/FSR SDK GitHub](https://github.com/GPUOpen-LibrariesAndSDKs/FidelityFX-SDK)
- **FSR 4.1 on RDNA 3 (mid-2026)**: official support for RX 7000 uses an INT8 model (RDNA 3 lacks FP8). It ships in Adrenalin 26.6.2, works in 300+ games, and RDNA 3 APUs are coming "soon". RDNA 2 support (covering RX 6000 and console-class RDNA 2) was reported for early 2027. Tom's Hardware notes only RDNA 4 runs it optimally — [S] [Tom's Hardware](https://www.tomshardware.com/pc-components/gpu-drivers/amd-brings-official-fsr-4-1-support-to-rx-7000-series-gpus-int8-model-now-available-in-300-games-rdna-3-apus-also-getting-fsr-4-1-soon); [S] [HWBusters](https://hwbusters.com/news/amd-brings-fsr-4-1-to-the-radeon-rx-7000-series-rdna-3-finally-gets-the-good-upscaler/); [S] [KitGuru](https://www.kitguru.net/gaming/joao-silva/amd-expands-fsr-4-1-support-to-radeon-rx-7000-series-gpus/)

**Sony PSSR**
- **Upgraded PSSR (announced 27 Feb 2026)**: it comes out of Sony and AMD's **Project Amethyst** partnership (the same one that produced FSR 4) and is adapted to the PS5 Pro's upscaling hardware. It debuted natively in **Resident Evil Requiem**. A March 2026 system update added an "Enhance PSSR Image Quality" toggle that applies the new PSSR to existing PSSR titles (about 50 games). No ms figures were given. The original PSSR had problem launches (e.g., Silent Hill 2 Remake needed patches) — [V] [TheSixthAxis](https://www.thesixthaxis.com/2026/02/27/the-new-pssr-is-rolling-out-to-ps5-pro-starting-with-resident-evil-requiem/). Notebookcheck reports that "PSSR 2.0" uses FSR 4's INT8 version — [S] [Notebookcheck](https://www.notebookcheck.net/PlayStation-5-s-PSSR-2-0-uses-AMD-s-FSR-4-s-INT8-version-that-may-skip-PC-RDNA-2-3-GPUs.1258631.0.html). It is not "FSR 4 support" as such — [S] [TweakTown](https://tweaktown.com/news/107703/ps5-pro-gets-new-pssr-upgrade-in-2026-not-amd-fsr-4-support/index.html). Mark Cerny announced the 2026 plan in March 2025 — [S] [Push Square](https://www.pushsquare.com/news/2025/03/ps5-pros-pssr-to-be-upgraded-with-fsr-4-like-tech-in-2026)

**Intel XeSS**
- **XeSS 3 Multi-Frame Generation (2×/3×/4×)**: shipped in drivers 32.0.101.8425 and 8362 (late Jan 2026, alongside Panther Lake's Arc B390/B370 iGPUs). Driver 32.0.101.8509 (13 Feb 2026) extended MFG to Arc A770 through B580. It can be enabled in any XeSS 2 game from the Intel control panel, and an XeSS 3.0 SDK is out — [S] [TweakTown](https://tweaktown.com/news/109897/intels-xess-3-arrives-with-multi-frame-generation-so-now-amd-lags-behind-nvidia-and-arc-gpus/index.html); [S] [TweakTown: older GPUs](https://tweaktown.com/news/110205/intels-new-arc-graphics-driver-does-one-thing-nvidia-hasnt-been-able-to-do/index.html); [S] [Guru3D](https://www.guru3d.com/story/intel-xess-3-brings-multiframe-generation-to-all-xess-2-games/); [S] [Guru3D: SDK](https://www.guru3d.com/story/intel-ships-xess-30-sdk-with-multiframe-generation-support/); [S] [TechRadar](https://www.techradar.com/computing/gpu/intel-reveals-xess-3-with-multi-frame-generation-and-unlike-nvidias-mfg-it-works-on-older-gpus)

**Engine-level and open / portable upscalers**
- **TSR** (see Q6 for mechanism and costs). Screen percentages "lower than 50%" are only for >4K displays or "exceptional dynamic-resolution cases on consoles" — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)
- **Arm Accuracy Super Resolution (ASR, 2024)**: a mobile-optimised temporal upscaler "derived from AMD's FidelityFX Super Resolution 2 v2.2.2", **MIT** licensed — [V] [github.com/arm/accuracy-super-resolution](https://github.com/arm/accuracy-super-resolution). Claimed up to 53% higher fps and 20% lower power on Immortalis-G720 (secondary) — [S] [Neowin](https://www.neowin.net/news/arm-joins-the-super-resolution-bandwagon-with-accuracy-super-resolution/). There is a UE mobile plugin — [S] [Unreal Engine tech blog](https://www.unrealengine.com/tech-blog/bringing-stunning-visuals-to-ue-mobile-games-with-arm-accuracy-super-resolution)
- **Snapdragon GSR 1 / 2 (Qualcomm)**:
  - SGSR 1 "integrates upscaling and sharpening in one single GPU shader pass" — [S] [SnapdragonGameStudios/snapdragon-gsr](https://github.com/SnapdragonGameStudios/snapdragon-gsr)
  - SGSR 2 is a TAAU with a convert pass, an upscale pass and an optional sharpen pass. Qualcomm reports "an impressive 1ms cost using the **fragment shader variant**" on Adreno — [S] [Qualcomm blog: Introducing SGSR 2 (Oct 2024)](https://www.qualcomm.com/developer/blog/2024/10/introducing-snapdragon-game-super-resolution-2)
  - Whether the SGSR 2 source is in the public repo was not confirmed.
- **FSR 1 (2021)**: spatial EASU upscale plus RCAS sharpen, MIT, header-only with GLSL/HLSL paths — [M] [GPUOpen-Effects/FidelityFX-FSR](https://github.com/GPUOpen-Effects/FidelityFX-FSR). **CAS** contrast-adaptive sharpening (2019) — [M] [GPUOpen: FidelityFX CAS](https://gpuopen.com/fidelityfx-cas/). **NVIDIA Image Scaling** spatial upscaler and sharpener SDK — [M] [NVIDIAGameWorks/NVIDIAImageScaling](https://github.com/NVIDIAGameWorks/NVIDIAImageScaling)

**Vendor-locked vs open (summary from the above)**
- *Closed / vendor-locked*:
  - DLSS 4/4.5/5 (RTX tensor cores; MFG RTX 50 only) [V]
  - FSR 4/4.1 ML and Redstone ML components (RDNA 4; INT8 on RDNA 3). Leaked code aside, the ML upscaler is not officially open [S]
  - PSSR (PS5 Pro hardware) [V]
  - Switch 2 DLSS [S]
  - XeSS (Intel SDK) [S]
  - TSR (engine-specific, inside UE) [V]
- *Open, shader-portable*: FSR 1/2/3.1 (MIT) [V/M], Arm ASR (MIT) [V], Snapdragon GSR [S], CAS [M], NIS [M], SMAA [V], FXAA [M].

### Inferences
- **Browsers cannot use DLSS, FSR 4, XeSS or PSSR** (no vendor tensor-op access). The realistic web ladder, cheapest first:
  1. Native resolution with MSAA (forward renderer) plus RCAS/CAS.
  2. Dynamic resolution with a spatial upscaler: FSR 1 EASU+RCAS or SGSR 1, both single fragment passes that port directly to WebGL2/TSL.
  3. A temporal upscaler: a custom TAAU, the **SGSR 2 fragment-shader variant** (WebGL2-feasible, designed for mobile-class GPUs), or **FSR 2 / Arm ASR via WebGPU compute**. This is a heavy port (many compute passes; needs motion vectors, depth, reactive mask and jitter plumbing), but the license allows it.
- **Frame generation is not practical in browsers**: there is no control over swapchain pacing or flip metering, latency is added, and AMD's own floor is a 60 fps base. Treat it as out of scope.
- **Iso-ARPG**: a stable, slowly moving camera suits temporal upscalers (high history reuse). Particle and spell VFX are the failure case and need reactive masks or post-upscale compositing, and UI must be composited at output resolution after upscaling. DLSS 4.5's move to linear-space inference to keep bright neon colours points the same way: feed temporal passes linear HDR, protect highlights (e.g., luma-weighted or tonemapped accumulation, as FSR2's HDR flag implies), and do the look-defining compression in the final tonemap.
- **Low-end fallbacks used by the industry**: lighter models (Switch 2 tiny DLSS at about half cost; DLSS Model K on RTX 20/30; FSR 4.1 INT8 on RDNA 3), FSR2's FP32 path when FP16 is missing, lower TSR history percentage, and DRS. The same "quality tier" idea maps to web as MSAA → spatial → temporal tiers chosen by GPU benchmark at boot.

### Gaps
- DLSS execution-time tables (Programming Guide) were not fetched, so there are no ms numbers for DLSS SR, DLSS 4 or DLSS 4.5 per GPU.
- DLSS 5 shipping status as of Oct 2026 is unknown (only announcement coverage found), and sources disagree on hardware exclusivity.
- Whether DLSS 4.5 Dynamic MFG and 6× fully shipped by spring 2026 is reported only by secondary sources.
- XeSS 2 details (Dec 2024 launch of XeSS-SR/FG/XeLL, non-Intel FG support) and XeSS licensing were not verified. SGSR and NIS licence terms were not verified.
- FSR 4.1 on RDNA 3 article dates and the RDNA 2 "early 2027" timeline come from search summaries of secondary coverage.
- Path of Exile 2, Last Epoch and Titan Quest II upscaler and frame-gen support was not researched (search budget exhausted). For Diablo IV, only the patch 1.3.5 DLSS info was found.
- Whether the March 2026 PS5 Pro system toggle shipped as planned was not independently confirmed.

---

## Q8. Post-process pipeline ordering and typical ms budgets (1080p/1440p, console-class GPUs)

### Takeaway
The broadly agreed order is:
1. **Render resolution**: opaque → SSAO/SSR/denoisers → (exposure metering) → temporal AA/upscaler on **linear HDR**.
2. **Display resolution**: DoF → motion blur → bloom → exposure + tonemap + grade/LUT + vignette → film grain / CA → (spatial AA if no TAA) → UI.

UE deviates by running DoF *before* TSR. Published costs put temporal upscaling at about 0.2–0.5 ms for 1080p/1440p output on mid/high desktop GPUs and about 1.1–1.5 ms on PS5 for Fortnite's 4K target. FSR 3 frame generation costs 1.5–2.4 ms at 4K on a 7900 XTX. Authoritative per-pass console budgets for full 2024–2026 post stacks were not found.

### Cited Findings
- **AMD's placement guidance**: before FSR2 (render res): SSR, SSAO, denoisers, exposure (optional). After FSR2 (presentation res): film grain, chromatic aberration, vignette, tonemapping, bloom, depth of field, motion blur. Input must be linear. These are labelled "for guidance purposes only" — [V] [FSR2 README](https://github.com/GPUOpen-Effects/FidelityFX-FSR2)
- **UE ordering**: "Temporal Super Resolution happens after depth of field, so motion blur, bloom, and later passes are upscaled". Motion blur can take half-res input. Post-process material injection points (in order of the chain) are Scene Color Before DOF, After DOF, Translucency After DOF, Before Bloom, Replacing the Tonemapper, After Tonemapping — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)
- **COD:AW**: exposure is applied after bloom ("equivalent" to exposing first, given linearity). The overall frame budget is "16.6 ms for a 60 fps game" — [V] [iryoku.com](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare)
- **Frame generation and UI**: UI must be composited separately or detected so generated frames don't warp the HUD. FG prepare is dispatched during the upscale/TAA pass — [V] [GPUOpen: FSR 3](https://gpuopen.com/fidelityfx-super-resolution-3/)
- **Published cost anchors**:
  - FSR2 at 1080p/1440p output: 0.2–0.5 ms on RX 6800 XT-to-7900 XTX class, about 1–2.3 ms on Vega 56/RX 590 class — [V] [FSR2 README](https://github.com/GPUOpen-Effects/FidelityFX-FSR2)
  - TSR: 0.43–0.79 ms (Valley of the Ancient) and 1.5 ms effective on PS5/XSX in Fortnite — [V] [UE docs: TSR](https://dev.epicgames.com/documentation/en-us/unreal-engine/temporal-super-resolution-in-unreal-engine)
  - FSR 3 FG at 4K: 1.5–2.4 ms on 7900 XTX, 4.5–7.3 ms on 5700 XT — [V] [GPUOpen FSR 3](https://gpuopen.com/fidelityfx-super-resolution-3/)
  - SGSR 2: about 1 ms on Adreno with the fragment variant — [S] [Qualcomm](https://www.qualcomm.com/developer/blog/2024/10/introducing-snapdragon-game-super-resolution-2)
  - Exposure-fusion LTM: estimated <1 ms on previous-gen consoles at 1/4 res — [V] [Wronski](https://bartwronski.com/2022/02/28/exposure-fusion-local-tonemapping-for-real-time-rendering/)
  - Switch 2's tiny DLSS costs about half the standard model — [S] [Nintendo Life/DF](https://www.nintendolife.com/news/2025/10/digital-foundry-delivers-a-technical-breakdown-of-switch-2s-dlss)

### Inferences
- **Suggested order for a three.js ARPG** (forward, MSAA or TAA):
  1. Scene (RGBA16F, MSAA resolve).
  2. Optional TAA/TAAU, with VFX translucency composited *after* it.
  3. Bloom chain.
  4. Optional local exposure at 1/4 res.
  5. One "uber" final pass: exposure × bloom lerp → LTM apply → tonemap (AgX/Tony/ACES2-LUT) → grade LUT → vignette → grain/dither → sRGB encode.
  6. Spatial AA (SMAA/FXAA) only if neither MSAA nor TAA is used.
  7. RCAS if upscaling.
  8. UI.
  Gameplay-critical overlays (telegraph decals, outlines, health bars) should be drawn after tonemapping, or tagged to bypass bloom/LTM, so exposure changes never hide them.
- **Rough 1080p web budget targets** (inference, not sourced; to be measured in the lab by frame counts, not seconds):

  | Pass | Target |
  |---|---|
  | Final uber pass (tonemap + grade + dither) | ~0.1–0.3 ms |
  | Bloom (6 mips) | ~0.2–0.5 ms |
  | SMAA 1x / FXAA | ~0.3–1 ms |
  | TAA | ~0.3–0.8 ms |
  | LTM at 1/4 res | ~0.3–1 ms |
  | DoF | 1–2 ms (cinematics only) |
  | Motion blur | 0.5–1.5 ms (skip) |

  On an integrated or low-end GPU, multiply by about 2–4×. That is why the "quality tier" fallbacks in Q7 matter.
- The isometric camera makes DoF and motion blur the first passes to drop and LTM/bloom/tonemap the passes to protect, since they define the mood and readability.

### Gaps
- No verified per-pass ms numbers from 2024–2026 console titles (COD:AW slide timings inaccessible; no Digital Foundry or GDC frame-budget breakdowns fetched).
- No verified data on how isometric ARPGs (Diablo IV, PoE2) order or budget their post stacks.

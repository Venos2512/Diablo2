# Real-time lighting in AAA games and engines (2024–2026): GI, many-light direct lighting, shadows, reflections, AO/SSIL, denoising. Technique notes for a three.js (WebGL2/WebGPU) isometric ARPG

> Compiled 2026-10-19. Each Cited Findings bullet is a fact followed by its source. Tags: **[Mech]** = how it works, **[Ships]** = engines/games and year, **[Cost]** = hardware needs and ms, **[Ladder]** = fallbacks on low-end PC, consoles, Switch 2 and mobile, **[Web]** = web implementations found, **[Found.]** = an older foundational technique. Judgments about isometric/top-down relevance and web feasibility are in the Inferences sections. The shared web-search budget ran out partway through. Foundational-paper URLs I could not check are listed under Gaps, not cited. Three primary SIGGRAPH decks (id Tech 8 GI, Frostbite GIBS, HypeHype stochastic lighting) were read in full as extracted PDF text. They supply most of the hard millisecond numbers below.

## Q1. Global illumination: how Lumen, path tracing/ReSTIR, Ubisoft RTGI, id Tech 8, SVOGI, DDGI/RTXGI, surfel GI, Brixelizer/GI-1.0, neural radiance caches, Radiance Cascades and baked lightmaps/probes compare, and what dominates 60 fps console titles

### Takeaway
At 60 fps on 2025–26 consoles, approaches are split three ways:
- **Precomputed GI is still the cheapest default.** Lightmaps plus irradiance-probe grids are used in AC Shadows' base-PS5 performance mode and in Call of Duty. Battlefield 6 ships with no RT at all.
- **A few tech-forward engines run fully dynamic GI at 60 fps for about 1.4–3 ms.** They trace very few hardware rays into cached probe, surfel or spatial-hash structures: id Tech 8 (Doom: The Dark Ages, Indiana Jones) and Frostbite GIBS.
- **UE5 titles use Lumen, cut back for 60 fps.** It is usually software-traced or removed in 60 fps and Series S modes. Epic reportedly adds a cheaper, probe-based "Lumen Lite/Medium" in UE 5.8 aimed at Switch 2 at 60 fps.

Path tracing (ReSTIR plus hash or neural radiance caches plus ML denoisers) remains PC/RTX-only. For a WebGPU isometric ARPG, what transfers is the cache structures and the fallback layers, not hardware-RT tracing. Those are probe grids/irradiance volumes, world-space hash caches, screen-space radiance cascades and baked lightmaps.

### Cited Findings

#### Lumen (Unreal Engine 5)
- [Mech] Lumen has two tracing back-ends. Hardware RT traces triangles and can evaluate lighting at the hit ("Hit Lighting"). Software RT traces signed distance fields: per-mesh distance fields for the first 2 m, then the merged Global Distance Field. The Lumen Scene covers 200 m by default and can be extended to 800 m. HWRT-only "Far Field" (which needs HLOD) extends GI and reflections to 1 km. — [UE docs: Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Mech] Screen traces run first, followed by a more reliable world trace. Ray hits look up lighting in the Surface Cache: "cards" captured offline per static mesh, 12 cards per mesh by default. Skeletal meshes get only 6 cards around their pre-skinned bounds, so coverage degrades under deformation. Nanite speeds up the mesh captures, and surface-cache lighting updates are amortized over multiple frames. — [UE docs: Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Mech] "Final Gather Quality" controls the density of Lumen's screen probes; higher values cost more GPU time. — [Arm Learning Path: HWRT Lumen on Android](https://learn.arm.com/learning-paths/mobile-graphics-and-gaming/best-practices-for-hwrt-lumen-performance/8-lumen-general/)
- [Mech] Lumen computes indirect lighting "at a much lower resolution" than shading for real-time performance. — [UE docs: Lumen GI and Reflections](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine)
- [Mech] id Software lists Lumen's "Screen-Space Radiance Caching [Wright2021]" among the research it evaluated. — [Sousa, SIGGRAPH 2025 (id Tech 8 GI)](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Cost] The primary target is large open worlds at 60 fps on current consoles, using the High scalability level. The Epic level "produces around 8 milliseconds (ms) on next-generation consoles" for GI plus reflections at 1080p internal resolution, with TSR upscaling to near-4K, and is aimed at 30 fps. — [UE docs: Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Cost] Lumen uses HWRT when available and falls back to SWRT otherwise. HWRT "has significant scene update costs for scenes with more than 100,000 instances." — [UE docs: Lumen GI and Reflections](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine)
- [Ladder] Current docs list PS5, Xbox Series S|X and Switch 2 (not PS4/Xbox One).
  - SWRT needs DX12 SM6 and a GTX 1070 or better; HWRT needs RTX 2000+ or RX 6000+.
  - Lumen is also supported on Android Vulkan with the Mobile Renderer.
  - It is not supported with Forward Shading, VR, or lightmap-based static lighting.
  
  — [UE docs: Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Ladder] Arm publishes best practices for HWRT Lumen on Android devices. — [Arm Learning Path](https://learn.arm.com/learning-paths/mobile-graphics-and-gaming/best-practices-for-hwrt-lumen-performance/8-lumen-general/)
- [Limits] Known limitations from the docs:
  - Walls should be at least 10 cm thick to avoid leaking; thin and one-sided meshes are represented poorly.
  - World Position Offset is unsupported with SWRT.
  - Fast camera movement makes indirect lighting pop in.
  - Lighting changes fade in rather than switch; disabling the sun "can take multiple seconds to propagate."
  
  — [Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine); [Lumen GI and Reflections](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine)
- [Ladder] UE 5.6 (June 2025) promised HWRT improvements for Lumen GI that "maintain 60 Hz", plus device profiles tuned for 60 Hz on current-gen consoles. — [UE forums: 5.6 released](https://forums.unrealengine.com/t/unreal-engine-5-6-released/); [Wccftech](https://wccftech.com/unreal-engine-5-6-preview-out-now-epic-promises-vast-open-worlds-at-consistent-60hz/amp/)
- [Ladder] UE 5.6 was reported up to 25% faster GPU-bound and 35% faster CPU-bound than 5.4 on an RTX 5080 (secondary benchmark report). — [Geeknetic](https://www.geeknetic.es/Noticia/34940/Unreal-Engine-56-mejora-el-rendimiento-hasta-en-un-35-con-respecto-a-la-version-54.html)
- [Ships] The UE 5.6 Witcher 4 tech demo ran at 60 fps with ray tracing on a base PS5 (State of Unreal, June 2025).
  - CD Projekt Red stressed it is "a tech demo… not The Witcher 4 itself."
  - Epic said its RT now runs 2x faster than at UE5's launch.
  
  — [VGC](https://www.videogameschronicle.com/news/witcher-4-tech-demo-shows-the-game-running-at-60-fps-with-ray-tracing-on-base-ps5/); [TechSpot](https://techspot.com/news/108172-stunning-new-witcher-4-footage-runs-60fps-base.html). Skeptical take: [Push Square](https://www.pushsquare.com/news/2025/06/dont-expect-the-witcher-4-to-look-like-that-unreal-tech-demo-when-it-launches-on-ps5)
- [Ships] Black Myth: Wukong (Aug 2024): PS5 buyers get Lumen. PC adds optional "Full Ray Tracing" (path tracing) via NVIDIA's RTX branch of UE5, with ReSTIR GI for global lighting. — [PCGH](https://www.pcgameshardware.de/Black-Myth-Wukong-Spiel-72938/Specials/Benchmark-Test-Review-Tuning-Tipps-1453917/); [Igor's Lab](https://www.igorslab.de/en/can-it-run-black-myth-wukong-graphics-cards-on-the-verge-of-collapse-but-lots-of-gaming-fun/1/)
- [Ladder] Digital Foundry found (Aug 2025) that Wukong's Xbox Series X performance mode and all Series S modes omit Lumen. — [Pure Xbox](https://www.purexbox.com/news/2025/08/black-myth-wukong-analysis-shows-completely-different-visuals-on-xbox-compared-to-ps5)
- [Ladder] UE 5.8 (announced at Unreal Fest Chicago, June 2026) reportedly adds "Lumen Lite", also called "Lumen Medium Quality".
  - It reportedly uses irradiance fields with probe occlusion and is about 2x faster than high-quality Lumen.
  - It is meant to let GI-dependent games "run on Nintendo Switch 2 at 60 fps" and is planned as the default path for current handhelds; it is also supported on PC.
  - These are secondary press reports; Epic's own page returned 403 during this session.
  
  — [Digital Citizen](https://www.digitalcitizen.life/unreal-engine-5-8-adds-lumen-lite-to-help-switch-2-games-target-60fps/); [Digital Citizen (2)](https://www.digitalcitizen.life/unreal-engine-5-8-could-make-switch-2-ports-run-better-with-new-60fps-lumen-mode/); [VGC](https://videogameschronicle.com/news/epic-introduces-major-unreal-engine-5-update-that-runs-twice-as-fast-on-nintendo-switch-2); [tbreak](https://tbreak.com/unreal-engine-58-lumen-lite-nintendo-switch-2/)
- [Ladder] A Digital Foundry analysis (relayed by a secondary Russian report) found that Switch 2 UE5 ports (Cronos, Fortnite, Split Fiction) cannot unlock UE5's potential and that Nanite is often too taxing. — [VGTimes (RU)](https://vgtimes.ru/tech-and-hardware/133427-lumen-i-nanite-ostalis-za-bortom-analiz-pokazal-realnye-vozmozhnosti-switch-2-na-unreal-engine-5.html)

#### Path tracing with ReSTIR and radiance caches (NVIDIA RTX; PC only)
- [Ships] Cyberpunk 2077 RT Overdrive launched as a technology preview in April 2023 (patch 1.62). It initially targeted RTX 40-series cards; the RTX 3090 was limited to 1080p. — [Guru3D](https://www.guru3d.com/story/cyberpunk-2077-patch-update-introducing-rt-overdrive-path-tracing-technology-preview/)
- [Mech] In Overdrive, RTXDI lets thousands of emissive objects (neon signs, street lamps, headlights) cast ray-traced light. One unified path-traced algorithm replaced SSR, SSAO and the older GI. — [NVIDIA](https://www.nvidia.com/en-au/geforce/news/cyberpunk-2077-ray-tracing-overdrive-update-launches-april-11/)
- [Mech] GI moved to ReSTIR GI from the RTXDI SDK. Update 2.1 added Shader Execution Reordering and Opacity Micromaps. — [TweakTown](https://www.tweaktown.com/news/94755/cyberpunk-2077-ultimate-edition-sees-ray-tracing-overdrive-exit-preview-with-enhancements/)
- [Mech] A GDC 2024 session credits ReSTIR GI, radiance caching and DLSS Ray Reconstruction with better image quality at "near-zero performance cost." — [NVIDIA GDC24 session](https://www.nvidia.cn/on-demand/session/gdc24-gdc1002)
- [Mech] NVIDIA's RTXGI page features SHaRC in Cyberpunk 2077. — [NVIDIA RTXGI](https://developer.nvidia.com/rtxgi)
- [Ships] Alan Wake 2 (Oct 2023) has path tracing on PC. — [DSOGaming](https://www.dsogaming.com/news/alan-wake-2-will-have-full-ray-tracing-path-tracing-on-pc)
- [Ships] The 30 Jan 2025 Alan Wake 2 update made it the first game with RTX Mega Geometry (all RTX GPUs). It also added an Ultra RT preset with fully ray-traced reflections and higher-quality ray-traced indirect lighting. — [Remedy](https://www.alanwake.com/story/dlss-4-multi-frame-generation-out-now/)
- [Cost] Mega Geometry helps RTX 20/30-series cards most. Third-party testing on an RTX 4090 at 4K found about 13% lower VRAM use. — [Tom's Hardware](https://tomshardware.com/pc-components/gpus/testing-nvidias-rtx-mega-geometry-tech-vram-reducing-tech-a-leap-forward-for-path-traced-rendering); [TechSpot](https://www.techspot.com/community/topics/rtx-mega-geometry-improves-ray-tracing-performance-and-visuals-in-alan-wake-2.290584/)
- [Ships/Cost] Indiana Jones and the Great Circle (Dec 2024) shipped PC "Full Ray Tracing" (path tracing). It needs at least 12 GB VRAM, and an RTX 4070 was recommended for 1080p with DLSS. — [Neowin](https://www.neowin.net/news/indiana-jones-and-the-great-circles-path-tracing-update-is-out-now-for-high-end-nvidia-gpus/)
- [Ships/Cost] Indiana Jones' path tracing covers GI, AO, reflections and sun shadows. An RTX 4090 is smooth at 1080p, but 4K needs DLSS plus frame generation. — [DSOGaming benchmarks](https://www.dsogaming.com/articles/indiana-jones-and-the-great-circle-path-tracing-benchmarks/)
- [Ships] Update 3 (Feb 2025) extended Indiana Jones' path tracing to AMD and Intel GPUs and added DLSS 4 transformer Ray Reconstruction. — [TheSixthAxis](https://www.thesixthaxis.com/2025/02/21/indiana-jones-and-the-great-circle-update-3-adds-better-path-tracing-on-pc/)
- [Ladder] On consoles, Indiana Jones uses RTGI throughout. Xbox Series X runs at about 1800p (dynamic) and 60 fps, with some effects cut below PC "Low." — [TheSixthAxis (PS5 Pro)](https://thesixthaxis.com/2025/04/15/what-does-ps5-pro-give-you-in-indiana-jones-and-the-great-circle); [Tecnobits (DF summary)](https://tecnobits.net/indiana-jones-and-the-great-circle-funciona-a-60-fps-con-trazado-de-rayos-en-xbox-series-x-y-s/)
- [Ships] Doom: The Dark Ages (May 2025) "runs natively in ray traced mode" with RTGI and, on PC, RT reflections. A later PC patch added path tracing using NVIDIA's Spatial Hash Radiance Cache (SHaRC) and SER. On RTX, DLSS Ray Reconstruction replaces the traditional denoisers. — [NVIDIA](https://www.nvidia.com/en-us/geforce/news/doom-the-dark-ages-path-tracing-dlss-ray-reconstruction-update/)
- [Cost] The minimum PC spec requires a hardware-RT GPU (RTX 2060 Super or RX 6600, 8 GB) for 1080p/60 on Low. RT cannot be turned off. — [Neowin](https://www.neowin.net/news/doom-the-dark-ages-pc-system-requirements-ask-for-a-ray-tracing-supported-gpu-at-a-minimum/)
- [Research] "ReSTIR PT Enhanced" (Lin, Kettunen, Wyman; April 2026) averages a 2.74x speedup over four scenes. No game adoption is confirmed, and path tracing in shipped games is still rare (Alan Wake 2, Cyberpunk Overdrive, Wukong). — [Guru3D](https://www.guru3d.com/story/nvidia-previews-faster-restir-pt-enhanced-realtime-path-tracing-technology/); [PCGH](https://www.pcgameshardware.de/Grafikkarten-Grafikkarte-97980/News/Nvidia-Restir-PT-Enhanced-Pathtracing-Forschung-1526134/)

#### id Tech 8 mandatory RT GI (Doom: The Dark Ages 2025; an early iteration shipped in Indiana Jones 2024). The most detailed per-platform numbers found
All bullets in this subsection come from [Sousa, "Fast as Hell: idTech8 Global Illumination", SIGGRAPH 2025 Advances](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf) unless noted. The course page is [Advances 2025](https://advances.realtimerendering.com/s2025/index.html).
- [Why] The first requirement was "Performance > all else – Stable >= 60hz on all platforms." Low spec is "Xbox Series S and similar (RT capable hw)." Doom: The Dark Ages' levels total about 5000 km², 4–10x larger than Doom Eternal's.
- [The baked baseline it replaced] id Tech 7 used path-traced lightmaps encoded as 2-band SH.
  - Doom Eternal's final bakes took 4–10+ hours per level, with about a 4-day turnaround for all maps.
  - Each level used about 500 MB compressed on disk (about 5 GB uncompressed), with about 1.4 TB of network storage.
  - Resolution was cut to 2×2 texels per m².
  - Dynamic objects used irradiance volumes ("ambient probes", about 10 minutes to bake per level) plus box-projected reflection probes.
  - Reusing that pipeline for Doom: The Dark Ages was estimated at 16–100 hours per level and 44–110 GB of disk.
- [Mech] Each frame: update a world-space cascaded light grid, trace visibility rays from probes, shade the hits into a "world radiance cache", update irradiance volumes, run a final gather (cache lookups only, "0 shading"), denoise, then upscale. Transparencies use a froxel irradiance volume.
- [Mech] Irradiance volumes:
  - 16³ probes × 6 camera-centred cascades (12³ on lower specs), plus hand-placed 10³ local volumes.
  - Updates are interleaved: one cascade and one volume per frame.
  - Each probe traces 64, 32 or 16 visibility ray queries per frame, depending on platform.
  - The probe atlas is stored "similar to DDGI": octahedral, RGB9E5 irradiance plus RG16F visibility, 2560×1585, 64 MB (30 MB on lower specs), updated in 0.08 ms.
- [Mech] World radiance cache: a spatial hash (after Gautron 2020) in a 1D array, with 25 cm cells plus distance LODs, in 14 MB. About 20k entries are shaded per frame with the same lighting loop as raster and reused for N frames. Sampling the previous frame's irradiance volumes gives multiple bounces.
- [Mech] Final gather:
  - 1 ray per pixel (cosine-weighted, blue noise) at ½ or ¼ resolution.
  - Lookup order: the screen-space cache if the hit is on-screen and unoccluded, then the world radiance cache, then the irradiance-volume fallback.
  - Results are stored as 2-band SH per pixel (3× RGBA16F) to keep normal-map detail.
- [Cost] Shipped hotspot cost, serial / async:

  | Platform | Resolution | Serial | Async |
  |---|---|---|---|
  | Xbox Series S | 900p | ~2.11 ms | ~1.71 ms |
  | Xbox Series X | 1440p | ~1.9 ms | ~1.4 ms |
  | PS5 | 1440p | ~2.05 ms | ~1.55 ms |
  | PS5 Pro | 1800p | ~1.92 ms | ~1.82 ms |
  | PC, RTX 4080 | 4K | ~1.7 ms | n/a |

  The PS5 breakdown: world sampling 0.45, radiance cache 0.109, irradiance volumes 0.046, final gather 0.489, denoise 0.266, upscale 0.69 ms.
- [Ladder] RT reflections (about 2 ms) "ended up disabling on consoles for perf"; "SSR + Probes was always [the] fallback plan." Digital Foundry confirms consoles use SSR rather than RT reflections. — [Multiplayer.it (DF)](https://multiplayer.it/notizie/come-gira-doom-the-dark-ages-su-ps5-pro-xbox-digital-foundry-risponde.html)
- [Ladder] Digital Foundry (via Multiplayer.it): Xbox Series X runs 1440p–1080p dynamic at about 60 fps, and PS5 is roughly equal. Series S runs 864p–648p and sometimes struggles to hold 60. — [Multiplayer.it (DF)](https://multiplayer.it/notizie/come-gira-doom-the-dark-ages-su-ps5-pro-xbox-digital-foundry-risponde.html)
- [Ladder] Digital Foundry's 2025 Graphics of the Year award praised full RTGI that scales to Series S "without missing a frame-rate beat." — [Pure Xbox](https://www.purexbox.com/news/2025/12/xboxs-doom-the-dark-ages-wins-digital-foundrys-graphics-of-the-year-award)
- [Web] A community "idTech 8 style GI (FAST AS HELL)" in three.js/WebGPU reportedly took about five weeks and was incomplete. This is a social-media post seen via a Nitter mirror and is unverified. — [Cody Bennett (Nitter mirror)](https://nitter.kareem.one/CodyBennett)

#### Ubisoft Anvil (AC Shadows, Mar 2025) and Snowdrop (Avatar: Frontiers of Pandora, Dec 2023; Star Wars Outlaws, Aug 2024)
- [Mech/Why] Ubisoft's own explanation of the AC Shadows hybrid:
  - Anvil has used baked GI since AC Unity.
  - RTGI everywhere at 60 fps on console "would have meant we would not have had enough GPU budget." Baked GI's "relatively low GPU cost" left room for 60 fps.
  - Baked GI now supports dynamic seasons, with snow changing GI, and thinner walls.
  - RTGI handles scene changes such as destruction and "implicitly adds raytraced ambient occlusion."
  - The customizable Hideout "simply could not exist without raytraced global illumination."
  
  — [Ubisoft AC Shadows Tech Q&A](https://www.ubisoft.com/en-us/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
- [Ladder: PC] There are three PC modes: Selective (RT only in the Hideout), Standard (hardware RTGI) and Extended (RTGI plus RT reflections). GPUs without hardware RT use "a proprietary software-based raytracing approach"; the minimum is a GTX 1070, and the GTX 1080 Ti is supported. — [Ubisoft Tech Q&A](https://www.ubisoft.com/en-us/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
- [Ladder: consoles] AC Shadows console modes:
  - PS5 Performance (60 fps) uses Selective RT, meaning compute GI only in the Hideout. Fidelity (30) and Balanced (40) use Standard RT across the world.
  - PS5 Pro uses Extended RT in Fidelity and Balanced, and Standard RT in Performance.
  
  — [MP1st](https://mp1st.com/news/assassins-creed-shadows-graphical-modes-detailed-for-ps5-and-ps5-pro)
- [Ladder: consoles] Outside the Hideout, base-PS5 Performance mode uses precomputed lightmaps. — [GamePro](https://www.gamepro.de/artikel/assassins-creed-shadows-grafik-im-performance-modus,3429751.html)
- [Ladder: consoles] Reports conflict on PS5 Pro frame rate with RT. A DF summary says it drops at times and locks to 30 fps in the Hideout; Icy Veins says there is no sacrifice. — [Multiplayer.it (DF)](https://multiplayer.it/notizie/assassins-creed-shadows-ps5-pro-migliora-drasticamente-rispetto-ps5-base-digital-foundry.html) vs [Icy Veins](https://wp-prod.icy-veins.com/assassins-creed-shadows-ps5-vs-ps5-pro-a-huge-difference/)
- [Mech] SIGGRAPH 2025 talk "Ray Tracing the World of Assassin's Creed Shadows" (Leblanc, Conte):
  - RTGI for large dynamic open worlds, coping with translucent geometry, thin walls, small windows and dense vegetation.
  - Specular is handled inside the GI solution.
  - The latest version is a per-pixel RT pass that uses a probe volume as a cache for secondary-hit GI.
  - The deck (>10 MB) could not be fetched.
  
  — [Advances 2025 course page](https://advances.realtimerendering.com/s2025/index.html); [deck PDF](https://www.realtimerendering.com/advances/s2025/content/Advances%202025%20-%20Raytracing%20the%20world%20of%20Assassin's%20Creed%20Shadows.pdf)
- [Ladder: Snowdrop] In Avatar, ray tracing (GI, shadows, reflections) cannot be turned off. GPUs without RT cores run a compute-shader software fallback, which technical director Nikolay Stefanov called surprisingly fast, without giving figures. — [GameStar](https://www.gamestar.de/artikel/avatar-frontiers-of-pandora-raytracing,3371105.html); [PCGH](https://www.pcgameshardware.de/Avatar-Frontiers-of-Pandora-Spiel-73347/Specials/Avatar-Frontiers-of-Pandora-Snowdrop-Tech-Benchmarks-Test-1435474/2/)
- [Ladder: Snowdrop] The software fallback shows artifacts in dark areas and scales poorly on older GPUs. — [DSOGaming](https://www.dsogaming.com/?p=174452)
- [Ladder: Switch 2] Star Wars Outlaws on Switch 2 (Sept 2025) keeps ray tracing and is described as "Switch 2's first ray tracing game."
  - Lighting is coarser and sometimes too dark.
  - RT reflections are blurrier, and shadows are softer and blockier.
  - Volumetric fog and foliage are reduced.
  - It uses DLSS with dynamic resolution from a 720p (docked) or 540p (handheld) base and targets 30 fps.
  
  — [Nintendo Everything](https://nintendoeverything.com/star-wars-outlaws-frame-rate-resolution-switch-2/); [Pure Xbox](https://www.purexbox.com/news/2025/09/star-wars-outlaws-compared-across-switch-2-and-xbox-series-s-and-the-results-are-interesting)
- [Ladder: Switch 2] Series S has cleaner RTGI, while Switch 2 does better on reflections. — [Nintenderos (DF summary)](https://www.nintenderos.com/2025/09/un-port-extraordinario-asi-define-digital-foundry-star-wars-outlaws-para-nintendo-switch-2-en-su-analisis-tecnico/)

#### CryEngine (Kingdom Come: Deliverance II, Feb 2025)
- [Ladder] KCD2 offers a viable 60 fps performance mode on PS5 and Series X, plus a 30 fps 1440p fidelity mode on PS5. PS5 Pro delivers fidelity-mode quality at 60 fps via PSSR, and Series S makes stronger compromises. — [Push Square (DF)](https://www.pushsquare.com/news/2025/02/kingdom-come-deliverance-2-a-technical-powerhouse-on-ps5-pro-says-digital-foundry); [PSU](https://www.psu.com/news/kingdom-come-deliverance-2-runs-at-upscaled-4k-at-60-fps-on-ps5-pro-thanks-to-pssr/)
- I could not verify in this session that KCD2's GI is CryEngine's SVOGI (see Gaps).

#### Probe grids: DDGI / RTXGI and their derivatives in shipping engines
- [Mech] NVIDIA describes DDGI as a probe-based approach that gives multi-bounce indirect lighting without lightmaps or baking. RTXGI is enabled in Portal with RTX. — [NVIDIA RTXGI](https://developer.nvidia.com/rtxgi)
- [Mech] RTXGI 2.0 added NRC and SHaRC. SHaRC uses no neural network and runs on any DXR/Vulkan RT-capable GPU. NRC is listed as experimental. — [NVIDIA RTXGI](https://developer.nvidia.com/rtxgi); [NVIDIA RTX Kit](https://developer.nvidia.com/rtx-kit)
- [Ships] id Tech 8 stores its irradiance volumes "similar to DDGI." — [Sousa](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Ships] Frostbite GIBS moved its clipmap probes to an octahedral layout with software interpolation, "very similar to DDGI", and uses variance-depth attenuation to stop dark leaks. — [Apers, SIGGRAPH 2024](https://advances.realtimerendering.com/s2024/content/EA-GIBS2/Apers_Advances-s2024_Shipping-Dynamic-GI.pdf)
- [Ships] UE 5.8's Lumen Lite reportedly uses irradiance fields with probe occlusion (secondary report). — [Digital Citizen](https://www.digitalcitizen.life/unreal-engine-5-8-adds-lumen-lite-to-help-switch-2-games-target-60fps/)
- [Baked-probe variant] Call of Duty's "Neural Light Grid" (Warzone, MW3) uses machine learning to remove irradiance-volume leaking on "very constrained platforms" without re-authoring the lighting. It has shipped to millions of players. — [Advances 2024 course page](https://advances.realtimerendering.com/s2024/index.html)

#### Surfel GI: EA SEED / Frostbite GIBS
Unless noted, bullets here come from [Apers, "Shipping Dynamic GI in Frostbite", SIGGRAPH 2024](https://advances.realtimerendering.com/s2024/content/EA-GIBS2/Apers_Advances-s2024_Shipping-Dynamic-GI.pdf).
- [Mech] Surfels (disk-shaped surface elements) spawn from the G-buffer and cache irradiance. Hardware RT updates both the surfels and a DDGI-like clipmap probe volume. The probes light transparents and characters, act as a cache for short surfel rays, and fill gaps where surfels have not spawned yet. — [EA Technology](https://www.ea.com/technology/news/gibs-lighting-ea-sports-college-football-25)
- [Ships] EA Sports College Football 25 (July 2024; current-gen consoles only; 130+ stadiums, each with time of day) relies fully on GIBS for indirect diffuse. EA said GIBS will also be used in an upcoming open-world action game. — [EA SIGGRAPH 2024](https://ea.com/seed/news/ea-technology-siggraph-2024)
- [Ladder] Skate targets mobile through PC: lower-end devices use Enlighten plus GiGrid probes, and GIBS scales up on high-end devices.
- [Cost] GIBS averaged 6–7 ms in 2021 (on PS5).
- [Cost] A 2024 Skate flythrough on Xbox Series X at 1440p native (60 fps target, at most 200k rays per frame, about 100k surfels, about 25k probes) averaged 3.2 ms (4 ms peak).
- [Cost] After optimizations, the average fell to 2.5 ms and never exceeded 3 ms. The optimizations were offline BLAS (+15% traversal), selective rebraiding (+5%), shortening rays to 20 m with a probe fallback (surfel time down about 60%), and reading shadow maps instead of tracing shadow rays (probe time down 34%).
- [Cost] Probe budget: at most 100k probes in 100 MB (about 1 KB each: 6×6 irradiance, 14×14 depth). A ray budget of about 100k means only about 6k probes update per frame, chosen by priority.
- [Cost] The RT scene excludes alpha-tested geometry (no vegetation) and uses one simplified albedo per mesh-material.
- [Ladder] CFB25 has only a 2 ms budget at 60 Hz. GIBS therefore converges during a 30 Hz preload and is frozen during gameplay, so it only applies cached lighting.
- [Ladder] On Xbox Series S, all of GIBS, including RT resources, fits in 500 MB.

#### AMD Brixelizer GI / GI-1.0 (compute, no hardware RT)
- [Mech] Brixelizer builds sparse distance fields from triangle geometry in real time, as cascades of 64³ voxels with 8³ "bricks."
  - Brixelizer GI is "a simplified implementation of AMD GI-1.0", "implemented in compute without hardware-accelerated ray-tracing", on DX12/Vulkan and GCN or newer.
  - Because distance fields carry no material data, it keeps a radiance cache fed from the previous frame's output, which gives multi-bounce for free.
  - It outputs denoised diffuse and specular GI, with optional lower-resolution modes.
  
  — [GPUOpen Brixelizer](https://gpuopen.com/fidelityfx-brixelizer/); [GDC 2024 slides](https://gpuopen.com/download/GDC2024_GI_with_AMD_FidelityFX_Brixelizer.pdf)
- [Limits] Brixelizer GI initially did not support alpha-clipped foliage; AMD has a follow-up series on adding it. — [GPUOpen foliage series](https://gpuopen.com/learn/brix-foliage-gi/brix-foliage-gi-index/)
- [Ships] It is MIT-licensed and shipped in SDK 1.1 (July 2024); v1.1.4 dates from May 2025. AMD names no shipped game and publishes no ms figures. — [GPUOpen](https://gpuopen.com/fidelityfx-brixelizer/)

#### Neural / learned radiance caches
- [Ships] NVIDIA calls NRC the first "neural shader in games," in the Half-Life 2 RTX demo (Mar 2025). It is a grid of small networks across screen and world space, trained on live gameplay. NVIDIA claims it runs up to 15% faster. — [NVIDIA](https://www.nvidia.com/en-gb/geforce/news/rtx-remix-half-life-2-rtx-demo-launching-march-18)
- [Ships] AMD FSR Radiance Caching is in Preview (SDK 2.1, Dec 2025). It is an online-trained ML cache for multi-bounce GI with Monte Carlo path tracing, restricted to RX 9000 / RDNA 4. — [GPUOpen FSR Redstone](https://gpuopen.com/learn/welcome-amd-fsr-redstone-amd-fsr-sdk-21-available/)

#### Radiance Cascades (Path of Exile 2, early access Dec 2024). Most relevant GI precedent for a top-down ARPG
- [Mech] "Penumbra hypothesis": nearby light needs fine spatial and coarse angular resolution, and distant light the reverse. Each cascade doubles interval length and ray count while probes get sparser. — [80.lv](https://80.lv/articles/asbjorn-lystrup-s-sticky-slime-simulation-gets-better-lighting/); [jason.today/rc](https://jason.today/rc)
- [Mech] Formal criterion: for a shell [a, b], spatial resolution Δs = a and angular resolution Δω = 1/b. — [Osborne & Sannikov 2024](https://arxiv.org/abs/2408.14425v1)
- [Ships] Grinding Gear Games senior programmer Alexander Sannikov introduced the technique in November 2023. — [80.lv](https://80.lv/articles/asbjorn-lystrup-s-sticky-slime-simulation-gets-better-lighting/)
- [Ships] PoE2's rendering talk at ExileCon 2023 describes a "Cascade 2d + 1d (espace image)", i.e. built in screen space. — [LIRIS deck (FR)](https://origami.projet.liris.cnrs.fr/topics/gdl/gdl_talk_84/radiance_cascades.pdf)
- [Ships] A 2025 Chalmers thesis says the ideas were "first presented by Alexander Sannikov for use in Path of Exile 2." — [Chalmers ODR](https://odr.chalmers.se/items/9e42007a-bb60-440f-ba28-04410822758f/full)
- [Ships] Sannikov's paper is on GitHub and was never formally published. — [GitHub repo](https://github.com/Raikiri/RadianceCascadesPaper)
- [Cost] I found no official PoE2 ms figure. The Chalmers thesis implemented screen-space RC plus visibility-bitmask GI for a fixed-camera game (As We Descend, Box Dragon).
  - It costs 2 / 6 / 26 ms at low / medium / high settings (GPU not stated) and uses 0.03–3.9 GiB.
  - Off-screen content "cannot contribute or occlude lighting."
  - It flickers on small movements and shows upscaling artifacts.
  
  — [Chalmers ODR](https://odr.chalmers.se/items/9e42007a-bb60-440f-ba28-04410822758f/full)
- [Cost] A weakly sourced third-party guide claims PoE2's GI is among the heaviest settings and that turning it off gains about 32% fps. — [IQON](https://iqondigital.com/zh/learn/games/optimize-path-of-exile-2-performance)
- [Limits] Standard RC struggles with distant small lights and produces interpolation artifacts. — [Holographic RC (2025)](https://arxiv.org/abs/2505.02041v1)
- [Research] Leading RC implementations are 2D or screen-space. A 2026 preprint proposes a 3D world-space variant ("Split Radiance Cascades") using sparse probes; its status is unverified. — [arXiv 2607.20384](https://arxiv.org/pdf/2607.20384)
- [Research] The LIRIS deck notes that 3D work uses spatial hashing plus hardware RT. — [LIRIS deck](https://origami.projet.liris.cnrs.fr/topics/gdl/gdl_talk_84/radiance_cascades.pdf)
- [Web] An interactive WebGL 2D RC tutorial reaches noise-free results at a cost comparable to about 16 naive rays per pixel. It is 2D only and shows ringing artifacts. — [jason.today/rc](https://jason.today/rc)
- [Web] A WebGPU 2D RC example uses 6 cascades, a jump-flood distance field and RGBA16F. — [VGPU examples](https://vgpu.labs.vercel.dev/examples)

#### Baked lightmaps + light probes / irradiance volumes (still the cost floor)
- [Cost/Ladder] AC Shadows' baked GI has a "relatively low GPU cost" that enables 60 fps on consoles. — [Ubisoft Tech Q&A](https://www.ubisoft.com/en-us/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
- [Ships] Frostbite maintains Flux (fully precomputed), Enlighten (partial dynamic updates) and GiGrid (streamed irradiance probes). Authoring them is costly, and they are limited in open worlds, destruction and user-generated content. — [Apers](https://advances.realtimerendering.com/s2024/content/EA-GIBS2/Apers_Advances-s2024_Shipping-Dynamic-GI.pdf)
- [Ships] Unity 6 Adaptive Probe Volumes:
  - Probes are placed automatically by geometry density.
  - "Lighting Scenarios" can be blended at runtime (originally HDRP-only, now also URP), and Sky Occlusion handles time of day.
  - Only probe data blends; lightmaps and lights must be handled manually.
  
  — [Unity blog](https://unity.com/blog/engine-platform/new-ways-of-applying-global-illumination-in-unity-6); [URP docs](https://docs.unity3d.com/Manual/urp/probevolumes-concept.html); [Unity roadmap](https://activation.unity3d.com/roadmap/2557-apv-improvements-and-changes)
- [Ships] Battlefield 6 (Oct 2025) launched with no ray tracing. Ripple Effect's technical director said the effort went into "making the game as optimized as possible for the default settings." — [Insider Gaming](https://insider-gaming.com/battlefield-6-no-ray-tracing-might-not-get-it/); [TechRadar](https://www.techradar.com/gaming/battlefield-6-will-be-better-for-everyone-thanks-to-the-xbox-series-s)
- [Web] PlayCanvas's runtime lightmapper bakes lightmaps at app start "in a few hundred milliseconds", including baked AO and environment light. The docs suggest 5–20 bake samples. — [PlayCanvas docs](https://developer.playcanvas.com/user-manual/graphics/lighting/runtime-lightmaps/); [GameFromScratch](https://gamefromscratch.com/playcanvas-add-runtime-lightmap-generation/)

#### Isometric ARPG reference point: Diablo IV
- [Ships] Diablo IV PC patch 1.3.5 (26 Mar 2024) added:
  - Ray-traced sun shadows.
  - RT reflections on ponds and mirrors. Blizzard's example shows an off-screen rock face appearing in a reflection.
  - Improved AO, now on all platforms.
  - Contact shadows extended to "all player characters, NPCs and Monsters" at the highest settings.
  
  — [Blizzard](https://news.blizzard.com/diablo4/24077218/)

### Inferences
- **What dominates 60 fps console titles in 2025–26:**
  - There is no single winner, but there is a clear pattern. Cross-gen, multiplayer and broad-market titles keep baked lightmaps plus probe grids: AC Shadows' 60 fps mode, Call of Duty with ML-cleaned irradiance volumes, Battlefield 6 with no RT.
  - The titles that ship dynamic GI at 60 fps converge on the same recipe. They use very few rays: id Tech 8 traces 16–64 rays per probe for one cascade per frame, and GIBS caps rays at 100k–200k per frame.
  - Those rays feed persistent world-space caches: probe grids, surfels, spatial hashes.
  - A low-resolution (½–¼) final gather reads the caches, followed by cheap bilateral and temporal filtering.
  - The total stays around 1.4–3 ms on PS5/XSX.
  - Path tracing appears only on PC.
- **What transfers to WebGPU without hardware RT:**
  - The cache and lookup halves of these pipelines transfer directly: octahedral probe atlases (RGB9E5/RG16F-style), clipmap probe cascades, spatial-hash caches, a screen-space-first lookup chain, ½–¼-resolution gather plus bilateral upsample, and SH storage.
  - The visibility half needs a substitute for hardware RT. Options are tracing distance fields or voxels in compute (the Brixelizer/Lumen-SWRT approach), tracing screen-space or depth-buffer heightfields (the Radiance Cascades approach), or baking the visibility or probes offline (the id Tech 7 / Call of Duty approach).
- **Isometric/top-down relevance:**
  - A fixed-pitch ARPG camera keeps most emitters and occluders that matter on screen. That is exactly the condition the screen-space RC thesis targeted ("mostly fixed camera, keeps all relevant scene content on screen"), and PoE2 shipped a 2D+1D screen-space cascade.
  - Screen-space GI is therefore far more viable for this game than for a first-person game.
  - The main failure case is spell lights or fires just off-screen popping in when they enter the view. A guard band (GI buffers rendered somewhat larger than the viewport) is the usual mitigation.
- **World-space probes for a 2.5D playfield:**
  - An ARPG playfield is mostly 2.5D, so a camera-following probe grid with only 1–3 vertical layers is cheap. Frostbite similarly reduced probe density in height for Skate.
  - For example, 64×64×2 probes is about 8k probes, close to GIBS's ~6k-per-frame update budget.
  - Probes could be baked per dungeon tile and blended (Unity APV "scenarios" style), or updated incrementally with compute SDF tracing.
- **Baked GI fits a gothic dungeon ARPG well.** Static rooms get high-quality lightmaps or probes, and dynamic spell lights add only direct light. Procedurally assembled levels make unique lightmaps harder; per-tile bakes or runtime baking (PlayCanvas-style) are the web-proven fallbacks.
- **Mandatory-RT designs (Doom: The Dark Ages, Avatar, AC Shadows' Hideout) are not portable to the web as-is.** The equivalent of their "software fallback" is the web baseline.

### Gaps
- I could not verify that Kingdom Come: Deliverance II uses CryEngine SVOGI, or find its cost; no SVOGI-specific source was retrieved before the search budget ran out.
- No published console ms figures were found for Lumen High (60 fps) or SWRT vs HWRT. Epic's docs give only the "around 8 ms" Epic-level figure.
- The AC Shadows SIGGRAPH 2025 deck (>10 MB) could not be fetched, so its costs and probe details are missing.
- No official ms cost or implementation detail from Grinding Gear Games for PoE2's Radiance Cascades GI was found; the ExileCon 2023 attribution comes via a French academic deck and a thesis.
- Diablo IV's base (non-RT) GI method was not found.
- I did not find whether Avatar, Outlaws or Black Myth: Wukong run RTGI in their 60 fps console modes.
- The DDGI JCGT paper page rendered empty (JavaScript-only), so its original costs are not cited.
- Witcher 3 next-gen's use of RTXGI is unverified.
- Lumen Lite/Medium details rest on secondary press; Epic's 5.5/5.7/5.8 release pages returned 403.
- Skate's release status after Aug 2024 was not checked.

## Q2. Direct lighting with many lights: tiled/clustered forward+ and deferred culling, ReSTIR DI, UE5 MegaLights, LTC area lights, and light budgets in practice

### Takeaway
Tiled or clustered light binning (Forward+ or deferred) remains the universal raster backbone, with hard per-cell and per-camera caps in practice. id Tech's world-space grid caps 64 ids per cell, Unity URP Forward+ caps 256 visible lights per camera on desktop and 32 on mobile, and PlayCanvas caps 255 lights per cell.

The 2024–26 frontier is stochastic direct lighting, whose cost stays fixed regardless of light count:
- **ReSTIR/RTXDI**, in PC path tracing.
- **UE5 MegaLights**, which uses ray-traced shadow rays, targets consoles and is Beta in 5.7.
- **HypeHype's raster-only Stochastic Tile-Based lighting**, which runs on $99 phones using only pixel shaders.

HypeHype's approach is the most transferable to WebGL2/WebGPU. Its design brief (lights spawned when enemies die, 50 shadowed lights in a room) mirrors ARPG spell lighting.

### Cited Findings

#### Clustered / tiled binning ([Found.] Olsson 2012 / Doom 2016, still current)
- [Ships] id Tech 7 applied lights, decals and reflection probes through tile/cluster binning, citing Olsson 2012, Sousa 2016 and Geffroy 2020. — [Sousa 2025](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Ships] id Tech 8 adds a world-space "cascaded light grid" because frustum clusters cannot light ray-traced hits or per-vertex-lit particles outside the frustum.
  - The grid is 16³ cells × 8 exponential cascades; the first cascade spans 32 m.
  - Each cell holds at most 64 ids (lights, reflection probes, decals).
  - It uses 30 MB and costs about 0.2 ms on consoles and about 0.1 ms on PC (one async compute dispatch, hierarchical coarse-then-fine culling with flat bit arrays).
  - Retail limits are 4k lights and 30k decals.
  
  — [Sousa 2025](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Budget] Unity URP lighting limits:
  - URP Forward allows 9 real-time lights per object (1 main plus 8 additional).
  - Forward+ removes the per-object limit but keeps a per-camera visible-light limit: 256 on desktop (it affects Lit-shader compile time), and 1 main plus 32 additional lights on mobile.
  - Over the limit, Unity disables lights, which can cause shadow flicker.
  
  — [URP rendering paths](https://docs-alpha.unity3d.com/Manual/urp/rendering-paths-introduction.html); [URP known issues](https://docs.unity3d.com/Manual/urp/known-issues.html); [Forward+ limitations](https://docs.unity3d.com/Manual/urp/rendering/forward-plus-rendering-path-limitations.html); [URP shadows troubleshooting](https://docs.unity3d.com/Manual/urp/shadows-troubleshooting-urp.html)
- [Limits] HypeHype's critique of tiled deferred:
  - Cost scales linearly with lights per tile.
  - Silhouettes produce high per-tile counts even in simple scenes.
  - Per-tile caps cause "flickering tile artifacts."
  - Precise tile culling is costly.
  
  — [HypeHype SIGGRAPH 2025 notes](https://www.advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- [Web] PlayCanvas clustered lighting:
  - It is the default since engine v1.56 and covers omni and spot lights; directional lights bypass it.
  - Shadows and cookies work with clustered lights.
  - Defaults: at most 255 lights per cell, a 2048 cookie atlas, and PCF3 shadow filtering. Area lights (rectangle, disk, sphere) have an opt-in toggle.
  
  — [PlayCanvas clustered lighting](https://developer.playcanvas.com/user-manual/graphics/lighting/clustered-lighting/); [PlayCanvas LightingParams API](https://api.playcanvas.com/engine/classes/LightingParams.html)
- [Web] toji's WebGPU clustered-forward renderer uses compute-shader light culling. The author calls it a use case "that wasn't practical in WebGL." — [README](https://github.com/toji/webgpu-clustered-shading/blob/main/README.md)
- [Web] On the three.js forum, 1024 point lights on an RTX 4090 ran at about 50 fps with a naive loop and about 240 fps (monitor cap) with clustered binning. — [three.js forum](https://discourse.threejs.org/t/dr-strangelight-or-how-i-learned-to-stop-worrying-and-love-the-cluster/23104?page=2)
- [Web] cl2 does clustered lighting in WebGL without compute, by assigning lights to clusters through the rasterizer. — [cl2 listing](https://awesome.ecosyste.ms/projects/github.com%2Fwizgrav%2Fcl2)
- [Web] The three.js "Shade" WebGPU demo lists clustered lighting and CSM; there is a separate forum thread on clustered rendering in WebGPU. — [Shade thread](https://discourse.threejs.org/t/shade-webgpu-graphics/66969/91); [Clustered rendering on WebGPU](https://discourse.threejs.org/t/clustered-rendering-on-webgpu/81042)

#### ReSTIR DI / RTXDI (hardware RT)
- [Ships] RTXDI in Cyberpunk 2077 Overdrive lets thousands of emissive objects cast ray-traced light. — [NVIDIA](https://www.nvidia.com/en-au/geforce/news/cyberpunk-2077-ray-tracing-overdrive-update-launches-april-11/)
- [Ships] NRD's RELAX denoiser was "designed for RTXDI." — [NRD](https://github.com/NVIDIA-RTX/NRD)
- [Cost] HypeHype's evaluation of ReSTIR (Bitterli et al.): per-pixel uniform light sampling plus spatiotemporal resampling is cache-unfriendly and bandwidth-heavy, and per-pixel light-type divergence hurts coherence, making it expensive on mobile. — [HypeHype notes](https://www.advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- [Cost] HypeHype's devlog says ReSTIR, ReGIR and similar methods were not well suited to real-time lighting on mobile. — [HypeHype devlog](https://hypehype.com/en/news/devlog-local-lights)
- [Research] NVIDIA research (2025): "Many-Light Rendering Using ReSTIR-Sampled Shadow Maps" renders full-resolution shadow maps for a ReSTIR-selected subset of lights, a raster-friendly alternative to shadow rays. — [NVIDIA Research](https://research.nvidia.com/labs/rtr/publication/zhang2025many-light)

#### UE5 MegaLights (UE 5.5 Experimental, then 5.7 Beta)
- [Mech] MegaLights is stochastic direct lighting.
  - It importance-samples lights and traces a fixed number of rays per pixel toward the important ones.
  - Each ray starts as a short conservative screen-space ray; if that fails, it continues with hardware or software RT from the last valid position.
  - "Ray guiding" sends samples toward likely-unoccluded lights.
  
  — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
- [Mech] It replaces shadow maps, distance-field shadows, RT shadows, deferred light evaluation, volumetric-fog light evaluation and VSM projection.
  - RT shadowing "doesn't add any extra cost per light" but uses the simplified RT scene.
  - Per-light VSMs remain an option that "should be used sparingly."
  
  — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
- [Cost] Cost is "mostly constant" but scales with internal resolution, DownsampleMode, NumSamplesPerPixel, RT-scene complexity and overlapping lights. Front-layer translucency can roughly double the cost. No ms figures are given. — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
- [Ladder] MegaLights targets PS5, Xbox Series X|S and RT-capable PCs.
  - It is not supported on mobile, Switch, PS4 or Xbox One, and is incompatible with the Forward renderer.
  - Water, clouds and heterogeneous volumes are unsupported, and directional lights are off by default.
  
  — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
- [Ships] SIGGRAPH 2025 (Narkowicz and Costa) presented "orders of magnitude more dynamic and shadowed area lights" with RT soft shadows on current consoles. — [Advances 2025](https://advances.realtimerendering.com/s2025/index.html)
- [Ships] UE 5.7 (Nov 2025) moved MegaLights to Beta. It adds directional lights, Niagara particle lights, translucency and hair, plus resolution-scale and update-rate controls. — [80.lv](https://80.lv/articles/unreal-engine-5-7-preview-released); [Guru3D](https://www.guru3d.com/story/unreal-engine-57-released-with-new-procedural-content-generation-and-more-features/); [Unreal Source](https://unrealsource.com/d/unreal-engine-5-7-is-now-available)
- [Ladder: mobile] Arm made an unofficial port on the UE 5.7 branch for the Mali-G1, requiring Vulkan SM5 and hardware ray queries.
  - It renders more than 190 shadow-casting point lights at about 41 fps (2 spp, downsample 2), versus about 8 fps with traditional deferred, roughly 5x.
  - The result is "slightly noisier," and the sun is kept on shadow maps.
  
  — [Arm community blog](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/lighting-at-scale-bringing-hundreds-of-dynamic-lights-to-mobile-with-unreal-megalights)

#### HypeHype Stochastic Tile-Based (STB) lighting (SIGGRAPH 2025): raster-only, budget phones to PC
All bullets in this subsection come from the [HypeHype SIGGRAPH 2025 notes](https://www.advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf) unless noted.
- [Mech] The pipeline:
  - The CPU culls lights to the field of view.
  - Big tiles (128×128 px) each pick 16 distinct lights using Stratified Reservoir Sampling (A-Chao weighted reservoir sampling) with a cheap PDF: omni-light illuminance at the tile's depth segment, taken from a hierarchical min/max depth buffer.
  - Small tiles (256 px, interleaved over 32×32 px footprints, with stochastic bilinear blending between big tiles) resample 1–4 lights with a better PDF: shadowed illuminance times Lambert plus Blinn-Phong at 4 sample points.
  - A deferred shadow pass evaluates each 2×2 quad (8-bit terms).
  - A lighting pass accumulates Lambert plus GGX for those 1–4 samples.
- [Mech] Everything is written as pixel shaders to suit tile-based mobile GPUs and framebuffer compression, in fp16. Compute versions are listed as future work.
- [Cost] Memory is tiny at 1080p: big-tile reservoirs fit in a 60×36 px render target, small-tile reservoirs in 120×68 px (32–128 KB), and shadow terms take 0.5–2 MB.
- [Cost] Against the old sun-only lighting, 1 spp adds 0.66 ms on an Adreno 610 ($99 phone, about 15 GB/s and about 250 GFLOP/s) and about 0.35 ms on an Adreno 830 and an RTX 4070.
- [Cost] With 50 lights in view, it adds 1.5 ms on the budget phone and about 0.5 ms on the high-end phone and the laptop. Big-tile sampling stayed at 0.02 ms even with 500 lights.
- [Design driver] The system must survive random light spawning ("every pink orb here is a light created whenever an enemy dies") and creators placing 50 shadowed lights in a room.
- [Limits] Opaque G-buffer surfaces only for now; translucency and volumetrics are future work. Noise grows with lights per region even though cost stays fixed.

#### LTC area lights and light budgets
- [Ships] PlayCanvas exposes rectangle, disk and sphere area lights when enabled. — [PlayCanvas API](https://api.playcanvas.com/engine/classes/LightingParams.html)
- [Ships] MegaLights covers rect, textured-rect (noted as "relatively expensive") and spot area lights. — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
- The underlying LTC technique itself is listed under Gaps.

### Inferences
- **ARPG spell lights fit the stochastic tile model.** They are many, short-lived and mostly small-radius, and the HypeHype scenario (lights on enemy death) is nearly identical.
- **Clustered forward on WebGPU (compute culling) is the safe baseline.** On WebGL2 it can be done with CPU-side or raster-based binning. Set explicit caps (e.g. 64–255 lights per cell, as id Tech and PlayCanvas do) and a priority rule (e.g. brightness × proximity) so overflow degrades gracefully instead of flickering.
- **STB lighting is a higher-ceiling option whose cost does not grow with light count.** It needs only render targets and pixel shaders, which suits WebGL2. Its costs are visible noise and a TAA that must tolerate noise.
- **MegaLights and ReSTIR need ray-traced shadow visibility.** They are not feasible without hardware RT, except as a ReSTIR-shadow-map hybrid.
- **The top-down camera helps light culling.** The view frustum is a shallow slab over the ground, so clusters can use few depth slices. A 2D grid of screen tiles plus a coarse height range is often enough; tile-based approaches like HypeHype's map well onto this.
- **Shadowed spell lights should be budgeted separately from unshadowed ones.** For example, a fixed number of shadow-atlas slots updated by priority, as HypeHype does.

### Gaps
- LTC (Heitz et al. 2016) and other area-light papers could not be verified with URLs after the search budget ran out. Note that three.js RectAreaLight uses LTC, but that is outside this note's scope.
- Olsson 2012 and Doom 2016 are cited only second-hand through Sousa's references.
- MegaLights console ms costs are unknown; the SIGGRAPH 2025 MegaLights deck is over 10 MB and could not be fetched.
- I found no published per-scene light budgets for Diablo IV or PoE2.
- I found no WebGPU or WebGL implementation of HypeHype STB or ReSTIR DI.

## Q3. Shadows: CSM and its modern improvements, UE5 Virtual Shadow Maps and page caching, static/dynamic caching, RT shadows, screen-space/contact shadows, PCSS/soft shadows, ESM/VSM/EVSM/MSM filtering, capsule/distance-field shadows, baked shadow masks

### Takeaway
High-end UE5 projects moved to Virtual Shadow Maps: 16k virtual maps with page allocation, static/dynamic page caching and SMRT soft shadows. VSMs are designed for Nanite and are weak with many small local lights. MegaLights therefore moves local lights to ray-traced shadow rays.

Everyone else still uses shadow maps with heavy caching:
- **Sun:** cascaded shadow maps.
- **Local lights:** a shadow atlas holding spot maps and octahedral omni maps, split into static and dynamic maps, with updates load-balanced across frames.
- **Detail:** screen-space contact shadows (Bend Studio, Diablo IV, id Tech 8 POM shadows).
- **Filtering:** cheap PCF variants.

RT shadows are a PC/Pro-tier option, as in Diablo IV's sun shadows and Spider-Man 2 Pro's key light. For an isometric camera the bounded view footprint makes classic, tightly fitted, cached shadow maps plus contact shadows the right tool.

### Cited Findings

#### Cascaded / atlas shadow maps and caching (current practice)
- [Ships] HypeHype keeps the sun on cascaded shadow maps with a separate path. Local lights live in a dynamically managed 16bpp atlas:
  - Spots use standard projected maps; omnis use octahedral-mapped maps, rendered as a cube and remapped on copy with a 2 px border for PCF.
  - Maps are resized by distance to the camera.
  - Static maps contain only static geometry and update only when the light or its resolution changes; dynamic maps update constantly.
  - A priority queue load-balances updates across frames.
  - Filtering is 4-tap hardware PCF plus stochastic PCF (one gather per evaluation), with IES and angular falloff applied in the shadow pass.
  - PCSS, screen-space detail shadows and RT shadows are planned for high-end devices.
  
  — [HypeHype notes](https://www.advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- [Ships] Frostbite GIBS reads shadow maps instead of tracing shadow rays for secondary bounces where a light has one, cutting probe tracing time by 34%. — [Apers](https://advances.realtimerendering.com/s2024/content/EA-GIBS2/Apers_Advances-s2024_Shipping-Dynamic-GI.pdf)
- [Web] PlayCanvas supports shadows on clustered omni and spot lights, with PCF3 as the default filter. — [PlayCanvas clustered lighting](https://developer.playcanvas.com/user-manual/graphics/lighting/clustered-lighting/); [PlayCanvas API](https://api.playcanvas.com/engine/classes/LightingParams.html)

#### UE5 Virtual Shadow Maps
All bullets in this subsection come from [UE docs: Virtual Shadow Maps](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine) unless noted.
- [Mech] Each light gets a 16k×16k virtual shadow map split into 128×128 pages. Pages are allocated only where on-screen pixels need them, based on depth-buffer analysis.
  - Directional lights use clipmap levels 6–22, covering 64 cm up to about 40 km. Each level is 16k and covers twice the previous radius.
  - Spot lights use one 16k map with mips; point lights use six 16k cube faces.
- [Caching] Page caching is on by default.
  - Moving or rotating a light invalidates all of its pages; moving casters invalidate the pages they overlap.
  - WPO/PDO materials invalidate their pages every frame.
  - "Separate static caching" keeps static and dynamic depth apart.
- [Soft] Shadow Map Ray Tracing (SMRT) marches rays toward the light against the VSM, producing contact hardening. The Epic setting defaults to 8 rays, with 4–8 samples per ray; 0 rays gives hard shadows.
- [Cost/Limits] VSMs are "designed to be used with Nanite"; non-Nanite geometry is "much more expensive."
  - Scenes with many small local lights perform poorly.
  - Page-pool overflow corrupts shadows.
  - Supported on PS5, Xbox Series S|X and DX12/Vulkan PCs (NVIDIA Maxwell+, AMD GCN+, Apple M2+). The page does not mention mobile.
  - Epic recommends distance-field shadows for distant non-Nanite objects.
- [Ladder] MegaLights replaces VSM projection and shadow maps for local lights with RT shadow rays, keeping per-light VSM as an option. — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)

#### Ray-traced shadows
- [Ships] Diablo IV 1.3.5 (Mar 2024) enhances sun shadows with ray tracing. — [Blizzard](https://news.blizzard.com/diablo4/24077218/)
- [Ships] Club386's reviewer found Diablo IV's RT shadows soften with distance and preferred the sharper non-RT look in most cases. — [Club386](https://www.club386.com/diablo-4-shows-your-inner-demon-with-nvidia-ray-tracing-reflections)
- [Ships] Indiana Jones' path tracing covers sun shadows. — [DSOGaming](https://www.dsogaming.com/articles/indiana-jones-and-the-great-circle-path-tracing-benchmarks/)
- [Ships] Spider-Man 2's PS5 Pro "Fidelity Pro" mode (30 fps) adds an "RT Key Light Shadows" toggle. — [MP1st](https://mp1st.com/dlc-and-expansions/marvels-spider-man-2-update-1-004-webs-out-for-ps5-pro-support)
- [Cost] The NRD SIGMA shadow denoiser costs 0.40 ms (0.45 ms with translucency) on an RTX 4080 at 1440p. — [NRD](https://github.com/NVIDIA-RTX/NRD)

#### Screen-space / contact shadows
- [Ships] Days Gone (PS4, 2019) was "the first title to use this technique for sun light shadows." It complements shadow maps for small details. Bend Studio published the code, which shipped in "a number of other Sony titles," and gave a SIGGRAPH 2023 presentation. — [Bend Studio](https://www.bendstudio.com/blog/inside-bend-screen-space-shadows/)
- [Ships] At the highest settings, Diablo IV extends contact shadows from player characters only to all characters, NPCs and monsters. — [Blizzard](https://news.blizzard.com/diablo4/24077218/)
- [Ships] id Tech 8 adds POM contact shadows "for every light" plus a ray-marched directional-occlusion term, to recover detail missing from the RT acceleration structures. — [Sousa](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Ships] MegaLights traces screen space first. Arm warns that screen traces can create false shadows from meshes with shadow casting disabled. — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine); [Arm](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/lighting-at-scale-bringing-hundreds-of-dynamic-lights-to-mobile-with-unreal-megalights)

#### Filterable shadow maps ([Found.])
- [Mech] Moment Shadow Mapping (Peters and Klein, I3D 2015) stores four depth moments, so the map can be filtered with ordinary texture filtering and MSAA. It computes "the sharpest possible lower bound" on shadow intensity using 64 bits per texel, with a 16-bit quantization option. It is designed for "substantially higher quality" than variance shadow mapping. — [Moments in Graphics](https://momentsingraphics.de/I3D2015.html)

#### Distance-field shadows
- [Ships] UE recommends distance-field shadows for distant non-Nanite geometry alongside VSM, and MegaLights replaces them. — [UE docs: VSM](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine); [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)

#### Web
- [Web] Babylon.js 8.0 (Mar 2025) added IBL shadows contributed by Adobe, so environment lighting casts shadows. — [Microsoft Windows Developer blog](https://blogs.windows.com/windowsdeveloper/2025/03/27/announcing-babylon-js-8-0/)
- [Web] Babylon.js 9.26 extended IBL shadows to ShadowOnlyMaterial. — [GameDev.net](https://gamedev.net/news/babylonjs-9260-released-r5640/)

### Inferences
- **A fixed-pitch isometric camera needs no shadow virtualization.**
  - Its visible ground footprint is bounded and nearly constant in size.
  - One tightly fitted cascade (or two: near playfield plus a coarse outer one) gives high, stable texel density for the sun or moon. Stabilized snapping matters more than cascade count.
  - VSM-style 16k paging solves a first- and third-person far-distance problem this camera does not have.
- **Dungeon interiors are dominated by local lights: torches, braziers and spells.**
  - A HypeHype-style shadow atlas fits: static maps for torches that never move, a few dynamic maps for the player's light and big spells, octahedral omni maps, priority-scheduled updates and PCF.
  - Octahedral omni maps keep all point shadows in one 2D atlas. That likely matters on WebGL2, which as far as I know lacks cube-map arrays (verify).
- **Contact or screen-space shadows matter a lot from above.** Characters are small on screen, and without contact shadows they look like they float. Diablo IV invested exactly there by giving all characters, NPCs and monsters contact shadows. A Bend-style screen-space shadow pass for the main light is a cheap win and works on any API with depth-texture access.
- **Most small spell lights can stay unshadowed or use stochastic or tile-shared shadows.** HypeHype evaluates one shadow term per 2×2 quad.
- **Filtering choice:** stochastic PCF plus TAA is the current mobile-friendly default. MSM or EVSM-type filterable maps are an option for soft, wide penumbrae, at higher memory and bandwidth cost.

### Gaps
- No sources were verified, before the search budget ran out, for these topics: modern CSM refinements (SDSM, cascade caching/scrolling in specific games), PCSS originals, ESM/EVSM/VSM originals, UE capsule shadows, baked shadow masks (Unity Shadowmask, UE stationary lights), Unity HDRP PCSS/contact shadows, and the Babylon.js voxel-shadow feature.
- The Bend SIGGRAPH 2023 deck (algorithm details, costs) was not read.
- Diablo IV's non-RT shadow technique and its cost were not found.

## Q4. Reflections: SSR variants (stochastic, Hi-Z tracing), RT reflections, parallax-corrected probes, planar reflections, hybrid pipelines and their fallbacks

### Takeaway
The standard hybrid chain is: screen-space reflections (stochastic, Hi-Z-traced), then RT reflections where the budget allows, then box- or parallax-corrected reflection probes, then sky.

At 60 fps on consoles, RT reflections are often the first thing cut. Doom: The Dark Ages falls back to SSR plus probes on consoles, and RT reflections there would have cost about 2 ms. Insomniac's Spider-Man 2 is the notable exception, keeping RT reflections in every mode.

For a steep top-down camera, much of the content a floor or water surface should reflect lies off-screen (Diablo IV's RT showcase is precisely an off-screen rock face). SSR alone is therefore weak, and probes, planar reflections or stylized fakes carry more weight.

### Cited Findings
- [Mech] AMD FidelityFX SSSR:
  - Rays traverse a hierarchical depth buffer built with FidelityFX SPD, taking fewer, larger steps.
  - Rays are jittered for glossy surfaces, and a temporal denoiser accumulates the noisy result.
  - The traversal rate varies with roughness, from full rate for mirrors to quarter rate for glossy.
  - Most rays should finish within about 20 lookups, and a depth-thickness bias trades streaks against holes.
  - DX12/Vulkan, HLSL, MIT license.
  
  — [GPUOpen SSSR](https://gpuopen.com/fidelityfx-sssr/); [FidelityFX SDK manual](https://gpuopen.com/manuals/fidelityfx_sdk/techniques/stochastic-screen-space-reflections/)
- [Ships/Ladder] id Tech 7/8's specular chain:
  - SSR runs when possible, then RT, with a probe fallback selected by smoothness.
  - RT reflections have their own temporal upscale at ½ or ¼ resolution and cost about 2 ms.
  - They were disabled on consoles for performance and only run on very smooth surfaces.
  
  — [Sousa](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf); console SSR confirmed by [Multiplayer.it (DF)](https://multiplayer.it/notizie/come-gira-doom-the-dark-ages-su-ps5-pro-xbox-digital-foundry-risponde.html)
- [Mech/Ships] id Tech probes:
  - Box-projected cube maps (Czuba 2010) in BC6H cube arrays, applied through tile/cluster binning for opaque surfaces and through clusters or the light grid for transparents.
  - Bakes no longer wait on lightmaps.
  - Results are "re-fit" to the environment as (Reflections / ProbeIrradiance) × FrameIrradiance, removing "glowing corners" and picking up bounce colour; the froxel irradiance volume does the same for transparents.
  
  — [Sousa](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Mech, Found.] Parallax-corrected cubemaps intersect the reflection ray with a proxy (box or sphere) to correct the lookup direction. Multiple local cubemaps blend through influence volumes. The correction is only right for mirror-like surfaces and planar receivers, distorts with glossy normal perturbation, and the proxy must match the room. — [Lagarde (2012)](https://seblagarde.wordpress.com/2012/09/29/image-based-lighting-approaches-and-parallax-corrected-cubemap/)
- [Ships] Lumen reflections:
  - Screen traces run first, then RT.
  - Hits use surface-cache lighting by default, or "Hit Lighting" for quality.
  - Up to 64 bounces are possible with HWRT hit lighting (default 1, up to 8 in post-process settings).
  - Single-layer water is forced to mirror reflections.
  - HWRT uses the Nanite fallback mesh, so screen-trace mismatches can appear.
  
  — [UE docs: Lumen GI and Reflections](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine); [Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Ships] Spider-Man 2 (Oct 2023) has RT reflections in every mode, including 60 fps Performance; Digital Foundry measured 1008p–1440p dynamic resolution. Insomniac: "There's no mode of this game that has the ray tracing turned off." — [Push Square](https://www.pushsquare.com/news/2023/09/marvels-spider-man-2-has-ray-tracing-at-60fps-on-ps5)
- [Ships] Spider-Man 2's PS5 Pro "Performance Pro" mode keeps RT reflections, RT water and RT window interiors at 60 fps. — [TechRadar](https://www.techradar.com/gaming/the-latest-marvels-spider-man-2-update-adds-a-ps5-pro-mode-with-new-ray-tracing-features)
- [Ships/Ladder] AC Shadows: RT reflections only in Extended mode (PC, and PS5 Pro Fidelity/Balanced). — [Ubisoft Tech Q&A](https://www.ubisoft.com/en-us/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa); [MP1st](https://mp1st.com/news/assassins-creed-shadows-graphical-modes-detailed-for-ps5-and-ps5-pro)
- [Ships/Ladder] Star Wars Outlaws on Switch 2 keeps RT reflections, blurrier on near-smooth surfaces. — [Nintendo Everything](https://nintendoeverything.com/star-wars-outlaws-frame-rate-resolution-switch-2/)
- [Ships/Ladder] Outlaws' Switch 2 reflections beat Series S. — [Nintenderos](https://www.nintenderos.com/2025/09/un-port-extraordinario-asi-define-digital-foundry-star-wars-outlaws-para-nintendo-switch-2-en-su-analisis-tecnico/)
- [Ships] Diablo IV RT reflections cover still ponds and mirrors. Blizzard's examples show Ball Lightning reflecting off water and "an off-screen rock face" becoming visible. — [Blizzard](https://news.blizzard.com/diablo4/24077218/)
- [Ships] Club386 found Diablo IV's RT reflections reduce occlusion problems. — [Club386](https://www.club386.com/diablo-4-shows-your-inner-demon-with-nvidia-ray-tracing-reflections)
- [Ships] Cyberpunk 2077 Overdrive's unified path tracer replaced SSR. — [NVIDIA](https://www.nvidia.com/en-au/geforce/news/cyberpunk-2077-ray-tracing-overdrive-update-launches-april-11/)
- [Ships] Alan Wake 2's Ultra preset adds "fully ray-traced reflections." — [Remedy](https://www.alanwake.com/story/dlss-4-multi-frame-generation-out-now/)

### Inferences
- **Top-down geometry problem:** with the camera pitched down, rays reflected off horizontal surfaces (water, wet flagstones, blood pools) head up and away from the camera.
  - They can hit the camera-facing sides of objects further back, which may be on screen, so SSR can catch walls and pillars behind a puddle.
  - They cannot catch anything above the top of the screen, ceilings or sky (implied), or the back sides of objects. Coverage shrinks as the pitch gets steeper and near the top edge of the screen.
  - This matches Diablo IV choosing RT reflections and advertising an off-screen rock face.
- **A practical web ladder for an isometric ARPG:**
  1. Box-projected or parallax-corrected probes per room or tile, re-fit by local irradiance as id Tech does. This is cheap and stable, and suits enclosed gothic interiors.
  2. Hi-Z SSR (stochastic only on high tier) blended over the probes, mainly for wet floors and nearby verticals.
  3. Planar reflection rendering only for a few hero water planes, at reduced resolution and with simplified content.
  4. Stylized fakes: scrolling reflected skybox or ceiling textures for lava and water.

  RT reflections are out of scope without hardware RT.
- **Ordering:** at 60 fps, AAA teams cut RT reflections before RTGI (Doom: The Dark Ages, AC Shadows' Standard vs Extended modes). This suggests the web build should spend its budget on GI and ambient first and treat reflections as an optional high-tier feature.

### Gaps
- Not verified before the search budget ran out: planar reflections in current engines (UE planar reflections, other games), Stachowiak 2015 stochastic SSR, Uludag Hi-Z tracing, Unity HDRP's reflection hierarchy, and screen-space reflection cost in ms on consoles.
- No numbers were found for Diablo IV's reflection cost or for its non-RT reflection fallback.

## Q5. AO and screen-space indirect light: SSAO, HBAO+, GTAO/XeGTAO, visibility-bitmask SSIL/SSGI, RTAO, bent normals, specular occlusion

### Takeaway
GTAO-class horizon AO is the cheap standard. XeGTAO costs about 0.56 ms at 1080p on an RTX 2060 and about 2.4 ms on an Intel iGPU, with optional bent normals for about 25% more.

The 2023+ upgrade is visibility-bitmask methods (SSILVB). They fix the "infinite thickness" assumption and give AO, indirect diffuse and ambient in one pass, and they already appear combined with Radiance Cascades in academic work.

Engines with RT GI get AO implicitly (AC Shadows, path tracing) or add a short-range directional-occlusion pass for detail missing from the RT structures (id Tech 8). Specular occlusion is now usually derived from the same cone or bent-normal data.

### Cited Findings
- [Mech/Cost] XeGTAO (Intel, MIT) implements GTAO (Jimenez et al. 2016) as three compute passes: prefilter depths, main pass, denoise.
  - High preset: about 0.56 ms at 1080p on an RTX 2060, about 1.4 ms at 4K on an RTX 3070, and about 2.39 ms at 1080p on an i7-1195G7 integrated GPU.
  - Medium costs about 2/3 of High, and Low about 2/3 of Medium.
  - ASSAO Medium costs about 0.72 ms against XeGTAO High's 0.56 ms (RTX 2060, 1080p).
  - Defaults are 3 slices × 6 samples (18 spp).
  - Optional bent normals add about 25%.
  - Denoising is a 5×5 depth-aware spatial filter; it uses TAA for temporal accumulation if present.
  - FP16 gives 5–20% speedups but regresses on some drivers.
  - DX12 only, and Intel no longer maintains it.
  
  — [XeGTAO GitHub](https://github.com/GameTechDev/XeGTAO)
- [Mech] Screen Space Indirect Lighting with Visibility Bitmask (Therrien, Levesque, Gilet; Visual Computer 2022 / arXiv 2023):
  - It replaces the two horizon angles per slice with a bitfield of N sectors.
  - Light can pass behind surfaces of constant thickness.
  - It gives better AO, indirect diffuse and ambient than earlier screen-space methods, with low overhead.
  - Sampling multiple visibility cones beats a single bent normal.
  
  — [arXiv 2301.11376](https://arxiv.org/abs/2301.11376v2)
- [Mech] A screen-space Radiance Cascades implementation was combined with visibility-bitmask GI (VBGI) for a fixed-camera game. — [Chalmers ODR](https://odr.chalmers.se/items/9e42007a-bb60-440f-ba28-04410822758f/full)
- [Ships] Call of Duty (SIGGRAPH 2024) presented hemispherical occlusion and runtime AO for normal-mapped surfaces: "high-quality occlusion can be efficiently computed from visibility cones." It also introduced an HHD lightmap model as an alternative to AHD. — [Advances 2024](https://advances.realtimerendering.com/s2024/index.html)
- [Ships] id Tech 8 composites a directional-occlusion term. It ray-marches the hemisphere and stores the average unoccluded direction, a bent-normal-like quantity, which it uses for specular occlusion and POM contact shadows. The term is denoised and temporally filtered, and restores high-frequency detail missing from the RT acceleration structures. — [Sousa](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Ships: RTAO] AC Shadows' RTGI "implicitly adds raytraced ambient occlusion." — [Ubisoft Tech Q&A](https://www.ubisoft.com/en-us/game/assassins-creed/news/4XbPPtFyQEtIMWrA9xVDmZ/assassins-creed-shadows-tech-qa)
- [Ships: RTAO] Spider-Man 2's PS5 Pro Fidelity Pro mode offers an RT Ambient Occlusion toggle. — [MP1st](https://mp1st.com/dlc-and-expansions/marvels-spider-man-2-update-1-004-webs-out-for-ps5-pro-support)
- [Ships: RTAO] Cyberpunk 2077 Overdrive replaced SSAO. — [NVIDIA](https://www.nvidia.com/en-au/geforce/news/cyberpunk-2077-ray-tracing-overdrive-update-launches-april-11/)
- [Ships: RTAO] Indiana Jones' path tracing covers AO. — [DSOGaming](https://www.dsogaming.com/articles/indiana-jones-and-the-great-circle-path-tracing-benchmarks/)
- [Ships: RTAO] NRD's REBLUR denoises AO and specular occlusion; blue-noise sampling is "a must" for it. — [NRD](https://github.com/NVIDIA-RTX/NRD)
- [Ships] Diablo IV's 1.3.5 patch updated AO, with the biggest change on PC Ultra, and made it available on all platforms. — [Blizzard](https://news.blizzard.com/diablo4/24077218/)
- [Mech, secondary] A French academic deck describes Lumen as four levels of detail: per-pixel AO, a per-pixel probe, sparser world probes, and an environment map. — [LIRIS deck](https://origami.projet.liris.cnrs.fr/topics/gdl/gdl_talk_84/radiance_cascades.pdf)
- [Web] threepipe, a three.js-based framework, ships an SSGI plugin. — [threepipe SSGIPlugin](https://threepipe.org/plugin/SSGIPlugin.html)

### Inferences
- **A top-down camera is a good case for horizon or bitmask methods.** Most pixels are ground or near-horizontal surfaces with nearby occluders (walls, props, characters) on screen. Half-resolution GTAO or SSILVB with bilateral upsampling should hold up well.
- **Thickness errors at character silhouettes** (dark halos on the ground behind characters) are the classic GTAO failure. The visibility bitmask's constant-thickness model directly targets this.
- **Budget guide:** XeGTAO's integrated-GPU numbers (about 2.4 ms at 1080p for High) suggest Medium or Low at half resolution for web integrated GPUs and laptops, with TAA providing the temporal accumulation XeGTAO itself leaves to TAA.
- **SSILVB plus screen-space Radiance Cascades** (as in the Chalmers thesis) could act as the "GI" of a WebGPU isometric game: near-field from the bitmask pass, far-field and emissive spell light from cascades, plus baked or probe ambient for what the screen cannot see.
- **Specular occlusion should come from the same bent-normal or cone data,** as in id Tech 8's directional occlusion and Call of Duty's visibility cones. This matters in dark dungeons where probe reflections would otherwise glow in corners.

### Gaps
- Not verified with URLs before the search budget ran out: original SSAO (Crytek 2007), HBAO+, the GTAO paper URL (only cited via XeGTAO), AMD CACAO, UE5 and Unity HDRP SSGI specifics, and the Godot SSIL implementation.
- I found no shipped AAA title confirmed to use the visibility-bitmask method.
- I found no costs for SSILVB on mid-range GPUs.

## Q6. Denoising and temporal accumulation: NRD (ReBLUR/ReLAX), DLSS Ray Reconstruction, AMD FSR Redstone ray regeneration/radiance caching, SVGF-style filters, and how much modern lighting depends on TAA/upscalers

### Takeaway
Practically every 2024–26 lighting technique assumes multi-frame accumulation. Lumen, MegaLights, id Tech 8 GI, GIBS, SSSR, XeGTAO and HypeHype's stochastic lighting all render under-sampled, often at ½–¼ resolution, and rely on temporal filters plus TAA or an upscaler (TSR, DLSS, FSR, PSSR) to converge.

On PC/RTX, ML denoisers are replacing hand-tuned ones: DLSS Ray Reconstruction (transformer model in DLSS 4, a second-generation model in DLSS 4.5 in 2026) and AMD FSR Ray Regeneration (RDNA 4, Dec 2025). Hand-written spatio-temporal denoisers remain the cross-platform norm: NRD's REBLUR/RELAX/SIGMA at about 0.4–3.3 ms on an RTX 4080 at 1440p, and id Tech 8's about 0.5–1.2 ms bilateral denoise plus upscale on consoles. The web has no ML denoiser, so a web build must use the hand-written path.

### Cited Findings
- [Mech/Cost] NRD v4.18 is an API-agnostic spatio-temporal denoising library aimed mainly at 1 path per pixel, used in "15+ AAA game titles."
  - REBLUR ("recurrent blur") handles diffuse and specular radiance plus AO/SO.
  - RELAX (à-trous, "designed for RTXDI") handles diffuse and specular radiance.
  - SIGMA is a per-light shadow denoiser.
  - Costs on an RTX 4080 at 1440p: REBLUR diffuse+specular 2.55 ms (3.40 ms in SH mode), RELAX 3.25 ms (4.80 ms SH), SIGMA 0.40 ms (0.45 ms with translucency).
  - It accumulates "for a limited number of frames," needs non-jittered motion vectors, normal/roughness, viewZ and hit distance, and wants albedo demodulated.
  - Supported sampling rates: 0.5 rpp checkerboard for specular, 0.25 rpp for diffuse. Blue noise is recommended, and "a must" for AO and shadows.
  - With frame generation, the real (not generated) fps must be passed in.
  
  — [NRD GitHub](https://github.com/NVIDIA-RTX/NRD)
- [Ships] On RTX GPUs, DLSS Ray Reconstruction "takes the place of the traditional denoisers" in Doom: The Dark Ages' path-tracing update. — [NVIDIA](https://www.nvidia.com/en-us/geforce/news/doom-the-dark-ages-path-tracing-dlss-ray-reconstruction-update/)
- [Ships] Indiana Jones Update 3 added DLSS 4 transformer RR. — [TheSixthAxis](https://www.thesixthaxis.com/2025/02/21/indiana-jones-and-the-great-circle-update-3-adds-better-path-tracing-on-pc/)
- [Ships] Cyberpunk's GDC 2024 talk lists RR among its image-quality improvements. — [NVIDIA GDC24](https://www.nvidia.cn/on-demand/session/gdc24-gdc1002)
- [Ships] DLSS 4.5 Ray Reconstruction (2026):
  - A second-generation transformer that "combines denoising and Super Resolution in one network," reported with 35% more compute and 20% more parameters at similar performance.
  - Supported on RTX 20 through 50.
  - 27–30 launch titles, including Alan Wake 2, Cyberpunk 2077, Doom: The Dark Ages, F1 25, Half-Life 2 RTX and Hogwarts Legacy.
  - Reports conflict on timing: released 25 Aug, NVIDIA App early access, or official in Sept 2026.
  
  — [PC Guide](https://www.pcguide.com/news/dlss-4-5-ray-reconstruction-supported-games-list-now-available-for-all-geforce-rtx-gpus-in-30-titles-at-launch/); [TweakTown](https://tweaktown.com/news/113205/nvidia-app-adds-dlss-4-5-ray-reconstruction-support-and-heres-every-game-you-can-enable-it-in/index.html)
- [Ships] AMD FSR "Redstone" (SDK 2.1, 10 Dec 2025):
  - Components: FSR Upscaling 4.0.3, Frame Generation 4.0, Ray Regeneration 1.0 ("standalone, machine learning-powered real-time denoiser" for ray-traced workloads, requires RDNA 4), and Radiance Caching (Preview; an online-trained ML cache for path-traced multi-bounce GI).
  - All require RX 9000 or newer; other GPUs fall back to the FSR 3.1.5 upscaler.
  
  — [GPUOpen](https://gpuopen.com/learn/welcome-amd-fsr-redstone-amd-fsr-sdk-21-available/)
- [Ships] Ray Regeneration first went live in Call of Duty: Black Ops 7. — [Hardware Busters](https://hwbusters.com/news/amd-fsr-redstone-debuts/)
- [Ships/Cost] id Tech 8's GI denoise and upscale:
  - Separable "bilateral" Gaussian spatial passes at gather resolution, weighted by normal, depth and hit distance.
  - A 4-tap Poisson bilateral upscale.
  - A temporal filter with a per-pixel valid-frame counter.
  - "TAA/others acts as another temporal filter at end of frame."
  - Costs: denoise 0.18–0.52 ms and upscale 0.445–0.72 ms across platforms.
  - It uses RGB9E5 rather than R11G11B10F to avoid colour shift and banding.
  
  — [Sousa](https://www.advances.realtimerendering.com/s2025/content/SOUSA_SIGGRAPH_2025_Final.pdf)
- [Ships] Frostbite GIBS drives probe and surfel hysteresis with a multi-scale mean estimator so lighting responds to changes. College Football 25 uses a preload so the first visible frames are converged. Applying surfels at quarter rate with a cheap spatial upscale beat a ReSTIR-based stochastic apply. — [Apers](https://advances.realtimerendering.com/s2024/content/EA-GIBS2/Apers_Advances-s2024_Shipping-Dynamic-GI.pdf)
- [Ships] In MegaLights, "all accumulated lighting goes through a denoiser," and more complex lighting can blur or ghost. — [UE docs: MegaLights](https://dev.epicgames.com/documentation/en-us/unreal-engine/megalights-in-unreal-engine)
- [Ships] Arm's mobile MegaLights port relies on temporal accumulation; going from 2 to 16 spp raises started rays from about 6.9M to about 49.9M. — [Arm](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/lighting-at-scale-bringing-hundreds-of-dynamic-lights-to-mobile-with-unreal-megalights)
- [Limits] HypeHype wants TAA to be the only denoiser to save bandwidth. The standard 3×3 neighbourhood colour clamp causes "flashing lighting splotches" with stochastic light sampling, and this is still active R&D. — [HypeHype notes](https://www.advances.realtimerendering.com/s2025/content/s2025_stb_lighting_v1.1_notes.pdf)
- [Limits] The Lumen Epic level depends on TSR to output near-4K from a 1080p internal resolution, and indirect lighting is computed at low resolution. — [Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine); [Lumen GI and Reflections](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-global-illumination-and-reflections-in-unreal-engine)
- [Limits] Lumen's caches propagate changes slowly (seconds) and pop in on fast camera moves. — [Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Limits] XeGTAO "will leverage TAA for temporal accumulation when available" but must keep temporal variance low so TAA does not mistake noise for features. — [XeGTAO](https://github.com/GameTechDev/XeGTAO)
- [Limits] SSSR depends on a temporal denoiser for glossy rays. — [GPUOpen SSSR](https://gpuopen.com/fidelityfx-sssr/)
- [Limits] Brixelizer GI outputs pre-denoised GI and offers lower-resolution modes. — [GPUOpen Brixelizer](https://gpuopen.com/fidelityfx-brixelizer/)
- [Counter-example] The Chalmers screen-space Radiance Cascades thesis deliberately avoided temporal accumulation and reports flicker on small movements. — [Chalmers ODR](https://odr.chalmers.se/items/9e42007a-bb60-440f-ba28-04410822758f/full)

### Inferences
- **For a WebGL2/WebGPU build, plan the whole lighting stack around one robust TAA or temporal-upscale pass plus a few cheap per-effect temporal and bilateral filters.** This is id Tech 8's model, and its denoise plus upscale costs only about 0.6–1.2 ms on consoles. ML reconstruction (DLSS RR, FSR Ray Regeneration) is unavailable in browsers.
- **Isometric follow cameras are favourable for temporal reuse.** Motion is smooth and parallax is low, so disocclusion is limited mostly to moving characters.
- **The real risk is fast, bright, short-lived spell lights.** Temporal methods smear or lag them: Lumen's slow propagation, HypeHype's TAA clamp issue, MegaLights' ghosting. Prefer deterministic per-pixel evaluation (clustered) for the few strongest spell lights, and reserve stochastic or cached methods for ambient and GI-level light.
- **Use noise-friendly formats and sampling.** Use blue-noise sequences (NRD, id Tech 8), RGB9E5 or RGBA16F rather than R11G11B10F for accumulated light (id Tech 8), and demodulated albedo before filtering (NRD). These transfer directly to web shaders.

### Gaps
- Not verified with URLs before the search budget ran out: SVGF (Schied et al. 2017) and other A-SVGF/ReLAX papers, and the original DLSS 3.5 Ray Reconstruction announcement (Sept 2023).
- I found no per-pass TAA or TSR ms costs for consoles.
- Only Call of Duty: Black Ops 7 is confirmed as shipping FSR Ray Regeneration.
- I found no public data on PSSR's interaction with RT denoising.
- three.js-specific TAA/TRAA and denoiser implementations were deliberately left to the parallel three.js researcher.

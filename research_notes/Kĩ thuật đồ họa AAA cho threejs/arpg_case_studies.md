# ARPG case studies 2019–2026: rendering techniques and art-direction practice in isometric/top-down action RPGs (notes for a three.js WebGL2/WebGPU Diablo-like with no hardware RT)

Compiled 2026-10-19. Labels: **[primary]** = developer, publisher or GDC source; **[press]** = journalism; **[community]** = forum, guide or wiki; **[vendor]** = hardware or middleware marketing. A claim marked "(search-snippet level)" was seen only in a search summary, not on a fully fetched page. The shared web-search budget ran out partway through, so some leads stayed unverified. They are listed under Gaps.

---

## 1. Diablo IV: what Blizzard and the press have documented about its renderer and art direction

### Takeaway
Before launch, Blizzard published a tech article describing a gameplay-first, deliberately small feature set. It covers a deferred renderer and fully dynamic lighting, with nothing baked, because dungeons are random and weather changes. A custom shadow system caches static shadows and spreads shadow work across frames so the game can draw "as many shadows as we could coax out of the hardware". Other pieces are PBR with physical light units exposed to artists, lit volumetric fog and dust, subsurface scattering (SSS) on skin, virtual-textured terrain, VFX built from procedural noise and flow maps, and an HDR/SDR tone map tuned by the art team around "true black". The art direction rests on "return to darkness", "old masters" (Rembrandt's tonal control) and "believability, not realism". It uses reusable dungeon tile-sets and is built around the fixed isometric camera. Ray-traced shadows and reflections (PC, March 2024) and DLSS-class upscaling are high-end extras. They sit on top of a baseline that scales down to GTX 660-class hardware at 720p/30.

### Cited Findings
**Source and authorship**
- The main primary source is "Peeling Back the Varnish: The Graphics of Diablo IV" on Blizzard News. Its authors are Keven Cantin (lead graphics engineer), John Buckley and Kevin Todisco (principal graphics engineers), Aaron Aikman (lead graphics tech artist) and Samuel Delmont (senior graphics engineer). It was published before the June 5, 2023 launch. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- Philosophy: gameplay first. The team picked a small number of features and polished them rather than adding many. The guiding question was what graphics could do to support the dark tone. Art, engineering and tech art worked together in multi-disciplinary "strike teams". The goal was strong performance on low-end hardware with extra fidelity on high-end hardware. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)

**Renderer core, lighting and shadows**
- The renderer is deferred, chosen so material calculations can be shared across many light sources. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- The darker art direction "called for shadows—as many as we could coax out of the hardware—while still maintaining a remarkably high frame rate." — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- The shadow system was written from scratch on top of the deferred renderer. Shadow results for static geometry (floors, walls) are cached and reused. Dynamic objects such as the player are drawn on top of those cached results. Shadow calculations are scheduled across multiple frames rather than all at once. The article gives no count of shadow-casting lights. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- Lighting is fully dynamic because dungeons are random, weather is dynamic and the open world changes, so the article says few optimisation shortcuts were possible. Custom tools let artists work in physical units (lumens, irradiance, candelas). — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- PBR is grounded in real-world physics. The team deviated "only where it felt fitting for the game", for example a **"negative" light** from dark magic that pulls light away. Artists author per-material data such as microscale roughness and metalness. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- **Volumetrics:** dust and particles in the air are modelled and lit, with light scattering and being absorbed on its way to the camera. This replaced the older particle-sprite and layered-billboard approach. Stained-glass windows emit light into the air volume. The team described the feature as an unplanned discovery made during development. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- The article says nothing about GI, ambient occlusion (AO) or light baking for the base (non-RT) renderer. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)

**Characters and materials**
- Skin uses subsurface scattering so faces don't look "plastic". Light transmits through thin geometry, for example Lilith's wings. Character shaders show status effects (burning, poisoned, stealth), wetness in rain that dries indoors, and blood from skills. High-detail textures are swapped in for close-ups. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- Pixel shaders output albedo, roughness, normal, alpha and emissive. **Procedural VFX** use tiling noise textures distorted by 2D directional maps (i.e., flow maps) to make mists, infernos and poison pools without frame-by-frame flipbooks. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- Environment shaders use directional blending (e.g., snow on the tops of rocks), adaptive texture scaling, dissolve effects, and curvature data that darkens edges and cavities or changes their roughness. **Props use emissive elements to highlight interactables.** — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- **Terrain** blends many tileable textures. **Virtual textures** combine the blend once instead of re-blending every frame. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- **Water:** painted masks, animated noise distortion, refraction, colour that depends on depth, wakes and foam from characters and monsters, and vertex displacement for ocean waves and explosions. **Vertex animation** drives foliage that reacts to characters and skills, wind over grass, and undulating flesh and wriggling blood or limbs. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- GDC 2024 Technical Artist Summit talk "H2O in H3LL: The Various Forms of Water in Diablo IV" (Aaron Aikman): pixel- and vertex-shader techniques for shorelines, puddles that accumulate dynamically, snow-topped rocks, Helltide rivers and icy caves. — [GDC schedule [primary]](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730)

**HDR, tone mapping and "true black"**
- In HDR mode, the internal HDR image goes straight to the display without SDR-style range compression, aiming for "true black" in shadows. The SDR tone mapping raises the darkest values to the low end of the display (~0.1 nits). — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- Open-beta bug: a `log()` in the colour lookup tables (LUTs) clamped the minimum value to ~0.000976, which came out as ~0.07 nits on HDR displays and lifted the blacks. It was fixed before Server Slam. A new HDR tonemap curve curated by the art team added contrast and saturation and shifted orange light glow slightly toward red. Players can calibrate black point, brightness and white point. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)

**Art direction**
- Pillars from Chris Ryder (Art Director, Environments): **"Return to darkness"**, a dark medieval-gothic Sanctuary; **"Old masters"**, with concepts filtered through classical painting and Rembrandt's controlled detail, tonal range and palettes; and "The aim is for **believability, not realism**". — [Blizzard Quarterly Update March 2022 [primary]](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022)
- Ben Hutchings (Associate Lighting Director): **soft shadows, fog and bounce light** are a "core part" of the lighting style. Interiors provide contrast, e.g., a hazy fire-lit tavern against damp outdoors. Keep dungeons use selective, oppressively dark lighting that **hints at paths**. Flooded areas use putrid green and yellow. Rain wets surfaces and pools in ruts and hoof prints, and coastal areas have fog. — [Blizzard Mar 2022 [primary]](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022)
- Each region has its own palette: the Scosglen coast is gritty; the Dry Steppes have dark rocks against pale blonde and rusty grass, poplar and saxaul trees for parallax depth, and blue alkaline lakes; arid towns have warm oxidised hues; Kyovashad's warm earthy tones contrast with the cold palette of the Fractured Peaks. — [Blizzard Mar 2022 [primary]](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022)
- Art director John Mueller cited the old masters plus Frank Frazetta and Gerald Brom. The intended style sits between Diablo II's darkness and Diablo III's hand-painted feel, with medieval fine art mixed in. D4 is the first game in the series made entirely of standard 3D assets with terrain elevation. — [Wikipedia [community]](https://en.wikipedia.org/wiki/Diablo_IV)
- Mueller aimed to make characters look "as artistic and as hand-crafted as possible", drawing on Rembrandt for "a painterly feeling and the softness". Blizzard rebuilt its rendering engine and authoring tools to support this (search-snippet level). — [Blizzard Quarterly Update June 2021 [primary]](https://news.blizzard.com/en-us/article/23665024/diablo-iv-quarterly-updatejune-2021); [GameSpot [press]](https://www.gamespot.com/articles/diablo-4s-art-direction-emphasizes-hand-crafted-details-plenty-of-customization-and-just-enough-realism/1100-6493411/) (fetch returned 403)

**Camera, readability and dungeon kits**
- Ryder: the team plays to the iconic Diablo camera, **adding or removing detail to aid gameplay readability**. Brian Fletcher: the **fixed camera lets artists place foreground assets without blocking the playable space** and tune layouts and vistas. Hutchings: **silhouetting the player space** and building scale and depth help navigation and visibility. — [Blizzard Mar 2022 [primary]](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022)
- Dungeons are randomised (150+ planned) and built from **reusable tile-sets** combined with props, interactives and lighting. Thematic layers can be switched on or off, so one tile-set can serve as a druid burial site or an empty cave. "Transition scenes" join two tile-sets inside one dungeon. — [Blizzard Mar 2022 [primary]](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022)
- GDC 2024 talks (members-only; descriptions only): "The Art of Open World Sanctuary" (Mahreen Fatima, Sam Gao, Justin Whitehead) names developing for an isometric camera, performance and cohesion as challenges. — [GDC Vault [primary]](https://gdcvault.com/play/1034222/-Diablo-IV-The-Art). "Embracing Art Performance on Diablo IV" (Evan Edwards, Senior Technical Artist) treats optimisation as a cultural, team-wide goal with artists involved early. — [GDC Vault [primary]](https://gdcvault.com/play/1034353/Embracing-Art-Performance-on-Diablo). "The Pillars of Hell" (John Mueller) covers five processes for growing a shared art vision. — [GDC Vault [primary]](https://www.gdcvault.com/play/1034608/The-Pillars-of-Hell-Achieving)

**Ray tracing (2024) and upscaling**
- NVIDIA's March 26, 2024 article reports a new Ray Tracing menu. **RT reflections** cover water, pools of blood and other reflective surfaces, and enemies, attacks and VFX are reflected. **RT shadows** "upgrade existing shadows and render shadows from all light sources at once", with contact hardening and softening over distance. Technical Director Michael Bukowski: "Effects like lightning strikes are now reflected in pools of blood and water." — [NVIDIA [vendor]](https://www.nvidia.com/en-us/geforce/news/diablo-iv-ray-tracing-update-out-now/)
- Press puts it in patch 1.3.5. — [club386 [press]](https://www.club386.com/diablo-4-shows-your-inner-demon-with-nvidia-ray-tracing-reflections); [3DTested [press]](https://www.3dtested.com/video-games/pc-gaming/diablo-ivs-new-ray-tracing-update-is-live-outpost-infinity-siege-also-gets-dlss-3). Sources disagree on the effect list. One NVIDIA driver post adds **RT foliage**, and NVIDIA's GDC 2024 post mentions **RT transparent reflections** on armour, water and windows (both search-snippet level). — [NVIDIA driver post](https://www.nvidia.com/en-us/geforce/news/call-of-duty-season-3-geforce-game-ready-driver/); [NVIDIA GDC 2024](https://www.nvidia.com/en-us/geforce/news/gdc-2024-dlss-rtx-full-ray-tracing-game-announcements/). Some press summaries also list AO and contact shadows, which NVIDIA's release post does not.
- The game shipped with DLSS 3 Frame Generation (RTX 40), DLSS 2 Super Resolution (all RTX) and Reflex. NVIDIA claims an average 3.1× at 4K with RT maxed (RTX 4090: 144 fps) and 2.3× at 1440p. — [NVIDIA [vendor]](https://www.nvidia.com/en-us/geforce/news/diablo-iv-ray-tracing-update-out-now/)
- *Lord of Hatred* expansion (April 2026): DLSS 4.5 Super Resolution through the NVIDIA app, DLSS 4.5 Dynamic Multi Frame Generation 6× on RTX 50, and "6.5×" average at 4K with RT reflections and shadows. — [NVIDIA Apr 2026 [vendor]](https://www.nvidia.com/en-us/geforce/news/nte-neverness-to-everness-diablo-4-lord-of-hatred-dlss-multi-frame-gen/)
- Expansions: *Vessel of Hatred* (Oct 8, 2024) and *Lord of Hatred* (Apr 28, 2026). The Wikipedia infobox lists Switch 2 among platforms, but the article body does not. — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV)

**Scalability and performance targets**
- PC auto-selects a preset (Low, Medium, High or Ultra, plus custom). A Resolution Percentage slider sets the internal resolution. PC offers several upscalers ("including NVIDIA DLSS 3"), and consoles use upscaling plus **dynamic resolution**. Ultra textures need the High-Resolution Assets install and 32 GB RAM. Shadow quality affects memory and sharpness for both the sun and local lights. — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- Console targets: **Xbox Series X 4K/60, Series S 1440p/60, One X 1440p/30, One/One S 1080p/30.** — [Blizzard [primary]](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- **Minimum PC spec: 720p render / 1080p output (upscaled), Low, 30 fps** on an i5-2500K/FX-8350, 8 GB RAM and GTX 660 / R9 280 / Arc A380, with a 90 GB SSD. "The game will attempt to run on hardware below minimum specifications, including HDDs, dual-core CPUs and integrated GPUs." The page also has a separate ray-tracing column (1080p native, RT minimum preset, 30 fps). — [Battle.net support [primary]](https://battle.net/support/article/251518); [EU page](https://eu.battle.net/support/en/article/000251518)
- Medium is 1080p/60 on a GTX 970 / RX 470 with 16 GB. High is 1080p/60 on an RTX 2060 / RX 5700 XT. Ultra 4K/60 needs an RTX 3080 / RX 6800 XT and 32 GB. — [Neowin [press]](https://www.neowin.net/news/diablo-iv-pc-launch-and-server-slam-hardware-requirements-posted-including-ultra-4k-specs/); [OneMoreGame [press]](https://onemoregame.ph/2023/04/diablo-iv-ultra-4k-system-requirements-revealed/)
- One RT target is said to be an RTX 2060 with DLSS Super Resolution at 1080p/Low/30 fps (search-snippet level, source not pinned down).

**VFX clutter (player-side)**
- Players keep asking for a way to dim, fade or hide other players' skill effects, preferably as an opacity or intensity slider. The only existing precedent cited is that Necromancer pets are almost invisible to other players "specifically for visibility's sake". The article predates *Vessel of Hatred*, so the current status is unverified. — [Icy Veins [press]](https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/); [Icy Veins (earlier)](https://www.icy-veins.com/d4/news/has-disabling-other-players-effects-become-needed-for-diablo-4/)

### Inferences
- D4 shows that dark readability comes from controlled tonal range rather than raw darkness. Its ingredients are soft shadows, fog and bounce light; local light pools that hint at paths; emissive accents on interactables; and an SDR tone map that never crushes the floor below ~0.1 nits. All of this can be reproduced in three.js without RT, using a custom tone-mapping and LUT pass with an explicit black floor plus artist-placed local lights.
- The cached static shadow plus dynamic overlay plus time-sliced update pattern maps to three.js as follows. Shadow maps for static geometry are rendered rarely (`shadowMap.autoUpdate=false` with `needsUpdate` on change). Dynamic casters go into a separate, smaller or cheaper pass. Local-light shadow updates are spread round-robin across frames. A project constraint applies here (from the local lab notes, not web-sourced): an extra shadow map pushed WebGPU past its 16-sampler limit and broke terrain, and calling `shadowMap.render` outside `render()` stopped the frame loop. Any D4-style multi-shadow scheme must budget samplers and run its shadow work from `onAfterRender`.
- Virtual-textured terrain ("blend once, sample many") becomes, in the browser, baking each terrain chunk's splat blend into a cached render target or atlas. This avoids sampling 4–8 layers per pixel every frame.
- Noise plus flow-map VFX (no flipbooks) is a cheap, memory-friendly approach that suits WebGL2 and WebGPU.
- Because RT came later and only as an opt-in high-end extra, the baseline art direction does not depend on it. A browser game can copy this and treat any SSGI or RC-style GI as an optional tier.
- Kevin Todisco co-wrote the D4 graphics article and gave the D2R engineering GDC talk (see §3). This suggests the two Blizzard projects shared renderer expertise, but it is inference only.

### Gaps
- No public detail was found on D4's occluder handling (wall cutaway, fade or x-ray silhouette), camera projection or FOV, decal system, elite outline or rim-light rules, damage-number rendering, minimap rendering, or base-renderer GI and AO. The GDC 2024 talks that likely cover some of this are members-only.
- Which upscalers besides DLSS (FSR, XeSS) D4 supports was not verified.
- The exact RT effect list (foliage, AO, contact shadows) conflicts between sources, and whether RT reached consoles is unknown.
- Whether D4 ever shipped an "other players' VFX opacity" option after 2024 was not verified because the search budget ran out.
- A Switch 2 version appears only in the Wikipedia infobox. It is unverified.

---

## 2. Path of Exile 2: how Radiance Cascades GI is used, other renderer features, and VFX density versus performance

### Takeaway
Sannikov's own paper is the primary source. PoE2's GI is a **flatland-like hierarchy of screen-space radiance cascades** filled by screen-space raymarching, a choice the paper says was "motivated by PoE2's fixed camera". It marches 4 rays at once with 128-bit occlusion bitmasks, runs in about **3 ms on a GTX 1050**, uses no temporal accumulation, gives diffuse and specular indirect light from emissive characters and spell effects, and cannot see off-screen light sources. Its cost does not depend on scene content, so it scales to the large number of light-emitting skills typical of ARPGs. GGG has published little about how it balances VFX density against performance. Players manage cost through a "Shadows only / Shadows + GI" lighting option, GI quality, dynamic resolution and upscalers.

### Cited Findings
**Primary: the Radiance Cascades paper**
- The paper ("Radiance Cascades: A Novel Approach to Calculating Global Illumination", A. Sannikov) is hosted on GitHub in a JCGT-template layout. The author says it never went to a journal. It is MIT-licensed. — [GitHub repo [primary]](https://github.com/Raikiri/RadianceCascadesPaper); [PDF](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Core idea (abstract): the radiance field is split into ranges from near-field to far-field and each range is stored separately. "In order to resolve radiance emitted by an object, one needs to have higher linear resolution next to it, and higher angular resolution farther away from it". The asymptotic scaling is "equivalent to casting infinitely many rays in a finite amount of time, while using a finite amount of memory". The method rests on "The Penumbra Hypothesis" (§2.2). The paper's scaling argument concludes that the total cost of all cascades "stays less than twice the cost of cascade 0". — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- **PoE2 implementation:** "Practical implementation of radiance cascades is integrated into Path of Exile 2 as its global illumination solution… uses a flatland-like screenspace radiance cascade hierarchy and populates them using screenspace raymarching — a choice motivated by PoE2's fixed camera." — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- "To make it possible to run on the target hardware, PoE2 GI uses a very efficient screenspace raymarching scheme that… raymarches 4 rays simultaneously… and stores occlusion in 128-bit bitmask, that is equivalent to storing 128 binary occlusion rays per radiance cascade texel." Figure 15 is captioned "running in **3ms on GTX1050** and used to calculate indirect light coming from a glowing character." — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Figure 2 shows a PoE2 scene lit only by indirect light from a glowing character, then that character plus an **emissive spell effect**, "includes both diffuse and specular components of indirect light". Cascades store directional radiance, so they "combine particularly well with normal mapping". Convolving with a BRDF gives specular. — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- No temporal reuse: "every application of radiance fields in this paper explicitly does not rely on temporal reuse and reacts instantaneously". The paper criticises the spatiotemporal-denoiser artifacts of Lumen and GI-1.0. — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- **Limitation:** the PoE2 implementation "can't capture offscreen light sources", nor surfaces hidden in the depth buffer. It is "1 to 2 orders of magnitude faster" than an alternative that uses screen-space probes with world-space intervals, which can see off-screen emitters. — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- The 2D proof of concept ("Radiant 2d") computes per-pixel 2D GI "in a constant time of about 30ms on a GTX3060 [sic], depending on required fidelity", at a cost that is "completely fixed and is entirely scene-independent". The Figure 13 caption says lighting for "2, 10² and 100²" particles takes "the same amount of time of about 12ms". The exponents are reconstructed from extracted PDF text, where the superscripts were lost. — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- **Earlier GI in PoE1:** "HSSVGI" (hierarchical screen-space variance-based GI) has shipped "with Path of Exile since 2018" and was first implemented in 2017. It approximates radiance with horizon-based screen-space sectors built from screen-space mipmaps, and estimates occlusion with a VSM-like Chebyshev inequality on the first two linear depth moments. It has a denoiser stage, was explained at ExileCon 2019, and is similar to HBIL (Mayaux, 2018). Sannikov calls it the first algorithm of its kind shipped in a released game. — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- **Shadows in PoE:** "hierarchical screenspace shadow cascades" compute the blurry parts of penumbrae in low-resolution render targets and sharp contact shadows in high-resolution ones, then combine them. This gives soft penumbrae "for free", and blurry penumbrae cost less than hard shadows. Also explained at ExileCon 2019. — [PDF [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)

**Talks, follow-ups and community**
- ExileCon 2023 talk "Rendering Path of Exile 2" by Senior Graphics Programmer Alexander Sannikov, posted around Nov 2, 2023. — [devtrackers [community]](https://devtrackers.gg/pathofexile/p/e45d8539-rendering-path-of-exile-2); [ExileCon 2023 playlist](https://www.youtube.com/playlist?list=PLt5SL2R19SuJYs_X6Heh_ZeMMgkB5BsSR)
- Follow-ups: Osborne & Sannikov 2024 (arXiv 2408.14425, radiative transfer) and "Holographic Radiance Cascades for 2D GI" (2025). — [arXiv 2505.02041](https://arxiv.org/pdf/2505.02041)
- A Chalmers MSc thesis adapts RC to screen space and combines it with visibility-bitmask GI. — [Chalmers](https://odr.chalmers.se/items/9e42007a-bb60-440f-ba28-04410822758f). There is also a 3D RC proof of concept. — [tmpvar](https://tmpvar.com/poc/radiance-cascades-3d/)
- A Hacker News commenter claims PoE2 uses RC "in full 3d" with constant cost and low latency because nothing is accumulated over time. — [HN [community]](https://news.ycombinator.com/item?id=41958021). **This partly conflicts with the paper**, which says screen-space and "flatland-like". The two fit if read as screen-space GI computed for a 3D scene, not a world-space 3D grid.
- 80.lv also states that PoE2 uses RC for GI (secondary). — [80.lv](https://80.lv/articles/check-out-this-cool-realistic-pbr-crystal-shader)

**Settings, scalability and specs**
- Player guides describe these settings: **Lighting = "Shadows only" vs "Shadows and Global Illumination"**; a "Shadow + GI Quality" level; Dynamic Resolution; upscalers (DLSS on RTX, otherwise NIS); and a DX12 renderer option. Guides disagree on recommended values. — [allthings.how [community]](https://allthings.how/path-of-exile-2-best-settings-for-max-fps-on-pc/); [The Backdash](https://thebackdash.com/tech/best-path-of-exile-2-pc-and-controller-settings/)
- On console, guides suggest NIS at about 67% render scale (~2560×1440). — [Dot Esports](https://dotesports.com/path-of-exile/news/path-of-exile-2-best-console-graphics-settings); [ONE Esports](https://www.oneesports.gg/gaming/path-of-exile-2-console-graphics-settings)
- 2024-era specs. **Minimum:** Win10, i7-7700 / Ryzen 5 2500X, 8 GB, GTX 960 (3 GB) / RX 470 / Arc A380, DX12, 100 GB. **Recommended:** i5-10500 / Ryzen 5 3700X, 16 GB, RTX 2060 / RX 5600 XT / Arc A770, SSD. — [esports.gg [press]](https://esports.gg/news/gaming/path-of-exile-2-system-requirements); [Corsair](https://www.corsair.com/explorer/gamer/gaming-pcs/path-of-exile-2-system-requirements-and-recommended-specs/)
- Early access began Dec 6, 2024 on Windows, PS5 and Xbox Series. Version 1.0 is scheduled for **Dec 11, 2026**. Wikipedia does not name the engine. — [Wikipedia](https://en.wikipedia.org/wiki/Path_of_Exile_2)
- In a Dec 2024 community thread, a player reports there is **no way to disable allied skill effects** (status may have changed since). — [Steam thread [community]](https://steamcommunity.com/app/2694490/discussions/0/830448585302643582)

### Inferences
- For a fixed-camera browser ARPG, screen-space RC fits WebGPU compute well. A cost of 3 ms on a GTX 1050 suggests mid-range desktop GPUs could handle it, though browser overhead and integrated GPUs remain risks. The 128-bit bitmask trick needs `uint` operations, which both WebGL2 (GLSL ES 3.0) and WGSL provide. A WebGL2 version would need multi-pass fragment shaders.
- The off-screen blind spot matters less with a fixed camera. A guard band (rendering the GI buffers slightly larger than the viewport) is a plausible mitigation. This is inference, not documented PoE2 practice.
- Because cost does not depend on the scene, any glowing spell, projectile or emissive monster lights its surroundings without adding a per-light cost. That fits ARPG combat, where light sources multiply.
- PoE1's HSSVGI (horizon-based, GTAO-like) and the hierarchical screen-space shadow cascades show a lower tier: a cheaper screen-space indirect and soft-shadow approach is enough to sell the look.

### Gaps
- What the ExileCon 2023 talk covers beyond GI (water, fog, shadows, bokeh, particle lighting) was not verified. No transcript was found.
- No official GGG statement was found on how VFX density is budgeted (particle caps, LOD for other players' effects, culling), the engine's name, the number of shadow-casting lights, or official settings documentation.
- One guide says turning GI off gains about 32% FPS on an RTX 4070, but the source could not be pinned down. Treat it as anecdotal.
- Whether the PoE1 item-filter syntax (beams, minimap icons; see §6) carries over exactly to PoE2 was not verified.

---

## 3. Diablo II: Resurrected: how the 3D remaster was layered over the 2D game

### Takeaway
D2R keeps the original 2000-era simulation running unchanged "under the hood". A new, custom physically based 3D renderer built by Vicarious Visions and Blizzard draws a 3D world on top, reverse-engineered from the sprite world and given real height changes. Pressing F5 switches to the original 2D graphics. A rule held throughout that switching graphics must never give players more or less information. Art direction followed a "70/30" fidelity rule, used an **orthographic** camera, and dropped strict PBR because it didn't suit the dark tone. VFX were matched one-to-one to the original sprites, including extreme cases such as 57 simultaneous missiles with dynamic lights and 100 Necromancer pets.

### Cited Findings
**Architecture**
- GDC 2022 programming talk "Resurrecting a Classic: Bringing Diablo II into the 3rd Dimension" (Kevin Todisco): "built a modern 3D engine to run on top of an inherently 2-dimensional game". Topics: **reverse engineering the sprite-based world, adding real height changes to the environment, developing a custom physically based renderer.** — [GDC Vault [primary]](https://gdcvault.com/play/1027672/Resurrecting-a-Classic-Bringing-Diablo)
- The original engine still runs "under the hood", performing the same calculations and game logic as in 2000. — [Blizzard press release via Businesswire [primary]](https://www.businesswire.com/news/home/20210923005728/en)
- The toggle is there "to remind people that yes, this is the same game that's running underneath, it's the exact same code. It's the exact same engine" (Todisco, per NME). — [NME [press]](https://www.nme.com/features/gaming-features/diablo-2-resurrected-interview-accessibility-to-the-front-3050815)
- The team built a 3D sprite engine on top of the original engine. Gallerani: "**we never wanted you to have more or less information by toggling the graphics.**" — [Inven Global [press]](https://www.invenglobal.com/articles/15159/diablo-2-resurrected-devs-share-their-process-for-remaking-an-iconic-game-we-are-preserving-this-game)
- Players switch between original and remastered graphics with **F5**. — [Blizzplanet tech-alpha review [community]](https://blizzplanet.substack.com/p/blizzplanet-review-diablo-ii-resurrected-tech-alpha)
- Fact sheet: models rebuilt in "full 3D physically-based rendering, along with new animations, dynamic lighting, new textures, and updated visual effects". — [Blizzard fact sheet (docx) [primary]](https://www.warcrafttavern.com/wp-content/uploads/2025/07/diablo_ii_resurrected_fact_sheet_enus.docx)
- In the tech alpha, lighting cast realistic 3D shadows and torchlight flickered among stalagmites in caves (search-snippet level). — [GamingTrend [press]](https://gamingtrend.com/news/high-rez-wirts-leg-hands-on-with-diablo-ii-resurrected-technical-alpha)
- Much of the original source code and assets was lost near the original release, so the founders were unsure a remaster was possible. — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_II:_Resurrected)

**Art-direction talk (GDC 2022, Dustin King, Associate Art Director), as reported by 4Gamer**
- Session: "Diablo 2: Resurrected: The Art Direction and Pipelines for Resurrecting Evil". — [GDC Vault [primary]](https://gdcvault.com/play/1027883/-Diablo-2-Resurrected-The)
- The team debated keeping sprites versus going full 3D. It chose full 3D plus a **Legacy Mode**. The original is described as dark and realistic with no exaggerated effects. A new renderer was built and tested early. — [4Gamer [press]](https://www.4gamer.net/games/554/G055460/20220326013/)
- **Orthographic (parallel) projection.** Arcane Sanctuary's Escher-like "second floor" illusion only works because of it. Camera alignment was settled early because misalignment would have been costly to fix in world building. The world was blocked out with grey placeholders and viewed through the orthographic camera to work out which assets were needed. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- **Strict PBR was abandoned** because it didn't suit the dark tone, and only basic PBR elements were kept. Lighting, materials and post-processing were defined in preproduction. Knowing early where each colour would appear was considered essential. Late in development, a "lighting array" put the original footage, work in progress and other teams' footage side by side to prevent drift. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- **The 70/30 rule** (carried over from Vicarious Visions' Crash Bandicoot remaster work): 70% of each asset keeps its original size, silhouette and colour, and artists may change 30% to add detail. The original animations were about 12 frames, and the 70/30 rule kept their feel while making the animation smoother. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- **VFX matched the original sprites exactly.** One 57-missile attack needed 57 simultaneous effects, each with multiple particles interacting with dynamic lighting. Sorceress lightning is built from about 2 effects repeated 15 times. A level-99 Necromancer can have up to 100 pets on screen, which the team found extremely difficult. Fog is layered and placed by hand. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- Alpha testers said the gems looked wrong. The fix was realistic lighting plus **hand-painted highlights**, which players praised. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- The UI supports up to 21:9 and 8K. When character or skill panels open, the centre of the screen stays clear so players can see their character and react to approaching monsters. Text contrast was raised because the original was hard to read. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- Complex terrain such as ice flows, lava and rivers of fire uses fluid-dynamics-based materials. Concepts for the original 4:3 views were extended to wider aspect ratios. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- Interviews describe the philosophy as keeping at least 70% of the old look and colours (search-snippet level; consistent with 4Gamer). — [PlayStation LifeStyle [press]](https://www.playstationlifestyle.net/2021/09/21/behind-diablo-ii-resurrected-authenticity-developer-interview/)

### Inferences
- The D2R architecture separates a deterministic grid simulation from a "view-only" 3D renderer. That suits a three.js game where gameplay runs on a 2D grid or navmesh (possibly in a Web Worker) and the renderer only reads state. It also makes a legacy or low-spec 2D mode possible.
- The orthographic camera choice and the 70/30 rule are cheap, practical ways to keep an existing style consistent. The "lighting array" side-by-side review matches the lab's A/B capture workflow.
- "Same information in both modes" is a readability rule worth adopting. Fog, bloom, GI or VFX upgrades must not hide telegraphs, loot or monsters.
- The 57-missile and 100-pet cases are concrete worst-case budgets for VFX and dynamic lights. A browser ARPG needs to cap lights (or pool and prioritise them) and instance particles, because D2R had to handle all of these with dynamic lighting.

### Gaps
- The engineering details are in the members-only Todisco talk and were not available: how 3D height is reconciled with 2D collision, how the original light-radius mechanic maps to dynamic lights, the shadow technique, and the projection settings in exact numbers.
- Lemon Sky Studios appears as a D2R contributor in search results, but its role (3D models, animation, concepts) was not verified. — [Lemon Sky (unverified)](https://www.lemonskystudios.com/games/feat/conc/3dm/anim/tech/diablo-ii)
- No source was found for D2R's performance targets or minimum specs. The search budget was exhausted.

---

## 4. Diablo Immortal (mobile): which optimisation lessons apply to a constrained platform like the web?

### Takeaway
Diablo Immortal runs on NetEase's mobile-focused Messiah engine (PBR, normal maps, GPU particles, heavy multi-core use, Qualcomm-tuned). It kept Diablo III's vibrant, readable style and an isometric camera, was designed touch-first with auto-aim, and delayed its APAC launch for "optimization adjustments" to support a wider range of devices. It later added a PC client and, in Dec 2024, ray-traced lighting and reflections, on platforms not specified in the sources. The lessons that carry over to the web are device tiering, thermal and battery budgets, a legible art style at small sizes, and a scalable baseline with optional high-end extras. No technical postmortem was found.

### Cited Findings
- Engine: **Messiah**, not used for any earlier NetEase game according to Wikipedia. Developers said the game was built from scratch rather than reskinned from Diablo III. Co-developed by Blizzard and NetEase; director Wyatt Cheng. — [Wikipedia [community]](https://en.wikipedia.org/wiki/Diablo_Immortal)
- Messiah was introduced in 2010, focuses on mobile, was optimised for Qualcomm chips through a partnership, and emphasises efficient use of multiple processors (search-snippet level). — [Wikipedia: Messiah Engine](https://en.wikipedia.org/wiki/Messiah_Engine)
- 2018 disclosures: the engine supports PBR, normal mapping and GPU particles. — [Mein-MMO [press]](https://mein-mmo.de/en/diablo-immortal-netease-details,286226); [GameRevolution](https://www.gamerevolution.com/news/453207-diablo-immortal-detail-netease)
- Released June 2, 2022 on Android and iOS, with a Windows beta (cross-play and cross-save) the same day. Blizzard explained the PC version: "many of you would attempt to play this game through an emulator." APAC was delayed to make "a number of optimization adjustments", including support for "a wider range of models and devices". Performance "will only run as good as the phone you're playing it on" (IGN, via Wikipedia). — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_Immortal)
- The game keeps Diablo III's vibrant style and isometric perspective. It was designed mainly for touch, with an on-screen stick and skills that auto-aim at the nearest enemy (hold to aim manually), and it supports gamepads and WASD on PC. — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_Immortal)
- **A Dec 2024 update added ray tracing for lighting and reflections, plus improved liquid effects.** The platform is not specified. — [Wikipedia](https://en.wikipedia.org/wiki/Diablo_Immortal)
- Pixelworks (Apr 2024) says it worked with NetEase on visual processing to address "rendering performance, device temperature, and battery capacity", and that DI is "IRX certified", delivering 120 fps on IRX devices. — [Pixelworks press release [vendor]](https://pixelworks.gcs-web.com/node/16716)

### Inferences
- Treat thermal and battery limits as first-class budgets. Browser players on laptops and integrated GPUs throttle the way phones do, so plan for sustained frame time rather than peak. Ship dynamic resolution and a frame-rate cap.
- Tier by device capability: detect the GPU (WebGL `WEBGL_debug_renderer_info` or WebGPU adapter info) and pick presets automatically, as D4 does on PC (§1).
- A vibrant, high-contrast palette and an auto-aim-friendly camera keep the game readable on small, low-resolution screens. That supports a darker D2/D4-style palette only if values (light/dark contrast) are managed carefully.
- Multi-core emphasis translates to the web as moving simulation, pathfinding and particle updates off the main thread (Web Workers, WebGPU compute).
- Adding RT to a mobile-born game in 2024 confirms the same layering as D4: a cheap universal baseline plus optional high-end features.

### Gaps
- No GDC talk, NetEase tech blog or postmortem on DI's rendering or optimisation was found.
- Minimum device specs, frame-rate targets per device tier, draw-call and particle budgets, and how many enemies are rendered were not verified. The search budget ran out before a Blizzard support-page check.
- Whether the Dec 2024 RT applies to mobile, PC or both is unknown.

---

## 5. Last Epoch, Titan Quest II, No Rest for the Wicked, Hades II, Torchlight Infinite, Lost Ark: notable graphics choices

### Takeaway
The other games span the engine range. Last Epoch, a long-running Unity indie, is known for loot filters and preset reorganisation but has recurring FPS complaints. Titan Quest II uses UE5 (secondary sources say Nanite and Lumen) with steep minimum specs (RTX 2070, SSD). No Rest for the Wicked runs on a customised Unity with a painterly "oil painting" look, and its 1.0 was delayed to 2027 partly for performance. Hades II uses Supergiant's custom engine (C#→C++, The Forge framework) with pre-rendered 3D characters on hand-painted 2D environments. Torchlight Infinite uses UE4. Lost Ark is a long-lived UE3 MMO-ARPG whose art holds up at the default far camera but not zoomed in. The common lesson is that art direction tuned to the fixed isometric distance matters more than engine features.

### Cited Findings
**Summary table (details and sources below)**

| Game | Engine | Platforms / status | Documented perf / specs |
|---|---|---|---|
| Last Epoch | Unity | Windows; 1.0 Feb 21, 2024 | No official targets found |
| Titan Quest II | UE5 (Nanite + Lumen per secondary sources) | Win/PS5/XSX; EA Aug 1, 2025; 1.0 scheduled Jan 19, 2027 | Min RTX 2070 / RX 6700 XT 8 GB, 16 GB, SSD; no res/fps target |
| No Rest for the Wicked | Customised Unity | EA Apr 18, 2024; 1.0 delayed to Mar 2027 | Delay partly for performance |
| Hades II | Supergiant custom engine (C#→C++; The Forge used for Hades) | 1.0 Sep 25, 2025 (Win/Mac/Switch/Switch 2); PS5/XSX Apr 14, 2026 | 120 fps TV mode on Switch 2 (reference title only) |
| Torchlight: Infinite | UE4 | XD Inc. | No technical analysis found |
| Lost Ark | UE3 (DX9 at the PCGH review) | Smilegate | No built-in DLSS/FSR/XeSS (low-reliability source) |

**Last Epoch (Eleventh Hour Games)**
- Unity; Windows (the Mac client was cancelled in Oct 2020 and Linux updates ended in Sep 2024); early access Apr 2019; 1.0 on Feb 21, 2024. — [Wikipedia](https://en.wikipedia.org/wiki/Last_Epoch)
- Customisable **loot filters** arrived in a 2020 update. They are stored as text files that players can share. — [GamingOnLinux [press]](https://www.gamingonlinux.com/2020/10/time-travel-action-rpg-last-epoch-adds-customizable-loot-filters-in-a-major-update/page=1/)
- Graphics options were regrouped into Basic and Advanced, with a **Master Quality** preset that changes most other settings. — [Last Epoch forum [primary/community]](https://forum.lastepoch.com/t/graphics-and-performance-in-last-epoch/11444)
- In 2020, a Vulkan launch option roughly doubled one reviewer's FPS. Commenters reported input lag and AMD crashes. A tester saw texture flicker with AO above "very low". — [GamingOnLinux](https://www.gamingonlinux.com/2020/06/time-travel-action-rpg-last-epoch-has-a-huge-update-out)
- A player on an i5-11600K and RTX 3060 at 1080p reports 50–100 FPS in Monolith maps. Players also request transparency sliders for skill effects, separate for player, party and enemy. — [LE forum](https://forum.lastepoch.com/t/my-feedback-for-devs-after-200-hours-played-in-le/77591); [LE forum (VFX transparency request)](https://forum.lastepoch.com/t/adjustable-skill-transparency-visual-clarity-improvements/76947)
- Performance reportedly improved with 1.0, though some lag spikes remained. — [Sportskeeda [community]](https://sportskeeda.com/mmo/last-epoch-settings-optimization-guide-best-settings-performance-visuals). An HP OMEN guide claims the game now runs on "Unity 6" (vendor marketing, unverified). — [HP [vendor]](https://www.hp.com/gb-en/shop/tech-takes/last-epoch-performance-guide-omen)

**Titan Quest II (Grimlore Games / THQ Nordic)**
- UE5; Grimlore previously made SpellForce 3; Windows, PS5 and Xbox Series; PC early access Aug 1, 2025; full release scheduled Jan 19, 2027. — [Wikipedia](https://en.wikipedia.org/wiki/Titan_Quest_II)
- **Minimum:** i5-8600K / Ryzen 5 2600X, 16 GB RAM, RTX 2070 / RX 6700 XT (8 GB VRAM), DX12, 50 GB, **SSD required**. No resolution, frame-rate or preset target was published. — [DSOGaming [press]](https://www.dsogaming.com/news/titan-quest-2-uses-unreal-engine-5-gets-official-pc-requirements/). **Recommended:** i5-12400 / Ryzen 5 5600X, 32 GB, RTX 3070 Ti / 4070 / RX 6800 XT (12 GB). GameGPU states the game uses **Nanite** for geometry and **Lumen** for GI. — [GameGPU [press]](https://en.gamegpu.com/test-gpu/action-fps-tps/titan-quest-ii-test-gpu-cpu)
- A secondary article says Lumen GI is central to the isometric look, Substance 3D materials are tuned for Lumen's indirect light, and no static lighting is baked (unverified against Grimlore). — [Foro3D, May 2026 [press]](https://foro3d.com/en/2026/mayo/titan-quest-2-y-unreal-engine-5-el-salto-grafico-del-arpg-isometrico.html). Reveal screenshots showed lighting tied to a day/night cycle. — [SI [press]](https://videogames.si.com/news/titan-quest-2-announed)

**No Rest for the Wicked (Moon Studios / Private Division)**
- Runs on a **customised Unity** engine; directed by Thomas Mahler. Mahler says AI is used as a workflow tool but not to generate art or assets. — [Wikipedia](https://en.wikipedia.org/wiki/No_Rest_for_the_Wicked_(video_game))
- Marketing describes a hand-crafted world with a painterly art style "as beautiful as an oil painting" and a "precision ARPG". — [Businesswire (Dec 2023) [primary]](https://www.businesswire.com/news/home/20231207867055/en/Private-Division-and-Moon-Studios-Announce-No-Rest-for-the-Wicked/). Early access began Apr 18, 2024. — [RPG Site](https://www.rpgsite.net/news/15555-no-rest-for-wicked-launches-for-steam-early-access-on-april-18)
- 1.0 moved from Oct 2026 to **March 2027** after playtesting. The team wants more time on performance and the class system. — [Game Informer, Sep 2026 [press]](https://gameinformer.com/2026/09/01/no-rest-for-the-wicked-10-launch-delayed-to-march-2027)

**Hades II (Supergiant Games)**
- Windows early access May 5, 2024. 1.0 on Sep 25, 2025 for Windows, macOS, Switch and Switch 2; PS5 and Xbox Series on Apr 14, 2026. Art director Jen Zee. GameSpot called it the studio's "best looking game yet". A cited IGN title mentions 120 fps in TV mode on Switch 2. — [Wikipedia](https://en.wikipedia.org/wiki/Hades_II)
- The Forge (ConfettiFX, Apache-2.0) README: it can be used to write custom game engines from scratch, "most notably Supergiant Hades". Console support requires a commercial licence. — [The Forge GitHub [primary]](https://github.com/ConfettiFX/The-Forge)
- A Supergiant graphics engineer helped move the studio's custom C# engine to C++ for performance (Hades II era). — [DigiPen [press]](https://www.digipen.edu/showcase/news/hades-2-graphic-programmer)
- Supergiant (2019, about Hades I): "no real-time 3D rendering". Characters such as Zagreus are 3D-modelled and animated, then rendered into "thousands upon thousands of frames… from many different angles". Most environment art is hand-painted 2D. — [Steam developer reply [primary]](https://steamcommunity.com/app/1145360/discussions/0/1738883810796606862)

**Torchlight: Infinite (XD Inc.)**
- **Unreal Engine 4.** — [Wikipedia](https://en.wikipedia.org/wiki/Torchlight:_Infinite); [XD press release](https://gamespress.com/TORCHLIGHT-INFINITE-HIGHLY-ANTICIPATED-ARPG-TO-SHINE-A-LIGHT-ON-GAMEPL)
- The original *Torchlight* drew a faint blue silhouette of the character when hidden behind walls or roofs, a widely cited example of the x-ray occlusion technique. — [Ogre3D wiki [community]](https://wiki.ogre3d.org/Ghosted+Entities+Behind+Other+Entities)

**Lost Ark (Smilegate RPG)**
- Built on **Unreal Engine 3** with DirectX 9 support, according to PC Games Hardware's technical hands-on. NPCs look fine at the default far-above view, but "the closer you zoom in on details, the messier it gets". — [PCGH via Galaxus [press]](https://www.galaxus.de/en/page/a-technical-look-at-lost-ark-excellent-sound-and-double-edged-graphics-22830); [PCGH (DE)](https://www.pcgameshardware.de/Lost-Ark-Spiel-55037/Specials/Lost-Ark-Performance-Sound-Hands-On-1389385/)
- The developer describes a "dynamic quarter-view" camera. — [Korea Times](https://www.koreatimes.co.kr/www/tech/2021/03/134_168117.html). Cutscenes use many camera angles instead of the fixed quarter view. — [Inven Global](https://www.invenglobal.com/articles/21/lost-ark-my-three-day-cbt-review). Others describe it as a 2.5D isometric camera on UE3. — [TalonMarks](https://www.talonmarks.com/?p=10056634)
- There is no built-in DLSS, FSR or XeSS, so resolution scale is the main GPU lever (low-reliability source). — [CheckFPS [community]](https://checkfps.io/en/optimize-fps/lost-ark)

### Inferences
- Lost Ark (UE3/DX9-era) and Hades II (pre-rendered sprites on painted backgrounds) both show that an ARPG can look excellent with old or modest technology if the art is tuned to the default camera distance. A three.js project should set texel density and model detail for that distance and limit zoom.
- Hades' pipeline (render 3D characters to sprite sheets offline, hand-paint the environments) is a real option for very low-end browser targets, and a possible fallback tier like D2R's legacy mode.
- Titan Quest II's UE5 minimum spec (RTX 2070, SSD) shows what Lumen and Nanite cost. Nothing comparable exists in the browser, which is why the PoE2/D4 approach (screen-space or dynamic-light tricks, cached shadows) is the more relevant model.
- NRftW's painterly look on a customised Unity build, and its performance-driven delay, suggest painterly ARPG visuals still need serious optimisation work. They are not automatically cheap.
- Last Epoch's long-running FPS complaints, and the player requests for VFX transparency in LE, D4 and PoE2, show that visual clarity and performance controls need to be designed in from the start, not added later.

### Gaps
- No primary source confirms Titan Quest II's Nanite and Lumen use or its in-game settings (DLSS, FSR, TSR, frame generation). The PCGH early-access article was not fetched.
- NRftW's rendering technique for the painterly look (custom lighting model, post-process, hand-painted textures) is undocumented in the sources found. One search snippet said 3D models approximate a 2D look in cutscenes, but the source could not be pinned down.
- Whether Hades II still uses pre-rendered character sprites, and whether it runs on The Forge as Hades I did, was not verified for the sequel specifically. The Game Informer interview with Jen Zee (July 2024) was not fetched. — [Game Informer](https://gameinformer.com/hades2)
- No renderer details were found for Torchlight Infinite (lighting, VFX management) or Lost Ark (effect-quality options, readability features).
- Last Epoch's render pipeline (built-in, URP or HDRP) and Unity version are unverified.

---

## 6. Genre-wide techniques: camera, occluders, fog of war and light radius, readability, readable dark lighting, hordes, VFX clutter, corpses and decals, minimap

### Takeaway
The documented, cross-game patterns are these. A **fixed, high camera**: D2R uses true orthographic, D4 a fixed isometric view, Lost Ark a quarter-view. Because the camera is fixed, studios rely on screen-space techniques (PoE2 GI) and design foregrounds so they never block play space (D4). Readable darkness comes from tone-map floors, local light pools and emissive accents rather than global brightness. Loot is readable through user-configurable filters (beams, label colours and sizes, minimap icons, positional sounds). VFX clutter is the biggest unsolved readability problem: players of D4, LE and PoE2 all ask for opacity controls over other players' effects. Many specific techniques (x-ray silhouettes, wall fade, fog of war, damage numbers, telegraphs, elite outlines, decals) are standard practice but had **no primary documentation** for these specific games in the sources found.

### Cited Findings
**Camera**
- D2R uses an **orthographic (parallel) projection**. Some level illusions, such as Arcane Sanctuary, depend on it, and camera alignment was locked early. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- D4 uses a fixed overhead isometric camera. Artists add or remove detail for readability and place foreground assets without blocking the play space. — [Blizzard Mar 2022 [primary]](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022); [Wikipedia](https://en.wikipedia.org/wiki/Diablo_IV)
- PoE2's screen-space GI design was "motivated by PoE2's fixed camera". — [Sannikov paper [primary]](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- Lost Ark uses a "dynamic quarter-view", and its art degrades when zoomed in beyond the default. — [Korea Times](https://www.koreatimes.co.kr/www/tech/2021/03/134_168117.html); [PCGH via Galaxus](https://www.galaxus.de/en/page/a-technical-look-at-lost-ark-excellent-sound-and-double-edged-graphics-22830)

**Occluders (walls and props between camera and player)**
- *Torchlight* draws a faint blue silhouette when the character is behind walls or roofs. The Ogre3D snippet describes rendering occluded parts with a different look. — [Ogre3D wiki](https://wiki.ogre3d.org/Ghosted+Entities+Behind+Other+Entities)
- Community approaches to "Diablo-style walls": composite a second camera's render through an alpha mask, or use an opaque material on the camera-facing side of walls and a semi-transparent material on the inside. — [Unity forum [community]](https://discussions.unity.com/t/how-to-achieve-diablo-style-walls-55047/55047)
- Occlusion queries for silhouettes use mesh bounding boxes and so aren't exact, though thin character boxes reduce the error. — [Babylon.js forum](https://forum.babylonjs.com/t/showing-highlighted-silhouette-of-mesh-only-when-it-is-occluded/27783). Godot has an occlusion-outline shader example. — [Godot Shaders](https://godotshaders.com/?p=12489)
- D4's documented answer is partly level design: thanks to the fixed camera, foreground assets are placed so they don't block play space. — [Blizzard Mar 2022](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022)

**Readability: lighting, silhouettes, interactables, UI**
- D4 silhouettes the player space, uses dungeon lighting that hints at paths, and uses emissive accents on interactable props. — [Blizzard Mar 2022](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022); [Blizzard Varnish](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- D2R keeps information identical across graphics modes, keeps the screen centre clear when UI panels are open, raised text contrast, and used hand-painted highlights on gems so small loot reads well. — [Inven Global](https://www.invenglobal.com/articles/15159/diablo-2-resurrected-devs-share-their-process-for-remaking-an-iconic-game-we-are-preserving-this-game); [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)

**Loot labels, beams, minimap icons (PoE item filter, primary documentation)**
- `PlayEffect <Colour> [Temp]` draws a loot **beam** in one of 11 colours (Red, Green, Blue, Brown, White, Yellow, Cyan, Grey, Orange, Pink, Purple). `Temp` shows the beam only while the item drops. — [pathofexile.com item filter [primary]](https://www.pathofexile.com/item-filter/about)
- `MinimapIcon <Size 0–2> <Colour> <Shape>` offers 12 shapes (Circle, Diamond, Hexagon, Square, Star, Triangle, Cross, Moon, Raindrop, Kite, Pentagon, UpsideDownHouse). `SetFontSize 1–45`. Text, border and background colours take RGBA (background alpha defaults to 240). `PlayAlertSoundPositional` plays at the item's 3D location. — [pathofexile.com item filter [primary]](https://www.pathofexile.com/item-filter/about)
- Last Epoch's loot filters are shareable text files. — [GamingOnLinux](https://www.gamingonlinux.com/2020/10/time-travel-action-rpg-last-epoch-adds-customizable-loot-filters-in-a-major-update/page=1/)

**Dark but readable lighting**
- D4: SDR tone mapping lifts the darkest values to ~0.1 nits; HDR keeps "true black"; players calibrate black point, brightness and white point; an open-beta LUT bug that lifted blacks to ~0.07 nits was treated as a defect; "negative light" exists for dark magic. — [Blizzard Varnish](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- D4 relies on soft shadows, fog and bounce light, with warm interiors contrasting cold exteriors. — [Blizzard Mar 2022](https://news.blizzard.com/en-us/article/23788294/diablo-iv-quarterly-updatemarch-2022). D2R dropped strict PBR to keep the dark tone. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)

**Hordes and VFX density**
- D2R worst cases: 57 simultaneous missile effects with dynamic lighting; lightning built from 2 effects repeated 15 times; up to 100 Necromancer pets. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/)
- RC GI cost does not depend on scene content: in the 2D proof of concept, a handful, ~10² and ~100² emitting particles take the same ~12 ms. — [Sannikov paper](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)

**VFX clutter management**
- D4 players ask for opacity sliders for other players' effects. Necromancer pets are already nearly invisible to other players for visibility. — [Icy Veins](https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/). Similar requests exist for LE. — [LE forum](https://forum.lastepoch.com/t/adjustable-skill-transparency-visual-clarity-improvements/76947). For PoE2, as of Dec 2024, there was "no way" to disable allied effects. — [Steam](https://steamcommunity.com/app/2694490/discussions/0/830448585302643582)

**Corpses, blood, wetness**
- D4 has skill-driven blood on characters, rain wetness that dries indoors, vertex-animated wriggling blood and limbs, and (with RT) reflections in **pools of blood**. — [Blizzard Varnish](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv); [NVIDIA](https://www.nvidia.com/en-us/geforce/news/diablo-iv-ray-tracing-update-out-now/)

**Fog**
- D2R uses layered fog placed by hand. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/). D4 uses lit volumetric dust and fog, with stained-glass windows emitting light into the volume. — [Blizzard Varnish](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)

### Inferences
- **Projection:** use `OrthographicCamera`, or a perspective camera with a narrow FOV (telephoto) at a fixed pitch. Orthographic keeps tile alignment and D2-style illusions intact. Narrow-FOV perspective adds slight depth. Either way, lock the camera early and author assets for that one view.
- **Occluders:** combine level design (D4) with runtime fallbacks. Fade or dither walls inside a screen-space circle around the player (screen-door dithering avoids sorting transparencies), and draw an x-ray silhouette pass for characters (`depthFunc` GreaterDepth or stencil, flat colour plus rim) like Torchlight. Dithered fade costs nothing in sorting and works the same in WebGL2 and WebGPU.
- **Readable darkness:** enforce a black floor in tone mapping, keep a bright warm light around the player (a functional "light radius"), use emissive cues for interactables and loot, and add rim or outline only for elites and bosses to keep a clear hierarchy.
- **Loot:** a data-driven filter (beam colour, label style, minimap icon, positional sound) is cheap to build and is the genre's established readability standard. Beams can be additive camera-facing quads or cylinders.
- **VFX clutter:** design in from the start an "other players' and allies' VFX opacity" setting, an intensity cap, and a rule that enemy telegraphs always draw on top. All three games' communities ask for this.
- **Hordes:** D2R's worst cases imply instanced rendering (`InstancedMesh` or `BatchedMesh`), GPU-skinned or vertex-animation-texture crowds, pooled dynamic lights with priority culling, and GI whose cost doesn't grow with light count (an RC-like screen-space method) rather than per-light shadows.

### Gaps
- No primary documentation was found for the following in D4, PoE2 or the other games: wall cutaway or dither-fade, x-ray silhouettes (only *Torchlight* via a community wiki), **fog of war or minimap rendering** (beyond PoE's minimap loot icons), D2's **light-radius mechanic** and how D2R renders it, **damage-number** rendering, **ground telegraph** techniques, **elite or monster outline and rim-light rules**, **corpse persistence or blood decal** systems, and **horde rendering** techniques (instancing, VAT, LOD, animation budgets). The search budget ran out before these could be pursued. Treat the inferences above as general practice, not documented studio practice.
- Whether D4 or PoE2 added other-player VFX opacity options after 2024 is unverified.

---

## 7. What should a browser three.js Diablo-like (WebGL2/WebGPU, no hardware RT) prioritise? (synthesis)

### Takeaway
The documented record points to art direction and lighting design first and feature count second. Copy D4's "small feature set, highly polished" approach: a dark-but-floored tone map, many cheap dynamic local lights, a few cached and time-sliced shadow casters, lit fog, flow-map and noise VFX, and cached terrain blending. Take PoE2's lesson that a fixed camera makes screen-space GI (RC-like or horizon-based) both affordable and convincing. Take from D2R a fixed (ideally orthographic) camera, a decoupled simulation and renderer, the "same information in every mode" rule, and explicit worst-case VFX budgets. Add genre readability systems (loot filter with beams and icons, occluder fade and silhouettes, VFX opacity for others) from day one. Treat RT-class extras the way D4 and Diablo Immortal did: optional tiers.

### Cited Findings
- D4 chose a small set of polished features, gameplay first, and scaled from GTX 660 at 720p/30 to 4K/60. — [Blizzard Varnish](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv); [Battle.net](https://battle.net/support/article/251518)
- D4's techniques: cached static shadows plus a dynamic overlay, time-sliced; virtual-textured terrain; noise and flow-map VFX; lit volumetrics; an SDR floor of ~0.1 nits. — [Blizzard Varnish](https://news.blizzard.com/en-us/article/23964183/peeling-back-the-varnish-the-graphics-of-diablo-iv)
- PoE2 GI is screen-space RC at 3 ms on a GTX 1050, with no temporal accumulation and no off-screen emitters. PoE1 has shipped horizon-based screen-space GI since 2018, plus hierarchical screen-space soft shadows. — [Sannikov paper](https://github.com/Raikiri/RadianceCascadesPaper/blob/main/out_latexmk2/RadianceCascades.pdf)
- D2R: orthographic camera, 70/30 rule, strict PBR dropped, simulation and renderer decoupled, information parity, explicit worst-case VFX. — [4Gamer](https://www.4gamer.net/games/554/G055460/20220326013/); [Inven Global](https://www.invenglobal.com/articles/15159/diablo-2-resurrected-devs-share-their-process-for-remaking-an-iconic-game-we-are-preserving-this-game); [GDC Vault](https://gdcvault.com/play/1027672/Resurrecting-a-Classic-Bringing-Diablo)
- RT was added later as an optional tier in D4 (2024) and Diablo Immortal (Dec 2024). — [NVIDIA](https://www.nvidia.com/en-us/geforce/news/diablo-iv-ray-tracing-update-out-now/); [Wikipedia: DI](https://en.wikipedia.org/wiki/Diablo_Immortal)
- PoE item-filter primitives (beam colours, minimap icon shapes and sizes, font size, positional sound) set the loot-readability standard. — [pathofexile.com](https://www.pathofexile.com/item-filter/about)

### Inferences
Suggested priority order for the three.js lab (inference, not sourced practice):
1. **Camera and art contract:** a fixed pitch with orthographic or narrow-FOV projection, texel density authored for that distance, and a lighting and colour "array" review process (D2R) to stop drift.
2. **Tone mapping and grading:** an ACES-like or custom curve with an explicit black floor and a curated LUT, plus player black-point and brightness sliders (D4). Watch for LUT precision bugs (D4's `log()` floor).
3. **Light budget:** many unshadowed point lights through clustered or tiled forward shading (three.js has no deferred renderer by default), with only 1–3 shadowed lights. The sun or moon shadow is cached for static geometry and updated rarely. Dynamic casters use a smaller map. Local-light shadow updates are spread round-robin across frames (D4). Respect the WebGPU sampler limit (local lab note).
4. **Screen-space GI tier:** start with a horizon-based SSGI or GTAO-style pass (PoE1 HSSVGI-like). Then trial an RC-style screen-space cascade pass in WebGPU compute, with emissive spells and monsters as sources and a guard band for edge emitters (PoE2). Keep it optional.
5. **Atmosphere:** height fog plus cheap lit volumetric planes or froxels near lights, and hand-placed fog layers (D2R/D4).
6. **Materials and terrain:** bake splat blending into per-chunk cached textures (D4 virtual-texture idea); curvature or AO-driven edge darkening; snow, wet and blood overlays as shader parameters (D4).
7. **VFX system:** noise and flow-map shaders over flipbooks, instanced particles, emissive VFX feeding GI, an opacity setting for other players' effects, and enemy telegraphs always on top.
8. **Readability systems:** occluder dither-fade plus a character x-ray silhouette, elite rim or outline, a filter-driven loot label, beam and minimap-icon system, and the "same information at every quality level" rule (D2R).
9. **Scalability:** auto-detected presets, a resolution-scale slider, dynamic resolution, and a frame-rate cap for laptops and integrated GPUs (D4, Diablo Immortal).

### Gaps
- There are no public browser benchmarks for screen-space RC or SSGI in three.js on integrated GPUs. Feasibility has to be measured in the lab, and the lab notes say to measure in frames, not seconds.
- No studio documented its occluder, fog-of-war, telegraph, damage-number or horde-rendering implementation in the sources found, so those priorities rest on general practice.
- The GDC 2024 Diablo IV talks (environment art, art performance, art pillars, water) and the Diablo II: Resurrected engineering talk would likely fill many gaps but are behind GDC Vault membership.

# Remaining gaps from round 1: AAA rendering techniques (2024–2026) for an isometric Diablo II-style ARPG in three.js (WebGL2/WebGPU, no hardware RT)

Scope note: this file closes gaps listed in the round-1 notes (atmosphere_vfx_stylized, post_image_quality, materials_surfaces, lighting_gi_shadows, optimization_performance). About 42 web searches were used. Most evidence comes from direct fetches of primary pages, plus three slide decks downloaded and text-extracted locally: MegaLights SIGGRAPH 2025, DOOM 2016 (image-only, so no text) and the 2009 anisotropic Kuwahara paper. Items marked "(search snippet)" were seen only in search-result summaries because the page refused the fetcher (HTTP 403/503). Treat them as lower confidence.

## 1. VFX and stylization talks (Diablo IV, PoE2, Hi-Fi Rush, HoYoverse, Guilty Gear Xrd) and published costs for outlines and Kuwahara

### Takeaway
The most detailed primary toon/stylization sources are now verified:
- Guilty Gear Xrd's vertex-colour and texture-channel conventions, from 4Gamer's 2014 two-page breakdown.
- Genshin Impact's console pipeline, from a Unite Seoul 2020 talk. It covers shadows, fog, SSR and colour, but not toon ramps or face shadows.
- Hi-Fi Rush's GDC 2024 talk topics. Its implementation details and ms costs are not public in any page I could open.

Neither Diablo IV nor PoE2 has a public VFX-specific talk. The only published stylization cost found is the anisotropic Kuwahara filter: 12 fps at 512×512 on a GTX 280 (2009). No ms figure for screen-space outlines was found.

### Cited Findings
**Hi-Fi Rush (Tango Gameworks, GDC 2024)**
- Talk: "3D Toon Rendering in 'Hi-Fi RUSH'" by Kosuke Tanaka and Takashi Komada, GDC 2024, Visual Arts track, tagged "free content" — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi); second Vault entry with the same abstract and no slide link — [GDC Vault](https://gdcvault.com/play/1034251/3D-Toon-Rendering-in-Hi)
- The whole game (characters and environments) is toon-shaded with a customised UE4 at 60 fps native resolution. It uses a "deferred toon renderer" in which customised UE4 render passes, plus passes the team added, are "combined inside deferred rendered post-process volumes" — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi); [80.lv](https://80.lv/articles/the-making-of-hi-fi-rush-s-3d-toon-rendering-style)
- Listed topics: comic shaders, toon lights, dynamic shadow-map strategies, static shadow maps, light-probe GI, and the face-shadow implementation. The abstract does not describe the outline method, the face-shadow method or ms costs — [GDC Vault](https://gdcvault.com/play/1034330/3D-Toon-Rendering-in-Hi)
- The CEDEC 2023 Hi-Fi Rush talk (director John Johanas) was about game design, not rendering — [Game*Spark](https://www.gamespark.jp/article/2023/08/30/133508.html) (search snippet)

**Guilty Gear Xrd (Arc System Works; 4Gamer article by Zenji Nishikawa, 2014-07-12; GDC 2015 talk by Junya C. Motomura)**
- GDC 2015 talk page: "GuiltyGearXrd's Art Style: The X Factor Between 2D and 3D" — [GDC Vault](https://www.gdcvault.com/play/1022031/GuiltyGearXrd-s-Art-Style-The)
- Base setup — [4Gamer p.1](https://www.4gamer.net/games/216/G021678/20140703095/):
  - Unreal Engine 3, with mesh import modified so hand-edited vertex normals are not recomputed.
  - Forward rendering at 1280×720, 60 fps, with FXAA (not MSAA).
  - Every model gets a Z-prepass; characters get one extra pass for the outline.
- Scene budget: about 800k polygons per scene (about 250k for two characters, about 550k for the background; about 40k per character), ≤160 MB of textures, and 60–70 vertex shaders and 70–80 pixel shaders per scene. Platform: Sega RINGEDGE 2 arcade hardware — [4Gamer p.1](https://www.4gamer.net/games/216/G021678/20140703095/)
- Lighting and shading — [4Gamer p.1](https://www.4gamer.net/games/216/G021678/20140703095/):
  - One directional light is used only for dynamic character shadows on the ground. Other shadows are baked into vertex colours or textures.
  - Each character has a private light vector in its shader, adjusted per motion and frame by frame in cutscenes.
  - Shading is two-tone, with a threshold on the lighting result (example threshold 128).
- Vertex-colour channels — [4Gamer p.2](https://www.4gamer.net/games/216/G021678/20140703095/index_2.html):
  - **R** = shadow-threshold offset (1 is standard, 0 means always in shadow), effectively hand-painted AO.
  - **G** = how much the outline expands with camera distance.
  - **B** = outline Z-offset (pushes the hull into neighbouring surfaces to hide unwanted lines).
  - **A** = line thickness (0.5 standard, 1 maximum, 0 removes the outline).
- Outline method: back-face ("inverted hull"). The model is inflated in the vertex shader and drawn with front faces culled, and thickness is painted per vertex (thicker at the cheeks, tapering to the chin) — [4Gamer p.2](https://www.4gamer.net/games/216/G021678/20140703095/index_2.html)
- "Motomura lines" (inner lines) — [4Gamer p.2](https://www.4gamer.net/games/216/G021678/20140703095/index_2.html):
  - Drawn only as horizontal and vertical texel lines in a texture, with UVs warped so the lines land on curves. This avoids stair-stepping, and bilinear filtering acts as anti-aliasing.
  - Line thickness is set by UV texel density.
  - The lines are stored in the alpha channel of the "ilm" lighting-control texture.
- Other texture channels — [4Gamer p.2](https://www.4gamer.net/games/216/G021678/20140703095/index_2.html):
  - ilm R = specular intensity.
  - ilm B = "highlight susceptibility" (at maximum, the highlight is effectively baked in).
  - ilm G = the same hand-painted shadow-prone weight as vertex R (from p.1).
  - The "SSS texture" is a shadow tint, not real subsurface scattering: shadow colour = SSS texture × ambient colour.
- Normals: hand-edited on faces. For clothing and hair, normals are transferred from simple proxy shapes (e.g., a cylinder onto Sol's pants) — [4Gamer p.1](https://www.4gamer.net/games/216/G021678/20140703095/)

**Genshin Impact console rendering (miHoYo; Unite Seoul 2020 talk by Zhenzhong Yi, published dubbed by Unity Japan on 2021-06-21)**
- Talk title: "From Mobile to Console: Genshin Impact's rendering technology on Console". It covers PS4/PS4 Pro/PC. PS4 Pro renders native 4K; PS4 renders 1440p and outputs 1080p. Over half the console features use compute — [Docswell slides](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi)
- Shadows — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi):
  - Up to 8 shadow cascades: the first 4 update every frame and the last 4 are interleaved, so 5 update per frame.
  - A screen-space soft-shadow pass with 11 Poisson samples costs about 2–2.6 ms. A 1/4-resolution penumbra mask (blurred) cuts this to about 1.3–1.7 ms.
- AO: HBAO for fine detail, plus precomputed "AO Volumes" for static objects and **capsule AO for characters**. It runs at half resolution with bilateral upsampling — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi)
- Local lighting and shadow storage — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi):
  - Clustered deferred lighting: 1024 lights in view, 64×64-pixel tiles × 16 depth slices.
  - About 100 shadowed local lights.
  - Baked shadow textures are compressed about 20:1–30:1 by default (example: a 2k² texture goes from 8 MB to 274.4 KB, 29.85:1; high-precision mode gives about 14:1). Decompression costs about 0.05 ms per 1k² texture on a base PS4.
- Fog and god rays: froxel fog aligned with the cluster grid, under 1 ms. Separate half-resolution god rays ray-march up to 5 cascades — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi)
- Reflections — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi):
  - Reflection probes are baked as mini G-buffers and relit at runtime, one probe per frame, then compressed to BC6H.
  - 3-band SH ambient probes are extracted from the reflection probes.
  - Hi-Z SSR costs about 1.5 ms on PS4 Pro.
- Colour: HDR10 since version 1.2. The game skips the ACES RRT/ODT; WCG LUT grading costs under 0.05 ms. Toon ramps, face shadows and outlines are **not** covered in this talk — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi)

**HoYoverse ramps and SDF face shadows**
- No first-party HoYoverse talk was found. Community reverse-engineered shaders describe "Genshin facial shadow gradient / SDF texture (dynamic face shadow map)" — [GitHub NoiRC256/URPSimpleGenshinShaders](https://github.com/NoiRC256/URPSimpleGenshinShaders) (reverse-engineered, not first-party)

**Diablo IV (Blizzard)**
- GDC 2024 talks (none is VFX-specific):
  - "Embracing Art Performance on 'Diablo IV'" (Evan Edwards, Senior Technical Artist): the culture of optimization; the page gives no numbers — [GDC Vault](https://gdcvault.com/play/1034353/Embracing-Art-Performance-on-Diablo)
  - "The Pillars of Hell: Achieving the Artistic Vision of 'Diablo IV'" (John Mueller, Art Director): five processes for sharing the vision; no rendering specifics on the page — [GDC Vault](https://www.gdcvault.com/play/1034608/The-Pillars-of-Hell-Achieving)
  - "H2O in H3LL: The Various Forms of Water in Diablo IV" (Technical Artist Summit, Aaron Aikman): shorelines, dynamically accumulating puddles, snow-topped rocks, Helltide rivers and icy caves; trade-offs of deferred-rendered water; avoiding distracting highlights given the fixed camera angle; shaping waves through terrain — [GDC schedule](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730) (search snippet; page returned 403)
  - "Diablo IV: The Art of Open World Sanctuary": developing for an isometric camera, performance, cohesion — [GDC schedule](https://schedule.gdconf.com/session/diablo-iv-the-art-of-open-world-sanctuary/899417) (search snippet)
- A December 2021 quarterly update on D4 VFX describes a "Gameplay First" rule: things that demand immediate attention are highlighted, while environment effects stay non-intrusive — [Wowhead DE](https://de.wowhead.com/news/physical-based-rendering-and-visual-effects-diablo-iv-quarterly-update-325416) (search snippet)

**Readable-VFX talk (GDC 2024, not ARPG)**
- "Attention Overload: Creating Readable VFX for Suicide Squad: Kill the Justice League" by Hanno Hinkelbein (Lead VFX Artist, Rocksteady), GDC 2024. It covers steering player focus without overwhelming players, team structure and tools — [GDC schedule](https://schedule.gdconf.com/session/attention-overload-creating-readable-vfx-for-suicide-squad-kill-the-justice-league/899824) (search snippet)
- A further session, "Controlled Chaos: 12 Principles of Design for VFX", is listed (year not confirmed) — [GDC schedule](https://schedule.gdconf.com/session/controlled-chaos-12-principles-of-design-for-vfx/914747) (search-result title only)

**Path of Exile 2 (Grinding Gear Games)**
- Alexander Sannikov's ExileCon 2023 rendering talk focused on "re-using resources to get graphical uplift without increasing the resource costs". He also showed blending background elements slightly into the floor and blending animations for smoothness — [Maxroll recap](https://maxroll.gg/poe/news/exilecon-wrapup-new-guides-and-expansion)
- The talk is inside the "ExileCon 2023 – Day 2 – Live Stream" video — [YouTube](https://www.youtube.com/watch?v=XE3MAFGDzWw)
- No GGG VFX talk at GDC was found; the search only surfaced item-design and worldbuilding ExileCon talks and VFX job ads — [Gamers Unchained](https://www.gamersunchained.com/news/path-of-exile-2-developers-discuss-item-design-and-mechanics-in-presentation-from-exilecon)

**Engine-level stylization (new in 2026)**
- UE 5.8 adds "Substrate NPR Shading (Experimental)" / "Substrate Toon Shading": "a stylized non-photorealistic rendering solution built on the Substrate Blendable GBuffer". It offers "ramp-based diffuse and specular control with dithering, self-shadowing extinction with hatching patterns", "anisotropic specular highlights, and global illumination scale controls". Outlines are not mentioned — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)

**Published costs**
- Anisotropic Kuwahara (Kyprianidis, Kang, Döllner, Pacific Graphics 2009) — [paper PDF](https://www.kyprianidis.com/p/pg2009/jkyprian-pg2009.pdf):
  - 512×512 images and DVD-quality video run at **12 fps on an NVIDIA GeForce GTX 280**, with σr = 3.0, σs = 1.0 and N = 8 sectors.
  - Reducing to N = 4 sectors speeds it up with "slightly less sharp boundaries".
  - Implemented in GLSL; the four sector weights are packed into one RGBA texture fetch.
- Screen-space depth/normal outlines: no published ms figure was found. A Unity asset (Outline Zero) claims cost is independent of width and covers only the outlined screen area, but gives no numbers in the snippet — [Unity Asset Store](https://assetstore.unity.com/packages/tools/outline-zero-2190027) (search snippet; vendor claim)

**three.js building blocks that exist (dev branch, r187dev, checked Oct 2026)**
- OutlinePass, HalftonePass, BokehPass, RenderPixelatedPass — [three.js postprocessing](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing)
- TSL `OutlineNode`, `SobelOperatorNode`, `PixelationPassNode` — [three.js tsl/display](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/tsl/display)
- `ToonShader`, `HalftoneShader`, `SobelOperatorShader` — [three.js shaders](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/shaders)
- Examples `webgl_materials_toon`, `webgpu_materials_toon`, `webgpu_postprocessing_outline`, `webgpu_postprocessing_sobel`, `webgpu_tsl_halftone` — [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples)
- No Kuwahara shader or example exists in the three.js examples (directory listing filtered for "kuwahara") — [three.js shaders](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/shaders)

### Inferences
- **Outlines for a D2-like ARPG:** the GGXrd recipe ports directly to three.js on both WebGL2 and WebGPU:
  - an inverted hull drawn only on characters, monsters and loot (one extra geometry pass);
  - vertex-colour A for thickness and B for hiding lines;
  - a near-constant camera distance in an isometric view, so the camera-distance channel (G) can be a single global factor.

  Cost scales with the triangle count of outlined meshes, not with screen size, which suits a 1080p–4K browser target.
- **Full-scene outlines:** a screen-space Sobel on depth/normals (OutlineNode/SobelOperatorNode) is one full-screen pass whose cost scales with pixel count. No published ms exists, so it should be profiled in the lab at 1080p and 1440p. If it is too expensive, run it at half resolution or only on stencil/ID-tagged objects.
- **Kuwahara:** the 2009 figure (about 83 ms per frame at 0.26 MP on a GTX 280) implies a heavy per-pixel cost. Even with roughly 10–30× faster modern GPUs, 1080p (about 8× the pixels) would likely cost several ms. Use it only for menus, the town or stills, or run it at half resolution with N = 4 sectors. (This is my extrapolation, not a measured number.)
- **Genshin's tricks that transfer to three.js:**
  - Mask the penumbra region at 1/4 resolution, then run expensive soft-shadow filtering only there (a PCSS/PCF optimization).
  - Capsule AO under characters (cheap and very readable from above).
  - Update far shadow cascades less often. With an isometric camera, a single fitted shadow map plus cached static shadows may be enough.
- **Hi-Fi Rush's "deferred toon" idea:** apply toon ramps in a full-screen pass over G-buffer-like render targets. In three.js this means MRT normal/albedo outputs feeding a post pass. It avoids per-material toon permutations but requires MRT plumbing; check three.js MRT support with the three.js researcher's notes.
- **UE 5.8 Substrate Toon** (ramps plus dither plus hatching on a blendable G-buffer) validates the "PBR G-buffer plus stylized ramp" hybrid as a current AAA direction, not only an indie one.

### Gaps
- Hi-Fi Rush's outline method, face-shadow technique and per-pass costs: the GDC 2024 slides or video were not accessible (login limit), and no transcript was found.
- No first-party HoYoverse talk (Genshin, Honkai: Star Rail, ZZZ) on ramps, outlines or SDF face shadows was found. The Unite 2020 talk excludes toon shading. The SDF face map remains documented only by reverse-engineering projects.
- No Diablo IV or PoE2 VFX-specific talk exists in any searchable listing. The ExileCon 2023 talk content beyond Maxroll's summary is unverified (inara.cz returned 503). ExileCon 2026 is reportedly scheduled for 7–8 November 2026 and may add material — [goha.ru](https://www.goha.ru/path-of-exile-2-gotovitsya-k-exilecon-2026-novye-podrobnosti-igry-raskroyut-uzhe-v-noyabre-d72KL0) (search snippet)
- Ben Golus's "The Quest for Very Wide Outlines" (JFA vs brute force timings) is still unreadable: Medium and its mirrors returned 403, 404 or certificate errors.
- No shipped game was found using a Kuwahara post filter, and no modern-GPU ms figure was found.
- GGXrd limited-animation (stepped keys) details are in part 2 (後編) of the 4Gamer article, which was not fetched.

## 2. Effect-clarity and accessibility settings in ARPGs/MMOs

### Takeaway
The MMOs have the most mature systems:
- WoW's Spell Density (reworked in 11.2) and FFXIV's per-source Battle Effects (self, party, others, PvP enemies × all, limited, none) filter visuals by **who cast them**. Enemy and NPC telegraphs are always exempt.

The ARPGs lag behind:
- Diablo IV offers only colour outline highlighting.
- PoE2 has no ally-effect toggle per available community sources.
- Lost Ark has a "Battle effects" filter, but it is documented only by third-party guides.

### Cited Findings
**World of Warcraft**
- Spell Density in Patch 11.2 (mid-2025) — [Wowhead](https://www.wowhead.com/news/players-can-reduce-allied-spell-visuals-via-options-in-patch-11-2-377460); [Icy Veins](https://www.icy-veins.com/wow/news/less-visual-clutter-spell-density-feature-bugged-fix-coming/) (search snippet; both pages blocked the fetcher):
  - Previously, the option "would dynamically reduce the amount of spell visuals being displayed, based on your current framerate".
  - In 11.2 it was reworked to reduce visuals "based on design goals", with levels **Everything / Reduced / Essential**. It only affects spell visuals cast by other party or raid players.
  - "Your own and your pet's spell visuals, NPC spells, and enemy player spells will always be displayed at full intensity".
- The feature initially did not work on live servers. Blizzard acknowledged the bug; a later article said it still did nothing without a console command — [Icy Veins](https://www.icy-veins.com/wow/news/less-visual-clutter-spell-density-feature-bugged-fix-coming/); [Icy Veins (wp-prod)](https://wp-prod.icy-veins.com/?p=93546) (search snippets). A later hotfix summary says "many new spells" were added to Spell Density's modifications — [Icy Veins (wp-prod)](https://wp-prod.icy-veins.com/housing-decor-added-brawlers-guild-nerfs-spell-density-improvements-tww-weekly-hotfix-summary-december-15-22/) (search snippet)
- Players describe the "Projected Textures" setting as controlling ground effects (fire, healing circles, boss mechanics), separate from Spell Density, and advise keeping it on for readability — [Blizzard forums](https://us.forums.blizzard.com/en/wow/t/projected-textures/761581); [hone.gg](https://hone.gg/blog/best-wow-graphics-settings/). A readability addon keeps projected textures on — [CurseForge](https://www.curseforge.com/wow/addons/monkas-graphics-optimizer). (Community sources.)

**Final Fantasy XIV**
- Menu: Character Configuration → Control Settings → Character tab → "Battle Effects". Own character, party members and other players are set separately (an "Enemy PC" entry also appears), with **Show All / Show Limited / Show None** — [official FFXIV UI guide](https://na.finalfantasyxiv.com/uiguide/faq/faq-other/setting_bteffect.html)
- Text command `/bfx` with subcommands self / party / other / enemypc and values all / simple / off — [Lodestone text command](https://na.finalfantasyxiv.com/lodestone/playguide/db/text_command/9241c2b27da/); [consolegameswiki](https://ffxiv.consolegameswiki.com/wiki/Configuration_text_commands) (search snippets)
- Community reports say "Limited" still shows ground effects such as Asylum, Sacred Soil, Earthly Star and Doton — [Square Enix forum](https://forum.square-enix.com/ffxiv/threads/91130-TIP-Battle-effects-can-already-be-toned-down-in-Character-Options.) (search snippet; user report)

**Diablo IV**
- Vision options include "Player and Item Highlighting": outline players, enemies, objects and NPCs in a chosen colour. Also font and cursor resizing, gear audio cues and a screen reader — [GINX, updated 2024-07-19](https://www.ginx.tv/en/accessibility-options-2)
- No option to hide or dim other players' skill effects:
  - Players request a toggle, an opacity slider for their own effects, and outline-only rendering of allies' AoEs, and say colour-blind filters do not help — [Icy Veins](https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/) (search snippet).
  - An earlier piece covers the same request before Vessel of Hatred (Oct 2024) — [Icy Veins](https://www.icy-veins.com/d4/news/has-disabling-other-players-effects-become-needed-for-diablo-4/) (search snippet).
  - The latest patch seen in the search results (2.6.1, 24 Mar 2026) did not add one (search summary).

**Path of Exile 2**
- No option to disable allied skill effects, per a December 2024 Steam forum reply — [Steam discussion](https://steamcommunity.com/app/2694490/discussions/0/830448585302643582) (user statement). PoE1 had the same situation in 2023 — [Steam discussion](https://steamcommunity.com/app/238960/discussions/0/3816291265159963673)

**Lost Ark**
- A guide recommends setting "Battle effects" to "Buff Effects only", which removes most combat effects except support buffs, healing and shields — [Vulkk (2022)](https://vulkk.com/2022/02/20/lost-ark-settings-and-ui-guide-what-should-you-change/) (search snippet)
- An FPS guide mentions disabling "Other Players Skill Effects" — [checkfps](https://checkfps.io/optimizar-fps/lost-ark) (search snippet)
- A boss front/rear "assault detection" indicator with a configurable hue sits under Gameplay Settings → Controls and Display — [itemlevel.net (2022)](https://itemlevel.net/lost-ark-guide-to-all-quality-of-life-improvement-settings/)

**Platform guidance**
- Xbox Accessibility Guideline 117: "Avoid the use of camera shake, camera bobbing effects, motion blur, mouse blur, and more or provide an option to turn off these behaviors". Its example is Halo Infinite's 0–100% sliders for radial blur, screen shake, full-screen effects and speed lines. It also asks for a way to disable moving or flashing background content — [Microsoft Learn XAG 117](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117)
- XAG version 3.2 was published 8 June 2023 — [Microsoft Learn XAG index](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines)

### Inferences
- **How these work:** the shared pattern is per-effect metadata, i.e., caster relation (self / party / other / enemy) and an "essential" flag set by designers. A runtime filter then drops, simplifies or fades emitters. WoW's move from framerate-driven culling to design-tagged tiers shows that tagging is needed for predictable readability. (The tagging mechanism is my inference from "based on design goals" and per-spell hotfix additions.)
- **For a D2-style co-op ARPG in three.js:**
  - Add a VFX "source class" plus an "essential" flag to every emitter or decal.
  - Expose Self / Party / Others levels (Full / Reduced / Essential / Off) and an ally-effect opacity multiplier applied to additive particle materials.
  - Always render enemy telegraphs (projected decals) and ground hazards at full strength, as WoW and FFXIV do.
  - Add D4-style colour outlines (which can reuse the outline pass from §1) plus XAG-117 sliders for shake, flash and blur.
- Reducing other players' particles also cuts overdraw, the main GPU cost of ARPG VFX, so the clarity setting doubles as a performance setting. WoW's original Spell Density was performance-driven.

### Gaps
- Official Blizzard patch-note wording for WoW 11.2 Spell Density, and whether the bug was fixed, are unverified (Icy Veins, Wowhead and Blizzard Watch blocked the fetcher; Wowhead returned empty).
- The official D4 accessibility blog and current (post-March 2026) D4 options were not fetched. PoE2 options after 0.2/0.3 were not checked against official patch notes.
- Lost Ark's exact current option names come only from 2022 third-party guides.
- No source was found describing how any of these games implement the filtering (emitter culling vs LOD vs opacity), and no GPU savings were published.
- The Rocksteady readable-VFX talk content (only the schedule listing was seen) and GDC talks on League of Legends or Overwatch VFX clarity were not retrieved.

## 3. Post-processing: HGIG/HDR calibration, tilt-shift/DoF in isometric games, AgX in shipped games, UE 5.8 and ACES 2.0

### Takeaway
UE 5.8's switch to ACES 2.0 is **confirmed by Epic staff** on the official forum (`r.HDR.Aces.Version` now defaults to 2; a new Film "Method" chooses Filmic or Standard ACES). It is not stated in the release-notes text I read.

AgX is now built into Godot 4.4 (March 2025) and three.js (`AgXToneMapping`), but no shipped game was confirmed using it. HGIG's core guidance is to use each display's full capability and avoid complicated in-game calibration. Tilt-shift and DoF are documented for HD-2D titles but not for isometric ARPGs.

### Cited Findings
**UE 5.8 tonemapping change**
- Epic staff (Yutaro_Sawada, 30 Jul 2026), translated: "From UE5.8, tone mapping can be selected between Filmic and Standard ACES in PostProcessVolume Film → Method". Staff also confirmed "(r.HDR.Aces.Version has been changed to default value 2)" and said setting it to 1 restores pre-5.8 behaviour. One Method setting applies to both SDR and HDR — [Unreal Engine forum](https://forums.unrealengine.com/t/tonemappingmethod/2747218)
- I read the UE 5.8 release notes in four parts and found no tonemapper/ACES entry. The fetch tool may have missed it — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)

**AgX**
- Godot 4.4 added AgX. It closely resembles Blender's version ("Our friends at Blender even replaced their previous 'filmic' tone mapper with AgX") but is "purposely simplified to be more suitable for real time use cases" — [Godot 4.4 release page](https://godotengine.org/releases/4.4/)
- Godot 4.4 was released in early March 2025. A search summary of the official release page gives 3 March 2025 (the fetched page itself showed no date), and CG Channel's feature article is dated 4 March 2025 — [Godot 4.4 release page](https://godotengine.org/releases/4.4/); [CG Channel](https://www.cgchannel.com/2025/03/5-key-features-for-cg-artists-in-godot-4-4) (search snippets)
- Godot docs describe AgX as "Better than other tonemappers at maintaining the hue of colors as they become brighter". Parameters: White, and AgX Contrast ("Increasing this makes dark values darker, and bright values brighter"). White is ignored on the Mobile renderer with HDR 2D off — [Godot docs](https://docs.godotengine.org/en/stable/tutorials/3d/environment_and_post_processing.html)
- three.js (r187dev) exports `AgXToneMapping = 6` and `NeutralToneMapping = 7` alongside `ACESFilmicToneMapping` — [three.js constants.js](https://github.com/mrdoob/three.js/blob/dev/src/constants.js)
- No PoE2 patch note mentioning AgX was found (search summary over official forum and Steam patch threads)

**HGIG / HDR calibration**
- HGiG (HDR Gaming Interest Group) members per a 2018 report: Activision, Capcom, EA, Epic, Microsoft, Sony Interactive, Square Enix, Ubisoft, Unity, WB Games, Vicarious Visions, plus TV/PC makers (LG, Samsung, Panasonic, Philips, VIZIO, Toshiba, Sony Visual Products, HP, ASUS) — [DisplayDaily, 2018-08-21](https://displaydaily.com/hdr-gaming-interest-group-to-propose-production-and-distribution-guidelines/)
- Principles quoted: "Each display's HDR capability should be utilized to the full extent", and "complicated manual setup operations (e.g. in-game calibration) should be avoided" — [DisplayDaily](https://displaydaily.com/hdr-gaming-interest-group-to-propose-production-and-distribution-guidelines/)
- The foundational document, "For a Better HDR Gaming Experience — Best Practice Recommendations for Game HDR Creation", was v1.0 (15 Aug 2018) and v1.1 (11 Jul 2019). hgig.org now survives only as an archive — [cinemaconfig](https://cinemaconfig.com/reference/hgig) (search snippet)
- HGiG TV mode: the TV disables its dynamic tone mapping and tracks PQ up to panel peak, then clips. The console's system calibration captures max/max-full-frame/min tone-map luminance, which games are supposed to read — [Mobile Pixels](https://www.mobilepixels.us/pages/what-is-hgig) (retailer blog, secondary). An analysis notes many games ship their own HDR sliders that ignore console calibration — [Patreon analysis](https://www.patreon.com/posts/78943775) (search snippet, secondary)

**Tilt-shift / DoF**
- HD-2D "makes extensive use of modern rendering effects, including dynamic lighting, depth of field, and tilt-shift" for a diorama look. Octopath Traveler (2018, UE4), Dragon Quest III HD-2D Remake (2024) and others use it — [Wikipedia HD-2D](https://en.wikipedia.org/wiki/HD-2D) (citing RPGamer, Forbes, RPG Site and TheSixthAxis reviews)
- three.js ships `HorizontalTiltShiftShader` / `VerticalTiltShiftShader`, `BokehShader`/`BokehPass`, `DOFMipMapShader` and TSL `DepthOfFieldNode` — [three.js shaders](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/shaders); [three.js tsl/display](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/tsl/display)
- XAG 117 calls for options to disable motion blur and similar screen effects — [Microsoft Learn XAG 117](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/117)

### Inferences
- **Tilt-shift in an isometric ARPG:** a screen-space vertical-gradient blur (two separable passes, no depth needed) is the cheapest option and reads as "miniature". It blurs the top and bottom of the screen, where enemies approach, so for gameplay keep it subtle or reserve it for town, menus and cinematics. HD-2D can afford it because it is turn-based.
- **AgX vs ACES in three.js:** AgX preserves hue on bright VFX (fire, holy light), where ACES skews saturated oranges and blues. That suits additive spell effects. The lab's current tonemapper choice should be A/B tested on the Weeping Fields palette.
- **UE 5.8 default to ACES 2.0:** this signals that AAA engines treat ACES 1.x's hue skews as legacy. In three.js the realistic options are AgX, Neutral, or a custom ACES 2.0 approximation via `CustomToneMapping`. The last is unverified effort.
- **HDR:** if the lab ever outputs HDR, HGIG implies reading the display's peak (on the web, only via limited media queries) rather than adding a complex calibration screen. One peak-brightness slider plus paper-white is the minimal compromise. (Web HDR canvas status is the three.js researcher's area.)

### Gaps
- The official HGIG PDF was not readable (hgig.org is archived only and web.archive.org is blocked for the fetcher), so the exact paper-white and peak recommendations are unverified.
- No isometric ARPG (D4, PoE2, Last Epoch, Titan Quest II) was confirmed using tilt-shift or gameplay DoF.
- No shipped game was confirmed using AgX.
- The ACES 2.0 change is not stated in UE 5.8 release-notes text (it may be in a section the fetch missed).

## 4. Materials: RE Engine / Decima / Frostbite talks, water caustics, eyes, UE Material Instances and MPCs, terrain height blending

### Takeaway
- **RE ENGINE:** its public RE:2023 talk is about bindless, RT material porting, VRS and a visibility-buffer plan rather than a BRDF model. Its most portable shading idea is "invisible-normal" correction (introduced in RE4).
- **Decima and Frostbite:** no 2022–2025 material-model talks were found.
- **Engine conventions:** UE's documented split is cheap uniform-only Material Instances, permutation-creating static switches, and global Material Parameter Collections (1024 scalars + 1024 vectors, max 2 per material). This is a clean model for a three.js uber-material.
- **Caustics:** games either use the cheap projected animated texture (Stam 1996) or GPU Gems' refraction-mapped caustic texture. three.js has a WebGPU example doing the projected version through the shadow pass.

### Cited Findings
**RE ENGINE (Capcom)**
- RE:2023 "Is Rendering Still Evolving?" (CAPCOM R&D) — [Docswell slides](https://docswell.com/s/CAPCOM_RandD/524Y6M-RE2023):
  - Uses inline ray tracing (RayQuery). Shipped titles use a single material function for RT, with materials ported from the raster shader graph via JSON rebinding.
  - Bindless uses the SM 6.6 ResourceDescriptorHeap, with parameters in a ~32 MiB StructuredBuffer and a 32-bit BindlessMaterialHandle root constant.
  - On an Xbox One dev build, CPU time fell from 10.3 to 8.2 ms with bindless (G-buffer command-list creation from 3.3 to 2.1 ms).
  - Bindless raised VGPRs (68 → 124 for a 12-texture shader; 72 with scalarization).
- Same talk, future direction — [Docswell](https://docswell.com/s/CAPCOM_RandD/524Y6M-RE2023):
  - A visibility buffer with mesh shaders removes double vertex processing and can merge draws sharing a shader. Deferred texturing is a future goal.
  - Meshlets are 128 triangles (vs 768-triangle culling granularity on conventional GPUs), with "40% or more" compression possible.
- "Invisible normals" correction: geometry normals correct shading normals that face away due to normal maps. It is toggled per shader and was introduced in Resident Evil 4. The talk does **not** describe the BRDF, skin, hair or eye models — [Docswell](https://docswell.com/s/CAPCOM_RandD/524Y6M-RE2023)
- GDC 2026 "Implementing Real-Time Path Tracing in RE ENGINE for 'Resident Evil Requiem' and 'PRAGMATA'" (Hitoshi Mishima) exists — [Docswell](https://docswell.com/s/CAPCOM_RandD/5DM2NL-gdc2026-implementing-real-time-path-tracing-in-re-engine) (not opened). A Q&A reports shared ray-query and material-shader infrastructure across RT paths — [GameDev.net](https://gamedev.net/news/4523-qa-how-capcom-brought-path-tracing-to-re-engine-across-pragmata-and-resident/) (search snippet)

**Decima (Guerrilla)**
- Guerrilla's publications page lists only Decima visual-programming and HTN/AI talks for 2024–2026. No rendering or material talk appears on the first page, and older pages were not checked — [Guerrilla /read](https://www.guerrilla-games.com/read)

**Water caustics**
- GPU Gems ch. 2, "Rendering Water Caustics" (Guardado & Sánchez-Crespo, NVIDIA, 2004) — [NVIDIA GPU Gems](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics):
  - For each caustic-mesh point, cast a vertical ray to the wave surface, refract it (IOR ≈ 1.33), intersect the floor and look up a "Sun" light map. The result is added to the floor texture in an additive pass.
  - Shortcuts: an overhead sun, environment-map lookup instead of an exact Snell intersection, and per-vertex floor depth.
  - Claimed "very low computational cost". Rendering into a fixed-resolution texture gives a constant per-frame cost and allows mipmapping.
- The cheap alternative is Stam's (1996) precomputed animated caustic texture, projected onto the scene and blended additively. It is not tied to the live wave geometry — [NVIDIA GPU Gems](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics); see also [Unity caustics tutorial](https://dualheights.se/caustics/caustics-water-texturing-using-unity3d.shtml) (search snippet)
- Yuksel & Keyser note that games often neglect caustics or replace them with "fixed animated textures that do not reflect the shape of the water surface" — [Yuksel & Keyser PDF](https://faculty.digipen.edu/~gherron/references/References/LightEffects/Caustics/CausticsCGI09.pdf) (search snippet)
- The three.js `webgpu_caustics` example projects a tiling caustic texture through the shadow pass — [three.js webgpu_caustics.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_caustics.html):
  - The material's `castShadowNode` uses `refract()` of the view direction.
  - The spot light uses a HalfFloat shadow map "For HDR Caustics".
- `webgpu_volume_caustics` and water objects (`Water`, `Water2`, `WaterMesh`) also exist — [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples); [three.js objects](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/objects)
- Diablo IV water (GDC 2024 "H2O in H3LL"): shorelines, accumulating puddles, snow-topped rocks, Helltide rivers, icy caves; avoiding distracting highlights from the fixed camera — [GDC schedule](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730) (search snippet)

**Eye shading**
- UE's Eye shading model simulates the eye surface with "artistic controls for the iris shape and distance" (inputs: Iris Mask, Iris Distance). It is "highly technical", and Epic advises reusing the Digital Humans eye material — [UE shading models](https://dev.epicgames.com/documentation/en-us/unreal-engine/shading-models-in-unreal-engine)
- Jorge Jimenez's "Next-Generation Character Rendering" (GDC 2013) slides are a 323.6 MB PPTX; the page itself has no eye details — [iryoku.com](https://www.iryoku.com/stare-into-the-future)

**UE Material Instances and Material Parameter Collections (model for uber-material parameterization)**
- Material Instance Constant is "Only calculated prior to runtime". Material Instance Dynamic "Can be calculated (and edited) at runtime". Non-static parameters (scalar, vector, texture) change without recompilation — [UE docs: Instanced Materials](https://dev.epicgames.com/documentation/en-us/unreal-engine/instanced-materials-in-unreal-engine)
- Static switches: "Static parameters are applied at compile-time". "A new Material is compiled for every combination of static parameters in the base Material that are used by instances", which "can lead to an excessive number of shaders" — [UE docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/instanced-materials-in-unreal-engine)
- Material Parameter Collections — [UE docs: MPC](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-material-parameter-collections-in-unreal-engine):
  - "A collection can have up to 1024 scalar parameters and 1024 vector parameters". A material can reference at most two collections.
  - Adding or removing parameters recompiles every referencing material.
  - Typical uses: wind, wetness/snow, time-of-day colour, and player position for foliage.

**Terrain splat height blending**
- "Advanced Terrain Texture Splatting" (Andrey Mishkinis, 16 Jul 2013) — [Game Developer](https://www.gamedeveloper.com/programming/advanced-terrain-texture-splatting). Height in alpha plus layer opacity, then:
  - `ma = max(h1+a1, h2+a2) - depth`
  - `b_i = max(h_i + a_i - ma, 0)`
  - `color = Σ(rgb_i * b_i) / Σ b_i`, with depth = 0.2 in the example.
  - Stones stay clean on top while sand fills the cracks.

### Inferences
- **Uber-material mapping for the lab:**
  - UE "static switch" = a three.js `#define` or TSL branch that creates a new program, so keep these few and fixed per material family.
  - "Instance parameters" = uniforms on shared materials.
  - "MPC" = one global uniform block/UBO (wind, wetness, time of day, player position, Helltide-like tint) shared by every terrain, foliage and prop material.

  This keeps program counts low, which matters because WebGL2/WebGPU pipeline compilation stalls are the main web-specific cost.
- **Invisible-normal correction** (clamping shading normals against the geometric normal) is a tiny shader fix that removes black specular sparkles on normal-mapped low-poly props seen from a high isometric angle. It is cheap to adopt in a custom TSL/GLSL chunk.
- **Caustics:** the projected animated caustic texture is enough at isometric distance, using either three.js's shadow-pass method or a light-space projected texture gated by a water-depth mask. The GPU Gems refraction method is only worth it for close shallow water.
- **Terrain:** Mishkinis' height blend is the standard, cheap (ALU-only) basis for D2-style dirt, grass and stone transitions, and is compatible with the lab's ground-blend work.

### Gaps
- No RE ENGINE, Decima or Frostbite opaque material-model (BRDF) talk from 2022–2025 was found. The RE:2023 talk skips BRDF and skin, hair and eye models. Guerrilla's older pages and EA SEED/Frostbite publications were not checked.
- Eye-rendering internals (iris refraction/parallax, limbal ring, wet layer) remain unsourced. The Jimenez slides are too large to fetch, and UE's page is a summary.
- The UE Landscape layer-blend docs (LB Height Blend) were not re-fetched. Mishkinis is the only height-blend reference.
- The D4 water talk's actual shader details (only the schedule listing was seen) and any 2024–26 game-specific caustics talk were not found.

## 5. Lighting and shadows: KCD2 SVOGI, Lumen/MegaLights console costs, canonical links (LTC, PCSS, EVSM, SVGF, HBAO+, capsule shadows, planar reflections)

### Takeaway
- **KCD2 SVOGI:** confirmed through Warhorse statements reported by the press. The game uses CryEngine's software voxel GI, not hardware RT.
- **Console costs, now concrete:**
  - Lumen's budgets are **8 ms (30 fps) and 4 ms (60 fps) at 1080p on consoles**, with each lower tier costing about half. Medium targets Switch 2.
  - UE 5.8's Lumen Lite is "twice as fast as Lumen high quality".
  - MegaLights costs **5.51 ms on PS5 at 1080p for 941 shadowed area lights**.
- **Canonical references:** all now have verified URLs. Several give useful numbers, e.g., UE capsule shadows at 0.29 ms per character on a Radeon 7870, and planar reflections at "entire scene rendered twice".

### Cited Findings
**Kingdom Come: Deliverance II (2025)**
- Martin Klima (Executive Producer, Warhorse): "We are not using hardware ray tracing; CryENGINE has very good software ray tracing." PR manager Tobias Stolz-Zwilling said (reported) that it is an improved SVOGI, available on consoles — [Wccftech, 2024-09-12](https://wccftech.com/kingdom-come-deliverance-2-dev-60fps-on-consoles-is-not-out-of-reach-game-will-support-voxel-based-gi/amp/)
- "By default, Kingdom Come: Deliverance 2 uses CRYENGINE's SVOGI". A community mod targets too-dark areas and light leakage, and advises disabling AsyncCompute if lighting flickers — [DSOGaming, 2025-03-01](https://www.dsogaming.com/mods/kingdom-come-deliverance-2-mod-enhances-global-illumination)
- The old CRYENGINE SVOGI manual page now redirects to cryengine.com/docs. No ms cost for SVOGI in KCD2 was found — [CRYENGINE docs redirect](https://www.cryengine.com/docs/)

**Lumen (UE5)**
- "Lumen targets 30 and 60 frames per second (fps) on consoles with 8ms and 4ms frame budgets at 1080p" — [UE Lumen Performance Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)
- Tier targets — [UE Lumen Performance Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine):
  - Epic targets 30 fps.
  - "The High scalability level targets 60 fps on current-generation consoles, aside from Nintendo's Switch 2".
  - "The Medium global illumination scalability level targets Switch 2 and lower-end PCs".
  - "Each lower level costs approximately half of the level above it".
  - Software RT "is the fastest tracing method in Lumen". For hardware RT, keep "fewer than 100,000 instances" after culling.
- UE 5.8 Lumen Lite (Beta) — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes):
  - "a new medium-quality setting for Global Illumination using Irradiance Fields with Probe Occlusion".
  - "It's twice as fast as Lumen high quality - which targets 60fps on PlayStation 5".
  - "the new default for current-generation handheld consoles, where it can be used at 60fps".

**MegaLights (UE5)**
- UE 5.8: "Megalights is now entering Production Ready status… We greatly reduced noise… while also improving overall performance to achieve 60fps" — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)
- SIGGRAPH 2025 (Narkowicz & Costa), MegaLights demo — [Advances 2025 slides](https://advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf); talk list — [Advances 2025](https://advances.realtimerendering.com/s2025/index.html):
  - Setup: **PS5, 1080p render resolution, 1 spp, async compute off; 941 area lights on screen, about 20–80 lights per pixel, all casting shadows.**
  - **Total 5.51 ms**, replacing all direct-lighting shadowing and shading.
  - Per-pass costs, opaque / translucency + volumetric fog: sampling 1.35 / 0.48; screen-space tracing 0.7 / –; hardware RT 0.47 / 0.11; sample shading 0.55 / 0.52 (0.1 translucency + 0.42 fog); visible light list 0.05 / 0.1; denoising 0.96 / 0.22 ms. (The row mapping is reconstructed from PDF text extraction; the columns sum to 4.08 + 1.43 = 5.51 ms, matching the slide total.)
- Same deck, scaling: "On a console we can do maybe 1 ray per pixel". Light-grid building was optimized "from over 0.6ms to under 0.2ms". Ray reuse and penumbra scaling are offered for Steam Deck or high-end mobile, "much slower than current generation consoles" — [Advances 2025 slides](https://advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf)

**Canonical references (verified URLs)**
- **LTC area lights:** "Real-Time Polygonal-Light Shading with Linearly Transformed Cosines", Heitz, Dupuy, Hill & Neubelt, SIGGRAPH 2016. The page offers paper, slides, demo, WebGL demo and fitting code — [Heitz research page](https://eheitzresearch.wordpress.com/415-2/). three.js implements it via `RectAreaLightUniformsLib` / `RectAreaLightTexturesLib` (`webgl_lights_rectarealight`, `webgpu_lights_rectarealight`) — [three.js lights](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/lights)
- **PCSS:** "Percentage-Closer Soft Shadows", Randima Fernando, NVIDIA (2005) — [NVIDIA whitepaper PDF](https://developer.download.nvidia.com/shaderlibrary/docs/shadow_PCSS.pdf):
  - Steps: blocker search → penumbra estimate `wPenumbra = (dReceiver − dBlocker) · wLight / dBlocker` → variable-size PCF.
  - About 75 fps on a GeForce 7800 GTX at 640×480 with 36 blocker-search and 64 PCF samples.
  - three.js example: `webgl_shadowmap_pcss` — [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples)
- **EVSM / VSM family:** MJP, "A Sampling of Shadow Techniques" (2013-09-11) — [MJP blog](https://therealmjp.github.io/posts/shadow-maps/):
  - Fixed PCF from 2×2 to 7×7 adds only about 0.4 ms at 1080p on an AMD 7950.
  - EVSM4 with 1024² cascades and 4×MSAA is about 3 ms slower than PCF. With 2048² cascades, 4×MSAA, mips and 8×AF it adds about 11.5 ms.
  - Pros: hardware filtering, mipmaps and MSAA work, and maps can be pre-blurred.
  - Cons: 2–4 FP32 values per texel, light bleeding ("the biggest problem"), and bleeding reduction over-darkens.
- **SVGF:** "Spatiotemporal Variance-Guided Filtering: Real-Time Reconstruction for Path-Traced Global Illumination", Schied et al., Proceedings of High Performance Graphics 2017 (28 Jul 2017). About 10 ms (±15%) at 1920×1080 on "modern graphics hardware" — [NVIDIA Research](https://research.nvidia.com/publication/2017-07_spatiotemporal-variance-guided-filtering-real-time-reconstruction-path-traced)
- **HBAO+:** NVIDIA says it renders at full resolution, "doubles the detail level of AO and runs three times faster" than HBAO, and uses "cache-efficient interweaved rendering". Distributed via ShadowLib/GameWorks; no ms figures on the page — [NVIDIA HBAO+](https://developer.nvidia.com/rendering-technologies/horizon-based-ambient-occlusion-plus). three.js has GTAO instead (`GTAOPass`, TSL `GTAONode`) — [three.js tsl/display](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/tsl/display)
- **Capsule shadows (UE)** — [UE docs: Capsule Shadows](https://dev.epicgames.com/documentation/en-us/unreal-engine/capsule-shadows-overview-in-unreal-engine):
  - Capsules come from the character's Physics Asset, attached to bones (Sphyls/Spheres only).
  - Indirect shadows use precomputed lighting samples; direct shadows use the light's source angle or radius.
  - Computed at half resolution with depth-aware upsampling, only in screen tiles that need it.
  - **Cost on a Radeon 7870 at 1080p with 10 capsules: 0.29 ms for one character, +0.05 ms per additional character.**
  - Not compatible with Virtual Shadow Maps.

  Genshin uses capsule AO for characters on PS4 — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi)
- **Planar reflections (UE)** — [UE docs: Planar Reflections](https://dev.epicgames.com/documentation/en-us/unreal-engine/planar-reflections-in-unreal-engine):
  - "Planar Reflections cause your entire scene to be rendered twice".
  - Triangle- and draw-call-heavy scenes suffer most because those costs don't scale with Screen Percentage.
  - About 23 ms extra in the Kite demo and about 1.67 ms in the mobile Elven Ruins map.
  - Settings: Screen Percentage, distance-from-plane fade, normal distortion, extra FOV.

  three.js equivalent: `Reflector` (`webgl_mirror`, `webgpu_mirror`) — [three.js objects](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/objects)

### Inferences
- **Fallbacks for a three.js ARPG (no hardware RT):**
  - MegaLights' 5.5 ms on PS5 for 941 lights shows what stochastic RT lighting costs on fixed hardware. The browser equivalent is clustered/tiled forward lights with a strict shadow-casting light budget (Genshin: about 100 shadowed lights with distance and priority-based resolution, plus baked static shadows).
  - SVOGI/Lumen-class GI → baked or slowly updated irradiance probes. Lumen Lite's "irradiance fields with probe occlusion" is essentially a DDGI-style probe grid, which is the realistic WebGPU target.
- **Budget anchors:** Lumen High's 4 ms on PS5 is a sensible upper bound for "all GI" in a 60 fps budget. Each step down roughly halves the cost on the same hardware, and Epic targets Medium at Switch 2 (whose absolute ms will be higher than PS5's). This gives a template for the lab's GI quality tiers.
- **Capsule shadows/AO** (0.29 ms per character on a 2012-era GPU) are ideal for an isometric ARPG: soft contact shadows under monsters without shadow-mapping skinned meshes. They need a capsule list per skeleton passed as uniforms or a storage buffer.
- **Planar reflections** double scene cost (draw calls do not scale with resolution). For water and wet floors at isometric angles, use SSR or cube/probe reflections and reserve `Reflector` for small hero areas.
- **PCSS:** three.js's example works, but the cost grows with blocker plus PCF samples (36 + 64 in 2005). Combine it with Genshin's 1/4-resolution penumbra mask, or use fixed PCF, which costs only about 0.4 ms going from 2×2 to 7×7 on an AMD 7950 per MJP.

### Gaps
- No ms cost for KCD2's SVOGI on PS5 or Xbox, and no CRYENGINE SVOGI documentation page was fetched (it now redirects).
- No independent console ms figures for Lumen beyond Epic's 8/4 ms budgets. No MegaLights figures from shipped games, only the demo.
- Original HBAO (Bavoil et al., SIGGRAPH 2008), VSM (Donnelly & Lauritzen, I3D 2006) and Layered/Exponential VSM (Lauritzen & McCool, GI 2008) primary URLs were not fetched: punkuser.net does not resolve, and ACM DL was not tried. MJP's post is used as the EVSM reference.
- The AC Shadows SIGGRAPH 2025 deck (Advances 2025 talk 3) was not downloaded this round; it is available as a 14 MB PDF at the Advances page.

## 6. Optimization: DX12 Work Graphs in shipped games, per-pass budgets for 60 fps console games, Switch 2, Frostbite/Activision GPU-driven and visibility-buffer talks

### Takeaway
- **Work Graphs:** no shipped game was found using them as of October 2026. The DirectX blog's 2026 posts don't mention any.
- **Per-pass budgets:** no fully itemised 60 fps console breakdown was found. Primary component costs now exist instead: Genshin PS4 passes, Frostbite compute culling on PS4/XB1, MegaLights on PS5, Lumen budgets, and RE ENGINE CPU numbers.
- **Switch 2:** guidance is limited to Epic's tier targets (Lumen Medium; Lumen Lite as the handheld default).
- **GPU-driven talks:** Frostbite's GDC 2016 compute-culling talk and Activision's REAC 2021 hybrid Forward+/visibility-buffer talk are now located; Frostbite's numbers were extracted.

### Cited Findings
**Work Graphs**
- The DirectX developer blog's 2026 posts (Shader Model 6.10 preview, Agility SDK 720/721, Advanced Shader Delivery, Auto SR, DxTimingCaptureLibrary, up to 1 Oct 2026) contain no mention of Work Graphs shipping in a game — [DirectX Developer Blog](https://devblogs.microsoft.com/directx/)
- A 2025 rumour (leaker KeplerL2) says the next PlayStation/Xbox won't use D3D12 Work Graphs in their first years — [GamingBolt](https://gamingbolt.com/ps6-next-xbox-wont-use-d3d12-work-graphs-feature-in-the-first-few-years-rumour) (rumour)

**Frostbite GPU-driven culling (Graham Wihlidal, GDC 2016, "Optimizing the Graphics Pipeline with Compute")** — [SlideShare deck](https://www.slideshare.net/gwihlidal/optimizing-the-graphics-pipeline-with-compute-gdc-2016)
- Cluster culling: bounding cones, frustum and Hi-Z tests. 64-triangle clusters are "convenient on consoles", but 256 is "the sweet spot" (too many draws bottleneck the command processor).
- Per-triangle compute filters: orientation/zero-area, small primitive (no pixel centre covered), frustum, depth (Hi-Z). Surviving indices are compacted with ballot/mbcnt.
- Test scene: 443,429 triangles at 1080p, 171 unique PSOs. 78% culled (orientation alone 46%), 22% rendered.
- Timings, base → with compute culling (two variants, likely sync/async; column mapping uncertain in the scrape):

  | Platform | Without tessellation (ms) | With tessellation (ms) |
  |---|---|---|
  | Xbox One | 5.47 → 4.56 / 4.78 | 19.3 → 11.2 / 11.3 |
  | PS4 | 4.56 → 3.80 / 3.89 | 12.8 → 8.10 / 8.21 |
  | PC (Fury X) | 0.79 → 0.47 / 0.53 | 3.01 → 0.64 / 0.70 |

- Culling runs on async compute alongside other GPU work, which "can slow down 'Other GPU Stuff' a bit, but overall frame is faster!"

**Activision / Call of Duty**
- Talk list — [Activision Research publications](https://research.activision.com/publications):
  - "Geometry Rendering Pipeline Architecture" (Michal Drobot, 2021)
  - "Improved Culling for Tiled and Clustered Rendering in Call of Duty: Infinite Warfare" (2017)
  - "Software-based Variable Rate Shading in Call of Duty: Modern Warfare" (2020)
  - "Task Graph Renderer at Activision" (REAC 2023)
  - "Lima Oscar Delta! Scaling Content in Call of Duty: Modern Warfare" (2020, content scaling to hold 60 fps)
- Drobot's talk abstract: geometry preprocessing and merging of height-field terrain, dense meshes, procedural placement and overdraw-heavy foliage into intermediate formats. "Main lit rendering mixes Forward+ with Visibility Buffer style rendering approaches", designed around software variable-rate shading. Slides are a PPTX (not downloadable this session; timed out) — [Activision Research](https://research.activision.com/publications/2021/09/geometry-rendering-pipeline-architecture)
- Activision's SIGGRAPH 2025 talk was on adaptive voxel-based OIT (AVBOIT), not GPU-driven geometry — [Advances 2025](https://advances.realtimerendering.com/s2025/index.html)

**RE ENGINE (CPU-side optimization)**
- Bindless cut Xbox One CPU frame time from 10.3 to 8.2 ms. Mesh shaders plus a visibility buffer is the stated direction — [Docswell RE:2023](https://docswell.com/s/CAPCOM_RandD/524Y6M-RE2023)
- Capcom says RE ENGINE will evolve into "REX" — [Capcom Integrated Report 2025](https://www.capcom.co.jp/ir/english/data/pdf/annual/2025/annual_2025_dev_04.pdf) (search snippet); [Wccftech](https://wccftech.com/re-engine-will-evolve-into-rex-engine-says-capcom-mesh-shader-support-will-be-added/amp/) (search snippet)

**Component budgets usable as per-pass anchors (primary sources)**
- Genshin (PS4/PS4 Pro): screen-space soft shadows 2–2.6 → 1.3–1.7 ms; froxel fog <1 ms; SSR about 1.5 ms (PS4 Pro); colour-grading LUT <0.05 ms — [Docswell](https://docswell.com/s/UnityJapan/KWRPQ5-210617-unity-dojo20211mihoyozhenzhongyi)
- Lumen GI plus reflections at 60 fps: 4 ms at 1080p on consoles — [UE Lumen Performance Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)
- MegaLights direct lighting: 5.51 ms (PS5, 1080p, 941 lights) — [Advances 2025 slides](https://advances.realtimerendering.com/s2025/content/MegaLights_Stochastic_Direct_Lighting_2025.pdf)
- Guilty Gear Xrd at 60 fps: about 800k triangles per scene, ≤160 MB textures, about 70 vertex + 80 pixel shaders per scene — [4Gamer](https://www.4gamer.net/games/216/G021678/20140703095/)

**Switch 2**
- Lumen High targets 60 fps on current consoles "aside from Nintendo's Switch 2". Medium "targets Switch 2 and lower-end PCs" — [UE Lumen Performance Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)
- UE 5.8: Lumen Lite is "the new default for current-generation handheld consoles, where it can be used at 60fps". The Switch 2 default SDK is 21.4.2 — [UE 5.8 release notes](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-5-8-release-notes)
- A German outlet found Street Fighter 6's Switch 2 DLSS convincing with half the resolution per axis rendered natively — [PCGH](https://www.pcgameshardware.de/Nintendo-Switch-2-Konsolen-280469/News/beeindruckendes-DLSS-Upscaling-Verdopplung-ohne-Probleme-1471386/) (search snippet)

### Inferences
- **For three.js (no mesh shaders, no Work Graphs):**
  - Frostbite's 2016 lesson still applies: GPU culling pays off mainly by removing back-facing and sub-pixel triangles (46% from orientation alone), and clusters of about 256 triangles balance culling granularity against draw count.
  - On WebGPU, compute-shader triangle/cluster culling plus indirect draws is the closest equivalent. On WebGL2, CPU-side cluster or instance culling is the fallback.
  - For an isometric ARPG with modest triangle counts, draw-call and overdraw reduction (particles, alpha-tested foliage) likely matters more than triangle culling.
- **Activision's hybrid approach** (Forward+ for most surfaces, visibility-buffer style for dense geometry) is a reasonable mental model for a WebGPU renderer: forward+ clustered lights for opaque surfaces, without a full visibility buffer.
- **Lab budget template at 60 fps (16.6 ms)**, assembled from the anchors above (an inference, not a published breakdown):
  - GI ≤ 2–4 ms (Lumen Medium/High equivalents).
  - Direct lights and shadows about 3–5 ms.
  - Soft-shadow filtering about 1.5 ms with a penumbra mask.
  - Fog ≤ 1 ms.
  - SSR about 1.5 ms (optional).
  - Grading/tonemap ≤ 0.1 ms.
  - The remainder for the G-buffer/base pass, particles and UI.

  Treat Switch 2-class or integrated GPUs as the "Medium = half cost" tier.

### Gaps
- No fully itemised per-pass ms breakdown for any 2024–26 60 fps console game was found. Web results were illustrative or generic only. The DOOM 2016 SIGGRAPH deck was downloaded, but its slides are images with no extractable timing text — [Advances 2016 PDF](https://advances.realtimerendering.com/s2016/Siggraph2016_idTech6.pdf). Capcom's CEDEC 2025 Monster Hunter Wilds performance-tuning talk, a likely source, was cancelled — [GameBusiness.jp](https://www.gamebusiness.jp/article/2025/07/09/24600.html) (search snippet)
- No GDC/CEDEC 2025–26 Switch 2 rendering talk with budgets was found. Nintendo's DLSS stance appears only in secondary coverage.
- Work Graphs: no primary statement (Microsoft, AMD, NVIDIA or a studio) confirms a shipped title as of Oct 2026. The AMD GPUOpen Work Graphs pages were not checked.
- Activision's REAC 2021 slides (PPTX) timed out, so their scene-type performance comparisons are missing.
- **Fetch failures this round:** Icy Veins (403), schedule.gdconf.com (403), GamePro (403), unrealengine.com interviews (403), inara.cz (503), web.archive.org (blocked), punkuser.net (DNS), Medium mirrors (404/certificate errors).

# Sanctuary Lookdev Lab

A three.js r180 test bed for **shaders, lighting, VFX, model lookdev and environment scenes**, built for a
game that runs on three.js. Every scene, effect and post stage exists for both renderers, so you can
compare **WebGL2 + GLSL** and **WebGPU + TSL** on the same frame — look and cost.

> Vietnamese guide: [docs/HUONG_DAN.md](docs/HUONG_DAN.md)

## Run it

| What | How |
| --- | --- |
| Offline, no install | Open `Sanctuary_Lookdev_Lab.html` (one ~20 MB file: code, samples, decoders inlined). Chrome or Edge for WebGPU. |
| Development | `npm install` then `npm run dev` → <http://127.0.0.1:4174>. JS/CSS rebuild + live reload, **GLSL hot swap without reload**. |
| Production build | `npm run build` → `dist/index.html` and `../Sanctuary_Lookdev_Lab.html`; `npm start` serves `dist` on :4175. |
| Share from this PC | `share-lab.bat` (Windows) or `npm run share`: Cloudflare quick tunnel → `https://….trycloudflare.com` link (needs `cloudflared`: `winget install --id Cloudflare.cloudflared`). `share-lan.bat` / `node scripts/serve.mjs --lan` for the local network. The server answers only `/` with the single page (gzip, ETag). |
| Static checks | `npm run check` — bundle, GLSL/TSL parity of every effect, reserved GLSL words, reversed `smoothstep` edges, TSL `If` pitfalls, additive materials on `colorNode`, asset credits. |

URL parameter `?renderer=webgl | webgpu | webgpu-gl` picks the renderer (also in the top bar; switching reloads
the page and keeps camera, settings and the A/B snapshot).

## Renderer modes

| Mode | Renderer | Shaders | Notes |
| --- | --- | --- | --- |
| **WebGL2 · GLSL** | `WebGLRenderer` | GLSL (`ShaderMaterial`, `onBeforeCompile` patches) | Per-pass GPU timer queries in the HUD. |
| **WebGPU · TSL** | `WebGPURenderer` (WebGPU device) | TSL → WGSL | Compute particles, TRAA. Falls back to WebGL2 automatically if the browser has no WebGPU. |
| **WebGPU renderer · WebGL2 backend** | `WebGPURenderer({ forceWebGL })` | TSL → GLSL ES 3.0 | What players without WebGPU get from the same TSL code. |

## Tabs

- **Lookdev** — view modes (lit, albedo, normal, roughness, metalness, material AO\*, emissive, PBR validation,
  SSAO buffer, clay, UV checker, wireframe), exposure false colour, tone mapping, sample models and your own
  GLB/FBX/OBJ, turntable, animation clips, studio environment, **material inspector** (click a mesh), **A/B compare**
  (snapshot survives a renderer switch). \*material AO channel is WebGL2-only.
- **Character** — play the model like a game character in any scene: WASD / click-to-move / gamepad, Diablo ¾,
  isometric, third-person or orbit follow camera, ground + wall collision (triangles bucketed in a 1 m grid), see-through
  circle in walls between camera and character, animation states per weapon stance (auto-mapped clip names, overrides
  per model, synced walk/run blend, crossfaded overlays, impact frames that hit the training dummies), **equipment**
  (built-in hand-slot items, 14 KayKit props, your GLB; grip gizmo + JSON export), **foot-slide check** (natural stride
  speed measured from foot plants, footprints coloured by drift, speed sync), **scale reference** lineup, and the
  **texture editor** for the character or a held item.
- **Procedural** — the game's code-built characters (`src/procedural`: 3 heroes, 13 monsters, 6 NPCs; SDF-sculpted
  bodies baked in `baked_data.js`, keyframed clips evaluated per frame, verlet capes): build options (armour, variants,
  element, ally / champion / unique), clip player with pose scrub and locomotion speed, the character shader's effects
  (flash, tint, frozen, rim, highlight, ghost; lava cracks WebGL2-only — WebGPU uses a TSL port), cape wind.
- **Lighting** — **Act I moods** (below), studio rigs (softbox, three-point, sun, rim, candle, HDRI only) or the scene's
  lights, Kelvin colour, physical units, shadow filter/size/bias, height fog.
- **Post & camera** — camera modes (orbit, game ¾, isometric 2:1, play), AA (FXAA, SMAA, MSAA, TRAA on WebGPU),
  bloom, GTAO, grade (white balance, contrast, lift/gamma/gain, vignette, grain, chromatic aberration),
  tone mapping / exposure / fog / framing grade remembered per scene, a half-step dither in the final pass (no banding),
  **3D LUTs** (.cube or generated looks), retro low-res preview, VFX-layer resolution, **readability check views**
  (value / greyscale and deuteranopia, protanopia, tritanopia after Machado 2009 — baked over the LUT look, no extra pass).
- **Shaders** — the shader lab: 8 effects written twice (GLSL + TSL) with one parameter schema:
  vertex wind, flame, dissolve, status overlays (frozen / burning / poisoned / hit flash), fresnel rim, puddles
  (water/blood with rain ripples), town portal, waypoint runes. Apply to the model or to probe shapes, stack them,
  read **GLSL / GLSL glue / TSL / compiled WGSL or GLSL** side by side, edit the GLSL in the browser, and measure the
  cost with an off/on A/B benchmark (results kept per renderer).
- **VFX** — spells on a castbar (keys **1–9**, right click): Fire Bolt, Frost Nova, Poison Nova, Charged Bolt,
  hit sparks & blood, dissolve death, Town Portal, Waypoint, campfire. Training dummies react with the surface
  shaders (status overlays, hit flash, dissolve death + respawn). **Play mode**: click to walk the model, camera
  follows. Slow motion, overdraw heat view, and a **WebGPU compute particle field** (up to 1M particles).
  **Skill system on three.quarks** (`src/skills`, WebGL2 only — quarks builds GLSL `ShaderMaterial`s; *Castbar shows skills*
  in the VFX tab, keys `1`–`9` `0` `-` `=`): 12 Act I class skills in the element language of `art-direction/07` — Fireball,
  Frozen Orb, Chain Lightning, Meteor (telegraphed), Blizzard, Fire Wall, Bone Spear, Bone Spirit, Poison Nova, Blessed
  Hammer, Holy Freeze (aura toggle), Teleport. Cast flow: charge effect at the hand for the cast time → release → motion
  (projectile, homing, nova, chain, ticking area, follow) → impact → elemental death (ash, shatter, shock, poison, bone).
  Effects are named quarks systems in `src/skills/fx.js`, pooled (restarted, never rebuilt) and batched into one draw per
  material; cooldowns on the castbar; *Skill level* scales damage and effect size. The runtime talks to the world through
  a small host interface (caster, targets, ground, lights), so the same skills can drive the game's monsters. Effects
  exported from the [quarks editor](https://quarks.art) (`.json`, drop on the viewport) play at the cursor.
- **Environment** — *Studio · lookdev* (the Lookdev tab's neutral stage: HDRI cards, `.hdr` drop), *Act I · Dark Wood (Immortal
  ref)* and *Act I · Dark Wood (D2 mood)* (one forest — twisted trunks, mossy rocks, a cobble path across the frame — lit and
  coloured two ways: a cold blue-grey Diablo Immortal moonlight, or the Diablo II look with an isometric 2:1 play view on the hero,
  ACES and a light radius; `src/scenes/darkWood.js`, `darkWoodD2.js`) and *Act I · Bố trí biome (thuật toán)* (the 3D view of the biome
  layout engine `src/env/biomeLayout.js` running on a sample plan, with overlays that show why things stand where they stand, a
  report with the acceptance checks and per-group seeds / densities; `npm run test:layout`, `npm run preview:layout`);
  all three share the base class `TerrainScene` (`src/scenes/terrain.js`): a splat terrain (dry dirt → wet dirt → grass blended by
  layer height, standing water in the hollows, paintable splat with brush / undo / PNG export, grass tufts, 3D grass cards and shell
  grass follow the grass layer), the *Texture set* drop-down (painted swatches and tiles, the D2R moor and lush-grass sets, the Act I
  biome sets, Poly Haven scans, the Dark Wood sets, or *Procedural* forge recipes; `scripts/prepare-terrain-*.py`), anti-tiling, shadow
  fill, and kits (wooden fence, palisade (PBR), tent (PBR), shrubs, the camp, nature and tree kits) split from prop sheets by
  `scripts/prepare-prop-kit.py`, `prepare-camp-kits.py` and `prepare-nature-kits.py`;
  biome placement rules (`art-direction/12` §4.6–4.12): habitat-masked grass colonies, clear door/interaction approaches,
  shoulder torches at route decisions, and bone clusters at story anchors (`src/env/biomePlacement.js`; `npm run test:placement`);
  **ground blend** (Scene options → *Ground blend*): rocks, trees, posts, walls and
  remains meet the soil — and each other — instead of standing on it. The terrain's own material (albedo + roughness, world
  normal + height) is drawn top-down into two textures around the camera, like a runtime virtual texture, and redrawn only
  when the view leaves them or the terrain changes; one surface patch (`shaders/effects/ground_blend.glsl` + TSL twin) fades
  each asset's foot into the ground under it (albedo, roughness and shading normal, noise-broken edge, the band scaled by the
  face's slope and the asset's local relief so flat decals, pebbles and bones keep their look), lays the ground over rock
  tops, and fills the crevices where assets touch (per-vertex contact baked on the CPU, `src/env/contact.js`); per-class
  profiles (rock, tree, remains, built), a weight view and a temporary test pile (rocks leaning on rocks, a tree among them);
  **GPU instancing in cells** (`src/env/instancing.js`): repeated meshes — grass
  tufts, grass cards, shrubs, kit trees — are one `InstancedMesh` per geometry × material × cell of the xz grid, and the
  merged static props one mesh per material × cell (`StaticBatch.build(true, { cell })`), so the camera and every shadow
  camera (the moon, the hero light) cull what they do not see; a map-wide instanced set is never
  culled. Kit trees became instances (geometry scaled to metres once so the wind mask is unchanged; `userData.labSolid`
  keeps walk collision and the see-through circle per instance; the ground blend takes instanced meshes). Scene options →
  *GPU instancing · chia ô* switches off / 16 / 24 / 32 m (page reload). Measured on the (removed) village map, iso play view:
  544 → 365 draws (WebGL2), 489 → 302 (WebGPU), 4.4 M → 1.25 M triangles; main-thread CPU −0.6 ms on WebGPU, +0.3 ms on WebGL2
  (three's per-object culling work in every shadow pass); GPU time on an RTX 4070 unchanged (fragment-bound);
  **atmosphere — GPU particles** for any scene with a preset in `SCENE_ATMOSPHERE` (`src/env/atmosphere.js`,
  `shaders/vfx/atmosphere.*.glsl`, TSL twin in `backends/webgpu/vfx.js`; the table is empty for the current scenes): dust motes
  catching the light, ash with a few embers, leaves skimming on the wind, fireflies by
  the water, grave wisps, blood spores off corrupted ground, moths round the lamps, low fog. Each layer is one instanced
  draw whose instances are only seeds: place, drift, wander, tumble, blink and light are computed in the vertex shader from
  time, so the CPU sets a few uniforms a frame (~0.04 ms) whatever the count. Layers wrap in a box that follows the view, lie
  on a height map baked from `scene.height`, live in zones (circles), take the grass wind, are lit by the eight lights that
  matter most at the view (three's falloff) plus the sky ambient — dust shows in the hero's light radius and round the fires
  only — and fade near a perspective camera; per-scene presets, night-only layers, the mood's rain settles the dry ones.
  Scene options → *Bầu không khí · hạt GPU*: on/off, density, per-layer switch and amount;
  procedural texture forge (tileable PBR sets baked from GLSL recipes, hot-reloaded).
- **Performance** — renderer info, quality presets, render scale, live pass timings, **scene benchmark** and
  **feature cost** benchmark (comparison table across renderers), stress tests (model crowd, moving lights,
  particle emitters), video capture (WebM), turntable recording, presentation mode, settings presets (export/import).
  Benchmarks take the median of raw per-frame GPU timer results (the HUD shows a smoothed value); on WebGPU they
  include compute passes.

Drag and drop onto the viewport: models (`.glb .gltf .fbx .obj`), environments (`.hdr .exr`), Substance-style texture
sets (auto-wired by name: BaseColor, Normal (DirectX detected), Roughness, Metallic, ORM, AO, Emissive, Height, Opacity),
`.cube` LUTs and settings presets (`.json`).

Act I moods (Lighting tab → Mood, also in the Character tab): looks after Diablo III's first act —
**New Tristram · rainy night** (cold blue-teal moon, warm lanterns, rain, wet ground with puddle ripples, lightning),
**Weeping Hollow · fog** (overcast green-grey dusk, ground mist) and **Cathedral · crypt** (near-black stone, torch pools,
dust). A mood sets the scene's own lights (moon / sky / torches / environment) through `scene.applyMood()`, exposure and
fog per scene, and a grade (ACES, bloom, split-tone LUT, vignette); it adds a **hero light** that follows the character
(inverse-linear falloff, no shadows), a **fresnel rim** on the character and held items (GLSL patch / TSL node patch),
rain streaks and splashes (CPU particles), the puddle effect with rain wetness on the ground materials, lightning
flashes, dust motes and ground mist. It works in the studio (a mood rig replaces the studio rig) and in the Act I scenes
(Dark Wood, Bố trí biome); every value can be tweaked per mood, and **Off** restores the scenes and the previous grade.

Texture editor (Character tab, Lookdev → Selected material → Textures): per-slot previews with UV overlay, replace / add /
remove / reset / export PNG, colour adjustments (hue, saturation, brightness, contrast, gamma, tint), per-channel levels
and invert for packed data maps, normal green flip, adjustments limited to one mesh's UV area (atlas textures), UV
transform and filtering. Edits are baked on the CPU, so both renderers sample identical texels.

## Shortcuts

`H` hide UI · `F` frame · `V` next view · `X` false colour · `T` turntable · `P` screenshot · `C` A/B compare ·
`Esc` clear selection · `?` help · `1–9` cast (VFX lab active) · right click: cast the selected spell.
Character play: `WASD` move · `Space`/`J` attack · `E` attack 2 · `Q` cast · `B` block · `G` get hit · `K` death /
revive · `R` walk ↔ run · `Shift` walk · `Enter` play on/off (Character tab).

## Project layout

```
src/
  app/          App shell, subject model, benchmarks (bench.js, benchRunner.js), stress tests, capture
  character/    character preview: controller, animator, clip mapping, collision grid, equipment, foot check,
                scale reference, see-through cutaway
  backends/
    webgl/      WebGLRenderer pipeline, GPU timer, onBeforeCompile patch system, GLSL effects + VFX materials
    webgpu/     WebGPURenderer pipeline (PostProcessing/TSL), node-patch system, TSL effects, VFX + compute
      tsl/      TSL ports of the GLSL chunks (noise, common, post)
  core/         settings, renderer modes, assets, camera rig, grading, LUTs + readability checks, shader registry + overrides
  effects/      effect schemas (registry.js) and the shader-lab controller (lab.js)
  env/          texture forge, Act I kit (StaticBatch), flames, terrain splat; biomeLayout.js (layout engine) + biomeCatalog.js
                + biomePlacement.js; valdren.js (palettes, palette lock, Valdren / Redbound / Blightbeast kit builders),
                signals.js (telegraphs, interact rings, swatch discs),
                groundBlend.js + contact.js (ground capture, asset contacts), outdoor.js (road fields, ribbons, kit loading),
                instancing.js (instanced sets in cells), atmosphere.js (GPU particle layers in the air)
  lighting/     studio rigs, Act I mood presets (moods.js) and the mood controller (hero light, rim, weather)
  lookdev/      view modes, reference objects, texture editor
  panels/       one file per tab
  procedural/   code-built characters (rig, SDF sculpt + decimation, clips, baked geometry) and the lab catalog;
                core/util.js + core/shared.js are the small game modules they import
  scenes/       studio, Dark Wood (Immortal ref + D2 mood), biome layout, and the TerrainScene base class (terrain.js)
  shaders/      every .glsl file (chunks/, effects/, post/, forge/, vfx/) — hot-swapped by the dev server
  vfx/          particle system, pooled lights, dummies, spells, VFX lab controller
scripts/        dev server, build (single-file offline HTML), static checks, page server + Cloudflare share,
                prepare-kaykit.py (splits the KayKit pack into characters, shared animation libraries, props)
```

## Adding an effect (GLSL + TSL)

1. Describe it in `src/effects/registry.js` (label, kind `surface`/`vfx`, parameters, lab defaults).
2. GLSL: write `src/shaders/effects/<name>.glsl` and add a builder in `src/backends/webgl/effects.js` inside
   `// #region <name>` — a patch `{ id, order, needs, shadow, apply(shader) }` anchored on three.js chunks,
   or a `ShaderMaterial` for VFX.
3. TSL: add the twin in `src/backends/webgpu/effects.js` (same region name) — a node patch that folds into
   `positionNode / colorNode / roughnessNode / metalnessNode / emissiveNode / normalNode / maskNode`, or a node material.
4. `npm run check` verifies both exist; the Shaders tab picks it up automatically (controls, source view, benchmark).

## Things learned (three r180)

- **TSL `If` callbacks**: an expression body (`() => out.assign(x)`) returns a node, which TSL turns into a
  dropped `return`. Use block bodies.
- **TSL first use inside a branch**: built-in values (normal, view direction, a texture sample) first referenced
  inside an `If` are only assigned in that branch. Put shared values in `toVar()` before branching.
- **`normalNode` sub-build**: it is built in its own sub-build, so a `toVar()` shared with colour/roughness is
  evaluated twice (visible in the compiled WGSL of the puddle effect).
- **Node frame**: FRAME-type nodes (transmission backdrop, TRAA history, `time`) advance only in the renderer's own
  rAF tick; frames rendered outside it must call `nodeFrame.update()` (the WebGPU backend does).
- **Program cache keys**: overriding `customProgramCacheKey` on node materials must keep the node-graph hash, or
  changed node graphs reuse stale pipelines.
- **Alpha 0 is discarded**: transparent node materials that go through `colorNode` discard fragments with alpha ≤ 0.
  Purely additive output (premultiplied, alpha 0 — the compute "soul storm") must be written with `fragmentNode`.
- **3D textures on WebGPU**: three uploads a `Data3DTexture` slice by slice; at least one implementation (Dawn on
  SwiftShader) then fails to lazy-clear the volume and drops the whole frame. The TSL display transform samples the LUT
  from a 2D strip (blue slices side by side, blended by hand) and matches the GLSL `sampler3D` result.
- **Shadows**: three's shadow pass replaces materials (only `positionNode` carries over). Dissolve gets a masked
  shadow material (WebGPU) / shadow depth twins (WebGL) so dissolved parts stop casting shadows.
- **GTAO in WebGL** reads the scene pass depth (normals reconstructed) instead of an override-material G-buffer,
  so AO follows wind and dissolve, matching the WebGPU MRT path.
- **WebGPU MRT** is capped at 32 bytes per sample: debug channels are packed into three RGBA16F targets.
- **Skinned bounds**: centre and ground characters on their skinned body, not on the props they carry (a sword in
  front put the pivot outside the body and made turns swing the feet).
- **Shared clips**: one animation library per rig (bone names must match); `AnimationClip`s are shared between
  mixers safely.
- **Light count = recompiles**: adding or hiding a light changes every lit program. Mood lights (hero, lightning) stay
  in the scene and are switched by intensity; only material layers (rim, wet ground) recompile when toggled.
- **Hero light falloff**: a physical (decay 2) point light 3 m above a character lights the head ~5× brighter than the
  feet; game "player lights" read like inverse-linear falloff, so the mood's hero light uses `decay = 1`.
- **Scene-specific patches on shared materials**: GLSL patches a material in place and TSL keeps one node twin per
  source material, so a layer meant for one scene (wet ground) must be removed when leaving it — the Act I materials
  are shared by both scenes.
- **Render targets in WGSL are not flipped**: on a WebGPU device a render target is stored top row first and r180's
  `WGSLNodeBuilder.isFlipY()` is false, so a texture read at a computed uv (world xz → capture uv) sees the image upside
  down compared with WebGL2 (and with the WebGPU renderer's WebGL2 backend). The ground blend flips v for `backend.isWebGPU`.
- **onBeforeCompile patches and the program cache**: WebGLRenderer keeps every program a material has used; going back to
  an earlier program key (patch taken off, then put back) reuses that program without calling onBeforeCompile, with the
  uniforms of the last compile — the patch's own uniforms (textures!) are missing. Keep a scene's patch on and zero its
  strength instead (the ground blend does), or make the key new.
- `active` is a reserved word in GLSL ES 3.00 (so is `half`).
- **Instancing is only as good as its culling**: an `InstancedMesh` is culled by the bounds of all its instances, so a
  map-wide set is drawn in full by the camera and by every shadow camera — six times per point light. Split sets into
  cells. Past that, the cost moves to three's per-object work (frustum test, attribute version checks in every shadow pass):
  more cells meant +0.3 ms CPU on WebGLRenderer but −0.6 ms on WebGPURenderer (whose draws cost more). Static meshes
  should set `matrixAutoUpdate = false` — otherwise every cell's matrix is recomposed each frame.
- **`InstancedMesh.getColorAt` / `getMatrixAt` return nothing** (r180): read the target you passed in.
- **Rebuilding a scene in place breaks WebGPU**: the scenes share materials (Valdren) and the ground blend effect per app;
  a second build of the same scene renders black on WebGPU without an error (the scene-switch bug). Build-time options
  reload the page instead (`App.reloadScene`).

Third-party assets and their licenses: [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

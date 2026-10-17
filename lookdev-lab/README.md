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
- **Lighting** — studio rigs (softbox, three-point, sun, rim, candle, HDRI only) or the scene's lights, Kelvin colour,
  physical units, shadow filter/size/bias, height fog.
- **Post & camera** — camera modes (orbit, game ¾, isometric 2:1, play), AA (FXAA, SMAA, MSAA, TRAA on WebGPU),
  bloom, GTAO, grade (white balance, contrast, lift/gamma/gain, vignette, grain, chromatic aberration),
  **3D LUTs** (.cube or generated looks), retro low-res preview, VFX-layer resolution.
- **Shaders** — the shader lab: 8 effects written twice (GLSL + TSL) with one parameter schema:
  vertex wind, flame, dissolve, status overlays (frozen / burning / poisoned / hit flash), fresnel rim, puddles
  (water/blood with rain ripples), town portal, waypoint runes. Apply to the model or to probe shapes, stack them,
  read **GLSL / GLSL glue / TSL / compiled WGSL or GLSL** side by side, edit the GLSL in the browser, and measure the
  cost with an off/on A/B benchmark (results kept per renderer).
- **VFX** — spells on a castbar (keys **1–9**, right click): Fire Bolt, Frost Nova, Poison Nova, Charged Bolt,
  hit sparks & blood, dissolve death, Town Portal, Waypoint, campfire. Training dummies react with the surface
  shaders (status overlays, hit flash, dissolve death + respawn). **Play mode**: click to walk the model, camera
  follows. Slow motion, overdraw heat view, and a **WebGPU compute particle field** (up to 1M particles).
- **Environment** — studio, *Act I · Burial grounds* (time of day, wind, grass, torches), *Act I · Catacombs*;
  procedural texture forge (tileable PBR sets baked from GLSL recipes, hot-reloaded).
- **Performance** — renderer info, quality presets, render scale, live pass timings, **scene benchmark** and
  **feature cost** benchmark (comparison table across renderers), stress tests (model crowd, moving lights,
  particle emitters), video capture (WebM), turntable recording, presentation mode, settings presets (export/import).
  Benchmarks take the median of raw per-frame GPU timer results (the HUD shows a smoothed value); on WebGPU they
  include compute passes.

Drag and drop onto the viewport: models (`.glb .gltf .fbx .obj`), environments (`.hdr .exr`), Substance-style texture
sets (auto-wired by name: BaseColor, Normal (DirectX detected), Roughness, Metallic, ORM, AO, Emissive, Height, Opacity),
`.cube` LUTs and settings presets (`.json`).

## Shortcuts

`H` hide UI · `F` frame · `V` next view · `X` false colour · `T` turntable · `P` screenshot · `C` A/B compare ·
`Esc` clear selection · `?` help · `1–9` cast (VFX lab active) · right click: cast the selected spell.

## Project layout

```
src/
  app/          App shell, subject model, benchmarks (bench.js, benchRunner.js), stress tests, capture
  backends/
    webgl/      WebGLRenderer pipeline, GPU timer, onBeforeCompile patch system, GLSL effects + VFX materials
    webgpu/     WebGPURenderer pipeline (PostProcessing/TSL), node-patch system, TSL effects, VFX + compute
      tsl/      TSL ports of the GLSL chunks (noise, common, post)
  core/         settings, renderer modes, assets, camera rig, grading, LUTs, shader registry + overrides
  effects/      effect schemas (registry.js) and the shader-lab controller (lab.js)
  env/          texture forge, Act I kit (StaticBatch), flames
  lighting/     studio rigs
  lookdev/      view modes, reference objects
  panels/       one file per tab
  scenes/       studio, graveyard, catacombs
  shaders/      every .glsl file (chunks/, effects/, post/, forge/, vfx/) — hot-swapped by the dev server
  vfx/          particle system, pooled lights, dummies, spells, VFX lab controller
scripts/        dev server, build (single-file offline HTML), static checks
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
- `active` is a reserved word in GLSL ES 3.00.

Third-party assets and their licenses: [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

# How isometric/top-down ARPGs implement genre-specific rendering features: documented implementations (round 2) and three.js r180 recipes (WebGLRenderer + GLSL and WebGPURenderer + TSL)

Scope and conventions. These notes are current to 19 Oct 2026. They extend round 1 (`research/notes/Kĩ thuật đồ họa AAA cho threejs/arpg_case_studies.md`), which found no primary documentation for most of these features. Source tags:
- **[DOC]**: studio or official material, such as talks, patch notes, official docs and studio data guides.
- **[DATA]**: the Diablo II data-file guide. It appears to be Blizzard's own "Data Text File Guide" and is mirrored on d2runewizard.
- **[RE]**: reverse-engineered or ported code (DevilutionX, open-source Diablo I).
- **[FORUM]**: player or community posts.
- **[SNIPPET]**: seen only in a search-result summary. The page itself could not be fetched, so treat it with care.
- **[ENGINE-REF]**: engine docs or tutorials, used as implementation references where no game documents a feature.
- **[INF]**: my inference. Every three.js recipe and cost note is [INF] unless it cites three.js source.

Budget: all 35 web searches allowed for this agent were used. Everything else was fetched directly (GitHub raw source, GDC Vault pages, docs, a PDF).

Target project assumptions are taken from the brief and from a read-only look at the lab code. The lab runs three.js r180 with an orthographic 2:1 iso camera, near = −300. It has an HDR post chain (GTAO, bloom, tone map, FXAA/SMAA, and TRAA on WebGPU) and an existing dithered see-through circle (`lookdev-lab/src/shaders/effects/cutaway.glsl`, `lookdev-lab/src/character/cutaway.js`, plus a TSL twin in `backends/webgpu/effects.js`).

---

## 1. Occluder handling: wall/roof cutaway, dithered fade, sphere/cylinder masks around the hero, wall lowering/hiding, and x-ray silhouettes

### Takeaway
Three documented lineages now exist:
- **Diablo I (DevilutionX reverse-engineered code).** Transparency works per room. The same line-of-sight (LOS) raycast that lights tiles also flags every "trans" region a ray enters, and that region's walls then draw transparent or blended.
- **Diablo II (data guide).** Wall transparency is a per-preset data flag (`Logicals`), and objects carry a mouse-selection priority for "unit in front of / behind object".
- **Torchlight / Torchlight 2 (OGRE engine).** X-ray silhouettes come from drawing the level, then the character with depth test **GREATER** and no depth writes, then the character normally.

No primary documentation was found for how D3, D4, PoE1/2, D2R or Last Epoch fade walls. Last Epoch has an occluder-fade system that players report as unreliable. D4 documents only a user-coloured outline accessibility option. PoE2 0.4.0 added a clarity radius around the player inside Delirium fog, a screen-mask idea applied to VFX rather than walls.

For the lab:
- Keep the screen-space dither circle and extend it to InstancedMesh.
- Add a region/room fade (Object Dither) for interiors and roofs.
- Add a `depthFunc = GreaterDepth` x-ray pass for the hero, party and bosses. Both three.js renderers support it in r180.

### Cited Findings
**Diablo I (DevilutionX, a reverse-engineered port. Code is current master, so some behaviour may be modernised.)**
- `DrawCell` draws a tile transparent when the tile has the `Transparent` property **and** `TransList[dTransVal[x][y]]` is true. Transparent tiles get `MaskType::Transparent`, with partial masks only for `LeftTrapezoid`, `RightTrapezoid` and `TransparentSquare` micro-tiles. Wall "arch" sprites (`dSpecial`) take a blended draw path (`ClxDrawBlendedWithLightmap` / `ClxDrawLightBlended`) when `TransList[bMap]` is set. — [DevilutionX scrollrt.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/engine/render/scrollrt.cpp) [RE]
- The vision code's `markTransparentFn` sets `TransList[trans] = true` for the `dTransVal` region of each tile a vision ray passes through. Rays stop at tiles with `TileProperties::BlockLight`. — [DevilutionX lighting.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/lighting.cpp) [RE]
- In `DoVision`, a ray marks a tile visible, then calls `markTransparentFn` only if the tile passes light, so the walls of rooms the player can see into are the ones flagged. — [DevilutionX vision.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/vision.cpp) [RE]

**Diablo II (data guide)**
- LvlPrest.txt `Logicals`: "If equals 1, then the Level Preset allow for wall transparency to function. If equals 0, then walls will always appear solid." — [D2 Data File Guide (d2runewizard mirror)](https://d2runewizard.com/game-files) [DATA]
- Levels.txt `NoPer` either allows "Perspective Mode" in a level or forces "Orthographic Mode". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Objects.txt `Orientation` "can affect mouse selection priority of the object when a unit is being rendered in front of or behind the object (such as a door object covering a unit…)". `OrderFlag0–7` controls "how the object's sprite is drawn… in Perspective game camera mode". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Provenance: the guide's internal links point to `confluence.blizzard.com/display/D2/Data+Text+File+Guide`. The mirror site says it is "Not affiliated with Blizzard Entertainment". — [d2runewizard game-files](https://d2runewizard.com/game-files) [DATA]

**Torchlight / Torchlight 2**
- Torchlight "uses the OGRE open-source 3D graphics engine". — [Wikipedia: Torchlight](https://en.wikipedia.org/wiki/Torchlight)
- The Ogre3D wiki's "ghosted entities" recipe:
  - The occluder goes in `RENDER_QUEUE_WORLD_GEOMETRY_1` and the character in `RENDER_QUEUE_6`.
  - The material has a "behind" pass (`depth_check off`, `depth_write off`) and an "infront" pass (normal depth).
  - The page compares this to Torchlight's "faint blue silhouette" for characters behind walls.
  — [Ogre wiki: Ghosted Entities Behind Other Entities](https://wiki.ogre3d.org/Ghosted+Entities+Behind+Other+Entities) [ENGINE-REF]
- Max Knoblich (Game Developer, 4 Mar 2013) worked out Torchlight 2's approach with a PIX capture:
  1. Draw static level geometry, which fills depth.
  2. Draw the character with `D3DRS_ZFUNC = D3DCMP_GREATER` and `D3DRS_ZWRITEENABLE = 0` (the silhouette).
  3. Draw the character normally.

  This needs no raycast ("uses mostly GPU functionality"). — [Game Developer: Rendering Silhouettes For Concealed Objects](https://www.gamedeveloper.com/programming/rendering-silhouettes-for-concealed-objects)

**Last Epoch**
- In a forum post (22 Mar 2021), a player says the engine "already has a system that can fade out objects blocking the player", but it "does not either work at all, or works partially, in many places". Failures are at doorways, stone arches, trees and the Temple. EHG did not reply. — [Last Epoch forum](https://forum.lastepoch.com/t/places-where-scenery-objects-block-the-view-to-the-player/31501) [FORUM]
- [SNIPPET] In the "Temple rooftops camera issue" thread, a developer replied that "a lot of the new zones have terrain that gets in the way of the camera" and that the issue "should be addressed in the following hotfix". — [Last Epoch forum](https://forum.lastepoch.com/t/temple-rooftops-camera-issue/43634)

**Path of Exile 2**
- The 0.4.0 patch notes (about 5 Dec 2025) say: "Improved the visuals of Delirium fog and added a radius around the player that improves clarity further". — [PoE2 0.4.0 patch notes](https://www.pathofexile.com/forum/view-thread/3883495) [DOC]
- [SNIPPET][FORUM] On a Steam thread (late 2024), a player advises keeping enemy outlines on "until they fix character occlusion". A March 2025 reply asks "Still no fix?". — [Steam PoE2 discussion](https://steamcommunity.com/app/2694490/discussions/0/594008672803419938)

**Diablo IV**
- The accessibility post says players, enemies, objects and NPCs can be "outlined by a personally selected color highlight". It does not say whether the outline shows through occluders. — [Blizzard news: Diablo IV accessibility](https://news.blizzard.com/diablo4/23954932) [DOC]

**Engine references for dithered fades**
- Godot's distance-fade modes:
  - "Pixel Dither… approximate[s] the transparency by only having a fraction of the pixels rendered". "Object Dither" uses the same transparency "across the entire object's surface".
  - For hiding characters near the camera, Godot recommends "Pixel Dither or better, Object Dither", which is "even faster".
  - Alpha blending "can cause transparency sorting issues" and its materials "can't cast shadows". Alpha Hash dithers and "can cast shadows".
  — [Godot docs: Standard Material 3D](https://docs.godotengine.org/en/stable/tutorials/3d/standard_material_3d.html) [ENGINE-REF]
- three.js r180 has `Material.alphaHash`, whose implementation cites Wyman & McGuire's "Hashed Alpha Testing". — [Material.js r180](https://github.com/mrdoob/three.js/blob/r180/src/materials/Material.js), [getAlphaHashThreshold.js r180](https://github.com/mrdoob/three.js/blob/r180/src/nodes/functions/material/getAlphaHashThreshold.js)
- `NodeMaterial` discards when `diffuseColor.a < getAlphaHashThreshold(positionLocal)`. It also has `maskNode` ("Discards the fragment if the mask value is `false`") and `alphaTestNode`. — [NodeMaterial.js r180](https://github.com/mrdoob/three.js/blob/r180/src/materials/nodes/NodeMaterial.js)

**three.js r180 depth and stencil plumbing for x-ray**
- On WebGPU, `_getDepthCompare` maps `material.depthFunc`, so `GreaterDepth` becomes `GPUCompareFunction.Greater`. `stencilWrite`, `stencilFunc`, `stencilFail`, `stencilZFail` and `stencilZPass` are mapped into the pipeline. "three.js does not provide an API to configure the back function". — [WebGPUPipelineUtils.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/webgpu/utils/WebGPUPipelineUtils.js)
- Stencil is **off by default**:
  - WebGPU `Renderer`: `stencil = false`. — [Renderer.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/common/Renderer.js)
  - `WebGLRenderer`: `stencil = false`. — [WebGLRenderer.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/WebGLRenderer.js)
  - `RenderTarget`: `stencilBuffer: false`. — [RenderTarget.js r180](https://github.com/mrdoob/three.js/blob/r180/src/core/RenderTarget.js)
- `WebGLRenderer` r180 has a `reversedDepthBuffer` option that requires `EXT_clip_control`. — [WebGLRenderer.js r180](https://github.com/mrdoob/three.js/blob/r180/src/renderers/WebGLRenderer.js)
- `OutlinePass` (WebGL) exposes `visibleEdgeColor` and `hiddenEdgeColor`. — [OutlinePass.js r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/OutlinePass.js)
- `OutlineNode` (WebGPU/TSL) renders the non-selected objects into a depth buffer. It then masks the selected objects "by comparing the depth buffer of non-selected objects", and exposes `visibleEdge` and `hiddenEdge`. — [OutlineNode.js r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/OutlineNode.js)

**Current lab implementation (local file, read-only)**
- The cutaway is a screen-space circle around the character's chest, using view xy in ortho.
- It cuts only fragments nearer the camera than the character (`depth > center.z − 0.4` returns early) and higher than `feet + 0.35`.
- It discards with a two-level Bayer threshold against `smoothstep(0.55, 1.0, r)`.
- It is patched once per material and switched by a uniform.
- The traversal **skips InstancedMesh and SkinnedMesh**, so instanced trees, rocks and props are never cut.
- Sources: `E:\Diablo2\lookdev-lab\src\shaders\effects\cutaway.glsl`, `E:\Diablo2\lookdev-lab\src\character\cutaway.js` (local).

### Inferences
- [INF] The four documented families solve different problems, and a Diablo-like needs at least three of them:
  - **Screen mask** around the hero: the lab's circle, and PoE2's fog radius. It covers stray occluders anywhere.
  - **Region/room transparency** (D1 code, D2 `Logicals`). It covers interiors and buildings cleanly without a "swiss-cheese" hole.
  - **X-ray** (Torchlight 2). It keeps the hero and allies readable when the other two fail.
  - Per-object raycast fade (LE, Unity forums) is a weaker cousin of region fade. It breaks on large or merged meshes, which is consistent with LE's reported failures.
- [INF] D1's design is economical: **one CPU LOS pass on the tile grid** drives lighting, visibility, automap reveal and wall transparency (see §2 and §6). A three.js Diablo-like can copy it 1:1 on its nav/occupancy grid.
- [INF] D2's `Logicals` flag shows artists need a **per-chunk opt-out**. Some presets must never fade, for example cliff walls that define play space.
- [INF] Draw order is the main pitfall of a GREATER-depth x-ray. The silhouette must draw after the environment but before the character's own depth exists. Otherwise the character's own overlapping limbs light up as "occluded".

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **Keep the screen circle** (`labCutaway`). Remove the `isInstancedMesh` exclusion once the patch reads the instanced `mvPosition` (three's `project_vertex` already applies `instanceMatrix`), so instanced foliage and props are cut too. Keep SkinnedMesh excluded (characters).
2. **Region fade (Object Dither).**
   - Tag wall and roof meshes with a `regionId`. When the hero's nav cell is inside a region, fade that region's camera-side walls and roof. Camera-side can be precomputed with `dot(wallNormalXZ, cameraForwardXZ) > 0`.
   - Drive a per-object `uFade` (0→1 over about 150–250 ms) via `onBeforeRender`, or through an instance attribute for instanced walls.
   - Fragment: `if (bayer4(gl_FragCoord.xy) < uFade) discard;`. Use a stable ordered or blue-noise pattern, because the WebGL path has FXAA/SMAA but no temporal AA to resolve a moving hash.
   - Add an artist flag such as `userData.noFade`, the D2 `Logicals` equivalent.
3. **Wall lowering** (an alternative for interiors) uses per-material `clippingPlanes` with `renderer.localClippingEnabled = true`. A plane at `y = floor + ~1 m` applies only to camera-side walls of the hero's region. Render back faces in flat dark (`side: DoubleSide` plus a `gl_FrontFacing` branch) to fake a cap.
4. **X-ray silhouette (Torchlight 2 order)** for the hero, party and bosses:
   - Add a second `SkinnedMesh` that shares the hero's geometry and skeleton (`xray.bind(hero.skeleton, hero.bindMatrix)`).
   - Its material: `depthFunc: THREE.GreaterDepth`, `depthWrite: false`, a fresnel or flat team colour, `AdditiveBlending`.
   - Order it between environment and hero with `renderOrder` (environment 0, x-ray 1, hero 2) while keeping it in the opaque list (`transparent: false`). Verify that r180 still applies non-Normal blending on opaque-list materials.
   - Alternatively, use **stencil**: the hero writes ref 1 and the x-ray tests `NotEqualStencilFunc` with GREATER depth. This needs `stencilBuffer: true` on the lab's HDR scene RenderTarget, because stencil is off by default in r180.
   - Put the x-ray mesh on a layer excluded from any depth/normal prepass used by GTAO. If `reversedDepthBuffer` is ever enabled, re-check the GREATER semantics.
5. **Many monsters behind walls.** Don't add one x-ray draw per monster. Use `OutlinePass`'s `hiddenEdgeColor` for the hovered or boss set only, or a units-only depth/ID mask compared against scene depth in the final pass (§4).

#### Recommended three.js approach: WebGPURenderer + TSL
1. Extend the existing TSL `createCutaway` twin in the same way (instanced meshes, region fade).
2. Per-object fade options:
   - `const fade = uniform(0).onObjectUpdate(({ object }) => object.userData.fade ?? 0)`, then `material.maskNode = bayer(screenCoordinate).greaterThanEqual(fade)`. `maskNode` discards when false. Verify `onObjectUpdate` in r180.
   - Or `material.alphaHash = true` plus a per-object opacity. NodeMaterial's object-space hash is stable under motion, and the WebGPU path's **TRAA** resolves the hash into smooth translucency. Watch for ghosting on fast camera moves.
3. X-ray: the same clone approach with `MeshBasicNodeMaterial({ depthFunc: GreaterDepth, depthWrite: false })`. The depthFunc→`GPUCompareFunction.Greater` mapping is in r180. For the stencil variant, the renderer and pass render target need a stencil attachment, and both default to off. Two cautions:
   - If the scene `pass()` writes MRT (normal/velocity for GTAO/TRAA), stop the x-ray writing those attachments. Check whether r180 `NodeMaterial` offers an MRT override such as `mrtNode`. Otherwise draw the x-ray in a separate layer pass composited **after** TRAA.
   - X-ray pixels have no valid velocity or depth, so they smear under TRAA.
4. `outline()` (OutlineNode) gives `hiddenEdge` for a selected set. It re-renders all non-selected objects into its own depth buffer, so use it for small sets such as the hover target, a boss, or party members.

#### Cost notes
- [INF] Screen circle: about 10 ALU ops and one `discard` per fragment of patched materials. Negligible. `discard` can disable early-Z for those materials.
- [INF] Region fade: CPU work is trivial (region lookup when the hero changes cell) and adds no draws. Dither noise is visible on the WebGL path without TAA.
- [INF] Clipping-plane wall lowering: one plane test per fragment. No sorting issues, unlike alpha-blended fades, which also lose shadows (per the Godot doc above).
- [INF] X-ray per character: +1 skinned draw (vertex skinning runs again). Fill cost applies only where the character is occluded. Fine for ≤10 characters; for crowds, use one screen-space mask pass instead.
- [INF] OutlinePass/OutlineNode: +1 full-scene depth render, +1 selected-mask render and 4–5 half/quarter-resolution passes. This is the most expensive option, so reserve it for hover and selection.

### Gaps
- No primary documentation was found for wall fade, cutaway, lowering or x-ray in **Diablo III, Diablo IV, PoE1/PoE2, D2R, Titan Quest II, Grim Dawn, Hades II, Lost Ark or WH40K: Inquisitor**. It is also unknown whether D4's accessibility outlines render through walls.
- How D2 visually renders transparent walls (alpha level, dither, or "perspective" behaviour) is not documented beyond the `Logicals` and `NoPer` flags.
- Whether original-era Diablo I used a checkerboard (screen-door) wall pattern and DevilutionX later switched to blending is unverified. The current `options.cpp` contains no such option.
- The search budget ran out before PoE2's character-occlusion fix (if any) or LE's later hotfix notes could be checked.

---

## 2. Visibility: Diablo II's light radius and line-of-sight hiding of monsters, how darkness outside the light radius is rendered (D2 vs D2R), fog of war and map reveal, and GPU approaches

### Takeaway
Both classic Diablos **document LOS-gated drawing**:
- **Diablo I** casts 92 precomputed integer rays from the player. It draws monsters only on lit tiles, except with infravision, which draws them with a colour-remap table.
- **Diablo II** makes it a **per-level data flag** (`Levels.txt LOSDraw`: "check the player's line of sight before drawing monsters"), with doors that block LOS (`BlocksVis`).
- **D2 darkness is data-driven**: per-level ambient RGB + Intensity (0–128), a base player light radius, and coloured light radii (in sub-tiles) on monsters, missiles (with flicker every 4th frame) and objects.

D2R's handling is undocumented. Players say the D2R light radius "seems to be bugged" compared with classic, and that "enemies pop on D2 and… blend in D2R".

For the web, a CPU LOS fan on the tile grid writing a small visible+explored texture is the cheapest faithful approach. GPU variants (render visibility polygons, a 1D polar shadow map, or a compute DDA) are optional.

### Cited Findings
**Diablo I (DevilutionX)**
- Vision uses `VisionRays[23][15]`: "N rays of M points in one quadrant (0°–90°)… rays for other quadrants will be created by mirroring". The table "can be recreated using Bresenham's line drawing algorithm". Ray length is `radius − RayLenAdj[j]`. A diagonal check stops rays leaking between two diagonally adjacent blocking tiles, and rays stop at tiles that do not pass light. — [DevilutionX vision.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/vision.cpp) [RE]
- Flags: every ray-hit tile gets `Visible`, `Lit` is set when `visible`, and `Explored` is set when `doAutomap`. — [DevilutionX lighting.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/lighting.cpp) [RE]
- Drawing rules in `scrollrt.cpp`:
  - Monsters are skipped when `!IsTileLit(tile) && !(MyPlayer->_pInfraFlag && IsFloor(tile))`.
  - Unlit monsters shown via infravision use an "infravision TRN" (palette remap).
  - Other players are hidden on unlit tiles except in town and arena.
  - Corpses and objects draw only when `lightTableIndex < LightsMax`.
  — [DevilutionX scrollrt.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/engine/render/scrollrt.cpp) [RE]
- Per-tile light is `LightFalloffs[radius][linearDistance]`, keeping the minimum across lights. Crypt and Nest levels keep a dim floor. — [DevilutionX lighting.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/lighting.cpp) [RE]
- DevilutionX adds an option, "Per-pixel Lighting: Subtile lighting for smoother light gradients". It is a port addition, not original. — [DevilutionX options.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/options.cpp) [RE]

**Diablo II (data guide)**
- Levels.txt `LOSDraw`: "If equals 1, then the level will check the player's line of sight before drawing monsters." — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Objects.txt `BlocksVis`: "the object will block the player's line of sight to see anything beyond the object… relies on the 'IsDoor' field". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Levels.txt ambient: `Intensity` "controls the intensity value of the area level's ambient colors… between 0 and 128". `Red`, `Green` and `Blue` take 0–255. If all are 0, ambient is ignored. — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Light radius sources:
  - CharStats `LightRadius`: "Baseline radius size of the character's Light Radius".
  - MonStats2 `Light`: "monster's minimum Light Radius size (measured in grid sub-tiles)", plus `light-r/g/b`.
  - Missiles.txt `Light` (sub-tiles) with `Flicker`: "every 4th frame while the missile is active, the Light Radius will randomly change in size between base size to its base size plus this value", plus RGB.
  - Objects.txt `Lit0–7`: light radius per object mode, with colour-gradient fields.
  - Objects.txt `BlocksLight0–7`: "the object will draw a shadow".

  — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- LvlPrest.txt `Outdoors`: "lighting will function differently". The guide ties outdoor lighting to "the time of day". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Note for the writer: Levels.txt `Vis0–7` are **links to adjacent levels** (travel), not visibility settings. — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- [SNIPPET] "The base Light Radius is 13. The Max Light Radius you can have is 18". — [Diablo Wiki (Fandom), Light suffix](https://diablo.fandom.com/wiki/Light_(magic_suffix))
- The 4Gamer report of the D2R art-direction talk does not mention light radius. — [4Gamer GDC 2022 art report](https://www.4gamer.net/games/554/G055460/20220326013/)

**D2R (players only)**
- [SNIPPET][FORUM] "Light radius seems to be bugged in D2R in contrast to D2V". Brightness dims while moving in the Arcane Sanctuary and under walkways. — [Blizzard D2R forum](https://us.forums.blizzard.com/en/d2r/t/brightness-changes-when-i-move-the-character/148284)
- [SNIPPET][FORUM] A player misses "the large light-radius circle" and says "Enemies pop on D2 and they blend in D2R", blaming grey tones. — [Blizzard D2R forum](https://us.forums.blizzard.com/en/d2r/t/contrast-issues/1493)

**GPU and engine references for LOS and fog of war**
- Red Blob Games' 2D visibility algorithm:
  - It sweeps wall endpoints by angle and emits triangles whose "union… is the area that is visible from the central point".
  - Intersecting with a radius or cone gives limited vision; torches are the union of light areas.
  - On the GPU, "triangle rendering to a bitmap and compositing" works, and "A boolean AND operation becomes a bitmap multiply". Per-segment shadow quads are an alternative.
  - If fill rate is the bottleneck, use lower-resolution bitmaps or 1D shadow maps.
  — [Red Blob Games: 2D Visibility](https://www.redblobgames.com/articles/visibility/) [ENGINE-REF]
- mattdesl's GPU 2D shadows (after Catalin Zima):
  - A 256² occlusion FBO feeds a 256×1 polar shadow map ("minimum distance to the first occluder for that ray's angle"), then a light pass blurred more with distance. That is about 3 passes per light.
  - About 20 lights fit on a GeForce 9400 before fill rate was the bottleneck.
  - "Generally less performant than geometry shadows".
  — [mattdesl: 2D Pixel Perfect Shadows](https://github.com/mattdesl/lwjgl-basics/wiki/2D-Pixel-Perfect-Shadows) [ENGINE-REF]

### Inferences
- [INF] The user's premise needs refining. In **D2**, LOS hiding of monsters is a documented, **per-level switch** (`LOSDraw`). **Darkness** comes from ambient plus light radii. No D2 source says monsters outside the light radius are hidden. In **D1**, monsters on unlit tiles are hidden; that is the "stealth by light radius" behaviour.
- [INF] Treat LOS gating as **simulation/visibility-layer state**, not a post effect. That way the 3D and any legacy/2D mode agree, matching D2R's round-1 "same information" rule. D2's per-level flag also suggests open outdoor areas may skip LOS gating.
- [INF] Approximate D2 light-radius scale: 4Gamer's D2R graphics report gives 160 px per tile = 10 ft. Assuming the usual 5×5 sub-tiles per tile (modding convention, not verified this round), a sub-tile is about 2 ft (0.61 m). Base radius 13 is then about 7.9 m, and the maximum of 18 is about 11 m.
- [INF] A fog-of-war texture needs two channels: **visible** (this update) and **explored** (sticky max). `explored` drives the automap (§6), as D1's vision does with the `Explored` flag. `visible` drives monster drawing and "darken outside LOS".

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **CPU LOS.** Build an occupancy grid at sub-tile resolution (about 0.5–0.6 m) from walls and doors (doors toggle like `BlocksVis`).
   - When the hero crosses a cell, run a D1-style mirrored ray fan (precomputed offsets for radius R) or Red Blob's sweep over wall segments.
   - Write `visible` into R and `explored = max(explored, visible)` into G of a `THREE.DataTexture` (RG8, e.g. 256² covering the level), then set `needsUpdate = true`.
2. **Darkness in HDR before tone mapping**, in the lit materials or in one fullscreen pass that reconstructs world xz from the GTAO depth: `light = ambientRGB*intensity + heroLight * radialFalloff(dist, R) * vis.r`. Add coloured missile and monster lights as cheap point lights or a light-accumulation grid. Missile flicker updates every 4th frame, as in D2.
3. **Monsters**: on the CPU, `monster.visible = visibleAt(cell)` (D2 `LOSDraw`, D1 `IsTileLit`), with a short fade-in. For an "infravision"-like skill, draw hidden monsters with the x-ray material from §1, as D1 does with its infravision TRN.
4. **Soft edges**: bilinear sampling of the low-resolution mask plus a temporal lerp, either on the CPU (blend old and new per texel) or with two textures crossfaded in the shader.

#### Recommended three.js approach: WebGPURenderer + TSL
1. Use the same DataTexture path. Alternatively, keep the occupancy grid as a texture and run a **compute** pass (TSL `Fn().compute()`) where each visibility texel marches toward the hero through occupancy (DDA). It writes visible into a storage texture and does `max()` into explored.
2. For many light-casting torches with occlusion, port the 1D polar shadow map to compute: one thread per angle marching occupancy, then sample in materials.
3. Sample `texture(visTex, worldXZ → uv)` in node materials, or once in the PostProcessing chain using the scene pass depth.

#### Cost notes
- [INF] D1-style fan: 4 × 23 rays × ≤15 steps ≈ 1.4k cell tests per update. That is microseconds in JS and only runs on cell change.
- [INF] Upload: 256² RG8 = 128 KB per update. Trivial at ≤10 Hz.
- [INF] Shading costs one texture fetch per fragment in patched materials, or one fullscreen pass.
- [INF] A GPU per-texel DDA is about 256² × 64 ≈ 4M occupancy samples per update. Fine at cell-change frequency, but wasteful every frame.
- [INF] The mattdesl data point (about 20 lights on a 2009 GPU) suggests one hero light is free on modern hardware. Fill rate only matters for many occluded lights.

### Gaps
- **How D2R renders darkness and the light radius** (dynamic point light, post mask, or both) is undocumented in the sources found. Kevin Todisco's GDC 2022 engineering talk is now **free on GDC Vault** (§8) and likely covers it, but it is video and was not watched.
- No D2 source states whether monsters outside the light radius but inside LOS are only darkened or also hidden. D1's rule is documented; D2's is not.
- No primary documentation was found on fog of war or map reveal rendering in D3, D4, PoE1/2, Last Epoch, Torchlight or Lost Ark.
- The ARPG-specific GPU fog-of-war write-up hoped for (e.g. from Riot or Blizzard) was not found within budget.

---

## 3. Telegraphs and AoE indicators: ground decals vs projected meshes, SDF shapes, and readability under heavy spell VFX

### Takeaway
No studio documented its telegraph renderer. What is documented are **outcomes and rules**:
- **PoE2** patched "visibility" of explosive ground effects and boss phase transitions in 0.4.0, after player complaints that ground effects blend into floors.
- **Lost Ark** colour-codes boss indicators (yellow AoE, blue for crowd control and counter windows) and offers party-effect filtering.
- **D4** de-prioritises other players' minions and traps, while players ask for effect-opacity sliders.
- **Diablo III**'s VFX lead taught "Blend-Add" (dark base plus emissive) so crowded effects don't wash to white.

Implementation references are Unity URP screen-space decals (depth reconstruction), three.js `DecalGeometry` (CPU clipping, distorts at corners) and Inigo Quilez's exact 2D SDFs. For the lab:
- Use instanced SDF quads, or depth-reconstructed box decals reading the existing GTAO depth.
- Draw them in a **readability layer after tone mapping**.
- Reserve a hue family for enemy telegraphs and expose an "other players' VFX opacity" control.

### Cited Findings
- PoE2 0.4.0 (about 5 Dec 2025) patch notes list four readability fixes. — [PoE2 0.4.0 patch notes](https://www.pathofexile.com/forum/view-thread/3883495) [DOC]
  - "Improved the visibility of the explosive fungus encountered in The Grim Tangle"
  - "…spawned by the Fungal Proliferator monster type"
  - "Improved the mid fight phase change sequence of the final Act 2 boss"
  - "Improved the first phase change sequence of the final Act 4 boss"
- [SNIPPET][FORUM] PoE2 players in Dec 2024 said ground damage effects "(other than fire and lightning) blend into the floors in most cases" and that "poison clouds look the same, just different sizes". One argued the "No1 rule in PoE2: NEVER have bosses outside your screen". — [Steam PoE2 discussions](https://steamcommunity.com/app/2694490/discussions/0/598514698788322459) (the summary aggregated several threads; quote-to-thread mapping is unverified)
- [SNIPPET] Lost Ark (2022 guides):
  - AoE boss attacks often carry a **yellow** indicator, and heavy-impairment attacks are usually **blue**. — [vulkk: advanced combat mechanics](https://vulkk.com/2022/02/11/how-to-use-advanced-combat-mechanics-in-lost-ark/)
  - Counterable attacks glow **blue** just before firing. — [vulkk: advanced combat mechanics](https://vulkk.com/2022/02/11/how-to-use-advanced-combat-mechanics-in-lost-ark/)
  - There are frontal and rear attack-angle indicators. — [vulkk settings guide](https://vulkk.com/2022/02/20/lost-ark-settings-and-ui-guide-what-should-you-change/)
  - A "Battle Effects Display" option can limit party members' effects to beneficial ones. — [r/lostarkgame tips (mirror)](https://lr.us.psf.lt/r/lostarkgame/comments/snovv5/50_tips_for_new_players)
- [SNIPPET] Diablo IV: players asked for an opacity slider for their own effects and a way to hide other players' spells "so ground-based enemy affixes stay visible", prompted by Warlock persistent ground effects. "Necromancer minions and certain traps are already de-prioritized for other players". — [Icy Veins](https://www.icy-veins.com/d4/news/diablo-4-effect-toggles-players-renew-calls-for-this-feature/)
- Diablo III VFX, a secondary write-up of Julian Love's GDC 2013 talk:
  - **Blend-Add** (alpha composite) places "a dark base behind emissive content so it stands out when many effects overlap". Pure additive "would turn a crowded scene into a mass of white".
  - D3's painted smoke relies on a fixed time of day and a locked isometric camera.
  - The original talk is free (§8).
  — [JangaFX: Diablo 3 VFX experiments](https://jangafx.com/insights/diablo-3-vfx-experiments)
- Last Epoch (dev blog, 5 Mar 2023):
  - Projectors (decals) moved "from Unity's default decal solution to a custom one", which is "considerably faster".
  - Some transparent effects became alpha-test to cut overdraw. Ancient Dragon attacks went from "mid-40s" to framerate that "hovers around 100".
  - The game uses Unity's deferred path so that many skill lights stay cheap.
  — [Last Epoch forum dev blog](https://forum.lastepoch.com/t/performance-optimization-coming-in-convergence/52263) [DOC]
- Unity URP decals: [Unity URP 14 decal docs](https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@14.0/manual/renderer-feature-decal.html) [ENGINE-REF]
  - **DBuffer** decals need a depth-normal prepass and suit tile-based GPUs less well.
  - **Screen Space** decals render "after the opaque objects", reconstruct normals from depth, and are "recommended for mobile platforms that use tile-based rendering".
  - Decals don't use the SRP Batcher. Enable GPU instancing on a shared decal material, and use atlases to cut material count.
- three.js `DecalGeometry` builds a decal mesh by projecting and clipping the target mesh through a projector matrix. "Decal projections can be distorted when used around corners". — [DecalGeometry.js r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/geometries/DecalGeometry.js) [ENGINE-REF]
- Exact 2D SDFs for telegraph shapes. `opRound` rounds any shape and `opOnion` makes it annular (outline-only). — [Inigo Quilez: 2D distance functions](https://iquilezles.org/articles/distfunctions2d/) [ENGINE-REF]
  - `sdCircle`: circle AoE.
  - `sdPie`: cone/sector.
  - `sdArc` and `sdRing`: donut or partial ring.
  - `sdOrientedBox` and `sdSegment`: line or charge.
  - `sdHorseshoe`: crescent.
- D2 missiles carry a `Trans` blend mode (NoTransparency / Black Alpha / White Alpha), so blend choice is per effect in data. — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]

### Inferences
- [INF] The ARPG readability failures that are documented come from **value and hue collisions** between ground effects and floors (PoE2) or with allied VFX (D4). Projection method is not the issue. Telegraphs need a **reserved hue/value channel** plus an **outline**, and should be drawn last, independent of scene exposure.
- [INF] On an orthographic, fixed camera with mostly flat play spaces, a **ground-aligned quad** suffices for most telegraphs. Depth-reconstructed box decals are needed only on stairs, slopes and rubble. `DecalGeometry` suits static, rarely moved splats, not moving telegraphs.
- [INF] Fill-progress semantics (how long until detonation) need a second SDF threshold or radial fill. Phase-change fixes like PoE2's suggest the timing cue matters as much as the shape.

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **Batching**: one `InstancedMesh` of unit quads (or unit boxes for decals) with per-instance attributes: shape id, size, angle, progress, colour and owner (enemy/ally).
2. **Shading**: local xz → IQ SDF.
   - Fill alpha: `aa = 1.0 - smoothstep(0.0, fwidth(d) * 1.5, d)`.
   - Outline: `abs(d) - w`.
   - Progress: `sdf(p / progress)` or `length(p)/R < progress`, plus a pulse near detonation.
3. **Ground conformity**: on flat ground, the quad sits at terrain height with `polygonOffset` and `depthWrite: false`. On uneven ground, use a box decal whose fragment shader reads the scene **depth texture** (already produced for GTAO), reconstructs world position with `projectionMatrixInverse`/`matrixWorld`, transforms into decal space, discards outside the box, then evaluates the SDF. In ortho, depth is linear, so reconstruction is simple.
4. **Readability layer**:
   - Render telegraphs unlit in a separate scene or layer, composited **after tone mapping and before FXAA/SMAA**, so darkness and exposure don't shift their colour. Keep them out of the bloom threshold.
   - Add a thin dark outer rim (the D3 Blend-Add idea) so they separate from bright spells.
   - Reserve enemy hues, e.g. red/orange for damage and blue/violet for crowd control, as Lost Ark does.
5. **Global VFX controls**: an "allied/other-player VFX opacity" uniform, as D4, LE and PoE2 players request, and a rule that enemy telegraphs draw on top.

#### Recommended three.js approach: WebGPURenderer + TSL
1. Use the same instanced quads, with the SDFs written as TSL `Fn`s.
2. Alternatively, implement telegraphs as a **post node**. Take the scene `pass()` depth, reconstruct world xz, loop over a small uniform or storage array of active telegraphs (≤32), and composite after tone mapping. This needs no geometry but costs pixels × N, so cull by screen rectangle.
3. Draw after TRAA and rely on analytic SDF AA (`fwidth`). Telegraphs drawn before TRAA can ghost when moving fast.

#### Cost notes
- [INF] Instanced quads: one draw call. Cost is covered pixels × (about 20 ALU for the SDF, plus one depth fetch for the decal variant).
- [INF] The post-node loop costs about pixels × N telegraphs. Bound N or tile-cull.
- [INF] `DecalGeometry`: CPU clipping cost scales with the target mesh's triangles per placement. Avoid it for moving shapes.
- [INF] The LE data point shows overdraw from transparent VFX can halve framerate. Telegraph and VFX budgets should prefer alpha-test or dither for large ground effects.

### Gaps
- No primary documentation was found on how **D4, PoE2, Lost Ark or D3** render telegraphs (decal vs mesh, SDF vs texture, colour or value rules). The PoE2 boss-telegraph design rationale was not found as a developer quote.
- Whether D4 shipped other-player VFX opacity or effect toggles by Oct 2026, and whether PoE2 added an equivalent, is unverified.
- The Lost Ark findings come from 2022 guides seen only as search summaries; current menu names are unverified.

---

## 4. Hover, selection and elite outlines, item labels and loot beams: are labels UI or world-space?

### Takeaway
- **D2's hover highlight is a sprite blend table** ("Highlight Transparency… used when mousing over the unit"), not an outline.
- **D4** documents a user-coloured outline for players, enemies, objects and NPCs.
- **PoE's filter syntax** documents every loot-readability parameter: beams with an optional "Temp" mode, minimap icon shape, colour and size, font size 1–45, RGBA label colours, and positional sounds.
- **DevilutionX** (a QoL addition) documents a **screen-space** label layout with horizontal collision resolution and click-through on labels.
- three.js ships `OutlinePass` (WebGL) and `OutlineNode` (WebGPU), both splitting visible and hidden edges. Their extra full-scene depth render makes them a hover/selection tool, not an elite-crowd tool.

### Cited Findings
- D2's item and armour transparency tables include `0` 25%, `1` 50%, `2` 75%, Black/White Alpha, `7` "Highlight Transparency (Used when mousing over the unit)" and `8` "Blended". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- D2 MonStats2 `corpseSel` controls whether a corpse can be selected with the cursor. Objects `Orientation` sets mouse-selection priority when a unit is in front of or behind an object. — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Diablo IV: players, enemies, objects and NPCs can be "outlined by a personally selected color highlight". Text has 3 size options. — [Blizzard news](https://news.blizzard.com/diablo4/23954932) [DOC]
- PoE item-filter syntax. — [pathofexile.com item filter guide](https://www.pathofexile.com/item-filter/about) [DOC]
  - `PlayEffect <Colour> [Temp]`: a beam in 11 colours. With `Temp`, "the beam only appears as the item drops".
  - `MinimapIcon <Size 0–2> <Colour> <Shape>`, with 12 shapes such as Circle, Diamond, Star, Moon and Raindrop.
  - `SetFontSize 1–45`.
  - `SetTextColor`, `SetBorderColor` and `SetBackgroundColor` take RGBA 0–255. Default alpha is 255, 255 and 240 respectively.
  - `PlayAlertSound` and `PlayAlertSoundPositional` take id 1–16 and volume 0–300.
  - `Show`, `Hide` and (Ruthless) `Minimal` rules.
- DevilutionX item labels (QoL code, not original Diablo I): — [DevilutionX itemlabels.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/qol/itemlabels.cpp) [RE]
  - Placement: a label is centred over the item sprite, raised one tile, and drawn on the game-viewport surface in pixel coordinates, i.e. screen space.
  - Overlap: for each label, a loop checks earlier labels. If they are within `labelHeight + BorderY` vertically and overlap horizontally, the label moves left or right; a `usedX` set avoids retrying a spot. The loop repeats until a pass finds no collision.
  - Constants: `BorderX=4`, `BorderY=2`, `MarginX=2`.
  - Interaction: hovering a label highlights it and makes it the click target. A held key inverts the "show item labels" option, and labels are hidden in stores.
- `OutlinePass` (WebGL) has `visibleEdgeColor` (default white) and `hiddenEdgeColor`. — [OutlinePass.js r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/OutlinePass.js)
- `OutlineNode` (WebGPU) works in passes: — [OutlineNode.js r180](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/tsl/display/OutlineNode.js)
  1. Depth of non-selected objects.
  2. Selected-object mask by depth comparison.
  3. Half-resolution edge detection.
  4. Separable blur at half resolution, then at quarter resolution.
  5. Composite.

  Parameters are `edgeThickness`, `edgeGlow` and `downSampleRatio` (default 2). Outputs are `visibleEdge` and `hiddenEdge`.
- D2R art direction says the original UI was "muddy" and text hard to read, so contrast was adjusted. When character or skill panels open, the centre clears so the character stays visible. — [4Gamer GDC 2022 art report](https://www.4gamer.net/games/554/G055460/20220326013/)

### Inferences
- [INF] Genre evidence points to **labels as screen-space UI**. D2 and the DevilutionX port both use pixel-space labels that double as click targets, and PoE's label styling is a UI concept. **Beams are world-space VFX.** Keep them separate: labels in DOM, canvas or UI; beams as world-space HDR billboards that bloom.
- [INF] Hover feedback can be cheaper than an outline. D2 used a brightening blend on the sprite, so in 3D an emissive or brightness boost uniform on the hovered object costs nothing. Reserve outlines for elites and bosses or accessibility (D4).
- [INF] PoE's parameter set is a ready-made spec for a loot-filter data model: colour, size, background alpha, beam with a temporary option, minimap icon, and positional sound.

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **Hover**: an emissive or brightness boost on the hovered object (a uniform), as D2's "Highlight Transparency" does. Pick via a GPU ID buffer or raycast against simplified proxies.
2. **Elite or boss outline**: an **inverted hull**, i.e. a second draw with `side: BackSide` and vertices pushed along normals. In ortho, a constant pixel width converts with `worldPerPixel = (camera.top - camera.bottom) / camera.zoom / viewportHeightPx`. Alternatively, a fresnel rim inside the main material adds no extra draw. `OutlinePass` with `hiddenEdgeColor` gives a hover target that also shows through walls.
3. **Labels**: project item positions to screen each frame, sort by filter priority, and resolve overlaps. Use DevilutionX-style horizontal shifts or vertical stacking, then clamp to screen. Render through `CSS2DRenderer` for tens of labels, or a single canvas-2D overlay for hundreds. Labels are clickable, and a hold/toggle key works as in DevilutionX.
4. **Loot beams**: an additive vertical quad billboarded around Y (cheap in ortho) in HDR filter colour so bloom picks it up. `Temp` mode fades the beam after the drop animation. A minimap icon and positional sound come from the same filter rule.

#### Recommended three.js approach: WebGPURenderer + TSL
1. Hover boost: an `emissiveNode` driven by a per-object uniform (`onObjectUpdate`).
2. Inverted hull: `MeshBasicNodeMaterial` with `side: BackSide` and `positionNode = positionLocal.add(normalLocal.mul(width))`.
3. `outline(scene, camera, { selectedObjects, edgeThickness, edgeGlow })`, mixing `visibleEdge` and `hiddenEdge` with two colours. This doubles as an occluded-target indicator.
4. Labels and beams are renderer-independent (DOM/canvas), with beams as node materials.

#### Cost notes
- [INF] An emissive hover boost costs 0 extra draws. An inverted hull costs +1 draw per outlined object; skinned objects are skinned again.
- [INF] OutlinePass/OutlineNode add a full-scene depth render, a selected-mask render and 4–5 reduced-resolution passes. The cost is roughly constant in the number of selected objects but dominated by the extra scene render.
- [INF] DOM labels cost layout and style work per label. Past roughly 100–200 visible labels, a single canvas-2D or instanced SDF-text layer is safer. This threshold is an unmeasured estimate; measure it in the lab.

### Gaps
- No documentation was found on **D2R's Alt-label layout algorithm**, the **D3/D4 hover-outline technique** (screen-space vs hull), D4 loot beams, or **PoE2 filter syntax differences**.
- Ben Golus's "The Quest for Very Wide Outlines" (jump flood vs blur timings) could not be fetched (Medium 403, Wayback blocked), so its numbers are **not** included: https://bgolus.medium.com/the-quest-for-very-wide-outlines-ba82ed442cd9

---

## 5. Blood, corpses and gore: decal systems, corpse persistence budgets and dissolve-out

### Takeaway
Three games give hard numbers or mechanisms:
- **D2** caps corpses with a shared **pool of 50** (oldest removed first) for flagged monsters and treats blood as **transient missiles** (`blood1`, `blood2`, `bigblood1`, `bigblood2`), not persistent decals.
- **D3** ragdolled every creature, with explicit cost controls: some ragdolls don't collide with each other, culling spheres are rebuilt per bone, and gibbing swaps to a pre-split mesh and disables joints.
- **Grim Dawn** sets corpse removal per monster in data (`deleteBehavior = Dissolve | Corpse`) with a user lifetime of about 1 minute. Players who force persistence report FPS collapsing after hundreds of kills.

For the lab: a capped corpse pool (~50) that freezes the pose and batches it statically, then dissolves out, plus instanced ground-decal ring buffers or a world-space blood accumulation texture.

### Cited Findings
- D2 MonStats2 `limitCorpses`: "the monster's corpse will be placed into a pool with all other corpses with this field checked. Once that pool reaches the max (50), the corpses at the beginning of the pool start getting removed." — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- D2 MonStats2 `Bleed`: 0 means never, 1 randomly creates the "blood1" or "blood2" **missiles** when hit, and 2 adds "bigblood1" and "bigblood2". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- D2 States: `udead` flags a "used dead corpse" that corpse skills cannot target, and `shatter` "causes ice shatter missiles to create when the unit dies". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- Diablo I (DevilutionX): corpses and objects are only drawn when the tile's light index is below `LightsMax`, so they vanish in full darkness. — [DevilutionX scrollrt.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/engine/render/scrollrt.cpp) [RE]
- Diablo III ragdolls (Erin Catto, GDC 2012; slides with speaker notes): — [Catto: Ragdolls, GDC 2012 (PDF)](https://box2d.org/files/ErinCatto_Ragdolls_GDC2012.pdf) [DOC]
  - Goal: "ragdolls on every creature". Ragdolls "allow for lots of death variation and reduce the animator workload" and make "corpses conform to the environment… prevent corpses from hanging off a cliff".
  - Engine: built "on top of the Havok physics engine", then switched "to an in-house physics engine called Domino".
  - Performance: "we decided to improve the performance of some ragdolls… by preventing those ragdolls from colliding with each other", while still allowing self-collision.
  - Culling: actors keep a bounding sphere "used for lighting and visibility culling". For ragdolls and gibs, "a local bounding sphere for each bone" is summed over final bone positions.
  - Spawning: ragdolls spawn via animation triggers, and a terrain-overlap removal pass runs "until all the overlaps are removed or an iteration limit is hit".
  - Gibbing: "the visual mesh is swapped to a custom gibbed mesh, and then select ragdoll joints are disabled". Radial and linear explosions scale impulse by projected surface area.
- [SNIPPET] In D3, "monster deaths… are all pre-animated", but afterwards bodies can be flung, torn apart, or shattered when frozen. — [Diablo Wiki: Physics](https://diablowiki.net/Physics)
- Grim Dawn (player forum, 2020–2021): — [Crate forum: corpse persistence](https://forums.crateentertainment.com/t/any-mods-on-corpse-persistence/104062) [FORUM]
  - Lifetime: the in-game slider "extends them to remain for the maximum time, which is maybe 1 minute". A config value of 999 kept bodies about 5 minutes, but they vanish when the player leaves by portal.
  - Data: modders change `deleteBehavior` from `Dissolve` to `Corpse` in monster `.dbr` files.
  - Performance: one player warns "your FPS will go down to 10-20 FPS over time" after 916 kills.
  - Rationale: a secondhand claim says early immediate disintegration was due to "performance lag… on weaker PCs".
- Last Epoch replaced Unity's default decal projectors with a custom, "considerably faster" system. — [Last Epoch dev blog](https://forum.lastepoch.com/t/performance-optimization-coming-in-convergence/52263) [DOC]

### Inferences
- [INF] A corpse budget of about 50 is a well-tested genre default (D2), and FIFO removal is accepted by players. Grim Dawn's player reports show that unbounded persistence degrades badly, so cap by count, not only by time.
- [INF] D3 shows that rich death physics is affordable only with **collision culling between corpses** and **per-bone bounds**. A browser build should limit real ragdolls to a few hero-caused kills and use pre-animated deaths elsewhere, which D3 itself did for the death motion.
- [INF] D2's blood-as-missiles is the cheapest option: short-lived particles with no persistence. Persistent blood is a deliberate cost decision.

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **Corpse pool**: a ring buffer capped at about 50. When over cap or past lifetime (a configurable 30–90 s), dissolve the oldest.
2. **Pose freeze and batch**: when the death clip ends, stop that unit's `AnimationMixer`. To remove ongoing GPU skinning, bake the final pose into a static `BufferGeometry` (per-vertex `SkinnedMesh.applyBoneTransform`) and add it to a `BatchedMesh` "corpse batch" drawn in one call. VAT-animated monsters (§7) just freeze their per-instance frame.
3. **Dissolve**: a noise threshold plus `discard`, with an emissive rim `smoothstep(t, t+0.05, n)` via `onBeforeCompile`. Use the same mask in `customDepthMaterial` so the shadow dissolves too.
4. **Blood**: one of three options.
   - (a) Transient sprites, as D2 does.
   - (b) Persistent ground decals: an `InstancedMesh` of ground quads with per-instance atlas UV, rotation, scale and age, in a ring buffer of N (e.g. 256) with fade. Use box decals reading depth on uneven ground.
   - (c) A **world-space accumulation render target** covering the play area. Splat with max or additive blending and sample it in the terrain shader. Splat count is unlimited at constant cost.
5. **Gibs**: swap to pre-split piece meshes (D3) with simple scripted or physics arcs, capped to a few sets on screen.

#### Recommended three.js approach: WebGPURenderer + TSL
1. Dissolve via `material.maskNode = noise.greaterThan(dissolve)` plus an `emissiveNode` rim. Shadows go through `castShadowNode` or the shadow-pass mask; verify r180 behaviour.
2. Corpse batching with `BatchedMesh` works the same way. For VAT crowds, freeze `frame` in a storage or instanced attribute. A compute pass can age and fade decals.
3. The accumulation RT can be a storage texture written by compute splats, or rendered quads with blending.

#### Cost notes
- [INF] 50 static corpses in one `BatchedMesh` cost one draw, with no skinning or animation CPU.
- [INF] Instanced decals cost one draw plus ground overdraw. A 2048² RGBA8 accumulation RT is 16 MB (4 MB as R8), which is roughly 5 cm/texel over 100 m.
- [INF] Real ragdolls need a physics engine (e.g. Rapier) and are only worth it for a handful of bodies.

### Gaps
- No documentation was found for **D4 or PoE corpse budgets and decal systems**, **D3 blood decals**, or Diablo Immortal or Lost Ark gore budgets. Julian Love's GDC 2013 D3 VFX talk (free, §8) may cover death and blood VFX but was not watched.
- Whether D2's 50-corpse pool applies per game or per level is not stated in the guide.

---

## 6. Minimap and automap: D2 automap, Diablo IV minimap, PoE minimap; authored tiles vs render-to-texture vs procedural layout rendering

### Takeaway
Both classic Diablos build the map **from tile data, not by rendering the 3D or 2D scene**:
- **Diablo I** draws **vector shapes** (lines and diamonds for walls, doors, grates, stairs and lava) per tile "automap type" loaded from `.amp` tables.
- **Diablo II** maps each tile's orientation, style and sequence to **sprite cels in `MaxiMap.dc6`**, with random variants.

Both reveal per tile as the player explores. D1 reveals via vision rays; D2 persists the progress in the character save, and some presets are pre-revealed. No primary documentation exists for D4 or PoE minimap rendering. PoE areas pick from about 5–15 layouts each, per a community project, and the in-game map has overlay and corner modes. For the lab, generate the map from layout data plus the shared "explored" mask (§2). Use render-to-texture of 3D only as cached chunk snapshots.

### Cited Findings
- Diablo I automap (DevilutionX): — [DevilutionX automap.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/automap.cpp) [RE]
  - **Data**: `LoadAutomapData()` loads a per-tileset `.amp` file (e.g. `levels\l1data\l1.amp`) into `AutomapTypeTiles`. Each tile has a shape (`Vertical`, `Horizontal`, `Cross`, `Diamond`, lava variants, pentagram…) and flags (doors, arches, grates, stairs, dirt).
  - **Reveal**: `AutomapView` exploration values only ever increase, and some wall neighbours reveal with a cell.
  - **Drawing**: line and pixel primitives (`DrawVertical`, `DrawMapVerticalDoor`, `DrawLava<>`, `DrawMapStar`…).
  - **Modes**: a minimap in the top-right corner (`gnScreenWidth/4` wide, semi-transparent background) and a full overlay. Zoom runs 25–200 in steps of 25.
  - **Markers**: item diamonds within 8 cells when enabled, and player arrows by facing direction.
- Diablo I vision sets `DungeonFlag::Explored` when `doAutomap`, so the automap reveal comes from the same LOS rays. — [DevilutionX lighting.cpp](https://github.com/diasurgical/devilutionX/blob/master/Source/lighting.cpp) [RE]
- D2 `AutoMap.txt` "controls how the Automap in game will display the discovered parts of the area level and store this progress in character save files". — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
  - It is "composed of many different image files depicted as small icons" assigned to map cells. Tiles without images stay blank.
  - Fields: `LevelName` (act and level type), `TileName` (e.g. `fl` floor, `wl` left wall, `co` column), `Style`, `StartSequence`/`EndSequence`, and `Cel1–Cel4`. The cel fields are frames in `MaxiMap.dc6`, chosen randomly "for visual variety".
- D2 `LvlPrest.txt AutoMap`: 1 means the preset is "automatically completely revealed on the Automap", 0 means it must be explored. Levels.txt `Layer` ties automap data to a level for saving and loading. MonStats2 `automapCel`/`noMap` control monster markers on the automap. — [D2 Data File Guide](https://d2runewizard.com/game-files) [DATA]
- [SNIPPET] PoE has an overlay map and a corner map, toggled with Tab once the corner map is enabled. — [PoE forum](https://www.pathofexile.com/forum/view-thread/524680)
- [SNIPPET] For most PoE areas "a layout is randomly selected from roughly 5-15 layouts", according to a community machine-learning project that predicts layouts from screen pixels. — [hooved/poemap](https://github.com/hooved/poemap)
- PoE's item filter can add **minimap icons** for loot (size, colour, shape). — [PoE item filter guide](https://www.pathofexile.com/item-filter/about) [DOC]

### Inferences
- [INF] **Authored per-tile map art** (D2) gives the most "Diablo" look, but needs a map glyph per tile type. **Procedural vector drawing** (D1) is automatic from layout data and fits procedural levels. Both cost almost nothing per frame because they redraw only on reveal.
- [INF] Sharing the visibility system is the key architectural point: D1's vision rays set `Explored`, which drives the automap. In the lab, the `explored` channel of the fog-of-war texture (§2) should drive map reveal.
- [INF] Render-to-texture of the real 3D scene is the generic fallback when no tile semantics exist, e.g. hand-built hub maps like the lab's Bloodmoor or Weeping Fields scenes. Cache it per chunk; re-rendering every frame is wasteful.

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **Tile-based levels**: give each tile or preset a map glyph (D2 style: atlas sprites, with variants) or a vector descriptor (D1 style: line segments for walls, door and stair glyphs). On reveal, draw into a 2D canvas used as a `CanvasTexture`, or into a small "map scene" (`LineSegments` + instanced sprites) rendered by a second `OrthographicCamera` into a 512² `WebGLRenderTarget`, only when exploration changes.
2. **Hand-built 3D hubs**: render top-down ortho snapshots per chunk once, with flat override materials (light floor, dark walls; `scene.overrideMaterial` or layers), store them in an atlas, and mask with `explored`.
3. **Display**: a corner minimap (D1 and PoE style) and a full-screen semi-transparent overlay (D2 Tab), with markers for player arrow, party, items and filtered loot icons (PoE), and monster markers optional per type (D2 `noMap`).

#### Recommended three.js approach: WebGPURenderer + TSL
- Use the same approach: canvas or RT map, with the reveal mask sampled from the fog-of-war storage texture (§2). Compute can rasterise vector map glyphs into a storage texture, but the canvas route is simpler and renderer-independent.

#### Cost notes
- [INF] Redraw only on reveal: per-frame cost is markers plus one textured quad. A 512² RGBA8 map RT is 1 MB. Chunk snapshots cost one-off renders and atlas memory.

### Gaps
- **Diablo IV and PoE1/PoE2 minimap rendering** (authored vs generated vs RT) is undocumented in the sources found. Datamining resources such as d4data or poe-dat-viewer were not reached within budget.
- Whether D2R redrew `MaxiMap` glyphs in HD or changed the automap pipeline is not documented here.

---

## 7. Horde rendering: monster counts and keeping them cheap (animation LOD, update-rate reduction, impostors, VAT), Diablo Immortal crowd tricks, and Vampire Survivors-style games for comparison

### Takeaway
No ARPG studio (D4, PoE, Diablo Immortal, LE) documented its crowd renderer. The best documented analogue is **Deep Rock Galactic: Survivor's mobile port** (Unity blog, Sep 2026):
- About **1,000 enemies on screen** via **baked vertex-animation textures + GPU instancing**, with "practically no CPU cost".
- **Damage numbers** as a particle system with a digit spritesheet.
- **Flow-field** pathing whose cost is independent of agent count.
- **Custom batched environment draws** that exploit the fixed top-down camera.

three.js community posts show the same pattern: a single-InstancedMesh crowd up to 100k with vertex-shader LOD and time-sliced updates, and VAT-from-morphs for 240 avatars at 60 FPS under 6× CPU throttling. Engine docs supply the **update-rate throttling** model (UE Animation Budget Allocator, 1.0 ms default) and off-screen culling modes (Unity).

Key point for an **orthographic** camera: every unit has the same screen size, so distance LOD does not apply. Use **importance and count-based LOD** and **fixed-angle direction impostors**, which D2's original sprites effectively were.

### Cited Findings
- Deep Rock Galactic: Survivor mobile (Unity blog, Adam Axler, 18 Sep 2026): — [Unity blog: Optimizing DRG: Survivor for mobile](https://unity.com/blog/optimizing-deep-rock-galactic-survivor-for-mobile) [DOC]
  - **Enemy rendering**: "something like a thousand skinned mesh renderers on the screen at the same time". Animation keyframes were baked into textures with GPU vertex animation, giving "practically no CPU cost". The shared mesh and material allow GPU instancing.
  - **Damage numbers**: TextMesh Pro per hit was too costly, so they were replaced with a particle system using a 0–9 digit spritesheet.
  - **Simulation**: NavMesh per agent was replaced with **flow fields** (cost depends on area, not agent count) inside a bounding box around enemies and the player. 10–15 dependent Burst jobs move enemies, and a KD-tree serves spatial queries ("not sure it was a perfect fit" because it is rebuilt often).
  - **Environment**: with the fixed top-down camera, they compute the visible area and submit visible floor and wall objects through custom batch draw commands.
  - **Targets and tests**: 30 fps on low-tier and 60 on flagship devices. A 3 GB iPad had about 1,850 MB usable. Test scenarios included 1,000 enemies converging and 500 enemies with all weapons firing.
- three.js forum, "One Draw Call, Massive Crowd" (19 Feb 2026): — [three.js forum](https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928) [ENGINE-REF]
  - One merged geometry in a single `InstancedMesh`, with per-vertex part IDs and packed per-instance attributes.
  - **Vertex-shader distance LOD**: far characters lose moving parts and use cheaper lighting.
  - Time-sliced updates, with distant characters updated less often. Cached trig "recovered ~25fps at scale".
  - Peak 100,000 people at sub-2 ms GPU and about 0.1 ms CPU on the author's machine. Hardware and animation method were not specified.
- three.js forum (4 Sep 2022): — [three.js forum](https://discourse.threejs.org/t/playback-the-animation-of-many-low-poly-models-as-they-are-moved-around/42205) [ENGINE-REF]
  - `InstancedMesh` plus a **VAT generated from morph data** for models up to about 2,000 vertices, based on the `webgl_gpgpu_birds_gltf` example.
  - 240 avatars held "60 FPS… even with 'CPU: 6x slowdown'" on a 2019 MacBook Pro, and ran on a Pixel 6 Pro and iPhone 11.
- [SNIPPET] A Blender VAT add-on for three.js stores per-vertex positions in a texture: "vertical axis corresponds to animation frames, and the horizontal axis… mesh vertices". — [Blender Extensions: VAT](https://extensions.blender.org/add-ons/vat/)
- Unreal Animation Budget Allocator: — [Epic docs](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-budget-allocator-in-unreal-engine) [ENGINE-REF]
  - It caps skeletal-mesh animation game-thread time at a fixed per-platform budget (`a.Budget.BudgetMs` default **1.0 ms**).
  - It scores significance and lowers tick rates: 1 means every frame, 5 means every 5th frame.
  - It interpolates "only when the time budget is exceeded".
  - Defaults: `MaxTickRate` 10, `MaxTickedOffsreen` 4, `MaxInterpolatedComponents` 16.
- Unity `AnimatorCullingMode`: `AlwaysAnimate`, `CullUpdateTransforms` ("Retarget, IK and write of Transforms are disabled when renderers are not visible") and `CullCompletely`. — [Unity docs](https://docs.unity3d.com/ScriptReference/AnimatorCullingMode.html) [ENGINE-REF]
- Last Epoch: all player-ability VFX and frequent effects are **pooled** ("created at load and reused"). Trails cause "significant performance degradation" with many projectiles. — [Last Epoch dev blog](https://forum.lastepoch.com/t/performance-optimization-coming-in-convergence/52263) [DOC]
- D2R worst cases had to match the original one-to-one: 57 simultaneous missiles each with particles and dynamic light, and up to 100 Necromancer pets. Round 1 already covered this, repeated here only as the budget reference. — [4Gamer GDC 2022 art report](https://www.4gamer.net/games/554/G055460/20220326013/)
- [SNIPPET] Ember and Blade (a Unity horde game) found 3D enemy counts expensive due to draw calls and skinning. It moved effects to GPU particles because Unity's CPU particles struggle "in the thousands". — [thegameswiki: Ember and Blade tech](https://thegameswiki.com/ember-and-blade/wiki/development-and-technology)
- [SNIPPET] Vampire Survivors moved from Phaser to Unity in Aug 2023, citing performance and cross-platform reasons. No rendering details were found. — [GamingOnLinux](https://www.gamingonlinux.com/2023/07/vampire-survivors-switching-to-new-game-engine-on-august-17/)
- [SNIPPET] PoE 2.5.2 (Jan 2017) parallelised DX11 scene rendering across threads, when the driver supports constant buffer offsets. — [PoE Wiki: Version 2.5.2](https://www.poewiki.net/wiki/Version_2.5.2)

### Inferences
- [INF] In an **orthographic** camera, a far monster is as big on screen as a near one, so mesh LOD by distance and screen-size heuristics do nothing. LOD should key on **importance** and **count**:
  - **Importance**: hero, party, boss and elite get full skinning; trash monsters get VAT; corpses are frozen.
  - **Count**: past N units, drop the VAT sampling rate (e.g. 15 Hz) or switch to impostors.
  - **Screen edges**: off-screen units are frozen or culled (Unity `CullCompletely`).
- [INF] A fixed iso camera makes **direction-sprite impostors** (8 or 16 yaws × frames, pre-rendered from the 3D model, plus a normal-map atlas for dynamic lights) almost exact. That is the D2 original technique and the Hades pre-rendered-character idea from round 1, and it is the cheapest possible horde tier.
- [INF] DRG:S's three wins carry over to the web nearly 1:1: VAT plus instancing, particle damage numbers, and flow fields. JS CPU time is the scarcer resource in browsers, so moving animation to the GPU matters even more.

#### Recommended three.js approach: WebGLRenderer + GLSL
1. **Trash-mob tier**: `InstancedMesh` per monster type plus a **VAT** `DataTexture` (RGBA16F positions, optionally normals).
   - Per-instance attributes: `clipStart`, `clipLength`, `timeOffset`, `speed` and `tint`.
   - The vertex shader samples `texelFetch(vat, ivec2(gl_VertexID, frame), 0)`; WebGL2 supports vertex texture fetch.
   - Blend two frames for smoothness.
2. **Elite tier**: `SkinnedMesh` with **throttled `mixer.update`**, budget-allocator style: track ms per frame, give tick-rate tiers (1, 2, 4 frames) by importance, and accumulate delta. Off-screen units don't update.
3. **Variety without draws**: per-instance tint and texture-array layer. Use `BatchedMesh` for heterogeneous static props.
4. **Damage numbers**: one instanced digit-sprite system (DRG:S), not text meshes or DOM.
5. **VFX**: pool everything (LE), prefer alpha-test or dither over blending for big effects, and cap trails.

#### Recommended three.js approach: WebGPURenderer + TSL
1. Read the VAT in `positionNode` with `textureLoad(vat, ivec2(vertexIndex, frame))`, indexing per-instance data by `instanceIndex` (instanced attributes or `instancedArray` storage).
2. A **compute pass** advances animation time, does frustum and importance culling, and writes an indirect or instanced count. Verify r180 support for indirect draws before relying on it.
3. Run GPU particles for damage numbers and VFX in compute (TSL particle examples).

#### Cost notes
- [INF] VAT memory is vertices × frames × 8 B (RGBA16F) per attribute. For example, 1,500 verts × 240 frames ≈ 2.9 MB for positions, plus the same for normals.
- [INF] Each `InstancedMesh` is one draw per type and material. 1,000 VAT units is mostly vertex cost, e.g. 1,000 × 1,500 verts = 1.5M vertices per frame. That is fine on desktop and heavy for integrated GPUs, so a trash-mob vertex budget of about 500–1,500 is advisable.
- [INF] Skinned units each cost CPU mixer work, a bone-texture upload and GPU skinning. Throttling cuts CPU work, not GPU skinning.

### Gaps
- No source was found for **Diablo Immortal crowd tricks** (Messiah engine), **D4 Infernal Hordes or monster-density rendering**, **PoE monster animation LOD**, **Lost Ark raid crowds**, or how **Vampire Survivors** renders thousands of sprites.
- three.js VAT performance on integrated GPUs and mobile in r180 is unmeasured; it needs a lab benchmark measured in frames, per lab practice.

---

## 8. Freely viewable talk recordings and slides: GDC Vault free videos, Diablo IV art/tech talks, ExileCon PoE2 tech, Sannikov, and D2R talk reports

### Takeaway
Several key talks are now tagged **"free content" on GDC Vault**:
- Kevin Todisco's D2R engineering talk.
- Dustin King's D2R art-direction talk.
- Drew McCrory's D2R accessibility talk.
- John Mueller's D4 art-direction talk ("The Pillars of Hell", GDC 2024).
- Aaron Aikman's D4 water talk ("H2O in H3LL", GDC 2024). Its page appears free but this was not 100% confirmed.
- Julian Love's D3 VFX talk (GDC 2013).

Erin Catto's D3 ragdoll slides with full speaker notes are a free PDF. Sannikov's PoE2 rendering talk sits inside the ExileCon 2023 Day 2 livestream, and only recaps exist. 4Gamer reported both D2R GDC 2022 talks in detail. No Japanese report of the D4 GDC 2024 talks was found.

### Cited Findings
- **Free on GDC Vault:**
  - "Resurrecting a Classic: Bringing 'Diablo II' into the 3rd Dimension", Kevin Todisco (GDC 2022). It covers building "a modern 3D engine to run on top of an inherently 2-dimensional game", reverse engineering the sprite world, and the custom PBR renderer. — [GDC Vault 1027672](https://www.gdcvault.com/play/1027672/)
  - "'Diablo 2: Resurrected': The Art Direction and Pipelines for Resurrecting Evil", Dustin King. — [GDC Vault 1027883](https://gdcvault.com/play/1027883/-Diablo-2-Resurrected-The)
  - "Modern Accessibility in Diablo II", Drew McCrory (Vicarious Visions), built around "Solve for one, extend to many". — [GDC Vault 1027864](https://www.gdcvault.com/play/1027864/Modern-Accessibility-in-Diablo-II)
  - "The Pillars of Hell: Achieving the Artistic Vision of 'Diablo IV'", John Mueller (GDC 2024), on 5 processes for a shared vision. — [GDC Vault 1034608](https://www.gdcvault.com/play/1034608/The-Pillars-of-Hell-Achieving)
  - "Technical Artist Bootcamp: The VFX of Diablo", Julian Love (GDC 2013). — [GDC Vault 1017660](https://gdcvault.com/play/1017660/Technical-Artist-Bootcamp-The-VFX)
- **Free PDF**: Erin Catto, Ragdolls (GDC 2012), with Diablo 3 speaker notes. — [box2d.org PDF](https://box2d.org/files/ErinCatto_Ragdolls_GDC2012.pdf)
- "H2O in H3LL: The Various Forms of Water in Diablo IV", Aaron Aikman, Lead Technical Artist, Graphics (GDC 2024, Technical Artist Summit).
  - Topics: shorelines, dynamically accumulating puddles, snow-covered rocks, Helltide rivers, icy caves, deferred-water trade-offs, and "avoiding distracting highlights caused by the fixed camera angle".
  - The Vault page carries a "free content" tag.
  — [GDC Vault 1034490](https://gdcvault.com/play/1034490/Technical-Artist-Summit-H2O-in); [GDC schedule](https://schedule.gdconf.com/session/technical-artist-summit-h2o-in-h3ll-the-various-forms-of-water-in-diablo-iv/901730)
- Other GDC 2024 D4 sessions exist: "Diablo IV: The Art of Open World Sanctuary". Its access was not verified (403). — [GDC schedule](https://schedule.gdconf.com/session/diablo-iv-the-art-of-open-world-sanctuary/899417)
- "Remastering a Classic: Diablo II: Resurrected", Robert Gallerani, covers controller support, uncapped framerate and QoL. Its access was not checked. — [GDC Vault 1028091](https://www.gdcvault.com/play/1028091/Remastering-a-Classic-Diablo-II)
- **4Gamer report of the Todisco talk**: — [4Gamer GDC 2022 graphics report](https://www.4gamer.net/games/554/G055460/20220324179/)
  - **Geometry**: terrain diamonds are 160×80 px. The camera is "tilted 30° downward", with an assumed camera distance of 883.88 ft, chosen so 800×600 fits when a 160 px tile is 10 ft. Object height is 24 px (0.577 yd).
  - **Content**: 2,416 fixed presets were rebuilt in 3D.
  - **Pipeline**: a "translator" turns the original data into more than 7,500 JSON files. Todisco "would probably not use JSON again".
  - **Order of work and toggle**: terrain first, then characters and objects, then lighting and effects. A legacy toggle key switches to the original view.
- **4Gamer report of the King talk**: the world team used **orthographic** cameras to find needed assets ("数十万", i.e. hundreds of thousands of checks). Fog overlays were **hand-placed** for atmosphere. A "lighting array" tool compared original, in-progress and other teams' footage side by side. The 70/30 rule also applied to animation. — [4Gamer GDC 2022 art report](https://www.4gamer.net/games/554/G055460/20220326013/)
- **ExileCon 2023**: Sannikov's talk on rendering PoE2 had "a large focus on re-using resources to get graphical uplift without increasing the resource costs (in terms of RAM or Processing power)". It also explained how background elements are blended into the floor and how animation blending is smoothed. — [Maxroll ExileCon wrap-up](https://maxroll.gg/poe/news/exilecon-wrapup-new-guides-and-expansion)
  - The recap embeds a YouTube video that resolves to "ExileCon 2023 – Day 2 – Live Stream". The talk is inside the livestream; no timestamp was found. — [YouTube XE3MAFGDzWw](https://www.youtube.com/watch?v=XE3MAFGDzWw)
- A search for a 4Gamer report on the Diablo IV GDC 2024 talks found none. The results showed only D4 season interviews. — [4Gamer D4 special index](https://www.4gamer.net/games/484/G048448/index_special.html)

### Inferences
- [INF] The 30° figure matches the 2:1 tiles. An orthographic camera pitched down by θ turns ground squares into diamonds with height/width = sin θ, and 80/160 = 0.5 gives θ = 30°, with 45° yaw. The lab's "2:1 iso" camera should therefore use a **30° pitch**, not the 35.264° of true isometric. The 883.88 ft distance matters only for D2's optional Perspective mode, since `NoPer` allows or forbids it per level.
- [INF] Suggested watch order for filling the remaining gaps:
  1. **Todisco** (D2R): light radius, darkness, LOS and wall transparency in 3D, and 2D↔3D height reconciliation.
  2. **Love** (D3 VFX): readability, telegraphs and death effects.
  3. **Aikman** (D4): fixed-camera specular control and deferred water, directly relevant to the lab's water and wet looks.
  4. **McCrory** (D2R accessibility): labels, contrast and options.
  5. **Mueller** (D4 process).
- [INF] Catto's PDF already yields concrete corpse and gore rules (§5). The other talks are video-only and were **not watched** in this round, so their contents beyond the abstracts are unknown.

### Gaps
- Talk contents beyond abstracts (Todisco, King, McCrory, Mueller, Aikman, Love) are unverified because they are video only. No slides PDFs were located on GDC Vault.
- The Inara.cz article "Rendering Path of Exile 2" returned 503 twice and was not read: https://inara.cz/morps/article/31103
- No timestamp or transcript was found for Sannikov's ExileCon segment, and no other Sannikov videos were checked within budget.
- **Inven (Korean)** coverage of D2R or D4 talks was not searched; the budget was exhausted. The 80.lv and Digital Foundry D4 and PoE2 frame analyses were not searched either.
- No RenderDoc or frame-analysis write-up of D4, PoE2, D2R or Last Epoch was found. The single search for a "Behind the Pretty Frames"-style D4 article returned nothing.

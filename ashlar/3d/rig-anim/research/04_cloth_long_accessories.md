# 04 — Cloth, long garments and loose accessories for LBS game rigs

Research note for the ASHLAR rigging skill (Blender 5.2 → glTF 2.0 → three.js).
Runtime constraints: linear blend skinning (LBS), max 4 influences per vertex, no
constraints/drivers/physics in glTF, clips baked to bone keys.

Confidence tags: **official** = vendor/standards doc; **talk** = conference talk or
its abstract; **paper** = peer-reviewed/preprint; **forum** = community post; 
**inference** = our own reasoning, not sourced.

Research limits (read first):
- The VRMC_springBone spec was read directly. The three-vrm spring bone package
  license could not be confirmed (npm page returned HTTP 403; the repo page shows no
  license text).
- No public source was found for Diablo IV, Path of Exile 2 or Genshin Impact cloth
  bone counts or cloth method. Those sections are marked as gaps.
- Blender add-on Blender 5 compatibility comes from store listings and reviews; it
  was not tested here.

---

## 1. Runtime spring bones on glTF / three.js

### 1a. VRMC_springBone 1.0 — fields

Source: VRM spec, `VRMC_springBone-1.0/README.md` — https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_springBone-1.0/README.md (**official**, read directly)

Joint properties (`springs[*].joints[*]`):

| Property | Type | Meaning (spec wording, paraphrased) |
|---|---|---|
| `node` | int | target node index |
| `hitRadius` | float, meters | collision size of the joint (sphere) |
| `stiffness` | number ≥ 0 | "rigidity", force returning to the initial pose |
| `gravityPower` | (type cell blank in spec) | gravity strength, applied every frame |
| `gravityDir` | float3 | gravity direction; example `[0,-1,0]` |
| `dragForce` | float 0–1 | deceleration of the spring motion |

- The spec gives **no default values** for any joint property.
- Gravity is `gravityDir × gravityPower × dt`, in **world space** (spec says this
  regardless of `center`).

Colliders (`colliders[*].shape`), one of:
- `sphere`: `offset` (float3, local to the collider node), `radius`.
- `capsule`: `offset` (start-side semicircle centre), `tail` (end-side centre), `radius`.
- Radii have **no stated units** in the spec; offsets are in the target node's local space.

Solver (spec calls it **non-normative**, "simple physics simulation using verlet
integration"):
1. Next tail position = current + displacement since last frame × (1 − `dragForce`),
   plus stiffness term and gravity term.
2. Length constraint: tail pulled back to bone length from its parent joint.
3. Collision: distance from collider surface to tail minus collider radius minus
   `hitRadius`; if negative, push the joint out and re-apply the length constraint.

Implication for us: `dragForce` is a 0–1 damping (use 0.3–0.6 for skirts, inference);
the spec has no tuned numbers, so any value we ship is **inference**.

### 1b. Can `@pixiv/three-vrm` spring bones run on a plain glTF?

- Package: `@pixiv/three-vrm-springbone`, "Spring bone module for @pixiv/three-vrm"
  — https://github.com/pixiv/three-vrm/tree/dev/packages/three-vrm-springbone
  (**official** repo; read directly). The README does not say whether it needs a
  `VRM` instance or can run on arbitrary `Object3D` bones; it only says it is a
  module of `@pixiv/three-vrm`. **Unverified for non-VRM glTF — needs a test.**
- Licence: a search snippet of the npm listing read as MIT
  (https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3.5.2/README.md, **forum-level**; the
  snippet was garbled). Treat as **unconfirmed** until `package.json` is checked.
  The npm page itself returned 403 to our fetcher.
- Per-frame cost and known issues: **no benchmark found**. A search turned up one
  academic paper that benchmarked three-vrm overall, not spring bones specifically
  (**paper**, no numbers retrieved). Community troubleshooting describes hair flying
  up or sticking out, usually from collider sizing and scale
  (**forum**, unverified).
- Practical note: the solver is a per-joint verlet loop over a handful of bones; for
  ≤ a few hundred joints per character the cost should be negligible (**inference**).
  Measure before committing.

Alternative (hand-written verlet): ~100 lines of TS/JS; it is what our skill would
need if three-vrm does not accept generic bones. Use the VRM spec's solver above as
the reference (**official** definition of behaviour).

### 1c. Shipped-game practice

- **Path of Exile (original, not PoE2):** a developer interview says the cloak physics
  was a custom engine built with performance as the top priority; simulated cloaks
  wrapped around heads, tangled in limbs and flapped during fast attacks, and the team
  found non-physical constraints hard to make robust (**talk/interview**, 
  https://www.gamebanshee.com/k968q). Relevant lesson: free-running cloth needs
  collision and clamping, or it fails visibly.
- **GDC 2024, EA "Warp: High Fidelity Cloth Simulation"** (GPU cloth for Frostbite,
  jerseys/shorts) — https://www.gdcvault.com/play/1034184/Warp-High-Fidelity-Cloth-Simulation
  (**talk**, title only read; no bone counts retrieved).
- **GDC schedule, "Neural simulation of skeletal physics"** (SoftMax), claims
  secondary physics for hair, cloth and accessories on many characters at about
  0.02–0.13 ms on one CPU core — https://schedule.gdconf.com/session/softmax-neural-simulation-of-skeletal-physics/915222
  (**talk**, claim from abstract; not verified).
- **Diablo IV, Path of Exile 2, Lost Ark, Genshin Impact:** **no source found** for
  baked vs runtime cloth or bone counts. Our searches returned nothing usable.
  Gap — would need GDC Vault search for those titles or dataminer write-ups.
- **Forum (Polycount):** a developer ran cloth offline, looped it, and constrained
  skeleton bones to the baked result, to avoid runtime PhysX cost in an MMO
  (**forum**, https://polycount.com/discussion/comment/1418462). This is the same
  "bake then drive bones" pattern we use.

---

## 2. Skirt and long-robe rigs for LBS games

### 2a. Chain counts and bone counts
- **No official source** gives radial chain counts by skirt length.
- Our own rule set (3–6 chains, front/back/left/right) is **inference**. Forum rigs
  commonly use one chain per side plus front/back for short skirts; longer robes add
  rings (**forum**, see 2b sources).
- Bone budget context: Unity's older manual says keep bones near 30 on mobile
  (https://docs.unity3d.com/520/Documentation/Manual/ModelingOptimizedCharacters.html,
  **official but old**). Community reports ~100–120 bones on one on-screen character
  working on iOS (https://www.tech-artists.org/t/next-gen-console-bone-limits/3949,
  **forum**). Skirt bones are a small fraction of that; a 4×4 skirt is ≈ 16 bones
  (**inference**).

### 2b. Leg-driven techniques (what people actually do)
Sources: Blender Artists threads — all **forum**:
- Drivers copying both thighs' rotation, summed: works until both legs move the same
  direction and the rotations stack, so the skirt rises twice as high. Proposed fix:
  respond differently to forward and backward bend — https://blenderartists.org/t/skirt-rig-with-drivers-not-working/675134
- Copy Rotation constraints per leg: only one constraint took effect; poor match —
  https://blenderartists.org/t/skirt-rigging-problem/670900
- Limit Distance constraints between skirt bones and leg (an untested suggestion, based
  on a known skirt tutorial) — https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573
- Thigh-linked "marker" bone that Damped Tracks the knee so the skirt does not pick up
  thigh twist; stretch-to on front/back skirt bones — https://blenderartists.org/t/how-do-you-rig-weight-paint-a-short-skirt-properly/1376331
- Puppet pins on each side plus two vertical tail chains parented to the hips, for
  legs-crossing walk cycles — https://rainboxprod.coop/forum/viewtopic.php?p=2822

Common failure modes reported: legs crossing, double-counted rotation, perimeter
changing when a leg lifts (scaling does not fix it, per one commenter).

### 2c. Hem perimeter when a leg lifts
- No authoritative source. The forum consensus is that the fix is a **shared hip/thigh
  driver with a clamp**, not a larger skirt. (**forum**)
- Our rule (**inference**): the skirt root is driven 50/50 from both thighs, and the
  **hem ring is kept by a length constraint in the sim** (bone lengths fixed in the
  bake). Because the bake holds bone lengths, the perimeter stays constant in
  the exported keys; the mesh only deforms by weights.

### 2d. Weighting between neighbouring chains
- No source gave numbers. Common practice (**forum**): a ~1–2-vertex overlap band
  between chains, with weights falling off linearly.
- Inference: 2-ring overlap of 10–20 % of the chain's span, weights ramp
  linearly, sum to 1 per vertex, max 4 influences (the glTF/LBS limit).

### 2e. Export without constraints (bake)
- glTF carries no constraints; any Damped Track / Copy Location must be baked.
- Blender `bpy.ops.nla.bake`: `visual_keying` writes keys from the final transformed
  result (constraints applied); `clear_constraints` removes constraints during the
  bake; `bake_types` = POSE for bones; `clean_curves` (4.2+) removes redundant keys.
  Source: https://docs.blender.org/api/4.2/bpy.ops.nla.html (**official**).
- Practical: bake once per clip, then remove the constraint rig before glTF export.

---

## 3. Cloth simulation baked to bones in Blender

### 3a. Technique
- Simulate on a proxy (cloth modifier or a cage mesh), then have helper empties or
  bones follow proxy vertices with Copy Location / Damped Track, then bake the rig's
  bones with `nla.bake` + `visual_keying` (**inference** from the nla.bake doc above;
  the doc does not describe cloth). Bake one clip at a time.
- Forum precedent: offline cloth → loop → bones constrained to the baked result
  (https://polycount.com/discussion/comment/1418462, **forum**).

### 3b. Add-ons and Blender 5 compatibility

| Add-on | Licence | Blender 5 status | Source |
|---|---|---|---|
| Wiggle 2 (original, shteeve3d) | not verified | not verified | — |
| Wiggle 2 RTX (Chamiseul fork, v2.2.5) | GPL-3.0-or-later (listing) | listed 4.2+; project says 5.0/5.1 compatible; a 5.1.x UI bug report | https://extensions.blender.org/add-ons/wiggle-2/ (**official store**) |
| Wiggle Bones (Hans_Xwh, v1.0.1) | GPL-3.0-or-later (listing) | requires 4.5 LTS+; aims at 5.0; one 5.2.0 install error in reviews | https://extensions.blender.org/add-ons/wiggle-bones/ (**official store**) |
| Bonedynamics Pro (morelewd) | listed GPL (Superhive) | listed 4.2–5.2; $15 freelance / $50 studio; reports of Auto Rig Pro conflict | https://superhivemarket.com/products/bonedynamics (**store**) |
| Spring Bones (artellblender) | no licence found | original reported broken on 5.0; a fork supports 5.0 | https://github.com/artellblender/springbones , https://cgdivetest.super.site/tools/spring-bones (**forum/blog**) |
| SpringFX (Auron3d) | not found | requires Blender 5.1+ | https://superhivemarket.com/products/springfx/docs (**store docs**) |
| Pegaso Springify | not found | listed 3.0–4.4 only | https://superhivemarket.com/products/pegaso-springify-automatic-bone-movement-without-physical-simulation/docs (**store**) |

Recommendation (**inference**): for shipping, do not depend on a store add-on in the
asset pipeline. Our skill should bake with its own Python (pipeline.py) and use an
add-on only as a reference. Licence check is needed before copying any code.

---

## 4. Many separate strips (coat tails, tassels, chain links, hair clumps)

No source gave a per-strip bone budget or a merge rule. These are **inference** unless
noted.

- **One chain per strip** when the strip is ≥ 2× as tall as it is wide and has a
  visible gap to neighbours; **merge into one chain** when neighbours are < ~1 vertex
  apart or move together (e.g. 3 adjacent tail flaps → one fan chain with 3 sub-chains
  sharing a root).
- **Budget** (inference, to be checked on target hardware): tails/flaps 1 bone each
  for flaps (animator control), 2–3 bones for hanging chains; tassels 1 bone per
  cluster; long hair 3–5 bones per clump, and total accessory bones ≤ ~15 % of
  the character's bone count.
- **Spacing:** equal length is what the VRM solver assumes (length constraint on the
  bone), so **equal length along the strip** is the default. Use curvature-based
  spacing only for a static pose-to-pose bake check (**inference**).
- **Bleed into next strip:** weights per vertex are ≤ 4; when strips touch, give each
  vertex max 2 bones (its own strip + one neighbour), and paint a hard 0-weight gap of
  ≥ 1 vertex ring between strips where the mesh allows (**inference**; the LBS
  limit is official, the rule is ours).

Unity QualitySettings: the project-wide cap is One/Two/Four Bones or Auto; more than 4
bones per vertex needs GPU compute skinning and may fall back to CPU on some platforms
(https://docs.unity3d.com/2023.2/Documentation/ScriptReference/QualitySettings-skinWeights.html,
**official**). So the 4-influence limit is confirmed as the practical ceiling.

---

## 5. Layered cloth (outer robe over skirt, cape over back)

Sources:
- Abdrashitov et al., SIGGRAPH Asia 2023 (robust skin-weight transfer for
  non-skin-tight garments): two-stage transfer — copy weights only where the source is
  confidently known, then fill — https://www.dgp.toronto.edu/~rinat/projects/RobustSkinWeightsTransfer/preprint.pdf
  (**paper**); code https://github.com/rin-23/RobustSkinWeightsTransferCode (**paper code**).
  Their baseline: commercial tools mostly use closest-point transfer.
- Reallusion Character Creator manual, cross-generation clothing: Hide Mesh, Conform
  (penetration fix), Transfer Skin Weight, Manual Edit, Fit Body Shape
  (re-weight, resolves penetration) — https://manual.reallusion.com/Character-Creator-4/Content/ENU/4.0/08_Cloth/Dressing_Characters_of_Different_Generations.htm
  (**official product doc**).
- Polycount practice: bind nude base first, then weight-transfer layer by layer from
  bottom to top, fixing errors per layer; problems come from incompatible topology
  between layers — https://polycount.com/discussion/comment/2738481 (**forum**).

Applied rules (**inference** unless noted):
- Bind **inner layer first**; transfer outer-layer weights from it, then edit.
- Outer layer offset along normals ≈ 1–2 cm (scale with character height) so the
  outer robe does not z-fight the skirt. No source for the number.
- For a cape: weights on a vertical ramp from the shoulder to hem; the cape should
  not share vertices with the body (separate mesh, no bridging).
- Check penetration on the animator poses in QA §6.

---

## 6. QA for cloth rigs

Poses/clips (**forum/inference**, no standard set found):
- crouch, stride (wide), high kick (≥ 90°), sit, run, stop-and-turn, attack swing.
- Lean forward 30° and back 30°.

Metrics (**inference**; no published thresholds found):
- Leg-into-skirt penetration: count vertices of the skirt inside a leg capsule
  (radius ~ thigh girth) per frame; threshold 0.
- Hem stretch: hem perimeter / rest perimeter; allow 0.95–1.05.
- Inter-layer penetration: count outer-layer vertices closer than 0.5 cm to the inner
  layer; threshold 0 at the 5 key poses.
- Pass rule: all three metrics pass on every QA pose; any fail goes back to weights.

---

## Recommended rules for our skill

Each item tagged **[sourced]** (source given above) or **[inference]** (ours).

1. Runtime spring bones: design the joint data to match VRMC_springBone fields
   (`stiffness`, `gravityPower`, `gravityDir`, `dragForce`, `hitRadius`) so we can swap
   to three-vrm later. **[sourced: spec field names]**
2. Do not ship three-vrm code until its licence and non-VRM support are confirmed.
   **[inference]**
3. Default solver for accessories = our own ~100-line verlet, using the VRM solver
   steps. **[inference]**
4. Skirt/robe: 4 radial chains (front, back, left, right) for a short skirt; 6 for a
   long robe, adding side-seam chains. **[inference]**
5. Skirt chain length: 3 bones per chain for short skirt, up to 6 for floor-length.
   **[inference]**
6. Skirt root driven 50/50 by both thighs (Copy Rotation). Clamp total rotation to
   ±45° per leg before adding; avoid summing two equal drivers blindly (the stacking
   bug above). **[sourced: forum failure mode; clamp value inference]**
7. Hem perimeter: keep bone lengths fixed in the bake; never scale the skirt to fit a
   lifted leg. **[sourced: forum notes scaling fails; rule inference]**
8. Neighbour chains overlap by 1–2 vertex rings, weights ramp linearly, max 4 influences
   per vertex. **[sourced: 4-influence cap, Unity official; overlap width inference]**
9. Cape: 3–5 bone chain, vertical weight ramp shoulder→hem, separate mesh, no body
   bridging. **[inference]**
10. Flap / separate coat tail: 1 bone, animator control. **[inference, matches our
    current rule]**
11. Hanging chains, tassels: 1 bone per link cluster, 2–3 bones per hanging chain.
    **[inference]**
12. Accessory bones ≤ 15 % of total character bones; mobile target ≤ ~30 total
    bones per character for the 3-chain budget, but check the 100–120 forum figure on
    real hardware. **[sourced: Unity old manual 30; forum 100–120; split inference]**
13. Bake: `nla.bake` with `visual_keying` and `clear_constraints`, one clip at a time,
    then remove the constraint rig before export. **[sourced: nla.bake doc]**
14. Layered cloth: bind inner layer first; transfer outer weights from it; outer
    offset 1–2 cm along normals (scale with height). **[sourced: layer-by-layer practice;
    offset inference]**
15. QA poses: crouch, stride, high kick ≥ 90°, sit, run, lean ±30°, attack swing.
    **[inference]**
16. QA metrics: leg-capsule penetration = 0; hem perimeter 0.95–1.05 × rest; inter-layer
    penetration < 0.5 cm = 0 vertices. **[inference]**
17. Do not use a store add-on in the shipping pipeline; use it as reference only, and
    check licence first. **[sourced: licence/compat table; decision inference]**
18. Open gap: research Diablo IV / PoE2 / Genshin cloth methods and bone counts via
    GDC Vault before finalising budgets. **[gap]**

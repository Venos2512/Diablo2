# Long clothing and hanging accessories (S3g, S4–S7)

Sources:
- `ashlar/3d/rig-anim/research/04_cloth_long_accessories.md` (spring-bone fields, bake, layering, QA ideas);
- `research/00a` §4.2–4.4 and `00b` §6 (bake cloth to bones; never run cloth sim at runtime on low-end targets);
- FL hand rig `ashlar/3d/heroes/FL_flagellant/vA/rig/` (`REPORT.md`, `rig_brief.md`). It has skirt bones (front 6, back L/R 5,
  side L/R 4) but they are **unweighted**: a static one-layer skin tore 114 edges in a deep crouch (failure-catalog #6);
- D01 (sack, loincloth flap; failure-catalog #1, #5);
- `research/05a_cloth_industry_engines_tools.md` (shipped games, engines and plugins, licences);
- `research/05b_cloth_papers_opensource_blender.md` (skinning decomposition, Dem Bones, RSWT, XPBD, Blender bake, QA metrics).

**Evidence status (05a/05b, 2026-10-23).**
- No public source gives chain counts, bones per chain or a leg-driver rule from a shipped game. FFXV, FFXVI, Destiny, Ghost of
  Tsushima and Warframe give methods only, not numbers.
- Sourced:
  - the 4-influence limit (Unity official);
  - Kawaii Physics' leg handling: `BoneConstraint` keeps a distance between skirt and leg bones, and `SyncBone` feeds animated
    leg bones into the simulation (official doc, MIT);
  - the Warframe syandana rules: simple weight behaviour, no rigid panel in the middle of a cloth chain (official guide);
  - the licences: three-vrm spring bone is MIT, Kawaii Physics is MIT, Dem Bones is BSD-3.

**Labels.**
- Every other number below is **inference** and P5 calibrates it.
- The 4-influence limit is a hard runtime fact.
- Constraints, drivers and physics never reach the game.

## 1. Decisions

1. **The rig gives every long garment bones.** Static body skin is only for tight clothing. Anything that hangs free or bridges
   the legs gets **chains of deform bones** that are FK under the control rig.
2. **Motion of those bones is not the rig's job.**
   - The rig's job is the chains, their weights and a control layer that pushes cloth out of the legs' way (§4).
   - Secondary motion (swing, follow-through) is added in the animation session. The default is a cloth or spring simulation
     baked to the chain bones at R8 with `nla.bake(visual_keying=True, clear_constraints=True)`, one clip at a time
     [research/04 §2e, §3a].
   - Two bake routes for R8:
     - (a) Blender cloth sim on the garment, helper empties on proxy vertices, bones that track them, then `nla.bake`
       [05b §5b, forum-level; test on 5.2];
     - (b) **Dem Bones** (EA SEED, BSD-3, header-only C++ SSDR) fits the sim frames to our fixed chain bones and weights, or
       proposes extra virtual bones [05b §1b]. Report the per-frame mean and max vertex error (MAE / MXE) of every bake [05b §6].
   - Runtime spring bones in three.js are an integration option (`game-animation-integration`), not a rig requirement.
     `@pixiv/three-vrm` spring bones are MIT [05a, package.json + LICENSE]. Whether they run on a plain glTF skeleton is untested,
     so test it before planning on it. A small XPBD/verlet chain solver is the fallback [05b §4a].
   - **Leg collision in the sim or runtime** follows the closest shipped reference, Kawaii Physics: capsule colliders on the
     legs, a minimum distance between skirt bones and leg bones (`BoneConstraint`), and the animated legs fed into the
     simulation (`SyncBone`) [05a §2b, official doc]. The leg-push driver (§4) is a **pre-bake aid** for animators and QA, not the
     final motion.
3. **The rig records spring hints.**
   - Each chain in `chains.json` stores hints under the VRMC_springBone field names (`stiffness`, `gravityPower`, `gravityDir`,
     `dragForce`, `hitRadius`), plus capsule colliders on the legs and torso and a minimum skirt-to-leg distance per chain root
     [field names sourced: research/04 §1a].
   - Starting values: stiffness 1.0, dragForce 0.2, gravityPower 0.2, hitRadius 0.02 × H/1.8 m [05a §2h; VRM tool defaults,
     forum-level].
   - Never copy numbers across engines; units and meanings differ [05a §8.6]. Calibrate on our rig with the §6 poses.
   - The hints never enter the GLB in this phase.
4. **No store add-on in the pipeline.**
   - Every step is the skill's own code; add-ons are references only.
   - GPL add-ons (Wiggle 2, Wiggle Bones) must not be copied into the tree [research/04 §3b, 05b §5c].

## 2. Garment classes (S3g classifies, the user or Opus confirms)

| Class | What it is | Detect | Bones |
| --- | --- | --- | --- |
| `tight` | shirt, trousers, straps, tight bodice | cloth within ~1.5% H of the body surface | none, body skin |
| `skirt` | robe or skirt that bridges the legs below the crotch | S1 `cloth_bridging` + cloth ring around both legs | ring of radial chains (§3.1) |
| `strip` | free coat tail, flap, apron panel, tabard, loincloth (tà áo) | hangs down from an attachment line, free on its other sides, height ≥ 1.5 × width or slits on both sides | one chain per strip, or a merged fan (§3.2) |
| `cape` | cape, cloak, back panel from the shoulders | hangs behind the torso from the shoulder or neck line, below mid-back | 1–3 chains across its width (§3.3) |
| `cluster` | tassels, bead strings, chain links, charms on a cord | a line of small islands or a thin cord | one chain along the cord; small items rigid to their chain bone (§3.4) |
| `sleeve` | wide or bell sleeve hanging below the arm | cloth below the forearm or upper arm, beyond 1.5 × limb radius | arm skin; one 1–2-bone chain only if it hangs > 8% H below the arm |
| `hair` | long hair or braid from the head | hangs from the skull below the neck line | `main_hair_*` chains, 3–5 bones per clump |
| `rigid_hanging` | lantern, flask, pouch, scabbard on a belt or strap | a rigid island attached at one small area | rigid to its parent. A one-bone `<item>_swing` only if the item hangs > 5% H below its attachment and the brief keeps it |

- Classification runs on welded topology after S3, because it needs the body landmarks: legs, pelvis, spine, shoulders.
- Report a confidence for every piece. Pieces below 0.6 go to the flag list and the G2 sheet.
- The brief or `--garments <json>` overrides a class, a chain count, a merge or a disable (§7).

## 3. Chain placement

General rules:
- **Joint positions:** along the piece's **medial curve**, which is the centroid of each cross-section of the piece taken
  perpendicular to its hanging direction. Put the joints at mid-thickness of the cloth, not on its surface.
- **Spacing:** equal arc length from the attachment line to the hem, so bone lengths are equal. Spring solvers assume fixed bone
  lengths [research/04 §4].
- **Bones per chain:** `n = clamp(round(L / (0.09 H)), 1, 6)`, where L = the **free length** of the piece: the arc length from
  the line where the cloth leaves the body to the hem. The root still sits on the attachment line, but the part of the piece
  lying on the body does not count (G1 2026-10-23: D01's back flap measured from the belt top got 2 bones; the free length gives 1). Floor-length robes on H = 1.8 m
  get 5–6 bones, a knee-length flap 2–3.
  - This is **inference only**: no source gives a bone-length rule [05a §8.2].
  - P5 replaces it with a measured error-vs-bone-count curve: fit a simulated clip with Dem Bones at 2–8 bones per chain and
    keep the knee of the curve [05b §7].
- **One material and one behaviour per chain** [05a §4, Warframe official guide]:
  - Where a chain meets a material change (`mesh.npz` `mat`) or a rigid panel (buckle, plate, bead) partway down, end the chain
    there or make the panel rigid on one chain bone.
  - Never let a rigid panel sit in the middle of a soft ramp.
  - Weights must change monotonically along a chain.
- **Hinge / roll:** local X lies along the hem tangent, so a positive X rotation swings the cloth outward, away from the body.
  Record a bend test for the root of every chain, as for core bones.
- **Names:**
  - Prefix `L_`/`R_` on any chain whose root is off the midline by more than 1% H; centred chains have no prefix.
  - Number bones `_01` at the root down to the hem. Classes use `skirt`, `tail`, `cape`, `charm`, `main_hair`, `<item>_swing`.
  - Examples: `skirt_F_01`, `skirt_B_03`, `L_skirt_S_02`, `L_skirt_FS_01`, `R_tail_2_01`, `cape_C_01`, `L_cape_02`, `charm_1_02`,
    `main_hair_1_03`, `lantern_swing`.
  - Every `L_` chain needs an `R_` partner unless the garment is asymmetric. The plan states the asymmetry.
- **Parents:**

  | Chain | Parent |
  | --- | --- |
  | skirt, strip and cluster roots on the belt | `pelvis`; a belt above the pelvis box uses `spine_01` |
  | cape | `chest`; a neck-tied cape uses `neck` |
  | hair | `head` |
  | sleeve | the forearm or upper arm it hangs from |
  | rigid_hanging | the bone of its attachment |

### 3.1 Skirt ring

- **Radial chains** (inference; 05a found no shipped counts, and a practitioner example uses 6 bones per skirt):
  - **4** by default: F, B, L_S, R_S;
  - **6** for a full robe from the knee down: add L_FS and R_FS, or L_BS and R_BS where the cloth is fuller;
  - **8** only for a floor-length **and** multi-layer or very wide skirt, where the hem circumference is over 2.5 × the
    hip-to-hip width.
- Place the chains at even azimuth around the pelvis axis, then snap each one to the nearest slit or panel centre if one lies
  within 15°.
- **The root sits on the attachment line** (belt or waist), not at the hip joint.
- **No thigh weights on the skirt.** The legs move the cloth through the control layer (§4), so the leg never stretches the cloth
  itself; that stretching is what tore FL.

### 3.2 Strips (coat tails, flaps, panels)

- One chain per strip.
- Merge neighbours into one **fan** (one root, sub-chains from bone 02) when their gap is under 2% H or under two edge rings along
  more than 60% of their length, so they move as one.
- A strip keeps its own chain only if it is at least 2% H wide and has **at least 8 welded rows per planned bone**. Otherwise it
  merges into the nearest strip or becomes rigid. This replaced a fixed 40-row minimum, which nearly removed FL's 0.66 m apron
  (44 rows; G1).
- Chains of one piece must not cross. The planner checks that no two chains of a piece cross, measuring the minimum distance
  between their joint polylines, and keeps the azimuth order the same at every level. If two chains cross, it reorders or
  merges them and flags the piece.
- A short flap (L < 6% H) gets one bone with an animator control, like D01's `loincloth_front`.

### 3.3 Cape

- Width under 25% H: one centred chain.
- Wider: three chains (C, L, R).
- The root is on the shoulder or neck line. The top band blends `chest` → root over the shoulder rings.

### 3.4 Clusters (beads, tassels, chains)

- One chain along the cord.
- Each bead or charm island is 100% on its nearest chain bone (rigid island rule).
- The cord ramps between bones.
- Bones are spaced by cord length, with at most one bone per two items.

### 3.5 Budget

- **Aux deform bones per character:** at most `aux_budget`, which defaults to **32** for H and S. The family template sets the
  family limit (H 30–60 total, `SKELETON_STANDARD.md` §1) and the brief may lower it.
- **When over budget, the planner trims in this order:**
  1. merge strips;
  2. cut the bones per chain down to 3;
  3. drop diagonal skirt chains (8 → 6 → 4);
  4. make clusters rigid;
  5. drop swing items.
- Report every trim.

## 4. Control layer (S5): legs push the cloth

Each skirt chain root and each strip root hanging in front of or behind the legs gets a **leg-push** driver on its control bone,
replacing "Copy Rotation 0.5 from each thigh".

- **The rule:** for a chain at azimuth φ (0° = front, 90° = the character's left), the root swings outward by the part of each
  thigh's swing that points **toward the chain**:
  `angle = clamp(Σ_leg w_leg(φ) · max(0, swing_leg · dir(φ)), 0, 60°)`.
  - Front chains react to hip flexion and back chains to extension, so a squat lifts the front of the skirt and leaves the back
    hanging.
  - Side chains react to abduction of their own leg.
  - `w_leg(φ) = 0.5 ± 0.35 · sin φ`: 0.5/0.5 front and back, 0.85/0.15 for the same-side leg.
- **Why not plain Copy Rotation:** summed or stacked rotations double-count when both legs move the same way, and a back chain
  must not follow flexion [research/04 §2b, forum].
- **Status:** the driver and its 60° clamp have no shipped precedent [05a §8.3]. It is a pre-bake aid: animators see plausible
  cloth and the QA poses clear the legs. The final motion comes from the R8 sim or a runtime spring with leg colliders and a
  skirt-to-leg distance constraint (§1.2, Kawaii-style). Keep the driver simple, and remove it from the bake rig if the sim
  already handles leg collision.
- **Drivers read** each thigh's swing in its local space (TRANSFORMS, SWING components), like the twist drivers. They live only in
  the control rig. QA poses evaluate them; R8 bakes them into the clip.
- **Drape.** The bone after the pushed root counter-rotates by `−drape × angle` (default `drape` 0.75), so the cloth below the
  knee hangs toward gravity instead of flaring like a lampshade. Bones further down follow it.
  - **Why:** G3's FL sheets showed the robe flaring as rigid cones in `sit` and `deep_crouch` with the plain root push.
  - Clamp `max_deg` 80° for chains that face a leg (front, back), 60° for side chains.
  - Measure the effect with the §6 poses before changing the defaults.
  - **Inherited push (G6) inherits the drape (G7).** A bead string, strip or swing item riding on a pushed panel takes the
    panel's push about the panel's root.
    - **Drape bone:** among the item's bones whose head is **at or below** the panel's fold (the panel's bone-02 head, +1% H),
      the nearest to the fold takes the drape, about the panel's fold axis. If no bone qualifies, the lowest bone takes it.
    - **Drape amount:** the item's drape is `drape × fold_share`.
      - `fold_share` is the overlay's own blend (`skin_garment.along` on the rows' `t`): the share of chain weight on the panel's
        bone 02 and below, median over the 6 panel rows nearest the drape bone's head.
      - Down the panel that share only grows, so the item never folds more than the panel row beside it. Lower down it stands a
        little off the panel instead of sinking in.
      - Share 0 or not measurable: no drape bone.
    - **Why:**
      - With no drape bone, FL's beads turned 71° as a rigid rod at `sit` while the robe below the fold turned 18°, and stood
        10–24 cm off the robe.
      - With the full drape on the bead bone (head at z 0.616), the beads folded more than the robe beside it and sank up to
        3.5 cm into it: 71–98 faces at the five deep leg-push poses (review G r3 N1).
      - A z ramp between the bone middles gave 0.62, but the overlay blends in `t` (per-sector), where that row is only 0.20
        folded. With the z ramp the beads still sank by up to 1.4 cm (review G r4 F1).
      - FL: share 0.20, bead drape 0.15. Bead faces inside the robe at the leg-push poses are back to the rod/rest level (0, and
        19 at `hip_flexion_R_m120`).
      - **Accepted trade-off:** at the extreme poses the beads stand 4–5 cm further off the robe than at rest (`sit` +0.042 m,
        `deep_crouch` +0.046 m; the rod was +0.048 / +0.051 m). The scaled drape removes the clipping, not the stand-off, which
        stays close to the rod's. One drape joint cannot follow the robe's gradual fold; the R8 cloth or spring bake brings them
        back. G2 may ask for a second bead joint at the fold, or for skinning the beads as a layer of the robe.
- **Child chain bones are plain FK** under that drape offset, collection `Aux FK`. Fans add one control on the shared root.
- Capes and hair get no leg drivers. The cape root follows `chest` by hierarchy.

## 5. Skinning garments (S6 overlay)

Garment rows get their weights from a **garment overlay**, computed after the body candidates are chosen (S7 selection). Body
candidates A/B/C do not know the chain bones; their values on garment rows are replaced.

1. **Parameterize each piece:**
   - `t ∈ [0, 1]`: geodesic distance from the attachment line, divided by the local length. On a ring the length is measured per
     30° azimuth sector, so each tail of an uneven hem reaches 1 at its own hem (G1);
   - `φ` (skirt ring only): azimuth around the pelvis axis.

   Compute them on the outermost layer (see 4 below).
2. **Along a chain:** linear blend between the two bones whose joints bracket t. The top band from `t = 0` to half the first bone
   blends the parent bone into bone 01.
3. **Across the chains of a ring or a fan:** linear blend in φ between the two nearest chains of the **same panel**, never across
   a slit. A skirt row then has at most 2 chains × 2 bones = 4 influences, which is the LBS limit. Strips use only their own
   chain.
4. **Layers:**
   - When cloth layers overlap (outer robe over the inner skirt, cape over the back), compute weights on the outermost layer.
   - Copy them to the inner layers by closest point along the body normal, so the layers move together and cannot cross under
     LBS [research/04 §5, layered transfer].
   - The body under a garment keeps its body weights.
5. **Region lists:**
   - Each piece may take only its parent bone, its own chain bones and, for a ring, the neighbour chain of the same panel.
   - Fold forbidden weight into the nearest allowed bone **before and after** every smoothing pass (skinning.md §3).
   - **No weight may cross from one strip to another** (`garment_bleed` = 0).
   - Thigh, calf and foot weights on hanging cloth are forbidden. A tight upper band above the free line (the height where the
     cloth leaves the leg) may keep pelvis and spine weights.
6. **Transition band:**
   - **Where:** 2–3 rings at **every** junction between a garment piece and the body, not only the attachment line. Tripo
     robes are fused to the legs along their inner edges.
   - **Reach cap (G7, off by default):** `skin_garment.BAND_MAX_H` can limit outer band rows to a geodesic distance from the
     junction (tested at 0.05 H), and the blend then reaches 1 at the cap. Inner layers always keep the ring band. The default
     is `inf`, i.e. rings only.
     - **Why off:** on FL the 0.05 H cap moved only 28 → 25 far leg-weighted rows, but raised deep-crouch tears 154 → 168 and
       the worst stretch 10.7 → 20.3.
     - P5 calibrates it.
   - **Blend:** linear from the body weights to the overlay. Band rows keep their body bones, legs included; the "no leg weight"
     rule applies only where the overlay is complete.
   - **Then** full enforcement: top-4, prune, normalize, co-located duplicates.
   - **Check:** edge continuity. Across welded edges at the border and inside garments, the max weight jump must stay near the
     body-interior baseline.
     - The baseline leaves out rigid rows, rigid islands and edges between two rigid parts (G7).
     - The limit is `max(0.5, baseline p99)`, capped at 0.75. A body p99 of 1.0 made the gate vacuous.
   - **Why:** review r1 found 117 border edges on FL with no band; they tore in a deep crouch.
   - **Slits:** cut weights only where the slit really separates the cloth at that height.
   - **Inner layers:** interpolate from the outer surface, never copy single nearest rows.
7. **Rigid parts** (beads, buckles, rigid_hanging items) are 1.0 on their bone.

## 6. QA (S7)

**Poses** (extra family compounds; every one runs through the control rig, so the leg-push drivers act):

| Pose | Joints |
| --- | --- |
| `deep_crouch` | thighs −60°, knees 95° (FL brief) |
| `high_kick_L` | left hip flexion −90°, knee 0° |
| `sit` | hips −90°, knees 90° |
| `run_stride` | L hip −40°, knee 30°; R hip +20° |
| `lean_fwd` | spine_01 +30° forward |
| `lean_back` | spine_01 −30° |

The existing `squat`, `long_step`, `hip_abduction` and `twist` poses also count.

**Chain poses** (generated from the plan; they test weights, not the leg drivers). They are tagged `chain` + `extreme`, so they
never light a standard row. LBS cannot fold cloth, so a flare must stretch the hem (G6):
- every ring or fan flares together by +15° outward;
- each strip or cape root swings ±30°;
- each chain's middle bone swings +30°.

**Metrics:**

| Metric | Measure | Proposal |
| --- | --- | --- |
| `garment_limb_penetration` | leg or arm faces inside a garment piece, depth > 0.05% H (flood-filled, like body penetration) | standard poses 0; extremes reported |
| `garment_layer_penetration` | faces of one piece or layer inside another | 0 |
| `garment_hem_stretch` | hem loop length / rest, per piece | 0.95–1.05 (green), 0.9–1.1 (yellow) |
| `garment_torn_edges` | torn-edge rule restricted to garment regions | standard poses 0 |
| `garment_bleed` | weight of another piece's chain bones on a piece's rows | 0 |
| `garment_chain_coverage` | rows where each chain bone is dominant | at least 8 welded rows per bone, else merge the bone |

**Sheets:**
- a garment sheet: pieces coloured by class, chains drawn, confidence per piece;
- a cloth pose sheet in four views (front, side, 3/4, ARPG).

## 7. Overrides (`--garments <json>`)

`{schema: 0, aux_budget, pieces: {<piece id or "auto:<n>">: {class, chains, bones, merge_with, parent, disable, rigid}},
chain_names: {...}, spring_hints: {...}}`

Piece ids come from `garments.json`. Changing this file makes S4 and every later step stale; the pipeline fingerprint does this.

## 8. Not covered yet

- **Runtime spring bones in three.js.** `@pixiv/three-vrm-springbone` is MIT [05a]. It is not yet tested on a plain glTF skeleton.
  The fallback is a small XPBD/verlet solver.
- **Cloth simulation itself, and its bake.** These belong to the animation session (R8), using the chain bones built here:
  - Blender cloth with a pinned waist band and the body as collider;
  - or Dem Bones fitting [05b].
- **Calibration.** No public numbers exist for shipped games [05a §1, gap]. P5 calibrates every count and threshold above:
  - the bone-count sweep [05b §7];
  - the QA poses;
  - the Dem Bones fit error.
- **Not found anywhere** [05b gaps]: published slit/panel detection, medial skeletons for thin sheets, and a penetration or hem
  metric for garments. Our own methods in S3g and §6 are new and need the most review.

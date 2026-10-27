# Joint placement (S3–S5)

Sources:
- `ashlar/3d/rig-anim/research/03_game_rig_standards_lbs.md` §4 (anatomy);
- `research/02` §1–2 (methods and their accuracy);
- D01's `rig/tools/d01_rig_def.py` and `landmarks.json` (working implementation).

## Landmark sets

The family template lists the landmarks (`families/<F>.json`). Family H/S (no face):

| Centre | Per side (`_L`, `_R`) |
| --- | --- |
| `pelvis`, `spine_01`, `spine_02`, `chest`, `neck`, `head`, `head_top` | `clavicle` (sternoclavicular joint), `shoulder` (glenohumeral centre), `elbow`, `wrist`, `hand_tip`, `palm`, `hip` (hip joint centre), `knee`, `ankle`, `ball`, `toe_tip`, `heel_ground`, `ball_ground`, `toe_ground` |

Aux landmarks (helmet, sack, ears, flaps, skirt chain roots) come from the rig brief. Name them `<part>_head` and `<part>_tail`.

## Sources (each landmark needs at least two)

**a. Geometry on the mesh** (rigkit-env, on welded arrays)
- Limb axis: slice perpendicular to the provisional limb direction every ~1% H. The centroid of each cross-section loop gives the
  medial curve. Refit the direction by PCA of those centroids and iterate twice.
- Joint along the axis: wrist and ankle sit at a local minimum of perimeter. Elbow and knee sit at the bend of the medial curve. When
  the limb is straight, use the minimum of perimeter between the long-bone thirds, then the anatomical depth rule below.
- Depth: cast rays front↔back (and left↔right) through the candidate and place the joint at the rule's fraction of the chord.
- Shoulder: fit a sphere to the vertices of the shoulder cap (the upper-arm region within ~1.5 arm radii of the armpit fold); the
  centre is the glenohumeral joint.
- Spine: front/back chord at each height. The spine sits nearer the back (start at 60–65% of the chord from the front; verify on side
  shots). Pelvis at the height of the hip joint centres, chest at armpit level, neck at the base of the neck (top of the shoulders),
  head pivot at the skull base behind the ear line.

**b. Watertight proxy + embedding**
- For open or multi-island meshes: voxel remesh to one closed volume, then build a medial skeleton or a Pinocchio-style embedding of
  the family graph on it. Project the joints back by nearest medial point.
- Pinocchio got 13/16 clean models right, and only when "the mesh is the boundary of a connected volume" [research/02 §1.1].

**c. Anatomical priors** (sanity only; flag anything outside tolerance)
- H (Drillis–Contini fractions of H, **unverified**, tolerance ±0.05 H; stylized heroes may legitimately sit outside): ankle 0.039,
  knee 0.285, greater trochanter 0.530, acromion 0.818.
- S, measured on D01 (G2-approved, Blender Z / H): pelvis 0.370, hip 0.356, knee 0.220, ankle 0.096, chest 0.610, shoulder 0.668,
  neck 0.700, head pivot 0.744. Big head, short legs.
- Hip joint centre: Bell or Harrington regressions (axis errors 3–11 mm) only after fetching the coefficients from the originals; do
  not hard-code from memory.

**d. UniRig** (`E:\tools\unirig`, about 90 s per mesh)
- Gives 52 Mixamo-like joints named `bone_0…51`. Map them to standard names by hierarchy and position: hips = root of the tree;
  spine chain up; arm chains = the two lateral chains from the upper spine; legs = the chains from the hips. Never map by index.
- Known bias: elbows and knees perfectly straight, and no cloth bones. Use its positions as one vote; never take its chain shape.

**e. The user**
- Only for landmarks still in dispute after a–d and the vision check. They go on the round's single flag sheet, not one stop per
  joint.
- The user drags the `lm_*` empties; read them back by snapshot and diff (mcp-operations).

## Consensus rule [proposal, revised after review r1]

Resolve in this order:

1. **Plausibility gate per source.** A source is dropped for a landmark when it fails any of:
   - inside the mesh (winding number);
   - within 0.5 × local radius of the limb axis;
   - the prior band;
   - segment-length ratios (upper arm vs forearm, thigh vs shin);
   - L/R mirror consistency.

   If exactly one plausible source remains, accept it unflagged with confidence ≤ 0.6.
2. **UniRig is sanity-only where it has a known bias** until P5 measures that bias:
   - pelvis and hips (45–49 mm high on D01, Mixamo style);
   - spine_01 and spine_02 (they inherit the hip offset: D01 spine_01 52.6 mm high);
   - clavicle (Mixamo shoulder convention, not the sternoclavicular joint);
   - ankles.

   After P5, use bias-corrected UniRig positions, weighted 1/σ². When pelvis, spine_01 and spine_02 are all flagged, they share one
   "spine" tile. Once the pelvis is placed **and the chest is unflagged**, spine_01 and spine_02 are re-derived at 1/3 and 2/3 of the
   **straight** pelvis → chest line: source a's spine line follows coats and belts. Revisit at P5 with the spine-depth convention.
   A landmark whose source a fails only the segment-ratio gate is a counted tile of kind `ratio_disagree`, not vision-only. Its
   provisional position is UniRig's, and "mean" is offered with `gates_overridden: ["a.ratio"]`.
3. **Fuse the plausible sources** with a weighted mean when they agree within τ = clamp(max(f_class·H, 0.5·r_local), 0.6% H, 3% H), where r_local is the local limb radius and f_class is:
   - 1.5% for limb joints;
   - 3% for the spine, neck, head, chest and clavicle (convention landmarks);
   - 2% for tips and ground points.

   Default weights: a = 1.0, b = 0.7, d = 0.7; c (priors) only gates, it never moves a position.
4. **Opus vision check** on every remaining tile.
   - **Crops:** rendered by `rigkit/render.py` mode `flag_tiles`: front, side and top ortho at the `flags.json` crop, x-ray (~0.25)
     and solid. Markers a green, b orange, d blue, provisional red, on a 0.01 H grid, plus the mesh section outline through the
     provisional point.
   - **Decision record** in `vision_decisions.json`, one entry per landmark:
     - `choice` ∈ {a, b, d, mean, escalate}; never a free position;
     - `reason`: the anatomy row applied plus what the crop shows;
     - `evidence`: image paths, views, sha256;
     - `inputs`: sha256 of the landmark sources and `mesh.npz`, plus the chosen source position;
     - `gates_overridden`;
     - reviewer model, date, confidence.
   - **Stale decisions:** a decision is applied only while the chosen source stays within 0.25 τ of the recorded position;
     otherwise it is flagged as stale.
   - A landmark flagged only because UniRig is its single source gets a **vision-only flag**, which does not count toward the user's
     tiles.

5. **User flag sheet** only for what remains after the vision check (escalated tiles): L/R pairs on one tile, ordered by impact, **at most 6 tiles**. If more remain, the round
   is not ready for the user; fix the detectors instead.

**Interim rules until P5 (review r2):**
- **Boot ankle:** trigger on a perimeter step larger than `BOOT_EDGE_STEP` anywhere in [max(ball height + 0.02 H,
  flare − 0.03 H), flare + 0.03 H]. Wraps can create a false flare above the real instep, as on U01.
  - The geometry ankle is the instep crease on the leg axis: the most concave point of the front profile in the sagittal foot
    section, between the ball and the cuff, or between the ball and the flare when the step lies below the flare.
  - Confidence 0.45. Accept it if it agrees with UniRig within τ; otherwise vision decides.
- **Head offsets** scale with the measured head radius, clamped to 0.6–1.5× the starting radius. Lower the confidence when the
  pivot offset leaves 0.01–0.04 H.
- **Spine depth:** the geometry source uses 62–65% of torso depth from the front, while D01 G2 sits at 35–48%. Decide at P5 by S7
  belly and back deformation on tier-1 rigs, not by distance to G2.
- **Segment-ratio gates:** from `families/<F>.json` → `plausibility.segment_ratio`.

Store per landmark: `pos`, `sources{}`, `spread`, `decision`, `confidence`, `gates{}` (which source failed which test).

**Ground truth policy (review r1):**
- **Tier 1** (author rigs of CC0 characters) is the only data used to calibrate constants and tolerances. Score limb joints as
  along-axis error (% of the segment) plus radial error (% of the local radius), and the spine as distance to the GT spine curve.
- **Tier 2** (G2-approved rigs) is regression only: "not worse than the approved rig" on S7 deformation, with class tolerances of about
  2% H for fixed-anatomy landmarks (knee, hip, ankle) and 3–4% H for convention landmarks. Keep a per-asset errata list. For D01 the
  wrist sits 24–26 mm inside the hand, the elbow sits in the forearm bulge, and `head_top` is the bone tail inside the helmet. Never
  tune constants to G2.

## Anatomy rules for game rigs (body)

| Joint | Rule |
| --- | --- |
| Clavicle | Bone from the sternoclavicular joint (top of the sternum, just off the midline) to the acromion. Rotates the whole arm for shrugs and reaches |
| Shoulder (`UpperArm` head) | Centre of the humeral-head sphere, **not** the acromion. The acromion is the clavicle tail. Predictive errors for this centre are 5–9 mm in biomechanics |
| Elbow | Hinge through the two epicondyles; joint slightly behind the arm's mid-line. Pre-bend 4–10° in the bend plane (D01 used 3.3 mm ≈ 4°) |
| Wrist | Midline of the wrist crease; the hand bone starts there. On the perimeter profile this is the **distal end** of the narrow plateau before the hand flares, not the plateau minimum |
| Hip (`Thigh` head) | Hip joint centre, inside the pelvis, medial to the outer hip bulge. Not at the outer surface |
| Knee | On the hinge axis between the condyles, behind the kneecap. Keep the measured bend of the leg (D01: 9°) or pre-bend 4–10° |
| Ankle | Midpoint of the malleoli: the distal end of the ankle plateau where the foot flares (the D01 plateau minimum put it 7 mm too high) |
| Ball | Metatarsophalangeal line, slightly above the sole (D01 z ≈ 0.012 m at 0.5 m H) |
| Spine | S-curve, closer to the back; 3 bones between pelvis and chest; the neck from the base of the neck to the skull base |
| Head | Pivot at the skull base, about 10–15 mm (at D01 scale) behind the ear line. Fit it from the head's own geometry (head mass and ear line), not on the straight torso spine line: forward-jutting heads (D01) put a torso-line pivot inside the upper back. Tail to the top of the skull, not the helmet. **Head island (I4):** the island with the most vertices in the head column, re-checked by a ray vote from the head-mass centre. Never use the highest vertex: in the pipeline, D01's "head island" had been an eye of 31 vertices. `head_top` is that island's surface straight above the head-mass centre. **Gate:** flag `head_top` when the head bone leans more than 25° from the arc between up and the neck direction, or more than 60° from up, for every plausible pivot. One passing pivot is enough, because FL's geometry pivot sits behind the hood. D01: 71° → 24° from up, bend cos 0.15 → 0.83. These limits come from D01, FL and U01; calibrate them at P5 |
| Chest | Convention landmark: the armpit fillet corner (maximum curvature of the arm-underside profile), ±10 mm is acceptable |
| Clavicle head | Sternal notch, taken from the torso loop at chest height and required to lie inside it. A chord at clavicle height can hit the chin on forward-jutting heads (review r1: clavicle placed in the jaw) |

Asymmetric meshes: measure each side separately. Use the mirror only when that side's asymmetry is ≤ 0.5% H. D01's `R_ear` was
wrong in run v1 because it had been mirrored.

## Rolls and bend tests (S4)

- Hinge for elbow and knee = the unit normal of the plane (proximal, joint, distal) — `bend_normal` in `d01_rig_def.py`. Set the roll
  so that local X equals that hinge orthogonalized against the bone direction: `EditBone.align_roll(z)` with `z = hinge × direction`.
- Mirror the convention so that **positive local X rotation means the natural bend** on both sides:
  - elbow flexes forward;
  - knee flexes with the foot going back;
  - spine and neck bend forward;
  - wrist puts the palm down.

  Verify each one automatically: rotate +20° on X and check the distal point's displacement direction. Flip the roll by 180° if it
  fails.
- Clavicle: positive X raises the shoulder (verify the same way).
- glTF has no roll field. The roll survives only as the joint's rest rotation. Twist bones rotate about their own local Y (along the
  bone).

## Twist bones (families H/S from 2026-10-22)

- `{S}_ForeArm_twist`: child of `{S}_ForeArm`, from 50% to 75% of elbow→wrist. Takes 50% of the hand's twist about the forearm axis.
- `{S}_UpperArm_twist`: child of `{S}_UpperArm`, from 25% to 50% of shoulder→elbow. Removes about 50% of the upper arm's own twist so
  the shoulder does not wring [proposal, to be calibrated at P5].
- In the control rig, drive each twist bone with a **driver**, not Copy Rotation:
  - `rotation_euler[1] = factor * t`;
  - `t` is a TRANSFORMS variable, ROT_Y, with `rotation_mode='SWING_TWIST_Y'`, LOCAL_SPACE, on the driver bone. This is a simple
    expression, so no Python auto-run is needed.

  Copy Rotation Y-only reads the Y angle of an Euler split, not the twist about the bone axis. Review round 1 measured 12.8° instead of
  30° for 60° pronation + 60° flexion, and 34° error in a three-axis pose. Test combined poses (twist + flexion + deviation) to 0.5°.
  The driver result is baked at R8.
- Weights: a linear ramp along the segment so that each vertex's effective twist equals its position (skinning.md).

## Sockets

- Sockets are unweighted bones in the runtime skeleton. With `export_def_bones=True` the exporter deletes non-deform bones that have
  no non-bone children, so keep the runtime armature export-only and leave that option off (export-runtime.md).
- Weapon socket: at the palm, Y along the grip (forward at T-pose: world −Y in Blender), Z = +X. D01's `A2_sockets` shows the
  convention. Other sockets: `fx_head`, `fx_chest`, `fx_hand_{S}`, `hit_origin` (front of `spine_02`), `ground` (under `root`).

## Control rig (S5), kit `humanoid_v1`

- **FK:** one `ctl_` bone per runtime deform bone, plus `ctl_{S}_Clavicle`.
- **Arm IK:** `ctl_{S}_Hand_IK` (child of `ctl_chest`) and `ctl_{S}_Elbow_pole`, placed 0.24 H along the bend direction (D01: 0.12 m at H = 0.5; the knee pole is the same).
- **Leg IK:** `ctl_{S}_Foot_IK` (heel on the ground, child of `ctl_root`), then `Toe_roll` → `Heel_roll` → `Ball_roll` →
  `Ankle_target`/`Toe_target`, with `ctl_{S}_Knee_pole`.
- **Switches:** `ik_arm_{S}`, `ik_leg_{S}` on the control armature, driving the IK influence.
- **Coupling:** the runtime follows by Copy Transforms (world → world). Check that the rest difference is 0.
- **Pole angle:** sweep −180…180° in 5° steps, then refine. Pick the angle where the IK rest pose equals the FK rest pose (D01: −90°
  on all four chains).
- **Function tests (D01 had 20):**
  - IK target moves → the other limb and the torso stay still;
  - the pole turns the bend the right way when the limb is bent;
  - heel, toe and ball roll work;
  - `ctl_root` moves everything;
  - `ctl_cog` lowers the body while the soles stay put (≤ 3 mm);
  - IK/FK switch.

  Also test extremes for NaN and degenerate matrices.

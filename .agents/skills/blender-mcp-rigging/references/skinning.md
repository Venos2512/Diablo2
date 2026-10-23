# Skinning (S6)

Sources:
- `research/02` §3 (methods, robustness ranking);
- `research/03` §2, §5 (twist, LBS rules of thumb);
- `research/01` Q4 (Blender operators, bone heat);
- D01 `rig/tools/d01_skin.py` and `qa_report.md` §0 (the sack leak fix);
- FL `rig/REPORT.md` (custom skin, skirt tear).

The runtime is LBS with 4 influences. Design weights for that model, not for DQS.

## Order of work

1. **Rigid islands** (from `analysis.json` and the brief): helmet, horns, bricks, buckles, armor plates, eyes → 100% to one bone.
2. **Candidates.** Generate at least two (A and B; C when UniRig ran):
   - **A — region + distance** (D01 and FL):
     - weight per bone = soft-min of the distance to the bone segment, minus a radius, inside "gates" (region masks and side
       masks);
     - Laplacian smoothing on the welded graph;
     - the elbow and wrist transition follows the coordinate along the limb.
   - **B — proxy + transfer + inpaint:**
     - build a watertight voxel proxy;
     - compute heat or geodesic-voxel weights on it. For assets under about 1 m, scale the proxy ×10: Blender's heat solver uses an
       absolute epsilon of 1e-4 [research/01 Q4];
     - transfer to the original mesh by closest point, keeping only vertices within a small distance and a normal angle of 35° or
       less (Robust Skin Weights Transfer, Abdrashitov et al. 2023);
     - fill the rest by minimizing `wᵀ(−L + L M⁻¹ L)w` with sum = 1 and w ≥ 0, using cotangent L and lumped M from libigl and a
       scipy solve.

     B suits open meshes and clothing fused to the body.
   - **C — UniRig skin:**
     - take UniRig's weights;
     - remap them to standard bones through the bone map of joint-placement.md §d;
     - standard bones with no counterpart (twist, clavicle, aux) start at 0 and are filled by B's inpaint step inside their region.
3. **Enforce.** Every smoothing pass is preceded and followed by a **fold**: side gate, region lists and rigid islands, raising
   `InvariantError` (not `assert`) if anything forbidden remains. Full enforcement (all items below) runs at the end of every candidate
   and after selection. Ruling of review r1: full top-4 + prune on every pass moved D01 away from G2 (L1 0.025) without a safety gain.
   - **Side gate:** no weight on opposite-side bones outside a midline band of ±1% H. Planes come **from the skeleton**, never x = 0:
     - torso plane = median x of the unsided core bones;
     - each L/R pair = mean x of the two heads (D01: legs 0.0105).

     Explicit rules override. Report the planes used.
   - **Region lists:** for example, the D01 sack cloth may only take `sack/chest/spine_02/spine_01`. Fold other weights into the
     nearest allowed bone before **and** after smoothing; smoothing re-pulled head/neck into the sack in D01 v3 (384/538 vertices).
   - **Rigid islands:** stay 1.0.
   - **Top-4** by weight, prune < 0.01, normalize to 1.
   - **Co-located duplicates** (UV seams) get identical weights (max difference ≤ 1e-6).
4. **Joint profiles.**
5. **Clothing.**
6. **Choose** per region by S7 metrics (deformation-qa.md):
   - take the candidate with the better region score;
   - blend across a 2–3 ring transition band;
   - enforce again.
7. **User override layer:** apply `weights_override.json`, keyed by welded position and bone, then enforce. It survives rebuilds.

## Joint profiles (LBS)

| Area | Rule |
| --- | --- |
| Shoulder | 3-way blend: chest / clavicle / upper arm (+ its twist bone). On rows that blend {UpperArm, UpperArm_twist} with {chest, Clavicle}: at most 3 influences **when the entries beyond the 3rd sum to less than 0.05**; otherwise keep up to 4 and report the row (review r2) |
| Upper-arm twist | t = position along the upper arm (0 at the shoulder), t0 = the twist bone head's position (0.25). m = the row's UpperArm + twist weight, re-split as UpperArm = m·a and twist = m·(1 − a), with a = clamp((t − t0)/(1 − t0), 0, 1). Effective roll share: 0.5 from the shoulder to t0, then linear to 1.0 at the elbow |
| Elbow, knee | 2–3 shared vertex rings, 50/50 at the crease line. Inner-crease vertices bias to the distal bone to limit collapse |
| Forearm | t = position along the forearm (0 at the elbow). m = the row's ForeArm + twist weight, re-split as twist = m·t and ForeArm = m·(1 − t). Effective twist = 0.5·t: 0 at the elbow, 0.5 at the wrist. **The hand bone gets no forearm weight** |
| Wrist crease | Hard band through the Hand head, normal = bisector of the forearm and hand directions, shifted slightly to the palm. Half width = 0.5 × `wrist_rings` (default 2) × local edge length. Hand share = clip(0.5 + u/(2h), 0, 1), where u is the signed distance. Review r1 tube test: 60° wrist flexion moves the forearm 8.1 / 3.0 / 0 mm at 1 / 2 / 4 cm above the wrist, against 26.8 / 25.8 / 21.4 mm when the hand weight spreads up the forearm. Remaining twist step sits in the wrist band (edge stretch ~1.15) |
| Hip, groin, buttock | Pelvis / thigh / spine. On rows that blend {Thigh} with {pelvis, spine_01}: at most 3 influences when the entries beyond the 3rd sum to less than 0.05, else keep and report. A hard cap removed up to 0.23 per row on FL and added 339 weight-jump edges; G2 itself has 4th hip influences up to 0.093. Transition over ≥ 10% of the thigh length (measured inside the thigh radius) |
| Neck, head | Neck blends over the neck length; the skull, helmet and jaw region go to `head` (or `helmet`) only |
| Fingers (if boned) | At most 2 influences; mitten hands = 100% `Hand` |
| Elsewhere | Keep up to 4. Cap a row to 2 only when its 3rd and later influences sum to less than 0.05 after fold + normalize. Spheres around joints do not reach the skin (review r1: 91% of FL rows were wrongly capped). Report the mass removed by caps |

Profile order: creases (elbow, knee, wrist) → twist → caps. Profiles must be idempotent: applying them twice changes nothing
(≤ 1e-6).

## Implementation notes accepted in P3 fix round 2

- **Side planes pair whole limb chains:** a chain uses the mean x of the two chain-root heads (Clavicle, Thigh, ear), so pose asymmetry
  of distal bones does not move the plane. A rules `side_gate.x0` sets only the torso plane.
- **Wrist crease runs before the elbow and knee creases,** so the elbow split is not changed again on the next pass.
- **Dropped limb weight stays in the limb:** when enforce prunes an entry on a limb row, its weight goes to the twist partner, or to
  the other side of a crease only where that crease applies:
  - wrist: within the wrist crease zone (within 0.5 × forearm length of the forearm/hand segments, the same zone the hard wrist band
    uses, so it never reaches other limbs in an A-pose);
  - elbow and knee: only within the crease mask (|P − J| < r and |u| < 2h).

  Elsewhere it is renormalized over the row (review r2: calf weight was moving to the thigh on the belly).
- **No cap removes 0.05 or more of a row in one step.** Final weights match the profile formulas except entries removed by prune and
  caps. `finish` warns when it has not converged after 4 rounds.
- **`finish` iterates** profiles + enforce to a fixed point (at most 4 rounds).
- **Candidate B:** the 35° transfer test uses vertex normals interpolated at the closest proxy point. The inpaint clamps w ≥ 0 and
  renormalizes (no constrained solve). All lengths are in units of H, so no ×10 scaling.
- **Unknown keys** in the `profiles` config raise an error.

**Candidate B limb envelope (review r3).** Proxy heat leaks limb weight onto the torso (FL: upper-arm weight up to 0.59 on the
chest and belly; thigh weight on the belly). Apply a smooth limb envelope **twice**: once to B's raw proxy heat before normalization, and again to the mesh rows
after inpaint, since the proxy stage alone left 4 FL rows leaking.
- Upper arm and its twist bone: weight fades from 0.5 to 0.75 upper-arm lengths from the segment.
- Thigh: weight fades from 0.75 to 1.25 thigh lengths from the segment, and also from 0.1 to 0.3 thigh lengths above the hip
  joint. FL's belly leak sat close to the thigh segment.

Result: leak D01 96 → 0 and FL 677 → 0 welded rows; D01 L1 vs G2 0.340 → 0.331.

**Candidate A uses the same envelope (I4).** The code lives in `solvers/skin_profiles.py` and is shared with B. It is on by default in A's
generic path and off when the skin rules give asset steps, so the legacy D01 rebuild stays bit-identical. A's leaking rows dropped from
1269 to 0 on D01 and from 428 to 0 on FL. Side effect: once A stops leaking, the selector picks it in more regions, including the pelvis on both assets. Penetrations drop, but pelvis tears grow (D01 38 → 46,
FL 63 → 94) and FL joint volume falls from 0.43 to 0.36. The lights keep their colours. Selector tuning is left to P5, which will have
tier-1 ground truth. Numbers come from two assets; recalibrate
at P5. Never use a hard gate in `enforce`: it creates a weight step,
and approved rigs keep legitimate long-range weights (toes, mitten hands, robes). Report `limb_leak` for every candidate.

## Clothing and attachments

The full rules for long clothing and hanging items are in **cloth-and-attachments.md**: classes, chain placement, leg-push control,
garment overlay weights and garment QA. They replace the skirt and cape rows below where the two differ. For example, the skirt
root is driven by leg-push drivers, not by Copy Rotation 0.5 from each thigh.

| Garment | Approach |
| --- | --- |
| Tight (shirt, trousers, straps) | Body weights. With a separate cloth mesh, use Data Transfer `POLYINTERP_NEAREST` from the body, then enforce |
| Skirt or robe bridging the legs | Chains of 3–6 bones (front, back, left, right; FL used front 6, back L/R 5, sides L/R 4). Weights ramp down the chain. Each chain root is driven in the control rig by Copy Rotation 0.5 from **each** thigh (two constraints; one constraint ignores the second leg). Watch the hem: it bulges when the legs lift. Baked at R8 |
| Long cape | 3–5 bone chain, weighted by vertical ramp. Secondary motion or cloth simulation is baked to these bones in the animation session |
| Loincloth or flap | One `*_flap` bone from the belt, with an animator control. D01: 4 vertices pierced the thigh at hip flex 70°; −30° on `ctl_loincloth_front` cleared it |
| Bags, sacks, pouches | Rigid content 1.0 to its bone. The cloth shell is limited to its region list, plus a 3-ring transition on the skin side |
| Weapons | Separate meshes on sockets, not skinned to the body |

## Blender operations (5.2)

- Clean order on a runtime copy: `vertex_group_limit_total(limit=4)` → `vertex_group_normalize_all(lock_active=False)` →
  `vertex_group_clean(limit=0.001)` → count again.
- `parent_set(type='ARMATURE_AUTO')` and `paint.weight_from_bones(type='AUTOMATIC')` use bone heat. A failure is only a warning, and the
  bones after the failing one get no weights. Count empty vertices and per-bone coverage after every automatic assignment.
- `vertex_group_mirror(use_topology=True)` needs matching topology; Tripo meshes do not have it. Mirror by position instead (KD-tree
  on the sagittal plane), and only where the measured asymmetry is ≤ 0.5% H.
- Never write weights in a Python loop over `vertex.groups` inside Blender for the whole mesh. Write per group with
  `VertexGroup.add(indices, weight, 'REPLACE')`, batched by equal weight, or through the solver's `.npz` loaded in one call.

## Do not

- Do not leave unweighted bones that the brief marked as deform. FL left the forearm twist unweighted.
- Do not silently change approved source weights to pass an export check. Prune and normalize the runtime copy only
  (`blender-game-animation/references/engine-handoff.md`).
- Do not judge weights on a single pose. Use the ROM set (deformation-qa.md).

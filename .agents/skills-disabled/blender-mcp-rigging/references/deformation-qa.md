# Deformation QA (S7)

Thresholds live in `ashlar/3d/rig-anim/RIG_SKILL_WORKFLOW.md` §4. They are proposals until P5 calibrates them; quote that table, do
not invent new numbers. These checks feed `QA_CHECKLIST.md` A2 and the future A3.

## Emulate the runtime first

Build a QA evaluation state:
- Armature modifier only, `use_deform_preserve_volume = False`;
- every bone `bbone_segments = 1`;
- no Corrective Smooth or other deforming modifiers;
- weights cut to the top 4 by weight, weights ≤ 0.0001 dropped, then normalized. This is what the glTF exporter writes, and three.js
  renormalizes again.

Metrics from any other state do not describe the game.

## ROM poses

Pose through the **control rig** (the real controls), never by editing runtime bones. For each joint, run neutral → +max → neutral →
−max → neutral, then the compound poses.

Family H/S targets [proposal, clinical ranges trimmed for games; research/03 §7]:

| Joint | Range |
| --- | --- |
| Shoulder abduction / flexion | 0…170° / 0…170° (via clavicle + upper arm) |
| Elbow flexion | 0…150° |
| Forearm pronation / supination | ±80° (tests the twist bones) |
| Wrist flexion / extension | ±60° |
| Hip flexion / abduction | 0…120° / 0…45° |
| Knee flexion | 0…140° |
| Ankle | +20° / −40° |
| Spine twist (pelvis→chest) | ±45° |
| Spine bend | +60° / −30° |
| Neck rotation | ±60° |

Families with Toe bones add toe flexion ±30° to the ROM. A region whose bone turns less than a few degrees relative to its parent in
every pose is `not_exercised`: no winner in skin selection, and a G2 flag.

Compound poses (D01 had 17 in total): squat, long step, arms crossed, hands overhead, twist ±45°, hip flex with knee bent, and the
brief's hard-zone poses (loincloth, sack, skirt).

## Metrics (rigkit-env, on evaluated vertices exported per pose)

| Metric | Definition |
| --- | --- |
| Edge stretch | Posed / rest edge length, per edge. The light counts **torn edges**: ratio > 1.5 **and** growth > 0.2% H. Any torn edge in a standard pose is red; in an extreme pose, red above ~0.5% of the region's edges. Max and p99 are diagnostics only |
| Triangle area change | Area-weighted fraction of faces beyond ±15%, skipping slivers (min angle < 10°). Starting bands: green ≤ 1%, red > 5%. A single worst face does not decide the light |
| Joint volume | **Ball occupancy:** the fraction of a fixed point set in a ball of radius r = 0.8 × local limb radius (a larger ball picks up neighbouring parts) around the posed joint, moving with the child bone, that lies inside the child's island (winding number), divided by the rest value. Capped patch volumes were unstable in review r1 (negative rest volumes, L/R mismatch, about 2× the real loss). If not measurable, report it with the reason |
| Candy wrapper | Cross-section area ratio with the hand twisted 90° at 0.5, 0.75 and 0.9 of the forearm **and** in the wrist band. Report the minimum. A rig without twist bones is never "green by default" |
| New penetrations | Triangle-pair intersections between non-adjacent regions (BVH), minus those present at rest. A pair counts only when a vertex newly lies inside deeper than 0.05% H (winding number); depth is taken over the whole connected intruding piece, not only at the crossing faces; shallower pairs are listed as "contacts". D01 B2 method: 3-ray parity, validated by planted overlaps. Hidden intrusions (a rim inside a closed part) need an X-ray or cutaway view |
| Limb leak | Rows whose nearest bone is a torso bone and that carry ≥ 0.1 of a limb root (UpperArm + its twist, Thigh) far from it:
upper arm beyond 0.75 × upper-arm length, thigh more than 0.3 thigh lengths above the hip joint. Proposal band: G2 D01 ≤ 3 rows,
FL candidate C ≤ 1. Review r3 found candidate B leaking on 120–630 rows (arm weight onto chest and belly) while scoring well on
tears |
| Seam cracks | Max distance between co-located duplicate vertices after deformation (should be 0) |
| Ground contact | Lowest sole vertex of each planted foot = 0 ± 3 mm. Judge by deformed geometry, not bone position |
| Joint drift | Bone heads stay inside the deformed mesh in every pose |

Exempt zones (thin cloth, ears) must be listed in the brief or `qa_report.md` with the reason. They are not hidden.

## Region score for skin selection (review r1)

Per region and candidate, decide in order:
1. Seam cracks must be 0.
2. Less **tear length** wins: the sum over torn edges of (posed length − 1.5 × rest length), worst pose then the sum over poses.
   Counts alone let a rigid cut win at the wrists (fewer edges, but torn up to 7.5×); counts still drive the lights.
3. Penetration-depth tier: 0, then < 0.5% H, then deeper.
4. Soft score from the 95th percentile (or a power mean with p ≥ 4) of edge excess and area excess, plus the volume deficit
   `max(0, 0.85 − ratio)`. Never a plain mean: a rigid cut hides its few torn edges in a mean.
5. Within 5%, prefer the smoother candidate or flag the region for G2.

Before step 2, a candidate whose **limb leak** in a torso, shoulder or hip region exceeds the band is dropped for that region,
unless every candidate leaks; then the region is flagged for G2. `not_exercised` regions keep the default candidate (A) and are
flagged.

Tear lengths within about 5% count as equal, so the decision falls through to the tier and the soft score. Regression: a rigid
one-bone-per-vertex candidate must lose in every hinge region of D01.

**Not covered (known limits):**
- an overlap that already exists at rest and only gets deeper;
- a part fully submerged without crossing faces.

Use the cutaway tiles and the close-ups for these.

## Images (via MCP; open and inspect every one)

- **Skeleton over mesh:** front, side, back, X-ray bones, labels.
- **Weight maps:** dominant bone, blend, influence count, and per-bone for spine, neck/head, each arm and leg, and aux.
- **Each ROM pose** at front, side, 3/4, and the **ARPG camera** (top-down, about 50–60° pitch). Clean and with skeleton.
- **Stretch heat map** per pose; **penetration map** for the hard zones.
- **Close-ups** of shoulders, hips/legs, elbows, head/neck, and the brief's hard zones. Small defects can hide at game distance: D01's
  loincloth pierced the thigh 17.5 mm in a death frame and was only visible in close-up.
- Use **Solid/Workbench** for batches. Render long batches with `blender -b`.
- **One-page flag sheet for G2.** List the worst poses per red metric, at most about 8 tiles, so the user can review it in ≤ 2 minutes.
  The full sheets stay as evidence.

## Fix loop

1. Read the red metric and find the region and the pose.
2. Decide the cause:
   - joint position or roll → S3/S4;
   - weights → S6;
   - pole or IK reach → S5. An IK collapse may be a reach problem, not a weight problem.
3. Make a targeted change, recorded in the recipe.
4. Re-run S7 on all poses, not only the failing one.
5. Write before/after numbers into `qa_report.md`, and keep the old images under `qa/_superseded/<tag>/`.

Stop iterating when every metric is green or yellow with a reason. List each remaining yellow as an aesthetic question for G2.

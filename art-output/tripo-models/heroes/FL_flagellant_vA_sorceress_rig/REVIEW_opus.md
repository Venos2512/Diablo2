# Review (Opus 5.5) — FL_flagellant_vA → Sorceress skeleton, rig preview

Date 2026-10-21. Narrow, bounded review: reviewer only, nothing changed except this file.
Scope: concrete bone-transfer preview (Agent.md R2–R5, stops before G2). Not production animation, not engine integration.
Sorceress bone names are kept as requested; generic project names are not demanded.

## Verdict: **PASS** for the requested rig preview

No blocker. The fixes below are for packaging and documentation and can go into the Sonnet packaging pass.

## What was checked, and the evidence

| Item | Result |
| --- | --- |
| Inputs untouched | Both attachments have mtime 13:45, before the outputs (14:15). The scripts only import them (`build_rig.py:20-22`, `:39`, `:60`) and write to `--out`. `ashlar/3d/heroes/FL_flagellant_vA/FL_flagellant_vA.glb` is the same size as the Flagellant attachment (20,718,640 B) and has an identical first 2 MB. |
| Skeleton contract | `validation.json`: 181/181 names, 0 hierarchy mismatches, local rotation max dev 0.056°, IBM vs hierarchy ≤ 3.3e-6. Only the joint order differs (harmless for a name-based retarget). |
| Weights | 0 unweighted verts, sum 1 ± 1.2e-7, ≤ 4 influences, ids in range. Pruning in `skin.py:155-161` keeps the top 4, drops weights < 0.01 and renormalises. Rigid islands are averaged per island (`skin.py:145-153`), which is the right choice for the lantern, pouches and knots. |
| Round trip | Rest mesh 2.3e-6 m; weights L1 1.4e-7; QA clips ≤ 1.0e-6 m. Tolerances are sensible for 1.8 m scale. Main GLB has 0 animations, and the 3 QA clips are in a separate geometry-only GLB, so they are kept apart as R6 requires. |
| Textures | 3 images match the input by SHA-256. One material. |
| Placement | Spine, limbs and feet fit the mesh in the front, side and back views (`qa/SHEET_skeleton_front_side_back.png`). The long line in front of the body in the side view is `two_hand_weapon_*` and `*_hand_adjust` at y≈−0.42. These are inherited from Sorceress (−0.46 there), so they are not a fitting error. The L/R arm joints are 5–6 cm asymmetric (`L_Wrist` x 0.65 vs `R_Wrist` −0.70). This follows the real mesh asymmetry that REPORT documents. |
| QA images | Arms down/up, elbows, twist and head turn deform cleanly. Shoulders and cape do not collapse. The dominant-weight map shows smooth gradients with no cross-side bleed. Stride and the walk strip are acceptable: slight inner-layer show-through and leg poke near the rear shin. `crouch` (deep) tears the apron and inner layers (114 edges > 1.5×), which REPORT states openly. Fingers move as one mitt (fused input). |
| Reproducibility | `run_all.ps1` + `--factory-startup` + `python -I` follow the rules in rig-anim Agent.md §7. Constants are explicit (S = 1.8 from brief.md, `rig_fit.py:11`). |

## Findings

### Non-blocking: fix while packaging into `ashlar/3d/heroes/FL_flagellant_vA/rig/`

1. **REPORT.md "76 bone có nhóm đỉnh" (Phương pháp §5) vs validation `joints_with_weights: 68`.**
   - Cause: `build_report.json.skin.weighted_bones` counts the groups that the field produced. After the < 0.01 cut, 8 of them are empty.
   - Effect: the doc contradicts itself. Its own "113 bone không trọng số" is 181 − 68.
   - Fix: write "68 bone có trọng số (76 nhóm trước khi cắt < 0.01)".
2. **Inputs hard-coded to T3 attachment paths (`build_rig.py:20-22`, `validate_rig.py:22`), and `run_all.ps1` has no `-Src/-Tgt` params.**
   - Effect: if the attachments are cleaned, the rig can no longer be rebuilt. The Flagellant mesh already lives in `ashlar/3d/heroes/FL_flagellant_vA/FL_flagellant_vA.glb`, but the Sorceress GLB exists only in attachments.
   - Fix (choose one):
     - add `-Src/-Tgt` to `run_all.ps1`, pass them to both scripts and point `-Tgt` at the ashlar GLB;
     - copy the Sorceress GLB to `rig/refs/` as internal-only and record its SHA-256 in `rig.log`.
3. **D2R licence note missing.** rig-anim Agent.md §6/§9 says D2R skeletons and clips are Blizzard assets: internal lookdev only and not shippable.
   - Effect: the rig GLB carries the D2R skeleton (names, hierarchy, axes), and nothing in the output says so.
   - Fix: state this in `rig.log`, `rig_brief.md` and the inventory row, with status `G2 pending`, route "template retarget (Sorceress D2R)", and the note "internal lookdev, not release".
4. **Packaging layout (rig-anim Agent.md §5).**
   - Keep the art-output folder as is (non-destructive copy).
   - In ashlar, name the files `FL_flagellant_vA_rig.glb` (or keep `_sorceress_rig` and note it in the README/inventory) and `rig/FL_flagellant_vA_rig.blend`, plus `rig/validation.json`, `rig/qa/` and `rig/rig.log`.
   - Put the QA clip GLB under `rig/qa/` or `rig/anim/`, marked `experiment`, never `approved`.
   - Do not claim G2 has passed.
5. **Minor:** `skin.py:170-171` sets `use_deform` for the 8 empty groups. This is harmless because those joints are in the skin anyway. You can drop the empty groups or leave them.

### Known future production limitations, not blockers for this preview

- Deep-crouch skirt tearing and slight penetration in stride or mid crouch. These need skirt-chain weighting or secondary bones, or cloth. Decide at G2.
- Fused fingers. The finger bones are weighted, but the hand bends as a block. This needs a mesh fix or accepting a mitt hand. Record it in the brief.
- Face, hair, forearm twist, shoulder pads, `heavy_side_skirt` and charms are unweighted. Forearm twist weighting would help production wrist rotations.
- Translation units: metres here vs Sorceress node units × 1.15. Height differs by about 0.1 m. Clip retargeting must scale root/`cog`. REPORT documents this.
- No real animation: the source has no clips. The QA clips are synthetic.

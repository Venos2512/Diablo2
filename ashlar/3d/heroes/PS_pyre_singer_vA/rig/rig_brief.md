# Rig brief — PS_pyre_singer_vA

2026-10-21. Scope authorized by the user: generate hero and staff, then rig with Sorceress bones. No new animation set or game integration requested. This is a local Sorceress-compatible lookdev rig.

## Inputs and scale

- Hero source: ../PS_pyre_singer_vA.glb — pending Tripo generation. Original must remain untouched.
- Weapon source: ../../../weapons/PS_pyre_staff_vA/PS_pyre_staff_vA.glb — pending generation; separate rigid mesh.
- Skeleton donor: E:/Diablo2/lookdev-lab/assets/samples/d2r-sorceress.glb, 181 joints, 0 animations.
- Diagnostic motion source if needed: E:/Diablo2/lookdev-lab/assets/samples/d2r-sorceress-anims.glb. Existing staff-stance actions only for QA; no claim of animation approval.
- Family H, route T (explicit user choice), Blender. No Tripo rig/animate credits.
- Target height: provisional 1.8 m for local preview, matching the existing adult FL reference. Measure after import; keep original hero proportions. Staff scale from selected concept, check grip and visual length against hero.
- Units metres, glTF Y up / +Z forward; applied object transforms, grounded soles.

## Skeleton and skin

Preserve donor joint names, hierarchy and bind-axis conventions for Sorceress compatibility, including intermediate donor nodes. Fit joints to measured PS anatomy; do not copy FL landmarks. Recompute correct inverse binds after fitting. Preserve complete donor in editable source and identify unused joints in reports. Do not silently prune or rename the compatibility skeleton into a different ASHLAR standard.

Runtime deformation rig and editable control rig separate in .blend. Controls excluded from GLB. Normalized skin, at most four influences per runtime vertex. Inspect shoulder mantle, exposed arms, wrists, skirt splits, hips and boots. Finger weighting depends on actual Tripo topology: preserve donor bones, state honestly if fingers are fused.

Veil and braid use suitable existing hair/head bones; skirt uses existing skirt chains where topology permits, with weight boundaries preventing opposite-leg drag. Mantle follows left shoulder/chest; lantern remains rigid at right hip (existing charm/pelvis chain as suitable). Keep metal buckles and lantern from melting under skin deformation.

Staff stays rigid and separate, attached through R_weapon_attach or the existing two_hand_weapon_attach chain after verifying actual transforms. Validate grip alignment in rest and diagnostic staff poses. No solid flame geometry; fire/VFX is outside this rig task.

## Validation and delivery

- Render measured front/side/back landmark views before fitting.
- Validate names/hierarchy, one body skin, complete weights, <=4 influences, sums 1 +/- 1e-6, inverse binds <=1e-5, source/reimport geometry <=1e-4 m, height within 2%, soles within 0.01 m, textures unchanged.
- QA overlays, weight maps and extreme poses: arms raised/crossed, squat, long stride, torso twist, head bend. Include weapon socket evidence. Synthetic poses are QA only.
- Reopen .blend, verify editable controls and textured viewport. Clean export/reimport from a copied directory.
- Deliver rig/PS_pyre_singer_vA_rig.blend, ../PS_pyre_singer_vA_rig.glb, original separate staff GLB, rig/validation.json, rig/qa/ evidence and rig report.
- Sonnet implements any pipeline edits; Opus reviews actual latest code, then Sonnet resolves findings until PASS. Keep work isolated under this asset; do not edit the active FL rig thread.

## Provenance and status

Project-local provenance: lookdev-lab/THIRD_PARTY_LICENSES.md identifies Sorceress source as Proprietary-Blizzard, internal local testing only. Carry this note with donor-derived rig; no publication or release build in this task.

User has explicitly selected Sorceress rig route. Mesh generation and image approval pending. Rig fitting/QA not started; no validation or G2 approval claimed. Animation G3 and game/lab integration are outside current scope.

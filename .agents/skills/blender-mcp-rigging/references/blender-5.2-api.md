# Blender 5.2 API notes for rigging

Verified against the Blender `v5.2.2` source (`research/01`). Confidence is HIGH unless marked otherwise. Check anything unlisted
with `bl_rna` introspection (mcp-operations.md) instead of guessing.

## Armature and bones

- Bone layers are gone. Use `Armature.collections` / `collections_all` and `Bone.collections`. Colors: `Bone.color` and
  `PoseBone.color`.
- Deform flag: `Bone.use_deform`.
- Scale inheritance: `Bone.inherit_scale` takes `FULL`, `FIX_SHEAR`, `ALIGNED`, `AVERAGE` or `NONE`. Use `FULL` with uniform scales
  on game rigs.
- Roll:
  - `EditBone.roll` holds the value;
  - `EditBone.align_roll(vector)` aligns the bone's local +Z toward the vector (used the same way by the glTF importer; exact C
    semantics: MED);
  - `bpy.ops.armature.calculate_roll(type=...)` takes `POS_X`, `POS_Z`, `GLOBAL_POS_*`, `NEG_*`, `ACTIVE`, `VIEW` or `CURSOR`;
  - `EditBone.align_orientation(other)` copies direction and roll.
- Bending must be verified by a pose test regardless of the API used (joint-placement.md).
- Name flipping (`BLI_string_flip_side_name`) recognizes the prefix form `L_Thigh` ↔ `R_Thigh` as well as the suffixes `.L`/`_l`
  and the words left/right. It does not flip `LThigh` or names shorter than 3 characters. Mirror tools therefore work with the
  project's `L_`/`R_` names.
- Rigify 0.6.10 is still bundled in 5.2.2 (`addons_core`). Its `DEF-` tree can have several roots and parents on `ORG-` bones, so do
  not use it as the runtime skeleton.

## Weights

- `object.parent_set(type='ARMATURE_AUTO')` / `paint.weight_from_bones(type='AUTOMATIC')` run bone heat:
  - the solver works in world space with absolute tolerances (`DISTANCE_EPSILON 1e-4`);
  - it stops at the first bone that fails and reports only a **warning** (`Bone Heat Weighting: failed to find solution for one or
    more bones`), so later bones get nothing.

  Known triggers: tiny scale, non-manifold or duplicate geometry, loose parts (MED). Work on a cleaned, scaled proxy and count empty
  vertices afterwards.
- `object.vertex_group_limit_total(limit=4)` removes the lowest weights and does not normalize (MED), so follow it with
  `vertex_group_normalize_all`, then `vertex_group_clean(limit=...)`.
- `object.vertex_group_mirror(use_topology=False)` is spatial by default. `use_topology=True` needs matching topology. It reports
  mirrored and failed counts.
- `object.vertex_group_smooth(factor, repeat, expand)` acts on selected vertices. Prefer the solver's smoothing on welded topology.
- Data Transfer modifier, `data_types_verts={'VGROUP_WEIGHTS'}`, `vert_mapping`: `TOPOLOGY`, `NEAREST`, `EDGE_NEAREST`,
  `EDGEINTERP_NEAREST`, `POLY_NEAREST`, `POLYINTERP_NEAREST`, `POLYINTERP_VNORPROJ`.
- Armature modifier QA settings: `use_deform_preserve_volume = False`. On every bone: `bbone_segments = 1`.

## Animation data (QA poses, and later baking)

- **Slotted actions (4.4+):**
  - keys live in `action.layers[i].strips[j].channelbag(slot).fcurves`; do not use `action.fcurves`;
  - assign `obj.animation_data.action`, then check `obj.animation_data.action_slot`;
  - shape keys have their own `Key.animation_data.action_slot`.
- **`bpy.ops.nla.bake`:**
  - `frame_start` and `frame_end` default to 1–250 when called from a script, so always pass them;
  - `only_selected=True` by default, and returns "Nothing to bake" with no selected pose bones;
  - `visual_keying=True` is needed for constraint results; `clear_constraints` only together with visual keying;
  - `use_current_action=False` creates a new action.
- **Headless bake:** `bpy_extras.anim_utils.bake_action_objects(pairs, frames=range(...), bake_options=BakeOptions(...))`.
- **QA pose actions** go in a separate `qa/<asset>_qa_poses.blend` with `status=experiment`. The source `.blend` carries no Actions
  (D01 convention).

## Python environment inside Blender

- The bundled numpy 2.3.4 has no fast BLAS (a 1000² matmul takes 2.2 s). Do not install packages into Blender's Python. Use
  `E:\tools\rigkit-env`.
- `bpy.ops` called from a script need context: wrap view and armature operators in `bpy.context.temp_override(...)`, and set the
  mode explicitly (`bpy.ops.object.mode_set`).
- Prefer data API writes (`EditBone.head/tail/roll`, `VertexGroup.add`, `foreach_set`) over operators. They are faster and need no
  context.

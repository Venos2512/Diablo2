# Blender 5.2 rigging -> glTF 2.0 -> three.js: verified facts

Date: 2026-10-22. Scope: facts for a rigging skill driven through Blender MCP (live Blender 5.2.2 LTS). Facial rigging out of scope. No repo files were changed.

## Method, sources, and access limits

- Primary evidence = Blender source at tag `v5.2.2` (GitHub mirror `blender/blender`), including the bundled glTF add-on `scripts/addons_core/io_scene_gltf2` (bl_info version 5.2.40, declares `blender: (5, 2, 0)`, `__init__.py:9-11`) and bundled Rigify `scripts/addons_core/rigify` (0.6.10). The bundled exporter is what ships with 5.2.2.
- three.js `r186` tag (GitHub). Khronos glTF 2.0 spec (registry.khronos.org HTML, current).
- Blender tag `v5.2.3` also exists upstream; I did not check its diffs. Facts below are from `v5.2.2`.
- NOT reachable from this environment (HTTP 403 Cloudflare to both WebFetch and curl): docs.blender.org (manual + Python API), developer.blender.org (release notes), projects.blender.org (bug tracker, source), blender.org. Anything that relies only on the manual or release notes is marked MED (search snippet) or UNVERIFIED.
- Confidence tags: **HIGH** = official source code or spec read directly. **MED** = maintainer/forum/bug-tracker text seen in search snippets, or my inference from code (labelled). **LOW** = blog/guide. **UNVERIFIED** = not checked.
- Code URLs use the form `https://github.com/blender/blender/blob/v5.2.2/<path>#Lxx`; line numbers are approximate to the cited block.

Base URLs used below:
- B = `https://github.com/blender/blender/blob/v5.2.2/`
- G = `https://github.com/mrdoob/three.js/blob/r186/`
- K = `https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html`

---

## Q1. glTF exporter options (Blender 5.2.2, io_scene_gltf2 5.2.40)

### 1.1 Operator and argument names
- Operator: `bpy.ops.export_scene.gltf(...)`, `bl_idname = 'export_scene.gltf'`, class `ExportGLTF2`. [HIGH] `B+scripts/addons_core/io_scene_gltf2/__init__.py` lines 1888-1890.
- Format enum `export_format`: `'GLB'` (default) or `'GLTF_SEPARATE'`; `'GLTF_EMBEDDED'` only if the add-on preference `allow_embedded_format` is on. [HIGH] same file, lines 139-146, 327-336.
- Selection argument is `use_selection` (not `export_selected`). [HIGH] same file, line 618. Also `use_visible`, `use_active_collection`, `use_renderable`.
- Skinning args exist exactly as named below. [HIGH] property defs, same file, lines 673-1055.

Argument names (Python arg = UI label, default):
- `export_skins` "Skinning" (True), line 920.
- `export_def_bones` "Export Deformation Bones Only" (False), line 761. UI greys/warns: "Export only deformation bones is not possible when not sampling animation" when `export_force_sampling` is False (`__init__.py` 1632-1636).
- `export_all_influences` "Include All Bone Influences" (False), line 933. Tooltip: "Allow export of all joint vertex influences. Models may appear incorrectly in many viewers." [HIGH]
- `export_influence_nb` "Bone Influences" (int, default 4, min 1), line 926. Only used when `export_all_influences` is False (UI greys it out, lines 1652-1656). [HIGH]
- `export_rest_position_armature` "Use Rest Position Armature" (True), line 902.
- `export_armature_object_remove` "Remove Armature Object" (False), line 779. Tooltip: removed "if possible"; not removed if the armature has multiple root bones. Enforced in `tree.py` 1027-1037. [HIGH]
- `export_hierarchy_flatten_bones` "Flatten Bone Hierarchy" (False), line 767.
- `export_leaf_bone` "Add Leaf Bones" (False), line 788.
- `export_animations` (True), line 692.
- `export_animation_mode` (default `'ACTIONS'`), line 734. Items: `ACTIONS` (actions active or on NLA tracks, one glTF animation each), `ACTIVE_ACTIONS` (all currently assigned actions merged into one), `BROADCAST` (every compatible action sent to every object), `NLA_TRACKS` (one glTF animation per NLA track), `SCENE` (baked scene). [HIGH]
- `export_merge_animation` (default `'ACTION'`; `NLA_TRACK` | `ACTION` | `NONE`), line 865; `export_nla_strips_merged_animation_name` default "Animation", line 753.
- `export_nla_strips` (line 1016): tooltip says the option is kept only for backward compatibility and "does nothing". Do not use it. [HIGH]
- `export_force_sampling` "Always Sample Animations" (True), line 712. `export_frame_step` "Sampling Rate" (1, range 1-120), line 704. `export_frame_range` "Limit to Playback Range" (False), line 698.
- `export_bake_animation` "Bake All Objects Animations" (False), line 855. Tooltip: force animation on every object, "useful when using constraints or driver".
- `export_optimize_animation_size` (True, removes duplicate keys), line 797; `export_optimize_animation_keep_anim_armature` "Force Keeping Channels for Bones" (True), line 805.
- `export_reset_pose_bones` "Reset Pose Bones Between Actions" (True), line 884.
- `export_anim_single_armature` "Export all Armature Actions" (True), line 875. Tooltip: "Export all actions, bound to a single armature." So compatible actions that are not assigned can also be exported. [HIGH tooltip; MED on consequence]
- `export_anim_slide_to_zero` (False), line 846; `export_negative_frame` (`SLIDE`/`CROP`), line 835.
- `export_current_frame` "Use Current Frame as Object Rest Transformations" (False), line 893. Tooltip: when off, frame 0 is the rest for objects.
- `export_apply` "Apply Modifiers" (False), line 679. Tooltip: applies modifiers except Armatures, "WARNING: prevents exporting shape keys."
- Morph: `export_morph` "Shape Keys" (True) 939; `export_morph_normal` (True) 945; `export_morph_tangent` (False) 951; `export_morph_animation` "Shape Key Animations" (True) 957; `export_morph_reset_sk_data` (True) 963.
- `export_yup` "+Y Up" (True), line 673.
- `export_action_filter` "Filter Actions" (False), line 999, plus scene collection `gltf_action_filter` (line 123). Use this to stop unused actions being exported.
- `export_extra_animations`, `export_pointer_animation` (experimental), `export_convert_animation_pointer`: not needed for a game rig.

### 1.2 Influence limiting (what happens to >4 influences)
- Per vertex, bones are collected from vertex groups, weights <= 0.0001 are dropped, and the rest are sorted by weight descending. [HIGH] `B+scripts/addons_core/io_scene_gltf2/blender/exp/primitive_extract.py` lines 1558-1594 (`__get_bone_data`, `min_influence = 0.0001`, `bones.sort(key=..., reverse=True)`).
- Vertex groups that do not map to a skin joint are skipped; this is how non-deform groups drop out. [HIGH] same block, `group_to_joint` / `if joint is None: continue`.
- Vertices with no surviving weight are assigned to a neutral joint at the armature root. [HIGH] same block (`need_neutral_bone`); `tree.py` `add_neutral_bones` lines ~899-972.
- If `export_all_influences` is OFF: keep `ceil(N/4)` sets, zero the lowest slots beyond N, then renormalize so each vertex sums to 1. So the answer to "top-4 kept? renormalized?" is: **top-N by weight are kept (N = export_influence_nb, default 4, rounded up to sets of 4), the rest are zeroed, and the remaining weights are renormalized to sum 1.** [HIGH] `B+.../blender/exp/primitive_attributes.py` lines 68-71 (choose set), 82-86 and 113-120 (warning: "The 4 with highest weight will be used (and normalized)"), 103-139 (zero extra slots), 150-162 (sum and divide).
- If `export_all_influences` is ON: all sets are written as JOINTS_n/WEIGHTS_n, and the same sum-normalization is still applied. [HIGH] same file, lines 68-69 and 158-162.
- glTF requires weights >= 0, the sum near 1, and "Joints MUST NOT contain more than one non-zero weight for a given vertex." [HIGH, Khronos spec, section 3.7.3.3 Skinned Mesh Attributes: `K#skinned-mesh-attributes`]

### 1.3 Rest pose, IBMs, and bone axes
- Rest ON (default): joint node TRS comes from `bone.bone.matrix_local` (edit-bone rest matrix) times `axis_basis_change`. [HIGH] `B+.../blender/exp/tree.py` lines ~314-330 (`gltf_rest_position_armature` branch).
- Rest OFF: joint node TRS comes from the current pose-bone matrix (`blender_bone.matrix`). [HIGH] same file, lines ~315-318.
- Inverse bind matrices: always computed from `bone.bone.matrix_local` (rest), `axis_basis_change @ (armature.matrix_world @ bone.matrix_local)` inverted. [HIGH] `B+.../blender/exp/skins.py` lines ~66-110 (`__gather_inverse_bind_matrices`).
- Consequence (inference, MED): with Rest OFF the joint node TRS follows the export frame's pose but the IBM still uses the rest matrix. Skinning is only consistent when the export frame is the rest pose. Keep "Use Rest Position Armature" ON for game exports; verify with a round trip.
- Y-up conversion is a fixed basis change `(x, y, z) -> (x, z, -y)`, applied to bone world matrices on the right (`tree.py` 128-131, 330) and on the left in the IBM (`skins.py` ~74-79). [HIGH]
- Bone axes: with the importer's `Bone Dir = "Blender (best for import/export round trip)"` (default, `bone_heuristic = 'BLENDER'`, lines 1950-1969), "Bone tips are placed on their local +Y axis (in glTF space)". So a joint's local +Y points along the bone in glTF space. [HIGH for importer tooltip; MED for the exporter producing this, from matrix algebra on the code above]
- Other importer options: `TEMPERANCE` (average), `FORTUNE` (may look better, less accurate). Relevant only for importing glTF into Blender, not for runtime. [HIGH]
- Flatten Bone Hierarchy calls `break_bone_hierarchy()` which re-parents every bone to the armature node (`tree.py` 1004-1014). Tooltip: "useful in case of non decomposable transformation matrix." Skinning still works (IBMs are rest-based), but attachments or runtime code that rely on the bone hierarchy break. [HIGH code; MED consequence]
- Non-decomposable matrices (shear from non-uniform parent scale on rotated children) cannot be written as glTF TRS. See Q7 for `inherit_scale` modes. [MED]

### 1.4 Object scale and unapplied transforms
- Skinned mesh: vertex positions are transformed by `blender_object.matrix_world` (object transform baked into vertices), normals by `armature^-1 @ object` (`B+.../blender/exp/primitive_extract.py` lines ~1142-1150, ~1475-1477, ~1533). [HIGH]
- Skinned mesh node: TRS is NOT written (`node.skin is None` guard), so the node transform is identity. [HIGH] `B+.../blender/exp/nodes.py` lines ~66-80 with comment "transforms should be ignored at import".
- glTF spec: "Only the joint transforms are applied to the skinned mesh; the transform of the skinned mesh node MUST be ignored." [HIGH, K#joint-hierarchy, section 3.7.3.2]
- Armature world matrix is baked into bone node matrices and IBMs (`tree.py` 320-330 and `skins.py`), so armature scale/location is inside the joints. [HIGH]
- Mesh with Armature modifier not parented to the armature: exporter warns "Armature must be the parent of skinned mesh" and falls back to a name lookup (`tree.py` ~245-258). [HIGH]
- Non-skinned objects: normal node TRS. [HIGH] `nodes.py` ~72-74.
- Unapplied non-uniform scale on the armature combined with rotated children is the main decomposition risk. Recommended: apply all transforms on the armature before export and keep bones at unit scale. [MED, inference]

### 1.5 Export Deformation Bones Only and sockets / non-deform bones
- Filter: non-deform bones (`use_deform == False`) are removed, except that a non-deform bone that has non-bone children (e.g., a socket Empty parented to it) is kept. [HIGH] `tree.py` lines 718-738 (`node_filter_not_inheritable_is_kept`, comment: "Check if bone has some objected parented to bone. We need to keep it in that case").
- Removed nodes' kept children are re-parented to the nearest kept ancestor (`recursive_filter`, `tree.py` 675-716). Rest matrices come from `matrix_local`, so the rest pose should be preserved. [HIGH code; MED that the result is always correct]
- Skin joints = every BONE node left in the armature subtree after filtering (`get_all_bones`, `tree.py` 572-596; `skins.py` 82). So a kept non-deform bone (because of a socket) becomes a skin joint with no weights. [HIGH code; MED impact]
- Root bones for the armature are filtered by `use_deform` when def-only is on (`get_root_bones_uuid`, `tree.py` 598-611). [HIGH]
- `export_leaf_bone` (Add Leaf Bones) appends a tail node to each chain. Those nodes are BONE nodes under bones, so they also become skin joints (`tree.py` 839-898, `get_all_bones`). Keep OFF for game exports. [HIGH code; MED impact]

### 1.6 Animation and NLA / action modes
- Default `export_force_sampling = True` samples the evaluated pose every `export_frame_step` frames. Sampling reads `blender_bone.matrix` (evaluated pose, constraints included) per frame. [HIGH] `B+.../blender/exp/animation/sampled/sampling_cache.py` lines 359-402 (`armature_caching`).
- Keyframe path (sampling OFF) falls back to baking when bones have constraints: warning "Baking animation because of unsupported constraints acting on the bone". [HIGH] `B+.../blender/exp/animation/fcurves/channels.py` lines 352-380.
- Slot-aware: for ACTIONS mode the exporter reads `animation_data.action_slot` and iterates each action's slots, temporarily setting `action_slot` (`B+.../blender/exp/animation/action.py` ~385-640). [HIGH]
- `ACTIONS` default: active action plus NLA-strip actions are exported as separate glTF animations (`__init__.py` 734-752). [HIGH]
- For a single source of truth for a game clip set, prefer `ACTIONS` with `export_action_filter` on, or `ACTIVE_ACTIONS`, and keep unused actions out of the file or filtered. [MED, inference]
- Shape-key drivers and drivers that affect bones are evaluated and baked into sampled values (see Q2). [HIGH]

---

## Q2. What does NOT survive glTF export (runtime-unreliable features)

Summary table (verdict based on source absence + spec):

| Feature | Exported to glTF? | Evidence | Confidence |
|---|---|---|---|
| Armature modifier "Preserve Volume" (`use_deform_preserve_volume`, dual quaternion) | NO. glTF/three.js use linear blend skinning only. | No reference to `ARM_DEF_QUATERNION`/`preserve` in addon. Property: `rna_modifier.cc:3618-3621`, `rna_armature.cc:10752`. Spec glossary: "linear blend skinning". | HIGH |
| B-Bone segments / curved bones (`bbone_segments`) | NO. Joints are straight. | `grep bbone` in addon: 0 hits in `blender/exp`. Property: `rna_armature.cc:1560`. | HIGH (absence) |
| Bone constraints | Not as constraints. Results are baked into keys when sampling is on (default). | `sampling_cache.py:359-402`; `channels.py:373-377` | HIGH |
| Drivers (bones, objects, shape keys) | Not as drivers. Evaluated and baked as keys. Runtime game variables cannot drive them. | `animation/drivers.py`; `sampled/shapekeys/keyframes.py:34-35`; `animation/action.py:474-492` | HIGH (code) |
| Corrective Smooth modifier | NO as a modifier. With Apply Modifiers ON it is evaluated into a static rest mesh; no pose-dependent correction at runtime. | No corrective handling in addon; `nodes.py:297-305` | HIGH (not exported); MED (apply behaviour) |
| Armature modifier itself | No. Replaced by glTF skin (`skins`). | `tree.py:240-258`; spec 3.7.3 | HIGH |
| Shape keys on skinned mesh | YES as morph targets (`export_morph` default ON). Lost if Apply Modifiers is ON. | `__init__.py` 939-963 and 679-684 tooltip | HIGH |
| Shape key animation | YES as morph weight animation (`export_morph_animation` ON). | `__init__.py` 957-962 | HIGH |

Notes:
- Shape key drivers: when a shape key is driven, the exporter bakes its value (`keyframes.py` lines 34-35, "First, check if there are drivers on shapekeys"). [HIGH]
- three.js: morph targets combine with skinning. In `meshphysical` the vertex chunks run `begin_vertex` -> `morphtarget_vertex` -> `skinning_vertex`, so morph deltas are applied in rest space before skinning. [HIGH] `G+src/renderers/shaders/ShaderLib/meshphysical.glsl.js` lines 29-42; `G+src/renderers/shaders/ShaderChunk/morphtarget_vertex.glsl.js`; `skinning_vertex.glsl.js`.
- glTF morph weights are per-node (`node.weights`); three.js maps `weights` to `morphTargetInfluences` (`G+examples/jsm/loaders/GLTFLoader.js` PATH_PROPERTIES, ~line 2294). [HIGH]
- glTF spec: morph targets are supported; "The number of morph targets is not limited. Client implementations SHOULD support at least eight morphed attributes." [HIGH, K#morph-targets]

---

## Q3. Baking constraint-driven motion (nla.bake, slotted actions)

### 3.1 `bpy.ops.nla.bake` in 5.2.2
Source: `B+scripts/startup/bl_operators/anim.py` lines 191-337 (class `NLA_OT_bake`, `bl_idname = "nla.bake"`). [HIGH]
- `frame_start` (Int, default 1 in class; `invoke()` sets scene or preview range), `frame_end` (default 250 in class; `invoke()` sets it), `step` (1, 1-120).
- `only_selected` ("Only Selected Bones", default **True**): "Only key selected bones (Pose baking only)".
- `visual_keying` (default False): "Keyframe from the final transformations (with constraints applied)".
- `clear_constraints` (default False): "Remove all constraints from keyed object/bones. To get a correct bake with this setting Visual Keying should be enabled."
- `clear_parents` (default False), objects only.
- `use_current_action` ("Overwrite Current Action", default False): when False, a NEW action is created.
- `clean_curves` (default False).
- `bake_types` (ENUM_FLAG): `POSE`, `OBJECT`; `invoke()` sets `{'POSE'}` in pose mode else `{'OBJECT'}`.
- `channel_types` (ENUM_FLAG): `LOCATION`, `ROTATION`, `SCALE`, `BBONE`, `PROPS`; default is all five.
- Pitfall: with `only_selected` True and pose baking, `execute()` uses `context.selected_pose_bones`. If no bones are selected, it returns "Nothing to bake" (CANCELLED). Lines 292-296 and 311-320. [HIGH]
- Pitfall: `invoke()` opens a props dialog and sets the frame range. A scripted `execute` call must pass `frame_start` and `frame_end` explicitly, or it bakes frames 1-250. [HIGH]

Headless alternative (no GUI context needed): `bpy_extras.anim_utils.bake_action_objects(object_action_pairs, frames=..., bake_options=BakeOptions(...))`. `BakeOptions` fields: `only_selected, do_pose, do_object, do_visual_keying, do_constraint_clear, do_parents_clear, do_clean, do_location, do_rotation, do_scale, do_bbone, do_custom_props`. Source: `B+scripts/modules/bpy_extras/anim_utils.py` lines 53-90 (dataclass), 216-243 (`bake_action_objects`). [HIGH]

### 3.2 Slotted actions (Blender 4.4+; present in 5.2.2)
- Bake creates or reuses an action, and if `animation_data.action_slot` is unset, creates one with `action.slots.new(obj.id_type, old_slot_name or obj.name)` and assigns it. [HIGH] `anim_utils.py` ~474-489.
- It sets `atd.action_blend_type = 'REPLACE'` (~497-498) and ensures `action.layers[0].strips[0].channelbag(slot, ensure=True)` (`action_ensure_channelbag_for_slot`, lines 144-166). [HIGH]
- Keys are NOT on `action.fcurves`. They are on `ActionChannelbag.fcurves` (`rna_action.cc` ~2227), and the action exposes `slots` (~2425) and `layers` (~2439). A script must walk `action.layers[i].strips[j].channelbag(slot).fcurves`. Old `action.fcurves` access is legacy. [HIGH for Channelbag; MED that `Action.fcurves` is absent in Python]
- Slot matching: `animation_data.action_slot` must be a slot that belongs to the action and matches the ID type. Shape keys have their own `Key.animation_data.action_slot` (exporter `action.py` ~447, 565-578). [HIGH code]
- The 4.4 release notes say an action can fail to animate when a slot is not auto-assigned. Source: secondary coverage only (release notes page returned 403). [MED]
- Legacy actions converted on load get a "Legacy Slot" (per 4.4 coverage). [MED] Official page: `https://developer.blender.org/docs/release_notes/4.4/animation_rigging/` (403 from here, UNVERIFIED content).

### 3.3 Bake script checklist (derived)
1. Enter pose mode, or call `anim_utils.bake_action_objects` directly with `only_selected=False`.
2. Set `visual_keying=True` if constraints drive the bones.
3. Bake into a new action (`use_current_action=False`). Confirm `obj.animation_data.action_slot` is set.
4. Walk channelbags for that slot; do not use `action.fcurves`.
5. Make the action active (ACTIONS mode) or push to an NLA track (NLA_TRACKS), and optionally `clear_constraints=True` only after visual keying.
6. Set `frame_start` and `frame_end` explicitly.
(Steps 1-6 are derived from the source above; not runtime-tested. [MED])

---

## Q4. Automatic weights (Parent with Automatic Weights / bone heat)

### 4.1 Entry points
- Parent menu "With Automatic Weights" = `object.parent_set(type='ARMATURE_AUTO')` (enum `ARMATURE_AUTO`). [HIGH] `B+src/blender/editors/object/object_relations.cc` lines 490-495, 1037-1038.
- An "X Mirror" option is shown only for ENVELOPE and AUTO. [HIGH] same file ~1090-1093.
- Weight Paint menu "Assign Automatic from Bones" = `paint.weight_from_bones(type='AUTOMATIC')`; "Assign from Bone Envelopes" = `type='ENVELOPES'`. [HIGH] `B+scripts/startup/bl_ui/space_view3d.py` lines 3641-3642; operator `PAINT_OT_weight_from_bones` in `source/blender/editors/sculpt_paint/mesh/paint_vertex_weight_ops.cc`.

### 4.2 The failure message and what it means
- Exact string: `"Bone Heat Weighting: failed to find solution for one or more bones"`. [HIGH] `B+source/blender/editors/armature/meshlaplacian.cc` ~line 794.
- It is reported as a WARNING (`BKE_report(..., RPT_WARNING)`), not an error, and the parent operation still completes. [HIGH] `B+source/blender/editors/armature/armature_skinning.cc` ~lines 435-449.
- The loop over bones `break`s at the first failing bone (`meshlaplacian.cc` ~790-796). Bones after the failure get no solved weights; bones before it keep theirs. [HIGH code; MED on the partial-result consequence]
- Mechanism: for each bone, a cotangent-Laplacian is factorized with Eigen `SparseLU`; the solve reports failure when `sparseLU->info() != Eigen::Success` (`B+intern/eigen/intern/linear_solver.cc` ~267-330, `meshlaplacian.cc` ~335-342, ~686-710). So failure = factorization failure of the system matrix, typically a singular or ill-conditioned or NaN matrix. [HIGH mechanism]
- Geometry is transformed to WORLD space before solving (`armature_skinning.cc` ~420-428: `mul_m4_v3(ob->object_to_world(), verts[i])`). [HIGH]
- Distance tolerances are absolute world units: `DISTANCE_EPSILON 1e-4` (relative test `dist <= mindist * (1 + 1e-4)`, `meshlaplacian.cc` 353-356, 494), and `heat_set_H` uses `1 / mindist^2` (`meshlaplacian.cc` ~531). Tiny meshes or tiny armatures push these terms to extreme values. [HIGH code; MED inference that this causes the failure]
- Visibility uses a ray test with a normal check (`dot(n, vec) < -1e-5`, ~meshlaplacian.cc 375-392). Interior faces can change visibility. [HIGH code; LOW on how it fails]

### 4.3 Causes seen in the wild (not reproduced here)
- Tiny scale: Blender bug tracker issue #84609 "Automatic weights fails with small-scale mesh faces / armatures" (`https://projects.blender.org/blender/blender/issues/84609`). Seen in search snippet only. [MED]
- Non-manifold geometry, duplicate vertices, loose geometry: community guides and forum threads (e.g., `https://blenderartists.org/t/bone-heat-weighting-failed/1240324`, `https://blenderartists.org/t/partial-bone-heat-weighting/1176527`). [MED/LOW]
- Interior faces and disconnected islands: plausible (visibility and Laplacian singularity), not verified. [UNVERIFIED]
- Zero-length bones: not checked in code. [UNVERIFIED]

### 4.4 Accepted workarounds (community; none confirmed upstream)
- Clean first: Merge by Distance, Degenerate Dissolve, Delete Loose, then Select > Select All by Trait > Non Manifold (vertex select mode). Source: `https://app.cinevva.com/guides/blender-weight-painting-problems` (LOW, blog).
- Temporary scale up, then apply weights, then scale both down (mesh and armature together): issue #84609 workaround (MED). Practical factor: x10 to x100 (community numbers, UNVERIFIED for this build).
- Rig on a simplified or unsubdivided copy, then transfer weights back with Data Transfer (forum, LOW).
- Apply rotation and scale on both mesh and armature before parenting (forum, MED).
- Envelope weights as a fallback, then manual cleanup (MED).
- Paid add-ons (WeightMend, etc.) claim to bypass the solver; marketing material, not evidence. [LOW]

### 4.5 Data Transfer modifier for weights
- Modifier type `DATA_TRANSFER`; `data_types_verts` includes `'VGROUP_WEIGHTS'` (`B+source/blender/makesrna/intern/rna_modifier.cc` ~7499). [HIGH]
- `vert_mapping` values (`rna_modifier.cc` 586-616, default `NEAREST`): `TOPOLOGY` (identical topology only), `NEAREST` (closest vertex), `EDGE_NEAREST`, `EDGEINTERP_NEAREST`, `POLY_NEAREST` (closest vertex of closest face), `POLYINTERP_NEAREST` (interpolated over closest face), `POLYINTERP_VNORPROJ` (normal projection onto face). [HIGH]
- For clothing with different topology, the usual choice is `POLYINTERP_NEAREST` ("Nearest Face Interpolated"), then fix with normalize/limit operators. [LOW, community practice, UNVERIFIED here]

### 4.6 Vertex group operators (object_vgroup.cc, 5.2.2)
- `object.vertex_group_limit_total(limit=4, group_select_mode=...)`: "Limit deform weights associated with a vertex to a specified number by removing lowest weights." `limit` range 1-32, default 4. [HIGH] `B+source/blender/editors/object/object_vgroup.cc` (operator defined ~3690-3720 region; `vertex_group_limit_total_exec`). It removes lowest weights; I did not see a normalization inside the operator, so follow with `normalize_all`. [HIGH for removal; MED for no-normalize]
- `object.vertex_group_normalize_all(lock_active=True)`: "so that for each vertex, the sum of all weights is 1.0". [HIGH] same file.
- `object.vertex_group_clean(limit=0.0, keep_single=False, group_select_mode=...)`: remove weights <= `limit` (0.0-0.99); `keep_single` keeps a vertex in at least one group. [HIGH]
- `object.vertex_group_smooth(factor=0.5, repeat=1 (1-200), expand=0.0, ...)`: for selected vertices. [HIGH]
- `object.vertex_group_mirror(mirror_weights=True, flip_group_names=True, all_groups=False, use_topology=False)`. Spatial mirror by default. `use_topology` tooltip: "Use topology based mirroring (for when both sides of mesh have matching, unique topology)". [HIGH]. The operator reports mirrored vs failed counts via `ED_mesh_report_mirror` (`object_vgroup.cc` ~3705). Exact failure behaviour on non-symmetric topology: vertices with no mirror partner are counted as failures; exact messages UNVERIFIED. [MED]
- Recommended order for a game skin: `limit_total(4)` -> `normalize_all` -> `clean(limit small)` -> check counts with `group_select_mode`. [MED, derived]

---

## Q5. Bone name flipping (`L_Thigh` / `R_Thigh`)

Source: `B+source/blender/blenlib/intern/string_utils.cc`, `BLI_string_flip_side_name` (lines ~297-400), separator test `is_char_sep` (lines 243-246). [HIGH]
- Separators: `'.'`, `' '`, `'-'`, `'_'`.
- Rule A (suffix): last separator + `l`/`r`/`L`/`R` flips (e.g., `Thigh.L` <-> `Thigh.R`; `Thigh_l` <-> `Thigh_r`).
- Rule B (prefix): first char `l`/`r`/`L`/`R` followed by a separator flips (e.g., `L_Thigh` <-> `R_Thigh`, `L.Thigh`, `L-Thigh`, `L Thigh`). **So the prefix style is supported.** Rule B is the case `name[1]` is a separator.
- Rule C (words): "left"/"right" (Left/Right, LEFT/RIGHT) at the start or end, for names longer than 5 characters.
- A trailing `.NNN` number is stripped before matching (keeps the number on the result when `strip_number` is false).
- Names shorter than 3 characters are not flipped (`if (len < 3) return`).
- Non-flips: `Lower_Arm` (`name[1]` is `o`, not a separator), `LThigh`.
- Manual "Naming Conventions" page: `https://docs.blender.org/manual/en/latest/` (exact page UNVERIFIED; manual unreachable).
- Scope: this function is the name-flip used by flip-name logic (e.g., vertex-group mirror `flip_group_names`, `object_vgroup.cc` `vgroup_mirror` flip path). Bone Symmetrize/Mirror also use name flipping, but I did not trace that call site. [MED]

---

## Q6. Bone roll

- `armature.calculate_roll(type=..., axis_flip=False, axis_only=False)` ("Recalculate Roll", `ARMATURE_OT_calculate_roll`, `B+source/blender/editors/armature/armature_edit.cc` 462-480). [HIGH]
- Types (`armature_edit.cc` 254-275): `POS_X` "Local +X Tangent" (default), `POS_Z` "Local +Z Tangent", `GLOBAL_POS_X/Y/Z`, `NEG_X` "Local -X Tangent", `NEG_Z` "Local -Z Tangent", `GLOBAL_NEG_X/Y/Z`, `ACTIVE`, `VIEW`, `CURSOR`. [HIGH]
- `EditBone.roll` (float, `rna_armature.cc:1866`). [HIGH]
- `EditBone.align_roll(vector)`: C method, not located in the checked-out source. Used in `B+scripts/modules/_bpy_types.py` lines 646-675 (`transform()` calls `self.align_roll(matrix @ z_vec)`) and in the glTF importer `B+scripts/addons_core/io_scene_gltf2/blender/imp/node.py:222` (`editbone.align_roll((arma_mat @ Vector((0,0,1)) - editbone.head).normalized())`). So the vector is a direction and the call aligns the bone's local +Z toward it. [HIGH for usage; MED for exact semantics]
- `EditBone.align_orientation(other)` copies direction and roll (`_bpy_types.py` 634-643). [HIGH]
- glTF has no roll field. Roll is inside `matrix_local`, so it is exported as the joint's rest rotation (rest TRS, `tree.py` rest branch). It survives as the orientation of the joint's local X and Z, not as separate data. [HIGH code; MED semantics]
- Hinge convention: which roll gives "local X = hinge" is a project convention. Not verified from official docs. Check with a bend test in pose mode after `calculate_roll`. [UNVERIFIED as best practice]

---

## Q7. Bone collections, 5.x API changes, Rigify

### 7.1 Bone collections and colours (5.2.2 RNA)
- `Armature.collections`, `Armature.collections_all`, `Bone.collections` (`B+source/blender/makesrna/intern/rna_armature.cc` 1743, 1841, 2227, 2246). [HIGH]
- No legacy `Bone.layers` property in `rna_armature.cc` for 5.2.2. [HIGH for absence]. The 4.0 bone-layer replacement itself: [MED] (release notes not reachable).
- Bone colour: `Bone.color` / `PoseBone.color` (`rna_armature.cc` 1418). Operator `armature.copy_bone_color_to_selected` (`anim.py` 473-560). Collection ops: `armature.collection_show_all`, `collection_unsolo_all`, `collection_remove_unused` (`anim.py` 564-640). [HIGH]
- `Bone.use_deform` (`rna_armature.cc` 1459). [HIGH]

### 7.2 Inherit scale (affects glTF exportability)
- `Bone.inherit_scale` enum (`rna_armature.cc` 1347-1365): `FULL` (all parent scale), `FIX_SHEAR` (remove shear), `ALIGNED` (rotate non-uniform parent scale), `AVERAGE`, `NONE` (ignore parent scale), plus legacy. [HIGH]
- Non-uniform scale modes can create shear, which glTF TRS cannot represent (see Q1.3). Keep game rigs at `FULL` with no non-uniform scale, or `NONE` where scale is not needed. [MED]

### 7.3 Bundled add-ons in 5.2.2
- Add-ons under `scripts/addons_core/` at `v5.2.2`: `bl_pkg, hydra_storm, io_anim_bvh, io_curve_svg, io_mesh_uv_layout, io_scene_fbx, io_scene_gltf2, node_wrangler, pose_library, rigify, ui_translate, viewport_vr_preview`. [HIGH] (`git ls-tree` on the tag)
- Rigify is still bundled in 5.2.2 (`scripts/addons_core/rigify`, version (0.6.10)). It is NOT an extension in this build. [HIGH]
- Pose Library is bundled (`pose_library`). [HIGH]

### 7.4 Release-note changes (secondary; official pages not reachable)
- 5.0 animation & rigging (official URL `https://developer.blender.org/docs/release_notes/5.0/animation_rigging/`, content seen via search snippet, [MED]): Geometry Attribute constraint; bone custom shape options "Affect Gizmo" and "Use As Pivot"; shape-key UI overhaul; armature instances keep visibility and selection separate.
- 5.2 animation & rigging (`https://developer.blender.org/docs/release_notes/5.2/animation_rigging/`, snippet [MED]): Copy Constraints option in Ctrl+L Link/Transfer Data menu; Duplicate and Rename operator in armature edit mode; Auto IK reverse behaviour can activate with a non-connected parent; "Only Insert Available" default ON; Dope Sheet select-by-type.
- 5.1: bugfix-heavy; no feature list found. Bugfix page: `https://developer.blender.org/docs/release_notes/5.1/bugfixes/` (snippet, [MED]).
- Slotted actions (4.4): see Q3.2.
- Third-party "5.2 LTS shipped July 14, 2026" claim: [LOW], not verified.

### 7.5 Rigify: DEF bones, chains, and export
- Deform flag: `bone.use_deform = name.startswith(DEF_PREFIX)` for generated bones; `DEF_PREFIX = "DEF-"`, `ORG_PREFIX = "ORG-"`, `MCH_PREFIX = "MCH-"` (`B+scripts/addons_core/rigify/generate.py` ~400-416; `utils/naming.py` 18-20). [HIGH]
- Chains: `parent_bone_chain` links bones pairwise and does not parent the first bone (`rigify/utils/bones.py` 490-496). So DEF chains are internally linked, but the parent of the first DEF in each chain is rig-specific (`rigs/basic/copy_chain.py` 63-75 and the chain rigs). [HIGH code]
- Forum reports: some DEF bones are attached to ORG bones, so def-only export still keeps extra bones or leaves several roots. Source: `https://devtalk.blender.org/t/rigify-parent-bones-of-some-def-bones/14745` [MED].
- Proposed fix: Blender add-ons PR `https://projects.blender.org/blender/blender-addons/pulls/104644` (parent all deform bones per metarig). Merge status UNVERIFIED. [MED]
- Multiple roots under the armature node are allowed by glTF (joints need a common ancestor; the armature node can serve), but the armature object cannot be removed (Q1.1). [HIGH for exporter rule; spec: "Each skin's joints MUST have a common parent node (direct or indirect) called common root" K#skins-overview]
- Clean game-rig path, derived from the above: (1) generate Rigify; (2) verify DEF-only parent tree; (3) export with `export_def_bones=True` and sampling ON; (4) count root bones; (5) add a clean non-deform empty only if needed (it becomes a joint). [MED]

---

## Q8. three.js side (r186)

### 8.1 Influences
- The built-in skinning shader uses one `skinIndex` vec4 and one `skinWeight` vec4 (four bones) and the chunks `skinbase_vertex` (`boneMatX..W`) and `skinning_vertex`. [HIGH] `G+src/renderers/shaders/ShaderChunk/skinbase_vertex.glsl.js`, `skinning_vertex.glsl.js`.
- GLTFLoader maps only `WEIGHTS_0 -> skinWeight` and `JOINTS_0 -> skinIndex`. Other `JOINTS_n`/`WEIGHTS_n` fall through to lowercased names that the skinning shader never reads. So with `export_influence_nb > 4` or `export_all_influences`, the extra influence sets are silently ignored. [HIGH code; MED impact] `G+examples/jsm/loaders/GLTFLoader.js` lines 2276-2289 (`ATTRIBUTES`), 1974-1990.
- Practical rule: keep 4 influences, renormalized, in Blender before export (Q4.6). The exporter's default already does this. [MED]

### 8.2 Normalization
- `SkinnedMesh.normalizeSkinWeights()` divides each vertex's skinWeight by its Manhattan length; zero-sum vertices become `(1,0,0,0)`. [HIGH] `G+src/objects/SkinnedMesh.js` lines 262-285.
- GLTFLoader calls it for every SkinnedMesh it creates, "to fix malformed assets". [HIGH] `GLTFLoader.js` ~3926-3928.
- glTF spec: weights should sum near 1 (float); normalized integer weights must sum to 255/65535 before normalization. [HIGH, K#skinned-mesh-attributes]

### 8.3 Bind matrix / bindMode
- `SkinnedMesh.bindMode` defaults to `AttachedBindMode`. In attached mode `bindMatrixInverse = inverse(mesh.matrixWorld)` each frame. [HIGH] `G+src/objects/SkinnedMesh.js` lines 60-70, 294-300.
- GLTFLoader binds each skinned mesh with `mesh.bind(skeleton, _identityMatrix)`. [HIGH] `GLTFLoader.js` ~4297.
- Derived consequence: because `bindMatrixInverse` cancels the mesh's world matrix, the SkinnedMesh object's own transform does not move the rendered vertices. Move the glTF root (`gltf.scene`, the group holding the bones), not the SkinnedMesh. This matches the glTF rule that the skinned mesh node transform is ignored. [MED, derived from code; verify at runtime]

### 8.4 Multiple skins
- `GLTFLoader.loadSkin(skinIndex)` builds a `Skeleton` per skin (`GLTFLoader.js` 4052-4111). Each skinned node gets its skin's skeleton (`~4280-4300`). Several skins per file are supported. [HIGH]
- Skin `skeleton` property: not checked. [UNVERIFIED]

### 8.5 Bone scale
- `Skeleton.update()` uses `bone.matrixWorld` times `boneInverses[i]`, so the full matrix including scale is used. [HIGH] `G+src/objects/Skeleton.js` lines 200-216.
- glTF `scale` channels are mapped to `scale` (`GLTFLoader.js` PATH_PROPERTIES ~2291-2296). So animated bone scale plays back. [HIGH]
- Caveat: non-uniform scale inherited through the parent chain can make normals wrong in the built-in shader (not traced). [UNVERIFIED]

### 8.6 WebGPU
- I did not locate the r186 WebGPU skinning/morph node files (`src/nodes/accessors/SkinningNode.js` and `MorphNode.js` returned 404 at that path). WebGPU behaviour of Q8.1-8.5 is UNVERIFIED. [UNVERIFIED]

### 8.7 glTF spec rules for skins
- Weight/joint rules: `K#skinned-mesh-attributes` (3.7.3.3): no negative weights; one non-zero weight per joint per vertex; unused joints should be 0; JOINTS_n and WEIGHTS_n set counts match; "Client implementations MAY support only a single set of up to four weights and joints, however not supporting all weight and joint sets present in the file may have an impact on the asset's animation." [HIGH]
- Joint hierarchy and skinned mesh node rule: `K#joint-hierarchy` (3.7.3.2). [HIGH]
- inverseBindMatrices: MAT4 floats, fourth row `[0,0,0,1]`, same order as `skin.joints`: `K#skins-overview` (3.7.3.1). [HIGH]

---

## Corrections and caveats found during the research

- A summary of the glTF-Blender-IO `main` branch stated a minimum Blender of 5.3.0. The bundled 5.2.40 add-on in `v5.2.2` declares 5.2.0 (`__init__.py:11`). Use the bundled file for 5.2.2. [HIGH]
- An earlier search summary said "Bone Heat Weighting ... no guaranteed fix"; the cause list above is from the solver code plus community reports, not a reproduction. [MED]
- "Export only deformation bones" has existed since 2019 and was made usable without sampling in 2022 (commit history, `https://developer.blender.org/rBAb9b1814a4c26f73aae7f306c9ff2e21b7b7bdcee`, snippet [MED]). The current UI requires sampling for def-only (Q1.1).
- Official manual, release notes, and Python API pages were unreachable. The Python API signatures here come from the Blender source (`bpy` RNA and operator definitions), not the rendered docs.

## What I could NOT verify

- Blender manual pages: the glTF export page, the Naming Conventions page, the armature/rigging pages (403).
- Official 4.4 / 5.0 / 5.2 release-note text (403); only search snippets.
- Exact `EditBone.align_roll` C implementation (not located).
- WebGPU skinning and morph node paths in three.js r186.
- Whether `vertex_group_limit_total` normalizes internally (only the removal path was read).
- Runtime behaviour of: Rest-OFF exports, mesh object scale under non-uniform parent scale, def-only with sockets, and the three.js root-vs-mesh move claim (all need a round-trip test).
- Heat-weighting failure triggers (islands, interior faces, zero-length bones): only the mechanism is verified.

---

## Implications for an automated rigging skill

1. Export with `export_skins=True`, `export_all_influences=False`, `export_influence_nb=4`, `export_yup=True`, `export_rest_position_armature=True`, `export_leaf_bone=False`. Only deform bones are needed for runtime, so `export_def_bones=True`, with `export_force_sampling=True` (the UI requires it).
2. Clean weights in Blender before export: `vertex_group_limit_total(limit=4)`, then `vertex_group_normalize_all()`, then `vertex_group_clean(limit≈0.001)`. The exporter's own renormalization is not a substitute for a deliberate top-4 cut.
3. Apply all transforms on the armature and skinned meshes; keep armature scale uniform and bones at unit scale; mesh should be a child of the armature (or the exporter falls back to a name lookup).
4. Do not rely on Preserve Volume, B-Bone segments, Corrective Smooth, bone constraints, or drivers at runtime. Bake them to keys in Blender first (sampling does this automatically for the export; `visual_keying=True` for explicit bakes).
5. Baking: use `bpy_extras.anim_utils.bake_action_objects` with `BakeOptions(...)` for headless baking, or `bpy.ops.nla.bake` with explicit `frame_start`/`frame_end` and selected pose bones. Never rely on the dialog defaults (frame 1-250; only selected bones).
6. Slotted actions (4.4+): walk `action.layers[i].strips[j].channelbag(slot).fcurves` for the object's slot; check `obj.animation_data.action_slot` before and after baking; never touch `action.fcurves`.
7. Use `export_animation_mode='ACTIONS'` (or `NLA_TRACKS`) with `export_action_filter` so only intended clips are exported. Do not use `export_nla_strips` (it does nothing).
8. Automatic weights: run `object.parent_set(type='ARMATURE_AUTO')` only after clean topology (merge by distance, dissolve degenerates, delete loose, no non-manifold). Check the operator's warning string: if `Bone Heat Weighting: failed to find solution` appears, the bones after the failing one have no solved weights; rerun on a temporarily scaled copy (x10-x100) and transfer back, or fall back to envelope + manual weights.
9. Verify weights after parenting: count vertices with zero total weight, and per-bone weight coverage, before export. Use `vertex_group_mirror(use_topology=...)` only on verified symmetric topology and read the mirrored/failed counts.
10. Name bones with `L_`/`R_` prefixes or `.L`/`.R` suffixes: both are flipped by `BLI_string_flip_side_name`. Avoid names like `Lower_` where a leading `L`+separator pattern is ambiguous.
11. Set bone roll explicitly with `armature.calculate_roll` (type chosen per limb) or `EditBone.align_roll(vector)`, then test with a bend in pose mode. Roll survives only as the joint's rest rotation.
12. Rigify: use DEF- bones for deform (they set `use_deform` by prefix), but verify the DEF parent tree (roots and chain links) after generation. Expect multiple roots; the armature node stays in the file in that case.
13. Keep scale inheritance at FULL/NONE and avoid shear-producing modes on game rigs (glTF TRS cannot store shear).
14. three.js: keep 4 influences per vertex, rely on GLTFLoader's normalizeSkinWeights, and treat extra JOINTS_n/WEIGHTS_n as ignored. Move the glTF root (`gltf.scene`), not the SkinnedMesh.
15. Shape keys export as morph targets (keep Apply Modifiers OFF to keep them); morph is applied before skinning in three.js, so corrective shape keys work in rest space. Test WebGPU separately (unverified).

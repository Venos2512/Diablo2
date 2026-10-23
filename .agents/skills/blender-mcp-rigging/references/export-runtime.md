# Export and runtime parity (S8)

Facts are from the Blender 5.2.2 bundled glTF add-on 5.2.40 and three.js r186 source (`research/01` Q1, Q2, Q8). This step makes a
**test** GLB for checks. Release export happens at R8 in the animation session (`blender-game-animation`).

## Exporter arguments (fixed)

```python
bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB', use_selection=True,      # runtime armature + mesh only
    export_yup=True, export_apply=False,                         # keep shape keys; modifiers are not applied
    export_skins=True, export_all_influences=False, export_influence_nb=4,
    export_rest_position_armature=True, export_leaf_bone=False,
    export_def_bones=False,                                      # the runtime armature has export bones only (see sockets)
    export_hierarchy_flatten_bones=False, export_armature_object_remove=False,
    export_animations=False)                                     # no clips at R4
```

What the exporter does:
- drops weights ≤ 0.0001, keeps the 4 largest, renormalizes;
- **skips vertex groups that do not match a bone**. A vertex left with no weight is bound to an added **neutral joint** at the armature
  root, which is an extra joint;
- with `export_def_bones=True`, removes non-deform bones that have no non-bone children, so unweighted socket bones disappear. Keep
  sockets in an export-only runtime armature and leave the option off;
- `export_leaf_bone=True` adds tail joints. Keep it off;
- keeps the roll only as the joint rest rotation; there is no roll field;
- `inherit_scale` modes other than FULL/NONE can create shear that glTF TRS cannot store.

## Never reaches the game

DQS (Preserve Volume), B-Bone segments, bone constraints, drivers and Corrective Smooth. Constraints and drivers are baked when
animation is sampled; that is R8's job. Shape keys do export as morph targets, and three.js applies morphs before skinning.

## Checks

1. `QA_CHECKLIST.md` A1.1–A1.14 (D01 `tools/v1_validate.py` is the reference implementation). A1.14 "scale = 1" on the
   reimported bones uses a tolerance of 1 ± 5e-5:
   - The exporter's float noise peaks at 3.61e-5, measured over 4812 bone directions; the worst bones point about 6.3° from straight
     down, and the derived bound is 3.7e-5.
   - Under the old tolerance FL failed this check on noise alone (I4).
   - A real scale error is far larger than 5e-5.
2. Extra checks:
   - no orphan vertex groups;
   - no vertex whose only groups are non-bone groups;
   - joint count = runtime bone count (no neutral or leaf joints);
   - only `root` at the top under the armature node.
3. **Clean reimport:** copy the GLB to a fresh folder, import it into an empty scene, and compare:
   - bone count, names and rest matrices (≤ 1e-5);
   - weights (≤ 1e-6 after the same top-4 rule);
   - textures (byte hash);
   - the sampled ROM poses: the same pose on the reimported armature vs the QA evaluation state, with distance ≤ 1e-4 m × H/1.8.
     Skip seam duplicates and compare by welded position, not by raw vertex index.
4. **Material note:** the exporter drops some original Tripo extensions (D01: `KHR_materials_volume` and default `specularFactor`).
   Record it. Textures must stay byte-identical.
5. **Optional three.js parity:**
   - load the GLB in the lab through `chrome-devtools` and pose the same bones;
   - read back the skinned positions (CPU skinning of the same formula, or a readback);
   - compare with Blender at ≤ 1 mm × H/1.8;
   - do it on WebGL **and** WebGPU, because WebGPU skinning is unverified.

## three.js facts to remember

- Only `JOINTS_0`/`WEIGHTS_0` are read (4 influences). Extra sets are silently ignored.
- GLTFLoader calls `normalizeSkinWeights()`.
- `bindMode` is attached and the bind matrix is identity from GLTFLoader. Move `gltf.scene` (the bones' root), not the SkinnedMesh.
- Bone scale is supported, but avoid scale animation except deliberate squash (`SKELETON_STANDARD.md` §6).

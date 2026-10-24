"""INTERMEDIATE review export (NOT the R8 release): bake the control rig's evaluated motion onto D01_runtime and write a GLB
for the lab Character test. The .blend is NOT saved (in-memory bake only).

  blender -b <anim .blend> -P bake_review_glb.py -- --out <review.glb>
"""
import json
import os
import sys

import numpy as np

import bpy
from mathutils import Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "tools"))
import d01_rigkit as K  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
OUT = args[args.index("--out") + 1]
CLIPS = ["idle", "walk", "run", "attack", "hit", "death"]
sc = bpy.context.scene
ct, rt, mesh = K.control(), K.runtime(), K.get_mesh()
order = []


def walk(b):
    order.append(b)
    for c in b.children:
        walk(c)


for b in rt.data.bones:
    if b.parent is None:
        walk(b)
rest = {b.name: np.array(b.matrix_local) for b in rt.data.bones}
parent = {b.name: (b.parent.name if b.parent else None) for b in rt.data.bones}

# keep the control actions out of the way (names) and bake each clip
for nm in CLIPS:
    bpy.data.actions[nm].name = f"ctl_{nm}"
baked = {}
for nm in CLIPS:
    ca = bpy.data.actions[f"ctl_{nm}"]
    ct.animation_data.action = ca
    ct.animation_data.action_slot = ca.slots[0]
    f0, f1 = int(ca.frame_start), int(ca.frame_end)
    ra = bpy.data.actions.new(nm)
    rt.animation_data_create()
    rt.animation_data.action = ra
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    for f in range(f0, f1 + 1):
        sc.frame_set(f)
        dg = bpy.context.evaluated_depsgraph_get()
        ev = rt.evaluated_get(dg)
        M = {b.name: np.array(ev.pose.bones[b.name].matrix) for b in order}
        for b in order:
            n = b.name
            p = parent[n]
            rel = rest[n] if p is None else np.linalg.inv(rest[p]) @ rest[n]
            Pp = np.eye(4) if p is None else M[p] @ np.linalg.inv(rest[p])  # pose_parent @ rest_parent^-1
            basis = np.linalg.inv(Pp @ rest[n]) @ M[n] if p is not None else np.linalg.inv(rest[n]) @ M[n]
            pb = rt.pose.bones[n]
            m = Matrix(basis.tolist())
            pb.rotation_mode = "QUATERNION"
            pb.location = m.to_translation()
            pb.rotation_quaternion = m.to_quaternion()
            pb.scale = (1, 1, 1)
            pb.keyframe_insert("location", frame=f, group=n)
            pb.keyframe_insert("rotation_quaternion", frame=f, group=n)
    ra.use_frame_range = True
    ra.frame_start, ra.frame_end = f0, f1
    baked[nm] = (f0, f1)
    rt.animation_data.action = None
# runtime follows its own keys now: mute the control constraints, push every clip to an NLA track named after the clip
for pb in rt.pose.bones:
    for c in pb.constraints:
        c.mute = True
ct.animation_data.action = None
for nm in CLIPS:
    ra = bpy.data.actions[nm]
    tr = rt.animation_data.nla_tracks.new()
    tr.name = nm
    st = tr.strips.new(nm, 0, ra)  # strip starts at frame 0 so the exported clip times start at 0 s
    st.name = nm
rt.animation_data.action = None
for o in bpy.data.objects:
    o.select_set(False)
rt.hide_set(False)
rt.hide_viewport = False
mesh.select_set(True)
rt.select_set(True)
bpy.context.view_layer.objects.active = rt
sc.frame_set(1)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_animations=True, export_animation_mode="NLA_TRACKS",
                          export_skins=True, export_def_bones=False, export_yup=True, export_apply=False, export_cameras=False, export_lights=False,
                          export_extras=False, export_image_format="AUTO")
print("[bake] wrote", OUT, os.path.getsize(OUT), "bytes; clips", baked)

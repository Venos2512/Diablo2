"""Diagnostic: smallest ctl_loincloth_front world-X angle that clears the thighs, per frame of the given clips (on the anim .blend).
  blender -b <anim .blend> -P loin_diag.py -- --out <json> [--clips walk,run,death] [--step 5]
"""
import json
import math
import os
import sys

import numpy as np

import bpy
from mathutils import Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "tools"))
import d01_rigkit as K  # noqa: E402
import d01_measure as M  # noqa: E402
import r6_build as B  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
opt = {args[i].lstrip("-"): args[i + 1] for i in range(0, len(args), 2)}
CLIPS = opt.get("clips", "walk,run").split(",")
STEP = float(opt.get("step", 5))
ct = K.control()
sc = bpy.context.scene
cx = M.Ctx()
base = M.flap_vs_body(cx, K.rest_positions())
rest = {b.name: np.array(b.matrix_local) for b in ct.data.bones}
Rr = {k: v[:3, :3] for k, v in rest.items()}


def flex(side):
    pb = ct.pose.bones[f"ctl_{side}_Thigh"]
    d = np.array(pb.matrix)[:3, :3] @ np.array([0, 1.0, 0])
    d0 = Rr[f"ctl_{side}_Thigh"] @ np.array([0, 1.0, 0])
    a = lambda v: math.atan2(v[1], -v[2])
    return a(d0) - a(d)


def set_loin(theta):
    Rp = np.array(ct.pose.bones["ctl_pelvis"].matrix)[:3, :3]
    rel = Rp @ Rr["ctl_pelvis"].T @ Rr["ctl_loincloth_front"]
    Rw = B.rotx(theta) @ Rr["ctl_loincloth_front"]
    q = Matrix((rel.T @ Rw).tolist()).to_quaternion()
    pb = ct.pose.bones["ctl_loincloth_front"]
    pb.rotation_mode = "QUATERNION"
    pb.rotation_quaternion = q
    bpy.context.view_layer.update()


out = {}
for nm in CLIPS:
    act = bpy.data.actions[nm]
    ct.animation_data.action = act
    ct.animation_data.action_slot = act.slots[0]
    rows = []
    for f in range(int(act.frame_start), int(act.frame_end) + 1):
        sc.frame_set(f)
        fl = max(flex("L"), flex("R"), 0.0)
        keyed = ct.pose.bones["ctl_loincloth_front"].rotation_quaternion.copy()
        clear = None
        for deg in np.arange(0, 75, STEP):
            set_loin(-math.radians(deg))
            d = M.flap_delta(M.flap_vs_body(cx, K.eval_mesh_positions()), base)
            if d["new_inside_vertices_thigh"] == 0 and d["new_intersecting_triangles_thigh"] == 0 and d["new_covered_by_thigh_vertices"] == 0:
                clear = float(deg)
                break
        rows.append({"frame": f, "flex_deg": math.degrees(fl), "clear_deg": clear})
        print("[loin]", nm, f, round(math.degrees(fl), 1), clear, flush=True)
    out[nm] = rows
with open(opt["out"], "w", encoding="utf-8", newline="\n") as fh:
    json.dump(out, fh, indent=1)

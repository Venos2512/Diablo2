"""R5 (buoc Blender): render anh QA THAT tu D01_hodling_rig.blend (Workbench, anh sang trung tinh, mau = texture goc) + du lieu chieu/bone cho lop phu.
KHONG luu .blend nguon; moi thay doi (mau dinh, camera) chi o bo nho. Raw -> rig/qa/_raw/<tag>/ ; q2_compose.py ghep nhan.

Chay: blender -b --factory-startup -P q1_render.py -- <tag> [skel|weights|bones|poses|regions ...]   (khong dung muc = tat ca)
"""
import json
import os
import sys

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C
import d01_poses as P
import d01_render as R
import d01_rigkit as K
import d01_wviz as V

a = C.script_args()
TAG = a[0]
WHAT = set(a[1:]) or {"skel", "weights", "bones", "poses", "regions"}
RAW = os.path.join(C.QA, "_raw", TAG)
os.makedirs(RAW, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
ct, rt, me = K.control(), K.runtime(), K.get_mesh()
K.reset_pose(ct)
sc = R.setup_scene(1600)
cam = R.make_camera(sc)
mesh = me.data
n = len(mesh.vertices)
vgn = [g.name for g in me.vertex_groups]
Wd = np.zeros((n, len(vgn)))
for v in mesh.vertices:
    for g in v.groups:
        Wd[v.index, g.group] = g.weight
rest = K.rest_positions()
sc.render.film_transparent = False
INFO = {"tag": TAG, "views": {}, "bones": {}, "weights_names": vgn}


def bone_data():
    out = {}
    for pb in rt.pose.bones:
        h, t = K.world_pose_head_tail(rt, pb.name)
        out[pb.name] = {"head": list(h), "tail": list(t), "parent": pb.parent.name if pb.parent else None,
                        "deform": bool(pb.bone.use_deform), "kind": "socket" if pb.name in P_SOCKETS else ("aux" if pb.name in P_AUX else "core")}
    return out


P_SOCKETS = {"R_weapon_attach", "L_weapon_attach", "fx_head", "fx_chest", "fx_hand_R", "fx_hand_L", "hit_origin", "ground"}
P_AUX = {"helmet", "sack", "loincloth_front", "L_ear", "R_ear"}


def ctl_data():
    out = {}
    for pb in ct.pose.bones:
        h, t = K.world_pose_head_tail(ct, pb.name)
        out[pb.name] = {"head": list(h), "tail": list(t), "parent": pb.parent.name if pb.parent else None}
    return out


def set_colors(col):
    ca = mesh.color_attributes.get("qa") or mesh.color_attributes.new("qa", "FLOAT_COLOR", "POINT")
    rgba = np.ones((n, 4))
    rgba[:, :3] = col
    ca.data.foreach_set("color", rgba.ravel())
    mesh.color_attributes.active_color = ca
    mesh.color_attributes.render_color_index = list(mesh.color_attributes.keys()).index("qa")


def mode_texture(xray=0.0):
    sh = sc.display.shading
    sh.color_type = "TEXTURE"
    sh.light = "STUDIO"
    sh.show_xray = xray > 0
    sh.xray_alpha = xray if xray > 0 else 0.5


def mode_vertex():
    sh = sc.display.shading
    sh.color_type = "VERTEX"
    sh.light = "FLAT"
    sh.show_xray = False


def fit(positions, margin=1.18):
    mn, mx = positions.min(0), positions.max(0)
    c = (mn + mx) / 2
    ext = (mx - mn).max() * margin
    return tuple(c), ext


def shoot(view, center, scale, name, res=None):
    if res:
        sc.render.resolution_x = sc.render.resolution_y = res
    path = os.path.join(RAW, name + ".png")
    pr = R.render_view(cam, view, center, scale, path)
    INFO["views"][name] = pr
    return pr


VIEWS = ("front", "side", "back")
cen, ext = fit(rest, 1.25)
cen = (0.0, 0.0, 0.25)
ext = 0.78

# ---------------------------------------------------------------- skeleton tren model that (x-ray)
if "skel" in WHAT:
    INFO["bones"]["rest_runtime"] = bone_data()
    INFO["bones"]["rest_control"] = ctl_data()
    mode_texture(0)
    for v in VIEWS:
        shoot(v, cen, ext, f"skel_plain_{v}", 2000)

# ---------------------------------------------------------------- ban do trong so tong the
if "weights" in WHAT:
    mode_vertex()
    set_colors(V.vertex_colors(Wd, vgn, "dominant"))
    for v in VIEWS:
        shoot(v, cen, ext, f"w_dominant_{v}", 1600)
    set_colors(V.vertex_colors(Wd, vgn, "blend"))
    for v in VIEWS:
        shoot(v, cen, ext, f"w_blend_{v}", 1600)
    # so influence tren moi dinh (1..4)
    nz = (Wd > 1e-6).sum(1)
    pal = {1: (0.25, 0.25, 0.9), 2: (0.2, 0.8, 0.3), 3: (0.95, 0.8, 0.1), 4: (0.95, 0.2, 0.2)}
    set_colors(np.array([pal[int(k)] for k in nz]))
    for v in VIEWS:
        shoot(v, cen, ext, f"w_influences_{v}", 1600)
    # mau theo vung/lop (nhan R3: than, tui, gach, mu...) khong co trong .blend nguon; bo qua
    INFO["palette"] = {k: list(v) for k, v in V.palette(vgn).items()}

# ---------------------------------------------------------------- tung bone: nhiet 0..1, zoom vao vung co trong so
if "bones" in WHAT:
    mode_vertex()
    for nm in vgn:
        w = Wd[:, vgn.index(nm)]
        sel = w > 0.02
        c, e = fit(rest[sel], 1.5)
        e = max(e, 0.09)
        set_colors(V.vertex_colors(Wd, vgn, "bone", nm))
        for v in VIEWS:
            shoot(v, c, e, f"b_{nm}_{v}", 900)
        INFO.setdefault("bone_stats", {})[nm] = {"verts_gt_0.02": int(sel.sum()), "verts_gt_0.5": int((w > 0.5).sum()), "max": float(w.max()), "center": list(c), "scale": e}

# ---------------------------------------------------------------- vung kho (zoom, blend mau) : vai, hong, khuyu, goi, ban tay, dau/co, tui/mu, khoi
if "regions" in WHAT:
    mode_vertex()
    set_colors(V.vertex_colors(Wd, vgn, "blend"))
    REG = {"shoulder_L": ((0.08, -0.02, 0.34), 0.22), "shoulder_R": ((-0.08, -0.02, 0.34), 0.22), "elbow_L": ((0.17, -0.02, 0.33), 0.16), "elbow_R": ((-0.17, -0.02, 0.33), 0.16),
           "hand_L": ((0.30, -0.03, 0.32), 0.16), "hand_R": ((-0.30, -0.03, 0.32), 0.16), "hip_pelvis": ((0.0, 0.02, 0.19), 0.24), "knee_L": ((0.057, 0.03, 0.11), 0.14),
           "knee_R": ((-0.036, 0.03, 0.11), 0.14), "ankle_foot_L": ((0.07, 0.01, 0.04), 0.16), "ankle_foot_R": ((-0.05, 0.01, 0.04), 0.16), "head_neck": ((0.0, -0.04, 0.39), 0.22),
           "sack_helmet": ((0.0, 0.05, 0.40), 0.30), "loincloth": ((0.01, 0.02, 0.17), 0.22)}
    for rn, (c, e) in REG.items():
        for v in VIEWS:
            shoot(v, c, e, f"r_{rn}_{v}", 800)
    mode_texture(0)
    for rn, (c, e) in REG.items():
        for v in VIEWS:
            shoot(v, c, e, f"rt_{rn}_{v}", 800)

# ---------------------------------------------------------------- tu the cuc tri (do bien dang that, qua control IK/FK)
if "poses" in WHAT:
    mode_texture(0)
    for nm in P.POSES:
        P.apply(nm)
        pos = K.eval_mesh_positions()
        c, e = fit(pos, 1.22)
        INFO.setdefault("poses", {})[nm] = {"center": list(c), "scale": e, "runtime_bones": bone_data(), "control_bones": ctl_data(), "bbox_min": list(pos.min(0)), "bbox_max": list(pos.max(0))}
        for v in VIEWS:
            shoot(v, c, e, f"p_{nm}_{v}", 1200)
    P.apply("rest")

# ---------------------------------------------------------------- can canh tu the cuc tri o vung khop (vai, hong/chan, khuyu, dau/co, than/tui)
if "poses" in WHAT:
    CLOSE = {"shoulders": (["arms_down_fk", "arms_forward_fk", "hands_raised", "hands_crossed"], (0, -0.03, 0.34), 0.36),
             "hips_legs": (["hip_flex_fk", "hip_abduct_fk", "squat", "long_step"], (0.01, 0.03, 0.12), 0.38),
             "elbows": (["elbows_max_fk", "hands_crossed"], (0, -0.04, 0.34), 0.5),
             "head_neck": (["head_down", "head_up", "head_turn"], (0, -0.04, 0.39), 0.3),
             "torso_sack": (["twist_p45", "twist_m45"], (0, 0.03, 0.30), 0.38)}
    INFO["closeups"] = {k: v[0] for k, v in CLOSE.items()}
    for grp_name, (plist, c, e) in CLOSE.items():
        for nm in plist:
            P.apply(nm)
            for v in ("front", "fl", "side", "fr", "back"):
                shoot(v, c, e, f"cu_{grp_name}_{nm}_{v}", 800)
    P.apply("rest")

with open(os.path.join(RAW, "info.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump(INFO, f, indent=1)
print("render done ->", RAW, len(INFO["views"]), "images")

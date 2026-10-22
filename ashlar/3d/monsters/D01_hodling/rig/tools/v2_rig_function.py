"""V2: kiem chuc nang rig tren file .blend DA LUU + MO LAI: trang thai trung tinh, viewport, control IK that su keo dung chi, cuc tri tu the.

Chay: blender -b --factory-startup -P v2_rig_function.py  -> rig/checks/rig_function.json
"""
import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C
import d01_measure as M
import d01_poses as P
import d01_rigkit as K

bpy.ops.wm.open_mainfile(filepath=C.BLEND)
ct, rt, me = K.control(), K.runtime(), K.get_mesh()
R = {"blend": C.BLEND, "blender": bpy.app.version_string}

# ------------------------------------------------------------------ trang thai khi mo lai
state = {}
state["actions"] = [a.name for a in bpy.data.actions]
state["pose_bones_identity"] = all(
    pb.location.length < 1e-9 and abs(pb.rotation_quaternion.w - 1) < 1e-9 and pb.scale == Vector((1, 1, 1))
    for arm in (ct, rt) for pb in arm.pose.bones)
state["ik_props"] = {k: ct[k] for k in ct.keys() if k.startswith("ik_")}
state["objects"] = {o.name: {"type": o.type, "hide_viewport_eye": o.hide_get(), "parent": o.parent.name if o.parent else None,
                             "loc": list(o.location), "rot": list(o.rotation_euler), "scale": list(o.scale)} for o in bpy.data.objects}
state["active_object"] = bpy.context.view_layer.objects.active.name if bpy.context.view_layer.objects.active else None
state["selected"] = [o.name for o in bpy.data.objects if o.select_get()]
shade = []
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == "VIEW_3D":
            sh = area.spaces[0].shading
            shade.append({"screen": scr.name, "type": sh.type, "color_type": sh.color_type, "light": sh.light})
state["viewport_shading"] = shade
state["scene"] = {"fps": bpy.context.scene.render.fps, "frame_start": bpy.context.scene.frame_start, "frame_end": bpy.context.scene.frame_end,
                  "unit_system": bpy.context.scene.unit_settings.system, "unit_scale": bpy.context.scene.unit_settings.scale_length}
state["images_packed"] = {i.name: bool(i.packed_file) for i in bpy.data.images}
state["modifiers"] = [(m.type, m.object.name if m.object else None) for m in me.modifiers]
state["mesh_vertex_groups"] = len(me.vertex_groups)
R["open_state"] = state

# ------------------------------------------------------------------ chuan bi nhom dinh
n = len(me.data.vertices)
vgn = [g.name for g in me.vertex_groups]
Wd = np.zeros((n, len(vgn)))
for v in me.data.vertices:
    for g in v.groups:
        Wd[v.index, g.group] = g.weight
gi = {nm: i for i, nm in enumerate(vgn)}
rest = K.rest_positions()
K.reset_pose(ct)
base = K.eval_mesh_positions()
R["rest_eval_vs_stored_max_m"] = float(np.abs(base - rest).max())


def grp(name, thr=0.5):
    return Wd[:, gi[name]] > thr


def disp(p, mask):
    return (p[mask] - base[mask]).mean(0)


def run(fn):
    P.set_ik(leg=1.0, arm=1.0)
    K.reset_pose(ct)
    fn()
    bpy.context.view_layer.update()
    return K.eval_mesh_positions()


tests = []


def record(name, passed, **kw):
    tests.append({"test": name, "pass": bool(passed), **{k: (round(v, 5) if isinstance(v, float) else v) for k, v in kw.items()}})


body_other = lambda *names: ~np.any([Wd[:, gi[x]] > 0.2 for x in names], axis=0)

# foot IK: tinh tien len/ra truoc -> bone chan do di theo dung, ben kia + than khong doi
for s, o in (("L", "R"), ("R", "L")):
    p = run(lambda: P.move(f"ctl_{s}_Foot_IK", (0, -0.03, 0.02)))
    d_foot = disp(p, grp(f"{s}_Foot") | grp(f"{s}_Toe"))
    d_other = np.abs(p[grp(f"{o}_Foot") | grp(f"{o}_Toe")] - base[grp(f"{o}_Foot") | grp(f"{o}_Toe")]).max()
    d_torso = np.abs(p[grp("chest") | grp("spine_02")] - base[grp("chest") | grp("spine_02")]).max()
    record(f"{s} foot IK move (0,-0.03,0.02)", np.allclose(d_foot, (0, -0.03, 0.02), atol=0.004) and d_other < 1e-4 and d_torso < 1e-4,
           moved_mean=[float(x) for x in d_foot], other_foot_max=float(d_other), torso_max=float(d_torso))
# hand IK
for s, o, sgn in (("L", "R", 1), ("R", "L", -1)):
    mv = (-0.05 * sgn, -0.05, 0.03)
    p = run(lambda: P.move(f"ctl_{s}_Hand_IK", mv))
    d_hand = disp(p, grp(f"{s}_Hand"))
    d_other = np.abs(p[grp(f"{o}_Hand")] - base[grp(f"{o}_Hand")]).max()
    d_leg = np.abs(p[grp(f"{s}_Foot")] - base[grp(f"{s}_Foot")]).max()
    record(f"{s} hand IK move {mv}", np.allclose(d_hand, mv, atol=0.004) and d_other < 1e-4 and d_leg < 1e-4,
           moved_mean=[float(x) for x in d_hand], other_hand_max=float(d_other), leg_max=float(d_leg))
# pole: khi goi/khuyu da gap, keo pole thi dau goi/khuyu xoay quanh truc chan/tay, ban chan/ban tay khong doi
for s, sgn in (("L", 1), ("R", -1)):
    p0 = run(lambda: P.move(f"ctl_{s}_Foot_IK", (0, -0.03, 0.035)))
    def bent_pole():
        P.move(f"ctl_{s}_Foot_IK", (0, -0.03, 0.035))
        P.move(f"ctl_{s}_Knee_pole", (0.06 * sgn, 0.0, 0.0))
    p1 = run(bent_pole)
    kmask = (grp(f"{s}_Calf") | grp(f"{s}_Thigh")) & (rest[:, 2] > 0.085) & (rest[:, 2] < 0.14)
    dk = (p1[kmask] - p0[kmask]).mean(0)
    d_foot = np.abs(p1[grp(f"{s}_Foot") & (rest[:, 2] < 0.015)] - p0[grp(f"{s}_Foot") & (rest[:, 2] < 0.015)]).max()
    record(f"{s} knee pole outward 6cm (goi dang gap)", dk[0] * sgn > 0.004 and d_foot < 2e-3, knee_region_dx_toward_pole=float(dk[0] * sgn), sole_max=float(d_foot))
    mv = (-0.06 * sgn, -0.04, 0.0)
    p0 = run(lambda: P.move(f"ctl_{s}_Hand_IK", mv))
    def bent_pole_a():
        P.move(f"ctl_{s}_Hand_IK", mv)
        P.move(f"ctl_{s}_Elbow_pole", (0, 0, 0.08))
    p1 = run(bent_pole_a)
    emask = (grp(f"{s}_ForeArm") | grp(f"{s}_UpperArm")) & (np.abs(rest[:, 0]) > 0.12) & (np.abs(rest[:, 0]) < 0.22)
    de = (p1[emask] - p0[emask]).mean(0)
    d_hand = np.abs(p1[grp(f"{s}_Hand") & (np.abs(rest[:, 0]) > 0.29)] - p0[grp(f"{s}_Hand") & (np.abs(rest[:, 0]) > 0.29)]).max()  # dau ban tay (xa co tay)
    record(f"{s} elbow pole up 8cm (khuyu dang gap)", de[2] > 0.004 and d_hand < 2e-3, elbow_region_dz=float(de[2]), hand_max=float(d_hand))
# control tiep xuc chan
s = "L"
foot_m = grp(f"{s}_Foot") | grp(f"{s}_Toe")
toe_m = grp(f"{s}_Toe")
heel_m = grp(f"{s}_Foot") & (rest[:, 1] > 0.045) & (rest[:, 2] < 0.03)
p = run(lambda: P.rotate(f"ctl_{s}_Heel_roll", "x", -25))
record("L heel_roll (lift toes, pivot heel)", disp(p, toe_m)[2] > 0.008 and abs(disp(p, heel_m)[2]) < 0.004, toe_dz=float(disp(p, toe_m)[2]), heel_dz=float(disp(p, heel_m)[2]))
p = run(lambda: P.rotate(f"ctl_{s}_Toe_roll", "x", 25))
record("L toe_roll (lift heel, pivot toe tip)", disp(p, heel_m)[2] > 0.008 and abs(disp(p, toe_m)[2]) < 0.006, heel_dz=float(disp(p, heel_m)[2]), toe_dz=float(disp(p, toe_m)[2]))
p = run(lambda: P.rotate(f"ctl_{s}_Ball_roll", "x", 25))
record("L ball_roll (lift heel, toes flat)", disp(p, heel_m)[2] > 0.006 and abs(disp(p, toe_m)[2]) < 0.004, heel_dz=float(disp(p, heel_m)[2]), toe_dz=float(disp(p, toe_m)[2]))
# root/cog/chest/head
p = run(lambda: P.move("ctl_root", (0.05, 0.02, 0)))
dd = (p - base)
record("root move (0.05,0.02,0): ca model di theo", np.allclose(dd, (0.05, 0.02, 0), atol=1e-5), max_dev=float(np.abs(dd - np.array([0.05, 0.02, 0])).max()))
p = run(lambda: P.move("ctl_cog", (0, 0, -0.03)))
feet = (grp("L_Foot") | grp("R_Foot") | grp("L_Toe") | grp("R_Toe")) & (rest[:, 2] < 0.015)  # de ban chan
record("cog down 3cm: than ha, de ban chan dung nguyen (IK)", disp(p, grp("chest"))[2] < -0.025 and np.abs(p[feet] - base[feet]).max() < 3e-3,
       chest_dz=float(disp(p, grp("chest"))[2]), sole_max=float(np.abs(p[feet] - base[feet]).max()))
p = run(lambda: P.rotate("ctl_chest", "z", 20))
leg_ok = np.abs(p[grp("L_Calf")] - base[grp("L_Calf")]).max() < 1e-5
record("chest rotate 20deg: dau/tay/tui xoay theo, chan khong doi", np.abs(p[grp("head")] - base[grp("head")]).max() > 0.01 and leg_ok, head_max=float(np.abs(p[grp("head")] - base[grp("head")]).max()))
p = run(lambda: P.rotate("ctl_head", "z", 30))
record("head rotate: helmet + ear theo, chest dung", np.abs(p[grp("helmet")] - base[grp("helmet")]).max() > 0.01 and np.abs(p[grp("chest") & (rest[:, 2] < 0.3)] - base[grp("chest") & (rest[:, 2] < 0.3)]).max() < 1e-5,
       helmet_max=float(np.abs(p[grp("helmet")] - base[grp("helmet")]).max()))
# vai tui doc lap voi dau/co: nguc dung yen thi lop vai tui (tru gach) phai dung yen khi quay/cui/ngua dau
cx = M.Ctx()
sw = M.sack_static(cx)
record("sack weights only sack/chest/spine_02/spine_01 (no head/neck/pelvis/arm leak)", sw["max_weight_outside_allowed"] < 1e-9, max_outside=float(sw["max_weight_outside_allowed"]), sack_vertices=sw["sack_vertices"])
for nm_ in ("head_turn", "head_up", "head_down"):
    P.set_ik(leg=1.0, arm=1.0)
    K.reset_pose(ct)
    P.POSES[nm_]()
    bpy.context.view_layer.update()
    pe = K.eval_mesh_positions()
    sm = M.sack_motion(cx, base, pe)
    bs = M.boundary_stretch(cx, base, pe)
    chest_ok = np.abs(pe[grp("chest") & (rest[:, 2] < 0.3)] - base[grp("chest") & (rest[:, 2] < 0.3)]).max() < 1e-5
    record(f"{nm_}: sack cloth stays still (chest fixed)", sm["max_mm"] < 3.0 and chest_ok, sack_max_mm=float(sm["max_mm"]), boundary_edge_growth_max_mm=float(bs["max_growth_mm"]), chest_still=bool(chest_ok))
# tat IK -> FK
def fk_leg():
    P.set_ik(leg=0.0)
    P.rotate("ctl_L_Thigh", "x", -40)
p = run(fk_leg)
record("IK off (leg L) + FK thigh: chan trai xoay qua FK", disp(p, grp("L_Foot"))[1] < -0.03 and np.abs(p[grp("R_Foot")] - base[grp("R_Foot")]).max() < 1e-5, foot_dy=float(disp(p, grp("L_Foot"))[1]))
R["control_tests"] = tests

# ------------------------------------------------------------------ cuc tri tu the: ma tran sach, khong NaN, tiep xuc
rest_w = np.zeros((n, 3))
edges = set()
me.data.calc_loop_triangles()
for lt in me.data.loop_triangles:
    a, b, c = lt.vertices
    for u, v in ((a, b), (b, c), (c, a)):
        edges.add((min(u, v), max(u, v)))
E = np.array(sorted(edges))
L0 = np.linalg.norm(base[E[:, 0]] - base[E[:, 1]], axis=1)
sole = {"L": grp("L_Foot") | grp("L_Toe"), "R": grp("R_Foot") | grp("R_Toe")}
poses = {}
for nm in P.POSES:
    P.apply(nm)
    p = K.eval_mesh_positions()
    mats_ok = True
    worst_scale = 0.0
    worst_det = 0.0
    for arm in (ct, rt):
        for pb in arm.pose.bones:
            m = np.array(pb.matrix)
            if not np.isfinite(m).all():
                mats_ok = False
                continue
            sc = np.linalg.norm(m[:3, :3], axis=0)
            worst_scale = max(worst_scale, float(np.abs(sc - 1).max()))
            worst_det = max(worst_det, abs(np.linalg.det(m[:3, :3]) - 1))
    L1 = np.linalg.norm(p[E[:, 0]] - p[E[:, 1]], axis=1)
    ok = L0 > 1e-5
    growth = (L1 - L0)[ok]
    ent = {"mesh_finite": bool(np.isfinite(p).all()), "bone_matrices_finite": mats_ok, "max_bone_scale_dev": worst_scale, "max_bone_det_dev": worst_det,
           "max_vertex_move_m": float(np.linalg.norm(p - base, axis=1).max()), "max_edge_growth_mm": float(growth.max() * 1000),
           "p99_edge_growth_mm": float(np.percentile(growth, 99) * 1000),
           "bbox_min": [float(x) for x in p.min(0)], "bbox_max": [float(x) for x in p.max(0)],
           "sole_min_z_L_mm": float(p[sole["L"]][:, 2].min() * 1000), "sole_min_z_R_mm": float(p[sole["R"]][:, 2].min() * 1000)}
    poses[nm] = ent
R["pose_extremes"] = poses
P.apply("rest")
R["pose_extremes_all_finite"] = all(v["mesh_finite"] and v["bone_matrices_finite"] for v in poses.values())

# ------------------------------------------------------------------ socket di theo ban tay; khop nam trong than
from mathutils.bvhtree import BVHTree
sock_rows = {}
for sk, hand in (("R_weapon_attach", "R_Hand"), ("L_weapon_attach", "L_Hand"), ("fx_hand_R", "R_Hand"), ("fx_hand_L", "L_Hand"), ("fx_head", "head"), ("fx_chest", "chest"), ("hit_origin", "spine_02")):
    ref = None
    worst = 0.0
    for nm in P.POSES:
        P.apply(nm)
        rel = np.array(rt.pose.bones[hand].matrix.inverted() @ rt.pose.bones[sk].matrix)
        if ref is None:
            ref = rel
        worst = max(worst, float(np.abs(rel - ref).max()))
    sock_rows[sk] = {"parent_bone": hand, "max_local_matrix_diff_over_16_poses": worst}
P.apply("rest")
R["socket_follow_parent"] = sock_rows
R["socket_follow_all_ok"] = all(v["max_local_matrix_diff_over_16_poses"] < 1e-4 for v in sock_rows.values())
# huong truc socket (the gioi, Blender) o rest: Y local = truc doc theo can
sock_axes = {}
for sk in ("R_weapon_attach", "L_weapon_attach"):
    m = rt.pose.bones[sk].matrix.to_3x3()
    sock_axes[sk] = {"Y_axis_world": [round(float(v), 4) for v in (m @ Vector((0, 1, 0)))], "Z_axis_world": [round(float(v), 4) for v in (m @ Vector((0, 0, 1)))],
                     "head_world": [round(float(v), 4) for v in rt.pose.bones[sk].head]}
R["weapon_socket_axes_rest"] = sock_axes
dg = bpy.context.evaluated_depsgraph_get()
bvh = BVHTree.FromObject(me, dg)
def inside(p):
    votes = 0
    for d in (Vector((0, 0, 1)), Vector((1, 0, 0)), Vector((0, 1, 0))):
        cnt = 0
        o = Vector(p)
        for _ in range(60):
            hit = bvh.ray_cast(o, d)
            if hit[0] is None:
                break
            cnt += 1
            o = hit[0] + d * 1e-5
        votes += cnt % 2
    return votes >= 2
jin = {}
for b in rt.data.bones:
    if b.name in ("root", "cog", "ground"):
        continue
    h = Vector(b.head_local)
    loc = bvh.find_nearest(h)
    jin[b.name] = {"head_inside_mesh": bool(inside(h)), "dist_to_surface_mm": round(float(loc[3]) * 1000, 2)}
R["joints_inside_mesh"] = jin

os.makedirs(C.CHECKS, exist_ok=True)
out = os.path.join(C.CHECKS, "rig_function.json")
C.dump_json(out, R, indent=1, default=lambda o: o if not isinstance(o, np.generic) else o.item())
print("tests", sum(t["pass"] for t in tests), "/", len(tests), "->", out)
for t in tests:
    if not t["pass"]:
        print("FAIL", t)

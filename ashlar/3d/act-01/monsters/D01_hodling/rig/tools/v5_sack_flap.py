"""V5 (v4 fix B1/B2): do (1) vai tui doc lap voi dau/co, (2) khố truoc xuyen dui truoc/sau khi lai ctl_loincloth_front.

Chay:  blender -b --factory-startup -P v5_sack_flap.py -- [--blend <file.blend>] [--out <json>] [--sweep]
  mac dinh: .blend hien hanh, ghi checks/sack_flap.json. --sweep: quet goc ctl_loincloth_front 0..-90 (buoc 5) o tu the hong gap, ghi checks/loin_sweep.json.
  Dung --blend _snapshots/v3/D01_hodling_rig.blend --out <json> de lay con so 'truoc' tu ban v3.
Phep do dinh nghia o d01_measure.py. Ghi {"pass"} cho tung ngưỡng de run_all/validate dung.
"""
import json
import os
import sys

import bpy
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C
import d01_measure as M
import d01_poses as P
import d01_rigkit as K

a = C.script_args()
blend = a[a.index("--blend") + 1] if "--blend" in a else C.BLEND
out = a[a.index("--out") + 1] if "--out" in a else os.path.join(C.CHECKS, "sack_flap.json")
do_sweep = "--sweep" in a
bpy.ops.wm.open_mainfile(filepath=blend)
ct, me = K.control(), K.get_mesh()
cx = M.Ctx()
K.reset_pose(ct)
base = K.eval_mesh_positions()
R = {"blend": os.path.relpath(blend, C.RIG) if blend.startswith(C.RIG) else blend, "blend_sha256": C.sha256_file(blend),
     "body_mesh_closed_check": cx.watertight, "class_counts": {k: int((cx.cls == k).sum()) for k in np.unique(cx.cls)}}

# ------------------------------------------------------------------ B1: vai tui
R["sack_static_weights"] = M.sack_static(cx)
HEAD_POSES = ("head_down", "head_up", "head_turn")
sack = {}
for nm in P.POSES:
    P.apply(nm)
    pos = K.eval_mesh_positions()
    ent = M.sack_motion(cx, base, pos)
    ent["boundary"] = M.boundary_stretch(cx, base, pos)  # moi tu the: giu de thay duong bien tren/duoi cua tui khong bi xe
    sack[nm] = ent
R["sack_motion_by_pose"] = sack
head_max = max(sack[p]["max_mm"] for p in HEAD_POSES)
R["sack_boundary_max_growth_mm_by_pose"] = {k: round(v["boundary"]["max_growth_mm"], 2) for k, v in sack.items()}
R["sack_head_poses_max_mm"] = head_max
R["sack_head_poses_max_mm_threshold"] = 3.0

# ------------------------------------------------------------------ B2: kho truoc
P.apply("rest")
rest_f = M.flap_vs_body(cx, K.eval_mesh_positions())
flap = {"rest": rest_f}
for nm in ("hip_flex_fk", "hip_flex_fk_loin"):
    P.apply(nm)
    cur = M.flap_vs_body(cx, K.eval_mesh_positions())
    cur["vs_rest"] = M.flap_delta(cur, rest_f)
    flap[nm] = cur
R["flap_front"] = {k: {kk: vv for kk, vv in v.items() if not kk.endswith("_ids")} for k, v in flap.items()}
R["flap_front_corr_angle_deg"] = P.LOIN_CORR_DEG
R["flap_validation"] = {
    "method": "dinh khố trong khoi than (bo phieu 3 tia, mesh than kin) + giao tam giac (BVH overlap) loc theo vung than (nhom trong so troi nhat); tru gia tri rest",
    "body_mesh_closed": cx.watertight["boundary_edges"] == 0 and cx.watertight["nonmanifold_edges"] == 0,
    "rest_inside_thigh": rest_f["inside_vertices_thigh"], "uncorrected_detects_overlap": flap["hip_flex_fk"]["vs_rest"]["new_inside_vertices_thigh"] > 0 or flap["hip_flex_fk"]["vs_rest"]["new_covered_by_thigh_vertices"] > 0,
    "limit": "chi do hinh hoc dinh/tam giac cua khố doi voi than; khong co mo phong vai, khong do khố vs khố sau/tay"}
_c = flap["hip_flex_fk_loin"]["vs_rest"]
R["flap_pass"] = _c["new_inside_vertices_thigh"] == 0 and _c["new_intersecting_triangles_thigh"] == 0 and _c["new_covered_by_thigh_vertices"] == 0

# kiem chung phuong phap tren chong cheo CO CHU DICH: dich manh khố ra sau (vao than) 4/8/12 mm o tu the rest, phai thay dinh/tam giac chong tang theo
base_pos = None
P.apply("rest")
rest_pos = K.eval_mesh_positions()
fl_idx = cx.idx("flap_front")
synth = []
for mm in (0, 4, 8, 12):
    pp = rest_pos.copy()
    pp[fl_idx, 1] += mm / 1000.0  # +Y Blender = ra sau (mat quai nhin -Y)
    r_ = M.flap_vs_body(cx, pp)
    synth.append({"flap_shift_back_mm": mm, "inside_vertices_total": r_["inside_vertices_thigh"] + r_["inside_vertices_other"], "inside_vertices_other_region": r_["inside_vertices_other"],
                  "intersecting_triangles_total": r_["intersecting_flap_triangles_thigh"] + r_["intersecting_flap_triangles_other"], "max_depth_other_mm": r_["max_depth_other_mm"]})
# diem co dap an: trung diem xuong dui trai (trong than) phai la 'inside'; diem cach 5 cm ra truoc phai la 'outside'
rt = K.runtime()
th = rt.data.bones["L_Thigh"]
mid = (rt.matrix_world @ ((th.head_local + th.tail_local) * 0.5))
body_ids = np.nonzero(cx.body_tri)[0]
from mathutils import Vector
from mathutils.bvhtree import BVHTree
verts_ = [Vector(p_) for p_ in rest_pos]
bvh_ = BVHTree.FromPolygons(verts_, [tuple(int(v) for v in cx.tris[i]) for i in body_ids], epsilon=0.0)
R["flap_validation"]["synthetic_shift"] = synth
R["flap_validation"]["synthetic_monotonic"] = all(synth[i + 1]["inside_vertices_total"] >= synth[i]["inside_vertices_total"] and synth[i + 1]["intersecting_triangles_total"] >= synth[i]["intersecting_triangles_total"] for i in range(3)) and synth[3]["inside_vertices_total"] > synth[0]["inside_vertices_total"] + 10
R["flap_validation"]["known_point_thigh_midpoint_inside"] = bool(M._inside(bvh_, mid))
R["flap_validation"]["known_point_5cm_in_front_of_thigh_inside"] = bool(M._inside(bvh_, mid + Vector((0, -0.05, 0))))
fl_pts = cx.rest[cx.idx("flap_front")]
hole_d = float(min((np.linalg.norm(fl_pts - h, axis=1).min() for h in cx.hole_pts), default=1e9)) * 1000
R["flap_validation"]["body_boundary_edges"] = cx.watertight["boundary_edges"]
R["flap_validation"]["min_distance_body_hole_to_flap_mm"] = hole_d
R["flap_validation"]["body_mesh_closed_near_flap"] = hole_d > 50.0
R["flap_validation"]["body_hole_note"] = "mesh than co vai lo nho (vai phai/ gay sau, de ban chan trai); xa khố >=50 mm nen phieu chan/le quanh khố khong bi anh huong"
R["flap_method_valid"] = bool(R["flap_validation"]["synthetic_monotonic"] and R["flap_validation"]["known_point_thigh_midpoint_inside"] and not R["flap_validation"]["known_point_5cm_in_front_of_thigh_inside"]
                              and R["flap_validation"]["body_mesh_closed_near_flap"])
R["sack_pass"] = head_max <= R["sack_head_poses_max_mm_threshold"] and R["sack_static_weights"]["max_weight_outside_allowed"] < 1e-9
P.apply("rest")

# ------------------------------------------------------------------ quet goc
if do_sweep:
    sweep = []
    for ang in range(0, -95, -5):
        P.apply("hip_flex_fk")
        P.rotate("ctl_loincloth_front", "x", float(ang))
        cur = M.flap_vs_body(cx, K.eval_mesh_positions())
        d = M.flap_delta(cur, rest_f)
        sweep.append({"angle_deg": ang, **d, "inside_other_now": cur["inside_vertices_other"], "intersecting_other_now": cur["intersecting_flap_triangles_other"]})
        print(ang, d, cur["inside_vertices_other"])
    first_ok = next((s["angle_deg"] for s in sweep if s["new_inside_vertices_thigh"] == 0 and s["new_intersecting_triangles_thigh"] == 0 and s["new_covered_by_thigh_vertices"] == 0), None)
    C.dump_json(os.path.join(C.CHECKS, "loin_sweep.json"), {"rest": {k: v for k, v in rest_f.items() if not k.endswith("_ids")}, "sweep": sweep, "first_clear_angle_deg": first_ok}, indent=1)
    print("first clear angle", first_ok)

K.reset_pose(ct)
os.makedirs(os.path.dirname(out), exist_ok=True)
C.dump_json(out, R, indent=1, default=lambda o: o.item() if isinstance(o, np.generic) else str(o))
print("sack head poses max mm:", head_max, "| flap rest", rest_f["inside_vertices_thigh"], "uncorr", flap["hip_flex_fk"]["vs_rest"], "corr", flap["hip_flex_fk_loin"]["vs_rest"])
print("->", out)

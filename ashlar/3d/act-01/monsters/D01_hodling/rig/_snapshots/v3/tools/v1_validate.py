"""V1 (R4): kiem tu dong A1.1-A1.14 cho rig D01, do that tren GLB runtime tam thoi + .blend nguon + GLB goc. Ghi rig/validation.json.

Chay (sau b1_build_rig.py, c1_export_runtime.py, v2_rig_function.py):
  blender -b --factory-startup -P v1_validate.py
Moi muc ghi: pass, so do (measured), nguong (threshold), ghi chu. Khong co muc nao duoc danh "pass" khong do.
"""
import datetime
import json
import math
import os
import re
import shutil
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector, kdtree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import d01_common as C
import d01_glb as G
import d01_rig_def as D
import d01_rigkit as K

RT_GLB = os.path.join(C.CHECKS, "D01_hodling_runtime_check.glb")
assert os.path.exists(RT_GLB), "chay c1_export_runtime.py truoc"
V = {}
A = {}


def rec(key, passed, measured, threshold, note=""):
    A[key] = {"pass": bool(passed), "measured": measured, "threshold": threshold, "note": note}


def f6(x):
    return float(np.round(x, 9))


# ------------------------------------------------------------------ nguon
src_js, src_bin = G.read_glb(C.GLB)
sp = src_js["meshes"][0]["primitives"][0]
S_pos = G.accessor(src_js, src_bin, sp["attributes"]["POSITION"])
S_uv = G.accessor(src_js, src_bin, sp["attributes"]["TEXCOORD_0"])
S_idx = G.accessor(src_js, src_bin, sp["indices"]).reshape(-1)
FACTOR = C.TARGET_HEIGHT_M / S_pos[:, 1].max()
S_scaled = S_pos * FACTOR  # toa do glTF, met
src_img = {i: G.sha(G.image_bytes(src_js, src_bin, i)) for i in range(len(src_js["images"]))}
mat0 = src_js["materials"][0]
src_roles = {"baseColor": src_js["textures"][mat0["pbrMetallicRoughness"]["baseColorTexture"]["index"]]["source"],
             "metallicRoughness": src_js["textures"][mat0["pbrMetallicRoughness"]["metallicRoughnessTexture"]["index"]]["source"],
             "normal": src_js["textures"][mat0["normalTexture"]["index"]]["source"]}
src_role_sha = {k: src_img[v] for k, v in src_roles.items()}

# ------------------------------------------------------------------ runtime GLB
js, bn = G.read_glb(RT_GLB)
prim = js["meshes"][0]["primitives"][0]
attrs = prim["attributes"]
R_pos = G.accessor(js, bn, attrs["POSITION"])
R_uv = G.accessor(js, bn, attrs["TEXCOORD_0"])
R_j = G.accessor(js, bn, attrs["JOINTS_0"]).astype(int)
R_w = G.accessor(js, bn, attrs["WEIGHTS_0"]).astype(np.float64)
R_idx = G.accessor(js, bn, prim["indices"]).reshape(-1)
nodes = js["nodes"]
skin = js["skins"][0]
joints = skin["joints"]
jnames = [nodes[j]["name"] for j in joints]
GL, parent = G.node_globals(js)

# ------------------------------------------------------------------ A1.1 mot skin, mot mesh than
mesh_nodes = [i for i, n in enumerate(nodes) if "mesh" in n]
skin_nodes = [i for i, n in enumerate(nodes) if "skin" in n]
rec("A1.1", len(js["skins"]) == 1 and len(js["meshes"]) == 1 and len(js["meshes"][0]["primitives"]) == 1 and len(mesh_nodes) == 1 and skin_nodes == mesh_nodes,
    {"skins": len(js["skins"]), "meshes": len(js["meshes"]), "primitives": len(js["meshes"][0]["primitives"]), "mesh_nodes": len(mesh_nodes), "skinned_nodes": len(skin_nodes)},
    "1 skin, 1 mesh, 1 primitive, node mesh = node co skin", "tren GLB runtime tam")

# ------------------------------------------------------------------ A1.2 ten bone
expected = [b["name"] for b in D.build()]
core = ["root", "cog", "pelvis", "spine_01", "spine_02", "chest", "neck", "head"] + [f"{s}_{p}" for s in "LR" for p in ("UpperArm", "ForeArm", "Hand", "Thigh", "Calf", "Foot", "Toe")]
sockets = ["R_weapon_attach", "L_weapon_attach", "fx_head", "fx_chest", "fx_hand_R", "fx_hand_L", "hit_origin", "ground"]
aux = ["helmet", "sack", "loincloth_front", "L_ear", "R_ear"]
bad_chars = [n for n in jnames if not re.fullmatch(r"[A-Za-z0-9_]+", n)]
bad_side = [n for n in jnames if re.match(r"^(left|right)", n, re.I) or n.endswith((".L", ".R", "_left", "_right"))]
rec("A1.2", sorted(jnames) == sorted(expected) and len(set(jnames)) == len(jnames) == 35 and set(core + sockets + aux) == set(jnames) and not bad_chars and not bad_side,
    {"count": len(jnames), "unique": len(set(jnames)), "missing_core": sorted(set(core) - set(jnames)), "missing_socket": sorted(set(sockets) - set(jnames)),
     "extra": sorted(set(jnames) - set(core + sockets + aux)), "bad_chars": bad_chars},
    "ten dung SKELETON_STANDARD muc 3 (+ phu D01: helmet,sack,loincloth_front,L_ear,R_ear); khong trung; chi [A-Za-z0-9_]; tien to L_/R_", "")

# ------------------------------------------------------------------ A1.3 mot cay, root la goc duy nhat
jset = set(joints)
roots = [j for j in joints if parent.get(j) not in jset]
rec("A1.3", len(roots) == 1 and nodes[roots[0]]["name"] == "root" and all(parent.get(j) in jset for j in joints if nodes[j]["name"] != "root"),
    {"roots": [nodes[r]["name"] for r in roots], "joint_count": len(joints), "skeleton_node_parent": nodes[parent[roots[0]]]["name"] if roots[0] in parent else None},
    "dung 1 goc trong so joint, ten = root", "root co cha la node armature D01_runtime (khong phai joint)")

# ------------------------------------------------------------------ A1.4-A1.7 trong so
nz = (R_w > 0).sum(1)
sums = R_w.sum(1)
has_set1 = "JOINTS_1" in attrs
used_joint_idx = np.unique(R_j[R_w > 0])
rec("A1.4", int((sums <= 0).sum()) == 0 and int((nz == 0).sum()) == 0, {"vertices": len(R_w), "empty_vertices": int((nz == 0).sum())}, "0 dinh trong", "")
rec("A1.5", np.abs(sums - 1).max() <= 1e-6, {"max_abs_sum_minus_1": f6(np.abs(sums - 1).max()), "min_sum": f6(sums.min()), "max_sum": f6(sums.max())}, "1 +- 1e-6",
    "WEIGHTS_0 float32 trong GLB")
rec("A1.6", int(nz.max()) <= 4 and not has_set1, {"max_nonzero_influences": int(nz.max()), "has_JOINTS_1": has_set1, "histogram": {int(k): int((nz == k).sum()) for k in np.unique(nz)}}, "<= 4", "")
rec("A1.7", int(R_j.max()) < len(joints) and int(R_j.min()) >= 0 and used_joint_idx.max() < len(joints),
    {"joints_in_skin": len(joints), "max_index_used": int(used_joint_idx.max()), "min_index": int(R_j.min()), "distinct_joints_with_weight": int(len(used_joint_idx))}, "0 <= index < so joint", "")

# ------------------------------------------------------------------ A1.8 ma tran bind nghich dao khop phan cap
ibm = G.accessor(js, bn, skin["inverseBindMatrices"]).reshape(-1, 4, 4)
mesh_G = GL[mesh_nodes[0]]
errs = []
for k, j in enumerate(joints):
    Mi = ibm[k].T  # glTF luu cot-truoc
    expect = np.linalg.inv(np.linalg.inv(mesh_G) @ GL[j])
    errs.append(np.abs(Mi - expect).max())
rec("A1.8", max(errs) <= 1e-5, {"max_abs_err": f6(max(errs)), "joints": len(errs), "mesh_node_world_is_identity": bool(np.allclose(mesh_G, np.eye(4)))},
    "<= 1e-5", "IBM_j == inverse(inverse(mesh_world) @ joint_world) tai tu the rest")

# ------------------------------------------------------------------ A1.10 texture byte giong goc
rt_mat = js["materials"][0]
rt_roles = {"baseColor": js["textures"][rt_mat["pbrMetallicRoughness"]["baseColorTexture"]["index"]]["source"],
            "metallicRoughness": js["textures"][rt_mat["pbrMetallicRoughness"]["metallicRoughnessTexture"]["index"]]["source"],
            "normal": js["textures"][rt_mat["normalTexture"]["index"]]["source"]}
rt_role_sha = {k: G.sha(G.image_bytes(js, bn, v)) for k, v in rt_roles.items()}
rec("A1.10", rt_role_sha == src_role_sha and len(js["images"]) == 3,
    {"source_sha256": src_role_sha, "runtime_sha256": rt_role_sha, "runtime_image_mime": {k: js["images"][v]["mimeType"] for k, v in rt_roles.items()}, "bytes": {k: len(G.image_bytes(js, bn, v)) for k, v in rt_roles.items()}},
    "byte giong nhau theo vai tro (baseColor/metallicRoughness/normal)", "so sanh sha256 byte anh nhung trong GLB; Blender exporter khong ma hoa lai")

# ------------------------------------------------------------------ A1.11 chieu cao, A1.12 chan cham dat (tren GLB runtime, toa do glTF Y len)
ymax, ymin = float(R_pos[:, 1].max()), float(R_pos[:, 1].min())
rec("A1.11", abs(ymax - 0.5) / 0.5 <= 0.02, {"bounds_y_max_m": f6(ymax), "bounds_y_min_m": f6(ymin), "target_m": 0.5, "deviation_pct": f6((ymax - 0.5) / 0.5 * 100),
                                              "bbox_min": [f6(v) for v in R_pos.min(0)], "bbox_max": [f6(v) for v in R_pos.max(0)]}, "+-2% quanh 0,5 m", "chieu cao = dinh cao nhat toan mesh (mu/sung/tui) theo brief G1")
rec("A1.12", abs(ymin) <= 0.01, {"lowest_vertex_y_m": f6(ymin)}, "0 +- 0,01 m", "")

# ------------------------------------------------------------------ A1.14 scale/rotation/negative (GLB + .blend)
bone_scale_dev = 0.0
neg_scale = False
for j in joints:
    n = nodes[j]
    s = np.array(n.get("scale", [1, 1, 1]))
    bone_scale_dev = max(bone_scale_dev, float(np.abs(s - 1).max()))
    neg_scale |= bool((s <= 0).any())
arm_node = nodes[parent[roots[0]]]
mesh_node = nodes[mesh_nodes[0]]
ident = lambda n: all(k not in n for k in ("matrix", "translation", "rotation", "scale"))
glb_obj_ok = ident(arm_node) and ident(mesh_node)
root_node = nodes[roots[0]]
# .blend
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
ct, rt, me = K.control(), K.runtime(), K.get_mesh()
obj_t = {}
blend_ok = True
for o in (ct, rt, me):
    t = {"loc": [f6(v) for v in o.location], "rot_euler": [f6(v) for v in o.rotation_euler], "scale": [f6(v) for v in o.scale],
         "delta_loc": [f6(v) for v in o.delta_location], "delta_rot": [f6(v) for v in o.delta_rotation_euler], "delta_scale": [f6(v) for v in o.delta_scale]}
    obj_t[o.name] = t
    blend_ok &= (np.abs(np.array(t["loc"])).max() == 0 and np.abs(np.array(t["rot_euler"])).max() == 0 and np.allclose(t["scale"], 1) and
                 np.abs(np.array(t["delta_loc"])).max() == 0 and np.abs(np.array(t["delta_rot"])).max() == 0 and np.allclose(t["delta_scale"], 1))
blend_ok &= me.parent == rt and np.allclose(np.array(me.matrix_parent_inverse), np.eye(4))
rec("A1.14", glb_obj_ok and not neg_scale and bone_scale_dev <= 1e-5 and blend_ok,
    {"blend_objects": obj_t, "mesh_parent": me.parent.name, "mesh_parent_inverse_identity": bool(np.allclose(np.array(me.matrix_parent_inverse), np.eye(4))),
     "glb_armature_and_mesh_nodes_identity_TRS": glb_obj_ok, "glb_root_bone_identity_TRS": ident(root_node), "glb_bone_max_scale_dev": f6(bone_scale_dev),
     "glb_negative_scale": neg_scale},
    "scale = 1, khong am, xoay da ap dung (object transform don vi), bone scale = 1 +- 1e-5", "bone scale lech nho la nhieu float32 cua exporter")

# ------------------------------------------------------------------ A1.9 + nhat quan nguon: hinh hoc, UV, trong so, anh, rest
# (a) .blend vs nguon scale: dinh theo chi so
n = len(me.data.vertices)
bl_co = K.rest_positions()
src_blender = np.stack([S_scaled[:, 0], -S_scaled[:, 2], S_scaled[:, 1]], 1)  # glTF -> Blender
blend_vs_src = float(np.abs(bl_co - src_blender).max())
# topology/UV khong doi
me.data.calc_loop_triangles()
bl_polys = np.array([list(p.vertices) for p in me.data.polygons])
src_tris = S_idx.reshape(-1, 3)
topo_same = bl_polys.shape == src_tris.shape and (np.sort(bl_polys, axis=1) == np.sort(src_tris, axis=1)).all() if bl_polys.shape == src_tris.shape else False
uvl = me.data.uv_layers[0].data
bl_uv_loop = np.empty(len(uvl) * 2)
uvl.foreach_get("uv", bl_uv_loop)
bl_uv_loop = bl_uv_loop.reshape(-1, 2)
vloop = np.empty(len(me.data.loops), dtype=np.int64)
me.data.loops.foreach_get("vertex_index", vloop)
bl_uv = np.zeros((n, 2))
bl_uv[vloop] = bl_uv_loop
src_uv_blender = np.stack([S_uv[:, 0], 1 - S_uv[:, 1]], 1)
uv_dev = float(np.abs(bl_uv - src_uv_blender).max())
V["blend_mesh_vs_scaled_source"] = {"vertex_count": n, "source_vertex_count": len(S_pos), "polygon_count": len(me.data.polygons), "max_vertex_diff_m": f6(blend_vs_src),
                                    "topology_identical_by_index": bool(topo_same), "uv_max_diff": f6(uv_dev), "scale_factor": f6(FACTOR),
                                    "uv_layers": [u.name for u in me.data.uv_layers], "materials": [m.name for m in me.data.materials]}
packed = {i.name: (G.sha(i.packed_file.data) if i.packed_file else None) for i in bpy.data.images}
V["blend_images_packed_sha256_vs_source"] = {"packed": packed, "source_by_role": src_role_sha, "all_match": all(h in src_role_sha.values() for h in packed.values())}

# (b) GLB runtime vs nguon: khop theo khong gian (tinh duong noi UV/normal)
kd = kdtree.KDTree(len(S_scaled))
for i, p in enumerate(S_scaled):
    kd.insert(Vector(p), i)
kd.balance()
kd_r = kdtree.KDTree(len(R_pos))
for i, p in enumerate(R_pos):
    kd_r.insert(Vector(p), i)
kd_r.balance()
fwd = np.zeros(len(R_pos))
match = np.full(len(R_pos), -1)
uv_ok = True
uv_dev_max = 0.0
for i, p in enumerate(R_pos):
    cands = kd.find_range(Vector(p), 2e-5)
    if not cands:
        co_, idx_, d_ = kd.find(Vector(p))
        fwd[i] = d_
        continue
    best = min(cands, key=lambda c: np.abs(S_uv[c[1]] - R_uv[i]).max())
    fwd[i] = best[2]
    match[i] = best[1]
    uv_dev_max = max(uv_dev_max, float(np.abs(S_uv[best[1]] - R_uv[i]).max()))
rev = np.zeros(len(S_scaled))
for i, p in enumerate(S_scaled):
    co_, idx_, d_ = kd_r.find(Vector(p))
    rev[i] = d_
# tam giac: gan moi dinh runtime -> dinh nguon khop (vi tri + UV) -> id vi tri (han dinh trung chinh xac cua nguon); so bo ba id
_, weld_id = np.unique(S_pos.astype(np.float32), axis=0, return_inverse=True)
weld_id = weld_id.ravel()
src_tri_keys = {}
for t in S_idx.reshape(-1, 3):
    k = tuple(sorted(int(weld_id[v]) for v in t))
    src_tri_keys[k] = src_tri_keys.get(k, 0) + 1
rt_tri_keys = {}
for t in R_idx.reshape(-1, 3):
    k = tuple(sorted(int(weld_id[match[v]]) for v in t)) if (match[t] >= 0).all() else ("unmatched",)
    rt_tri_keys[k] = rt_tri_keys.get(k, 0) + 1
tri_match = src_tri_keys == rt_tri_keys
V["glb_vs_source_spatial"] = {"runtime_vertices": len(R_pos), "source_vertices": len(S_pos), "runtime_triangles": len(R_idx) // 3, "source_triangles": len(S_idx) // 3,
                              "forward_max_dist_m": f6(fwd.max()), "reverse_max_dist_m": f6(rev.max()), "uv_max_diff_matched": f6(uv_dev_max),
                              "triangle_welded_vertex_triples_equal": bool(tri_match), "unmatched_runtime_vertices": int((match < 0).sum())}

# trong so: so sanh voi vertex group trong .blend
vgn = [g.name for g in me.vertex_groups]
Wb = np.zeros((n, len(vgn)))
for v in me.data.vertices:
    for g in v.groups:
        Wb[v.index, g.group] = g.weight
gidx = {nm: i for i, nm in enumerate(vgn)}
w_err = 0.0
for i in range(len(R_pos)):
    s = match[i]
    if s < 0:
        continue
    row = np.zeros(len(vgn))
    for jj, ww in zip(R_j[i], R_w[i]):
        if ww > 0:
            row[gidx[jnames[jj]]] += ww
    w_err = max(w_err, float(np.abs(row - Wb[s]).max()))
V["blend_weights_vs_runtime_glb"] = {"max_abs_weight_diff": f6(w_err), "vertex_groups_in_blend": len(vgn), "note": "so sanh theo vi tri+UV, nhom dinh theo ten bone"}

# rest nhat quan: bone runtime (.blend) vs nut GLB
Cm = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
rest_err = 0.0
rest_rows = {}
for j, nm in zip(joints, jnames):
    bone = rt.data.bones[nm]
    expect = np.array(Cm @ bone.matrix_local)
    e = float(np.abs(GL[j] - expect).max())
    rest_rows[nm] = e
    rest_err = max(rest_err, e)
V["blend_runtime_rest_vs_glb"] = {"max_abs_matrix_diff": f6(rest_err), "worst_bone": max(rest_rows, key=rest_rows.get), "bone_count_blend": len(rt.data.bones), "bone_count_glb": len(joints)}
# runtime vs control rest
ctl_err = 0.0
for b in ct.data.bones:
    if b.name.startswith("ctl_") and b.name[4:] in rt.data.bones:
        r = rt.data.bones[b.name[4:]]
        ctl_err = max(ctl_err, float(np.abs(np.array(r.matrix_local) - np.array(b.matrix_local)).max()))
V["control_vs_runtime_rest_max_diff"] = f6(ctl_err)
# helper khong lot
V["hidden_helpers"] = {"glb_node_names_with_ctl_prefix": [x["name"] for x in nodes if x.get("name", "").startswith("ctl_")],
                       "runtime_armature_bones_with_ctl_prefix": [b.name for b in rt.data.bones if b.name.startswith("ctl_")],
                       "glb_node_count": len(nodes), "glb_expected_node_count": 35 + 2,
                       "glb_nodes_not_bones": [x["name"] for i, x in enumerate(nodes) if i not in jset],
                       "control_armature_objects_in_glb": [x["name"] for x in nodes if x.get("name") == C.CONTROL_ARM],
                       "glb_animations": len(js.get("animations", [])), "glb_extra_meshes": len(js["meshes"]) - 1}
V["bones"] = {"runtime_total": len(rt.data.bones), "control_total": len(ct.data.bones), "control_ik_helpers": len([b for b in ct.data.bones if not b.name[4:] in rt.data.bones]),
              "deform": sum(1 for b in rt.data.bones if b.use_deform), "weighted_in_glb": sorted({jnames[k] for k in used_joint_idx})}
wb = V["bones"]["weighted_in_glb"]
V["bones"]["weighted_count"] = len(wb)

# ------------------------------------------------------------------ A1.13 bone khong trong so
zero = [nm for nm in jnames if nm not in wb]
anc = set()
for j in joints:
    if nodes[j]["name"] in wb or nodes[j]["name"] in sockets:
        p = parent.get(j)
        while p in jset:
            anc.add(nodes[p]["name"])
            p = parent.get(p)
ok_zero = all(z in sockets or z in anc for z in zero)
rec("A1.13", ok_zero and set(zero) - set(sockets) <= {"root", "cog"},
    {"zero_weight_bones": zero, "of_which_sockets": [z for z in zero if z in sockets], "of_which_structural_ancestors": [z for z in zero if z not in sockets],
     "weighted_bones": len(wb)},
    "chi socket + to tien cau truc (root, cog) - ngoai le da thong nhat o G1", "root, cog giu du trong so 0 (cha cua bone co trong so)")

# ------------------------------------------------------------------ A1.9 dung Blender import lai (thu muc moi, scene trong)
tmpd = os.path.join(C.CHECKS, "reimport_tmp")
shutil.rmtree(tmpd, ignore_errors=True)
if os.path.exists(tmpd):  # file con bi khoa: dung thu muc moi (van la thu muc moi, rong)
    tmpd = tmpd + "_" + datetime.datetime.now().strftime("%H%M%S")
os.makedirs(tmpd)
shutil.copy2(RT_GLB, tmpd)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(tmpd, os.path.basename(RT_GLB)))
imp_mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
imp_arm = [o for o in bpy.data.objects if o.type == "ARMATURE"]
dg = bpy.context.evaluated_depsgraph_get()
ev = imp_mesh.evaluated_get(dg)
em = ev.to_mesh()
ipos = np.empty(len(em.vertices) * 3)
em.vertices.foreach_get("co", ipos)
ipos = ipos.reshape(-1, 3)
mw = np.array(imp_mesh.matrix_world)
ipos = ipos @ mw[:3, :3].T + mw[:3, 3]
ev.to_mesh_clear()
kd_b = kdtree.KDTree(len(src_blender))
for i, p in enumerate(src_blender):
    kd_b.insert(Vector(p), i)
kd_b.balance()
fwd_b = max(kd_b.find(Vector(p))[2] for p in ipos)
kd_i = kdtree.KDTree(len(ipos))
for i, p in enumerate(ipos):
    kd_i.insert(Vector(p), i)
kd_i.balance()
rev_b = max(kd_i.find(Vector(p))[2] for p in src_blender)
imp_vg = len(imp_mesh.vertex_groups)
imp_bones = len(imp_arm[0].data.bones) if imp_arm else 0
imp_imgs = {i.name: list(i.size) for i in bpy.data.images}
rec("A1.9", fwd_b <= 1e-4 and rev_b <= 1e-4 and tri_match and fwd.max() <= 1e-4 and rev.max() <= 1e-4,
    {"blender_reimport_forward_max_m": f6(fwd_b), "blender_reimport_reverse_max_m": f6(rev_b), "glb_direct_forward_max_m": f6(fwd.max()), "glb_direct_reverse_max_m": f6(rev.max()),
     "triangle_position_multisets_equal": bool(tri_match), "reimport_vertex_count": len(ipos), "source_vertex_count": len(src_blender), "reimport_bones": imp_bones,
     "reimport_vertex_groups": imp_vg, "reimport_images": imp_imgs, "tolerance_m": 1e-4,
     "reimport_dir_note": "thu muc tam checks/reimport_tmp* (ban sao GLB, scene trong) bi xoa sau khi kiem"},
    "<= 1e-4 m hai chieu (khop theo khong gian, bo qua dinh nhan doi o duong noi UV/normal; khong so theo chi so dinh)",
    f"so dinh runtime {len(R_pos)}, nguon {len(S_pos)} (neu khac nhau la do tach dinh o duong noi); so sanh theo vi tri, khong theo chi so dinh")

# ------------------------------------------------------------------ gop ket qua + chuc nang rig
func = json.load(open(os.path.join(C.CHECKS, "rig_function.json"), encoding="utf-8"))
OUT = {
    "asset": "D01_hodling", "date": datetime.date.today().isoformat(), "blender": bpy.app.version_string,
    "scope": "R4 kiem tu dong cho G2. GLB runtime la ban tam de kiem A1 (rig/checks/), KHONG phai <asset>_rig.glb release, chua dang ky lab.",
    "inputs": {"source_glb": os.path.relpath(C.GLB, C.RIG), "source_glb_sha256": C.sha256_file(C.GLB), "source_glb_sha256_expected": C.GLB_SHA256,
               "blend": os.path.relpath(C.BLEND, C.RIG), "blend_sha256": C.sha256_file(C.BLEND), "runtime_check_glb": os.path.relpath(RT_GLB, C.RIG),
               "runtime_check_glb_sha256": C.sha256_file(RT_GLB), "runtime_check_glb_bytes": os.path.getsize(RT_GLB), "scale_factor": f6(FACTOR)},
    "A1": A,
    "A1_summary": {"checks": len(A), "passed": sum(v["pass"] for v in A.values()), "failed": [k for k, v in A.items() if not v["pass"]]},
    "source_consistency": V,
    "rig_function_tests": {"passed": sum(t["pass"] for t in func["control_tests"]), "total": len(func["control_tests"]), "tests": func["control_tests"]},
    "pose_extremes": func["pose_extremes"], "pose_extremes_all_finite": func["pose_extremes_all_finite"],
    "reopened_blend_state": func["open_state"],
}
OUT["source_glb_unchanged"] = C.sha256_file(C.GLB) == C.GLB_SHA256
path = os.path.join(C.RIG, "validation.json")
json.dump(OUT, open(path, "w", encoding="utf-8", newline="\n"), indent=1, default=lambda o: o.item() if isinstance(o, np.generic) else str(o))
shutil.rmtree(tmpd, ignore_errors=True)
print("A1:", OUT["A1_summary"], "rig tests", OUT["rig_function_tests"]["passed"], "/", OUT["rig_function_tests"]["total"], "->", path)

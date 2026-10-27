"""R4: automatic checks (QA_CHECKLIST A1.1-A1.14) + control-rig function tests -> rig/validation.json.

blender -b --factory-startup rig/W04_mire_sucker_rig.blend -P w04_v1_validate.py

A1.1, A1.3, A1.5-A1.8, A1.10-A1.12, A1.14 are read from a TEMPORARY runtime GLB (rig/_work/check/, deleted at the end:
this rig pass makes no deliverable export); A1.9 re-imports that GLB into an empty scene. The source GLB is never written.
"""
import json
import math
import os
import re
import shutil
import sys
import time

import bpy
import numpy as np
from mathutils import Vector, kdtree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_bkit as K
import w04_common as C
import w04_glb as G
import w04_mesh as M
import w04_rig_def as D

sys.path.insert(0, C.TOOLS)
import rigbatch as rb  # noqa: E402

T0 = time.time()
V = dict(asset=C.AID, date='2026-10-26', blender=bpy.app.version_string, height_m=C.HEIGHT_M, k=C.K, glb_sha256=C.GLB_SHA256)
A = {}


def put(key, ok, measured, threshold, note=''):
    A[key] = dict(pas=bool(ok), measured=measured, threshold=threshold, note=note)


ob, rt, ct = K.mesh(), K.runtime(), K.control()
me = ob.data
B = D.build()
names_expected = [b['name'] for b in B]
deform_expected = set(D.deform_names(B))
sockets = [b['name'] for b in B if b['kind'] == 'socket']

# ------------------------------------------------------------------ Blender-side data
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
skinned = [o for o in meshes if any(m.type == 'ARMATURE' for m in o.modifiers)]
bone_names = [b.name for b in rt.data.bones]
roots = [b.name for b in rt.data.bones if b.parent is None]
gn = [g.name for g in ob.vertex_groups]
n = len(me.vertices)
cnt = np.zeros(n, int); tot = np.zeros(n)
for v in me.vertices:
    ws = [g.weight for g in v.groups if g.weight > 0]
    cnt[v.index] = len(ws); tot[v.index] = sum(ws)
weighted = {gn[g.group] for v in me.vertices for g in v.groups if g.weight > 0}
zero_w = [b for b in bone_names if b not in weighted]
rest = K.rest_co(ob)
objs_tf = {o.name: dict(loc=[round(c, 6) for c in o.location], rot=[round(c, 6) for c in o.rotation_euler],
                        scale=[round(c, 6) for c in o.scale], delta_scale=[round(c, 6) for c in o.delta_scale])
           for o in (ob, rt, ct)}

# A1.2 (Blender side, same names go to the GLB)
bad_chars = [b for b in bone_names if not re.fullmatch(r'[A-Za-z0-9_]+', b)]
bad_side = [b for b in bone_names if re.search(r'(\.L|\.R|_left|_right|_L$|_R$)', b)]
put('A1.2', sorted(bone_names) == sorted(names_expected) and len(set(bone_names)) == len(bone_names) and not bad_chars and not bad_side,
    dict(count=len(bone_names), unique=len(set(bone_names)), missing=sorted(set(names_expected) - set(bone_names)),
         extra=sorted(set(bone_names) - set(names_expected)), bad_chars=bad_chars, side_suffix=bad_side,
         deform=sorted(b.name for b in rt.data.bones if b.use_deform) == sorted(deform_expected)),
    'tên đúng bảng duyệt G1 (SKELETON_STANDARD §3, họ W côn trùng: W04), không trùng, chỉ [A-Za-z0-9_], tiền tố L_/R_')
put('A1.4', int((cnt == 0).sum()) == 0, dict(vertices=n, empty=int((cnt == 0).sum())), '0 đỉnh trống', 'trên mesh rig (Blender)')
put('A1.13', set(zero_w) <= set(sockets) | {'root', 'cog'},
    dict(zero_weight_bones=sorted(zero_w), of_which_sockets=sorted(set(zero_w) & set(sockets)),
         structural_ancestors=sorted(set(zero_w) & {'root', 'cog'}), weighted_bones=len(weighted)),
    'chỉ socket + tổ tiên cấu trúc (root, cog)', 'bone deform nào cũng có trọng số')

# ------------------------------------------------------------------ control-rig function tests
F = {}
bpy.context.view_layer.update()


def rt_dev():
    bpy.context.view_layer.update()
    rd = max(rt.pose.bones[b.name].matrix.to_quaternion().rotation_difference(b.matrix_local.to_quaternion()).angle for b in rt.data.bones)
    pd = max((rt.pose.bones[b.name].head - b.head_local).length for b in rt.data.bones)
    return round(math.degrees(rd), 5), round(pd, 7)


def tail_w(name):
    return rt.matrix_world @ rt.pose.bones[name].tail


def head_w(name):
    return rt.matrix_world @ rt.pose.bones[name].head


K.reset_pose(ct)
F['rest_ik_on'] = dict(zip(('max_rot_deg', 'max_head_m'), rt_dev()))
ok_all = F['rest_ik_on']['max_rot_deg'] < 0.01 and F['rest_ik_on']['max_head_m'] < 1e-5
legs = [(s, l) for l in D.LEGS for s in D.SIDES]
# foot lift: tarsus end follows the foot control
lift = {}
for s, l in legs:
    K.reset_pose(ct)
    f0 = tail_w(f'{s}_{l}_04').copy()
    k0 = head_w(f'{s}_{l}_03').copy()
    ct.pose.bones[f'ctl_{s}_{l}_IK'].location = (0, 0, 0.10)     # foot control: local Y = world -Y, local Z = world +Z -> lift 10 cm
    bpy.context.view_layer.update()
    tgt = (ct.matrix_world @ ct.pose.bones[f'ctl_{s}_{l}_IK'].head)
    f1 = tail_w(f'{s}_{l}_04')
    lift[f'{s}_{l}'] = dict(foot_moved_m=round((f1 - f0).length, 4), foot_to_control_m=round((f1 - tgt).length, 5),
                            knee_moved_m=round((head_w(f'{s}_{l}_03') - k0).length, 4))
F['foot_control_follow'] = lift
ok_all &= all(v['foot_to_control_m'] < 0.002 for v in lift.values())
# body down 15 cm with feet planted
K.reset_pose(ct)
feet0 = {f'{s}_{l}': tail_w(f'{s}_{l}_04').copy() for s, l in legs}
knee_ang0 = {}
for s, l in legs:
    a, m, b = head_w(f'{s}_{l}_02'), head_w(f'{s}_{l}_03'), tail_w(f'{s}_{l}_03')
    knee_ang0[f'{s}_{l}'] = math.degrees((m - a).angle(b - m))
cog = ct.pose.bones['ctl_cog']
for dz, tagn in ((-0.15, 'body_down_15cm'), (0.02, 'body_up_2cm'), (0.06, 'body_up_6cm')):
    K.reset_pose(ct)
    # ctl_cog local axes: Y up (bone points +Z), so local Y = world Z
    cog.location = (0, dz, 0)
    bpy.context.view_layer.update()
    r = {}
    for s, l in legs:
        a, m, b = head_w(f'{s}_{l}_02'), head_w(f'{s}_{l}_03'), tail_w(f'{s}_{l}_03')
        r[f'{s}_{l}'] = dict(foot_slip_m=round((tail_w(f'{s}_{l}_04') - feet0[f'{s}_{l}']).length, 5),
                             knee_bend_deg=round(math.degrees((m - a).angle(b - m)) - knee_ang0[f'{s}_{l}'], 2))
    r['thorax_dz_m'] = round((head_w('thorax') - Vector(D.by_name(B)['thorax']['head'])).z, 4)
    F[tagn] = r
    if dz < 0:
        ok_all &= all(v['foot_slip_m'] < 0.002 for k, v in r.items() if isinstance(v, dict))
    else:
        r['note'] = 'thông tin: chân sau duỗi 98 % ở rest nên thân nâng quá ~1-2 cm thì bàn chân sau phải nhấc theo'
# wing masters: +X raises both wings (mirror)
wf = {}
for ang in (30, -30):
    K.reset_pose(ct)
    for s in D.SIDES:
        K.rot_local(ct, f'ctl_{s}_Wing', (1, 0, 0), ang)
    bpy.context.view_layer.update()
    tl, tr = tail_w('L_WingF_02'), tail_w('R_WingF_02')
    t0 = Vector(D.by_name(B)['L_WingF_02']['tail'])
    wf[f'X{ang:+d}'] = dict(L_tip_dz=round(tl.z - t0.z, 4), R_tip_dz=round(tr.z - t0.z, 4), mirror_err_m=round(
        (Vector((-tl.x, tl.y, tl.z)) - tr).length, 5))
F['wing_master'] = wf
ok_all &= wf['X+30']['L_tip_dz'] > 0 and wf['X+30']['R_tip_dz'] > 0 and wf['X-30']['L_tip_dz'] < 0 and wf['X+30']['mirror_err_m'] < 1e-3
# proboscis IK pin
K.reset_pose(ct)
ct['ik_proboscis'] = 1.0
bpy.context.view_layer.update()
pin0 = rt_dev()
tip_rest = tail_w('proboscis_03').copy()
ct.pose.bones['ctl_proboscis_IK'].location = (0, 0, 0)
cog.location = (0, -0.05, 0)          # body sinks 5 cm, the tip stays pinned
bpy.context.view_layer.update()
pin = dict(rest_dev=pin0, tip_slip_m_after_body_sink_5cm=round((tail_w('proboscis_03') - tip_rest).length, 4))
ct['ik_proboscis'] = 0.0
K.reset_pose(ct)
pin['rest_after_switch_off'] = rt_dev()
F['proboscis_ik'] = pin
ok_all &= pin['tip_slip_m_after_body_sink_5cm'] < 0.01
# FK switch: legs follow FK controls when ik_leg = 0
for s, l in legs:
    ct[f'ik_leg_{s}{l[-1]}'] = 0.0
K.reset_pose(ct)
F['fk_mode_rest'] = rt_dev()
K.rot_local(ct, 'ctl_L_Leg1_02', (1, 0, 0), 20)
bpy.context.view_layer.update()
_a = math.degrees(rt.pose.bones['L_Leg1_02'].matrix.to_quaternion().rotation_difference(rt.data.bones['L_Leg1_02'].matrix_local.to_quaternion()).angle)
F['fk_mode_L_Leg1_02_follows'] = round(min(_a, 360 - _a), 3)
for s, l in legs:
    ct[f'ik_leg_{s}{l[-1]}'] = 1.0
K.reset_pose(ct)
ok_all &= F['fk_mode_rest'][0] < 0.01 and abs(F['fk_mode_L_Leg1_02_follows'] - 20) < 0.1
# seam: co-located raw vertices stay together in a strong pose
co_r = K.rest_co(ob)
inv, U = M.weld(co_r, 1e-5)
K.reset_pose(ct)
cog.location = (0, -0.12, 0)
for s in D.SIDES:
    K.rot_local(ct, f'ctl_{s}_Wing', (1, 0, 0), -30)
K.rot_local(ct, 'ctl_L_abdomen_02', (1, 0, 0), 20)
P = K.eval_co(ob)
gap = 0.0
order = np.argsort(inv)
inv_s = inv[order]
starts = np.r_[0, np.nonzero(np.diff(inv_s))[0] + 1]
for a_, b_ in zip(starts, np.r_[starts[1:], len(inv_s)]):
    if b_ - a_ > 1:
        g = P[order[a_:b_]]
        gap = max(gap, float(np.linalg.norm(g - g[0], axis=1).max()))
F['seam_gap_coincident_verts_m'] = gap
ok_all &= gap < 1e-5
K.reset_pose(ct)
F['all_pass'] = bool(ok_all)
V['function_tests'] = F

# ------------------------------------------------------------------ temporary runtime GLB
CHK = os.path.join(C.WORK, 'check')
os.makedirs(CHK, exist_ok=True)
GLB_TMP = os.path.join(CHK, C.AID + '_check.glb')
rt.hide_set(False)
for o in bpy.context.view_layer.objects:
    o.select_set(False)
rt.select_set(True); ob.select_set(True)
bpy.context.view_layer.objects.active = rt
bpy.ops.export_scene.gltf(filepath=GLB_TMP, export_format='GLB', use_selection=True, export_yup=True, export_skins=True,
                          export_animations=False, export_morph=False, export_apply=False, export_image_format='AUTO')
js, bin_ = G.read(GLB_TMP)
skins = js.get('skins', [])
mesh_nodes = [i for i, nd in enumerate(js['nodes']) if 'mesh' in nd]
prims = sum(len(js['meshes'][nd['mesh']]['primitives']) for nd in (js['nodes'][i] for i in mesh_nodes))
put('A1.1', len(skins) == 1 and len(mesh_nodes) == 1 and len(skinned) == 1,
    dict(skins=len(skins), mesh_nodes=len(mesh_nodes), primitives=prims, blender_meshes=len(meshes), blender_skinned=len(skinned)),
    '1 skin, 1 mesh thân', 'GLB tạm; một material nên 1 primitive' if prims == 1 else 'GLB tạm')
joints = skins[0]['joints']
jnames = [js['nodes'][j]['name'] for j in joints]
Wm, parent = G.world_matrices(js)
jroots = [jnames[k] for k, j in enumerate(joints) if parent.get(j) not in joints]
put('A1.3', jroots == ['root'], dict(roots_among_joints=jroots, joints=len(joints)), 'một cây, gốc duy nhất là root')
prim = js['meshes'][js['nodes'][mesh_nodes[0]]['mesh']]['primitives'][0]
J = G.accessor_fast(js, bin_, prim['attributes']['JOINTS_0']).astype(np.int64)
Wt = G.accessor_fast(js, bin_, prim['attributes']['WEIGHTS_0']).astype(np.float64)
if js['accessors'][prim['attributes']['WEIGHTS_0']].get('normalized'):
    Wt /= float(np.iinfo(G.CT[js['accessors'][prim['attributes']['WEIGHTS_0']]['componentType']]).max)
sums = Wt.sum(1)
put('A1.5', float(np.abs(sums - 1).max()) <= 1e-6,
    dict(max_abs_sum_minus_1=float(np.abs(sums - 1).max()), blender_max_abs=float(np.abs(tot - 1).max())), '1 ± 1e-6',
    'WEIGHTS_0 float32 trong GLB tạm; Blender: tổng theo nhóm đỉnh')
nz = (Wt > 0).sum(1)
put('A1.6', int(nz.max()) <= 4 and 'JOINTS_1' not in prim['attributes'],
    dict(max_influences=int(nz.max()), has_JOINTS_1='JOINTS_1' in prim['attributes'],
         histogram={int(k): int((nz == k).sum()) for k in range(1, 5)}, blender_max=int(cnt.max())), '≤ 4')
used_idx = J[Wt > 0]
put('A1.7', int(used_idx.min()) >= 0 and int(used_idx.max()) < len(joints),
    dict(joints=len(joints), min_index=int(used_idx.min()), max_index=int(used_idx.max()),
         joints_with_weight=int(len(np.unique(used_idx)))), '0 ≤ chỉ số < số joint')
IBM = G.accessor_fast(js, bin_, skins[0]['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
Mw = Wm[mesh_nodes[0]]
err = max(float(np.abs(IBM[k] - np.linalg.inv(np.linalg.inv(Mw) @ Wm[j])).max()) for k, j in enumerate(joints))
put('A1.8', err <= 1e-5, dict(max_abs_err=err, mesh_node_world_identity=bool(np.allclose(Mw, np.eye(4)))), '≤ 1e-5',
    'IBM_j = inverse(inverse(mesh_world) @ joint_world) ở rest')
src_js, src_bin = G.read(C.GLB)
img_src, img_rt = G.images_by_role(src_js, src_bin), G.images_by_role(js, bin_)
put('A1.10', all(img_src[r]['sha256'] == img_rt.get(r, {}).get('sha256') for r in img_src),
    dict(source=img_src, runtime=img_rt), 'byte giống nhau theo vai trò (baseColor, metallicRoughness, normal)',
    'sha256 ảnh nhúng trong GLB')
pos = G.accessor_fast(js, bin_, prim['attributes']['POSITION']).astype(np.float64)
pos_w = (np.c_[pos, np.ones(len(pos))] @ Mw.T)[:, :3]
ymax, ymin = float(pos_w[:, 1].max()), float(pos_w[:, 1].min())
put('A1.11', abs(ymax - C.HEIGHT_M) <= 0.02 * C.HEIGHT_M, dict(bounds_y_max_m=round(ymax, 5), target_m=C.HEIGHT_M,
                                                                 deviation_pct=round(100 * (ymax - C.HEIGHT_M) / C.HEIGHT_M, 3)),
    '±2 % quanh 1,566 m', 'chiều cao = đỉnh cánh (điểm cao nhất), G1')
put('A1.12', abs(ymin) <= 0.01, dict(lowest_y_m=round(ymin, 5)), '0 ± 0,01 m', 'vuốt chân trước; vuốt sau ở 0,047 m (giữ rest, G1)')
node_ok = all(np.allclose(G.trs(js['nodes'][i]), np.eye(4), atol=1e-6)
              for i in mesh_nodes + [i for i, nd in enumerate(js['nodes']) if nd.get('name') == C.RUNTIME])
jscale = max(float(np.abs(np.linalg.norm(G.trs(js['nodes'][j])[:3, :3], axis=0) - 1).max()) for j in joints)
neg = any(np.linalg.det(G.trs(js['nodes'][j])[:3, :3]) < 0 for j in joints)
tf_ok = all(o['scale'] == [1.0, 1.0, 1.0] and o['rot'] == [0.0, 0.0, 0.0] and o['delta_scale'] == [1.0, 1.0, 1.0]
            for o in objs_tf.values())
put('A1.14', tf_ok and node_ok and jscale < 1e-5 and not neg,
    dict(blender_objects=objs_tf, glb_mesh_and_armature_nodes_identity=bool(node_ok), glb_joint_max_scale_dev=jscale,
         glb_negative_scale=bool(neg)), 'scale = 1, không âm, xoay đã áp dụng')
V['temp_glb'] = dict(path=GLB_TMP.replace('\\', '/'), bytes=os.path.getsize(GLB_TMP), joints=len(joints),
                     note='GLB tạm chỉ để kiểm A1.x, xoá sau khi kiểm (lượt rig này không export)')

# ------------------------------------------------------------------ A1.9: re-import in an empty scene
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB_TMP, merge_vertices=False)
rm = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
extra_import_objects = sorted(o.name for o in bpy.data.objects if o.type == 'MESH' and o not in rm)
pts = []
for o in rm:
    pts += [o.matrix_world @ v.co for v in o.data.vertices]
arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
re_bones = len(arms[0].data.bones) if arms else 0
P_re = np.array([tuple(p) for p in pts])
kd_src = kdtree.KDTree(len(rest))
for i, p in enumerate(rest):
    kd_src.insert(p, i)
kd_src.balance()
kd_re = kdtree.KDTree(len(P_re))
for i, p in enumerate(P_re):
    kd_re.insert(p, i)
kd_re.balance()
fwd = max(kd_src.find(Vector(p))[2] for p in P_re)
rev = max(kd_re.find(Vector(p))[2] for p in rest)
put('A1.9', max(fwd, rev) <= 1e-4, dict(reimport_to_source_max_m=fwd, source_to_reimport_max_m=rev, reimport_vertices=len(P_re),
                                       source_vertices=len(rest), reimport_bones=re_bones, importer_bone_shape_meshes_ignored=extra_import_objects),
    'khoảng cách đỉnh ≤ 1e-4 m', 'mesh nguồn = GLB gốc scale ×1,5668 trừ 18 đỉnh hai dải sát đất (G1)')

# ------------------------------------------------------------------ source consistency: rig mesh = scaled GLB minus the strips
ob2, info2 = rb.intake(C.GLB, '_chk', C.HEIGHT_M)
n2 = len(ob2.data.vertices)
co2 = np.empty(n2 * 3); ob2.data.vertices.foreach_get('co', co2); co2 = co2.reshape(n2, 3)
inv2, U2 = M.weld(co2, 1e-5)
E2 = M.edges_from_faces([tuple(int(inv2[v]) for v in p.vertices) for p in ob2.data.polygons])
comp2 = M.components(len(U2), E2)
strips = [c for c in range(comp2.max() + 1) if U2[comp2 == c, 2].max() < 0.02]
keep = ~np.isin(comp2[inv2], strips)
co_keep = co2[keep]
same = co_keep.shape == rest.shape and float(np.abs(co_keep - rest).max()) < 1e-6
V['source_consistency'] = dict(intake_vertices=n2, kept=int(keep.sum()), removed=int((~keep).sum()), rig_vertices=len(rest),
                               same_order_and_positions=bool(same),
                               max_abs_m=float(np.abs(co_keep - rest).max()) if co_keep.shape == rest.shape else None,
                               glb_sha256_now=C.sha256_file(C.GLB))
shutil.rmtree(CHK, ignore_errors=True)
V['temp_glb']['deleted'] = not os.path.exists(GLB_TMP)

# ------------------------------------------------------------------ write
order_keys = sorted(A, key=lambda k: int(k.split('.')[1]))
V['A1'] = {k: A[k] for k in order_keys}
V['A1_summary'] = dict(passed=sum(1 for k in A if A[k]['pas']), total=len(A), failed=[k for k in order_keys if not A[k]['pas']])
V['seconds'] = round(time.time() - T0, 1)
# rename the 'pas' key (keyword clash avoided above)
for k in V['A1']:
    V['A1'][k] = dict(pass_=V['A1'][k].pop('pas'), **V['A1'][k])
txt = json.dumps(V, indent=1, ensure_ascii=False).replace('"pass_"', '"pass"')
open(os.path.join(C.RIG, 'validation.json'), 'w', encoding='utf-8').write(txt)
print('A1', V['A1_summary'], 'functions all pass', F['all_pass'], 'seconds', V['seconds'])
print('V1_DONE')

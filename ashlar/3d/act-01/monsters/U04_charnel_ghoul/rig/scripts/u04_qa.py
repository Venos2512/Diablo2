"""R4 + R5 of U04 on the saved rig (read only: the .blend is not saved).

blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_qa.py -- validate          -> rig/validation.json
blender -b --factory-startup rig/U04_charnel_ghoul_rig.blend -P u04_qa.py -- poses [render]    -> rig/_work/poses.json (+ renders)

Poses drive the control rig (ctl_*), the mesh deforms through the runtime skeleton (Copy Transforms), as an animator would.
"""
import bpy, bmesh, os, sys, json, math, re, struct, hashlib, time
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
import u04_joints as UJ
from mathutils import Vector, Matrix, Euler
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree
rb = C.rb

a = C.argv(); MODE = a[0] if a else 'validate'; RENDER = 'render' in a
ob = bpy.data.objects[C.AID]; rt = bpy.data.objects['U04_runtime']; ct = bpy.data.objects['U04_control']
S = bpy.context.scene['u04_scale']; me = ob.data; NV = len(me.vertices)
REST = np.array([v.co[:] for v in me.vertices])
wid, nw = C.weld_ids(ob)
lab_v, isl = C.welded_islands(ob, wid)
ROLE = {0: 'body', 1: 'smock', 2: 'hood', 3: 'tie'}
role = np.array([ROLE.get(lab_v[i], 'tooth') for i in range(NV)])
EDG = np.array([e.vertices[:] for e in me.edges])
me.calc_loop_triangles()
TRI = np.array([lt.vertices[:] for lt in me.loop_triangles])
TRI_BODY = TRI[role[TRI[:, 0]] == 'body']


def setp(k, v):
    ct[k] = v; ct.update_tag()          # custom-property changes from Python do not re-run the drivers without a tag


def reset():
    for o in (ct, rt):
        for pb in o.pose.bones:
            pb.location = (0, 0, 0); pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0); pb.scale = (1, 1, 1)
    for k in ('ik_arm_L', 'ik_arm_R', 'ik_leg_L', 'ik_leg_R'):
        setp(k, 1.0)
    bpy.context.view_layer.update()


def posed():
    dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg); m = ev.to_mesh()
    co = np.empty(len(m.vertices) * 3); m.vertices.foreach_get('co', co); ev.to_mesh_clear()
    return co.reshape(-1, 3) @ np.array(ob.matrix_world.to_3x3()).T + np.array(ob.matrix_world.translation)


def apply_pose(p):
    reset()
    for k, v in p.get('props', {}).items():
        setp(k, v)
    for n, r_ in p.get('rot', {}).items():
        pb = ct.pose.bones[n]; pb.rotation_mode = 'XYZ'; pb.rotation_euler = [math.radians(x) for x in r_]
    for n, l_ in p.get('loc', {}).items():
        ct.pose.bones[n].location = [x * S for x in l_]
    bpy.context.view_layer.update()


def sym(d):
    """L entries -> add mirrored R entries (sagittal X same sign; Y/Z rotations negated)."""
    out = dict(d)
    for k, v in d.items():
        if '_L_' in k:
            out[k.replace('_L_', '_R_')] = [v[0], -v[1], -v[2]]
    return out


IKOFF = {'ik_arm_L': 0.0, 'ik_arm_R': 0.0, 'ik_leg_L': 0.0, 'ik_leg_R': 0.0}
# rotations in degrees about the control bones' local axes (X = sagittal hinge; spine/neck +X = tip down)
# hind leg since 2026-10-27: Thigh (hip -> knee), Calf (knee -> hock, flexion +X), Calf_02 (hock -> heel, flexion -X) = the
# old Calf; the poses written before keep their values on Calf_02 with the knee at rest, so their numbers compare
POSES = {
    'rest': dict(),
    'gallop_reach': dict(props=IKOFF, rot=sym({'ctl_spine_01': [-6, 0, 0], 'ctl_spine_02': [-6, 0, 0], 'ctl_chest': [-6, 0, 0],
                                               'ctl_neck': [8, 0, 0], 'ctl_L_Clavicle': [0, 0, -15], 'ctl_L_UpperArm': [-45, 0, 0], 'ctl_L_ForeArm': [6, 0, 0],
                                               'ctl_L_Hand': [-20, 0, 0], 'ctl_L_Thigh': [35, 0, 0], 'ctl_L_Calf_02':[18, 0, 0],
                                               'ctl_L_Foot': [25, 0, 0]})),
    'gallop_gather': dict(props=IKOFF, rot=sym({'ctl_spine_01': [10, 0, 0], 'ctl_spine_02': [10, 0, 0], 'ctl_chest': [8, 0, 0],
                                                'ctl_neck': [-10, 0, 0], 'ctl_L_UpperArm': [40, 0, 0], 'ctl_L_ForeArm': [-55, 0, 0],
                                                'ctl_L_Hand': [-30, 0, 0], 'ctl_L_Thigh': [-45, 0, 0], 'ctl_L_Calf_02':[-55, 0, 0],
                                                'ctl_L_Foot': [-20, 0, 0]})),
    'pounce': dict(props=IKOFF, loc={'ctl_cog': [0, -0.10, 0.12]},
                   rot=sym({'ctl_cog': [-18, 0, 0], 'ctl_neck': [-12, 0, 0], 'ctl_neck_02': [-10, 0, 0], 'ctl_head': [-8, 0, 0],
                            'ctl_jaw': [15, 0, 0], 'ctl_L_Clavicle': [12, 0, -18], 'ctl_L_UpperArm': [-85, 0, 0], 'ctl_L_ForeArm': [-25, 0, 0],
                            'ctl_L_Hand': [-35, 0, 0], 'ctl_L_Finger': [-20, 0, 0], 'ctl_L_Thigh': [45, 0, 0], 'ctl_L_Calf_02':[20, 0, 0],
                            'ctl_L_Foot': [35, 0, 0]})),
    'head_up': dict(rot={'ctl_neck': [-25, 0, 0], 'ctl_neck_02': [-20, 0, 0], 'ctl_head': [-15, 0, 0]}),
    'head_down': dict(rot={'ctl_neck': [20, 0, 0], 'ctl_neck_02': [18, 0, 0], 'ctl_head': [15, 0, 0]}),
    'head_turn': dict(rot={'ctl_neck': [0, 0, 22], 'ctl_neck_02': [0, 0, 20], 'ctl_head': [0, 15, 0]}),
    'jaw_open': dict(rot={'ctl_jaw': [20, 0, 0]}),
    'jaw_close_50': dict(rot={'ctl_jaw': [-50, 0, 0]}),
    'jaw_close_70': dict(rot={'ctl_jaw': [-70, 0, 0]}),
    'jaw_close_max': dict(rot={'ctl_jaw': [-85, 0, 0]}),
    'twist': dict(rot={'ctl_spine_01': [0, 10, 0], 'ctl_spine_02': [0, 10, 0], 'ctl_chest': [0, 10, 0]}),
    'side_bend': dict(rot={'ctl_spine_01': [0, 0, 10], 'ctl_spine_02': [0, 0, 10], 'ctl_chest': [0, 0, 10], 'ctl_neck': [0, 0, 10]}),
    'arm_forward': dict(props=IKOFF, rot=sym({'ctl_L_UpperArm': [-85, 0, 0]})),
    'arm_back': dict(props=IKOFF, rot=sym({'ctl_L_UpperArm': [55, 0, 0], 'ctl_L_ForeArm': [-30, 0, 0]})),
    'arm_out': dict(props=IKOFF, rot={'ctl_L_UpperArm': [0, 0, 45], 'ctl_R_UpperArm': [0, 0, -45]}),
    'elbow_flex': dict(props=IKOFF, rot=sym({'ctl_L_UpperArm': [-30, 0, 0], 'ctl_L_ForeArm': [-110, 0, 0]})),
    'leg_forward': dict(props=IKOFF, rot=sym({'ctl_L_Thigh': [-60, 0, 0], 'ctl_L_Calf_02':[-70, 0, 0]})),
    'leg_back': dict(props=IKOFF, rot=sym({'ctl_L_Thigh': [45, 0, 0], 'ctl_L_Calf_02':[20, 0, 0], 'ctl_L_Foot': [30, 0, 0]})),
    'shrug': dict(rot=sym({'ctl_L_Clavicle': [25, 0, 0]})),
    'wrist_twist': dict(props=IKOFF, rot=sym({'ctl_L_Hand': [0, 60, 0]})),
    'hand_roll': dict(rot=sym({'ctl_L_Palm_roll': [40, 0, 0]})),
    'heel_lift': dict(rot=sym({'ctl_L_Ball_roll': [40, 0, 0]})),
    'knee_flex': dict(props=IKOFF, rot=sym({'ctl_L_Thigh': [-30, 0, 0], 'ctl_L_Calf': [70, 0, 0]})),
    'hock_flex': dict(props=IKOFF, rot=sym({'ctl_L_Calf_02': [-50, 0, 0], 'ctl_L_Foot': [30, 0, 0]})),
    'hock_roll': dict(rot=sym({'ctl_L_Hock_roll': [20, 0, 0]})),
    'crouch': dict(loc={'ctl_cog': [0, 0, -0.12]}),
    'cloth_swing': dict(rot={'ctl_smock_front_01': [-25, 0, 0], 'ctl_smock_back_01': [25, 0, 0], 'ctl_L_smock_flank_01': [0, 0, 20],
                             'ctl_R_smock_flank_01': [0, 0, -20], 'ctl_tie_01': [-30, 0, 0]}),
}


def stretch(co, mask_edges):
    e = EDG[mask_edges]; l0 = np.linalg.norm(REST[e[:, 0]] - REST[e[:, 1]], axis=1)
    keep = l0 > 0.001; e = e[keep]; l0 = l0[keep]
    l1 = np.linalg.norm(co[e[:, 0]] - co[e[:, 1]], axis=1)
    r = np.maximum(l1 / l0, l0 / np.maximum(l1, 1e-9))
    k = int(np.argmax(r))
    return r, e, k


def dominant_bone(vi):
    best = max(((ob.vertex_groups[g.group].name, g.weight) for g in me.vertices[vi].groups), key=lambda t: t[1])
    return best[0]


def inside_list(co, idx, tol=0.003):
    bvh = BVHTree.FromPolygons([Vector(p) for p in co], [tuple(t) for t in TRI_BODY])
    out = []
    for i in idx:
        loc, nrm, fi, d = bvh.find_nearest(Vector(co[i]))
        if loc is not None and (Vector(co[i]) - loc).dot(nrm) < -tol:
            out.append(int(i))
    return out


def inside_count(co, idx, tol=0.003):
    return len(inside_list(co, idx, tol))


def teeth_gap(co):
    up = [i for i in range(NV) if role[i] == 'tooth' and REST[i, 2] / S > 0.80]
    lo_isl = {lab_v[i] for i in range(NV) if role[i] == 'tooth' and REST[i, 2] / S <= 0.80}
    jawv = [i for i in range(NV) if (role[i] == 'tooth' and lab_v[i] in lo_isl)]
    kd = KDTree(len(jawv))
    for k, i in enumerate(jawv):
        kd.insert(co[i], k)
    kd.balance()
    return min(kd.find(co[i])[2] for i in up)


# ================================================================== R4
if MODE == 'validate':
    out = dict(asset=C.AID, date=time.strftime('%Y-%m-%d'), blender=bpy.app.version_string, scale=S, checks={})
    chk = out['checks']

    def put(key, ok, **kw):
        chk[key] = dict(ok=bool(ok), **kw)
    reset()
    skinned = [o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
    put('A1.1_one_skin_one_mesh', len(skinned) == 1 and len([m for m in ob.modifiers if m.type == 'ARMATURE']) == 1,
        meshes=[o.name for o in skinned])
    import u04_layout as UL
    rbn = [b.name for b in rt.data.bones]
    std_sockets = {'fx_hand_L', 'fx_hand_R'}          # names given by SKELETON_STANDARD §3 (socket row)
    bad = [n for n in rbn if '.' in n or ' ' in n or (re.search(r'(\.|_)(L|R)$', n) and n not in std_sockets)
           or not re.fullmatch(r'[A-Za-z0-9_]+', n)]
    core_missing = [n for n in UL.CORE_H + UL.QH_SHARED if n not in rbn]
    put('A1.2_names', not bad and not core_missing and len(rbn) == len(set(rbn)), bones=len(rbn), bad=bad, core_missing=core_missing,
        names=rbn)
    roots = [b.name for b in rt.data.bones if b.parent is None]
    put('A1.3_single_tree', roots == ['root'], roots=roots)
    gname = {g.index: g.name for g in ob.vertex_groups}
    deform = {b.name for b in rt.data.bones if b.use_deform}
    n_empty = n_sum = n_inf = 0; worst_sum = 0.0; max_inf = 0
    bone_has = {n: 0 for n in deform}; bad_groups = set()
    for v in me.vertices:
        ws = [(gname[g.group], g.weight) for g in v.groups if g.weight > 0]
        if not ws:
            n_empty += 1; continue
        s_ = sum(w for _, w in ws); worst_sum = max(worst_sum, abs(s_ - 1)); n_sum += abs(s_ - 1) > 1e-6
        max_inf = max(max_inf, len(ws)); n_inf += len(ws) > 4
        for n, w in ws:
            if n in bone_has:
                bone_has[n] += 1
            else:
                bad_groups.add(n)
    put('A1.4_no_empty_vertex', n_empty == 0, empty=n_empty)
    put('A1.5_weight_sum', n_sum == 0, max_abs_err=worst_sum, verts_over_1em6=n_sum)
    put('A1.6_max_4_influences', n_inf == 0, max_influences=max_inf)
    put('A1.7_groups_are_deform_bones', not bad_groups and all(g.name in deform for g in ob.vertex_groups), bad=sorted(bad_groups))
    # A1.8 bind / rest: runtime rest matrices consistent (orthonormal, connected children at the parent tail, control rest ==
    # runtime rest); rest pose deforms nothing with the IK off; IK on at rest = solver tolerance only (reported)
    orth = 0.0; conn = 0.0
    for b in rt.data.bones:
        R3 = b.matrix_local.to_3x3(); orth = max(orth, max(abs(x - y) for r1, r2 in zip(R3 @ R3.transposed(), Matrix.Identity(3)) for x, y in zip(r1, r2)))
        if b.parent and b.use_connect:
            conn = max(conn, (b.head_local - b.parent.tail_local).length)
    rt_vs_ct = 0.0
    for b in rt.data.bones:
        c_ = ct.data.bones.get('ctl_' + b.name)
        if c_:
            rt_vs_ct = max(rt_vs_ct, max(abs(x - y) for r1, r2 in zip(b.matrix_local, c_.matrix_local) for x, y in zip(r1, r2)))
    for k in ('ik_arm_L', 'ik_arm_R', 'ik_leg_L', 'ik_leg_R'):
        setp(k, 0.0)
    bpy.context.view_layer.update()
    dev_fk = float(np.abs(posed() - REST).max())
    reset(); bpy.context.view_layer.update()
    dev_ik = float(np.abs(posed() - REST).max())
    put('A1.8_bind_matrices_rest', orth <= 1e-5 and conn <= 1e-6 and rt_vs_ct <= 1e-6 and dev_fk <= 1e-5 and dev_ik <= 2e-4,
        orthonormal_err=orth, connected_head_gap_m=conn, control_vs_runtime_rest=rt_vs_ct, rest_mesh_dev_ik_off_m=dev_fk,
        rest_mesh_dev_ik_on_m=dev_ik, note='IK bật ở rest lệch trong dung sai hội tụ của bộ giải IK (≤ 0,2 mm); IK tắt = 0')
    # A1.10 textures: packed bytes == GLB images
    with open(C.GLB, 'rb') as f:
        data = f.read()
    jl = struct.unpack_from('<I', data, 12)[0]; js = json.loads(data[20:20 + jl]); bin0 = 20 + jl + 8
    glb_h = []
    for im in js.get('images', []):
        bv = js['bufferViews'][im['bufferView']]; off = bin0 + bv.get('byteOffset', 0)
        glb_h.append(hashlib.sha256(data[off:off + bv['byteLength']]).hexdigest())
    blend_h = [hashlib.sha256(im.packed_file.data).hexdigest() for im in bpy.data.images if im.packed_file]
    put('A1.10_textures_unchanged', sorted(glb_h) == sorted(blend_h), glb=len(glb_h), packed=len(blend_h),
        sizes=[list(im.size) for im in bpy.data.images if im.packed_file])
    # A1.9 mesh == GLB scaled (fresh import in a temporary scene of this session)
    bpy.ops.import_scene.gltf(filepath=C.GLB, merge_vertices=True)
    imp = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
    M = imp.matrix_world.copy(); Q = np.array([(M @ v.co)[:] for v in imp.data.vertices]) * S
    same_n = len(Q) == NV
    d9 = float(np.abs(Q - REST).max()) if same_n else None
    put('A1.9_mesh_matches_scaled_glb', same_n and d9 <= 1e-4, max_vertex_dist_m=d9, verts=NV)
    for o in list(bpy.context.selected_objects):
        bpy.data.objects.remove(o)
    hgt = float(REST[:, 2].max() - REST[:, 2].min()); cat = 0.65 * 1.8
    put('A1.11_height', abs(hgt - cat) <= 0.02 * cat, height_m=round(hgt, 4), catalogue_m=cat)
    zmin = float(REST[:, 2].min())
    hind = REST[(np.abs(REST[:, 0]) > 0.035 * S) & (REST[:, 1] > 0.16 * S) & (REST[:, 2] < 0.2 * S) & (role == 'body')]
    put('A1.12_on_ground', abs(zmin) <= 0.01, z_min_m=round(zmin, 5), hind_feet_lowest_m=round(float(hind[:, 2].min()), 4),
        note='chỉ móng tay chạm đất; bàn chân sau lơ lửng ở rest (lỗi mesh, đã ghi ở brief)')
    nodef = sorted(b.name for b in rt.data.bones if not b.use_deform)
    unweighted = sorted(n for n, k in bone_has.items() if k == 0)
    put('A1.13_unweighted_bones', not unweighted and set(nodef) == set(UL.SOCKETS) | {'root', 'cog'}, unweighted_deform=unweighted,
        non_deform=nodef, note='root, cog giữ làm tổ tiên cấu trúc (SKELETON_STANDARD §7)')
    tr = {}
    for o in (ob, rt, ct):
        tr[o.name] = dict(scale=[round(x, 6) for x in o.scale], rot=[round(x, 6) for x in o.rotation_euler], loc=[round(x, 6) for x in o.location])
    put('A1.14_transforms', all(v['scale'] == [1, 1, 1] and v['rot'] == [0, 0, 0] for v in tr.values()), objects=tr)
    # extra: co-located vertices share weights
    wrow = {}
    diff = 0.0
    for i, v in enumerate(me.vertices):
        r_ = tuple(sorted((gname[g.group], round(g.weight, 6)) for g in v.groups))
        if wid[i] in wrow and wrow[wid[i]] != r_:
            diff += 1
        wrow.setdefault(wid[i], r_)
    put('X1_colocated_vertices_same_weights', diff == 0, differing=int(diff))
    # extra: control rig function tests
    tests = {}

    def bone_pos(n):
        return rt.pose.bones[n].head.copy()

    def move_world(n, d):
        pb = ct.pose.bones[n]; pb.location = pb.bone.matrix_local.to_3x3().inverted() @ Vector(d)
        bpy.context.view_layer.update()

    def moved(names_):
        return max((rt.pose.bones[n].head - rt.pose.bones[n].bone.head_local).length for n in names_)
    for side in 'LR':
        reset(); move_world(f'ctl_{side}_Foot_IK', (0, 0, 0.05 * S))
        a_ = (bone_pos(f'{side}_Foot') - rt.data.bones[f'{side}_Foot'].head_local)
        other = 'R' if side == 'L' else 'L'
        tests[f'{side}_Foot_IK_up5cm'] = dict(ankle_follow_m=round(a_.length, 4), still_m=round(moved([f'{other}_Foot', 'pelvis', 'L_Hand', 'R_Hand']), 6),
                                              ok=abs(a_.length - 0.05 * S) < 0.002 and moved([f'{other}_Foot', 'pelvis']) < 1e-4)
        reset(); move_world(f'ctl_{side}_Hand_IK', (0, 0.0, 0.06 * S))
        a_ = (bone_pos(f'{side}_Hand') - rt.data.bones[f'{side}_Hand'].head_local)
        tests[f'{side}_Hand_IK_move6cm'] = dict(wrist_follow_m=round(a_.length, 4), ok=abs(a_.length - 0.06 * S) < 0.002 and moved(['chest']) < 1e-4)
        reset(); pb = ct.pose.bones[f'ctl_{side}_Palm_roll']; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (math.radians(30), 0, 0)
        bpy.context.view_layer.update()
        tip = rt.pose.bones[f'{side}_Finger'].tail - rt.data.bones[f'{side}_Finger'].tail_local
        wr = rt.pose.bones[f'{side}_Hand'].head - rt.data.bones[f'{side}_Hand'].head_local
        tests[f'{side}_Palm_roll_+30'] = dict(fingertip_moved_m=round(tip.length, 5), wrist_lift_m=round(wr.z, 4), ok=tip.length < 1e-3 and wr.z > 0.01)
        reset(); pb = ct.pose.bones[f'ctl_{side}_Ball_roll']; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (math.radians(30), 0, 0)
        bpy.context.view_layer.update()
        toe = rt.pose.bones[f'{side}_Toe'].tail - rt.data.bones[f'{side}_Toe'].tail_local
        an = rt.pose.bones[f'{side}_Foot'].head - rt.data.bones[f'{side}_Foot'].head_local
        tests[f'{side}_Ball_roll_+30'] = dict(toe_tip_moved_m=round(toe.length, 5), ankle_lift_m=round(an.z, 4), ok=toe.length < 1e-3 and an.z > 0.01)
        reset(); move_world(f'ctl_{side}_Knee_pole', (0.10 * S, 0, 0))
        kn = rt.pose.bones[f'{side}_Calf'].head - rt.data.bones[f'{side}_Calf'].head_local
        an = rt.pose.bones[f'{side}_Foot'].head - rt.data.bones[f'{side}_Foot'].head_local
        tests[f'{side}_Knee_pole_x10cm'] = dict(knee_moved_m=round(kn.length, 4), ankle_moved_m=round(an.length, 5), ok=kn.length > 0.005 and an.length < 1e-3)
        reset(); pb = ct.pose.bones[f'ctl_{side}_Hock_roll']; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (math.radians(20), 0, 0)
        bpy.context.view_layer.update()
        hk = rt.pose.bones[f'{side}_Calf_02'].head - rt.data.bones[f'{side}_Calf_02'].head_local
        an = rt.pose.bones[f'{side}_Foot'].head - rt.data.bones[f'{side}_Foot'].head_local
        tests[f'{side}_Hock_roll_+20'] = dict(hock_moved_m=round(hk.length, 4), hock_dy_m=round(hk.y, 4), ankle_moved_m=round(an.length, 5),
                                              ok=hk.length > 0.02 and hk.y < 0 and an.length < 1e-3)
    reset(); move_world('ctl_root', (0.2, 0.0, 0.0))
    tests['root_moves_all'] = dict(ok=all(abs((rt.pose.bones[n].head - rt.data.bones[n].head_local).length - 0.2) < 1e-4 for n in ('head', 'L_Foot', 'R_Hand')))
    reset(); move_world('ctl_cog', (0, 0, -0.05 * S))
    feet = max((rt.pose.bones[f'{s}_Foot'].head - rt.data.bones[f'{s}_Foot'].head_local).length for s in 'LR')
    hands = max((rt.pose.bones[f'{s}_Hand'].head - rt.data.bones[f'{s}_Hand'].head_local).length for s in 'LR')
    pel = rt.pose.bones['pelvis'].head - rt.data.bones['pelvis'].head_local
    tests['cog_down5cm_feet_hands_planted'] = dict(feet_m=round(feet, 5), hands_m=round(hands, 5), pelvis_dz_m=round(pel.z, 4),
                                                   ok=feet < 1e-3 and hands < 1e-3 and abs(pel.z + 0.05 * S) < 1e-3)
    reset(); setp('ik_leg_L', 0.0); ct.pose.bones['ctl_L_Thigh'].rotation_mode = 'XYZ'; ct.pose.bones['ctl_L_Thigh'].rotation_euler = (math.radians(-30), 0, 0)
    bpy.context.view_layer.update()
    kn = rt.pose.bones['L_Calf'].head - rt.data.bones['L_Calf'].head_local
    tests['L_leg_FK_switch'] = dict(knee_moved_m=round(kn.length, 4), ok=kn.length > 0.05)
    reset(); ct.pose.bones['ctl_L_Hand'].rotation_mode = 'XYZ'; setp('ik_arm_L', 0.0)
    ct.pose.bones['ctl_L_Hand'].rotation_euler = (0, math.radians(60), 0); bpy.context.view_layer.update()
    tw = ct.pose.bones['ctl_L_ForeArm_twist'].matrix.to_quaternion().rotation_difference(ct.pose.bones['ctl_L_ForeArm'].matrix.to_quaternion())
    tests['L_forearm_twist_follows_hand'] = dict(twist_deg=round(math.degrees(tw.angle), 2), ok=15 < math.degrees(tw.angle) < 45)
    put('X2_control_rig_functions', all(t['ok'] for t in tests.values()), tests=tests)
    reset()
    out['summary'] = dict(passed=sum(c['ok'] for c in chk.values()), total=len(chk),
                          failed=[k for k, c in chk.items() if not c['ok']])
    C.save_json(os.path.join(C.RIG, 'validation.json'), out)
    print('VALIDATE_DONE', out['summary'])

# ================================================================== R5 poses
if MODE == 'poses':
    for im in bpy.data.images:
        if im.size[0] > 1024:
            im.scale(1024, 1024)
    body_e = (role[EDG[:, 0]] == 'body') & (role[EDG[:, 1]] == 'body')
    cloth_e = np.isin(role[EDG[:, 0]], ['smock', 'hood', 'tie']) & (role[EDG[:, 0]] == role[EDG[:, 1]])
    smock_idx = np.nonzero(role == 'smock')[0]
    res = {}
    reset(); base_in = inside_count(posed(), smock_idx)
    only = [x for x in a[1:] if x in POSES]
    for name, p in POSES.items():
        if only and name not in only:
            continue
        apply_pose(p); co = posed()
        r, e, k = stretch(co, body_e); rc, ec, kc = stretch(co, cloth_e)
        q = dict(stretch=round(float(r.max()), 2), p99=round(float(np.percentile(r, 99.5)), 3),
                 worst_at=dominant_bone(int(e[k][0])), worst_xyz=C.r(Vector(REST[e[k][0]] / S), 3),
                 cloth_stretch=round(float(rc.max()), 2), cloth_worst_at=dominant_bone(int(ec[kc][0])) + '/' + role[int(ec[kc][0])],
                 cloth_by_role={rl: round(float(rc[role[ec[:, 0]] == rl].max()), 2) for rl in ('smock', 'hood', 'tie') if (role[ec[:, 0]] == rl).any()},
                 smock_inside=inside_count(co, smock_idx) - base_in)
        if name.startswith('jaw'):
            q['teeth_gap_m'] = round(teeth_gap(co), 4)
        res[name] = q
        C.log(name, q)
        if RENDER:
            pre = os.path.join(C.QA, 'raw', f'pose_{name}')
            os.makedirs(os.path.dirname(pre), exist_ok=True)
            lo = Vector(co.min(0)); hi = Vector(co.max(0)); c0 = (lo + hi) / 2; sz = max(hi - lo) * 1.12
            if name.startswith(('jaw', 'head')):
                c0 = Vector((0, -0.36 * S, 0.82 * S)); sz = 0.55 * S
            rb.set_point_colors(ob, rb.stretch_colors(ob), name='u04_st')
            rb.render_views(pre + '_heat', [ob], views=('three_quarter',), color_type='VERTEX', res=700, center=c0, size=sz)
            rb.clear_point_colors(ob, 'u04_st')
            rb.render_views(pre, [ob], views=('three_quarter', 'left'), color_type='TEXTURE', res=700, center=c0, size=sz)
    reset()
    C.save_json(os.path.join(C.WORK, 'poses.json'), dict(baseline_smock_inside=base_in, poses=res))
    print('POSES_DONE', len(res))

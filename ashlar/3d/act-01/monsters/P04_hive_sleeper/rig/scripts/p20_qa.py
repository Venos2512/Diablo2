"""P04 Hive-Sleeper, R4 + R5 on rig/P04_hive_sleeper_rig.blend (opened read-only: nothing is saved).

blender -b --factory-startup -P p20_qa.py -- [--no-render] [--poses a,b,...] [--tag name]

R4: rig/validation.json (QA_CHECKLIST A1.1-A1.14 + control-rig checks). R5: renders in rig/qa/raw/ (skeleton overlay,
weight maps, test poses posed through the CONTROL rig) composed later by p21_sheets.py. Pose numbers (edge stretch,
seams, cloth inside limb capsules) go into validation.json.
"""
import bpy, sys, os, json, math, time, hashlib, struct, re
import numpy as np
from mathutils import Vector, Quaternion, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import p04_common as C
sys.path.insert(0, C.TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
RENDER = '--no-render' not in argv
ONLY = argv[argv.index('--poses') + 1].split(',') if '--poses' in argv else None
TAG = argv[argv.index('--tag') + 1] if '--tag' in argv else ''
RAW = os.path.join(C.QA, 'raw'); os.makedirs(RAW, exist_ok=True)
BLEND = os.path.join(C.RIG_DIR, f'{C.ASSET}_rig.blend')
rb.K = 1.0
t0 = time.time()
rb.open_blend(BLEND)
ob = bpy.data.objects[C.ASSET]; rt = bpy.data.objects['P04_hive_sleeper_rig']; ct = bpy.data.objects['P04_hive_sleeper_ctl']
me = ob.data
V0 = np.array([v.co[:] for v in me.vertices])
REG = np.empty(len(me.vertices), dtype=np.int32); me.attributes['p04_region'].data.foreach_get('value', REG)
REGION_NAMES = ['none', 'trunk', 'head', 'dome', 'drape', 'arm', 'leg', 'belly', 'sleeve', 'panel', 'ribbon', 'bit']
V_ = {}


def upd():
    bpy.context.view_layer.update()


def posed():
    upd(); dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg).to_mesh()
    P = np.array([v.co[:] for v in ev.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    return P


TWIST = {n for n in ct.pose.bones.keys() if n.endswith('_twist')}


def reset():
    for pb in ct.pose.bones:
        pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
        if pb.name in TWIST:
            continue
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0)
    for S in 'LR':
        ct[f'ik_arm_{S}'] = 1.0; ct[f'ik_leg_{S}'] = 1.0
    upd()


def move(n, d):
    pb = ct.pose.bones[n]; M = (ct.matrix_world @ ct.data.bones[n].matrix_local).to_3x3()
    pb.location = Vector(pb.location) + M.inverted() @ Vector(d)


def rot(n, axis, deg):
    pb = ct.pose.bones[n]; M = ct.data.bones[n].matrix_local.to_3x3()
    a = (M.inverted() @ Vector(axis)).normalized()
    pb.rotation_mode = 'QUATERNION'
    pb.rotation_quaternion = Quaternion(a, math.radians(deg)) @ pb.rotation_quaternion


# ------------------------------------------------------------------ poses through the control rig
POSES = {
    'crawl_contact': [('move', 'ctl_cog', (0, -0.05, -0.01)), ('move', 'ctl_L_Hand_IK', (0, -0.20, 0)), ('move', 'ctl_R_Hand_IK', (0, 0.08, 0)),
                      ('move', 'ctl_R_Knee_IK', (0, -0.16, 0)), ('move', 'ctl_L_Knee_IK', (0, 0.06, 0)),
                      ('rot', 'ctl_chest', (0, 0, 1), -5), ('rot', 'ctl_pelvis', (0, 0, 1), 5), ('rot', 'ctl_cog', (0, 1, 0), 3),
                      ('rot', 'ctl_neck', (0, 0, 1), 6)],
    'crawl_lift': [('move', 'ctl_cog', (0, -0.03, 0)), ('move', 'ctl_L_Hand_IK', (0, -0.08, 0.10)), ('rot', 'ctl_L_Hand_IK', (1, 0, 0), 25),
                   ('move', 'ctl_R_Knee_IK', (0, -0.08, 0.08)), ('rot', 'ctl_R_Knee_IK', (1, 0, 0), -20),
                   ('rot', 'ctl_cog', (0, 1, 0), -4)],
    'head_up': [('rot', 'ctl_neck', (1, 0, 0), -12), ('rot', 'ctl_neck_02', (1, 0, 0), -12), ('rot', 'ctl_head', (1, 0, 0), -15)],
    'head_down': [('rot', 'ctl_neck', (1, 0, 0), 10), ('rot', 'ctl_neck_02', (1, 0, 0), 10), ('rot', 'ctl_head', (1, 0, 0), 15)],
    'head_turn': [('rot', 'ctl_neck', (0, 0, 1), 15), ('rot', 'ctl_neck_02', (0, 0, 1), 15), ('rot', 'ctl_head', (0, 0, 1), 20)],
    'reach_L': [('prop', 'ik_arm_L', 0.0), ('rot', 'ctl_L_UpperArm', (1, 0, 0), -70), ('rot', 'ctl_L_Hand', (1, 0, 0), 50),
                ('rot', 'ctl_L_Clavicle', (0, 0, 1), -8)],
    'twist': [('rot', 'ctl_spine_01', (0, 1, 0), 8), ('rot', 'ctl_spine_02', (0, 1, 0), 8), ('rot', 'ctl_chest', (0, 1, 0), 8)],
    'arch_up': [('rot', 'ctl_spine_01', (1, 0, 0), -10), ('rot', 'ctl_chest', (1, 0, 0), 10)],
    'sag_down': [('rot', 'ctl_spine_01', (1, 0, 0), 10), ('rot', 'ctl_chest', (1, 0, 0), -10)],
    'side_bend': [('rot', 'ctl_spine_01', (0, 0, 1), 6), ('rot', 'ctl_spine_02', (0, 0, 1), 6), ('rot', 'ctl_chest', (0, 0, 1), 6)],
    'knee_lift_L': [('move', 'ctl_L_Knee_IK', (0, -0.05, 0.12)), ('rot', 'ctl_L_Knee_IK', (1, 0, 0), -15)],
    'palm_lift_L': [('rot', 'ctl_L_Palm_roll', (1, 0, 0), 35)],
    'pronate_L': [('rot', 'ctl_L_Hand_IK', (0, 0, 1), 35)],
    'domes': [('rot', 'ctl_dome_01', (1, 0, 0), 12), ('rot', 'ctl_dome_02', (0, 1, 0), 12), ('rot', 'ctl_dome_03', (1, 0, 0), -12)],
}


def apply(spec):
    reset()
    for op in spec:
        if op[0] == 'move':
            move(op[1], op[2])
        elif op[0] == 'rot':
            rot(op[1], op[2], op[3])
        elif op[0] == 'prop':
            ct[op[1]] = op[2]
    upd()


# ------------------------------------------------------------------ measures
EDGES = np.array([e.vertices[:] for e in me.edges]); L0 = np.linalg.norm(V0[EDGES[:, 0]] - V0[EDGES[:, 1]], axis=1)
key = np.round(V0 / 1e-5).astype(np.int64)
_, inv = np.unique(key, axis=0, return_inverse=True); inv = inv.ravel()
groups = {}
for i, k in enumerate(inv):
    groups.setdefault(k, []).append(i)
COINC = [g for g in groups.values() if len(g) > 1]


def stretch(P, min_len=0.004, hi=1.6, lo=0.5):
    ok = L0 >= min_len
    L1 = np.linalg.norm(P[EDGES[:, 0]] - P[EDGES[:, 1]], axis=1)
    q = np.where(ok, L1 / np.maximum(L0, 1e-9), 1.0); qq = np.maximum(q, 1 / np.maximum(q, 1e-6))
    bad = ok & ((q > hi) | (q < lo))
    reg = {}
    er = np.maximum(REG[EDGES[:, 0]], REG[EDGES[:, 1]])
    for r in np.unique(er):
        m = (er == r) & ok
        if m.any():
            j = np.argmax(np.where(m, qq, 0))
            reg[REGION_NAMES[r]] = [round(float(qq[j]), 2), int((bad & m).sum()), round(float(abs(L1[j] - L0[j]) * 1000), 1)]
    j = int(np.argmax(qq))
    return dict(worst=round(float(qq[j]), 2), bad_edges=int(bad.sum()), worst_at=[round(c, 3) for c in V0[EDGES[j, 0]]],
                worst_dlen_mm=round(float(abs(np.linalg.norm(P[EDGES[j, 0]] - P[EDGES[j, 1]]) - L0[j]) * 1000), 1), by_region=reg)


def seams(P):
    if not COINC:
        return dict(n=0, max_mm=0.0)
    d = max(float(np.linalg.norm(P[g] - P[g[0]], axis=1).max()) for g in COINC)
    return dict(n=len(COINC), max_mm=round(d * 1000, 3))


# capsules around limb bones (runtime, posed): radius = 70th percentile distance of skin vertices dominated by the bone
GW = {g.index: g.name for g in ob.vertex_groups}
DOM = []
for v in me.vertices:
    best = max(((GW[g.group], g.weight) for g in v.groups), key=lambda t: t[1], default=(None, 0))
    DOM.append(best)
CAPS = [f'{S}_{b}' for S in 'LR' for b in ('UpperArm', 'ForeArm', 'Thigh', 'Calf')]
RAD = {}
for n in CAPS:
    b = rt.data.bones[n]; a = np.array(b.head_local); c = np.array(b.tail_local)
    ids = [i for i, (bn, w) in enumerate(DOM) if bn and bn.startswith(n) and w > 0.5 and REG[i] in (5, 6)]
    P = V0[ids]; ab = c - a; t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1); d = np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
    RAD[n] = round(float(np.percentile(d, 70)), 4) if len(d) else 0.04
CLOTH = np.isin(REG, [1, 4, 8, 9, 11])


CAP_FROM = {'UpperArm': 0.3, 'Thigh': 0.3}     # skip the joint cap at the shoulder / hip (cloth covers it by design)


def inside(P):
    out = {}; tot = np.zeros(len(P), bool)
    for n in CAPS:
        pb = rt.pose.bones[n]; a = np.array(rt.matrix_world @ pb.head); c = np.array(rt.matrix_world @ pb.tail)
        t0 = CAP_FROM.get(n[2:], 0.0); a = a + (c - a) * t0
        ab = c - a; t = np.clip(((P - a) @ ab) / (ab @ ab), 0, 1); d = np.linalg.norm(P - (a + t[:, None] * ab), axis=1)
        m = CLOTH & (d < RAD[n] - 0.005)
        out[n] = int(m.sum()); tot |= m
    return out, tot


# ------------------------------------------------------------------ R4 validation
val = dict(asset=C.ASSET, date=time.strftime('%Y-%m-%d'), blender=bpy.app.version_string, blend=BLEND.replace('\\', '/'),
           S=C.S, top_m=C.TOP_M, k=rt.get('skill_scale'))
A = {}
skinned = [o for o in bpy.context.scene.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
A['A1.1'] = dict(ok=len(skinned) == 1 and skinned[0] == ob and ob.modifiers['Armature'].object == rt,
                 meshes=[o.name for o in skinned], armature=ob.modifiers['Armature'].object.name)
expected = [b['name'] for b in C.bone_table()]
names = [b.name for b in rt.data.bones]
bad_names = [n for n in names if not re.fullmatch(r'[A-Za-z0-9_]+', n)]
A['A1.2'] = dict(ok=sorted(names) == sorted(expected) and len(set(names)) == len(names) and not bad_names,
                 bones=len(names), missing=sorted(set(expected) - set(names)), extra=sorted(set(names) - set(expected)), bad=bad_names)
roots = [b.name for b in rt.data.bones if b.parent is None]
A['A1.3'] = dict(ok=roots == ['root'], roots=roots)
deform = {b.name for b in rt.data.bones if b.use_deform}
gname = {g.index: g.name for g in ob.vertex_groups}
empty = 0; maxinf = 0; sumdev = 0.0; unknown = set(); nondef = 0
for v in me.vertices:
    gs = [(gname[g.group], g.weight) for g in v.groups if g.weight > 0]
    if not gs:
        empty += 1; continue
    maxinf = max(maxinf, len(gs)); sumdev = max(sumdev, abs(sum(w for _, w in gs) - 1))
    for n, _ in gs:
        if n not in rt.data.bones:
            unknown.add(n)
        elif n not in deform:
            nondef += 1
A['A1.4'] = dict(ok=empty == 0, empty=empty)
A['A1.5'] = dict(ok=sumdev <= 1e-6 + 1e-7, max_abs_sum_minus_1=float(f'{sumdev:.2e}'),
                 note='vertex group weights are float32 in Blender; the GLB exporter renormalises')
A['A1.6'] = dict(ok=maxinf <= 4, max_influences=maxinf)
A['A1.7'] = dict(ok=not unknown and nondef == 0, unknown_groups=sorted(unknown), weights_on_non_deform=nondef)
reset()
mw = max(abs(x - (1.0 if i == j else 0.0)) for o in (ob, rt, ct) for i, row in enumerate(o.matrix_world) for j, x in enumerate(row))
dev_a = 0.0; dev_d = 0.0; per_bone = []
for pb in rt.pose.bones:
    b = rt.data.bones[pb.name]
    a_ = math.degrees(b.matrix_local.to_quaternion().rotation_difference(pb.matrix.to_quaternion()).angle)
    d_ = max((b.head_local - pb.head).length, (b.tail_local - pb.tail).length)
    dev_a = max(dev_a, a_); dev_d = max(dev_d, d_); per_bone.append((d_, a_, pb.name))
per_bone.sort(reverse=True)
P_rest = posed()
rt.data.pose_position = 'REST'; P_bind = posed(); rt.data.pose_position = 'POSE'; upd()
conn = max(((b.head_local - b.parent.tail_local).length for b in rt.data.bones if b.parent and b.use_connect), default=0.0)
bind_dev = float(np.abs(P_bind - V0).max())
A['A1.8'] = dict(ok=conn <= 1e-6 and bind_dev <= 1e-6 and mw <= 1e-6, connected_joint_gap_m=float(f'{conn:.1e}'),
                 bind_mesh_dev_m=float(f'{bind_dev:.1e}'),
                 note='bind = rest of the runtime armature (identity object matrices, connected joints exact, mesh at bind = '
                      'input). Inverse bind matrices are written by the glTF exporter and re-checked on the GLB at R8')
# A1.9 / A1.10: fresh import of the GLB, scaled, compared by vertex index; texture bytes vs the GLB's embedded images
before = set(bpy.data.objects); before_img = set(bpy.data.images)
bpy.ops.import_scene.gltf(filepath=C.GLB, merge_vertices=True)
imp = [o for o in bpy.data.objects if o not in before]
im = [o for o in imp if o.type == 'MESH'][0]
Mw = im.matrix_world.copy()
Vg = np.array([(Mw @ v.co)[:] for v in im.data.vertices]) * C.S
A['A1.9'] = dict(ok=Vg.shape == V0.shape and float(np.abs(Vg - V0).max()) <= 1e-4,
                 max_dist_m=float(f'{float(np.linalg.norm(Vg - V0, axis=1).max()):.2e}') if Vg.shape == V0.shape else None)
for o in imp:
    bpy.data.objects.remove(o)
with open(C.GLB, 'rb') as f:
    raw = f.read()
jl = struct.unpack('<I', raw[12:16])[0]; js = json.loads(raw[20:20 + jl]); bo = 20 + jl + 8
glb_img = {}
for i, im_ in enumerate(js.get('images', [])):
    bv = js['bufferViews'][im_['bufferView']]; data = raw[bo + bv.get('byteOffset', 0): bo + bv.get('byteOffset', 0) + bv['byteLength']]
    glb_img[im_.get('name', str(i))] = hashlib.sha256(data).hexdigest()
blend_img = {}
for img in bpy.data.images:
    if img in before_img and img.packed_file:
        blend_img[img.name] = hashlib.sha256(bytes(img.packed_file.data)).hexdigest()
match = sorted(set(glb_img.values()) & set(blend_img.values()))
A['A1.10'] = dict(ok=len(match) == len(glb_img) == 3, glb_images=len(glb_img), blend_packed=len(blend_img), identical=len(match))
for img in [i for i in bpy.data.images if i not in before_img]:
    bpy.data.images.remove(img)
zmax = float(V0[:, 2].max()); zmin = float(V0[:, 2].min())
A['A1.11'] = dict(ok=abs(zmax - C.TOP_M) <= 0.02 * C.TOP_M, height_m=round(zmax, 4), target_m=C.TOP_M,
                  note='0.60H to the top of the front dome (G1); length 1.756 m')
A['A1.12'] = dict(ok=abs(zmin) <= 0.01, lowest_z_m=round(zmin, 5))
used = {gname[g.group] for v in me.vertices for g in v.groups if g.weight > 0}
nonw = sorted(n for n in names if n not in used)
A['A1.13'] = dict(ok=set(nonw) <= {b['name'] for b in C.bone_table() if not b['deform']}, without_weights=nonw,
                  note='root, cog kept as structural ancestors (SKELETON_STANDARD 7); the rest are sockets')
A['A1.14'] = dict(ok=mw <= 1e-6 and all(min(o.scale) > 0 for o in (ob, rt, ct)), max_matrix_offset=float(f'{mw:.1e}'),
                  scales={o.name: list(o.scale) for o in (ob, rt, ct)})
val['A1'] = A
val['A1_pass'] = all(v['ok'] for v in A.values())

# control rig checks
X = {}
rest_mesh = float(np.abs(P_rest - V0).max())
X['rest_residual'] = dict(ok=rest_mesh <= 5e-4 and dev_a <= 0.1, deg=round(dev_a, 4), bone_m=float(f'{dev_d:.1e}'),
                          mesh_m=float(f'{rest_mesh:.1e}'),
                          worst_bones=[[n, float(f'{d:.1e}'), round(a, 4)] for d, a, n in per_bone[:4]],
                          note='control rig at rest drives the runtime bones to rest within the IK solver tolerance')
bad_drivers = []
for o in (ct, rt):
    if o.animation_data:
        for fc in o.animation_data.drivers:
            if not fc.driver.is_valid:
                bad_drivers.append(fc.data_path)
X['drivers'] = dict(count=len(ct.animation_data.drivers) if ct.animation_data else 0, invalid=bad_drivers)
apply([('rot', 'ctl_L_Hand_IK', (0, 0, 1), 40)])
tw = ct.pose.bones['ctl_L_ForeArm_twist'].rotation_euler[1]
X['forearm_twist_for_hand_40deg_about_vertical'] = round(math.degrees(tw), 2)
apply([('prop', 'ik_arm_L', 0.0), ('rot', 'ctl_L_UpperArm', (0, 0, 1), 30)])
X['upperarm_twist_for_upperarm_yaw_30deg'] = round(math.degrees(ct.pose.bones['ctl_L_UpperArm_twist'].rotation_euler[1]), 2)
apply([('move', 'ctl_L_Hand_IK', (0, -0.15, 0.10))])
hand_err = (rt.pose.bones['L_Finger'].head - (ct.data.bones['ctl_L_Hand_IK'].head_local + Vector((0, -0.15, 0.10)))).length
X['arm_ik_reaches_target_m'] = round(hand_err, 5)
apply([('move', 'ctl_R_Knee_IK', (0, -0.10, 0.0))])
kn_err = (rt.pose.bones['R_Calf'].head - (ct.data.bones['ctl_R_Knee_IK'].head_local + Vector((0, -0.10, 0)))).length
X['leg_knee_aim_gap_m'] = round(kn_err, 4)
val['control'] = X
val['capsule_radius_m'] = RAD

# ------------------------------------------------------------------ R5 static sheets: skeleton, control rig, weights
GROUPS = {
    'trunk': (['pelvis', 'spine_01', 'spine_02', 'chest'], ('left', 'topdown')),
    'head_neck': (['head', 'neck_02', 'neck', 'chest'], ('three_quarter', 'left')),
    'arm_L': (['L_Clavicle', 'L_UpperArm', 'L_UpperArm_twist', 'L_ForeArm', 'L_ForeArm_twist', 'L_Hand', 'L_Finger'], ('left', 'front')),
    'leg_L': (['pelvis', 'L_Thigh', 'L_Calf', 'L_Foot', 'L_Toe'], ('left', 'bottom')),
    'domes': (['dome_01', 'dome_02', 'dome_03', 'chest', 'spine_02', 'pelvis'], ('left', 'back_q')),
    'cloth_L': (['L_shirt_shoulder_01', 'L_shirt_shoulder_02', 'L_shirt_flank_01', 'L_shirt_flank_02', 'L_shirt_back_01',
                 'L_shirt_back_02', 'shirt_front_01', 'shirt_front_02'], ('left', 'back_q')),
}
PAL = [(0.95, 0.25, 0.2), (0.2, 0.6, 1.0), (0.3, 0.85, 0.3), (1.0, 0.75, 0.1), (0.75, 0.35, 0.95), (0.1, 0.85, 0.85),
       (1.0, 0.5, 0.7), (0.6, 0.6, 0.2)]
for k_, v_ in (('three_quarter', (0.75, -0.65, 0.35)), ('back_q', (0.6, 0.8, 0.35)), ('bottom', (0, 0.0001, -1)),
               ('front_q', (-0.45, -1, 0.3))):
    rb.VIEW_DIRS[k_] = v_


def group_cols(names):
    gi = {g.name: g.index for g in ob.vertex_groups}; idx = {gi[n]: k for k, n in enumerate(names) if n in gi}
    grey = Vector((0.30, 0.30, 0.32)); cols = []
    for v in me.vertices:
        c = Vector((0, 0, 0)); t = 0.0
        for g in v.groups:
            if g.group in idx:
                c += Vector(PAL[idx[g.group]]) * g.weight; t += g.weight
        cols.append(tuple(c + grey * max(0.0, 1 - t)))
    return cols


def proxy(rig, colour, name='_qa_proxy', scale=1.0):
    """Octahedral mesh per bone at its current pose (armatures do not render), coloured by colour(bone) or skipped."""
    import bmesh
    old = bpy.data.objects.get(name)
    if old:
        bpy.data.objects.remove(old)
    upd(); bm = bmesh.new(); cols = []; M = rig.matrix_world
    for b in rig.data.bones:
        c = colour(b)
        if c is None:
            continue
        c, sc = c if len(c) == 2 else (c, 1.0)
        pb = rig.pose.bones[b.name]; h = M @ pb.head; t = M @ pb.tail; Mb = M @ pb.matrix
        L_ = (t - h).length
        if L_ < 1e-6:
            continue
        x = Mb.to_3x3() @ Vector((1, 0, 0)); z = Mb.to_3x3() @ Vector((0, 0, 1)); w = min(0.09 * L_ * scale * sc, 0.035 * sc); y = (t - h) / L_
        p1 = h + y * (0.15 * L_)
        ring = [p1 + x.normalized() * w, p1 + z.normalized() * w, p1 - x.normalized() * w, p1 - z.normalized() * w]
        vs = [bm.verts.new(h)] + [bm.verts.new(r) for r in ring] + [bm.verts.new(t)]
        for i in range(4):
            bm.faces.new((vs[0], vs[1 + (i + 1) % 4], vs[1 + i])); bm.faces.new((vs[5], vs[1 + i], vs[1 + (i + 1) % 4]))
        cols += [c] * 6
    me_ = bpy.data.meshes.new(name); bm.to_mesh(me_); bm.free()
    o = bpy.data.objects.new(name, me_); bpy.context.scene.collection.objects.link(o)
    rb.set_point_colors(o, cols)
    return o


def ctl_colour(b):
    n = b.name
    if n.endswith('_IK'):
        return ((1.0, 0.45, 0.05), 2.6)
    if n.endswith('_roll'):
        return ((1.0, 0.85, 0.15), 2.2)
    if n.endswith('_target'):
        return None
    if n.endswith('_pole'):
        return ((0.15, 0.9, 1.0), 4.0)
    if n in ('ctl_root', 'ctl_cog'):
        return ((0.95, 0.3, 0.9), 2.0)
    return ((0.70, 0.70, 0.74), 0.55)


if RENDER and not ONLY:
    reset(); cam = rb.setup_render(1000); lo, hi = rb.frame_box([ob]); sh = bpy.context.scene.display.shading
    px = rb.bone_proxy(rt, posed=False, scale=1.4)
    for v in ('front', 'left', 'back', 'topdown'):
        rb.place_camera(cam, lo, hi, v); rb.only_visible([ob]); sh.color_type = 'SINGLE'; sh.single_color = (0.80, 0.78, 0.74)
        sh.show_xray = True; sh.xray_alpha = 0.30; rb.render_to(os.path.join(RAW, f'skel_{v}.png'))
        rb.only_visible([px]); rb.shading('VERTEX', xray=False); rb.render_to(os.path.join(RAW, f'skel_{v}_bones.png'))
    bpy.data.objects.remove(px)
    pc = proxy(ct, ctl_colour, scale=1.2)
    for v in ('left', 'three_quarter'):
        rb.place_camera(cam, lo, hi, v); rb.only_visible([ob]); sh.color_type = 'TEXTURE'; sh.show_xray = True; sh.xray_alpha = 0.35
        rb.render_to(os.path.join(RAW, f'ctl_{v}.png'))
        rb.only_visible([pc]); rb.shading('VERTEX', xray=False); rb.render_to(os.path.join(RAW, f'ctl_{v}_bones.png'))
    bpy.data.objects.remove(pc)
    rb.set_point_colors(ob, rb.weight_colors(ob), 'wcol')
    for v in ('front', 'left', 'back_q', 'bottom'):
        rb.place_camera(cam, lo, hi, v); rb.only_visible([ob]); rb.shading('VERTEX'); rb.render_to(os.path.join(RAW, f'w_all_{v}.png'))
    for g, (names_, views) in GROUPS.items():
        rb.set_point_colors(ob, group_cols(names_), 'wcol')
        for v in views:
            rb.place_camera(cam, lo, hi, v); rb.only_visible([ob]); rb.shading('VERTEX'); rb.render_to(os.path.join(RAW, f'w_{g}_{v}.png'))
    rb.clear_point_colors(ob, 'wcol')
    json.dump(dict(groups={g: v[0] for g, v in GROUPS.items()}, palette=PAL), open(os.path.join(RAW, 'w_legend.json'), 'w'))
    for o in bpy.context.scene.objects:
        o.hide_render = False

# ------------------------------------------------------------------ R5 poses
CLOSE = {'head_turn': ((0.0, -0.62, 0.84), 0.70, 'three_quarter'), 'head_up': ((0.0, -0.62, 0.84), 0.70, 'left'),
         'head_down': ((0.0, -0.62, 0.84), 0.70, 'three_quarter'), 'palm_lift_L': ((0.25, -0.70, 0.12), 0.45, 'left'),
         'pronate_L': ((0.25, -0.65, 0.20), 0.55, 'front_q'), 'arch_up': ((0.0, -0.15, 0.80), 1.00, 'left'),
         'domes': ((0.0, -0.15, 0.80), 1.00, 'back_q'), 'knee_lift_L': ((0.17, 0.35, 0.25), 0.80, 'left'),
         'reach_L': ((0.2, -0.65, 0.55), 0.95, 'front_q'), 'twist': ((0.0, -0.4, 0.55), 1.2, 'front_q'),
         'crawl_contact': ((0.0, -0.2, 0.45), 1.6, 'front_q')}
reset(); base_in = inside(posed())[1]
res = {}
cam = rb.setup_render(760) if RENDER else None
lo = Vector(V0.min(0)) - Vector((0.1, 0.25, 0)); hi = Vector(V0.max(0)) + Vector((0.1, 0.1, 0.15))
rb.VIEW_DIRS['three_quarter'] = (0.75, -0.65, 0.35); rb.VIEW_DIRS['front_q'] = (-0.45, -1, 0.3)
for name, spec in POSES.items():
    if ONLY and name not in ONLY:
        continue
    apply(spec); P = posed()
    cnt, tot = inside(P)
    res[name] = dict(stretch=stretch(P), seams=seams(P), cloth_in_limbs=int((tot & ~base_in).sum()), per_limb=cnt)
    if RENDER:
        for v in ('left', 'three_quarter'):
            rb.place_camera(cam, lo, hi, v); rb.only_visible([ob]); rb.shading('TEXTURE')
            rb.render_to(os.path.join(RAW, f'pose_{name}_{v}{TAG}.png'))
        if name in CLOSE:
            c_, s_, v_ = CLOSE[name]
            rb.render_closeup(os.path.join(RAW, f'pose_{name}_close{TAG}.png'), [ob], c_, s_, view=v_, color_type='TEXTURE', res=700)
        rb.set_point_colors(ob, rb.stretch_colors(ob, hi=1.6), 'heat')
        rb.place_camera(cam, lo, hi, 'three_quarter'); rb.only_visible([ob]); rb.shading('VERTEX')
        rb.render_to(os.path.join(RAW, f'pose_{name}_heat{TAG}.png'))
        if name in CLOSE:
            c_, s_, v_ = CLOSE[name]
            rb.render_closeup(os.path.join(RAW, f'pose_{name}_closeheat{TAG}.png'), [ob], c_, s_, view=v_, color_type='VERTEX', res=700)
        rb.clear_point_colors(ob, 'heat')
        cam = rb.setup_render(760)
reset()
val['poses'] = res
val['seconds'] = round(time.time() - t0, 1)
out = os.path.join(C.RIG_DIR, 'validation.json') if not ONLY and not TAG else os.path.join(C.WORK, f'validation{TAG or "_partial"}.json')
json.dump(val, open(out, 'w'), indent=1, default=str)
print(json.dumps(dict(A1_pass=val['A1_pass'], A1={k: v['ok'] for k, v in A.items()}, control=X,
                      poses={k: [v['stretch']['worst'], v['stretch']['bad_edges'], v['cloth_in_limbs'], v['seams']['max_mm']] for k, v in res.items()}),
                 indent=1, default=str))
print('QA_DONE', out, val['seconds'], 's')

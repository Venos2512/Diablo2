"""W02 Gibbet-Crow R2-R3: intake, runtime skeleton, control rig, skin -> rig/W02_gibbet_crow_rig.blend

blender -b --factory-startup -P w02_build.py -- <glb> <rig_dir> [presets.json]

G1 (2026-10-26): scale 1.6028 (wingspan 0.89 H), mesh shifted +0.145 m in Y (root between the feet), bone table of
rig_brief.md (joints: rig/_work/r1/joints_proposal.json, pre-shift coordinates), movement C (ground + short flights).

Weights (rig_v1 BRIEF 2b): distance to bone segments + smoothing on the welded mesh, rigid parts on one bone, max 4
influences, sum 1. Bone heat of Blender is not used (fails on Tripo meshes).
  - main piece (body + wings + head + trousers): body bones by inverse distance (p=4) with region masks; wings by a
    harmonic field (body strip |x|<0.07 = 0, outer wing |x|>0.20 = 1) blending chest/spine with the wing chain
    (chain parameter, smooth joints); lower bill = the piece of the bill cut off at the commissure -> beak.
  - legs: chain parameter calf/foot/toe, hallux on foot. Tail pieces: chain parameter pelvis/tail_01/tail_02.
  - ruff feathers: rigid per piece (weights of the main mesh at the feather root). Wing overlay feathers: per vertex,
    weights of the nearest wing-sheet vertices (they lie on the sheet). Eyes: head.
"""
import bpy, bmesh, sys, os, json, math, hashlib
import numpy as np
from mathutils import Vector, Matrix, kdtree

TOOLS = r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools'
sys.path.insert(0, TOOLS)
import rigbatch as rb

argv = sys.argv[sys.argv.index('--') + 1:]
GLB, RIG_DIR = argv[0], argv[1]
PRESETS = json.load(open(argv[2], encoding='utf-8')) if len(argv) > 2 else {}
AID = 'W02_gibbet_crow'
S = 1.6028
SHIFT = Vector((0.0, 0.145, 0.0))
OUT_BLEND = os.path.join(RIG_DIR, f'{AID}_rig.blend')
REPORT = {}


def log(*a):
    print('[w02]', *a, flush=True)


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for c in iter(lambda: f.read(1 << 20), b''):
            h.update(c)
    return h.hexdigest()


def retry(fn, *a, **k):
    """Windows: a file just written can be briefly locked (scanner, 8 parallel threads) -> OSError 22; retry."""
    import time
    for i in range(8):
        try:
            return fn(*a, **k)
        except OSError as e:
            log('retry', i, e); time.sleep(0.5 + i)
    return fn(*a, **k)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3 - 2 * t)


# =============================================================== R2.0 intake
bpy.ops.wm.read_factory_settings(use_empty=True)
rb.prefs()
scn = bpy.context.scene
scn.render.fps = 24; scn.render.fps_base = 1.0
scn.unit_settings.system = 'METRIC'; scn.unit_settings.scale_length = 1.0
bpy.ops.import_scene.gltf(filepath=GLB, merge_vertices=True)
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
assert len(meshes) == 1
ob = meshes[0]
M0 = ob.matrix_world.copy(); ob.parent = None; ob.data.transform(M0); ob.matrix_world.identity()
for o in [o for o in bpy.data.objects if o.type != 'MESH']:
    bpy.data.objects.remove(o)
ob.name = AID; ob.data.name = AID + '_mesh'
me = ob.data
me.transform(Matrix.Translation(SHIFT) @ Matrix.Scale(S, 4)); me.update()
N = len(me.vertices)
CO = np.empty(N * 3); me.vertices.foreach_get('co', CO); CO = CO.reshape(N, 3)
intake = dict(glb=GLB.replace('\\', '/'), sha256=sha256(GLB), scale=S, shift=list(SHIFT), verts=N, faces=len(me.polygons),
              tris=sum(len(p.vertices) - 2 for p in me.polygons), bbox_min=CO.min(0).round(5).tolist(), bbox_max=CO.max(0).round(5).tolist())
ob['w02_intake'] = json.dumps(intake)
REPORT['intake'] = intake
log('intake', intake)

# =============================================================== joints (pre-shift json -> shifted)
JP = json.load(open(os.path.join(RIG_DIR, '_work', 'r1', 'joints_proposal.json'), encoding='utf-8'))
BONES = []
for b in JP['bones']:
    BONES.append(dict(name=b['name'], parent=b['parent'], kind=b['kind'],
                      head=Vector(b['head']) + SHIFT, tail=Vector(b['tail']) + SHIFT))
BD = {b['name']: b for b in BONES}
DEFORM = [b['name'] for b in BONES if b['kind'] not in ('base', 'socket')]
SOCKETS = [b['name'] for b in BONES if b['kind'] == 'socket']


def hinge_axis(side):
    """Leg plane normal (hip, knee, ankle), pointing to +X world for both sides (same axis = same sagittal motion)."""
    hip, knee, ank = BD[f'{side}_Thigh']['head'], BD[f'{side}_Thigh']['tail'], BD[f'{side}_Calf']['tail']
    n = (knee - hip).cross(ank - knee).normalized()
    return n if n.x > 0 else -n


def desired_x(b):
    """Local X axis per bone (G1 / SKELETON_STANDARD W-bird): legs X = hinge, +X = flexion; wings X = wing normal,
    +X = fold (shoulder -> trailing edge, elbow -> leading edge, wrist -> trailing edge); others X = +X world."""
    n = b['name']
    for sd in ('L', 'R'):
        if n in (f'{sd}_Thigh', f'{sd}_Calf', f'{sd}_Foot', f'{sd}_Toe'):
            h = hinge_axis(sd)
            return -h if n.endswith(('Thigh', 'Foot')) else h
        if n in (f'{sd}_Wing_01', f'{sd}_Wing_02', f'{sd}_Wing_03'):
            dorsal = Vector((0, 1, 0))
            sgn = 1 if n.endswith(('_01', '_03')) else -1
            if sd == 'R':
                sgn = -sgn
            return dorsal * sgn
    return Vector((1, 0, 0))


def set_roll(eb, xdes):
    y = (eb.tail - eb.head).normalized()
    x = (xdes - y * xdes.dot(y)).normalized()
    eb.align_roll(x.cross(y))           # align_roll sets the bone Z axis; Z = X x Y


def add_armature(name, coll):
    arm = bpy.data.armatures.new(name)
    o = bpy.data.objects.new(name, arm)
    coll.objects.link(o)
    return o


C_RUN = bpy.data.collections.new('W02_runtime'); scn.collection.children.link(C_RUN)
C_CTL = bpy.data.collections.new('W02_control'); scn.collection.children.link(C_CTL)
C_WGT = bpy.data.collections.new('W02_widgets'); scn.collection.children.link(C_WGT)
for c in ob.users_collection:
    c.objects.unlink(ob)
C_RUN.objects.link(ob)

# =============================================================== R2.1 runtime skeleton
rig = add_armature(AID + '_rig', C_RUN)
rig.data.display_type = 'OCTAHEDRAL'; rig.show_in_front = True
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones
for b in BONES:
    e = eb.new(b['name']); e.head = b['head']; e.tail = b['tail']
for b in BONES:
    e = eb[b['name']]
    if b['parent']:
        e.parent = eb[b['parent']]
        e.use_connect = (eb[b['parent']].tail - e.head).length < 1e-6
    e.use_deform = b['kind'] not in ('base', 'socket')
    set_roll(e, desired_x(b))
bpy.ops.object.mode_set(mode='OBJECT')
cd = rig.data.collections.new('Deform'); cs = rig.data.collections.new('Socket'); cbase = rig.data.collections.new('Base')
for b in BONES:
    (cs if b['kind'] == 'socket' else cbase if b['kind'] == 'base' else cd).assign(rig.data.bones[b['name']])
rig['w02_scale'] = S; rig['w02_shift_y'] = SHIFT.y

# =============================================================== R2.2 control rig
ctl = add_armature(AID + '_ctl', C_CTL)
ctl.data.display_type = 'OCTAHEDRAL'; ctl.show_in_front = True
P = PRESETS
CTLB = []        # (name, head, tail, parent, xdes, collection)


def cb(name, head, tail, parent, xdes=Vector((1, 0, 0)), coll='Body'):
    CTLB.append((name, Vector(head), Vector(tail), parent, xdes, coll))


COLL_OF = {'spine': 'Body', 'base': 'Body', 'neck': 'Neck_Head', 'head': 'Neck_Head', 'tail': 'Tail', 'wing': 'Wings_FK', 'leg': 'Legs'}
for b in BONES:
    if b['kind'] == 'socket':
        continue
    par = ('ctl_' + b['parent']) if b['parent'] else None
    cb('ctl_' + b['name'], b['head'], b['tail'], par, desired_x(b), COLL_OF[b['kind']])
for sd, sx in (('L', 1), ('R', -1)):
    ball, ank, toe = BD[f'{sd}_Toe']['head'], BD[f'{sd}_Foot']['head'], BD[f'{sd}_Toe']['tail']
    g = Vector((ball.x, ball.y, 0.0))
    cb(f'ctl_{sd}_Foot_IK', g, g + Vector((0, -0.10, 0)), 'ctl_root', Vector((1, 0, 0)), 'Legs_IK')
    cb(f'ctl_{sd}_Heel', ball, ank, f'ctl_{sd}_Foot_IK', hinge_axis(sd), 'Legs_IK')
    cb(f'ctl_{sd}_AnkleTgt', ank, ank + Vector((0, 0, 0.03)), f'ctl_{sd}_Heel', Vector((1, 0, 0)), 'MCH')
    knee = BD[f'{sd}_Thigh']['tail']
    pole = Vector((knee.x + sx * 0.01, knee.y - 0.235, knee.z + 0.015))
    cb(f'ctl_{sd}_Knee_pole', pole, pole + Vector((0, 0, 0.03)), f'ctl_{sd}_Foot_IK', Vector((1, 0, 0)), 'Legs_IK')
    w1 = BD[f'{sd}_Wing_01']['head']
    for nm, dz in (('fold', 0.30), ('flight', 0.36)):
        h = Vector((w1.x + sx * 0.13, w1.y, w1.z + dz))
        cb(f'ctl_{sd}_Wing_{nm}', h, h + Vector((0, 0, 0.04)), 'ctl_chest', Vector((1, 0, 0)), 'Wing_Sliders')

bpy.context.view_layer.objects.active = ctl
bpy.ops.object.mode_set(mode='EDIT')
ce = ctl.data.edit_bones
for (n, h, t, par, xd, coll) in CTLB:
    e = ce.new(n); e.head = h; e.tail = t
for (n, h, t, par, xd, coll) in CTLB:
    e = ce[n]
    if par:
        e.parent = ce[par]
        e.use_connect = (ce[par].tail - e.head).length < 1e-6 and not n.endswith(('_Toe',))
    e.use_deform = False
    set_roll(e, xd)
# toes stay planted: the control toe hangs from the foot contact, not from the tarsus
for sd in ('L', 'R'):
    ce[f'ctl_{sd}_Toe'].use_connect = False
    ce[f'ctl_{sd}_Toe'].parent = ce[f'ctl_{sd}_Foot_IK']
bpy.ops.object.mode_set(mode='OBJECT')
for nm in ('Body', 'Neck_Head', 'Tail', 'Wings_FK', 'Wing_Sliders', 'Legs', 'Legs_IK', 'MCH'):
    ctl.data.collections.new(nm)
for (n, h, t, par, xd, coll) in CTLB:
    ctl.data.collections[coll].assign(ctl.data.bones[n])
ctl.data.collections['MCH'].is_visible = False
ctl.data.collections['Legs'].is_visible = False      # IK-driven chain: animators use Legs_IK

# widgets
def widget(name, verts, edges):
    m = bpy.data.meshes.new(name); m.from_pydata(verts, edges, []); m.update()
    o = bpy.data.objects.new(name, m); C_WGT.objects.link(o); o.hide_render = True
    return o


circ = [(math.cos(2 * math.pi * k / 24), 0.0, math.sin(2 * math.pi * k / 24)) for k in range(24)]
W_CIRCLE = widget('WGT_circle', circ, [(k, (k + 1) % 24) for k in range(24)])
W_BOX = widget('WGT_box', [(-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)], [(0, 1), (1, 2), (2, 3), (3, 0)])
W_DIAM = widget('WGT_diamond', [(0, 0, 1), (1, 0, 0), (0, 0, -1), (-1, 0, 0), (0, 1, 0), (0, -1, 0)],
                [(0, 1), (1, 2), (2, 3), (3, 0), (0, 4), (4, 2), (2, 5), (5, 0)])
W_SLIDER = widget('WGT_slider', [(0, 0, 0), (0, 2.5, 0), (-0.4, 0, 0), (0.4, 0, 0)], [(0, 1), (2, 3)])
C_WGT.hide_viewport = False
for o in C_WGT.objects:
    o.hide_viewport = True

# =============================================================== constraints
def pbc(o, bone, typ, **kw):
    c = o.pose.bones[bone].constraints.new(typ)
    for k, v in kw.items():
        setattr(c, k, v)
    return c


for b in BONES:                                   # runtime follows the control rig (same rest)
    if b['kind'] == 'socket':
        continue
    pbc(rig, b['name'], 'COPY_TRANSFORMS', target=ctl, subtarget='ctl_' + b['name'])

def pole_angle(base, ik, pole_loc):
    """Classic rest-preserving pole angle (base = thigh edit/rest bone, ik = calf)."""
    def signed(u, v, n):
        a = u.angle(v)
        return -a if u.cross(v).angle(n) < 1 else a
    pn = (ik.tail_local - base.head_local).cross(pole_loc - base.head_local)
    proj = pn.cross(base.tail_local - base.head_local)
    return signed(base.x_axis, proj, base.tail_local - base.head_local)


bpy.context.view_layer.objects.active = ctl
for sd in ('L', 'R'):
    th, ca = ctl.data.bones[f'ctl_{sd}_Thigh'], ctl.data.bones[f'ctl_{sd}_Calf']
    pl = ctl.data.bones[f'ctl_{sd}_Knee_pole'].head_local
    ik = pbc(ctl, f'ctl_{sd}_Calf', 'IK', target=ctl, subtarget=f'ctl_{sd}_AnkleTgt', pole_target=ctl,
             pole_subtarget=f'ctl_{sd}_Knee_pole', chain_count=2, use_stretch=False)
    def rest_err(a):
        ik.pole_angle = a
        bpy.context.view_layer.update()
        # knee position error (m): quaternion angles lose precision below ~1e-3 rad in float32
        return ((ctl.pose.bones[f'ctl_{sd}_Thigh'].tail - ctl.data.bones[f'ctl_{sd}_Thigh'].tail_local).length +
                (ctl.pose.bones[f'ctl_{sd}_Calf'].tail - ctl.data.bones[f'ctl_{sd}_Calf'].tail_local).length)
    grid = [math.radians(d) for d in range(-180, 180, 3)]
    a0 = min(grid, key=rest_err)
    lo, hi = a0 - math.radians(3), a0 + math.radians(3)       # golden-section refine
    gr = (math.sqrt(5) - 1) / 2
    for _ in range(40):
        c1, c2 = hi - gr * (hi - lo), lo + gr * (hi - lo)
        if rest_err(c1) < rest_err(c2):
            hi = c2
        else:
            lo = c1
    best = (rest_err((lo + hi) / 2), (lo + hi) / 2)
    ik.pole_angle = best[1]
    REPORT.setdefault('ik_rest_err_m', {})[sd] = float(best[0])
    pbc(ctl, f'ctl_{sd}_Foot', 'DAMPED_TRACK', target=ctl, subtarget=f'ctl_{sd}_Heel', head_tail=0.0, track_axis='TRACK_Y')

# wing sliders (Transformation constraints: slider local Y 0..0.1 m -> preset rotation, applied before the FK rotation)
def slider(sd, nm, preset):
    sl = f'ctl_{sd}_Wing_{nm}'
    lim = pbc(ctl, sl, 'LIMIT_LOCATION', use_min_x=True, use_max_x=True, use_min_y=True, use_max_y=True, use_min_z=True,
              use_max_z=True, min_x=0, max_x=0, min_y=0, max_y=0.1, min_z=0, max_z=0, owner_space='LOCAL', use_transform_limit=True)
    pb = ctl.pose.bones[sl]
    pb.lock_location = (True, False, True); pb.lock_rotation = (True, True, True); pb.lock_rotation_w = True
    pb.lock_scale = (True, True, True)
    for i in (1, 2, 3):
        bone = f'ctl_{sd}_Wing_0{i}'
        ang = preset.get(f'Wing_0{i}', [0, 0, 0])
        sgn = [1, 1, 1] if sd == 'L' else [1, -1, -1]          # mirrored pose: X same, Y and Z negated
        c = pbc(ctl, bone, 'TRANSFORM', target=ctl, subtarget=sl, name=f'{nm}_preset')
        c.map_from = 'LOCATION'; c.map_to = 'ROTATION'
        c.from_min_y = 0.0; c.from_max_y = 0.1
        c.map_to_x_from = 'Y'; c.map_to_y_from = 'Y'; c.map_to_z_from = 'Y'
        c.to_min_x_rot = c.to_min_y_rot = c.to_min_z_rot = 0.0
        c.to_max_x_rot = math.radians(ang[0]) * sgn[0]
        c.to_max_y_rot = math.radians(ang[1]) * sgn[1]
        c.to_max_z_rot = math.radians(ang[2]) * sgn[2]
        c.owner_space = 'LOCAL'; c.target_space = 'LOCAL'; c.mix_mode_rot = 'BEFORE'; c.use_motion_extrapolate = False
        c.to_euler_order = 'XYZ'


for sd in ('L', 'R'):
    slider(sd, 'fold', P.get('fold', {}))
    slider(sd, 'flight', P.get('flight', {}))

# feet follow the body (flight): Armature constraint on the foot IK control, influence = ctl_root['feet_follow_body']
proot = ctl.pose.bones['ctl_root']
proot['feet_follow_body'] = 0.0
proot.id_properties_ui('feet_follow_body').update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0,
                                                    description='0 = bàn chân IK đứng trên đất, 1 = theo ctl_cog (thu chân khi bay)')
for sd in ('L', 'R'):
    c = ctl.pose.bones[f'ctl_{sd}_Foot_IK'].constraints.new('ARMATURE'); c.name = 'follow_body'
    t = c.targets.new(); t.target = ctl; t.subtarget = 'ctl_cog'; t.weight = 1.0
    fc = c.driver_add('influence'); d = fc.driver; d.type = 'AVERAGE'
    v = d.variables.new(); v.name = 'f'; v.type = 'SINGLE_PROP'
    v.targets[0].id = ctl; v.targets[0].data_path = 'pose.bones["ctl_root"]["feet_follow_body"]'

# shapes, locks, colours
for pb in ctl.pose.bones:
    n = pb.name; L = pb.bone.length
    pb.rotation_mode = 'XYZ' if not n.startswith(('ctl_root', 'ctl_cog')) else 'XYZ'
    if n in ('ctl_root',):
        pb.custom_shape = W_CIRCLE; pb.custom_shape_scale_xyz = (3.2, 3.2, 3.2)
    elif n == 'ctl_cog':
        pb.custom_shape = W_CIRCLE; pb.custom_shape_scale_xyz = (2.4, 2.4, 2.4)
    elif n.endswith('_Foot_IK'):
        pb.custom_shape = W_BOX; pb.custom_shape_scale_xyz = (0.6, 0.9, 1.0)
    elif n.endswith(('_Knee_pole', '_AnkleTgt')):
        pb.custom_shape = W_DIAM; pb.custom_shape_scale_xyz = (0.4, 0.4, 0.4)
    elif n.endswith(('_Wing_fold', '_Wing_flight')):
        pb.custom_shape = W_SLIDER; pb.custom_shape_scale_xyz = (1.0, 1.0, 1.0)
    elif n.endswith(('_Thigh', '_Calf', '_Foot')) and not n.endswith('_Foot_IK'):
        pass
    else:
        pb.custom_shape = W_CIRCLE; pb.custom_shape_scale_xyz = (0.35, 0.35, 0.35)
    if not n.endswith(('_Foot_IK', '_Knee_pole', 'ctl_root', 'ctl_cog')) and not n.endswith(('_Wing_fold', '_Wing_flight')):
        pb.lock_location = (True, True, True)
    side = 'L' if '_L_' in n or n.startswith('ctl_L_') else 'R' if n.startswith('ctl_R_') else 'C'
    pb.bone.color.palette = {'L': 'THEME01', 'R': 'THEME04', 'C': 'THEME09'}[side]
ctl.pose.bones['ctl_cog'].lock_location = (False, False, False)

# =============================================================== R3 weights
log('weights')
# --- weld (co-located duplicates share weights)
kd = kdtree.KDTree(N)
for i in range(N):
    kd.insert(CO[i], i)
kd.balance()
rep = -np.ones(N, int); uid = []
for i in range(N):
    if rep[i] >= 0:
        continue
    k = len(uid); uid.append(i)
    for (_, j, _) in kd.find_range(CO[i], 2e-5):
        if rep[j] < 0:
            rep[j] = k
NU = len(uid); U = CO[uid]
E = np.empty(len(me.edges) * 2, int); me.edges.foreach_get('vertices', E); E = rep[E.reshape(-1, 2)]
E = E[E[:, 0] != E[:, 1]]; E = np.unique(np.sort(E, 1), axis=0)
# islands (union-find)
par = np.arange(NU)
def find(a):
    while par[a] != a:
        par[a] = par[par[a]]; a = par[a]
    return a
for a, b in E:
    ra, rb_ = find(a), find(b)
    if ra != rb_:
        par[ra] = rb_
lab = np.array([find(i) for i in range(NU)])
ids, cnt = np.unique(lab, return_counts=True)
MAIN = ids[cnt.argmax()]
REPORT['weld'] = dict(welded_verts=int(NU), islands=int(len(ids)), main_verts=int(cnt.max()))
log('weld', REPORT['weld'])

BN = DEFORM; BI = {n: i for i, n in enumerate(BN)}; NB = len(BN)
J = {n: (np.array(BD[n]['head']), np.array(BD[n]['tail'])) for n in BD}
sh = np.array(SHIFT)


def pre(p):           # world (shifted) -> pre-shift frame used in the brief
    return p - sh


def seg(Pts, n):
    a, b = J[n]; ab = b - a
    t = np.clip(((Pts - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(Pts - (a + t[:, None] * ab), axis=1), t


def chain_weights(Pts, names, half):
    """Partition of unity along a bone chain from the nearest-segment arclength; half[j] = blend half-width at joint j."""
    L = [np.linalg.norm(J[n][1] - J[n][0]) for n in names]
    S = np.concatenate([[0], np.cumsum(L)])
    D = np.stack([seg(Pts, n)[0] for n in names], 1); T = np.stack([seg(Pts, n)[1] for n in names], 1)
    k = D.argmin(1)
    s = S[k] + T[np.arange(len(Pts)), k] * np.array(L)[k]
    u = [np.ones(len(Pts))] + [smoothstep(S[j] - half[j - 1], S[j] + half[j - 1], s) for j in range(1, len(names))] + [np.zeros(len(Pts))]
    W = np.zeros((len(Pts), NB))
    for i, n in enumerate(names):
        W[:, BI[n]] += u[i] * (1 - u[i + 1])
    return W


def inv_dist(Pts, cands, mask=None, p=4.0, eps=0.004):
    W = np.zeros((len(Pts), NB))
    for n in cands:
        d, _ = seg(Pts, n)
        w = 1.0 / (d + eps) ** p
        if mask is not None and n in mask:
            w = w * mask[n]
        W[:, BI[n]] = w
    return W / np.maximum(W.sum(1, keepdims=True), 1e-12)


def lap_matrix(idx, edges):
    """Edge-length weighted graph Laplacian restricted to the vertex set idx (dense; main piece only ~2.8k verts)."""
    loc = -np.ones(NU, int); loc[idx] = np.arange(len(idx))
    e = edges[(loc[edges[:, 0]] >= 0) & (loc[edges[:, 1]] >= 0)]
    a, b = loc[e[:, 0]], loc[e[:, 1]]
    w = 1.0 / np.maximum(np.linalg.norm(U[e[:, 0]] - U[e[:, 1]], axis=1), 1e-5)
    Lm = np.zeros((len(idx), len(idx)))
    np.add.at(Lm, (a, b), -w); np.add.at(Lm, (b, a), -w)
    np.add.at(Lm, (a, a), w); np.add.at(Lm, (b, b), w)
    return Lm, a, b, w


def harmonic(idx, fixed, vals):
    Lm, *_ = lap_matrix(idx, E)
    free = ~fixed
    f = np.zeros(len(idx)); f[fixed] = vals[fixed]
    rhs = -Lm[np.ix_(free, fixed)] @ f[fixed]
    f[free] = np.linalg.solve(Lm[np.ix_(free, free)] + 1e-9 * np.eye(free.sum()), rhs)
    return f


Wt = np.zeros((NU, NB))
main_idx = np.where(lab == MAIN)[0]
Pm = U[main_idx]; Q = pre(Pm)                     # pre-shift coordinates for region rules
ax = np.abs(Q[:, 0])

# --- lower bill: bill region cut at the commissure, components below the mouth line -> beak
bill_zone = (Q[:, 1] < -0.335) & (ax < 0.05) & (Q[:, 2] > 0.40) & (Q[:, 2] < 0.53)
cut = bill_zone & (Q[:, 1] < -0.352)
loc = -np.ones(NU, int); loc[main_idx[cut]] = np.arange(cut.sum())
ce_ = E[(loc[E[:, 0]] >= 0) & (loc[E[:, 1]] >= 0)]
par2 = np.arange(cut.sum())
def f2(a):
    while par2[a] != a:
        par2[a] = par2[par2[a]]; a = par2[a]
    return a
for a, b in ce_:
    ra, rb2 = f2(loc[a]), f2(loc[b])
    if ra != rb2:
        par2[ra] = rb2
lb = np.array([f2(i) for i in range(cut.sum())])
comps = {}
Qc = Q[cut]
for i, r in enumerate(lb):
    comps.setdefault(r, []).append(i)
comp_rows = sorted(([len(v), float(Qc[v, 2].mean()), float(Qc[v, 1].min()), r] for r, v in comps.items()), key=lambda r: -r[0])
REPORT['bill_components'] = [[c[0], round(c[1], 4), round(c[2], 4)] for c in comp_rows[:6]]
log('bill components (n, mean z, min y):', REPORT['bill_components'])
# lower jaw = components whose mean height is below the mouth line z = 0.468 - 0.35*(y + 0.345)... use mean z < line at mean y
beak_local = np.zeros(cut.sum(), bool)
top_comp = lb[Qc[:, 2].argmax()]                 # the piece holding the culmen = upper bill (+ palate)
REPORT['bill_components_z'] = [[len(v), round(float(Qc[v, 2].min()), 4), round(float(Qc[v, 2].max()), 4),
                                round(float(Qc[v, 1].min()), 4), round(float(Qc[v, 1].max()), 4), bool(r == top_comp)]
                               for r, v in sorted(comps.items(), key=lambda kv: -len(kv[1]))[:6]]
for n_, mz, my, r in comp_rows:
    if r != top_comp and n_ >= 8:
        beak_local[np.array(comps[r])] = True
is_beak = np.zeros(len(main_idx), bool); is_beak[np.where(cut)[0][beak_local]] = True
# if the jaw is not a separate piece below the commissure, fall back to the plane rule
if is_beak.sum() < 10:
    yy = Q[:, 1]; zline = 0.466 + (yy + 0.345) * (0.026 / 0.08)
    is_beak = bill_zone & (Q[:, 2] < zline) & (Q[:, 1] > -0.427) & (Q[:, 1] < -0.35)
    REPORT['beak_rule'] = 'plane'
else:
    REPORT['beak_rule'] = 'component'
REPORT['beak_verts'] = int(is_beak.sum())

# --- body weights: centre chain by chain parameter, trousers by inverse distance inside the trousers volume, rump -> tail
Wc = chain_weights(Pm, ['pelvis', 'spine_01', 'chest'], half=[0.05, 0.05])
# neck: harmonic coordinate h around the whole neck tube (breast / back = 0, skull + bill = 1), then chest -> neck_01..03 -> head by h
headfix = ((Q[:, 1] < -0.305) & (Q[:, 2] > 0.43)) | ((Q[:, 1] < -0.335) & (Q[:, 2] > 0.40))
chestfix = (Q[:, 1] > -0.17) | (Q[:, 2] < 0.36) | (ax > 0.12)
hN = np.clip(harmonic(main_idx, headfix | chestfix, headfix.astype(float)), 0, 1)
SN = P.get('neck_h', [0.15, 0.38, 0.60, 0.82]); hw = P.get('neck_half', 0.09)
NECK = ['chest', 'neck_01', 'neck_02', 'neck_03', 'head']
uN = [np.ones(len(hN))] + [smoothstep(x - hw, x + hw, hN) for x in SN] + [np.zeros(len(hN))]
Wn = np.zeros_like(Wc)
for i, n in enumerate(NECK):
    Wn[:, BI[n]] += uN[i] * (1 - uN[i + 1])
neck_region = ~chestfix
Wc[neck_region] = Wn[neck_region]
REPORT['neck_field'] = dict(head_fixed=int(headfix.sum()), chest_fixed=int(chestfix.sum()), free=int((~(headfix | chestfix)).sum()))
t_a, t_b = J['tail_01']; t_len = np.linalg.norm(t_b - t_a)
s01 = ((Pm - t_a) @ (t_b - t_a)) / t_len
t_dir = (t_b - t_a) / t_len
r_ax = np.linalg.norm((Pm - t_a) - np.outer(np.clip(s01, 0, None), t_dir), axis=1)     # distance from the tail axis
u_tail = (smoothstep(-0.03, 0.04, s01) * smoothstep(0.13, 0.07, r_ax))[:, None]
Wtail = chain_weights(Pm, ['tail_01', 'tail_02'], half=[0.05])
Wc = (1 - u_tail) * Wc + u_tail * Wtail
# trousers volume (pre-shift): below the hip, between the breast and the vent, off the midline
y_back = P.get('leg_back_mid', -0.02) + P.get('leg_back_side', 0.06) * smoothstep(0.04, 0.09, ax)          # trousers reach further back at the sides than at the vent
leg_w = (smoothstep(0.345, 0.30, Q[:, 2]) * smoothstep(0.015, 0.045, ax) *
         smoothstep(-0.275, -0.235, Q[:, 1]) * smoothstep(y_back + P.get('leg_back_out', 0.03), y_back - P.get('leg_back_in', 0.02), Q[:, 1]))
WL = inv_dist(Pm, ['L_Thigh', 'L_Calf']); WR = inv_dist(Pm, ['R_Thigh', 'R_Calf'])
Wleg = np.where((Q[:, 0] > 0)[:, None], WL, WR)
Wb_full = (1 - leg_w[:, None]) * Wc + leg_w[:, None] * Wleg
Wb_root = inv_dist(Pm, ['spine_01', 'chest', 'neck_01'])
REPORT['leg_zone_verts'] = int((leg_w > 0.5).sum())

# --- wing field and wing chains
fixed = (ax < 0.07) | (ax > 0.20)
fw = harmonic(main_idx, fixed, (ax > 0.20).astype(float))
fw = np.clip(fw, 0, 1)
fws = smoothstep(0.08, 0.92, fw)
REPORT['wing_field'] = dict(fixed_body=int((ax < 0.07).sum()), fixed_wing=int((ax > 0.20).sum()))
Ww = np.zeros((len(main_idx), NB))
for sd, msk in (('L', Q[:, 0] > 0), ('R', Q[:, 0] <= 0)):
    names = [f'{sd}_Wing_01', f'{sd}_Wing_02', f'{sd}_Wing_03']
    cw = chain_weights(Pm, names, half=[P.get('w_elbow', 0.045), P.get('w_wrist', 0.045)])
    Ww[msk] = cw[msk]
g = smoothstep(0.0, 0.12, fw)[:, None]
Wbody = (1 - g) * Wb_full + g * Wb_root
Wm = (1 - fws[:, None]) * Wbody + fws[:, None] * Ww
# head / beak: hard regions
Wm[is_beak] = 0.0; Wm[is_beak, BI['beak']] = 1.0

# --- smoothing on the main piece (keeps hard beak cut through connectivity only at the commissure)
Lm, la, lbb, lw = lap_matrix(main_idx, E)
deg = np.zeros(len(main_idx)); np.add.at(deg, la, lw); np.add.at(deg, lbb, lw)
for it in range(int(P.get('smooth_iters', 6))):
    acc = np.zeros_like(Wm)
    np.add.at(acc, la, Wm[lbb] * lw[:, None]); np.add.at(acc, lbb, Wm[la] * lw[:, None])
    Wn = acc / np.maximum(deg, 1e-9)[:, None]
    Wm = 0.5 * Wm + 0.5 * Wn
    Wm[is_beak] = 0.0; Wm[is_beak, BI['beak']] = 1.0
Wt[main_idx] = Wm

# --- other islands
main_kd = kdtree.KDTree(len(main_idx))
for i, p in enumerate(Pm):
    main_kd.insert(p, i)
main_kd.balance()
legs, ruff, wingf, tail, eyes, other = [], [], [], [], [], []
for k in ids:
    if k == MAIN:
        continue
    v = np.where(lab == k)[0]; Pk = pre(U[v]); c = Pk.mean(0)
    if Pk[:, 2].min() < 0.01:
        legs.append(v)
    elif abs(c[0]) > 0.2:
        wingf.append(v)
    elif c[1] > 0.03 and c[2] < 0.45:
        tail.append(v)
    elif c[1] < -0.30 and c[2] > 0.45 and len(v) < 40:
        eyes.append(v)
    elif c[2] > 0.40 and c[1] < -0.05:
        ruff.append(v)
    else:
        other.append(v)
REPORT['pieces'] = dict(legs=len(legs), ruff=len(ruff), wing_feathers=len(wingf), tail=len(tail), eyes=len(eyes), other=len(other))
log('pieces', REPORT['pieces'])

for v in legs:
    sd = 'L' if U[v, 0].mean() > 0 else 'R'
    Pl = U[v]
    W = chain_weights(Pl, [f'{sd}_Calf', f'{sd}_Foot', f'{sd}_Toe'], half=[0.02, 0.012])
    ball = J[f'{sd}_Toe'][0]
    hallux = (Pl[:, 1] > ball[1] + 0.012) & (Pl[:, 2] < 0.06)
    W[hallux] = 0.0; W[hallux, BI[f'{sd}_Foot']] = 1.0
    Wt[v] = W
t_a, t_b = J['tail_01']; t_len = np.linalg.norm(t_b - t_a)
for v in tail:                               # tail_01 -> tail_02 chain, pelvis fading in before the tail_01 head
    Wc = chain_weights(U[v], ['tail_01', 'tail_02'], half=[0.05])
    s01 = ((U[v] - t_a) @ (t_b - t_a)) / t_len
    u = smoothstep(-0.03, 0.04, s01)[:, None]
    Wpel = np.zeros_like(Wc); Wpel[:, BI['pelvis']] = 1.0
    Wt[v] = u * Wc + (1 - u) * Wpel
for v in eyes:
    Wt[v] = 0.0; Wt[v, BI['head']] = 1.0
for v in ruff + other:                       # rigid: weights of the main mesh at the feather root
    Pk = U[v]
    d = np.array([main_kd.find(p)[2] for p in Pk]); r = v[d.argmin()]
    near = main_kd.find_n(U[r], 4)
    wsum = sum(Wm[j] / (dd + 1e-4) for (_, j, dd) in near); Wt[v] = wsum / wsum.sum()
for v in wingf:                              # glued to the wing sheet under each vertex
    for i in v:
        near = main_kd.find_n(U[i], 3)
        wsum = sum(Wm[j] / (dd + 1e-4) for (_, j, dd) in near); Wt[i] = wsum / wsum.sum()

# --- prune to 4, threshold, normalise
order = np.argsort(-Wt, 1)
Wp = np.zeros_like(Wt)
for r in range(NU):
    top = order[r, :4]
    w = Wt[r, top]; w = np.where(w < 0.01, 0, w)
    if w.sum() <= 0:
        w = np.zeros(4); w[0] = 1.0
    Wp[r, top] = w / w.sum()

# --- write vertex groups on the original mesh
for n in BN:
    ob.vertex_groups.new(name=n)
VG = [ob.vertex_groups[n] for n in BN]
for i in range(N):
    r = rep[i]; nz = np.nonzero(Wp[r])[0]
    for j in nz:
        VG[j].add([i], float(Wp[r, j]), 'REPLACE')
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rig; mod.use_vertex_groups = True
ob.parent = rig

# health
mx = 0; bad_sum = 0; empty = 0
for v in me.vertices:
    ws = [g.weight for g in v.groups if g.weight > 0]
    mx = max(mx, len(ws)); empty += (len(ws) == 0); bad_sum += abs(sum(ws) - 1) > 1e-5
REPORT['health'] = dict(max_influences=mx, not_normalised=int(bad_sum), empty=int(empty))
log('health', REPORT['health'])
retry(np.save, os.path.join(RIG_DIR, '_work', 'w02_weights_welded.npy'), Wp)
retry(np.save, os.path.join(RIG_DIR, '_work', 'w02_wingfield.npy'), np.stack([main_idx, fw]))

# =============================================================== roll / function self-test
def test_flexion():
    out = {}
    bpy.context.view_layer.objects.active = rig
    pbs = rig.pose.bones
    def jpos(n):
        return (rig.matrix_world @ pbs[n].head).copy(), (rig.matrix_world @ pbs[n].tail).copy()
    for c in rig.pose.bones:
        for con in c.constraints:
            con.mute = True
    for n in [b for b in DEFORM if b.startswith(('L_', 'R_'))] + ['neck_01', 'head', 'beak', 'tail_01', 'pelvis']:
        h0, t0 = jpos(n)
        pbs[n].rotation_mode = 'XYZ'; pbs[n].rotation_euler = (math.radians(15), 0, 0)
        bpy.context.view_layer.update()
        h1, t1 = jpos(n)
        pbs[n].rotation_euler = (0, 0, 0); bpy.context.view_layer.update()
        dv = (t1 - t0)
        out[n] = [round(dv.x, 4), round(dv.y, 4), round(dv.z, 4)]
    for c in rig.pose.bones:
        for con in c.constraints:
            con.mute = False
    bpy.context.view_layer.update()
    return out


REPORT['plus_x_15deg_tail_move'] = test_flexion()
bpy.context.view_layer.update()
# rest check: runtime at rest equals its own rest after constraints (control rig rest-preserving)
dev = 0.0
for b in BONES:
    pb = rig.pose.bones[b['name']]
    dev = max(dev, (pb.matrix.to_translation() - rig.data.bones[b['name']].matrix_local.to_translation()).length,
              pb.matrix.to_quaternion().rotation_difference(rig.data.bones[b['name']].matrix_local.to_quaternion()).angle)
REPORT['rest_deviation_runtime'] = round(dev, 7)
log('rest deviation', dev, 'ik rest err', REPORT.get('ik_rest_err_m'))

# =============================================================== save
bpy.context.view_layer.objects.active = ctl
for o in (rig, ctl, ob):
    o.select_set(False)
retry(rb.save, OUT_BLEND)
def _dump():
    with open(os.path.join(RIG_DIR, '_work', 'w02_build_report.json'), 'w', encoding='utf-8') as f:
        json.dump(REPORT, f, indent=1)
retry(_dump)
print('BUILD_OK', OUT_BLEND)

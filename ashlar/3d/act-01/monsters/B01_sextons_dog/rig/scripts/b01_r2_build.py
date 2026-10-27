"""B01 R2 + R3: build rig/B01_sextons_dog_rig.blend from the GLB (read only).

blender -b --factory-startup -P b01_r2_build.py

- Mesh 'B01_sextons_dog' at the G1 scale (x2,1611, 2,16 m long), images packed (bytes as in the GLB).
- 'B01_runtime': the 41 runtime bones of b01_skel (34 deform + root, cog + 5 sockets). Roll: local X = +X world (Qh rule).
- 'B01_control': ctl_* rig, never exported. FK copy of every runtime bone (root -> ctl_root, cog -> ctl_body); 4-leg IK
  (2-bone chains UpperArm-ForeArm / Thigh-Calf) with poles, paw contact controls on the floor, roll at the ball joint, toe
  controls; IK/FK switches ik_arm_L/R (front), ik_leg_L/R (hind) on the control object; collar follows 50 % neck_02.
- Runtime bones follow the control by Copy Transforms (world -> world); R8 bakes control motion onto the runtime skeleton.
- Skin (b01_skin.compute) -> vertex groups, Armature modifier to B01_runtime.
Writes rig/_work/build.json (pole angles, IK rest error, skin stats).
"""
import bpy, sys, os, math, json, time
from mathutils import Vector, Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_common as C
import b01_skel as S
import b01_skin as SK

t0 = time.time()
ob, info = C.intake()
for im in bpy.data.images:
    if not im.packed_file:
        im.pack()
scn = bpy.context.scene
scn.render.fps = 24; scn.frame_start = 1; scn.frame_end = 24
scn.unit_settings.system = 'METRIC'; scn.unit_settings.scale_length = 1.0
J = S.J


def x_rule_roll(eb):
    """Local X = +X world projected on the bone (Qh rule); fallback for bones along X."""
    yv = (eb.tail - eb.head).normalized()
    xv = Vector((1, 0, 0)) - Vector((1, 0, 0)).dot(yv) * yv
    if xv.length < 1e-4:
        xv = Vector((0, -1, 0)) - Vector((0, -1, 0)).dot(yv) * yv
    xv.normalize()
    eb.align_roll(xv.cross(yv))


def new_armature(name):
    arm = bpy.data.armatures.new(name + '_data'); o = bpy.data.objects.new(name, arm)
    scn.collection.objects.link(o)
    return o


def build(o, spec):
    """spec: list of (name, parent, head, tail, deform, connect)."""
    bpy.context.view_layer.objects.active = o
    for x in bpy.context.view_layer.objects:
        x.select_set(x == o)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = o.data.edit_bones
    for n, par, h, t, dfm, conn in spec:
        b = eb.new(n); b.head = Vector(h); b.tail = Vector(t); x_rule_roll(b); b.use_deform = dfm
    for n, par, h, t, dfm, conn in spec:
        if par:
            eb[n].parent = eb[par]; eb[n].use_connect = conn
    bpy.ops.object.mode_set(mode='OBJECT')


# ---------------------------------------------------------------- runtime skeleton
RUN = [(n, p, h, t, d, c) for n, p, h, t, _r, d, c in S.bones()]
rt = new_armature('B01_runtime')
build(rt, RUN)

# ---------------------------------------------------------------- control rig
CMAP = {'root': 'ctl_root', 'cog': 'ctl_body'}
ctl = lambda n: CMAP.get(n, 'ctl_' + n)
CTL = []
for n, p, h, t, d, c in RUN:
    if n in S.SOCKETS:
        continue
    CTL.append((ctl(n), ctl(p) if p else None, h, t, False, c))
CTL.append(('ctl_collar_mch', 'ctl_neck_02', J['collar'], J['collar_end'], False, False))
up = lambda p, dz: (p[0], p[1], p[2] + dz)
floor = lambda p: (p[0], p[1], 0.0)
POLE_OFF = 0.45
for s, f in (('L', lambda p: p), ('R', S.mirror)):
    carpus, ball, toe = f(J['L_Hand']), f(J['L_Finger']), f(J['L_Finger_end'])
    elbow = f(J['L_ForeArm'])
    hock, hball, htoe = f(J['L_Foot']), f(J['L_Toe']), f(J['L_Toe_end'])
    knee = f(J['L_Calf'])
    CTL += [
        (f'ctl_{s}_Hand_IK', 'ctl_root', floor(ball), up(floor(ball), 0.12), False, False),
        (f'ctl_{s}_Hand_roll', f'ctl_{s}_Hand_IK', ball, up(ball, 0.08), False, False),
        (f'ctl_{s}_Hand_mch', f'ctl_{s}_Hand_roll', carpus, ball, False, False),
        (f'ctl_{s}_Finger_IK', f'ctl_{s}_Hand_IK', ball, toe, False, False),
        (f'ctl_{s}_Elbow_pole', 'ctl_root', (elbow[0], elbow[1] + POLE_OFF, elbow[2]), (elbow[0], elbow[1] + POLE_OFF, elbow[2] + 0.08), False, False),
        (f'ctl_{s}_Foot_IK', 'ctl_root', floor(hball), up(floor(hball), 0.12), False, False),
        (f'ctl_{s}_Foot_roll', f'ctl_{s}_Foot_IK', hball, up(hball, 0.08), False, False),
        (f'ctl_{s}_Foot_mch', f'ctl_{s}_Foot_roll', hock, hball, False, False),
        (f'ctl_{s}_Toe_IK', f'ctl_{s}_Foot_IK', hball, htoe, False, False),
        (f'ctl_{s}_Knee_pole', 'ctl_root', (knee[0], knee[1] - POLE_OFF, knee[2]), (knee[0], knee[1] - POLE_OFF, knee[2] + 0.08), False, False),
    ]
cr = new_armature('B01_control')
build(cr, CTL)

# ---------------------------------------------------------------- properties, constraints, drivers
for prop in ('ik_arm_L', 'ik_arm_R', 'ik_leg_L', 'ik_leg_R'):
    cr[prop] = 1.0
    cr.id_properties_ui(prop).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0,
                                     description='1 = IK (paw control), 0 = FK')


def drive(con, prop):
    fc = con.driver_add('influence'); dr = fc.driver; dr.type = 'AVERAGE'
    v = dr.variables.new(); v.name = 'ik'; v.type = 'SINGLE_PROP'
    v.targets[0].id_type = 'OBJECT'; v.targets[0].id = cr; v.targets[0].data_path = f'["{prop}"]'


bpy.context.view_layer.objects.active = cr
bpy.ops.object.mode_set(mode='POSE')
pb = cr.pose.bones
IK = {}
for s in ('L', 'R'):
    for chain_end, target, pole, rot_bone, rot_src, toe_bone, toe_src, prop in (
            (f'ctl_{s}_ForeArm', f'ctl_{s}_Hand_mch', f'ctl_{s}_Elbow_pole', f'ctl_{s}_Hand', f'ctl_{s}_Hand_mch',
             f'ctl_{s}_Finger', f'ctl_{s}_Finger_IK', f'ik_arm_{s}'),
            (f'ctl_{s}_Calf', f'ctl_{s}_Foot_mch', f'ctl_{s}_Knee_pole', f'ctl_{s}_Foot', f'ctl_{s}_Foot_mch',
             f'ctl_{s}_Toe', f'ctl_{s}_Toe_IK', f'ik_leg_{s}')):
        ik = pb[chain_end].constraints.new('IK'); ik.name = 'IK'
        ik.target = cr; ik.subtarget = target; ik.pole_target = cr; ik.pole_subtarget = pole
        ik.chain_count = 2; ik.use_stretch = False; ik.use_tail = True; ik.iterations = 500
        drive(ik, prop); IK[chain_end] = ik
        for b, src in ((rot_bone, rot_src), (toe_bone, toe_src)):
            c = pb[b].constraints.new('COPY_ROTATION'); c.name = 'IK paw'
            c.target = cr; c.subtarget = src; c.owner_space = c.target_space = 'WORLD'
            drive(c, prop)
c = pb['ctl_collar'].constraints.new('COPY_TRANSFORMS'); c.name = 'follow neck_02 50%'
c.target = cr; c.subtarget = 'ctl_collar_mch'; c.owner_space = c.target_space = 'WORLD'; c.influence = 0.5
for b in pb:
    b.ik_stretch = 0.0
bpy.ops.object.mode_set(mode='OBJECT')

# runtime <- control
bpy.context.view_layer.objects.active = rt
bpy.ops.object.mode_set(mode='POSE')
for n, p, h, t, d, c_ in RUN:
    if n in S.SOCKETS:
        continue
    con = rt.pose.bones[n].constraints.new('COPY_TRANSFORMS'); con.name = 'from control'
    con.target = cr; con.subtarget = ctl(n); con.owner_space = con.target_space = 'WORLD'
bpy.ops.object.mode_set(mode='OBJECT')
bpy.context.view_layer.update()


# ---------------------------------------------------------------- pole angle sweep (IK on at rest must not move the chain)
def chain_err(end):
    b = cr.pose.bones[end]; par = b.parent
    e = (b.head - b.bone.head_local).length + (b.tail - b.bone.tail_local).length
    return e + (par.head - par.bone.head_local).length


poles = {}
for end, ik in IK.items():
    best = (1e9, 0.0)
    for a in range(-180, 180, 2):
        ik.pole_angle = math.radians(a); bpy.context.view_layer.update()
        e = chain_err(end); best = min(best, (e, float(a)))
    a0 = best[1]
    for k in range(-40, 41):
        a = a0 + k * 0.05
        ik.pole_angle = math.radians(a); bpy.context.view_layer.update()
        e = chain_err(end); best = min(best, (e, a))
    lo_, hi_ = best[1] - 0.05, best[1] + 0.05          # golden-section refinement to ~1e-5 degree
    g = (math.sqrt(5) - 1) / 2
    for _ in range(40):
        a1 = hi_ - g * (hi_ - lo_); a2 = lo_ + g * (hi_ - lo_)
        ik.pole_angle = math.radians(a1); bpy.context.view_layer.update(); e1 = chain_err(end)
        ik.pole_angle = math.radians(a2); bpy.context.view_layer.update(); e2 = chain_err(end)
        if e1 < e2:
            hi_ = a2
        else:
            lo_ = a1
    a = (lo_ + hi_) / 2
    ik.pole_angle = math.radians(a); bpy.context.view_layer.update()
    poles[end] = dict(angle_deg=round(a, 5), rest_err_m=chain_err(end))
bpy.context.view_layer.update()
ikcheck = {}
for end, ik in IK.items():
    tgt = cr.pose.bones[ik.subtarget]
    ikcheck[end] = dict(tip_to_target_m=(cr.pose.bones[end].tail - tgt.head).length)
rest_err = max((rt.pose.bones[b.name].matrix.to_translation() - b.head_local).length for b in rt.data.bones)
print('[b01] poles', poles, 'ik', ikcheck, 'runtime rest err', rest_err)

# ---------------------------------------------------------------- skin
groups, stats, dbg = SK.compute(ob, rt, J, log=print)
# float32-exact normalisation: Blender stores weights as float32; the largest weight takes up the rounding remainder
import numpy as np
rows = {}
for b, vw in groups.items():
    for i, w in vw.items():
        rows.setdefault(i, []).append([b, w])
for i, r in rows.items():
    r.sort(key=lambda q: -q[1])
    rest_ = [float(np.float32(q[1])) for q in r[1:]]
    r[0][1] = float(np.float32(1.0 - sum(rest_)))
    for q, w in zip(r[1:], rest_):
        q[1] = w
vgs = {b: ob.vertex_groups.new(name=b) for b in groups}
for i, r in rows.items():
    for b, w in r:
        vgs[b].add([i], w, 'REPLACE')
ob.parent = rt; ob.matrix_parent_inverse = Matrix.Identity(4)
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rt; mod.use_vertex_groups = True; mod.use_deform_preserve_volume = False

# ---------------------------------------------------------------- organisation: collections, colours, display
def colls(o, spec):
    arm = o.data
    for name, members, visible, theme in spec:
        bc = arm.collections.new(name); bc.is_visible = visible
        for m in members:
            if m in arm.bones:
                bc.assign(arm.bones[m])
                if theme:
                    arm.bones[m].color.palette = theme


cn = [b.name for b in cr.data.bones]
side = lambda s, names: [n for n in names if n.startswith(f'ctl_{s}_')]
torso = ['ctl_root', 'ctl_body', 'ctl_pelvis', 'ctl_spine_01', 'ctl_spine_02', 'ctl_chest']
head = ['ctl_neck_01', 'ctl_neck_02', 'ctl_head', 'ctl_jaw', 'ctl_L_ear', 'ctl_R_ear']
tail = [f'ctl_tail_0{i}' for i in range(1, 5)]
iks = [n for n in cn if n.endswith(('_IK', '_roll', '_pole'))]
mch = [n for n in cn if n.endswith('_mch')] + ['ctl_collar']
fk_legs = [n for n in cn if n.startswith(('ctl_L_', 'ctl_R_')) and n not in iks and n not in mch and not n.endswith('_ear')]
colls(cr, [('Torso', torso, True, 'THEME09'), ('Head', head, True, 'THEME09'), ('Tail', tail, True, 'THEME09'),
           ('Legs IK L', [n for n in iks if '_L_' in n], True, 'THEME04'),
           ('Legs IK R', [n for n in iks if '_R_' in n], True, 'THEME01'),
           ('Legs FK', fk_legs, True, None), ('Collar', ['ctl_collar_ring'], True, 'THEME06'), ('MCH', mch, False, None)])
for n in fk_legs:
    cr.data.bones[n].color.palette = 'THEME04' if '_L_' in n else 'THEME01'
colls(rt, [('Deform', [b.name for b in rt.data.bones if b.use_deform], True, None),
           ('Sockets', list(S.SOCKETS) + list(S.STRUCTURAL), True, 'THEME06')])
cr.data.display_type = 'OCTAHEDRAL'; cr.show_in_front = True
rt.data.display_type = 'STICK'; rt.hide_set(True)
for o in (cr, rt):
    o.data.pose_position = 'POSE'
bpy.ops.object.select_all(action='DESELECT')
cr.select_set(True); bpy.context.view_layer.objects.active = cr
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == 'VIEW_3D':
            for sp in area.spaces:
                if sp.type == 'VIEW_3D':
                    sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
ob['b01_skin_stats'] = json.dumps(stats)
cr['b01_rig'] = json.dumps(dict(poles=poles, version='r1', date='2026-10-26'))

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=C.BLEND, compress=True)
C.jdump(os.path.join(C.WORK, 'build.json'), dict(info=info, poles=poles, ik=ikcheck, runtime_rest_err_m=rest_err,
                                                 skin=stats, n_runtime=len(rt.data.bones), n_control=len(cr.data.bones),
                                                 seconds=round(time.time() - t0, 1)))
import numpy as np
try:
    np.savez(os.path.join(C.WORK, 'skin_dbg.npz'), **{k: (np.array(v) if not isinstance(v, np.ndarray) else v) for k, v in dbg.items()})
except OSError as e:
    print("[b01] debug dump skipped", e)
print('B01_BUILD_DONE', round(time.time() - t0, 1), 's', len(rt.data.bones), 'runtime', len(cr.data.bones), 'control')

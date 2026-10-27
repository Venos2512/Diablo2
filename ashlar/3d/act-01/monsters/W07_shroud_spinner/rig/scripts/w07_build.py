"""R2 + R3 for W07 Shroud-Spinner: rig mesh, runtime skeleton, skin, control rig -> rig/W07_shroud_spinner_rig.blend

blender -b --factory-startup -P w07_build.py
Rebuilds everything from the source GLB (read only, sha256 checked) and rig/_work/rig_spec.json (bone table approved at
G1 2026-10-26). Writes rig/_work/build_report.json.

Mesh: raw GLB topology scaled to 1.44 m; the two orphan rear-leg pieces are deleted (G1 decision 1); every remaining
vertex keeps its GLB index in the int attribute `src_index`.
Weights (rig_v1 §2b method): computed on the position-welded mesh (co-located vertices share one row), per part:
rigid parts -> one bone; legs/palps -> nearest bone segment, blended across each joint's bisector plane, Laplace
smoothing inside the joint bands; abdomen -> abdomen_01 / abdomen_02 cap around the spinneret, Laplace smoothed;
<= 4 influences, normalised.
Control rig: armature W07_shroud_spinner_Control, ctl_* FK copies + per leg IK control at the tip, ankle target
(child of it), knee pole (child of ctl_cog), 2-bone IK femur-tibia, tarsus Damped Track; IK/FK switch ik_leg_<S><n>.
The runtime bones copy the controls (Copy Transforms, world space).
"""
import bpy, bmesh, os, sys, json, math
import numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w07_common as C
rb = C.rb

BLEND = C.RIG + '/W07_shroud_spinner_rig.blend'
if '--out' in C.script_args():
    BLEND = C.script_args()[C.script_args().index('--out') + 1]
SPEC = json.load(open(C.WORK + '/rig_spec.json'))
RUNTIME = 'W07_shroud_spinner_Rig'
CONTROL = 'W07_shroud_spinner_Control'
MESH = 'W07_shroud_spinner'
REPORT = {}

# ------------------------------------------------------------------ 1. mesh (scaled GLB, orphans removed)
ob, info = C.import_scaled()
me = ob.data
N0 = len(me.vertices)
CO = np.array([v.co[:] for v in me.vertices])
rep, reps = C.weld_map(ob, dist=1e-5)
rep = np.array(rep)
lab, groups = C.welded_islands(ob, rep)
lab = np.array(lab)

# island roles by size and side (same ids as the R1 analysis, checked)
isl_n = {k: len(g) for k, g in enumerate(groups)}
isl_x = {k: float(CO[g][:, 0].mean()) for k, g in enumerate(groups)}
role = {}
for k, n in isl_n.items():
    s = 'L' if isl_x[k] > 0 else 'R'
    if n == 1400:
        role[k] = 'abdomen'
    elif n == 565:
        role[k] = 'ceph'
    elif n == 409:
        role[k] = s + '_fused12'
    elif n in (246, 248):
        role[k] = s + '_leg3'
    elif n == 318:
        role[k] = s + '_leg4'
    elif n == 115:
        role[k] = s + '_orphan'
    elif n == 211:
        role[k] = s + '_palp'
    elif n in (221, 222):
        role[k] = s + '_palpcoxa'
    elif n in (64, 65):
        role[k] = s + '_fang'
    elif n == 48:
        role[k] = s + '_lump'
    elif n == 26:
        role[k] = s + '_eye'
    else:
        raise RuntimeError(f'unexpected island {k} with {n} welded verts')
assert sorted(role.values()) == sorted(['abdomen', 'ceph'] + [f'{s}_{r}' for s in 'LR' for r in
                                        ('fused12', 'leg3', 'leg4', 'orphan', 'palp', 'palpcoxa', 'fang', 'lump', 'eye', 'eye')])
vrole = np.array([role[int(l)] for l in lab])

me.attributes.new('src_index', 'INT', 'POINT').data.foreach_set('value', np.arange(N0, dtype=np.int32))
orphan = np.isin(vrole, ['L_orphan', 'R_orphan'])
me.calc_loop_triangles()
orphan_tris = int(sum(1 for t in me.loop_triangles if orphan[t.vertices[0]]))
bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
bmesh.ops.delete(bm, geom=[bm.verts[i] for i in np.nonzero(orphan)[0]], context='VERTS')
bm.to_mesh(me); bm.free(); me.update()
src = np.zeros(len(me.vertices), dtype=np.int32); me.attributes['src_index'].data.foreach_get('value', src)
me.calc_loop_triangles()
REPORT['mesh'] = dict(glb_verts=N0, glb_tris=info['faces'], orphan_verts=int(orphan.sum()), orphan_tris=orphan_tris,
                      rig_verts=len(me.vertices), rig_tris=len(me.loop_triangles), scale=info['scale'], height_m=info['height_m'])
print('mesh', REPORT['mesh'])

# ------------------------------------------------------------------ 2. weights on the welded mesh (original indices)
B = {b['name']: b for b in SPEC['bones']}
DEFORM = [b['name'] for b in SPEC['bones'] if b['deform']]
BI = {n: i for i, n in enumerate(DEFORM)}
Wm = np.zeros((N0, len(DEFORM)))                    # rows by ORIGINAL vertex index (welded rows copied later)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def seg_dist(P, a, b):
    ab = b - a; L2 = float(ab @ ab)
    t = np.clip(((P - a) @ ab) / L2, 0, 1)
    return np.linalg.norm(P - (a + np.outer(t, ab)), axis=1)


def V(x):
    return np.array(x, dtype=float)


def unit(x):
    return x / np.linalg.norm(x)


def chain_weights(rows, chains, bands, knob=None, iters=6, max_edge=0.06):
    """rows: welded rep indices of one limb island. chains: bone-name lists root->tip. bands: blend half-widths per
    joint (1..k-1). Each vertex is rigid to its nearest bone segment, except inside a joint band, where the child weight
    t = smoothstep across the joint's bisector plane, then Laplace-smoothed as a scalar field of THAT joint only
    (neighbours over edges < max_edge whose nearest bone is one of the joint's two bones). Long bar faces therefore
    never carry weights from one joint to the next. Knob: rigid to cephalothorax inside r1, fading to the leg by r2.
    Returns (W (n x nbones), names, blended mask)."""
    P = CO[rows]; pos = {int(r): i for i, r in enumerate(rows)}
    nbr = []
    for i, r in enumerate(rows):
        nbr.append([pos[q] for q in NB.get(int(r), ()) if q in pos and np.linalg.norm(P[pos[q]] - P[i]) < max_edge])
    names = [n for ch in chains for n in ch]
    segs = [(V(B[n]['head']), V(B[n]['tail'])) for n in names]
    D = np.stack([seg_dist(P, a, b) for a, b in segs], 1)
    near = D.argmin(1)
    Wl = np.zeros((len(P), len(names))); Wl[np.arange(len(P)), near] = 1.0
    blended = np.zeros(len(P), dtype=bool)
    off = 0
    for ch in chains:
        k = len(ch)
        for j in range(1, k):                      # joint between ch[j-1] and ch[j]
            ip, ic = off + j - 1, off + j
            a0, a1 = V(B[ch[j - 1]]['head']), V(B[ch[j - 1]]['tail'])
            b0, b1 = V(B[ch[j]]['head']), V(B[ch[j]]['tail'])
            n = unit(unit(a1 - a0) + unit(b1 - b0)); J = b0
            s = (P - J) @ n; bw = bands[j - 1]
            member = (near == ip) | (near == ic)
            t = (near == ic).astype(float)
            band = member & (np.abs(s) < bw)
            t[band] = smoothstep(-bw, bw, s[band])
            free = np.nonzero(member & (np.abs(s) < 1.5 * bw))[0]
            for _ in range(iters):
                tn = t.copy()
                for i in free:
                    nb_ = [q for q in nbr[i] if member[q]]
                    if nb_:
                        tn[i] = 0.5 * t[i] + 0.5 * float(np.mean(t[nb_]))
                t = tn
            Wl[free] = 0.0; Wl[free, ic] = t[free]; Wl[free, ip] = 1 - t[free]
            blended[free[(t[free] > 1e-4) & (t[free] < 1 - 1e-4)]] = True
        off += k
    if knob is not None:
        c, r1, r2 = knob
        f = smoothstep(r1, r2, np.linalg.norm(P - c, axis=1))
        Wl = Wl * f[:, None]
        names = names + ['cephalothorax']
        Wl = np.concatenate([Wl, (1 - f)[:, None]], 1)
        blended |= (f > 0) & (f < 1)
    return Wl, names, blended


# welded adjacency for Laplace smoothing, from the kept mesh (the deleted orphans were separate islands)
kept_edges = [(int(src[e.vertices[0]]), int(src[e.vertices[1]])) for e in me.edges]
NB = {}
for a, b in kept_edges:
    ra, rb_ = int(rep[a]), int(rep[b])
    if ra != rb_:
        NB.setdefault(ra, set()).add(rb_); NB.setdefault(rb_, set()).add(ra)


def put(rows, Wpart, names):
    for j, n in enumerate(names):
        if np.any(Wpart[:, j] > 0):
            Wm[rows, BI[n]] += Wpart[:, j]


part_rows = {}
for r in np.unique(vrole):
    part_rows[r] = np.array(sorted(set(int(x) for x in rep[vrole == r])))

# rigid parts
for s in 'LR':
    for r in ('palpcoxa', 'lump', 'eye'):
        Wm[part_rows[f'{s}_{r}'], BI['cephalothorax']] = 1.0
    Wm[part_rows[f'{s}_fang'], BI[f'{s}_fang']] = 1.0
Wm[part_rows['ceph'], BI['cephalothorax']] = 1.0

# legs
LEG_BANDS = (0.050, 0.045, 0.035)               # coxa|femur collar, knee, tibia|tarsus ring (half widths, m)
PALP_BAND = 0.06                                 # trial 2026-10-26: (0.035, 0.04, 0.03)/0.03 -> fangs 4.7x, lift L2 3.4x; these -> 2.7x, 2.7x
if '--leg-bands' in C.script_args():
    _i = C.script_args().index('--leg-bands'); LEG_BANDS = tuple(float(x) for x in C.script_args()[_i + 1:_i + 4])
if '--palp-band' in C.script_args():
    PALP_BAND = float(C.script_args()[C.script_args().index('--palp-band') + 1])
KNOB = (0.06, 0.16)                              # fused Leg1+Leg2 root: rigid to the body inside r1, coxa beyond r2
REPORT['skin'] = dict(leg_bands_m=LEG_BANDS, palp_band_m=PALP_BAND, knob_m=KNOB, parts={})
for s in 'LR':
    for part, chains, knob in ((f'{s}_fused12', [[f'{s}_Leg1_0{i}' for i in range(1, 5)], [f'{s}_Leg2_0{i}' for i in range(1, 5)]], True),
                               (f'{s}_leg3', [[f'{s}_Leg3_0{i}' for i in range(1, 5)]], False),
                               (f'{s}_leg4', [[f'{s}_Leg4_0{i}' for i in range(1, 5)]], False)):
        rows = part_rows[part]
        kn = (V(B[f'{s}_Leg1_01']['head']), KNOB[0], KNOB[1]) if knob else None
        Wl, names, blended = chain_weights(rows, chains, LEG_BANDS, knob=kn)
        put(rows, Wl, names)
        REPORT['skin']['parts'][part] = dict(verts=len(rows), blended_verts=int(blended.sum()))
    # palp: base -> top -> tip
    rows = part_rows[f'{s}_palp']
    Wl, names, blended = chain_weights(rows, [[f'{s}_Palp_01', f'{s}_Palp_02']], (PALP_BAND,))
    put(rows, Wl, names)
    REPORT['skin']['parts'][f'{s}_palp'] = dict(verts=len(rows), blended_verts=int(blended.sum()))

# abdomen: cap around the spinneret -> abdomen_02
rows = part_rows['abdomen']; P = CO[rows]
Cc = V(B['abdomen_01']['tail']); S = V(B['abdomen_02']['tail'])
u = unit(S - Cc)
cosang = ((P - Cc) / np.linalg.norm(P - Cc, axis=1)[:, None]) @ u
CAP = (15.0, 45.0)                                  # full abdomen_02 inside CAP[0] deg of the spinneret axis, none beyond CAP[1]
                                                    # (trial 2026-10-26: 32/62 -> curl -12 deg 1.54x, -20 deg 13 bad edges; 15/45 -> 1.40x, 0)
_a = C.script_args()
if '--cap' in _a:
    CAP = (float(_a[_a.index('--cap') + 1]), float(_a[_a.index('--cap') + 2]))
w2 = smoothstep(math.cos(math.radians(CAP[1])), math.cos(math.radians(CAP[0])), cosang)
# Laplace smoothing of the cap field over short edges only (silk-band faces are long: no jump across the ball)
pos_ = {int(r): i for i, r in enumerate(rows)}
nbr_ = [[pos_[q] for q in NB.get(int(r), ()) if q in pos_ and np.linalg.norm(P[pos_[q]] - P[i]) < 0.06] for i, r in enumerate(rows)]
free = np.nonzero((cosang > math.cos(math.radians(CAP[1] + 6))) & (cosang < math.cos(math.radians(max(CAP[0] - 6, 0)))))[0]
for _ in range(10):
    w2n = w2.copy()
    for i in free:
        if nbr_[i]:
            w2n[i] = 0.5 * w2[i] + 0.5 * float(np.mean(w2[nbr_[i]]))
    w2 = w2n
Wl = np.stack([1 - w2, w2], 1)
put(rows, Wl, ['abdomen_01', 'abdomen_02'])
REPORT['skin']['parts']['abdomen'] = dict(verts=len(rows), cap_full=int((w2 >= 0.999).sum()),
                                          blend=int(((w2 > 1e-4) & (w2 < 1 - 1e-4)).sum()), cap_cone_deg=list(CAP))

# copy welded rows to co-located vertices, prune to 4, normalise
Wm = Wm[rep]
cnt_before = int(((Wm > 0).sum(1) > 4).sum())
for i in np.nonzero((Wm > 0).sum(1) > 4)[0]:
    keep = np.argsort(Wm[i])[-4:]; m = np.zeros_like(Wm[i]); m[keep] = Wm[i][keep]; Wm[i] = m
Wm[Wm < 1e-4] = 0.0
ssum = Wm.sum(1)
assert np.all(ssum[~orphan] > 0), 'vertex without weight'
Wm[~orphan] /= ssum[~orphan][:, None]

# ------------------------------------------------------------------ 3. runtime armature
col = bpy.data.collections.new('W07_Rig'); bpy.context.scene.collection.children.link(col)
for c in list(ob.users_collection):
    c.objects.unlink(ob)
col.objects.link(ob)
ob.name = MESH; me.name = MESH + '_mesh'


def make_armature(name, bones, prefix=''):
    arm = bpy.data.armatures.new(name); o = bpy.data.objects.new(name, arm); col.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for b in bones:
        eb = arm.edit_bones.new(prefix + b['name']); eb.head = b['head']; eb.tail = b['tail']
        eb.align_roll(Vector(b['z'])); eb.use_deform = bool(b.get('deform', False)) and prefix == ''
        eb.use_connect = False
    for b in bones:
        if b.get('parent'):
            arm.edit_bones[prefix + b['name']].parent = arm.edit_bones[prefix + b['parent']]
    bpy.ops.object.mode_set(mode='OBJECT')
    return o


rig = make_armature(RUNTIME, SPEC['bones'])
rig.data.display_type = 'OCTAHEDRAL'; rig.show_in_front = True
rig['height_m'] = C.HEIGHT_M; rig['scale_from_glb'] = info['scale']; rig['k'] = C.HEIGHT_M / C.H_UNIT
rcols = {n: rig.data.collections.new(n) for n in ('Root', 'Body', 'Head', 'Legs_L', 'Legs_R', 'Sockets')}
for b in SPEC['bones']:
    g = b['group']; n = b['name']
    c = ('Root' if g == 'root' else 'Sockets' if g == 'socket' else 'Body' if g == 'body' else 'Head' if g in ('head', 'palp')
         else 'Legs_L' if n.startswith('L_') else 'Legs_R')
    rcols[c].assign(rig.data.bones[n])

# vertex groups + armature modifier
vgs = {n: ob.vertex_groups.new(name=n) for n in DEFORM}
Wk = Wm[src]                                         # rows of the kept vertices
for j, n in enumerate(DEFORM):
    idx = np.nonzero(Wk[:, j] > 0)[0]
    for i in idx:
        vgs[n].add([int(i)], float(Wk[i, j]), 'REPLACE')
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rig; mod.use_vertex_groups = True
ob.parent = rig

# ------------------------------------------------------------------ 4. control rig
ctl_bones = [dict(b) for b in SPEC['bones'] if b['group'] != 'socket']
extra = []
legs = [(s, n) for s in 'LR' for n in range(1, 5)]
for s, n in legs:
    b4 = B[f'{s}_Leg{n}_04']; b2 = B[f'{s}_Leg{n}_02']; b3 = B[f'{s}_Leg{n}_03']
    tip = V(b4['tail']); ring = V(b4['head']); knee = V(b3['head']); hip = V(b2['head'])
    extra.append(dict(name=f'{s}_Leg{n}_IK', head=tip.tolist(), tail=(tip + [0, 0, 0.18]).tolist(), parent='root', z=[0, -1, 0], kind='ik'))
    extra.append(dict(name=f'{s}_Leg{n}_ankle', head=ring.tolist(), tail=(ring + 0.10 * unit(tip - ring)).tolist(),
                      parent=f'{s}_Leg{n}_IK', z=b4['z'], kind='mech'))
    L = unit(ring - hip); foot = hip + L * float((knee - hip) @ L); pdir = unit(knee - foot)
    pole = knee + 0.55 * pdir
    extra.append(dict(name=f'{s}_Leg{n}_pole', head=pole.tolist(), tail=(pole + [0, 0, 0.10]).tolist(), parent='cog', z=[0, -1, 0], kind='pole'))
ctl = make_armature(CONTROL, ctl_bones + extra, prefix='ctl_')
ctl.data.display_type = 'OCTAHEDRAL'; ctl.show_in_front = True
for b in ctl.data.bones:
    b.use_deform = False

ccols = {n: ctl.data.collections.new(n) for n in ('Root/COG', 'Body FK', 'Head FK', 'Legs FK L', 'Legs FK R', 'IK feet', 'Poles',
                                                    'IK mechanics')}
for b in ctl_bones + extra:
    n = b['name']; bone = ctl.data.bones['ctl_' + n]; kind = b.get('kind')
    side = 'L' if n.startswith('L_') else 'R' if n.startswith('R_') else 'C'
    if kind == 'ik':
        c = 'IK feet'
    elif kind == 'pole':
        c = 'Poles'
    elif kind == 'mech':
        c = 'IK mechanics'
    elif n in ('root', 'cog'):
        c = 'Root/COG'
    elif n.startswith(('cephalothorax', 'abdomen')):
        c = 'Body FK'
    elif 'fang' in n or 'Palp' in n:
        c = 'Head FK'
    else:
        c = 'Legs FK L' if side == 'L' else 'Legs FK R'
    ccols[c].assign(bone)
    bone.color.palette = ({'L': 'THEME04', 'R': 'THEME01', 'C': 'THEME03'}[side] if kind is None
                          else {'ik': 'THEME09', 'pole': 'THEME07', 'mech': 'THEME10'}[kind])
ccols['IK mechanics'].is_visible = False

# runtime follows control
for pb in rig.pose.bones:
    if ('ctl_' + pb.name) in ctl.pose.bones:
        c = pb.constraints.new('COPY_TRANSFORMS'); c.name = 'FollowControl'
        c.target = ctl; c.subtarget = 'ctl_' + pb.name; c.target_space = 'WORLD'; c.owner_space = 'WORLD'


def drive(con, prop):
    fc = con.driver_add('influence'); d = fc.driver; d.type = 'AVERAGE'
    v = d.variables.new(); v.name = 'ik'; v.type = 'SINGLE_PROP'
    v.targets[0].id_type = 'OBJECT'; v.targets[0].id = ctl; v.targets[0].data_path = f'["{prop}"]'


for s, n in legs:
    prop = f'ik_leg_{s}{n}'
    ctl[prop] = 1.0
    ctl.id_properties_ui(prop).update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0, description=f'1 = IK, 0 = FK ({s}_Leg{n})')
    tib = ctl.pose.bones[f'ctl_{s}_Leg{n}_03']
    ik = tib.constraints.new('IK'); ik.name = 'LegIK'
    ik.target = ctl; ik.subtarget = f'ctl_{s}_Leg{n}_ankle'
    ik.pole_target = ctl; ik.pole_subtarget = f'ctl_{s}_Leg{n}_pole'
    ik.chain_count = 2; ik.use_tail = True; ik.use_stretch = False
    drive(ik, prop)
    tar = ctl.pose.bones[f'ctl_{s}_Leg{n}_04']
    dt = tar.constraints.new('DAMPED_TRACK'); dt.name = 'ToFoot'; dt.target = ctl; dt.subtarget = f'ctl_{s}_Leg{n}_IK'
    dt.track_axis = 'TRACK_Y'
    drive(dt, prop)

# pole angles: rest pose must not move (femur, tibia)
bpy.context.view_layer.update()


def dev(names):
    m = 0.0
    for nm in names:
        pb = ctl.pose.bones[nm]; r = ctl.data.bones[nm].matrix_local
        m = max(m, pb.matrix.to_quaternion().rotation_difference(r.to_quaternion()).angle,
                (pb.matrix.translation - r.translation).length)
    return m


poles = {}
for s, n in legs:
    con = ctl.pose.bones[f'ctl_{s}_Leg{n}_03'].constraints['LegIK']; names = [f'ctl_{s}_Leg{n}_02', f'ctl_{s}_Leg{n}_03']
    sc = []
    for a in range(-180, 180, 15):
        con.pole_angle = math.radians(a); bpy.context.view_layer.update(); sc.append((dev(names), a))
    sc.sort(); best = sc[0]
    for step in (1.0, 0.1, 0.01):
        lo_ = best[1] - 15 * step if step == 1.0 else best[1] - 10 * step
        cand = [lo_ + i * step for i in range(31 if step == 1.0 else 21)]
        res = []
        for a in cand:
            con.pole_angle = math.radians(a); bpy.context.view_layer.update(); res.append((dev(names), a))
        res.sort(); best = res[0]
    con.pole_angle = math.radians(best[1]); bpy.context.view_layer.update()
    poles[f'{s}{n}'] = dict(pole_angle_deg=round(best[1], 3), rest_dev=float(f'{best[0]:.3g}'))
REPORT['pole_angles'] = poles
print('poles', poles)

# rest check through the whole chain (runtime vs rest)
bpy.context.view_layer.update()
rest_dev = 0.0
for pb in rig.pose.bones:
    r = rig.data.bones[pb.name].matrix_local
    rest_dev = max(rest_dev, (pb.matrix.translation - r.translation).length,
                   pb.matrix.to_quaternion().rotation_difference(r.to_quaternion()).angle)
REPORT['rest_runtime_max_dev'] = float(f'{rest_dev:.3g}')

# ------------------------------------------------------------------ 5. scene, viewport, save
scn = bpy.context.scene
scn.unit_settings.system = 'METRIC'; scn.unit_settings.scale_length = 1.0
scn.render.fps = 24; scn.frame_start, scn.frame_end = 1, 24; scn.frame_current = 1
scn.tool_settings.use_keyframe_insert_auto = False
for o in (rig,):
    o.hide_set(True)
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == 'VIEW_3D':
            for sp in area.spaces:
                if sp.type == 'VIEW_3D':
                    sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'; sp.overlay.show_bones = True
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = ctl; ctl.select_set(True)
REPORT['bones'] = dict(runtime=len(rig.data.bones), deform=sum(1 for b in rig.data.bones if b.use_deform),
                       control=len(ctl.data.bones))
REPORT['weights'] = dict(pruned_over4=cnt_before, max_infl=int((Wk > 0).sum(1).max()),
                         hist={int(k): int(v) for k, v in zip(*np.unique((Wk > 0).sum(1), return_counts=True))})
rb.save(BLEND)
C.jdump(C.WORK + '/build_report.json', REPORT)
print('BUILD_DONE', json.dumps(REPORT['bones']), REPORT['rest_runtime_max_dev'])

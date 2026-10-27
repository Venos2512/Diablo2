"""R2 + R3 of U04: import the GLB at the G1 scale, runtime skeleton, skin, control rig; save rig/U04_charnel_ghoul_rig.blend.

blender -b --factory-startup -P u04_build.py
Rebuilds from the source GLB every run (read only, sha256 checked). Writes rig/_work/build.json.
"""
import bpy, os, sys, json, math, time, shutil
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import u04_common as C
import u04_joints as UJ
import u04_layout as UL
import u04_skin as SK
import u04_rigctl as RC
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

t0 = time.time()
S = UJ.SCALE_OPTIONS['A']['s']
ob = C.import_glb(S, tex_max=None)                 # full 4096 maps: they are packed into the .blend unchanged
for im in bpy.data.images:
    if im.source == 'FILE' and not im.packed_file:
        im.pack()
me = ob.data
# ---------------------------------------------------------------- pieces
wid, nw = C.weld_ids(ob)
lab_v, isl = C.welded_islands(ob, wid)
ROLE = {0: 'body', 1: 'smock', 2: 'hood', 3: 'tie'}
role_v = [ROLE.get(lab_v[i], 'tooth') for i in range(len(me.vertices))]
P, role, E, tris = SK.welded(ob, wid, nw, role_v)
T = P / S
body = role == 'body'
isl_w = np.zeros(nw, np.int64)
for i in range(len(me.vertices)):
    isl_w[wid[i]] = lab_v[i]
body_tris = np.array([t for t in tris if body[t[0]]], dtype=np.int64)
C.log('welded', nw, 'body', int(body.sum()), 'tris', len(tris), 'body tris', len(body_tris))

# ---------------------------------------------------------------- smock chains (roots from R1, tips = lowest hem band)
bvh_body = BVHTree.FromPolygons([Vector(p) for p in P], [tuple(t) for t in body_tris])
sm_idx = np.nonzero(role == 'smock')[0]
sm_d = np.array([bvh_body.find_nearest(Vector(P[i]))[3] for i in sm_idx]) / S
sm_reg = [UJ.smock_region(T[i, 0], T[i, 1], T[i, 2], d) for i, d in zip(sm_idx, sm_d)]
chains = {}; chain_info = {}
for name, (parent, why) in UJ.SMOCK_CHAINS.items():
    sel = [k for k, r_ in enumerate(sm_reg) if r_ == name and sm_d[k] > 0.03]
    vs = T[sm_idx[sel]]
    if name.startswith('L_'):
        vs = vs[vs[:, 0] > 0]
    zt, zb = vs[:, 2].max(), vs[:, 2].min()
    bot = vs[vs[:, 2] < zb + 0.15 * (zt - zb)].mean(0)
    top = np.array(UJ.SMOCK_ROOTS[name])
    if not name.startswith('L_'):
        bot[0] = 0.0
    pts = [Vector(top * S), Vector((top + bot) / 2 * S), Vector(bot * S)]
    chains[name] = (parent, pts); chain_info[name] = dict(parent=parent, root=C.r(pts[0]), tip=C.r(pts[2]), hanging=len(vs))
    if name.startswith('L_'):
        rn = 'R_' + name[2:]
        chains[rn] = (parent.replace('L_', 'R_'), [UL.mir(q) for q in pts])
        chain_info[rn] = dict(parent=parent.replace('L_', 'R_'), mirror_of=name)
Jm = UJ.scaled(S)
bones = UL.layout(Jm, chains, S)
names = [b['name'] for b in bones if b['deform']]
ix = {n: i for i, n in enumerate(names)}; NB = len(names)

# ---------------------------------------------------------------- body weights
fixed, Wfix, seed_st, masks = SK.body_seeds(T, body, ix)
Wh, hst = SK.harmonic(P, E, body, fixed, Wfix)
W = SK.split_twist(Wh.copy(), T, names)
W = SK.prune(W)
C.log('harmonic', hst, 'seeds', dict(seed_st))

# ---------------------------------------------------------------- cloth + teeth
Wall = np.where(body[:, None], W, 0.0)


def cloth_rows(idx, drop=('jaw',), fallback='head'):
    rows, d = SK.skin_follow(P, body_tris, W, idx)
    for n in drop:
        rows[:, ix[n]] = 0.0
    s = rows.sum(1)
    low = s < 0.5
    rows[low] = 0.0; rows[low, ix[fallback]] = 1.0
    rows[~low] /= s[~low, None]
    return rows, d


# hood: skin-follow without the jaw (side flaps hang beside the jaw but belong to the skull)
hood = np.nonzero(role == 'hood')[0]
rows, _ = cloth_rows(hood)
Wall[hood] = rows
Wall = SK.smooth_rows(Wall, E, role == 'hood', P, iters=4)
# tie: ring + knot follow the neck skin, the two hanging ends follow tie_01..02
tie = np.nonzero(role == 'tie')[0]
rows, _ = cloth_rows(tie, drop=('jaw', 'head'), fallback='neck')
_, u, _ = SK.seg(P[tie], np.array(Jm['tie']), np.array(Jm['tie_end']))
ring = u <= 0.05
rows[:] = rows[ring].mean(0)                       # ring + knot move as one piece (no stretch when the neck turns)
h = SK.sstep(0.0, 0.25, u)[:, None]
Wall[tie] = (1 - h) * rows + h * SK.chain_rows(u, ['tie_01', 'tie_02'], ix, NB)
# smock: skin-follow on the back, panels -> chains (memberships smoothed over the smock so neighbouring chains blend)
rows, _ = cloth_rows(sm_idx, drop=('jaw', 'head'), fallback='chest')
LIMB_KEEP = {'neck': 0.3, 'neck_02': 0.0}         # the collar sits on the neck base: turning the head must not twist it
for P_ in 'LR':
    # Thigh + Calf = the old hip -> hock thigh (before 2026-10-27): same 25 %
    LIMB_KEEP.update({f'{P_}_UpperArm': 0.25, f'{P_}_UpperArm_twist': 0.25, f'{P_}_Thigh': 0.25, f'{P_}_Calf': 0.25})
    for b_ in ('ForeArm', 'ForeArm_twist', 'Hand', 'Finger', 'Calf_02', 'Foot', 'Toe'):
        LIMB_KEEP[f'{P_}_{b_}'] = 0.0
for n_, f_ in LIMB_KEEP.items():
    rows[:, ix[n_]] *= f_
s_ = rows.sum(1); rows[s_ < 1e-6, ix['chest']] = 1.0; rows /= rows.sum(1, keepdims=True)
cnames = list(chains.keys())
M = np.zeros((nw, len(cnames) + 1))
for k, i in enumerate(sm_idx):
    r_ = sm_reg[k]
    M[i, cnames.index(r_) if r_ in cnames else len(cnames)] = 1.0
M = SK.smooth_rows(M, E, role == 'smock', P, iters=12, alpha=0.5)
Ms = M[sm_idx]; Ms /= Ms.sum(1, keepdims=True)
Wsm = Ms[:, -1:] * rows
for c, cn in enumerate(cnames):
    root, tip = np.array(chains[cn][1][0]), np.array(chains[cn][1][2])
    _, u, _ = SK.seg(P[sm_idx], root, tip)
    h = SK.sstep(0.0, 0.35, u)[:, None]
    Wsm += Ms[:, c:c + 1] * ((1 - h) * rows + h * SK.chain_rows(u, [cn + '_01', cn + '_02'], ix, NB))
Wall[sm_idx] = Wsm
# teeth: rigid
teeth = {}
for k in sorted(set(isl_w[role == 'tooth'].tolist())):
    m = isl_w == k; up = T[m, 2].mean() > 0.80
    Wall[m] = 0.0; Wall[m, ix['head' if up else 'jaw']] = 1.0; teeth[int(k)] = 'head' if up else 'jaw'
nonbody = ~body
Wall[nonbody] = SK.prune(Wall[nonbody])
empty = int((Wall.sum(1) < 0.5).sum())
assert empty == 0, f'{empty} welded vertices without weights'

# ---------------------------------------------------------------- armatures
col = bpy.data.collections.new('U04_Rig'); bpy.context.scene.collection.children.link(col)
for c_ in list(ob.users_collection):
    c_.objects.unlink(ob)
col.objects.link(ob)
rt = UL.build_armature('U04_runtime', bones, col)
# bone collections as rig_v1 spring_layers.py / PS Pyre Singer: Body (deform), one per garment, Socket (non-deform) hidden
rcol = {k: rt.data.collections.new(k) for k in ('Body', 'Smock', 'Tie', 'Socket')}
for b in bones:
    g = 'Socket' if not b['deform'] else 'Smock' if b['name'].startswith(('smock_', 'L_smock_', 'R_smock_')) else \
        'Tie' if b['name'].startswith('tie_') else 'Body'
    rcol[g].assign(rt.data.bones[b['name']])
rcol['Socket'].is_visible = False
# heel contact points (metres): back-bottom of each hind foot
heel = {}
for P_, sgn in (('L', 1), ('R', -1)):
    an = UJ.J['ankle']; ba = UJ.J['ball']
    m = body & (sgn * T[:, 0] > 0.035) & (T[:, 1] > ba[1]) & (T[:, 2] < an[2])
    ymax = T[m, 1].max(); back = m & (T[:, 1] > ymax - 0.03)
    heel[P_] = (sgn * an[0] * S, (ymax - 0.005) * S, T[back, 2].min() * S)
ct, cl = RC.build(rt, bones, Jm, S, heel, col)
bpy.context.view_layer.update()
poles = RC.fit_pole_angles(ct)
C.log('poles', poles)

# ---------------------------------------------------------------- vertex groups + armature modifier
vgs = {n: ob.vertex_groups.new(name=n) for n in names}
for i in range(len(me.vertices)):
    row = Wall[wid[i]]
    for k in np.nonzero(row)[0]:
        vgs[names[k]].add([i], float(row[k]), 'REPLACE')
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rt; mod.use_vertex_groups = True
ob.parent = rt; ob.matrix_parent_inverse.identity()

# ---------------------------------------------------------------- scene, viewport, save
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1.0
sc.render.fps = 24; sc.frame_start, sc.frame_end = 1, 24; sc.frame_current = 1
sc.tool_settings.use_keyframe_insert_auto = False
sc['u04_scale'] = S; sc['u04_source_sha256'] = C.GLB_SHA256
sc['u04_rig_status'] = 'R2-R5, qua G2 2026-10-27; khong co Action'
rt.hide_set(True)
for o in col.objects:
    o.select_set(False)
bpy.context.view_layer.objects.active = ct; ct.select_set(True)
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == 'VIEW_3D':
            sp = area.spaces[0]; sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
            sp.overlay.show_bones = True; sp.clip_start = 0.001; sp.clip_end = 100.0
if os.path.exists(C.BLEND):
    os.makedirs(os.path.join(C.WORK, 'prev'), exist_ok=True)
    try:
        shutil.copy2(C.BLEND, os.path.join(C.WORK, 'prev', os.path.basename(C.BLEND)))
    except OSError as e:
        C.log('WARN prev copy', e)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=C.BLEND, compress=True)

# ---------------------------------------------------------------- report
per_bone = {n: int((Wall[:, k] > 0.0).sum()) for k, n in enumerate(names)}
dom = {n: int(((Wall.argmax(1) == k) & (Wall.max(1) > 0)).sum()) for k, n in enumerate(names)}
rep = dict(scale=S, verts=len(me.vertices), welded=nw, body=int(body.sum()), harmonic=hst, seeds=dict(seed_st),
           bones=len(bones), deform=NB, control=len(cl), chains=chain_info, heel={k: C.r(v) for k, v in heel.items()},
           poles=poles, teeth=teeth, weights_nonzero=per_bone, weights_dominant=dom,
           max_influences=int((Wall > 0).sum(1).max()), seconds=round(time.time() - t0, 1))
C.save_json(os.path.join(C.WORK, 'build.json'), rep)
print('BUILD_DONE', rep['bones'], rep['deform'], rep['control'], rep['harmonic'], rep['seconds'])

"""R5 for P06 Poppy-Mound: test poses (family O) with numbers + QA renders. Opens the rig file READ-ONLY (never saved:
textures are downscaled in memory for the renders).

blender -b --factory-startup -P p06_r5_qa.py

Writes rig/_work/r5_metrics.json and raw renders in rig/qa/raw/ (composited into rig/qa/*_G2_*.png by p06_sheet.py).
"""
import bpy, os, sys, json, math, colorsys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p06_common as C
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

RAW = os.path.join(C.QA, 'raw'); os.makedirs(RAW, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=C.BLEND)
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
ob = next(o for o in bpy.data.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers))
me = ob.data
C.downscale_textures(1024)
cls = C.classify(ob)
L = C.landmarks(ob, cls)
scn = bpy.context.scene
DEF = [g.name for g in ob.vertex_groups]
BASE = np.array([v.co[:] for v in me.vertices])
E = np.array([e.vertices[:] for e in me.edges])
REST_LEN = np.linalg.norm(BASE[E[:, 0]] - BASE[E[:, 1]], axis=1)
vis = np.array(cls['vis'])
body_faces = [list(p.vertices) for p in me.polygons if vis[p.vertices[0]] == 0]
WGT = {n: np.zeros(len(me.vertices)) for n in DEF}
for v in me.vertices:
    for g in v.groups:
        WGT[DEF[g.group]][v.index] = g.weight

# ---- poses (bone local space; metres, degrees)
def flanks(loc=None, rot=None):
    return {f: dict(**({'loc': loc} if loc else {}), **({'rot': rot} if rot else {})) for f in ('flank_front', 'L_flank', 'R_flank', 'flank_back')}
BL = ('bloom_center', 'L_bloom', 'R_bloom')
POSES = {
    'rest': {},
    'swell': {'crown': dict(loc=(0, 0.08, 0)), **flanks(loc=(0, 0.06, 0))},
    'deflate': {'crown': dict(loc=(0, -0.08, 0)), **flanks(loc=(0, -0.04, 0))},
    'swell_ctl': {'ctl_breath': dict(loc=(0, 0.08, 0))},
    'sway': {'ctl_sway': dict(loc=(0.10, 0, 0.0))},
    'tilt_x+': {**{b: dict(rot=(30, 0, 0)) for b in BL}, 'bloom_main': dict(rot=(35, 0, 0))},
    'tilt_x-': {**{b: dict(rot=(-30, 0, 0)) for b in BL}, 'bloom_main': dict(rot=(-35, 0, 0))},
    'tilt_z+': {**{b: dict(rot=(0, 0, 30)) for b in BL}, 'bloom_main': dict(rot=(0, 0, 35))},
    'tilt_z-': {**{b: dict(rot=(0, 0, -30)) for b in BL}, 'bloom_main': dict(rot=(0, 0, -35))},
    'hit': {'crown': dict(rot=(-6, 0, 0)), 'flank_front': dict(loc=(0, -0.04, 0)),
            **{b: dict(rot=(-10, 0, 0)) for b in BL + ('bloom_main',)}},
    'stir': {'flank_front': dict(rot=(5, 0, 0), loc=(0, 0, 0.02)), 'L_flank': dict(rot=(0, 0, -5)),
             'R_flank': dict(rot=(-5, 0, 0))},
    'stir8': {'flank_front': dict(rot=(8, 0, 0)), 'L_flank': dict(rot=(0, 0, -8)), 'R_flank': dict(rot=(-8, 0, 0))},
    'collapse': {'crown': dict(loc=(0, -0.40, 0)), **flanks(loc=(0, 0.12, -0.10)),
                 'bloom_center': dict(rot=(30, 0, 0)), 'L_bloom': dict(rot=(0, 0, -35)), 'R_bloom': dict(rot=(0, 0, 35)),
                 'bloom_main': dict(rot=(60, 0, 0))},
}
SWEEP = [(b, ax, a) for b in ('bloom_center', 'bloom_main', 'L_bloom', 'R_bloom') for ax in (0, 2) for a in (10, 15, 20, 30)]
RENDER = ['rest', 'swell', 'deflate', 'sway', 'tilt_x+', 'tilt_z-', 'hit', 'stir', 'collapse']
STRETCH_VIEWS = {'swell': 'three_quarter', 'deflate': 'three_quarter', 'tilt_x+': 'three_quarter', 'tilt_z-': 'front',
                 'hit': 'three_quarter', 'stir': 'three_quarter', 'collapse': 'three_quarter'}


def set_pose(spec):
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
    for n, d in spec.items():
        pb = rig.pose.bones[n]
        if 'loc' in d:
            pb.location = d['loc']
        if 'rot' in d:
            pb.rotation_euler = [math.radians(a) for a in d['rot']]
    bpy.context.view_layer.update()


def evaluated():
    dg = bpy.context.evaluated_depsgraph_get()
    m = ob.evaluated_get(dg).to_mesh(); A = np.array([v.co[:] for v in m.vertices]); ob.evaluated_get(dg).to_mesh_clear()
    return A


# ---- reference sets
rest_bvh = BVHTree.FromPolygons([Vector(p) for p in BASE], body_faces)
attach = {}
for f in cls['flora']:
    vs = [i for i in range(len(BASE)) if vis[i] == f['id']]
    d = np.array([rest_bvh.find_nearest(Vector(BASE[i]))[3] for i in vs])
    sel = [vs[k] for k in range(len(vs)) if d[k] < max(0.03, d.min() + 0.01)]
    attach[f['id']] = (sel, np.array([rest_bvh.find_nearest(Vector(BASE[i]))[3] for i in sel]))
GB = {'main': 'bloom_main', 'C': 'bloom_center', 'L': 'L_bloom', 'R': 'R_bloom'}
heads = {}
for f in cls['flora']:
    if f['kind'] == 'leaf':
        continue
    w = WGT[GB[f['group']]]; vi = [i for i in range(len(BASE)) if vis[i] == f['id']]
    top = max(w[i] for i in vi)                      # head = vertices at the piece's full share (uniform -> keeps shape)
    vs = set(i for i in vi if w[i] >= top - 1e-3)
    heads[f['id']] = vs
head_edges = {k: np.array([j for j, (a, b) in enumerate(E) if a in vs and b in vs]) for k, vs in heads.items()}
faces = {}
for k, pnt in L['faces'].items():
    if k == 'back':
        continue
    p = np.array(list(pnt)); vs = set(np.where(np.linalg.norm(BASE - p, axis=1) < 0.15)[0].tolist())
    faces[k] = np.array([j for j, (a, b) in enumerate(E) if a in vs and b in vs])
floor = np.where(BASE[:, 2] < 0.03)[0]
sockets = ['fx_spawn_main', 'fx_spawn_L', 'fx_spawn_R', 'fx_body']
sock_ref = {'fx_spawn_main': 5, 'fx_spawn_L': 11, 'fx_spawn_R': 9}
long_e = REST_LEN >= 0.01


def socket_pos():
    return {s: np.array((rig.matrix_world @ rig.pose.bones[s].head)[:]) for s in sockets}


set_pose({})
S0 = socket_pos()
def kabsch(P0, P1):
    c0 = P0.mean(0); c1 = P1.mean(0); H = (P0 - c0).T @ (P1 - c1); U, S_, Vt = np.linalg.svd(H)
    d = np.sign(np.linalg.det(Vt.T @ U.T)); D = np.diag([1, 1, d]); R = Vt.T @ D @ U.T
    return R, c0, c1
def socket_expected(A, s, fid):
    vs = sorted(heads[fid]); R, c0, c1 = kabsch(BASE[vs], A[vs]); return R @ (S0[s] - c0) + c1

metrics = {}; EVS = {}
for name, spec in POSES.items():
    set_pose(spec); A = evaluated(); EVS[name] = A
    ln = np.linalg.norm(A[E[:, 0]] - A[E[:, 1]], axis=1); q = ln[long_e] / REST_LEN[long_e]
    qq = np.maximum(q, 1 / np.maximum(q, 1e-9))
    body_e = long_e & (vis[E[:, 0]] == 0); qb = (ln[body_e] / REST_LEN[body_e]); qb = np.maximum(qb, 1 / qb)
    flo_e = long_e & (vis[E[:, 0]] > 0); qf = (ln[flo_e] / REST_LEN[flo_e]); qf = np.maximum(qf, 1 / qf)
    pb = BVHTree.FromPolygons([Vector(p) for p in A], body_faces)
    gaps = {}
    for fid, (sel, d0) in attach.items():
        d1 = np.array([pb.find_nearest(Vector(A[i]))[3] for i in sel]); gaps[fid] = float((d1 - d0).max())
    gw = max(gaps, key=lambda k: gaps[k])
    hr = {k: float(np.max(np.abs(ln[e] / REST_LEN[e] - 1))) if len(e) else 0.0 for k, e in head_edges.items()}
    fr = {k: float(np.max(np.abs(ln[e] / REST_LEN[e] - 1))) for k, e in faces.items()}
    Sp = socket_pos()
    sdev = {s: float(np.linalg.norm(Sp[s] - socket_expected(A, s, fid))) for s, fid in sock_ref.items()}
    metrics[name] = dict(
        stretch_worst=round(float(qq.max()), 3), stretch_body=round(float(qb.max()), 3), stretch_flora=round(float(qf.max()), 3),
        edges_over_1_3=int(np.count_nonzero(qq > 1.3)), edges_over_1_6=int(np.count_nonzero(qq > 1.6)),
        p99=round(float(np.percentile(qq, 99)), 3),
        floor_max_move_mm=round(1000 * float(np.max(np.linalg.norm(A[floor] - BASE[floor], axis=1))), 2),
        z_min_mm=round(1000 * float(A[:, 2].min()), 2),
        flora_gap_open_mm=round(1000 * gaps[gw], 1), flora_gap_island=gw,
        flora_gaps_over_20mm=sorted(k for k, v in gaps.items() if v > 0.02),
        heads_max_edge_change=round(max(hr.values()), 4), faces_max_edge_change={k: round(v, 3) for k, v in fr.items()},
        socket_drift_mm={s: round(1000 * v, 2) for s, v in sdev.items()},
        max_move_m=round(float(np.max(np.linalg.norm(A - BASE, axis=1))), 3))
    C.log(name, json.dumps(metrics[name])[:300])
# usable range of each bloom bone alone: worst flora edge ratio vs angle (both signs), and translation sway
sweep = {}
fl_e = long_e & (vis[E[:, 0]] > 0)
for b, ax, a in SWEEP:
    worst = 1.0; n16 = 0
    for sg in (1, -1):
        r = [0, 0, 0]; r[ax] = sg * a; set_pose({b: dict(rot=tuple(r))}); A = evaluated()
        ln = np.linalg.norm(A[E[:, 0]] - A[E[:, 1]], axis=1); q = ln[fl_e] / REST_LEN[fl_e]; q = np.maximum(q, 1 / q)
        worst = max(worst, float(q.max())); n16 = max(n16, int(np.count_nonzero(q > 1.6)))
    sweep[f"{b} {'XYZ'[ax]} ±{a}"] = dict(worst=round(worst, 2), edges_over_1_6=n16)
for d in (0.05, 0.10, 0.15):
    worst = 1.0
    for v in ((d, 0, 0), (-d, 0, 0), (0, 0, d), (0, 0, -d)):
        set_pose({'ctl_sway': dict(loc=v)}); A = evaluated()
        ln = np.linalg.norm(A[E[:, 0]] - A[E[:, 1]], axis=1); q = ln[fl_e] / REST_LEN[fl_e]; q = np.maximum(q, 1 / q)
        worst = max(worst, float(q.max()))
    sweep[f'ctl_sway loc ±{d:.2f} m'] = dict(worst=round(worst, 2))
C.log('sweep', json.dumps(sweep))
ctl_diff = float(np.max(np.linalg.norm(EVS['swell_ctl'] - EVS['swell'], axis=1)))
summary = dict(poses=list(POSES), ctl_breath_equals_direct_swell_mm=round(1000 * ctl_diff, 3),
               worst={k: metrics[k]['stretch_worst'] for k in POSES},
               floor_max_move_mm=max(m['floor_max_move_mm'] for k, m in metrics.items() if k != 'collapse'),
               flora_gap_open_mm={k: metrics[k]['flora_gap_open_mm'] for k in POSES})

# ---- renders
cam = C.rb.setup_render(800)
lo, hi = C.rb.frame_box([ob])
def shoot(path, view, color='TEXTURE', res=800, objs=None):
    C.rb.setup_render(res); C.rb.place_camera(cam, lo, hi, view, margin=1.04)
    C.rb.only_visible(objs or [ob]); C.rb.shading(color)
    C.rb.render_to(path)

def heat(x):
    if x <= 0:
        return (0.12, 0.12, 0.16)
    return colorsys.hsv_to_rgb((1 - min(x, 1.0)) * 0.66, 0.85, 0.95)

DISP = {}
for name in RENDER:
    set_pose(POSES[name])
    for v in ('front', 'left', 'three_quarter'):
        shoot(os.path.join(RAW, f'pose_{name}_{v}.png'), v)
    if name != 'rest':
        dd = np.linalg.norm(EVS[name] - BASE, axis=1); mx = float(dd.max()); DISP[name] = round(mx, 3)
        C.rb.set_point_colors(ob, [heat(x / mx) if x > 1e-4 else (0.12, 0.12, 0.16) for x in dd], 'qa_disp')
        shoot(os.path.join(RAW, f'disp_{name}.png'), 'three_quarter', 'VERTEX')
        C.rb.clear_point_colors(ob, 'qa_disp')
    if name in STRETCH_VIEWS:
        C.rb.set_point_colors(ob, C.rb.stretch_colors(ob, lo=0.8, hi=1.6), 'qa_stretch')
        shoot(os.path.join(RAW, f'stretch_{name}.png'), STRETCH_VIEWS[name], 'VERTEX')
        C.rb.clear_point_colors(ob, 'qa_stretch')

# close-ups: front face and the bloom cluster
fpt = L['faces']['front']; cl = (L['blooms']['C']['base'] + L['blooms']['main']['head']) / 2
for name in ('rest', 'swell', 'stir', 'hit', 'collapse'):
    set_pose(POSES[name])
    C.rb.render_closeup(os.path.join(RAW, f'face_{name}.png'), [ob], center=(fpt.x, fpt.y, fpt.z), size=1.3, view='front', res=600)
for name in ('rest', 'sway', 'tilt_x+', 'tilt_z-', 'collapse'):
    set_pose(POSES[name])
    C.rb.render_closeup(os.path.join(RAW, f'bloom_{name}.png'), [ob], center=(cl.x, cl.y, cl.z), size=3.0, view='three_quarter', res=700)

# skeleton overlay at rest (+ bone name anchors)
set_pose({})
proxy = C.rb.bone_proxy(rig, posed=False, scale=1.6)
for v in ('front', 'left', 'back', 'topdown'):
    C.rb.setup_render(1000); C.rb.place_camera(cam, lo, hi, v, margin=1.04)
    C.rb.only_visible([ob]); C.rb.shading('TEXTURE'); C.rb.render_to(os.path.join(RAW, f'skel_{v}.png'))
    C.rb.only_visible([proxy]); C.rb.shading('VERTEX'); C.rb.render_to(os.path.join(RAW, f'skel_{v}_bones.png'))
    labs = []
    for b in rig.data.bones:
        a = b.head_local.lerp(b.tail_local, 0.5) if b.use_deform else b.head_local
        u, w, d = C.project(scn, cam, a); labs.append(dict(name=b.name, u=u, v=w, deform=b.use_deform))
    C.write_json(os.path.join(RAW, f'skel_{v}_labels.json'), labs)
bpy.data.objects.remove(proxy)
for o in scn.objects:
    o.hide_render = False

# weights: dominant colours (own palette, 10 separated hues) + per-bone heat
set_pose({})
PAL = {'body': (0.25, 0.85, 0.75), 'crown': (0.62, 0.35, 0.95), 'flank_front': (0.25, 0.50, 1.00), 'L_flank': (0.98, 0.85, 0.20),
       'R_flank': (0.20, 0.90, 1.00), 'flank_back': (1.00, 0.55, 0.15), 'bloom_center': (0.30, 0.85, 0.30),
       'bloom_main': (0.95, 0.15, 0.15), 'L_bloom': (0.95, 0.35, 0.85), 'R_bloom': (0.60, 0.38, 0.18)}
dom = []
for i in range(len(BASE)):
    c = np.zeros(3)
    for n in DEF:
        c += np.array(PAL[n]) * WGT[n][i]
    dom.append(tuple(c))
C.rb.set_point_colors(ob, dom, 'qa_w')
for v in ('front', 'left', 'back', 'topdown'):
    shoot(os.path.join(RAW, f'w_dom_{v}.png'), v, 'VERTEX', 900)
C.rb.render_closeup(os.path.join(RAW, 'w_dom_bloom.png'), [ob], center=(cl.x, cl.y, cl.z), size=3.0, view='three_quarter',
                    color_type='VERTEX', res=900)
C.rb.clear_point_colors(ob, 'qa_w')
BVIEW = {'body': 'three_quarter', 'crown': 'three_quarter', 'flank_front': 'front', 'L_flank': 'left', 'R_flank': 'right',
         'flank_back': 'back'}
for n in DEF:
    C.rb.set_point_colors(ob, [heat(x) for x in WGT[n]], 'qa_h')
    if n in BVIEW:
        shoot(os.path.join(RAW, f'w_{n}.png'), BVIEW[n], 'VERTEX', 700)
    else:
        C.rb.render_closeup(os.path.join(RAW, f'w_{n}.png'), [ob], center=(cl.x, cl.y, cl.z), size=3.0, view='three_quarter',
                            color_type='VERTEX', res=700)
    C.rb.clear_point_colors(ob, 'qa_h')
leg = {n: list(PAL[n]) for n in DEF}
C.write_json(os.path.join(C.WORK, 'r5_metrics.json'), dict(metrics=metrics, summary=summary, sweep=sweep, poses=POSES, bone_colors=leg,
             displacement_max_m=DISP,
             heads={k: len(v) for k, v in heads.items()}, face_edges={k: len(v) for k, v in faces.items()}))
print('R5_DONE')

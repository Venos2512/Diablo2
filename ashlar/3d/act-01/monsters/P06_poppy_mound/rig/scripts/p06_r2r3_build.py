"""R2 + R3 for P06 Poppy-Mound: rig file with the runtime skeleton (family O, G1 2026-10-26), the control rig and the skin.

blender -b --factory-startup -P p06_r2r3_build.py

R2  intake (GLB read-only, real size) -> runtime bones (p06_common.bone_table) -> ctl_breath / ctl_sway with Transformation
    constraints (mix ADD, local space: keys on the runtime bones still work; baked at R8) -> bone collections -> Armature
    modifier (one skin, one mesh).
R3  weights on the welded graph (distance weld 0.1 mm):
    body   anchor by height (ground contact = 1)                         -> `body`
    crown  dome by height                                                -> `crown`
    flank  the rest of each vertex, split between the four flank bones by Gaussian kernels of the distance to each
           bone segment; around the three sleeper faces the face's flank bone takes over (no crown) so faces stay rigid
    light Laplace smoothing (floor re-pinned), then flora pieces: stems/buds/flowers blend from the mound surface weights at
    their attachment to their bloom bone along the geodesic distance (heads rigid); leaves copy the surface below
    (+ a small bloom share at the far tip). Max 4 influences, sum 1.
Writes rig/P06_poppy_mound_rig.blend and rig/_work/r3_weights.json.
"""
import bpy, os, sys, json, math, heapq
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import p06_common as C
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import numpy as np

PRM = dict(ZA0=0.03, ZA1=0.30,          # anchor fades out between these heights (m)
           ZC0=0.35, ZC1=0.85,          # crown dome rises between these heights (flower bed at 0.6-1.1 m mostly on crown)
           SIG_F=0.80,                  # flank kernel width (m), distance to bone segment
           R_CORE=0.22, R_OUT=0.55,     # sleeper face: flank bone only inside R_CORE, blend out to R_OUT (m from face point)
           N_SMOOTH=3, LAM=0.5,         # Laplace iterations on the welded body graph (edge weights 1/length)
           PIN_Z=0.06,                  # body vertices below this keep their unsmoothed (anchored) weights
           ATT_D=0.03,                  # flora vertex closer than this to the mound = attachment
           S1_FLOWER=0.6, S1_BUD=0.8,   # geodesic fraction where a flower / bud is fully on its bloom bone (head rigid);
                                        # linear ramp from the attachment, so the stem bends along its whole length
           K_LEAF=0.15,                 # bloom share at the far tip of a leaf
           LEVER0=0.25, LEVER1=0.70, G_MIN=0.45,  # flower head share of its group bone falls from 1 (head within LEVER0 of
                                        # the bone's pivot) to G_MIN (LEVER1 or further): far flowers swing less, stems
                                        # stretch less; the whole head gets the same share, so it keeps its shape
           LEAF_SMOOTH=6,               # Laplace iterations inside each leaf piece (surface weights sampled per vertex)
           W_MIN=0.005, MAX_INF=4)
DEF = ['body', 'crown', 'flank_front', 'L_flank', 'R_flank', 'flank_back', 'bloom_center', 'bloom_main', 'L_bloom', 'R_bloom']
BI = {n: i for i, n in enumerate(DEF)}
FLANKS = ['flank_front', 'L_flank', 'R_flank', 'flank_back']
FACES = {'front': 'flank_front', 'L': 'L_flank', 'R': 'R_flank'}
GROUP_BONE = {'main': 'bloom_main', 'C': 'bloom_center', 'L': 'L_bloom', 'R': 'R_bloom'}


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def seg_dist(P, a, b):
    a = np.array(a); b = np.array(b); ab = b - a
    t = np.clip(((P - a) @ ab) / (ab @ ab), 0.0, 1.0)
    return np.linalg.norm(P - (a + t[:, None] * ab), axis=1)


# ------------------------------------------------------------------ R2: skeleton
ob, info = C.intake()
cls = C.classify(ob)
L = C.landmarks(ob, cls)
T = C.bone_table(L)
# joints saved from the skill's rig editor (tools/rig_editor_safe.py, port 8778) win over the measured landmarks
JP = os.path.join(C.RIG, f'{C.AID}_rig_{C.AID}_Rig_joints.json')
edited = []
if os.path.exists(JP):
    with open(JP, encoding='utf-8') as fh:
        J = json.load(fh).get('joints', {})
    for b in T:
        for end in ('head', 'tail'):
            k = f"b:{b['name']}.{end}"
            if k in J and (Vector(J[k]) - b[end]).length > 1e-6:
                b[end] = Vector(J[k]); edited.append(k)
    C.log('editor joints applied:', edited)
rig = C.build_rig(T)
arm = rig.data
cc = L['cap_centre']; G = L['blooms']
bpy.ops.object.mode_set(mode='EDIT'); eb = arm.edit_bones
for n, h in (('ctl_breath', Vector((cc.x, cc.y, 1.95))), ('ctl_sway', Vector((G['main']['head'].x, G['main']['head'].y, 1.95)))):
    e = eb.new(n); e.head = h; e.tail = h + Vector((0, 0, 0.25)); e.use_deform = False
    e.parent = eb['root']; e.align_roll(Vector((0, -1, 0)))
bpy.ops.object.mode_set(mode='OBJECT')
arm.display_type = 'OCTAHEDRAL'; rig.show_in_front = True

runtime = [b['name'] for b in T]
control = ['ctl_breath', 'ctl_sway']
cols = {n: arm.collections.new(n) for n in ('Runtime', 'Socket', 'Control')}
for b in arm.bones:
    cols['Control' if b.name.startswith('ctl_') else ('Socket' if b.name.startswith('fx_') else 'Runtime')].assign(b)

def tcon(owner, target, kind, axes, fac, name):
    """Transformation constraint: target local `kind` on `axes` -> owner local `kind` x fac, added on top of the owner's keys."""
    pb = rig.pose.bones[owner]; c = pb.constraints.new('TRANSFORM'); c.name = name
    c.target = rig; c.subtarget = target; c.owner_space = 'LOCAL'; c.target_space = 'LOCAL'
    c.map_from = kind; c.map_to = kind; c.use_motion_extrapolate = True
    suf = '_rot' if kind == 'ROTATION' else ''
    r = math.pi if kind == 'ROTATION' else 1.0
    for ax in 'xyz':
        setattr(c, f'from_min_{ax}{suf}', -r); setattr(c, f'from_max_{ax}{suf}', r)
        k = fac if ax in axes else 0.0
        setattr(c, f'to_min_{ax}{suf}', -r * k); setattr(c, f'to_max_{ax}{suf}', r * k)
        setattr(c, f'map_to_{ax}_from', ax.upper())
    if kind == 'ROTATION':
        c.mix_mode_rot = 'ADD'
    else:
        c.mix_mode = 'ADD'
    return c

BREATH_FLANK = 0.75          # flank push per metre of crown lift
SWAY = {'bloom_center': 1.0, 'L_bloom': 0.9, 'R_bloom': 0.9, 'bloom_main': 0.4}   # bloom_main also inherits bloom_center
tcon('crown', 'ctl_breath', 'LOCATION', 'y', 1.0, 'breath')
for f in FLANKS:
    tcon(f, 'ctl_breath', 'LOCATION', 'y', BREATH_FLANK, 'breath')
for bn, k in SWAY.items():
    tcon(bn, 'ctl_sway', 'LOCATION', 'xz', k, 'sway_loc')
    tcon(bn, 'ctl_sway', 'ROTATION', 'xz', k, 'sway_rot')
for pb in rig.pose.bones:
    pb.rotation_mode = 'XYZ'

ob.parent = rig
mod = ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rig

# ------------------------------------------------------------------ R3: weights
me = ob.data
rep, groups, nbrs, wco, vis = cls['rep'], cls['groups'], cls['nbrs'], cls['wco'], cls['vis']
nW = len(groups)
wvis = np.array([vis[g[0]] for g in groups])
P = np.array([[p.x, p.y, p.z] for p in wco])
W = np.zeros((nW, len(DEF)))
bw = np.where(wvis == 0)[0]
Pb = P[bw]; z = Pb[:, 2]
anchor = 1.0 - sstep(PRM['ZA0'], PRM['ZA1'], z)
crown = sstep(PRM['ZC0'], PRM['ZC1'], z)
seg = {b['name']: (list(b['head']), list(b['tail'])) for b in T}
K = np.stack([np.exp(-(seg_dist(Pb, *seg[f]) / PRM['SIG_F']) ** 2) for f in FLANKS], 1)
share = K / np.maximum(K.sum(1, keepdims=True), 1e-12)
face_mask = {}
for k, bn in FACES.items():
    fp = np.array(list(seg[bn][1]))          # the flank bone tail sits on the sleeper's face (G1), editor edits follow
    m = 1.0 - sstep(PRM['R_CORE'], PRM['R_OUT'], np.linalg.norm(Pb - fp, axis=1))
    face_mask[bn] = m
    crown = crown * (1 - m)
    share = share * (1 - m[:, None]); share[:, FLANKS.index(bn)] += m
Wb = np.zeros((len(bw), len(DEF)))
Wb[:, BI['body']] = anchor
Wb[:, BI['crown']] = (1 - anchor) * crown
for j, f in enumerate(FLANKS):
    Wb[:, BI[f]] = (1 - anchor) * (1 - crown) * share[:, j]
loc = {w: i for i, w in enumerate(bw)}
nb = [[loc[j] for j in nbrs[w] if j in loc] for w in bw]
nbw = [np.array([1.0 / max((wco[bw[i]] - wco[bw[j]]).length, 1e-4) for j in n]) for i, n in enumerate(nb)]
pin = z < PRM['PIN_Z']; raw = Wb.copy()
for _ in range(PRM['N_SMOOTH']):
    M = np.array([(Wb[n] * a[:, None]).sum(0) / a.sum() if n else Wb[i] for i, (n, a) in enumerate(zip(nb, nbw))])
    Wb = (1 - PRM['LAM']) * Wb + PRM['LAM'] * M
    Wb[pin] = raw[pin]
W[bw] = Wb

# flora: sample the mound surface weights (welded body weights, inverse-distance over the nearest body polygon)
body_polys = [p for p in me.polygons if vis[p.vertices[0]] == 0]
bvh = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [list(p.vertices) for p in body_polys])
def surf(p):
    loc_, nrm, fi, d = bvh.find_nearest(p)
    vs = body_polys[fi].vertices
    a = np.array([1.0 / ((me.vertices[v].co - loc_).length + 1e-4) for v in vs]); a /= a.sum()
    return sum(ai * W[rep[v]] for ai, v in zip(a, vs)), d

flora_rep = []
for f in cls['flora']:
    Wv = f['welded']; B = GROUP_BONE[f['group']]
    sw = {w: surf(wco[w]) for w in Wv}
    dmin = min(s[1] for s in sw.values())
    A = [w for w in Wv if sw[w][1] < max(PRM['ATT_D'], dmin + 0.01)]
    # geodesic distance inside the piece from its attachment
    g = {w: math.inf for w in Wv}; hq = []
    for a in A:
        g[a] = 0.0; heapq.heappush(hq, (0.0, a))
    Ws = set(Wv)
    while hq:
        d, a = heapq.heappop(hq)
        if d > g[a]:
            continue
        for b in nbrs[a]:
            if b in Ws:
                nd = d + (wco[a] - wco[b]).length
                if nd < g[b]:
                    g[b] = nd; heapq.heappush(hq, (nd, b))
    gmax = max(v for v in g.values() if v < math.inf) or 1.0
    eB = np.zeros(len(DEF)); eB[BI[B]] = 1.0
    if f['kind'] == 'leaf':
        for w in Wv:
            s = min(g[w] / gmax, 1.0)
            W[w] = (1 - PRM['K_LEAF'] * s) * sw[w][0] + PRM['K_LEAF'] * s * eB
        inn = {w: [b for b in nbrs[w] if b in Ws] for w in Wv}
        for _ in range(PRM['LEAF_SMOOTH']):
            Wn = {w: (0.5 * W[w] + 0.5 * np.mean([W[b] for b in inn[w]], 0)) if inn[w] else W[w] for w in Wv}
            for w in Wv:
                W[w] = Wn[w]
    else:
        Watt = sum(sw[a][0] for a in A) / len(A)
        S1 = PRM['S1_FLOWER'] if f['kind'] == 'flower' else PRM['S1_BUD']
        gs = 1.0
        spawn_ids = {d.get('spawn_id') for d in L['blooms'].values()}   # flowers carrying an fx_spawn socket stay at 1
        if f['group'] != 'main' and f['id'] not in spawn_ids:
            lever = (f['head'] - Vector(seg[B][0])).length
            gs = float(np.clip(1 - (lever - PRM['LEVER0']) / (PRM['LEVER1'] - PRM['LEVER0']), 0, 1))
            gs = PRM['G_MIN'] + (1 - PRM['G_MIN']) * gs
        for w in Wv:
            t = min(g[w] / gmax / S1, 1.0) * gs     # linear: the bend spreads over the whole stem
            W[w] = (1 - t) * Watt + t * eB
    flora_rep.append(dict(id=f['id'], kind=f['kind'], group=f['group'], bone=B, n=len(Wv), attach_n=len(A),
                          attach_dmin=round(dmin, 4), geodesic_max=round(gmax, 3),
                          head_share=None if f['kind'] == 'leaf' else round(gs, 3)))

# prune to MAX_INF, drop tiny, renormalise
for w in range(nW):
    r = W[w]; r[r < PRM['W_MIN']] = 0.0
    if np.count_nonzero(r) > PRM['MAX_INF']:
        keep = np.argsort(r)[-PRM['MAX_INF']:]; m = np.zeros_like(r); m[keep] = r[keep]; r = m
    s = r.sum()
    W[w] = r / s if s > 0 else np.eye(len(DEF))[BI['body']]

vg = {n: ob.vertex_groups.new(name=n) for n in DEF}
for i in range(len(me.vertices)):
    r = W[rep[i]]
    for j in np.nonzero(r)[0]:
        vg[DEF[j]].add([i], float(r[j]), 'REPLACE')

cover = {n: dict(verts=int(np.count_nonzero(W[:, BI[n]] > 0)), dominant=int(np.count_nonzero(np.argmax(W, 1) == BI[n])))
         for n in DEF}
ob['p06_weights'] = json.dumps(PRM)
rig['p06'] = json.dumps(dict(family='O', route='M', scale=info['scale'], width_m=C.WIDTH_M, runtime=runtime, control=control,
                             deform=DEF, breath_flank=BREATH_FLANK, sway=SWAY, g1='2026-10-26'))

# ------------------------------------------------------------------ tidy + save
for pb in rig.pose.bones:
    pb.location = (0, 0, 0); pb.rotation_euler = (0, 0, 0); pb.scale = (1, 1, 1)
for scr in bpy.data.screens:
    for area in scr.areas:
        if area.type == 'VIEW_3D':
            for sp in area.spaces:
                if sp.type == 'VIEW_3D':
                    sp.shading.type = 'SOLID'; sp.shading.color_type = 'TEXTURE'
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = rig; rig.select_set(True)
C.rb.save(C.BLEND)
C.write_json(os.path.join(C.WORK, 'r3_weights.json'), dict(params=PRM, coverage=cover, flora=flora_rep, editor_joints=edited,
             breath_flank=BREATH_FLANK, sway=SWAY, bones=C.table_json(T), control=control,
             welded=nW, verts=len(me.vertices)))
print('R2R3_DONE')

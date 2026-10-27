"""P03 Hush-Moths: landmarks measured on the mesh -> runtime skeleton (variant A, full) and the swarm subset (variant B).

Import inside headless Blender after p03_common. All positions in metres (Blender: facing -Y, up +Z, the moth's left = +X).

landmarks(M)      -> dict of named points + per-leg/wing/antenna data, every value with its source rule
bones_A(LM)       -> list of bone dicts (name, parent, head, tail, zaxis, deform, group)
B_COLLAPSE        -> variant B = A minus these bones; each dropped bone's weights go to the given bone
build_armature()  -> armature object from a bone list (rest = mesh rest, one root)
"""
import bpy, math
import numpy as np
from mathutils import Vector, Matrix

THIN = 0.0085          # m, smoothed cross-section radius under which the leg is the thin tarsus (measured 3-7 mm vs 10-22 mm)


def _smooth(a):
    return np.convolve(a, [1 / 3, 1 / 3, 1 / 3], mode='same')


def leg_landmarks(M, name):
    lp = M.leg_profile(name)
    prof = lp['prof']
    C = np.array([p['c'] for p in prof]); s = np.array([p['s'] for p in prof]); L = lp['length']
    rs = _smooth(np.array([p['rad'] for p in prof]))
    inside = [M.inside_body(c) for c in C]
    k_in = -1
    for k, f in enumerate(inside):
        if f:
            k_in = k
        else:
            break
    hip = (C[k_in] + C[k_in + 1]) / 2 if k_in >= 0 else C[0]
    hip_rule = f'boundary of bins {k_in}/{k_in + 1} (inside/outside body)' if k_in >= 0 else 'inner end of the leg (bin 0, at the body underside)'
    win = [k for k in range(len(prof)) if 0.2 * L <= s[k] <= 0.65 * L]
    top = max(win, key=lambda k: C[k][2])
    near = [k for k in range(max(0, top - 2), min(len(prof), top + 3))]
    knee_k = max(near, key=lambda k: rs[k])
    knee = C[knee_k]
    thin = next((k for k in range(knee_k + 1, len(prof)) if rs[k] < THIN), len(prof) - 1)
    cand = [k for k in range(knee_k + 2, thin) if rs[k] > rs[k - 1] and rs[k] >= rs[k + 1]]
    if cand:
        a_k = max(cand, key=lambda k: rs[k])
        grp = [k for k in (a_k - 1, a_k, a_k + 1) if rs[k] >= 0.85 * rs[a_k]]
        w = np.array([rs[k] for k in grp]); ankle = (C[grp] * w[:, None]).sum(0) / w.sum()
        ankle_rule = f'knob: radius peak bins {grp}'
    else:
        a_k = thin - 1; ankle = C[a_k]; ankle_rule = f'end of the tibia: bin {a_k} before the thin tarsus'
    tip = M.CO[lp['tip']]
    # ground contact of the foot: lowest bins of the foot, centroid
    foot_bins = [k for k in range(thin, len(prof))]
    fc = C[foot_bins].mean(0) if foot_bins else tip
    return dict(hip=hip, knee=knee, ankle=ankle, tip=tip, foot_center=fc, length=L, root_end=M.CO[lp['root']].copy(),
                rules=dict(hip=hip_rule, knee=f'radius peak near the arch top (bin {knee_k}, top bin {top})', ankle=ankle_rule,
                           tip='foot tip vertex (lowest, farthest out)'),
                profile=[dict(s=round(float(p['s']), 4), c=[round(float(x), 4) for x in p['c']], rad=round(float(p['rad']), 4),
                              inside=bool(inside[k])) for k, p in enumerate(prof)])


def wing_data(M, side, kind):
    from p03_common import pca
    ids = M.ids('wing_' + kind, side); idx = np.array(M.isl[ids[0]]); P = M.CO[idx]
    c, w, A = pca(P)
    nrm = A[2] if A[2][1] >= 0 else -A[2]                  # upper (dorsal) side faces +Y (BACK view shows it)
    ax = np.abs(P[:, 0])
    root = P[ax < ax.min() + 0.02 * M.S].mean(0)
    tip_v = P[np.argmax(ax)]
    span = tip_v - root; Lsp = np.linalg.norm(span); u = span / Lsp
    t = (P - root) @ u

    def band_center(f, h=0.06):
        m = np.abs(t / Lsp - f) < h
        Q = P[m]
        return Q.mean(0) if len(Q) else root + u * f * Lsp
    return dict(idx=idx, centroid=c, normal=nrm, root=root, tip=tip_v, span_len=Lsp, u=u,
                mid=band_center(0.45), outer=band_center(0.93, 0.05))


def antenna_data(M, side):
    from p03_common import pca
    from mathutils.bvhtree import BVHTree
    ids = M.ids('antenna', side); idx = np.concatenate([M.isl[i] for i in ids]); P = M.CO[idx]
    main = max(ids, key=lambda i: len(M.isl[i])); Pm = M.CO[M.isl[main]]
    base = Pm[np.argmin(Pm[:, 2])]; tip = Pm[np.argmax(Pm[:, 2])]
    d = (tip - base) / np.linalg.norm(tip - base)
    # exit point through the head surface along the antenna axis
    hid = M.ids('head')[0]; keep = set(M.isl[hid])
    faces = [list(p.vertices) for p in M.me.polygons if all(v in keep for v in p.vertices)]
    bvh = BVHTree.FromPolygons([Vector(p) for p in M.CO], faces)
    hit = bvh.ray_cast(Vector(base), Vector(d))
    exit_p = np.array(hit[0][:]) if hit[0] is not None and (np.array(hit[0][:]) - base) @ d < 0.08 else base + d * 0.02
    c, w, A = pca(P)
    nrm = A[2] if A[2][1] <= 0 else -A[2]                  # flat plume normal, pointing forward (-Y)
    # rachis: centre line of the main island (stalk + shaft; the comb ridges are separate islands), bins along the axis
    t = (Pm - base) @ d; edges = np.linspace(t.min(), t.max() + 1e-9, 17)
    line = [exit_p]
    for k in range(16):
        m = (t >= edges[k]) & (t < edges[k + 1])
        if m.sum() >= 2 and (edges[k] + edges[k + 1]) / 2 > (exit_p - base) @ d + 0.01:
            line.append(Pm[m].mean(0))
    line.append(tip); line = np.array(line)
    dl = np.linalg.norm(np.diff(line, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(dl)])
    f = 0.45 * cum[-1]; k = max(0, min(np.searchsorted(cum, f) - 1, len(dl) - 1))
    mid = line[k] + (f - cum[k]) / max(dl[k], 1e-9) * (line[k + 1] - line[k])
    return dict(idx=idx, base=base, exit=exit_p, tip=tip, dir=d, normal=nrm, mid=mid, rachis=line)


def eye_spot(M, side, kind='F'):
    """Centre of the red eye-spot on a wing, from the base colour texture (UV samples inside the wing faces)."""
    me = M.me
    img = None
    for mat in me.materials:
        if mat and mat.use_nodes:
            for n in mat.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image and 'basecolor' in n.image.name.lower():
                    img = n.image
    if img is None:
        return None
    im = img.copy(); im.scale(512, 512)
    px = np.array(im.pixels[:], dtype=np.float32).reshape(512, 512, 4)
    bpy.data.images.remove(im)
    ids = M.ids('wing_' + kind, side); keep = set(M.isl[ids[0]])
    uvl = me.uv_layers.active.data
    pts = []
    for p in me.polygons:
        if not all(v in keep for v in p.vertices):
            continue
        vs = [M.CO[v] for v in p.vertices]; uvs = [np.array(uvl[li].uv[:]) for li in p.loop_indices]
        for a in np.linspace(0.05, 0.9, 6):
            for b in np.linspace(0.05, 0.9 - a, 4):
                for k in range(1, len(vs) - 1):
                    w = np.array([1 - a - b, a, b]) if b >= 0 else None
                    if w is None:
                        continue
                    q = w[0] * vs[0] + w[1] * vs[k] + w[2] * vs[k + 1]
                    uv = w[0] * uvs[0] + w[1] * uvs[k] + w[2] * uvs[k + 1]
                    x = int(np.clip(uv[0] * 511, 0, 511)); y = int(np.clip(uv[1] * 511, 0, 511))
                    r_, g_, b_ = px[y, x, :3]
                    if r_ > 0.25 and r_ > 2.2 * g_ and r_ > 2.2 * b_:
                        pts.append(q)
    if not pts:
        return None
    P = np.array(pts)
    # the spot on the outer part: keep the biggest cluster around the median
    med = np.median(P, axis=0); P = P[np.linalg.norm(P - med, axis=1) < 0.08]
    return P.mean(0) if len(P) else None


MIRROR = np.array([-1.0, 1.0, 1.0])


def _mirror(d):
    """Mirror every 3-vector in a landmark dict across x = 0 (vertex index arrays are dropped)."""
    out = {}
    for k, v in d.items():
        if k == 'idx':
            continue
        if isinstance(v, np.ndarray) and v.shape == (3,):
            out[k] = v * MIRROR
        elif isinstance(v, np.ndarray) and v.ndim == 2 and v.shape[1] == 3:
            out[k] = v * MIRROR
        elif isinstance(v, dict):
            out[k] = _mirror(v)
        else:
            out[k] = v
    return out


def landmarks(M):
    """Measured on the moth's LEFT side (+X) and mirrored to the right: the mesh is symmetric (mirror error 0.2 mm mean),
    and per-side measuring picked different knobs on the two hind legs (noisy radius profile), which would make L/R clips differ."""
    LM = dict(legs={}, wings={}, antennae={}, notes=['R side = mirror of the L measurements (x -> -x)'])
    for n in (1, 2, 3):
        LM['legs'][f'L_Leg{n}'] = leg_landmarks(M, f'L_Leg{n}')
        R = _mirror(LM['legs'][f'L_Leg{n}']); R['profile'] = []
        R['rules'] = {k: 'mirror of L: ' + v for k, v in LM['legs'][f'L_Leg{n}']['rules'].items()}
        LM['legs'][f'R_Leg{n}'] = R
    F = wing_data(M, 'L', 'F'); Bw = wing_data(M, 'L', 'B')
    LM['wings']['L'] = dict(F=F, B=Bw, pivot=(F['root'] + Bw['root']) / 2, spot_F=eye_spot(M, 'L', 'F'), spot_B=eye_spot(M, 'L', 'B'))
    LM['wings']['R'] = _mirror(LM['wings']['L'])
    LM['antennae']['L'] = antenna_data(M, 'L'); LM['antennae']['R'] = _mirror(LM['antennae']['L'])
    # body: centre line of the body island along y (legs are separate islands); abdomen chain from the waist to the tip
    P = M.CO[M.isl[M.body_i]]
    ys = np.arange(P[:, 1].min(), P[:, 1].max() + 1e-6, 0.008)
    line = []
    for y0 in ys:
        m = (P[:, 1] >= y0) & (P[:, 1] < y0 + 0.008) & (np.abs(P[:, 0]) < 0.06)
        if m.sum() >= 4:
            Q = P[m]; line.append((y0 + 0.004, (Q[:, 2].min() + Q[:, 2].max()) / 2, Q[:, 2].min(), Q[:, 2].max()))
    line = np.array(line)
    tip_v = P[np.argmax(P[:, 1])]
    hind_root_y = max(LM['legs'][n]['hip'][1] for n in LM['legs'] if n.endswith('Leg3'))
    waist_y = hind_root_y + 0.005
    zc = np.interp(waist_y, line[:, 0], line[:, 1])
    waist = np.array([0.0, waist_y, zc])
    # abdomen centre line: section centres from the waist to the tip, then 3 equal arc-length parts
    seg = [waist] + [np.array([0.0, y, z]) for y, z, _, _ in line if y > waist_y + 0.01 and y < tip_v[1] - 0.01] + [np.array([0.0, tip_v[1], tip_v[2]])]
    seg = np.array(seg)
    dl = np.linalg.norm(np.diff(seg, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(dl)])

    def at(f):
        t = f * cum[-1]; k = min(np.searchsorted(cum, t) - 1, len(dl) - 1); k = max(k, 0)
        a = (t - cum[k]) / max(dl[k], 1e-9)
        return seg[k] + a * (seg[k + 1] - seg[k])
    LM['abdomen'] = [waist, at(1 / 3), at(2 / 3), seg[-1]]
    LM['body_line'] = line
    # head: separate island; neck pivot near its back end (inside the fluff collar), tail at the snout
    H = M.CO[M.isl[M.ids('head')[0]]]
    hc = H.mean(0); front = H[np.argmin(H[:, 1])]
    LM['head_centroid'] = hc
    LM['neck'] = np.array([0.0, H[:, 1].max() - 0.02, hc[2] - 0.005])
    LM['snout'] = np.array([0.0, front[1], front[2]])
    # thorax centre: between the wing pivots and the leg hips, on the mid-plane
    hips = np.array([LM['legs'][n]['hip'] for n in LM['legs']])
    pv = np.array([LM['wings'][s]['pivot'] for s in ('L', 'R')])
    LM['thorax'] = np.array([0.0, (hips[:, 1].mean() + pv[:, 1].mean()) / 2, (hips[:, 2].mean() + pv[:, 2].mean()) / 2])
    LM['height'] = float(M.CO[:, 2].max()); LM['span'] = float(M.CO[:, 0].max() - M.CO[:, 0].min())
    return LM


def _v(p):
    return Vector([float(x) for x in p])


def bones_A(LM):
    B = []

    def add(name, parent, head, tail, zaxis=(0, 0, 1), deform=True, group='body'):
        B.append(dict(name=name, parent=parent, head=_v(head), tail=_v(tail), zaxis=_v(zaxis), deform=deform, group=group))
    th = LM['thorax']
    add('root', None, (0, 0, 0), (0, 0, 0.04), (0, -1, 0), False, 'core')
    add('cog', 'root', th, th + np.array([0, 0, 0.03]), (0, -1, 0), False, 'core')
    add('thorax', 'cog', th, LM['neck'], (0, 0, 1), True, 'body')
    add('head', 'thorax', LM['neck'], LM['snout'], (0, 0, 1), True, 'head')
    ab = LM['abdomen']
    for k in range(3):
        add(f'abdomen_0{k + 1}', 'thorax' if k == 0 else f'abdomen_0{k}', ab[k], ab[k + 1], (0, 0, 1), True, 'abdomen')
    for side in ('L', 'R'):
        A = LM['antennae'][side]
        mid = A['mid']
        add(f'{side}_antenna_01', 'head', A['exit'], mid, A['normal'], True, 'antenna')
        add(f'{side}_antenna_02', f'{side}_antenna_01', mid, A['tip'], A['normal'], True, 'antenna')
        W = LM['wings'][side]
        for kind in ('F', 'B'):
            D = W[kind]
            add(f'{side}_Wing{kind}_01', 'thorax', W['pivot'], D['mid'], D['normal'], True, 'wing' + kind)
            add(f'{side}_Wing{kind}_02', f'{side}_Wing{kind}_01', D['mid'], D['outer'], D['normal'], True, 'wing' + kind)
        for n in (1, 2, 3):
            G = LM['legs'][f'{side}_Leg{n}']
            # local X = bend axis = normal of the hip-knee-ankle plane (same for the three bones), Z = X x Y
            nb = np.cross(G['knee'] - G['hip'], G['ankle'] - G['knee']); nb = nb / np.linalg.norm(nb)
            chain = ((G['hip'], G['knee']), (G['knee'], G['ankle']), (G['ankle'], G['tip']))
            for k, (h, t) in enumerate(chain):
                y = (t - h) / np.linalg.norm(t - h)
                add(f'{side}_Leg{n}_0{k + 1}', 'thorax' if k == 0 else f'{side}_Leg{n}_0{k}', h, t, np.cross(nb, y), True, f'leg{n}')
    # sockets (no weights)
    hc = LM['head_centroid']; sn = LM['snout']
    add('ground', 'root', (0, 0, 0), (0, 0, 0.02), (0, -1, 0), False, 'socket')
    add('hit_origin', 'thorax', sn + np.array([0, -0.02, 0]), sn + np.array([0, -0.05, 0]), (0, 0, 1), False, 'socket')
    add('fx_thorax', 'thorax', th, th + np.array([0, -0.03, 0]), (0, 0, 1), False, 'socket')
    add('fx_head', 'head', hc, hc + np.array([0, -0.03, 0]), (0, 0, 1), False, 'socket')
    for side in ('L', 'R'):
        W = LM['wings'][side]; sp = W['spot_F'] if W['spot_F'] is not None else W['F']['outer']
        add(f'fx_wing_{side}', f'{side}_WingF_02', sp, sp + 0.03 * W['F']['normal'], W['F']['u'], False, 'socket')
    return B


# variant B (swarm): the same bones and rest minus these; weights of a dropped bone go to the bone on the right
B_COLLAPSE = {'abdomen_03': 'abdomen_02'}
for _s in ('L', 'R'):
    B_COLLAPSE[f'{_s}_antenna_02'] = f'{_s}_antenna_01'
    for _n in (1, 2, 3):
        B_COLLAPSE[f'{_s}_Leg{_n}_02'] = f'{_s}_Leg{_n}_01'
        B_COLLAPSE[f'{_s}_Leg{_n}_03'] = f'{_s}_Leg{_n}_01'
B_DROP_SOCKETS = ['hit_origin', 'fx_head', 'fx_wing_L', 'fx_wing_R']


def bones_B(A):
    drop = set(B_COLLAPSE) | set(B_DROP_SOCKETS)
    return [dict(b) for b in A if b['name'] not in drop]


def build_armature(bones, name='P03_hush_moths_rig', collection=None):
    arm = bpy.data.armatures.new(name)
    ob = bpy.data.objects.new(name, arm)
    (collection or bpy.context.scene.collection).objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.edit_bones
    for b in bones:
        e = eb.new(b['name']); e.head = b['head']; e.tail = b['tail']
        y = (b['tail'] - b['head']).normalized(); z = b['zaxis'] - y * b['zaxis'].dot(y)
        if z.length < 1e-4:
            z = Vector((0, 0, 1)) - y * y.z
        e.align_roll(z.normalized())
        e.use_deform = b['deform']
    for b in bones:
        if b['parent']:
            eb[b['name']].parent = eb[b['parent']]
            eb[b['name']].use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    for b in bones:
        ob.data.bones[b['name']]['group'] = b['group']
    return ob


def lm_json(LM):
    """JSON-safe copy of the landmarks (vertex index arrays dropped)."""
    def conv(x):
        if isinstance(x, np.ndarray):
            return [round(float(v), 4) for v in x.ravel()] if x.ndim == 1 else [conv(r) for r in x]
        if isinstance(x, dict):
            return {k: conv(v) for k, v in x.items() if k not in ('idx',)}
        if isinstance(x, (list, tuple)):
            return [conv(v) for v in x]
        if isinstance(x, (np.floating, float)):
            return round(float(x), 4)
        if isinstance(x, (np.bool_,)):
            return bool(x)
        if isinstance(x, (np.integer,)):
            return int(x)
        return x
    return conv(LM)


def ctl_bones(A, LM):
    """Control rig (never exported): a ctl_ twin of every runtime bone except sockets, plus the wing masters, the symmetric
    flap, the abdomen curl, leg IK targets and poles. Returns (bones, extra info for constraints)."""
    out = []
    by = {b['name']: b for b in A}

    def add(name, parent, head, tail, zaxis, group):
        out.append(dict(name=name, parent=parent, head=_v(head), tail=_v(tail), zaxis=_v(zaxis), deform=False, group=group))
    for b in A:
        if b['group'] == 'socket':
            continue
        par = ('ctl_' + b['parent']) if b['parent'] else None
        out.append(dict(name='ctl_' + b['name'], parent=par, head=b['head'].copy(), tail=b['tail'].copy(), zaxis=b['zaxis'].copy(),
                        deform=False, group=b['group']))
    ob = {c['name']: c for c in out}
    for side, sx in (('L', 1.0), ('R', -1.0)):
        pv = LM['wings'][side]['pivot']
        add(f'ctl_{side}_Wing', 'ctl_thorax', pv, pv + np.array([0.07 * sx, 0, 0]), (0, 0, 1), 'wing_master')
        ob[f'ctl_{side}_WingF_01']['parent'] = f'ctl_{side}_Wing'
        ob[f'ctl_{side}_WingB_01']['parent'] = f'ctl_{side}_Wing'
    pvc = (LM['wings']['L']['pivot'] + LM['wings']['R']['pivot']) / 2
    add('ctl_wings', 'ctl_thorax', pvc + np.array([0, 0, 0.12]), pvc + np.array([0, 0, 0.18]), (0, 1, 0), 'wing_master')
    w = LM['abdomen'][0]
    add('ctl_abdomen_curl', 'ctl_thorax', w + np.array([0, 0, 0.16]), w + np.array([0, 0.06, 0.16]), (0, 0, 1), 'abdomen')
    poles = {}
    for side in ('L', 'R'):
        for n in (1, 2, 3):
            G = LM['legs'][f'{side}_Leg{n}']; b3 = by[f'{side}_Leg{n}_03']
            add(f'ctl_{side}_Leg{n}_IK', 'ctl_root', b3['head'], b3['tail'], b3['zaxis'], 'leg_ik')
            hip, knee, ankle = G['hip'], G['knee'], G['ankle']
            u = (ankle - hip) / np.linalg.norm(ankle - hip)
            bd = (knee - hip) - u * ((knee - hip) @ u); bd = bd / np.linalg.norm(bd)
            p = knee + bd * 0.10
            add(f'ctl_{side}_Leg{n}_pole', 'ctl_cog', p, p + bd * 0.02, (0, 0, 1), 'leg_ik')
            poles[f'{side}_Leg{n}'] = p
    return out, poles

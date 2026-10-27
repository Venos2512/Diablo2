"""Limb joints of W07 from vertex-ring clusters (py -3.11 -I w07_joints.py).

The legs are low-poly faceted bars: vertices sit in rings at bar ends / joint collars, the long faces between
them carry none. Vertices of a limb are ordered by geodesic distance from its tip and cut into clusters at
gaps > 2.5 cm; joint collars are the big clusters (>= 30 vertices; facet rings along a bar have <= 12), taken
in order from the tip; the proximal end is the last cluster. The knee collar merges the femur's distal ring
and the tibia's proximal ring, so the knee is refined as the meeting point of the two bar axes.
Both sides measured; the rig uses the mirror average. Overlays: rig/_work/jt_<limb>.png, sheet jt_sheet.png.
Writes rig/_work/joints.json.
"""
import os, sys, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from w07_meshdata import cw, ROLE, WORK, verts, dijkstra, tip_vertex, mirror

LIMBS = {'Leg1': ['tip', 'ring', 'knee', 'coxa', 'root'], 'Leg2': ['tip', 'ring', 'knee', 'root'],
         'Leg3': ['tip', 'ring', 'knee', 'coxa', 'root'], 'Leg4': ['tip', 'ring', 'knee', 'coxa', 'root'],
         'orphan': ['tip', 'mid', 'root'], 'palp': ['tip', 'claw', 'top', 'base']}
BIG = 30


def clusters(vs, tip, gap):
    d = dijkstra([tip], set(int(i) for i in vs))
    items = sorted(d.items(), key=lambda kv: kv[1])
    groups = [[items[0]]]
    for it in items[1:]:
        if it[1] - groups[-1][-1][1] > gap:
            groups.append([it])
        else:
            groups[-1].append(it)
    out = []
    for g in groups:
        idx = np.array([i for i, _ in g]); P = cw[idx]; c = P.mean(axis=0)
        out.append(dict(c=c, n=len(g), d0=g[0][1], d1=g[-1][1], idx=idx,
                        r=float(np.mean(np.linalg.norm(P - c, axis=1)))))
    return out, d


def meet(c1, d1, c2, d2):
    w0 = c1 - c2; a = d1 @ d1; b = d1 @ d2; c = d2 @ d2; d = d1 @ w0; e = d2 @ w0
    den = a * c - b * b
    if den < 1e-9:
        return None, 1e9
    s_ = (b * e - c * d) / den; t = (a * e - b * d) / den
    p1 = c1 + s_ * d1; p2 = c2 + t * d2
    return (p1 + p2) / 2, float(np.linalg.norm(p1 - p2))


def refine_knee(C, i_ring, i_knee, i_next, dmap):
    """Split the knee collar at its median geodesic distance: tibia axis = ring centre -> tibia-side centroid,
    femur axis = next joint -> femur-side centroid; knee = closest-approach midpoint of the two axes."""
    K = C[i_knee]; dd = np.array([dmap[int(i)] for i in K['idx']]); med = np.median(dd)
    lo = cw[K['idx'][dd <= med]].mean(axis=0); hi = cw[K['idx'][dd > med]].mean(axis=0)
    a0 = C[i_ring]['c']; f0 = C[i_next]['c']
    p, gap = meet(a0, (lo - a0) / np.linalg.norm(lo - a0), f0, (hi - f0) / np.linalg.norm(hi - f0))
    return (p if p is not None and gap < 0.06 else K['c']), gap


def side(S, sg):
    R = ROLE[S]; parts = {}
    F = verts(R['fused12'])
    t1 = tip_vertex(F, lambda p: p[1]); t2 = tip_vertex(F, lambda p: -sg * p[0] + 3 * p[2])
    d1 = dijkstra([t1], set(F.tolist())); d2 = dijkstra([t2], set(F.tolist()))
    parts['Leg1'] = (np.array([i for i in F if d1[i] <= d2[i]]), t1)
    parts['Leg2'] = (np.array([i for i in F if d1[i] > d2[i]]), t2)
    for name, key in (('Leg3', 'leg3'), ('Leg4', 'leg4')):
        V = verts(R[key]); parts[name] = (V, tip_vertex(V, lambda p: 3 * p[2] - sg * p[0]))
    V = verts(R['orphan']); parts['orphan'] = (V, tip_vertex(V, lambda p: p[2]))
    V = verts(R['palp']); parts['palp'] = (V, tip_vertex(V, lambda p: p[2] + 0.5 * p[1]))
    out = {}
    for name, (V, tip) in parts.items():
        C, dmap = clusters(V, tip, gap=0.025 if name != 'palp' else 0.012)
        N = np.array([c['c'] for c in C]); n = [c['n'] for c in C]
        names = LIMBS[name]
        big = [i for i in range(1, len(C)) if n[i] >= (20 if name == 'palp' else BIG)]
        if not big or big[-1] != len(C) - 1:
            big.append(len(C) - 1)
        idx = [0] + big
        ok = len(idx) == len(names)
        if not ok:
            print(f'  ! {S} {name}: {len(idx)} joints from clusters {n}, expected {len(names)}')
            idx = (idx + [len(C) - 1] * len(names))[:len(names)]
        J = {nm: N[i] for nm, i in zip(names, idx)}
        J['tip'] = cw[tip]
        notes = dict(ok=ok)
        if name.startswith('Leg') and ok:
            ik = names.index('knee'); ir = names.index('ring')
            p, g = refine_knee(C, idx[ir], idx[ik], idx[ik + 1], dmap)
            notes['knee_cluster'] = N[idx[ik]]; notes['knee_gap'] = g; J['knee'] = p
        out[name] = dict(joints=J, order=names, nodes=N, n=n, idx=idx, notes=notes)
    return out


def jsf(x):
    if isinstance(x, dict):
        return {str(k): jsf(v) for k, v in x.items()}
    if isinstance(x, (list, tuple)):
        return [jsf(v) for v in x]
    if isinstance(x, np.ndarray):
        return np.round(x.astype(float), 4).tolist()
    if isinstance(x, (np.floating, float)):
        return round(float(x), 4)
    if isinstance(x, (np.integer, np.bool_)):
        return int(x)
    return x


L = side('L', 1); R = side('R', -1)
res = {}
for name in LIMBS:
    names = L[name]['order']
    a = np.array([L[name]['joints'][n] for n in names]); b = mirror(np.array([R[name]['joints'][n] for n in names]))
    sym = (a + b) / 2
    res[name] = jsf(dict(order=names, L=a, R=mirror(b), sym=sym, asym=np.linalg.norm(a - b, axis=1),
                         seg=[float(np.linalg.norm(sym[i + 1] - sym[i])) for i in range(len(sym) - 1)],
                         nodes_L=L[name]['nodes'], n_L=L[name]['n'], idx_L=L[name]['idx'], n_R=R[name]['n'], idx_R=R[name]['idx'],
                         notes_L=L[name]['notes'], notes_R=R[name]['notes']))
    print(f"{name:6s} {names}\n   sym {np.round(sym, 3).tolist()}\n   seg {res[name]['seg']}  asym {res[name]['asym']}"
          f"\n   L n {L[name]['n']} idx {jsf(L[name]['idx'])} | R n {R[name]['n']} idx {jsf(R[name]['idx'])}  notes {jsf(L[name]['notes'])}")
with open(os.path.join(WORK, 'joints.json'), 'w') as f:
    json.dump(res, f, indent=1)

# ---------------------------------------------------------------- overlays (+X side renders)
FR = json.load(open(os.path.join(WORK, 'lv_frames.json')))


def font(sz):
    for fn in ('arialbd.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(fn, sz)
        except OSError:
            pass
    return ImageFont.load_default()


cells = []
for name in LIMBS:
    fr = FR[name]; c = np.array(fr['center']); r = np.array(fr['right']); u = np.array(fr['up']); s = fr['ortho']; res_ = fr['res']
    im = Image.open(os.path.join(WORK, f'lv_{name}_tex.png')).convert('RGBA')
    im = Image.alpha_composite(Image.new('RGBA', im.size, (58, 58, 62, 255)), im); dr = ImageDraw.Draw(im)

    def px(p):
        q = np.array(p) - c
        return (res_ / 2 + float(q @ r) / s * res_, res_ / 2 - float(q @ u) / s * res_)
    for p, n in zip(L[name]['nodes'], L[name]['n']):
        x, y = px(p); rr = 3 + min(n, 40) / 6
        dr.ellipse([x - rr, y - rr, x + rr, y + rr], fill=(120, 200, 255, 200))
    names = LIMBS[name]; Jl = [L[name]['joints'][n] for n in names]
    dr.line([px(p) for p in Jl], fill=(255, 210, 60, 255), width=3)
    for p, n in zip(Jl, names):
        x, y = px(p); dr.ellipse([x - 9, y - 9, x + 9, y + 9], outline=(255, 60, 60, 255), width=3)
        dr.text((x + 11, y - 24), n, fill=(255, 255, 255, 255), font=font(20))
    for p in res[name]['sym']:
        x, y = px(p); dr.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(80, 255, 120, 255))
    dr.text((10, 10), f"{name}: blue = ring clusters (size ~ verts), yellow = joints L, green = mirror average", fill=(255, 225, 120, 255), font=font(18))
    p_ = os.path.join(WORK, f'jt_{name}.png'); im.convert('RGB').save(p_); cells.append(p_)
cols = 3; cell = 700
Sh = Image.new('RGB', (cols * cell, 2 * cell), (30, 30, 33))
for i, p in enumerate(cells):
    im = Image.open(p); im.thumbnail((cell, cell)); Sh.paste(im, ((i % cols) * cell, (i // cols) * cell))
Sh.save(os.path.join(WORK, 'jt_sheet.png')); print('SHEET jt_sheet.png')

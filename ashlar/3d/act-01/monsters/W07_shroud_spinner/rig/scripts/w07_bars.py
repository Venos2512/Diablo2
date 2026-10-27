"""Bar segmentation for W07 limbs (py -3.11 -I w07_bars.py [nseg_leg]).

Vertices of a limb are ordered by geodesic distance from its tip and grouped in 1.5 cm bands. A dynamic
programme splits the band sequence into k runs minimising the total squared distance of the vertices to
each run's own best-fit LINE (PCA residual, O(1) per run from cumulative moments). Joints = closest-approach
midpoint of consecutive bar axes (gap midpoint when nearly collinear). Overlays the result on the per-limb
renders of w07_r1_legviews.py (rig/_work/lv_*_tex.png + lv_frames.json) -> rig/_work/bars_<limb>.png, and
writes rig/_work/bars.json.
"""
import os, sys, json, heapq, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(os.path.dirname(HERE), '_work')
D = np.load(os.path.join(WORK, 'w07_mesh.npz'))
co, tris, rep, isl = D['co'], D['tris'], D['rep'], D['island']
W = np.unique(rep)
wid = -np.ones(len(co), dtype=np.int64); wid[W] = np.arange(len(W))
cw = co[W]; iw = isl[W]
nb = [dict() for _ in range(len(W))]
for t in tris:
    a, b, c = wid[rep[t[0]]], wid[rep[t[1]]], wid[rep[t[2]]]
    for u, v in ((a, b), (b, c), (c, a)):
        if u != v:
            d = float(np.linalg.norm(cw[u] - cw[v])); nb[u][v] = d; nb[v][u] = d
ROLE = {'L': dict(fused12=3, leg3=7, leg4=4, orphan=12, palp=10, fang=15),
        'R': dict(fused12=2, leg3=6, leg4=5, orphan=13, palp=11, fang=14)}


def verts(k):
    return np.nonzero(iw == k)[0]


def dijkstra(srcs, allowed):
    dist = {}; pq = []
    for s in srcs:
        dist[s] = 0.0; pq.append((0.0, s))
    heapq.heapify(pq)
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in nb[u].items():
            if v in allowed:
                nd = d + w
                if nd < dist.get(v, 1e18):
                    dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist


def bands_of(vs, tip, step):
    d = dijkstra([int(tip)], set(int(i) for i in vs))
    L = max(d.values()); n = max(3, int(math.ceil(L / step)))
    acc = [[] for _ in range(n)]
    for i, x in d.items():
        acc[min(n - 1, int(x / L * n))].append(i)
    return [np.array(b) for b in acc if len(b) > 0], d


def line_fit(P):
    c = P.mean(axis=0); _, s, Vt = np.linalg.svd(P - c, full_matrices=False)
    return c, Vt[0]


def dp_lines(B, k, min_bands=3):
    """B: list of index arrays (bands, tip first). Returns list of (start, end) band runs (inclusive)."""
    n = len(B)
    N = np.zeros(n + 1); S1 = np.zeros((n + 1, 3)); S2 = np.zeros((n + 1, 3, 3))
    for i, b in enumerate(B):
        P = cw[b]; N[i + 1] = N[i] + len(P); S1[i + 1] = S1[i] + P.sum(0); S2[i + 1] = S2[i] + P.T @ P

    def cost(i, j):            # bands i..j inclusive
        m = N[j + 1] - N[i]
        if m < 4:
            return 1e9
        mu = (S1[j + 1] - S1[i]) / m; C = (S2[j + 1] - S2[i]) / m - np.outer(mu, mu)
        w = np.linalg.eigvalsh(C)
        return float(m * (w[0] + w[1]))       # squared distance to the best line
    INF = 1e18
    best = np.full((k + 1, n + 1), INF); arg = np.zeros((k + 1, n + 1), dtype=int); best[0][0] = 0
    Cm = {}
    for m_ in range(1, k + 1):
        for j in range(1, n + 1):              # first j bands covered
            for i in range(0, j - min_bands + 1):
                if best[m_ - 1][i] >= INF:
                    continue
                key = (i, j - 1)
                if key not in Cm:
                    Cm[key] = cost(i, j - 1)
                v = best[m_ - 1][i] + Cm[key]
                if v < best[m_][j]:
                    best[m_][j] = v; arg[m_][j] = i
    runs = []; j = n
    for m_ in range(k, 0, -1):
        i = arg[m_][j]; runs.append((i, j - 1)); j = i
    return runs[::-1], float(best[k][n])


def meet(c1, d1, c2, d2):
    w0 = c1 - c2; a = d1 @ d1; b = d1 @ d2; c = d2 @ d2; d = d1 @ w0; e = d2 @ w0
    den = a * c - b * b
    if den < 1e-9:
        return None, 1e9
    s = (b * e - c * d) / den; t = (a * e - b * d) / den
    p1 = c1 + s * d1; p2 = c2 + t * d2
    return (p1 + p2) / 2, float(np.linalg.norm(p1 - p2))


def limb(vs, tip, k, step=0.015, trim=1, frac=1.0):
    B, dist = bands_of(vs, tip, step)
    B = B[:max(k * 3 + 1, int(round(len(B) * frac)))]        # distal part only (frac < 1: skip coxa / shared knob)
    runs, tot = dp_lines(B, k)
    bars = []
    for (i, j) in runs:                       # fit each bar without its boundary bands (mixed at bends)
        ii, jj = i + trim, j - trim
        if jj - ii < 2:
            ii, jj = i, j
        P = cw[np.concatenate(B[ii:jj + 1])]
        c, d = line_fit(P)
        allP = cw[np.concatenate(B[i:j + 1])]
        s = (allP - c) @ d
        bars.append(dict(c=c, d=d, s0=float(s.min()), s1=float(s.max()), runs=(i, j), n=len(allP),
                         rms=float(np.sqrt(np.mean(np.sum((allP - c - np.outer(s, d)) ** 2, 1))))))
    # orient each bar tip -> root (band order) and compute joints tip-first
    J = []
    tipP = cw[int(tip)]
    b0 = bars[0]
    if (tipP - b0['c']) @ b0['d'] > 0:
        pass
    joints = [None] * (k + 1)
    # tip joint: projection of the tip vertex on bar 0
    joints[0] = b0['c'] + b0['d'] * float((tipP - b0['c']) @ b0['d'])
    info = []
    for m in range(1, k):
        A, Bb = bars[m - 1], bars[m]
        ang = math.degrees(math.acos(min(1.0, abs(float(A['d'] @ Bb['d'])))))
        p, gap = meet(A['c'], A['d'], Bb['c'], Bb['d']) if ang >= 8 else (None, 1e9)
        if p is None or gap > 0.05:
            # nearly collinear: boundary band centroid
            p = cw[B[Bb['runs'][0]]].mean(axis=0); how = 'band'
        else:
            how = 'meet'
        joints[m] = p; info.append(dict(angle=round(ang, 1), gap=round(gap, 4) if gap < 1e8 else None, how=how))
    # root joint: far end of the last bar (max geodesic) projected on its axis
    bl = bars[-1]; farP = cw[B[bl['runs'][1]]].mean(axis=0)
    joints[k] = bl['c'] + bl['d'] * float((farP - bl['c']) @ bl['d'])
    return dict(joints=np.array(joints[::-1]), bars=bars[::-1], info=info[::-1], cost=tot, nb=len(B))


def leg2(vs, tip, step=0.015, frac=1.0, trim=1):
    """Two-stage: k=3 on the distal part finds the knee (femur | tibia); k=2 on tip..tibia finds the ring."""
    B, dist = bands_of(vs, tip, step)
    B = B[:max(10, int(round(len(B) * frac)))]
    runs3, _ = dp_lines(B, 3)
    kb = runs3[1][1]                                   # last band of the tibia run (tip-first order)
    runs2, _ = dp_lines(B[:kb + 1], 2)
    runs = [runs2[0], runs2[1], runs3[2]]              # tip bar, tibia, femur
    bars = []
    for (i, j) in runs:
        ii, jj = i + trim, j - trim
        if jj - ii < 2:
            ii, jj = i, j
        c, d = line_fit(cw[np.concatenate(B[ii:jj + 1])])
        allP = cw[np.concatenate(B[i:j + 1])]; sp = (allP - c) @ d
        bars.append(dict(c=c, d=d, s0=float(sp.min()), s1=float(sp.max()), runs=(i, j), n=len(allP),
                         rms=float(np.sqrt(np.mean(np.sum((allP - c - np.outer(sp, d)) ** 2, 1))))))
    tipP = cw[int(tip)]; b0 = bars[0]
    joints = [b0['c'] + b0['d'] * float((tipP - b0['c']) @ b0['d'])]
    info = []
    for m in (1, 2):
        A, Bb = bars[m - 1], bars[m]
        ang = math.degrees(math.acos(min(1.0, abs(float(A['d'] @ Bb['d'])))))
        p, gap = meet(A['c'], A['d'], Bb['c'], Bb['d']) if ang >= 8 else (None, 1e9)
        if p is None or gap > 0.05:
            p = cw[B[Bb['runs'][0]]].mean(axis=0); how = 'band'
        else:
            how = 'meet'
        joints.append(p); info.append(dict(angle=round(ang, 1), gap=round(gap, 4) if gap < 1e8 else None, how=how))
    bl = bars[-1]; farP = cw[B[bl['runs'][1]]].mean(axis=0)
    joints.append(bl['c'] + bl['d'] * float((farP - bl['c']) @ bl['d']))
    # band radius profile tip -> knee (neck = local minimum near the ring)
    prof = []
    for b in B[:kb + 1]:
        P = cw[b]; cc = P.mean(axis=0); prof.append(round(float(np.mean(np.linalg.norm(P - cc, axis=1))), 4))
    return dict(joints=np.array(joints[::-1]), bars=bars[::-1], info=info[::-1], nb=len(B), radius_tip_to_knee=prof,
                ring_band=runs2[1][0], knee_band=runs3[2][0])


def tip_vertex(vs, score):
    return int(vs[np.argmin([score(cw[i]) for i in vs])])


def run_side(S, sg, kleg):
    R = ROLE[S]; out = {}
    F = verts(R['fused12'])
    t1 = tip_vertex(F, lambda p: p[1]); t2 = tip_vertex(F, lambda p: -sg * p[0] + 3 * p[2])
    d1 = dijkstra([t1], set(F.tolist())); d2 = dijkstra([t2], set(F.tolist()))
    A = np.array([i for i in F if d1[i] <= d2[i]]); Bv = np.array([i for i in F if d1[i] > d2[i]])
    out['Leg1'] = leg2(A, t1, frac=FRAC['Leg1']); out['Leg2'] = leg2(Bv, t2, frac=FRAC['Leg2'])
    out['Leg1']['split_n'] = len(A); out['Leg2']['split_n'] = len(Bv)
    for name, key in (('Leg3', 'leg3'), ('Leg4', 'leg4')):
        V = verts(R[key]); tip = tip_vertex(V, lambda p: 3 * p[2] - sg * p[0])
        out[name] = leg2(V, tip, frac=FRAC[name])
    V = verts(R['orphan']); out['orphan'] = limb(V, tip_vertex(V, lambda p: p[2]), 2)
    V = verts(R['palp']); out['palp'] = limb(V, tip_vertex(V, lambda p: p[2] + 0.5 * p[1]), 3, step=0.01)
    return out


kleg = int(sys.argv[1]) if len(sys.argv) > 1 else 3
FRAC = dict(Leg1=float(sys.argv[2]) if len(sys.argv) > 2 else 0.75, Leg2=1.0,
            Leg3=float(sys.argv[3]) if len(sys.argv) > 3 else 0.85, Leg4=float(sys.argv[3]) if len(sys.argv) > 3 else 0.85)
RES = {'L': run_side('L', 1, kleg), 'R': run_side('R', -1, kleg)}


def mirror(P):
    P = np.array(P, dtype=float).copy(); P[..., 0] *= -1; return P


summary = {}
for name in ('Leg1', 'Leg2', 'Leg3', 'Leg4', 'orphan', 'palp'):
    a = RES['L'][name]['joints']; b = mirror(RES['R'][name]['joints'])
    sym = (a + b) / 2; asym = np.linalg.norm(a - b, axis=1)
    seg = [round(float(np.linalg.norm(sym[i + 1] - sym[i])), 3) for i in range(len(sym) - 1)]
    summary[name] = dict(L=np.round(a, 4).tolist(), R=np.round(RES['R'][name]['joints'], 4).tolist(), sym=np.round(sym, 4).tolist(),
                         asym=np.round(asym, 4).tolist(), seg=seg,
                         info_L=RES['L'][name]['info'], info_R=RES['R'][name]['info'],
                         rms_L=[round(b['rms'], 4) for b in RES['L'][name]['bars']], rms_R=[round(b['rms'], 4) for b in RES['R'][name]['bars']])
    print(f"{name:6s} k={len(sym) - 1} sym {np.round(sym, 3).tolist()}\n       seg {seg} asym {np.round(asym, 3).tolist()}\n"
          f"       L {RES['L'][name]['info']} rms {summary[name]['rms_L']}\n       R {RES['R'][name]['info']} rms {summary[name]['rms_R']}")
with open(os.path.join(WORK, f'bars_k{kleg}.json'), 'w') as f:
    json.dump(summary, f, indent=1)

# ---------------------------------------------------------------- overlays on the per-limb renders (+X side)
FR = json.load(open(os.path.join(WORK, 'lv_frames.json')))


def font(sz):
    for fn in ('arialbd.ttf', 'arial.ttf'):
        try:
            return ImageFont.truetype(fn, sz)
        except OSError:
            pass
    return ImageFont.load_default()


cells = []
for name in ('Leg1', 'Leg2', 'Leg3', 'Leg4', 'orphan', 'palp'):
    fr = FR[name]; c = np.array(fr['center']); r = np.array(fr['right']); u = np.array(fr['up']); s = fr['ortho']; res = fr['res']
    im = Image.open(os.path.join(WORK, f'lv_{name}_tex.png')).convert('RGBA')
    bg = Image.new('RGBA', im.size, (58, 58, 62, 255)); im = Image.alpha_composite(bg, im); dr = ImageDraw.Draw(im)

    def px(p):
        q = np.array(p) - c
        return (res / 2 + (q @ r) / s * res, res / 2 - (q @ u) / s * res)
    J = RES['L'][name]['joints']
    for bar in RES['L'][name]['bars']:
        a = bar['c'] + bar['d'] * bar['s0']; b = bar['c'] + bar['d'] * bar['s1']
        dr.line([px(a), px(b)], fill=(90, 220, 255, 200), width=2)
    Js = summary[name]['sym']
    dr.line([px(p) for p in J], fill=(255, 210, 60, 255), width=4)
    for i, p in enumerate(J):
        x, y = px(p); dr.ellipse([x - 9, y - 9, x + 9, y + 9], outline=(255, 60, 60, 255), width=3)
        dr.text((x + 10, y - 22), str(i), fill=(255, 255, 255, 255), font=font(20))
    for p in Js:
        x, y = px(mirror(np.array([p]))[0] * np.array([-1, 1, 1])) if False else px(p)
        dr.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(80, 255, 120, 255))
    dr.text((10, 10), f"{name} k={len(J) - 1}: yellow = joints (L side), cyan = bar axes, green = mirror-average", fill=(255, 225, 120, 255), font=font(18))
    im.convert('RGB').save(os.path.join(WORK, f'bars_k{kleg}_{name}.png'))
    cells.append(os.path.join(WORK, f'bars_k{kleg}_{name}.png'))
cols = 3; cell = 640; rows = 2
Sh = Image.new('RGB', (cols * cell, rows * cell), (30, 30, 33))
for i, p in enumerate(cells):
    im = Image.open(p); im.thumbnail((cell, cell)); Sh.paste(im, ((i % cols) * cell, (i // cols) * cell))
Sh.save(os.path.join(WORK, f'bars_k{kleg}_sheet.png')); print('SHEET', f'bars_k{kleg}_sheet.png')

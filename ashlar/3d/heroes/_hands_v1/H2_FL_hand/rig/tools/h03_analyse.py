"""H2_FL_hand rig, S1 analysis (rigkit-env): islands, rigid-part candidates, slices along the hand, finger separation, edge density.

Frame (Blender): s = -y is the distance from the sleeve end along the forearm (0..0.45 m), +z back of the hand, x across.
Writes rig/analysis.json and rig/qa/s1_*.png. Usage: python -I -B h03_analyse.py <rig_dir>
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, r'E:/Diablo2/.agents/skills/blender-mcp-rigging/scripts')
from solvers import skin_common as sc  # noqa: E402

import matplotlib  # noqa: E402
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # noqa: E402
from PIL import Image  # noqa: E402

rig = sys.argv[1]
d = np.load(os.path.join(rig, '_work', 'mesh.npz'), allow_pickle=True)
meta = json.loads(str(d['meta']))
mesh = dict(V=d['V'], F=d['F'], weld=d['weld'], meta=meta)
topo = sc.weld_topo(mesh)
P = topo.P
s = -P[:, 1]
UV = topo.gather(d['UV'], how='first')
img = np.asarray(Image.open(os.path.join(rig, '_work', 'basecolor_512.png')).convert('RGB')) if os.path.exists(os.path.join(rig, '_work', 'basecolor_512.png')) else None
col = None
if img is not None:
    h, w = img.shape[:2]
    col = img[np.clip(((1 - UV[:, 1]) * (h - 1)).astype(int), 0, h - 1), np.clip((UV[:, 0] * (w - 1)).astype(int), 0, w - 1)] / 255.0

isl = []
for k in range(topo.n_islands):
    m = topo.island == k
    q = P[m]
    isl.append(dict(id=k, n=int(m.sum()), s=[float(-q[:, 1].max()), float(-q[:, 1].min())], x=[float(q[:, 0].min()), float(q[:, 0].max())],
                    z=[float(q[:, 2].min()), float(q[:, 2].max())]))
isl.sort(key=lambda r: -r['n'])

# open boundary / non-manifold
E = np.sort(np.concatenate([topo.F[:, [0, 1]], topo.F[:, [1, 2]], topo.F[:, [2, 0]]]), axis=1)
_, cnt = np.unique(E, axis=0, return_counts=True)
el = topo.edge_lengths()


def slice_loops(s0):
    """Connected components of the faces crossing the plane s = s0 (welded faces), with their x / z extents."""
    sf = s[topo.F]
    cross = (sf.min(1) <= s0) & (sf.max(1) > s0)
    fi = np.flatnonzero(cross)
    if fi.size == 0:
        return []
    # union faces sharing a vertex
    parent = {int(f): int(f) for f in fi}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    by_v = {}
    for f in fi:
        for v in topo.F[f]:
            by_v.setdefault(int(v), []).append(int(f))
    for fl in by_v.values():
        for f in fl[1:]:
            ra, rb = find(fl[0]), find(f)
            if ra != rb:
                parent[ra] = rb
    comps = {}
    for f in fi:
        comps.setdefault(find(int(f)), []).append(int(f))
    out = []
    for fl in comps.values():
        vv = np.unique(topo.F[fl])
        q = P[vv]
        out.append(dict(n_faces=len(fl), x=[float(q[:, 0].min()), float(q[:, 0].max())], z=[float(q[:, 2].min()), float(q[:, 2].max())],
                        cx=float(q[:, 0].mean()), cz=float(q[:, 2].mean()), isl=int(np.bincount(topo.island[vv]).argmax())))
    out.sort(key=lambda r: r['cx'])
    return out


slices = []
for s0 in np.arange(0.002, 0.45, 0.004):
    lo = slice_loops(s0)
    main = [r for r in lo if isl and r['isl'] == isl[0]['id']]
    slices.append(dict(s=round(float(s0), 4), n_loops=len(lo), n_main=len(main), loops=lo))

# edge density (median edge) per s bin
dens = []
mid = (s[topo.edges[:, 0]] + s[topo.edges[:, 1]]) / 2
for a in np.arange(0, 0.45, 0.02):
    m = (mid >= a) & (mid < a + 0.02)
    dens.append([round(float(a), 3), int(m.sum()), round(float(np.median(el[m]) * 1000), 2) if m.any() else None])

an = dict(n=topo.n, n_welded=topo.n_w, n_tris=len(topo.F), n_islands=topo.n_islands, islands=isl[:30],
          boundary_edges=int((cnt == 1).sum()), nonmanifold_edges=int((cnt > 2).sum()), edge_mm_median=float(np.median(el) * 1000),
          density_per_20mm=dens, slices=[dict(s=r['s'], n_loops=r['n_loops'], n_main=r['n_main'],
                                               loops=[dict(x=[round(v, 4) for v in l['x']], z=[round(v, 4) for v in l['z']], isl=l['isl'], nf=l['n_faces']) for l in r['loops']])
                                         for r in slices])
json.dump(an, open(os.path.join(rig, 'analysis.json'), 'w'), indent=1)

# pictures: top (x vs s) coloured by island and by texture; side (z vs s)
fig, ax = plt.subplots(3, 1, figsize=(14, 15))
cm = plt.get_cmap('tab20')
ic = np.array([cm(i % 20)[:3] for i in topo.island])
ax[0].scatter(s, P[:, 0], c=ic, s=2)
ax[0].set_title(f'top: s (from sleeve end, m) ->, x ^; colour = island ({topo.n_islands})')
ax[1].scatter(s, P[:, 0], c=col if col is not None else 'k', s=2)
ax[1].set_title('top, texture colour')
o = np.argsort(P[:, 0])
ax[2].scatter(s[o], P[o, 2], c=(col[o] if col is not None else 'k'), s=2)
ax[2].set_title('side: s ->, z ^ (back of hand up)')
for a in ax:
    a.set_aspect('equal')
    a.set_xticks(np.arange(0, 0.46, 0.02))
    a.grid(alpha=0.3)
    a.set_facecolor('#555')
plt.tight_layout()
plt.savefig(os.path.join(rig, 'qa', 's1_islands_views.png'), dpi=70)
print(json.dumps(dict(n=topo.n, n_w=topo.n_w, islands=topo.n_islands, top=[(r['n'], r['s'], r['x']) for r in isl[:14]],
                      boundary=an['boundary_edges'], nonmanifold=an['nonmanifold_edges'], edge_mm=an['edge_mm_median'],
                      loops=[(r['s'], r['n_loops'], r['n_main']) for r in slices if r['s'] > 0.25])))

"""H2_FL_hand rig, S6 candidate B: bone heat (Baran & Popovic 2007, the method behind Blender's automatic weights) solved here, because
Blender's own solver fails on every bone of this mesh, also on a voxel proxy (h08_apply.py heat: 0 rows weighted).

On the welded main island: (-L + M H) w_j = M H p_j for every bone j, with L the cotangent Laplacian, M the Voronoi mass matrix,
p_j(v) = 1 where j is the nearest bone, H_v = c / d(v)^2 (d = distance to that bone segment, c = 1). No visibility test; instead a
finger lobe only sees its own finger's bones and the wrist (the same gate as candidate A). forearm_twist is not a heat bone (it lies on the
forearm segment); the forearm region of B is therefore not a twist candidate (the selection keeps A there).
Rows outside the main island get 0 (the enforcement makes them rigid). Output rig/_work/weights_Bheat_raw.npz (per original vertex).
Usage (rigkit-env: needs igl): python -I -B h07b_heat.py <rig_dir>
"""
import json
import os
import sys

import igl
import numpy as np
import scipy.sparse as sp
from scipy.sparse.linalg import splu

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import h_common as hc  # noqa: E402

rig = sys.argv[1]
d, topo = hc.load_mesh(rig)
sk = json.load(open(os.path.join(rig, '_work', 'skeleton.json')))
lobe = np.load(os.path.join(rig, '_work', 'weights_A.npz'), allow_pickle=True)['lobe']
ALL = [n for n in sk['order'] if sk['bones'][n]['deform']]
HEAT = [n for n in ALL if n != 'forearm_twist']
FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky']
main = int(np.bincount(topo.island).argmax())
vm = np.flatnonzero(topo.island == main)
remap = -np.ones(topo.n_w, int)
remap[vm] = np.arange(len(vm))
Fm = topo.F[np.all(topo.island[topo.F] == main, axis=1)]
Fm = remap[Fm]
V = topo.P[vm]
Dist = np.zeros((len(vm), len(HEAT)))
for j, nme in enumerate(HEAT):
    a, b = np.array(sk['bones'][nme]['head']), np.array(sk['bones'][nme]['tail'])
    ab = b - a
    t = np.clip((V - a) @ ab / (ab @ ab), 0, 1)
    Dist[:, j] = np.linalg.norm(V - (a + t[:, None] * ab), axis=1)
# lobe gate
lb = lobe[vm]
for fi, f in enumerate(FINGERS):
    m = lb == fi
    bad = [j for j, nme in enumerate(HEAT) if not (nme.startswith(f + '_') or nme == 'wrist')]
    Dist[np.ix_(m, bad)] = np.inf
near = np.argmin(Dist, 1)
dmin = np.maximum(Dist[np.arange(len(vm)), near], 1e-4)
H = 1.0 / dmin ** 2
L = igl.cotmatrix(V, Fm)
M = igl.massmatrix(V, Fm, igl.MASSMATRIX_TYPE_VORONOI)
A = (-L + M @ sp.diags(H)).tocsc()
lu = splu(A)
W = np.zeros((len(vm), len(HEAT)))
for j in range(len(HEAT)):
    p = (near == j).astype(float)
    W[:, j] = lu.solve(M @ (H * p))
W = np.clip(W, 0, None)
W /= np.maximum(W.sum(1, keepdims=True), 1e-12)
Wf = np.zeros((topo.n_w, len(ALL)))
for j, nme in enumerate(HEAT):
    Wf[vm, ALL.index(nme)] = W[:, j]
Wv = topo.scatter(Wf)
np.savez(os.path.join(rig, '_work', 'weights_Bheat_raw.npz'), W=Wv, bones=np.array(ALL))
print('H07B ' + json.dumps(dict(rows=len(vm), faces=len(Fm), coverage={n: int((Wf[:, ALL.index(n)] > 0.01).sum()) for n in HEAT})))

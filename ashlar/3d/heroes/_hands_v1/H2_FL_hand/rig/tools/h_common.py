"""Shared helpers of the H2_FL_hand rig tools (python -I -B, system python 3.10 or rigkit-env: numpy + scipy only).

Frame: Blender, the lab hand frame turned Z-up: fingers -Y, back of the hand +Z, x across (thumb at +x), origin = sleeve-end axis point.
s = -y = distance along the forearm from the sleeve end (m).
"""
import json
import os
import sys

import numpy as np

SKILL = r'E:/Diablo2/.agents/skills/blender-mcp-rigging/scripts'
if SKILL not in sys.path:
    sys.path.insert(0, SKILL)
from solvers import skin_common as sc  # noqa: E402

FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky']
UP = np.array([0.0, 0.0, 1.0])  # back of the hand


def load_mesh(rig):
    d = np.load(os.path.join(rig, '_work', 'mesh.npz'), allow_pickle=True)
    meta = json.loads(str(d['meta']))
    mesh = dict(V=d['V'], F=d['F'], weld=d['weld'], meta=meta)
    topo = sc.weld_topo(mesh)
    return d, topo


def unit(v):
    v = np.asarray(v, dtype=float)
    return v / max(np.linalg.norm(v), 1e-30)


def face_components(F, faces):
    """Connected components (sharing a vertex) of the given face ids."""
    faces = np.asarray(faces)
    if faces.size == 0:
        return []
    parent = np.arange(len(faces))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    first = {}
    for k, f in enumerate(faces):
        for v in F[f]:
            v = int(v)
            if v in first:
                ra, rb = find(first[v]), find(k)
                if ra != rb:
                    parent[ra] = rb
            else:
                first[v] = k
    comp = {}
    for k in range(len(faces)):
        comp.setdefault(find(k), []).append(int(faces[k]))
    return list(comp.values())


def plane_slice(P, F, c, n, face_mask=None):
    """Cut of the welded surface with the plane (c, n): list of pieces {faces, seg (k,2,3), centroid, perimeter}."""
    d = (P - c) @ n
    df = d[F]
    cross = (df.min(1) <= 0) & (df.max(1) > 0)
    if face_mask is not None:
        cross &= face_mask
    out = []
    for comp in face_components(F, np.flatnonzero(cross)):
        segs = []
        for f in comp:
            pts = []
            for i, j in ((0, 1), (1, 2), (2, 0)):
                a, b = F[f, i], F[f, j]
                if (d[a] > 0) != (d[b] > 0):
                    t = d[a] / (d[a] - d[b])
                    pts.append(P[a] + t * (P[b] - P[a]))
            if len(pts) == 2:
                segs.append(pts)
        if not segs:
            continue
        segs = np.array(segs)
        ln = np.linalg.norm(segs[:, 1] - segs[:, 0], axis=1)
        mid = segs.mean(1)
        cen = (mid * ln[:, None]).sum(0) / max(ln.sum(), 1e-30)
        out.append(dict(faces=comp, seg=segs, centroid=cen, perimeter=float(ln.sum())))
    return out


def save_json(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)

"""H2_FL_hand rig, step S1/S2 (rigkit-env): the LAB FRAME transform and the mesh dump.

Replicates steps 1-4 of lookdev-lab/scripts/prepare-choice-hands.py for the FL entry (turn, level on the forearm axis, roll back of hand
to +y, scale to 0.45 m, pivot at the sleeve-end axis point) and returns ONE 4x4 matrix M (glTF space of the source node -> hand frame,
glTF axes: +z fingers, +y back of hand, x across). Verified against the lab's own output assets/choice-hands/choice-hand-fl.glb.

Writes rig/_work/frame.json {M (row-major 4x4, glTF), M_blender (same in Blender Z-up axes), scale, report} and rig/_work/check_frame.json.

Usage: python -I -B h01_frame.py <rig_dir>
"""
import json
import os
import sys

import numpy as np
import trimesh

REPO = r'E:/Diablo2'
SRC = os.path.join(REPO, 'ashlar/3d/heroes/_hands_v1/H2_FL_hand/choice_hands_H2_FL_hand.glb')
LAB = os.path.join(REPO, 'lookdev-lab/assets/choice-hands/choice-hand-fl.glb')
LENGTH = 0.45
PALM_UP = True
FIT = (0.20, 0.40)


def rot_align(a, b):
    v, c = np.cross(a, b), float(np.dot(a, b))
    k = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + k + k @ k / (1 + c)


def rot_z(deg):
    t = np.radians(deg)
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def band_extent(v, lo, hi):
    q = v[(v[:, 2] >= lo) & (v[:, 2] <= hi)]
    return min(np.ptp(q[:, 0]), np.ptp(q[:, 1])) if len(q) else 0.0


def frame(v0):
    """Same arithmetic as prepare-choice-hands.prep (steps 1-4); returns 4x4 M with h = M @ [v0, 1]."""
    v = v0.copy()
    z0, z1 = v[:, 2].min(), v[:, 2].max()
    span = z1 - z0
    turned = band_extent(v, z1 - 0.06 * span, z1) > band_extent(v, z0, z0 + 0.06 * span)
    R = np.diag([-1.0, 1.0, -1.0]) if turned else np.eye(3)
    v = v @ R.T
    z0 = v[:, 2].min()
    pts = []
    for lo, hi in zip(np.linspace(FIT[0], FIT[1], 12)[:-1], np.linspace(FIT[0], FIT[1], 12)[1:]):
        q = v[(v[:, 2] >= z0 + lo * span) & (v[:, 2] < z0 + hi * span)]
        if len(q) > 8:
            pts.append([(q[:, 0].min() + q[:, 0].max()) / 2, (q[:, 1].min() + q[:, 1].max()) / 2, z0 + (lo + hi) / 2 * span])
    pts = np.array(pts)
    kx, ky = np.polyfit(pts[:, 2], pts[:, 0], 1), np.polyfit(pts[:, 2], pts[:, 1], 1)
    axis = np.array([kx[0], ky[0], 1.0])
    axis /= np.linalg.norm(axis)
    A = rot_align(axis, np.array([0.0, 0.0, 1.0]))
    c0 = A @ np.array([kx[1] + kx[0] * z0, ky[1] + ky[0] * z0, z0])
    v = v @ A.T
    zmin, zmax = v[:, 2].min(), v[:, 2].max()
    ln = zmax - zmin
    hand = v[(v[:, 2] >= zmin + 0.66 * ln) & (v[:, 2] <= zmin + 0.94 * ln)]
    w, vec = np.linalg.eigh(np.cov((hand - hand.mean(0)).T))
    n = vec[:, 0]
    side = A @ (R @ np.array([0.0, 1.0 if PALM_UP else -1.0, 0.0]))
    if np.dot(n, side) < 0:
        n = -n
    roll = -90.0 - np.degrees(np.arctan2(n[1], n[0]))
    Rz = rot_z(roll)
    v = v @ Rz.T
    c0 = Rz @ c0
    zmin, zmax = v[:, 2].min(), v[:, 2].max()
    scale = LENGTH / (zmax - zmin)
    L = Rz @ A @ R
    t = -np.array([c0[0], c0[1], zmin]) * scale
    M = np.eye(4)
    M[:3, :3] = scale * L
    M[:3, 3] = t
    return M, dict(turned=bool(turned), tilt_deg=float(np.degrees(np.arccos(axis[2]))), roll_deg=float(roll % 360), scale=float(scale))


def main():
    rig = sys.argv[1]
    sc = trimesh.load(SRC, force='scene')
    g = list(sc.geometry.values())[0]
    node_t = sc.graph.get(sc.graph.nodes_geometry[0])[0]
    v_node = trimesh.transform_points(g.vertices, node_t)  # scene (glTF world) space
    M_world, rep = frame(v_node)
    M = M_world @ node_t  # glTF mesh-local -> hand frame (Blender importer applies node_t as object transform; we bake both)
    h = trimesh.transform_points(g.vertices, M)
    lab = trimesh.load(LAB, force='scene')
    lv = None
    for name, geo in lab.geometry.items():
        if len(geo.vertices) > 2000:  # the hand (the sleeve extension tube has ~500 vertices); the lab writes it with an identity node
            lv = np.asarray(geo.vertices)
    from scipy.spatial import cKDTree
    d, _ = cKDTree(lv).query(h)
    d2, _ = cKDTree(h).query(lv)
    C = np.array([[1, 0, 0, 0], [0, 0, -1, 0], [0, 1, 0, 0], [0, 0, 0, 1.0]])  # glTF (x,y,z) -> Blender (x,-z,y)
    out = dict(M_gltf_mesh_to_hand=M.tolist(), node_transform=np.asarray(node_t).tolist(), M_world_to_hand=M_world.tolist(),
               C_gltf_to_blender=C.tolist(), report=rep,
               check_vs_lab=dict(max_mm=float(max(d.max(), d2.max()) * 1000), p99_mm=float(np.percentile(d, 99) * 1000),
                                 n_src=len(h), n_lab=len(lv)),
               bbox_hand=[h.min(0).tolist(), h.max(0).tolist()])
    os.makedirs(os.path.join(rig, '_work'), exist_ok=True)
    with open(os.path.join(rig, '_work', 'frame.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(json.dumps(dict(report=rep, check=out['check_vs_lab'], bbox=out['bbox_hand'])))


if __name__ == '__main__':
    main()

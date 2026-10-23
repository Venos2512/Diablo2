"""Synthetic meshes and skeletons for writer B's tests (no asset data). Units: metres, Blender frame (Z up, front -Y, left +X)."""
from __future__ import annotations

import numpy as np

from rigcore import mesh as rmesh
from rigcore import npzio


def tube(path_pts, radius=0.03, n_around=16, n_per_seg=12, caps=True, seam=True):
    """Triangulated tube along the polyline ``path_pts`` (p,3). With ``seam`` the first column of every ring is duplicated (a UV
    seam: co-located duplicate vertices), so the welded topology differs from the raw one. Returns (V (n,3), F (m,3), axis_t (n,)
    arc-length parameter 0..1 of each vertex)."""
    P = np.asarray(path_pts, dtype=np.float64)
    segs = [(P[i], P[i + 1]) for i in range(len(P) - 1)]
    centres, tangents, tpar = [], [], []
    total = sum(np.linalg.norm(b - a) for a, b in segs)
    acc = 0.0
    for si, (a, b) in enumerate(segs):
        L = np.linalg.norm(b - a)
        for k in range(n_per_seg + (1 if si == len(segs) - 1 else 0)):
            t = k / n_per_seg
            centres.append(a + t * (b - a))
            tangents.append((b - a) / L)
            tpar.append((acc + t * L) / total)
        acc += L
    centres, tangents, tpar = np.array(centres), np.array(tangents), np.array(tpar)
    # smooth tangents at the bend (average with the neighbour) so rings do not overlap
    T = tangents.copy()
    T[1:-1] = tangents[1:-1] + tangents[:-2]
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    up = np.array([0.0, 1.0, 0.0])
    cols = n_around + (1 if seam else 0)
    V, tv = [], []
    for c, t, tp in zip(centres, T, tpar):
        u = np.cross(t, up)
        if np.linalg.norm(u) < 1e-6:
            u = np.cross(t, [1.0, 0.0, 0.0])
        u /= np.linalg.norm(u)
        w = np.cross(t, u)
        for j in range(cols):
            ang = 2 * np.pi * (j % n_around) / n_around
            V.append(c + radius * (np.cos(ang) * u + np.sin(ang) * w))
            tv.append(tp)
    V, tv = np.array(V), np.array(tv)
    F = []
    R = len(centres)
    for i in range(R - 1):
        for j in range(n_around):
            a = i * cols + j
            b = i * cols + (j + 1 if seam else (j + 1) % n_around)
            c_ = (i + 1) * cols + j
            d = (i + 1) * cols + (j + 1 if seam else (j + 1) % n_around)
            F += [[a, b, d], [a, d, c_]]
    if caps:
        for i, sgn in ((0, -1), (R - 1, 1)):
            V = np.vstack([V, centres[i]])
            tv = np.append(tv, tpar[i])
            ci = len(V) - 1
            for j in range(n_around):
                a = i * cols + j
                b = i * cols + (j + 1 if seam else (j + 1) % n_around)
                F.append([ci, b, a] if sgn < 0 else [ci, a, b])
    return V, np.array(F, dtype=np.int64), tv


def mesh_dict(V, F, H, asset_id="synthetic", extra=None):
    """mesh.npz-style dict (validated through rigcore.schema like a loaded file)."""
    from rigcore import schema

    d = {"V": V, "F": F, "weld": rmesh.weld_map(V), "UV": None, "mat": None,
         "meta": npzio.mesh_meta(asset_id, H), "extra": dict(extra or {})}
    return schema.validate_mesh(d)


def bone(name, parent, head, tail, kind="core", deform=True, hinge=(1.0, 0.0, 0.0), twist=None):
    side = name[0] if name[:2] in ("L_", "R_") else None
    return {"name": name, "parent": parent, "kind": kind, "deform": deform, "head": [float(c) for c in head],
            "tail": [float(c) for c in tail], "hinge": list(hinge), "bend_test": None, "twist": twist, "side": side}


def skeleton(bones, H, skin=None):
    from rigcore import schema

    sk = {"schema": 0, "family": "test", "template_version": "test", "H": float(H), "control_kit": None, "bones": bones,
          "ik": [], "rom": [], "rom_compound": [], "skin": dict(skin or {}), "warnings": []}
    return schema.validate_skeleton(sk)


def bent_arm(H=1.0, radius=0.03):
    """Two-bone L-shaped tube: upper bone along +X from (0.1,0,0.5) to (0.4,0,0.5), lower bone bent 90 deg down to (0.4,0,0.2)."""
    pts = [(0.1, 0.0, 0.5), (0.4, 0.0, 0.5), (0.4, 0.0, 0.2)]
    V, F, t = tube(pts, radius=radius, n_around=16, n_per_seg=14)
    bones_ = [bone("root", None, (0, 0, 0), (0, 0, 0.05), deform=False),
              bone("upper", "root", pts[0], pts[1], hinge=(0.0, 1.0, 0.0)),
              bone("lower", "upper", pts[1], pts[2], hinge=(0.0, 1.0, 0.0))]
    return mesh_dict(V, F, H), skeleton(bones_, H), t


def figure(H=1.8, dx=0.0, ring=0.02, arm_drop=0.0):
    """Symmetric T-pose humanoid with the H family's deform bones (pelvis .. head, {S}_Clavicle, {S}_UpperArm(+_twist),
    {S}_ForeArm(+_twist), {S}_Hand, {S}_Thigh, {S}_Calf, {S}_Foot) and root/cog, everything shifted by ``dx`` in X. Mesh = separate
    tube islands (torso, arms, legs) with about ``ring`` m between vertex rings. Hinges follow the H bend tests: elbow folds to
    -Y, knee to +Y, palm faces -Z. ``arm_drop`` (degrees) turns both arms down about the shoulders (an A-pose; the arm hinges turn
    with them). Returns (mesh dict, skeleton dict)."""
    X = lambda x, y, z: (x + dx, y, z)
    lerp = lambda a, b, t: tuple(np.asarray(a) + t * (np.asarray(b) - np.asarray(a)))
    ca, sa = np.cos(np.radians(arm_drop)), np.sin(np.radians(arm_drop))

    def arm(sg, x):  # a point at |x| along the T-pose arm (z 1.42), turned down by arm_drop about the shoulder (|x| = 0.17)
        return X(sg * (0.17 + (x - 0.17) * ca), 0, 1.42 - (x - 0.17) * sa)

    bones_ = [bone("root", None, X(0, 0, 0), X(0, 0, 0.04), deform=False),
              bone("cog", "root", X(0, 0, 0.95), X(0, 0, 1.03), deform=False),
              bone("pelvis", "cog", X(0, 0, 0.95), X(0, 0, 1.05)),
              bone("spine_01", "pelvis", X(0, 0, 1.05), X(0, 0, 1.17)),
              bone("spine_02", "spine_01", X(0, 0, 1.17), X(0, 0, 1.30)),
              bone("chest", "spine_02", X(0, 0, 1.30), X(0, 0, 1.45)),
              bone("neck", "chest", X(0, 0, 1.45), X(0, 0, 1.55)),
              bone("head", "neck", X(0, 0, 1.55), X(0, 0, 1.80))]
    for s, sg in (("L", 1.0), ("R", -1.0)):
        cl = X(sg * 0.04, 0, 1.42)
        sh, el, wr, tip = (arm(sg, x) for x in (0.17, 0.45, 0.72, 0.88))
        ah = (-sg * sa + 0.0, 0, -sg * ca)  # elbow hinge (0, 0, -sg) turned with the arm (+ 0.0: no -0.0 at arm_drop 0)
        hip, knee, ank, toe = X(sg * 0.10, 0, 0.92), X(sg * 0.11, 0, 0.50), X(sg * 0.12, 0, 0.08), X(sg * 0.12, -0.12, 0.02)
        bones_ += [bone(f"{s}_Clavicle", "chest", cl, sh, hinge=(0, -sg, 0)),
                   bone(f"{s}_UpperArm", f"{s}_Clavicle", sh, el, hinge=ah),
                   bone(f"{s}_UpperArm_twist", f"{s}_UpperArm", lerp(sh, el, 0.25), lerp(sh, el, 0.5), kind="twist",
                        hinge=ah, twist={"driver": f"{s}_UpperArm", "axis": "Y", "factor": -0.5}),
                   bone(f"{s}_ForeArm", f"{s}_UpperArm", el, wr, hinge=ah),
                   bone(f"{s}_ForeArm_twist", f"{s}_ForeArm", lerp(el, wr, 0.5), lerp(el, wr, 0.75), kind="twist",
                        hinge=ah, twist={"driver": f"{s}_Hand", "axis": "Y", "factor": 0.5}),
                   bone(f"{s}_Hand", f"{s}_ForeArm", wr, tip, hinge=(0, sg, 0)),
                   bone(f"{s}_Thigh", "pelvis", hip, knee, hinge=(1, 0, 0)),
                   bone(f"{s}_Calf", f"{s}_Thigh", knee, ank, hinge=(1, 0, 0)),
                   bone(f"{s}_Foot", f"{s}_Calf", ank, toe, hinge=(-1, 0, 0))]
    skin = {"max_influences": 4, "prune_below": 0.01, "side_gate_band_H": 0.01,
            "max_influences_by_region": {"shoulder": 3, "hip": 3, "fingers": 2, "default_non_joint": 2}}
    parts = [([X(0, 0, 0.88), X(0, 0, 1.78)], 0.14)]
    for sg in (1.0, -1.0):
        parts += [([arm(sg, 0.12), arm(sg, 0.90)], 0.045),
                  ([X(sg * 0.10, 0, 0.97), X(sg * 0.11, 0, 0.50), X(sg * 0.12, 0, 0.05)], 0.06)]
    Vs, Fs, off = [], [], 0
    for pts, r in parts:
        L = sum(np.linalg.norm(np.subtract(pts[i + 1], pts[i])) for i in range(len(pts) - 1))
        V, F, _ = tube(pts, radius=r, n_around=12, n_per_seg=max(4, int(round(L / ring / (len(pts) - 1)))))
        Vs.append(V)
        Fs.append(F + off)
        off += len(V)
    return mesh_dict(np.vstack(Vs), np.vstack(Fs), H, asset_id="figure"), skeleton(bones_, H, skin=skin)


def twist_arm(H=1.0):
    """Straight left arm along +X with the H-family twist layout: L_UpperArm 0.2..0.5, L_UpperArm_twist at 25-50% (driver
    L_UpperArm, factor -0.5), L_ForeArm 0.5..0.8, L_ForeArm_twist at 50-75% (driver L_Hand, factor 0.5), L_Hand 0.8..0.9."""
    z = 0.6
    S, E, Wr, T = np.array([0.2, 0, z]), np.array([0.5, 0, z]), np.array([0.8, 0, z]), np.array([0.9, 0, z])
    lerp = lambda a, b, t: a + t * (b - a)
    bones_ = [bone("chest", None, (0, 0, 0.45), (0, 0, z), hinge=(1, 0, 0)),
              bone("L_UpperArm", "chest", S, E, hinge=(0, 0, 1)),
              bone("L_UpperArm_twist", "L_UpperArm", lerp(S, E, 0.25), lerp(S, E, 0.5), kind="twist", hinge=(0, 0, 1),
                   twist={"driver": "L_UpperArm", "axis": "Y", "factor": -0.5}),
              bone("L_ForeArm", "L_UpperArm", E, Wr, hinge=(0, 0, 1)),
              bone("L_ForeArm_twist", "L_ForeArm", lerp(E, Wr, 0.5), lerp(E, Wr, 0.75), kind="twist", hinge=(0, 0, 1),
                   twist={"driver": "L_Hand", "axis": "Y", "factor": 0.5}),
              bone("L_Hand", "L_ForeArm", Wr, T, hinge=(0, 1, 0))]
    return skeleton(bones_, H)

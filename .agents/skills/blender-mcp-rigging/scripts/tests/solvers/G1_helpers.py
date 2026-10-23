"""Synthetic garment fixtures for the G1 tests (phase G): a humanoid body (closed leg, torso, head and arm tubes around a minimal
H-family skeleton, H = 1.8 m) plus one garment case per fixture. Every garment is a separate island built from simple sheets so
the expected class and chain count are known.

Cases: ``skirt`` (open cone bridging the legs to mid-calf), ``tails`` (three separate back strips with slits between them),
``cape`` (wide sheet behind the torso from the shoulders), ``beads`` (six small spheres in a line hanging from the belt),
``layered`` (outer floor-length cone + inner cone), ``shirt`` (tight tube 1% H off the torso), ``body`` (no garment).

Units: metres, Blender frame (Z up, front -Y, character's left +X).
"""
from __future__ import annotations

import numpy as np

from rigcore import mesh as rmesh

H = 1.8


def _bone(name, parent, head, tail, side=None, kind="core", deform=True, hinge=(1.0, 0.0, 0.0)):
    return {"name": name, "parent": parent, "side": side, "kind": kind, "deform": deform, "head": [float(v) for v in head],
            "tail": [float(v) for v in tail], "hinge": list(hinge), "bend_test": None, "twist": None}


def skeleton() -> dict:
    """Minimal resolved H skeleton (no twist bones, no sockets)."""
    b = [_bone("root", None, (0, 0, 0), (0, 0, 0.04), deform=False),
         _bone("pelvis", "root", (0, 0, 1.0), (0, 0, 1.1)),
         _bone("spine_01", "pelvis", (0, 0, 1.1), (0, 0, 1.22)),
         _bone("spine_02", "spine_01", (0, 0, 1.22), (0, 0, 1.34)),
         _bone("chest", "spine_02", (0, 0, 1.34), (0, 0, 1.48)),
         _bone("neck", "chest", (0, 0, 1.48), (0, 0, 1.58)),
         _bone("head", "neck", (0, 0, 1.58), (0, 0, 1.8))]
    for s, sg in (("L", 1.0), ("R", -1.0)):
        b += [_bone(f"{s}_Thigh", "pelvis", (0.1 * sg, 0, 0.95), (0.1 * sg, 0, 0.52), s),
              _bone(f"{s}_Calf", f"{s}_Thigh", (0.1 * sg, 0, 0.52), (0.1 * sg, 0.0, 0.1), s),
              _bone(f"{s}_Foot", f"{s}_Calf", (0.1 * sg, 0.0, 0.1), (0.1 * sg, -0.12, 0.03), s),
              _bone(f"{s}_Toe", f"{s}_Foot", (0.1 * sg, -0.12, 0.03), (0.1 * sg, -0.2, 0.02), s),
              _bone(f"{s}_Clavicle", "chest", (0.02 * sg, -0.02, 1.45), (0.16 * sg, 0, 1.46), s, hinge=(0, -sg, 0)),
              _bone(f"{s}_UpperArm", f"{s}_Clavicle", (0.16 * sg, 0, 1.46), (0.45 * sg, 0, 1.46), s, hinge=(0, 0, -sg)),
              _bone(f"{s}_ForeArm", f"{s}_UpperArm", (0.45 * sg, 0, 1.46), (0.72 * sg, 0, 1.46), s, hinge=(0, 0, -sg)),
              _bone(f"{s}_Hand", f"{s}_ForeArm", (0.72 * sg, 0, 1.46), (0.88 * sg, 0, 1.46), s, hinge=(0, sg, 0))]
    order = ["root", "pelvis", "spine_01", "spine_02", "chest", "neck", "head"]
    for s in "LR":
        order += [f"{s}_Thigh", f"{s}_Calf", f"{s}_Foot", f"{s}_Toe", f"{s}_Clavicle", f"{s}_UpperArm", f"{s}_ForeArm", f"{s}_Hand"]
    by = {x["name"]: x for x in b}
    return {"schema": 0, "family": "H", "template_version": "test", "H": H, "bones": [by[n] for n in order], "ik": [], "rom": [],
            "rom_compound": [], "skin": {"max_influences": 4, "prune_below": 0.01, "side_gate_band_H": 0.01}, "warnings": []}


# ------------------------------------------------------------------------------------------------------------- primitives


class Builder:
    def __init__(self):
        self.V, self.F = [], []

    def add(self, V, F):
        o = sum(len(v) for v in self.V)
        self.V.append(np.asarray(V, float))
        self.F.append(np.asarray(F, np.int64) + o)

    def mesh(self, asset_id="G1_fixture") -> dict:
        V = np.concatenate(self.V)
        F = np.concatenate(self.F).astype(np.int32)
        weld = rmesh.weld_map(V)
        return {"V": V, "F": F, "weld": weld, "UV": None, "mat": None,
                "meta": {"asset_id": asset_id, "H": H, "schema": 0}, "extra": {}}


def grid_faces(nu, nv, wrap_u):
    F = []
    for j in range(nv - 1):
        for i in range(nu if wrap_u else nu - 1):
            a, b = j * nu + i, j * nu + (i + 1) % nu
            c, d = a + nu, b + nu
            F += [(a, b, d), (a, d, c)]
    return F


def tube(builder, a, b, r0, r1=None, n=16, rings=8, caps=True, rx=1.0, ry=1.0):
    """Tube from point a to b (radius r0 -> r1), closed with caps when ``caps``; elliptic with factors rx, ry."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    r1 = r0 if r1 is None else r1
    ax = (b - a) / np.linalg.norm(b - a)
    u = np.cross(ax, [0, 0, 1.0]) if abs(ax[2]) < 0.9 else np.array([1.0, 0, 0])
    u /= np.linalg.norm(u)
    v = np.cross(ax, u)
    V = []
    for j in range(rings):
        f = j / (rings - 1)
        c = a + f * (b - a)
        r = r0 + f * (r1 - r0)
        for i in range(n):
            th = 2 * np.pi * i / n
            V.append(c + r * (rx * np.cos(th) * u + ry * np.sin(th) * v))
    F = grid_faces(n, rings, True)
    if caps:
        V.append(a)
        V.append(b)
        ca, cb = len(V) - 2, len(V) - 1
        for i in range(n):
            F.append((ca, (i + 1) % n, i))
            last = (rings - 1) * n
            F.append((cb, last + i, last + (i + 1) % n))
    builder.add(V, F)


def cone_sheet(builder, z0, z1, r0, r1, n=40, rings=14, phi0=-180.0, phi1=180.0, axis=(0.0, 0.0)):
    """Open conical sheet (single surface) between heights z0 (top, radius r0) and z1 (radius r1), azimuth phi0..phi1 degrees
    (0 = front -Y, 90 = +X); full circle when the span is 360."""
    full = abs((phi1 - phi0) - 360.0) < 1e-9
    m = n if full else n + 1
    V = []
    for j in range(rings):
        f = j / (rings - 1)
        z = z0 + f * (z1 - z0)
        r = r0 + f * (r1 - r0)
        for i in range(m):
            ph = np.radians(phi0 + (phi1 - phi0) * i / n)
            V.append((axis[0] + r * np.sin(ph), axis[1] - r * np.cos(ph), z))
    builder.add(V, grid_faces(m, rings, full))


def plane_sheet(builder, x0, x1, y, z0, z1, nx=6, nz=12, bulge=0.0):
    """Vertical sheet at depth ``y`` from x0..x1, z0 (top) .. z1, optionally bulged outward (+y) in the middle."""
    V = []
    for j in range(nz):
        z = z0 + (z1 - z0) * j / (nz - 1)
        for i in range(nx):
            x = x0 + (x1 - x0) * i / (nx - 1)
            V.append((x, y + bulge * np.sin(np.pi * i / (nx - 1)), z))
    builder.add(V, grid_faces(nx, nz, False))


def sphere(builder, c, r, n=8):
    V, F = [], []
    rings = n // 2 + 1
    for j in range(rings):
        th = np.pi * j / (rings - 1)
        for i in range(n):
            ph = 2 * np.pi * i / n
            V.append((c[0] + r * np.sin(th) * np.cos(ph), c[1] + r * np.sin(th) * np.sin(ph), c[2] + r * np.cos(th)))
    F = grid_faces(n, rings, True)
    builder.add(V, F)


def body(builder):
    for sg in (1.0, -1.0):
        tube(builder, (0.1 * sg, 0, 0.02), (0.1 * sg, 0, 1.0), 0.065, 0.075, n=16, rings=14)
        tube(builder, (0.16 * sg, 0, 1.46), (0.88 * sg, 0, 1.46), 0.045, 0.035, n=12, rings=12)
    tube(builder, (0, 0, 0.95), (0, 0, 1.5), 0.17, 0.18, n=24, rings=12, rx=1.0, ry=0.7)
    tube(builder, (0, 0, 1.5), (0, 0, 1.6), 0.05, n=12, rings=3)
    sphere(builder, (0, -0.01, 1.7), 0.1, n=16)


def fixture(case: str) -> tuple[dict, dict]:
    """(mesh dict as from npzio.load_mesh, resolved skeleton) for one case (module docstring)."""
    bld = Builder()
    body(bld)
    if case == "skirt":
        cone_sheet(bld, 1.02, 0.3, 0.22, 0.36)
    elif case == "tails":
        for k, (x0, x1) in enumerate(((-0.2, -0.08), (-0.05, 0.05), (0.08, 0.2))):
            plane_sheet(bld, x0, x1, 0.2, 0.98, 0.4, nx=5, nz=12)
    elif case == "cape":
        plane_sheet(bld, -0.26, 0.26, 0.2, 1.5, 0.75, nx=10, nz=14, bulge=0.03)
    elif case == "beads":
        for k in range(6):
            sphere(bld, (-0.24, -0.2, 0.94 - 0.075 * k), 0.022, n=8)
        tube(bld, (-0.24, -0.2, 0.99), (-0.2, -0.15, 1.02), 0.006, n=6, rings=3)  # hook touching the belt area (not needed)
    elif case == "layered":
        cone_sheet(bld, 1.02, 0.12, 0.24, 0.42, n=40, rings=16)
        cone_sheet(bld, 1.0, 0.2, 0.2, 0.33, n=40, rings=14)
    elif case == "shirt":
        tube(bld, (0, 0, 1.12), (0, 0, 1.45), 0.18 + 0.01 * H * 0.5, 0.19 + 0.01 * H * 0.5, n=24, rings=10, caps=False,
             rx=1.0, ry=0.72)
    elif case != "body":
        raise ValueError(case)
    return bld.mesh(f"G1_{case}"), skeleton()


def body_weights(mesh, skel):
    """Simple body weights over the deform bones: inverse-square distance to the bone segments, top 2, per original vertex."""
    from solvers import skin_common as sc

    bones = [b for b in skel["bones"] if b["deform"]]
    V = np.asarray(mesh["V"], float)
    D = np.stack([sc.seg_dist(V, b["head"], b["tail"])[0] for b in bones], axis=1)
    w = 1.0 / np.maximum(D, 1e-4) ** 2
    keep = np.argsort(-w, axis=1)[:, :2]
    W = np.zeros_like(w)
    r = np.arange(len(V))[:, None]
    W[r, keep] = w[r, keep]
    W /= W.sum(1, keepdims=True)
    return [b["name"] for b in bones], W

"""Owner G5: S3g classifier fixtures for FUSED garments and body parts (review r1 M3; G4 checked them only through probe scripts,
``E:\\tmp_rigkit\\G4\\classify\\`` and the review's ``probe_classify*.py``). Every case is ONE welded island: the part is joined to
the G1 body by a zipper strip of triangles whose edges are shared with the part's rim and with a loop or row of body vertices (not a
separate island, not a single bridging triangle).

Expected (spec ``references/cloth-and-attachments.md`` §2, review r1 M3):
- robe, single sheet or a closed 2 cm shell, fused at the waist -> ``skirt`` with ring chains;
- cape, single sheet or a closed 2.5 cm slab, fused to the upper back -> ``cape``;
- tail tube, side tube, belly dome -> never chained; a piece that covers them is ``tight`` with a flag;
- wings (membranes rooted on the back; a bat membrane from the arm to the torso side) -> never chained; pieces over them flagged;
- control: a sheet hanging below the forearm -> ``sleeve`` with a chain (the G5 wing rules must not eat real sleeves). It is a
  separate open sheet as in G1's fixtures: a sheet or thin slab ZIPPED to the forearm is not a free row at all today (upper-body
  candidates are S1-thin rows, separate open sheets and rows behind the spine), a known gap of S3g, not a wing rule effect.

rigkit-env:

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/solvers/G5_classifier_fixtures_test.py -q -p no:cacheprovider
"""
from __future__ import annotations

import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import G1_helpers as fx  # noqa: E402
from solvers import chains as ch  # noqa: E402
from solvers import garments as gm  # noqa: E402
from solvers import skin_common as sc  # noqa: E402

# G1 body parts in Builder order: L leg, L arm, R leg, R arm, torso, neck, head
TORSO_N, ARM_N = 24, 12


def _offsets(bld) -> list:
    o, out = 0, []
    for v in bld.V:
        out.append(o)
        o += len(v)
    return out


def _next(bld) -> int:
    return sum(len(v) for v in bld.V)


def _allV(bld) -> np.ndarray:
    return np.concatenate(bld.V)


def torso_id(bld, j, i) -> int:
    """Torso tube vertex of ring j (z = 0.95 + 0.05 j) and column i (angle 15 i deg from +X towards +Y, the back)."""
    return _offsets(bld)[4] + j * TORSO_N + i % TORSO_N


def arm_id(bld, s, j, i=3) -> int:
    """Arm tube vertex of side s ('L' / 'R'), ring j (from the shoulder, x = 0.16 + 0.0655 j), column i (3 = underside)."""
    return _offsets(bld)[1 if s == "L" else 3] + j * ARM_N + i % ARM_N


def stitch(bld, A, B, closed: bool, key=None):
    """Zipper strip between vertex chains A and B (global ids): both sorted by ``key(points)`` (default: angle around their
    common centroid in the best-fit plane when ``closed``, else the first principal direction), then merged so that every
    triangle uses one edge of A or one edge of B. The triangles are added to the builder as their own part (no new vertices)."""
    Vall = _allV(bld)
    A, B = list(A), list(B)
    if key is None:
        Q = Vall[A + B]
        c = Q.mean(0)
        _, _, vt = np.linalg.svd(Q - c, full_matrices=False)
        if closed:
            def key(P):
                d = P - c
                return np.arctan2(d @ vt[1], d @ vt[0])
        else:
            def key(P):
                return (P - c) @ vt[0]
    A = [A[k] for k in np.argsort(key(Vall[A]))]
    B = [B[k] for k in np.argsort(key(Vall[B]))]
    if closed:
        ka, kb = key(Vall[A]), key(Vall[B])
        A_, B_ = A + [A[0]], B + [B[0]]
        ka, kb = list(ka) + [ka[0] + 2 * np.pi], list(kb) + [kb[0] + 2 * np.pi]
    else:
        A_, B_ = A, B
        ka, kb = list(key(Vall[A])), list(key(Vall[B]))
    i = j = 0
    F = []
    while i < len(A_) - 1 or j < len(B_) - 1:
        if j >= len(B_) - 1 or (i < len(A_) - 1 and ka[i + 1] <= kb[j + 1]):
            F.append((A_[i], B_[j], A_[i + 1]))
            i += 1
        else:
            F.append((A_[i], B_[j], B_[j + 1]))
            j += 1
    o = _next(bld)
    bld.V.append(np.zeros((0, 3)))
    bld.F.append(np.asarray(F, np.int64))
    assert o == _next(bld)
    return F


def thick_cone(bld, z0, z1, r0, r1, th, n=40, rings=14):
    """Closed conical shell of thickness th (outer cone r, inner cone r - th, joined at the top and the hem); returns the global
    ids of the inner top ring."""
    o = _next(bld)
    V, F = [], []
    for layer, dr in ((0, 0.0), (1, -th)):
        for j in range(rings):
            f = j / (rings - 1)
            z = z0 + f * (z1 - z0)
            r = r0 + f * (r1 - r0) + dr
            for i in range(n):
                ph = 2 * np.pi * i / n
                V.append((r * np.sin(ph), -r * np.cos(ph), z))
    for base in (0, rings * n):
        for j in range(rings - 1):
            for i in range(n):
                a, b = base + j * n + i, base + j * n + (i + 1) % n
                c, d = a + n, b + n
                F += [(a, b, d), (a, d, c)] if base == 0 else [(a, d, b), (a, c, d)]
    for j in (0, rings - 1):
        for i in range(n):
            a, b = j * n + i, j * n + (i + 1) % n
            c, d = a + rings * n, b + rings * n
            F += [(a, c, d), (a, d, b)] if j == 0 else [(a, d, c), (a, b, d)]
    bld.add(V, F)
    return [o + rings * n + i for i in range(n)]


def slab(bld, x0, x1, y, z0, z1, th, nx=10, nz=14, jitter=0.0):
    """Closed slab (two vertical sheets th apart, rim stitched) from x0..x1, z0 (top) .. z1 at depth y (front layer) and y + th;
    returns the global ids of the front layer's top row."""
    o = _next(bld)
    V, F = [], []
    for layer in (0, 1):
        for j in range(nz):
            for i in range(nx):
                V.append((x0 + (x1 - x0) * i / (nx - 1), y + layer * th, z0 + (z1 - z0) * j / (nz - 1)))
    for layer in (0, 1):
        b = layer * nx * nz
        for j in range(nz - 1):
            for i in range(nx - 1):
                a = b + j * nx + i
                F += [(a, a + 1, a + nx + 1), (a, a + nx + 1, a + nx)] if layer else [(a, a + nx + 1, a + 1), (a, a + nx, a + nx + 1)]
    rim = [(0, i) for i in range(nx)] + [(j, nx - 1) for j in range(1, nz)] + [(nz - 1, i) for i in range(nx - 2, -1, -1)] + \
        [(j, 0) for j in range(nz - 2, 0, -1)]
    for k in range(len(rim)):
        (j0, i0), (j1, i1) = rim[k], rim[(k + 1) % len(rim)]
        a, bb = j0 * nx + i0, j1 * nx + i1
        F += [(a, bb, bb + nx * nz), (a, bb + nx * nz, a + nx * nz)]
    V = np.asarray(V)
    if jitter:
        V = V + np.random.default_rng(1).normal(0, jitter, V.shape)
    bld.add(V, F)
    return [o + i for i in range(nx)]


def membrane(bld, P_of, nu, nv, th=0.0):
    """Sheet (th = 0) or closed slab (th > 0, second layer offset by th along +Y) over the grid P_of(u, v), u, v in [0, 1];
    returns (global ids of layer 0 as an (nv, nu) array)."""
    o = _next(bld)
    V, F = [], []
    layers = (0, 1) if th > 0 else (0,)
    for layer in layers:
        for j in range(nv):
            for i in range(nu):
                p = np.asarray(P_of(i / (nu - 1), j / (nv - 1)), float)
                V.append(p + np.array([0.0, layer * th, 0.0]))
    for layer in layers:
        b = layer * nu * nv
        for j in range(nv - 1):
            for i in range(nu - 1):
                a = b + j * nu + i
                F += [(a, a + 1, a + nu + 1), (a, a + nu + 1, a + nu)] if layer == 0 else [(a, a + nu + 1, a + 1), (a, a + nu, a + nu + 1)]
    if th > 0:
        rim = [(0, i) for i in range(nu)] + [(j, nu - 1) for j in range(1, nv)] + [(nv - 1, i) for i in range(nu - 2, -1, -1)] + \
            [(j, 0) for j in range(nv - 2, 0, -1)]
        for k in range(len(rim)):
            (j0, i0), (j1, i1) = rim[k], rim[(k + 1) % len(rim)]
            a, bb = j0 * nu + i0, j1 * nu + i1
            F += [(a, bb, bb + nu * nv), (a, bb + nu * nv, a + nu * nv)]
    bld.add(V, F)
    return o + np.arange(nu * nv).reshape(nv, nu)


def build(name: str):
    """(mesh, skeleton, part rows) of one fused case; ``part rows`` = welded ids of the added part (for the chain checks)."""
    bld = fx.Builder()
    fx.body(bld)
    n_body = _next(bld)
    if name == "robe_fused":
        o = _next(bld)
        fx.cone_sheet(bld, 1.02, 0.3, 0.22, 0.36)
        stitch(bld, range(o, o + 40), [torso_id(bld, 1, i) for i in range(TORSO_N)], closed=True)
    elif name == "robe_thick_fused":
        inner = thick_cone(bld, 1.02, 0.3, 0.22, 0.36, 0.02)
        stitch(bld, inner, [torso_id(bld, 1, i) for i in range(TORSO_N)], closed=True)
    elif name == "cape_fused":
        o = _next(bld)
        fx.plane_sheet(bld, -0.26, 0.26, 0.2, 1.5, 0.75, nx=10, nz=14, bulge=0.03)
        stitch(bld, range(o, o + 10), [torso_id(bld, 11, i) for i in range(0, 13)], closed=False)
    elif name == "cape_thick_fused":
        top = slab(bld, -0.26, 0.26, 0.2, 1.5, 0.75, 0.025, jitter=4e-4)
        stitch(bld, top, [torso_id(bld, 11, i) for i in range(0, 13)], closed=False)
    elif name == "tail_fused":
        o = _next(bld)
        fx.tube(bld, (0, 0.14, 1.0), (0, 0.5, 0.35), 0.045, 0.015, n=12, rings=14)
        loop = [torso_id(bld, j, i) for j, i in ((0, 5), (0, 6), (0, 7), (1, 7), (2, 7), (2, 6), (2, 5), (1, 5))]
        stitch(bld, range(o, o + 12), loop, closed=True)
    elif name == "side_tube_fused":  # a closed tube hanging from the left hip (a limb-like appendage, not cloth)
        o = _next(bld)
        fx.tube(bld, (0.2, 0.0, 1.0), (0.3, 0.0, 0.45), 0.04, 0.02, n=12, rings=12)
        loop = [torso_id(bld, j, i) for j, i in ((0, 23), (0, 0), (0, 1), (1, 1), (2, 1), (2, 0), (2, 23), (1, 23))]
        stitch(bld, range(o, o + 12), loop, closed=True)
    elif name == "belly_fused":  # dome on the belly, its rim zipped to a loop of torso vertices around the front
        c, r = np.array([0.0, -0.17, 1.1]), 0.12
        nu, nv = 16, 8

        def P_of(u, v):  # v = 0: front pole (-Y) .. v = 1: rim at 110 deg from the front pole
            a, ph = np.radians(110.0) * max(v, 1e-3), 2 * np.pi * u
            return c + r * np.array([np.sin(a) * np.cos(ph), -np.cos(a), np.sin(a) * np.sin(ph)])
        ids = membrane(bld, P_of, nu + 1, nv)
        rim = list(ids[-1, :-1])
        loop = [torso_id(bld, 1, i) for i in range(16, 21)] + [torso_id(bld, j, 20) for j in (2, 3, 4)] + \
            [torso_id(bld, 5, i) for i in range(20, 15, -1)] + [torso_id(bld, j, 16) for j in (4, 3, 2)]
        stitch(bld, rim, loop, closed=True)
    elif name == "wings_back":  # membranes rooted on the upper back, out and down behind the arms (0.6 cm slabs)
        for s in (1.0, -1.0):
            ids = membrane(bld, lambda u, v, s=s: (s * (0.09 + 0.6 * u), 0.15 + 0.2 * u, 1.42 - 0.5 * v * (0.4 + 0.6 * u)), 8, 8,
                           th=0.006)
            root = list(ids[:, 0])
            col = 4 if s > 0 else 8
            stitch(bld, root, [torso_id(bld, j, col) for j in range(4, 10)], closed=False)
    elif name in ("wings_g4", "wings_g4_separate"):  # G4's probe wings (0.6 cm slabs from the upper back, out past the hands)
        for s in (1.0, -1.0):
            ids = membrane(bld, lambda u, v, s=s: (s * (0.08 + 0.85 * u), 0.16 + 0.25 * u, 1.42 - 0.75 * v * (0.4 + 0.6 * u)), 8, 8,
                           th=0.006)
            if name == "wings_g4":
                stitch(bld, list(ids[:, 0]), [torso_id(bld, j, 4 if s > 0 else 8) for j in range(4, 10)], closed=False)
    elif name == "bat_membrane_L":  # 0.6 cm slab from the arm's underside to the torso side, zipped to both
        x1 = 0.75
        ids = membrane(bld, lambda u, v: (0.185 + (x1 - 0.185) * u, 0.0, 1.415 - v * 0.3 * (1.0 - 0.85 * u)), 10, 7, th=0.006)
        jmax = int(np.floor((x1 - 0.16) / (0.72 / 11)))
        stitch(bld, list(ids[0, :]), [arm_id(bld, "L", j) for j in range(0, jmax + 1)], closed=False)
        stitch(bld, list(ids[:, 0]), [torso_id(bld, j, 0) for j in range(3, 10)], closed=False)
    elif name == "sleeve_sheet_L":  # control: an open sheet hanging 2 cm below the forearm, its own island (G1 style)
        membrane(bld, lambda u, v: (0.5 + 0.3 * u, 0.01 * np.sin(np.pi * u), 1.40 - 0.22 * v), 7, 8)
    else:
        raise ValueError(name)
    mesh = bld.mesh(f"G5_{name}")
    weld = np.asarray(mesh["weld"])
    part = np.unique(weld[n_body:])
    return mesh, fx.skeleton(), part


def plan(name):
    mesh, skel, part = build(name)
    doc, arr = gm.classify(mesh, skel)
    chains = ch.plan(doc, arr, mesh, skel)
    topo = sc.weld_topo(mesh)
    return mesh, skel, part, doc, arr, chains, topo


def _covering(doc, arr, part) -> list:
    """Pieces that hold at least a third of the part's welded rows (or 20 rows)."""
    piece = np.asarray(arr["piece"])
    ks, cnt = np.unique(piece[part][piece[part] >= 0], return_counts=True)
    return [(doc["pieces"][int(k)], int(c)) for k, c in zip(ks, cnt) if c >= min(20, len(part) / 3)]


def _chained_rows(arr, chains, doc, part) -> int:
    """The part's rows in a piece that has a planned chain."""
    piece = np.asarray(arr["piece"])
    ids = {doc["pieces"][k]["id"]: k for k in range(len(doc["pieces"]))}
    chained = {ids[c["piece"]] for c in chains["chains"] if c.get("piece") in ids}
    return int(np.isin(piece[part], list(chained)).sum()) if chained else 0


def _one_island_with_torso(mesh, part):
    """The part's rows lie in the torso's welded island (the zipper strip shares edges with both)."""
    topo = sc.weld_topo(mesh)
    t0 = int(np.asarray(mesh["weld"])[_TORSO0])
    return bool((topo.island[part] == topo.island[t0]).all())


_TORSO0 = 2 * (16 * 14 + 2) + 2 * (12 * 12 + 2)  # first torso vertex: after two leg tubes and two arm tubes (with cap apexes)


@pytest.mark.parametrize("name, cls, n_chains", [("robe_fused", "skirt", 6), ("robe_thick_fused", "skirt", 6),
                                                 ("cape_fused", "cape", 3), ("cape_thick_fused", "cape", 3)])
def test_G5_fused_cloth_classes(name, cls, n_chains):
    """A robe (sheet or closed 2 cm shell) zipped to the waist is a skirt with ring chains; a cape (sheet or closed 2.5 cm slab)
    zipped to the upper back is a cape. One welded island with the torso; no flags."""
    mesh, skel, part, doc, arr, chains, topo = plan(name)
    assert _one_island_with_torso(mesh, part)
    cover = _covering(doc, arr, part)
    assert len(cover) == 1 and cover[0][0]["class"] == cls, [(p["id"], p["class"]) for p, _ in cover]
    pid = cover[0][0]["id"]
    mine = [c for c in chains["chains"] if c["piece"] == pid]
    assert len(mine) == n_chains and all(c["class"] == cls for c in mine)
    assert not doc["flags"]


@pytest.mark.parametrize("name", ["tail_fused", "side_tube_fused", "belly_fused"])
def test_G5_fused_body_parts_never_chained(name):
    """A tail tube, a closed tube hanging from the hip and a belly dome, each zipped to the torso: never chained. A piece that
    covers them is ``tight`` and flagged (confidence below conf_flag) for the user or Opus to confirm."""
    mesh, skel, part, doc, arr, chains, topo = plan(name)
    assert _one_island_with_torso(mesh, part)
    assert _chained_rows(arr, chains, doc, part) == 0
    flagged = {f["piece"] for f in doc["flags"]}
    for p, _ in _covering(doc, arr, part):
        assert p["class"] == "tight" and p["confidence"] < gm.PARAMS["conf_flag"] and p["id"] in flagged, p["id"]
    if name != "belly_fused":  # the tubes are free rows: their piece must be there, flagged
        assert _covering(doc, arr, part)


@pytest.mark.parametrize("name", ["wings_g4", "wings_back", "bat_membrane_L", "wings_g4_separate"])
def test_G5_wings_never_chained(name):
    """Wing membranes (0.6 cm slabs) from the upper back, out and down behind the arms, and a bat membrane zipped to the arm and
    the torso side: never chained, every piece over them flagged. ``wings_g4`` is G4's probe geometry zipped to the back: before
    G5 one wing was a cape with a 5-bone chain (now: reaches past the shoulders, not a cape). ``wings_g4_separate`` is G4's probe
    as it was (separate islands, G4 open problem 2): one wing was a 2-bone ``L_sleeve`` (now: attached far from the arm, not a
    sleeve). The bat membrane is no free row today (no piece); the sleeve rule would flag it by its torso contact."""
    mesh, skel, part, doc, arr, chains, topo = plan(name)
    if name != "wings_g4_separate":
        assert _one_island_with_torso(mesh, part)
    assert _chained_rows(arr, chains, doc, part) == 0
    cover = _covering(doc, arr, part)
    assert cover or name == "bat_membrane_L"
    flagged = {f["piece"] for f in doc["flags"]}
    for p, _ in cover:
        assert p["class"] == "tight" and p["confidence"] < gm.PARAMS["conf_flag"] and p["id"] in flagged, p["id"]
    why = " ".join(r for p, _ in cover for r in p["reasons"])
    if name == "wings_g4":
        assert "not a cape" in why
    if name == "wings_g4_separate":
        assert "does not hang from the arm" in why


def test_G5_sleeve_control_still_a_sleeve():
    """Control for the wing rules: an open sheet hanging 2 cm below the left forearm (a sleeve flap, its own island as in G1's
    fixtures) stays a ``sleeve`` with a chain under ``L_ForeArm`` and no flag. (A sheet or slab ZIPPED to the forearm is not a free
    row at all: the upper-body candidates are S1-thin rows, separate open sheets or rows behind the spine; see REPORT.)"""
    mesh, skel, part, doc, arr, chains, topo = plan("sleeve_sheet_L")
    cover = _covering(doc, arr, part)
    assert len(cover) == 1 and cover[0][0]["class"] == "sleeve"
    pid = cover[0][0]["id"]
    mine = [c for c in chains["chains"] if c["piece"] == pid]
    assert mine and all(c["parent"] == "L_ForeArm" for c in mine)
    assert pid not in {f["piece"] for f in doc["flags"]}

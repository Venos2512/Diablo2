"""Owner C: solvers.metrics on synthetic meshes with known answers (torn edges, area fraction with slivers, planted / sliding
penetrations, closed cut targets + the inside-test margin, seam cracks, ball-occupancy joint volume + mirror check + largest ratio,
candy-wrapper slices + twist cap, heads band, lights, the ordered region score + its scalar encoding with tear tie classes, regions
no pose exercises, numpy LBS candidates incl. a rigid cut, candidates named by meta.candidate) + kernel cross-checks. Runs in
rigkit-env:

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest scripts/tests/solvers -q -k C_ -p no:cacheprovider
"""
import itertools
import json
import math
import os

import igl
import numpy as np
import pytest

from rigcore import npzio, schema
from solvers import metrics as M

H = 0.5


# ------------------------------------------------------------------------------------------------------------------- builders
def box(center, size):
    """Closed axis-aligned box, outward triangles: V (8,3), F (12,3)."""
    c = np.asarray(center, float)
    s = np.asarray(size, float) / 2
    V = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)], float) * s + c
    F = np.array([[0, 1, 3], [0, 3, 2], [4, 6, 7], [4, 7, 5], [0, 4, 5], [0, 5, 1],
                  [2, 3, 7], [2, 7, 6], [0, 2, 6], [0, 6, 4], [1, 5, 7], [1, 7, 3]])
    cen = V.mean(0)
    for i, f in enumerate(F):
        n = np.cross(V[f[1]] - V[f[0]], V[f[2]] - V[f[0]])
        if np.dot(n, V[f].mean(0) - cen) < 0:
            F[i] = f[[0, 2, 1]]
    return V, F


def subdivided_box(center, size, k=4):
    """Closed box with every face split into a k x k grid: V, F outward (duplicates along the box edges are welded)."""
    c = np.asarray(center, float)
    s = np.asarray(size, float) / 2
    Vs, Fs = [], []
    base = 0
    for axis in range(3):
        for sign in (-1, 1):
            u, v = [a for a in range(3) if a != axis]
            g = np.linspace(-1, 1, k + 1)
            for i in range(k + 1):
                for j in range(k + 1):
                    p = np.zeros(3)
                    p[axis] = sign
                    p[u], p[v] = g[i], g[j]
                    Vs.append(p * s + c)
            for i in range(k):
                for j in range(k):
                    a = base + i * (k + 1) + j
                    b, cc, d = a + 1, a + (k + 1), a + (k + 1) + 1
                    Fs += [[a, cc, d], [a, d, b]]
            base += (k + 1) ** 2
    V = np.array(Vs)
    F = np.array(Fs)
    for i, f in enumerate(F):
        n = np.cross(V[f[1]] - V[f[0]], V[f[2]] - V[f[0]])
        if np.dot(n, V[f].mean(0) - c) < 0:
            F[i] = f[[0, 2, 1]]
    return V, F


def write_case(tmp, V, F, poses, bones, W, heads=None, tails=None, tags=None, parents=None, pose_mats=None, rest_mats=None):
    """mesh.npz / poses.npz / weights.npz in ``tmp``; ``poses`` = {name: P (n,3)} with 'rest' first."""
    names = list(poses)
    P = np.stack([poses[k] for k in names]).astype(np.float32)
    b = len(bones)
    if heads is None:
        heads = np.zeros((len(names), b, 3))
        tails = np.zeros((len(names), b, 3))
        tails[..., 2] = 0.1
    extra = {"parents": np.asarray(parents if parents is not None else [-1] * b, np.int32), "deform": np.ones(b, bool)}
    if pose_mats is not None:
        extra["pose_mats"] = pose_mats
        extra["rest_mats"] = rest_mats
    npzio.save_mesh(os.path.join(tmp, "mesh.npz"), V, F, meta={"asset_id": "synthetic", "H": H})
    npzio.save_poses(os.path.join(tmp, "poses.npz"), names, P, bones, np.asarray(heads, np.float32), np.asarray(tails, np.float32),
                     meta={"tags": tags or {k: ["extreme"] for k in names}, "rest_index": 0}, extra=extra)
    npzio.save_weights(os.path.join(tmp, "weights.npz"), bones, W, meta={"candidate": "A"})
    return [os.path.join(tmp, f) for f in ("mesh.npz", "poses.npz", "weights.npz")]


def run_case(tmp, paths, **kw):
    out = os.path.join(tmp, "out")
    res = M.run(*paths, out, **kw)
    with open(os.path.join(out, "metrics.json"), "rb") as f:
        doc = json.loads(f.read().decode("utf-8"))
    return res, doc, out


def strip(nx=10, length=0.1, height=0.01):
    """Flat strip of 2 x nx quads along X (one island), V (2*(nx+1),3), F."""
    xs = np.linspace(0, length, nx + 1)
    z0 = np.zeros_like(xs)
    V = np.concatenate([np.stack([xs, z0, z0], 1), np.stack([xs, z0, np.full_like(xs, height)], 1)])
    F = []
    for i in range(nx):
        a, b, c, d = i, i + 1, nx + 1 + i, nx + 2 + i
        F += [[a, b, d], [a, d, c]]
    return V, np.array(F)


def tube(n_around=16, n_rings=41, r=0.01, length=0.2, x0=0.0, closed=False):
    """Tube along X from x0 (one island): V, F outward; ``closed`` adds fan caps (centre vertices) at both ends."""
    V, F = [], []
    for k in range(n_rings):
        x = x0 + length * k / (n_rings - 1)
        for j in range(n_around):
            a = 2 * math.pi * j / n_around
            V.append((x, r * math.cos(a), r * math.sin(a)))
    for k in range(n_rings - 1):
        for j in range(n_around):
            a, b = k * n_around + j, k * n_around + (j + 1) % n_around
            F += [[a, b, b + n_around], [a, b + n_around, a + n_around]]
    if closed:
        c0, c1 = len(V), len(V) + 1
        V += [(x0, 0, 0), (x0 + length, 0, 0)]
        last = (n_rings - 1) * n_around
        for j in range(n_around):
            F += [[c0, (j + 1) % n_around, j], [c1, last + j, last + (j + 1) % n_around]]
    return np.array(V), np.array(F)


def _rot(axis, ang):
    c, s = math.cos(ang), math.sin(ang)
    x, y, z = axis
    return np.array([[c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
                     [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
                     [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)]])


def bone_mats(heads):
    """Rest world matrices (identity rotation, translation = head) for bones with the given heads (b,3)."""
    R = np.stack([np.eye(4)] * len(heads))
    R[:, :3, 3] = heads
    return R


def rotate_about_head(rest_mat, axis, deg):
    """World pose matrix of a bone rotated by ``deg`` about ``axis`` through its head (rest_mat @ R)."""
    Rm = np.eye(4)
    Rm[:3, :3] = _rot(axis, math.radians(deg))
    return rest_mat @ Rm


# ------------------------------------------------------------------------------------------------------------------- kernels
def test_C_exporter_rule_matches_poses_and_exporter():
    from rigkit import poses as RP

    W = np.array([[0.5, 0.2, 0.15, 0.1, 0.05, 0.00005], [1e-4, 0.0, 0.0, 0.0, 0.0, 0.0], [0.25, 0.25, 0.25, 0.25, 0.25, 0.0]],
                 np.float32)
    out = M.exporter_rule(W)
    assert np.allclose(out[0], [0.5 / 0.95, 0.2 / 0.95, 0.15 / 0.95, 0.1 / 0.95, 0, 0], atol=1e-6)
    assert out[1].sum() == 0  # <= 1e-4 dropped -> empty row (exporter binds it to a neutral joint)
    assert np.allclose(out[2], [0.25, 0.25, 0.25, 0.25, 0, 0])  # exact tie: column order (documented N7)
    assert np.array_equal(out, RP.exporter_rule(W))
    assert "group-membership order" in M.exporter_rule.__doc__ and "group-membership order" in RP.exporter_rule.__doc__


def test_C_tri_tri_matches_igl():
    rng = np.random.default_rng(7)
    A = rng.normal(size=(600, 3, 3)) * 0.05
    B = A.mean(1, keepdims=True) + rng.normal(size=(600, 3, 3)) * 0.05  # overlapping clouds: mix of hits and misses
    ours = M.tri_tri_intersect(A, B)
    ref = np.array([igl.tri_tri_intersection_test_3d(a[0:1], a[1:2], a[2:3], b[0:1], b[1:2], b[2:3])[0] for a, b in zip(A, B)])
    assert ours.sum() > 50 and (~ours).sum() > 50
    assert np.array_equal(ours, ref)


def test_C_aabb_pairs_match_brute_force():
    rng = np.random.default_rng(3)
    lo = rng.uniform(0, 1, (300, 3))
    hi = lo + rng.uniform(0.01, 0.15, (300, 3))
    ia, ib = M.aabb_pairs(lo, hi)
    got = set(zip(ia.tolist(), ib.tolist()))
    ov = np.all(lo[:, None] <= hi[None], 2) & np.all(lo[None] <= hi[:, None], 2)
    ref = {(i, j) for i, j in zip(*np.nonzero(np.triu(ov, 1)))}
    assert got == ref and len(ref) > 20
    lo2 = rng.uniform(0, 1, (200, 3))
    hi2 = lo2 + 0.05
    ia, ib = M.aabb_pairs(lo, hi, lo2, hi2)
    ov2 = np.all(lo[:, None] <= hi2[None], 2) & np.all(lo2[None] <= hi[:, None], 2)
    assert set(zip(ia.tolist(), ib.tolist())) == set(zip(*map(lambda a: a.tolist(), np.nonzero(ov2))))


def test_C_slice_area_and_min_angles():
    V, F = tube(n_around=24, n_rings=2, r=0.02, length=0.1)
    ngon = 0.5 * 24 * 0.02 ** 2 * math.sin(2 * math.pi / 24)
    assert M.slice_area(V, F, (0.05, 0, 0), (1, 0, 0)) == pytest.approx(ngon, rel=1e-9)
    assert M.slice_area(V, F, (0.2, 0, 0), (1, 0, 0)) is None
    tri = np.array([[0, 0, 0], [1, 0, 0], [0.5, math.sqrt(3) / 2, 0], [0, 1, 0], [0.02, 1, 0]], float)
    ang = M.tri_min_angles(tri, np.array([[0, 1, 2], [0, 1, 3], [0, 3, 4]]))
    assert ang[0] == pytest.approx(60.0) and ang[1] == pytest.approx(45.0) and ang[2] < 2.0


def test_C_ball_lattice_symmetric():
    L = M.ball_lattice(10)
    assert np.linalg.norm(L, axis=1).max() <= 1.0 + 1e-12
    key = {tuple(np.round(p, 9)) for p in L}
    for flip in ([-1, 1, 1], [1, -1, 1], [1, 1, -1]):
        assert {tuple(np.round(p * flip, 9)) for p in L} == key


def test_C_metrics_writes_npz_without_rigcore_private_writer():
    src = open(M.__file__, encoding="utf-8").read()
    assert "_write_npz" not in src and "savez_compressed" in src


# ------------------------------------------------------------------------------------------------------------------- torn edges, area
def test_C_torn_edges_count_and_lights(tmp_path):
    V, F = strip()  # 10 mm edges; H = 0.5 -> torn growth > 1 mm
    P13, P16 = V.copy(), V.copy()
    P13[:, 0] *= 1.3
    P16[:, 0] *= 1.6  # horizontal edges 1.6 (growth 6 mm): torn; diagonals 1.34: not torn
    W = np.ones((len(V), 1), np.float32)
    tags = {"rest": ["rest", "standard"], "s13": ["standard"], "x16": ["extreme"]}
    paths = write_case(str(tmp_path), V, F, {"rest": V, "s13": P13, "x16": P16}, ["bone"], W, tags=tags)
    res, doc, _ = run_case(str(tmp_path), paths)
    assert doc["poses"]["s13"]["bone"]["n_torn"] == 0 and doc["poses"]["s13"]["bone"]["stretch_max"] == pytest.approx(1.3)
    r = doc["poses"]["x16"]["bone"]
    assert r["n_torn"] == 20 and r["torn_fraction"] == pytest.approx(20 / r["n_edges"])
    assert doc["lights"]["deform_torn_edges_standard"] == "green"
    assert doc["lights"]["deform_torn_edges_extreme"] == "red"  # 20 / 41 edges >> 0.5 %
    assert "deform_edge_ratio" not in doc["lights"] and doc["summary"]["lights_detail"]["deform_edge_ratio"]["diagnostic"]
    # the same 1.6x stretch in a standard pose is red at once
    tags2 = {"rest": ["rest", "standard"], "s13": ["standard"], "x16": ["standard"]}
    paths = write_case(str(tmp_path), V, F, {"rest": V, "s13": P13, "x16": P16}, ["bone"], W, tags=tags2)
    _, doc2, _ = run_case(str(tmp_path), paths)
    assert doc2["lights"]["deform_torn_edges_standard"] == "red"
    schema.validate_metrics(doc)


def test_C_torn_edges_need_growth(tmp_path):
    V, F = strip(nx=10, length=0.004, height=0.0004)  # 0.4 mm edges: 1.6x grows 0.24 mm < 0.2 % H = 1 mm
    P = V.copy()
    P[:, 0] *= 1.6
    paths = write_case(str(tmp_path), V, F, {"rest": V, "x": P}, ["bone"], np.ones((len(V), 1), np.float32))
    _, doc, _ = run_case(str(tmp_path), paths)
    assert doc["poses"]["x"]["bone"]["n_over_1_5"] > 0 and doc["poses"]["x"]["bone"]["n_torn"] == 0
    assert doc["lights"]["deform_torn_edges_extreme"] == "green"


def test_C_area_fraction_skips_slivers_and_weights_by_area(tmp_path):
    # two squares (good triangles, areas 1 and 4 cm^2) + one sliver (min angle ~1 deg), one region
    sq = lambda x0, s: (np.array([[x0, 0, 0], [x0 + s, 0, 0], [x0 + s, 0, s], [x0, 0, s]]), np.array([[0, 1, 2], [0, 2, 3]]))
    Va, Fa = sq(0.0, 0.01)
    Vb, Fb = sq(0.05, 0.02)
    Vs = np.array([[0.1, 0, 0], [0.13, 0, 0], [0.13, 0, 0.0005]])
    V = np.concatenate([Va, Vb, Vs])
    F = np.concatenate([Fa, Fb + 4, np.array([[8, 9, 10]])])
    W = np.ones((len(V), 1), np.float32)
    P_sliver = V.copy()
    P_sliver[10, 2] = 0.003  # sliver area x6: skipped
    P_small = V.copy()
    P_small[0:4, 0] = (V[0:4, 0] - 0.0) * 1.3  # small square area x1.3 -> 1/5 of the good area beyond 15 %
    P_tiny = V.copy()
    P_tiny[0:4, 0] = V[0:4, 0] * 1.1  # inside the band
    paths = write_case(str(tmp_path), V, F, {"rest": V, "sliver": P_sliver, "small": P_small, "tiny": P_tiny}, ["bone"], W)
    _, doc, _ = run_case(str(tmp_path), paths)
    assert doc["summary"]["n_sliver_faces_skipped"] == 1
    assert doc["poses"]["sliver"]["bone"]["area_fraction_beyond"] == 0.0
    assert doc["poses"]["small"]["bone"]["area_fraction_beyond"] == pytest.approx(0.2, abs=1e-9)
    assert doc["poses"]["tiny"]["bone"]["area_fraction_beyond"] == 0.0
    assert doc["lights"]["deform_area_change"] == "red"  # 20 % > 5 %
    th = M.load_thresholds()
    assert M.light(th["deform_area_change"], 0.01, H) == "green" and M.light(th["deform_area_change"], 0.03, H) == "yellow"


# ------------------------------------------------------------------------------------------------------------------- penetrations
def test_C_planted_penetration_cross_island_eps_and_contacts(tmp_path):
    """Two closed boxes (two islands, two bones): box B pushed into box A by d -> penetration with depth d when d > 0.05 % H
    (0.25 mm); a 0.1 mm push is only a contact."""
    Va, Fa = box((0, 0, 0), (0.1, 0.1, 0.1))
    Vb, Fb = box((0.1 + 0.001, 0, 0), (0.1, 0.06, 0.06))  # 1 mm gap at rest
    V = np.concatenate([Va, Vb])
    F = np.concatenate([Fa, Fb + len(Va)])
    W = np.zeros((len(V), 2), np.float32)
    W[:8, 0] = 1
    W[8:, 1] = 1
    poses = {"rest": V}
    for mm in (0.1, 2, 4, 8):
        P = V.copy()
        P[8:, 0] -= (1 + mm) / 1000.0  # close the gap, then push mm into A
        poses[f"push{mm:g}"] = P
    paths = write_case(str(tmp_path), V, F, poses, ["A", "B"], W, parents=[-1, 0])
    _, doc, out = run_case(str(tmp_path), paths)
    for mm in (2, 4, 8):
        assert doc["poses"][f"push{mm}"]["B"]["penetration"]["max_depth"] == pytest.approx(mm / 1000.0, abs=2e-5)
    shallow = doc["poses"]["push0.1"]["B"]
    assert shallow["penetration"]["n_tris"] == 0 and shallow["contacts"]["n_tris"] > 0
    assert shallow["contacts"]["max_depth"] == pytest.approx(1e-4, abs=2e-5)
    assert doc["poses"]["rest"]["A"]["penetration"]["n_tris"] == 0
    f = np.load(os.path.join(out, "vertex_fields.npz"))
    assert f["penetration"][list(f["names"]).index("push8")][8:].max() == pytest.approx(0.008, abs=2e-5)
    assert f["contact"][list(f["names"]).index("push0.1")].max() == 1


def test_C_planted_penetration_same_island_nonadjacent(tmp_path):
    """One island bent into a U (arms A, B, bridge C): B pushed into A counts when A and B are not adjacent, not when they are."""
    V, F = subdivided_box((0, 0, 0), (0.3, 0.02, 0.02), k=6)
    x = V[:, 0]
    reg = np.where(x < -0.05, 0, np.where(x > 0.05, 1, 2))
    W = np.zeros((len(V), 3), np.float32)
    W[np.arange(len(V)), reg] = 1

    def fold(P, mask, pivot_x, sign):
        Q = P.copy()
        d = Q[mask] - [pivot_x, 0, 0]
        ang = sign * np.pi / 2
        c, s = np.cos(ang), np.sin(ang)
        Q[mask, 0] = pivot_x + d[:, 0] * c - d[:, 2] * s
        Q[mask, 2] = d[:, 0] * s + d[:, 2] * c
        return Q
    P = fold(V, reg == 0, -0.05, -1)
    P = fold(P, reg == 1, 0.05, 1)
    Ppush = P.copy()
    Ppush[reg == 1, 0] -= 0.09 + 0.004
    poses = {"rest": V, "fold": P, "push": Ppush}
    paths = write_case(str(tmp_path), V, F, poses, ["A", "B", "C"], W, parents=[2, 2, -1])
    _, doc, _ = run_case(str(tmp_path), paths)
    assert doc["poses"]["fold"]["B"]["penetration"]["n_tris"] == 0
    pb = doc["poses"]["push"]["B"]["penetration"]
    assert pb["n_tris"] > 0 and pb["max_depth"] > 0.002
    # the deepest pair names both regions, the target kind and the hot spot; the inside test's margin is reported
    pair = pb["pair"]
    assert {pair["intruder"], pair["into"]} == {"A", "B"} and pair["target"] == "cut" and pair["depth"] == pb["max_depth"]
    assert pair["w"] == pytest.approx(1.0, abs=1e-3) and len(pair["hot"]) == 3
    mg = doc["summary"]["penetration_margin"]["per_pose"]["push"]
    assert mg["min_margin"] > 0.4 and mg["n_vertices_deeper_than_eps"] > 0 and mg["deepest"]["depth"] == pb["max_depth"]
    det = doc["summary"]["lights_detail"]["deform_penetration_extreme_depth"]
    assert det["pair"]["depth"] == det["max_depth_m"]
    paths = write_case(str(tmp_path), V, F, poses, ["A", "B", "C"], W, parents=[2, 0, -1])
    _, doc2, _ = run_case(str(tmp_path), paths)
    assert doc2["poses"]["push"]["B"]["penetration"]["n_tris"] == 0


def test_C_sliding_rest_overlap_is_a_contact_but_only_near_it(tmp_path):
    """Slab A (top z = 0.01); region B = column B1 (subdivided, z 0.007..0.027: sunk 3 mm into A at rest) + cube B2 hovering 1 mm
    above A 12 cm away (> 2 % H). Poses, all moving B1 5 mm aside (new pairs): ``slide`` keeps the height (no vertex newly inside:
    contact); ``slide_down`` 4 mm lower brings a ring 2 mm deep, within the rest overlap (3 mm + eps) and next to it: a sliding
    contact; ``deeper`` 8 mm lower brings a ring 6 mm deep: penetration. ``far``: B2 2 mm into A, shallower than the rest overlap
    but far from it: penetration. Vertices already inside at rest never count (spec: "newly inside")."""
    Va, Fa = subdivided_box((0, 0, 0), (0.3, 0.1, 0.02), k=24)
    V1, F1 = subdivided_box((-0.06, 0, 0.017), (0.01, 0.01, 0.02), k=4)  # z rows 0.007, 0.012, ... 0.027
    V2, F2 = box((0.06, 0, 0.01 + 0.005 + 0.001), (0.01, 0.01, 0.01))  # 1 mm above
    V = np.concatenate([Va, V1, V2])
    F = np.concatenate([Fa, F1 + len(Va), F2 + len(Va) + len(V1)])
    n_a, n_1 = len(Va), len(V1)
    W = np.zeros((len(V), 2), np.float32)
    W[:n_a, 0] = 1
    W[n_a:, 1] = 1
    b1 = np.arange(n_a, n_a + n_1)
    b2 = np.arange(n_a + n_1, len(V))
    poses = {"rest": V}
    for nm, dz in (("slide", 0.0), ("slide_down", -0.004), ("deeper", -0.008)):
        P = V.copy()
        P[b1, 0] += 0.005
        P[b1, 2] += dz
        poses[nm] = P
    far = V.copy()
    far[b2, 2] -= 0.003
    poses["far"] = far
    paths = write_case(str(tmp_path), V, F, poses, ["A", "B"], W)
    _, doc, _ = run_case(str(tmp_path), paths)
    s = doc["poses"]["slide"]["B"]
    assert s["penetration"]["n_tris"] == 0 and s["contacts"]["n_tris"] > 0
    sd = doc["poses"]["slide_down"]["B"]
    assert sd["penetration"]["n_tris"] == 0 and sd["contacts"]["max_depth"] == pytest.approx(0.002, abs=1e-4)
    assert doc["poses"]["deeper"]["B"]["penetration"]["max_depth"] == pytest.approx(0.006, abs=1e-4)
    fa = doc["poses"]["far"]["B"]["penetration"]
    assert fa["n_tris"] > 0 and fa["max_depth"] == pytest.approx(0.002, abs=1e-4)


def test_C_cut_target_closed_by_caps(tmp_path):
    """Review r2 nit (hands_crossed: the deepest vertex sat at w = 0.52 against the open "cut" surface): a cut target is closed
    by fan caps over its boundary loops before the inside test. Tube along X: T (x < 0), S, A (x >= 0.1); the cut target of an
    A face removes A and its adjacent S, so T is open at x ~ 0. On the open surface a point 2 mm inside T next to the cut reads
    w ~ 0.5 (the reviewer's case) and a point where S was reads a fraction; on the closed surface they read 1 and 0."""
    V, F = tube(n_around=24, n_rings=31, r=0.02, length=0.3, x0=-0.1, closed=True)
    x = V[:, 0]
    reg = np.where(x < -1e-9, 0, np.where(x < 0.1 - 1e-9, 1, 2))
    W = np.zeros((len(V), 3), np.float32)
    W[np.arange(len(V)), reg] = 1
    paths = write_case(str(tmp_path), V, F, {"rest": V}, ["T", "S", "A"], W, parents=[-1, 0, 1])
    cx = M.Context(npzio.load_mesh(paths[0]), npzio.load_poses(paths[1]), npzio.load_weights(paths[2]))
    f = int(np.nonzero(cx.face_region == 2)[0][0])
    g = int(np.nonzero(cx.face_region == 0)[0][0])
    tkey = M._target_key(cx, f, g)
    assert tkey == ("cut", 0, 2)
    Ft = M._target_faces(cx, tkey)
    Vc, Fc = M._target_surface(cx, tkey, cx.rest_w)
    assert len(Fc) > len(Ft) and len(Vc) == cx.n_w + 1  # one boundary loop: one apex
    e = np.concatenate([Fc[:, [0, 1]], Fc[:, [1, 2]], Fc[:, [2, 0]]])
    fwd = set(map(tuple, e.tolist()))
    assert len(fwd) == len(e) and all((b, a) in fwd for a, b in fwd)  # closed: every directed edge has its reverse
    xb = float(cx.rest_w[np.unique(Ft)][:, 0].max())  # where T's surface ends (the cut)
    Q = np.array([[-0.06, 0, 0], [xb - 0.012, 0, 0], [xb + 0.02, 0, 0]])
    w_open = M.winding_inside(cx.rest_w, Ft, Q)
    w_closed = M.winding_inside(Vc, Fc, Q)
    assert w_open[0] > 0.9 and 0.45 < w_open[1] < 0.75 and 0.05 < w_open[2] < 0.45  # marginal next to the cut
    assert np.allclose(w_closed, [1.0, 1.0, 0.0], atol=1e-6)
    d, _ = M.surface_distance(Vc, Fc, Q[1:2])
    d_open, _ = M.surface_distance(cx.rest_w, Ft, Q[1:2])
    apex = Vc[-1]
    assert d[0] <= np.linalg.norm(Q[1] - apex) + 1e-9 and d[0] < d_open[0]  # depth past the cut border counts to the cap


def test_C_seam_crack(tmp_path):
    V, F = strip(4)
    V2 = np.concatenate([V, V[2:3]])
    F2 = F.copy()
    F2[F2 == 2] = len(V)
    F2[0][F2[0] == len(V)] = 2
    W = np.ones((len(V2), 1), np.float32)
    P = V2.copy()
    P[len(V)] += [0, 0.002, 0]
    paths = write_case(str(tmp_path), V2, F2, {"rest": V2, "crack": P}, ["bone"], W)
    _, doc, _ = run_case(str(tmp_path), paths)
    assert doc["poses"]["crack"]["bone"]["seam_crack_max"] == pytest.approx(0.002, abs=1e-7)
    assert doc["poses"]["rest"]["bone"]["seam_crack_max"] == 0.0
    assert doc["lights"]["deform_seam_crack"] == "red"


# ------------------------------------------------------------------------------------------------------------------- lights, rows
def test_C_lights_semantics_and_rows():
    th = M.load_thresholds()
    assert M.light(th["deform_torn_edges_standard"], 0, H) == "green"
    assert M.light(th["deform_torn_edges_standard"], 1, H) == "red"
    assert M.light(th["deform_torn_edges_extreme"], 0.004, H) == "yellow"
    assert M.light(th["deform_torn_edges_extreme"], 0.006, H) == "red"
    assert M.light(th["deform_joint_volume"], 0.84, H) == "red"
    assert M.light(th["deform_candy_wrapper"], 0.69, H) == "red"
    depth = th["deform_penetration_extreme_depth"]
    assert M.light(depth, 0.0, H) == "green" and M.light(depth, 0.002, H) == "yellow" and M.light(depth, 0.003, H) == "red"
    heads = th["joint_core_heads_inside"]
    assert M.light(heads, 0.0, H) == "green" and M.light(heads, 0.0009, H) == "yellow" and M.light(heads, 0.0011, H) == "red"
    assert M.light(th["runtime_reimport_parity"], 1e-5, H) == "green"
    assert M.light(th["runtime_reimport_parity"], 5e-5, H) == "red"
    with open(M.DEFAULT_THRESHOLDS, "rb") as f:
        doc = json.loads(f.read().decode("utf-8"))
    assert doc["status"] == "proposal" and all(r["status"] == "proposal" for r in doc["rows"])
    ids = [r["id"] for r in doc["rows"]]
    assert len(ids) == len(set(ids)) == 25
    assert all(r["source_note"].startswith("§4") for r in doc["rows"] if not r["source_note"].startswith("NOT in §4"))
    assert {r["id"] for r in doc["rows"] if r["source_note"].startswith("NOT in §4")} == {"deform_ground_contact",
                                                                                         "skin_region_score", "weights_limb_leak"}
    lk = th["weights_limb_leak"]  # I2: G2 D01 (2 welded rows) and FL candidate C (1 row) are green; 4-10 rows yellow
    assert [M.light(lk, v, H) for v in (0, 3, 4, 10, 11)] == ["green", "green", "yellow", "yellow", "red"]
    rs = th["skin_region_score"]
    assert M.light(rs, 1.0, H) is None and rs["light"] is False  # parameters only, no light
    refined = [r["id"] for r in doc["rows"] if "deformation-qa.md" in r["source_note"] or "review r1" in r["source_note"]]
    assert set(refined) >= {"deform_torn_edges_standard", "deform_torn_edges_extreme", "deform_area_change", "deform_joint_volume",
                            "deform_candy_wrapper", "deform_penetration_standard", "joint_core_heads_inside"}
    pr = M.Params(th, H)
    assert pr.torn_growth == pytest.approx(0.001) and pr.pen_eps == pytest.approx(0.00025) and pr.heads_band == pytest.approx(0.001)
    assert pr.ball_factor == 0.8 and pr.slide_radius == pytest.approx(0.01) and pr.candy_t == (0.5, 0.75, 0.9)
    assert (pr.not_exercised_deg, pr.tear_tie_rel, pr.tear_tie_abs, pr.near_tie, pr.soft_floor) == (3.0, 0.05, 2.0, 0.05, 0.01)
    assert pr.leak_band == 3 and pr.leak_params == {"w_min": 0.1, "arm_rel": 0.75, "thigh_rel": 0.3}
    assert {"chest", "pelvis", "L_UpperArm", "R_Thigh", "R_Clavicle"} <= set(pr.leak_gate_regions)
    assert not {"head", "L_ForeArm", "L_Calf"} & set(pr.leak_gate_regions)


def test_C_heads_inside_yellow_band(tmp_path):
    V, F = box((0, 0, 0.05), (0.1, 0.1, 0.1))  # top face at z = 0.1
    W = np.ones((len(V), 1), np.float32)
    heads = np.zeros((3, 1, 3))
    tails = np.zeros((3, 1, 3))
    heads[:, 0] = [[0, 0, 0.05], [0, 0, 0.1004], [0, 0, 0.1015]]  # inside / 0.4 mm out (0.08 % H) / 1.5 mm out (0.3 % H)
    tails[:, 0] = heads[:, 0] + [0, 0, 0.01]
    for k, want in ((1, "yellow"), (2, "red")):
        poses = {"rest": V, "p": V}
        h = heads[[0, k]]
        t = tails[[0, k]]
        paths = write_case(str(tmp_path), V, F, poses, ["b"], W, heads=h, tails=t)
        _, doc, _ = run_case(str(tmp_path), paths)
        assert doc["lights"]["joint_core_heads_inside"] == want, (k, doc["summary"]["lights_detail"]["joint_core_heads_inside"])


# ------------------------------------------------------------------------------------------------------------------- region score
def _summ(seam=False, tw=0, ts=0, tier=0, soft=0.0):
    return {"seam_fail": seam, "tear_worst": tw, "tear_sum": ts, "pen_tier": tier, "soft": {"total": soft}}


def test_C_region_score_ordered_decision():
    order = ["A", "B"]
    rough = {"A": 0.1, "B": 0.2}
    cases = [  # (A, B, winner, decided_by); tear values differ beyond the tie tolerance (max(5 %, 2 units))
        (_summ(seam=True), _summ(tw=50, ts=500, tier=2, soft=9), "B", "seam crack"),
        (_summ(tw=30, ts=30), _summ(tw=2, ts=90, soft=0), "B", "tear length (worst pose)"),
        (_summ(tw=2, ts=90, tier=0), _summ(tw=2, ts=80, tier=2), "B", "tear length (sum over poses)"),
        (_summ(tier=1, soft=0.0), _summ(tier=0, soft=5.0), "B", "penetration tier"),
        (_summ(soft=1.0), _summ(soft=0.5), "B", "soft score"),
        (_summ(soft=1.0), _summ(soft=0.97), "A", "near tie: smoother weights"),  # within 5 %: A is smoother
        (_summ(soft=0.0), _summ(soft=0.0), "A", "near tie: smoother weights"),  # same soft score, different roughness
    ]
    for a, b, win, by in cases:
        sc, dec = M.decide_region({"A": a, "B": b}, rough, order)
        assert dec["winner"] == win and dec["decided_by"] == by, (a, b, dec)
        assert min(sc, key=sc.get) == win
        assert dec["flag_g2"] == (by.startswith("near tie") and not dec["equivalent"])
    # identical behaviour (same soft score and roughness): the order is kept, nothing is flagged for G2 (review r2 nit:
    # decided_by "equivalent", not "near tie: smoother weights")
    sc, dec = M.decide_region({"A": _summ(soft=0.0), "B": _summ(soft=0.0)}, {"A": 0.0, "B": 0.0}, order)
    assert dec["winner"] == "A" and dec["equivalent"] and not dec["flag_g2"] and dec["decided_by"] == "equivalent"
    # smoother candidate listed first in a near tie; the raw-best but rougher one is second
    sc, dec = M.decide_region({"A": _summ(soft=1.0), "B": _summ(soft=0.97)}, {"A": 0.3, "B": 0.1}, order)
    assert dec["winner"] == "B" and dec["near_tie"] == ["B", "A"]


def _tie_classes_ref(vals, rel=0.05, floor=2.0):
    """The tear tie rule restated for the tests: ascending, a class starts at its smallest value v0 and holds every value
    <= v0 + max(rel x v0, floor); the class minimum represents it."""
    out, v0 = {}, None
    for c, v in sorted(vals.items(), key=lambda t: t[1]):
        if v0 is None or v - v0 > max(rel * v0, floor):
            v0 = v
        out[c] = v0
    return out


def test_C_region_score_encoding_preserves_class_order():
    """The scalar sorts like the ordered decision on (seam, tear-worst class, tear-sum class, tier) - tear lengths inside one
    tie class carry the same tear terms (encoding change of fix round 3) - and every seam failure ranks last."""
    rng = np.random.default_rng(11)
    pool = np.array([0, 1, 2, 3, 6, 40, 41, 42, 44, 100, 103, 105, 106, 110, 300, 314, 316])  # near-equal values on purpose
    keys = []
    for s, w, t, r, x in zip(rng.integers(0, 2, 400), rng.choice(pool, 400), rng.choice(pool, 400), rng.integers(0, 3, 400),
                             rng.uniform(0, 9, 400)):
        keys.append((int(s), int(w), int(max(t, w)), int(r), float(x)))  # the sum over poses is at least the worst pose
    summ = {f"c{i}": _summ(bool(k[0]), k[1], k[2], k[3], k[4]) for i, k in enumerate(keys)}
    order = list(summ)
    kk = dict(zip(order, keys))
    rough = {c: 0.0 for c in order}
    sc, dec = M.decide_region(summ, rough, order)
    tw, ts = {}, {}
    for s in (0, 1):
        tw.update(_tie_classes_ref({c: kk[c][1] for c in order if kk[c][0] == s}))
    for g in {(kk[c][0], tw[c]) for c in order}:
        ts.update(_tie_classes_ref({c: kk[c][2] for c in order if (kk[c][0], tw[c]) == g}))
    ck = {c: (kk[c][0], tw[c], ts[c], kk[c][3]) for c in order}
    assert dec["tear_class"] == {c: [tw[c], ts[c]] for c in order}
    assert len(set(tw.values())) < len({kk[c][1] for c in order})  # some near-equal tear lengths did merge
    for a, b in itertools.combinations(order, 2):
        if ck[a] != ck[b]:
            assert (sc[a] < sc[b]) == (ck[a] < ck[b]), (a, b, ck[a], ck[b])
    ok = [c for c in order if not kk[c][0]]
    assert set(dec["ranking"][len(ok):]) == set(order) - set(ok)  # every seam failure ranks after every candidate without one
    # outside near ties and below the seam tier (~1e14, where the soft fraction keeps only ~1/64) the ranking is exact
    tie = set(dec["near_tie"])
    by_key = sorted(order, key=lambda c: (ck[c], kk[c][4]))
    assert [c for c in dec["ranking"] if c not in tie and c in ok] == [c for c in by_key if c not in tie and c in ok]
    with pytest.raises(ValueError):
        M.decide_region({"A": _summ(tw=10 ** 6, ts=10 ** 6)}, {"A": 0.0}, ["A"])
    # the tie rule itself: 5 % of the smaller value, at least 2 units
    assert M.tie_classes({"a": 100, "b": 105, "c": 106}, 0.05, 2.0) == {"a": 100, "b": 100, "c": 106}
    assert M.tie_classes({"a": 0, "b": 2, "c": 3}, 0.05, 2.0) == {"a": 0, "b": 0, "c": 3}


def test_C_tear_tie_falls_through_and_flags_near_tie():
    """Review r2: two near-equal candidates (tear lengths 3 % apart, soft scores within 5 %) - before fix round 3 the 3-unit
    tear difference decided without a flag; now the tear lengths are equal, the near tie decides by smoothness and the region
    is flagged for G2. Tear lengths further apart (6 %) still decide."""
    order = ["A", "B"]
    rough = {"A": 0.1, "B": 0.2}
    near = {"A": _summ(tw=100, ts=120, soft=1.0), "B": _summ(tw=103, ts=118, soft=0.98)}
    sc, dec = M.decide_region(near, rough, order)
    assert dec["decided_by"] == "near tie: smoother weights" and dec["flag_g2"] and not dec["equivalent"]
    assert dec["winner"] == "A" and dec["near_tie"] == ["A", "B"] and dec["tear_tie"] == ["B"]
    assert sc["A"] < sc["B"] and dec["tear_class"] == {"A": [100, 118], "B": [100, 118]}
    # tied tear lengths, clearly different soft scores: the soft score decides (no flag; the tie is still listed)
    sc, dec = M.decide_region({"A": _summ(tw=100, ts=120, soft=1.0), "B": _summ(tw=104, ts=124, soft=0.5)}, rough, order)
    assert dec["winner"] == "B" and dec["decided_by"] == "soft score" and not dec["flag_g2"] and dec["tear_tie"] == ["A"]
    # tied tear lengths, different penetration tiers: the tier decides
    sc, dec = M.decide_region({"A": _summ(tw=100, ts=100, tier=2), "B": _summ(tw=104, ts=104, tier=0, soft=3.0)}, rough, order)
    assert dec["winner"] == "B" and dec["decided_by"] == "penetration tier"
    # 6 % apart: not equal, the smaller tear length wins as before
    sc, dec = M.decide_region({"A": _summ(tw=100, ts=100, soft=5.0), "B": _summ(tw=106, ts=106, soft=0.0)}, rough, order)
    assert dec["winner"] == "A" and dec["decided_by"] == "tear length (worst pose)" and dec["tear_tie"] == []
    # the tolerance comes from Params (thresholds.json skin_region_score): a stricter 1 % / 0-unit rule separates 100 / 103
    pr = M.Params(dict(M.load_thresholds(), skin_region_score={"tear_tie_rel": 0.01, "tear_tie_abs_units": 0}), H)
    sc, dec = M.decide_region(near, rough, order, pr)
    assert dec["winner"] == "A" and dec["decided_by"] == "tear length (worst pose)" and not dec["flag_g2"]


def _two_bone_bend(V, x_joint, deg, axis=(0, 0, 1)):
    heads = np.array([[0.0, 0, 0], [x_joint, 0, 0]])
    rest = bone_mats(heads)
    pose = rest.copy()
    pose[1] = rotate_about_head(rest[1], axis, deg)
    return rest, np.stack([rest, pose])


def test_C_lbs_candidates_and_hard_cut_loses(tmp_path):
    """Two-bone bend of a strip: numpy LBS of the primary weights reproduces P; a hard cut loses the child region."""
    V, F = strip(20)
    x = V[:, 0] / 0.1
    Wsmooth = np.stack([1 - np.clip((x - 0.4) / 0.2, 0, 1), np.clip((x - 0.4) / 0.2, 0, 1)], 1).astype(np.float32)
    Whard = np.stack([(x < 0.6), (x >= 0.6)], 1).astype(np.float32)
    rest, pm = _two_bone_bend(V, 0.05, 60)
    W = M.exporter_rule(Wsmooth)
    P1 = M.lbs(V, W, [0, 1], pm[1:], rest)[0]
    paths = write_case(str(tmp_path), V, F, {"rest": V, "bend": P1}, ["b1", "b2"], W, parents=[-1, 0], pose_mats=pm, rest_mats=rest)
    npzio.save_weights(os.path.join(str(tmp_path), "hard.npz"), ["b1", "b2"], Whard, meta={"candidate": "hard"})
    res, doc, out = run_case(str(tmp_path), paths, candidates={"hard": os.path.join(str(tmp_path), "hard.npz")})
    assert res["lbs_vs_eval_max_m"] < 1e-6
    sc = npzio.read_json(os.path.join(out, "region_scores.json"))
    det = npzio.read_json(os.path.join(out, "region_scores_detail.json"))
    assert set(sc["b2"]) == {"A", "hard"} and sc["b2"]["hard"] > sc["b2"]["A"]
    d = det["regions"]["b2"]
    assert d["decision"]["winner"] == "A" and d["candidates"]["hard"]["roughness"] > d["candidates"]["A"]["roughness"]
    assert {"seam_fail", "tear_worst", "tear_sum", "pen_tier", "soft", "torn_worst"} <= set(d["candidates"]["A"])


def test_C_rigid_candidate_loses_every_hinge_region(tmp_path):
    """Closed tube with three bones bent at two hinges (90 / 120 deg): the argmax one-hot ("rigid") candidate of smooth weights
    must lose in every region (the review r1 regression on synthetic data)."""
    V, F = tube(n_around=16, n_rings=61, r=0.01, length=0.3, closed=True)
    x = V[:, 0]
    a = np.clip((x - 0.09) / 0.02, 0, 1)
    b = np.clip((x - 0.19) / 0.02, 0, 1)
    Wsm = np.stack([1 - a, a * (1 - b), b], 1).astype(np.float32)
    rigid = np.zeros_like(Wsm)
    rigid[np.arange(len(V)), Wsm.argmax(1)] = 1
    heads = np.array([[0.0, 0, 0], [0.1, 0, 0], [0.2, 0, 0]])
    rest = bone_mats(heads)
    poses = {"rest": np.stack([rest] * 1)[0]}
    mats = [rest]
    for d1, d2 in ((90, 0), (0, 120), (60, 90)):
        p = rest.copy()
        p[1] = rotate_about_head(rest[1], (0, 0, 1), d1)
        child = rest[2].copy()
        child = p[1] @ np.linalg.inv(rest[1]) @ child
        p[2] = rotate_about_head(child, (0, 0, 1), d2)
        mats.append(p)
    pm = np.stack(mats)
    W = M.exporter_rule(Wsm)
    P = M.lbs(V, W, [0, 1, 2], pm, rest)
    names = ["rest", "h1", "h2", "both"]
    hds = np.stack([[m[:3, 3] for m in pmi] for pmi in pm])
    tls = hds + np.array([0.1, 0, 0])
    paths = write_case(str(tmp_path), V, F, {n: P[i] for i, n in enumerate(names)}, ["b1", "b2", "b3"], W, heads=hds, tails=tls,
                       parents=[-1, 0, 1], pose_mats=pm, rest_mats=rest)
    npzio.save_weights(os.path.join(str(tmp_path), "rigid.npz"), ["b1", "b2", "b3"], rigid, meta={"candidate": "rigid"})
    _, _, out = run_case(str(tmp_path), paths, candidates={"rigid": os.path.join(str(tmp_path), "rigid.npz")})
    sc = npzio.read_json(os.path.join(out, "region_scores.json"))
    for r in ("b1", "b2", "b3"):
        assert sc[r]["rigid"] > sc[r]["A"], (r, sc[r])


def _tube_three_bones(tmp, bends):
    """Closed tube along X: weightless root ``cog`` (head below the tube) -> b1 (0..0.1) -> b2 (0.1..0.2) -> b3 (0.2..0.3), smooth
    weights over the b1/b2 and b2/b3 joints; ``bends`` = [(deg at b2, deg at b3)] for the poses after rest (about Z). Returns
    (paths, rigid.npz) with the argmax one-hot ("rigid") candidate."""
    V, F = tube(n_around=16, n_rings=61, r=0.01, length=0.3, closed=True)
    x = V[:, 0]
    a = np.clip((x - 0.09) / 0.02, 0, 1)
    b = np.clip((x - 0.19) / 0.02, 0, 1)
    Wsm = np.stack([np.zeros_like(x), 1 - a, a * (1 - b), b], 1).astype(np.float32)
    bones = ["cog", "b1", "b2", "b3"]
    heads = np.array([[0.0, 0, -0.05], [0.0, 0, 0], [0.1, 0, 0], [0.2, 0, 0]])
    rest = bone_mats(heads)
    mats = [rest]
    for d1, d2 in bends:
        p = rest.copy()
        p[2] = rotate_about_head(rest[2], (0, 0, 1), d1)
        p[3] = rotate_about_head(p[2] @ np.linalg.inv(rest[2]) @ rest[3], (0, 0, 1), d2)
        mats.append(p)
    pm = np.stack(mats)
    W = M.exporter_rule(Wsm)
    P = M.lbs(V, W, [0, 1, 2, 3], pm, rest)
    names = ["rest"] + [f"p{i}" for i in range(len(bends))]
    hds = pm[:, :, :3, 3]
    tls = hds + np.einsum("pbij,j->pbi", pm[:, :, :3, :3], [0.1, 0, 0])
    paths = write_case(tmp, V, F, {n: P[i] for i, n in enumerate(names)}, bones, W, heads=hds, tails=tls,
                       parents=[-1, 0, 1, 2], pose_mats=pm, rest_mats=rest)
    rigid = np.zeros_like(Wsm)
    rigid[np.arange(len(V)), Wsm.argmax(1)] = 1
    npzio.save_weights(os.path.join(tmp, "rigid.npz"), bones, rigid, meta={"candidate": "rigid"})
    return paths, os.path.join(tmp, "rigid.npz")


def test_C_not_exercised_region_has_no_winner(tmp_path):
    """Review r2 item 1: a region whose joints never turn (b3: b2 bends 90 / 45 deg, b3 stays straight on b2) cannot be judged -
    every candidate gets the same score, decided_by "not_exercised", no winner, G2 flag; b1 counts as exercised through its
    CHILD joint (its own parent ``cog`` carries no weight and is walked over). Once b3 bends 120 deg the rigid cut loses it."""
    paths, rigid = _tube_three_bones(str(tmp_path), [(90.0, 0.0), (45.0, 0.0)])
    res, doc, out = run_case(str(tmp_path), paths, candidates={"rigid": rigid})
    ex = doc["summary"]["region_exercise"]
    assert ex["b3"]["exercised"] is False and ex["b3"]["max_deg"] < 0.01 and ex["b3"]["joints"] == ["b3/b2"]
    assert ex["b2"]["exercised"] and ex["b2"]["max_deg"] == pytest.approx(90.0, abs=1e-6)
    assert ex["b1"]["exercised"] and ex["b1"]["max_deg"] == pytest.approx(90.0, abs=1e-6) and ex["b1"]["joints"] == ["b2/b1"]
    assert doc["summary"]["not_exercised"] == ["b3"] and res["not_exercised"] == ["b3"]
    sc = npzio.read_json(os.path.join(out, "region_scores.json"))
    det = npzio.read_json(os.path.join(out, "region_scores_detail.json"))
    assert sc["b3"] == {"A": M.NOT_EXERCISED_SCORE, "rigid": M.NOT_EXERCISED_SCORE}  # equal: no preference for B's selector
    d3 = det["regions"]["b3"]["decision"]
    assert d3["winner"] is None and d3["decided_by"] == "not_exercised" and d3["flag_g2"] and d3["not_exercised"]
    assert "b3" in det["flag_g2"] and det["not_exercised"] == ["b3"] and "for_skin_select" in det
    assert det["regions"]["b2"]["decision"]["winner"] == "A" and sc["b2"]["rigid"] > sc["b2"]["A"]
    # the same rig with b3 bent: exercised, and the rigid cut loses it
    d2 = os.path.join(str(tmp_path), "bent")
    os.makedirs(d2)
    paths, rigid = _tube_three_bones(d2, [(90.0, 0.0), (0.0, 120.0)])
    _, doc2, out2 = run_case(d2, paths, candidates={"rigid": rigid})
    assert doc2["summary"]["not_exercised"] == [] and doc2["summary"]["region_exercise"]["b3"]["max_deg"] == pytest.approx(120.0)
    sc2 = npzio.read_json(os.path.join(out2, "region_scores.json"))
    assert sc2["b3"]["rigid"] > sc2["b3"]["A"]
    # without pose_mats nothing is measured: every region counts as exercised
    V, F = strip()
    p3 = os.path.join(str(tmp_path), "nomats")
    os.makedirs(p3)
    _, doc3, _ = run_case(p3, write_case(p3, V, F, {"rest": V, "x": V * 1.01}, ["bone"], np.ones((len(V), 1), np.float32)))
    assert doc3["summary"]["not_exercised"] == [] and doc3["summary"]["region_exercise"]["bone"]["exercised"] is None


def test_C_candidate_files_keyed_by_meta_candidate(tmp_path):
    """Review r2 item 4: ``--candidate-file`` scores a weights file under its own meta.candidate (the key B's skin_select maps
    by); a name used twice is an error."""
    V, F = strip(20)
    x = V[:, 0] / 0.1
    Wsmooth = np.stack([1 - np.clip((x - 0.4) / 0.2, 0, 1), np.clip((x - 0.4) / 0.2, 0, 1)], 1).astype(np.float32)
    rest, pm = _two_bone_bend(V, 0.05, 60)
    W = M.exporter_rule(Wsmooth)
    P1 = M.lbs(V, W, [0, 1], pm[1:], rest)[0]
    tmp = str(tmp_path)
    paths = write_case(tmp, V, F, {"rest": V, "bend": P1}, ["b1", "b2"], W, parents=[-1, 0], pose_mats=pm, rest_mats=rest)
    files = []
    for nm, shift in (("A_region", 0.0), ("B_transfer", 0.1)):
        Wc = np.stack([1 - np.clip((x - 0.4 - shift) / 0.2, 0, 1), np.clip((x - 0.4 - shift) / 0.2, 0, 1)], 1).astype(np.float32)
        files.append(os.path.join(tmp, f"{nm}.npz"))
        npzio.save_weights(files[-1], ["b1", "b2"], Wc, meta={"candidate": nm})
    out = os.path.join(tmp, "cand")
    rc = M.main(["--mesh", paths[0], "--poses", paths[1], "--weights", paths[2], "--out-dir", out, "--candidate-file", files[0],
                 "--candidate-file", files[1], "--candidate", f"hard={files[1]}"])
    assert rc == 0
    sc = npzio.read_json(os.path.join(out, "region_scores.json"))
    assert set(sc["b2"]) == {"A", "A_region", "B_transfer", "hard"}
    assert M._parse_candidates([], files) == {"A_region": files[0], "B_transfer": files[1]}
    with pytest.raises(ValueError, match="used twice"):
        M._parse_candidates([f"A_region={files[1]}"], files[:1])


# ------------------------------------------------------------------------------------------------------------------- limb leak
def test_C_region_score_limb_leak_gate():
    """I2 (review B r3): in a gate region a candidate with more leaking rows than the band (3) is dropped BEFORE the tear step
    (it ranks after the others although it tears far less); when every candidate leaks nobody is dropped (the scores equal the
    ungated ones) and the region is flagged for G2; without leak data (not a gate region) nothing changes; seam cracks still
    come first; the band comes from thresholds.json."""
    order = ["A", "B"]
    rough = {"A": 0.1, "B": 0.2}
    a, b = _summ(tw=300, ts=900), _summ(tw=10, ts=20)  # B tears far less
    sc0, d0 = M.decide_region({"A": a, "B": b}, rough, order)
    assert d0["winner"] == "B" and not d0["leak_gate"]["applies"] and not d0["flag_g2"]
    sc, dec = M.decide_region({"A": a, "B": b}, rough, order, leak={"A": 3, "B": 4})
    assert dec["winner"] == "A" and dec["decided_by"] == "limb leak" and dec["leak_gate"]["dropped"] == ["B"]
    assert dec["leak_gate"]["rows"] == {"A": 3, "B": 4} and not dec["flag_g2"] and sc["B"] > M.ENC["leak"] > sc["A"]
    sc2, d2 = M.decide_region({"A": a, "B": b}, rough, order, leak={"A": 5, "B": 40})
    assert d2["winner"] == "B" and d2["leak_gate"]["all_leak"] and d2["leak_gate"]["dropped"] == [] and d2["flag_g2"]
    assert sc2 == sc0
    sc3, d3 = M.decide_region({"A": _summ(seam=True), "B": b}, rough, order, leak={"A": 0, "B": 9})
    assert d3["winner"] == "B" and d3["decided_by"] == "seam crack" and sc3["A"] > sc3["B"]
    # the dropped candidates' tear lengths form their own tie classes: dropped C (12) does not join B's class (10)
    sc4, d4 = M.decide_region({"A": a, "B": b, "C": _summ(tw=12, ts=21)}, {**rough, "C": 0.0}, ["A", "B", "C"],
                              leak={"A": 0, "B": 0, "C": 7})
    assert d4["winner"] == "B" and d4["tear_class"]["B"] == [10, 20] and d4["tear_class"]["C"] == [12, 21]
    pr = M.Params(dict(M.load_thresholds(), weights_limb_leak={"green": [None, 5], "red": [None, 10]}), H)
    _, d5 = M.decide_region({"A": a, "B": b}, rough, order, pr, leak={"A": 3, "B": 4})
    assert d5["winner"] == "B" and d5["leak_gate"]["dropped"] == [] and d5["leak_gate"]["band"] == 5


def _torso_arm_case(tmp):
    """Torso box (bone ``chest`` along Z) and a closed arm tube along +X from the shoulder (bone ``L_UpperArm``, 0.2 m), clean
    weights (torso -> chest, arm -> upper arm), rest + an arm lift. ``leaky.npz`` (meta.candidate B_transfer) moves 0.3 of the
    torso rows below z = 0.3 (> 0.2 m from the upper-arm segment, so farther than 0.75 x its length) to the upper arm. Returns
    (paths, leaky path, number of welded leaking rows)."""
    Vb, Fb = subdivided_box((0.0, 0.0, 0.3), (0.2, 0.1, 0.4), k=6)
    Vt, Ft = tube(n_around=12, n_rings=21, r=0.02, length=0.2, x0=0.1, closed=True)
    V = np.concatenate([Vb, Vt + [0.0, 0.0, 0.45]])
    F = np.concatenate([Fb, Ft + len(Vb)])
    torso = np.arange(len(V)) < len(Vb)
    W = np.stack([torso, ~torso], 1).astype(np.float32)
    bones = ["chest", "L_UpperArm"]
    rest = bone_mats(np.array([[0.0, 0, 0.1], [0.1, 0, 0.45]]))
    pose = rest.copy()
    pose[1] = rotate_about_head(rest[1], (0, 1, 0), -40.0)
    pm = np.stack([rest, pose])
    P = M.lbs(V, M.exporter_rule(W), [0, 1], pm, rest)
    hd = pm[:, :, :3, 3]
    tl = hd + np.einsum("pbij,bj->pbi", pm[:, :, :3, :3], np.array([[0, 0, 0.4], [0.2, 0, 0]]))
    paths = write_case(tmp, V, F, {"rest": P[0], "lift": P[1]}, bones, W, heads=hd, tails=tl, parents=[-1, 0], pose_mats=pm,
                       rest_mats=rest)
    far = torso & (V[:, 2] < 0.3)
    leaky = W.copy()
    leaky[far] = [0.7, 0.3]
    npzio.save_weights(os.path.join(tmp, "leaky.npz"), bones, leaky, meta={"candidate": "B_transfer"})
    return paths, os.path.join(tmp, "leaky.npz"), int(len(np.unique(np.round(V[far], 9), axis=0)))


def test_C_limb_leak_metric_light_and_gate(tmp_path):
    """I2: ``weights_limb_leak`` end to end - the clean primary has no leaking row (green light, per-region table empty); the
    leaky candidate's torso rows far from the upper arm are counted per side / limb / region (welded rows), it is dropped in the
    gate region ``chest`` (decided_by "limb leak"), the arm region is not gated by its rows; with the leaky weights as the primary
    the light is red."""
    tmp = str(tmp_path)
    paths, leaky, n_far = _torso_arm_case(tmp)
    assert n_far > 10
    res, doc, out = run_case(tmp, paths, candidates={"B_transfer": leaky})
    lk = doc["summary"]["weights_limb_leak"]
    assert lk["measured"] and lk["rows"] == 0 and doc["lights"]["weights_limb_leak"] == "green" and lk["by_region"] == {}
    assert lk["band"] == 3 and "chest" in lk["gate_regions"] and "mask" not in lk
    det = npzio.read_json(os.path.join(out, "region_scores_detail.json"))
    cl = det["limb_leak"]["candidates"]["B_transfer"]
    assert cl["rows"] == n_far and cl["by_limb"]["arm_L"]["rows"] == n_far and cl["by_limb"]["arm_L"]["w_max"] == pytest.approx(0.3)
    assert cl["by_limb"]["arm_L"]["bones"] == ["L_UpperArm"] and "thigh_L" not in cl["by_limb"]
    ch = det["regions"]["chest"]
    assert ch["candidates"]["B_transfer"]["limb_leak"]["rows"] == n_far and ch["candidates"]["A"]["limb_leak"] == {"rows": 0}
    assert ch["decision"]["leak_gate"]["dropped"] == ["B_transfer"] and ch["decision"]["winner"] == "A"
    assert ch["decision"]["decided_by"] == "limb leak" and det["limb_leak"]["dropped"] == {"chest": ["B_transfer"]}
    sc = npzio.read_json(os.path.join(out, "region_scores.json"))
    assert sc["chest"]["B_transfer"] > M.ENC["leak"] > sc["chest"]["A"]
    assert det["regions"]["L_UpperArm"]["decision"]["leak_gate"]["dropped"] == []  # no leaking row inside the arm region
    # the leaky weights as the primary: the light counts its rows (red above 10)
    d2 = os.path.join(tmp, "primary_leaky")
    os.makedirs(d2)
    r2 = M.run(paths[0], paths[1], leaky, d2)
    doc2 = npzio.read_json(os.path.join(d2, "metrics.json"))
    assert r2["ok"] and doc2["lights"]["weights_limb_leak"] == "red" and doc2["summary"]["weights_limb_leak"]["rows"] == n_far
    det2 = doc2["summary"]["lights_detail"]["weights_limb_leak"]
    assert det2["worst_region"]["region"] == "chest" and det2["by_limb"] == {"arm_L": n_far}


# ------------------------------------------------------------------------------------------------------------------- joint volume
def _bent_tube_case(tmp, deg=90.0, head_offset=(0.0, 0.0, 0.0), cloth=True):
    Vt, Ft = tube(closed=True)
    parts_V, parts_F = [Vt], [Ft]
    if cloth:  # cloth patch over the joint: its own island, weighted to the parent
        Vb, Fb = subdivided_box((0.1, 0.0, 0.013), (0.02, 0.015, 0.004), k=10)
        parts_V.append(Vb)
        parts_F.append(Fb + len(Vt))
    V = np.concatenate(parts_V)
    F = np.concatenate(parts_F)
    x = V[:, 0]
    w2 = np.clip((x - 0.09) / 0.02, 0, 1)
    W = np.stack([1 - w2, w2], 1).astype(np.float32)
    W[len(Vt):] = [1.0, 0.0]
    heads = np.array([[0.0, 0, 0], [0.1, 0, 0]]) + [[0, 0, 0], head_offset]
    rest = bone_mats(heads)
    pose = rest.copy()
    pose[1] = rotate_about_head(rest[1], (0, 0, 1), deg)
    pm = np.stack([rest, pose])
    P = M.lbs(V, M.exporter_rule(W), [0, 1], pm, rest)
    hd = np.stack([rest[:, :3, 3], pose[:, :3, 3]])
    tl = np.stack([hd[0] + [[0.1, 0, 0], [0.1, 0, 0]], [hd[1][0] + [0.1, 0, 0], hd[1][1] + pose[1][:3, :3] @ [0.1, 0, 0]]])
    return write_case(tmp, V, F, {"rest": P[0], "bend": P[1]}, ["b1", "b2"], W, heads=hd, tails=tl, parents=[-1, 0],
                      pose_mats=pm, rest_mats=rest), len(Vt)


def test_C_joint_volume_ball_occupancy(tmp_path):
    paths, n_tube = _bent_tube_case(str(tmp_path), 120.0)
    _, doc, _ = run_case(str(tmp_path), paths)
    j = doc["joints"]["volume"]["b2"]
    assert j["measurable"] and j["rest_occupancy"] > 0.95 and j["ratio"]["rest"] == pytest.approx(1.0)
    assert j["radius_m"] == pytest.approx(0.8 * j["r_limb"]) and j["r_limb"] == pytest.approx(0.01, rel=0.05)
    assert 0.2 < j["ratio"]["bend"] < 0.98  # LBS collapses the joint core at 120 deg
    assert j["island"] == 0  # the tube, not the cloth patch over the joint
    assert doc["poses"]["bend"]["b2"]["volume_ratio"] == pytest.approx(j["ratio"]["bend"])
    # the largest ratio is reported next to the smallest (review r2 nit; the light detail: test_C_joint_volume_mirror_consistent)
    assert j["max_ratio"] == pytest.approx(1.0) and j["max_pose"] == "rest" and j["min_pose"] == "bend"
    # a wider ball (the review r1 probe radius ~ 2 x limb radius) is a parameter
    _, doc2, _ = run_case(str(tmp_path), paths, ball_factor=2.0)
    assert doc2["joints"]["volume"]["b2"]["radius_m"] == pytest.approx(2.0 * j["r_limb"])


def test_C_joint_volume_not_measurable_with_reason(tmp_path):
    paths, _ = _bent_tube_case(str(tmp_path), 90.0, head_offset=(0.0, 0.0, 0.03), cloth=False)  # joint 3 radii above the tube
    _, doc, _ = run_case(str(tmp_path), paths)
    j = doc["joints"]["volume"]["b2"]
    assert not j["measurable"] and "not inside the limb" in j["reason"] and j["ratio"] == {}
    assert doc["poses"]["bend"]["b2"]["volume_ratio"] is None
    assert doc["summary"]["lights_detail"]["deform_joint_volume"]["not_measurable"] == {} or "deform_joint_volume" in \
        doc["summary"]["lights_not_evaluated"]


def test_C_joint_volume_mirror_consistent(tmp_path):
    """Mirrored arms (L along +X, R along -X), mirrored elbow bends: equal ratios and rest occupancy, mirror check consistent."""
    Vl, Fl = tube(closed=True, x0=0.02)
    Vr = Vl * [-1, 1, 1]
    Fr = Fl[:, ::-1]
    V = np.concatenate([Vl, Vr])
    F = np.concatenate([Fl, Fr + len(Vl)])
    nl = len(Vl)
    xa = np.abs(V[:, 0])
    w = np.clip((xa - 0.11) / 0.02, 0, 1)
    W = np.zeros((len(V), 4), np.float32)
    W[:nl, 0], W[:nl, 1] = 1 - w[:nl], w[:nl]
    W[nl:, 2], W[nl:, 3] = 1 - w[nl:], w[nl:]
    bones = ["L_UpperArm", "L_ForeArm", "R_UpperArm", "R_ForeArm"]
    heads = np.array([[0.02, 0, 0], [0.12, 0, 0], [-0.02, 0, 0], [-0.12, 0, 0]])
    rest = bone_mats(heads)
    mats = {"rest": rest}
    for s, sgn in (("L", 1), ("R", -1)):
        p = rest.copy()
        i = 1 if s == "L" else 3
        p[i] = rotate_about_head(rest[i], (0, 0, 1), sgn * 100.0)
        mats[f"elbow_{s}_p100"] = p
    names = list(mats)
    pm = np.stack([mats[n] for n in names])
    P = M.lbs(V, M.exporter_rule(W), [0, 1, 2, 3], pm, rest)
    hd = pm[:, :, :3, 3]
    tl = hd + np.array([[0.1, 0, 0], [0.1, 0, 0], [-0.1, 0, 0], [-0.1, 0, 0]])
    paths = write_case(str(tmp_path), V, F, {n: P[i] for i, n in enumerate(names)}, bones, W, heads=hd, tails=tl,
                       parents=[-1, 0, -1, 2], pose_mats=pm, rest_mats=rest)
    _, doc, _ = run_case(str(tmp_path), paths)
    vol = doc["joints"]["volume"]
    assert vol["elbow_L"]["ratio"]["elbow_L_p100"] == pytest.approx(vol["elbow_R"]["ratio"]["elbow_R_p100"], abs=1e-9)
    assert vol["elbow_L"]["ratio"]["elbow_L_p100"] < 0.99
    mir = doc["joints"]["volume_mirror"]["elbow"]
    assert mir["consistent"] and mir["n_pose_pairs"] >= 2 and mir["max_ratio_diff"]["diff"] < 1e-9
    assert mir["rest_occupancy"][0] == pytest.approx(mir["rest_occupancy"][1], abs=1e-12)
    lv = doc["summary"]["lights_detail"]["deform_joint_volume"]  # the light detail gives the largest ratio next to the smallest
    assert lv["min_ratio"] < 0.99 and lv["max_ratio"] == pytest.approx(1.0) and lv["max_joint"] in ("elbow_L", "elbow_R")


# ------------------------------------------------------------------------------------------------------------------- candy wrapper
def _forearm_case(tmp, twist: bool, deg=80.0):
    """Upper arm 0..0.1, forearm 0.1..0.2, hand 0.2..0.26 along +X (one closed tube, radius 1 cm); the hand twists by ``deg``
    about its own axis; with ``twist`` a weighted L_ForeArm_twist bone (0.15..0.2) takes half of it."""
    V, F = tube(n_around=24, n_rings=79, r=0.01, length=0.26, closed=True)
    x = V[:, 0]
    bones = ["L_UpperArm", "L_ForeArm", "L_Hand"] + (["L_ForeArm_twist"] if twist else [])
    heads = np.array([[0.0, 0, 0], [0.1, 0, 0], [0.2, 0, 0]] + ([[0.15, 0, 0]] if twist else []))
    parents = [-1, 0, 1] + ([1] if twist else [])
    e = np.clip((x - 0.09) / 0.02, 0, 1)  # elbow blend
    h = np.clip((x - 0.195) / 0.01, 0, 1)  # wrist blend (narrow, as the wrist crease band)
    W = np.zeros((len(V), len(bones)), np.float32)
    W[:, 0] = 1 - e
    if twist:
        t = np.clip((x - 0.1) / 0.1, 0, 1)  # forearm -> twist share along the forearm
        W[:, 1] = e * (1 - h) * (1 - t)
        W[:, 3] = e * (1 - h) * t
    else:
        W[:, 1] = e * (1 - h)
    W[:, 2] = e * h
    rest = bone_mats(heads)
    pose = rest.copy()
    pose[2] = rotate_about_head(rest[2], (1, 0, 0), deg)
    if twist:
        pose[3] = rotate_about_head(rest[3], (1, 0, 0), deg / 2)
    pm = np.stack([rest, pose])
    P = M.lbs(V, M.exporter_rule(W), list(range(len(bones))), pm, rest)
    hd = pm[:, :, :3, 3]
    tl = hd.copy()
    tl[:, 0] = [0.1, 0, 0]
    tl[:, 1] = [0.2, 0, 0]
    tl[:, 2] = [0.26, 0, 0]
    if twist:
        tl[:, 3] = [0.2, 0, 0]
    tags = {"rest": ["rest", "standard"], "pron": ["extreme", "forearm_twist_L"]}
    return write_case(tmp, V, F, {"rest": P[0], "pron": P[1]}, bones, W, heads=hd, tails=tl, tags=tags, parents=parents,
                      pose_mats=pm, rest_mats=rest)


def test_C_candy_wrapper_slices_wrist_band_and_twist_cap(tmp_path):
    paths = _forearm_case(str(tmp_path), twist=False)
    _, doc, _ = run_case(str(tmp_path), paths)
    c = doc["candy_wrapper"]["pron"]["L"]
    assert set(c["slices"]) == {"0.5", "0.75", "0.9", "wrist"}
    assert c["slices"]["0.5"] == pytest.approx(1.0, abs=1e-6)  # the mid-length section does not see a wrist twist
    assert c["slices"]["wrist"] < 0.95 and c["min"] == min(v for v in c["slices"].values() if v is not None)
    assert doc["candy_wrapper"]["rest"]["L"]["min"] == pytest.approx(1.0, abs=1e-6)
    det = doc["summary"]["lights_detail"]["deform_candy_wrapper"]
    assert det["twist"]["L"]["note"] == "no twist bones" and det["capped_at_yellow"]
    assert doc["lights"]["deform_candy_wrapper"] in ("yellow", "red")  # never green without twist bones
    if det["min_ratio"] >= 0.7:
        assert doc["lights"]["deform_candy_wrapper"] == "yellow"
    # with a weighted forearm twist bone the wrist keeps more section and nothing caps the light
    p2 = os.path.join(str(tmp_path), "tw")
    os.makedirs(p2)
    _, doc2, _ = run_case(p2, _forearm_case(p2, twist=True))
    c2 = doc2["candy_wrapper"]["pron"]["L"]
    assert doc2["twist"]["L"]["weighted"] and c2["slices"]["wrist"] > c["slices"]["wrist"]
    det2 = doc2["summary"]["lights_detail"]["deform_candy_wrapper"]
    assert not det2["capped_at_yellow"] or "L" not in det2["capped_at_yellow"]


# ------------------------------------------------------------------------------------------------------------------- files
def test_C_regions_and_fields_npz(tmp_path):
    V, F = strip()
    W = np.zeros((len(V), 2), np.float32)
    W[:, 0] = V[:, 0] < 0.05
    W[:, 1] = 1 - W[:, 0]
    paths = write_case(str(tmp_path), V, F, {"rest": V}, ["a", "b"], W)
    _, doc, out = run_case(str(tmp_path), paths)
    reg = M.load_regions_npz(os.path.join(out, "regions.npz"))
    assert set(reg) == {"a", "b"} and sum(m.sum() for m in reg.values()) == len(V)
    with np.load(os.path.join(out, "regions.npz"), allow_pickle=False) as z:
        assert z["masks"].dtype == bool and json.loads(str(z["meta"]))["source"] == "dominant bone"
    _, doc2, _ = run_case(str(tmp_path), paths, regions_path=os.path.join(out, "regions.npz"))
    assert doc2["summary"]["region_source"] == "regions.npz" and doc2["summary"]["regions"] == ["a", "b"]
    with np.load(os.path.join(out, "vertex_fields.npz"), allow_pickle=False) as z:
        assert set(z.files) == {"names", "stretch", "compress", "area", "penetration", "contact", "torn", "region_of_vertex",
                                "region_names", "meta"}
        assert z["stretch"].dtype == np.float32 and z["torn"].dtype == np.uint8 and z["region_of_vertex"].dtype == np.int16
        assert z["stretch"].shape == (1, len(V))

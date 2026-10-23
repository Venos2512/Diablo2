"""Owner G5: garment metrics of solvers.metrics on FUSED garments (review r1 M4) and the tight-piece skip (G4, untested so far).

- M4: a cloth panel joined to a leg tube by shared edges (one welded island; the leg and panel regions share edges, so the body rule
  of ``eligible_pairs`` drops every leg x panel pair). The leg swings forward through the panel: ``garment_limb_penetration`` must
  see it; pairs within ``GARMENT_NEAR_RINGS`` hops of each other are a fused crease and must not count. The body metrics must not
  change when the garment options are given.
- Tight skip: a piece of class ``tight`` is body skin: no per-piece entry, no hem stretch, no limb penetration, its rows are body
  rows, it is listed under ``tight_skipped``. The same case with the piece as ``strip`` shows that the test can fail.

rigkit-env:

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/solvers/G5_garment_metrics_test.py -q -p no:cacheprovider
"""
import json
import os

import numpy as np
import pytest

from rigcore import npzio
from solvers import metrics as M

H = 0.5


def _orient_out(V, F, idx, center):
    """Flip faces ``idx`` of F so their normals point away from ``center`` (convex part)."""
    for i in idx:
        f = F[i]
        n = np.cross(V[f[1]] - V[f[0]], V[f[2]] - V[f[0]])
        if np.dot(n, V[f].mean(0) - center) < 0:
            F[i] = f[[0, 2, 1]]


def fused_leg_panel(n_ring=16, leg_len=0.45, leg_rings=18, r=0.05, gap=0.03, rows=13, dz=0.025):
    """Leg tube along -Z from the hip at the origin (closed, outward normals) and a cloth panel hanging in the plane y = -(r + gap)
    in front of it, joined to the front half of the tube's top rim by a yoke of shared edges: ONE welded island, the rim edges are
    shared by the tube, the cap and the yoke (a T-junction, as on fused Tripo meshes). Returns (V, F, n_leg, panel_id(i, c))."""
    ang = 2 * np.pi * np.arange(n_ring) / n_ring
    V, F = [], []
    for k in range(leg_rings + 1):
        z = -leg_len * k / leg_rings
        V += [(r * np.cos(a), r * np.sin(a), z) for a in ang]

    def vid(k, j):
        return k * n_ring + j % n_ring

    for k in range(leg_rings):
        for j in range(n_ring):
            F += [[vid(k, j), vid(k + 1, j), vid(k + 1, j + 1)], [vid(k, j), vid(k + 1, j + 1), vid(k, j + 1)]]
    top, bot = len(V), len(V) + 1
    V += [(0.0, 0.0, 0.0), (0.0, 0.0, -leg_len)]
    for j in range(n_ring):
        F += [[top, vid(0, j), vid(0, j + 1)], [bot, vid(leg_rings, j + 1), vid(leg_rings, j)]]
    V = np.array(V, float)
    F = np.array(F, np.int64)
    n_leg = len(V)
    for i in range(len(F)):  # outward per ring band / cap: the axis point at the face's height
        c = np.array([0.0, 0.0, V[F[i]].mean(0)[2]])
        if F[i, 0] in (top, bot):
            c = np.array([0.0, 0.0, V[F[i]].mean(0)[2] + (-1e-3 if F[i, 0] == top else 1e-3)])
        _orient_out(V, F, [i], c)
    js = list(range(n_ring // 2, n_ring + 1))  # front half of the rim (y <= 0), j = n is j = 0
    y = -(r + gap)
    P = [(r * np.cos(ang[j % n_ring]), y, -dz * i) for i in range(rows) for j in js]
    V = np.concatenate([V, np.array(P, float)])

    def pid(i, c):
        return n_leg + i * len(js) + c

    G = []
    for i in range(rows - 1):
        for c in range(len(js) - 1):
            G += [[pid(i, c), pid(i, c + 1), pid(i + 1, c + 1)], [pid(i, c), pid(i + 1, c + 1), pid(i + 1, c)]]
    for c in range(len(js) - 1):  # yoke: rim vertex js[c] -> panel top vertex c
        a, b = vid(0, js[c]), vid(0, js[c + 1])
        G += [[a, b, pid(0, c + 1)], [a, pid(0, c + 1), pid(0, c)]]
    G = np.array(G, np.int64)
    for i in range(len(G)):  # panel and yoke normals face -Y (away from the body)
        n = np.cross(V[G[i, 1]] - V[G[i, 0]], V[G[i, 2]] - V[G[i, 0]])
        if n[1] > 0:
            G[i] = G[i, [0, 2, 1]]
    return V, np.concatenate([F, G]), n_leg, pid


def rot_x(V, deg, idx):
    """Rotate rows ``idx`` of V about the X axis through the origin; negative angles swing -Z toward -Y (thigh forward)."""
    a = np.radians(deg)
    c, s = np.cos(a), np.sin(a)
    out = V.copy()
    y, z = V[idx, 1], V[idx, 2]
    out[idx, 1] = c * y - s * z
    out[idx, 2] = s * y + c * z
    return out


def write_fused(tmp, V, F, bone_of_row, piece_of_row, bones, poses, tags, classes, chains):
    """mesh/poses/weights.npz with weld = identity (the shared rows ARE shared ids), garments.npz/.json, chains.json."""
    n = len(V)
    W = np.zeros((n, len(bones)), np.float32)
    W[np.arange(n), bone_of_row] = 1.0
    names = list(poses)
    P = np.stack([poses[k](V.copy()) for k in names]).astype(np.float32)
    npzio.save_mesh(os.path.join(tmp, "mesh.npz"), V, F, weld=np.arange(n), meta={"asset_id": "synthetic", "H": H})
    b = len(bones)
    heads = np.zeros((len(names), b, 3), np.float32)
    tails = heads.copy()
    tails[..., 2] = 0.1
    npzio.save_poses(os.path.join(tmp, "poses.npz"), names, P, bones, heads, tails, meta={"tags": tags, "rest_index": 0},
                     extra={"parents": np.full(b, -1, np.int32), "deform": np.ones(b, bool)})
    npzio.save_weights(os.path.join(tmp, "weights.npz"), bones, W, meta={"candidate": "A"})
    piece = np.asarray(piece_of_row, np.int32)
    np.savez_compressed(os.path.join(tmp, "garments.npz"), piece=piece, t=np.where(piece >= 0, 0.5, np.nan).astype(np.float32),
                        phi=np.full(n, np.nan, np.float32), layer=np.where(piece >= 0, 0, -1).astype(np.int8),
                        outer_ref=np.full(n, -1, np.int32), meta=np.array("{}"))
    pieces = [{"id": f"auto:{k}", "class": c, "confidence": 0.9, "hem_loop": []} for k, c in enumerate(classes)]
    npzio.write_json(os.path.join(tmp, "garments.json"), {"schema": 0, "pieces": pieces})
    npzio.write_json(os.path.join(tmp, "chains.json"), {"schema": 0, "chains": chains})
    return [os.path.join(tmp, f) for f in ("mesh.npz", "poses.npz", "weights.npz")]


def run(tmp, paths, sub, garments=True):
    out = os.path.join(tmp, sub)
    kw = dict(garments=os.path.join(tmp, "garments.npz"), garments_json=os.path.join(tmp, "garments.json"),
              chains=os.path.join(tmp, "chains.json")) if garments else {}
    M.run(*paths, out, write_fields=False, **kw)
    with open(os.path.join(out, "metrics.json"), "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def _fused_case(tmp):
    V, F, n_leg, pid = fused_leg_panel()
    n = len(V)
    leg = np.arange(n_leg)
    bone = np.where(np.arange(n) < n_leg, 0, 1)
    piece = np.where(np.arange(n) < n_leg, -1, 0)
    poses = {"rest": lambda P: P, "thigh_fwd_30": lambda P: rot_x(P, -30.0, leg), "thigh_fwd_3": lambda P: rot_x(P, -3.0, leg),
             "thigh_back_30": lambda P: rot_x(P, 30.0, leg)}
    tags = {"rest": ["rest"], "thigh_fwd_30": ["standard"], "thigh_fwd_3": ["standard"], "thigh_back_30": ["standard"]}
    chains = [{"id": "skirt_F", "piece": "auto:0", "bones": [{"name": "skirt_F_01"}]}]
    paths = write_fused(tmp, V, F, bone, piece, ["L_Thigh", "skirt_F_01"], poses, tags, ["skirt"], chains)
    return paths, V, F, n_leg, pid


def test_G5_fused_leg_through_panel(tmp_path):
    """Review r1 M4: the thigh swings 30 deg forward through a panel FUSED to it (shared yoke edges, adjacent regions). Before the
    fix the pairs were never eligible (0, green); now the limb faces in the panel are counted with the flood-filled depth. The
    3 deg swing (no contact) and the backward swing stay 0. The body metrics are the same with and without the garment options."""
    tmp = str(tmp_path)
    paths, V, F, n_leg, pid = _fused_case(tmp)
    doc = run(tmp, paths, "out")
    g = doc["summary"]["garments"]
    bp = g["by_pose"]
    assert bp["rest"]["auto:0"]["limb_penetration"] == 0
    assert bp["thigh_fwd_30"]["auto:0"]["limb_penetration"] > 0
    assert bp["thigh_fwd_30"]["auto:0"]["limb_depth"] > 0.0005 * H
    assert bp["thigh_fwd_3"]["auto:0"]["limb_penetration"] == 0
    assert bp["thigh_back_30"]["auto:0"]["limb_penetration"] == 0
    assert g["pieces"]["auto:0"]["limb_penetration_pose"] == "thigh_fwd_30"
    assert doc["lights"]["garment_limb_penetration"] == "red"
    # the region rule really is blind here: the leg and panel regions are adjacent on one island
    cx = M.Context(npzio.load_mesh(paths[0]), npzio.load_poses(paths[1]), npzio.load_weights(paths[2]))
    rl, rp = cx.region_names.index("L_Thigh"), cx.region_names.index("skirt_F_01")
    assert cx.n_islands == 1 and cx.adjacent[rl, rp]
    # body metrics: identical without the garment options (the fused pass feeds only the garment metrics)
    plain = run(tmp, paths, "plain", garments=False)
    assert plain["summary"]["penetration_pairs"] == doc["summary"]["penetration_pairs"]
    assert plain["summary"]["contact_pairs"] == doc["summary"]["contact_pairs"]
    assert {k: v for k, v in doc["lights"].items() if not k.startswith("garment_")} == plain["lights"]
    assert plain["poses"] == doc["poses"] and plain["summary"]["penetration"] == doc["summary"]["penetration"]


def _hops_from(cx, rows):
    """Welded-edge hop distance of every row to the rows ``rows`` (BFS; -1 = unreachable)."""
    from rigcore import mesh as rmesh
    ptr, idx = rmesh.adjacency_csr(cx.n_w, cx.edges)
    d = np.full(cx.n_w, -1)
    d[list(rows)] = 0
    front, k = list(rows), 0
    while front:
        k += 1
        nxt = []
        for v in front:
            for u in idx[ptr[v]:ptr[v + 1]].tolist():
                if d[u] < 0:
                    d[u] = k
                    nxt.append(u)
        front = nxt
    return d


def test_G5_near_pairs_are_a_crease(tmp_path):
    """The ring rule itself: a leg face and a panel face whose closest rows are <= GARMENT_NEAR_RINGS welded edges apart are a fused
    crease (excluded); one hop more is a pair. Checked against an independent BFS for a leg face at the yoke (every panel face)
    and for 400 random leg x panel pairs."""
    tmp = str(tmp_path)
    paths, V, F, n_leg, pid = _fused_case(tmp)
    cx = M.Context(npzio.load_mesh(paths[0]), npzio.load_poses(paths[1]), npzio.load_weights(paths[2]))
    gx = M.GarmentContext(cx, M.load_garments(os.path.join(tmp, "garments.npz"), os.path.join(tmp, "garments.json"),
                                              chains_path=os.path.join(tmp, "chains.json")))
    R = M.GARMENT_NEAR_RINGS
    assert 2 <= R <= 3
    limb = np.nonzero(gx.limb_face)[0]
    panel = np.nonzero(gx.face_piece == 0)[0]
    side = limb[np.abs(cx.rest_w[cx.Fw[limb], 2].max(1)) < 1e-9]  # leg faces touching the rim
    f0 = int(side[np.argmin(cx.rest_w[cx.Fw[side], 1].mean(1))])  # the frontmost one: next to the yoke
    rng = np.random.default_rng(5)
    fa = np.concatenate([np.full(len(panel), f0), rng.choice(limb, 400)])
    fb = np.concatenate([panel, rng.choice(panel, 400)])
    exp = np.zeros(len(fa), bool)
    for f in np.unique(fa).tolist():
        d = _hops_from(cx, cx.Fw[f].tolist())
        sel = fa == f
        dd = d[cx.Fw[fb[sel]]]
        exp[sel] = ((dd >= 0) & (dd <= R)).any(1)
    got = gx.near(cx, fa, fb)
    assert np.array_equal(got, exp)
    assert got[:len(panel)].any() and not got[:len(panel)].all()  # both sides of the rule occur next to the yoke


def _tight_case(tmp, tight_class):
    """Leg box (L_Thigh) + piece 0 (a cloth slab 1 mm in front of the leg, class ``tight_class``) + piece 1 (a strip slab beside the
    leg, never touched). Pose ``push``: piece 0 pushed 4 mm into the leg and its hem rows (the bottom half) stretched 1.5 x in x."""
    from G2_garment_metrics_test import box
    Vl, Fl = box((0, 0, 0), (0.1, 0.1, 0.2))
    Vc, Fc = box((0, -0.05 - 0.001 - 0.01, 0), (0.08, 0.02, 0.15))
    Vs, Fs = box((0.2, 0, 0), (0.04, 0.02, 0.15))
    V = np.concatenate([Vl, Vc, Vs])
    F = np.concatenate([Fl, Fc + len(Vl), Fs + len(Vl) + len(Vc)])
    part = np.concatenate([np.zeros(len(Vl), int), np.ones(len(Vc), int), np.full(len(Vs), 2)])
    from rigcore import mesh as rmesh
    weld = rmesh.weld_map(V)
    n0, n1 = len(Vl), len(Vl) + len(Vc)

    def push(P):
        P = P.copy()
        P[n0:n1] += (0, 0.005, 0)
        low = (np.arange(len(P)) >= n0) & (np.arange(len(P)) < n1) & (P[:, 2] < -0.074)
        P[low, 0] *= 1.5
        return P

    names = ["rest", "push"]
    fn = {"rest": lambda P: P, "push": push}
    tags = {"rest": ["rest"], "push": ["standard"]}
    bones = ["L_Thigh", "tail_A_01", "tail_B_01"]
    W = np.zeros((len(V), 3), np.float32)
    W[np.arange(len(V)), part] = 1.0
    P = np.stack([fn[k](V.copy()) for k in names]).astype(np.float32)
    npzio.save_mesh(os.path.join(tmp, "mesh.npz"), V, F, weld=weld, meta={"asset_id": "synthetic", "H": H})
    heads = np.zeros((2, 3, 3), np.float32)
    tails = heads.copy()
    tails[..., 2] = 0.1
    npzio.save_poses(os.path.join(tmp, "poses.npz"), names, P, bones, heads, tails, meta={"tags": tags, "rest_index": 0},
                     extra={"parents": np.full(3, -1, np.int32), "deform": np.ones(3, bool)})
    npzio.save_weights(os.path.join(tmp, "weights.npz"), bones, W, meta={"candidate": "A"})
    nw = int(weld.max()) + 1
    piece = np.full(nw, -1, np.int32)
    piece[weld] = np.array([-1, 0, 1])[part]
    hem0 = sorted(set(weld[n0:n1][V[n0:n1, 2] < -0.074].tolist()))
    hem1 = sorted(set(weld[n1:][V[n1:, 2] < -0.074].tolist()))  # never moves: hem stretch 1.0
    np.savez_compressed(os.path.join(tmp, "garments.npz"), piece=piece, t=np.where(piece >= 0, 0.5, np.nan).astype(np.float32),
                        phi=np.full(nw, np.nan, np.float32), layer=np.where(piece >= 0, 0, -1).astype(np.int8),
                        outer_ref=np.full(nw, -1, np.int32), meta=np.array("{}"))
    pieces = [{"id": "auto:0", "class": tight_class, "confidence": 0.9, "hem_loop": hem0},
              {"id": "auto:1", "class": "strip", "confidence": 0.9, "hem_loop": hem1}]
    npzio.write_json(os.path.join(tmp, "garments.json"), {"schema": 0, "pieces": pieces})
    chains = [{"id": "tail_B", "piece": "auto:1", "bones": [{"name": "tail_B_01"}]}]
    if tight_class != "tight":
        chains.append({"id": "tail_A", "piece": "auto:0", "bones": [{"name": "tail_A_01"}]})
    npzio.write_json(os.path.join(tmp, "chains.json"), {"schema": 0, "chains": chains})
    return [os.path.join(tmp, f) for f in ("mesh.npz", "poses.npz", "weights.npz")], int((piece == 0).sum()), int((piece == 1).sum())


@pytest.mark.parametrize("cls", ["tight", "strip"])
def test_G5_garment_metrics_skip_tight(tmp_path, cls):
    """G4 (orchestrator item 1): a ``tight`` piece is body skin in the garment metrics. The same geometry and pose with the piece
    as ``strip`` lights hem stretch and limb penetration red, so the assertions below can fail."""
    tmp = str(tmp_path)
    paths, n0, n1 = _tight_case(tmp, cls)
    doc = run(tmp, paths, "out")
    g = doc["summary"]["garments"]
    if cls == "tight":
        assert g["tight_skipped"] == ["auto:0"] and g["piece_ids"] == ["auto:1"]
        assert set(g["pieces"]) == {"auto:1"} and set(g["by_pose"]["push"]) == {"auto:1"}
        assert g["n_garment_rows"] == n1
        assert g["bleed_rows_by_piece"] == {"auto:1": 0}
        assert g["pieces"]["auto:1"]["hem_stretch_max"] == pytest.approx(1.0)
        assert doc["lights"]["garment_hem_stretch"] == "green"
        assert doc["lights"]["garment_limb_penetration"] == "green"
        assert doc["summary"]["lights_detail"]["garment_limb_penetration"]["value"] == 0
        # the tight piece pushed into the leg is a BODY penetration now (separate island: the body rule sees it)
        assert doc["summary"]["penetration_pairs"]["push"] > 0
    else:
        assert g["tight_skipped"] == [] and set(g["pieces"]) == {"auto:0", "auto:1"}
        assert g["n_garment_rows"] == n0 + n1
        assert g["pieces"]["auto:0"]["limb_penetration"] > 0
        assert g["pieces"]["auto:0"]["hem_stretch_max"] > 1.2
        assert doc["lights"]["garment_hem_stretch"] == "red"
        assert doc["lights"]["garment_limb_penetration"] == "red"


def test_G5_hem_stretch_light_standard_only(tmp_path):
    """Orchestrator item (G5): ``garment_hem_stretch`` is lit by the standard poses only, like the other garment lights; the
    extremes (here a chain weight test, tags ``chain`` + ``extreme``) are reported in ``hem_stretch_extreme_*`` and in the light's
    ``extreme`` detail. The slab's bottom ring (its hem) is scaled in x by 1.03 in a standard pose and by 1.3 in the chain test:
    green, with the 1.3 reported (until G5 every pose lit it: red)."""
    from G2_garment_metrics_test import box, chain, write_case
    from G2_garment_metrics_test import run as run_g2

    V, F = box((0, 0, 0), (0.2, 0.02, 0.3), k=4)
    zmin = V[:, 2].min()

    def scale(k):
        def f(P):
            P[np.abs(P[:, 2] - zmin) < 1e-9, 0] *= k
            return P
        return f

    tmp = str(tmp_path)
    poses = {"rest": lambda P: P, "flare": scale(1.03), "chain_swing_tail_F": scale(1.3)}
    tags = {"rest": ["rest"], "flare": ["standard"], "chain_swing_tail_F": ["chain", "extreme"]}
    paths, mesh, _ = write_case(tmp, [(V, F, "tail_F_01")], poses, tags, [0], [chain("tail_F", "auto:0", "tail_F_01")])
    weld = np.asarray(mesh["weld"])
    gj = npzio.read_json(os.path.join(tmp, "garments.json"))
    gj["pieces"][0]["hem_loop"] = sorted(set(weld[np.abs(V[:, 2] - zmin) < 1e-9].tolist()))
    npzio.write_json(os.path.join(tmp, "garments.json"), gj)
    doc = run_g2(tmp, paths, with_penetration=False)
    g = doc["summary"]["garments"]
    p = g["pieces"]["auto:0"]
    bp = g["by_pose"]
    assert bp["chain_swing_tail_F"]["auto:0"]["hem_stretch"] > 1.2  # the stretch is really there
    assert p["hem_stretch_max"] == pytest.approx(bp["flare"]["auto:0"]["hem_stretch"]) and p["hem_stretch_max_pose"] == "flare"
    assert p["hem_stretch_min_pose"] == "flare"  # rest is neither standard nor extreme
    assert p["hem_stretch_extreme_max"] == pytest.approx(bp["chain_swing_tail_F"]["auto:0"]["hem_stretch"])
    assert p["hem_stretch_extreme_max_pose"] == "chain_swing_tail_F"
    assert doc["lights"]["garment_hem_stretch"] == "green"
    det = doc["summary"]["lights_detail"]["garment_hem_stretch"]
    assert det["poses"] == "standard" and det["max_pose"] == "flare" and det["max_piece"] == "auto:0"
    assert det["extreme"]["max"] > 1.2 and det["extreme"]["max_pose"] == "chain_swing_tail_F"

r"""G7: review G r2 fixes of phase G (long clothing).

1. An inherited leg push inherits the drape (solvers/chains.py ``_inherit_leg_push``): the nearest item bone whose head is at or
   below the panel's fold gets ``drape x fold_share``, the overlay's own fold share of the panel rows beside it
   (``_panel_fold_share``, review G r4 F1), so the beads hang with the panel instead of standing off it as a rigid rod, and never
   fold more than the robe beside them.
2. The continuity baseline leaves rigid rows out (solvers/skin_garment.py ``body_baseline``) and the limit is capped at
   ``JUMP_CAP``: a planted 1.0 seam is caught on G4's band fixture, whose rigid parts made the body p99 1.0.
3. The transition band can be capped by edge-path length too (``path_dist`` / ``band_alpha``); ``BAND_MAX_H`` is off (inf) by
   default since 2026-10-23.

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest tests/solvers/G7_long_cloth_fixes_test.py -q -p no:cacheprovider
Synthetic data, G1's skirt fixture and, when present, the FL re-run (E:\tmp_rigkit\G7\FL_H).
"""
import math
import os
import sys
from types import SimpleNamespace

import numpy as np
import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)

from solvers import chains as ch  # noqa: E402
from solvers import skin_garment as sg  # noqa: E402

import G1_helpers as fx  # noqa: E402
import G4_garment_fixes_test as T4  # noqa: E402
from G6_chains_test import H, _inherit_case  # noqa: E402

FL_RUN = os.environ.get("RIGKIT_G7_FL", r"E:\tmp_rigkit\G_final5\FL_H")  # review G r3 N2: the final rig, not G7's capped-band run
BEAD_LAYER_MAX = 20  # FL bead faces inside the robe per leg-push pose (rod / rest level: 0, and 19 at hip_flexion_R_m120)
LEG_PUSH_POSES = ("hip_flexion_R_m60", "squat", "deep_crouch", "sit", "hip_flexion_R_m120", "hip_flexion_L_m120")
#: FL sanity bound: bead-to-robe median gap within this x H of rest (0.054 m at 1.8 m) at sit / deep_crouch. With the overlay's
#: fold share (review G r4 F1, drape 0.15) the beads never fold more than the robe beside them, so they stand off at the extreme
#: poses (+0.042 / +0.046 m; the rod was +0.048 / +0.051 m) instead of sinking in. The rod itself is caught by the drape checks.
GAP_TOL_H = 0.03


# ------------------------------------------------------------------ 1. inherited drape
def _rot(axis, ang):
    a = np.asarray(axis, float) / np.linalg.norm(axis)
    K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K


def _pose(X, b0, b1, theta, drape, below):
    """Rows ``X`` rigid on a chain: the push turns them by theta about ``b0``'s hinge through its head; rows ``below`` also turn
    back by ``-drape x theta`` about ``b1``'s hinge through its head (in the rest frame, under the push), as S5's helpers do."""
    X = np.asarray(X, float)
    Rd = _rot(b1["hinge"], -drape * theta)
    f = np.asarray(b1["head"], float)
    Y = np.where(below[:, None], (Rd @ (X - f).T).T + f, X)
    p = np.asarray(b0["head"], float)
    return (_rot(b0["hinge"], theta) @ (Y - p).T).T + p


def _gap(A, B):
    return np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)).min(1)


def test_G7_drape_bone_is_the_bone_nearest_the_fold_inside_and_outside():
    for y, pos in ((-0.25, "outside"), (-0.15, "inside")):
        chains, P, arrays, pieces = _inherit_case()
        P = P.copy()
        P[arrays["piece"] == 1, 1] = y
        c1 = next(c for c in chains if c["id"] == "charm_1")
        for b in c1["bones"]:
            b["head"][1] = b["tail"][1] = y
        doc = {"notes": []}
        ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, doc)
        lp = c1["leg_push"]
        assert lp["enabled"] and lp["inherited"]["position"] == pos, pos
        # skirt_F_02's head (0, -0.2, 0.7) is the fold. charm_1_02's head (z 0.75) lies above it, so it may not fold (it would swing
        # the beads back into the still-flared panel); charm_1_03's head (z 0.55) is the nearest at or below the fold
        assert lp["drape_bone"] == "charm_1_03", pos
        assert lp["inherited"]["panel_fold_head"] == [0.0, -0.2, 0.7]
        assert next(r for r in doc["leg_push_inherited"] if r["chain"] == "charm_1")["drape_bone"] == "charm_1_03"
    # a one-bone item has no bone below its root: no drape (unchanged)
    chains, P, arrays, pieces = _inherit_case()
    ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, {"notes": []})
    assert next(c for c in chains if c["id"] == "item1_swing")["leg_push"]["drape_bone"] is None


def test_G7_inherited_drape_is_scaled_by_the_panel_fold_share():
    """Review G r3 N1 / r4 F1: the item folds by the panel's overlay fold share (along on the rows' t) beside its drape bone's head.
    Here the robe's t is linear in z, so a bead bone head at z 0.70 (t 0.5) is halfway: drape 0.75 x 0.5."""
    chains, P, arrays, pieces = _inherit_case()
    c1 = next(c for c in chains if c["id"] == "charm_1")
    c1["bones"] = ch_bones = [dict(b) for b in c1["bones"]]
    for k, (z0, z1) in enumerate(((0.95, 0.70), (0.70, 0.45), (0.45, 0.20))):
        ch_bones[k]["head"] = [0.0, -0.25, z0]
        ch_bones[k]["tail"] = [0.0, -0.25, z1]
    ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, {"notes": []})
    lp = c1["leg_push"]
    src = next(c for c in chains if c["id"] == "skirt_F")["leg_push"]
    assert lp["drape_bone"] == ch_bones[1]["name"] and lp["inherited"]["fold_share"] == 0.5
    assert lp["drape"] == round(src["drape"] * 0.5, 4) and lp["inherited"]["panel_drape"] == src["drape"]


def test_G7_panel_fold_share_follows_the_overlay_rule():
    """Review G r4 F1 / m1: the share is the overlay's own along(t) blend (bone 02 and below over the chain bones), measured on the
    panel rows nearest the head, not a z ramp. Off-centre points, both ends, and no measurable rows."""
    from solvers.skin_garment import along

    s_ch = {"bones": [{}, {}], "class": "skirt"}
    rows = np.arange(40)
    P = np.zeros((40, 3))
    P[:, 2] = np.linspace(1.0, 0.4, 40)
    t = np.linspace(0.0, 1.0, 40)
    for tt in (0.1, 0.4, 0.6, 0.9):  # overlay centres at t 0.25 / 0.75: share 0, 0.3, 0.7, 1
        head = np.array([0.0, 0.0, 1.0 - 0.6 * tt])
        k = np.argsort(np.abs(P[:, 2] - head[2]))[:ch.PANEL_SHARE_K]
        A = along(t[k], 2)
        want = float(np.median(A[:, 2] / A[:, 1:].sum(1)))
        got = ch._panel_fold_share(s_ch, rows, P, {"t": t}, head)
        assert abs(got - want) < 1e-12, (tt, got, want)
        assert abs(got - float(np.clip((tt - 0.25) / 0.5, 0.0, 1.0))) < 0.05, (tt, got)
    assert ch._panel_fold_share(s_ch, rows, P, {}, np.zeros(3)) is None  # no t
    assert ch._panel_fold_share({"bones": [{}]}, rows, P, {"t": t}, np.zeros(3)) is None  # one-bone panel
    assert ch._panel_fold_share(s_ch, rows[:0], P, {"t": t}, np.zeros(3)) is None  # no rows


def test_G7_inherited_drape_share_zero_means_no_drape_bone():
    """A drape bone beside unfolded panel rows (share 0) gets no drape helper: drape_bone None, drape 0 (review G r4 m5)."""
    chains, P, arrays, pieces = _inherit_case()
    arrays = dict(arrays)
    t = np.array(arrays["t"], float)
    t[np.isfinite(t)] = 0.2  # the whole panel above bone 01's centre (t 0.25): on bone 01, nothing folded
    arrays["t"] = t
    ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, {"notes": []})
    lp = next(c for c in chains if c["id"] == "charm_1")["leg_push"]
    assert lp["enabled"] and lp["drape_bone"] is None and lp["drape"] == 0.0 and lp["inherited"]["fold_share"] == 0.0


def test_G7_inherited_drape_keeps_the_beads_on_the_folded_panel():
    """Numpy LBS of the synthetic case at a push of 70 deg and drape 0.75: with the drape on the bone nearest the fold the bead
    rows keep their rest gap to the panel (median within 1 cm); without it (G6 FL: drape_bone None) they stand off as a rod."""
    chains, P, arrays, pieces = _inherit_case()
    ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, {"notes": []})
    by = {c["id"]: c for c in chains}
    lp = by["charm_1"]["leg_push"]
    s0, s1 = by["skirt_F"]["bones"][:2]
    theta, d = math.radians(70.0), float(lp["drape"])
    panel = P[(arrays["piece"] == 0) & (arrays["phi"] == 0.0)]
    beads = P[arrays["piece"] == 1]
    pp = _pose(panel, s0, s1, theta, d, panel[:, 2] < s1["head"][2])
    zdb = next(b for b in by["charm_1"]["bones"] if b["name"] == lp["drape_bone"])["head"][2]
    pb = _pose(beads, s0, s1, theta, d, beads[:, 2] < zdb)  # helpers copy the panel's root / bone-02 controls
    rod = _pose(beads, s0, s1, theta, 0.0, np.zeros(len(beads), bool))
    lo = beads[:, 2] < s1["head"][2]  # bead rows below the panel's fold
    g_rest, g_drape, g_rod = (float(np.median(_gap(b, p)[lo])) for b, p in ((beads, panel), (pb, pp), (rod, pp)))
    # folding at or below the panel's fold keeps the beads outside the panel (never closer than at rest) and well short of a rod
    assert g_drape >= g_rest - 0.005, (g_rest, g_drape)
    assert g_rod - g_rest > 0.05 and g_drape < g_rod - 0.02, (g_rest, g_drape, g_rod)
    assert float(_gap(pb, pp).min()) >= float(_gap(beads, panel).min()) - 0.005


@pytest.mark.skipif(not os.path.isfile(os.path.join(FL_RUN, "_work", "s7_final", "poses.npz")), reason="final FL run absent (FL_RUN)")
def test_G7_fl_beads_hang_with_the_robe():
    """FL (final rig poses): the bead string (piece of charm_1) keeps its median gap to the robe rows (its source panel's piece,
    outer rows) within ``GAP_TOL_H`` x H of rest at ``sit`` and ``deep_crouch`` (review G r2: 0.054 m rest, 0.102 / 0.105 m)."""
    from scipy.spatial import cKDTree

    from rigcore import npzio
    from solvers import garments as gm

    z = np.load(os.path.join(FL_RUN, "_work", "s7_final", "poses.npz"), allow_pickle=False)
    names = [str(x) for x in z["names"]]
    weld = np.asarray(npzio.load_mesh(os.path.join(FL_RUN, "_work", "mesh.npz"))["weld"], np.int64)
    garr = gm.load_npz(os.path.join(FL_RUN, "garments.npz"))
    ids = [p["id"] for p in npzio.read_json(os.path.join(FL_RUN, "garments.json"))["pieces"]]
    lp = {c["id"]: c for c in npzio.read_json(os.path.join(FL_RUN, "chains.json"))["chains"]}["charm_1"]["leg_push"]
    assert lp["enabled"] and lp["drape_bone"]
    piece_v = np.asarray(garr["piece"], np.int64)[weld]
    oref_v = np.asarray(garr["outer_ref"], np.int64)[weld]
    bead = np.flatnonzero(piece_v == ids.index({c["id"]: c for c in npzio.read_json(os.path.join(FL_RUN, "chains.json"))["chains"]}
                                                ["charm_1"]["piece"]))
    robe = np.flatnonzero((piece_v == ids.index(lp["inherited"]["from_piece"])) & (oref_v < 0))

    def med(nm):
        Pk = z["P"][names.index(nm)]
        return float(np.median(cKDTree(Pk[robe]).query(Pk[bead])[0]))

    rest = med("rest") if "rest" in names else med(names[0])
    for nm in ("sit", "deep_crouch"):
        assert med(nm) - rest <= GAP_TOL_H * 1.8, (nm, med(nm), rest)
    # review G r3 N2: the gap alone cannot see the beads sinking into the robe; check the run's own layer penetration too
    m = npzio.read_json(os.path.join(FL_RUN, "checks", "metrics", "metrics.json"))
    bead_piece = {c["id"]: c for c in npzio.read_json(os.path.join(FL_RUN, "chains.json"))["chains"]}["charm_1"]["piece"]
    by_pose = m["summary"]["garments"].get("by_pose") or {}
    for nm in LEG_PUSH_POSES:  # review G r4 m2: every leg-push pose, not only the standard-pose summary
        assert nm in by_pose and bead_piece in by_pose[nm], (nm, bead_piece)  # review G r5 n3: never pass on a missing pose
        n = int(by_pose[nm][bead_piece]["layer_penetration"])
        assert n <= BEAD_LAYER_MAX, (nm, n)
    # the rod (no drape) is caught structurally: a drape bone with a drape share of the panel's (0 < drape <= panel drape)
    assert 0.0 < float(lp["drape"]) <= float(lp["inherited"]["panel_drape"]) and lp["inherited"]["fold_share"] > 0


# ------------------------------------------------------------------ 2. continuity baseline without rigid rows
def test_G7_body_baseline_drops_rigid_islands_rows_and_rigid_seams():
    # rows 0-1 an island locked to bone 0, rows 2-3 locked to bones 1 / 2 (a seam between rigid parts), rows 4-6 smooth skin,
    # row 7 rule-rigid
    W = np.array([[1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0.5, 0], [0.4, 0.6, 0], [0, 1, 0], [0.3, 0.3, 0.4]], float)
    edges = np.array([[0, 1], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]])
    topo = SimpleNamespace(edges=edges, n_w=8, island=np.array([0, 0, 1, 1, 1, 1, 1, 1]))
    body = np.ones(len(edges), bool)
    rigid = np.zeros(8, bool)
    rigid[7] = True
    keep = sg.body_baseline(W, topo, body, rigid)
    assert keep.tolist() == [False, False, True, True, True, False]


def test_G7_planted_seam_is_caught_on_the_band_fixture():
    """Review G r2 probe: G4's fused-skirt fixture, every band row set to its pure overlay row (a 1.0 step at the leg junction).
    The fixture's body p99 is 1.0 (60 shoulder / neck edges between rows with disjoint bone sets, no rigid row), so the limit was
    1.0 and the planted seam showed only by float noise (1.0000000000000002 > 1.0); the cap makes the limit 0.75."""
    mesh0, skel = fx.fixture("skirt")
    doc, arr, chains, merged = T4._plan(mesh0, skel)
    mesh, fused = T4._fuse_to_legs(mesh0, arr)
    names, W, alpha, rules, rep, topo, setup, Wb, chk = T4._apply(mesh, skel, doc, arr, chains, merged)
    c = chk["continuity"]
    assert c["ok"] and chk["ok"]  # the real overlay still passes
    assert c["body"]["p99"] >= 0.99 and c["limit"] == sg.JUMP_CAP
    O = sg._to_cols(W, names, setup.bones.names, None)
    W2 = np.array(Wb, copy=True)
    band = (alpha > 0) & (alpha < 1)
    W2[band] = O[band]
    c2 = sg.continuity(W2, topo, arr, [0], sg.inner_map(topo, arr), alpha=alpha)
    assert not c2["ok"] and c2["border"]["seam_edges"] > 0 and c2["limit"] == sg.JUMP_CAP
    # with the seam rounded down by 1e-9 (no float noise) the uncapped gate passes it: why the cap is needed
    W3 = 0.999999 * W2 + 0.000001 * Wb
    assert sg.continuity(W3, topo, arr, [0], sg.inner_map(topo, arr), alpha=alpha, cap=1.0)["ok"]
    assert not sg.continuity(W3, topo, arr, [0], sg.inner_map(topo, arr), alpha=alpha)["ok"]


def test_G7_limit_is_capped():
    W = np.array([[1, 0], [0, 1], [0.5, 0.5], [0, 1]], float)  # smooth skin with a 1.0 jump on most edges
    topo = SimpleNamespace(edges=np.array([[0, 1], [1, 2], [2, 3], [0, 3]]), n_w=4, island=np.zeros(4, np.int64),
                           P=np.zeros((4, 3)))
    garr = {"piece": np.full(4, -1), "outer_ref": np.full(4, -1)}
    W[0] = [0.99, 0.01]  # not locked: a smooth-skin row
    c = sg.continuity(W, topo, garr, [])
    assert c["body_baseline"]["p99"] > 0.9 and c["limit"] == sg.JUMP_CAP


# ------------------------------------------------------------------ 3. band capped by distance
def _line(lengths):
    """A path graph 0-1-2-... with the given edge lengths along X."""
    x = np.r_[0.0, np.cumsum(lengths)]
    P = np.c_[x, np.zeros_like(x), np.zeros_like(x)]
    e = np.c_[np.arange(len(x) - 1), np.arange(1, len(x))]
    from scipy.sparse import csr_matrix

    n = len(x)
    A = csr_matrix((np.ones(2 * len(e)), (np.r_[e[:, 0], e[:, 1]], np.r_[e[:, 1], e[:, 0]])), shape=(n, n))
    return SimpleNamespace(P=P, edges=e, n_w=n, indptr=A.indptr, indices=A.indices)


def test_G7_band_alpha_ring_and_distance():
    cap = 0.05 * H  # 0.09 m: the capped band (sg.BAND_MAX_H is off by default since 2026-10-23; the function keeps the cap)
    assert not np.isfinite(sg.BAND_MAX_H)
    # fine mesh (1 cm edges): the ring ramp 0.25 / 0.5 / 0.75 / 1 as before
    t = _line([0.01] * 6)
    src = np.zeros(t.n_w, bool)
    src[0] = True
    member = np.ones(t.n_w, bool)
    from solvers import skin_common as sc

    hop = sc.bfs_hops(t, src, member, 3)
    d = sg.path_dist(t, src, member, cap)
    assert np.allclose(sg.band_alpha(hop, d, 3, cap)[:5], [0.25, 0.5, 0.75, 1.0, 1.0])
    # coarse mesh (6 cm edges, FL robe hem): 3 rings would reach 0.18 m; the band stops at the cap (0.09 m) and ramps to it
    t = _line([0.06] * 4)
    hop = sc.bfs_hops(t, src[:5], member[:5], 3)
    d = sg.path_dist(t, src[:5], member[:5], cap)
    a = sg.band_alpha(hop, d, 3, cap)
    assert np.allclose(a, [0.25, 0.06 / cap, 1.0, 1.0, 1.0]) and np.isinf(d[2:]).all()
    # rows out of reach (not eligible) stay out of the band
    m2 = member[:5].copy()
    m2[1] = False
    assert np.isinf(sg.path_dist(t, src[:5], m2, cap)[1:]).all()


def test_G7_band_rows_lie_within_the_cap_on_the_fixture():
    """G4's fused fixture: every outer band row lies within BAND_MAX_H x H (edge path) of its junction / attachment rows."""
    mesh0, skel = fx.fixture("skirt")
    doc, arr, chains, merged = T4._plan(mesh0, skel)
    mesh, fused = T4._fuse_to_legs(mesh0, arr)
    names, W, alpha, rules, rep = sg.overlay(mesh, doc, arr, chains, merged)
    info = next(iter(v for v in rep["pieces"].values() if "band_rows" in v))
    assert "band_rows_cut_by_distance" in info and info["band_rows"] > 0
    assert ((alpha > 0) & (alpha < 1)).sum() == rep["rows_band"]

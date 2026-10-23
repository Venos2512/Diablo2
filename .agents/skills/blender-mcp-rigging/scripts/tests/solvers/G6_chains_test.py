r"""G6: solvers/chains.py - chain coverage checked on the overlay under the metric's rule (spec §6 ``garment_chain_coverage``),
cuts per chain with mirror partners, the no-crossing check on rings of mixed bone counts, and the leg-push inheritance of
clusters / strips / swing items riding on a pushed panel (spec §4).

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest tests/solvers/G6_chains_test.py -q -p no:cacheprovider

Synthetic data, G1's skirt fixture (tests/solvers/G1_helpers.py) and, when present, FL's final run (E:\tmp_rigkit\G_final\FL_H).
"""
import copy
import math
import os
import sys

import numpy as np
import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)

from solvers import chains as ch  # noqa: E402

FL_RUN = r"E:\tmp_rigkit\G_final\FL_H"
H = 1.8


# ------------------------------------------------------------------ 3. coverage: cuts
def _ring_doc(spec, asym=()):
    """doc with skirt chains {id: [rows per bone]} of piece g00, and the rows dict."""
    chains, rows = [], {}
    for cid, rr in spec.items():
        bones = [{"name": f"{cid}_{i + 1:02d}"} for i in range(len(rr))]
        chains.append({"id": cid, "piece": "g00", "class": "skirt", "bones": bones})
        rows.update({b["name"]: n for b, n in zip(bones, rr)})
    doc = {"chains": chains, "asymmetry": [{"chain": a, "partner": "R_" + a[2:], "max_dev_H": 0.05} for a in asym]}
    return doc, rows


def test_G6_cover_step_drops_the_weakest_ring_chain_first():
    doc, rows = _ring_doc({"skirt_F": [2, 1], "L_skirt_FS": [3, 2], "L_skirt_S": [5, 30], "skirt_B": [20, 20],
                           "R_skirt_S": [30, 30], "R_skirt_FS": [20, 20]})
    g = {"pieces": [{"id": "g00", "class": "skirt"}]}
    cover = {}
    cuts = ch._cover_step(doc, rows, cover, g)
    assert [c["trim"] for c in cuts] == ["coverage_drop_chain"] and cuts[0]["chain"] == "skirt_F"  # one drop, nothing else
    assert cover["g00"]["drop"] == ["skirt_F"] and not cover["g00"]["bones"]
    # next pass: L_skirt_FS still cannot hold a bone; its mirror partner goes with it (symmetric garment)
    del doc["chains"][0]
    cuts = ch._cover_step(doc, rows, cover, g)
    assert sorted(c["chain"] for c in cuts) == ["L_skirt_FS", "R_skirt_FS"]
    # ... unless the plan reports the pair as asymmetric (FL): then only the weak side goes
    doc2, rows2 = _ring_doc({"L_skirt_FS": [3, 2], "L_skirt_S": [30, 30], "skirt_B": [20, 20], "R_skirt_S": [30, 30],
                             "R_skirt_FS": [20, 20], "skirt_F": [20, 20]}, asym=("L_skirt_FS",))
    cover2 = {}
    assert [c["chain"] for c in ch._cover_step(doc2, rows2, cover2, g)] == ["L_skirt_FS"]


def test_G6_cover_step_cuts_bones_per_chain_with_partners_and_keeps_overrides():
    doc, rows = _ring_doc({"skirt_F": [20, 20], "L_skirt_S": [5, 30], "skirt_B": [20, 20], "R_skirt_S": [30, 30]})
    g = {"pieces": [{"id": "g00", "class": "skirt"}]}
    cover = {}
    cuts = ch._cover_step(doc, rows, cover, g)
    # L_skirt_S_01 is short: L_skirt_S and its partner R_skirt_S lose one bone, skirt_F / skirt_B keep theirs (spec §6 "merge the bone")
    assert sorted((c["chain"], c["from"], c["to"]) for c in cuts) == [("L_skirt_S", 2, 1), ("R_skirt_S", 2, 1)]
    assert cover["g00"]["bones"] == {"L_skirt_S": 1, "R_skirt_S": 1}
    # an explicit bone override is never cut; an explicit chain count is never dropped
    g_ob = {"pieces": [{"id": "g00", "class": "skirt", "override_bones": 2}]}
    assert ch._cover_step(doc, rows, {}, g_ob) == []
    doc3, rows3 = _ring_doc({"skirt_F": [2, 1], "L_skirt_S": [30, 30], "skirt_B": [20, 20], "R_skirt_S": [30, 30], "skirt_X": [9, 9]})
    g_oc = {"pieces": [{"id": "g00", "class": "skirt", "override_chains": 5}]}
    cuts3 = ch._cover_step(doc3, rows3, {}, g_oc)
    assert [(c["trim"], c["chain"]) for c in cuts3] == [("coverage_bones", "skirt_F")]
    # nothing short: no cut
    doc4, rows4 = _ring_doc({"skirt_F": [9, 9], "skirt_B": [9, 9], "L_skirt_S": [9, 9], "R_skirt_S": [9, 9]})
    assert ch._cover_step(doc4, rows4, {}, g) == []


def _fixture_plan():
    import G1_helpers as fx
    from solvers import garments as gm

    mesh, skel = fx.fixture("skirt")
    doc, arr = gm.classify(mesh, skel)
    return mesh, skel, doc, arr


def test_G6_overlay_coverage_is_the_metric_rule_on_the_skirt_fixture():
    """``overlay_coverage`` = what metrics.garment_weights counts on final weights alpha x overlay + (1 - alpha) x body when the
    body weight of the band sits on one bone outside the overlay (the exporter rule, argmax per welded row)."""
    from solvers import metrics, skin_garment as sg

    mesh, skel, doc, arr = _fixture_plan()
    plan = ch.plan(doc, arr, mesh, skel)
    assert plan["chains"] and plan["coverage_check"]["method"].startswith("overlay")
    rows = ch.overlay_coverage(doc, arr, mesh, skel, plan)
    assert rows == plan["coverage_check"]["rows_per_bone"]
    cols, W, alpha, _, _ = sg.overlay(mesh, doc, arr, plan, ch.merge_chains(skel, plan))
    chain_bones = {b["name"] for c in plan["chains"] for b in c["bones"]}
    free = [i for i, b in enumerate(cols) if b not in chain_bones and not np.any(W[:, i] > 0)]
    assert free
    B = np.zeros_like(W)
    B[:, free[0]] = 1.0
    Wf = alpha[:, None] * W + (1.0 - alpha)[:, None] * B
    Ww = metrics.exporter_rule(Wf)
    dom, has = Ww.argmax(1), Ww.max(1) > 0
    want = {b: int(((dom == cols.index(b)) & has).sum()) for b in chain_bones}
    assert want == rows
    # every chain bone of the cover classes holds the minimum, or is listed
    for b, n in rows.items():
        assert n >= ch.COVER_MIN_ROWS or b in plan["coverage_check"]["below_min"]
    assert plan["coverage"] and all(r["method"] == "overlay" for r in plan["coverage"])


def test_G6_plan_estimate_mode_and_legacy():
    mesh, skel, doc, arr = _fixture_plan()
    est = ch.plan(doc, arr, mesh, skel, coverage="estimate")
    assert est["coverage_check"]["method"].startswith("estimate")
    with pytest.raises(ValueError):
        ch.plan(doc, arr, mesh, skel, coverage="nope")
    bare = {k: v for k, v in arr.items() if k != "outer_ref"}
    with pytest.raises(ValueError):
        ch.plan(doc, bare, mesh, skel)  # the overlay check needs outer_ref when there are chains


# ------------------------------------------------------------------ no-crossing on a ring of mixed bone counts
def _chain_at(cid, az, n, r0=0.15, r1=0.4, z0=1.2, z1=0.2):
    J = []
    for i in range(n + 1):
        f = i / n
        r, z = r0 + f * (r1 - r0), z0 + f * (z1 - z0)
        J.append([r * math.sin(math.radians(az)), -r * math.cos(math.radians(az)), z])
    bones = [{"name": f"{cid}_{i + 1:02d}", "parent": "pelvis", "head": J[i], "tail": J[i + 1], "hinge": [1.0, 0.0, 0.0]}
             for i in range(n)]
    return {"id": cid, "piece": "g00", "class": "skirt", "azimuth_deg": az, "fan_root": None, "bones": bones,
            "leg_push": {"enabled": True, "dir": [math.sin(math.radians(az)), -math.cos(math.radians(az)), 0.0]}}


def test_G6_uncross_ring_of_mixed_bone_counts_checks_roots_and_hems():
    chains = [_chain_at("skirt_F", 0.0, 2), _chain_at("L_skirt_S", 90.0, 1), _chain_at("skirt_B", 180.0, 2),
              _chain_at("R_skirt_S", -90.0, 2)]
    b = chains[0]["bones"][-1]  # skirt_F's hem swings past L_skirt_S (to 100 deg)
    r = math.hypot(*b["tail"][:2])
    b["tail"] = [r * math.sin(math.radians(100.0)), -r * math.cos(math.radians(100.0)), b["tail"][2]]
    doc = {"crossing": []}
    ch._uncross_rings(chains, (0.0, 0.0), H, doc)
    assert doc["crossing"] and any(f["level"] == 1 for f in doc["crossing"][0]["fixed"])
    hem = {c["id"]: math.degrees(math.atan2(c["bones"][-1]["tail"][0], -c["bones"][-1]["tail"][1])) for c in chains}
    assert hem["skirt_F"] < hem["L_skirt_S"]  # azimuth order back at the hem


# ------------------------------------------------------------------ 2. leg-push inheritance
def _sheet(y, x0, x1, z0, z1, nx=5, nz=13):
    xs, zs = np.linspace(x0, x1, nx), np.linspace(z0, z1, nz)
    return np.array([[x, y, z] for z in zs for x in xs], float)


def _bones(cid, x, y, z0, z1, n, out_dir=(0.0, -1.0, 0.0), parent="pelvis"):
    """A vertical chain; hinges as chains.plan writes them (hinge_for with the chain's outward direction)."""
    zs = np.linspace(z0, z1, n + 1)
    out = []
    for i in range(n):
        h, t = [x, y, float(zs[i])], [x, y, float(zs[i + 1])]
        out.append({"name": f"{cid}_{i + 1:02d}" if not cid.endswith("_swing") else cid, "parent": parent if i == 0 else out[-1]["name"],
                    "head": h, "tail": t, "hinge": ch.hinge_for(h, t, out_dir)})
    return out


def _inherit_case():
    """Robe ring g00 (skirt_F front at y -0.2, skirt_B back at y +0.2; both pushed), a bead string g01 hanging 5 cm in front of
    skirt_F, a far bead string g02 (0.3 m away), a swing item g03 in front of skirt_F, an apron strip g04 with its own push."""
    front = _sheet(-0.2, -0.1, 0.1, 0.4, 1.0)
    back = _sheet(0.2, -0.1, 0.1, 0.4, 1.0)
    beads = _sheet(-0.25, -0.02, 0.02, 0.5, 0.95, nx=2, nz=10)
    far = _sheet(-0.5, -0.02, 0.02, 0.5, 0.95, nx=2, nz=10)
    item = _sheet(-0.24, -0.03, 0.03, 0.85, 0.95, nx=3, nz=3)
    apron = _sheet(-0.23, 0.25, 0.35, 0.6, 0.95, nx=3, nz=6)  # beside the beads, over the panel edge region
    P = np.concatenate([front, back, beads, far, item, apron])
    piece = np.concatenate([np.zeros(len(front) + len(back)), np.full(len(beads), 1), np.full(len(far), 2), np.full(len(item), 3),
                            np.full(len(apron), 4)]).astype(np.int32)
    phi = np.full(len(P), np.nan)
    phi[:len(front)] = 0.0
    phi[len(front):len(front) + len(back)] = 180.0
    t = np.full(len(P), np.nan)  # robe rows: 0 at the waist (z 1.0), 1 at the hem (z 0.4), as garments.npz gives it
    t[piece == 0] = (1.0 - P[piece == 0, 2]) / 0.6
    arrays = {"piece": piece, "layer": np.zeros(len(P), np.int8), "phi": phi, "t": t}
    pieces = [{"id": f"g0{k}", "class": c} for k, c in enumerate(("skirt", "cluster", "cluster", "rigid_hanging", "strip"))]
    lp_f = {"enabled": True, "w_L": 0.5, "w_R": 0.5, "dir": [0.0, -1.0, 0.0], "max_deg": 80.0, "drape": 0.75}
    lp_b = dict(lp_f, dir=[0.0, 1.0, 0.0])
    off = {"enabled": False, "w_L": 0.3, "w_R": 0.7, "dir": [-0.6, -0.8, 0.0], "max_deg": 80.0, "drape": 0.75}
    apron_lp = {"enabled": True, "w_L": 0.6, "w_R": 0.4, "dir": [0.2, -0.98, 0.0], "max_deg": 80.0, "drape": 0.75}
    chains = [
        {"id": "skirt_F", "piece": "g00", "class": "skirt", "azimuth_deg": 0.0, "bones": _bones("skirt_F", 0.0, -0.2, 1.0, 0.4, 2),
         "leg_push": lp_f},
        {"id": "skirt_B", "piece": "g00", "class": "skirt", "azimuth_deg": 180.0, "bones": _bones("skirt_B", 0.0, 0.2, 1.0, 0.4, 2, (0.0, 1.0, 0.0)),
         "leg_push": lp_b},
        {"id": "charm_1", "piece": "g01", "class": "cluster", "azimuth_deg": None,
         "bones": _bones("charm_1", 0.0, -0.25, 0.95, 0.35, 3), "leg_push": copy.deepcopy(off)},
        {"id": "charm_2", "piece": "g02", "class": "cluster", "azimuth_deg": None,
         "bones": _bones("charm_2", 0.0, -0.5, 0.95, 0.5, 3), "leg_push": copy.deepcopy(off)},
        {"id": "item1_swing", "piece": "g03", "class": "rigid_hanging", "azimuth_deg": None,
         "bones": _bones("item1_swing", 0.0, -0.24, 0.95, 0.85, 1), "leg_push": copy.deepcopy(off)},
        {"id": "tail_1", "piece": "g04", "class": "strip", "azimuth_deg": None, "bones": _bones("tail_1", 0.3, -0.23, 0.95, 0.6, 2),
         "leg_push": copy.deepcopy(apron_lp)},
    ]
    return chains, P, arrays, pieces


def test_G6_cluster_in_front_of_a_pushed_panel_follows_it():
    chains, P, arrays, pieces = _inherit_case()
    doc = {"notes": []}
    ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, doc)
    by = {c["id"]: c for c in chains}
    src = by["skirt_F"]["leg_push"]
    lp = by["charm_1"]["leg_push"]
    assert lp["enabled"] and lp["inherited"]["from"] == "skirt_F" and lp["inherited"]["position"] == "outside"
    for k in ("w_L", "w_R", "dir", "max_deg", "drape"):
        assert lp[k] == src[k], k
    assert lp["inherited"]["own"]["dir"] == [-0.6, -0.8, 0.0] and lp["inherited"]["share"] >= ch.INHERIT_SHARE
    # G7 + orchestrator: the drape goes on the nearest bead bone whose head is at or below skirt_F's fold (its bone-02 head,
    # (0, -0.2, 0.7)): charm_1_03 (head (0, -0.25, 0.55), 0.158 m); charm_1_02's head (z 0.75) is above the fold
    assert lp["drape_bone"] == "charm_1_03" and lp["inherited"]["panel_fold_z"] == [0.85, 0.55]
    assert lp["inherited"]["panel_fold_head"] == [0.0, -0.2, 0.7]
    assert lp["inherited"]["drape_offset_H"] == round(float(np.hypot(0.05, 0.15)) / H, 4)
    for b in by["charm_1"]["bones"]:  # hinges follow the inherited direction: the push turns both about parallel axes
        assert np.allclose(b["hinge"], ch.hinge_for(b["head"], b["tail"], src["dir"]))
        assert np.allclose(b["hinge"], [-1.0, 0.0, 0.0]) or np.allclose(b["hinge"], [1.0, 0.0, 0.0])
    # the swing item rides on the same panel: push, no drape (one bone)
    sw = by["item1_swing"]["leg_push"]
    assert sw["enabled"] and sw["inherited"]["from"] == "skirt_F" and sw["drape_bone"] is None
    # the far beads and the apron (own push) keep theirs
    assert not by["charm_2"]["leg_push"]["enabled"] and "inherited" not in by["charm_2"]["leg_push"]
    assert by["tail_1"]["leg_push"]["dir"] == [0.2, -0.98, 0.0] and "inherited" not in by["tail_1"]["leg_push"]
    assert [r["chain"] for r in doc["leg_push_inherited"]] == ["charm_1", "item1_swing"]
    assert all(r["piece"] in ("g01", "g03") and r["from_piece"] == "g00" for r in doc["leg_push_inherited"])


def test_G6_inherited_push_moves_the_beads_with_the_panel():
    """Numpy LBS of the synthetic case under a leg push of 40 deg: the panel's rows and the bead rows turn together (the gap
    between each bead row and its nearest panel row stays within 1 mm while the push lifts the panel by centimetres)."""
    chains, P, arrays, pieces = _inherit_case()
    ch._inherit_leg_push(chains, P, arrays, pieces, (0.0, 0.0), H, {"notes": []})
    by = {c["id"]: c for c in chains}

    def rot(axis, ang):
        a = np.asarray(axis, float) / np.linalg.norm(axis)
        K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
        return np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K

    def pose_rows(pivot_bone, rows_xyz, theta):
        """Rows rigidly on a chain's root (the part above the first drape fold), turned by theta about pivot_bone's hinge
        through its head."""
        Rm = rot(pivot_bone["hinge"], theta)
        return (Rm @ (rows_xyz - np.asarray(pivot_bone["head"])).T).T + np.asarray(pivot_bone["head"])

    theta = math.radians(40.0)
    zf = by["skirt_F"]["bones"][1]["head"][2]
    panel = P[(arrays["piece"] == 0) & (arrays["phi"] == 0.0) & (P[:, 2] >= zf)]
    beads = P[(arrays["piece"] == 1) & (P[:, 2] >= zf)]
    src = by[by["charm_1"]["leg_push"]["inherited"]["from"]]
    pp = pose_rows(by["skirt_F"]["bones"][0], panel, theta)
    pb = pose_rows(src["bones"][0], beads, theta)  # rigkit/control.py helper_geometry: the push helper copies the panel root

    def gaps(A, B):
        return np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(-1)).min(1)

    g0, g1 = gaps(beads, panel), gaps(pb, pp)
    assert np.abs(g1 - g0).max() < 1e-9  # rigid with the panel: every gap kept
    assert np.abs(pp - panel).max() > 0.05  # the panel did move
    # the same angle about the beads' own root closes the gap (different pivot): why the helper takes the panel's pivot
    own = pose_rows(by["charm_1"]["bones"][0], beads, theta)
    assert gaps(own, pp).min() < 0.75 * g0.min()
    # signed distance outward from the (planar) panel after the push: the beads that follow stay 5 cm outside; without the
    # inheritance (beads static) the pushed panel sweeps through them
    b0 = by["skirt_F"]["bones"][0]
    nrm = rot(b0["hinge"], theta) @ np.array([0.0, -1.0, 0.0])
    head = np.asarray(b0["head"])
    assert np.allclose((pb - head) @ nrm, 0.05) and np.allclose((beads - head) @ np.array([0.0, -1.0, 0.0]), 0.05)
    assert ((beads - head) @ nrm < 0).sum() >= len(beads) // 2


# ------------------------------------------------------------------ FL (final run inputs, when present)
@pytest.mark.skipif(not os.path.isfile(os.path.join(FL_RUN, "garments.npz")), reason="FL final run absent")
def test_G6_fl_plan_coverage_and_beads():
    from rigcore import npzio

    mesh = npzio.load_mesh(os.path.join(FL_RUN, "_work", "mesh.npz"))
    g = npzio.read_json(os.path.join(FL_RUN, "garments.json"))
    with np.load(os.path.join(FL_RUN, "garments.npz")) as z:
        arr = {k: z[k] for k in z.files}
    skel = npzio.read_json(os.path.join(FL_RUN, "_work", "garments", "skeleton_s3g.json"))
    plan = ch.plan(g, arr, mesh, skel)
    cc = plan["coverage_check"]
    assert cc["ok"] and all(n >= ch.COVER_MIN_ROWS for n in cc["rows_per_bone"].values())
    by = {c["id"]: c for c in plan["chains"]}
    assert "skirt_F" not in by and "L_skirt_FS" not in by  # the band-only front chains are gone (metric: 1-3 rows)
    ring = [c for c in plan["chains"] if c["class"] == "skirt"]
    assert len(ring) >= ch.RING_MIN and all(c["leg_push"]["enabled"] for c in ring)
    lp = by["charm_1"]["leg_push"]
    assert lp["enabled"] and lp["inherited"]["from"] in {c["id"] for c in ring} and lp["inherited"]["share"] > 0.9
    assert plan["budget"]["used"] <= plan["budget"]["aux_budget"]

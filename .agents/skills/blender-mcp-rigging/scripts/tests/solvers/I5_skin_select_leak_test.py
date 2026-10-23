"""I5: the selector's limb-leak gate holds everywhere (final review m3), rigkit-env pytest.

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/solvers/I5_skin_select_leak_test.py -q -p no:cacheprovider

* a candidate the gate dropped in a region does not come back through the blend band (``blend_alpha(forbid=...)``);
* it does not win when only unscored candidates are left, nor in a not-exercised region whose rule candidate it is (G2 flag);
* on the I3 D01_S pipeline inputs (skipped when absent) the selected weights leak no more rows in a gated region than the region's
  chosen candidate itself (before the fix: 3 rows in the pelvis from candidate A at alpha ~0.3 in the pelvis/L_Thigh band).
"""
import os
import sys

import numpy as np
import pytest

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)
sys.dont_write_bytecode = True

from rigcore import npzio, template  # noqa: E402
from solvers import skin_common as sc  # noqa: E402
from solvers import skin_select as ss  # noqa: E402

D01_S = r"E:\tmp_rigkit\I3\D01_S"


def test_I5_m3_only_unscored_left_does_not_pick_a_dropped_candidate():
    scores = {"pelvis": {"A": 1.0, "B": 2.0}, "chest": {"A": 1.0, "B": 2.0, "C": 3.0}}
    choice, default, info = ss.choose(scores, None, ["A", "B", "C"], drop={"pelvis": ["A", "B"], "chest": ["A"]})
    assert choice["pelvis"] == "C" and info["leak_gate_overrides"]["pelvis"]["path"] == "only unscored left"
    assert choice["chest"] == "B" and "after the limb-leak gate" in info["decided"]["chest"]  # the plain gate is unchanged


def test_I5_m3_not_exercised_region_skips_a_dropped_rule_candidate():
    scores = {"L_Clavicle": {"A": 1.0, "B": 1.0, "C": 1.0}}
    choice, _, info = ss.choose(scores, None, ["A", "B", "C"], drop={"L_Clavicle": ["A"]}, keep={"L_Clavicle": "A"})
    assert choice["L_Clavicle"] == "B" and info["leak_gate_overrides"]["L_Clavicle"]["path"] == "not exercised"
    choice, _, info = ss.choose(scores, None, ["A", "B", "C"], drop={}, keep={"L_Clavicle": "A"})
    assert choice["L_Clavicle"] == "A" and "leak_gate_overrides" not in info  # nothing dropped: the rule candidate stays


def _strip(n=12):
    """A strip of 2 x n vertices (triangles), welded = identity."""
    V = np.array([[x * 0.1, 0.0, z * 0.1] for x in range(n) for z in range(2)], float)
    F = []
    for x in range(n - 1):
        a, b, c, d = 2 * x, 2 * x + 1, 2 * x + 2, 2 * x + 3
        F += [[a, c, b], [b, c, d]]
    return sc.weld_topo({"V": V, "F": np.array(F), "weld": np.arange(len(V)), "meta": {"H": 1.0}})


def test_I5_m3_blend_band_keeps_a_dropped_candidate_out_of_its_region():
    topo = _strip()
    lab = np.where(topo.P[:, 0] < 0.55, 0, 1)  # region 0 left (candidate 0), region 1 right (candidate 1)
    A0, band0 = ss.blend_alpha(topo, lab, 2, 2)
    right = lab == 1
    assert (A0[right & band0, 0] > 0.1).any()  # without the gate the band mixes candidate 0 into region 1
    forbid = np.zeros((topo.n_w, 2), bool)
    forbid[right, 0] = True  # candidate 0 dropped in region 1
    A, band = ss.blend_alpha(topo, lab, 2, 2, forbid=forbid)
    assert np.array_equal(band, band0) and np.allclose(A.sum(1), 1.0)
    assert np.all(A[right, 0] == 0.0) and np.allclose(A[right, 1], 1.0)
    left_band = (lab == 0) & band
    assert (A[left_band, 1] > 0).any()  # the transition stays, on the side where both are allowed
    reg = np.where(right, 1, 0)
    F = ss.leak_forbid({"L": right == 0, "R": right}, reg, {"R": ["c0"]}, {"R": "c1"}, ["c0", "c1"], topo.n_w)
    assert np.array_equal(F[:, 0], right) and not F[:, 1].any()


@pytest.mark.skipif(not os.path.isfile(os.path.join(D01_S, "_work", "skin", "A.npz")), reason="I3 D01_S pipeline outputs absent")
def test_I5_m3_d01_selected_weights_leak_no_more_than_the_region_winner():
    from solvers import skin_rules

    md = os.path.join(D01_S, "_work", "s7_scoring", "metrics")
    mesh = npzio.load_mesh(os.path.join(D01_S, "_work", "mesh.npz"))
    skel = template.load_skeleton(os.path.join(D01_S, "skeleton.json"))
    rules = skin_rules.load_rules(os.path.join(D01_S, "skin_rules.json"))
    cand = {c: npzio.load_weights(os.path.join(D01_S, "_work", "skin", f"{c}.npz")) for c in "ABC"}
    regions = ss.load_regions(os.path.join(md, "regions.npz"))
    W, rep, topo, bones, cons = ss.select(mesh, skel, cand, rules, regions, scores=npzio.read_json(os.path.join(md, "region_scores.json")),
                                          detail=npzio.read_json(os.path.join(md, "region_scores_detail.json")))
    cfg = sc.leak_config()
    par = {n: x["parent"] for n, x in bones.all_bones.items()}
    lk = sc.limb_leak(topo.P, W, bones.names, bones.head, bones.tail, par, regions=regions, with_mask=True, **cfg["params"])
    gate = rep["leak_gate"]
    assert gate["dropped"].get("pelvis") and "A" in gate["dropped"]["pelvis"]
    for r, g in gate["regions"].items():
        if g["dropped"] and not g["all_leak"]:
            mine = int((lk["mask"] & regions[r]).sum())
            assert mine <= g["rows"][rep["choice"][r]], (r, mine, g["rows"], rep["choice"][r])
    assert lk["rows"] <= 2 and rep["leak_gate"]["blend_forbidden_rows"] > 0  # I3: 5 rows (pelvis 3 from A in the band)

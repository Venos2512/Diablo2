"""A2 tests: solvers.consensus - the revised consensus rule (joint-placement.md, reviews r1, r2 and r3): plausibility gates per source
(method, inside, axis, prior, ratio with the family band, mirror, tip end), UniRig sanity-only set (pelvis, spine, hips, ankles,
clavicles) and bias config, class tolerance tau, single plausible source (a accepted unflagged, d alone = vision-only flag, a dropped by
the ratio gate alone = counted ratio_disagree tile with the a+d mean), boot ankle (accepted only when UniRig agrees), provisional =
geometry, derived ground points, tiles (L/R pairs, spine tile re-derived on the straight pelvis -> chest line once the chest is placed,
impact order, crops and section polylines), vision decision records (complete records only, gates acknowledged, stale decisions
re-flagged, escalate), ready_for_user after the vision decisions, override, files.

PYTEST_DONT_REWRITE
"""
import math
import os
import sys

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from rigcore import landmarks as rlm, mesh as rmesh, npzio, schema, template  # noqa: E402
from solvers import consensus as cs  # noqa: E402

H = 1.0
SHA = "0" * 64
NOFAM = {"landmarks": {}}


def e(p, c=1.0, **kw):
    return {"pos": tuple(float(v) for v in p), "confidence": c, "method": "test", **kw}


def rec(choice, pos, gates=(), conf=0.8, **kw):
    """A complete vision decision record (module docstring of solvers.consensus)."""
    r = {"choice": choice, "reason": "test: anatomy row applied, crop shows the joint",
         "evidence": [{"path": "tile_front.png", "view": "front", "sha256": SHA}],
         "inputs": {"landmarks_a": SHA, "landmarks_d": SHA, "mesh": SHA, "chosen_pos": [float(v) for v in pos]},
         "gates_overridden": list(gates), "reviewer": {"model": "claude-opus-5-5", "date": "2026-10-23", "confidence": conf}}
    r.update(kw)
    return r


FAM_S = template.load_family("S")
FAM_H = template.load_family("H")


def test_tau_formula():
    cfg = cs.Config()
    assert cs.tau_of("knee_L", 1.0, None, cfg) == pytest.approx(0.015)  # limb 1.5 % H
    assert cs.tau_of("knee_L", 1.0, 0.05, cfg) == pytest.approx(0.025)  # 0.5 r_local wins
    assert cs.tau_of("knee_L", 1.0, 0.2, cfg) == pytest.approx(0.03)  # capped at 3 % H
    assert cs.tau_of("neck", 1.0, None, cfg) == pytest.approx(0.03)  # convention 3 % H
    assert cs.tau_of("toe_tip_L", 1.0, None, cfg) == pytest.approx(0.02)  # tips 2 % H
    small = cs.Config(f_class={"limb": 0.001, "convention": 0.03, "tip": 0.02})
    assert cs.tau_of("knee_L", 1.0, None, small) == pytest.approx(0.006)  # floor 0.6 % H
    assert cs.landmark_class("ball_ground_R") == "tip" and cs.landmark_class("clavicle_L") == "convention"


def test_agree_weighted_mean_and_single_plausible_source():
    f, rep = cs.fuse({"a": {"knee_L": e((0, 0, 0.5), 0.8)}, "d": {"knee_L": e((0.004, 0, 0.5), 1.0)}}, H, NOFAM)
    k = f["knee_L"]
    wa, wd = 1.0 * 0.8, 0.7 * 1.0
    assert k["kind"] == "agree" and not k["flagged"] and k["flag"] is None
    assert k["pos"][0] == pytest.approx(0.004 * wd / (wa + wd))
    assert k["gates"]["a"]["inside"].startswith("n/a")  # no mesh: geometric gates are n/a
    # d fails: a is the single plausible source, accepted unflagged, confidence <= 0.6
    f, _ = cs.fuse({"a": {"knee_L": e((0, 0, 0.5), 0.8)}, "d": {"knee_L": e((0, 0, 0.4), 0.1)}}, H, NOFAM)
    k = f["knee_L"]
    assert k["kind"] == "single" and not k["flagged"] and k["flag"] is None and np.allclose(k["pos"], (0, 0, 0.5))
    assert k["confidence"] <= 0.6


def test_unirig_alone_is_a_vision_only_flag():
    """Review r2 (a): a landmark whose single plausible source is UniRig is flagged vision-only - checked by the vision step, not
    counted as a tile; ready_for_user waits for the vision decision."""
    f, rep = cs.fuse({"a": {"knee_L": e((0, 0, 0.4), 0.2)}, "d": {"knee_L": e((0, 0, 0.5), 1.0)}}, H, NOFAM)
    k = f["knee_L"]
    assert k["kind"] == "single" and k["flagged"] and k["flag"] == "vision_only" and k["provisional"] == "d"
    assert np.allclose(k["pos"], (0, 0, 0.5)) and k["confidence"] <= 0.6 and k["gates"]["a"]["method"].startswith("fail")
    assert rep["n_tiles"] == 0 and rep["n_vision_only_tiles"] == 1 and rep["tiles"][0]["flag"] == "vision_only"
    assert rep["ready_for_user"] is False and "pending" in rep["reasons"][0]
    f, rep = cs.fuse({"a": {"knee_L": e((0, 0, 0.4), 0.2)}, "d": {"knee_L": e((0, 0, 0.5), 1.0)}}, H, NOFAM,
                     vision={"knee_L": rec("d", (0, 0, 0.5))})
    assert f["knee_L"]["kind"] == "vision" and not f["knee_L"]["flagged"] and rep["ready_for_user"] is True
    assert rep["tiles"][0]["status"] == "resolved" and rep["user_tiles"] == []


def test_disagree_flagged_with_geometry_provisional_and_no_plausible():
    f, rep = cs.fuse({"a": {"elbow_L": e((0.15, 0, 0.3), 0.6)}, "d": {"elbow_L": e((0.20, 0, 0.3), 1.0)}}, H, NOFAM)
    k = f["elbow_L"]
    assert k["flagged"] and k["flag"] == "vision" and k["kind"] == "disagree" and k["provisional"] == "a"
    assert np.allclose(k["pos"], (0.15, 0, 0.3)) and rep["tiles"][0]["key"] == "elbow"
    f, _ = cs.fuse({"a": {"elbow_L": e((0.15, 0, 0.3), 0.1)}, "d": {"elbow_L": e((0.20, 0, 0.3), 0.2)}}, H, NOFAM)
    assert f["elbow_L"]["kind"] == "no_plausible" and f["elbow_L"]["flagged"]


def test_prior_gate_and_helmet_exemption():
    a = {"knee_L": e((0.05, 0.03, 0.30)), "head_top": e((0, -0.06, 0.43), 0.7, prior_exempt="helmet island above")}
    d = {"knee_L": e((0.05, 0.03, 0.11))}
    f, rep = cs.fuse({"a": a, "d": d}, 0.5, FAM_S)
    k = f["knee_L"]  # S prior knee 0.22 +- 0.04 H: a (0.6 H) fails, d (0.22 H) passes -> UniRig alone: vision-only flag
    assert k["gates"]["a"]["prior"].startswith("fail") and k["gates"]["d"]["prior"] == "pass"
    assert k["kind"] == "single" and k["flag"] == "vision_only" and np.allclose(k["pos"], (0.05, 0.03, 0.11))
    assert f["head_top"]["gates"]["a"]["prior"].startswith("n/a: exempt") and not f["head_top"]["flagged"]
    assert any(p["id"] == "knee_L" and p["source"] == "a" for p in rep["prior_fail"])
    assert f["knee_L"]["sources"]["c"][2] == pytest.approx(0.22 * 0.5)  # prior recorded as source c, z only


def test_unirig_sanity_only_and_bias_config():
    assert {"pelvis", "spine_01", "spine_02", "hip", "ankle", "clavicle"} == set(cs.Config().sanity_only)  # review r2 (b)
    a = {"pelvis": e((0.01, 0.03, 0.185), 0.6)}
    d = {"pelvis": e((0.01, 0.03, 0.235), 1.0)}  # Mixamo-style hips 50 mm high
    f, _ = cs.fuse({"a": a, "d": d}, 0.5, FAM_S)
    p = f["pelvis"]
    assert p["kind"] == "single" and not p["flagged"] and np.allclose(p["pos"], (0.01, 0.03, 0.185))  # d never fused on the sanity set
    assert p["gates"]["d"]["role"].startswith("sanity") and p["gates"]["d"]["sanity_dist_H"] == pytest.approx(0.1)
    for lid in ("spine_01", "spine_02", "clavicle_L"):  # the extended set: compared, never fused
        f, _ = cs.fuse({"a": {lid: e((0.0, 0.0, 0.3), 0.6)}, "d": {lid: e((0.0, 0.0, 0.36), 1.0)}}, 0.5, NOFAM)
        assert f[lid]["kind"] == "single" and not f[lid]["flagged"] and f[lid]["gates"]["d"]["role"].startswith("sanity"), lid
    cfg = cs.Config(unirig_bias={"pelvis": {"bias_H": [0.0, 0.0, 0.1], "weight": 0.7}})  # P5 calibration: d - 0.1 H
    f, _ = cs.fuse({"a": a, "d": d}, 0.5, FAM_S, cfg)
    p = f["pelvis"]
    assert p["kind"] == "agree" and p["pos"][2] == pytest.approx(0.185)
    assert p["sources"]["d"][2] == pytest.approx(0.235) and "bias-corrected" in p["gates"]["d"]["role"]
    f, _ = cs.fuse({"a": a, "d": d}, 0.5, FAM_S, cs.Config(sanity_only=()))  # configurable set: d is a candidate again ...
    assert "role" not in f["pelvis"]["gates"]["d"] and f["pelvis"]["gates"]["d"]["prior"].startswith("fail")  # ... gated by the prior
    f, _ = cs.fuse({"a": a, "d": d}, 0.5, NOFAM, cs.Config(sanity_only=()))  # no prior: the two disagree
    assert f["pelvis"]["kind"] == "disagree" and f["pelvis"]["flagged"]


def _arm(side, sh, el, wr):
    s = 1 if side == "L" else -1
    return {f"shoulder_{side}": e((s * sh, 0, 0.8)), f"elbow_{side}": e((s * el, 0, 0.8)), f"wrist_{side}": e((s * wr, 0, 0.8))}


def test_ratio_gate_blames_the_replaceable_joint():
    """FL review case: source a put the shoulders out on the arm (upper arm 0.053 H vs forearm 0.185 H); d's chain is sane."""
    a, d = {}, {}
    for side in ("L", "R"):
        a.update(_arm(side, 0.30, 0.40, 0.73))
        d.update(_arm(side, 0.20, 0.43, 0.71))
    f, _ = cs.fuse({"a": a, "d": d}, 1.8, NOFAM)
    for side in ("L", "R"):
        g = f[f"shoulder_{side}"]["gates"]
        assert g["a"]["ratio"].startswith("fail") and "smallest replacement" in g["a"]["ratio"]
        # a fails the ratio gate alone: a counted ratio_disagree tile (review r3 F1), not a vision-only flag
        assert f[f"shoulder_{side}"]["kind"] == "ratio_disagree" and f[f"shoulder_{side}"]["plausible"] == ["d"]
        assert f[f"wrist_{side}"]["gates"]["a"]["ratio"].startswith("pass")  # the wrist is not blamed
    # no donor chain: the middle joint (elbow) is blamed
    f, _ = cs.fuse({"a": _arm("L", 0.30, 0.31, 0.73)}, 1.8, NOFAM)
    assert f["elbow_L"]["gates"]["a"]["ratio"].startswith("fail") and "middle joint" in f["elbow_L"]["gates"]["a"]["ratio"]
    assert f["shoulder_L"]["gates"]["a"]["ratio"].startswith("pass")


def test_ratio_gate_uses_the_family_band():
    """Review r2 N4: bands from families/<F>.json plausibility.segment_ratio (H arm 0.75-1.8, S arm 0.59-1.37); Config overrides."""
    assert cs.segment_ratio_bands(FAM_H)["arm"] == (0.75, 1.8) and cs.segment_ratio_bands(FAM_H)["leg"] == (0.7, 1.5)
    assert cs.segment_ratio_bands(FAM_S)["arm"] == (0.59, 1.37) and cs.segment_ratio_bands(FAM_S)["leg"] == (0.66, 1.54)
    assert cs.segment_ratio_bands(NOFAM)["arm"] == (0.5, 2.0)
    a = _arm("L", 0.20, 0.32, 0.52)  # upper 0.12 / fore 0.20 = 0.6: inside the gross band, below the H band
    f, _ = cs.fuse({"a": a}, 1.8, NOFAM)
    assert f["elbow_L"]["gates"]["a"]["ratio"].startswith("pass")
    f, rep = cs.fuse({"a": a}, 1.8, FAM_H)
    assert f["elbow_L"]["gates"]["a"]["ratio"].startswith("fail: arm ratio 0.60 outside 0.75-1.8")
    assert rep["config"]["segment_ratio_bands"]["arm"] == [0.75, 1.8]
    f, _ = cs.fuse({"a": a}, 1.8, FAM_H, cs.Config(segment_ratio={"arm": (0.5, 2.0), "leg": (0.5, 2.0)}))
    assert f["elbow_L"]["gates"]["a"]["ratio"].startswith("pass")


def _fl_arms():
    """FL round-3 arms (H 1.8, family H band 0.75-1.8): a's shoulders sit out on the arm (LOW), so the ratio gate blames shoulder_L +
    elbow_L on the left (a's elbow under the capelet edge) and shoulder_R + wrist_R on the right (a's wrist 2.4 cm into the hand)."""
    a = {"shoulder_L": e((0.3043, -0.0448, 1.4518), 0.2), "elbow_L": e((0.3995, -0.0440, 1.4653), 0.8),
         "wrist_L": e((0.7337, -0.0661, 1.4555), 0.8), "shoulder_R": e((-0.2314, -0.0456, 1.4679), 0.2),
         "elbow_R": e((-0.3826, -0.0431, 1.4612), 0.8), "wrist_R": e((-0.7337, -0.0660, 1.4558), 0.8)}
    d = {"shoulder_L": e((0.2074, -0.0457, 1.4941)), "elbow_L": e((0.4324, -0.0527, 1.4660)), "wrist_L": e((0.7137, -0.0598, 1.4660)),
         "shoulder_R": e((-0.1230, -0.0457, 1.4941)), "elbow_R": e((-0.3691, -0.0457, 1.4660)),
         "wrist_R": e((-0.6715, -0.0598, 1.4660))}
    return a, d


def test_ratio_only_drop_is_a_counted_ratio_disagree_tile():
    """Review r3 F1: a source a dropped by the segment-ratio gate alone leaves UniRig as the single plausible source, but the landmark
    is a counted tile of kind ratio_disagree (provisional d, impact from the a-d distance) whose choices include the weighted mean of
    a and d with gates_overridden ["a.ratio"]; a dropped for other gates too (FL shoulders: LOW) stays a vision-only flag."""
    a, d = _fl_arms()
    H_fl = 1.8
    f, rep = cs.fuse({"a": a, "d": d}, H_fl, FAM_H)
    tau = 0.015 * H_fl  # limb class, no mesh
    for lid in ("elbow_L", "wrist_R"):
        k = f[lid]
        assert k["gates_failed"]["a"] == ["ratio"] and k["plausible"] == ["d"], lid
        assert k["kind"] == "ratio_disagree" and k["flagged"] and k["flag"] == "vision" and k["provisional"] == "d", lid
        assert np.allclose(k["pos"], d[lid]["pos"]) and k["confidence"] <= 0.3 and "ratio_disagree" in k["decision"], lid
        assert k["dist_ad"] == pytest.approx(np.linalg.norm(np.subtract(a[lid]["pos"], d[lid]["pos"]))), lid
    for lid in ("shoulder_L", "shoulder_R"):  # a also fails the method gate: UniRig alone, vision-only as before
        assert f[lid]["kind"] == "single" and f[lid]["flag"] == "vision_only", lid
    assert f["wrist_L"]["kind"] == "agree" and f["elbow_R"]["kind"] == "agree"  # blamed elsewhere, a and d agree
    tiles = {t["key"]: t for t in rep["tiles"]}
    assert tiles["elbow"]["flag"] == "vision" and tiles["wrist"]["flag"] == "vision" and tiles["shoulder"]["flag"] == "vision_only"
    assert rep["n_tiles"] == 2 and rep["n_vision_only_tiles"] == 1 and rep["summary"]["n_ratio_disagree"] == 2  # FL: 3 -> 5
    for key, lid in (("wrist", "wrist_R"), ("elbow", "elbow_L")):  # impact from the a-d distance (wrist 3.5 % H, elbow 1.9 % H)
        assert tiles[key]["impact"] == pytest.approx(round(3.0 * min(3.0, f[lid]["dist_ad"] / tau), 3)), key
    assert [t["key"] for t in rep["tiles"]] == ["wrist", "elbow", "shoulder"]
    # the mean of a and d is offered, with the gate to acknowledge
    wa, wd = 1.0 * 0.8, 0.7 * 1.0
    mean = (np.array(a["wrist_R"]["pos"]) * wa + np.array(d["wrist_R"]["pos"]) * wd) / (wa + wd)
    ch, req = tiles["wrist"]["choices"]["wrist_R"], tiles["wrist"]["required_overrides"]["wrist_R"]
    assert set(ch) == {"a", "d", "mean", "escalate"} and np.allclose(ch["mean"], mean) and ch["escalate"] == ch["d"]
    assert req == {"a": ["a.ratio"], "d": [], "mean": ["a.ratio"], "escalate": []}
    assert tiles["shoulder"]["required_overrides"]["shoulder_L"]["a"] == ["a.method", "a.ratio"]
    assert "mean" not in tiles["shoulder"]["choices"]["shoulder_L"]  # only one plausible source and not ratio_disagree
    # vision decisions: the mean needs "a.ratio" (or the bare gate name); d needs nothing
    for gates, status in ((["a.ratio"], "applied"), (["ratio"], "applied"), ([], "rejected"), (["d.ratio"], "rejected")):
        f2, rep2 = cs.fuse({"a": a, "d": d}, H_fl, FAM_H, vision={"wrist_R": rec("mean", mean, gates=gates)})
        k = f2["wrist_R"]
        assert k["vision"]["status"] == status, gates
        if status == "applied":
            assert k["kind"] == "vision" and not k["flagged"] and np.allclose(k["pos"], mean), gates
            assert next(t for t in rep2["tiles"] if t["key"] == "wrist")["status"] == "resolved"
        else:
            assert k["flagged"] and "a.ratio" in k["vision"]["errors"][0], gates
    f2, _ = cs.fuse({"a": a, "d": d}, H_fl, FAM_H, vision={"elbow_L": rec("a", a["elbow_L"]["pos"], gates=["a.ratio"]),
                                                          "wrist_R": rec("d", d["wrist_R"]["pos"])})
    assert f2["elbow_L"]["vision"]["status"] == "applied" and np.allclose(f2["elbow_L"]["pos"], a["elbow_L"]["pos"])
    assert f2["wrist_R"]["vision"]["status"] == "applied" and np.allclose(f2["wrist_R"]["pos"], d["wrist_R"]["pos"])
    f2, _ = cs.fuse({"a": a, "d": d}, H_fl, FAM_H, vision={"elbow_L": rec("a", a["elbow_L"]["pos"])})
    assert f2["elbow_L"]["vision"]["status"] == "rejected" and "a.ratio" in f2["elbow_L"]["vision"]["errors"][0]
    # the mean of a plain two-source disagreement needs no gate acknowledgement
    f2, rep2 = cs.fuse({"a": {"elbow_L": e((0.15, 0, 0.3), 0.6)}, "d": {"elbow_L": e((0.20, 0, 0.3))}}, H, NOFAM)
    assert rep2["tiles"][0]["required_overrides"]["elbow_L"]["mean"] == []


def test_mirror_gate_in_y_z_blames_the_outlying_side():
    a = {"knee_L": e((0.1, 0, 0.30)), "knee_R": e((-0.1, 0, 0.21))}  # a's right knee found at a boot top
    d = {"knee_L": e((0.1, 0, 0.30)), "knee_R": e((-0.1, 0, 0.30))}
    f, _ = cs.fuse({"a": a, "d": d}, 1.0, NOFAM)
    assert f["knee_R"]["gates"]["a"]["mirror"].startswith("fail") and f["knee_L"]["gates"]["a"]["mirror"].startswith("pass")
    assert f["knee_R"]["kind"] == "single" and np.allclose(f["knee_R"]["pos"], (-0.1, 0, 0.30))
    b = {"knee_L": e((0.13, 0, 0.30)), "knee_R": e((-0.08, 0, 0.30))}  # x asymmetry is allowed (Tripo meshes are not x-symmetric)
    f, _ = cs.fuse({"a": b}, 1.0, NOFAM)
    assert f["knee_L"]["gates"]["a"]["mirror"].startswith("pass")


def _six_tiles(far=0.1):
    a, d = {}, {}
    for k, p in (("neck", (0, 0, 1.5)), ("head", (0, 0, 1.6)), ("chest", (0, 0, 1.3))):
        a[k], d[k] = e(p, 0.6), e(np.add(p, (0, far, 0)))
    for side in ("L", "R"):
        a[f"knee_{side}"], d[f"knee_{side}"] = e((0.1, 0, 0.5)), e((0.1, far, 0.5))
        a[f"palm_{side}"], d[f"palm_{side}"] = e((0.7, 0, 1.4)), e((0.7, far, 1.4))
        a[f"elbow_{side}"], d[f"elbow_{side}"] = e((0.4, 0, 1.4)), e((0.4, far, 1.4))
    return a, d


def _escalate_all(f, ids=None):
    return {lid: rec("escalate", f[lid]["pos"]) for lid in (ids or [k for k, v in f.items() if v["flagged"]])}


def test_tiles_pairs_impact_and_ready_for_user_after_vision():
    a, d = _six_tiles()
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM)
    keys = [t["key"] for t in rep["tiles"]]
    assert sorted(keys) == sorted(["neck", "head", "chest", "knee", "palm", "elbow"])  # L/R pairs share one tile
    assert keys[:2] == ["elbow", "knee"] and keys[-1] == "palm"  # limb joints first, tips last
    knee = rep["tiles"][1]
    assert knee["ids"] == ["knee_L", "knee_R"] and set(knee["candidates"]["knee_L"]) == {"a", "d"}
    assert knee["crop"]["half_size"] > 0 and len(knee["crop"]["centre"]) == 3 and set(knee["crops"]) == {"knee_L", "knee_R"}
    ch = knee["choices"]["knee_L"]
    assert ch["escalate"] == knee["provisional"]["knee_L"] and set(ch) == {"a", "d", "mean", "escalate"}
    assert ch["mean"][1] == pytest.approx(0.1 * 0.7 / (1.0 + 0.7))  # weighted mean of the two plausible sources
    # before the vision check: 6 tiles, all pending -> not ready (ready_for_user is evaluated after the vision decisions)
    assert rep["n_tiles"] == 6 and rep["n_pending"] == 6 and rep["ready_for_user"] is False and "pending" in rep["reasons"][0]
    f2, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision=_escalate_all(f))
    assert rep["n_escalated"] == 6 and rep["ready_for_user"] is True and rep["reasons"] == [] and len(rep["user_tiles"]) == 6
    assert all(f2[k]["flag"] == "escalated" for k in f2 if f2[k]["flagged"])
    a["wrist_L"], d["wrist_L"] = e((0.6, 0, 1.4)), e((0.6, 0.1, 1.4))  # a 7th tile, escalated too: too many for the user
    f, _ = cs.fuse({"a": a, "d": d}, 1.0, NOFAM)
    vis = _escalate_all(f)
    _, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision=vis)
    assert rep["n_escalated"] == 7 and rep["ready_for_user"] is False and "fix the detectors" in rep["reasons"][0]
    vis["wrist_L"] = rec("a", a["wrist_L"]["pos"])  # the vision check resolves one: 6 left for the user
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision=vis)
    assert f["wrist_L"]["kind"] == "vision" and rep["n_escalated"] == 6 and rep["ready_for_user"] is True
    assert next(t for t in rep["tiles"] if t["key"] == "wrist")["status"] == "resolved"


def test_derived_ground_points_follow_the_parent():
    a = {"toe_tip_L": e((0.1, -0.2, 0.01)), "toe_ground_L": e((0.1, -0.2, 0.0))}
    d = {"toe_tip_L": e((0.1, -0.2, 0.01)), "toe_ground_L": e((0.1, -0.14, 0.0))}  # UniRig toe end 60 mm back
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM)
    g = f["toe_ground_L"]
    assert g["kind"] == "derived" and not g["flagged"] and np.allclose(g["pos"], (0.1, -0.2, 0.0))
    assert all(t["key"] != "toe_ground" for t in rep["tiles"])


def test_override_and_vision_decision():
    a = {"elbow_L": e((0.15, 0, 0.3), 0.6)}
    d = {"elbow_L": e((0.20, 0, 0.3))}
    f, rep = cs.fuse({"a": a, "d": d}, H, NOFAM, override={"elbow_L": (0.17, 0.0, 0.3)})
    k = f["elbow_L"]
    assert k["kind"] == "override" and np.allclose(k["pos"], (0.17, 0, 0.3)) and not k["flagged"] and k["auto_flagged"]
    assert rep["tiles"][0]["status"] == "resolved" and rep["ready_for_user"] is True
    f, rep = cs.fuse({"a": a, "d": d}, H, NOFAM, vision={"elbow_L": rec("d", (0.20, 0, 0.3), reason="olecranon visible at d")})
    k = f["elbow_L"]
    assert k["kind"] == "vision" and not k["flagged"] and np.allclose(k["pos"], (0.20, 0, 0.3)) and "olecranon" in k["decision"]
    assert k["confidence"] == pytest.approx(0.6) and k["vision"]["status"] == "applied" and rep["vision"]["applied"] == ["elbow_L"]
    assert rep["n_pending"] == 0 and rep["ready_for_user"] is True
    f, _ = cs.fuse({"a": a, "d": d}, H, NOFAM, vision={"elbow_L": rec("mean", (0.175, 0, 0.3))})  # mean of the plausible sources
    assert f["elbow_L"]["vision"]["status"] == "applied" and f["elbow_L"]["pos"][0] == pytest.approx((0.15 * 0.6 + 0.2 * 0.7) / 1.3)


def test_incomplete_vision_record_is_rejected():
    """Review r2 N1: only full records count (choice, reason, evidence with sha256, inputs with hashes and the chosen position,
    gates_overridden, reviewer model/date/confidence); the landmark keeps waiting for the vision check."""
    a = {"elbow_L": e((0.15, 0, 0.3), 0.6)}
    d = {"elbow_L": e((0.20, 0, 0.3))}
    full = rec("d", (0.20, 0, 0.3))
    assert cs.validate_vision_record(full) == []
    bad = {"no evidence": {k: v for k, v in full.items() if k != "evidence"},
           "bad sha": dict(full, evidence=[{"path": "x.png", "view": "front", "sha256": "abc"}]),
           "no chosen_pos": dict(full, inputs={k: v for k, v in full["inputs"].items() if k != "chosen_pos"}),
           "no confidence": dict(full, reviewer={"model": "claude-opus-5-5", "date": "2026-10-23"}),
           "free position": dict(full, choice=[0.18, 0, 0.3]),
           "round-2 style": {"choice": "d", "reason": "olecranon visible at d"}}
    for why, r in bad.items():
        assert cs.validate_vision_record(r), why
        f, rep = cs.fuse({"a": a, "d": d}, H, NOFAM, vision={"elbow_L": r})
        k = f["elbow_L"]
        assert k["flagged"] and k["kind"] == "disagree" and np.allclose(k["pos"], (0.15, 0, 0.3)), why
        assert k["vision"]["status"] == "rejected" and rep["vision"]["rejected"]["elbow_L"] and rep["ready_for_user"] is False, why
        assert "vision decision rejected" in k["decision"]


def test_stale_vision_decision_is_reflagged():
    """Review r2 N1: a decision applies only while the chosen source stays within 0.25 tau of the recorded position."""
    a = {"elbow_L": e((0.15, 0, 0.3), 0.6)}
    vis = {"elbow_L": rec("d", (0.20, 0, 0.3))}
    tau = 0.015  # limb, H = 1, no mesh
    f, rep = cs.fuse({"a": a, "d": {"elbow_L": e((0.20 + 0.2 * tau, 0, 0.3))}}, H, NOFAM, vision=vis)
    assert f["elbow_L"]["kind"] == "vision" and not f["elbow_L"]["flagged"]  # moved 0.2 tau: still applied
    f, rep = cs.fuse({"a": a, "d": {"elbow_L": e((0.20 + 0.4 * tau, 0, 0.3))}}, H, NOFAM, vision=vis)
    k = f["elbow_L"]
    assert k["flagged"] and k["flag"] == "stale_vision_decision" and k["vision"]["status"] == "stale"
    assert k["vision"]["drift_tau"] == pytest.approx(0.4, abs=1e-3) and "stale" in k["decision"]
    assert "elbow_L" in rep["vision"]["stale"] and rep["tiles"][0]["status"] == "pending" and rep["ready_for_user"] is False
    # an escalation goes stale too when the provisional position moves
    f, _ = cs.fuse({"a": {"elbow_L": e((0.16, 0, 0.3), 0.6)}, "d": {"elbow_L": e((0.20, 0, 0.3))}}, H, NOFAM,
                   vision={"elbow_L": rec("escalate", (0.15, 0, 0.3))})
    assert f["elbow_L"]["flag"] == "stale_vision_decision"


def test_vision_record_must_acknowledge_failed_gates():
    a = {"knee_L": e((0.05, 0.03, 0.30))}  # fails the S knee prior
    d = {"knee_L": e((0.05, 0.03, 0.11))}
    f, _ = cs.fuse({"a": a, "d": d}, 0.5, FAM_S, vision={"knee_L": rec("a", (0.05, 0.03, 0.30))})
    assert f["knee_L"]["vision"]["status"] == "rejected" and "prior" in f["knee_L"]["vision"]["errors"][0]
    f, _ = cs.fuse({"a": a, "d": d}, 0.5, FAM_S, vision={"knee_L": rec("a", (0.05, 0.03, 0.30), gates=["prior"])})
    assert f["knee_L"]["kind"] == "vision" and np.allclose(f["knee_L"]["pos"], (0.05, 0.03, 0.30))
    # a sanity-only UniRig position needs "sanity" in gates_overridden
    pa, pd = {"pelvis": e((0.01, 0.03, 0.185), 0.2)}, {"pelvis": e((0.01, 0.03, 0.19), 1.0)}
    f, _ = cs.fuse({"a": pa, "d": pd}, 0.5, FAM_S)
    assert f["pelvis"]["kind"] == "no_plausible" and f["pelvis"]["flagged"]
    f, _ = cs.fuse({"a": pa, "d": pd}, 0.5, FAM_S, vision={"pelvis": rec("d", (0.01, 0.03, 0.19))})
    assert f["pelvis"]["vision"]["status"] == "rejected" and "sanity" in f["pelvis"]["vision"]["errors"][0]
    f, _ = cs.fuse({"a": pa, "d": pd}, 0.5, FAM_S, vision={"pelvis": rec("d", (0.01, 0.03, 0.19), gates=["d.sanity"])})
    assert f["pelvis"]["kind"] == "vision" and not f["pelvis"]["flagged"]


def _spine_case():
    a = {k: e(p, 0.2) for k, p in (("pelvis", (0, 0.03, 0.45)), ("spine_01", (0, 0.035, 0.55)), ("spine_02", (0, 0.035, 0.65)))}
    d = {k: e(p, 1.0) for k, p in (("pelvis", (0, 0.02, 0.50)), ("spine_01", (0, 0.02, 0.58)), ("spine_02", (0, 0.02, 0.67)))}
    a["chest"], d["chest"] = e((0, 0.03, 0.75), 0.6), e((0, 0.025, 0.755), 1.0)
    line = [[0.0, 0.03 + 0.01 * math.sin(math.pi * t), 0.45 + 0.3 * t] for t in np.linspace(0, 1, 21)]
    return a, d, {"spine_line": line}


def test_spine_tile_and_rederivation_from_the_placed_pelvis():
    """Review r2 (b): pelvis, spine_01 and spine_02 all flagged (a LOW, UniRig sanity-only) share one "spine" tile; once the vision
    check (or the user) places the pelvis, spine_01/02 are re-derived at 1/3, 2/3 of the straight pelvis -> chest line (review r3 F2)."""
    a, d, frame = _spine_case()
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, frame=frame)
    assert all(f[k]["flagged"] and f[k]["kind"] == "no_plausible" for k in cs.SPINE_GROUP)  # not taken from UniRig alone
    spine = [t for t in rep["tiles"] if t["key"] == "spine"]
    assert len(spine) == 1 and spine[0]["ids"] == ["pelvis", "spine_01", "spine_02"] and rep["n_tiles"] == 1
    assert not any(t["key"] in cs.SPINE_GROUP for t in rep["tiles"])
    assert spine[0]["required_overrides"]["pelvis"]["d"] == ["d.sanity"]
    vis = {"pelvis": rec("d", (0, 0.02, 0.50), gates=["sanity"]), "spine_01": rec("a", (0, 0.035, 0.55), gates=["method"])}
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision=vis, frame=frame)
    assert f["pelvis"]["kind"] == "vision" and np.allclose(f["pelvis"]["pos"], (0, 0.02, 0.50))
    chest = f["chest"]["pos"]
    assert not f["chest"]["flagged"]
    for k, frac in (("spine_01", 1 / 3), ("spine_02", 2 / 3)):
        assert f[k]["kind"] == "derived" and not f[k]["flagged"], k
        assert np.allclose(f[k]["pos"], np.array((0, 0.02, 0.50)) + frac * (np.asarray(chest) - (0, 0.02, 0.50))), k
        assert "straight line" in f[k]["decision"] and "mm" in f[k]["decision"], k  # a's spine-line offset recorded
    assert f["pelvis"]["pos"][2] < f["spine_01"]["pos"][2] < f["spine_02"]["pos"][2] < chest[2]
    assert rep["vision"]["unused"]["spine_01"].startswith("spine tile") and rep["tiles"][0]["status"] == "resolved"
    assert rep["ready_for_user"] is True
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, override={"pelvis": (0, 0.025, 0.48)}, frame=frame)  # the user places it
    assert f["spine_02"]["kind"] == "derived" and rep["tiles"][0]["status"] == "resolved"
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision={"pelvis": rec("escalate", (0, 0.02, 0.50))}, frame=frame)
    assert rep["tiles"][0]["status"] == "escalated" and rep["user_tiles"] == ["spine"] and f["spine_01"]["flagged"]


def test_spine_chord_point_ignores_the_coat_contour():
    """Review r3 F2: spine_01/02 sit at 1/3 and 2/3 of the straight pelvis -> chest line; source a's spine line carries coat and belt
    contours (D01: an 18 mm y-step between z 0.244 and 0.251 put spine_01 11.8 mm low when measured along its arc length)."""
    P, C = np.array([0.012, 0.025, 0.2407]), np.array([0.010, 0.022, 0.3114])  # D01: pelvis placed at UniRig's height, chest of a
    assert np.allclose(cs.spine_chord_point(P, C, 0.5), (P + C) / 2) and np.allclose(cs.spine_chord_point(P, C, 1 / 3), P + (C - P) / 3)
    a, d, _ = _spine_case()
    step = {"spine_line": [[0.0, 0.03 if z < 0.6 else 0.048, z] for z in np.linspace(0.40, 0.80, 81)]}  # a belt step at z 0.6
    vis = {"pelvis": rec("d", (0, 0.02, 0.50), gates=["d.sanity"])}
    f, _ = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision=vis, frame=step)
    chest = np.asarray(f["chest"]["pos"])
    for k, frac in (("spine_01", 1 / 3), ("spine_02", 2 / 3)):
        assert np.allclose(f[k]["pos"], np.array((0, 0.02, 0.50)) + frac * (chest - (0, 0.02, 0.50))), k
    f2, _ = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision=vis)  # the same without a spine line
    assert np.allclose(f2["spine_01"]["pos"], f["spine_01"]["pos"]) and "not available" in f2["spine_01"]["decision"]


def test_spine_waits_for_a_flagged_chest():
    """Review r3 F5: the pelvis is placed but the chest is still flagged - spine_01/02 are not derived toward the provisional chest;
    they wait in the spine tile (pending), go to the user with an escalated chest (no deadlock), and follow the chest once it is
    placed."""
    a, d, frame = _spine_case()
    d["chest"] = e((0, 0.025, 0.80), 1.0)  # 5 cm above a's chest: the chest is flagged (disagree)
    pel = rec("d", (0, 0.02, 0.50), gates=["sanity"])
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision={"pelvis": pel}, frame=frame)
    assert f["chest"]["flagged"] and f["pelvis"]["kind"] == "vision" and not f["pelvis"]["flagged"]
    tiles = {t["key"]: t for t in rep["tiles"]}
    for k in ("spine_01", "spine_02"):
        assert f[k]["flagged"] and f[k]["kind"] == "no_plausible" and f[k]["vision"]["status"] == "waiting for the chest", k
        assert np.allclose(f[k]["pos"], f[k]["auto_pos"]) and "waits for the chest" in f[k]["decision"], k
        assert tiles["spine"]["status_by_id"][k] == "pending", k
    assert tiles["spine"]["status_by_id"]["pelvis"] == "resolved" and tiles["spine"]["status"] == "pending"
    assert rep["ready_for_user"] is False
    # the chest escalated to the user: spine_01/02 go with it (escalated, not pending - the round can reach the user)
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision={"pelvis": pel, "chest": rec("escalate", a["chest"]["pos"])}, frame=frame)
    tiles = {t["key"]: t for t in rep["tiles"]}
    assert f["spine_01"]["flag"] == "escalated" and tiles["spine"]["status"] == "escalated" and tiles["chest"]["status"] == "escalated"
    assert sorted(rep["user_tiles"]) == ["chest", "spine"] and rep["ready_for_user"] is True
    # the chest placed (vision): spine_01/02 re-derived on the straight line to it
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision={"pelvis": pel, "chest": rec("a", a["chest"]["pos"])}, frame=frame)
    chest = np.asarray(f["chest"]["pos"])
    assert f["chest"]["kind"] == "vision" and np.allclose(chest, a["chest"]["pos"])
    assert np.allclose(f["spine_02"]["pos"], np.array((0, 0.02, 0.50)) + 2 / 3 * (chest - (0, 0.02, 0.50)))
    assert next(t for t in rep["tiles"] if t["key"] == "spine")["status"] == "resolved" and rep["ready_for_user"] is True
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, vision={"pelvis": pel}, override={"chest": (0, 0.03, 0.76)}, frame=frame)
    assert f["spine_01"]["kind"] == "derived" and np.allclose(f["spine_01"]["pos"], np.array((0, 0.02, 0.5)) + (np.array((0, 0.03, 0.76))
                                                                                                             - (0, 0.02, 0.5)) / 3)


def test_boot_ankle_needs_unirig_agreement():
    """Review r2 (c): source a's instep-crease ankle (interim_rule boot_ankle, confidence 0.45) is accepted only when UniRig (sanity
    only) agrees within tau; otherwise, or without UniRig, the vision check decides."""
    a = {"ankle_L": e((0.1, -0.05, 0.12), 0.45, interim_rule="boot_ankle")}
    f, _ = cs.fuse({"a": a, "d": {"ankle_L": e((0.11, -0.05, 0.13))}}, 1.0, NOFAM)
    k = f["ankle_L"]
    assert k["kind"] == "single" and not k["flagged"] and "boot ankle" in k["decision"] and np.allclose(k["pos"], (0.1, -0.05, 0.12))
    assert k["gates"]["d"]["role"].startswith("sanity")
    f, rep = cs.fuse({"a": a, "d": {"ankle_L": e((0.1, -0.05, 0.16))}}, 1.0, NOFAM)
    k = f["ankle_L"]
    assert k["kind"] == "boot_ankle" and k["flagged"] and k["flag"] == "vision" and k["provisional"] == "a"
    assert rep["tiles"][0]["key"] == "ankle" and rep["n_tiles"] == 1
    f, _ = cs.fuse({"a": a}, 1.0, NOFAM)
    assert f["ankle_L"]["flagged"] and "without UniRig" in f["ankle_L"]["decision"]
    f, _ = cs.fuse({"a": {"ankle_L": e((0.1, -0.05, 0.12), 0.8)}, "d": {"ankle_L": e((0.1, -0.05, 0.16))}}, 1.0, NOFAM)
    assert f["ankle_L"]["kind"] == "single" and not f["ankle_L"]["flagged"]  # plain ankle: d stays sanity-only
    # review r3 Q2: source a's note on the variant reaches the decision text
    a = {"ankle_L": e((0.1, -0.05, 0.12), 0.45, interim_rule="boot_ankle", interim_note="foot junction below a soft flare")}
    f, _ = cs.fuse({"a": a, "d": {"ankle_L": e((0.11, -0.05, 0.13))}}, 1.0, NOFAM)
    assert not f["ankle_L"]["flagged"] and "boot ankle (interim rule, foot junction below a soft flare)" in f["ankle_L"]["decision"]


def _cylinder(r=0.05, h=1.0, n=48, m=21, cx=0.0):
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    zs = np.linspace(0, h, m)
    V = [[cx + r * math.cos(t), r * math.sin(t), z] for z in zs for t in th]
    F = []
    for j in range(m - 1):
        for i in range(n):
            a_, b_ = j * n + i, j * n + (i + 1) % n
            F += [[a_, b_, b_ + n], [a_, b_ + n, a_ + n]]
    V += [[cx, 0, 0], [cx, 0, h]]
    c0, c1 = len(V) - 2, len(V) - 1
    for i in range(n):
        F += [[c0, (i + 1) % n, i], [c1, (m - 1) * n + i, (m - 1) * n + (i + 1) % n]]
    return np.array(V, dtype=float), np.array(F)


def _gg(frame_axis="leg_L"):
    V, F = _cylinder()
    mesh = {"V": V, "F": F, "weld": rmesh.weld_map(V)}
    frame = {"limb_axes": {frame_axis: [[0.0, 0.0, z] for z in np.linspace(0.05, 0.95, 10)]}}
    return cs.GateGeometry(mesh, frame)


def test_geometric_gates_on_a_cylinder_limb():
    """Vertical cylinder = a leg (axis along z, from source a's frame): inside, axis and tip-end gates."""
    gg = _gg()
    a = {"knee_L": e((0.0, 0.0, 0.5)), "ankle_L": e((0.0, 0.0, 0.2))}
    d = {"knee_L": e((0.035, 0.0, 0.5)), "ankle_L": e((0.0, 0.08, 0.2))}  # d knee 0.7 r off the axis; d ankle outside the leg
    f, _ = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, gg=gg)
    assert f["knee_L"]["gates"]["a"]["axis"] == "pass" and f["knee_L"]["gates"]["a"]["inside"] == "pass"
    assert f["knee_L"]["gates"]["d"]["axis"].startswith("fail") and f["knee_L"]["kind"] == "single"
    assert f["ankle_L"]["gates"]["d"]["inside"].startswith("fail: winding")
    assert f["knee_L"]["r_local"] == pytest.approx(0.05, abs=2e-3)  # distance to the surface from the axis
    # tip end: a tip with 0.3 of mesh beyond it along its limb fails; one at the end passes
    a2 = {"wrist_L": e((0.0, 0.0, 0.5)), "hand_tip_L": e((0.0, 0.0, 0.99))}
    d2 = {"wrist_L": e((0.0, 0.0, 0.5)), "hand_tip_L": e((0.0, 0.0, 0.7))}
    f, _ = cs.fuse({"a": a2, "d": d2}, 1.0, NOFAM, gg=_gg("arm_L"))
    assert f["hand_tip_L"]["gates"]["a"]["inside"].startswith("pass") and f["hand_tip_L"]["gates"]["d"]["inside"].startswith("fail")


def test_tile_crops_and_section_polylines():
    """Review r2 (a): tiles carry the crop box and mesh section polylines through the provisional point - perpendicular to the limb
    for limb joints (a closed ring on the cylinder), sagittal for centre landmarks - clipped to the landmark's crop box."""
    gg = _gg()
    a = {"knee_L": e((0.0, 0.0, 0.5)), "neck": e((0.0, 0.0, 0.8), 0.6)}
    d = {"knee_L": e((0.0, 0.0, 0.56)), "neck": e((0.0, 0.0, 0.9))}
    f, rep = cs.fuse({"a": a, "d": d}, 1.0, NOFAM, gg=gg)
    tiles = {t["key"]: t for t in rep["tiles"]}
    assert set(tiles) == {"knee", "neck"}
    for key, lid, kind in (("knee", "knee_L", "limb_perpendicular"), ("neck", "neck", "sagittal")):
        t = tiles[key]
        s = t["sections"][lid]
        lo, hi = np.array(t["crops"][lid]["box_min"]), np.array(t["crops"][lid]["box_max"])
        assert s["kind"] == kind and np.allclose(s["plane"]["origin"], t["provisional"][lid]) and s["polylines"], key
        for pl in s["polylines"]:
            P = np.array(pl["points"])
            assert len(P) >= 2 and np.all(P >= lo - 1e-9) and np.all(P <= hi + 1e-9), key
        assert t["crop"]["half_size"] >= t["crops"][lid]["half_size"] - 1e-12 and t["grid_m"] == pytest.approx(0.01)
    knee = tiles["knee"]["sections"]["knee_L"]
    assert abs(knee["plane"]["normal"][2]) > 0.99 and knee["polylines"][0]["closed"]
    ring = np.array(knee["polylines"][0]["points"])
    assert np.allclose(np.linalg.norm(ring[:, :2], axis=1), 0.05, atol=1e-3) and np.allclose(ring[:, 2], 0.5, atol=1e-9)
    neck = tiles["neck"]["sections"]["neck"]
    assert np.allclose(neck["plane"]["normal"], (1, 0, 0)) and all(np.allclose(np.array(p["points"])[:, 0], 0, atol=1e-9)
                                                                    for p in neck["polylines"])


def test_run_files_override_vision_and_flags_document(tmp_path):
    out = str(tmp_path)
    fam = "S"
    rlm.save_landmarks(os.path.join(out, "la.json"), "T2", fam, 0.5, {"knee_L": (0.05, 0.03, 0.11), "hip_L": (0.05, 0.03, 0.18),
                                                                     "elbow_L": (0.15, 0.0, 0.3)})
    rlm.save_landmarks(os.path.join(out, "ld.json"), "T2", fam, 0.5, {"knee_L": (0.05, 0.03, 0.13), "hip_L": (0.05, 0.03, 0.23),
                                                                     "elbow_L": (0.20, 0.0, 0.3)})
    npzio.write_json(os.path.join(out, "ov.json"), {"knee_L": [0.06, 0.03, 0.12]})
    npzio.write_json(os.path.join(out, "vis.json"), {"schema": 0, "asset_id": "T2", "decisions": {"elbow_L": rec("d", (0.20, 0.0, 0.3))}})
    r = cs.run("T2", fam, a=os.path.join(out, "la.json"), d=os.path.join(out, "ld.json"), override=os.path.join(out, "ov.json"),
               out_dir=os.path.join(out, "T2"), mesh=os.path.join(out, "missing_mesh.npz"), vision=os.path.join(out, "vis.json"))
    doc = npzio.read_json(r["landmarks"])
    schema.validate_landmarks(doc)
    k = doc["landmarks"]["knee_L"]
    assert k["pos"] == [0.06, 0.03, 0.12] and set(k["sources"]) >= {"a", "d", "e"} and "gates" in k and "tau" in k
    assert doc["landmarks"]["hip_L"]["gates"]["d"]["role"].startswith("sanity")
    el = doc["landmarks"]["elbow_L"]
    assert el["kind"] == "vision" and el["flag"] is None and el["auto_flagged"] and el["vision"]["status"] == "applied"
    assert el["vision"]["inputs_changed"] == ["landmarks_a", "landmarks_d", "mesh"]  # dummy hashes in the record; no mesh now
    assert "inputs changed since the decision" in el["decision"]
    assert r["inputs"]["e"].endswith("ov.json") and r["inputs"]["vision"].endswith("vis.json") and "mesh" not in r["inputs"]
    fl = npzio.read_json(r["flags"])
    for key in ("ready_for_user", "reasons", "notes", "n_tiles", "n_vision_only_tiles", "n_pending", "n_escalated", "user_tiles",
                "max_tiles", "tiles", "flags", "vision", "single_source", "summary", "config", "inputs", "inputs_sha256"):
        assert key in fl, key
    assert fl["config"]["sanity_only"] == ["pelvis", "spine_01", "spine_02", "hip", "ankle", "clavicle"]
    assert fl["inputs_sha256"]["landmarks_a"] == cs.file_sha256(os.path.join(out, "la.json")) and fl["inputs_sha256"]["mesh"] is None
    assert fl["vision"]["applied"] == ["elbow_L"] and fl["vision"]["file"].endswith("vis.json") and fl["ready_for_user"] is True
    assert all("required_overrides" in t and set(t["required_overrides"]) == set(t["ids"]) for t in fl["tiles"])
    assert "n_ratio_disagree" in fl["summary"]
    r2 = cs.run("T2", fam, a=os.path.join(out, "la.json"), d="", out_dir=os.path.join(out, "T2b"))  # "" = no UniRig source
    assert "d" not in r2["inputs"]
    # interim_rule / interim_note of source a survive the file round trip (landmarks_geo.write_landmarks_a -> load_source)
    rlm.save_landmarks(os.path.join(out, "la2.json"), "T3", fam, 0.5, {"ankle_L": (0.05, 0.0, 0.03)},
                       {"ankle_L": {"confidence": 0.45, "decision": "source a: boot ankle", "interim_rule": "boot_ankle",
                                    "interim_note": "foot junction below a soft flare"}})
    src, _ = cs.load_source(os.path.join(out, "la2.json"))
    assert src["ankle_L"]["interim_rule"] == "boot_ankle" and src["ankle_L"]["interim_note"] == "foot junction below a soft flare"

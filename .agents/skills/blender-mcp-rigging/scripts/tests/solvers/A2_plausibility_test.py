"""A2 tests: plausibility of the landmarks on D01, FL and U01 (review r1 finding 13, reviews r2 and r3): core joints inside the mesh,
knees within the family prior or LOW/flagged, arm and leg segment ratios inside the family band (families/<F>.json
plausibility.segment_ratio; plausibility.md warns below the band even when a joint of the chain is flagged), clavicles inside the torso
and reached from the spine/neck line without crossing a surface; FL/U01 failures of round 1 (knees at 0.21 H, FL shoulders 6-7 % H out
along the arm, U01 arms hidden in sleeves) must not be picked; the review-r2 rulings (UniRig sanity-only on the spine and clavicles, FL
spine as one flagged tile, boot ankles, vision-only flags), the review-r3 rulings (ratio_disagree tiles, U01 boot ankle below a soft
flare) and the flag tiles / ready_for_user after the vision check.

Runs the A2 pipeline (needs the UniRig outputs in E:\\tmp_unirig\\out\\<asset>\\) into <pytest basetemp>\\A2_plausibility\\<asset>:
choose the folder with pytest's --basetemp (default: pytest's tmp, which tests/conftest.py keeps under E:\\tmp_rigkit\\_pytest_tmp).

PYTEST_DONT_REWRITE
"""
import os
import sys

sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))
sys.path.insert(0, HERE)

import numpy as np  # noqa: E402
import pytest  # noqa: E402

from rigcore import npzio, template  # noqa: E402
from solvers import consensus as cs  # noqa: E402
from solvers import landmarks_geo as lg  # noqa: E402

import A2_pipeline as pipe  # noqa: E402


@pytest.fixture(scope="module")
def out_root(tmp_path_factory):
    return str(tmp_path_factory.getbasetemp() / "A2_plausibility")


@pytest.fixture(scope="module", params=list(pipe.ASSETS))
def asset(request, out_root):
    name = request.param
    spec = pipe.ASSETS[name]
    if not os.path.isfile(os.path.join(pipe.REPO, spec["glb"])):
        pytest.skip(f"{name}: GLB missing")
    if not os.path.isfile(os.path.join(r"E:\tmp_unirig\out", name, f"{name}_rigged.glb")):
        pytest.skip(f"{name}: UniRig output missing")
    summary = pipe.run_asset(name, spec, out_root)
    d = os.path.join(out_root, name)
    mesh = npzio.load_mesh(os.path.join(d, "mesh.npz"))
    return {"name": name, "spec": spec, "summary": summary, "H": spec["H"], "fam": template.load_family(spec["family"]), "dir": d,
            "cons": npzio.read_json(os.path.join(d, "landmarks.json"))["landmarks"],
            "a": npzio.read_json(os.path.join(d, "landmarks_a.json"))["landmarks"],
            "flags": npzio.read_json(os.path.join(d, "flags.json")),
            "plaus": npzio.read_json(os.path.join(d, "plausibility.json")),
            "geom": lg.MeshGeom(mesh["V"], mesh["F"], mesh["weld"])}


def _core(lms):
    return [k for k in lms if (k[:-2] if k.endswith(("_L", "_R")) else k) in lg.CORE]


def test_all_plausibility_checks_pass(asset):
    p = asset["plaus"]["summary"]
    assert p["n_checks"] > 40 and p["n_failed"] == 0, p["failed"]


def test_core_joints_inside_the_mesh(asset):
    g = asset["geom"]
    for who in ("a", "cons"):
        lms = asset[who]
        core = _core(lms)
        W = g.winding(np.array([lms[k]["pos"] for k in core]))
        bad = [k for k, w in zip(core, W) if w <= 0.5 and not lms[k].get("flagged") and lms[k].get("confidence", 1) > lg.LOW_CONF]
        assert not bad, (who, bad)


def test_knees_within_prior_or_low(asset):
    kp, H = asset["fam"]["priors"]["knee"], asset["H"]
    for s in ("L", "R"):
        a = asset["a"][f"knee_{s}"]
        if abs(a["pos"][2] / H - kp["z_over_H"]) > kp["tol_H"]:
            assert a["confidence"] <= lg.LOW_CONF, (s, a["pos"][2] / H, a["confidence"])
        c = asset["cons"][f"knee_{s}"]
        assert abs(c["pos"][2] / H - kp["z_over_H"]) <= kp["tol_H"] or c["flagged"], (s, c["pos"][2] / H)


def test_segment_ratios_in_the_family_band(asset):
    bands = cs.segment_ratio_bands(asset["fam"])
    assert asset["plaus"]["summary"]["segment_ratio_band"]["arm"] == list(bands["arm"])
    with open(os.path.join(asset["dir"], "plausibility.md"), encoding="utf-8") as fh:
        md = fh.read()
    for who in ("a", "cons"):
        lms = asset[who]
        for s in ("L", "R"):
            for chain, joints in (("arm", ("shoulder", "elbow", "wrist")), ("leg", ("hip", "knee", "ankle"))):
                ids = [f"{j}_{s}" for j in joints]
                r = lg.segment_ratio(*(lms[i]["pos"] for i in ids))
                lo, hi = bands[chain]
                excused = [i for i in ids if lms[i].get("flagged") or lms[i].get("confidence", 1) <= lg.LOW_CONF]
                assert lo <= r <= hi or excused, (who, chain, s, r)
                if r < lo:  # review r2 N4: warned even when a joint of the chain is flagged
                    tag = "consensus" if who == "cons" else who
                    assert f"WARN {tag}: {chain}_{s} ratio {r:.2f} below the family band {lo}-{hi}" in md, (who, chain, s, r)


def test_clavicles_inside_the_torso_and_reachable(asset):
    g = asset["geom"]
    for who in ("a", "cons"):
        lms = asset[who]
        chest = np.array(lms["chest"]["pos"])
        lp, zl = pipe.chest_loop(g, chest, asset["H"])
        for s in ("L", "R"):
            assert f"clavicle_{s}" in lms, (who, s)  # round 2: source a gives clavicles on every asset
            c = lms[f"clavicle_{s}"]
            p = np.array(c["pos"])
            in_loop = lp is None or lg.loop_contains(lp, np.array([p[0], p[1], zl]))  # open torso surface: inside-mesh test only
            assert (in_loop and g.winding(p[None])[0] > 0.5) or c.get("flagged"), (who, s, p)
            seg = pipe.clavicle_segment(g, lms, s)  # review r2 N2
            assert seg["crossings"] == 0 or not seg["line_inside"] or c.get("flagged"), (who, s, seg)
    for s in ("L", "R"):  # review r3 F3: a clavicle corrected by the segment test is LOW and flagged in consensus
        c = asset["a"][f"clavicle_{s}"]
        assert c["diag"]["segment"]["ok"] is not False or (c["confidence"] <= lg.LOW_CONF and asset["cons"][f"clavicle_{s}"]["flagged"])


def test_round1_failures_are_not_picked(asset):
    name, cons, a, H = asset["name"], asset["cons"], asset["a"], asset["H"]
    if name == "FL_flagellant_vA":
        for s in ("L", "R"):  # round 1: shoulders 6-7 % H out along the arm (upper arm 0.053 H vs forearm 0.185 H)
            assert a[f"shoulder_{s}"]["confidence"] <= lg.LOW_CONF
            assert cons[f"shoulder_{s}"]["kind"] == "single" and "d" in cons[f"shoulder_{s}"]["sources"]
            assert not cons[f"shoulder_{s}"]["gates"]["d"]["ratio"].startswith("fail")
            assert cons[f"knee_{s}"]["pos"][2] / H > 0.25  # round 1: 0.216 H
    if name == "U01_shambler":
        for s in ("L", "R"):  # round 1: knees at the wrap top 0.21 H; kneecaps at ~0.30-0.31 H (textured render)
            assert "kneecap" in a[f"knee_{s}"]["decision"] and 0.27 <= a[f"knee_{s}"]["pos"][2] / H <= 0.31
            assert a[f"elbow_{s}"]["confidence"] <= lg.LOW_CONF  # arms hidden in the sleeves
    if name == "D01_hodling":
        assert a["clavicle_L"]["pos"][1] > -0.03  # round 1: in the jaw at y -0.078


def test_review_r2_rulings(asset):
    """(b) UniRig sanity-only on the spine and clavicles, the FL spine flagged as one tile (not taken from UniRig alone); (c) boot ankle
    on FL (shoe collar) and, since review r3 Q2, on U01 (foot junction below a soft flare), not on D01; (a) UniRig-only landmarks are
    vision-only flags with tile data for the crop renderer."""
    name, cons, a, f, H = asset["name"], asset["cons"], asset["a"], asset["flags"], asset["H"]
    for lid in ("spine_01", "spine_02", "clavicle_L", "clavicle_R", "pelvis"):
        if "d" in cons[lid]["sources"]:
            assert cons[lid]["gates"]["d"]["role"].startswith("sanity"), (name, lid)
            assert cons[lid]["kind"] != "agree" and cons[lid].get("flag") != "vision_only", (name, lid)
    tiles = {t["key"]: t for t in f["tiles"]}
    if name == "FL_flagellant_vA":
        assert tiles["spine"]["ids"] == ["pelvis", "spine_01", "spine_02"] and tiles["spine"]["flag"] == "vision"
        assert all(cons[k]["flagged"] and cons[k]["kind"] == "no_plausible" for k in ("pelvis", "spine_01", "spine_02"))
        assert not any(k in tiles for k in ("pelvis", "spine_01", "spine_02"))
        for s in ("L", "R"):
            an = a[f"ankle_{s}"]
            assert an.get("interim_rule") == "boot_ankle" and an["confidence"] == pytest.approx(lg.BOOT_ANKLE_CONF)
            assert 0.06 <= an["pos"][2] / H <= 0.075 and an["diag"]["boot"]["edges"]  # instep crease under the shoe collar
            assert an["diag"]["boot"]["below_flare"] is False and "interim_note" not in an  # the collar step is the flare itself
            c = cons[f"ankle_{s}"]
            assert c["kind"] == "single" and not c["flagged"] and "boot ankle" in c["decision"]
    elif name == "U01_shambler":  # review r3 Q2: wraps make a soft flare at z 0.159; the foot junction (x0.82) lies at z 0.115-0.121
        for s in ("L", "R"):  # in the sagittal section the instep top meets the leg front at z 0.120-0.122 (crease samples 2.1 mm apart)
            an = a[f"ankle_{s}"]
            b = an["diag"]["boot"]
            assert an.get("interim_rule") == "boot_ankle" and an.get("interim_note") == "foot junction below a soft flare"
            assert b["triggered"] and b["below_flare"] is True and b["z_cuff"] < b["z_flare"]
            assert 0.11 <= an["pos"][2] <= 0.125 and an["confidence"] == pytest.approx(lg.BOOT_ANKLE_CONF)
            c = cons[f"ankle_{s}"]  # UniRig (sanity, z 0.124) agrees within tau: accepted
            assert c["kind"] == "single" and not c["flagged"] and "foot junction below a soft flare" in c["decision"], c["decision"]
            assert abs(c["sources"]["d"][2] - an["pos"][2]) < 0.015
    else:
        for s in ("L", "R"):
            assert a[f"ankle_{s}"]["diag"]["boot"]["triggered"] is False and "interim_rule" not in a[f"ankle_{s}"]
    if name == "D01_hodling":
        assert not any(cons[k]["flagged"] for k in ("pelvis", "spine_01", "spine_02", "clavicle_L", "clavicle_R"))
    for lid, e in cons.items():
        if e.get("flag") == "vision_only":
            assert e["kind"] == "single" and "d" in e["sources"] and e["auto_flagged"], lid
    for t in f["tiles"]:
        assert t["crop"]["half_size"] > 0 and set(t["crops"]) == set(t["ids"]) and set(t["sections"]) == set(t["ids"]), t["key"]
        for lid in t["ids"]:
            s = t["sections"][lid]
            lo, hi = np.array(t["crops"][lid]["box_min"]), np.array(t["crops"][lid]["box_max"])
            assert s["kind"] in ("limb_perpendicular", "sagittal") and np.allclose(s["plane"]["origin"], t["provisional"][lid])
            for pl in s["polylines"]:
                P = np.array(pl["points"])
                assert np.all(P >= lo - 1e-6) and np.all(P <= hi + 1e-6), (t["key"], lid)
        assert any(s["polylines"] for s in t["sections"].values()), t["key"]


def test_review_r3_rulings(asset):
    """F1: a landmark whose source a failed only the ratio gate is a counted ratio_disagree tile (FL elbow_L under the capelet edge,
    wrist_R inside the bracer) with the a+d mean offered (gates_overridden "a.ratio"); a vision-only flag needs a to fail more than
    the ratio gate. Q2: the boot ankle resolves the U01 ankles (the FL ones as before), so no ankle tile there."""
    name, cons, f = asset["name"], asset["cons"], asset["flags"]
    tiles = {t["key"]: t for t in f["tiles"]}
    for lid, e in cons.items():
        failed_a = [g for g, v in e["gates"].get("a", {}).items() if str(v).startswith("fail")]
        if e.get("flag") == "vision_only":
            assert failed_a != ["ratio"], lid
        if e["kind"] == "ratio_disagree":
            t = next(t for t in f["tiles"] if lid in t["ids"])
            assert failed_a == ["ratio"] and e["flagged"] and e["flag"] == "vision" and t["flag"] == "vision", lid
            assert t["provisional_source"][lid] == "d" and np.allclose(t["provisional"][lid], e["sources"]["d"]), lid
            assert "mean" in t["choices"][lid] and t["required_overrides"][lid]["mean"] == ["a.ratio"], lid
    assert f["summary"]["n_ratio_disagree"] == sum(e["kind"] == "ratio_disagree" for e in cons.values())
    if name == "FL_flagellant_vA":
        assert {k for k, e in cons.items() if e["kind"] == "ratio_disagree"} == {"elbow_L", "wrist_R"}
        assert tiles["elbow"]["flag"] == "vision" and tiles["wrist"]["flag"] == "vision" and tiles["shoulder"]["flag"] == "vision_only"
    if name in ("FL_flagellant_vA", "U01_shambler"):
        assert "ankle" not in tiles


def test_tiles_and_ready_for_user(asset):
    f, cons = asset["flags"], asset["cons"]
    keys = [t["key"] for t in f["tiles"]]
    assert len(keys) == len(set(keys))  # L/R pairs (and the spine group) share one tile
    impacts = [t["impact"] for t in f["tiles"]]
    assert impacts == sorted(impacts, reverse=True)
    auto = {k for k, e in cons.items() if e["auto_flagged"]}
    assert auto == {i for t in f["tiles"] for i in t["ids"]}
    assert {k for k, e in cons.items() if e["flagged"]} <= auto
    assert f["n_tiles"] == sum(t["flag"] == "vision" for t in f["tiles"]) and f["n_vision_only_tiles"] == len(keys) - f["n_tiles"]
    pending = [t for t in f["tiles"] if t["status"] == "pending"]
    assert f["n_pending"] == len(pending) and f["ready_for_user"] == (not pending and f["n_escalated"] <= f["max_tiles"])
    assert (f["reasons"] == []) == f["ready_for_user"]
    assert all(t["status"] == "pending" for t in f["tiles"])  # no vision_decisions.json in the pipeline: everything waits for it
    assert len(f["inputs_sha256"]["landmarks_a"]) == 64 and len(f["inputs_sha256"]["mesh"]) == 64

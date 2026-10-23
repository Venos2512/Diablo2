"""Owner G2 (rigkit-env, pure Python): chain merge + outward bend tests (rigkit.skeleton), leg-push maths (rigkit.control), garment
compounds and chain poses (rigkit.poses), and the FL fixture pose export (E:\\tmp_rigkit\\G2\\fl, skipped when missing).

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/rigkit/G2_pure_test.py -q -p no:cacheprovider
"""
import json
import math
import os

import pytest

from rigcore import template
from rigkit import control, poses as RP, skeleton

FIX = os.path.join(os.path.dirname(os.path.abspath(__file__)), "G2_fixtures")
FL_RUN = r"E:\tmp_rigkit\G2\fl"


def _skel():
    bones = [{"name": "root", "parent": None, "kind": "core", "deform": False, "head": [0, 0, 0], "tail": [0, 0, 0.1],
              "hinge": [1, 0, 0], "bend_test": None, "twist": None},
             {"name": "pelvis", "parent": "root", "kind": "core", "deform": True, "head": [0, 0, 1.0], "tail": [0, 0, 1.1],
              "hinge": [1, 0, 0], "bend_test": None, "twist": None}]
    return {"schema": 0, "family": "T", "template_version": "t", "H": 1.8, "bones": bones, "ik": [], "rom": [], "rom_compound": [],
            "skin": {}}


def _chain(cid, phi, n=3, parent="pelvis", side=None, fan_root=None, first=1):
    a = math.radians(phi)
    out = [math.sin(a), -math.cos(a), 0.0]
    bl = []
    for k in range(n):
        head = [0.2 * out[0], 0.2 * out[1], 1.0 - 0.2 * k]
        tail = [0.2 * out[0], 0.2 * out[1], 0.8 - 0.2 * k]
        hinge = [out[1] * -1.0 * -1.0 * 0 - 0.0, 0.0, 0.0]
        y = [0.0, 0.0, -1.0]
        hinge = [y[1] * out[2] - y[2] * out[1], y[2] * out[0] - y[0] * out[2], y[0] * out[1] - y[1] * out[0]]
        bl.append({"name": f"{cid}_{k + first:02d}", "parent": parent if k == 0 else bl[-1]["name"], "head": head, "tail": tail,
                   "hinge": hinge})
    return {"id": cid, "piece": "auto:0", "class": "strip", "side": side, "azimuth_deg": phi, "fan_root": fan_root, "bones": bl,
            "leg_push": {"enabled": True, "w_L": 0.5 + 0.35 * math.sin(a), "w_R": 0.5 - 0.35 * math.sin(a), "dir": out,
                         "max_deg": 60.0}}


def test_G2_merge_chains_fallback_and_outward_tokens():
    ch = {"chains": [_chain("tail_F", 0.0), _chain("tail_B", 180.0), _chain("L_tail_S", 90.0, side="L"),
                     _chain("R_tail_S", -90.0, side="R"), _chain("L_tail_FS", 45.0, side="L")]}
    sk = skeleton.merge_chains(_skel(), ch)
    names = [b["name"] for b in sk["bones"]]
    assert names[:2] == ["root", "pelvis"] and len(names) == 2 + 15
    roots = {b["name"]: b for b in sk["bones"] if b.get("bend_test")}
    assert {k: v["bend_test"] for k, v in roots.items()} == {
        "tail_F_01": "swings outward (-Y)", "tail_B_01": "swings outward (+Y)", "L_tail_S_01": "swings outward (+X)",
        "R_tail_S_01": "swings outward (-X)", "L_tail_FS_01": "swings outward (+X)"}
    assert all(b["kind"] == "aux" and b["deform"] and b["chain"] for b in sk["bones"][2:])
    assert skeleton.parse_bend_test(roots["tail_F_01"]["bend_test"])[1] == "-Y"
    with pytest.raises(ValueError):
        skeleton.merge_chains(_skel(), {"chains": [_chain("x", 0.0, parent="nope")]})
    # G1's text "+X swings the cloth outward" names no world direction: outward_bend_tests rewrites it
    g1 = skeleton.merge_chains(_skel(), ch)
    for b in g1["bones"]:
        if b.get("bend_test"):
            b["bend_test"] = "+X swings the cloth outward"
    fixed = skeleton.outward_bend_tests(g1, ch)
    assert all(skeleton.parse_bend_test(b["bend_test"]) for b in fixed["bones"] if b.get("bend_test"))


def test_G2_leg_push_maths():
    # thigh rest frame of family H: local X = +X world, local Y = down, local Z = +Y world (back)
    axes = {"L": ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0)), "R": ((1.0, 0.0, 0.0), (0.0, 1.0, 0.0))}
    front = control.leg_push_coeffs({"dir": [0, -1, 0], "w_L": 0.5, "w_R": 0.5}, axes)
    back = control.leg_push_coeffs({"dir": [0, 1, 0], "w_L": 0.5, "w_R": 0.5}, axes)
    side_l = control.leg_push_coeffs({"dir": [1, 0, 0], "w_L": 0.85, "w_R": 0.15}, axes)
    flex = math.radians(-90.0)  # flexion = -X: ROT_X = -90 deg, swing 90 deg
    both = {"L": (flex, 0.0, abs(flex)), "R": (flex, 0.0, abs(flex))}
    assert math.degrees(control.leg_push_value(front, 60.0, both)) == pytest.approx(60.0)  # 90 clamped
    assert math.degrees(control.leg_push_value(back, 60.0, both)) == pytest.approx(0.0)
    # abduction of the left leg 45 deg: knee to +X = a swing about local -Z (tail along (-az, 0, ax) = +X)
    ab = {"L": (0.0, math.radians(-45.0), math.radians(45.0))}
    assert math.degrees(control.leg_push_value(side_l, 60.0, ab)) == pytest.approx(0.85 * 45.0)
    expr = control.leg_push_expression(front, 60.0)
    assert len(expr) <= control.EXPRESSION_MAX and "sin(a/2)" in expr and "sin(d/2)" in expr
    assert control.name_class("L_tail_S_01") == "tail" and control.name_class("lantern_swing") == "swing"


def test_G2_garment_compounds_planned_only_with_chains():
    fam = template.expand_sides(template.load_family("H"))
    for nm in ("deep_crouch", "high_kick_L", "sit", "run_stride", "lean_fwd", "lean_back"):
        assert nm in fam["rom_compound"]
    specs, skipped = RP.plan_compound(fam["rom_compound"], {}, 1.8, fam)
    assert not [s for s in skipped if s["id"] in RP.GARMENT_COMPOUNDS]
    dc = next(s for s in specs if s["name"] == "deep_crouch")
    assert [(o["bones"][0], o["deg"]) for o in dc["ops"]] == [("ctl_L_Thigh", -60.0), ("ctl_R_Thigh", -60.0),
                                                              ("ctl_L_Calf", 95.0), ("ctl_R_Calf", 95.0)]
    assert set(dc["ik"]) == {"ik_leg_L", "ik_leg_R"} and "garment" in dc["tags"]
    lf = next(s for s in specs if s["name"] == "lean_fwd")
    assert lf["ik"] == "default" and lf["ops"][0]["deg"] == 30.0 and "planted_L" in lf["tags"]


def test_G2_chain_poses_grouped_and_capped():
    ch = {"chains": [_chain("tail_F", 0.0), _chain("tail_B", 180.0), _chain("L_tail_S", 90.0, side="L"),
                     _chain("R_tail_S", -90.0, side="R")]}
    sk = skeleton.merge_chains(_skel(), ch)
    specs, rep = RP.plan_chain_poses(sk)
    assert rep["level"] == "class+side" and len(specs) == 6  # (tail, C), (tail, LR): root +-30 and mid
    assert all(len(op["bones"]) == 1 and op["axis"] == "X" for s in specs for op in s["ops"])
    # many classes and sides: coarsened to <= 12
    many = [_chain(f"{c}_{k}", phi, side=sd) for k, (c, phi, sd) in enumerate(
        [("tail", 0, None), ("cape", 180, None), ("charm", 30, None), ("main_hair", 170, None), ("L_tail", 90, "L"),
         ("R_tail", -90, "R"), ("L_charm", 60, "L"), ("R_cape", -150, "R"), ("other", 10, None)])]
    for c in many:
        for b in c["bones"]:
            b["name"] = c["id"] + b["name"][len(c["id"]):]
    sk2 = skeleton.merge_chains(_skel(), {"chains": many})
    specs2, rep2 = RP.plan_chain_poses(sk2)
    assert len(specs2) <= RP.MAX_CHAIN_POSES and rep2["level"] != "class+side"


def test_G2_fl_fixture_pose_export():
    p = os.path.join(FL_RUN, "s7", "poses_summary.json")
    q = os.path.join(FL_RUN, "s7_nochains", "poses_summary.json")
    if not (os.path.exists(p) and os.path.exists(q)):
        pytest.skip("run tests/rigkit/G2_run_fl_fixture.py first")
    with open(p, "rb") as f:
        a = json.loads(f.read().decode("utf-8"))
    with open(q, "rb") as f:
        b = json.loads(f.read().decode("utf-8"))
    pl = a["plan"]
    assert pl["chain_poses"]["n"] <= 12 and pl["chain_poses"]["n"] > 0 and not pl["chain_poses"]["skipped_missing_controls"]
    assert pl["n_compound"] == 13 and not pl["garment_compounds_skipped"]
    assert b["plan"]["n_compound"] == 7 and "chain_poses" not in b["plan"]
    assert a["n_poses"] == b["n_poses"] + 6 + pl["chain_poses"]["n"]
    assert a["seconds"] - b["seconds"] < 60.0
    assert a["emulation_vs_source_max_m"] < 1e-5 and a["settle_max_m"] <= 1e-7

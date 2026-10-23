"""A1 unit tests (rigkit-env, pure Python): the legacy family S_legacy_D01 + legacy pre-bend resolves to exactly D01's runtime
skeleton (d01_rig_def.build), the humanoid_v1 control plan equals d01_rig_def.control_bones, pre-bend modes, bend-test tokens, and the
S template on D01 landmarks (+ TEST-ONLY synthesized clavicles).

Run from ``scripts/``:  E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest tests/rigkit -q
D01 files are read only (the D01 rig definition is imported from its asset folder; bytecode writing is off in conftest).
"""
import importlib.util
import math
import os

import pytest

from rigcore import geom, landmarks, template
from rigkit import control, skeleton


@pytest.fixture(scope="module")
def d01_def(d01_tools_dir):
    path = os.path.join(d01_tools_dir, "d01_rig_def.py")
    spec = importlib.util.spec_from_file_location("d01_rig_def_readonly", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def legacy(d01_landmarks_path):
    fam = template.load_family("S_legacy_D01")
    lm = landmarks.from_d01_landmarks(d01_landmarks_path)
    lm2, rep = skeleton.apply_prebend(lm, fam)
    skel = template.resolve(fam, lm2, 0.5)
    return fam, lm, lm2, rep, skel


def test_legacy_family_matches_d01_build_bit_for_bit(legacy, d01_def):
    fam, _, _, _, skel = legacy
    B = d01_def.build()
    ref = {b["name"]: b for b in B}
    got = {b["name"]: b for b in skel["bones"]}
    assert len(skel["bones"]) == 35 and set(got) == set(ref)
    worst = 0.0
    for nm, r in ref.items():
        g = got[nm]
        assert g["parent"] == r["parent"], nm
        assert g["kind"] == r["kind"], nm
        assert g["deform"] == (r["kind"] in ("core", "aux") and nm not in ("root", "cog")), nm
        for k in ("head", "tail", "hinge"):
            worst = max(worst, max(abs(a - b) for a, b in zip(g[k], r[k])))
        # roll target vector exactly as D01 computes it
        zr, _ = d01_def.roll_z(r["head"], r["tail"], r["hinge"])
        assert geom.roll_z_vector(g["head"], g["tail"], g["hinge"]) == pytest.approx(zr, abs=1e-15), nm
    assert worst <= 1e-15, worst


def test_legacy_sibling_order_matches_d01(legacy, d01_def):
    """Blender lists bones depth first with children in creation order, so equal sibling order = equal armature bone order."""
    _, _, _, _, skel = legacy

    def kids(bones):
        out = {}
        for b in bones:
            out.setdefault(b["parent"], []).append(b["name"])
        return out

    assert kids(skel["bones"]) == kids(d01_def.build())


def test_legacy_prebend_equals_d01_fitted_landmarks(legacy, d01_def):
    _, lm, lm2, rep, _ = legacy
    arm, leg = d01_def.fitted_landmarks()
    assert tuple(lm2["elbow_L"]) == tuple(arm["elbow"])
    assert tuple(lm2["elbow_R"]) == (-arm["elbow"][0], arm["elbow"][1], arm["elbow"][2])
    for k in ("knee", "hip", "ankle"):
        assert tuple(lm2[f"{k}_L"]) == tuple(leg[k])
    assert rep["params"]["mode"] == "legacy_d01"
    rows = {r["chain"]: r for r in rep["chains"]}
    assert rows["leg_L"]["moved_m"] == 0.0 and rows["leg_R"]["moved_m"] == 0.0
    assert 3.9 < rows["arm_L"]["angle_after_deg"] < 4.1  # D01: 3.3 mm ~ 4 deg
    assert 9.0 < rows["leg_L"]["angle_after_deg"] < 9.6  # D01 measured knee bend ~9 deg
    unchanged = set(lm) - {"elbow_L", "elbow_R"}
    assert all(tuple(lm[k]) == tuple(lm2[k]) for k in unchanged)


def test_control_plan_matches_d01_control_bones(legacy, d01_def):
    fam, _, lm2, _, skel = legacy
    prm = control.control_params(fam)
    got = control.plan(skel, lm2, prm)
    ref = d01_def.control_bones()
    assert len(got) == 45 and {e["name"] for e in got} == {r["name"] for r in ref}

    def kids(rows):
        out = {}
        for r in rows:
            out.setdefault(r["parent"], []).append(r["name"])
        return out

    assert kids(got) == kids(ref)  # same sibling creation order -> same bone order in Blender
    by = {e["name"]: e for e in got}
    worst = 0.0
    for r in ref:
        g = by[r["name"]]
        assert g["parent"] == r["parent"], g["name"]
        for k in ("head", "tail"):
            worst = max(worst, max(abs(a - b) for a, b in zip(g[k], r[k])))
        if r["zvec"] is not None:
            assert tuple(g["zvec"]) == tuple(r["zvec"]), g["name"]
        else:
            assert g["zvec"] is None and tuple(g["hinge"]) == tuple(r["hinge"]), g["name"]
        assert g["kind"] == r["kind"], g["name"]
    assert worst <= 1e-15, worst


def test_prebend_measured_modes():
    fam = template.load_family("S")
    base = {"shoulder_L": (0.1, 0.0, 1.0), "elbow_L": (0.4, 0.0, 1.0), "wrist_L": (0.7, 0.0, 1.0),
            "hip_L": (0.1, 0.0, 0.9), "knee_L": (0.1, -0.03, 0.5), "ankle_L": (0.1, 0.0, 0.1)}
    for k, v in list(base.items()):
        base[k.replace("_L", "_R")] = (-v[0], v[1], v[2])
    out, rep = skeleton.apply_prebend(base, fam, {"mode": "measured"})
    rows = {r["chain"]: r for r in rep["chains"]}
    # straight arm -> rebent to 5 deg toward +Y (back), perpendicular to the shoulder-wrist line
    assert rows["arm_L"]["action"].startswith("rebent")
    assert rows["arm_L"]["angle_after_deg"] == pytest.approx(5.0, abs=1e-9)
    assert out["elbow_L"][1] > 0 and out["elbow_L"][0] == pytest.approx(0.4) and out["elbow_L"][2] == pytest.approx(1.0)
    # knee already bent forward by 2 x atan(0.03 / 0.4) = 8.58 deg -> kept
    assert rows["leg_L"]["action"].startswith("kept")
    assert tuple(out["knee_L"]) == base["knee_L"]
    # knee bent BACKWARD by 8.6 deg -> rebent forward to 5 deg
    bad = dict(base, knee_L=(0.1, 0.03, 0.5))
    out2, rep2 = skeleton.apply_prebend(bad, fam, {"mode": "measured"})
    r2 = {r["chain"]: r for r in rep2["chains"]}["leg_L"]
    assert "away" in r2["action"] and out2["knee_L"][1] < 0
    assert r2["angle_after_deg"] == pytest.approx(5.0, abs=1e-9)
    # off: nothing moves
    out3, _ = skeleton.apply_prebend(base, fam, {"mode": "off"})
    assert all(tuple(out3[k]) == tuple(v) for k, v in base.items())
    with pytest.raises(ValueError):
        skeleton.apply_prebend(base, fam, {"mode": "nonsense"})


def test_parse_bend_test_tokens():
    assert skeleton.parse_bend_test("top moves forward (-Y)")[1] == "-Y"
    assert skeleton.parse_bend_test("tail moves up (+Z)")[0] == (0.0, 0.0, 1.0)
    assert skeleton.parse_bend_test("hand goes forward (\u2212Y)")[1] == "-Y"
    assert skeleton.parse_bend_test(None) is None and skeleton.parse_bend_test("") is None
    with pytest.raises(ValueError):
        skeleton.parse_bend_test("goes somewhere")


def test_s_template_on_d01_synthesized(d01_landmarks_path):
    fam = template.load_family("S")
    lm = landmarks.synthesize_missing(landmarks.from_d01_landmarks(d01_landmarks_path), fam, 0.5)
    skel, lm2, rep = skeleton.resolve_skeleton(fam, lm, 0.5)
    names = [b["name"] for b in skel["bones"]]
    assert len(names) == 36 and len(set(names)) == 36
    rows = {r["chain"]: r for r in rep["chains"]}
    assert rows["arm_L"]["action"].startswith("rebent") and rows["arm_L"]["angle_after_deg"] == pytest.approx(5.0, abs=1e-9)
    assert rows["leg_L"]["action"].startswith("kept")  # D01 knee bends ~9 deg forward
    tw = {b["name"]: b["twist"] for b in skel["bones"] if b["twist"]}
    assert tw == {"L_UpperArm_twist": {"driver": "L_UpperArm", "axis": "Y", "factor": -0.5},
                  "R_UpperArm_twist": {"driver": "R_UpperArm", "axis": "Y", "factor": -0.5},
                  "L_ForeArm_twist": {"driver": "L_Hand", "axis": "Y", "factor": 0.5},
                  "R_ForeArm_twist": {"driver": "R_Hand", "axis": "Y", "factor": 0.5}}
    plan = control.plan(skel, lm2)
    pn = [e["name"] for e in plan]
    assert "ctl_L_Clavicle" in pn and "ctl_R_Clavicle" in pn
    assert not any(n.endswith("_twist") for n in pn) and not any(n in pn for n in ("ctl_ground", "ctl_fx_head"))
    assert len(pn) == 24 + 18
    par = {e["name"]: e["parent"] for e in plan}
    assert par["ctl_L_UpperArm"] == "ctl_L_Clavicle" and par["ctl_L_Clavicle"] == "ctl_chest"
    # poles: 0.24 H along the bend direction (arm: +Y back, knee: -Y front)
    e = {x["name"]: x for x in plan}
    elbow = next(b for b in skel["bones"] if b["name"] == "L_ForeArm")["head"]
    d = geom.sub(e["ctl_L_Elbow_pole"]["head"], elbow)
    assert geom.norm(d) == pytest.approx(0.12) and d[1] > 0.9 * geom.norm(d)
    knee = next(b for b in skel["bones"] if b["name"] == "L_Calf")["head"]
    d = geom.sub(e["ctl_L_Knee_pole"]["head"], knee)
    assert geom.norm(d) == pytest.approx(0.12) and d[1] < -0.9 * geom.norm(d)


def test_limb_chains_h():
    ch = skeleton.limb_chains(template.load_family("H"))
    assert [(c["name"], c["kind"], c["ids"]) for c in ch] == [
        ("arm_L", "arm", ["shoulder_L", "elbow_L", "wrist_L"]), ("arm_R", "arm", ["shoulder_R", "elbow_R", "wrist_R"]),
        ("leg_L", "leg", ["hip_L", "knee_L", "ankle_L"]), ("leg_R", "leg", ["hip_R", "knee_R", "ankle_R"])]


def test_rebend_closed_form():
    for tgt in (0.5, 4.0, 5.0, 10.0, 30.0):
        a, m, b = (0.0, 0.0, 0.0), (0.3, 0.0, 0.0), (1.0, 0.0, 0.0)
        new, h = skeleton._rebend(a, m, b, tgt, (0.0, 1.0, 0.0))
        assert skeleton.bend_angle_deg(a, new, b) == pytest.approx(tgt, abs=1e-9)
        assert new[0] == pytest.approx(0.3) and new[1] == pytest.approx(h) and h > 0
        assert math.isfinite(h)


def test_apply_flips_writes_effective_hinge(legacy):
    _, _, _, _, skel = legacy
    out = skeleton.apply_flips(skel, ["L_Foot", "L_Toe"])
    b, b0 = template.bone_map(out), template.bone_map(skel)
    assert b["L_Foot"]["hinge"] == [-1.0, 0.0, 0.0] and b0["L_Foot"]["hinge"] == [1.0, 0.0, 0.0]  # input untouched
    assert b["L_Foot"]["roll_flipped"] and b["L_Toe"]["roll_flipped"] and not b["R_Foot"]["roll_flipped"]
    assert all(x["roll_flipped"] is False for x in out["bones"] if x["name"] not in ("L_Foot", "L_Toe"))
    assert all(type(c) is float and str(c) != "-0.0" for x in out["bones"] for c in x["hinge"] if x["name"] in ("L_Foot", "L_Toe"))
    # the roll rule on the effective hinge gives the flipped roll: local Z negated
    zf = geom.roll_z_vector(b["L_Foot"]["head"], b["L_Foot"]["tail"], b["L_Foot"]["hinge"])
    z0 = geom.roll_z_vector(b0["L_Foot"]["head"], b0["L_Foot"]["tail"], b0["L_Foot"]["hinge"])
    assert zf == pytest.approx([-c for c in z0], abs=1e-15)
    # applying the flips of a rebuild (none) keeps the record; flipping twice restores the template
    assert skeleton.apply_flips(out, []) == out
    back = skeleton.apply_flips(out, ["L_Foot", "L_Toe"])
    assert [x["hinge"] for x in back["bones"]] == [x["hinge"] for x in skel["bones"]] and not any(x["roll_flipped"] for x in back["bones"])
    with pytest.raises(ValueError, match="unknown bones"):
        skeleton.apply_flips(skel, ["L_Fot"])


def test_runtime_collections_follow_g2_names():
    assert list(skeleton.COLLECTIONS.values()) == ["Deform", "Aux", "Sockets", "Root"]
    key = lambda kind, deform: skeleton.collection_key({"kind": kind, "deform": deform})  # noqa: E731
    assert (key("core", True), key("twist", True), key("aux", True), key("socket", False), key("core", False)) == (
        "deform", "deform", "aux", "socket", "other")


def test_builder_carried_and_fallback(legacy, d01_landmarks_path):
    fam, _, _, _, skel = legacy
    b, info = control.builder_of(skel)
    assert info == {"source": "skeleton", "template": skel["template"], "warning": None}
    assert b == fam["builder"] and b is not skel["builder"]
    assert control.control_params({"builder": b}) == control.control_params(fam)
    assert control.control_params(skel)["pole_offset_H"] == 0.24
    old = {k: v for k, v in skel.items() if k not in ("builder", "template")}  # a skeleton.json from before rigcore carried it
    b2, info2 = control.builder_of(old)
    assert b2 == fam["builder"] and info2["source"] == "family" and "reloaded by name" in info2["warning"]
    assert info2["template"]["sha256"] == template.template_info(fam)["sha256"]
    with pytest.raises(ValueError, match="no family"):
        control.builder_of(dict(old, family=""))
    s_lm = landmarks.synthesize_missing(landmarks.from_d01_landmarks(d01_landmarks_path), template.load_family("S"), 0.5)
    s_skel, _, _ = skeleton.resolve_skeleton("S", s_lm, 0.5)
    assert control.builder_of(s_skel)[0] is None and control.control_params(s_skel) == control.control_params(None)


def test_golden_min_and_twist_expression():
    for opt in (0.123456789, -0.987654321, 0.5):
        x, fx, n = control.golden_min(lambda a: abs(a - opt), -1.0, 1.0, 1e-9, 200)
        assert abs(x - opt) < 1e-8 and fx < 1e-8 and n <= 60
    x, fx, n = control.golden_min(lambda a: (a - 0.3) ** 2, 0.0, 1.0, 1e-6, 10)
    assert n == 10 and abs(x - 0.3) < 0.05  # the evaluation cap holds
    assert control.twist_expression(-0.5) == "t * -0.5" and control.twist_expression(0.5) == "t * 0.5"
    assert control.twist_expression(0.1 + 0.2) == "t * 0.30000000000000004"  # repr: every digit
    sw = control.CONTROL_DEFAULTS["pole_sweep"]
    assert sw["refine_tol_deg"] <= 1e-6 and sw["refine_skip_rad"] < 1e-4

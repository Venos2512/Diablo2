"""rigcore.template: family loading/merging, {S} expansion, expressions, resolve on D01 landmarks (S and H), comparison with D01's
d01_rig_def where the definitions coincide.

Landmarks come from D01's measured set (``landmarks.from_d01_landmarks``). D01 has no clavicle: ``synthesize_missing`` adds
clavicle_L/R and is TEST ONLY.
"""
import copy
import importlib.util
import json
import os
import sys

import pytest

from rigcore import geom, schema, template
from rigcore.landmarks import from_d01_landmarks, landmark_ids, synthesize_missing

H = 0.5


@pytest.fixture(scope="module")
def s_family(families_dir):
    return template.load_family("S", families_dir)


@pytest.fixture(scope="module")
def h_family(families_dir):
    return template.load_family("H", families_dir)


@pytest.fixture(scope="module")
def d01_raw(d01_landmarks_path):
    return from_d01_landmarks(d01_landmarks_path)


@pytest.fixture(scope="module")
def d01_lm(d01_raw, s_family):
    """TEST ONLY: measured D01 landmarks + synthesized clavicles."""
    return synthesize_missing(d01_raw, s_family, H=H)


@pytest.fixture(scope="module")
def skel_s(s_family, d01_lm):
    return template.resolve(s_family, d01_lm, H)


@pytest.fixture(scope="module")
def d01(d01_tools_dir):
    spec = importlib.util.spec_from_file_location("d01_rig_def_ro2", os.path.join(d01_tools_dir, "d01_rig_def.py"))
    mod = importlib.util.module_from_spec(spec)
    sys.modules["d01_rig_def_ro2"] = mod
    spec.loader.exec_module(mod)
    return mod


# --------------------------------------------------------------------------------------------------------------------------
# loading and merging
# --------------------------------------------------------------------------------------------------------------------------

def test_load_family_s_extends_h(s_family, h_family, families_dir):
    assert h_family["_chain"] == ["H"] and h_family["extends"] is None
    assert s_family["_chain"] == ["S", "H"] and s_family["extends"] == "H" and s_family["family"] == "S"
    assert [os.path.basename(p) for p in s_family["_files"]] == ["S.json", "H.json"]
    assert len(h_family["bones"]) == len(s_family["bones"]) == 24  # unexpanded template entries
    assert [b["name"] for b in s_family["bones"]] == [b["name"] for b in h_family["bones"]]
    # priors merge by key: S overrides, H-only keys survive, new S keys are added
    assert s_family["priors"]["ankle"]["z_over_H"] == 0.096 and h_family["priors"]["ankle"]["z_over_H"] == 0.039
    assert set(h_family["priors"]) <= set(s_family["priors"]) and "pelvis" in s_family["priors"] and "pelvis" not in h_family["priors"]
    assert s_family["priors"]["head_top"]["tol_H"] == 0.03
    # untouched parent parts survive
    assert s_family["landmarks"] == h_family["landmarks"] and s_family["rom"] == h_family["rom"] and s_family["skin"] == h_family["skin"]
    assert s_family["status"] != h_family["status"] and "notes" in s_family and "notes" not in h_family
    # path or name both work, and loading does not alias
    again = template.load_family(os.path.join(families_dir, "S.json"))
    assert again["bones"] == s_family["bones"]
    again["bones"][0]["name"] = "changed"
    assert s_family["bones"][0]["name"] == "root"


def test_merge_family_rules():
    parent = {"family": "P", "schema": 0, "version": "1", "extends": None, "description": "p", "lst": [1, 2],
              "bones": [{"name": "a", "parent": None, "twist": {"driver": "a", "axis": "Y", "factor": 1}, "x": 1},
                        {"name": "b", "parent": "a", "x": 2}, {"name": "c", "parent": "a", "x": 3}],
              "ik": [{"name": "i1", "v": 1}], "rom": [{"joint": "j1", "r": [0, 1]}],
              "priors": {"p": {"z_over_H": 0.1, "tol_H": 0.01, "source": "H"}, "q": {"z_over_H": 0.2, "tol_H": 0.02, "source": "H"}},
              "skin": {"max": 4, "profiles": {"a": "x", "b": "y"}}}
    child = {"family": "C", "version": "2", "extends": "P", "lst": [9],
             "bones": [{"name": "b", "x": 20, "extra": True}, {"name": "c", "_remove": True}, {"name": "d", "parent": "b", "x": 4},
                       {"name": "a", "twist": {"factor": 2}}],
             "ik": [{"name": "i2", "v": 2}], "rom": [{"joint": "j1", "r": [5, 6]}],
             "priors": {"p": {"z_over_H": 0.15}, "r": {"z_over_H": 0.3, "tol_H": 0.03, "source": "C"}},
             "skin": {"profiles": {"b": "Y", "c": "z"}}}
    snap = copy.deepcopy((parent, child))
    m = template.merge_family(parent, child)
    assert (parent, child) == snap  # inputs untouched
    assert [b["name"] for b in m["bones"]] == ["a", "b", "d"]  # c removed, d appended, order kept
    b = {x["name"]: x for x in m["bones"]}
    assert b["b"] == {"name": "b", "parent": "a", "x": 20, "extra": True}  # field-wise update
    assert b["a"]["twist"] == {"driver": "a", "axis": "Y", "factor": 2}  # recursive for nested dicts
    assert [i["name"] for i in m["ik"]] == ["i1", "i2"] and m["rom"] == [{"joint": "j1", "r": [5, 6]}]  # list replaced inside entry
    assert m["priors"]["p"] == {"z_over_H": 0.15, "tol_H": 0.01, "source": "H"}  # field-wise inside an entry
    assert set(m["priors"]) == {"p", "q", "r"}
    assert m["lst"] == [9] and m["version"] == "2" and m["family"] == "C" and m["extends"] == "P" and m["description"] == "p"
    assert m["skin"] == {"max": 4, "profiles": {"a": "x", "b": "Y", "c": "z"}}
    with pytest.raises(ValueError, match="needs a 'name' key|every entry needs"):
        template.merge_family(parent, {"bones": [{"x": 1}]})


def test_merge_remove_of_missing_key_raises():
    """A ``_remove`` whose key the parent does not have is a typo: it must fail loudly, naming the key and the list."""
    parent = {"family": "P", "bones": [{"name": "a"}, {"name": "b"}], "ik": [{"name": "i1"}], "rom": [{"joint": "j1"}]}
    with pytest.raises(ValueError, match=r"bones: '_remove' of name 'L_Hnad'.*no such entry \(typo\?\).*'a', 'b'"):
        template.merge_family(parent, {"family": "C", "bones": [{"name": "L_Hnad", "_remove": True}]})
    with pytest.raises(ValueError, match=r"rom: '_remove' of joint 'j2'"):
        template.merge_family(parent, {"rom": [{"joint": "j2", "_remove": True}]})
    with pytest.raises(ValueError, match=r"ik: '_remove' of name 'i9'"):
        template.merge_family(parent, {"ik": [{"name": "i9", "_remove": True}]})
    # removing an entry added earlier in the same child list works (the merge runs entry by entry)
    m = template.merge_family(parent, {"bones": [{"name": "c"}, {"name": "c", "_remove": True}, {"name": "a", "_remove": True}]})
    assert [b["name"] for b in m["bones"]] == ["b"]
    # _remove: false is an ordinary update
    m = template.merge_family(parent, {"bones": [{"name": "zz", "_remove": False}]})
    assert [b["name"] for b in m["bones"]] == ["a", "b", "zz"] and "_remove" not in m["bones"][-1]


def test_template_does_not_reexport_test_only_synthesize_missing():
    from rigcore import landmarks

    assert not hasattr(template, "synthesize_missing")  # TEST ONLY: lives in rigcore.landmarks only
    assert callable(landmarks.synthesize_missing) and "TEST ONLY" in landmarks.synthesize_missing.__doc__
    for name in ("check_priors", "from_d01_landmarks", "landmark_ids", "load_landmarks"):  # the production re-exports stay
        assert getattr(template, name) is getattr(landmarks, name)


def test_extends_errors(tmp_path):
    def write(name, d):
        (tmp_path / f"{name}.json").write_text(json.dumps(d), encoding="utf-8")

    base = {"schema": 0, "version": "1", "bones": [{"name": "r", "parent": None, "kind": "core", "deform": False, "head": "origin",
                                                    "tail": "off:origin|0|0|0.1", "hinge": "axis:+X"}]}
    write("A", dict(base, family="A", extends="B"))
    write("B", dict(base, family="B", extends="A"))
    with pytest.raises(ValueError, match="cycle"):
        template.load_family("A", tmp_path)
    write("C", dict(base, family="C", extends="Nope"))
    with pytest.raises(FileNotFoundError, match="Nope"):
        template.load_family("C", tmp_path)
    write("D", dict(base, family="D", schema=5))
    with pytest.raises(ValueError, match="schema is 5"):
        template.load_family("D", tmp_path)
    bad = copy.deepcopy(base)
    del bad["bones"][0]["hinge"]
    write("E", dict(bad, family="E"))
    with pytest.raises(ValueError, match="bone 'r': missing key 'hinge'"):
        template.load_family("E", tmp_path)
    write("F", dict(base, family="F"))
    assert template.load_family("F", tmp_path)["_chain"] == ["F"]


def test_template_info_hashes(s_family, h_family):
    import hashlib

    ti = template.template_info(s_family)
    sb, hb = (open(p, "rb").read() for p in s_family["_files"])
    assert ti["version"] == s_family["version"] and ti["chain"] == ["S", "H"]
    assert ti["sha256"] == hashlib.sha256(hb + sb).hexdigest()  # parent first
    assert [f["sha256"] for f in ti["files"]] == [hashlib.sha256(sb).hexdigest(), hashlib.sha256(hb).hexdigest()]
    th = template.template_info(h_family)
    assert th["sha256"] == hashlib.sha256(hb).hexdigest() and os.path.basename(th["path"]) == "H.json"


# --------------------------------------------------------------------------------------------------------------------------
# {S} expansion
# --------------------------------------------------------------------------------------------------------------------------

def test_expand_sides(h_family):
    ex = template.expand_sides(h_family)
    assert ex["_expanded"] is True and "_expanded" not in h_family
    names = [b["name"] for b in ex["bones"]]
    assert len(names) == len(set(names)) == 8 + 10 * 2 + 8
    assert names[:8] == ["root", "cog", "pelvis", "spine_01", "spine_02", "chest", "neck", "head"]
    i = names.index("L_Clavicle")
    assert names[i:i + 2] == ["L_Clavicle", "R_Clavicle"]  # L then R, template order kept
    text = json.dumps(ex)
    assert "{S}" not in text and "{s}" not in text
    b = {x["name"]: x for x in ex["bones"]}
    assert b["L_UpperArm"]["head"] == "lm:shoulder_L" and b["R_UpperArm"]["head"] == "lm:shoulder_R"
    assert b["R_UpperArm"]["parent"] == "R_Clavicle" and b["R_UpperArm"]["hinge"] == "bend:shoulder_R|elbow_R|wrist_R"
    assert b["L_UpperArm_twist"]["head"] == "lerp:lm:shoulder_L|lm:elbow_L|0.25"
    assert b["R_ForeArm_twist"]["twist"] == {"driver": "R_Hand", "axis": "Y", "factor": 0.5}
    assert b["fx_hand_R"]["head"] == "off:lm:palm_R|0|0|0.024" and b["fx_hand_R"]["side"] == "R" and b["root"]["side"] is None
    # hinge_R: used on the R side only, and removed everywhere
    assert b["L_Hand"]["hinge"] == "axis:+Y" and b["R_Hand"]["hinge"] == "axis:-Y"
    assert b["L_Clavicle"]["hinge"] == "axis:-Y" and b["R_Clavicle"]["hinge"] == "axis:+Y"
    assert not any("hinge_R" in x for x in ex["bones"])
    # ik / rom / skin
    assert [e["name"] for e in ex["ik"]] == ["arm_L", "arm_R", "leg_L", "leg_R"]
    assert ex["ik"][1]["chain"] == ["R_UpperArm", "R_ForeArm"] and ex["ik"][3]["foot_roll"][0] == "ctl_R_Foot_IK"
    rom = {e["id"]: e for e in ex["rom"]}
    assert len(ex["rom"]) == 11 * 2 + 4 and "elbow_flexion_L" in rom and "elbow_flexion_R" in rom and "spine_twist" in rom
    assert rom["elbow_flexion_R"]["control"] == "ctl_R_ForeArm" and rom["elbow_flexion_R"]["side"] == "R"
    assert rom["spine_bend"]["side"] is None and rom["spine_bend"]["control"] == "ctl_spine_01+ctl_spine_02+ctl_chest"
    assert ex["skin"]["profiles"]["shoulder_L"] == "3-way chest / L_Clavicle / L_UpperArm"
    assert ex["skin"]["profiles"]["shoulder_R"] == "3-way chest / R_Clavicle / R_UpperArm"
    assert "shoulder" not in ex["skin"]["profiles"] and ex["skin"]["profiles"]["neck_head"] == h_family["skin"]["profiles"]["neck_head"]
    assert ex["skin"]["max_influences"] == 4 and ex["rom_compound"] == h_family["rom_compound"]
    assert template.expand_sides(ex) == ex  # idempotent


def test_expand_sides_lowercase_and_errors():
    fam = {"bones": [{"name": "{S}_a", "parent": None, "kind": "core", "deform": True, "head": "origin", "tail": "origin",
                      "hinge": "axis:+X", "note": "side {s}"}, ], "ik": [], "rom": [], "skin": {}}
    ex = template.expand_sides(fam)
    assert [b["name"] for b in ex["bones"]] == ["L_a", "R_a"] and [b["note"] for b in ex["bones"]] == ["side l", "side r"]
    bad = {"bones": [{"name": "plain", "hinge_R": "axis:-Y"}]}
    with pytest.raises(ValueError, match="hinge_R"):
        template.expand_sides(bad)


# --------------------------------------------------------------------------------------------------------------------------
# expressions
# --------------------------------------------------------------------------------------------------------------------------

LM = {"a": (0.0, 0.0, 0.0), "b": (1.0, 2.0, 3.0), "c": (1.0, 2.0, 5.0), "d": (3.0, 2.0, 3.0)}


def test_eval_point():
    ev = lambda e, side=None, h=0.5: template.eval_point(e, LM, h, side)  # noqa: E731
    assert ev("origin") == (0.0, 0.0, 0.0)
    assert ev("lm:b") == (1.0, 2.0, 3.0)
    assert ev("lerp:lm:a|lm:b|0.25") == (0.25, 0.5, 0.75)
    assert ev("lerp:lm:b|lm:a|0.5") == (0.5, 1.0, 1.5) and ev("lerp:origin|lm:b|2") == (2.0, 4.0, 6.0)
    # off: offsets in units of H, Blender axes; dx negated for R
    assert ev("off:lm:b|0.1|0.2|0.3", None, 2.0) == pytest.approx((1.2, 2.4, 3.6))
    assert ev("off:lm:b|0.1|0.2|0.3", "L", 2.0) == pytest.approx((1.2, 2.4, 3.6))
    assert ev("off:lm:b|0.1|0.2|0.3", "R", 2.0) == pytest.approx((0.8, 2.4, 3.6))  # dx -> -0.1 H
    assert ev("off:origin|0|0|0.02", "R", 0.5) == (0.0, 0.0, 0.01)
    assert ev("  lm:b ") == (1.0, 2.0, 3.0)
    for bad, pat in [("lm:zzz", "missing landmarks"), ("lerp:lm:a|lm:b", "lerp needs"), ("off:lm:a|1|2", "off needs"),
                     ("off:lm:a|x|0|0", "dx 'x' is not a number"), ("foo:bar", "unknown point expression"),
                     ("lerp:lm:a|lerp:lm:a|lm:b|0.5|0.5", "lerp needs"), ("lerp:foo|lm:a|0.5", "operand 'foo'")]:
        with pytest.raises(ValueError, match=pat):
            ev(bad)
    assert template.referenced_landmarks("lerp:lm:a|lm:b|0.25") == ["a", "b"]
    assert template.referenced_landmarks("off:origin|0|0|1") == [] and template.referenced_landmarks("bend:a|b|d") == ["a", "b", "d"]


def test_eval_hinge():
    assert template.eval_hinge("axis:+X", LM) == (1.0, 0.0, 0.0)
    assert template.eval_hinge("axis:-Y", LM) == (0.0, -1.0, 0.0)
    n = template.eval_hinge("bend:a|b|c", LM)
    assert n == geom.bend_normal(LM["a"], LM["b"], LM["c"]) and abs(geom.norm(n) - 1) < 1e-15
    assert template.eval_hinge("bend:lm:a|lm:b|lm:c", LM) == n
    with pytest.raises(ValueError, match="collinear"):
        template.eval_hinge("bend:a|b|b", LM)
    for bad in ("axis:W", "wobble:1", "bend:a|b"):
        with pytest.raises(ValueError):
            template.eval_hinge(bad, LM)


def test_off_mirroring_and_hinge_r_in_resolve():
    fam = {"family": "T", "schema": 0, "version": "1", "bones": [
        {"name": "root", "parent": None, "kind": "core", "deform": False, "head": "origin", "tail": "off:origin|0|0|0.1", "hinge": "axis:+X"},
        {"name": "{S}_probe", "parent": "root", "kind": "aux", "deform": True, "head": "lm:p_{S}", "tail": "off:lm:p_{S}|0.1|-0.2|0.3",
         "hinge": "axis:+Y", "hinge_R": "axis:-Z"}]}
    lm = {"p_L": (0.3, 0.0, 1.0), "p_R": (-0.3, 0.0, 1.0)}
    sk = template.resolve(fam, lm, 2.0)
    b = {x["name"]: x for x in sk["bones"]}
    assert b["L_probe"]["tail"] == pytest.approx([0.3 + 0.2, -0.4, 1.6])  # dx = +0.1 H
    assert b["R_probe"]["tail"] == pytest.approx([-0.3 - 0.2, -0.4, 1.6])  # dx negated: outward on the right too
    assert b["L_probe"]["hinge"] == [0.0, 1.0, 0.0] and b["R_probe"]["hinge"] == [0.0, 0.0, -1.0]


# --------------------------------------------------------------------------------------------------------------------------
# resolve S / H on D01
# --------------------------------------------------------------------------------------------------------------------------

def test_d01_lacks_only_the_clavicle(s_family, d01_raw, d01_lm):
    need = set(landmark_ids(s_family))
    assert need - set(d01_raw) == {"clavicle_L", "clavicle_R"}
    assert need - set(d01_lm) == set()
    c = d01_lm["clavicle_L"]  # TEST ONLY rule: 35 % neck -> shoulder (x, y), z = shoulder z - 0.01 H
    nk, sh = d01_raw["neck"], d01_raw["shoulder_L"]
    assert c == pytest.approx((nk[0] + 0.35 * (sh[0] - nk[0]), nk[1] + 0.35 * (sh[1] - nk[1]), sh[2] - 0.005))
    assert d01_lm["clavicle_R"][0] == pytest.approx(-c[0])


def test_resolve_s_counts_order_and_geometry(skel_s):
    schema.validate_skeleton(skel_s)
    bones = skel_s["bones"]
    assert skel_s["family"] == "S" and skel_s["H"] == H and skel_s["schema"] == 0 and skel_s["control_kit"] == "humanoid_v1"
    assert len(bones) == 36
    kinds = {}
    for b in bones:
        kinds[b["kind"]] = kinds.get(b["kind"], 0) + 1
    assert kinds == {"core": 24, "twist": 4, "socket": 8}
    assert sum(1 for b in bones if b["kind"] != "socket") == 28  # 28 deform/structural bones + 8 sockets
    assert len(template.deform_names(skel_s)) == 26  # 28 minus root and cog
    # parent before child
    seen = set()
    for b in bones:
        assert b["parent"] is None or b["parent"] in seen, b["name"]
        seen.add(b["name"])
    assert bones[0]["name"] == "root" and sum(1 for b in bones if b["parent"] is None) == 1
    for b in bones:
        assert geom.dist(b["head"], b["tail"]) >= schema.MIN_BONE_LENGTH
        assert abs(geom.norm(b["hinge"]) - 1) < 1e-12
        assert all(type(c) is float for c in b["head"] + b["tail"] + b["hinge"])
    assert skel_s["warnings"] == []
    # JSON round trip keeps everything
    assert json.loads(json.dumps(skel_s)) == skel_s


def test_resolve_s_hierarchy_and_sides(skel_s):
    b = template.bone_map(skel_s)
    for s in "LR":
        assert b[f"{s}_Clavicle"]["parent"] == "chest" and b[f"{s}_UpperArm"]["parent"] == f"{s}_Clavicle"
        assert b[f"{s}_UpperArm_twist"]["parent"] == f"{s}_UpperArm" and b[f"{s}_ForeArm"]["parent"] == f"{s}_UpperArm"
        assert b[f"{s}_ForeArm_twist"]["parent"] == f"{s}_ForeArm" and b[f"{s}_Hand"]["parent"] == f"{s}_ForeArm"
        assert b[f"{s}_Thigh"]["parent"] == "pelvis" and b[f"{s}_Toe"]["parent"] == f"{s}_Foot"
        assert b[f"{s}_weapon_attach"]["parent"] == f"{s}_Hand" and b[f"fx_hand_{s}"]["parent"] == f"{s}_Hand"
        assert b[f"{s}_Hand"]["side"] == s and all(b[f"{s}_{x}"]["kind"] == "core" for x in ("Clavicle", "UpperArm", "Thigh"))
    sockets = {x["name"] for x in skel_s["bones"] if x["kind"] == "socket"}
    assert sockets == {"L_weapon_attach", "R_weapon_attach", "fx_hand_L", "fx_hand_R", "fx_head", "fx_chest", "hit_origin", "ground"}
    assert all(not x["deform"] for x in skel_s["bones"] if x["kind"] == "socket") and not b["root"]["deform"] and not b["cog"]["deform"]
    assert b["L_Hand"]["hinge"] == [0.0, 1.0, 0.0] and b["R_Hand"]["hinge"] == [0.0, -1.0, 0.0]  # hinge_R
    assert b["L_Clavicle"]["hinge"] == [0.0, -1.0, 0.0] and b["R_Clavicle"]["hinge"] == [0.0, 1.0, 0.0]
    assert b["L_Thigh"]["bend_test"].startswith("knee goes back") and b["L_UpperArm_twist"]["bend_test"] is None
    assert b["L_UpperArm_twist"]["twist"] == {"driver": "L_UpperArm", "axis": "Y", "factor": -0.5}
    assert b["R_ForeArm_twist"]["twist"] == {"driver": "R_Hand", "axis": "Y", "factor": 0.5} and b["L_Hand"]["twist"] is None
    # carried sections
    assert [e["name"] for e in skel_s["ik"]] == ["arm_L", "arm_R", "leg_L", "leg_R"]
    assert len(skel_s["rom"]) == 26 and skel_s["rom_compound"][0] == "squat"
    assert "hip_L" in skel_s["skin"]["profiles"] and "hip_R" in skel_s["skin"]["profiles"] and "knee" in skel_s["skin"]["profiles"]
    assert "{S}" not in json.dumps(skel_s)


def test_resolve_s_twist_bones_between_the_right_landmarks(skel_s, d01_lm):
    b = template.bone_map(skel_s)
    for s in "LR":
        sh, el, wr = d01_lm[f"shoulder_{s}"], d01_lm[f"elbow_{s}"], d01_lm[f"wrist_{s}"]
        u, f = b[f"{s}_UpperArm_twist"], b[f"{s}_ForeArm_twist"]
        assert u["head"] == pytest.approx(geom.lerp(sh, el, 0.25), abs=1e-12) and u["tail"] == pytest.approx(geom.lerp(sh, el, 0.5), abs=1e-12)
        assert f["head"] == pytest.approx(geom.lerp(el, wr, 0.5), abs=1e-12) and f["tail"] == pytest.approx(geom.lerp(el, wr, 0.75), abs=1e-12)
        # lie on the parent bone, same hinge as the parent
        for tw, par in ((u, b[f"{s}_UpperArm"]), (f, b[f"{s}_ForeArm"])):
            for p in (tw["head"], tw["tail"]):
                on = geom.on_line(par["head"], p, par["tail"])
                assert geom.dist(on, p) < 1e-12
            assert tw["hinge"] == par["hinge"]
        # 25-50 % and 50-75 % of the segments
        assert geom.dist(u["head"], u["tail"]) == pytest.approx(0.25 * geom.dist(sh, el))
        assert geom.dist(f["head"], f["tail"]) == pytest.approx(0.25 * geom.dist(el, wr))
        assert b[f"{s}_Clavicle"]["head"] == list(d01_lm[f"clavicle_{s}"]) and b[f"{s}_Clavicle"]["tail"] == list(sh)


def test_resolve_carries_builder_and_template_provenance(s_family, skel_s, families_dir, d01_raw):
    """The skeleton carries the family's ``builder`` block and ``template`` = {path, version, sha256} (template_info), so the control
    step does not reload the family by name."""
    ti = template.template_info(s_family)
    assert skel_s["template"] == {k: ti[k] for k in ("path", "version", "sha256")}
    assert skel_s["builder"] is None  # S/H have no builder block
    legacy = template.load_family("S_legacy_D01", families_dir)
    sk = template.resolve(legacy, d01_raw, H)  # the legacy family has no clavicle: the measured D01 set is complete
    schema.validate_skeleton(sk)
    assert json.loads(json.dumps(sk)) == template.resolve(legacy, d01_raw, H)  # JSON-able, deterministic
    assert sk["builder"] == legacy["builder"] and sk["builder"] is not legacy["builder"]  # a copy
    sk["builder"]["control"]["pole_offset_H"] = 9.0
    assert legacy["builder"]["control"]["pole_offset_H"] == 0.24
    lt = template.template_info(legacy)
    assert sk["template"] == {"path": lt["path"], "version": legacy["version"], "sha256": lt["sha256"]}
    assert os.path.basename(sk["template"]["path"]) == "S_legacy_D01.json" and sk["template_version"] == legacy["version"]
    # an expanded family keeps its provenance; a dict family that was not loaded from files has none
    assert template.resolve(template.expand_sides(s_family), synthesize_missing(d01_raw, s_family, H=H), H)["template"] == skel_s["template"]
    fam = {"family": "T", "schema": 0, "version": "1", "bones": [
        {"name": "root", "parent": None, "kind": "core", "deform": False, "head": "origin", "tail": "off:origin|0|0|0.1", "hinge": "axis:+X"}]}
    t = template.resolve(fam, {}, 1.0)
    assert t["template"] is None and t["builder"] is None


def test_resolve_h_equals_s_bones_and_scales_with_h(h_family, skel_s, d01_lm):
    skel_h = template.resolve(h_family, d01_lm, H)
    assert skel_h["family"] == "H" and len(skel_h["bones"]) == 36
    assert skel_h["bones"] == skel_s["bones"]  # S differs from H in priors only
    # name works as well as a dict; H-units: scaling landmarks and H together scales every bone
    skel_n = template.resolve("H", d01_lm, H)
    assert skel_n["bones"] == skel_h["bones"]
    k = 3.6
    big = template.resolve(h_family, {i: tuple(k * c for c in p) for i, p in d01_lm.items()}, k * H)
    for a, b in zip(big["bones"], skel_h["bones"]):
        assert a["name"] == b["name"]
        assert a["head"] == pytest.approx([k * c for c in b["head"]], abs=1e-12)
        assert a["tail"] == pytest.approx([k * c for c in b["tail"]], abs=1e-12)
        assert a["hinge"] == pytest.approx(b["hinge"], abs=1e-12)


# --------------------------------------------------------------------------------------------------------------------------
# resolve errors
# --------------------------------------------------------------------------------------------------------------------------

def test_resolve_missing_landmarks(s_family, d01_raw, d01_lm):
    with pytest.raises(template.MissingLandmarksError) as ei:
        template.resolve(s_family, d01_raw, H)  # clavicles absent
    assert ei.value.missing == ["clavicle_L", "clavicle_R"]
    assert ei.value.needed_by["clavicle_L"] == ["L_Clavicle"] and isinstance(ei.value, ValueError)
    assert "clavicle_L" in str(ei.value)
    lm = {k: v for k, v in d01_lm.items() if k not in ("knee_L", "palm_R", "head_top")}
    with pytest.raises(template.MissingLandmarksError) as ei:
        template.resolve(s_family, lm, H)
    assert ei.value.missing == ["head_top", "knee_L", "palm_R"]  # all at once
    assert "L_Thigh" in ei.value.needed_by["knee_L"] and "R_weapon_attach" in ei.value.needed_by["palm_R"]


def test_resolve_structure_errors(s_family, d01_lm):
    f = lambda over: template.merge_family(s_family, {"bones": over})  # noqa: E731
    with pytest.raises(ValueError, match="bone 'L_Hand': unknown parent 'nope'"):
        template.resolve(f([{"name": "{S}_Hand", "parent": "nope"}]), d01_lm, H)
    with pytest.raises(ValueError, match="cycle in the bone hierarchy"):
        template.resolve(f([{"name": "pelvis", "parent": "head"}]), d01_lm, H)
    with pytest.raises(ValueError, match="duplicate bone names"):
        template.resolve(f([{"name": "L_Hand", "parent": "root", "kind": "aux", "deform": True, "head": "origin",
                             "tail": "off:origin|0|0|1", "hinge": "axis:+X"}]), d01_lm, H)
    with pytest.raises(ValueError, match="twist driver 'nope'"):
        template.resolve(f([{"name": "{S}_ForeArm_twist", "twist": {"driver": "nope"}}]), d01_lm, H)
    with pytest.raises(ValueError, match="bone 'x': unknown point expression"):
        template.resolve(f([{"name": "x", "parent": "root", "kind": "aux", "deform": True, "head": "wat", "tail": "origin", "hinge": "axis:+X"}]),
                         d01_lm, H)
    for bad_h in (0, -1, float("nan")):
        with pytest.raises(ValueError, match="H must be"):
            template.resolve(s_family, d01_lm, bad_h)


def test_resolve_zero_length_and_collinear(s_family, d01_lm):
    lm = dict(d01_lm)
    lm["head_top"] = lm["head"]  # head bone head == tail
    with pytest.raises(ValueError, match=r"bone 'head': zero-length bone"):
        template.resolve(s_family, lm, H)
    lm = dict(d01_lm)
    lm["ball_L"] = (lm["ankle_L"][0] + 5e-7, lm["ankle_L"][1], lm["ankle_L"][2])  # 0.5 micrometre
    with pytest.raises(ValueError, match=r"bone 'L_Foot': zero-length"):
        template.resolve(s_family, lm, H)
    lm = dict(d01_lm)
    sh, wr = lm["shoulder_L"], lm["wrist_L"]
    lm["elbow_L"] = geom.lerp(sh, wr, 0.5)  # straight arm: no bend plane
    with pytest.raises(ValueError, match=r"bone 'L_UpperArm': hinge 'bend:shoulder_L\|elbow_L\|wrist_L': .*collinear"):
        template.resolve(s_family, lm, H)


# --------------------------------------------------------------------------------------------------------------------------
# D01 comparison
# --------------------------------------------------------------------------------------------------------------------------

def _fit(lm, d01):
    """The builder-side elbow fit of d01_rig_def.fitted_landmarks (on_line + ELBOW_PREBEND toward +Y), applied to both sides."""
    out = dict(lm)
    for s in "LR":
        out[f"elbow_{s}"] = geom.prebend(lm[f"shoulder_{s}"], lm[f"elbow_{s}"], lm[f"wrist_{s}"], (0.0, d01.ELBOW_PREBEND, 0.0))
    return out


def test_prebend_helper_equals_d01_fitted_landmarks(d01_landmarks_path, d01):
    arm, _leg = d01.fitted_landmarks()  # D01's left arm with the fitted elbow
    raw = from_d01_landmarks(d01_landmarks_path)
    e = geom.prebend(raw["shoulder_L"], raw["elbow_L"], raw["wrist_L"], (0.0, d01.ELBOW_PREBEND, 0.0))
    assert e == tuple(arm["elbow"])  # bit-identical
    assert geom.prebend((0, 0, 0), (1, 1, 0), (2, 0, 0)) == (1.0, 0.0, 0.0)


SHARED = ["pelvis", "spine_01", "spine_02", "chest", "neck", "head"] + [
    f"{s}_{n}" for s in "LR" for n in ("UpperArm", "ForeArm", "Hand", "Thigh", "Calf", "Foot", "Toe")]
COINCIDING_SOCKETS = ["cog", "ground", "L_weapon_attach", "R_weapon_attach", "fx_hand_L", "fx_hand_R"]


def test_shared_bones_equal_d01_rig_def(s_family, d01_lm, d01, scratch_root):
    """Bones whose template definition coincides with d01_rig_def.build() must have the same head, tail and hinge.

    The elbow: d01_rig_def does NOT use the measured elbow; it projects it onto the shoulder-wrist line and adds ELBOW_PREBEND
    (3.3 mm, +Y). rigcore.from_d01_landmarks deliberately leaves that to the builder, so here the same fit is applied to the
    landmark set (``_fit``) before resolving; with it, UpperArm.tail, ForeArm.head and the arm hinge match exactly. The test
    below this one shows the unfitted result.
    """
    skel = template.resolve(s_family, _fit(d01_lm, d01), H)
    mine = template.bone_map(skel)
    ref = {b["name"]: b for b in d01.build()}
    worst = 0.0
    rows = []
    for name in SHARED + COINCIDING_SOCKETS + ["root"]:
        a, r = mine[name], ref[name]
        dh = geom.dist(a["head"], r["head"])
        dt = geom.dist(a["tail"], r["tail"])
        flipped_hinge = name.endswith(("_Foot", "_Toe"))  # see test_known_difference_foot_toe_hinge
        dn = geom.dist(a["hinge"], geom.scale(r["hinge"], -1.0) if flipped_hinge else r["hinge"])
        rows.append({"bone": name, "head_err": dh, "tail_err": dt, "hinge_err": dn, "hinge_compared_negated": flipped_hinge})
        if name == "root":
            continue  # see test_known_difference_root
        worst = max(worst, dh, dt, dn)
        assert dh < 1e-12 and dt < 1e-12 and dn < 1e-12, (name, dh, dt, dn)
        if name not in ("L_UpperArm", "R_UpperArm"):  # D01 parents the arms to chest; H/S add the clavicle in between
            assert a["parent"] == r["parent"], name
    assert mine["L_UpperArm"]["parent"] == "L_Clavicle" and ref["L_UpperArm"]["parent"] == "chest"
    # the pre-bend is really in the compared elbow
    e_fit = geom.on_line(d01_lm["shoulder_L"], d01_lm["elbow_L"], d01_lm["wrist_L"])
    assert mine["L_ForeArm"]["head"] == pytest.approx([e_fit[0], e_fit[1] + d01.ELBOW_PREBEND, e_fit[2]], abs=1e-12)
    os.makedirs(os.path.join(scratch_root, "R0"), exist_ok=True)
    with open(os.path.join(scratch_root, "R0", "d01_shared_bones.json"), "w", encoding="utf-8") as f:
        json.dump({"worst_error_m": worst, "elbow_prebend_m": d01.ELBOW_PREBEND, "rows": rows}, f, indent=1)
    assert worst < 1e-12


def test_unfitted_elbow_differs_only_by_fit_and_prebend(s_family, d01_lm, d01):
    """Resolving the measured (unfitted) landmarks: the elbow is the measured one. It differs from d01_rig_def's elbow by exactly
    the fit (projection onto the shoulder-wrist line) plus the 3.3 mm pre-bend, which is what the builder adds."""
    skel = template.resolve(s_family, d01_lm, H)
    mine = template.bone_map(skel)
    ref = {b["name"]: b for b in d01.build()}
    for s in "LR":
        raw = d01_lm[f"elbow_{s}"]
        assert mine[f"{s}_ForeArm"]["head"] == list(raw) and mine[f"{s}_UpperArm"]["tail"] == list(raw)
        fit = geom.on_line(d01_lm[f"shoulder_{s}"], raw, d01_lm[f"wrist_{s}"])
        want = (fit[0], fit[1] + d01.ELBOW_PREBEND, fit[2])
        assert tuple(ref[f"{s}_ForeArm"]["head"]) == pytest.approx(want, abs=1e-12)
        gap = geom.dist(raw, ref[f"{s}_ForeArm"]["head"])
        assert 0 < gap < 0.006  # measured elbow is within 6 mm of the fitted one
        # FINDING: the measured arm is nearly straight, so the bend plane through the measured points is far from the fitted one
        # (about 59 degrees on D01). The fit + pre-bend must be applied BEFORE resolve (builder concern) for the hinge to be meaningful.
        angle = geom.angle_deg(mine[f"{s}_UpperArm"]["hinge"], ref[f"{s}_UpperArm"]["hinge"])
        assert angle > 1.0
        print(f"unfitted {s} arm hinge differs from d01_rig_def by {angle:.1f} deg, elbow by {gap * 1000:.2f} mm")
    # everything that does not involve the elbow still matches exactly
    for name in ("pelvis", "chest", "head", "L_Thigh", "R_Calf", "L_Toe", "L_Hand", "R_Hand"):
        assert mine[name]["head"] == pytest.approx(list(ref[name]["head"]), abs=1e-12)


def test_known_difference_foot_toe_hinge(skel_s, d01, families_dir, d01_raw):
    """H/S (2026-10-23): ``{S}_Foot`` / ``{S}_Toe`` hinge ``axis:-X``, so +X on the bone lifts the toes (bend test "toes go up (+Z)")
    without a roll flip. D01's d01_rig_def (and S_legacy_D01, its replica) keep +X: there +X is plantar flexion. Heads/tails are
    equal; the hinge is exactly opposite."""
    mine = template.bone_map(skel_s)
    ref = {b["name"]: b for b in d01.build()}
    legacy = template.bone_map(template.resolve(template.load_family("S_legacy_D01", families_dir), d01_raw, H))
    for s in "LR":
        for part in ("Foot", "Toe"):
            nm = f"{s}_{part}"
            assert mine[nm]["hinge"] == [-1.0, 0.0, 0.0] and tuple(ref[nm]["hinge"]) == (1, 0, 0), nm
            assert legacy[nm]["hinge"] == [1.0, 0.0, 0.0], nm
            assert "(+Z)" in mine[nm]["bend_test"] and "(-Z)" in legacy[nm]["bend_test"], nm


def test_known_difference_root(skel_s, d01):
    """Template vs D01 legacy: root tail is 0.02 H = 10 mm in H.json, 40 mm in d01_rig_def (S_legacy_D01 keeps D01's). Reported."""
    root = template.bone_map(skel_s)["root"]
    ref = {b["name"]: b for b in d01.build()}["root"]
    assert root["head"] == [0.0, 0.0, 0.0] and root["tail"] == pytest.approx([0.0, 0.0, 0.02 * H])
    assert ref["tail"] == (0, 0, 0.04)


# --------------------------------------------------------------------------------------------------------------------------
# skeleton io + validator
# --------------------------------------------------------------------------------------------------------------------------

def test_skeleton_io_and_validator(skel_s, tmp_path):
    p = template.save_skeleton(tmp_path / "skeleton.json", skel_s)
    assert template.load_skeleton(p) == skel_s
    ch = template.children_map(skel_s)
    assert ch[None] == ["root"] and "cog" in ch["root"] and "ground" in ch["root"]
    bad = copy.deepcopy(skel_s)
    bad["bones"][1], bad["bones"][2] = bad["bones"][2], bad["bones"][1]  # pelvis before cog
    with pytest.raises(ValueError, match="bone 'pelvis': parent 'cog' comes after"):
        schema.validate_skeleton(bad)
    bad = copy.deepcopy(skel_s)
    bad["bones"][3]["hinge"] = [2.0, 0.0, 0.0]
    with pytest.raises(ValueError, match="hinge must be a unit vector"):
        schema.validate_skeleton(bad)
    bad = copy.deepcopy(skel_s)
    bad["bones"][3]["tail"] = bad["bones"][3]["head"]
    with pytest.raises(ValueError, match="zero-length"):
        schema.validate_skeleton(bad)
    bad = copy.deepcopy(skel_s)
    bad["bones"][3]["kind"] = "weird"
    with pytest.raises(ValueError, match="kind"):
        schema.validate_skeleton(bad)
    bad = copy.deepcopy(skel_s)
    bad["bones"][2]["name"] = "root"
    with pytest.raises(ValueError, match="duplicate bone name"):
        schema.validate_skeleton(bad)

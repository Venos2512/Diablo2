"""rigcore.landmarks (io, D01 converter, priors, TEST-ONLY synthesizer) and rigcore.recipe (new/load/save/log_step/script_stamp)."""
import copy
import json
import os
import re
import subprocess

import pytest

from rigcore import geom, landmarks, recipe, schema, template

H = 0.5


@pytest.fixture(scope="module")
def d01_json(d01_landmarks_path):
    with open(d01_landmarks_path, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def s_family(families_dir):
    return template.load_family("S", families_dir)


# --------------------------------------------------------------------------------------------------------------------------
# D01 converter
# --------------------------------------------------------------------------------------------------------------------------

def test_from_d01_landmarks_mapping(d01_json, d01_landmarks_path):
    lm = landmarks.from_d01_landmarks(d01_landmarks_path)
    assert landmarks.from_d01_landmarks(d01_json) == lm  # path or parsed dict
    mx = d01_json["leg_mirror_x"]
    sp, arm, leg = d01_json["spine"], d01_json["arm_L"], d01_json["leg_L"]
    for k in ("pelvis", "spine_01", "spine_02", "chest", "neck", "head"):
        assert lm[k] == tuple(sp[k])
    assert lm["head_top"] == tuple(sp["head_tail"])
    for k in ("shoulder", "elbow", "wrist", "hand_tip", "palm"):
        p = arm[k]
        assert lm[f"{k}_L"] == tuple(p) and lm[f"{k}_R"] == (-p[0], p[1], p[2])  # arms mirror x -> -x
    for k in ("hip", "knee", "ankle", "ball", "toe_tip", "heel_ground", "ball_ground", "toe_ground"):
        p = leg[k]
        assert lm[f"{k}_L"] == tuple(p) and lm[f"{k}_R"] == (2 * mx - p[0], p[1], p[2])  # legs mirror about leg_mirror_x
    assert lm["hip_R"][0] == pytest.approx(2 * 0.0105 - 0.052)
    # ears are measured per side, not mirrored
    assert lm["ear_head_L"] == tuple(d01_json["ear_L"]["base"]) and lm["ear_tail_L"] == tuple(d01_json["ear_L"]["tip"])
    assert lm["ear_head_R"] == tuple(d01_json["ear_R"]["base"]) and lm["ear_tail_R"] == tuple(d01_json["ear_R"]["tip"])
    assert lm["ear_head_R"] != geom.mirror_x(lm["ear_head_L"])
    for part in ("helmet", "sack", "loincloth_front"):
        assert lm[f"{part}_head"] == tuple(d01_json[part]["head"]) and lm[f"{part}_tail"] == tuple(d01_json[part]["tail"])
    for k, v in d01_json["sockets"].items():
        assert lm[k] == tuple(v)
    # the elbow is the MEASURED one: the pre-bend is the builder's job
    assert lm["elbow_L"] == tuple(arm["elbow"])
    assert all(len(p) == 3 and all(type(c) is float for c in p) for p in lm.values())
    assert len(lm) == 6 + 1 + 2 * 5 + 2 * 8 + 4 + 6 + 3


def test_synthesize_missing_is_test_only_and_minimal(d01_landmarks_path, s_family):
    raw = landmarks.from_d01_landmarks(d01_landmarks_path)
    snap = dict(raw)
    out = landmarks.synthesize_missing(raw, s_family, H=H)
    assert raw == snap  # input untouched
    assert set(out) - set(raw) == {"clavicle_L", "clavicle_R"}
    c = out["clavicle_L"]
    sh, nk = raw["shoulder_L"], raw["neck"]
    assert c[0] == pytest.approx(nk[0] + 0.35 * (sh[0] - nk[0])) and c[1] == pytest.approx(nk[1] + 0.35 * (sh[1] - nk[1]))
    assert c[2] == pytest.approx(sh[2] - 0.01 * H)
    assert out["clavicle_R"] == pytest.approx((-c[0], c[1], c[2]))
    # existing values are never replaced, other gaps are never filled
    keep = dict(out, clavicle_L=(9.0, 9.0, 9.0))
    assert landmarks.synthesize_missing(keep, s_family, H=H)["clavicle_L"] == (9.0, 9.0, 9.0)
    gap = {k: v for k, v in raw.items() if k != "knee_L"}
    assert "knee_L" not in landmarks.synthesize_missing(gap, s_family, H=H)
    # H defaults to head_top z
    d = landmarks.synthesize_missing(raw, s_family)
    assert d["clavicle_L"][2] == pytest.approx(sh[2] - 0.01 * raw["head_top"][2])
    assert "TEST ONLY" in landmarks.synthesize_missing.__doc__


def test_check_priors_on_d01(d01_landmarks_path, s_family):
    raw = landmarks.from_d01_landmarks(d01_landmarks_path)
    res = landmarks.check_priors(s_family, raw, H)
    by = {r["id"]: r for r in res}
    assert by["pelvis"]["z_over_H"] == pytest.approx(0.37) and by["pelvis"]["ok"]
    assert by["hip_L"]["ok"] and by["hip_R"]["ok"] and by["ankle_L"]["ok"] and by["shoulder_R"]["ok"] and by["neck"]["ok"]
    bad = [r["id"] for r in res if not r["ok"]]
    assert bad == ["head_top"]  # D01 head_top = skull top 0.435 m, helmet reaches H (S.json note)
    assert by["head_top"]["expected"] == 1.0 and by["head_top"]["tol_H"] == 0.03


# --------------------------------------------------------------------------------------------------------------------------
# landmarks.json io
# --------------------------------------------------------------------------------------------------------------------------

def test_landmarks_json_round_trip(tmp_path, d01_landmarks_path):
    raw = landmarks.from_d01_landmarks(d01_landmarks_path)
    details = {"pelvis": {"sources": {"a": [0.01, 0.028, 0.18], "d": [0.01, 0.03, 0.19]}, "spread": 0.004, "decision": "a",
                          "confidence": 0.8, "flagged": False}}
    p = landmarks.save_landmarks(tmp_path / "landmarks.json", "D01_hodling", "S", H, raw, details)
    doc = json.load(open(p, encoding="utf-8"))
    assert doc["schema"] == 0 and doc["family"] == "S" and doc["H"] == H and doc["landmarks"]["pelvis"]["spread"] == 0.004
    assert doc["landmarks"]["neck"] == {"pos": list(raw["neck"])}
    assert landmarks.load_landmarks(p) == raw  # tuples, exact
    assert landmarks.load_landmarks(doc) == raw
    assert landmarks.load_landmarks({"a": [1, 2, 3], "b": {"pos": [4, 5, 6]}}) == {"a": (1.0, 2.0, 3.0), "b": (4.0, 5.0, 6.0)}
    for bad, pat in [({"a": [1, 2]}, "three numbers"), ({"a": {"nopos": 1}}, "no 'pos'"), ({"a": [1, 2, float("inf")]}, "not finite"),
                     ([1, 2], "expected an object")]:
        with pytest.raises(ValueError, match=pat):
            landmarks.load_landmarks(bad)
    with pytest.raises(ValueError, match="unknown source key"):
        landmarks.landmarks_doc("x", "S", H, {"a": (0, 0, 0)}, {"a": {"sources": {"q": [0, 0, 0]}}})
    # a contract document with a broken entry is rejected by load_landmarks
    doc["landmarks"]["neck"]["pos"] = [1, 2]
    with pytest.raises(ValueError, match="neck"):
        landmarks.load_landmarks(doc)


def test_landmark_ids(s_family):
    ids = landmarks.landmark_ids(s_family)
    assert ids[:7] == ["pelvis", "spine_01", "spine_02", "chest", "neck", "head", "head_top"]
    assert len(ids) == 7 + 14 * 2 and "clavicle_L" in ids and "toe_ground_R" in ids and len(set(ids)) == len(ids)


# --------------------------------------------------------------------------------------------------------------------------
# recipe
# --------------------------------------------------------------------------------------------------------------------------

def test_recipe_new_log_save_load(tmp_path, s_family):
    info = template.template_info(s_family)
    rec = recipe.new_recipe("D01_hodling", glb="D01_hodling.glb", sha256="ab" * 32, family="S", template=info, factor=0.679495687,
                            H=0.5, stamp=False)
    assert rec["schema"] == 0 and rec["input"] == {"glb": "D01_hodling.glb", "sha256": "ab" * 32}
    assert rec["template"] == {k: info[k] for k in ("path", "version", "sha256")} and rec["scale"] == {"factor": 0.679495687, "H": 0.5}
    assert rec["scripts"] == {"git_head": None, "dirty": None} and rec["steps"] == []
    assert rec["landmarks"] == {"file": None, "overrides": {}} and set(rec["skin"]) == {"candidates", "choice", "params", "overrides"}
    e1 = recipe.log_step(rec, "S2", {"scale": 0.68}, {"mesh": "mesh.npz"})
    e2 = recipe.log_step(rec, "S3", None, ["landmarks.json"], time="2026-10-23T00:00:00+00:00")
    assert rec["steps"] == [e1, e2] and e1["params"] == {"scale": 0.68} and e2["outputs"] == ["landmarks.json"]
    assert re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00", e1["time"]) and e2["time"].startswith("2026-10-23")
    assert e2["params"] == {}
    with pytest.raises(ValueError):
        recipe.log_step(rec, "", {})
    with pytest.raises(ValueError):
        recipe.log_step(rec, "S4", {}, "not a list or dict")
    p = recipe.save_recipe(tmp_path / "rig" / "rig_recipe.json", rec)
    assert recipe.load_recipe(p) == rec
    assert b"\r" not in open(p, "rb").read()


def test_recipe_validation_errors(tmp_path):
    rec = recipe.new_recipe("A", stamp=False)
    for mut, pat in [
        (lambda r: r.pop("steps"), "missing required key 'steps'"),
        (lambda r: r.update(schema=1), "schema is 1"),
        (lambda r: r["input"].pop("sha256"), "recipe: input: missing required key 'sha256'"),
        (lambda r: r["scale"].update(factor="big"), "factor"),
        (lambda r: r["scripts"].update(dirty="yes"), "dirty"),
        (lambda r: r["steps"].append({"step": "S1", "time": "t", "params": [], "outputs": {}}), r"steps\[0\]: key 'params'"),
        (lambda r: r.update(template={"path": 3, "version": None, "sha256": None}), "path"),
    ]:
        bad = copy.deepcopy(rec)
        mut(bad)
        with pytest.raises(ValueError, match=pat):
            schema.validate_recipe(bad)
        with pytest.raises(ValueError):
            recipe.save_recipe(tmp_path / "bad.json", bad)
    assert not (tmp_path / "bad.json").exists()


def test_script_stamp_in_this_checkout(repo_root):
    st = recipe.script_stamp(repo_root)
    if st["git_head"] is None:
        pytest.skip("git not available")
    head = subprocess.run(["git", "-C", repo_root, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    assert st["git_head"] == head and re.fullmatch(r"[0-9a-f]{40}", head)
    assert isinstance(st["dirty"], bool)
    assert recipe.default_repo_root() == os.path.normpath(repo_root)
    assert recipe.script_stamp()["git_head"] == head  # default root
    rec = recipe.new_recipe("A", repo_root=repo_root)
    assert rec["scripts"] == recipe.script_stamp(repo_root) or rec["scripts"]["git_head"] == head
    assert recipe.stamp_scripts(rec)["git_head"] == head


def test_script_stamp_without_git_or_repo(tmp_path, monkeypatch):
    # not a repository (E:\tmp_rigkit/... has no .git above it; tmp_path lives there via conftest) or git missing: nulls, no exception
    def boom(*a, **k):
        raise FileNotFoundError("git")

    monkeypatch.setattr(recipe.subprocess, "run", boom)
    assert recipe.script_stamp(tmp_path) == {"git_head": None, "dirty": None}


def test_script_stamp_dirty_flag_in_scratch_repo(tmp_path):
    repo = str(tmp_path / "repo")
    scripts = os.path.join(repo, *recipe.SCRIPTS_REL.split("/"))
    os.makedirs(scripts)

    def git(*a):
        r = subprocess.run(["git", "-C", repo, *a], capture_output=True, text=True)
        if r.returncode != 0:
            pytest.skip(f"git unusable: {r.stderr}")
        return r.stdout

    try:
        subprocess.run(["git", "--version"], capture_output=True, check=True)
    except (OSError, subprocess.CalledProcessError):
        pytest.skip("git not available")
    git("init", "-q")
    open(os.path.join(scripts, "a.py"), "w").write("x = 1\n")
    git("add", ".")
    git("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "-m", "init")
    st = recipe.script_stamp(repo)
    assert re.fullmatch(r"[0-9a-f]{40}", st["git_head"]) and st["dirty"] is False
    os.makedirs(os.path.join(scripts, "__pycache__"))
    open(os.path.join(scripts, "__pycache__", "a.pyc"), "w").write("junk")  # generated files do not count
    assert recipe.script_stamp(repo)["dirty"] is False
    open(os.path.join(scripts, "a.py"), "w").write("x = 2\n")  # modified
    assert recipe.script_stamp(repo)["dirty"] is True
    git("checkout", "--", ".")
    open(os.path.join(scripts, "new.py"), "w").write("y = 1\n")  # untracked
    assert recipe.script_stamp(repo)["dirty"] is True
    open(os.path.join(repo, "elsewhere.txt"), "w").write("outside the scripts folder")
    os.remove(os.path.join(scripts, "new.py"))
    assert recipe.script_stamp(repo)["dirty"] is False

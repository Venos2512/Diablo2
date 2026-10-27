"""I3: unit tests of scripts/pipeline.py and pipeline_steps (no Blender, no asset data; rigkit-env pytest).

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -m pytest scripts/tests/integration/I3_pipeline_unit_test.py -q -p no:cacheprovider
"""
import json
import os
import sys
import types

import numpy as np
import pytest

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)
sys.dont_write_bytecode = True

import pipeline  # noqa: E402
from pipeline_steps import finish, report, runner as R, steps as S  # noqa: E402
from rigcore import npzio  # noqa: E402


def _args(out, **kw):
    a = dict(asset="X01", glb=os.path.join(out, "x.glb"), family="H", height=1.8, out=out, from_step=None, until=None,
             vision_decisions=None, test_auto_vision=False, keep_going=False, sha256=None, requires_fingers=False, prebend=None,
             skin_rules=None, render_what=pipeline.WHAT_DEFAULT, blender=None, unirig_out=None, tmp_dir=None, allow_existing=False)
    a.update(kw)
    return types.SimpleNamespace(**a)


def _state(done):
    return {"steps": {s: {"status": "done" if s in done else "pending"} for s in R.STEPS}}


def test_I3_step_index_and_args():
    assert R.step_index("s4") == R.STEPS.index("S4") and R.step_index("s3g") == R.STEPS.index("S3g") and R.STEPS[R.step_index(" S9 ")] == "S9"
    with pytest.raises(ValueError):
        R.step_index("S10")
    a = pipeline.parse_args(["--asset", "A", "--glb", "a.glb", "--family", "H", "--height", "1.8", "--out", "o", "--from", "s3",
                             "--until", "s5"])
    assert (a.from_step, a.until) == ("S3", "S5")
    with pytest.raises(SystemExit):
        pipeline.parse_args(["--asset", "A", "--glb", "a.glb", "--family", "H", "--height", "-1", "--out", "o"])


def test_I3_resolve_range_default_explicit_and_done():
    a = _args("o")
    assert pipeline.resolve_range(_state(["S0", "S1", "S2"]), a)[:2] == (3, len(R.STEPS) - 1)  # first step not done
    a.until = "S2"
    i0, i1, note = pipeline.resolve_range(_state(["S0", "S1", "S2"]), a)
    assert i0 is None and i1 == 2 and "done" in note
    a = _args("o", from_step="S5")
    with pytest.raises(ValueError, match="S3, S3g, S4 not done"):
        pipeline.resolve_range(_state(["S0", "S1", "S2"]), a)
    assert pipeline.resolve_range(_state(R.STEPS), a)[:2] == (R.STEPS.index("S5"), len(R.STEPS) - 1)  # re-run from S5
    a = _args("o", from_step="S6", until="S4")
    with pytest.raises(ValueError, match="after --until"):
        pipeline.resolve_range(_state(R.STEPS), a)
    assert pipeline.resolve_range(_state(R.STEPS), _args("o"))[0] is None


def test_I3_last_json_clean_and_skin_io_lines():
    txt = 'noise\n{"a": 1}\nSKIN_IO {"ok": true, "n": NaN}\nBlender quit\n'
    assert R.last_json(txt) == {"ok": True, "n": pytest.approx(float("nan"), nan_ok=True)}
    assert R.clean({"x": float("nan"), "y": [np.float32(1.5), (1, float("inf"))], "z": np.arange(2)}) == {
        "x": None, "y": [1.5, [1, None]], "z": [0, 1]}
    assert R.last_json("no json here") is None


def test_I3_prepare_out_refuses_foreign_folder(tmp_path):
    foreign = tmp_path / "foreign"
    foreign.mkdir()
    (foreign / "notes.txt").write_text("x")
    with pytest.raises(ValueError, match="no .rigkit_pipeline marker"):
        pipeline.prepare_out(str(foreign), allow_existing=False)
    pipeline.prepare_out(str(foreign), allow_existing=True)
    assert (foreign / R.MARKER).is_file()
    new = tmp_path / "new"
    pipeline.prepare_out(str(new), allow_existing=False)
    assert (new / R.MARKER).is_file()


def _touch(path, text="x"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def test_I3_supersede_and_restore(tmp_path):
    out = str(tmp_path / "rig")
    os.makedirs(out)
    c = R.Ctx(_args(out), ["pipeline.py"])
    c.load_state()
    # outputs of S2..S5 and snapshots after S2, S3, S4
    _touch(c.p("intake.json"))
    _touch(c.p("landmarks.json"))
    _touch(c.p("skeleton.json"))
    _touch(c.p("s5_report.json"))
    _touch(c.p("logs", "S4_01_skeleton.log"))
    _touch(c.blend, "blend after S5")
    _touch(c.recipe_path, "recipe after S5")
    for step, blend in (("S2", "blend after S2"), ("S4", "blend after S4")):
        _touch(c.p("_snapshots", step, os.path.basename(c.blend)), blend)
    for step in ("S2", "S3", "S4"):
        _touch(c.p("_snapshots", step, "rig_recipe.json"), f"recipe after {step}")
    _touch(c.p("_snapshots", "S5", "rig_recipe.json"), "recipe after S5")
    _touch(c.p("vision_decisions.json"), "kept")
    dest = c.supersede("S4")
    moved = {os.path.relpath(os.path.join(r, f), dest).replace("\\", "/") for r, _, fs in os.walk(dest) for f in fs}
    assert {"skeleton.json", "s5_report.json", "logs/S4_01_skeleton.log", "X01_rig.blend", "rig_recipe.json",
            "_snapshots/S4/X01_rig.blend", "_snapshots/S4/rig_recipe.json", "_snapshots/S5/rig_recipe.json"} == moved
    assert os.path.isfile(c.p("landmarks.json")) and os.path.isfile(c.p("vision_decisions.json"))  # S3 output and inputs stay
    got = c.restore("S4")
    assert open(c.blend, encoding="utf-8").read() == "blend after S2"  # newest .blend snapshot before S4
    assert open(c.recipe_path, encoding="utf-8").read() == "recipe after S3"
    assert got["blend_from"].endswith(os.path.join("S2", "X01_rig.blend"))
    # a resume whose current files equal the snapshots moves nothing but the step outputs
    assert c.supersede("S4") is None
    with pytest.raises(R.StepFailed, match="no snapshot"):
        c.restore("S6")  # no snapshot after S5 (.blend) in this folder
    _touch(c.p("_work", "skin", "A.npz"))
    with pytest.raises(R.StepFailed, match="no snapshot"):
        c.supersede("S6")  # refused before anything moves
    assert os.path.isfile(c.p("_work", "skin", "A.npz")) and os.path.isfile(c.blend)


def test_I3_state_belongs_to_one_asset(tmp_path):
    out = str(tmp_path / "rig")
    os.makedirs(out)
    c = R.Ctx(_args(out), ["pipeline.py"])
    c.load_state()
    c.save_state()
    c2 = R.Ctx(_args(out, family="S"), ["pipeline.py"])
    with pytest.raises(ValueError, match="family"):
        c2.load_state()


def test_I3_render_pose_subset(tmp_path):
    names = ["rest", "elbow_flexion_L_p75", "elbow_flexion_L_p150", "elbow_flexion_R_p150", "spine_twist_p45", "squat"]
    tags = {"rest": ["rest"], "elbow_flexion_L_p75": ["rom", "standard"], "elbow_flexion_L_p150": ["rom", "extreme"],
            "elbow_flexion_R_p150": ["rom", "extreme"], "spine_twist_p45": ["rom", "extreme"], "squat": ["compound", "extreme"]}
    p = str(tmp_path / "poses.npz")
    n, b = 3, 2
    npzio.save_poses(p, names, np.zeros((len(names), n, 3)), ["root", "pelvis"], np.zeros((len(names), b, 3)),
                     np.ones((len(names), b, 3)), meta={"tags": tags, "H": 1.0})
    assert S.render_pose_subset(p) == ["rest", "elbow_flexion_L_p150", "spine_twist_p45", "squat"]


def test_I3_finish_invariants():
    W = np.array([[1.0, 0, 0, 0, 0], [0.5, 0.5, 0, 0, 0], [0.5, 0.5, 0, 0, 0], [0.2, 0.2, 0.2, 0.2, 0.2]])
    inv = finish.invariants(W, np.array([0, 1, 1, 2]))
    assert inv["rows_over_4"] == 1 and inv["max_influences"] == 5 and not inv["ok"]
    inv = finish.invariants(W[:3, :2], np.array([0, 1, 1]))
    assert inv["ok"] and inv["colocated_max_diff"] == 0.0 and inv["empty_rows"] == 0
    bad = finish.invariants(np.array([[1.0, 0.0], [0.0, 1.0]]), np.array([0, 0]))
    assert bad["colocated_max_diff"] == 1.0 and not bad["ok"]


def test_I3_report_light_values_and_bands():
    d = {"max_depth_m": 0.0025, "at": {"pose": "squat", "region": "L_Thigh"}, "pair": {"intruder": "L_Calf", "into": "L_Thigh"}}
    s = report.light_value("deform_penetration_extreme_depth", d, 0.5)
    assert "2.5 mm" in s and "0.5 % H" in s and "squat / L_Thigh" in s and "L_Calf into L_Thigh" in s
    assert report.light_value("deform_ground_contact", {"worst_mm": 2.9, "side": "R", "pose": "long_step"}, 1.0).startswith("worst 2.9")
    th = report._thresholds()
    assert "green" in report._band(th.get("deform_area_change")) and report._band(None) == "-"
    assert report._band(th.get("deform_seam_crack")).startswith("pass/fail: <= 0")  # single-bound row (green == red)
    assert set(report.S1_QUESTIONS) >= {"cloth_bridging", "fingers_fused"}
    st = {"steps": {s: {"status": "done", "seconds": 1.0, "calls": [{"name": "x", "seconds": 0.5, "exit": 0}]} for s in R.STEPS}}
    tab = report.step_table(st)
    assert tab.count("\n") == len(R.STEPS) + 1 and "| S9 | QA sheets, report, recipe | done |" in tab


def test_I3_flag_tiles_cli_detection(tmp_path):
    c = R.Ctx(_args(str(tmp_path / "rig"), tmp_dir=str(tmp_path / "tmp")), ["pipeline.py"])
    cli = S.flag_tiles_cli(c)
    assert isinstance(cli["available"], bool) and "render" in cli["commands"] and "--out-dir" in cli["options"]


def test_I3_prune_tmp_keeps_files(tmp_path):
    c = R.Ctx(_args(str(tmp_path / "rig"), tmp_dir=str(tmp_path / "tmp")), ["pipeline.py"])
    os.makedirs(os.path.join(c.tmp, "blender_a1", "sub"))
    os.makedirs(os.path.join(c.tmp, "blender_a2"))
    _touch(os.path.join(c.tmp, "keep", "file.txt"))
    assert c.prune_tmp() == 3 and sorted(os.listdir(c.tmp)) == ["keep"]


def test_I3_owned_patterns_cover_every_step():
    assert set(R.OWNED) == set(R.STEPS) and set(S.STEP_FUNCS) == set(R.STEPS)
    assert json.loads(json.dumps(R.OWNED))  # plain data

"""I5: regression tests of the final review's driver findings (no Blender, no asset data; rigkit-env pytest).

    E:\\tools\\rigkit-env\\Scripts\\python.exe -I -B -m pytest scripts/tests/integration/I5_pipeline_resume_test.py -q -p no:cacheprovider

* M1: a ``--keep-going`` bypass stays TEST ONLY on every later run (state, both TEST_ONLY.md, qa_report banner, stdout, JSON) and
  clears only when the bypassed step re-runs and passes without the bypass;
* M2 / m2: a module crash (exit 1 without its summary line; S8 validation that could not export or validate) fails the step, also
  under ``--keep-going``; a failed A1 check stays a reported warning;
* M3 / m1: a resume refuses (exit 1, the ``--from`` to use) when a done step's arguments, input files or scripts changed (skin rules,
  pre-bend, vision decisions, a script); every run's argv is in the recipe.

The pipeline runs end to end through ``pipeline.run`` with stand-in step functions (the real ones call Blender), so the driver's
range, state, fingerprints, markers and summaries are the real code.
"""
import json
import os
import shutil
import sys
import types

import pytest

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)
sys.dont_write_bytecode = True

import pipeline  # noqa: E402
try:  # a tree before I5 has no inputs module: its tests must fail on their assertions, not at collection
    from pipeline_steps import inputs as I  # noqa: E402
except ImportError:  # pragma: no cover
    I = None
from pipeline_steps import report, runner as R, steps as S  # noqa: E402
from rigcore import recipe as rrecipe  # noqa: E402

FAIL = {"S4": True}


# ------------------------------------------------------------------ stand-in steps (no Blender)
def fake_s0(c):
    c.state["glb_sha256"] = R.sha256_file(c.glb)
    return {"glb_sha256": c.state["glb_sha256"]}


def fake_s1(c):
    return {"flags": []}


def fake_s2(c):
    with open(c.blend, "w", encoding="utf-8") as f:
        f.write("blend")
    c.save_recipe(rrecipe.new_recipe(c.asset, glb=c.glb, family=c.family, stamp=False))
    return {}


def fake_s3(c):
    return {"ready_for_user": True}


def fake_s4(c):
    kg = S._ok_or_keep_going(c, "S4", not FAIL["S4"], "S4 checks failed", None, {"bend_tests": "21/22"})
    return {"bend_tests": "21/22" if FAIL["S4"] else "22/22", "warnings": kg, "keep_going": list(kg)}


def fake_mid(c):
    return {}


def fake_s9(c):
    os.makedirs(c.p("qa"), exist_ok=True)
    return {"report": report.qa_report(c, {})}


FAKES = {"S0": fake_s0, "S1": fake_s1, "S2": fake_s2, "S3": fake_s3, "S3g": fake_mid, "S4": fake_s4, "S5": fake_mid, "S6": fake_mid, "S7": fake_mid,
         "S8": fake_mid, "S9": fake_s9}


@pytest.fixture
def rig(tmp_path, monkeypatch):
    for s, f in FAKES.items():
        monkeypatch.setitem(S.STEP_FUNCS, s, f)
    FAIL["S4"] = True
    glb = tmp_path / "src" / "x.glb"
    glb.parent.mkdir()
    glb.write_bytes(b"glTF fake")
    out = tmp_path / "rig"
    base = ["--asset", "X01", "--glb", str(glb), "--family", "H", "--height", "1.8", "--out", str(out), "--unirig-out",
            str(tmp_path / "unirig"), "--tmp-dir", str(tmp_path / "tmp")]
    return types.SimpleNamespace(tmp=tmp_path, out=out, base=base)


def run(capsys, argv):
    code = pipeline.run(argv)
    lines = [ln for ln in capsys.readouterr().out.splitlines() if ln.strip()]
    js = json.loads(lines[-1])
    assert js["exit"] == code
    return code, js, lines


def state(out):
    with open(os.path.join(out, R.STATE), encoding="utf-8") as f:
        return json.load(f)


def _args(out, **kw):
    a = dict(asset="X01", glb=os.path.join(str(out), "..", "x.glb"), family="H", height=1.8, out=str(out), from_step=None,
             until=None, vision_decisions=None, test_auto_vision=False, keep_going=False, sha256=None, requires_fingers=False,
             prebend=None, skin_rules=None, render_what=pipeline.WHAT_DEFAULT, blender=None, unirig_out=None, tmp_dir=None,
             allow_existing=False)
    a.update(kw)
    return types.SimpleNamespace(**a)


# ================================================================== M1
def test_I5_M1_keep_going_bypass_persists_on_a_later_run(rig, capsys):
    """Review M1 scenario: --keep-going --until S5 continues past a failed S4; a later run WITHOUT flags resumes S6-S9: every
    output must still say TEST ONLY."""
    code, js, _ = run(capsys, rig.base + ["--keep-going", "--until", "S5"])
    assert code == 0 and js["test_keep_going"] == ["S4"] and js["test_only"] is True
    assert (rig.out / "TEST_ONLY.md").is_file()  # already after the bypassing run
    code, js, lines = run(capsys, rig.base)  # resume S6..S9 without --keep-going
    assert code == 0 and js["steps"]["S9"][0] == "done"
    assert js["test_keep_going"] == ["S4"] and js["test_only"] is True and js["test_auto_vision"] is False
    assert any(ln.startswith("TEST ONLY: --keep-going continued past failed checks in S4") for ln in lines)
    st = state(rig.out)
    assert list(st["test_keep_going"]) == ["S4"]
    for marker in (rig.out / "TEST_ONLY.md", rig.out / "qa" / "TEST_ONLY.md"):
        assert marker.is_file() and "--keep-going" in marker.read_text(encoding="utf-8")
    rep = (rig.out / "qa_report.md").read_text(encoding="utf-8")
    assert "TEST ONLY - not a G2 candidate" in rep.split("## Steps")[0] and "--keep-going" in rep.split("## Steps")[0]
    rec = json.loads((rig.out / "rig_recipe.json").read_text(encoding="utf-8"))["pipeline"]
    assert rec["keep_going_steps"] == ["S4"] and rec["test_only"] is True
    # a no-op run of the same folder still reports it
    code, js, lines = run(capsys, rig.base)
    assert code == 0 and js["test_only"] is True and any(ln.startswith("TEST ONLY: --keep-going") for ln in lines)


def test_I5_M1_clears_only_when_the_bypassed_step_passes(rig, capsys):
    run(capsys, rig.base + ["--keep-going"])
    assert (rig.out / "qa" / "TEST_ONLY.md").is_file()
    code, js, _ = run(capsys, rig.base + ["--from", "S5"])  # S4 keeps its bypass
    assert code == 0 and js["test_keep_going"] == ["S4"] and (rig.out / "TEST_ONLY.md").is_file()
    code, js, _ = run(capsys, rig.base + ["--from", "S4"])  # S4 still fails without the bypass: the run stops there
    assert code == 1 and js["steps"]["S4"][0] == "failed"
    FAIL["S4"] = False
    code, js, _ = run(capsys, rig.base + ["--from", "S4"])
    assert code == 0 and js["test_keep_going"] == [] and js["test_only"] is False
    assert not (rig.out / "TEST_ONLY.md").exists() and not (rig.out / "qa" / "TEST_ONLY.md").exists()
    assert "TEST ONLY" not in (rig.out / "qa_report.md").read_text(encoding="utf-8")


def test_I5_M1_report_banner_from_state_not_from_flags(tmp_path):
    """qa_report / markers read the state: a Ctx of a run WITHOUT --keep-going still writes the banner and both markers."""
    out = tmp_path / "rig"
    out.mkdir()
    c = R.Ctx(_args(out, tmp_dir=str(tmp_path / "t")), ["pipeline.py"])
    c.load_state()
    for s in R.STEPS:
        c.state["steps"][s] = {"status": "done", "summary": {}}
    c.state["steps"]["S4"]["summary"] = {"warnings": ["S4 checks failed (continued: --keep-going, TEST ONLY): x"],
                                         "keep_going": ["S4 checks failed (continued: --keep-going, TEST ONLY): x"]}
    assert c.update_test_flags() == {"test_auto_vision": False, "test_keep_going": ["S4"], "test_only": True}
    (out / "qa").mkdir()
    txt = open(report.qa_report(c, {}), encoding="utf-8").read()
    assert "> **TEST ONLY - not a G2 candidate.** `--keep-going`" in txt
    assert len(report.sync_test_markers(c)) == 2
    # a state written before I5 (warning text only) counts too
    c.state["steps"]["S4"]["summary"] = {"warnings": ["S4 checks failed (continued: --keep-going, TEST ONLY): x"]}
    assert c.keep_going_bypass() == {"S4": ["S4 checks failed (continued: --keep-going, TEST ONLY): x"]}
    # ensure_report_banner fixes a report that lacks it, once
    (out / "qa_report.md").write_text("# X01 - rig QA report\n\nbody\n", encoding="utf-8")
    c.update_test_flags()
    assert report.ensure_report_banner(c) and not report.ensure_report_banner(c)
    assert "--keep-going" in (out / "qa_report.md").read_text(encoding="utf-8")


# ================================================================== M2 / m2
def _ctx_with_calls(tmp_path, calls, **kw):
    out = tmp_path / "rig"
    out.mkdir(exist_ok=True)
    c = R.Ctx(_args(out, tmp_dir=str(tmp_path / "t"), **kw), ["pipeline.py"])
    c.load_state()
    c.step = kw.pop("step", "S4")

    def fake_call(name, cmd, timeout=900.0, ok_codes=(0,), cwd=None):
        r = dict(calls[name], name=name, log=str(tmp_path / f"{name}.log"), seconds=0.1)
        if r["exit"] not in ok_codes:
            raise R.StepFailed(c.step, f"{name} exited {r['exit']}", r["log"])
        return r

    c.call = fake_call
    return c


def test_I5_M2_checks_failed_needs_the_summary_line(tmp_path):
    c = _ctx_with_calls(tmp_path, {})
    assert S._checks_failed(c, {"exit": 0, "summary": None, "name": "x", "log": "l"}, "S4") is False
    assert S._checks_failed(c, {"exit": 1, "summary": {"step": "S4", "ok": False}, "name": "x", "log": "l"}, "S4") is True
    for summ in (None, {"step": "S4.prebend", "ok": False}, {"error": "Traceback"}):
        with pytest.raises(R.StepFailed, match="crashed"):
            S._checks_failed(c, {"exit": 1, "summary": summ, "name": "x", "log": "l"}, "S4")


def test_I5_m2_s4_crash_is_never_continued_by_keep_going(tmp_path):
    """skeleton.py raised after s4_report.json was written (exit 1, no summary line): even --keep-going must fail S4."""
    c = _ctx_with_calls(tmp_path, {"skeleton": {"exit": 1, "summary": None}}, keep_going=True)
    R.write_json(c.p("s4_report.json"), {"build": {"bones": 36, "bend_tests_passed": 22, "bend_tests_total": 22},
                                         "checks": {"ok": True}, "prebend": {"chains": []}})
    with pytest.raises(R.StepFailed, match="crashed"):
        S.s4_skeleton(c)
    # the same exit with the summary line (a failed bend test) is continued under --keep-going and recorded as a bypass
    c2 = _ctx_with_calls(tmp_path, {"skeleton": {"exit": 1, "summary": {"step": "S4", "ok": False}}}, keep_going=True)
    out = S.s4_skeleton(c2)
    assert out["keep_going"] and "--keep-going" in out["keep_going"][0]


def _s8_ctx(tmp_path, export_exit, summary, val, **kw):
    c = _ctx_with_calls(tmp_path, {"export_validate": {"exit": export_exit, "summary": summary},
                                   "parity_blender": {"exit": 0, "summary": None}, "parity_cmp": {"exit": 0, "summary": None}},
                        **kw)
    c.step = "S8"
    R.write_json(c.p("checks", "validation.json"), val)
    return c


def _val(export, errors, failed):
    return {"A1_summary": {"checks": 14, "passed": 14 - len(failed), "failed": failed},
            "extra_summary": {"checks": 5, "passed": 5, "failed": []}, "errors": errors, "export": export}


def test_I5_M2_s8_export_crash_fails_the_step(tmp_path):
    """export.py caught an exception (failed_validation: every check 'not measured', exit 1, summary ok false): S8 must fail."""
    val = _val(None, [{"part": "validate", "error": "LookupError: no runtime armature"}], [f"A1.{i}" for i in range(1, 15)])
    c = _s8_ctx(tmp_path, 1, {"step": "S8", "ok": False}, val, keep_going=True)
    with pytest.raises(R.StepFailed, match="could not export or validate"):
        S.s8_export(c)
    val = _val({"path": "x.glb", "sha256": "0" * 64}, [{"part": "skin", "error": "KeyError: JOINTS_0"}], ["A1.5"])
    with pytest.raises(R.StepFailed, match="could not export or validate"):
        S.s8_export(_s8_ctx(tmp_path, 1, {"step": "S8", "ok": False}, val))
    with pytest.raises(R.StepFailed, match="crashed"):  # exit 1 without the summary line
        S.s8_export(_s8_ctx(tmp_path, 1, None, _val({"path": "x.glb", "sha256": "0" * 64}, [], [])))


def test_I5_M2_s8_failed_a1_check_stays_a_reported_warning(tmp_path):
    val = _val({"path": "x.glb", "sha256": "0" * 64}, [], ["A1.14"])
    out = S.s8_export(_s8_ctx(tmp_path, 1, {"step": "S8", "ok": False}, val))
    assert out["warnings"] and "A1 failed ['A1.14']" in out["warnings"][0] and "keep_going" not in out


# ================================================================== M3 / m1
def test_I5_M3_changed_skin_rules_refuse_and_name_the_from(rig, capsys):
    r1, r2 = rig.tmp / "r1.json", rig.tmp / "r2.json"
    r1.write_text('{"schema": 0, "asset_id": "X01"}', encoding="utf-8")
    r2.write_text('{"schema": 0, "asset_id": "X01", "rigid_islands": []}', encoding="utf-8")
    FAIL["S4"] = False
    code, js, _ = run(capsys, rig.base + ["--skin-rules", str(r1)])
    assert code == 0 and js["test_only"] is False
    before = state(rig.out)
    code, js, lines = run(capsys, rig.base + ["--skin-rules", str(r2)])  # review M3 scenario (a): never resume silently
    assert code == 1 and js["use_from"] == "S6" and list(js["stale"]) == ["S6"]
    assert any("files.skin_rules" in x for x in js["stale"]["S6"])
    after = state(rig.out)
    assert {s: after["steps"][s].get("ended") for s in R.STEPS} == {s: before["steps"][s].get("ended") for s in R.STEPS}
    code, js, _ = run(capsys, rig.base)  # forgetting --skin-rules is a change too (generic rules)
    assert code == 1 and js["use_from"] == "S6"
    code, js, _ = run(capsys, rig.base + ["--skin-rules", str(r2), "--from", "S7"])  # --from after the stale step: refused
    assert code == 1 and js["use_from"] == "S6"
    code, js, _ = run(capsys, rig.base + ["--skin-rules", str(r2), "--from", "S6"])
    assert code == 0 and js["steps"]["S5"][0] == "done"
    code, js, _ = run(capsys, rig.base + ["--skin-rules", str(r2)])
    assert code == 0 and "every step is done" in js["message"]
    rec = json.loads((rig.out / "rig_recipe.json").read_text(encoding="utf-8"))["pipeline"]
    argvs = [r["argv"] for r in rec["runs"]]
    assert any(str(r1) in a for a in argvs) and any(str(r2) in a and "S6" in a for a in argvs)  # every run's argv
    assert rec["steps"]["S6"]["inputs"]["files"]["skin_rules"] == R.sha256_file(str(r2))
    entries = [e for e in json.loads((rig.out / "rig_recipe.json").read_text(encoding="utf-8"))["steps"]
               if e["step"] == "pipeline.S6"]
    assert entries[-1]["params"]["inputs_sha256"] and str(r2) in entries[-1]["params"]["argv"]


def test_I5_M3_prebend_and_vision_decisions(rig, capsys):
    """--prebend on a done S4 and (m1) new --vision-decisions on a done S3 invalidate S4+ / S3+."""
    FAIL["S4"] = False
    assert run(capsys, rig.base + ["--test-auto-vision"])[0] == 0
    code, js, _ = run(capsys, rig.base + ["--prebend", '{"elbow_deg": 12}'])
    assert code == 1 and js["use_from"] == "S4" and any("args.prebend" in x for x in js["stale"]["S4"])
    v = rig.tmp / "vision_decisions.json"
    v.write_text('{"decisions": {}}', encoding="utf-8")
    code, js, _ = run(capsys, rig.base + ["--vision-decisions", str(v)])
    assert code == 1 and js["use_from"] == "S3" and any("files.vision_decisions" in x for x in js["stale"]["S3"])
    code, js, _ = run(capsys, rig.base + ["--vision-decisions", str(v), "--from", "S3"])
    assert code == 0


def test_I5_M3_touched_script_makes_its_step_stale(rig, capsys, monkeypatch):
    """Review M3 scenario (b): a script edited after the steps ran (solvers/metrics.py) -> the resume refuses from S7."""
    tree = rig.tmp / "scripts_copy"
    for pkg in I.PACKAGES:
        shutil.copytree(os.path.join(SCRIPTS, pkg), tree / pkg, ignore=shutil.ignore_patterns("__pycache__"))
    monkeypatch.setattr(I, "SCRIPTS", str(tree))
    FAIL["S4"] = False
    assert run(capsys, rig.base)[0] == 0
    with open(tree / "solvers" / "metrics.py", "a", encoding="utf-8") as f:
        f.write("\n# touched\n")
    code, js, _ = run(capsys, rig.base)
    assert code == 1 and js["use_from"] == "S7" and list(js["stale"]) == ["S7"]
    assert any("script solvers/metrics.py: changed" in x for x in js["stale"]["S7"])
    code, js, _ = run(capsys, rig.base + ["--until", "S5"])  # steps up to S5 are fresh: nothing to do there
    assert code == 0
    assert run(capsys, rig.base + ["--from", "S7"])[0] == 0


def test_I5_M3_checks_and_paths_are_not_inputs(rig, capsys):
    """No false refusal: --sha256 only checks the GLB (its content is the input) and the UniRig output counts by content, so a
    resume without --sha256 or with the same UniRig GLB under another --unirig-out builds on the done steps."""
    FAIL["S4"] = False
    for d in ("unirig", "unirig2"):
        (rig.tmp / d / "X01").mkdir(parents=True)
        (rig.tmp / d / "X01" / "X01_rigged.glb").write_bytes(b"rigged")
    sha = R.sha256_file(os.path.join(rig.base[3]))
    assert run(capsys, rig.base + ["--sha256", sha, "--until", "S5"])[0] == 0
    moved = [x if x != str(rig.tmp / "unirig") else str(rig.tmp / "unirig2") for x in rig.base]
    code, js, _ = run(capsys, moved)
    assert code == 0 and js["steps"]["S9"][0] == "done"
    (rig.tmp / "unirig2" / "X01" / "X01_rigged.glb").write_bytes(b"rigged again")  # new UniRig output: S3 is stale
    code, js, _ = run(capsys, moved)
    assert code == 1 and js["use_from"] == "S3" and any("files.unirig_rigged" in x for x in js["stale"]["S3"])


def test_I5_M3_legacy_state_without_fingerprints_is_refused(rig, capsys):
    FAIL["S4"] = False
    assert run(capsys, rig.base + ["--until", "S5"])[0] == 0
    st = state(rig.out)
    for s in R.STEPS:
        st["steps"][s].pop("inputs", None)
    R.write_json(os.path.join(rig.out, R.STATE), st)
    code, js, _ = run(capsys, rig.base)
    assert code == 1 and js["use_from"] == "S0" and "no input fingerprint" in js["stale"]["S0"][0]


def test_I5_M3_closure_and_code_hash(tmp_path, monkeypatch):
    tree = tmp_path / "t"
    (tree / "solvers").mkdir(parents=True)
    (tree / "rigcore").mkdir()
    (tree / "solvers" / "__init__.py").write_text("")
    (tree / "rigcore" / "__init__.py").write_text("SCHEMA = 0\n")
    (tree / "rigcore" / "schema.py").write_text("X = 1\n")
    (tree / "solvers" / "a.py").write_text("from rigcore import SCHEMA, schema\n\ndef f():\n    from solvers import b\n"
                                           "    return 'thresholds.json'\n")
    (tree / "solvers" / "b.py").write_text("Y = 2\n")
    (tree / "solvers" / "thresholds.json").write_text("{}")
    monkeypatch.setattr(I, "SCRIPTS", str(tree))
    cl = I.scripts_closure(["solvers/a.py"])
    assert sorted(cl) == ["rigcore/__init__.py", "rigcore/schema.py", "solvers/__init__.py", "solvers/a.py", "solvers/b.py",
                          "solvers/thresholds.json"]  # function-level import, quoted data file; rigcore.SCHEMA is no file
    (tree / "solvers" / "b.py").write_text("Y = 3\n")
    assert I.diff({"args": {}, "files": {}, "scripts": cl, "code": "x"},
                  {"args": {}, "files": {}, "scripts": I.scripts_closure(["solvers/a.py"]), "code": "x"}) == [
        f"script solvers/b.py: changed ({cl['solvers/b.py'][:12]} -> {R.sha256_file(str(tree / 'solvers' / 'b.py'))[:12]})"]
    h0 = I.code_sha(S.s4_skeleton, [S, report])
    monkeypatch.setattr(S, "_ok_or_keep_going", lambda *a, **k: [])  # a helper the step calls changed
    assert I.code_sha(S.s4_skeleton, [S, report]) != h0
    assert I.code_sha(S.s9_package, [S, report]) == I.code_sha(S.s9_package, [S, report])

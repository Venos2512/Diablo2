r"""G3 (phase G integration): pipeline step S3g, the ``--garments`` fingerprint and refusal, the legacy no-op, the body skeleton of
S6/S7, the scoring metrics' garment region, and a smoke check of the FL report's Garments section.

    E:\tools\rigkit-env\Scripts\python.exe -I -B -m pytest tests/integration/G3_pipeline_garments_test.py -q -p no:cacheprovider

The S3g test on real data copies I4's FL folder inputs (mesh.npz, landmarks.json, analysis.json/.npz) into a temp folder and runs
the real step function (solvers/garments.py + solvers/chains.py through their CLIs); it is skipped when that folder is absent. The
report smoke test reads G3's end-to-end FL run (``E:\tmp_rigkit\G3\FL_H``) and is skipped when it has not run.
"""
import json
import os
import shutil
import sys
import types

import numpy as np
import pytest

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, SCRIPTS)

import pipeline  # noqa: E402
from pipeline_steps import inputs as I  # noqa: E402
from pipeline_steps import report  # noqa: E402
from pipeline_steps import runner as R  # noqa: E402
from pipeline_steps import steps as S  # noqa: E402
from rigcore import recipe as rrecipe  # noqa: E402

FL_SRC = r"E:\tmp_rigkit\I4\FL_H"
FL_RUN = r"E:\tmp_rigkit\G3\FL_H"
D01_RUN = r"E:\tmp_rigkit\G3\D01_S"


def _args(out, **kw):
    a = dict(asset="X01", glb=os.path.join(str(out), "..", "x.glb"), family="H", height=1.8, out=str(out), from_step=None,
             until=None, vision_decisions=None, test_auto_vision=False, keep_going=False, sha256=None, requires_fingers=False,
             prebend=None, skin_rules=None, render_what=pipeline.WHAT_DEFAULT, blender=None, unirig_out=None, tmp_dir=None,
             allow_existing=False, garments=None)
    a.update(kw)
    return types.SimpleNamespace(**a)


# ------------------------------------------------------------------ step table
def test_G3_s3g_sits_between_s3_and_s4():
    assert R.STEPS.index("S3g") == R.STEPS.index("S3") + 1 == R.STEPS.index("S4") - 1
    assert R.step_index("s3g") == R.step_index("S3G") == R.STEPS.index("S3g")
    assert S.STEP_FUNCS["S3g"] is S.s3g_garments and tuple(S.STEP_FUNCS) == R.STEPS
    assert {"garments.json", "garments.npz", "chains.json"} <= set(R.OWNED["S3g"])
    assert "S3g" in R.TITLES and "S3g" in S.FAMILY_STEPS
    a = pipeline.parse_args(["--asset", "A", "--glb", "a.glb", "--family", "H", "--height", "1.8", "--out", "o", "--from", "s3g",
                             "--until", "S4", "--garments", "g.json"])
    assert (a.from_step, a.until, a.garments) == ("S3g", "S4", "g.json")
    sc = I.scripts_closure(S.STEP_SCRIPTS["S3g"])
    assert {"solvers/garments.py", "solvers/chains.py", "rigkit/skeleton.py", "solvers/skin_common.py"} <= set(sc)
    for st in ("S6", "S7"):
        assert "solvers/skin_garment.py" in I.scripts_closure(S.STEP_SCRIPTS[st])


# ------------------------------------------------------------------ --garments fingerprint and refusal (fake steps, no Blender)
SEEN = []


def _fake(name):
    def f(c):
        SEEN.append(name)
        if name == "S2":
            with open(c.blend, "w", encoding="utf-8") as fh:
                fh.write("blend")
            c.save_recipe(rrecipe.new_recipe(c.asset, glb=c.glb, family=c.family, stamp=False))
        if name == "S3g":
            return {"override": S.garments_override(c)}
        if name == "S9":
            os.makedirs(c.p("qa"), exist_ok=True)
        return {}
    return f


@pytest.fixture
def rig(tmp_path, monkeypatch):
    for s in R.STEPS:
        monkeypatch.setitem(S.STEP_FUNCS, s, _fake(s))
    SEEN.clear()
    glb = tmp_path / "src" / "x.glb"
    glb.parent.mkdir()
    glb.write_bytes(b"glTF fake")
    base = ["--asset", "X01", "--glb", str(glb), "--family", "H", "--height", "1.8", "--out", str(tmp_path / "rig"), "--unirig-out",
            str(tmp_path / "unirig"), "--tmp-dir", str(tmp_path / "tmp")]
    return types.SimpleNamespace(tmp=tmp_path, out=tmp_path / "rig", base=base)


def _run(capsys, argv):
    code = pipeline.run(argv)
    lines = [ln for ln in capsys.readouterr().out.splitlines() if ln.strip()]
    js = json.loads(lines[-1])
    assert js["exit"] == code
    return code, js


def test_G3_garments_override_is_an_s3g_input(rig, capsys):
    code, js = _run(capsys, rig.base)
    assert code == 0 and SEEN == list(R.STEPS)
    st = json.load(open(rig.out / R.STATE, encoding="utf-8"))
    assert st["steps"]["S3g"]["inputs"]["args"] == {"garments": None}
    ov = rig.tmp / "garments_override.json"
    ov.write_text(json.dumps({"schema": 0, "pieces": {"g02": {"disable": True}}}), encoding="utf-8")
    # a new --garments file on a done S3g: refused, nothing re-run, the --from to use is S3g
    SEEN.clear()
    code, js = _run(capsys, rig.base + ["--garments", str(ov)])
    assert code == 1 and js["use_from"] == "S3g" and not SEEN
    assert any("args.garments" in x for x in js["stale"]["S3g"]) and any("files.garments_override" in x for x in js["stale"]["S3g"])
    assert list(js["stale"]) == ["S3g"]  # S0-S3 stay valid
    # --from S3g rebuilds S3g and every later step with the override; afterwards the same command is a no-op
    code, js = _run(capsys, rig.base + ["--garments", str(ov), "--from", "S3g"])
    assert code == 0 and SEEN == list(R.STEPS[R.STEPS.index("S3g"):])
    st = json.load(open(rig.out / R.STATE, encoding="utf-8"))
    assert st["steps"]["S3g"]["summary"]["override"] == os.path.abspath(str(ov))
    SEEN.clear()
    code, js = _run(capsys, rig.base + ["--garments", str(ov)])
    assert code == 0 and not SEEN
    # the same path with new content is stale again; forgetting the flag is stale too
    ov.write_text(json.dumps({"schema": 0, "pieces": {"g02": {"bones": 2}}}), encoding="utf-8")
    code, js = _run(capsys, rig.base + ["--garments", str(ov)])
    assert code == 1 and js["use_from"] == "S3g" and any("files.garments_override" in x for x in js["stale"]["S3g"])
    code, js = _run(capsys, rig.base)
    assert code == 1 and js["use_from"] == "S3g" and any("args.garments: given -> null" in x for x in js["stale"]["S3g"])
    # --until S3 does not rely on S3g: allowed
    code, js = _run(capsys, rig.base + ["--until", "S3"])
    assert code == 0


# ------------------------------------------------------------------ S3g itself
def test_G3_s3g_is_a_noop_for_the_legacy_family(tmp_path):
    out = tmp_path / "rig"
    out.mkdir()
    c = R.Ctx(_args(out, family="S_legacy_D01", height=0.5), ["pipeline.py"])
    c.load_state()
    sm = S.s3g_garments(c)
    assert sm["skipped"] and not sm["chains"]
    assert not any((out / f).exists() for f in ("garments.json", "garments.npz", "chains.json"))
    assert S.chains_doc(c) is None
    assert S.step_inputs(c, "S3g")["args"] == {"garments": None}


def test_G3_body_skeleton_drops_chain_bones(tmp_path):
    out = tmp_path / "rig"
    out.mkdir()
    c = R.Ctx(_args(out), ["pipeline.py"])
    c.load_state()
    sk = {"family": "H", "bones": [{"name": "pelvis"}, {"name": "skirt_F_01", "chain": "skirt_F", "piece": "g00"}],
          "chains": {"n_chains": 1}}
    R.write_json(c.p("skeleton.json"), sk)
    path = S.body_skeleton(c)
    body = json.load(open(path, encoding="utf-8"))
    assert path.endswith("skeleton_body.json") and [b["name"] for b in body["bones"]] == ["pelvis"] and "chains" not in body
    R.write_json(c.p("skeleton.json"), {"family": "H", "bones": [{"name": "pelvis"}]})
    assert S.body_skeleton(c) == c.p("skeleton.json")  # no chain bones: the S4 skeleton itself (nothing changes)


@pytest.mark.skipif(not os.path.isfile(os.path.join(FL_SRC, "_work", "mesh.npz")), reason="I4's FL folder is absent")
def test_G3_s3g_on_fl(tmp_path):
    out = tmp_path / "FL"
    (out / "_work").mkdir(parents=True)
    for f in ("landmarks.json", "analysis.json", "analysis.npz"):
        shutil.copy2(os.path.join(FL_SRC, f), out / f)
    shutil.copy2(os.path.join(FL_SRC, "_work", "mesh.npz"), out / "_work" / "mesh.npz")
    c = R.Ctx(_args(out, asset="FL_flagellant_vA", tmp_dir=str(tmp_path / "tmp")), ["pipeline.py"])
    c.load_state()
    c.step = "S3g"
    R.write_json(c.recipe_path, rrecipe.new_recipe(c.asset, glb=c.glb, family=c.family, stamp=False))
    sm = S.s3g_garments(c)
    assert not sm["skipped"] and [x["name"] for x in c.calls] == ["garments", "chains"]
    ids = {x["id"]: x for x in sm["chains"]}
    ring = [k for k, v in ids.items() if v["class"] == "skirt"]
    # G6 coverage fit: ring chains that cannot hold 8 rows are dropped and bones are cut per chain (FL: 6 of 8 remain)
    assert 4 <= len(ring) <= 8 and all(ids[k]["leg_push"] for k in ring)
    assert all(1 <= ids[k]["bones"] <= 6 for k in ring)
    cov = json.load(open(c.p("chains.json"), encoding="utf-8")).get("coverage") or []
    assert cov and all(r["ok"] and min(min(v) for v in r["rows_per_bone"].values()) >= 8 for r in cov)  # >= 8 rows per bone
    assert sm["budget"]["used"] <= sm["budget"]["aux_budget"] == 32
    apron = [p for p in sm["pieces"] if p["class"] == "strip" and p["chains"]]
    assert apron and apron[0]["free_length_m"] < apron[0]["length_m"]  # bones from the free length (spec §3, G3)
    assert S.chains_doc(c) is not None and sm["spring_hints"] == c.p("chains.json")
    ch = json.load(open(c.p("chains.json"), encoding="utf-8"))
    assert all("min_leg_distance" in x["spring"] for x in ch["chains"]) and ch["colliders"]
    rec = json.load(open(c.recipe_path, encoding="utf-8"))
    assert any(s["step"] == "S3g" for s in rec["steps"])


# ------------------------------------------------------------------ end-to-end evidence (G3 runs)
@pytest.mark.skipif(not os.path.isfile(os.path.join(FL_RUN, "qa_report.md")), reason="G3's FL end-to-end run is absent")
def test_G3_fl_report_has_the_garment_section():
    txt = open(os.path.join(FL_RUN, "qa_report.md"), encoding="utf-8").read()
    assert "## Garments (S3g)" in txt and "TEST ONLY" in txt
    sec = txt.split("## Garments (S3g)", 1)[1].split("\n## ", 1)[0]
    for k in ("| piece | class | confidence |", "skirt_F", "Chain bones:", "aux budget 32", "Spring hints", "chains.json",
              "garment_limb_penetration", "garment_torn_edges", "garment_bleed", "garment_chain_coverage", "Garment sheet:"):
        assert k in sec, k
    st = json.load(open(os.path.join(FL_RUN, R.STATE), encoding="utf-8"))
    assert all(st["steps"][s]["status"] == "done" for s in R.STEPS)
    s8 = st["steps"]["S8"]["summary"]
    assert s8["A1"]["passed"] == s8["A1"]["checks"] == 14
    met = json.load(open(os.path.join(FL_RUN, "checks", "metrics", "metrics.json"), encoding="utf-8"))
    assert {k for k in met["lights"] if k.startswith("garment_")} == set(report.GARMENT_LIGHT_KEYS)
    chain_bones = {b["name"] for b in json.load(open(os.path.join(FL_RUN, "skeleton.json"), encoding="utf-8"))["bones"]
                   if b.get("chain")}
    assert not set(met["summary"].get("not_exercised") or []) & chain_bones  # chain regions never "not exercised"
    sd = os.path.join(FL_RUN, "_work", "s7_scoring", "metrics")
    scores = json.load(open(os.path.join(sd, "region_scores.json"), encoding="utf-8"))
    with np.load(os.path.join(sd, "regions.npz"), allow_pickle=False) as z:
        names = [str(x) for x in z["names"]]
    assert "_garments" in names and "_garments" not in scores  # garment rows were left out of the selection scores
    assert not set(scores) & chain_bones


@pytest.mark.skipif(not os.path.isfile(os.path.join(D01_RUN, "s4_report.json")), reason="G3's D01 end-to-end run is absent")
def test_G3_d01_plan_and_s4():
    ch = json.load(open(os.path.join(D01_RUN, "chains.json"), encoding="utf-8"))
    assert sorted((c["id"], len(c["bones"])) for c in ch["chains"]) == [("tail_1", 1), ("tail_2", 1)]  # back flap: 1 bone (free length)
    s4 = json.load(open(os.path.join(D01_RUN, "s4_report.json"), encoding="utf-8"))
    rb = s4["chains"]["root_bend_tests"]
    assert s4["build"]["bend_tests_passed"] == s4["build"]["bend_tests_total"] and s4["build"]["bend_tests_total"] - len(rb) == 22

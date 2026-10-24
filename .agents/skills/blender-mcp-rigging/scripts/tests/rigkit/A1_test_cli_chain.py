r"""A1 step-CLI chain test: rebuild D01 (legacy family) with one ``blender -b`` process per step and check the result.

Run with the solver Python (it starts Blender itself; each step is a separate process, as an orchestrator would run them):

    E:\tools\rigkit-env\Scripts\python.exe -I scripts/tests/rigkit/A1_test_cli_chain.py [--out E:\tmp_rigkit\A1\cli]

Steps: A1_g2_reference.py (G2 reference into ``<out>/g2``, sha256-checked) -> rigkit/intake.py -> rigkit/skeleton.py -> (this file
inside Blender: G2 weights by vertex index, TEST ONLY; skinning is writer B's) -> rigkit/control.py (no ``--family``: the builder
block comes from skeleton.json) -> rigkit/functest.py -> rigkit/export.py. Checks: every step exits 0; skeleton.json equals the
skeleton computed here in rigkit-env (``skeleton.resolve_skeleton`` + ``apply_flips`` with no flip: same template, landmarks and
pre-bend as the in-process regression); S5 took its builder from the skeleton; A1 14/14 and extras 5/5; test GLB byte-identical
to D01's check GLB; function tests 20/20; the recipe holds the step log. One JSON line; exit 1 on failure.

The output folder is cleared first, but only when it lies inside ``E:\tmp_rigkit`` (real paths) and carries the marker file this
test writes on creation (``MARKER``); an empty folder is accepted. Anything else is refused.
"""
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
REPO = os.path.normpath(os.path.join(SCRIPTS, "..", "..", "..", ".."))
D01 = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling")
GLB = os.path.join(D01, "D01_hodling.glb")
GLB_SHA256 = "bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a"
LANDMARKS = os.path.join(D01, "rig", "tools", "landmarks.json")
D01_VALIDATION = os.path.join(D01, "rig", "validation.json")
BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
SCRATCH_ROOT = r"E:\tmp_rigkit"
DEFAULT_OUT = r"E:\tmp_rigkit\A1\cli"
MARKER = ".a1_cli_chain_output"
sys.dont_write_bytecode = True
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)


def _apply_weights_in_blender(blend, npz):
    """Blender side (TEST ONLY): copy the G2 weights by vertex index into the rig's mesh and save."""
    import numpy as np

    from rigkit import bl

    bl.open_file(blend)
    me = bl.find("mesh", "D01_hodling")
    z = np.load(npz)
    W, groups = z["W"], [str(g) for g in z["groups"]]
    for g in list(me.vertex_groups):
        me.vertex_groups.remove(g)
    for j, nm in enumerate(groups):
        vg = me.vertex_groups.new(name=nm)
        col = W[:, j]
        idx = np.flatnonzero(col > 0)
        for w in np.unique(col[idx]):
            vg.add([int(i) for i in idx[col[idx] == w]], float(w), "REPLACE")
    bl.save_main(blend)
    print(bl.json_line({"step": "weights(test)", "ok": True, "groups": len(groups)}))
    return 0


def _inside(path, root) -> bool:
    """True when the real path of ``path`` lies strictly inside the real path of ``root`` (junctions / symlinks resolved)."""
    p, r = (os.path.normcase(os.path.realpath(os.path.abspath(x))) for x in (path, root))
    try:
        return p != r and os.path.commonpath([p, r]) == r
    except ValueError:  # another drive
        return False


def prepare_out(out, root=SCRATCH_ROOT, marker=MARKER):
    """Clear and recreate ``out`` for a new run, refusing anything this test did not make: the real path must lie strictly inside
    ``root`` (junctions / symlinks resolved), and an existing non-empty folder must hold ``marker``. Writes the marker into the new
    folder. Returns the real path."""
    real = os.path.realpath(os.path.abspath(out))
    if not _inside(real, root):
        raise RuntimeError(f"refusing to clear {out!r}: not inside {root!r} (real path {real!r})")
    if os.path.exists(real):
        if not os.path.isdir(real):
            raise RuntimeError(f"refusing to clear {out!r}: not a folder")
        if os.listdir(real) and not os.path.isfile(os.path.join(real, marker)):
            raise RuntimeError(f"refusing to clear {out!r}: it has no {marker} marker, so this test did not create it")
        shutil.rmtree(real)
    os.makedirs(real)
    with open(os.path.join(real, marker), "w", encoding="utf-8") as f:
        f.write("made by tests/rigkit/A1_test_cli_chain.py; the folder is cleared at the start of every run\n")
    return real


def _run(step, script, args, log):
    t0 = time.time()
    cmd = [BLENDER, "-b", "--factory-startup", "-P", script, "--"] + [str(a) for a in args]
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    log.write(f"===== {step}: {' '.join(cmd)}\n{p.stdout}\n{p.stderr}\n")
    line = next((ln for ln in reversed(p.stdout.splitlines()) if ln.startswith("{")), None)
    return {"step": step, "exit": p.returncode, "seconds": round(time.time() - t0, 2), "summary": json.loads(line) if line else None}


def expected_skeleton():
    """The legacy skeleton computed in rigkit-env: S_legacy_D01 + D01 landmarks + the family's legacy pre-bend, no roll flip (the
    in-process regression asserts there is none), as JSON."""
    from rigcore import landmarks as rl
    from rigkit import skeleton

    skel, _, _ = skeleton.resolve_skeleton("S_legacy_D01", rl.from_d01_landmarks(LANDMARKS), 0.5)
    return json.loads(json.dumps(skeleton.apply_flips(skel, [])))


def drive(out):
    from rigcore import npzio, recipe

    out = prepare_out(out)
    rk = os.path.join(SCRIPTS, "rigkit")
    blend = os.path.join(out, "D01_hodling_rig.blend")
    checks = os.path.join(out, "checks")
    g2 = os.path.join(out, "g2")
    steps = []
    with open(os.path.join(out, "cli_chain.log"), "w", encoding="utf-8") as log:
        plan = [
            ("G2 reference", os.path.join(HERE, "A1_g2_reference.py"), ["--out", g2]),
            ("S0+S2 intake", os.path.join(rk, "intake.py"), ["--glb", GLB, "--asset-id", "D01_hodling", "--H", "0.5", "--out-dir", out,
                                                             "--sha256", GLB_SHA256, "--family", "S_legacy_D01"]),
            ("S4 skeleton", os.path.join(rk, "skeleton.py"), ["--blend", blend, "--landmarks", LANDMARKS, "--family", "S_legacy_D01"]),
            ("weights (test only)", os.path.abspath(__file__), ["--apply-weights", blend, os.path.join(g2, "g2_weights.npz")]),
            ("S5 control", os.path.join(rk, "control.py"), ["--blend", blend]),
            ("S5 functest", os.path.join(rk, "functest.py"), ["--blend", blend, "--mode", "mesh", "--out", os.path.join(checks, "rig_function.json")]),
            ("S8 export+validate", os.path.join(rk, "export.py"), ["--blend", blend, "--source-glb", GLB, "--H", "0.5", "--out-dir", checks,
                                                                  "--skeleton", os.path.join(out, "skeleton.json"), "--asset-id", "D01_hodling",
                                                                  "--glb-name", "D01_hodling_runtime_check.glb"]),
        ]
        for step, script, args in plan:
            r = _run(step, script, args, log)
            steps.append(r)
            if r["exit"] != 0:
                break
    R = {"test": "A1_test_cli_chain", "out": out, "steps": steps}
    acc = {"all_steps_exit_0": len(steps) == len(plan) and all(s["exit"] == 0 for s in steps)}
    if acc["all_steps_exit_0"]:
        val = npzio.read_json(os.path.join(checks, "validation.json"))
        fun = npzio.read_json(os.path.join(checks, "rig_function.json"))
        s5 = npzio.read_json(os.path.join(out, "s5_report.json"))
        rec = recipe.load_recipe(os.path.join(out, "rig_recipe.json"))
        d01 = npzio.read_json(D01_VALIDATION)
        acc["A1_14_of_14"] = val["A1_summary"]["passed"] == 14 == val["A1_summary"]["checks"]
        acc["extra_5_of_5"] = val["extra_summary"]["passed"] == 5 == val["extra_summary"]["checks"] and not val["errors"]
        acc["glb_identical_to_d01"] = val["inputs"]["test_glb_sha256"] == d01["inputs"]["runtime_check_glb_sha256"]
        acc["functest_20_of_20"] = fun["passed"] == 20 == fun["total"] and fun["extra_passed"] == fun["extra_total"]
        acc["recipe_steps"] = [s["step"] for s in rec["steps"]] == ["S0", "S2", "S4.prebend", "S4", "S5", "S5.functest", "S8"]
        acc["skeleton_equals_expected"] = npzio.read_json(os.path.join(out, "skeleton.json")) == expected_skeleton()
        acc["s5_builder_from_skeleton"] = s5["builder_source"]["source"] == "skeleton" and s5["builder_source"]["warning"] is None
        acc["pole_angles_minus_90"] = all(abs(v["angle_deg"] + 90.0) < 1e-9 for v in s5["pole_angles"].values()) and len(s5["pole_angles"]) == 4
        R["validation"] = {"A1": val["A1_summary"], "extra": val["extra_summary"], "glb_sha256": val["inputs"]["test_glb_sha256"]}
        R["functest"] = {"passed": fun["passed"], "total": fun["total"], "extra": f"{fun['extra_passed']}/{fun['extra_total']}"}
        R["recipe_steps"] = [s["step"] for s in rec["steps"]]
        R["s5_builder_source"] = s5["builder_source"]
    R["acceptance"] = acc
    R["ok"] = all(acc.values())
    npzio.write_json(os.path.join(out, "cli_chain.json"), R)
    return R


def main():
    import argparse

    if "--" in sys.argv and "--apply-weights" in sys.argv:  # inside Blender
        argv = sys.argv[sys.argv.index("--") + 1:]
        i = argv.index("--apply-weights")
        try:
            return _apply_weights_in_blender(argv[i + 1], argv[i + 2])
        except Exception:  # Blender would exit 0 after an uncaught script error
            import traceback

            traceback.print_exc()
            return 1
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"output folder inside {SCRATCH_ROOT} (cleared at the start; see the docstring)")
    a = ap.parse_args()
    R = drive(a.out)
    print(json.dumps({"test": R["test"], "ok": R["ok"], "acceptance": R["acceptance"],
                      "seconds": {s["step"]: s["seconds"] for s in R["steps"]}, "out": R["out"]}))
    return 0 if R["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())

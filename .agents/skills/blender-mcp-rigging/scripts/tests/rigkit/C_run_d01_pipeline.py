r"""Owner C: end-to-end run of the S7/S8 QA tools on D01 (Blender headless + rigkit-env) and on A1's humanoid_v1 S-template rig.

Steps (outputs under ``--out``, default E:\tmp_rigkit\C_r3; ashlar/ stays read-only):
  copy the G2 rig + QA-pose blends to <out>/src and check both copies (and the sources) against their pinned sha256
  -> D01 legacy: rigkit.poses (legacy_d01: the 17 QA Actions) -> rigid candidate (argmax one-hot of the emulated weights, the
     review r1 probe) -> solvers.metrics --legacy-d01 --candidate rigid -> rigkit.parity + solvers.parity_cmp -> rigkit.render
     (one shot, every sheet incl. the flag sheet) + compose
  -> D01 ROM (family S, generic path, incl. the toe / ear entries of fix round 3): rigkit.poses -> rigid candidate -> metrics
     --candidate rigid; metrics again with --ball-factor 2 (the review r1 probe radius, diagnostic only) -> rigkit.render CHUNKED
     (plan + chunks + finish: the MCP path; flags + close-ups) + compose
  -> skin-selection scores for B (fix round 3, item 4): the legacy and ROM pose sets joined (``combine_poses``: legacy names get
     the prefix ``d01_``, one rest pose) -> metrics with the G2 runtime weights (primary), ``--candidate rigid=`` and
     ``--candidate-file`` for B's newest acc_{A,B,C}.npz (keys = their meta.candidate) -> <out>/d01/candidates/{region_scores.json,
     region_scores_detail.json, regions.npz, metrics.json, inputs.json}
  -> S template: A1's tests/rigkit/A1_test_s_template.py builds D01S_rig.blend (G2 weights remapped by name, TEST ONLY) ->
     rigkit.poses (rom, family S) -> metrics -> rigkit.render (skeleton, weights, a few poses, flags) + compose
  -> Blender tests C_test_poses_emulation / C_test_parity_adversarial / C_test_render_chunks / C_test_flag_tiles -> pytest on C's
     test files (C_PYTEST; C_d01_acceptance_test reads the default --out).
Writes <out>/pipeline_summary.json and prints one JSON line; exit code 1 when a step fails.

Run (rigkit-env):  E:\tools\rigkit-env\Scripts\python.exe -I C_run_d01_pipeline.py [--out DIR] [--skip-render] [--skip-s-template]
                   [--skip-candidates] [--b-dir DIR (folder with d01\acc_A/B/C.npz; default: the newest of B_ROOTS)]
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
SKILL = os.path.dirname(SCRIPTS)
REPO = os.path.normpath(os.path.join(SKILL, "..", "..", ".."))
sys.path.insert(0, SCRIPTS)
BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
PY = sys.executable
DEFAULT_OUT = r"E:\tmp_rigkit\C_r3"
B_ROOTS = (r"E:\tmp_rigkit\I2\B", r"E:\tmp_rigkit\B_r3", r"E:\tmp_rigkit\B_r2", r"E:\tmp_rigkit\B")  # B's <root>\d01\acc_*.npz
D01 = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling", "rig")
G2 = os.path.join(D01, "_snapshots", "g2_approved", "D01_hodling_rig_g2.blend")
G2_SHA = "bf6c53dc783842774b6c75b2f35eb708bbbbe47cee0139e560c97efa97bc0bcb"  # _snapshots/g2_approved/PROVENANCE.md
QA = os.path.join(D01, "qa", "D01_hodling_qa_poses.blend")
QA_SHA = "8eb8b26694c7d5c6ad4a276bc8db26a4fa5aa3cb2a9b06a3fc5f18c8445cd3c6"  # D01 v4 QA poses (measured 2026-10-23)
OBJ = ["--mesh", "D01_hodling", "--runtime", "D01_runtime"]
EXEMPT = "loincloth_front,L_ear,R_ear"
#: writer C's pytest files, named explicitly: another owner's file that fails to import must not stop C's tests from collecting
C_PYTEST = ["scripts/tests/solvers/C_metrics_test.py", "scripts/tests/solvers/C_parity_cmp_test.py",
            "scripts/tests/solvers/C_d01_acceptance_test.py", "scripts/tests/rigkit/C_poses_plan_test.py",
            "scripts/tests/rigkit/C_flag_tiles_plan_test.py"]
S_OBJ = ["--mesh", "D01S", "--runtime", "D01S_runtime", "--control", "D01S_control", "--asset-id", "D01S", "--H", "0.5"]


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for c in iter(lambda: f.read(1 << 20), b""):
            h.update(c)
    return h.hexdigest()


def last_json(text):
    for line in reversed(text.splitlines()):
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                return json.loads(line)
            except ValueError:
                continue
    return None


def run(name, cmd, log_dir, steps, timeout=1800, cwd=None):
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout, cwd=cwd)
    with open(os.path.join(log_dir, f"{name}.log"), "w", encoding="utf-8", newline="\n") as f:
        f.write(" ".join(cmd) + "\n\n" + p.stdout + "\n--- stderr ---\n" + p.stderr)
    res = last_json(p.stdout)
    ok = p.returncode == 0 and (res is None or res.get("ok", True) is not False)
    steps[name] = {"ok": ok, "exit": p.returncode, "seconds": round(time.time() - t0, 1), "result": res}
    if not ok:
        raise RuntimeError(f"step {name} failed (exit {p.returncode}); see {log_dir}\\{name}.log")
    return res


def blender(script, *args):
    return [BLENDER, "-b", "--factory-startup", "-P", os.path.join(SCRIPTS, script), "--", *args]


def metrics_cmd(d, out_name="metrics", *more):
    return [PY, "-I", "-B", os.path.join(SCRIPTS, "solvers", "metrics.py"), "--mesh", os.path.join(d, "mesh.npz"), "--poses",
            os.path.join(d, "poses.npz"), "--weights", os.path.join(d, "weights.npz"), "--out-dir", os.path.join(d, out_name),
            "--exempt-heads", EXEMPT, *more]


def rigid_candidate(d):
    """The review r1 probe's rigid candidate: argmax one-hot of the emulated weights (weights.npz of a poses run)."""
    import numpy as np
    from rigcore import npzio

    w = npzio.load_weights(os.path.join(d, "weights.npz"))
    W = np.asarray(w["W"])
    R = np.zeros_like(W)
    R[np.arange(len(W)), W.argmax(1)] = 1.0
    return npzio.save_weights(os.path.join(d, "rigid.npz"), [str(b) for b in w["bones"]], R.astype(np.float32),
                              meta={"candidate": "rigid", "params": {"rule": "argmax one-hot of weights.npz"}})


def compose_cmd(rd, d, metrics_dir="metrics"):
    return [PY, "-I", "-B", os.path.join(SCRIPTS, "rigkit", "render.py"), "compose", "--out-dir", rd, "--poses", os.path.join(d, "poses.npz"),
            "--metrics", os.path.join(d, metrics_dir, "metrics.json")]


def render_args(d, rd, metrics_dir="metrics"):
    return ["--poses", os.path.join(d, "poses.npz"), "--fields", os.path.join(d, metrics_dir, "vertex_fields.npz"), "--metrics",
            os.path.join(d, metrics_dir, "metrics.json"), "--out-dir", rd]


def fresh(d):
    if os.path.isdir(d):
        shutil.rmtree(d)
    os.makedirs(d)
    return d


def b_candidates(b_dir=None) -> list:
    """Writer B's D01 candidate files acc_{A,B,C}.npz: from ``b_dir`` (its d01 folder), else the B_ROOTS folder whose files are
    newest. Returns [] when none is complete."""
    roots = [b_dir] if b_dir else B_ROOTS
    best = None
    for root in roots:
        fs = [os.path.join(root, "d01", f"acc_{c}.npz") for c in "ABC"]
        if all(os.path.isfile(f) for f in fs):
            t = max(os.path.getmtime(f) for f in fs)
            if best is None or t > best[0]:
                best = (t, fs)
    return best[1] if best else []


def combine_poses(sets, out_path) -> dict:
    """Join pose files of the SAME rig (vertex count, bones, rest matrices) into one poses.npz: ``sets`` = [(prefix, path)]; the
    first rest pose is kept (later ones must agree within 1e-6 m and are dropped), every other name gets its set's prefix. For
    skin selection over several pose sets (the specs of Action poses need their Actions blend to be rendered again)."""
    import numpy as np
    from rigcore import npzio

    parts = [(pfx, npzio.load_poses(p)) for pfx, p in sets]
    p0 = parts[0][1]
    b0 = p0["bone_names"].tolist()
    names, P, Hh, Tt, Ms, tags, specs, rest = [], [], [], [], [], {}, {}, None
    for pfx, po in parts:
        if po["bone_names"].tolist() != b0 or po["P"].shape[1] != p0["P"].shape[1]:
            raise ValueError("combine_poses: the pose sets disagree on bones or vertex count")
        if float(np.abs(po["extra"]["rest_mats"] - p0["extra"]["rest_mats"]).max()) > 1e-6:
            raise ValueError("combine_poses: the pose sets disagree on the rest matrices")
        for i, n in enumerate(str(x) for x in po["names"]):
            if n == "rest":
                if rest is not None:
                    dev = float(np.abs(po["P"][i] - rest).max())
                    if dev > 1e-6:
                        raise ValueError(f"combine_poses: rest poses differ by {dev:.3g} m")
                    continue
                rest, new = po["P"][i], "rest"
            else:
                new = pfx + n
            if new in names:
                raise ValueError(f"combine_poses: pose name {new!r} twice")
            names.append(new)
            P.append(po["P"][i])
            Hh.append(po["heads"][i])
            Tt.append(po["tails"][i])
            Ms.append(po["extra"]["pose_mats"][i])
            tags[new] = list(po["meta"].get("tags", {}).get(n, []))
            specs[new] = dict(po["meta"].get("specs", {}).get(n, {}), name=new)
    meta = {k: v for k, v in p0["meta"].items() if k not in ("tags", "specs", "plan", "signs", "emulation")}
    meta.update(set="+".join(po["meta"].get("set", "?") for _, po in parts), tags=tags, specs=specs, rest_index=names.index("rest"),
                combined_from=[{"prefix": pfx, "poses": os.path.abspath(p)} for pfx, p in sets])
    npzio.save_poses(out_path, names, np.array(P), b0, np.array(Hh), np.array(Tt), meta=meta,
                     extra={"pose_mats": np.array(Ms), "rest_mats": p0["extra"]["rest_mats"], "parents": p0["extra"]["parents"],
                            "deform": p0["extra"]["deform"]})
    return {"poses": out_path, "n_poses": len(names), "sets": [s for s, _ in sets]}


def score_candidates(b_dir, root, leg, rom, logs, steps):
    """Item 4 of fix round 3: region scores of writer B's candidates (see the module docstring)."""
    bfiles = b_candidates(b_dir)
    if not bfiles:
        raise RuntimeError(f"no complete set of writer B's acc_{{A,B,C}}.npz under {b_dir or B_ROOTS}")
    cd = fresh(os.path.join(root, "d01", "candidates"))
    comb = combine_poses([("d01_", os.path.join(leg, "poses.npz")), ("", os.path.join(rom, "poses.npz"))],
                         os.path.join(cd, "poses.npz"))
    files = [x for f in bfiles for x in ("--candidate-file", f)]
    run("metrics_candidates", [PY, "-I", "-B", os.path.join(SCRIPTS, "solvers", "metrics.py"), "--mesh", os.path.join(rom, "mesh.npz"),
                               "--poses", comb["poses"], "--weights", os.path.join(rom, "weights.npz"), "--out-dir", cd,
                               "--exempt-heads", EXEMPT, "--no-fields", "--candidate",
                               "rigid=" + os.path.join(rom, "rigid.npz"), *files], logs, steps, timeout=7200)
    from rigcore import npzio

    npzio.write_json(os.path.join(cd, "inputs.json"), {
        "note": "region scores for writer B: keys = each weights file's meta.candidate (primary = the G2 runtime weights, "
                "rigid = argmax one-hot of them); poses = D01 legacy QA set (prefix d01_) + generic ROM incl. toes / ears",
        "poses": comb, "primary": os.path.join(rom, "weights.npz"), "rigid": os.path.join(rom, "rigid.npz"),
        "b_files": [{"path": f, "sha256": sha(f), "mtime": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(f))),
                     "candidate": npzio.load_weights(f)["meta"].get("candidate")} for f in bfiles]})
    steps["metrics_candidates"]["b_files"] = bfiles


def full_run(a, root, leg, rom, logs, src, st, steps):
    """Every step but the summary (see the module docstring)."""
    g2, qa = os.path.join(src, os.path.basename(G2)), os.path.join(src, os.path.basename(QA))
    for s_, d_, want in ((G2, g2, G2_SHA), (QA, qa, QA_SHA)):
        if sha(s_) != want:
            raise RuntimeError(f"source {s_} does not match its pinned sha256 {want}")
        if not os.path.exists(d_) or sha(d_) != want:
            shutil.copy2(s_, d_)
        if sha(d_) != want:
            raise RuntimeError(f"copy {d_} does not match sha256 {want}")
    steps["copy"] = {"ok": True, "g2": g2, "qa_poses": qa, "g2_sha256": G2_SHA, "qa_poses_sha256": QA_SHA}
    # ---------------------------------------------------------------- D01 legacy
    run("poses_legacy", blender("rigkit/poses.py", "--blend", g2, "--set", "legacy_d01", "--actions-blend", qa, "--out-dir", leg,
                                *OBJ, "--control", "D01_control", "--asset-id", "D01_hodling", "--H", "0.5"), logs, steps)
    rigid_candidate(leg)
    run("metrics_legacy", metrics_cmd(leg, "metrics", "--legacy-d01", "--candidate", "rigid=" + os.path.join(leg, "rigid.npz")),
        logs, steps)
    par = fresh(os.path.join(leg, "parity"))
    run("parity_blender", blender("rigkit/parity.py", "--blend", g2, "--poses", os.path.join(leg, "poses.npz"), "--out-dir", par,
                                  *OBJ), logs, steps)
    run("parity_cmp", [PY, "-I", "-B", os.path.join(SCRIPTS, "solvers", "parity_cmp.py"), "--poses", os.path.join(leg, "poses.npz"),
                       "--mesh", os.path.join(leg, "mesh.npz"), "--reimport", os.path.join(par, "reimport_poses.npz"),
                       "--out", os.path.join(par, "parity.json")], logs, steps)
    if not a.skip_render:
        rd = fresh(os.path.join(leg, "render"))
        run("render_legacy", blender("rigkit/render.py", "render", "--blend", g2, *render_args(leg, rd)), logs, steps)
        run("compose_legacy", compose_cmd(rd, leg), logs, steps)
    # ---------------------------------------------------------------- D01 ROM (generic path)
    run("poses_rom", blender("rigkit/poses.py", "--blend", g2, "--set", "rom", "--family", "S", "--out-dir", rom, *OBJ,
                             "--control", "D01_control", "--asset-id", "D01_hodling", "--H", "0.5"), logs, steps)
    rigid_candidate(rom)
    run("metrics_rom", metrics_cmd(rom, "metrics", "--candidate", "rigid=" + os.path.join(rom, "rigid.npz")), logs, steps,
        timeout=3600)
    run("metrics_rom_ball2", metrics_cmd(rom, "metrics_ball2", "--ball-factor", "2", "--no-penetration", "--no-fields"), logs,
        steps)
    if not a.skip_render:
        rd = fresh(os.path.join(rom, "render"))
        plan = run("render_rom_plan", blender("rigkit/render.py", "plan", "--blend", g2, *render_args(rom, rd),
                                              "--what", "flags,closeups"), logs, steps)
        times = []
        for i0, i1 in plan["chunks"]:
            r = run(f"render_rom_chunk_{i0:04d}", blender("rigkit/render.py", "chunk", "--blend", g2, "--out-dir", rd,
                                                          "--i0", str(i0), "--i1", str(i1)), logs, steps)
            times.append(r["seconds"])
        run("render_rom_finish", [PY, "-I", "-B", os.path.join(SCRIPTS, "rigkit", "render.py"), "finish", "--out-dir", rd], logs, steps)
        steps["render_rom_finish"]["chunk_seconds"] = times
        with open(os.path.join(rd, "chunk_times.json"), "w", encoding="utf-8", newline="\n") as f:  # read by the acceptance test
            json.dump({"chunks": plan["chunks"], "seconds": times}, f)
        run("compose_rom", compose_cmd(rd, rom), logs, steps)
    if not a.skip_candidates:
        score_candidates(a.b_dir, root, leg, rom, logs, steps)
    # ---------------------------------------------------------------- S template (A1 humanoid_v1)
    if not a.skip_s_template:
        build = os.path.join(st, "build")
        run("s_template_build_A1", blender("tests/rigkit/A1_test_s_template.py", "--out", build), logs, steps, timeout=3600)
        sblend = os.path.join(build, "D01S_rig.blend")
        srun = os.path.join(st, "run")
        os.makedirs(srun, exist_ok=True)
        run("s_poses", blender("rigkit/poses.py", "--blend", sblend, "--set", "rom", "--family", "S", "--out-dir", srun, *S_OBJ),
            logs, steps)
        run("s_metrics", metrics_cmd(srun), logs, steps, timeout=3600)
        if not a.skip_render:
            rd = fresh(os.path.join(srun, "render"))
            run("s_render", blender("rigkit/render.py", "render", "--blend", sblend, *render_args(srun, rd), "--what",
                                    "skel,weights,poses,stretch,flags", "--only",
                                    "rest,forearm_pronation_L_m80,knee_flexion_L_p140,squat,arms_crossed"), logs, steps)
            run("s_compose", compose_cmd(rd, srun), logs, steps)
    # ---------------------------------------------------------------- tests
    if not a.skip_tests:
        tests = os.path.join(root, "tests")
        for t in ("C_test_poses_emulation", "C_test_parity_adversarial", "C_test_render_chunks", "C_test_flag_tiles"):
            run(f"blender_{t}", blender(f"tests/rigkit/{t}.py", "--out", tests), logs, steps)
        p = subprocess.run([PY, "-I", "-B", "-m", "pytest", *C_PYTEST, "-q", "-p", "no:cacheprovider"], cwd=SKILL, capture_output=True,
                           text=True, encoding="utf-8", errors="replace")
        with open(os.path.join(root, "pytest_C.txt"), "w", encoding="utf-8", newline="\n") as f:
            f.write(p.stdout + p.stderr)
        steps["pytest_C"] = {"ok": p.returncode == 0, "exit": p.returncode, "tail": p.stdout.strip().splitlines()[-1:]}


def main(argv=None):
    ap = argparse.ArgumentParser(description="D01 + S-template end-to-end run of writer C's tools")
    ap.add_argument("--out", default=DEFAULT_OUT, help=f"output root (default {DEFAULT_OUT}; C_d01_acceptance_test reads the default)")
    ap.add_argument("--only-candidates", action="store_true",
                    help="only the skin-selection step (needs <out>/d01/legacy and <out>/d01/rom from an earlier run)")
    ap.add_argument("--skip-render", action="store_true")
    ap.add_argument("--skip-s-template", action="store_true")
    ap.add_argument("--skip-tests", action="store_true")
    ap.add_argument("--skip-candidates", action="store_true", help="skip the skin-selection scores of B's candidates")
    ap.add_argument("--b-dir", help="writer B's output folder holding d01\\acc_{A,B,C}.npz (default: the newest of B_ROOTS)")
    a = ap.parse_args(argv)
    root = os.path.abspath(a.out)
    leg, rom = os.path.join(root, "d01", "legacy"), os.path.join(root, "d01", "rom")
    logs, src, st = os.path.join(root, "logs"), os.path.join(root, "src"), os.path.join(root, "s_template")
    for d in (leg, rom, logs, src, st):
        os.makedirs(d, exist_ok=True)
    steps = {}
    t0 = time.time()
    try:
        if a.only_candidates:
            score_candidates(a.b_dir, root, leg, rom, logs, steps)
        else:
            full_run(a, root, leg, rom, logs, src, st, steps)
        ok = all(s["ok"] for s in steps.values())
        err = None
    except Exception as e:
        ok, err = False, f"{type(e).__name__}: {e}"
    summary = {"ok": ok, "error": err, "seconds": round(time.time() - t0, 1), "out_dir": root,
               "steps": {k: {kk: vv for kk, vv in v.items() if kk != "result"} for k, v in steps.items()}}
    name = "pipeline_summary_candidates.json" if a.only_candidates else "pipeline_summary.json"
    with open(os.path.join(root, name), "w", encoding="utf-8", newline="\n") as f:
        json.dump({**summary, "results": {k: v.get("result") for k, v in steps.items()}}, f, indent=1)
    print(json.dumps(summary))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

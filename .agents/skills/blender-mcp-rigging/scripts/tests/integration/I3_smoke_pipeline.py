r"""I3 smoke test of scripts/pipeline.py: S0-S5 on D01 (family S, H 0.5) through the real module CLIs (headless Blender + rigkit-env;
UniRig is read, never run), then the artefacts are checked. About a minute.

    E:\tools\rigkit-env\Scripts\python.exe -I scripts/tests/integration/I3_smoke_pipeline.py [--out E:\tmp_rigkit\I3\smoke]

Phases:
  1. S0-S3 WITHOUT --test-auto-vision: D01's consensus is not ready (vision tiles), so the driver must stop at the vision
     checkpoint with exit code 3, S3 "stopped", VISION_CHECKPOINT.md written and nothing of S4 built;
  2. the same command with --test-auto-vision --until S5 resumes at S3 (no --from) and runs S3-S5, WITHOUT --keep-going: S4's 22
     bend tests all pass (I4: I3 needed --keep-going because source a put head_top on an eye island, 5 cm in front of the pivot,
     and the head bend test was ambiguous, 21/22); the recipe lists no keep-going step;
  3. --from S4 --until S4 re-runs S4 alone: the earlier S4/S5 outputs move to _superseded/, the .blend comes back from the S2
     snapshot, and skeleton.json is byte-identical to the first build;
  4. --from S3 --until S4 --vision-decisions <file> WITHOUT --test-auto-vision: a SCRIPTED decision file (labelled in every
     record: not a vision check) picks each pending landmark's provisional source with the record fields consensus requires
     (inputs = flags.json inputs_sha256 + the tile's choices, gates_overridden = the tile's required_overrides). The driver must
     copy it into the rig folder and pass it to consensus; every decision is applied, ready_for_user turns true, S3 finishes
     without the TEST flag and the recipe names the decision file. This exercises the plumbing only.
Checks: exit codes; step states; session.json, analysis.json, intake.json, landmarks.json + flags.json, skeleton.json
(36 bones = 28 core + 8 sockets, incl. clavicles and twist bones), s4/s5 reports (pole angles, coupling), rig_function.json
(all base and extra tests pass in bones mode), snapshots after S2/S4/S5, rig_recipe.json (S0..S5 entries in order,
pipeline.<step> timings, TEST flag), and pipeline_state.json runs. One JSON line; exit 1 on failure.

The output folder is cleared first, but only when it lies inside E:\tmp_rigkit and carries the driver marker (.rigkit_pipeline).
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
REPO = os.path.normpath(os.path.join(SCRIPTS, "..", "..", "..", ".."))
GLB = os.path.join(REPO, "ashlar", "3d", "monsters", "D01_hodling", "D01_hodling.glb")
GLB_SHA256 = "bf22ccea25b72a879048fe3d0bf4ecf92b551984b85081ae97e3bea56f3d8c5a"
SCRATCH = r"E:\tmp_rigkit"
DEFAULT_OUT = r"E:\tmp_rigkit\I3\smoke"
MARKER = ".rigkit_pipeline"
sys.dont_write_bytecode = True


def _inside(path, root) -> bool:
    p, r = (os.path.normcase(os.path.realpath(os.path.abspath(x))) for x in (path, root))
    try:
        return p != r and os.path.commonpath([p, r]) == r
    except ValueError:
        return False


def prepare(out):
    real = os.path.realpath(os.path.abspath(out))
    if not _inside(real, SCRATCH):
        raise RuntimeError(f"refusing to clear {out!r}: not inside {SCRATCH}")
    if os.path.exists(real):
        if os.listdir(real) and not os.path.isfile(os.path.join(real, MARKER)):
            raise RuntimeError(f"refusing to clear {out!r}: no {MARKER} marker (the driver did not create it)")
        shutil.rmtree(real)
    return real


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def pipeline(out, *extra, log):
    cmd = [sys.executable, "-I", "-B", os.path.join(SCRIPTS, "pipeline.py"), "--asset", "D01_hodling", "--glb", GLB, "--family", "S",
           "--height", "0.5", "--sha256", GLB_SHA256, "--out", out, *extra]
    t0 = time.time()
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=SCRIPTS)
    log.write(f"===== {' '.join(cmd)}\nexit {p.returncode}\n{p.stdout}\n{p.stderr}\n")
    last = next((json.loads(ln) for ln in reversed(p.stdout.splitlines()) if ln.startswith("{")), None)
    return {"exit": p.returncode, "seconds": round(time.time() - t0, 1), "summary": last}


def scripted_decisions(out, path) -> int:
    """SCRIPTED decision records (NOT a vision check) for every pending landmark of flags.json: the provisional source, with the
    fields consensus.validate_vision_record requires. Returns the number of records."""
    fl = rd(out, "flags.json")
    sha_in = fl.get("inputs_sha256") or {}
    ev = {"path": os.path.join(out, "flags.json"), "view": "front", "sha256": sha(os.path.join(out, "flags.json"))}
    dec = {}
    for t in fl.get("tiles", []):
        for lid in t.get("ids", []):
            if (t.get("status_by_id") or {}).get(lid, t.get("status")) != "pending":
                continue
            src = (t.get("provisional_source") or {}).get(lid)
            choices = (t.get("choices") or {}).get(lid) or {}
            ch = src if src in choices else ("escalate" if "escalate" in choices else next(iter(choices)))
            dec[lid] = {"choice": ch, "reason": "SCRIPTED SMOKE TEST - not a vision check: exercises the --vision-decisions plumbing",
                        "evidence": [ev], "inputs": {"landmarks_a": sha_in.get("landmarks_a"), "landmarks_d": sha_in.get("landmarks_d"),
                                                     "mesh": sha_in.get("mesh"), "chosen_pos": choices[ch]},
                        "gates_overridden": list(((t.get("required_overrides") or {}).get(lid) or {}).get(ch) or []),
                        "reviewer": {"model": "scripted-smoke-test (not a vision check)", "date": time.strftime("%Y-%m-%d"),
                                     "confidence": 0.1}}
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"note": "SCRIPTED SMOKE TEST - not a vision check", "decisions": dec}, f, indent=1)
    return len(dec)


def rd(out, *rel):
    with open(os.path.join(out, *rel), "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args(argv)
    out = prepare(a.out)
    acc, R = {}, {"test": "I3_smoke_pipeline", "out": out}
    os.makedirs(os.path.dirname(out), exist_ok=True)
    logp = out + "_smoke.log"
    with open(logp, "w", encoding="utf-8") as log:
        r1 = pipeline(out, "--until", "S3", log=log)
        st = rd(out, "pipeline_state.json")
        acc["vision_stop_exit_3"] = r1["exit"] == 3 and st["steps"]["S3"]["status"] == "stopped"
        acc["vision_checkpoint_note"] = os.path.isfile(os.path.join(out, "VISION_CHECKPOINT.md"))
        acc["nothing_after_S3"] = not os.path.exists(os.path.join(out, "skeleton.json")) and st["steps"]["S4"]["status"] == "pending"
        r2 = pipeline(out, "--until", "S5", "--test-auto-vision", log=log)
        st = rd(out, "pipeline_state.json")
        acc["resume_at_S3_exit_0"] = r2["exit"] == 0 and st["runs"][-1]["from"] == "S3"
        acc["steps_S0_S5_done"] = all(st["steps"][s]["status"] == "done" for s in ("S0", "S1", "S2", "S3", "S4", "S5"))
        acc["test_flag_in_state"] = st["test_auto_vision"] is True
        acc["test_only_marker"] = os.path.isfile(os.path.join(out, "TEST_ONLY.md"))
        for f in ("session.json", "analysis.json", "intake.json", "landmarks.json", "flags.json", "skeleton.json", "s4_report.json",
                  "s5_report.json", "D01_hodling_rig.blend", "rig_recipe.json", "_work/mesh.npz", "checks/rig_function.json"):
            acc[f"file:{f}"] = os.path.isfile(os.path.join(out, *f.split("/")))
        sess = rd(out, "session.json")
        acc["session_sha256"] = sess["glb"]["sha256"] == GLB_SHA256 and sess["unirig"]["present"]
        s4r = rd(out, "s4_report.json")
        s4 = s4r["build"]
        rb = (s4r.get("chains") or {}).get("root_bend_tests") or []  # G3: S3g chain roots carry their own bend test
        acc["S4_bend_tests_22_of_22"] = (s4["bend_tests_passed"] == s4["bend_tests_total"]
                                         and s4["bend_tests_total"] - len(rb) == 22)  # I4: no --keep-going on D01 (22 core tests)
        sk = rd(out, "skeleton.json")
        names = {b["name"] for b in sk["bones"]}
        acc["skeleton_36_bones_clavicle_twist"] = (len([b for b in sk["bones"] if not b.get("chain")]) == 36  # + S3g chain bones (G3)
                                                   and {"L_Clavicle", "R_UpperArm_twist", "L_ForeArm_twist"} <= names)
        s5 = rd(out, "s5_report.json")
        acc["poles_converged"] = len(s5["pole_angles"]) == 4 and all(v["dev_rad"] < 1e-4 for v in s5["pole_angles"].values())
        fun = rd(out, "checks", "rig_function.json")
        acc["functest_all_pass"] = fun["passed"] == fun["total"] and fun["extra_passed"] == fun["extra_total"] and fun["total"] > 0
        acc["snapshots"] = all(os.path.isfile(os.path.join(out, "_snapshots", s, "D01_hodling_rig.blend")) for s in ("S2", "S4", "S5"))
        rec = rd(out, "rig_recipe.json")
        steps = [s["step"] for s in rec["steps"]]
        want = ["S0.session", "pipeline.S0", "S1", "pipeline.S1", "S0", "S2", "pipeline.S2", "S3", "pipeline.S3", "S3g", "pipeline.S3g",
                "S4.prebend", "S4",
                "pipeline.S4", "S5", "S5.functest", "pipeline.S5"]
        acc["recipe_step_log"] = steps == want
        acc["recipe_timings"] = all(isinstance(s["outputs"].get("seconds"), (int, float)) for s in rec["steps"]
                                    if s["step"].startswith("pipeline."))
        acc["recipe_test_flag"] = rec["pipeline"]["test_auto_vision"] is True and rec["landmarks"]["test_auto_vision"] is not None
        acc["recipe_no_keep_going"] = rec["pipeline"]["keep_going_steps"] == []
        sk_sha = sha(os.path.join(out, "skeleton.json"))
        r3 = pipeline(out, "--from", "S4", "--until", "S4", "--test-auto-vision", log=log)
        st = rd(out, "pipeline_state.json")
        sup = st["runs"][-1].get("superseded")
        acc["rerun_S4_exit_0"] = r3["exit"] == 0 and st["steps"]["S4"]["status"] == "done" and st["steps"]["S5"]["status"] == "pending"
        acc["rerun_superseded"] = bool(sup) and os.path.isfile(os.path.join(sup, "skeleton.json")) and \
            os.path.isfile(os.path.join(sup, "s5_report.json"))
        acc["rerun_restored_from_S2"] = (st["runs"][-1].get("restored") or {}).get("blend_from", "").endswith(
            os.path.join("S2", "D01_hodling_rig.blend"))
        acc["rerun_skeleton_identical"] = sha(os.path.join(out, "skeleton.json")) == sk_sha
        vpath = out + "_vision_decisions_SCRIPTED.json"
        n_dec = scripted_decisions(out, vpath)
        r4 = pipeline(out, "--from", "S3", "--until", "S4", "--vision-decisions", vpath, log=log)
        st = rd(out, "pipeline_state.json")
        fl = rd(out, "flags.json")
        rec = rd(out, "rig_recipe.json")
        acc["vision_resume_exit_0"] = r4["exit"] == 0 and st["steps"]["S3"]["status"] == "done" and st["steps"]["S4"]["status"] == "done"
        vcopy = os.path.join(out, "vision_decisions.json")
        acc["vision_file_copied"] = os.path.isfile(vcopy) and sha(vcopy) == sha(vpath)
        vis = fl.get("vision") or {}
        acc["vision_all_applied"] = n_dec > 0 and len(vis.get("applied") or []) == n_dec and not vis.get("rejected")
        acc["vision_ready_for_user"] = fl.get("ready_for_user") is True
        acc["vision_clears_test_flag"] = st["test_auto_vision"] is False and rec["pipeline"]["test_auto_vision"] is False and \
            not os.path.isfile(os.path.join(out, "TEST_ONLY.md"))
        acc["vision_in_recipe"] = (rec["landmarks"].get("sources") or {}).get("vision_decisions") == vcopy
    R.update(runs=[r1, r2, r3, r4], acceptance=acc, ok=all(acc.values()), log=logp)
    with open(os.path.join(out, "smoke.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(R, f, indent=1)
    print(json.dumps({"test": R["test"], "ok": R["ok"], "failed": [k for k, v in acc.items() if not v],
                      "seconds": [r["seconds"] for r in (r1, r2, r3, r4)], "out": out}))
    return 0 if R["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())

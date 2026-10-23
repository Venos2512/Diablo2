r"""scripts/pipeline.py - end-to-end driver of the skill procedure S0-S9 (SKILL.md "Procedure") on one asset: GLB in, rig .blend,
weights, QA evidence and a draft qa_report.md out, stopping at the planned stop points (owner I3, P3 integration).

Run in rigkit-env (it starts Blender headless itself; every step calls the modules' own CLIs, one log per call)::

    E:\tools\rigkit-env\Scripts\python.exe -I -B scripts/pipeline.py --asset D01_hodling --glb <asset>.glb --family S --height 0.5
        --out E:\tmp_rigkit\I3\D01_S [--from S4] [--until S5] [--vision-decisions vision_decisions.json] [--test-auto-vision]

Steps (details in pipeline_steps/steps.py; per-step outputs and the output layout in pipeline_steps/runner.py):

    S0 open        GLB sha256 (+ --sha256), inventory, git stamp/status, UniRig output present, Blender version -> session.json
    S1 analyse     solvers/glbmesh.py + solvers/analysis.py -> analysis.json; STOP (exit 5) on stop flags
    S2 normalize   rigkit/intake.py -> <asset>_rig.blend, _work/mesh.npz, rig_recipe.json (S0/S1 records added)
    S3 landmarks   solvers/landmarks_geo.py (a) + solvers/unirig_bridge.py read (d) + solvers/consensus.py (+ vision decisions)
                   -> landmarks.json, flags.json; VISION CHECKPOINT (exit 3) while flags.json says ready_for_user false
    S3g garments   solvers/garments.py (long clothing / hanging items -> garments.json/.npz) + solvers/chains.py (chain plan ->
                   chains.json with spring hints); --garments overrides the plan; a no-op for the legacy family S_legacy_D01
    S4 skeleton    rigkit/skeleton.py (pre-bend, resolve, build, bend tests; --chains merges the S3g chain bones)
    S5 control     rigkit/control.py (+ chain FK controls and leg push) + rigkit/functest.py
    S6 skin        candidates A (solvers/skin_region.py; generic rules, D01 legacy rules only for S_legacy_D01), B
                   (skin_transfer.py), C (skin_unirig.py, filled from B) on the body skeleton (no chain bones); with chains the
                   garment overlay (solvers/skin_garment.py)
    S7 select      poses (A on a copy of the rig; body ROM set) -> metrics with every candidate (garment rows left out of the
                   region scores) -> skin_select -> finish -> garment overlay blended + finished (skin_garment apply_overlay) ->
                   final weights into the rig -> poses (+ garment compounds and chain poses) + metrics (+ garment metrics)
    S8 export      rigkit/export.py (test GLB, A1.1-A1.14) + rigkit/parity.py + solvers/parity_cmp.py
    S9 package     rigkit/render.py (chunked: QA sheets + flag sheet) + qa_report.md (draft) + validation.json + final recipe

Resume: ``pipeline_state.json`` records every step. Without ``--from`` a run starts at the first step that is not done (after a
vision checkpoint: S3); ``--from Sx`` re-runs Sx and later steps. Outputs of the re-run steps move to ``_superseded/`` first, and
the rig .blend / rig_recipe.json come back from ``_snapshots/`` (taken after S2, S4, S5, S7; the recipe after every step from S2).

Stale inputs (review M3): before a step runs, its input fingerprint goes into the state and the recipe (``pipeline_steps/inputs.py``:
the arguments it depends on, the sha256 of its input files - GLB, UniRig output, skin rules, vision decisions, override files,
family JSONs - and of every script it runs, plus its driver code). A run never builds on a done step whose fingerprint changed: it
REFUSES with exit 1, lists what changed per step and names the ``--from`` to use (the first stale step). Nothing is re-run
automatically: pass the same inputs again, or ``--from <step>`` to rebuild with the new ones. A state written before I5 has no
fingerprints, so every resume of such a folder is refused until ``--from S0`` (or a new folder). Every run's ``argv`` is kept in
the state and in the recipe (``pipeline.runs``).

Phase G: S3g (between S3 and S4) plans the garment chains; ``--garments <json>`` overrides the plan and is an S3g input (a
changed file refuses a resume after S3g and names ``--from S3g``).

TEST ONLY flags: ``--test-auto-vision`` accepts the provisional positions of flagged landmarks instead of stopping at the vision
checkpoint; ``--keep-going`` continues past failed S4/S5 rig checks (never past a crash). When one of them was used, the state keeps
it (``test_auto_vision``; ``test_keep_going`` = {step: what was continued}) and every later run of the folder marks its outputs:
``TEST_ONLY.md`` in the rig folder and in ``qa/``, the ``qa_report.md`` banner, the recipe ``pipeline`` block, a TEST line on
stdout and ``test_auto_vision`` / ``test_keep_going`` / ``test_only`` in the JSON summary. A flag clears only when the steps that
used it re-run without it (S3 for ``--test-auto-vision``; ``--from <first bypassed step>`` for ``--keep-going``).

Exit codes: 0 done (or nothing left to do), 1 a step failed (step name + log path printed) or the resume was refused because inputs
changed (the ``--from`` to use is printed), 2 usage, 3 vision checkpoint, 4 prerequisite missing (UniRig output: run
``solvers/unirig_bridge.py run`` in a rig session), 5 the input blocks the rig. The last stdout line is one JSON summary.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import traceback

if __name__ == "__main__":
    sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rigcore import recipe as rrecipe  # noqa: E402

from pipeline_steps import inputs as I  # noqa: E402
from pipeline_steps import report  # noqa: E402
from pipeline_steps import runner as R  # noqa: E402
from pipeline_steps import steps as S  # noqa: E402

WHAT_DEFAULT = "skel,weights,bones,poses,stretch,pen,closeups,flags"


def parse_args(argv=None):
    ap = argparse.ArgumentParser(description="End-to-end rig driver S0-S9 (blender-mcp-rigging skill)",
                                 formatter_class=argparse.RawDescriptionHelpFormatter,
                                 epilog="exit codes: 0 done, 1 step failed, 2 usage, 3 vision checkpoint, 4 prerequisite missing, "
                                        "5 input blocks the rig")
    ap.add_argument("--asset", required=True, help="asset id (mesh object name; UniRig output folder name)")
    ap.add_argument("--glb", required=True, help="source GLB (read only)")
    ap.add_argument("--family", required=True, help="family template: H, S (or S_legacy_D01 / a path)")
    ap.add_argument("--height", type=float, required=True, help="catalogue height H in metres")
    ap.add_argument("--out", required=True, help="rig folder (scratch while testing)")
    ap.add_argument("--from", dest="from_step", default=None, help="re-run from this step (S0..S9)")
    ap.add_argument("--until", default=None, help="stop after this step (S0..S9)")
    ap.add_argument("--vision-decisions", default=None, help="vision_decisions.json of the Opus vision check (copied into --out)")
    ap.add_argument("--test-auto-vision", action="store_true",
                    help="TEST ONLY: accept the provisional positions of flagged landmarks instead of stopping at S3")
    ap.add_argument("--keep-going", action="store_true", help="TEST ONLY: continue past failed S4/S5 rig checks")
    ap.add_argument("--sha256", default=None, help="expected sha256 of the GLB")
    ap.add_argument("--requires-fingers", action="store_true", help="the brief needs finger bones (S1: fused fingers stop)")
    ap.add_argument("--prebend", default=None, help="JSON merged over the S4 pre-bend parameters")
    ap.add_argument("--skin-rules", default=None, help="asset skin_rules.json (default: generic; D01 legacy rules for S_legacy_D01)")
    ap.add_argument("--garments", default=None, help="S3g override of the garment plan (references/cloth-and-attachments.md §7: "
                                                     "classes, chains, bones, merges, disables, aux_budget); fingerprinted")
    ap.add_argument("--render-what", default=WHAT_DEFAULT, help=f"S9 shot kinds (default {WHAT_DEFAULT})")
    ap.add_argument("--blender", default=None, help=f"Blender executable (default {R.BLENDER})")
    ap.add_argument("--unirig-out", default=None, help=f"UniRig output root (default {R.UNIRIG_OUT})")
    ap.add_argument("--tmp-dir", default=None, help=f"TEMP/TMP root of the subprocesses (default {R.TMP_ROOT})")
    ap.add_argument("--allow-existing", action="store_true", help="use an existing non-empty --out folder that has no driver marker")
    a = ap.parse_args(argv)
    for k in ("from_step", "until"):
        v = getattr(a, k)
        if v is not None:
            try:
                setattr(a, k, R.STEPS[R.step_index(v)])
            except ValueError as e:
                ap.error(str(e))
    if a.height <= 0:
        ap.error("--height must be positive (metres)")
    return a


def prepare_out(out: str, allow_existing: bool) -> None:
    """Create the output folder with the driver marker; refuse a non-empty folder the driver did not create."""
    marker = os.path.join(out, R.MARKER)
    if not os.path.isdir(out):
        os.makedirs(out)
    elif not os.path.isfile(marker):
        if os.listdir(out) and not allow_existing:
            raise ValueError(f"{out} is not empty and has no {R.MARKER} marker: pass --allow-existing to use it, or pick a new folder")
    if not os.path.isfile(marker):
        with open(marker, "w", encoding="utf-8", newline="\n") as f:
            f.write("made by scripts/pipeline.py (blender-mcp-rigging); pipeline_state.json holds the step log\n")


def resolve_range(state: dict, a, stale: dict | None = None) -> tuple[int | None, int, str | None]:
    """(first step index to run or None, last step index, note). Without --from: the first step not done. ``stale`` = {step: [what
    changed]} of the done steps whose input fingerprint differs from the current one (``steps.stale_steps``): the run never builds on
    such a step, it raises ``runner.StaleInputs`` (exit 1) naming the ``--from`` to use (review M3)."""
    stale = stale or {}
    until = R.step_index(a.until) if a.until else len(R.STEPS) - 1
    if a.from_step:
        i = R.step_index(a.from_step)
        not_done = [s for s in R.STEPS[:i] if state["steps"].get(s, {}).get("status") != "done"]
        if not_done:
            raise ValueError(f"cannot start at {a.from_step}: {', '.join(not_done)} not done (run without --from to continue)")
        if i > until:
            raise ValueError(f"--from {a.from_step} is after --until {a.until}")
        before = {s: r for s, r in stale.items() if R.step_index(s) < i}
        if before:
            raise R.StaleInputs(before, f" (--from {a.from_step} would build on their outputs)")
        return i, until, None
    first = next((i for i, s in enumerate(R.STEPS) if state["steps"].get(s, {}).get("status") != "done"), None)
    relied = R.STEPS[:first] if first is not None and first <= until else R.STEPS[:until + 1]
    before = {s: r for s, r in stale.items() if s in relied}
    if before:
        raise R.StaleInputs(before)
    if first is None:
        return None, until, "every step is done (use --from Sx to re-run)"
    return (first, until, None) if first <= until else (None, until, f"every step up to {R.STEPS[until]} is done")


def test_lines(c: R.Ctx) -> list:
    """The TEST ONLY lines printed at the end of every run of a folder whose state carries a TEST flag (review M1)."""
    tf, out = c.test_flags(), []
    if tf["test_auto_vision"]:
        out.append("TEST ONLY: --test-auto-vision accepted provisional landmark positions; this rig is not a G2 candidate.")
    if tf["test_keep_going"]:
        out.append(f"TEST ONLY: --keep-going continued past failed checks in {', '.join(tf['test_keep_going'])}; this rig is not a G2 "
                   f"candidate (re-run from {tf['test_keep_going'][0]} without --keep-going to clear it).")
    return out


def summary_json(c: R.Ctx, code: int, **kw) -> str:
    tf = c.test_flags()
    return json.dumps({"ok": code == R.EXIT_OK, "exit": code, "asset": c.asset, "family": c.family, "out": c.out,
                       "test_auto_vision": tf["test_auto_vision"], "test_keep_going": tf["test_keep_going"],
                       "test_only": tf["test_only"], **kw})


def sync_test_outputs(c: R.Ctx, rewrite_report: bool = False):
    """TEST_ONLY.md markers (and the report banner) from the state; never fatal."""
    try:
        c.update_test_flags()
        report.sync_test_markers(c)
        if not rewrite_report:
            report.ensure_report_banner(c)
    except Exception as e:
        c.log(f"WARNING could not update the TEST ONLY markers: {type(e).__name__}: {e}")


def record_in_recipe(c: R.Ctx, step: str):
    """``pipeline.<step>`` timing entry + the ``pipeline`` block in rig_recipe.json (from S2 on; S2 itself adds S0/S1)."""
    if not os.path.isfile(c.recipe_path) or step in ("S0", "S1"):
        return
    rec = c.load_recipe()
    rec.setdefault("steps", []).append(S.pipeline_entry(c, step))
    rec["pipeline"] = c.pipeline_block()
    rrecipe.stamp_scripts(rec)
    c.save_recipe(rec)


def run(argv=None) -> int:
    a = parse_args(argv)
    out = os.path.abspath(a.out)
    try:
        prepare_out(out, a.allow_existing)
        c = R.Ctx(a, [sys.argv[0]] + list(argv if argv is not None else sys.argv[1:]))
        st = c.load_state()
    except ValueError as e:
        print(f"pipeline: {e}", file=sys.stderr)
        print(json.dumps({"ok": False, "exit": R.EXIT_USAGE, "error": str(e)}))
        return R.EXIT_USAGE
    run_rec = {"started": R.now(), "argv": c.argv[1:], "keep_going": bool(a.keep_going), "test_auto_vision": bool(a.test_auto_vision)}
    try:
        stale = S.stale_steps(c, st, len(R.STEPS))
        i0, i1, note = resolve_range(st, a, stale)
    except ValueError as e:
        print(f"pipeline: {e}", file=sys.stderr)
        sync_test_outputs(c)
        print(summary_json(c, R.EXIT_USAGE, error=str(e)))
        return R.EXIT_USAGE
    except R.StaleInputs as e:  # review M3: refuse, never reuse outputs of other inputs or code
        st["runs"].append(run_rec)
        run_rec.update(ended=R.now(), exit=R.EXIT_FAILED, message=str(e), stale=e.stale)
        c.save_state()
        c.log(f"REFUSED: {e}")
        sync_test_outputs(c)
        print(f"pipeline: {e}", file=sys.stderr)
        for ln in test_lines(c):
            print(ln + "\n")
        print(summary_json(c, R.EXIT_FAILED, error=str(e).splitlines()[0], stale=e.stale, use_from=e.use_from))
        return R.EXIT_FAILED
    run_rec.update({"from": R.STEPS[i0] if i0 is not None else None, "until": R.STEPS[i1]})
    st["runs"].append(run_rec)
    if i0 is None:
        c.log(note)
        run_rec.update(ended=R.now(), exit=R.EXIT_OK, message=note)
        c.save_state()
        sync_test_outputs(c)
        for ln in test_lines(c):
            print(ln + "\n")
        print(summary_json(c, R.EXIT_OK, message=note))
        return R.EXIT_OK
    c.log(f"pipeline {a.asset} ({a.family}, H {a.height} m): {R.STEPS[i0]}..{R.STEPS[i1]}"
          + ("  [TEST: --test-auto-vision]" if a.test_auto_vision else "") + ("  [TEST: --keep-going]" if a.keep_going else ""))
    code, message = R.EXIT_OK, None
    try:
        moved = c.supersede(R.STEPS[i0])
        restored = c.restore(R.STEPS[i0])
        run_rec.update(superseded=moved, restored=restored)
    except (R.StepFailed, OSError) as e:
        run_rec.update(ended=R.now(), exit=R.EXIT_FAILED, message=str(e))
        c.save_state()
        print(f"pipeline: cannot prepare the re-run: {e}", file=sys.stderr)
        print(json.dumps({"ok": False, "exit": R.EXIT_FAILED, "error": str(e)}))
        return R.EXIT_FAILED
    for s in R.STEPS[i0:]:
        st["steps"][s] = {"status": "pending"}
    c.save_state()
    for s in R.STEPS[i0:i1 + 1]:
        c.step, c.calls, c._seq = s, [], 0
        rec = st["steps"][s] = {"status": "running", "started": R.now(), "run": len(st["runs"]) - 1, "calls": c.calls}
        c.save_state()
        c.log(f"== {s} {R.TITLES[s]}")
        t0 = time.time()
        try:
            rec["inputs"] = S.step_inputs(c, s)  # review M3: what this step is built from (a resume compares it)
            rec["inputs_sha256"] = I.digest(rec["inputs"])
            c.save_state()
            rec["summary"] = S.STEP_FUNCS[s](c)
            rec["status"] = "done"
        except R.StepStop as e:
            rec.update(status="stopped", error=e.message, stop_code=e.code, summary=e.details)
            code, message = e.code, e.message
        except R.StepFailed as e:
            rec.update(status="failed", error=e.message, log=e.log)
            code, message = R.EXIT_FAILED, f"{s} failed: {e.message}" + (f"\n  log: {e.log}" if e.log else "")
        except Exception as e:  # a module raised inside the driver: keep the traceback as evidence
            tb = traceback.format_exc()
            rec.update(status="failed", error=f"{type(e).__name__}: {e}", traceback=tb)
            code, message = R.EXIT_FAILED, f"{s} failed: {type(e).__name__}: {e}\n{tb}"
        rec["ended"] = R.now()
        rec["seconds"] = round(time.time() - t0, 2)
        rec["calls"] = R.clean(c.calls)
        c.update_test_flags()  # review M1: a --keep-going bypass of a done step marks the folder TEST ONLY from now on
        c.save_state()
        sync_test_outputs(c, rewrite_report=True)
        try:
            record_in_recipe(c, s)
        except Exception as e:  # the recipe is evidence, not a reason to lose the step result
            c.log(f"WARNING could not record {s} in the recipe: {type(e).__name__}: {e}")
        if rec["status"] == "done" and s not in ("S0", "S1"):
            rec["snapshot"] = c.snapshot(s)  # the rig .blend (S2, S4, S5, S7) and the recipe incl. pipeline.<step>
        c.save_state()
        c.log(f"{s} {rec['status']} in {rec['seconds']} s" + (f": {rec.get('error')}" if rec.get("error") else ""))
        if code != R.EXIT_OK:
            break
    run_rec.update(ended=R.now(), exit=code, message=message, tmp_dirs_pruned=c.prune_tmp(),
                   keep_going_bypassed=sorted(s for s in c.keep_going_bypass() if st["steps"][s].get("run") == len(st["runs"]) - 1))
    c.save_state()
    if st["steps"].get("S9", {}).get("status") == "done" and os.path.isfile(c.p("qa_report.md")):
        try:  # S9 wrote the report while it was running: write it again with the final step table
            report.qa_report(c, st["steps"]["S9"].get("summary") or {})
        except Exception as e:
            c.log(f"WARNING could not rewrite qa_report.md: {type(e).__name__}: {e}")
    sync_test_outputs(c)
    print("\n" + report.step_table(st) + "\n")
    if message:
        print(("STOP" if code in (R.EXIT_VISION, R.EXIT_PREREQ, R.EXIT_INPUT_STOP) else "FAILED") + f" (exit {code}): {message}\n")
    for ln in test_lines(c):
        print(ln + "\n")
    print(summary_json(c, code, steps={s: [st["steps"][s].get("status"), st["steps"][s].get("seconds")] for s in R.STEPS},
                       message=(message or "").splitlines()[0] if message else None))
    return code


if __name__ == "__main__":
    sys.exit(run())

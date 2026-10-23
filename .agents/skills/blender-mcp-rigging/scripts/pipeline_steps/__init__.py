r"""pipeline_steps - helpers of ``scripts/pipeline.py``, the end-to-end driver of the skill procedure S0-S9 (owner I3, P3 integration).

Runs in rigkit-env (``E:\tools\rigkit-env\Scripts\python.exe -I -B``). Every step calls the modules' own CLIs as subprocesses (Blender
headless for ``rigkit``, rigkit-env Python for ``solvers``), one log file per call; nothing here edits the rig directly.

Modules (import them explicitly):

    runner   paths, state file (pipeline_state.json), subprocess calls with logs and timings, snapshots and superseded outputs,
             recipe helpers, exceptions (StepFailed, StepStop) and exit codes
    steps    S0 open ... S9 package: one function per step; the per-step input table (``step_inputs``, ``stale_steps``)
    report   qa_report.md draft, VISION_CHECKPOINT.md, step table, TEST_ONLY.md markers
    inputs   input fingerprints of the steps (arguments, input files, script closure, driver code): a resume never reuses
             outputs made from other inputs (I5)

Units: metres (H = catalogue height). Frame: Blender, Z up, character front -Y, character left +X.
"""
__version__ = "0.1.0"

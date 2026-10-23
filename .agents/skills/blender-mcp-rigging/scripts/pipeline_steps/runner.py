r"""pipeline_steps.runner - the run context of ``scripts/pipeline.py``: output layout, the state file, subprocess calls with one log
per call, snapshots after the steps that save the rig .blend, superseded outputs on re-runs, recipe helpers and exit codes.

Output layout (``--out`` = the rig folder; scratch while testing)::

    .rigkit_pipeline          marker written when the driver creates the folder
    pipeline_state.json       per step: status, seconds, calls (exit, seconds, log), summary, error; one entry per run
    rig.log                   human-readable log of every run (appended)
    session.json  analysis.json/.npz  <asset>_rig.blend  rig_recipe.json  intake.json  landmarks.json  flags.json
    skeleton.json  landmarks_used.json  s4_report.json  s5_report.json  skin_rules.json  weights.npz  validation.json
    qa_report.md  VISION_CHECKPOINT.md (only when S3 stops)
    checks/        rig_function.json (S5), metrics/ (S7), validation.json + test GLB + parity/ (S8)
    qa/            S9 sheets (rigkit/render.py), qa_flag_sheet.jpg
    garments.json/.npz  chains.json   S3g garment plan (phase G); chains.json also holds the spring hints and colliders
    _work/         s1/ (GLB mesh for S1), mesh.npz (S2), landmarks/, unirig/ (UniRig read), flag_tiles/, garments/ (S3g skeleton +
                   merged skeleton), skin/ (candidates A/B/C, selected, skeleton_body.json, garment/ overlay, final_body,
                   garment_final/), s7_scoring/ (poses + metrics with candidates), s7_final/ (poses of the final weights)
    _snapshots/<step>/   rig .blend (after S2, S4, S5, S7) and rig_recipe.json after every step from S2 on
    _superseded/<time>_from_<step>/   outputs of an earlier run that a re-run replaced (never deleted)
    logs/<step>_<nn>_<call>.log

Inputs that the driver never moves: ``vision_decisions.json`` (Opus vision check), ``landmarks_override.json`` and
``weights_override.json`` (the user's GUI edits).

State (I5): per step also ``run`` (index into ``runs``), ``inputs`` + ``inputs_sha256`` (pipeline_steps/inputs.py); top level
``test_keep_going`` = {step: what --keep-going continued} of the done steps (``keep_going_bypass``), next to ``test_auto_vision``.

Exit codes: 0 done, 1 a step failed or a resume was refused (StaleInputs), 2 usage, 3 vision checkpoint (S3), 4 prerequisite
missing (UniRig output), 5 the input blocks
the rig (S1 stop flags).
"""
from __future__ import annotations

import datetime
import glob
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import time

SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL = os.path.dirname(SCRIPTS)
REPO = os.path.normpath(os.path.join(SKILL, "..", "..", ".."))
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)

from rigcore import npzio, recipe as rrecipe  # noqa: E402

from pipeline_steps import __version__  # noqa: E402

BLENDER = r"E:\SteamLibrary\steamapps\common\Blender\blender.exe"
UNIRIG_OUT = r"E:\tmp_unirig\out"
TMP_ROOT = r"E:\tmp_rigkit\_pipeline_tmp"  # TEMP/TMP of the subprocesses (C: is nearly full)
MARKER = ".rigkit_pipeline"
STATE = "pipeline_state.json"

STEPS = ("S0", "S1", "S2", "S3", "S3g", "S4", "S5", "S6", "S7", "S8", "S9")
TITLES = {"S0": "open", "S1": "analyse mesh", "S2": "normalize", "S3": "landmarks (consensus)",
          "S3g": "garments + chain plan", "S4": "runtime skeleton",
          "S5": "control rig + function tests", "S6": "skin candidates A/B/C", "S7": "poses, metrics, selection, final weights",
          "S8": "test export, validation, parity", "S9": "QA sheets, report, recipe"}
BLEND_STEPS = ("S2", "S4", "S5", "S7")  # steps that save the rig .blend: snapshot after them

EXIT_OK, EXIT_FAILED, EXIT_USAGE, EXIT_VISION, EXIT_PREREQ, EXIT_INPUT_STOP = 0, 1, 2, 3, 4, 5

#: outputs owned by each step (glob patterns relative to the output folder; ``{asset}`` = asset id). A re-run from step X moves the
#: outputs of X and of every later step to ``_superseded`` first; logs/<step>_* and _snapshots/<step> follow their step.
OWNED = {
    "S0": ["session.json"],
    "S1": ["analysis.json", "analysis.npz", "_work/s1"],
    "S2": ["{asset}_rig.blend", "{asset}_rig.blend1", "rig_recipe.json", "intake.json", "_work/mesh.npz"],
    "S3": ["_work/landmarks", "_work/unirig", "_work/flag_tiles", "landmarks.json", "flags.json", "VISION_CHECKPOINT.md",
           "TEST_ONLY.md"],
    "S3g": ["garments.json", "garments.npz", "chains.json", "_work/garments"],
    "S4": ["skeleton.json", "landmarks_used.json", "s4_report.json"],
    "S5": ["s5_report.json", "checks/rig_function.json"],
    "S6": ["skin_rules.json", "_work/skin/A.*", "_work/skin/B.*", "_work/skin/C.*", "_work/skin/skeleton_body.json",
           "_work/skin/garment"],
    "S7": ["_work/s7_scoring", "_work/s7_final", "_work/skin/selected.*", "_work/skin/final_body.*", "_work/skin/garment_final",
           "weights.npz", "checks/metrics", "checks/s7_finish.json", "checks/s7_garment.json"],
    "S8": ["checks/validation.json", "checks/*_runtime_check.glb", "checks/parity"],
    "S9": ["qa", "validation.json", "qa_report.md"],
}


class StepFailed(Exception):
    """A step could not finish: ``step``, ``message``, ``log`` (the log file of the failing call, if any)."""

    def __init__(self, step: str, message: str, log: str | None = None):
        super().__init__(f"{step}: {message}" + (f" (log: {log})" if log else ""))
        self.step, self.message, self.log = step, message, log


class StaleInputs(Exception):
    """A resume would start after a done step whose inputs or code changed since it ran (review M3): ``stale`` = {step: [what
    changed]} in step order, ``use_from`` = the first stale step. The driver refuses the run (exit 1) and names the ``--from`` that
    rebuilds it; it never reuses such outputs silently."""

    def __init__(self, stale: dict, why: str = ""):
        self.stale, self.use_from = stale, next(iter(stale))
        lines = [f"  {s}: " + "; ".join(r[:6]) + (f"; ... {len(r) - 6} more" if len(r) > 6 else "") for s, r in stale.items()]
        super().__init__(f"refused: the inputs or the code of {', '.join(stale)} changed since {'it' if len(stale) == 1 else 'they'} "
                         f"ran{why}; re-run with --from {self.use_from} to rebuild {self.use_from} and every later step with the "
                         "current inputs, or call the pipeline with the inputs those steps used (pipeline_state.json "
                         f"steps.{self.use_from}.inputs). What changed:\n" + "\n".join(lines))


class StepStop(Exception):
    """A planned stop point: the S1 input stop (code 5), the S3 vision checkpoint (code 3), a missing prerequisite (code 4)."""

    def __init__(self, step: str, code: int, message: str, details: dict | None = None):
        super().__init__(f"{step}: {message}")
        self.step, self.code, self.message, self.details = step, code, message, details or {}


# --------------------------------------------------------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------------------------------------------------------


def now() -> str:
    return rrecipe.now_iso()


def sha256_file(path) -> str | None:
    if not path or not os.path.isfile(path):
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def clean(obj):
    """JSON-safe copy: NaN / inf become None, tuples lists, numpy values plain Python (state and recipe are written with
    ``allow_nan=False``)."""
    try:
        import numpy as np
    except ImportError:  # pragma: no cover
        np = None
    if isinstance(obj, dict):
        return {str(k): clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [clean(v) for v in obj]
    if np is not None and isinstance(obj, np.ndarray):
        return clean(obj.tolist())
    if np is not None and isinstance(obj, np.generic):
        return clean(obj.item())
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    return obj


def last_json(text: str):
    """The last line of ``text`` that is a JSON object (``SKIN_IO {...}`` lines of skin_io count too), or None."""
    for line in reversed((text or "").splitlines()):
        s = line.strip()
        if s.startswith("SKIN_IO "):
            s = s[len("SKIN_IO "):]
        if s.startswith("{") and s.endswith("}"):
            try:
                return json.loads(s)
            except ValueError:
                continue
    return None


def step_index(step: str) -> int:
    s = step.strip().upper()
    up = [x.upper() for x in STEPS]  # "s3g" / "S3G" name step S3g
    if s not in up:
        raise ValueError(f"unknown step {step!r}; steps are {', '.join(STEPS)}")
    return up.index(s)


def read_json(path, default=None):
    return npzio.read_json(path) if path and os.path.isfile(path) else default


def write_json(path, obj) -> str:
    return npzio.write_json(path, clean(obj))


def _quote(a: str) -> str:
    return f'"{a}"' if (" " in a or not a) else a


# --------------------------------------------------------------------------------------------------------------------------
# run context
# --------------------------------------------------------------------------------------------------------------------------


class Ctx:
    """Everything a step needs: arguments, paths, the state file, the subprocess runner and the recipe helpers."""

    def __init__(self, args, argv=None):
        self.args = args
        self.argv = list(argv if argv is not None else sys.argv)
        self.out = os.path.abspath(args.out)
        self.asset = args.asset
        self.family = args.family
        self.H = float(args.height)
        self.glb = os.path.abspath(args.glb)
        self.blender = args.blender or BLENDER
        self.py = sys.executable
        self.unirig_out = args.unirig_out or UNIRIG_OUT
        self.tmp = os.path.join(args.tmp_dir or TMP_ROOT, self.asset)
        self.test_auto_vision = bool(args.test_auto_vision)
        self.keep_going = bool(getattr(args, "keep_going", False))
        self.step = None  # step running now
        self.calls = []  # calls of the step running now
        self.state = None
        self._seq = 0

    # ---------------------------------------------------------------- paths
    def p(self, *rel) -> str:
        return os.path.join(self.out, *rel)

    @property
    def blend(self) -> str:
        return self.p(f"{self.asset}_rig.blend")

    @property
    def recipe_path(self) -> str:
        return self.p("rig_recipe.json")

    @property
    def mesh(self) -> str:
        return self.p("_work", "mesh.npz")

    def script(self, rel: str) -> str:
        return os.path.join(SCRIPTS, *rel.split("/"))

    # ---------------------------------------------------------------- log
    def log(self, msg: str, echo: bool = True):
        line = f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} [{self.step or '--'}] {msg}"
        if echo:
            print(line, flush=True)
        os.makedirs(self.out, exist_ok=True)
        with open(self.p("rig.log"), "a", encoding="utf-8", newline="\n") as f:
            f.write(line + "\n")

    # ---------------------------------------------------------------- state
    def load_state(self) -> dict:
        st = read_json(self.p(STATE))
        if st is None:
            st = {"schema": 0, "driver": {"name": "scripts/pipeline.py", "version": __version__}, "asset_id": self.asset,
                  "glb": self.glb, "glb_sha256": None, "family": self.family, "H": self.H, "out": self.out,
                  "test_auto_vision": False, "test_keep_going": {}, "steps": {s: {"status": "pending"} for s in STEPS}, "runs": []}
        else:
            for k, want in (("asset_id", self.asset), ("family", self.family), ("H", self.H)):
                if st.get(k) != want:
                    raise ValueError(f"{self.p(STATE)} belongs to {k} {st.get(k)!r}, not {want!r}: use another --out folder")
            if os.path.normcase(os.path.abspath(st.get("glb") or "")) != os.path.normcase(self.glb):
                raise ValueError(f"{self.p(STATE)} was made from {st.get('glb')!r}, not {self.glb!r}: use another --out folder")
            st["driver"] = {"name": "scripts/pipeline.py", "version": __version__}
        self.state = st
        st["test_keep_going"] = self.keep_going_bypass()  # also for a state written before I5 (warnings only)
        return st

    def save_state(self):
        write_json(self.p(STATE), self.state)

    # ---------------------------------------------------------------- subprocess calls
    def env(self) -> dict:
        e = dict(os.environ)
        for k in ("PYTHONPATH", "PYTHONHOME", "PYTHONSTARTUP"):
            e.pop(k, None)
        e["PYTHONDONTWRITEBYTECODE"] = "1"
        os.makedirs(self.tmp, exist_ok=True)
        e["TEMP"] = e["TMP"] = e["TMPDIR"] = self.tmp
        return e

    def prune_tmp(self) -> int:
        """Remove empty folders under the subprocess TEMP (Blender leaves an empty ``blender_*`` session folder when a module ends
        with ``os._exit``). Returns the number removed; folders that still hold files stay."""
        n = 0
        for root, _, _ in os.walk(self.tmp, topdown=False):
            if os.path.normcase(root) != os.path.normcase(self.tmp) and not os.listdir(root):
                try:
                    os.rmdir(root)
                    n += 1
                except OSError:
                    pass
        return n

    def blender_cmd(self, script_rel: str, *args, blend: str | None = None) -> list:
        """``blender -b [blend] --factory-startup -P <script> -- args`` (the blend before -P only for CLIs that read the open file,
        such as rigkit/skin_io.py)."""
        cmd = [self.blender, "-b"]
        if blend:
            cmd.append(blend)
        cmd += ["--factory-startup", "-P", self.script(script_rel), "--"]
        return cmd + [str(a) for a in args]

    def py_cmd(self, script_rel: str, *args) -> list:
        """rigkit-env Python: ``-I`` (isolated) ignores PYTHONDONTWRITEBYTECODE, so ``-B`` keeps __pycache__ out of the skill."""
        return [self.py, "-I", "-B", self.script(script_rel)] + [str(a) for a in args]

    def call(self, name: str, cmd: list, timeout: float = 900.0, ok_codes=(0,), cwd: str | None = None) -> dict:
        """Run one subprocess of the current step; stdout/stderr go to ``logs/<step>_<nn>_<name>.log``. Returns ``{name, exit,
        seconds, log, summary}`` (summary = the last JSON line of stdout). Raises StepFailed on a timeout or an exit code outside
        ``ok_codes``."""
        self._seq += 1
        os.makedirs(self.p("logs"), exist_ok=True)
        log = self.p("logs", f"{self.step}_{self._seq:02d}_{name}.log")
        t0 = time.time()
        rec = {"name": name, "exit": None, "seconds": None, "log": log, "summary": None}
        self.calls.append(rec)
        self.log(f"{name}: {' '.join(_quote(str(c)) for c in cmd[:6])}{' ...' if len(cmd) > 6 else ''}", echo=False)
        try:
            p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout,
                               cwd=cwd or SCRIPTS, env=self.env())
            out, err, code = p.stdout, p.stderr, p.returncode
        except subprocess.TimeoutExpired as e:
            out = e.stdout.decode("utf-8", "replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
            err = e.stderr.decode("utf-8", "replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
            code = None
        sec = round(time.time() - t0, 2)
        with open(log, "w", encoding="utf-8", newline="\n") as f:
            f.write(" ".join(_quote(str(c)) for c in cmd) + f"\n\nexit: {code}   seconds: {sec}   cwd: {cwd or SCRIPTS}\n\n"
                    f"--- stdout ---\n{out}\n--- stderr ---\n{err}\n")
        rec.update(exit=code, seconds=sec, summary=clean(last_json(out)))
        self.log(f"{name}: exit {code} in {sec} s")
        if code is None:
            raise StepFailed(self.step, f"{name} timed out after {timeout:.0f} s", log)
        if code not in ok_codes:
            err_line = (rec["summary"] or {}).get("error") if isinstance(rec["summary"], dict) else None
            tail = [ln for ln in (err or out).strip().splitlines() if ln.strip()][-1:] if not err_line else [err_line]
            raise StepFailed(self.step, f"{name} exited {code}" + (f": {tail[0][:300]}" if tail else ""), log)
        return rec

    # ---------------------------------------------------------------- snapshots / superseded outputs
    def snapshot(self, step: str) -> dict:
        """Copy the rig .blend (after the steps that save it) and rig_recipe.json into ``_snapshots/<step>/``."""
        d = self.p("_snapshots", step)
        os.makedirs(d, exist_ok=True)
        out = {}
        if step in BLEND_STEPS and os.path.isfile(self.blend):
            dst = os.path.join(d, os.path.basename(self.blend))
            shutil.copy2(self.blend, dst)
            out["blend"] = dst
            out["blend_sha256"] = sha256_file(dst)
        if os.path.isfile(self.recipe_path):
            shutil.copy2(self.recipe_path, os.path.join(d, "rig_recipe.json"))
            out["recipe"] = os.path.join(d, "rig_recipe.json")
        return out

    def _owned(self, step: str) -> list:
        pats = [p.format(asset=self.asset) for p in OWNED[step]] + [f"logs/{step}_*", f"_snapshots/{step}"]
        found = []
        for pat in pats:
            found += glob.glob(self.p(*pat.split("/")))
        return sorted(set(found))

    def supersede(self, from_step: str) -> str | None:
        """Move the outputs of ``from_step`` and every later step into ``_superseded/<time>_from_<step>/`` (relative paths kept).
        For a re-run from S3 on, the current rig .blend and rig_recipe.json are moved too (``restore`` puts the snapshot back).
        Returns the folder, or None when there was nothing to move."""
        i = step_index(from_step)
        src = self.restore_sources(from_step)
        for key in ("blend", "recipe") if src else ():  # check before anything moves: a resume needs both snapshots
            if not os.path.isfile(src[key]):
                raise StepFailed(from_step, f"cannot resume: no snapshot {src[key]} (run from {src[key + '_step']} or earlier)")
        paths = []
        for s in STEPS[i:]:
            paths += self._owned(s)
        if src:  # from S3 on: moved only when they differ from the snapshot ``restore`` puts back
            for cur, snap in ((self.blend, src.get("blend")), (self.recipe_path, src.get("recipe"))):
                if os.path.isfile(cur) and not (snap and os.path.isfile(snap) and sha256_file(cur) == sha256_file(snap)):
                    paths.append(cur)
        paths = sorted(set(paths))
        if not paths:
            return None
        dest = self.p("_superseded", f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_from_{from_step}")
        for src in paths:
            rel = os.path.relpath(src, self.out)
            dst = os.path.join(dest, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(src, dst)
        self.log(f"moved {len(paths)} earlier output(s) of {from_step}..S9 to {dest}")
        return dest

    def restore_sources(self, from_step: str) -> dict:
        """Snapshots a re-run from ``from_step`` (S3 or later) starts from: ``blend`` = the newest snapshot of a .blend-saving step
        before it, ``recipe`` = the snapshot of the step right before it."""
        i = step_index(from_step)
        if i < STEPS.index("S3"):
            return {}
        prev_blend = [s for s in BLEND_STEPS if STEPS.index(s) < i][-1]
        prev_rec = STEPS[i - 1]  # the step right before; a folder without its snapshot (S3g came in phase G) uses the newest one
        for s in reversed(STEPS[STEPS.index("S2"):i]):
            if os.path.isfile(self.p("_snapshots", s, "rig_recipe.json")):
                prev_rec = s
                break
        return {"blend": self.p("_snapshots", prev_blend, os.path.basename(self.blend)), "blend_step": prev_blend,
                "recipe": self.p("_snapshots", prev_rec, "rig_recipe.json"), "recipe_step": prev_rec}

    def restore(self, from_step: str) -> dict:
        """Before re-running ``from_step`` (S3 or later): put the rig .blend and rig_recipe.json of ``restore_sources`` back (a file
        that already equals its snapshot stays as it is)."""
        src = self.restore_sources(from_step)
        out = {}
        if not src:
            return out
        for key, dst in (("blend", self.blend), ("recipe", self.recipe_path)):
            if not os.path.isfile(src[key]):
                raise StepFailed(from_step, f"cannot resume: no snapshot {src[key]} (run from {src[key + '_step']} or earlier)")
            if not (os.path.isfile(dst) and sha256_file(dst) == sha256_file(src[key])):
                shutil.copy2(src[key], dst)
            out[f"{key}_from"] = src[key]
        self.log(f"rig .blend from {out['blend_from']}, recipe from {out['recipe_from']}")
        return out

    # ---------------------------------------------------------------- recipe
    def load_recipe(self) -> dict:
        return rrecipe.load_recipe(self.recipe_path)

    def save_recipe(self, rec: dict):
        rrecipe.save_recipe(self.recipe_path, clean(rec))

    def _warnings(self, step: str) -> list:
        return (self.state["steps"].get(step, {}).get("summary") or {}).get("warnings") or []

    # ---------------------------------------------------------------- TEST ONLY flags (review M1)
    def keep_going_bypass(self) -> dict:
        """{step: [message]} of the done steps that ``--keep-going`` continued past a failed check (their summary ``keep_going``;
        a state written before I5 only has the warning text). It holds for every later run of this folder and clears only when
        such a step re-runs and passes without the bypass (a re-run resets the step and every later one)."""
        out = {}
        for s in STEPS:
            r = self.state["steps"].get(s) or {}
            if r.get("status") != "done":
                continue
            sm = r.get("summary") or {}
            msgs = sm.get("keep_going") if "keep_going" in sm else [w for w in (sm.get("warnings") or []) if "--keep-going" in str(w)]
            if msgs:
                out[s] = [str(m) for m in msgs]
        return out

    def update_test_flags(self) -> dict:
        """Recompute ``state["test_keep_going"]`` from the step records; returns ``test_flags()``."""
        self.state["test_keep_going"] = self.keep_going_bypass()
        return self.test_flags()

    def test_flags(self) -> dict:
        """``{"test_auto_vision": bool, "test_keep_going": [steps], "test_only": bool}`` of the outputs in this folder."""
        tav = bool(self.state.get("test_auto_vision"))
        kg = sorted(self.state.get("test_keep_going") or {}, key=STEPS.index)
        return {"test_auto_vision": tav, "test_keep_going": kg, "test_only": tav or bool(kg)}

    def pipeline_block(self) -> dict:
        """``rig_recipe.json["pipeline"]``: driver, every run's arguments, the TEST flags and the step table (status, seconds, the
        run that built the step and its input fingerprint)."""
        tf = self.test_flags()
        runs = [{k: r.get(k) for k in ("started", "ended", "argv", "from", "until", "exit", "keep_going", "test_auto_vision")}
                for r in self.state.get("runs") or []]
        return {"driver": {"name": "scripts/pipeline.py", "version": __version__}, "argv": self.argv[1:], "runs": runs,
                "test_auto_vision": tf["test_auto_vision"],
                "test_auto_vision_note": ("TEST ONLY: flagged landmarks kept their provisional consensus positions without a vision "
                                          "check (--test-auto-vision); this rig is not a G2 candidate")
                if tf["test_auto_vision"] else None,
                "keep_going_steps": tf["test_keep_going"],
                "test_keep_going": self.state.get("test_keep_going") or {},
                "test_keep_going_note": ("TEST ONLY: --keep-going continued past failed checks in " + ", ".join(tf["test_keep_going"])
                                         + "; this rig is not a G2 candidate") if tf["test_keep_going"] else None,
                "test_only": tf["test_only"],
                "steps": {s: {k: self.state["steps"].get(s, {}).get(k) for k in ("status", "seconds", "ended", "run", "inputs",
                                                                                 "inputs_sha256")} for s in STEPS}}

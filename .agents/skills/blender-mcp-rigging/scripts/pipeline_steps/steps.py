r"""pipeline_steps.steps - S0 ... S9 of the skill procedure (SKILL.md "Procedure"), one function per step. Each function takes the run
context (``runner.Ctx``), calls the module CLIs (``ctx.call``), reads their outputs and returns a JSON-able summary for the state
file and the recipe; planned stops raise ``runner.StepStop``, failures ``runner.StepFailed``.

    S0  open: GLB sha256 (+ expected), GLB inventory (skins, animations, textures), git stamp and status, UniRig output present,
        Blender version -> session.json
    S1  analyse: solvers/glbmesh.py (GLB -> _work/s1/mesh_glb.npz) + solvers/analysis.py -> analysis.json; stop on stop flags
    S2  normalize: rigkit/intake.py -> <asset>_rig.blend, _work/mesh.npz, intake.json, rig_recipe.json; intake mesh vs the S1 mesh;
        the S0/S1 records go into the recipe
    S3  landmarks: solvers/landmarks_geo.py (a), solvers/unirig_bridge.py read (d), solvers/consensus.py (+ vision decisions)
        -> landmarks.json, flags.json; VISION CHECKPOINT (exit 3) unless ready, or --test-auto-vision (TEST ONLY)
    S3g garments (phase G): solvers/garments.py + solvers/chains.py -> garments.json/.npz, chains.json (spring hints); --garments
        overrides; a no-op for the legacy family
    S4  skeleton: rigkit/skeleton.py (pre-bend, resolve, build, bend tests, checks; --chains with the S3g chain bones)
    S5  control: rigkit/control.py + rigkit/functest.py
    S6  skin: candidates A (solvers/skin_region.py), B (skin_transfer.py), C (skin_unirig.py, filled from B)
    S7  poses (rigkit/poses.py, candidate A as the scoring primary on a copy of the rig) -> metrics with every candidate
        (solvers/metrics.py) -> solvers/skin_select.py -> pipeline_steps/finish.py -> final weights into the rig (rigkit/skin_io.py)
        -> poses + metrics of the final weights
    S8  rigkit/export.py (test GLB, A1.1-A1.14 + extras), rigkit/parity.py + solvers/parity_cmp.py (clean reimport parity)
    S9  rigkit/render.py (chunked plan / chunk / finish / compose: sheets + flag sheet), qa_report.md, validation.json, recipe

Units: metres. Frame: Blender, Z up, front -Y, left +X.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys

from rigcore import recipe as rrecipe

from pipeline_steps import report
from pipeline_steps.runner import (BLEND_STEPS, EXIT_INPUT_STOP, EXIT_PREREQ, EXIT_VISION, REPO, SCRIPTS, STEPS, TITLES, Ctx,
                                   StepFailed, StepStop, read_json, sha256_file, step_index, write_json)

LEGACY_RULES = os.path.join(SCRIPTS, "tests", "solvers", "B_d01_skin_rules.json")  # D01's legacy profile only
LEGACY_FAMILIES = ("S_legacy_D01",)
A2_UNIRIG = r"E:\tmp_rigkit\A2\unirig"  # A2's published maps (reference only; the pipeline reads UniRig's GLB itself)
MESH_MATCH_TOL_H = 1e-5  # intake mesh vs the S1 GLB mesh (float32 storage in Blender)


# ==========================================================================================================================
# helpers
# ==========================================================================================================================


def _family(c: Ctx) -> dict:
    from rigcore import template

    return template.load_family(c.family)


def rig_names(c: Ctx) -> dict:
    """Object names of the rig (rigkit.bl.rig_names: ``<asset>``, ``<asset>_runtime``, ``<asset>_control`` unless the family's
    builder block overrides them)."""
    from rigkit import bl

    return bl.rig_names(c.asset, _family(c))


def inside_exempt(c: Ctx) -> list:
    sk = read_json(c.p("skeleton.json")) or {}
    return list(((sk.get("builder") or {}).get("inside_exempt")) or ((_family(c).get("builder") or {}).get("inside_exempt")) or [])


def unirig_rigged(c: Ctx) -> str:
    return os.path.join(c.unirig_out, c.asset, f"{c.asset}_rigged.glb")


def unirig_missing_message(c: Ctx) -> str:
    return (f"UniRig output missing: {unirig_rigged(c)}. The pipeline never runs UniRig itself. A rig session runs it once, under "
            f"its lock (about 90 s, ~10 GiB VRAM):\n  {c.py} -I {os.path.join(SCRIPTS, 'solvers', 'unirig_bridge.py')} run "
            f"--glb {c.glb} --out {os.path.join(c.unirig_out, c.asset)}\nthen re-run this pipeline (it resumes at the first step "
            f"not done).")


def git_lines(*args: str, timeout: float = 30.0) -> list | None:
    env = dict(os.environ, GIT_OPTIONAL_LOCKS="0")
    kw = {"creationflags": getattr(subprocess, "CREATE_NO_WINDOW", 0)} if os.name == "nt" else {}
    try:
        r = subprocess.run(["git", "-C", REPO, *args], capture_output=True, timeout=timeout, env=env, **kw)
    except (OSError, subprocess.SubprocessError):
        return None
    if r.returncode != 0:
        return None
    return [ln for ln in r.stdout.decode("utf-8", "replace").splitlines() if ln.strip()]


def compare_meshes(a_path: str, b_path: str, H: float) -> dict:
    """Intake mesh.npz (Blender) vs the S1 mesh from glbmesh: same vertex order, triangles, weld map; largest position gap."""
    import numpy as np

    from rigcore import npzio

    a, b = npzio.load_mesh(a_path), npzio.load_mesh(b_path)
    out = {"n_vertices": [int(len(a["V"])), int(len(b["V"]))], "n_triangles": [int(len(a["F"])), int(len(b["F"]))]}
    if a["V"].shape != b["V"].shape:
        out.update(ok=False, why="vertex counts differ")
        return out
    out["max_dV_m"] = float(np.abs(np.asarray(a["V"], float) - np.asarray(b["V"], float)).max())
    out["faces_equal"] = bool(a["F"].shape == b["F"].shape and np.array_equal(a["F"], b["F"]))
    out["weld_equal"] = bool(np.array_equal(a["weld"], b["weld"]))
    out["tol_m"] = MESH_MATCH_TOL_H * H
    out["ok"] = bool(out["max_dV_m"] <= out["tol_m"] and out["faces_equal"])
    return out


def _checks_failed(c: Ctx, r: dict, step_key: str) -> bool:
    """Exit of a module CLI called with ``ok_codes=(0, 1)`` (rigkit skeleton / control / functest / export): 0 = its checks passed;
    1 = its checks failed only when the module got to its end and printed its summary line ``{"step": step_key, "ok": false}``
    (the last thing it does, after saving every output). Exit 1 without that line is a crash (``bl.run_main`` maps any exception
    to 1): StepFailed, never continued as a failed check, also under --keep-going (review M2 / m2)."""
    if r["exit"] == 0:
        return False
    sm = r.get("summary")
    if isinstance(sm, dict) and sm.get("step") == step_key and sm.get("ok") is False:
        return True
    raise StepFailed(c.step, f"{r['name']} exited {r['exit']} without its {step_key} summary line: the module crashed (not a failed "
                             "check)", r["log"])


def _ok_or_keep_going(c: Ctx, step: str, ok: bool, what: str, log: str, details) -> list:
    """A step CLI exited 1 because a rig check failed (it still saved its outputs; ``_checks_failed`` told it from a crash). Stop,
    unless --keep-going (TEST): then return the message; the step stores it in its summary under ``keep_going`` (and
    ``warnings``), which keeps this folder TEST ONLY until the step re-runs and passes without the bypass (runner
    ``keep_going_bypass``)."""
    if ok:
        return []
    if not c.args.keep_going:
        raise StepFailed(step, f"{what}: {details}", log)
    msg = f"{what} (continued: --keep-going, TEST ONLY): {details}"
    c.log("WARNING " + msg)
    return [msg]


# ==========================================================================================================================
# S0 open
# ==========================================================================================================================


def s0_open(c: Ctx) -> dict:
    from solvers import glbmesh

    if not os.path.isfile(c.glb):
        raise StepFailed("S0", f"GLB not found: {c.glb}")
    sha = sha256_file(c.glb)
    if c.args.sha256 and sha != c.args.sha256.lower():
        raise StepFailed("S0", f"GLB {c.glb} has sha256 {sha}, expected {c.args.sha256}: the source changed")
    js, _ = glbmesh.read_glb(c.glb)
    inv = {"generator": (js.get("asset") or {}).get("generator"), "nodes": len(js.get("nodes", [])),
           "meshes": len(js.get("meshes", [])), "skins": len(js.get("skins", [])), "animations": len(js.get("animations", [])),
           "materials": len(js.get("materials", [])), "images": len(js.get("images", [])),
           "extensions_used": js.get("extensionsUsed", [])}
    tex = glbmesh.texture_info(c.glb)
    stamp = rrecipe.script_stamp()
    skill_rel = os.path.relpath(os.path.dirname(SCRIPTS), REPO).replace("\\", "/")
    git = {"head": stamp.get("git_head"), "scripts_dirty": stamp.get("dirty"),
           "skill_status": git_lines("status", "--porcelain", "--untracked-files=normal", "--", skill_rel)}
    try:
        asset_rel = os.path.relpath(os.path.dirname(c.glb), REPO).replace("\\", "/")
        if not asset_rel.startswith(".."):
            git["asset_status"] = git_lines("status", "--porcelain", "--untracked-files=normal", "--", asset_rel)
            git["asset_dir"] = asset_rel
    except ValueError:  # another drive
        pass
    for k in ("skill_status", "asset_status"):
        if isinstance(git.get(k), list) and len(git[k]) > 25:
            git[k] = git[k][:25] + [f"... {len(git[k]) - 25} more"]
    rigged = unirig_rigged(c)
    unirig = {"rigged_glb": rigged, "present": os.path.isfile(rigged), "sha256": sha256_file(rigged),
              "a2_maps": os.path.join(A2_UNIRIG, c.asset), "a2_maps_present": os.path.isdir(os.path.join(A2_UNIRIG, c.asset))}
    ver = c.call("blender_version", [c.blender, "--version"], timeout=120)
    with open(ver["log"], encoding="utf-8") as f:
        vtxt = f.read()
    m = re.search(r"Blender \d+\.\d+(\.\d+)?( LTS)?", vtxt)
    scripts = {}  # other writers edit the skill while it is untracked: the git stamp only says "dirty", so hash every module used
    for sub in ("rigcore", "rigkit", "solvers", "pipeline_steps"):
        for f in sorted(os.listdir(os.path.join(SCRIPTS, sub))):
            if f.endswith((".py", ".json")):
                scripts[f"{sub}/{f}"] = sha256_file(os.path.join(SCRIPTS, sub, f))
    scripts["pipeline.py"] = sha256_file(os.path.join(SCRIPTS, "pipeline.py"))
    fam_dir = os.path.join(os.path.dirname(SCRIPTS), "families")
    for f in sorted(os.listdir(fam_dir)):
        if f.endswith(".json"):
            scripts[f"../families/{f}"] = sha256_file(os.path.join(fam_dir, f))
    session = {"schema": 0, "asset_id": c.asset, "family": c.family, "H": c.H, "out": c.out, "started": c.state["runs"][-1]["started"],
               "scripts_sha256": scripts,
               "glb": {"path": c.glb, "sha256": sha, "expected_sha256": c.args.sha256, "bytes": os.path.getsize(c.glb),
                       "inventory": inv, "texture": tex},
               "git": git, "unirig": unirig, "blender": {"path": c.blender, "version": m.group(0) if m else None},
               "python": {"path": c.py}, "test_auto_vision_requested": c.test_auto_vision,
               "inventory_note": "a GLB carries no rig state of its own; existing skins / animations would be imported by "
                                 "rigkit/intake.py as extra objects, which it refuses"}
    write_json(c.p("session.json"), session)
    c.state["glb_sha256"] = sha
    if inv["skins"] or inv["animations"]:
        raise StepStop("S0", EXIT_INPUT_STOP, f"the GLB already holds {inv['skins']} skin(s) and {inv['animations']} animation(s): "
                                              "rig the unrigged source GLB (Tripo export), not a rigged file")
    until = step_index(c.args.until) if c.args.until else len(STEPS) - 1
    if not unirig["present"] and until >= STEPS.index("S3"):
        raise StepStop("S0", EXIT_PREREQ, unirig_missing_message(c), {"unirig": unirig})
    return {"glb_sha256": sha, "glb_bytes": os.path.getsize(c.glb), "inventory": inv, "git_head": stamp.get("git_head"),
            "scripts_dirty": stamp.get("dirty"), "unirig_present": unirig["present"], "blender": session["blender"]["version"]}


# ==========================================================================================================================
# S1 analyse
# ==========================================================================================================================


def s1_analyse(c: Ctx) -> dict:
    mesh_glb = c.p("_work", "s1", "mesh_glb.npz")
    c.call("glbmesh", c.py_cmd("solvers/glbmesh.py", c.glb, "--asset-id", c.asset, "--H", c.H, "--out", mesh_glb), timeout=600)
    args = [mesh_glb, "--family", c.family, "--glb", c.glb, "--out", c.p("analysis.json")]
    if c.args.requires_fingers:
        args.append("--requires-fingers")
    c.call("analysis", c.py_cmd("solvers/analysis.py", *args), timeout=1800)
    doc = read_json(c.p("analysis.json"))
    flags = doc.get("stop_flags", [])
    pose = doc.get("pose") or {}
    fingers = doc.get("fingers") or {}
    out = {"n_vertices": doc.get("n_vertices"), "n_welded": doc.get("n_welded"), "n_triangles": doc.get("n_triangles"),
           "n_islands": doc.get("n_islands"), "boundary_edges": (doc.get("edges") or {}).get("boundary"),
           "non_manifold_edges": (doc.get("edges") or {}).get("nonmanifold"),
           "arm_angle_deg": {s: ((pose.get("arms") or {}).get(s) or {}).get("angle_deg") for s in ("L", "R")},
           "arm_torso_contact_H": {s: ((pose.get("arms") or {}).get(s) or {}).get("contact_length_H") for s in ("L", "R")},
           "leg_gap_min_H": (pose.get("legs") or {}).get("leg_gap_min_H"), "pose_kind": pose.get("type"),
           "fingers": {s: (fingers.get(s) or {}).get("verdict") for s in ("L", "R")} if isinstance(fingers, dict) else None,
           "flags": [f"{f['severity']}:{f['code']}" for f in flags], "stop": bool(doc.get("stop")),
           "analysis": c.p("analysis.json"), "mesh_glb": mesh_glb}
    if doc.get("stop"):
        why = "; ".join(f"{f['code']}: {f['reason']}" for f in flags if f["severity"] == "stop")
        raise StepStop("S1", EXIT_INPUT_STOP, "the input blocks the rig (references/mesh-intake.md stop conditions): " + why +
                       ". Propose a new T-pose to the user; do not rig around it.", {"stop_flags": [f for f in flags
                                                                                        if f["severity"] == "stop"]})
    return out


# ==========================================================================================================================
# S2 normalize
# ==========================================================================================================================


def s2_normalize(c: Ctx) -> dict:
    args = ["--glb", c.glb, "--asset-id", c.asset, "--H", c.H, "--out-dir", c.out, "--family", c.family]
    if c.state.get("glb_sha256"):
        args += ["--sha256", c.state["glb_sha256"]]
    c.call("intake", c.blender_cmd("rigkit/intake.py", *args), timeout=600)
    info = read_json(c.p("intake.json"))
    nz = info["normalize"]
    cmp = compare_meshes(c.mesh, c.p("_work", "s1", "mesh_glb.npz"), c.H) if os.path.isfile(c.p("_work", "s1", "mesh_glb.npz")) else None
    warn = []
    if cmp is not None and not cmp.get("ok"):
        warn.append(f"intake mesh differs from the S1 GLB mesh: {cmp}")
        c.log("WARNING " + warn[-1])
    # the S0 / S1 records go into the recipe that intake just created, in the order the steps ran
    rec = c.load_recipe()
    pre = []
    s0, s1 = c.state["steps"].get("S0", {}), c.state["steps"].get("S1", {})
    if s0.get("status") == "done":
        pre.append({"step": "S0.session", "time": s0.get("started") or rrecipe.now_iso(),
                    "params": {"glb": c.glb, "expected_sha256": c.args.sha256, "family": c.family, "H": c.H,
                               "unirig_out": c.unirig_out},
                    "outputs": {"session": c.p("session.json"), **(s0.get("summary") or {})}})
        pre.append(pipeline_entry(c, "S0"))
    if s1.get("status") == "done":
        pre.append({"step": "S1", "time": s1.get("started") or rrecipe.now_iso(),
                    "params": {"family": c.family, "requires_fingers": bool(c.args.requires_fingers), "mesh": "solvers/glbmesh.py"},
                    "outputs": s1.get("summary") or {}})
        pre.append(pipeline_entry(c, "S1"))
    rec["steps"] = pre + rec["steps"]
    rec["analysis"] = {"file": c.p("analysis.json"), "flags": (s1.get("summary") or {}).get("flags")}
    c.save_recipe(rec)
    return {"factor": nz["factor"], "offset_z_m": nz["offset_z_m"], "roundtrip_max_m": nz["roundtrip_max_m"], "ok": nz["ok"],
            "vertices": info.get("vertices"), "triangles": info.get("triangles"), "images": info.get("images"),
            "blend": c.blend, "mesh": c.mesh, "mesh_vs_s1": cmp, "warnings": warn}


def pipeline_entry(c: Ctx, step: str) -> dict:
    """Recipe entry ``pipeline.<step>``: status, seconds and the calls (exit, seconds, log) of the step."""
    r = c.state["steps"].get(step, {})
    runs = c.state.get("runs") or []
    run = runs[r["run"]] if isinstance(r.get("run"), int) and 0 <= r["run"] < len(runs) else {}
    return {"step": f"pipeline.{step}", "time": r.get("ended") or rrecipe.now_iso(),
            "params": {"title": TITLES.get(step), "test_auto_vision": bool(c.state.get("test_auto_vision")),
                       "argv": run.get("argv"), "inputs": r.get("inputs"), "inputs_sha256": r.get("inputs_sha256")},
            "outputs": {"status": r.get("status"), "seconds": r.get("seconds"),
                        "calls": [{k: x.get(k) for k in ("name", "exit", "seconds", "log")} for x in r.get("calls", [])],
                        "warnings": (r.get("summary") or {}).get("warnings") or [],
                        "keep_going": (r.get("summary") or {}).get("keep_going") or []}}


# ==========================================================================================================================
# S3 landmarks
# ==========================================================================================================================


def flag_tiles_cli(c: Ctx) -> dict:
    """Is ``rigkit/render.py`` mode ``flag_tiles`` available (writer C / I2)? Reads ``render.py --help`` in rigkit-env."""
    try:
        r = subprocess.run([c.py, "-I", "-B", c.script("rigkit/render.py"), "--help"], capture_output=True, text=True, timeout=60,
                           env=c.env(), cwd=SCRIPTS)
        txt = r.stdout + r.stderr
    except (OSError, subprocess.SubprocessError) as e:
        return {"available": False, "why": f"render.py --help failed: {e}"}
    m = re.search(r"\{([^}]*)\}", txt)
    cmds = [x.strip() for x in m.group(1).split(",")] if m else []
    opts = sorted(set(re.findall(r"(--[a-z][a-z0-9-]*)", txt)))
    return {"available": "flag_tiles" in cmds, "commands": cmds, "options": opts}


def render_flag_tiles(c: Ctx) -> dict:
    """Render the vision-check tiles of flags.json with rigkit/render.py's flag modes when they exist (writer C / I2): the chunked
    path ``flag_plan`` (rigkit-env) -> ``flag_chunk`` per chunk (headless Blender, short calls) -> ``flag_finish``, else the
    one-call ``flag_tiles``; then ``flag_compose`` (one sheet per tile + a contact sheet). Arguments come from the --help text
    (``--flags``, ``--mesh`` when listed). A failure is recorded, not fatal: the checkpoint note tells the session how to go on
    without tiles."""
    cli = flag_tiles_cli(c)
    out_dir = c.p("_work", "flag_tiles")
    res = {"cli": cli, "out_dir": out_dir, "rendered": False, "sheets": []}
    cmds = set(cli.get("commands") or [])
    if not cli["available"]:
        res["why"] = "rigkit/render.py has no flag_tiles mode yet (writer I2 adds it)"
        return res
    inp = []
    if "--flags" in cli["options"]:
        inp += ["--flags", c.p("flags.json")]
    if "--mesh" in cli["options"]:
        inp += ["--mesh", c.mesh]
    try:
        if {"flag_plan", "flag_chunk", "flag_finish"} <= cmds:
            pl = c.call("flag_plan", c.py_cmd("rigkit/render.py", "flag_plan", "--out-dir", out_dir, *inp), timeout=300)
            secs = []
            for i0, i1 in (pl["summary"] or {}).get("chunks") or []:
                r = c.call(f"flag_chunk_{i0:04d}", c.blender_cmd("rigkit/render.py", "flag_chunk", "--out-dir", out_dir, "--i0", i0,
                                                                "--i1", i1), timeout=600)
                secs.append(r["seconds"])
            c.call("flag_finish", c.py_cmd("rigkit/render.py", "flag_finish", "--out-dir", out_dir), timeout=300)
            res.update(path="chunked", chunk_seconds=secs, n_jobs=(pl["summary"] or {}).get("n_jobs"),
                       warnings=(pl["summary"] or {}).get("warnings"))
        else:
            r = c.call("flag_tiles", c.blender_cmd("rigkit/render.py", "flag_tiles", "--out-dir", out_dir, *inp), timeout=900)
            res.update(path="one call", summary=r["summary"])
        res["rendered"] = True
        if "flag_compose" in cmds:
            r = c.call("flag_compose", c.py_cmd("rigkit/render.py", "flag_compose", "--out-dir", out_dir), timeout=600)
            res["sheets"] = [os.path.join(out_dir, f) for f in ((r["summary"] or {}).get("files") or [])]
    except StepFailed as e:
        res.update(why=e.message, log=e.log)
        c.log(f"WARNING flag tiles failed: {e.message} (log {e.log}); the checkpoint continues without (all) tiles")
    return res


def s3_landmarks(c: Ctx) -> dict:
    la = c.p("_work", "landmarks", "landmarks_a.json")
    c.call("landmarks_geo", c.py_cmd("solvers/landmarks_geo.py", c.mesh, "--family", c.family, "--analysis", c.p("analysis.json"),
                                     "--out", la), timeout=1800)
    rigged = unirig_rigged(c)
    if not os.path.isfile(rigged):
        raise StepStop("S3", EXIT_PREREQ, unirig_missing_message(c))
    info = read_json(c.p("intake.json")) or {}
    off = float(((info.get("normalize") or {}).get("offset_z_m")) or 0.0)
    if off != 0.0:  # unirig_bridge / skin_unirig map UniRig's glTF positions with meta z_offset (rigkit/intake.py writes it since I4)
        from rigcore import npzio

        if "z_offset" not in (npzio.load_mesh(c.mesh)["meta"] or {}):
            raise StepFailed("S3", f"{c.mesh} has no z_offset in its meta although intake moved the mesh by {off} (an intake from "
                                   "before I4): re-run from S2")
    ud = c.p("_work", "unirig")
    c.call("unirig_read", c.py_cmd("solvers/unirig_bridge.py", "read", "--asset-id", c.asset, "--rigged", rigged, "--mesh", c.mesh,
                                   "--family", c.family, "--out", ud), timeout=900)
    vision = c.p("vision_decisions.json")
    vsrc = None
    if c.args.vision_decisions:
        vsrc = os.path.abspath(c.args.vision_decisions)
        if not os.path.isfile(vsrc):
            raise StepFailed("S3", f"--vision-decisions file not found: {vsrc}")
        if os.path.normcase(vsrc) != os.path.normcase(vision):
            if os.path.isfile(vision) and sha256_file(vision) != sha256_file(vsrc):
                old = c.p("_superseded", f"vision_decisions_{rrecipe.now_iso().replace(':', '').replace('+0000', '')}.json")
                os.makedirs(os.path.dirname(old), exist_ok=True)
                shutil.move(vision, old)
                c.log(f"earlier vision_decisions.json moved to {old}")
            shutil.copy2(vsrc, vision)
    args = ["--asset-id", c.asset, "--family", c.family, "--a", la, "--d", os.path.join(ud, "landmarks_d.json"), "--mesh", c.mesh,
            "--out-dir", c.out]
    if os.path.isfile(vision):
        args += ["--vision", vision]
    if os.path.isfile(c.p("landmarks_override.json")):
        args += ["--override", c.p("landmarks_override.json")]
    c.call("consensus", c.py_cmd("solvers/consensus.py", *args), timeout=900)
    flags = read_json(c.p("flags.json"))
    lms = read_json(c.p("landmarks.json"))
    if flags.get("missing"):
        raise StepFailed("S3", f"landmarks missing after consensus: {flags['missing']}", c.calls[-1]["log"])
    vis = flags.get("vision") or {}
    tiles = flags.get("tiles", [])
    flagged = {lid: {"flag": e.get("flag"), "kind": e.get("kind"), "pos": e.get("pos"), "provisional_source": None}
               for lid, e in (lms.get("landmarks") or {}).items() if e.get("flagged")}
    for t in tiles:
        for lid, src in (t.get("provisional_source") or {}).items():
            if lid in flagged:
                flagged[lid]["provisional_source"] = src
    out = {"ready_for_user": bool(flags.get("ready_for_user")), "n_tiles": flags.get("n_tiles"),
           "n_vision_only_tiles": flags.get("n_vision_only_tiles"), "n_pending": flags.get("n_pending"),
           "n_escalated": flags.get("n_escalated"), "n_resolved": flags.get("n_resolved"), "user_tiles": flags.get("user_tiles"),
           "tiles": [{"key": t["key"], "flag": t["flag"], "status": t["status"], "ids": t["ids"], "impact": t.get("impact")}
                     for t in tiles],
           "vision": {k: vis.get(k) for k in ("file", "applied", "escalated", "stale", "rejected", "unused")},
           "reasons": flags.get("reasons"), "flagged": flagged, "n_landmarks": len(lms.get("landmarks") or {}),
           "landmarks": c.p("landmarks.json"), "flags": c.p("flags.json"), "unirig_read_mesh": c.mesh, "warnings": []}
    test = False
    if not flags.get("ready_for_user"):
        if c.test_auto_vision:
            test = True
            out["test_auto_vision"] = {
                "note": "TEST ONLY (--test-auto-vision): no vision check ran; every flagged landmark keeps its provisional consensus "
                        "position (flags.json tiles[].provisional). This rig is not a G2 candidate.",
                "accepted_provisional": flagged}
            c.log(f"WARNING TEST ONLY: --test-auto-vision accepts {len(flagged)} flagged landmark(s) at their provisional "
                  f"positions: {', '.join(sorted(flagged))}")
        else:
            out["flag_tiles"] = render_flag_tiles(c)
            path = report.vision_checkpoint(c, flags, out["flag_tiles"])
            c.state["test_auto_vision"] = False
            if flags.get("n_pending"):
                msg = (f"vision checkpoint: {flags.get('n_pending')} landmark(s) wait for the Opus vision check. Read {path}, write "
                       f"vision_decisions.json and re-run with --vision-decisions <file>.")
            else:  # every tile was decided, but more were escalated than the user's sheet may hold (joint-placement.md step 5)
                msg = (f"vision checkpoint: {flags.get('n_escalated')} escalated tile(s) > max {flags.get('max_tiles')}: the round is "
                       f"not ready for the user; fix the detectors (A2) instead. Details: {path}")
            raise StepStop("S3", EXIT_VISION, msg, {"checkpoint": path, "tiles": out["tiles"], "reasons": flags.get("reasons")})
    c.state["test_auto_vision"] = test
    if test:
        report.test_only_marker(c.p("TEST_ONLY.md"), c, out["test_auto_vision"]["accepted_provisional"])
    rec = c.load_recipe()
    rec["landmarks"]["file"] = c.p("landmarks.json")
    rec["landmarks"]["overrides"] = read_json(c.p("landmarks_override.json"), {}) or {}
    rec["landmarks"]["sources"] = {"a": la, "d": os.path.join(ud, "landmarks_d.json"), "unirig_rigged": rigged,
                                   "unirig_rigged_sha256": sha256_file(rigged),
                                   "vision_decisions": vision if os.path.isfile(vision) else None,
                                   "vision_decisions_sha256": sha256_file(vision), "flags": c.p("flags.json")}
    rec["landmarks"]["test_auto_vision"] = out.get("test_auto_vision")
    rrecipe.log_step(rec, "S3", {"family": c.family, "vision_decisions": vsrc or (vision if os.path.isfile(vision) else None),
                                 "test_auto_vision": test},
                     {k: out[k] for k in ("ready_for_user", "n_tiles", "n_pending", "n_escalated", "user_tiles", "tiles", "vision",
                                          "landmarks", "flags")})
    c.save_recipe(rec)
    return out


# ==========================================================================================================================
# S3g garments + chain plan (phase G, references/cloth-and-attachments.md)
# ==========================================================================================================================


def garments_override(c: Ctx) -> str | None:
    """``--garments`` (the user's / Opus' override of the S3g plan, cloth-and-attachments.md §7) as an absolute path, or None."""
    g = getattr(c.args, "garments", None)
    return os.path.abspath(g) if g else None


def chains_doc(c: Ctx) -> dict | None:
    """chains.json of S3g when it plans at least one chain (else None: legacy family, no garment, every piece rigid or tight)."""
    doc = read_json(c.p("chains.json"))
    return doc if isinstance(doc, dict) and doc.get("chains") else None


def body_skeleton(c: Ctx) -> str:
    """The skeleton the BODY skin works on (S6 candidates, S7 selection and finish): skeleton.json itself when it has no chain
    bones (assets without garments: nothing changes), else ``_work/skin/skeleton_body.json`` = skeleton.json without the chain
    bones (CONTRACT "Phase G": body candidates A/B/C do not know the chain bones; the garment overlay replaces their garment rows)."""
    sk = read_json(c.p("skeleton.json")) or {}
    if not any(b.get("chain") for b in sk.get("bones", [])):
        return c.p("skeleton.json")
    body = dict(sk, bones=[b for b in sk["bones"] if not b.get("chain")])
    body.pop("chains", None)
    path = c.p("_work", "skin", "skeleton_body.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    write_json(path, body)
    return path


def _piece_rows(gdoc: dict, chains: dict | None) -> list:
    by_piece: dict = {}
    for ch in (chains or {}).get("chains", []):
        by_piece.setdefault(ch["piece"], []).append(ch)
    rows = []
    for p in gdoc.get("pieces", []):
        chs = by_piece.get(p["id"], [])
        rows.append({"id": p["id"], "class": p.get("class"), "confidence": p.get("confidence"), "n_welded": p.get("n_welded"),
                     "layer": p.get("layer"), "side": p.get("side"), "parent": p.get("parent"), "length_m": p.get("length"),
                     "free_length_m": p.get("free_length"), "width_m": p.get("width"), "merged_into": p.get("merged_into"),
                     "chains_planned": p.get("chains_planned"), "bones_planned": p.get("bones_planned"),
                     "chains": [ch["id"] for ch in chs], "bones": int(sum(len(ch["bones"]) for ch in chs)),
                     "crossing": p.get("crossing"), "reasons": (p.get("reasons") or [])[:3]})
    return rows


def s3g_garments(c: Ctx) -> dict:
    """S3g: solvers/garments.py (classification -> garments.json/.npz) + solvers/chains.py (chain plan -> chains.json with the
    spring hints and colliders). A no-op for the legacy family profile (S_legacy_D01 stays bit-identical). The body model needs a
    resolved skeleton before S4: ``rigkit.skeleton.resolve_skeleton`` (pure Python) with the family's default pre-bend, written to
    ``_work/garments/skeleton_s3g.json`` (S4 applies ``--prebend`` itself; the classifier only needs the limb and torso segments)."""
    if c.family in LEGACY_FAMILIES:
        return {"skipped": True, "why": f"legacy family {c.family}: the garment planner is off (no garments.json / chains.json; S4-S9 "
                                        "run exactly as before)", "pieces": [], "chains": []}
    ov = garments_override(c)
    if ov and not os.path.isfile(ov):
        raise StepFailed("S3g", f"--garments file not found: {ov}")
    from rigcore import template
    from rigkit import skeleton as rsk

    d = c.p("_work", "garments")
    os.makedirs(d, exist_ok=True)
    lm, _ = rsk.load_landmarks_any(c.p("landmarks.json"))
    skel, _, _ = rsk.resolve_skeleton(_family(c), lm, c.H)
    sk = template.save_skeleton(os.path.join(d, "skeleton_s3g.json"), skel)
    args = ["--mesh", c.mesh, "--skeleton", sk, "--analysis", c.p("analysis.json"), "--landmarks", c.p("landmarks.json"), "--family",
            c.family, "--out", c.out]
    if ov:
        args += ["--garments", ov]
    c.call("garments", c.py_cmd("solvers/garments.py", *args), timeout=900)
    c.call("chains", c.py_cmd("solvers/chains.py", "--garments", c.p("garments.json"), "--mesh", c.mesh, "--skeleton", sk, "--out",
                              c.p("chains.json"), "--merged", os.path.join(d, "skeleton_merged.json")), timeout=600)
    g = read_json(c.p("garments.json")) or {}
    ch = read_json(c.p("chains.json")) or {}
    pieces = _piece_rows(g, ch)
    out = {"skipped": False, "override": ov, "override_sha256": sha256_file(ov), "skeleton_s3g": sk,
           "pieces": pieces, "flags": g.get("flags") or [], "coverage": g.get("coverage"),
           "chains": [{"id": x["id"], "class": x["class"], "piece": x["piece"], "side": x.get("side"), "parent": x.get("parent"),
                       "bones": len(x["bones"]), "azimuth_deg": x.get("azimuth_deg"), "fan_root": x.get("fan_root"),
                       "leg_push": bool((x.get("leg_push") or {}).get("enabled"))} for x in ch.get("chains", [])],
           "budget": ch.get("budget") or g.get("budget"), "asymmetry": ch.get("asymmetry") or [], "crossing": ch.get("crossing") or [],
           "notes": ch.get("notes") or [], "garments": c.p("garments.json"), "chains_json": c.p("chains.json"),
           "spring_hints": c.p("chains.json"), "warnings": []}
    for f in out["flags"]:
        out["warnings"].append(f"S3g flag (G2 question): piece {f.get('piece')}: {f.get('why')}")
    for x in out["crossing"]:  # spec 3.2: crossing chains are reordered and the piece is flagged
        out["warnings"].append(f"S3g flag (G2 question): piece {x.get('piece')}: chains crossed, reordered at "
                               + ", ".join(f"{'/'.join(f['chains'])} level {f['level']}" for f in x.get("fixed") or []))
    rec = c.load_recipe()
    rrecipe.log_step(rec, "S3g", {"override": ov, "override_sha256": out["override_sha256"], "family": c.family,
                                  "aux_budget": (out["budget"] or {}).get("aux_budget"),
                                  "skeleton": "rigkit.skeleton.resolve_skeleton (family default pre-bend)"},
                     {"garments": c.p("garments.json"), "garments_sha256": sha256_file(c.p("garments.json")),
                      "chains": c.p("chains.json"), "chains_sha256": sha256_file(c.p("chains.json")),
                      "pieces": [(p["id"], p["class"], p["chains"], p["bones"]) for p in pieces], "budget": out["budget"]})
    c.save_recipe(rec)
    return out


# ==========================================================================================================================
# S4 skeleton, S5 control
# ==========================================================================================================================


def s4_skeleton(c: Ctx) -> dict:
    args = ["--blend", c.blend, "--landmarks", c.p("landmarks.json"), "--family", c.family, "--out-dir", c.out]
    if c.args.prebend:
        args += ["--prebend", c.args.prebend]
    if chains_doc(c):  # phase G: the S3g chain bones join the runtime skeleton
        args += ["--chains", c.p("chains.json")]
    r = c.call("skeleton", c.blender_cmd("rigkit/skeleton.py", *args), timeout=600, ok_codes=(0, 1))
    rep = read_json(c.p("s4_report.json"))
    if rep is None:
        raise StepFailed("S4", "rigkit/skeleton.py wrote no s4_report.json", r["log"])
    b, chk = rep["build"], rep["checks"]
    chains = [{"chain": x.get("chain"), "action": x.get("action"), "before_deg": x.get("angle_before_deg"),
               "after_deg": x.get("angle_after_deg"), "moved_m": x.get("moved_m")} for x in rep["prebend"]["chains"]]
    out = {"bones": b.get("bones"), "bend_tests": f"{b.get('bend_tests_passed')}/{b.get('bend_tests_total')}",
           "flipped": b.get("flipped"), "checks_ok": chk.get("ok"), "core_outside": chk.get("core_outside"),
           "core_outside_not_exempt": chk.get("core_outside_not_exempt"), "aux_outside": chk.get("aux_outside"),
           "symmetry": chk.get("symmetry"), "prebend": chains, "exempt": chk.get("exempt"), "skeleton": c.p("skeleton.json")}
    if rep.get("chains"):
        rb = rep["chains"].get("root_bend_tests") or []
        npass = sum(1 for x in rb if x.get("passed"))
        out["chains"] = {"n_chains": rep["chains"].get("n_chains"), "n_bones": rep["chains"].get("n_bones"),
                         "root_bend_tests": f"{npass}/{len(rb)}", "source": rep["chains"].get("source")}
        out["core_bend_tests"] = f"{(b.get('bend_tests_passed') or 0) - npass}/{(b.get('bend_tests_total') or 0) - len(rb)}"
    ok = not _checks_failed(c, r, "S4")
    out["warnings"] = _ok_or_keep_going(c, "S4", ok, "S4 checks failed", r["log"],
                                        {"bend_tests": out["bend_tests"], "core_outside_not_exempt": out["core_outside_not_exempt"],
                                         "checks_ok": out["checks_ok"]})
    out["keep_going"] = list(out["warnings"])
    return out


def s5_control(c: Ctx) -> dict:
    extra = ["--chains", c.p("chains.json")] if chains_doc(c) else []  # phase G: chain FK controls + leg push from the plan
    r = c.call("control", c.blender_cmd("rigkit/control.py", "--blend", c.blend, "--out-dir", c.out, *extra), timeout=900,
               ok_codes=(0, 1))
    s5 = read_json(c.p("s5_report.json"))
    if s5 is None:
        raise StepFailed("S5", "rigkit/control.py wrote no s5_report.json", r["log"])
    poles = {k: {"angle_deg": v.get("angle_deg"), "dev_rad": v.get("dev_rad")} for k, v in (s5.get("pole_angles") or {}).items()}
    warn = _ok_or_keep_going(c, "S5", not _checks_failed(c, r, "S5"), "S5 control rig checks failed (pole deviation or coupling)",
                             r["log"], {"poles": poles, "coupling": (s5.get("coupling") or {}).get("rest_max_diff")})
    f = c.call("functest", c.blender_cmd("rigkit/functest.py", "--blend", c.blend, "--mode", "auto", "--out",
                                         c.p("checks", "rig_function.json")), timeout=900, ok_codes=(0, 1))
    fun = read_json(c.p("checks", "rig_function.json"))
    if fun is None:
        raise StepFailed("S5", "rigkit/functest.py wrote no rig_function.json", f["log"])
    failed = [t.get("id") or t.get("test") for t in fun.get("tests", []) if not t.get("pass")]
    failed_x = [t.get("id") or t.get("test") for t in fun.get("extra_tests", []) if not t.get("pass")]
    out = {"bones": s5.get("bones"), "pole_angles": poles, "coupling_rest_max": (s5.get("coupling") or {}).get("rest_max_diff"),
           "builder_source": (s5.get("builder_source") or {}).get("source"),
           "functest": {"mode": fun.get("mode"), "passed": fun.get("passed"), "total": fun.get("total"),
                        "extra_passed": fun.get("extra_passed"), "extra_total": fun.get("extra_total"),
                        "extremes_finite": fun.get("pose_extremes_all_finite"), "failed": failed, "extra_failed": failed_x}}
    warn += _ok_or_keep_going(c, "S5", not _checks_failed(c, f, "S5.functest"), "S5 function tests failed", f["log"],
                              {"failed": failed, "extra_failed": failed_x})
    if s5.get("chains"):
        cr = s5["chains"]
        out["chains"] = {"pushed": cr.get("pushed"), "skipped": cr.get("skipped"), "draped": cr.get("draped"), "file": cr.get("file"),
                         "push": {x.get("chain"): {"enabled": bool((x.get("push") or {}).get("enabled")) and "push_bone" in x,
                                                   "max_deg": (x.get("push") or {}).get("max_deg"),
                                                   "drape": (x.get("drape") or {}).get("drape")}
                                  for x in cr.get("chains") or [] if isinstance(x, dict)}}
    out["warnings"] = warn
    out["keep_going"] = list(warn)
    return out


# ==========================================================================================================================
# S6 skin candidates
# ==========================================================================================================================


def skin_rules_file(c: Ctx) -> dict:
    """``skin_rules.json`` of the rig: ``--skin-rules`` when given; D01's legacy rules only for the legacy family profile; else the
    generic (empty) rules: defaults of the candidate modules, side planes from the skeleton, no regions / rigid islands."""
    dst = c.p("skin_rules.json")
    if c.args.skin_rules:
        shutil.copy2(os.path.abspath(c.args.skin_rules), dst)
        kind = f"given: {os.path.abspath(c.args.skin_rules)}"
    elif c.family in LEGACY_FAMILIES:
        shutil.copy2(LEGACY_RULES, dst)
        kind = f"legacy profile: {LEGACY_RULES}"
    else:
        write_json(dst, {"schema": 0, "asset_id": c.asset, "note": "generic rules written by scripts/pipeline.py: no asset-specific "
                                                                    "regions, rigid islands or classes; candidate defaults, side "
                                                                    "planes from the skeleton (references/skinning.md)"})
        kind = "generic (no asset rules)"
    return {"path": dst, "kind": kind, "sha256": sha256_file(dst)}


def _cand_summary(path_json: str) -> dict:
    rep = read_json(path_json) or {}
    inv = ((rep.get("enforce") or {}).get("invariants")) or {}
    leak = rep.get("limb_leak") or {}
    out = {"solver_seconds": rep.get("seconds"), "invariants": {k: inv.get(k) for k in ("sum_err_max", "empty", "max_influences")},
           "limb_leak_rows": leak.get("rows"), "limb_leak_over_band": leak.get("over_band"),
           "rounds": ((rep.get("rounds") or {}).get("rounds")), "converged": ((rep.get("rounds") or {}).get("converged"))}
    for k in ("proxy", "transfer", "inpaint", "unirig", "fill", "order"):
        if isinstance(rep.get(k), dict):
            out[k] = {kk: vv for kk, vv in rep[k].items() if isinstance(vv, (int, float, str, bool)) or vv is None}
    return out


def s6_skin(c: Ctx) -> dict:
    rules = skin_rules_file(c)
    d = c.p("_work", "skin")
    os.makedirs(d, exist_ok=True)
    sk = body_skeleton(c)  # body candidates never see the chain bones (phase G)
    common = ["--mesh", c.mesh, "--skeleton", sk, "--rules", rules["path"]]
    jobs = [("A", "solvers/skin_region.py", []),
            ("B", "solvers/skin_transfer.py", []),
            ("C", "solvers/skin_unirig.py", ["--unirig-dir", c.p("_work", "unirig"), "--fill-from", os.path.join(d, "B.npz")])]
    out = {"rules": rules, "candidates": {}}
    for name, script, extra in jobs:
        npz, rep = os.path.join(d, f"{name}.npz"), os.path.join(d, f"{name}.json")
        r = c.call(f"candidate_{name}", c.py_cmd(script, *common, *extra, "--out", npz, "--report", rep), timeout=3600)
        out["candidates"][name] = {"file": npz, "report": rep, "sha256": sha256_file(npz), "seconds": r["seconds"],
                                   **_cand_summary(rep)}
    params = {"rules": rules, "modules": {n: s_ for n, s_, _ in jobs}, "c_fill_from": "B"}
    if chains_doc(c):  # phase G: the garment overlay (cloth-and-attachments.md §5); applied after the S7 selection
        gd = os.path.join(d, "garment")
        r = c.call("garment_overlay", c.py_cmd("solvers/skin_garment.py", "--mesh", c.mesh, "--garments", c.p("garments.json"),
                                               "--chains", c.p("chains.json"), "--skeleton", sk, "--out", gd), timeout=1800)
        out["garment_overlay"] = {"file": os.path.join(gd, "garment_overlay.npz"), "rules": os.path.join(gd, "garment_rules.json"),
                                  "sha256": sha256_file(os.path.join(gd, "garment_overlay.npz")), "seconds": r["seconds"],
                                  **{k: v for k, v in (r["summary"] or {}).items() if k in ("rows_overlay", "rows_band", "inner_rows")}}
        out["body_skeleton"] = sk
        params["garment_overlay"] = "solvers/skin_garment.py"
    rec = c.load_recipe()
    rrecipe.log_step(rec, "S6", params,
                     {n: {k: v.get(k) for k in ("file", "sha256", "limb_leak_rows", "invariants")} for n, v in out["candidates"].items()}
                     | ({"garment_overlay": out["garment_overlay"]} if out.get("garment_overlay") else {}))
    c.save_recipe(rec)
    return out


# ==========================================================================================================================
# S7 poses, metrics, selection, final weights
# ==========================================================================================================================


def _import_weights(c: Ctx, name: str, blend: str, weights: str) -> dict:
    """rigkit/skin_io.py import (writer B) on ``blend``: the vertex groups of the mesh become ``weights``; saved in place, without a
    ``.blend1`` backup (the snapshots keep every state)."""
    obj = rig_names(c)["mesh"]
    return c.call(name, c.blender_cmd("rigkit/skin_io.py", "import", "--object", obj, "--weights", weights, "--save", blend,
                                      "--overwrite", blend=blend), timeout=600)


def _poses(c: Ctx, name: str, blend: str, out_dir: str, skeleton: str | None = None) -> dict:
    """rigkit/poses.py rom set. ``skeleton`` plans the poses: skeleton.json (default; with chain bones it adds the garment compounds
    and chain poses) or the body skeleton (the S7 scoring pass: the body ROM set as before)."""
    nm = rig_names(c)
    r = c.call(name, c.blender_cmd("rigkit/poses.py", "--blend", blend, "--set", "rom", "--skeleton", skeleton or c.p("skeleton.json"),
                                   "--out-dir", out_dir, "--mesh", nm["mesh"], "--runtime", nm["runtime"], "--control", nm["control"],
                                   "--asset-id", c.asset, "--H", c.H), timeout=1800)
    return r["summary"] or {}


def render_pose_subset(poses_npz: str, cloth: bool = False) -> list:
    """Poses for the S9 pose sheets: rest, every compound pose, and the extreme ROM samples of the left side and the centre
    (the right side mirrors them; every pose stays in poses.npz / metrics and the flag sheet picks the worst ones anyway).
    ``cloth`` (phase G) adds the poses tagged ``garment`` or ``chain`` (the cloth pose sheets)."""
    from rigcore import npzio

    po = npzio.load_poses(poses_npz)
    names = [str(n) for n in po["names"]]
    tags = (po["meta"] or {}).get("tags") or {}
    keep = []
    for n in names:
        t = set(tags.get(n, []))
        if n == "rest" or "compound" in t or ("extreme" in t and not re.search(r"_R(_|$)", n)) or (cloth and {"garment", "chain"} & t):
            keep.append(n)
    return keep


def s7_select(c: Ctx) -> dict:
    nm = rig_names(c)
    sk_full, rules = c.p("skeleton.json"), c.p("skin_rules.json")
    garm = chains_doc(c) is not None  # phase G: chain bones in the rig, garment overlay after the selection
    sk = body_skeleton(c)
    d = c.p("_work", "skin")
    A, B, C = (os.path.join(d, f"{x}.npz") for x in "ABC")
    for f in (A, B, C, rules) + ((os.path.join(d, "garment", "garment_overlay.npz"),) if garm else ()):
        if not os.path.isfile(f):
            raise StepFailed("S7", f"missing S6 output {f}: run from S6")
    # ---- scoring pass: candidate A in a copy of the rig is the primary (its dominant bones fix the regions)
    sd = c.p("_work", "s7_scoring")
    os.makedirs(sd, exist_ok=True)
    sblend = os.path.join(sd, f"{c.asset}_scoring.blend")
    shutil.copy2(c.blend, sblend)
    _import_weights(c, "scoring_import_A", sblend, A)
    ps = _poses(c, "scoring_poses", sblend, sd, skeleton=sk)  # body ROM set (no garment compounds / chain poses)
    exempt = inside_exempt(c)
    if garm:  # chain bones are aux bones at mid-thickness of thin cloth, not core joints: listed as exempt, never hidden
        exempt = exempt + [b["name"] for b in (read_json(sk_full) or {}).get("bones", []) if b.get("chain") and b["name"] not in exempt]
    mx = ["--exempt-heads", ",".join(exempt)] if exempt else []
    gx = ["--garment-rows", c.p("garments.npz")] if garm else []  # region scores ignore the garment rows (the overlay owns them)
    c.call("scoring_metrics", c.py_cmd("solvers/metrics.py", "--mesh", os.path.join(sd, "mesh.npz"), "--poses",
                                       os.path.join(sd, "poses.npz"), "--weights", os.path.join(sd, "weights.npz"), "--out-dir",
                                       os.path.join(sd, "metrics"), "--no-fields", "--candidate-file", A, "--candidate-file", B,
                                       "--candidate-file", C, *mx, *gx), timeout=7200)
    md = os.path.join(sd, "metrics")
    sel, sel_rep = os.path.join(d, "selected.npz"), os.path.join(d, "selected.json")
    args = ["--mesh", c.mesh, "--skeleton", sk, "--rules", rules, "--candidate", f"A={A}", "--candidate", f"B={B}", "--candidate",
            f"C={C}", "--scores", os.path.join(md, "region_scores.json"), "--regions", os.path.join(md, "regions.npz"), "--detail",
            os.path.join(md, "region_scores_detail.json"), "--out", sel, "--report", sel_rep]
    if os.path.isfile(c.p("weights_override.json")):
        args += ["--overrides", c.p("weights_override.json")]
    c.call("select", c.py_cmd("solvers/skin_select.py", *args), timeout=1800)
    # ---- finish: profiles + enforce to a fixed point on every row -> the rig's weights.npz (with garments: the body weights, then
    # the garment overlay blended over them and finished again by solvers/skin_garment.py apply_overlay)
    body_out = os.path.join(d, "final_body.npz") if garm else c.p("weights.npz")
    fin = c.call("finish", c.py_cmd("pipeline_steps/finish.py", "--mesh", c.mesh, "--skeleton", sk, "--rules", rules, "--weights", sel,
                                    "--out", body_out, "--report", c.p("checks", "s7_finish.json")), timeout=1800)
    garment = None
    if garm:
        gd = os.path.join(d, "garment_final")
        g = c.call("garment_apply", c.py_cmd("solvers/skin_garment.py", "--mesh", c.mesh, "--garments", c.p("garments.json"), "--chains",
                                             c.p("chains.json"), "--skeleton", sk, "--weights", body_out, "--rules", rules, "--out", gd),
                   timeout=1800)
        shutil.copy2(os.path.join(gd, "weights_garment.npz"), c.p("weights.npz"))
        chk = read_json(os.path.join(gd, "overlay_check.json")) or {}
        garment = {"weights": c.p("weights.npz"), "body_weights": body_out, "overlay_check": os.path.join(gd, "overlay_check.json"),
                   "rows_overlay": (g["summary"] or {}).get("rows_overlay"), "rows_band": (g["summary"] or {}).get("rows_band"),
                   "finish_rounds": (g["summary"] or {}).get("finish_rounds"), "converged": (g["summary"] or {}).get("converged"),
                   "check": {k: v for k, v in chk.items() if k != "limb_leak"}, "limb_leak_rows": chk.get("limb_leak")}
        write_json(c.p("checks", "s7_garment.json"), garment)
        if not chk.get("ok"):
            raise StepFailed("S7", f"garment overlay invariants failed: {garment['check']}", g["log"])
    # ---- final weights into the rig, poses and metrics of the final weights
    _import_weights(c, "final_import", c.blend, c.p("weights.npz"))
    fd = c.p("_work", "s7_final")
    pf = _poses(c, "final_poses", c.blend, fd)  # skeleton.json: with chains also the garment compounds and the chain poses
    gm = ["--garments", c.p("garments.npz"), "--garments-json", c.p("garments.json"), "--skeleton", sk_full] if garm else []
    c.call("final_metrics", c.py_cmd("solvers/metrics.py", "--mesh", os.path.join(fd, "mesh.npz"), "--poses", os.path.join(fd, "poses.npz"),
                                     "--weights", os.path.join(fd, "weights.npz"), "--out-dir", c.p("checks", "metrics"), *mx, *gm),
           timeout=7200)
    srep = read_json(sel_rep) or {}
    met = read_json(c.p("checks", "metrics", "metrics.json")) or {}
    detail = read_json(os.path.join(md, "region_scores_detail.json")) or {}
    scores = read_json(os.path.join(md, "region_scores.json")) or {}
    out = {"scoring": {"poses": ps.get("n_poses"), "emulation_vs_source_max_m": ps.get("emulation_vs_source_max_m"),
                       "metrics": md, "candidates_scored": sorted({k for v in scores.values() for k in (v or {})})},
           "selection": {"choice": srep.get("choice"), "default": srep.get("default"), "vertices_per_candidate":
                         srep.get("vertices_per_candidate"), "flag_g2": srep.get("flag_g2"), "not_exercised": srep.get("not_exercised"),
                         "leak_dropped": (srep.get("leak_gate") or {}).get("dropped"), "unmatched_score_keys":
                         srep.get("unmatched_score_keys"), "band_vertices": srep.get("band_vertices"), "report": sel_rep},
           "finish": fin["summary"], "final": {"poses": pf.get("n_poses"), "emulation_vs_source_max_m": pf.get("emulation_vs_source_max_m"),
                                                 "metrics": c.p("checks", "metrics", "metrics.json"), "lights": met.get("lights")},
           "region_decisions": {r: (v.get("decision") or {}) for r, v in (detail.get("regions") or {}).items()},
           "weights": c.p("weights.npz")}
    if garm:
        out["garment"] = garment
        out["final"]["garments"] = {k: v for k, v in ((met.get("summary") or {}).get("garments") or {}).items()
                                    if k in ("pieces", "bleed_rows", "chain_coverage", "chain_regions_not_exercised")}
    rec = c.load_recipe()
    cands = ((c.state["steps"].get("S6") or {}).get("summary") or {}).get("candidates") or {}
    rec["skin"]["candidates"] = [{"name": k, "file": v.get("file"), "sha256": v.get("sha256"), "report": v.get("report")}
                                 for k, v in cands.items()] or [{"name": x, "file": os.path.join(d, f"{x}.npz")} for x in "ABC"]
    rec["skin"]["choice"] = srep.get("choice") or {}
    rec["skin"]["params"] = {"rules": rules, "rules_sha256": sha256_file(rules), "select": {"band": srep.get("band_rings"),
                             "default": srep.get("default"), "rule_candidate": srep.get("rule_candidate"),
                             "scores": os.path.join(md, "region_scores.json"), "leak_gate": True},
                             "scoring_primary": "A (candidate A imported into a copy of the rig)",
                             "finish": {"change_max": (fin["summary"] or {}).get("change_max"),
                                        "fixed_point": (fin["summary"] or {}).get("fixed_point")},
                             "final_weights": c.p("weights.npz"), "final_weights_sha256": sha256_file(c.p("weights.npz"))}
    if garm:
        rec["skin"]["params"]["garment_overlay"] = {"module": "solvers/skin_garment.py (apply_overlay after the body finish)",
                                                    "body_skeleton": sk, "body_weights": body_out,
                                                    "body_weights_sha256": sha256_file(body_out),
                                                    "scoring_ignores_garment_rows": True}
    rec["skin"]["overrides"] = read_json(c.p("weights_override.json"), {}) or {}
    rrecipe.log_step(rec, "S7", {"pose_set": "rom", "candidates": ["A", "B", "C"], "exempt_heads": exempt},
                     {"selection": out["selection"], "finish": out["finish"], "final_lights": out["final"]["lights"]})
    c.save_recipe(rec)
    return out


# ==========================================================================================================================
# S8 export + parity
# ==========================================================================================================================


def s8_export(c: Ctx) -> dict:
    nm = rig_names(c)
    r = c.call("export_validate", c.blender_cmd("rigkit/export.py", "--blend", c.blend, "--source-glb", c.glb, "--H", c.H, "--out-dir",
                                                c.p("checks"), "--skeleton", c.p("skeleton.json"), "--asset-id", c.asset),
               timeout=1200, ok_codes=(0, 1))
    val = read_json(c.p("checks", "validation.json"))
    if val is None:
        raise StepFailed("S8", "rigkit/export.py wrote no validation.json", r["log"])
    failed_checks = _checks_failed(c, r, "S8")
    errs = val.get("errors") or []
    if val.get("export") is None or errs:  # could not export or validate: not a failed A1 check, never continued (review M2)
        why = "; ".join(f"{e.get('part')}: {e.get('error')}" for e in errs) or "no test GLB exported"
        raise StepFailed("S8", f"rigkit/export.py could not export or validate the test GLB ({why[:400]}); checks not measured "
                               "are not reported as failed A1 checks", r["log"])
    a1, ex = val.get("A1_summary") or {}, val.get("extra_summary") or {}
    pd = c.p("checks", "parity")
    fd = c.p("_work", "s7_final")
    poses, mesh = os.path.join(fd, "poses.npz"), os.path.join(fd, "mesh.npz")
    c.call("parity_blender", c.blender_cmd("rigkit/parity.py", "--blend", c.blend, "--poses", poses, "--out-dir", pd, "--mesh", nm["mesh"],
                                           "--runtime", nm["runtime"]), timeout=1800)
    pc = c.call("parity_cmp", c.py_cmd("solvers/parity_cmp.py", "--poses", poses, "--mesh", mesh, "--reimport",
                                       os.path.join(pd, "reimport_poses.npz"), "--out", os.path.join(pd, "parity.json")),
                timeout=900, ok_codes=(0, 2))
    par = read_json(os.path.join(pd, "parity.json")) or {}
    out = {"A1": {k: a1.get(k) for k in ("checks", "passed", "failed")}, "extra": {k: ex.get(k) for k in ("checks", "passed", "failed")},
           "errors": [f"{e.get('part')}: {e.get('error')}" for e in val.get("errors", [])],
           "test_glb": (val.get("export") or {}).get("path"), "test_glb_sha256": (val.get("export") or {}).get("sha256"),
           "validation": c.p("checks", "validation.json"),
           "parity": {"pass": par.get("pass"), "max_m": par.get("max_m"), "tolerance_m": par.get("tolerance_m"),
                      "unmatched_glb_vertices": par.get("unmatched_glb_vertices"),
                      "welded_covered": f"{par.get('welded_ids_covered')}/{par.get('n_welded_source')}",
                      "weights_check_ok": par.get("weights_check_ok"), "bone_fit_max": par.get("bone_fit_max"),
                      "n_poses": len(par.get("per_pose") or {}), "file": os.path.join(pd, "parity.json")},
           "warnings": []}
    if failed_checks:
        out["warnings"].append(f"validation: A1 failed {a1.get('failed')}, extras failed {ex.get('failed')} (reported, not fixed)")
    if pc["exit"] != 0:
        out["warnings"].append(f"runtime parity failed: max {par.get('max_m')} m > tolerance {par.get('tolerance_m')} m")
    return out


# ==========================================================================================================================
# S9 package
# ==========================================================================================================================


def s9_package(c: Ctx) -> dict:
    fd = c.p("_work", "s7_final")
    md = c.p("checks", "metrics")
    qa = c.p("qa")
    os.makedirs(qa, exist_ok=True)
    garm = chains_doc(c) is not None  # phase G: garment sheet + cloth pose sheets
    only = render_pose_subset(os.path.join(fd, "poses.npz"), cloth=garm)
    common = ["--poses", os.path.join(fd, "poses.npz"), "--fields", os.path.join(md, "vertex_fields.npz"), "--metrics",
              os.path.join(md, "metrics.json"), "--out-dir", qa]
    what = c.args.render_what
    gargs = []
    if garm:
        what = ",".join([w for w in what.split(",") if w] + [w for w in ("garments", "cloth") if w not in what.split(",")])
        gargs = ["--garments", c.p("garments.npz"), "--mesh-npz", c.mesh]
    plan = c.call("render_plan", c.blender_cmd("rigkit/render.py", "plan", "--blend", c.blend, *common, "--what",
                                               what, "--only", ",".join(only), *gargs), timeout=600)
    chunks = (plan["summary"] or {}).get("chunks") or []
    if not chunks:
        raise StepFailed("S9", "render plan returned no chunks", plan["log"])
    secs = []
    for i0, i1 in chunks:
        r = c.call(f"render_chunk_{i0:04d}", c.blender_cmd("rigkit/render.py", "chunk", "--blend", c.blend, "--out-dir", qa, "--i0", i0,
                                                          "--i1", i1), timeout=600)
        secs.append(r["seconds"])
    c.call("render_finish", c.py_cmd("rigkit/render.py", "finish", "--out-dir", qa), timeout=300)
    comp = c.call("render_compose", c.py_cmd("rigkit/render.py", "compose", "--out-dir", qa, "--poses", os.path.join(fd, "poses.npz"),
                                             "--metrics", os.path.join(md, "metrics.json"),
                                             *(["--garments-json", c.p("garments.json")] if garm else [])), timeout=1800)
    sheets = [s if os.path.isabs(str(s)) else os.path.join(qa, str(s)) for s in ((comp["summary"] or {}).get("sheets") or [])]
    report.sync_test_markers(c)  # TEST_ONLY.md in the rig folder and in qa/ for --test-auto-vision and --keep-going (review M1)
    if os.path.isfile(c.p("checks", "validation.json")):
        shutil.copy2(c.p("checks", "validation.json"), c.p("validation.json"))
    out = {"render": {"n_jobs": (plan["summary"] or {}).get("n_jobs"), "chunks": len(chunks), "chunk_seconds": secs,
                      "max_chunk_seconds": max(secs) if secs else None, "pose_subset": only, "sheets": sheets,
                      "flag_sheet": next((s for s in sheets if os.path.basename(str(s)).startswith("qa_flag_sheet")), None)},
           "validation": c.p("validation.json")}
    if garm:
        out["render"]["what"] = what
        out["render"]["garment_sheet"] = next((s for s in sheets if os.path.basename(str(s)).startswith("qa_garment_sheet")), None)
        out["render"]["cloth_sheets"] = [s for s in sheets if os.path.basename(str(s)).startswith("qa_cloth_poses")]
    out["report"] = report.qa_report(c, out)
    rec = c.load_recipe()
    rrecipe.log_step(rec, "S9", {"what": c.args.render_what, "pose_subset": len(only)},
                     {"qa": qa, "sheets": len(sheets), "flag_sheet": out["render"]["flag_sheet"], "qa_report": out["report"],
                      "validation": c.p("validation.json")})
    c.save_recipe(rec)
    return out


STEP_FUNCS = {"S0": s0_open, "S1": s1_analyse, "S2": s2_normalize, "S3": s3_landmarks, "S3g": s3g_garments, "S4": s4_skeleton,
              "S5": s5_control, "S6": s6_skin, "S7": s7_select, "S8": s8_export, "S9": s9_package}
assert tuple(STEP_FUNCS) == STEPS and set(BLEND_STEPS) <= set(STEPS)


# ==========================================================================================================================
# input fingerprints (review M3; pipeline_steps/inputs.py)
# ==========================================================================================================================

#: per step: the module CLIs it calls and the modules it imports in the driver process; ``inputs.scripts_closure`` adds their in-tree
#: imports (and quoted in-tree files such as thresholds.json); the step functions themselves go into ``code``
STEP_SCRIPTS = {
    "S0": ["solvers/glbmesh.py", "rigcore/recipe.py"],
    "S1": ["solvers/glbmesh.py", "solvers/analysis.py"],
    "S2": ["rigkit/intake.py", "rigcore/npzio.py", "rigcore/recipe.py"],
    "S3": ["solvers/landmarks_geo.py", "solvers/unirig_bridge.py", "solvers/consensus.py", "rigkit/render.py", "rigcore/npzio.py",
           "rigcore/recipe.py"],
    "S3g": ["solvers/garments.py", "solvers/chains.py", "rigkit/skeleton.py", "rigcore/template.py", "rigcore/landmarks.py",
            "rigcore/recipe.py"],
    "S4": ["rigkit/skeleton.py"],
    "S5": ["rigkit/control.py", "rigkit/functest.py"],
    "S6": ["solvers/skin_region.py", "solvers/skin_transfer.py", "solvers/skin_unirig.py", "solvers/skin_garment.py",
           "rigcore/recipe.py"],
    "S7": ["rigkit/skin_io.py", "rigkit/poses.py", "solvers/metrics.py", "solvers/skin_select.py", "pipeline_steps/finish.py",
           "solvers/skin_garment.py", "rigkit/bl.py", "rigcore/template.py", "rigcore/npzio.py", "rigcore/recipe.py"],
    "S8": ["rigkit/export.py", "rigkit/parity.py", "solvers/parity_cmp.py", "rigkit/bl.py"],
    "S9": ["rigkit/render.py", "rigcore/npzio.py", "rigcore/recipe.py", "solvers/thresholds.json"],
}
assert tuple(STEP_SCRIPTS) == STEPS
FAMILY_STEPS = ("S1", "S2", "S3", "S3g", "S4", "S7")  # steps that read the family template (its JSON files, extends chain included)


def _norm(path):
    return os.path.normcase(os.path.abspath(path)) if path else None


def vision_file(c: Ctx) -> str | None:
    """The vision decisions S3 consumes: ``--vision-decisions`` when given (S3 copies it into the rig folder), else the copy there."""
    if c.args.vision_decisions:
        return os.path.abspath(c.args.vision_decisions)
    return c.p("vision_decisions.json") if os.path.isfile(c.p("vision_decisions.json")) else None


def skin_rules_source(c: Ctx) -> tuple:
    """(kind, file) of the skin rules S6 copies into the rig folder (``skin_rules_file``)."""
    if c.args.skin_rules:
        return "given", os.path.abspath(c.args.skin_rules)
    if c.family in LEGACY_FAMILIES:
        return "legacy", LEGACY_RULES
    return "generic", None


def family_files(c: Ctx) -> dict:
    try:
        files = _family(c).get("_files") or []
    except Exception as e:  # the step itself reports a broken template
        return {"family": f"unreadable: {type(e).__name__}: {e}"}
    return {f"family:{os.path.basename(f)}": sha256_file(f) for f in files}


def step_inputs(c: Ctx, step: str) -> dict:
    """The input fingerprint of ``step`` with the current arguments and files (pipeline_steps/inputs.py): recorded before the step
    runs; a resume compares it with the recorded one and refuses to start after a step whose inputs changed."""
    from pipeline_steps import inputs as I

    a = c.args
    args, files = {}, {}
    if step == "S0":  # --sha256 only checks the GLB; its content is the input
        args = {"blender": _norm(c.blender)}
        files = {"glb": sha256_file(c.glb)}
    elif step == "S1":
        args = {"requires_fingers": bool(a.requires_fingers)}
    elif step == "S3":  # the UniRig output by content (--unirig-out may move it)
        files = {"unirig_rigged": sha256_file(unirig_rigged(c)), "vision_decisions": sha256_file(vision_file(c)),
                 "landmarks_override": sha256_file(c.p("landmarks_override.json"))}
    elif step == "S3g":  # the --garments override by content (cloth-and-attachments.md §7: a change makes S3g and every later step stale)
        ov = garments_override(c)
        args = {"garments": "given" if ov else None}
        files = {"garments_override": sha256_file(ov) if ov else None}
    elif step == "S4":
        try:
            pb = json.dumps(json.loads(a.prebend), sort_keys=True) if a.prebend else None
        except ValueError:
            pb = a.prebend
        args = {"prebend": pb}
    elif step == "S6":
        kind, f = skin_rules_source(c)
        args = {"skin_rules": kind}
        files = {"skin_rules": sha256_file(f) if f else "generic"}
    elif step == "S7":
        files = {"weights_override": sha256_file(c.p("weights_override.json"))}
    elif step == "S9":
        args = {"render_what": a.render_what}
    if step in FAMILY_STEPS:
        files.update(family_files(c))
    return {"args": args, "files": files, "scripts": I.scripts_closure(STEP_SCRIPTS[step]),
            "code": I.code_sha(STEP_FUNCS[step], [sys.modules[__name__], report])}


def stale_steps(c: Ctx, state: dict, upto: int) -> dict:
    """{step: [what changed]} for the done steps among ``STEPS[:upto]`` whose recorded input fingerprint differs from the current
    one (a state written before I5 has none: every done step counts as stale)."""
    from pipeline_steps import inputs as I

    out = {}
    for s in STEPS[:upto]:
        r = state["steps"].get(s) or {}
        if r.get("status") != "done":
            continue
        try:
            d = I.diff(r.get("inputs") if isinstance(r.get("inputs"), dict) else None, step_inputs(c, s))
        except Exception as e:  # cannot tell: never reuse
            d = [f"could not compute the current fingerprint: {type(e).__name__}: {e}"]
        if d:
            out[s] = d
    return out

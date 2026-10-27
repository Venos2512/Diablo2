r"""Owner C, Blender test: rigkit.render on the synthetic rig of C_synthetic_rig.py - one-shot vs chunked rendering, hot-spot
cluster close-ups, the one-page flag sheet (incl. an X-ray tile) and the file state after rendering.

Steps: build + save the rig, fold the tube back 170 deg at b3 (b4 lies inside b1: penetrations between non-adjacent regions) -> ``poses.export_current`` ->
``solvers/metrics.py`` (rigkit-env subprocess) -> ``render.render_current`` (one shot) and ``render.plan_current`` +
``render.render_chunk`` per range + ``render.finish_chunks`` (chunked, the MCP path) -> ``render.py compose`` (rigkit-env).
Checks: both paths produce the same shot list and pixel-identical PNGs (bytes differ: Blender stamps metadata such as the
render time into each file); every chunk call stays under 20 s; the plan has cluster
close-ups and flag tiles (red metrics first, an X-ray tile with dots for the penetration); the file state is unchanged after both
paths; compose writes ``qa_flag_sheet.jpg``.

Run: blender -b --factory-startup -P C_test_render_chunks.py -- [--out E:\tmp_rigkit\C_r3\tests]   (one JSON line; exit 1 on failure)
"""
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
for p in (SCRIPTS, HERE):
    sys.path.insert(0, p)
sys.dont_write_bytecode = True

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import C_synthetic_rig as SR  # noqa: E402
from rigcore import npzio  # noqa: E402
from rigkit import poses as RP, render as R  # noqa: E402

RIGKIT_PY = r"E:\tools\rigkit-env\Scripts\python.exe"
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = args[args.index("--out") + 1] if "--out" in args else r"E:\tmp_rigkit\C_r3\tests"
OUT = os.path.join(OUT, "render_chunks")
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
checks = {}


def check(name, ok, **kw):
    checks[name] = {"pass": bool(ok), **kw}


def rot(bone, axis, deg):
    return {"op": "local_rot", "bones": [bone], "axis": axis, "deg": deg}


SPECS = [RP.rest_spec(),
         {"name": "bend", "kind": "rom", "ik": "default", "ops": [rot("b3", "Z", 40.0)], "tags": ["standard"]},
         {"name": "fold", "kind": "rom", "ik": "default", "ops": [rot("b3", "Z", 170.0)], "tags": ["extreme"]}]
WHAT = ("skel", "weights", "bones", "poses", "stretch", "pen", "closeups", "flags")

try:
    arm, src, names = SR.build()
    SR.save(os.path.join(OUT, "rig.blend"))
    pdir = os.path.join(OUT, "poses")
    res = RP.export_current(pdir, "custom", mesh=src.name, runtime=arm.name, control=arm.name, asset_id="synthetic", H=0.2,
                            specs=SPECS)
    mdir = os.path.join(OUT, "metrics")
    p = subprocess.run([RIGKIT_PY, "-I", "-B", os.path.join(SCRIPTS, "solvers", "metrics.py"), "--mesh", res["mesh"], "--poses",
                        res["poses"], "--weights", res["weights"], "--out-dir", mdir], capture_output=True, text=True)
    met = npzio.read_json(os.path.join(mdir, "metrics.json"))
    check("metrics_ran", p.returncode == 0, lights=met["lights"], stderr=p.stderr[-300:])
    fields, metrics = os.path.join(mdir, "vertex_fields.npz"), os.path.join(mdir, "metrics.json")
    snap0 = RP.FileState().as_dict()
    one = os.path.join(OUT, "one")
    r1 = R.render_current(res["poses"], one, fields, metrics, WHAT)
    check("state_after_one_shot", RP.FileState().as_dict() == snap0, seconds=r1["seconds"], n=r1["n_images"])
    ch = os.path.join(OUT, "chunked")
    pl = R.plan_current(res["poses"], ch, fields, metrics, WHAT, max_seconds=3.0)
    times = []
    for i0, i1 in pl["chunks"]:
        times.append(R.render_chunk(ch, i0, i1)["seconds"])
    fin = R.finish_chunks(ch)
    check("state_after_chunks", RP.FileState().as_dict() == snap0)
    check("chunks_under_20s", len(times) >= 2 and max(times) < 20.0, chunk_seconds=times, ranges=pl["chunks"])
    i1_ = npzio.read_json(os.path.join(one, "info.json"))
    i2_ = npzio.read_json(os.path.join(ch, "info.json"))
    same_names = sorted(i1_["views"]) == sorted(i2_["views"])
    diff = []
    for nm in sorted(i1_["views"]):
        ims = [bpy.data.images.load(os.path.join(d, "raw", nm + ".png"), check_existing=False) for d in (one, ch)]
        a, b = (np.array(im.pixels[:], dtype=np.float32) for im in ims)
        if a.shape != b.shape or float(np.abs(a - b).max()) > 0.0:
            diff.append(nm)
        for im in ims:
            bpy.data.images.remove(im)
    check("chunked_equals_one_shot", same_names and not diff and fin["n_images"] == r1["n_images"], n_images=r1["n_images"],
          differing=diff[:10])
    cu = i1_["closeups"]
    check("closeups_per_cluster", len(cu) >= 1 and all("__c" in k for k in cu)
          and all(f"cut_{k}_front" in i1_["views"] for k in cu), closeups={k: {kk: v[kk] for kk in ("pose", "cluster", "n_vertices")}
                                                                          for k, v in cu.items()})
    fl = i1_["flags"]
    red = [k for k, v in met["lights"].items() if v == "red"]
    pen_t = [t for t in fl if t["metric"].startswith("deform_penetration") and t.get("cut") is not None]
    check("flag_tiles", 0 < len(fl) <= 8 and fl[0]["light"] == "red" and any((t["xray"] or t.get("cut") is not None) and t["dots"]
                                                                               for t in fl)
          and all(t["name"] in i1_["views"] for t in fl), tiles=[(t["metric"], t["light"], t["pose"], t["xray"], t.get("cut"),
                                                                    t.get("caption"), t["view"]) for t in fl], red=red)
    # cutaway tiles: the shot carries its near-clip plane (fix round 3); the pair caption comes from metrics.json
    check("flag_cutaway", bool(pen_t) and all(i1_["views"][t["name"]].get("cut") == t["cut"] and " into " in (t.get("caption") or "")
                                              for t in pen_t), cut_tiles=[(t["name"], t.get("caption"), t["cut"]) for t in pen_t])
    p = subprocess.run([RIGKIT_PY, "-I", "-B", os.path.join(SCRIPTS, "rigkit", "render.py"), "compose", "--out-dir", ch, "--poses",
                        res["poses"], "--metrics", metrics], capture_output=True, text=True)
    sheets = json.loads(p.stdout.strip().splitlines()[-1]).get("sheets", []) if p.stdout.strip() else []
    check("compose_flag_sheet", p.returncode == 0 and "qa_flag_sheet.jpg" in sheets and "qa_penetration_closeups.jpg" in sheets
          and os.path.exists(os.path.join(ch, "qa_flag_sheet.jpg")), sheets=sheets, stderr=p.stderr[-300:])
    ok = all(c["pass"] for c in checks.values())
    summary = {"test": "C_test_render_chunks", "ok": ok, "passed": sum(c["pass"] for c in checks.values()), "total": len(checks),
               "failed": [k for k, c in checks.items() if not c["pass"]]}
except Exception as e:  # pragma: no cover
    import traceback

    traceback.print_exc()
    ok = False
    summary = {"test": "C_test_render_chunks", "ok": False, "error": f"{type(e).__name__}: {e}",
               "failed": [k for k, c in checks.items() if not c["pass"]]}
npzio.write_json(os.path.join(OUT, "C_test_render_chunks.json"), {"summary": summary, "checks": checks})
print(json.dumps(summary))
from rigkit import bl  # noqa: E402

bl.exit_now(0 if ok else 1)  # os._exit without Blender's teardown, after removing the session temp folder

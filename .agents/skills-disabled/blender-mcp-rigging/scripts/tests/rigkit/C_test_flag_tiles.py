r"""Owner C (I2), Blender test: rigkit.render S3 flag tiles (mode ``flag_tiles``) on a synthetic mesh.npz + flags.json - the
one-shot path (``flag_tiles_render``) against the chunked MCP path (``flag_tiles_plan`` + ``flag_tiles_chunk`` per range +
``flag_tiles_finish``), every chunk under 20 s, pixel-identical raw shots (bytes differ: Blender stamps metadata), projections
that put the crop centre in the image centre and a mesh point on mesh pixels, the x-ray slab clipping (a part outside the crop
along the view is gone in x-ray, present in solid), the open file's state unchanged (scenes, objects, datablocks, render
settings), and ``render.py flag_compose`` (rigkit-env) writing one PNG per tile + the contact sheet.

Run: blender -b --factory-startup -P C_test_flag_tiles.py -- [--out E:\tmp_rigkit\I2\tests]   (one JSON line; exit 1 on failure)
"""
import json
import os
import shutil
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, SCRIPTS)
sys.dont_write_bytecode = True

import bpy  # noqa: E402
import numpy as np  # noqa: E402

from rigcore import mesh as rmesh  # noqa: E402
from rigcore import npzio  # noqa: E402
from rigkit import poses as RP, render as R  # noqa: E402

RIGKIT_PY = r"E:\tools\rigkit-env\Scripts\python.exe"
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = args[args.index("--out") + 1] if "--out" in args else r"E:\tmp_rigkit\I2\tests"
OUT = os.path.join(OUT, "flag_tiles")
if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
checks = {}
H = 1.0


def check(name, ok, **kw):
    checks[name] = {"pass": bool(ok), **kw}


def box(c, s):
    c, s = np.asarray(c, float), np.asarray(s, float) / 2
    V = np.array([[x, y, z] for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)], float) * s + c
    F = np.array([[0, 1, 3], [0, 3, 2], [4, 6, 7], [4, 7, 5], [0, 4, 5], [0, 5, 1], [2, 3, 7], [2, 7, 6], [0, 2, 6], [0, 6, 4],
                  [1, 5, 7], [1, 7, 3]])
    return V, F


def crop(c, h):
    c = np.asarray(c, float)
    return {"centre": c.tolist(), "half_size": h, "box_min": (c - h).tolist(), "box_max": (c + h).tolist()}


def synthetic(out):
    """A leg-like column (z 0.1 .. 0.9) and a plate far in front of it (y -0.4: outside the knee crop along the front view)."""
    V1, F1 = box((0.1, 0.0, 0.5), (0.1, 0.1, 0.8))
    V2, F2 = box((0.1, -0.4, 0.5), (0.3, 0.02, 0.3))
    V, F = np.vstack([V1, V2]), np.vstack([F1, F2 + len(V1)])
    mp = os.path.join(out, "mesh.npz")
    npzio.save_mesh(mp, V, F, weld=rmesh.weld_map(V), meta=npzio.mesh_meta("synthetic", H))
    knee = {"tile": 1, "key": "knee", "ids": ["knee_L"], "class": "limb", "flag": "vision", "status": "pending", "impact": 6.0,
            "tau_H": 0.015, "grid_m": 0.01, "reasons": {"knee_L": "a+d disagree"},
            "candidates": {"knee_L": {"a": [0.1, 0.0, 0.5], "d": [0.1, 0.0, 0.62]}}, "sanity_only": {"knee_L": False},
            "provisional": {"knee_L": [0.1, 0.0, 0.5]}, "provisional_source": {"knee_L": "a"}, "gates_failed": {"knee_L": {}},
            "crops": {"knee_L": crop([0.1, 0.0, 0.5], 0.08)}, "crop": crop([0.1, 0.0, 0.5], 0.08),
            "sections": {"knee_L": {"kind": "limb_perpendicular", "plane": {"origin": [0.1, 0, 0.5], "normal": [0, 0, 1]},
                                    "polylines": [{"closed": True, "points": [[0.05, -0.05, 0.5], [0.15, -0.05, 0.5],
                                                                              [0.15, 0.05, 0.5], [0.05, 0.05, 0.5]]}]}}}
    spine = {"tile": 2, "key": "chest", "ids": ["chest"], "class": "convention", "flag": "vision_only", "status": "pending",
             "impact": 2.0, "tau_H": 0.03, "grid_m": 0.01, "reasons": {"chest": "single"},
             "candidates": {"chest": {"d": [0.1, 0.0, 0.8]}}, "sanity_only": {"chest": False},
             "provisional": {"chest": [0.1, 0.0, 0.8]},
             "provisional_source": {"chest": "d"}, "gates_failed": {"chest": {}}, "crops": {"chest": crop([0.1, 0.0, 0.8], 0.06)},
             "crop": crop([0.1, 0.0, 0.8], 0.06), "sections": {}}
    fl = {"schema": 0, "asset_id": "synthetic", "family": "H", "H": H, "tiles": [knee, spine],
          "inputs": {"mesh": mp}, "inputs_sha256": {"mesh": R._sha256(mp)}}
    fp = os.path.join(out, "flags.json")
    npzio.write_json(fp, fl)
    npzio.write_json(os.path.join(out, "landmarks.json"), {"schema": 0, "landmarks": {"hip_L": {"pos": [0.1, 0.0, 0.88]},
                                                                                       "ankle_L": {"pos": [0.1, 0.0, 0.12]}}})
    return fp, mp


def pixels(path):
    im = bpy.data.images.load(path, check_existing=False)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], -1)[::-1, :, :3]  # top row first
    bpy.data.images.remove(im)
    return a


def state():
    return {"file": RP.FileState().as_dict(), "scenes": sorted(bpy.data.scenes.keys()),
            "data": {c: len(getattr(bpy.data, c)) for c in ("objects", "meshes", "cameras", "worlds", "scenes", "images")}}


try:
    fp, mp = synthetic(OUT)
    s0 = state()
    one = os.path.join(OUT, "one")
    r1 = R.flag_tiles_render(fp, one, res=200)
    check("one_shot", r1["ok"] and r1["n_images"] == 2 * (len(R.FT_CONTEXT) + 6) and not r1["warnings"], result=r1)
    check("state_after_one_shot", state() == s0)
    ch = os.path.join(OUT, "chunked")
    pl = R.flag_tiles_plan(fp, ch, res=200, max_seconds=2.03)  # setup 2 s + shots: several chunks
    times = []
    for i0, i1 in pl["chunks"]:
        t0 = time.time()
        r = R.flag_tiles_chunk(ch, i0, i1)
        times.append(round(time.time() - t0, 2))
    fin = R.flag_tiles_finish(ch)
    check("chunks_under_20s", len(times) >= 2 and max(times) < 20.0, chunk_seconds=times, ranges=pl["chunks"])
    check("state_after_chunks", state() == s0, left=[n for n in bpy.data.objects.keys() if n.startswith("FT_")])
    i1_, i2_ = npzio.read_json(os.path.join(one, R.FT_INFO)), npzio.read_json(os.path.join(ch, R.FT_INFO))
    diff = [nm for nm in sorted(i1_["views"]) if float(np.abs(pixels(os.path.join(one, "raw", nm + ".png"))
                                                         - pixels(os.path.join(ch, "raw", nm + ".png"))).max()) > 0]
    check("chunked_equals_one_shot", sorted(i1_["views"]) == sorted(i2_["views"]) and not diff and fin["n_images"] == r1["n_images"],
          differing=diff)
    # projections: the crop centre sits in the image centre, the provisional knee point (inside the column) on mesh pixels
    bad, mesh_px = [], {}
    for nm, v in i1_["views"].items():
        lo, hi = np.asarray(v["box"][0]), np.asarray(v["box"][1])
        x, y = R._ft_proj(v)((lo + hi) / 2)
        if abs(x - v["res"] / 2) > 0.5 or abs(y - v["res"] / 2) > 0.5:
            bad.append((nm, x, y))
        if nm.startswith("ft01_knee_L_") and v["mode"] == "solid":
            px_ = pixels(os.path.join(one, "raw", v["file"]))
            xa, ya = R._ft_proj(v)([0.1, 0.0, 0.5])
            mesh_px[nm] = float(px_[int(ya), int(xa)].mean())
    bg = float(pixels(os.path.join(one, "raw", "ft02_chest_ctxfront_solid.png"))[2, 2].mean())  # a corner: the world colour
    check("projection_centre_and_mesh", not bad and all(abs(v - bg) > 0.02 for v in mesh_px.values()), off=bad[:5], mesh=mesh_px,
          background=bg)  # PNG pixels are sRGB: world 0.30 -> 0.59, the lit grey mesh about 0.64
    # x-ray slab: the plate 0.4 m in front of the knee lies outside the crop slab: it covers the front solid shot's centre ...
    vs, vx = i1_["views"]["ft01_knee_L_front_solid"], i1_["views"]["ft01_knee_L_front_xray"]
    ps, pxr = pixels(os.path.join(one, "raw", vs["file"])), pixels(os.path.join(one, "raw", vx["file"]))
    c = int(vs["res"] / 2)
    plate_s = float(ps[c, c].mean())
    side = pixels(os.path.join(one, "raw", "ft01_knee_L_side_solid.png"))[c, c].mean()
    check("xray_slab_clips_outside_parts", vx["cut"] and abs(plate_s - float(pxr[c, c].mean())) > 0.02
          and i1_["tiles"][0]["render_boxes"]["knee_L"]["widened"] > 0, solid=plate_s, xray=float(pxr[c, c].mean()),
          side_solid=float(side), cut=vx["cut"], clip_end=vx.get("cut"))
    p = subprocess.run([RIGKIT_PY, "-I", "-B", os.path.join(SCRIPTS, "rigkit", "render.py"), "flag_compose", "--out-dir", ch],
                       capture_output=True, text=True)
    res = json.loads(p.stdout.strip().splitlines()[-1]) if p.stdout.strip() else {}
    files = res.get("files", [])
    check("compose_tiles_and_contact", p.returncode == 0 and files == ["flag_tile_01_knee.png", "flag_tile_02_chest.png",
                                                                        "flag_tiles_contact.png"]
          and all(os.path.exists(os.path.join(ch, f)) for f in files), files=files, stderr=p.stderr[-300:])
    ok = all(c_["pass"] for c_ in checks.values())
    summary = {"test": "C_test_flag_tiles", "ok": ok, "passed": sum(c_["pass"] for c_ in checks.values()), "total": len(checks),
               "failed": [k for k, c_ in checks.items() if not c_["pass"]]}
except Exception as e:  # pragma: no cover
    import traceback

    traceback.print_exc()
    ok = False
    summary = {"test": "C_test_flag_tiles", "ok": False, "error": f"{type(e).__name__}: {e}",
               "failed": [k for k, c_ in checks.items() if not c_["pass"]]}
npzio.write_json(os.path.join(OUT, "C_test_flag_tiles.json"), {"summary": summary, "checks": checks})
print(json.dumps(summary))
from rigkit import bl  # noqa: E402

bl.exit_now(0 if ok else 1)  # os._exit without Blender's teardown, after removing the session temp folder

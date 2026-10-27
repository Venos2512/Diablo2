r"""Owner C, Blender test: S8 runtime parity on the ADVERSARIAL synthetic rig of C_synthetic_rig.py (weighted non-deform socket,
bbone_segments 3, Preserve Volume, Corrective Smooth, > 4 influences, weights <= 1e-4, ARMATURE parent).

Steps: build + save the rig -> ``rigkit.poses.export_current`` (custom poses that load every hazard: a b2 twist (bbones), the socket
rotated on its own, a two-joint bend, all at once) -> ``rigkit.parity.run`` (test GLB of the emulation, clean reimport, same
skinning matrices) -> ``solvers/parity_cmp.py`` in rigkit-env (subprocess). Checks: the emulation's ``weights_check_max`` <= 1e-6
(poses and parity), parity passes (max <= 1e-4 m x H / 1.8, every GLB vertex matched, every welded id covered), the socket is a
skinned joint of the GLB, and the test has teeth: the SOURCE mesh (its own modifiers) is far from the emulation in the same poses.

Run: blender -b --factory-startup -P C_test_parity_adversarial.py -- [--out E:\tmp_rigkit\C_r3\tests]   (one JSON line; exit 1 on failure)
"""
import json
import os
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
from rigkit import parity as PA, poses as RP  # noqa: E402

RIGKIT_PY = r"E:\tools\rigkit-env\Scripts\python.exe"
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = args[args.index("--out") + 1] if "--out" in args else r"E:\tmp_rigkit\C_r3\tests"
OUT = os.path.join(OUT, "parity_adversarial")
os.makedirs(OUT, exist_ok=True)
H = 0.2
checks = {}


def check(name, ok, **kw):
    checks[name] = {"pass": bool(ok), **kw}


def rot(bone, axis, deg):
    return {"op": "local_rot", "bones": [bone], "axis": axis, "deg": deg}


SPECS = [RP.rest_spec(),
         {"name": "b2_twist", "kind": "rom", "ik": "default", "ops": [rot("b2", "Y", 60.0)], "tags": ["extreme"]},
         {"name": "sock_only", "kind": "rom", "ik": "default", "ops": [rot("sock", "Z", 70.0)], "tags": ["extreme"]},
         {"name": "bend_two", "kind": "rom", "ik": "default", "ops": [rot("b2", "Z", 35.0), rot("b4", "X", -50.0)], "tags": ["extreme"]},
         {"name": "all", "kind": "compound", "ik": "default",
          "ops": [rot("b1", "Z", 20.0), rot("b2", "Y", 45.0), rot("b3", "X", 30.0), rot("b5", "Z", -25.0), rot("sock", "X", 80.0)],
          "tags": ["extreme"]}]

try:
    arm, src, names = SR.build()
    blend = SR.save(os.path.join(OUT, "adv_rig.blend"))
    pdir = os.path.join(OUT, "poses")
    res = RP.export_current(pdir, "custom", mesh=src.name, runtime=arm.name, control=arm.name, asset_id="adversarial", H=H,
                            specs=SPECS, chunk=2)
    po = npzio.load_poses(res["poses"])
    em = po["meta"]["emulation"]
    check("poses_weights_check", em["weights_check_max"] <= 1e-6, weights_check_max=em["weights_check_max"],
          bones_changed=em["bones_changed"])
    by_pose = po["meta"]["emulation_vs_source_by_pose_m"]
    check("source_differs (test has teeth)", by_pose["sock_only"] > 1e-3 and by_pose["b2_twist"] > 1e-4, by_pose=by_pose)
    par = PA.run(blend, res["poses"], os.path.join(OUT, "parity"), mesh="T_mesh", runtime="T_runtime")
    check("parity_weights_check", par["weights_check_max"] <= 1e-6, weights_check_max=par["weights_check_max"],
          exporter=par["exporter"])
    check("socket_is_a_glb_joint", "sock" in npzio.load_poses(par["reimport_poses"])["bone_names"].tolist(),
          n_bones_glb=par["n_bones_glb"], bone_fit_max=par["bone_fit_max"])
    out_json = os.path.join(OUT, "parity", "parity.json")
    p = subprocess.run([RIGKIT_PY, "-I", "-B", os.path.join(SCRIPTS, "solvers", "parity_cmp.py"), "--poses", res["poses"], "--mesh",
                        res["mesh"], "--reimport", par["reimport_poses"], "--out", out_json], capture_output=True, text=True)
    cmp_line = p.stdout.strip().splitlines()[-1] if p.stdout.strip() else ""
    rep = npzio.read_json(out_json) if os.path.exists(out_json) else {}
    check("parity_cmp_pass", p.returncode == 0 and rep.get("pass") and rep.get("weights_check_ok")
          and rep.get("unmatched_glb_vertices") == 0 and rep.get("welded_ids_covered") == rep.get("n_welded_source"),
          exit=p.returncode, line=cmp_line, max_m=rep.get("max_m"), tolerance_m=rep.get("tolerance_m"),
          per_pose={k: v["max_m"] for k, v in rep.get("per_pose", {}).items()}, stderr=p.stderr[-400:])
    ok = all(c["pass"] for c in checks.values())
    summary = {"test": "C_test_parity_adversarial", "ok": ok, "passed": sum(c["pass"] for c in checks.values()),
               "total": len(checks), "failed": [k for k, c in checks.items() if not c["pass"]], "max_m": rep.get("max_m"),
               "tolerance_m": rep.get("tolerance_m")}
except Exception as e:  # pragma: no cover
    import traceback

    traceback.print_exc()
    ok = False
    summary = {"test": "C_test_parity_adversarial", "ok": False, "error": f"{type(e).__name__}: {e}",
               "failed": [k for k, c in checks.items() if not c["pass"]]}
npzio.write_json(os.path.join(OUT, "C_test_parity_adversarial.json"), {"summary": summary, "checks": checks})
print(json.dumps(summary))
from rigkit import bl  # noqa: E402

bl.exit_now(0 if ok else 1)  # os._exit without Blender's teardown, after removing the session temp folder

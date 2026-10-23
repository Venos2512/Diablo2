r"""I4 Blender test: the glTF exporter's joint-scale noise stays inside ``rigkit.export.BONE_SCALE_TOL`` (the A1.14 tolerance).

    blender -b --factory-startup -P scripts/tests/rigkit/I4_test_bone_scale_noise.py -- [--out E:\tmp_rigkit\I4\bone_scale_noise]

An armature root (up) -> pelvis (up) -> 1604 child bones pointing down, tilted phi = 0 ... 20 deg (0.05 deg steps) off Blender -Z at
two azimuths and two rolls, plus 24 bones in other directions; one triangle per bone weighted to it. Exported with
``rigkit.export.export_test_glb`` (the fixed S8 arguments); the joint TRS scales are read back from the GLB.

Checks (references: rigkit/export.py ``BONE_SCALE_TOL`` docstring):
- the largest |scale - 1| over every joint is <= BONE_SCALE_TOL (5e-5) and >= 2e-5 (the noise exists: the old 1e-5 failed FL);
- it sits at the series switch of Blender's vec_roll_to_mat3_normalized, phi in [5.5, 7.0] deg off -Z;
- bones within 2 deg of -Z and every bone at least 30 deg away from -Z stay below 1e-6 (a few float32 eps).
Writes sweep.json under --out; one JSON summary line; exit 1 on failure.
"""
import argparse
import json
import math
import os
import sys

sys.dont_write_bytecode = True
SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, SCRIPTS)

import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402

from rigkit import bl, export  # noqa: E402

DEFAULT_OUT = r"E:\tmp_rigkit\I4\bone_scale_noise"


def build(specs):
    """Armature + skinned mesh with one bone per spec ({name, dir (3,), roll})."""
    bl.new_empty_file()
    arm = bpy.data.armatures.new("noise_arm")
    ob = bpy.data.objects.new("noise_runtime", arm)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm.edit_bones
    root = eb.new("root")
    root.head, root.tail = (0, 0, 0), (0, 0, 0.1)
    pel = eb.new("pelvis")
    pel.head, pel.tail = (0, 0, 1.0), (0, 0, 1.1)
    pel.parent = root
    for s in specs:
        b = eb.new(s["name"])
        b.head = Vector((0.0, 0.0, 1.0))
        b.tail = b.head + 0.4 * Vector(s["dir"])
        b.roll = s["roll"]
        b.parent = pel
    bpy.ops.object.mode_set(mode="OBJECT")
    names = ["root", "pelvis"] + [s["name"] for s in specs]
    verts, faces = [], []
    for i, nm in enumerate(names):
        h = Vector(arm.bones[nm].head_local) + Vector((0.0, 0.0, 0.001 * i))
        verts += [tuple(h + Vector((0.01, 0, 0))), tuple(h + Vector((0, 0.01, 0))), tuple(h + Vector((0, 0, 0.01)))]
        faces.append((3 * i, 3 * i + 1, 3 * i + 2))
    me = bpy.data.meshes.new("noise_mesh")
    me.from_pydata(verts, [], faces)
    mo = bpy.data.objects.new("noise", me)
    bpy.context.scene.collection.objects.link(mo)
    mo.parent = ob
    mod = mo.modifiers.new("Armature", "ARMATURE")
    mod.object = ob
    for i, nm in enumerate(names):
        mo.vertex_groups.new(name=nm).add([3 * i, 3 * i + 1, 3 * i + 2], 1.0, "REPLACE")
    bl.update()
    return ob, mo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args(bl.script_args())
    os.makedirs(a.out, exist_ok=True)
    specs = []
    for i in range(401):
        phi = 0.05 * i
        for az in (0.0, 90.0):
            for roll in (0.0, 1.3):
                p, q = math.radians(phi), math.radians(az)
                specs.append({"name": f"d{len(specs):04d}", "phi_deg": phi, "az_deg": az, "roll": roll,
                              "dir": (math.sin(p) * math.cos(q), math.sin(p) * math.sin(q), -math.cos(p))})
    for k, d in enumerate([(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0.6, 0, 0.8), (0, 0.6, -0.8), (0.5, 0.5, 0.707),
                           (0.3, -0.9, 0.316), (-0.7, 0.1, -0.707), (0.8, 0.6, 0), (0, 0.8, 0.6)]):
        for roll in (0.0, 2.2):
            v = np.array(d, float) / np.linalg.norm(d)
            specs.append({"name": f"o{k:02d}_{int(roll)}", "phi_deg": math.degrees(math.acos(float(np.clip(-v[2], -1, 1)))), "az_deg": None,
                          "roll": roll, "dir": tuple(float(c) for c in v)})
    ob, mo = build(specs)
    glb = os.path.join(a.out, "noise.glb")
    export.export_test_glb(ob, mo, glb)
    js, _ = export.read_glb(glb)
    by = {n["name"]: n for n in js["nodes"]}
    rows = []
    for s in specs:
        sc_ = np.array(by[s["name"]].get("scale", [1, 1, 1]), float)
        rows.append({k: s[k] for k in ("name", "phi_deg", "az_deg", "roll")} | {"dev": float(np.abs(sc_ - 1).max())})
    dev = np.array([r["dev"] for r in rows])
    phi = np.array([r["phi_deg"] for r in rows])
    worst = rows[int(dev.argmax())]
    checks = {
        "max_dev_within_tol": bool(dev.max() <= export.BONE_SCALE_TOL),
        "noise_exists_above_old_1e-5": bool(dev.max() >= 2e-5),
        "worst_at_series_switch_5.5_7.0_deg": bool(5.5 <= worst["phi_deg"] <= 7.0),
        "near_straight_down_below_1e-6": bool(dev[phi <= 2.0].max() < 1e-6),
        "far_from_down_below_1e-6": bool(dev[phi >= 30.0].max() < 1e-6),
    }
    with open(os.path.join(a.out, "sweep.json"), "w", encoding="utf-8") as fh:
        json.dump({"tol": export.BONE_SCALE_TOL, "eps32": float(np.finfo(np.float32).eps), "worst": worst, "checks": checks,
                   "rows": rows}, fh, indent=1)
    ok = all(checks.values())
    print(bl.json_line({"test": "I4_test_bone_scale_noise", "ok": ok, "bones": len(rows), "max_dev": float(dev.max()),
                        "worst_phi_deg": worst["phi_deg"], "tol": export.BONE_SCALE_TOL,
                        "failed": [k for k, v in checks.items() if not v], "out": a.out}))
    return 0 if ok else 1


if __name__ == "__main__":
    bl.run_main(main)

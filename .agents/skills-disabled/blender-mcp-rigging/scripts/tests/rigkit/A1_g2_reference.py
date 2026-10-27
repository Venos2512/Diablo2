r"""A1 helper (Blender): extract the reference data of D01's G2-approved rig for the legacy regression.

    blender -b --factory-startup -P scripts/tests/rigkit/A1_g2_reference.py -- [--out E:\tmp_rigkit\A1\g2]

Copies ``ashlar/.../rig/_snapshots/g2_approved/D01_hodling_rig_g2.blend`` to the scratch folder (sha256 checked; the original is never
opened), opens the COPY and writes ``g2_reference.json`` (objects, runtime/control bones with rest matrices and rolls, constraints,
drivers, switches) and ``g2_weights.npz`` (vertex-group weights by vertex index ``W`` float32 (n, g), ``groups``, rest ``V``).
Prints one JSON line; exit code 1 on failure. Also importable from other A1 Blender tests (``extract(out_dir)``).
"""
import json
import os
import shutil
import sys
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPTS = os.path.dirname(os.path.dirname(HERE))
REPO = os.path.normpath(os.path.join(SCRIPTS, "..", "..", "..", ".."))
G2_SRC = os.path.join(REPO, "ashlar", "3d", "act-01", "monsters", "D01_hodling", "rig", "_snapshots", "g2_approved", "D01_hodling_rig_g2.blend")
G2_SHA256 = "bf6c53dc783842774b6c75b2f35eb708bbbbe47cee0139e560c97efa97bc0bcb"
DEFAULT_OUT = r"E:\tmp_rigkit\A1\g2"
sys.dont_write_bytecode = True
if SCRIPTS not in sys.path:
    sys.path.insert(0, SCRIPTS)


def _bones(ob, rolls):
    out = []
    for b in ob.data.bones:
        out.append({"name": b.name, "parent": b.parent.name if b.parent else None, "deform": b.use_deform, "connect": b.use_connect,
                    "inherit_scale": b.inherit_scale, "bbone_segments": b.bbone_segments, "head": list(b.head_local),
                    "tail": list(b.tail_local), "matrix_local": [list(r) for r in b.matrix_local], "roll": rolls[b.name],
                    "collections": [c.name for c in b.collections], "color": b.color.palette})
    return out


def _constraints(ob):
    out = {}
    for pb in ob.pose.bones:
        rows = []
        for c in pb.constraints:
            d = {"type": c.type, "name": c.name, "influence": c.influence}
            for k in ("subtarget", "pole_subtarget", "pole_angle", "chain_count", "use_tail", "use_stretch", "target_space",
                      "owner_space", "mix_mode", "use_x", "use_y", "use_z", "invert_x", "invert_y", "invert_z"):
                if hasattr(c, k):
                    d[k] = getattr(c, k)
            for k in ("target", "pole_target"):
                if hasattr(c, k):
                    d[k] = getattr(c, k).name if getattr(c, k) else None
            rows.append(d)
        if rows or pb.lock_ik_y or pb.use_ik_limit_x:
            out[pb.name] = {"constraints": rows, "lock_ik": [pb.lock_ik_x, pb.lock_ik_y, pb.lock_ik_z],
                            "use_ik_limit_x": pb.use_ik_limit_x, "ik_min_x": pb.ik_min_x, "ik_max_x": pb.ik_max_x}
    return out


def _drivers(ob):
    if not ob.animation_data:
        return []
    return [{"path": fc.data_path, "type": fc.driver.type,
             "vars": [[v.name, v.type, v.targets[0].id.name if v.targets[0].id else None, v.targets[0].data_path] for v in fc.driver.variables]}
            for fc in ob.animation_data.drivers]


def extract(out_dir=DEFAULT_OUT):
    import bpy
    import numpy as np

    from rigkit import bl

    os.makedirs(out_dir, exist_ok=True)
    copy = os.path.join(out_dir, "D01_hodling_rig_g2.blend")
    if not os.path.exists(copy) or bl.sha256_file(copy) != G2_SHA256:
        if bl.sha256_file(G2_SRC) != G2_SHA256:
            raise RuntimeError(f"G2 snapshot changed: {G2_SRC}")
        shutil.copy2(G2_SRC, copy)
    if bl.sha256_file(copy) != G2_SHA256:
        raise RuntimeError(f"bad G2 copy {copy}")
    bpy.ops.wm.open_mainfile(filepath=copy)
    rt, ct, me = bpy.data.objects["D01_runtime"], bpy.data.objects["D01_control"], bpy.data.objects["D01_hodling"]
    rolls = {}
    for ob in (rt, ct):
        with bl.edit_mode(ob) as data:
            rolls[ob.name] = {eb.name: float(eb.roll) for eb in data.edit_bones}
    ref = {
        "source": G2_SRC, "copy": copy, "sha256": G2_SHA256, "blender": bpy.app.version_string,
        "objects": {o.name: {"type": o.type, "parent": o.parent.name if o.parent else None, "matrix_world": [list(r) for r in o.matrix_world],
                             "collections": [c.name for c in o.users_collection]} for o in bpy.data.objects},
        "runtime": {"name": rt.name, "bones": _bones(rt, rolls[rt.name]), "constraints": _constraints(rt),
                    "collections": [c.name for c in rt.data.collections_all]},
        "control": {"name": ct.name, "bones": _bones(ct, rolls[ct.name]), "constraints": _constraints(ct), "drivers": _drivers(ct),
                    "switches": {k: float(ct[k]) for k in ct.keys() if k.startswith("ik_")},
                    "collections": [c.name for c in ct.data.collections_all]},
        "mesh": {"name": me.name, "data": me.data.name, "vertices": len(me.data.vertices), "polygons": len(me.data.polygons),
                 "groups": [g.name for g in me.vertex_groups],
                 "modifiers": [{"type": m.type, "name": m.name, "object": m.object.name if getattr(m, "object", None) else None,
                                "use_vertex_groups": getattr(m, "use_vertex_groups", None),
                                "use_bone_envelopes": getattr(m, "use_bone_envelopes", None),
                                "use_deform_preserve_volume": getattr(m, "use_deform_preserve_volume", None)} for m in me.modifiers]},
        "scene": {k: (bpy.context.scene[k] if isinstance(bpy.context.scene[k], (int, float, str)) else str(bpy.context.scene[k]))
                  for k in bpy.context.scene.keys()},
    }
    n, g = len(me.data.vertices), len(me.vertex_groups)
    W = np.zeros((n, g), dtype=np.float32)
    for v in me.data.vertices:
        for ge in v.groups:
            W[v.index, ge.group] = ge.weight
    V = np.empty(n * 3)
    me.data.vertices.foreach_get("co", V)
    np.savez_compressed(os.path.join(out_dir, "g2_weights.npz"), W=W, groups=np.array(ref["mesh"]["groups"]), V=V.reshape(n, 3))
    with open(os.path.join(out_dir, "g2_reference.json"), "w", encoding="utf-8") as f:
        json.dump(ref, f, indent=1)
    return ref


def main():
    import argparse

    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT)
    a = ap.parse_args(argv)
    try:
        ref = extract(a.out)
        print(json.dumps({"test": "A1_g2_reference", "ok": True, "runtime_bones": len(ref["runtime"]["bones"]),
                          "control_bones": len(ref["control"]["bones"]), "groups": len(ref["mesh"]["groups"]), "out": a.out}))
        return 0
    except Exception as e:  # report and fail
        traceback.print_exc()
        print(json.dumps({"test": "A1_g2_reference", "ok": False, "error": repr(e)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())

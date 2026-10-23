"""Writer B Blender test of rigkit.skin_io (headless). Prints one line ``B_SKIN_IO {json}`` and exits 1 on any failure.

    blender.exe -b --factory-startup -P B_test_skin_io.py -- --out E:\\tmp_rigkit\\B\\skin_io [--d01-blend <copy of the G2 .blend>
        --d01-gt E:\\tmp_rigkit\\B\\d01\\gt_weights.npz]

Synthetic part (empty scene): grid mesh + 6-bone armature + Armature modifier + one non-bone group; random weights with zeros,
weights <= 1e-4 and rows with 6 influences.
1. write -> read (Geometry Nodes path and loop path) equals the written float32 weights (<= 1e-6; expected 0);
2. rewriting with other weights clears old memberships;
3. runtime copy = exporter rule (drop <= 1e-4, top 4, renormalize) of the source weights (<= 1e-6), source groups unchanged, the
   non-bone group only on the source;
4. export_weights / import_weights round trip through weights.npz;
5. overrides: GUI-like edits on a few vertices -> record_overrides -> apply_overrides on the original weights restores them;
   a vertex the user zeroed completely is refused by record_overrides and by apply_overrides (review r1 nit 10).
D01 part (optional): G2 copy - gt weights written to a duplicate mesh read back equal; source groups equal gt_weights.npz.
"""
import argparse
import json
import os
import sys

sys.dont_write_bytecode = True  # Blender's Python writes bytecode by default: keep the skill folders clean
import time
import traceback

SCRIPTS = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, SCRIPTS)

import bpy  # noqa: E402
import numpy as np  # noqa: E402

from rigcore import npzio  # noqa: E402
from rigkit import skin_io  # noqa: E402

BONES = ["root_b", "b1", "b2", "b3", "b4", "b5"]


def make_scene(n_side=40):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    xs = np.linspace(-0.5, 0.5, n_side)
    verts = [(float(x), 0.0, float(z)) for z in np.linspace(0, 1, n_side) for x in xs]
    faces = []
    for i in range(n_side - 1):
        for j in range(n_side - 1):
            a = i * n_side + j
            faces.append((a, a + 1, a + n_side + 1, a + n_side))
    me = bpy.data.meshes.new("B_grid")
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new("B_grid", me)
    bpy.context.scene.collection.objects.link(ob)
    ad = bpy.data.armatures.new("B_arm")
    arm = bpy.data.objects.new("B_arm", ad)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    prev = None
    for i, nm in enumerate(BONES):
        eb = ad.edit_bones.new(nm)
        eb.head = (0.0, 0.0, i * 0.15)
        eb.tail = (0.0, 0.0, i * 0.15 + 0.1)
        if prev is not None:
            eb.parent = prev
        prev = eb
    bpy.ops.object.mode_set(mode="OBJECT")
    mod = ob.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    ob.vertex_groups.new(name="not_a_bone")
    ob.vertex_groups["not_a_bone"].add(list(range(0, len(verts), 3)), 0.25, "REPLACE")
    return ob, arm


def random_weights(n, k, seed):
    rng = np.random.default_rng(seed)
    W = (rng.random((n, k)) ** 2).astype(np.float32)
    W[rng.random((n, k)) < 0.35] = 0.0
    W[rng.random((n, k)) < 0.05] = 5e-5  # below the exporter's drop threshold
    W[::7] = rng.random((len(W[::7]), k)).astype(np.float32) + 0.01  # rows with 6 influences
    W[3] = 0.0  # an empty row
    s = W.sum(1, keepdims=True)
    return np.where(s > 0, W / np.where(s > 0, s, 1), 0).astype(np.float32)


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--d01-blend", default=None)
    ap.add_argument("--d01-gt", default=None)
    a = ap.parse_args(argv)
    os.makedirs(a.out, exist_ok=True)
    res, fails = {}, []

    def check(name, ok, **num):
        res[name] = {"ok": bool(ok), **num}
        if not ok:
            fails.append(name)

    ob, arm = make_scene()
    n = len(ob.data.vertices)
    W = random_weights(n, len(BONES), 1)
    t0 = time.time()
    rep = skin_io.write_groups(ob, BONES, W)
    t_write = time.time() - t0
    t0 = time.time()
    _, Rg = skin_io.read_groups(ob, BONES, method="gn")
    t_gn = time.time() - t0
    _, Rl = skin_io.read_groups(ob, BONES, method="loop")
    check("write_read_gn", np.abs(Rg - W).max() <= 1e-6, max_diff=float(np.abs(Rg - W).max()), add_calls=rep["add_calls"],
          write_s=round(t_write, 3), read_gn_s=round(t_gn, 3))
    check("write_read_loop", np.abs(Rl - W).max() <= 1e-6, max_diff=float(np.abs(Rl - W).max()))
    W2 = random_weights(n, len(BONES), 2)
    skin_io.write_groups(ob, BONES, W2)
    _, R2 = skin_io.read_groups(ob, BONES)
    check("rewrite_clears", np.abs(R2 - W2).max() <= 1e-6, max_diff=float(np.abs(R2 - W2).max()),
          memberships=int(sum(len(v.groups) for v in ob.data.vertices)))
    cp, crep = skin_io.runtime_copy(ob)
    _, Rc = skin_io.read_groups(cp, BONES)
    ref = skin_io._skin_common().exporter_rule(W2)
    _, Rs = skin_io.read_groups(ob, BONES)
    check("runtime_copy_rule", np.abs(Rc - ref).max() <= 1e-6, max_diff=float(np.abs(Rc - ref).max()),
          max_influences=int((Rc > 0).sum(1).max()), empty_rows=crep["empty_vertices"])
    check("runtime_copy_source_untouched", np.abs(Rs - W2).max() == 0.0 and "not_a_bone" in ob.vertex_groups,
          max_diff=float(np.abs(Rs - W2).max()))
    check("runtime_copy_drops_non_bone_groups", "not_a_bone" not in cp.vertex_groups and crep["dropped_groups"] == ["not_a_bone"])
    p = os.path.join(a.out, "roundtrip_weights.npz")
    skin_io.export_weights(ob, p, BONES, candidate="b_test")
    ob2 = ob.copy()
    ob2.data = ob.data.copy()
    bpy.context.scene.collection.objects.link(ob2)
    skin_io.write_groups(ob2, BONES, np.zeros_like(W2))
    skin_io.import_weights(ob2, p)
    _, R3 = skin_io.read_groups(ob2, BONES)
    check("npz_roundtrip", np.abs(R3 - W2).max() <= 1e-6, max_diff=float(np.abs(R3 - W2).max()))
    # overrides: the reference = enforced solver-like weights (exporter rule of W2: no empty row, top 4); the user paints 3 vertices
    W3 = skin_io._skin_common().exporter_rule(W2).astype(np.float32)
    W3[W3.sum(1) == 0, 0] = 1.0
    ref_npz = os.path.join(a.out, "reference_weights.npz")
    npzio.save_weights(ref_npz, BONES, W3, meta={"candidate": "b_test_ref"})
    empty_json = os.path.join(a.out, "weights_override_empty.json")
    npzio.write_json(empty_json, {"schema": 0, "kind": "weights_override", "asset_id": "B_grid", "H": 1.0, "pos_tol": 1e-5,
                                  "entries": []})
    skin_io.write_groups(ob, BONES, W3)  # the generated weights as written; the user then paints 3 vertices
    edits = [10, 500, 1200]
    for v in edits:
        for vg in ob.vertex_groups:
            if vg.name in BONES:
                vg.remove([v])
        ob.vertex_groups["b2"].add([v], 0.75, "REPLACE")
        ob.vertex_groups["b4"].add([v], 0.25, "REPLACE")
    ov_json = os.path.join(a.out, "weights_override.json")
    doc = skin_io.record_overrides(ob, ref_npz, ov_json, asset_id="B_grid", H=1.0)
    skin_io.apply_overrides(ob, ref_npz, empty_json)
    _, R_base = skin_io.read_groups(ob, BONES)  # the reference after the Blender-side enforce (prune 0.01), no overrides
    orep = skin_io.apply_overrides(ob, ref_npz, ov_json)  # the rebuild path: generated weights + the user's layer
    _, R4 = skin_io.read_groups(ob, BONES)
    exp = np.zeros((len(edits), len(BONES)))
    exp[:, BONES.index("b2")] = 0.75
    exp[:, BONES.index("b4")] = 0.25
    others = np.setdiff1d(np.arange(n), edits)
    rows_ent = {tuple(e["pos"]) for e in doc["entries"]}
    check("overrides_record_apply", len(rows_ent) == len(edits) and orep["applied"] == len(doc["entries"])
          and np.abs(R4[edits] - exp).max() <= 1e-6 and np.abs(R4[others] - R_base[others]).max() <= 1e-6,
          entries=len(doc["entries"]), positions=len(rows_ent), applied=orep["applied"],
          edited_max_diff=float(np.abs(R4[edits] - exp).max()), others_max_diff=float(np.abs(R4[others] - R_base[others]).max()))
    try:
        skin_io.apply_overrides(ob, p.replace("roundtrip", "roundtrip"), ov_json)  # W2 has an empty row -> must refuse
        check("overrides_refuse_empty_rows", False)
    except ValueError:
        check("overrides_refuse_empty_rows", True)
    # review r1 nit 10: a vertex whose weights the user removed completely is refused, never bound to bone 0
    skin_io.write_groups(ob, BONES, W3)
    z = 700
    for vg in ob.vertex_groups:
        if vg.name in BONES:
            vg.remove([z])
    try:
        skin_io.record_overrides(ob, ref_npz, os.path.join(a.out, "weights_override_zeroed.json"), asset_id="B_grid", H=1.0)
        check("record_refuses_zeroed_vertex", False)
    except ValueError as e:
        check("record_refuses_zeroed_vertex", "remove every weight" in str(e))
    co = ob.data.vertices[z].co
    zdoc = {"schema": 0, "kind": "weights_override", "asset_id": "B_grid", "H": 1.0, "pos_tol": 1e-5,
            "entries": [{"pos": [float(co.x), float(co.y), float(co.z)], "bone": b, "weight": 0.0} for b in BONES]}
    zjson = os.path.join(a.out, "weights_override_zero_row.json")
    npzio.write_json(zjson, zdoc)
    try:
        skin_io.apply_overrides(ob, ref_npz, zjson)
        check("apply_refuses_zeroed_vertex", False)
    except ValueError as e:
        check("apply_refuses_zeroed_vertex", "zero every weight" in str(e))
    if a.d01_blend and a.d01_gt:
        bpy.ops.wm.open_mainfile(filepath=a.d01_blend)
        src = bpy.data.objects["D01_hodling"]
        gt = npzio.load_weights(a.d01_gt)
        names = gt["bones"].tolist()
        _, Rsrc = skin_io.read_groups(src, names)
        check("d01_source_equals_gt", np.abs(Rsrc - gt["W"]).max() <= 1e-6, max_diff=float(np.abs(Rsrc - gt["W"]).max()))
        dup = src.copy()
        dup.data = src.data.copy()
        bpy.context.scene.collection.objects.link(dup)
        skin_io.write_groups(dup, names, np.zeros_like(gt["W"]))
        t0 = time.time()
        wr = skin_io.write_groups(dup, names, gt["W"])
        t_w = time.time() - t0
        t0 = time.time()
        _, Rd = skin_io.read_groups(dup, names)
        t_r = time.time() - t0
        check("d01_write_read", np.abs(Rd - gt["W"]).max() <= 1e-6, max_diff=float(np.abs(Rd - gt["W"]).max()),
              add_calls=wr["add_calls"], nonzeros=wr["nonzeros"], write_s=round(t_w, 3), read_s=round(t_r, 3))
        rc, rrep = skin_io.runtime_copy(src)
        _, Rrc = skin_io.read_groups(rc, names)
        refd = skin_io._skin_common().exporter_rule(gt["W"])
        check("d01_runtime_copy_rule", np.abs(Rrc - refd).max() <= 1e-6, max_diff=float(np.abs(Rrc - refd).max()),
              empty=rrep["empty_vertices"])
    summary = {"ok": not fails, "failed": fails, "checks": res, "blender": bpy.app.version_string}
    npzio.write_json(os.path.join(a.out, "skin_io_test.json"), summary)
    print("B_SKIN_IO " + json.dumps(summary))
    return 0 if not fails else 1


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    try:
        code = main(argv)
    except Exception:
        traceback.print_exc()
        print("B_SKIN_IO " + json.dumps({"ok": False, "error": traceback.format_exc(limit=4)}))
        code = 1
    sys.stdout.flush()
    os._exit(code)

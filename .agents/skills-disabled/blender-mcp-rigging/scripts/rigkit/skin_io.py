"""rigkit.skin_io - weights.npz <-> vertex groups inside Blender 5.2 (owner B, P3).

* ``write_groups(obj, bones, W)``: dense (n,k) weights -> vertex groups, one ``VertexGroup.add(indices, w, 'REPLACE')`` call per
  (bone, distinct weight value). Solver weights are continuous, so that is close to one call per non-zero entry (D01: 8,058 calls
  for 12,534 non-zeros, 0.03 s); the loop runs over the distinct values in Python, not over ``vertex.groups``.
* ``read_groups(obj, bones)``: vertex groups -> dense float32 (n,k). Vectorized: a temporary object shares a copy of the mesh, a
  temporary Geometry Nodes modifier stores each group as a float point attribute (Named Attribute -> Store Named Attribute), the
  evaluated mesh is read with ``foreach_get``. ``method="loop"`` (one pass over ``vertex.groups``) is kept as a cross-check.
* ``runtime_copy(obj)``: duplicate object + mesh whose bone groups carry the exporter rule (drop <= 1e-4, top 4, renormalize)
  and no non-bone groups. The source object's groups are never touched (CONTRACT "Runtime emulation").
* ``record_overrides`` / ``apply_overrides``: ``weights_override.json`` keyed by welded position + bone (numpy core in
  ``solvers/skin_common.py``). Edits that leave a vertex without any weight are refused (``ValueError``), never filled silently.
* ``export_weights`` / ``import_weights``: the same through ``weights.npz`` files (rigcore.npzio).

Units: metres, object space of the mesh (Blender frame: Z up, front -Y, left +X).

The numpy core of the override and exporter rules lives in ``solvers/skin_common.py``; it is loaded here by file path
(``_skin_common()``) so Blender never imports the ``solvers`` package (whose other modules need scipy or igl). skin_common imports
numpy + rigcore only; ``tests/solvers/B_skin_common_test.py`` loads it the same way with scipy and igl blocked.

CLI (headless Blender; prints one line ``SKIN_IO {json}``, exit 1 on failure)::

    blender -b <file.blend> --factory-startup -P rigkit/skin_io.py -- <command> --object <mesh> [options] [--save <out.blend>]
      export          --out weights.npz [--bones a,b,...] [--candidate NAME]
      import          --weights weights.npz
      runtime-copy    [--name NAME]
      record-overrides --reference weights.npz --out weights_override.json --asset-id ID --H 0.5
      apply-overrides  --weights weights.npz --overrides weights_override.json
  ``--save`` writes the scene to another file (``--overwrite`` is needed to replace the opened .blend), without a ``.blend1``
  backup. The CLI ends with ``rigkit.bl.exit_now`` (no Blender teardown, no session temp folder left behind).
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys

if __name__ == "__main__":
    sys.dont_write_bytecode = True  # never leave __pycache__ next to the skill sources

import numpy as np

_SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)

from rigcore import mesh as rmesh  # noqa: E402
from rigcore import npzio  # noqa: E402

_SC = None
GN_PREFIX = "__rigkit_w_"


def _skin_common():
    """``solvers/skin_common.py`` loaded by path (numpy + rigcore only), cached."""
    global _SC
    if _SC is None:
        path = os.path.join(_SCRIPTS, "solvers", "skin_common.py")
        spec = importlib.util.spec_from_file_location("rigkit_skin_common", path)
        mod = importlib.util.module_from_spec(spec)
        sys.modules["rigkit_skin_common"] = mod
        spec.loader.exec_module(mod)
        _SC = mod
    return _SC


# --------------------------------------------------------------------------------------------------------------------------
# write
# --------------------------------------------------------------------------------------------------------------------------


def write_groups(obj, bones, W, clear: bool = True, drop_others: bool = False) -> dict:
    """Write dense weights ``W`` (n,k) to the vertex groups named ``bones`` (created when missing, in column order).

    With ``clear`` every listed group is emptied first, so zeros in ``W`` really are absent memberships. With ``drop_others``
    groups not in ``bones`` are deleted. One ``add`` call per (bone, distinct weight value), i.e. about one per non-zero entry
    for solver weights; returns call counts."""
    W = np.asarray(W, dtype=np.float32)
    n = len(obj.data.vertices)
    if W.shape != (n, len(bones)):
        raise ValueError(f"write_groups: W has shape {W.shape}, mesh {obj.name!r} has {n} vertices and {len(bones)} bones given")
    if drop_others:
        keep = set(bones)
        for vg in list(obj.vertex_groups):
            if vg.name not in keep:
                obj.vertex_groups.remove(vg)
    all_idx = list(range(n))
    calls = 0
    for j, name in enumerate(bones):
        vg = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
        if clear:
            vg.remove(all_idx)
        col = W[:, j]
        nz = np.flatnonzero(col > 0)
        if nz.size == 0:
            continue
        vals = col[nz]
        order = np.argsort(vals, kind="stable")
        nz, vals = nz[order], vals[order]
        cut = np.flatnonzero(np.diff(vals)) + 1
        for ids, v in zip(np.split(nz, cut), vals[np.concatenate([[0], cut])]):
            vg.add(ids.tolist(), float(v), "REPLACE")
            calls += 1
    obj.data.update()
    return {"groups": len(bones), "add_calls": calls, "nonzeros": int((W > 0).sum())}


# --------------------------------------------------------------------------------------------------------------------------
# read
# --------------------------------------------------------------------------------------------------------------------------


def _read_loop(obj, names):
    n = len(obj.data.vertices)
    col_of = {vg.index: names.index(vg.name) for vg in obj.vertex_groups if vg.name in names}
    W = np.zeros((n, len(names)), dtype=np.float32)
    for v in obj.data.vertices:
        for g in v.groups:
            j = col_of.get(g.group)
            if j is not None:
                W[v.index, j] = g.weight
    return W


def _gn_group(names):
    import bpy

    ng = bpy.data.node_groups.new("__rigkit_read_groups", "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    gin = ng.nodes.new("NodeGroupInput")
    gout = ng.nodes.new("NodeGroupOutput")
    last = gin.outputs[0]
    for j, name in enumerate(names):
        rd = ng.nodes.new("GeometryNodeInputNamedAttribute")
        rd.data_type = "FLOAT"
        rd.inputs["Name"].default_value = name
        st = ng.nodes.new("GeometryNodeStoreNamedAttribute")
        st.data_type = "FLOAT"
        st.domain = "POINT"
        st.inputs["Name"].default_value = f"{GN_PREFIX}{j}"
        ng.links.new(last, st.inputs["Geometry"])
        ng.links.new(rd.outputs["Attribute"], st.inputs["Value"])
        last = st.outputs["Geometry"]
    ng.links.new(last, gout.inputs[0])
    return ng


def _read_gn(obj, names):
    import bpy

    n = len(obj.data.vertices)
    me = obj.data.copy()
    tmp = bpy.data.objects.new("__rigkit_read_tmp", me)
    bpy.context.scene.collection.objects.link(tmp)
    ng = _gn_group(names)
    try:
        mod = tmp.modifiers.new("read", "NODES")
        mod.node_group = ng
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()
        ev = tmp.evaluated_get(dg)
        mev = ev.data
        if len(mev.vertices) != n:
            raise RuntimeError(f"evaluated mesh has {len(mev.vertices)} vertices, source {n}")
        W = np.zeros((n, len(names)), dtype=np.float32)
        buf = np.empty(n, dtype=np.float32)
        have = {vg.name for vg in obj.vertex_groups}
        for j, name in enumerate(names):
            if name not in have:
                continue
            att = mev.attributes.get(f"{GN_PREFIX}{j}")
            if att is None:
                raise RuntimeError(f"Geometry Nodes did not produce the attribute for group {name!r}")
            att.data.foreach_get("value", buf)
            W[:, j] = buf
        return W
    finally:
        bpy.data.objects.remove(tmp)
        bpy.data.meshes.remove(me)
        bpy.data.node_groups.remove(ng)


def read_groups(obj, bones=None, method: str = "gn"):
    """Vertex groups -> (bone names, float32 (n,k)). ``bones`` = column names (default: every group of ``obj`` in group order);
    names without a group give zero columns. ``method`` "gn" (vectorized, default) or "loop" (reference)."""
    names = list(bones) if bones is not None else [vg.name for vg in obj.vertex_groups]
    if not names:
        return names, np.zeros((len(obj.data.vertices), 0), dtype=np.float32)
    if method == "loop":
        return names, _read_loop(obj, names)
    if method != "gn":
        raise ValueError(f"read_groups: method must be 'gn' or 'loop', got {method!r}")
    return names, _read_gn(obj, names)


# --------------------------------------------------------------------------------------------------------------------------
# files
# --------------------------------------------------------------------------------------------------------------------------


def import_weights(obj, path, clear: bool = True, drop_others: bool = False) -> dict:
    """weights.npz -> vertex groups of ``obj`` (row count must equal the vertex count)."""
    d = npzio.load_weights(path)
    rep = write_groups(obj, d["bones"].tolist(), d["W"], clear=clear, drop_others=drop_others)
    rep["candidate"] = d["meta"].get("candidate")
    return rep


def export_weights(obj, path, bones=None, candidate: str = "blender_groups", method: str = "gn", meta: dict | None = None):
    """Vertex groups of ``obj`` -> weights.npz (``meta.candidate`` = ``candidate``). Returns (path, bones, W)."""
    names, W = read_groups(obj, bones, method=method)
    m = {"candidate": candidate, "params": {"object": obj.name, "method": method}}
    m.update(meta or {})
    npzio.save_weights(path, names, W, meta=m)
    return path, names, W


# --------------------------------------------------------------------------------------------------------------------------
# runtime copy
# --------------------------------------------------------------------------------------------------------------------------


def armature_bone_names(obj):
    """Bone names of the armature that ``obj``'s first Armature modifier points at (empty list if none)."""
    for m in obj.modifiers:
        if m.type == "ARMATURE" and m.object is not None:
            return [b.name for b in m.object.data.bones]
    return []


def runtime_copy(obj, name: str | None = None, bones=None, drop: float = 1e-4, k: int = 4, method: str = "gn"):
    """New object (own mesh copy, same modifiers and collections) whose vertex groups follow the exporter rule: only groups that
    match ``bones`` (default: the bones of the Armature modifier's armature) are kept, weights <= ``drop`` removed, top ``k``,
    renormalized. The source object is not modified. Returns (copy, report)."""
    import bpy

    sc = _skin_common()
    bone_set = set(bones if bones is not None else armature_bone_names(obj))
    names = [vg.name for vg in obj.vertex_groups if vg.name in bone_set]
    _, W = read_groups(obj, names, method=method)
    Wr = sc.exporter_rule(W, drop=drop, k=k).astype(np.float32)
    cp = obj.copy()
    cp.data = obj.data.copy()
    cp.name = name or f"{obj.name}_runtime_copy"
    for c in obj.users_collection:
        c.objects.link(cp)
    rep = write_groups(cp, names, Wr, clear=True, drop_others=True)
    rep.update({"dropped_groups": [vg.name for vg in obj.vertex_groups if vg.name not in bone_set],
                "empty_vertices": int((Wr.sum(1) == 0).sum()), "rule": {"drop": drop, "k": k}})
    return cp, rep


# --------------------------------------------------------------------------------------------------------------------------
# overrides
# --------------------------------------------------------------------------------------------------------------------------


def _welded(obj, weld=None):
    n = len(obj.data.vertices)
    V = np.empty(n * 3, dtype=np.float64)
    obj.data.vertices.foreach_get("co", V)
    V = V.reshape(n, 3)
    if weld is None:
        weld = rmesh.weld_map(V)
    weld = np.asarray(weld, dtype=np.int64)
    return V, weld, rmesh.welded_positions(V, weld, mode="mean")


def _gather_mean(X, weld):
    n_w = int(weld.max()) + 1
    out = np.zeros((n_w, X.shape[1]))
    np.add.at(out, weld, X.astype(np.float64))
    return out / np.bincount(weld, minlength=n_w)[:, None]


def record_overrides(obj, reference_npz, out_json, asset_id: str, H: float, weld=None, tol: float = 1e-6) -> dict:
    """Compare the object's current vertex groups (the user's GUI edits) with ``reference_npz`` (the weights that were written)
    on welded rows and write ``weights_override.json``. Returns the document."""
    sc = _skin_common()
    ref = npzio.load_weights(reference_npz)
    names = ref["bones"].tolist()
    _, W_user = read_groups(obj, names)
    V, weld, P_w = _welded(obj, weld)
    doc = sc.overrides_record(P_w, names, _gather_mean(ref["W"], weld), _gather_mean(W_user, weld), asset_id, H, tol=tol)
    npzio.write_json(out_json, doc)
    return doc


def apply_overrides(obj, weights_npz, overrides_json, weld=None, prune: float = 0.01, k: int = 4) -> dict:
    """Blender-side quick path: weights.npz + weights_override.json -> vertex groups. Override entries stay fixed, the rest of each
    row is scaled around them, then top-k / prune / normalize. Region lists, the side gate and the influence-cap rule are NOT
    applied here: the canonical path is the solver (``skin_select.py --overrides``), which enforces every gate. Raises
    ``ValueError`` when the overrides leave a vertex without any weight."""
    sc = _skin_common()
    d = npzio.load_weights(weights_npz)
    names = d["bones"].tolist()
    empty = int((d["W"].sum(1) <= 0).sum())
    if empty:
        raise ValueError(f"apply_overrides: {weights_npz} has {empty} vertices without weight (expected enforced solver weights)")
    doc = npzio.read_json(overrides_json)
    V, weld, P_w = _welded(obj, weld)
    Ww = _gather_mean(d["W"], weld)
    k_cols = len(names)
    bones = sc.BoneSet(names=names, head=np.zeros((k_cols, 3)), tail=np.zeros((k_cols, 3)), hinge=np.zeros((k_cols, 3)),
                       side=[sc.bone_side(n) for n in names], kind=["core"] * k_cols, parent=[None] * k_cols,
                       twist=[None] * k_cols, all_bones={n: {"name": n, "parent": None} for n in names},
                       H=float(doc.get("H", 1.0)))
    locked, vals, rep = sc.overrides_apply(doc, P_w, bones)
    n_w = len(P_w)
    cons = sc.Constraints(bones=bones, allowed=np.ones((n_w, k_cols), bool), region_of=np.full(n_w, -1), regions=[],
                          rigid_col=np.full(n_w, -1), caps=np.full(n_w, k), prune=prune, max_influences=k, locked=locked,
                          locked_val=vals)
    cons.notes["_P"] = P_w
    Wf, erep = sc.enforce(Ww, cons)
    write_groups(obj, names, Wf[weld].astype(np.float32))
    rep["enforce"] = {kk: v for kk, v in erep.items() if kk != "invariants"}
    return rep


# --------------------------------------------------------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------------------------------------------------------


def main(argv=None) -> int:
    import bpy

    ap = argparse.ArgumentParser(prog="skin_io", description="weights.npz <-> vertex groups (headless Blender)")
    ap.add_argument("command", choices=["export", "import", "runtime-copy", "record-overrides", "apply-overrides"])
    ap.add_argument("--object", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--bones", default=None, help="comma-separated column names (export; default: every group)")
    ap.add_argument("--candidate", default="blender_groups")
    ap.add_argument("--weights", default=None)
    ap.add_argument("--name", default=None)
    ap.add_argument("--reference", default=None)
    ap.add_argument("--overrides", default=None)
    ap.add_argument("--asset-id", default=None)
    ap.add_argument("--H", type=float, default=None)
    ap.add_argument("--save", default=None, help="save the scene to this .blend after the command")
    ap.add_argument("--overwrite", action="store_true", help="allow --save to replace the opened file")
    a = ap.parse_args(argv)
    obj = bpy.data.objects.get(a.object)
    if obj is None or obj.type != "MESH":
        raise ValueError(f"no mesh object {a.object!r} in {bpy.data.filepath!r}")
    if a.command == "export":
        if not a.out:
            ap.error("export needs --out")
        _, names, W = export_weights(obj, a.out, a.bones.split(",") if a.bones else None, candidate=a.candidate)
        rep = {"out": a.out, "bones": len(names), "vertices": int(W.shape[0])}
    elif a.command == "import":
        if not a.weights:
            ap.error("import needs --weights")
        rep = import_weights(obj, a.weights)
    elif a.command == "runtime-copy":
        cp, rep = runtime_copy(obj, a.name)
        rep["copy"] = cp.name
    elif a.command == "record-overrides":
        if not (a.reference and a.out and a.asset_id and a.H):
            ap.error("record-overrides needs --reference, --out, --asset-id and --H")
        doc = record_overrides(obj, a.reference, a.out, a.asset_id, a.H)
        rep = {"out": a.out, "entries": len(doc["entries"])}
    else:
        if not (a.weights and a.overrides):
            ap.error("apply-overrides needs --weights and --overrides")
        rep = apply_overrides(obj, a.weights, a.overrides)
    if a.save:
        same = bpy.data.filepath and os.path.normcase(os.path.abspath(a.save)) == os.path.normcase(os.path.abspath(bpy.data.filepath))
        if same and not a.overwrite:
            raise ValueError("--save points at the opened .blend; add --overwrite to replace it")
        fp = bpy.context.preferences.filepaths
        old = fp.save_version
        try:
            fp.save_version = 0  # no <file>.blend1 backup next to the target (the pipeline's snapshots keep the earlier states)
            bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(a.save), copy=not same)
        finally:
            fp.save_version = old
        rep["saved"] = os.path.abspath(a.save)
    print("SKIN_IO " + json.dumps({"ok": True, "command": a.command, **rep}, default=str))
    return 0


if __name__ == "__main__":
    import traceback

    _argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    try:
        _code = main(_argv)
    except SystemExit as e:
        _code = int(e.code or 0)
    except Exception:
        traceback.print_exc()
        print("SKIN_IO " + json.dumps({"ok": False, "error": traceback.format_exc(limit=3)}))
        _code = 1
    from rigkit import bl

    bl.exit_now(_code)  # os._exit without Blender's teardown, after removing the session temp folder Blender would remove

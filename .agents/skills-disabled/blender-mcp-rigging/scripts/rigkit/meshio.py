"""rigkit.meshio - mesh arrays out of Blender: mesh.npz export (rigcore.npzio.save_mesh) and rest / evaluated vertex positions.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X.  Arrays are in Blender vertex order; ``V`` is in the
mesh's OBJECT space (after S2 the mesh object has an identity transform, so object = world), ``F`` are the loop triangles over
original vertex ids, ``UV`` is per vertex (the last loop of a vertex wins, as in D01; the glTF importer already splits UV seams),
``mat`` is the material index per triangle and ``weld`` comes from ``rigcore.mesh.weld_map``.
"""
from __future__ import annotations

import numpy as np

from rigcore import mesh as rmesh
from rigcore import npzio

try:
    import bpy
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None


def _xyz(coll, n: int, attr: str = "co", dtype=np.float64) -> np.ndarray:
    a = np.empty(n * 3, dtype=dtype)
    coll.foreach_get(attr, a)
    return a.reshape(n, 3)


def _world(a: np.ndarray, ob) -> np.ndarray:
    mw = np.array(ob.matrix_world, dtype=np.float64)
    return a @ mw[:3, :3].T + mw[:3, 3]


def rest_vertices(ob, world: bool = False) -> np.ndarray:
    """Stored (undeformed) vertex positions, float64 (n,3); object space unless ``world``."""
    me = ob.data
    a = _xyz(me.vertices, len(me.vertices))
    return _world(a, ob) if world else a


def evaluated_vertices(obj, depsgraph=None, world: bool = False) -> np.ndarray:
    """Vertex positions of the evaluated mesh (modifiers applied, e.g. the Armature modifier in a pose), float32 (n,3); object
    space unless ``world``. ValueError when a modifier changed the vertex count."""
    dg = depsgraph or bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    try:
        n = len(me.vertices)
        if n != len(obj.data.vertices):
            raise ValueError(f"evaluated mesh of {obj.name!r} has {n} vertices, the original {len(obj.data.vertices)}")
        a = _xyz(me.vertices, n, dtype=np.float32)
    finally:
        ev.to_mesh_clear()
    return _world(a.astype(np.float64), obj).astype(np.float32) if world else a


def triangles(me) -> tuple[np.ndarray, np.ndarray]:
    """``(F int32 (m,3), mat int16 (m,))`` from the loop triangles."""
    me.calc_loop_triangles()
    m = len(me.loop_triangles)
    F = np.empty(m * 3, dtype=np.int32)
    me.loop_triangles.foreach_get("vertices", F)
    mat = np.empty(m, dtype=np.int32)
    me.loop_triangles.foreach_get("material_index", mat)
    return F.reshape(m, 3), mat.astype(np.int16)


def vertex_uv(me, layer=None) -> np.ndarray | None:
    """Per-vertex UV float32 (n,2) from ``layer`` (default the active layer); None when the mesh has no UV layer."""
    if not me.uv_layers:
        return None
    lay = me.uv_layers[layer] if layer is not None else (me.uv_layers.active or me.uv_layers[0])
    nl = len(me.loops)
    uv_loop = np.empty(nl * 2, dtype=np.float64)
    lay.data.foreach_get("uv", uv_loop)
    vl = np.empty(nl, dtype=np.int64)
    me.loops.foreach_get("vertex_index", vl)
    uv = np.zeros((len(me.vertices), 2), dtype=np.float64)
    uv[vl] = uv_loop.reshape(nl, 2)
    return uv.astype(np.float32)


def mesh_arrays(ob) -> dict:
    """``{V float64 (n,3) object space, F int32 (m,3), UV float32 (n,2) | None, mat int16 (m,)}`` of mesh object ``ob``."""
    me = ob.data
    F, mat = triangles(me)
    return {"V": rest_vertices(ob), "F": F, "UV": vertex_uv(me), "mat": mat}


def export_mesh_npz(ob, path, asset_id: str, H: float, scale_factor: float | None = None, source_sha256: str | None = None,
                    weld_tol_rel: float = 1e-6, **meta_more) -> dict:
    """Write ``mesh.npz`` for mesh object ``ob`` (rigcore.npzio.save_mesh; weld by ``rigcore.mesh.weld_map(V, weld_tol_rel)``).
    Returns a summary ``{path, n_vertices, n_triangles, n_welded, uv, materials}``."""
    a = mesh_arrays(ob)
    weld = rmesh.weld_map(a["V"], tol_rel=weld_tol_rel)
    meta = npzio.mesh_meta(asset_id, H, scale_factor=scale_factor, source_sha256=source_sha256, object=ob.name,
                           weld_tol_rel=weld_tol_rel, **meta_more)
    npzio.save_mesh(path, a["V"], a["F"], weld=weld, UV=a["UV"], mat=a["mat"], meta=meta)
    return {"path": str(path), "n_vertices": int(a["V"].shape[0]), "n_triangles": int(a["F"].shape[0]),
            "n_welded": int(weld.max()) + 1 if weld.size else 0, "uv": a["UV"] is not None, "materials": int(a["mat"].max()) + 1 if a["mat"].size else 0}

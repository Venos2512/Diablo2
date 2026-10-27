"""rigkit.intake - S0/S2: import the source GLB read-only (sha256 checked before and after), uniform scale to the catalogue height
H, feet at z = 0, transforms applied, images packed; later the mesh is parented to the runtime armature.

Units: metres.  Frame: Blender, Z up, character front -Y, character left +X (the glTF importer turns glTF (x, y, z) into Blender
(x, -z, y)).

Height rule (mesh-intake.md S2): H is the highest point of the body. ``factor = H / (z_max - z_min)`` of the imported mesh, then
``v' = (v - (0, 0, z_min)) * factor``: feet at z = 0 and top at H. D01: z_min = 0 exactly, factor 0.679495687 (= 0.5 / 0.73584),
vertex for vertex identical to ``b1_build_rig.py`` (same float64 path, written back as float32). The mesh.npz meta carries
``scale_factor`` and ``z_offset = -z_min * factor`` (``mesh_z_offset``), the ``solvers.glbmesh`` convention that
``solvers.unirig_bridge`` uses to bring UniRig's glTF positions into the mesh frame.

Typical use::

    bl.new_empty_file()
    mesh_ob, info = intake.import_glb(glb, expected_sha256=sha, mesh_name="D01_hodling")
    info["normalize"] = intake.normalize(mesh_ob, H=0.5)
    ...
    intake.parent_to_armature(mesh_ob, runtime_ob)

Step CLI (S0 + S2 into a NEW rig .blend; refuses to overwrite)::

    blender -b --factory-startup -P rigkit/intake.py -- --glb asset.glb --asset-id D01_hodling --H 0.5 --out-dir <rig dir>
            [--sha256 <expected>] [--family S_legacy_D01]   ->  <asset_id>_rig.blend, _work/mesh.npz, intake.json, rig_recipe.json
"""
from __future__ import annotations

import os
import sys

if __name__ == "__main__":  # run as a script: put scripts/ on sys.path (no __pycache__ next to the sources)
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np  # noqa: E402

from rigkit import bl  # noqa: E402

try:
    import bpy
    from mathutils import Matrix
except ImportError:  # pragma: no cover - pure-Python use
    bpy = None


def import_glb(path, expected_sha256: str | None = None, mesh_name: str | None = None, allow_other: bool = False) -> tuple:
    """Import the GLB at ``path`` into the open file, read only: its sha256 is checked before (against ``expected_sha256`` when given)
    and after the import. The importer's empty parents are removed with the children's world transforms kept (D01). Exactly one
    mesh object is expected; other object types (armatures, cameras...) raise unless ``allow_other``.

    Returns ``(mesh_object, info)`` with ``info = {glb, sha256, objects, removed_empties, vertices, polygons, triangles, uv_layers,
    materials, images}``; the mesh is renamed ``mesh_name`` (data ``<mesh_name>_mesh``) when given."""
    bl.require_bpy()
    path = os.path.abspath(os.fspath(path))
    sha = bl.sha256_file(path)
    if expected_sha256 and sha != expected_sha256:
        raise ValueError(f"GLB {path} has sha256 {sha}, expected {expected_sha256}: the source changed")
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    other = [o.name for o in new if o.type not in ("MESH", "EMPTY")]
    if len(meshes) != 1:
        raise ValueError(f"GLB {path}: expected exactly one mesh object, got {[o.name for o in meshes]}")
    if other and not allow_other:
        raise ValueError(f"GLB {path}: unexpected objects {other} (pre-rigged or a scene?); pass allow_other=True to keep them")
    imported = [o.name for o in new]
    removed = []
    for o in [o for o in new if o.type == "EMPTY"]:
        for ch in list(o.children):
            mw = ch.matrix_world.copy()
            ch.parent = None
            ch.matrix_world = mw
        removed.append(o.name)
        bpy.data.objects.remove(o)
    mesh_ob = meshes[0]
    if mesh_name:
        mesh_ob.name = mesh_name
        mesh_ob.data.name = mesh_name + "_mesh"
        if mesh_ob.name != mesh_name:
            raise RuntimeError(f"an object named {mesh_name!r} already exists; import into an empty file (bl.new_empty_file)")
    after = bl.sha256_file(path)
    if after != sha:
        raise RuntimeError(f"GLB {path} changed during the import ({sha} -> {after})")
    me = mesh_ob.data
    me.calc_loop_triangles()
    info = {"glb": path, "sha256": sha, "objects": imported, "kept": mesh_ob.name, "removed_empties": removed,
            "other_objects": other, "vertices": len(me.vertices), "polygons": len(me.polygons), "triangles": len(me.loop_triangles),
            "uv_layers": [u.name for u in me.uv_layers], "materials": [m.name for m in me.materials if m],
            "images": sorted(i.name for i in bpy.data.images)}
    return mesh_ob, info


def _is_identity(m, tol=0.0) -> bool:
    return all(abs(m[i][j] - (1.0 if i == j else 0.0)) <= tol for i in range(4) for j in range(4))


def normalize(mesh_ob, H: float, ground: bool = True, verify_tol_m: float = 1e-6) -> dict:
    """S2 on ``mesh_ob``: bake its world transform into the vertices (skipped when it is exactly identity), scale uniformly so that
    the mesh is ``H`` metres tall (about the origin) and, with ``ground``, translate it so the lowest vertex is at z = 0. The object
    ends with an identity transform.

    Verification (mesh-intake.md): ``v' / factor + (0, 0, z_min)`` reproduces the imported positions within ``verify_tol_m``; the
    triangle and loop counts are unchanged. Returns ``{factor, H, z_min_m, z_max_m, offset_z_m, baked_transform, roundtrip_max_m,
    ok, ...}`` (log it in the recipe: ``scale.factor``)."""
    bl.require_bpy()
    me = mesh_ob.data
    me.calc_loop_triangles()
    n_tri, n_loop = len(me.loop_triangles), len(me.loops)
    if mesh_ob.parent is not None:
        raise ValueError(f"mesh {mesh_ob.name!r} still has a parent ({mesh_ob.parent.name!r}); normalize before parenting")
    baked = not _is_identity(mesh_ob.matrix_world)
    if baked:
        me.transform(mesh_ob.matrix_world)
    mesh_ob.location = (0.0, 0.0, 0.0)
    mesh_ob.rotation_euler = (0.0, 0.0, 0.0)
    mesh_ob.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    mesh_ob.scale = (1.0, 1.0, 1.0)
    mesh_ob.delta_location = (0.0, 0.0, 0.0)
    mesh_ob.delta_rotation_euler = (0.0, 0.0, 0.0)
    mesh_ob.delta_rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    mesh_ob.delta_scale = (1.0, 1.0, 1.0)
    bl.update()
    if not _is_identity(mesh_ob.matrix_world, 1e-12):
        raise RuntimeError(f"mesh {mesh_ob.name!r}: object transform is not identity after the reset")
    n = len(me.vertices)
    co = np.empty(n * 3)  # float64 copy of the float32 coordinates (the D01 path)
    me.vertices.foreach_get("co", co)
    co = co.reshape(n, 3)
    co0 = co.copy()
    z_min, z_max = float(co[:, 2].min()), float(co[:, 2].max())
    if not z_max > z_min:
        raise ValueError(f"mesh {mesh_ob.name!r} has no height (z {z_min}..{z_max})")
    factor = float(H) / (z_max - z_min)
    off = z_min if ground else 0.0
    if off != 0.0:
        co[:, 2] -= off
    co *= factor
    me.vertices.foreach_set("co", co.ravel())
    me.update()
    back = np.empty(n * 3)
    me.vertices.foreach_get("co", back)
    back = back.reshape(n, 3) / factor
    back[:, 2] += off
    rt = float(np.abs(back - co0).max())
    # the stored coordinates are float32: allow one float32 spacing of the largest scaled coordinate, mapped back by 1/factor
    tol = max(float(verify_tol_m), float(np.spacing(np.float32(np.abs(co).max()))) / factor)
    me.calc_loop_triangles()
    same_topo = len(me.loop_triangles) == n_tri and len(me.loops) == n_loop
    new_min = float(co[:, 2].min())
    return {"factor": factor, "H": float(H), "z_min_m": z_min, "z_max_m": z_max, "offset_z_m": off, "baked_transform": baked,
            "height_after_m": float(co[:, 2].max() - new_min), "z_min_after_m": new_min, "roundtrip_max_m": rt,
            "roundtrip_tol_m": tol, "topology_unchanged": bool(same_topo), "ok": bool(rt <= tol and same_topo)}


def mesh_z_offset(nz: dict) -> float:
    """``z_offset`` of mesh.npz meta in the ``solvers.glbmesh`` convention, ``V = V_imported * scale_factor + (0, 0, z_offset)``,
    from a ``normalize`` result: ``-offset_z_m * factor`` (``offset_z_m`` is the imported z_min before scaling). 0.0 for a mesh
    grounded at z = 0 (Tripo GLBs). ``solvers/unirig_bridge.py`` and ``solvers/skin_unirig.py`` map UniRig's glTF positions to
    the mesh frame with it."""
    off = float(nz["offset_z_m"])
    return 0.0 if off == 0.0 else -off * float(nz["factor"])


def pack_images() -> list:
    """Pack every file image that is not packed yet (the rig .blend carries its textures, as D01). Returns the packed names."""
    bl.require_bpy()
    out = []
    for img in bpy.data.images:
        if img.source == "FILE" and not img.packed_file:
            img.pack()
            out.append(img.name)
    return out


def parent_to_armature(mesh_ob, arm_ob, modifier_name: str = "Armature") -> dict:
    """Parent ``mesh_ob`` to the runtime armature (object parent, identity parent inverse) and give it exactly one Armature modifier
    on ``arm_ob`` with the runtime-emulation settings: vertex groups on, envelopes off, Preserve Volume off."""
    bl.require_bpy()
    mesh_ob.parent = arm_ob
    mesh_ob.parent_type = "OBJECT"
    mesh_ob.matrix_parent_inverse = Matrix.Identity(4)
    mods = [m for m in mesh_ob.modifiers if m.type == "ARMATURE"]
    for m in mods[1:]:
        mesh_ob.modifiers.remove(m)
    mod = mods[0] if mods else mesh_ob.modifiers.new(modifier_name, "ARMATURE")
    mod.name = modifier_name
    mod.object = arm_ob
    mod.use_vertex_groups = True
    mod.use_bone_envelopes = False
    mod.use_deform_preserve_volume = False
    bl.update()
    return {"parent": arm_ob.name, "modifier": mod.name, "modifiers": [(m.type, m.name) for m in mesh_ob.modifiers],
            "parent_inverse_identity": _is_identity(mesh_ob.matrix_parent_inverse)}


def record_scene(info: dict, asset_id: str):
    """Scene custom properties so a reopened .blend still knows its intake (asset id, H, factor, source hash)."""
    sc = bpy.context.scene
    sc["rigkit_asset_id"] = asset_id
    if "sha256" in info:
        sc["rigkit_source_sha256"] = info["sha256"]
    nz = info.get("normalize") or {}
    if nz:
        sc["rigkit_H"] = nz["H"]
        sc["rigkit_scale_factor"] = nz["factor"]
        sc["rigkit_offset_z"] = nz["offset_z_m"]


def main(argv=None) -> int:
    import argparse

    from rigcore import npzio, recipe, template
    from rigkit import meshio

    ap = argparse.ArgumentParser(description="S0/S2: import the source GLB read-only, scale to H, save a new rig .blend + mesh.npz")
    ap.add_argument("--glb", required=True)
    ap.add_argument("--asset-id", required=True)
    ap.add_argument("--H", type=float, required=True, help="catalogue height in metres")
    ap.add_argument("--out-dir", required=True, help="rig folder (scratch while testing)")
    ap.add_argument("--sha256", default=None, help="expected sha256 of the GLB")
    ap.add_argument("--family", default=None, help="family name/path; only its builder.names are used here (legacy D01 names)")
    ap.add_argument("--blend", default=None, help="output .blend (default <out-dir>/<asset_id>_rig.blend)")
    a = ap.parse_args(bl.script_args() if argv is None else argv)
    fam = template.load_family(a.family) if a.family else None
    names = bl.rig_names(a.asset_id, fam)
    blend = os.path.abspath(a.blend or os.path.join(a.out_dir, f"{a.asset_id}_rig.blend"))
    rpath = os.path.join(a.out_dir, "rig_recipe.json")
    for p in (blend, rpath):
        if os.path.exists(p):
            raise FileExistsError(f"{p} exists: intake starts a new rig and never overwrites earlier evidence")
    bl.new_empty_file()
    col = bl.ensure_collection(names["collection"])
    mesh_ob, info = import_glb(a.glb, expected_sha256=a.sha256, mesh_name=names["mesh"])
    info["normalize"] = normalize(mesh_ob, a.H)
    info["packed"] = pack_images()
    bl.move_to_collection(mesh_ob, col)
    bl.tag(mesh_ob, "mesh", a.asset_id)
    record_scene(info, a.asset_id)
    info["mesh_npz"] = meshio.export_mesh_npz(mesh_ob, os.path.join(a.out_dir, "_work", "mesh.npz"), a.asset_id, a.H,
                                              scale_factor=info["normalize"]["factor"], source_sha256=info["sha256"],
                                              z_offset=mesh_z_offset(info["normalize"]))
    bl.save_main(blend)
    rec = recipe.new_recipe(a.asset_id, glb=os.path.abspath(a.glb), sha256=info["sha256"], family=fam["family"] if fam else None,
                            template=template.template_info(fam) if fam else None, factor=info["normalize"]["factor"], H=a.H)
    recipe.log_step(rec, "S0", {"glb": os.path.abspath(a.glb), "expected_sha256": a.sha256},
                    {k: info[k] for k in ("sha256", "objects", "removed_empties", "vertices", "triangles", "uv_layers", "images")})
    recipe.log_step(rec, "S2", {"H": a.H, "ground": True}, {"normalize": info["normalize"], "blend": blend, "mesh_npz": info["mesh_npz"]["path"]})
    recipe.save_recipe(rpath, rec)
    npzio.write_json(os.path.join(a.out_dir, "intake.json"), info)
    print(bl.json_line({"step": "S0+S2", "ok": info["normalize"]["ok"], "blend": blend, "factor": info["normalize"]["factor"],
                        "vertices": info["vertices"], "sha256": info["sha256"]}))
    return 0 if info["normalize"]["ok"] else 1


if __name__ == "__main__":
    bl.run_main(main)

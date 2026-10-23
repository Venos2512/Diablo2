r"""solvers.glbmesh - GLB -> mesh.npz without Blender (trimesh, ``process=False``). For development and analysis only; the rig itself
imports the GLB in Blender (rigkit.intake).

Frames: glTF is +Y up, front +Z; Blender is Z up, front -Y, character left +X. Blender's glTF importer maps (x, y, z)_glTF to
(x, -z, y)_Blender, and so does ``gltf_to_blender``.

S2 normalisation (references/mesh-intake.md): one uniform factor so that the mesh spans H in Blender Z, then a Z shift that puts the
lowest vertex at z = 0. Tripo GLBs already have their soles at y = 0, so the shift is 0 and the factor is H / top of mesh (D01:
0.5 / 0.73584 = 0.679495687, as in its qa_report). X and Y are never centred: D01's legs sit 10.5 mm off the arm/head line and the
rig follows the mesh as it is.

Vertex order: trimesh with ``process=False`` keeps the accessor order (no merge, no reorder, unreferenced vertices kept), which is
also what Blender's importer does with "merge vertices" off (cross-checked on D01 by tests/rigkit/A2_test_glb_import_order.py).
UVs use the Blender/OpenGL convention (v up = 1 - v_glTF), as trimesh and Blender both flip on import.

Also here: a raw GLB reader (``read_glb``, ``accessor``, ``node_world_matrices``) for the parts trimesh does not expose (skins,
JOINTS_0/WEIGHTS_0, inverse bind matrices; used by unirig_bridge) and ``texture_info`` for the S1 texture sanity check.

CLI:  python glbmesh.py <file.glb> --asset-id D01_hodling --H 0.5 [--out E:\tmp_rigkit\A2\D01_hodling\mesh.npz]
"""
from __future__ import annotations

import hashlib
import json
import os
import struct
import sys

import numpy as np

if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rigcore import npzio  # noqa: E402

SCRATCH = r"E:\tmp_rigkit\A2"

#: Blender = GLTF_TO_BLENDER @ glTF (column vectors)
GLTF_TO_BLENDER = np.array([[1.0, 0.0, 0.0], [0.0, 0.0, -1.0], [0.0, 1.0, 0.0]])

_COMPONENT_DTYPES = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
_TYPE_SIZES = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


# --------------------------------------------------------------------------------------------------------------------------
# frames
# --------------------------------------------------------------------------------------------------------------------------


def gltf_to_blender(P) -> np.ndarray:
    """(…,3) glTF positions or directions -> Blender frame: (x, y, z) -> (x, -z, y)."""
    P = np.asarray(P, dtype=np.float64)
    return np.stack([P[..., 0], -P[..., 2], P[..., 1]], axis=-1)


def blender_to_gltf(P) -> np.ndarray:
    """Inverse of ``gltf_to_blender``: (x, y, z)_Blender -> (x, z, -y)_glTF."""
    P = np.asarray(P, dtype=np.float64)
    return np.stack([P[..., 0], P[..., 2], -P[..., 1]], axis=-1)


def gltf_matrix_to_blender(M) -> np.ndarray:
    """4x4 glTF-frame transform -> the same transform expressed in the Blender frame (C M C^-1)."""
    C = np.eye(4)
    C[:3, :3] = GLTF_TO_BLENDER
    return C @ np.asarray(M, dtype=np.float64) @ C.T


# --------------------------------------------------------------------------------------------------------------------------
# raw GLB reader
# --------------------------------------------------------------------------------------------------------------------------


def sha256_file(path) -> str:
    h = hashlib.sha256()
    with open(os.fspath(path), "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def read_glb(path) -> tuple[dict, bytes]:
    """Binary glTF 2.0 container -> (JSON dict, BIN chunk bytes). ValueError for anything else (.gltf + external buffers are not read)."""
    with open(os.fspath(path), "rb") as f:
        data = f.read()
    if len(data) < 20 or data[:4] != b"glTF":
        raise ValueError(f"read_glb: {path} is not a binary glTF file")
    version, length = struct.unpack("<II", data[4:12])
    if version != 2:
        raise ValueError(f"read_glb: {path}: glTF version {version}, expected 2")
    off, js, bin_ = 12, None, b""
    while off + 8 <= min(length, len(data)):
        clen, ctype = struct.unpack("<II", data[off:off + 8])
        chunk = data[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:  # JSON
            js = json.loads(chunk.decode("utf-8"))
        elif ctype == 0x004E4942 and not bin_:  # BIN
            bin_ = chunk
        off += 8 + clen
    if js is None:
        raise ValueError(f"read_glb: {path} has no JSON chunk")
    return js, bin_


def accessor(js: dict, bin_: bytes, index: int, normalize: bool = True) -> np.ndarray:
    """Accessor ``index`` as a (count, n_components) array in its component dtype. With ``normalize`` an accessor flagged
    ``normalized`` is returned as float64 (unsigned -> [0, 1], signed -> [-1, 1], glTF rules). Sparse accessors are rejected."""
    a = js["accessors"][index]
    if "sparse" in a:
        raise ValueError(f"accessor {index}: sparse accessors are not supported")
    dt = np.dtype(_COMPONENT_DTYPES[a["componentType"]])
    nc = _TYPE_SIZES[a["type"]]
    cnt = int(a["count"])
    if "bufferView" not in a:
        arr = np.zeros((cnt, nc), dtype=dt)
    else:
        bv = js["bufferViews"][a["bufferView"]]
        if bv.get("buffer", 0) != 0:
            raise ValueError(f"accessor {index}: only buffer 0 (the GLB BIN chunk) is supported")
        base = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
        stride = bv.get("byteStride", dt.itemsize * nc)
        if stride == dt.itemsize * nc:
            arr = np.frombuffer(bin_, dtype=dt, count=cnt * nc, offset=base).reshape(cnt, nc)
        else:
            rows = np.lib.stride_tricks.as_strided(np.frombuffer(bin_, dtype=np.uint8, offset=base),
                                                   shape=(cnt, dt.itemsize * nc), strides=(stride, 1))
            arr = np.ascontiguousarray(rows).view(dt).reshape(cnt, nc)
    if normalize and a.get("normalized") and dt.kind in "iu":
        info = np.iinfo(dt)
        arr = np.maximum(arr.astype(np.float64) / info.max, -1.0)
    return arr


def node_local_matrix(node: dict) -> np.ndarray:
    """4x4 local transform of a glTF node (``matrix`` or T * R * S), glTF frame."""
    if "matrix" in node:
        return np.array(node["matrix"], dtype=np.float64).reshape(4, 4).T
    t = np.array(node.get("translation", [0.0, 0.0, 0.0]), dtype=np.float64)
    x, y, z, w = (float(c) for c in node.get("rotation", [0.0, 0.0, 0.0, 1.0]))
    s = np.array(node.get("scale", [1.0, 1.0, 1.0]), dtype=np.float64)
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * s
    M[:3, 3] = t
    return M


def node_world_matrices(js: dict) -> tuple[dict, dict]:
    """World matrix per node index (glTF frame) and the parent map ``{child: parent}``."""
    nodes = js.get("nodes", [])
    parent = {c: i for i, n in enumerate(nodes) for c in n.get("children", [])}
    world: dict[int, np.ndarray] = {}

    def wm(i: int) -> np.ndarray:
        if i not in world:
            chain = [i]
            while chain[-1] in parent and parent[chain[-1]] not in world:
                chain.append(parent[chain[-1]])
            for k in reversed(chain):
                M = node_local_matrix(nodes[k])
                world[k] = world[parent[k]] @ M if k in parent else M
        return world[i]

    for i in range(len(nodes)):
        wm(i)
    return world, parent


def texture_info(path) -> dict:
    """Texture sanity data of a GLB (references/mesh-intake.md): file size, image count and bytes, and which PBR maps each material
    uses. A Tripo GLB under 1 MB, or without base colour + normal + metallic-roughness maps, has lost its textures."""
    js, _ = read_glb(path)
    images = js.get("images", [])
    img_bytes = []
    for im in images:
        if "bufferView" in im:
            img_bytes.append(int(js["bufferViews"][im["bufferView"]]["byteLength"]))
    mats = []
    for m in js.get("materials", []):
        pbr = m.get("pbrMetallicRoughness", {})
        maps = [k for k in ("baseColorTexture", "metallicRoughnessTexture") if k in pbr]
        maps += [k for k in ("normalTexture", "occlusionTexture", "emissiveTexture") if k in m]
        mats.append({"name": m.get("name"), "maps": maps})
    return {
        "glb_bytes": os.path.getsize(os.fspath(path)),
        "n_images": len(images),
        "image_bytes": img_bytes,
        "image_mime": [im.get("mimeType") for im in images],
        "n_materials": len(mats),
        "materials": mats,
        "n_textures": len(js.get("textures", [])),
        "extensions_used": js.get("extensionsUsed", []),
    }


# --------------------------------------------------------------------------------------------------------------------------
# mesh loading
# --------------------------------------------------------------------------------------------------------------------------


def _node_order(js: dict) -> dict:
    """Depth-first order of node names in the default scene (the order Blender creates objects in); unnamed nodes are skipped."""
    order: dict[str, int] = {}
    nodes = js.get("nodes", [])
    scene = js.get("scenes", [{}])[js.get("scene", 0)] if js.get("scenes") else {"nodes": list(range(len(nodes)))}
    stack = list(reversed(scene.get("nodes", [])))
    while stack:
        i = stack.pop()
        name = nodes[i].get("name")
        if name is not None and name not in order:
            order[name] = len(order)
        stack.extend(reversed(nodes[i].get("children", [])))
    return order


def _primitive_material(js: dict, node_name: str, n_vertices: int, n_faces: int, used: set) -> int:
    """glTF material index of the primitive behind a trimesh geometry (matched by node name, then vertex and index counts)."""
    for ni, node in enumerate(js.get("nodes", [])):
        if node.get("name") != node_name or "mesh" not in node:
            continue
        for pi, prim in enumerate(js["meshes"][node["mesh"]]["primitives"]):
            key = (ni, pi)
            if key in used:
                continue
            nv = js["accessors"][prim["attributes"]["POSITION"]]["count"]
            ni_ = js["accessors"][prim["indices"]]["count"] if "indices" in prim else nv
            if nv == n_vertices and ni_ == 3 * n_faces:
                used.add(key)
                return int(prim.get("material", -1))
    return -1


def load_gltf_mesh(path) -> dict:
    """All triangle geometry of a GLB in glTF WORLD space (node transforms applied), parts concatenated in scene node order.

    Returns ``{"V_gltf": float64 (n,3), "F": int32 (m,3), "UV": float32 (n,2) | None, "mat": int16 (m,), "parts": [...]}``;
    UV in the Blender/OpenGL convention (v up), ``mat`` = glTF material index per triangle (-1 if none)."""
    import trimesh  # rigkit-env only

    js, _ = read_glb(path)
    scene = trimesh.load(os.fspath(path), process=False, force="scene")
    order = _node_order(js)
    geo_nodes = sorted(scene.graph.nodes_geometry, key=lambda n: (order.get(n, 1 << 30), n))
    Vs, Fs, UVs, mats, parts = [], [], [], [], []
    used: set = set()
    base = 0
    for node_name in geo_nodes:
        T, geom_name = scene.graph[node_name]
        g = scene.geometry[geom_name]
        if not hasattr(g, "faces") or len(g.faces) == 0:
            continue
        V = np.asarray(g.vertices, dtype=np.float64)
        V = V @ T[:3, :3].T + T[:3, 3]
        F = np.asarray(g.faces, dtype=np.int64)
        uv = getattr(g.visual, "uv", None)
        UVs.append(np.asarray(uv, dtype=np.float32) if uv is not None and len(uv) == len(V) else None)
        mat = _primitive_material(js, node_name, len(V), len(F), used)
        Vs.append(V)
        Fs.append(F + base)
        mats.append(np.full(len(F), mat, dtype=np.int16))
        parts.append({"node": node_name, "geometry": geom_name, "n_vertices": int(len(V)), "n_faces": int(len(F)),
                      "material": mat, "transform_is_identity": bool(np.allclose(T, np.eye(4)))})
        base += len(V)
    if not Vs:
        raise ValueError(f"load_gltf_mesh: {path} has no triangle geometry")
    UV = None
    if all(u is not None for u in UVs):
        UV = np.concatenate(UVs, axis=0)
    return {"V_gltf": np.concatenate(Vs, axis=0), "F": np.concatenate(Fs, axis=0).astype(np.int32), "UV": UV,
            "mat": np.concatenate(mats), "parts": parts}


def s2_normalize(V_blender, H: float) -> tuple[np.ndarray, float, float]:
    """Uniform scale so that the Z extent equals ``H`` (metres), then shift Z so the lowest vertex is at 0.

    Returns ``(V, factor, z_offset)`` with ``V = V_blender * factor + (0, 0, z_offset)``; Tripo GLBs give ``z_offset == 0``."""
    V = np.asarray(V_blender, dtype=np.float64)
    zmin, zmax = float(V[:, 2].min()), float(V[:, 2].max())
    if not zmax > zmin:
        raise ValueError("s2_normalize: the mesh has no height")
    factor = float(H) / (zmax - zmin)
    z_off = -zmin * factor
    out = V * factor
    out[:, 2] += z_off
    return out, factor, (0.0 if z_off == 0 else z_off)


def glb_to_mesh(path, asset_id: str, H: float) -> dict:
    """GLB -> contract mesh dict (``V`` Blender frame after S2, ``F``, ``weld``, ``UV``, ``mat``, ``meta``), validated by
    rigcore.schema. ``meta`` adds ``z_offset``, ``source_glb``, ``loader`` and the per-part table to the contract keys."""
    from rigcore import mesh as rmesh, schema

    g = load_gltf_mesh(path)
    Vb = gltf_to_blender(g["V_gltf"])
    V, factor, z_off = s2_normalize(Vb, H)
    meta = npzio.mesh_meta(asset_id, H, scale_factor=factor, source_sha256=sha256_file(path), z_offset=z_off,
                           source_glb=os.path.abspath(os.fspath(path)), loader="solvers.glbmesh (trimesh process=False)",
                           frame="Blender: Z up, front -Y, left +X", parts=g["parts"])
    d = {"V": V, "F": g["F"], "weld": rmesh.weld_map(V), "UV": g["UV"], "mat": g["mat"], "meta": meta}
    return schema.validate_mesh(d)


def write_mesh_npz(path_glb, out_path, asset_id: str, H: float) -> dict:
    """``glb_to_mesh`` + ``rigcore.npzio.save_mesh``. Returns the mesh dict."""
    m = glb_to_mesh(path_glb, asset_id, H)
    npzio.save_mesh(out_path, m["V"], m["F"], weld=m["weld"], UV=m["UV"], mat=m["mat"], meta=m["meta"])
    return m


def default_mesh_path(asset_id: str) -> str:
    return os.path.join(SCRATCH, asset_id, "mesh.npz")


def main(argv=None) -> int:
    import argparse

    ap = argparse.ArgumentParser(description="GLB -> mesh.npz (Blender frame, S2 scale) without Blender")
    ap.add_argument("glb")
    ap.add_argument("--asset-id", required=True)
    ap.add_argument("--H", type=float, required=True, help="catalogue height in metres (D01 0.5, FL 1.8)")
    ap.add_argument("--out", default=None, help=r"default E:\tmp_rigkit\A2\<asset_id>\mesh.npz")
    a = ap.parse_args(argv)
    out = a.out or default_mesh_path(a.asset_id)
    m = write_mesh_npz(a.glb, out, a.asset_id, a.H)
    V = m["V"]
    print(json.dumps({"out": out, "n_vertices": int(len(V)), "n_triangles": int(len(m["F"])), "n_welded": int(m["weld"].max()) + 1,
                      "scale_factor": m["meta"]["scale_factor"], "z_offset": m["meta"]["z_offset"],
                      "bbox_min": V.min(0).round(6).tolist(), "bbox_max": V.max(0).round(6).tolist()}))
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Doc GLB thuan python+numpy (khong qua importer Blender): JSON, accessor, anh, ma tran node."""
import hashlib
import json
import struct

import numpy as np

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT2": 4, "MAT3": 9, "MAT4": 16}


def read_glb(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    js = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack("<I", b[off:off + 4])[0]
    return js, b[off + 8:off + 8 + bl]


def accessor(js, bin_, i):
    a = js["accessors"][i]
    bv = js["bufferViews"][a["bufferView"]]
    dt = np.dtype(CT[a["componentType"]])
    nc = NC[a["type"]]
    stride = bv.get("byteStride", dt.itemsize * nc)
    base = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    cnt = a["count"]
    if stride == dt.itemsize * nc:
        arr = np.frombuffer(bin_, dtype=dt, count=cnt * nc, offset=base).reshape(cnt, nc)
    else:
        arr = np.stack([np.frombuffer(bin_, dtype=dt, count=nc, offset=base + k * stride) for k in range(cnt)])
    if a.get("normalized"):
        info = np.iinfo(dt)
        arr = np.maximum(arr.astype(np.float64) / info.max, -1.0)
    return arr.astype(np.float64) if arr.dtype != np.uint32 and arr.dtype.kind == "f" else arr


def image_bytes(js, bin_, i):
    bv = js["bufferViews"][js["images"][i]["bufferView"]]
    o = bv.get("byteOffset", 0)
    return bin_[o:o + bv["byteLength"]]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def node_local(n):
    if "matrix" in n:
        return np.array(n["matrix"]).reshape(4, 4).T
    t = np.array(n.get("translation", [0, 0, 0]), float)
    q = np.array(n.get("rotation", [0, 0, 0, 1]), float)
    s = np.array(n.get("scale", [1, 1, 1]), float)
    x, y, z, w = q
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * s
    M[:3, 3] = t
    return M


def node_globals(js):
    nodes = js["nodes"]
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get("children", []):
            parent[c] = i
    G = {}

    def g(i):
        if i in G:
            return G[i]
        M = node_local(nodes[i])
        G[i] = (g(parent[i]) @ M) if i in parent else M
        return G[i]
    for i in range(len(nodes)):
        g(i)
    return G, parent

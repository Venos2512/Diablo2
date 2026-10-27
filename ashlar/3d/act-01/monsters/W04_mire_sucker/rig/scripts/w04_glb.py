"""Minimal GLB reader (numpy): JSON, accessors, node world matrices, embedded images by material role."""
import hashlib
import json
import struct

import numpy as np

CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8, 5122: np.int16, 5120: np.int8}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read(path):
    data = open(path, 'rb').read()
    magic, ver, length = struct.unpack('<III', data[:12])
    assert magic == 0x46546C67, 'not a GLB'
    off = 12
    js, bin_ = None, b''
    while off < length:
        clen, ctype = struct.unpack('<II', data[off:off + 8])
        chunk = data[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(chunk)
        elif ctype == 0x004E4942:
            bin_ = chunk
        off += 8 + clen
    return js, bin_


def accessor(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']])
    nc = NC[a['type']]
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or dt.itemsize * nc
    cnt = a['count']
    raw = np.frombuffer(bin_, dtype=np.uint8, count=stride * (cnt - 1) + dt.itemsize * nc, offset=start)
    out = np.empty((cnt, nc), dtype=dt)
    for k in range(cnt):
        out[k] = np.frombuffer(raw[k * stride:k * stride + dt.itemsize * nc].tobytes(), dtype=dt)
    return out


def accessor_fast(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']])
    nc = NC[a['type']]
    stride = bv.get('byteStride')
    if stride and stride != dt.itemsize * nc:
        return accessor(js, bin_, i)
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(bin_, dtype=dt, count=a['count'] * nc, offset=start).reshape(a['count'], nc).copy()


def trs(node):
    if 'matrix' in node:
        return np.array(node['matrix'], float).reshape(4, 4).T
    t = np.array(node.get('translation', [0, 0, 0]), float)
    q = np.array(node.get('rotation', [0, 0, 0, 1]), float)
    s = np.array(node.get('scale', [1, 1, 1]), float)
    x, y, z, w = q
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * s[None, :]
    M[:3, 3] = t
    return M


def world_matrices(js):
    nodes = js['nodes']
    parent = {}
    for i, nd in enumerate(nodes):
        for c in nd.get('children', []):
            parent[c] = i
    cache = {}

    def W(i):
        if i in cache:
            return cache[i]
        m = trs(nodes[i])
        if i in parent:
            m = W(parent[i]) @ m
        cache[i] = m
        return m
    return [W(i) for i in range(len(nodes))], parent


def images_by_role(js, bin_):
    out = {}
    for mat in js.get('materials', []):
        roles = {'baseColor': (mat.get('pbrMetallicRoughness') or {}).get('baseColorTexture'),
                 'metallicRoughness': (mat.get('pbrMetallicRoughness') or {}).get('metallicRoughnessTexture'),
                 'normal': mat.get('normalTexture')}
        for role, ref in roles.items():
            if not ref:
                continue
            tex = js['textures'][ref['index']]
            src = tex.get('source')
            if src is None:
                continue
            img = js['images'][src]
            bv = js['bufferViews'][img['bufferView']]
            b = bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
            out[role] = dict(sha256=hashlib.sha256(b).hexdigest(), bytes=len(b), mime=img.get('mimeType'))
    return out

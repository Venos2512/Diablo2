"""KayKit Adventurers 1.0 (CC0) animation library reader: glTF accessors -> per-bone local TRS -> armature-space world transforms.

Pure numpy (no Blender). Source file = refs/kaykit-anims-medium.glb (pinned git blob, see clips.json). Output space = Blender (Z up,
-Y forward) after the glTF->Blender basis change (x, y, z)_gltf -> (x, -z, y). 16-bit normalized rotations are decoded per glTF 2.0.
Channels the lab's prepare-kaykit.py removed (bones at rest) are taken from the node rest pose, as a glTF mixer would.
"""
import json
import os
import struct

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REFS = os.path.join(os.path.dirname(HERE), "refs")
ANIM_GLB = os.path.join(REFS, "kaykit-anims-medium.glb")

# glTF (x,y,z) -> Blender (x,-z,y)
B = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], dtype=float)


def _load(path):
    d = open(path, "rb").read()
    n = struct.unpack("<I", d[12:16])[0]
    j = json.loads(d[20:20 + n])
    o = 20 + n
    bl = struct.unpack("<I", d[o:o + 4])[0]
    return j, d[o + 8:o + 8 + bl]


def qmul(a, b):
    w1, x1, y1, z1 = np.moveaxis(a, -1, 0)
    w2, x2, y2, z2 = np.moveaxis(b, -1, 0)
    return np.stack([w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2, w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
                     w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2, w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2], -1)


def qconj(q):
    return np.asarray(q) * np.array([1, -1, -1, -1.0])


def qnorm(q):
    return q / np.linalg.norm(q, axis=-1, keepdims=True)


def q2m(q):
    q = qnorm(np.asarray(q, float))
    w, x, y, z = np.moveaxis(q, -1, 0)
    m = np.empty(q.shape[:-1] + (3, 3))
    m[..., 0, 0] = 1 - 2 * (y * y + z * z); m[..., 0, 1] = 2 * (x * y - z * w); m[..., 0, 2] = 2 * (x * z + y * w)
    m[..., 1, 0] = 2 * (x * y + z * w); m[..., 1, 1] = 1 - 2 * (x * x + z * z); m[..., 1, 2] = 2 * (y * z - x * w)
    m[..., 2, 0] = 2 * (x * z - y * w); m[..., 2, 1] = 2 * (y * z + x * w); m[..., 2, 2] = 1 - 2 * (x * x + y * y)
    return m


def m2q(m):
    m = np.asarray(m, float)
    out = np.empty(m.shape[:-2] + (4,))
    flat = m.reshape(-1, 3, 3)
    o = out.reshape(-1, 4)
    for i, r in enumerate(flat):
        t = np.trace(r)
        if t > 0:
            s = np.sqrt(t + 1) * 2
            q = [s / 4, (r[2, 1] - r[1, 2]) / s, (r[0, 2] - r[2, 0]) / s, (r[1, 0] - r[0, 1]) / s]
        elif r[0, 0] > r[1, 1] and r[0, 0] > r[2, 2]:
            s = np.sqrt(1 + r[0, 0] - r[1, 1] - r[2, 2]) * 2
            q = [(r[2, 1] - r[1, 2]) / s, s / 4, (r[0, 1] + r[1, 0]) / s, (r[0, 2] + r[2, 0]) / s]
        elif r[1, 1] > r[2, 2]:
            s = np.sqrt(1 + r[1, 1] - r[0, 0] - r[2, 2]) * 2
            q = [(r[0, 2] - r[2, 0]) / s, (r[0, 1] + r[1, 0]) / s, s / 4, (r[1, 2] + r[2, 1]) / s]
        else:
            s = np.sqrt(1 + r[2, 2] - r[0, 0] - r[1, 1]) * 2
            q = [(r[1, 0] - r[0, 1]) / s, (r[0, 2] + r[2, 0]) / s, (r[1, 2] + r[2, 1]) / s, s / 4]
        o[i] = q
    return out * np.where(out[..., :1] < 0, -1, 1)


def slerp(a, b, t):
    d = np.sum(a * b, -1, keepdims=True)
    b = np.where(d < 0, -b, b)
    d = np.abs(d)
    th = np.arccos(np.clip(d, -1, 1))
    s = np.sin(th)
    sm = s < 1e-6
    ss = np.where(sm, 1, s)
    w0 = np.where(sm, 1 - t, np.sin((1 - t) * th) / ss)
    w1 = np.where(sm, t, np.sin(t * th) / ss)
    return qnorm(w0 * a + w1 * b)


class Lib:
    def __init__(self, path=ANIM_GLB):
        self.j, self.b = _load(path)
        j = self.j
        self.names = [n["name"] for n in j["nodes"]]
        self.parent = {}
        for i, n in enumerate(j["nodes"]):
            for c in n.get("children", []):
                self.parent[c] = i
        self.rest_t = [np.array(n.get("translation", [0, 0, 0]), float) for n in j["nodes"]]
        self.rest_q = [np.array(n.get("rotation", [0, 0, 0, 1]), float)[[3, 0, 1, 2]] for n in j["nodes"]]  # wxyz
        self.anims = {a["name"]: a for a in j["animations"]}
        order = []

        def walk(i):
            order.append(i)
            for c in j["nodes"][i].get("children", []):
                walk(c)
        for i in range(len(j["nodes"])):
            if i not in self.parent:
                walk(i)
        self.order = order

    def acc(self, i):
        a = self.j["accessors"][i]
        v = self.j["bufferViews"][a["bufferView"]]
        ct = {5126: "f4", 5122: "i2", 5123: "u2", 5120: "i1", 5121: "u1"}[a["componentType"]]
        n = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[a["type"]]
        arr = np.frombuffer(self.b, dtype=ct, count=a["count"] * n,
                            offset=v.get("byteOffset", 0) + a.get("byteOffset", 0)).reshape(-1, n).astype(float)
        if a.get("normalized"):
            m = {"i2": 32767., "u2": 65535., "i1": 127., "u1": 255.}[ct]
            arr = np.maximum(arr / m, -1) if ct[0] == "i" else arr / m
        return arr

    def clip_range(self, name):
        a = self.anims[name]
        ts = [self.acc(s["input"]).ravel() for s in a["samplers"]]
        return 0.0, float(max(t[-1] for t in ts))

    def channels(self, name):
        a = self.anims[name]
        ch = {}
        for c in a["channels"]:
            s = a["samplers"][c["sampler"]]
            assert s.get("interpolation", "LINEAR") == "LINEAR"
            ch[(c["target"]["node"], c["target"]["path"])] = (self.acc(s["input"]).ravel(), self.acc(s["output"]))
        return ch

    def sample_local(self, name, times):
        """-> (T[n_nodes, nt, 3], Q[n_nodes, nt, 4 wxyz]) local TRS in glTF axes; missing channels = rest."""
        times = np.asarray(times, float)
        ch = self.channels(name)
        T = np.tile(np.stack(self.rest_t)[:, None, :], (1, len(times), 1))
        Q = np.tile(np.stack(self.rest_q)[:, None, :], (1, len(times), 1))
        for (n, path), (t, v) in ch.items():
            if path == "scale":
                continue
            tt = np.clip(times, t[0], t[-1])
            if len(t) == 1:
                val = np.tile(v[0], (len(tt), 1))
                if path == "rotation":
                    val = val[:, [3, 0, 1, 2]]
            else:
                k = np.clip(np.searchsorted(t, tt, side="right") - 1, 0, len(t) - 2)
                f = ((tt - t[k]) / np.maximum(t[k + 1] - t[k], 1e-12))[:, None]
                if path == "translation":
                    val = v[k] * (1 - f) + v[k + 1] * f
                else:
                    vq = qnorm(v[:, [3, 0, 1, 2]])
                    val = slerp(vq[k], vq[k + 1], f)
            if path == "translation":
                T[n] = val
            else:
                Q[n] = val
        return T, Q

    def world(self, T, Q):
        """glTF-axes local -> Blender-axes armature-space world: (R[n_nodes, nt, 3,3], P[n_nodes, nt, 3])."""
        N, nt = Q.shape[:2]
        R = np.zeros((N, nt, 3, 3))
        P = np.zeros((N, nt, 3))
        for i in self.order:
            Rl = q2m(Q[i])
            p = self.parent.get(i)
            if p is None:
                R[i] = Rl
                P[i] = T[i]
            else:
                R[i] = np.einsum("tij,tjk->tik", R[p], Rl)
                P[i] = P[p] + np.einsum("tij,tj->ti", R[p], T[i])
        Rb = np.einsum("ij,ntjk,kl->ntil", B, R, B.T)
        Pb = P @ B.T
        return Rb, Pb

    def idx(self, name):
        return self.names.index(name)

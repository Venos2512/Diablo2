"""Print animation names / durations / channel counts / skin joints of a GLB (python -I, stdlib + numpy)."""
import json
import struct
import sys

import numpy as np

d = open(sys.argv[1], "rb").read()
n = struct.unpack("<I", d[12:16])[0]
j = json.loads(d[20:20 + n])
o = 20 + n
bl = struct.unpack("<I", d[o:o + 4])[0]
b = d[o + 8:o + 8 + bl]


def acc(i):
    a = j["accessors"][i]
    v = j["bufferViews"][a["bufferView"]]
    return np.frombuffer(b, dtype="f4", count=a["count"], offset=v.get("byteOffset", 0) + a.get("byteOffset", 0))


print("nodes", len(j["nodes"]), "skins", len(j.get("skins", [])), "joints", [len(s["joints"]) for s in j.get("skins", [])], "meshes", len(j["meshes"]),
      "images", len(j.get("images", [])), "extensionsUsed", j.get("extensionsUsed"))
for a in j.get("animations", []):
    ts = [acc(s["input"]) for s in a["samplers"]]
    t0, t1 = min(t[0] for t in ts), max(t[-1] for t in ts)
    print(f'{a["name"]!r}: channels {len(a["channels"])} t0 {t0:.4f} t1 {t1:.4f} dur {t1 - t0:.4f}s samples {max(len(t) for t in ts)}')

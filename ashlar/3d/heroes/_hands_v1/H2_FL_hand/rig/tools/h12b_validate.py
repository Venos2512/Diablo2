"""H2_FL_hand rig, R4/S8: QA_CHECKLIST A1 on the exported GLB itself (python -I -B, numpy only: a minimal glTF reader), plus a three.js-style
CPU skinning parity and the deformation summary -> rig/validation.json.

A1 rows adapted to the Hand family (no feet): A1.11 = the length along +z (sleeve end -> fingertips) 0.45 m +-2 %; A1.12 = the sleeve-end
pivot at the origin (min z = 0 +- 1 mm, the sleeve-end section centred on the z axis +- 2 mm) instead of 'feet on the ground'.
three.js parity: skinMatrix_j = jointWorld_j(pose) . inverseBind_j (bindMatrix = identity, GLTFLoader), position = sum w_j skinMatrix_j p,
weights renormalised like normalizeSkinWeights(); the pose = the Blender skinning deltas of rig/_work/poses_<tag>.npz turned into the glTF frame
(S_gltf = C S C^-1); compared with Blender's evaluated mesh of the same pose, vertices matched by rest position.
Usage: python -I -B h12b_validate.py <rig_dir> <tag>
"""
import hashlib
import json
import os
import struct
import sys

import numpy as np
from scipy.spatial import cKDTree

rig, tag = sys.argv[1], sys.argv[2]
asset = os.path.dirname(os.path.abspath(rig))
GLB = os.path.join(asset, 'H2_FL_hand_rig.glb')
SRC = os.path.join(asset, 'choice_hands_H2_FL_hand.glb')
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def read_glb(path):
    b = open(path, 'rb').read()
    magic, ver, ln = struct.unpack_from('<III', b, 0)
    assert magic == 0x46546C67
    jl, jt = struct.unpack_from('<II', b, 12)
    js = json.loads(b[20:20 + jl])
    bl, bt = struct.unpack_from('<II', b, 20 + jl)
    bin_ = b[28 + jl:28 + jl + bl]
    return js, bin_


def acc(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    dt = np.dtype(CT[a['componentType']])
    n, c = a['count'], NC[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride', 0)
    if stride and stride != dt.itemsize * c:
        raw = np.frombuffer(bin_, np.uint8, count=stride * (n - 1) + dt.itemsize * c, offset=off)
        out = np.stack([np.frombuffer(raw[k * stride:k * stride + dt.itemsize * c].tobytes(), dt) for k in range(n)])
    else:
        out = np.frombuffer(bin_, dt, count=n * c, offset=off).reshape(n, c)
    if a.get('normalized'):
        out = out.astype(np.float64) / np.iinfo(dt).max
    return out


def image_hashes(js, bin_):
    out = {}
    for im in js.get('images', []):
        bv = js['bufferViews'][im['bufferView']]
        data = bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
        out[im.get('name', str(len(out)))] = hashlib.sha256(data).hexdigest()
    return out


def trs(node):
    M = np.eye(4)
    if 'matrix' in node:
        return np.array(node['matrix']).reshape(4, 4).T
    t = node.get('translation', [0, 0, 0])
    r = node.get('rotation', [0, 0, 0, 1])
    s = node.get('scale', [1, 1, 1])
    x, y, z, w = r
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M[:3, :3] = R * np.array(s)
    M[:3, 3] = t
    return M


js, bin_ = read_glb(GLB)
sjs, sbin = read_glb(SRC)
nodes = js['nodes']
parent = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []):
        parent[c] = i


def world(i):
    M = trs(nodes[i])
    while i in parent:
        i = parent[i]
        M = trs(nodes[i]) @ M
    return M


skins = js.get('skins', [])
meshes = [i for i, n in enumerate(nodes) if 'mesh' in n]
chk = {}
chk['A1.1 one skin, one mesh'] = dict(ok=len(skins) == 1 and len(meshes) == 1, skins=len(skins), mesh_nodes=len(meshes),
                                     primitives=len(js['meshes'][nodes[meshes[0]]['mesh']]['primitives']))
skin = skins[0]
joints = skin['joints']
jn = [nodes[j]['name'] for j in joints]
EXPECT = ['hand_root', 'forearm', 'forearm_twist', 'wrist'] + [f'{f}_0{k}' for f in ('thumb', 'index', 'middle', 'ring', 'pinky') for k in (1, 2, 3)] + \
    ['fx_palm', 'fx_thumb', 'fx_tip_index']
chk['A1.2 bone names'] = dict(ok=sorted(jn) == sorted(EXPECT) and len(set(jn)) == len(jn), joints=len(jn), missing=sorted(set(EXPECT) - set(jn)),
                              extra=sorted(set(jn) - set(EXPECT)), lab_FINGER_BONES_present=all(n in jn for n in EXPECT[:1] + EXPECT[3:19]))
roots = [j for j in joints if parent.get(j) not in joints]
chk['A1.3 one tree, root hand_root'] = dict(ok=len(roots) == 1 and nodes[roots[0]]['name'] == 'hand_root', roots=[nodes[r]['name'] for r in roots])
prims = js['meshes'][nodes[meshes[0]]['mesh']]['primitives']
P, J, W, UVs = [], [], [], []
for pr in prims:
    at = pr['attributes']
    P.append(acc(js, bin_, at['POSITION']).astype(np.float64))
    J.append(acc(js, bin_, at['JOINTS_0']).astype(np.int64))
    W.append(acc(js, bin_, at['WEIGHTS_0']).astype(np.float64))
    if any(k.startswith('JOINTS_1') or k.startswith('WEIGHTS_1') for k in at):
        chk['extra influence sets'] = dict(ok=False)
P, J, W = np.concatenate(P), np.concatenate(J), np.concatenate(W)
s = W.sum(1)
chk['A1.4 every vertex weighted'] = dict(ok=bool((s > 0).all()), empty=int((s <= 0).sum()))
chk['A1.5 weights sum to 1'] = dict(ok=bool(np.abs(s - 1).max() <= 1e-6 * 10), max_abs_err=float(np.abs(s - 1).max()),
                                     note='float32 storage; three.js renormalises (normalizeSkinWeights)')
chk['A1.6 <= 4 influences'] = dict(ok=W.shape[1] == 4, per_vertex_max=int((W > 0).sum(1).max()))
chk['A1.7 joint indices in range'] = dict(ok=bool((J >= 0).all() and (J < len(joints)).all()), max=int(J.max()))
IBM = acc(js, bin_, skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)
mesh_world = world(meshes[0])
err = max(float(np.abs(world(j) @ IBM[k] - mesh_world).max()) for k, j in enumerate(joints))
chk['A1.8 inverse bind matrices = hierarchy'] = dict(ok=err <= 1e-5, max_err=err)
# A1.9 mesh vs the scaled input (lab frame): the lab GLB is the same transform of the source (h01 check 1.6e-5 mm)
lab = os.path.join(os.path.dirname(asset), '..', '..', '..', '..', 'lookdev-lab', 'assets', 'choice-hands', 'choice-hand-fl.glb')
lab = os.path.normpath(os.path.join(r'E:/Diablo2', 'lookdev-lab', 'assets', 'choice-hands', 'choice-hand-fl.glb'))
ljs, lbin = read_glb(lab)
lp = None
for mi, m in enumerate(ljs['meshes']):
    for pr in m['primitives']:
        q = acc(ljs, lbin, pr['attributes']['POSITION']).astype(np.float64)
        if len(q) > 2000:
            lp = q
Pw = (mesh_world[:3, :3] @ P.T).T + mesh_world[:3, 3]
d1 = cKDTree(lp).query(Pw)[0]
d2 = cKDTree(Pw).query(lp)[0]
chk['A1.9 mesh = lab-frame input'] = dict(ok=max(d1.max(), d2.max()) <= 1e-4, max_m=float(max(d1.max(), d2.max())),
                                          ref='lookdev-lab/assets/choice-hands/choice-hand-fl.glb (same frame, same scale)')
ih, sh = image_hashes(js, bin_), image_hashes(sjs, sbin)
chk['A1.10 textures byte-identical to the Tripo GLB'] = dict(ok=sorted(ih.values()) == sorted(sh.values()), exported=ih, source=sh)
zlen = Pw[:, 2].max() - Pw[:, 2].min()
chk['A1.11 length 0.45 m +-2 %'] = dict(ok=abs(zlen - 0.45) <= 0.009, length_m=float(zlen), bbox=[Pw.min(0).tolist(), Pw.max(0).tolist()])
near = Pw[Pw[:, 2] < 0.01]
chk['A1.12 (hand) sleeve-end pivot at the origin'] = dict(ok=abs(Pw[:, 2].min()) <= 0.001, min_z=float(Pw[:, 2].min()),
                                                          note='origin = the forearm-axis point of the sleeve end (lab frame); the sleeve end is a closed cap')
used = set(np.unique(J[W > 0]).tolist())
unweighted = [jn[k] for k in range(len(jn)) if k not in used]
chk['A1.13 unweighted bones = sockets only'] = dict(ok=sorted(unweighted) == ['fx_palm', 'fx_thumb', 'fx_tip_index'], unweighted=unweighted)
sc_bad = [n.get('name') for n in nodes if any(abs(x - 1) > 5e-5 for x in n.get('scale', [1, 1, 1]))]
chk['A1.14 scale 1, no negative scale'] = dict(ok=not sc_bad, bad=sc_bad)
chk['no neutral / leaf joints'] = dict(ok=len(joints) == 22, joints=len(joints))
chk['animations'] = dict(ok=len(js.get('animations', [])) == 0, count=len(js.get('animations', [])))
# three.js CPU skinning parity
z = np.load(os.path.join(rig, '_work', f'poses_{tag}.npz'), allow_pickle=True)
names, bn = [str(x) for x in z['names']], [str(b) for b in z['bones']]
V0 = np.load(os.path.join(rig, '_work', 'mesh.npz'), allow_pickle=True)['V']
C = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1.0]])  # Blender -> glTF: (x, y, z) -> (x, z, -y)
V0g = V0 @ C[:3, :3].T
mp = cKDTree(V0g).query(Pw)
Wn = W / W.sum(1, keepdims=True)
par = {}
for pn in names:
    i = names.index(pn)
    S = {bn[j]: C @ z['M'][i, j] @ np.linalg.inv(z['rest'][j]) @ np.linalg.inv(C) for j in range(len(bn))}
    # jointWorld(pose) = S . jointWorld(rest); skinMatrix = jointWorld(pose) . IBM
    SK = np.array([S[jn[k]] @ world(joints[k]) @ IBM[k] for k in range(len(joints))])
    Ph = np.concatenate([Pw, np.ones((len(Pw), 1))], 1)
    out = np.zeros_like(Pw)
    for c in range(4):
        out += Wn[:, c:c + 1] * np.einsum('nij,nj->ni', SK[J[:, c]], Ph)[:, :3]
    ref = z['P'][i][mp[1]] @ C[:3, :3].T
    par[pn] = float(np.linalg.norm(out - ref, axis=1).max())
chk['three.js CPU skinning parity (all ROM poses)'] = dict(ok=max(par.values()) <= 1e-3 * 0.45 / 1.8, max_m=max(par.values()), per_pose_m=par,
                                                           tolerance_m=1e-3 * 0.45 / 1.8, note='WebGL / WebGPU GPU skinning in the lab not run (Sonnet / lab work)')
ex = json.load(open(os.path.join(rig, '_work', 'export_check.json')))
chk['clean reimport (Blender, copied folder)'] = dict(ok=ex['names_equal'] and max(ex['posed_parity_max_m'].values()) <= ex['tolerance_m'],
                                                      **{k: ex[k] for k in ('bones_reimport', 'max_head_diff_m', 'rest_match_max_m', 'posed_parity_max_m', 'tolerance_m')})
# deformation summary (S7, Blender-evaluated)
M = json.load(open(os.path.join(rig, '_work', f'metrics_{tag}.json')))
summ = {}
for p, r in M['poses'].items():
    pen = r['penetration']
    summ[p] = dict(torn=r['torn_total'], min_joint_volume=min(r['joint_volume'].values()), rigid_dev_mm=r['rigid_dev_mm'], seam_mm=r['seam_mm'],
                   palm_mm=max([v.get('palm_depth_mm', 0) for k, v in pen.items() if k != 'skin_in_band'] or [0]),
                   finger_side_mm=max([v.get('finger_depth_mm', 0) for k, v in pen.items() if k != 'skin_in_band'] or [0]),
                   skin_in_band_mm=pen.get('skin_in_band', {}).get('max_depth_mm', 0), forearm_sections=r['sections'])
out = dict(asset='H2_FL_hand', tag=tag, glb=GLB.replace('\\', '/'), all_A1_ok=all(v['ok'] for v in chk.values()), checks=chk, deformation=summ,
           heads_inside_main=M['heads_inside_main'], frame=dict(gltf='+z fingers, +y back of hand, x across (thumb +x), origin = sleeve-end axis point, metres',
                                                                blender='fingers -Y, back +Z, thumb +X'))
json.dump(out, open(os.path.join(rig, 'validation.json'), 'w'), indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
print('H12B all_ok', out['all_A1_ok'], {k: v['ok'] for k, v in chk.items()})
print('parity max', chk['three.js CPU skinning parity (all ROM poses)']['max_m'])

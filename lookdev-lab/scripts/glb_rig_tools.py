"""Small GLB (glTF 2.0 binary) tools for the RIGGED hand of the class-select scene: read / write, accessor access, texture re-encode, the lab-frame check and wrapper, and a SYNTHETIC
rig of the static Flagellant hand (a stand-in for a real Blender rig, to test the lab's finger / wrist drivers, the hand-test mode and the dissolve while the real GLB is made).
Used by scripts/prepare-choice-hands.py. No third-party glTF library: the container is JSON + BIN, and a skin is just nodes + accessors, so this is a few hundred lines.
Never edits a source file.
"""
import io
import json
import struct

import numpy as np
from PIL import Image

COMPONENT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
LENGTH = 0.45


def read_glb(path):
    with open(path, 'rb') as f:
        b = f.read()
    assert b[:4] == b'glTF', f'{path}: not a GLB'
    off = 12
    j = binb = None
    while off < len(b):
        n, t = struct.unpack('<II', b[off:off + 8])
        chunk = b[off + 8:off + 8 + n]
        if t == 0x4E4F534A:
            j = json.loads(chunk.decode('utf-8'))
        elif t == 0x004E4942:
            binb = chunk
        off += 8 + n
    return j, binb or b''


def write_glb(path, j, binb):
    js = json.dumps(j, separators=(',', ':')).encode('utf-8')
    js += b' ' * (-len(js) % 4)
    binb = binb + b'\0' * (-len(binb) % 4)
    total = 12 + 8 + len(js) + 8 + len(binb)
    out = b'glTF' + struct.pack('<II', 2, total) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binb), 0x004E4942) + binb
    with open(path, 'wb') as f:
        f.write(out)
    return len(out)


def accessor(j, binb, idx):
    """The accessor as a numpy array (count, ncomp) (de-interleaved, not normalised)."""
    a = j['accessors'][idx]
    bv = j['bufferViews'][a['bufferView']]
    dt = np.dtype(COMPONENT[a['componentType']])
    n = NCOMP[a['type']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or dt.itemsize * n
    raw = np.frombuffer(binb, dtype=np.uint8, count=a['count'] * stride, offset=off).reshape(a['count'], stride)
    return np.frombuffer(raw[:, :dt.itemsize * n].tobytes(), dtype=dt).reshape(a['count'], n).copy()


def node_matrix(n):
    if 'matrix' in n:
        return np.array(n['matrix'], dtype=float).reshape(4, 4).T
    t = np.array(n.get('translation', [0, 0, 0]), dtype=float)
    q = np.array(n.get('rotation', [0, 0, 0, 1]), dtype=float)
    s = np.array(n.get('scale', [1, 1, 1]), dtype=float)
    x, y, z, w = q
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * s
    M[:3, 3] = t
    return M


def world_matrices(j):
    nodes = j['nodes']
    parent = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []):
            parent[c] = i
    cache = {}

    def w(i):
        if i not in cache:
            m = node_matrix(nodes[i])
            cache[i] = w(parent[i]) @ m if i in parent else m
        return cache[i]

    return [w(i) for i in range(len(nodes))]


def norm_name(n):
    return ''.join(ch for ch in (n or '').lower() if ch.isalnum())


def inspect_rig(j, binb):
    """What the rig GLB is: skins, joints, the rest-pose box of its skinned meshes, the wrist joint, the influences per vertex."""
    info = {'skins': len(j.get('skins', [])), 'joints': [], 'bbox': None, 'wrist': None, 'root': None, 'max_influences': 0, 'skinned_meshes': []}
    if not info['skins']:
        return info
    W = world_matrices(j)
    names = [j['nodes'][k].get('name', f'node{k}') for k in j['skins'][0]['joints']]
    info['joints'] = names
    for k in j['skins'][0]['joints']:
        if norm_name(j['nodes'][k].get('name')) == 'wrist':
            info['wrist'] = [float(x) for x in W[k][:3, 3]]
        if norm_name(j['nodes'][k].get('name')) == 'handroot':
            info['root'] = [float(x) for x in W[k][:3, 3]]
    lo, hi = np.full(3, 1e9), np.full(3, -1e9)
    for i, n in enumerate(j['nodes']):
        if 'mesh' in n and 'skin' in n:
            info['skinned_meshes'].append(n.get('name', f'node{i}'))
            for p in j['meshes'][n['mesh']]['primitives']:
                pos = accessor(j, binb, p['attributes']['POSITION'])
                M = W[i]  # the mesh node's own transform is ignored by a skin; positions are in the joints' space
                lo = np.minimum(lo, pos.min(0))
                hi = np.maximum(hi, pos.max(0))
                if 'WEIGHTS_0' in p['attributes']:
                    wts = accessor(j, binb, p['attributes']['WEIGHTS_0'])
                    info['max_influences'] = max(info['max_influences'], int((wts > 1e-4).sum(1).max()))
    info['bbox'] = [lo.tolist(), hi.tolist()]
    return info


def frame_transform(info):
    """None when the rig is already in the lab frame (sleeve end at z = 0, fingertips at z = 0.45, wrist near z = 0.27, centred on x, y); otherwise (scale, turn_y_180, translation)
    of the wrapper that brings it there (only a uniform scale, a half turn about y and a shift: levelling and rolling the forearm is the rigger's job, reported as a warning)."""
    lo, hi = np.array(info['bbox'][0]), np.array(info['bbox'][1])
    length = hi[2] - lo[2]
    wrist = info['wrist']
    root = info.get('root')
    ok = abs(lo[2]) < 0.02 and abs(hi[2] - LENGTH) < 0.02 and (wrist is None or 0.22 < wrist[2] < 0.32) and (root is None or (abs(root[0]) < 0.02 and abs(root[1]) < 0.02))
    if ok:
        return None
    turn = False  # a reversed hand (sleeve at +z) is a rigger's mistake worth a look, not something to hide: reported by the caller, never silently turned
    s = LENGTH / length
    ctr = np.array([root[0], root[1], lo[2]]) if root is not None else np.array([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, lo[2]])
    t = -ctr * s
    return s, turn, t.tolist()


def wrap_frame(j, s, turn, t):
    """A parent node above every scene root: scale, optional half turn about y, shift. Joints, meshes and inverse binds stay untouched (the skin is relative to the joints' world)."""
    wrapper = {'name': 'lab_frame', 'children': list(j['scenes'][j.get('scene', 0)]['nodes']), 'scale': [s, s, s], 'translation': t}
    if turn:
        wrapper['rotation'] = [0, 1, 0, 0]
        wrapper['translation'] = [-t[0], t[1], -t[2]]
    j['nodes'].append(wrapper)
    j['scenes'][j.get('scene', 0)]['nodes'] = [len(j['nodes']) - 1]


def rebuild(j, binb, image_size=2048, quality=88):
    """Re-encode every image to <= image_size px JPEG and repack the BIN in bufferView order (alignment 4). Returns (j, bin)."""
    views = j['bufferViews']
    img_views = {im['bufferView']: k for k, im in enumerate(j.get('images', []))}
    out = bytearray()
    for i, v in enumerate(views):
        data = binb[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
        if i in img_views:
            im = Image.open(io.BytesIO(data))
            has_alpha = im.mode in ('RGBA', 'LA', 'P') and 'A' in im.getbands()
            if max(im.size) > image_size:
                f = image_size / max(im.size)
                im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
            buf = io.BytesIO()
            if has_alpha and im.getchannel('A').getextrema()[0] < 250:
                im.save(buf, 'PNG')
                j['images'][img_views[i]]['mimeType'] = 'image/png'
            else:
                im.convert('RGB').save(buf, 'JPEG', quality=quality)
                j['images'][img_views[i]]['mimeType'] = 'image/jpeg'
            data = buf.getvalue()
        out += b'\0' * (-len(out) % 4)
        v['byteOffset'] = len(out)
        v['byteLength'] = len(data)
        out += data
    j['buffers'] = [{'byteLength': len(out)}]
    return j, bytes(out)


# ---------------------------------------------------------------------------------------------------------------------------------------------------------
# the SYNTHETIC rig of the static Flagellant hand
# ---------------------------------------------------------------------------------------------------------------------------------------------------------
def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def fake_rig(src_path, dst_path, wrist_z=0.27):
    """Skin the static hand mesh of choice-hand-fl.glb to a hand skeleton (hand_root, forearm, wrist, 5 x 3 finger bones + fx sockets) by position: a smooth stand-in for the real rig,
    enough to see the drivers move something that bends, not a quality skin. Writes a GLB whose asset.extras says it is synthetic (the scene's panel shows it)."""
    j, b = read_glb(src_path)
    prim = j['meshes'][0]['primitives'][0]
    pos = accessor(j, b, prim['attributes']['POSITION']).astype(float)
    nor = accessor(j, b, prim['attributes']['NORMAL'])
    uv = accessor(j, b, prim['attributes']['TEXCOORD_0'])
    idx = accessor(j, b, prim['indices'])[:, 0]
    # the hand part: where the 4 fingers and the thumb are
    hand = pos[pos[:, 2] > wrist_z]
    cx = (hand[:, 0].min() + hand[:, 0].max()) / 2
    side = 1.0 if (hand[:, 0].max() - cx) > (cx - hand[:, 0].min()) else -1.0  # the thumb sticks out farther on this side
    tipz = pos[:, 2].max()
    kz = wrist_z + 0.085  # knuckle row
    far = pos[pos[:, 2] > tipz - 0.03]
    xs = np.sort(far[:, 0])
    # four fingers: spread the bases over the width of the far part away from the thumb
    xlo, xhi = (cx - side * 0.0, far[:, 0].max()) if side < 0 else (far[:, 0].min(), cx + 0.0)
    xlo, xhi = far[:, 0].min(), far[:, 0].max()
    span = xhi - xlo
    if side > 0:  # thumb at +x: fingers occupy the -x 80 %
        fx = np.linspace(xlo + 0.1 * span, xlo + 0.78 * span, 4)
    else:
        fx = np.linspace(xhi - 0.78 * span, xhi - 0.1 * span, 4)
    order = ['pinky', 'ring', 'middle', 'index'] if side > 0 else ['index', 'middle', 'ring', 'pinky']  # from -x to +x, the thumb being at the +x (side > 0) end
    flen = {'index': 0.088, 'middle': 0.094, 'ring': 0.088, 'pinky': 0.072}
    joints = []  # (name, parent name, world position)

    def add(name, parent, p):
        joints.append((name, parent, np.array(p, dtype=float)))

    ymid = float(np.median(pos[(pos[:, 2] > kz) & (pos[:, 2] < tipz), 1]))
    add('hand_root', None, [0, 0, 0])
    add('forearm', 'hand_root', [0, 0, 0.04])
    add('wrist', 'forearm', [0, 0, wrist_z])
    chains = {}
    for name, x in zip(order, fx):
        base = np.array([x, ymid, kz])
        L = flen[name]
        seg = [L * 0.42, L * 0.33, L * 0.25]
        z = base[2]
        chain = []
        for s_, sl in enumerate(seg):
            add(f'{name}_0{s_ + 1}', 'wrist' if s_ == 0 else f'{name}_0{s_}', [x, ymid, z])
            chain.append(np.array([x, ymid, z]))
            z += sl
        chains[name] = (chain, np.array([x, ymid, z]))
    tb = np.array([cx + side * 0.04, ymid - 0.005, wrist_z + 0.02])
    td = np.array([side * 0.5, 0.0, 0.85])
    td /= np.linalg.norm(td)
    tl = [0.040, 0.032, 0.026]
    p = tb.copy()
    chain = []
    for s_ in range(3):
        add(f'thumb_0{s_ + 1}', 'wrist' if s_ == 0 else f'thumb_0{s_}', p)
        chain.append(p.copy())
        p = p + td * tl[s_]
    chains['thumb'] = (chain, p)
    # fx sockets (empty nodes): palm centre, thumb tip, index tip
    add('fx_palm', 'wrist', [cx, ymid - 0.02, wrist_z + 0.06])
    add('fx_thumb', 'thumb_03', chains['thumb'][1])
    add('fx_tip_index', 'index_03', chains['index'][1])
    names = [n for n, _, _ in joints]
    ji = {n: i for i, n in enumerate(names)}
    bone_names = [n for n in names if not n.startswith('fx_')]  # skinned joints: the bones; sockets are plain nodes
    skin_index = {n: i for i, n in enumerate(bone_names)}
    # weights per vertex
    nv = len(pos)
    W = np.zeros((nv, len(bone_names)))
    z = pos[:, 2]
    w_root = 1 - smoothstep(0.02, 0.12, z)
    w_fore = smoothstep(0.02, 0.12, z) * (1 - smoothstep(wrist_z - 0.05, wrist_z + 0.02, z))
    w_wrist = smoothstep(wrist_z - 0.05, wrist_z + 0.02, z)
    fingers = {}
    for name, (chain, tip) in chains.items():
        pts = chain + [tip]
        d = np.full(nv, 1e9)
        wseg = np.zeros((nv, 3))
        # distance of every vertex to the finger axis (base -> tip), and its position along it
        a, bpt = pts[0], pts[-1]
        ax = bpt - a
        ln = np.linalg.norm(ax)
        axn = ax / ln
        t = (pos - a) @ axn
        perp = np.linalg.norm((pos - a) - np.outer(t, axn), axis=1)
        sigma = 0.0115 if name != 'thumb' else 0.017
        lateral = 1 - smoothstep(0.85 * sigma, 1.45 * sigma, perp)  # a plateau across the finger (the whole finger bends as one), a short fall-off at its edges
        lateral *= smoothstep(-0.02, 0.012, t)  # not behind the base
        marks = [np.dot(p_ - a, axn) for p_ in pts]  # joint positions along the axis: 0, s1, s2, tip
        # segment s owns [mark_s .. mark_s+1], with smooth overlaps of +-8 mm at the joints
        for s_ in range(3):
            lo_, hi_ = marks[s_], marks[s_ + 1]
            win = smoothstep(lo_ - 0.008, lo_ + 0.008, t) * (1 - smoothstep(hi_ - 0.008, hi_ + 0.008, t)) if s_ < 2 else smoothstep(lo_ - 0.008, lo_ + 0.008, t)
            if s_ == 0:
                win = (1 - smoothstep(hi_ - 0.008, hi_ + 0.008, t))
            wseg[:, s_] = win
        fingers[name] = lateral[:, None] * wseg
    # the finger weights take over from the wrist where they are present; the rest of the palm stays on the wrist
    total_f = sum(f.sum(1) for f in fingers.values())
    keep = np.clip(1 - np.minimum(total_f, 1.0), 0, 1)
    W[:, skin_index['hand_root']] = w_root
    W[:, skin_index['forearm']] = w_fore
    W[:, skin_index['wrist']] = w_wrist * keep
    for name, f in fingers.items():
        for s_ in range(3):
            W[:, skin_index[f'{name}_0{s_ + 1}']] += f[:, s_] * w_wrist.clip(0.3, 1)
    # four strongest influences, normalised
    top = np.argsort(-W, axis=1)[:, :4]
    wt = np.take_along_axis(W, top, axis=1)
    wt = wt / np.maximum(wt.sum(1, keepdims=True), 1e-9)
    # new GLB: the static one without the sleeve extension, plus the skin
    nj = json.loads(json.dumps(j))
    nj['meshes'] = [nj['meshes'][0]]
    nj['meshes'][0]['name'] = 'hand'
    pa = nj['meshes'][0]['primitives'][0]
    extra = bytearray()
    views = nj['bufferViews']

    def add_view(arr):
        data = arr.tobytes()
        extra_off = len(b) + len(extra)
        extra.extend(b'\0' * (-extra_off % 4))
        off = len(b) + len(extra)
        extra.extend(data)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(data)})
        return len(views) - 1

    accs = nj['accessors']
    accs.append({'bufferView': add_view(top.astype(np.uint16)), 'componentType': 5123, 'count': nv, 'type': 'VEC4'})
    pa['attributes']['JOINTS_0'] = len(accs) - 1
    accs.append({'bufferView': add_view(wt.astype(np.float32)), 'componentType': 5126, 'count': nv, 'type': 'VEC4'})
    pa['attributes']['WEIGHTS_0'] = len(accs) - 1
    ibm = np.zeros((len(bone_names), 16), np.float32)
    jw = {n: p_ for n, _, p_ in joints}
    for n in bone_names:
        m = np.eye(4)
        m[:3, 3] = -jw[n]
        ibm[skin_index[n]] = m.T.reshape(16)  # column-major
    accs.append({'bufferView': add_view(ibm), 'componentType': 5126, 'count': len(bone_names), 'type': 'MAT4'})
    ibm_acc = len(accs) - 1
    # nodes: world(armature) -> joints; the mesh node at the scene root
    nodes = []
    for n, par, p_ in joints:
        local = p_ - (jw[par] if par else 0)
        nodes.append({'name': n, 'translation': [float(x) for x in local]})
    for i, (n, par, _) in enumerate(joints):
        if par:
            nodes[ji[par]].setdefault('children', []).append(i)
    mesh_node = len(nodes)
    nodes.append({'name': 'hand', 'mesh': 0, 'skin': 0})
    nodes.append({'name': 'world', 'children': [ji['hand_root'], mesh_node]})
    nj['nodes'] = nodes
    nj['skins'] = [{'name': 'hand_rig', 'joints': [ji[n] for n in bone_names], 'inverseBindMatrices': ibm_acc, 'skeleton': ji['hand_root']}]
    nj['scenes'] = [{'nodes': [len(nodes) - 1]}]
    nj['scene'] = 0
    nj['asset']['extras'] = {'synthetic_rig': True, 'note': 'scripts/glb_rig_tools.py fake_rig: position-weighted skin of the static Flagellant hand; replace with the Blender rig'}
    nj['buffers'] = [{'byteLength': len(b) + len(extra)}]
    return write_glb(dst_path, nj, b + bytes(extra))

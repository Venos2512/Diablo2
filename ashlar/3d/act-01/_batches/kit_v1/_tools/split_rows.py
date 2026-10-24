"""Split the Tripo row models of the Act I kit into one GLB per asset.

Usage:
  python -I split_rows.py --list R01 [R05 ...]   number a row model's objects: printout + rows/<row>/_split/objects.png
  python -I split_rows.py R01 [R05 ...]          write the assets of these rows (no argument: every row with a GLB)

A row image (rows/R##_<slug>/input_spaced.png) holds 2-4 assets in one horizontal row; Tripo builds it as one model,
rows/R##_<slug>/act1_kit_v1_R##_<slug>.glb, which is only read here. rows.json (next to this script) lists each
row's assets left to right with their real size. Adapted from lookdev-lab/scripts/prepare-nature-kits.py. Per row:
  1. Objects: the mesh is voxelised and split where empty space separates it; crumbs of a few faces join the nearest
     object. Objects are numbered left to right along the row (the image's horizontal axis, ROW_AXIS).
  2. Assets: the widest empty gaps along the row separate the assets (else the gaps of the row image, mapped onto the
     model); rows.json `objects` can name an asset's objects by number instead. Inside an asset, objects not joined
     to its largest object by a gap under `attach` (fraction of its size) are strays and are dropped (logged).
     Needles (a few long, near-zero-width triangles Tripo leaves sticking out as thin lines) are dropped too.
  3. Level: the up direction that gives the widest support polygon (convex hull of the points in a thin bottom
     layer), searched over tilts of up to 30 degrees; kept upright unless it widens the support by over 15 %, or always
     (`upright` in rows.json: rockers and other curved bottoms, which the search would roll onto one end).
  4. Optional ground cut (`cut`, `dome` in rows.json): a slab or mud layer under the asset (see cut_patch).
  5. Turned about +y so the FRONT faces +z and the front width runs along x: the footprint's main axes, the front
     being the side nearest the lower left of the image (each asset is drawn turned that way); round footprints face
     the camera, and so do `front: camera` assets. `yaw` (degrees, added after) fixes a wrong guess.
  6. Normalised like a Tripo source GLB: longest side 1, pivot at the bottom centre, +y up. The real size stays in
     rows.json and split.json; game and lab copies are scaled to it by their own scripts.
  7. Texture: the asset's UV islands are cut out of the row atlas (base colour, metallic-roughness, normal) with a
     margin and packed into its own atlas at the same texel density; UVs are moved, never scaled. When the islands
     cover most of the atlas it is kept whole.
Writes, per asset, <kit>/<A##_#_slug>/act1_kit_v1_<slug>.glb, concept.png (its crop of the row image) and
_shots/final_views.png (software render: front, 45, 90, 180 degrees), and rows/<row>/_split/split.json + pieces.png.
"""
import io
import json
import math
import os
import struct
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
from scipy.spatial import ConvexHull

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.dirname(HERE)
ROWS = os.path.join(KIT, 'rows')
ASH3D = os.path.abspath(os.path.join(KIT, '..', '..', '..'))  # KIT = ashlar/3d/act-01/_batches/kit_v1
ENV2D = os.path.abspath(os.path.join(ASH3D, '..', 'art', 'act-01', 'environments'))


def piece_dir(folder):
    """A piece lives with its 2D concept group: ashlar/3d/act-01/environments/<A##_slug>/<A##_#_slug>/ (group = the 2D folder starting with A##_)."""
    groups = [g for g in os.listdir(ENV2D) if g.startswith(folder[:3] + '_')]
    assert len(groups) == 1, f'{folder}: 2D groups {groups}'
    return os.path.join(ASH3D, 'act-01', 'environments', groups[0], folder)
CONFIG = json.load(open(os.path.join(HERE, 'rows.json'), encoding='utf-8'))
CAMERA = np.array([0.0, 0.0, 1.0])  # direction from the model toward the camera of the row image (Tripo GLB frame)
UP = np.array([0.0, 1.0, 0.0])
ROW_AXIS = np.cross(UP, CAMERA)  # the image's horizontal axis, left to right
FRONT_TURN = math.radians(40)  # assets are drawn with their FRONT toward the lower left: about this far from the camera


# ---------------------------------------------------------------- GLB in and out

def read_glb(path):
    """Positions (world space), normals, uv, faces of the single material, the material and its images."""
    b = open(path, 'rb').read()
    jl = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack('<I', b[off:off + 4])[0]
    blob = b[off + 8:off + 8 + bl]

    def accessor(i):
        a = j['accessors'][i]
        bv = j['bufferViews'][a['bufferView']]
        dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a['componentType']]
        n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
        start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = bv.get('byteStride', 0)
        size = np.dtype(dt).itemsize * n
        if stride and stride != size:
            raw = np.frombuffer(blob, np.uint8, count=stride * (a['count'] - 1) + size, offset=start)
            idx = (np.arange(a['count'])[:, None] * stride + np.arange(size)[None, :])
            arr = raw[idx].copy().view(dt).reshape(a['count'], n)
        else:
            arr = np.frombuffer(blob, dt, count=a['count'] * n, offset=start).reshape(a['count'], n).copy()
        return arr

    def node_matrix(node):
        if 'matrix' in node:
            return np.array(node['matrix'], float).reshape(4, 4).T
        m = np.eye(4)
        if 'scale' in node:
            m = np.diag(list(node['scale']) + [1.0]) @ m
        if 'rotation' in node:
            x, y, z, w = node['rotation']
            r = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                          [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                          [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
            rm = np.eye(4); rm[:3, :3] = r
            m = rm @ m
        if 'translation' in node:
            t = np.eye(4); t[:3, 3] = node['translation']
            m = t @ m
        return m

    world = {}

    def walk(n, parent):
        m = parent @ node_matrix(j['nodes'][n])
        world[n] = m
        for c in j['nodes'][n].get('children', []):
            walk(c, m)

    for n in j['scenes'][j.get('scene', 0)]['nodes']:
        walk(n, np.eye(4))
    P, N, UV, F, mats = [], [], [], [], set()
    base = 0
    for n, m in world.items():
        if 'mesh' not in j['nodes'][n]:
            continue
        for pr in j['meshes'][j['nodes'][n]['mesh']]['primitives']:
            at = pr['attributes']
            p = accessor(at['POSITION']).astype(float)
            p = p @ m[:3, :3].T + m[:3, 3]
            nm = accessor(at['NORMAL']).astype(float) @ np.linalg.inv(m[:3, :3]) if 'NORMAL' in at else np.zeros_like(p)
            nm /= np.linalg.norm(nm, axis=1, keepdims=True) + 1e-12
            uv = accessor(at['TEXCOORD_0']).astype(float)
            f = accessor(pr['indices']).reshape(-1, 3).astype(np.int64) if 'indices' in pr else np.arange(len(p)).reshape(-1, 3)
            P.append(p); N.append(nm); UV.append(uv); F.append(f + base); base += len(p)
            mats.add(pr.get('material', 0))
    if len(mats) != 1:
        raise SystemExit(f'{path}: {len(mats)} materials, expected one')
    mat = j['materials'][mats.pop()]

    def image(tex_ref):
        if not tex_ref:
            return None
        src = j['textures'][tex_ref['index']]['source']
        im = j['images'][src]
        bv = j['bufferViews'][im['bufferView']]
        data = blob[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
        return {'bytes': data, 'mime': im.get('mimeType', 'image/png')}

    pbr = mat.get('pbrMetallicRoughness', {})
    maps = {'base': image(pbr.get('baseColorTexture')), 'mr': image(pbr.get('metallicRoughnessTexture')),
            'normal': image(mat.get('normalTexture'))}
    return {'pos': np.concatenate(P), 'nor': np.concatenate(N), 'uv': np.concatenate(UV), 'faces': np.concatenate(F),
            'material': mat, 'maps': maps, 'sampler': (j.get('samplers') or [{}])[0]}


def write_glb(path, name, pos, nor, uv, faces, material, images, sampler, extras):
    """One node, one mesh, one material; images: {'base'|'mr'|'normal': (bytes, mime)}."""
    blobs, views, accessors = [], [], []
    offset = 0

    def add(raw, target=None):
        nonlocal offset
        pad = (-len(raw)) % 4
        blobs.append(raw + b'\0' * pad)
        v = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw)}
        if target:
            v['target'] = target
        views.append(v)
        offset += len(raw) + pad
        return len(views) - 1

    pos32, nor32, uv32 = pos.astype(np.float32), nor.astype(np.float32), uv.astype(np.float32)
    accessors.append({'bufferView': add(pos32.tobytes(), 34962), 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
                      'min': pos32.min(0).tolist(), 'max': pos32.max(0).tolist()})
    accessors.append({'bufferView': add(nor32.tobytes(), 34962), 'componentType': 5126, 'count': len(nor), 'type': 'VEC3'})
    accessors.append({'bufferView': add(uv32.tobytes(), 34962), 'componentType': 5126, 'count': len(uv), 'type': 'VEC2'})
    it = np.uint16 if len(pos) < 65536 else np.uint32
    accessors.append({'bufferView': add(faces.astype(it).ravel().tobytes(), 34963), 'componentType': 5123 if it is np.uint16 else 5125,
                      'count': int(faces.size), 'type': 'SCALAR'})
    img_list, tex = [], {}
    for key in ('base', 'mr', 'normal'):
        if images.get(key):
            data, mime = images[key]
            img_list.append({'bufferView': add(data), 'mimeType': mime})
            tex[key] = len(img_list) - 1
    src_pbr = material.get('pbrMetallicRoughness', {})
    pbr = {k: v for k, v in src_pbr.items() if k in ('baseColorFactor', 'metallicFactor', 'roughnessFactor')}
    if 'base' in tex:
        pbr['baseColorTexture'] = {'index': tex['base']}
    if 'mr' in tex:
        pbr['metallicRoughnessTexture'] = {'index': tex['mr']}
    mat = {'name': name, 'pbrMetallicRoughness': pbr}
    for k in ('doubleSided', 'alphaMode', 'alphaCutoff', 'emissiveFactor'):
        if k in material:
            mat[k] = material[k]
    if 'normal' in tex:
        mat['normalTexture'] = {'index': tex['normal']}
        if 'scale' in material.get('normalTexture', {}):
            mat['normalTexture']['scale'] = material['normalTexture']['scale']
    smp = {k: v for k, v in sampler.items() if k in ('magFilter', 'minFilter', 'wrapS', 'wrapT')} or {'magFilter': 9729, 'minFilter': 9987}
    gltf = {
        'asset': {'version': '2.0', 'generator': 'ashlar/3d/act-01/_batches/kit_v1/_tools/split_rows.py'},
        'scene': 0, 'scenes': [{'nodes': [0]}],
        'nodes': [{'name': name, 'mesh': 0}],
        'meshes': [{'name': name, 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1, 'TEXCOORD_0': 2}, 'indices': 3, 'material': 0}]}],
        'materials': [mat],
        'textures': [{'source': i, 'sampler': 0} for i in range(len(img_list))],
        'samplers': [smp], 'images': img_list,
        'accessors': accessors, 'bufferViews': views, 'buffers': [{'byteLength': offset}],
        'extras': extras,
    }
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    binary = b''.join(blobs)
    write_bytes(path, struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary))
                + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binary), 0x004E4942) + binary)


# ---------------------------------------------------------------- objects and assets

def write_bytes(path, data, tries=6):
    """Write a file, retried: a viewer, indexer or scanner briefly locks a file it watches (Errno 22 on Windows)."""
    for k in range(tries):
        try:
            with open(path, 'wb') as f:
                f.write(data)
            return
        except OSError:
            if k == tries - 1:
                raise
            time.sleep(3)


def save_image(im, path, tries=6):
    """im.save, retried: a viewer or indexer briefly locks a file it watches (Errno 22 on Windows)."""
    for k in range(tries):
        try:
            return im.save(path)
        except OSError:
            if k == tries - 1:
                raise
            time.sleep(2)


def face_areas(V, F):
    t = V[F]
    return np.linalg.norm(np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0]), axis=1) / 2


def needles(pos, faces, max_faces=24, long_frac=0.08, thin_frac=0.004):
    """Faces of the needles Tripo leaves: loose pieces (vertices welded across UV seams) of at most max_faces faces,
    longer than long_frac of the asset size and under thin_frac of it across (second principal extent). They show as
    thin lines sticking out of the asset. Real thin details measured on the kit stay: cords and ropes are >= 0.009
    across, and planks, poles and flat panels are wider."""
    size = np.ptp(pos, 0).max()
    _, wid = np.unique(np.round(pos / (size * 1e-5)).astype(np.int64), axis=0, return_inverse=True)
    piece = face_components(wid.reshape(-1)[faces])
    ids, count = np.unique(piece, return_counts=True)
    drop = np.zeros(len(faces), bool)
    for c in ids[count <= max_faces]:
        sel = piece == c
        p = pos[faces[sel]].reshape(-1, 3)
        p = p - p.mean(0)
        ext = np.ptp(p @ np.linalg.eigh(p.T @ p)[1], 0)  # extents along the principal axes, ascending
        if ext[2] > long_frac * size and ext[1] < thin_frac * size:
            drop |= sel
    return drop


def objects(V, F, cells=260, min_faces=30):
    """Object number of every face (1.. left to right along the row) and each object's box (min, max)."""
    lo, hi = V.min(0), V.max(0)
    vox = (hi - lo).max() / cells
    tri = V[F]
    pts = np.concatenate([V, tri.mean(1), (tri[:, 0] + tri[:, 1]) / 2, (tri[:, 1] + tri[:, 2]) / 2, (tri[:, 2] + tri[:, 0]) / 2])
    dims = np.ceil((hi - lo) / vox).astype(int) + 1
    index = lambda p: np.minimum(((p - lo) / vox).astype(int), dims - 1)
    grid = np.zeros(dims, bool)
    i = index(pts)
    grid[i[:, 0], i[:, 1], i[:, 2]] = True
    lab, _ = ndimage.label(ndimage.binary_dilation(grid, iterations=1), structure=np.ones((3, 3, 3)))
    c = index(tri.mean(1))
    face = lab[c[:, 0], c[:, 1], c[:, 2]]
    ids, count = np.unique(face, return_counts=True)
    big = ids[count >= min_faces]
    centre = {k: tri[face == k].reshape(-1, 3).mean(0) for k in ids}
    for k in ids[count < min_faces]:  # crumbs join the nearest object
        face[face == k] = min(big, key=lambda b: np.linalg.norm(centre[b] - centre[k]))
    box = {k: (tri[face == k].reshape(-1, 3).min(0), tri[face == k].reshape(-1, 3).max(0)) for k in big}
    s = lambda k: (tri[face == k].reshape(-1, 3) @ ROW_AXIS).mean()
    order = sorted(big, key=s)
    number = {k: n for n, k in enumerate(order, start=1)}
    return np.array([number[k] for k in face]), [box[k] for k in order]


def box_gap(a, b):
    """Distance between two boxes (0 when they touch or overlap)."""
    d = np.maximum(0, np.maximum(a[0] - b[1], b[0] - a[1]))
    return float(np.linalg.norm(d))


def assign(row, V, F, obj, boxes, area):
    """Asset index of every object number: by the widest gaps along the row, else the row image's gaps."""
    assets = CONFIG[row]
    n = len(assets)
    fixed = {}
    for a, cfg in enumerate(assets):
        for o in cfg.get('objects', []):
            fixed[o] = a
    total = area.sum()
    s_face = V[F].mean(1) @ ROW_AXIS
    nobj = len(boxes)
    s_lo = np.array([np.min(V[F[obj == k]].reshape(-1, 3) @ ROW_AXIS) for k in range(1, nobj + 1)])
    s_hi = np.array([np.max(V[F[obj == k]].reshape(-1, 3) @ ROW_AXIS) for k in range(1, nobj + 1)])
    s_mid = np.array([np.average(s_face[obj == k], weights=area[obj == k] + 1e-12) for k in range(1, nobj + 1)])
    a_obj = np.array([area[obj == k].sum() for k in range(1, nobj + 1)])
    sig = a_obj >= 0.003 * total
    iv = sorted(zip(s_lo[sig], s_hi[sig]))
    merged = []
    for lo, hi in iv:
        if merged and lo <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], hi)
        else:
            merged.append([lo, hi])
    how = 'model gaps'
    if len(merged) >= n:
        gaps = sorted(((merged[k + 1][0] - merged[k][1], (merged[k][1] + merged[k + 1][0]) / 2) for k in range(len(merged) - 1)), reverse=True)[:n - 1]
        cuts = sorted(g[1] for g in gaps)
    else:  # assets overlap along the row: the row image's gaps, mapped onto the model's extent
        how = 'image gaps'
        lay = spaced_layout(row_dir(row))['objects']
        x0, x1 = lay[0]['x'], lay[-1]['x'] + lay[-1]['w']
        m0, m1 = s_lo[sig].min(), s_hi[sig].max()
        cuts = [m0 + ((lay[k]['x'] + lay[k]['w'] + lay[k + 1]['x']) / 2 - x0) / (x1 - x0) * (m1 - m0) for k in range(n - 1)]
    which = {}
    for k in range(1, nobj + 1):
        which[k] = fixed.get(k, int(np.searchsorted(cuts, s_mid[k - 1])))
    return which, how


def row_dir(row):
    return next(os.path.join(ROWS, d) for d in sorted(os.listdir(ROWS)) if d.startswith(row + '_'))


def row_glb(row):
    d = row_dir(row)
    return os.path.join(d, f'act1_kit_v1_{os.path.basename(d)}.glb')


def keep_joined(nums, boxes, a_obj, attach_len, keep_all):
    """Objects joined to the largest one through gaps under attach_len (single linkage); the rest are strays."""
    if keep_all or len(nums) == 1:
        return list(nums), []
    start = max(nums, key=lambda k: a_obj[k])
    keep, todo = {start}, [start]
    while todo:
        k = todo.pop()
        for o in nums:
            if o not in keep and box_gap(boxes[k - 1], boxes[o - 1]) <= attach_len:
                keep.add(o)
                todo.append(o)
    return sorted(keep), sorted(set(nums) - keep)


# ---------------------------------------------------------------- level, cut, turn

def rotation_to_y(n):
    y = UP
    axis = np.cross(n, y)
    s, c = np.linalg.norm(axis), float(np.dot(n, y))
    if s < 1e-9:
        return np.eye(3) if c > 0 else np.diag([1.0, -1.0, -1.0])
    k = axis / s
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + s * K + (1 - c) * K @ K


def support_area(pos, n, layer):
    """Area of the support polygon: the convex hull of the points within `layer` of the bottom along n."""
    h = pos @ n
    pts = pos[h < h.min() + layer]
    if len(pts) < 3:
        return 0.0
    e1 = np.cross(n, [1.0, 0, 0] if abs(n[0]) < 0.9 else [0, 0, 1.0])
    e1 /= np.linalg.norm(e1)
    e2 = np.cross(n, e1)
    q = np.stack([pts @ e1, pts @ e2], 1)
    try:
        return float(ConvexHull(q).volume)
    except Exception:
        return 0.0


def level(pos):
    """Up direction: the tilt (about x, then z) whose support polygon is widest; upright unless it gains over 15 %."""
    span = np.ptp(pos, 0).max()
    layer = 0.012 * span
    up = lambda tx, tz: np.array([math.sin(tz) * math.cos(tx), math.cos(tz) * math.cos(tx), math.sin(tx)])
    a0 = support_area(pos, UP, layer)
    best = (a0, 0.0, 0.0)
    for tx in np.radians(np.arange(-30, 31, 2.0)):
        for tz in np.radians(np.arange(-20, 21, 2.0)):
            a = support_area(pos, up(tx, tz), layer)
            if a > best[0]:
                best = (a, tx, tz)
    for tx in best[1] + np.radians(np.arange(-2, 2.01, 0.5)):
        for tz in best[2] + np.radians(np.arange(-2, 2.01, 0.5)):
            a = support_area(pos, up(tx, tz), layer)
            if a > best[0]:
                best = (a, tx, tz)
    if best[0] <= 1.15 * a0:
        return UP.copy(), 0.0, a0, best[0]
    n = up(best[1], best[2])
    return n / np.linalg.norm(n), math.degrees(math.acos(np.clip(n[1], -1, 1))), a0, best[0]


def weld_components(faces, verts):
    key = np.round(verts / 1e-6).astype(np.int64)
    _, weld = np.unique(key, axis=0, return_inverse=True)
    weld = weld.ravel()
    fw = weld[faces]
    parent = np.arange(weld.max() + 1)

    def find(a):
        root = a
        while parent[root] != root:
            root = parent[root]
        while parent[a] != root:
            parent[a], a = root, parent[a]
        return root

    for a, b, c in fw:
        ra = find(a)
        parent[find(b)] = ra
        parent[find(c)] = ra
    return np.array([find(a) for a in fw[:, 0]])


def cut_patch(pos, faces, area, layer, dome=False):
    """Faces kept once a ground slab is cut away (from prepare-nature-kits.py): faces lying on the bottom layer (or on
    a dome fitted to the slab's outer low points), then crumbs left unattached."""
    tri = pos[faces]
    fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-12
    span = np.ptp(pos, 0).max()
    x, y, z = pos[:, 0], pos[:, 1], pos[:, 2]
    if dome:
        cx, cz = (x.min() + x.max()) / 2, (z.min() + z.max()) / 2
        radial = np.hypot(x - cx, z - cz)
        basis = lambda x, z: np.stack([np.ones_like(x), x - cx, z - cz, (x - cx) ** 2, (z - cz) ** 2, (x - cx) * (z - cz)], 1)
        low = np.zeros(len(pos), bool)
        low[np.unique(faces[fn[:, 1] > 0.6])] = True
        low &= (radial > 0.55 * radial.max()) & (y < y.min() + 0.33 * np.ptp(y))
        fit = low
        for _ in range(5):
            coef, *_ = np.linalg.lstsq(basis(x[fit], z[fit]), y[fit], rcond=None)
            resid = y - basis(x, z) @ coef
            fit = low & (np.abs(resid) < 2.5 * max(np.std(resid[fit]), 1e-4))
        resid = y - basis(x, z) @ coef
        tol = layer * span
        big = area > 8 * np.median(area)
        keep = ~((resid[faces] < tol).all(1) | (big & (resid[faces] < 4 * tol).all(1)))
    else:
        keep = ~((y[faces].max(1) < y.min() + layer * span) & (fn[:, 1] > 0.6))
    comp = weld_components(faces[keep], pos)
    _, inv = np.unique(comp, return_inverse=True)
    sizes = np.bincount(inv, weights=area[keep])
    count = np.bincount(inv)
    out = np.zeros(len(faces), bool)
    out[np.flatnonzero(keep)[(sizes[inv] >= 0.04 * sizes.max()) & (count[inv] >= 8)]] = True
    return out


def yaw_front(pos, area_v, size, mode=None):
    """Angle about +y that turns the asset's FRONT to +z (footprint axes; the side nearest the lower left of the image).
    mode 'camera': the side seen in the row image is the front (organic or round assets, whose axes mean nothing)."""
    if mode == 'camera':
        return math.atan2(CAMERA[0], CAMERA[2]), 'camera'

    xz = pos[:, [0, 2]]
    c = np.average(xz, 0, weights=area_v + 1e-12)
    d = xz - c
    cov = (d * (area_v + 1e-12)[:, None]).T @ d
    evals, evecs = np.linalg.eigh(cov)
    ratio = math.sqrt(evals[1] / max(evals[0], 1e-12))
    cam = np.array([CAMERA[0], CAMERA[2]])
    left = -np.array([ROW_AXIS[0], ROW_AXIS[2]])
    f0 = cam * math.cos(FRONT_TURN) + left * math.sin(FRONT_TURN)
    w, _, dpt = size
    if ratio < 1.12:  # round footprint: face the camera of the image
        front = cam
        kind = 'round'
    else:
        long_ax, short_ax = evecs[:, 1], evecs[:, 0]
        if w >= 1.15 * dpt:
            cands = [short_ax, -short_ax]
        elif dpt >= 1.15 * w:
            cands = [long_ax, -long_ax]
        else:
            cands = [short_ax, -short_ax, long_ax, -long_ax]
        front = max(cands, key=lambda v: float(v @ f0))
        kind = f'axes {ratio:.2f}'
    # rotation about +y taking the 2D direction `front` (x, z) onto +z
    return math.atan2(front[0], front[1]), kind


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]])  # turns (sin a, 0, cos a) onto +z


# ---------------------------------------------------------------- texture islands

def face_components(faces):
    """Island number of every face: faces sharing a vertex (glTF splits vertices at UV seams)."""
    parent = np.arange(faces.max() + 1)

    def find(a):
        root = a
        while parent[root] != root:
            root = parent[root]
        while parent[a] != root:
            parent[a], a = root, parent[a]
        return root

    for a, b, c in faces:
        ra = find(a)
        rb, rc = find(b), find(c)
        parent[rb] = ra
        parent[rc] = ra
    return np.array([find(a) for a in faces[:, 0]])


def repack(uv, faces, maps, margin=8):
    """New UVs and images: every UV island (its texels, dilated by `margin`) copied from the row atlas into its own
    box of a new atlas, boxes shelf-packed at the same texel density. None keeps the row atlas (no real saving)."""
    base = maps['base']
    Wb, Hb = base.size
    comp = face_components(faces)
    labels, finv = np.unique(comp, return_inverse=True)
    isl = []
    for k in range(len(labels)):
        fk = faces[finv == k]
        px = uv[fk] * [Wb, Hb]
        x0 = max(0, int(math.floor(px[:, :, 0].min())) - margin)
        y0 = max(0, int(math.floor(px[:, :, 1].min())) - margin)
        x1 = min(Wb, int(math.ceil(px[:, :, 0].max())) + margin)
        y1 = min(Hb, int(math.ceil(px[:, :, 1].max())) + margin)
        mask = Image.new('L', (max(x1 - x0, 1), max(y1 - y0, 1)), 0)
        dr = ImageDraw.Draw(mask)
        for t in px:
            dr.polygon([(q[0] - x0, q[1] - y0) for q in t], fill=255)
        mask = Image.fromarray(ndimage.binary_dilation(np.asarray(mask) > 0, iterations=margin).astype(np.uint8) * 255)
        isl.append({'box': (x0, y0, x1, y1), 'mask': mask, 'verts': np.unique(fk)})
    area = sum((i['box'][2] - i['box'][0]) * (i['box'][3] - i['box'][1]) for i in isl)
    order = sorted(isl, key=lambda i: (-(i['box'][3] - i['box'][1]), -(i['box'][2] - i['box'][0])))

    def pack(S):
        """Skyline bottom-left packing (tallest boxes first): positions and the height used at width S."""
        sky = [[0, 0, S]]  # segments [x, y, width] covering 0..S
        at = []
        for i in order:
            w, h = i['box'][2] - i['box'][0], i['box'][3] - i['box'][1]
            best_xy = None
            for k in range(len(sky)):
                x = sky[k][0]
                if x + w > S:
                    break
                y, j, covered = 0, k, 0
                while covered < w:
                    y = max(y, sky[j][1]); covered = sky[j][0] + sky[j][2] - x; j += 1
                if best_xy is None or (y + h, x) < (best_xy[1] + h, best_xy[0]):
                    best_xy = (x, y)
            x, y = best_xy
            at.append((x, y))
            new = []
            for seg in sky:  # cut the box's span out of the skyline and insert its top
                s0, s1 = seg[0], seg[0] + seg[2]
                if s1 <= x or s0 >= x + w:
                    new.append(seg)
                    continue
                if s0 < x:
                    new.append([s0, seg[1], x - s0])
                if s1 > x + w:
                    new.append([x + w, seg[1], s1 - x - w])
            new.append([x, y + h, w])
            new.sort()
            merged = [new[0]]
            for seg in new[1:]:
                if seg[1] == merged[-1][1] and merged[-1][0] + merged[-1][2] == seg[0]:
                    merged[-1][2] += seg[2]
                else:
                    merged.append(seg)
            sky = merged
        return at, max(seg[1] for seg in sky)

    wmin = max(max(i['box'][2] - i['box'][0] for i in isl), int(math.sqrt(area)) // 128 * 128)
    best = None
    for S in range(max(wmin, 256), Wb + 1, 128):
        at, H = pack(S)
        if H > Hb or H > 1.25 * S:
            continue
        if best is None or S * H < best[0] * best[1]:
            best = (S, H, at)
    if best is None:
        return None
    S, H, at = best
    for i, xy in zip(order, at):
        i['at'] = xy
    H = int(math.ceil(H / 16.0)) * 16
    if S * H > 0.9 * Wb * Hb:
        return None
    new_maps = {}
    for key, im in maps.items():
        if im is None:
            continue
        sx, sy = im.size[0] / Wb, im.size[1] / Hb
        mode = 'RGBA' if im.mode in ('RGBA', 'LA') else 'RGB'
        src = im.convert(mode)
        fill = (128, 128, 255) if key == 'normal' else tuple(int(v) for v in np.asarray(src.resize((64, 64))).reshape(-1, len(mode)).mean(0))
        out = Image.new(mode, (int(round(S * sx)), int(round(H * sy))), fill[:3] if mode == 'RGB' else fill[:3] + (255,))
        for i in isl:
            b = i['box']
            sb = (int(round(b[0] * sx)), int(round(b[1] * sy)), int(round(b[2] * sx)), int(round(b[3] * sy)))
            crop = src.crop(sb)
            mk = i['mask'] if (sx, sy) == (1, 1) else i['mask'].resize(crop.size, Image.NEAREST)
            out.paste(crop, (int(round(i['at'][0] * sx)), int(round(i['at'][1] * sy))), mk)
        new_maps[key] = out
    new_uv = uv.copy()
    for i in isl:
        v, b, (X, Y) = i['verts'], i['box'], i['at']
        new_uv[v, 0] = (uv[v, 0] * Wb - b[0] + X) / S
        new_uv[v, 1] = (uv[v, 1] * Hb - b[1] + Y) / H
    return new_uv, new_maps, (S, H)


def encode(im, mime, key):
    buf = io.BytesIO()
    if mime == 'image/jpeg':
        im.convert('RGB').save(buf, 'JPEG', quality=95 if key == 'normal' else 92, optimize=True)
    else:
        im.save(buf, 'PNG', optimize=False, compress_level=6)
    return buf.getvalue(), mime


# ---------------------------------------------------------------- software render (QA views)

def render(pos, nor, uv, faces, tex, az, el, size):
    """Textured, Lambert-shaded orthographic view from azimuth az (0 = from +z, the front) and elevation el (deg)."""
    a, e = math.radians(az), math.radians(el)
    ry = np.array([[math.cos(a), 0, -math.sin(a)], [0, 1, 0], [math.sin(a), 0, math.cos(a)]])
    rx = np.array([[1, 0, 0], [0, math.cos(e), -math.sin(e)], [0, math.sin(e), math.cos(e)]])
    view = rx @ ry
    p = pos @ view.T
    n = nor @ view.T
    lo, hi = p[:, :2].min(0), p[:, :2].max(0)
    s = (size * 0.86) / max(hi[0] - lo[0], hi[1] - lo[1], 1e-9)
    sx = (p[:, 0] - (lo[0] + hi[0]) / 2) * s + size / 2
    sy = size / 2 - (p[:, 1] - (lo[1] + hi[1]) / 2) * s
    z = p[:, 2]
    zbuf = np.full((size, size), -np.inf)
    fid = np.full((size, size), -1, np.int64)
    bary = np.zeros((size, size, 3))
    for f, (i, j, k) in enumerate(faces):
        x0, x1 = sx[[i, j, k]].min(), sx[[i, j, k]].max()
        y0, y1 = sy[[i, j, k]].min(), sy[[i, j, k]].max()
        xa, xb = max(int(math.floor(x0)), 0), min(int(math.ceil(x1)), size - 1)
        ya, yb = max(int(math.floor(y0)), 0), min(int(math.ceil(y1)), size - 1)
        if xa > xb or ya > yb:
            continue
        gx, gy = np.meshgrid(np.arange(xa, xb + 1) + 0.5, np.arange(ya, yb + 1) + 0.5)
        d = (sy[j] - sy[k]) * (sx[i] - sx[k]) + (sx[k] - sx[j]) * (sy[i] - sy[k])
        if abs(d) < 1e-12:
            continue
        l0 = ((sy[j] - sy[k]) * (gx - sx[k]) + (sx[k] - sx[j]) * (gy - sy[k])) / d
        l1 = ((sy[k] - sy[i]) * (gx - sx[k]) + (sx[i] - sx[k]) * (gy - sy[k])) / d
        l2 = 1 - l0 - l1
        inside = (l0 >= -1e-4) & (l1 >= -1e-4) & (l2 >= -1e-4)
        if not inside.any():
            continue
        depth = l0 * z[i] + l1 * z[j] + l2 * z[k]
        sub = zbuf[ya:yb + 1, xa:xb + 1]
        upd = inside & (depth > sub)
        sub[upd] = depth[upd]
        fid[ya:yb + 1, xa:xb + 1][upd] = f
        bary[ya:yb + 1, xa:xb + 1][upd] = np.stack([l0, l1, l2], -1)[upd]
    img = np.full((size, size, 3), 70.0)
    m = fid >= 0
    fs = faces[fid[m]]
    bw = bary[m]
    uvp = (uv[fs] * bw[:, :, None]).sum(1)
    nn = (n[fs] * bw[:, :, None]).sum(1)
    nn /= np.linalg.norm(nn, axis=1, keepdims=True) + 1e-12
    th, tw = tex.shape[:2]
    col = tex[np.clip((uvp[:, 1] * th).astype(int), 0, th - 1), np.clip((uvp[:, 0] * tw).astype(int), 0, tw - 1)].astype(float)
    L = np.array([-0.35, 0.75, 0.55]); L /= np.linalg.norm(L)
    shade = 0.5 + 0.6 * np.clip(np.abs(nn @ L), 0, 1)  # abs: Tripo normals can face in on thin parts
    img[m] = np.clip(col * shade[:, None], 0, 255)
    return Image.fromarray(img.astype(np.uint8))


def final_views(path, title, pos, nor, uv, faces, tex, size=512):
    font = ImageFont.truetype('arial.ttf', 18)
    out = Image.new('RGB', (size * 2, size * 2 + 30), (40, 40, 40))
    for k, (az, lab) in enumerate(((0, 'front'), (45, '45'), (90, 'side (from +x)'), (180, 'back'))):
        im = render(pos, nor, uv, faces, tex, az, 18, size)
        ImageDraw.Draw(im).text((8, 6), lab, fill=(230, 230, 230), font=font)
        out.paste(im, ((k % 2) * size, 30 + (k // 2) * size))
    ImageDraw.Draw(out).text((8, 5), title, fill=(255, 220, 120), font=font)
    save_image(out, path)


# ---------------------------------------------------------------- per row

def spaced_layout(d):
    """rows/<row>/input_spaced.json as {'objects': [{'x', 'w'}], 'backdrop', 'tol'}; R30's hand-set re-spacing writes 'boxes' (dst x0 y0 x1 y1) and 'bg'."""
    lay = json.load(open(os.path.join(d, 'input_spaced.json')))
    if 'objects' not in lay and 'boxes' in lay:
        lay['objects'] = [{'x': b['dst'][0], 'w': b['dst'][2] - b['dst'][0]} for b in lay['boxes']]
        lay.setdefault('backdrop', lay.get('bg'))
    return lay


def concept_crop(row, k, out_path):
    d = row_dir(row)
    if not os.path.exists(os.path.join(d, 'input_spaced.json')):  # one-asset row fed whole (R24: input_r2.png)
        im = Image.open(os.path.join(d, 'input_r2.png')).convert('RGB')
        a = np.asarray(im).astype(int)
        diff = np.abs(a - a[5, 5]).max(2) > 28
        ys, xs = np.flatnonzero(diff.any(1)), np.flatnonzero(diff.any(0))
        box = (max(xs[0] - 12, 0), max(ys[0] - 12, 0), min(xs[-1] + 13, im.width), min(ys[-1] + 13, im.height)) if len(xs) else (0, 0, im.width, im.height)
        save_image(im.crop(box), out_path)
        return
    lay = spaced_layout(d)
    im = Image.open(os.path.join(d, 'input_spaced.png')).convert('RGB')
    o = lay['objects'][k]
    a = np.asarray(im).astype(int)
    bg = np.array(lay.get('backdrop', a[5, 5]))
    x0, x1 = max(o['x'] - 12, 0), min(o['x'] + o['w'] + 12, im.width)
    diff = np.abs(a[:, x0:x1] - bg).max(2) > lay.get('tol', 22) + 6
    rows_ = np.flatnonzero(diff.any(1))
    y0, y1 = (max(rows_[0] - 12, 0), min(rows_[-1] + 12, im.height)) if len(rows_) else (0, im.height)
    save_image(im.crop((x0, y0, x1, y1)), out_path)


def list_row(row):
    m = read_glb(row_glb(row))
    V, F = m['pos'], m['faces']
    obj, boxes = objects(V, F)
    area = face_areas(V, F)
    which, how = assign(row, V, F, obj, boxes, area)
    print(f'{row}: {len(F)} faces, {len(boxes)} objects ({how}), extent {np.round(np.ptp(V, 0), 3)}')
    for k, (a, b) in enumerate(boxes, start=1):
        print(f'  {k:3d}: {(obj == k).sum():6d} faces, area {area[obj == k].sum() / area.sum() * 100:5.1f} %  -> {CONFIG[row][which[k]]["id"]:12s}'
              f' x {a[0]:+.3f}..{b[0]:+.3f} y {a[1]:+.3f}..{b[1]:+.3f} z {a[2]:+.3f}..{b[2]:+.3f}')
    # front view (from the camera of the image), objects tinted and numbered
    s_ax = ROW_AXIS
    P2 = np.stack([V @ s_ax, V[:, 1]], 1)
    lo, hi = P2.min(0), P2.max(0)
    W = 1600
    sc = (W - 40) / (hi[0] - lo[0])
    H = int((hi[1] - lo[1]) * sc) + 60
    img = Image.new('RGB', (W, H), (30, 30, 30))
    dr = ImageDraw.Draw(img)
    tint = np.random.default_rng(3).integers(60, 255, (len(boxes) + 1, 3))
    depth = (V[F].mean(1) @ CAMERA)
    for f in np.argsort(depth):
        dr.polygon([(20 + (q[0] - lo[0]) * sc, H - 30 - (q[1] - lo[1]) * sc) for q in P2[F[f]]], fill=tuple(int(c) for c in tint[obj[f]]))
    for k in range(1, len(boxes) + 1):
        q = P2[F[obj == k]].reshape(-1, 2)
        dr.text((20 + (q[:, 0].mean() - lo[0]) * sc, H - 30 - (q[:, 1].max() - lo[1]) * sc - 14), str(k), fill=(255, 255, 255))
    os.makedirs(os.path.join(row_dir(row), '_split'), exist_ok=True)
    img.save(os.path.join(row_dir(row), '_split', 'objects.png'))


def split_row(row):
    d = row_dir(row)
    glb = row_glb(row)
    m = read_glb(glb)
    V, Nn, UVs, F = m['pos'], m['nor'], m['uv'], m['faces']
    area = face_areas(V, F)
    obj, boxes = objects(V, F)
    which, how = assign(row, V, F, obj, boxes, area)
    a_obj = {k: area[obj == k].sum() for k in range(1, len(boxes) + 1)}
    maps_raw = {k: (Image.open(io.BytesIO(v['bytes'])) if v else None) for k, v in m['maps'].items()}
    for im in maps_raw.values():
        if im is not None:
            im.load()
    tex_small = np.asarray(maps_raw['base'].convert('RGB').resize((1024, 1024), Image.BILINEAR))
    log = open(os.path.join(d, 'tripo.log'), encoding='utf-8').read() if os.path.exists(os.path.join(d, 'tripo.log')) else ''
    variant = None
    for line in log.splitlines():
        if 'variant' in line and 'chosen' in line:
            variant = line.split('variant', 1)[1].split()[0]
    out = {'row': row, 'row_glb': os.path.relpath(glb, KIT).replace('\\', '/'), 'variant': variant, 'faces': int(len(F)),
           'objects': len(boxes), 'split_by': how, 'assets': []}
    previews = []
    for a, cfg in enumerate(CONFIG[row]):
        nums = [k for k in range(1, len(boxes) + 1) if which[k] == a]
        if not nums:
            print(f'  {cfg["id"]}: NO OBJECTS')
            out['assets'].append({'id': cfg['id'], 'status': 'missing'})
            continue
        ext = np.ptp(np.concatenate([np.array(boxes[k - 1]) for k in nums]), 0).max()
        keep, strays = keep_joined(nums, boxes, a_obj, cfg.get('attach', 0.04) * ext, cfg.get('keep_all', False))
        sel = np.isin(obj, keep)
        used, inv = np.unique(F[sel], return_inverse=True)
        pos, nor, uv = V[used].copy(), Nn[used].copy(), UVs[used].copy()
        fc = inv.reshape(-1, 3)
        fa = area[sel]
        nd = needles(pos, fc)
        needle_area = float(fa[nd].sum() / fa.sum())
        if nd.any():  # drop them and the vertices only they used (a needle tip would set the bounds)
            fc, fa = fc[~nd], fa[~nd]
            u2, i2 = np.unique(fc, return_inverse=True)
            pos, nor, uv = pos[u2], nor[u2], uv[u2]
            fc = i2.reshape(-1, 3)
        red_faces = 0
        if cfg.get('drop_floor_red'):  # loose red bits lying on the floor (R33 petals): small welded parts, low, red in the atlas
            o_ = cfg['drop_floor_red']
            comp = weld_components(fc, pos)
            _, cinv = np.unique(comp, return_inverse=True)
            tex = np.asarray(maps_raw['base'].convert('RGB')).astype(float)
            cuv = uv[fc].mean(1)
            col = tex[np.clip((cuv[:, 1] % 1) * tex.shape[0], 0, tex.shape[0] - 1).astype(int), np.clip((cuv[:, 0] % 1) * tex.shape[1], 0, tex.shape[1] - 1).astype(int)]
            n_ = np.bincount(cinv)
            top = np.full(len(n_), -np.inf)
            np.maximum.at(top, cinv, pos[fc][:, :, 1].max(1))
            cm = np.zeros((len(n_), 3))
            np.add.at(cm, cinv, col)
            cm /= n_[:, None]
            bad = ((top - pos[:, 1].min()) <= o_.get('max_height', 0.1) * np.ptp(pos[:, 1])) & (n_ <= o_.get('max_faces', 150))                 & (cm[:, 0] >= o_.get('ratio', 1.2) * cm[:, 1:].max(1))
            drop = bad[cinv]
            red_faces = int(drop.sum())
            if red_faces:
                fc, fa = fc[~drop], fa[~drop]
                u2, i2 = np.unique(fc, return_inverse=True)
                pos, nor, uv = pos[u2], nor[u2], uv[u2]
                fc = i2.reshape(-1, 3)
        area_v = np.bincount(fc.ravel(), weights=np.repeat(fa / 3, 3), minlength=len(pos))
        up, tilt, s0, s1 = (UP.copy(), 0.0, 0.0, 0.0) if cfg.get('upright') else level(pos)  # upright: curved bottoms
        R = rotation_to_y(up)
        pos, nor = pos @ R.T, nor @ R.T
        cut_faces = 0
        if cfg.get('cut'):
            k_ = cut_patch(pos, fc, fa, cfg['cut'], cfg.get('dome', False))
            cut_faces = int((~k_).sum())
            fc, fa = fc[k_], fa[k_]
            u2, i2 = np.unique(fc, return_inverse=True)
            pos, nor, uv = pos[u2], nor[u2], uv[u2]
            fc = i2.reshape(-1, 3)
            area_v = np.bincount(fc.ravel(), weights=np.repeat(fa / 3, 3), minlength=len(pos))
        yaw, kind = yaw_front(pos, area_v, cfg['size'], cfg.get('front'))
        yaw += math.radians(cfg.get('yaw', 0))
        Ry = rot_y(yaw)
        pos, nor = pos @ Ry.T, nor @ Ry.T
        pos -= [(pos[:, 0].min() + pos[:, 0].max()) / 2, pos[:, 1].min(), (pos[:, 2].min() + pos[:, 2].max()) / 2]
        scale = 1.0 / np.ptp(pos, 0).max()
        pos *= scale
        dims = np.ptp(pos, 0)
        # texture: own atlas
        rp = repack(uv, fc, maps_raw)
        images = {}
        if rp is None:
            new_uv, atlas = uv, maps_raw['base'].size
            for key, v in m['maps'].items():
                if v:
                    images[key] = (v['bytes'], v['mime'])
            tex_note = 'row atlas kept whole'
        else:
            new_uv, new_maps, atlas = rp
            for key, im in new_maps.items():
                images[key] = encode(im, m['maps'][key]['mime'], key)
            tex_note = f'own atlas {atlas[0]}x{atlas[1]} (row atlas {maps_raw["base"].size[0]}x{maps_raw["base"].size[1]})'
        folder = cfg.get('dir') or f'{cfg["id"].replace(".", "_")}_{cfg["slug"]}'
        adir = piece_dir(folder)
        os.makedirs(os.path.join(adir, '_shots'), exist_ok=True)
        name = f'act1_kit_v1_{cfg["slug"]}'
        w, h, dd = cfg['size']
        extras = {'asset': cfg['id'], 'name': cfg['name'], 'source': out['row_glb'], 'variant': variant,
                  'real_size_m': [w, h, dd], 'normalised': 'longest side 1, pivot bottom centre, +y up, front +z'}
        path = os.path.join(adir, name + '.glb')
        write_glb(path, name, pos, nor, new_uv, fc, m['material'], images, m['sampler'], extras)
        concept_crop(row, a, os.path.join(adir, 'concept.png'))
        if rp is None:
            tex_r = tex_small
        else:
            tex_r = np.asarray(new_maps['base'].convert('RGB').resize((1024, max(16, int(1024 * atlas[1] / atlas[0]))), Image.BILINEAR))
        title = f'{cfg["id"]} {cfg["name"]}  |  {len(fc)} tris  |  norm {dims[0]:.2f} x {dims[1]:.2f} x {dims[2]:.2f}  |  real {w} x {h} x {dd} m'
        final_views(os.path.join(adir, '_shots', 'final_views.png'), title, pos, nor, new_uv, fc, tex_r)
        prev = Image.new('RGB', (520, 270), (40, 40, 40))
        prev.paste(render(pos, nor, new_uv, fc, tex_r, 0, 18, 256), (2, 12))
        prev.paste(render(pos, nor, new_uv, fc, tex_r, 45, 30, 256), (262, 12))
        ImageDraw.Draw(prev).text((4, 0), f'{cfg["id"]} {cfg["slug"]}', fill=(255, 220, 120))
        previews.append(prev)
        # proportions against the real size: per-axis scale to metres (1.0 everywhere = same shape as the spec)
        k_m = np.array([w, h, dd]) / dims
        rec = {'id': cfg['id'], 'slug': cfg['slug'], 'name': cfg['name'], 'dir': folder, 'glb': f'{folder}/{name}.glb',
               'mb': round(os.path.getsize(path) / 1e6, 1), 'tris': int(len(fc)), 'objects': keep, 'strays': strays,
               'stray_faces': int(sum((obj == k).sum() for k in strays)), 'cut_faces': cut_faces,
               'needle_faces': int(nd.sum()), 'needle_area_pct': round(100 * needle_area, 4),
               'tilt_deg': round(tilt, 1), 'support_gain': round(s1 / s0, 2) if s0 else None, 'front': kind,
               'yaw_deg': round(math.degrees(yaw), 1), 'normalised': [round(float(v), 3) for v in dims],
               'real_size_m': [w, h, dd], 'm_per_unit_xyz': [round(float(v), 2) for v in k_m],
               'shape_spread': round(float(k_m.max() / k_m.min()), 2), 'texture': tex_note}
        if cfg.get('drop_floor_red'):
            rec['floor_red_faces_dropped'] = red_faces
        out['assets'].append(rec)
        print(f'  {cfg["id"]:11s} {folder:28s} {len(fc):6d} tris {rec["mb"]:5.1f} MB  objs {keep} strays {strays} needles {int(nd.sum())}  tilt {tilt:4.1f}  '
              f'{kind:10s} yaw {math.degrees(yaw):6.1f}  norm {dims[0]:.2f}x{dims[1]:.2f}x{dims[2]:.2f}  m/u {k_m.round(2)}  {tex_note}')
    sheet = Image.new('RGB', (520, 270 * len(previews)), (40, 40, 40))
    for i, p in enumerate(previews):
        sheet.paste(p, (0, 270 * i))
    save_image(sheet, os.path.join(d, '_split', 'pieces.png'))
    json.dump(out, open(os.path.join(d, '_split', 'split.json'), 'w', encoding='utf-8'), indent=1)
    return out


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['--list']:
        for r in args[1:]:
            list_row(r)
    else:
        rows = args or [r for r in sorted(CONFIG) if r.startswith('R') and os.path.exists(row_glb(r))]
        for r in rows:
            os.makedirs(os.path.join(row_dir(r), '_split'), exist_ok=True)
            print('==', r)
            split_row(r)

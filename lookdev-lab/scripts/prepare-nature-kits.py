"""Split the Tripo models of the nature prop sheets 08–12 (art-output/tripo-models/nature/*.glb: rocks, mossy rocks,
buried corpses, dead trees, burned trees) into the lab's nature kits.

Usage: python -I scripts/prepare-nature-kits.py [kit-id ...]          write the kits (default: all of KITS)
       python -I scripts/prepare-nature-kits.py --list <model> ...    number a model's objects (<model>_objects.png)

Tripo builds a concept sheet as one model whose front view is the sheet. These sheets draw each prop from the game
camera (50–60° down) or from above, standing on its own oval of mud, so every prop comes out on a tilted ground, and
Tripo leaves out most of a sheet's lower rows (those were composed into one-row images and built again, see
tripo-models/nature/_tools/compose_rows.py). So, per model:
  1. Objects: the model is voxelised and split where empty space separates it; parts of a few faces join the
     nearest object. Objects are numbered row by row from the top, left to right (--list draws the numbers).
  2. KITS names the pieces: one or more object numbers of a model (Tripo sometimes breaks a prop apart, a spear from
     its corpse), and MODELS the scale figure of each model (a grey 1.8 m human standing upright in the sheet: its
     height along y gives metres per unit).
  3. Each piece is levelled on its ground: the up direction is the one along which most of its surface lies in a thin
     layer at its bottom (the mud oval), searched over tilts toward the camera.
  4. The mud oval is cut away (cut_patch: faces on a dome fitted to the oval's rim, then crumbs no longer attached),
     so a prop meets the terrain instead of a painted disc; a thin layer for the corpses, whose bones lie low.
  5. Turned about y so the longest horizontal direction runs along +x, pivot at the bottom centre. One GLB per kit,
     a node per piece (<prefix>_<nn>_<name>), a material per source model (its texture as JPEG, TEXTURE px).
Writes assets/samples/<kit>.glb and a preview, art-output/tripo-models/nature/<kit>_pieces.png.
"""
import io
import json
import os
import struct
import sys

import numpy as np
import trimesh
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
ROOT = os.path.dirname(LAB)
NATURE = os.path.join(ROOT, 'art-output', 'tripo-models', 'nature')
TEXTURE = 2048  # a sheet's atlas; at 1024 props are magnified on a 1440p screen at the default iso zoom (0.6 texel/px)

# Model → its scale figure: object numbers (--list), and an x range (model units) where an object holds more.
MODELS = {
    'asset_08_rock_sheet': ([1], (-1, -0.452)),
    'asset_09_mossy_rock_sheet': ([1], None),
    'asset_10_buried_corpse_sheet': ([3], None),
    'asset_10b_buried_corpse_row': ([1], None),
    'asset_11_dead_tree_sheet': ([1], None),
    'asset_11b_dead_tree_row': ([1], None),
    'asset_11c_fallen_wood_row': ([1], None),
    'asset_12_burned_tree_sheet': ([1], None),
}

# Kit → piece prefix, mud-oval layer to cut (fraction of the piece's size; 0 keeps it), its shape (False: the bottom
# layer, True: a dome, see cut_patch), pieces [(name, model, object numbers[, x range][, {'cut': layer, 'dome': shape}])]. Names follow the cells of
# README_NATURE_PROPS.md (assets_2d); _front / _side / _top are the standard prop drawn from the front, the side and
# above (Tripo builds each as its own variant), *_b a second build of the same cell (the row images).
R8, R9, C10, C10B = 'asset_08_rock_sheet', 'asset_09_mossy_rock_sheet', 'asset_10_buried_corpse_sheet', 'asset_10b_buried_corpse_row'
T11, T11B, W11C, B12 = 'asset_11_dead_tree_sheet', 'asset_11b_dead_tree_row', 'asset_11c_fallen_wood_row', 'asset_12_burned_tree_sheet'
ROW = {'cut': 0.025, 'dome': True}  # the one-row models stand each prop on a domed slab of mud
KITS = {
    'kit-moor-rocks': ('rock', 0.035, False, [
        ('standard', R8, [2]), ('standard_front', R8, [1], (-0.452, -0.176)), ('standard_side', R8, [1], (-0.176, 0.02)),
        ('standard_top', R8, [3]), ('low', R8, [4]), ('medium', R8, [5]), ('tall', R8, [6, 7]), ('ledge', R8, [8]),
        ('cluster', R8, [9]),
    ]),
    'kit-mossy-rocks': ('mossy', 0.035, False, [
        ('standard', R9, [4], (0.007, 1)), ('standard_front', R9, [2]), ('standard_side', R9, [4], (-1, 0.007)),
        ('standard_top', R9, [7]), ('light', R9, [3]), ('medium', R9, [5]),
    ]),
    'kit-buried-corpses': ('corpse', 0.015, True, [  # a thin layer: the bones lie low
        ('imp_reaching', C10, [4], {'cut': 0}), ('imp_reaching_b', C10, [6], {'cut': 0}),  # little oval left; the fallen imp (7–10) came out in pieces
        ('imp_half', C10B, [2]), ('imp_old', C10B, [3]), ('beast', C10B, [4]), ('crawler', C10B, [5]),  # bones (6): crumbs without its oval
    ]),
    'kit-dead-trees': ('tree', 0.035, False, [
        ('standard', T11, [8]), ('standard_front', T11, [2]), ('standard_side', T11, [6]),
        ('sapling', T11B, [2], ROW), ('hooked', T11B, [3], ROW), ('tall', T11B, [4], ROW), ('uprooted', T11B, [5], ROW), ('stump', T11B, [6], ROW),
        ('tall_b', T11, [7]), ('uprooted_b', T11, [9]),  # its sapling, hooked tree and stump (3–5, 10) are broken
        ('fallen', W11C, [2], ROW), ('branches', W11C, [3], ROW), ('roots', W11C, [4], ROW), ('thorn_bush', W11C, [5], ROW),
    ]),
    'kit-burned-trees': ('burned', 0.025, True, [
        ('standard', B12, [4]), ('standard_front', B12, [2]), ('standard_side', B12, [3]),
        ('embers', B12, [6]), ('charcoal', B12, [7]), ('reclaimed', B12, [8]),
        ('stump', W11C, [6]), ('collapsed', W11C, [7]),
    ]),
}


def load(name):
    scene = trimesh.load(os.path.join(NATURE, name + '.glb'), process=False)
    return list(scene.geometry.values())[0]


def objects(mesh, cells=220, min_faces=40):
    """Object number of every face (1.. top row first, left to right) and the objects' boxes."""
    V, F = mesh.vertices, mesh.faces
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
    # Rows: objects whose front-view heights overlap; top row first, then left to right.
    rows = []
    for k in sorted(big, key=lambda k: -box[k][1][1]):
        lo_k, hi_k = box[k][0][1], box[k][1][1]
        for row in rows:
            r_lo, r_hi = min(box[j][0][1] for j in row), max(box[j][1][1] for j in row)
            if min(hi_k, r_hi) - max(lo_k, r_lo) > 0.4 * min(hi_k - lo_k, r_hi - r_lo):
                row.append(k)
                break
        else:
            rows.append([k])
    order = [k for row in rows for k in sorted(row, key=lambda k: box[k][0][0])]
    number = {k: n for n, k in enumerate(order, start=1)}
    return np.array([number[k] for k in face]), [box[k] for k in order]


def face_colors(mesh):
    img = np.asarray(mesh.visual.material.baseColorTexture.convert('RGB')) / 255.0
    h, w = img.shape[:2]
    uv = mesh.visual.uv[mesh.faces].mean(1)
    return img[((1 - uv[:, 1]) * (h - 1)).astype(int).clip(0, h - 1), (uv[:, 0] * (w - 1)).astype(int).clip(0, w - 1)]


def list_objects(name):
    mesh = load(name)
    obj, boxes = objects(mesh)
    V, F = mesh.vertices, mesh.faces
    lo, hi = V.min(0), V.max(0)
    for n, (a, b) in enumerate(boxes, start=1):
        print(f'{n:3d}: {(obj == n).sum():6d} faces, x {a[0]:+.3f}..{b[0]:+.3f} y {a[1]:+.3f}..{b[1]:+.3f} z {a[2]:+.3f}..{b[2]:+.3f}')
    W = 1800
    s = (W - 40) / (hi[0] - lo[0])
    H = int((hi[1] - lo[1]) * s) + 60
    img = Image.new('RGB', (W, H), (30, 30, 30))
    draw = ImageDraw.Draw(img)
    colors = face_colors(mesh)
    tri = V[F]
    tint = np.random.default_rng(3).integers(60, 255, (len(boxes) + 1, 3))
    for f in np.argsort(tri[:, :, 2].mean(1)):
        c = (colors[f] * 160 + tint[obj[f]] * 0.4).clip(0, 255).astype(int)
        draw.polygon([(20 + (p[0] - lo[0]) * s, H - 30 - (p[1] - lo[1]) * s) for p in tri[f]], fill=tuple(c))
    for n, (a, b) in enumerate(boxes, start=1):
        draw.text((20 + ((a[0] + b[0]) / 2 - lo[0]) * s, H - 30 - (b[1] - lo[1]) * s - 14), str(n), fill=(255, 255, 255))
    path = os.path.join(NATURE, name + '_objects.png')
    img.save(path)
    print('drew', path)


def rotation_to_y(n):
    """Rotation matrix taking unit vector n onto +y."""
    y = np.array([0.0, 1.0, 0.0])
    axis = np.cross(n, y)
    s, c = np.linalg.norm(axis), float(np.dot(n, y))
    if s < 1e-9:
        return np.eye(3) if c > 0 else np.diag([1.0, -1.0, -1.0])
    k = axis / s
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + s * K + (1 - c) * K @ K


def level(pos, weight):
    """Up direction of a piece: the tilt toward the camera (about x, then a little about z) that puts the most surface
    (weight per vertex) in a thin layer at the bottom."""
    span = np.ptp(pos, 0).max()

    def score(tx, tz):
        n = np.array([np.sin(tz) * np.cos(tx), np.cos(tz) * np.cos(tx), np.sin(tx)])
        h = pos @ n
        return weight[h < np.percentile(h, 0.5) + 0.03 * span].sum(), n

    best = max((score(tx, tz) for tx in np.radians(np.arange(-15, 96, 2.5)) for tz in np.radians(np.arange(-20, 21, 5))), key=lambda r: r[0])
    tx0, tz0 = np.arcsin(np.clip(best[1][2], -1, 1)), np.arctan2(best[1][0], best[1][1])
    fine = max((score(tx, tz) for tx in tx0 + np.radians(np.arange(-2.5, 2.6, 0.5)) for tz in tz0 + np.radians(np.arange(-5, 5.1, 1))), key=lambda r: r[0])
    n = max(best, fine, key=lambda r: r[0])[1]
    return n / np.linalg.norm(n)


def weld_components(faces, verts):
    key = np.round(verts / 1e-5).astype(np.int64)
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


def cut_patch(pos, faces, normals_f, area, layer, dome=False):
    """Faces kept once the mud oval is gone: the faces on it go (all corners within `layer` of the piece's size from
    it), then the crumbs left unattached (an isolated tuft, pebble or big lone triangle of the oval). The oval is the
    bottom layer of the piece, or with `dome` a slab whose top is a low dome or tilted plate: a quadratic y = f(x, z)
    fitted to the low points of its outer part (vertices of upward faces in the lower third, refitted without those
    well above it), everything on or under it going."""
    span = np.ptp(pos, 0).max()
    x, y, z = pos[:, 0], pos[:, 1], pos[:, 2]
    if dome:
        cx, cz = (x.min() + x.max()) / 2, (z.min() + z.max()) / 2
        radial = np.hypot(x - cx, z - cz)
        basis = lambda x, z: np.stack([np.ones_like(x), x - cx, z - cz, (x - cx) ** 2, (z - cz) ** 2, (x - cx) * (z - cz)], 1)
        low = np.zeros(len(pos), bool)
        low[np.unique(faces[normals_f[:, 1] > 0.6])] = True
        low &= (radial > 0.55 * radial.max()) & (y < y.min() + 0.33 * np.ptp(y))
        fit = low
        for _ in range(5):
            coef, *_ = np.linalg.lstsq(basis(x[fit], z[fit]), y[fit], rcond=None)
            resid = y - basis(x, z) @ coef
            fit = low & (np.abs(resid) < 2.5 * max(np.std(resid[fit]), 1e-4))
        resid = y - basis(x, z) @ coef
        tol = layer * span
        big = area > 8 * np.median(area)  # the oval's own triangles are large; its bumps rise a little above the fit
        keep = ~((resid[faces] < tol).all(1) | (big & (resid[faces] < 4 * tol).all(1)))
    else:
        keep = ~((y[faces].max(1) < y.min() + layer * span) & (normals_f[:, 1] > 0.6))
    comp = weld_components(faces[keep], pos)
    _, inv = np.unique(comp, return_inverse=True)
    sizes = np.bincount(inv, weights=area[keep])
    count = np.bincount(inv)
    out = np.zeros(len(faces), bool)
    out[np.flatnonzero(keep)[(sizes[inv] >= 0.04 * sizes.max()) & (count[inv] >= 8)]] = True
    return out


class Model:
    """A Tripo model, its objects and its scale (metres per unit, from its figure)."""

    def __init__(self, name):
        self.name = name
        self.mesh = load(name)
        self.obj, self.boxes = objects(self.mesh)
        V, F = self.mesh.vertices, self.mesh.faces
        tri = V[F]
        self.area = np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1) / 2
        numbers, xr = MODELS[name]
        fv = V[np.unique(F[self.select(numbers, xr)])]
        height = np.ptp(fv[:, 1])  # the figure stands upright in the sheet (Tripo may build it as a thin slab)
        self.scale = 1.8 / height
        self.colors = face_colors(self.mesh)
        print(f'{name}: {len(self.boxes)} objects, figure {numbers} {height:.4f} units -> {self.scale:.2f} m per unit')

    def select(self, numbers, xr=None):
        """Faces of the objects, only those whose centre lies in the x range when there is one."""
        sel = np.isin(self.obj, numbers)
        if xr:
            x = self.mesh.vertices[self.mesh.faces].mean(1)[:, 0]
            sel &= (x >= xr[0]) & (x < xr[1])
        return sel

    def piece(self, numbers, cut, dome, xr=None):
        """Positions, normals, uvs, indices, face colours, face normals and ground tilt of the objects, levelled and
        placed on their pivot."""
        sel = self.select(numbers, xr)
        V, F = self.mesh.vertices, self.mesh.faces
        used, inverse = np.unique(F[sel], return_inverse=True)
        pos = V[used] * self.scale
        idx = inverse.reshape(-1, 3)
        fa = self.area[sel] * self.scale ** 2
        weight = np.bincount(idx.ravel(), weights=np.repeat(fa / 3, 3), minlength=len(pos))
        up = level(pos, weight)
        rot = rotation_to_y(up)
        pos = pos @ rot.T
        nor = self.mesh.vertex_normals[used] @ rot.T
        tri = pos[idx]
        fn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
        fn /= np.linalg.norm(fn, axis=1, keepdims=True) + 1e-12
        cols = self.colors[sel]
        if cut:
            keep = cut_patch(pos, idx, fn, fa, cut, dome)
            idx, fn, cols = idx[keep], fn[keep], cols[keep]
            used2, inv2 = np.unique(idx, return_inverse=True)
            pos, nor, used = pos[used2], nor[used2], used[used2]
            idx = inv2.reshape(-1, 3)
        xz = pos[:, [0, 2]] - pos[:, [0, 2]].mean(0)
        evals, evecs = np.linalg.eigh(xz.T @ xz)
        ax = evecs[:, np.argmax(evals)]
        ang = np.arctan2(ax[1], ax[0])
        c, s = np.cos(ang), np.sin(ang)
        ry = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])  # the longest horizontal direction onto +x
        pos, nor, fn = pos @ ry.T, nor @ ry.T, fn @ ry.T
        pos = pos - np.array([(pos[:, 0].min() + pos[:, 0].max()) / 2, pos[:, 1].min(), (pos[:, 2].min() + pos[:, 2].max()) / 2])
        uv = self.mesh.visual.uv[used].copy()
        uv[:, 1] = 1.0 - uv[:, 1]  # trimesh flips glTF's V on load
        return pos, nor, uv, idx, cols, fn, np.degrees(np.arccos(np.clip(up[1], -1, 1)))

    def texture(self):
        tex = self.mesh.visual.material.baseColorTexture.convert('RGB')
        if max(tex.size) > TEXTURE:
            tex = tex.resize((TEXTURE, TEXTURE), Image.LANCZOS)
        buf = io.BytesIO()
        tex.save(buf, 'JPEG', quality=88, optimize=True)
        return buf.getvalue()


def write_glb(path, pieces, textures):
    """pieces: [(name, positions, normals, uvs, indices, material)]; textures: JPEG bytes, one material each."""
    blobs, views, accessors, meshes, nodes = [], [], [], [], []
    offset = 0

    def add(data, target=None):
        nonlocal offset
        raw = data.tobytes()
        pad = (-len(raw)) % 4
        blobs.append(raw + b'\0' * pad)
        view = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw)}
        if target:
            view['target'] = target
        views.append(view)
        offset += len(raw) + pad
        return len(views) - 1

    for name, pos, nor, uv, idx, material in pieces:
        a = len(accessors)
        accessors.append({'bufferView': add(pos.astype(np.float32), 34962), 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
                          'min': pos.min(0).tolist(), 'max': pos.max(0).tolist()})
        accessors.append({'bufferView': add(nor.astype(np.float32), 34962), 'componentType': 5126, 'count': len(nor), 'type': 'VEC3'})
        accessors.append({'bufferView': add(uv.astype(np.float32), 34962), 'componentType': 5126, 'count': len(uv), 'type': 'VEC2'})
        index_type = np.uint16 if len(pos) < 65536 else np.uint32
        accessors.append({'bufferView': add(idx.astype(index_type).ravel(), 34963), 'componentType': 5123 if index_type is np.uint16 else 5125,
                          'count': int(idx.size), 'type': 'SCALAR'})
        meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': a, 'NORMAL': a + 1, 'TEXCOORD_0': a + 2}, 'indices': a + 3, 'material': material}]})
        nodes.append({'name': name, 'mesh': len(meshes) - 1})
    images = [{'bufferView': add(np.frombuffer(t, np.uint8)), 'mimeType': 'image/jpeg'} for t in textures]
    gltf = {
        'asset': {'version': '2.0', 'generator': 'lookdev-lab scripts/prepare-nature-kits.py'},
        'scene': 0,
        'scenes': [{'nodes': list(range(len(nodes)))}],
        'nodes': nodes,
        'meshes': meshes,
        'materials': [{'name': f'kit_{i}', 'pbrMetallicRoughness': {'baseColorTexture': {'index': i}, 'metallicFactor': 0.0, 'roughnessFactor': 0.9}}
                      for i in range(len(textures))],
        'textures': [{'source': i, 'sampler': 0} for i in range(len(textures))],
        'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}],
        'images': images,
        'accessors': accessors,
        'bufferViews': views,
        'buffers': [{'byteLength': offset}],
    }
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((-len(js)) % 4)
    binary = b''.join(blobs)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binary)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(binary), 0x004E4942) + binary)


def preview(path, pieces, cols=5, cell=260):
    """Contact sheet: each piece from the game camera (south-east, 40° down), face colours with a little shading."""
    rows = (len(pieces) + cols - 1) // cols
    img = Image.new('RGB', (cols * cell, rows * cell), (40, 40, 40))
    draw = ImageDraw.Draw(img)
    yaw, pitch = np.radians(45), np.radians(40)
    ry = np.array([[np.cos(yaw), 0, -np.sin(yaw)], [0, 1, 0], [np.sin(yaw), 0, np.cos(yaw)]])
    rx = np.array([[1, 0, 0], [0, np.cos(pitch), -np.sin(pitch)], [0, np.sin(pitch), np.cos(pitch)]])
    view = rx @ ry
    light = np.array([-0.5, 0.8, 0.3]) / np.linalg.norm([-0.5, 0.8, 0.3])
    for i, (name, pos, idx, colors, normals_f) in enumerate(pieces):
        ox, oy = (i % cols) * cell, (i // cols) * cell
        p = pos @ view.T
        s = (cell - 40) / max(np.ptp(p[:, 0]), np.ptp(p[:, 1]), 1e-6)
        cx, cy = (p[:, 0].max() + p[:, 0].min()) / 2, (p[:, 1].max() + p[:, 1].min()) / 2
        tri = p[idx]
        shade = 0.55 + 0.45 * np.clip(normals_f @ light, 0, 1)
        for f in np.argsort(tri[:, :, 2].mean(1)):
            pts = [(ox + cell / 2 + (q[0] - cx) * s, oy + cell / 2 + 10 - (q[1] - cy) * s) for q in tri[f]]
            draw.polygon(pts, fill=tuple(int(255 * min(1, x * shade[f])) for x in colors[f]))
        size = np.ptp(pos, 0)
        draw.text((ox + 4, oy + 4), f'{name}  {size[0]:.2f}x{size[1]:.2f}x{size[2]:.2f} m  {len(idx)} tris', fill=(230, 220, 190))
    img.save(path)


def build(kit, models):
    prefix, cut, dome, entries = KITS[kit]
    if not entries:
        print(f'{kit}: no pieces named yet')
        return
    sources, out, shown = [], [], []
    for k, (name, model, numbers, *more) in enumerate(entries, start=1):
        opts = more[-1] if more and isinstance(more[-1], dict) else {}
        xr = [m for m in more if not isinstance(m, dict)]
        if model not in models:
            models[model] = Model(model)
        if model not in sources:
            sources.append(model)
        pos, nor, uv, idx, cols, fn, tilt = models[model].piece(numbers, opts.get('cut', cut), opts.get('dome', dome), *xr)
        label = f'{prefix}_{k:02d}_{name}'
        size = np.ptp(pos, 0)
        print(f'  {label}: {len(idx)} tris, {size[0]:.2f} x {size[1]:.2f} x {size[2]:.2f} m, ground tilted {tilt:.0f}°')
        out.append((label, pos, nor, uv, idx, sources.index(model)))
        shown.append((label, pos, idx, cols, fn))
    dst = os.path.join(LAB, 'assets', 'samples', kit + '.glb')
    write_glb(dst, out, [models[m].texture() for m in sources])
    print(f'wrote {dst} ({os.path.getsize(dst) / 1024:.0f} KB, {len(out)} pieces)')
    preview(os.path.join(NATURE, kit + '_pieces.png'), shown)


if __name__ == '__main__':
    args = sys.argv[1:]
    if args[:1] == ['--list']:
        for name in args[1:]:
            list_objects(name)
    else:
        models = {}
        for kit in args or KITS:
            print('==', kit)
            build(kit, models)

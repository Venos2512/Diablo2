"""Split a generated prop *kit sheet* (one mesh holding many variants laid out in rows, plus a grey human
for scale — e.g. Tripo image-to-3D of a concept sheet) into separate, real-size pieces.

Usage:
  python -I scripts/prepare-prop-kit.py <sheet.glb> <out.glb> --prefix fence [--human 1.8 | --height 2.0] [--texture 2048]
        [--names a,b,c,...] [--preview pieces.png] [--cuts "0:-0.31,-0.15"]

Steps
  1. Connected components of the welded mesh (planks, stakes, nails ...). Stray slivers (a few long, thin
     triangles the generator sometimes leaves spanning across the sheet) are dropped first.
  2. Rows: components grouped by their height in the sheet (gaps along y). With --layout top the sheet is a
     grid seen from above (e.g. plants scattered on the ground): rows are gaps along z and the footprint
     below is the top view (x, z).
  3. Columns: each row's front view (x, y) is rasterised and touching footprints are joined; pieces that
     really touch in the sheet are split with --cuts. A component always stays whole (it goes to the piece
     holding most of its area), so a brace crossing a cut is never sliced.
  4. The grey, unsaturated piece is the scale figure: removed, its height gives metres per unit (the tallest
     one when the sheet has several grey figures; the others are removed too). A single prop generated
     without a figure takes --height instead: the tallest piece is scaled to that many metres.
  5. Each piece is turned about y so its longest horizontal direction runs along +x (--no-align keeps the
     sheet orientation) and gets its pivot at the bottom centre (sits on y = 0).
  6. Written as one GLB: a node per piece (named <prefix>_<nn>[_<name>]), one shared material. Base colour,
     metallic-roughness and normal maps of the sheet are kept when present (re-encoded as JPEG at --texture px;
     the normal map at higher quality so its gradients do not band).
"""
import argparse
import io
import json
import os
import struct

import numpy as np
import trimesh
from PIL import Image, ImageDraw
from scipy import ndimage


def load(fn):
    scene = trimesh.load(fn, process=False)
    return list(scene.geometry.values())[0]


def face_colors(mesh):
    img = np.asarray(mesh.visual.material.baseColorTexture.convert('RGB')) / 255.0
    h, w = img.shape[:2]
    uv = mesh.visual.uv[mesh.faces].mean(1)
    return img[((1 - uv[:, 1]) * (h - 1)).astype(int).clip(0, h - 1), (uv[:, 0] * (w - 1)).astype(int).clip(0, w - 1)]


def split_gaps(values, weights, gap):
    """1D clusters of sorted values separated by more than `gap`; returns a label per value."""
    order = np.argsort(values)
    labels = np.zeros(len(values), int)
    cur = 0
    for a, b in zip(order[:-1], order[1:]):
        labels[a] = cur
        if values[b] - values[a] > gap:
            cur += 1
    labels[order[-1]] = cur
    return labels


def footprint_regions(tri, res=0.002, grow=2):
    """Label of every triangle after rasterising the view (x, tri[..., 1]) and joining touching footprints."""
    lo = tri.reshape(-1, tri.shape[-1]).min(0)
    hi = tri.reshape(-1, tri.shape[-1]).max(0)
    w = int(np.ceil((hi[0] - lo[0]) / res)) + 5
    h = int(np.ceil((hi[1] - lo[1]) / res)) + 5
    canvas = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(canvas)
    for t in tri:
        draw.polygon([((v[0] - lo[0]) / res + 2, (v[1] - lo[1]) / res + 2) for v in t], fill=255, outline=255)
    regions, _ = ndimage.label(ndimage.binary_dilation(np.asarray(canvas) > 0, iterations=grow))
    c = tri.mean(1)
    return regions[((c[:, 1] - lo[1]) / res + 2).astype(int), ((c[:, 0] - lo[0]) / res + 2).astype(int)]


def drop_slivers(mesh, max_faces=8, min_extent=0.2):
    """Remove components of at most `max_faces` triangles that still span more than `min_extent` sheet units."""
    welded = mesh.copy()
    welded.merge_vertices(merge_tex=True, merge_norm=True)
    comp = trimesh.graph.connected_component_labels(welded.face_adjacency, node_count=len(welded.faces))
    tri = mesh.vertices[mesh.faces]
    keep = np.ones(len(mesh.faces), bool)
    for c in np.unique(comp):
        sel = comp == c
        if sel.sum() <= max_faces and np.ptp(tri[sel].reshape(-1, 3), 0).max() > min_extent:
            keep[sel] = False
    if keep.all():
        return mesh
    print(f'dropped {np.count_nonzero(~keep)} sliver triangles')
    return trimesh.Trimesh(mesh.vertices, mesh.faces[keep], vertex_normals=mesh.vertex_normals,
                           visual=trimesh.visual.TextureVisuals(uv=mesh.visual.uv, material=mesh.visual.material), process=False)


def split_rows(values, n):
    """Exactly n clusters of 1D values, split at the n-1 widest gaps; label 0 = lowest values."""
    order = np.argsort(values)
    gaps = np.diff(values[order])
    cut_after = np.sort(np.argsort(gaps)[::-1][:n - 1])
    labels = np.zeros(len(values), int)
    for c in cut_after:
        labels[order[c + 1:]] += 1
    return labels


def segment(mesh, cuts=None, layout='front', rows=0):
    """Piece label per face. cuts: {row index: [x, ...]} extra vertical cuts for pieces that touch in the sheet.
    rows: force this many rows (split at the widest gaps) instead of splitting at every gap wider than 0.03."""
    up = 1 if layout == 'front' else 2  # axis separating rows (and second axis of the footprint)
    if layout == 'plan':
        rows = 1  # one footprint over the whole ground plane; pieces are ordered back to front below
    welded = mesh.copy()
    welded.merge_vertices(merge_tex=True, merge_norm=True)
    comp = trimesh.graph.connected_component_labels(welded.face_adjacency, node_count=len(welded.faces))
    ncomp = comp.max() + 1
    tri = mesh.vertices[mesh.faces]
    centroid = tri.mean(1)
    area = mesh.area_faces + 1e-12
    comp_area = np.bincount(comp, area, ncomp)
    comp_y = np.bincount(comp, centroid[:, up] * area, ncomp) / comp_area
    comp_x = np.bincount(comp, centroid[:, 0] * area, ncomp) / comp_area
    key = -comp_y if up == 1 else comp_y
    row_of_comp = split_rows(key, rows) if rows else split_gaps(key, comp_area, gap=0.03)  # row 0 = top (front) / back (top layout)
    piece_of_comp = np.zeros(ncomp, int)
    next_id = 0
    for row in np.unique(row_of_comp):
        comps = np.where(row_of_comp == row)[0]
        faces = np.where(np.isin(comp, comps))[0]
        region = footprint_regions(tri[faces][:, :, [0, up]])
        extra = sorted((cuts or {}).get(int(row), []))
        for c in comps:
            sel = comp[faces] == c
            r = np.bincount(region[sel], area[faces][sel]).argmax()
            piece_of_comp[c] = r * 100 + int(np.searchsorted(extra, comp_x[c]))
        keys = np.unique(piece_of_comp[comps])
        for i, kk in enumerate(keys):
            piece_of_comp[comps[piece_of_comp[comps] == kk]] = next_id + i + 10**6
        next_id += len(keys)
    piece = piece_of_comp[comp] - 10**6
    ids = np.unique(piece)
    rowkey = {p: int(row_of_comp[comp[piece == p][0]]) for p in ids}
    if layout == 'plan':  # order like the sheet: back row first (two bands split at the median depth), left to right
        zc = {p: float(centroid[piece == p, 2].mean()) for p in ids}
        mid = float(np.median(list(zc.values())))
        rowkey = {p: int(zc[p] > mid) for p in ids}
    ordered = sorted(ids, key=lambda p: (rowkey[p], float(centroid[piece == p, 0].mean())))
    remap = {p: i for i, p in enumerate(ordered)}
    print('rows:', len(np.unique(row_of_comp)), '| pieces per row:', [sum(1 for p in ids if rowkey[p] == r) for r in np.unique(row_of_comp)])
    return np.array([remap[p] for p in piece])


def merge_small(mesh, piece, min_tris):
    """Pieces with fewer than min_tris triangles (chips, pebbles, a stray pole end) join the nearest bigger piece."""
    c = mesh.vertices[mesh.faces].mean(1)
    counts = np.bincount(piece)
    big = [p for p in range(len(counts)) if counts[p] >= min_tris]
    centre = {p: c[piece == p][:, [0, 2]].mean(0) for p in range(len(counts)) if counts[p]}
    for p in range(len(counts)):
        if 0 < counts[p] < min_tris and big:
            q = min(big, key=lambda b: np.linalg.norm(centre[b] - centre[p]))
            piece[piece == p] = q
    _, piece = np.unique(piece, return_inverse=True)
    return piece


def write_glb(path, pieces, maps, base_color, roughness):
    """pieces: [(name, positions, normals, uvs, indices)]; maps: {'base': jpg, 'mr': jpg?, 'normal': jpg?} — one shared material."""
    blobs = []
    offset = 0
    views, accessors, meshes, nodes = [], [], [], []

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

    for name, pos, nor, uv, idx in pieces:
        a = len(accessors)
        accessors.append({'bufferView': add(pos.astype(np.float32), 34962), 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
                          'min': pos.min(0).tolist(), 'max': pos.max(0).tolist()})
        accessors.append({'bufferView': add(nor.astype(np.float32), 34962), 'componentType': 5126, 'count': len(nor), 'type': 'VEC3'})
        accessors.append({'bufferView': add(uv.astype(np.float32), 34962), 'componentType': 5126, 'count': len(uv), 'type': 'VEC2'})
        index_type = np.uint16 if len(pos) < 65536 else np.uint32
        accessors.append({'bufferView': add(idx.astype(index_type).ravel(), 34963), 'componentType': 5123 if index_type is np.uint16 else 5125,
                          'count': int(idx.size), 'type': 'SCALAR'})
        meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': a, 'NORMAL': a + 1, 'TEXCOORD_0': a + 2}, 'indices': a + 3, 'material': 0}]})
        nodes.append({'name': name, 'mesh': len(meshes) - 1})
    textures, images = [], []
    for data in maps.values():
        images.append({'bufferView': add(np.frombuffer(data, np.uint8)), 'mimeType': 'image/jpeg'})
        textures.append({'source': len(images) - 1, 'sampler': 0})
    slot = {k: i for i, k in enumerate(maps)}
    pbr = {'baseColorTexture': {'index': slot['base']}, 'baseColorFactor': base_color, 'metallicFactor': 0.0, 'roughnessFactor': roughness}
    if 'mr' in slot:
        # glTF metallic-roughness: G = roughness, B = metallic; the factors scale the texture.
        pbr.update(metallicRoughnessTexture={'index': slot['mr']}, metallicFactor=1.0, roughnessFactor=1.0)
    material = {'name': 'kit', 'pbrMetallicRoughness': pbr}
    if 'normal' in slot:
        material['normalTexture'] = {'index': slot['normal']}
    gltf = {
        'asset': {'version': '2.0', 'generator': 'lookdev-lab scripts/prepare-prop-kit.py'},
        'scene': 0,
        'scenes': [{'nodes': list(range(len(nodes)))}],
        'nodes': nodes,
        'meshes': meshes,
        'materials': [material],
        'textures': textures,
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


def contact_sheet(path, pieces, cols=5, cell=220):
    rows = (len(pieces) + cols - 1) // cols
    img = Image.new('RGB', (cols * cell, rows * cell), (40, 40, 40))
    draw = ImageDraw.Draw(img)
    for i, (name, pos, nor, uv, idx, colors) in enumerate(pieces):
        ox, oy = (i % cols) * cell, (i // cols) * cell
        tri = pos[idx]
        span = max(np.ptp(pos[:, 0]), np.ptp(pos[:, 1]), 1e-6)
        s = (cell - 30) / span
        order = np.argsort(-tri[:, :, 2].mean(1))  # back to front (camera on +z)
        for f in order:
            p = [(ox + cell / 2 + v[0] * s, oy + cell - 12 - v[1] * s) for v in tri[f]]
            c = tuple(int(255 * min(1, x)) for x in colors[f])
            draw.polygon(p, fill=c)
        size = np.ptp(pos, 0)
        draw.text((ox + 4, oy + 4), f'{name}  {size[0]:.2f}x{size[1]:.2f}x{size[2]:.2f} m', fill=(230, 220, 190))
    img.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet')
    ap.add_argument('out')
    ap.add_argument('--prefix', required=True)
    ap.add_argument('--human', type=float, default=1.8, help='height of the scale figure in metres')
    ap.add_argument('--height', type=float, help='no scale figure in the sheet: scale so the tallest piece is this many metres')
    ap.add_argument('--texture', type=int, default=2048)
    ap.add_argument('--names', default='', help='comma-separated suffixes per piece, in sheet order')
    ap.add_argument('--no-align', dest='align', action='store_false', help='keep the sheet orientation instead of turning each piece onto +x')
    ap.add_argument('--preview', help='contact sheet PNG')
    ap.add_argument('--layout', choices=['front', 'top', 'plan'], default='front', help='sheet laid out in rows by height (front), on the ground in rows (top), or anywhere on the ground (plan: footprints only)')
    ap.add_argument('--join', default='', help='merge pieces that belong together, e.g. "1+2,5+6" (numbers as printed without --join/--drop)')
    ap.add_argument('--drop', default='', help='comma-separated 1-based piece numbers to discard (e.g. a scale figure the generator flattened)')
    ap.add_argument('--merge-small', type=int, default=0, help='pieces with fewer triangles join the nearest bigger piece')
    ap.add_argument('--rows', type=int, default=0, help='force this many rows (sheet rows; small debris between rows otherwise adds rows)')
    ap.add_argument('--cuts', default='', help='extra cuts for touching pieces: "row:x1,x2;row:x" (sheet units, rows from the top, 0-based)')
    args = ap.parse_args()

    mesh = drop_slivers(load(args.sheet))
    cuts = {}
    for part in filter(None, args.cuts.split(';')):
        row, xs = part.split(':')
        cuts[int(row)] = [float(x) for x in xs.split(',')]
    piece = segment(mesh, cuts, args.layout, args.rows)
    if args.merge_small:
        piece = merge_small(mesh, piece, args.merge_small)
    colors = face_colors(mesh)
    if args.height:
        grey = []
        tallest = max(np.ptp(mesh.vertices[np.unique(mesh.faces[piece == p])][:, 1]) for p in range(piece.max() + 1))
        scale = args.height / tallest
        print(f'no scale figure: tallest piece {tallest:.3f} units -> {scale:.2f} m per unit')
    else:
        sat = np.array([(colors[piece == p].max(1) - colors[piece == p].min(1)).mean() for p in range(piece.max() + 1)])
        grey = np.where(sat <= 0.05)[0]
        if not len(grey):
            raise SystemExit(f'no grey scale figure found (lowest saturation {sat.min():.3f}); pass --height <metres> instead')
        human = max(grey, key=lambda p: np.ptp(mesh.vertices[np.unique(mesh.faces[piece == p])][:, 1]))
        grey = [p for p in grey if p == human or sat[p] <= 0.035]  # other grey figures; a greyish plant or rock stays
        if len(grey) > 1:
            print('extra grey figures removed:', [(int(p), round(float(sat[p]), 3), int((piece == p).sum())) for p in grey if p != human])
        hv = mesh.vertices[np.unique(mesh.faces[piece == human])]
        scale = args.human / np.ptp(hv[:, 1])
        print(f'scale figure: piece {human}, {np.ptp(hv[:, 1]):.3f} units tall -> {scale:.2f} m per unit')

    names = [n.strip() for n in args.names.split(',')] if args.names else []
    out, preview = [], []
    k = 0
    keep = [p for p in range(piece.max() + 1) if p not in grey]
    for group in filter(None, args.join.split(',')):  # "1+2": numbers as printed without --join
        ps = [keep[int(x) - 1] for x in group.split('+')]
        for q in ps[1:]:
            piece[piece == q] = ps[0]
    drop = {keep[int(x) - 1] for x in args.drop.split(',') if x.strip()}
    keep = [p for p in keep if p not in drop and (piece == p).any()]
    if args.height:  # tallest of the pieces that are kept (a dropped stray can be the tallest thing in the sheet)
        tallest = max(np.ptp(mesh.vertices[np.unique(mesh.faces[piece == p])][:, 1]) for p in keep)
        scale = args.height / tallest
        print(f'height: tallest kept piece {tallest:.3f} units -> {scale:.2f} m per unit')
    for p in keep:
        faces = mesh.faces[piece == p]
        used, inverse = np.unique(faces, return_inverse=True)
        pos = mesh.vertices[used] * scale
        nor = mesh.vertex_normals[used]
        if args.align:
            # Turn the piece about y so its longest horizontal direction runs along +x (pieces sit at angles
            # in the sheet; aligned pieces can be chained along a path by yaw alone).
            xz = pos[:, [0, 2]] - pos[:, [0, 2]].mean(0)
            evals, evecs = np.linalg.eigh(xz.T @ xz)
            ax = evecs[:, np.argmax(evals)]
            ang = np.arctan2(ax[1], ax[0])
            c, s = np.cos(ang), np.sin(ang)
            rot = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])  # rotation about y by +ang maps the axis onto +x
            pos = pos @ rot.T
            nor = nor @ rot.T
        pivot = np.array([(pos[:, 0].min() + pos[:, 0].max()) / 2, pos[:, 1].min(), (pos[:, 2].min() + pos[:, 2].max()) / 2])
        pos = pos - pivot
        uv = mesh.visual.uv[used].copy()
        uv[:, 1] = 1.0 - uv[:, 1]  # trimesh flips glTF's V on load (bottom-left origin); glTF wants top-left
        idx = inverse.reshape(-1, 3)
        name = f'{args.prefix}_{k + 1:02d}' + (f'_{names[k]}' if k < len(names) and names[k] else '')
        out.append((name, pos, nor, uv, idx))
        preview.append((name, pos, nor, uv, idx, colors[piece == p]))
        size = np.ptp(pos, 0)
        sx = mesh.vertices[used, 0]
        print(f'{name}: {len(idx)} tris, {size[0]:.2f} x {size[1]:.2f} x {size[2]:.2f} m  (sheet x {sx.min():.3f}..{sx.max():.3f}, z {mesh.vertices[used, 2].mean():+.3f})')
        k += 1

    mat = mesh.visual.material

    def jpeg(img, quality):
        img = img.convert('RGB')
        if max(img.size) > args.texture:
            img = img.resize((args.texture, args.texture), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=quality, optimize=True)
        return buf.getvalue()

    maps = {'base': jpeg(mat.baseColorTexture, 88)}
    if getattr(mat, 'metallicRoughnessTexture', None) is not None:
        maps['mr'] = jpeg(mat.metallicRoughnessTexture, 88)
    if getattr(mat, 'normalTexture', None) is not None:
        maps['normal'] = jpeg(mat.normalTexture, 95)
    print('maps:', ', '.join(f'{k} {len(v) / 1024:.0f} KB' for k, v in maps.items()))
    base = list(getattr(mat, 'baseColorFactor', None) if getattr(mat, 'baseColorFactor', None) is not None else [255, 255, 255, 255])
    base = [c / 255.0 if max(base) > 1 else c for c in base]
    write_glb(args.out, out, maps, base, 0.9)
    print(f'wrote {args.out} ({os.path.getsize(args.out) / 1024:.0f} KB, {len(out)} pieces)')
    if args.preview:
        contact_sheet(args.preview, preview)


if __name__ == '__main__':
    main()

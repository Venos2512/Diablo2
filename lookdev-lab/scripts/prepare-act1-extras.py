"""Act I extras for the lab: the 36 Tripo props of ashlar/3d/props/act1_extras_v1 (A15.1-A20.6) -> assets/act1-extras/act1-<id>-<name>.glb.

Each source GLB (Tripo: one mesh, ~7-10k triangles, 4096 px base colour + metallicRoughness + normal; longest side normalised to 1 m, pivot at the
bottom centre, Y up) is
  1. levelled where Tripo left it tilted (support plane of the convex hull; only A20.3 needs it: its slab is pitched head-up ~4.8 deg. The others
     were measured level within ~0.7 deg on their walls and flat on their bases, and turning those would only un-level a flat base),
  2. turned by a baked yaw so its front and long axis follow the Act I blockout frame (env/act1/blockout.js, interiorBlockout.js and the map parts):
     size [w, h, d] = local x, y, z, front = local +z. As in those shapes, the church's door gable faces -x (the west door), the boat's bow and the
     dock's lamp end point to +x, the irrigation channel's sluice gate is at +x. Small fine yaws square up models Tripo left a few degrees off
     (min-area rectangle of the footprint; PCA of the body for the sleepers),
  3. scaled UNIFORMLY to its real size, keyed on the dimension the concept states first (ashlar/art/act-01-environments-v2/README_VI.md section 3),
     measured on the bbox after the yaw (or on a height band where an appendage is not part of that dimension: the stall's width is its awning,
     not the cart shafts). A19.6 is keyed on the wall section width (keying on its window would make the wall 4.8 m wide),
  4. re-pivoted to the bottom centre (bbox centre in x / z, lowest point at y = 0),
  5. re-encoded like the dungeon props: base colour + normal as JPEG, 2048 px (1024 px for the three props whose longest side is <= 1.2 m: A19.1-A19.3,
     and for the TEX_1024 props: pieces of about 3-4 m or less seen from ~15 m by the ARPG camera, A15.3-A15.6, A16.2-A16.6, A17.4, A17.5,
     A18.1, A18.2, A18.5 (the whitewash wall, 6 m but plain), A19.4, A19.5, A20.5, A20.6; the landmarks keep 2048),
     constant roughness / metalness factors (the metallicRoughness map is dropped).
The transform is baked into the vertices with an identity node: the interior engine instances the first mesh's geometry directly.
Registered in src/assets/samples.json (kind "model", file "act1-extras/<id>.glb", source = the ashlar/3d folder) and credited in
THIRD_PARTY_LICENSES.md (scripts/check.mjs looks for every sample name there). Never edits the source GLBs.
MONSTERS adds static monsters from ashlar/3d/monsters the same way (P06 Poppy-Mound -> act1-p06-poppy-mound.glb: keyed on its width 2.5H = 4.5 m;
own samples.json credit and licence paragraph), so the Garden of Hush can show the stationary spawner as a prop.

Usage: python scripts/prepare-act1-extras.py [--only A15.1,A20.3,P06] [--report <path.json>] [--no-register]
  --report writes the measurements (dims after the yaw, key, triangles, sizes, light anchors, up-facing planes, footprint centre) for the fit table.
Idempotent: re-running rewrites the same files and entries.
"""
import io
import json
import os
import sys
import time

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
SRC = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', '3d', 'props', 'act1_extras_v1'))
OUT = os.path.join(ROOT, 'assets', 'act1-extras')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
ANCHOR = 'dungeon-prop-flint-boulders'  # the other ASHLAR Tripo props; the new lines go after it
SOURCE = 'ashlar/3d/props/act1_extras_v1'
CREDIT = ('Generated with Tripo (image to 3D, 4K PBR, ~10k triangles) from a Codex input image (concepts ashlar/art/act-01-environments-v2); levelled, '
          'turned to the Act I blockout frame, scaled to real size and re-encoded (2048 px JPEG for the landmarks; 1024 px for props up to 1.2 m and the '
          'TEX_1024 set of 3-4 m pieces) by scripts/prepare-act1-extras.py')

# (asset id, source folder, label, key: (axis, metres, band or None), yaw deg, level, roughness, metalness, extra)
# key band = (lo, hi) fraction of the height: the key axis is measured on the vertices in that band only.
# yaw = the baked turn (three.js rotation.y: +90 takes +z to +x). level: None | 'support'.
# extra: 'post' = (lo, hi[, side]) height band whose x/z centre is reported (the post of a gibbet / lamp post, off the bbox centre); side -1 keeps only
# the vertices on -x of the pivot (the gibbet's cage hangs into the band on +x).
ASSETS = [
    ('A15.1', 'A15_1_flint_church', 'Flint parish church (16 m long)', ('x', 16.0, None), -90, None, 0.9, 0.0, {}),
    ('A15.2', 'A15_2_forge', "Brannoc's forge (6 m wide)", ('x', 6.0, None), -2.8, None, 0.9, 0.0, {}),
    ('A15.3', 'A15_3_name_board', 'Sleeper name board (2.6 m wide)', ('x', 2.6, None), 0, None, 0.9, 0.0, {}),
    ('A15.4', 'A15_4_bell_frame', 'Mourning bell frame (3.4 m tall)', ('y', 3.4, None), -3.0, None, 0.85, 0.0, {}),
    ('A15.5', 'A15_5_grave_goods_stall', 'Grave-goods stall (3 m awning)', ('x', 3.0, (0.8, 1.0)), 0, None, 0.9, 0.0, {}),
    ('A15.6', 'A15_6_watch_post', "Osric's watch post (3 m footprint)", ('x', 3.0, None), 0, None, 0.9, 0.0, {}),
    ('A16.1', 'A16_1_yew', 'Churchyard yew (9 m tall)', ('y', 9.0, None), 0, None, 0.92, 0.0, {}),
    ('A16.2', 'A16_2_gibbet', 'Empty tarred gibbet (4.6 m tall)', ('y', 4.6, None), 0, None, 0.85, 0.0, {'post': (0.22, 0.32, -1)}),
    ('A16.3', 'A16_3_jar_candle_grave', 'Grave with jar candles (2.2 m long)', ('z', 2.2, None), 37.0, None, 0.9, 0.0, {}),
    ('A16.4', 'A16_4_fresh_grave', 'Fresh grave (2.4 m long)', ('z', 2.4, None), 0, None, 0.92, 0.0, {}),
    ('A16.5', 'A16_5_unquiet_grave', 'Unquiet grave (2.6 m long)', ('z', 2.6, None), 0, None, 0.9, 0.0, {}),
    ('A16.6', 'A16_6_sexton_lamp', "Sexton's lamp post (2.6 m tall)", ('y', 2.6, None), 0, None, 0.85, 0.0, {'post': (0.15, 0.35)}),
    ('A17.1', 'A17_1_leaning_stones', 'The leaning stones (4.6 m tall)', ('y', 4.6, None), 0, None, 0.92, 0.0, {}),
    ('A17.2', 'A17_2_drowned_bell_tower', 'Drowned bell tower (10 m above the water)', ('y', 10.0, None), 0, None, 0.9, 0.0, {'post': (0.0, 0.5)}),
    ('A17.3', 'A17_3_gentle_boat', 'Gentle House boat (7 m long)', ('x', 7.0, None), 180, None, 0.9, 0.0, {}),
    ('A17.4', 'A17_4_flooded_supper_table', 'Flooded supper table (2.4 m long)', ('x', 2.4, None), 0, None, 0.88, 0.0, {}),
    ('A17.5', 'A17_5_flooded_lace_window', 'Flooded lace window (2.2 m wall section)', ('x', 2.2, None), 0, None, 0.92, 0.0, {}),
    ('A17.6', 'A17_6_gentle_dock', 'Gentle House dock (6 m long)', ('x', 6.0, None), -90, None, 0.9, 0.0, {}),
    ('A18.1', 'A18_1_ox_cart', 'Abandoned ox cart (4 m with shafts)', ('z', 4.0, None), 0, None, 0.9, 0.0, {}),
    ('A18.2', 'A18_2_bed_clean_pillow', 'Bed with clean pillow (2 m long)', ('z', 2.0, None), 0, None, 0.92, 0.0, {}),
    ('A18.3', 'A18_3_delvings_mouth', 'Flint Delvings mouth (4 m wide)', ('x', 4.0, None), 0, None, 0.92, 0.0, {}),
    ('A18.4', 'A18_4_hospice_range', 'Hospice ward range (30 m long)', ('x', 30.0, None), 0, None, 0.88, 0.0, {}),
    ('A18.5', 'A18_5_hospice_wall_niche', 'Hospice wall niche (6 m wide)', ('x', 6.0, None), 0, None, 0.88, 0.0, {}),
    ('A18.6', 'A18_6_hilltop_steps', 'Hilltop steps (4 m wide)', ('x', 4.0, None), 0, None, 0.88, 0.0, {}),
    ('A19.1', 'A19_1_vase_flowers', 'Flowers in a vase (0.5 m tall)', ('y', 0.5, None), 0, None, 0.7, 0.0, {}),
    ('A19.2', 'A19_2_poppy_tea_tray', 'Poppy tea tray (0.5 m tray)', ('x', 0.5, None), 0, None, 0.75, 0.0, {}),
    ('A19.3', 'A19_3_window_chair', 'Window chair (1.2 m tall)', ('y', 1.2, None), -3.8, None, 0.9, 0.0, {}),
    ('A19.4', 'A19_4_linen_press', 'Linen press (1.9 m tall)', ('y', 1.9, None), 0, None, 0.9, 0.0, {}),
    ('A19.5', 'A19_5_linen_screen', 'Linen screen (1.8 m tall)', ('y', 1.8, None), 0, None, 0.92, 0.0, {}),
    ('A19.6', 'A19_6_tall_ward_window', 'Tall ward window (2.4 m wall section)', ('x', 2.4, None), 0, None, 0.88, 0.0, {}),
    ('A20.1', 'A20_1_sleeper_young_woman', 'Sleeper: young woman (2.1 m long)', ('z', 2.1, None), -3.8, None, 0.9, 0.0, {}),
    ('A20.2', 'A20_2_sleeper_old_man', 'Sleeper: old man (2.1 m long)', ('z', 2.1, None), -2.3, None, 0.9, 0.0, {}),
    ('A20.3', 'A20_3_sleeper_fisherman', 'Sleeper: fisherman (2.1 m long)', ('z', 2.1, None), -1.1, 'support', 0.9, 0.0, {}),
    ('A20.4', 'A20_4_sleeper_farm_woman', 'Sleeper: farm woman (2.1 m long)', ('z', 2.1, None), -3.6, None, 0.9, 0.0, {}),
    ('A20.5', 'A20_5_irrigation_channel', 'Irrigation channel (3 m long)', ('x', 3.0, None), 90, None, 0.85, 0.0, {}),
    ('A20.6', 'A20_6_harvest_table', 'Harvest table (2.6 m long)', ('x', 2.6, None), 0, None, 0.9, 0.0, {}),
]
SMALL = 1.2  # longest side (m) at or under which a prop gets 1024 px maps
# larger props that get 1024 px maps too (about 3-4 m or less, seen from ~15 m: ~32 MB of GPU memory saved each). The landmarks keep 2048:
# church A15.1, forge A15.2, yew A16.1, tower A17.2, boat A17.3, dock A17.6, Delvings mouth A18.3, hospice range A18.4, steps A18.6.
TEX_1024 = {'A15.3', 'A15.4', 'A15.5', 'A15.6', 'A16.2', 'A16.3', 'A16.4', 'A16.5', 'A16.6', 'A17.4', 'A17.5', 'A18.1', 'A18.2', 'A18.5',
            'A19.4', 'A19.5', 'A20.5', 'A20.6'}

# Static monsters from other ashlar/3d folders, prepared the same way (a stationary spawner needs no rig: it can stand in the map as a prop until the
# monster runtime takes models). (asset id, source GLB relative to ashlar/3d, sample id, label, then the ASSETS fields from key on). Own licence
# paragraph (MONSTER_TAG); the 36 entries above, their files, samples.json lines and paragraph stay byte-identical when these are added.
MONSTERS = [
    ('P06', 'monsters/P06_poppy_mound/P06_poppy_mound.glb', 'act1-p06-poppy-mound', 'Poppy-Mound (4.5 m wide, static spawner)', ('x', 4.5, None), 0, None, 0.9,
     0.0, {}),
]
MONSTER_TAG = 'act1-monsters-static-v1'
MONSTER_CREDIT = ('Generated with Tripo (image to 3D, 4K PBR) from a Codex input image after the ASHLAR monster concept (ashlar/art/map-01-concepts/monsters); '
                  'scaled to real size and re-encoded (2048 px JPEG) by scripts/prepare-act1-extras.py')
MONSTER_LICENSE = ('The ASHLAR Act I static monsters - {names} - are project models generated with Tripo (image to 3D) from Codex input images after the '
                   'ASHLAR monster concepts (`ashlar/art/map-01-concepts/monsters`, models in `ashlar/3d/monsters`), scaled to real size and re-encoded into '
                   '`assets/act1-extras/` by `scripts/prepare-act1-extras.py` (stationary monsters placed as static props, no rig); project-internal.')


def sample_id(folder):
    return 'act1-' + folder.lower().replace('_', '-')


def retry(fn, *a, **kw):
    for attempt in range(40):  # Windows: a watched file can be briefly locked by the dev server
        try:
            return fn(*a, **kw)
        except OSError:
            if attempt == 39:
                raise
            time.sleep(0.5)


def rot_align(a, b):
    """Rotation matrix taking unit vector a onto unit vector b."""
    v, c = np.cross(a, b), float(np.dot(a, b))
    k = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + k + k @ k / (1 + c)


def support_up(v):
    """Up vector of the support plane: the area-weighted normal of the convex hull's downward facets (within 12 deg of -Y)."""
    from scipy.spatial import ConvexHull
    h = ConvexHull(v)
    tri = v[h.simplices]
    area = np.linalg.norm(np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0]), axis=1) / 2
    down = h.equations[:, 1] < -np.cos(np.radians(12))
    n = -(h.equations[down, :3] * area[down, None]).sum(0)
    return n / np.linalg.norm(n)


def yaw_matrix(deg):
    t = np.radians(deg)
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])  # three.js rotation.y: (x, z) -> (x c + z s, -x s + z c)


def jpeg(img, size, quality):
    """A PIL image that remembers it is a JPEG: trimesh writes it as such."""
    b = io.BytesIO()
    img.convert('RGB').resize((size, size), Image.LANCZOS).save(b, 'JPEG', quality=quality)
    return Image.open(io.BytesIO(b.getvalue()))


def light_spots(mesh, uv, base, scale):
    """Clusters of glowing texels (flame / lamp colours: bright and warm) on the mesh, in the prepared frame. For the fit table's light hints."""
    from scipy.cluster.hierarchy import fcluster, linkage
    px = np.asarray(base.convert('RGB'), dtype=np.float32) / 255.0
    hgt, wid = px.shape[:2]
    fuv = uv[mesh.faces].mean(1)
    col = px[np.clip(((1 - fuv[:, 1]) * hgt).astype(int), 0, hgt - 1), np.clip((fuv[:, 0] * wid).astype(int), 0, wid - 1)]
    r, g, b = col[:, 0], col[:, 1], col[:, 2]
    hot = (r > 0.9) & (g > 0.55) & (b < 0.75 * g) & (r >= g)
    if hot.sum() < 3:
        return []
    c = mesh.triangles_center[hot]
    a = mesh.area_faces[hot]
    lab = fcluster(linkage(c, 'single'), t=0.2 * max(1.0, scale / 4), criterion='distance') if len(c) > 1 else np.array([1])
    spots = []
    for k in np.unique(lab):
        m = lab == k
        if a[m].sum() < 2e-4 * scale * scale:
            continue
        p = (c[m] * a[m, None]).sum(0) / a[m].sum()
        spots.append({'at': [round(float(x), 2) for x in p], 'area_m2': round(float(a[m].sum()), 4)})
    return sorted(spots, key=lambda s: -s['area_m2'])[:8]


def up_planes(mesh, top=3):
    """Heights (m) of the largest up-facing flat areas (decks, table tops, a terrace), with their share of the up-facing area."""
    n, a, c = mesh.face_normals, mesh.area_faces, mesh.triangles_center
    up = n[:, 1] > 0.94
    if not up.any():
        return []
    hi = float(c[:, 1].max())
    hist, edges = np.histogram(c[up, 1], bins=max(10, int(hi / 0.02)), range=(0, hi), weights=a[up])
    order = np.argsort(hist)[::-1][:top]
    return [[round(float((edges[i] + edges[i + 1]) / 2), 2), round(float(hist[i] / a[up].sum()), 2)] for i in order]


def prep(entry, report, monster=None):
    """monster = (source GLB relative to ashlar/3d, sample id) for a MONSTERS entry; None = an act1_extras_v1 folder."""
    import trimesh
    aid, folder, label, (kax, kval, band), yaw, level, rough, metal, extra = entry
    if monster:
        path = os.path.abspath(os.path.join(SRC, '..', '..', monster[0]))
    else:
        src = [f for f in os.listdir(os.path.join(SRC, folder)) if f.startswith('act1_extras_v1_') and f.endswith('.glb')]
        assert len(src) == 1, f'{folder}: expected one source GLB, found {src}'
        path = os.path.join(SRC, folder, src[0])
    scene = trimesh.load(path, force='scene')
    assert len(scene.geometry) == 1, f'{folder}: expected one mesh'
    g = list(scene.geometry.values())[0]
    node_t = scene.graph.get(scene.graph.nodes_geometry[0])[0]
    v = trimesh.transform_points(g.vertices, node_t)
    nrm = np.asarray(g.vertex_normals) @ node_t[:3, :3].T
    R = np.eye(3)
    tilt = 0.0
    if level == 'support':
        up = support_up(v)
        tilt = float(np.degrees(np.arccos(np.clip(up[1], -1, 1))))
        R = rot_align(up, np.array([0.0, 1.0, 0.0]))
    R = yaw_matrix(yaw) @ R
    v = v @ R.T
    nrm = nrm @ R.T
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12
    ax = 'xyz'.index(kax)
    sel = v
    if band:
        h0, h1 = v[:, 1].min(), v[:, 1].max()
        sel = v[(v[:, 1] >= h0 + band[0] * (h1 - h0)) & (v[:, 1] <= h0 + band[1] * (h1 - h0))]
    measured = float(np.ptp(sel[:, ax]))
    scale = kval / measured
    v = v * scale
    lo, hi = v.min(0), v.max(0)
    v -= np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
    dims = v.max(0) - v.min(0)
    tex = 1024 if dims.max() <= SMALL + 1e-6 or aid in TEX_1024 else 2048
    m = g.visual.material
    base, normal = m.baseColorTexture, m.normalTexture
    assert base is not None and normal is not None, f'{folder}: missing base colour or normal map'
    sid = monster[1] if monster else sample_id(folder)
    mat = trimesh.visual.material.PBRMaterial(name=sid, baseColorTexture=jpeg(base, tex, 86), normalTexture=jpeg(normal, tex, 90),
                                              roughnessFactor=rough, metallicFactor=metal)
    out = trimesh.Trimesh(vertices=v, faces=g.faces, vertex_normals=nrm, visual=trimesh.visual.TextureVisuals(uv=g.visual.uv, material=mat), process=False)
    data = trimesh.Scene({sid: out}).export(file_type='glb')
    retry(lambda: open(os.path.join(OUT, f'{sid}.glb'), 'wb').write(data))
    rec = {'id': aid, 'sample': sid, 'folder': folder, 'label': label, 'tex': tex, 'tris': int(len(out.faces)), 'bytes': len(data),
           'dims': [round(float(x), 3) for x in dims], 'key': [kax, kval, band], 'scale': round(scale, 4), 'yaw': yaw, 'tilt_fixed': round(tilt, 2),
           'rough': rough, 'metal': metal, 'up_planes': up_planes(out), 'lights': light_spots(out, np.asarray(g.visual.uv), base, float(dims.max()))}
    low = v[v[:, 1] <= 0.3 * dims[1]]
    rec['foot_centre'] = [round(float((low[:, 0].min() + low[:, 0].max()) / 2), 2), round(float((low[:, 2].min() + low[:, 2].max()) / 2), 2)]
    if 'post' in extra:
        b0, b1, *side = extra['post']
        p = v[(v[:, 1] >= b0 * dims[1]) & (v[:, 1] <= b1 * dims[1])]
        if side:
            p = p[np.sign(p[:, 0]) == side[0]]
        rec['post_centre'] = [round(float((p[:, 0].min() + p[:, 0].max()) / 2), 2), round(float((p[:, 2].min() + p[:, 2].max()) / 2), 2)]
    report.append(rec)
    print(f"  {sid}.glb: {rec['tris']} tris, {dims[0]:.2f} x {dims[1]:.2f} x {dims[2]:.2f} m (w x h x d), key {kax} {kval} m, yaw {yaw}, "
          f"{'level %.1f deg, ' % tilt if level else ''}{tex} px, {len(data) / 1e6:.2f} MB")
    if monster:
        return (sid, f'{aid} {label} · Tripo monster as a static prop (GLB, real size, pivot bottom centre) · Act I extras', f'act1-extras/{sid}.glb',
                'ashlar/3d/' + os.path.dirname(monster[0]))
    return (sid, f'{aid} {label} · Tripo prop (GLB, real size, pivot bottom centre) · Act I extras', f'act1-extras/{sid}.glb', f'{SOURCE}/{folder}')


def register(entries):
    """entries = [(id, name, file, source[, credit])]. Replace the entries of these ids in place, or insert after ANCHOR; every other line stays byte-identical."""
    lines = [f'    {{"id": "{i}", "name": {json.dumps(name, ensure_ascii=False)}, "kind": "model", "file": "{file}", '
             f'"license": "Project-internal", "credit": "{rest[0] if rest else CREDIT}", "source": "{source}"}},' for i, name, file, source, *rest in entries]
    ids = {e[0] for e in entries}
    for attempt in range(40):  # read and write back in one go: other threads edit this file too
        raw = open(MANIFEST, 'rb').read().decode('utf-8')
        nl = '\r\n' if '\r\n' in raw else '\n'
        text = raw.split(nl)
        mine = lambda l: any(f'"id": "{i}"' in l for i in ids)
        pos = next((k for k, l in enumerate(text) if mine(l)), None)
        kept = [l for l in text if not mine(l)]
        if pos is None:
            pos = next((k for k, l in enumerate(kept) if f'"id": "{ANCHOR}"' in l), None)
            pos = max(k for k, l in enumerate(kept) if l.strip() == ']') if pos is None else pos + 1
        end = max(k for k, l in enumerate(kept) if l.strip() == ']')
        block = list(lines)
        if pos >= end or not any(kept[k].lstrip().startswith('{"id"') for k in range(pos, end)):
            # the block ends the list: its last line has no comma, and the line before it needs one
            block[-1] = block[-1].rstrip(',')
            prev = max(k for k in range(pos) if kept[k].lstrip().startswith('{"id"'))
            if not kept[prev].rstrip().endswith(','):
                kept[prev] = kept[prev].rstrip() + ','
        kept[pos:pos] = block
        data = nl.join(kept)
        parsed = json.loads(data)  # never write a broken manifest
        assert sum(1 for a in parsed['assets'] if a['id'] in ids) == len(ids)
        if data == raw:  # nothing to write: never truncate a file other threads edit (and a watched file can refuse it on Windows)
            print(f'{len(lines)} samples.json entries unchanged')
            return
        try:
            with open(MANIFEST, 'wb') as f:
                f.write(data.encode('utf-8'))
            break
        except OSError:
            if attempt == 39:
                raise
            time.sleep(0.5)
    print(f'{len(lines)} samples.json entries written')


def license_note(entries, tag='act1-extras-v1', text=None):
    """One marker-delimited paragraph in THIRD_PARTY_LICENSES.md naming every entry (scripts/check.mjs warns for names it cannot find there).
    text = the paragraph with {names} for the entry names (None: the act1-extras-v1 wording). A new paragraph goes after the act1-extras-v1 one."""
    path = os.path.join(ROOT, 'THIRD_PARTY_LICENSES.md')
    a, b = f'<!-- {tag}:start -->', f'<!-- {tag}:end -->'
    names = ', '.join(e[1] for e in entries)
    if text is None:
        para = (a + '\nThe ASHLAR Act I extras - ' + names + ' - are project props generated with Tripo (image to 3D) from Codex '
                'input images after the Act I environment concepts (`ashlar/art/act-01-environments-v2`, models in `ashlar/3d/props/act1_extras_v1`), levelled, '
                'turned, scaled to real size and re-encoded into `assets/act1-extras/` by `scripts/prepare-act1-extras.py`; project-internal.\n' + b)
    else:
        para = a + '\n' + text.format(names=names) + '\n' + b
    for attempt in range(40):
        try:
            text = old = open(path, encoding='utf-8', newline='').read()
            nl = '\r\n' if '\r\n' in text else '\n'
            p = para.replace('\n', nl)
            if a in text:
                head, rest = text.split(a, 1)
                text = head + p + rest.split(b, 1)[1]
            elif tag != 'act1-extras-v1' and '<!-- act1-extras-v1:end -->' in text:
                after = '<!-- act1-extras-v1:end -->'
                text = text.replace(after, after + nl + nl + p, 1)
            else:
                anchor = 'The same credits are shown in the app'
                text = text.replace(anchor, p + nl + nl + anchor, 1) if anchor in text else text.rstrip() + nl + nl + p + nl
            if text == old:
                return
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
            return
        except OSError:
            if attempt == 39:
                raise
            time.sleep(0.5)


def main():
    args = sys.argv[1:]
    opt = lambda name, default: (args.pop(args.index(name) + 1), args.remove(name))[0] if name in args else default
    only = opt('--only', '')
    report_path = opt('--report', '')
    no_register = '--no-register' in args
    todo = [e for e in ASSETS if not only or e[0] in only.split(',')]
    todo_monsters = [m for m in MONSTERS if not only or m[0] in only.split(',')]
    os.makedirs(OUT, exist_ok=True)
    report, entries, monster_entries = [], [], []
    for e in todo:
        entries.append(prep(e, report))
    for aid, rel, sid, label, *rest in todo_monsters:
        monster_entries.append(prep((aid, os.path.basename(os.path.dirname(rel)), label, *rest), report, monster=(rel, sid)) + (MONSTER_CREDIT,))
    if report_path:
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=1, ensure_ascii=False)
    if not no_register:
        if only:  # keep the full list registered: rebuild the entry tuples of the untouched assets from the table
            done = {e[0] for e in entries + monster_entries}
            entries = [x for x in ([(sample_id(e[1]), f'{e[0]} {e[2]} · Tripo prop (GLB, real size, pivot bottom centre) · Act I extras',
                                     f'act1-extras/{sample_id(e[1])}.glb', f'{SOURCE}/{e[1]}') for e in ASSETS]) if x[0] in done or os.path.exists(os.path.join(OUT, f'{x[0]}.glb'))]
            monster_entries = [x for x in ([(sid, f'{aid} {label} · Tripo monster as a static prop (GLB, real size, pivot bottom centre) · Act I extras',
                                             f'act1-extras/{sid}.glb', 'ashlar/3d/' + os.path.dirname(rel), MONSTER_CREDIT) for aid, rel, sid, label, *_ in MONSTERS])
                               if x[0] in done or os.path.exists(os.path.join(OUT, f'{x[0]}.glb'))]
        register(entries + monster_entries)  # the monster lines follow the 36 (A20.6)
        license_note(entries)
        if monster_entries:
            license_note(monster_entries, MONSTER_TAG, MONSTER_LICENSE)
    small = [r['sample'] for r in report if r['tex'] == 1024]
    print(f'1024 px maps ({len(small)}): ' + ', '.join(small))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'assets/act1-extras: {len(os.listdir(OUT))} files, {total / 1048576:.1f} MB')


if __name__ == '__main__':
    main()

"""Class-select hands for the lab (scene choiceHands): the three Tripo hands of ashlar/3d/heroes/_hands_v1 -> assets/choice-hands/choice-hand-<id>.glb,
and the ossuary wall tile of ashlar/art/textures/wall-ossuary-v1 -> assets/choice-hands/choice-wall-a{,-n,-h}.webp.

Each source GLB (Tripo: ONE mesh, ~10k triangles, 4096 px base colour + metallicRoughness + normal, longest side normalised to 1 m along z, pivot at the bottom,
static, no skin; the forearm is tilted in the file, the hand droops or rises with it) is
  1. turned so the SLEEVE end sits at -z and the fingertips at +z. The sleeve end is the end whose last 6 % of the length has the larger MIN(x extent, y extent)
     (a thick cloth tube, 0.15-0.22 m of the 1 m model) against the fingertips (five thin lobes, 0.05-0.11 m): FL / OS / BR all have it at -z already (checked on
     the probe views of tmp/choice-hands/probe.png and ashlar/3d/heroes/_hands_v1/*/_shots/final_views.png); the script turns the model 180 deg about y if not.
  2. levelled: the forearm axis is the least-squares line through the bbox centres of the vertices in 11 z-bins over a per-hand span (FIT in HANDS: the closed rounded
     sleeve end and the cuffs throw off the section centres, so each hand fits only the stretch where its forearm is a clean tube; a principal-axis fit of the
     sleeve third was tried and was worse: 38-44 deg); the model is rotated so that axis is +z (minimal rotation). The hand keeps its own wrist bend.
  3. rolled about z so the palm plane is level and the BACK of the hand faces +y (the canonical frame of the scene: a palm-up pose is a 180 deg roll in the scene's
     slot table, not baked here). The palm normal is the smallest-variance eigenvector of the vertices between 66 % and 94 % of the length (palm + knuckles; the
     fingers curl and would tilt it); its sign comes from PALM_UP (True when the source had the palm toward +y: FL, from final_views.png where the palm faces up).
  4. scaled UNIFORMLY so the length along z is 0.45 m (forearm + hand, as the brief states ~45 cm), and re-pivoted at the centre of the sleeve end: origin = the
     axis point at the sleeve end, +z toward the fingers, +y the back of the hand.
  5. given a sleeve extension: the sleeve is a closed cloth stub, so an elliptic tube (the bounding ellipse of the 3rd-97th percentile of the sleeve vertices inside the per-hand band of
     HANDS, x 0.985, tapering to 0.9) continues 0.65 m behind it and ends in a cap. The scene embeds the arm in the wall through this tube and slides the arm out of it. The tube is a
     second primitive coloured by VERTEX COLOURS measured per angle from the real sleeve texels of the band (median of the 8 nearest vertices, linear light), darkening to 22 % toward
     the back; no texture, so no tangent frame is needed on it.
  6. re-encoded: base colour + normal as JPEG 2048 px (the lab's kit size; memory: 1024 px Tripo atlases looked blurry), constant roughness / metalness factors
     (the metallicRoughness map is dropped).
Wrist positions (fraction of the length, read off the final_views of each hand where the cuff ends and the palm starts) are in WRIST below and printed with the report; the
scene (src/env/choiceHands.js HANDS) repeats them in metres: that is where the wrist pivot of the reach animation sits.

The wall tiles A and B (albedo / OpenGL normal / height, 1024 px, periodic, ~5 skulls across = ~0.9-1.0 m; the scene mixes them in patches) are re-encoded as WebP (what the lab's other texture samples are).
FRAME CONVENTION = THE RIG'S: origin at the centre of the sleeve end, +z toward the fingertips, +y the back of the hand, x across. The finger rig that will be added in Blender
(GLB with a skin) follows it; the bone names and axes the scene drives procedurally are documented at FINGER_BONES / FINGER_AXES in src/env/choiceHands.js and in
docs/HUONG_DAN.md section 7m. This script keeps writing static meshes: re-run it on a rigged source only after teaching it to keep the skin (it does not today).
Registered in src/assets/samples.json (kind "model" / "texture") and credited in THIRD_PARTY_LICENSES.md (scripts/check.mjs looks for every sample name there).
Never edits the sources. Idempotent.

Usage: python scripts/prepare-choice-hands.py [--no-register] [--preview <dir>]
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
REPO = os.path.abspath(os.path.join(ROOT, '..'))
SRC = os.path.join(REPO, 'ashlar', '3d', 'heroes', '_hands_v1')
WALL_SRC = os.path.join(REPO, 'ashlar', 'art', 'textures', 'wall-ossuary-v1')
OUT = os.path.join(ROOT, 'assets', 'choice-hands')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
LENGTH = 0.45  # m, sleeve end to fingertips
EXT_LEN = 0.6  # m, the sleeve extension behind the sleeve end
TEX = 2048
SOURCE_REL = 'ashlar/3d/heroes/_hands_v1'
CREDIT = ('Generated with Tripo (image to 3D, 4K PBR, ~10k triangles) from a Codex input image after the ASHLAR class-select key art '
          '(ashlar/art/heroes/_shared/choice_hands); levelled on its forearm axis, rolled back-of-hand up, scaled to 0.45 m, given a sleeve extension '
          'and re-encoded (2048 px JPEG) by scripts/prepare-choice-hands.py')
WALL_CREDIT = ('Generated with Codex image generation (ashlar/art/textures/wall-ossuary-v1: periodic skull-and-bone wall tile, OpenGL normal and height '
               'derived from it), re-encoded as WebP by scripts/prepare-choice-hands.py')

# (id, source folder, palm_up in the source, wrist fraction of the length, band = z range (m from the sleeve end) where the sleeve is a full round tube, fit = span fractions from the sleeve end whose section centres give the forearm axis, label)
HANDS = [
    ('fl', 'H2_FL_hand', True, 0.60, (0.10, 0.19), (0.20, 0.40), 'Flagellant · palm up, red sleeve, chain cuff'),
    ('os', 'H3_OS_hand', False, 0.60, (0.02, 0.14), (0.04, 0.36), 'Ossuarist · back of hand, navy sleeve, bone brace'),
    ('br', 'H4_BR_hand', False, 0.58, (0.0, 0.14), (0.10, 0.40), 'Brinecaller · back of hand, teal sleeve, shell bracelet'),
]
WALL = [  # (sample id, source file, label, mode)
    ('choice-wall-a', 'albedo1024/W_skull_wall_a.png', 'ASHLAR ossuary skull wall · tile A (albedo)', 'albedo'),
    ('choice-wall-a-n', 'normal1024/W_skull_wall_a.png', 'ASHLAR ossuary skull wall · tile A (normal, OpenGL)', 'normal'),
    ('choice-wall-a-h', 'height1024/W_skull_wall_a.png', 'ASHLAR ossuary skull wall · tile A (height)', 'height'),
    ('choice-wall-b', 'albedo1024/W_skull_wall_b.png', 'ASHLAR ossuary skull wall · tile B (albedo)', 'albedo'),
    ('choice-wall-b-n', 'normal1024/W_skull_wall_b.png', 'ASHLAR ossuary skull wall · tile B (normal, OpenGL)', 'normal'),
    ('choice-wall-b-h', 'height1024/W_skull_wall_b.png', 'ASHLAR ossuary skull wall · tile B (height)', 'height'),
]
ANCHOR_TAG = 'choice-hands-v1'


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


def rot_z(deg):
    t = np.radians(deg)
    c, s = np.cos(t), np.sin(t)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def jpeg(img, size, quality):
    """A PIL image that remembers it is a JPEG: trimesh writes it as such."""
    b = io.BytesIO()
    img.convert('RGB').resize((size, size), Image.LANCZOS).save(b, 'JPEG', quality=quality)
    return Image.open(io.BytesIO(b.getvalue()))


def band_extent(v, lo, hi):
    q = v[(v[:, 2] >= lo) & (v[:, 2] <= hi)]
    return min(np.ptp(q[:, 0]), np.ptp(q[:, 1])) if len(q) else 0.0


def prep(entry, report):
    import trimesh
    hid, folder, palm_up, wrist, band, fit, label = entry
    path = os.path.join(SRC, folder, f'choice_hands_{folder}.glb')
    scene = trimesh.load(path, force='scene')
    assert len(scene.geometry) == 1, f'{folder}: expected one mesh'
    g = list(scene.geometry.values())[0]
    node_t = scene.graph.get(scene.graph.nodes_geometry[0])[0]
    v = trimesh.transform_points(g.vertices, node_t)
    nrm = np.asarray(g.vertex_normals) @ node_t[:3, :3].T
    # 1. sleeve end at -z
    z0, z1 = v[:, 2].min(), v[:, 2].max()
    span = z1 - z0
    lo_ext, hi_ext = band_extent(v, z0, z0 + 0.06 * span), band_extent(v, z1 - 0.06 * span, z1)
    turned = hi_ext > lo_ext
    R = np.diag([-1.0, 1.0, -1.0]) if turned else np.eye(3)  # 180 deg about y
    v, nrm = v @ R.T, nrm @ R.T
    z0 = v[:, 2].min()
    # 2. the forearm axis through the sleeve cross-section centres, turned onto +z
    pts = []
    for lo, hi in zip(np.linspace(fit[0], fit[1], 12)[:-1], np.linspace(fit[0], fit[1], 12)[1:]):
        q = v[(v[:, 2] >= z0 + lo * span) & (v[:, 2] < z0 + hi * span)]
        if len(q) > 8:
            pts.append([(q[:, 0].min() + q[:, 0].max()) / 2, (q[:, 1].min() + q[:, 1].max()) / 2, z0 + (lo + hi) / 2 * span])
    pts = np.array(pts)
    kx, ky = np.polyfit(pts[:, 2], pts[:, 0], 1), np.polyfit(pts[:, 2], pts[:, 1], 1)
    axis = np.array([kx[0], ky[0], 1.0])
    axis /= np.linalg.norm(axis)
    tilt = float(np.degrees(np.arccos(axis[2])))
    A = rot_align(axis, np.array([0.0, 0.0, 1.0]))
    c0 = A @ np.array([kx[1] + kx[0] * z0, ky[1] + ky[0] * z0, z0])  # the axis point at the sleeve end (z = z0), after the turn
    v, nrm = v @ A.T, nrm @ A.T
    # 3. roll: the palm plane level, the back of the hand toward +y
    zmin, zmax = v[:, 2].min(), v[:, 2].max()
    ln = zmax - zmin
    hand = v[(v[:, 2] >= zmin + 0.66 * ln) & (v[:, 2] <= zmin + 0.94 * ln)]
    w, vec = np.linalg.eigh(np.cov((hand - hand.mean(0)).T))
    n = vec[:, 0]  # smallest variance: the palm normal (either sign)
    # which sign is the palm: in the file FL's palm faced +y (palm_up), OS / BR showed the back at +y; follow that side through the same turn and levelling
    side = A @ (R @ np.array([0.0, 1.0 if palm_up else -1.0, 0.0]))
    if np.dot(n, side) < 0:
        n = -n
    ang = np.degrees(np.arctan2(n[1], n[0]))  # angle of the palm normal in the xy plane
    roll = -90.0 - ang  # rotate so the palm normal points -y, the back of the hand +y
    Rz = rot_z(roll)
    v, nrm = v @ Rz.T, nrm @ Rz.T
    c0 = Rz @ c0
    # 4. scale to 0.45 m, pivot at the sleeve end centre
    zmin, zmax = v[:, 2].min(), v[:, 2].max()
    scale = LENGTH / (zmax - zmin)
    v = (v - np.array([c0[0], c0[1], zmin])) * scale
    dims = v.max(0) - v.min(0)
    m = g.visual.material
    base, normal = m.baseColorTexture, m.normalTexture
    assert base is not None and normal is not None, f'{folder}: missing base colour or normal map'
    sid = f'choice-hand-{hid}'
    mat = trimesh.visual.material.PBRMaterial(name=sid, baseColorTexture=jpeg(base, TEX, 86), normalTexture=jpeg(normal, TEX, 90), roughnessFactor=0.78, metallicFactor=0.0)
    body = trimesh.Trimesh(vertices=v, faces=g.faces, vertex_normals=nrm, visual=trimesh.visual.TextureVisuals(uv=g.visual.uv, material=mat), process=False)
    # 5. the sleeve extension. Cross-section: the axis-aligned ellipse that bounds the 3rd..97th percentile of the sleeve vertices inside the per-hand band (centre = the middle of
    # that range, so a sleeve that is not exactly on the fitted axis still gets a matching tube); colour: PER ANGLE, the real texels of the sleeve vertices of the band (nearest
    # angles, averaged in linear light) written as vertex colours, fading to 22 % toward the back so the part that lives in the wall is dark and the joint with the textured
    # sleeve has the colour of the sleeve at that very place (measured, not guessed)
    sec = v[(v[:, 2] >= band[0]) & (v[:, 2] <= band[1])]
    x3, x97 = np.percentile(sec[:, 0], [3, 97])
    y3, y97 = np.percentile(sec[:, 1], [3, 97])
    cx, cy = (x3 + x97) / 2, (y3 + y97) / 2
    ax, ay = (x97 - x3) / 2 * 0.985, (y97 - y3) / 2 * 0.985
    uvp = np.asarray(g.visual.uv)
    px = np.asarray(base.convert('RGB').resize((512, 512)), dtype=np.float32) / 255.0
    col = px[np.clip(((1 - uvp[:, 1]) * 511).astype(int), 0, 511), np.clip((uvp[:, 0] * 511).astype(int), 0, 511)] ** 2.2  # linear
    in_band = (v[:, 2] >= band[0]) & (v[:, 2] <= band[1])
    band_ang = np.arctan2(v[in_band][:, 1] - cy, v[in_band][:, 0] - cx)
    band_col = col[in_band]
    mean_col = np.median(band_col, axis=0)
    seg, ring = 12, 40
    zs = np.linspace(0.035, -EXT_LEN, seg + 1)
    ring_col = []
    for j in range(ring):
        t = 2 * np.pi * j / ring - np.pi
        d = np.abs((band_ang - t + np.pi) % (2 * np.pi) - np.pi)
        pick = np.argsort(d)[:8]
        ring_col.append(np.median(band_col[pick], axis=0))
    ring_col = np.array(ring_col)
    # smooth round the ring (the nearest vertices are noisy)
    ring_col = (np.roll(ring_col, 1, 0) + 2 * ring_col + np.roll(ring_col, -1, 0)) / 4
    tv, tf, tn, tc = [], [], [], []
    for k, z in enumerate(zs):
        f = 1.0 - 0.1 * (k / seg)  # taper to 0.9
        fade = 1.0 - 0.78 * float(np.clip((0.035 - z) / 0.26, 0, 1))
        for j in range(ring):
            t = 2 * np.pi * j / ring
            tv.append([cx + ax * f * np.cos(t), cy + ay * f * np.sin(t), z])
            nv = np.array([np.cos(t) / ax, np.sin(t) / ay, 0.0])
            tn.append(nv / np.linalg.norm(nv))
            # ring j is at angle t in (-pi, pi]; ring_col was sampled at angle 2*pi*j/ring - pi: shift by half a turn
            tc.append(ring_col[(j + ring // 2) % ring] * fade)
    for k in range(seg):
        for j in range(ring):
            a_, b_ = k * ring + j, k * ring + (j + 1) % ring
            c_, d_ = (k + 1) * ring + j, (k + 1) * ring + (j + 1) % ring
            tf += [[a_, b_, d_], [a_, d_, c_]]  # outward (the ring runs ccw seen from +z, rows run toward -z)
    end = len(tv)
    tv.append([cx, cy, zs[-1]])
    tn.append([0, 0, -1.0])
    tc.append(ring_col.mean(0) * 0.22)
    for j in range(ring):
        a_, b_ = seg * ring + j, seg * ring + (j + 1) % ring
        tf.append([a_, end, b_])
    tube = trimesh.Trimesh(vertices=np.array(tv), faces=np.array(tf), vertex_normals=np.array(tn), process=False)
    vc = np.clip(np.array(tc), 0, 1)
    tube.visual = trimesh.visual.ColorVisuals(mesh=tube, vertex_colors=np.concatenate([(vc * 255).astype(np.uint8), np.full((len(vc), 1), 255, np.uint8)], axis=1))
    if np.dot(np.cross(tube.vertices[tube.faces[0, 1]] - tube.vertices[tube.faces[0, 0]], tube.vertices[tube.faces[0, 2]] - tube.vertices[tube.faces[0, 0]]), tube.face_normals[0]) < 0:
        tube.faces = tube.faces[:, ::-1]
    # outward check on the side wall: the face normal must point away from the axis
    f0 = tube.faces[0]
    ctr = tube.vertices[f0].mean(0)
    if np.dot(tube.face_normals[0], [ctr[0] - cx, ctr[1] - cy, 0]) < 0:
        tube.faces = tube.faces[:, ::-1]
    data = trimesh.Scene({'hand': body, 'sleeve_ext': tube}).export(file_type='glb')
    retry(lambda: open(os.path.join(OUT, f'{sid}.glb'), 'wb').write(data))
    rec = {'id': hid, 'sample': sid, 'folder': folder, 'label': label, 'turned': bool(turned), 'axis_tilt_deg': round(tilt, 1), 'roll_deg': round(roll % 360, 1),
           'palm_up_source': palm_up, 'dims': [round(float(x), 3) for x in dims], 'scale': round(float(scale), 4), 'tris': int(len(body.faces)), 'bytes': len(data),
           'wrist_m': round(wrist * LENGTH, 3), 'sleeve_ellipse_m': [round(float(ax), 3), round(float(ay), 3)], 'sleeve_centre': [round(float(cx), 3), round(float(cy), 3)],
           'tube_colour_linear_median': [round(float(x), 3) for x in mean_col]}
    report.append(rec)
    print(f"  {sid}.glb: {rec['tris']} tris, {dims[0]:.3f} x {dims[1]:.3f} x {dims[2]:.3f} m (w x h x l), turned={turned}, axis tilt {tilt:.1f} deg, roll {roll % 360:.0f} deg, "
          f"sleeve ellipse {ax:.3f} x {ay:.3f} m, {len(data) / 1e6:.2f} MB")
    return (sid, f'{hid.upper()} {label} · class-select hand (GLB, 0.45 m, pivot sleeve end, +z fingers, +y back of hand, sleeve extension)', 'model', f'choice-hands/{sid}.glb', f'{SOURCE_REL}/{folder}'), body, tube


def wall_textures():
    entries = []
    for sid, rel, label, mode in WALL:
        img = Image.open(os.path.join(WALL_SRC, rel))
        out = os.path.join(OUT, f'{sid}.webp')
        if mode == 'height':
            img = img.convert('L')
        else:
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, 'WEBP', quality=94 if mode != 'albedo' else 90, method=6)
        retry(lambda: open(out, 'wb').write(buf.getvalue()))
        print(f'  {sid}.webp: {img.size[0]} px, {len(buf.getvalue()) / 1e3:.0f} KB')
        entries.append((sid, label, 'texture', f'choice-hands/{sid}.webp', 'ashlar/art/textures/wall-ossuary-v1', WALL_CREDIT))
    return entries


def register(entries):
    """entries = [(id, name, kind, file, source[, credit])]. Replace the entries of these ids in place, or append before the closing bracket; every other line stays byte-identical."""
    ids = {e[0] for e in entries}
    lines = [f'    {{"id": "{i}", "name": {json.dumps(name, ensure_ascii=False)}, "kind": "{kind}", "file": "{file}", "license": "Project-internal", '
             f'"credit": {json.dumps(rest[0] if rest else CREDIT, ensure_ascii=False)}, "source": "{source}"}},' for i, name, kind, file, source, *rest in entries]
    for attempt in range(40):  # read and write back in one go: other threads edit this file too
        raw = open(MANIFEST, 'rb').read().decode('utf-8')
        nl = '\r\n' if '\r\n' in raw else '\n'
        text = raw.split(nl)
        mine = lambda l: any(f'"id": "{i}"' in l for i in ids)
        pos = next((k for k, l in enumerate(text) if mine(l)), None)
        kept = [l for l in text if not mine(l)]
        end = max(k for k, l in enumerate(kept) if l.strip() == ']')
        pos = end if pos is None else pos
        block = list(lines)
        if pos >= end:  # the block ends the list: its last line has no comma, and the line before it needs one
            block[-1] = block[-1].rstrip(',')
            prev = max(k for k in range(pos) if kept[k].lstrip().startswith('{"id"'))
            if not kept[prev].rstrip().endswith(','):
                kept[prev] = kept[prev].rstrip() + ','
        kept[pos:pos] = block
        data = nl.join(kept)
        parsed = json.loads(data)  # never write a broken manifest
        assert sum(1 for a in parsed['assets'] if a['id'] in ids) == len(ids)
        if data == raw:
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


def license_note(names):
    path = os.path.join(ROOT, 'THIRD_PARTY_LICENSES.md')
    a, b = f'<!-- {ANCHOR_TAG}:start -->', f'<!-- {ANCHOR_TAG}:end -->'
    para = (a + '\nThe ASHLAR class-select scene - ' + ', '.join(names) + ' - uses project hand models generated with Tripo (image to 3D) from Codex input images '
            '(`ashlar/art/heroes/_shared/choice_hands`, models in `ashlar/3d/heroes/_hands_v1`) and the ossuary skull-wall tile generated with Codex '
            '(`ashlar/art/textures/wall-ossuary-v1`), levelled, scaled, given a sleeve extension and re-encoded into `assets/choice-hands/` by '
            '`scripts/prepare-choice-hands.py`; project-internal.\n' + b)
    for attempt in range(40):
        try:
            text = old = open(path, encoding='utf-8', newline='').read()
            nl = '\r\n' if '\r\n' in text else '\n'
            p = para.replace('\n', nl)
            if a in text:
                head, rest = text.split(a, 1)
                text = head + p + rest.split(b, 1)[1]
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


def preview(path, items):
    """Three orthographic views per hand (coloured vertices) for the QA of the levelling: side (z right, y up), top (z right, x up), end (x, y)."""
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(len(items), 3, figsize=(15, 4.2 * len(items)))
    for r, (sid, body, tube) in enumerate(items):
        v = np.asarray(body.vertices)
        tex = np.asarray(body.visual.material.baseColorTexture.convert('RGB').resize((256, 256)))
        uv = np.asarray(body.visual.uv)
        col = tex[np.clip(((1 - uv[:, 1]) * 255).astype(int), 0, 255), np.clip((uv[:, 0] * 255).astype(int), 0, 255)] / 255
        tv = np.asarray(tube.vertices)
        for c, (a, b, t, key) in enumerate([(2, 1, 'side: z ->, y ^ (back of hand up)', 0), (2, 0, 'top: z ->, x ^', 1), (0, 1, 'end: x, y', 2)]):
            o = np.argsort(v[:, key])
            ax[r, c].scatter(tv[:, a], tv[:, b], c='#222', s=1)
            ax[r, c].scatter(v[o, a], v[o, b], c=col[o], s=2)
            ax[r, c].set_aspect('equal')
            ax[r, c].set_facecolor('#666')
            ax[r, c].set_title(f'{sid} {t}')
            ax[r, c].plot([0], [0], 'r+')
    plt.tight_layout()
    plt.savefig(path, dpi=60)


def main():
    args = sys.argv[1:]
    prev = args.pop(args.index('--preview') + 1) if '--preview' in args else ''
    if prev:
        args.remove('--preview')
    os.makedirs(OUT, exist_ok=True)
    report, entries, items = [], [], []
    for h in HANDS:
        e, body, tube = prep(h, report)
        entries.append(e)
        items.append((e[0], body, tube))
    entries += wall_textures()
    if prev:
        os.makedirs(prev, exist_ok=True)
        preview(os.path.join(prev, 'prep_hands.png'), items)
        with open(os.path.join(prev, 'prep_report.json'), 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=1, ensure_ascii=False)
    if '--no-register' not in args:
        register(entries)
        license_note([e[1] for e in entries])
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'assets/choice-hands: {len(os.listdir(OUT))} files, {total / 1048576:.1f} MB')


if __name__ == '__main__':
    main()

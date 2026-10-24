"""Build assets/terrain-biomes/ (the lab's "ASHLAR · Biome mix" scene) from ashlar/art/textures/terrain-biomes-v1 and the Dark Wood grass set.

Usage:  python -I scripts/prepare-terrain-biomes-v1.py [--grass-prefix darkwood-sty-green] [--quality 90] [--only BIO01_peat,BIO02_meadow] [--source v1|v2] [--dungeon-only]
        --source        where the BIO and dungeon floor tiles come from: v1 (default) = ashlar/art/textures/terrain-biomes-v1 + terrain-dungeon-v1; v2 = ashlar/art/textures/terrain-biomes-v2-stylized
                        (the stylized low-detail regeneration: the same ids as albedo1024/ + normal1024/ [+ height1024/; a missing height is derived from the normal by
                        ashlar/art/textures/terrain-biomes-v1/tools/make_heights.py's function]). The output names and samples.json ids do not change: swapping the source is a data change.
        --grass-prefix  which Dark Wood set the grass copy comes from (assets/samples/<prefix>-grass{,-h,-n,-r}, <prefix>-grass-cards).
                        darkwood-sty-green (default) = the D2 / Map 1 green variant; darkwood-sty = the blue-grey stylized2 one.

Per biome id (31 textures, ashlar/art/textures/terrain-biomes-v1):
    biome-<id>.webp     albedo, sRGB, lossy WebP (q90), 1024 px, seamless
    biome-<id>-h.png    height, 8-bit, raised = bright, common median 0.5
    biome-<id>-n.webp   OpenGL (+Y) tangent-space normal, 1024 px, always lossless WebP (lossy chroma shows as seams in a normal). Full 8-bit is ~1 MB
                        each and would blow the folder budget, so a map is first rounded to the nearest 6-bit level (multiples of 4, flat 128 stays 128:
                        error <= 2/255); it keeps that only while the rounding error is under 15 % of the map's own detail (the std of its x / y), otherwise
                        (smooth maps: BIO11, BIO13 ...) it is saved as full 8-bit; the four new Dark Wood tiles are always 8-bit. The choice and the error in degrees are printed per map.
    biome-<id>-r.webp   roughness, 256 px (matte: 0.90, a little lower on the raised parts; it is low-frequency, the shader reads it at the albedo's uv)
plus the Dark Wood NATURAL SET under biome-darkwood-<name>{,-h,-n,-r}.*: COPIES of the green stylized dirt / mud (wet ground, the puddle base) / grass
(+ biome-darkwood-grass-cards.png), and four extra tiles from ashlar/art/textures/terrain-dark-wood/stylized2_green_ext (selection.json): grass-dense, grass-sparse,
soil-damp, water (tint + ripple normal), processed like prepare-terrain-darkwood.py --stylized (it is imported, not edited): 1254 -> 1024 px, Moisan
periodic seam fix, lighting flatten, soft height from the albedo, stylized relief, roughness. The darkwood-* files and
their samples.json entries stay untouched (the Dark Wood scenes keep using them).
Natural-sample dressing (round 3): biome-decals-ground.webp (4 x 4 flat ground decals: leaves, twigs / roots, pebbles, moss, a crack, a mud splash; keyed from
stylized2_green_ext/textures/decals_ground_a.png, cells centred), biome-shore-plants.webp (2 x 2 side-view reed cards, bottom-aligned, from shore_plants_b.png) and
three Tripo props as GLB at real size, pivot at the bottom centre, 2048 px JPEG base colour + normal, constant roughness 0.9 (biome-prop-riverbank-stones 1.0 m wide,
biome-prop-mushrooms 0.3 m tall, biome-prop-stump 0.8 m wide), from ashlar/3d/common/clutter_v1. Atlases are lossless WebP with the colour bled
under the transparent texels (mips get no pink / dark fringe).

Dungeon set (the lab's "Dungeon" scene: crypt + cave): seven new floor tiles from ashlar/art/textures/terrain-dungeon-v1 (dungeon-<id>{,-h,-n,-r}: seam-fixed albedo1024, OpenGL normal1024
and a height from make_heights.py --biome), two 4 x 4 decal atlases (dungeon-decals-crypt / dungeon-decals-cave, keyed like the ground decals; the cave atlas' cell 10, a ring drip stain
with magenta through its translucent rings, is dropped and cell 14, the charcoal smudge, is despilled to grey) and nine Tripo props (dungeon-prop-*.glb) scaled to real size, pivot at the
bottom centre, 2048 px JPEG base colour + normal, from ashlar/3d/common/dungeon_v1. `--dungeon-only` runs just this part (and leaves the rest of the folder alone).

Everything lands in ONE folder, assets/terrain-biomes/, and is registered in src/assets/samples.json (kind "texture", file
"terrain-biomes/..."): the entries are inserted after darkwood-sty-green-grass-cards (or replaced where they already are), nothing else moves.
Idempotent: re-running rewrites the same files and entries. The offline build base64-embeds every samples.json asset: the folder is kept <= ~45 MB.
"""
import importlib.util
import io
import json
import os
import shutil
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
SRC = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', 'art', 'textures', 'terrain-biomes-v1'))
SAMPLES = os.path.join(ROOT, 'assets', 'samples')
OUT = os.path.join(ROOT, 'assets', 'terrain-biomes')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
ANCHOR = 'darkwood-sty-green-grass-cards'
TRIPO = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', '3d', 'common', 'clutter_v1'))
EXT = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', 'art', 'textures', 'terrain-dark-wood', 'stylized2_green_ext'))
DG_SRC = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', 'art', 'textures', 'terrain-dungeon-v1'))
V2_SRC = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', 'art', 'textures', 'terrain-biomes-v2-stylized'))
TOOLS = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', 'art', 'textures', 'terrain-biomes-v1', 'tools'))
HEIGHT_SRC = SRC  # the manifest / metadata folder stays v1's; set_source() points SRC and DG_SRC at the chosen tiles
DG_TRIPO = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', '3d', 'common', 'dungeon_v1'))
ROUGH = 0.90  # matte ground
ROUGH_SIZE = 256


def retry(fn, *a, **kw):
    """Writes on this drive sometimes fail with EINVAL for a moment: retry."""
    for attempt in range(40):
        try:
            return fn(*a, **kw)
        except OSError:
            if attempt == 39:
                raise
            time.sleep(0.5)


DW = None  # prepare-terrain-darkwood.py, loaded in main()
META = SRC  # manifest.json / normal_metadata.json (labels, tilt) always come from v1


def set_source(source):
    """v1 (default) or v2: the folders of the BIO tiles (SRC) and the dungeon tiles (DG_SRC); the manifest and the tilt table stay v1's."""
    global SRC, DG_SRC
    if source == 'v2':
        if not os.path.isdir(os.path.join(V2_SRC, 'albedo1024')):
            raise SystemExit(f'--source v2: {V2_SRC}/albedo1024 not found (the stylized regeneration has not landed yet)')
        SRC = DG_SRC = V2_SRC
    elif source != 'v1':
        raise SystemExit('--source must be v1 or v2')
    print(f'texture source: {source} (BIO tiles {SRC}, dungeon tiles {DG_SRC})')


def load_height(folder, i, normal):
    """height1024/<id>.png of a source folder, or (v2 may not ship heights) derived from its normal with make_heights.py's function (same 8-bit, common-median convention)."""
    path = os.path.join(folder, 'height1024', f'{i}.png')
    if os.path.exists(path):
        return Image.open(path).convert('L')
    sys.path.insert(0, TOOLS)
    import make_heights  # noqa: E402
    h8 = np.rint(make_heights.height_from_normal_rgb(np.asarray(normal.convert('RGB')))).astype(np.uint8)
    print(f'  {i}: no height1024 in {os.path.basename(folder)}: derived from the normal')
    return Image.fromarray(h8, 'L')


NORMAL_BITS = {}  # file name -> 6 | 8, filled by save_normal (printed per map and summarised at the end)


def save_normal(img, path, force8=False):
    """Lossless WebP of a normal map: the 6-bit level nearest to every value (flat 128 stays exact) when that costs < 15 % of the map's detail (and `force8` is off), else 8-bit."""
    a = np.asarray(img.convert('RGB'))
    q = np.minimum(((a.astype(np.int16) + 2) >> 2) << 2, 255).astype(np.uint8)
    err = np.sqrt(np.mean((q[..., :2].astype(np.float32) - a[..., :2]) ** 2))
    detail = np.sqrt(np.mean(a[..., :2].astype(np.float32).var(axis=(0, 1))))  # std of x / y in levels
    keep6 = not force8 and err < 0.15 * detail
    angle = np.degrees(np.arctan(err / 127.5))  # rough mean tilt error of the chosen precision (0 for 8-bit)
    retry(Image.fromarray(q if keep6 else a, 'RGB').save, path, format='WEBP', lossless=True, method=6)
    NORMAL_BITS[os.path.basename(path)] = 6 if keep6 else 8
    print(f'  {os.path.basename(path)}: {6 if keep6 else 8}-bit (6-bit error {err:.2f} levels = {err / max(detail, 1e-6) * 100:.0f} % of detail {detail:.1f}, ~{angle:.2f} deg)')


def tilt_table():
    meta = json.load(open(os.path.join(META, 'normal_metadata.json'), encoding='utf-8'))
    return {e['id']: e.get('metrics', {}).get('tilt', {}).get('mean_deg') for e in meta['entries']}


def save_albedo(img, path, lossless, quality):
    retry(img.save, path, format='WEBP', lossless=True, method=6) if lossless else retry(img.save, path, format='WEBP', quality=quality, method=6)


def prep_biome(entry, quality):
    i = entry['id']
    albedo = Image.open(os.path.join(SRC, 'albedo1024', f'{i}.png')).convert('RGB')
    normal = Image.open(os.path.join(SRC, 'normal1024', f'{i}.png')).convert('RGB')
    height = load_height(SRC, i, normal)
    assert albedo.size == normal.size == height.size == (1024, 1024), f'{i}: expected 1024 px maps'
    save_albedo(albedo, os.path.join(OUT, f'biome-{i}.webp'), i in LOSSLESS_ALBEDO, quality)
    retry(height.save, os.path.join(OUT, f'biome-{i}-h.png'), optimize=True)
    save_normal(normal, os.path.join(OUT, f'biome-{i}-n.webp'))
    h = np.asarray(height.resize((ROUGH_SIZE, ROUGH_SIZE), Image.BILINEAR), dtype=np.float32) / 255.0
    r = np.clip(ROUGH + (0.5 - h) * 0.06, 0.04, 1.0)  # raised parts a hair smoother, hollows a hair rougher
    retry(Image.fromarray((r * 255 + 0.5).astype(np.uint8), 'L').save, os.path.join(OUT, f'biome-{i}-r.webp'), format='WEBP', quality=85, method=6)


def load_darkwood():
    """prepare-terrain-darkwood.py as a module (the way it loads prepare-terrain-moor.py); it is not edited, only its globals are pointed at this folder."""
    spec = importlib.util.spec_from_file_location('darkwood_prep', os.path.join(HERE, 'prepare-terrain-darkwood.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.OUT, mod.STYLIZED = OUT, True
    return mod


# The natural set. COPIES: (id suffix, role label) of the green Dark Wood layers. NEW: (name, role label, source key in selection.json, layer kind for
# the height / relief, roughness base, relief factor).
COPIES = [('dirt', 'loam ground'), ('mud', 'wet ground (puddle base)'), ('grass', 'shade grass')]
# Albedos that keep a wrap seam or a smooth gradient visible at close range are saved lossless instead of lossy WebP.
LOSSLESS_ALBEDO = {'BIO12_dark_planks', 'BIO16_blackwood', 'BIO17_varnished', 'water'}
NEW = [('grass-dense', 'dense grass', 'grass_dense', 'grass', 0.82, 1.0), ('grass-sparse', 'sparse grass', 'grass_sparse', 'grass', 0.85, 1.0),
       ('soil-damp', 'damp soil near water', 'soil_damp', 'dirt', 0.70, 1.0), ('water', 'water surface (tint + ripple normal)', 'water_surface', 'dirt', 0.10, 0.5)]


def save_tile(name, rgb, h, rough_base, relief, quality):
    """Same conventions as the Dark Wood stylized layers: albedo WebP, 8-bit height PNG, 6-bit OpenGL normal (lossless WebP), 256 px roughness WebP."""
    dw = DW
    save_albedo(dw.to_img(rgb), os.path.join(OUT, f'biome-darkwood-{name}.webp'), name in LOSSLESS_ALBEDO, quality)
    retry(dw.to_img(h).save, os.path.join(OUT, f'biome-darkwood-{name}-h.png'), optimize=True)
    nrm = dw.normal_map(h, dw.RELIEF['dirt'] * relief, layer='dirt')  # RELIEF / STY_RELIEF have no 'water' / 'damp' kind: the dirt relief, times `relief`
    save_normal(Image.fromarray(np.clip(nrm * 255 + 0.5, 0, 255).astype(np.uint8), 'RGB'), os.path.join(OUT, f'biome-darkwood-{name}-n.webp'), force8=True)
    hs = np.asarray(dw.to_img(h).resize((ROUGH_SIZE, ROUGH_SIZE), Image.BILINEAR), dtype=np.float32) / 255.0
    r = np.clip(rough_base + (0.5 - hs) * 0.06, 0.04, 1.0)
    retry(Image.fromarray((r * 255 + 0.5).astype(np.uint8), 'L').save, os.path.join(OUT, f'biome-darkwood-{name}-r.webp'), format='WEBP', quality=85, method=6)
    print(f'  {name}: height std {h.std():.3f}, normal x std {(nrm[..., 0] * 2 - 1).std():.3f}')


def prep_natural(prefix, quality):
    """The full natural ground set under biome-darkwood-*: copies of the Dark Wood green dirt / mud / grass (+ grass cards), and the four extra
    tiles (stylized2_green_ext: dense grass, sparse grass, damp soil, water surface) processed with prepare-terrain-darkwood.py --stylized:
    1254 px source -> 1024, Moisan periodic seam fix, lighting flatten, soft height from the albedo, stylized relief, roughness."""
    for suffix, _ in COPIES:
        albedo = Image.open(os.path.join(SAMPLES, f'{prefix}-{suffix}.png')).convert('RGB')
        retry(albedo.save, os.path.join(OUT, f'biome-darkwood-{suffix}.webp'), format='WEBP', quality=quality, method=6)
        for tag in ('-h.png', '-n.webp', '-r.webp'):
            retry(shutil.copyfile, os.path.join(SAMPLES, f'{prefix}-{suffix}{tag}'), os.path.join(OUT, f'biome-darkwood-{suffix}{tag}'))
    retry(shutil.copyfile, os.path.join(SAMPLES, f'{prefix}-grass-cards.png'), os.path.join(OUT, 'biome-darkwood-grass-cards.png'))
    sel = json.load(open(os.path.join(EXT, 'selection.json'), encoding='utf-8'))
    for name, _, key, layer, rough, relief in NEW:
        rgb, h = DW.process(os.path.join(EXT, sel[key]['file']), layer)
        save_tile(name, rgb, h, rough, relief, quality)


def key_atlas(path, rows, cols, cell_px, fit_px, align, drop=(), grey=(), neutral=False):
    """rows x cols sprites on magenta -> RGBA atlas of cell_px cells. Alpha from how magenta a pixel is, magenta despilled out of the edges, each sprite scaled
    to fit fit_px and placed `align` = 'bottom' (stands on the cell's bottom) or 'centre'; colour bled into the transparent area (wide -> narrow blurs).
    `neutral` = despill only the magenta excess (min(r, b) - g) instead of the green-set formula (which tints grey / warm sprites green).
    `drop` = cell indices left empty; `grey` = cell indices whose translucent magenta-tinted texels are turned grey (the green channel) instead of keeping a pink cast."""
    sw = DW.sw
    img = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
    H, W = img.shape[:2]
    out = np.zeros((rows * cell_px, cols * cell_px, 4), np.float32)
    for q in range(rows * cols):
        if q in drop:
            continue
        qr, qc = divmod(q, cols)
        cell = img[qr * H // rows:(qr + 1) * H // rows, qc * W // cols:(qc + 1) * W // cols]
        r, g, b = cell[..., 0], cell[..., 1], cell[..., 2]
        magenta = np.minimum(r, b) - g
        alpha = 1.0 - sw.smoothstep(25.0, 110.0, magenta)
        spill = np.maximum(0.0, magenta) * 0.9 if neutral else np.maximum(0.0, b - g * 0.8)
        rgb = np.stack([np.maximum(0.0, r - spill), g, b - spill], -1)
        if q in grey:  # a translucent texel is a blend of the sprite and the key: its colour is the sprite's own (the mean of its opaque, unkeyed texels scaled by the texel's green), not pink
            clean = (alpha > 0.95) & (magenta < 5)
            if clean.any():
                mean = rgb[clean].mean(0)
                scale = g / max(float(g[clean].mean()), 1.0)
                k = np.clip(magenta / 12.0, 0.0, 1.0)[..., None]
                rgb = rgb * (1 - k) + mean[None, None, :] * scale[..., None] * k
        ys, xs = np.nonzero(alpha > 0.3)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        tile = Image.fromarray(np.clip(np.concatenate([rgb, alpha[..., None] * 255.0], -1)[y0:y1, x0:x1], 0, 255).astype(np.uint8), 'RGBA')
        k = min(fit_px / tile.width, fit_px / tile.height)
        tile = tile.resize((max(1, round(tile.width * k)), max(1, round(tile.height * k))), Image.LANCZOS)
        ox = qc * cell_px + (cell_px - tile.width) // 2
        oy = qr * cell_px + (cell_px - tile.height if align == 'bottom' else (cell_px - tile.height) // 2)
        out[oy:oy + tile.height, ox:ox + tile.width] = np.asarray(tile, dtype=np.float32) / 255.0

    def blur(a, rad):  # three box passes per axis ~ gaussian
        for axis in (0, 1):
            for _ in range(3):
                c = np.cumsum(np.pad(a, [(rad + 1, rad) if k == axis else (0, 0) for k in range(2)], mode='edge'), axis=axis)
                a = (np.take(c, range(2 * rad + 1, c.shape[axis]), axis=axis) - np.take(c, range(0, c.shape[axis] - 2 * rad - 1), axis=axis)) / (2 * rad + 1)
        return a
    alpha = out[..., 3]
    fill = np.zeros_like(out[..., :3])
    for radius in (32, 12, 3):
        den = blur(alpha, radius)
        num = np.stack([blur(out[..., c] * alpha, radius) for c in range(3)], -1)
        ok = den > 1e-3
        fill[ok] = num[ok] / den[ok][:, None]
    out[..., :3] = np.where(alpha[..., None] < 0.5, fill * (1 - alpha[..., None]) + out[..., :3] * alpha[..., None], out[..., :3])
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA')


def prep_dressing():
    """Ground decals, shore plant cards and the three Tripo props (see the module docstring). Returns the samples.json entries."""
    tex = os.path.join(EXT, 'textures')
    decals = key_atlas(os.path.join(tex, 'decals_ground_a.png'), 4, 4, 256, 246, 'centre')
    retry(decals.save, os.path.join(OUT, 'biome-decals-ground.webp'), format='WEBP', lossless=True, exact=True, method=6)
    plants = key_atlas(os.path.join(tex, 'shore_plants_b.png'), 2, 2, 512, 500, 'bottom')
    retry(plants.save, os.path.join(OUT, 'biome-shore-plants.webp'), format='WEBP', lossless=True, exact=True, method=6)
    esrc = 'ashlar/art/textures/terrain-dark-wood/stylized2_green_ext'
    entries = [('biome-decals-ground', 'Dark Wood (D2 green, ext) · ground decals (4 x 4 RGBA atlas: leaves, twigs, pebbles, moss, crack, mud splash) · biome mix', 'biome-decals-ground.webp', esrc),
               ('biome-shore-plants', 'Dark Wood (D2 green, ext) · shore plant cards (2 x 2 RGBA atlas: cattail, reed, sedge, horsetail) · biome mix', 'biome-shore-plants.webp', esrc)]
    import trimesh
    for name, folder, scale, label in PROPS:
        scene = trimesh.load(os.path.join(TRIPO, folder, f'clutter_{folder}.glb'))
        g = list(scene.geometry.values())[0]
        m = g.visual.material

        def jpeg(img, quality):  # a PIL image that remembers it is a JPEG: trimesh writes it as such
            b = io.BytesIO()
            img.convert('RGB').resize((2048, 2048), Image.LANCZOS).save(b, 'JPEG', quality=quality)
            return Image.open(io.BytesIO(b.getvalue()))
        mat = trimesh.visual.material.PBRMaterial(baseColorTexture=jpeg(m.baseColorTexture, 88), normalTexture=jpeg(m.normalTexture, 92), roughnessFactor=0.9, metallicFactor=0.0)
        out = trimesh.Trimesh(vertices=g.vertices * scale, faces=g.faces, vertex_normals=g.vertex_normals, visual=trimesh.visual.TextureVisuals(uv=g.visual.uv, material=mat), process=False)
        data = trimesh.Scene({name: out}).export(file_type='glb')
        retry(lambda: open(os.path.join(OUT, f'biome-prop-{name}.glb'), 'wb').write(data))
        print(f'  biome-prop-{name}.glb: {len(out.faces)} tris, extents {np.round(out.extents, 2).tolist()} m, {len(data) / 1e6:.2f} MB')
        entries.append((f'biome-prop-{name}', f'{label} · Tripo prop (GLB, real size, pivot bottom centre) · biome mix', f'biome-prop-{name}.glb', 'ashlar/3d/common/clutter_v1'))
    return entries


# Tripo props: (name, source folder, scale to real size, label)
PROPS = [('riverbank-stones', 'riverbank_stones', 1.0, 'Riverbank stones (6 mossy river stones, 1.0 m wide)'), ('mushrooms', 'mushroom_cluster', 0.3, 'Mushroom cluster (6 mushrooms on a mossy root, 0.3 m tall)'),
         ('stump', 'mossy_stump', 0.8, 'Mossy stump (4 roots, ~0.5 m tall, 0.8 m wide)')]


# ---- the dungeon set -------------------------------------------------------------------------------------------------------------
# (source id, lab name, label, roughness base)
DG_TILES = [('crypt_dust_a', 'dungeon-crypt-dust', 'crypt floor dust', 0.93), ('crypt_damp_a', 'dungeon-crypt-damp', 'crypt damp dark flags', 0.72),
            ('crypt_rubble_a', 'dungeon-crypt-rubble', 'crypt rubble and slabs', 0.92), ('cave_floor_a', 'dungeon-cave-floor', 'cave chalk floor', 0.94),
            ('cave_clay_a', 'dungeon-cave-clay', 'cave wet clay', 0.78), ('cave_rubble_a', 'dungeon-cave-rubble', 'cave flint rubble', 0.9),
            ('cave_flowstone_a', 'dungeon-cave-flowstone', 'cave flowstone', 0.6)]
# (folder, lab name, scale to real size, roughness, metalness, label). The Tripo meshes are normalised to a 1 m longest side, pivot at the bottom centre.
DG_PROPS = [('sarcophagus', 'sarcophagus', 2.2, 0.9, 0.0, 'Sarcophagus (2.2 m long)'), ('bone_pile', 'bone-pile', 1.2, 0.85, 0.0, 'Bone pile (1.2 m wide)'),
            ('broken_column', 'broken-column', 1.68, 0.92, 0.0, 'Broken column (1.5 m tall)'), ('candle_cluster', 'candle-cluster', 0.8, 0.75, 0.0, 'Candle cluster on a stone block (0.8 m)'),
            ('fallen_bell', 'fallen-bell', 1.25, 0.5, 0.55, 'Fallen bronze bell (1.25 m)'), ('crypt_wall', 'crypt-wall', 4.0, 0.92, 0.0, 'Crypt wall module (4 m wide, 2.3 m tall)'),
            ('stalagmites', 'stalagmites', 1.6, 0.85, 0.0, 'Stalagmite cluster (1.6 m tall)'), ('mine_timber', 'mine-timber', 2.77, 0.88, 0.0, 'Mine timber frame (2.6 m tall)'),
            ('flint_boulders', 'flint-boulders', 2.0, 0.88, 0.0, 'Flint boulders (2 m wide)')]


def prep_dungeon(quality):
    """Dungeon tiles, decal atlases and Tripo props -> assets/terrain-biomes/dungeon-*. Returns the samples.json entries."""
    entries = []
    src = 'ashlar/art/textures/terrain-dungeon-v1'
    for i, name, label, rough in DG_TILES:
        albedo = Image.open(os.path.join(DG_SRC, 'albedo1024', f'{i}.png')).convert('RGB')
        normal = Image.open(os.path.join(DG_SRC, 'normal1024', f'{i}.png')).convert('RGB')
        height = load_height(DG_SRC, i, normal)
        assert albedo.size == normal.size == height.size == (1024, 1024), f'{i}: expected 1024 px maps'
        save_albedo(albedo, os.path.join(OUT, f'{name}.webp'), False, quality)
        retry(height.save, os.path.join(OUT, f'{name}-h.png'), optimize=True)
        save_normal(normal, os.path.join(OUT, f'{name}-n.webp'))
        h = np.asarray(height.resize((ROUGH_SIZE, ROUGH_SIZE), Image.BILINEAR), dtype=np.float32) / 255.0
        r = np.clip(rough + (0.5 - h) * 0.06, 0.04, 1.0)
        retry(Image.fromarray((r * 255 + 0.5).astype(np.uint8), 'L').save, os.path.join(OUT, f'{name}-r.webp'), format='WEBP', quality=85, method=6)
        for tag, kind, ext in (('', 'albedo', '.webp'), ('-h', 'height', '-h.png'), ('-n', 'normal', '-n.webp'), ('-r', 'roughness', '-r.webp')):
            entries.append((f'{name}{tag}', f'ASHLAR dungeon · {label} ({kind})', f'{name}{ext}', src))
    tex = os.path.join(DG_SRC, 'textures')
    for kind, drop, grey in (('crypt', (), (7, 12)), ('cave', (10,), (14,))):
        atlas = key_atlas(os.path.join(tex, f'decals_{kind}_a.png'), 4, 4, 256, 246, 'centre', drop=drop, grey=grey, neutral=True)
        retry(atlas.save, os.path.join(OUT, f'dungeon-decals-{kind}.webp'), format='WEBP', lossless=True, exact=True, method=6)
        entries.append((f'dungeon-decals-{kind}', f'ASHLAR dungeon · {kind} decals (4 x 4 RGBA atlas)', f'dungeon-decals-{kind}.webp', src))
    import trimesh
    for folder, name, scale, rough, metal, label in DG_PROPS:
        scene = trimesh.load(os.path.join(DG_TRIPO, folder, f'dungeon_{folder}.glb'))
        g = list(scene.geometry.values())[0]
        m = g.visual.material

        def jpeg(img, quality):  # a PIL image that remembers it is a JPEG: trimesh writes it as such
            b = io.BytesIO()
            img.convert('RGB').resize((2048, 2048), Image.LANCZOS).save(b, 'JPEG', quality=quality)
            return Image.open(io.BytesIO(b.getvalue()))
        mat = trimesh.visual.material.PBRMaterial(baseColorTexture=jpeg(m.baseColorTexture, 86), normalTexture=jpeg(m.normalTexture, 90), roughnessFactor=rough, metallicFactor=metal)
        out = trimesh.Trimesh(vertices=g.vertices * scale, faces=g.faces, vertex_normals=g.vertex_normals, visual=trimesh.visual.TextureVisuals(uv=g.visual.uv, material=mat), process=False)
        data = trimesh.Scene({name: out}).export(file_type='glb')
        retry(lambda: open(os.path.join(OUT, f'dungeon-prop-{name}.glb'), 'wb').write(data))
        print(f'  dungeon-prop-{name}.glb: {len(out.faces)} tris, extents {np.round(out.extents, 2).tolist()} m, {len(data) / 1e6:.2f} MB')
        entries.append((f'dungeon-prop-{name}', f'{label} · Tripo prop (GLB, real size, pivot bottom centre) · dungeon', f'dungeon-prop-{name}.glb', 'ashlar/3d/common/dungeon_v1'))
    return entries


def run_dungeon(quality):
    global DW
    DW = DW or load_darkwood()  # key_atlas needs its smoothstep
    entries = prep_dungeon(quality)
    register(entries)
    license_note(entries, 'dungeon-v1', 'The ASHLAR dungeon set - ' + ', '.join(n for _, n, _, _ in entries) + ' - is project art: the floor tiles and decal atlases are generated with Codex image generation '
                 '(`ashlar/art/textures/terrain-dungeon-v1`) and processed by `scripts/prepare-terrain-biomes-v1.py`; the nine props are generated with Tripo (image to 3D) from Codex concepts '
                 '(`ashlar/3d/common/dungeon_v1`); all packed into `assets/terrain-biomes/`; project-internal.')
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'assets/terrain-biomes: {len(os.listdir(OUT))} files, {total / 1048576:.1f} MB')


def register(entries):
    """entries = [(id, name, file, source)]. Replace the entries of these ids in place, or insert after ANCHOR; nothing else moves."""
    credit_biome = ('Generated with Codex image generation for the ASHLAR terrain biomes (ashlar/art/textures/terrain-biomes-v1: stylized2 albedo, normal and height maps, seamless), '
                    'packed by scripts/prepare-terrain-biomes-v1.py')
    credit_grass = ('Dark Wood natural ground layer (copy of the stylized2 green set, or the stylized2_green_ext tiles: dense / sparse grass, damp soil, water), generated '
                    'with Codex image generation after a Diablo Immortal Dark Wood screenshot, packed by scripts/prepare-terrain-biomes-v1.py')
    lines = []
    credit_dress = ('Ground decals / shore plant cards generated with Codex image generation in the Dark Wood stylized2_green style (stylized2_green_ext), keyed and packed by '
                    'scripts/prepare-terrain-biomes-v1.py')
    credit_prop = ('Generated with Tripo (image to 3D, 4K PBR, ~10k triangles) from a Codex concept, scaled to real size and re-encoded (2048 px JPEG) by scripts/prepare-terrain-biomes-v1.py')
    credit_dungeon = ('Generated with Codex image generation for the ASHLAR dungeon (ashlar/art/textures/terrain-dungeon-v1: seam-fixed albedo, OpenGL normal, derived height; keyed decal atlases) '
                      'and, for the props, with Tripo (image to 3D, 4K PBR, ~10k triangles) from a Codex concept; scaled to real size and re-encoded (2048 px JPEG) by scripts/prepare-terrain-biomes-v1.py')
    for i, name, file, source in entries:
        credit = credit_dungeon if i.startswith('dungeon-') else credit_prop if i.startswith('biome-prop-') else credit_dress if i.startswith(('biome-decals-', 'biome-shore-')) else credit_grass if i.startswith('biome-darkwood-') else credit_biome
        kind = 'model' if file.endswith('.glb') else 'texture'
        lines.append(f'    {{"id": "{i}", "name": {json.dumps(name, ensure_ascii=False)}, "kind": "{kind}", "file": "terrain-biomes/{file}", '
                     f'"license": "Project-internal", "credit": "{credit}", "source": "{source}"}},')
    ids = {e[0] for e in entries}
    for attempt in range(40):  # read and write back in one go: other threads edit this file too
        text = open(MANIFEST, encoding='utf-8').read().split('\n')
        pos = next((k for k, l in enumerate(text) if any(f'"id": "{i}"' in l for i in ids)), None)
        kept = [l for l in text if not any(f'"id": "{i}"' in l for i in ids)]
        if pos is None:
            pos = next((k for k, l in enumerate(kept) if f'"id": "{ANCHOR}"' in l), None)
            pos = len(kept) if pos is None else pos + 1
            if pos == len(kept):  # no anchor: before the closing "  ]" of the list
                pos = max(k for k, l in enumerate(kept) if l.strip() == ']')
        else:
            pos = min(pos, len(kept))
        kept[pos:pos] = lines
        # the last entry of the list must not end in a comma
        end = max(k for k, l in enumerate(kept) if l.strip() == ']')
        last = max(k for k in range(end) if kept[k].lstrip().startswith('{"id"'))
        for k in range(end):
            if kept[k].lstrip().startswith('{"id"'):
                kept[k] = kept[k].rstrip().rstrip(',') + ('' if k == last else ',')
        data = '\n'.join(kept)
        json.loads(data)  # never write a broken manifest
        try:
            with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
                f.write(data)
            break
        except OSError:
            if attempt == 39:
                raise
            time.sleep(0.5)
    print(f'{len(lines)} samples.json entries written')


def license_note(entries, tag='terrain-biomes-v1', text=None):
    """One marker-delimited paragraph in THIRD_PARTY_LICENSES.md naming every entry (scripts/check.mjs warns for names it cannot find there)."""
    path = os.path.join(ROOT, 'THIRD_PARTY_LICENSES.md')
    a, b = f'<!-- {tag}:start -->', f'<!-- {tag}:end -->'
    para = (a + '\n' + text + '\n' + b) if text else (a + '\nThe ASHLAR biome-mix textures - ' + ', '.join(n for _, n, _, _ in entries) + ' - are project textures and props: the 31 BIO textures are generated with Codex image generation '
            '(`ashlar/art/textures/terrain-biomes-v1`, stylized2 look); the Dark Wood natural set is a COPY of the green Dark Wood loam ground (dirt), wet ground (mud) and shade grass layers '
            '(`ashlar/art/textures/terrain-dark-wood/stylized2_green`) plus four tiles generated the same way and processed like `prepare-terrain-darkwood.py --stylized` '
            '(dense grass, sparse grass, damp soil near water, water surface: `ashlar/art/textures/terrain-dark-wood/stylized2_green_ext`). All packed into `assets/terrain-biomes/` by '
            '`scripts/prepare-terrain-biomes-v1.py`; the ground decals and shore plant cards are generated with Codex image generation in the same style (`stylized2_green_ext`), and the three props are generated with Tripo (image to 3D); project-internal.\n' + b)
    text = open(path, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in text else '\n'
    para = para.replace('\n', nl)
    if a in text:
        head, rest = text.split(a, 1)
        text = head + para + rest.split(b, 1)[1]  # whatever followed the end marker (the blank line) stays as it was
    else:
        anchor = 'The same credits are shown in the app'
        text = text.replace(anchor, para + nl + nl + anchor, 1) if anchor in text else text.rstrip() + nl + nl + para + nl
    for attempt in range(40):
        try:
            with open(path, 'w', encoding='utf-8', newline='') as f:
                f.write(text)
            return
        except OSError:
            time.sleep(0.5)


def main():
    args = sys.argv[1:]
    opt = lambda name, default: (args.pop(args.index(name) + 1), args.remove(name))[0] if name in args else default
    grass_prefix = opt('--grass-prefix', 'darkwood-sty-green')
    quality = int(opt('--quality', '90'))
    only = opt('--only', '')
    set_source(opt('--source', 'v1'))
    dungeon_only = '--dungeon-only' in args
    if dungeon_only:
        args.remove('--dungeon-only')
    if dungeon_only:
        os.makedirs(OUT, exist_ok=True)
        run_dungeon(quality)
        return
    manifest = json.load(open(os.path.join(META, 'manifest.json'), encoding='utf-8'))
    if only:
        manifest = [e for e in manifest if e['id'] in only.split(',')]
    os.makedirs(OUT, exist_ok=True)
    tilts = tilt_table()
    entries = []
    for e in manifest:
        i = e['id']
        prep_biome(e, quality)
        label = f"ASHLAR {e['biome_id']} · {e['name_vi']} · {e['material']} ({i})"
        src = 'ashlar/art/textures/terrain-biomes-v1'
        tilt = tilts.get(i)
        print(f'{i}  tilt {tilt if tilt is None else round(tilt, 1)} deg')
        entries += [(f'biome-{i}', f'{label} (albedo)', f'biome-{i}.webp', src), (f'biome-{i}-h', f'{label} (height)', f'biome-{i}-h.png', src),
                    (f'biome-{i}-n', f'{label} (normal)', f'biome-{i}-n.webp', src), (f'biome-{i}-r', f'{label} (roughness)', f'biome-{i}-r.webp', src)]
    global DW
    DW = load_darkwood()
    prep_natural(grass_prefix, quality)
    gsrc = 'ashlar/art/textures/terrain-dark-wood/stylized2_green' if grass_prefix.endswith('green') else 'ashlar/art/textures/terrain-dark-wood/stylized2'
    gl = 'Dark Wood (D2 green)' if grass_prefix.endswith('green') else 'Dark Wood (blue-grey)'
    esrc = 'ashlar/art/textures/terrain-dark-wood/stylized2_green_ext'
    kinds = (('', 'albedo', '.webp'), ('-h', 'height', '-h.png'), ('-n', 'normal', '-n.webp'), ('-r', 'roughness', '-r.webp'))
    for suffix, role in COPIES:
        for tag, kind, ext in kinds:
            entries.append((f'biome-darkwood-{suffix}{tag}', f'{gl} · {role} · biome mix ({kind})', f'biome-darkwood-{suffix}{ext}', gsrc))
    for name, role, _, _, _, _ in NEW:
        for tag, kind, ext in kinds:
            entries.append((f'biome-darkwood-{name}{tag}', f'Dark Wood (D2 green, ext) · {role} · biome mix ({kind})', f'biome-darkwood-{name}{ext}', esrc))
    entries.append(('biome-darkwood-grass-cards', f'{gl} · grass cards · biome mix (RGBA atlas)', 'biome-darkwood-grass-cards.png', gsrc))
    entries += prep_dressing()
    register(entries)
    license_note(entries)
    run_dungeon(quality)
    bits = sorted(k for k, v in NORMAL_BITS.items() if v == 8)
    print(f'normals saved as full 8-bit ({len(bits)}): ' + ', '.join(bits))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'assets/terrain-biomes: {len(os.listdir(OUT))} files, {total / 1048576:.1f} MB')


if __name__ == '__main__':
    main()

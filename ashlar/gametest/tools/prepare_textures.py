#!/usr/bin/env python
"""Prepare the ASHLAR (Dark Wood, green) terrain textures for the game.

    python -I tools/prepare_textures.py [--samples <repo>/lookdev-lab/assets/samples] [--out source/assets/ashlar/terrain] [--keep-config]

Reads (read-only)  lookdev-lab/assets/samples/darkwood-sty-green-*  (grass, dirt, mud, cobble, grass-cards)
Writes             <out>/<layer>.albedo.webp   sRGB colour
                   <out>/<layer>.height.png    8-bit grey, lossless, 0..255 -> 0..1 heights for the game's Kh() (Sobel normals)
                   <out>/<layer>.rough.png     8-bit grey, lossless, roughness
                   <out>/grass-cards.webp      RGBA 2x2 atlas of grass cards
                   <out>/config.json           layer sizes, metres per repeat, calibrated normal strength, theme mapping, card params
The NormalMap-Online maps are not made here: run `node tools/nmo_normals.mjs --install` after the heights change.
To swap a texture: replace its file (same size as listed in config.json) and, if the relief looks too weak/strong,
change that layer's normalStrength in config.json. With --keep-config only the images are rewritten.

normalStrength: the game's Kh() builds normals from the height map with a Sobel filter that is not resolution-normalised,
so the strength is calibrated per layer to match the mean tilt of the lab's own -n.webp normal maps.
"""
import argparse
import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent

def find_repo_root():
    """Walk up from ROOT to the first ancestor that contains lookdev-lab (the project may sit at any depth)."""
    for p in ROOT.parents:
        if (p / 'lookdev-lab').is_dir():
            return p
    return None
PREFIX = 'darkwood-sty-green-'

# ---------------------------------------------------------------- tunables
TILE_M = 2.8                       # metres per repeat for grass / dirt / mud (lab value TERRAIN_SETS.darkWoodGreen)
COBBLE_M = 8.3                     # metres per repeat of the composed cobble square (stones stay ~0.55 m)
COBBLE_REPEATS = (5, 2)            # tile repeats in x, y of the composed square (500x1290 tile, 300 px/m)
COBBLE_SIZE = 2048
COBBLE_BLUR = 1.5                  # px (at 2048) gaussian on the luminance-derived height
COBBLE_ROUGH = (0.80, 0.92)        # stones .. joints
ALBEDO_WEBP_Q = 90
STRENGTH_MUL = 1.0                 # global multiplier on the calibrated normal strengths
# theme -> ASHLAR layer per terrain slot [slot0, slot1, slot2, slot3]. The cave is not listed: it keeps its original layers.
# original -> ASHLAR:  grass->grass  grassDry->grass (no dry variant)  dirt->dirt  mud->mud  cobble|flagstone->cobble
THEMES = {
    'town': ['grass', 'dirt', 'mud', 'cobble'],
    'moor': ['grass', 'dirt', 'mud', 'cobble'],
    'fields': ['grass', 'dirt', 'mud', 'cobble'],
}
# matte ground: the ASHLAR albedo is dark (linear ~0.03) so the stock F0 0.04 specular was 35-65 % of the ground's luminance.
# specular scales direct + environment specular of the dry ground (rain puddles keep full gloss), roughnessMin floors the layer roughness.
# albedoGain (per theme, 'default' otherwise) wins the brightness back that the matte fix took (measured: town/moor/fields mean luma back to 100-104 % of the original game)
SURFACE = dict(specular=0.15, roughnessMin=0.9, albedoGain=dict(default=1.35, town=1.75, moor=1.2, fields=1.5))
LOOK = dict(exposure=1.1)          # global renderer exposure lift while ASHLAR is active
# NormalMap-Online normal maps (tools/nmo_normals.mjs --install writes <layer>.normal.webp / <layer>.normal-albedo.webp (lossless)); used by the themes in NMAP_THEMES
NMAP_THEMES = ['town']
NMAP_SCALE = dict(grass=1.0, dirt=1.0, mud=0.75, cobble=1.0)   # slope multiplier applied when the map is decoded (the maps are baked at 2x the Sobel strength)
CARDS = dict(
    file='grass-cards.webp',
    params=dict(
        density=0.38,                  # clumps per m2 at grass-layer density 1 (the original blades place up to 2.4)
        hMin=0.5, hMax=0.95, hBase=0.6,  # card height m, scaled by (hBase + layerDensity * (1 - hBase))
        wMin=0.95, wMax=1.35,          # width = height * this
        toneMin=0.7, toneMax=1.0, tint=0.05, rgb=[0.7, 0.92, 0.58],
        sink=0.03, alphaTest=0.4, roughness=0.9,
        specular=0.15,                 # scale of the cards' specular (0 = fully matte, 1 = stock MeshStandardMaterial)
    ),
)


def fail(msg):
    print('prepare_textures: ' + msg, file=sys.stderr)
    sys.exit(1)


def webp_bytes(img, **kw):
    buf = io.BytesIO()
    img.save(buf, 'WEBP', method=6, **kw)
    return buf.getvalue()


# ---------------------------------------------------------------- normal-strength calibration (mirror of the game's Kh)
def kh_xy(h, s):
    """Per-texel (nx, ny) that Kh writes for heights h (0..1, 2-D) and strength s: normalize(-gx*s, -gy*s, 1), Sobel, wrapping."""
    def a(dx, dy):
        return np.roll(np.roll(h, -dy, 0), -dx, 1)
    gx = a(1, -1) + 2 * a(1, 0) + a(1, 1) - (a(-1, -1) + 2 * a(-1, 0) + a(-1, 1))
    gy = a(-1, 1) + 2 * a(0, 1) + a(1, 1) - (a(-1, -1) + 2 * a(0, -1) + a(1, -1))
    l, u = -gx * s, -gy * s
    f = np.sqrt(l * l + u * u + 1)
    return l / f, u / f


def mean_xy(h, s):
    nx, ny = kh_xy(h, s)
    return float(np.hypot(nx, ny).mean())


def solve_strength(h, target):
    lo, hi = 0.01, 400.0
    for _ in range(40):
        mid = (lo * hi) ** 0.5
        if mean_xy(h, mid) < target:
            lo = mid
        else:
            hi = mid
    return (lo * hi) ** 0.5


def lab_xy(path):
    """Mean |(nx, ny)| of a tangent-space normal map (RGB, 0.5 = flat), as the lab ships it."""
    n = np.asarray(Image.open(path).convert('RGB')).astype(np.float64) / 255 * 2 - 1
    return float(np.hypot(n[..., 0], n[..., 1]).mean()), n


# ---------------------------------------------------------------- layers
def save_layer(out, name, albedo_img, height_u8, rough_u8):
    albedo_img.save(out / f'{name}.albedo.webp', 'WEBP', method=6, quality=ALBEDO_WEBP_Q)
    Image.fromarray(height_u8, 'L').save(out / f'{name}.height.png', optimize=True)
    Image.fromarray(rough_u8, 'L').save(out / f'{name}.rough.png', optimize=True)


def ground_layer(samples, out, name):
    albedo = Image.open(samples / f'{PREFIX}{name}.png').convert('RGB')
    height = np.asarray(Image.open(samples / f'{PREFIX}{name}-h.png').convert('L'))
    rough = np.asarray(Image.open(samples / f'{PREFIX}{name}-r.webp').convert('RGB'))[..., 0]
    if not (albedo.size == height.shape[::-1] == rough.shape[::-1] == (1024, 1024)):
        fail(f'{name}: expected 1024x1024 albedo/height/roughness')
    target, _ = lab_xy(samples / f'{PREFIX}{name}-n.webp')
    strength = solve_strength(height / 255.0, target)
    save_layer(out, name, albedo, height, rough)
    info = dict(lab_xy=round(target, 4), kh_xy=round(mean_xy(height / 255.0, strength), 4), rough_mean=round(float(rough.mean()) / 255, 3))
    return dict(size=1024, meters=TILE_M, normalStrength=round(strength * STRENGTH_MUL, 4)), info


def cobble_layer(samples, out):
    tile = Image.open(samples / f'{PREFIX}cobble.png').convert('RGB')
    rx, ry = COBBLE_REPEATS
    big = Image.new('RGB', (tile.width * rx, tile.height * ry))
    for j in range(ry):
        for i in range(rx):
            big.paste(tile, (i * tile.width, j * tile.height))
    sq = big.resize((COBBLE_SIZE, COBBLE_SIZE), Image.LANCZOS)       # ~3 % anisotropic squash (2500x2580 -> 2048x2048)
    lum = np.asarray(sq.convert('L')).astype(np.float64)
    lum = ndimage.gaussian_filter(lum, COBBLE_BLUR, mode='wrap')       # wrap: the repeat stays seamless
    lo, hi = np.percentile(lum, [1, 99.5])
    h = np.clip((lum - lo) / (hi - lo), 0, 1)
    height = np.round(h * 255).astype(np.uint8)
    rough = np.round((COBBLE_ROUGH[0] + (COBBLE_ROUGH[1] - COBBLE_ROUGH[0]) * (1 - h)) * 255).astype(np.uint8)
    target, labn = lab_xy(samples / f'{PREFIX}cobble-n.webp')
    strength = solve_strength(height / 255.0, target)
    # orientation sanity versus the lab's own normal (computed on the 500x1290 tile itself)
    tlum = ndimage.gaussian_filter(np.asarray(tile.convert('L')).astype(np.float64), COBBLE_BLUR * 500 / (COBBLE_SIZE / rx), mode='wrap')
    tnx, _ = kh_xy((tlum - tlum.min()) / (np.ptp(tlum) + 1e-9), 4.0)
    corr = float(np.corrcoef(tnx.ravel(), labn[..., 0].ravel())[0, 1])
    save_layer(out, 'cobble', sq, height, rough)
    info = dict(lab_xy=round(target, 4), kh_xy=round(mean_xy(height / 255.0, strength), 4), lab_nx_corr=round(corr, 3), rough_mean=round(float(rough.mean()) / 255, 3))
    return dict(size=COBBLE_SIZE, meters=COBBLE_M, normalStrength=round(strength * STRENGTH_MUL, 4)), info


def cards(samples, out):
    img = Image.open(samples / f'{PREFIX}grass-cards.png').convert('RGBA')
    # the atlas carries plausible colour under alpha = 0 (no matte fringe); exact=True keeps it through the encoder
    raw = webp_bytes(img, quality=92, alpha_quality=100, exact=True)
    (out / CARDS['file']).write_bytes(raw)
    back = np.asarray(Image.open(io.BytesIO(raw)).convert('RGBA')).astype(int)
    src = np.asarray(img).astype(int)
    keep = src[..., 3] > 200
    return dict(rgb_err=round(float(np.abs(back[keep][:, :3] - src[keep][:, :3]).mean()), 2),
                alpha_err=round(float(np.abs(back[..., 3] - src[..., 3]).mean()), 2), size=list(img.size))


def main():
    ap = argparse.ArgumentParser()
    repo = find_repo_root()
    ap.add_argument('--samples', default=str(repo / 'lookdev-lab' / 'assets' / 'samples') if repo else None)
    ap.add_argument('--out', default=str(ROOT / 'source' / 'assets' / 'ashlar' / 'terrain'))
    ap.add_argument('--keep-config', action='store_true', help='rewrite the images only; keep a hand-edited config.json')
    a = ap.parse_args()
    if not a.samples:
        fail(f'no ancestor of {ROOT} contains a lookdev-lab folder; pass --samples DIR')
    samples, out = Path(a.samples), Path(a.out)
    if not samples.is_dir():
        fail(f'samples dir not found: {samples}')
    out.mkdir(parents=True, exist_ok=True)

    layers, infos = {}, {}
    for n in ('grass', 'dirt', 'mud'):
        layers[n], infos[n] = ground_layer(samples, out, n)
    layers['cobble'], infos['cobble'] = cobble_layer(samples, out)
    for n, L in layers.items():
        L.update(albedo=f'{n}.albedo.webp', height=f'{n}.height.png', rough=f'{n}.rough.png')
    cinfo = cards(samples, out)

    if a.keep_config and (out / 'config.json').exists():
        print('config.json kept; calibrated strengths:', {k: v['normalStrength'] for k, v in layers.items()})
    else:
        for k, v in layers.items():
            v.update(nmap=f'{k}.normal.webp', nmapAlbedo=f'{k}.normal-albedo.webp', nmapScale=NMAP_SCALE[k])
        cfg = dict(version=1, layers=layers, themes=THEMES, nmapThemes=NMAP_THEMES, surface=SURFACE, look=LOOK, cards=dict(atlas=CARDS['file'], params=CARDS['params']))
        (out / 'config.json').write_text(json.dumps(cfg, indent=2) + '\n', encoding='utf-8')
    for k, v in infos.items():
        print(f'  {k:7s} strength {layers[k]["normalStrength"]:<9} {v}')
    print('  cards  ', cinfo)
    print('wrote', out, f'({sum(f.stat().st_size for f in out.iterdir()) / 1e6:.2f} MB)')


if __name__ == '__main__':
    main()

"""Build the "Dark Wood (Diablo Immortal ref)" terrain set from the Codex tiles in legacy/art-output/terrain-darkwood (realistic) or ashlar/art/textures/terrain-dark-wood/stylized2[_green] (stylized).

Usage:  python -I scripts/prepare-terrain-darkwood.py [source dir] [--prefix darkwood] [--stylized] [--puddle-rough 0.08] [--mud-rough 0.62] [--path file] [--label 'Dark Wood (Immortal ref)']
        realistic: defaults (legacy/art-output/terrain-darkwood -> darkwood-*)
        stylized:  ... ../ashlar/art/textures/terrain-dark-wood/stylized2 --prefix darkwood-sty --stylized   (smoother heights, gentler normals)

Sources (square tiles unless noted): dirt_loam.png, mud_wet.png, grass_shade.png, path_cobble.png (portrait strip, road in
the middle 60 % of the width, repeats along v), grass_cards.png (2 x 2 tufts on magenta #FF00FF).
Also -n (OpenGL normal) and -r (roughness) webp per layer, darkwood-ruts-n.webp, 3 x 3 normal tiling checks in _tiling/.
Writes assets/samples/darkwood-<layer>.png + darkwood-<layer>-h.png (dirt / mud / grass, 1024 px), darkwood-ruts.png + -h
(RGBA cobble ribbon, alpha fades the sides) and darkwood-grass-cards.png (RGBA 2 x 2 atlas), and the samples.json entries.

Seams: periodic + smooth decomposition (Moisan 2011, the same as legacy/art-output/terrain-biomes/process.py) and the lighting
flatten on a wrapped 3 x 3 copy - NOT the half-shift cross-fade of sw.make_seamless, which prints a square grid.
The ground tiles stay at 1024: loadPaintedSets builds its normal / orm maps per pixel on the CPU, three layers of 2048 px
would cost seconds of boot time and gain nothing at the 3.5 m repeat. The grass-card atlas reuses prepare-terrain-moor.py.
"""
import importlib.util
import json
import os
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(ROOT, 'assets', 'samples')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
SRC = os.path.join(ROOT, '..', 'legacy', 'art-output', 'terrain-darkwood')
PREFIX = 'darkwood'
SIZE = 1024
STY_RELIEF = {'dirt': 0.38, 'mud': 0.85, 'grass': 0.33, 'ruts': 0.4}  # stylized: strength multiplier, tuned so the normal's x std lands at 0.04-0.08 (printed per layer)
MUD_ROUGH = 0.62  # roughness of the wet layer's dry part (--mud-rough): a low value mirrors the hero's light as a bright patch on a big wet area
PUDDLE_ROUGH = 0.08  # roughness of the wet layer's lowest parts: low = glossy puddles; --puddle-rough raises it (a glossy patch mirrors the hero's light)
STYLIZED = False  # painted strokes: heights smoothed, normals ~half as strong
LABEL = 'Dark Wood (realistic)'
SOURCE = 'legacy/art-output/terrain-darkwood'


def load_module(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


moor = load_module('moor', 'prepare-terrain-moor.py')  # also loads the swatches helpers as moor.sw
sw = moor.sw
moor.OUT, moor.PREFIX = OUT, PREFIX  # grass_cards() writes <PREFIX>-grass-cards.png into OUT


def retry_save(img, path, **kw):
    """Writes on this drive sometimes fail with EINVAL for a moment: retry."""
    for attempt in range(20):
        try:
            return img.save(path, **kw)
        except OSError:
            if attempt == 19:
                raise
            time.sleep(0.5)


def periodic(img):
    """Periodic component of the periodic + smooth decomposition, per channel (see legacy/art-output/terrain-biomes/process.py)."""
    h, w = img.shape[:2]
    out = np.empty_like(img)
    q = np.cos(2 * np.pi * np.arange(h) / h)[:, None]
    r = np.cos(2 * np.pi * np.arange(w) / w)[None, :]
    den = 2 * q + 2 * r - 4
    den[0, 0] = 1
    for c in range(img.shape[2]):
        u = img[..., c].astype(np.float64)
        v = np.zeros_like(u)
        v[0, :] += u[-1, :] - u[0, :]
        v[-1, :] += u[0, :] - u[-1, :]
        v[:, 0] += u[:, -1] - u[:, 0]
        v[:, -1] += u[:, 0] - u[:, -1]
        s = np.fft.fft2(v) / den
        s[0, 0] = 0
        out[..., c] = u - np.real(np.fft.ifft2(s))
    return np.clip(out, 0.0, 1.0)


def flatten_wrapped(rgb, sigma):
    """sw.flatten_lighting on a 3 x 3 wrap of the tile (its blur is not periodic), centre cut back out."""
    h, w = rgb.shape[:2]
    big = sw.flatten_lighting(np.tile(rgb, (3, 3, 1)), sigma=sigma)
    return big[h:2 * h, w:2 * w]


def soft_height(h, sigma, wrap=(0, 1)):
    """Stylized heights: blurred, then stretched so the 2nd..98th percentile fill 0..1 (the shader's height blend and the
    puddle band read the full range again; the blur alone left a std of 0.01-0.06)."""
    h = blur_wrapped(h.astype(np.float64), sigma, wrap)
    lo, hi = np.percentile(h, (2, 98))
    return np.clip((h - lo) / max(hi - lo, 1e-6), 0, 1)


def process(path, layer, size=SIZE):
    img = Image.open(path).convert('RGB').resize((size, size), Image.LANCZOS)
    rgb = periodic(np.asarray(img, dtype=np.float32) / 255.0)
    rgb = flatten_wrapped(rgb, size / 18)
    h = sw.height_from(np.tile(rgb, (3, 3, 1)), layer)[size:2 * size, size:2 * size]
    if STYLIZED:
        h = soft_height(h, 2.0)  # brush strokes read as soft swells, not noisy bumps
    return rgb, h


def to_img(a, mode=None):
    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8), mode)


def save_layer(rgb, h, name, alpha=None):
    a = rgb if alpha is None else np.concatenate([rgb, alpha[..., None]], axis=-1)
    retry_save(to_img(a), os.path.join(OUT, f'{PREFIX}-{name}.png'), optimize=True)
    retry_save(to_img(h), os.path.join(OUT, f'{PREFIX}-{name}-h.png'), optimize=True)
    print(f'{PREFIX}-{name}.png  {rgb.shape[1]} x {rgb.shape[0]}' + ('  + alpha' if alpha is not None else '') + '  + height')


RELIEF = {'dirt': 4.5, 'mud': 4.0, 'grass': 5.0, 'ruts': 5.0}  # ~1.5x loadPaintedSets' derived strengths: the flattened heights are low-contrast


def blur_wrapped(a, sigma, wrap=(0, 1)):  # noqa: D401
    """Gaussian blur that wraps (FFT on a periodic image); wrap=(0,) wraps rows only (edge-clamped across)."""
    if sigma <= 0:
        return a
    if wrap == (0, 1):
        k = np.fft.fftfreq(a.shape[0])[:, None] ** 2 + np.fft.fftfreq(a.shape[1])[None, :] ** 2
        return np.real(np.fft.ifft2(np.fft.fft2(a) * np.exp(-2 * (np.pi * sigma) ** 2 * k)))
    pad = int(sigma * 4)
    b = np.pad(a, ((0, 0), (pad, pad)), mode='edge')
    k = np.fft.fftfreq(b.shape[0])[:, None] ** 2 + np.fft.fftfreq(b.shape[1])[None, :] ** 2
    return np.real(np.fft.ifft2(np.fft.fft2(b) * np.exp(-2 * (np.pi * sigma) ** 2 * k)))[:, pad:-pad]


def normal_map(h, relief, wrap=(0, 1), layer=None):
    """OpenGL tangent-space normal (green = up in the image) from a height map; central differences with wrap-around, so
    the map tiles exactly like the height. A 0.7 px blur first keeps single-pixel noise out of the relief."""
    h = blur_wrapped(h.astype(np.float64), 0.7, wrap)
    relief = relief * (STY_RELIEF[layer] if STYLIZED else 1.0)
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    dy_up = (np.roll(h, 1, 0) - np.roll(h, -1, 0)) * 0.5  # image row - 1 is up
    if wrap == (0,):  # ribbons: no wrap across, clamp at the sides
        dx[:, 0] = h[:, 1] - h[:, 0]
        dx[:, -1] = h[:, -1] - h[:, -2]
    nx, ny = -dx * relief, -dy_up * relief
    inv = 1 / np.sqrt(nx * nx + ny * ny + 1)
    return np.stack([nx * inv * 0.5 + 0.5, ny * inv * 0.5 + 0.5, inv * 0.5 + 0.5], -1)


def roughness_map(h, layer):
    """Dry layers stay rough (dirt 0.9, grass 0.82), a little lower on the raised parts; wet ground goes glossy in the hollows."""
    base = {'dirt': 0.9, 'mud': MUD_ROUGH, 'grass': 0.82}[layer]
    r = base + (0.5 - h) * (0.06 if STYLIZED else 0.12)
    if layer == 'mud':
        low = 1 - np.clip((h - 0.1) / 0.12, 0, 1)  # the lab's puddle band (TERRAIN_SETS.low)
        r = r + (PUDDLE_ROUGH - r) * low
    return np.clip(r, 0.04, 1.0)


def save_webp(a, path, mode, quality, lossless=False):
    retry_save(Image.fromarray((np.clip(a, 0, 1) * 255 + 0.5).astype(np.uint8), mode), path, format='WEBP', quality=quality, method=6, lossless=lossless)


def save_pbr(h, layer):
    save_webp(normal_map(h, RELIEF[layer], layer=layer), os.path.join(OUT, f'{PREFIX}-{layer}-n.webp'), 'RGB', 92, lossless=True)  # lossy chroma subsampling shows as seams in a normal
    if layer != 'ruts':
        save_webp(roughness_map(h, layer), os.path.join(OUT, f'{PREFIX}-{layer}-r.webp'), 'L', 85)
    nn = normal_map(h, RELIEF[layer], (0, 1) if layer != 'ruts' else (0,), layer)
    print(f'  {layer}: height std {h.std():.3f}, normal x std {(nn[..., 0] * 2 - 1).std():.3f}, y std {(nn[..., 1] * 2 - 1).std():.3f}')
    print(f'{PREFIX}-{layer}-n.webp' + ('' if layer == 'ruts' else f' + {PREFIX}-{layer}-r.webp'))


def tiling_check(layer):
    """3 x 3 repeat of a normal map (RGB as saved) for a seam check, in legacy/art-output/terrain-darkwood/_tiling."""
    d = os.path.join(SRC, '_tiling')
    os.makedirs(d, exist_ok=True)
    img = Image.open(os.path.join(OUT, f'{PREFIX}-{layer}-n.webp')).convert('RGB')
    a = np.tile(np.asarray(img), (3, 3, 1)) if layer != 'ruts' else np.tile(np.asarray(img), (3, 1, 1))
    out = Image.fromarray(a)
    out.thumbnail((1800, 1800), Image.LANCZOS)
    retry_save(out, os.path.join(d, f'{PREFIX.replace("-", "_")}_{layer}_normal_3x3.png'))


def cobble(path):
    """Portrait strip, road in the middle 60 %: crop that, make it repeat along v (the sides fade out by alpha, so the
    periodic decomposition may disturb them freely), flatten, alpha = ragged fade to both sides."""
    img = Image.open(path).convert('RGB')
    img = img.crop((round(img.width * 0.2), 0, round(img.width * 0.8), img.height))
    w = min(768, img.width)
    h = min(2048, round(img.height * w / img.width))
    img = img.resize((w, h), Image.LANCZOS)
    rgb = periodic(np.asarray(img, dtype=np.float32) / 255.0)
    rgb = flatten_wrapped(rgb, 40)
    hgt = sw.height_from(np.tile(rgb, (3, 3, 1)), 'dirt')[h:2 * h, w:2 * w]
    if STYLIZED:
        hgt = soft_height(hgt, 2.0, (0,))
    u = np.abs(np.linspace(-1, 1, w, dtype=np.float32))[None, :]
    n = moor.tile_noise(h, 24, 5)[:, :w] - 0.5  # rows wrap: the fade tiles along v as well
    alpha = sw.smoothstep(0.98, 0.62, u + n * 0.35)
    save_layer(rgb, hgt, 'ruts', alpha)
    retry_save(Image.fromarray((np.clip(normal_map(hgt, RELIEF['ruts'], (0,), 'ruts'), 0, 1) * 255 + 0.5).astype(np.uint8)), os.path.join(OUT, f'{PREFIX}-ruts-n.webp'), format='WEBP', lossless=True, method=6)
    nn = normal_map(hgt, RELIEF['ruts'], (0,), 'ruts')
    print(f'  ruts: height std {hgt.std():.3f}, normal x std {(nn[..., 0] * 2 - 1).std():.3f}, y std {(nn[..., 1] * 2 - 1).std():.3f}')
    print(f'{PREFIX}-ruts-n.webp (wraps along v only)')


def register():
    """Replace the darkwood-* entries of samples.json (inserted after terrain3-water, a line that keeps its comma)."""
    credit = ('Generated with Codex image generation after a Diablo Immortal Dark Wood screenshot (' + SOURCE + '), '
              'made tileable by scripts/prepare-terrain-darkwood.py')
    items = [('dirt', 'loam ground'), ('mud', 'wet ground'), ('grass', 'shade grass')]
    entries = []
    for layer, role in items:
        for suffix, kind in (('', 'albedo'), ('-h', 'height')):
            entries.append((f'{PREFIX}-{layer}{suffix}', f'{LABEL} · {role} ({kind})'))
        entries.append((f'{PREFIX}-{layer}-n', f'{LABEL} · {role} (normal)'))
        entries.append((f'{PREFIX}-{layer}-r', f'{LABEL} · {role} (roughness)'))
    entries += [(f'{PREFIX}-ruts', f'{LABEL} · cobble path (albedo + alpha)'), (f'{PREFIX}-ruts-h', f'{LABEL} · cobble path (height)'), (f'{PREFIX}-ruts-n', f'{LABEL} · cobble path (normal)'),
                (f'{PREFIX}-grass-cards', f'{LABEL} · grass cards (RGBA atlas)')]
    ext = lambda i: 'webp' if i.endswith(('-n', '-r')) else 'png'
    lines = [f'    {{"id": "{i}", "name": {json.dumps(n, ensure_ascii=False)}, "kind": "texture", "file": "samples/{i}.{ext(i)}", "license": "Project-internal", '
             f'"credit": "{credit}", "source": "{SOURCE}"}},' for i, n in entries]
    text = open(MANIFEST, encoding='utf-8').read().split('\n')
    ids = {i for i, _ in entries}
    text = [l for l in text if not any(f'"id": "{i}"' in l for i in ids)]
    at = next(i for i, l in enumerate(text) if '"id": "terrain3-water"' in l) + 1
    text[at:at] = lines
    for attempt in range(40):  # the drive sometimes answers EINVAL for a moment
        try:
            with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
                f.write('\n'.join(text))
            break
        except OSError:
            if attempt == 39:
                raise
            time.sleep(0.5)
    print(f'{len(lines)} samples.json entries written')


def main():
    global PREFIX, STYLIZED, LABEL, SOURCE, PUDDLE_ROUGH, MUD_ROUGH
    args = sys.argv[1:]
    if '--prefix' in args:
        i = args.index('--prefix')
        PREFIX = args[i + 1]
        del args[i:i + 2]
    if '--label' in args:
        i = args.index('--label')
        LABEL = args[i + 1]
        del args[i:i + 2]
    path_file = None
    if '--path' in args:  # path strip from another file (the stylized set's path is repainted separately)
        i = args.index('--path')
        path_file = args[i + 1]
        del args[i:i + 2]
    if '--puddle-rough' in args:
        i = args.index('--puddle-rough')
        PUDDLE_ROUGH = float(args[i + 1])
        del args[i:i + 2]
    if '--mud-rough' in args:
        i = args.index('--mud-rough')
        MUD_ROUGH = float(args[i + 1])
        del args[i:i + 2]
    if '--stylized' in args:
        STYLIZED = True
        args.remove('--stylized')
    moor.PREFIX = PREFIX
    src = args[0] if args else SRC
    if args:
        SOURCE = os.path.relpath(os.path.abspath(src), os.path.join(ROOT, '..')).replace(os.sep, '/')
    p = lambda name: os.path.join(src, name)
    os.makedirs(OUT, exist_ok=True)
    for layer, name in (('dirt', 'dirt_loam.png'), ('mud', 'mud_wet.png'), ('grass', 'grass_shade.png')):
        if not os.path.exists(p(name)):
            sys.exit(f'missing {p(name)}')
        rgb, h = process(p(name), layer)
        save_layer(rgb, h, layer)
        save_pbr(h, layer)
        lin = (rgb ** 2.2).reshape(-1, 3).mean(0)
        if layer == 'grass':
            print('  grass tuftColor:', '[' + ', '.join(f'[{c * 0.55:.3f}, {c * 0.35:.3f}]' for c in lin) + ']')
    path_file = path_file or p('path_cobble.png')
    if os.path.exists(path_file):
        cobble(path_file)
    if os.path.exists(p('grass_cards.png')):
        moor.grass_cards(p('grass_cards.png'))
    for layer in ('dirt', 'mud', 'grass', 'ruts'):
        if os.path.exists(os.path.join(OUT, f'{PREFIX}-{layer}-n.webp')):
            tiling_check(layer)
    register()


if __name__ == '__main__':
    main()

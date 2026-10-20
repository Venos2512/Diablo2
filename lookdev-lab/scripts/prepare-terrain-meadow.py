"""
"D2R lush grass" terrain set from the Codex tiles in art-output/terrain-grass-d2r (made after a D2R gameplay screenshot).

  python -I scripts/prepare-terrain-meadow.py

Writes assets/samples/terrain4-<layer>.webp (albedo) + terrain4-<layer>-h.webp (height) and the matching entries in
src/assets/samples.json (in place, after the terrain3-water line):
  grass = the six grass_*.png patterns (not grass_dirt.png), each 512 px (3.5 m) repeated 2 x 2, mixed by tileable noise into one
          1024 px tile (7 m), seams following the height, so a repeat holds several grass looks in natural patches
  dirt  = grass_dirt.png (sparse tufts) mixed with soil.png the same way (7 m)
  mud   = damp.png (3.5 m)
Seams: periodic + smooth decomposition (the tiles are nearly seamless already; the half-shift cross-fade of
prepare-terrain-swatches.make_seamless prints a square ring into every repeat). Large-scale light is flattened on a
3 x 3 wrap so the flattening is periodic too.
"""
import glob
import importlib.util
import os
import time

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, '..', 'art-output', 'terrain-grass-d2r')
OUT = os.path.join(ROOT, 'assets', 'samples')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
PREFIX = 'terrain4'
CREDIT = ('Generated with Codex image generation after a D2R gameplay screenshot (art-output/terrain-grass-d2r), made tileable '
          'and mixed by scripts/prepare-terrain-meadow.py')


def module(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(os.path.dirname(__file__), file))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


sw = module('swatches', 'prepare-terrain-swatches.py')
moor = module('moor', 'prepare-terrain-moor.py')  # tile_noise(), mix()


def periodic(img):
    """Periodic component of the periodic + smooth decomposition (Moisan 2011), per channel."""
    h, w = img.shape[:2]
    q = np.cos(2 * np.pi * np.arange(h) / h)[:, None]
    r = np.cos(2 * np.pi * np.arange(w) / w)[None, :]
    den = 2 * q + 2 * r - 4
    den[0, 0] = 1
    out = np.empty_like(img)
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


def prepared(path, size, layer):
    img = Image.open(path).convert('RGB').resize((size, size), Image.LANCZOS)
    rgb = periodic(np.asarray(img, dtype=np.float32) / 255.0)
    big = sw.flatten_lighting(np.tile(rgb, (3, 3, 1)), sigma=size / 18)
    rgb = big[size:2 * size, size:2 * size]
    h = sw.height_from(np.tile(rgb, (3, 3, 1)), layer)[size:2 * size, size:2 * size]
    return rgb.astype(np.float32), h.astype(np.float32)


def mixed(paths, layer, seed, pull, cells):
    """Each pattern at 512 px, colours pulled `pull` toward the patterns' common mean / spread (keeps some light /
    dark patch variety like the reference); every pattern in all four quarter turns, repeated 2 x 2, mixed into one
    1024 px tile. The turns matter: with one copy per pattern its clumps sat on the same 3.5 m lattice in every patch."""
    tiles = [prepared(p, 512, layer) for p in paths]
    mean = np.mean([t[0].mean((0, 1)) for t in tiles], 0)
    std = np.mean([t[0].std((0, 1)) for t in tiles], 0)
    tiles = [(rgb * (1 - pull) + ((rgb - rgb.mean((0, 1))) / (rgb.std((0, 1)) + 1e-6) * std + mean) * pull, h) for rgb, h in tiles]
    tiles = [(np.tile(np.rot90(rgb, k), (2, 2, 1)), np.tile(np.rot90(h, k), (2, 2))) for rgb, h in tiles for k in range(4)]
    return patch_mix(tiles, 1024, cells, seed)


def patch_mix(layers, size, cells, seed, sharp=140.0, height_bias=0.04):
    """Like prepare-terrain-moor.mix(), but the noise decides and the height only bends the seams: there the height
    (repeating every 3.5 m) outweighed the noise, so the patches themselves fell on a 3.5 m lattice, and its soft
    softmax averaged many patterns into a smudge (top-two score gap ~0.012): a sharp softmax keeps one pattern per pixel
    except along the seams."""
    noise = [moor.tile_noise(size, cells, seed + i) for i in range(len(layers))]
    noise = [(n - n.mean()) / (n.std() + 1e-6) * 0.1 for n in noise]  # tanh-squashed noise: re-spread to a known range
    scores = np.stack([n + l[1] * height_bias for n, l in zip(noise, layers)])
    w = np.exp((scores - scores.max(0)) * sharp)
    w /= w.sum(0)
    rgb = sum(w[i][..., None] * l[0] for i, l in enumerate(layers))
    h = sum(w[i] * l[1] for i, l in enumerate(layers))
    return rgb, h


def save(img, path, **kw):
    for attempt in range(20):  # writes on this drive sometimes fail with EINVAL for a moment
        try:
            return img.save(path, **kw)
        except OSError:
            if attempt == 19:
                raise
            time.sleep(0.5)


ROLES = {'grass': 'grass patch mix', 'dirt': 'sparse grass + soil', 'mud': 'damp ground + puddles'}
lines = []
total = 0
layers = {
    'grass': mixed(sorted(g for g in glob.glob(os.path.join(SRC, 'grass_*.png')) if not g.endswith('grass_dirt.png')), 'grass', 31, 0.7, 4),
    'dirt': mixed([os.path.join(SRC, 'grass_dirt.png'), os.path.join(SRC, 'soil.png')], 'dirt', 47, 0.2, 4),
    'mud': prepared(os.path.join(SRC, 'damp.png'), 512, 'mud'),
}
for layer, (rgb, h) in layers.items():
    for suffix, data, kind, q in (('', rgb, 'albedo', 82), ('-h', h, 'height', 72)):
        sid = f'{PREFIX}-{layer}{suffix}'
        path = os.path.join(OUT, sid + '.webp')
        save(Image.fromarray((np.clip(data, 0, 1) * 255 + 0.5).astype(np.uint8)), path, quality=q, method=6)
        total += os.path.getsize(path)
        lines.append(f'    {{"id": "{sid}", "name": "D2R lush grass · {ROLES[layer]} ({kind})", "kind": "texture", '
                     f'"file": "samples/{sid}.webp", "license": "Project-internal", "credit": "{CREDIT}", '
                     f'"source": "art-output/terrain-grass-d2r"}},')
        print(f'{sid:22s} {data.shape[1]} px')
    if layer == 'grass':
        lin = (np.clip(rgb, 0, 1) ** 2.2).reshape(-1, 3).mean(0)
        print('  tuftColor:', [[round(float(c) * 0.55, 3), round(float(c) * 0.35, 3)] for c in lin])

text = open(MANIFEST, encoding='utf-8').read().split('\n')
text = [l for l in text if f'"id": "{PREFIX}-' not in l]
at = next(i for i, l in enumerate(text) if '"id": "terrain3-water"' in l) + 1  # terrain3-grass-cards may close the list
text[at:at] = lines
for attempt in range(20):
    try:
        with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
            f.write('\n'.join(text))
        break
    except OSError:
        if attempt == 19:
            raise
        time.sleep(0.5)
print(f'{len(lines)} textures, {total / 1048576:.2f} MB, manifest entries written')

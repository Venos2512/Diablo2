"""Build the "D2R moor" terrain set from the generated tiles in art-direction/reference/terrain-moor.

Usage:  python -I scripts/prepare-terrain-moor.py [source dir]

Writes assets/samples/terrain3-<layer>.png (albedo) + terrain3-<layer>-h.png (height) for the three splat layers:
  dirt  = dry dirt and the grass → dirt transition tile, mixed by a tileable noise mask
  mud   = wet dirt with puddles
  grass = every grass_*.png pattern mixed into one larger tile (2 × 2 repeats of each pattern, patches
          chosen by tileable noise, seams following the height), so one repeat holds several grass looks
and two ribbon textures for meshes laid along the scene's curves:
  terrain3-ruts.png (RGBA: alpha fades the road out into the grass at the sides, tiles along v only) + -h
  terrain3-water.png (shallow creek water, tiles both ways)
Every source is flattened (large-scale light removed) and made seamless again before use, so tiles from an
image generator that are only nearly seamless still repeat cleanly.
"""
import glob
import importlib.util
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'samples')
SRC = os.path.join(ROOT, '..', 'art-direction', 'reference', 'terrain-moor')
PREFIX = 'terrain3'

spec = importlib.util.spec_from_file_location('swatches', os.path.join(os.path.dirname(__file__), 'prepare-terrain-swatches.py'))
sw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sw)


def load(path, size):
    img = Image.open(path).convert('RGB').resize((size, size), Image.LANCZOS)
    return sw.flatten_lighting(np.asarray(img, dtype=np.float32) / 255.0, sigma=size / 18)


def seamless(rgb, height):
    both = sw.make_seamless(np.concatenate([rgb, height[..., None]], axis=-1))
    return both[..., :3], both[..., 3]


def tile_noise(size, cells, seed):
    """Tileable smooth noise in 0..1: white noise low-passed in the frequency domain (wraps by construction)."""
    rng = np.random.default_rng(seed)
    f = np.fft.fft2(rng.standard_normal((size, size)))
    k = np.fft.fftfreq(size) * size
    r2 = k[:, None] ** 2 + k[None, :] ** 2
    n = np.real(np.fft.ifft2(f * np.exp(-r2 / (2 * (cells / 2.0) ** 2))))
    n = (n - n.mean()) / (n.std() + 1e-6)
    return 0.5 + 0.5 * np.tanh(n * 0.8)


def mix(layers, size, cells, seed, sharp=10.0, height_bias=0.6):
    """Soft per-pixel choice between [(rgb, h), ...]: each gets a tileable noise score (+ its height, so the
    seam runs around clumps); a softmax with `sharp` turns scores into weights."""
    scores = np.stack([tile_noise(size, cells, seed + i) + h * height_bias for i, (_, h) in enumerate(layers)])
    w = np.exp((scores - scores.max(0)) * sharp)
    w /= w.sum(0)
    rgb = sum(w[i][..., None] * l[0] for i, l in enumerate(layers))
    h = sum(w[i] * l[1] for i, l in enumerate(layers))
    return rgb, h


def save(rgb, h, name, alpha=None):
    a = np.clip(rgb, 0, 1)
    if alpha is not None:
        a = np.concatenate([a, np.clip(alpha, 0, 1)[..., None]], axis=-1)
    Image.fromarray((a * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f'{PREFIX}-{name}.png'), optimize=True)
    if h is not None:
        Image.fromarray((np.clip(h, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f'{PREFIX}-{name}-h.png'), optimize=True)
    print(f'{PREFIX}-{name}.png  {rgb.shape[1]} px' + ('  + height' if h is not None else '') + ('  + alpha' if alpha is not None else ''))


def prepared(path, size, layer):
    rgb = load(path, size)
    return seamless(rgb, sw.height_from(rgb, layer))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else SRC
    p = lambda name: os.path.join(src, name)
    os.makedirs(OUT, exist_ok=True)

    # Grass: every pattern at 1024, repeated 2 × 2 in a 2048 tile, patches ~2-3 per pattern per tile.
    grasses = sorted(g for g in glob.glob(p('grass_*.png')) if not g.endswith('grass_cards.png'))  # cards: separate atlas
    if not grasses:
        sys.exit(f'no grass_*.png in {src}')
    tiles = [prepared(g, 1024, 'grass') for g in grasses]
    # Pull each pattern's colour 60 % toward the patterns' common mean / spread: variety in shape, not in hue.
    mean = np.mean([t[0].mean((0, 1)) for t in tiles], 0)
    std = np.mean([t[0].std((0, 1)) for t in tiles], 0)
    tiles = [(rgb * 0.4 + ((rgb - rgb.mean((0, 1))) / (rgb.std((0, 1)) + 1e-6) * std + mean) * 0.6, h) for rgb, h in tiles]
    tiles = [(np.tile(rgb, (2, 2, 1)), np.tile(h, (2, 2))) for rgb, h in tiles]
    rgb, h = mix(tiles, 2048, 5, 11)
    save(rgb, h, 'grass')
    print('  grass patterns:', ', '.join(os.path.basename(g) for g in grasses))

    # Dirt: dry dirt with patches of the sparse-grass transition.
    dirt = [prepared(p(n), 1024, 'dirt') for n in ('dirt_dry.png', 'transition_grass_dirt.png') if os.path.exists(p(n))]
    rgb, h = mix(dirt, 1024, 3, 23, sharp=8) if len(dirt) > 1 else dirt[0]
    save(rgb, h, 'dirt')

    rgb, h = prepared(p('mud_wet.png'), 1024, 'mud')
    save(rgb, h, 'mud')

    if os.path.exists(p('water_shallow.png')):
        rgb = load(p('water_shallow.png'), 1024)
        rgb, _ = seamless(rgb, np.zeros(rgb.shape[:2], np.float32))
        save(rgb, None, 'water')

    # Ruts: tiles along v (rows) only. Seam fix: cross-fade with a copy rolled by half the height.
    if os.path.exists(p('ruts_road.png')):
        # Middle 60 % of the width (road + its grassy shoulders), near square pixels: 0.6 × 1 of the image → 512 × 1024.
        img = Image.open(p('ruts_road.png')).convert('RGB')
        img = img.crop((round(img.width * 0.2), 0, round(img.width * 0.8), img.height)).resize((512, 1024), Image.LANCZOS)
        rgb = sw.flatten_lighting(np.asarray(img, dtype=np.float32) / 255.0, sigma=40)
        h = sw.height_from(rgb, 'mud')
        both = np.concatenate([rgb, h[..., None]], axis=-1)
        H = both.shape[0]
        y = np.arange(H, dtype=np.float32)
        edge = np.minimum(y, H - 1 - y) / (H / 2)
        bias = (sw.luminance(rgb) - sw.luminance(np.roll(rgb, H // 2, 0))) * 0.6
        w = sw.smoothstep(0.15, 0.55, edge[:, None] + bias * 0.5)
        both = both * w[..., None] + np.roll(both, H // 2, 0) * (1 - w[..., None])
        # Alpha: solid in the middle 60 %, ragged fade to the sides (noise tiles along v as well).
        u = np.abs(np.linspace(-1, 1, both.shape[1], dtype=np.float32))[None, :]
        n = tile_noise(H, 24, 5)[:, :both.shape[1]] - 0.5  # rows wrap: the fade tiles along v too
        alpha = sw.smoothstep(0.98, 0.62, u + n * 0.35)
        save(both[..., :3], both[..., 3], 'ruts', alpha)

    if os.path.exists(p('grass_cards.png')):
        grass_cards(p('grass_cards.png'))


def grass_cards(path):
    """2 × 2 tufts on magenta → RGBA atlas (512 px cells), each tuft scaled to fit and standing on its cell bottom.
    Alpha from how magenta a pixel is; magenta spill pulled out of the edges; colour bled into the transparent
    area so mipmaps do not pick up a dark or pink fringe."""
    img = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
    H, W = img.shape[:2]
    out = np.zeros((1024, 1024, 4), np.float32)
    for q in range(4):
        cell = img[(q // 2) * H // 2:(q // 2 + 1) * H // 2, (q % 2) * W // 2:(q % 2 + 1) * W // 2]
        r, g, b = cell[..., 0], cell[..., 1], cell[..., 2]
        m = np.minimum(r, b) - g
        alpha = 1.0 - sw.smoothstep(25.0, 110.0, m)
        spill = np.maximum(0.0, b - g * 0.8)  # despill: plants carry little blue; blue above that is magenta, take it out of R too
        rgb = np.stack([np.maximum(0.0, r - spill), g, b - spill], -1)
        ys, xs = np.nonzero(alpha > 0.3)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.concatenate([rgb, alpha[..., None] * 255.0], -1)[y0:y1, x0:x1]
        tile = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')
        scale = min(500 / tile.width, 500 / tile.height)
        tile = tile.resize((max(1, round(tile.width * scale)), max(1, round(tile.height * scale))), Image.LANCZOS)
        a = np.asarray(tile, dtype=np.float32) / 255.0
        ox = (q % 2) * 512 + (512 - tile.width) // 2
        oy = (q // 2) * 512 + 512 - tile.height
        out[oy:oy + tile.height, ox:ox + tile.width] = a
    # Bleed: transparent texels take the alpha-weighted blurred colour of their neighbours (wide → narrow).
    def blur(a, r):  # three box passes per axis ≈ gaussian (PIL cannot blur float images)
        for axis in (0, 1):
            for _ in range(3):
                c = np.cumsum(np.pad(a, [(r + 1, r) if k == axis else (0, 0) for k in range(2)], mode='edge'), axis=axis)
                a = (np.take(c, range(2 * r + 1, c.shape[axis]), axis=axis) - np.take(c, range(0, c.shape[axis] - 2 * r - 1), axis=axis)) / (2 * r + 1)
        return a
    alpha = out[..., 3]
    fill = np.zeros_like(out[..., :3])
    for radius in (48, 16, 4):
        den = blur(alpha, radius)
        num = np.stack([blur(out[..., c] * alpha, radius) for c in range(3)], -1)
        ok = den > 1e-3
        fill[ok] = num[ok] / den[ok][:, None]
    out[..., :3] = np.where(alpha[..., None] < 0.5, fill * (1 - alpha[..., None]) + out[..., :3] * alpha[..., None], out[..., :3])
    Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(os.path.join(OUT, f'{PREFIX}-grass-cards.png'), optimize=True)
    print(f'{PREFIX}-grass-cards.png  1024 px RGBA (2 x 2 tufts)')


if __name__ == '__main__':
    main()

"""Make the generated biome tiles repeat cleanly and build a review sheet.

  python -I process.py            -> <biome>/seamless/<layer>.png (1024 px) + <biome>/seamless/<layer>-h.png (height)
                                     + biomes_contact.png (each tile shown 2 x 2 so seams show) + biomes_swatch.png

Seams: periodic + smooth decomposition (periodic() below), then large-scale light is flattened on a wrapped copy with the
lab helpers (lookdev-lab/scripts/prepare-terrain-swatches.py), so near-seamless generator output repeats without lines.
"""
import importlib.util
import os
import sys
import time

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.join(HERE, '..', '..', '..', 'lookdev-lab', 'scripts', 'prepare-terrain-swatches.py')
spec = importlib.util.spec_from_file_location('swatches', LAB)
sw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sw)

sys.path.insert(0, HERE)
from make_tasks import BIOMES  # noqa: E402

LAYERS = ['dirt', 'mud', 'grass']
SIZE = 1024
CELL = 300  # contact sheet: one 2 x 2 preview per tile


def periodic(img):
    """Periodic component of the periodic + smooth decomposition (Moisan 2011), per channel: subtracts the smooth
    image that carries the jump across the tile border, so the tile wraps without a seam while every detail stays.
    The generated tiles are already nearly seamless; sw.make_seamless (half-shift cross-fade along a square ring)
    printed that ring into every repeat, which read as a square grid on the ground."""
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
    n = rgb.shape[0]
    big = sw.flatten_lighting(np.tile(rgb, (3, 3, 1)), sigma=sigma)
    return big[n:2 * n, n:2 * n]


def process(path, layer):
    img = Image.open(path).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    rgb = periodic(np.asarray(img, dtype=np.float32) / 255.0)
    rgb = flatten_wrapped(rgb, SIZE / 18)
    n = SIZE
    h = sw.height_from(np.tile(rgb, (3, 3, 1)), layer)[n:2 * n, n:2 * n]
    return rgb, h


def save(img, path):
    """PIL save with retries: writes on this drive sometimes fail with EINVAL for a moment (file briefly locked)."""
    for attempt in range(20):
        try:
            return img.save(path)
        except OSError:
            if attempt == 19:
                raise
            time.sleep(0.5)


def to_img(a):
    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8))


try:
    font = ImageFont.truetype('arial.ttf', 20)
except OSError:
    font = ImageFont.load_default()

rows = []
for biome in BIOMES:
    out = os.path.join(HERE, biome, 'seamless')
    os.makedirs(out, exist_ok=True)
    row = []
    for layer in LAYERS:
        src = os.path.join(HERE, biome, layer + '.png')
        if not os.path.exists(src):
            row.append(None)
            continue
        rgb, h = process(src, layer)
        img = to_img(rgb)
        save(img, os.path.join(out, layer + '.png'))
        save(to_img(h), os.path.join(out, layer + '-h.png'))
        small = img.resize((CELL // 2, CELL // 2), Image.LANCZOS)
        tiled = Image.new('RGB', (CELL, CELL))
        for y in range(2):
            for x in range(2):
                tiled.paste(small, (x * CELL // 2, y * CELL // 2))
        row.append(tiled)
        print(f'{biome:20s} {layer:6s} mean {np.asarray(img).reshape(-1, 3).mean(0).round().astype(int)}')
    rows.append((biome, row))

LABEL = 220
pad = 10
sheet = Image.new('RGB', (LABEL + 3 * (CELL + pad) + pad, len(rows) * (CELL + pad) + pad + 30), (24, 24, 24))
d = ImageDraw.Draw(sheet)
for i, name in enumerate(['dirt (base)', 'mud (wet)', 'grass (cover)']):
    d.text((LABEL + pad + i * (CELL + pad), 6), name, fill=(200, 200, 200), font=font)
for r, (biome, row) in enumerate(rows):
    y = 30 + pad + r * (CELL + pad)
    d.text((12, y + CELL // 2 - 10), biome.replace('_', ' '), fill=(220, 210, 190), font=font)
    for c, tile in enumerate(row):
        if tile:
            sheet.paste(tile, (LABEL + pad + c * (CELL + pad), y))
save(sheet, os.path.join(HERE, 'biomes_contact.png'))
print('saved biomes_contact.png')

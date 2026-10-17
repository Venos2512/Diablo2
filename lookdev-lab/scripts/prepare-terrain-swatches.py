"""Cut the three painted terrain swatches out of a concept sheet and turn them into tileable layer textures.

Usage:  python -I scripts/prepare-terrain-swatches.py <concept.png> [--boxes x0,y0,x1,y1;...]
        python -I scripts/prepare-terrain-swatches.py --tiles dirt.png,mud.png,grass.png --prefix terrain2

Writes assets/samples/terrain-<layer>.png (albedo, RGB) and terrain-<layer>-h.png (height, grey) for
layer = mud (top swatch: wet dirt with puddles), grass (middle), dirt (bottom: dry soil with sparse grass).
The scene loads them as the "Painted" terrain set (src/env/terrain.js): normal and ORM maps are derived in
the browser from the height, the height also drives the height-based blend between layers.

Before anything else the swatch's large-scale lighting is flattened (see flatten_lighting), otherwise its painted
light gradient becomes visible stripes when the tile repeats.
Seamless tiling: the swatch is cross-faded with a copy shifted by half a tile, the blend weight follows
the distance to the tile edge and is biased by luminance so the seam follows shapes (leaves, clods)
instead of a soft ghosted band.
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'assets', 'samples')
SIZE = 512
# Default boxes for the moor concept sheet (1672 x 941), 4 px inside the swatch frames.
BOXES = {'mud': (142, 64, 400, 305), 'grass': (142, 335, 400, 585), 'dirt': (142, 617, 400, 867)}


def luminance(rgb):
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def make_seamless(img):
    """img: float32 HxWxC in 0..1 (same size both axes after resize)."""
    h, w = img.shape[:2]
    shifted = np.roll(img, (h // 2, w // 2), axis=(0, 1))
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    edge = np.minimum(np.minimum(x, w - 1 - x) / (w / 2), np.minimum(y, h - 1 - y) / (h / 2))
    bias = (luminance(img[..., :3]) - luminance(shifted[..., :3])) * 0.6
    weight = smoothstep(0.15, 0.55, edge + bias * smoothstep(0.0, 0.5, edge) * smoothstep(1.0, 0.5, edge))
    return img * weight[..., None] + shifted * (1.0 - weight[..., None])


def flatten_lighting(rgb, sigma=28, strength=0.85):
    """Divide out the swatch's large-scale light gradient (painted key light, vignetting): a gradient that is
    fine in one painting turns into stripes once the tile repeats every few metres."""
    lum = luminance(rgb)
    broad = np.asarray(Image.fromarray(np.clip(lum * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma)), dtype=np.float32) / 255.0
    gain = np.clip((lum.mean() / np.maximum(broad, 1e-3)) ** strength, 0.6, 1.7)
    return np.clip(rgb * gain[..., None], 0.0, 1.0)


def height_from(rgb, layer):
    lum = luminance(rgb)
    blur = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32) / 255.0
    broad = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10)), dtype=np.float32) / 255.0
    local = blur - broad  # detail relief, independent of large lighting gradients in the painting
    h = 0.5 + local * 2.2
    if layer == 'grass':
        # Leaves read as the tallest thing on the ground: brighter, greener = higher.
        green = np.clip(rgb[..., 1] - (rgb[..., 0] + rgb[..., 2]) * 0.5, 0, 1)
        h = h * 0.6 + smoothstep(0.0, 0.12, green) * 0.45
    if layer == 'mud':
        # Puddles: bright grey or blue-grey patches (sky reflection) → lowest, flat.
        sat = rgb.max(-1) - rgb.min(-1)
        # grey (sky reflection) or bluish (B > R; mud itself is always R > B), and brighter than the surroundings
        tint = np.maximum(smoothstep(0.06, 0.03, sat), smoothstep(-0.01, 0.03, rgb[..., 2] - rgb[..., 0]))
        puddle = tint * smoothstep(broad.mean() * 0.9, broad.mean() * 1.4, blur)
        puddle = np.asarray(Image.fromarray((puddle * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32) / 255.0
        h = h * (1.0 - puddle) + 0.08 * puddle
    return np.clip(h, 0.0, 1.0)


def write_layer(image, layer, prefix, label):
    rgb = flatten_lighting(np.asarray(image.resize((SIZE, SIZE), Image.LANCZOS), dtype=np.float32) / 255.0)
    height = height_from(rgb, layer)
    both = make_seamless(np.concatenate([rgb, height[..., None]], axis=-1))
    Image.fromarray((np.clip(both[..., :3], 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f'{prefix}-{layer}.png'), optimize=True)
    Image.fromarray((np.clip(both[..., 3], 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(OUT, f'{prefix}-{layer}-h.png'), optimize=True)
    print(f'{layer}: {label} -> {prefix}-{layer}.png + {prefix}-{layer}-h.png ({SIZE} px)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('concept', nargs='?', help='concept sheet holding the three swatches (see BOXES)')
    ap.add_argument('--boxes', help='mud;grass;dirt boxes as x0,y0,x1,y1 separated by ;')
    ap.add_argument('--tiles', help='three separate tile images instead of a sheet: dirt,mud,grass (comma-separated paths)')
    ap.add_argument('--prefix', default='terrain', help='output name prefix (assets/samples/<prefix>-<layer>.png)')
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if args.tiles:
        for layer, path in zip(['dirt', 'mud', 'grass'], args.tiles.split(',')):
            write_layer(Image.open(path.strip()).convert('RGB'), layer, args.prefix, os.path.basename(path))
        return
    if not args.concept:
        ap.error('give a concept sheet or --tiles')
    boxes = dict(BOXES)
    if args.boxes:
        for name, spec in zip(['mud', 'grass', 'dirt'], args.boxes.split(';')):
            boxes[name] = tuple(int(v) for v in spec.split(','))
    sheet = Image.open(args.concept).convert('RGB')
    for layer, box in boxes.items():
        write_layer(sheet.crop(box), layer, args.prefix, f'box {box}')


if __name__ == '__main__':
    main()

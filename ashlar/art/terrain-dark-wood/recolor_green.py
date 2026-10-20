"""Recolour the approved stylized2 tiles from Immortal blue-grey to a greener D2 Act I forest palette.
Lightness and every brush stroke stay; only hue/chroma move (CIELAB): each pixel's hue is rotated so the tile's mean
hue lands on the layer's target, chroma scaled to the target mean. grass_cards keeps its magenta key.
  python -I recolor_green.py  -> stylized2_green/<same names>.png + _review_green.jpg
"""
import os
import numpy as np
from PIL import Image
from skimage import color

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, DST = os.path.join(HERE, 'stylized2'), os.path.join(HERE, 'stylized2_green')
# layer: (target hue deg in Lab ab, target mean chroma, lightness gain)
TARGET = {
    'dirt_loam': (122, 10, 1.0),     # dark olive-green loam (v1 95 read brown in the scene)
    'mud_wet': (128, 9, 0.95),      # dark moss-olive mud
    'grass_shade': (128, 16, 1.0),  # forest green
    'path_cobble': (115, 6, 1.0),   # grey-olive stones, greener grass sides follow via hue rotation
    'grass_cards': (125, 18, 1.0),
}


SPREAD = 0.25


def recolor(rgb, hue, chroma, lgain, mask=None):
    lab = color.rgb2lab(rgb)
    a, b = lab[..., 1], lab[..., 2]
    sel = np.ones(a.shape, bool) if mask is None else mask
    c = np.hypot(a, b)
    h = np.arctan2(b, a)
    mh = np.angle(np.mean(np.exp(1j * h[sel]) * c[sel]))
    # Keep only a quarter of the source hue spread around the target: a straight rotation turned the tiles' small
    # blue/teal differences into pink and orange strokes.
    dev = np.angle(np.exp(1j * (h - mh)))
    h2 = np.deg2rad(hue) + SPREAD * dev
    c2 = c * (chroma / max(c[sel].mean(), 1e-3))
    out = lab.copy()
    out[..., 0] = np.clip(lab[..., 0] * lgain, 0, 100)
    out[..., 1] = c2 * np.cos(h2)
    out[..., 2] = c2 * np.sin(h2)
    res = np.clip(color.lab2rgb(out), 0, 1)
    if mask is not None:
        res[~mask] = rgb[~mask]
    return res


def save(img, path):
    for i in range(5):
        try:
            Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(path)
            return
        except OSError:
            if i == 4:
                raise


os.makedirs(DST, exist_ok=True)
tiles = []
for name, (hue, chroma, lg) in TARGET.items():
    rgb = np.asarray(Image.open(os.path.join(SRC, name + '.png')).convert('RGB'), dtype=np.float64) / 255
    mask = None
    if name == 'grass_cards':  # keep the magenta key out of the statistics and the output
        r, g, bl = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        mask = ~((r - g > 0.25) & (bl - g > 0.25))
    out = recolor(rgb, hue, chroma, lg, mask)
    save(out, os.path.join(DST, name + '.png'))
    tiles.append(Image.fromarray((out * 255).astype(np.uint8)).resize((300, 300 if name != 'path_cobble' else 450)))
sheet = Image.new('RGB', (1500, 450))
for i, t in enumerate(tiles):
    sheet.paste(t, (i * 300, 0))
sheet.save(os.path.join(HERE, '_review_green.jpg'), quality=88)

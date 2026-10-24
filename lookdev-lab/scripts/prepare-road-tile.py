"""Cobble road TILE (repeats in both u and v) for the Dark Wood path ribbon, cut from the approved stylized2 path strip.

Usage:  python -I scripts/prepare-road-tile.py [--debug DIR] [--moisan]
        --debug DIR   writes 3 x 3 repeat checks (colour + normal) and the seam overlay into DIR
        --moisan      cut with the periodic + smooth decomposition (Moisan 2011) instead of the seam cut, for comparison

Source: ashlar/art/textures/terrain-dark-wood/stylized2/path_cobble.png (1024 x 1536; the stones fill x ≈ 215..790, the rest is verge) and
stylized2_green/path_cobble.png (same strokes, recoloured: the cut is decided on the first and applied to both, pixel for pixel).
No texture is painted or generated here: only cut, joined and re-lit.

Making it repeat (periodic in both axes, no half-shift cross-fade: that prints a square grid):
  1. Windows are searched (x0, width, y0, height) whose opposite edges cross as little stone as possible; the strip's verge is
     dark soil, which reads as mortar, so a window may reach a little into it.
  2. Across: the right overlap strip is joined to the left one along a minimum-cost seam (dynamic programming per row; cost = colour
     difference of the two candidates + a penalty off the mortar ridges), so the wrap is exact and cuts along the grout where it can.
     Down: the same on rows, the seam path closed on itself over x.
  3. The painted light gradient is divided out on a wrapped 3 x 3 copy (a gradient turns into stripes when the tile repeats), then
     one gain matches the tile's mean (linear) brightness to the paved middle (alpha > 0.9) of the current path texture
     (darkwood-<set>-ruts.png): the road keeps its brightness.
  4. Normal map (OpenGL, lossless webp) from the tile's height exactly like the old set (prepare-terrain-darkwood.py normal_map, wrapped).
Measures (stone size in px, seam cost, brightness match) are printed; PX_PER_M below is the texel density the ribbon is laid out with.
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import filters, measure, morphology

sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
OUT = os.path.join(ROOT, 'assets', 'samples')
MANIFEST = os.path.join(ROOT, 'src', 'assets', 'samples.json')
ART = os.path.join(ROOT, '..', 'ashlar', 'art', 'textures', 'terrain-dark-wood')
SETS = [('darkwood-sty', 'stylized2', 'Dark Wood (stylized)'), ('darkwood-sty-green', 'stylized2_green', 'Dark Wood (stylized, green)')]
# Texel density of the tile on the ground. Set from the measured stones: the median stone (equivalent diameter) should be ≈ 0.5 m
# (0.28 H), the largest ≈ 1 m. See STONE_M below; the printed table is the proof.
PX_PER_M = 300.0
STONE_M = (0.45, 0.63)  # target range of the median paving stone (0.25-0.35 H of the 1.8 m character)


def load_module(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


dw = load_module('dw', 'prepare-terrain-darkwood.py')  # periodic(), flatten_wrapped(), soft_height(), normal_map(), retry_save()
dw.STYLIZED = True
sw = dw.sw


def lum(a):
    return a.mean(-1)


def ridges(rgb):
    """Mortar network 0..1 (dark ridges): where a seam may run without cutting a stone."""
    r = filters.sato(lum(rgb), sigmas=[2, 3, 4], black_ridges=True)
    return np.clip(r / np.percentile(r[:, 260:760], 95), 0, 1)


def seam_dp(cost, closed=False):
    """Minimum-cost 8-connected top-to-bottom path through cost (rows x cols) → column per row. closed: first and last row
    within one column of each other (a seam that wraps)."""
    h, w = cost.shape
    starts = range(w) if closed else [None]
    best, best_path = np.inf, None
    for s0 in starts:
        acc = cost.copy()
        if s0 is not None:
            acc[0, :] = np.inf
            acc[0, s0] = cost[0, s0]
        back = np.zeros((h, w), np.int8)
        for y in range(1, h):
            prev = acc[y - 1]
            cand = np.stack([np.r_[np.inf, prev[:-1]], prev, np.r_[prev[1:], np.inf]])
            k = cand.argmin(0)
            acc[y] = cost[y] + cand[k, np.arange(w)]
            back[y] = k - 1
        last = acc[-1].copy()
        if s0 is not None:
            mask = np.full(w, np.inf)
            mask[max(0, s0 - 1):s0 + 2] = 0
            last = last + mask
        x = int(last.argmin())
        total = float(last[x])
        if total >= best:
            continue
        path = np.zeros(h, np.int32)
        for y in range(h - 1, -1, -1):
            path[y] = x
            x += int(back[y, x])
        best, best_path = total, path
    return best_path, best


def cut_across(a, x0, width, ov, guide, mu):
    """Window a[:, x0:x0 + width + ov] → (h, width) periodic in x. Returns (tile, seam columns, mean seam cost)."""
    win = a[:, x0:x0 + width + ov]
    g = guide[:, x0:x0 + width + ov]
    left, right = win[:, :ov], win[:, width:width + ov]  # the same ov columns seen from the two sides of the wrap
    cost = ((left - right) ** 2).sum(-1) + mu * (1 - 0.5 * (g[:, :ov] + g[:, width:width + ov]))
    cost = ndi.uniform_filter(cost, size=(3, 1))
    path, total = seam_dp(cost)
    tile = win[:, :width].copy()
    cols = np.arange(ov)[None, :]
    use_right = cols < path[:, None]  # left of the seam: the continuation of the right edge
    tile[:, :ov] = np.where(use_right[..., None], right, left)
    return tile, path, total / a.shape[0]


def cut_down(a, y0, height, ov, guide, mu, closed=True):
    """Same along y on (h, w) a: rows, seam path closed over x. Returns (tile, seam rows, mean seam cost)."""
    t = np.transpose(a[y0:y0 + height + ov], (1, 0, 2))  # (w, rows, 3): rows become the 'across' axis
    g = guide[y0:y0 + height + ov].T
    left, right = t[:, :ov], t[:, height:height + ov]
    cost = ((left - right) ** 2).sum(-1) + mu * (1 - 0.5 * (g[:, :ov] + g[:, height:height + ov]))
    cost = ndi.uniform_filter(cost, size=(3, 1))
    path, total = seam_dp(cost, closed=closed)
    tile = t[:, :height].copy()
    cols = np.arange(ov)[None, :]
    tile[:, :ov] = np.where((cols < path[:, None])[..., None], right, left)
    return np.transpose(tile, (1, 0, 2)), path, total / a.shape[1]


def find_windows(a, guide, mu):
    """Search x0 / width and y0 / height with the cheapest seams. Returns the best (x0, width, ov, y0, height, ov2)."""
    ov = 70
    best = None
    for width in range(470, 561, 10):
        for x0 in range(215 - 30, 790 - width - ov + 31, 6):
            _, _, c = cut_across(a, x0, width, ov, guide, mu)
            if best is None or c < best[0]:
                best = (c, x0, width)
    _, x0, width = best
    tile, _, cu = cut_across(a, x0, width, ov, guide, mu)
    gt = guide[:, x0:x0 + width]
    ov2 = 110
    best = None
    for height in range(1250, 1536 - ov2 + 1, 20):
        for y0 in range(0, 1536 - height - ov2 + 1, 10):
            _, _, c = cut_down(tile, y0, height, ov2, gt, mu, closed=False)
            if best is None or c < best[0]:
                best = (c, y0, height)
    _, y0, height = best
    return x0, width, ov, y0, height, ov2


def apply_windows(a, win, guide, mu):
    x0, width, ov, y0, height, ov2 = win
    t, p1, c1 = cut_across(a, x0, width, ov, guide, mu)
    t2, p2, c2 = cut_down(t, y0, height, ov2, guide[:, x0:x0 + width], mu)
    return t2, (p1, p2), (c1, c2)


def moisan_cut(a, win):
    x0, width, _, y0, height, _ = win
    return dw.periodic(a[y0:y0 + height, x0:x0 + width])


def stones(rgb):
    """Stone regions of a (wrapped 3 x 3) tile from the mortar network → list of dicts (px). Fragments under 2500 px² and merged blobs (solidity < 0.8) are not counted."""
    h, w = rgb.shape[:2]
    big = np.tile(rgb, (3, 3, 1))
    r = filters.sato(lum(big), sigmas=[2, 3, 4], black_ridges=True)
    mortar = r > np.percentile(r, 85)
    mortar = morphology.remove_small_objects(mortar, 200)
    mortar = morphology.binary_closing(mortar, morphology.disk(2))
    stone = morphology.binary_opening(~mortar, morphology.disk(6))
    out = []
    for p in measure.regionprops(measure.label(stone)):
        cy, cx = p.centroid
        if h <= cy < 2 * h and w <= cx < 2 * w and p.area >= 2500 and p.solidity >= 0.8:  # solidity: two stones the mortar detector left joined are not one stone
            out.append({'eq': p.equivalent_diameter, 'major': p.major_axis_length, 'minor': p.minor_axis_length, 'area': p.area})
    return out, mortar[h:2 * h, w:2 * w]


def old_stone_mean(prefix):
    """Alpha-weighted mean linear colour of the paved middle (alpha > 0.9) of the current path texture."""
    a = np.asarray(Image.open(os.path.join(OUT, f'{prefix}-ruts.png')).convert('RGBA'), dtype=np.float32) / 255
    m = a[..., 3] > 0.9
    return (a[..., :3][m] ** 2.2).mean(0)


def write(prefix, rgb, h):
    dw.PREFIX = prefix
    path = os.path.join(OUT, f'{prefix}-cobble.png')
    dw.retry_save(dw.to_img(rgb), path, optimize=True)
    n = dw.normal_map(h, dw.RELIEF['ruts'], (0, 1), 'ruts')
    dw.save_webp(n, os.path.join(OUT, f'{prefix}-cobble-n.webp'), 'RGB', 92, lossless=True)
    print(f'{prefix}-cobble.png + {prefix}-cobble-n.webp  {rgb.shape[1]} x {rgb.shape[0]}  normal x std {(n[..., 0] * 2 - 1).std():.3f}')
    return n


def register(labels):
    ids = []
    for prefix, label in labels:
        ids += [(f'{prefix}-cobble', f'{label} · cobble road tile (albedo, repeats in u and v)'), (f'{prefix}-cobble-n', f'{label} · cobble road tile (normal)')]
    credit = 'Cut and joined from the stylized2 Dark Wood path strip (Codex-generated, ashlar/art/textures/terrain-dark-wood), scripts/prepare-road-tile.py'
    ext = lambda i: 'webp' if i.endswith('-n') else 'png'
    lines = [f'    {{"id": "{i}", "name": {json.dumps(n, ensure_ascii=False)}, "kind": "texture", "file": "samples/{i}.{ext(i)}", "license": "Project-internal", "credit": "{credit}", "source": "ashlar/art/textures/terrain-dark-wood/stylized2"}},' for i, n in ids]
    text = open(MANIFEST, encoding='utf-8').read().split('\n')
    keep = {i for i, _ in ids}
    text = [l for l in text if not any(f'"id": "{i}"' in l for i in keep)]
    at = next(i for i, l in enumerate(text) if '"id": "darkwood-sty-ruts-n"' in l) + 1
    text[at:at] = lines
    with open(MANIFEST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(text))
    print(f'{len(lines)} samples.json entries written')


def main():
    args = sys.argv[1:]
    debug = None
    if '--debug' in args:
        debug = args[args.index('--debug') + 1]
        os.makedirs(debug, exist_ok=True)
    use_moisan = '--moisan' in args
    mu = 3e-3
    src = {s[0]: np.asarray(Image.open(os.path.join(ART, s[1], 'path_cobble.png')).convert('RGB'), dtype=np.float32) / 255 for s in SETS}
    first = src[SETS[0][0]]
    guide = ridges(first)
    win = find_windows(first, guide, mu)
    print('window x0 %d width %d (+%d overlap) · y0 %d height %d (+%d overlap)' % win)
    labels = []
    for k, (prefix, folder, label) in enumerate(SETS):
        a = src[prefix]
        if use_moisan:
            tile = moisan_cut(a, win)
            seams = costs = None
        else:
            tile, seams, costs = apply_windows(a, win, guide, mu)
            if k == 0:
                print('seam cost per row/col: across %.5f, down %.5f (a stone-to-stone cut would be ≈ 0.02+)' % costs)
        h, w = tile.shape[:2]
        flat = dw.flatten_wrapped(tile, 40)
        # brightness: the whole tile (stones and mortar) matches the paved middle of the path texture in use now
        new = (flat ** 2.2).reshape(-1, 3).mean(0)
        old = old_stone_mean(prefix)
        gain = (old.mean() / new.mean()) ** (1 / 2.2)
        flat = np.clip(flat * gain, 0, 1)
        print(f'{prefix}: linear brightness old {old.mean():.4f}  new {((flat ** 2.2).mean()):.4f} (gain x{gain:.3f})')
        hgt = dw.soft_height(sw.height_from(np.tile(flat, (3, 3, 1)), 'dirt')[h:2 * h, w:2 * w], 2.0, (0, 1))
        n = write(prefix, flat, hgt)
        labels.append((prefix, label))
        if debug:
            col = np.tile(flat, (3, 3, 1))
            nrm = np.tile(n, (3, 3, 1))
            both = np.concatenate([col, nrm], 1)
            img = Image.fromarray((both * 255 + 0.5).astype(np.uint8))
            img.thumbnail((2400, 1800), Image.LANCZOS)
            img.save(os.path.join(debug, f'{prefix}_tile3x3.png'))
        if k == 0:
            st, mortar = stones(flat)
            print(f'tile {w} x {h} px = {w / PX_PER_M:.2f} x {h / PX_PER_M:.2f} m at {PX_PER_M:.0f} px/m')
            for label, min_area in (('all stones (area >= 2500 px2)', 2500), ('paving stones (area >= 5000 px2, no chips)', 5000)):
                sel = [s for s in st if s['area'] >= min_area]
                print(f'  {label}: {len(sel)} per tile')
                for name, key in (('equiv. diameter', 'eq'), ('long side', 'major'), ('short side', 'minor')):
                    v = np.array([s[key] for s in sel])
                    q = np.percentile(v, [10, 50, 90])
                    print(f'    {name:16s} px median {q[1]:.0f} (p10 {q[0]:.0f}, p90 {q[2]:.0f}, max {v.max():.0f})  ->  m median {q[1] / PX_PER_M:.2f} (p10 {q[0] / PX_PER_M:.2f}, p90 {q[2] / PX_PER_M:.2f}, max {v.max() / PX_PER_M:.2f})  /  H median {q[1] / PX_PER_M / 1.8:.2f}')
            if debug and seams:
                ov = np.tile(flat, (1, 1, 1)).copy()
                Image.fromarray((ov * 255).astype(np.uint8)).save(os.path.join(debug, 'tile.png'))
    register(labels)


if __name__ == '__main__':
    main()

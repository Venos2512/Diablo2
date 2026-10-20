"""Helpers for the generate-tpose-for-tripo skill (PIL + numpy only; no image synthesis).

  python -I tpose_tools.py measure <sheet.png>
      Print, for the left and right half of a two-view sheet, the figure bbox, height, width, height as a
      percentage of the image height and the distance to the image edges.
  python -I tpose_tools.py split <asset_dir> [--canvas 1024] [--margin 0.07] [--thr 40]
      Reads  <asset_dir>/tpose_front_back.png (left half = FRONT, right half = BACK)
             <asset_dir>/tpose_sides.png      (left half = LEFT side, right half = RIGHT side)
      Writes <asset_dir>/views/front.png, back.png, left.png, right.png (+ views/_contact.png).
      All four views get the same square canvas, the figure centred horizontally, soles on ONE pixel row, the
      empty space filled with the sheet's flat background colour. The two sheets are separate generations and
      rarely come out at the same scale, so the sides sheet is scaled so its mean figure height equals the
      front/back sheet's (one 3D model has one height in every orthographic view); the factor is printed.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def bg_colour(a):
    c = np.concatenate([a[:40, :40].reshape(-1, 3), a[:40, -40:].reshape(-1, 3),
                        a[-40:, :40].reshape(-1, 3), a[-40:, -40:].reshape(-1, 3)])
    return np.median(c, axis=0)


def fg_mask(a, bg, thr):
    return np.abs(a.astype(np.int16) - bg).max(axis=2) > thr


def figures(path, thr):
    """Return (image, bg colour, [(crop, bbox), (crop, bbox)]) for the two figures of a sheet."""
    img = Image.open(path).convert('RGB')
    a = np.asarray(img)
    bg = bg_colour(a)
    m = fg_mask(a, bg, thr)
    cols = m.sum(axis=0)
    w = a.shape[1]
    lo, hi = int(w * 0.35), int(w * 0.65)
    mid = cols[lo:hi]
    zero = np.where(mid <= mid.min() + 2)[0]
    cut = lo + int(zero[0] + zero[-1]) // 2  # middle of the empty gap between the two figures
    out = []
    for x0, x1 in ((0, cut), (cut, w)):
        sub = m[:, x0:x1]
        ys = np.where(sub.sum(axis=1) > 3)[0]
        xs = np.where(sub.sum(axis=0) > 3)[0]
        box = (x0 + int(xs[0]), int(ys[0]), x0 + int(xs[-1]) + 1, int(ys[-1]) + 1)
        out.append((img.crop(box), box))
    return img, tuple(int(v) for v in bg), out


def cmd_measure(args):
    img, bg, figs = figures(args.sheet, args.thr)
    W, H = img.size
    print(f'{args.sheet}  image {W}x{H}  bg {bg}')
    for name, (crop, (x0, y0, x1, y1)) in zip(('left', 'right'), figs):
        print(f'  {name:5s} bbox=({x0},{y0},{x1},{y1}) height={y1 - y0}px ({100 * (y1 - y0) / H:.1f}% of image) '
              f'width={x1 - x0}px  edge margins: left {x0} right {W - x1} top {y0} bottom {H - y1}')
        if min(x0, W - x1, y0, H - y1) < 12:
            print(f'  WARNING {name}: figure is within 12 px of the image edge (cropped or too tight)')


def cmd_split(args):
    d = Path(args.asset_dir)
    sheets = {}
    for sheet, names in (('tpose_front_back.png', ('front', 'back')), ('tpose_sides.png', ('left', 'right'))):
        _, bg, pair = figures(d / sheet, args.thr)
        hs = [c.size[1] for c, _ in pair]
        for n, (crop, box) in zip(names, pair):
            sheets[n] = [crop, bg, sum(hs) / len(hs)]
            print(f'{sheet}: {n} bbox {box} size {crop.size}')
    ref_h = sheets['front'][2]
    for n, (crop, bg, h) in sheets.items():
        f = ref_h / h
        if abs(f - 1) > 1e-6:
            crop = crop.resize((round(crop.size[0] * f), round(crop.size[1] * f)), Image.LANCZOS)
            print(f'{n}: sheet scaled by {f:.3f} to match the front/back sheet height')
        sheets[n][0] = crop
    side = args.canvas
    wmax = max(v[0].size[0] for v in sheets.values())
    hmax = max(v[0].size[1] for v in sheets.values())
    k = min(1.0, side * (1 - 2 * args.margin) / max(wmax, hmax))
    if k < 1.0:
        print(f'figures do not fit the {side}px canvas with {args.margin:.0%} margin: scaling all views by {k:.3f}')
    (d / 'views').mkdir(exist_ok=True)
    floor = int(side * (1 - args.margin))
    tiles = []
    for n in ('front', 'back', 'left', 'right'):
        crop, bg, _ = sheets[n]
        if k < 1.0:
            crop = crop.resize((round(crop.size[0] * k), round(crop.size[1] * k)), Image.LANCZOS)
        canvas = Image.new('RGB', (side, side), bg)
        # Flatten the background: the generator's grey is not uniform (shading, shadow), which shows as a
        # rectangular seam around the pasted crop. Keep only the figure (dilated, feathered mask) on the flat colour.
        flat = Image.new('RGB', crop.size, bg)
        fig = Image.fromarray((fg_mask(np.asarray(crop), np.array(bg), args.thr // 2) * 255).astype('uint8'))
        fig = fig.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.5))
        crop = Image.composite(crop, flat, fig)
        canvas.paste(crop, ((side - crop.size[0]) // 2, floor - crop.size[1]))
        canvas.save(d / 'views' / f'{n}.png')
        tiles.append(canvas.resize((side // 2, side // 2), Image.LANCZOS))
    contact = Image.new('RGB', (side * 2, side // 2))
    for i, t in enumerate(tiles):
        contact.paste(t, (i * side // 2, 0))
    contact.save(d / 'views' / '_contact.png')
    print('wrote', d / 'views' / '{front,back,left,right}.png', f'canvas {side}x{side}, soles on row {floor}')


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    m = sub.add_parser('measure')
    m.add_argument('sheet')
    m.add_argument('--thr', type=int, default=40)
    m.set_defaults(fn=cmd_measure)
    s = sub.add_parser('split')
    s.add_argument('asset_dir')
    s.add_argument('--canvas', type=int, default=1024)
    s.add_argument('--margin', type=float, default=0.07)
    s.add_argument('--thr', type=int, default=40)
    s.set_defaults(fn=cmd_split)
    args = ap.parse_args()
    args.fn(args)


if __name__ == '__main__':
    sys.exit(main())

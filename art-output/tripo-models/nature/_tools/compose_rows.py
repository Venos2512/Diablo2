"""Single-row concept images of the props Tripo left out of a whole-sheet model (it keeps the upper rows of these
sheets and drops most of the lower ones). Each image: the sheet's grey scale figure, then the chosen cells cut out on
the flat sheet grey, feet on one baseline, the sheet's own pixel scale (a cell from another sheet is rescaled by the
ratio of the two figures' heights). Cells: sheet order after the figure.

Usage: python -I compose_rows.py   → ../inputs/<name>.png (names in ROWS), the source tripo_sheet.sh uploads for them
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
SHEETS_2D = os.path.join(ROOT, 'art-output', 'mmo-hub-bloodmoor', 'assets_2d')
INPUTS = os.path.join(HERE, '..', 'inputs')
# sheet number → (concept, cells per row with the figure); cells are numbered after the figure, row by row.
SHEETS = {10: ('asset_10_buried_corpse_sheet', [5, 3, 3]), 11: ('asset_11_dead_tree_sheet', [5, 5, 4]), 12: ('asset_12_burned_tree_sheet', [5, 3, 3])}

# output name → [(sheet number, cell index after the figure (1-based)), ...]
ROWS = {
    'asset_10b_buried_corpse_row': [(10, 6), (10, 7), (10, 8), (10, 9), (10, 10)],
    'asset_11b_dead_tree_row': [(11, 5), (11, 6), (11, 7), (11, 8), (11, 9)],
    'asset_11c_fallen_wood_row': [(11, 10), (11, 11), (11, 12), (11, 13), (12, 8), (12, 9)],
}
GAP = 70


def sheet_blobs(path, per_row):
    """Label image of the sheet's props (background = the flat grey of its top rows) and its blobs in sheet order.
    per_row: cells in each row (figure included). A prop is a large connected patch of the sheet; one that touches a
    neighbour (branch tips on the next row's mud) is eroded until the two come apart, then grown back. Grass tufts and
    pebbles join the nearest prop."""
    img = np.asarray(Image.open(path).convert('RGB')).astype(int)
    bg = np.median(img[:12].reshape(-1, 3), axis=0)
    mask = ndimage.binary_opening(np.abs(img - bg).sum(2) > 24, iterations=1)
    solid = ndimage.binary_closing(mask, iterations=2) | mask
    lab, n = ndimage.label(solid)
    area = lambda lab, ids: ndimage.sum(np.ones_like(lab), lab, ids)
    sizes = area(lab, range(1, n + 1))
    big = [i + 1 for i in range(n) if sizes[i] > 0.003 * mask.size]
    while len(big) < sum(per_row):
        i = max(big, key=lambda i: (lab == i).sum())  # the largest patch holds two props
        part = lab == i
        for it in range(2, 40, 2):
            core, cn = ndimage.label(ndimage.binary_erosion(part, iterations=it))
            parts = [j for j, s in enumerate(area(core, range(1, cn + 1)), start=1) if s > 0.0015 * mask.size]
            if len(parts) >= 2:
                break
        else:
            raise SystemExit(f'{path}: {len(big)} props, expected {sum(per_row)}, and none comes apart')
        seeds = np.where(np.isin(core, parts), core, 0)
        _, (iy, ix) = ndimage.distance_transform_edt(seeds == 0, return_indices=True)
        grown = seeds[iy, ix]
        for j in parts[1:]:
            lab[part & (grown == j)] = lab.max() + 1
            big.append(int(lab.max()))
    bigmask = np.isin(lab, big)
    d, (iy, ix) = ndimage.distance_transform_edt(~bigmask, return_indices=True)
    bits = solid & ~bigmask
    lab[bits] = np.where(d[bits] < 60, lab[iy, ix][bits], 0)
    lab[~solid] = 0

    def cells_of(lab):
        out = []
        for i, box in enumerate(ndimage.find_objects(lab), start=1):
            if box is not None:
                ys, xs = box
                out.append({'label': i, 'x0': xs.start, 'x1': xs.stop, 'top': ys.start, 'bottom': ys.stop, 'y': (ys.start + ys.stop) / 2})
        return out

    def rows_of(cells):
        # Row bands from the vertical profile of the props: a row ends where no prop of it reaches further down.
        cells = sorted(cells, key=lambda c: c['y'])
        rows, row = [], []
        for c in cells:
            if row and c['y'] > max(r['bottom'] for r in row) - 0.15 * np.mean([r['bottom'] - r['top'] for r in row]):
                rows.append(row)
                row = []
            row.append(c)
        rows.append(row)
        return [sorted(r, key=lambda c: c['x0']) for r in rows]

    for _ in range(12):
        rows = rows_of(cells_of(lab))
        short = [(k, r) for k, r in enumerate(rows) if k < len(per_row) and len(r) < per_row[k]]
        if not short:
            break
        k, row = short[0]
        c = max(row, key=lambda c: c['x1'] - c['x0'])  # the widest blob holds two props
        cols = mask[c['top']:c['bottom'], c['x0']:c['x1']].sum(0).astype(float)
        w = len(cols)
        cut = c['x0'] + int(w * 0.2) + int(np.argmin(ndimage.uniform_filter1d(cols, 9)[int(w * 0.2):int(w * 0.8)]))
        part = lab == c['label']
        right = part.copy()
        right[:, :cut] = False
        lab[right] = lab.max() + 1
    rows = rows_of(cells_of(lab))
    order = [c for r in rows for c in r]
    return lab, mask, order, [len(r) for r in rows]


def cells_of(num):
    sheet, rows = SHEETS[num]
    path = os.path.join(SHEETS_2D, sheet + '.png')
    img = np.asarray(Image.open(path).convert('RGB'))
    lab, mask, cells, per_row = sheet_blobs(path, rows)
    assert per_row == rows, (sheet, per_row)
    bg = np.median(img[:12].reshape(-1, 3), axis=0).astype(np.uint8)
    out = []
    for c in cells:
        ys, xs = np.nonzero(lab == c['label'])
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        keep = ndimage.binary_dilation(lab[y0:y1, x0:x1] == c['label'], iterations=2)
        piece = img[y0:y1, x0:x1].copy()
        piece[~keep] = bg
        # Trim to the prop's own pixels (the blob was grown to join its grass).
        own = mask[y0:y1, x0:x1] & keep
        yy, xx = np.nonzero(own)
        out.append(piece[yy.min():yy.max() + 1, xx.min():xx.max() + 1])
    return out, bg


def main():
    cache = {}
    for name, picks in ROWS.items():
        for num, _ in picks:
            if num not in cache:
                cache[num] = cells_of(num)
        base = picks[0][0]
        figure = cache[base][0][0]
        parts = [figure]
        for num, k in picks:
            crop = cache[num][0][k]
            if num != base:  # another sheet: bring it to this sheet's pixel scale
                ratio = figure.shape[0] / cache[num][0][0].shape[0]
                crop = np.asarray(Image.fromarray(crop).resize((round(crop.shape[1] * ratio), round(crop.shape[0] * ratio)), Image.LANCZOS))
            parts.append(crop)
        bg = cache[base][1]
        h = max(p.shape[0] for p in parts) + 2 * GAP
        w = sum(p.shape[1] for p in parts) + GAP * (len(parts) + 1)
        canvas = np.empty((h, w, 3), np.uint8)
        canvas[:] = bg
        x = GAP
        for p in parts:
            y = h - GAP - p.shape[0]  # feet on one baseline
            canvas[y:y + p.shape[0], x:x + p.shape[1]] = p
            x += p.shape[1] + GAP
        os.makedirs(INPUTS, exist_ok=True)
        dst = os.path.join(INPUTS, name + '.png')
        Image.fromarray(canvas).save(dst)
        print(f'{dst}: {w}x{h}, {len(parts) - 1} props')


if __name__ == '__main__':
    main()

"""Rescale every figure (not the H silhouette) of a concept sheet about its bottom-centre, keeping the baseline.
Cut / scale / paste and backdrop fill only; nothing is painted.
usage: python rescale.py src.png out.png factor [hx_frac] [--clean-lines]
  hx_frac: left strip holding the H silhouette (untouched), default 0.11
  --clean-lines: remove model-drawn dashed guide lines and their margin labels"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out, f = sys.argv[1], sys.argv[2], float(sys.argv[3])
hx = float(sys.argv[4]) if len(sys.argv) > 4 and not sys.argv[4].startswith('--') else 0.11
clean = '--clean-lines' in sys.argv
a = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
Hh, Ww, _ = a.shape
HX = int(hx * Ww)


def smooth_bg(img, fg):
    w = (~fg).astype(np.float32)
    ws = ndi.gaussian_filter(w, 40) + 1e-6
    return np.stack([ndi.gaussian_filter(img[..., c] * w, 40) / ws for c in range(3)], axis=2)


rowbg = np.median(a, axis=1, keepdims=True)
fg = ndi.binary_dilation(np.abs(a - rowbg).sum(axis=2) > 45, iterations=25)
bg = smooth_bg(a, fg)
fg = ndi.binary_dilation(np.abs(a - bg).sum(axis=2) > 25, iterations=15)
bg = smooth_bg(a, fg)
diff = np.abs(a - bg).sum(axis=2)

lum = a.mean(axis=2)
base = max((np.sum(lum[y] < np.minimum(lum[y - 4], lum[y + 4]) - 12), y) for y in range(Hh // 2, Hh - 5))[1]

mask = diff > 22
mask[:14] = mask[-14:] = False
mask[:, :14] = mask[:, -14:] = False
mask = ndi.binary_opening(mask, iterations=1)
mask = ndi.binary_closing(mask, iterations=6)
mask = ndi.binary_fill_holes(mask)
mask[base - 3:base + 4] = False
mask[:, :HX] = False

rng = np.random.default_rng(1)
quiet = diff < 12
noise = rng.normal(0, float(np.std((a - bg)[quiet])), a.shape).astype(np.float32)
plate = bg + noise

src_a = a.copy()
if clean:
    dark = (bg.mean(axis=2) - lum) > 12
    body = ndi.binary_opening(mask, iterations=3)
    bodyd = ndi.binary_dilation(body, iterations=4)
    for y in range(60, base - 20):
        cols = ~bodyd[y, HX:]
        if cols.sum() > 0.3 * Ww and dark[y, HX:][cols].mean() > 0.35:
            band = slice(y - 3, y + 4)
            thin = dark[band] & ~ndi.binary_dilation(body, iterations=2)[band]
            thin[:, :HX] = False
            src_a[band][thin] = plate[band][thin]
            mask[band] &= ~thin
            src_a[y - 34:y + 6, Ww - 150:Ww - 14] = plate[y - 34:y + 6, Ww - 150:Ww - 14]
            mask[y - 34:y + 6, Ww - 150:Ww - 14] = False

grp = ndi.binary_dilation(mask, iterations=int(os.environ.get('GRP', '8')))
grp[base - 1:] = False
grp[:, :HX] = False
lab, n = ndi.label(grp)
figs = []
for i, sl in enumerate(ndi.find_objects(lab), 1):
    ys, xs = sl
    if (ys.stop - ys.start) * (xs.stop - xs.start) < 2500 or ys.start >= base - 5 or ys.stop < base - 60:
        continue
    figs.append((max(0, ys.start - 6), base + 1, max(HX, xs.start - 6), min(Ww, xs.stop + 6)))

outa = src_a.copy()
for y0, y1, x0, x1 in figs:
    outa[y0:y1, x0:x1] = plate[y0:y1, x0:x1]
FE = 14
for y0, y1, x0, x1 in figs:
    crop = Image.fromarray(np.clip(src_a[y0:y1, x0:x1], 0, 255).astype(np.uint8))
    nw, nh = max(1, int(crop.width * f)), max(1, int(crop.height * f))
    crop = np.asarray(crop.resize((nw, nh), Image.LANCZOS)).astype(np.float32)
    al = np.ones((nh, nw), np.float32)
    k = min(FE, nh // 2, nw // 2)
    ramp = np.arange(1, k + 1) / k
    al[:k] *= ramp[:, None]
    al[:, :k] *= ramp[None, :]
    al[:, -k:] *= ramp[None, ::-1]
    cx = (x0 + x1) / 2
    px, py = int(cx - nw / 2), int(base + 1 - nh)
    reg = outa[py:py + nh, px:px + nw]
    outa[py:py + nh, px:px + nw] = reg * (1 - al[..., None]) + crop * al[..., None]
    print('fig', x0, x1, y0, y1, '->', nw, nh)
free = np.ones(Ww, bool)
for y0, y1, x0, x1 in figs:
    free[x0 - 10:x1 + 10] = False
free[:HX + 5] = False
prof = np.median(src_a[base - 3:base + 4][:, free], axis=1)          # baseline line profile, rows x 3
for y0, y1, x0, x1 in figs:
    seg = outa[base - 3:base + 4, x0:x1]
    outa[base - 3:base + 4, x0:x1] = np.minimum(seg, prof[:, None, :])
Image.fromarray(np.clip(outa, 0, 255).astype(np.uint8)).save(out)
print('baseline', base)

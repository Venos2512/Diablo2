#!/usr/bin/env python3
"""Cut every approved ASHLAR item sheet into one transparent icon per item.

Inputs  : ashlar/Art_Final/Item/IT-##_*.png  (approved sheets, see Art_Final/manifest.json)
          ashlar/art/items/_batches/batch*/IT-##_*.template.json (layout used to generate each sheet:
          item order and footprint w x h)
          ashlar/pipeline/items/frame_seeds.json (rough frame rectangles, snapped here to the real lines)
          ashlar/docs/ASHLAR_ITEMS_VI.md (item names)
Outputs : <out-dir>/<ID>_<slug>.png  RGBA, exactly w*CELL x h*CELL px
          <out-dir>/inventory_sizes.json
          <md-path> (INVENTORY_SIZES_VI.md, Vietnamese note of the footprints)

Method (no repainting, only crop / mask / scale):
  1. snap the rough frame of each item to the thin footprint-frame lines on the image
     (thin-ridge detector, tolerant to items crossing the line);
  2. remove the frame line, the grid lines and the corner label ("2x3");
  3. flood-fill the backdrop from outside the frame; the fill only walks over pixels that look like the
     local backdrop (plane fitted to the sheet around the frame) or a soft neutral shade of it (contact
     shadow) and it stops at every crisp colour step, so grey / ash / iron items are kept;
  4. soft 1-2 px alpha edge, colours extended outward from the item (no grey halo);
  5. frame (plus anything sticking out of it) is scaled uniformly onto the w*CELL x h*CELL canvas.

Re-runnable. Refuses to overwrite existing outputs unless --force is given.
Only needs the standard library, Pillow and numpy.
"""
import argparse
import glob
import json
import os
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ASHLAR = Path(__file__).resolve().parents[2]
REPO = ASHLAR.parent
# the approved sheets live in Art_Final/Item (older checkouts: Art_Final/items)
SHEET_DIR = ASHLAR / "Art_Final" / "Item"
if not SHEET_DIR.exists() and (ASHLAR / "Art_Final" / "items").exists():
    SHEET_DIR = ASHLAR / "Art_Final" / "items"
BATCH_DIR = ASHLAR / "art" / "items" / "_batches"
CATALOGUE = ASHLAR / "docs" / "ASHLAR_ITEMS_VI.md"
SEEDS = Path(__file__).with_name("frame_seeds.json")
MANIFEST = ASHLAR / "Art_Final" / "manifest.json"

CELL = 128
ASPECT_SLACK = 0.10        # log-space slack when comparing the template footprint with the other candidates
CELL_SPREAD = 0.25         # max deviation of a frame cell size from the sheet median (the model draws cells up to ~18% off; 1x2 vs 1x3 mix-ups are >= 33%)
TOP_LIMIT = 48             # search windows never reach into the title row above this y
BOTTOM_LIMIT = 26          # ... or further than this below the frame bottom (caption row)
ASPECT_TOL = 0.35          # |frame aspect / (w/h) - 1| above this -> mismatch, item skipped
SNAP_RADIUS = 14
MARGIN = 44                # px around the frame searched for parts sticking out
MARGIN_BOTTOM = 10
STEP_MAX = 4.0             # colour step (max channel) that stops the backdrop flood
BG_TOL = 8.0              # max channel distance to the backdrop plane = backdrop
SHADE_MIN = 0.60           # darkest neutral shade of the backdrop still treated as contact shadow
SHADE_CHROMA = 0.04
SHADOW_MIN = 0.56          # pass 2: darkest neutral shadow
SHADOW_CHROMA = 0.03
SHADOW_STEP = 7.0
SHADOW_TEXTURE = 4.5
PEEL_RINGS = 4
PEEL_K_MAX = 0.80          # only clearly darkened backdrop is peeled
POCKET_MIN_AREA = 10       # enclosed backdrop pockets (gaps between chain links, ring holes ...) at least this big are removed
POCKET_DEV = 5.0
BIG_POCKET_AREA = 1200     # smooth shaded pockets at least this big are holes of the item
POCKET_THIN_AREA = 160     # pockets smaller than this are holes without further proof
POCKET_CRISP = 0.35        # bigger pockets need this share of their outline on a crisp colour step
CRISP_STEP = 14.0          # colour step over 4 px that counts as crisp
GROW_STEP = 40             # px the search window grows when the cut-out touches its edge
FOOT_BAND_SMALL = 90        # same for small frames (<= 360 px tall) where the cast shadow reaches higher
FOOT_K_MIN = 0.38          # darkest neutral contact shadow peeled at the foot of the frame
FOOT_EDGE_STD = 9.0        # texture limit for the foot peel measured in a 3x3 window (shadow edges beside the item)
PEEL_RINGS_FOOT = 8        # extra peel rings at the foot of the frame (contact shadow)
PEEL_K_FOOT = 0.97
FOOT_BAND = 40             # px above the frame bottom line where the harder peel starts
MIN_PIECE_AREA = 150       # detached specks smaller than this (after a 3 px dilation) are dust

# A footprint decided by the user instead of the layout template (the templates in art/ stay untouched).
FOOTPRINT_OVERRIDES = {
    # user decision 2026-10-26: the sheet draws a long veil in a tall frame, so 2x3 instead of the helmet size 2x2
    "A08": (2, 3),
}

# Per item switches. Backdrop-coloured stains, shading or translucency inside these items must not be punched
# out as "holes", so for them only the outside is removed.
ITEM_OPTS = {
    "W12": {"pockets": False},   # flat grey blade top above the keyhole is item, only the keyhole itself is a hole
    "M07": {"pockets": False},   # salt-glass chunk
    "Q14": {"pockets": False},   # whispering crystal
    "Q18": {"pockets": False},   # letter with grey stains of the backdrop colour
    "M08": {"pockets": False},   # frost-rimed steel
    "K04": {"grow_backdrop": True},   # lantern-shaped head: shaded glass window and cast shadows beside the stem
    # contact shadow at the foot: peel deeper (the shadow rim is wider than the default 8 rings)
    "C03": {"peel_rings": 26}, "J04": {"peel_rings": 26}, "J05": {"peel_rings": 26}, "G04": {"peel_rings": 26},
    "J07": {"peel_rings": 26}, "J03": {"peel_rings": 26}, "Q05": {"pockets": False, "peel_rings": 26},
    "G05": {"peel_rings": 26},
    "G06": {"peel_all": True, "peel_rings": 26, "shadow_step": 14.0, "shadow_texture": 9.0,
            "grow_backdrop": True, "grow_chroma": (0.03, 0.09), "grow_k_min": 0.58, "erase_sat": 0.32,
            "erase_polys": [   # icon px: grey cast shadows (right of the bowl, between the seaweed, under the handle, left of the tip)
                [(238, 160), (256, 148), (256, 196), (228, 196), (222, 180)],
                [(188, 188), (256, 182), (256, 222), (232, 220), (200, 214), (188, 204)],
                [(96, 236), (130, 222), (155, 212), (190, 212), (190, 250), (100, 250), (90, 246)],
                [(5, 210), (36, 210), (36, 240), (5, 240)]]},   # grey cast-shadow blotches beside the base, under the spoon and the seaweed
    "W15": {"bright_max": 1.25, "bright_chroma": 0.30, "bright_texture": 5.0},      # pale grey cloud: backdrop brightened by the flame glow
    "Q15": {"peel_rings": 26, "erase_sat": 1.0,
            "erase_polys": [[(156, 128), (174, 128), (174, 166), (156, 166)]]},   # floating S-shaped wisp right of the central spike        # dark ellipse under the crown
    "O03": {"peel_all": True, "peel_rings": 8},   # grey halo around the glowing brand tip
    "W13": {"big_pocket_area": 100, "pocket_crisp": 0.18, "peel_all": True, "peel_rings": 8,
                "shadow_step": 14.0, "shadow_texture": 9.0},   # small cast shadows between the bow, string and stock
}

CATEGORY_NAMES = {
    "C": "Đồ tiêu hao",
    "G": "Tiền và hàng bán",
    "W": "Vũ khí",
    "O": "Class item và tay phụ",
    "A": "Giáp",
    "J": "Trang sức",
    "M": "Vật liệu chế tác",
    "R": "Relic",
    "Q": "Quest item",
    "K": "Chìa khoá",
}

# Footprint by type from ASHLAR_ITEMS_VI.md section 1.3. Items without a clear type are not listed.
TYPE_RULE = {
    "C01": ("Draught", (1, 1)), "C02": ("muối", (1, 1)), "C03": ("túi nhỏ", (1, 1)), "C04": ("nến", (1, 1)),
    "G01": ("coin", (1, 1)), "G02": ("coin", (1, 1)), "G03": ("bọc đồ", (2, 2)), "G04": ("nhẫn", (1, 1)),
    "G05": ("cuộn giấy", (1, 2)),
    "W01": ("vũ khí ứng biến to", (2, 3)), "W02": ("chùy", (2, 3)), "W03": ("đòn khiêng", (2, 4)),
    "W04": ("vũ khí ứng biến to (dây xích)", (2, 3)), "W05": ("roi xích", (2, 3)), "W06": ("móc", (1, 3)),
    "W07": ("đũa", (1, 2)), "W08": ("vũ khí một tay cán ngắn", (1, 3)), "W09": ("bình to", (2, 2)),
    "W10": ("gậy", (2, 4)), "W11": ("xẻng", (2, 4)), "W12": ("xẻng", (2, 4)), "W13": ("nỏ", (2, 4)),
    "W14": ("đuốc", (1, 3)), "W15": ("gậy", (2, 4)), "W16": ("rìu", (2, 3)),
    "O01": ("khiên to", (2, 4)), "O02": ("khiên to", (2, 4)), "O03": ("sắt nung", (1, 3)),
    "O04": ("hòm", (2, 2)), "O05": ("bình to", (2, 2)), "O07": ("khiên nhỏ", (2, 3)),
    "A01": ("vải liệm", (2, 3)), "A02": ("áo", (2, 3)), "A03": ("áo", (2, 3)), "A04": ("áo", (2, 3)),
    "A05": ("giáp ngực", (2, 3)), "A06": ("mũ", (2, 2)), "A07": ("mũ", (2, 2)), "A08": ("mũ", (2, 2)),
    "A09": ("mũ", (2, 2)), "A10": ("găng", (2, 2)), "A11": ("găng", (2, 2)), "A12": ("ủng", (2, 2)),
    "A13": ("ủng", (2, 2)), "A14": ("thắt lưng", (2, 1)), "A15": ("thắt lưng", (2, 1)),
    "J01": ("nhẫn", (1, 1)), "J02": ("nhẫn", (1, 1)), "J03": ("nhẫn", (1, 1)), "J04": ("amulet", (1, 1)),
    "J05": ("amulet", (1, 1)), "J06": ("amulet", (1, 1)), "J07": ("nhẫn", (1, 1)),
    "M01": ("vật liệu nhỏ", (1, 1)), "M04": ("vật liệu nhỏ", (1, 1)), "M08": ("vật liệu nhỏ", (1, 1)), "M02": ("vật liệu nhỏ", (1, 1)), "M03": ("vật liệu nhỏ", (1, 1)),
    "M06": ("vật liệu nhỏ", (1, 1)), "M07": ("vật liệu nhỏ", (1, 1)), "M05": ("bó hoa", (1, 2)),
    "R01": ("đèn relic nhỏ", (1, 2)),
    "Q01": ("sách to", (2, 2)), "Q02": ("sách to", (2, 2)),
    "K01": ("chìa dài", (1, 2)), "K02": ("chìa dài", (1, 2)), "K03": ("chìa dài", (1, 2)),
    "K04": ("chìa dài", (1, 2)), "K05": ("chìa dài", (1, 2)),
}

TYPE_TABLE = [
    ("nhẫn, amulet, coin, Draught, muối, nến, vật liệu nhỏ, chìa nhỏ", "1×1"),
    ("đũa, đèn relic nhỏ, bó hoa, chìa dài, cuộn giấy", "1×2"),
    ("vũ khí một tay cán ngắn, đuốc, móc, sắt nung", "1×3"),
    ("chùy, roi xích, rìu, vũ khí ứng biến to", "2×3"),
    ("gậy, đòn khiêng, xẻng, giáo, nỏ", "2×4"),
    ("mũ, găng, ủng, hòm, bình to, sách to, bọc đồ", "2×2"),
    ("thắt lưng", "2×1"),
    ("giáp ngực, áo, vải liệm", "2×3"),
    ("khiên nắp quan tài, khiên to", "2×4"),
    ("khiên nhỏ", "2×2 hoặc 2×3"),
]


# --------------------------------------------------------------------------------------------------
# small image helpers (numpy only)
# --------------------------------------------------------------------------------------------------
def shift(a, dy, dx, fill=0):
    """out[y, x] = a[y + dy, x + dx] (pixels that fall off the array get `fill`)."""
    out = np.full_like(a, fill)
    h, w = a.shape[:2]
    ys, yd = slice(max(0, dy), h + min(0, dy)), slice(max(0, -dy), h + min(0, -dy))
    xs, xd = slice(max(0, dx), w + min(0, dx)), slice(max(0, -dx), w + min(0, -dx))
    out[yd, xd] = a[ys, xs]
    return out


def dilate(m, n=1):
    for _ in range(n):
        o = m.copy()
        o[1:] |= m[:-1]
        o[:-1] |= m[1:]
        o[:, 1:] |= m[:, :-1]
        o[:, :-1] |= m[:, 1:]
        o[1:, 1:] |= m[:-1, :-1]
        o[:-1, :-1] |= m[1:, 1:]
        o[1:, :-1] |= m[:-1, 1:]
        o[:-1, 1:] |= m[1:, :-1]
        m = o
    return m


def erode(m, n=1):
    return ~dilate(~m, n)


def gaussian(a, sigma):
    r = max(1, int(round(sigma * 3)))
    x = np.arange(-r, r + 1)
    k = np.exp(-(x * x) / (2 * sigma * sigma))
    k /= k.sum()
    p = np.pad(a, r, mode="edge")
    t = sum(k[i] * p[:, i:i + a.shape[1]] for i in range(len(k)))
    p = np.pad(t, ((r, r), (0, 0)), mode="edge")
    return sum(k[i] * p[i:i + a.shape[0]] for i in range(len(k)))


def local_std(a, r=2):
    """Standard deviation of a 2-D array in a (2r+1)^2 window (edge padded)."""
    n = (2 * r + 1) ** 2
    p = np.pad(a.astype(np.float64), r + 1, mode="edge")
    c1 = p.cumsum(0).cumsum(1)
    c2 = (p * p).cumsum(0).cumsum(1)

    def box(c):
        h, w = a.shape
        s_ = c[2 * r + 1:2 * r + 1 + h, 2 * r + 1:2 * r + 1 + w] - c[0:h, 2 * r + 1:2 * r + 1 + w]             - c[2 * r + 1:2 * r + 1 + h, 0:w] + c[0:h, 0:w]
        return s_
    m = box(c1) / n
    v = box(c2) / n - m * m
    return np.sqrt(np.maximum(v, 0)).astype(np.float32)


def label(mask):
    """8-connected components. returns (labels int32, count)."""
    h, w = mask.shape
    lab = np.zeros(mask.shape, np.int32)
    flat = mask.ravel()
    lflat = lab.ravel()
    n = 0
    for start in np.flatnonzero(flat):
        if lflat[start]:
            continue
        n += 1
        lflat[start] = n
        stack = [start]
        while stack:
            i = stack.pop()
            y, x = divmod(i, w)
            for dy in (-1, 0, 1):
                yy = y + dy
                if yy < 0 or yy >= h:
                    continue
                for dx in (-1, 0, 1):
                    xx = x + dx
                    if xx < 0 or xx >= w:
                        continue
                    j = yy * w + xx
                    if flat[j] and not lflat[j]:
                        lflat[j] = n
                        stack.append(j)
    return lab, n


# --------------------------------------------------------------------------------------------------
# frame detection / snapping
# --------------------------------------------------------------------------------------------------
def ridge_mask(g, thr=5.0, off=4):
    """Thin lines running along x (lighter OR darker than both sides), dilated +-1 row."""
    n = np.nan
    up = np.full_like(g, n)
    dn = np.full_like(g, n)
    up2 = np.full_like(g, n)
    dn2 = np.full_like(g, n)
    up[off:] = g[:-off]
    dn[:-off] = g[off:]
    up2[off + 1:] = g[:-off - 1]
    dn2[:-off - 1] = g[off + 1:]
    best = np.zeros_like(g)
    for u, d in ((up, dn), (up2, dn), (up, dn2), (up2, dn2)):
        c = np.abs(g - (u + d) / 2)
        ok = np.abs(u - d) < 6
        c = np.where(ok & ~np.isnan(c), c, 0)
        best = np.maximum(best, c)
    m = best >= thr
    out = m.copy()
    out[1:] |= m[:-1]
    out[:-1] |= m[1:]
    return out


class Lines:
    """Thin-line masks of one sheet: hm (lines along x), vm (lines along y)."""

    def __init__(self, rgb):
        g = rgb.astype(np.float32).mean(axis=2)
        self.hm = ridge_mask(g)
        self.vm = ridge_mask(g.T.copy()).T

    def hscore(self, y, xa, xb):
        if y < 0 or y >= self.hm.shape[0] or xb <= xa:
            return 0.0
        return float(self.hm[y, xa:xb].mean())

    def vscore(self, x, ya, yb):
        if x < 0 or x >= self.vm.shape[1] or yb <= ya:
            return 0.0
        return float(self.vm[ya:yb, x].mean())

    def snap_h(self, y, xa, xb, r):
        ys = list(range(y - r, y + r + 1))
        sc = np.array([self.hscore(v, xa, xb) for v in ys])
        return self._pick(ys, sc, y)

    def snap_v(self, x, ya, yb, r):
        xs = list(range(x - r, x + r + 1))
        sc = np.array([self.vscore(v, ya, yb) for v in xs])
        return self._pick(xs, sc, x)

    @staticmethod
    def _pick(pos, sc, seed):
        m = sc.max()
        if m <= 0:
            return seed, 0.0
        good = [p for p, s in zip(pos, sc) if s >= 0.9 * m]
        # plateau nearest to the seed, centre of that plateau
        good.sort(key=lambda p: abs(p - seed))
        first = good[0]
        plateau = [p for p in good if abs(p - first) <= 2]
        return int(round(sum(plateau) / len(plateau))), float(m)

    def snap_rect(self, seed, r=SNAP_RADIUS):
        x0, y0, x1, y1 = seed
        fw, fh = x1 - x0, y1 - y0
        for _ in range(2):
            ya, yb = y0 + int(0.12 * fh), y1 - int(0.12 * fh)
            xa, xb = x0 + int(0.12 * fw), x1 - int(0.12 * fw)
            nx0, s_l = self.snap_v(x0, ya, yb, r)
            nx1, s_r = self.snap_v(x1, ya, yb, r)
            ny0, s_t = self.snap_h(y0, xa, xb, r)
            ny1, s_b = self.snap_h(y1, xa, xb, r)
            x0, y0, x1, y1 = nx0, ny0, nx1, ny1
        return (x0, y0, x1, y1), (s_l, s_t, s_r, s_b)

    def grid_lines(self, rect, w, h):
        """Faint inner cell lines: ([x...], [y...]) snapped near their expected position."""
        x0, y0, x1, y1 = rect
        xs, ys = [], []
        for k in range(1, w):
            e = int(round(x0 + k * (x1 - x0) / w))
            p, s = self.snap_v(e, y0 + 6, y1 - 6, 9)
            if s >= 0.3:
                xs.append(p)
        for k in range(1, h):
            e = int(round(y0 + k * (y1 - y0) / h))
            p, s = self.snap_h(e, x0 + 6, x1 - 6, 9)
            if s >= 0.3:
                ys.append(p)
        return xs, ys


# --------------------------------------------------------------------------------------------------
# cut-out of one item
# --------------------------------------------------------------------------------------------------
def fit_backdrop(R, ring_mask):
    """Plane (per channel) fitted to the backdrop pixels selected by ring_mask."""
    h, w, _ = R.shape
    yy, xx = np.mgrid[0:h, 0:w]
    sel = ring_mask.copy()
    med = np.median(R[sel], axis=0)
    for _ in range(3):
        close = sel & (np.abs(R - med).max(axis=2) < 8)
        if close.sum() < 50:
            break
        sel = close
    A = np.stack([np.ones(sel.sum()), xx[sel], yy[sel]], axis=1).astype(np.float64)
    full = np.stack([np.ones(h * w), xx.ravel(), yy.ravel()], axis=1).astype(np.float64)
    out = np.empty((h, w, 3), np.float32)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, R[sel][:, c].astype(np.float64), rcond=None)
        out[:, :, c] = (full @ coef).reshape(h, w)
    return out


def remove_lines(R, bg, hlines, vlines, hspan, vspan, grid_h=(), grid_v=()):
    """Overwrite frame / grid line pixels with the backdrop. hlines: list of y, vlines: list of x
    (local coordinates). hspan / vspan: (a, b) extent along the line.

    For every line the cross-section profile is measured where the backdrop is clean on both sides. A pixel
    of the line zone is removed when it has the colour of that profile and the backdrop is visible just
    outside the line on at least one side, so item pixels that cross the line stay. The faint inner grid lines
    are drawn over the items too: where an item pixel of such a line has item on both sides, the 2-4 px of the
    line are bridged by interpolating between the two neighbouring rows / columns."""
    h, w, _ = R.shape
    dev = np.abs(R - bg).max(axis=2)
    bgl = dev <= 7.0
    out = R.copy()
    for orient, coords, span in (("h", hlines, hspan), ("v", vlines, vspan)):
        if orient == "v":
            Rt, bgt, bglt, outt = R.transpose(1, 0, 2), bg.transpose(1, 0, 2), bgl.T, out.transpose(1, 0, 2)
            lim = w
        else:
            Rt, bgt, bglt, outt = R, bg, bgl, out
            lim = h
        for c in coords:
            a, b = max(0, span[0]), span[1]
            if c - 9 < 0 or c + 10 >= lim:
                continue
            clean = bglt[c - 9:c - 6, a:b].all(axis=0) & bglt[c + 8:c + 11, a:b].all(axis=0)
            if clean.sum() < 10:
                continue
            rows = range(c - 4, c + 6)
            prof, line_rows = {}, []
            for r in rows:
                prof[r] = np.median(Rt[r, a:b][clean], axis=0)
                if np.abs(prof[r] - np.median(bgt[r, a:b][clean], axis=0)).max() >= 3:
                    line_rows.append(r)
            if not line_rows:
                continue
            r0, r1 = min(line_rows), max(line_rows)
            side = bglt[r0 - 2, a:b] | bglt[r1 + 2, a:b]
            is_grid = c in (grid_h if orient == "h" else grid_v)
            both_item = ~bglt[r0 - 2, a:b] & ~bglt[r1 + 2, a:b]
            for r in line_rows:
                seg = Rt[r, a:b]
                like = np.abs(seg - prof[r]).max(axis=1) <= 14
                sel = like & side
                outt[r, a:b][sel] = bgt[r, a:b][sel]
                if is_grid:
                    t = (r - (r0 - 2)) / float(r1 + 2 - (r0 - 2))
                    lerp = Rt[r0 - 2, a:b] * (1 - t) + Rt[r1 + 2, a:b] * t
                    br = both_item & ~sel
                    outt[r, a:b][br] = lerp[br]
    return out


def erase_label(R, bg, fx0, fy0, fx1, fy1):
    """Remove the small light "2x3" footprint label in the top-left corner of the frame (isolated light glyphs)."""
    h, w, _ = R.shape
    zx1, zy1 = fx0 + min(int(0.5 * (fx1 - fx0)), 110), fy0 + 46
    zone = np.zeros((h, w), bool)
    zone[fy0 + 3:zy1, fx0 + 3:zx1] = True
    lum = R.mean(axis=2)
    blum = bg.mean(axis=2)
    cand = zone & (lum - blum >= 16) & (np.abs(R - bg).max(axis=2) >= 16)
    dil = dilate(cand, 1)
    lab, n = label(dil)
    if not n:
        return R
    dev = np.abs(R - bg).max(axis=2)
    bgl = dev <= 8.0
    out = R.copy()
    for i, sl in enumerate(_slices(lab, n), start=1):
        if sl is None:
            continue
        ys, xs = sl
        if ys.stop - ys.start > 26 or xs.stop - xs.start > 80:
            continue
        comp = lab == i
        ring = dilate(comp, 4) & ~dilate(comp, 2)
        if ring.sum() == 0 or bgl[ring].mean() < 0.85:
            continue
        sel = dilate(comp, 2)
        out[sel] = bg[sel]
    return out


def _flood(seed, allowed, step_ok_r, step_ok_d):
    """4-connected flood of `allowed` pixels from `seed`; a move is only made if the colour step test passes."""
    h, w = allowed.shape
    okr = (step_ok_r & allowed & shift(allowed, 0, 1, False)).ravel().tolist()
    okd = (step_ok_d & allowed & shift(allowed, 1, 0, False)).ravel().tolist()
    okl = np.zeros(h * w, bool)
    oku = np.zeros(h * w, bool)
    okr_a, okd_a = np.array(okr), np.array(okd)
    okl[1:] = okr_a[:-1]
    oku[w:] = okd_a[:-w]
    okl, oku = okl.tolist(), oku.tolist()
    seen = seed.ravel().tolist()
    stack = [int(i) for i in np.flatnonzero(seed.ravel())]
    while stack:
        i = stack.pop()
        if okr[i] and not seen[i + 1]:
            seen[i + 1] = True
            stack.append(i + 1)
        if okl[i] and not seen[i - 1]:
            seen[i - 1] = True
            stack.append(i - 1)
        if okd[i] and not seen[i + w]:
            seen[i + w] = True
            stack.append(i + w)
        if oku[i] and not seen[i - w]:
            seen[i - w] = True
            stack.append(i - w)
    return np.array(seen, bool).reshape(h, w)


def flood_backdrop(R, bg, opts=None):
    """Boolean mask of the backdrop (plus its soft contact shadow) connected to the border of R.
    Decisions are taken on a slightly blurred copy because the painted shadow is noisy."""
    opts = opts or {}
    h, w, _ = R.shape
    S = np.stack([gaussian(R[:, :, c], 0.9) for c in range(3)], axis=2)
    dev = np.abs(S - bg).max(axis=2)
    ratio = S / np.maximum(bg, 1.0)
    k = ratio.mean(axis=2)
    cd = ratio.max(axis=2) - ratio.min(axis=2)
    border = np.zeros((h, w), bool)
    border[0, :] = border[-1, :] = True
    border[:, 0] = border[:, -1] = True

    def steps(limit):
        r = np.zeros((h, w), bool)
        d = np.zeros((h, w), bool)
        r[:, :-1] = np.abs(S[:, 1:] - S[:, :-1]).max(axis=2) <= limit
        d[:-1] = np.abs(S[1:] - S[:-1]).max(axis=2) <= limit
        return r, d

    # pass 1: plain backdrop and light shade, crisp colour steps stop the fill
    allowed = (dev <= BG_TOL) | ((k <= 1.06) & (k >= SHADE_MIN) & (cd <= SHADE_CHROMA))
    if opts.get("bright_max"):
        # backdrop brightened by a glow: bright, colourless and smooth (pale items are textured, so they stay)
        allowed |= ((k >= 0.95) & (k <= opts["bright_max"]) & (cd <= opts.get("bright_chroma", SHADE_CHROMA))
                    & (local_std(R.mean(axis=2), 2) <= opts.get("bright_texture", 3.0)))
    r1, d1 = steps(STEP_MAX)
    flooded = _flood(border & allowed, allowed, r1, d1)
    # pass 2: grow into the darker, smooth contact shadow. The painted shadow warms up the darker it gets, so
    # the allowed chroma grows with the darkness; the fill still stops at crisp colour steps.
    S2 = np.stack([gaussian(R[:, :, c], 1.4) for c in range(3)], axis=2)
    ratio2 = S2 / np.maximum(bg, 1.0)
    k2 = ratio2.mean(axis=2)
    cd2 = ratio2.max(axis=2) - ratio2.min(axis=2)
    allowed2 = (k2 <= 1.15) & (k2 >= SHADOW_MIN) & (cd2 <= SHADOW_CHROMA + 0.18 * (1.0 - np.minimum(k2, 1.0)))
    r2 = np.zeros((h, w), bool)
    d2 = np.zeros((h, w), bool)
    r2[:, :-1] = np.abs(S2[:, 1:] - S2[:, :-1]).max(axis=2) <= opts.get("shadow_step", SHADOW_STEP)
    d2[:-1] = np.abs(S2[1:] - S2[:-1]).max(axis=2) <= opts.get("shadow_step", SHADOW_STEP)
    allowed2 &= local_std(R.mean(axis=2), 2) <= opts.get("shadow_texture", SHADOW_TEXTURE)      # painted shadows are smooth, painted metal is not
    flooded = _flood(flooded, allowed2 | flooded, r2, d2)
    raw_dev = np.abs(R - bg).max(axis=2)
    strict = raw_dev <= POCKET_DEV
    shade = allowed2
    return flooded, raw_dev, strict, shade, S


def max_filter(m, n=1):
    return dilate(m, n)


def crisp_fraction(comp, G):
    """Fraction of the outline of a pocket that lies on a crisp colour step (gradient mask G)."""
    edge = comp & ~erode(comp)
    if not edge.any():
        return 0.0
    return float(dilate(G, 1)[edge].mean())


def cut_window(P, rect, w, h, lines, win, opts):
    """Cut one item out of the sheet window win = (ex0, ey0, ex1, ey1) in sheet coordinates.
    Returns a dict (alpha, colour, window geometry, ...) or None when nothing is left."""
    x0, y0, x1, y1 = rect
    ex0, ey0, ex1, ey1 = win
    R = P[ey0:ey1, ex0:ex1].copy()
    eh, ew, _ = R.shape
    fx0, fy0, fx1, fy1 = x0 - ex0, y0 - ey0, x1 - ex0, y1 - ey0

    # backdrop plane from the ring outside the frame (>= 4 px away)
    ring = np.ones((eh, ew), bool)
    ring[max(0, fy0 - 4):fy1 + 5, max(0, fx0 - 4):fx1 + 5] = False
    if ring.sum() < 200:
        ring = np.ones((eh, ew), bool)
    bg = fit_backdrop(R, ring)

    # frame lines and inner grid lines
    gx, gy = lines.grid_lines(rect, w, h)
    hl = [fy0, fy1] + [v - ey0 for v in gy]
    vl = [fx0, fx1] + [v - ex0 for v in gx]
    R2 = remove_lines(R, bg, hl, vl, (fx0 - 4, fx1 + 5), (fy0 - 4, fy1 + 5),
                      grid_h=[v - ey0 for v in gy], grid_v=[v - ex0 for v in gx])
    R2 = erase_label(R2, bg, fx0, fy0, fx1, fy1)
    base_zone = max(24, int(0.16 * (fy1 - fy0)))          # foot of the frame: contact shadows live here
    flooded, dev, strict, shade, S = flood_backdrop(R2, bg, opts)
    fg = ~flooded

    # crisp colour steps (used to tell a real hole from a flat patch of the item that merely looks like backdrop)
    gx_ = np.zeros(S.shape[:2], np.float32)
    gy_ = np.zeros(S.shape[:2], np.float32)
    gx_[:, 2:-2] = np.abs(S[:, 4:] - S[:, :-4]).max(axis=2)
    gy_[2:-2] = np.abs(S[4:] - S[:-4]).max(axis=2)
    G = np.maximum(gx_, gy_) >= CRISP_STEP

    # enclosed backdrop pockets (ring holes, gaps between legs / chain links, key windows ...). Only pixels that
    # match the backdrop plane, and only when the pocket is outlined by a crisp step (or is thin): a big flat
    # patch of the item itself in the backdrop colour has no such outline and must survive.
    if opts.get("pockets", True):
        lab, n = label(fg & strict)
        if n:
            areas = np.bincount(lab.ravel(), minlength=n + 1)
            for i, sl in enumerate(_slices(lab, n), start=1):
                if sl is None or areas[i] < POCKET_MIN_AREA:
                    continue
                comp = lab[sl] == i
                pad = np.pad(comp, 3)
                Gp = np.pad(G[sl], 3)
                cf = crisp_fraction(pad, Gp)
                if opts.get("debug") is not None:
                    opts["debug"].append((int(areas[i]), sl[1].start + ex0, sl[0].start + ey0, sl[1].stop + ex0,
                                          sl[0].stop + ey0, round(cf, 2)))
                if areas[i] < POCKET_THIN_AREA or cf >= POCKET_CRISP:
                    fg[sl][comp] = False
        # big smooth pockets that show the backdrop in shade (floor inside a ring or crown)
        ratio_s = S / np.maximum(bg, 1.0)
        k_s = ratio_s.mean(axis=2)
        cd_s = ratio_s.max(axis=2) - ratio_s.min(axis=2)
        flat = local_std(R.mean(axis=2), 2) <= SHADOW_TEXTURE
        shade_pocket = fg & shade & flat & (k_s >= 0.6) & (cd_s <= SHADOW_CHROMA + 0.18 * (1.0 - np.minimum(k_s, 1.0)))
        lab, n = label(shade_pocket)
        if n:
            areas = np.bincount(lab.ravel(), minlength=n + 1)
            for i, sl in enumerate(_slices(lab, n), start=1):
                if sl is None or areas[i] < opts.get("big_pocket_area", BIG_POCKET_AREA):
                    continue
                comp = lab[sl] == i
                cf = crisp_fraction(np.pad(comp, 3), np.pad(G[sl], 3))
                if opts.get("debug") is not None:
                    opts["debug"].append(("shade", int(areas[i]), sl[1].start + ex0, sl[0].start + ey0,
                                          sl[1].stop + ex0, sl[0].stop + ey0, round(cf, 2)))
                if cf >= opts.get("pocket_crisp", POCKET_CRISP):
                    fg[sl][comp] = False

    # optional: grow the removed backdrop through neutral smudges of any texture (shaded glass, cast shadows
    # that the plain fill could not cross); only for items that need it, the colour test keeps coloured item parts
    if opts.get("grow_backdrop"):
        ratio_g = S / np.maximum(bg, 1.0)
        k_g = ratio_g.mean(axis=2)
        cd_g = ratio_g.max(axis=2) - ratio_g.min(axis=2)
        gc_base, gc_slope = opts.get("grow_chroma", (0.03, 0.18))
        ok_g = (k_g >= opts.get("grow_k_min", 0.25)) & (k_g <= 1.15) & (cd_g <= gc_base + gc_slope * (1.0 - np.minimum(k_g, 1.0)))
        allow = (~fg) | ok_g
        yes = np.ones(fg.shape, bool)
        grown = _flood(~fg, allow, yes, yes)
        fg = ~grown

    # peel the soft rim of the contact shadow that the fill could not reach: boundary pixels that look like the
    # backdrop in shade (neutral warm grey, smooth) are removed ring by ring. Harder at the foot of the frame.
    ratio = S / np.maximum(bg, 1.0)
    kk = ratio.mean(axis=2)
    cc = ratio.max(axis=2) - ratio.min(axis=2)
    smooth = local_std(R.mean(axis=2), 2) <= opts.get("shadow_texture", SHADOW_TEXTURE) + 1.0
    neutral = cc <= SHADOW_CHROMA + 0.18 * (1.0 - np.minimum(kk, 1.0))
    shadowlike = (kk >= SHADOW_MIN) & (kk <= PEEL_K_MAX) & neutral & smooth
    foot = np.zeros(kk.shape, bool)
    foot[max(0, fy1 - base_zone):, :] = True
    shadowlike &= foot
    foot_like = (kk >= FOOT_K_MIN) & (kk <= PEEL_K_FOOT) & neutral & (smooth | (local_std(R.mean(axis=2), 1) <= FOOT_EDGE_STD))
    if opts.get("peel_all"):
        foot_like = (kk >= SHADOW_MIN) & (kk <= PEEL_K_FOOT) & neutral & smooth
    else:
        foot_like[:max(0, fy1 - (FOOT_BAND_SMALL if (fy1 - fy0) <= 360 else FOOT_BAND)), :] = False
    if opts.get("dump") is not None:
        opts["dump"].update(kk=kk, cc=cc, smooth=smooth, neutral=neutral, fg=fg.copy(), foot_like=foot_like,
                           win=win, frame=(fx0, fy0, fx1, fy1))
    for it in range(opts.get("peel_rings", PEEL_RINGS_FOOT)):
        edge = fg & ~erode(fg)
        rem = edge & (foot_like | (shadowlike if it < PEEL_RINGS else False))
        if not rem.any():
            break
        fg = fg & ~rem

    # corner label ("2x3"), dust, things that belong to neighbours / the title / the caption below the frame
    dil = dilate(fg, 3)
    lab, n = label(dil)
    keep = np.zeros(n + 1, bool)
    inner = np.zeros((eh, ew), bool)
    inner[fy0 + 3:fy1 - 2, fx0 + 3:fx1 - 2] = True
    zone_x1, zone_y1 = fx0 + max(70, int(0.45 * (fx1 - fx0))), fy0 + 55
    removed_label = False
    for i, sl in enumerate(_slices(lab, n), start=1):
        if sl is None:
            continue
        ys, xs = sl
        comp = (lab[ys, xs] == i)
        touches = (comp & inner[ys, xs]).any()
        bh = ys.stop - ys.start
        area = int(comp.sum())
        in_label_zone = (xs.start >= fx0 - 2 and xs.stop <= zone_x1 and ys.start >= fy0 - 2 and ys.stop <= zone_y1
                         and bh < 40 and area < 2500)
        if in_label_zone:
            removed_label = True
            continue
        keep[i] = touches and area >= MIN_PIECE_AREA
    fg &= keep[lab]
    if not fg.any():
        return None
    # leftovers of the frame's bottom line / its shadow: in the rows around the bottom line, fg pixels whose
    # vertical run is short (<= 7 px) are streaks, not parts of the item (the item body above is much taller)
    band = np.zeros(fg.shape, bool)
    band[max(0, fy1 - 5):fy1 + 8, :] = True
    run = np.zeros(fg.shape, np.int32)
    for y in range(fg.shape[0]):
        run[y] = np.where(fg[y], (run[y - 1] if y else 0) + 1, 0)
    for y in range(fg.shape[0] - 2, -1, -1):
        run[y] = np.where(fg[y] & (run[y + 1] > 0), np.maximum(run[y], run[y + 1]), run[y])
    fg &= ~(band & (run <= 7))
    if not fg.any():
        return None
    # thin horizontal streaks that hang detached below / beside the item (rim of a contact shadow, left over
    # bits of the frame line): not connected to the item itself, low and wide
    lab2, n2 = label(fg)
    if n2 > 1:
        areas2 = np.bincount(lab2.ravel(), minlength=n2 + 1)
        biggest = areas2[1:].max()
        for i, sl in enumerate(_slices(lab2, n2), start=1):
            if sl is None or areas2[i] >= 0.05 * biggest:
                continue
            bh, bw = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            if bh <= 7 and bw >= 2.5 * bh:
                fg[sl][lab2[sl] == i] = False

    # soft edge. The 1-2 px rim of a cut-out is a blend of item and backdrop (grey halo), so the colours of
    # the rim are replaced by colours grown outward from the item core; alpha comes from the shape.
    rim = fg & ~erode(fg)
    shape = fg & ~(rim & (dev < 20.0))
    core = erode(shape, 2)
    core |= shape & ~dilate(core, 2)          # parts thinner than 4 px keep their own colours
    colour = R2.copy()
    known = core.copy()
    for _ in range(8):
        grow = dilate(known) & ~known
        if not grow.any():
            break
        acc = np.zeros_like(colour)
        cnt = np.zeros(known.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == 0 and dx == 0:
                    continue
                kn = shift(known, dy, dx, False)
                acc += shift(colour, dy, dx, 0.0) * kn[..., None]
                cnt += kn
        sel = grow & (cnt > 0)
        colour[sel] = acc[sel] / cnt[sel][:, None]
        known = known | sel
    mean_col = R2[core].mean(axis=0) if core.any() else np.array([128, 128, 128], np.float32)
    colour[~known] = mean_col
    alpha = np.clip(gaussian(shape.astype(np.float32), 0.75) * 1.25, 0, 1)
    alpha[~dilate(shape, 2)] = 0.0
    edge = shape & ~erode(shape)
    alpha[edge] = np.maximum(alpha[edge], 0.55)
    ys_, xs_ = np.nonzero(alpha > 0.05)
    return {"alpha": alpha, "colour": colour, "mean_col": mean_col, "frame": (fx0, fy0, fx1, fy1),
            "win": win, "ext": (int(xs_.min()), int(ys_.min()), int(xs_.max()) + 1, int(ys_.max()) + 1),
            "label_removed": removed_label}


def erase_polys(img, polys, max_sat):
    """Per-item erase mask: inside each polygon (icon pixel coordinates of the w*cell x h*cell canvas) the pixels
    that are low in saturation (grey cast shadow) become transparent. Saturated item colours (gold, olive, teal
    patina) inside a polygon stay. Crop and mask only, nothing is painted."""
    from PIL import ImageDraw
    m = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(m)
    for poly in polys:
        d.polygon(poly, fill=255)
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1.0)
    kill = (np.asarray(m) > 0) & (sat <= max_sat)
    a = np.asarray(img.getchannel("A")).copy()
    a[kill] = 0
    # backstop: specks that the erase left floating (area < 80 px on the icon) are dust
    lab, n = label(a > 8)
    if n:
        areas = np.bincount(lab.ravel(), minlength=n + 1)
        small = areas < 80
        small[0] = False
        a[small[lab]] = 0
    out = img.copy()
    out.putalpha(Image.fromarray(a))
    return out


def cut_item(P, rect, w, h, lines, cell=CELL, opts=None, limits=None):
    """Cut one item out of the sheet P (float32 RGB). Returns (RGBA PIL image w*cell x h*cell, info dict).

    The search window starts MARGIN px around the frame and grows (up to `limits` = (xmin, ymin, xmax, ymax) in
    sheet coordinates: neighbour frames, title row, caption row) on every side where the cut-out touches the
    window edge, so that parts sticking out of the frame are never cut flat."""
    opts = opts or {}
    H, W, _ = P.shape
    x0, y0, x1, y1 = rect
    lim = limits or (0, 0, W, H)
    lim = (max(0, lim[0]), max(0, lim[1]), min(W, lim[2]), min(H, lim[3]))
    m = {"l": MARGIN, "t": MARGIN, "r": MARGIN, "b": MARGIN_BOTTOM}
    for _ in range(12):
        win = (max(lim[0], x0 - m["l"]), max(lim[1], y0 - m["t"]), min(lim[2], x1 + m["r"] + 1),
               min(lim[3], y1 + m["b"] + 1))
        res = cut_window(P, rect, w, h, lines, win, opts)
        if res is None:
            return None, {"error": "empty mask"}
        ex0, ey0, ex1, ey1 = win
        ax0, ay0, ax1, ay1 = res["ext"]
        touch = {"l": ax0 <= 2 and ex0 > 0, "t": ay0 <= 2 and ey0 > 0,
                 "r": ax1 >= ex1 - ex0 - 2 and ex1 < W, "b": ay1 >= ey1 - ey0 - 2 and ey1 < H}
        room = {"l": ex0 > lim[0], "t": ey0 > lim[1], "r": ex1 < lim[2], "b": ey1 < lim[3]}
        grow = [k for k in "ltrb" if touch[k] and room[k]]
        if not grow:
            break
        for k in grow:
            m[k] += GROW_STEP
    cut_flat = [k for k in "ltrb" if touch[k] and not room[k]]

    alpha, colour, mean_col = res["alpha"], res["colour"], res["mean_col"]
    fx0, fy0, fx1, fy1 = res["frame"]
    eh, ew = alpha.shape
    # region mapped to the canvas: frame + whatever sticks out, widened to the footprint aspect
    bx0, bx1 = min(ax0, fx0), max(ax1, fx1)
    by0, by1 = min(ay0, fy0), max(ay1, fy1)
    cw, ch = bx1 - bx0, by1 - by0
    a = w / h
    if cw / ch < a:
        nw = ch * a
        bx0 -= (nw - cw) / 2
        bx1 += (nw - cw) / 2
    else:
        nh = cw / a
        by0 -= (nh - ch)
    sticks = {"left": int(max(0, fx0 - ax0)), "right": int(max(0, ax1 - fx1)),
              "top": int(max(0, fy0 - ay0)), "bottom": int(max(0, ay1 - fy1))}

    pad = 200
    cimg = np.zeros((eh + 2 * pad, ew + 2 * pad, 3), np.uint8)
    cimg[:] = mean_col.astype(np.uint8)
    cimg[pad:pad + eh, pad:pad + ew] = np.clip(colour + 0.5, 0, 255).astype(np.uint8)
    aimg = np.zeros((eh + 2 * pad, ew + 2 * pad), np.uint8)
    aimg[pad:pad + eh, pad:pad + ew] = np.clip(alpha * 255 + 0.5, 0, 255).astype(np.uint8)
    box = (bx0 + pad, by0 + pad, bx1 + pad, by1 + pad)
    size = (w * cell, h * cell)
    rgb_s = Image.fromarray(cimg).resize(size, Image.LANCZOS, box=box)
    a_s = Image.fromarray(aimg).resize(size, Image.LANCZOS, box=box)
    out = rgb_s.convert("RGBA")
    out.putalpha(a_s)
    if opts.get("erase_polys"):
        out = erase_polys(out, opts["erase_polys"], opts.get("erase_sat", 0.22))
    info = {"sticks_out_px": sticks, "label_removed": res["label_removed"],
            "scale": round(size[0] / (bx1 - bx0), 3), "window_margins": dict(m), "cut_flat_sides": cut_flat}
    return out, info


def _slices(lab, n):
    """bounding slices of every label (1..n)."""
    res = [None] * n
    ys, xs = np.nonzero(lab)
    ls = lab[ys, xs]
    order = np.argsort(ls, kind="stable")
    ls, ys, xs = ls[order], ys[order], xs[order]
    bounds = np.searchsorted(ls, np.arange(1, n + 2))
    for i in range(n):
        a, b = bounds[i], bounds[i + 1]
        if b > a:
            res[i] = (slice(int(ys[a:b].min()), int(ys[a:b].max()) + 1),
                      slice(int(xs[a:b].min()), int(xs[a:b].max()) + 1))
    return res


# --------------------------------------------------------------------------------------------------
# sheet bookkeeping
# --------------------------------------------------------------------------------------------------
def slugify(label):
    """'W01 IRON CANDLE-STAND' -> ('W01', 'iron_candle_stand')"""
    first, _, rest = label.partition(" ")
    rest = rest.replace("'", "").replace("’", "")
    slug = re.sub(r"[^a-z0-9]+", "_", rest.lower()).strip("_")
    return first.upper(), slug


def load_catalogue():
    """ID -> (English name, Vietnamese gloss) from the item tables of ASHLAR_ITEMS_VI.md."""
    names = {}
    if not CATALOGUE.exists():
        return names
    for line in CATALOGUE.read_text(encoding="utf8").splitlines():
        m = re.match(r"^\|\s*([A-Z]\d{2})\s*\|\s*([^|]*)\|", line)
        if not m:
            continue
        cell = m.group(2).strip()
        parts = re.split(r"\s+[—-]\s+", cell, maxsplit=1)
        en = parts[0].replace("*", "").strip()
        vi = parts[1].replace("*", "").strip() if len(parts) > 1 else ""
        names[m.group(1)] = (en, vi)
    return names


def find_sheets(only):
    """Approved item sheets named in the manifest (entries whose file name is IT-##_*.png). Only the file name
    and the `source` field are used, the folder is taken from SHEET_DIR."""
    manifest = json.loads(MANIFEST.read_text(encoding="utf8"))
    sheets = {}
    for e in manifest["files"]:
        name = Path(e["file"]).name
        if not re.match(r"^IT-\d\d_.*\.png$", name):
            continue
        sheets[name[:5]] = {"file": SHEET_DIR / name, "source": e.get("source", "")}
    if only:
        sheets = {k: v for k, v in sheets.items() if k in only}
    return dict(sorted(sheets.items()))


def find_template(it):
    hits = sorted(glob.glob(str(BATCH_DIR / "batch*" / (it + "_*.template.json"))))
    if not hits:
        return None, None
    d = json.loads(Path(hits[0]).read_text(encoding="utf8"))
    items = []
    for i in d["items"]:
        id_, slug = slugify(i["label"])
        items.append({"id": id_, "slug": slug, "label": i["label"], "w": i["w"], "h": i["h"]})
    return items, Path(hits[0])


def contact_sheet(path, entries):
    """entries: list of (caption, RGBA image). Each icon on a checkerboard and on a dark background."""
    from PIL import ImageDraw
    pad, cap_h = 10, 28
    tiles = []
    for cap, im in entries:
        w, h = im.size
        yy, xx = np.mgrid[0:h, 0:w]
        v = np.where(((xx // 16) + (yy // 16)) % 2 == 0, 200, 120).astype(np.uint8)
        chk = Image.fromarray(np.stack([v, v, v, np.full_like(v, 255)], axis=2), "RGBA")
        chk.alpha_composite(im)
        dark = Image.new("RGBA", (w, h), (26, 22, 24, 255))
        dark.alpha_composite(im)
        tiles.append((cap, chk, dark))
    max_row = 2400
    rows, cur, curw = [], [], 0
    for t in tiles:
        tw = t[1].width * 2 + pad * 3
        if cur and curw + tw > max_row:
            rows.append(cur)
            cur, curw = [], 0
        cur.append(t)
        curw += tw
    if cur:
        rows.append(cur)
    width = max(sum(t[1].width * 2 + pad * 3 for t in r) for r in rows)
    height = sum(max(t[1].height for t in r) + cap_h + pad for r in rows) + pad
    sheet = Image.new("RGB", (width, height), (60, 60, 64))
    d = ImageDraw.Draw(sheet)
    y = pad
    for r in rows:
        x = pad
        rh = max(t[1].height for t in r)
        for cap, chk, dark in r:
            sheet.paste(chk.convert("RGB"), (x, y))
            sheet.paste(dark.convert("RGB"), (x + chk.width + pad, y))
            d.text((x, y + rh + 6), cap, fill=(255, 255, 255))
            x += chk.width * 2 + pad * 3
        y += rh + cap_h + pad
    sheet.save(path)


# --------------------------------------------------------------------------------------------------
# note file
# --------------------------------------------------------------------------------------------------
def fp_str(w, h, sep="x"):
    return f"{w}{sep}{h}"


def write_note(md_path, icons_rel, records, skipped, names):
    by_cat = {}
    for r in records:
        by_cat.setdefault(r["category"], []).append(r)
    drawn = {r["id"] for r in records}
    L = []
    L.append("# ASHLAR — Kích thước ô inventory của icon item")
    L.append("")
    L.append("> File này do `ashlar/pipeline/items/split_item_sheets.py` sinh ra, đừng sửa tay. Chạy lại script (kèm `--force`) để cập nhật.")
    L.append("")
    L.append("## Quy tắc")
    L.append("")
    L.append("- **Footprint = cột × hàng (rộng × cao)** trên lưới inventory kiểu Diablo II. Ví dụ `2×3` là rộng 2 ô, cao 3 ô.")
    L.append("- **Kích thước icon (px) = footprint × 128 px**: `1×1` = 128×128, `2×3` = 256×384, `2×4` = 256×512.")
    L.append("- Icon có **nền trong suốt** (PNG RGBA) và **không có khung độ hiếm**; UI tự ghép khung độ hiếm.")
    L.append("- Phần nào của item nhô ra ngoài khung footprint trên sheet vẫn được giữ; khi đó cả item được thu nhỏ đều cho vừa canvas, nên icon có lề trong suốt.")
    L.append("- Icon cắt từ sheet đã duyệt trong `ashlar/Art_Final/Item/`. Footprint lấy từ layout template đã dùng để gen từng sheet (`ashlar/art/items/_batches/`).")
    L.append("")
    L.append("### Footprint theo loại (ASHLAR_ITEMS_VI.md §1.3)")
    L.append("")
    L.append("| Loại | Footprint |")
    L.append("|---|---|")
    for t, f in TYPE_TABLE:
        L.append(f"| {t} | {f} |")
    L.append("")
    for cat in "CGWOAJMRQK":
        rs = sorted(by_cat.get(cat, []), key=lambda r: r["id"])
        if not rs:
            continue
        L.append(f"## {cat} — {CATEGORY_NAMES[cat]}")
        L.append("")
        L.append("| ID | Tên | Footprint | Icon | Sheet |")
        L.append("|---|---|---|---|---|")
        for r in rs:
            nm = r["name"] + (f" — {r['name_vi']}" if r["name_vi"] else "")
            L.append(f"| {r['id']} | {nm} | {r['footprint_str'].replace('x', '×')} | "
                     f"[{r['icon']}]({icons_rel}/{r['icon']}) | {r['sheet']} |")
        L.append("")
    L.append("## Ghi chú")
    L.append("")
    L.append("### Item trong danh mục chưa có icon")
    L.append("")
    missing = sorted(i for i in names if i not in drawn)
    if missing:
        for i in missing:
            why = next((s["reason"] for s in skipped if s["id"] == i), "chưa vẽ trong sheet nào")
            en, vi = names[i]
            L.append(f"- {i} {en}" + (f" — {vi}" if vi else "") + f": {why}")
    else:
        L.append("- Không có: mọi item của danh mục đều đã có icon.")
    L.append("")
    L.append("### Footprint khác quy tắc loại của §1.3")
    L.append("")
    diffs = []
    for r in sorted(records, key=lambda r: r["id"]):
        rule = TYPE_RULE.get(r["id"])
        if rule and tuple(rule[1]) != (r["footprint"]["w"], r["footprint"]["h"]):
            diffs.append((r, rule))
    if diffs:
        for r, rule in diffs:
            fp = r['footprint_str'].replace('x', '×')
            if r["id"] in FOOTPRINT_OVERRIDES:
                why = ("người dùng chọn footprint này (quyết định 26/10/2026) vì sheet vẽ một tấm màn dài, "
                       "không theo cỡ mũ")
            elif r["category"] == "M":
                why = "vật liệu lớn hơn nhóm vật liệu nhỏ (thỏi / bó dài chiếm 2 ô cao)"
            else:
                why = "sheet vẽ item lớn hơn quy tắc loại"
            L.append(f"- {r['id']} {r['name']}: {fp}, quy tắc loại «{rule[0]}» cho {fp_str(*rule[1], sep='×')}; "
                     f"{why}. Đây là ghi chú, không phải lỗi.")
    else:
        L.append("- Không có.")
    L.append("")
    L.append("### Item không có dòng phù hợp trong bảng loại §1.3")
    L.append("")
    nor = [r for r in sorted(records, key=lambda r: r["id"]) if r["id"] not in TYPE_RULE]
    if nor:
        L.append(", ".join(f"{r['id']} ({r['footprint_str'].replace('x', '×')})" for r in nor) + ".")
    else:
        L.append("- Không có.")
    L.append("")
    Path(md_path).write_text("\n".join(L), encoding="utf8", newline="\n")


# --------------------------------------------------------------------------------------------------
CANDIDATE_FOOTPRINTS = [(1, 1), (1, 2), (1, 3), (2, 1), (2, 2), (2, 3), (2, 4)]


def footprint_checks(items, rects):
    """Plausibility checks of the frames against the template footprints of one sheet.
    1. the template footprint must fit the frame aspect no worse than any other candidate footprint
       (slack ASPECT_SLACK in log space; footprints with the same aspect, e.g. 1x2 and 2x4, are a tie);
    2. cell size (fw/w, fh/h) must stay within CELL_SPREAD of the median of the sheet.
    Returns a list of (index, message) offenders."""
    cw = [(r[2] - r[0]) / it["w"] for it, r in zip(items, rects)]
    ch = [(r[3] - r[1]) / it["h"] for it, r in zip(items, rects)]
    mw, mh = float(np.median(cw)), float(np.median(ch))
    bad = []
    for i, (it, r) in enumerate(zip(items, rects)):
        a = (r[2] - r[0]) / (r[3] - r[1])
        err = abs(np.log(a / (it["w"] / it["h"])))
        best = min(CANDIDATE_FOOTPRINTS, key=lambda c: abs(np.log(a / (c[0] / c[1]))))
        berr = abs(np.log(a / (best[0] / best[1])))
        if err > berr + ASPECT_SLACK:
            bad.append((i, f"frame aspect {a:.2f} fits {best[0]}x{best[1]} better than the template {it['w']}x{it['h']}"))
        if abs(cw[i] / mw - 1) > CELL_SPREAD or abs(ch[i] / mh - 1) > CELL_SPREAD:
            bad.append((i, f"cell size {cw[i]:.0f}x{ch[i]:.0f} px deviates more than {CELL_SPREAD:.0%} from the "
                           f"sheet median {mw:.0f}x{mh:.0f}"))
    return bad


def load_existing(out_dir):
    f = out_dir / "inventory_sizes.json"
    if f.exists():
        try:
            return json.loads(f.read_text(encoding="utf8"))
        except ValueError:
            return None
    return None


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--force", action="store_true", help="overwrite existing outputs")
    ap.add_argument("--cell", type=int, default=CELL, help="pixels per inventory cell (default 128)")
    ap.add_argument("--sheets", nargs="*", help="only these sheets, e.g. IT-01 IT-05 (the json / md keep the others)")
    ap.add_argument("--out-dir", default=str(SHEET_DIR / "icons"))
    ap.add_argument("--md-path", default=None,
                    help="note file; default INVENTORY_SIZES_VI.md next to the icons folder when --out-dir is the "
                         "default, else INVENTORY_SIZES_VI.md inside --out-dir")
    ap.add_argument("--contact-dir", default=None, help="write QA contact sheets contact_<IT>.png here")
    ap.add_argument("--aspect-tol", type=float, default=ASPECT_TOL)
    args = ap.parse_args(argv)

    out_dir = Path(args.out_dir)
    if args.md_path:
        md_path = Path(args.md_path)
    elif out_dir.resolve() == (SHEET_DIR / "icons").resolve():
        md_path = SHEET_DIR / "INVENTORY_SIZES_VI.md"
    else:
        md_path = out_dir / "INVENTORY_SIZES_VI.md"
    only = set(args.sheets) if args.sheets else None
    sheets = find_sheets(only)
    seeds = json.loads(SEEDS.read_text(encoding="utf8"))
    names = load_catalogue()

    plan, problems = [], []
    for it, meta in sheets.items():
        items, tpl = find_template(it)
        if items is None:
            problems.append(f"{it}: no layout template found")
            continue
        for i in items:
            if i["id"] in FOOTPRINT_OVERRIDES:
                i["template_wh"] = (i["w"], i["h"])
                i["w"], i["h"] = FOOTPRINT_OVERRIDES[i["id"]]
        fr = seeds.get(it)
        if fr is None or len(fr) != len(items):
            problems.append(f"{it}: {0 if fr is None else len(fr)} frame seeds for {len(items)} template items; sheet skipped")
            continue
        plan.append((it, meta, items, tpl, fr))

    targets = [out_dir / "inventory_sizes.json", md_path]
    for it, meta, items, tpl, fr in plan:
        targets += [out_dir / (i["id"] + "_" + i["slug"] + ".png") for i in items]
    existing = [t for t in targets if t.exists()]
    if existing and not args.force:
        print(f"Refusing to overwrite {len(existing)} existing output(s), e.g. {existing[0]}. Use --force.")
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    if args.contact_dir:
        Path(args.contact_dir).mkdir(parents=True, exist_ok=True)

    records, skipped, report = [], [], []
    for it, meta, items, tpl, fr in plan:
        rgb = np.asarray(Image.open(meta["file"]).convert("RGB"))
        P = rgb.astype(np.float32)
        H, W, _ = P.shape
        lines = Lines(rgb)
        entries = []
        print(f"== {it}  {meta['file'].name}  ({len(items)} items, template {tpl.parent.name}/{tpl.name})")
        # the frames of one sheet stand on the same baseline: items and shadows hide parts of the bottom line,
        # so a weakly detected bottom is replaced by the baseline of the well detected ones
        snapped = [lines.snap_rect(sd) for sd in fr]
        good = [r[3] for r, sc in snapped if sc[3] >= 0.85]
        base = int(round(float(np.median(good if good else [sd[3] for sd in fr]))))
        rects, scs = [], []
        for (rect, sc), sd in zip(snapped, fr):
            if sc[3] < 0.85 and abs(sd[3] - base) <= 20:
                rect = (rect[0], rect[1], rect[2], base)
            rects.append(rect)
            scs.append(sc)
        offenders = {}
        # run the checks over the non-overridden items only, then map the offender indices back
        keep_idx = [k for k, i in enumerate(items) if i["id"] not in FOOTPRINT_OVERRIDES]
        for j, msg in footprint_checks([items[k] for k in keep_idx], [rects[k] for k in keep_idx]):
            offenders.setdefault(keep_idx[j], []).append(msg)

        for k, (item, rect, sc) in enumerate(zip(items, rects, scs)):
            fw, fh = rect[2] - rect[0], rect[3] - rect[1]
            aspect = fw / fh
            want = item["w"] / item["h"]
            tag = f"{item['id']:<4} {item['w']}x{item['h']}  frame {fw}x{fh}  aspect {aspect:.2f}/{want:.2f}  lines {min(sc):.2f}"
            fname = item["id"] + "_" + item["slug"] + ".png"
            skip_msg = None
            if abs(aspect / want - 1) > args.aspect_tol:
                skip_msg = f"aspect mismatch: frame {fw}x{fh} ({aspect:.2f}) vs template {item['w']}x{item['h']} ({want:.2f})"
            if "template_wh" in item:
                tw, th = item["template_wh"]
                print(f"   NOTE {item['id']}: footprint {item['w']}x{item['h']} is a user override (template says {tw}x{th})")
                report.append(f"{it} {item['id']}: footprint override {item['w']}x{item['h']} (template {tw}x{th}), "
                              f"frame aspect {aspect:.2f}")
            if skip_msg:
                print("   SKIP", tag, "->", skip_msg)
                skipped.append({"id": item["id"], "sheet": it, "reason": (
                    f"{it}: khung trên sheet {fw}×{fh} px (tỉ lệ {aspect:.2f}) không khớp footprint "
                    f"{item['w']}×{item['h']} ({want:.2f}), không cắt")})
                report.append(f"{it} {item['id']}: {skip_msg}")
                stale = out_dir / fname
                if stale.exists():
                    stale.unlink()
                    print(f"   removed stale icon {stale.name}")
                continue
            if k in offenders:
                # plausibility only: the measured deviations of real frames (up to 0.32) are as large as the
                # differences between neighbouring footprints, so this warns and the icon is still cut
                print("   WARN footprint check", tag, "->", "; ".join(offenders[k]))
                report.append(f"{it} {item['id']}: footprint check: {'; '.join(offenders[k])}")
            if min(sc) < 0.3:
                print("   WARN weak frame line", tag)
                report.append(f"{it} {item['id']}: weak frame line score {min(sc):.2f}")
            # window limits: neighbour frames, title row above, caption row below the frames
            lim_l = rects[k - 1][2] + 6 if k > 0 else 4
            lim_r = rects[k + 1][0] - 6 if k + 1 < len(rects) else W - 4
            limits = (lim_l, TOP_LIMIT, lim_r, rect[3] + BOTTOM_LIMIT)
            icon, info = cut_item(P, rect, item["w"], item["h"], lines, cell=args.cell,
                                  opts=ITEM_OPTS.get(item["id"]), limits=limits)
            if icon is None:
                print("   SKIP", tag, info)
                stale = out_dir / fname
                if stale.exists():
                    stale.unlink()
                    print(f"   removed stale icon {stale.name}")
                skipped.append({"id": item["id"], "sheet": it, "reason": f"{it}: cắt thất bại ({info.get('error')})"})
                continue
            icon.save(out_dir / fname, optimize=True)
            en, vi = names.get(item["id"], (item["label"].partition(" ")[2].title(), ""))
            rec = {
                "id": item["id"], "name": en, "name_vi": vi, "category": item["id"][0],
                "footprint": {"w": item["w"], "h": item["h"]},
                "footprint_str": fp_str(item["w"], item["h"]),
                "sheet": meta["file"].name, "sheet_source": meta["source"],
                "icon": fname, "icon_px": {"w": icon.width, "h": icon.height},
                "sticks_out_px": info["sticks_out_px"],
            }
            if "template_wh" in item:
                rec["footprint_override"] = (f"user decision 2026-10-26: template says "
                                             f"{item['template_wh'][0]}x{item['template_wh'][1]}")
            records.append(rec)
            st = info["sticks_out_px"]
            extra = "" if max(st.values()) < 4 else f"  sticks out {st}"
            print("   ok  ", tag, f"scale {info['scale']}{extra}  window {info['window_margins']}")
            if max(st.values()) >= 4:
                report.append(f"{it} {item['id']}: part sticks out of the frame {st} px (kept, scale {info['scale']})")
            if info["cut_flat_sides"]:
                msg = f"HARD WARNING: cut-out touches the window limit on side(s) {info['cut_flat_sides']}, a part may end flat"
                print("   ", msg)
                report.append(f"{it} {item['id']}: {msg}")
            entries.append((f"{item['id']} {item['w']}x{item['h']}", icon))
        if args.contact_dir and entries:
            contact_sheet(Path(args.contact_dir) / f"contact_{it}.png", entries)

    # subset runs merge into the existing json: only the processed sheets are replaced
    done_sheets = {meta["file"].name for it, meta, *_ in plan}
    old = load_existing(out_dir)
    all_records, all_skipped = list(records), list(skipped)
    if old and only:
        all_records += [r for r in old.get("items", []) if r.get("sheet") not in done_sheets]
        all_skipped += [s for s in old.get("skipped", []) if s.get("sheet") not in {i for i, *_ in plan}]
    all_records.sort(key=lambda r: r["id"])
    doc = {
        "cell_px": args.cell,
        "note": "footprint = columns x rows (w x h) on the Diablo II style inventory grid; icon_px = footprint * cell_px",
        "items": all_records,
        "skipped": all_skipped,
    }
    (out_dir / "inventory_sizes.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf8")
    try:
        icons_rel = os.path.relpath(out_dir, md_path.parent).replace("\\", "/")
    except ValueError:
        icons_rel = "icons"
    write_note(md_path, icons_rel, all_records, all_skipped, names)
    print(f"\n{len(records)} icons written to {out_dir} ({len(all_records)} in the json); {len(skipped)} skipped")
    for p in problems + report:
        print("NOTE", p)
    return 0


if __name__ == "__main__":
    sys.exit(main())

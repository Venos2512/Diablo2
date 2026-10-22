"""Helpers for the generate-tpose-for-tripo skill (PIL + numpy only; no image synthesis).

  python -I tpose_tools.py measure <sheet.png>
      Print, for the left and right half of a two-view sheet, the figure bbox, height, width, height as a
      percentage of the image height and the distance to the image edges.
  python -I tpose_tools.py humanoid <sheet.png> --kind fb|sides
      HUMANOID concepts only. Numeric pose checks on a sheet: arm angle off horizontal, hand height (% from the
      top), arm span / height, feet gap (fb) or sole span (sides), front-vs-back hand height and figure height.
      Prints WARN lines; they are heuristics, the final call is by looking at the image.
  python -I tpose_tools.py creature <sheet.png> --kind fb|sides
      NON-HUMANOID standing creatures. fb: mirror symmetry of the front and back figures, a gap between the legs on the
      floor, equal height and width. sides: equal height and length, sole coverage. Prints WARN lines (heuristics).
  python -I tpose_tools.py strip <asset_dir> [--from-pct 0] [--to-pct 60] [--step 10]
      After split: the same band of the figure height cut from the four views at one scale, side by side, with a tick
      every step percent. For the CROSS-VIEW check of SKILL.md: where does a feature sit in each view, what hides what.
  python -I tpose_tools.py guides <asset_dir> [--creature]
      After split: writes views/_guides.png, the four views with the same lines across them (head top, hand/shoulder
      row measured on the front view, 50 % crotch, 27 % knee, soles) and a centre line per figure.
  python -I tpose_tools.py split <asset_dir> [--canvas 1024] [--margin 0.07] [--thr 40] [--vcenter]
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
from PIL import Image, ImageDraw, ImageFilter


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
        if len(ys) == 0 or len(xs) == 0:
            sys.exit(f'{path}: no figure found in the {"left" if x0 == 0 else "right"} half of the sheet')
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


def runs(flags, min_gap=0):
    """(start, end) of each run of True in a 1-D bool array; runs separated by <= min_gap False are merged."""
    idx = np.where(flags)[0]
    if len(idx) == 0:
        return []
    out, s, p = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - p > min_gap + 1:
            out.append((int(s), int(p) + 1))
            s = i
        p = i
    out.append((int(s), int(p) + 1))
    return out


def fig_mask(crop, bg, thr):
    return fg_mask(np.asarray(crop), np.array(bg), thr)


def arm_line(m, side):
    """Fit the top edge of one outstretched arm. side = 'left' or 'right' (screen side of the crop).
    Returns (angle in degrees, + = hand lower than the shoulder end; tip row; tip row as % of height)."""
    H, W = m.shape
    cx = W / 2
    head = np.where(m[: max(3, H // 20)].any(axis=0))[0]
    if len(head):
        cx = float(np.median(head))
    off = 0.20 * H  # beyond the shoulder/upper-arm root of a normal human figure, before the hand
    cols = np.arange(0, int(cx - off)) if side == 'left' else np.arange(int(cx + off), W)
    cols = cols[: int(len(cols) * 0.85)] if side == 'right' else cols[int(len(cols) * 0.15):]
    top = np.full(len(cols), np.nan)
    for i, x in enumerate(cols):
        ys = np.where(m[: int(H * 0.45), x])[0]
        if len(ys):
            top[i] = ys[0]
    ok = ~np.isnan(top)
    if ok.sum() < 8:
        return None
    slope = np.polyfit(cols[ok].astype(float), top[ok], 1)[0]
    angle = float(np.degrees(np.arctan(slope)))
    if side == 'left':
        angle = -angle  # moving outward = moving left; slope sign flips so + still means "tip lower"
    edge = 0.03 * W
    xs = np.arange(0, int(edge)) if side == 'left' else np.arange(W - int(edge), W)
    ys = np.where(m[: int(H * 0.6), xs].any(axis=1))[0]
    tip = float(ys.mean()) if len(ys) else float('nan')
    return angle, tip, 100 * tip / H


def feet_clusters(m, band=0.03):
    H, W = m.shape
    rows = m[int(H * (1 - band)):]
    return runs(rows.any(axis=0), min_gap=max(2, int(0.01 * W)))


def cmd_humanoid(args):
    """Numeric checks for a HUMANOID T-pose sheet. Heuristics: they catch bent/sagging arms, raised or low
    arms, striding or splayed legs, and wrong arm span; the final judgement is still by looking at the image."""
    img, bg, figs = figures(args.sheet, args.thr)
    W, Himg = img.size
    names = ('front', 'back') if args.kind == 'fb' else ('left', 'right')
    warns = 0
    print(f'{args.sheet}  kind={args.kind}  (WARN lines = retry or log)')
    tips = {}
    for name, (crop, box) in zip(names, figs):
        m = fig_mask(crop, bg, args.thr)
        H, Wc = m.shape
        feet = feet_clusters(m)
        sole_span = (feet[-1][1] - feet[0][0]) / H if feet else float('nan')
        centres = [(a + b) / 2 for a, b in feet]
        msg = [f'{name:5s} height={H}px width={Wc}px span/height={Wc / H:.2f}']
        if args.kind == 'fb':
            for side in ('left', 'right'):
                r = arm_line(m, side)
                if r is None:
                    msg.append(f'arm-{side}: not found')
                    warns += 1
                    print(f'  WARN {name}: {side} arm edge not found (arm missing, hanging, or merged with the body)')
                    continue
                ang, tip, tip_pct = r
                tips[(name, side)] = tip_pct
                msg.append(f'arm-{side}: {ang:+.1f} deg, tip at {tip_pct:.0f}% from top')
                if abs(ang) > args.max_arm_deg:
                    warns += 1
                    print(f'  WARN {name}: {side} arm is {ang:+.1f} deg off horizontal (limit {args.max_arm_deg}); '
                          f'{"hand sags below the shoulder" if ang > 0 else "hand rises above the shoulder"}')
                if not (args.shoulder_min <= tip_pct <= args.shoulder_max):
                    warns += 1
                    print(f'  WARN {name}: {side} hand at {tip_pct:.0f}% from the top; shoulder height of a humanoid is '
                          f'{args.shoulder_min:.0f}-{args.shoulder_max:.0f}%')
            if not (args.span_min <= Wc / H <= args.span_max):
                warns += 1
                print(f'  WARN {name}: arm span/height {Wc / H:.2f} outside {args.span_min}-{args.span_max} '
                      f'(arms too short/long for the body, or not fully out)')
            if len(centres) >= 2:
                gap = (centres[-1] - centres[0]) / H
                msg.append(f'feet centre gap {gap:.2f} H')
                if gap > args.max_foot_gap:
                    warns += 1
                    print(f'  WARN {name}: feet centres {gap:.2f} H apart (limit {args.max_foot_gap}): stance too wide, '
                          f'ask for feet shoulder-width apart, parallel, legs straight')
        else:
            msg.append(f'sole span {sole_span:.2f} H')
            if sole_span > args.max_sole_span:
                warns += 1
                print(f'  WARN {name}: soles span {sole_span:.2f} H (limit {args.max_sole_span}): one leg steps forward or '
                      f'the stance is a stride; the side view needs both feet side by side, legs straight')
        print('  ' + '; '.join(msg))
    if args.kind == 'fb':
        # the back view is seen from behind: the creature's right hand is on screen-left in FRONT and screen-right in BACK
        for fside, bside in (('left', 'right'), ('right', 'left')):
            a, b = tips.get(('front', fside)), tips.get(('back', bside))
            if a is not None and b is not None and abs(a - b) > 3:
                warns += 1
                print(f'  WARN the same hand is at a different height in front and back ({a:.0f}% vs {b:.0f}%; '
                      f'front screen-{fside} hand = back screen-{bside} hand)')
        hs = [c.size[1] for c, _ in figs]
        if abs(hs[0] - hs[1]) / max(hs) > 0.04:
            warns += 1
            print(f'  WARN front and back figure heights differ by {100 * abs(hs[0] - hs[1]) / max(hs):.1f}% (limit 4%)')
    print('RESULT: ' + ('OK' if warns == 0 else f'{warns} WARNING(S)'))


def mirror_iou(m):
    """Overlap of a figure mask with its left-right mirror about the bbox centre (1.0 = perfectly symmetric)."""
    flip = m[:, ::-1]
    union = np.logical_or(m, flip).sum()
    return float(np.logical_and(m, flip).sum() / union) if union else 0.0


def cmd_creature(args):
    """Numeric checks for a NON-HUMANOID standing creature sheet (heuristics; the final judgement is by looking).
    fb: front and back figures are left-right symmetric (no turned head, no lifted or splayed leg), show a gap between
    the legs on the floor, and have the same height and width. sides: the two side figures have the same height and
    length; the share of the body length covered by the soles is only printed."""
    img, bg, figs = figures(args.sheet, args.thr)
    names = ('front', 'back') if args.kind == 'fb' else ('left', 'right')
    warns = 0
    print(f'{args.sheet}  kind={args.kind}  (WARN lines = retry or log)')
    dims = []
    for name, (crop, box) in zip(names, figs):
        m = fig_mask(crop, bg, args.thr)
        H, Wc = m.shape
        dims.append((H, Wc))
        msg = [f'{name:5s} height={H}px width={Wc}px width/height={Wc / H:.2f}']
        feet = feet_clusters(m)
        if args.kind == 'fb':
            iou = mirror_iou(m)
            msg.append(f'mirror symmetry {iou:.2f}')
            if iou < args.min_symmetry:
                warns += 1
                print(f'  WARN {name}: silhouette symmetry {iou:.2f} < {args.min_symmetry} (head turned or tilted, leg lifted, '
                      f'legs splayed unevenly, or the body leans)')
            msg.append(f'{len(feet)} paw group(s) on the floor')
            if len(feet) < 2:
                warns += 1
                print(f'  WARN {name}: one paw group only: the legs touch or merge; ask for a clear gap of background '
                      f'between the legs')
        else:
            span = (feet[-1][1] - feet[0][0]) / Wc if feet else float('nan')
            msg.append(f'soles cover {span:.2f} of the body length')
        print('  ' + '; '.join(msg))
    (h0, w0), (h1, w1) = dims
    if abs(h0 - h1) / max(h0, h1) > 0.04:
        warns += 1
        print(f'  WARN the two figures differ in height by {100 * abs(h0 - h1) / max(h0, h1):.1f}% (limit 4%)')
    if abs(w0 - w1) / max(w0, w1) > args.max_width_diff:
        warns += 1
        print(f'  WARN the two figures differ in width by {100 * abs(w0 - w1) / max(w0, w1):.1f}% '
              f'(limit {100 * args.max_width_diff:.0f}%): different body proportions in the two views')
    print('RESULT: ' + ('OK' if warns == 0 else f'{warns} WARNING(S)'))


def cmd_guides(args):
    """Draw the same horizontal guide lines across the four finished views for visual comparison.
    --creature: only top, middle and floor lines (no arm or leg landmarks) and tiles wide enough for a long body."""
    d = Path(args.asset_dir)
    views = {n: Image.open(d / 'views' / f'{n}.png').convert('RGB') for n in ('front', 'back', 'left', 'right')}
    side = views['front'].size[0]
    masks = {}
    for n, v in views.items():
        a = np.asarray(v)
        masks[n] = fg_mask(a, bg_colour(a), args.thr)
    rows = {n: np.where(m.any(axis=1))[0] for n, m in masks.items()}
    top = int(min(r[0] for r in rows.values()))
    sole = int(max(r[-1] for r in rows.values()))
    fh = sole - top
    spans = {n: np.where(m.any(axis=0))[0] for n, m in masks.items()}
    if args.creature:  # no arms, no crotch: only top, middle and floor
        lines = [('top', top, (0, 200, 255)), ('50%', top + fh // 2, (255, 200, 0)), ('sole', sole, (0, 200, 255))]
        half = min(side // 2, int(max((c[-1] - c[0]) / 2 for c in spans.values()) + 0.04 * fh))
        shoulder = None
    else:
        fm = masks['front']
        fcols = spans['front']
        edge = max(3, int(0.03 * (fcols[-1] - fcols[0])))
        tipys = []
        for xs in (np.arange(fcols[0], fcols[0] + edge), np.arange(fcols[-1] - edge + 1, fcols[-1] + 1)):
            ys = np.where(fm[top: top + int(fh * 0.6)][:, xs].any(axis=1))[0]
            if len(ys):
                tipys.append(top + float(ys.mean()))
        shoulder = int(round(sum(tipys) / len(tipys))) if tipys else top + int(fh * 0.2)
        lines = [('head top', top, (0, 200, 255)), ('hand/shoulder', shoulder, (255, 40, 40)),
                 ('crotch 50%', top + fh // 2, (255, 200, 0)), ('knee 27%', sole - int(fh * 0.27), (60, 220, 60)),
                 ('sole', sole, (0, 200, 255))]
        half = int(0.62 * fh)  # covers the arm span of a T-pose
    tiles = []
    for n in ('front', 'back', 'left', 'right'):
        t = views[n].copy()
        px = t.load()
        for _, y, col in lines:
            for x in range(side):
                if 0 <= y < side:
                    px[x, y] = col
        cols = spans[n]
        cxm = int((cols[0] + cols[-1]) // 2)
        for y in range(top, sole):
            px[cxm, y] = (255, 255, 255)
        # crop tight around the figure and enlarge
        box = (max(0, cxm - half), max(0, top - int(0.03 * fh)), min(side, cxm + half), min(side, sole + int(0.03 * fh)))
        t = t.crop(box)
        tiles.append(t.resize((round(t.size[0] * 560 / t.size[1]), 560), Image.LANCZOS))
    out = Image.new('RGB', (sum(t.size[0] for t in tiles), 560))
    x = 0
    for t in tiles:
        out.paste(t, (x, 0))
        x += t.size[0]
    out.save(d / 'views' / '_guides.png')
    if shoulder is None:
        print(f'wrote {d / "views" / "_guides.png"}  top row {top}, soles row {sole}')
    else:
        print(f'wrote {d / "views" / "_guides.png"}  head top row {top}, hand/shoulder row {shoulder} '
              f'({100 * (shoulder - top) / fh:.0f}% from top), soles row {sole}')


def cmd_strip(args):
    """Cut the same band of the figure height out of the four finished views and lay the bands side by side at one
    scale, with a tick every --step percent (0 % = the highest point of the figure, 100 % = the soles). Use it to
    compare where a feature (collar, belt, chain, patches, tail tip) sits in each view and what hides what."""
    d = Path(args.asset_dir)
    if args.step <= 0 or not 0 <= args.from_pct < args.to_pct <= 100:
        sys.exit('strip: --step must be positive and 0 <= --from-pct < --to-pct <= 100')
    if not (d / 'views' / 'front.png').exists():
        sys.exit(f'strip: no views/ in {d}; run split first')
    views = {n: Image.open(d / 'views' / f'{n}.png').convert('RGB') for n in ('front', 'back', 'left', 'right')}
    masks = {}
    for n, v in views.items():
        a = np.asarray(v)
        masks[n] = fg_mask(a, bg_colour(a), args.thr)
    rows = {n: np.where(m.any(axis=1))[0] for n, m in masks.items()}
    top = int(min(r[0] for r in rows.values()))
    sole = int(max(r[-1] for r in rows.values()))
    fh = sole - top
    y0, y1 = top + round(fh * args.from_pct / 100), top + round(fh * args.to_pct / 100)
    pad = max(6, round(0.01 * fh))
    tiles = []
    for n in ('front', 'back', 'left', 'right'):
        cols = np.where(masks[n].any(axis=0))[0]
        cx = int((cols[0] + cols[-1]) // 2)
        half = int((cols[-1] - cols[0]) / 2 + 0.04 * fh)
        box = (max(0, cx - half), max(0, y0 - pad), min(views[n].size[0], cx + half), min(views[n].size[1], y1 + pad))
        tile = views[n].crop(box)
        dr = ImageDraw.Draw(tile)
        pct = (args.from_pct // args.step) * args.step
        while pct <= args.to_pct:
            if pct >= args.from_pct:
                y = top + round(fh * pct / 100) - box[1]
                dr.line([(0, y), (tile.size[0], y)], fill=(0, 200, 255) if pct % 50 == 0 else (255, 255, 255), width=1)
                dr.text((3, y + 1 if y + 12 < tile.size[1] else y - 11), f'{pct}%', fill=(255, 255, 0))
            pct += args.step
        tiles.append(tile)
    out = Image.new('RGB', (sum(t.size[0] for t in tiles) + 10 * (len(tiles) - 1), max(t.size[1] for t in tiles)), (40, 40, 40))
    x = 0
    for tile in tiles:
        out.paste(tile, (x, 0))
        x += tile.size[0] + 10
    path = d / 'views' / f'_strip_{args.from_pct:g}-{args.to_pct:g}.png'
    out.save(path)
    print(f'wrote {path}  (front, back, left, right; band {args.from_pct:g}-{args.to_pct:g} % of the figure height, '
          f'top row {top}, soles row {sole})')


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
    if args.vcenter:  # low, long creatures: centre the tallest figure vertically; all four views share this floor row
        floor = round((side + hmax * min(1.0, k)) / 2)
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
    h = sub.add_parser('humanoid')
    h.add_argument('sheet')
    h.add_argument('--kind', choices=('fb', 'sides'), required=True,
                   help='fb = front/back sheet, sides = left/right sheet')
    h.add_argument('--thr', type=int, default=40)
    h.add_argument('--max-arm-deg', type=float, default=4.0)
    h.add_argument('--shoulder-min', type=float, default=13.0)
    h.add_argument('--shoulder-max', type=float, default=28.0)
    h.add_argument('--span-min', type=float, default=0.80)
    h.add_argument('--span-max', type=float, default=1.12)
    h.add_argument('--max-foot-gap', type=float, default=0.22)
    h.add_argument('--max-sole-span', type=float, default=0.26)
    h.set_defaults(fn=cmd_humanoid)
    c = sub.add_parser('creature')
    c.add_argument('sheet')
    c.add_argument('--kind', choices=('fb', 'sides'), required=True,
                   help='fb = front/back sheet, sides = left/right sheet')
    c.add_argument('--thr', type=int, default=40)
    c.add_argument('--min-symmetry', type=float, default=0.85)
    c.add_argument('--max-width-diff', type=float, default=0.12)
    c.set_defaults(fn=cmd_creature)
    st = sub.add_parser('strip')
    st.add_argument('asset_dir')
    st.add_argument('--from-pct', type=float, default=0.0)
    st.add_argument('--to-pct', type=float, default=60.0)
    st.add_argument('--step', type=int, default=10)
    st.add_argument('--thr', type=int, default=40)
    st.set_defaults(fn=cmd_strip)
    g = sub.add_parser('guides')
    g.add_argument('asset_dir')
    g.add_argument('--thr', type=int, default=40)
    g.add_argument('--creature', action='store_true', help='non-humanoid: top / middle / floor lines only')
    g.set_defaults(fn=cmd_guides)
    s = sub.add_parser('split')
    s.add_argument('asset_dir')
    s.add_argument('--canvas', type=int, default=1024)
    s.add_argument('--margin', type=float, default=0.07)
    s.add_argument('--vcenter', action='store_true',
                   help='centre the tallest figure vertically (creatures much wider than tall); the floor row stays shared')
    s.add_argument('--thr', type=int, default=40)
    s.set_defaults(fn=cmd_split)
    args = ap.parse_args()
    args.fn(args)


if __name__ == '__main__':
    sys.exit(main())

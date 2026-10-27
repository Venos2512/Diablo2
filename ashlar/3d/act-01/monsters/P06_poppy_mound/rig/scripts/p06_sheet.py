"""Review sheets for the P06 rig (system Python + PIL, no Blender). Run isolated with the user site added:

python -I -c "import site,sys,runpy; sys.path.append(site.getusersitepackages()); sys.argv=sys.argv[1:]; \
runpy.run_path(sys.argv[0], run_name='__main__')" p06_sheet.py <command> ...

  panel <mesh.png> <bones.png|-> <labels.json|-> <out.png> [caption]
        mesh pass flattened on the review background, bone pass on top, bone names with leader lines
  sheet <out.png> <cols> <cell> <title> <subtitle> <img>[=caption] ...
"""
import sys, os, json, math
from PIL import Image, ImageDraw, ImageFont

BG = (58, 58, 62)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(path):
    im = Image.open(path).convert('RGBA'); b = Image.new('RGBA', im.size, BG + (255,))
    return Image.alpha_composite(b, im)


def panel(mesh, bones, labels, out, caption='', margin=230):
    """Render + bone pass, widened by `margin` px on both sides; bone names as callouts in the margins
    (anchors left of centre -> left column), leader lines to the bone midpoint (deform) or head (socket)."""
    im = flat(mesh)
    if bones != '-' and os.path.exists(bones):
        im = Image.alpha_composite(im, Image.open(bones).convert('RGBA'))
    W0, H = im.size
    has = labels != '-' and os.path.exists(labels)
    M = margin if has else 0
    C = Image.new('RGB', (W0 + 2 * M, H), BG); C.paste(im.convert('RGB'), (M, 0))
    d = ImageDraw.Draw(C); W = C.size[0]
    if has:
        L = json.load(open(labels, encoding='utf-8'))
        f = font(max(14, W0 // 58), True); fs = font(max(12, W0 // 70))
        cols = {0: [], 1: []}
        for l in L:
            x, y = M + l['u'] * W0, (1 - l['v']) * H
            cols[0 if l['u'] < 0.5 else 1].append((y, x, l))
        for side, items in cols.items():
            items.sort(key=lambda t: t[0])
            sp = 30; ys = []
            for k, (y, x, l) in enumerate(items):
                ys.append(max(y, ys[-1] + sp) if ys else y)
            over = (ys[-1] + 20 - H) if ys else 0
            if over > 0:
                ys = [max(20 + i * sp, yy - over) for i, yy in enumerate(ys)]
            for (y, x, l), ty in zip(items, ys):
                ff = f if l.get('deform', True) else fs
                col = (255, 230, 120) if l.get('deform', True) else (175, 215, 255)
                tw, th = d.textbbox((0, 0), l['name'], font=ff)[2:]
                tx = M - 12 - tw if side == 0 else W - M + 12
                box = (tx - 4, ty - th / 2 - 3, tx + tw + 4, ty + th / 2 + 3)
                ex = box[2] if side == 0 else box[0]
                d.line([(x, y), (ex, ty)], fill=(15, 15, 15), width=3)
                d.line([(x, y), (ex, ty)], fill=col, width=1)
                d.ellipse([x - 3, y - 3, x + 3, y + 3], outline=col)
                d.rectangle(box, fill=(25, 25, 28))
                d.text((tx, ty), l['name'], fill=col, font=ff, anchor='lm')
    if caption:
        fc = font(max(18, W0 // 40), True)
        d.text((12, 10), caption, fill=(255, 220, 60), font=fc)
    C.save(out)
    print(out, C.size)


def autocrop(im, pad=24):
    """Crop rows/columns that are plain review background."""
    from PIL import ImageChops
    diff = ImageChops.difference(im, Image.new('RGB', im.size, BG)).convert('L').point(lambda v: 255 if v > 10 else 0)
    bb = diff.getbbox()
    if not bb:
        return im
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.size[0], bb[2] + pad), min(im.size[1], bb[3] + pad)))


def sheet(out, cols, cell, title, sub, items):
    """cell = panel width; panels are auto-cropped, scaled to the cell width, rows as tall as their tallest panel."""
    cols = int(cols); cell = int(cell)
    ims = []
    for it in items:
        p, _, cap = it.partition('=')
        im = autocrop(flat(p).convert('RGB'))
        s = min(cell / im.size[0], 1.6)
        im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.LANCZOS); ims.append((im, cap))
    rows = [ims[i:i + cols] for i in range(0, len(ims), cols)]
    capH = 36
    rh = [max(im.size[1] for im, _ in r) + capH for r in rows]
    head = 92 if sub else 56
    S = Image.new('RGB', (cols * cell, head + sum(rh)), (34, 34, 38)); d = ImageDraw.Draw(S)
    d.text((14, 10), title, fill=(255, 255, 255), font=font(30, True))
    if sub:
        d.text((14, 52), sub, fill=(205, 205, 205), font=font(20))
    fc = font(22, True)
    y0 = head
    for r, h in zip(rows, rh):
        for k, (im, cap) in enumerate(r):
            x0 = k * cell
            S.paste(im, (x0 + (cell - im.size[0]) // 2, y0 + capH))
            d.rectangle([x0, y0, x0 + cell - 1, y0 + h - 1], outline=(80, 80, 86))
            if cap:
                d.text((x0 + 10, y0 + 6), cap, fill=(255, 220, 60), font=fc)
        y0 += h
    S.save(out)
    print(out, S.size)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'panel':
        panel(*sys.argv[2:6], caption=sys.argv[6] if len(sys.argv) > 6 else '')
    elif cmd == 'sheet':
        sheet(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7:])

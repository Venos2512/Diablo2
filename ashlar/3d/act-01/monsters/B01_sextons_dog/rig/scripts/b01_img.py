"""Image helpers for B01 (system Python + PIL). Run with python -I; PIL lives in the user site, added explicitly.

python -I b01_img.py grid <img.png> <out.png> [step_m]          metric grid on an ortho render (needs <img>_cam.json)
python -I b01_img.py sheet <out.png> <cols> <cell> <img>[=caption] ...   contact sheet (rig_v1 compose.grid)
python -I b01_img.py over <mesh.png> <bones.png> <out.png>       bone pass over mesh pass
"""
import os, sys, site
site.addsitedir(site.getusersitepackages())
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import b01_common as C
C.tools_path()
import compose   # rig_v1/tools/compose.py, unmodified

def section(js, out, pts_json=None, view=None, px_per_m=700, step=0.05):
    """Draw a plane section (b01_r1_sections.py json) on a metric grid; optional named points
    {name: [x, y, z]} projected onto the plane axes. view = (u0, u1, v0, v1) in metres."""
    from PIL import Image, ImageDraw
    import math, colorsys, json as _j
    d = _j.load(open(js)); segs = d['segs']; ax = d['axes']
    iu, iv = 'xyz'.index(ax[0]), 'xyz'.index(ax[1])
    if view:
        u0, u1, v0, v1 = view
    else:
        us = [s[c] for s in segs for c in (0, 2)]; vs = [s[c] for s in segs for c in (1, 3)]
        u0, u1, v0, v1 = min(us) - 0.05, max(us) + 0.05, min(vs) - 0.05, max(vs) + 0.05
    sc = px_per_m; W = int((u1 - u0) * sc); Hh = int((v1 - v0) * sc)
    im = Image.new('RGB', (W, Hh), (30, 30, 34)); dr = ImageDraw.Draw(im); f = compose.font(13)
    P = lambda u, v: ((u - u0) * sc, Hh - (v - v0) * sc)
    i = math.floor(u0 / step)
    while i * step <= u1:
        x, _ = P(i * step, 0); major = i % 2 == 0
        dr.line([(x, 0), (x, Hh)], fill=(70, 70, 78) if major else (46, 46, 52))
        if major:
            dr.text((x + 2, Hh - 15), f'{ax[0]}{i * step:+.2f}', fill=(200, 200, 130), font=f)
        i += 1
    j = math.floor(v0 / step)
    while j * step <= v1:
        _, y = P(0, j * step); major = j % 2 == 0
        dr.line([(0, y), (W, y)], fill=(70, 70, 78) if major else (46, 46, 52))
        if major:
            dr.text((2, y - 14), f'{ax[1]}{j * step:.2f}', fill=(200, 200, 130), font=f)
        j += 1
    for s in segs:
        c = (235, 235, 235) if s[4] == 0 else tuple(int(255 * q) for q in colorsys.hsv_to_rgb((s[4] * 0.618) % 1, 0.7, 1))
        dr.line([P(s[0], s[1]), P(s[2], s[3])], fill=c, width=2)
    if pts_json:
        pts = _j.load(open(pts_json))
        for name, p in pts.items():
            if name.startswith('_'):
                continue
            x, y = P(p[iu], p[iv]); r = 5
            dr.ellipse([x - r, y - r, x + r, y + r], outline=(255, 80, 60), width=2)
            dr.text((x + 7, y - 7), name, fill=(255, 140, 110), font=f)
    dr.text((8, 6), f"section {d['plane']}={d['value']:+.3f}  horizontal {ax[0]}  vertical {ax[1]}  grid {int(step * 100)} cm",
            fill=(255, 230, 120), font=compose.font(15))
    im.save(out); print(out, im.size)


def labelled(mesh, bones, out, labels, names=None, bg=compose.BG, fsize=None, skip_r=True):
    """Bone pass over mesh pass + joint dots and names (labels: {bone: [u, v]} from world_to_camera_view)."""
    from PIL import Image, ImageDraw
    a = Image.open(mesh).convert('RGBA'); b = Image.open(bones).convert('RGBA')
    base = Image.new('RGBA', a.size, bg + (255,))
    im = Image.alpha_composite(Image.alpha_composite(base, a), b).convert('RGB')
    d = ImageDraw.Draw(im); W, H = im.size; f = compose.font(fsize or max(12, W // 75))
    for n, (u, v) in labels.items():
        if names is not None and n not in names:
            continue
        if skip_r and n.startswith('R_'):
            continue
        x, y = u * W, (1 - v) * H
        if not (0 <= x < W and 0 <= y < H):
            continue
        d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(255, 255, 255), outline=(0, 0, 0))
        d.text((x + 6, y - 7), n, fill=(0, 0, 0), font=f, stroke_width=3, stroke_fill=(0, 0, 0))
        d.text((x + 6, y - 7), n, fill=(255, 236, 140), font=f)
    im.save(out)
    return out


def autocrop(path, out=None, margin=24, bg=compose.BG):
    """Crop an image to its non-background content (+margin)."""
    from PIL import Image, ImageChops
    im = Image.open(path).convert('RGB')
    diff = ImageChops.difference(im, Image.new('RGB', im.size, bg)).convert('L').point(lambda q: 255 if q > 12 else 0)
    bb = diff.getbbox()
    if bb:
        bb = (max(0, bb[0] - margin), max(0, bb[1] - margin), min(im.width, bb[2] + margin), min(im.height, bb[3] + margin))
        im = im.crop(bb)
    im.save(out or path)
    return out or path


def rows_sheet(out, rows, title, lines=(), width=2400, gap=8):
    """Sheet of rows; each row = list of (path, caption) scaled to a common height filling `width`."""
    from PIL import Image, ImageDraw
    ims = [[(Image.open(p).convert('RGB'), c) for p, c in r] for r in rows]
    heights = []
    for r in ims:
        ar = sum(im.width / im.height for im, _ in r)
        heights.append(int((width - gap * (len(r) - 1)) / ar))
    top = 46 + 22 * len(lines)
    H = top + sum(h + 30 for h in heights)
    S = Image.new('RGB', (width, H), (28, 28, 31)); d = ImageDraw.Draw(S)
    d.text((10, 8), title, fill=(255, 220, 90), font=compose.font(26))
    for i, t in enumerate(lines):
        d.text((10, 44 + 22 * i), t, fill=(225, 225, 225), font=compose.font(16))
    y = top
    for r, h in zip(ims, heights):
        x = 0
        for im, cap in r:
            w = int(im.width * h / im.height); S.paste(im.resize((w, h)), (x, y + 28))
            d.text((x + 6, y + 4), cap, fill=(255, 220, 90), font=compose.font(18)); x += w + gap
        y += h + 30
    S.save(out); print(out, S.size)
    return out


def titled_sheet(out, cols, cell, items, title, lines=()):
    """compose.grid-like sheet with a title block. items: list of (path, caption)."""
    from PIL import Image, ImageDraw
    rows = (len(items) + cols - 1) // cols; top = 46 + 22 * len(lines)
    S = Image.new('RGB', (cols * cell, top + rows * (cell + 26)), (28, 28, 31)); d = ImageDraw.Draw(S)
    d.text((10, 8), title, fill=(255, 220, 90), font=compose.font(26))
    for i, t in enumerate(lines):
        d.text((10, 44 + 22 * i), t, fill=(225, 225, 225), font=compose.font(16))
    for k, (p, cap) in enumerate(items):
        im = Image.open(p).convert('RGB'); im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + 26)
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + 26 + (cell - im.height) // 2))
        d.text((x0 + 6, y0 + 4), cap, fill=(255, 220, 90), font=compose.font(17))
    S.save(out); print(out, S.size)
    return out


def legend_sheet(out, items, colors_json, title, cols=3, cell=700, lines=()):
    """titled_sheet + a colour legend strip (bone -> colour) under the title."""
    from PIL import Image, ImageDraw
    import json as _j
    tmp = out[:-4] + '_tmp.png'
    titled_sheet(tmp, cols, cell, items, title, lines)
    S = Image.open(tmp); cmap = _j.load(open(colors_json))
    f = compose.font(15); per_row = 9; rows = (len(cmap) + per_row - 1) // per_row
    H = S.height + rows * 24 + 10
    T = Image.new('RGB', (S.width, H), (28, 28, 31)); T.paste(S, (0, 0)); d = ImageDraw.Draw(T)
    wcol = S.width // per_row
    for k, (n, c) in enumerate(cmap.items()):
        x0 = (k % per_row) * wcol + 8; y0 = S.height + 6 + (k // per_row) * 24
        d.rectangle([x0, y0 + 3, x0 + 16, y0 + 19], fill=tuple(int(255 * q) for q in c))
        d.text((x0 + 22, y0 + 2), n, fill=(230, 230, 230), font=f)
    T.save(out); os.remove(tmp); print(out, T.size)
    return out


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'section':
        view = tuple(float(x) for x in sys.argv[5].split(',')) if len(sys.argv) > 5 and sys.argv[5] else None
        section(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != '-' else None, view)
    if cmd == 'grid':
        compose.gridlines(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.05)
    elif cmd == 'sheet':
        compose.grid(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:])
    elif cmd == 'over':
        compose.overlay(sys.argv[2], sys.argv[3], sys.argv[4])

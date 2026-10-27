"""Image helpers for the rig_v1 batch (system Python + PIL, no Blender).

python -E compose.py labels <img.png> <labels.json> <out.png>          draw island ids
python -E compose.py overlay <mesh.png> <bones.png> <out.png> [bg]      bones over mesh (+ background)
python -E compose.py grid <out.png> <cols> <cell> <img1>[=caption] ...  contact sheet
"""
import sys, json, os
from PIL import Image, ImageDraw, ImageFont

BG = (58, 58, 62)


def font(sz):
    for f in ('arialbd.ttf', 'arial.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(im, bg=BG):
    im = im.convert('RGBA'); base = Image.new('RGBA', im.size, bg + (255,))
    return Image.alpha_composite(base, im).convert('RGB')


def labels(img, js, out):
    im = flat(Image.open(img)); d = ImageDraw.Draw(im); W, H = im.size; f = font(max(12, W // 70))
    for L in json.load(open(js)):
        x, y = L['u'] * W, (1 - L['v']) * H
        t = f"{L['id']}"
        d.text((x + 1, y + 1), t, fill=(0, 0, 0), font=f, anchor='mm')
        d.text((x, y), t, fill=(255, 255, 255), font=f, anchor='mm')
    im.save(out)


def gridlines(img, out, step=0.05, label_every=2):
    """Draw a world grid (metres) on an orthographic render using its <img>_cam.json sidecar."""
    cam = json.load(open(img[:-4] + '_cam.json'))
    im = flat(Image.open(img)); d = ImageDraw.Draw(im, 'RGBA'); W, H = im.size; f = font(max(11, W // 80))
    loc, R, U, s = cam['loc'], cam['right'], cam['up'], cam['ortho']
    px = W / s                                   # pixels per metre (square render)
    ax_r = max(range(3), key=lambda i: abs(R[i])); ax_u = max(range(3), key=lambda i: abs(U[i]))
    sr = 1 if R[ax_r] > 0 else -1; su = 1 if U[ax_u] > 0 else -1
    c_r, c_u = loc[ax_r], loc[ax_u]
    import math
    def to_px(wr, wu):
        return W / 2 + sr * (wr - c_r) * px, H / 2 - su * (wu - c_u) * px
    r0, r1 = sorted((c_r - sr * s / 2, c_r + sr * s / 2)); u0, u1 = sorted((c_u - su * s / 2, c_u + su * s / 2))
    i = math.floor(r0 / step)
    while i * step <= r1:
        x, _ = to_px(i * step, 0); major = i % label_every == 0
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 90 if major else 40), width=1)
        if major:
            d.text((x + 2, H - 16), f"{'xyz'[ax_r]}{i * step:+.2f}", fill=(255, 255, 160, 220), font=f)
        i += 1
    j = math.floor(u0 / step)
    while j * step <= u1:
        _, y = to_px(0, j * step); major = j % label_every == 0
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 90 if major else 40), width=1)
        if major:
            d.text((2, y - 14), f"{'xyz'[ax_u]}{j * step:.2f}", fill=(255, 255, 160, 220), font=f)
        j += 1
    im.save(out)


def overlay(mesh, bones, out, bg=BG):
    a = Image.open(mesh).convert('RGBA'); b = Image.open(bones).convert('RGBA')
    base = Image.new('RGBA', a.size, bg + (255,))
    im = Image.alpha_composite(Image.alpha_composite(base, a), b)
    im.convert('RGB').save(out)


def grid(out, cols, cell, items):
    cols = int(cols); cell = int(cell)
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, rows * (cell + 26)), (32, 32, 34)); d = ImageDraw.Draw(sheet); f = font(17)
    for k, it in enumerate(items):
        p, _, cap = it.partition('=')
        im = flat(Image.open(p)) if os.path.exists(p) else Image.new('RGB', (cell, cell), (80, 0, 0))
        im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = (k // cols) * (cell + 26)
        sheet.paste(im, (x0 + (cell - im.width) // 2, y0 + 26 + (cell - im.height) // 2))
        d.text((x0 + 6, y0 + 4), cap or os.path.basename(p), fill=(255, 220, 90), font=f)
    sheet.save(out)
    print(out, sheet.size)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'labels':
        labels(*sys.argv[2:5])
    elif cmd == 'overlay':
        overlay(*sys.argv[2:5])
    elif cmd == 'grid':
        grid(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:])
    elif cmd == 'gridlines':
        gridlines(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.05)

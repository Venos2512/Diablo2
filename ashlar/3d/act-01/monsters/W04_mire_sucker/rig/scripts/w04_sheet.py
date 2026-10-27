"""Sheet compositor for W04 QA images (system Python 3.11 + PIL, run with -I).

python -I w04_sheet.py <spec.json>
spec: {out, title, subtitle, cols, cell, panels: [{mesh, bones?, under?, caption, labels?: [names], label_json?}]}
- mesh / bones: renders with _cam.json sidecars (bones drawn over mesh; 'under' = optional textured pass drawn first, dimmed)
- labels: bone names drawn at the projected midpoint of each bone (world positions from label_json, w04_g1_proposal.py)
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

BG = (46, 46, 50)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def proj(cam, p, W, H):
    loc, R, U, s = cam['loc'], cam['right'], cam['up'], cam['ortho']
    d = [p[i] - loc[i] for i in range(3)]
    u = sum(d[i] * R[i] for i in range(3)); v = sum(d[i] * U[i] for i in range(3))
    return W / 2 + u * W / s, H / 2 - v * H / s


def panel(pn, cell):
    base = Image.new('RGBA', (1, 1))
    m = Image.open(pn['mesh']).convert('RGBA')
    W, H = m.size
    im = Image.new('RGBA', (W, H), BG + (255,))
    if pn.get('under') and os.path.exists(pn['under']):
        u = Image.open(pn['under']).convert('RGBA')
        a = u.split()[3].point(lambda x: int(x * 0.55))
        u.putalpha(a)
        im = Image.alpha_composite(im, u)
    im = Image.alpha_composite(im, m)
    if pn.get('bones') and os.path.exists(pn['bones']):
        im = Image.alpha_composite(im, Image.open(pn['bones']).convert('RGBA'))
    names = pn.get('labels') or []
    if names and pn.get('label_json'):
        L = json.load(open(pn['label_json'], encoding='utf-8'))
        cam = json.load(open(pn['mesh'][:-4] + '_cam.json', encoding='utf-8'))
        d = ImageDraw.Draw(im)
        f = font(max(13, W // 62), bold=True)
        for nm in names:
            if nm not in L:
                continue
            x, y = proj(cam, L[nm]['mid'], W, H)
            off = pn.get('offsets', {}).get(nm, [14, -14])
            tx, ty = x + off[0], y + off[1]
            d.line([(x, y), (tx, ty)], fill=(255, 255, 255, 200), width=1)
            for dx, dy in ((-1, -1), (1, -1), (-1, 1), (1, 1), (0, 2)):
                d.text((tx + dx, ty + dy), nm, fill=(0, 0, 0, 255), font=f, anchor='lm' if off[0] >= 0 else 'rm')
            d.text((tx, ty), nm, fill=(255, 240, 150, 255), font=f, anchor='lm' if off[0] >= 0 else 'rm')
    im = im.convert('RGB')
    im.thumbnail((cell, cell))
    return im


def main(spec_path):
    S = json.load(open(spec_path, encoding='utf-8'))
    cols, cell = S['cols'], S['cell']
    P = S['panels']
    rows = (len(P) + cols - 1) // cols
    top = 96
    two = any('\n' in pn.get('caption', '') for pn in P)
    cap_h = 50 if two else 34
    sheet = Image.new('RGB', (cols * cell, top + rows * (cell + cap_h)), (30, 30, 33))
    d = ImageDraw.Draw(sheet)
    d.text((16, 12), S.get('title', ''), fill=(255, 255, 255), font=font(34, True))
    d.text((16, 58), S.get('subtitle', ''), fill=(200, 200, 200), font=font(19))
    for k, pn in enumerate(P):
        im = panel(pn, cell)
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + cap_h)
        sheet.paste(im, (x0 + (cell - im.width) // 2, y0 + cap_h + (cell - im.height) // 2))
        lines = pn.get('caption', '').split('\n')
        d.text((x0 + 10, y0 + 4), lines[0], fill=(255, 215, 90), font=font(18 if two else 20, True))
        if len(lines) > 1:
            d.text((x0 + 10, y0 + 26), lines[1], fill=(200, 210, 230), font=font(16))
    sheet.save(S['out'])
    print('SHEET', S['out'], sheet.size)


if __name__ == '__main__':
    main(sys.argv[1])

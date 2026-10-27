"""Wave part-review sheet: one row per asset (4 part views + texture) with a note column.
python -E wave_sheet.py <out.png> <title> <notes.json>      notes.json: [[asset_id, "note line", ...], ...]
Also copies each asset's row as <asset>/rig/qa/<asset>_s2_parts_review.png.
"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..', '..'))
out, title, notes_path = sys.argv[1], sys.argv[2], sys.argv[3]
rows = json.load(open(notes_path, encoding='utf-8'))
cell = 360; note_w = 760; top = 64


def font(sz, bold=False):
    try:
        return ImageFont.truetype('arialbd.ttf' if bold else 'arial.ttf', sz)
    except OSError:
        return ImageFont.load_default()


def flat(p):
    im = Image.open(p).convert('RGBA'); b = Image.new('RGBA', im.size, (58, 58, 62, 255))
    return Image.alpha_composite(b, im).convert('RGB')


views = [('s2_parts_front', 'trước'), ('s2_parts_back', 'sau'), ('s2_parts_left', 'trái'), ('s2_tex_front', 'texture')]
W = len(views) * cell + note_w; Hh = top + len(rows) * (cell + 8)
S = Image.new('RGB', (W, Hh), (28, 28, 31)); d = ImageDraw.Draw(S)
d.text((14, 12), title, fill=(255, 225, 120), font=font(26, True))
legend = [((0.35, 0.55, 0.95), 'Head'), ((0.85, 0.62, 0.52), 'Body'), ((0.95, 0.80, 0.15), 'Accessory'), ((0.20, 0.80, 0.80), 'vải 1'),
          ((0.85, 0.35, 0.80), 'vải 2'), ((0.95, 0.50, 0.15), 'vải 3'), ((0.45, 0.35, 0.90), 'vải 4'), ((0.30, 0.75, 0.35), 'vải 5')]
x = W - 920
for c, t in legend:
    d.rectangle([x, 20, x + 16, 36], fill=tuple(int(255 * v) for v in c)); d.text((x + 22, 17), t, fill=(220, 220, 220), font=font(17)); x += 112
for r, row in enumerate(rows):
    aid, lines = row[0], row[1:]
    y0 = top + r * (cell + 8)
    work = os.path.join(ROOT, 'tmp', 'rig_v1', aid)
    rowimg = Image.new('RGB', (W, cell), (36, 36, 40)); rd = ImageDraw.Draw(rowimg)
    for j, (v, cap) in enumerate(views):
        p = os.path.join(work, v + '.png')
        if os.path.exists(p):
            im = flat(p); im.thumbnail((cell, cell)); rowimg.paste(im, (j * cell + (cell - im.width) // 2, (cell - im.height) // 2))
        rd.text((j * cell + 6, 4), cap, fill=(255, 220, 90), font=font(15))
    nx = len(views) * cell + 14
    rd.text((nx, 10), aid, fill=(255, 225, 120), font=font(21, True))
    yy = 44
    for ln in lines:
        words = ln.split(' '); cur = ''
        for w_ in words:
            test = (cur + ' ' + w_).strip()
            if rd.textlength(test, font=font(16)) > note_w - 28:
                rd.text((nx, yy), cur, fill=(225, 225, 225), font=font(16)); yy += 21; cur = w_
            else:
                cur = test
        rd.text((nx, yy), cur, fill=(225, 225, 225), font=font(16)); yy += 25
    S.paste(rowimg, (0, y0))
    q = os.path.join(ROOT, 'ashlar', '3d', 'act-01', 'monsters', aid, 'rig', 'qa'); os.makedirs(q, exist_ok=True)
    rowimg.save(os.path.join(q, f'{aid}_s2_parts_review.png'))
S.save(out); print(out, S.size)

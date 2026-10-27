"""Image helpers for U04 (system Python + PIL; run with python -I, PIL is taken from the user site explicitly).

python -I u04_img.py grid <render.png> <out.png> [step]          world grid on an ortho render (<render>_cam.json)
python -I u04_img.py sec <section.json> <out.png> [step]         draw a section (segments with a role) with a grid
python -I u04_img.py overlay <mesh.png> <bones.png> <out.png>    bones pass over mesh pass
python -I u04_img.py grid_sheet <out.png> <cols> <cell> <img=caption> ...
"""
import sys, os, site, json, math, importlib.util
us = site.getusersitepackages()
if us not in sys.path:
    sys.path.append(us)
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.normpath(os.path.join(HERE, '..', '..', '..', '..', '_batches', 'rig_v1', 'tools'))
spec = importlib.util.spec_from_file_location('rv1_compose', os.path.join(TOOLS, 'compose.py'))
compose = importlib.util.module_from_spec(spec); spec.loader.exec_module(compose)

ROLE = {'body': (235, 160, 150), 'smock': (110, 150, 250), 'hood': (130, 220, 90), 'tie': (210, 120, 235), 'tooth': (255, 230, 60)}


def font(sz, bold=False):
    return compose.font(sz) if bold else compose.font(sz)


def sec(js, out, step=0.025):
    d = json.load(open(js)); segs = d['segs']
    us_ = [s[c] for s in segs for c in (0, 2)]; vs = [s[c] for s in segs for c in (1, 3)]
    u0, u1, v0, v1 = min(us_), max(us_), min(vs), max(vs)
    S = 1400; pad = 50; sc = (S - 2 * pad) / max(u1 - u0, v1 - v0)
    W = int((u1 - u0) * sc) + 2 * pad; H = int((v1 - v0) * sc) + 2 * pad
    im = Image.new('RGB', (W, H), (28, 28, 32)); dr = ImageDraw.Draw(im); f = font(13)
    X = lambda u: pad + (u - u0) * sc
    Y = lambda v: H - pad - (v - v0) * sc
    i = math.floor(u0 / step)
    while i * step <= u1 + 1e-9:
        x = X(i * step); major = (i % 4 == 0)
        dr.line([(x, 0), (x, H)], fill=(70, 70, 78) if major else (44, 44, 50))
        if major:
            dr.text((x + 2, H - 18), f"{d['axes'][0]}{i * step:+.2f}", fill=(255, 255, 160), font=f)
        i += 1
    j = math.floor(v0 / step)
    while j * step <= v1 + 1e-9:
        y = Y(j * step); major = (j % 4 == 0)
        dr.line([(0, y), (W, y)], fill=(70, 70, 78) if major else (44, 44, 50))
        if major:
            dr.text((2, y - 15), f"{d['axes'][1]}{j * step:.2f}", fill=(255, 255, 160), font=f)
        j += 1
    for s in segs:
        dr.line([(X(s[0]), Y(s[1])), (X(s[2]), Y(s[3]))], fill=ROLE.get(s[4], (255, 255, 255)), width=2)
    dr.text((8, 6), f"{d['plane']}={d['value']}  horizontal {d['axes'][0]}  vertical {d['axes'][1]}  grid {step}", fill=(255, 230, 120), font=font(15))
    im.save(out); print(out, im.size)


def titled(out, title, sub, cols, cell, items, legend=None):
    """Sheet with a title, subtitle lines, captioned cells and an optional bone legend [(name, rgb01)]."""
    cols = int(cols); cell = int(cell)
    rows = (len(items) + cols - 1) // cols; top = 64 + 24 * len(sub)
    leg_h = 0
    if legend:
        per_row = max(1, (cols * cell - 20) // 200); leg_h = 30 + 24 * ((len(legend) + per_row - 1) // per_row)
    S = Image.new('RGB', (cols * cell, top + rows * (cell + 28) + leg_h), (30, 30, 33)); d = ImageDraw.Draw(S)
    d.text((12, 10), title, fill=(255, 225, 120), font=compose.font(26))
    for i, line in enumerate(sub):
        d.text((12, 46 + 24 * i), line, fill=(225, 225, 225), font=compose.font(17))
    for k, it in enumerate(items):
        p, _, cap = it.partition('=')
        im = compose.flat(Image.open(p)); im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + 28)
        d.text((x0 + 8, y0 + 4), cap, fill=(255, 220, 90), font=compose.font(17))
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + 28 + (cell - im.height) // 2))
    if legend:
        y0 = top + rows * (cell + 28) + 8; f = compose.font(15)
        d.text((12, y0), 'Màu bone (đè trên mesh X-ray):', fill=(255, 225, 120), font=f)
        for k, (n, c) in enumerate(legend):
            x = 12 + (k % per_row) * 200; y = y0 + 26 + (k // per_row) * 24
            d.rectangle([x, y + 3, x + 14, y + 17], fill=tuple(int(255 * v) for v in c))
            d.text((x + 20, y), n, fill=(230, 230, 230), font=f)
    S.save(out); print(out, S.size)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'grid':
        compose.gridlines(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.05)
    elif cmd == 'sec':
        sec(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.025)
    elif cmd == 'overlay':
        compose.overlay(*sys.argv[2:5])
    elif cmd == 'titled':
        spec = json.load(open(sys.argv[2], encoding='utf-8'))
        titled(spec['out'], spec['title'], spec['sub'], spec['cols'], spec['cell'], spec['items'], spec.get('legend'))
    elif cmd == 'grid_sheet':
        compose.grid(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:])

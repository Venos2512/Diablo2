"""Image helpers for P04 (system Python, run as `python -I pyimg.py <cmd> ...`).

`-I` drops the user site-packages where PIL lives, so it is added back explicitly (and only it); rig_v1's compose.py
is imported from its own folder, not modified.

  gridlines <img> <out> [step]             world grid on an orthographic render (needs <img>_cam.json)
  overlay <mesh.png> <bones.png> <out>     bones pass over a mesh pass
  grid <out> <cols> <cell> <img=caption>…  contact sheet
  section <sections.json> <key> <out> [islands,comma] [joints.json]   plot one exact section (+ joints)
"""
import sys, os, json, site
USER_SITE = os.path.join(os.environ.get('APPDATA', r'C:\Users\doanhtn\AppData\Roaming'), 'Python', 'Python310', 'site-packages')
if USER_SITE not in sys.path:
    sys.path.append(USER_SITE)
sys.path.append(r'D:/Claude/Diablo2/ashlar/3d/act-01/_batches/rig_v1/tools')
import compose                                                   # noqa: E402
from PIL import Image, ImageDraw                                  # noqa: E402

PAL = [(230, 160, 140), (90, 200, 255), (120, 230, 120), (250, 200, 60), (220, 120, 240), (255, 120, 120),
       (160, 160, 255), (200, 255, 160), (255, 170, 80), (120, 255, 230)]


def section_plot(js, key, out, only=None, joints=None, px_per_m=1400, pad=0.03):
    S = json.load(open(js))[key]
    axis = key[0]
    ax = {'x': (1, 2), 'y': (0, 2), 'z': (0, 1)}[axis]          # plane axes (horizontal, vertical)
    if only:
        S = [s for s in S if s[2] in only]
    pts = [p for a, b, _ in S for p in (a, b)]
    if joints:
        pts += [j for j in joints.values()]
    u0 = min(p[ax[0]] for p in pts) - pad; u1 = max(p[ax[0]] for p in pts) + pad
    v0 = min(p[ax[1]] for p in pts) - pad; v1 = max(p[ax[1]] for p in pts) + pad
    W = int((u1 - u0) * px_per_m); H = int((v1 - v0) * px_per_m)
    im = Image.new('RGB', (W, H), (34, 34, 38)); d = ImageDraw.Draw(im); f = compose.font(14)
    def P(p):
        return ((p[ax[0]] - u0) * px_per_m, (v1 - p[ax[1]]) * px_per_m)
    step = 0.05
    import math
    i = math.floor(u0 / step)
    while i * step <= u1:
        x, _ = P([i * step] * 3 if ax[0] == 0 else [0, i * step, 0]) if False else ((i * step - u0) * px_per_m, 0)
        d.line([(x, 0), (x, H)], fill=(70, 70, 76)); d.text((x + 2, H - 16), f"{'xyz'[ax[0]]}{i * step:+.2f}", fill=(200, 200, 140), font=f)
        i += 1
    j = math.floor(v0 / step)
    while j * step <= v1:
        y = (v1 - j * step) * px_per_m
        d.line([(0, y), (W, y)], fill=(70, 70, 76)); d.text((2, y - 15), f"{'xyz'[ax[1]]}{j * step:.2f}", fill=(200, 200, 140), font=f)
        j += 1
    for a, b, k in S:
        d.line([P(a), P(b)], fill=PAL[k % len(PAL)], width=2)
    if joints:
        for n, p in joints.items():
            x, y = P(p); d.ellipse([x - 5, y - 5, x + 5, y + 5], outline=(255, 255, 255), width=2)
            d.text((x + 6, y - 6), n, fill=(255, 255, 255), font=f)
    d.text((6, 4), key, fill=(255, 220, 90), font=compose.font(18))
    im.save(out)


def project(cam, p):
    """World point -> pixel on an orthographic render described by its *_cam.json sidecar."""
    W, H = cam['res']; s = cam['ortho']
    d = [p[i] - cam['loc'][i] for i in range(3)]
    u = sum(d[i] * cam['right'][i] for i in range(3)); v = sum(d[i] * cam['up'][i] for i in range(3))
    return W / 2 + u * W / s, H / 2 - v * H / s


def labelled_overlay(mesh_png, bones_png, joints_json, out, names, caption=None, font_px=17):
    """Bones pass over mesh pass, then a dot + label at the head of each named bone (world -> pixel by the sidecar)."""
    compose.overlay(mesh_png, bones_png, out)
    cam = json.load(open(mesh_png[:-4] + '_cam.json'))
    J = json.load(open(joints_json))['bones']
    im = Image.open(out).convert('RGB'); d = ImageDraw.Draw(im); f = compose.font(font_px)
    for n in names:
        if n not in J:
            continue
        x, y = project(cam, J[n][0])
        d.ellipse([x - 4, y - 4, x + 4, y + 4], fill=(255, 255, 255), outline=(0, 0, 0))
        d.text((x + 7, y - 9), n, fill=(0, 0, 0), font=f)
        d.text((x + 6, y - 10), n, fill=(255, 245, 160), font=f)
    if caption:
        d.text((12, 10), caption, fill=(255, 220, 90), font=compose.font(24))
    im.save(out)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'gridlines':
        compose.gridlines(sys.argv[2], sys.argv[3], float(sys.argv[4]) if len(sys.argv) > 4 else 0.05)
    elif cmd == 'overlay':
        compose.overlay(*sys.argv[2:5])
    elif cmd == 'grid':
        compose.grid(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5:])
    elif cmd == 'labelled':
        # labelled <mesh.png> <bones.png> <joints.json> <out> <names,comma> [caption]
        labelled_overlay(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6].split(','),
                         sys.argv[7] if len(sys.argv) > 7 else None)
    elif cmd == 'section':
        only = [int(x) for x in sys.argv[5].split(',')] if len(sys.argv) > 5 and sys.argv[5] else None
        J = json.load(open(sys.argv[6])) if len(sys.argv) > 6 else None
        section_plot(sys.argv[2], sys.argv[3], sys.argv[4], only, J)

"""Layout guides (1920x1080) for the PC-B v2 HUD variants: outlines only, bottom HUD cluster.

Run: python make_guides.py  -> guide_B2.png .. guide_B5.png next to this file.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

W, H = 1920, 1080
BG, LINE, FILL = (58, 58, 60), (215, 212, 205), (78, 78, 80)
OUT = Path(__file__).parent


def canvas():
    im = Image.new('RGB', (W, H), BG)
    return im, ImageDraw.Draw(im)


def globe(d, cx, cy, r):
    d.ellipse([cx - r - 14, cy - r - 14, cx + r + 14, cy + r + 14], fill=FILL, outline=LINE, width=3)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=LINE, width=3)


def vessel(d, cx, cy, w=96, h=118):
    d.rounded_rectangle([cx - w // 2 - 14, cy - h // 2 - 14, cx + w // 2 + 14, cy + h // 2 + 14], 16,
                        fill=FILL, outline=LINE, width=3)
    d.rounded_rectangle([cx - w // 2 + 18, cy - h // 2, cx + w // 2 - 18, cy + h // 2], 12, outline=LINE, width=3)


def square(d, x, y, s=50):
    d.rectangle([x, y, x + s, y + s], fill=FILL, outline=LINE, width=3)


def ring(d, cx, cy, r_out, r_in, angles, key=None):
    """Arch ring between consecutive angles (radians, screen coords); key = index of the keystone."""
    for i, (a0, a1) in enumerate(zip(angles, angles[1:])):
        ro = r_out + (10 if i == key else 0)
        ri = r_in - (10 if i == key else 0)
        pts = [(cx + ro * math.cos(a0 + (a1 - a0) * t / 12), cy + ro * math.sin(a0 + (a1 - a0) * t / 12))
               for t in range(13)]
        pts += [(cx + ri * math.cos(a1 - (a1 - a0) * t / 12), cy + ri * math.sin(a1 - (a1 - a0) * t / 12))
                for t in range(13)]
        d.polygon(pts, fill=FILL, outline=LINE, width=3)


def arch_angles(cx, cy, r, x_left, x_right, n, key_scale=1.35, below=False):
    s = 1 if below else -1
    a_l = math.atan2(s * math.sqrt(max(r * r - (x_left - cx) ** 2, 0)), x_left - cx)
    a_r = math.atan2(s * math.sqrt(max(r * r - (x_right - cx) ** 2, 0)), x_right - cx)
    weights = [1.0] * n
    weights[n // 2] = key_scale
    tot, acc, out = sum(weights), 0.0, [a_l]
    for w in weights:
        acc += w
        out.append(a_l + (a_r - a_l) * acc / tot)
    return out


def b2():  # low segmental arch: rise ~40 px, globe and vessel on the springers
    im, d = canvas()
    cx, chord, rise = 960, 380, 42
    r_out = (chord ** 2 + rise ** 2) / (2 * rise)
    cy = 928 + r_out
    ring(d, cx, cy, r_out, r_out - 72, arch_angles(cx, cy, r_out, cx - chord, cx + chord, 7), key=3)
    globe(d, 640, 1000, 64)
    vessel(d, 1282, 1000)
    for i in range(4):
        square(d, 838 + i * 64, 1022)
    im.save(OUT / 'guide_B2.png')


def b3():  # flat (jack) arch: straight lintel of wedges on two piers
    im, d = canvas()
    x0, x1, top, bot = 760, 1160, 936, 1004
    n, kw = 7, 1.3
    unit = (x1 - x0) / (n - 1 + kw)
    xs, x = [x0], x0
    for i in range(n):
        x += unit * (kw if i == 3 else 1)
        xs.append(x)
    for i in range(n):
        fan = 6 * (i - 3)  # joints fan outward from a point below
        a, b = xs[i], xs[i + 1]
        t, bm = (top - 8, bot + 14) if i == 3 else (top, bot)
        d.polygon([(a + fan - 4, t), (b + fan + 4, t), (b + fan * 0.3, bm), (a + fan * 0.3, bm)],
                  fill=FILL, outline=LINE, width=3)
    d.rectangle([600, 928, 760, 1080], fill=FILL, outline=LINE, width=3)
    d.rectangle([1160, 928, 1320, 1080], fill=FILL, outline=LINE, width=3)
    globe(d, 680, 1004, 60)
    vessel(d, 1240, 1004, 84, 110)
    for i in range(4):
        square(d, 838 + i * 64, 1024)
    im.save(OUT / 'guide_B3.png')


def b4():  # sunken arch: crown shows, ends run below the bottom edge
    im, d = canvas()
    cx, half, depth = 960, 420, 140
    r_out = (half ** 2 + depth ** 2) / (2 * depth)
    cy = 940 + r_out
    xl, xr = cx - half - 30, cx + half + 30
    ring(d, cx, cy, r_out, r_out - 78, arch_angles(cx, cy, r_out, xl, xr, 11), key=5)
    globe(d, 440, 1004, 62)
    vessel(d, 1480, 1004)
    im.save(OUT / 'guide_B4.png')


def b5():  # inverted arch: lowest in the middle, ends rise to globe and vessel
    im, d = canvas()
    cx, half, rise = 960, 330, 56
    r_out = (half ** 2 + rise ** 2) / (2 * rise)
    cy = 1070 - r_out
    ring(d, cx, cy, r_out, r_out - 70, arch_angles(cx, cy, r_out, cx - half, cx + half, 7, below=True), key=3)
    globe(d, 556, 998, 64)
    vessel(d, 1364, 998)
    for x in (348, 410):
        square(d, x, 1018)
    for x in (1460, 1522):
        square(d, x, 1018)
    im.save(OUT / 'guide_B5.png')


if __name__ == '__main__':
    for f in (b2, b3, b4, b5):
        f()

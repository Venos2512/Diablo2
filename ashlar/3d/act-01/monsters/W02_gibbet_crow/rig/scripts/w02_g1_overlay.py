"""W02 G1 proposal sheet: planned joints drawn over orthographic renders (system Python + PIL, `python -I`).

python -I w02_g1_overlay.py <joints.json> <r1_dir> <out.png>

Panels use the R1 renders (w02_tex_<view>.png, cu/cu_<name>_<view>_tex.png) and their _cam.json sidecars
(rigbatch.render_to). Bones are drawn on top of the mesh (not occluded); right-side bones lighter and unlabelled;
sockets white diamonds; control rig markers red. Labels are placed greedily so they do not overlap.
"""
import sys, os, json, math
_US = os.path.join(os.environ.get('APPDATA', ''), 'Python', 'Python%d%d' % sys.version_info[:2], 'site-packages')
if os.path.isdir(_US) and _US not in sys.path:
    sys.path.append(_US)
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

J = json.load(open(sys.argv[1], encoding='utf-8')); RD = sys.argv[2]; OUT = sys.argv[3]
BG = (44, 44, 48)
COL = {'base': (210, 210, 210), 'spine': (255, 196, 40), 'neck': (240, 90, 190), 'head': (170, 120, 255),
       'tail': (255, 140, 60), 'leg': (90, 220, 120), 'wing': (70, 200, 255), 'socket': (255, 255, 255)}
CTL_COL = (255, 110, 110)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def load(path, bright=1.9):
    cam = json.load(open(path[:-4] + '_cam.json'))
    im = Image.open(path).convert('RGBA')
    rgb = ImageEnhance.Contrast(ImageEnhance.Brightness(im.convert('RGB')).enhance(bright)).enhance(0.85)
    a = im.split()[3]
    im = Image.merge('RGBA', (*rgb.split(), a))
    return Image.alpha_composite(Image.new('RGBA', im.size, BG + (255,)), im), cam, a


def projector(cam, size):
    W, H = size; s = cam['ortho']; L, R, U = cam['loc'], cam['right'], cam['up']

    def f(p):
        d = [p[i] - L[i] for i in range(3)]
        return (W / 2 + sum(d[i] * R[i] for i in range(3)) * W / s, H / 2 - sum(d[i] * U[i] for i in range(3)) * H / s)
    return f


def toward_viewer(cam):
    R, U = cam['right'], cam['up']
    fwd = (R[1] * U[2] - R[2] * U[1], R[2] * U[0] - R[0] * U[2], R[0] * U[1] - R[1] * U[0])
    return lambda p: sum(p[i] * fwd[i] for i in range(3))


class Labels:
    def __init__(self, d, W, H):
        self.d, self.W, self.H, self.boxes = d, W, H, []

    def put(self, anchor, text, col, f, prefer=None):
        tw, th = self.d.textbbox((0, 0), text, font=f, stroke_width=2)[2:]
        cands = prefer or []
        for r in (14, 26, 40, 56, 74, 96):
            for a in range(0, 360, 30):
                cands.append((r * math.cos(math.radians(a)), -r * math.sin(math.radians(a))))
        for dx, dy in cands:
            x = anchor[0] + dx - (tw if dx < 0 else 0); y = anchor[1] + dy - th / 2
            box = (x - 2, y - 2, x + tw + 2, y + th + 2)
            if box[0] < 2 or box[1] < 30 or box[2] > self.W - 2 or box[3] > self.H - 2:
                continue
            if any(not (box[2] < b[0] or box[0] > b[2] or box[3] < b[1] or box[1] > b[3]) for b in self.boxes):
                continue
            self.boxes.append(box)
            if math.hypot(dx, dy) > 20:
                ex = x if dx >= 0 else x + tw
                self.d.line([anchor, (ex, y + th / 2)], fill=col + (160,), width=1)
            self.d.text((x, y), text, fill=col, font=f, stroke_width=2, stroke_fill=(0, 0, 0))
            return True
        return False


def panel(path, title, label=(), ctl=(), crop_m=None, bright=1.9, fsize=15, width=None):
    im, cam, alpha = load(path, bright)
    P = projector(cam, im.size); tv = toward_viewer(cam); ppm = im.size[0] / cam['ortho']
    d = ImageDraw.Draw(im, 'RGBA'); f = font(fsize, True); fs = font(fsize - 2)
    # occupy-boxes for label placement are computed after the crop, so draw geometry first, labels later
    anchors = []
    for c in J['ctl']:
        if c['name'] not in ctl:
            continue
        p = P(c['at']); r = c['r'] * ppm
        if c['shape'] == 'ring':
            n = 40
            for k in range(0, n, 2):
                a0 = 2 * math.pi * k / n; a1 = 2 * math.pi * (k + 1) / n
                d.line([(p[0] + r * math.cos(a0), p[1] + r * math.sin(a0)), (p[0] + r * math.cos(a1), p[1] + r * math.sin(a1))],
                       fill=CTL_COL + (230,), width=2)
            anchors.append(((p[0] + r * 0.7, p[1] - r * 0.7), c['name'], CTL_COL, fs))
        elif c['shape'] == 'box':
            d.rectangle([p[0] - r * 0.6, p[1] - r * 0.22, p[0] + r * 0.6, p[1] + r * 0.22], outline=CTL_COL + (255,), width=2)
            anchors.append(((p[0], p[1] + r * 0.22), c['name'], CTL_COL, fs))
        elif c['shape'] == 'diamond':
            d.polygon([(p[0], p[1] - 7), (p[0] + 7, p[1]), (p[0], p[1] + 7), (p[0] - 7, p[1])], outline=CTL_COL + (255,), width=2)
            anchors.append((p, c['name'], CTL_COL, fs))
    for b in sorted(J['bones'], key=lambda b: tv([(b['head'][i] + b['tail'][i]) / 2 for i in range(3)])):
        h, t = P(b['head']), P(b['tail']); col = COL[b['kind']]
        right = b['name'].startswith('R_') or b['name'].endswith('_R')
        if right:
            col = tuple(int(c * 0.5 + 100) for c in col)
        if b['kind'] == 'socket':
            d.polygon([(h[0], h[1] - 6), (h[0] + 6, h[1]), (h[0], h[1] + 6), (h[0] - 6, h[1])], fill=(255, 255, 255, 235), outline=(0, 0, 0))
        else:
            L = math.dist(h, t)
            if L >= 2:
                ux, uy = (t[0] - h[0]) / L, (t[1] - h[1]) / L; w = max(3.0, min(0.12 * L, 10))
                m = (h[0] + ux * 0.2 * L, h[1] + uy * 0.2 * L)
                d.polygon([h, (m[0] - uy * w, m[1] + ux * w), t, (m[0] + uy * w, m[1] - ux * w)], fill=col + (215,), outline=(0, 0, 0, 255))
            d.ellipse([h[0] - 4.5, h[1] - 4.5, h[0] + 4.5, h[1] + 4.5], fill=(20, 20, 20, 255), outline=col + (255,), width=2)
        if b['name'] in label:
            mid = h if b['kind'] == 'socket' else ((h[0] * 0.45 + t[0] * 0.55), (h[1] * 0.45 + t[1] * 0.55))
            anchors.append((mid, b['name'], COL[b['kind']], fs if b['kind'] == 'socket' else f))
    if crop_m is not None:
        bb = alpha.getbbox(); mx = int(crop_m * ppm)
        box = (max(0, bb[0] - mx), max(0, bb[1] - mx - 30), min(im.size[0], bb[2] + mx), min(im.size[1], bb[3] + mx))
        im = im.crop(box); off = box[:2]
    else:
        off = (0, 0)
    if width and im.size[0] != width:
        s = width / im.size[0]; im = im.resize((width, int(im.size[1] * s)), Image.LANCZOS)
    else:
        s = 1.0
    d = ImageDraw.Draw(im, 'RGBA'); lab = Labels(d, *im.size)
    d.rectangle([0, 0, im.size[0], 28], fill=(30, 30, 33, 255))
    d.text((8, 4), title, fill=(255, 225, 120), font=font(18, True))
    for (a, text, col, ff) in anchors:
        lab.put(((a[0] - off[0]) * s, (a[1] - off[1]) * s), text, col, ff)
    return im.convert('RGB')


C = os.path.join(RD, 'cu')
side_spine = ('pelvis', 'spine_01', 'chest', 'cog', 'tail_01', 'tail_02', 'root')
front = panel(os.path.join(RD, 'w02_tex_front.png'), 'TRƯỚC — cánh trái của quạ ở bên phải ảnh (xương vẽ đè lên mesh, kể cả xương đuôi phía sau)', crop_m=0.05,
              label=('L_Wing_01', 'L_Wing_02', 'L_Wing_03', 'fx_wing_L', 'L_Thigh', 'L_Calf', 'L_Foot', 'L_Toe', 'root'),
              ctl=('ctl_L_Foot_IK',), width=1500)
side = panel(os.path.join(RD, 'w02_tex_left.png'), 'BÊN TRÁI — thân, đuôi, chân', crop_m=0.12,
             label=side_spine + ('L_Thigh', 'L_Calf', 'L_Foot', 'L_Toe', 'ground', 'L_Wing_01'),
             ctl=('ctl_cog', 'ctl_L_Foot_IK', 'ctl_L_Knee_pole'), width=740)
top = panel(os.path.join(RD, 'w02_tex_topdown.png'), 'TRÊN XUỐNG — đầu ở trên', crop_m=0.05,
            label=('L_Wing_01', 'L_Wing_02', 'L_Wing_03', 'tail_01', 'tail_02'), width=760)
neck = panel(os.path.join(C, 'cu_neck_left_tex.png'), 'BÊN TRÁI, phóng to — cổ, đầu, mỏ', bright=1.7, fsize=17,
             label=('chest', 'neck_01', 'neck_02', 'neck_03', 'head', 'beak', 'hit_origin', 'fx_head', 'fx_chest', 'L_Wing_01', 'spine_01'),
             width=740)
leg = panel(os.path.join(C, 'cu_leg_left_tex.png'), 'BÊN TRÁI, phóng to — chân (gối trong "quần" lông)', bright=1.7, fsize=17,
            label=('L_Thigh', 'L_Calf', 'L_Foot', 'L_Toe', 'pelvis'), ctl=('ctl_L_Foot_IK', 'ctl_L_Knee_pole'), width=760)

lines = [
    ('Skeleton runtime đề xuất: %d bone = %d deform + root, cog + %d socket (họ W, bản chim đầu tiên)' % (J['n_bones'], J['n_deform'], len(J['sockets'])), (255, 225, 120)),
    ('Thân: root ─ cog ─ pelvis ─ spine_01 ─ chest ─ neck_01..03 ─ head ─ beak (hàm dưới)        Đuôi: pelvis ─ tail_01 ─ tail_02', COL['spine']),
    ('Chân (mỗi bên): pelvis ─ L_Thigh (đùi, trong thân) ─ L_Calf ("quần" lông) ─ L_Foot (giò vảy) ─ L_Toe (3 ngón trước; ngón sau theo L_Foot)', COL['leg']),
    ('Cánh (mỗi bên): chest ─ L_Wing_01 (cánh tay) ─ L_Wing_02 (cẳng cánh) ─ L_Wing_03 (bàn cánh + lông chóp); lông bám xương cánh gần nhất', COL['wing']),
    ('Socket (không trọng số): ground, hit_origin (chóp mỏ), fx_head, fx_chest, fx_wing_L/R (cổ tay cánh)', COL['socket']),
    ('Rig điều khiển (đỏ, chỉ trong .blend): ctl_root, ctl_cog, IK chân ctl_L_Foot_IK + ctl_L_Knee_pole + gót/ngón, FK cánh + thanh gập ctl_L_Wing_fold', CTL_COL),
    ('Kích thước: scale 1,6028 theo sải cánh 0,89H = 1,602 m → cao tới chóp cánh 0,752 m (0,42H), đỉnh đầu 0,565 m (0,31H), mỏ → đuôi 0,854 m (0,47H)', (220, 220, 220)),
    ('Gốc root/ground đặt giữa hai bàn chân: mesh dời +0,145 m theo Y khi dựng (GLB gốc không sửa)', (220, 220, 220)),
]
legend_h = 26 * len(lines) + 62
Wd = max(front.size[0], side.size[0] + top.size[0], neck.size[0] + leg.size[0])
H = legend_h + front.size[1] + max(side.size[1], top.size[1]) + max(neck.size[1], leg.size[1]) + 8
sheet = Image.new('RGB', (Wd, H), (30, 30, 33)); d = ImageDraw.Draw(sheet)
d.text((12, 10), 'W02 Gibbet-Crow — đề xuất khớp và skeleton (cổng G1, chưa dựng rig)', fill=(255, 225, 120), font=font(26, True))
for i, (t, c) in enumerate(lines):
    d.text((14, 50 + 26 * i), t, fill=c, font=font(17, i == 0))
y = legend_h
sheet.paste(front, ((Wd - front.size[0]) // 2, y)); y += front.size[1] + 4
sheet.paste(side, (0, y)); sheet.paste(top, (side.size[0] + 4, y)); y += max(side.size[1], top.size[1]) + 4
sheet.paste(neck, (0, y)); sheet.paste(leg, (neck.size[0] + 4, y))
sheet.save(OUT, optimize=True)
print(OUT, sheet.size)

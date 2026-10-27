"""Compose the G1 proposal sheet (py -3.11 -I w07_g1_sheet.py) from rig/_work/g1/*.png -> rig/qa/W07_shroud_spinner_G1_proposal.png"""
import os, json
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE); G = os.path.join(RIG, '_work', 'g1'); QA = os.path.join(RIG, 'qa')
os.makedirs(QA, exist_ok=True)
SPEC = json.load(open(os.path.join(RIG, '_work', 'rig_spec.json')))
FACTS = json.load(open(os.path.join(G, 'facts.json')))
BG = (58, 58, 62)


def font(sz, bold=False):
    for fn in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(fn, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def over(base, bones):
    a = Image.open(os.path.join(G, base)).convert('RGBA'); b = Image.open(os.path.join(G, bones)).convert('RGBA')
    im = Image.alpha_composite(Image.new('RGBA', a.size, BG + (255,)), a)
    return Image.alpha_composite(im, b).convert('RGB')


cells = [(over('xr_front.png', 'xr_front_bones.png'), 'Trước (X-ray)'),
         (over('xr_left.png', 'xr_left_bones.png'), 'Bên trái (+X)'),
         (over('xr_topdown.png', 'xr_topdown_bones.png'), 'Trên xuống'),
         (over('xr_three_quarter.png', 'xr_three_quarter_bones.png'), '3/4 trước'),
         (over('cu_head_fq.png', 'cu_head_fq_bones.png'), 'Cận đầu: nanh (tím), chân xúc giác (lục lam)'),
         (over('cu_head_side.png', 'cu_head_side_bones.png'), 'Cận đầu, bên'),
         (over('cu_roots_below.png', 'cu_roots_below_bones.png'), 'Gốc chân nhìn từ dưới (Leg1+Leg2 chung cục gốc)'),
         (over('cu_orphan_bq.png', 'cu_orphan_bq_bones.png'), 'ĐỎ: 2 đoạn chân rời sau bụng (câu hỏi 1)')]
cols, cell = 4, 620
title_h = 128; legend_h = 150
rows = (len(cells) + cols - 1) // cols
S = Image.new('RGB', (cols * cell, title_h + rows * (cell + 30) + legend_h), (30, 30, 33)); d = ImageDraw.Draw(S)
nb, nd = SPEC['n_bones'], SPEC['n_deform']
d.text((14, 10), f'W07 Shroud-Spinner — G1: skeleton runtime đề xuất ({nb} bone, {nd} deform)', fill=(255, 225, 120), font=font(28, True))
lines = [f"Cao thật 1,44 m (0,8H), scale đều ×{FACTS['info']['scale']:.4f} từ GLB; sải chân x 2,83 m × y 2,79 m (≈1,57H × 1,55H). "
         f"Rig ở kích thước này, mặt nhìn −Y, trái = +X.",
         'Mỗi chân 4 đốt như mesh: _01 háng (coxa) · _02 đùi · _03 ống · _04 bàn/mũi (cùng nghĩa với W04). Khớp đo tự động '
         'từ vòng khớp trên mesh, hai bên lệch ≤ 1,2 cm, dùng trung bình gương.',
         f"Đoạn chân rời (đỏ): {FACTS['orphan_tris']} tam giác, không nối vào thân; đề xuất xoá khỏi mesh rig (GLB gốc không đổi)."]
for i, t in enumerate(lines):
    d.text((14, 48 + 24 * i), t, fill=(225, 225, 225), font=font(18))
for k, (im, cap) in enumerate(cells):
    im = im.copy(); im.thumbnail((cell, cell))
    x0 = (k % cols) * cell; y0 = title_h + (k // cols) * (cell + 30)
    d.text((x0 + 8, y0 + 4), cap, fill=(255, 220, 90), font=font(18, True))
    S.paste(im, (x0 + (cell - im.width) // 2, y0 + 30 + (cell - im.height) // 2))
# legend
import colorsys
y = title_h + rows * (cell + 30) + 10
items = [((1.0, 0.85, 0.25), 'cephalothorax'), ((1.0, 0.55, 0.75), 'abdomen_01'), ((0.85, 0.35, 0.95), 'abdomen_02'),
         (colorsys.hsv_to_rgb(0.90, 0.85, 1.0), 'L/R_fang'), (colorsys.hsv_to_rgb(0.47, 0.85, 1.0), 'L/R_Palp_01..02'),
         (colorsys.hsv_to_rgb(0.00, 0.85, 1.0), 'Leg1'), (colorsys.hsv_to_rgb(0.13, 0.85, 1.0), 'Leg2'),
         (colorsys.hsv_to_rgb(0.33, 0.85, 1.0), 'Leg3'), (colorsys.hsv_to_rgb(0.58, 0.85, 1.0), 'Leg4'),
         ((0.55, 0.55, 0.55), 'root, cog, socket')]
x = 14
for c, t in items:
    col = tuple(int(255 * v) for v in c)
    d.rectangle([x, y + 4, x + 22, y + 26], fill=col); d.text((x + 30, y + 4), t, fill=(230, 230, 230), font=font(18)); x += 40 + int(d.textlength(t, font=font(18)))
d.text((14, y + 40), 'Bên trái (L_, +X) màu đậm, bên phải (R_) màu nhạt; đốt _01→_04 tối dần. Chấm đen = đầu bone (khớp). '
       'Socket: ground, hit_origin, fx_head, fx_abdomen, fx_spinneret.', fill=(210, 210, 210), font=font(17))
d.text((14, y + 66), 'Bone nanh và chân xúc giác: 1 bone mỗi nanh, 2 bone mỗi chân xúc giác (gốc → khớp đỉnh → mũi vuốt). '
       'Bụng: abdomen_01 cả quả bụng (xoay quanh cuối đầu ngực), abdomen_02 chỏm sau-dưới quanh núm tơ.',
       fill=(210, 210, 210), font=font(17))
out = os.path.join(QA, 'W07_shroud_spinner_G1_proposal.png'); S.save(out); print(out, S.size)

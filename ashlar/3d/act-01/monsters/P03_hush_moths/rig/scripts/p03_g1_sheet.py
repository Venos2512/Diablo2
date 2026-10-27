"""P03 G1 proposal sheet (PIL).  python -I run_pil.py p03_g1_sheet.py <g1_dir> <out.png>

Panels: variant A (front, side, top), variant B (front, side, top), close-ups of A (legs side, legs front, head front).
Each panel = X-ray mesh render + bone proxy render (same camera) + labels at bone midpoints.
"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

G, OUT = sys.argv[1], sys.argv[2]
BG = (44, 44, 48)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


GROUP_COL = {'core': (150, 150, 150), 'body': (255, 115, 25), 'head': (190, 75, 255), 'abdomen': (255, 190, 25),
             'antenna': (240, 90, 215), 'wingF': (40, 240, 90), 'wingB': (25, 205, 255), 'leg1': (255, 50, 50),
             'leg2': (255, 240, 50), 'leg3': (75, 130, 255), 'socket': (140, 140, 140)}

LABELS = {
    'A_front': ['L_WingF_01', 'L_WingF_02', 'L_WingB_01', 'L_WingB_02', 'L_antenna_01', 'L_antenna_02', 'L_Leg2_01', 'L_Leg2_03'],
    'A_side': ['head', 'thorax', 'abdomen_01', 'abdomen_02', 'abdomen_03', 'L_Leg1_01', 'L_Leg1_02', 'L_Leg1_03', 'L_Leg3_01',
               'L_Leg3_03', 'L_WingF_01', 'L_WingF_02', 'L_WingB_02', 'L_antenna_02', 'hit_origin', 'fx_wing_L'],
    'A_top': ['L_WingF_02', 'L_WingB_02', 'L_Leg1_03', 'L_Leg2_03', 'L_Leg3_03', 'abdomen_03'],
    'B_front': ['L_WingF_01', 'L_WingF_02', 'L_WingB_02', 'L_antenna_01', 'L_Leg2_01'],
    'B_side': ['head', 'thorax', 'abdomen_01', 'abdomen_02', 'L_Leg1_01', 'L_Leg2_01', 'L_Leg3_01', 'L_antenna_01'],
    'B_top': ['L_WingF_02', 'L_WingB_02'],
    'A_legs_side': ['L_Leg1_01', 'L_Leg1_02', 'L_Leg1_03', 'L_Leg2_01', 'L_Leg2_02', 'L_Leg3_01', 'L_Leg3_02', 'L_Leg3_03',
                    'abdomen_01', 'abdomen_02', 'abdomen_03', 'thorax', 'ground'],
    'A_legs_front': ['L_Leg2_01', 'L_Leg2_02', 'L_Leg2_03', 'L_Leg1_02', 'L_Leg1_03'],
    'A_head_front': ['head', 'L_antenna_01', 'L_antenna_02', 'fx_head', 'L_WingF_01', 'L_WingB_01'],
}
TITLES = {'A_front': 'A đầy đủ · trước', 'A_side': 'A · bên (trái quái)', 'A_top': 'A · trên',
          'B_front': 'B bầy · trước', 'B_side': 'B · bên', 'B_top': 'B · trên',
          'A_legs_side': 'A · chân, bên', 'A_legs_front': 'A · chân giữa, trước', 'A_head_front': 'A · đầu, râu, bản lề cánh'}


def panel(key, cell):
    m = Image.open(os.path.join(G, f'g1_{key}.png')).convert('RGBA'); b = Image.open(os.path.join(G, f'g1_{key}_bones.png')).convert('RGBA')
    im = Image.alpha_composite(Image.alpha_composite(Image.new('RGBA', m.size, BG + (255,)), m), b)
    W, H = im.size; d = ImageDraw.Draw(im); f = font(max(15, W // 52), True)
    labs = {L['name']: L for L in json.load(open(os.path.join(G, f'g1_{key}_labels.json')))}
    for n in LABELS.get(key, []):
        if n not in labs:
            continue
        L = labs[n]; x, y = L['u'] * W, (1 - L['v']) * H
        col = GROUP_COL.get(L['group'], (255, 255, 255))
        d.text((x + 8, y - 8), n, font=f, fill=col, stroke_width=3, stroke_fill=(0, 0, 0))
    return im.convert('RGB').resize((cell, cell), Image.LANCZOS)


keys = ['A_front', 'A_side', 'A_top', 'B_front', 'B_side', 'B_top', 'A_legs_side', 'A_legs_front', 'A_head_front']
cell = 760; cols = 3; rows = 3
A = json.load(open(os.path.join(G, 'bones_A.json'))); B = json.load(open(os.path.join(G, 'bones_B.json')))
LM = json.load(open(os.path.join(G, 'landmarks_auto.json')))
nA = len(A); dA = sum(1 for b in A if b['deform']); sA = sum(1 for b in A if b['group'] == 'socket')
nB = len(B); dB = sum(1 for b in B if b['deform']); sB = sum(1 for b in B if b['group'] == 'socket')
sub = [f"A (đầy đủ): {nA} bone runtime = {nA - sA} xương ({dA} deform, root + cog không trọng số) + {sA} socket.  "
       f"B (bầy): {nB} = {nB - sB} xương ({dB} deform) + {sB} socket. B là tập con của A: cùng tên, cùng tư thế nghỉ; xương bỏ dồn trọng số về cha.",
       f"Kích thước dựng: cao {LM['height']:.3f} m (chóp râu 0,33H), sải cánh {LM['span']:.3f} m (0,72H; danh mục ~0,75H). "
       "Mặt nhìn −Y Blender (= +Z glTF), trái của quái = +X.",
       "Cánh trước (F) và sau (B) mỗi bên chung MỘT điểm bản lề (giữa hai gốc cánh, trong lông ngực): vỗ cùng góc thì hai lớp cánh đi như một khối.",
       "Chân: _01 háng→gối (cả đốt chậu + đùi, cứng), _02 gối→cổ chân (u khớp), _03 cổ chân→mũi bàn. Bụng 3 đốt theo trục giữa từ eo (sau chân sau) tới chóp."]
top = 64 + 26 * len(sub) + 40
S = Image.new('RGB', (cols * cell, top + rows * (cell + 34)), (28, 28, 31)); d = ImageDraw.Draw(S)
d.text((14, 12), 'P03 Hush-Moths — đề xuất skeleton (G1, chưa duyệt)', fill=(255, 225, 120), font=font(30, True))
for i, line in enumerate(sub):
    d.text((14, 60 + 26 * i), line, fill=(230, 230, 230), font=font(18))
x = 14; y = 60 + 26 * len(sub) + 6
for g, name in (('body', 'thorax'), ('head', 'head'), ('antenna', 'râu'), ('abdomen', 'bụng'), ('wingF', 'cánh trước F'),
                ('wingB', 'cánh sau B'), ('leg1', 'chân 1 (trước)'), ('leg2', 'chân 2 (giữa)'), ('leg3', 'chân 3 (sau)'), ('socket', 'socket')):
    d.rectangle([x, y + 3, x + 18, y + 21], fill=GROUP_COL[g]); d.text((x + 24, y), name, fill=(220, 220, 220), font=font(18))
    x += 24 + int(d.textlength(name, font=font(18))) + 26
d.text((x + 10, y), '· _02 nhạt hơn, _03 đậm hơn', fill=(200, 200, 200), font=font(18))
for k, key in enumerate(keys):
    im = panel(key, cell)
    x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + 34)
    d.text((x0 + 10, y0 + 6), TITLES[key], fill=(255, 220, 90), font=font(20, True))
    S.paste(im, (x0, y0 + 34))
S.save(OUT); print(OUT, S.size)

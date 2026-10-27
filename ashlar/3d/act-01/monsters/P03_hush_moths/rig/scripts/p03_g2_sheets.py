"""P03 G2 review sheets (PIL).  python -I run_pil.py p03_g2_sheets.py <rig_dir>

Reads rig/validation.json and rig/qa/raw/*, writes rig/qa/P03_hush_moths_G2_1_skeleton.png, _2_weights, _3a_poses, _3b_poses,
_4_wing_layers.
"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

RIG = sys.argv[1]; RAW = os.path.join(RIG, 'qa', 'raw'); Q = os.path.join(RIG, 'qa')
V = json.load(open(os.path.join(RIG, 'validation.json'), encoding='utf-8'))
BUILD = json.load(open(os.path.join(RIG, '_work', 'build_report.json')))
BG = (44, 44, 48)
GC = {'core': (150, 150, 150), 'body': (255, 115, 25), 'head': (190, 75, 255), 'abdomen': (255, 190, 25), 'antenna': (240, 90, 215),
      'wingF': (40, 240, 90), 'wingB': (25, 205, 255), 'wing_master': (40, 160, 70), 'leg1': (255, 50, 50), 'leg2': (255, 240, 50),
      'leg3': (75, 130, 255), 'leg_ik': (240, 130, 230), 'socket': (210, 210, 210)}


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def img(name):
    p = os.path.join(RAW, name)
    if not os.path.exists(p):
        return Image.new('RGB', (600, 600), (90, 0, 0))
    im = Image.open(p).convert('RGBA')
    return Image.alpha_composite(Image.new('RGBA', im.size, BG + (255,)), im)


def over(base, bones):
    a = img(base); b = Image.open(os.path.join(RAW, bones)).convert('RGBA')
    return Image.alpha_composite(a, b)


def labels(im, js, names=None, size=None):
    p = os.path.join(RAW, js)
    if not os.path.exists(p):
        return im
    d = ImageDraw.Draw(im); W, H = im.size; f = font(size or max(14, W // 60), True)
    for L in json.load(open(p)):
        if names and L['name'] not in names:
            continue
        x, y = L['u'] * W, (1 - L['v']) * H
        d.text((x + 6, y - 8), L['name'], font=f, fill=GC.get(L.get('group'), (255, 255, 255)), stroke_width=3, stroke_fill=(0, 0, 0))
    return im


def wrap(d, text, f, width):
    lines, cur = [], ''
    for w in text.split(' '):
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    return lines[:2]


def sheet(cells, cols, cell, title, sub, out):
    rows = (len(cells) + cols - 1) // cols; top = 64 + 25 * len(sub); band = 50
    S = Image.new('RGB', (cols * cell, top + rows * (cell + band)), (28, 28, 31)); d = ImageDraw.Draw(S)
    d.text((12, 10), title, fill=(255, 225, 120), font=font(28, True))
    for i, line in enumerate(sub):
        d.text((12, 54 + 25 * i), line, fill=(228, 228, 228), font=font(18))
    f = font(16, True)
    for k, (im, cap) in enumerate(cells):
        im = im.convert('RGB'); im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + band)
        for j, line in enumerate(wrap(d, cap, f, cell - 14)):
            d.text((x0 + 7, y0 + 4 + 21 * j), line, fill=(255, 220, 90), font=f)
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + band + (cell - im.height) // 2))
    S.save(out); print(out, S.size)


A1 = V['A1']; P = V['poses']
a1_ok = sum(1 for x in A1.values() if x['pass_'])
SK_NAMES = None
# ------------------------------------------------------------------ 1 skeleton
cells = []
for v, cap in (('front', 'runtime A · trước'), ('left', 'runtime A · bên (trái quái)'), ('back', 'runtime A · sau'), ('topdown', 'runtime A · trên')):
    im = over(f'skel_{v}.png', f'skel_{v}_bones.png')
    names = None if v in ('left',) else ['L_WingF_01', 'L_WingF_02', 'L_WingB_01', 'L_WingB_02', 'L_antenna_02', 'L_Leg2_01', 'L_Leg2_03',
                                          'abdomen_03', 'head', 'L_Leg1_03', 'L_Leg3_03']
    if v == 'left':
        names = ['head', 'thorax', 'abdomen_01', 'abdomen_02', 'abdomen_03', 'L_Leg1_01', 'L_Leg1_02', 'L_Leg1_03', 'L_Leg3_01', 'L_Leg3_03',
                 'L_WingF_01', 'L_WingB_02', 'L_antenna_01', 'hit_origin', 'fx_wing_L', 'ground']
    cells.append((labels(im, f'skel_{v}_labels.json', names), cap))
for v in ('front', 'left'):
    cells.append((labels(over(f'ctl_{v}.png', f'ctl_{v}_bones.png'), f'ctl_{v}_labels.json'), f'rig điều khiển ctl · {"trước" if v == "front" else "bên"}'))
for nm, c in (('rest', 'vai cánh, nghỉ'), ('wings_up_65', 'vai cánh, vỗ lên 65°'), ('wings_down_45', 'vai cánh, vỗ xuống 45°')):
    cells.append((img(f'root_{nm}_shoulder.png'), c + ' (gốc cánh trong lông ngực)'))
cells.append((labels(img('sockets_rest.png'), 'sockets_rest_labels.json', size=15), 'socket (nghỉ)'))
cells.append((labels(img('sockets_wings_up_65.png'), 'sockets_wings_up_65_labels.json', size=15), 'socket khi cánh lên 65° (fx_wing theo cánh)'))
ik = BUILD['ik']
sub = [f"Runtime A: {A1['A1.2_bone_names']['value']['count']} bone (35 deform, root + cog không trọng số, 6 socket); rig điều khiển {BUILD['ctl_bones']} bone ctl_* "
       f"(armature riêng, Copy Transforms, lệch tư thế nghỉ {BUILD['rest_deviation_m']:.1e} m).",
       f"A1: {a1_ok}/{len(A1)} đạt (validation.json). Cao {A1['A1.11_height']['value']['height_m']} m, chân chạm z {A1['A1.12_feet_on_ground']['value']}; "
       f"mesh khớp GLB đã scale {A1['A1.9_mesh_matches_scaled_input']['value']['max_m']} m; 3 texture sha256 trùng GLB.",
       f"IK 6 chân: pole −90°, lệch tư thế nghỉ khi bật IK ≤ {max(v['rest_error_mm'] for v in ik.values())} mm. Bản lề cánh chung: ctl_L_Wing / ctl_R_Wing (+X = cánh lên), ctl_wings vỗ cả hai."]
sheet(cells, 4, 600, 'P03 Hush-Moths — skeleton và rig điều khiển (G2 1/4)', sub, os.path.join(Q, 'P03_hush_moths_G2_1_skeleton.png'))

# ------------------------------------------------------------------ 2 weights
cells = [(img(f'w_{v}.png'), f'trọng số · {c}') for v, c in (('front', 'trước'), ('back', 'sau'), ('left', 'bên'), ('three_quarter', '3/4'), ('topdown', 'trên'))]
cells += [(img(f'{t}.png'), c) for t, c in (('w_legs_left', 'chân · bên'), ('w_legs_front', 'chân giữa · trước'), ('w_head_front', 'đầu, râu · trước'),
                                            ('w_abd_left', 'bụng · bên'), ('w_wings_back', 'cánh trái · sau'))]
for ch, cap in (('legs', 'chuỗi chân trái'), ('body', 'thorax → abdomen_01..03'), ('wings', 'cánh trái F/B _01/_02'), ('antenna', 'râu trái + head')):
    im = img(f'wc_{ch}.png'); leg = json.load(open(os.path.join(RAW, f'wc_{ch}_legend.json')))
    d = ImageDraw.Draw(im); f = font(max(14, im.size[0] // 50), True); y = 8
    for n, c in leg.items():
        d.rectangle([8, y, 30, y + 18], fill=tuple(int(255 * x) for x in c)); d.text((36, y - 1), n, font=f, fill=(240, 240, 240), stroke_width=2, stroke_fill=(0, 0, 0)); y += 24
    cells.append((im, cap))
inf = A1['A1.6_max_influences']['value']; sym = V['weights_symmetry']; B = V['variant_B']
sub = [f"Tổng trọng số lệch tối đa {A1['A1.5_weight_sum']['value']:.1e}; tối đa {inf['max']} ảnh hưởng (số đỉnh theo 1/2/3/4 ảnh hưởng: {inf['histogram']}); 0 đỉnh trống; mọi group là bone deform.",
       f"Đầu + mắt cứng theo head; cánh: mỗi mảnh chỉ 2 xương của nó (không thorax); chân: mặt phân giác ở háng / gối (±13 mm) / cổ chân (±10 mm); "
       f"thân: theo trục dọc, eo ±28 mm. Đối xứng L/R: lệch tối đa {sym['max_abs_diff']}.",
       f"B (bầy): {B['bones_runtime']} bone, {B['deform']} deform, tối đa {B['max_influences']} ảnh hưởng, tổng lệch {B['sum_max_dev']:.1e} — gộp trọng số đúng."]
sheet(cells, 5, 460, 'P03 Hush-Moths — trọng số (G2 2/4)', sub, os.path.join(Q, 'P03_hush_moths_G2_2_weights.png'))


# ------------------------------------------------------------------ 3 poses
def cap(n):
    r = P[n]; st = r['stretch']
    t = f"{n}: giãn {st['stretch_max']}×, nén {st['compress_min']}×"
    return t


def lay(n):
    L = P[n]['wing_layers']
    return f"lớp cánh: xuyên mới L {L['L']['new_inside_n']} / R {L['R']['new_inside_n']}, hở thêm {max(L['L']['gap_open_mm'], L['R']['gap_open_mm'])} mm"


cells = []
for n, v in (('rest', 'three_quarter'), ('wings_up_65', 'three_quarter'), ('wings_up_65', 'front'), ('wings_mid_30', 'three_quarter'),
             ('wings_down_45', 'three_quarter'), ('wings_down_45', 'front'), ('wing_flex_30', 'front'), ('wing_twist_25', 'three_quarter'),
             ('wing_sweep_20', 'topdown'), ('wingB_lag_10', 'three_quarter'), ('wingB_lead_10', 'three_quarter'), ('flight_combo', 'three_quarter'),
             ('antenna_fwd', 'left'), ('antenna_back', 'left'), ('antenna_side', 'front'), ('head_nod_15', 'left'), ('head_down_15', 'left'),
             ('head_turn_15', 'three_quarter')):
    c = cap(n) if v != 'front' or n != 'wings_up_65' else f'{n} · trước'
    if n.startswith(('wing', 'flight')) and v == 'three_quarter':
        c = cap(n) + ' | ' + lay(n).replace('lớp cánh: ', '')
    cells.append((img(f'pose_{n}_{v}.png'), c))
sub = ['Tư thế đặt qua rig điều khiển (ctl_*). Giãn / nén = tỉ lệ cạnh lớn nhất / nhỏ nhất so với nghỉ (cạnh ≥ 1,3 mm). Cánh, đầu là khối cứng (1,0×).',
       'Vỗ đồng bộ (lên 65°, xuống 45°, xoắn 25°, quét 20°): hai lớp cánh 0 đỉnh xuyên mới, khe không đổi. Cánh sau trễ/sớm 10° (thử chịu tải): hở 5–6 cm.',
       f"Cánh xuống 45°: cánh sau chạm chân ({sum(v['legs_inside_vs_rest'] for v in P['wings_down_45']['wing_contacts'].values())} đỉnh chân trong cánh); "
       f"gốc cánh lún thêm vào lông ngực ({P['wings_down_45']['wing_verts_inside_body_vs_rest']} đỉnh, khuất)."]
sheet(cells, 6, 380, 'P03 Hush-Moths — tư thế thử: cánh, râu, đầu (G2 3a/4)', sub, os.path.join(Q, 'P03_hush_moths_G2_3a_poses.png'))

cells = []
for n in ('abdomen_down_45', 'abdomen_up_30', 'abdomen_side_36'):
    cells += [(img(f'pose_{n}_back_three_quarter.png'), cap(n)), (img(f'pose_{n}_left.png'), 'bên'),
              (img(f'pose_{n}_heat_back.png'), 'giãn (đỏ ≥ 1,6×)'),
              (img(f'pose_{n}_topdown.png' if n == 'abdomen_side_36' else f'pose_{n}_heat_left.png'), 'trên' if n == 'abdomen_side_36' else 'giãn · bên')]
for n in ('legs_tuck', 'leg_step_IK', 'crouch_IK'):
    cells += [(img(f'pose_{n}_three_quarter.png'), cap(n)), (img(f'pose_{n}_left.png'), 'bên'), (img(f'pose_{n}_heat_left.png'), 'giãn / nén · bên'),
              (img(f'pose_{n}_front.png'), 'trước')]
for n in ('legs_tuck', 'abdomen_down_45', 'flight_combo', 'antenna_fwd'):
    r = P[n]['variant_B_stretch']
    cells.append((img(f'B_{n}.png'), f"B · {n}: giãn {r['stretch_max']}×, nén {r['compress_min']}×"))
st = P['leg_step_IK']['foot_tip_move_mm']; cr = P['crouch_IK']['foot_tip_move_mm']
sub = ['Bụng: ctl_abdomen_curl cộng cùng góc cho 3 đốt (−15°/đốt = 45° ở chóp; +10°/đốt; 12°/đốt sang bên). Giãn tập trung ở bụng dưới gần eo.',
       f"Chân: co khi bay (FK: háng −30°, gối +65°, cổ chân +45°) nén mặt trong u khớp; bước IK: bàn đứng yên {[k for k, x in st.items() if x == 0]}, "
       f"hạ thân 3,5 cm: mọi bàn dịch {max(cr.values())} mm.",
       f"Bụng cong sang bên đẩy chân sau vào thân ({P['abdomen_side_36']['leg_verts_inside_body_vs_rest']} đỉnh). Hàng cuối: phương án B (chân, râu một khối)."]
sheet(cells, 4, 470, 'P03 Hush-Moths — tư thế thử: bụng, chân, phương án B (G2 3b/4)', sub, os.path.join(Q, 'P03_hush_moths_G2_3b_poses.png'))

# ------------------------------------------------------------------ 4 wing layers: sections across the span (normal axis magnified x4)
LS = json.load(open(os.path.join(RAW, 'layers_sections.json')))
cell = 380; cols = 3
rows_ = list(LS.items())
H = 70 + 25 * 3 + len(rows_) * (cell // 2 + 34)
S = Image.new('RGB', (cols * cell + 260, H), (28, 28, 31)); d = ImageDraw.Draw(S)
d.text((12, 10), 'P03 Hush-Moths — hai lớp cánh trái, mặt cắt vuông góc sải (G2 4/4)', fill=(255, 225, 120), font=font(28, True))
sub = ['Mặt cắt trong khung xương L_WingF_01 (đi theo cánh trước) ở 15 / 28 / 42 % sải: cánh trước xanh lá, cánh sau xanh dương, cánh sau lúc nghỉ xám; dọc phóng ×3.',
       'Vỗ cùng góc: mặt cắt trùng hệt tư thế nghỉ (hai lớp đi như một khối). Đỏ ở cột phải = số đỉnh cánh sau nằm trong cánh trước '
       '(nghỉ đã có 10, mesh Tripo chồng sẵn ở gốc).',
       'Trễ / sớm 10° (cánh sau xoay riêng) làm lớp tách hoặc chồng: clip nên giữ cánh sau theo ctl_*_Wing, lệch riêng ≤ 2–3°.']
for i, line in enumerate(sub):
    d.text((12, 52 + 25 * i), line, fill=(228, 228, 228), font=font(17))
y0 = 70 + 25 * 3
rest = LS['rest']['sections']
frame = {}
for stn, segs in rest.items():
    pts = [p for key in ('F', 'B') for sg in segs[key] for p in (sg[:2], sg[2:])]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    frame[stn] = ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs) + 0.02)
MAG = 3.0
for name, v in rows_:
    d.text((10, y0 + 4), name, fill=(255, 220, 90), font=font(17, True))
    for k, (stn, segs) in enumerate(v['sections'].items()):
        x0 = k * cell; box = (x0 + 8, y0 + 28, x0 + cell - 8, y0 + 28 + cell // 2)
        tile = Image.new('RGB', (box[2] - box[0], box[3] - box[1]), (20, 20, 22)); td = ImageDraw.Draw(tile)
        cx, cy, span = frame.get(stn, (0, 0, 0.2)); sc = (tile.width - 10) / span

        def to(px, py):
            return (tile.width / 2 + (px - cx) * sc, tile.height / 2 - (py - cy) * sc * MAG)
        for key, col, src in (('B', (90, 90, 95), rest.get(stn, {})), ('F', (60, 230, 100), segs), ('B', (60, 170, 255), segs)):
            for sg in src.get(key, []):
                td.line([to(sg[0], sg[1]), to(sg[2], sg[3])], fill=col, width=2)
        td.text((4, 2), f'{float(stn) * 100:.0f} cm', fill=(200, 200, 200), font=font(13))
        S.paste(tile, box[:2]); d.rectangle(box, outline=(80, 80, 85))
    d.text((cols * cell + 10, y0 + 40), f"cánh sau trong cánh trước: {v['inside']}", fill=(255, 90, 90) if v['inside'] > 10 else (220, 220, 220), font=font(16, True))
    d.text((cols * cell + 10, y0 + 66), f"khe nhỏ nhất (ngoài): {v['min_gap_mm']} mm", fill=(220, 220, 220), font=font(16))
    y0 += cell // 2 + 34
S.save(os.path.join(Q, 'P03_hush_moths_G2_4_wing_layers.png')); print('wing layers', S.size)

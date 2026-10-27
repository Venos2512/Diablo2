"""G2 review sheets for W07 (py -3.11 -I w07_g2_sheets.py): rig/qa/raw/*.png + rig/validation.json -> rig/qa/W07_shroud_spinner_G2_*.png"""
import os, json, colorsys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); RIG = os.path.dirname(HERE)
Q = os.path.join(RIG, 'qa'); RAW = os.path.join(Q, 'raw')
V = json.load(open(os.path.join(RIG, 'validation.json'), encoding='utf-8'))
P = V['poses']; BG = (58, 58, 62); ID = 'W07_shroud_spinner'; LABEL = 'W07 Shroud-Spinner'


def font(sz, bold=False):
    for fn in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(fn, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(name):
    im = Image.open(os.path.join(RAW, name)).convert('RGBA')
    return Image.alpha_composite(Image.new('RGBA', im.size, BG + (255,)), im).convert('RGB')


def over(mesh, bones):
    a = Image.open(os.path.join(RAW, mesh)).convert('RGBA'); b = Image.open(os.path.join(RAW, bones)).convert('RGBA')
    return Image.alpha_composite(Image.alpha_composite(Image.new('RGBA', a.size, BG + (255,)), a), b).convert('RGB')


def sheet(cells, cols, cell, title, sub, out, legend=None):
    rows = (len(cells) + cols - 1) // cols; top = 64 + 24 * len(sub); leg_h = 44 if legend else 0
    S = Image.new('RGB', (cols * cell, top + rows * (cell + 30) + leg_h), (30, 30, 33)); d = ImageDraw.Draw(S)
    d.text((12, 10), title, fill=(255, 225, 120), font=font(26, True))
    for i, t in enumerate(sub):
        d.text((12, 46 + 24 * i), t, fill=(225, 225, 225), font=font(17))
    for k, (im, cap) in enumerate(cells):
        if im is None:
            continue
        im = im.copy(); im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + 30)
        d.text((x0 + 6, y0 + 5), cap, fill=(255, 220, 90), font=font(16, True))
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + 30 + (cell - im.height) // 2))
    if legend:
        x = 12; y = top + rows * (cell + 30) + 10
        for c, t in legend:
            d.rectangle([x, y + 2, x + 22, y + 24], fill=tuple(int(255 * v) for v in c))
            d.text((x + 30, y + 2), t, fill=(230, 230, 230), font=font(17)); x += 44 + int(d.textlength(t, font=font(17)))
    S.save(out); print(out, S.size)


def tag(n):
    m = P[n]; s = f"{m['stretch']}× ({m['bad_edges']} cạnh xấu)"
    if m.get('tip_error_mm_max') is not None:
        s += f", mũi chân lệch {m['tip_error_mm_max']:.1f} mm"
    return s


LEG = [((1.0, 0.85, 0.25), 'cephalothorax'), ((1.0, 0.55, 0.75), 'abdomen_01'), ((0.75, 0.30, 0.95), 'abdomen_02'),
       (colorsys.hsv_to_rgb(0.90, 0.85, 1.0), 'fang'), (colorsys.hsv_to_rgb(0.47, 0.85, 1.0), 'Palp'),
       (colorsys.hsv_to_rgb(0.00, 0.85, 1.0), 'Leg1'), (colorsys.hsv_to_rgb(0.13, 0.85, 1.0), 'Leg2'),
       (colorsys.hsv_to_rgb(0.33, 0.85, 1.0), 'Leg3'), (colorsys.hsv_to_rgb(0.58, 0.85, 1.0), 'Leg4'),
       ((0.55, 0.55, 0.55), 'root/cog/socket')]
A1 = V['A1']; cr = V['control_rig']; m = V['mesh']

# 1 skeleton
cells = [(over(f'skel_{v}.png', f'skel_{v}_bones.png'), c) for v, c in
         (('front', 'Trước'), ('left', 'Bên trái (+X)'), ('back', 'Sau'), ('topdown', 'Trên xuống'))]
sub = [f"Skeleton runtime {V['bones']['runtime']} bone ({V['bones']['deform']} deform), rig điều khiển {V['bones']['control']} ctl_*. "
       f"Cao {V['inputs']['height_m']:.2f} m, scale ×{V['inputs']['scale']:.4f}; mesh rig {m['rig_verts']} đỉnh / {m['rig_tris']} tam giác "
       f"(xoá 2 đoạn chân rời: {m['orphan_tris']} tam giác).",
       f"A1 tự động: {V['A1_summary']} đạt. Rest qua rig điều khiển lệch {cr['rest_runtime_max_dev']:.1e}; pole angle −90° cả 8 chân. "
       f"Bên trái màu đậm, bên phải nhạt; đốt _01→_04 tối dần."]
sheet(cells, 4, 600, f'{LABEL} — skeleton (G2 1/5)', sub, os.path.join(Q, f'{ID}_G2_1_skeleton.png'), LEG)

# 2 weights
cells = [(flat('wcol_front.png'), 'Màu trọng số, trước'), (flat('wcol_left.png'), 'bên'), (flat('wcol_topdown.png'), 'trên'),
         (flat('wcol_three_quarter.png'), '3/4'), (flat('wcol_leg3_close.png'), 'Cận chân 3 trái: háng, gối, vòng khớp'),
         (flat('wcol_roots_below.png'), 'Gốc chân từ dưới: cục gốc chung chân 1+2 theo thân'),
         (flat('wcol_abdomen_cap.png'), 'Chỏm núm tơ: abdomen_02 (tím) ≤ 15°, hết ở 45°')]
w = V['weights']; sk = w['build']
sub = [f"Ảnh hưởng mỗi đỉnh: {w['influences_hist']} (tối đa 2); tổng = 1 (lệch {A1['A1.5']['measured']['max_abs_sum_minus_1']}); "
       f"0 đỉnh trống; 0 trọng số trên root/cog/socket; {w['colocated_groups']} nhóm đỉnh trùng (đường nối UV) cùng trọng số (lệch {w['colocated_weight_diff_max']}).",
       f"Cách tính: gần đoạn xương nhất, chuyển tiếp qua mặt phân giác khớp (nửa rộng háng {sk['leg_bands_m'][0] * 100:.1f} cm, gối "
       f"{sk['leg_bands_m'][1] * 100:.1f}, vòng {sk['leg_bands_m'][2] * 100:.1f}, chân xúc giác {sk['palp_band_m'] * 100:.0f}), Laplace riêng từng khớp qua cạnh < 6 cm; "
       f"cục gốc chân 1+2 cứng theo thân trong {sk['knob_m'][0] * 100:.0f} cm, hết ở {sk['knob_m'][1] * 100:.0f} cm."]
sheet(cells, 4, 520, f'{LABEL} — trọng số (G2 2/5)', sub, os.path.join(Q, f'{ID}_G2_2_weights.png'), LEG)

# 3 locomotion poses
cells = []
cells += [(flat('pose_rest_front.png'), 'Nghỉ (đối chiếu)'), (flat('pose_rest_left.png'), 'nghỉ, bên'),
          (flat('pose_rest_three_quarter.png'), 'nghỉ, 3/4'), (None, '')]
for n, cap in (('gait_A', 'Đi pha A: cam = nhấc (L1 R2 L3 R4), xanh = chống'), ('gait_B', 'Đi pha B: R1 L2 R3 L4 nhấc')):
    cells += [(flat(f'pose_{n}_topdown_hl.png'), cap), (flat(f'pose_{n}_left_hl.png'), 'bên'),
              (flat(f'pose_{n}_three_quarter.png'), '3/4'), (flat(f'pose_{n}_heat.png'), 'giãn: ' + tag(n))]
cells += [(flat('pose_body_low_front.png'), 'Hạ thân sát đất (cog −0,30 m)'), (flat('pose_body_low_left.png'), 'bên'),
          (flat('pose_body_low_three_quarter.png'), '3/4'), (flat('pose_body_low_heat.png'), 'giãn: ' + tag('body_low'))]
cells += [(flat('pose_rear_up_front.png'), 'Chồm, giơ hai chân trước'), (flat('pose_rear_up_left.png'), 'bên'),
          (flat('pose_rear_up_three_quarter.png'), '3/4'), (flat('pose_rear_up_heat.png'), 'giãn: ' + tag('rear_up'))]
sub = ['Tư thế đặt bằng rig điều khiển (control IK mũi chân, ctl_cog); đỏ trên bản đồ giãn = cạnh dài ra / ngắn lại ≥ 1,6×.',
       f"Hạ thân: bàn chân đứng yên (lệch {cr['cog_down_0.30_tip_error_mm_max']} mm), gối chỉ hạ 0,12–0,26 m (nhô 0,04–0,18 m so với thân). Xuyên: chân vào thân "
       f"{P['body_low']['legs_in_ceph']} đỉnh (nghỉ {V['penetration_rest']['legs_in_ceph']}: gốc háng nằm dưới ức), chân vào bụng 0."]
sheet(cells, 4, 470, f'{LABEL} — đi, hạ thân, chồm (G2 3/5)', sub, os.path.join(Q, f'{ID}_G2_3_poses.png'))

# 4 head, turn, abdomen
cells = [(flat('pose_rest_fangs_front.png'), 'Đầu lúc nghỉ'), (flat('pose_fangs_fangs_front.png'), 'Giương nanh + giơ chân xúc giác'),
         (flat('pose_fangs_fangs_fq.png'), 'giương nanh, 3/4'), (flat('pose_fangs_palp_heat.png'), 'đỉnh chân xúc giác: ' + tag('fangs')),
         (flat('pose_turn_L_three_quarter.png'), 'Xoay thân +20°, chân đứng yên'), (flat('pose_turn_L_heat.png'), 'giãn: ' + tag('turn_L')),
         (flat('pose_turn_R_three_quarter.png'), 'Xoay thân −20°'), (flat('pose_turn_R_heat.png'), 'giãn: ' + tag('turn_R')),
         (flat('pose_abdomen_left.png'), 'Bụng ngửa 10°, lắc 10°, núm tơ −12°'), (flat('pose_abdomen_back_heat.png'), 'giãn: ' + tag('abdomen')),
         (flat('pose_abdomen_max_left.png'), 'Mức cực: ngửa 15°, lắc 12°, núm tơ −20°'),
         (flat('pose_abdomen_max_back_heat.png'), 'giãn: ' + tag('abdomen_max'))]
sub = [f"Bụng chồng lên lưng sau đầu ngực ngay từ mesh gốc: nghỉ {P['rest']['abdomen_in_ceph']} đỉnh bụng nằm trong mai, sâu nhất "
       f"{P['rest']['abdomen_in_ceph_depth_mm']} mm; ngửa 10° → {P['abdomen']['abdomen_in_ceph']} đỉnh, {P['abdomen']['abdomen_in_ceph_depth_mm']} mm; "
       f"mức cực → {P['abdomen_max']['abdomen_in_ceph']} đỉnh, {P['abdomen_max']['abdomen_in_ceph_depth_mm']} mm (khuất dưới bụng).",
       'Dải tơ bụng là mặt lớn ít đỉnh (cạnh dài tới 26 cm): uốn núm tơ kéo dải tơ dưới-sau; dùng abdomen_02 ở góc nhỏ (≤ ~12°).']
sheet(cells, 4, 470, f'{LABEL} — nanh, xoay thân, bụng (G2 4/5)', sub, os.path.join(Q, f'{ID}_G2_4_head_turn_abdomen.png'))

# 5 lifts
cells = []
for sd in 'LR':
    for n in range(1, 5):
        k = f'lift_{sd}{n}'
        cells.append((flat(f'pose_{k}_side_hl.png'), f'Nhấc {sd}{n}: {P[k]["stretch"]}× ({P[k]["bad_edges"]})'))
cells += [(flat('pose_lift_L2_hip_heat.png'), 'Khớp háng L2 khi nhấc (đỏ = gập trong)'), (flat('pose_lift_L2_hip_tex.png'), 'cùng chỗ, texture'),
          (flat('pose_lift_L1_hip_heat.png'), 'Khớp háng L1 khi nhấc'), (flat('pose_lift_L1_hip_tex.png'), 'cùng chỗ, texture')]
sub = [f"Mỗi chân nhấc 0,35 m và kéo vào thân 0,18 m bằng control IK; mũi chân theo control lệch 0 mm; chân đang nhấc tô màu theo bone. "
       f"Nhìn từ phía chân đó (trái: +X, phải: −X).",
       'Chỗ giãn nhất: mép trong khớp háng–đùi của chân 2 (cạnh ngắn ~2 mm, dài thêm 4 mm), vòng khớp che bớt.']
sheet(cells, 4, 470, f'{LABEL} — nhấc từng chân (G2 5/5)', sub, os.path.join(Q, f'{ID}_G2_5_lifts.png'),
      [((0.95, 0.6, 0.3), 'đốt _01 háng → _04 bàn: màu bone như tờ 2')])

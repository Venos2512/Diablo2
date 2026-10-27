"""G2 review sheets for U04 (system Python + PIL; run with python -I).

python -I u04_sheets.py
Reads rig/validation.json, rig/_work/poses.json, rig/_work/build.json and rig/qa/raw/*; writes rig/qa/U04_charnel_ghoul_G2_*.png.
"""
import sys, os, site, json
us = site.getusersitepackages()
if us not in sys.path:
    sys.path.append(us)
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); RIG = os.path.dirname(HERE)
Q = os.path.join(RIG, 'qa'); RAW = os.path.join(Q, 'raw'); AID = 'U04_charnel_ghoul'
V = json.load(open(os.path.join(RIG, 'validation.json'), encoding='utf-8'))
P = json.load(open(os.path.join(RIG, '_work', 'poses.json'), encoding='utf-8'))['poses']
B = json.load(open(os.path.join(RIG, '_work', 'build.json'), encoding='utf-8'))
LEG = json.load(open(os.path.join(RAW, 'g2_legend.json'), encoding='utf-8'))
BG = (58, 58, 62)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(path):
    im = Image.open(path).convert('RGBA'); b = Image.new('RGBA', im.size, BG + (255,))
    return Image.alpha_composite(b, im)


def over(name):
    a = flat(os.path.join(RAW, name + '.png')); b = Image.open(os.path.join(RAW, name + '_bones.png')).convert('RGBA')
    return Image.alpha_composite(a, b).convert('RGB')


def raw(name):
    return flat(os.path.join(RAW, name + '.png')).convert('RGB')


def sheet(cells, cols, cell, title, sub, out):
    """cells: [(image, caption, legend or None)]; legend = [(name, rgb01)]."""
    rows = (len(cells) + cols - 1) // cols; top = 66 + 24 * len(sub); cap_h = 30
    S = Image.new('RGB', (cols * cell, top + rows * (cell + cap_h)), (30, 30, 33)); d = ImageDraw.Draw(S)
    d.text((12, 10), title, fill=(255, 225, 120), font=font(26, True))
    for i, line in enumerate(sub):
        d.text((12, 46 + 24 * i), line, fill=(225, 225, 225), font=font(17))
    for k, (im, cap, leg) in enumerate(cells):
        im = im.copy(); im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + cap_h)
        d.text((x0 + 8, y0 + 5), cap, fill=(255, 220, 90), font=font(16, True))
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + cap_h + (cell - im.height) // 2))
        if leg:
            f = font(14); yy = y0 + cap_h + 6
            for n, c in leg:
                d.rectangle([x0 + 8, yy + 2, x0 + 20, yy + 14], fill=tuple(int(255 * v) for v in c))
                d.text((x0 + 25, yy), n, fill=(240, 240, 240), font=f); yy += 18
    S.save(out); print(out, S.size)


ck = V['checks']; sm = V['summary']
# ---------------------------------------------------------------- 1 skeleton + control rig
cells = [(over('g2_skel_front'), 'Trước (X-ray + skeleton runtime)', None), (over('g2_skel_left'), 'Bên trái', None),
         (over('g2_skel_back'), 'Sau', None), (over('g2_skel_topdown'), 'Trên xuống', None),
         (over('g2_skel_head_left'), 'Đầu, cổ 2 đoạn, hàm', None),
         (over('g2_ctl_left'), 'Rig điều khiển: FK xanh, IK + tiếp xúc vàng, pole hồng', None),
         (over('g2_ctl_three_quarter'), 'Rig điều khiển 3/4', None)]
poles = ', '.join(f"{k[4:]} {v['angle_deg']:.2f}°" for k, v in B['poles'].items())
tests = ck['X2_control_rig_functions']['tests']
sub = [f"{B['bones']} bone runtime ({B['deform']} deform, 7 socket, root, cog), rig điều khiển {B['control']} bone ctl_*. Scale ×{B['scale']:.4f}, "
       f"cao {ck['A1.11_height']['height_m']} m (0,65H). A1: {sm['passed']}/{sm['total']} đạt.",
       f"Pole IK (rest không đổi): {poles}. Phép thử rig điều khiển {sum(t['ok'] for t in tests.values())}/{len(tests)} đạt "
       f"(IK tay/chân theo đích, lăn lòng tay/bóng chân giữ đầu ngón, đẩy khuỷu cổ chân sau giữ cổ chân, hạ cog giữ chân tay, công tắc FK, xoắn cẳng tay).",
       "Chân sau 3 đốt (27/10, theo người dùng): Thigh hông → gối (chĩa trước), Calf gối → khuỷu cổ chân sau (chĩa sau), Calf_02 → gót; "
       "IK 2 đốt Thigh–Calf tới khuỷu cổ chân sau, ctl_X_Hock_roll xoay Calf_02 quanh cổ chân.",
       "Trục: X cục bộ = +X thế giới (gập dọc = xoay quanh X), Clavicle Z lên; head từ khớp đầu lên đỉnh sọ như H (cùng P04)."]
sheet(cells, 4, 600, 'U04 Charnel Ghoul — skeleton và rig điều khiển (G2 1/4)', sub, os.path.join(Q, f'{AID}_G2_1_skeleton.png'))

# ---------------------------------------------------------------- 2 weights
cells = [(raw('g2_w_all_front'), 'Trọng số (màu trộn theo bone): trước', None), (raw('g2_w_all_left'), 'bên trái', None),
         (raw('g2_w_all_back'), 'sau', None), (raw('g2_w_all_three_quarter'), '3/4', None)]
CAP = {'headjaw': 'Đầu / hàm / cổ (bên)', 'shoulder': 'Vai trái (bên)', 'shoulder_f': 'Vai trái (trước)', 'torso': 'Thân (bên)',
       'hip': 'Hông và đùi trái (sau)', 'elbow': 'Khuỷu, xoắn tay (bên)', 'hand': 'Bàn tay trái (trên)', 'foot': 'Bàn chân sau trái (bên)',
       'leg': 'Chân sau trái 3 đốt (bên)', 'smock': 'Áo liệm: 6 chuỗi (bên)', 'tie_hood': 'Dây buộc cổ + mũ trùm (3/4)'}
for tag in ('headjaw', 'shoulder', 'shoulder_f', 'torso', 'hip', 'leg', 'elbow', 'hand', 'foot', 'smock', 'tie_hood'):
    cells.append((raw(f'g2_wr_{tag}'), CAP[tag], LEG[tag]))
hb = ck['A1.5_weight_sum']; mi = ck['A1.6_max_4_influences']
sub = [f"Thân: hạt giống theo vùng + giải điều hoà trên mesh hàn ({B['harmonic']['fixed']} đỉnh cố định, {B['harmonic']['free']} đỉnh tự do), "
       f"cột sống theo hàm nón dọc thân; xoắn tay theo tỉ lệ của skill. Tối đa {mi['max_influences']} ảnh hưởng, sai tổng {hb['max_abs_err']:.1e}, 0 đỉnh trống.",
       "Mũ trùm bám da sọ (bỏ hàm); vòng dây + nút cổ đi như một khối, hai đầu dây theo tie_01..02; áo: phần nằm trên lưng bám thân (không bám chi),",
       "vạt treo chuyển dần sang 6 chuỗi 2 bone; răng cứng (6 trên = head, 8 dưới = jaw). Đỉnh trùng vị trí chung trọng số (0 khác)."]
sheet(cells, 4, 520, 'U04 Charnel Ghoul — trọng số (G2 2/4)', sub, os.path.join(Q, f'{AID}_G2_2_weights.png'))


# ---------------------------------------------------------------- 3 + 4 poses
def vn(x, d=2):
    return f'{x:.{d}f}'.replace('.', ',')


def pose_cells(names):
    cells = []
    for n in names:
        q = P[n]
        m = f"giãn {vn(q['stretch'])}× · p99,5 {vn(q['p99'])}×" + (f" · áo lọt {q['smock_inside']}" if q['smock_inside'] else '')
        if 'teeth_gap_m' in q:
            m += f" · răng {q['teeth_gap_m'] * 1000:.0f} mm"
        cells += [(raw(f'pose_{n}_three_quarter'), f'{n} (3/4)', None), (raw(f'pose_{n}_left'), m, None),
                  (raw(f'pose_{n}_heat_three_quarter'), 'độ giãn (đỏ ≥ 1,6×)', None)]
    return cells


main = ['gallop_reach', 'gallop_gather', 'pounce', 'head_up', 'head_down', 'jaw_open', 'jaw_close_50', 'jaw_close_max']
sub = ["Tư thế qua rig điều khiển (FK chi, IK tắt; hàm, đầu, cổ FK). Phi: pha vươn (tay trước 45° + xương đòn đưa trước, chân sau đạp) và pha gom;",
       "vồ: cog nhấc + ngửa, tay vươn 85°, chân duỗi; hàm: rest há ~100°, mở thêm 20°, ngậm 50° và 85° (giới hạn ctl_jaw −85…+25°, răng chạm gần 90°).",
       "Giãn = tỉ số dài cạnh tư thế/rest (lấy chiều lớn hơn) trên mesh thân; áo lọt = số đỉnh áo nằm trong thân thêm so với rest."]
sheet(pose_cells(main), 6, 420, 'U04 Charnel Ghoul — tư thế thử chính (G2 3/4)', sub, os.path.join(Q, f'{AID}_G2_3_poses.png'))
more = ['head_turn', 'twist', 'side_bend', 'arm_forward', 'arm_back', 'elbow_flex', 'leg_forward', 'leg_back', 'knee_flex', 'hock_flex',
        'hock_roll', 'crouch', 'shrug', 'hand_roll', 'heel_lift', 'cloth_swing']
sub = ["Bài thử khớp cực trị: quay đầu 57°, vặn thân 30°, nghiêng 40°, tay đưa trước 85° (chỉ cánh tay), gập khuỷu 110°, đùi trước 60° + khuỷu cổ chân sau 70°,",
       "gập gối 70° (đùi trước 30°), gập khuỷu cổ chân sau 50°, đẩy khuỷu cổ chân sau 20° (Hock_roll, IK), ngồi thụp: hạ cog 14 cm (IK, tay chân đứng yên),",
       "nhún vai 25°, lăn lòng tay 40° và nhấc gót 40° qua control tiếp xúc (IK bật), lắc các chuỗi áo và dây."]
sheet(pose_cells(more), 6, 420, 'U04 Charnel Ghoul — khớp cực trị (G2 4/4)', sub, os.path.join(Q, f'{AID}_G2_4_extremes.png'))

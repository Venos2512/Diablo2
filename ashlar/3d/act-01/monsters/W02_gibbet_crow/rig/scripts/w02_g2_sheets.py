"""W02 G2 review sheets (system Python + PIL, `python -I w02_g2_sheets.py <rig_dir>`).

Reads rig/validation.json, rig/qa/raw/{poses,extra,cu}/poses_metrics.json and the renders of w02_validate.py / w02_pose.py;
writes rig/qa/W02_gibbet_crow_G2_1_skeleton.png .. _G2_5_stretch.png.
"""
import sys, os, json
_US = os.path.join(os.environ.get('APPDATA', ''), 'Python', 'Python%d%d' % sys.version_info[:2], 'site-packages')
if os.path.isdir(_US) and _US not in sys.path:
    sys.path.append(_US)
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

RIG = os.path.abspath(sys.argv[1]); QA = os.path.join(RIG, 'qa'); RAW = os.path.join(QA, 'raw')
AID = 'W02_gibbet_crow'
V = json.load(open(os.path.join(RIG, 'validation.json'), encoding='utf-8'))
M = json.load(open(os.path.join(RAW, 'poses', 'poses_metrics.json'), encoding='utf-8'))
MX = json.load(open(os.path.join(RAW, 'extra', 'poses_metrics.json'), encoding='utf-8'))
BG = (52, 52, 56)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def flat(path, bright=1.0):
    im = Image.open(path).convert('RGBA')
    if bright != 1.0:
        rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(bright)
        im = Image.merge('RGBA', (*rgb.split(), im.split()[3]))
    b = Image.new('RGBA', im.size, BG + (255,))
    return Image.alpha_composite(b, im)


def over(mesh, bones):
    return Image.alpha_composite(flat(mesh, 1.5), Image.open(bones).convert('RGBA')).convert('RGB')


def crop(im, pad=0.05):
    bb = Image.eval(im.convert('L'), lambda v: 255 if abs(v - sum(BG) // 3) > 6 else 0).getbbox()
    if not bb:
        return im
    W, H = im.size; px = int(pad * W)
    return im.crop((max(0, bb[0] - px), max(0, bb[1] - px), min(W, bb[2] + px), min(H, bb[3] + px)))


def sheet(cells, cols, cell, title, sub, out, cap_h=26):
    rows = (len(cells) + cols - 1) // cols; top = 64 + 23 * len(sub)
    S = Image.new('RGB', (cols * cell, top + rows * (cell + cap_h)), (30, 30, 33)); d = ImageDraw.Draw(S)
    d.text((12, 10), title, fill=(255, 225, 120), font=font(26, True))
    for i, line in enumerate(sub):
        d.text((14, 50 + 23 * i), line, fill=(228, 228, 228), font=font(17))
    for k, (im, cap) in enumerate(cells):
        if im is None:
            continue
        im = im.copy(); im.thumbnail((cell - 6, cell - 6))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + cap_h)
        d.text((x0 + 8, y0 + 4), cap, fill=(255, 220, 90), font=font(16, True))
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + cap_h + (cell - im.height) // 2))
    for i in range(8):
        try:
            S.save(out, optimize=True); break
        except OSError:
            import time; time.sleep(0.5 + i)
    print(out, S.size)


def p(*a):
    return os.path.join(RAW, *a)


A1 = V['A1_summary']; b = V['build']
# 1 skeleton
cells = [(crop(over(p(f'xray_{v}.png'), p(f'xray_{v}_bones.png'))), f'X-ray {n}') for v, n in
         (('front', 'trước'), ('left', 'bên trái'), ('back', 'sau'), ('topdown', 'trên xuống'))]
cells += [(over(p('xray_head_left.png'), p('xray_head_left_bones.png')), 'cổ – đầu – mỏ (bên)'),
          (over(p('xray_leg_left.png'), p('xray_leg_left_bones.png')), 'chân: đùi trong thân, gối trong "quần"')]
sub = [f"Skeleton runtime {V['bones']} bone ({V['deform']} deform) + rig điều khiển W02_gibbet_crow_ctl (ctl_*: IK chân, gót, ngón, pole, "
       f"FK cánh/cổ/đuôi, thanh gập cánh, thanh bay, feet_follow_body). A1 {A1['passed']}/{A1['checks']} đạt.",
       "Socket (xám mảnh): ground, hit_origin (chóp mỏ), fx_head, fx_chest, fx_wing_L/R (cổ tay cánh). Rest của rig điều khiển = rest runtime "
       f"(lệch {b['rest_deviation_runtime']:.1e}), IK chân giữ rest (lệch gối < 0,001 mm).",
       "Roll: chân X = trục gập, +X gập thêm; cánh X = pháp tuyến cánh, +X gập (vai→mép sau, khuỷu→mép trước, cổ tay→mép sau); "
       "thân/cổ/đuôi X = +X thế giới (+X cúi; đuôi +X nhấc)."]
sheet(cells, 3, 640, 'W02 Gibbet-Crow — skeleton chồng mesh (G2 1/5)', sub, os.path.join(QA, f'{AID}_G2_1_skeleton.png'))

# 2 weights
cells = [(crop(flat(p(f'wcol_{v}.png'))), f'màu bone trội: {n}') for v, n in
         (('front', 'trước'), ('back', 'sau'), ('left', 'bên'), ('three_quarter', '3/4'))]
for bn, v in (('L_Wing_01', 'front'), ('L_Wing_02', 'front'), ('L_Wing_03', 'front'), ('chest', 'front'), ('neck_02', 'left'),
              ('head', 'left'), ('beak', 'left'), ('pelvis', 'left'), ('L_Thigh', 'left'), ('L_Calf', 'left'), ('L_Foot', 'left'), ('tail_01', 'left')):
    cells.append((crop(flat(p(f'w_{bn}_{v}.png'))), f'{bn} (đỏ = 1)'))
h = b['health']; wf = b.get('wing_field', {}); nf = b.get('neck_field', {})
sub = [f"Health: tối đa {h['max_influences']} ảnh hưởng, chưa chuẩn hoá {h['not_normalised']}, đỉnh trống {h['empty']} "
       f"(6.076 đỉnh; hàn 5.677 đỉnh, {b['weld']['islands']} mảnh). Hàm dưới = mảnh mỏ dưới tách ở khoé ({b['beak_verts']} đỉnh, '{b['beak_rule']}').",
       "Cánh: trường điều hoà (thân |x|<0,07 m = 0, cánh |x|>0,20 m = 1) trộn chest/spine với chuỗi cánh; khuỷu ±0,07 m, cổ tay ±0,08 m. "
       "Cổ: trường điều hoà ngực = 0 → sọ = 1 chia neck_01..03 quanh cả chu vi cổ.",
       f"Thân: tham số dọc chuỗi pelvis–spine_01–chest; \"quần\" lông theo L/R_Thigh, Calf trong khối quần (lùi sau ở hai bên); mảnh rời: "
       f"lông cổ {b['pieces']['ruff']} mảnh cứng theo gốc, lông cánh {b['pieces']['wing_feathers']} mảnh dán theo tấm cánh, đuôi theo chuỗi; "
       f"làm mịn Laplace {16} lượt; tối đa 4, bỏ < 0,01."]
sheet(cells, 4, 470, 'W02 Gibbet-Crow — trọng số (G2 2/5)', sub, os.path.join(QA, f'{AID}_G2_2_weights.png'))


def tag(n, extra=None):
    m = M[n]; s = f"giãn tối đa {m['worst']}×, {m['bad_edges']} cạnh lỗi"
    if extra and extra in MX:
        s += f" (không gập cánh: {MX[extra]['worst']}×, {MX[extra]['bad_edges']})"
    return s


NAMES = {'rest': 'nghỉ (dáng trưng của GLB)', 'fold': 'gập cánh như concept (ctl_*_Wing_fold = 1)', 'fold_tight': 'gập sát thân (FK)',
         'display': 'xoè doạ: cánh nâng + chìa trước, đuôi nhấc, há mỏ', 'peck': 'mổ: thân chồm 25°, cổ + đầu cúi, há mỏ 25°',
         'head_turn': 'xoay cổ + đầu 60°', 'beak_open': 'há mỏ 30°', 'step': 'bước: chân trái lên trước 13 cm', 'crouch': 'nhún bật: thân hạ 9 cm',
         'tail_up': 'nhấc đuôi 37°', 'flap_up': 'vỗ lên hết biên (mặt cánh đứng)', 'flap_down': 'vỗ xuống hết biên (mặt cánh đứng)',
         'fly_up': 'bay, vỗ lên: cánh xoay ngang (ctl_*_Wing_flight), thu chân', 'fly_down': 'bay, vỗ xuống, thu chân'}
# 3 ground poses
cells = []
for n in ('rest', 'fold', 'fold_tight', 'display', 'peck', 'head_turn', 'beak_open', 'step', 'crouch', 'tail_up'):
    ex = {'peck': 'peck_nofold', 'head_turn': 'head_turn_nofold', 'beak_open': 'beak_open_nofold', 'step': 'step_nofold',
          'crouch': 'crouch_nofold', 'tail_up': 'tail_up_nofold'}.get(n)
    cells.append((crop(flat(p('poses', f'{n}_front.png'), 1.5)), NAMES[n]))
    cells.append((crop(flat(p('poses', f'{n}_left.png'), 1.5)), tag(n)))
    cap3 = '3/4' + (f" · không gập cánh: {MX[ex]['worst']}×, {MX[ex]['bad_edges']} cạnh" if ex and ex in MX else '')
    cells.append((crop(flat(p('poses', f'{n}_three_quarter.png'), 1.5)), cap3))
sub = ['Tư thế trên đất. Các dáng sau "gập cánh" đều giữ thanh gập = 1 (dáng đứng của idle/walk), nên số đo gồm cả nếp cổ tay cánh của dáng gập '
       f"({M['fold']['worst']}×, {M['fold']['bad_edges']} cạnh); số trong ngoặc là cùng tư thế khi cánh không gập.",
       'Độ giãn = tỉ lệ dài cạnh (cạnh ≥ 3 mm) so với rest, max(q, 1/q); "cạnh lỗi" = cạnh dài hơn 1,6× hoặc ngắn hơn 0,5×. '
       'Mức tham chiếu rig người đã duyệt: U01 hạ tay 4,3×, đi 3,6×.']
sheet(cells, 6, 400, 'W02 Gibbet-Crow — tư thế thử trên đất (G2 3/5)', sub, os.path.join(QA, f'{AID}_G2_3_poses_ground.png'))
# 4 wings / flight
cells = []
for n in ('flap_up', 'flap_down', 'fly_up', 'fly_down'):
    cells.append((crop(flat(p('poses', f'{n}_front.png'), 1.5)), NAMES[n]))
    cells.append((crop(flat(p('poses', f'{n}_left.png'), 1.5)), tag(n)))
    cells.append((crop(flat(p('poses', f'{n}_three_quarter.png'), 1.5)), '3/4'))
    cells.append((crop(flat(p('poses', f'{n}_top.png'), 1.5)), 'trên (camera chéo)'))
cells.append((crop(flat(p('cu', 'cu_beak_rest_left.png'), 1.4)), 'mỏ khép (cận cảnh)'))
cells.append((crop(flat(p('cu', 'cu_beak_open_left.png'), 1.4)), 'mỏ há 30° (cận cảnh)'))
cells.append((crop(flat(p('cu', 'cu_head_turn_front.png'), 1.4)), 'quay đầu 60°, lông cổ'))
cells.append((crop(flat(p('cu', 'cu_step_legs_three_quarter.png'), 1.4)), 'bước: "quần" lông + giò'))
ts = MX.get('flight_tuck_strong', {}); tw = MX.get('wing_twist90_only', {})
sub = [f"Bay: thanh ctl_*_Wing_flight xoay mặt cánh 90° quanh trục cánh ở vai (lông kéo ra sau); chỉ xoay cánh: {tw.get('worst')}×, "
       f"{tw.get('bad_edges')} cạnh (gốc cánh dính sườn chịu được). Vỗ = FK quanh Z sau khi xoay (+Z xuống, −Z lên).",
       f"Thu chân khi bay: dời IK chân 6 cm ra sau, 5 cm lên (feet_follow_body = 1, thân nâng 25 cm). Thu mạnh 10 cm/10 cm rách mép sau \"quần\": "
       f"{ts.get('worst')}×, {ts.get('bad_edges')} cạnh (khuyết điểm còn lại)."]
sheet(cells, 4, 470, 'W02 Gibbet-Crow — vỗ cánh, bay, mỏ (G2 4/5)', sub, os.path.join(QA, f'{AID}_G2_4_wings_flight.png'))
# 5 stretch heat
cells = []
for n in ('fold', 'fold_tight', 'peck', 'head_turn', 'crouch', 'fly_down'):
    for v in ('front', 'left', 'three_quarter'):
        cells.append((crop(flat(p('poses', f'{n}_heat_{v}.png'))), f'{n} {v}' + (f": {M[n]['worst']}×" if v == 'front' else '')))
sub = ['Bản đồ giãn: xám = như rest, đỏ = cạnh giãn/co tới 2× trở lên. Chỗ đỏ chính: nếp cổ tay cánh khi gập (tấm cánh liền một mảnh), '
       'mép sau – trong "quần" khi nhún sâu, gáy sát gốc cánh khi quay đầu 60°.']
sheet(cells, 6, 360, 'W02 Gibbet-Crow — bản đồ độ giãn (G2 5/5)', sub, os.path.join(QA, f'{AID}_G2_5_stretch.png'))

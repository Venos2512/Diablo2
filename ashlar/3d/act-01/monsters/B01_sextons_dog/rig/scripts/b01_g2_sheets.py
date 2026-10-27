"""G2 sheets from a full QA run (python -I):  python -I b01_g2_sheets.py <tag>

rig/qa/B01_sextons_dog_G2_1_skeleton.png  runtime skeleton over the mesh (4 views + close-ups) and the control rig
rig/qa/B01_sextons_dog_G2_2_weights.png   dominant bone, influence count, single-bone weights
rig/qa/B01_sextons_dog_G2_3_poses.png     Q test poses (3 views + stretch heat), with numbers
rig/qa/B01_sextons_dog_G2_4_poses.png     (second half of the poses)
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_img as I
import b01_common as C
import compose
from PIL import Image, ImageDraw

TAG = sys.argv[1]
D = os.path.join(C.WORK, f'qa_{TAG}')
Q = json.load(open(os.path.join(C.WORK, f'qa_{TAG}.json')))
B = json.load(open(os.path.join(C.WORK, 'build.json')))
V = json.load(open(os.path.join(C.RIG, 'validation.json'), encoding='utf-8')) if os.path.isfile(os.path.join(C.RIG, 'validation.json')) else None
p = lambda n: os.path.join(D, n)


def vn(x, nd=2):
    return f'{x:.{nd}f}'.replace('.', ',')


# ---------------------------------------------------------------- 1. skeleton
L = json.load(open(p('skel_labels.json')))
FRONT_LEG = {'L_Scapula', 'L_UpperArm', 'L_ForeArm', 'L_Hand', 'L_Finger'}
HIND_LEG = {'L_Thigh', 'L_Calf', 'L_Foot', 'L_Toe'}
SHOW = {'left': None, 'front': {'head', 'jaw', 'L_ear', 'collar_ring'} | FRONT_LEG,
        'back': {'pelvis', 'tail_01', 'tail_03'} | HIND_LEG,
        'top': {'head', 'jaw', 'L_ear', 'neck_01', 'neck_02', 'chest', 'spine_02', 'spine_01', 'pelvis', 'cog', 'tail_02',
                'L_UpperArm', 'L_ForeArm', 'L_Finger'} | HIND_LEG,
        'head_left': {'head', 'jaw', 'L_ear', 'neck_02', 'neck_01', 'collar', 'collar_ring', 'fx_head', 'fx_mouth', 'hit_origin'},
        'fleg_left': FRONT_LEG | {'chest', 'neck_01'}, 'hleg_left': HIND_LEG | {'pelvis', 'spine_01', 'tail_01'},
        'tail_back': {'tail_01', 'tail_02', 'tail_03', 'tail_04', 'pelvis'} | HIND_LEG}
out = {}
for t, names in SHOW.items():
    names = names or {n for n in L[t] if n not in ('root', 'ground')}
    o = p(f'lab_{t}.png')
    I.labelled(p(f'skel_{t}.png'), p(f'skel_{t}_bones.png'), o, L[t], names, fsize=17 if t in ('left', 'front', 'back', 'top') else 19)
    if t in ('left', 'front', 'back', 'top'):
        I.autocrop(o, margin=30)
    out[t] = o
CL = json.load(open(p('ctl_labels.json')))
for v in ('left', 'front'):
    names = {n for n in CL[v] if not n.startswith('ctl_R_')} if v == 'left' else {n for n in CL[v] if '_L_' in n or n in ('ctl_body',)}
    o = p(f'lab_ctl_{v}.png')
    I.labelled(p(f'ctl_{v}.png'), p(f'ctl_{v}_bones.png'), o, CL[v], names, fsize=16, skip_r=False)
    I.autocrop(o, margin=30); out[f'ctl_{v}'] = o
n_rt, n_ctl = B['n_runtime'], B['n_control']
poles = B['poles']
lines = [f"Runtime B01_runtime: {n_rt} bone (34 deform, 7 không trọng số: root, cog, ground, hit_origin, fx_head, fx_mouth, fx_chest). "
         f"Rig điều khiển B01_control: {n_ctl} bone ctl_* (FK mọi bone, IK 4 chân + pole, control đệm bàn, roll, ngón; công tắc ik_arm_L/R, ik_leg_L/R).",
         f"Góc pole quét: trước L {vn(poles['ctl_L_ForeArm']['angle_deg'], 2)}°, R {vn(poles['ctl_R_ForeArm']['angle_deg'], 2)}°; sau L "
         f"{vn(poles['ctl_L_Calf']['angle_deg'], 2)}°, R {vn(poles['ctl_R_Calf']['angle_deg'], 2)}°; bật IK ở rest lệch tối đa "
         f"{vn(1000 * max(v['rest_err_m'] for v in poles.values()), 3)} mm. Runtime bám control bằng Copy Transforms (rest trùng tuyệt đối).",
         'Chỉ ghi tên bên L (bên R là gương). Ảnh dưới: rig điều khiển (control đệm bàn trên sàn, roll ở khớp bóng, pole sau khuỷu / trước gối).']
I.rows_sheet(os.path.join(C.QA, 'B01_sextons_dog_G2_1_skeleton.png'),
             [[(out['left'], 'X-ray bên trái')], [(out['front'], 'X-ray trước'), (out['back'], 'X-ray sau'), (out['top'], 'X-ray trên')],
              [(out['head_left'], 'đầu–cổ, vòng cổ, socket'), (out['fleg_left'], 'chân trước'), (out['hleg_left'], 'chân sau'),
               (out['tail_back'], 'đuôi, sau')],
              [(out['ctl_left'], 'rig điều khiển, bên'), (out['ctl_front'], 'rig điều khiển, trước')]],
             'B01 Sexton\'s Dog — skeleton và rig điều khiển (G2 1/4)', lines, width=2400)

# ---------------------------------------------------------------- 2. weights
sk = B['skin']
items = [(p('wdom_left.png'), 'xương trội — bên'), (p('wdom_front.png'), 'trước'), (p('wdom_back.png'), 'sau'),
         (p('wdom_three_quarter.png'), '3/4'), (p('wdom_below.png'), 'dưới bụng'), (p('wdom_head_left.png'), 'đầu, bên'),
         (p('wdom_head_front.png'), 'đầu, trước'), (p('winf_left.png'), 'số ảnh hưởng (xanh 1, lục 2, vàng 3, đỏ 4)')]
tmp = os.path.join(D, '_w1.png')
I.legend_sheet(tmp, items, p('wdom_colors.json'), 'B01 Sexton\'s Dog — trọng số (G2 2/4)', cols=4, cell=600,
               lines=[f"Skin: nhãn theo khoảng cách chuẩn hoá có cổng vùng + mặt nạ (tai {sk['masks']['ear']}, hàm {sk['masks']['jaw']}, "
                      f"đuôi {sk['masks']['tail']} đỉnh), trộn theo khoảng cách trắc địa tới ranh (50/50 tại ranh), phần cứng một xương "
                      f"(vòng cổ + đinh {sk['masks']['collar']}, xích + vòng {sk['masks']['ring']} đỉnh).",
                      f"Ảnh hưởng mỗi đỉnh: 1: {sk['influences']['1']}, 2: {sk['influences']['2']}, 3: {sk['influences']['3']}, "
                      f"4: {sk['influences']['4']} (tối đa 4, tổng 1). Không dùng Automatic Weights."])
singles = ['L_Scapula', 'L_UpperArm', 'L_ForeArm', 'L_Thigh', 'L_Calf', 'pelvis', 'spine_02', 'chest', 'neck_01', 'neck_02',
           'head', 'jaw', 'L_ear', 'tail_01']
tmp2 = os.path.join(D, '_w2.png')
I.titled_sheet(tmp2, 7, 340, [(p(f'wone_{b}.png'), b) for b in singles], 'Trọng số từng xương (xanh 0 → đỏ 1)')
A = Image.open(tmp); Bm = Image.open(tmp2)
S = Image.new('RGB', (max(A.width, Bm.width), A.height + Bm.height), (28, 28, 31)); S.paste(A, (0, 0)); S.paste(Bm, (0, A.height))
S.save(os.path.join(C.QA, 'B01_sextons_dog_G2_2_weights.png')); print('weights', S.size)

# ---------------------------------------------------------------- 3/4. poses
VI = {'step_diag': ('left', 'front', 'three_quarter'), 'sit': ('left', 'three_quarter', 'back'),
      'sniff': ('left', 'front', 'three_quarter'), 'look_back': ('top_q', 'front', 'three_quarter'),
      'tail_wag': ('back', 'left', 'top_q'), 'jaw_open': ('head_l', 'head_f', 'three_quarter'),
      'reach_front': ('left', 'front', 'three_quarter'), 'kick_back': ('left', 'back', 'three_quarter'),
      'bend_side': ('top_q', 'front', 'three_quarter'), 'arch': ('left', 'front', 'three_quarter'),
      'pounce': ('left', 'front', 'three_quarter'), 'ears_ring': ('head_f', 'head_l', 'three_quarter')}
VN = {'step_diag': 'bước chéo', 'sit': 'ngồi', 'sniff': 'cúi ngửi đất', 'look_back': 'ngoái đầu', 'tail_wag': 'vẫy đuôi',
      'jaw_open': 'há hàm 15°', 'reach_front': 'vươn chân trước', 'kick_back': 'duỗi chân sau', 'bend_side': 'uốn thân',
      'arch': 'cong lưng', 'pounce': 'vồ', 'ears_ring': 'tai + xích lắc'}


def pose_rows(names):
    rows = []
    for n in names:
        r = Q['poses'][n]
        cap = (f"{VN[n]}: giãn {vn(r['stretch'], 1)}× ({r['bad_edges']} cạnh > 1,6×), Δ tối đa {int(round(r['max_dlen_mm']))} mm, "
               f"chạm đất {'đạt' if r['contact_ok'] else 'không'}")
        row = []
        for k, v in enumerate(VI[n]):
            f = p(f'pose_{n}_{v}.png')
            if os.path.isfile(f):
                row.append((f, cap if k == 0 else v))
        hv = VI[n][0]
        f = p(f'pose_{n}_{hv}_heat.png')
        if os.path.isfile(f):
            row.append((f, 'độ giãn (đỏ ≥ 1,6×)'))
        rows.append(row)
    return rows


def flatten(rows, out, title, lines):
    from PIL import Image as Im
    cell = 520; cols = 4
    items = [it for r in rows for it in (r + [(None, '')] * (cols - len(r)))]
    top = 46 + 22 * len(lines); nrow = len(rows)
    S = Im.new('RGB', (cols * cell, top + nrow * (cell + 26)), (28, 28, 31)); d = ImageDraw.Draw(S)
    d.text((10, 8), title, fill=(255, 220, 90), font=compose.font(26))
    for i, t in enumerate(lines):
        d.text((10, 44 + 22 * i), t, fill=(225, 225, 225), font=compose.font(16))
    for k, (f, cap) in enumerate(items):
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + 26)
        if f:
            im = I.compose.flat(Im.open(f)) if hasattr(I, 'compose') else Im.open(f).convert('RGB')
            im.thumbnail((cell, cell)); S.paste(im, (x0 + (cell - im.width) // 2, y0 + 26 + (cell - im.height) // 2))
        d.text((x0 + 6, y0 + 4), cap, fill=(255, 220, 90), font=compose.font(15))
    S.save(out); print(out, S.size)


names = [n for n in VI]
common = ['Tư thế dựng bằng rig điều khiển (IK 4 chân, control đệm bàn, roll); chỉ để QA, không phải clip. Độ giãn = tỉ lệ dài cạnh lúc '
          'tạo dáng / rest (cạnh ≥ 4 mm, lấy max(q, 1/q)); Δ = thay đổi độ dài cạnh tuyệt đối.',
          f"Vòng cổ: số mẫu đỉnh vòng cổ nằm trong thân so với rest ({Q['rest_collar_inside']} mẫu ở rest). Chạm đất: chân đứng có đáy "
          '0 ± 10 mm, không chân nào lún quá 10 mm.']
flatten(pose_rows(names[:6]), os.path.join(C.QA, 'B01_sextons_dog_G2_3_poses.png'), 'B01 Sexton\'s Dog — tư thế thử (G2 3/4)', common)
flatten(pose_rows(names[6:]), os.path.join(C.QA, 'B01_sextons_dog_G2_4_poses.png'), 'B01 Sexton\'s Dog — tư thế thử (G2 4/4)', common)

"""G1 proposal sheets: labelled joint-over-mesh views -> rig/qa/B01_sextons_dog_G1_joints.png and
B01_sextons_dog_G1_closeups.png (python -I; inputs from b01_r1_proposal.py in rig/_work/)."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import b01_img as I            # adds the user site for PIL
import b01_common as C

W = C.WORK
L = json.load(open(os.path.join(W, 'prop_labels.json')))
chk = json.load(open(os.path.join(W, 'prop_checks.json')))
SIDE_HIDE = {'root', 'ground'}
FRONT_LEG = {'L_Scapula', 'L_UpperArm', 'L_ForeArm', 'L_Hand', 'L_Finger'}
HIND_LEG = {'L_Thigh', 'L_Calf', 'L_Foot', 'L_Toe'}
SHOW = {   # label sets where the X-ray stacks bones on top of each other
    'front': {'head', 'jaw', 'L_ear', 'collar_ring'} | FRONT_LEG,
    'back': {'pelvis', 'tail_01', 'tail_03'} | HIND_LEG,
    'top': {'head', 'jaw', 'L_ear', 'neck_01', 'neck_02', 'chest', 'spine_02', 'spine_01', 'pelvis', 'cog', 'tail_02',
            'L_UpperArm', 'L_ForeArm', 'L_Finger'} | HIND_LEG,
    'head_front': {'head', 'jaw', 'L_ear', 'collar', 'collar_ring', 'L_Scapula', 'neck_02'},
    'fleg_front': FRONT_LEG | {'collar_ring'},
    'hleg_back': HIND_LEG | {'pelvis', 'tail_01', 'tail_02'},
}
CAP = {'left': 'bên trái (X-ray)', 'front': 'trước (X-ray)', 'back': 'sau (X-ray)', 'top': 'trên, đầu hướng lên (X-ray)',
       'head_left': 'đầu–cổ, bên', 'head_front': 'đầu–cổ, trước', 'fleg_left': 'chân trước trái, bên',
       'hleg_left': 'chân sau trái, bên', 'fleg_front': 'chân trước, trước', 'hleg_back': 'chân sau, sau'}
P = {}
for tag in CAP:
    names = SHOW.get(tag, {n for n in L[tag] if n not in SIDE_HIDE})
    out = os.path.join(W, f'lab_{tag}.png')
    I.labelled(os.path.join(W, f'prop_{tag}.png'), os.path.join(W, f'prop_{tag}_bones.png'), out, L[tag], names,
               fsize=17 if tag in ('left', 'front', 'top', 'back') else 19)
    if tag in ('left', 'front', 'top', 'back'):
        I.autocrop(out, margin=30)
    P[tag] = out


def vn(x, nd=1):
    return f'{x:.{nd}f}'.replace('.', ',')


info = chk['info']; sym = chk['symmetry']
lines = [f"Họ Q, {chk['n_bones']} bone runtime ({chk['n_deform']} deform, {chk['n_bones'] - chk['n_deform']} không trọng số: root, cog, "
         f"ground, hit_origin, fx_head, fx_mouth, fx_chest). Mesh scale đều ×{vn(info['scale'], 4)}: dài {vn(info['length_m'], 2)} m "
         f"(1,2H, mũi→chóp đuôi), cao {vn(info['height_m'], 3)} m (tính lông vai). Mặt hướng −Y, trái = +X.",
         f"Mesh đối xứng trái/phải (lệch trung bình {vn(sym['mean_mm'], 2)} mm, p99 {vn(sym['p99_mm'])} mm; lệch lớn nhất "
         f"{vn(sym['max_mm'])} mm ở xích và vòng đồng). Đầu khớp deform nằm trong mesh: "
         f"{chk['n_deform'] - len(chk['deform_heads_outside'])}/{chk['n_deform']} (ngoài: {', '.join(chk['deform_heads_outside']) or 'không'}"
         f"{', đầu xích mảnh, cách mặt 3 mm' if 'collar_ring' in chk['deform_heads_outside'] else ''}).",
         'Chỉ ghi tên bên L; bên R là gương qua x = 0. Mỗi bone một màu; chấm trắng = đầu khớp. Khớp đọc từ mặt cắt phẳng của mesh '
         '(rig/landmarks.json).']
I.rows_sheet(os.path.join(C.QA, 'B01_sextons_dog_G1_joints.png'),
             [[(P['left'], CAP['left'])], [(P['front'], CAP['front']), (P['back'], CAP['back']), (P['top'], CAP['top'])]],
             'B01 Sexton\'s Dog — khớp đề xuất (G1, 1/2)', lines, width=2400)
I.titled_sheet(os.path.join(C.QA, 'B01_sextons_dog_G1_closeups.png'), 3, 700,
               [(P[t], CAP[t]) for t in ('head_left', 'head_front', 'fleg_left', 'hleg_left', 'fleg_front', 'hleg_back')],
               'B01 Sexton\'s Dog — khớp đề xuất, cận cảnh (G1, 2/2)',
               ['Texture X-ray 55 %. jaw: khớp hàm dưới gốc tai → cằm (miệng của mesh kín, không có khe môi). Tai: một bone mỗi bên. '
                'collar: cứng. collar_ring: xích hai mắt + vòng đồng, một bone lắc.'])

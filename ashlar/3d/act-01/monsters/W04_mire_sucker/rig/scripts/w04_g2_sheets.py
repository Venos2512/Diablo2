"""G2 review sheets for W04 (system Python 3.11 + PIL, run with -I): rig/qa/W04_mire_sucker_G2_1..5_*.png from rig/qa/raw/
(renders of w04_q1_qa.py) and the numbers in rig/_work/q1_poses.json.  python -I w04_g2_sheets.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import w04_sheet as SH

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE)
RAW = os.path.join(RIG, 'qa', 'raw')
QA = os.path.join(RIG, 'qa')
P = json.load(open(os.path.join(RIG, '_work', 'q1_poses.json'), encoding='utf-8'))
LAB = os.path.join(RAW, 'labels.json')


def f(x):
    return f'{x:.2f}'.replace('.', ',')


def cap(pose, label):
    r = P[pose]
    pen = sum(v['new'] for v in r['penetration'].values())
    return f"{label}\ngiãn {f(r['stretch']['max'])}× · {r['stretch']['bad_edges']} cạnh xấu · xuyên mới {pen}"


def raw(name):
    return os.path.join(RAW, name)


def write(spec, name):
    path = os.path.join(QA, '_spec_' + name + '.json')
    json.dump(spec, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
    SH.main(path)
    os.remove(path)


TITLE = 'W04 Mire-Sucker - G2'
# 1. skeleton
L1 = ['head', 'thorax', 'proboscis_02', 'abdomen_01', 'L_abdomen_02', 'L_abdomen_03', 'L_WingF_01', 'L_WingF_02', 'L_WingB_02',
      'L_Leg1_01', 'L_Leg1_02', 'L_Leg1_03', 'L_Leg1_04', 'L_Leg3_02', 'L_Leg3_03', 'L_Leg3_04']
panels = []
for v, cp, labels in (('front', 'TRƯỚC', ['head', 'proboscis_02', 'L_WingF_02', 'L_WingB_02', 'L_Leg1_03', 'L_Leg1_04', 'L_Leg3_03', 'L_abdomen_03']),
                      ('left', 'BÊN TRÁI (đầu bên trái ảnh)', L1), ('back', 'SAU', ['L_abdomen_02', 'R_abdomen_03', 'abdomen_01', 'L_Leg3_03', 'L_WingF_02']),
                      ('top', 'TRÊN', ['head', 'thorax', 'abdomen_01', 'L_WingF_01', 'L_WingF_02', 'L_WingB_02', 'L_Leg1_02', 'L_Leg3_03'])):
    panels.append(dict(mesh=raw(f'skel_{v}_mesh.png'), bones=raw(f'skel_{v}_bones.png'), caption=cp, label_json=LAB, labels=labels))
write(dict(out=os.path.join(QA, 'W04_mire_sucker_G2_1_skeleton.png'), cols=4, cell=700, title=TITLE + ': skeleton runtime chồng mesh X-ray (rest)',
           subtitle='41 bone: 34 deform (màu theo bộ phận, bên phải lệch màu) + root, cog + 5 socket (xám). Rig điều khiển 51 bone ctl_* nằm riêng trong .blend.',
           panels=panels), '1')
# 2. weights
panels = [dict(mesh=raw(f'w_dom_{v}.png'), caption=f'màu trộn theo trọng số · {c}') for v, c in
          (('front', 'trước'), ('left', 'bên trái'), ('back', 'sau'), ('top', 'trên'), ('bottom', 'dưới'))]
for bone, v, c in (('L_WingF_01', 'front', 'gốc cánh: L_WingF_01'), ('L_WingB_01', 'left', 'lá dưới: L_WingB_01'),
                   ('L_Leg1_02', 'front', 'đùi chân trước: L_Leg1_02'), ('L_Leg1_01', 'bottom', 'háng chân trước (dưới): L_Leg1_01'),
                   ('L_Leg3_01', 'bottom', 'háng chân sau (dưới): L_Leg3_01'), ('abdomen_01', 'left', 'gốc bụng + tấm lưng sau: abdomen_01'),
                   ('L_abdomen_02', 'back', 'túi trái: L_abdomen_02 (khe giữa trộn)'), ('head', 'left', 'đầu: head'),
                   ('proboscis_01', 'left', 'gốc vòi: proboscis_01')):
    panels.append(dict(mesh=raw(f'w_heat_{bone}_{v}.png'), caption=c))
write(dict(out=os.path.join(QA, 'W04_mire_sucker_G2_2_weights.png'), cols=5, cell=560, title=TITLE + ': trọng số',
           subtitle='Hàng 1: màu bone trội trộn theo trọng số. Còn lại: trọng số một bone (đỏ = 1, xanh tối = 0, vàng = vùng chuyển tiếp). Tối đa 4 ảnh hưởng, tổng = 1.',
           panels=panels), '2')
# 3. wings
W = [('wings_spread', 'front', 'dang ngang'), ('wings_spread', 'top', 'dang ngang (trên)'), ('wings_pitch', 'front', 'dang + vặn lá 75°'),
     ('wings_up', 'front', 'vỗ lên (+45° từ dang)'), ('wings_down_60', 'front', 'vỗ xuống −60°'), ('wings_down', 'front', 'vỗ xuống −75°'),
     ('wings_twist', 'front', 'vặn lá ±25°'), ('wings_fold', 'top', 'gập dọc thân'), ('wings_fan', 'left', 'xoè lá dưới −20°, lá trên +10°')]
panels = [dict(mesh=raw(f'pose_{p}_{v}.png'), caption=cap(p, c)) for p, v, c in W]
panels += [dict(mesh=raw('pose_wings_spread_front_heat.png'), caption='dang: bản đồ giãn (xám ổn → đỏ ≥ 1,6×)'),
           dict(mesh=raw('pose_wings_spread_cu_root_front.png'), caption='cận gốc cánh khi dang (trước)'),
           dict(mesh=raw('pose_wings_spread_cu_root_top.png'), caption='cận gốc cánh khi dang (trên): gốc luồn dưới tấm vai'),
           dict(mesh=raw('pose_wings_pitch_cu_root_tq.png'), caption='cận gốc cánh khi vặn lá 75°'),
           dict(mesh=raw('pose_wings_down_cu_root_front.png'), caption='cận gốc cánh khi vỗ xuống −75°'),
           dict(mesh=raw('pose_wings_fold_cu_root_top.png'), caption='cận gốc cánh khi gập')]
write(dict(out=os.path.join(QA, 'W04_mire_sucker_G2_3_wings.png'), cols=5, cell=560, title=TITLE + ': cánh (ctl_L/R_Wing + FK lá)',
           subtitle='"xuyên mới" = đỉnh lá cánh nằm sau mặt ngực > 2 mm, không có ở rest; ở cánh là gốc sống cánh luồn dưới tấm vai (khuất). Lá dưới là mảnh rời nên xoè không xé.',
           panels=panels), '3')
# 4. legs, body, proboscis
B = [('lift_L1', 'front', 'nhấc chân trước trái 12 cm'), ('lift_L1', 'left', 'nhấc chân trước trái (bên)'), ('lift_R3', 'front', 'nhấc chân sau phải 12 cm'),
     ('lift_L3', 'left', 'nhấc chân sau trái (bên)'), ('step_L1_fwd', 'left', 'bước chân trước ra trước 15 cm'), ('step_L3_back', 'left', 'đưa chân sau ra sau 12 cm'),
     ('body_down', 'front', 'hạ thân 15 cm, chân đứng yên'), ('body_down', 'left', 'hạ thân 15 cm (bên)'), ('body_roll', 'front', 'nghiêng thân 12°'),
     ('stab', 'left', 'đâm vòi: lao 8 cm, chúi 10°, cúi đầu 12°'), ('suck_pin', 'left', 'ghim vòi bằng IK, thân hạ 6 cm + chúi 8°')]
panels = [dict(mesh=raw(f'pose_{p}_{v}.png'), caption=cap(p, c)) for p, v, c in B]
panels += [dict(mesh=raw('pose_body_down_front_heat.png'), caption='hạ thân: bản đồ giãn'), dict(mesh=raw('pose_body_down_cu_coxa.png'), caption='cận háng chân trước khi hạ thân'),
           dict(mesh=raw('pose_lift_L1_cu_coxa.png'), caption='cận háng khi nhấc chân trước'), dict(mesh=raw('pose_suck_pin_cu_proboscis.png'), caption='cận vòi khi ghim (mũi đứng yên)')]
write(dict(out=os.path.join(QA, 'W04_mire_sucker_G2_4_legs_body.png'), cols=5, cell=560, title=TITLE + ': chân (IK), thân, vòi',
           subtitle='Bàn chân IK đứng yên khi hạ thân (trượt 0,01 mm). Chân sau duỗi 98 % ở rest: nâng thân quá ~1–2 cm thì phải nhấc bàn chân sau theo.',
           panels=panels), '4')
# 5. abdomen, head
A = [('lobes_sway', 'back', 'lắc cả bụng sang bên 14°'), ('lobes_opposite_8', 'front', 'hai túi ngược chiều ±8°'), ('lobes_opposite', 'back', 'hai túi ngược chiều ±15°'),
     ('lobes_down', 'left', 'hai túi hạ 18°'), ('abdomen_up', 'left', 'nâng bụng 15°'), ('abdomen_down_8', 'left', 'hạ bụng 8°'), ('abdomen_down', 'left', 'hạ bụng 15°'),
     ('head_down', 'left', 'cúi đầu 20°'), ('head_up', 'left', 'ngửa đầu 20°'), ('head_turn', 'top', 'quay đầu 25°')]
panels = [dict(mesh=raw(f'pose_{p}_{v}.png'), caption=cap(p, c)) for p, v, c in A]
panels += [dict(mesh=raw('pose_lobes_opposite_cu_cleft.png'), caption='cận khe giữa hai túi (±15°)'), dict(mesh=raw('pose_abdomen_up_cu_plates.png'), caption='cận tấm lưng khi nâng bụng'),
           dict(mesh=raw('pose_abdomen_down_cu_hind.png'), caption='cận chân sau khi hạ bụng 15°: ống chân lọt vào túi'),
           dict(mesh=raw('pose_abdomen_down_8_cu_hind.png'), caption='cận chân sau khi hạ bụng 8°'), dict(mesh=raw('pose_head_turn_cu_neck.png'), caption='cận cổ khi quay đầu')]
write(dict(out=os.path.join(QA, 'W04_mire_sucker_G2_5_abdomen_head.png'), cols=5, cell=560, title=TITLE + ': bụng, túi máu, đầu',
           subtitle='Tấm lưng phủ trên bụng theo abdomen_01 (như đốt lưng), tấm phía trước trộn dần với ngực. Hai túi dính nhau ở khe: trộn trái/phải 7–9 cm. Hạ bụng quá ~8° thì túi đè lên ống chân sau.',
           panels=panels), '5')
print('G2_SHEETS_DONE')

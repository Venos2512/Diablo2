"""P04 Hive-Sleeper, R5: compose the G2 sheets from rig/qa/raw (python -I p21_sheets.py).

G2_1 skeleton + control rig, G2_2 weights (overall + groups with legends), G2_3 test poses (texture, 3/4), G2_4 close-ups of
the hard regions (texture + edge-stretch heat). Captions carry the numbers of rig/validation.json.
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pyimg                                    # adds the user site (PIL) and rig_v1 tools (compose)
from pyimg import compose, Image, ImageDraw

RIG = r'D:/Claude/Diablo2/ashlar/3d/act-01/monsters/P04_hive_sleeper/rig'
RAW = RIG + '/qa/raw'; QA = RIG + '/qa'
val = json.load(open(RIG + '/validation.json'))
P = val['poses']


def ov(name):
    """bones pass over the mesh pass -> raw/<name>_ov.png"""
    out = f'{RAW}/{name}_ov.png'
    compose.overlay(f'{RAW}/{name}.png', f'{RAW}/{name}_bones.png', out)
    return out


def legend(img, names, pal, out):
    im = compose.flat(Image.open(img)); d = ImageDraw.Draw(im); f = compose.font(max(14, im.width // 45))
    y = im.height - 12 - 24 * len(names)
    for k, n in enumerate(names):
        c = tuple(int(255 * x) for x in pal[k])
        d.rectangle([12, y + 24 * k, 30, y + 24 * k + 18], fill=c)
        d.text((38, y + 24 * k - 1), n, fill=(240, 240, 240), font=f)
    im.save(out)
    return out


def cap(name):
    s = P[name]['stretch']; c = P[name]['cloth_in_limbs']
    return f'{name}: giãn tối đa {s["worst"]}x, cạnh xấu {s["bad_edges"]}, vải lọt chi {c}'


# G2_1: skeleton (runtime, with sockets) + control rig
items = [f'{ov("skel_front")}=Skeleton runtime 54 bone - trước', f'{ov("skel_left")}=bên trái (+X)',
         f'{ov("skel_back")}=sau', f'{ov("skel_topdown")}=trên',
         f'{ov("ctl_left")}=Rig điều khiển: cam = Hand_IK, Knee_IK; vàng = Palm/Fingertip_roll; xanh = pole; tím = root, cog; xám = FK',
         f'{ov("ctl_three_quarter")}=rig điều khiển 3/4']
compose.grid(QA + '/P04_hive_sleeper_G2_1_skeleton.png', 3, 760, items)

# G2_2: weights
lg = json.load(open(RAW + '/w_legend.json'))
items = [f'{RAW}/w_all_front.png=Trọng số (màu = bone trội) - trước', f'{RAW}/w_all_left.png=bên trái',
         f'{RAW}/w_all_back_q.png=sau 3/4', f'{RAW}/w_all_bottom.png=dưới']
views = {'trunk': ('left', 'topdown'), 'head_neck': ('three_quarter', 'left'), 'arm_L': ('left', 'front'),
         'leg_L': ('left', 'bottom'), 'domes': ('left', 'back_q'), 'cloth_L': ('left', 'back_q')}
title = {'trunk': 'thân', 'head_neck': 'đầu, cổ, mũ', 'arm_L': 'tay trái', 'leg_L': 'chân trái', 'domes': 'vòm (cứng)',
         'cloth_L': 'vạt áo trái + yếm'}
for g, vv in views.items():
    names = lg['groups'][g]
    for k, v in enumerate(vv):
        src = f'{RAW}/w_{g}_{v}.png'
        dst = legend(src, names, lg['palette'], f'{RAW}/w_{g}_{v}_lg.png') if k == 0 else src
        items.append(f'{dst}={title[g]} ({v})')
compose.grid(QA + '/P04_hive_sleeper_G2_2_weights.png', 4, 620, items)

# G2_3: test poses (posed through the control rig)
order = ['crawl_contact', 'crawl_lift', 'reach_L', 'knee_lift_L', 'twist', 'side_bend', 'arch_up', 'sag_down',
         'head_up', 'head_down', 'head_turn', 'palm_lift_L', 'pronate_L', 'domes']
items = [f'{RAW}/pose_{n}_three_quarter.png={cap(n)}' for n in order if n in P]
compose.grid(QA + '/P04_hive_sleeper_G2_3_poses.png', 4, 600, items)

# G2_4: close-ups (texture, then heat: grey = ok -> red = edge 1.6x or more)
close = ['head_turn', 'head_up', 'head_down', 'reach_L', 'twist', 'crawl_contact', 'palm_lift_L', 'pronate_L', 'knee_lift_L',
         'arch_up', 'domes']
items = []
for n in close:
    if os.path.exists(f'{RAW}/pose_{n}_close.png'):
        items.append(f'{RAW}/pose_{n}_close.png={cap(n)}')
        items.append(f'{RAW}/pose_{n}_closeheat.png={n}: độ giãn (xám = ổn, đỏ = cạnh dài/ngắn 1,6x trở lên)')
compose.grid(QA + '/P04_hive_sleeper_G2_4_closeups.png', 4, 560, items)
print('SHEETS_DONE')

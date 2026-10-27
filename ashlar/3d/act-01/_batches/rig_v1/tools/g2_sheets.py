"""G2 review sheets for one asset (system Python + PIL).  python -E g2_sheets.py <asset_dir> <asset_id> [label]

Reads rig/validation.json and the renders in rig/qa/ (written by stage s6), writes rig/qa/<id>_G2_*.png and
moves the raw renders to rig/qa/raw/.
"""
import sys, os, json, glob, shutil
from PIL import Image, ImageDraw, ImageFont

ADIR, AID = sys.argv[1], sys.argv[2]
LABEL = sys.argv[3] if len(sys.argv) > 3 else AID
Q = os.path.join(ADIR, 'rig', 'qa'); RAW = os.path.join(Q, 'raw'); os.makedirs(RAW, exist_ok=True)
V = json.load(open(os.path.join(ADIR, 'rig', 'validation.json'), encoding='utf-8'))
BG = (58, 58, 62)


def font(sz, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, sz)
        except OSError:
            pass
    return ImageFont.load_default()


def p(name):
    for d in (Q, RAW):
        f = os.path.join(d, name)
        if os.path.exists(f):
            return f
    return None


def flat(path):
    im = Image.open(path).convert('RGBA'); b = Image.new('RGBA', im.size, BG + (255,))
    return Image.alpha_composite(b, im)


def over(mesh, bones):
    a = flat(p(mesh)); b = Image.open(p(bones)).convert('RGBA')
    return Image.alpha_composite(a, b).convert('RGB')


def sheet(cells, cols, cell, title, sub, out):
    rows = (len(cells) + cols - 1) // cols; top = 70 + 24 * len(sub)
    S = Image.new('RGB', (cols * cell, top + rows * (cell + 28)), (30, 30, 33)); d = ImageDraw.Draw(S)
    d.text((12, 10), title, fill=(255, 225, 120), font=font(24, True))
    for i, line in enumerate(sub):
        d.text((12, 46 + 24 * i), line, fill=(225, 225, 225), font=font(17))
    for k, (im, cap) in enumerate(cells):
        im = im.copy(); im.thumbnail((cell, cell))
        x0 = (k % cols) * cell; y0 = top + (k // cols) * (cell + 28)
        d.text((x0 + 8, y0 + 4), cap, fill=(255, 220, 90), font=font(17, True))
        S.paste(im, (x0 + (cell - im.width) // 2, y0 + 28 + (cell - im.height) // 2))
    S.save(out); print(out, S.size)


# 1 skeleton
cells = [(over(f'{AID}_xray_{v}.png', f'{AID}_xray_{v}_bones.png'), f'X-ray {v}') for v in ('front', 'left', 'back')]
cells += [(over(f'{AID}_neck_{v}.png', f'{AID}_neck_{v}_bones.png'), f'đầu–cổ {v}') for v in ('front', 'left')]
lm = V['landmarks']
sub = [f"{V['bones']} xương ({V['deform']} deform), cao {V['height_m']} m (k {V['k']:.3f}). Chuỗi: " +
       ', '.join(f"{n} {len(b)}" for n, b in V['chains'].items()),
       'Ghi chú khớp: ' + ' | '.join(V['skeleton_notes'][-6:])]
sheet(cells, 5, 560, f'{LABEL} — skeleton (G2 1/3)', sub, os.path.join(Q, f'{AID}_G2_1_skeleton.png'))

# 2 weights
cells = [(flat(p(f'{AID}_s4_wcol_{v}.png')).convert('RGB'), f'màu weight {v}') for v in ('front', 'back', 'left', 'three_quarter')]
h = V['health']
sub = ['Weight health: ' + '; '.join(f"{n.rsplit('_', 1)[-1]} tối đa {x['max_influences']} ảnh hưởng, chưa chuẩn hoá {x['not_normalised']}, "
                                    f"trống {x['empty']}, trên xương phụ {x['on_non_deform']}" for n, x in h.items())[:230],
       f"Da cổ {V['weights']['neck_skin']} đỉnh (head→neck từ đường cắt cằm), mask tay {V['weights']['arm_mask']} đỉnh, vạt tay áo {V['weights']['sleeve_flaps']} đỉnh"]
sheet(cells, 4, 600, f'{LABEL} — weight (G2 2/3)', sub, os.path.join(Q, f'{AID}_G2_2_weights.png'))

# 3 poses
P = V['poses']; cells = []
order = [n for n in ('walk', 'arms_down', 'elbows', 'bend', 'twist', 'head_turn', 'kick', 'sit') if p(f'{AID}_s5_qa_{n}_front.png')]
for n in order:
    r = P[n]; tag = f"{n}: giãn {r['stretch']}× ({r['bad_edges']} cạnh)" + (f", vải lọt chân {r['pen_nopush']}→{r['pen']}" if 'pen' in r else '')
    cells += [(flat(p(f'{AID}_s5_qa_{n}_front.png')).convert('RGB'), tag),
              (flat(p(f'{AID}_s5_qa_{n}_left.png')).convert('RGB'), 'nghiêng'),
              (flat(p(f'{AID}_s5_qa_{n}_front_heat.png')).convert('RGB'), 'độ giãn (đỏ ≥ 1,6×)')]
ref = V['reference_skill_rig']
sub = ['Tất cả tư thế: ' + ', '.join(f"{n} {r['stretch']}×" + (f"/lọt {r['pen']}" if 'pen' in r else '') for n, r in P.items()),
       f"Rig mẫu của skill: hạ tay {ref['arms_down']}, gập khuỷu {ref['elbows']}, bước {ref['walk']}, gối {ref['knees']}, quay đầu {ref['head_turn_neck_head']}; "
       f"vải lọt sau khi đẩy {ref['pen_after_push']}",
       f"Đường cắt giữa part: hở tối đa {max(r['seams']['max'] for r in P.values()) * 1000:.1f} mm. Tư thế nghỉ: đẩy váy xoay {V['rest_push_deg']}°. "
       f"Collider chân (đo từ mesh): {V['leg_radii']}. Bộ giải đẩy: {V['push_kw']}"]
sheet(cells, 6, 420, f'{LABEL} — tư thế thử (G2 3/3)', sub, os.path.join(Q, f'{AID}_G2_3_poses.png'))

# tidy: raw renders -> raw/, drop camera sidecars and stale sheets
for f in glob.glob(os.path.join(Q, '*')):
    b = os.path.basename(f)
    if os.path.isdir(f):
        continue
    if b.endswith('_cam.json') or b.endswith('_sheet.png') or 'sheet1' in b or 'sheet2' in b:
        os.remove(f); continue
    if '_G2_' in b or b.endswith('_parts_review.png'):
        continue
    shutil.move(f, os.path.join(RAW, b))

"""make_sheets.py <qa_dir> : build the contact sheets from qa/_raw (system python + Pillow)."""
import sys, os
from PIL import Image, ImageDraw
qa = sys.argv[1]; raw = os.path.join(qa, '_raw')


def sheet(name, rows, cell=(420, 520), label=True):
    """rows: list of lists of (path, caption)"""
    w, h = cell
    ncol = max(len(r) for r in rows)
    im = Image.new('RGB', (w * ncol, h * len(rows)), (58, 58, 64))
    d = ImageDraw.Draw(im)
    for i, r in enumerate(rows):
        for j, (p, cap) in enumerate(r):
            if not os.path.exists(p):
                continue
            t = Image.open(p).convert('RGB')
            t.thumbnail((w, h), Image.LANCZOS)
            im.paste(t, (j * w + (w - t.width) // 2, i * h + (h - t.height) // 2))
            if label:
                d.text((j * w + 6, i * h + 6), cap, fill=(255, 235, 80))
    im.save(os.path.join(qa, name))


P = lambda v, p: os.path.join(raw, 'poses', 'pose_%s_%s.png' % (p, v))
sheet('SHEET_skeleton_front_side_back.png', [[(os.path.join(raw, 'skeleton_%s.png' % v), 'skeleton %s' % v) for v in ('front', 'side', 'back')]], cell=(700, 700))
sheet('SHEET_pose_upper_body.png', [[(P(v, p), '%s / %s' % (p, v)) for p in ('rest', 'arms_down', 'arms_up', 'elbows_bent', 'fingers_curl', 'twist_bend', 'head_turn_nod')]
                                    for v in ('upperfront', 'upper34')], cell=(400, 400))
sheet('SHEET_pose_full_body.png', [[(P(v, p), '%s / %s' % (p, v)) for p in ('rest', 'arms_down', 'arms_up', 'stride', 'crouch_mid', 'skirt_swing')] for v in ('front', 'side', 'q34')], cell=(380, 466))
sheet('SHEET_pose_legs_robe.png', [[(P(v, p), '%s / %s' % (p, v)) for p in ('stride', 'crouch_mid', 'crouch')] for v in ('legs34', 'legsfront')], cell=(520, 640))
wnames = ['chest', 'L_UpperArm', 'L_ForeArm', 'L_Thigh', 'L_Calf', 'head', 'front_skirt_front_skirt_02', 'front_skirt_front_skirt_05', 'L_side_skirt_side_skirt_03', 'R_skirt_03', 'pelvis', 'neck']
sheet('SHEET_weights_per_bone.png', [[(os.path.join(raw, 'weights', 'weights_%s_front.png' % b), b) for b in wnames[i:i + 6]] for i in (0, 6)], cell=(330, 400))
sheet('SHEET_weights_dominant.png', [[(os.path.join(raw, 'weights', 'weights_dominant_%s.png' % v), 'dominant bone colour / ' + v) for v in ('front', 'back', 'side')]], cell=(520, 640))
walk = [0, 4, 8, 12, 16, 20, 24, 28]
sheet('SHEET_clip_walk.png', [[(os.path.join(raw, 'clips', 'pose_QA_walk_f%02d_%s.png' % (f, v)), 'QA_walk f%d %s' % (f + 1, v)) for f in walk] for v in ('front', 'side')], cell=(300, 366))
sheet('SHEET_clip_arm_swing.png', [[(os.path.join(raw, 'clips', 'pose_QA_arm_swing_f%02d_%s.png' % (f, v)), 'QA_arm_swing f%d %s' % (f + 1, v)) for f in (0, 6, 12, 18, 24, 30)] for v in ('front', 'side')], cell=(340, 416))
# pose distortion metrics -> qa/pose_metrics.json and into mapping_and_validation.json
import json, shutil
src = os.path.join(raw, 'poses', 'pose_metrics.json')
if os.path.exists(src):
    shutil.copy(src, os.path.join(qa, 'pose_metrics.json'))
    mv = os.path.join(os.path.dirname(qa), 'mapping_and_validation.json')
    if os.path.exists(mv):
        d = json.load(open(mv))
        d['validation']['C_pose_distortion_metrics'] = json.load(open(src))
        json.dump(d, open(mv, 'w'), indent=1)
print('sheets done')

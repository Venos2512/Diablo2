"""H2_FL_hand rig, R5: compose the QA sheets from rig/qa/_tiles (python -I -B, PIL). Numbers come from rig/_work/metrics_<tag>.json.

Sheets (rig/qa/): skeleton_overlay.png, weights_fingers.png, weights_dominant.png, rom_sheet_1.png / rom_sheet_2.png, stretch_sheet.png,
before_after.png, g2_flag_sheet.png.
Usage: python -I -B h11b_compose.py <rig_dir> <final_tag> <before_tag>
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

rig, tag, before = sys.argv[1], sys.argv[2], sys.argv[3]
Q = os.path.join(rig, 'qa')
T = os.path.join(Q, '_tiles')
try:
    FONT = ImageFont.truetype('arial.ttf', 17)
    FB = ImageFont.truetype('arialbd.ttf', 20)
except OSError:
    FONT = FB = ImageFont.load_default()
M = json.load(open(os.path.join(rig, '_work', f'metrics_{tag}.json')))
MB = json.load(open(os.path.join(rig, '_work', f'metrics_{before}.json')))
S = 400


def tile(path, label=None, sub=None, size=S):
    im = Image.open(path).convert('RGB').resize((size, size), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    if label:
        d.rectangle([0, 0, size, 26], fill=(20, 20, 22))
        d.text((6, 3), label, fill=(255, 255, 255), font=FB)
    if sub:
        lines = sub if isinstance(sub, list) else [sub]
        h = 22 * len(lines) + 6
        d.rectangle([0, size - h, size, size], fill=(20, 20, 22))
        for i, ln in enumerate(lines):
            d.text((6, size - h + 3 + 22 * i), ln, fill=(255, 230, 140), font=FONT)
    return im


def grid(tiles, cols, title, path):
    rows = (len(tiles) + cols - 1) // cols
    W = cols * S
    canvas = Image.new('RGB', (W, rows * S + 40), (40, 40, 44))
    d = ImageDraw.Draw(canvas)
    d.text((10, 8), title, fill=(255, 255, 255), font=FB)
    for i, t in enumerate(tiles):
        if t is not None:
            canvas.paste(t, ((i % cols) * S, 40 + (i // cols) * S))
    canvas.save(path, optimize=True)
    return path


def pose_numbers(m, p):
    r = m['poses'][p]
    jv = min(r['joint_volume'].items(), key=lambda x: x[1])
    pen = r['penetration']
    palm = max([v.get('palm_depth_mm', v.get('max_depth_mm', 0)) for k, v in pen.items() if k != 'skin_in_band'] or [0])  # old metric files: no split
    side = max([v.get('finger_depth_mm', 0) for k, v in pen.items() if k != 'skin_in_band'] or [0])
    band = pen.get('skin_in_band', {}).get('max_depth_mm', 0)
    s = [f"torn {r['torn_total']} | vol {jv[1]:.2f} ({jv[0]})", f"palm {palm:.1f} side {side:.1f} band {band:.1f} mm"]
    return s


out = []
# skeleton
tl = json.load(open(os.path.join(T, f'skeleton_{tag}', 'tiles.json')))
sk_tiles = []
for v in ('top', 'bottom', 'radial', 'ulnar', 'tips'):
    im = Image.open(os.path.join(T, f'skeleton_{tag}', f'rest_{v}.png')).convert('RGB')
    d = ImageDraw.Draw(im)
    W, H = im.size
    for n, (x, y) in tl[f'rest_{v}']['heads'].items():
        if 0 <= x <= 1 and 0 <= y <= 1 and v in ('top', 'bottom', 'tips'):
            px, py = x * W, (1 - y) * H
            d.text((px + 4, py - 8), n.replace('_0', ''), fill=(255, 255, 120), font=ImageFont.truetype('arial.ttf', 12) if FONT != ImageFont.load_default() else FONT)
    im = im.resize((S, S), Image.LANCZOS)
    dd = ImageDraw.Draw(im)
    dd.rectangle([0, 0, S, 26], fill=(20, 20, 22))
    dd.text((6, 3), f'rest · {v}', fill=(255, 255, 255), font=FB)
    sk_tiles.append(im)
out.append(grid(sk_tiles, 5, 'H2_FL_hand rig — runtime skeleton over the mesh (cyan = joints, orange = deform bones, magenta = sockets); frame: fingers -Y, back +Z', os.path.join(Q, 'skeleton_overlay.png')))
# weights per finger
wt = []
for f in ('thumb', 'index', 'middle', 'ring', 'pinky'):
    for v in ('top', 'bottom', 'radial' if f in ('thumb', 'index') else 'ulnar'):
        wt.append(tile(os.path.join(T, f'weights_{tag}', f'{f}_{v}.png'), f'{f} · {v}'))
out.append(grid(wt, 6, 'Weights per finger: red = _01, green = _02, blue = _03 (blended by weight), grey = other bones. No weight on a neighbour lobe (0 rows).', os.path.join(Q, 'weights_fingers.png')))
wd = [tile(os.path.join(T, f'weights_{tag}', f'dominant_{v}.png'), f'all bones · {v}') for v in ('top', 'bottom', 'radial', 'ulnar')]
wd += [tile(os.path.join(T, f'weights_{tag}', f'count_{v}.png'), f'influences · {v}', 'grey 0 · blue 1 · green 2 · yellow 3 · red 4') for v in ('top', 'bottom')]
out.append(grid(wd, 6, 'Weights, all bones (random colour per bone, blended) and influence count (max 4)', os.path.join(Q, 'weights_dominant.png')))
# ROM sheets
poses = list(M['poses'])
half = (len(poses) + 1) // 2
for k, chunk in enumerate((poses[:half], poses[half:])):
    tt = []
    for p in chunk:
        nums = pose_numbers(M, p)
        for i, v in enumerate(('dorsal34', 'palm34', 'ulnar')):
            tt.append(tile(os.path.join(T, f'rom_{tag}', f'{p}_{v}.png'), f'{p} · {v}', nums if i == 0 else None))
    out.append(grid(tt, 6, f'ROM {k + 1}/2 (final rig, weights {tag}); per pose: torn edges, min joint volume, palm / finger-side / band intrusion (mm)',
                    os.path.join(Q, f'rom_sheet_{k + 1}.png')))
# stretch
st = []
for p in ('lab_relaxed', 'lab_open', 'fist', 'loose_grip', 'spread', 'wave_2', 'wrist_flex40', 'wrist_ext40', 'pron90', 'sup90', 'lab_grip'):
    for v in ('dorsal34', 'palm34'):
        st.append(tile(os.path.join(T, f'stretch_{tag}', f'{p}_{v}.png'), f'{p} · {v}'))
out.append(grid(st, 6, 'Edge stretch per vertex: cyan = unchanged, lilac 1.0-1.1, yellow ~1.25, orange-red >= 1.5 (torn if also +0.9 mm); darker = compression', os.path.join(Q, 'stretch_sheet.png')))
# before / after
ba = []
for p, v in (('lab_relaxed', 'dorsal34'), ('lab_grip', 'palm34'), ('pron90', 'dorsal34')):
    ba.append(tile(os.path.join(T, f'stretch_{before}', f'{p}_{v}.png'), f'BEFORE {p}', [f"torn {MB['poses'][p]['torn_total']}"]))
    ba.append(tile(os.path.join(T, f'stretch_{tag}', f'{p}_{v}.png'), f'AFTER {p}', [f"torn {M['poses'][p]['torn_total']}"]))
for p, v in (('fist', 'ulnar'), ('fist', 'palm34')):
    ba.append(tile(os.path.join(T, f'rom_{before}', f'{p}_{v}.png'), f'BEFORE textbook fist', pose_numbers(MB, p)))
    ba.append(tile(os.path.join(T, f'rom_{tag}', f'{p}_{v}.png'), f'AFTER contact fist', pose_numbers(M, p)))
ba.append(tile(os.path.join(T, f'rom_{tag}', 'lab_grip_ulnar.png'), 'lab FINGER_POSES grip', pose_numbers(M, 'lab_grip')))
ba.append(tile(os.path.join(T, f'rom_{tag}', 'lab_grip_tuned_ulnar.png'), 'proposed lab grip', pose_numbers(M, 'lab_grip_tuned')))
out.append(grid(ba, 6, f'Before ({before}: crease weights, textbook fist) -> after ({tag}: bone-heat hand + twist chain, contact-limited fist)', os.path.join(Q, 'before_after.png')))
# G2 flag sheet (<= 8 tiles)
fl = [
    tile(os.path.join(T, f'rom_{tag}', 'wrist_ext40_palm34.png'), '1 wrist ext 40: band rim', pose_numbers(M, 'wrist_ext40')),
    tile(os.path.join(T, f'rom_{tag}', 'wrist_flex40_dorsal34.png'), '2 wrist flex 40', pose_numbers(M, 'wrist_flex40')),
    tile(os.path.join(T, f'rom_{tag}', 'fist_dorsal34.png'), '3 fist (contact-limited)', pose_numbers(M, 'fist')),
    tile(os.path.join(T, f'rom_{tag}', 'fist_ulnar.png'), '4 fist side: pressed fingers', pose_numbers(M, 'fist')),
    tile(os.path.join(T, f'rom_{tag}', 'lab_grip_ulnar.png'), '5 lab grip as coded today', pose_numbers(M, 'lab_grip')),
    tile(os.path.join(T, f'rom_{tag}', 'pron90_dorsal34.png'), '6 pronation 90 (twist bone)', pose_numbers(M, 'pron90')),
    tile(os.path.join(T, f'rom_{tag}', 'point_dorsal34.png'), '7 point', pose_numbers(M, 'point')),
    tile(os.path.join(T, f'rom_{tag}', 'lab_open_palm34.png'), '8 offer (lab open)', pose_numbers(M, 'lab_open')),
]
out.append(grid(fl, 4, 'G2 flag sheet — the questions in qa_report.md §G2', os.path.join(Q, 'g2_flag_sheet.png')))
print('H11B ' + json.dumps([os.path.basename(p) for p in out]))

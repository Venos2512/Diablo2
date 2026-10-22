"""Render the 2D top-down plan of the Old Face (docs/old-face-plan.png) from a JSON dump of src/env/oldFace.js.

Usage:  python -I scripts/old-face-plan.py [out.png]      (needs node on PATH; run from lookdev-lab/)

The script asks node for oldFace.planData() (walls, floor heights, water, path, spawn, triggers / spawn points, lights, story props, a 5 m grid) and draws it with Pillow.
Coordinates: metres, x east (right), z south (down) like the scene; 22 px per metre.
"""
import json
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'old-face-plan.png')
S = 22
X0, X1, Z0, Z1 = -34.0, 19.0, -12.0, 8.5
LEGEND = 250


def dump():
    code = "import('./src/env/oldFace.js').then(o => process.stdout.write(JSON.stringify(o.planData())))"
    res = subprocess.run(['node', '-e', code], cwd=ROOT, capture_output=True, check=True)
    return json.loads(res.stdout.decode('utf-8'))


def font(size, mono=False):
    for name in ('consola.ttf' if mono else 'arial.ttf', 'arial.ttf'):
        for base in ('C:/Windows/Fonts', '/usr/share/fonts/truetype/dejavu'):
            p = os.path.join(base, name)
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def main():
    d = dump()
    W = int((X1 - X0) * S) + LEGEND
    H = int((Z1 - Z0) * S) + 36
    img = Image.new('RGB', (W, H), (14, 16, 15))
    g = ImageDraw.Draw(img, 'RGBA')
    f9, f11, f14 = font(11), font(12), font(15)

    def P(x, z):
        return ((x - X0) * S, (z - Z0) * S + 30)

    # 5 m grid
    for x in range(int(X0), int(X1) + 1):
        if x % 5 == 0:
            g.line([P(x, Z0), P(x, Z1)], fill=(60, 66, 62, 255) if x % 10 == 0 else (36, 40, 38, 255), width=1)
            g.text((P(x, Z0)[0] + 2, 12), f'{x}', fill=(120, 128, 122), font=f9)
    for z in range(int(Z0), int(Z1) + 1):
        if z % 5 == 0:
            g.line([P(X0, z), P(X1, z)], fill=(60, 66, 62, 255) if z % 10 == 0 else (36, 40, 38, 255), width=1)
            g.text((P(X0, z)[0] + 2, P(X0, z)[1] + 1), f'{z}', fill=(120, 128, 122), font=f9)

    # floor cells coloured by height
    for x, z, y in d['cells']:
        c = (70, 74, 72)
        if y < -0.2:
            c = (36, 70, 78)
        elif y > 0.05:
            t = min(1.0, y / d['level'].get('top', 1.8) if False else y / 1.8)
            c = (int(88 + 80 * t), int(70 + 60 * t), int(52 + 40 * t))
        a, b = P(x, z), P(x + 0.25, z + 0.25)
        g.rectangle([a[0], a[1], b[0], b[1]], fill=c + (255,))
    # water
    f = d['flood']
    a, b = P(f['x0'] + 0.25, f['z0']), P(f['x1'] - 0.25, f['z1'])
    g.rectangle([a[0], a[1], b[0], b[1]], fill=(40, 110, 130, 150))
    # stair treads
    s = d['stair']
    for i in range(1, s['count']):
        z = s['z0'] - i * s['run']
        g.line([P(s['x0'], z), P(s['x1'], z)], fill=(30, 28, 24, 255), width=1)

    # walls: crypt-wall modules (rotated rectangles, 0.7 m thick, front on the room side)
    for w in d['walls']:
        hw, ht = w['w'] / 2, 0.349
        yaw = w['yaw']
        c, sn = math.cos(yaw), math.sin(yaw)
        pts = []
        for lx, lz in ((-hw, -ht), (hw, -ht), (hw, ht), (-hw, ht)):
            pts.append(P(w['x'] + lx * c + lz * sn, w['z'] - lx * sn + lz * c))
        col = (214, 205, 180, 255)
        if w['tag'] == 'warm':
            col = (214, 150, 96, 255)
        elif w['tag'] == 'collapse':
            col = (230, 120, 60, 255)
        elif w['tag'] == 'niches':
            col = (190, 200, 220, 255)
        g.polygon(pts, fill=col, outline=(40, 36, 30, 255))
    # stone runs (stairwell / door / repairs)
    for r in d['stone']:
        a, b = P(*r['a']), P(*r['b'])
        nx, nz = r['in']
        o = (-nx * 0.35 * S, -nz * 0.35 * S)
        g.line([(a[0] + o[0], a[1] + o[1]), (b[0] + o[0], b[1] + o[1])], fill=(140, 144, 150, 255), width=int(0.7 * S))
    # the door's opening
    dr = d['door']
    a, b = P(dr['x'] - dr['width'] / 2, dr['z'] - 0.35), P(dr['x'] + dr['width'] / 2, dr['z'] + 0.35)
    g.rectangle([a[0], a[1], b[0], b[1]], fill=(255, 200, 120, 255))
    # the hole
    h = d['hole']
    a, b = P(h['x'] - h['width'] / 2, h['z'] - 0.5), P(h['x'] + h['width'] / 2, h['z'] + 0.1)
    g.rectangle([a[0], a[1], b[0], b[1]], fill=(225, 238, 255, 255))

    # blockers (the leaning slab's footprint), obstacles
    for blk in d['blockers']:
        g.polygon([P(*p) for p in blk['pts']], outline=(255, 90, 60, 255), fill=(255, 90, 60, 60))
    for o in d['obstacles']:
        x, y = P(o['x'], o['z'])
        r = o['r'] * S
        g.ellipse([x - r, y - r, x + r, y + r], outline=(255, 150, 90, 255))

    # props
    colour = {'bonePile': (225, 220, 200), 'candles': (240, 235, 160), 'boulders': (150, 150, 150), 'column': (170, 160, 140)}
    for p in d['props']:
        x, y = P(p['x'], p['z'])
        r = max(3, 0.4 * p['scale'] * S)
        g.ellipse([x - r, y - r, x + r, y + r], fill=colour.get(p['kind'], (200, 200, 200)) + (255,), outline=(30, 30, 30, 255))
    # story pieces
    x, y = P(d['chair']['x'], d['chair']['z'])
    g.rectangle([x - 6, y - 6, x + 6, y + 6], fill=(150, 100, 60, 255), outline=(20, 20, 20, 255))
    x, y = P(d['statue']['x'], d['statue']['z'])
    g.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(180, 184, 190, 255), outline=(20, 20, 20, 255))
    sh = d['shelf']
    x, y = P(sh['x'], sh['z'])
    yaw = sh['yaw']
    c, sn = math.cos(yaw), math.sin(yaw)
    pts = [P(sh['x'] + lx * c + lz * sn, sh['z'] - lx * sn + lz * c) for lx, lz in ((-sh['len'] / 2, -sh['depth'] / 2), (sh['len'] / 2, -sh['depth'] / 2), (sh['len'] / 2, sh['depth'] / 2), (-sh['len'] / 2, sh['depth'] / 2))]
    g.polygon(pts, fill=(236, 226, 190, 255), outline=(60, 50, 30, 255))
    for sc in d['sconces']:
        x, y = P(sc['x'] + sc['nx'] * 0.2, sc['z'] + sc['nz'] * 0.2)
        g.ellipse([x - 2.5, y - 2.5, x + 2.5, y + 2.5], fill=(70, 70, 76, 255), outline=(200, 200, 200, 255))
    for pp in d['pinpoints']:
        x, y = P(pp['x'], pp['z'])
        g.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(180, 230, 255, 255))

    # lights
    L = d['lights']
    for name, col in (('spot', (190, 220, 255)), ('lift', (190, 220, 255)), ('lantern', (255, 170, 70)), ('spill', (255, 150, 70))):
        x, y = P(L[name]['x'], L[name]['z'])
        g.ellipse([x - 5, y - 5, x + 5, y + 5], fill=col + (255,), outline=(0, 0, 0, 255))
    sp = L['spot']
    g.line([P(sp['x'], sp['z']), P(sp['tx'], sp['tz'])], fill=(190, 220, 255, 140), width=1)
    gx, gy = P(d['gennet']['x'], d['gennet']['z'])
    g.ellipse([gx - 11 * S / 2 * 0 - 3, gy - 3, gx + 3, gy + 3], fill=(255, 190, 90, 255))

    # path (dashed), spawn
    pts = [P(*p) for p in d['path']]
    for i in range(len(pts) - 1):
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        n = max(1, int(math.hypot(bx - ax, by - ay) / 9))
        for k in range(n):
            if k % 2 == 0:
                g.line([(ax + (bx - ax) * k / n, ay + (by - ay) * k / n), (ax + (bx - ax) * (k + 1) / n, ay + (by - ay) * (k + 1) / n)], fill=(255, 235, 90, 255), width=2)
    sx, sy = P(d['spawn']['x'], d['spawn']['z'])
    g.ellipse([sx - 6, sy - 6, sx + 6, sy + 6], fill=(60, 220, 110, 255), outline=(0, 0, 0, 255))

    # encounters: trigger circles, cues, spawn points
    ecol = {'E1': (255, 120, 90), 'E2': (200, 120, 255), 'E3': (255, 190, 60)}
    for e in d['encounters']:
        col = ecol[e['id']]
        t = e['trigger']
        x, y = P(t['x'], t['z'])
        r = t['r'] * S
        for a0 in range(0, 360, 14):
            g.arc([x - r, y - r, x + r, y + r], a0, a0 + 7, fill=col + (230,), width=1)
        g.text((x - 8, y - r - 13), e['id'], fill=col, font=f11)
        for c in e['cues']:
            cx, cy = P(c['x'], c['z'])
            g.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=col + (255,))
        for grp in e['spawn']:
            for ax, az in grp['at']:
                cx, cy = P(ax, az)
                g.line([(cx - 5, cy - 5), (cx + 5, cy + 5)], fill=col + (255,), width=2)
                g.line([(cx - 5, cy + 5), (cx + 5, cy - 5)], fill=col + (255,), width=2)

    # segment labels
    for sgm in d['segments']:
        x, y = P(sgm['x'], sgm['z'])
        t = sgm['label']
        w = g.textlength(t, font=f11)
        g.rectangle([x - w / 2 - 3, y - 8, x + w / 2 + 3, y + 8], fill=(0, 0, 0, 170))
        g.text((x - w / 2, y - 7), t, fill=(240, 240, 235), font=f11)

    # title + legend
    g.text((10, 5), 'ASHLAR · Prologue · The Old Face (Level Design §10.1) — mặt bằng, 22 px / m, lưới 5 m', fill=(235, 235, 225), font=f14)
    lx = int((X1 - X0) * S) + 12
    items = [
        ((214, 205, 180), 'Mô-đun tường crypt-wall (xương)'), ((230, 120, 60), 'Mô-đun đổ nghiêng (hốc sập)'), ((214, 150, 96), 'Tường ấm (E1)'),
        ((140, 144, 150), 'Tường đá Mason (cầu thang, cửa)'), ((70, 74, 72), 'Sàn khô  y = 0'), ((36, 70, 78), 'Lòng ngập  y = −0,4'), ((40, 110, 130), 'Mặt nước  y = −0,18'),
        ((168, 130, 92), 'Bậc thang → y = 1,8'), ((225, 238, 255), 'Hốc sáng của Bức Tường'), ((255, 200, 120), 'Cửa vòm lên nhà thờ'), ((60, 220, 110), 'Điểm xuất hiện'),
        ((255, 235, 90), 'Đường đi (centerline)'), ((190, 220, 255), 'Đèn lạnh (spot đổ bóng · đèn nâng)'), ((255, 170, 70), 'Đèn Gennet + đèn tràn'), ((255, 90, 60), 'Vùng chặn / vật cản'),
        ((225, 220, 200), 'Đống xương'), ((240, 235, 160), 'Cụm nến (tắt)'), ((150, 150, 150), 'Đá lửa / cột gãy'), ((150, 100, 60), 'Ghế canh'), ((236, 226, 190), 'Kệ sáp'),
        ((180, 184, 190), 'Tượng không mặt'), ((70, 70, 76), 'Giá đèn sắt (tắt)'), ((180, 230, 255), 'Điểm sáng tĩnh'), ((255, 120, 90), 'E1 chuột vữa — vòng = kích hoạt, chấm = dấu hiệu, × = quái'),
        ((200, 120, 255), 'E2 hốc gõ'), ((255, 190, 60), 'E3 bậc ngập nước'),
    ]
    y = 36
    for col, text in items:
        g.rectangle([lx, y + 2, lx + 12, y + 12], fill=col + (255,), outline=(0, 0, 0, 255))
        g.text((lx + 18, y), text, fill=(215, 215, 208), font=f9)
        y += 17
    img.save(OUT)
    print(f'wrote {OUT} ({W}x{H})')


if __name__ == '__main__':
    main()

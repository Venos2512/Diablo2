// ASHLAR Act I base maps — the 2D plan PNG of an INTERIOR map (src/env/act1/maps/<mapId>.js, PLAN.engine === 'interior') → docs/act1-base/<mapId>-plan.png.
// Node evaluates the plan with the pure engine (src/env/act1/interior.js: planData) and pipes it as JSON into a small Pillow drawing (python -I, stdin; the
// repo's other plan drawings use Pillow too): floor by height, the dark apron past the void edges, wall runs with their openings, stairs, every placement's
// footprint in its blockout category colour (void ones dimmed) with its asset id, lights (real / glow only, the dimmable group's order), markers, camps,
// spawns with their 128 m Play grid, the main route, a legend and a scale bar.  usage: node scripts/act1-interior-preview.mjs [mapId …] (default: every interior map)
import { readdirSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as I from '../src/env/act1/interior.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'src/env/act1/maps');
const outDir = path.join(root, 'docs/act1-base');
mkdirSync(outDir, { recursive: true });
const wanted = process.argv.slice(2);

// the blockout colours (src/env/act1/interiorBlockout.js; copied: that module needs THREE)
const COLORS = { building: '#8a8478', structure: '#6e6255', vegetation: '#55624f', rock: '#7b8088', prop: '#9a8c6e', linen: '#e4e0d6', story: '#a39b8a', npc: '#c9a86a', encounter: '#8e3b3b' };
const MARKERS = { encounter: '#8e3b3b', boss: '#b0413c', telegraph: '#1a1416', rite: '#7d6aa8', landmark: '#a39b8a', sightline: '#c9c2a8', vignette: '#8aa39b', npc: '#c9a86a', exit: '#6f9fbf', lullaby: '#c8b8d8', note: '#9aa0a6', patrol: '#d9c9a3', escort: '#8fc7a0', bell: '#c4a9d8' };

const PY = String.raw`
import json, sys, math
from PIL import Image, ImageDraw, ImageFont
d = json.loads(sys.stdin.buffer.read().decode('utf-8'))
P = d['plan']; C = d['colors']; MK = d['markers']
x0, z0, x1, z1 = P['bounds']; pad = P['apron']
S = d['scale']
W = int((x1 - x0 + 2 * pad) * S); Hh = int((z1 - z0 + 2 * pad) * S)
side = 430
img = Image.new('RGB', (W + side, max(Hh, 900)), (11, 11, 13))
dr = ImageDraw.Draw(img, 'RGBA')
def font(size, bold=False):
    for f in (['C:/Windows/Fonts/segoeuib.ttf'] if bold else []) + ['C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf', 'DejaVuSans.ttf']:
        try: return ImageFont.truetype(f, size)
        except Exception: pass
    return ImageFont.load_default()
F = font(13); FS = font(11); FB = font(17, True); FT = font(22, True)
def X(x): return (x - (x0 - pad)) * S
def Z(z): return (z - (z0 - pad)) * S
def hexa(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
step = P['step']
for c in P['cells']:
    x, z, y, k = c
    box = [X(x), Z(z), X(x + step) + 1, Z(z + step) + 1]
    if k == 2: dr.rectangle(box, fill=(24, 24, 28))
    elif k == 1: dr.rectangle(box, fill=(38, 58, 70))
    else:
        v = max(0, min(1, (y + 0.5) / 3.0)); g = int(64 + 70 * v)
        dr.rectangle(box, fill=(g, g - 3, g - 8))
for r in P['rooms']:
    pts = [(X(a), Z(b)) for a, b in r['pts']]
    dr.line(pts + [pts[0]], fill=(150, 142, 128, 120), width=1)
for v in P['voids']:
    (ax, az), (bx, bz) = v['a'], v['b']
    n = max(1, int(math.hypot(bx - ax, bz - az) / 0.8))
    for i in range(0, n, 2):
        t0, t1 = i / n, min(1, (i + 1) / n)
        dr.line([(X(ax + (bx - ax) * t0), Z(az + (bz - az) * t0)), (X(ax + (bx - ax) * t1), Z(az + (bz - az) * t1))], fill=(200, 196, 186, 150), width=2)
for s in P['stairs']:
    rx0, rz0, rx1, rz1 = s['rect']
    dr.rectangle([X(rx0), Z(rz0), X(rx1), Z(rz1)], fill=(120, 112, 100, 255), outline=(220, 210, 190, 255))
    for k in range(1, s['steps'] + 1):
        if s['up'] in ('e', 'w'):
            xx = rx0 + (rx1 - rx0) * k / (s['steps'] + 1) if s['up'] == 'e' else rx1 - (rx1 - rx0) * k / (s['steps'] + 1)
            dr.line([(X(xx), Z(rz0)), (X(xx), Z(rz1))], fill=(60, 55, 50, 255), width=1)
        else:
            zz = rz0 + (rz1 - rz0) * k / (s['steps'] + 1) if s['up'] == 's' else rz1 - (rz1 - rz0) * k / (s['steps'] + 1)
            dr.line([(X(rx0), Z(zz)), (X(rx1), Z(zz))], fill=(60, 55, 50, 255), width=1)
    dr.text((X(rx0) + 3, Z(rz0) + 2), 'stair ↑' + s['up'] + ' %.1f→%.1f m' % (s['y0'], s['y1']), fill=(20, 18, 16), font=FS)
for r in P['runs']:
    ax, az = r['a']; dx, dz = r['dir']; ix, iz = r['inward']; t = r['thickness']
    off = -t / 2 if r['offset'] == 'out' else 0
    cuts = sorted([(o['t0'], o['t1'], o['kind']) for o in r['openings']])
    segs = []; cur = 0
    for a, b, k in cuts:
        if a > cur: segs.append((cur, a, 'solid'))
        segs.append((a, b, k)); cur = max(cur, b)
    if cur < r['len']: segs.append((cur, r['len'], 'solid'))
    for a, b, k in segs:
        p0 = (X(ax + dx * a + ix * off), Z(az + dz * a + iz * off)); p1 = (X(ax + dx * b + ix * off), Z(az + dz * b + iz * off))
        if k == 'solid': dr.line([p0, p1], fill=(92, 80, 66, 255), width=max(3, int(t * S)))
        else: dr.line([p0, p1], fill=(230, 220, 160, 255), width=2)
for p in P['placements']:
    if p.get('roof'): continue  # exterior roofs (shown only from outside) would hide the plan
    f = p['foot']; col = hexa(C.get(p['category'], '#9a8c6e'), 110 if p['void'] else 235)
    if f['kind'] == 'disc':
        dr.ellipse([X(f['x'] - f['r']), Z(f['z'] - f['r']), X(f['x'] + f['r']), Z(f['z'] + f['r'])], fill=col, outline=(0, 0, 0, 160))
    else:
        dr.polygon([(X(a), Z(b)) for a, b in f['pts']], fill=col, outline=(0, 0, 0, 160))
    if p['solid']:
        for b in p['blockers']:
            if b['kind'] == 'disc': dr.ellipse([X(b['x'] - b['r']), Z(b['z'] - b['r']), X(b['x'] + b['r']), Z(b['z'] + b['r'])], outline=(255, 90, 70, 200), width=1)
            else: dr.polygon([(X(a), Z(c)) for a, c in b['pts']], outline=(255, 90, 70, 200))
seen = set()
for p in P['placements']:
    if p['void'] or p.get('roof'): continue
    key = (p['asset'], round(p['x'] / 6), round(p['z'] / 6))
    if key in seen: continue
    seen.add(key)
    dr.text((X(p['x']) - 12, Z(p['z']) - 6), p['asset'], fill=(16, 14, 12) if p['category'] == 'linen' else (240, 234, 220), font=FS)
for l in P['lights']:
    cx, cz = X(l['x']), Z(l['z'])
    if l['real']:
        rr = l['range'] * S
        dr.ellipse([cx - rr, cz - rr, cx + rr, cz + rr], outline=(242, 236, 223, 38), width=1)
        dr.ellipse([cx - 5, cz - 5, cx + 5, cz + 5], fill=(242, 236, 223, 255), outline=(0, 0, 0, 255))
    else:
        dr.ellipse([cx - 3, cz - 3, cx + 3, cz + 3], outline=(242, 236, 223, 150 if not l['void'] else 80), width=1)
    if l['group'] == 'nightlight' and l['order'] is not None:
        dr.text((cx + 6, cz - 16), str(l['order'] + 1), fill=(255, 238, 190), font=FS)
for m in P['markers']:
    x, z = m['at']; cx, cz = X(x), Z(z); col = hexa(MK.get(m['kind'], '#9aa0a6'), 230); r = (m.get('r') or 1) * S
    k = m['kind']
    if k == 'telegraph': dr.ellipse([cx - r, cz - r * 0.7, cx + r, cz + r * 0.7], fill=(0, 0, 0, 150), outline=(255, 255, 255, 60))
    elif k == 'lullaby':
        for a in range(0, 360, 12): dr.arc([cx - r, cz - r, cx + r, cz + r], a, a + 6, fill=col, width=2)
    elif k == 'sightline' and m.get('to'):
        tx, tz = X(m['to'][0]), Z(m['to'][1]); n = 30
        for i in range(0, n, 2): dr.line([(cx + (tx - cx) * i / n, cz + (tz - cz) * i / n), (cx + (tx - cx) * (i + 1) / n, cz + (tz - cz) * (i + 1) / n)], fill=col, width=2)
    elif k in ('patrol', 'escort'):
        raw = m.get('points') or [m['at']]
        pts = [(X(a), Z(b)) for a, b in raw] + ([(X(raw[0][0]), Z(raw[0][1]))] if m.get('loop') and len(raw) > 2 else [])
        for (ax, az), (bx, bz) in zip(pts, pts[1:]):
            n = max(2, int(math.hypot(bx - ax, bz - az) / (5 if k == 'escort' else 9)))
            for i in range(0, n, 2): dr.line([(ax + (bx - ax) * i / n, az + (bz - az) * i / n), (ax + (bx - ax) * (i + 1) / n, az + (bz - az) * (i + 1) / n)], fill=col, width=2)
        cone = m.get('cone')
        for i, (px, pz) in enumerate(raw if cone else []):
            q = raw[i + 1] if i + 1 < len(raw) else (raw[0] if m.get('loop') else (raw[i - 1] if i else None))
            yw = math.radians(m.get('yaw', 0))
            ang = math.degrees(math.atan2(q[1] - pz, q[0] - px) if q else math.atan2(math.cos(yw), math.sin(yw)))
            rr = cone.get('range', 6) * S; h = cone.get('angle', 60) / 2
            dr.pieslice([X(px) - rr, Z(pz) - rr, X(px) + rr, Z(pz) + rr], ang - h, ang + h, fill=hexa(MK.get(k, '#9aa0a6'), 45))
    elif k == 'bell':
        for a in range(0, 360, 12): dr.arc([cx - r, cz - r, cx + r, cz + r], a, a + 6, fill=col, width=2)
        for c in m.get('calls') or []:
            tx, tz = X(c[0]), Z(c[1]); n = 16
            for i in range(0, n, 2): dr.line([(cx + (tx - cx) * i / n, cz + (tz - cz) * i / n), (cx + (tx - cx) * (i + 1) / n, cz + (tz - cz) * (i + 1) / n)], fill=hexa(MK['encounter'], 220), width=2)
            dr.ellipse([tx - 6, tz - 6, tx + 6, tz + 6], outline=hexa(MK['encounter'], 255), width=2)
        dr.regular_polygon((cx, cz, 6), 3, fill=col)
    elif k == 'exit': dr.polygon([(cx - 8, cz - 7), (cx + 9, cz), (cx - 8, cz + 7)], fill=col)
    elif k == 'landmark': dr.regular_polygon((cx, cz, 9), 5, fill=col, outline=(0, 0, 0, 255))
    elif k == 'vignette': dr.regular_polygon((cx, cz, 8), 4, rotation=45, outline=col, width=2)
    else: dr.ellipse([cx - r, cz - r, cx + r, cz + r], outline=col, width=3)
    if k != 'telegraph': dr.text((cx + 10, cz + 4), m.get('label', k), fill=hexa(MK.get(k, '#9aa0a6')), font=F)
for c in P['camps']:
    x, z = c['at']; cx, cz = X(x), Z(z); r = max(0.8, c.get('radius', 2.5)) * S
    dr.ellipse([cx - r, cz - r, cx + r, cz + r], outline=hexa('#b0413c' if c.get('boss') else '#8e3b3b', 230), width=2)
    dr.text((cx - r, cz + r + 2), '%s ×%d %s (%s)' % (c['id'], c['count'], c['name'], c['monster']), fill=(240, 190, 180), font=FS)
rt = [(X(a), Z(b)) for a, b in P['route']]
if len(rt) > 1:
    dr.line(rt, fill=(120, 200, 220, 220), width=3)
    for i in range(len(rt) - 1):
        (ax, az), (bx, bz) = rt[i], rt[i + 1]
        ang = math.atan2(bz - az, bx - ax); mx, mz = (ax + bx) / 2, (az + bz) / 2
        dr.polygon([(mx + 8 * math.cos(ang), mz + 8 * math.sin(ang)), (mx + 6 * math.cos(ang + 2.5), mz + 6 * math.sin(ang + 2.5)), (mx + 6 * math.cos(ang - 2.5), mz + 6 * math.sin(ang - 2.5))], fill=(120, 200, 220, 255))
for i, s in enumerate(P['segments']):
    x, z = s['spawn']; cx, cz = X(x), Z(z)
    dr.ellipse([cx - 8, cz - 8, cx + 8, cz + 8], fill=(90, 200, 120, 255), outline=(0, 0, 0, 255))
    dr.text((cx - 4, cz - 8), str(i + 1), fill=(0, 0, 0), font=F)
    dr.text((cx + 11, cz - 9), 'S%d %s' % (i + 1, s['name']), fill=(140, 230, 160), font=F)
    if i == 0:
        g = 64 * S
        for a in range(0, 4):
            pts = [(cx - g, cz - g), (cx + g, cz - g), (cx + g, cz + g), (cx - g, cz + g)]
            p0, p1 = pts[a], pts[(a + 1) % 4]; n = 40
            for j in range(0, n, 2): dr.line([(p0[0] + (p1[0] - p0[0]) * j / n, p0[1] + (p1[1] - p0[1]) * j / n), (p0[0] + (p1[0] - p0[0]) * (j + 1) / n, p0[1] + (p1[1] - p0[1]) * (j + 1) / n)], fill=(90, 200, 120, 90), width=1)
# side panel
X0 = W + 18; y = 18
dr.text((X0, y), P['label'], fill=(240, 234, 220), font=FT); y += 34
dr.text((X0, y), 'LD %s · %s · %s' % (P['ld'], P['biome'], P['area']), fill=(190, 184, 170), font=F); y += 22
dr.text((X0, y), '%g × %g m slice · apron %g m · 1 px = %.2f m' % (x1 - x0, z1 - z0, pad, 1 / S), fill=(150, 146, 136), font=FS); y += 26
dr.text((X0, y), 'Blockout (màu theo nhóm)', fill=(240, 234, 220), font=FB); y += 24
for k in d['cats']:
    dr.rectangle([X0, y + 2, X0 + 14, y + 16], fill=hexa(C[k])); dr.text((X0 + 22, y), d['catLabels'].get(k, k), fill=(220, 214, 200), font=F); y += 20
y += 6
dr.text((X0, y), 'Ký hiệu', fill=(240, 234, 220), font=FB); y += 24
legend = [((242, 236, 223), 'đèn Perfection (đứng yên) · số = thứ tự còn lại'), ((200, 196, 186), 'mép void: sàn chìm vào bóng tối, không tường'), ((92, 80, 66), 'tường (tile biome) · vàng = lỗ mở / vòm'), ((255, 90, 70), 'vật cản đi bộ (Play)'), ((120, 200, 220), 'tuyến đi chính'), ((90, 200, 120), 'điểm xuất phát · ô vuông = lưới Play 128 m (S1)'), ((176, 65, 60), 'boss / chạm trán (quái thay thế)'), ((30, 30, 30), 'bóng tay telegraph'), ((200, 184, 216), 'vùng bài ru'), ((217, 201, 163), 'tuần tra + nón tầm nhìn · xanh lá = lối đưa ra')]
for col, txt in legend:
    dr.ellipse([X0 + 2, y + 3, X0 + 13, y + 14], fill=col + (255,)); dr.text((X0 + 22, y), txt, fill=(220, 214, 200), font=F); y += 20
y += 8
dr.text((X0, y), 'Asset (%d id)' % len(d['assets']), fill=(240, 234, 220), font=FB); y += 24
for a in d['assets']:
    txt = '%s ×%d · %s · %s' % (a['id'], a['count'], a['name'], a['status'])
    dr.text((X0, y), txt[:58], fill=(200, 194, 180), font=FS); y += 16
y += 10
dr.text((X0, y), 'Quái (thay thế trong Play)', fill=(240, 234, 220), font=FB); y += 24
for m in d['monsters']:
    dr.text((X0, y), ('%s ×%d · %s' % (m['id'], m['count'], m['name']))[:58], fill=(230, 190, 180), font=FS); y += 16
# scale bar + north
sx, sy = 20, img.height - 30
dr.line([(sx, sy), (sx + 10 * S, sy)], fill=(240, 234, 220), width=3); dr.text((sx, sy - 18), '10 m', fill=(240, 234, 220), font=F)
dr.polygon([(W - 30, 20), (W - 38, 42), (W - 22, 42)], fill=(240, 234, 220)); dr.text((W - 35, 44), 'N', fill=(240, 234, 220), font=F)
img.save(d['out'])
print('saved', d['out'], img.size)
`;

const CAT_LABELS = { building: 'Nhà / công trình', structure: 'Kết cấu · rào · lối đi', vegetation: 'Cây cỏ', rock: 'Đá', prop: 'Prop · đồ đạc', linen: 'Vải lanh Mercy', story: 'Cốt truyện · mốc', npc: 'Chỗ NPC', encounter: 'Chạm trán' };

for (const file of readdirSync(mapsDir).filter((f) => f.endsWith('.js')).sort()) {
	const mod = await import(pathToFileURL(path.join(mapsDir, file)).href);
	const plan = mod.PLAN;
	if (plan?.engine !== 'interior' || (wanted.length && !wanted.includes(plan.id))) continue;
	const model = I.compile(plan, mod.KIT);
	const data = I.planData(model, { step: 0.5 });
	data.ld = plan.ld;
	data.biome = plan.biome;
	data.area = plan.area ?? '';
	const cats = [...new Set(Object.values(mod.KIT).map((k) => k.category))].filter((c) => COLORS[c]);
	const out = path.join(outDir, `${plan.id}-plan.png`);
	const payload = JSON.stringify({ plan: data, colors: COLORS, markers: MARKERS, scale: 14, cats, catLabels: CAT_LABELS, assets: mod.ASSETS ?? [], monsters: mod.MONSTERS ?? [], out });
	const py = spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['-I', '-c', PY], { input: payload, encoding: 'utf8', maxBuffer: 1 << 26 });
	if (py.status !== 0) {
		console.error(py.stderr || py.error);
		process.exitCode = 1;
	} else process.stdout.write(py.stdout);
}

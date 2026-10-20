# Chroma-key a green HUD sprite sheet and cut every sprite into its own transparent PNG.
# usage: python -I slice.py <sheet.png> [names.txt]   -> <sheet>/<nn or name>.png + <sheet>_contact.png
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

src = sys.argv[1]
names = open(sys.argv[2], encoding='utf-8').read().split() if len(sys.argv) > 2 else []
stem = os.path.splitext(os.path.basename(src))[0]
out = os.path.join(os.path.dirname(os.path.abspath(src)), stem)
os.makedirs(out, exist_ok=True)

rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
key = g - np.maximum(r, b)                       # how "green screen" a pixel is
alpha = 1 - np.clip((key - 40) / 70, 0, 1)
g2 = np.minimum(g, np.maximum(r, b) + 8)         # despill green fringes
rgba = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)

solid = alpha > 0.5
lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=8))
boxes = []
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    area = int((solid[sl] & (lab[sl] == i)).sum())
    if area < 600:
        continue
    boxes.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop, i))
# reading order: group into rows by vertical overlap, then left to right
boxes.sort(key=lambda t: (t[0] + t[1]) / 2)
rows = []
for bx in boxes:
    cy = (bx[0] + bx[1]) / 2
    if rows and cy < rows[-1]['bot']:
        rows[-1]['items'].append(bx); rows[-1]['bot'] = max(rows[-1]['bot'], bx[1])
    else:
        rows.append({'bot': bx[1], 'items': [bx]})
order = [bx for row in rows for bx in sorted(row['items'], key=lambda t: t[2])]

H, W = solid.shape
manifest = []
for k, (y0, y1, x0, x1, i) in enumerate(order):
    pad = 4
    y0, y1, x0, x1 = max(0, y0 - pad), min(H, y1 + pad), max(0, x0 - pad), min(W, x1 + pad)
    crop = rgba[y0:y1, x0:x1].copy()
    crop[..., 3] = np.where(lab[y0:y1, x0:x1] == i, crop[..., 3], 0)  # only this sprite
    name = names[k] if k < len(names) else f'{k + 1:02d}'
    Image.fromarray(crop).save(os.path.join(out, name + '.png'))
    manifest.append({'name': name, 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0})
json.dump({'sheet': os.path.basename(src), 'sprites': manifest}, open(os.path.join(out, 'manifest.json'), 'w'), indent=1)

# contact sheet over a dark checker so key quality is visible
chk = np.indices((H, W)).sum(0) // 16 % 2
bg = np.where(chk[..., None], 46, 30).astype(np.uint8).repeat(3, 2)
a = rgba[..., 3:4] / 255.0
comp = Image.fromarray((rgba[..., :3] * a + bg * (1 - a)).astype(np.uint8))
d = ImageDraw.Draw(comp)
for m in manifest:
    d.rectangle([m['x'], m['y'], m['x'] + m['w'], m['y'] + m['h']], outline=(255, 80, 80))
    d.text((m['x'] + 4, m['y'] + 2), m['name'], fill=(255, 255, 0))
comp.save(os.path.join(os.path.dirname(out), stem + '_contact.png'))
print(stem, len(manifest), 'sprites')

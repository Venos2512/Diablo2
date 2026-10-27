"""Contact sheet from R0 renders.  python -E sheet.py <r0_dir> <out.png> <suffixes,comma> [cols] [cell] [assets,comma]

Each asset is one cell row of the given render suffixes (e.g. front_isl,side_isl), labelled with its id.
"""
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont

r0, out, sufs = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 4
cell = int(sys.argv[5]) if len(sys.argv) > 5 else 300
only = sys.argv[6].split(',') if len(sys.argv) > 6 and sys.argv[6] else None
assets = sorted({os.path.basename(f)[:-8] for f in glob.glob(os.path.join(r0, '*_r0.json'))})
if only:
    assets = [a for a in assets if any(a.startswith(o) for o in only)]
try:
    font = ImageFont.truetype('arialbd.ttf', max(14, cell // 14))
except OSError:
    font = ImageFont.load_default()
w = cell * len(sufs); rows = (len(assets) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols, cell * rows), (40, 40, 40)); d = ImageDraw.Draw(sheet)
for k, a in enumerate(assets):
    x0, y0 = (k % cols) * w, (k // cols) * cell
    for j, s in enumerate(sufs):
        p = os.path.join(r0, f'{a}_{s}.png')
        if os.path.exists(p):
            sheet.paste(Image.open(p).convert('RGB').resize((cell, cell)), (x0 + j * cell, y0))
    d.rectangle([x0, y0, x0 + w - 1, y0 + cell - 1], outline=(90, 90, 90))
    d.text((x0 + 6, y0 + 4), a, fill=(255, 220, 60), font=font)
sheet.save(out)
print(out, sheet.size)

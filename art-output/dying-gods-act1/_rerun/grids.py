# 2x2 review grids of the final concepts at half size (836x470 each) with folder labels.
import glob, os, json
from PIL import Image, ImageDraw
items = []
for d in sorted(glob.glob('[0-9]*')):
    ps = sorted(glob.glob(os.path.join(d, 'concept*.png')), key=os.path.getmtime)
    items.append((d, ps[-1]))
for g in range(0, len(items), 4):
    sheet = Image.new('RGB', (1672, 941), (20, 20, 20))
    dr = ImageDraw.Draw(sheet)
    for i, (d, p) in enumerate(items[g:g + 4]):
        x, y = (i % 2) * 836, (i // 2) * 471
        sheet.paste(Image.open(p).convert('RGB').resize((834, 469)), (x + 1, y + 1))
        dr.rectangle([x + 4, y + 4, x + 260, y + 22], fill=(0, 0, 0))
        dr.text((x + 8, y + 7), d, fill=(255, 230, 160))
    sheet.save(f'_rerun/grid_{g // 4 + 1:02d}.png')
print('ok')

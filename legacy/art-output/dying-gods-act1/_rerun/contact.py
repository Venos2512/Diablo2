# Contact sheet of the newest concept PNG in every monster folder.
import glob, os
from PIL import Image, ImageDraw
items = []
for d in sorted(glob.glob('[0-9]*')):
    ps = sorted(glob.glob(os.path.join(d, 'concept*.png')), key=os.path.getmtime)
    items.append((d, ps[-1] if ps else None))
cols, w, h = 6, 420, 236
sheet = Image.new('RGB', (cols * w, ((len(items) + cols - 1) // cols) * (h + 22)), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for i, (d, p) in enumerate(items):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    if p:
        sheet.paste(Image.open(p).convert('RGB').resize((w - 6, h - 6)), (x + 3, y + 20))
    dr.text((x + 5, y + 4), d + ('  [' + os.path.basename(p) + ']' if p else '  MISSING'), fill=(230, 220, 200))
sheet.save('_rerun/contact_all.png')
print(len(items))

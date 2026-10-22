import sys
from PIL import Image
tag=sys.argv[1]; poses=sys.argv[2].split(','); d='_work/dbg'
rows=[]
for nm in poses:
    ims=[Image.open(f"{d}/{tag}_{nm}_{v}.png").convert("RGB") for v in ("front","fl","side","fr","back")]
    r=Image.new("RGB",(sum(i.width for i in ims),ims[0].height)); x=0
    for i in ims: r.paste(i,(x,0)); x+=i.width
    rows.append(r)
sheet=Image.new("RGB",(rows[0].width,sum(r.height for r in rows))); y=0
for r in rows: sheet.paste(r,(0,y)); y+=r.height
sheet.save(f"{d}/{tag}_sheet.jpg",quality=85); print(sheet.size)

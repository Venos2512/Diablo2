import sys
from PIL import Image
tags=sys.argv[1].split(','); poses=sys.argv[2].split(','); views=sys.argv[3].split(','); out=sys.argv[4]; d='_work/dbg'
rows=[]
for t in tags:
  for nm in poses:
    ims=[Image.open(f"{d}/{t}_{nm}_{v}.png").convert("RGB") for v in views]
    r=Image.new("RGB",(sum(i.width for i in ims),ims[0].height)); x=0
    for i in ims: r.paste(i,(x,0)); x+=i.width
    rows.append(r)
sheet=Image.new("RGB",(rows[0].width,sum(r.height for r in rows))); y=0
for r in rows: sheet.paste(r,(0,y)); y+=r.height
sheet.save(out,quality=85); print(sheet.size)

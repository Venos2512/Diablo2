from PIL import Image,ImageDraw
import json,math
from pathlib import Path
p=Path(__file__).resolve().parent;root=p.parents[1]
rs=json.loads((p/'candidates.json').read_text())
rs=list({r['url']:r for r in rs}.values())
sheet=Image.new('RGB',(1000,math.ceil(len(rs)/4)*240),(36,33,28));d=ImageDraw.Draw(sheet)
for i,r in enumerate(rs):
 im=Image.open(root/r['file']).convert('RGBA');im.thumbnail((240,205));x=i%4*250;y=i//4*240
 sheet.paste(im,(x+(250-im.width)//2,y),im);d.text((x+8,y+207),r['filename'],fill='white')
sheet.save(p/'review.jpg');(p/'candidates.json').write_text(json.dumps(rs,indent=2))

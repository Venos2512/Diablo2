"""Probe observed legacy Gamepedia CDN namespace, queue successful files for visual review."""
import hashlib,json,requests,concurrent.futures,re
from pathlib import Path
from urllib.parse import quote
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];out=root/'assets/wiki-pass-grim-b'
allrows=json.loads((root/'assets/missing-wiki-images.json').read_text())
own=json.loads((out/'approved.json').read_text(encoding='utf8'))
ids={r['id'] for r in own if r['referenceKind']=='family'}
ids|={'grim-dawn-fleshwarped-butcher','grim-dawn-fleshwarped-thrasher','grim-dawn-tainted-hound','grim-dawn-devouring-swarm'}
ids|={r['id'] for r in allrows if r['id'].startswith('grim-dawn-groble-snake')}
rows=[r for r in allrows if r['id'] in ids]
def probe(row):
 stem=row['name'].replace(' ','_');stems=list(dict.fromkeys([stem,stem.replace('~','-'),stem.replace('_~_','_'),stem.replace('_-_','_'),stem.replace('Groble_~_',''),stem.replace('Groble_~_','Groble_-_')]))
 for s in stems:
  for ext in ['png','jpg']:
   fn=s+'.'+ext;h=hashlib.md5(fn.encode()).hexdigest();url=f'https://static.wikia.nocookie.net/grimdawn_gamepedia_en/images/{h[0]}/{h[:2]}/{quote(fn)}/revision/latest'
   try:
    r=requests.get(url,timeout=8);mime=r.headers.get('Content-Type','').split(';')[0]
    if r.status_code==200 and mime.startswith('image/') and len(r.content)>1000:
     suffix={'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}.get(mime,'img');f=out/(row['id']+'-exact.'+suffix);f.write_bytes(r.content);Image.open(f).verify()
     return dict(id=row['id'],file=f.relative_to(root).as_posix(),url=url,source='https://grimdawn.fandom.com/wiki/File:'+quote(fn),label='Wiki image - '+row['name'],filename=fn,referenceKind='exact',mime=mime)
   except requests.RequestException:pass
 return {'id':row['id'],'failed':True}
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool: found=list(pool.map(probe,rows))
(out/'namespace-candidates.json').write_text(json.dumps(found,indent=2),encoding='utf8')
ok=[r for r in found if not r.get('failed')]
for start in range(0,len(ok),12):
 batch=ok[start:start+12];sheet=Image.new('RGB',(1200,((len(batch)+3)//4)*300),'#252525');draw=ImageDraw.Draw(sheet)
 for i,row in enumerate(batch):
  im=Image.open(root/row['file']).convert('RGBA');im.thumbnail((285,260));x=(i%4)*300;y=(i//4)*300;sheet.paste(im,(x+(300-im.width)//2,y),im);draw.text((x+4,y+264),row['id'].replace('grim-dawn-',''),fill='white')
 sheet.save(out/f'namespace-contact-{start//12+1}.jpg')
print('Found',len(ok),'of',len(rows));print(json.dumps(found,indent=2))

"""Find and cache public wiki image candidates for manual visual review.

Only updates a candidate manifest. Publishing an image requires an explicit
reviewed mapping; filename matches alone do not establish visual identity.
"""
import concurrent.futures, hashlib, json, re, requests
from pathlib import Path
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'src/data/research-additions.json').read_text(encoding='utf8'))
rows += [{'game':'titan-quest','name':'Harpy'}, {'game':'grim-dawn','name':'Fleshwarped Butcher'}, {'game':'grim-dawn','name':'Mireborn Bloodgorger'}]
out=root/'assets/research-candidates';out.mkdir(exist_ok=True)
wikis={'grim-dawn':'grimdawn','titan-quest':'titanquest','dungeon-siege':'dungeonsiege'}
def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
def probe(row):
    name=row['name'];game=row['game'];wiki=wikis[game]
    stem=name.replace(' ','_')
    short=name.split(',')[0].split(' ~ ')[0].replace(' ','_')
    stems=list(dict.fromkeys([stem,short,stem.replace('_',''),short.replace('_','')]))
    if game=='titan-quest':stems += [short+'_model',short+'_Model']
    for base in stems:
      for ext in ['jpg','png']:
       fn=base+'.'+ext;h=hashlib.md5(fn.encode()).hexdigest()
       url=f'https://static.wikia.nocookie.net/{wiki}/images/{h[0]}/{h[:2]}/{fn}'
       try:
        r=requests.get(url,timeout=7,headers={'User-Agent':'Mozilla/5.0'})
        mime=r.headers.get('content-type','').split(';')[0]
        if r.status_code==200 and mime.startswith('image/') and len(r.content)>1000:
         suffix={'image/webp':'webp','image/png':'png','image/jpeg':'jpg'}.get(mime,'img')
         file=out/(game+'-'+slug(name)+'.'+suffix);file.write_bytes(r.content)
         return dict(game=game,name=name,id=game+'-'+slug(name),file=str(file.relative_to(root)).replace('\\','/'),filename=fn,url=url,source=f'https://{wiki}.fandom.com/wiki/File:{fn}',mime=mime,bytes=len(r.content))
       except requests.RequestException:pass
    return None
found=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 for row in pool.map(probe,rows):
  if row:found.append(row);print(row['game'],row['name'],row['filename'],flush=True)
(out/'manifest.json').write_text(json.dumps(found,indent=2),encoding='utf8')
print('Found',len(found),'candidates',flush=True)

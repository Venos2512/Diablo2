import requests,json,hashlib,concurrent.futures
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
rows=[r for r in json.loads((ROOT/'assets/missing-wiki-images.json').read_text()) if r['game']=='torchlight']
def fetch(r):
 stems=[r['name'].replace(' ','_'),r['name'].replace(' ',''),r['name'].lower().replace(' ','_'),r['name'].replace(' ','_')+'_T1',r['name'].replace(' ','_')+'_(T1)']
 found=[]
 for stem in stems:
  for ext in ['jpg','png','jpeg']:
   fn=stem+'.'+ext; h=hashlib.md5(fn.encode()).hexdigest();url=f'https://static.wikia.nocookie.net/torchlight/images/{h[0]}/{h[:2]}/{quote(fn)}'
   try:
    res=requests.get(url,timeout=8);mime=res.headers.get('content-type','').split(';')[0]
    if res.status_code==200 and mime.startswith('image/') and len(res.content)>1000:
     f=OUT/(r['id']+'-'+str(len(found))+'.'+{'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}.get(mime,'img'));f.write_bytes(res.content)
     found.append(dict(id=r['id'],name=r['name'],file=str(f.relative_to(ROOT)).replace('\\','/'),filename=fn,url=url,source='https://torchlight.fandom.com/wiki/File:'+quote(fn),mime=mime))
   except Exception:pass
 return found
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 result=[]
 for found in pool.map(fetch,rows):
  result+=found
  for r in found:print(r['name'],r['filename'],flush=True)
(OUT/'candidates.json').write_text(json.dumps(result,indent=2))
print('TOTAL',len(result))

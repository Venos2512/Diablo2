import json,hashlib,requests,concurrent.futures,re
from pathlib import Path
root=Path.cwd();out=root/'assets/wiki-pass-titan';out.mkdir(exist_ok=True)
rows=[r for r in json.load(open(root/'assets/missing-wiki-images.json')) if r['game'] in ['titan-quest','dungeon-siege']]
alias={'Harpy':['Harpy_concept','Harpy_concept_art','Brush_Harpy'], 'Automatoi':['Automaton','Automatoi_Warrior','Automatoi_Warriors'], 'Lernean Hydra':['Hydra'], 'Dark Satyr ~ Shaman':['Dark_Satyr_Shaman','Satyr_Shaman','Dark_Satyr'], 'Cyclops':['Polyphemus'], 'Carrion Bird':['Carrion_Crow','Crow'], 'Cave Bat':['Bat'], 'Giant Turtle':['Turtle','Salt_Snapper'], 'Arachne':['Arachne_-_Spider_Queen','Arachne_the_Spider_Queen'], 'Alastor':['Alastor_-_Scourge_of_Acheron'], 'Talos':['Talos_-_Master_Automatoi']}
jobs=[]
for row in rows:
 stems=[row['name'].replace(' ','_')]+alias.get(row['name'],[])
 for stem in stems:
  for suf in ['', '_1','_2','_3','_model','_Model','_concept','_concept_art']:
   for ext in ['.png','.jpg','.JPG']:
    jobs.append((row,stem+suf+ext))
def fetch(job):
 row,fn=job;wiki='titanquest' if row['game']=='titan-quest' else 'dungeonsiege';h=hashlib.md5(fn.encode()).hexdigest();u=f'https://static.wikia.nocookie.net/{wiki}/images/{h[0]}/{h[:2]}/{fn}'
 try:
  r=requests.get(u,timeout=5);mime=r.headers.get('content-type','').split(';')[0]
  if r.status_code==200 and mime.startswith('image/') and len(r.content)>1000:
   ext={'image/webp':'.webp','image/png':'.png','image/jpeg':'.jpg'}.get(mime,'.img');file=out/(re.sub('[^a-zA-Z0-9.-]','_',fn)+ext);file.write_bytes(r.content)
   return dict(id=row['id'],name=row['name'],filename=fn,file=str(file.relative_to(root)).replace('\\','/'),url=u,source=f'https://{wiki}.fandom.com/wiki/File:{fn}',mime=mime)
 except requests.RequestException: pass
found=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for x in pool.map(fetch,jobs):
  if x:found.append(x);print(x['id'],x['filename'],flush=True)
(out/'candidates.json').write_text(json.dumps(found,indent=2))
print('Found',len(found),'candidates')

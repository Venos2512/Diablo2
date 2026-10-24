exec(open(__file__.replace('probe_extra.py','probe.py')).read().split('with concurrent.futures.ThreadPoolExecutor')[0])
previous=json.loads((OUT/'candidates.json').read_text())
foundids={r['id'] for r in previous}
todo=[]
for r in rows:
 if r['id'] not in foundids or r['name'] in ['Goblin','Zombie','Skeleton']:
  base=r['name'].replace(' ','_');low=r['name'].capitalize().replace(' ','_')
  stems=[low,base+'1',base+'_1',base+'2',base+'_2',base+'3',base+'_3',base+'4',base+'_4',base+'_T1',base+'_(T1)',base+'_Torchlight',base+'_TL1']
  if r['name']=="Tu'tara":stems+=['Tutara','TuTara','Tu_Tara','Tu%27tara']
  for stem in dict.fromkeys(stems):
   for ext in ['png','jpg','jpeg']:todo.append((r,stem+'.'+ext))
def get(t):
 r,fn=t;h=hashlib.md5(fn.encode()).hexdigest();url=f'https://static.wikia.nocookie.net/torchlight/images/{h[0]}/{h[:2]}/{quote(fn)}'
 try:
  res=requests.get(url,timeout=7);mime=res.headers.get('content-type','').split(';')[0]
  if res.status_code==200 and mime.startswith('image/') and len(res.content)>1000:
   f=OUT/(r['id']+'-'+h[:10]+'.'+{'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}.get(mime,'img'));f.write_bytes(res.content)
   return dict(id=r['id'],name=r['name'],file=str(f.relative_to(ROOT)).replace('\\','/'),filename=fn,url=url,source='https://torchlight.fandom.com/wiki/File:'+quote(fn),mime=mime)
 except Exception:pass
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
 for r in pool.map(get,todo):
  if r:previous.append(r);print(r['name'],r['filename'],flush=True)
(OUT/'candidates.json').write_text(json.dumps(list({r['url']:r for r in previous}.values()),indent=2))

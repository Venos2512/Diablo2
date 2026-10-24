"""Probe exact-title MediaWiki file paths; report candidates for visual review."""
import concurrent.futures, hashlib, json, re, requests
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=(root/'src/data/multiverse.js').read_text(encoding='utf8')
sections=re.findall(r" '(grim-dawn|titan-quest|torchlight|dungeon-siege)':\[(.*?)\n \],",source,re.S)
wikis={'grim-dawn':'grimdawn','titan-quest':'titanquest','torchlight':'torchlight','dungeon-siege':'dungeonsiege'}
rows=[]
for game,body in sections:
 for name in re.findall(r"^  \['([^']+)'",body,re.M):
  rows.append((game,name))

def image_url(wiki,filename):
 hash=hashlib.md5(filename.encode()).hexdigest()
 return f'https://static.wikia.nocookie.net/{wiki}/images/{hash[0]}/{hash[:2]}/{filename}'

def probe(pair):
 game,name=pair;wiki=wikis[game];stem=name.replace(' ','_').replace("'",'')
 stems=[stem,stem.lower(),stem.replace('_the_','_'),stem.replace('Krug_',''),stem.replace('Deepmire_',''),stem.replace('Rotting_','')]
 if name=='Warden Krieg':stems+=['The_Warden','Warden','Warden_Krieg_Phase_1','Warden_Krieg_Phase_2']
 if name=='Brink the Corrupted':stems+=['Corrupted_Brink','Brink','Brink_the_Corrupt','Brink_The_Corrupted']
 if game=='titan-quest':stems += [stem+'_model',stem+'_Model',stem+'_Monster',stem+'_monster',stem+'_1',stem+'_2']
 if game=='grim-dawn':stems += [stem+'_1',stem+'_2',stem+'_creature',stem+'_Creature']
 candidates=[f'{s}.{ext}' for s in dict.fromkeys(stems) for ext in ('png','jpg','jpeg','gif')]
 # MediaWiki capitalizes the first filename character; spaces become underscores.
 for filename in candidates:
  url=image_url(wiki,filename)
  try:
   response=requests.get(url,headers={'User-Agent':'Mozilla/5.0'},timeout=12)
   if response.status_code==200 and response.headers.get('content-type','').startswith('image/') and len(response.content)>1000:
    return {'game':game,'name':name,'filename':filename,'url':url,'size':len(response.content),'type':response.headers['content-type']}
  except requests.RequestException:pass
 return {'game':game,'name':name,'filename':None}

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:results=list(pool.map(probe,rows))
(root/'assets/wiki-probe.json').write_text(json.dumps(results,indent=2),encoding='utf8')
print('Found',sum(x['filename'] is not None for x in results),'of',len(results))
for row in results:print(row['game'],row['name'],row['filename'])

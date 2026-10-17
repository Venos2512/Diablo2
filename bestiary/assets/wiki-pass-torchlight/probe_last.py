import requests,json,hashlib,concurrent.futures
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
rows=[r for r in json.loads((ROOT/'assets/missing-wiki-images.json').read_text()) if r['game']=='torchlight']
previous=json.loads((OUT/'candidates.json').read_text()); todo=[]
targets=['Blood Disciple','Cursed Sword','Dwarf','Mechanical Construct','Phase Beast',"Tu'tara",'Rock Troll']
special={'Dwarf':['Soulless_Cutter','Dwarven_Wight','Deathwalker_Battlemaster','Dwarf_T1','Dwarf_(T1)'],'Mechanical Construct':['Mechanical_Construct_1','Mechanical_construct','Mechanicalconstruct','Mechanical_Construct_T1'],'Phase Beast':['Phasebeast','PhaseBeast','Phase_Beast_(T1)','Phase_Beast_T1'],'Tu\'tara':['Tutara','Tutara_Warrior','TuTara','Tu_tara','TuTara_Warrior','Tutara_Myrmidon','Tutara_Archer','Tu%27tara']}
for r in rows:
 if r['name'] in targets:
  s=r['name'].replace(' ','_');stems=[s,r['name'].capitalize().replace(' ','_'),r['name'].replace(' ',''),s.lower(),s+'_monster',s+'_(monster)',s+'_1',s+'01',s+'-1']+special.get(r['name'],[])
  for stem in dict.fromkeys(stems):
   for ext in ['png','jpg','PNG','JPG','gif']:todo.append((r,stem+'.'+ext))
exec(open(__file__.replace('probe_last.py','probe_extra.py')).read().split('def get(t):')[1].split('with concurrent.futures.ThreadPoolExecutor')[0].join(['def get(t):','']))
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
 for r in pool.map(get,todo):
  if r:previous.append(r);print(r['name'],r['filename'],flush=True)
(OUT/'candidates.json').write_text(json.dumps(list({r['url']:r for r in previous}.values()),indent=2))

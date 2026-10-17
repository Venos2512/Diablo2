"""Add official early-game gem, rune, potion, scroll, tome and jewelry references."""
import base64,html,json,re,urllib.parse,urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE='https://classic.battle.net'
PAGES={
 'gems':BASE+'/diablo2exp/items/gems.shtml',
 'runes':BASE+'/diablo2exp/items/runes.shtml',
 'potions':BASE+'/diablo2exp/items/potions.shtml',
 'basics':BASE+'/diablo2exp/basics/',
 'jewelry':BASE+'/diablo2exp/items/ringsnamulets.shtml',
}
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()
with ThreadPoolExecutor(max_workers=5) as pool:pages=dict(zip(PAGES,pool.map(lambda u:get(u).decode('latin1'),PAGES.values())))
records=[]
def add(name,group,family,source,url,level=None,label='Official item illustration'):
 records.append({'name':name,'group':group,'family':family,'source':source,'url':url,'requiredLevel':level,'label':label})
def first_img(row,source):
 m=re.search(r'<img\b[^>]*src\s*=\s*(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))',row,re.I)
 return urllib.parse.urljoin(source,next(part for part in m.groups() if part)) if m else None

for row in re.findall(r'<tr\b[^>]*>.*?</tr\s*>',pages['gems'],re.I|re.S):
 m=re.search(r'<b[^>]*>\s*((?:Chipped |Flawed )?(?:Skull|Amethyst|Sapphire|Emerald|Ruby|Diamond|Topaz))\s*</b>',row,re.I)
 if not m:continue
 name=html.unescape(m.group(1));level=1 if name.startswith('Chipped ') else 5 if name.startswith('Flawed ') else 12
 if level>12:continue
 url=first_img(row,PAGES['gems'])
 if url and '/gems/' in url:add(name,'socketable','Gem',PAGES['gems'],url,level)

for row in re.findall(r'<tr\b[^>]*>.*?</tr\s*>',pages['runes'],re.I|re.S):
 m=re.search(r'<font\b[^>]*color\s*=\s*["\']?orange["\']?[^>]*>\s*(El|Eld|Tir|Nef|Eth|Ith|Tal)\s*</font>',row,re.I)
 if not m:continue
 url=first_img(row,PAGES['runes'])
 if url and '/runes/' in url:add(m.group(1)+' Rune','socketable','Rune',PAGES['runes'],url,None)

potions=['Healing Potion','Greater Healing Potion','Super Healing Potion','Mana Potion','Greater Mana Potion','Super Mana Potion','Full Rejuvenation Potion']
for name in potions:
 rows=[row for row in re.findall(r'<tr\b[^>]*>.*?</tr\s*>',pages['potions'],re.I|re.S) if re.search(r'(?:<b[^>]*>\s*|alt\s*=\s*["\'])'+re.escape(name)+r'(?:\s*</b>|["\'])',row,re.I)]
 if len(rows)!=1:raise RuntimeError('Potion row not unique: '+name)
 add(name,'consumable','Potion',PAGES['potions'],first_img(rows[0],PAGES['potions']))

for name in ['Fulminating Potion','Strangling Gas Potion','Exploding Potion']:
 rows=[row for row in re.findall(r'<tr\b[^>]*>.*?</tr\s*>',pages['potions'],re.I|re.S) if name.lower() in html.unescape(re.sub(r'<[^>]+>',' ',row)).lower()]
 if len(rows)!=1:raise RuntimeError('Throwing potion row not unique: '+name)
 add(name,'consumable','Throwing potion',PAGES['potions'],first_img(rows[0],PAGES['potions']))

for name in ['Scroll of Town Portal','Scroll of Identify','Tome of Town Portal','Tome of Identify']:
 m=re.search(r'<img\b[^>]*alt\s*=\s*["\']'+re.escape(name)+r'["\'][^>]*>',pages['basics'],re.I)
 if not m:raise RuntimeError('Missing utility image: '+name)
 add(name,'utility','Scroll' if name.startswith('Scroll') else 'Tome',PAGES['basics'],first_img(m.group(0),PAGES['basics']))

for name,path in [('Ring','ring1.gif'),('Amulet','amu1.gif')]:
 url=BASE+'/images/battle/diablo2exp/images/items/ra/'+path
 if path not in pages['jewelry']:raise RuntimeError('Missing jewelry variant '+name)
 add(name,'accessory','Jewelry',PAGES['jewelry'],url,1,'Representative icon variant; appearance can vary')

images_path=ROOT/'src/data/item-images.json';images=json.loads(images_path.read_text(encoding='utf8'))
out=ROOT/'assets/items';out.mkdir(exist_ok=True)
def download(record):
 raw=get(record['url']);slug=re.sub('[^a-z0-9]+','-',record['name'].lower()).strip('-');suffix=Path(urllib.parse.urlparse(record['url']).path).suffix.lower();file=out/(slug+suffix);file.write_bytes(raw)
 mime='image/gif' if suffix=='.gif' else 'image/jpeg'
 return record['name'],{'src':'data:'+mime+';base64,'+base64.b64encode(raw).decode(),'file':str(file.relative_to(ROOT)).replace('\\','/'),'url':record['url'],'source':record['source'],'label':record['label']}
with ThreadPoolExecutor(max_workers=8) as pool:
 for name,data in pool.map(download,records):images[name]=data

for name,family in [('Key','Key'),('Arrows','Ammunition'),('Bolts','Ammunition')]:
 records.append({'name':name,'group':'utility','family':family,'source':BASE+'/diablo2exp/items/basics.shtml','url':None,'requiredLevel':None,'label':'No verified icon linked'})
(ROOT/'src/data/misc-items.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
images_path.write_text(json.dumps(images,ensure_ascii=False),encoding='utf8')
(ROOT/'assets/ITEM_SOURCES.json').write_text(json.dumps({k:{a:b for a,b in v.items() if a!='src'} for k,v in images.items()},indent=2),encoding='utf8')
print('Misc records:',len(records),'With images:',sum(r['name'] in images for r in records),'Total item images:',len(images))

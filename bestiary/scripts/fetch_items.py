"""Fetch item illustrations from Blizzard's Arreat Summit item tables."""
import urllib.request,urllib.parse,urllib.error,re,json,base64,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];BASE='https://classic.battle.net'
PAGES={
 'normal/swords.shtml':['Short Sword','Sabre'],
 'normal/axes.shtml':['Hand Axe','Axe'],
 'normal/maces.shtml':['Club','Spiked Club'],
 'normal/daggers.shtml':['Dagger','Dirk'],
 'normal/bows.shtml':['Short Bow','Hunter\'s Bow'],
 'normal/staves.shtml':['Short Staff'],
 'normal/wands.shtml':['Wand'],
 'normal/helms.shtml':['Cap'],
 'normal/armor.shtml':['Quilted Armor','Leather Armor'],
 'normal/shields.shtml':['Buckler','Small Shield'],
 'normal/gloves.shtml':['Leather Gloves'],
 'normal/boots.shtml':['Boots'],
 'normal/belts.shtml':['Sash'],
 'potions.shtml':['Minor Healing Potion','Light Healing Potion','Minor Mana Potion','Light Mana Potion','Rejuvenation Potion','Stamina Potion','Antidote Potion','Thawing Potion'],
}
def get(url):
 for n in range(3):
  try:return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Sanctuary-Databook/1.0'}),timeout=25).read()
  except urllib.error.HTTPError:raise
  except Exception:
   if n==2:raise
   time.sleep(1)
images={};missing=[];out=ROOT/'assets'/'items';out.mkdir(parents=True,exist_ok=True)
for page,names in PAGES.items():
 source=BASE+'/diablo2exp/items/'+page
 html=get(source).decode('latin1')
 rows=re.findall(r'<tr\b[^>]*>.*?</tr\s*>',html,re.I|re.S)
 for name in names:
  matched=[row for row in rows if re.search(r'<b\b[^>]*>\s*'+re.escape(name)+r'\s*</b\s*>',row,re.I)]
  if not matched:missing.append(name);continue
  target=matched[0];before=target[:re.search(r'<b\b[^>]*>\s*'+re.escape(name)+r'\s*</b\s*>',target,re.I).start()]
  srcs=re.findall(r'<img\b[^>]*src\s*=\s*(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))',before,re.I)
  if not srcs:missing.append(name);continue
  src=urllib.parse.urljoin(source,next(x for x in srcs[-1] if x));slug=re.sub('[^a-z0-9]+','-',name.lower()).strip('-');suffix=Path(urllib.parse.urlparse(src).path).suffix
  file=out/(slug+suffix)
  try:
   if not file.exists():file.write_bytes(get(src))
  except urllib.error.HTTPError:print('UNAVAILABLE',name,src);missing.append(name);continue
  raw=file.read_bytes();mime='image/gif' if suffix=='.gif' else 'image/jpeg'
  images[name]={'src':'data:'+mime+';base64,'+base64.b64encode(raw).decode(),'file':str(file.relative_to(ROOT)).replace('\\','/'),'url':src,'source':source,'label':'Item icon'}
  print(name,src)
quest=BASE+'/diablo2exp/quests/act1.shtml';html=get(quest).decode('latin1')
if 'Rejuvenation Potion' not in images:
 name='Rejuvenation Potion';source=BASE+'/diablo2exp/items/potions.shtml';src=BASE+'/images/battle/diablo2exp/images/potions/rejuv.gif';file=out/'rejuvenation-potion.gif'
 if not file.exists():file.write_bytes(get(src))
 images[name]={'src':'data:image/gif;base64,'+base64.b64encode(file.read_bytes()).decode(),'file':str(file.relative_to(ROOT)).replace('\\','/'),'url':src,'source':source,'label':'Item icon'}
 missing.remove(name)
for name,heading in [('Tree of Inifuss Bark','The Search for Cain'),('Horadric Malus','Tools of the Trade')]:
 pos=html.find('<b>'+heading+'</b>');before=html[max(0,pos-500):pos]
 srcs=re.findall(r'<img\b[^>]*src\s*=\s*(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))',before,re.I)
 if not srcs:missing.append(name);continue
 src=urllib.parse.urljoin(quest,next(x for x in srcs[-1] if x));file=out/(re.sub('[^a-z0-9]+','-',name.lower()).strip('-')+'.gif')
 try:
  if not file.exists():file.write_bytes(get(src))
 except urllib.error.HTTPError:missing.append(name);continue
 images[name]={'src':'data:image/gif;base64,'+base64.b64encode(file.read_bytes()).decode(),'file':str(file.relative_to(ROOT)).replace('\\','/'),'url':src,'source':quest,'label':'Quest illustration (not inventory icon)'}
print('Images',len(images),'Missing',missing)
(ROOT/'src'/'data'/'item-images.json').write_text(json.dumps(images,ensure_ascii=False),encoding='utf8')
(ROOT/'assets'/'ITEM_SOURCES.json').write_text(json.dumps({k:{a:b for a,b in v.items() if a!='src'} for k,v in images.items()},indent=2),encoding='utf8')

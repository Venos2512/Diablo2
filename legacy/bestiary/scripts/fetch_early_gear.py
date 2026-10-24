"""Catalog official normal base items with Quality Level <= 18 for early-game art planning."""
import base64
import html
import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://classic.battle.net/diablo2exp/items/normal/'
CATEGORIES = {
 'helms':'armor','armor':'armor','shields':'armor','gloves':'armor','boots':'armor','belts':'armor',
 'barbhelms':'armor','druidpelts':'armor','paladinshields':'armor','shrunkenheads':'armor',
 'axes':'weapon','bows':'weapon','crossbows':'weapon','daggers':'weapon','javelins':'weapon',
 'maces':'weapon','polearms':'weapon','scepters':'weapon','spears':'weapon','staves':'weapon',
 'swords':'weapon','throw':'weapon','wands':'weapon','amazonweapons':'weapon','katars':'weapon','orbs':'weapon',
}
LIMIT = 18  # Art-planning selection criterion, not a verified Act I drop threshold.

def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read()

def scan(entry):
 category,group=entry;source=BASE+category+'.shtml';page=get(source).decode('latin1');found=[]
 for row in re.findall(r'<tr\b[^>]*>.*?</tr\s*>',page,re.I|re.S):
  match=re.search(r'<b[^>]*>([^<]{2,50})</b>',row,re.I)
  image=re.search(r'<img\b[^>]*src\s*=\s*(?:"([^"]+)"|\'([^\']+)\'|([^\s>]+))',row,re.I)
  if not match or not image:continue
  src=next(part for part in image.groups() if part)
  if '/items/' not in src:continue
  cells=re.findall(r'<td\b[^>]*>(.*?)</td\s*>',row,re.I|re.S)
  if not cells:continue
  last=html.unescape(re.sub(r'<[^>]+>',' ',cells[-1]))
  numbers=re.findall(r'\b\d+\b',last)
  if not numbers:continue
  quality_level=int(numbers[-1])
  if quality_level>LIMIT:continue
  name=html.unescape(match.group(1)).strip()
  found.append({'name':name,'group':group,'family':category,'qualityLevel':quality_level,'source':source,'url':urllib.parse.urljoin(source,src)})
 return found

with ThreadPoolExecutor(max_workers=6) as pool:
 by_page=list(pool.map(scan,CATEGORIES.items()))
records=[];seen=set()
for page_records in by_page:
 for record in page_records:
  if record['name'] not in seen:records.append(record);seen.add(record['name'])

images_path=ROOT/'src/data/item-images.json'
images=json.loads(images_path.read_text(encoding='utf8'))
directory=ROOT/'assets/items';directory.mkdir(exist_ok=True)
def fetch_image(record):
 name=record['name']
 if name in images:return name,None
 raw=get(record['url']);slug=re.sub('[^a-z0-9]+','-',name.lower()).strip('-')
 suffix=Path(urllib.parse.urlparse(record['url']).path).suffix.lower()
 file=directory/(slug+suffix);file.write_bytes(raw)
 mime='image/gif' if suffix=='.gif' else 'image/jpeg'
 return name,{'src':'data:'+mime+';base64,'+base64.b64encode(raw).decode(),'file':str(file.relative_to(ROOT)).replace('\\','/'),'url':record['url'],'source':record['source'],'label':'Official normal base-item illustration'}
with ThreadPoolExecutor(max_workers=8) as pool:
 for name,result in pool.map(fetch_image,records):
  if result:images[name]=result

(ROOT/'src/data/early-gear.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
images_path.write_text(json.dumps(images,ensure_ascii=False),encoding='utf8')
(ROOT/'assets/ITEM_SOURCES.json').write_text(json.dumps({k:{a:b for a,b in v.items() if a!='src'} for k,v in images.items()},indent=2),encoding='utf8')
print('Early normal bases:',len(records),'Item images:',len(images),'Missing:',[r['name'] for r in records if r['name'] not in images])

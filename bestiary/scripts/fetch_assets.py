"""Download only official bestiary illustrations; preserve source provenance."""
import urllib.request, urllib.parse, re, json, base64, concurrent.futures
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
BASE='https://classic.battle.net'
class Tags(HTMLParser):
    def __init__(self): super().__init__(); self.images=[]; self.links=[]; self.href=None
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='img': self.images.append(a)
        if tag=='a': self.href=a.get('href')
    def handle_data(self,data):
        if self.href and data.strip(): self.links.append((data.strip(),self.href))
    def handle_endtag(self,tag):
        if tag=='a': self.href=None
def get(url):
    for attempt in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Act1ReferenceCatalog/1.0'}),timeout=20).read()
        except Exception:
            if attempt==2: raise
def parse(url):
    p=Tags(); p.feed(get(url).decode('latin1')); return p
names=['Fallen','Fallen Shaman','Spike Fiend','Zombie','Wendigo','Corrupt Rogue','Corrupt Rogue Archer','Corrupt Rogue Spearwoman','Skeleton','Skeleton Archer','Skeleton Mage','Goatman','Blood Hawk','Tainted','Giant Spider','Wraith','Fetish','Vampire','Flying Scimitar','Blood Hawk Nest','Gargoyle Trap']
page=BASE+'/diablo2exp/monsters/act1.shtml'
links=dict(parse(page).links)
out=ROOT/'assets'/'references'; out.mkdir(parents=True,exist_ok=True)
def save(name,url,source):
    suffix=Path(urllib.parse.urlparse(url).path).suffix
    slug=re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    path=out/(slug+suffix)
    raw=path.read_bytes() if path.exists() else get(url)
    path.write_bytes(raw)
    mime='image/gif' if suffix=='.gif' else 'image/jpeg'
    return name,dict(src='data:'+mime+';base64,'+base64.b64encode(raw).decode(),file=str(path.relative_to(ROOT)).replace('\\','/'),url=url,source=source)
def regular(name):
    url=urllib.parse.urljoin(page,links[name]); p=parse(url)
    candidates=[x['src'] for x in p.images if '/bestiary/' in x.get('src','')]
    if not candidates: raise RuntimeError('No official illustration: '+name)
    return save(name,urllib.parse.urljoin(url,candidates[0]),url)
special=BASE+'/diablo2exp/monsters/act1-superuniques.shtml'
sp=parse(special)
imgs=[urllib.parse.urljoin(special,x['src']) for x in sp.images if '/superuniques/' in x.get('src','')]
special_names=['Corpsefire','Bishibosh','Bonebreaker','Blood Raven','Coldcrow','Rakanishu','Treehead Woodfist','Griswold','The Countess','Pitspawn Fouldog','Bone Ash','The Smith','Andariel']
assert len(imgs)==len(special_names)
result={}
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    futures=[pool.submit(regular,n) for n in names]+[pool.submit(save,n,u,special) for n,u in zip(special_names,imgs)]
    for f in concurrent.futures.as_completed(futures):
        n,v=f.result(); result[n]=v; print('Saved',n)
(ROOT/'src'/'data').mkdir(parents=True,exist_ok=True)
(ROOT/'src'/'data'/'images.json').write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
(ROOT/'assets'/'SOURCES.json').write_text(json.dumps({k:{a:b for a,b in v.items() if a!='src'} for k,v in result.items()},indent=2,ensure_ascii=False),encoding='utf-8')
print('Completed:',len(result),'official images')

"""Curated public wiki candidate cache; approval requires visual review."""
import hashlib, json, requests, concurrent.futures
from pathlib import Path
from urllib.parse import quote
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parents[1]
out=root/'assets/wiki-pass-grim-b';out.mkdir(exist_ok=True)
spec=[
('bloodsworn-priest','Bloodsworn Priest.png'),('bloodsworn-summoner','Bloodsworn Summoner.png'),('bloodsworn-void-caller','Bloodsworn Void-Caller.png'),
('briarthorn-horror','Briarthorn Horror.png'),('briarthorn-terror','Briarthorn Terror.png'),
('carrion-raptor-hatchling','Carrion Raptor - Hatchling.png'),('carrion-raptor-hunter','Carrion Raptor - Hunter.png'),('carrion-raptor-screecher','Carrion Raptor - Screecher.png'),('carrion-raptor-viper-lord','Carrion Raptor - Viper Lord.png'),
('chthonian-harbinger','Chthonian Harbinger.png'),('kalis-ka-the-bonehunter','KalisKa 3.jpg'),('kyzogg-the-reanimator','Kyzogg zoom.jpg'),
('rifthound-howler','Rifthound - Howler.png'),('rifthound-azure-matriarch','Rifthound - Azure Matriarch.png'),('high-priest-rolderathis','Rolderathis.jpg'),('voidfiend-hellion','Voidfiend Hellion.png'),
('balegor-the-swamp-king','Балегор Царь болот.jpg'),('viloth-the-corruptor','Вилос Отравляющая.jpg'),('pusquill-the-hoarder','Писквилл Запасливый.jpg'),
('obsidian-defiler-ref','Obsidian Defiler.png'),('bloodgorger-ref','Festerborn Bloodgorger.png'),('rift-scourge-ref','Pale Cavern Crawler.png')]
def download(pair):
 id,display=pair;fn=display.replace(' ','_');h=hashlib.md5(fn.encode()).hexdigest()
 url=f'https://static.wikia.nocookie.net/grimdawn/ru/images/{h[0]}/{h[:2]}/{quote(fn)}'
 r=requests.get(url,timeout=20,headers={'User-Agent':'Mozilla/5.0'})
 mime=r.headers.get('content-type','').split(';')[0]
 if r.status_code!=200 or not mime.startswith('image/') or len(r.content)<1000:return {'failed':id,'status':r.status_code,'url':url}
 suffix={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}.get(mime,'img')
 file=out/(id+'.'+suffix);file.write_bytes(r.content)
 im=Image.open(file);im.verify()
 return dict(id='grim-dawn-'+id,file=file.relative_to(root).as_posix(),url=url,source='https://grimdawn.fandom.com/ru/wiki/'+quote('Файл:'+fn),filename=display,mime=mime)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: rows=list(pool.map(download,spec))
(out/'candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf8')
ok=[r for r in rows if 'failed' not in r]
for start in range(0,len(ok),12):
 batch=ok[start:start+12];sheet=Image.new('RGB',(1200,((len(batch)+3)//4)*300),'#252525');draw=ImageDraw.Draw(sheet)
 for i,row in enumerate(batch):
  im=Image.open(root/row['file']).convert('RGBA');im.thumbnail((285,260));x=(i%4)*300;y=(i//4)*300;sheet.paste(im,(x+(300-im.width)//2,y),im);draw.text((x+4,y+264),row['id'].replace('grim-dawn-',''),fill='white')
 sheet.save(out/f'contact-{start//12+1}.jpg')
print(json.dumps(rows,ensure_ascii=True,indent=2))

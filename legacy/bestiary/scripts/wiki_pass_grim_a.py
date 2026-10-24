import json,hashlib,requests,concurrent.futures,re
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(r'E:/Diablo2/legacy/bestiary'); out=root/'assets/wiki-pass-grim-a';out.mkdir(exist_ok=True)
rows=[r for r in json.loads((root/'assets/missing-wiki-images.json').read_text()) if r['game']=='grim-dawn'][:34]
extras=['Aether Crystal Formation','Deepmire Pureblood','Groble - Sky Clan Witchdoctor','Festerborn Bloodgorger']
candidates=list(dict.fromkeys([r['name'].replace(' ~ ',' - ') for r in rows]+extras))
def fetch(name):
 for wiki in ['grimdawn/ru','grimdawn']:
  for ext in ['png','jpg']:
   fn=name.replace(' ','_')+'.'+ext; h=hashlib.md5(fn.encode()).hexdigest();url=f'https://static.wikia.nocookie.net/{wiki}/images/{h[0]}/{h[:2]}/{fn}'
   try:
    r=requests.get(url,timeout=8);mime=r.headers.get('content-type','').split(';')[0]
    if r.status_code==200 and mime.startswith('image/') and len(r.content)>1500:
     file=out/(re.sub('[^a-z0-9]+','-',name.lower())+'.'+{'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}.get(mime,'img'));file.write_bytes(r.content)
     return {'name':name,'file':str(file.relative_to(root)).replace('\\','/'),'url':url,'filename':fn,'source':'https://grimdawn.fandom.com/'+('ru/' if '/ru' in wiki else '')+'wiki/File:'+fn,'mime':mime}
   except requests.RequestException:pass
 return None
found=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
 for x in ex.map(fetch,candidates):
  if x:found.append(x);print(x['name'],x['filename'],flush=True)
(out/'candidates.json').write_text(json.dumps(found,indent=2))
for start in range(0,len(found),12):
 batch=found[start:start+12]; sheet=Image.new('RGB',(1000,330*((len(batch)+3)//4)),(35,31,27));d=ImageDraw.Draw(sheet)
 for i,r in enumerate(batch):
  im=Image.open(root/r['file']).convert('RGBA');im.thumbnail((240,280));x=(i%4)*250;y=(i//4)*330;sheet.paste(im,(x+(250-im.width)//2,y),im);d.text((x+4,y+285),r['name'][:34],fill='white')
 sheet.save(out/f'sheet-{start//12}.jpg')
print('FOUND',len(found))

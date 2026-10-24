import hashlib,json,requests
from pathlib import Path
from urllib.parse import quote
root=Path(__file__).resolve().parents[1];out=root/'assets/wiki-pass-grim-b'
rows=[]
for id,name,fn in [('grim-dawn-fleshwarped-butcher','Aldanar, the Undying','Алданар, Бессмертный 01.jpg'),('grim-dawn-fleshwarped-thrasher','Crimson Bane','Алый бич 01.jpg')]:
 normalized=fn.replace(' ','_');h=hashlib.md5(normalized.encode()).hexdigest();url=f'https://static.wikia.nocookie.net/grimdawn/ru/images/{h[0]}/{h[:2]}/{quote(normalized)}'
 r=requests.get(url,timeout=20);mime=r.headers.get('Content-Type','').split(';')[0]
 if r.status_code==200 and mime.startswith('image/'):
  ext={'image/webp':'webp','image/jpeg':'jpg','image/png':'png'}.get(mime,'img');f=out/(id+'.'+ext);f.write_bytes(r.content)
  rows.append(dict(id=id,file=f.relative_to(root).as_posix(),url=url,source='https://grimdawn.fandom.com/ru/wiki/'+quote('Файл:'+normalized),label='Family reference - '+name+' (hero variant)',filename=fn,referenceKind='family',mime=mime,reviewNote='Hero creature genus explicitly listed at https://grimdawn.fandom.com/wiki/Hero_Creatures ; hero visual effects and coloring may differ from the ordinary variant.'))
(out/'extra-candidates.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf8')
print(len(rows))

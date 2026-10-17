import requests,json
from pathlib import Path
from urllib.parse import unquote,quote
p=Path(__file__).resolve().parent;root=p.parents[1]
rs=json.loads((p/'candidates.json').read_text())
urls=[('blood-disciple','Blood Disciple','https://static.wikia.nocookie.net/torchlight/images/b/bd/Disciple.png'),('mechanical-construct','Mechanical Construct','https://static.wikia.nocookie.net/torchlight/images/c/c4/Mechanical_Construct_1_%28T1%29.png'),('tu-tara',"Tu'tara",'https://static.wikia.nocookie.net/torchlight/images/a/a1/Tu%27Tara_Edgebreaker.png')]
for slug,name,url in urls:
 res=requests.get(url,timeout=20);res.raise_for_status();mime=res.headers.get('content-type','').split(';')[0];assert mime.startswith('image/')
 file=p/('torchlight-'+slug+'-observed.'+{'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime]);file.write_bytes(res.content)
 fn=unquote(url.rsplit('/',1)[1]);rs.append(dict(id='torchlight-'+slug,name=name,file=str(file.relative_to(root)).replace('\\','/'),filename=fn,url=url,source='https://torchlight.fandom.com/wiki/File:'+quote(fn),mime=mime))
(p/'candidates.json').write_text(json.dumps(rs,indent=2))

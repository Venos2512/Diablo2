"""Save reviewed enemy images from wiki image archives with provenance."""
import base64,hashlib,json,requests
from pathlib import Path

root=Path(__file__).resolve().parents[1]
entries=json.loads((root/'assets/wiki-probe.json').read_text(encoding='utf8'))
override={
 ('grim-dawn','Walking Dead'):('grimdawn/ru','WalkingDead.png'),
 ('grim-dawn','Rifthound'):('grimdawn/ru','Rifthound.png'),
}
skip={('grim-dawn','Rotting Soldier'),('grim-dawn','Deepmire Shaman')}
out=root/'assets/multiverse';out.mkdir(exist_ok=True)
def wiki_url(wiki,filename):
 h=hashlib.md5(filename.encode()).hexdigest()
 return f'https://static.wikia.nocookie.net/{wiki}/images/{h[0]}/{h[:2]}/{filename.replace(" ","_")}'
records={}
for entry in entries:
 key=(entry['game'],entry['name'])
 if key in skip:continue
 if key in override:wiki,filename=override[key];url=wiki_url(wiki,filename)
 elif entry['filename']:
  wiki={'grim-dawn':'grimdawn','titan-quest':'titanquest','torchlight':'torchlight','dungeon-siege':'dungeonsiege'}[entry['game']]
  filename=entry['filename'];url=entry['url']
 else:continue
 response=requests.get(url,headers={'User-Agent':'Mozilla/5.0'},timeout=25);response.raise_for_status()
 mime=response.headers.get('content-type','').split(';')[0]
 if not mime.startswith('image/') or len(response.content)<1000:raise RuntimeError(f'Invalid image {key} {mime}')
 safe=entry['game']+'-'+entry['name'].lower().replace(' ','-').replace("'",'')
 ext='.webp' if mime=='image/webp' else '.jpg' if mime=='image/jpeg' else '.png' if mime=='image/png' else '.gif'
 file=out/(safe+ext);file.write_bytes(response.content)
 page_wiki=wiki.replace('/ru','')
 file_page=f'https://{page_wiki}.fandom.com'+('/ru' if wiki.endswith('/ru') else '')+'/wiki/File:'+filename.replace(' ','_')
 records[entry['game']+'-'+entry['name'].lower().replace(' ','-').replace("'",'')]={
  'src':'data:'+mime+';base64,'+base64.b64encode(response.content).decode(),
  'file':str(file.relative_to(root)).replace('\\','/'),'url':url,'source':file_page,
  'label':'Wiki image · exact enemy or named boss','filename':filename,'bytes':len(response.content)
 }
(root/'src/data/multiverse-images.json').write_text(json.dumps(records,ensure_ascii=False),encoding='utf8')
(root/'assets/MULTIVERSE_IMAGE_SOURCES.json').write_text(json.dumps({k:{field:value for field,value in record.items() if field!='src'} for k,record in records.items()},indent=2),encoding='utf8')
print('Downloaded',len(records),'images; bytes',sum(x['bytes'] for x in records.values()))

"""Label official-manual and same-family illustrations where exact wiki art is absent."""
import base64,json
from pathlib import Path

root=Path(__file__).resolve().parents[1]
path=root/'src/data/multiverse-images.json'
images=json.loads(path.read_text(encoding='utf8'))
for item in images.values():item['referenceKind']='exact'

manual='https://cdn.akamai.steamstatic.com/steam/apps/4540/manuals/TQManual_US.pdf'
for name,filename,label in [
 ('Satyr','titan-quest-satyr-manual.png','Official manual · Satyr family art'),
 ('Satyr Guardian','titan-quest-satyr-manual.png','Official manual · Satyr family art; Guardian variant not depicted'),
 ('Centaur','titan-quest-centaur-manual.png','Official manual · Centaur family art'),
 ('Arachnos','titan-quest-arachnos-manual.png','Official manual · Arachnos family art'),
]:
 file=root/'assets/multiverse'/filename
 images['titan-quest-'+name.lower().replace(' ','-')]={'src':'data:image/png;base64,'+base64.b64encode(file.read_bytes()).decode(),
 'file':str(file.relative_to(root)).replace('\\','/'),'url':manual,'source':manual,'label':label,
 'filename':filename,'bytes':file.stat().st_size,'referenceKind':'manual'}

representatives={
 'grim-dawn-plague-walker':'grim-dawn-walking-dead',
 'grim-dawn-rotting-soldier':'grim-dawn-walking-dead',
 'grim-dawn-deepmire-shaman':'grim-dawn-deepmire-warrior',
 'titan-quest-gorgon':'titan-quest-gorgon-queens',
 'torchlight-ratlin-foreman':'torchlight-ratlin',
 'dungeon-siege-krug-scout':'dungeon-siege-krug-grunt',
 'dungeon-siege-krug-shaman':'dungeon-siege-krug-grunt',
 'dungeon-siege-alpha-wolf':'dungeon-siege-gray-wolf',
 'dungeon-siege-jade-gargoyle':'dungeon-siege-gargoyle',
 'dungeon-siege-ruby-gargoyle':'dungeon-siege-gargoyle',
}
for target,source in representatives.items():
 item={**images[source]};item['label']=f'Wiki family image · depicts {source.split("-",2)[-1].replace("-"," ").title()}, not the exact variant';item['referenceKind']='family';item['depicts']=source
 images[target]=item

path.write_text(json.dumps(images,ensure_ascii=False),encoding='utf8')
(root/'assets/MULTIVERSE_IMAGE_SOURCES.json').write_text(json.dumps({k:{field:value for field,value in record.items() if field!='src'} for k,record in images.items()},indent=2),encoding='utf8')
print('Illustrated',len(images),'of 49; exact wiki',sum(x['referenceKind']=='exact' for x in images.values()),'manual',sum(x['referenceKind']=='manual' for x in images.values()),'family',sum(x['referenceKind']=='family' for x in images.values()))

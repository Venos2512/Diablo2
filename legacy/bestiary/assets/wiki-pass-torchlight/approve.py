import json
from pathlib import Path
p=Path(__file__).resolve().parent
rs=json.loads((p/'candidates.json').read_text());byfn={r['filename']:r for r in rs}
mapping={
'rock-troll':('Troll_(T1).png','family','Torchlight I Troll — family reference; Rock Troll variant not confirmed'),
'blood-disciple':('Disciple.png','exact','Blood Disciple — Torchlight I wiki render'),
'burrower':('Burrower.png','exact','Burrower — Torchlight I wiki render'),
'construct':('Construct.png','exact','Construct — Torchlight I wiki render'),
'crawler':('Crawler_1.png','exact','Crawler — Torchlight I wiki screenshot'),
'dark-zealot':('Dark_Zealot_1.png','exact','Dark Zealot — Torchlight I wiki screenshot'),
'dragonkin':('Dragonkin.png','exact','Dragonkin — Torchlight I wiki render'),
'dwarf':('Soulless_Cutter.png','family','Soulless Cutter — Torchlight I Dwarf family reference'),
'elemental':('Elemental.png','exact','Elemental — Torchlight I wiki render'),
'felwing':('Felwing_2.png','exact','Felwing — Torchlight I wiki screenshot'),
'goblin':('Goblin_Hunter.png','family','Goblin Hunter — Torchlight I Goblin family reference'),
'goblin-hound':('Goblin_Hound.png','exact','Goblin Hound — Torchlight I wiki render'),
'goblin-hunter':('Goblin_Hunter.png','exact','Goblin Hunter — Torchlight I wiki screenshot'),
'lich':('Lich.png','exact','Lich — Torchlight I wiki render'),
'mechanical-construct':('Mechanical_Construct_1_(T1).png','exact','Mechanical Construct — Torchlight I wiki screenshot'),
'mimic':('Mimic.png','exact','Mimic — Torchlight I wiki render'),
'phase-beast':('Phasebeast.png','exact','Phase Beast — Torchlight I spectral Goblin Hound'),
'skeleton':('Skeleton.png','exact','Skeleton — Torchlight I wiki render'),
'spectre':('Spectre.png','exact','Spectre — Torchlight I wiki render'),
'strider':('Strider.png','exact','Strider — Torchlight I wiki render'),
'tattered-lurker':('Tattered_Lurker_2.png','exact','Tattered Lurker — Torchlight I wiki screenshot'),
'troll':('Troll_(T1).png','exact','Troll — Torchlight I wiki screenshot'),
'tu-tara':("Tu'Tara_Edgebreaker.png",'family',"Tu'Tara Edgebreaker — Torchlight I Tu'tara family reference"),
'zombie':('Zombie.png','exact','Zombie — Torchlight I wiki render')}
out=[]
for slug,(fn,kind,label) in mapping.items():
 r=byfn[fn].copy();r['id']='torchlight-'+slug;r['referenceKind']=kind;r['label']=label
 r['reviewNote']='Visually inspected in review.jpg. Wiki image and original-game taxonomy checked; no Torchlight II substitutions.'
 if slug=='rock-troll':r['reviewNote']+=' Orden Mines identifies Rock Troll as a weaker Troll; this is a family reference, not the exact Rock Troll variant.'
 if slug=='goblin':r['reviewNote']+=' Generic Goblin.png is Torchlight II and rejected. T1 Goblin Hunter is explicitly named as representative.'
 if slug=='dwarf':r['reviewNote']+=' Lost Fortress identifies Soulless Cutter as a dwarf. Variant explicitly labeled.'
 if slug=='tu-tara':r['reviewNote']+=' Page places Edgebreaker image in In Torchlight I gallery; generic main TuTara brute is T2 and rejected.'
 if slug=='zombie':r['reviewNote']+=' Main wiki image revision timestamp 20110409120708 predates Torchlight II.'
 out.append(r)
(p/'approved.json').write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding='utf8')
(p/'unresolved.json').write_text(json.dumps([{'id':'torchlight-cursed-sword','reason':'The Cursed Sword wiki page has no Torchlight I illustration. Its only image Ss_cursedSword1.jpg is explicitly under In Torchlight II, so it was rejected. Filename searches did not find a verified T1 reference.','source':'https://torchlight.fandom.com/wiki/Cursed_Sword'}],indent=2))
print('Approved',len(out),'exact',sum(r['referenceKind']=='exact' for r in out),'family',sum(r['referenceKind']=='family' for r in out))

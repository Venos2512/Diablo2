"""Record the manually reviewed Grim Dawn B candidates and justified genus references."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1];out=root/'assets/wiki-pass-grim-b'
candidates=json.loads((out/'candidates.json').read_text(encoding='utf8'))
by={r['id']:r for r in candidates if 'failed' not in r}
approved=[]
names={r['id']:r['name'] for r in json.loads((root/'assets/missing-wiki-images.json').read_text())}
for row in candidates:
 if row.get('id') not in names:continue
 approved.append(dict(row,referenceKind='exact',label='Wiki image - '+names[row['id']],reviewNote='Visually reviewed the named wiki file on the contact sheet; creature render or named-boss screenshot, not an item icon.'))
family=[
 ('bloodsworn-doomsayer','bloodsworn-priest','Bloodsworn Priest','Bloodsworn caster genus; this is a Priest reference, not a verified Doomsayer model.','https://grimdawn.fandom.com/wiki/Bloodsworn'),
 ('salazar-s-harbinger','chthonian-harbinger','Chthonian Harbinger','Salazar summon is a Chthonian Harbinger; this generic image does not verify the summon variant.','https://grimdawn.fandom.com/wiki/Salazar%27s_Sovereign_Blade'),
 ('obsidian-shaleborn','obsidian-defiler-ref','Obsidian Defiler','Obsidian Defiler genus; color and tier differences are not verified.','https://grimdawn.fandom.com/wiki/Chthonic'),
 ('voidfiend','voidfiend-hellion','Voidfiend Hellion','Chthonian Fiend genus; Hellion art is not verified as the base Voidfiend.','https://grimdawn.fandom.com/wiki/Chthonic'),
 ('voidfiend-incinerator','voidfiend-hellion','Voidfiend Hellion','Chthonian Fiend genus; Hellion art is not verified as the Incinerator.','https://grimdawn.fandom.com/wiki/Chthonic'),
 ('mireborn-bloodfiend','bloodgorger-ref','Festerborn Bloodgorger','Mosquito genus reference from a Festerborn variant; exact Mireborn coloring and body are unverified.','https://grimdawn.fandom.com/wiki/Insectoid'),
]
for variant in ['scrapheap','acidbile','stormscale','bladespine','infested','swarmborn']:
 family.append((variant+'-rift-scourge','rift-scourge-ref','Pale Cavern Crawler','Rift Scourge genus reference from an Act III Pale Cavern Crawler; does not verify this Act I variant.','https://grimdawn.fandom.com/wiki/Rift_Scourge'))
for target,ref,depicted,note,evidence in family:
 row=dict(by['grim-dawn-'+ref]);row.update(id='grim-dawn-'+target,referenceKind='family',label='Family reference - '+depicted+' (not the exact variant)',reviewNote=note+' Genus evidence: '+evidence)
 approved.append(row)
old=json.loads((root/'assets/MULTIVERSE_IMAGE_SOURCES.json').read_text(encoding='utf8'))['grim-dawn-dranghoul-tyrant']
approved.append(dict(old,id='grim-dawn-dranghoul-enforcer',mime='image/webp',referenceKind='family',label='Family reference - Dranghoul Tyrant (not the exact Enforcer)',reviewNote='Visually reviewed existing Tyrant screenshot. Both are Dranghoul variants; armor and body details may differ. Genus evidence: https://grimdawn.fandom.com/wiki/Groble'))
(out/'approved.json').write_text(json.dumps(approved,indent=2,ensure_ascii=False),encoding='utf8')
(out/'unresolved.json').write_text(json.dumps([{'id':'grim-dawn-devouring-swarm','reason':'Wiki searches expose the same-named Shaman skill and individual mosquito images, not a verified enemy swarm; no misleading fallback assigned.'}],indent=2),encoding='utf8')
print('Approved',len(approved),'exact',sum(x['referenceKind']=='exact' for x in approved),'family',sum(x['referenceKind']=='family' for x in approved))

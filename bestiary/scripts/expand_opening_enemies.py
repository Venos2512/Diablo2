"""Curated research additions, reviewed 2026-10-16. No inferred spawn statistics."""
import json,re
from pathlib import Path

root=Path(__file__).resolve().parents[1]
rows=[]
def add(game,name,family,role,location,page,description='',kind='regular',condition=''):
    wiki={'grim-dawn':'grimdawn','titan-quest':'titanquest','dungeon-siege':'dungeonsiege'}[game]
    source=page if page.startswith('https:') else f'https://{wiki}.fandom.com/wiki/{page}'
    rows.append(dict(game=game,name=name,family=family,role=role,location=location,source=source,
      description=description or f'{name} is listed among the {family.lower()} enemies in {location}.',
      kind=kind,condition=condition,reviewedAt='2026-10-16'))

g='grim-dawn'
for name in ['Corruption','Overseer','Overmind','Fury','Cold One','Rotting Emberguard','Corpsefiend','Tainted Hound','Fleshwarped Thrasher']:
    add(g,name,'Aether corruption','Enemy variant','Burrwitch Village','Burrwitch_Village')
add(g,'Aether Crystal Cluster','Aetherial','Hostile object','Burrwitch Village','Burrwitch_Village')
for name in ['Reanimator','Dominator']:
    add(g,name,'Aether corruption','Caster reference','Hidden Laboratory','Hidden_Laboratory')
for name in ['Dreadweave Arachnid','Dreadweave Spitter','Dreadweave Leaper','Dreadweave Widow','Dreadweave Matriarch','Spiderling']:
    add(g,name,'Arachnid','Enemy variant','Burrwitch Outskirts; Ominous Lair','Ominous_Lair')
for name in ['Boneback','Boneback Gnasher','Rabid Boneback','Boneback Plaguebearer']:
    add(g,name,'Beast','Enemy variant','Lower Crossing; Burrwitch Outskirts','Lower_Crossing')
for name in ['Scavenger','Frenzied Scavenger','Scavenger Alpha']:
    add(g,name,'Beast','Enemy variant','River Passage','River_Passage')
for name in ['Deepmire Vanguard','Deepmire Champion','Deepmire Scourge-Tamer','Deepmire Evocator']:
    add(g,name,'Slith / beastkin','Enemy variant','River Passage','River_Passage')
for name in ['Groble ~ Snake Clan Scavenger','Groble ~ Snake Clan Tracker','Groble ~ Snake Clan Warrior','Groble ~ Snake Clan Champion','Groble ~ Snake Clan Witchdoctor','Groble ~ Snake Clan Venomancer']:
    add(g,name,'Groble / beastkin','Enemy variant','Burrwitch Outskirts','Burrwitch_Outskirts')
for name in ['Dranghoul Enforcer','Dranghoul Tyrant']:
    add(g,name,'Dranghoul / beastkin','Enemy variant','Burrwitch Outskirts','Burrwitch_Outskirts')
for name in ['Bloodsworn Adulant','Bloodsworn Zealot','Bloodsworn Priest','Bloodsworn Summoner','Bloodsworn Void-Caller','Bloodsworn Doomsayer']:
    add(g,name,'Bloodsworn cultist','Enemy variant','Depraved Sanctuary','Depraved_Sanctuary',condition='Optional dungeon; Strange Key required.')
for name in ['Chthonian Devourer','Chthonian Harbinger',"Salazar's Harbinger",'Obsidian Shaleborn','Voidfiend','Voidfiend Incinerator','Voidfiend Hellion']:
    add(g,name,'Chthonic','Enemy variant','Depraved Sanctuary','Depraved_Sanctuary',condition='Optional dungeon; Strange Key required.')
for name in ['Mireborn Bloodfiend','Devouring Swarm']:
    add(g,name,'Insectoid','Enemy variant','The Flooded Passage','The_Flooded_Passage')
for name in ['Briarthorn Horror','Briarthorn Terror','Carrion Raptor ~ Hatchling','Carrion Raptor ~ Hunter','Carrion Raptor ~ Screecher','Carrion Raptor ~ Viper Lord']:
    add(g,name,'Riftspawn','Enemy variant','Burrwitch Outskirts','Burrwitch_Outskirts')
for name in ['Rifthound - Howler','Rifthound - Azure Matriarch']:
    add(g,name,'Riftspawn','Enemy variant','The Flooded Passage','The_Flooded_Passage')
for name in ['Scrapheap Rift Scourge','Acidbile Rift Scourge','Stormscale Rift Scourge','Bladespine Rift Scourge','Infested Rift Scourge','Swarmborn Rift Scourge']:
    add(g,name,'Rift Scourge','Enemy variant','Hidden Laboratory','Hidden_Laboratory')
for name,place in [
 ('Viloth, the Corruptor',"Devil's Crossing"),('Kyzogg the Reanimator','Burial Hill / Burial Cave'),
 ('Pusquill the Hoarder','Lower Crossing'),('Ellena, the First Slith',"Hargate's Laboratory"),
 ('Primordian, the Forgotten One','Foggy Bank'),('Ancient Shambler','The Flooded Passage'),
 ('High Priest Rolderathis','The Flooded Passage / Sunken Reliquary'),("Salazar, Blade of Ch'thon",'Depraved Sanctuary'),
 ('Gutworm, the Maneater',"Burrwitch Outskirts / Smuggler's Basin"),('Balegor, the Swamp King','East Marsh'),
 ("Uroboruuk's Guardian",'East Marsh'),('Kalis Ka, the Bonehunter','East Marsh')]:
    add(g,name,'Named encounter','Boss',place,'Creatures',f'{name} is listed in the Act I unique-boss index. Its named encounter should be planned separately from regular creature variants.',kind='boss',condition='Includes optional Act I areas; encounter access and level requirements vary.')

g='titan-quest'
families=[('Automatoi','Construct'),('Boar','Beast'),('Boarman','Beastman'),('Carrion Bird','Beast'),('Cave Bat','Beast'),('Cyclops','Giant'),('Eurynomus','Demon'),('Giant Turtle','Beast'),('Ichthian','Beastman'),('Limos','Demon'),('Orthus','Beast'),('Skeleton','Undead'),('Spider','Arachnid'),('Trap','Construct'),('Wraith','Undead'),('Zombie','Undead')]
for name,family in families:
    add(g,name,family,'Species / family','Greece / Act I','Category:Monster_(Greece)',f'{name} is included in the Greece monster category. This is a family reference; regional variants and exact encounters require individual review.')
for name,family,place,condition in [
 ('Arachne','Arachnid','Olive Grove',''),('Alastor','Undead','Athens Catacombs, level 5',''),
 ('Talos','Construct','Knossos Palace','Epic and Legendary difficulty.'),('Lernean Hydra','Mythic beast','Athens Marsh','Legendary difficulty only.')]:
    add(g,name,family,'Boss',place,'Majestic_Chest',f'{name} is a named Act I encounter associated with {place}.',kind='boss',condition=condition)
add(g,'Dark Satyr ~ Shaman','Beastman','Quest boss','Helos Woods','Helos_Woods','The quest enemy encountered during A Troubled Village; the wiki describes its fighting style as fire-magic oriented.',kind='boss')

g='dungeon-siege'
for name,family,role,place,page,desc in [
 ('Brankar the Scavenger','Krug','Miniboss','Farmlands; Edgaar’s basement','https://www.walkthroughking.com/text/dungeonsiege.aspx','A named Krug encountered while clearing the basement for Edgaar.'),
 ('Klandank the Krug','Krug','Miniboss','Farmlands; optional cave','Klandank_the_Krug','A large Krug Scout miniboss with red-orange skin, a green aura and a dagger.'),
 ('Huskar the Shaman','Krug','Miniboss caster','Path to Stonebridge; tower','https://fliphtml5.com/gjox/bovx/Dungeon_Siege_1_-_CustomWalkthrough/','A named shaman encountered in the tower on the route from the crypt to Stonebridge.'),
 ('Futak the Trainer','Krug','Miniboss','Path to Stonebridge; coastal camp','Unique_drop','A Krug miniboss near Stonebridge associated with the Krohars Buckler drop.'),
 ('Bear','Wildlife','Melee','Farmlands; bear cave','Unique_drop','The bear in a cave near the large farm is associated with the Altans Leather drop.')]:
    add(g,name,family,role,place,page,desc,kind='regular' if name=='Bear' else 'unique')
# The chapter table combines Ehb and Utraean areas; do not silently assign this
# entry to Ehb. Its scope note is surfaced in the record.
add(g,'Phrak Ballista','Flying creature','Ranged miniboss','Chapter I index; Ehb location unconfirmed','Phrak','A red, glowing Phrak miniboss accompanied by Phrak Piercers. The chapter index combines campaign areas; Ehb placement remains unconfirmed.',kind='unique',condition='The specific location independently found is Iliarth Divide (Utraean Peninsula). Included as a chapter-index reference with campaign uncertainty.')

(root/'src/data/research-additions.json').write_text(json.dumps(rows,indent=2,ensure_ascii=False),encoding='utf8')
print('Added research records:',len(rows))
for game in ['grim-dawn','titan-quest','dungeon-siege']:print(game,sum(r['game']==game for r in rows))

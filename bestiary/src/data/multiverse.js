// Opening-chapter enemy references. These are source-backed art-planning entries,
// not exhaustive spawn tables or claims about shared production assets.
import images from './multiverse-images.json' with {type:'json'};
import research from './research-additions.json' with {type:'json'};
import {enemyArtProfile} from './enemy-art-profiles.js';
export const games=[
 {id:'diablo-ii',name:'Diablo II',scope:'Act I'},
 {id:'grim-dawn',name:'Grim Dawn',scope:'Act I · Devil’s Crossing to Warden’s Laboratory'},
 {id:'titan-quest',name:'Titan Quest',scope:'Act I · Greece'},
 {id:'torchlight',name:'Torchlight',scope:'Torchlight I · game-wide monster index'},
 {id:'dungeon-siege',name:'Dungeon Siege',scope:'Chapter I · Stonebridge'},
];
const gd='https://grimdawn.fandom.com/wiki/Creatures';
const wight='https://grimdawn.fandom.com/wiki/Wightmire';
const tq='https://cdn.akamai.steamstatic.com/steam/apps/4540/manuals/TQManual_US.pdf';
const tqBoss='https://almarsguides.com/Computer/Games/TitanQuest/Walkthrough/Act1/UnderTheLabyrinth/';
const tqHeroes='https://titanquest.fandom.com/wiki/Category:Act_I_Hero_Monsters';
const tl='https://torchlight.fandom.com/wiki/Orden_Mines';
const tlCategory='https://torchlight.fandom.com/wiki/Category:Monsters_(T1)';
const ds='https://dungeonsiege.fandom.com/wiki/Enemies_(Dungeon_Siege)';
// name, family, role, location, kind, source
const sets={
 'grim-dawn':[
  ['Walking Dead','Aether corruption','Melee','Wightmire','regular',wight],
  ['Wretcher','Aether corruption','Melee','Wightmire','regular',wight],
  ['Burning Dead','Aether corruption','Fire','Wightmire','regular',wight],
  ['Plague Walker','Aether corruption','Poison','Wightmire','regular',wight],
  ['Rotting Soldier','Aether corruption','Armed melee','Wightmire','regular',wight],
  ['Fleshwarped Butcher','Aether corruption','Heavy melee','Wightmire','regular',wight],
  ['Deepmire Warrior','Slith / beastkin','Melee','Wightmire','regular',wight],
  ['Deepmire Shaman','Slith / beastkin','Caster','Wightmire','regular',wight],
  ['Mireborn Bloodgorger','Insectoid','Melee','Wightmire','regular',wight],
  ['Rifthound','Riftspawn','Fast melee','Wightmire','regular',wight],
  ['Aether Crystal','Aetherial','Hostile object','Wightmire','regular',wight],
  ['Warden Krieg','Act boss','Boss','Hidden Laboratory','boss','https://grimdawn.fandom.com/wiki/The_Warden_(creature)'],
 ],
 'titan-quest':[
  ['Satyr','Beastman','Melee','Greece wilderness','regular',tq],
  ['Satyr Guardian','Beastman','Heavy melee','Greece wilderness','regular',tq],
  ['Centaur','Beastman','Melee','Greece woodlands','regular',tq],
  ['Arachnos','Beastman','Melee','Greece woodland and caves','regular',tq],
  ['Harpy','Mythic beast','Aerial','Greece','regular',tqHeroes],
  ['Maenad','Beastman','Fast melee','Greece','regular',tqHeroes],
  ['Gorgon','Mythic beast','Petrification','Pythian Caves','regular','https://www.gamebanshee.com/titanquest/walkthrough/pythiancaves.php'],
  ['Nessus','Centaur','Boss','Greece','boss','https://almarsguides.com/Computer/Games/TitanQuest/Walkthrough/Act1/'],
  ['Polyphemus','Cyclops','Boss','Near Megara','boss','https://almarsguides.com/Computer/Games/TitanQuest/Walkthrough/Act1/'],
  ['Gorgon Queens','Gorgon','Boss group','Pythian Caves','boss','https://www.gamebanshee.com/titanquest/walkthrough/pythiancaves.php'],
  ['Minotaur Lord','Minotaur','Boss','Minoan Labyrinth','boss',tqBoss],
  ['Megalesios','Telkine','Act boss','Minoan Labyrinth','boss',tqBoss],
 ],
 'torchlight':[
  ['Ratlin','Mine-dweller','Melee','Orden Mines','regular',tl],
  ['Ratlin Foreman','Mine-dweller','Elite melee','Orden Mines','regular',tl],
  ['Rock Troll','Troll','Heavy melee','Orden Mines','regular',tl],
  ['Varkolyn','Undead','Melee','Orden Mines','regular',tl],
  ['Shadow Recluse','Arachnid','Melee','Orden Mines','regular',tl],
  ['Azure Gel','Gel','Melee','Orden Mines','regular',tl],
  ['Brink the Corrupted','Corrupted ally','Boss','Orden Mines, floor 4','boss',tl],
  // The linked T1 category is game-wide. These are category-level species/family
  // references; the wiki category alone does not verify a specific dungeon floor.
  ...[
   ['Blood Disciple','Cultist'],['Burrower','Burrowing beast'],['Construct','Construct'],
   ['Crawler','Crawler'],['Cursed Sword','Animated object'],['Dark Zealot','Cultist'],
   ['Dragonkin','Dragonkin'],['Dwarf','Dwarf'],['Elemental','Elemental'],
   ['Felwing','Flying creature'],['Gel','Gel'],['Goblin','Goblin'],
   ['Goblin Hound','Goblin beast'],['Goblin Hunter','Goblin'],['Lich','Undead'],
   ['Mechanical Construct','Construct'],['Mimic','Mimic'],['Phase Beast','Phase Beast'],
   ['Skeleton','Undead'],['Spectre','Undead'],['Spider','Arachnid'],
   ['Strider','Strider'],['Tattered Lurker','Undead'],['Troll','Troll'],
   ["Tu'tara",'Reptilian'],['Tunnel Spider','Arachnid'],['Zombie','Undead'],
  ].map(([name,family])=>[name,family,'Species / family','Torchlight I · area not verified','regular',tlCategory]),
 ],
 'dungeon-siege':[
  ['Krug Apprentice','Krug','Caster / resurrection','Farmlands','regular','https://dungeonsiege.fandom.com/wiki/Krug_Apprentice'],
  ['Krug Scavenger','Krug','Melee','Road to Stonebridge','regular',ds],
  ['Krug Grunt','Krug','Melee','Road to Stonebridge','regular',ds],
  ['Krug Scout','Krug','Melee','Road to Stonebridge','regular','https://dungeonsiege.fandom.com/wiki/List_of_Enemies_-_Regular_(Dungeon_Siege)'],
  ['Krug Shaman','Krug','Caster','Road to Stonebridge','regular',ds],
  ['Krug Dog','Krug beast','Fast melee','Road to Stonebridge','regular',ds],
  ['Phrak','Flying creature','Aerial','Road to Stonebridge','regular',ds],
  ['Phrak Piercer','Flying creature','Aerial / ranged','Road to Stonebridge','regular','https://dungeonsiege.fandom.com/wiki/Phrak'],
  ['Farm Skrubb','Wildlife','Melee','Farmlands','regular',ds],
  ['Black Skrubb','Wildlife','Melee','Road to Stonebridge','regular',ds],
  ['Gray Wolf','Wildlife','Melee','Road to Stonebridge','regular',ds],
  ['Alpha Wolf','Wildlife','Melee','Road to Stonebridge','unique',ds],
  ['Skeleton','Undead','Melee','Crypt of the Sacred Blood','regular',ds],
  ['Skeleton Guard','Undead','Armed melee','Crypt of the Sacred Blood','regular',ds],
  ['Skeleton Captain','Undead','Elite melee','Crypt of the Sacred Blood','regular',ds],
  ['Gargoyle','Construct','Melee','Crypt of the Sacred Blood','regular',ds],
  ['Jade Gargoyle','Construct','Melee','Crypt of the Sacred Blood','regular',ds],
  ['Ruby Gargoyle','Construct','Miniboss','Crypt of the Sacred Blood','unique',ds],
 ],
};
const gameById=Object.fromEntries(games.map(g=>[g.id,g]));
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(const row of research)sets[row.game].push([row.name,row.family,row.role,row.location,row.kind,row.source]);
const researchById=Object.fromEntries(research.map(row=>[`${row.game}-${slug(row.name)}`,row]));
export const multiverseGroups=games.slice(1).flatMap(game=>[...new Set(sets[game.id].map(row=>row[1]))].map(family=>({id:`${game.id}-${slug(family)}`,name:`${game.name} · ${family}`})));
export const multiverseGroupById=Object.fromEntries(multiverseGroups.map(group=>[group.id,group]));
export const multiverseEnemies=games.slice(1).flatMap((game,gameIndex)=>sets[game.id].map(([name,family,role,location,kind,source],i)=>({
 id:`${game.id}-${slug(name)}`,index:200+gameIndex*1000+i,name,type:'creature',game:game.id,act:game.scope,
 group:`${game.id}-${slug(family)}`,role,kind,location,source,status:'reference',
 description:source===tlCategory?`${name} is a Torchlight I monster-category reference, cataloged under ${family.toLowerCase()} for comparative art planning. Its dungeon placement has not been verified.`:`${name} is an opening-chapter enemy reference from ${game.name}, cataloged under ${family.toLowerCase()} for comparative art planning.`,
 art:`Study the source for silhouette, material, scale, weapon or attack language, and readable motion states. This record does not claim an extracted model or animation count.`,
 base:`${game.name} · ${game.scope}`,scope:source===tlCategory?'Game-wide wiki category; individual variants and dungeon placement have not been audited.':'Curated chapter reference; individual variants and spawn conditions have not been exhaustively audited.',
 image:images[`${game.id}-${slug(name)}`]||{src:null,file:null,source,label:'No verified image linked'},media:{model:null,clips:[]},motions:[],tags:[game.name,game.scope,family,role],
 }))).map(enemy=>{
 const researchRow=researchById[enemy.id];
 const family=sets[enemy.game].find(row=>row[0]===enemy.name)[1];
 const profile=enemyArtProfile(family,enemy.role);
 return {...enemy,...profile,
  description:enemy.id==='grim-dawn-warden-krieg'?'The final Act I encounter has a human stage followed by a mutated stage. Plan the two silhouettes, the transition and separate effect references.':enemy.id==='dungeon-siege-krug-apprentice'?'A green-cloaked Krug caster using Zap and resurrection, with a melee fallback at close range.':researchRow?.description||enemy.description,
  condition:researchRow?.condition||'',reviewedAt:researchRow?.reviewedAt||null,
  scope:researchRow?'Source-backed chapter reference; difficulty, access and campaign conditions are listed when documented.':enemy.scope,
  tags:[...enemy.tags,...(researchRow?.condition?[researchRow.condition]:[])],
 };
});

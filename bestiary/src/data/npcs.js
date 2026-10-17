import images from './npc-images.json';

export const npcGroups=[
 {id:'town-services',name:'Town services'},
 {id:'quest-travel',name:'Quest & travel'},
 {id:'rogue-defenders',name:'Rogue defenders'},
];
export const npcGroupById=Object.fromEntries(npcGroups.map(group=>[group.id,group]));
const N='https://classic.battle.net/diablo2exp/npcs/act1.shtml';
const Q='https://classic.battle.net/diablo2exp/quests/act1.shtml';
const H='https://classic.battle.net/diablo2exp/basics/hirelings.shtml';

// Seven named Act I NPCs from Blizzard's NPC index, plus one hireling archetype.
const rows=[
 ['Akara','town-services','Priestess · healer & magic vendor','Rogue Encampment','A Rogue priestess who heals the player and trades magical supplies. She introduces the Den of Evil and guides the Search for Cain.','Priestess silhouette, layered robes and a readable healer identity. Plan idle, talk, healing and trade presentation separately; the source GIF is only a page reference.',['Den of Evil','The Search for Cain'],N],
 ['Charsi','town-services','Blacksmith · repair & trade','Rogue Encampment','The Rogue blacksmith repairs and sells equipment. Her Tools of the Trade quest asks the player to recover the Horadric Malus from the Barracks.','Forge-worker proportions, apron, tools and soot wear should distinguish her from armed Rogues. Plan idle, talk, hammering and repair interactions.',['Tools of the Trade'],Q],
 ['Deckard Cain','quest-travel','Horadrim sage · identification','Tristram → Rogue Encampment','A Horadrim scholar held in Tristram until rescued. In camp, he identifies items and provides lore and quest guidance.','Elderly scholar silhouette, robes and staff. Keep the captive Tristram state distinct from his camp service state. Plan idle, talk, rescue and identification beats.',['The Search for Cain','Sisters to the Slaughter'],N],
 ['Flavie','rogue-defenders','Rogue sentry','Cold Plains approach','A Rogue sentry who warns travelers of danger beyond the Den of Evil.','The official Act I NPC page uses a Rogue GIF for Flavie. Treat her as a named sentry while tracking shared Rogue visual language. Plan guard idle, warning talk and alert pose.',['Road warning'],N],
 ['Gheed','town-services','Merchant · gambling','Rogue Encampment','A traveling merchant who sells equipment and offers unidentified items through gambling.','Merchant silhouette, carried stock and trading props should be distinct from Charsi’s forge. Plan idle, talk, trade and gamble presentation.',['Trade','Gamble'],N],
 ['Kashya','rogue-defenders','Mercenary captain','Rogue Encampment','The Rogue captain assigns the Sisters’ Burial Grounds quest and recruits Rogue hirelings after Blood Raven is defeated.','Commanding Rogue silhouette, practical armor and bow-related details. Distinguish her rank from Flavie and the generic scout. Plan idle, talk, command and hire presentation.',["Sisters' Burial Grounds",'Hire Rogue Scouts'],N],
 ['Warriv','quest-travel','Caravan leader · Act travel','Rogue Encampment','The caravan leader enables travel east to Lut Gholein after Act I is completed.','Traveler silhouette, layered road clothing and caravan props. Plan idle, talk and departure presentation.',['Travel to Act II'],N],
 ['Rogue Scout','rogue-defenders','Hireling archetype · ranged support','Rogue Encampment → field','An Act I Rogue hireling recruited through Kashya. She fights with a bow and may use fire or cold arrows. This is an archetype, not an eighth named town NPC.','Reuse the Rogue visual family where appropriate, but track hireling gear, bow, run and attack poses independently. The official GIF does not establish a complete animation set.',['Hireling'],H],
];
const motionPlans={
 Akara:['Idle','Talk','Heal gesture','Trade gesture'],
 Charsi:['Idle','Talk','Hammer at forge','Repair handoff'],
 'Deckard Cain':['Captive idle','Camp idle','Talk','Identify gesture'],
 Flavie:['Guard idle','Talk warning','Alert pose'],
 Gheed:['Idle','Talk','Trade gesture','Gamble reveal'],
 Kashya:['Command idle','Talk','Hire gesture'],
 Warriv:['Idle','Talk','Caravan departure'],
 'Rogue Scout':['Idle','Run','Bow attack','Hit reaction','Death'],
};

export const act1Npcs=rows.map((row,i)=>{
 const [name,group,role,location,description,art,quests,source]=row;
 return {id:'npc-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),index:192+i,name,type:'npc',act:'Act I',group,role,location,description,art,quests,source,status:'reference',kind:'character',image:images[name],base:'',media:{model:null,clips:[]},motions:motionPlans[name],tags:[group,role,...quests,'Act I NPC'],scope:name==='Rogue Scout'?'Hireling archetype':'Named Act I NPC'};
});

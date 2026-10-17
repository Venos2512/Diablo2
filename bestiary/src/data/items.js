import images from './item-images.json';
import earlyGear from './early-gear.json';
import miscItems from './misc-items.json';
export const itemGroups=[
 {id:'quest',name:'Quest & special',color:'#b69361'},
 {id:'consumable',name:'Potions',color:'#a57568'},
 {id:'weapon',name:'Weapons',color:'#8d96a3'},
 {id:'armor',name:'Armor & equipment',color:'#8c9a80'},
 {id:'socketable',name:'Gems & runes',color:'#a388ba'},
 {id:'utility',name:'Scrolls & supplies',color:'#9a8a73'},
 {id:'accessory',name:'Jewelry',color:'#bca577'},
];
export const itemGroupById=Object.fromEntries(itemGroups.map(g=>[g.id,g]));
// This is a curated Act I reference set, not an exhaustive randomized loot table.
// name | group | subtype | description | art note | context | source page
const Q='https://classic.battle.net/diablo2exp/quests/act1.shtml';
const C='https://classic.battle.net/diablo2exp/quests/cow.shtml';
const rows=[
 ['Tree of Inifuss Bark','quest','Quest object','Inscribed bark collected during The Search for Cain.','The included image represents the quest, not the inventory icon. Replace it when a verified icon is sourced.','Dark Wood',Q],
 ['Horadric Malus','quest','Quest object','Charsi’s enchanted smithing hammer, recovered during Tools of the Trade.','The included image represents the quest, not the inventory icon. Verify the hammer silhouette before production.','Barracks',Q],
 ["Wirt's Leg",'quest','Special object','A wooden leg found in Tristram and used in the Secret Cow Level recipe.','No verified inventory icon is linked yet. Treat the object’s inventory art and world appearance separately.','Tristram',C],
 ['Minor Healing Potion','consumable','Healing potion','The smallest red potion in the healing family.','Keep the bottle shape and red liquid distinct at inventory scale.','Act I consumable reference',''],
 ['Light Healing Potion','consumable','Healing potion','A low-tier red potion in the healing family.','Differentiate capacity from Minor Healing through bottle and fill level.','Act I consumable reference',''],
 ['Minor Mana Potion','consumable','Mana potion','The smallest blue potion in the mana family.','Readability depends on blue liquid and consistent bottle family styling.','Act I consumable reference',''],
 ['Light Mana Potion','consumable','Mana potion','A low-tier blue potion in the mana family.','Keep its form related to Minor Mana while showing greater capacity.','Act I consumable reference',''],
 ['Rejuvenation Potion','consumable','Rejuvenation','A purple potion that restores both Life and Mana.','Purple must stay legible beside red and blue potions.','Act I consumable reference',''],
 ['Stamina Potion','consumable','Utility potion','A white potion used to restore stamina.','Avoid confusing the white vial with antidote or thawing effects.','Act I consumable reference',''],
 ['Antidote Potion','consumable','Utility potion','A potion used to remove poison.','Give the cure function a distinct bottle treatment and label.','Act I consumable reference',''],
 ['Thawing Potion','consumable','Utility potion','A potion used against cold and ice effects.','Distinguish its cool accent from mana blue at small sizes.','Act I consumable reference',''],
 ['Short Sword','weapon','Sword','A compact one-handed sword from the normal base-item tier.','Review blade length, crossguard and inventory footprint.','Normal sword reference',''],
 ['Sabre','weapon','Sword','A curved one-handed sword from the normal base-item tier.','The curve should remain clear beside straight sword silhouettes.','Normal sword reference',''],
 ['Hand Axe','weapon','Axe','A small one-handed axe from the normal base-item tier.','Balance the short handle against the heavy blade head.','Normal axe reference',''],
 ['Axe','weapon','Axe','A larger one-handed axe from the normal base-item tier.','Differentiate blade mass and handle length from Hand Axe.','Normal axe reference',''],
 ['Club','weapon','Mace','A simple blunt weapon from the normal base-item tier.','Material wear and head weight communicate its crude construction.','Normal mace reference',''],
 ['Spiked Club','weapon','Mace','A crude club reinforced with metal spikes.','Keep spikes visible without overfilling the inventory icon.','Normal mace reference',''],
 ['Dagger','weapon','Dagger','A small straight blade from the normal base-item tier.','Keep point, grip and blade readable in a narrow icon.','Normal dagger reference',''],
 ['Dirk','weapon','Dagger','A longer dagger from the normal base-item tier.','Use blade length and grip proportions to distinguish it from Dagger.','Normal dagger reference',''],
 ['Short Bow','weapon','Bow','A compact bow from the normal base-item tier.','Preserve a clean silhouette and visible bowstring.','Normal bow reference',''],
 ["Hunter's Bow",'weapon','Bow','A larger bow from the normal base-item tier.','Use limb length and curvature to distinguish it from Short Bow.','Normal bow reference',''],
 ['Short Staff','weapon','Staff','A short magical staff from the normal base-item tier.','Differentiate the head detail from Wand while preserving a long grip.','Normal staff reference',''],
 ['Wand','weapon','Wand','A small caster weapon from the normal base-item tier.','The tip and handle must read at inventory size.','Normal wand reference',''],
 ['Cap','armor','Helm','A basic soft head covering from the normal armor tier.','Keep cloth structure distinct from metal helms.','Normal helm reference',''],
 ['Quilted Armor','armor','Body armor','A padded body armor base from the normal tier.','Show seams and layered fabric without visual noise.','Normal armor reference',''],
 ['Leather Armor','armor','Body armor','A leather body armor base from the normal tier.','Make hide panels and stitching readable at small scale.','Normal armor reference',''],
 ['Buckler','armor','Shield','A small round shield from the normal tier.','Readability comes from rim and center boss, not surface noise.','Normal shield reference',''],
 ['Small Shield','armor','Shield','A compact shield from the normal tier.','Distinguish outline and reinforcement from Buckler.','Normal shield reference',''],
 ['Leather Gloves','armor','Gloves','A basic pair of gloves from the normal armor tier.','Define finger separation with restrained texture.','Normal gloves reference',''],
 ['Boots','armor','Boots','Basic footwear from the normal armor tier.','Pair silhouette and cuff shape matter more than fine material texture.','Normal boots reference',''],
 ['Sash','armor','Belt','A simple belt from the normal armor tier.','Use buckle and strap thickness to make a small icon recognizable.','Normal belt reference',''],
];
const originalItems=rows.map((r,i)=>{const [name,group,role,description,art,location,source]=r;return {
 id:'item-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),index:i+35,name,type:'item',act:'Act I',group,role,description,art,location,status:'reference',kind:group==='quest'?'quest':'base',
 image:images[name]||{src:null,file:null,url:null,source,label:'No verified image linked'},base:'',media:{model:null,clips:[]},motions:[],tags:[group,role,'Act I reference'],
 source:source||images[name]?.source||'https://classic.battle.net/diablo2exp/items/',scope:group==='quest'?'Act I quest or related special object':'Curated normal item or consumable reference. Availability varies by area, character level and difficulty.'
};});
const originalNames=new Set(originalItems.map(item=>item.name));
const familyNames={helms:'Helm',armor:'Body armor',shields:'Shield',gloves:'Gloves',boots:'Boots',belts:'Belt',barbhelms:'Barbarian helm',druidpelts:'Druid pelt',paladinshields:'Paladin shield',shrunkenheads:'Necromancer head',axes:'Axe',bows:'Bow',crossbows:'Crossbow',daggers:'Dagger',javelins:'Javelin',maces:'Mace',polearms:'Polearm',scepters:'Scepter',spears:'Spear',staves:'Staff',swords:'Sword',throw:'Throwing weapon',wands:'Wand',amazonweapons:'Amazon weapon',katars:'Assassin claw',orbs:'Sorceress orb'};
const lodFamilies=new Set(['barbhelms','druidpelts','paladinshields','shrunkenheads','amazonweapons','katars','orbs']);
const extraGear=earlyGear.filter(item=>!originalNames.has(item.name)).map(item=>{
 const role=familyNames[item.family]||'Normal base item';
 return {id:'item-'+item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:item.name,type:'item',act:'Act I',group:item.group,role,kind:'base',status:'reference',
 description:`A normal-tier ${role.toLowerCase()} base item with Quality Level ${item.qualityLevel}. Included as an early-game art reference; its Act I drop or vendor availability has not been verified.`,
 art:`Compare the ${role.toLowerCase()} silhouette, inventory footprint, material treatment and progression against neighboring bases. Verify world, equipped and inventory appearances separately.`,
 location:'Early Normal reference · drop location unverified',base:`Normal base · Quality Level ${item.qualityLevel}`,qualityLevel:item.qualityLevel,
 edition:lodFamilies.has(item.family)?'Lord of Destruction-era reference':'Diablo II normal base',scope:'Quality Level is a catalog selection rule, not an Act I loot guarantee.',
 image:images[item.name],source:item.source,media:{model:null,clips:[]},motions:[],tags:[item.group,role,item.family,'normal base','early-game reference']};
});
const miscDescriptions={
 Gem:'A socketable gem. Its grade and color determine the visual family and applied bonus.',
 Rune:'A socketable rune from the Lord of Destruction item system.',
 Potion:'A consumable potion in the health, mana or rejuvenation family.',
 'Throwing potion':'A throwable consumable that deals fire or poison damage.',
 Scroll:'A single-use utility scroll sold or found during early play.',
 Tome:'An inventory book that stores scrolls of the matching type.',
 Jewelry:'A ring or amulet base; the shown icon is one possible visual variant.',
 Key:'A stackable utility item used to open locked chests.',
 Ammunition:'Stackable ammunition for a bow or crossbow.',
};
const miscArt={
 Gem:'Track each gem color and grade at inventory scale; compare chipped, flawed and standard silhouettes.',
 Rune:'Maintain glyph readability at 28-pixel icon scale. Treat rune engraving and stone material as one family.',
 Potion:'Differentiate bottle silhouette, liquid color and tier while preserving a coherent potion set.',
 'Throwing potion':'Distinguish the throwing bottle from drinkable potions; note its impact and area-effect visuals.',
 Scroll:'Keep parchment, seal and color coding recognizable in a single inventory cell.',
 Tome:'Keep the book silhouette and color coding aligned with its matching scroll.',
 Jewelry:'The source displays several icon variants. This record uses one representative image, not a fixed appearance for every roll.',
 Key:'No verified official icon is linked yet. Record inventory scale and stack presentation when sourced.',
 Ammunition:'No verified official icon is linked yet. Record quiver shape, stack silhouette and inventory footprint when sourced.',
};
const misc=miscItems.map(item=>({
 id:'item-'+item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:item.name,type:'item',act:'Act I',group:item.group,role:item.family,kind:'supply',status:'reference',
 description:miscDescriptions[item.family],art:miscArt[item.family],location:'Early-game reference · availability varies',base:item.requiredLevel!=null?`Required level ${item.requiredLevel}`:'',
 requiredLevel:item.requiredLevel,edition:item.family==='Rune'?'Lord of Destruction':'Diablo II / Lord of Destruction',scope:'Reference entry, not a verified Act I drop record.',
 image:images[item.name]||{src:null,file:null,url:null,source:item.source,label:'No verified image linked'},source:item.source,
 media:{model:null,clips:[]},motions:[],tags:[item.group,item.family,'early-game reference']
}));
export const act1Items=[...originalItems,...extraGear,...misc].map((item,i)=>({...item,index:35+i}));

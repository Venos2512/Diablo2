import images from './images.json';
export const groups=[
 {id:'imps',name:'Imps & shamans',color:'#b87d53'},
 {id:'rogues',name:'Corrupted rogues',color:'#a26969'},
 {id:'undead',name:'Undead & skeletons',color:'#a69d74'},
 {id:'spirits',name:'Spirits & dark casters',color:'#77919b'},
 {id:'wildlife',name:'Wild creatures',color:'#83966b'},
 {id:'brutes',name:'Brutes & demon beasts',color:'#a38b66'},
 {id:'bosses',name:'Signature enemies',color:'#b36c5c'},
 {id:'constructs',name:'Hostile objects',color:'#78958b'},
];
// Original production notes. Suggested motions are not verified game clips.
const rows=[
 ['Fallen','imps','Melee','A small, hunched demon carrying a hand weapon and a small shield.','Keep the head and weapon readable at gameplay scale. Separate color variants.','Flee;Re-engage','',''],
 ['Fallen Shaman','imps','Caster','A small demonic caster with a staff and prominent ornaments.','Separate its silhouette from ordinary Fallen. Emphasize the staff and casting hand.','Cast;Resurrect','','Fallen'],
 ['Fetish','imps','Melee','A tiny humanoid with a weapon large in proportion to its body.','Preserve the head, legs and weapon silhouette among larger enemies.','Quick strike','',''],
 ['Bishibosh','imps','Caster','A named Fallen Shaman encountered in the Cold Plains.','Compare colors and ornaments with the base family before creating new assets.','Cast','Cold Plains','Fallen Shaman'],
 ['Rakanishu','imps','Melee','A named Carver from the Fallen family.','Review the base silhouette and separate lightning effects from body animation.','Lightning response','Stony Field','Fallen'],
 ['Corrupt Rogue','rogues','Melee','A slender corrupted warrior equipped for close combat.','Keep the hair, stance and weapon arc readable from the gameplay camera.','Weapon swing','',''],
 ['Corrupt Rogue Archer','rogues','Ranged','A corrupted archer who turns her torso toward the target.','Keep the bow and arrow release point consistent across viewing directions.','Draw bow;Shoot','','Corrupt Rogue'],
 ['Corrupt Rogue Spearwoman','rogues','Melee','A corrupted warrior whose long spear extends the silhouette.','Check grip placement, spear tips and thrust reach in every direction.','Spear thrust','','Corrupt Rogue'],
 ['Blood Raven','rogues','Ranged','A distinctive archer encountered among the undead in the burial grounds.','Review bow stance, palette and encounter-specific effects separately.','Shoot;Special cast','Burial Grounds','Corrupt Rogue Archer'],
 ['Coldcrow','rogues','Ranged','A named archer from the Dark Ranger family.','Compare the base archer appearance and keep cold effects separate.','Shoot;Cold response','Cave','Corrupt Rogue Archer'],
 ['The Countess','rogues','Melee','A named corrupted warrior from the Dark Stalker family.','Compare the Rogue silhouette and palette. Track fire effects separately.','Strike;Fire effect','Forgotten Tower','Corrupt Rogue'],
 ['Zombie','undead','Melee','A shambling corpse with slumped shoulders and a heavy torso.','Use large shapes for decay and communicate weight through the gait.','Shamble','',''],
 ['Skeleton','undead','Melee','A human skeleton carrying a melee weapon, sometimes with a shield.','Negative space between bones is essential to the silhouette.','Weapon swing','',''],
 ['Skeleton Archer','undead','Ranged','A skeletal bow user with an extended drawing arm.','Separate the bow from the ribcage and keep thin limbs visible.','Draw bow;Shoot','','Skeleton'],
 ['Skeleton Mage','undead','Caster','A skeletal caster launching magical projectiles from its hands.','Separate bone colors, spell light and projectile origin.','Projectile cast','','Skeleton'],
 ['Corpsefire','undead','Melee','A named zombie found inside the Den of Evil.','Compare the encounter palette with the base zombie before making new movement assets.','Strike;Elemental response','Den of Evil','Zombie'],
 ['Bonebreaker','undead','Melee','A named skeletal warrior encountered in the Crypt.','Check weapon and skeleton reuse before creating a separate art set.','Weapon swing','Crypt','Skeleton'],
 ['Bone Ash','undead','Caster','A named skeletal caster from the Burning Dead Mage family.','Check colors and spell effects against the dark Cathedral interior.','Cast','Cathedral','Skeleton Mage'],
 ['Wraith','spirits','Melee','An elongated spirit with a fading lower body.','Keep transparent edges readable against dark dungeon backgrounds.','Hover;Dissolve','',''],
 ['Vampire','spirits','Caster','A tall undead caster with long garments.','Give hands, head and garment edges clear shapes; track spells separately.','Cast','',''],
 ['Spike Fiend','wildlife','Ranged','A low creature with prominent spines across its back.','Make the spines and firing direction recognizable in a small silhouette.','Fire spines','',''],
 ['Blood Hawk','wildlife','Flying','A monstrous bird with wings much wider than its body.','Review open and closed wing poses while maintaining a readable body.','Flap;Dive','',''],
 ['Giant Spider','wildlife','Melee','A large spider with a rounded abdomen and long articulated legs.','Check foot contacts, leg spacing and the multi-leg gait.','Multi-leg walk','',''],
 ['Wendigo','brutes','Melee','A large fur-covered humanoid beast with broad shoulders and long arms.','Keep fur shapes controlled and express weight through the shoulders and arms.','Heavy slam','',''],
 ['Goatman','brutes','Melee','A horned goat-headed warrior with animal-like legs.','Prioritize horns, leg anatomy and weapon silhouette.','Weapon swing','',''],
 ['Tainted','brutes','Hybrid','A horned demon beast with a heavy body and prominent mouth.','Distinguish close-range attacks from projectile poses.','Melee strike;Projectile attack','',''],
 ['Treehead Woodfist','brutes','Melee','A named Brute from the Wendigo family.','Check potential movement reuse with Wendigo and compare the palette.','Heavy slam','Dark Wood','Wendigo'],
 ['Pitspawn Fouldog','brutes','Hybrid','A named Tainted-family beast encountered in the Jail.','Compare the Tainted base appearance and review cold effects independently.','Melee strike;Projectile attack','Jail, level 2','Tainted'],
 ['Griswold','bosses','Melee','A corrupted blacksmith with a heavy torso and broad shoulders.','Preserve his distinct proportions and short, weighty strikes.','Close strike','Tristram',''],
 ['The Smith','bosses','Melee','A massive demonic blacksmith carrying a large hammer.','The hammer, belly and shoulders define the silhouette. Review the swing arc.','Hammer swing','Barracks',''],
 ['Andariel','bosses','Boss','A towering female demon with pointed appendages extending behind her back.','Keep all limbs readable. Poison effects should support rather than obscure the body.','Strike;Poison attack;Signature death','Catacombs, level 4',''],
 ['Flying Scimitar','constructs','Object','A curved blade suspended in the air without a visible wielder.','Use blade tilt and trajectory to communicate the attack direction.','Hover;Slash','',''],
 ['Blood Hawk Nest','constructs','Spawner','A fixed nest that produces Blood Hawks.','Plan intact, spawning and destroyed states.','Spawn bird;Destruction','',''],
 ['Gargoyle Trap','constructs','Trap','A stationary sculpted trap that launches projectiles.','Use the firing opening and activation feedback to distinguish it from scenery.','Activate;Fire projectile','',''],
];
export const monsters=rows.map((r,i)=>{
 const [name,group,role,description,art,special,location,base]=r;
 return {id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),index:i+1,name,type:'creature',act:'Act I',group,role,description,art,location:location||'Act I bestiary index',base,kind:name==='Andariel'?'boss':location?'unique':'regular',
 motions:['Spawner','Trap'].includes(role)?['Idle',...special.split(';')]:['Idle','Move','Attack','Hit reaction — verify','Death',...special.split(';')],
 image:images[name],media:{model:null,clips:[]},tags:[role,group],status:'reference',scope:'Reference index; exact spawns by version and difficulty have not been audited.'};
});
export const groupById=Object.fromEntries(groups.map(g=>[g.id,g]));

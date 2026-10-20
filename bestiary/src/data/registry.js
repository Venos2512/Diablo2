import {monsters} from './catalog.js';
import {environments,npcs,items,models,animations,effects} from './collections.js';
import {multiverseEnemies} from './multiverse.js';
import {concepts} from './concepts.js';
export const collections=[
 {id:'all',name:'All assets',symbol:'◈',description:'D2RR concept art and an art reference library across five classic action RPG worlds.'},
 {id:'concept',name:'Concept art',symbol:'✎',description:'Original 2D concept sheets for D2RR: monsters, the Blood Moor outpost, props, UI and terrain.'},
 {id:'creature',name:'Creatures',symbol:'♜',description:'Enemy families, signature encounters and hostile objects.'},
 {id:'environment',name:'Environments',symbol:'▥',description:'Tilesets, architecture, terrain, props and lighting references.'},
 {id:'npc',name:'NPCs',symbol:'♙',description:'Characters, outfits, roles and dialogue poses.'},
 {id:'item',name:'Items',symbol:'◇',description:'Quest objects, early base gear, potions, gems, runes and supplies.'},
 {id:'model',name:'3D models',symbol:'⬡',description:'Meshes, materials, rigs and turntable previews.'},
 {id:'animation',name:'Animations',symbol:'▷',description:'Motion clips, frame ranges and linked character rigs.'},
 {id:'effect',name:'VFX',symbol:'✧',description:'Projectiles, spell effects and environmental motion.'},
];
export const assets=[...monsters,...multiverseEnemies,...environments,...npcs,...items,...models,...animations,...effects,...concepts];
export const collectionById=Object.fromEntries(collections.map(c=>[c.id,c]));
export const assetById=Object.fromEntries(assets.map(a=>[a.id,a]));

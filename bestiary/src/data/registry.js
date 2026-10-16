import {monsters} from './catalog.js';
import {environments,npcs,items,models,animations,effects} from './collections.js';
export const collections=[
 {id:'all',name:'All assets',symbol:'◈',description:'A shared reference library for the world of Sanctuary.'},
 {id:'creature',name:'Creatures',symbol:'♜',description:'Enemy families, signature encounters and hostile objects.'},
 {id:'environment',name:'Environments',symbol:'▥',description:'Tilesets, architecture, terrain, props and lighting references.'},
 {id:'npc',name:'NPCs',symbol:'♙',description:'Characters, outfits, roles and dialogue poses.'},
 {id:'item',name:'Items',symbol:'◇',description:'Weapons, armor, consumables and inventory artwork.'},
 {id:'model',name:'3D models',symbol:'⬡',description:'Meshes, materials, rigs and turntable previews.'},
 {id:'animation',name:'Animations',symbol:'▷',description:'Motion clips, frame ranges and linked character rigs.'},
 {id:'effect',name:'VFX',symbol:'✧',description:'Projectiles, spell effects and environmental motion.'},
];
export const assets=[...monsters,...environments,...npcs,...items,...models,...animations,...effects];
export const collectionById=Object.fromEntries(collections.map(c=>[c.id,c]));
export const assetById=Object.fromEntries(assets.map(a=>[a.id,a]));

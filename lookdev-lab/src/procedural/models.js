// Public entry for character models (SPEC §6D).
//   createHero(cls, opts)      cls: 'barbarian' | 'sorceress' | 'necromancer'
//   createMonster(kind, opts)  kind: see MONSTER_KINDS; opts: { ally, element, tint, scale, champion, unique, variant, seed }
//   createNPC(kind, opts)      kind: 'healer' | 'smith' | 'sage' | 'peddler' | 'captain' | 'villager'
export { createHero, heroTemplate } from './heroes.js';
export { createMonster, MONSTER_KINDS } from './monsters.js';
export { createNPC, NPC_KINDS } from './npcs.js';
export { CharacterModel, makeCharMaterial } from './rig.js';
import { loadBaked, bakedInfo } from './sculpt.js';
import { BAKED_B64 } from './baked_data.js';
// decode the build-time sculpted geometry once at boot (await before creating characters)
export const modelsReady = loadBaked(BAKED_B64);
export { bakedInfo };

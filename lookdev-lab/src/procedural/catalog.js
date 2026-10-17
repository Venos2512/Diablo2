// Lab entry for the procedural characters (heroes, monsters, NPCs built in code by models.js).
// Ids look like 'proc:hero:barbarian' / 'proc:monster:zombie' / 'proc:npc:smith' so the sample rail,
// session restore and the Procedural tab can share them with the GLB samples.
import { createHero, createMonster, createNPC, modelsReady, bakedInfo, MONSTER_KINDS, NPC_KINDS } from './models.js';

const label = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const HERO_CLASSES = ['barbarian', 'sorceress', 'necromancer'];
export const ARMOR_KINDS = ['none', 'cloth', 'leather', 'chain', 'plate', 'robe'];
export const ELEMENTS = ['none', 'fire', 'cold', 'lightning'];

export const PROCEDURAL = [
	...HERO_CLASSES.map((k) => ({ id: `proc:hero:${k}`, group: 'hero', kind: k, name: label(k) })),
	...MONSTER_KINDS.map((k) => ({ id: `proc:monster:${k}`, group: 'monster', kind: k, name: label(k) })),
	...NPC_KINDS.map((k) => ({ id: `proc:npc:${k}`, group: 'npc', kind: k, name: label(k) })),
];

export const isProcedural = (id) => typeof id === 'string' && id.startsWith('proc:');
export const proceduralById = (id) => PROCEDURAL.find((e) => e.id === id) || null;

/** Default build options per group (the Procedural tab edits a copy). */
export function defaultOptions() {
	return { variant: 0, ally: false, element: 'none', champion: false, unique: false, armor: 'none', tier: 0, seed: 7 };
}

/**
 * Builds a CharacterModel. Await this: the baked sculpt data is decoded once on first use
 * (missing / stale entries are sculpted live, which takes a moment for hero armour variants).
 */
export async function createProcedural(id, o = defaultOptions()) {
	const entry = proceduralById(id);
	if (!entry) throw new Error(`Unknown procedural character: ${id}`);
	await modelsReady;
	const seed = o.seed ?? 7;
	if (entry.group === 'hero') {
		const model = createHero(entry.kind, { seed });
		if (o.armor && o.armor !== 'none') model.setEquipment({ armor: { kind: o.armor, tier: o.tier ?? 0 } });
		return { entry, model };
	}
	if (entry.group === 'monster') {
		const element = o.element && o.element !== 'none' ? o.element : undefined;
		const model = createMonster(entry.kind, { seed, variant: o.variant ?? 0, ally: !!o.ally, element, champion: !!o.champion, unique: !!o.unique });
		return { entry, model };
	}
	return { entry, model: createNPC(entry.kind, { seed, variant: o.variant ?? 0 }) };
}

export { bakedInfo };

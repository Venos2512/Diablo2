// Monster models for the gameplay: the lab's copy of Ashen Crown's procedural characters (src/procedural),
// prepared for the active renderer (TSL node material on WebGPU, GLSL patches / views on WebGL2).
import { createMonster as buildMonster } from '../procedural/models.js';

export const ModelHost = {
	prepare: null, // (model) => void, set by the gameplay host
};

export function createMonster(kind, opts) {
	const model = buildMonster(kind, opts);
	ModelHost.prepare?.(model);
	return model;
}

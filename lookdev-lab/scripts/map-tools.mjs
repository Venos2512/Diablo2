// Shared by scripts/bake-map.mjs and scripts/map-modules.test.mjs (node only): the catalog on the full palette, kit sizes on disk, a layout run,
// the code hash of the engine / generator sources (the same files the scene hashes at build time via `?hash`, see CODE_FILES in env/mapModules.js).
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { layoutBiome } from '../src/env/biomeLayout.js';
import { buildCatalog } from '../src/env/biomeCatalog.js';
import { DEMO_PLAN } from '../src/env/biomeLayoutDemo.js';
import { CODE_FILES, KIT_SAMPLES, codeHash, fileHash } from '../src/env/mapModules.js';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PLANS = { demo: DEMO_PLAN };

const readJson = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const samples = readJson('src/assets/samples.json').assets;

/** The kit keys whose sample is registered, i.e. the palette the scene offers the engine (the scene decides the same way: no dependence on load timing). */
export const availableKits = () => new Set(Object.entries(KIT_SAMPLES).filter(([, id]) => samples.some((s) => s.id === id)).map(([key]) => key));

/** The catalog the scene builds: kitSizes.json, the full registered palette. */
export const demoCatalog = () => buildCatalog({ sizes: readJson('src/env/kitSizes.json'), available: availableKits() });

/** Bytes of every kit's GLB on disk, by kit key. */
export function kitBytesOnDisk() {
	const out = {};
	for (const [key, id] of Object.entries(KIT_SAMPLES)) {
		const entry = samples.find((s) => s.id === id);
		if (entry) out[key] = statSync(path.join(root, 'assets', entry.file)).size;
	}
	return out;
}

/** The engine on a plan with a master seed and the options a scene would pass. */
export function runLayout(plan, catalog, seed, options = {}) {
	return layoutBiome({ ...plan, seed }, catalog, options);
}

/**
 * The `code` of a layout key / gen key, as the scene computes it: groups = names of CODE_FILES ('layout', plus 'generator' for generated
 * maps, plus 'splat' for the splat key), the files read from disk in that order.
 */
export const codeHashOnDisk = (groups) => codeHash(groups.flatMap((g) => CODE_FILES[g]).map((f) => fileHash(readFileSync(path.join(root, 'src', f), 'utf8'))));

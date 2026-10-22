// Bakes a map: runs the engine (and, for a generated map, the plan generator) once and writes assets/maps/<plan.id>/seed-<seed>.json (the
// layout with typed arrays as base64, the module manifest, the layout key and the fast-load checks) plus entries in assets/maps/index.json.
// The scene reads the file when the browser cache has no entry for the key, so a baked map never runs the engine on load (AD 12 §4.14).
// Usage: npm run bake:map -- [--plan demo|seed] [--seed N] [--size 128] [--kits]
//   --plan seed   one seed → the whole map (planGen.generateMap): --seed N (default 1), --size 128 | 192 | 256; the plan id is gen-moor-<size>-s<seed>
//   --kits        also rewrites src/env/kitBytes.json (GLB sizes the scene's start-ring MB check reads)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DEFAULT_OPTIONS } from '../src/env/biomeLayout.js';
import { MAP_FORMAT_VERSION, MODULE_RULES, acceptKey, bakeBytes, bakeLayout, checkModules, genKey, layoutKey, loadOrder, mapStart, splitModules } from '../src/env/mapModules.js';
import { PLAN_GEN_VERSION, generateMap } from '../src/env/planGen.js';
import { PLANS, codeHashOnDisk, demoCatalog, kitBytesOnDisk, root, runLayout } from './map-tools.mjs';

// Windows refuses to open a file a dev server or an editor is watching (UNKNOWN / EBUSY / EPERM) for a moment: retry a few times
function write(file, text) {
	for (let attempt = 0; ; attempt++) {
		try {
			return writeFileSync(file, text);
		} catch (error) {
			if (attempt >= 8) throw error;
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
		}
	}
}

const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const planName = arg('--plan', 'demo');
if (planName !== 'seed' && !PLANS[planName]) {
	console.error(`Unknown plan "${planName}" (known: ${[...Object.keys(PLANS), 'seed'].join(', ')})`);
	process.exit(1);
}
const generated = planName === 'seed';
const size = Number(arg('--size', 128));
if (generated && ![128, 192, 256].includes(size)) {
	console.error(`--size ${size}: 128, 192 or 256`);
	process.exit(1);
}
const seed = Number(arg('--seed', generated ? 1 : PLANS[planName].seed ?? 1));
const catalog = demoCatalog();
const kitBytes = kitBytesOnDisk();

if (args.includes('--kits')) {
	writeFileSync(path.join(root, 'src/env/kitBytes.json'), `${JSON.stringify(kitBytes, null, '\t')}\n`);
	console.log('wrote src/env/kitBytes.json');
}

const options = {};
const code = codeHashOnDisk(generated ? ['layout', 'generator'] : ['layout']);
const t0 = performance.now();
let plan;
let result;
let gen = null;
if (generated) {
	const map = generateMap(seed, catalog, { size, modules: { kitBytes }, ...options });
	plan = map.plan;
	result = map.result;
	gen = { version: PLAN_GEN_VERSION, attempt: map.attempt, attempts: map.attempts, ok: map.ok, genKey: genKey({ seed, size, version: PLAN_GEN_VERSION }, options, catalog, { code, accept: acceptKey(kitBytes) }) };
	if (!map.ok) console.warn(`no attempt passed every check; the best one (attempt ${map.attempt}) is baked: ${map.attempts.at(-1)?.failed.join(', ')}`);
} else {
	plan = { ...PLANS[planName], seed };
	result = runLayout(plan, catalog, seed, options);
}
const engineMs = performance.now() - t0;
const key = layoutKey(plan, options, catalog, { code });
if (gen) gen.key = key;
const { manifest } = splitModules(plan, result, { kitBytes });
const baked = bakeLayout(result, { key, plan: plan.id, seed, options: { defaults: DEFAULT_OPTIONS } });
const bytes = bakeBytes(baked);
const order = loadOrder(manifest, mapStart(plan));
const checks = checkModules(manifest, order, MODULE_RULES, { bakeBytes: bytes });

const dir = path.join(root, 'assets/maps', plan.id);
mkdirSync(dir, { recursive: true });
const name = `seed-${seed}.json`;
const text = JSON.stringify({ ...baked, key, manifest, checks, ...(gen ? { gen } : {}) });
write(path.join(dir, name), text);

const indexFile = path.join(root, 'assets/maps/index.json');
let index = { format: MAP_FORMAT_VERSION, maps: {} };
try {
	index = JSON.parse(readFileSync(indexFile, 'utf8'));
} catch {
	// first bake
}
if (index.format !== MAP_FORMAT_VERSION) index = { format: MAP_FORMAT_VERSION, maps: {} }; // older bakes are stale
for (const [other, entry] of Object.entries(index.maps)) if (other !== key && entry.file === `${plan.id}/${name}`) delete index.maps[other]; // the file is overwritten: the entry of its old key is stale
for (const [other, entry] of Object.entries(index.maps)) if (!existsSync(path.join(root, 'assets/maps', entry.file))) delete index.maps[other]; // a deleted bake file
index.maps[key] = { file: `${plan.id}/${name}`, plan: plan.id, seed, bytes: Buffer.byteLength(text), bakeBytes: bytes }; // bakeBytes: the layout part, what the module-bake-size check measures
if (gen) (index.gen ??= {})[gen.genKey] = { version: gen.version, attempt: gen.attempt, attempts: gen.attempts, ok: gen.ok, key }; // seed + size + options → accepted attempt (the scene regenerates the plan from it)
for (const [genId, record] of Object.entries(index.gen ?? {})) if (!index.maps[record.key]) delete index.gen[genId]; // records whose layout is gone
write(indexFile, JSON.stringify(index, null, '\t'));

console.log(`plan ${plan.id}, seed ${seed}, key ${key}${gen ? `, attempt ${gen.attempt} of ${gen.attempts.length}` : ''}`);
console.log(`${generated ? 'generator + engine' : 'engine'} ${engineMs.toFixed(0)} ms · ${manifest.modules.length} modules of ${manifest.size} m · ${manifest.kits.length} kits · bake ${(bytes / 1024).toFixed(0)} KB (file ${(Buffer.byteLength(text) / 1024).toFixed(0)} KB) -> assets/maps/${plan.id}/${name}`);
console.log(`ring 0: ${order.filter((o) => o.ring === 0).length} modules`);
for (const c of checks) console.log(`${c.pass ? '✓' : '✗'} ${c.id}  ${c.rule}${c.details?.violations?.length ? `  — ${c.details.violations.length} vi phạm` : ''}`);
if (checks.some((c) => !c.pass)) process.exitCode = 2; // the file is written anyway: the report shows the failing rule

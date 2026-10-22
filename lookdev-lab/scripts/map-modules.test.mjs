// Tests of the map modules and fast-load rules (src/env/mapModules.js, mapStream.js; AD 12 §4.14) on the demo plan with three seed sets.
// Usage: npm run test:modules
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';
import { DEFAULT_OPTIONS, LAYOUT_RULES, layoutBiome, obbFrom } from '../src/env/biomeLayout.js';
import { buildCatalog } from '../src/env/biomeCatalog.js';
import { DEMO_PLAN } from '../src/env/biomeLayoutDemo.js';
import {
	CODE_FILES, KIT_SAMPLES, MAP_FORMAT_VERSION, MODULE_RULES, acceptKey, bakeBytes, bakeLayout, boxDistance, checkModules, codeHash, fileHash, genKey, layoutKey, loadOrder, mapStart, restoreLayout, splitModules,
} from '../src/env/mapModules.js';
import { PLAN_GEN_VERSION, generatePlan } from '../src/env/planGen.js';
import { hashPlugin } from './esbuild-plugins.mjs';
import { MapStream } from '../src/env/mapStream.js';
import { availableKits, codeHashOnDisk, demoCatalog, kitBytesOnDisk, root, runLayout } from './map-tools.mjs';

const catalog = demoCatalog();
const kitBytes = kitBytesOnDisk();
const SEEDS = [DEMO_PLAN.seed, 7, 99991];
const results = new Map();
const layout = (seed) => {
	if (!results.has(seed)) results.set(seed, runLayout(DEMO_PLAN, catalog, seed));
	return results.get(seed);
};
const split = (seed) => splitModules(DEMO_PLAN, layout(seed), { kitBytes });
const start = mapStart(DEMO_PLAN);
const noMs = (r) => ({ ...r, report: { ...r.report, ms: undefined } }); // the per-step timings differ between runs

// ---- partition

test('every item belongs to exactly one module and the modules add up to the whole layout', () => {
	for (const seed of SEEDS) {
		const r = layout(seed);
		const { manifest, modules } = split(seed);
		const lists = { placements: r.placements.length, shrubs: r.ecology.shrubs.length, groundPaint: r.groundPaint.length, tufts: r.ecology.tufts.x.length };
		for (const [field, n] of Object.entries(lists)) {
			const seen = new Uint8Array(n);
			for (const m of modules) for (const k of m[field]) seen[k]++;
			assert.equal(seen.reduce((a, b) => a + b, 0), n, `${seed} ${field}: ${n} items`);
			assert.ok(seen.every((c) => c === 1), `${seed} ${field}: each item in exactly one module`);
		}
		const lit = r.placements.map((p, k) => (p.light ? k : -1)).filter((k) => k >= 0);
		assert.deepEqual(modules.flatMap((m) => [...m.lights]).sort((a, b) => a - b), lit, `${seed} lights`);
		assert.deepEqual(manifest.ownership.items, manifest.ownership.owned);
		assert.equal(modules.length, manifest.modules.length);
		assert.ok(modules.every((m) => m.counts.pieces > 0 || m.counts.tufts > 0 || m.counts.groundPaint > 0), 'empty modules are omitted');
	}
});

test('an item sits in the module whose square holds its footprint centre; the module bounds contain the content', () => {
	const eps = 1e-6;
	for (const seed of SEEDS) {
		const r = layout(seed);
		const { modules } = split(seed);
		const inCell = (m, x, z) => x >= m.cell.x0 - eps && x <= m.cell.x1 + eps && z >= m.cell.z0 - eps && z <= m.cell.z1 + eps;
		const inBox = (m, x, z) => x >= m.bounds.x0 - 0.002 && x <= m.bounds.x1 + 0.002 && z >= m.bounds.z0 - 0.002 && z <= m.bounds.z1 + 0.002;
		for (const m of modules) {
			assert.equal(m.id, `m${m.i}_${m.j}`);
			assert.ok(m.cell.x1 - m.cell.x0 === MODULE_RULES.size && m.cell.z1 - m.cell.z0 === MODULE_RULES.size);
			for (const k of m.placements) {
				const p = r.placements[k];
				const c = p.footprint ? { x: p.footprint.cx, z: p.footprint.cz } : p;
				assert.ok(inCell(m, c.x, c.z), `${p.id} centre in ${m.id}`);
				if (p.footprint) for (const q of obbFrom(p.footprint).pts) assert.ok(inBox(m, q.x, q.z), `${p.id} footprint in the bounds of ${m.id}`);
				if (p.light) assert.ok(inBox(m, p.light.x, p.light.z), `${p.id} light in the bounds of ${m.id}`);
			}
			for (const k of m.shrubs) {
				const s = r.ecology.shrubs[k];
				assert.ok(inCell(m, s.footprint?.cx ?? s.x, s.footprint?.cz ?? s.z));
				if (s.footprint) for (const q of obbFrom(s.footprint).pts) assert.ok(inBox(m, q.x, q.z));
			}
			for (const k of m.tufts) {
				const x = r.ecology.tufts.x[k];
				const z = r.ecology.tufts.z[k];
				assert.ok(inCell(m, x, z) && inBox(m, x, z), `tuft ${k} in ${m.id}`);
			}
			for (const k of m.groundPaint) {
				const g = r.groundPaint[k];
				assert.ok(inCell(m, g.x, g.z));
				assert.ok(inBox(m, g.x - g.radius, g.z - g.radius) && inBox(m, g.x + g.radius, g.z + g.radius));
			}
		}
	}
});

test('kits of a module = the distinct kits of its placements and shrubs; bytes add up', () => {
	const r = layout(SEEDS[0]);
	const { manifest, modules } = split(SEEDS[0]);
	for (const m of modules) {
		const want = new Set();
		for (const k of m.placements) if (r.placements[k].kit) want.add(r.placements[k].kit);
		for (const k of m.shrubs) want.add(r.ecology.shrubs[k].kit ?? 'shrubs');
		assert.deepEqual(m.kits, [...want].sort(), m.id);
		assert.equal(m.bytes, m.kits.reduce((n, k) => n + kitBytes[k], 0));
	}
	assert.deepEqual(manifest.kits, [...new Set(modules.flatMap((m) => m.kits))].sort());
	assert.ok(split(SEEDS[0]).manifest.kitBytes);
	assert.equal(splitModules(DEMO_PLAN, r).manifest.kitBytes, null, 'no kitBytes given: none claimed');
});

test('splitModules is deterministic and sorted', () => {
	for (const seed of SEEDS) {
		const a = split(seed);
		const b = splitModules(DEMO_PLAN, layout(seed), { kitBytes });
		assert.deepEqual(a.manifest, b.manifest);
		assert.deepEqual(a.modules, b.modules);
		const keys = a.modules.map((m) => [m.i, m.j]);
		assert.deepEqual(keys, [...keys].sort((p, q) => p[0] - q[0] || p[1] - q[1]));
	}
});

// ---- load order

test('load order: ring 0 holds the start module; the rest by distance; deterministic', () => {
	for (const seed of SEEDS) {
		const { manifest } = split(seed);
		const order = loadOrder(manifest, start);
		assert.deepEqual(order, loadOrder(manifest, start));
		assert.equal(order.length, manifest.modules.length);
		assert.deepEqual(new Set(order.map((o) => o.id)).size, order.length);
		const ring0 = order.filter((o) => o.ring === 0);
		const holder = manifest.modules.find((m) => start.x >= m.cell.x0 && start.x < m.cell.x1 && start.z >= m.cell.z0 && start.z < m.cell.z1);
		assert.ok(holder, 'the start lies in a non-empty module');
		assert.ok(ring0.some((o) => o.id === holder.id), 'ring 0 contains the start module');
		assert.ok(order.slice(0, ring0.length).every((o) => o.ring === 0), 'ring 0 comes first');
		const byId = new Map(manifest.modules.map((m) => [m.id, m]));
		for (const o of order) {
			const m = byId.get(o.id);
			assert.ok(Math.abs(o.distance - Math.min(boxDistance(m.cell, start.x, start.z), boxDistance(m.bounds, start.x, start.z))) < 0.002, 'distance = the nearer of the cell and its content');
			assert.equal(o.ring === 0, o.distance <= MODULE_RULES.startRadius);
			if (o.ring > 0) assert.equal(o.ring, Math.ceil(o.distance / manifest.size));
		}
		const rest = order.slice(ring0.length);
		for (let k = 1; k < rest.length; k++) assert.ok(rest[k].distance >= rest[k - 1].distance, 'distances do not decrease after ring 0');
		for (let k = 1; k < ring0.length; k++) assert.ok(ring0[k].distance >= ring0[k - 1].distance, 'ring 0 nearest first');
		for (let k = 1; k < order.length; k++) if (order[k].distance === order[k - 1].distance && order[k].ring === order[k - 1].ring) assert.ok(order[k].id > order[k - 1].id, 'ties by id');
	}
});

// ---- checks

const ids = (checks) => checks.map((c) => c.id);
const ALL = ['module-kits', 'module-pieces', 'module-lights', 'module-tufts', 'module-start-kits', 'module-start-mb', 'module-map-kits', 'module-map-mb', 'module-ownership'];

test('the demo passes every module check on the default seed (and the sweep seeds stay inside the rules)', () => {
	for (const seed of SEEDS) {
		const { manifest } = split(seed);
		const order = loadOrder(manifest, start);
		const bytes = bakeBytes(bakeLayout(layout(seed), {}));
		const checks = checkModules(manifest, order, MODULE_RULES, { bakeBytes: bytes });
		assert.deepEqual(ids(checks), [...ALL, 'module-bake-size']);
		for (const c of checks) {
			assert.ok(c.rule.includes('§4.14'), `${c.id} cites the section`);
			assert.equal(typeof c.pass, 'boolean');
			assert.ok(c.details && typeof c.details === 'object');
		}
		assert.ok(checks.every((c) => c.pass), `seed ${seed}: ${checks.filter((c) => !c.pass).map((c) => c.id).join(', ')}`);
	}
	assert.deepEqual(ids(checkModules(split(SEEDS[0]).manifest, [], MODULE_RULES)), ALL, 'the bake-size check needs a bake');
});

test('each check fails on a crafted violation', () => {
	const { manifest } = split(SEEDS[0]);
	const order = loadOrder(manifest, start);
	const fails = (checks, id) => {
		const c = checks.find((q) => q.id === id);
		assert.ok(c, id);
		assert.equal(c.pass, false, `${id} should fail`);
		return c;
	};
	const clone = () => structuredClone(manifest);
	const pick = (m) => m.modules[0];

	let m = clone();
	pick(m).counts.kits = MODULE_RULES.moduleKits + 1;
	const c1 = fails(checkModules(m, order), 'module-kits');
	assert.equal(c1.details.violations[0].id, pick(m).id);

	m = clone();
	pick(m).counts.pieces = MODULE_RULES.modulePieces + 1;
	fails(checkModules(m, order), 'module-pieces');
	m = clone();
	pick(m).counts.lights = MODULE_RULES.moduleLights + 1;
	fails(checkModules(m, order), 'module-lights');
	m = clone();
	pick(m).counts.tufts = MODULE_RULES.moduleTufts + 1;
	fails(checkModules(m, order), 'module-tufts');

	// a tighter rule fails the real layout
	fails(checkModules(manifest, order, { ...MODULE_RULES, moduleKits: 2 }), 'module-kits');

	// the start ring over budget: every kit of the map needed by ring 0
	m = clone();
	const near = order.filter((o) => o.ring === 0).map((o) => o.id);
	m.modules.filter((q) => near.includes(q.id)).forEach((q, k) => (q.kits = k === 0 ? Object.keys(KIT_SAMPLES) : q.kits));
	fails(checkModules(m, order), 'module-start-kits');
	fails(checkModules(manifest, order, { ...MODULE_RULES, startKits: 3 }), 'module-start-kits');
	fails(checkModules(manifest, order, { ...MODULE_RULES, startMB: 4 }), 'module-start-mb');

	fails(checkModules(manifest, order, { ...MODULE_RULES, mapKits: 5 }), 'module-map-kits');
	fails(checkModules(manifest, order, { ...MODULE_RULES, mapMB: 5 }), 'module-map-mb');

	m = clone();
	m.ownership.owned.tufts -= 1;
	const own = fails(checkModules(m, order), 'module-ownership');
	assert.equal(own.details.violations[0].id, 'tufts');

	fails(checkModules(manifest, order, MODULE_RULES, { bakeBytes: (MODULE_RULES.bakeKB + 1) * 1024 }), 'module-bake-size');

	// without kit sizes the MB checks are skipped, not failed
	const bare = splitModules(DEMO_PLAN, layout(SEEDS[0])).manifest;
	const skipped = checkModules(bare, loadOrder(bare, start)).filter((c) => c.id.endsWith('-mb'));
	assert.equal(skipped.length, 2);
	assert.ok(skipped.every((c) => c.pass && c.details.skipped));
});

// ---- bake / restore / key

test('bake → JSON → restore gives the same layout (3 seeds), typed arrays included', () => {
	for (const seed of SEEDS) {
		const r = layout(seed);
		const baked = bakeLayout(r, { seed });
		const text = JSON.stringify(baked); // JSON-safe: nothing is lost on the way through a file / IndexedDB
		assert.equal(typeof text, 'string');
		const back = restoreLayout(JSON.parse(text));
		assert.deepEqual(back, r);
		assert.ok(back.ecology.tufts.x instanceof Float32Array && back.ecology.tufts.kind instanceof Uint8Array && back.ecology.tufts.cluster instanceof Int32Array);
		assert.ok(back.ecology.carpet.density instanceof Float32Array);
		assert.ok(text.length / 1024 <= MODULE_RULES.bakeKB, `bake ${(text.length / 1024).toFixed(0)} KB within ${MODULE_RULES.bakeKB} KB`);
		assert.equal(bakeBytes(baked), text.length);
	}
	assert.throws(() => restoreLayout({ format: MAP_FORMAT_VERSION + 1, result: {} }), /format/);
	assert.throws(() => bakeLayout({ f: () => 1 }), /function/);
});

test('bake keeps undefined keys, -0 and non-finite numbers', () => {
	const odd = { a: undefined, b: -0, c: Infinity, d: [undefined, NaN, 1], e: { f: new Float32Array([1.5, -0]) } };
	const back = restoreLayout(JSON.parse(JSON.stringify(bakeLayout(odd))));
	assert.deepEqual(back, odd);
});

test('restoreLayout of the demo takes under 30 ms', () => {
	const parsed = JSON.parse(JSON.stringify(bakeLayout(layout(SEEDS[0]), {})));
	restoreLayout(parsed); // warm up
	let best = Infinity;
	for (let n = 0; n < 7; n++) {
		const t0 = performance.now();
		restoreLayout(parsed);
		best = Math.min(best, performance.now() - t0);
	}
	assert.ok(best < 30, `restore ${best.toFixed(1)} ms`);
});

test('layoutKey: stable, and changed by seed / options / rules / format / catalog / plan', () => {
	const plan = { ...DEMO_PLAN, seed: 5 };
	const key = (p = plan, o = {}, c = catalog, f, code) => layoutKey(p, o, c, { ...(f === undefined ? {} : { format: f }), ...(code === undefined ? {} : { code }) });
	const base = key();
	assert.equal(base, key());
	assert.match(base, /^[0-9a-f]{28}$/);
	assert.equal(base, key({ ...plan }), 'a copy of the plan');
	assert.equal(base, key(plan, { seeds: { ...DEFAULT_OPTIONS.seeds }, density: { ...DEFAULT_OPTIONS.density }, rules: {} }), 'explicit defaults = none');
	assert.equal(base, key({ ...plan, ground: (x, z) => DEMO_PLAN.ground(x, z) }), 'the ground function by identity does not matter, by values it does');
	assert.equal(base, key(plan, {}, demoCatalog()), 'a rebuilt catalog');
	assert.notEqual(base, key({ ...plan, seed: 6 }), 'master seed');
	assert.notEqual(base, key(plan, { seeds: { mass: 12 } }), 'group seed');
	assert.notEqual(base, key(plan, { density: { grass: 0.5 } }), 'density');
	assert.notEqual(base, key(plan, { budgets: { tufts: 1000 } }), 'budget');
	assert.notEqual(base, key(plan, { rules: { pathClear: LAYOUT_RULES.pathClear + 0.1 } }), 'rule override');
	assert.notEqual(base, key(plan, {}, catalog, MAP_FORMAT_VERSION + 1), 'format version');
	assert.notEqual(base, key(plan, {}, catalog, undefined, 'a1b2'), 'code hash');
	assert.notEqual(key(plan, {}, catalog, undefined, 'a1b2'), key(plan, {}, catalog, undefined, 'a1b3'), 'another code hash');
	assert.notEqual(base, key(plan, {}, buildCatalog({ sizes: JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8')), available: new Set([...availableKits()].filter((k) => k !== 'rocks')) })), 'available kits');
	assert.notEqual(base, key({ ...plan, bounds: { ...plan.bounds, x1: plan.bounds.x1 + 1 } }), 'plan data');
	assert.notEqual(base, key({ ...plan, ground: (x, z) => ({ ...DEMO_PLAN.ground(x, z), height: DEMO_PLAN.ground(x, z).height + 0.5 }) }), 'plan ground values');
});

test('every kit the catalog uses has a size in src/env/kitBytes.json and a sample id', () => {
	const bytes = JSON.parse(readFileSync(path.join(root, 'src/env/kitBytes.json'), 'utf8'));
	const used = new Set([...catalog.assets.values()].map((a) => a.kit));
	for (const kit of used) {
		assert.ok(KIT_SAMPLES[kit], `${kit} has a sample id`);
		assert.ok(bytes[kit] > 0, `${kit} has a size (npm run bake:map -- --kits)`);
	}
	assert.deepEqual(availableKits(), new Set(Object.keys(KIT_SAMPLES)), 'the whole palette is registered');
});

test('the baked demo map (assets/maps) restores to the engine result when it is current', (t) => {
	const index = path.join(root, 'assets/maps/index.json');
	if (!existsSync(index)) return t.skip('no bake yet (npm run bake:map)');
	const key = layoutKey({ ...DEMO_PLAN, seed: DEMO_PLAN.seed }, {}, catalog, { code: codeHashOnDisk(['layout']) });
	const entry = JSON.parse(readFileSync(index, 'utf8')).maps[key];
	if (!entry) return t.diagnostic(`the baked demo map is stale (key ${key} not in the index): run npm run bake:map`);
	const file = JSON.parse(readFileSync(path.join(root, 'assets/maps', entry.file), 'utf8'));
	assert.equal(file.key, key);
	assert.deepEqual(noMs(restoreLayout(file)), noMs(layout(DEMO_PLAN.seed)));
	assert.ok(file.checks.every((c) => c.pass));
});

// ---- streamer (fakes)

function fakeWorld({ kitsOf = {}, cost = 1, concurrency = 4, budget = 4, ring0 = 2, count = 8, hold = false } = {}) {
	const clock = { t: 0 };
	const order = Array.from({ length: count }, (_, k) => ({ id: `m${k}`, ring: k < ring0 ? 0 : k + 1, distance: k * 10 }));
	const kits = Object.fromEntries(order.map((o, k) => [o.id, kitsOf[o.id] ?? [`k${k}`]]));
	const pending = new Map();
	const calls = [];
	const built = [];
	let inflight = 0;
	let peak = 0;
	const stream = new MapStream({
		order,
		kitsOf: (id) => kits[id],
		loadKit: (key) => {
			calls.push(key);
			peak = Math.max(peak, ++inflight);
			return new Promise((resolve, reject) => pending.set(key, { resolve: () => (inflight--, resolve()), reject: (e) => (inflight--, reject(e)) }));
		},
		buildModule: (id) => {
			built.push(id);
			clock.t += typeof cost === 'function' ? cost(id) : cost;
		},
		now: () => clock.t,
		rules: { ...MODULE_RULES, kitConcurrency: concurrency, frameBudgetMs: budget },
		holdBackground: hold,
	});
	const settle = async (key, fail = false) => {
		const p = pending.get(key);
		assert.ok(p, `${key} is loading`);
		pending.delete(key);
		if (fail) p.reject(new Error('boom'));
		else p.resolve();
		for (let n = 0; n < 5; n++) await Promise.resolve();
	};
	return { stream, clock, calls, built, pending, settle, peak: () => peak, order, kits };
}

test('streamer: ring 0 first — start() waits for the ring-0 kits only, the others wait behind them', async () => {
	const w = fakeWorld({ ring0: 2, count: 6 });
	let started = false;
	const p = w.stream.start().then(() => (started = true));
	assert.deepEqual(w.calls, ['k0', 'k1'], 'only ring 0 loads first');
	await w.settle('k0');
	assert.equal(started, false);
	assert.deepEqual(w.calls, ['k0', 'k1'], 'background kits wait until all of ring 0 is in');
	await w.settle('k1');
	await p;
	assert.equal(started, true);
	assert.deepEqual(w.built, ['m0', 'm1'], 'ring 0 is built when start() returns');
	assert.deepEqual(w.calls.slice(2), ['k2', 'k3', 'k4', 'k5'], 'then the rest in load order');
});

test('streamer: kit priority follows the order, a shared kit is loaded once', async () => {
	const w = fakeWorld({ kitsOf: { m0: ['a', 'b'], m1: ['b'], m2: ['c', 'a'], m3: ['d'], m4: ['e'] }, ring0: 2, count: 5, concurrency: 2 });
	const p = w.stream.start();
	assert.deepEqual(w.calls, ['a', 'b']);
	await w.settle('b');
	await w.settle('a');
	await p;
	for (const key of ['c', 'd', 'e']) await w.settle(key);
	assert.deepEqual(w.calls, ['a', 'b', 'c', 'd', 'e']);
	assert.deepEqual(w.stream.stats().kitOrder, w.calls);
});

test('streamer: never more than kitConcurrency kits at once, and a free slot is used at once', async () => {
	const w = fakeWorld({ ring0: 0, count: 10, concurrency: 3 });
	const p = w.stream.start();
	await p; // no ring 0: nothing to wait for
	assert.equal(w.pending.size, 3);
	assert.deepEqual(w.calls, ['k0', 'k1', 'k2']);
	await w.settle('k1');
	assert.deepEqual(w.calls, ['k0', 'k1', 'k2', 'k3']);
	for (const key of [...w.pending.keys()]) await w.settle(key);
	while (w.pending.size) for (const key of [...w.pending.keys()]) await w.settle(key);
	assert.equal(w.calls.length, 10);
	assert.ok(w.peak() <= 3, `peak ${w.peak()}`);
	assert.equal(w.stream.stats().maxInflight, w.peak());
});

test('streamer: step() stays inside the frame budget but always builds one', async () => {
	const w = fakeWorld({ ring0: 1, count: 7, cost: 3, budget: 4 });
	const p = w.stream.start();
	await w.settle('k0');
	await p;
	for (let k = 1; k < 7; k++) await w.settle(`k${k}`);
	assert.equal(w.stream.step(), 2, '3 ms each: the second one passes the 4 ms budget, the third is left for the next frame');
	assert.equal(w.stream.step(), 2);
	assert.equal(w.stream.step(), 2);
	assert.equal(w.stream.step(), 0);
	assert.deepEqual(w.built, ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6']);
	const slow = fakeWorld({ ring0: 1, count: 4, cost: 10, budget: 4 });
	const q = slow.stream.start();
	await slow.settle('k0');
	await q;
	for (let k = 1; k < 4; k++) await slow.settle(`k${k}`);
	assert.deepEqual([slow.stream.step(), slow.stream.step(), slow.stream.step(), slow.stream.step()], [1, 1, 1, 0], 'a module over budget is still built: one per frame, so it always progresses');
	assert.equal((await slow.stream.done).built, 4);
});

test('streamer: step(budgetMs) takes the frame budget from the caller (a slow renderer gets a bigger one)', async () => {
	const w = fakeWorld({ ring0: 1, count: 7, cost: 3, budget: 4 });
	const p = w.stream.start();
	await w.settle('k0');
	await p;
	for (let k = 1; k < 7; k++) await w.settle(`k${k}`);
	assert.equal(w.stream.step(4), 2);
	assert.equal(w.stream.step(25), 4, '3 ms each: a 25 ms budget builds the other four in one frame');
	assert.equal(w.stream.step(25), 0);
});

test('streamer: a module whose kit is late is skipped, not waited for; a failed kit does not stop the map', async () => {
	const w = fakeWorld({ ring0: 1, count: 4, cost: 0 });
	const p = w.stream.start();
	await w.settle('k0');
	await p;
	await w.settle('k2'); // m2 is ready, m1 is not
	assert.equal(w.stream.step(), 1);
	assert.deepEqual(w.built, ['m0', 'm2']);
	await w.settle('k1', true); // fails: m1 builds without it
	await w.settle('k3');
	assert.equal(w.stream.step(), 2);
	assert.deepEqual(w.built, ['m0', 'm2', 'm1', 'm3']);
	const stats = await w.stream.done;
	assert.equal(stats.built, 4);
	assert.deepEqual(stats.kitErrors, [{ key: 'k1', error: 'boom' }]);
});

test('streamer: timings per module and cancel()', async () => {
	const w = fakeWorld({ ring0: 1, count: 3, cost: 2 });
	const p = w.stream.start();
	w.clock.t = 5;
	await w.settle('k0');
	await p;
	w.clock.t = 9;
	await w.settle('k1');
	w.stream.step();
	const stats = w.stream.stats();
	const m1 = stats.modules.find((m) => m.id === 'm1');
	assert.equal(m1.built, true);
	assert.equal(m1.kitWaitMs, 9, 'kit wait = since the stream started');
	assert.equal(m1.buildMs, 2);
	assert.equal(stats.modules[0].buildMs, 2);

	w.stream.cancel();
	assert.equal(w.stream.step(), 0);
	assert.equal((await w.stream.done).cancelled, true);
	const callsBefore = w.calls.length;
	await w.settle('k2');
	assert.equal(w.calls.length, callsBefore, 'no kit starts after cancel');
	assert.equal(w.built.length, 2);

	const early = fakeWorld({ ring0: 1, count: 3 });
	const s = early.stream.start();
	early.stream.cancel();
	await s;
	assert.deepEqual(early.built, [], 'cancelled before ring 0 arrived: nothing is built');
});

test('streamer: held background kits wait for release(), even when ring 0 is in', async () => {
	const w = fakeWorld({ ring0: 1, count: 4, hold: true });
	const p = w.stream.start();
	await w.settle('k0');
	await p;
	assert.deepEqual(w.calls, ['k0'], 'ring 0 is in but the background is held');
	w.stream.release();
	assert.deepEqual(w.calls, ['k0', 'k1', 'k2', 'k3']);
});

test('streamer: pause() stops kits and builds, resume() goes on where it stopped', async () => {
	const w = fakeWorld({ ring0: 1, count: 5, cost: 0, concurrency: 1 });
	const p = w.stream.start();
	await w.settle('k0');
	await p;
	assert.deepEqual(w.calls, ['k0', 'k1']);
	w.stream.pause();
	await w.settle('k1'); // the one in flight finishes …
	assert.deepEqual(w.calls, ['k0', 'k1'], '… but no new kit starts while paused');
	assert.equal(w.stream.step(), 0, 'nothing is built while paused');
	w.stream.resume();
	assert.deepEqual(w.calls, ['k0', 'k1', 'k2']);
	assert.equal(w.stream.step(), 1, 'the module whose kit arrived while paused builds now');
	assert.deepEqual(w.built, ['m0', 'm1']);
});

test('streamer: done resolves when every module is built; an empty order is done at once', async () => {
	const w = fakeWorld({ ring0: 1, count: 2, cost: 0 });
	const p = w.stream.start();
	await w.settle('k0');
	await p;
	await w.settle('k1');
	w.stream.step();
	assert.equal((await w.stream.done).built, 2);
	const empty = new MapStream({ order: [], kitsOf: () => [], loadKit: async () => {}, buildModule: () => {}, now: () => 0 });
	assert.equal((await empty.done).total, 0);
});

test('the engine is untouched: layoutBiome still runs on the demo with its own checks', () => {
	const r = layoutBiome({ ...DEMO_PLAN, seed: SEEDS[0] }, buildCatalog({ sizes: JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8')), available: availableKits() }));
	assert.ok(r.report.checks.length >= 15);
	assert.deepEqual(noMs(r), noMs(layout(SEEDS[0])), 'same seed, same catalog: the same layout');
});

// ---- code hash in the keys (an edit of the engine / generator code is a new key)

test('fileHash / codeHash: line endings and a BOM are normalised, order and content matter', () => {
	const text = (sep, bom = '') => [['a', 'b'].join(String.fromCharCode(...sep)), bom + 'c'].map(fileHash);
	assert.equal(codeHash(text([10])), codeHash(text([13, 10], String.fromCharCode(0xfeff))));
	assert.equal(fileHash('a\r\nb\rc'), fileHash('a\nb\nc'));
	assert.notEqual(fileHash('a'), fileHash('a '));
	assert.notEqual(codeHash(['a', 'b'].map(fileHash)), codeHash(['b', 'a'].map(fileHash)));
	assert.notEqual(codeHash(['a', 'b'].map(fileHash)), codeHash(['a', 'c'].map(fileHash)));
	assert.notEqual(codeHash(['ab', ''].map(fileHash)), codeHash(['a', 'b'].map(fileHash)), 'file boundaries count');
	assert.match(codeHash(['x'].map(fileHash)), /^[0-9a-f]{28}$/);
});

test('the scene-side code hash (build-time ?hash imports bundled by esbuild) equals the node-side one (readFileSync) for every group', async () => {
	const out = await build({
		stdin: { contents: "export { codeOf, CODE_HASHES } from './src/env/mapCodeText.js';", resolveDir: root, sourcefile: 'entry.js' },
		bundle: true, format: 'esm', platform: 'node', write: false, logLevel: 'silent', plugins: [hashPlugin()],
	});
	assert.ok(out.outputFiles[0].text.length < 30000, 'only the hashes are bundled, not the sources');
	const url = `data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`;
	const { codeOf, CODE_HASHES } = await import(url);
	const wanted = Object.values(CODE_FILES).flat();
	assert.deepEqual(Object.keys(CODE_HASHES).sort(), [...wanted].sort(), 'mapCodeText imports exactly the files of CODE_FILES');
	for (const f of wanted) assert.equal(CODE_HASHES[f], fileHash(readFileSync(path.join(root, 'src', f), 'utf8')), f);
	for (const groups of [['layout'], ['layout', 'generator'], ['splat'], ['layout', 'generator', 'splat']]) {
		assert.equal(codeOf(groups), codeHashOnDisk(groups), groups.join('+'));
	}
	// and it is the SOURCE that is hashed: one changed character changes the hash
	const texts = CODE_FILES.layout.map((p) => readFileSync(path.join(root, 'src', p), 'utf8'));
	assert.notEqual(codeHash(texts.map(fileHash)), codeHash([`${texts[0]} `, ...texts.slice(1)].map(fileHash)));
	for (const p of wanted) assert.ok(existsSync(path.join(root, 'src', p)), p);
});

test('the generator group covers the acceptance code (mapModules.js) and the splat group the painter (scene, kit.js, terrain.js)', () => {
	assert.ok(CODE_FILES.generator.includes('env/mapModules.js'), 'MODULE_RULES / splitModules / loadOrder / checkModules / mapStart decide the accepted attempt');
	for (const f of ['scenes/biomeLayout.js', 'env/kit.js', 'env/terrain.js']) assert.ok(CODE_FILES.splat.includes(f), f);
});

test('genKey: the seed, size, generator version, options, catalog and code change it; the plan is not needed', () => {
	const g = (parts = {}, o = {}, c = catalog, k = {}) => genKey({ seed: 5, size: 128, version: 'plan-gen/2', ...parts }, o, c, k);
	const base = g();
	assert.equal(base, g());
	assert.match(base, /^[0-9a-f]{28}$/);
	assert.equal(base, g({}, { seeds: { ...DEFAULT_OPTIONS.seeds } }), 'explicit defaults');
	const accept = acceptKey(kitBytes);
	assert.match(accept, /^[0-9a-f]{28}$/);
	assert.equal(accept, acceptKey({ ...kitBytes }));
	assert.notEqual(g({}, {}, catalog, { accept }), base, 'the acceptance inputs are part of the key');
	assert.notEqual(accept, acceptKey({ ...kitBytes, fence: kitBytes.fence + 1 }), 'a kit size');
	assert.notEqual(g({}, {}, catalog, { accept }), g({}, {}, catalog, { accept: acceptKey({ ...kitBytes, fence: kitBytes.fence + 1 }) }), 'a changed kit size is a new gen key');
	assert.notEqual(accept, acceptKey(null), 'no kit sizes = no module acceptance');
	// a MODULE_RULES / splitModules / loadOrder edit is a change of env/mapModules.js: a different generator code hash, a different key
	const gen = CODE_FILES.generator.map((f) => fileHash(readFileSync(path.join(root, 'src', f), 'utf8')));
	const edited = gen.map((h, i) => (CODE_FILES.generator[i] === 'env/mapModules.js' ? fileHash(`${readFileSync(path.join(root, 'src/env/mapModules.js'), 'utf8')}// moduleKits: 10`) : h));
	assert.notEqual(g({}, {}, catalog, { code: codeHash(gen) }), g({}, {}, catalog, { code: codeHash(edited) }), 'an edited MODULE_RULES changes the key');
	for (const [name, other] of [['seed', g({ seed: 6 })], ['size', g({ size: 192 })], ['version', g({ version: 'plan-gen/3' })], ['biome', g({ biome: 'x' })], ['options', g({}, { density: { grass: 0.5 } })], ['code', g({}, {}, catalog, { code: 'abc' })], ['format', g({}, {}, catalog, { format: MAP_FORMAT_VERSION + 1 })]]) {
		assert.notEqual(base, other, name);
	}
	assert.notEqual(base, layoutKey({ ...DEMO_PLAN, seed: 5 }, {}, catalog), 'not a layout key');
});

test('every baked generated map (assets/maps) matches the current code: otherwise it is stale, re-bake it', (t) => {
	const indexFile = path.join(root, 'assets/maps/index.json');
	if (!existsSync(indexFile)) return t.skip('no bake yet (npm run bake:map)');
	const index = JSON.parse(readFileSync(indexFile, 'utf8'));
	const code = codeHashOnDisk(['layout', 'generator']);
	const accept = acceptKey(kitBytes);
	const stale = [];
	let checked = 0;
	for (const entry of Object.values(index.maps).filter((e) => /^gen-moor-\d+-s\d+$/.test(e.plan))) {
		const [, size, seed] = /^gen-moor-(\d+)-s(\d+)$/.exec(entry.plan).map(Number);
		const record = index.gen?.[genKey({ seed, size, version: PLAN_GEN_VERSION }, {}, catalog, { code, accept })];
		const label = `${entry.plan} (npm run bake:map -- --plan seed --seed ${seed} --size ${size})`;
		checked++;
		if (!record) { stale.push(`${label}: generator key not current`); continue; }
		const plan = generatePlan(seed, { size, attempt: record.attempt });
		const key = layoutKey(plan, {}, catalog, { code });
		if (record.key !== key || !index.maps[key]) { stale.push(`${label}: layout key not current`); continue; }
		if (JSON.parse(readFileSync(path.join(root, 'assets/maps', index.maps[key].file), 'utf8')).key !== key) stale.push(`${label}: file key differs from the index`);
	}
	assert.ok(checked > 0, 'a baked generated map exists (assets/maps/gen-moor-128-s1: the default map)');
	assert.deepEqual(stale, [], `stale baked maps - re-bake: ${stale.join('; ')}`);
});

// ---- start point, content rings, re-prioritising

test('mapStart: the own start of the plan when it has one, else 14 m along the main path', () => {
	assert.deepEqual(mapStart({ ...DEMO_PLAN, start: { x: 3, z: -4 } }), { x: 3, z: -4 });
	assert.deepEqual(mapStart(DEMO_PLAN), start);
	assert.ok(Math.hypot(start.x - DEMO_PLAN.paths[0].points[0].x, start.z - DEMO_PLAN.paths[0].points[0].z) > 10);
});

test('load order by content: a module whose cell is far but whose content reaches the start is in ring 0', () => {
	const mk = (id, i, j, bounds) => ({ id, i, j, cell: { x0: i * 16, z0: j * 16, x1: i * 16 + 16, z1: j * 16 + 16 }, bounds });
	const manifest = { size: 16, modules: [mk('a', 0, 0, { x0: 1, z0: 1, x1: 5, z1: 5 }), mk('b', 3, 0, { x0: 20, z0: 4, x1: 52, z1: 12 }), mk('c', 3, 2, { x0: 50, z0: 36, x1: 62, z1: 40 })] };
	const order = loadOrder(manifest, { x: 8, z: 8 });
	const by = Object.fromEntries(order.map((o) => [o.id, o]));
	assert.equal(by.a.ring, 0);
	assert.equal(by.b.ring, 0, 'a big mass owned by a far module (cell 40 m away) reaches the first screen (its content is 12 m away)');
	assert.ok(by.b.distance < boxDistance(manifest.modules[1].cell, 8, 8), 'the content is nearer than the cell');
	assert.ok(by.c.ring > 0, 'content that is far stays far');
});

test('streamer: reprioritise(point) re-sorts the modules and kits not started yet; built ones and ring 0 stay', async () => {
	const order = Array.from({ length: 6 }, (_, k) => ({ id: `m${k}`, ring: k === 0 ? 0 : k, distance: k * 10 }));
	const reorder = (p) => order.map((o, k) => ({ id: o.id, distance: Math.abs(k * 10 - p.x) })).sort((a, b) => a.distance - b.distance);
	const calls = [];
	const built = [];
	const stream = new MapStream({
		order, kitsOf: (id) => [`k${id}`], reorder, now: () => 0, rules: { ...MODULE_RULES, kitConcurrency: 1 }, holdBackground: true,
		loadKit: (key) => { calls.push(key); return Promise.resolve(); },
		buildModule: (id) => built.push(id),
	});
	await stream.start();
	assert.deepEqual(built, ['m0']);
	assert.equal(stream.reprioritise({ x: 50, z: 0 }), true);
	stream.release();
	await new Promise((r) => setTimeout(r, 0));
	for (let n = 0; n < 8; n++) { stream.step(); await new Promise((r) => setTimeout(r, 0)); }
	assert.deepEqual(built, ['m0', 'm5', 'm4', 'm3', 'm2', 'm1'], 'the rest builds nearest to the new focus first');
	assert.deepEqual(calls.slice(0, 3), ['km0', 'km5', 'km4'], 'kits follow the new order');
	assert.equal(stream.reprioritise({ x: 0, z: 0 }), false, 'nothing left to reorder');
	assert.equal(new MapStream({ order, kitsOf: () => [], loadKit: async () => {}, buildModule() {} }).reprioritise({ x: 0, z: 0 }), false, 'no reorder function: ignored');
});

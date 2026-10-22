// Acceptance tests of the plan generator (src/env/planGen.js): one seed → a complete plan → layoutBiome → every check passes.
// The rule checks here are brute force and written from the plan data (they do not call checkPlan), so a bug in a check cannot hide a bug in the generator.
// Usage: node --test scripts/plan-gen.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { layoutBiome, pointInPoly } from '../src/env/biomeLayout.js';
import { DEMO_PLAN } from '../src/env/biomeLayoutDemo.js';
import { buildCatalog } from '../src/env/biomeCatalog.js';
import { ASSET_BOX, BIOME_RECIPES, Line, PLAN_GEN_RULES, PLAN_GEN_RULE_SOURCES, PLAN_GEN_VERSION, checkPlan, generateMap, generatePlan, groundGrid } from '../src/env/planGen.js';

const sizes = JSON.parse(readFileSync(new URL('../src/env/kitSizes.json', import.meta.url), 'utf8'));
const catalog = buildCatalog({ sizes });
const R = PLAN_GEN_RULES;
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

const stripGround = (plan) => JSON.parse(JSON.stringify({ ...plan, ground: undefined }));
const centreOf = (zone) => (zone.shape.r !== undefined ? zone.shape : zone.shape[0]);
const segDist = (x, z, a, b) => {
	const dx = b.x - a.x, dz = b.z - a.z, t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
};
const polyDist = (pts, x, z) => Math.min(...pts.slice(0, -1).map((p, i) => segDist(x, z, p, pts[i + 1])));
const road = (plan) => new Line(plan.paths.find((p) => p.kind === 'road').points);

// the maps of seeds 1–40, computed once (generateMap = up to 8 attempts of plan + checks + layout)
const maps = new Map();
const timings = [];
function mapOf(seed, options = {}) {
	const key = `${seed}|${JSON.stringify(options)}`;
	if (!maps.has(key)) {
		const t0 = performance.now(), c0 = process.cpuUsage();
		const m = generateMap(seed, catalog, options);
		const c = process.cpuUsage(c0);
		timings.push({ key, ms: performance.now() - t0, cpu: (c.user + c.system) / 1000, attempts: m.attempts.length });
		maps.set(key, m);
	}
	return maps.get(key);
}
const plans = new Map();
const planOf = (seed, o = {}) => {
	const key = `${seed}|${JSON.stringify(o)}`;
	if (!plans.has(key)) plans.set(key, generatePlan(seed, o));
	return plans.get(key);
};

// ---------------------------------------------------------------------------------------------------------------

test('rules: every number has a source, the table is frozen, the moor recipe is data', () => {
	assert.ok(Object.isFrozen(R) && Object.isFrozen(PLAN_GEN_RULE_SOURCES) && Object.isFrozen(BIOME_RECIPES) && Object.isFrozen(BIOME_RECIPES.moor));
	for (const key of Object.keys(R)) assert.ok(PLAN_GEN_RULE_SOURCES[key]?.length > 5, `rule ${key} has no source`);
	assert.equal(R.maxAttempts, 8);
	assert.match(PLAN_GEN_VERSION, /^plan-gen\/\d+/);
	const moor = BIOME_RECIPES.moor;
	assert.deepEqual(Object.keys(moor.pois).sort(), ['camp', 'den', 'farm', 'graveyard']);
	assert.ok(moor.poiMin === 3 && moor.poiMax === 4 && moor.water.creek === 0.7 && moor.water.pond === 0.5 && moor.extras.cart === 0.5);
});

test('asset boxes the plan check relies on agree with the catalog', () => {
	for (const [id, { box, scale }] of Object.entries(ASSET_BOX)) {
		const a = catalog.get(id);
		assert.ok(a, id);
		for (const k of ['x0', 'x1', 'z0', 'z1']) assert.ok(Math.abs(a.footprint[k] - box[k]) < 0.02, `${id}.${k}: catalog ${a.footprint[k]} vs table ${box[k]}`);
		assert.ok(Math.abs(a.scale[0] - scale[0]) < 0.01 || id === 'deadTrees.tall' || id === 'lighting.beacon', `${id} scale ${a.scale}`);
	}
	assert.ok(catalog.get('lighting.beacon').height * 1.3 >= 3.6, 'the camp beacon is a landmark (≥ 2 H) at scale 1.3');
	assert.ok(catalog.get('deadTrees.tall').height * 1.2 >= 3.6, 'the landmark tree is ≥ 2 H at scale 1.2');
});

test('1 · determinism: the same seed gives the same plan, the same ground, the same layout', () => {
	for (const seed of [1, 7, 99991, 20261020]) {
		const a = generatePlan(seed), b = generatePlan(seed);
		assert.deepEqual(stripGround(a), stripGround(b), `plan of seed ${seed}`);
		assert.deepEqual(groundGrid(a, 4), groundGrid(b, 4), `ground of seed ${seed}`);
		assert.equal(a.seed, seed);
		assert.equal(a.meta.generator, PLAN_GEN_VERSION);
	}
	// another attempt, another map; another seed, another map
	assert.notDeepEqual(stripGround(generatePlan(5, { attempt: 0 })), stripGround(generatePlan(5, { attempt: 1 })));
	assert.notDeepEqual(stripGround(generatePlan(5)), stripGround(generatePlan(6)));
	// the whole pipeline: same attempts, same placements
	for (const seed of [3, 11]) {
		const a = mapOf(seed), b = generateMap(seed, catalog);
		assert.deepEqual(a.attempts, b.attempts);
		assert.equal(a.attempt, b.attempt);
		const strip = (m) => m.result.placements.map((p) => [p.id, p.asset, p.x, p.z, p.yaw, p.scale]);
		assert.deepEqual(strip(a), strip(b), `layout of seed ${seed}`);
		assert.deepEqual(a.result.report.checks.map((c) => [c.id, c.pass]), b.result.report.checks.map((c) => [c.id, c.pass]));
	}
	// no clock and no Math.random in the generator
	const source = readFileSync(new URL('../src/env/planGen.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/env/planGenZones.js', import.meta.url), 'utf8');
	assert.ok(!/Math\.random|Date\.now|new Date/.test(source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'the generator reads no clock and no Math.random');
});

test('2 · shape: every field of DEMO_PLAN, plus start, exits and meta; unique ids; centimetres', () => {
	for (const seed of SEEDS.slice(0, 12)) {
		const plan = planOf(seed);
		for (const key of Object.keys(DEMO_PLAN)) assert.ok(key in plan, `${seed}: missing ${key}`);
		for (const key of ['start', 'exits', 'meta']) assert.ok(plan[key], `${seed}: missing ${key}`);
		assert.deepEqual(plan.bounds, { x0: -64, z0: -64, x1: 64, z1: 64 });
		assert.equal(plan.defaultZone, 'moor');
		assert.equal(typeof plan.ground, 'function');
		const g = plan.ground(3, 4);
		for (const k of ['height', 'wet', 'grass', 'blood', 'rock']) assert.ok(Number.isFinite(g[k]) && (k === 'height' || (g[k] >= 0 && g[k] <= 1)), `${seed} ground.${k}=${g[k]}`);
		assert.equal(typeof g.water, 'boolean');
		assert.equal(plan.meta.size, 128);
		assert.ok(plan.meta.zones.length >= 2 && Array.isArray(plan.meta.notes));
		assert.deepEqual(plan.exits.map((e) => e.id), ['entrance', 'exit']);
		// the road
		const r = plan.paths.find((p) => p.kind === 'road');
		assert.equal(r.width, 4.2);
		assert.ok(r.inhabited);
		for (const p of plan.paths) for (const q of p.points) assert.ok(Math.abs(q.x * 100 - Math.round(q.x * 100)) < 1e-6 && Math.abs(q.z * 100 - Math.round(q.z * 100)) < 1e-6, `${seed}: ${p.id} point not in cm`);
		for (const list of [plan.doors, plan.interactions, plan.spawns, plan.masses, plan.hosts.filter((h) => h.at)]) for (const e of list) assert.ok(Math.abs(e.at.x * 100 - Math.round(e.at.x * 100)) < 1e-6, `${seed}: ${e.id}`);
		// ids are unique per list and references resolve
		for (const [name, list] of Object.entries({ zones: plan.zones, paths: plan.paths, doors: plan.doors, masses: plan.masses, hosts: plan.hosts, events: plan.events, spawns: plan.spawns, interactions: plan.interactions, arenas: plan.arenas })) assert.equal(new Set(list.map((e) => e.id)).size, list.length, `${seed}: ${name} ids`);
		const known = new Set([...plan.masses, ...plan.hosts, ...plan.doors, ...plan.interactions, ...plan.spawns].map((e) => e.id));
		for (const e of plan.events) assert.ok(known.has(e.host), `${seed}: event ${e.id} host ${e.host}`);
		for (const h of plan.hosts) if (h.mass) assert.ok(plan.masses.some((m) => m.id === h.mass));
		for (const h of plan.hosts) if (h.owns) assert.ok(plan.interactions.some((i) => i.id === h.owns));
	}
});

test('3 · variety over 40 seeds: roads, zone sets, positions, water', () => {
	const plansList = SEEDS.map((s) => planOf(s));
	const fp = (list) => new Set(list).size;
	const roads = plansList.map((p) => p.paths[0].points.map((q) => `${Math.round(q.x / 4)},${Math.round(q.z / 4)}`).join(';'));
	assert.equal(fp(roads), 40, 'every road is different');
	const sets = plansList.map((p) => p.meta.zones.map((z) => z.replace(/-\d+$/, '')).sort().join('+'));
	assert.ok(fp(sets) >= 4, `zone sets: ${[...new Set(sets)].join(' | ')}`);
	const centres = plansList.flatMap((p) => p.zones.filter((z) => z.kind === 'camp').map((z) => `${Math.round(z.shape.x / 8)},${Math.round(z.shape.z / 8)}`));
	assert.ok(fp(centres) >= 8, 'camp positions vary');
	const creek = plansList.filter((p) => p.water.some((w) => w.points)).length, pond = plansList.filter((p) => p.water.some((w) => w.polygon)).length;
	assert.ok(creek >= 20 && creek <= 38, `${creek} creeks of 40`);
	assert.ok(pond >= 10 && pond <= 32, `${pond} ponds of 40`);
	const routes = fp(plansList.map((p) => `${p.exits[0].edge}>${p.exits[1].edge}`));
	assert.ok(routes >= 4, `${routes} entrance / exit edge pairs`);
	const kinds = {};
	for (const p of plansList) for (const z of p.zones) if (z.kind !== 'bank' && z.kind !== 'field') kinds[z.kind] = (kinds[z.kind] ?? 0) + 1;
	for (const k of ['farm', 'camp', 'den', 'graveyard']) assert.ok(kinds[k] >= 12, `${k}: ${kinds[k]} of 40`);
	const carts = plansList.filter((p) => p.masses.some((m) => m.id === 'cart')).length, ruts = plansList.filter((p) => p.paths[0].ruts).length;
	assert.ok(carts >= 8 && carts <= 32 && ruts >= 12 && ruts <= 36, `carts ${carts}, ruts ${ruts}`);
	console.log(`variety: ${fp(sets)} zone sets (${[...new Set(sets)].join(', ')}), zones ${JSON.stringify(kinds)}, creek ${creek}/40, pond ${pond}/40, carts ${carts}/40, ruts ${ruts}/40, ${routes} edge pairs (${[...new Set(plansList.map((p) => `${p.exits[0].edge}>${p.exits[1].edge}`))].join(' ')})`);
});

test('4 · acceptance: plan checks pass on attempt 0 for most seeds; generateMap accepts ≥ 95 % of seeds 1–40 and every accepted map passes all checks', () => {
	let first = 0, accepted = 0;
	const dist = {}, failedIds = {}, rest = [];
	for (const seed of SEEDS) {
		const m = mapOf(seed);
		dist[m.attempts.length] = (dist[m.attempts.length] ?? 0) + 1;
		for (const a of m.attempts) for (const id of a.failed) failedIds[id] = (failedIds[id] ?? 0) + 1;
		if (m.attempts[0].failed.length === 0) first++;
		if (m.ok) {
			accepted++;
			// every plan check and all 19 engine checks pass on the accepted attempt
			const checks = checkPlan(m.plan, { catalog });
			assert.deepEqual(checks.filter((c) => !c.pass).map((c) => c.id), [], `seed ${seed}: plan checks`);
			assert.equal(m.result.report.checks.length, 19);
			assert.deepEqual(m.result.report.checks.filter((c) => !c.pass).map((c) => c.id), [], `seed ${seed}: engine checks`);
			assert.equal(m.plan.meta.attempt, m.attempt);
			assert.equal(m.attempts.length, m.attempt + 1);
		} else rest.push(`${seed}: ${m.attempts.at(-1).failed.join(',')}`);
		assert.ok(m.attempts.length <= R.maxAttempts);
	}
	const planFirst = SEEDS.filter((s) => checkPlan(planOf(s), { catalog }).every((c) => c.pass)).length;
	console.log(`accepted ${accepted}/40 · whole map right on attempt 0: ${first}/40 · plan checks right on attempt 0: ${planFirst}/40 · attempts ${JSON.stringify(dist)} · failures by id ${JSON.stringify(failedIds)}${rest.length ? ` · not accepted: ${rest.join(' ; ')}` : ''}`);
	assert.ok(accepted >= 38, `accepted ${accepted} of 40: ${rest.join(' ; ')}`);
	assert.ok(planFirst >= 30, `plan checks pass on attempt 0 for ${planFirst} of 40 seeds`);
});

test('5 · rules, re-derived from the plan: doors face the front, the camp is behind the road, busy zones are far from the start, branches reach their zone and stay dry, the waypoint is near the entrance, the back edges carry a ridge with a road gap', () => {
	let doors = 0, camps = 0, branches = 0;
	for (const seed of SEEDS) {
		const m = mapOf(seed), plan = m.plan, rd = road(plan), st = plan.start;
		const creek = plan.water.find((w) => w.points), pond = plan.water.find((w) => w.polygon);
		const waterGap = (x, z) => Math.min(creek ? Math.min(...creek.points.slice(0, -1).map((p, i) => segDist(x, z, p, creek.points[i + 1]))) - creek.width / 2 : 99, pond ? (pointInPoly(pond.polygon, x, z) ? -1 : polyDist([...pond.polygon, pond.polygon[0]], x, z)) : 99);
		// doors, gates and den mouths face the front half-plane
		for (const d of plan.doors) { doors++; assert.ok(Math.sin(d.yaw) + Math.cos(d.yaw) > 0.25, `${seed}: ${d.id} yaw ${d.yaw}`); }
		for (const d of plan.masses.filter((q) => q.kind === 'den')) assert.ok(Math.sin(d.yaw) + Math.cos(d.yaw) > 0.25, `${seed}: den yaw`);
		// the camp is behind the road (north-west of it), busy zones start far from the start
		for (const z of plan.zones.filter((q) => q.kind === 'camp')) {
			camps++;
			const n = rd.nearest(z.shape.x, z.shape.z);
			assert.ok((-(z.shape.x - n.x) - (z.shape.z - n.z)) / Math.hypot(z.shape.x - n.x, z.shape.z - n.z) / Math.SQRT2 > 0.25, `${seed}: camp is not behind the road`);
			assert.ok(plan.masses.some((q) => q.asset?.startsWith('palisade.')), `${seed}: a camp has its palisade`);
		}
		for (const z of plan.zones.filter((q) => q.kind === 'camp' || q.kind === 'farm')) assert.ok(Math.hypot(z.shape.x - st.x, z.shape.z - st.z) >= 45, `${seed}: ${z.id} starts ${Math.hypot(z.shape.x - st.x, z.shape.z - st.z).toFixed(0)} m from the start`);
		// every zone is reached by a path that ends in it and starts on the road; no branch crosses water
		for (const z of plan.zones.filter((q) => q.shape.r !== undefined && q.kind !== 'bank')) {
			const own = plan.paths.filter((p) => p.kind !== 'road').find((p) => [p.points[0], p.points.at(-1)].some((q) => Math.hypot(q.x - z.shape.x, q.z - z.shape.z) <= z.shape.r + 2));
			assert.ok(own, `${seed}: zone ${z.id} has no path`);
			const ends = [own.points[0], own.points.at(-1)].map((q) => rd.nearest(q.x, q.z).d);
			assert.ok(Math.min(...ends) <= (own.kind === 'animal' ? 14 : 3.2), `${seed}: ${own.id} does not reach the road`);
			branches++;
		}
		for (const p of plan.paths.filter((q) => q.kind !== 'road')) {
			const l = new Line(p.points);
			for (let s = 0; s <= l.length; s += 1) { const q = l.at(s); assert.ok(waterGap(q.x, q.z) > p.width / 2, `${seed}: ${p.id} touches water at s = ${s}`); }
		}
		// the waypoint: 6–10 m beside the road, 10–24 m from the entrance
		const wp = plan.interactions.find((i) => i.id === 'waypoint'), wn = rd.nearest(wp.at.x, wp.at.z);
		assert.ok(wn.d >= 5.8 && wn.d <= 10.2 && wn.s >= 10 && wn.s <= 24.5 && wp.radius === 2.6, `${seed}: waypoint ${wn.d.toFixed(1)} m beside, s ${wn.s.toFixed(1)}`);
		// the road crosses the creek once; start 14 m along
		if (creek) {
			let crossings = 0, last = -99;
			for (let s = 0; s < rd.length; s += 0.5) {
				const a = rd.at(s), b = rd.at(s + 0.5);
				const da = Math.min(...creek.points.slice(0, -1).map((p, i) => segDist(a.x, a.z, p, creek.points[i + 1]))) - creek.width / 2, db = Math.min(...creek.points.slice(0, -1).map((p, i) => segDist(b.x, b.z, p, creek.points[i + 1]))) - creek.width / 2;
				if (da > 0 && db <= 0) { if (s - last > 6) crossings++; last = s; }
			}
			assert.equal(crossings, 1, `${seed}: the road enters the creek ${crossings} times`);
		}
		assert.ok(Math.abs(rd.nearest(st.x, st.z).s - 14) < 1 && rd.nearest(st.x, st.z).d < 0.5);
		// the back-edge ridge: rock and cliffs on the north edge (and the west edge unless the road is there), a gap where the road meets it
		const b = plan.bounds, ends = [plan.paths[0].points[0], plan.paths[0].points.at(-1)];
		const onWest = ends.some((p) => p.x < -60);
		let rockN = 0, n = 0;
		for (let x = -40; x <= 40; x += 4) { if (ends.some((e) => Math.hypot(e.x - x, e.z - b.z0) < 16)) continue; rockN += plan.ground(x, b.z0 + 2.5).rock; n++; }
		if (n) assert.ok(rockN / n > 0.25, `${seed}: no rock on the north ridge (${(rockN / n).toFixed(2)})`);
		assert.ok(plan.masses.some((q) => q.kind === 'cliff' && q.at.z < b.z0 + 8), `${seed}: no cliff on the north edge`);
		if (!onWest) assert.ok(plan.masses.some((q) => q.kind === 'cliff' && q.at.x < b.x0 + 8), `${seed}: no cliff on the west edge`);
		for (const e of ends) if (e.z < b.z0 + 4 || e.x < b.x0 + 4) assert.ok(plan.ground(e.x, e.z).rock < 0.35, `${seed}: the ridge has no gap at the road end`);
		// the front edges stay low: no cliff there
		assert.ok(!plan.masses.some((q) => q.kind === 'cliff' && (q.at.z > b.z1 - 10 || q.at.x > b.x1 - 10)));
		// camp / den / graves: nothing tall in front of the doors (the masses stand behind them)
		for (const d of plan.doors) {
			const f = { x: Math.sin(d.yaw), z: Math.cos(d.yaw) };
			for (const q of plan.masses.filter((x) => x.footprint && x.kind === 'building')) {
				const dx = q.at.x - d.at.x, dz = q.at.z - d.at.z;
				if (Math.hypot(dx, dz) < 8) assert.ok(dx * f.x + dz * f.z < 0.5, `${seed}: ${q.id} stands in front of ${d.id}`);
			}
		}
	}
	console.log(`rules held for ${doors} doors, ${camps} camps, ${branches} zone paths in 40 maps`);
});

test('6 · slopes and ground ranges: gentle on paths and in zone cores, values in the demo ranges', () => {
	for (const seed of SEEDS.slice(0, 20)) {
		const plan = planOf(seed), g = plan.ground, e = 0.4;
		const slope = (x, z) => Math.hypot(g(x + e, z).height - g(x - e, z).height, g(x, z + e).height - g(x, z - e).height) / (2 * e);
		let worst = 0;
		for (const p of plan.paths) { const l = new Line(p.points); for (let s = 0; s <= l.length; s += 2) { const q = l.at(s); worst = Math.max(worst, slope(q.x, q.z)); } }
		for (const z of plan.zones.filter((q) => q.shape.r !== undefined && q.kind !== 'bank')) for (let a = 0; a < 12; a++) worst = Math.max(worst, slope(z.shape.x + Math.cos(a / 2) * z.shape.r * 0.6, z.shape.z + Math.sin(a / 2) * z.shape.r * 0.6));
		assert.ok(worst < 0.55, `seed ${seed}: slope ${worst.toFixed(2)}`);
		let hMin = Infinity, hMax = -Infinity, water = 0, total = 0;
		for (let x = -63; x <= 63; x += 3) for (let z = -63; z <= 63; z += 3) {
			const v = g(x, z);
			hMin = Math.min(hMin, v.height); hMax = Math.max(hMax, v.height); total++;
			if (v.water) water++;
			for (const k of ['wet', 'grass', 'blood', 'rock']) assert.ok(v[k] >= 0 && v[k] <= 1 && Number.isFinite(v[k]), `${seed}: ${k} ${v[k]}`);
		}
		assert.ok(hMax - hMin < 7 && hMin > -4 && hMax < 5, `seed ${seed}: height ${hMin.toFixed(1)}…${hMax.toFixed(1)}`);
		assert.ok(water / total < 0.15, `seed ${seed}: ${water} water samples`);
		// the ground under a zone is dry
		for (const z of plan.zones.filter((q) => q.shape.r !== undefined && q.kind !== 'bank')) assert.ok(!g(z.shape.x, z.shape.z).water);
	}
});

test('7 · checkPlan catches what is wrong: a door facing the camera, a camp in front of the road, a spawn at the start, no ridge, a zone on water', () => {
	const base = planOf(2, {});
	const clone = (fn) => { const p = { ...base, zones: base.zones.map((z) => ({ ...z })), doors: base.doors.map((d) => ({ ...d })), spawns: base.spawns.map((s) => ({ ...s, at: { ...s.at } })), masses: base.masses.slice(), hosts: base.hosts.slice(), events: base.events.slice() }; fn(p); return p; };
	const failing = (p) => checkPlan(p).filter((c) => !c.pass).map((c) => c.id);
	const baseFail = failing(base);
	assert.ok(!baseFail.includes('doors-front') && !baseFail.includes('walled-back'), baseFail.join());
	assert.ok(failing(clone((p) => { p.doors[0].yaw = Math.PI * 1.25; })).includes('doors-front'));
	const withCamp = SEEDS.find((s) => planOf(s).zones.some((z) => z.kind === 'camp'));
	const cp = planOf(withCamp);
	const mirrorCamp = { ...cp, zones: cp.zones.map((z) => (z.kind === 'camp' ? { ...z, shape: { ...z.shape, x: -z.shape.x, z: -z.shape.z } } : z)) };
	assert.ok(checkPlan(mirrorCamp).some((c) => !c.pass && ['walled-back', 'zone-separation', 'reach'].includes(c.id)));
	const near = clone((p) => { p.spawns.push({ id: 'spawn-x', at: { x: p.start.x + 3, z: p.start.z + 3 }, radius: 1.4 }); });
	assert.ok(failing(near).includes('start-light'));
	assert.ok(failing(clone((p) => { p.masses = p.masses.filter((m) => m.kind !== 'cliff'); })).includes('boundary'));
	const wet = clone((p) => { const z = p.zones.find((q) => q.kind === 'den' || q.kind === 'graveyard' || q.kind === 'farm'); p.ground = (x, zz) => ({ ...base.ground(x, zz), water: Math.hypot(x - z.shape.x, zz - z.shape.z) < 2 }); });
	assert.ok(failing(wet).includes('on-water'));
	assert.ok(failing(clone((p) => { p.zones = p.zones.filter((z) => z.kind !== 'den' && z.kind !== 'graveyard' && z.kind !== 'farm'); })).includes('poi-count'));
	// the hand-made demo breaks exactly the numbers the generator keeps differently (den mouth facing west, camp 62 m from the centre, waypoint 3 m from the road)
	const demo = checkPlan(DEMO_PLAN).filter((c) => !c.pass).map((c) => c.id);
	assert.ok(demo.includes('doors-front') && demo.includes('waypoint'), demo.join());
});

test('8 · bigger maps: 192 and 256 m scale the zone counts and stay accepted', () => {
	for (const [size, seeds] of [[192, [1, 3]], [256, [1, 2]]]) {
		for (const seed of seeds) {
			const plan = planOf(seed, { size });
			assert.deepEqual(plan.bounds, { x0: -size / 2, z0: -size / 2, x1: size / 2, z1: size / 2 });
			assert.equal(plan.meta.size, size);
			const m = mapOf(seed, { size });
			const n = m.plan.zones.filter((z) => z.shape.r !== undefined && z.kind !== 'bank').length;
			assert.ok(n >= (size === 192 ? 5 : 9), `${size}: ${n} zones`);
			const t = timings.find((q) => q.key === `${seed}|${JSON.stringify({ size })}`);
			console.log(`size ${size} seed ${seed}: ${n} zones, ${m.ok ? 'accepted' : 'NOT accepted'} on attempt ${m.attempt}, generatePlan ${(() => { const c0 = process.cpuUsage(); generatePlan(seed, { size }); const c = process.cpuUsage(c0); return ((c.user + c.system) / 1000).toFixed(0); })()} ms CPU, whole map ${t.cpu.toFixed(0)} ms CPU`);
			assert.ok(m.ok, `${size}/${seed}: ${m.attempts.map((a) => a.failed.join(',')).join(' | ')}`);
			assert.equal(m.result.report.checks.length, 19);
		}
	}
});

test('9 · generateMap never throws and never loops unbounded', () => {
	const bad = generateMap(4, catalog, { biome: 'no-such-biome' });
	assert.equal(bad.ok, false);
	assert.ok(bad.attempts.length <= R.maxAttempts && bad.attempts.every((a) => a.failed.includes('plan:throw')));
	const few = generateMap(28, catalog, { maxAttempts: 2 });
	assert.ok(few.attempts.length <= 2);
	assert.ok(few.plan && few.result, 'the best attempt is returned even when it is not accepted');
	// a catalog that cannot place anything: still returns (the engine reports drops, never throws)
	const empty = buildCatalog({ sizes, available: new Set() });
	const r = generateMap(5, empty, { maxAttempts: 2 });
	assert.ok(r.attempts.length <= 2 && typeof r.ok === 'boolean');
});

test('performance: generatePlan ≤ 100 ms, generateMap ≈ 0.3–3 s (CPU time of the process, since the wall clock of a shared machine says little)', () => {
	for (const seed of [1, 2, 3]) generatePlan(seed + 500); // warm-up (JIT)
	const gen = SEEDS.map((seed) => { const c0 = process.cpuUsage(), t0 = performance.now(); generatePlan(seed + 1000); const c = process.cpuUsage(c0); return { cpu: (c.user + c.system) / 1000, wall: performance.now() - t0 }; });
	const stat = (list) => ({ mean: list.reduce((a, b) => a + b, 0) / list.length, max: Math.max(...list), p95: list.slice().sort((a, b) => a - b)[Math.floor(list.length * 0.95)] });
	const g = stat(gen.map((x) => x.cpu)), gw = stat(gen.map((x) => x.wall));
	const maps40 = timings.filter((t) => /\|\{\}$/.test(t.key)), mc = stat(maps40.map((t) => t.cpu)), mw = stat(maps40.map((t) => t.ms));
	console.log(`generatePlan: CPU mean ${g.mean.toFixed(0)} ms, p95 ${g.p95.toFixed(0)}, max ${g.max.toFixed(0)} (wall mean ${gw.mean.toFixed(0)}, max ${gw.max.toFixed(0)}) · generateMap: CPU mean ${mc.mean.toFixed(0)} ms, max ${mc.max.toFixed(0)} (wall mean ${mw.mean.toFixed(0)}, max ${mw.max.toFixed(0)}) over ${maps40.length} seeds`);
	assert.ok(g.mean <= 100 && g.p95 <= 100, `generatePlan CPU mean ${g.mean.toFixed(0)} ms, p95 ${g.p95.toFixed(0)} ms`);
	assert.ok(mc.mean <= 3000, `generateMap CPU mean ${mc.mean.toFixed(0)} ms`);
});

test('the engine still dresses what the generator makes: layoutBiome on a plan with another master seed keeps every check', () => {
	const m = mapOf(8);
	const again = layoutBiome({ ...m.plan, seed: m.plan.seed + 1 }, catalog);
	assert.equal(again.report.checks.length, 19);
	assert.deepEqual(again.report.checks.filter((c) => !c.pass).map((c) => c.id), [], 'no engine check fails on the re-seeded plan');
	assert.ok(again.placements.length > 100);
});

test('options.modules: the fast-load rules (AD 12 §4.14) become acceptance criteria — a map that breaks one is re-rolled (seed 170 breaks module-pieces on its first attempt)', async () => {
	const { demoCatalog, kitBytesOnDisk } = await import('./map-tools.mjs');
	const full = demoCatalog();
	const plain = generateMap(170, full);
	assert.equal(plain.ok, true);
	assert.equal(plain.attempt, 0, 'without the option the first accepted attempt stands');
	const strict = generateMap(170, full, { modules: { kitBytes: kitBytesOnDisk() } });
	assert.equal(strict.ok, true);
	assert.deepEqual(strict.attempts[0].failed, ['module:module-pieces'], 'the first attempt is rejected by a module rule');
	assert.ok(strict.attempt > 0 && strict.attempts.at(-1).failed.length === 0);
	assert.ok(strict.result.report.checks.every((c) => c.pass), 'and the engine is still happy');
});

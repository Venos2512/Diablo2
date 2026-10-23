// Acceptance tests of the Lychgate hub generator v2 (src/env/planGenHub.js): one seed → a compact WALLED hub (one stone town wall or wooden palisade
// ring of 40–48 m per side on the 64 × 64 m canvas) → layoutBiome → every hub check and every engine check passes (the one explicit waiver is named).
// The rule checks here are written from the plan data with their own brute force (they do not call checkHubPlan), so a bug in a check cannot hide a
// bug in the generator. The open-island layout of v1 stays as an option and gets a small test of its own.
// Usage: node --test scripts/hub-gen.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { buildCatalog } from '../src/env/biomeCatalog.js';
import { makeObb, obbSeparation, occlusionPolygon, occlusionWindows, pointInPoly, pointPolySigned, preparePlan, shapeGap, UNITS } from '../src/env/biomeLayout.js';
import { HUB_ASSETS, HUB_ENGINE_WAIVERS, HUB_GEN_VERSION, HUB_OCCLUSION_CEILING, occlusionExcludedWalls, HUB_RULES, HUB_RULE_SOURCES, HUB_WALLS, checkHubPlan, generateHubMap, generateHubPlan, hubGroundGrid } from '../src/env/planGenHub.js';

const catalog = buildCatalog({ sizes: JSON.parse(readFileSync(new URL('../src/env/kitSizes.json', import.meta.url), 'utf8')) });
const kitSizes = JSON.parse(readFileSync(new URL('../src/env/kitSizes.json', import.meta.url), 'utf8'));
const R = HUB_RULES;
const COT5_MAX = 0.25; // at most this share of seeds 1–40 has a fifth cottage (measured: 0 of 1–40, 11 of 200 = 6 %; see REPORT-fix-r2)
const PERF = { mean: 100, max: 200 }; // ms per plan (v1 asked 100 ms for the open island; the walled hub places 60+ wall pieces)
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
const CAM = { camera: { sweepK: 1 / Math.tan(UNITS.CAMERA.pitch), forward: UNITS.CAMERA.forward } };

const stripGround = (plan) => JSON.parse(JSON.stringify({ ...plan, ground: undefined }));
const segDist = (x, z, a, b) => {
	const dx = b.x - a.x, dz = b.z - a.z, t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
};
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const length = (pts) => pts.slice(1).reduce((s, p, i) => s + dist(p, pts[i]), 0);
const polyDistToLine = (x, z, pts) => Math.min(...pts.slice(1).map((p, i) => segDist(x, z, pts[i], p)));
const fpOf = (m) => makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw);
const route = (plan) => plan.paths.find((p) => p.id === 'route');
const of = (plan, glb) => plan.masses.filter((m) => m.glb === glb);
const wallsOf = (plan) => plan.masses.filter((m) => m.tag === 'wall');
const areaOf = (p) => p.reduce((s, q, i) => s + (p[(i - 1 + p.length) % p.length].x * q.z - q.x * p[(i - 1 + p.length) % p.length].z), 0) / 2;
/** The ring as edges with the inward normal (either winding), from plan.hub.ring.poly. */
function ringEdges(plan) {
	const poly = plan.hub.ring.poly, s = areaOf(poly) > 0 ? 1 : -1;
	return poly.map((a, i) => {
		const b = poly[(i + 1) % poly.length], l = dist(a, b), t = { x: (b.x - a.x) / l, z: (b.z - a.z) / l }, n = { x: -t.z * s, z: t.x * s }, o = { x: -n.x, z: -n.z };
		return { a, b, t, n, len: l, front: o.x + o.z, letter: o.z > 0.9 ? 'S' : o.z < -0.9 ? 'N' : o.x > 0.9 ? 'E' : o.x < -0.9 ? 'W' : 'D' };
	});
}
const depthIn = (edges, p) => Math.min(...edges.map((e) => (p.x - e.a.x) * e.n.x + (p.z - e.a.z) * e.n.z));
const onLine = (edges, p) => Math.min(...edges.map((e) => segDist(p.x, p.z, e.a, e.b)));
const nearestEdge = (edges, p) => edges.reduce((best, e) => (segDist(p.x, p.z, e.a, e.b) < segDist(p.x, p.z, best.a, best.b) ? e : best));

/** Own flood fill from the causeway start (0.4 m cells, agent 0.35 m): collision masses dilated block (but not `without`), water blocks unless under a path (not the hill trail). Returns { each(fn), reached(p) }. */
function flood(plan, { without = null, cell = 0.4 } = {}) {
	const b = plan.bounds, nx = Math.ceil((b.x1 - b.x0) / cell), nz = Math.ceil((b.z1 - b.z0) / cell), ar = 0.35, blocked = new Uint8Array(nx * nz), cx = (i) => b.x0 + (i + 0.5) * cell, cz = (j) => b.z0 + (j + 0.5) * cell;
	for (const m of plan.masses) {
		if (m.collision === false || m.id === without) continue;
		const fp = fpOf(m);
		for (let j = Math.max(0, Math.floor((fp.z0 - ar - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((fp.z1 + ar - b.z0) / cell)); j++) for (let i = Math.max(0, Math.floor((fp.x0 - ar - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((fp.x1 + ar - b.x0) / cell)); i++) if (pointPolySigned(fp.pts, cx(i), cz(j)) < ar) blocked[j * nx + i] = 1;
	}
	const lines = plan.paths.filter((p) => p.id !== 'hill-trail').map((p) => ({ pts: p.points, half: p.width / 2 }));
	const onPath = (x, z) => lines.some((l) => l.pts.some((q, i) => i && segDist(x, z, l.pts[i - 1], q) <= l.half));
	for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (!blocked[j * nx + i] && plan.ground(cx(i), cz(j)).water && !onPath(cx(i), cz(j))) blocked[j * nx + i] = 1;
	const seen = new Uint8Array(nx * nz), st = plan.paths.find((p) => p.id === 'route').points[0], si = Math.floor((st.x - b.x0) / cell), sj = Math.floor((st.z - b.z0) / cell), q = [sj * nx + si];
	seen[q[0]] = 1;
	for (let h = 0; h < q.length; h++) {
		const k = q[h], i = k % nx, j = (k - i) / nx;
		for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, c = j + dj; if (a < 0 || c < 0 || a >= nx || c >= nz || blocked[c * nx + a] || seen[c * nx + a]) continue; seen[c * nx + a] = 1; q.push(c * nx + a); }
	}
	const at = (p) => { const i = Math.floor((p.x - b.x0) / cell), j = Math.floor((p.z - b.z0) / cell); for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, c = j + dj; if (a >= 0 && c >= 0 && a < nx && c < nz && seen[c * nx + a]) return true; } return false; };
	return { reached: at, each: (fn) => { for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (seen[j * nx + i]) fn(cx(i), cz(j)); } };
}
/** Walkable ground for the hero's CENTRE (own code, exact distances): dry or water under a path, and at least 0.35 m from every collision mass (distance to the footprint polygon edges; 0 inside). */
function walkable(plan) {
	const solid = plan.masses.filter((m) => m.collision !== false).map(fpOf), lines = plan.paths.map((p) => ({ pts: p.points, half: p.width / 2 })), ar = 0.35;
	const polyDist = (fp, x, z) => (pointInPoly(fp.pts, x, z) ? 0 : Math.min(...fp.pts.map((p, i) => segDist(x, z, p, fp.pts[(i + 1) % fp.pts.length]))));
	return (x, z) => !(plan.ground(x, z).water && !lines.some((l) => l.pts.some((q, i) => i && segDist(x, z, l.pts[i - 1], q) <= l.half))) && solid.every((fp) => x < fp.x0 - ar || x > fp.x1 + ar || z < fp.z0 - ar || z > fp.z1 + ar || polyDist(fp, x, z) >= ar);
}
/** The excluded wall pieces by the rule of occlusionExcludedWalls, re-derived here: fade-flagged pieces, and back pieces whose camera shadow covers < π · 0.35² m² of walkable ground, counted on a 0.1 m grid shifted by `off`. */
function excludedWalls(plan, off) {
	const walk = walkable(plan), out = new Set(), st = 0.1, need = Math.PI * 0.35 * 0.35;
	for (const w of wallsOf(plan)) {
		if (w.fade) { out.add(w.id); continue; }
		const hull = occlusionPolygon(CAM, fpOf(w), 0, w.height), hb = hull.reduce((a, p) => ({ x0: Math.min(a.x0, p.x), x1: Math.max(a.x1, p.x), z0: Math.min(a.z0, p.z), z1: Math.max(a.z1, p.z) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
		let area = 0;
		for (let i = Math.ceil((hb.x0 - off) / st); off + i * st <= hb.x1 && area < need; i++) for (let j = Math.ceil((hb.z0 - off) / st); off + j * st <= hb.z1 && area < need; j++) if (pointInPoly(hull, off + i * st, off + j * st) && walk(off + i * st, off + j * st)) area += st * st;
		if (area < need) out.add(w.id);
	}
	return out;
}

const maps = new Map();
const timings = [];
function mapOf(seed) {
	if (!maps.has(seed)) {
		const t0 = performance.now();
		const m = generateHubMap(seed, catalog);
		timings.push({ seed, ms: performance.now() - t0, attempts: m.attempts.length });
		maps.set(seed, m);
	}
	return maps.get(seed);
}

// ---------------------------------------------------------------------------------------------------------------

test('rules: every number has a source, the tables are frozen, the asset and wall tables agree with the act1 lychgate map and kitSizes.json', () => {
	assert.ok(Object.isFrozen(R) && Object.isFrozen(HUB_RULE_SOURCES) && Object.isFrozen(HUB_ASSETS) && Object.isFrozen(HUB_ENGINE_WAIVERS) && Object.isFrozen(HUB_WALLS));
	for (const key of Object.keys(R)) assert.ok(HUB_RULE_SOURCES[key]?.length > 8, `rule ${key} has no source`);
	assert.equal(HUB_GEN_VERSION, 'hub-gen/4');
	assert.equal(R.size, 64);
	assert.deepEqual([R.walkSpeed, R.runSpeed], [1.6, 4.0]);
	assert.deepEqual([...R.wallRing], [40, 48]);
	assert.deepEqual([...R.routeInside], [35, 55]);
	assert.equal(R.wallClear, 2.5);
	assert.deepEqual([...R.cottagesWalled], [4, 5]); assert.equal(R.familyAttempts, 60); assert.ok(R.maxAttempts >= R.familyAttempts + 30, 'the fallback family needs room after the first family');
	assert.deepEqual([...R.causewayWalled], [6, 12]);
	assert.ok(R.bank < R.agent && R.apronReach >= Math.hypot(R.gateApron[0], R.gateApron[1] + 0.8), 'the footing is narrower than the agent; the apron fits inside the bypass exemption');
	// controller.js is the source of the speeds
	const controller = readFileSync(new URL('../src/character/controller.js', import.meta.url), 'utf8');
	assert.match(controller, /walkSpeed:\s*1\.6/);
	assert.match(controller, /runSpeed:\s*4\.0/);
	// the sizes are those of the asset table (A('id', …, [w, h, d], …)) of src/env/act1/maps/lychgate.js
	const src = readFileSync(new URL('../src/env/act1/maps/lychgate.js', import.meta.url), 'utf8');
	let checked = 0;
	for (const [id, { size }] of Object.entries(HUB_ASSETS)) {
		const m = new RegExp(`A\\('${id.replace('.', '\\.')}',[^\\n]*?\\[([\\d.]+), ([\\d.]+), ([\\d.]+)\\]`).exec(src);
		if (!m) continue; // bone-pile and the like come from other tables; the palisade kit comes from kitSizes.json
		assert.deepEqual(size, [Number(m[1]), Number(m[2]), Number(m[3])], `${id} size`);
		checked++;
	}
	assert.ok(checked >= 20, `only ${checked} assets found in lychgate.js`);
	// the palisade kit: width × height × depth from the footprint box of src/env/kitSizes.json
	for (const id of ['palisade.wall_a', 'palisade.wall_angle']) {
		const k = kitSizes[id], [w, h, d] = HUB_ASSETS[id].size;
		assert.ok(Math.abs((k.x1 - k.x0) - w) < 0.07 && Math.abs(k.y1 - h) < 0.07 && Math.abs((k.z1 - k.z0) - d) < 0.07, `${id} ${JSON.stringify([w, h, d])} vs ${JSON.stringify(k)}`);
	}
	assert.deepEqual([HUB_WALLS.stone.module, HUB_WALLS.stone.depth, HUB_WALLS.stone.h], [4.0, 0.73, 2.16]); // N02
	assert.deepEqual([HUB_WALLS.palisade.module, HUB_WALLS.palisade.depth, HUB_WALLS.palisade.h], [3.76, 2.24, 3.32]); // palisade.wall_a
});

test('the generator uses no Math.random and no clock; randomness is seeded streams', () => {
	const code = readFileSync(new URL('../src/env/planGenHub.js', import.meta.url), 'utf8').replace(/\/\/[^\n]*/g, '');
	assert.ok(!/Math\.random|Date\.now|new Date/.test(code));
});

test('determinism: the same seed gives the same plan, another seed or attempt another one', () => {
	for (const seed of [13, 15, 22]) {
		const a = generateHubPlan(seed), b = generateHubPlan(seed);
		assert.ok(!a.failed, `seed ${seed} attempt 0`);
		assert.equal(JSON.stringify(stripGround(a)), JSON.stringify(stripGround(b)));
		assert.deepEqual(hubGroundGrid(a), hubGroundGrid(b));
		assert.notEqual(JSON.stringify(stripGround(a)), JSON.stringify(stripGround(generateHubPlan(seed, { attempt: 1 }))));
	}
	assert.notEqual(JSON.stringify(stripGround(generateHubPlan(1))), JSON.stringify(stripGround(generateHubPlan(2))));
	const m1 = generateHubMap(15, catalog), m2 = generateHubMap(15, catalog);
	assert.equal(m1.attempt, m2.attempt);
	assert.equal(JSON.stringify(stripGround(m1.plan)), JSON.stringify(stripGround(m2.plan)));
	assert.deepEqual(m1.result.placements.map((p) => p.id), m2.result.placements.map((p) => p.id));
});

test('seeds 1–40 are accepted within the attempt budget: every hub check and every engine check passes (the occlusion waiver is named and re-measured)', () => {
	let withWalls = 0, restMax = 0, over = 0; const counts = [];
	for (const seed of SEEDS) {
		const m = mapOf(seed);
		assert.ok(m.ok, `seed ${seed}: ${m.attempts.at(-1).failed.join(', ')}`);
		assert.ok(m.attempts.length <= R.maxAttempts, `seed ${seed}: ${m.attempts.length} attempts`);
		assert.ok(m.hubChecks.length >= 18 && m.hubChecks.every((c) => c.pass), `seed ${seed}: ${m.hubChecks.filter((c) => !c.pass).map((c) => c.id)}`);
		const engine = m.result.report.checks;
		assert.ok(engine.length >= 19, `engine checks: ${engine.length}`);
		const waived = new Set(m.waived.map((w) => w.id));
		for (const c of engine) assert.ok(c.pass || waived.has(c.id), `seed ${seed}: engine ${c.id}`);
		for (const id of waived) assert.ok(Object.keys(HUB_ENGINE_WAIVERS).includes(id), `unlisted waiver ${id}`);
		// the waiver of the occlusion cap (fix r2 B1): the excluded wall pieces are (a) fade-flagged and (b) back pieces whose camera shadow covers < one agent disc of ground the hero's centre can stand on
		// (dry or under a path, >= 0.35 m from every solid mass; own code with exact polygon distance, 0.1 m grid at ANOTHER offset). The set must not depend on the grid: a half-cell shift gives the same pieces.
		// The share without them, recomputed here, stays under the ceiling; the share with every wall piece is reported in the waiver reason
		const exSet = excludedWalls(m.plan, 0.05), excluded = new Set([...exSet].map((id) => `mass:${id}`)), gen = (o) => occlusionExcludedWalls(m.plan, { offset: o }).map((q) => q.id).sort().join();
		assert.equal([...exSet].sort().join(), gen(0), `seed ${seed}: the excluded wall pieces (own mask at grid offset 0.05 vs the generator at 0)`);
		assert.equal(gen(0), gen(0.05), `seed ${seed}: the excluded set depends on the sample grid`);
		counts.push(exSet.size);
		const rules = m.result.report.rules, rest = occlusionWindows(preparePlan(m.plan, rules), m.result.placements.filter((p) => !(p.mass && excluded.has(`mass:${p.mass}`)) && !excluded.has(p.id)), rules);
		assert.ok(rest.raw <= HUB_OCCLUSION_CEILING + 1e-9, `seed ${seed}: occlusion without the excluded wall pieces ${rest.raw}`);
		restMax = Math.max(restMax, rest.raw);
		for (const c of engine.filter((q) => q.id === 'occlusion')) {
			withWalls = Math.max(withWalls, c.details.raw); if (c.details.raw > HUB_OCCLUSION_CEILING) over++;
			if (!c.pass) { const w = m.waived.find((q) => q.id === 'occlusion'); assert.ok(w, `seed ${seed}: occlusion failed and is not waived`); assert.ok(w.why.includes(`with every wall piece ${Math.round(c.details.raw * 1000) / 1000})`), `seed ${seed}: the waiver reason must report the share with the walls: ${w.why}`); }
		}
		assert.equal(m.result.report.warnings.filter((w) => w.code === 'authored.conflict').length, 0, `seed ${seed}: authored masses conflict with the play space`);
	}
	console.log(`# occlusion share: with every wall piece max ${withWalls.toFixed(3)} (${over} of ${SEEDS.length} seeds above the cap); without the excluded wall pieces max ${restMax.toFixed(3)} (cap ${HUB_OCCLUSION_CEILING}, margin ${(HUB_OCCLUSION_CEILING - restMax).toFixed(3)}); excluded pieces ${Math.min(...counts)}–${Math.max(...counts)} per map`);
	assert.ok(HUB_OCCLUSION_CEILING - restMax >= 0.02, `the margin under the ceiling shrank to ${(HUB_OCCLUSION_CEILING - restMax).toFixed(3)}`);
});

test('the 40 hubs are different: both wall types, ring sizes, corner styles, edge pairs and cottage counts vary', () => {
	const keys = new Set(SEEDS.map((s) => JSON.stringify(mapOf(s).plan.masses.map((m) => [m.id, m.at.x, m.at.z]))));
	assert.equal(keys.size, SEEDS.length);
	const types = SEEDS.map((s) => mapOf(s).plan.hub.wall.type);
	assert.ok(types.filter((t) => t === 'stone').length >= 12 && types.filter((t) => t === 'palisade').length >= 12, `wall types ${types.join()}`);
	assert.ok(new Set(SEEDS.map((s) => mapOf(s).plan.hub.ring.style)).size >= 3);
	// the gate pair belongs to the seed (a retry never changes it) and both families occur: opposite (S → N / E → W) and adjacent (S → W / E → N)
	const pairs = SEEDS.map((s) => `${mapOf(s).plan.hub.inEdge}${mapOf(s).plan.hub.gateEdge}`), count = (k) => pairs.filter((q) => q === k).length;
	assert.ok(count('SN') + count('EW') >= 20 && count('SW') + count('EN') >= 0.15 * SEEDS.length, `gate pairs ${pairs.join()}`);
	assert.ok(count('SN') >= 6 && count('EW') >= 6, 'both front sides (S and E) occur');
	for (const s of [3, 8, 17]) { const fam = (a) => { const p = generateHubPlan(s, { attempt: a }); return p.failed ? null : `${p.hub.inEdge}${p.hub.gateEdge}`; }; const f = [0, 1, 2, 3, 4, 5].map(fam).filter(Boolean); assert.ok(f.length >= 2 && new Set(f).size === 1, `seed ${s}: the gate pair changes between attempts: ${f}`); }
	const cot = SEEDS.map((s) => mapOf(s).plan.meta.cottages), five = cot.filter((c) => c === 5).length;
	assert.ok(cot.every((c) => c === 4 || c === 5), `cottage counts ${cot}`);
	assert.ok(cot.filter((c) => c === 4).length >= (1 - COT5_MAX) * cot.length, 'the cottage rule says "4, a fifth in ≈ 6 % of the seeds"');
	console.log(`# cottages incl. Edda's house: 4 × ${cot.length - five}, 5 × ${five} (${Math.round((100 * five) / cot.length)} %); gate pairs ${JSON.stringify(Object.fromEntries([...new Set(pairs)].map((k) => [k, count(k)])))}`);
	assert.ok(five <= COT5_MAX * SEEDS.length, `${five} of ${SEEDS.length} seeds have 5 cottages: the rule text (4, a fifth in ≈ 6 %) is out of date`);
	assert.ok(new Set(SEEDS.map((s) => mapOf(s).plan.hub.style)).size >= 3, 'cottage arrangements (band / split / corner) vary');
	assert.ok(new Set(SEEDS.map((s) => mapOf(s).plan.masses.filter((m) => m.glb === 'A01.1' && m.label !== "Edda's house").map((m) => `${Math.round(m.at.x / 4)},${Math.round(m.at.z / 4)}`).join(';'))).size >= 30, 'cottage positions vary');
	assert.ok(new Set(SEEDS.map((s) => Math.round(mapOf(s).plan.hub.ring.W))).size >= 3 && new Set(SEEDS.map((s) => Math.round(mapOf(s).plan.hub.ring.H))).size >= 3, 'ring sizes vary');
	// the 12 seeds of the contact sheet (13–24) show both wall types
	const sheet = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((s) => mapOf(s).plan.hub.wall.type);
	assert.ok(sheet.includes('stone') && sheet.includes('palisade'));
});

test('the wall ring: 40–48 m per side, the wall type recorded and matching its pieces, closed except the main gate (own flood fill with the 0.35 m agent)', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), hub = plan.hub, wt = HUB_WALLS[hub.wall.type];
		assert.ok(wt, 'wall type recorded');
		const xs = hub.ring.poly.map((p) => p.x), zs = hub.ring.poly.map((p) => p.z), W = Math.max(...xs) - Math.min(...xs), H = Math.max(...zs) - Math.min(...zs);
		assert.ok(W >= 40 - 0.05 && W <= 48 + 0.05 && H >= 40 - 0.05 && H <= 48 + 0.05, `seed ${seed}: ring ${W} × ${H}`);
		assert.ok(Math.abs(hub.ring.W - W) < 0.05 && Math.abs(hub.ring.H - H) < 0.05);
		const walls = wallsOf(plan), mods = walls.filter((m) => m.piece === 'module');
		assert.ok(mods.length >= 24);
		for (const m of mods) {
			assert.equal(m.glb, wt.glb);
			assert.equal(m.kind, 'wall');
			assert.equal(m.footprint.d, wt.depth);
			assert.equal(m.height, wt.h);
			assert.ok(Math.abs((m.footprint.w + R.wallGap) / wt.module - 1) <= R.wallStretch + 0.012, `stretch ${m.footprint.w}`);
		}
		assert.equal(hub.wall.type === 'stone', mods.every((m) => m.glb === 'N02'));
		assert.equal(walls.filter((m) => m.piece === 'pier').length, 2);
		assert.equal(walls.filter((m) => m.piece === 'lychgate').length, 1);
		assert.equal(walls.filter((m) => m.piece === 'vault').length, 1);
		assert.equal(walls.filter((m) => m.piece === 'wing').length, 2);
		assert.ok(walls.filter((m) => m.piece === 'tower').length >= 0 && walls.filter((m) => m.piece === 'tower').every((m) => m.glb === wt.corner.glb));
		// a joint post at every 45° joint of the ring (the outside V-notch), none elsewhere; no overlap with the modules
		const poly = hub.ring.poly, joints = walls.filter((m) => m.piece === 'joint');
		let turns = 0;
		for (let i = 0; i < poly.length; i++) {
			const a = poly[(i + poly.length - 1) % poly.length], v = poly[i], c = poly[(i + 1) % poly.length], t1 = { x: v.x - a.x, z: v.z - a.z }, t2 = { x: c.x - v.x, z: c.z - v.z };
			const turn = Math.acos((t1.x * t2.x + t1.z * t2.z) / (Math.hypot(t1.x, t1.z) * Math.hypot(t2.x, t2.z)));
			if (Math.abs(turn - Math.PI / 4) < 0.1) { turns++; assert.ok(joints.some((j) => dist(j.at, v) < 0.7 && j.glb === wt.joint.glb), `seed ${seed}: no joint post at (${v.x}, ${v.z})`); }
		}
		assert.equal(joints.length, turns, `seed ${seed}: ${joints.length} joint posts for ${turns} joints`);
		for (const j of joints) for (const w of walls) if (w !== j) assert.ok(obbSeparation(fpOf(j), fpOf(w)) >= -0.001, `${j.id} overlaps ${w.id}`);
		// ring.corners: the corner order is NW, NE, SE, SW; 0 = a 90° corner with a tower (the plan may be transposed)
		const bx = [Math.min(...xs), Math.max(...xs)], bz = [Math.min(...zs), Math.max(...zs)], cornerAt = [{ x: bx[0], z: bz[0] }, { x: bx[1], z: bz[0] }, { x: bx[1], z: bz[1] }, { x: bx[0], z: bz[1] }];
		cornerAt.forEach((c, i) => assert.equal(walls.some((m) => m.piece === 'tower' && dist(m.at, c) < 0.5), hub.ring.corners[i] === 0, `seed ${seed}: ring.corners[${i}] = ${hub.ring.corners[i]} (transposed ${hub.transposed})`));
		// closure: flood the interior from the square with the wall pieces dilated by the agent radius; the main gate plugged → nothing outside is reached
		const edges = ringEdges(plan), cell = 0.3, x0 = Math.min(...xs) - 5, z0 = Math.min(...zs) - 5, nx = Math.ceil((W + 10) / cell), nz = Math.ceil((H + 10) / cell), blocked = new Uint8Array(nx * nz);
		for (const m of walls) {
			const fp = fpOf(m);
			for (let j = Math.max(0, Math.floor((fp.z0 - 0.4 - z0) / cell)); j <= Math.min(nz - 1, Math.floor((fp.z1 + 0.4 - z0) / cell)); j++) for (let i = Math.max(0, Math.floor((fp.x0 - 0.4 - x0) / cell)); i <= Math.min(nx - 1, Math.floor((fp.x1 + 0.4 - x0) / cell)); i++) if (pointPolySigned(fp.pts, x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell) < 0.35) blocked[j * nx + i] = 1;
		}
		const gate = plan.doors.find((d) => d.id === 'main-gate'), gf = { x: Math.sin(gate.yaw), z: Math.cos(gate.yaw) };
		const plug = (x, z) => { const o = { x: x - gate.at.x, z: z - gate.at.z }; return Math.abs(o.x * gf.z - o.z * gf.x) <= R.gateOpening / 2 + 0.3 && Math.abs(o.x * gf.x + o.z * gf.z) <= 1.2; };
		const flood = (plugged) => {
			const seen = new Uint8Array(nx * nz), q = [Math.floor((plan.square.z - z0) / cell) * nx + Math.floor((plan.square.x - x0) / cell)];
			seen[q[0]] = 1;
			let outside = 0;
			for (let h = 0; h < q.length; h++) {
				const k = q[h], i = k % nx, j = (k - i) / nx;
				if (depthIn(edges, { x: x0 + (i + 0.5) * cell, z: z0 + (j + 0.5) * cell }) < -1) outside++;
				for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
					const a = i + di, b = j + dj;
					if (a < 0 || b < 0 || a >= nx || b >= nz || seen[b * nx + a] || blocked[b * nx + a] || (plugged && plug(x0 + (a + 0.5) * cell, z0 + (b + 0.5) * cell))) continue;
					seen[b * nx + a] = 1; q.push(b * nx + a);
				}
			}
			return outside;
		};
		assert.equal(flood(true), 0, `seed ${seed}: the ring leaks`);
		assert.ok(flood(false) > 300, `seed ${seed}: the main gate does not let the hero out`);
	}
});

test('gates: the main gate in a front wall (S / E) with the causeway arriving and Osric just inside; the lychgate and the vault door set into back walls (N / W); the hill lane; three exit doors', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), b = plan.bounds, hub = plan.hub, edges = ringEdges(plan), r = route(plan);
		assert.deepEqual([b.x1 - b.x0, b.z1 - b.z0], [64, 64]);
		assert.equal(plan.exits.length, 2);
		const [cw, hill] = plan.exits, mg = plan.doors.find((d) => d.id === 'main-gate');
		assert.ok(['S', 'E'].includes(cw.edge) && ['N', 'W'].includes(hill.edge), `seed ${seed}: ${cw.edge} → ${hill.edge}`);
		assert.ok(Math.abs(Math.sin(mg.yaw) + Math.cos(mg.yaw)) >= 0.99 && Math.sin(mg.yaw) + Math.cos(mg.yaw) > 0, 'the main gate faces the front');
		const lm = nearestEdge(edges, mg.at);
		assert.ok(lm.letter === cw.edge && segDist(mg.at.x, mg.at.z, lm.a, lm.b) < 0.3, `seed ${seed}: the main gate is not on its front wall line`);
		// the causeway: straight from the map edge into the gate, A06.1 modules, over water
		const L = hub.causeway.length, n = hub.causeway.segments;
		assert.ok(L >= R.causewayWalled[0] && L <= R.causewayWalled[1] && Math.abs(L / n - R.causewayModule) < 0.8 && dist(hub.causeway.to, mg.at) < 0.1, `causeway ${L} / ${n}`);
		assert.ok(Math.abs(cw.edge === 'S' ? cw.at.x - mg.at.x : cw.at.z - mg.at.z) < 0.5);
		let wet = 0;
		for (let s = 0; s <= L; s += 0.5) { const t = s / L, p = { x: cw.at.x + (hub.causeway.to.x - cw.at.x) * t, z: cw.at.z + (hub.causeway.to.z - cw.at.z) * t }; if (plan.ground(p.x, p.z).water) wet++; }
		assert.ok(wet >= 0.3 * (L / 0.5), `seed ${seed}: the causeway is not over water`);
		// Osric
		const post = of(plan, 'A15.6')[0], osric = plan.interactions.find((i) => i.id === 'osric');
		assert.ok(post && osric && dist(post.at, mg.at) <= R.osricFromGate && depthIn(edges, post.at) > 0);
		// the lychgate: one A02.1 with a gate door, in the wall line of a back wall, between two wall pieces, the route ends in front of it
		const g = of(plan, 'A02.1');
		assert.equal(g.length, 1);
		const lg = nearestEdge(edges, g[0].at);
		assert.ok(['N', 'W'].includes(lg.letter) && lg.letter === hill.edge && segDist(g[0].at.x, g[0].at.z, lg.a, lg.b) < 0.3, `seed ${seed}: lychgate wall ${lg.letter}`);
		assert.ok(wallsOf(plan).filter((w) => w.id !== g[0].id && obbSeparation(fpOf(g[0]), fpOf(w)) < 0.1).length >= 2);
		assert.ok(plan.doors.some((d) => d.id === 'lychgate' && d.kind === 'gate' && /Churchyard/.test(d.exit.to)));
		assert.ok(dist(r.points.at(-1), g[0].at) < 4.2);
		// the hill lane from the lychgate to the map edge
		const lane = plan.paths.find((p) => p.id === 'hill-trail');
		assert.ok(lane && dist(lane.points.at(-1), hill.at) < 0.6 && dist(lane.points[0], g[0].at) < 3.4);
		assert.ok(!plan.ground(lane.points.at(-1).x, lane.points.at(-1).z).water);
		// the vault door: in a back wall, between two N02 runs
		const v = of(plan, 'N01');
		assert.equal(v.length, 1);
		assert.deepEqual([v[0].footprint.w, v[0].footprint.d, v[0].height], [3.7, 1.07, 2.8]);
		const ve = nearestEdge(edges, v[0].at);
		assert.ok(['N', 'W'].includes(ve.letter) && segDist(v[0].at.x, v[0].at.z, ve.a, ve.b) < 0.3, `seed ${seed}: vault wall ${ve.letter}`);
		const wings = of(plan, 'N02').filter((w) => w.piece === 'wing');
		assert.equal(wings.length, 2);
		assert.ok(wings.every((w) => obbSeparation(fpOf(v[0]), fpOf(w)) < 0.1 && w.height === 2.16));
		const side = wings.map((w) => (w.at.x - v[0].at.x) * ve.t.x + (w.at.z - v[0].at.z) * ve.t.z);
		assert.ok(side[0] * side[1] < 0, 'one run each side');
		const vl = plan.paths.find((p) => p.id === 'lane-vault');
		assert.ok(vl && polyDistToLine(vl.points.at(-1).x, vl.points.at(-1).z, r.points) < 0.5 && polyDistToLine(plan.doors.find((d) => d.id === 'vault-door').at.x, plan.doors.find((d) => d.id === 'vault-door').at.z, r.points) <= R.vaultFromRoute);
		// exits: the lychgate, Edda's door, the vault door
		assert.deepEqual(plan.doors.filter((d) => d.exit).map((d) => d.id).sort(), ['edda-door', 'lychgate', 'vault-door']);
	}
});

test('interior: every building, prop, NPC point, door and path lies inside the ring; solid ≥ 2 m masses keep ≥ 2.5 m from the wall, low solid dressing ≥ 1.0 m', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), edges = ringEdges(plan), walls = wallsOf(plan), wfp = walls.map(fpOf);
		for (const m of plan.masses) {
			if (m.tag === 'wall') continue;
			const fp = fpOf(m);
			assert.ok(depthIn(edges, { x: m.at.x, z: m.at.z }) > 0 && fp.pts.every((p) => depthIn(edges, p) > 0), `seed ${seed}: ${m.id} outside the ring`);
			const need = m.collision === false ? 0.3 : m.height >= 2 ? 2.5 : 1.0;
			for (let i = 0; i < walls.length; i++) assert.ok(obbSeparation(fp, wfp[i]) >= need - 0.02, `seed ${seed}: ${m.id} is ${obbSeparation(fp, wfp[i])} m from ${walls[i].id}`);
		}
		for (const i of plan.interactions) assert.ok(depthIn(edges, i.at) > 0.5, `${i.id} NPC point`);
		for (const d of plan.doors) if (d.id !== 'main-gate') assert.ok(depthIn(edges, d.at) > -0.7, `${d.id}`);
		const cw = plan.hub.causeway.length;
		for (const p of plan.paths) {
			if (p.id === 'hill-trail') continue;
			let acc = 0;
			p.points.forEach((q, i) => { if (i) acc += dist(q, p.points[i - 1]); if (p.id === 'route' && acc <= cw + 0.5) return; assert.ok(depthIn(edges, q) > (p.id === 'route' ? -0.01 : 0.3), `seed ${seed}: ${p.id} leaves the ring`); });
		}
		const pond = plan.water.find((w) => w.id === 'pond');
		assert.ok(pond && pond.polygon.every((p) => depthIn(edges, p) > 1.5));
	}
});

test('route: main gate → square → lychgate is 35–55 m (walk and run seconds from the controller speeds), the square on the route and ≤ 24 m from the gate', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), pts = route(plan).points, total = length(pts), cw = plan.hub.causeway.length, inside = total - cw, sq = plan.square;
		assert.ok(inside >= 35 && inside <= 55, `seed ${seed}: route ${inside} m`);
		assert.ok(Math.abs(plan.meta.route.length - inside) < 0.03 && Math.abs(plan.meta.route.total - total) < 0.03);
		assert.ok(Math.abs(plan.meta.route.walkS - inside / 1.6) < 0.03 && Math.abs(plan.meta.route.runS - inside / 4.0) < 0.03);
		assert.ok(inside / 1.6 >= 21.8 && inside / 1.6 <= 34.4 && inside / 4 >= 8.7 && inside / 4 <= 13.8);
		const mg = plan.doors.find((d) => d.id === 'main-gate');
		assert.ok(dist(mg.at, sq) <= R.squareFromGate);
		assert.ok(polyDistToLine(sq.x, sq.z, pts) <= sq.r, 'the route passes through the square');
		// fix r1 m1: the first point inside the ring is the main gate, the square comes before the lychgate, the route ends in the lychgate's door corridor
		const edges = ringEdges(plan), first = pts.find((p, i) => i && depthIn(edges, p) >= 0), at = (p) => { let best = { d: Infinity, s: 0 }, acc = 0; pts.slice(1).forEach((q, i) => { const d = segDist(p.x, p.z, pts[i], q); if (d < best.d) best = { d, s: acc + Math.min(dist(pts[i], q), Math.max(0, ((p.x - pts[i].x) * (q.x - pts[i].x) + (p.z - pts[i].z) * (q.z - pts[i].z)) / dist(pts[i], q))) }; acc += dist(pts[i], q); }); return best.s; };
		assert.ok(dist(first, mg.at) < 1.5, `seed ${seed}: the first point inside the ring is ${JSON.stringify(first)}, the gate ${JSON.stringify(mg.at)}`);
		const lyd = plan.doors.find((d) => d.id === 'lychgate'), lf = { x: Math.sin(lyd.yaw), z: Math.cos(lyd.yaw) }, end = pts.at(-1), rel = { x: end.x - lyd.at.x, z: end.z - lyd.at.z };
		assert.ok(Math.abs(rel.x * lf.z - rel.z * lf.x) <= lyd.width / 2 + 0.5 && rel.x * lf.x + rel.z * lf.z >= -0.5 && rel.x * lf.x + rel.z * lf.z <= lyd.depth + 2, `seed ${seed}: the route ends ${JSON.stringify(rel)} off the lychgate door`);
		assert.ok(at(mg.at) < at(sq) && at(sq) < at(end) - 1, `seed ${seed}: order gate → square → lychgate`);
		// fix r1 m2: an NPC circle keeps ≥ 0.25 m off the route corridor
		for (const i of plan.interactions) assert.ok(polyDistToLine(i.at.x, i.at.z, pts) - i.radius - route(plan).width / 2 >= R.npcOffRoute - 0.01, `seed ${seed}: NPC ${i.id} circle on the route corridor (${polyDistToLine(i.at.x, i.at.z, pts)} m from the line)`);
		assert.ok(dist(pts[0], plan.exits[0].at) < 0.01);
		for (const p of plan.paths) for (const q of p.points) assert.ok(Math.abs(q.x) <= 32.01 && Math.abs(q.z) <= 32.01);
	}
});

test('front-wall policy (fade): a wall piece whose camera shadow covers the walkable interior is fade-flagged; the back walls stay full height', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), edges = ringEdges(plan), depth = HUB_WALLS[plan.hub.wall.type].depth;
		assert.equal(plan.hub.wall.frontPolicy, 'fade');
		let fade = 0, back = 0;
		for (const m of wallsOf(plan)) {
			const hull = occlusionPolygon(CAM, fpOf(m), 0, m.height), hb = hull.reduce((a, p) => ({ x0: Math.min(a.x0, p.x), x1: Math.max(a.x1, p.x), z0: Math.min(a.z0, p.z), z1: Math.max(a.z1, p.z) }), { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 });
			let n = 0;
			for (let x = Math.ceil(hb.x0 * 2) / 2; x <= hb.x1; x += 0.5) for (let z = Math.ceil(hb.z0 * 2) / 2; z <= hb.z1; z += 0.5) if (depthIn(edges, { x, z }) > depth / 2 + 0.2 && pointInPoly(hull, x, z)) n++;
			const area = n * 0.25;
			if (area > R.fadeReach + 0.6) assert.ok(m.fade === true, `seed ${seed}: ${m.id} shades ${area} m² of the interior and is not fade-flagged`);
			if (area < R.fadeReach - 0.6) assert.ok(!m.fade, `seed ${seed}: ${m.id} shades nothing and is flagged`);
			if (m.fade) fade++;
			// every straight back-wall module (outward normal toward N / W) is full height
			if (m.piece === 'module') { const e = nearestEdge(edges, m.at); if (e.front < -0.9) { back++; assert.ok(!m.fade, `${m.id} is a back-wall module`); } }
		}
		assert.ok(fade >= 10 && back >= 10, `seed ${seed}: ${fade} fade pieces, ${back} back modules`);
		assert.equal(plan.hub.wall.fade, fade);
	}
});

test('square: 10–14 m across, well near its centre, name board, bell frame and stall on its rim, forge open to it, clear standing area', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), sq = plan.square;
		assert.ok(sq.r * 2 >= 10.4 && sq.r * 2 <= 14.2, `seed ${seed}: ${sq.r * 2} m`);
		for (const glb of ['A01.5', 'A15.3', 'A15.4', 'A15.5', 'A15.2']) assert.equal(of(plan, glb).length, 1, `${glb}`);
		const well = of(plan, 'A01.5')[0];
		assert.ok(dist(well.at, sq) <= R.squareWell + 0.01);
		for (const glb of ['A15.3', 'A15.4', 'A15.5', 'A15.2']) {
			const m = of(plan, glb)[0], gap = pointPolySigned(fpOf(m).pts, sq.x, sq.z) - sq.r;
			assert.ok(gap >= -0.3 && gap <= 5.5, `seed ${seed}: ${glb} ${gap} m off the rim`);
		}
		for (const m of plan.masses) if (m.glb !== 'A01.5' && m.collision !== false) assert.ok(pointPolySigned(fpOf(m).pts, sq.x, sq.z) - sq.r >= -0.3, `${m.id} in the standing area`);
		const forge = of(plan, 'A15.2')[0], f = { x: Math.sin(forge.yaw), z: Math.cos(forge.yaw) }, v = { x: sq.x - forge.at.x, z: sq.z - forge.at.z }, l = Math.hypot(v.x, v.z);
		assert.ok((f.x * v.x + f.z * v.z) / l >= 0.5, 'the forge opens on the square');
		assert.deepEqual([forge.footprint.w, forge.footprint.d, forge.height], [6, 4.1, 4.05]);
		assert.deepEqual([well.footprint.w, well.footprint.d, well.height], [2.73, 2.39, 3.4]);
	}
});

test('stilt cottages: 4 or 5 with the real size and a poppy door, Edda\'s house over the inner pond by a plank walkway, an exit', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), cottages = of(plan, 'A01.1');
		assert.ok(cottages.length >= 4 && cottages.length <= 5, `seed ${seed}: ${cottages.length}`);
		for (const c of cottages) {
			assert.deepEqual([c.footprint.w, c.footprint.d, c.height], [5.42, 5.23, 5.2]);
			const d = plan.doors.find((q) => q.mass === c.id);
			assert.ok(d && d.poppy);
			assert.ok(Math.abs(d.at.x - (c.at.x + Math.sin(c.yaw) * 2.615)) < 0.02 && Math.abs(d.at.z - (c.at.z + Math.cos(c.yaw) * 2.615)) < 0.02, 'the door is on the front face');
		}
		const edda = cottages.filter((c) => c.label === "Edda's house");
		assert.equal(edda.length, 1);
		const door = plan.doors.find((d) => d.mass === edda[0].id), w = plan.paths.find((p) => p.id === 'walkway-edda');
		assert.ok(door.exit && /Edda/.test(door.exit.to));
		assert.ok(dist(w.points.at(-1), door.at) < 1.5);
		assert.equal(w.width, 1.8);
		let wet = 0, n = 0;
		for (let t = 0; t <= 1; t += 0.02) { n++; if (plan.ground(w.points[0].x + (w.points.at(-1).x - w.points[0].x) * t, w.points[0].z + (w.points.at(-1).z - w.points[0].z) * t).water) wet++; }
		assert.ok(wet / n >= 0.3, `seed ${seed}: the walkway is ${wet}/${n} over water`);
		assert.ok(!plan.ground(w.points[0].x, w.points[0].z).water);
		const pond = plan.water.find((q) => q.id === 'pond');
		assert.ok(pond && pond.polygon.length >= 12 && plan.ground(plan.hub.pond.c.x, plan.hub.pond.c.z).water);
		assert.equal(plan.hub.edda.segments, Math.ceil(dist(w.points[0], w.points.at(-1)) / 4));
	}
});

test('water-edge life where it fits: eel rack on a jetty at the pond, a willow by the water, at least 3 of 6 dressing kinds', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed);
		const jetty = plan.paths.find((p) => p.id === 'jetty'), rack = of(plan, 'A01.6');
		assert.equal(rack.length, 1);
		assert.ok(jetty && dist(rack[0].at, jetty.points[0]) <= 7);
		assert.ok(plan.ground(jetty.points.at(-1).x, jetty.points.at(-1).z).water && !plan.ground(jetty.points[0].x, jetty.points[0].z).water);
		const willows = of(plan, 'A04.2');
		assert.ok(willows.length >= 1);
		for (const wl of willows) {
			let near = Infinity;
			for (let r = 0.5; r <= 6 && near === Infinity; r += 0.5) for (let a = 0; a < 16; a++) if (plan.ground(wl.at.x + Math.cos((a / 16) * Math.PI * 2) * r, wl.at.z + Math.sin((a / 16) * Math.PI * 2) * r).water) { near = r; break; }
			assert.ok(near < 5, `${wl.id} is ${near} m from water`);
		}
		const kinds = [of(plan, 'N07').length >= 1, of(plan, 'N04').length >= 2, of(plan, 'N12').length >= 1, of(plan, 'N03').length >= 1, of(plan, 'N06').length >= 1, of(plan, 'A01.4').length >= 1];
		assert.ok(kinds.filter(Boolean).length >= 3, `seed ${seed}: dressing ${kinds}`);
	}
});

test('safe hub: no spawns, arenas, hosts or events; every NPC point ≤ 12 m off the route; every door, exit and NPC point reachable (engine passability)', () => {
	for (const seed of SEEDS) {
		const m = mapOf(seed), { plan } = m;
		assert.deepEqual([plan.spawns, plan.arenas, plan.hosts, plan.events], [[], [], [], []]);
		assert.equal(plan.autoMasses, false);
		assert.ok(m.result.placements.every((p) => !['cluster', 'trace', 'event'].includes(p.group)), 'no engine clusters or traces');
		for (const id of ['osric', 'brannoc', 'nell', 'name-board', 'bell']) {
			const i = plan.interactions.find((q) => q.id === id);
			assert.ok(i, `${id}`);
			assert.ok(polyDistToLine(i.at.x, i.at.z, route(plan).points) <= 12, `seed ${seed}: ${id}`);
		}
		const pass = m.result.report.checks.find((c) => c.id === 'passability');
		assert.ok(pass.pass && pass.details.seeded && pass.details.targets.length >= plan.doors.length + plan.interactions.length && pass.details.targets.every((t) => t.ok));
	}
});

test('camera (AD12 §5.2): doors face the front half-plane, and no full-height tall mass hides the route, a lane, a door, an NPC point or the standing area', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), sq = plan.square;
		for (const d of plan.doors) assert.ok(Math.sin(d.yaw) + Math.cos(d.yaw) >= 0.283 - 1e-6, `seed ${seed}: ${d.id} faces ${d.yaw}`);
		const keepers = [
			...plan.paths.filter((p) => p.id !== 'hill-trail').flatMap((p) => p.points.slice(1).map((q, i) => ({ t: 'capsule', a: p.points[i], b: q, r: p.width / 2 }))), // the hill lane lies behind the back wall: the wall hides it, by design
			...plan.interactions.map((i) => ({ t: 'circle', x: i.at.x, z: i.at.z, r: i.radius })),
			...plan.doors.map((d) => { const f = { x: Math.sin(d.yaw), z: Math.cos(d.yaw) }, c = { x: d.at.x + f.x * (d.depth / 2), z: d.at.z + f.z * (d.depth / 2) }; return { t: 'poly', pts: makeObb(c.x, c.z, d.width / 2, d.depth / 2 - 0.05, d.yaw).pts }; }),
			{ t: 'circle', x: sq.x, z: sq.z, r: sq.r * 0.62, disk: true },
		];
		for (const m of plan.masses) {
			if (m.height < 2 || m.collision === false || (m.tag === 'wall' && (m.fade || ['lychgate', 'vault', 'wing'].includes(m.piece)))) continue; // by role: a faded front wall, the lychgate, the vault door and its wings
			const hull = occlusionPolygon(CAM, fpOf(m), 0, m.height);
			for (const k of keepers) {
				if (m.glb === 'A01.5' && k.disk) continue;
				// the gates' own door corridors and the main-gate / hill-lane paths run through the wall line: a back-wall piece shades the fen outside, never them
				assert.ok(shapeGap(k, hull) >= 0, `seed ${seed}: ${m.id} hides ${k.t}`);
			}
		}
	}
});

test('play space: masses do not overlap (wall pieces touch with a 6 cm gap), stand on dry ground and off the route, lanes, walkways, door corridors and NPC points', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed);
		const obbs = plan.masses.map((m) => ({ m, fp: fpOf(m) }));
		for (let i = 0; i < obbs.length; i++) for (let k = i + 1; k < obbs.length; k++) assert.ok(obbSeparation(obbs[i].fp, obbs[k].fp) >= -0.001, `seed ${seed}: ${obbs[i].m.id} overlaps ${obbs[k].m.id}`);
		for (const { m, fp } of obbs) {
			assert.ok(!plan.ground(m.at.x, m.at.z).water, `${m.id} on water`);
			for (const w of plan.water) assert.ok(!fp.pts.some((q) => pointInPoly(w.polygon, q.x, q.z)) || m.glb === 'A04.2', `seed ${seed}: ${m.id} in ${w.id}`);
			if (m.collision === false) continue;
			for (const p of plan.paths) {
				if (p.id === 'route' && m.glb === 'A02.1') continue;
				for (let i = 0; i + 1 < p.points.length; i++) assert.ok(shapeGap({ t: 'capsule', a: p.points[i], b: p.points[i + 1], r: p.width / 2 }, fp.pts) >= -0.001, `seed ${seed}: ${m.id} on ${p.id}`);
			}
			for (const i of plan.interactions) assert.ok(shapeGap({ t: 'circle', x: i.at.x, z: i.at.z, r: i.radius }, fp.pts) >= -0.001, `${m.id} on NPC ${i.id}`);
		}
	}
});

test('performance: a plan takes mean ≤ 100 ms and ≤ 200 ms at most of CPU time (the walled hub places 60+ wall pieces; v1 asked 100 ms for the open island), checks and the engine are timed separately', () => {
	generateHubPlan(1); generateHubPlan(2); // warm up
	const times = [];
	for (const seed of SEEDS) {
		let best = Infinity;
		for (let k = 0; k < 2; k++) { const c0 = process.cpuUsage(); generateHubPlan(seed); const c = process.cpuUsage(c0); best = Math.min(best, (c.user + c.system) / 1000); } // CPU time of this process (other processes on the machine do not count), best of two
		times.push(best);
	}
	const max = Math.max(...times), mean = times.reduce((a, b) => a + b, 0) / times.length;
	console.log(`# plan ms: mean ${mean.toFixed(1)}, max ${max.toFixed(1)}`);
	assert.ok(max <= PERF.max && mean <= PERF.mean, `plans: mean ${mean.toFixed(1)} ms, slowest ${max.toFixed(1)} ms`);
	const t0 = performance.now();
	checkHubPlan(mapOf(3).plan);
	assert.ok(performance.now() - t0 < 400);
	const attempts = SEEDS.map((s) => mapOf(s).attempts.length);
	console.log(`# attempts: mean ${(attempts.reduce((a, b) => a + b, 0) / attempts.length).toFixed(2)}, max ${Math.max(...attempts)}; map ms mean ${(timings.reduce((a, b) => a + b.ms, 0) / Math.max(1, timings.length)).toFixed(0)}`);
});

test('the checks catch what they are for (mutated plans fail)', () => {
	const base = mapOf(15).plan;
	const mutate = (fn) => { const p = { ...JSON.parse(JSON.stringify({ ...base, ground: undefined })), ground: base.ground }; fn(p); return checkHubPlan(p).filter((c) => !c.pass).map((c) => c.id); };
	assert.deepEqual(checkHubPlan(base).filter((c) => !c.pass), []);
	assert.ok(mutate((p) => { p.spawns.push({ id: 's', at: { x: 0, z: 0 }, radius: 1 }); }).includes('safe'));
	assert.ok(mutate((p) => { const f = p.masses.find((m) => m.glb === 'A15.2'); f.at = { x: p.square.x, z: p.square.z }; }).includes('square'));
	assert.ok(mutate((p) => { p.masses = p.masses.filter((m) => m.glb !== 'A01.6'); }).includes('water-life'));
	assert.ok(mutate((p) => { p.masses = p.masses.filter((m) => m.glb !== 'A01.1' || m.label === "Edda's house"); }).includes('cottages'));
	assert.ok(mutate((p) => { p.doors.find((d) => d.id === 'main-gate').yaw = Math.PI; }).includes('doors-front'));
	assert.ok(mutate((p) => { const r = p.paths.find((q) => q.id === 'route'); r.points = r.points.slice(0, 8); }).includes('route'));
	// a hole in the wall ring: one wall module removed
	assert.ok(mutate((p) => { const i = p.masses.findIndex((m) => m.piece === 'module'); p.masses.splice(i, 1); }).includes('ring'));
	// a building pushed against the wall
	assert.ok(mutate((p) => { const c = p.masses.find((m) => m.glb === 'A01.1' && m.label !== "Edda's house"); const w = p.masses.find((m) => m.piece === 'module' && Math.abs(m.at.x - p.hub.ring.centre.x) < 5); c.at = { x: w.at.x, z: w.at.z + (w.at.z > p.hub.ring.centre.z ? -3.2 : 3.2) }; }).includes('interior'));
	// a wall type that does not match its pieces
	assert.ok(mutate((p) => { p.hub.wall.type = p.hub.wall.type === 'stone' ? 'palisade' : 'stone'; }).includes('ring'));
	// front wall not flagged
	assert.ok(mutate((p) => { for (const m of p.masses) if (m.fade) delete m.fade; }).includes('front-wall'));
	assert.ok(mutate((p) => { p.exits[0].edge = p.exits[0].edge === 'S' ? 'N' : 'S'; }).includes('thresholds'));
	// fix r1 m1: a route cut 10 m short of the lychgate
	assert.ok(mutate((p) => { const r = p.paths.find((q) => q.id === 'route'); let acc = 0, n = r.points.length; while (n > 2 && acc < 10) { acc += dist(r.points[n - 1], r.points[n - 2]); n--; } r.points = r.points.slice(0, n); const inside = length(r.points) - p.hub.causeway.length; p.meta.route.length = Math.round(inside * 100) / 100; p.meta.route.walkS = Math.round((inside / 1.6) * 100) / 100; p.meta.route.runS = Math.round((inside / 4) * 100) / 100; }).includes('route'));
	// fix r1 m2: an NPC circle on the route corridor
	assert.ok(mutate((p) => { const i = p.interactions.find((q) => q.id === 'osric'), r = p.paths.find((q) => q.id === 'route'); i.at = { x: r.points[Math.floor(r.points.length * 0.6)].x, z: r.points[Math.floor(r.points.length * 0.6)].z }; }).includes('route'));
	// fix r1 M1: dry land all round the wall (the old bank) opens the way round the ring
	assert.ok(mutate((p) => { const g = base.ground; p.ground = (x, z) => ({ ...g(x, z), water: false }); }).includes('bypass'));
	// fix r1 n6: a joint post removed
	const withJoints = SEEDS.map(mapOf).find((m) => wallsOf(m.plan).some((w) => w.piece === 'joint'));
	if (withJoints) { const b2 = withJoints.plan, p = { ...JSON.parse(JSON.stringify({ ...b2, ground: undefined })), ground: b2.ground }; p.masses.splice(p.masses.findIndex((m) => m.piece === 'joint'), 1); assert.ok(checkHubPlan(p).some((c) => !c.pass && c.id === 'ring')); }
});

test('bypass (fix r1 M1): the lychgate is the only way to the hill lane — with it solid, no dry cell outside the ring beyond the gate apron is reached from the causeway; without it the lane is reached', () => {
	for (const seed of SEEDS) {
		const { plan } = mapOf(seed), edges = ringEdges(plan), mg = plan.doors.find((d) => d.id === 'main-gate'), hill = plan.paths.find((p) => p.id === 'hill-trail'), exit = plan.exits.find((e) => e.id === 'lychgate'), gate = of(plan, 'A02.1')[0];
		const F = flood(plan);
		let far = 0, apron = 0;
		F.each((x, z) => { if (depthIn(edges, { x, z }) > -0.3 || plan.ground(x, z).water) return; if (dist({ x, z }, mg.at) <= R.apronReach) apron++; else far++; });
		assert.equal(far, 0, `seed ${seed}: ${far} dry cells outside the ring are reached beyond the gate apron`);
		assert.ok(apron > 0 && apron < 120, `seed ${seed}: the gate apron is ${apron} cells`);
		assert.ok(!F.reached(exit.at) && !F.reached(hill.points[0]), `seed ${seed}: the hill lane / the Churchyard exit is reached without passing the lychgate`);
		assert.ok(flood(plan, { without: gate.id }).reached(exit.at), `seed ${seed}: without the lychgate the hill lane is not reached (the lychgate is its door)`);
		// the ground outside the wall: water everywhere but the apron, the hill lane and the footing (≤ 0.25 m beyond the wall face)
		const wfp = wallsOf(plan).map(fpOf);
		let dry = 0;
		for (let x = -31.75; x < 32; x += 0.5) for (let z = -31.75; z < 32; z += 0.5) if (depthIn(edges, { x, z }) < 0 && !plan.ground(x, z).water && dist({ x, z }, mg.at) > R.apronReach && polyDistToLine(x, z, [gate.at, ...hill.points]) > R.hillLane + 0.5 && !wfp.some((fp) => pointPolySigned(fp.pts, x, z) <= 0.6)) dry++; // the footing is 0.25 m beyond a wall piece (≤ 0.55 m at a mitred 45° joint): never wide enough (0.7 m) for the agent
		assert.equal(dry, 0, `seed ${seed}: ${dry} dry samples outside the wall (not the apron, not the hill lane)`);
	}
});

test('family fallback (fix r2 B2): after familyAttempts failed attempts the seed-only second stream takes the OPPOSITE gate pair; same seed, same map; no seed is rejected', () => {
	// seed 19 has an adjacent palisade hub (S → W, 9 attempts in its own family); with a budget of 2 attempts per family it falls back
	const own = mapOf(19), pairOf = (p) => `${p.hub.inEdge}${p.hub.gateEdge}`;
	assert.ok(['SW', 'EN'].includes(pairOf(own.plan)) && own.plan.hub.familyRound === 0 && own.attempts.length > 2, `seed 19 is not an adjacent hub that needs > 2 attempts (${pairOf(own.plan)}, ${own.attempts.length})`);
	const a = generateHubMap(19, catalog, { familyAttempts: 2 }), b = generateHubMap(19, catalog, { familyAttempts: 2 });
	assert.ok(a.ok, 'the fallback family is accepted');
	assert.ok(a.plan.hub.familyRound >= 1 && ['SN', 'EW'].includes(pairOf(a.plan)), `fallback pair ${pairOf(a.plan)} round ${a.plan.hub.familyRound}`);
	assert.equal(a.plan.hub.wall.type, own.plan.hub.wall.type, 'the wall type belongs to the seed');
	assert.equal(a.attempt, b.attempt);
	assert.equal(JSON.stringify(stripGround(a.plan)), JSON.stringify(stripGround(b.plan)));
	assert.equal(JSON.stringify(stripGround(generateHubPlan(19, { attempt: a.attempt, familyAttempts: 2 }))), JSON.stringify(stripGround(a.plan)), 'the attempt number alone reproduces the plan');
	// attempts below familyAttempts never change the family
	for (const k of [0, 1, 2, 3]) { const p = generateHubPlan(19, { attempt: k }); if (!p.failed) assert.equal(pairOf(p), pairOf(own.plan)); }
});

test('generateHubMap survives bad options and a plan-less run (maxAttempts NaN / 0 / negative → the default; layout failure never throws)', () => {
	for (const bad of [Number.NaN, 0, -3, 'x', undefined]) { const m = generateHubMap(4, catalog, { maxAttempts: bad }); assert.ok(m.attempts.length >= 1 && m.attempts.length <= R.maxAttempts); assert.ok(m.plan); }
	const m = generateHubMap(4, catalog, { maxAttempts: 1 });
	assert.equal(m.attempts.length, 1);
});

test('the open-island layout of v1 stays available as an option (layout: "island")', () => {
	for (const seed of [2, 7]) {
		const m = generateHubMap(seed, catalog, { layout: 'island' });
		assert.ok(m.ok, `island seed ${seed}: ${m.attempts.at(-1).failed.join()}`);
		assert.equal(m.plan.hub.layout, undefined);
		assert.equal(wallsOf(m.plan).length, 0);
		assert.ok(m.plan.meta.route.length >= 50 && m.plan.meta.route.length <= 80);
	}
});

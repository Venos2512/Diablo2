// ASHLAR · Act I base maps — the outdoor engine (src/env/act1/outdoor.js) and every outdoor map file in src/env/act1/maps/ (PLAN.engine === 'outdoor').
// node --test scripts/act1-outdoor.test.mjs   (or: npm run test:act1, which also runs the interior engine's tests)
// Engine: area distances, run modules, chaikin, walkway ramps, the mask raster layout, the walk grid on a small synthetic plan.
// Maps: the §6b contract (ASSETS / MONSTERS / NPCS / TEXTURES / VFX), validate() clean (no NaN, bounds, ≤ 8 layers, every asset placed or declared missing
// with a reason, markers inside the bounds, ≤ 8 real lights), models that exist (samples.json / kit keys), finite masks in [0, 1], determinism, spawns on
// walkable ground and each segment's route walkable from its spawn on a Play-like 1 m grid (0.6 m step, 0.3 m radius: no invisible walls on the path),
// never swim (on a full-map grid from every spawn no walkable cell stands in more than 0.7 m of water; dikes keep their crest to the bounds), encounters
// only in wild segments, water where the plan says water; for `lychgate`: the lychgate is the only way from the hub side into the churchyard (full-map
// grids from every hub-side spawn). A map file that fails to import is a failing test of its own; the other maps still run.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
	evaluatePlan, smoothParams, areaSigned, chaikin, runModules, maskRaster, withCounts, assetCounts, polySigned, segment, footprint, CATEGORIES, STATUSES, PLAY, WADE,
} from '../src/env/act1/outdoor.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'src/env/act1/maps');
const samples = JSON.parse(readFileSync(path.join(root, 'src/assets/samples.json'), 'utf8'));
const sampleIds = new Set((samples.assets ?? samples).map((s) => s.id));
const KIT_KEYS = new Set(['fence', 'kitchen', 'storage', 'training', 'crafts', 'lighting', 'banners', 'seating', 'shrine', 'animals', 'clutter', 'stations', 'rocks', 'mossy', 'deadTrees', 'shrubs']);
const kitSizes = JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8'));

// ---- the engine on a small synthetic plan ------------------------------------------------------------------------------------------------------------
const tinyPlan = () => ({
	id: 'tiny', engine: 'outdoor', label: 'tiny', biome: 'test', seed: 3, bounds: [-30, -20, 30, 20], cell: 0.5, splat: { res: 128 },
	heights: [{ kind: 'base', y: 0.5 }, { kind: 'hill', x: 15, z: -8, r: 10, h: 4 }],
	water: [{ id: 'pond', level: 0.2, area: { poly: [[-26, 8], [-14, 8], [-14, 17], [-26, 17]] }, shelf: [1, 0.25], drop: [1, 1.2] }],
	paths: [{ id: 'jetty', kind: 'walkway', asset: 'W', points: [[-20, 5], [-20, 13]], width: 1.4, deck: 0.75, ramps: 'start' }],
	layers: [{ id: 'BIO01_peat', tile: 4 }, { id: 'DW_grass', tile: 3 }, { id: 'DW_dirt', tile: 3 }],
	paint: [{ layer: 'DW_grass', kind: 'height', range: [1, 9], soft: 0.5 }, { layer: 'DW_dirt', kind: 'path', paths: ['jetty'], extra: 0.5 }, { layer: 'wet', kind: 'water', band: [-3, 2] }],
	assets: [
		{ id: 'WALL', name: 'wall', category: 'structure', size: [4, 1.5, 0.6], status: 'blockout', source: 'test', segment: 'a', shape: 'wall' },
		{ id: 'W', name: 'walkway', category: 'structure', size: [4, 1, 1.4], status: 'blockout', source: 'test', segment: 'a', shape: 'deck' },
		{ id: 'MISSING', name: 'missing', category: 'prop', size: [1, 1, 1], status: 'blockout', source: 'test', segment: 'a', placed: false, reason: 'later slice' },
	],
	structures: [],
	runs: [{ asset: 'WALL', points: [[0, -19], [0, -2]] }, { asset: 'WALL', points: [[0, 2], [0, 19]] }], // a wall across the map with a 4 m gap at z = 0
	segments: [{ id: 'a', label: 'a', spawn: [-10, 0], route: [[-10, 0], [10, 0]] }, { id: 'b', label: 'b', spawn: [10, -1], route: [[10, -1], [-10, 1]] }],
	views: { overview: { label: 'o', target: [0, 0], fit: [60, 40] } },
	moods: { day: { label: 'day' } },
});

test('engine: area distances (circle, rect, obb, poly) are signed metres', () => {
	assert.equal(areaSigned({ circle: [0, 0, 2] }, 3, 0), 1);
	assert.ok(Math.abs(areaSigned({ rect: [0, 0, 4, 2] }, 2, 1) + 1) < 1e-9);
	assert.ok(Math.abs(areaSigned({ obb: [0, 0, 4, 2, 90] }, 0, 1.5) - -0.5) < 1e-9, 'a 4 × 2 box turned 90° is 2 wide on x and 4 deep on z');
	assert.ok(polySigned([[0, 0], [2, 0], [2, 2], [0, 2]], 1, 1) < 0);
	assert.ok(polySigned([[0, 0], [2, 0], [2, 2], [0, 2]], 3, 1) > 0);
	const fp = footprint(0, 0, 4, 2, Math.PI / 2);
	assert.ok(fp.every(([x, z]) => Math.abs(Math.abs(x) - 1) < 1e-9 && Math.abs(Math.abs(z) - 2) < 1e-9), 'yaw 90°: local x runs along −z');
});

test('engine: chaikin keeps the ends; runs fill each segment with whole modules and skip gaps', () => {
	const c = chaikin([[0, 0], [10, 0], [10, 10]], 2);
	assert.deepEqual(c[0], [0, 0]);
	assert.deepEqual(c[c.length - 1], [10, 10]);
	const mods = runModules({ points: [[0, 0], [10, 0]], gaps: [[5, 0, 1]] }, 3.4);
	assert.equal(mods.length, 2, '3 modules of 3.33 m, the middle one in the gap');
	assert.ok(mods.every((m) => m.sx > 0.9 && m.sx < 1.1));
});

test('engine: walkway decks get a ramp only at the ends that meet lower ground', () => {
	const W = evaluatePlan(tinyPlan());
	const ramps = W.decks.filter((d) => d.kind === 'ramp');
	assert.equal(ramps.length, 1, "ramps: 'start' → one ramp, the jetty's far end stands over the water");
	assert.ok(ramps[0].ya > ramps[0].yb, 'the ramp falls away from the deck');
	assert.ok(Math.abs(W.deckAt(-20, 10) - 0.75) < 1e-6, 'deck top over the water');
	assert.ok(W.waterDepth(-20, 12) > 0.3, 'water under the jetty');
	assert.ok(W.surfaceY(-20, 12, 0.75) >= 0.75 - 1e-6, 'the walk surface over the water is the deck');
});

/** Deepest water above a walkable cell's walk surface on a walk grid (0 when dry; a deck stands above its water). */
function deepestWade(W, g) {
	let max = 0;
	let where = null;
	for (let j = 0; j < g.n; j++) {
		for (let i = 0; i < g.n; i++) {
			const k = i + j * g.n;
			if (!g.walk[k]) continue;
			const x = g.ox + (i + 0.5) * g.cell;
			const z = g.oz + (j + 0.5) * g.cell;
			const w = W.waterAt(x, z);
			const d = w ? w.level - g.ground[k] : 0;
			if (d > max) {
				max = d;
				where = [+x.toFixed(1), +z.toFixed(1)];
			}
		}
	}
	return { max, where };
}

test('engine: deep water is a wall — the hero wades the shelf, never past the 0.6 m contour; a jetty over the water stays walkable', () => {
	const W = evaluatePlan(tinyPlan());
	assert.ok(W.deepWalls.some((w) => w.body === 'pond'), 'the pond deeper than 0.6 m has its contour wall');
	assert.ok(!W.deepWalls.some((w) => String(w.body).startsWith('deck:')), 'no guard walls by the decks: the walk floor has a hole under them');
	assert.equal(W.floorAt(-20, 12), null, "no floor under the jetty: Play's flood meets only its planks there");
	assert.ok(Math.abs(W.walkY(-20, 12) - 0.75) < 0.05, 'the jetty deck is the walk surface');
	const g = W.walkGrid(W.spawns[0], { full: true });
	const { max, where } = deepestWade(W, g);
	assert.ok(max <= WADE.depth + 0.1, `walkable cell in ${max.toFixed(2)} m of water at ${where}`);
	assert.ok(g.reached(-20, 12, 0.6), 'the jetty end over the pond');
	const k = Math.floor(-20 - g.ox) + Math.floor(12 - g.oz) * g.n;
	assert.ok(Math.abs(g.ground[k] - 0.75) < 0.05, 'reached on the deck, not on the bed under it');
});

test("engine: Play's walk floor (the terrain cut to W.floorField) — never in water deeper than 0.6 m, never under a deck, the hero's radius kept round blockers", () => {
	const W = evaluatePlan(tinyPlan());
	const H = W.heights;
	let floor = 0;
	let holes = 0;
	for (let z = H.z0 + 0.13; z < H.z0 + (H.nz - 1) * H.cell; z += 0.37) {
		for (let x = H.x0 + 0.11; x < H.x0 + (H.nx - 1) * H.cell; x += 0.37) {
			const y = W.floorAt(x, z);
			if (y === null) {
				holes++;
				continue;
			}
			floor++;
			const w = W.waterAt(x, z);
			assert.ok(!w || w.level - y <= WADE.depth + 0.02, `floor in ${w && (w.level - y).toFixed(2)} m of water at ${x.toFixed(2)}, ${z.toFixed(2)}`);
			for (const s of W.decks) assert.ok(segment(s.ax, s.az, s.bx, s.bz, x, z).d >= s.w / 2 - 0.05, `floor under the ${s.path} deck at ${x.toFixed(2)}, ${z.toFixed(2)}`);
			for (const b of W.blockers) assert.ok(polySigned(b.pts, x, z) >= PLAY.radius - 0.05, `floor within the hero's radius of ${b.asset} at ${x.toFixed(2)}, ${z.toFixed(2)}`);
		}
	}
	assert.ok(floor > 1000 && holes > 100, `${floor} floor / ${holes} hole samples`);
});

test('engine: a map whose edge sinks into the far water (no water polygon there) is walled at 0.6 m below the far level', () => {
	const plan = { ...tinyPlan(), edge: { width: 8, y: -2 }, far: { level: 0, size: 600 } };
	const W = evaluatePlan(plan);
	assert.ok(W.deepWalls.some((w) => w.body === 'far'), 'the sunken edge gets far-water walls');
	const g = W.walkGrid(W.spawns[0], { full: true });
	let low = Infinity;
	for (let k = 0; k < g.walk.length; k++) if (g.walk[k]) low = Math.min(low, g.ground[k]);
	assert.ok(low >= -(WADE.depth + 0.1), `the hero walks down to ${low.toFixed(2)} m below the far water level`);
});

test('engine: the mask raster is LayerSplat.fill\'s layout (layers 1..7 in raw0 RGBA / raw1 RGB, wetness in raw1 A)', () => {
	const masks = (x, z, out) => {
		out.fill(0);
		out[0] = 1; // layer 1
		out[4] = 0.5; // layer 5
		out[7] = 0.25; // wetness
	};
	const [r0, r1] = maskRaster(masks, { originX: 0, originZ: 0, extent: 10, size: 16, step: 2 });
	assert.equal(r0[0], 255);
	assert.equal(r1[0], 128);
	assert.equal(r1[3], 64);
	assert.equal(r0[1], 0);
});

test('engine: a wall with one gap — the walk grid passes only through the gap', () => {
	const W = evaluatePlan(tinyPlan());
	assert.deepEqual(W.validate(), []);
	const g = W.walkGrid(W.spawns[0], { size: 64 });
	assert.ok(g.startOk);
	assert.ok(g.reached(10, 0), 'through the 4 m gap');
	W.blockers.push({ uid: -1, asset: 'plug', pts: footprint(0, 0, 0.8, 4.4, 0), y0: 0, y1: 2, x: 0, z: 0, r: 2.3 });
	const g2 = W.walkGrid(W.spawns[0], { size: 64 });
	assert.ok(!g2.reached(10, 0, 0.5), 'plugging the gap cuts the map in two');
	assert.equal(withCounts(tinyPlan()).find((a) => a.id === 'WALL').count, runModules({ points: [[0, -19], [0, -2]] }, 4).length + runModules({ points: [[0, 2], [0, 19]] }, 4).length);
});

// ---- every outdoor map file ------------------------------------------------------------------------------------------------------------------------
const files = readdirSync(mapsDir).filter((f) => f.endsWith('.js'));
const mods = [];
for (const f of files) {
	let mod;
	try {
		mod = await import(pathToFileURL(path.join(mapsDir, f)).href);
	} catch (error) {
		test(`maps/${f} imports`, () => assert.fail(`maps/${f} failed to import: ${error.message}`)); // one broken map fails on its own; the others still run
		continue;
	}
	if (mod.PLAN?.engine === 'outdoor') mods.push({ file: f, mod });
}

test('there is at least one outdoor map file', () => assert.ok(mods.length >= 1, files.join(', ')));

for (const { file, mod } of mods) {
	const plan = mod.PLAN;
	const name = `${plan.id} (${file})`;
	let W;
	test(`${name}: evaluates; validate() is clean`, () => {
		const t = performance.now();
		W = evaluatePlan(plan);
		assert.ok(performance.now() - t < 8000, 'evaluation stays interactive');
		assert.deepEqual(W.validate(), []);
		const [x0, z0, x1, z1] = plan.bounds;
		assert.ok(Math.max(x1 - x0, z1 - z0) <= 256 && plan.cell <= 1);
		assert.ok(plan.layers.length >= 2 && plan.layers.length <= 8);
		assert.ok(plan.target?.length > 0 && plan.target.note, 'the plan records the full-length recommendation');
	});

	test(`${name}: §6b contract — ASSETS, MONSTERS, NPCS, TEXTURES, VFX`, () => {
		assert.ok(Array.isArray(mod.ASSETS) && mod.ASSETS.length > 0);
		const ids = new Set();
		for (const a of mod.ASSETS) {
			assert.ok(!ids.has(a.id), `duplicate id ${a.id}`);
			ids.add(a.id);
			for (const k of ['id', 'name', 'category', 'size', 'count', 'status', 'source', 'segment', 'note']) assert.ok(a[k] !== undefined, `${a.id}: ${k}`);
			assert.ok(CATEGORIES.includes(a.category), `${a.id}: category ${a.category}`);
			assert.ok(STATUSES.includes(a.status), `${a.id}: status ${a.status}`);
			assert.ok(a.size.length === 3 && a.size.every((v) => v > 0), `${a.id}: size`);
			assert.ok(Number.isInteger(a.count) && a.count >= 0, `${a.id}: count`);
			if (a.status === 'glb') assert.ok(sampleIds.has(a.model), `${a.id}: GLB sample ${a.model} not in samples.json`);
			if (a.status === 'kit') {
				const [kitKey, piece] = a.model.slice(4).split('.');
				assert.ok(KIT_KEYS.has(kitKey), `${a.id}: kit ${kitKey}`);
				assert.ok(kitSizes[`${kitKey}.${piece}`], `${a.id}: kit piece ${kitKey}.${piece} not measured (kitSizes.json)`);
			}
			if (a.status === 'blockout') assert.ok(a.shape, `${a.id}: a blockout needs a shape`);
			if (a.status === 'procedural') assert.ok(a.procedural, `${a.id}: a procedural asset names its builder`);
		}
		const counts = assetCounts(plan);
		for (const a of mod.ASSETS) if (a.placed !== false) assert.ok((counts.get(a.id) ?? 0) > 0 || a.count > 0, `${a.id} is never placed`);
		for (const m of mod.MONSTERS) for (const k of ['id', 'name', 'segment', 'count']) assert.ok(m[k] !== undefined, `monster ${m.id}: ${k}`);
		for (const n of mod.NPCS) assert.ok(n.name && n.segment, 'NPC name + segment');
		for (const t of mod.TEXTURES) assert.ok(t.id && typeof t.have === 'boolean', `texture ${t.id}`);
		assert.ok(mod.TEXTURES.some((t) => !t.have), 'the textures the map still lacks are listed');
		for (const v of mod.VFX) assert.ok(v.id && typeof v.have === 'boolean', `vfx ${v.id}`);
		// every encounter's monster ids are listed in MONSTERS with the same total
		const enc = {};
		for (const m of plan.markers.filter((q) => q.kind === 'encounter')) for (const g of m.monsters) enc[g.id] = (enc[g.id] ?? 0) + g.count;
		for (const [id, n] of Object.entries(enc)) assert.equal(mod.MONSTERS.find((m) => m.id === id)?.count, n, `MONSTERS ${id} count`);
	});

	test(`${name}: masks finite in [0, 1]; heights finite; the build is deterministic`, () => {
		W ??= evaluatePlan(plan);
		const masks = W.makeMasks(smoothParams(0.8));
		const out = new Float32Array(8);
		const [x0, z0, x1, z1] = plan.bounds;
		for (let z = z0; z <= z1; z += 3.7) for (let x = x0; x <= x1; x += 3.7) {
			masks(x, z, out);
			for (const v of out) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, `mask ${v} at ${x}, ${z}`);
		}
		for (const v of W.heights.data) assert.ok(Number.isFinite(v));
		const W2 = evaluatePlan(plan);
		assert.equal(W2.structures.length, W.structures.length);
		for (let i = 0; i < W.structures.length; i += 7) {
			const a = W.structures[i];
			const b = W2.structures[i];
			assert.ok(a.asset === b.asset && a.x === b.x && a.z === b.z && a.y === b.y && a.yaw === b.yaw, `item ${i} differs between two evaluations`);
		}
		let h1 = 0;
		let h2 = 0;
		for (let k = 0; k < W.heights.data.length; k += 13) {
			h1 += W.heights.data[k];
			h2 += W2.heights.data[k];
		}
		assert.equal(h1, h2);
	});

	test(`${name}: spawns stand on walkable ground and every segment's route is walkable from its spawn (Play grid, no invisible walls)`, () => {
		W ??= evaluatePlan(plan);
		for (const seg of W.segments) {
			const sp = W.spawns.find((s) => s.id === seg.id);
			const g = W.walkGrid(sp);
			assert.ok(g.startOk, `${seg.id}: spawn blocked`);
			assert.ok(g.cells > 400, `${seg.id}: only ${g.cells} walkable cells round the spawn`);
			const route = seg.route ?? [];
			for (let i = 1; i < route.length; i++) {
				const [ax, az] = route[i - 1];
				const [bx, bz] = route[i];
				const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.0);
				for (let k = 0; k <= n; k++) {
					const x = ax + ((bx - ax) * k) / n;
					const z = az + ((bz - az) * k) / n;
					if (Math.abs(x - sp.x) > PLAY.grid / 2 - 2 || Math.abs(z - sp.z) > PLAY.grid / 2 - 2) continue;
					assert.ok(g.reached(x, z, 1), `${seg.id}: route point ${x.toFixed(1)}, ${z.toFixed(1)} is not walkable from the spawn`);
				}
			}
			assert.ok(W.waterDepth(sp.x, sp.z) < 0.35, `${seg.id}: spawn in deep water`);
		}
	});

	test(`${name}: never swim — on a full-map grid from every spawn no walkable cell stands in more than 0.7 m of water; dikes keep their crest to the bounds`, () => {
		W ??= evaluatePlan(plan);
		for (const sp of W.spawns) {
			const g = W.walkGrid(sp, { full: true });
			const { max, where } = deepestWade(W, g);
			assert.ok(max <= 0.7, `${sp.id}: walkable cell in ${max.toFixed(2)} m of water at ${where}`);
		}
		const [x0, z0, x1, z1] = plan.bounds;
		for (const p of W.paths.filter((q) => q.kind === 'dike')) {
			for (const [x, z] of [p.pts[0], p.pts[p.pts.length - 1]]) {
				if (Math.min(x - x0, x1 - x, z - z0, z1 - z) > 1) continue; // only an end that leaves the map
				const ix = Math.min(Math.max(x, x0 + 0.3), x1 - 0.3);
				const iz = Math.min(Math.max(z, z0 + 0.3), z1 - 0.3);
				assert.ok(W.height(ix, iz) >= p.dike.crest - 0.15, `dike ${p.id} sinks at the map edge (${W.height(ix, iz).toFixed(2)} at ${ix}, ${iz})`);
			}
		}
	});

	test(`${name}: encounters only in wild segments; markers inside the bounds; water where the plan says water`, () => {
		W ??= evaluatePlan(plan);
		const wild = new Set(W.segments.filter((s) => s.kind === 'wild').map((s) => s.id));
		for (const m of W.markers.filter((q) => q.kind === 'encounter')) assert.ok(!m.segment || wild.has(m.segment) || !W.segments.some((s) => s.id === m.segment), `encounter ${m.id} in a hub segment`);
		for (const b of W.water) {
			let deep = 0;
			const [x0, z0, x1, z1] = b.box;
			for (let z = z0; z <= z1; z += 0.7) for (let x = x0; x <= x1; x += 0.7) if (areaSigned(b.area, x, z) < -0.6 && W.waterDepth(x, z) > 0.05) deep++;
			assert.ok(deep > 0, `water body ${b.id} holds no water`);
		}
		for (const p of W.paths.filter((q) => q.kind === 'dike')) {
			const mid = p.pts[Math.floor(p.pts.length / 2)];
			assert.ok(W.height(mid[0], mid[1]) >= p.dike.crest - 0.15, `dike ${p.id}: crest`);
		}
	});

	if (plan.id === 'lychgate') {
		test('lychgate: the lychgate is the only way from the hub side into the churchyard (full-map grids from every hub-side spawn; block the gate and the churchyard is cut off)', () => {
			W ??= evaluatePlan(plan);
			const gate = W.structures.find((s) => s.asset === 'A02.1');
			const yard = W.spawns.find((s) => s.id === 'churchyard');
			const wild = [[yard.x, yard.z, 'the churchyard'], [36, -44, 'the summit'], [16, -40, 'behind the church'], [-55, -18, 'the west yews (E4)'], [-47, -8.5, 'Rite 3'], [0, -60, 'the north slope'], [30, -55, 'Rite 5']];
			const hubSide = ['hub', 'mere', 'gate', 'terrace', 'fenroad'].map((id) => W.spawns.find((s) => s.id === id));
			for (const sp of hubSide) assert.ok(W.walkGrid(sp, { full: true }).reached(yard.x, yard.z), `${sp.id}: the churchyard is reachable through the open lychgate`);
			W.blockers.push({ uid: -1, asset: 'plug', pts: footprint(gate.x, gate.z, gate.size[0] + 0.4, gate.size[2] + 3, gate.yaw), y0: gate.y - 1, y1: gate.y + 3, x: gate.x, z: gate.z, r: 4 });
			try {
				for (const sp of hubSide) {
					const shut = W.walkGrid(sp, { full: true });
					assert.ok(shut.cells > 2000, `${sp.id}: the hub side stays walkable`);
					for (const [x, z, what] of wild) assert.ok(!shut.reached(x, z, 0.5), `${sp.id}: ${what} (${x}, ${z}) is reachable with the lychgate blocked — a hole in the boundary`);
				}
			} finally {
				W.blockers.pop();
			}
		});
		test('lychgate: brief checks — 5 rite sites, ≥ 1 unmarked vignette, the far Gentle House on a sightline from a high spot, the lychgate lamp as a real human light', () => {
			W ??= evaluatePlan(plan);
			assert.equal(W.markers.filter((m) => m.kind === 'rite').length, 5);
			assert.ok(W.markers.some((m) => m.kind === 'vignette' && m.unmarked));
			const s = W.markers.find((m) => m.kind === 'sightline' && m.target === 'far:N-GH');
			assert.ok(s && s.fromP[1] > 10, 'the act destination is seen from the summit');
			assert.ok(W.lights.find((l) => l.id === 'lychgateLamp' && l.real && l.kind === 'human'));
			assert.ok(W.lights.find((l) => l.kind === 'perfection' && l.flicker === 0), 'Perfection light is still');
			assert.equal(W.structures.filter((x) => x.asset === 'A16.1').every((y) => Math.hypot(y.x - 0, y.z + 30) > 40 || y.z < -60 || y.x < -50 || y.x > 55), true, 'yews only at the edges');
		});
	}
}

// ---- the model swap (2026-10-22): real files behind every glb / kit def, real sizes, no per-axis fit, the key passages still open --------------------
const sampleById = new Map((samples.assets ?? samples).map((s) => [s.id, s]));
const KIT_FILES = { fence: 'kit-wooden-fence', kitchen: 'kit-camp-kitchen', storage: 'kit-camp-storage', training: 'kit-camp-training', crafts: 'kit-camp-crafts', lighting: 'kit-camp-lighting', banners: 'kit-camp-banners', seating: 'kit-camp-seating', shrine: 'kit-camp-shrine', animals: 'kit-camp-animals', clutter: 'kit-camp-clutter', stations: 'kit-camp-stations', rocks: 'kit-moor-rocks', mossy: 'kit-mossy-rocks', deadTrees: 'kit-dead-trees', shrubs: 'kit-shrubs' };
const sampleFile = (id) => path.join(root, 'assets', sampleById.get(id)?.file ?? `missing/${id}`);
/** Bounding size [w, h, d] of a one-mesh GLB from its POSITION accessor min / max (the act1 extras: identity node, the transform baked). */
const glbSize = (file) => {
	const buf = readFileSync(file);
	const json = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
	const acc = json.accessors[json.meshes[0].primitives[0].attributes.POSITION];
	return [0, 1, 2].map((k) => acc.max[k] - acc.min[k]);
};
/** Points that must stay walkable from a segment's spawn (Play grid) after the swap. */
const PASSAGES = {
	lychgate: [
		['hub', 'the forge front (GLB turned to the square)', [[-10.3, 35.9]]],
		['hub', 'the name board and the stall fronts', [[-27.5, 40.4], [-43.6, 41.6]]],
		['churchyard', 'down the path to the church door (the GLB west front)', [[-17, -8], [-2, -22], [6.2, -30]]],
		['churchyard', 'the grave walk past the hand cart to the gibbet grave', [[-28, -16], [-38, -24], [-46, -36], [-46, -44]]],
		['gate', 'through the lychgate', [[-24, 6], [-24, 0], [-24, -2]]],
	],
	fens: [['dock', 'along the night dock deck (hidden walkway under the GLB planks) to its far end', [[-103.6, -55.2], [-104.7, -57.4], [-105.5, -59.5]]]],
	poppyReach: [['top', 'up the A18.6 steps onto the hospice terrace', [[0, -99], [0, -102.5], [0, -105], [0, -107.5]]]],
};

for (const { file, mod } of mods) {
	const plan = mod.PLAN;
	const name = `${plan.id} (${file})`;
	test(`${name}: every glb / kit def (and composite part) has its model file; glb defs keep the model's own size (fit native, size = the GLB bounds)`, () => {
		for (const a of plan.assets) {
			if (a.status === 'glb') {
				for (const id of [a.model, ...(a.composite?.parts ?? []).map((p) => p.model)]) {
					assert.ok(sampleById.has(id), `${a.id}: ${id} not in samples.json`);
					assert.ok(existsSync(sampleFile(id)), `${a.id}: ${sampleFile(id)} missing`);
				}
				assert.notEqual(a.fit, 'size', `${a.id}: a GLB never stretches per axis`);
				if (a.model.startsWith('act1-') && !a.composite) {
					const s = glbSize(sampleFile(a.model));
					assert.ok(a.size.every((v, k) => Math.abs(v - s[k]) < 0.03), `${a.id}: size ${a.size} ≠ GLB ${s.map((v) => v.toFixed(2))}`);
				}
			}
			if (a.status === 'kit') {
				const key = a.model.slice(4).split('.')[0];
				assert.ok(existsSync(sampleFile(KIT_FILES[key])), `${a.id}: kit file for ${key} missing`);
			}
		}
	});

	if (!PASSAGES[plan.id]) continue;
	test(`${name}: the key passages stay walkable after the model swap`, () => {
		const W = evaluatePlan(plan);
		for (const [segId, label, pts] of PASSAGES[plan.id]) {
			const sp = W.spawns.find((s) => s.id === segId);
			const g = W.walkGrid(sp);
			for (const [x, z] of pts) assert.ok(g.reached(x, z, 1), `${segId}: ${label} — ${x}, ${z} not walkable from the spawn`);
		}
		if (plan.id === 'fens') {
			const dock = plan.paths.find((p) => p.id === 'dock');
			assert.ok(dock.hidden, 'the GLB dock hides the walkway planks');
			const s = W.structures.find((q) => q.asset === 'A17.6');
			assert.ok(Math.abs(s.y + 0.94 - dock.deck) < 0.01, `the GLB deck top ${(s.y + 0.94).toFixed(2)} lines up with the walkway deck ${dock.deck}`);
			const t = W.structures.find((q) => q.asset === 'A17.2');
			assert.ok(t.y < 0 && t.y > -0.4, 'the tower\'s cut base sits just under the water surface');
		}
	});
}

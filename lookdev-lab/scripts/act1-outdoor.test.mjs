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
import { cutTriangles } from '../src/env/act1/interior.js';

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
					const part = a.cut && keptBounds(sampleFile(a.model), a.cut); // a part of a model (def.cut): the size of the part drawn
					const s = part ? part.hi.map((h, i) => h - part.lo[i]) : glbSize(sampleFile(a.model));
					assert.ok(a.size.every((v, k) => Math.abs(v - s[k]) < 0.03), `${a.id}: size ${a.size} ≠ GLB${part ? ' (its kept part)' : ''} ${s.map((v) => v.toFixed(2))}`);
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

// ---- review r2 (2026-10-22): the night dock's posts block the walk, the deck lane still reaches the dock end --------------------------------------
const fensMod = mods.find(({ mod }) => mod.PLAN.id === 'fens');
if (fensMod) {
	test('fens: the A17.6 dock posts (mooring posts, linen post under the lamp, tall lamp post) block the walk; the deck lane reaches RU7 / L3 and the far end', () => {
		const plan = fensMod.mod.PLAN;
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A17.6');
		const posts = W.blockers.filter((b) => b.asset === 'A17.6');
		assert.ok(def.collide !== false && def.blockers?.length >= 5, 'A17.6 collides on its posts only (a blockers list)');
		assert.equal(posts.length, def.blockers.length);
		const s = W.structures.find((q) => q.asset === 'A17.6');
		for (const b of posts) assert.ok(b.y0 <= s.y + 0.94 + PLAY.band[0] && b.y1 >= s.y + 0.94 + PLAY.band[1], 'a post blocker spans the hero band over the deck');
		const sp = W.spawns.find((q) => q.id === 'dock');
		const inPost = (g) => {
			let n = 0;
			for (let k = 0; k < g.walk.length; k++) {
				if (!g.walk[k]) continue;
				const x = g.ox + ((k % g.n) + 0.5) * g.cell;
				const z = g.oz + (((k / g.n) | 0) + 0.5) * g.cell;
				if (Math.hypot(x - s.x, z - s.z) < 6 && posts.some((b) => polySigned(b.pts, x, z) < PLAY.radius)) n++;
			}
			return n;
		};
		const g = W.walkGrid(sp);
		assert.equal(inPost(g), 0, 'no walkable cell within the hero radius of a dock post');
		const c = Math.cos(s.yaw);
		const sn = Math.sin(s.yaw);
		const deck = (lx, lz) => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
		for (const id of ['RU7', 'L3']) {
			const m = W.markers.find((q) => q.id === id);
			assert.ok(m && g.reached(m.x, m.z, 1), `${id} (the dock) is walkable from the dock spawn`);
		}
		for (let lx = -2.5; lx <= 2.51; lx += 0.5) assert.ok(g.reached(...deck(lx, 0), 1), `the deck centre line at local x ${lx} is walkable`);
		assert.ok(g.reached(...deck(2.6, 0), 0.5), 'the far end of the deck is walkable');
		// the posts stand in the walk lane: without their blockers the hero would walk through them
		const all = W.blockers;
		W.blockers = all.filter((b) => b.asset !== 'A17.6');
		const g0 = W.walkGrid(sp);
		W.blockers = all;
		assert.ok(inPost(g0) > 0, 'the posts stand inside the deck lane (the blockers do the work)');
	});
}

// ---- review r2: the terrain stays under the A18.6 treads, Play walks a hidden ramp through the step edges; the niche glows sit on their candles ------
/** POSITION (xyz per vertex) and the triangle vertex indices of a one-mesh GLB. */
const glbArrays = (file) => {
	const buf = readFileSync(file);
	const jl = buf.readUInt32LE(12);
	const json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
	const prim = json.meshes[0].primitives[0];
	const view = (i) => {
		const a = json.accessors[i];
		const v = json.bufferViews[a.bufferView];
		return { a, o: 20 + jl + 8 + (v.byteOffset ?? 0) + (a.byteOffset ?? 0), stride: v.byteStride ?? 12 };
	};
	const p = view(prim.attributes.POSITION);
	const P = new Float32Array(p.a.count * 3);
	for (let i = 0; i < p.a.count; i++) for (let k = 0; k < 3; k++) P[i * 3 + k] = buf.readFloatLE(p.o + i * p.stride + k * 4);
	const ix = view(prim.indices);
	return { P, index: Array.from({ length: ix.a.count }, (_, i) => (ix.a.componentType === 5125 ? buf.readUInt32LE(ix.o + i * 4) : buf.readUInt16LE(ix.o + i * 2))) };
};
/** Bounds { lo, hi } (GLB frame) of the triangles of a one-mesh GLB that survive `cut` boxes (an outdoor def's `cut`: interior.js cutTriangles). */
const keptBounds = (file, boxes) => {
	const { P, index } = glbArrays(file);
	const lo = [Infinity, Infinity, Infinity];
	const hi = [-Infinity, -Infinity, -Infinity];
	const kept = cutTriangles(P, index, boxes);
	for (const v of kept) for (let k = 0; k < 3; k++) {
		lo[k] = Math.min(lo[k], P[v * 3 + k]);
		hi[k] = Math.max(hi[k], P[v * 3 + k]);
	}
	return { lo, hi, triangles: kept.length / 3, of: index.length / 3 };
};
/** Every surface height (GLB frame, ascending) of a one-mesh GLB on a vertical line through (x, z): a ray cast on its triangles. */
const glbHitsAt = (file) => {
	const { P, index } = glbArrays(file);
	const I = index.map((i) => 3 * i);
	return (x, z) => {
		const hits = [];
		for (let t = 0; t < I.length; t += 3) {
			const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
			const d = (P[b + 2] - P[c + 2]) * (P[a] - P[c]) + (P[c] - P[b]) * (P[a + 2] - P[c + 2]);
			if (Math.abs(d) < 1e-12) continue;
			const l1 = ((P[b + 2] - P[c + 2]) * (x - P[c]) + (P[c] - P[b]) * (z - P[c + 2])) / d;
			const l2 = ((P[c + 2] - P[a + 2]) * (x - P[c]) + (P[a] - P[c]) * (z - P[c + 2])) / d;
			if (l1 < 0 || l2 < 0 || l1 + l2 > 1) continue;
			hits.push(l1 * P[a + 1] + l2 * P[b + 1] + (1 - l1 - l2) * P[c + 1]);
		}
		return hits.sort((u, v) => u - v);
	};
};
/** Top-most surface (GLB frame) of a one-mesh GLB under a vertical line through (x, z), or null. */
const glbTopAt = (file) => {
	const hitsAt = glbHitsAt(file);
	return (x, z) => {
		const h = hitsAt(x, z);
		return h.length ? h[h.length - 1] : null;
	};
};
/** Front-most surface z (GLB frame) of a one-mesh GLB on a horizontal ray along −z through (x, y): the face seen from +z, or null. */
const glbFrontAt = (file) => {
	const { P, index } = glbArrays(file);
	const I = index.map((i) => 3 * i);
	return (x, y) => {
		let best = null;
		for (let t = 0; t < I.length; t += 3) {
			const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
			const d = (P[b + 1] - P[c + 1]) * (P[a] - P[c]) + (P[c] - P[b]) * (P[a + 1] - P[c + 1]);
			if (Math.abs(d) < 1e-12) continue;
			const l1 = ((P[b + 1] - P[c + 1]) * (x - P[c]) + (P[c] - P[b]) * (y - P[c + 1])) / d;
			const l2 = ((P[c + 1] - P[a + 1]) * (x - P[c]) + (P[a] - P[c]) * (y - P[c + 1])) / d;
			if (l1 < 0 || l2 < 0 || l1 + l2 > 1) continue;
			const z = l1 * P[a + 2] + l2 * P[b + 2] + (1 - l1 - l2) * P[c + 2];
			if (best === null || z > best) best = z;
		}
		return best;
	};
};
const poppyMod = mods.find(({ mod }) => mod.PLAN.id === 'poppyReach');
if (poppyMod) {
	const plan = poppyMod.mod.PLAN;
	test('poppyReach: the terrain stays under every A18.6 tread and the landing; Play walks a hidden ramp through the step edges (never a riser off the stone)', () => {
		const W = evaluatePlan(plan);
		const s = W.structures.find((q) => q.asset === 'A18.6');
		const topAt = glbTopAt(sampleFile(plan.assets.find((a) => a.id === 'A18.6').model));
		for (const id of ['steps', 'stepsLanding']) {
			const p = plan.paths.find((q) => q.id === id);
			assert.ok(p?.kind === 'walkway' && p.hidden && p.caps === false, `${id}: a hidden, square-ended walkway carries the walk`);
		}
		const solid = W.blockers.filter((b) => b.asset === 'A18.6');
		// Play's nav finds a blocker by its walls: no hidden deck under a 1 m cell centre inside a cheek or a pillar (it would read walkable there)
		for (let x = -3.5; x <= 3.5; x++) {
			for (let z = -99.5; z >= -107.5; z--) {
				if (W.deckAt(x, z) !== null) assert.ok(solid.every((b) => polySigned(b.pts, x, z) > 0), `a deck under the cell ${x}, ${z} inside a blocker`);
			}
		}
		const c = Math.cos(s.yaw);
		const sn = Math.sin(s.yaw);
		let treads = 0;
		let free = 0;
		for (let lx = -1.3; lx <= 1.301; lx += 0.1) {
			for (let lz = -1.98; lz <= 2.0; lz += 0.05) {
				const h = topAt(lx, lz);
				if (h === null || h * s.scale[1] > 1.9) continue; // the treads and the landing (the pots, pillars and cheek tops stand higher)
				const [ox, oz] = [lx * s.scale[0], lz * s.scale[2]];
				const [x, z] = [s.x + ox * c + oz * sn, s.z - ox * sn + oz * c];
				const top = s.y + h * s.scale[1];
				const ground = W.height(x, z);
				assert.ok(ground < top - 0.05, `terrain +${(ground - s.y).toFixed(2)} not under the tread top +${(top - s.y).toFixed(2)} at ${x.toFixed(2)}, ${z.toFixed(2)}`);
				treads++;
				if (solid.some((b) => polySigned(b.pts, x, z) < PLAY.radius)) continue;
				const y = W.walkY(x, z, top + 0.3);
				assert.ok(y !== null && y > top - 0.15 && y < top + 0.32, `walk ${y === null ? 'none' : `+${(y - s.y).toFixed(2)}`} vs tread top +${(top - s.y).toFixed(2)} at ${x.toFixed(2)}, ${z.toFixed(2)}`);
				free++;
			}
		}
		assert.ok(treads > 1500 && free > 1000, `${treads} tread samples, ${free} free of the cheeks and pillars`);
	});
	test('poppyReach: every niche candle glow sits on its A18.5 candle (the section base + 1.5 m × its height scale, the stretched sections by the steps too)', () => {
		const W = evaluatePlan(plan);
		const walls = W.structures.filter((q) => q.asset === 'A18.5');
		assert.ok(walls.some((w) => w.scale[1] > 1.1), 'some sections stand stretched on the slope');
		const glows = W.lights.filter((l) => /^niche/.test(l.id));
		assert.ok(glows.length >= 14);
		for (const l of glows) {
			const w = walls.reduce((b, q) => (Math.hypot(q.x - l.x, q.z - l.z) < Math.hypot(b.x - l.x, b.z - l.z) ? q : b));
			assert.ok(Math.hypot(w.x - l.x, w.z - l.z) < 1, `${l.id} stands in front of its section`);
			assert.ok(Math.abs(l.yWorld - (w.y + 1.5 * w.scale[1])) < 0.01, `${l.id} at +${(l.yWorld - w.y).toFixed(2)} on its section, the candle is at +${(1.5 * w.scale[1]).toFixed(2)}`);
		}
	});
}

// ---- kit swap A01–A08 (2026-10-23): the GLB walk surfaces sit on their walkways; the lychgate GLB blocks on its plinths only ---------------------------
/** Area-free median / 5 % / 95 % of the GLB's top surface over a grid of (x, z) samples in its frame (a deck, a stone top). */
const topStats = (topAt, xs, zs) => {
	const h = [];
	for (const x of xs) for (const z of zs) {
		const y = topAt(x, z);
		if (y !== null) h.push(y);
	}
	h.sort((a, b) => a - b);
	return { n: h.length, med: h[h.length >> 1], lo: h[Math.floor(h.length * 0.05)], q25: h[Math.floor(h.length * 0.25)], hi: h[Math.floor(h.length * 0.95)] };
};
const range = (a, b, step) => Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => a + i * step);
for (const { mod } of mods) {
	const plan = mod.PLAN;
	const pieceDefs = plan.assets.filter((a) => a.deckTop !== undefined && a.status === 'glb');
	if (!pieceDefs.length) continue;
	test(`${plan.id}: kit swap — a model walkway (def.deckTop) is hidden; its GLB pieces run end to end along it and their measured deck top lies on the walk deck (±6 cm)`, () => {
		const W = evaluatePlan(plan);
		for (const d of pieceDefs) {
			const st = topStats(glbTopAt(sampleFile(d.model)), range(-1.2, 1.2, 0.2), range(-0.3, 0.4, 0.1));
			assert.ok(st.n > 50 && Math.abs(st.med - d.deckTop) < 0.03, `${d.id}: the GLB deck top (median ${st.med?.toFixed(3)}) is its deckTop ${d.deckTop}`);
			assert.ok(st.lo > d.deckTop - 0.1 && st.hi < d.deckTop + 0.1, `${d.id}: the deck is flat across its middle (${st.lo.toFixed(2)}–${st.hi.toFixed(2)})`);
			const walkways = plan.paths.filter((q) => q.kind === 'walkway' && q.asset === d.id);
			assert.ok(walkways.length > 0);
			for (const p of walkways) {
				assert.ok(p.hidden, `${p.id}: the GLB pieces are the visible deck: the walkway hides its own planks`);
				const pieces = W.structures.filter((s) => s.piece && s.path === p.id);
				const len = p.points.reduce((t, q, i) => (i ? t + Math.hypot(q[0] - p.points[i - 1][0], q[1] - p.points[i - 1][1]) : 0), 0);
				const sum = pieces.reduce((t, s) => t + s.size[0], 0);
				assert.ok(pieces.length >= 1 && sum > len * 0.97 && sum <= len + 0.01, `${p.id}: ${pieces.length} pieces cover ${sum.toFixed(2)} of ${len.toFixed(2)} m`);
				for (const s of pieces) {
					const deck = W.deckAt(s.x, s.z);
					assert.ok(deck !== null && Math.abs(s.y + d.deckTop * s.scale[1] - deck) < 0.06, `${p.id}: a piece's deck top ${(s.y + d.deckTop).toFixed(2)} vs the walk deck ${deck}`);
					assert.ok(Math.abs(s.scale[0] - 1) < 0.15 && s.scale[1] === 1 && s.scale[2] === 1, `${p.id}: a piece keeps its size (stretch ${s.scale[0].toFixed(2)} along the walkway only)`);
					assert.ok(Math.cos(s.yaw) >= -1e-6, `${p.id}: the open +z side faces the camera`);
				}
			}
		}
	});
}
const lychMod = mods.find(({ mod }) => mod.PLAN.id === 'lychgate');
if (lychMod) {
	const plan = lychMod.mod.PLAN;
	test('lychgate: kit swap — the A02.1 GLB (-open: no rail across its back) blocks on its four plinths and side rail only; the passage between the plinths is walkable, the gate leaves walk-through', () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A02.1');
		assert.ok(def.status === 'glb' && def.model === 'act1-a02-1-lychgate-open' && def.blockers.length === 5);
		const gate = W.structures.find((s) => s.asset === 'A02.1');
		const c = Math.cos(gate.yaw);
		const sn = Math.sin(gate.yaw);
		const at = (lx, lz) => [gate.x + lx * c + lz * sn, gate.z - lx * sn + lz * c];
		const blk = W.blockers.filter((b) => b.asset === 'A02.1');
		assert.equal(blk.length, 5);
		for (const [lx, lz, what] of [[-0.85, 1.1, 'the left leaf'], [0.95, 1.1, 'the right leaf'], [0, -1.05, 'the cut rail'], [0, 0, 'the passage']]) {
			assert.ok(blk.every((b) => polySigned(b.pts, ...at(lx, lz)) > 0), `${what} is not a blocker`);
		}
		// the GLB has no rail across its back any more (the -open variant): no surface between 0.3 and 1.75 m over the passage's centre strip
		for (const [file, open] of [[sampleFile(def.model), true], [sampleFile('act1-a02-1-lychgate'), false]]) {
			const hitsAt = glbHitsAt(file);
			let low = 0;
			for (let lx = -0.4; lx <= 0.61; lx += 0.1) for (let lz = -1.3; lz <= 1.31; lz += 0.05) low += hitsAt(lx, lz).filter((y) => y > 0.3 && y < 1.75).length; // between the leaves (x −0.5…+0.85)
			assert.ok(open ? low === 0 : low > 0, `${path.basename(file)}: ${low} surface hits at hero height in the passage`);
		}
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'gate'));
		for (let lz = -1.6; lz <= 1.61; lz += 0.4) assert.ok(g.reached(...at(0, lz), 0.6), `the passage at local z ${lz.toFixed(1)} is walkable`);
	});
	test('lychgate: kit swap — the A06.1 causeway lies flush on the dike crest (its plank-and-stone floor within 5 cm of the terrain, nothing along its centre band over +15 cm: the -open variant has no end posts), nothing of it blocks, the dike stays walkable', () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A06.1');
		const st = topStats(glbTopAt(sampleFile(def.model)), range(-1.2, 1.2, 0.1), range(-0.3, 0.3, 0.1));
		assert.ok(st.n > 100 && st.q25 > 0.3 && st.q25 < 0.4, `the causeway floor ${st.q25?.toFixed(3)}`);
		// end to end (the posts stood at x ±1.4…1.85 on the centre line): the -open model keeps nothing over the deck, the full model still has its posts
		const ends = [...range(-1.95, -1.3, 0.05), ...range(1.3, 1.95, 0.05)];
		const posts = (file) => topStats(glbTopAt(file), ends, range(-0.35, 0.2, 0.05)).hi;
		assert.ok(def.model.endsWith('-open') && posts(sampleFile(def.model)) < st.q25 + 0.15, `the -open causeway ends rise to ${posts(sampleFile(def.model)).toFixed(2)}`);
		assert.ok(posts(sampleFile('act1-a06-1-causeway')) > 0.6, 'the full model still has its end posts');
		const pieces = W.structures.filter((s) => s.asset === 'A06.1');
		assert.ok(pieces.length >= 8);
		const full = topStats(glbTopAt(sampleFile(def.model)), range(-1.95, 1.95, 0.1), range(-0.3, 0.3, 0.1));
		for (const s of pieces) {
			const h = W.height(s.x, s.z);
			assert.ok(Math.abs(s.y + st.q25 * s.scale[1] - h) < 0.05 && s.y + full.hi * s.scale[1] - h < 0.15, `a causeway piece at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}: floor ${(s.y + st.q25).toFixed(2)}, bumps to ${(s.y + full.hi).toFixed(2)} vs the crest ${h.toFixed(2)}`);
		}
		assert.equal(W.blockers.filter((b) => b.asset === 'A06.1').length, 0, 'no causeway blockers');
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'fenroad'));
		for (const s of pieces) assert.ok(g.reached(s.x, s.z, 1.4), `the crest beside the causeway piece at ${s.x.toFixed(1)}, ${s.z.toFixed(1)} is walkable`);
	});
	test('lychgate: kit fix — the lychgate lamp is a lantern: the A16.6 GLB cut to its lantern head (nothing of the post or the arm), hung by its link from the front tie beam over the hero, the light in its glass', () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A16.6-lantern');
		assert.ok(def.status === 'glb' && def.model === 'act1-a16-6-sexton-lamp' && def.collide === false && def.cut?.length && def.pivot);
		// the triangles the build keeps (cutTriangles on the GLB file), in the def frame (the pivot = the lantern's bottom centre)
		const kb = keptBounds(sampleFile(def.model), def.cut);
		assert.ok(kb.triangles > 1000 && kb.triangles < kb.of / 3, `${kb.triangles} of ${kb.of} triangles kept`);
		const lo = kb.lo.map((v, k) => v - def.pivot[k]);
		const hi = kb.hi.map((v, k) => v - def.pivot[k]);
		assert.ok(hi[0] - lo[0] < 0.32 && hi[2] - lo[2] < 0.32 && hi[1] - lo[1] < 0.56, `the kept part is the lantern only: ${hi.map((h, k) => (h - lo[k]).toFixed(2))}`);
		assert.ok(Math.abs(lo[1]) < 0.01 && Math.abs(hi[1] - def.size[1]) < 0.01 && Math.abs((lo[0] + hi[0]) / 2) < 0.03 && Math.abs((lo[2] + hi[2]) / 2) < 0.03, 'the pivot is its bottom centre, the def size its height');
		// hung under the front tie beam of the A02.1 GLB (local (0, 0.97): the beam's underside is the lowest surface there over 2 m)
		const gate = W.structures.find((s) => s.asset === 'A02.1');
		const lamp = W.structures.find((s) => s.asset === 'A16.6-lantern');
		const beam = glbHitsAt(sampleFile(plan.assets.find((a) => a.id === 'A02.1').model))(lamp.x - gate.x, lamp.z - gate.z).find((y) => y > 2);
		assert.ok(gate.yawDeg === 0 && lamp.yawDeg === 0 && Math.abs(lamp.x - gate.x) < 0.05);
		const hook = lamp.y + hi[1] * lamp.scale[1];
		assert.ok(hook - gate.y > beam - 0.005 && hook - gate.y < beam + 0.03, `the hook at ${(hook - gate.y).toFixed(3)} m, the beam's underside at ${beam.toFixed(3)} m`);
		assert.ok(lamp.y - gate.y > 1.85, `the lantern's bottom ${(lamp.y - gate.y).toFixed(2)} m over the gate's floor (over the hero)`);
		const L = W.lights.find((l) => l.id === 'lychgateLamp');
		const ly = gate.y + L.y; // light y = above the ground there (the gate's pad)
		assert.ok(Math.hypot(L.x - lamp.x, L.z - lamp.z) < 0.05 && ly > lamp.y + 0.1 && ly < hook - 0.15, `the light ${ly.toFixed(2)} in the glass (${lamp.y.toFixed(2)}–${hook.toFixed(2)})`);
		assert.ok(L.glow <= 0.35 && L.night.glow <= L.glow, 'a small glow in the lantern, not an orb');
	});
}
// ---- kit fix r1: the A06.1 causeway runs end to end down the dike roads (lychgate: the road to the Night Fens; fens: D1, D2, D4) -----------------
for (const { mod } of mods) {
	const plan = mod.PLAN;
	const runs = (plan.runs ?? []).filter((r) => r.asset === 'A06.1');
	if (!runs.length) continue;
	test(`${plan.id}: kit fix — the dike crest walks end to end along every A06.1 causeway run (every 0.25 m of its line: nothing solid within the hero radius in the walk band, the walk grid reaches the cell)`, () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A06.1');
		assert.ok(def.collide === false && !def.blockers, 'the causeway does not block');
		assert.equal(W.blockers.filter((b) => b.asset === 'A06.1').length, 0);
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'fenroad'), { full: true });
		const [bx0, bz0, bx1, bz1] = W.bounds;
		let n = 0;
		for (const r of runs) {
			for (let i = 1; i < r.points.length; i++) {
				const [ax, az] = r.points[i - 1];
				const [bx, bz] = r.points[i];
				const len = Math.hypot(bx - ax, bz - az);
				for (let t = 0; t <= len; t += 0.25) {
					const x = ax + ((bx - ax) * t) / len;
					const z = az + ((bz - az) * t) / len;
					if (x < bx0 + 1.5 || x > bx1 - 1.5 || z < bz0 + 1.5 || z > bz1 - 1.5) continue; // the road runs on off the map edge
					n++;
					const y = W.walkY(x, z);
					const hit = W.blockers.find((b) => b.y1 >= y + PLAY.band[0] && b.y0 <= y + PLAY.band[1] && polySigned(b.pts, x, z) < PLAY.radius);
					assert.ok(!hit, `${r.tag} crest at ${x.toFixed(2)}, ${z.toFixed(2)}: ${hit?.asset} stands in the walk line`);
					assert.ok(g.reached(x, z, 0), `${r.tag} crest at ${x.toFixed(2)}, ${z.toFixed(2)}: not reached from the fenroad spawn`);
				}
			}
		}
		assert.ok(n > 100, `${n} crest samples`);
	});
}
const fensKit = mods.find(({ mod }) => mod.PLAN.id === 'fens');
if (fensKit) {
	const plan = fensKit.mod.PLAN;
	test('fens: kit swap — the A07.5 raft GLB deck top lies on its hidden raft walkway (±6 cm); the A06.3 ford GLB stone tops stand 0.05–0.3 m above the water, the ankle-deep causeway under them stays the walk', () => {
		const W = evaluatePlan(plan);
		const raft = plan.assets.find((a) => a.id === 'A07.5');
		const st = topStats(glbTopAt(sampleFile(raft.model)), range(-1.4, 1.4, 0.1), range(-0.5, 0.2, 0.1));
		assert.ok(st.n > 100 && Math.abs(st.med - 0.81) < 0.05, `the raft deck top ${st.med?.toFixed(3)}`);
		const rafts = W.structures.filter((s) => s.asset === 'A07.5');
		assert.equal(rafts.length, 3);
		for (const s of rafts) {
			const deck = W.deckAt(s.x, s.z);
			assert.ok(deck !== null && Math.abs(s.y + st.med * s.scale[1] - deck) < 0.06, `raft at ${s.x}, ${s.z}: GLB deck ${(s.y + st.med).toFixed(2)} vs the walk deck ${deck}`);
		}
		for (const p of plan.paths.filter((q) => q.id.startsWith('raft'))) assert.ok(p.hidden && p.width <= 1.8, `${p.id}: hidden, no wider than the raft`);
		const ford = plan.assets.find((a) => a.id === 'A06.3');
		assert.ok(ford.status === 'glb' && ford.collide === false);
		const fs = topStats(glbTopAt(sampleFile(ford.model)), range(-1.6, 1.6, 0.1), range(-3.4, 3.4, 0.1));
		const fords = W.structures.filter((s) => s.asset === 'A06.3');
		assert.equal(fords.length, 2, 'one GLB per ford');
		for (const s of fords) {
			const water = W.waterAt(s.x, s.z)?.level ?? 0;
			const top = s.y + fs.hi * s.scale[1];
			assert.ok(top > water + 0.05 && top < water + 0.3, `ford at ${s.x}, ${s.z}: stone tops ${(top - water).toFixed(2)} m above the water`);
			assert.ok(W.height(s.x, s.z) < water && W.height(s.x, s.z) > water - 0.2, 'the ankle-deep causeway is the walk surface under the stones');
		}
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'ford'));
		for (const s of fords) assert.ok(g.reached(s.x, s.z, 1), `the ford at ${s.x}, ${s.z} is walkable`);
	});
	test('fens: kit swap — the A07.3 GLB stands only where no lane passes its 1.25 m door (the supper house); the lane door and rite 5 keep the widened blockout; the walked roofs keep the blockout', () => {
		const W = evaluatePlan(plan);
		assert.deepEqual(W.structures.filter((s) => s.asset === 'A07.3').map((s) => s.name).sort(), ['Supper house, east gable (its doorway)', 'Supper house, west gable']);
		assert.equal(W.structures.filter((s) => s.asset === 'A07.3-door').length, 2);
		assert.equal(plan.assets.find((a) => a.id === 'A07.3-door').status, 'blockout');
		assert.ok(W.structures.filter((s) => s.asset === 'A07.4-walk').every((s) => /walked/.test(s.name)) && W.structures.filter((s) => s.asset === 'A07.4').every((s) => !/walked/.test(s.name)));
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'village'));
		for (const id of ['L2', 'L7']) {
			const p = plan.paths.find((q) => q.id === id);
			const end = p.points[p.points.length - 1];
			assert.ok(g.reached(end[0], end[1], 1), `${id} reaches its end (${end})`);
		}
	});
}
const poppyKit = mods.find(({ mod }) => mod.PLAN.id === 'poppyReach');
if (poppyKit) {
	const plan = poppyKit.mod.PLAN;
	test('poppyReach: kit swap — the A08.2 GLB walls stand ×1.25 (4 m pieces at a 3.5 m module: their ragged ends overlap; never stretched up or across but on a slope), block on their stone core; the stile gap and the open gates stay walkable; farmhouse, stile and gates keep their blockouts', () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A08.2');
		assert.ok(def.status === 'glb' && def.module < def.size[0] && plan.runs.filter((r) => r.asset === 'A08.2').every((r) => r.scale === 1.25));
		const walls = W.structures.filter((s) => s.asset === 'A08.2');
		assert.ok(walls.length > 200);
		for (const s of walls) {
			assert.ok(Math.abs(s.scale[2] - 1.25) < 1e-9 && s.scale[1] >= 1.25 - 1e-9 && s.scale[0] >= 0.6 * 1.25 && s.scale[0] <= 1.4 * 1.25, `a wall module's scale ${s.scale.map((v) => v.toFixed(2))}`);
		}
		const blk = W.blockers.filter((b) => b.asset === 'A08.2');
		assert.equal(blk.length, walls.length, 'one stone-core blocker per module');
		for (const id of ['A08.2-stile', 'A08.3', 'A08.5']) assert.equal(plan.assets.find((a) => a.id === id).status, 'blockout', `${id} keeps its blockout`);
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'farm'), { full: true });
		for (const s of W.structures.filter((q) => q.asset === 'A08.2-stile' || q.asset === 'A08.5')) assert.ok(g.reached(s.x, s.z, 1), `${s.name}: walkable through`);
	});
}

// ---- A21–A25 swap (2026-10-23): the layout-only placeholders on their new GLBs (tmp/act1-base-maps/ACT1_KIT_FIT.md "A21–A25") ----------------
/** Per map: placeholder def id → its A2x sample id; `keep`: ids that stay blockouts (QA redo). */
const A2X = {
	lychgate: { swap: { N01: 'act1-a21-1-barrow-door', N02: 'act1-a21-2-flint-retaining-wall', N04: 'act1-a21-3-peat-stack', N10: 'act1-a21-4-vigil-chair' }, keep: [] },
	fens: { swap: { 'A17.1': 'act1-a21-5-leaning-stones-wide', 'N-FN03': 'act1-a21-6-bog-grave', 'N-FN02': 'act1-a22-1-worn-shoes', 'N-FN06': 'act1-a22-2-toll-post', 'N-FN08': 'act1-a22-3-wicker-cradle' }, keep: [] },
	poppyReach: { swap: { 'N-PR02': 'act1-a22-4-harvester-cairn', 'N-PR03': 'act1-a22-5-crook-and-coat', 'N-PR05': 'act1-a22-6-straw-doll', 'N-PR04': 'act1-a23-2-ribbon-thorn', 'A22.1': 'act1-a22-1-worn-shoes' }, keep: ['N-PR01'] },
};
for (const { mod } of mods) {
	const plan = mod.PLAN;
	const a2x = A2X[plan.id];
	if (!a2x) continue;
	test(`${plan.id}: A21–A25 swap — every new GLB def resolves to its registered sample with a file, keeps the GLB's own size (fit native) and is placed`, () => {
		const W = evaluatePlan(plan);
		for (const [id, model] of Object.entries(a2x.swap)) {
			const a = plan.assets.find((q) => q.id === id);
			assert.ok(a, `${id}: no def`);
			assert.ok(a.status === 'glb' && a.model === model && a.fit === 'native', `${id}: glb ${model} at its native size (is ${a.status} ${a.model} ${a.fit})`);
			assert.ok(sampleById.get(model)?.file, `${id}: ${model} is not a registered sample`);
			assert.ok(existsSync(sampleFile(model)), `${id}: ${sampleFile(model)} missing`);
			const s = glbSize(sampleFile(model));
			assert.ok(a.size.every((v, k) => Math.abs(v - s[k]) < 0.03), `${id}: size ${a.size} ≠ GLB ${s.map((v) => v.toFixed(2))}`);
			assert.ok(W.structures.some((q) => q.asset === id), `${id}: placed`);
		}
		for (const id of a2x.keep) assert.equal(plan.assets.find((q) => q.id === id)?.status, 'blockout', `${id} keeps its blockout`);
	});
}
if (lychMod) {
	const plan = lychMod.mod.PLAN;
	test('lychgate: A21–A25 swap — the A21.2 terrace wall stands ×1.55 (≥ 3.2 m, its coping over the uphill ground, never stretched past +12 %) with its outer face to the terrace; the A21.1 vault door sits flush in it, the runs stop at its ends', () => {
		const W = evaluatePlan(plan);
		const file = sampleFile('act1-a21-2-flint-retaining-wall');
		const coping = topStats(glbTopAt(file), range(-1.6, 1.6, 0.2), range(-0.1, 0.1, 0.1)).med; // the coping top in the GLB frame (≈2.08 m)
		assert.ok(coping > 1.95 && coping < 2.16, `the coping ${coping?.toFixed(2)}`);
		const walls = W.structures.filter((s) => s.asset === 'N02');
		assert.ok(walls.length >= 4);
		const door = W.structures.find((s) => s.asset === 'N01');
		// the measured faces (GLB frame, front-most surface seen from +z): the wall's flint face, the portal's wall section beside its jambs and its
		// recessed door; the bboxes reach further out (the coping and ferns, the threshold step)
		const med = (a) => [...a].sort((u, v) => u - v)[a.length >> 1];
		const frontWall = glbFrontAt(file);
		const wallFace = med(range(-1.5, 1.5, 0.25).flatMap((x) => range(0.3, 1.8, 0.3).map((y) => frontWall(x, y))).filter((z) => z !== null));
		const frontDoor = glbFrontAt(sampleFile('act1-a21-1-barrow-door'));
		const doorWall = med([-1.7, -1.55, 1.55, 1.7].flatMap((x) => range(0.3, 2.0, 0.3).map((y) => frontDoor(x, y))).filter((z) => z !== null));
		const doorPlane = med(range(-0.4, 0.4, 0.2).flatMap((x) => range(0.5, 1.8, 0.3).map((y) => frontDoor(x, y))).filter((z) => z !== null));
		assert.ok(wallFace > 0 && wallFace < 0.2 && doorWall > 0 && doorWall < 0.2 && doorPlane < doorWall - 0.08, `faces: wall ${wallFace?.toFixed(3)}, portal wall ${doorWall?.toFixed(3)}, door ${doorPlane?.toFixed(3)}`);
		/** The ground right in front of a face (2 cm) is the ground 0.6 m out: no edge ramp of the terrace climbs the face (it hid the lower 2 m). */
		const flatBefore = (s, face, lxs) => {
			const c = Math.cos(s.yaw);
			const sn = Math.sin(s.yaw);
			for (const lx of lxs) {
				const p = (lz) => [s.x + lx * s.scale[0] * c + lz * sn, s.z - lx * s.scale[0] * sn + lz * c];
				const [near, far] = [W.height(...p(face * s.scale[2] + 0.02)), W.height(...p(face * s.scale[2] + 0.6))];
				assert.ok(near - far < 0.15, `${s.asset} at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}: the ground climbs its face (${far.toFixed(2)} → ${near.toFixed(2)} m) at local x ${lx}`);
			}
		};
		flatBefore(door, doorPlane, range(-0.6, 0.6, 0.3));
		flatBefore(door, doorWall, [-1.6, 1.6]);
		for (const s of walls) {
			flatBefore(s, wallFace, range(-1.8, 1.8, 0.3));
			assert.ok(Math.abs(s.scale[2] - 1.55) < 1e-9 && s.scale[1] >= 1.55 - 1e-9 && s.scale[1] <= 1.55 * 1.12 && Math.abs(s.scale[0] / 1.55 - 1) < 0.15, `a wall module's scale ${s.scale.map((v) => v.toFixed(2))}`);
			assert.ok(s.size[1] >= 3.2, `a wall module ${s.size[1].toFixed(2)} m tall`);
			// the outer face (+z of the GLB) looks into the terrace: toward the door's terrace side
			const fx = Math.sin(s.yaw);
			const fz = Math.cos(s.yaw);
			assert.ok(fx * (door.x - s.x) + fz * (door.z + 3.5 - s.z) > 0, `the wall at ${s.x.toFixed(1)}, ${s.z.toFixed(1)} faces away from the terrace`);
			// its coping is over the uphill ground right behind it (the hill never pokes over the wall top)
			const c = Math.cos(s.yaw);
			const sn = Math.sin(s.yaw);
			const back = -0.365 * s.scale[2] - 0.1;
			for (const lx of range(-1.6, 1.6, 0.4)) {
				const x = s.x + lx * s.scale[0] * c + back * sn;
				const z = s.z - lx * s.scale[0] * sn + back * c;
				assert.ok(s.y + coping * s.scale[1] > W.height(x, z) - 0.05, `the coping ${(s.y + coping * s.scale[1]).toFixed(2)} under the hill ${W.height(x, z).toFixed(2)} behind ${x.toFixed(1)}, ${z.toFixed(1)}`);
			}
		}
		// the door: its wall section's face flush with the wall face (±5 cm), the two back runs end at its clean ends (±5 cm)
		const back = walls.filter((s) => Math.abs(s.yawDeg) < 1e-6);
		assert.equal(back.length, 2, 'two wall runs either side of the door');
		for (const s of back) assert.ok(Math.abs(door.z + doorWall - (s.z + wallFace * s.scale[2])) < 0.05, `the door face ${(door.z + doorWall).toFixed(2)} is flush with the wall face ${(s.z + wallFace * s.scale[2]).toFixed(2)}`);
		const ends = back.map((s) => [s.x - s.size[0] / 2, s.x + s.size[0] / 2]).flat().sort((u, v) => Math.abs(u - door.x) - Math.abs(v - door.x));
		assert.ok(Math.abs(Math.abs(ends[0] - door.x) - 1.85) < 0.05 && Math.abs(Math.abs(ends[1] - door.x) - 1.85) < 0.05, `the runs end at ${ends[0].toFixed(2)} / ${ends[1].toFixed(2)} (the door ±1.85)`);
		assert.ok(door.collide && W.blockers.some((b) => b.asset === 'N01'), 'the vault door blocks on its footprint');
		// the terrace spawn reaches the door (the lychgate test above keeps the summit out of reach from every hub-side spawn with the gate shut)
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'terrace'), { full: true });
		assert.ok(g.reached(door.x, door.z + 1.4, 0.6), 'the vault door is reached from the terrace');
	});
	test('lychgate: review a2x F-a — the terrace walls (A21.2 ×1.55) and the A21.1 vault door block only up to their visible faces: the hero stops within ~0.1 m of the stone (the door: of its threshold step), never inside it; the foot ferns are walk-through', () => {
		const W = evaluatePlan(plan);
		const cell = 0.05;
		const g = W.walkGrid(W.spawns.find((s) => s.id === 'terrace'), { size: 24, cell });
		const walkAt = (x, z) => {
			const i = Math.floor((x - g.ox) / cell);
			const j = Math.floor((z - g.oz) / cell);
			return i >= 0 && j >= 0 && i < g.n && j < g.n && g.walk[i + j * g.n] === 1;
		};
		const med = (a) => [...a].sort((u, v) => u - v)[a.length >> 1];
		/** The visible face (GLB frame z) at local x: the median front of the stone at walking height over the foot ferns (0.8–1.7 m up in the world),
		 * or, in the door's threshold step span, the step's front (0.12 m up: the step is 0.16 m tall). */
		const faceOf = (file, sy, step) => {
			const front = glbFrontAt(file);
			return (lx) => {
				if (step && lx > step[0] && lx < step[1]) return front(lx, 0.12);
				const zs = range(0.8, 1.7, 0.1).map((y) => front(lx, y / sy)).filter((z) => z !== null);
				return zs.length ? med(zs) : null;
			};
		};
		const wallFace = faceOf(sampleFile('act1-a21-2-flint-retaining-wall'), 1.55);
		const doorFace = faceOf(sampleFile('act1-a21-1-barrow-door'), 1, [-0.75, 0.7]);
		// a wall module away from its ends (a corner: the 0.5 m walk-floor grid rounds the two walls' holes into each other there, up to ~0.1 m more)
		const wallZ = new Map(range(-1.2, 1.2, 0.1).map((lx) => [lx, wallFace(lx)]));
		// the door: its wall sections and the middle of its step (0.35 m clear of the arch and step sides, where their corners stop the hero's 0.3 m radius)
		const doorZ = new Map([...range(-1.75, -1.55, 0.1), ...range(-0.45, 0.4, 0.1), ...range(1.5, 1.7, 0.1)].map((lx) => [lx, doorFace(lx)]));
		const others = W.blockers.filter((b) => b.asset !== 'N01' && b.asset !== 'N02');
		const gaps = [];
		for (const s of W.structures.filter((q) => q.asset === 'N01' || q.asset === 'N02')) {
			const c = Math.cos(s.yaw);
			const sn = Math.sin(s.yaw);
			for (const [lx, fz] of s.asset === 'N02' ? wallZ : doorZ) {
				assert.ok(fz !== null, `${s.asset}: no face at local x ${lx.toFixed(2)}`);
				const lz = fz * s.scale[2];
				const fx = s.x + lx * s.scale[0] * c + lz * sn;
				const fzw = s.z - lx * s.scale[0] * sn + lz * c;
				if (others.some((b) => polySigned(b.pts, fx, fzw) < 1.2)) continue; // a prop stands in front (the skulls, the candles)
				// out along the face normal (local +z) to the first walkable cell: the hero's body edge is that far minus its radius from the face
				let t = 0;
				while (t <= 0.8 && !walkAt(fx + t * sn, fzw + t * c)) t += 0.01;
				const gap = t - PLAY.radius;
				gaps.push(gap);
				assert.ok(t <= 0.8, `${s.asset} at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}: nothing walkable within 0.8 m of its face at local x ${lx.toFixed(2)}`);
				assert.ok(gap <= 0.12, `${s.asset} at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}: the hero stops ${gap.toFixed(2)} m short of the visible face at local x ${lx.toFixed(2)} (an invisible wall)`);
				assert.ok(gap >= -0.04, `${s.asset} at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}: the hero walks ${(-gap).toFixed(2)} m into the face at local x ${lx.toFixed(2)}`);
			}
		}
		assert.ok(gaps.length >= 80, `only ${gaps.length} face samples`);
	});
}
// ---- A21–A25 round, kit review r2 leftover: the A06.1 causeway pieces meet end to end (no dashed slabs with grass between) ------------------------
for (const { mod } of mods) {
	const plan = mod.PLAN;
	const runs = (plan.runs ?? []).filter((r) => r.asset === 'A06.1');
	if (!runs.length) continue;
	test(`${plan.id}: A06.1 causeway — at its 3 m module the pieces' plank-and-stone decks overlap end to end down every run (every 0.25 m between the end pieces lies on a deck)`, () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A06.1');
		const topAt = glbTopAt(sampleFile(def.model));
		// the deck's extent along local x: the columns whose centre band (|z| ≤ 0.3) stands over 0.3 m
		const cols = range(-2, 2, 0.05).filter((x) => topStats(topAt, [x], range(-0.3, 0.3, 0.1)).med > 0.3);
		const [lo, hi] = [Math.min(...cols), Math.max(...cols)];
		assert.ok(hi - lo > 3.0 && hi - lo < 3.8, `the deck spans ${lo.toFixed(2)}…${hi.toFixed(2)}`);
		assert.ok(def.module >= 2.6 && def.module < hi - lo, `module ${def.module} < the deck length ${(hi - lo).toFixed(2)}: the decks overlap`);
		for (const [ri] of runs.entries()) {
			const pieces = W.structures.filter((s) => s.asset === 'A06.1' && s.run === plan.runs.indexOf(runs[ri]));
			assert.ok(pieces.length >= 2);
			const onDeck = (x, z) => pieces.some((s) => {
				const dx = x - s.x;
				const dz = z - s.z;
				const lx = (dx * Math.cos(s.yaw) - dz * Math.sin(s.yaw)) / s.scale[0];
				const lz = dx * Math.sin(s.yaw) + dz * Math.cos(s.yaw);
				return lx >= lo - 0.03 && lx <= hi + 0.03 && Math.abs(lz) <= 0.3;
			});
			let n = 0;
			for (let k = 1; k < pieces.length; k++) {
				const [a, b] = [pieces[k - 1], pieces[k]];
				const len = Math.hypot(b.x - a.x, b.z - a.z);
				if (len > def.module * 1.45) continue; // a gap in the run (the arch passage, a ford): not a joint
				for (let t = 0; t <= len; t += 0.25) {
					n++;
					const x = a.x + ((b.x - a.x) * t) / len;
					const z = a.z + ((b.z - a.z) * t) / len;
					assert.ok(onDeck(x, z), `${runs[ri].tag}: grass between the causeway pieces at ${x.toFixed(2)}, ${z.toFixed(2)}`);
				}
			}
			assert.ok(n > 10);
		}
	});
}
const fensA2x = mods.find(({ mod }) => mod.PLAN.id === 'fens');
if (fensA2x) {
	const plan = fensA2x.mod.PLAN;
	test('fens: A21–A25 swap — the A21.5 -wide leaning stones keep the passage over the dike walkable (the GLB open from the floor to 2.2 m over x −1.2…+1.1 and ≥ 3.4 m at its centre; blockers on the two stones only, 2.5 m apart, no stone in the walk band outside them; the Play grid walks through)', () => {
		const W = evaluatePlan(plan);
		const def = plan.assets.find((a) => a.id === 'A17.1');
		assert.equal(def.model, 'act1-a21-5-leaning-stones-wide', 'the -wide variant, not the plain A21.5 (a 1.6–1.75 m gap)');
		const file = sampleFile(def.model);
		// the model's own passage: vertical rays inside it meet nothing below 2.2 m (the stones lean in only above), the centre has the headroom
		const hitsAt = glbHitsAt(file);
		for (const x of range(-1.2, 1.1, 0.1)) for (const z of range(-1.1, 1.1, 0.2)) {
			const h = hitsAt(x, z);
			assert.ok(!h.length || h[0] >= 2.2, `a surface at ${h[0]?.toFixed(2)} m inside the passage (${x.toFixed(1)}, ${z.toFixed(1)})`);
		}
		const mid = hitsAt(-0.05, 0);
		assert.ok(!mid.length || mid[0] >= 3.4, `headroom ${mid[0]?.toFixed(2)} m at the passage centre`);
		// the blockers: two, the passage between them ≥ 2.4 m; every stone vertex in the walk band (0.3–2.2 m) inside one of them (±2 cm)
		assert.equal(def.blockers.length, 2);
		const [L, R] = [...def.blockers].sort((a, b) => a[0] - b[0]);
		assert.ok(R[0] - R[2] / 2 - (L[0] + L[2] / 2) >= 2.4, 'the blockers leave ≥ 2.4 m');
		const { P } = glbArrays(file);
		for (let i = 0; i < P.length; i += 3) {
			const [x, y, z] = [P[i], P[i + 1], P[i + 2]];
			if (y < 0.3 || y > 2.2) continue;
			const out = Math.min(...def.blockers.map(([bx, bz, w, d]) => Math.max(Math.abs(x - bx) - w / 2, Math.abs(z - bz) - d / 2, 0)));
			assert.ok(out < 0.02, `a stone vertex (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}) ${out.toFixed(2)} m outside the blockers: walk-through stone`);
		}
		// the placed arch: its feet in the footing (never floating), its two blockers in the world, the Play grid walks the dike through it
		const s = W.structures.find((q) => q.asset === 'A17.1');
		const c = Math.cos(s.yaw);
		const sn = Math.sin(s.yaw);
		const w = (lx, lz) => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
		for (const lx of [-2.8, -1.3, 1.3, 2.8]) for (const lz of [-1.15, 0, 1.15]) assert.ok(s.y <= W.height(...w(lx, lz)) + 0.01, `a stone foot floats at ${lx}, ${lz}: base ${s.y.toFixed(2)} over the ground ${W.height(...w(lx, lz)).toFixed(2)}`);
		assert.equal(W.blockers.filter((b) => b.asset === 'A17.1').length, 2);
		const g = W.walkGrid(W.spawns.find((q) => q.id === 'arch'), { full: true });
		for (const lz of range(-2.5, 2.5, 0.5)) assert.ok(g.reached(...w(-0.05, lz), 0.6), `the passage at ${lz} m along the path is not walkable`);
		const seg = plan.segments.find((q) => q.id === 'arch');
		const far = seg.route[seg.route.length - 1];
		assert.ok(g.reached(far[0], far[1], 1), 'the arch route reaches its far end through the stones');
		// without the stones' blockers the passage is no wider: the blockers do not shut a way the model leaves open
		const all = W.blockers;
		W.blockers = all.filter((b) => b.asset !== 'A17.1');
		const g0 = W.walkGrid(W.spawns.find((q) => q.id === 'arch'), { full: true });
		W.blockers = all;
		for (const lz of [-0.5, 0, 0.5]) assert.ok(g0.reached(...w(-0.05, lz), 0.6));
		assert.ok(g.cells > g0.cells * 0.97, 'the stones take only their own footprint');
	});
}
const poppyA2x = mods.find(({ mod }) => mod.PLAN.id === 'poppyReach');
if (poppyA2x) {
	const plan = poppyA2x.mod.PLAN;
	test('poppyReach: A21–A25 swap — the A23.2 ribbon thorn stands by its trunk foot on the rite 4 marker, its crown leaning downwind of the smoke (east, within 40°); it blocks on its trunk only, its root ends meet the slope, the sleeper\'s shoes lie clear of it and the thorn track reaches them', () => {
		const W = evaluatePlan(plan);
		const s = W.structures.find((q) => q.asset === 'N-PR04');
		const R4 = W.markers.find((m) => m.kind === 'rite' && m.id === 'R4');
		const c = Math.cos(s.yaw);
		const sn = Math.sin(s.yaw);
		const w = (lx, lz) => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
		const inv = (x, z) => [(x - s.x) * c - (z - s.z) * sn, (x - s.x) * sn + (z - s.z) * c];
		const [fx, fz] = w(0.27, 1.39); // the trunk foot (ACT1_KIT_FIT.md)
		assert.ok(Math.hypot(fx - R4.x, fz - R4.z) < 0.05, `the trunk foot ${fx.toFixed(2)}, ${fz.toFixed(2)} is off the rite marker ${R4.x}, ${R4.z}`);
		const file = sampleFile('act1-a23-2-ribbon-thorn');
		const { P } = glbArrays(file);
		let n = 0;
		let sx = 0;
		let sz = 0;
		for (let i = 0; i < P.length; i += 3) if (P[i + 1] > 4.5) [n, sx, sz] = [n + 1, sx + P[i], sz + P[i + 2]];
		const [tx, tz] = w(sx / n, sz / n);
		const lean = [tx - fx, tz - fz];
		const wind = plan.smoke.wind;
		const cos = (lean[0] * wind[0] + lean[1] * wind[1]) / (Math.hypot(...lean) * Math.hypot(...wind));
		assert.ok(Math.hypot(...lean) > 1.5 && cos > 0.75 && lean[0] > 0, `the crown top leans ${lean.map((v) => v.toFixed(2))} (the smoke wind ${wind}): cos ${cos.toFixed(2)}`);
		// the root ends (model vertices at its base) meet the slope within 4 cm, never float; the trunk foot is not buried deeper than 0.2 m
		for (let i = 0; i < P.length; i += 3) {
			if (P[i + 1] > 0.06) continue;
			const [x, z] = w(P[i], P[i + 2]);
			assert.ok(s.y + P[i + 1] - W.height(x, z) < 0.04, `a root end floats ${(s.y + P[i + 1] - W.height(x, z)).toFixed(2)} m at ${x.toFixed(1)}, ${z.toFixed(1)}`);
		}
		assert.ok(W.height(fx, fz) - s.y < 0.2, 'the trunk foot is not buried');
		// blocks on the trunk only (two rects within 1.2 m of the foot)
		const blk = W.blockers.filter((b) => b.asset === 'N-PR04');
		assert.equal(blk.length, 2);
		for (const b of blk) assert.ok(Math.hypot(b.x - fx, b.z - fz) < 1.2 && b.r < 0.8, 'a thorn blocker off the trunk');
		// the shoes: by the foot, nothing of the thorn model over their footprint (roots, ribbons), reached from the top spawn like the track's end
		const sh = W.structures.find((q) => q.asset === 'A22.1');
		assert.ok(Math.hypot(sh.x - fx, sh.z - fz) < 1.8 && sh.collide === false);
		const hitsAt = glbHitsAt(file);
		for (const [dx, dz] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0, 0]]) assert.ok((hitsAt(...inv(sh.x + dx, sh.z + dz))[0] ?? 9) > 1.8, 'roots or low branches of the thorn over the shoes (its crown over 1.8 m is fine: the shoes lie beneath it)');
		const g = W.walkGrid(W.spawns.find((q) => q.id === 'top'), { full: true });
		assert.ok(g.reached(-38, -81.5, 1) && g.reached(sh.x, sh.z, 1), 'the thorn track end and the shoes are walkable from the top spawn');
	});
}
// ---- review a2x F-c: the bog grave's willow stake (fens N-FN03) and the shepherd's crook (poppyReach N-PR03) block on the upright only ---------------
for (const [id, asset, model, low, rite] of [['fens', 'N-FN03', 'act1-a21-6-bog-grave', 0.75, 'R4'], ['poppyReach', 'N-PR03', 'act1-a22-5-crook-and-coat', 0.55, 'R3']]) {
	const found = mods.find(({ mod }) => mod.PLAN.id === id);
	if (!found) continue;
	test(`${id}: review a2x F-c — the ${asset} upright blocks on one 0.3 × 0.3 m rect round it (the hero no longer walks through the standing stake / crook), the low parts stay walk-through, rite ${rite} is still walked to`, () => {
		const W = evaluatePlan(found.mod.PLAN);
		const s = W.structures.find((q) => q.asset === asset);
		const blk = W.blockers.filter((b) => b.asset === asset);
		assert.ok(s.collide && blk.length === 1, `${asset}: ${blk.length} blockers`);
		const [b] = blk;
		const side = (k) => Math.hypot(b.pts[(k + 1) % 4][0] - b.pts[k][0], b.pts[(k + 1) % 4][1] - b.pts[k][1]);
		assert.ok(Math.abs(side(0) - 0.3) < 0.01 && Math.abs(side(1) - 0.3) < 0.01, `the blocker ${side(0).toFixed(2)} × ${side(1).toFixed(2)} m`);
		// the upright: the model's vertices over its low parts (the mound and stones / the folded coat) up to the walk band's top
		const { P } = glbArrays(sampleFile(model));
		const c = Math.cos(s.yaw);
		const sn = Math.sin(s.yaw);
		let n = 0;
		let inside = 0;
		let near = 0;
		for (let i = 0; i < P.length; i += 3) {
			if (P[i + 1] < low || P[i + 1] > PLAY.band[1]) continue;
			const d = polySigned(b.pts, s.x + P[i] * c + P[i + 2] * sn, s.z - P[i] * sn + P[i + 2] * c);
			n++;
			if (d <= 0.005) inside++;
			if (d <= 0.1) near++;
		}
		assert.ok(n > 300 && inside >= 0.85 * n && near >= 0.99 * n, `${asset}: ${inside} / ${near} of ${n} upright vertices inside / within 0.1 m of its blocker`);
		const R = W.markers.find((m) => m.kind === 'rite' && m.id === rite);
		const sp = W.spawns.find((q) => q.id === (R.segment ?? found.mod.PLAN.assets.find((q2) => q2.id === asset).segment)); // its segment's spawn
		assert.ok(sp && W.walkGrid(sp, { full: true }).reached(R.x, R.z, 1), `rite ${rite} is walked to from ${sp?.id}`);
	});
}

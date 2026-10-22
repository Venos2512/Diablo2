// ASHLAR Act I base maps — the INTERIOR engine (src/env/act1/interior.js) and every interior map in src/env/act1/maps/ (PLAN.engine === 'interior').
// No browser: plan validity (no NaN, bounds, spawns walkable and connected, the main route clear and wide, steps the Play nav grid can climb, every asset
// placed or declared missing with a reason, markers / lights / camps in place), the SPEC §6b exports, determinism, and the Cradle's own rules.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as I from '../src/env/act1/interior.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'src/env/act1/maps');
const modules = [];
for (const file of readdirSync(mapsDir).filter((f) => f.endsWith('.js')).sort()) {
	let mod;
	try {
		mod = await import(pathToFileURL(path.join(mapsDir, file)).href);
	} catch (error) {
		test(`maps/${file} imports`, () => assert.fail(`maps/${file} failed to import: ${error.message}`)); // one broken map fails on its own; the others still run
		continue;
	}
	if (mod.PLAN?.engine === 'interior') modules.push({ file, mod });
}
const STATUS = new Set(['glb', 'kit', 'procedural', 'blockout']);
const H = 1.8;

// registered samples (src/assets/samples.json) and the real size of a prepared GLB: the POSITION min / max of its one mesh (identity node, metres)
const SAMPLES = new Map(JSON.parse(readFileSync(path.join(root, 'src/assets/samples.json'), 'utf8')).assets.map((s) => [s.id, s]));
function glbSize(file) {
	const buf = readFileSync(file);
	const json = JSON.parse(buf.toString('utf8', 20, 20 + buf.readUInt32LE(12)));
	const acc = json.accessors[json.meshes[0].primitives[0].attributes.POSITION];
	return acc.max.map((v, i) => v - acc.min[i]);
}

// ---- the engine on a small synthetic building (what maps 4 and 5 lean on: closed rooms, doors, windows, an arch, a courtyard, a ramp) ---------------
const TINY = {
	engine: 'interior', id: 'tiny', name: 'tiny', bounds: [-2, -2, 24, 20], grid: 0.25,
	floor: { layers: [{ id: 'BIO05_lime', tile: 4 }, { id: 'DW_grass', tile: 3 }], apron: 4, paint: [{ layer: 'DW_grass', kind: 'room', rooms: ['garth'], soft: 1 }] },
	wall: { tile: 'BIO05_lime', height: 3, thickness: 0.5 },
	rooms: [
		{ id: 'hall', shape: { rect: [0, 0, 10, 8] }, y: 0, walled: true },
		{ id: 'ward', shape: { rect: [10, 0, 22, 8] }, y: 0.6, walled: true },
		{ id: 'garth', shape: { rect: [0, 8, 22, 18] }, y: 0, edge: 'none', sky: { color: '#c9d2dc', intensity: 80 } },
	],
	openings: [
		{ id: 'door', at: [10, 4], width: 1.4, kind: 'door', height: 2.3 },
		{ id: 'window', at: [16, 0], width: 1.6, kind: 'window', sill: 1, height: 1.4, glow: { color: '#e0a050', intensity: 3, light: { kind: 'perfection', range: 6, intensity: 10 } } },
		{ id: 'arch', at: [5, 8], width: 2.4, kind: 'arch', height: 2.8 },
		{ id: 'wardGate', at: [16, 8], width: 2, kind: 'gap' },
	],
	ramps: [{ id: 'step', rect: [8, 2, 12, 6], up: 'e', y0: 0, y1: 0.6 }],
	segments: [{ id: 'a', name: 'hall', spawn: [3, 4] }, { id: 'b', name: 'ward', spawn: [19, 4] }, { id: 'c', name: 'garth', spawn: [11, 14] }],
	route: [[3, 4], [10, 4], [16, 4], [16, 12], [5, 12], [5, 6]],
};
test('engine: closed rooms meet in one wall with a door; a window blocks, an arch and a gap let through; courtyards get a sky light', () => {
	const m = I.compile(TINY, {});
	const errors = I.validate(m).filter((i) => i.level === 'error');
	assert.deepEqual(errors.map((e) => e.msg), []);
	const shared = m.runs.filter((r) => r.kind === 'shared');
	assert.ok(shared.some((r) => Math.abs(r.a[0] - 10) < 1e-6 && Math.abs(r.b[0] - 10) < 1e-6), 'one wall between hall and ward');
	assert.equal(m.runs.filter((r) => r.kind === 'shared' && Math.abs(r.a[0] - 10) < 1e-6 && Math.abs(r.b[0] - 10) < 1e-6).length, 1, 'the shared wall is not doubled');
	const door = m.openings.find((o) => o.id === 'door');
	const pieces = I.runPieces(m.runs.find((r) => r.id === door.run));
	assert.ok(pieces.some((p) => p.kind === 'lintel' && p.opening === door), 'a door keeps a lintel');
	const win = m.openings.find((o) => o.id === 'window');
	const wp = I.runPieces(m.runs.find((r) => r.id === win.run));
	assert.ok(wp.some((p) => p.kind === 'sill') && wp.some((p) => p.kind === 'lintel'), 'a window keeps sill and lintel');
	assert.ok(m.lights.some((l) => l.id === 'sky:garth' && l.spot), 'the courtyard has a sky light');
	assert.ok(m.lights.some((l) => l.id === 'window:window' && l.z > 0), 'the window lights the room behind it');
	// walking: hall → (door, ramp) → ward → (gap) → garth → (arch) → hall
	const f = m.flood(3, 4, 0.35, 0.3);
	for (const s of TINY.segments) assert.ok(f.reach(...s.spawn), `hall reaches ${s.id}`);
	assert.ok(!m.walkable(10, 1.0), 'the shared wall is solid away from the door');
	assert.ok(m.walkable(10, 4), 'the door is open');
	assert.ok(Math.abs(m.floorY(10, 4) - 0.3) < 1e-6, 'the ramp climbs to the ward');
	for (const [x, z] of m.routeSamples(0.5)) assert.ok(m.clearance(x, z) >= 0.35, `route (${x}, ${z})`);
});

test('engine: validation catches a ramp too steep for the Play nav grid and a light that follows no group', () => {
	const steep = { ...TINY, ramps: [{ id: 'steep', rect: [8, 2, 9, 6], up: 'e', y0: 0, y1: 0.6 }] };
	const m1 = I.compile(steep, {});
	assert.ok(I.validate(m1).some((i) => i.level === 'error' && i.msg.includes('ramp steep')), 'slope 0.6 / 1 m is an error');
	const ok = I.compile(TINY, {});
	assert.ok(!I.validate(ok).some((i) => i.msg.includes('ramp')), 'slope 0.6 / 4 m passes');
	const lost = { ...TINY, lights: [{ id: 'lost', kind: 'perfection', at: [5, 2, 4], followGroup: 'nope' }] };
	assert.ok(I.validate(I.compile(lost, {})).some((i) => i.level === 'error' && i.msg.includes('follows "nope"')));
	assert.equal(I.lightBudget(ok), ok.lights.filter((l) => l.real).length + 1, 'the hero light counts');
	assert.equal(I.lightBudget(I.compile({ ...TINY, heroLight: false }, {})), ok.lights.filter((l) => l.real).length);
});

test('there is at least one interior map', () => {
	assert.ok(modules.length >= 1, 'no interior plan in src/env/act1/maps/');
	console.log(`  interior maps: ${modules.map((m) => m.mod.PLAN.id).join(', ')}`);
});

for (const { file, mod } of modules) {
	const { PLAN, KIT } = mod;
	const t0 = performance.now();
	const model = I.compile(PLAN, KIT);
	const compileMs = performance.now() - t0;

	test(`${PLAN.id}: compiles and validates without errors`, () => {
		const issues = I.validate(model);
		for (const w of issues.filter((i) => i.level === 'warn')) console.log(`  warn: ${w.msg}`);
		const errors = issues.filter((i) => i.level === 'error');
		assert.deepEqual(errors.map((e) => e.msg), [], `${file}: ${errors.length} plan errors`);
		const [x0, z0, x1, z1] = model.bounds;
		console.log(`  ${file}: ${x1 - x0} × ${z1 - z0} m, raster ${model.raster.nx} × ${model.raster.nz}, ${model.rooms.length} rooms, ${model.runs.length} wall runs, ${model.voids.length} void edges, ${model.placements.length} placements, ${model.blockers.length} blockers, ${model.lights.length} lights (${model.lights.filter((l) => l.real).length} real), compile ${compileMs.toFixed(0)} ms`);
	});

	test(`${PLAN.id}: floor heights, distances and masks are finite (no NaN) over the whole raster`, () => {
		const masks = model.makeMasks(I.smoothParams(0.8));
		const out = new Float32Array(8);
		const [x0, z0, x1, z1] = model.bounds;
		let n = 0;
		for (let z = z0 - model.apron; z <= z1 + model.apron; z += 0.73) {
			for (let x = x0 - model.apron; x <= x1 + model.apron; x += 0.73) {
				const y = model.floorY(x, z);
				const d = model.wallDistance(x, z);
				assert.ok(Number.isFinite(y) && Number.isFinite(d), `(${x.toFixed(2)}, ${z.toFixed(2)}): y ${y}, d ${d}`);
				out.fill(0);
				masks(x, z, out);
				for (let k = 0; k < 8; k++) assert.ok(out[k] >= 0 && out[k] <= 1, `mask ${k} = ${out[k]} at (${x.toFixed(2)}, ${z.toFixed(2)})`);
				n++;
			}
		}
		assert.ok(model.plan.floor.layers.length >= 2 && model.plan.floor.layers.length <= 8);
		console.log(`  ${n} samples`);
	});

	test(`${PLAN.id}: every spawn is on the floor with ≥ 0.35 m clearance and reaches every other spawn`, () => {
		for (const s of model.segments) {
			assert.ok(model.walkable(s.spawn[0], s.spawn[1]), `spawn ${s.id} is not on the floor`);
			assert.ok(model.clearance(s.spawn[0], s.spawn[1]) >= 0.35, `spawn ${s.id}: clearance ${model.clearance(s.spawn[0], s.spawn[1]).toFixed(2)}`);
			const f = model.flood(s.spawn[0], s.spawn[1], 0.35, 0.3);
			assert.ok(f.ok, `spawn ${s.id}: flood fill cannot start`);
			for (const o of model.segments) assert.ok(f.reach(o.spawn[0], o.spawn[1]), `${s.id} does not reach ${o.id}`);
			console.log(`  ${s.id}: ${f.cells} free 0.25 m cells reached`);
		}
	});

	test(`${PLAN.id}: the main route keeps 0.35 m clear, is ≥ 1.8 m wide, climbs only walkable steps and stays reachable`, () => {
		const samples = model.routeSamples(0.5);
		assert.ok(samples.length > 4, 'no route');
		const f = model.flood(model.segments[0].spawn[0], model.segments[0].spawn[1], 0.35, 0.3);
		let minW = Infinity;
		let minAt = null;
		let worst = 0;
		samples.forEach(([x, z], i) => {
			assert.ok(model.clearance(x, z) >= 0.35, `route (${x.toFixed(2)}, ${z.toFixed(2)}): clearance ${model.clearance(x, z).toFixed(2)}`);
			assert.ok(f.reach(x, z), `route (${x.toFixed(2)}, ${z.toFixed(2)}) is not reachable from the first spawn`);
			const a = samples[Math.max(0, i - 2)];
			const b = samples[Math.min(samples.length - 1, i + 2)];
			const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
			const w = model.freeWidth(x, z, (b[0] - a[0]) / l, (b[1] - a[1]) / l);
			if (w < minW) {
				minW = w;
				minAt = [x, z];
			}
			if (i) {
				const [px, pz] = samples[i - 1];
				const step = Math.abs(model.floorY(x, z) - model.floorY(px, pz));
				const onStair = model.stairAt(x, z) || model.stairAt(px, pz);
				assert.ok(step <= (onStair ? 0.4 : 0.3), `step ${step.toFixed(2)} m at (${x.toFixed(2)}, ${z.toFixed(2)})`);
				worst = Math.max(worst, step);
			}
		});
		assert.ok(minW >= 1.8, `min free width ${minW.toFixed(2)} m at (${minAt.map((v) => v.toFixed(1))})`);
		console.log(`  ${samples.length} route samples, min free width ${minW.toFixed(2)} m at (${minAt.map((v) => v.toFixed(1))}), worst step ${worst.toFixed(2)} m per 0.5 m`);
	});

	test(`${PLAN.id}: the Play nav grid (128 m round a spawn) covers the route from at least one spawn`, () => {
		for (const [x, z] of model.routeSamples(1)) {
			const covered = model.segments.some((s) => Math.abs(x - s.spawn[0]) < 63 && Math.abs(z - s.spawn[1]) < 63);
			assert.ok(covered, `route (${x.toFixed(1)}, ${z.toFixed(1)}) is outside every spawn's 128 m grid`);
		}
		const first = model.segments[0];
		const all = model.routeSamples(1).every(([x, z]) => Math.abs(x - first.spawn[0]) < 63 && Math.abs(z - first.spawn[1]) < 63);
		console.log(`  the first spawn (${first.id}) covers the whole route: ${all}`);
	});

	test(`${PLAN.id}: stairs and wall runs are consistent (openings on runs, pieces cover each run)`, () => {
		for (const s of model.stairs) {
			assert.ok(s.rise <= 0.2 + 1e-9 && s.rise / s.run <= 0.55 + 1e-9, `stair ${s.id}: rise ${s.rise}, run ${s.run}`);
			assert.ok(Math.abs(model.floorY(...(s.up === 'e' ? [s.rect[2] - 0.01, (s.rect[1] + s.rect[3]) / 2] : [(s.rect[0] + s.rect[2]) / 2, s.rect[1] + 0.01])) - (s.y1 - s.rise)) < 1e-6 || s.up !== 'e', `stair ${s.id}: the top tread`);
		}
		for (const r of model.runs) {
			assert.ok(r.len > 0 && Number.isFinite(r.y0) && r.y1 > r.y0, `run ${r.id}`);
			const pieces = I.runPieces(r);
			for (const p of pieces) assert.ok(p.t0 >= -1e-6 && p.t1 <= r.len + 1e-6 && p.y1 > p.y0, `run ${r.id}: piece ${p.kind} ${p.t0}..${p.t1}`);
			const solid = pieces.filter((p) => p.kind === 'solid').reduce((a, p) => a + p.t1 - p.t0, 0);
			const open = r.openings.reduce((a, o) => a + o.t1 - o.t0, 0);
			assert.ok(solid + open <= r.len + 1e-3, `run ${r.id}: solid ${solid} + openings ${open} > ${r.len}`);
		}
		for (const o of model.openings) assert.ok(o.run, `opening ${o.id} is on no run`);
	});

	test(`${PLAN.id}: SPEC §6b exports (ASSETS, MONSTERS, NPCS, TEXTURES, VFX) are complete and agree with the plan`, () => {
		const { ASSETS, MONSTERS, NPCS, TEXTURES, VFX } = mod;
		assert.ok(Array.isArray(ASSETS) && Array.isArray(MONSTERS) && Array.isArray(NPCS) && Array.isArray(TEXTURES) && Array.isArray(VFX));
		const counts = I.countPlacements(PLAN, KIT);
		for (const a of ASSETS) {
			for (const k of ['id', 'name', 'category', 'size', 'count', 'status', 'source', 'segment', 'note']) assert.ok(k in a, `asset ${a.id}: missing ${k}`);
			assert.ok(STATUS.has(a.status), `asset ${a.id}: status ${a.status}`);
			assert.ok(Array.isArray(a.size) && a.size.length === 3 && a.size.every((v) => v > 0), `asset ${a.id}: size`);
			assert.equal(a.count, counts[a.id]?.count ?? 0, `asset ${a.id}: count`);
			if (!a.count) assert.ok(KIT[a.id].unplaced, `asset ${a.id} has no placement and no reason`);
		}
		for (const id of Object.keys(counts)) assert.ok(KIT[id], `placed asset ${id} is not in KIT`);
		for (const m of MONSTERS) for (const k of ['id', 'name', 'segment', 'count', 'note']) assert.ok(k in m, `monster ${m.id}: ${k}`);
		for (const n of NPCS) for (const k of ['name', 'segment', 'note']) assert.ok(k in n, `npc ${n.name}: ${k}`);
		for (const t of TEXTURES) assert.ok('id' in t && 'have' in t && 'note' in t, `texture ${t.id}`);
		for (const v of VFX) assert.ok('id' in v && 'have' in v && 'note' in v, `vfx ${v.id}`);
		for (const l of PLAN.floor.layers) assert.ok(TEXTURES.some((t) => t.id === l.id && t.have), `floor layer ${l.id} is not reported in TEXTURES`);
		for (const c of PLAN.camps ?? []) assert.ok(MONSTERS.some((m) => m.id === c.id), `camp ${c.id} is not in MONSTERS`);
		const by = ASSETS.reduce((acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc), {});
		console.log(`  ${ASSETS.length} assets (${Object.entries(by).map(([k, v]) => `${v} ${k}`).join(', ')}), ${MONSTERS.length} monsters, ${NPCS.length} NPCs, ${TEXTURES.filter((t) => !t.have).length} textures missing, ${VFX.filter((v) => v.have !== true).length} VFX placeholders / missing`);
	});

	test(`${PLAN.id}: every KIT model, 'glb' entry and wall module is a registered sample with its file; an Act I GLB asset has its model's size (±2 cm)`, () => {
		let n = 0;
		for (const [id, k] of Object.entries(KIT)) {
			const sample = k.model ?? (k.status === 'glb' && id.startsWith('glb:') ? id.slice(4) : null);
			if (k.status === 'glb') assert.ok(sample, `${id}: status glb without a model`);
			if (!sample) continue;
			const s = SAMPLES.get(sample);
			assert.ok(s, `${id}: model ${sample} is not in samples.json`);
			const file = path.join(root, 'assets', s.file);
			assert.ok(existsSync(file), `${id}: ${s.file} is missing`);
			if (k.model && k.status !== 'kit' && sample.startsWith('act1-')) {
				const real = glbSize(file);
				k.size.forEach((v, i) => assert.ok(Math.abs(v - real[i]) <= 0.02, `${id}: size[${i}] = ${v}, its GLB ${real[i].toFixed(3)} m`));
			}
			n++;
		}
		for (const r of PLAN.rooms) {
			for (const st of [r.wall, ...Object.values(r.wallSides ?? {})]) {
				if (!st?.module) continue;
				const s = SAMPLES.get(st.module);
				assert.ok(s && existsSync(path.join(root, 'assets', s.file)), `room ${r.id}: wall module ${st.module} is not a registered sample with a file`);
			}
		}
		console.log(`  ${n} KIT entries with a GLB, all registered`);
	});

	test(`${PLAN.id}: deterministic (two compiles agree)`, () => {
		const again = I.compile(PLAN, KIT);
		assert.equal(again.placements.length, model.placements.length);
		model.placements.forEach((p, i) => {
			const q = again.placements[i];
			assert.ok(p.asset === q.asset && p.x === q.x && p.z === q.z && p.y === q.y && p.yaw === q.yaw, `placement ${i}`);
		});
		let a = 0;
		let b = 0;
		for (let k = 0; k < model.raster.df.length; k += 7) {
			a += model.raster.df[k] * ((k % 13) + 1);
			b += again.raster.df[k] * ((k % 13) + 1);
		}
		assert.equal(a, b, 'distance field');
		const m1 = model.makeMasks(I.smoothParams(0.8));
		const m2 = again.makeMasks(I.smoothParams(0.8));
		const o1 = new Float32Array(8);
		const o2 = new Float32Array(8);
		for (let z = model.bounds[1]; z < model.bounds[3]; z += 3.1) for (let x = model.bounds[0]; x < model.bounds[2]; x += 3.1) {
			o1.fill(0);
			o2.fill(0);
			m1(x, z, o1);
			m2(x, z, o2);
			assert.deepEqual([...o1], [...o2]);
		}
	});
}

// ---- the Cradle's own rules (LD 11.12, SPEC §3 map 6) ------------------------------------------------------------------------------------------------
const cradle = modules.find((m) => m.mod.PLAN.id === 'cradle');
if (cradle) {
	const { PLAN, KIT, ASSETS } = cradle.mod;
	const model = I.compile(PLAN, KIT);
	const near = (v, want, tol) => Math.abs(v - want) <= tol * want;

	test('cradle: the A14 kit is at the concept sizes (H = 1.8 m) and every A14 asset is in the map', () => {
		const want = { 'A14.1': [3.5, 2, 2], 'A14.2': [2.4, 3, null], 'A14.3': [0.6, 1.2, 0.6], 'A14.4': [1.4, 1.8, null], 'A14.5': [3, 0.4, 3], 'A14.6': [3, 0.8, 1.6] };
		for (const [id, dims] of Object.entries(want)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d * H, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d * H}`));
		}
	});

	test('cradle: the Hospice Mother blockout matches the B05 sheet (crown 2.75H, hands 3.00H, h 2.50–3.00H)', () => {
		const parts = KIT.B05.shape;
		const top = Math.max(...parts.map((p) => p.at[1] + p.size[1] / 2));
		const hands = parts.filter((p) => p.cat === 'skin' && p.p === 'sphere');
		const span = Math.max(...hands.map((p) => p.at[0] + p.size[0] / 2)) - Math.min(...hands.map((p) => p.at[0] - p.size[0] / 2));
		assert.ok(near(top, 2.75 * H, 0.03), `crown ${top.toFixed(2)} m`);
		assert.ok(top >= 2.5 * H && top <= 3.0 * H, 'h within 2.50–3.00H');
		assert.ok(near(span, 3 * H, 0.08), `hand span ${span.toFixed(2)} m`);
		assert.ok(hands.length >= 10, `${hands.length} hands`);
		assert.equal(model.placements.filter((p) => p.asset === 'B05').length, 1);
		console.log(`  B05: crown ${top.toFixed(2)} m (${(top / H).toFixed(2)}H), hands ${span.toFixed(2)} m (${(span / H).toFixed(2)}H), ${hands.length} hands`);
	});

	test('cradle: all light is Perfection light (still), ten arena night-lights go out one by one from the far side, one shadow, ≤ 16 lights with the hero light', () => {
		assert.ok(model.lights.every((l) => l.kind === 'perfection'), 'a human or Wall light in the Cradle');
		const g = model.lightGroups.nightlight;
		assert.equal(g.count, 10);
		assert.equal(g.slider, 'Đèn ngủ còn lại');
		const lit = g.lights.map((i) => model.lights[i]);
		const keep = PLAN.lightGroups.nightlight.keepNear;
		const d = lit.map((l) => Math.hypot(l.x - keep[0], l.z - keep[1]));
		for (let i = 1; i < d.length; i++) assert.ok(d[i] >= d[i - 1] - 1e-9, 'order = distance to the entrance');
		assert.equal(model.lights.filter((l) => l.shadow).length, 1);
		assert.ok(I.lightBudget(model) <= 16, `${I.lightBudget(model)} point / spot lights incl. the hero light`);
		console.log(`  light budget: ${model.lights.filter((l) => l.real).length} plan lights + hero = ${I.lightBudget(model)}`);
	});

	test('cradle: the darkness closes in — the key light and the far glows follow the night-lights, the aisle stays lit', () => {
		const key = model.lights.find((l) => l.id === 'key');
		const beyond = model.lights.filter((l) => l.group === 'beyond');
		const aisle = model.lights.filter((l) => l.group === 'aisle');
		const night = model.lightGroups.nightlight.lights.map((i) => model.lights[i]);
		assert.ok(key.followGroup === 'nightlight' && beyond.length >= 8 && beyond.every((l) => l.followGroup === 'nightlight'));
		const at = (n) => ({ nightlight: n });
		assert.equal(I.lightTarget(model, key, at(10)), 1);
		assert.ok(Math.abs(I.lightTarget(model, key, at(1)) - (0.06 + 0.94 * 0.1)) < 1e-9, 'key at 1 / 10');
		assert.ok(Math.abs(I.lightTarget(model, key, at(0)) - 0.06) < 1e-9, 'key keeps its floor');
		assert.ok(model.lightGroups.nightlight.ambient > 0 && model.lightGroups.nightlight.ambient < 1, 'the scene lift follows the night-lights');
		for (const l of beyond) assert.ok(I.lightTarget(model, l, at(3)) < 0.4, 'far glows sink');
		for (const l of aisle) assert.equal(I.lightTarget(model, l, at(0)), 1, 'the aisle is not the boss\'s light');
		const on = (n) => night.filter((l) => I.lightTarget(model, l, at(n)) > 0).length;
		assert.deepEqual([on(10), on(3), on(1), on(0)], [10, 3, 1, 0]);
		const nearest = night.filter((l) => I.lightTarget(model, l, at(1)) > 0)[0];
		assert.equal(nearest.order, 0, 'the last light is the one nearest the entrance');
	});

	test('cradle: curtain posts are solid wooden props, only the drapes are walk-through linen', () => {
		const k = KIT['A14.2'];
		assert.equal(k.category, 'prop');
		for (const part of k.shape) {
			const cat = part.cat ?? k.category;
			if (part.p === 'drape') assert.equal(cat, 'linen');
			else assert.ok(!k.openCats.includes(cat) || part.cat === 'accent', `a ${part.p} part is walk-through (${cat})`);
		}
		const mouth = model.placements.find((p) => p.asset === 'A14.2' && Math.abs(p.x) < 1e-6);
		assert.ok(mouth.solid, 'the threshold curtain is solid');
		for (const s of [-1, 1]) assert.ok(model.clearance(s * 2.1, -2.6) < 0, 'its posts block');
		assert.ok(model.clearance(0, -2.6) > 0.9, 'the gap between the drapes is free');
		assert.ok(KIT['A14.4'].shape.filter((p) => p.open).length >= 10, 'the mobile\'s hanging bones are walk-through');
	});

	test('cradle: the aisle reads as rows of identical cribs that go on into the void past the floor', () => {
		const cribs = model.placements.filter((p) => p.asset === 'A14.1');
		const voidCribs = cribs.filter((p) => p.void);
		assert.ok(voidCribs.length >= 20, `${voidCribs.length} cribs in the void`);
		assert.ok(voidCribs.every((p) => model.wallDistance(p.x, p.z) < 0), 'a void crib stands on the floor');
		assert.ok(cribs.filter((p) => !p.void && p.z > 0).every((p) => Math.abs(Math.abs(p.x) - 7.15) < 1e-9 && p.yaw === 0), 'aisle cribs are identical and aligned');
		assert.ok(model.voids.length > 10 && model.runs.every((r) => r.room === 'well'), 'only the stair has walls; the aisle and the arena end in the void');
	});

	test('cradle: the boss, the adds and the telegraphs are placed in the arena', () => {
		const arena = model.byId.arena;
		const inArena = ([x, z]) => I.inPolygon(arena.pts, x, z);
		for (const c of model.camps) assert.ok(inArena(c.at), `camp ${c.id} outside the arena`);
		for (const id of ['P07', 'P01', 'P05', 'P03', 'B05']) assert.ok(model.camps.some((c) => c.id === id), `no ${id} camp`);
		const tele = model.markers.filter((m) => m.kind === 'telegraph');
		assert.ok(tele.length >= 6, `${tele.length} telegraph markers`);
		for (const t of tele) assert.ok(inArena(t.at) && model.walkable(t.at[0], t.at[1]), `telegraph at ${t.at}`);
	});
}

// ---- the Gentle House's own rules (LD 11.9, SPEC §3 map 4) -----------------------------------------------------------------------------------------
const gentle = modules.find((m) => m.mod.PLAN.id === 'gentleHouse');
if (gentle) {
	const { PLAN, KIT, ASSETS, MONSTERS, NPCS } = gentle.mod;
	const model = I.compile(PLAN, KIT);
	const near = (v, want, tol) => Math.abs(v - want) <= tol * want;
	const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
	const inRoom = (id, [x, z]) => I.inPolygon(model.byId[id].pts, x, z);

	test('gentleHouse: the A11 / A18 / A19 kit is at the concept sizes (H = 1.8 m) and every A11 and A19 asset is in the map', () => {
		const want = { 'A11.1': [3, 2.4, 1.2], 'A11.2': [0.6, 0.4, 1.2], 'A11.3': [2.4, 0.45, 0.8], 'A11.4': [2.4, 4, 2.4], 'A11.5': [2, 1.6, 1], 'A11.6': [0.5, 1.3, 0.5] };
		for (const [id, dims] of Object.entries(want)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => assert.ok(near(a.size[i], d * H, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d * H}`));
		}
		// the GLB assets keep the dimension their model was scaled on (the full size is checked against the GLB in the samples test)
		const metres = { 'A18.4': [30, 11, 9], 'A18.5': [6, null, null], 'A18.6': [4, 2, 5], 'A19.1': [null, 0.5, null], 'A19.2': [0.5, null, null], 'A19.3': [null, 1.2, null], 'A19.4': [null, 1.9, null], 'A19.5': [null, 1.8, null], 'A19.6': [2.4, null, null] };
		for (const [id, dims] of Object.entries(metres)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d}`));
			if (id.startsWith('A19')) assert.ok(a.count > 0, `${id} is not placed`);
		}
		const top = Math.max(...KIT['A11.4'].shape.map((p) => p.at[1] + p.size[1] / 2));
		assert.ok(near(top, 4 * H, 0.02), `gate tower top ${top.toFixed(2)} m`);
	});

	test('gentleHouse: no combat — no camps, no monsters, no encounter markers; NPC stand-ins are reported in NPCS, not as assets', () => {
		assert.equal(model.camps.length, 0);
		assert.equal(MONSTERS.length, 0);
		assert.ok(!model.markers.some((m) => m.kind === 'encounter' || m.kind === 'boss'), 'an encounter marker');
		for (const id of Object.keys(KIT).filter((k) => KIT[k].npc)) assert.ok(!ASSETS.some((a) => a.id === id), `${id} is listed as an asset`);
		for (const name of ['Mother Hawise', 'Poppy Sisters', 'Tamsin', 'sleepers']) assert.ok(NPCS.some((n) => n.name.includes(name)), `no NPC ${name}`);
		const sleepers = model.placements.filter((p) => p.asset === 'NPC.Sleeper');
		const beds = model.placements.filter((p) => p.asset === 'A11.2');
		assert.equal(sleepers.length, beds.length - 1, 'one bed (Fen\'s) is empty');
		for (const s of sleepers) assert.ok(beds.some((b) => Math.abs(b.x - s.x) < 1e-6 && Math.abs(b.z - s.z) < 1e-6 && b.yaw === s.yaw), 'every sleeper lies on a bed');
	});

	test('gentleHouse: the light grammar — all still (Perfection), identical candle stands, no red light, the high window glows brightest, one shadow, ≤ 16 lights with the hero light', () => {
		assert.ok(model.lights.every((l) => l.kind === 'perfection'), 'a flickering (human) or Wall light in the Gentle House');
		for (const l of model.lights) {
			const [r, g, b] = rgb(l.color);
			assert.ok(!(r > 0.5 && r > 1.8 * g && r > 1.8 * b), `light ${l.id} is red (${l.color})`);
		}
		const win = model.openings.find((o) => o.id === 'highWindow');
		const others = model.openings.filter((o) => o.kind === 'window' && o !== win).map((o) => o.glow?.intensity ?? 0);
		assert.ok(win.kind === 'window' && win.glow.intensity >= 3 * Math.max(...others), 'the high window glows brightest');
		const inner = model.lights.find((l) => l.id === 'window:highWindow');
		assert.ok(inner?.real && inRoom('parlour', [inner.x, inner.z]), 'the window lights the parlour');
		assert.ok(model.lights.some((l) => l.id === 'highWindowHalo' && !l.real && l.glow >= 3), 'a big still halo outside the window');
		const stands = model.lights.filter((l) => l.asset === 'A11.6');
		assert.ok(stands.length >= 12 && new Set(stands.map((l) => `${l.color}|${l.intensity}|${l.range}`)).size === 1, 'many identical candle stands');
		assert.equal(model.lights.filter((l) => l.shadow).length, 1);
		assert.ok(I.lightBudget(model) <= 16, `${I.lightBudget(model)} point / spot lights incl. the hero light`);
		console.log(`  light budget: ${model.lights.filter((l) => l.real).length} plan lights + hero = ${I.lightBudget(model)}; ${stands.length} candle stands`);
	});

	test('gentleHouse: the rain stops at the gate — the gate tower is the only way in, outside is wet and rained on, inside is dry', () => {
		const dry = (x, z) => PLAN.rain.dry.some(([a, b, c, d]) => x >= Math.min(a, c) && x <= Math.max(a, c) && z >= Math.min(b, d) && z <= Math.max(b, d));
		const spawn = (id) => model.segments.find((s) => s.id === id).spawn;
		for (const id of ['hill', 'gate']) assert.ok(!dry(...spawn(id)), `the ${id} spawn is dry`);
		for (const id of ['cloister', 'ward', 'parlour', 'refectory', 'stair']) assert.ok(dry(...spawn(id)), `the ${id} spawn is rained on`);
		assert.ok(dry(-9.6, 10.3), 'the gate passage is dry');
		const masks = model.makeMasks(I.smoothParams(0.8));
		const out = new Float32Array(8);
		masks(...spawn('hill'), out);
		assert.ok(out[7] > 0.5, 'the hill is wet');
		out.fill(0);
		masks(0, -3, out);
		assert.equal(out[7], 0, 'the garth is dry');
		const shut = I.compile({ ...PLAN, openings: PLAN.openings.filter((o) => o.id !== 'gate') }, KIT);
		assert.ok(!shut.flood(...spawn('hill'), 0.35, 0.3).reach(...spawn('cloister')), 'with the gate shut the cloister is cut off');
		assert.ok(model.flood(...spawn('hill'), 0.35, 0.3).reach(...spawn('cloister')), 'through the gate it is reached');
		assert.ok(model.byId.hill.outdoor && model.byId.forecourt.outdoor && !model.byId.ward.outdoor && !model.byId.garth.outdoor, 'outdoor rooms (the exterior roofs show from there)');
	});

	test('gentleHouse: the beats — Hawise\'s warm window (vision trigger), Tamsin behind a screen at Fen\'s empty bed, sister patrols with sight cones, the night stair down', () => {
		assert.ok(model.markers.some((m) => m.kind === 'vignette' && m.remember && inRoom('parlour', m.at)), 'the REMEMBER beat is in the parlour');
		assert.ok(model.markers.some((m) => /vision/i.test(m.label) && inRoom('parlour', m.at)), 'the vision trigger');
		for (const id of ['A19.2', 'A19.3']) assert.ok(model.placements.some((p) => p.asset === id && inRoom('parlour', [p.x, p.z])), `${id} in the parlour`);
		assert.ok(Math.abs(model.floorY(-16, -21) - 1.2) < 1e-9 && model.floorY(0, -18.6) === 0, 'the parlour stands seven steps above the ward');
		const tamsin = model.placements.find((p) => p.asset === 'NPC.Tamsin');
		assert.ok(inRoom('ward', [tamsin.x, tamsin.z]), 'Tamsin is in the ward');
		const screen = model.placements.find((p) => p.asset === 'A19.5' && Math.hypot(p.x - tamsin.x, p.z - tamsin.z) < 2);
		assert.ok(screen && screen.solid && screen.x < tamsin.x, 'a screen hides her from the door side');
		assert.ok(model.flood(tamsin.x, tamsin.z, 0.35, 0.3).reach(...model.segments.find((s) => s.id === 'gate').spawn), 'she can be walked out to the forecourt');
		const patrols = model.markers.filter((m) => m.kind === 'patrol');
		assert.ok(patrols.length >= 3 && patrols.every((m) => m.cone?.range > 0 && m.points.every(([x, z]) => model.walkable(x, z))), 'sister patrols on the floor, with sight cones');
		assert.ok(model.markers.find((m) => m.kind === 'escort')?.points.every(([x, z]) => model.walkable(x, z)), 'the way out for Tamsin');
		const exit = model.markers.find((m) => m.kind === 'exit' && /Garden of Hush/.test(m.label));
		assert.ok(exit && model.floorY(...exit.at) <= -2.9 && model.walkable(...exit.at), 'the night stair leads down to the Garden of Hush');
		const roofs = Object.entries(KIT).filter(([, k]) => k.roof);
		assert.ok(roofs.length >= 3 && model.placements.filter((p) => KIT[p.asset].roof).every((p) => !p.solid), 'exterior roofs never block');
	});
}

// ---- the Garden of Hush's own rules (LD 11.11, SPEC §3 map 5) ----------------------------------------------------------------------------------------
const garden = modules.find((m) => m.mod.PLAN.id === 'gardenOfHush');
if (garden) {
	const { PLAN, KIT, ASSETS, NPCS } = garden.mod;
	const model = I.compile(PLAN, KIT);
	const near = (v, want, tol) => Math.abs(v - want) <= tol * want;
	const SLEEPERS = ['A20.1', 'A20.2', 'A20.3', 'A20.4'];

	test('gardenOfHush: the A13 / A20 kit is at the concept sizes (H = 1.8 m) and every A13 and A20 asset is in the map', () => {
		const want = { 'A13.2': [3.5, 2.4, 2.4], 'A13.3': [0.35, 0.45, 0.35], 'A13.4': [0.9, 2, null], 'A13.5': [3, 2.8, 1], 'A13.6': [2.4, 0.7, 0.9], 'A08.6': [2.4, 2, null] };
		for (const [id, dims] of Object.entries(want)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d * H, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d * H}`));
		}
		for (const id of ['A13.1', ...SLEEPERS, 'A20.5', 'A20.6']) assert.ok(ASSETS.find((x) => x.id === id)?.count > 0, `${id} missing`);
		for (const id of SLEEPERS) assert.ok(near(KIT[id].size[2], 2.1, 0.1) && KIT[id].shape.some((p) => p.cat === 'accent'), `${id}: L ≈ 1H with its poppy`);
	});

	test('gardenOfHush: every sleeper has its pink night-light by the head; each row is a different mix of people', () => {
		const jars = model.placements.filter((p) => p.asset === 'A13.3');
		const people = model.placements.filter((p) => SLEEPERS.includes(p.asset) || p.asset === 'N-GD02');
		assert.ok(people.length >= 100, `${people.length} sleepers`);
		for (const p of people) {
			const head = [p.x - Math.sin(p.yaw) * 0.8 * p.scale, p.z - Math.cos(p.yaw) * 0.8 * p.scale];
			assert.ok(jars.some((j) => j.void === p.void && Math.hypot(j.x - head[0], j.z - head[1]) < 2.2), `sleeper ${p.asset} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) has no night-light by its head`);
		}
		const rows = new Map();
		for (const p of people) rows.set(`${p.z.toFixed(1)}|${p.scale}`, [...(rows.get(`${p.z.toFixed(1)}|${p.scale}`) ?? []), p.asset]);
		const mixes = new Set([...rows.values()].map((list) => list.slice(0, 6).join(',')));
		assert.ok(rows.size >= 8 && mixes.size === rows.size, `${rows.size} rows, ${mixes.size} different mixes`);
		console.log(`  ${people.length} sleepers in ${rows.size} rows (${people.filter((p) => p.void).length} in the void), ${jars.length} night-lights (${model.lights.filter((l) => l.asset === 'A13.3' && l.real).length} real)`);
	});

	test('gardenOfHush: the light grammar — pink night-lights still, one warm flickering place (the breath room), the lamp ahead white and still, one shadow, ≤ 16 lights with the hero light', () => {
		const breath = model.byId.breath;
		const human = model.lights.filter((l) => l.kind === 'human');
		assert.ok(human.length >= 1 && human.every((l) => I.inPolygon(breath.pts, l.x, l.z)), 'a human (warm, flickering) light outside the breath room');
		const night = model.lights.filter((l) => l.asset === 'A13.3');
		assert.ok(night.length >= 100 && night.every((l) => l.kind === 'perfection' && l.color === night[0].color), 'night-lights are identical still Perfection lights');
		const ahead = model.lights.filter((l) => l.asset === 'N-GD04');
		assert.equal(ahead.length, 1, 'one lamp ahead');
		assert.ok(ahead[0].kind !== 'human' && ahead[0].kind !== 'wall' && I.inPolygon(model.byId.corridor.pts, ahead[0].x, ahead[0].z), 'the lamp ahead is still and stands on the right way out of the deep rows');
		assert.equal(model.lights.filter((l) => l.shadow).length, 1);
		assert.ok(I.lightBudget(model) <= 16, `${I.lightBudget(model)} point / spot lights incl. the hero light`);
		console.log(`  light budget: ${model.lights.filter((l) => l.real).length} plan lights + hero = ${I.lightBudget(model)}`);
	});

	test('gardenOfHush: the hush bells (signature mechanic) stand over the rows and call Poppy Nurses from walkable doors', () => {
		const bells = model.markers.filter((m) => m.kind === 'bell');
		const posts = model.placements.filter((p) => p.asset === 'A13.4');
		assert.ok(bells.length >= 6 && bells.length === posts.length, `${bells.length} bell markers, ${posts.length} posts`);
		for (const b of bells) {
			assert.ok(b.r >= 4 && b.calls?.length >= 1, `bell at ${b.at}`);
			for (const c of b.calls) assert.ok(model.walkable(c[0], c[1]), `a Nurse door at (${c}) is off the floor`);
			const sleepers = model.placements.filter((p) => SLEEPERS.includes(p.asset) && !p.void && Math.hypot(p.x - b.at[0], p.z - b.at[1]) <= b.r);
			assert.ok(sleepers.length >= 4, `bell at ${b.at}: ${sleepers.length} sleepers within its noise radius`);
		}
	});

	test('gardenOfHush: encounters, NPCs, beats, exits — F02 · P01 · P03 · P05 · P06 · W07; Fen and Tamsin in the breath room; ≥ 3 vignettes (one unmarked); Gentle House in, Cradle out', () => {
		for (const id of ['F02', 'P01', 'P03', 'P05', 'P06', 'W07']) assert.ok(model.camps.some((c) => c.id === id), `no ${id} camp`);
		const breath = model.byId.breath;
		for (const name of ['Fen', 'Tamsin']) {
			assert.ok(NPCS.some((n) => n.name === name), `${name} not in NPCS`);
			assert.ok(model.markers.some((m) => m.kind === 'npc' && m.label.startsWith(name) && I.inPolygon(breath.pts, m.at[0], m.at[1])), `${name} spot not in the breath room`);
		}
		for (const id of Object.keys(KIT).filter((k) => KIT[k].npc)) assert.ok(!ASSETS.some((a) => a.id === id), `${id} is listed as an asset`);
		const vignettes = model.markers.filter((m) => m.kind === 'vignette');
		assert.ok(vignettes.length >= 3 && vignettes.some((m) => m.unmarked), `${vignettes.length} vignettes`);
		const exits = model.markers.filter((m) => m.kind === 'exit');
		assert.ok(exits.some((m) => /Gentle House/.test(m.label)) && exits.some((m) => /Cradle/.test(m.label)), 'exits to map 4 and map 6');
		const down = exits.find((m) => /Cradle/.test(m.label));
		assert.ok(model.walkable(...down.at) && model.floorY(...down.at) < model.floorY(...PLAN.segments[0].spawn) - 7, 'the way only goes down');
		assert.ok(model.voids.some((v) => v.room === 'deep'), 'the deep rows run on into the void');
		for (const w of model.waters) assert.ok(model.waterDepth((w.pts[0][0] + w.pts[2][0]) / 2, (w.pts[0][1] + w.pts[2][1]) / 2) > 0.2, `channel ${w.id} holds water`);
	});
}

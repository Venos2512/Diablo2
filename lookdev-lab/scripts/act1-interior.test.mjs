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
/** The positions (xyz) and triangle indices of a prepared GLB's one mesh (the BIN chunk follows the JSON chunk). */
function glbMesh(file) {
	const buf = readFileSync(file);
	const jsonLen = buf.readUInt32LE(12);
	const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
	const bin = 20 + jsonLen + 8;
	const prim = json.meshes[0].primitives[0];
	const read = (ai, comps) => {
		const acc = json.accessors[ai];
		const bv = json.bufferViews[acc.bufferView];
		const size = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[acc.componentType];
		const stride = bv.byteStride ?? size * comps;
		const base = bin + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
		const out = acc.componentType === 5126 ? new Float32Array(acc.count * comps) : new Uint32Array(acc.count * comps);
		for (let i = 0; i < acc.count; i++) {
			for (let c = 0; c < comps; c++) {
				const o = base + i * stride + c * size;
				out[i * comps + c] = acc.componentType === 5126 ? buf.readFloatLE(o) : size === 1 ? buf.readUInt8(o) : size === 2 ? buf.readUInt16LE(o) : buf.readUInt32LE(o);
			}
		}
		return out;
	};
	return { positions: read(prim.attributes.POSITION, 3), index: prim.indices === undefined ? null : read(prim.indices, 1) };
}
/** Points spread over each listed triangle (a barycentric grid of `k` steps per edge), as [x, y, z] arrays. */
function trianglePoints(positions, index, k = 6) {
	const out = [];
	for (let t = 0; t + 2 < index.length; t += 3) {
		const [a, b, c] = [index[t], index[t + 1], index[t + 2]].map((v) => [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]]);
		for (let i = 0; i <= k; i++) for (let j = 0; i + j <= k; j++) out.push([0, 1, 2].map((q) => a[q] + ((b[q] - a[q]) * i) / k + ((c[q] - a[q]) * j) / k));
	}
	return out;
}
/** Distance (m, xz) from a point to a rect [x0, z0, x1, z1]. */
const rectDistance = ([x, , z], [x0, z0, x1, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));
/** The A21–A25 swap of a map: every listed KIT id is on its act1-kit GLB (a registered sample whose file exists), placed, reported as 'glb', and its KIT size is the GLB's (±2 cm). Returns the GLB meshes by KIT id. */
function checkA2x(KIT, ASSETS, swapped) {
	const meshes = {};
	for (const [id, sample] of Object.entries(swapped)) {
		assert.equal(KIT[id]?.model, sample, `${id} model`);
		const s = SAMPLES.get(sample);
		assert.ok(s && s.file.startsWith('act1-kit/'), `${id}: ${sample} is a registered act1-kit sample`);
		const file = path.join(root, 'assets', s.file);
		assert.ok(existsSync(file), `${id}: ${s.file} is missing`);
		const a = ASSETS.find((x) => x.id === id);
		assert.ok(a?.status === 'glb' && a.count > 0, `${id}: reported as glb and placed`);
		glbSize(file).forEach((v, i) => assert.ok(Math.abs(KIT[id].size[i] - v) <= 0.02, `${id}: size[${i}] ${KIT[id].size[i]} vs its GLB ${v.toFixed(3)} m`));
		meshes[id] = glbMesh(file);
	}
	return meshes;
}
/** A point of a placement's asset frame (x, z before its yaw and scale) in world x / z. */
const toWorld = (p, lx, lz) => [p.x + (lx * Math.cos(p.yaw) + lz * Math.sin(p.yaw)) * p.scale, p.z + (lz * Math.cos(p.yaw) - lx * Math.sin(p.yaw)) * p.scale];
/** A world point in a placement's asset frame (the inverse of toWorld). */
const toLocal = (p, x, z) => {
	const dx = (x - p.x) / p.scale;
	const dz = (z - p.z) / p.scale;
	return [dx * Math.cos(p.yaw) - dz * Math.sin(p.yaw), dx * Math.sin(p.yaw) + dz * Math.cos(p.yaw)];
};

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

test('engine: a KIT light (offset, y) turns and scales with its placement: on a stand at ×1.5 turned 90°, it stays on the flame', () => {
	const kit = { stand: { size: [0.6, 2.3, 0.6], light: { kind: 'human', y: 2.1, offset: [0.2, -0.1], range: 4, intensity: 3 } } };
	const m = I.compile({ ...TINY, structures: [{ asset: 'stand', at: [4, 3], yaw: 90, scale: 1.5 }, { asset: 'stand', at: [6, 3] }] }, kit);
	const [a, b] = ['stand#0', 'stand#1'].map((id) => m.lights.find((l) => l.id === id));
	// yaw +90°: local +x → world −z, local +z → world +x (three.js rotation.y); every local length × 1.5
	assert.ok(Math.abs(a.x - (4 - 0.1 * 1.5)) < 1e-9 && Math.abs(a.z - (3 - 0.2 * 1.5)) < 1e-9 && Math.abs(a.y - 2.1 * 1.5) < 1e-9, `scaled stand: ${a.x}, ${a.y}, ${a.z}`);
	assert.ok(Math.abs(b.x - 6.2) < 1e-9 && Math.abs(b.z - 2.9) < 1e-9 && Math.abs(b.y - 2.1) < 1e-9, `stand at ×1: ${b.x}, ${b.y}, ${b.z}`);
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
		// the GLB assets keep the dimension their model was scaled on (the full size is checked against the GLB in the samples test)
		const metres = { 'A14.1': [6.3, null, null], 'A14.2': [4.32, null, null], 'A14.3': [null, 2.16, null], 'A14.4': [null, 3.24, null], 'A14.5': [null, null, 5.4], 'A14.6': [5.4, null, null] };
		for (const [id, dims] of Object.entries(metres)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d}`));
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
		for (const b of k.blockers) assert.ok(model.clearance(mouth.x + b.at[0], mouth.z + b.at[1]) < 0, `its post at local (${b.at}) blocks`);
		assert.ok(model.clearance(0, -2.6) > 0.9, 'the gap between the drapes is free');
		assert.ok(k.model && k.collider > 1.7 && k.blockers.length === 2, 'the GLB collides on its two posts only (a collider): its drapes stay walk-through in Play');
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

	test('cradle: kit swap (A01–A14) — A14.1–A14.6 on their act1-kit GLBs; the night-lights stand clear of the 4.27 m cribs; Mercy\'s cradle sits on its rockers\' bars; the ring cribs keep the arena open', () => {
		const swapped = { 'A14.1': 'act1-a14-1-crib-frame', 'A14.2': 'act1-a14-2-curtain-pair', 'A14.3': 'act1-a14-3-milk-night-light', 'A14.4': 'act1-a14-4-bone-mobile', 'A14.5': 'act1-a14-5-quilted-platform', 'A14.6': 'act1-a14-6-rocker-runners' };
		for (const [id, sample] of Object.entries(swapped)) {
			assert.equal(KIT[id].model, sample, `${id} model`);
			assert.equal(ASSETS.find((a) => a.id === id).status, 'glb', `${id} status`);
		}
		// no night-light (its 0.73 m GLB foot) stands in a crib's footprint
		const cribs = model.placements.filter((p) => p.asset === 'A14.1').map((p) => ({ p, f: I.footprints(p, KIT['A14.1'])[0] }));
		const lamps = model.placements.filter((p) => p.asset === 'A14.3');
		const r = KIT['A14.3'].size[0] / 2;
		for (const l of lamps) {
			const ring = [[l.x, l.z], ...Array.from({ length: 12 }, (_, i) => [l.x + r * Math.cos((i / 12) * 2 * Math.PI), l.z + r * Math.sin((i / 12) * 2 * Math.PI)])];
			for (const { p, f } of cribs) assert.ok(!ring.some(([x, z]) => I.inPolygon(f.pts, x, z)), `night-light at (${l.x}, ${l.z}) stands in the crib at (${p.x.toFixed(2)}, ${p.z.toFixed(2)})`);
		}
		// Mercy's cradle: the crib GLB's floor (its lowest surface over the middle) rests on the runners' bars (their top), the curled ends rise past its ends
		const crib = glbMesh(path.join(root, 'assets', SAMPLES.get(KIT['A14.1'].model).file)).positions;
		const rock = glbMesh(path.join(root, 'assets', SAMPLES.get(KIT['A14.6'].model).file)).positions;
		let floor = Infinity;
		for (let i = 0; i < crib.length; i += 3) if (Math.abs(crib[i]) < 1 && Math.abs(crib[i + 2]) < 1 && crib[i + 1] > 0.3) floor = Math.min(floor, crib[i + 1]);
		let bar = 0;
		for (let i = 0; i < rock.length; i += 3) if (Math.abs(rock[i + 2]) < 0.8 && rock[i + 1] < 1.3) bar = Math.max(bar, rock[i + 1]); // the bars between the runners
		const mercy = model.placements.find((p) => p.asset === 'A14.1' && /Mercy/.test(p.name ?? ''));
		const runners = model.placements.find((p) => p.asset === 'A14.6' && /Mercy/.test(p.name ?? ''));
		assert.ok(mercy && runners && Math.hypot(mercy.x - runners.x, mercy.z - runners.z) < 1e-6, 'Mercy\'s cradle on its runners');
		const floorY = mercy.y + floor * mercy.scale;
		const barY = runners.y + bar * runners.scale;
		assert.ok(Math.abs(floorY - barY) < 0.04, `Mercy's cradle floor at ${floorY.toFixed(2)} m, the runners' bars at ${barY.toFixed(2)} m`);
		assert.ok(KIT['A14.6'].size[0] * runners.scale > KIT['A14.1'].size[0] * mercy.scale + 0.8, 'the curled runner ends rise past the cradle\'s ends');
		// the ring cribs reach ≤ 0.35 m inside the arena edge (r 16): the nearest point of each footprint edge to the arena centre
		const toSegment = ([px, pz], [ax, az], [bx, bz]) => {
			const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
			return Math.hypot(px - ax - t * (bx - ax), pz - az - t * (bz - az));
		};
		const ringCribs = cribs.filter(({ p }) => !p.void && Math.abs(Math.hypot(p.x, p.z + 18) - 17.85) < 0.01);
		assert.equal(ringCribs.length, 8, 'eight ring cribs round the arena');
		for (const { p, f } of ringCribs) {
			const inner = Math.min(...f.pts.map((a, i) => toSegment([0, -18], a, f.pts[(i + 1) % f.pts.length])));
			assert.ok(inner >= 16 - 0.35, `ring crib at (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) reaches ${(16 - inner).toFixed(2)} m into the arena`);
		}
		// only the curtains' posts and the mobile's stand collide in Play (the models' drapes and bones stay walk-through)
		for (const id of ['A14.2', 'A14.4', 'A14.3']) assert.ok(KIT[id].collider > 1.7 && (id === 'A14.3' || KIT[id].blockers.length <= 2), `${id}: a collider on its blockers only`);
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

	test('cradle: A21–A25 swap — the A24.5 quilt and the A24.6 pillow on their GLBs, lying on the A14.5 cushions (none pokes through them, they do not float), the pillow clear of the quilt, both on the platform and walk-through', () => {
		const m = checkA2x(KIT, ASSETS, { 'N-CR02': 'act1-a24-5-turned-down-quilt', 'N-CR03': 'act1-a24-6-linen-pillow' });
		const cell = 0.1;
		const grid = (g, pick) => {
			const out = new Map();
			for (const [x, y, z] of trianglePoints(g.positions, g.index, 5)) {
				const k = `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
				out.set(k, pick(out.get(k), y));
			}
			return out;
		};
		const platform = model.placements.find((p) => p.asset === 'A14.5');
		const cushions = grid(glbMesh(path.join(root, 'assets', SAMPLES.get(KIT['A14.5'].model).file)), (a, y) => Math.max(a ?? -9, y));
		for (const id of ['N-CR02', 'N-CR03']) {
			const p = model.placements.find((q) => q.asset === id);
			assert.ok(p && !p.solid && p.yaw === platform.yaw && p.scale === 1 && platform.scale === 1, `${id}: walk-through, turned as the platform`);
			const tops = grid(m[id], (a, y) => Math.max(a ?? -9, y));
			const unders = grid(m[id], (a, y) => Math.min(a ?? 9, y));
			const poke = [];
			const lift = [];
			for (const [k, top] of tops) {
				const [i, j] = k.split(',').map(Number);
				const key = `${Math.floor(((i + 0.5) * cell + p.x - platform.x) / cell)},${Math.floor(((j + 0.5) * cell + p.z - platform.z) / cell)}`;
				const c = cushions.get(key);
				assert.ok(c !== undefined, `${id}: its cell ${k} lies off the platform`);
				poke.push(platform.y + c - (p.y + top));
				lift.push(p.y + unders.get(k) - (platform.y + c));
			}
			assert.ok(Math.max(...poke) <= 0, `${id}: a cushion pokes ${Math.max(...poke).toFixed(3)} m through its top`);
			lift.sort((a, b) => a - b);
			const med = lift[lift.length >> 1];
			assert.ok(med >= -0.15 && med <= 0.05, `${id}: its underside rests on the cushions (median ${med.toFixed(3)} m)`);
		}
		const [quilt, pillow] = ['N-CR02', 'N-CR03'].map((id) => model.placements.find((q) => q.asset === id));
		const gap = quilt.z - KIT['N-CR02'].size[2] / 2 - (pillow.z + KIT['N-CR03'].size[2] / 2);
		assert.ok(gap >= 0.1 && Math.abs(pillow.x - quilt.x) < 0.01, `the pillow clear of the quilt's fold (${gap.toFixed(2)} m), on its axis`);
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
		const want = { 'A11.4': [2.4, 4, 2.4] }; // the blockouts keep the concept sizes
		for (const [id, dims] of Object.entries(want)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => assert.ok(near(a.size[i], d * H, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d * H}`));
		}
		// the GLB assets keep the dimension their model was scaled on (the full size is checked against the GLB in the samples test)
		const metres = {
			'A11.1': [5.4, null, null], 'A11.2': [null, null, 2.16], 'A11.3': [4.32, null, null], 'A11.5': [null, 2.88, null], 'A11.6': [null, 2.34, null],
			'A18.4': [30, 11, 9], 'A18.5': [6, null, null], 'A18.6': [4, 2, 5], 'A19.1': [null, 0.5, null], 'A19.2': [0.5, null, null], 'A19.3': [null, 1.2, null], 'A19.4': [null, 1.9, null], 'A19.5': [null, 1.8, null], 'A19.6': [2.4, null, null],
		};
		for (const [id, dims] of Object.entries(metres)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d}`));
			if (id.startsWith('A19') || id.startsWith('A11')) assert.ok(a.count > 0, `${id} is not placed`);
		}
		const top = Math.max(...KIT['A11.4'].shape.map((p) => p.at[1] + p.size[1] / 2));
		assert.ok(near(top, 4 * H, 0.02), `gate tower top ${top.toFixed(2)} m`);
	});

	test('gentleHouse: kit swap (A01–A14) — A11.1/.2/.3/.5/.6 on their act1-kit GLBs; A11.4 stays a blockout with its reason; the A11.3 tables at scale 0.68 without a second vase; the sleepers on the GLB mattresses', () => {
		const swapped = { 'A11.1': 'act1-a11-1-cloister-bay', 'A11.2': 'act1-a11-2-hospice-bed', 'A11.3': 'act1-a11-3-refectory-table', 'A11.5': 'act1-a11-5-kitchen-hearth', 'A11.6': 'act1-a11-6-candle-stand' };
		for (const [id, sample] of Object.entries(swapped)) {
			assert.equal(KIT[id].model, sample, `${id} model`);
			assert.equal(ASSETS.find((a) => a.id === id).status, 'glb', `${id} status`);
		}
		assert.ok(!KIT['A11.4'].model && KIT['A11.4'].status === 'blockout' && /no through passage/.test(KIT['A11.4'].note), 'A11.4 kept as a blockout, the reason in its note');
		const tables = model.placements.filter((p) => p.asset === 'A11.3');
		assert.ok(tables.length === 3 && tables.every((p) => p.scale === 0.68), 'the three tables at scale 0.68 (top 0.82 m)');
		for (const t of tables) assert.ok(!model.placements.some((p) => p.asset === 'A19.1' && Math.hypot(p.x - t.x, p.z - t.z) < 1.6), 'no A19.1 vase on a GLB table (it brings its own jug of flowers)');
		// the collider still covers the benches: ≥ 1.0 m above the floor at the placement scale
		assert.ok(KIT['A11.3'].collider * 0.68 >= 1.0 && KIT['A11.2'].collider >= 1.0 && KIT['A11.5'].collider >= 1.7, 'colliders over the low GLB furniture');
		const sleepers = model.placements.filter((p) => p.asset === 'NPC.Sleeper');
		assert.ok(sleepers.length > 0 && sleepers.every((p) => Math.abs(p.y - model.floorY(p.x, p.z) - 0.7) < 0.01), 'the sleepers lie on the GLB mattress (top 0.67 m)');
		// the candle stands' light (and glow) sits on the GLB flame
		const stand = model.lights.find((l) => l.asset === 'A11.6');
		const p = model.placements[stand.placement];
		assert.ok(Math.abs(stand.y - p.y - 2.24) < 0.01 && Math.hypot(stand.x - p.x, stand.z - p.z) < 0.08, 'the candle light on the GLB flame (0.04, 2.24, 0.06)');
		const flame = KIT['A11.6'].globe[0];
		assert.ok(flame.p === 'glow' && Math.abs(flame.at[1] - KIT['A11.6'].light.y) < 0.02 && Math.hypot(flame.at[0] - KIT['A11.6'].light.offset[0], flame.at[2] - KIT['A11.6'].light.offset[1]) < 0.01, 'the still flame (KIT globe) on the light');
		assert.equal(model.placements.filter((q) => q.asset === 'N-HS12').length, 0, 'the exterior lean-to roofs are gone (the GLB has its roof)');
	});

	test('gentleHouse: the cloister bays (A11.1 GLB, cut) keep the walks open — nothing in the hero band behind the piers, the walks run on ≥ 1.8 m wide, every arch lets the hero through', () => {
		const k = KIT['A11.1'];
		const { positions, index } = glbMesh(path.join(root, 'assets', SAMPLES.get(k.model).file));
		const kept = I.cutTriangles(positions, index, k.cut);
		assert.ok(kept.length / 3 > 0.9 * (index.length / 3), `the cut drops only the walls (${index.length / 3 - kept.length / 3} of ${index.length / 3} triangles)`);
		const band = trianglePoints(positions, kept).filter((q) => q[1] >= 0.35 && q[1] <= 1.7); // Play's walls: 0.35–1.7 m above the floor
		const rects = k.blockers.map((b) => b.rect);
		assert.ok(rects.length === 4 && rects.every(Boolean), 'four pier rects');
		const behind = band.filter((q) => q[2] < 0.28);
		assert.equal(behind.length, 0, `GLB surface left in the walk behind the piers: ${behind.slice(0, 3).map((q) => q.map((v) => v.toFixed(2)).join(',')).join(' · ')}`);
		const worst = Math.max(...band.map((q) => Math.min(...rects.map((r) => rectDistance(q, r)))));
		assert.ok(worst <= 0.1, `every hero-band surface of the cut GLB lies on a pier blocker (worst ${worst.toFixed(3)} m)`);
		for (const r of rects) assert.ok(band.some((q) => rectDistance(q, r) === 0), `pier ${r} has its geometry`);
		const bays = model.placements.filter((p) => p.asset === 'A11.1');
		assert.equal(bays.length, 12);
		let minWidth = Infinity;
		for (const p of bays) {
			const c = Math.cos(p.yaw);
			const s = Math.sin(p.yaw);
			const at = (lx, lz) => [p.x + lx * c + lz * s, p.z - lx * s + lz * c];
			// the three arches (between the pier rects, on the pier line): the hero (r 0.3) passes
			for (const ax of [-1.55, 0, 1.35]) {
				const [x, z] = at(ax, 0.7);
				assert.ok(model.clearance(x, z) >= 0.3, `arch at local x ${ax} of the bay at (${p.x}, ${p.z}): clearance ${model.clearance(x, z).toFixed(2)} m`);
			}
			// the walk behind the bay (its middle line, 1 m behind the pier line): ≥ 0.35 m clear and ≥ 1.8 m between the piers and the outer wall
			for (let lx = -2.7; lx <= 2.7 + 1e-6; lx += 0.3) {
				const [x, z] = at(lx, -0.65);
				assert.ok(model.clearance(x, z) >= 0.35, `walk behind the bay at (${p.x}, ${p.z}), local x ${lx.toFixed(1)}: clearance ${model.clearance(x, z).toFixed(2)} m`);
				minWidth = Math.min(minWidth, model.freeWidth(x, z, c, -s));
			}
		}
		assert.ok(minWidth >= 1.8, `the cloister walks are ≥ 1.8 m wide behind the arcades (min ${minWidth.toFixed(2)} m)`);
		console.log(`  A11.1 cut: ${kept.length / 3} of ${index.length / 3} triangles kept; walks ≥ ${minWidth.toFixed(2)} m wide; 36 arches pass`);
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
	test('gentleHouse: kit fix — the hospice beds read as single beds: the A11.2 GLB is 1.2 m wide (×0.7 on its width only, concept 1.08 m) and keeps its 2.16 m length, a sleeper fits on it, ≥ 1.4 m stays between the beds of a row', () => {
		const real = glbSize(path.join(root, 'assets', SAMPLES.get(KIT['A11.2'].model).file));
		assert.ok(real[0] > 1.1 && real[0] < 1.25 && Math.abs(real[2] - 2.16) < 0.01 && Math.abs(real[1] - 1.07) < 0.02, `the bed GLB ${real.map((v) => v.toFixed(2))}`);
		const sl = KIT['NPC.Sleeper'].size;
		assert.ok(sl[0] < real[0] - 0.3 && sl[2] < real[2] - 0.1, 'the sleeper fits on the narrower bed');
		const beds = model.placements.filter((p) => p.asset === 'A11.2');
		for (const z of new Set(beds.map((b) => b.z))) {
			const xs = beds.filter((b) => b.z === z).map((b) => b.x).sort((a, b) => a - b);
			for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] - KIT['A11.2'].size[0] >= 1.4, `beds at x ${xs[i - 1]} and ${xs[i]}: ${(xs[i] - xs[i - 1] - KIT['A11.2'].size[0]).toFixed(2)} m between them`);
		}
		const sleepers = model.placements.filter((p) => p.asset === 'NPC.Sleeper');
		assert.equal(sleepers.length, beds.length - 1);
		const ward = PLAN.segments.find((g) => g.id === 'ward'); // its spawn is in the aisle between the two rows
		const f = model.flood(ward.spawn[0], ward.spawn[1], 0.35, 0.3);
		// the aisle between the rows' foot ends: walkable past every bed (round the props that stand in it: the A19.5 at x 7, Tamsin)
		const [z0, z1] = [Math.min(...beds.map((p) => p.z)) + 1.2, Math.max(...beds.map((p) => p.z)) - 1.2];
		for (const bed of beds) {
			const across = Array.from({ length: Math.round((z1 - z0) / 0.25) + 1 }, (_, i) => z0 + i * 0.25);
			assert.ok(across.some((z) => f.reach(bed.x, z)), `the aisle at x ${bed.x.toFixed(2)} is walkable`);
		}
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

	test('gentleHouse: A21–A25 swap — N-HS02–08 on their A23 / A24 GLBs; the bread rack replaces the press stand-in, back on the wall; the drying-line blockers sit on the GLB posts; the poppy tea stands on the table\'s cloth', () => {
		const m = checkA2x(KIT, ASSETS, {
			'N-HS02': 'act1-a23-3-garth-flower-bed', 'N-HS03': 'act1-a23-4-potted-flowers', 'N-HS04': 'act1-a23-5-walled-flower-bed', 'N-HS05': 'act1-a23-6-drying-line',
			'N-HS06': 'act1-a24-1-kitchen-table', 'N-HS07': 'act1-a24-2-bread-rack', 'N-HS08': 'act1-a24-3-linen-folding-table',
		});
		assert.ok(!Object.values(KIT).some((k) => k.model === 'act1-a19-4-linen-press' && k !== KIT['A19.4']), 'no press stand-in left (only A19.4 itself)');
		// low furniture and beds: a collider prism over the top (Play's 0.6 m step would climb the kerbs and table tops)
		for (const id of ['N-HS02', 'N-HS03', 'N-HS04', 'N-HS06', 'N-HS07', 'N-HS08']) assert.ok(KIT[id].collider >= KIT[id].size[1] - 0.2, `${id}: collider ${KIT[id].collider} over its ${KIT[id].size[1]} m`);
		// the bread racks: back (GLB z min) on the kitchen's west face x 11.4, turned to face the room
		let back = Infinity;
		for (let i = 2; i < m['N-HS07'].positions.length; i += 3) back = Math.min(back, m['N-HS07'].positions[i]);
		const racks = model.placements.filter((p) => p.asset === 'N-HS07');
		assert.ok(racks.length === 2 && racks.every((p) => p.solid && Math.abs(toWorld(p, 0, back)[0] - 11.4) <= 0.02 && toWorld(p, 0, 1)[0] > p.x), 'both racks with their backs on the wall (x 11.4), loaves to the room');
		// the drying line: every post foot point of the GLB (below the sheets' 0.25 m hem) lies in a blocker, and each blocker holds a post
		const feet = trianglePoints(m['N-HS05'].positions, m['N-HS05'].index, 4).filter(([, y]) => y < 0.24);
		const B = KIT['N-HS05'].blockers;
		assert.ok(B.length === 2 && B.every((b) => feet.some(([x, , z]) => Math.hypot(x - b.at[0], z - b.at[1]) < b.r)), 'a post in each blocker');
		assert.ok(feet.every(([x, , z]) => B.some((b) => Math.hypot(x - b.at[0], z - b.at[1]) <= b.r)), 'every post foot point is in a blocker');
		// the poppy tea on the kitchen table: the GLB under the tray's footprint is the cloth (top 0.86–0.93 m, no bowl or loaf), the tray rests on it; no vase on the table
		const table = model.placements.find((p) => p.asset === 'N-HS06');
		const tray = model.placements.find((p) => p.asset === 'A19.2' && Math.hypot(p.x - table.x, p.z - table.z) < 1.3);
		assert.ok(tray, 'a tea tray on the kitchen table');
		const [tx, tz] = toLocal(table, tray.x, tray.z);
		const [hw, hd] = [KIT['A19.2'].size[0] / 2, KIT['A19.2'].size[2] / 2];
		const under = trianglePoints(m['N-HS06'].positions, m['N-HS06'].index, 6).filter(([x, , z]) => Math.abs(x - tx) <= hw && Math.abs(z - tz) <= hd).map(([, y]) => y);
		const top = Math.max(...under);
		assert.ok(under.length > 50 && top >= 0.86 && top <= 0.93, `the cloth under the tray (top ${top.toFixed(3)} m)`);
		assert.ok(Math.abs(tray.y - model.floorY(tray.x, tray.z) - top) <= 0.03, `the tray rests on the cloth (${(tray.y - model.floorY(tray.x, tray.z)).toFixed(2)} vs ${top.toFixed(3)} m)`);
		assert.ok(!model.placements.some((p) => p.asset === 'A19.1' && Math.hypot(p.x - table.x, p.z - table.z) < 1.3), 'no A19.1 vase on the A24.1 table (it brings its own bowls, bread and cloth)');
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
		const want = { 'A13.4': [0.9, 2, null] }; // the blockouts keep the concept sizes
		for (const [id, dims] of Object.entries(want)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d * H, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d * H}`));
		}
		// the GLB assets keep the dimension their model was scaled on (the full size is checked against the GLB in the samples test)
		const metres = { 'A13.1': [null, null, 2.7], 'A13.2': [6.3, null, null], 'A13.3': [null, 0.81, null], 'A13.5': [5.4, null, null], 'A13.6': [4.32, null, null], 'A08.6': [3.6, null, null], 'A11.6': [null, 2.34, null] };
		for (const [id, dims] of Object.entries(metres)) {
			const a = ASSETS.find((x) => x.id === id);
			assert.ok(a && a.count > 0, `${id} missing`);
			dims.forEach((d, i) => d !== null && assert.ok(near(a.size[i], d, 0.01), `${id} size[${i}] = ${a.size[i]}, want ${d}`));
		}
		for (const id of ['A13.1', ...SLEEPERS, 'A20.5', 'A20.6']) assert.ok(ASSETS.find((x) => x.id === id)?.count > 0, `${id} missing`);
		for (const id of SLEEPERS) assert.ok(near(KIT[id].size[2], 2.1, 0.1) && KIT[id].shape.some((p) => p.cat === 'accent'), `${id}: L ≈ 1H with its poppy`);
	});

	test('gardenOfHush: kit swap (A01–A14) — A13.1/.2/.3/.5/.6, A08.6 and A11.6 on their act1-kit GLBs, A13.4 a blockout with its reason; sleepers on the GLB beds; racks and wall bays clear of walls and channels', () => {
		const swapped = { 'A13.1': 'act1-a13-1-bed-furrow', 'A13.2': 'act1-a13-2-canopy-frame', 'A13.3': 'act1-a13-3-night-light-jar', 'A13.5': 'act1-a13-5-root-wall-bay', 'A13.6': 'act1-a13-6-poppy-furrow', 'A08.6': 'act1-a08-6-poppy-rack', 'A11.6': 'act1-a11-6-candle-stand' };
		for (const [id, sample] of Object.entries(swapped)) {
			assert.equal(KIT[id].model, sample, `${id} model`);
			assert.equal(ASSETS.find((a) => a.id === id).status, 'glb', `${id} status`);
		}
		assert.ok(!KIT['A13.4'].model && KIT['A13.4'].status === 'blockout' && /cross/.test(KIT['A13.4'].note), 'A13.4 kept as a blockout (cross-like post), the reason in its note');
		// every GLB sleeper on an A13.1 bed lies on its linen (base 0.42 m up) and its soil mound hangs over the 1.16 m bed by ≤ 0.1 m a side
		const beds = model.placements.filter((p) => p.asset === 'A13.1');
		let onBeds = 0;
		for (const s of model.placements.filter((p) => SLEEPERS.includes(p.asset))) {
			const bed = beds.find((b) => Math.abs(b.x - s.x) < 0.1 && Math.abs(b.z - s.z) < 0.1 && b.void === s.void);
			if (!bed) continue;
			onBeds++;
			assert.ok(Math.abs(s.y - bed.y - 0.42) < 0.01, `${s.asset} at (${s.x}, ${s.z}) lies ${(s.y - bed.y).toFixed(2)} m over its bed`);
			assert.ok(KIT[s.asset].size[0] * s.scale <= KIT['A13.1'].size[0] + 0.2 + 1e-6, `${s.asset} at (${s.x}, ${s.z}): mound ${(KIT[s.asset].size[0] * s.scale).toFixed(2)} m on a ${KIT['A13.1'].size[0]} m bed`);
		}
		assert.ok(onBeds >= 60, `${onBeds} GLB sleepers on beds (the hall rows, the breath room, the first sleeper; the deep rows lie in open earth)`);
		// the drying racks (scale 1.1): their footprint stays on the floor (≤ 0.1 m into a wall) and out of the sunk channels
		for (const p of model.placements.filter((q) => q.asset === 'A08.6')) {
			assert.equal(p.scale, 1.1);
			for (const f of I.footprints(p, { ...KIT['A08.6'], blockers: null })) {
				for (const [x, z] of f.pts) {
					assert.ok(model.wallDistance(x, z) > -0.1, `rack at (${p.x}, ${p.z}): corner (${x.toFixed(2)}, ${z.toFixed(2)}) ${(-model.wallDistance(x, z)).toFixed(2)} m into a wall`);
					assert.ok(Math.abs(model.floorY(x, z) - p.y) < 0.01, `rack at (${p.x}, ${p.z}): corner over a channel or step`);
				}
			}
		}
		// the root-vaulted bays: the GLB's invented mud-dome back (QA) inside the earth wall, the niche's face on the floor
		for (const p of model.placements.filter((q) => q.asset === 'A13.5')) {
			const c = Math.cos(p.yaw);
			const s = Math.sin(p.yaw);
			const d = KIT['A13.5'].size[2] / 2;
			const [bx, bz] = [p.x - d * s, p.z - d * c];
			const [fx, fz] = [p.x + d * s, p.z + d * c];
			assert.ok(model.wallDistance(bx, bz) < 0, `bay at (${p.x}, ${p.z}): its back (${bx.toFixed(2)}, ${bz.toFixed(2)}) shows on the floor`);
			assert.ok(model.wallDistance(fx, fz) > 0, `bay at (${p.x}, ${p.z}): its face is off the floor`);
		}
	});

	test('gardenOfHush: the canopies stay walk-through (only the leaning GLB posts block) and the night-lights and candles glow on their models (light, halo and KIT globe on the GLB glass or flame)', () => {
		const posts = KIT['A13.2'].blockers.map((b) => b.rect);
		let checked = 0;
		for (const p of model.placements.filter((q) => q.asset === 'A13.2')) {
			const c = Math.cos(p.yaw);
			const s = Math.sin(p.yaw);
			const at = (lx, lz) => [p.x + (lx * c + lz * s) * p.scale, p.z + (-lx * s + lz * c) * p.scale];
			for (const r of posts) {
				const [x, z] = at((r[0] + r[2]) / 2, (r[1] + r[3]) / 2);
				assert.ok(model.clearance(x, z) < 0, `canopy at (${p.x}, ${p.z}): its post at (${x.toFixed(2)}, ${z.toFixed(2)}) does not block`);
			}
			// under the canvas, past the bed ends (feet and heads), between the posts: walkable
			for (const lz of [-1.95, 1.95]) {
				for (const lx of [-1.5, 0, 1.5]) {
					const [x, z] = at(lx, lz);
					assert.ok(model.clearance(x, z) >= 0.3, `canopy at (${p.x}, ${p.z}): under its canvas at local (${lx}, ${lz}) clearance ${model.clearance(x, z).toFixed(2)} m`);
					checked++;
				}
			}
		}
		assert.ok(checked >= 30, `${checked} points under the canvases`);
		// the globes: a glow part over the GLB's glass (jar) or flame (candle), at the light's point, as big as the glass at that height
		for (const [id, file] of [['A13.3', 'act1-a13-3-night-light-jar'], ['A11.6', 'act1-a11-6-candle-stand']]) {
			const k = KIT[id];
			const g = k.globe?.[0];
			assert.ok(g?.p === 'glow' && Math.abs(g.at[1] - k.light.y) < 0.02 && Math.hypot(g.at[0] - (k.light.offset?.[0] ?? 0), g.at[2] - (k.light.offset?.[1] ?? 0)) < 0.01, `${id}: the KIT globe sits on its light`);
			const { positions } = glbMesh(path.join(root, 'assets', SAMPLES.get(file).file));
			let rmax = 0;
			for (let i = 0; i < positions.length; i += 3) if (Math.abs(positions[i + 1] - g.at[1]) < 0.03) rmax = Math.max(rmax, Math.hypot(positions[i] - g.at[0], positions[i + 2] - g.at[2]));
			assert.ok(Math.abs(g.size[0] / 2 - rmax) < 0.05, `${id}: globe r ${(g.size[0] / 2).toFixed(3)} vs the GLB's ${rmax.toFixed(3)} m at its height`);
		}
		const jarLights = model.lights.filter((l) => l.asset === 'A13.3');
		assert.ok(jarLights.length > 250 && jarLights.every((l) => Math.abs(l.y - model.placements[l.placement].y - 0.47) < 0.01), 'every jar light (and halo) at the glass centre');
		assert.ok(KIT['A13.3'].collider > 0, 'the jars (×263) stay out of Play\'s collision (collider prisms)');
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

	const gardenGlb = (id) => glbMesh(path.join(root, 'assets', SAMPLES.get(KIT[id].model).file));
	const lowest = (pts, q) => pts.reduce((a, p) => Math.min(a, p[q]), Infinity);
	const highest = (pts, q) => pts.reduce((a, p) => Math.max(a, p[q]), -Infinity);

	test('gardenOfHush: A21–A25 swap — N-GD01/05/07/08/09/10/11/15 on their A22 / A24 / A25 GLBs (the -slim root arch), the shoes at ×0.7; the shorter root falls shut the same ways as the 5.4 m blockout', () => {
		checkA2x(KIT, ASSETS, {
			'N-GD01': 'act1-a25-1-root-rib-arch-slim', 'N-GD05': 'act1-a25-2-plank-crossing', 'N-GD07': 'act1-a25-3-root-fall', 'N-GD08': 'act1-a25-4-harvest-basket',
			'N-GD09': 'act1-a25-5-tending-kit', 'N-GD10': 'act1-a24-4-turned-down-coverlet', 'N-GD11': 'act1-a22-1-worn-shoes', 'N-GD15': 'act1-a25-6-tamsin-lantern',
		});
		const shoes = model.placements.filter((p) => p.asset === 'N-GD11');
		assert.ok(shoes.length === 1 && shoes[0].scale === 0.7, 'the fens\' shoes at ×0.7 (0.32 × 0.13 × 0.31 m, concept 0.32 × 0.1 × 0.3)');
		for (const id of ['N-GD08', 'N-GD09']) assert.ok(KIT[id].collider >= 0.9, `${id}: collider over the low prop`);
		// the root falls are 4.83 m deep (the blockout 5.4 m): at Play's 0.3 m radius the floor reached from the deep rows only changes next to a fall
		const falls = model.placements.filter((p) => p.asset === 'N-GD07');
		assert.ok(falls.length === 2 && falls.every((p) => p.solid) && KIT['N-GD07'].collider >= 3.0, 'two solid root falls, a collider over the 3.2 m heap');
		const old = I.compile(PLAN, { ...KIT, 'N-GD07': { ...KIT['N-GD07'], foot: [4.6, 5.4] } });
		const deep = model.segments.find((s) => s.id === 'deep').spawn;
		const [fNew, fOld] = [model, old].map((m) => m.flood(deep[0], deep[1], 0.3, 0.3));
		let changed = 0;
		for (let x = 16; x <= 80; x += 0.25) {
			for (let z = -16; z <= 22; z += 0.25) {
				if (fNew.reach(x, z) === fOld.reach(x, z)) continue;
				changed++;
				assert.ok(falls.some((p) => Math.abs(x - p.x) <= 2.3 + 0.6 && Math.abs(z - p.z) <= 2.7 + 0.6), `(${x}, ${z}) is reached differently than with the 5.4 m footprint, away from both falls`);
			}
		}
		assert.ok(changed <= 40, `${changed} cells reached differently (a strip along a fall face at most)`);
	});

	test('gardenOfHush: the A25.1-slim root arches keep the root tunnel walkable — the cut drops only the rootlets in the 2.3 m lane (≥ 2 m headroom, the legs kept and inside the blockers), the lane runs on the route, each arch stands on the ramp', () => {
		const k = KIT['N-GD01'];
		const g = gardenGlb('N-GD01');
		const kept = I.cutTriangles(g.positions, g.index, k.cut);
		const all = trianglePoints(g.positions, g.index, 4);
		const pts = trianglePoints(g.positions, kept, 4);
		const inLane = ([x, y, z]) => x > -0.8 && x < 1.4 && Math.abs(z) <= 0.98 && y > 0.3 && y < 1.95;
		assert.ok(all.some(inLane), 'the full GLB has rootlets hanging into the lane (the cut is needed)');
		const left = pts.filter(inLane);
		assert.equal(left.length, 0, `${left.length} points of the cut GLB in the lane below 1.95 m, e.g. ${JSON.stringify(left[0])}`);
		// only rootlets go: every dropped triangle is a small piece (edges ≤ 0.15 m) inside the lane, between the legs, above 0.7 m
		const keptSet = new Set();
		for (let t = 0; t < kept.length; t += 3) keptSet.add(`${kept[t]},${kept[t + 1]},${kept[t + 2]}`);
		let dropped = 0;
		for (let t = 0; t < g.index.length; t += 3) {
			const tri = [g.index[t], g.index[t + 1], g.index[t + 2]];
			if (keptSet.has(tri.join(','))) continue;
			dropped++;
			const v = tri.map((i) => [g.positions[i * 3], g.positions[i * 3 + 1], g.positions[i * 3 + 2]]);
			assert.ok(v.every(([x, y]) => x > -0.95 && x < 1.3 && y > 0.7 && y < 2.15), `a dropped triangle reaches past the rootlets: ${JSON.stringify(v)}`);
			assert.ok(v.every((a, i) => Math.hypot(...a.map((c, q) => c - v[(i + 1) % 3][q])) <= 0.15), 'a dropped triangle is larger than a rootlet piece');
		}
		assert.ok(dropped > 100 && dropped < 0.08 * (g.index.length / 3), `the cut drops ${dropped} of ${g.index.length / 3} triangles`);
		const head = lowest(pts.filter(([x, y, z]) => x > -0.4 && x < 1.0 && Math.abs(z) <= 0.98 && y > 0.3), 1);
		assert.ok(head >= 2.0, `headroom over the lane centre ${head.toFixed(2)} m`);
		// the legs stay, and in Play's band (0.35–1.7 m) every kept point lies in a foot blocker (x ≤ −0.85 or ≥ +1.45, |z| ≤ 0.97)
		const band = pts.filter(([, y]) => y >= 0.35 && y <= 1.7);
		assert.ok(band.some(([x]) => x < -1.1) && band.some(([x]) => x > 1.65), 'both legs kept in the walk band');
		const outside = band.filter(([x, , z]) => !(Math.abs(z) <= 0.98 && (x <= -0.83 || x >= 1.43)));
		assert.equal(outside.length, 0, `${outside.length} kept points in the walk band outside the foot blockers, e.g. ${JSON.stringify(outside[0])}`);
		assert.deepEqual(k.blockers.map((b) => b.rect), [[-3.25, -0.97, -0.85, 0.97], [1.45, -0.97, 3.25, 0.97]]);
		const arches = model.placements.filter((p) => p.asset === 'N-GD01');
		assert.equal(arches.length, 3);
		for (const p of arches) {
			for (const lz of [-0.97, 0, 0.97]) {
				const [x, z] = toWorld(p, 0.3, lz);
				const sink = model.floorY(x, z) - p.y;
				assert.ok(sink >= -0.005 && sink <= 0.3, `arch at x ${p.x}: its base ${(-sink).toFixed(3)} m off the floor at local z ${lz} (no part floats, ≤ 0.3 m sunk)`);
				assert.ok(model.clearance(x, z) >= 0.9, `arch at x ${p.x}: the lane at local z ${lz} has clearance ${model.clearance(x, z).toFixed(2)} m (≥ 1.8 m wide)`);
			}
			assert.ok(Math.abs(toWorld(p, 0.3, 0)[1] + 34) < 0.01, 'the lane centre on the route (z −34)');
			for (const lx of [-1.6, 2.2]) assert.ok(model.clearance(...toWorld(p, lx, 0)) < 0, `arch at x ${p.x}: its foot at local x ${lx} blocks`);
		}
		assert.ok(model.flood(-82, -34, 0.35, 0.3).reach(-66, -34), 'the old crypt reaches Furrow Hall I through the three arches');
	});

	test('gardenOfHush: the A25.2 plank crossing is walked — walk-through, laid into the earth (deck ≈ 0.04 m over the floor), the gallery reaches the breath room door over it', () => {
		const p = model.placements.find((q) => q.asset === 'N-GD05');
		assert.ok(p && !p.solid && KIT['N-GD05'].solid === false, 'walk-through (no blocker, no collider)');
		const g = gardenGlb('N-GD05');
		const deck = highest(trianglePoints(g.positions, g.index, 4).filter(([x, , z]) => Math.abs(x) < 0.35 && Math.abs(z) < 0.9), 1);
		const rise = p.y + deck * p.scale - model.floorY(p.x, p.z);
		assert.ok(rise >= 0 && rise <= 0.08, `deck top ${rise.toFixed(3)} m over the floor the hero walks`);
		for (let lz = -1.15; lz <= 1.151; lz += 0.23) assert.ok(model.clearance(...toWorld(p, 0, lz)) >= 0.35, `the plank line at local z ${lz.toFixed(2)} is clear`);
		const gal = model.segments.find((s) => s.id === 'gallery').spawn;
		const f = model.flood(gal[0], gal[1], 0.35, 0.3);
		assert.ok(f.reach(...toWorld(p, 0, -1.15)) && f.reach(...toWorld(p, 0, 1.15)) && f.reach(-10, -27.2), 'the gallery reaches both plank ends and the breath room door');
	});

	test('gardenOfHush: the A24.4 coverlet lies on its empty A13.1 bed — its top just over the bed\'s linen, the bed\'s pillow under its own (no double pillow), nobody in it', () => {
		const grid = (g) => {
			const m = new Map();
			for (const [x, y, z] of trianglePoints(g.positions, g.index, 5)) m.set(`${Math.floor(x / 0.1)},${Math.floor(z / 0.1)}`, Math.max(m.get(`${Math.floor(x / 0.1)},${Math.floor(z / 0.1)}`) ?? -1, y));
			return m;
		};
		const bt = grid(glbMesh(path.join(root, 'assets', SAMPLES.get(KIT['A13.1'].model).file)));
		const ct = grid(gardenGlb('N-GD10'));
		const covers = model.placements.filter((q) => q.asset === 'N-GD10');
		assert.ok(covers.length >= 1);
		for (const p of covers) {
			const bed = model.placements.find((q) => q.asset === 'A13.1' && Math.hypot(q.x - p.x, q.z - p.z) < 0.01 && Math.abs(q.yaw - p.yaw) < 1e-6);
			assert.ok(bed && bed.scale === p.scale, 'on an A13.1 bed (same place, yaw and scale)');
			const dy = (p.y - bed.y) / p.scale;
			const sheet = [];
			const pillow = [];
			for (const [key, top] of bt) {
				const cv = ct.get(key);
				const [i, j] = key.split(',').map(Number);
				const [x, z] = [(i + 0.5) * 0.1, (j + 0.5) * 0.1];
				if (cv === undefined) continue;
				if (z < -0.75 && Math.abs(x) <= 0.35) pillow.push(cv + dy - top);
				else if (z >= -0.75 && z <= 1.0 && Math.abs(x) <= 0.5) sheet.push(cv + dy - top);
			}
			sheet.sort((a, b) => a - b);
			assert.ok(sheet.length > 100 && sheet[0] >= 0 && sheet[sheet.length >> 1] <= 0.08, `the coverlet over the linen: lowest ${sheet[0].toFixed(3)}, median ${sheet[sheet.length >> 1].toFixed(3)} m`);
			assert.ok(pillow.length > 20 && pillow.every((d) => d >= 0), 'the bed\'s own pillow stays under the coverlet\'s pillow');
			assert.ok(!model.placements.some((q) => SLEEPERS.includes(q.asset) && Math.hypot(q.x - p.x, q.z - p.z) < 1), 'nobody in it yet');
		}
	});

	test('gardenOfHush: Tamsin\'s lantern (A25.6) stands on the breath room floor by Fen; her warm flickering light (the map\'s one shadowed light) and the KIT globe sit on its glass', () => {
		const p = model.placements.find((q) => q.asset === 'N-GD15');
		assert.ok(p && p.solid && Math.abs(p.y - model.floorY(p.x, p.z)) < 0.005 && I.inPolygon(model.byId.breath.pts, p.x, p.z), 'standing on the breath room floor (solid)');
		const g = gardenGlb('N-GD15');
		const body = trianglePoints(g.positions, g.index, 4).filter(([x, y]) => x > 0.1 && y > 0.35 && y < 0.65); // the hanging tin lantern
		const box = [0, 1, 2].map((q) => [lowest(body, q), highest(body, q)]);
		const L = model.lights.find((l) => l.id === 'lantern');
		const [lx, lz] = toLocal(p, L.x, L.z);
		const local = [lx, L.y - p.y, lz];
		assert.ok(local.every((v, q) => v > box[q][0] && v < box[q][1]), `the light inside the lantern glass: local ${local.map((v) => v.toFixed(2))}, glass ${JSON.stringify(box.map((b) => b.map((v) => +v.toFixed(2))))}`);
		assert.ok(L.kind === 'human' && L.shadow && model.lights.filter((l) => l.shadow).length === 1, 'the one shadowed light, human (warm, flickering)');
		const globe = KIT['N-GD15'].globe[0];
		assert.ok(globe.p === 'glow' && Math.hypot(globe.at[0] - local[0], globe.at[1] - local[1], globe.at[2] - local[2]) < 0.01, 'the KIT globe on the light');
		const back = lowest(trianglePoints(g.positions, g.index, 2), 2);
		assert.ok(toWorld(p, 0, back)[1] >= model.byId.breath.bbox[1] + 0.35, 'its back clear of the north wall (0.35 m half wall)');
		const fen = model.placements.find((q) => q.asset === 'N-GD02');
		assert.ok(Math.hypot(L.x - fen.x, L.z - fen.z) < 1.8, 'by Fen\'s bed');
	});
}

// The Old Face (src/env/oldFace.js): the pure data of the fixed Prologue dungeon. No browser: connectivity, widths, heights, masks, triggers.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import * as O from '../src/env/oldFace.js';

const samples = O.pathSamples(0.5);
const dirAt = (i) => {
	const a = samples[Math.max(0, i - 2)];
	const b = samples[Math.min(samples.length - 1, i + 2)];
	const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
	return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
};

test('start -> door is connected on a 0.25 m grid with 0.35 m clearance', () => {
	const c = O.connectivity(0.35, 0.25);
	assert.ok(c.start, 'the spawn has clearance');
	assert.ok(c.goal, 'the door has clearance');
	assert.ok(c.reached, 'the flood fill reaches the door');
	console.log(`  connectivity: ${c.cells} free cells`);
});

test('the path keeps 0.35 m clear and is at least 1.8 m wide, the squeeze 1.8..2.2 m', () => {
	let min = Infinity;
	let minAt = null;
	let squeeze = Infinity;
	samples.forEach(([x, z], i) => {
		assert.ok(O.clearance(x, z) >= 0.35, `path sample (${x.toFixed(2)}, ${z.toFixed(2)}) is ${O.clearance(x, z).toFixed(2)} m from something solid`);
		const [dx, dz] = dirAt(i);
		const w = O.freeWidth(x, z, dx, dz);
		if (w < min) {
			min = w;
			minAt = [x, z];
		}
		if (x >= -6.5 && x <= -3.5) squeeze = Math.min(squeeze, w);
	});
	console.log(`  min free width ${min.toFixed(2)} m at (${minAt.map((v) => v.toFixed(1))}), squeeze ${squeeze.toFixed(2)} m`);
	assert.ok(min >= 1.8, `min free width ${min.toFixed(2)}`);
	assert.ok(squeeze >= 1.8 && squeeze <= 2.2, `squeeze ${squeeze.toFixed(2)}`);
});

test('everything is within 60 m of the spawn (the nav grid is 128 x 128 cells of 1 m round it)', () => {
	for (let z = -12; z < 8; z += 0.5) for (let x = -34; x < 18; x += 0.5) if (O.inside(x, z)) assert.ok(Math.hypot(x - O.SPAWN.x, z - O.SPAWN.z) < 60);
	const far = Math.max(...samples.map(([x, z]) => Math.hypot(x - O.SPAWN.x, z - O.SPAWN.z)));
	console.log(`  farthest path point ${far.toFixed(1)} m from the spawn`);
});

test('triggers, cues and spawn points lie in the walkable area', () => {
	for (const e of O.ENCOUNTERS) {
		assert.ok(O.inside(e.trigger.x, e.trigger.z), `${e.id} trigger centre`);
		for (const c of e.cues) assert.ok(O.inside(c.x, c.z), `${e.id} cue (${c.x}, ${c.z})`);
		for (const g of e.spawn) for (const [x, z] of g.at) assert.ok(O.clearance(x, z) >= 0.3, `${e.id} spawn (${x}, ${z}) clearance ${O.clearance(x, z).toFixed(2)}`);
	}
	assert.ok(O.clearance(O.SPAWN.x, O.SPAWN.z) >= 0.35, 'the spawn');
	for (const k of O.KNOCK) assert.ok(O.inside(k.x, k.z));
});

test('floor height steps are walkable: <= 0.45 m per 0.5 m on the path, <= 0.6 per 1 m on the stair', () => {
	let worst = 0;
	for (let i = 1; i < samples.length; i++) {
		const [x, z] = samples[i];
		const [px, pz] = samples[i - 1];
		const d = Math.abs(O.floorY(x, z) - O.floorY(px, pz));
		worst = Math.max(worst, d);
		assert.ok(d <= 0.45 + 1e-9, `step ${d.toFixed(2)} m at (${x.toFixed(1)}, ${z.toFixed(1)})`);
	}
	// the stair as the nav grid sees it: 1 m cell centres along its column
	for (let z = 1.5; z > -6; z -= 0.25) assert.ok(Math.abs(O.floorY(13.7, z) - O.floorY(13.7, z - 1)) <= 0.6 + 1e-9, `stair at z=${z}`);
	console.log(`  worst step between path samples ${worst.toFixed(2)} m`);
});

test('the flood basin is lower than the water, which is lower than the dry floor', () => {
	assert.ok(O.LEVEL.basin < O.LEVEL.water && O.LEVEL.water < O.LEVEL.dry);
	assert.equal(O.floorY(8.5, 3.2), O.LEVEL.basin);
	assert.equal(O.floorY(2.0, 3.2), O.LEVEL.dry);
	assert.ok(O.waterDepth(8.5, 3.2) > 0.15 && O.waterDepth(8.5, 3.2) < 0.3);
	assert.equal(O.waterDepth(2.0, 3.2), 0);
	assert.ok(O.floorY(13.7, -5) === O.STAIR.top);
});

test('the ground masks are finite and inside [0, 1]; at most 8 layers', () => {
	assert.ok(O.LAYERS.length <= 8);
	for (const slider of [0, 0.8, 1]) {
		const masks = O.makeMasks(O.smoothParams(slider));
		const out = new Float32Array(8);
		for (let z = -12; z < 8; z += 0.5) {
			for (let x = -34; x < 18; x += 0.5) {
				out.fill(0);
				masks(x, z, out);
				for (let i = 1; i < 8; i++) assert.ok(Number.isFinite(out[i]) && out[i] >= 0 && out[i] <= 1, `mask ${i} = ${out[i]} at (${x}, ${z}) slider ${slider}`);
			}
		}
	}
	// every ground layer's albedo is a registered asset (the layer library loads biome-<id> / dungeon-<id> by these names)
	const registered = new Set(JSON.parse(readFileSync(new URL('../src/assets/samples.json', import.meta.url), 'utf8')).assets.map((a) => a.id));
	for (const l of O.LAYERS) assert.ok(registered.has(O.textureId(l.id)), `layer ${l.id} -> ${O.textureId(l.id)} is not in samples.json`);
});

test('the walls close the rooms: every boundary point of the floor is within 0.4 m of a wall run (except the door and the hole)', () => {
	const runs = [...O.BONE_RUNS, ...O.STONE_RUNS];
	const dist = (r, x, z) => {
		const dx = r.b[0] - r.a[0];
		const dz = r.b[1] - r.a[1];
		const t = Math.min(1, Math.max(0, ((x - r.a[0]) * dx + (z - r.a[1]) * dz) / (dx * dx + dz * dz)));
		return Math.hypot(x - (r.a[0] + dx * t), z - (r.a[1] + dz * t));
	};
	let leaks = [];
	for (let z = -11; z < 8; z += 0.25) {
		for (let x = -33; x < 18; x += 0.25) {
			if (!O.inside(x, z)) continue;
			if (O.wallDistance(x, z) > 0.3) continue;
			const d = Math.min(...runs.map((r) => dist(r, x, z)));
			if (d > 0.45) leaks.push([x, z, d.toFixed(2)]);
		}
	}
	assert.equal(leaks.length, 0, `unwalled boundary points: ${JSON.stringify(leaks.slice(0, 6))}`);
});

test('modules: x-scale 0.8..1.1 (the leaning one excepted), count and the apex gap', () => {
	const mods = O.wallModules();
	for (const m of mods) assert.ok(m.sx >= 0.79 && m.sx <= 1.11, `${m.run}#${m.i} sx ${m.sx}`);
	const apex = mods.filter((m) => m.run === 'face2' || m.run === 'face3');
	assert.equal(apex.length, 2);
	const gap = Math.hypot(apex[0].x - apex[1].x, apex[0].z - apex[1].z);
	console.log(`  ${mods.length} crypt-wall modules, apex pair ${gap.toFixed(2)} m apart`);
	assert.ok(mods.length >= 30 && mods.length <= 60);
	assert.equal(mods.filter((m) => m.tag === 'collapse'
) .length, 1);
	assert.equal(mods.filter((m) => m.tag === 'warm').length, 1);
});

test('every encounter trigger fires only inside its own rooms and no point fires two encounters (no triggering through a wall)', () => {
	let outside = 0;
	for (const e of O.ENCOUNTERS) {
		for (let z = -12; z < 8; z += 0.25) {
			for (let x = -34; x < 18; x += 0.25) {
				if (!O.triggerHit(e, x, z)) continue;
				assert.ok(e.trigger.rooms.includes(O.roomAt(x, z)), `${e.id} fires at (${x}, ${z}) in room ${O.roomAt(x, z)}`);
				const others = O.ENCOUNTERS.filter((o) => o !== e && O.triggerHit(o, x, z));
				assert.equal(others.length, 0, `(${x}, ${z}) fires ${e.id} and ${others.map((o) => o.id)}`);
			}
		}
		// the circle still reaches into other rooms or the void: those points are the ones the gate rejects
		for (let z = e.trigger.z - e.trigger.r; z < e.trigger.z + e.trigger.r; z += 0.25) for (let x = e.trigger.x - e.trigger.r; x < e.trigger.x + e.trigger.r; x += 0.25) if (Math.hypot(x - e.trigger.x, z - e.trigger.z) < e.trigger.r && !O.triggerHit(e, x, z)) outside++;
		// the path crosses every trigger
		assert.ok(samples.some(([x, z]) => O.triggerHit(e, x, z)), `${e.id} is never reached by the path`);
	}
	console.log(`  ${outside} grid points inside a trigger circle are rejected by the room gate (walls, voids, the neighbouring room)`);
});

test('the flooded step shore is a floor, not a wall, to the nav: every triangle of the 0.25 m floor mesh over the basin (west shore to the stair column, north wall to 0.25 m short of the south wall) stays under the 0.6 normal-y limit (slope < 53 degrees); the hard basin edge against the south wall is not included', () => {
	const c = 0.25;
	const limit = Math.tan(Math.acos(0.6)); // collision.js: normal.y above 0.6 is walkable
	let worst = 0;
	let at = null;
	for (let z = O.FLOOD.z0; z < O.FLOOD.z1 - c; z += c) {
		for (let x = O.FLOOD.x0 - 2; x < O.STAIR.x0 - c; x += c) {
			// the two triangles of buildFloor's cell: a(i, j) c(i, j + 1) b(i + 1, j) and b c d(i + 1, j + 1)
			const h = (dx, dz) => O.floorY(x + dx * c, z + dz * c);
			const ha = h(0, 0);
			const hb = h(1, 0);
			const hc = h(0, 1);
			const hd = h(1, 1);
			const g1 = Math.hypot((hb - ha) / c, (hc - ha) / c);
			const gz = (hd - hb) / c;
			const g2 = Math.hypot(gz - (hc - hb) / c, gz);
			for (const g of [g1, g2]) {
				if (g > worst) {
					worst = g;
					at = [x, z];
				}
			}
		}
	}
	console.log(`  steepest floor triangle near the water: ${(Math.atan(worst) * 180 / Math.PI).toFixed(1)} deg at (${at.map((v) => v.toFixed(2))}), limit ${(Math.atan(limit) * 180 / Math.PI).toFixed(1)} deg`);
	assert.ok(worst < limit, `slope ${worst.toFixed(2)} >= ${limit.toFixed(2)}`);
});

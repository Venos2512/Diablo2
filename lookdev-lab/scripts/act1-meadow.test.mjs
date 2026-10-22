// ASHLAR · Act I base maps — the MEADOW (src/env/act1/meadow.js: field, sleep smoke, land apron) and the Poppy Reach brief (maps/poppyReach.js).
// node --test scripts/act1-meadow.test.mjs   (also part of npm run test:act1)
// Engine: smoke zones breathe along the wind and repeat each period; the apron meets the terrain at the bounds, its inner ring is the terrain border, its
// triangles face up, it sinks under the far water where the hills end; field instances are deterministic, scale with density, never stand on a lane or in
// water. Map 3: 3..6 rite sites, ≥ 1 unmarked vignette, the hospice window (still Perfection light) on sightlines from the foot, exits at the foot / the
// flank / the top, every smoke bank closes (≥ 3 m) and opens (0 m) its lane, the open / choke beats alternate along the Reach road, the steps reach the
// terrace from the top spawn, red poppies dense in the drifts but quiet on the lanes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePlan, PLAY } from '../src/env/act1/outdoor.js';
import { fieldInstances, fieldSampler, smokeZones, smokeCover, apronHeight, apronMesh } from '../src/env/act1/meadow.js';

const mod = await import('../src/env/act1/maps/poppyReach.js');
const plan = mod.PLAN;
const W = evaluatePlan(plan);
const apronY = apronHeight(W);

test('meadow: smoke zones breathe along the wind and repeat every period', () => {
	const z0 = smokeZones(plan, 0);
	for (const [i, zn] of plan.smoke.zones.entries()) {
		const a = smokeZones(plan, zn.period / 4 - (zn.phase ?? 0) * zn.period)[i];
		const b = smokeZones(plan, (zn.period * 3) / 4 - (zn.phase ?? 0) * zn.period)[i];
		const [wx, wz] = plan.smoke.wind;
		const along = ((a.cx - b.cx) * wx + (a.cz - b.cz) * wz) / Math.hypot(wx, wz);
		assert.ok(Math.abs(along - 2 * zn.drift) < 0.5, `${zn.id}: travels ±drift along the wind (${along.toFixed(2)})`);
		const p = smokeZones(plan, zn.period)[i];
		const back = ((p.cx - z0[i].cx) * wx + (p.cz - z0[i].cz) * wz) / Math.hypot(wx, wz);
		assert.ok(Math.abs(back) < 1e-6, `${zn.id}: along the wind it is back at its start after a period`);
	}
});

test('meadow: the apron meets the terrain at the bounds, faces up, and sinks under the far water beyond the hill', () => {
	const [x0, z0, x1, z1] = W.bounds;
	for (const [x, z] of [[0, z0], [x1, 0], [x0, -60], [60, z0], [x1, -110]]) assert.ok(Math.abs(apronY(x + Math.sign(x) * 0.01 * (Math.abs(x) === x1), z - 0.01 * (z === z0)) - W.height(x, z)) < 0.12, `apron ≈ terrain at ${x}, ${z}`);
	assert.ok(apronY(0, z0 - 172) > 10, 'the hill goes on north of the bounds (its crest beyond the hospice)');
	assert.ok(apronY(x1 + 340, 0) < plan.far.level, 'beyond the hill the land sinks under the far water');
	const m = apronMesh(W, apronY);
	const H = W.heights;
	for (let p = 0; p < m.perRing; p += 97) {
		const k = m.position.subarray(p * 3, p * 3 + 3);
		const onBorder = Math.abs(k[0] - x0) < 1e-6 || Math.abs(k[0] - x1) < 1e-6 || Math.abs(k[2] - z0) < 1e-6 || Math.abs(k[2] - z1) < 1e-6;
		assert.ok(onBorder, 'the inner ring lies on the bounds');
		assert.ok(Math.abs(k[1] - H.sample(k[0], k[2])) < 1e-3, 'the inner ring takes the terrain border heights (watertight seam)');
	}
	let up = 0;
	let tris = 0;
	for (let t = 0; t < m.index.length; t += 6 * 53) {
		const [a, b, c] = [m.index[t], m.index[t + 1], m.index[t + 2]].map((v) => m.position.subarray(v * 3, v * 3 + 3));
		const ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
		if (Math.abs(ny) < 1e-9) continue; // a degenerate corner fan triangle on the inner ring
		tris++;
		if (ny > 0) up++;
	}
	assert.equal(up, tris, 'every apron triangle faces up');
	assert.ok(m.index.every((v) => v < m.position.length / 3));
});

test('meadow: field instances are deterministic, scale with density, keep off the lanes and out of the water', () => {
	const a = fieldInstances(W, { apronY });
	const b = fieldInstances(W, { apronY });
	assert.equal(a.poppyCount, b.poppyCount);
	assert.deepEqual([...a.poppies.subarray(0, 70)], [...b.poppies.subarray(0, 70)]);
	assert.ok(a.poppyCount > 15000 && a.grassCount > 15000, `a dense field (${a.poppyCount} clumps, ${a.grassCount} tufts)`);
	const half = fieldInstances(W, { apronY, density: 0.5 });
	assert.ok(Math.abs(half.poppyCount / a.poppyCount - 0.5) < 0.06, 'density halves the field');
	const F = fieldSampler(W);
	const [x0, z0, x1, z1] = W.bounds;
	let onLane = 0;
	let wet = 0;
	let inside = 0;
	for (let i = 0; i < a.poppyCount; i++) {
		const x = a.poppies[i * 7];
		const z = a.poppies[i * 7 + 2];
		if (x < x0 || x > x1 || z < z0 || z > z1) continue;
		inside++;
		if (F.lane(x, z) < 0.3) onLane++;
		if (W.waterDepth(x, z) > 0.05) wet++;
	}
	assert.ok(onLane <= inside * 0.001, `the lanes stay quiet (${onLane} of ${inside} clumps within 0.3 m of a lane)`);
	assert.equal(wet, 0, 'no poppy stands in water');
	assert.ok(a.apronPoppies > 0, 'the poppies run on beyond the bounds');
});

test('poppyReach: brief checks — rites, unmarked vignettes, the warm still window seen from the foot, three exits, smoke opens and closes lanes, alternating beats, the steps reach the terrace', () => {
	const kinds = (k) => W.markers.filter((m) => m.kind === k);
	const rites = kinds('rite');
	assert.ok(rites.length >= 3 && rites.length <= 6, `${rites.length} rite sites`);
	assert.ok(new Set(W.structures.filter((s) => s.tag === 'rite').map((s) => s.asset)).size >= 3, 'each rite is a different small scene');
	assert.ok(kinds('vignette').some((m) => m.unmarked), 'an unmarked vignette');
	const foot = kinds('sightline').find((m) => m.from[1] > 80);
	assert.ok(foot && foot.toP[1] - foot.fromP[1] > 25, 'the window at the top is seen from the foot of the slope');
	const win = W.lights.find((l) => l.id === 'ghWindow');
	assert.ok(win && win.kind === 'perfection' && win.flicker === 0 && win.real, 'the hospice window is a still Perfection light');
	assert.ok(W.lights.filter((l) => l.kind === 'perfection').every((l) => !l.flicker), 'Perfection light never flickers');
	assert.ok(W.lights.filter((l) => l.real).length <= 8);
	const exits = kinds('exit');
	assert.ok(exits.some((m) => m.z > 100) && exits.some((m) => m.z < -100) && exits.some((m) => m.to === 'flintDelvings'), 'exits at the foot, the top and the Delvings');
	for (const zn of plan.smoke.zones) {
		let lo = Infinity;
		let hi = 0;
		for (let t = 0; t < zn.period; t += 1) {
			const c = smokeCover(W, zn.lane, t, { zone: zn.id });
			lo = Math.min(lo, c);
			hi = Math.max(hi, c);
		}
		assert.ok(hi >= 3 && lo === 0, `smoke ${zn.id} closes (${hi} m) and opens (${lo} m) the ${zn.lane}`);
	}
	const beats = kinds('beat');
	for (let i = 1; i < beats.length; i++) assert.notEqual(beats[i].beat, beats[i - 1].beat, `beats ${beats[i - 1].id} → ${beats[i].id} alternate open / choke`);
	const top = W.spawns.find((s) => s.id === 'top');
	const g = W.walkGrid(top);
	assert.ok(g.reached(0, -109.5) && W.walkY(0, -109.5) > W.walkY(0, -99) + 1.8, 'up the steps onto the hospice terrace (2 m)');
	assert.ok(PLAY.grid >= 128);
	const F = fieldSampler(W);
	assert.ok(F.poppy(-42, 66) > 0.2 && F.poppy(-50, -92) > 0.2, 'red in the drifts, from the foot to the top of the slope');
});

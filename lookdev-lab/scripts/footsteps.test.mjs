// Environment interaction of the playing hero (src/character/footsteps.js and its pure parts): when a step happens, what the ground is, how the effects are
// pooled and cleaned up. No browser: the pure modules run as they are, the Footsteps system runs against a small fake app.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { StepTracker, FootPlantDetector, strideFor } from '../src/character/stepper.js';
import { FxPool } from '../src/character/fxPool.js';
import { TrampleField } from '../src/character/trampleField.js';
import { Footsteps } from '../src/character/footsteps.js';
import { TRAMPLE } from '../src/core/trample.js';
import { SURFACES, LAYER_SURFACE, newSample, classifySplat, classifyLayers, applyWater, patchAt, pathCoverage, biomeMixSurface, dungeonSurface } from '../src/env/surfaces.js';
import { SAMPLES, gridCell, smoothParams, shaderMask, finalWeights, makeMasks, pondDistance, groundHeight } from '../src/env/biomeMix.js';
import * as D from '../src/env/dungeon.js';
import { LayerSplat } from '../src/env/terrainLayers.js';
import { layerIds as biomeLayerIds } from '../src/env/biomeMix.js';

const DT = 1 / 60;

/** Walk straight along +z at `speed` for `seconds`; returns every event with the position it fired at. */
function walk(tracker, { speed = 1.6, seconds = 10, x0 = 0, z0 = 0, locomotion = true, feet = null, start = 0 } = {}) {
	const out = [];
	let z = z0;
	for (let i = 0; i < Math.round(seconds / DT); i++) {
		z += speed * DT;
		const t = start + i * DT;
		for (const e of tracker.update({ dt: DT, x: x0, z, locomotion, feet: feet ? feet(t, z) : null })) out.push({ ...e, z0: z });
	}
	return out;
}

// ---- when a step happens -------------------------------------------------------------------------------------------------------------

test('standing still or jittering against a wall produces no steps', () => {
	const tracker = new StepTracker();
	assert.equal(walk(tracker, { speed: 0, seconds: 5 }).length, 0);
	// pushing into a wall: the position jitters by a centimetre every frame (1.2 m/s per frame, no net progress)
	let n = 0;
	for (let i = 0; i < 600; i++) n += tracker.update({ dt: DT, x: 0, z: (i % 2) * 0.02, locomotion: true }).length;
	assert.equal(n, 0);
});

test('walking: one step per stride, alternating feet, beside the body line', () => {
	const tracker = new StepTracker({ height: 1.8 });
	const events = walk(tracker, { speed: 1.6, seconds: 10 });
	const expected = 16 / strideFor(1.8, 1.6); // 16 m walked
	assert.ok(Math.abs(events.length - expected) <= 2, `${events.length} steps for ${expected.toFixed(1)} strides`);
	events.forEach((e, i) => {
		if (i) assert.notEqual(e.side, events[i - 1].side, 'feet alternate');
		assert.equal(e.source, 'cadence');
		assert.ok(Math.abs(e.x - (e.side === 0 ? 0.09 : -0.09)) < 0.02, `foot ${e.side} at x=${e.x}`); // walking +z: left = +x
		assert.ok(Math.abs(e.yaw) < 0.05, 'heading +z');
		assert.equal(e.run, false);
	});
});

test('running steps are longer and still bounded per second', () => {
	const walkSteps = walk(new StepTracker(), { speed: 1.6, seconds: 10 });
	const run = new StepTracker();
	const runSteps = walk(run, { speed: 5.6, seconds: 10 });
	assert.ok(runSteps.every((e) => e.run));
	const perSecond = runSteps.length / 10;
	assert.ok(perSecond > walkSteps.length / 10 && perSecond <= 5, `${perSecond} steps/s`);
	for (let i = 1; i < runSteps.length; i++) assert.ok(runSteps[i].z0 - runSteps[i - 1].z0 > 0.5, 'steps are spaced by real distance');
});

test('attacks, hits and death (not locomotion) never step; the first step after them waits for distance', () => {
	const tracker = new StepTracker();
	assert.equal(walk(tracker, { speed: 3, seconds: 4, locomotion: false }).length, 0); // knocked back / casting while sliding
	const events = walk(tracker, { speed: 1.6, seconds: 1, z0: 12 });
	assert.ok(events.length <= 2);
});

test('teleports, scene hitches and huge frame times resynchronise instead of stepping across the gap', () => {
	const tracker = new StepTracker();
	const before = walk(tracker, { speed: 1.6, seconds: 3 });
	assert.ok(before.length > 0);
	const gap = tracker.update({ dt: DT, x: 0, z: 400, locomotion: true });
	assert.equal(gap.length, 0);
	assert.equal(tracker.discontinuities, 1);
	const after = walk(tracker, { speed: 1.6, seconds: 3, z0: 400 });
	assert.ok(after.length > 0);
	assert.ok(after.every((e) => e.z > 399), 'no step lands between the two places');
	// a 0.6 s hitch with a normal-looking 1 m displacement
	assert.equal(tracker.update({ dt: 0.6, x: 0, z: 401.9, locomotion: true }).length, 0);
	assert.equal(tracker.discontinuities, 2);
	// a bad frame time
	assert.equal(tracker.update({ dt: 0, x: 0, z: 402, locomotion: true }).length, 0);
});

test('a burst of frames never banks more than two steps per frame', () => {
	const tracker = new StepTracker();
	tracker.update({ dt: DT, x: 0, z: 0, locomotion: true });
	// 0.2 s frame (still a hitch below 0.25 s) with a 3 m move
	const events = tracker.update({ dt: 0.2, x: 0, z: 2.8, locomotion: true });
	assert.ok(events.length <= 2);
});

/** A believable walk cycle: each foot swings forward (lifted) then travels back relative to the body while planted. */
function cycle(speed, height = 1.8) {
	const stride = strideFor(height, speed);
	const w = Math.PI * speed / stride; // one foot cycle = two strides of travel
	return (t) => [0, 1].map((side) => {
		const phase = w * t + side * Math.PI;
		const swing = Math.cos(phase); // > 0: foot moving forward
		return { along: 0.28 * Math.sin(phase), height: swing > 0 ? 0.09 * swing : 0, x: side === 0 ? 0.09 : -0.09, z: 0 };
	});
}

test('foot plants take over once they alternate believably, and the cadence does not double them', () => {
	const tracker = new StepTracker();
	const feet = cycle(1.6);
	const events = walk(tracker, { speed: 1.6, seconds: 12, feet: (t, z) => feet(t).map((f) => ({ ...f, z })) });
	assert.equal(tracker.detector.reliable, true);
	const plants = events.filter((e) => e.source === 'plant');
	assert.ok(plants.length >= 15, `${plants.length} plant steps`);
	const expected = 19.2 / strideFor(1.8, 1.6);
	assert.ok(events.length <= expected + 3 && events.length >= expected - 3, `${events.length} steps for ${expected.toFixed(1)}`);
	// alternation holds across the hand-over from cadence to plants
	events.forEach((e, i) => i && assert.notEqual(e.side, events[i - 1].side));
});

test('no plants without movement; lost plants fall back to the cadence', () => {
	const detector = new FootPlantDetector();
	const feet = cycle(1.6);
	let plants = 0;
	for (let i = 0; i < 300; i++) plants += detector.update(DT, feet(i * DT), false).length;
	assert.equal(plants, 0);

	const tracker = new StepTracker();
	const walking = cycle(1.6);
	walk(tracker, { speed: 1.6, seconds: 6, feet: (t, z) => walking(t).map((f) => ({ ...f, z })) });
	assert.equal(tracker.detector.reliable, true);
	// the feet freeze (hidden bones / a clip hiccup): steps keep coming, from the cadence
	const frozen = [{ along: 0, height: 0, z: 0, x: 0 }, { along: 0, height: 0, z: 0, x: 0 }];
	const events = walk(tracker, { speed: 1.6, seconds: 6, z0: 10, feet: () => frozen });
	assert.ok(events.length >= 5, `${events.length}`);
	assert.ok(events.some((e) => e.source === 'cadence'));
});

// ---- surfaces ----------------------------------------------------------------------------------------------------------------------

test('splat classification: thresholds and precedence water > path > mud > grass > soil', () => {
	const s = newSample();
	assert.equal(classifySplat(s, { wet: 0, grass: 0 }).id, 'soil');
	assert.equal(classifySplat(s, { wet: 0.1, grass: 0.8 }).id, 'grass');
	assert.equal(classifySplat(s, { wet: 0.9, grass: 0.8 }).id, 'mud', 'wet beats grass');
	assert.equal(classifySplat(s, { wet: 0.9, grass: 0.8 }, { amount: 1, surface: 'stone' }).id, 'stone', 'a road stays a road when the splat is wet');
	assert.ok(classifySplat(s, { wet: 0.9, grass: 0 }, { amount: 1, surface: 'stone' }).wet > 0.8, 'wetness survives for the wet print');
	assert.equal(classifySplat(s, { wet: 0, grass: 0 }, { amount: 0.4, surface: 'stone' }).id, 'soil', 'the road edge');
	classifySplat(s, { wet: 0.9, grass: 0.8 }, { amount: 1, surface: 'stone' });
	applyWater(s, 0.2, 0.35);
	assert.equal(s.id, 'water');
	assert.equal(s.waterLevel, 0.35);
	// a film of water thinner than the threshold is not water
	classifySplat(s, { wet: 0, grass: 0 });
	applyWater(s, 0.01, 0.1);
	assert.equal(s.water, false);
	assert.equal(s.id, 'soil');
	assert.equal(SURFACES.water.print, null, 'water never keeps a print');
});

test('layer classification: dominant layer, blended softness, unknown layers are safe stone', () => {
	const s = newSample();
	classifyLayers(s, ['DW_dirt', 'DW_grass', 'DW_mud'], [0.2, 0.7, 0.1], 0.1);
	assert.equal(s.id, 'grass');
	assert.ok(s.grass > 0.65);
	classifyLayers(s, ['DW_dirt', 'DW_grass', 'DW_mud'], [0.1, 0.1, 0.8], 0);
	assert.equal(s.id, 'mud');
	assert.ok(s.soft > SURFACES.stone.soft);
	classifyLayers(s, ['DW_dirt', 'BIO07_limestone'], [0.5, 0.5], 0);
	assert.ok(s.soft > 0 && s.soft < SURFACES.soil.soft + 1e-6, 'a border between soil and stone is half soft');
	classifyLayers(s, ['mystery'], [1], 0);
	assert.equal(s.id, 'stone');
	classifyLayers(s, ['BIO09_ash_snow'], [1], 0);
	assert.equal(s.id, 'snow');
	classifyLayers(s, ['BIO20_wet_sand'], [1], 0);
	assert.equal(s.id, 'sand');
	assert.ok(s.wet >= 0.7, 'wet sand is wet');
	classifyLayers(s, [], [], 0);
	assert.equal(s.id, 'none');
});

test('every ground layer of the biome mix and the dungeon has a surface', () => {
	const ids = new Set([...biomeLayerIds(), ...D.layerIds()]);
	for (const id of ids) {
		assert.ok(LAYER_SURFACE[id], `${id} has no entry`);
		assert.ok(SURFACES[LAYER_SURFACE[id].id], `${id} -> ${LAYER_SURFACE[id].id}`);
	}
});

test('paths: coverage by each path\'s own width', () => {
	const paths = [{ points: [{ x: 0, z: 0 }, { x: 10, z: 0 }], width: 2, surface: 'stone' }, { points: [{ x: 0, z: 5 }, { x: 10, z: 5 }], width: 1 }];
	assert.equal(pathCoverage(paths, 5, 0.9).amount, 1);
	assert.equal(pathCoverage(paths, 5, 1.2).amount, 0);
	assert.equal(pathCoverage(paths, 5, 5.4).surface, 'packed');
	assert.equal(pathCoverage(paths, 12, 0).amount, 0, 'beyond the end of a path');
});

test('biome mix: patch bounds, real pond water and the shore, from the real masks', () => {
	const sp = smoothParams(0.8);
	const patches = SAMPLES.slice(0, 2).map((sample, k) => {
		const c = gridCell(k);
		const splat = new LayerSplat({ size: 150, originX: c.x - c.size / 2, originZ: c.z - c.size / 2, extent: c.size });
		splat.setBlurMetres(sp.blurM, sp.blurWetM);
		const masks = makeMasks(sample, sp);
		const n = sample.layers.length;
		const tmp = new Float32Array(n + 1);
		splat.fill((x, z, out) => {
			masks(x - c.x, z - c.z, tmp);
			for (let i = 1; i < n; i++) out[i - 1] = tmp[i];
			out[7] = tmp[n];
		});
		return { sample, splat, c };
	});
	const deps = { shaderMask, finalWeights, pondDistance, groundHeight };
	const natural = patches[0];
	const { pond, water, seed } = natural.sample;
	const at = (lx, lz) => biomeMixSurface(newSample(), patches, sp, natural.c.x + lx, natural.c.z + lz, deps);

	const centre = at(pond.x, pond.z);
	assert.equal(centre.id, 'water');
	assert.ok(centre.waterDepth > 0.2 && centre.waterLevel === water.level, `depth ${centre.waterDepth}`);

	// a dry point just outside the pond (0.5 .. 1.2 m from the shore): ground, wet, never water
	let shore = null;
	let far = null;
	for (let lz = -14; lz <= 14 && !(shore && far); lz += 0.5) {
		for (let lx = -14; lx <= 14; lx += 0.5) {
			const d = pondDistance(pond, seed, lx, lz);
			if (!shore && d > 0.6 && d < 1.2) shore = [lx, lz];
			if (!far && d > 14) far = [lx, lz];
		}
	}
	assert.ok(shore && far);
	const bank = at(...shore);
	assert.equal(bank.water, false);
	assert.ok(['mud', 'soil'].includes(bank.id), `bank is ${bank.id}`);
	assert.ok(bank.wet > 0.4, `bank wetness ${bank.wet}`);
	const dry = at(...far);
	assert.equal(dry.water, false);
	assert.ok(['grass', 'soil'].includes(dry.id), `far ground is ${dry.id}`);
	assert.ok(dry.wet < 0.4);

	// outside every patch (the gap between the natural sample and the first small row) is no ground
	assert.equal(patchAt(patches, natural.c.x, natural.c.z + natural.c.size / 2 + 1.2), -1);
	assert.equal(biomeMixSurface(newSample(), patches, sp, natural.c.x, natural.c.z + natural.c.size / 2 + 1.2, deps).id, 'none');
	assert.equal(biomeMixSurface(newSample(), patches, sp, 1e5, 1e5, deps).id, 'none');
});

test('dungeon: the crypt and the cave are separate, the pool is the only water, outside is no ground', () => {
	const sp = smoothParams(0.8);
	const make = (kind) => {
		const def = D.AREAS[kind];
		const splat = new LayerSplat({ size: 120, originX: def.cx - def.splat / 2, originZ: def.cz - def.splat / 2, extent: def.splat });
		splat.setBlurMetres(sp.blurM, sp.blurWetM);
		const masks = kind === 'crypt' ? D.makeCryptMasks(sp) : D.makeCaveMasks(sp);
		const tmp = new Float32Array(8);
		splat.fill((x, z, out) => {
			masks(x - def.cx, z - def.cz, tmp);
			for (let i = 1; i < def.layers.length; i++) out[i - 1] = tmp[i];
			out[7] = tmp[7];
		});
		return { kind, def, splat };
	};
	const areas = [make('crypt'), make('cave')];
	const deps = {
		shaderMask,
		finalWeights,
		inside: (kind, lx, lz) => (kind === 'crypt' ? D.cryptWallDistance(lx, lz) > -0.3 : D.caveWallDistance(lx, lz) > -0.3),
		poolDistance: D.poolDistance,
		poolLevel: D.CAVE.pool.level,
		groundHeight: (kind, lx, lz) => D.caveHeight(lx, lz),
	};
	const at = (x, z) => dungeonSurface(newSample(), areas, sp, x, z, deps);
	const cave = D.AREAS.cave;
	const pool = at(cave.cx + D.CAVE.pool.x, cave.cz + D.CAVE.pool.z);
	assert.equal(pool.id, 'water');
	assert.ok(pool.waterDepth > 0.1);
	const dryCave = at(cave.cx + 6, cave.cz + 4);
	assert.equal(dryCave.water, false);
	assert.notEqual(dryCave.id, 'none');
	const crypt = at(D.AREAS.crypt.cx, D.AREAS.crypt.cz);
	assert.equal(crypt.water, false);
	assert.ok(['stone', 'dust'].includes(crypt.id), `crypt floor is ${crypt.id}`);
	assert.equal(at(0, 40).id, 'none', 'between and beyond the areas');
	assert.equal(at(D.AREAS.crypt.cx - 30, D.AREAS.crypt.cz).id, 'none', 'outside the crypt wall');
});

// ---- pools, foliage field ---------------------------------------------------------------------------------------------------------------

test('the pool never grows, recycles the oldest, and clear() drops everything', () => {
	const retired = [];
	const pool = new FxPool(Array.from({ length: 4 }, (_, i) => ({ id: i })), (it) => retired.push(it.id));
	const ids = [];
	for (let i = 0; i < 10; i++) ids.push(pool.acquire(5).id);
	assert.deepEqual(ids.slice(0, 4), [0, 1, 2, 3]);
	assert.deepEqual(ids.slice(4, 8), [0, 1, 2, 3], 'the oldest is reused first');
	assert.equal(pool.live, 4);
	assert.equal(pool.items.length, 4);
	let seen = 0;
	pool.update(1, () => seen++);
	assert.equal(seen, 4);
	pool.update(5, () => assert.fail('expired items are not updated'));
	assert.equal(pool.live, 0);
	pool.acquire(5);
	pool.clear();
	assert.equal(pool.live, 0);
	assert.ok(pool.items.every((it) => !it.active));
});

class Slot {
	constructor() {
		this.v = [0, 0, 0, 0];
	}
	set(x, z, y, w) {
		this.v = [x, z, y, w];
	}
}

test('foliage field: bounded slots, footsteps fade out, the body eases in and out, clear() stands everything up', () => {
	const slots = Array.from({ length: 8 }, () => new Slot());
	const field = new TrampleField(slots, { lifetime: 1 });
	for (let i = 0; i < 30; i++) field.step(i, 0, 0);
	assert.equal(slots.filter((s) => s.v[3] > 0).length, 7, 'footstep slots are reused, never more');
	field.pushBody(1, 1, 0, 0.9, 0.1);
	assert.ok(slots[0].v[3] > 0 && slots[0].v[3] < 0.9, 'eases in');
	for (let i = 0; i < 60; i++) {
		field.pushBody(1, 1, 0, 0, 0.05);
		field.update(0.05);
	}
	assert.equal(slots.filter((s) => s.v[3] > 0).length, 0, 'everything recovers within the lifetime');
	assert.equal(field.active, false);
	field.step(2, 2, 0, 0.5);
	assert.ok(slots.some((s) => s.v[3] === 0.5), 'gain scales the press');
	field.clear();
	assert.ok(slots.every((s) => s.v[3] === 0));
	assert.equal(field.active, false);
});

// ---- the system, against a fake app -------------------------------------------------------------------------------------------------

function fakeApp({ surfaceAt, mode = 'lab' } = {}) {
	const scene = new THREE.Scene();
	const root = new THREE.Object3D();
	scene.add(root);
	const animator = { dead: false, state: 'walk', current() { return this.state; } };
	const app = {
		listeners: {},
		on(name, fn) { (this.listeners[name] ??= []).push(fn); },
		emit(name, ...a) { for (const fn of this.listeners[name] ?? []) fn(...a); },
		subject: { root, model: {} },
		current: { scene, surfaceAt },
		world: { camera: new THREE.PerspectiveCamera() },
		backend: { prepareObject() {}, compile: async () => {} },
		vfxLab: null,
		gameplay: { active: mode === 'game', player: mode === 'game' ? { dead: false } : null },
		character: {
			active: mode === 'lab',
			height: 1.8,
			rig: null,
			animator,
			settings: { walkSpeed: 1.6, runSpeed: 4, steps: { enabled: true, prints: true, water: true, grass: true, strength: 1 } },
			groundAt: () => 0,
		},
	};
	return { app, root, scene, animator, steps: app.character.settings.steps };
}

/** Advance the system `seconds` of walking along +z at `speed` (the fake app has no animation: the state is set by hand). */
function run(fs, root, { speed = 1.6, seconds = 4 } = {}) {
	for (let i = 0; i < Math.round(seconds / DT); i++) {
		root.position.z += speed * DT;
		fs.update(DT);
	}
}

const soil = (x, z, out) => Object.assign(out, { id: 'soil', soft: 0.6 });

test('system: walking leaves prints at the feet, bounded, then fades out on its own', () => {
	const { app, root } = fakeApp({ surfaceAt: soil });
	const fs = new Footsteps(app);
	run(fs, root, { seconds: 30 });
	const live = fs.info();
	assert.ok(live.prints > 0 && live.prints <= 48, `${live.prints} prints`);
	assert.equal(live.surface, 'soil');
	assert.equal(live.source, 'cadence');
	// stop: nothing new, everything decays by itself (soil prints live 24 s)
	const before = fs.last.count;
	for (let i = 0; i < 60 * 40; i++) fs.update(DT);
	assert.equal(fs.last.count, before, 'standing generates nothing');
	assert.equal(fs.info().prints, 0);
	assert.ok(fs.prints.items.every((it) => !it.mesh.visible));
});

test('system: stone keeps no print dry, a short one wet; packed earth is faint; mud holds longer than soil', () => {
	const run4 = (surface) => {
		const { app, root } = fakeApp({ surfaceAt: (x, z, out) => Object.assign(out, surface) });
		const fs = new Footsteps(app);
		run(fs, root, { seconds: 4 });
		return fs;
	};
	assert.equal(run4({ id: 'stone', soft: 0, wet: 0 }).info().prints, 0);
	const wet = run4({ id: 'stone', soft: 0, wet: 0.9 });
	assert.ok(wet.info().prints > 0);
	assert.ok(wet.prints.items.filter((it) => it.active).every((it) => it.life < 5), 'wet stone dries within seconds');
	const mud = run4({ id: 'mud', soft: 1, wet: 0.8 });
	const dust = run4({ id: 'soil', soft: 0.6, wet: 0 });
	const life = (fs) => Math.max(...fs.prints.items.filter((it) => it.active).map((it) => it.life));
	assert.ok(life(mud) > life(dust));
	assert.equal(run4({ id: 'none' }).info().prints, 0);
});

test('system: open water gets rings and droplets, never a print on the bed', () => {
	const water = (x, z, out) => Object.assign(out, { id: 'water', water: true, waterDepth: 0.3, waterLevel: 0.4, soft: 0 });
	const { app, root } = fakeApp({ surfaceAt: water });
	const fs = new Footsteps(app);
	run(fs, root, { seconds: 3 });
	const info = fs.info();
	assert.equal(info.prints, 0);
	assert.ok(info.rings > 0 && info.flecks > 0);
	for (const it of fs.rings.items.filter((r) => r.active && r.age >= 0)) assert.ok(Math.abs(it.mesh.position.y - 0.412) < 1e-6, 'rings sit on the surface, not the bed');
	assert.ok(info.rings <= 14 && info.flecks <= 28);
});

test('system: entering water splashes once, leaving it makes the boots wet', () => {
	let inWater = false;
	const surface = (x, z, out) => (inWater ? Object.assign(out, { id: 'water', water: true, waterDepth: 0.3, waterLevel: 0, soft: 0 }) : Object.assign(out, { id: 'soil', soft: 0.6 }));
	const { app, root } = fakeApp({ surfaceAt: surface });
	const fs = new Footsteps(app);
	run(fs, root, { seconds: 1.5 });
	assert.equal(fs.info().rings, 0);
	inWater = true;
	run(fs, root, { seconds: 0.25 });
	assert.equal(fs.inWater, true);
	assert.ok(fs.info().flecks >= 6, 'a splash on the way in');
	inWater = false;
	run(fs, root, { seconds: 0.4 });
	assert.equal(fs.inWater, false);
	assert.ok(fs.wetFeet > 0);
	const wetPrintAlpha = (() => {
		run(fs, root, { seconds: 1 });
		return Math.max(...fs.prints.items.filter((it) => it.active).map((it) => it.alpha));
	})();
	assert.ok(wetPrintAlpha > SURFACES.soil.print.alpha * 0.99, 'wet boots press darker');
});

test('system: scene change, Play stop, the switch and a teleport clean up; no stale trail across them', () => {
	const { app, root, animator, steps } = fakeApp({ surfaceAt: soil });
	const fs = new Footsteps(app);
	run(fs, root, { seconds: 3 });
	assert.ok(fs.info().prints > 0 && TRAMPLE.points.some((p) => p.w > 0) && TRAMPLE.params.w === 1);
	// teleport: foliage stands up at once, the old prints stay where they were made, no step covers the jump
	root.position.z += 300;
	fs.update(DT);
	assert.ok(TRAMPLE.points.every((p) => p.w === 0) && TRAMPLE.params.w === 0, 'foliage stands up on a teleport');
	assert.equal(fs.tracker.discontinuities, 1);
	const printsAfterJump = fs.info().prints;
	run(fs, root, { seconds: 2 });
	const near = fs.prints.items.filter((it) => it.active).map((it) => it.mesh.position.z);
	assert.ok(near.some((z) => z > 300) && near.some((z) => z < 10), 'old and new prints, nothing in between');
	assert.ok(near.every((z) => z < 10 || z > 300));
	assert.ok(printsAfterJump > 0);
	// scene change
	app.emit('scene');
	assert.equal(fs.info().prints, 0);
	assert.equal(fs.group.parent, null, 'detached from the old scene');
	assert.ok(TRAMPLE.points.every((p) => p.w === 0));
	// the next scene gets the group again
	const next = new THREE.Scene();
	app.current = { scene: next, surfaceAt: soil };
	run(fs, root, { seconds: 2 });
	assert.equal(fs.group.parent, next);
	assert.ok(fs.info().prints > 0);
	// leaving Play
	app.character.active = false;
	fs.update(DT);
	assert.equal(fs.info().prints, 0);
	assert.equal(fs.info().mode, null);
	assert.ok(TRAMPLE.points.every((p) => p.w === 0));
	// switched off while playing: nothing runs, nothing is built for a fresh app
	const off = fakeApp({ surfaceAt: soil });
	off.steps.enabled = false;
	const idle = new Footsteps(off.app);
	run(idle, off.root, { seconds: 2 });
	assert.equal(idle.group, null, 'disabled: no meshes are even created');
	assert.equal(idle.info().prints, 0);
	// death: no steps while an overlay is playing
	steps.enabled = true;
	app.character.active = true;
	animator.state = 'death';
	const count = fs.last.count;
	run(fs, root, { seconds: 2 });
	assert.equal(fs.last.count, count);
});

test('system: the gameplay core is served the same way', () => {
	const { app, root } = fakeApp({ surfaceAt: soil, mode: 'game' });
	const fs = new Footsteps(app);
	run(fs, root, { seconds: 3, speed: 5.6 });
	assert.equal(fs.info().mode, 'game');
	assert.ok(fs.info().prints > 0);
	app.gameplay.player.dead = true;
	const count = fs.last.count;
	run(fs, root, { seconds: 1, speed: 5.6 });
	assert.equal(fs.last.count, count, 'a dead hero leaves no steps');
});

test('system: the scene without surface data (the studio) shows nothing', () => {
	const { app, root } = fakeApp({ surfaceAt: undefined });
	const fs = new Footsteps(app);
	run(fs, root, { seconds: 4 });
	assert.equal(fs.info().prints + fs.info().rings + fs.info().flecks, 0);
});

// ---- the foot-slide debug marks are opt-in --------------------------------------------------------------------------------------------

test('settings: foot-slide debug marks are off for fresh and already-saved sessions, and an explicit opt-in persists', async () => {
	const store = new Map();
	globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
	try {
		await import('../src/character/controller.js'); // registers the 'character' defaults
		const { Settings } = await import('../src/core/settings.js');
		const key = 'sanctuary-lookdev-lab:settings:v1';
		const load = () => new Settings().adopt('character');

		assert.equal(load().footSlideMarks, false, 'fresh session');
		assert.equal(load().steps.enabled, true, 'environment steps stay on');

		// a session saved when the old default (footprints: true) was in force
		store.set(key, JSON.stringify({ character: { footprints: true, walkSpeed: 2.2 } }));
		const old = load();
		assert.equal(old.footSlideMarks, false, 'the inherited old default does not switch the marks on');
		assert.equal(old.walkSpeed, 2.2, 'other saved values are kept');

		// opting in through the panel (set + save) survives a reload
		const settings = new Settings();
		settings.adopt('character').footSlideMarks = true;
		settings.save();
		assert.equal(load().footSlideMarks, true, 'explicit opt-in persists');
	} finally {
		delete globalThis.localStorage;
	}
});

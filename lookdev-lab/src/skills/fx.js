// Skill VFX library on three.quarks: named effects built from a compact particle-system description, pooled
// (systems are created once per instance and restarted, never rebuilt per cast) and drawn by one
// BatchedRenderer, which merges every system that shares a material + render mode into one draw call.
//
//   const fx = new FxLibrary({ scene, depthTexture });
//   fx.play('fire.explode', position, { dir, scale });          // one-shot, returns to the pool by itself
//   const h = fx.attach('fire.ball', () => projectile.position); // follows a position until h.stop()
//   fx.update(dt);                                              // once per frame, before rendering
//
// Conventions: emitters shoot along local +Z (quarks), so `up()` / `down()` tip them; an effect's root is
// oriented so local +Z is `dir`; `scale` scales sizes and speeds (quarks multiplies them by the emitter's
// world scale) — a stronger version of a skill is the same effect, bigger (legacy/art-direction/07 rule 4).
import * as THREE from 'three';
import {
	BatchedRenderer, ParticleSystem, QuarksLoader, QuarksUtil, RenderMode,
	ConstantValue, IntervalValue, ConstantColor, ColorRange, Gradient, PiecewiseBezier, Bezier,
	ColorOverLife, SizeOverLife, RotationOverLife, Rotation3DOverLife, SpeedOverLife, ApplyForce, Noise, OrbitOverLife,
	TurbulenceField, EmitSubParticleSystem, SubParticleEmitMode, WidthOverLength, FrameOverLife,
	ConeEmitter, SphereEmitter, HemisphereEmitter, CircleEmitter, PointEmitter, GridEmitter, EmitterMode,
	RandomQuatGenerator, AxisAngleGenerator,
	Vector3 as QVector3, Vector4 as QVector4,
} from 'three.quarks';
import { skillTextures } from './textures.js';

// ---------------------------------------------------------------------------------------------------
// Description helpers

const lin = (hex) => {
	const c = new THREE.Color(hex);
	return [c.r, c.g, c.b];
};
const v4 = (hex, a = 1, k = 1) => {
	const [r, g, b] = lin(hex);
	return new QVector4(r * k, g * k, b * k, a);
};
const val = (v) => (Array.isArray(v) ? new IntervalValue(v[0], v[1]) : new ConstantValue(v));
const curve = (a, b, c, d) => new PiecewiseBezier([[new Bezier(a, b, c, d), 0]]);
const gradient = (colors, alphas = [[0, 1], [1, 0]]) => new Gradient(colors.map(([t, hex]) => [new QVector3(...lin(hex)), t]), alphas.map(([t, a]) => [a, t]));
const burst = (count, time = 0) => ({ time, count: new ConstantValue(count), cycle: 1, interval: 0.01, probability: 1 });

// Behaviours
const colorLife = (stops, alphas) => new ColorOverLife(gradient(stops, alphas));
const fade = (alphas = [[0, 1], [1, 0]]) => new ColorOverLife(gradient([[0, '#ffffff'], [1, '#ffffff']], alphas));
const sizeLife = (a, b, c, d) => new SizeOverLife(curve(a, b, c, d));
const speedLife = (a, b, c, d) => new SpeedOverLife(curve(a, b, c, d));
const gravity = (g = 9.8) => new ApplyForce(new QVector3(0, -1, 0), val(g));
const lift = (g) => new ApplyForce(new QVector3(0, 1, 0), val(g));
const noise = (frequency, power) => new Noise(val(frequency), val(power));
const turbulence = (scale, strength, speed = 0.3) => new TurbulenceField(new QVector3(scale, scale, scale), 2, new QVector3(strength, strength * 0.4, strength), new QVector3(speed, speed, speed));
const spin = (a, b) => new RotationOverLife(val(b === undefined ? a : [a, b]));
const orbit = (speed, axis = [0, 1, 0]) => new OrbitOverLife(val(speed), new QVector3(...axis));
const widthLen = (a, b, c, d) => new WidthOverLength(curve(a, b, c, d));
const tumble = (speed) => new Rotation3DOverLife(new AxisAngleGenerator(new QVector3(0.6, 0.8, 0).normalize(), val([-speed, speed])));

const MODES = {
	billboard: RenderMode.BillBoard,
	stretched: RenderMode.StretchedBillBoard,
	horizontal: RenderMode.HorizontalBillBoard,
	vertical: RenderMode.VerticalBillBoard,
	trail: RenderMode.Trail,
	mesh: RenderMode.Mesh,
};

function material(map, blend) {
	return new THREE.MeshBasicMaterial({
		map,
		transparent: blend !== 'opaque',
		blending: blend === 'add' ? THREE.AdditiveBlending : THREE.NormalBlending,
		depthWrite: false,
		depthTest: false,
		side: THREE.DoubleSide,
	});
}

/**
 * One particle system from a short description.
 *   life / speed / size / rot: number or [min, max]; rot: 'quat' for random 3D (mesh mode)
 *   color: '#hex' or ['#a', '#b'] (random between), alpha, hdr (emissive multiplier, feeds bloom)
 *   rate (per second), perMeter (along the emitter's path), bursts: [[count, time], ...]
 *   shape: quarks emitter, map: texture, blend: 'add' | 'alpha', mode: key of MODES, length: stretched
 *   length factor / trail point count, tiles: [u, v] + frames: [first, last] for flipbooks, geometry (mesh)
 */
function ps(d) {
	const color = Array.isArray(d.color)
		? new ColorRange(v4(d.color[0], d.alpha ?? 1, d.hdr ?? 1), v4(d.color[1], d.alpha ?? 1, d.hdr ?? 1))
		: new ConstantColor(v4(d.color ?? '#ffffff', d.alpha ?? 1, d.hdr ?? 1));
	const mode = MODES[d.mode || 'billboard'];
	const params = {
		duration: d.duration ?? 1,
		looping: d.loop ?? true,
		worldSpace: d.local ? false : true,
		startLife: val(d.life ?? 1),
		startSpeed: val(d.speed ?? 0),
		startSize: val(d.size ?? 0.2),
		startRotation: d.rot === 'quat' ? new RandomQuatGenerator() : val(d.rot ?? [0, Math.PI * 2]),
		startColor: color,
		emissionOverTime: val(d.rate ?? 0),
		emissionOverDistance: val(d.perMeter ?? 0),
		emissionBursts: (d.bursts || []).map(([n, t]) => burst(n, t)),
		shape: d.shape ?? new PointEmitter(),
		material: material(d.map, d.blend ?? 'add'),
		renderMode: mode,
		behaviors: d.behaviors || [],
	};
	if (mode === RenderMode.StretchedBillBoard) params.rendererEmitterSettings = { speedFactor: 0, lengthFactor: d.length ?? 0 };
	if (mode === RenderMode.Trail) params.rendererEmitterSettings = { startLength: val(d.length ?? 24), followLocalOrigin: !!d.follow };
	if (mode === RenderMode.Mesh) params.instancingGeometry = d.geometry;
	if (d.tiles) {
		params.uTileCount = d.tiles[0];
		params.vTileCount = d.tiles[1];
		params.blendTiles = true;
		const [a, b] = d.frames ?? [0, d.tiles[0] * d.tiles[1] - 1];
		params.behaviors.push(new FrameOverLife(curve(a, a + (b - a) / 3, a + ((b - a) * 2) / 3, b)));
	}
	const system = new ParticleSystem(params);
	if (d.pos) system.emitter.position.set(...d.pos);
	return system;
}

const up = (s, tilt = 0) => ((s.emitter.rotation.x = -Math.PI / 2 + tilt), s);
const down = (s, tilt = 0) => ((s.emitter.rotation.x = Math.PI / 2 - tilt), s);
/** Spawn `sub` from every particle of `parent` (Birth: emits while the parent lives — trails; Death: a burst where it dies). */
const sub = (parent, child, mode = 'birth') => {
	parent.addBehavior(new EmitSubParticleSystem(parent, true, child.emitter, mode === 'death' ? SubParticleEmitMode.Death : SubParticleEmitMode.Birth));
	return child;
};

// Shared mesh-particle geometry (small chunks for debris, bone splinters).
let rockGeometry = null;
let splinterGeometry = null;
const rock = () => (rockGeometry ??= new THREE.DodecahedronGeometry(0.5, 0));
const splinter = () => (splinterGeometry ??= new THREE.ConeGeometry(0.18, 1, 4).rotateX(Math.PI / 2));

// ---------------------------------------------------------------------------------------------------
// Palettes (legacy/art-direction/07 §4): fire orange → yellow with a white core and black smoke; cold pale blue → white;
// lightning white-blue; poison dirty yellow-green; magic violet; holy gold-white; bone ivory with a dim green.

const FIRE = [[0, '#ffe6a8'], [0.2, '#ffa22e'], [0.5, '#e8480c'], [1, '#2a0601']];
const COLD = [[0, '#ffffff'], [0.4, '#bfe4ff'], [1, '#4a8cff']];
const SHOCK = [[0, '#ffffff'], [0.5, '#bcd2ff'], [1, '#5070ff']];
const TOXIC = [[0, '#e8ff9a'], [0.5, '#8fd42a'], [1, '#3a5a10']];
const HOLY = [[0, '#ffffff'], [0.4, '#fff0b8'], [1, '#ffb43a']];
const MAGIC = [[0, '#ffffff'], [0.4, '#d0b0ff'], [1, '#6a30ff']];
const BONE = [[0, '#fffbe8'], [0.5, '#d8d0b0'], [1, '#6a8a6a']];

// ---------------------------------------------------------------------------------------------------
// Effects: key -> (textures) => [systems]. `loop: false` everywhere = one-shot effect.

export const EFFECTS = {
	// ---- Fire ------------------------------------------------------------------------------------
	'fire.charge': (t) => [
		ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], life: [0.25, 0.4], speed: [0.3, 0.8], size: [0.18, 0.3], hdr: 1.65, rate: 50, shape: new SphereEmitter({ radius: 0.12 }), behaviors: [colorLife(FIRE, [[0, 0], [0.2, 1], [1, 0]]), lift(2)] }),
		ps({ map: t.glow, life: 0.2, size: 0.55, color: '#ffb050', hdr: 2.5, rate: 20 }),
	],
	'fire.ball': (t) => [
		ps({ map: t.glow, life: 0.12, size: 0.9, color: '#ffe0a0', hdr: 4, rate: 40 }),
		ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], life: [0.25, 0.45], speed: [0.2, 0.7], size: [0.35, 0.6], hdr: 1.65, rate: 30, perMeter: 6, shape: new SphereEmitter({ radius: 0.15 }), behaviors: [colorLife(FIRE, [[0, 0], [0.1, 1], [1, 0]]), sizeLife(0.8, 1, 0.8, 0.3)] }),
		ps({ map: t.puff, blend: 'alpha', life: [0.6, 1], speed: [0.2, 0.5], size: [0.4, 0.7], color: '#1a1410', alpha: 0.6, perMeter: 3, shape: new SphereEmitter({ radius: 0.2 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.6), lift(0.6), spin(-0.6, 0.6)] }),
		ps({ map: t.streak, mode: 'stretched', life: [0.3, 0.6], speed: [1, 2.5], size: [0.03, 0.05], color: '#ffc070', hdr: 6, perMeter: 5, shape: new SphereEmitter({ radius: 0.2 }), behaviors: [gravity(3), colorLife(FIRE)] }),
	],
	'fire.explode': (t) => {
		const flames = ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], loop: false, life: [0.4, 0.7], speed: [2, 5], size: [0.6, 1.1], hdr: 1.65, bursts: [[26]], shape: new SphereEmitter({ radius: 0.3 }), behaviors: [colorLife(FIRE, [[0, 1], [0.7, 0.8], [1, 0]]), speedLife(1, 0.3, 0.1, 0.05), sizeLife(0.6, 1, 1.1, 1.2), lift(1.5)] });
		const sparks = ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.4, 0.8], speed: [5, 10], size: [0.03, 0.05], color: '#ffd9a0', hdr: 7, bursts: [[50]], shape: new SphereEmitter({ radius: 0.2 }), behaviors: [gravity(9.8), colorLife(FIRE), speedLife(1, 0.8, 0.6, 0.5)] });
		const flash = ps({ map: t.glow, loop: false, life: 0.25, size: 4.5, color: '#ffc070', hdr: 3, bursts: [[1]], behaviors: [sizeLife(0.5, 1, 1.05, 1.1), fade()] });
		const wave = ps({ map: t.ring, mode: 'horizontal', loop: false, life: 0.45, size: 5, color: '#ff9a40', hdr: 2.5, bursts: [[1]], pos: [0, -0.1, 0], behaviors: [sizeLife(0.1, 0.65, 0.9, 1), colorLife(FIRE)] });
		const smoke = ps({ map: t.puff, blend: 'alpha', loop: false, life: [1.2, 2], speed: [0.6, 1.6], size: [0.8, 1.4], color: '#16110d', alpha: 0.7, bursts: [[10, 0.08]], shape: new SphereEmitter({ radius: 0.4 }), behaviors: [fade([[0, 0], [0.15, 1], [1, 0]]), sizeLife(0.6, 1, 1.4, 1.8), speedLife(1, 0.3, 0.2, 0.1), lift(0.8), spin(-0.5, 0.5)] });
		return [flash, wave, flames, sparks, smoke];
	},
	'fire.wall': (t) => [
		up(ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], life: [0.5, 0.9], speed: [0.8, 1.8], size: [1, 1.6], hdr: 1.43, rate: 150, shape: new GridEmitter({ width: 4.5, height: 0.35, column: 30, row: 3 }), behaviors: [colorLife(FIRE, [[0, 0], [0.12, 1], [0.7, 0.7], [1, 0]]), sizeLife(0.7, 1, 0.85, 0.35), noise(1.5, 0.6)] })),
		up(ps({ map: t.puff, blend: 'alpha', life: [1.4, 2.2], speed: [1, 1.8], size: [0.9, 1.6], color: '#140f0c', alpha: 0.55, rate: 18, pos: [0, 1, 0], shape: new GridEmitter({ width: 4.2, height: 0.3, column: 12, row: 2 }), behaviors: [fade([[0, 0], [0.3, 1], [1, 0]]), sizeLife(0.6, 1, 1.4, 1.9), spin(-0.6, 0.6), turbulence(2, 0.6)] })),
		up(ps({ map: t.streak, mode: 'stretched', life: [0.8, 1.5], speed: [2, 4], size: [0.025, 0.045], color: '#ffc070', hdr: 6, rate: 35, shape: new GridEmitter({ width: 4.5, height: 0.4, column: 20, row: 2 }), behaviors: [noise(3, 2.5), colorLife(FIRE)] })),
	],
	'fire.ground': (t) => [
		up(ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], life: [0.35, 0.6], speed: [0.6, 1.4], size: [0.3, 0.6], hdr: 1.32, rate: 40, shape: new ConeEmitter({ radius: 1.4, angle: 0.15 }), behaviors: [colorLife(FIRE, [[0, 0], [0.15, 1], [1, 0]]), sizeLife(0.8, 1, 0.7, 0.2)] })),
		up(ps({ map: t.puff, blend: 'alpha', life: [1.2, 1.8], speed: [0.6, 1.1], size: [0.6, 1.1], color: '#120e0b', alpha: 0.4, rate: 6, shape: new ConeEmitter({ radius: 1.2, angle: 0.2 }), behaviors: [fade([[0, 0], [0.3, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.7)] })),
	],
	'meteor.target': (t) => [
		ps({ map: t.runes, mode: 'horizontal', life: 0.9, size: 4.2, color: '#ff7a2a', hdr: 1.6, rate: 2.2, pos: [0, 0.05, 0], behaviors: [fade([[0, 0], [0.3, 1], [1, 0]]), spin(0.6), sizeLife(1.1, 1, 0.95, 0.9)] }),
		up(ps({ map: t.glow, life: [0.4, 0.8], speed: [0.5, 1.2], size: [0.06, 0.1], color: '#ffb060', hdr: 4, rate: 25, shape: new ConeEmitter({ radius: 2, thickness: 0.1, angle: 0 }), behaviors: [fade()] })),
	],
	'meteor.fall': (t) => [
		ps({ map: t.glow, life: 0.12, size: 1.6, color: '#ffe8b0', hdr: 4, rate: 40 }),
		ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], life: [0.35, 0.6], speed: [0.2, 0.6], size: [0.7, 1.1], hdr: 1.65, perMeter: 10, shape: new SphereEmitter({ radius: 0.25 }), behaviors: [colorLife(FIRE, [[0, 0], [0.1, 1], [1, 0]]), sizeLife(1, 0.9, 0.6, 0.2)] }),
		ps({ map: t.puff, blend: 'alpha', life: [0.9, 1.4], speed: [0.1, 0.4], size: [0.6, 1.2], color: '#1c1612', alpha: 0.6, perMeter: 4, shape: new SphereEmitter({ radius: 0.3 }), behaviors: [fade([[0, 0], [0.15, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.6), spin(-0.8, 0.8)] }),
	],
	'meteor.impact': (t) => {
		const rocks = up(ps({ map: null, mode: 'mesh', geometry: rock(), blend: 'opaque', loop: false, life: [1, 1.6], speed: [4, 8], size: [0.1, 0.2], rot: 'quat', color: '#3a2a20', bursts: [[12]], shape: new ConeEmitter({ radius: 0.4, angle: Math.PI / 3.2 }), behaviors: [gravity(14), tumble(10)] }));
		const debrisTrail = ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], loop: false, duration: 1.6, life: [0.25, 0.45], size: [0.16, 0.28], hdr: 1.38, rate: 30, behaviors: [colorLife(FIRE), sizeLife(1, 0.7, 0.4, 0)] });
		sub(rocks, debrisTrail, 'birth');
		const ground = up(ps({ map: t.flame, tiles: [4, 4], rot: [-0.3, 0.3], loop: false, life: [0.5, 0.9], speed: [3, 6], size: [0.9, 1.5], hdr: 1.65, bursts: [[30]], pos: [0, 0.2, 0], shape: new HemisphereEmitter({ radius: 0.6 }), behaviors: [colorLife(FIRE, [[0, 1], [0.6, 0.8], [1, 0]]), speedLife(1, 0.25, 0.1, 0.05), sizeLife(0.6, 1, 1.2, 1.3)] }));
		const parts = EFFECTS['fire.explode'](t);
		for (const p of parts) p.emitter.scale.setScalar(1.5);
		const dust = up(ps({ map: t.puff, blend: 'alpha', loop: false, life: [1.4, 2.4], speed: [2, 4], size: [1, 1.8], color: '#2e2620', alpha: 0.65, bursts: [[18]], shape: new CircleEmitter({ radius: 0.8 }), behaviors: [fade([[0, 0], [0.1, 1], [1, 0]]), sizeLife(0.5, 1, 1.4, 1.8), speedLife(1, 0.3, 0.1, 0), spin(-0.5, 0.5)] }));
		return [...parts, ground, rocks, debrisTrail, dust];
	},
	'death.fire': (t) => [
		up(ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.8, 1.4], speed: [1.5, 3.5], size: [0.03, 0.05], color: '#ffb060', hdr: 6, bursts: [[40]], pos: [0, 0.6, 0], shape: new ConeEmitter({ radius: 0.35, angle: 0.5 }), behaviors: [noise(2, 2), colorLife(FIRE)] })),
		up(ps({ map: t.puff, blend: 'alpha', loop: false, life: [1.2, 2], speed: [0.6, 1.2], size: [0.5, 0.9], color: '#2a2420', alpha: 0.6, bursts: [[12]], pos: [0, 0.8, 0], shape: new ConeEmitter({ radius: 0.3, angle: 0.4 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.6)] })),
	],

	// ---- Cold ------------------------------------------------------------------------------------
	'cold.charge': (t) => [
		ps({ map: t.shard, life: [0.25, 0.4], speed: [-1.2, -0.6], size: [0.12, 0.2], color: '#d8f0ff', hdr: 3, rate: 40, shape: new SphereEmitter({ radius: 0.45 }), behaviors: [fade([[0, 0], [0.3, 1], [1, 0]])] }),
		ps({ map: t.glow, life: 0.2, size: 0.5, color: '#a8d8ff', hdr: 2.5, rate: 20 }),
	],
	'cold.orb': (t) => [
		ps({ map: t.glow, life: 0.12, size: 1.1, color: '#e8f6ff', hdr: 4, rate: 40 }),
		// Orbiting shards around the core (local space so they ride along).
		ps({ map: t.shard, local: true, life: [0.4, 0.6], speed: 0, size: [0.2, 0.32], color: '#cfeaff', hdr: 3, rate: 30, shape: new SphereEmitter({ radius: 0.35, thickness: 0.1 }), behaviors: [orbit(9, [0.3, 1, 0.2]), fade([[0, 0], [0.2, 1], [1, 0]]), spin(-6, 6)] }),
		ps({ map: t.puff, life: [0.6, 1], speed: [0.1, 0.3], size: [0.5, 0.9], color: '#7ab4ff', alpha: 0.35, hdr: 1.2, perMeter: 5, shape: new SphereEmitter({ radius: 0.2 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), sizeLife(0.6, 1, 1.2, 1.4), spin(-1, 1)] }),
		// Ice bolts sprayed in a turning spiral (circle emitter in Loop mode) — the frozen orb's signature.
		up(ps({ map: t.shard, mode: 'stretched', life: [0.35, 0.45], speed: [7, 9], size: [0.08, 0.11], color: '#e0f2ff', hdr: 4, length: 2, rate: 34, shape: new CircleEmitter({ radius: 0.15, mode: EmitterMode.Loop, speed: val(1.8) }), behaviors: [colorLife(COLD)] })),
	],
	'cold.burst': (t) => [
		up(ps({ map: t.shard, mode: 'stretched', loop: false, life: [0.4, 0.55], speed: [8, 11], size: [0.08, 0.12], color: '#e8f6ff', hdr: 4, length: 2, bursts: [[48]], shape: new CircleEmitter({ radius: 0.2 }), behaviors: [colorLife(COLD)] })),
		ps({ map: t.ring, mode: 'horizontal', loop: false, life: 0.5, size: 7, color: '#a8d4ff', hdr: 2, bursts: [[1]], behaviors: [sizeLife(0.1, 0.6, 0.9, 1), colorLife(COLD)] }),
		ps({ map: t.glow, loop: false, life: 0.25, size: 3, color: '#cfe8ff', hdr: 2.5, bursts: [[1]], behaviors: [fade()] }),
		up(ps({ map: t.puff, loop: false, life: [0.8, 1.2], speed: [1.5, 3], size: [0.7, 1.2], color: '#8fc0ff', alpha: 0.4, hdr: 1.2, bursts: [[14]], shape: new CircleEmitter({ radius: 0.5 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), speedLife(1, 0.3, 0.1, 0), sizeLife(0.6, 1, 1.3, 1.5)] })),
	],
	blizzard: (t) => {
		const frost = up(ps({ map: t.puff, loop: false, duration: 0.35, life: [0.4, 0.7], speed: [0.4, 1], size: [0.4, 0.7], color: '#a8d0ff', alpha: 0.5, hdr: 1.5, bursts: [[3]], shape: new CircleEmitter({ radius: 0.1 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), sizeLife(0.5, 1, 1.2, 1.3)] }));
		const chips = up(ps({ map: t.shard, loop: false, duration: 0.35, life: [0.25, 0.4], speed: [1.5, 3], size: [0.06, 0.1], color: '#e8f6ff', hdr: 3, bursts: [[4]], shape: new ConeEmitter({ radius: 0.05, angle: 1 }), behaviors: [gravity(9.8), fade()] }));
		// Shards fall 7.5 m at ~12 m/s: their life ends at the ground, where the death sub-emitters burst.
		const shards = down(ps({ map: t.shard, mode: 'stretched', life: 0.62, speed: 12, size: [0.07, 0.11], color: '#d8eeff', hdr: 4, length: 1, rate: 55, pos: [0, 7.5, 0], shape: new ConeEmitter({ radius: 3.2, angle: 0.08 }) }), 0.2);
		sub(shards, frost, 'death');
		sub(shards, chips, 'death');
		const snow = down(ps({ map: t.glow, life: [2.5, 3.5], speed: [1.2, 2], size: [0.05, 0.1], color: '#ffffff', hdr: 2, rate: 140, pos: [0, 6, 0], shape: new ConeEmitter({ radius: 4, angle: 0.4 }), behaviors: [turbulence(3, 1.2), fade([[0, 0], [0.1, 1], [0.85, 1], [1, 0]])] }));
		const mist = up(ps({ map: t.puff, life: [1.2, 1.8], speed: [0.2, 0.5], size: [1.2, 2], color: '#6a9cff', alpha: 0.25, hdr: 1.2, rate: 12, pos: [0, 0.2, 0], shape: new CircleEmitter({ radius: 3 }), behaviors: [fade([[0, 0], [0.3, 1], [1, 0]]), spin(-0.4, 0.4)] }));
		return [shards, frost, chips, snow, mist];
	},
	'death.cold': (t) => [
		ps({ map: null, mode: 'mesh', geometry: splinter(), loop: false, life: [0.8, 1.2], speed: [2.5, 5], size: [0.12, 0.25], rot: 'quat', color: '#cfe8ff', alpha: 0.85, hdr: 1.6, blend: 'alpha', bursts: [[22]], pos: [0, 1, 0], shape: new SphereEmitter({ radius: 0.35 }), behaviors: [gravity(12), tumble(12)] }),
		ps({ map: t.puff, loop: false, life: [0.6, 1], speed: [0.5, 1.2], size: [0.6, 1], color: '#a8d0ff', alpha: 0.45, hdr: 1.3, bursts: [[10]], pos: [0, 1, 0], shape: new SphereEmitter({ radius: 0.4 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.5)] }),
	],

	// ---- Lightning -------------------------------------------------------------------------------
	'shock.charge': (t) => [
		ps({ map: t.streak, mode: 'stretched', life: [0.06, 0.12], speed: [4, 8], size: [0.02, 0.035], color: '#e0ecff', hdr: 6, rate: 120, shape: new SphereEmitter({ radius: 0.1 }) }),
		ps({ map: t.glow, life: [0.05, 0.1], size: [0.3, 0.6], color: '#b8ccff', hdr: 3, rate: 30 }),
	],
	'shock.hit': (t) => [
		ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.15, 0.35], speed: [4, 9], size: [0.025, 0.04], color: '#eef4ff', hdr: 7, bursts: [[30]], shape: new SphereEmitter({ radius: 0.15 }), behaviors: [gravity(6), colorLife(SHOCK)] }),
		ps({ map: t.glow, loop: false, life: 0.18, size: 2.2, color: '#c8d8ff', hdr: 3, bursts: [[1], [1, 0.08]], behaviors: [fade()] }),
	],
	'death.shock': (t) => [
		ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.2, 0.5], speed: [3, 7], size: [0.025, 0.04], color: '#eef4ff', hdr: 7, bursts: [[20], [20, 0.15], [20, 0.3]], pos: [0, 1, 0], shape: new SphereEmitter({ radius: 0.4 }), behaviors: [colorLife(SHOCK)] }),
	],

	// ---- Poison ----------------------------------------------------------------------------------
	'poison.nova': (t) => [
		up(ps({ map: t.puff, loop: false, life: [0.9, 1.2], speed: [6, 7], size: [0.8, 1.3], color: '#8fd42a', alpha: 0.7, hdr: 1.3, bursts: [[60]], pos: [0, 0.4, 0], shape: new CircleEmitter({ radius: 0.3 }), behaviors: [colorLife(TOXIC, [[0, 0], [0.1, 1], [0.7, 0.7], [1, 0]]), speedLife(1, 0.9, 0.75, 0.6), sizeLife(0.6, 1, 1.3, 1.6), spin(-1, 1)] })),
		up(ps({ map: t.glow, loop: false, life: [0.8, 1.2], speed: [5, 7], size: [0.07, 0.12], color: '#c8ff60', hdr: 4, bursts: [[50]], pos: [0, 0.5, 0], shape: new ConeEmitter({ radius: 0.3, angle: 1.35 }), behaviors: [gravity(6), fade([[0, 1], [0.8, 1], [1, 0]])] })),
		ps({ map: t.ring, mode: 'horizontal', loop: false, life: 1.1, size: 14, color: '#7ab020', hdr: 1.6, bursts: [[1]], pos: [0, 0.05, 0], behaviors: [sizeLife(0.05, 0.4, 0.75, 1), colorLife(TOXIC)] }),
	],
	'poison.cloud': (t) => [
		ps({ map: t.puff, blend: 'alpha', life: [2, 3], speed: [0.2, 0.5], size: [1.2, 2.2], color: '#4f8a1e', alpha: 0.55, rate: 26, pos: [0, 0.6, 0], shape: new SphereEmitter({ radius: 1.6, thickness: 0.6 }), behaviors: [turbulence(2.5, 1), sizeLife(0.5, 1, 1.2, 1.4), colorLife([[0, '#c8ff80'], [1, '#406018']], [[0, 0], [0.25, 1], [1, 0]]), spin(-0.5, 0.5)] }),
		ps({ map: t.glow, life: [1.5, 2.5], speed: [0.2, 0.5], size: [0.05, 0.1], color: '#9cff40', hdr: 4, rate: 30, pos: [0, 0.7, 0], shape: new SphereEmitter({ radius: 1.8 }), behaviors: [noise(1, 1.5), lift(0.3), fade([[0, 0], [0.2, 1], [1, 0]])] }),
	],
	'death.poison': (t) => [
		ps({ map: t.glow, loop: false, life: [0.6, 1.1], speed: [1, 2.5], size: [0.08, 0.16], color: '#b8ff50', hdr: 4, bursts: [[30]], pos: [0, 1, 0], shape: new SphereEmitter({ radius: 0.35 }), behaviors: [gravity(5), fade([[0, 1], [0.7, 1], [1, 0]])] }),
		ps({ map: t.puff, blend: 'alpha', loop: false, life: [1, 1.6], speed: [0.4, 1], size: [0.6, 1.1], color: '#4f8a1e', alpha: 0.6, bursts: [[12]], pos: [0, 0.9, 0], shape: new SphereEmitter({ radius: 0.4 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.6)] }),
	],

	// ---- Bone / Necromancer ------------------------------------------------------------------------
	'bone.charge': (t) => [
		ps({ map: t.puff, life: [0.3, 0.5], speed: [-0.8, -0.4], size: [0.25, 0.4], color: '#a8d8b0', alpha: 0.5, hdr: 1.4, rate: 30, shape: new SphereEmitter({ radius: 0.5 }), behaviors: [fade([[0, 0], [0.4, 1], [1, 0]]), spin(-2, 2)] }),
		ps({ map: t.glow, life: 0.2, size: 0.45, color: '#e8f0d8', hdr: 2, rate: 20 }),
	],
	'bone.spear': (t) => [
		ps({ map: t.puff, life: [0.25, 0.45], speed: [0.1, 0.4], size: [0.25, 0.45], color: '#b8e0c0', alpha: 0.45, hdr: 1.3, perMeter: 14, shape: new SphereEmitter({ radius: 0.1 }), behaviors: [fade([[0, 0], [0.15, 1], [1, 0]]), sizeLife(0.6, 1, 1.2, 1.4), spin(-2, 2)] }),
		ps({ map: t.bone, life: [0.3, 0.5], speed: [0.3, 0.8], size: [0.08, 0.14], color: '#fff8e0', hdr: 2, perMeter: 4, shape: new SphereEmitter({ radius: 0.12 }), behaviors: [gravity(4), fade(), spin(-6, 6)] }),
	],
	'bone.hit': (t) => [
		ps({ map: null, mode: 'mesh', geometry: splinter(), blend: 'opaque', loop: false, life: [0.6, 1], speed: [2.5, 5], size: [0.08, 0.16], rot: 'quat', color: '#e8e0c8', bursts: [[16]], shape: new SphereEmitter({ radius: 0.15 }), behaviors: [gravity(12), tumble(14)] }),
		ps({ map: t.puff, blend: 'alpha', loop: false, life: [0.5, 0.9], speed: [0.6, 1.4], size: [0.4, 0.7], color: '#c8c0a8', alpha: 0.6, bursts: [[10]], shape: new SphereEmitter({ radius: 0.2 }), behaviors: [fade([[0, 0], [0.15, 1], [1, 0]]), sizeLife(0.6, 1, 1.3, 1.5), speedLife(1, 0.3, 0.1, 0)] }),
		ps({ map: t.glow, loop: false, life: 0.2, size: 1.4, color: '#d8f0d0', hdr: 2, bursts: [[1]], behaviors: [fade()] }),
	],
	'bone.spirit': (t) => [
		ps({ map: t.glow, life: 0.12, size: 0.7, color: '#d8ffe8', hdr: 3.5, rate: 40 }),
		// One ribbon that follows the head (followLocalOrigin) and drains when the spirit is spent.
		ps({ map: t.glow, mode: 'trail', follow: true, length: 40, life: 30, size: 0.28, color: '#c8ffe0', hdr: 3, bursts: [[1]], loop: false, duration: 30, behaviors: [widthLen(1, 0.75, 0.4, 0), colorLife(BONE, [[0, 1], [1, 1]])] }),
		ps({ map: t.puff, life: [0.4, 0.7], speed: [0.2, 0.5], size: [0.2, 0.35], color: '#80c8a0', alpha: 0.5, hdr: 1.4, perMeter: 8, shape: new SphereEmitter({ radius: 0.1 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), spin(-3, 3)] }),
	],

	// ---- Holy / Paladin ----------------------------------------------------------------------------
	'aura.freeze': (t) => [
		ps({ map: t.runes, mode: 'horizontal', local: true, life: 2.4, size: 3.4, color: '#a8d8ff', hdr: 2, rate: 1.25, pos: [0, 0.04, 0], behaviors: [fade([[0, 0], [0.25, 1], [0.75, 1], [1, 0]]), spin(0.5)] }),
		up(ps({ map: t.glow, local: true, life: [1.4, 2.2], speed: [0.6, 1.1], size: [0.05, 0.1], color: '#e0f0ff', hdr: 4, rate: 40, shape: new ConeEmitter({ radius: 1.4, thickness: 0.12, angle: 0 }), behaviors: [orbit(1.6), fade([[0, 0], [0.15, 1], [1, 0]])] })),
		up(ps({ map: t.shard, local: true, life: [0.8, 1.2], speed: [0.4, 0.8], size: [0.1, 0.16], color: '#cfe8ff', hdr: 2.5, rate: 8, shape: new ConeEmitter({ radius: 1.5, thickness: 0.3, angle: 0 }), behaviors: [orbit(-1), fade([[0, 0], [0.3, 1], [1, 0]]), spin(-2, 2)] })),
	],
	'aura.pulse': (t) => [
		ps({ map: t.ring, mode: 'horizontal', loop: false, life: 0.7, size: 7, color: '#bfe4ff', hdr: 1.8, bursts: [[1]], pos: [0, 0.08, 0], behaviors: [sizeLife(0.3, 0.7, 0.9, 1), colorLife(COLD)] }),
		up(ps({ map: t.puff, loop: false, life: [0.6, 0.9], speed: [2.5, 4], size: [0.4, 0.7], color: '#a8d0ff', alpha: 0.35, hdr: 1.2, bursts: [[16]], pos: [0, 0.2, 0], shape: new CircleEmitter({ radius: 0.6 }), behaviors: [fade([[0, 0], [0.2, 1], [1, 0]]), speedLife(1, 0.5, 0.2, 0)] })),
	],
	'holy.hammer': (t) => [
		ps({ map: t.glow, life: 0.1, size: 0.9, color: '#fff2c0', hdr: 3.5, rate: 40 }),
		ps({ map: t.glow, mode: 'trail', follow: true, length: 22, life: 30, size: 0.22, color: '#ffe8a0', hdr: 3, bursts: [[1]], loop: false, duration: 30, behaviors: [widthLen(1, 0.7, 0.35, 0), colorLife(HOLY, [[0, 1], [1, 1]])] }),
		ps({ map: t.glow, life: [0.3, 0.6], speed: [0.3, 0.8], size: [0.04, 0.08], color: '#fff0b0', hdr: 5, perMeter: 10, shape: new SphereEmitter({ radius: 0.15 }), behaviors: [fade(), gravity(2)] }),
	],
	'holy.hit': (t) => [
		ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.2, 0.4], speed: [3, 6], size: [0.03, 0.05], color: '#fff4d0', hdr: 6, bursts: [[18]], shape: new SphereEmitter({ radius: 0.15 }), behaviors: [colorLife(HOLY)] }),
		ps({ map: t.glow, loop: false, life: 0.2, size: 1.6, color: '#ffe8a8', hdr: 2.5, bursts: [[1]], behaviors: [fade()] }),
	],

	// ---- Magic -------------------------------------------------------------------------------------
	'teleport.out': (t) => [
		up(ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.3, 0.6], speed: [4, 8], size: [0.04, 0.06], color: '#e8d8ff', hdr: 5, bursts: [[40]], shape: new ConeEmitter({ radius: 0.5, angle: 0.08 }), behaviors: [colorLife(MAGIC)] })),
		ps({ map: t.glow, mode: 'vertical', loop: false, life: 0.35, size: 2.6, color: '#b890ff', hdr: 2.5, bursts: [[1]], pos: [0, 1, 0], behaviors: [sizeLife(1, 0.8, 0.5, 0.1), fade()] }),
		ps({ map: t.runes, mode: 'horizontal', loop: false, life: 0.6, size: 2.4, color: '#a070ff', hdr: 2, bursts: [[1]], pos: [0, 0.05, 0], behaviors: [sizeLife(0.6, 1, 1.1, 1.2), fade(), spin(3)] }),
	],
	'teleport.in': (t) => [
		down(ps({ map: t.streak, mode: 'stretched', loop: false, life: [0.2, 0.35], speed: [6, 10], size: [0.04, 0.06], color: '#e8d8ff', hdr: 5, bursts: [[36]], pos: [0, 3, 0], shape: new ConeEmitter({ radius: 0.6, angle: 0.05 }), behaviors: [colorLife(MAGIC)] })),
		ps({ map: t.ring, mode: 'horizontal', loop: false, life: 0.5, size: 3.2, color: '#b890ff', hdr: 2.2, bursts: [[1, 0.2]], pos: [0, 0.05, 0], behaviors: [sizeLife(0.1, 0.7, 0.9, 1), colorLife(MAGIC)] }),
		ps({ map: t.glow, loop: false, life: [0.6, 1], speed: [0.5, 1.5], size: [0.05, 0.09], color: '#d8c0ff', hdr: 4, bursts: [[30, 0.2]], pos: [0, 1, 0], shape: new SphereEmitter({ radius: 0.6 }), behaviors: [fade(), orbit(4)] }),
	],

	// ---- Physical ----------------------------------------------------------------------------------
	'blood.hit': (t) => [
		ps({ map: t.glow, blend: 'alpha', loop: false, life: [0.35, 0.6], speed: [1.5, 3.5], size: [0.05, 0.09], color: '#5a0606', alpha: 0.95, bursts: [[14]], shape: new ConeEmitter({ radius: 0.1, angle: 0.6 }), behaviors: [gravity(12)] }),
	],
};

export const EFFECT_KEYS = Object.keys(EFFECTS);

// ---------------------------------------------------------------------------------------------------
// Runtime

const POOL_MAX = { 'cold.burst': 4, 'fire.explode': 8, 'shock.hit': 12, 'holy.hit': 12, 'bone.hit': 8, 'blood.hit': 12 };
const _q = new THREE.Quaternion();
const _z = new THREE.Vector3(0, 0, 1);

class FxInstance {
	constructor(key, root, systems) {
		this.key = key;
		this.root = root;
		this.systems = systems;
		this.busy = false;
		this.stopping = false;
		this.follow = null;
		this.started = 0;
	}

	get done() {
		for (const s of this.systems) if (s.particleNum > 0 || (!s.emitEnded && !s.onlyUsedByOther)) return false;
		return true;
	}

	/** Stop emitting; trails drain, live particles finish, then the instance goes back to the pool. */
	stop() {
		if (!this.busy || this.stopping) return;
		this.stopping = true;
		this.follow = null;
		for (const s of this.systems) {
			if (!s.emitEnded && !s.onlyUsedByOther) s.endEmit();
			// Trail ribbons with very long lives: kill the head so the ribbon shrinks away.
			if (s.rendererSettings.renderMode === RenderMode.Trail) for (let i = 0; i < s.particleNum; i++) s.particles[i].life = Math.min(s.particles[i].life, s.particles[i].age);
		}
	}
}

export class FxLibrary {
	constructor({ scene, depthTexture = null, soft = true } = {}) {
		this.tex = skillTextures();
		this.batch = new BatchedRenderer();
		this.batch.name = 'Skill VFX (three.quarks)';
		this.container = new THREE.Group();
		this.container.name = 'Skill VFX emitters';
		this.pools = new Map();
		this.active = new Set();
		this.imports = new Set();
		this.depthTexture = depthTexture;
		this.soft = soft;
		this.time = 0;
		this.attachTo(scene);
	}

	attachTo(scene) {
		scene?.add(this.batch, this.container);
		this.applyDepth();
	}

	applyDepth() {
		this.batch.setDepthTexture(this.soft ? this.depthTexture : null);
	}

	/** Soft particles fade into geometry using the scene depth (and hide behind it when the VFX layer has no depth buffer). */
	setSoft(on) {
		this.soft = on;
		for (const pool of this.pools.values()) for (const inst of pool) for (const s of inst.systems) this.configure(s);
		this.applyDepth();
	}

	configure(system) {
		const soft = this.soft && !!this.depthTexture && system.rendererSettings.renderMode !== RenderMode.Mesh;
		if (system.softParticles !== soft) {
			system.softParticles = soft;
			system.softNearFade = 0;
			system.softFarFade = 0.35;
		}
	}

	create(key) {
		const build = EFFECTS[key];
		if (!build) throw new Error(`Unknown effect "${key}"`);
		const systems = build(this.tex);
		const root = new THREE.Group();
		root.name = key;
		root.visible = false;
		for (const s of systems) {
			root.add(s.emitter);
			this.configure(s);
			s.endEmit();
			this.batch.addSystem(s);
		}
		this.container.add(root);
		this.patchBlending();
		return new FxInstance(key, root, systems);
	}

	acquire(key) {
		let pool = this.pools.get(key);
		if (!pool) this.pools.set(key, (pool = []));
		let inst = pool.find((i) => !i.busy);
		if (!inst && pool.length < (POOL_MAX[key] ?? 6)) pool.push((inst = this.create(key)));
		// Pool exhausted: recycle the oldest (its particles are cut short).
		inst ??= pool.reduce((a, b) => (a.started <= b.started ? a : b));
		return inst;
	}

	start(inst, position, { dir = null, scale = 1 } = {}) {
		const { root } = inst;
		root.position.copy(position);
		if (dir && dir.lengthSq() > 1e-8) root.quaternion.copy(_q.setFromUnitVectors(_z, dir.clone().normalize()));
		else root.quaternion.identity();
		root.scale.setScalar(scale);
		root.visible = true;
		root.updateMatrixWorld(true);
		for (const s of inst.systems) {
			s.restart();
			s.emissionState.previousWorldPos = undefined; // no distance-emission burst from the old position
			s.firstTimeUpdate = true;
		}
		inst.busy = true;
		inst.stopping = false;
		inst.started = this.time;
		this.active.add(inst);
		return inst;
	}

	/** One-shot effect at `position`. */
	play(key, position, opts = {}) {
		const inst = this.start(this.acquire(key), position, opts);
		// Finishing from the start: bursts and non-looping parts play out, looping parts (if any) emit nothing.
		for (const s of inst.systems) if (s.looping && !s.onlyUsedByOther) s.endEmit();
		inst.stopping = true;
		return inst;
	}

	/** Continuous effect that follows `getPosition()` (and optionally `getDir()`) until `.stop()`. */
	attach(key, getPosition, { getDir = null, scale = 1 } = {}) {
		const inst = this.start(this.acquire(key), getPosition(), { dir: getDir?.(), scale });
		inst.follow = { getPosition, getDir };
		return inst;
	}

	/** Continuous effect at a fixed spot (fire wall, blizzard). */
	place(key, position, opts = {}) {
		return this.start(this.acquire(key), position, opts);
	}

	/** Play a quarks editor export (three.js Object JSON with ParticleEmitter nodes). Not pooled. */
	loadJSON(json, position) {
		const data = typeof json === 'string' ? JSON.parse(json) : json;
		const object = new QuarksLoader().parse(data);
		const systems = [];
		QuarksUtil.runOnAllParticleEmitters(object, (emitter) => systems.push(emitter.system));
		if (!systems.length) throw new Error('no ParticleEmitter in this file');
		object.position.copy(position);
		this.container.add(object);
		for (const s of systems) {
			this.configure(s);
			s.autoDestroy = true;
			this.batch.addSystem(s);
		}
		this.patchBlending();
		QuarksUtil.play(object);
		const entry = { object, systems, age: 0 };
		this.imports.add(entry);
		return entry;
	}

	/**
	 * The lab composites its VFX layer premultiplied (scene * (1 - a) + rgb): additive batches must not add
	 * alpha, or every glow would darken what is behind it.
	 */
	patchBlending() {
		for (const b of this.batch.batches) {
			const m = b.material;
			if (!m || m.userData.fxBlend === m.blending) continue;
			if (m.blending === THREE.AdditiveBlending) {
				m.blending = THREE.CustomBlending;
				m.blendEquation = THREE.AddEquation;
				m.blendSrc = THREE.SrcAlphaFactor;
				m.blendDst = THREE.OneFactor;
				m.blendSrcAlpha = THREE.ZeroFactor;
				m.blendDstAlpha = THREE.OneFactor;
			}
			m.depthTest = false;
			m.userData.fxBlend = m.blending;
		}
	}

	update(dt) {
		this.time += dt;
		for (const inst of this.active) {
			if (inst.follow) {
				inst.root.position.copy(inst.follow.getPosition());
				const d = inst.follow.getDir?.();
				if (d && d.lengthSq() > 1e-8) inst.root.quaternion.copy(_q.setFromUnitVectors(_z, d.clone().normalize()));
			}
			inst.root.updateMatrixWorld(true);
		}
		this.batch.update(dt);
		for (const inst of this.active) {
			if (inst.stopping && inst.done) {
				inst.busy = false;
				inst.stopping = false;
				inst.root.visible = false;
				for (const s of inst.systems) if (s.onlyUsedByOther) s.emitEnded = true;
				this.active.delete(inst);
			}
		}
		for (const entry of this.imports) {
			entry.age += dt;
			if (entry.systems.every((s) => !this.batch.systemToBatchIndex.has(s))) {
				entry.object.removeFromParent();
				this.imports.delete(entry);
			}
		}
		this.patchBlending();
	}

	get particleCount() {
		let n = 0;
		for (const s of this.batch.systemToBatchIndex.keys()) n += s.particleNum;
		return n;
	}

	get stats() {
		let systems = 0;
		let live = 0;
		for (const s of this.batch.systemToBatchIndex.keys()) {
			systems++;
			if (s.particleNum > 0) live++;
		}
		return { particles: this.particleCount, systems, live, batches: this.batch.batches.filter((b) => b.systems.size).length, instances: this.active.size + this.imports.size };
	}

	/** Stop everything immediately (particles vanish). */
	clear() {
		for (const inst of this.active) {
			for (const s of inst.systems) {
				s.restart();
				s.endEmit();
			}
			inst.busy = false;
			inst.stopping = false;
			inst.follow = null;
			inst.root.visible = false;
		}
		this.active.clear();
		for (const entry of this.imports) {
			for (const s of entry.systems) s.dispose();
			entry.object.removeFromParent();
		}
		this.imports.clear();
	}

	dispose() {
		this.clear();
		for (const pool of this.pools.values()) for (const inst of pool) for (const s of inst.systems) s.dispose();
		this.pools.clear();
		this.batch.removeFromParent();
		this.container.removeFromParent();
	}
}

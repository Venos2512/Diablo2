// Environment interaction of the playing hero: a footprint per real step on the ground that holds one (soil, mud, sand, snow, dust, wet stone), ripples and a
// small splash on open water, and a bend of the grass / foliage round the body and the last footsteps (the wind effect's foot bend, core/trample.js).
//   when     character/stepper.js: one event per stride walked (alternating feet), or per foot plant when the rig's plants are believable; none while
//            standing, attacking, hit, dead, against a wall, or across a teleport
//   where    the scene's own data (scene.surfaceAt, env/surfaces.js): splat / layer weights, paths, ponds and creeks - never a guess from a name
//   how      pooled meshes (prints, rings, droplets) with fixed counts, no shadows, no textures, no render targets; everything fades by itself and is dropped on
//            scene change, Play start / stop and teleports. Off (Character tab → Environment interaction) = nothing runs.
// Works for both Play modes (the lab controller and the gameplay core): it only reads the preview character's world position, its animation state and its feet.
import * as THREE from 'three';
import { StepTracker } from './stepper.js';
import { TrampleField } from './trampleField.js';
import { FxPool } from './fxPool.js';
import { TRAMPLE } from '../core/trample.js';
import { SURFACES, newSample, resetSample } from '../env/surfaces.js';

const PRINTS = 48;
const RINGS = 14;
const FLECKS = 28;
const QUERY_EVERY = 0.12; // s between the body's water queries while moving
const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3();
const _f = new THREE.Vector3();
const _n = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (e0, e1, x) => {
	const t = clamp01((x - e0) / (e1 - e0));
	return t * t * (3 - 2 * t);
};
const rand = (a, b) => a + Math.random() * (b - a);

/** Boot sole lying on the ground (toe towards +z, a right foot): forefoot and heel with the arch between, ~0.27 x 0.1 m. No texture. */
function soleGeometry() {
	const fore = new THREE.Shape();
	fore.absellipse(0.006, -0.077, 0.046, 0.06, 0, Math.PI * 2, false); // y is minus z: the toe points to -y here
	const heel = new THREE.Shape();
	heel.absellipse(0, 0.078, 0.035, 0.046, 0, Math.PI * 2, false);
	const g = new THREE.ShapeGeometry([fore, heel], 14);
	g.rotateX(-Math.PI / 2);
	return g;
}

function basic(name, extra) {
	return new THREE.MeshBasicMaterial({ name, transparent: true, depthWrite: false, ...extra });
}

export class Footsteps {
	constructor(app) {
		this.app = app;
		this.tracker = new StepTracker();
		this.field = new TrampleField(TRAMPLE.points);
		this.group = null;
		this.attachedTo = null;
		this.prints = null;
		this.rings = null;
		this.flecks = null;
		this.sample = newSample();
		this.bodySample = newSample();
		this.mode = null; // 'lab' | 'game' | null
		this.inWater = false;
		this.wetFeet = 0;
		this.queryT = 0;
		this.discontinuities = 0;
		this.warm = 0;
		this.last = { id: 'none', source: '-', count: 0, water: false };
		app.on('update', (dt) => this.update(dt));
		app.on('scene', () => this.onScene());
	}

	get settings() {
		return this.app.character?.settings?.steps;
	}

	/** Live numbers for the panel and runtime checks. */
	info() {
		return {
			mode: this.mode,
			enabled: !!this.settings?.enabled,
			surface: this.last.id,
			source: this.last.source,
			steps: this.last.count,
			prints: this.prints?.live ?? 0,
			rings: this.rings?.live ?? 0,
			flecks: this.flecks?.live ?? 0,
			bending: this.field.active,
			water: this.inWater,
			speed: this.tracker.speed,
			teleports: this.tracker.discontinuities,
		};
	}

	// ----------------------------------------------------------------------------------------------
	// Lifecycle

	playingMode() {
		const app = this.app;
		if (app.gameplay?.active && app.gameplay.player) return 'game';
		if (app.character?.active && app.subject.model) return 'lab';
		return null;
	}

	onScene() {
		this.clear();
		this.tracker.resync();
		this.detach();
		this.mode = null;
	}

	/** Drop every live effect and let the foliage stand up (scene change, Play start / stop, switching the feature off). */
	clear() {
		this.prints?.clear();
		this.rings?.clear();
		this.flecks?.clear();
		this.field.clear();
		TRAMPLE.params.w = 0;
		this.inWater = false;
		this.wetFeet = 0;
		this.queryT = 0;
	}

	detach() {
		this.group?.removeFromParent();
		this.attachedTo = null;
	}

	attach() {
		const scene = this.app.current?.scene;
		if (!scene || this.attachedTo === scene) return;
		this.group.removeFromParent();
		scene.add(this.group);
		this.attachedTo = scene;
		this.app.backend.prepareObject?.(this.group);
		this.warm = 2;
		this.warmUp(true);
		Promise.resolve(this.app.backend.compile?.(this.group, this.app.world.camera)).catch(() => {}); // link the three materials now, not on the first step
	}

	/** One item of each pool drawn (invisibly small) for a frame, so the programs exist before the first step. */
	warmUp(on) {
		for (const pool of [this.prints, this.rings, this.flecks]) {
			const it = pool.items[0];
			if (it.active) continue;
			it.mesh.visible = on;
			if (on) it.mesh.scale.setScalar(1e-4);
		}
	}

	ensureGroup() {
		if (this.group) return;
		const group = (this.group = new THREE.Group());
		group.name = 'Footsteps (environment interaction)';
		const flag = (o) => {
			o.userData.labNoPick = o.userData.labNoCollide = o.userData.labNoView = true;
			return o;
		};
		flag(group);
		this.geometry = { sole: soleGeometry(), ring: new THREE.RingGeometry(0.88, 1, 40).rotateX(-Math.PI / 2), fleck: new THREE.IcosahedronGeometry(1, 1) };
		const decal = { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 };
		const make = (geometry, material, order) => {
			const mesh = flag(new THREE.Mesh(geometry, material));
			mesh.visible = false;
			mesh.castShadow = mesh.receiveShadow = false;
			mesh.renderOrder = order;
			group.add(mesh);
			return mesh;
		};
		const hide = (it) => {
			it.mesh.visible = false;
		};
		this.prints = new FxPool(Array.from({ length: PRINTS }, () => ({ mesh: make(this.geometry.sole, basic('Footprint', decal), 5), alpha: 0 })), hide);
		this.rings = new FxPool(Array.from({ length: RINGS }, () => ({ mesh: make(this.geometry.ring, basic('Water ripple', { ...decal, color: 0xbfd2d8 }), 6), alpha: 0, r0: 0, r1: 1, delay: 0 })), hide);
		this.flecks = new FxPool(
			Array.from({ length: FLECKS }, () => ({ mesh: make(this.geometry.fleck, basic('Splash / dust', {}), 7), alpha: 0, vx: 0, vy: 0, vz: 0, g: 0, s0: 0.02, s1: 0.02, floor: -Infinity, drag: 0 })),
			hide,
		);
	}

	dispose() {
		this.clear();
		this.detach();
		for (const pool of [this.prints, this.rings, this.flecks]) for (const it of pool?.items ?? []) it.mesh.material.dispose();
		for (const g of Object.values(this.geometry ?? {})) g.dispose();
		this.group = null;
	}

	// ----------------------------------------------------------------------------------------------
	// Frame

	update(rawDt) {
		const s = this.settings;
		const mode = this.playingMode();
		if (!s?.enabled || !mode) {
			if (this.mode || this.field.active) {
				this.clear();
				this.tracker.resync();
				this.detach(); // not playing: nothing of ours stays in the scene
				this.mode = null;
			}
			return;
		}
		const app = this.app;
		const ctrl = app.character;
		const dt = Math.min(rawDt, 0.05) * (app.vfxLab?.settings.timeScale ?? 1); // the same clamp as both Play cores, so speed = displacement / dt holds
		if (!(dt > 0)) return;
		const root = app.subject.root;
		root.getWorldPosition(_p);
		if (mode !== this.mode) {
			// Play started (or switched core): a clean slate, the character is placed by the mode itself; standing in water at the start is no splash
			this.clear();
			this.tracker.reset();
			this.mode = mode;
			this.discontinuities = 0;
			this.ensureGroup();
			this.inWater = this.querySample(_p.x, _p.z, this.bodySample).water;
		}
		if (this.attachedTo !== app.current?.scene) this.attach();
		if (this.warm > 0 && --this.warm === 0) this.warmUp(false);

		const tracker = this.tracker;
		tracker.height = ctrl.height || 1.8;
		tracker.runSpeed = mode === 'game' ? 3.2 : Math.max(2.4, (ctrl.settings.walkSpeed + ctrl.settings.runSpeed) / 2);
		const dead = ctrl.animator.dead || (mode === 'game' && app.gameplay.player.dead);
		const anim = ctrl.animator.current();
		const locomotion = !dead && (anim === 'walk' || anim === 'run');
		const feet = locomotion ? this.readFeet(ctrl, _p) : null;
		const events = tracker.update({ dt, x: _p.x, z: _p.z, locomotion, feet });

		if (tracker.discontinuities !== this.discontinuities) {
			// teleport / hitch: the foliage stands up, the water state is re-read without a splash
			this.discontinuities = tracker.discontinuities;
			this.field.clear();
			TRAMPLE.params.w = 0;
			this.queryT = 0;
			this.inWater = this.app.current?.surfaceAt ? this.querySample(_p.x, _p.z, this.bodySample).water : false;
		}
		if (this.wetFeet > 0) this.wetFeet = Math.max(0, this.wetFeet - dt);

		if (tracker.moving) this.trackWater(_p, dt);
		for (let i = 0; i < events.length; i++) this.onStep(events[i], _p.y, s);

		// foliage: the body pushes through while it moves, footsteps stay pressed a moment
		if (s.grass) {
			if (tracker.moving || this.field.active) {
				const target = tracker.moving && !this.inWater ? smooth(0.4, 3, tracker.speed) * 0.9 * s.strength : 0;
				this.field.pushBody(_p.x, _p.z, _p.y, target, dt);
				this.field.update(dt);
			}
		} else if (this.field.active) this.field.clear();

		TRAMPLE.params.w = this.field.active ? 1 : 0;
		this.animate(dt);
	}

	/** Left / right foot of the rig: height above the character's ground and position along the heading (for the plant detector). Null without both feet. */
	readFeet(ctrl, p) {
		const rig = ctrl.rig;
		const left = rig?.left?.toe || rig?.left?.foot;
		const right = rig?.right?.toe || rig?.right?.foot;
		if (!left || !right) return null;
		const t = this.tracker;
		const out = (this._feet ??= [{ height: 0, along: 0, x: 0, z: 0 }, { height: 0, along: 0, x: 0, z: 0 }]);
		[left, right].forEach((bone, i) => {
			bone.getWorldPosition(_f);
			const o = out[i];
			o.height = _f.y - p.y;
			o.along = (_f.x - p.x) * t.hx + (_f.z - p.z) * t.hz;
			o.x = _f.x;
			o.z = _f.z;
		});
		return out;
	}

	querySample(x, z, out) {
		const scene = this.app.current;
		resetSample(out);
		if (scene?.surfaceAt) scene.surfaceAt(x, z, out);
		return out;
	}

	/** Entering / leaving open water: a splash on the way in, wet boots on the way out. Queried a few times a second, not every frame. */
	trackWater(p, dt) {
		this.queryT -= dt;
		if (this.queryT > 0) return;
		this.queryT = QUERY_EVERY;
		const q = this.querySample(p.x, p.z, this.bodySample);
		if (q.water === this.inWater) return;
		this.inWater = q.water;
		const s = this.settings;
		if (q.water) {
			if (s.water) this.splashBurst(p.x, p.z, q);
		} else this.wetFeet = 2.4;
	}

	// ----------------------------------------------------------------------------------------------
	// One step

	onStep(ev, bodyY, s) {
		const ctrl = this.app.character;
		const scale = (ctrl.height || 1.8) / 1.8;
		const q = this.querySample(ev.x, ev.z, this.sample);
		this.last = { id: q.id, source: ev.source, count: this.last.count + 1, water: q.water };
		if (q.id === 'none') return;
		if (q.water) {
			if (s.water) this.ripple(ev, q, scale, s.strength);
			return;
		}
		const ground = ctrl.groundAt(ev.x, ev.z, bodyY);
		if (s.prints) this.print(ev, q, scale, s.strength, ground);
		if (s.grass) this.field.step(ev.x, ev.z, ground, Math.min(1, 0.45 + q.grass) * Math.min(1.2, s.strength));
	}

	print(ev, q, scale, strength, ground) {
		const def = SURFACES[q.id] ?? SURFACES.none;
		let spec = def.print;
		let alpha;
		let life;
		if (spec) {
			// a blended border (soil next to stone) leaves a weaker print than the middle of the surface; wet ground holds it deeper and longer
			const blend = def.soft > 0 ? clamp01(q.soft / def.soft) : 1;
			alpha = spec.alpha * (0.35 + 0.65 * blend) * (1 + 0.35 * q.wet);
			life = spec.life * (1 + 0.5 * q.wet);
			if (this.wetFeet > 0) alpha *= 1 + 0.3 * Math.min(1, this.wetFeet);
		} else if (def.wetPrint && (q.wet >= 0.55 || this.wetFeet > 0)) {
			// hard ground keeps nothing, unless it is wet or the boots are: a dark print that dries within seconds
			spec = def.wetPrint;
			alpha = spec.alpha * Math.max(q.wet, Math.min(1, this.wetFeet));
			life = spec.life * (this.wetFeet > 0 ? Math.min(1, 0.4 + this.wetFeet / 2) : 1);
		} else return;
		alpha *= strength * (ev.run ? 0.9 : 1);
		if (alpha < 0.03) return;

		// the sole lies on the ground, tilted to its slope
		const e = 0.12 * scale;
		const ctrl = this.app.character;
		const gx = ctrl.groundAt(ev.x + e, ev.z, ground);
		const gz = ctrl.groundAt(ev.x, ev.z + e, ground);
		_n.set(-(gx - ground) / e, 1, -(gz - ground) / e).normalize();
		if (_n.y < 0.55) return; // a cliff face keeps no print
		const it = this.prints.acquire(life);
		const toeOut = ev.side === 0 ? 0.1 : -0.1;
		_q.setFromAxisAngle(UP, ev.yaw + toeOut);
		_q2.setFromUnitVectors(UP, _n);
		it.mesh.quaternion.copy(_q2).multiply(_q);
		it.mesh.position.set(ev.x, ground + 0.014 + (spec.lift || 0) + 0.03 * (1 - _n.y), ev.z);
		const k = scale * spec.scale;
		it.mesh.scale.set((ev.side === 0 ? -1 : 1) * k, 1, k * (ev.run ? 1.1 : 1));
		it.mesh.material.color.setRGB(spec.tint[0], spec.tint[1], spec.tint[2]);
		it.mesh.material.opacity = it.alpha = alpha;
		it.mesh.visible = true;
		if (def.puff && (q.wet < 0.85 || q.id === 'mud')) this.puff(ev, def.puff, scale, ground, ev.run ? 1.5 : 1);
	}

	/** A few flecks kicked up by a soft surface (dust, mud, snow, sand). */
	puff(ev, spec, scale, ground, boost) {
		const n = Math.round(spec.count * boost);
		for (let i = 0; i < n; i++) {
			const it = this.flecks.acquire(spec.life * rand(0.8, 1.2));
			it.s0 = spec.size * scale * rand(0.5, 0.8);
			it.s1 = spec.size * scale * rand(1.5, 2.4);
			it.vx = rand(-0.25, 0.25);
			it.vz = rand(-0.25, 0.25);
			it.vy = rand(0.12, 0.3);
			it.g = 0;
			it.drag = 3;
			it.floor = -Infinity;
			it.alpha = 0.42;
			it.mesh.position.set(ev.x + rand(-0.05, 0.05), ground + 0.03, ev.z + rand(-0.05, 0.05));
			it.mesh.scale.setScalar(it.s0);
			it.mesh.material.color.setRGB(spec.color[0], spec.color[1], spec.color[2]);
			it.mesh.material.opacity = it.alpha;
			it.mesh.visible = true;
		}
	}

	/** Two expanding rings on the water surface (never on the bed) and a few droplets; deeper water, a running step and a bigger hero make larger rings. */
	ripple(ev, q, scale, strength) {
		const depth = clamp01(q.waterDepth / 0.5);
		const r1 = scale * (0.5 + 0.4 * depth) * (ev.run ? 1.3 : 1);
		this.ring(ev.x, ev.z, q.waterLevel, 0.08 * scale, r1, 1.1, 0.5 * strength, 0);
		this.ring(ev.x, ev.z, q.waterLevel, 0.05 * scale, r1 * 0.72, 0.95, 0.34 * strength, 0.13);
		this.droplets(ev.x, ev.z, q.waterLevel, (ev.run ? 5 : 3) + Math.round(depth * 2), scale, 1);
	}

	/** Walking into the water: a wider ring pair and a splash. */
	splashBurst(x, z, q) {
		const scale = (this.app.character.height || 1.8) / 1.8;
		const strength = this.settings.strength;
		this.ring(x, z, q.waterLevel, 0.12 * scale, 1.2 * scale, 1.3, 0.6 * strength, 0);
		this.ring(x, z, q.waterLevel, 0.08 * scale, 0.85 * scale, 1.1, 0.4 * strength, 0.16);
		this.droplets(x, z, q.waterLevel, 8, scale, 1.4);
	}

	ring(x, z, level, r0, r1, life, alpha, delay) {
		const it = this.rings.acquire(life + delay);
		it.age = -delay;
		it.r0 = r0;
		it.r1 = r1;
		it.alpha = alpha;
		it.delay = delay;
		it.mesh.position.set(x, level + 0.012, z);
		it.mesh.scale.setScalar(r0);
		it.mesh.material.opacity = 0;
		it.mesh.visible = false; // shown once its delay has passed
	}

	droplets(x, z, level, count, scale, power) {
		for (let i = 0; i < count; i++) {
			const it = this.flecks.acquire(rand(0.38, 0.62));
			const a = rand(0, Math.PI * 2);
			const out = rand(0.25, 0.7) * power * scale;
			it.vx = Math.cos(a) * out;
			it.vz = Math.sin(a) * out;
			it.vy = rand(1.0, 1.9) * power;
			it.g = 9.8;
			it.drag = 0.4;
			it.floor = level;
			it.s0 = it.s1 = rand(0.011, 0.022) * scale;
			it.alpha = 0.75;
			it.mesh.position.set(x + rand(-0.06, 0.06), level + 0.02, z + rand(-0.06, 0.06));
			it.mesh.scale.setScalar(it.s0);
			it.mesh.material.color.setRGB(0.62, 0.72, 0.76);
			it.mesh.material.opacity = it.alpha;
			it.mesh.visible = true;
		}
	}

	// ----------------------------------------------------------------------------------------------
	// Fade and motion of the live effects

	animate(dt) {
		if (!this.group) return;
		this.prints.update(dt, (it, t) => {
			// the print holds, then fades over the last 40 % of its life
			it.mesh.material.opacity = it.alpha * (1 - smooth(0.6, 1, t));
		});
		this.rings.update(dt, (it) => {
			if (it.age < 0) return;
			const t = clamp01(it.age / (it.life - it.delay));
			it.mesh.visible = true;
			it.mesh.scale.setScalar(it.r0 + (it.r1 - it.r0) * (1 - (1 - t) * (1 - t)));
			it.mesh.material.opacity = it.alpha * Math.pow(1 - t, 1.5);
		});
		this.flecks.update(dt, (it, t) => {
			const m = it.mesh;
			it.vy -= it.g * dt;
			const damp = Math.exp(-it.drag * dt);
			it.vx *= damp;
			it.vz *= damp;
			if (!it.g) it.vy *= damp;
			m.position.x += it.vx * dt;
			m.position.y += it.vy * dt;
			m.position.z += it.vz * dt;
			if (m.position.y < it.floor) {
				it.age = it.life; // back in the water: gone with the next update
				m.visible = false;
				return;
			}
			m.scale.setScalar(it.s0 + (it.s1 - it.s0) * t);
			m.material.opacity = it.alpha * (1 - t) * (1 - t);
		});
	}
}

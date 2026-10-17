// CPU-simulated particle emitters. Each emitter is one instanced quad draw in the VFX layer; all emitters
// share one material (GLSL ShaderMaterial or TSL node material from the backend), so every particle in
// the lab costs one program. Simulation is plain JS (cheap for the few thousand particles spells need);
// the WebGPU compute field (backends/webgpu/vfx.js) shows the GPU-simulated alternative.
import * as THREE from 'three';

export const SHAPES = { soft: 0, smoke: 1, spark: 2, ring: 3, flare: 4, splat: 5, shard: 6 };
export const ALIGN = { camera: 0, ground: 1, velocity: 2 };

const TAU = Math.PI * 2;
const _v = new THREE.Vector3();
const _c = new THREE.Color();

const lerp = (a, b, t) => a + (b - a) * t;
const range = (r, rnd) => (Array.isArray(r) ? lerp(r[0], r[1], rnd()) : r);

/** Colour stops [[t, '#hex', intensity], ...] → sampler(t, out) in linear HDR. */
function gradient(stops) {
	const list = stops.map(([t, hex, k = 1]) => ({ t, c: new THREE.Color(hex).multiplyScalar(k) }));
	return (t, out) => {
		if (t <= list[0].t) return out.copy(list[0].c);
		for (let i = 1; i < list.length; i++) {
			if (t <= list[i].t) {
				const a = list[i - 1];
				const b = list[i];
				return out.copy(a.c).lerp(b.c, (t - a.t) / Math.max(1e-6, b.t - a.t));
			}
		}
		return out.copy(list[list.length - 1].c);
	};
}

const DEFAULTS = {
	max: 256,
	shape: 'soft',
	align: 'camera',
	additive: 1, // 1 = additive glow, 0 = alpha blended (smoke, blood)
	softness: 0.15, // depth fade distance against the scene (m)
	rate: 0, // particles per second while active
	burst: 0, // particles emitted once at start
	duration: Infinity, // seconds the emitter keeps spawning (rate)
	life: [0.6, 1.0],
	speed: [0.5, 1.0],
	direction: [0, 1, 0],
	spread: 0.4, // cone half-angle (rad); 'radial' emitters ignore it
	radial: false, // velocity points away from the emitter centre (novas, explosions)
	planar: false, // radial velocity stays horizontal
	gravity: [0, 0, 0],
	drag: 0,
	swirl: 0, // rad/s orbit around the emitter's vertical axis
	turbulence: 0,
	emitShape: 'point', // point | sphere | disc | ring | line
	radius: 0,
	size: [0.2, 0.2], // start, end (m)
	sizeRandom: 0.3,
	stretch: 0, // align 'velocity': seconds of velocity added to the length
	spin: [-1, 1],
	alpha: 1,
	fadeIn: 0.1, // fraction of life
	fadeOut: 0.4,
	colors: [[0, '#ffffff', 1]],
	inherit: 0, // fraction of the emitter's own velocity given to new particles
	frozen: false, // particles do not move (velocity only orients / stretches them)
};

export class Emitter {
	constructor(system, config) {
		const cfg = (this.cfg = { ...DEFAULTS, ...config });
		this.system = system;
		this.capacity = cfg.max;
		this.position = new THREE.Vector3().fromArray(config.position || [0, 0, 0]);
		this.lastPosition = this.position.clone();
		this.velocity = new THREE.Vector3();
		this.direction = new THREE.Vector3().fromArray(cfg.direction).normalize();
		this.lineEnd = config.lineEnd ? new THREE.Vector3().fromArray(config.lineEnd) : null;
		this.gravity = new THREE.Vector3().fromArray(cfg.gravity);
		this.color = gradient(cfg.colors);
		this.shapeCode = SHAPES[cfg.shape] ?? 0;
		this.alignCode = ALIGN[cfg.align] ?? 0;
		this.age = 0;
		this.spawnCarry = 0;
		this.alive = 0;
		this.active = true;
		this.scale = 1; // global size multiplier (e.g. growing novas)
		this.rnd = Math.random;

		const n = this.capacity;
		this.sim = {
			pos: new Float32Array(n * 3),
			vel: new Float32Array(n * 3),
			age: new Float32Array(n),
			life: new Float32Array(n),
			size: new Float32Array(n),
			rot: new Float32Array(n),
			spin: new Float32Array(n),
			seed: new Float32Array(n),
		};

		const base = new THREE.PlaneGeometry(1, 1);
		const g = new THREE.InstancedBufferGeometry();
		g.index = base.index;
		g.setAttribute('position', base.attributes.position);
		g.setAttribute('uv', base.attributes.uv);
		const attr = (size) => {
			const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size);
			a.setUsage(THREE.DynamicDrawUsage);
			return a;
		};
		this.attrs = { iPosition: attr(3), iVelocity: attr(3), iColor: attr(4), iParams: attr(4), iStyle: attr(4) };
		for (const [name, a] of Object.entries(this.attrs)) g.setAttribute(name, a);
		g.instanceCount = 0;
		this.geometry = g;
		this.mesh = new THREE.Mesh(g, system.material);
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = config.renderOrder ?? (cfg.additive < 1 ? 8 : 10);
		this.mesh.name = config.name || `Emitter · ${cfg.shape}`;
		this.mesh.userData.labNoView = true;
		if (cfg.burst) this.emit(cfg.burst);
	}

	/** Move the emitter (velocity is derived for `inherit` and for trails along the path). */
	moveTo(position) {
		this.position.copy(position);
	}

	emit(count, at = null) {
		for (let i = 0; i < count && this.alive < this.capacity; i++) this.spawn(at, i / Math.max(1, count));
	}

	spawn(at, along = 0) {
		const cfg = this.cfg;
		const rnd = this.rnd;
		const i = this.alive++;
		const { pos, vel, age, life, size, rot, spin, seed } = this.sim;
		// Spawn point (trails interpolate between last and current position so fast emitters stay continuous).
		const origin = at || _v.copy(this.lastPosition).lerp(this.position, along === 0 ? rnd() : along);
		let ox = 0;
		let oy = 0;
		let oz = 0;
		if (cfg.emitShape === 'sphere') {
			const u = rnd() * 2 - 1;
			const a = rnd() * TAU;
			const r = cfg.radius * Math.cbrt(rnd());
			const s = Math.sqrt(1 - u * u);
			ox = Math.cos(a) * s * r;
			oy = u * r;
			oz = Math.sin(a) * s * r;
		} else if (cfg.emitShape === 'disc' || cfg.emitShape === 'ring') {
			const a = rnd() * TAU;
			const r = cfg.emitShape === 'ring' ? cfg.radius : cfg.radius * Math.sqrt(rnd());
			ox = Math.cos(a) * r;
			oz = Math.sin(a) * r;
		} else if (cfg.emitShape === 'line' && this.lineEnd) {
			const t = rnd();
			ox = (this.lineEnd.x - origin.x) * t;
			oy = (this.lineEnd.y - origin.y) * t;
			oz = (this.lineEnd.z - origin.z) * t;
		}
		const sc = this.scale;
		pos[i * 3] = origin.x + ox * sc;
		pos[i * 3 + 1] = origin.y + oy * sc;
		pos[i * 3 + 2] = origin.z + oz * sc;
		// Velocity: cone around `direction`, or radial from the centre.
		const speed = range(cfg.speed, rnd);
		let dx;
		let dy;
		let dz;
		if (cfg.radial) {
			dx = ox;
			dy = cfg.planar ? 0 : oy;
			dz = oz;
			const len = Math.hypot(dx, dy, dz);
			if (len < 1e-5) {
				const a = rnd() * TAU;
				dx = Math.cos(a);
				dz = Math.sin(a);
				dy = cfg.planar ? 0 : rnd() * 2 - 1;
			}
			const l = Math.hypot(dx, dy, dz) || 1;
			dx /= l;
			dy /= l;
			dz /= l;
			if (!cfg.planar && cfg.spread) dy += (rnd() - 0.3) * cfg.spread;
		} else {
			const d = this.direction;
			const theta = rnd() * TAU;
			const phi = Math.acos(1 - rnd() * (1 - Math.cos(cfg.spread)));
			// Orthonormal basis around d.
			const tx = Math.abs(d.y) < 0.99 ? -d.z : 1;
			const ty = Math.abs(d.y) < 0.99 ? 0 : 0;
			const tz = Math.abs(d.y) < 0.99 ? d.x : 0;
			const tl = Math.hypot(tx, ty, tz) || 1;
			const ax = tx / tl;
			const ay = ty / tl;
			const az = tz / tl;
			const bx = d.y * az - d.z * ay;
			const by = d.z * ax - d.x * az;
			const bz = d.x * ay - d.y * ax;
			const sp = Math.sin(phi);
			dx = d.x * Math.cos(phi) + (ax * Math.cos(theta) + bx * Math.sin(theta)) * sp;
			dy = d.y * Math.cos(phi) + (ay * Math.cos(theta) + by * Math.sin(theta)) * sp;
			dz = d.z * Math.cos(phi) + (az * Math.cos(theta) + bz * Math.sin(theta)) * sp;
		}
		vel[i * 3] = dx * speed + this.velocity.x * cfg.inherit;
		vel[i * 3 + 1] = dy * speed + this.velocity.y * cfg.inherit;
		vel[i * 3 + 2] = dz * speed + this.velocity.z * cfg.inherit;
		age[i] = 0;
		life[i] = range(cfg.life, rnd);
		size[i] = 1 + (rnd() * 2 - 1) * cfg.sizeRandom;
		rot[i] = rnd() * TAU;
		spin[i] = range(cfg.spin, rnd);
		seed[i] = rnd();
	}

	/** Add one particle with explicit state (lightning segments, scripted effects). */
	add({ position, velocity = null, life = 1, size = 1, rotation = 0, spin = 0, seed = Math.random() }) {
		if (this.alive >= this.capacity) return -1;
		const i = this.alive++;
		const s = this.sim;
		s.pos[i * 3] = position.x;
		s.pos[i * 3 + 1] = position.y;
		s.pos[i * 3 + 2] = position.z;
		s.vel[i * 3] = velocity ? velocity.x : 0;
		s.vel[i * 3 + 1] = velocity ? velocity.y : 0;
		s.vel[i * 3 + 2] = velocity ? velocity.z : 0;
		s.age[i] = 0;
		s.life[i] = life;
		s.size[i] = size;
		s.rot[i] = rotation;
		s.spin[i] = spin;
		s.seed[i] = seed;
		return i;
	}

	kill(i) {
		const last = --this.alive;
		if (i === last) return;
		const s = this.sim;
		for (const k of ['pos', 'vel']) for (let c = 0; c < 3; c++) s[k][i * 3 + c] = s[k][last * 3 + c];
		for (const k of ['age', 'life', 'size', 'rot', 'spin', 'seed']) s[k][i] = s[k][last];
	}

	update(dt) {
		const cfg = this.cfg;
		this.age += dt;
		if (dt > 0) this.velocity.copy(this.position).sub(this.lastPosition).divideScalar(dt);
		if (this.active && cfg.rate > 0 && this.age <= cfg.duration) {
			this.spawnCarry += cfg.rate * dt;
			const n = Math.floor(this.spawnCarry);
			this.spawnCarry -= n;
			for (let k = 0; k < n && this.alive < this.capacity; k++) this.spawn(null, n > 1 ? (k + 1) / n : 0);
		}
		if (this.age > cfg.duration) this.active = false;

		const { pos, vel, age, life, size, rot, spin, seed } = this.sim;
		const g = this.gravity;
		const drag = Math.max(0, 1 - cfg.drag * dt);
		const swirl = cfg.swirl;
		const turb = cfg.turbulence;
		const cx = this.position.x;
		const cz = this.position.z;
		for (let i = 0; i < this.alive; i++) {
			age[i] += dt;
			if (age[i] >= life[i]) {
				this.kill(i);
				i--;
				continue;
			}
			const o = i * 3;
			if (cfg.frozen) continue; // scripted particles (lightning): velocity only encodes the stretch axis
			vel[o] = (vel[o] + g.x * dt) * drag;
			vel[o + 1] = (vel[o + 1] + g.y * dt) * drag;
			vel[o + 2] = (vel[o + 2] + g.z * dt) * drag;
			if (turb) {
				const t = age[i] * 3 + seed[i] * 50;
				vel[o] += Math.sin(t * 1.7 + pos[o + 1] * 2) * turb * dt;
				vel[o + 2] += Math.cos(t * 1.3 + pos[o] * 2) * turb * dt;
			}
			if (swirl) {
				const rx = pos[o] - cx;
				const rz = pos[o + 2] - cz;
				pos[o] += -rz * swirl * dt;
				pos[o + 2] += rx * swirl * dt;
			}
			pos[o] += vel[o] * dt;
			pos[o + 1] += vel[o + 1] * dt;
			pos[o + 2] += vel[o + 2] * dt;
			rot[i] += spin[i] * dt;
		}
		this.lastPosition.copy(this.position);
		this.write();
	}

	/** Copy simulation state to the instance attributes (colour / size / alpha over life). */
	write() {
		const cfg = this.cfg;
		const { pos, vel, age, life, size, rot, seed } = this.sim;
		const a = this.attrs;
		const P = a.iPosition.array;
		const V = a.iVelocity.array;
		const C = a.iColor.array;
		const R = a.iParams.array;
		const S = a.iStyle.array;
		const [s0, s1] = cfg.size;
		for (let i = 0; i < this.alive; i++) {
			const t = age[i] / life[i];
			const o = i * 3;
			P[o] = pos[o];
			P[o + 1] = pos[o + 1];
			P[o + 2] = pos[o + 2];
			V[o] = vel[o];
			V[o + 1] = vel[o + 1];
			V[o + 2] = vel[o + 2];
			this.color(t, _c);
			const fade = Math.min(cfg.fadeIn > 0 ? t / cfg.fadeIn : 1, cfg.fadeOut > 0 ? (1 - t) / cfg.fadeOut : 1, 1);
			const q = i * 4;
			C[q] = _c.r;
			C[q + 1] = _c.g;
			C[q + 2] = _c.b;
			C[q + 3] = cfg.alpha * Math.max(0, fade);
			R[q] = lerp(s0, s1, t) * size[i] * this.scale;
			R[q + 1] = rot[i];
			R[q + 2] = cfg.stretch;
			R[q + 3] = seed[i];
			S[q] = this.shapeCode;
			S[q + 1] = this.alignCode;
			S[q + 2] = cfg.additive;
			S[q + 3] = cfg.softness;
		}
		for (const attribute of Object.values(a)) {
			attribute.clearUpdateRanges();
			attribute.addUpdateRange(0, this.alive * attribute.itemSize);
			attribute.needsUpdate = true;
		}
		this.geometry.instanceCount = this.alive;
	}

	/** True once a finished emitter has no particles left. */
	get done() {
		return !this.active && this.alive === 0;
	}

	stop() {
		this.active = false;
	}

	dispose() {
		this.mesh.removeFromParent();
		this.geometry.dispose();
	}
}

export class ParticleSystem {
	constructor(app) {
		this.app = app;
		this.material = app.backend.vfx.particleMaterial();
		this.group = new THREE.Group();
		this.group.name = 'Particles';
		this.group.userData.labNoView = true;
		this.emitters = new Set();
		this.count = 0;
		app.world.vfxScene.add(this.group);
		app.backend.prepareObject(this.group);
	}

	/** Create an emitter. `autoRemove` disposes it once it is done (one-shot bursts). */
	emitter(config, { autoRemove = true } = {}) {
		const e = new Emitter(this, config);
		e.autoRemove = autoRemove;
		this.group.add(e.mesh);
		this.app.backend.prepareObject(e.mesh);
		this.emitters.add(e);
		return e;
	}

	remove(emitter) {
		emitter.dispose();
		this.emitters.delete(emitter);
	}

	update(dt) {
		let count = 0;
		for (const e of this.emitters) {
			e.update(dt);
			count += e.alive;
			if (e.autoRemove && e.done) this.remove(e);
		}
		this.count = count;
	}

	clear() {
		for (const e of [...this.emitters]) this.remove(e);
		this.count = 0;
	}
}

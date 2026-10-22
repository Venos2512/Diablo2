// The foot-bend field behind the grass response: a handful of slots (one for the body, a ring of recent footsteps) that fade with time.
// Pure maths: `points` are objects with set(x, z, y, strength) - the Vector4s of core/trample.js in the app, plain fakes in the tests.

const BODY = 0;

export class TrampleField {
	/** points: slot objects with set(x, z, y, w); lifetime: seconds a footstep needs to stand up again. */
	constructor(points, { lifetime = 1.6 } = {}) {
		this.points = points;
		this.lifetime = lifetime;
		this.age = new Float32Array(points.length).fill(Infinity); // seconds since the slot was set (footstep slots)
		this.gain = new Float32Array(points.length).fill(1);
		this.pos = Float32Array.from({ length: points.length * 3 }, () => 0);
		this.body = 0; // body strength (eased)
		this.next = 1;
		this.active = false;
	}

	/** A footstep presses the grass at (x, z) with `gain` 0..1 - the oldest footstep slot is reused. */
	step(x, z, y, gain = 1) {
		const slots = this.points.length;
		if (slots < 2) return;
		const i = this.next;
		this.next = this.next + 1 >= slots ? 1 : this.next + 1;
		this.age[i] = 0;
		this.gain[i] = gain;
		this.pos[i * 3] = x;
		this.pos[i * 3 + 1] = z;
		this.pos[i * 3 + 2] = y;
		this.points[i].set(x, z, y, gain);
		this.active = true;
	}

	/** The body pushes through the foliage while it moves: target 0..1 (0 = standing still). */
	pushBody(x, z, y, target, dt) {
		const k = 1 - Math.exp(-dt * (target > this.body ? 10 : 4));
		this.body += (target - this.body) * k;
		if (this.body < 0.01 && target === 0) this.body = 0;
		this.pos[BODY * 3] = x;
		this.pos[BODY * 3 + 1] = z;
		this.pos[BODY * 3 + 2] = y;
		this.points[BODY].set(x, z, y, this.body);
		if (this.body > 0) this.active = true;
	}

	/** Age the footsteps and ease the body out; returns true while anything still bends. */
	update(dt) {
		if (!this.active) return false;
		let any = this.body > 0;
		for (let i = 1; i < this.points.length; i++) {
			if (this.age[i] === Infinity) continue;
			this.age[i] += dt;
			const t = this.age[i] / this.lifetime;
			if (t >= 1) {
				this.age[i] = Infinity;
				this.points[i].set(0, 0, 0, 0);
				continue;
			}
			any = true;
			const w = (1 - t) * (1 - t) * (1.1 - 0.1 * t); // pressed hard at first, then the blades rise
			this.points[i].set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2], w * this.gain[i]);
		}
		if (this.body === 0) this.points[BODY].set(this.pos[0], this.pos[1], this.pos[2], 0);
		this.active = any;
		return any;
	}

	/** Everything stands up at once (scene change, Play stop, teleport). */
	clear() {
		this.age.fill(Infinity);
		this.pos.fill(0);
		this.body = 0;
		this.next = 1;
		this.active = false;
		for (const p of this.points) p.set(0, 0, 0, 0);
	}
}

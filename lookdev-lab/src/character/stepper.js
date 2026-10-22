// When a footstep happens, from real movement - not from frames and not while standing. Pure maths (no THREE, no DOM).
//  FootPlantDetector  reads the two feet of the rig: a foot is planted while it is near its lowest height and travelling backwards relative to the body
//                     (the stance phase). It reports `reliable` only once the plants alternate at a believable cadence.
//  StepTracker        turns the character's motion into step events: distance cadence (one step per stride walked, alternating feet) as the
//                     always-available fallback, foot plants when the detector is reliable. Standing still, jitter against a wall, attacks / hits
//                     (not locomotion), teleports and huge frame times produce no events - they resynchronise instead.

const MIN_MOVE_SPEED = 0.35; // m/s: slower than this is standing (collision jitter, a nudge)
const MIN_STEP_GAP = 0.11; // s between two events (any foot)
const MAX_EVENTS_PER_FRAME = 2;
const MAX_FRAME_DT = 0.25; // s: a longer frame is a hitch, not walking
const MAX_SPEED = 14; // m/s: faster displacement than this is a teleport (the hero runs at ~5.6)
const MIN_TELEPORT = 0.4; // m: a single-frame move bigger than this (and than MAX_SPEED * dt) is not walking
const NET_WINDOW = 0.3; // s over which the net displacement must also show movement (pushing against a wall jitters in place)

const smoothstep = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/** Metres per step (one foot to the other) for a character of `height` at ground speed `speed`: ~0.7 m walking, ~1.3 m running at 1.8 m. */
export function strideFor(height, speed) {
	return Math.max(0.2, height * (0.38 + 0.34 * smoothstep(1.6, 5, speed)));
}

/** Plants of one foot at a time; call update() per frame for each foot. */
export class FootPlantDetector {
	constructor({ window = 90, lift = 0.03, minBack = 0.05, minGap = 0.18 } = {}) {
		this.window = window;
		this.lift = lift; // m above the foot's lowest recent height that still counts as planted
		this.minBack = minBack; // m/s backwards relative to the body
		this.minGap = minGap; // s between plants of one foot
		this.feet = [this.makeFoot(), this.makeFoot()];
		this.history = []; // last plants { side, t }
		this.time = 0;
	}

	makeFoot() {
		return { heights: [], prevAlong: null, planted: false, lastPlant: -Infinity };
	}

	reset() {
		this.feet = [this.makeFoot(), this.makeFoot()];
		this.history.length = 0;
		this.time = 0;
	}

	/**
	 * feet = [{ height, along }] per side (0 left, 1 right): height above the character's ground, `along` = the foot's position along the heading relative to the
	 * body (m). moving: the character is walking / running. Returns the sides that planted this frame (0, 1 or both).
	 */
	update(dt, feet, moving, out = []) {
		out.length = 0;
		if (!(dt > 0)) return out;
		this.time += dt;
		for (let s = 0; s < 2; s++) {
			const f = this.feet[s];
			const sample = feet[s];
			if (!sample) continue;
			f.heights.push(sample.height);
			if (f.heights.length > this.window) f.heights.shift();
			let floor = Infinity;
			for (let i = 0; i < f.heights.length; i++) if (f.heights[i] < floor) floor = f.heights[i];
			const back = f.prevAlong === null ? 0 : -(sample.along - f.prevAlong) / dt;
			f.prevAlong = sample.along;
			const planted = moving && sample.height < floor + this.lift && back > this.minBack;
			if (planted && !f.planted && this.time - f.lastPlant >= this.minGap) {
				f.lastPlant = this.time;
				this.history.push({ side: s, t: this.time });
				if (this.history.length > 4) this.history.shift();
				out.push(s);
			}
			f.planted = planted;
		}
		if (!moving) {
			for (const f of this.feet) f.planted = false;
		}
		return out;
	}

	/** True when the last plants alternate feet at a believable cadence and the latest is recent (so plants can drive the footsteps). */
	get reliable() {
		const h = this.history;
		if (h.length < 3) return false;
		if (this.time - h[h.length - 1].t > 1.2) return false;
		for (let i = 1; i < h.length; i++) {
			if (h[i].side === h[i - 1].side) return false;
			const gap = h[i].t - h[i - 1].t;
			if (gap < 0.12 || gap > 1.2) return false;
		}
		return true;
	}
}

/**
 * The step source. update() takes one frame of motion and returns the events of that frame (the same array object every call):
 *   { side: 0 left | 1 right, x, z, yaw, speed, run, source: 'cadence' | 'plant' }
 */
export class StepTracker {
	constructor({ height = 1.8, runSpeed = 3 } = {}) {
		this.height = height;
		this.runSpeed = runSpeed; // m/s above which a step is a run step
		this.detector = new FootPlantDetector();
		this.events = [];
		this.planted = [];
		this.reset();
	}

	reset() {
		this.valid = false;
		this.px = 0;
		this.pz = 0;
		this.hx = 0; // heading (unit) from the motion, smoothed
		this.hz = 1;
		this.dist = 0; // metres walked since the last step
		this.side = 0;
		this.moving = false;
		this.speed = 0;
		this.sinceStep = 1;
		this.discontinuities = 0;
		this.trail = []; // recent { x, z, t } for the net displacement
		this.clock = 0;
		this.detector.reset();
	}

	/** Forget the current position (scene change, Play start/stop) without counting it as a teleport. */
	resync() {
		this.valid = false;
		this.dist = 0;
		this.moving = false;
		this.speed = 0;
		this.trail.length = 0;
		this.detector.reset();
	}

	get yaw() {
		return Math.atan2(this.hx, this.hz);
	}

	/**
	 * f = { dt, x, z, locomotion (walking or running, not attacking / hit / dead), feet?: [{ height, along, x, z }] per side }.
	 * `feet` is optional: without it (or while the plants are not believable) the distance cadence decides.
	 */
	update(f) {
		const events = this.events;
		events.length = 0;
		const { dt, x, z } = f;
		if (!(dt > 0)) return events;
		if (!this.valid) {
			this.px = x;
			this.pz = z;
			this.valid = true;
			return events;
		}
		const dx = x - this.px;
		const dz = z - this.pz;
		const d = Math.hypot(dx, dz);
		this.px = x;
		this.pz = z;
		if (dt > MAX_FRAME_DT || d > Math.max(MIN_TELEPORT, MAX_SPEED * dt)) {
			// a hitch or a teleport: no step covers that gap
			this.discontinuities++;
			this.dist = 0;
			this.moving = false;
			this.speed = 0;
			this.trail.length = 0;
			this.detector.reset();
			return events;
		}
		const speed = d / dt;
		this.speed = speed;
		this.sinceStep += dt;
		this.clock += dt;
		const trail = this.trail;
		trail.push({ x, z, t: this.clock });
		while (trail.length > 2 && this.clock - trail[0].t > NET_WINDOW) trail.shift();
		const span = this.clock - trail[0].t;
		const net = span >= 0.1 ? Math.hypot(x - trail[0].x, z - trail[0].z) / span : speed;
		const moving = !!f.locomotion && speed >= MIN_MOVE_SPEED && net >= MIN_MOVE_SPEED * 0.8;
		if (!moving) {
			this.moving = false;
			this.dist = 0;
			this.detector.update(dt, f.feet ?? [], false, this.planted);
			return events;
		}
		// heading from the motion, eased so a wobble does not swing the prints
		const ux = dx / d;
		const uz = dz / d;
		if (!this.moving) {
			this.hx = ux;
			this.hz = uz;
			this.dist = strideFor(this.height, speed) * 0.55; // the first foot goes down soon after the start
		} else {
			const k = Math.min(1, dt * 10);
			const nx = this.hx + (ux - this.hx) * k;
			const nz = this.hz + (uz - this.hz) * k;
			const len = Math.hypot(nx, nz) || 1;
			this.hx = nx / len;
			this.hz = nz / len;
		}
		this.moving = true;
		const stride = strideFor(this.height, speed);
		this.dist += d;

		let planted = this.planted;
		if (f.feet) planted = this.detector.update(dt, f.feet, true, this.planted);
		else this.planted.length = 0;
		const usePlants = !!f.feet && this.detector.reliable;

		if (usePlants) {
			for (let i = 0; i < planted.length && events.length < MAX_EVENTS_PER_FRAME; i++) {
				const side = planted[i];
				// a plant closer than 40 % of a stride to the last step is a glitch of the bone, not a step
				if (this.sinceStep < MIN_STEP_GAP || this.dist < stride * 0.4) continue;
				const foot = f.feet[side];
				this.emit(side, foot.x ?? x, foot.z ?? z, speed, 'plant');
				this.dist = 0;
			}
			// a plant that never came (hidden foot, a clip hiccup): the cadence steps in after two strides
			if (!events.length && this.dist >= stride * 2.2 && this.sinceStep >= MIN_STEP_GAP) {
				this.emitCadence(x, z, speed);
				this.dist = 0;
			}
			return events;
		}
		while (this.dist >= stride && events.length < MAX_EVENTS_PER_FRAME && this.sinceStep >= MIN_STEP_GAP) {
			this.dist -= stride;
			this.emitCadence(x, z, speed);
		}
		if (this.dist > stride) this.dist = stride; // never bank a burst of steps
		return events;
	}

	emitCadence(x, z, speed) {
		const side = this.side;
		// the foot sits beside the body line: left = (hz, -hx), right = (-hz, hx)
		const off = (side === 0 ? 1 : -1) * 0.09 * (this.height / 1.8);
		this.emit(side, x + this.hz * off, z - this.hx * off, speed, 'cadence');
	}

	emit(side, x, z, speed, source) {
		this.side = 1 - side;
		this.sinceStep = 0;
		this.events.push({ side, x, z, yaw: this.yaw, speed, run: speed >= this.runSpeed, source });
	}
}

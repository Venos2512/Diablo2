// Animation state machine for the character controller, on the subject's AnimationMixer.
//   base layer   idle / walk / run, weighted by speed; walk and run share one normalized phase so the
//                feet stay in step while they blend, and their playback rate can follow the ground
//                speed (no foot sliding) or stay at the authored rate (to see the sliding).
//   overlay      attack, cast, block, hit, death… crossfaded on top (weights always sum to 1, so the
//                mixer never blends towards the bind pose). One-shots fade back to locomotion on their own.
import * as THREE from 'three';
import { STATES } from './clips.js';

const smooth = (x) => x * x * (3 - 2 * x);

export class Animator {
	constructor(subject) {
		this.subject = subject;
		this.mixer = null;
		this.map = {};
		this.natural = { walk: 1.4, run: 3.6 };
		this.crossfade = 0.18;
		this.syncRate = true;
		this.overlays = [];
		this.phase = 0;
		this.base = { idle: null, walk: null, run: null };
		this.rate = 1;
		this.weights = { idle: 1, walk: 0, run: 0 };
		this.onEvent = null; // (type, state) => {} — 'hit' at the impact frame, 'end' when a one-shot finishes
		this.attached = false;
	}

	clip(name) {
		return name ? this.subject.clips.find((c) => c.name === name) || null : null;
	}

	action(name) {
		const clip = this.clip(name);
		return clip ? this.mixer.clipAction(clip) : null;
	}

	attach() {
		const subject = this.subject;
		if (!subject.mixer) return false;
		this.mixer = subject.mixer;
		this.mixer.stopAllAction();
		subject.externalMixer = true;
		this.attached = true;
		this.overlays = [];
		this.rebuildBase();
		return true;
	}

	detach() {
		if (!this.attached) return;
		this.attached = false;
		this.mixer?.stopAllAction();
		this.subject.externalMixer = false;
		this.overlays = [];
		this.base = { idle: null, walk: null, run: null };
		const idle = this.subject.clips.findIndex((c) => c.name === this.map.idle);
		this.subject.play(idle >= 0 ? idle : 0);
	}

	/** state -> clip name (from clips.mapStates). Rebuilds the locomotion layer. */
	setMap(map) {
		this.map = { ...map };
		if (this.attached) this.rebuildBase();
	}

	rebuildBase() {
		for (const a of Object.values(this.base)) a?.stop();
		const make = (state) => {
			const a = this.action(this.map[state]);
			if (!a) return null;
			a.reset();
			a.setLoop(THREE.LoopRepeat, Infinity);
			a.enabled = true;
			a.setEffectiveTimeScale(state === 'idle' ? 1 : 0); // walk / run time is driven by the phase
			a.setEffectiveWeight(0);
			a.play();
			return a;
		};
		this.base = { idle: make('idle'), walk: null, run: null };
		this.base.walk = make('walk');
		// Walk and run may be the same clip (models with a single cycle).
		this.base.run = this.map.run === this.map.walk ? this.base.walk : make('run');
		this.applyWeights(1);
	}

	get busy() {
		return this.overlays.some((o) => o.target > 0 && o.locks);
	}

	get dead() {
		return this.overlays.some((o) => o.state === 'death' && o.target > 0);
	}

	/** Overlay the clip of `state`. options: hold (loop until release), hitAt (0..1), locks (stops movement). */
	trigger(state, { hold = false, hitAt = STATES[state]?.hitAt ?? null, locks = true, timeScale = 1 } = {}) {
		if (!this.attached) return false;
		const name = this.map[state];
		const clip = this.clip(name);
		if (!clip) return false;
		for (const o of this.overlays) if (o.target > 0) o.target = 0; // crossfade out whatever is on top
		const action = this.mixer.clipAction(clip);
		action.stop();
		action.reset();
		action.enabled = true;
		action.clampWhenFinished = true;
		action.setLoop(hold ? THREE.LoopRepeat : THREE.LoopOnce, hold ? Infinity : 1);
		action.setEffectiveTimeScale(timeScale);
		action.setEffectiveWeight(0);
		action.play();
		// The same clip may already be fading out on another overlay entry: drop that one.
		this.overlays = this.overlays.filter((o) => o.action !== action);
		this.overlays.push({ state, action, clip, weight: 0, target: 1, hold, hitAt, hitDone: hitAt === null, locks, clamp: state === 'death' });
		return true;
	}

	release(state) {
		for (const o of this.overlays) if (o.state === state && o.target > 0) o.target = 0;
	}

	/** Back to locomotion (revive without a stand-up clip, leaving play mode…). */
	clearOverlays() {
		for (const o of this.overlays) o.target = 0;
	}

	current() {
		const top = [...this.overlays].reverse().find((o) => o.target > 0);
		if (top) return top.state;
		const w = this.weights;
		return w.run > w.walk && w.run > w.idle ? 'run' : w.walk > w.idle ? 'walk' : 'idle';
	}

	/**
	 * speed: ground speed (m/s); walkSpeed / runSpeed: the controller's speeds, used to blend walk -> run.
	 */
	update(dt, speed, walkSpeed, runSpeed) {
		if (!this.attached) return;
		// Locomotion weights from speed.
		const moving = THREE.MathUtils.clamp(speed / Math.max(0.05, walkSpeed * 0.6), 0, 1);
		const runMix = runSpeed > walkSpeed ? THREE.MathUtils.clamp((speed - walkSpeed) / (runSpeed - walkSpeed), 0, 1) : 0;
		const target = { idle: 1 - smooth(moving), walk: smooth(moving) * (1 - runMix), run: smooth(moving) * runMix };
		const k = 1 - Math.exp(-dt * 12);
		for (const key of Object.keys(target)) this.weights[key] += (target[key] - this.weights[key]) * k;

		// Shared phase for walk / run. Rate 1 = authored speed; sync makes the cycle match the ground speed.
		const walkClip = this.base.walk?.getClip();
		const runClip = this.base.run?.getClip();
		if (walkClip || runClip) {
			const walkDur = walkClip?.duration || runClip.duration;
			const runDur = runClip?.duration || walkDur;
			const natural = THREE.MathUtils.lerp(this.natural.walk, this.natural.run, runMix);
			this.rate = this.syncRate && speed > 0.05 ? THREE.MathUtils.clamp(speed / Math.max(0.05, natural), 0.35, 2.5) : 1;
			const cycle = THREE.MathUtils.lerp(walkDur, runDur, runMix);
			this.phase = (this.phase + (dt * this.rate) / cycle) % 1;
			if (this.base.walk) this.base.walk.time = this.phase * walkDur;
			if (this.base.run && this.base.run !== this.base.walk) this.base.run.time = this.phase * runDur;
		}

		// Overlays: fade, impact events, end of one-shots.
		const fade = dt / Math.max(0.01, this.crossfade);
		for (const o of this.overlays) {
			const duration = o.clip.duration / Math.max(0.01, Math.abs(o.action.getEffectiveTimeScale() || 1));
			const t = o.action.time;
			if (!o.hitDone && o.hitAt !== null && t >= o.hitAt * o.clip.duration) {
				o.hitDone = true;
				this.onEvent?.('hit', o.state);
			}
			if (!o.hold && !o.clamp && o.target > 0 && t >= o.clip.duration - Math.min(this.crossfade, duration * 0.4)) {
				o.target = 0;
				this.onEvent?.('end', o.state);
			}
			o.weight += Math.sign(o.target - o.weight) * Math.min(Math.abs(o.target - o.weight), fade);
		}
		this.overlays = this.overlays.filter((o) => {
			if (o.target === 0 && o.weight <= 1e-3) {
				o.action.stop();
				return false;
			}
			return true;
		});
		let total = this.overlays.reduce((s, o) => s + o.weight, 0);
		if (total > 1) {
			for (const o of this.overlays) o.weight /= total;
			total = 1;
		}
		for (const o of this.overlays) o.action.setEffectiveWeight(o.weight);
		this.applyWeights(1 - total);
		this.mixer.update(dt);
	}

	applyWeights(scale) {
		const { idle, walk, run } = this.base;
		// Weights of missing clips go to the ones that exist, so the layer always sums to `scale`.
		const w = { idle: idle ? this.weights.idle : 0, walk: walk ? this.weights.walk : 0, run: run && run !== walk ? this.weights.run : 0 };
		if (run === walk && walk) w.walk += this.weights.run;
		if (!idle && walk) w.walk += this.weights.idle;
		const sum = w.idle + w.walk + w.run;
		if (sum <= 1e-6) {
			const any = idle || walk || run;
			any?.setEffectiveWeight(scale);
			return;
		}
		idle?.setEffectiveWeight((w.idle / sum) * scale);
		walk?.setEffectiveWeight((w.walk / sum) * scale);
		if (run && run !== walk) run.setEffectiveWeight((w.run / sum) * scale);
	}
}

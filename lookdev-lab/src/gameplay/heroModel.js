// The lab's preview character as an Ashen Crown actor model (the CharacterModel contract in v1 rig.js:
// root, height, radius, clipInfo, play(), update(dt, { speed }), flash / tint / highlight…).
//   - GLB characters: v1 clip names map onto the Character tab's states (Animator overlays + locomotion)
//   - procedural heroes: their own CharacterModel already speaks v1, calls are forwarded
// `root` is a proxy in gameplay space; the host copies its transform onto the subject every frame.
import * as THREE from 'three';
import { STATES } from '../character/clips.js';

/** v1 clip -> Character tab state (first one that has a clip wins). */
const CLIP_STATES = {
	attack1: ['attack', 'attack2'],
	attack2: ['attack2', 'attack'],
	attack3: ['attack', 'attack2'],
	leap: ['jump', 'attack2', 'attack'],
	whirl: ['attack2', 'attack'],
	cast: ['cast', 'attack'],
	cast2: ['cast', 'attack'],
	howl: ['cast', 'attack'],
	shoot: ['attack', 'cast'],
	hit: ['hit'],
	block: ['blockHit', 'block', 'hit'],
	death: ['death'],
	spawn: ['revive'],
	revive: ['revive'],
};

export class HeroModel {
	/**
	 * @param {object} o
	 * @param {import('../app/subject.js').Subject} o.subject
	 * @param {import('../character/animator.js').Animator} o.animator
	 * @param {() => { walk: number, run: number }} o.speeds  locomotion reference speeds (m/s)
	 */
	constructor({ subject, animator, speeds, height }) {
		this.subject = subject;
		this.animator = animator;
		this.speeds = speeds;
		this.proc = subject.procedural || null;
		this.root = new THREE.Object3D();
		this.root.name = 'Player (gameplay proxy)';
		this.height = height || 1.8;
		this.radius = 0.38;
		this.onEvent = null;
		this.current = 'idle';
		this.clipInfo = this.proc ? this.proc.clipInfo : this.buildClipInfo();
		if (this.proc) this.proc.onEvent = (ev) => this.onEvent?.(ev);
	}

	stateFor(name) {
		return (CLIP_STATES[name] || [name]).find((s) => this.animator.map[s]) || null;
	}

	buildClipInfo() {
		const info = {};
		const clips = this.subject.clips;
		for (const name of Object.keys(CLIP_STATES)) {
			const state = this.stateFor(name);
			const clip = state && clips.find((c) => c.name === this.animator.map[state]);
			if (!clip) continue;
			const hitAt = STATES[state]?.hitAt ?? 0.45;
			info[name] = { duration: clip.duration, impact: clip.duration * hitAt, loop: false };
		}
		for (const name of ['idle', 'walk', 'run']) info[name] = { duration: 1, loop: true };
		return info;
	}

	play(name, { speed = 1 } = {}) {
		this.current = name;
		if (this.proc) return this.proc.play(name, { speed, restart: true });
		if (name === 'idle' || name === 'walk' || name === 'run') {
			this.animator.clearOverlays();
			return;
		}
		const state = this.stateFor(name);
		if (state) this.animator.trigger(state, { timeScale: speed, locks: true, hitAt: null });
	}

	update(dt, { speed = 0 } = {}) {
		if (this.proc) {
			this.proc.update(dt, { speed });
			return;
		}
		const s = this.speeds();
		this.animator.update(dt, speed, s.walk, s.run);
	}

	revive() {
		if (this.proc) this.proc.play('idle', { fade: 0.2 });
		else this.animator.clearOverlays();
	}

	// Surface effects: procedural heroes have them in their material, GLB characters keep their look.
	flash(...a) {
		this.proc?.flash?.(...a);
	}
	setTint(...a) {
		this.proc?.setTint?.(...a);
	}
	setFrozen(...a) {
		this.proc?.setFrozen?.(...a);
	}
	setHighlight() {}
	setOpacity() {}
	setRim() {}
	setEquipment() {}
	dispose() {
		this.root.removeFromParent();
		if (this.proc) this.proc.onEvent = null;
	}
}

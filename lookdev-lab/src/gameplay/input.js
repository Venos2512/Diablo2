// Mouse / keyboard state + hover picking, ported from Ashen Crown (src/game/input.js). Same rules: each
// actor is an ellipse on screen (feet to head), corpses a flatter one; no ground items or objects here.
import * as THREE from 'three';
import { G } from './state.js';
import { Engine } from './engine.js';

const _a = { x: 0, y: 0, visible: false };
const _b = { x: 0, y: 0, visible: false };
const _v = new THREE.Vector3();

export const Input = {
	mx: 0,
	my: 0,
	lmb: false,
	rmb: false,
	lmbDown: false,
	rmbDown: false,
	shift: false,
	alt: false,
	ctrl: false,
	ground: new THREE.Vector3(),
	hover: null,
	enabled: false,
	keyHandlers: [],
	_bound: false,

	init(canvas) {
		if (this._bound) return;
		this._bound = true;
		canvas.addEventListener('pointerdown', (e) => {
			if (!this.enabled) return;
			this.mx = e.clientX;
			this.my = e.clientY;
			if (e.button === 0) this.lmb = this.lmbDown = true;
			if (e.button === 2) this.rmb = this.rmbDown = true;
		});
		addEventListener('pointerup', (e) => {
			if (e.button === 0) this.lmb = false;
			if (e.button === 2) this.rmb = false;
		});
		addEventListener(
			'pointermove',
			(e) => {
				this.mx = e.clientX;
				this.my = e.clientY;
				this.shift = e.shiftKey;
				this.alt = e.altKey;
				this.ctrl = e.ctrlKey;
			},
			{ passive: true },
		);
		canvas.addEventListener('contextmenu', (e) => this.enabled && e.preventDefault());
		addEventListener('blur', () => {
			this.lmb = this.rmb = false;
			this.shift = this.alt = this.ctrl = false;
		});
		addEventListener('keydown', (e) => {
			this.shift = e.shiftKey;
			this.alt = e.altKey;
			this.ctrl = e.ctrlKey;
			if (!this.enabled || e.target.closest?.('input, select, textarea')) return;
			for (const h of this.keyHandlers) if (h(e) === true) {
				e.preventDefault();
				break;
			}
		});
		addEventListener('keyup', (e) => {
			this.shift = e.shiftKey;
			this.alt = e.altKey;
			this.ctrl = e.ctrlKey;
		});
	},

	onKey(fn) {
		this.keyHandlers.push(fn);
	},

	/** Once per frame before the game update. */
	frame() {
		Engine.screenToGround(this.mx, this.my, 0, this.ground);
		this.hover = this.pick();
	},

	endFrame() {
		this.lmbDown = this.rmbDown = false;
	},

	release() {
		this.lmb = this.rmb = this.lmbDown = this.rmbDown = false;
		this.hover = null;
	},

	pick() {
		if (!G.player) return null;
		const { mx, my } = this;
		let best = null;
		let bestScore = 1e9;
		let corpse = null;
		let corpseScore = 1e9;
		for (const a of G.actors) {
			if (a.removed || a === G.player || !a.root.visible) continue;
			if (a.dead && !a.corpse) continue;
			if (!a.dead && a.team === 0) continue; // own minions are not clickable
			Engine.project(_v.set(a.pos.x, a.pos.y, a.pos.z), _a);
			if (!_a.visible) continue;
			Engine.project(_v.set(a.pos.x, a.pos.y + a.height, a.pos.z), _b);
			const hpx = Math.max(26, _a.y - _b.y);
			const w = Math.max(18, hpx * (a.dead ? 0.5 : 0.36));
			const cy = a.dead ? _a.y - hpx * 0.12 : (_a.y + _b.y) / 2;
			const hh = a.dead ? hpx * 0.22 : hpx * 0.58;
			const dx = (mx - _a.x) / w;
			const dy = (my - cy) / hh;
			const s = dx * dx + dy * dy;
			if (s > 1) continue;
			if (a.dead) {
				if (s < corpseScore) {
					corpseScore = s;
					corpse = a;
				}
				continue;
			}
			if (s - 0.3 < bestScore) {
				bestScore = s - 0.3;
				best = a;
			}
		}
		if (best) return { type: 'actor', ref: best };
		if (corpse) return { type: 'corpse', ref: corpse };
		return null;
	},
};

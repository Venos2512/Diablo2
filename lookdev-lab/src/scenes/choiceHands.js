// ASHLAR · Class select (Hero Concept §10 "Key art màn chọn nghề", key art ashlar/art/heroes/_shared/choice_hands/keyart.png): six hands reach out of a skull-and-bone wall,
// nearly black, lit by ONE candle, Gennet's (the first warm colour of the game). Hover a hand and it edges out while the flame leans to it; choose it and it reaches OUT of the
// wall toward you, palm open, the other five sink back into the dark; grasp it and it crumbles to dust (canon: the stranger's hand).
// Wall: one 3.8 x 2.3 m plane, 380 x 230 segments, the ossuary tile (albedo + OpenGL normal + height) as real relief. Hands: the Tripo GLBs of ashlar/3d/heroes/_hands_v1 as prepared by
// scripts/prepare-choice-hands.py (0.45 m, sleeve end at the origin, +z fingers, +y back of the hand, plus a sleeve extension) - FL OS BR; PB EX PS are tinted clones until their models
// exist. Fingers cannot move (static mesh): every motion is a transform of nested groups - shoulder (the wall hole: swing) > slide (along the arm) > wrist (pitch, squeeze) > arm.
// Pure maths and the slot table: env/choiceHands.js (scripts/choice-hands.test.mjs). Docs: HUONG_DAN.md §7m.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { assetUrl } from '../core/assets.js';
import { FlameField } from '../env/flames.js';
import * as C from '../env/choiceHands.js';
import { note } from '../ui/gui.js';

export const CHOICE_HANDS_DEFAULTS = {
	duration: C.TIMES.reach, // s of the reach (also scales the way back)
	reach: C.ARM.slide, // m the chosen forearm slides out along its axis
	handScale: C.HAND_SCALE, // the key art draws the hands bigger than the skulls (a hand ~1.5-2 skulls long); 1 = life size (0.45 m forearm + hand). Per-slot fits (SLOTS.k) ride on it
	glow: 0.15, // the candle's haze on the wall (additive sprite behind the flame)
	wallTint: 1, // multiplier of the wall's albedo (the lighting calibration)
	handLight: 0.6,
	handOuter: 0.2, // the outer hands (PB, PS) read this much brighter than the middle ones (the key art lights its edge hands more than the cone does) // albedo multiplier of the hands (the lighting calibration: how bright the hands read next to the wall)
	rigAlways: false, // a SYNTHETIC stand-in rig (--fake-rig) is crude: it is used only in the hand test unless this is on; a real rig is always used
	flRig: true, // the Flagellant's hand is the RIGGED one (assets/choice-hands/choice-hand-fl-rig.glb) when that file exists
	offerLight: true, // the soft warm light that stays on the palm of a class that reads too dark in the offer (SHOWCASE[id].offer)
	showcase: true, // the chosen hand shows what it is of its class before it offers itself
	overlay: 0, // opacity of the key-art overlay (the calibration view; ?overlay=1 opens it at 0.5)
	candle: 1, // candle light multiplier
	lean: 1, // how far the candle light and flame lean toward the hovered / chosen hand
	showStandIns: true,
	lockCamera: true,
	dust: true, // drifting dust motes
	quote: true, // the caption on hover
};
registerDefaults('choiceHands', CHOICE_HANDS_DEFAULTS);

const WALL_BASE = [0.8, 0.64, 0.4]; // the wall's albedo multiplier: the key art's skulls are golden-brown, not grey-white
const CANDLE_COLOR = kelvinToColor(3200);
const COLD_COLOR = kelvinToColor(6500);
const NO_PICK = (o) => {
	o.userData.labNoPick = o.userData.labNoCollide = true;
	return o;
};
const UI_STYLE = `
.ch-ui { position:absolute; inset:0; pointer-events:none; z-index:4; font-family: Georgia, 'Times New Roman', serif; color:#e9dcc0; user-select:none; }
.ch-keyart { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; pointer-events:none; opacity:0; }
.ch-fade { position:absolute; inset:0; background:#000; opacity:0; }
.ch-caption { position:absolute; left:6%; right:6%; bottom:12%; text-align:center; opacity:0; text-shadow:0 2px 14px #000, 0 0 3px #000; }
.ch-name { font-size:clamp(13px,1.55vw,22px); letter-spacing:.32em; text-transform:uppercase; color:#d9b979; }
.ch-quote { margin-top:.55em; font-size:clamp(16px,2vw,30px); font-style:italic; color:#f0e4c8; line-height:1.35; }
.ch-tag { margin-top:.8em; font:12px/1.2 system-ui, sans-serif; letter-spacing:.06em; color:#9b9078; }
.ch-hint { position:absolute; left:0; right:0; bottom:3.2%; text-align:center; font:12px/1.2 system-ui, sans-serif; letter-spacing:.05em; color:#8e866f; opacity:0; text-shadow:0 1px 6px #000; transition:opacity .8s; }
.ch-actions { position:absolute; left:0; right:0; bottom:4%; display:flex; justify-content:center; gap:22px; opacity:0; pointer-events:none; transition:opacity .7s; }
.ch-actions.on { opacity:1; pointer-events:auto; }
.ch-btn { font-family:'Segoe UI', system-ui, sans-serif; font-size:clamp(14px,1.3vw,19px); letter-spacing:.14em; padding:.7em 1.6em; color:#e9dcc0; background:rgba(14,10,6,.72); border:1px solid #8a6f3d; cursor:pointer; text-shadow:0 1px 4px #000; }
.ch-btn:hover { background:rgba(60,40,16,.82); border-color:#d9b979; color:#fff3d6; }
.ch-btn.main { border-color:#d9b979; }
.ch-end { position:absolute; inset:0; display:grid; place-content:center; justify-items:center; gap:.9em; text-align:center; opacity:0; pointer-events:none; transition:opacity 1.1s; }
.ch-end.on { opacity:1; }
.ch-end.on .ch-btn { pointer-events:auto; }
.ch-end-name { font-size:clamp(28px,4.2vw,64px); letter-spacing:.34em; text-transform:uppercase; color:#e3c58a; text-shadow:0 0 24px rgba(200,140,60,.35); }
.ch-end-quote { font-size:clamp(15px,1.8vw,26px); font-style:italic; color:#cdbf9f; max-width:60%; }
.ch-end-note { font:12px/1.2 system-ui, sans-serif; letter-spacing:.06em; color:#7f765f; }
`;

/** A soft vertical soot smudge: black, opaque near the flame, thinning to nothing above it. */
function sootTexture() {
	const c = document.createElement('canvas');
	c.width = 128;
	c.height = 256;
	const g = c.getContext('2d');
	g.translate(64, 238);
	g.scale(1, 2.7); // an ellipse: zero alpha at the plane's left / right edge (a circle wider than the canvas leaves a hard edge on the wall)
	const grad = g.createRadialGradient(0, 0, 2, 0, 0, 62);
	grad.addColorStop(0, 'rgba(0,0,0,0.78)');
	grad.addColorStop(0.35, 'rgba(0,0,0,0.42)');
	grad.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = grad;
	g.fillRect(-64, -120, 128, 240);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

/** A soft round sprite 64 x 64: 'alpha' = white with a gradient ALPHA (normal blending), 'add' = a gradient in RGB with alpha 1 (additive). DataTexture, not canvas: no premultiplication. */
function spriteTexture(mode) {
	const N = 64;
	const d = new Uint8Array(N * N * 4);
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const r = Math.hypot(((x + 0.5) / N) * 2 - 1, ((y + 0.5) / N) * 2 - 1);
			const g = C.clamp(1 - r, 0, 1);
			const gg = mode === 'alpha' ? C.clamp(g * 2.4, 0, 1) : g; // a crisper disc for the ash, a soft glow for the motes
			const v = Math.round(255 * gg * gg * (3 - 2 * gg));
			d.set(mode === 'alpha' ? [255, 255, 255, v] : [v, v, v, 255], (y * N + x) * 4);
		}
	}
	const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(t, { magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false, needsUpdate: true });
	return t;
}

/**
 * The showcase's own sprites, 64 x 64 DataTextures (no canvas: premultiplied alpha makes additive black), one SHAPE per kind of particle so nothing reads as a bubble:
 * 'shard' / 'shardB' = a jagged chip of stone / plaster (alpha, shaded, no round outline); 'crystal' = a four-ray glint with a bright core (additive); 'point' = a soft
 * white-blue point with no edge (additive); 'streak' = a hot head with a short tail along +x (additive; the pool turns it along the particle's velocity); 'puff' = a soft
 * irregular wisp (alpha).
 */
function fxSprite(kind) {
	const N = 64;
	const d = new Uint8Array(N * N * 4);
	let seed = { shard: 3, shardB: 11 }[kind] ?? 5;
	const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const smooth = (a, b, x) => C.smoothstep(a, b, x);
	const at = (x, y) => (y * N + x) * 4;
	if (kind === 'shard' || kind === 'shardB') {
		const k = kind === 'shard' ? 7 : 6;
		const poly = [];
		for (let i = 0; i < k; i++) {
			const a = ((i + rnd() * 0.55) / k) * Math.PI * 2;
			const r = 0.45 + 0.47 * rnd();
			poly.push([Math.cos(a) * r, Math.sin(a) * r * (kind === 'shard' ? 1 : 0.72)]);
		}
		const inside = (px, py) => {
			let c = false;
			for (let i = 0, j = k - 1; i < k; j = i++) if (poly[i][1] > py !== poly[j][1] > py && px < ((poly[j][0] - poly[i][0]) * (py - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
			return c;
		};
		const edge = (px, py) => {
			let best = 9;
			for (let i = 0, j = k - 1; i < k; j = i++) {
				const [ax, ay] = poly[j];
				const [bx, by] = poly[i];
				const t = C.clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2), 0, 1);
				best = Math.min(best, Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))));
			}
			return best;
		};
		for (let y = 0; y < N; y++) {
			for (let x = 0; x < N; x++) {
				const px = ((x + 0.5) / N) * 2 - 1;
				const py = ((y + 0.5) / N) * 2 - 1;
				const e = edge(px, py);
				const a = inside(px, py) ? smooth(0, 0.07, e) : 0;
				// a lit top-left face, a dark lower-right rim, a little grain: a chip, not a ball
				const shade = 0.62 + 0.3 * (-px * 0.55 - py * 0.6) + 0.1 * (rnd() - 0.5) - 0.22 * (1 - smooth(0.02, 0.2, e));
				const v = Math.round(255 * C.clamp(shade, 0.15, 1));
				d.set([v, v, v, Math.round(255 * a)], at(x, y));
			}
		}
	} else if (kind === 'puff') {
		const g = Array.from({ length: 81 }, () => rnd());
		const vn = (x, y) => {
			const fx = Math.floor(x);
			const fy = Math.floor(y);
			const tx = x - fx;
			const ty = y - fy;
			const h = (i, j) => g[(j % 9) * 9 + (i % 9)];
			return C.lerp(C.lerp(h(fx, fy), h(fx + 1, fy), tx), C.lerp(h(fx, fy + 1), h(fx + 1, fy + 1), tx), ty);
		};
		for (let y = 0; y < N; y++) {
			for (let x = 0; x < N; x++) {
				const px = ((x + 0.5) / N) * 2 - 1;
				const py = ((y + 0.5) / N) * 2 - 1;
				const r = Math.hypot(px, py);
				const n = 0.55 * vn(x / 9 + 1, y / 9 + 1) + 0.45 * vn(x / 4.5 + 2, y / 4.5 + 2);
				const a = smooth(1, 0.15, r + (n - 0.5) * 0.7) * 0.55;
				d.set([255, 255, 255, Math.round(255 * a)], at(x, y));
			}
		}
	} else {
		for (let y = 0; y < N; y++) {
			for (let x = 0; x < N; x++) {
				const px = ((x + 0.5) / N) * 2 - 1;
				const py = ((y + 0.5) / N) * 2 - 1;
				let v = 0;
				if (kind === 'crystal') {
					const win = smooth(1, 0.7, Math.abs(px)) * smooth(1, 0.7, Math.abs(py));
					v = Math.max(Math.exp(-(px * px + py * py) * 70), Math.exp(-py * py * 1100) * Math.exp(-Math.abs(px) * 3.4) * 0.8, Math.exp(-px * px * 1100) * Math.exp(-Math.abs(py) * 3.4) * 0.8) * win;
				} else if (kind === 'streak') {
					const u = (px + 1) / 2;
					const head = Math.exp(-(((u - 0.82) / 0.075) ** 2 + (py / 0.14) ** 2));
					const tail = u < 0.82 ? Math.exp(-(0.82 - u) * 4.2) * Math.exp(-(py * py) / 0.02) * 0.5 * smooth(0.02, 0.2, u) : 0;
					v = Math.max(head, tail);
				} else {
					const r = Math.hypot(px, py);
					v = (Math.exp(-r * r * 9) * 0.85 + Math.exp(-r * r * 90) * 0.5) * smooth(1, 0.8, r); // 'point': soft, no edge
				}
				const b = Math.round(255 * C.clamp(v, 0, 1));
				d.set([b, b, b, 255], at(x, y));
			}
		}
	}
	const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(t, { magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false, needsUpdate: true });
	return t;
}

/**
 * A pool of showcase particles of ONE kind (one preset of FX_PRESETS): ONE InstancedMesh of camera-facing quads (never PointsMaterial: its size is ignored by WebGPU r180) with
 * the kind's own sprite. pool 'alpha' = pieces lit by the candle (normal blending: shrink to die), pool 'add' = additive glints (dim: no bloom needed). Per-instance colour is
 * `instanceColor`; every particle spins about the view axis (or, for a streak, points along its velocity on screen); the scene calls emit() and update().
 */
class FxPool {
	constructor(scene, preset, count, sprite) {
		this.preset = preset;
		this.kind = preset.pool;
		this.N = count;
		this.sprite = sprite;
		this.material = this.kind === 'add'
			? new THREE.MeshBasicMaterial({ name: 'Showcase glints', map: sprite, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
			: new THREE.MeshLambertMaterial({ name: 'Showcase pieces', map: sprite, transparent: true, depthWrite: false, emissive: new THREE.Color(0.03, 0.028, 0.025) });
		this.mesh = NO_PICK(new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this.material, count));
		this.mesh.frustumCulled = false;
		this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		const hide = new THREE.Matrix4().makeScale(0, 0, 0);
		const white = new THREE.Color(1, 1, 1);
		for (let i = 0; i < count; i++) {
			this.mesh.setMatrixAt(i, hide);
			this.mesh.setColorAt(i, white);
		}
		scene.add(this.mesh);
		this.p = Array.from({ length: count }, () => ({ age: 9, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, rot: 0, spin: 0, seed: 0, c0: new THREE.Color(), c1: new THREE.Color() }));
		this.next = 0;
		this.live = 0;
		this.awake = false; // set by emit(), cleared when the last particle has died: update() costs nothing in between
		this._m = new THREE.Matrix4();
		this._pos = new THREE.Vector3();
		this._scale = new THREE.Vector3();
		this._col = new THREE.Color();
		this._q = new THREE.Quaternion();
		this._qz = new THREE.Quaternion();
		this._zAxis = new THREE.Vector3(0, 0, 1);
		this._v = new THREE.Vector3();
		this._hide = hide;
	}

	emit(at) {
		const preset = this.preset;
		const q = this.p[this.next];
		const i = this.next;
		this.next = (this.next + 1) % this.N;
		const r = (a, b) => a + Math.random() * (b - a);
		const sp = preset.spread;
		Object.assign(q, { age: 0, life: r(...preset.life), x: at.x, y: at.y, z: at.z, size: r(...preset.size), seed: Math.random() * 6.28, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 2 * (preset.spin ?? 0),
			vx: preset.mean[0] + (Math.random() - 0.5) * 2 * sp[0], vy: preset.mean[1] + (Math.random() - 0.5) * 2 * sp[1], vz: preset.mean[2] + (Math.random() - 0.5) * 2 * sp[2] });
		const c = Array.isArray(preset.colour) ? preset.colour : [preset.colour, preset.colour];
		q.c0.set(c[0]);
		q.c1.set(c[1]);
		if (this.kind === 'alpha') this.mesh.setColorAt(i, this._col.copy(q.c0).multiplyScalar(0.75 + Math.random() * 0.35));
		this.dirtyColour = true;
		this.awake = true;
	}

	update(delta, camQ, time) {
		if (delta <= 0 || !this.awake) return;
		const pr = this.preset;
		let live = 0;
		for (let i = 0; i < this.N; i++) {
			const q = this.p[i];
			if (q.age >= 9) continue;
			if (q.age >= q.life) {
				this.mesh.setMatrixAt(i, this._hide);
				q.age = 9;
				live++; // upload this frame's removal
				continue;
			}
			live++;
			q.age += delta;
			const damp = Math.exp(-pr.drag * delta);
			q.vx *= damp;
			q.vz *= damp;
			q.vy = q.vy * Math.exp(-pr.drag * 0.4 * delta) - pr.gravity * delta;
			if (pr.sway) {
				q.vx += Math.sin(time * 3.1 + q.seed) * pr.sway * delta;
				q.vz += Math.cos(time * 2.3 + q.seed * 1.7) * pr.sway * delta;
			}
			q.x += q.vx * delta;
			q.y += q.vy * delta;
			q.z += q.vz * delta;
			if (q.y < 0.006 && q.z > 0 && q.z < C.LEDGE.depth - 0.02 && Math.abs(q.x) < C.LEDGE.width / 2 && pr.gravity > 0) {
				q.y = 0.006; // lands on the ledge
				q.vx = q.vy = q.vz = 0;
				q.spin = 0;
			}
			const t = q.age / q.life;
			let fade;
			if (pr.fade === 'bell') fade = Math.sin(Math.PI * t) ** 0.8;
			else fade = 1 - C.smoothstep(0.55, 1, t);
			fade *= C.smoothstep(0, 0.07, t);
			let size = q.size * (pr.grow ? 1 + (pr.grow - 1) * t : 1);
			if (pr.twinkle) size *= Math.max(0.12, Math.abs(Math.sin(time * pr.twinkle + q.seed))) ** 1.6; // a glint flashes: mostly dim, brief and bright
			if (this.kind === 'alpha') size *= fade;
			else {
				// additive: dim the colour with the fade, keep the dot's size nearly constant
				this._col.copy(q.c0).lerp(q.c1, t).multiplyScalar(0.9 * fade);
				this.mesh.setColorAt(i, this._col);
				this.dirtyColour = true;
			}
			// orientation: a streak points along its screen-space velocity, everything else spins about the view axis
			let angle = q.rot + q.spin * q.age;
			let sx = size;
			let sy = size * (pr.aspect ?? 1);
			if (pr.streak) {
				this._v.set(q.vx, q.vy, q.vz).applyQuaternion(this._q.copy(camQ).invert());
				angle = Math.atan2(this._v.y, this._v.x);
				sx = size * pr.streak;
			}
			this._q.copy(camQ).multiply(this._qz.setFromAxisAngle(this._zAxis, angle));
			this._m.compose(this._pos.set(q.x, q.y, q.z), this._q, this._scale.set(sx, sy, 1));
			this.mesh.setMatrixAt(i, this._m);
		}
		this.mesh.instanceMatrix.needsUpdate = true;
		if (this.dirtyColour && this.mesh.instanceColor) {
			this.mesh.instanceColor.needsUpdate = true;
			this.dirtyColour = false;
		}
		this.live = live;
		if (live === 0) this.awake = false;
	}

	clear() {
		for (let i = 0; i < this.N; i++) {
			this.p[i].age = 9;
			this.mesh.setMatrixAt(i, this._hide);
		}
		this.mesh.instanceMatrix.needsUpdate = true;
		this.live = 0;
		this.awake = false;
	}

	dispose() {
		this.mesh.geometry.dispose();
		this.material.dispose();
		this.sprite.dispose();
		this.mesh.dispose();
	}
}

/** A worn flagstone for the ledge (albedo + OpenGL normal, tileable, 256 px): fbm value noise, slab joints. Procedural: the scene needs no extra file for it. */
function stoneTextures(anisotropy) {
	const N = 256;
	const octave = (cells, seed) => {
		const g = Float32Array.from({ length: cells * cells }, (_, i) => C.hash01(i, seed));
		const at = (x, y) => g[(((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)];
		return (u, v) => {
			const x = u * cells;
			const y = v * cells;
			const x0 = Math.floor(x);
			const y0 = Math.floor(y);
			const fx = x - x0;
			const fy = y - y0;
			const sx = fx * fx * (3 - 2 * fx);
			const sy = fy * fy * (3 - 2 * fy);
			return at(x0, y0) * (1 - sx) * (1 - sy) + at(x0 + 1, y0) * sx * (1 - sy) + at(x0, y0 + 1) * (1 - sx) * sy + at(x0 + 1, y0 + 1) * sx * sy;
		};
	};
	const oc = [octave(4, 11), octave(8, 12), octave(16, 13), octave(32, 14), octave(64, 15)];
	const h = new Float32Array(N * N);
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const u = x / N;
			const v = y / N;
			let a = 0;
			oc.forEach((f, k) => (a += f(u, v) * 0.5 ** k));
			h[y * N + x] = a / 1.94;
		}
	}
	const map = new Uint8Array(N * N * 4);
	const nrm = new Uint8Array(N * N * 4);
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const i = y * N + x;
			const dx = (h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)]) * 9;
			const dy = (h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x]) * 9;
			const l = Math.hypot(dx, dy, 1);
			nrm.set([Math.round((-dx / l * 0.5 + 0.5) * 255), Math.round((dy / l * 0.5 + 0.5) * 255), Math.round((1 / l * 0.5 + 0.5) * 255), 255], i * 4);
			const joint = x < 2 || x >= N - 2 ? 1 : 0; // the tile is one slab: its edge is the joint
			const t = h[i];
			const k = (0.16 + 0.3 * t) * (1 - 0.7 * joint);
			map.set([Math.round((k * 1.05) * 255), Math.round(k * 0.97 * 255), Math.round(k * 0.86 * 255), 255], i * 4);
		}
	}
	const make = (data, colorSpace) => {
		const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
		Object.assign(t, { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(8, anisotropy), colorSpace, needsUpdate: true });
		t.repeat.set(4, 1);
		return t;
	};
	return { map: make(map, THREE.SRGBColorSpace), normal: make(nrm, THREE.NoColorSpace) };
}

export class ChoiceHandsScene {
	constructor(app) {
		this.app = app;
		this.id = 'choiceHands';
		this.label = 'ASHLAR · Màn chọn nghề (sáu bàn tay)';
		this.moodKind = 'interior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'ASHLAR class select';
		this.settings = app.settings.adopt('choiceHands');
		this.anchor = new THREE.Group(); // the App parks the subject here: nothing to show
		this.anchor.name = 'Subject anchor';
		this.anchor.visible = false;
		this.vfx = new THREE.Group();
		this.vfx.name = 'Class select VFX';
		this.sun = { direction: new THREE.Vector3(0.3, 1, 0.5).normalize(), color: new THREE.Color(0, 0, 0) };
		this.lights = [];
		this.postDefaults = { toneMapping: 'aces', exposure: 1.0, fog: { enabled: false }, grade: { vignette: 0.375, contrast: 1.06, saturation: 0.75, lift: 0, temperature: 0, tint: 0 } };
		this.home = { position: new THREE.Vector3(...C.FRAME.position), target: new THREE.Vector3(...C.FRAME.target) };
		this.slots = [];
		this.handtest = { on: false, index: 1, motion: null, mode: 'preset', preset: 'offer', t: 0, presetT0: 0, runT: 0, runIndex: -1, ui: null, controllers: [], keepLock: true, skeleton: null, wire: false, profile: 'default' }; // the hand-test mode (enterHandTest)
		this.state = 'idle'; // idle | reach (out and offered) | back | grasp | done
		this.sel = -1; // the chosen slot while reaching / offered / grasping
		this.hoverIndex = -1; // pointer
		this.keyHover = -1; // keyboard
		this.reach = { value: 0, from: 0, to: 0, t: 1, dur: 1, ease: C.easeOutBack };
		this.retract = 0; // the other five sinking back (0..1)
		this.camP = 0;
		this.camSlot = null;
		this.gripW = 0;
		this.pendingGrab = false;
		this.showcase = { active: false, done: false, started: false, t: 0, def: null, acc: [], roll: 0, squeeze: 0, tremor: 0, grip: 0, shake: 1, cam: 0 };
		this._qr = new THREE.Quaternion();
		this._up = new THREE.Vector3();
		this._zAxis = new THREE.Vector3(0, 0, 1);
		this._offeredShown = false;
		this.grasp = { t: 0, spawned: 0, front: 9 };
		this.time = 0;
		this.lean = new THREE.Vector3();
		this._v = new THREE.Vector3();
		this._w = new THREE.Vector3();
		this._q3 = new THREE.Vector3();
		this._ndc = new THREE.Vector2();
		this._ray = new THREE.Raycaster();
		this._pose = { slide: 0, quat: new THREE.Quaternion(), wrist: 0 };
		this._cam = { position: new THREE.Vector3(), target: new THREE.Vector3() };
		this.cap = { shown: -1, alpha: 0 };
		this.ready = false;
		this.disposed = false;
		this.listeners = [];
	}

	// ---- init ------------------------------------------------------------------------------------------------------------------

	async init() {
		const { app, scene } = this;
		scene.add(this.anchor);
		scene.background = new THREE.Color(0x020202);
		const tiles = {};
		for (const k of ['a', 'b']) {
			const [albedo, normal, height] = await Promise.all([`choice-wall-${k}`, `choice-wall-${k}-n`, `choice-wall-${k}-h`].map((id) => app.loader.loadImageData(id)));
			tiles[k] = { albedo, normal, height };
		}
		const wallSet = await this.bakeWall(tiles);
		this.textures = Object.values(wallSet);
		const gltfs = {};
		await Promise.all(Object.entries(C.HAND_MODELS).map(async ([key, m]) => (gltfs[key] = await app.loader.loadSample(m.file))));
		try {
			gltfs.flrig = await app.loader.loadSample('choice-hand-fl-rig'); // optional: the rigged Flagellant hand (the Blender rig, or the synthetic stand-in of prepare-choice-hands.py --fake-rig)
		} catch {
			gltfs.flrig = null;
		}
		this.gltfs = gltfs;
		this.buildLights();
		this.buildWall(wallSet);
		this.buildLedge();
		this.buildCandle();
		this.buildHands();
		this.buildDust();
		await this.buildEnvironment();
		this.applyStandIns();
		this.ready = true;
	}

	async buildEnvironment() {
		// a trace of cold night env so the steel stand-in and the ring metals have something to reflect; the candle does the work
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample('hdri-night'));
		if (this.disposed) return env.dispose?.();
		this._env = this.scene.environment = env;
		this.scene.environmentIntensity = 0.035;
	}

	buildLights() {
		const { scene } = this;
		this.hemi = new THREE.HemisphereLight(0x7c7064, 0x382c20, 0.5);
		this.hemi.name = 'Cold ambient (very low)';
		scene.add(this.hemi);
		// the one shadowed light: the candle. A SpotLight (one shadow frustum, 140 deg wide) aimed at the wall, not a PointLight: the six faces of a point light's cube shadow
		// showed as brightness steps on the wall where they meet. Its cone is also the vignette of the set (the wall fades to black past 70 deg).
		this.candleLight = new THREE.SpotLight(CANDLE_COLOR, 0, 0, 1.22, 1, 1.05); // decay 1.05: the key art's glow is broad (a physical 2 would make a hot spot and black corners)
		this.candleLight.name = "Gennet's candle";
		this.candleLight.castShadow = true;
		this.candleLight.shadow.mapSize.set(2048, 2048);
		this.candleLight.shadow.camera.near = 0.03;
		this.candleLight.shadow.camera.far = 6;
		this.candleLight.shadow.bias = -0.0004;
		this.candleLight.shadow.normalBias = 0.01;
		this.candleLight.shadow.radius = 2;
		this.candleBase = new THREE.Vector3(C.CANDLE.x, 0.21 * C.CANDLE.scale, C.CANDLE.z + 0.03); // the middle of the flame, low and close to the wall (the key art's one light)
		this.candleLight.position.copy(this.candleBase);
		this.candleLight.target.position.set(0, 0.15, -0.1);
		scene.add(this.candleLight, this.candleLight.target);
		// the same flame lights what the cone misses (ledge, dish, wax, the underside of the nearest hands): short range, no shadow
		this.candleNear = new THREE.PointLight(CANDLE_COLOR, 0, 2.2, 1.15);
		this.candleNear.name = "Gennet's candle (near, unshadowed)";
		this.nearOffset = new THREE.Vector3(0, 0.06, 0.266); // the ledge and the wax bounce the flame toward the viewer: this lights the fronts and undersides of the hands
		this.candleNear.position.copy(this.candleBase).add(this.nearOffset);
		scene.add(this.candleNear);
		// the class light: one more point light, off until a hand is chosen; its colour and place come from the showcase table (cold for the Ossuarist, warm fire for lamp / coals / pyre)
		this.classLight = new THREE.PointLight(0xffffff, 0, 1.2, 2);
		this.classLight.name = 'Class light (showcase)';
		scene.add(this.classLight);
		// a very weak cold fill from the upper left front so the dark side of the hands reads (no shadow)
		this.fill = new THREE.DirectionalLight(COLD_COLOR, 0);
		this.fill.name = 'Cool fill (weak)';
		this.fill.position.set(-2.2, 2.4, 3.2);
		this.fill.target.position.set(0, 0.6, 0);
		scene.add(this.fill, this.fill.target);
		this.lights = [
			{ name: "Gennet's candle (shadowed spot)", light: this.candleLight, kelvin: 3200, base: 0.64, flicker: 3.1, flickerAmount: 1 },
			{ name: "Gennet's candle (near, no shadow)", light: this.candleNear, kelvin: 3200, base: 0.42, flicker: 3.1, flickerAmount: 1 },
			{ name: 'Cold fill', light: this.fill, kelvin: 6500, base: 0.6 },
			{ name: 'Cold ambient', light: this.hemi, base: 0.5 },
			{ name: 'Class light (showcase, driven)', light: this.classLight, kelvin: 0, base: 0 },
		];
		this.applyRigIntensity();
	}

	applyRigIntensity() {
		this.fill.intensity = this.lights[2].base;
		this.hemi.intensity = this.lights[3].base;
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	wetRoots() {
		return [];
	}

	async applyMood() {} // the class-select scene keeps its own lighting under every mood

	/**
	 * The wall's three maps, baked once from the two tiles (env/choiceHands.js composeWallRows): ONE non-repeating 2304 x 1408 texture per map for the whole 3.8 x 2.3 m,
	 * tile A in the lit middle cross-faded into tile B through the dim ring. Done in slices so the page stays alive (~1 s).
	 */
	async bakeWall(tiles) {
		const W = 2304;
		const H = 1408;
		const out = { albedo: new Uint8Array(W * H * 4), normal: new Uint8Array(W * H * 4), height: new Uint8Array(W * H * 4) };
		for (let y = 0; y < H; y += 96) {
			C.composeWallRows(out, tiles, W, H, y, Math.min(H, y + 96));
			await new Promise((r) => setTimeout(r, 0));
		}
		const aniso = Math.min(8, this.app.backend.caps.maxAnisotropy || 4);
		const heightR = new Uint8Array(W * H); // displacement reads one channel
		for (let i = 0; i < W * H; i++) heightR[i] = out.height[i * 4];
		out.height = null;
		const make = (data, colorSpace, name, format = THREE.RGBAFormat) => {
			const t = new THREE.DataTexture(data, W, H, format, THREE.UnsignedByteType);
			Object.assign(t, { name, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: aniso, colorSpace, needsUpdate: true });
			t.onUpdate = () => {
				// uploaded: the CPU copy (up to 12 MB a map) is no longer needed. Risk: after a WebGL context loss the texture could not be uploaded again (the page would need a
				// reload, the scene's other textures come from files and are fine); acceptable for a lookdev lab, bake again if that ever matters
				t.image.data = null;
				t.onUpdate = null;
			};
			return t;
		};
		return { map: make(out.albedo, THREE.SRGBColorSpace, 'wall albedo'), normal: make(out.normal, THREE.NoColorSpace, 'wall normal'), height: make(heightR, THREE.NoColorSpace, 'wall height', THREE.RedFormat) };
	}

	/** The wall: one 380 x 230 grid, the baked maps spanning it once (UV 0..1), displaced by the baked height, blotched by a low-frequency vertex tone. */
	buildWall(set) {
		const W = C.WALL;
		const g = new THREE.PlaneGeometry(W.width, W.height, W.segX, W.segY);
		const tone = new Float32Array(g.attributes.position.count * 3);
		for (let j = 0; j < g.attributes.position.count; j++) tone.fill(C.wallTone(g.attributes.position.getX(j), g.attributes.position.getY(j) + W.cy), j * 3, j * 3 + 3);
		g.setAttribute('color', new THREE.BufferAttribute(tone, 3));
		this.wallMaterial = new THREE.MeshStandardMaterial({ name: 'Ossuary wall', map: set.map, normalMap: set.normal, normalScale: new THREE.Vector2(1.1, 1.1), displacementMap: set.height, displacementScale: W.relief, displacementBias: -W.relief, roughness: 0.92, metalness: 0, vertexColors: true, color: new THREE.Color(...WALL_BASE) });
		const mesh = new THREE.Mesh(g, this.wallMaterial);
		mesh.name = 'Skull wall';
		mesh.position.set(0, W.cy, 0);
		mesh.receiveShadow = true; // castShadow stays off: the WebGPU shadow pass does not displace, so the wall would shadow itself with its flat plane
		mesh.frustumCulled = false;
		this.wall = mesh;
		this.scene.add(mesh);
		// soot above the flame: a soft black smudge on the wall
		this.sootMap = sootTexture();
		const soot = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.1), new THREE.MeshBasicMaterial({ name: 'Candle soot', map: this.sootMap, transparent: true, depthWrite: false, color: 0x000000 }));
		soot.position.set(C.CANDLE.x, 0.62, 0.004);
		soot.renderOrder = 1;
		NO_PICK(soot);
		this.scene.add(soot);
	}

	buildLedge() {
		const L = C.LEDGE;
		const { map, normal } = stoneTextures(this.app.backend.caps.maxAnisotropy || 4);
		this.stoneMap = map;
		this.stoneNormal = normal;
		this.ledgeMaterial = new THREE.MeshStandardMaterial({ name: 'Ledge stone', map, normalMap: normal, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.93, metalness: 0 });
		this.ledge = new THREE.Mesh(new THREE.BoxGeometry(L.width, L.height, L.depth), this.ledgeMaterial);
		this.ledge.name = 'Ledge';
		this.ledge.position.set(0, -L.height / 2, L.depth / 2 - 0.02);
		this.ledge.castShadow = true;
		this.ledge.receiveShadow = true;
		this.scene.add(this.ledge);
		// worn lip of the stone
		const lip = new THREE.Mesh(new THREE.BoxGeometry(L.width, 0.03, 0.05), this.ledgeMaterial);
		lip.position.set(0, -0.012, L.depth - 0.045); // flush with the front of the ledge (its front edge is the key art's ledge line)
		lip.castShadow = lip.receiveShadow = true;
		this.scene.add(lip);
	}

	buildCandle() {
		const K = C.CANDLE;
		const group = new THREE.Group();
		group.name = "Gennet's candle";
		group.position.set(K.x, 0, K.z);
		group.scale.setScalar(K.scale);
		const brass = new THREE.MeshStandardMaterial({ name: 'Candle dish', color: new THREE.Color(0.34, 0.27, 0.17), roughness: 0.5, metalness: 0.75 });
		const dishProfile = [[0, 0.002], [0.046, 0.002], [0.074, 0.011], [0.082, 0.024], [0.076, 0.026], [0.07, 0.016], [0.046, 0.011], [0, 0.011]].map(([r, y]) => new THREE.Vector2(r, y));
		const dish = new THREE.Mesh(new THREE.LatheGeometry(dishProfile, 40), brass);
		dish.name = 'Dish';
		group.add(dish);
		// the ring handle of a chamberstick: a torus standing on the dish rim, with a short stem
		const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 10, 32), brass);
		handle.position.set(0.108, 0.036, 0);
		handle.rotation.y = Math.PI / 2 * 0; // ring in the xy plane: faces the viewer
		group.add(handle);
		const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.04, 8), brass);
		stem.rotation.z = Math.PI / 2;
		stem.position.set(0.082, 0.02, 0);
		group.add(stem);
		// wax: a slightly bulged lathe, melted lip at the top
		const waxProfile = [[0, 0.011], [0.029, 0.011], [0.031, 0.04], [0.033, 0.085], [0.031, 0.118], [0.026, 0.132], [0.02, 0.1355], [0.012, 0.128], [0, 0.128]].map(([r, y]) => new THREE.Vector2(r, y));
		// the wax is its own light: the flame sits a finger above it, so any real light there clips to white. A gradient painted into vertex colours (bright at the lip, warm
		// below, a little lighter on the side that faces the viewer) in an unlit material: a golden cream like the key art's, whatever the lights are doing
		this.waxMaterial = new THREE.MeshBasicMaterial({ name: 'Candle wax', vertexColors: true, color: new THREE.Color(1, 1, 1) });
		const paintWax = (geometry) => {
			const pos = geometry.attributes.position;
			const nor = geometry.attributes.normal;
			const col = new Float32Array(pos.count * 3);
			for (let i = 0; i < pos.count; i++) {
				const t = C.clamp((pos.getY(i) - 0.011) / 0.125, 0, 1);
				const shade = 0.62 + 0.38 * C.clamp(nor.getZ(i) * 0.8 + 0.3 * nor.getX(i) + 0.4, 0, 1);
				col.set([C.lerp(0.3, 0.8, t) * shade, C.lerp(0.1, 0.33, t) * shade, C.lerp(0.02, 0.055, t) * shade], i * 3); // linear values
			}
			geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
			return geometry;
		};
		const wax = new THREE.Mesh(paintWax(new THREE.LatheGeometry(waxProfile, 32)), this.waxMaterial);
		wax.name = 'Wax';
		group.add(wax);
		// two drips and a wick
		for (const [x, z, h, r] of [[0.0295, 0.01, 0.05, 0.0065], [-0.011, 0.0295, 0.034, 0.0055]]) {
			const d = new THREE.Mesh(paintWax(new THREE.CapsuleGeometry(r, h, 4, 8)), this.waxMaterial);
			d.position.set(x, 0.12 - h / 2, z);
			group.add(d);
		}
		const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 0.022, 6), new THREE.MeshStandardMaterial({ name: 'Wick', color: 0x0b0a08, roughness: 1 }));
		wick.position.set(0, 0.138, 0);
		group.add(wick);
		for (const m of group.children) m.receiveShadow = true; // the candle does not shadow itself (its light sits above it)
		this.candle = group;
		this.scene.add(group);
		// the flame: the lab's flame billboard, bottom at the wick top
		this.flames = new FlameField(this.app, 2); // the candle's and, for the Exhumer's showcase, a small oil flame on the thumb
		this.flameBase = new THREE.Vector3(K.x, 0.148 * K.scale, K.z);
		this.flameIndex = this.flames.add(this.flameBase, { width: 0.046 * K.scale, height: 0.085 * K.scale, strength: 1 });
		this.flameIndex2 = this.flames.add(new THREE.Vector3(0, -9, 0), { width: 0.026, height: 0.05, strength: 0 });
		this.vfx.add(this.flames.mesh);
		// the key art's golden haze round the flame: one soft warm additive sprite on the wall behind the candle (the lights give the halo its shape, this its warmth)
		this.glowTexture = spriteTexture('add');
		this.glowMaterial = new THREE.MeshBasicMaterial({ name: 'Candle glow', map: this.glowTexture, color: new THREE.Color(0, 0, 0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
		this.glowMesh = NO_PICK(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.glowMaterial));
		this.glowMesh.scale.setScalar(0.8);
		this.glowMesh.position.set(K.x, 0.18 * K.scale, 0.03);
		this.glowMesh.renderOrder = 1;
		this.scene.add(this.glowMesh);
		// ...and on the ledge: the stone's top face round the dish is the brightest stone of the key art (the same warm sprite, lying flat)
		this.ledgeGlowMaterial = this.glowMaterial.clone();
		this.ledgeGlowMesh = NO_PICK(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.ledgeGlowMaterial));
		this.ledgeGlowMesh.rotation.x = -Math.PI / 2;
		this.ledgeGlowMesh.scale.set(0.5, 0.2, 1);
		this.ledgeGlowMesh.position.set(K.x, 0.0035, C.LEDGE.depth * 0.5);
		this.ledgeGlowMesh.renderOrder = 1;
		this.scene.add(this.ledgeGlowMesh);
	}

	// ---- hands -----------------------------------------------------------------------------------------------------------------

	buildHands() {
		this.proxyRoot = new THREE.Group(); // not in the scene: only for picking
		this.slots = C.SLOTS.map((def, index) => this.buildSlot(def, index));
		this.proxyRoot.updateMatrixWorld(true);
	}

	buildSlot(def, index) {
		const geo = C.armGeometry(def, { scale: this.settings.handScale });
		const sc = geo.scale; // handScale x the slot's own fit
		const model = C.HAND_MODELS[def.source];
		const root = new THREE.Group(); // the wall hole: swings the arm
		root.name = `Hand ${def.id}`;
		root.position.copy(geo.entry);
		root.scale.setScalar(sc);
		const slideG = new THREE.Group(); // sleeve end at -back, slides along the arm
		const wristG = new THREE.Group(); // pitch / squeeze about the wrist
		wristG.position.z = model.wrist;
		const armG = new THREE.Group(); // mirror flips the hand's handedness
		armG.position.z = -model.wrist;
		if (def.mirror) armG.scale.x = -1;
		root.add(slideG);
		slideG.add(wristG);
		wristG.add(armG);
		const rigged = this.wantsRig(def); // the rigged Flagellant hand (a skin and its bones), else the static one
		const model3d = cloneSkinned((rigged ? this.gltfs.flrig : this.gltfs[def.source]).scene); // SkeletonUtils: a plain clone would share one skeleton between the slots of a rigged GLB
		if (rigged && !model3d.getObjectByName('sleeve_ext')) {
			const ext = this.gltfs.fl.scene.getObjectByName('sleeve_ext'); // the rig has the hand and the forearm only: the cloth tube the arm slides out of is the static hand's (same frame, same sleeve)
			if (ext) model3d.add(ext.clone());
		}
		const mats = [];
		const meshes = [];
		const dust = [];
		model3d.traverse((o) => {
			if (!o.isMesh) return;
			o.material = o.material.clone();
			if (o.name === 'sleeve_ext') {
				o.material.metalness = 0; // the extension has no material in the GLB (vertex colours only): glTF's default is metal
				o.material.roughness = 0.9;
			}
			o.castShadow = o.receiveShadow = true;
			if (o.isSkinnedMesh) o.frustumCulled = false; // its bounding sphere is the rest pose's: fingers move out of it
			if (def.tint) {
				const t = def.tint;
				if (t.mono && o.material.map) o.material.map = this.monoMap(o.material.map, t.mono, `${def.source}:${t.mono}`); // steel / leather: the skin and cloth of the donor in one tone, by luminance
				else if (t.color) o.material.color.multiply(new THREE.Color().setRGB(...t.color)); // multiply: the hand is white-based (its texture carries the colour), the sleeve extension is not
				if (t.mono && !o.material.map) o.material.color.multiply(new THREE.Color().setRGB(...t.mono).multiplyScalar(0.5)); // the sleeve extension (vertex colours, no map)
				if (t.metalness !== undefined) o.material.metalness = t.metalness;
				if (t.roughness !== undefined) o.material.roughness = t.roughness;
			}
			o.material.userData.base = o.material.color.clone();
			mats.push(o.material);
			meshes.push(o);
			if (o.name === 'hand' || o.geometry.attributes.position.count > 1000) {
				const p = o.geometry.attributes.position;
				for (let i = 0; i < p.count; i += Math.max(1, Math.floor(p.count / 900))) if (p.getZ(i) > -0.02) dust.push(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
			}
		});
		dust.sort((a, b) => a.z - b.z);
		armG.add(model3d);
		// the inside of the cut: where the dissolve (or the thin sleeve end) opens a shell, back faces show; dark ash, not the skin / cloth texture the inside of the mesh would carry
		const inside = [];
		model3d.traverse((o) => {
			if (!o.isMesh || o.isSkinnedMesh || o.userData.cutInterior) return;
			const m = new THREE.Mesh(o.geometry, new THREE.MeshBasicMaterial({ name: 'cut interior', color: new THREE.Color(0.045, 0.04, 0.036), side: THREE.BackSide }));
			m.userData.cutInterior = true; // a flag, never the mesh itself: userData is JSON-cloned by Object3D.clone
			m.userData.labNoPick = m.userData.labNoCollide = true;
			m.castShadow = false;
			inside.push([o, m]);
		});
		for (const [o, m] of inside) o.add(m);
		for (const [, m] of inside) {
			m.material.userData.base = m.material.color.clone();
			mats.push(m.material); // dims with the hand (updateSlot multiplies the colour; no emissive on a Basic material, guarded)
		}

		// the held-out hand's pick volume: a capsule over wrist + hand in the ARM frame (so it follows the slide, the turn and the mirror); DoubleSide because armG may be mirrored
		const handProxy = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.16, 2, 8), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
		handProxy.rotation.x = Math.PI / 2;
		handProxy.position.z = 0.32;
		handProxy.name = 'hand pick volume';
		handProxy.userData.labNoPick = handProxy.userData.labNoCollide = true;
		armG.add(handProxy);
		if (def.rings) {
			const ringMat = new THREE.MeshStandardMaterial({ name: `${def.id} thread`, color: new THREE.Color(...def.rings.color), roughness: 0.85 });
			ringMat.userData.base = ringMat.color.clone();
			mats.push(ringMat);
			for (let k = 0; k < def.rings.count; k++) {
				const ring = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.0055, 8, 28), ringMat);
				ring.position.z = model.wrist - 0.035 - k * 0.014;
				ring.castShadow = ring.receiveShadow = true;
				armG.add(ring);
				meshes.push(ring);
			}
		}
		this.scene.add(root);
		// pick proxy: a capsule over the visible arm and hand at rest (static, so a hovered hand cannot run away from the pointer)
		const r = 0.075;
		const len = geo.visible - 0.04 - 2 * r + 0.1;
		const proxy = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 2, 8), new THREE.MeshBasicMaterial({ visible: false }));
		proxy.userData.slot = index;
		this.proxyRoot.add(proxy);
		const anchors = C.handAnchors(model3d, model);
		geo.fitLocal = C.sampleHandPoints(model3d, model); // the offer camera is fitted to the real mesh
		const slot = { model3d, skinned: !!model3d.getObjectByProperty('isSkinnedMesh', true), outerK: Math.min(1, Math.abs(geo.entry.x) / 0.75), def, index, geo, root, slideG, wristG, armG, mats, meshes, proxy, dust, anchors, hover: 0, dim: 1, phase: index * 1.37, rig: null, slices: null, handProxy };
		this.bindFingerRig(slot, model3d);
		slot.sockets = {};
		for (const [anchor, node] of Object.entries({ palm: 'fx_palm', thumb: 'fx_thumb', tip: 'fx_tip_index' })) {
			const o = model3d.getObjectByName(node);
			if (o) slot.sockets[anchor] = o; // the rig's sockets follow the hand: the effects are born where it is NOW, not where the rest-pose mesh was
		}
		this.placeProxy(slot);
		return slot;
	}

	/** A copy of a hand texture reduced to its luminance times `mono` (steel, leather): the stand-ins' colour, not the real hand's. Cached per donor and tone. */
	monoMap(source, mono, key) {
		this._mono ??= new Map();
		if (this._mono.has(key)) return this._mono.get(key);
		const N = 1024;
		const canvas = document.createElement('canvas');
		canvas.width = canvas.height = N;
		const g = canvas.getContext('2d', { willReadFrequently: true });
		g.drawImage(source.image, 0, 0, N, N);
		const img = g.getImageData(0, 0, N, N);
		const d = img.data;
		for (let i = 0; i < d.length; i += 4) {
			const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
			d[i] = Math.min(255, lum * mono[0] * 1.15);
			d[i + 1] = Math.min(255, lum * mono[1] * 1.15);
			d[i + 2] = Math.min(255, lum * mono[2] * 1.15);
		}
		g.putImageData(img, 0, 0);
		const t = new THREE.CanvasTexture(canvas);
		Object.assign(t, { flipY: false, colorSpace: THREE.SRGBColorSpace, anisotropy: source.anisotropy, name: `${key} (mono)` });
		this._mono.set(key, t);
		return t;
	}

	/**
	 * Finger rig (optional): if the slot's model has finger bones (names in env/choiceHands.js FINGER_BONES) they are driven by code: relaxed at rest, fanned open when
	 * offered, closed on the grasp. A static mesh (today's GLBs) has none and keeps the wrist-only motion. `root` = the object to search (default: the slot's arm group).
	 */
	bindFingerRig(slot, root = slot.armG) {
		const profile = slot.def.id === 'FL' && slot.skinned && !this.rigIsSynthetic ? 'flRig' : 'default'; // the real Flagellant rig has its own finger angles (they are added to a half-curled rest)
		slot.profile = profile;
		const rig = C.createFingerRig(root, undefined, C.HAND_PROFILES[profile].axes, undefined, C.HAND_PROFILES[profile].poses);
		slot.rig = rig.hasFingers ? rig : null;
		slot.rigInfo = { found: rig.found.length, missing: rig.missing, root: rig.hasRoot, wrist: rig.hasWrist };
		slot.joints = slot.rig ? C.createJointRig(root) : null; // the wrist and forearm bones (hand-test mode: flexion, deviation, roll)
		if (slot.rig) slot.rig.apply(0, 0, 0);
		return slot.rig;
	}

	/** The pick capsule over the arm and hand at rest (static, so a hovered hand cannot run away from the pointer). */
	placeProxy(slot) {
		const { geo, proxy } = slot;
		const sc = geo.scale;
		proxy.position.copy(geo.entry).addScaledVector(geo.dir, ((geo.visible - 0.04) / 2 + 0.02) * sc);
		proxy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), geo.dir);
		proxy.scale.setScalar(sc);
		proxy.updateMatrixWorld(true);
	}

	/** The Hand size slider: every arm is rebuilt about its hole (tips stay where the table puts them). */
	applyHandScale() {
		for (const s of this.slots) {
			const fitLocal = s.geo.fitLocal; // the measured mesh points the offer camera is fitted to
			s.geo = C.armGeometry(s.def, { scale: this.settings.handScale });
			s.geo.fitLocal = fitLocal;
			s.root.position.copy(s.geo.entry);
			s.root.scale.setScalar(s.geo.scale);
			this.placeProxy(s);
		}
	}

	applyStandIns() {
		const show = this.settings.showStandIns;
		if (this.sel >= 0 && this.slots[this.sel].def.standIn && !show) this.replay(); // the chosen hand is about to vanish: back to the wall first
		for (const s of this.slots) {
			s.hidden = s.def.standIn && !show;
			s.root.visible = !s.hidden;
		}
	}

	// ---- dust ------------------------------------------------------------------------------------------------------------------
	// Both kinds are INSTANCED QUADS turned to the camera (the lab's own particle recipe: env/flames.js, vfx/particles.js), never PointsMaterial: a Points size is ignored by
	// WebGPU r180 (1 px dots). InstancedMesh + plain materials run on both backends; the per-instance colour is `instanceColor`, the fade is a shrink.

	buildDust() {
		this.spriteAlpha = spriteTexture('alpha');
		this.spriteAdd = spriteTexture('add');
		const quad = new THREE.PlaneGeometry(1, 1);
		const hideMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
		// drifting dust motes round the candle (warm, additive, tiny)
		const N = 40;
		this.motes = Array.from({ length: N }, (_, i) => ({ x: (C.hash01(i, 1) - 0.5) * 2.4, y: 0.2 + C.hash01(i, 2) * 1.2, z: 0.1 + C.hash01(i, 3) * 0.5, p: C.hash01(i, 4) * 6.28, s: 0.01 + C.hash01(i, 5) * 0.02, size: 0.005 + C.hash01(i, 6) * 0.006 }));
		this.moteMaterial = new THREE.MeshBasicMaterial({ name: 'Dust motes', map: this.spriteAdd, color: new THREE.Color(0.55, 0.38, 0.22), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
		this.moteMesh = NO_PICK(new THREE.InstancedMesh(quad, this.moteMaterial, N));
		this.moteMesh.frustumCulled = false;
		this.moteMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		for (let i = 0; i < N; i++) this.moteMesh.setMatrixAt(i, hideMatrix);
		this.scene.add(this.moteMesh);
		// the crumbling hand: warm grey ash, lit by the candle (Lambert, a trace of emissive so the far side is not black), soft round grains of many sizes, a few big flakes
		const P = 720;
		this.ashColor = new THREE.Color('#8c877d');
		this.dustMaterial = new THREE.MeshLambertMaterial({ name: 'Hand ash', map: this.spriteAlpha, transparent: true, depthWrite: false, emissive: new THREE.Color(0.02, 0.019, 0.017) });
		this.dustMesh = NO_PICK(new THREE.InstancedMesh(quad, this.dustMaterial, P));
		this.dustMesh.frustumCulled = false;
		this.dustMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		for (let i = 0; i < P; i++) {
			this.dustMesh.setMatrixAt(i, hideMatrix);
			this.dustMesh.setColorAt(i, this.ashColor);
		}
		this.scene.add(this.dustMesh);
		this.fxPools = Object.fromEntries(Object.entries(C.FX_PRESETS).map(([kind, preset]) => [kind, new FxPool(this.scene, preset, kind === 'dust' ? 260 : 140, fxSprite(preset.sprite))]));
		this.dust = { N: P, next: 0, live: false, p: Array.from({ length: P }, () => ({ age: 9, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0, heavy: 1, rest: false })) };
		this._m4 = new THREE.Matrix4();
		this._s3 = new THREE.Vector3();
		this._p3 = new THREE.Vector3();
		this._col = new THREE.Color();
	}

	/** `count` grains born on the hand's surface between local z = zLo and zHi (the dissolve front), in world space. */
	spawnDust(slot, count, zLo, zHi) {
		const d = this.dust;
		d.live = true;
		const pts = slot.dust;
		let i0 = 0;
		let i1 = pts.length;
		// pts is sorted by z: binary search the band
		let lo = 0;
		let hi = pts.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (pts[mid].z < zLo) lo = mid + 1;
			else hi = mid;
		}
		i0 = lo;
		hi = pts.length;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (pts[mid].z <= zHi) lo = mid + 1;
			else hi = mid;
		}
		i1 = lo;
		if (i1 <= i0) [i0, i1] = [Math.max(0, Math.min(pts.length - 1, i0 - 1)), Math.min(pts.length, i0 + 1)];
		const world = this._p3;
		for (let n = 0; n < count; n++) {
			const src = pts[i0 + Math.floor(Math.random() * (i1 - i0))];
			world.copy(src);
			slot.armG.localToWorld(world);
			const q = d.p[d.next];
			const k = d.next;
			d.next = (d.next + 1) % d.N;
			const big = Math.random() < 0.07;
			const size = big ? 0.03 + Math.random() * 0.028 : 0.007 + Math.random() ** 2 * 0.02;
			Object.assign(q, { age: 0, life: (big ? 2.2 : 1.1) + Math.random() * 1.7, x: world.x, y: world.y, z: world.z, size, heavy: big ? 1.5 : 0.7 + Math.random() * 0.5, rest: false,
				vx: (Math.random() - 0.5) * 0.22, vy: 0.02 + Math.random() * 0.09, vz: (Math.random() - 0.35) * 0.2 });
			const tone = (big ? 0.55 : 0.62) + Math.random() * 0.3;
			this.dustMesh.setColorAt(k, this._col.copy(this.ashColor).multiplyScalar(tone));
		}
		if (this.dustMesh.instanceColor) this.dustMesh.instanceColor.needsUpdate = true;
	}

	updateDust(delta) {
		const d = this.dust;
		const camQ = this.app.rig.camera.quaternion;
		if (d.live && delta > 0) {
			let live = false;
			for (let i = 0; i < d.N; i++) {
				const q = d.p[i];
				if (q.age >= 9) continue;
				if (q.age >= q.life) {
					this.dustMesh.setMatrixAt(i, this._m4.makeScale(0, 0, 0));
					q.age = 9;
					live = true; // upload this frame's removal
					continue;
				}
				live = true;
				q.age += delta;
				if (!q.rest) {
					const damp = Math.exp(-1.6 * delta);
					q.vx *= damp;
					q.vz *= damp;
					q.vy = q.vy * Math.exp(-0.7 * delta) - 0.5 * q.heavy * delta; // ash falls
					q.x += (q.vx + Math.sin(this.time * 2.1 + i) * 0.02) * delta;
					q.y += q.vy * delta;
					q.z += q.vz * delta;
					if (q.y < 0.006 && q.z > 0 && q.z < C.LEDGE.depth - 0.02 && Math.abs(q.x) < C.LEDGE.width / 2) {
						q.y = 0.006; // it lands on the ledge and stays
						q.rest = true;
					}
				}
				const t = q.age / q.life;
				const s = q.size * (1 - C.smoothstep(0.62, 1, t)) * (0.55 + 0.45 * C.smoothstep(0, 0.08, t));
				this._m4.compose(this._p3.set(q.x, q.y, q.z), camQ, this._s3.set(s, s, 1));
				this.dustMesh.setMatrixAt(i, this._m4);
			}
			this.dustMesh.instanceMatrix.needsUpdate = true;
			d.live = live;
		}
	}

	// ---- interaction -----------------------------------------------------------------------------------------------------------

	setRay(clientX, clientY) {
		const rect = this.app.backend.canvas.getBoundingClientRect();
		this._ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
		this._ray.setFromCamera(this._ndc, this.app.rig.camera);
	}

	/** Slot under the pointer (client coordinates), by the static pick capsules of the hands at rest, or -1. */
	pick(clientX, clientY) {
		this.setRay(clientX, clientY);
		this.proxyRoot.updateMatrixWorld(true);
		const targets = this.proxyRoot.children.filter((p) => !this.slots[p.userData.slot].hidden);
		const hit = this._ray.intersectObjects(targets, false)[0];
		return hit ? hit.object.userData.slot : -1;
	}

	/** True when the pointer is over the hand that is held out (its real, animated meshes). */
	pickChosen(clientX, clientY) {
		const slot = this.slots[this.sel];
		if (!slot) return false;
		this.setRay(clientX, clientY);
		slot.handProxy.updateWorldMatrix(true, false);
		return this._ray.intersectObject(slot.handProxy, false).length > 0;
	}

	/** Hover a slot (-1 = none): only while nothing is chosen. */
	hover(index) {
		this.keyHover = index;
	}

	/** Choose a hand: it reaches out of the wall. instant = jump to the end (tests). */
	select(index, instant = false) {
		const slot = this.slots[index];
		if (!slot || slot.hidden || this.state !== 'idle') return false;
		this.sel = index;
		this.camSlot = slot;
		this.state = 'reach';
		this.pendingGrab = false;
		this.resetShowcase();
		this.hoverIndex = this.keyHover = -1;
		this.tween(1, this.settings.duration, C.easeOutBack, instant);
		this.syncUi();
		return true;
	}

	/** Back to the wall (Esc, right click, the button), also while the hand is still coming out. */
	back(instant = false) {
		if (this.state !== 'reach') return false;
		this.state = 'back';
		this.pendingGrab = false;
		this.resetShowcase();
		this.tween(0, this.settings.duration * 0.78, C.easeInOutCubic, instant);
		if (instant) this.finishBack();
		this.syncUi();
		return true;
	}

	resetShowcase() {
		const sc = this.showcase;
		sc.active = false;
		sc.done = false;
		sc.started = false;
		sc.t = 0;
	}

	finishBack() {
		const slot = this.slots[this.sel];
		if (slot) {
			slot.wristG.scale.setScalar(1); // the showcase's squeeze / tremor leave nothing behind
			slot.wristG.position.set(0, 0, C.HAND_MODELS[slot.def.source].wrist);
		}
		Object.assign(this.showcase, { roll: 0, squeeze: 0, tremor: 0, grip: 0, shake: 1, cam: 0 });
		this.classLight.intensity = 0; // the hand is back in the wall: its light goes with it
		this.state = 'idle';
		this.sel = -1;
		this.syncUi();
	}

	/**
	 * Take the hand: a tremble, then it dissolves from the fingertips to the wrist into ash and the screen goes black on the chosen class. Asked before the hand has come
	 * out far enough (C.GRAB_AT) the order is remembered and runs the moment it has; refused (false) when no hand is held out.
	 */
	grab(instant = false) {
		if (this.state !== 'reach' || this.reach.to !== 1) return false;
		if (instant) this.skipShowcase();
		if ((!this.offered || this.showcase.active) && !instant) {
			this.pendingGrab = true;
			return true;
		}
		this.pendingGrab = false;
		this.state = 'grasp';
		this.grasp = { t: 0, spawned: 0, front: C.HAND_LENGTH + 0.03 };
		this.gripW = 0;
		if (!this.slots[this.sel].skinned || instant) this.sliceSlot(this.slots[this.sel]); // a skinned hand is cut when its fingers have closed (updateGrasp)
		if (instant) this.grasp.t = C.TIMES.endAt + 0.01;
		this.syncUi();
		return true;
	}

	/** After the end card, or whenever asked: the wall as it was (also in the middle of a reach or a grasp). */
	replay() {
		if (this.state === 'idle') return;
		for (const s of this.slots) this.resetSlot(s);
		this.state = 'idle';
		this.sel = -1;
		this.camSlot = null;
		this.pendingGrab = false;
		this.resetShowcase();
		Object.assign(this.showcase, { roll: 0, squeeze: 0, tremor: 0, grip: 0, shake: 1, cam: 0, def: null }); // nothing of a showcase cut short carries over to the next hand
		this.classLight.intensity = 0;
		for (const pool of Object.values(this.fxPools)) pool.clear();
		this.gripW = 0;
		this.reach = { value: 0, from: 0, to: 0, t: 1, dur: 1, ease: C.easeOutBack };
		this.retract = 0;
		this.camP = 0;
		this.grasp = { t: 0, spawned: 0, front: 9 };
		this.dust.live = true;
		this.syncUi();
	}

	resetSlot(s) {
		for (const m of s.mats) {
			m.opacity = 1;
			m.emissive?.setRGB(0, 0, 0);
		}
		this.unsliceSlot(s);
		s.armG.visible = true;
		s.wristG.scale.setScalar(1);
		s.wristG.position.set(0, 0, C.HAND_MODELS[s.def.source].wrist);
		s.hover = 0;
	}

	tween(to, dur, ease, instant) {
		const r = this.reach;
		r.from = r.value;
		r.to = to;
		r.dur = Math.max(0.05, dur);
		r.ease = ease;
		r.t = instant ? 1 : 0;
		if (instant) r.value = to;
	}

	bindEvents() {
		const { app } = this;
		const canvas = app.backend.canvas;
		const on = (target, type, fn, opts) => {
			target.addEventListener(type, fn, opts);
			this.listeners.push(() => target.removeEventListener(type, fn, opts));
		};
		on(canvas, 'pointermove', (e) => {
			if (e.pointerType === 'touch') return;
			if (this.state === 'idle') {
				this.hoverIndex = this.pick(e.clientX, e.clientY);
				this.keyHover = -1;
				canvas.style.cursor = this.hoverIndex >= 0 ? 'pointer' : '';
			} else if (this.state === 'reach') canvas.style.cursor = this.pickChosen(e.clientX, e.clientY) ? 'pointer' : ''; // the offered hand: click it to take it
			else canvas.style.cursor = '';
		});
		on(canvas, 'pointerleave', () => (this.hoverIndex = -1));
		on(canvas, 'contextmenu', (e) => {
			if ((this.state === 'reach' || this.state === 'back') && !this.handtest.on) e.preventDefault();
			if (this.state === 'reach' && !this.handtest.on) this.back();
		});
		on(window, 'keydown', (e) => {
			if (e.key === 'Escape' && this.handtest.on) this.exitHandTest();
			else if (e.key === 'Escape' && this.state === 'reach') this.back();
		});
		this.listeners.push(
			app.on('click', (e) => {
				app.consumedClick = true; // nothing else to select in this scene
				if (this.state === 'idle') {
					const i = this.pick(e.clientX, e.clientY);
					if (i >= 0) this.select(i);
				} else if (this.state === 'reach' && !this.handtest.on && this.pickChosen(e.clientX, e.clientY)) {
					if (this.showcase.active) this.skipShowcase(); // a click on the hand while it shows itself: enough, offer it
					else this.grab(); // "choose which hand to take": the one held out
				}
			}),
			app.on('key', (k, e) => {
				if (this.onKey(k)) e?.preventDefault?.();
			}),
		);
	}

	/** Returns true when the key was used. */
	onKey(k) {
		const live = this.slots.filter((s) => !s.hidden).map((s) => s.index);
		if (this.state === 'idle') {
			const current = this.keyHover >= 0 ? this.keyHover : this.hoverIndex;
			if (k === 'arrowright' || k === 'arrowleft') {
				const dir = k === 'arrowright' ? 1 : -1;
				const at = live.indexOf(current);
				this.hover(live[(at < 0 ? (dir > 0 ? 0 : live.length - 1) : (at + dir + live.length) % live.length)]);
				this.hoverIndex = -1;
				return true;
			}
			if (/^[1-6]$/.test(k)) {
				const i = Number(k) - 1;
				if (live.includes(i)) (this.hover(i), (this.hoverIndex = -1));
				return true;
			}
			if ((k === 'enter' || k === ' ') && current >= 0) return this.select(current);
		} else if (this.state === 'reach' && !this.handtest.on) {
			if (k === 'enter' || k === ' ') return this.showcase.active ? this.skipShowcase() : this.grab();
			if (k === 'backspace') return this.back();
		} else if (this.state === 'done' && (k === 'enter' || k === ' ')) {
			this.replay();
			return true;
		}
		return false;
	}

	// ---- UI --------------------------------------------------------------------------------------------------------------------

	buildUi() {
		const host = this.app.dom.viewport;
		this.styleEl = document.createElement('style');
		this.styleEl.textContent = UI_STYLE;
		document.head.appendChild(this.styleEl);
		const el = document.createElement('div');
		el.className = 'ch-ui';
		el.innerHTML = `
			<img class="ch-keyart" alt="" draggable="false">
			<div class="ch-fade"></div>
			<div class="ch-hint">Rê chuột lên một bàn tay · ← → hoặc 1–6 để chọn · Enter / click: bàn tay giơ ra</div>
			<div class="ch-caption"><div class="ch-name"></div><div class="ch-quote"></div><div class="ch-tag"></div></div>
			<div class="ch-actions"><button class="ch-btn main" data-act="grab" tabindex="-1">Nắm tay</button><button class="ch-btn" data-act="back" tabindex="-1">Quay lại</button><button class="ch-btn" data-act="showcase" tabindex="-1">Xem lại showcase</button></div>
			<div class="ch-end"><div class="ch-end-name"></div><div class="ch-end-quote"></div><div class="ch-end-note"></div><button class="ch-btn" data-act="replay" tabindex="-1">Chơi lại</button></div>`.normalize('NFC');
		host.appendChild(el);
		this.ui = {
			keyart: el.querySelector('.ch-keyart'),
			root: el,
			fade: el.querySelector('.ch-fade'),
			hint: el.querySelector('.ch-hint'),
			caption: el.querySelector('.ch-caption'),
			name: el.querySelector('.ch-name'),
			quote: el.querySelector('.ch-quote'),
			tag: el.querySelector('.ch-tag'),
			actions: el.querySelector('.ch-actions'),
			end: el.querySelector('.ch-end'),
			endName: el.querySelector('.ch-end-name'),
			endQuote: el.querySelector('.ch-end-quote'),
			endNote: el.querySelector('.ch-end-note'),
		};
		// the buttons never keep keyboard focus: a focused button turns Enter / Space into a second "click" on top of the scene's own key handling
		el.addEventListener('mousedown', (e) => {
			if (e.target.closest('button')) e.preventDefault();
		});
		el.addEventListener('click', (e) => {
			const btn = e.target.closest('[data-act]');
			if (!btn) return;
			btn.blur();
			if (e.detail === 0) return; // a click made by the keyboard (Enter / Space on a focused button), not by the pointer: the key handler has already acted
			const act = btn.dataset.act;
			if (act === 'grab') this.grab();
			else if (act === 'back') this.back();
			else if (act === 'showcase') this.playShowcase();
			else if (act === 'replay') this.replay();
		});
		this.syncUi();
	}

	destroyUi() {
		this.ui?.root.remove();
		this.styleEl?.remove();
		this.ui = null;
		this.styleEl = null;
	}

	/** Showcase particles alive (all kinds). */
	get fxLive() {
		return Object.values(this.fxPools).reduce((n, pool) => n + pool.live, 0);
	}

	/** True once the offered hand is far enough out to be taken: the Nắm tay / Quay lại buttons show then. */
	get offered() {
		return this.state === 'reach' && !this.handtest.on && this.reach.to === 1 && this.reach.value >= C.GRAB_AT && !this.showcase.active && !(this.settings.showcase && !this.showcase.started);
	}

	/** Static parts of the UI that follow the state (buttons, end card); the caption is faded per frame in updateUi. */
	syncUi() {
		const ui = this.ui;
		if (!ui) return;
		this._offeredShown = this.offered;
		ui.actions.classList.toggle('on', this._offeredShown);
		ui.end.classList.toggle('on', this.state === 'done');
		if (this.state === 'done') {
			const def = this.slots[this.sel].def;
			ui.endName.textContent = def.name;
			ui.endQuote.textContent = `“${def.quote}”`;
			ui.endNote.textContent = def.standIn ? 'stand-in · bản tay chưa dựng' : '';
		}
	}

	updateUi(delta) {
		const ui = this.ui;
		if (!ui) return;
		if (this.offered !== this._offeredShown) this.syncUi();
		const s = this.settings;
		if (s.overlay > 0 && !ui.keyart.src) ui.keyart.src = assetUrl('choice-hands/choice-keyart.webp'); // the calibration image is only fetched when the overlay is used
		ui.keyart.style.opacity = String(s.overlay);
		const hov = this.state === 'idle' ? (this.keyHover >= 0 ? this.keyHover : this.hoverIndex) : -1;
		const want = this.state === 'reach' ? this.sel : this.state === 'idle' ? hov : -1;
		const cap = this.cap;
		const wanted = s.quote ? want : -1;
		if (wanted !== cap.shown) {
			cap.alpha = C.damp(cap.alpha, 0, 12, delta);
			if (cap.alpha < 0.03) {
				cap.shown = wanted;
				if (wanted >= 0) {
					const c = C.captionFor(this.slots[wanted].def);
					ui.name.textContent = `${c.name} · ${this.slots[wanted].def.id}`;
					ui.quote.textContent = `“${c.quote}”`;
					ui.tag.textContent = c.tag;
					this._tagBase = c.tag;
				}
			}
		} else cap.alpha = C.damp(cap.alpha, wanted >= 0 ? 1 : 0, 3.2, delta);
		if (this.state === 'reach' && cap.shown === this.sel && this.sel >= 0) {
			const note = this.showcase.active ? this.showcase.def.note : (this._tagBase ?? '');
			if (ui.tag.textContent !== note) ui.tag.textContent = note; // while the hand shows itself the line under the quote names the marks
		}
		ui.caption.style.opacity = cap.alpha.toFixed(3);
		ui.caption.style.bottom = this.state === 'reach' ? '13%' : '8%';
		const idleHint = this.state === 'idle' && hov < 0 && this.time > 1.2;
		ui.hint.style.opacity = idleHint ? '1' : '0';
		// fade to black during the grasp
		const g = this.grasp.t;
		const fade = this.state === 'grasp' || this.state === 'done' ? C.smoothstep(C.TIMES.fadeAt, C.TIMES.fadeAt + 1.2, g) : 0;
		ui.fade.style.opacity = fade.toFixed(3);
	}

	// ---- per frame -------------------------------------------------------------------------------------------------------------

	update(delta, elapsed) {
		if (!this.ready) return;
		const s = this.settings;
		delta = Math.min(delta, 0.1);
		this.time += delta;
		const r = this.reach;
		if (r.t < 1) {
			r.t = Math.min(1, r.t + delta / r.dur);
			r.value = r.from + (r.to - r.from) * r.ease(r.t);
			if (r.t >= 1) r.value = r.to;
		}
		if (this.state === 'back' && r.t >= 1) this.finishBack();
		if (this.state === 'reach' && !this.showcase.started && r.t >= 1 && r.to === 1 && this.settings.showcase) this.playShowcase(); // the hand is out: it shows what it is
		if (this.pendingGrab && this.showcase.active) this.skipShowcase(); // a grab ordered during the showcase: the player has seen enough
		if (this.pendingGrab && this.offered) this.grab(); // the order given while the hand was still coming out or showing itself
		const away = this.state !== 'idle'; // another hand is up: the five sink
		this.retract = C.damp(this.retract, this.state === 'idle' ? 0 : this.state === 'back' ? 0 : 1, this.state === 'back' ? 3 : 1.6, delta);
		const activeHover = this.state === 'idle' ? (this.keyHover >= 0 ? this.keyHover : this.hoverIndex) : -1;
		this.updateHandTest(delta);
		for (const slot of this.slots) this.updateSlot(slot, delta, elapsed, activeHover, s, away);
		this.updateShowcase(delta);
		if (this.state === 'grasp') this.updateGrasp(delta);
		this.updateLight(delta, elapsed, activeHover, s);
		this.updateCamera(delta, s);
		this.updateMotes(elapsed, s);
		this.updateDust(delta);
		this.updateUi(delta);
		this.flames.update(elapsed);
	}

	updateSlot(slot, delta, elapsed, activeHover, s, away) {
		if (slot.hidden) return;
		const chosen = slot.index === this.sel;
		slot.hover = C.damp(slot.hover, slot.index === activeHover ? 1 : 0, 6, delta);
		const reachW = chosen ? this.reach.value : 0;
		const retractW = chosen ? 0 : this.retract;
		const pose = C.armPose(slot.def, slot.geo, { hover: slot.hover, reach: reachW, retract: retractW }, this._pose);
		// the reach amplitude from the panel scales the slide (the retract and hover stay)
		const slide = pose.slide + (s.reach - C.ARM.slide) * Math.max(0, reachW);
		// breathing: a few mm and a fraction of a degree, out of phase, quieter when it is the one being offered
		const calm = 1 - Math.min(1, Math.abs(reachW));
		const breath = Math.sin(elapsed * 0.85 + slot.phase);
		const back = slot.geo.back;
		slot.root.quaternion.copy(pose.quat);
		if (chosen && Math.abs(this.showcase.roll) > 1e-3) slot.root.quaternion.multiply(this._qr.setFromAxisAngle(this._zAxis, (this.showcase.roll * slot.geo.rollSign * Math.PI) / 180)); // the showcase turns the hand about its forearm, AGAINST the turn it made on the way out (geo.rollSign)
		slot.root.rotateX(breath * 0.006 * calm);
		slot.root.rotateY(Math.sin(elapsed * 0.6 + slot.phase * 2) * 0.004 * calm);
		slot.slideG.position.z = -back + slide + breath * 0.003 * calm;
		slot.wristG.rotation.x = pose.wrist;
		// light on the hands: the other five go dark, the hovered / chosen one warms a little
		const dimTarget = away && !chosen ? 0.07 : 1;
		slot.dim = C.damp(slot.dim, dimTarget, away ? 1.4 : 2.5, delta);
		const warm = 0.06 * slot.hover + (chosen ? 0.05 * Math.min(1, reachW) : 0);
		// procedural fingers (only a rigged model): relaxed at rest, a little stirred by the hover, fanned open when offered, a fist on the grasp
		if (slot.rig) {
			if (chosen && this.handtest.on) {
				slot.rig.applyPose(this.handtest.motion.pose); // the hand-test mode drives every joint
				slot.joints?.apply(this.handtest.motion.pose);
			} else slot.rig.apply(Math.max(chosen ? reachW : 0, 0.18 * slot.hover), chosen ? Math.max(this.gripW, this.showcase.grip) : 0, breath);
		}
		for (const m of slot.mats) {
			m.color.copy(m.userData.base).multiplyScalar(s.handLight * (1 + s.handOuter * slot.outerK) * slot.dim * (1 + 0.07 * slot.hover + (chosen ? 0.04 * Math.min(1, reachW) : 0)));
			if (m.emissive) m.emissive.setRGB(0.5 * warm, 0.28 * warm, 0.1 * warm);
		}
	}

	updateGrasp(delta) {
		const g = this.grasp;
		g.t += delta;
		const slot = this.slots[this.sel];
		const T = C.TIMES;
		// tremble: the hand edges toward the viewer and shakes a little, the fingers closing (a rigged hand) or a uniform squeeze about the wrist (a static one)
		const tr = Math.min(1, g.t / T.tremble);
		this.gripW = C.easeInOutCubic(Math.min(1, g.t / (T.tremble * 0.85)));
		const shake = Math.sin(g.t * 52) * 0.0035 * Math.sin(Math.PI * Math.min(1, g.t / T.tremble)) + (g.t >= T.tremble ? Math.sin(g.t * 38) * 0.0012 : 0);
		const wz = C.HAND_MODELS[slot.def.source].wrist;
		const toward = 0.035 * C.easeOutCubic(tr);
		const cr = C.clamp((g.t - T.tremble) / T.crumble, 0, 1);
		const squeeze = 1 - (slot.rig ? 0 : 0.035 * C.easeOutCubic(tr)) - 0.03 * cr;
		slot.wristG.position.set(shake, shake * 0.7 - 0.02 * cr, wz + toward);
		slot.wristG.scale.setScalar(squeeze);
		// the dissolve: the arm is cut into thin slabs across its length (sliceSlot); the front sweeps from the fingertips to the sleeve end (z of the arm frame, +z = fingers) and
		// every slab above it disappears, so the hand wears away from its tips toward the wrist; the ash is born on the surface just behind the front. (A clipping plane would do
		// the same, but WebGPURenderer r180 does not clip in the lab's scene pass: slabs are plain visibility, identical on both backends, shadow included)
		if (slot.skinned && !slot.slices && g.t >= T.tremble * 0.9) this.sliceSlot(slot); // the posed (fist) vertices of the skinned hand become static slabs now
		const front = C.lerp(C.HAND_LENGTH + 0.03, -0.12, C.easeInOutCubic(cr));
		g.front = front;
		if (slot.slices) for (const sl of slot.slices) sl.mesh.visible = sl.lo < front;
		slot.armG.visible = front > -0.1;
		if (g.t > T.tremble * 0.8 && g.t < T.tremble + T.crumble * 1.05 && this.settings.dust) {
			const rate = 520 * (0.35 + Math.sin(Math.PI * C.clamp((g.t - T.tremble * 0.8) / (T.crumble * 1.2), 0, 1))); // grains per second
			g.spawned += rate * delta;
			const n = Math.floor(g.spawned);
			if (n > 0) {
				g.spawned -= n;
				this.spawnDust(slot, n, front - 0.015, front + 0.07);
			}
		}
		if (g.t >= T.endAt && this.state === 'grasp') {
			this.state = 'done';
			this.syncUi();
		}
	}

	/**
	 * Cut the static meshes of a hand into slabs across the forearm axis: every mesh becomes up to SLABS meshes that SHARE its vertex buffers and material (only the index
	 * buffer differs: each triangle goes to the slab of its centroid's z in the arm frame), the original is hidden. Slab 0 holds everything below C.SLAB_Z0 (the sleeve and the
	 * tube in the wall), which is never hidden before the very end. Skinned meshes (a future rigged hand) are not cut: they vanish with the arm group at the end.
	 */
	/**
	 * The vertices of a skinned mesh AS POSED NOW (CPU skinning with the skeleton's bone matrices: position and normal), as a plain static twin mesh beside it: the dissolve cuts static
	 * meshes into slabs, and a skinned one cannot be (WebGPU r180 does not clip it either). The twin keeps UVs, indices and the material; the skinned original is hidden.
	 */
	freezeSkinned(o) {
		const g = o.geometry;
		const baked = C.bakeSkinned(o);
		const tg = new THREE.BufferGeometry();
		tg.setAttribute('position', new THREE.BufferAttribute(baked.position, 3));
		tg.setAttribute('normal', new THREE.BufferAttribute(baked.normal, 3));
		if (g.attributes.uv) tg.setAttribute('uv', g.attributes.uv.clone()); // the twin OWNS its attributes: disposing it (and its slabs) never deletes a buffer the skinned original or another slot still uses
		tg.setIndex(g.index.clone());
		const twin = new THREE.Mesh(tg, o.material);
		twin.name = `${o.name || 'hand'} (posed)`;
		twin.userData.frozenTwin = true;
		twin.userData.labNoPick = twin.userData.labNoCollide = true;
		twin.castShadow = o.castShadow;
		twin.receiveShadow = o.receiveShadow;
		twin.frustumCulled = false;
		o.matrix.decompose(twin.position, twin.quaternion, twin.scale);
		const inside = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ name: 'cut interior', color: new THREE.Color(0.045, 0.04, 0.036), side: THREE.BackSide }));
		inside.userData.cutInterior = true;
		inside.userData.labNoPick = inside.userData.labNoCollide = true;
		inside.castShadow = false;
		twin.add(inside);
		o.parent.add(twin);
		o.visible = false;
		return { twin, original: o, inside };
	}

	sliceSlot(slot) {
		if (slot.slices) return;
		if (slot.sliceCache && !slot.skinned) {
			for (const sl of slot.sliceCache) {
				sl.mesh.visible = true;
				slot.armG.add(sl.mesh);
				sl.original.visible = false;
			}
			slot.slices = slot.sliceCache;
			return;
		}
		const { SLABS, SLAB_Z0, SLAB_Z1 } = C;
		const dz = (SLAB_Z1 - SLAB_Z0) / SLABS;
		slot.frozen = [];
		if (slot.skinned) {
			const skinned = [];
			slot.armG.traverse((o) => {
				if (o.isSkinnedMesh && o.visible) skinned.push(o);
			});
			for (const o of skinned) slot.frozen.push(this.freezeSkinned(o));
			const twin = slot.frozen.find((f) => f.original.name === 'hand')?.twin ?? slot.frozen[0]?.twin;
			if (twin) { // the ash is born on the posed surface
				const p = twin.geometry.attributes.position;
				const pts = [];
				for (let i = 0; i < p.count; i += Math.max(1, Math.floor(p.count / 900))) if (p.getZ(i) > -0.02) pts.push(new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)));
				slot.dust = pts.sort((a, b) => a.z - b.z);
			}
		}
		const list = [];
		slot.armG.traverse((o) => {
			if (o.isMesh && !o.isSkinnedMesh && o !== slot.handProxy && o.geometry && !o.userData.slab) list.push(o);
		});
		slot.armG.updateWorldMatrix(true, true);
		const inv = new THREE.Matrix4().copy(slot.armG.matrixWorld).invert();
		slot.slices = [];
		for (const o of list) {
			// every mesh is cut by its z in the ARM frame (the rings of PS are a torus of +-6 mm placed at z 0.22 m: cut in their own space they would all fall in one slab),
			// and its slabs are attached straight to armG with the mesh's full matrix to armG (interior shells included)
			const toArm = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
			const e = toArm.elements;
			const g = o.geometry;
			const pos = g.attributes.position;
			const idx = g.index ? g.index.array : null;
			const n = idx ? idx.length : pos.count;
			const zOf = (i) => e[2] * pos.getX(i) + e[6] * pos.getY(i) + e[10] * pos.getZ(i) + e[14];
			const bins = Array.from({ length: SLABS + 1 }, () => []);
			for (let t = 0; t + 2 < n; t += 3) {
				const a = idx ? idx[t] : t;
				const b = idx ? idx[t + 1] : t + 1;
				const c = idx ? idx[t + 2] : t + 2;
				const k = C.clamp(Math.floor(((zOf(a) + zOf(b) + zOf(c)) / 3 - SLAB_Z0) / dz) + 1, 0, SLABS);
				bins[k].push(a, b, c);
			}
			bins.forEach((list3, k) => {
				if (!list3.length) return;
				const sg = new THREE.BufferGeometry();
				for (const [name, attr] of Object.entries(g.attributes)) sg.setAttribute(name, attr);
				sg.setIndex(new THREE.BufferAttribute(new Uint32Array(list3), 1));
				const m = new THREE.Mesh(sg, o.material);
				m.name = `${o.name || o.geometry.type} slab ${k}`;
				m.userData.slab = true;
				m.userData.labNoPick = m.userData.labNoCollide = true;
				m.castShadow = o.castShadow;
				m.receiveShadow = o.receiveShadow;
				m.frustumCulled = false;
				toArm.decompose(m.position, m.quaternion, m.scale);
				slot.armG.add(m);
				slot.slices.push({ mesh: m, lo: k === 0 ? -Infinity : SLAB_Z0 + (k - 1) * dz, original: o });
			});
			o.visible = false;
		}
	}

	/**
	 * Back to the whole meshes (replay): the slabs leave the arm, the originals show again. The slabs are KEPT (slot.sliceCache) for the next grasp and freed with the scene:
	 * their vertex attributes are shared with the original mesh (and with every slot built from the same GLB), so a slab's geometry must never be disposed on its own.
	 */
	unsliceSlot(slot) {
		if (!slot.slices) return;
		for (const sl of slot.slices) {
			sl.mesh.removeFromParent();
			sl.original.visible = true;
		}
		if (slot.frozen?.length) { // a skinned hand is cut anew every time (its pose differs): nothing is cached, the posed twins and their slabs are freed
			for (const sl of slot.slices) sl.mesh.geometry.dispose();
			for (const f of slot.frozen) {
				f.twin.removeFromParent();
				f.twin.geometry.dispose();
				f.inside.material.dispose();
				f.original.visible = true;
			}
			slot.frozen = [];
			slot.slices = null;
			return;
		}
		slot.sliceCache = slot.slices;
		slot.slices = null;
	}

	// ---- hand test: a close look at one rigged hand, every joint under the user's hand --------------------------------------------------------------------

	syncHandTestUi() {} // replaced by the panel (buildHandTestControls)

	/** A synthetic stand-in rig (scripts/glb_rig_tools.py fake_rig) is flagged in the GLB's asset.extras. */
	get rigIsSynthetic() {
		return !!this.gltfs.flrig?.asset?.extras?.synthetic_rig;
	}

	/** Does this slot get the rigged hand? Only the Flagellant, when the toggle is on and the GLB exists; a synthetic rig only in the hand test (or when rigAlways is on). */
	wantsRig(def) {
		return def.id === 'FL' && this.settings.flRig && !!this.gltfs.flrig && (!this.rigIsSynthetic || this.handtest.on || this.settings.rigAlways);
	}

	/** The slot whose rig is on the table (the Flagellant), or null when it has no skeleton. */
	handtestSlot() {
		return this.slots[this.handtest.index] ?? null;
	}

	/**
	 * Enter the hand-test mode (?scene=choiceHands&handtest=1, or the panel): the Flagellant's hand comes out and rests offered, the camera comes close and is FREE (orbit / zoom), the UI of the
	 * scene and the showcase are off, and the joints follow a HandMotion (sliders, presets, the auto loop). Esc or the panel button leaves it.
	 */
	enterHandTest(index = C.SLOTS.findIndex((d) => d.id === 'FL')) {
		const ht = this.handtest;
		if (ht.on) return true;
		if (!this.slots[index] || this.slots[index].hidden) return false;
		if (this.state !== 'idle') this.replay();
		ht.on = true;
		ht.index = index;
		if (!this.slots[index].skinned && this.wantsRig(this.slots[index].def)) this.swapFlSlot(); // the hand of the test is the rigged one
		ht.keepLock = this.settings.lockCamera;
		this.settings.lockCamera = false;
		ht.mode = 'preset';
		ht.preset = 'offer';
		ht.profile = this.handtestSlot().profile ?? 'default'; // the finger tables of this model (the real rig has its own)
		ht.motion = new C.HandMotion(C.presetPose('offer', 0, ht.profile));
		ht.t = 0;
		ht.presetT0 = 0;
		ht.runT = 0;
		ht.runIndex = -1;
		if (this.ui) this.ui.root.style.display = 'none';
		this.select(index, true);
		this.reach.value = 1;
		this.placeHandTestCamera();
		this.syncHandTestUi();
		return true;
	}

	exitHandTest() {
		const ht = this.handtest;
		if (!ht.on) return;
		const slot = this.handtestSlot();
		ht.on = false;
		this.setHandTestSkeleton(false);
		this.setHandTestWire(false);
		slot?.joints?.apply(C.emptyPose());
		this.settings.lockCamera = ht.keepLock;
		if (this.ui) this.ui.root.style.display = '';
		this.replay();
		if (slot?.skinned && !this.wantsRig(slot.def)) this.swapFlSlot(); // a synthetic rig goes back to the static hand
		this.syncHandTestUi();
	}

	/** The free camera of the hand test: above and in front of the offered hand, close. (The user orbits from here.) */
	placeHandTestCamera() {
		const slot = this.handtestSlot();
		if (!slot || !this.app.rig) return;
		const focus = this.anchorWorld(slot, 'palm', new THREE.Vector3());
		focus.addScaledVector(slot.geo.dirReach, 0.1 * slot.geo.scale);
		const view = new THREE.Vector3(0.18, 0.62, 0.78).normalize();
		this.app.rig.lookAt(focus.clone().addScaledVector(view, 0.9), focus);
	}

	/** A preset (by id) becomes the target; a dynamic one (the wave) is evaluated every frame. `instant` jumps there (screenshots, tests). */
	setHandPreset(id, { instant = false } = {}) {
		const ht = this.handtest;
		if (!C.presetSet(ht.profile)[id]) return false;
		ht.mode = 'preset';
		ht.preset = id;
		ht.presetT0 = ht.t;
		if (!ht.motion) ht.motion = new C.HandMotion(C.presetPose(id, 0, ht.profile));
		ht.motion.setTarget(C.presetPose(id, 0, ht.profile), { instant });
		if (instant) ht.motion.update(0);
		return true;
	}

	/** The auto loop through every preset (smooth, with the lag between the fingers). */
	setHandTestRun(on) {
		const ht = this.handtest;
		ht.mode = on ? 'run' : 'preset';
		ht.runT = 0;
		ht.runIndex = -1;
		if (!on) ht.presetT0 = ht.t;
	}

	/** The pose the panel's sliders hold, as a pose. */
	handTestPoseFromUi() {
		const u = this.handtest.ui;
		const p = C.emptyPose();
		for (const f of Object.keys(p.fingers)) p.fingers[f] = { curl: [u[f].mcp, u[f].pip, u[f].dip], spread: u[f].spread };
		p.wrist = { flex: u.wrist.flex, dev: u.wrist.dev };
		p.roll = u.wrist.roll;
		return C.clampPose(p);
	}

	updateHandTest(delta) {
		const ht = this.handtest;
		if (this.pendingHandTest && this.ready) {
			this.pendingHandTest = false;
			this.enterHandTest();
		}
		if (!ht.on || !ht.motion) return;
		ht.t += delta;
		if (ht.mode === 'run') {
			ht.runT += delta;
			const q = C.sequenceAt(ht.runT);
			const dyn = !!C.presetSet(ht.profile)[q.id].dynamic;
			if (q.index !== ht.runIndex || dyn) {
				ht.runIndex = q.index;
				ht.preset = q.id;
				ht.motion.setTarget(C.presetPose(q.id, q.local, ht.profile), { lag: !dyn });
			}
		} else if (ht.mode === 'preset' && C.presetSet(ht.profile)[ht.preset].dynamic) ht.motion.setTarget(C.presetPose(ht.preset, ht.t - ht.presetT0, ht.profile), { lag: false });
		ht.motion.update(Math.min(delta, 0.05));
		if (ht.panel) { // the panel shows the preset the loop is on
			ht.panel.preset = ht.mode === 'manual' ? ht.panel.preset : ht.preset;
			ht.panel.run = ht.mode === 'run';
		}
		if (ht.mode !== 'manual' && ht.ui) { // the sliders show where the hand is
			const p = ht.motion.pose;
			for (const f of Object.keys(p.fingers)) Object.assign(ht.ui[f], { mcp: p.fingers[f].curl[0], pip: p.fingers[f].curl[1], dip: p.fingers[f].curl[2], spread: p.fingers[f].spread });
			Object.assign(ht.ui.wrist, { flex: p.wrist.flex, dev: p.wrist.dev, roll: p.roll });
		}
		if (ht.skeleton) ht.skeleton.updateMatrixWorld(true);
	}

	setHandTestSkeleton(on) {
		const ht = this.handtest;
		if (on && !ht.skeleton) {
			const slot = this.handtestSlot();
			if (!slot?.rig) return;
			ht.skeleton = new THREE.SkeletonHelper(slot.model3d);
			ht.skeleton.geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(ht.skeleton.geometry.attributes.position.count * 3), 3)); // WebGPU's line material asks every geometry for a normal
			ht.skeleton.renderOrder = 20;
			ht.skeleton.userData.labNoPick = ht.skeleton.userData.labNoCollide = true;
			this.scene.add(ht.skeleton);
		} else if (!on && ht.skeleton) {
			ht.skeleton.removeFromParent();
			ht.skeleton.dispose?.();
			ht.skeleton = null;
		}
	}

	setHandTestWire(on) {
		const ht = this.handtest;
		ht.wire = !!on;
		const slot = this.handtestSlot();
		if (!slot) return;
		for (const m of slot.mats) m.wireframe = ht.wire;
	}

	/** Swap the Flagellant's hand between the static mesh and the rigged one (the panel toggle `flRig`). */
	rebuildFlRig() {
		const wasTest = this.handtest.on;
		if (wasTest) this.exitHandTest();
		this.swapFlSlot();
		if (wasTest) this.enterHandTest();
	}

	/** Build the Flagellant's slot anew (static or rigged, as wantsRig says) and put it in the place of the old one. */
	swapFlSlot() {
		const i = C.SLOTS.findIndex((d) => d.id === 'FL');
		if (this.state !== 'idle') this.replay();
		const old = this.slots[i];
		this.scene.remove(old.root);
		this.proxyRoot.remove(old.proxy);
		old.proxy.geometry.dispose();
		(this.retiredSlabs ??= []).push(...(old.sliceCache ?? [])); // static slabs share their vertex buffers with the GLB (and the other slots built from it): freed with the scene, never on their own
		old.root.traverse((o) => o.skeleton?.dispose()); // the bone texture of a skinned hand
		for (const m of old.mats) m.dispose();
		const slot = this.buildSlot(old.def, i);
		slot.hidden = old.hidden;
		this.slots[i] = slot;
		this.proxyRoot.updateMatrixWorld(true);
	}

	/** Panel of the hand test: the on / off button, the rig toggle, presets, the auto loop, one slider per joint, the skeleton and wireframe views. */
	buildHandTestControls(folder) {
		const ht = this.handtest;
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		const fh = folder.addFolder('Thử tay (rig ngón)');
		const slot0 = this.slots[C.SLOTS.findIndex((d) => d.id === 'FL')];
		fh.add(s, 'flRig').name('Tay FL có rig (nếu có GLB rig)').onChange(() => (save(), this.rebuildFlRig()));
		fh.add(s, 'rigAlways').name('Dùng cả rig GIẢ ngoài chế độ thử').onChange(() => (save(), this.rebuildFlRig()));
		const status = { rig: '' };
		const rigText = () => {
			const sl = this.handtestSlot() ?? slot0;
			if (!this.gltfs.flrig) return 'chưa có choice-hand-fl-rig.glb';
			const syn = this.gltfs.flrig.asset?.extras?.synthetic_rig ? ' · rig GIẢ (thử)' : '';
			return sl?.rig ? `${sl.rigInfo.found}/15 bone ngón${syn}` : 'slot FL đang dùng mesh tĩnh';
		};
		status.rig = rigText();
		fh.add(status, 'rig').name('Rig').listen().disable();
		fh.add({ go: () => (ht.on ? this.exitHandTest() : this.enterHandTest()) }, 'go').name('Vào / thoát chế độ thử tay (Esc)');
		const sync = () => {
			status.rig = rigText();
			for (const c of ht.controllers) c.updateDisplay?.();
		};
		this.syncHandTestUi = sync;
		const state = { preset: 'offer', run: false, skeleton: false, wire: false };
		ht.panel = state;
		fh.add(state, 'preset', Object.fromEntries(Object.entries(C.HAND_PRESETS).map(([id, p]) => [p.label, id]))).name('Tư thế').listen().onChange((id) => {
			if (!ht.on) this.enterHandTest();
			state.run = false;
			this.setHandPreset(id);
		});
		fh.add(state, 'run').name('Chạy vòng thử (tự chuyển các tư thế)').listen().onChange((v) => {
			if (!ht.on) this.enterHandTest();
			this.setHandTestRun(v);
		});
		fh.add(state, 'skeleton').name('Hiện skeleton').onChange((v) => this.setHandTestSkeleton(v));
		fh.add(state, 'wire').name('Wireframe').onChange((v) => this.setHandTestWire(v));
		fh.add({ cam: () => this.placeHandTestCamera() }, 'cam').name('Đặt lại camera cận');
		// one slider per joint (degrees, inside the anatomical limits), moved by the presets and the loop, taken over by the hand
		ht.ui = {};
		const take = () => {
			if (!ht.on) this.enterHandTest();
			ht.mode = 'manual';
			state.run = false;
			ht.motion.setTarget(this.handTestPoseFromUi(), { lag: false });
		};
		const names = { thumb: 'Ngón cái', index: 'Trỏ', middle: 'Giữa', ring: 'Áp út', pinky: 'Út' };
		for (const f of Object.keys(names)) {
			const L = C.HAND_LIMITS[f];
			const g = fh.addFolder(names[f]);
			g.close();
			ht.ui[f] = { mcp: 0, pip: 0, dip: 0, spread: 0 };
			for (const [key, label, range] of [['mcp', f === 'thumb' ? 'Gốc (CMC/MCP)' : 'Gốc (MCP)', L.curl[0]], ['pip', f === 'thumb' ? 'Giữa (IP)' : 'Giữa (PIP)', L.curl[1]], ['dip', 'Đầu (DIP)', L.curl[2]], ['spread', 'Xoè', L.spread]]) {
				ht.controllers.push(g.add(ht.ui[f], key, range[0], range[1], 0.5).name(`${label} °`).listen().onChange(take));
			}
		}
		ht.ui.wrist = { flex: 0, dev: 0, roll: 0 };
		const gw = fh.addFolder('Cổ tay và cẳng tay');
		ht.controllers.push(gw.add(ht.ui.wrist, 'flex', C.WRIST_LIMITS.flex[0], C.WRIST_LIMITS.flex[1], 0.5).name('Gập (+ về lòng tay) °').listen().onChange(take));
		ht.controllers.push(gw.add(ht.ui.wrist, 'dev', C.WRIST_LIMITS.dev[0], C.WRIST_LIMITS.dev[1], 0.5).name('Nghiêng (+ về ngón cái) °').listen().onChange(take));
		ht.controllers.push(gw.add(ht.ui.wrist, 'roll', C.WRIST_LIMITS.roll[0], C.WRIST_LIMITS.roll[1], 0.5).name('Xoay cẳng tay °').listen().onChange(take));
		note(fh, '<b>Thử tay:</b> camera tự do (kéo = xoay, lăn = zoom); thanh trượt = từng khớp trong giới hạn giải phẫu, tính từ tư thế rest của rig (MCP −30…90°, PIP −50…110°, DIP −35…80°; ngón cái −25…55° / −25…75° / −20…65°: mesh cong sẵn cần góc âm để duỗi); các ngón vào cuộc lệch nhau (trỏ trước, út sau) và đốt ngoài theo đốt trong. <b>Chạy vòng thử</b> đi qua: thả lỏng · mở mời nắm · khum chén · nắm đấm · nắm hờ · chỉ · xoè · gợn sóng · cổ tay ±40° · xoay cẳng tay ±90°. Bảng thông số: <code>HAND_LIMITS / HAND_PRESETS / HAND_MOTION</code> ở <code>env/choiceHands.js</code>. URL: <code>?scene=choiceHands&amp;handtest=1</code>.');
	}

	// ---- showcase: what the chosen hand shows of its class ------------------------------------------------------------------------------

	/** (Re)measure the anchors of a slot from `root` (default: its own hand); a root with nothing to measure gives the model table's anchors (tests, a hand whose mesh is not measurable). */
	rebuildAnchors(slot, root = slot.armG) {
		slot.anchors = C.handAnchors(root, C.HAND_MODELS[slot.def.source]);
		return slot.anchors;
	}

	/** World position of a named anchor of a slot's hand (arm-frame anchors of the mesh, through the live scene graph: slide, turn, roll, mirror). */
	anchorWorld(slot, name, out = new THREE.Vector3(), live = true) {
		const socket = live ? slot.sockets?.[name] : null; // live = follow the rig's sockets (effects); false = the rest-pose mesh anchors (the camera must not breathe with the fingers)
		if (socket) {
			socket.updateWorldMatrix(true, false);
			return socket.getWorldPosition(out);
		}
		out.copy(slot.anchors[name] ?? slot.anchors.palm ?? slot.anchors.wrist);
		slot.armG.updateWorldMatrix(true, false);
		return slot.armG.localToWorld(out);
	}

	/** Start (or restart) the showcase of the chosen hand. */
	playShowcase() {
		const slot = this.slots[this.sel];
		if (!slot || this.state !== 'reach' || this.reach.to !== 1 || this.handtest.on) return false; // the hand-test mode has no showcase
		const def = C.SHOWCASE[slot.def.id];
		if (!def) return false;
		const sc = this.showcase;
		sc.active = true;
		sc.started = true;
		sc.t = 0;
		sc.def = def;
		sc.acc = def.fx.map(() => 0);
		this.classLight.color.set(def.light.colour);
		this.classLight.distance = def.light.dist * 2;
		this.syncUi();
		return true;
	}

	/** Jump to the end of the showcase (tests, the Enter key during it): the hand rests in its offer pose, the effects have the time to die out. */
	skipShowcase() {
		const sc = this.showcase;
		if (!sc.active) return false;
		sc.t = sc.def.dur;
		Object.assign(sc, { roll: 0, squeeze: 0, tremor: 0, grip: 0, shake: 1 }); // the keys end at rest: snap there, so a grab right after the skip does not start on a turning hand
		return true;
	}

	updateShowcase(delta) {
		const sc = this.showcase;
		const slot = this.slots[this.sel] ?? null;
		const def = sc.active ? sc.def : null;
		const t = sc.t;
		if (sc.active) {
			sc.t += delta;
			if (sc.t >= def.dur) {
				sc.active = false;
				sc.done = true;
				this.syncUi();
			}
		}
		const tt = Math.min(sc.t, def?.dur ?? 0);
		// the values the rest of the frame reads: they follow the keys while it plays and relax to rest (0) afterwards, so Esc / the end never snaps
		const rate = sc.active ? 40 : 6;
		sc.roll = C.damp(sc.roll, def ? C.keyAt(def.roll, tt) : 0, rate, delta);
		sc.squeeze = C.damp(sc.squeeze, def ? C.keyAt(def.squeeze, tt) : 0, rate, delta);
		sc.tremor = C.damp(sc.tremor, def ? C.keyAt(def.tremor, tt) : 0, rate, delta);
		sc.grip = C.damp(sc.grip, def ? C.keyAt(def.grip, tt) : 0, rate, delta);
		sc.shake = C.damp(sc.shake, def?.shake ? C.keyAt(def.shake, tt) : 1, rate, delta);
		const camTarget = def ? C.smoothstep(0, 0.55, tt) * (1 - C.smoothstep(def.dur - 0.7, def.dur, tt)) : 0;
		sc.cam = C.damp(sc.cam, camTarget, 8, delta);
		// the class light and the oil flame
		let light = 0;
		if (def && slot) {
			light = C.keyAt(def.light.intensity, tt);
			this.anchorWorld(slot, def.light.anchor, this._w);
			if (def.light.offset) this._w.x += C.keyAt(def.light.offset, tt) * slot.geo.scale * (slot.def.mirror ? -1 : 1);
			this.classLight.position.copy(this._w).add(this._q3.set(0, 0.09, 0.2));
		}
		// the offer: a class that reads too dark in the candle's glow (the Pallbearer's steel at the edge of the wall) keeps a soft warm light on its palm after the showcase
		const offered = slot && this.state === 'reach' && this.reach.to === 1 && this.reach.value >= C.GRAB_AT && !sc.active && (sc.done || !this.settings.showcase); // the showcase is over, or switched off
		const od = offered && this.settings.offerLight ? C.SHOWCASE[slot.def.id].offer : null;
		let target = light * C.CLASS_LIGHT_SCALE;
		if (od) {
			this.classLight.color.set(od.colour);
			this.classLight.distance = od.dist;
			this.anchorWorld(slot, od.anchor, this._w);
			this.classLight.position.copy(this._w).add(this._q3.set(0, 0.14, 0.25));
			target = od.intensity * C.CLASS_LIGHT_SCALE;
		}
		this.classLight.intensity = C.damp(this.classLight.intensity, target, sc.active ? 30 : 5, delta); // quick while the showcase drives it, a soft fade in / out otherwise (the grasp, Esc)
		let flame = 0;
		if (def?.flame && slot) {
			flame = C.keyAt(def.flame.strength, tt);
			this.anchorWorld(slot, def.flame.anchor, this._w);
			this.flames.move(this.flameIndex2, this._w.add(this._q3.set(0, def.flame.lift ?? 0.012, 0.01)));
		}
		this.flames.entries[this.flameIndex2].strength = flame;
		// the effects
		if (def && slot && sc.active) {
			def.fx.forEach((ev, i) => {
				if (tt < ev.from || tt > ev.to) return;
				sc.acc[i] += ev.rate * delta;
				const n = Math.floor(sc.acc[i]);
				if (n <= 0) return;
				sc.acc[i] -= n;
				for (let k = 0; k < n; k++) {
					this.anchorWorld(slot, ev.at, this._w);
					const r = (ev.spread ?? 0.025) * slot.geo.scale;
					this._w.add(this._q3.set((Math.random() - 0.5) * 2 * r, (Math.random() - 0.5) * r + (ev.lift ?? 0), (Math.random() - 0.5) * 2 * r));
					this.fxPools[ev.kind].emit(this._w);
				}
			});
		}
		const camQ = this.app.rig.camera.quaternion;
		for (const pool of Object.values(this.fxPools)) pool.update(delta, camQ, this.time);
		// the wrist of the chosen hand: the squeeze and the tremor of the class (a grasp takes the wrist over: updateGrasp)
		if (slot && (this.state === 'reach' || this.state === 'back')) { // 'back': the squeeze relaxes while the hand returns
			const wz = C.HAND_MODELS[slot.def.source].wrist;
			const shake = Math.sin(this.time * 47) * sc.tremor;
			slot.wristG.scale.setScalar(1 - sc.squeeze);
			slot.wristG.position.set(shake, shake * 0.6, wz);
		}
	}

	/**
	 * The camera of the showcase: an orbit round the hand (direction from the table: yaw keys, elevation), blended over the offer camera by sc.cam. The DISTANCE is fitted so the
	 * whole hand - a hand's length of fingers, the wrist and the first of the sleeve - lies in a sphere that fills FIT_FILL of the frame height, and the sphere is put in the upper
	 * part of the frame (the quote and the candle sit under it): nothing of the hand is ever cut by the edge, whatever the class, the turn or the window shape.
	 */
	showcaseCamera(slot, pose) {
		const sc = this.showcase;
		if (sc.cam < 0.001) return;
		const def = sc.def ?? C.SHOWCASE[slot.def.id];
		const tt = Math.min(sc.t, def.dur);
		const a = (this._sa ??= new THREE.Vector3());
		const b = (this._sb ??= new THREE.Vector3());
		this.anchorWorld(slot, 'tip', b, false);
		this.anchorWorld(slot, 'wrist', a, false);
		const len = a.distanceTo(b);
		const sc3 = slot.geo.scale;
		a.addScaledVector(this._q3.copy(b).sub(a).normalize(), -0.05 * sc3); // a little sleeve behind the wrist
		const centre = this._w.copy(a).add(b).multiplyScalar(0.5);
		const R = (len / 2 + 0.025 * sc3) + 0.075 * sc3; // half the hand's length (+ the sleeve) and its width
		const aspect = this.app.size.w / this.app.size.h;
		const tan = Math.tan((this.app.rig.persp.fov * Math.PI) / 360);
		const d = Math.max(R / (C.SHOWCASE_FIT.fill * tan), R / (0.8 * aspect * tan)) * (def.cam.dist / 0.9);
		const yaw = C.keyAt(def.cam.yaw, tt) * (slot.geo.entry.x < 0 ? 1 : -1) * (Math.PI / 180);
		const elev = def.cam.elev * (Math.PI / 180);
		const dir = this._q3.set(Math.sin(yaw) * Math.cos(elev), Math.sin(elev), Math.cos(yaw) * Math.cos(elev));
		// the centre of the sphere sits at SHOWCASE_FIT.centreY of the frame height from the top: the target is that much above it, along the view's up
		const focus = centre.addScaledVector(this._up.set(0, 1, 0).addScaledVector(dir, -Math.sin(elev)).normalize(), -(0.5 - C.SHOWCASE_FIT.centreY) * 2 * d * tan);
		const pos = dir.multiplyScalar(d).add(focus);
		pose.position.lerp(pos, sc.cam);
		pose.target.lerp(focus, sc.cam);
	}

	updateLight(delta, elapsed, activeHover, s) {
		const entry = this.lights[0];
		const focus = this.state === 'idle' ? activeHover : this.sel;
		const slot = focus >= 0 ? this.slots[focus] : null;
		const lift = this.state === 'idle' ? 0 : Math.min(1, Math.abs(this.reach.value));
		const target = this._v.set(0, 0, 0);
		if (slot) {
			// hover: the light leans toward the hand. Chosen: it moves out in front of the offered hand (palm side), lifted off the ledge
			const hx = slot.geo.tip.x;
			target.set(hx * 0.16, 0.03, 0.02).multiplyScalar(s.lean);
			if (lift > 0) {
				const lit = C.reachLight(slot.geo, this._w).sub(this.candleBase);
				target.lerp(lit, Math.min(1, lift) * Math.min(1, 0.4 + 0.6 * s.lean));
			}
		}
		this.lean.x = C.damp(this.lean.x, target.x, 5, delta);
		this.lean.y = C.damp(this.lean.y, target.y, 5, delta);
		this.lean.z = C.damp(this.lean.z, target.z, 5, delta);
		this.candleLight.position.copy(this.candleBase).add(this.lean);
		this.candleNear.position.copy(this.candleLight.position).add(this.nearOffset);
		const sh = this.showcase.shake; // the Flagellant's showcase: the candle shakes harder one beat
		const level0 = C.candleLevel(elapsed, entry.flicker);
		const level = 1 + (level0 - 1) * sh + (sh - 1) * 0.1 * Math.sin(elapsed * 41);
		const boost = 1 + 0.5 * lift + 0.12 * (slot ? 1 : 0);
		this.candleLight.intensity = entry.base * s.candle * level * boost;
		this.candleNear.intensity = this.lights[1].base * s.candle * level;
		this.glowMaterial.color.setRGB(1, 0.5, 0.15).multiplyScalar(s.glow * level);
		this.ledgeGlowMaterial.color.setRGB(1, 0.5, 0.15).multiplyScalar(s.glow * 0.45 * level);
		this.wallMaterial.color.setRGB(...WALL_BASE).multiplyScalar(s.wallTint);
		this.waxMaterial.color.setScalar(0.62 + 0.1 * level);
		// the flame leans a little toward the light and breathes
		this.flames.move(this.flameIndex, this._v.set(this.flameBase.x + Math.max(-0.02, Math.min(0.02, this.lean.x * 0.3)), this.flameBase.y, this.flameBase.z));
		this.flames.entries[this.flameIndex].strength = 0.95 + 0.12 * lift;
	}

	updateCamera(delta, s) {
		const { rig } = this.app;
		if (!rig) return;
		const target = this.sel >= 0 && (this.state === 'reach' || this.state === 'grasp' || this.state === 'done') ? 1 : 0;
		this.camP = C.damp(this.camP, this.state === 'back' ? Math.max(0, this.reach.value) : target, this.state === 'back' ? 30 : 2.4, delta);
		// the idle frame is the key art's long lens (fov 16); the offer and the showcase widen to 30 as the camera comes in (a close-up with a 16 deg lens would be a hand and nothing else)
		const aspect = this.app.size.w / this.app.size.h;
		const fov = C.lerp(C.fovForAspect(aspect), C.fovForAspect(aspect, 30), this.camP);
		if (Math.abs(rig.persp.fov - fov) > 0.01) rig.setFov(fov);
		const locked = s.lockCamera;
		if (rig.controls.enabled === locked) rig.controls.enabled = !locked;
		if (!locked) return;
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		let pose = this._cam;
		if (this.camSlot) C.cameraPose(this.camSlot.geo, this.camP, pose, C.offerView(aspect));
		else {
			pose.position.set(...C.FRAME.position);
			pose.target.set(...C.FRAME.target);
		}
		if (this.camSlot && this.showcase.cam > 0.001) this.showcaseCamera(this.camSlot, pose);
		rig.lookAt(pose.position, pose.target);
	}

	updateMotes(elapsed, s) {
		this.moteMesh.visible = s.dust;
		if (!s.dust) return;
		const camQ = this.app.rig.camera.quaternion;
		this.motes.forEach((m, i) => {
			m.y += m.s * 0.016;
			if (m.y > 1.5) m.y = 0.2;
			this._m4.compose(this._p3.set(m.x + Math.sin(elapsed * 0.3 + m.p) * 0.08, m.y, m.z + Math.cos(elapsed * 0.23 + m.p * 1.7) * 0.06), camQ, this._s3.set(m.size, m.size, 1));
			this.moteMesh.setMatrixAt(i, this._m4);
		});
		this.moteMesh.instanceMatrix.needsUpdate = true;
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.wall);
	}

	// ---- panels ----------------------------------------------------------------------------------------------------------------

	buildLightingControls(folder) {
		note(folder, 'Ngọn nến của Gennet là nguồn sáng duy nhất có bóng (spot 3200 K, nón 140°, suy giảm chậm = quầng ấm tối dần ra mép, chớp 1/f; thêm một point light ngắn tầm không bóng cho bệ đá và các ngón tay); thêm một quầng vàng additive sau ngọn lửa, một fill lạnh và ánh môi trường rất yếu để hố giữa các sọ không đen hẳn. Chỉnh từng đèn ở danh sách <b>Lights</b> bên dưới.');
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		const state = { hand: 'OS' };
		const fp = folder.addFolder('Chọn tay (trình diễn)');
		fp.add(state, 'hand', Object.fromEntries(C.SLOTS.map((d) => [`${d.id} · ${d.name}${d.standIn ? ' (stand-in)' : ''}`, d.id]))).name('Tay');
		const idx = () => C.SLOTS.findIndex((d) => d.id === state.hand);
		fp.add({ hover: () => this.state === 'idle' && this.hover(idx()) }, 'hover').name('Rê chuột lên tay này');
		fp.add({ pick: () => this.select(idx()) }, 'pick').name('Chọn (giơ ra)');
		fp.add({ grab: () => this.grab() }, 'grab').name('Nắm tay (vỡ vụn)');
		fp.add({ show: () => this.playShowcase() }, 'show').name('Xem lại showcase của tay đang chọn');
		fp.add({ back: () => this.back() }, 'back').name('Quay lại (Esc)');
		fp.add({ replay: () => this.replay() }, 'replay').name('Chơi lại / đặt lại về tường');
		this.buildHandTestControls(folder);
		const fa = folder.addFolder('Chuyển động');
		fa.add(s, 'duration', 0.8, 4, 0.05).name('Thời lượng vươn (s)').onChange(save);
		fa.add(s, 'reach', 0.1, 0.36, 0.005).name('Biên độ vươn dọc cẳng tay (m)').onChange(save);
		fa.add(s, 'handScale', 0.8, 2.0, 0.01).name('Cỡ tay × (1 = đúng cỡ thật 0,45 m)').onChange(() => (save(), this.applyHandScale()));
		const fl = folder.addFolder('Ánh sáng nến');
		fl.add(s, 'candle', 0.2, 3, 0.01).name('Cường độ nến ×').onChange(save);
		fl.add(s, 'glow', 0, 1.2, 0.01).name('Quầng nến trên tường').onChange(save);
		fl.add(s, 'wallTint', 0.3, 1.5, 0.01).name('Độ sáng albedo tường ×').onChange(save);
		fl.add(s, 'handOuter', 0, 0.8, 0.01).name('Tay ngoài sáng thêm').onChange(save);
		fl.add(s, 'handLight', 0.3, 1.6, 0.01).name('Độ sáng bàn tay ×').onChange(save);
		fl.add(s, 'lean', 0, 2.5, 0.01).name('Độ nghiêng về phía tay ×').onChange(save);
		fl.add(s, 'dust').name('Bụi lơ lửng + bụi vỡ').onChange(save);
		const fv = folder.addFolder('Hiển thị');
		fv.add(s, 'overlay', 0, 1, 0.01).name('Phủ key art lên khung (hiệu chỉnh)').onChange(save);
		fv.add(s, 'offerLight').name('Đèn lòng tay ở offer (PB, BR)').onChange(save);
		fv.add(s, 'showcase').name('Showcase khi chọn tay (3–4 s)').onChange(save);
		fv.add(s, 'showStandIns').name('Hiện tay stand-in (PB · EX · PS)').onChange(() => (save(), this.applyStandIns()));
		fv.add(s, 'lockCamera').name('Khoá camera (tắt = orbit tự do)').onChange(save);
		fv.add(s, 'quote').name('Câu thoại khi rê chuột').onChange(save);
		note(folder, '<b>Điều khiển:</b> rê chuột lên một tay (hoặc ← → / phím 1–6) = tay nhích ra, nến nghiêng theo, hiện câu thoại. <b>Click / Enter</b> = tay giơ ra khỏi tường; <b>Nắm tay</b> (nút hoặc Enter) = tay run rồi vỡ vụn thành bụi và màn tối lại; <b>Esc / chuột phải</b> = rút về. Chơi lại về tường. <i>Stand-in:</i> PB (thép, từ tay OS), EX (da nâu, từ FL lật), PS (da + chỉ đỏ, từ FL lật) chưa có GLB riêng (<code>HAND_MODELS</code> + <code>SLOTS</code> ở <code>env/choiceHands.js</code>: thả GLB thật vào và đặt <code>standIn: false</code>). Ngón tay là mesh tĩnh nên mọi chuyển động là xoay / trượt cẳng tay và cổ tay.');
	}

	// ---- leaving ---------------------------------------------------------------------------------------------------------------

	activate() {
		const { app } = this;
		app.world.vfxScene.add(this.vfx);
		this._fov = app.rig.persp.fov;
		app.rig.setFov(C.fovForAspect(app.size.w / app.size.h));
		const q = new URLSearchParams(location.search).get('overlay'); // ?overlay=1 opens the key-art overlay at 0.5, ?overlay=0.7 at 0.7
		if (q !== null) this.settings.overlay = Number(q) > 0 ? (Number(q) >= 1 ? 0.5 : Number(q)) : 0;
		this.buildUi();
		this.bindEvents();
		this.cap = { shown: -1, alpha: 0 };
		if (new URLSearchParams(location.search).get('handtest')) this.pendingHandTest = true; // ?scene=choiceHands&handtest=1: the hand-test mode as soon as the scene is ready
	}

	deactivate() {
		const { app } = this;
		app.world.vfxScene.remove(this.vfx);
		for (const off of this.listeners.splice(0)) off();
		this.destroyUi();
		app.backend.canvas.style.cursor = '';
		if (app.rig) {
			app.rig.controls.enabled = true;
			if (this._fov) app.rig.setFov(this._fov);
		}
		this.hoverIndex = this.keyHover = -1;
		if (this.handtest.on) this.exitHandTest();
		if (this.state !== 'idle') this.replay();
	}

	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		const free = (root) =>
			root.traverse((o) => {
				o.skeleton?.dispose();
				o.geometry?.dispose();
				if (o.material) {
					for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
						for (const v of Object.values(m)) if (v?.isTexture) v.dispose(); // the textures the hand GLBs brought (a material's dispose() leaves them)
						m.dispose();
					}
				}
			});
		free(this.scene);
		for (const sl of this.retiredSlabs ?? []) sl.mesh.geometry.dispose();
		for (const slot of this.slots) for (const sl of slot.sliceCache ?? slot.slices ?? []) sl.mesh.geometry.dispose(); // cached slabs are off the scene graph: free their index buffers here
		for (const g of Object.values(this.gltfs || {})) free(g.scene);
		for (const p of this.proxyRoot?.children ?? []) {
			p.geometry.dispose();
			p.material.dispose();
		}
		for (const t of [...(this.textures || []), this.sootMap, this.stoneMap, this.stoneNormal, this.spriteAlpha, this.spriteAdd, this.glowTexture, ...(this._mono?.values() ?? [])]) t?.dispose();
		this.dustMesh?.dispose();
		for (const pool of Object.values(this.fxPools ?? {})) pool.dispose();
		this.moteMesh?.dispose();
		this.flames?.dispose();
		this._env?.dispose?.();
	}
}

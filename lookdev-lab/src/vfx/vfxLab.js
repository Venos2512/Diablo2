// VFX lab controller: particle system, pooled lights, training dummies, spell casting (castbar keys
// 1–9, right click), play mode (click to move the model, camera follows), floating combat text, the
// WebGPU compute particle field and the overdraw view. Backend-agnostic: materials come from
// backend.vfx / backend.effects, so the same spells run in GLSL and TSL.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { ParticleSystem } from './particles.js';
import { LightPool } from './lights.js';
import { Dummy, DAMAGE_COLORS } from './dummies.js';
import { SPELLS, SPELL_ORDER } from './spells.js';
import { FlameField } from '../env/flames.js';
import { toast } from '../ui/toast.js';

registerDefaults('vfxLab', {
	armed: false,
	selected: 'firebolt',
	dummies: 3,
	overdraw: false,
	compute: false,
	computeCount: 50000,
	timeScale: 1,
	play: false,
	moveSpeed: 3.2,
});

const UP = new THREE.Vector3(0, 1, 0);

export class VfxLab {
	constructor(app) {
		this.app = app;
		this.settings = app.settings.adopt('vfxLab');
		this.settings.play = false;
		this.armed = false;
		this.particles = null;
		this.lights = null;
		this.stage = new THREE.Group();
		this.stage.name = 'VFX lab';
		this.dummies = [];
		this.actors = new Set();
		this.persistent = {};
		this.effectPool = {};
		this.time = 0;
		this.pointer = null;
		this.cursor = { point: new THREE.Vector3(), ground: new THREE.Vector3(), dummy: null, valid: false };
		this.groundCache = new Map();
		this.move = null;
		this.compute = null;
		this.listeners = new Set();
		this.texts = [];
		this.casts = 0;
		this.casting = 0;
		this.playing = false;

		const canvas = app.backend.canvas;
		let rightDown = null;
		canvas.addEventListener('pointermove', (e) => {
			this.pointer = { x: e.clientX, y: e.clientY };
			this.cursorDirty = true;
		});
		canvas.addEventListener('pointerleave', () => (this.pointer = null));
		canvas.addEventListener('pointerdown', (e) => {
			if (e.button === 2) rightDown = { x: e.clientX, y: e.clientY };
		});
		// Right click casts the selected spell (a right-drag still pans the orbit camera).
		canvas.addEventListener('contextmenu', (e) => {
			if (!this.armed) return;
			e.preventDefault();
			const dragged = rightDown && Math.hypot(e.clientX - rightDown.x, e.clientY - rightDown.y) > 5;
			rightDown = null;
			if (dragged) return;
			this.pointer = { x: e.clientX, y: e.clientY };
			this.updateCursor();
			this.cast(this.settings.selected);
		});
		app.on('update', (dt, elapsed) => this.update(dt, elapsed));
		app.on('key', (k) => this.onKey(k));
		app.on('click', (e) => this.onClick(e));
		app.on('scene', () => this.onScene());
		this.buildCastbar();
		this.buildTextLayer();
	}

	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	notify() {
		for (const fn of this.listeners) fn();
	}

	save() {
		this.app.settings.changed('vfxLab');
	}

	// ---------------------------------------------------------------------------------------------
	// Arm / disarm (pooled lights change the light count once, so materials recompile once here)

	arm(on = true) {
		if (on === this.armed) return;
		this.armed = on;
		this.settings.armed = on;
		this.save();
		const app = this.app;
		if (on) {
			this.particles ??= new ParticleSystem(app);
			this.lights ??= new LightPool(4);
			this.stage.add(this.lights.group);
			this.lightningEmitter ??= this.createLightningEmitter();
			this.onScene();
			this.spawnDummies();
			if (this.settings.compute) this.setCompute(true);
			app.backend.vfx.setOverdraw(this.settings.overdraw);
		} else {
			this.setPlay(false);
			this.clearActors();
			this.particles?.clear();
			this.lightningEmitter = null;
			this.lights?.reset();
			this.stage.removeFromParent();
			for (const d of this.dummies) d.dispose();
			this.dummies = [];
			this.setCompute(false, { persist: false });
			app.backend.vfx.setOverdraw(false);
			app.particleCount = 0;
		}
		this.castbar.hidden = !on;
		this.notify();
	}

	onScene() {
		this.groundCache.clear();
		if (!this.armed) return;
		this.app.current.scene.add(this.stage);
		this.placeDummies();
	}

	// ---------------------------------------------------------------------------------------------
	// Ground, cursor, targets

	/** Ground height under (x, z): ray cast down from a little above `reference` (so ceilings are skipped). */
	groundAt(x, z, reference = 0) {
		const fallback = Number.isFinite(reference) ? reference : this.anchorWorld().y;
		const key = `${Math.round(x * 4)},${Math.round(z * 4)},${Math.round(fallback)}`;
		if (this.groundCache.has(key)) {
			const y = this.groundCache.get(key);
			return y === null ? fallback : y;
		}
		const scene = this.app.world.scene;
		const ray = new THREE.Raycaster(new THREE.Vector3(x, fallback + 2.8, z), new THREE.Vector3(0, -1, 0), 0, 30);
		const subjectRoot = this.app.subject.root;
		const excluded = (o) => {
			for (let p = o; p; p = p.parent) if (p === subjectRoot || p === this.stage || p.userData.dummy || p.userData.labProbe) return true;
			return false;
		};
		const hit = ray.intersectObjects(scene.children, true).find((h) => h.object.isMesh && h.object.visible && !h.object.isInstancedMesh && !h.object.userData.labNoPick && !excluded(h.object));
		const y = hit ? hit.point.y : null;
		if (this.groundCache.size > 4000) this.groundCache.clear();
		this.groundCache.set(key, y);
		return y === null ? fallback : y;
	}

	anchorWorld() {
		return this.app.current.anchor.getWorldPosition(new THREE.Vector3());
	}

	casterGround() {
		const p = this.app.subject.root.getWorldPosition(new THREE.Vector3());
		return p;
	}

	casterHand() {
		const p = this.casterGround();
		const box = this.app.subject.model ? new THREE.Box3().setFromObject(this.app.subject.model) : null;
		const h = box && !box.isEmpty() ? THREE.MathUtils.clamp((box.max.y - box.min.y) * 0.62, 0.6, 1.6) : 1.1;
		const forward = this.cursor.valid ? this.cursor.point.clone().sub(p).setY(0) : new THREE.Vector3(0, 0, 1);
		if (forward.lengthSq() > 1e-6) forward.normalize();
		return p.add(new THREE.Vector3(0, h, 0)).addScaledVector(forward, 0.35);
	}

	updateCursor() {
		if (!this.pointer) return;
		const app = this.app;
		const rect = app.backend.canvas.getBoundingClientRect();
		const ndc = new THREE.Vector2(((this.pointer.x - rect.left) / rect.width) * 2 - 1, -((this.pointer.y - rect.top) / rect.height) * 2 + 1);
		const ray = new THREE.Raycaster();
		ray.setFromCamera(ndc, app.world.camera);
		const dummyHit = ray.intersectObjects(this.dummies.filter((d) => d.alive).map((d) => d.root), true)[0];
		const subjectRoot = app.subject.root;
		const sceneHit = ray.intersectObjects(app.world.scene.children, true).find((h) => {
			if (!h.object.isMesh || !h.object.visible || h.object.userData.labNoPick || h.object.isInstancedMesh) return false;
			for (let p = h.object; p; p = p.parent) if (p === subjectRoot || p === this.stage) return false;
			return true;
		});
		const c = this.cursor;
		c.dummy = dummyHit && (!sceneHit || dummyHit.distance <= sceneHit.distance + 0.01) ? dummyHit.object.userData.dummy : null;
		if (c.dummy) {
			c.dummy.center(c.point);
			c.ground.copy(c.dummy.root.getWorldPosition(new THREE.Vector3()));
			c.valid = true;
		} else if (sceneHit) {
			c.point.copy(sceneHit.point);
			c.ground.copy(sceneHit.point);
			c.valid = true;
		} else {
			// Fall back to the ground plane through the subject.
			const plane = new THREE.Plane(UP, -this.casterGround().y);
			c.valid = !!ray.ray.intersectPlane(plane, c.point);
			c.ground.copy(c.point);
		}
	}

	nearestDummy(from = this.casterGround()) {
		let best = null;
		let bestD = Infinity;
		for (const d of this.dummies) {
			if (!d.alive) continue;
			const dist = d.root.getWorldPosition(new THREE.Vector3()).distanceTo(from);
			if (dist < bestD) {
				bestD = dist;
				best = d;
			}
		}
		return best;
	}

	// ---------------------------------------------------------------------------------------------
	// Dummies

	spawnDummies() {
		const n = this.settings.dummies;
		while (this.dummies.length > n) this.dummies.pop().dispose();
		while (this.dummies.length < n) {
			const d = new Dummy(this.app, this.dummies.length);
			d.onDamage = (dummy, amount, kind) => this.combatText(dummy.center().add(new THREE.Vector3(0, 0.75, 0)), amount, kind);
			this.dummies.push(d);
		}
		for (const d of this.dummies) this.stage.add(d.root);
		this.placeDummies();
	}

	placeDummies() {
		if (!this.dummies.length || !this.app.current) return;
		const entry = this.app.current;
		const anchor = this.anchorWorld();
		const home = entry.home?.position || anchor.clone().add(new THREE.Vector3(3, 2, 4));
		const away = anchor.clone().sub(home).setY(0);
		if (away.lengthSq() < 1e-6) away.set(0, 0, -1);
		away.normalize();
		const side = new THREE.Vector3().crossVectors(UP, away).normalize();
		const n = this.dummies.length;
		this.dummies.forEach((d, i) => {
			const offset = (i - (n - 1) / 2) * 2.2;
			const p = anchor.clone().addScaledVector(away, 4.2 + Math.abs(offset) * 0.25).addScaledVector(side, offset);
			p.y = this.groundAt(p.x, p.z, anchor.y);
			d.root.position.copy(p);
			d.root.lookAt(anchor.x, p.y, anchor.z);
		});
	}

	// ---------------------------------------------------------------------------------------------
	// Casting

	context() {
		const app = this.app;
		const lab = this;
		const c = this.cursor;
		const ground = c.ground.clone();
		return {
			from: this.casterHand(),
			to: c.dummy ? c.point.clone() : c.point.clone(),
			ground,
			casterGround: this.casterGround(),
			target: c.dummy,
			dummies: this.dummies,
			camera: app.world.camera,
			vfxScene: app.world.vfxScene,
			stage: this.stage,
			emitter: (config, opts) => lab.particles.emitter(config, opts),
			flash: (p, color, intensity, opts) => lab.lights.flash(p, color, intensity, opts),
			hold: (fn, color, intensity, opts) => lab.lights.hold(fn, color, intensity, opts),
			actor: (a) => {
				lab.actors.add(a);
				lab.lastActor = a;
				return a;
			},
			hit: (dummy, damage, kind, opts = {}) => dummy.hit(damage, kind, { time: lab.time, ...opts }),
			groundAt: (x, z, fallback) => lab.groundAt(x, z, fallback),
			lightning: (a, b, opts) => lab.lightning(a, b, opts),
			nearestDummy: () => lab.nearestDummy(),
			effect: (name, overrides) => lab.effect(name, overrides),
			prepare: (object) => app.backend.prepareObject(object),
			flame: (position, flames) => lab.flame(position, flames),
		};
	}

	cast(name) {
		const spell = SPELLS[name];
		if (!spell || !this.armed) return;
		if (!this.cursor.valid) this.updateCursor();
		if (!this.cursor.valid) {
			toast('Point at the ground or a dummy to cast', 'info', 1500);
			return;
		}
		// Persistent spells toggle / move: recasting closes the previous one.
		const existing = this.persistent[name];
		if (existing && this.actors.has(existing)) {
			existing.close?.();
			delete this.persistent[name];
			if (name === 'campfire') {
				this.highlight(name);
				return;
			}
		}
		this.lastActor = null;
		this.faceCursor();
		spell.cast(this.context());
		if (spell.persistent && this.lastActor) this.persistent[name] = this.lastActor;
		this.casts++;
		this.highlight(name);
		this.playCastAnimation();
	}

	select(name) {
		if (!SPELLS[name]) return;
		this.settings.selected = name;
		this.save();
		this.highlight(name);
		this.notify();
	}

	/** Cached effect instances for spells (2 per effect so a closing copy and a new one can overlap). */
	effect(name, overrides = {}) {
		const pool = (this.effectPool[name] ??= { items: [], next: 0 });
		if (pool.items.length < 2) pool.items.push(this.app.backend.effects.create(name));
		const inst = pool.items[pool.next++ % pool.items.length];
		for (const [key, value] of Object.entries(overrides)) {
			const u = inst.uniforms[key];
			if (u?.value?.isColor) u.value.set(value);
			else if (u) u.value = value;
		}
		return inst;
	}

	flame(position, flames) {
		const field = new FlameField(this.app, flames.length);
		for (const [x, y, z, w, h] of flames) field.add(new THREE.Vector3(position.x + x, position.y + y, position.z + z), { width: w * 0.9, height: h, strength: 1 });
		this.app.world.vfxScene.add(field.mesh);
		this.app.backend.prepareObject(field.mesh);
		const actor = {
			update: (dt) => {
				field.update(this.time);
				return !actor.disposed;
			},
			disposed: false,
		};
		this.actors.add(actor);
		return {
			dispose: () => {
				actor.disposed = true;
				field.mesh.removeFromParent();
				field.dispose();
			},
		};
	}

	/** Jagged arc from a to b drawn as stretched spark particles (midpoint displacement). */
	lightning(a, b, { segments = 8, jitter = 0.25, life = 0.08 } = {}) {
		const e = this.lightningEmitter;
		if (!e) return;
		const points = [a.clone()];
		const dir = b.clone().sub(a);
		const len = dir.length();
		const n1 = new THREE.Vector3().crossVectors(dir, UP);
		if (n1.lengthSq() < 1e-6) n1.set(1, 0, 0);
		n1.normalize();
		const n2 = new THREE.Vector3().crossVectors(dir, n1).normalize();
		for (let i = 1; i < segments; i++) {
			const t = i / segments;
			const amp = jitter * len * Math.sin(Math.PI * t);
			points.push(a.clone().addScaledVector(dir, t).addScaledVector(n1, (Math.random() - 0.5) * amp).addScaledVector(n2, (Math.random() - 0.5) * amp));
		}
		points.push(b.clone());
		for (let i = 0; i < points.length - 1; i++) {
			const p0 = points[i];
			const p1 = points[i + 1];
			e.add({ position: p0.clone().lerp(p1, 0.5), velocity: p1.clone().sub(p0), life, size: 1 });
		}
	}

	createLightningEmitter() {
		return this.particles.emitter({ name: 'Lightning arcs', shape: 'spark', align: 'velocity', max: 400, rate: 0, frozen: true, size: [0.035, 0.035], sizeRandom: 0, stretch: 1, spin: [0, 0], colors: [[0, '#ffffff', 7], [1, '#7f9dff', 3]], fadeIn: 0, fadeOut: 0.6, softness: 0.05 }, { autoRemove: false });
	}

	/** Remove every spell effect (persistent ones included) and all particles. */
	resetEffects() {
		this.clearActors();
		this.particles?.clear();
		this.lightningEmitter = this.armed ? this.createLightningEmitter() : null;
	}

	clearActors() {
		// Close persistent effects and run everything to completion so nothing is left in the scene.
		for (const a of this.actors) a.close?.();
		for (const a of [...this.actors]) {
			for (let i = 0; i < 40; i++) {
				let keep = false;
				try {
					keep = a.update(0.5);
				} catch (error) {
					console.error(error);
				}
				if (!keep) break;
			}
		}
		this.actors.clear();
		this.persistent = {};
	}

	// ---------------------------------------------------------------------------------------------
	// Play mode: click to move the model, camera follows, clips switch between idle / run / cast.

	setPlay(on) {
		const app = this.app;
		on = !!on && this.armed;
		if (this.playing === on) return;
		this.playing = on;
		this.settings.play = on;
		this.save();
		const rig = app.rig;
		if (on) {
			this.prevCamera = rig.state();
			rig.follow = app.subject.root;
			rig.setMode('play');
			this.clipState = null;
			this.setClip('idle');
			toast('Play mode: left click to move, right click or 1–9 to cast at the cursor', 'info', 4000);
		} else {
			this.move = null;
			rig.follow = null;
			if (this.prevCamera) {
				rig.setMode(this.prevCamera.mode || 'orbit');
				rig.restore(this.prevCamera);
			}
			app.subject.root.position.set(0, 0, 0);
			app.subject.root.rotation.set(0, 0, 0);
			app.shaderLab?.layout();
		}
		this.notify();
	}

	/** First clip matching the earliest pattern in the list (patterns are in priority order). */
	findClip(patterns) {
		for (const pattern of patterns) {
			const index = this.app.subject.clips.findIndex((c) => pattern.test(c.name));
			if (index >= 0) return index;
		}
		return -1;
	}

	setClip(state) {
		const subject = this.app.subject;
		if (!subject.clips.length || this.clipState === state) return;
		const patterns = {
			idle: [/idle/i, /survey/i, /stand/i],
			run: [/run/i, /walk/i, /jog/i],
			cast: [/punch/i, /attack/i, /cast/i, /wave/i, /yes/i, /jump/i],
		};
		let index = this.findClip(patterns[state]);
		if (index < 0 && state !== 'idle') index = this.findClip(patterns.idle);
		if (index < 0) return;
		this.clipState = state;
		subject.play(index);
	}

	playCastAnimation() {
		if (!this.playing) return;
		this.casting = 0.45;
		this.clipState = null;
		this.setClip('cast');
	}

	faceCursor() {
		if (!this.playing || !this.cursor.valid) return;
		const root = this.app.subject.root;
		const p = root.getWorldPosition(new THREE.Vector3());
		const d = this.cursor.point.clone().sub(p);
		if (d.x * d.x + d.z * d.z > 1e-4) root.rotation.y = Math.atan2(d.x, d.z);
	}

	onClick(event) {
		if (!this.armed) return;
		this.pointer = { x: event.clientX, y: event.clientY };
		this.updateCursor();
		if (!this.playing) return;
		this.app.consumedClick = true;
		if (this.cursor.dummy) {
			this.cast(this.settings.selected);
			return;
		}
		if (this.cursor.valid) this.move = this.cursor.ground.clone();
	}

	onKey(k) {
		if (!this.armed) return;
		const index = '123456789'.indexOf(k);
		if (index < 0) return;
		const name = SPELL_ORDER[index];
		this.select(name);
		this.updateCursor();
		this.cast(name);
	}

	updatePlay(dt) {
		const root = this.app.subject.root;
		const anchor = this.anchorWorld();
		if (this.casting > 0) {
			this.casting -= dt;
			if (this.casting <= 0) this.clipState = null;
		}
		if (this.move) {
			const p = root.getWorldPosition(new THREE.Vector3());
			const d = this.move.clone().sub(p).setY(0);
			const dist = d.length();
			const step = this.settings.moveSpeed * dt;
			if (dist <= step + 0.02) {
				this.move = null;
			} else {
				d.normalize();
				p.addScaledVector(d, step);
				p.y = this.groundAt(p.x, p.z, p.y);
				root.position.copy(p.sub(anchor));
				if (this.casting <= 0) root.rotation.y = Math.atan2(d.x, d.z);
			}
		}
		if (this.casting <= 0) this.setClip(this.move ? 'run' : 'idle');
	}

	// ---------------------------------------------------------------------------------------------
	// Compute field (WebGPU only)

	setCompute(on, { persist = true } = {}) {
		const app = this.app;
		if (on && !app.backend.vfx.createComputeField) {
			toast('Compute particles need the WebGPU renderer (WebGL2 has no compute shaders).', 'error', 5000);
			on = false;
		}
		if (persist) {
			this.settings.compute = on;
			this.save();
		}
		if (this.compute) {
			this.compute.dispose();
			this.compute = null;
		}
		if (on && this.armed) {
			this.compute = app.backend.vfx.createComputeField({ count: this.settings.computeCount });
			app.world.vfxScene.add(this.compute.mesh);
			app.backend.prepareObject(this.compute.mesh);
		}
		this.notify();
	}

	// ---------------------------------------------------------------------------------------------
	// UI: castbar + floating combat text

	buildCastbar() {
		const bar = (this.castbar = this.app.dom.castbar);
		bar.innerHTML = '';
		this.castButtons = {};
		for (const name of SPELL_ORDER) {
			const spell = SPELLS[name];
			const b = document.createElement('button');
			b.className = 'cast';
			b.title = spell.summary;
			b.innerHTML = `<kbd>${spell.key}</kbd>${spell.label}`;
			b.addEventListener('click', () => {
				this.select(name);
				this.cast(name);
			});
			bar.appendChild(b);
			this.castButtons[name] = b;
		}
		this.highlight(this.settings.selected);
	}

	highlight(name) {
		for (const [n, b] of Object.entries(this.castButtons || {})) b.classList.toggle('active', n === (this.settings.selected || name));
		const b = this.castButtons?.[name];
		if (!b) return;
		b.classList.remove('pulse');
		void b.offsetWidth;
		b.classList.add('pulse');
	}

	buildTextLayer() {
		const layer = (this.textLayer = document.createElement('div'));
		layer.className = 'combat-text-layer';
		this.app.dom.viewport.appendChild(layer);
	}

	combatText(position, amount, kind) {
		const el = document.createElement('div');
		el.className = 'combat-text';
		el.textContent = Math.round(amount);
		el.style.color = DAMAGE_COLORS[kind] || '#fff';
		this.textLayer.appendChild(el);
		this.texts.push({ el, position: position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, 0)), age: 0 });
	}

	updateTexts(dt) {
		const camera = this.app.world.camera;
		const rect = this.app.dom.viewport.getBoundingClientRect();
		const v = new THREE.Vector3();
		this.texts = this.texts.filter((t) => {
			t.age += dt;
			if (t.age > 1.1) {
				t.el.remove();
				return false;
			}
			v.copy(t.position).add(new THREE.Vector3(0, t.age * 0.7, 0)).project(camera);
			const visible = v.z < 1;
			t.el.style.display = visible ? '' : 'none';
			t.el.style.transform = `translate(${((v.x + 1) / 2) * rect.width}px, ${((1 - v.y) / 2) * rect.height}px) translate(-50%, -50%) scale(${1 + Math.max(0, 0.25 - t.age) * 2})`;
			t.el.style.opacity = String(Math.min(1, (1.1 - t.age) * 3));
			return true;
		});
	}

	// ---------------------------------------------------------------------------------------------

	update(rawDt, elapsed) {
		if (!this.armed) return;
		const dt = rawDt * this.settings.timeScale;
		this.time += dt;
		// Re-raycast the cursor when the pointer moved, otherwise a few times per second (camera motion).
		this.cursorAge = (this.cursorAge || 0) + rawDt;
		if (this.pointer && (this.cursorDirty || this.cursorAge > 0.12)) {
			this.cursorDirty = false;
			this.cursorAge = 0;
			this.updateCursor();
		}
		if (this.playing) this.updatePlay(dt);
		for (const a of [...this.actors]) {
			let keep = false;
			try {
				keep = a.update(dt);
			} catch (error) {
				console.error(error);
			}
			if (!keep) this.actors.delete(a);
		}
		for (const d of this.dummies) d.update(dt, this.time);
		this.particles.update(dt);
		this.lights.update(dt);
		if (this.compute) {
			this.compute.uniforms.center.value.copy(this.casterGround());
			this.compute.update(dt);
		}
		this.updateTexts(rawDt);
		this.app.particleCount = this.particles.count + (this.compute ? this.compute.count : 0);
	}
}

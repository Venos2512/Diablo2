// VFX lab controller: particle system, pooled lights, training dummies, spell casting (castbar keys
// 1–9, right click), floating combat text, the WebGPU compute particle field and the overdraw view.
// Play mode (walking the model around) is the character controller (src/character/controller.js). Backend-agnostic: materials come from
// backend.vfx / backend.effects, so the same spells run in GLSL and TSL.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { ParticleSystem } from './particles.js';
import { LightPool } from './lights.js';
import { Dummy, DAMAGE_COLORS } from './dummies.js';
import { SPELLS, SPELL_ORDER } from './spells.js';
import { FlameField } from '../env/flames.js';
import { SkillSystem } from '../skills/runtime.js';
import { SKILLS, SKILL_ORDER, SKILL_KEYS } from '../skills/skills.js';
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
	castMode: 'spells',
	skill: 'fireball',
	skillLevel: 1,
	quarksSoft: true,
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
		this.compute = null;
		this.listeners = new Set();
		this.texts = [];
		this.casts = 0;
		this.skills = null;

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
			this.castSelected();
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
			this.clearActors();
			this.particles?.clear();
			this.skills?.clear();
			this.resetShake();
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

	/** Right click / Q: the selected lab spell, or the selected skill when the castbar shows skills. */
	castSelected() {
		if (this.skillMode) this.castSkill(this.settings.skill);
		else this.cast(this.settings.selected);
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
		this.skills?.clear();
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
	// Play mode lives in the character controller; these keep the VFX tab's toggle and casting in sync.

	get playing() {
		return !!this.app.character?.active;
	}

	setPlay(on) {
		if (on && !this.armed) this.arm(true);
		this.app.character?.setActive(on);
		this.settings.play = this.playing;
		this.save();
		this.notify();
	}

	playCastAnimation() {
		this.app.character?.onCast();
	}

	faceCursor() {
		if (this.playing && this.cursor.valid) this.app.character.faceTowards(this.cursor.point);
	}

	onClick(event) {
		if (!this.armed) return;
		this.pointer = { x: event.clientX, y: event.clientY };
		this.updateCursor();
	}

	onKey(k) {
		if (!this.armed) return;
		if (this.skillMode) {
			const id = SKILL_ORDER[SKILL_KEYS.indexOf(k)];
			if (!id) return;
			this.selectSkill(id);
			this.updateCursor();
			this.castSkill(id);
			return;
		}
		const index = '123456789'.indexOf(k);
		if (index < 0) return;
		const name = SPELL_ORDER[index];
		this.select(name);
		this.updateCursor();
		this.cast(name);
	}

	/** Melee / ranged impact from the character controller: the "Hit" spell aimed at `dummy`. */
	strike(dummy, { from, damage = 10, kind = 'physical' } = {}) {
		if (!this.armed || !dummy?.alive) return;
		const ctx = this.context();
		ctx.from = from || ctx.from;
		ctx.target = dummy;
		ctx.to = dummy.center();
		ctx.hit = (d, _damage, k, opts = {}) => d.hit(damage, kind || k, { time: this.time, ...opts });
		SPELLS.hit.cast(ctx);
	}

	// ---------------------------------------------------------------------------------------------
	// Skills (src/skills, three.quarks — WebGL2 only: quarks builds GLSL ShaderMaterials)

	get skillsSupported() {
		return this.app.backend.language === 'GLSL';
	}

	get skillMode() {
		return this.settings.castMode === 'skills' && this.skillsSupported;
	}

	/** The skill runtime with the lab as its host: dummies are the targets, the model is the caster. */
	ensureSkills() {
		if (this.skills || !this.skillsSupported) return this.skills;
		const app = this.app;
		const lab = this;
		const targetOf = (d) =>
			(d.skillTarget ??= {
				get alive() {
					return d.alive;
				},
				position: () => d.root.getWorldPosition(new THREE.Vector3()),
				center: () => d.center(),
				hitTest: (p, padding) => d.hitTest(p, padding),
				hit: (amount, element, { direction } = {}) => d.hit(amount, element, { time: lab.time, direction }),
			});
		this.skills = new SkillSystem(
			{
				fxScene: app.world.vfxScene,
				scene: this.stage,
				camera: () => app.world.camera,
				depthTexture: app.backend.pipeline?.sceneDepthTexture ?? null,
				caster: {
					position: () => lab.casterGround(),
					hand: () => lab.casterHand(),
					face: () => lab.faceCursor(),
					onCast: () => lab.playCastAnimation(),
					teleport: (p) => lab.teleportCaster(p),
				},
				targets: () => lab.dummies.map(targetOf),
				groundAt: (x, z, y) => lab.groundAt(x, z, y),
				light: {
					flash: (p, color, intensity, opts) => lab.lights?.flash(p, color, intensity, opts),
					hold: (get, color, intensity, opts) => lab.lights?.hold(get, color, intensity, opts),
				},
				shake: (s) => lab.shake(s),
			},
			{ soft: this.settings.quarksSoft },
		);
		this.skills.level = this.settings.skillLevel;
		return this.skills;
	}

	castSkill(id) {
		if (!this.armed) this.arm(true);
		if (!this.ensureSkills()) {
			toast('Skills run on three.quarks, which needs the WebGL2 · GLSL renderer.', 'error', 5000);
			return;
		}
		if (!this.cursor.valid) this.updateCursor();
		if (!this.cursor.valid && !SKILLS[id]?.toggle) {
			toast('Point at the ground or a dummy to cast', 'info', 1500);
			return;
		}
		const c = this.cursor;
		const aim = { point: (c.valid ? c.point : this.casterGround()).clone(), ground: (c.valid ? c.ground : this.casterGround()).clone(), target: c.dummy ? this.skills.host.targets()[this.dummies.indexOf(c.dummy)] ?? null : null };
		if (this.skills.cast(id, aim)) {
			this.casts++;
			this.highlight(id);
		}
	}

	selectSkill(id) {
		if (!SKILLS[id]) return;
		this.settings.skill = id;
		this.save();
		this.highlight(id);
		this.notify();
	}

	setCastMode(mode) {
		this.settings.castMode = mode;
		this.save();
		this.buildCastbar();
		this.notify();
	}

	setSkillLevel(level) {
		this.settings.skillLevel = level;
		this.save();
		if (this.skills) this.skills.level = level;
	}

	setQuarksSoft(on) {
		this.settings.quarksSoft = on;
		this.save();
		this.skills?.fx.setSoft(on);
	}

	/** Play a quarks editor export (.json) at the cursor. */
	importQuarks(json, name = 'quarks.json') {
		if (!this.armed) this.arm(true);
		if (!this.ensureSkills()) throw new Error('three.quarks needs the WebGL2 · GLSL renderer');
		this.updateCursor();
		const entry = this.skills.fx.loadJSON(json, this.cursor.valid ? this.cursor.ground : this.casterGround());
		this.lastImport = { json, name };
		return entry;
	}

	/** Move the model (and the character controller) to `point` — Teleport. */
	teleportCaster(point) {
		const root = this.app.subject.root;
		root.position.copy(root.parent ? root.parent.worldToLocal(point.clone()) : point);
		const c = this.app.character;
		if (c) {
			c.moveTarget = null;
			c.attackTarget = null;
			c.velocity?.set(0, 0, 0);
			c.groundY = point.y;
		}
	}

	/** Short decaying camera shake for big impacts only (art-direction/07 §2). Applied after the rig update and removed before the next one. */
	shake(strength = 0.3) {
		this.shakeAmount = Math.max(this.shakeAmount || 0, strength);
	}

	resetShake() {
		if (this.shakeOffset) this.app.world.camera?.position.sub(this.shakeOffset);
		this.shakeOffset = null;
		this.shakeAmount = 0;
	}

	updateShake(dt) {
		const cam = this.app.world.camera;
		if (!cam) return;
		if (this.shakeOffset) cam.position.sub(this.shakeOffset);
		this.shakeAmount = Math.max(0, (this.shakeAmount || 0) - dt * 1.2);
		if (this.shakeAmount <= 0) {
			this.shakeOffset = null;
			return;
		}
		const a = this.shakeAmount * this.shakeAmount * 0.5;
		this.shakeOffset = new THREE.Vector3((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
		cam.position.add(this.shakeOffset);
		cam.updateMatrixWorld();
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
		bar.classList.toggle('skills', this.skillMode);
		if (this.skillMode) {
			SKILL_ORDER.forEach((id, i) => {
				const skill = SKILLS[id];
				const b = document.createElement('button');
				b.className = `cast skill el-${skill.element}`;
				b.title = `${skill.label} · ${skill.class}${skill.toggle ? ' · aura (toggle)' : ''}\n${skill.summary}`;
				b.innerHTML = `<kbd>${SKILL_KEYS[i]}</kbd>${skill.label}<i class="cd"></i>`;
				b.addEventListener('click', () => {
					this.selectSkill(id);
					this.castSkill(id);
				});
				bar.appendChild(b);
				this.castButtons[id] = b;
			});
			this.highlight(this.settings.skill);
			return;
		}
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
		const selected = this.skillMode ? this.settings.skill : this.settings.selected;
		for (const [n, b] of Object.entries(this.castButtons || {})) b.classList.toggle('active', n === (selected || name));
		const b = this.castButtons?.[name];
		if (!b) return;
		b.classList.remove('pulse');
		void b.offsetWidth;
		b.classList.add('pulse');
	}

	/** Cooldown sweep and aura state on the skill buttons. */
	updateSkillButtons() {
		for (const [id, b] of Object.entries(this.castButtons || {})) {
			const cd = this.skills.cooldown(id);
			b.style.setProperty('--cd', cd.toFixed(3));
			b.classList.toggle('cooling', cd > 0);
			b.classList.toggle('on', this.skills.isToggled(id));
		}
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
		if (this.skills) {
			this.skills.update(dt);
			if (this.skillMode) this.updateSkillButtons();
		}
		this.updateShake(rawDt);
		this.lights.update(dt);
		if (this.compute) {
			this.compute.uniforms.center.value.copy(this.casterGround());
			this.compute.update(dt);
		}
		this.updateTexts(rawDt);
		this.app.particleCount = this.particles.count + (this.skills ? this.skills.fx.particleCount : 0) + (this.compute ? this.compute.count : 0);
	}
}

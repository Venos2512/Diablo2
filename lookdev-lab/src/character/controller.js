// Character preview controller: drive the current model like a player character in any scene.
//   input      WASD / arrows (camera-relative), click or hold to move (Diablo style), gamepad
//   movement   walk / run speeds, acceleration, turn rate, ground following and wall collision
//   animation  Animator (locomotion blend + crossfaded overlays) with clips auto-mapped per stance
//   combat     attacks / spells against the VFX lab's training dummies (hit frame drives the impact)
//   casting    right button / Q / gamepad X: press (buffered while busy) or hold (repeats) -> the VFX lab casts its selected spell / skill
//   checks     equipment + grips, scale reference lineup, foot-slide check
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { Animator } from './animator.js';
import { mapStates, stanceFromItems, analyseLocomotion, stripRootMotion, compatibleClips, STATES } from './clips.js';
import { describeRig, measureHeight } from './rig.js';
import { CollisionWorld } from './collision.js';
import { Equipment } from './equipment.js';
import { FootCheck } from './footCheck.js';
import { ScaleReference, MARKERS } from './scaleRef.js';
import { Cutaway } from './cutaway.js';
import { toast } from '../ui/toast.js';
import { CastHold, Notice, RightGesture, gateCast, castMessage, isTypingTarget, rightRotatesCamera } from '../skills/castControl.js';

registerDefaults('character', {
	camera: 'diablo',
	walkSpeed: 1.6,
	runSpeed: 4.0,
	run: true,
	accel: 18,
	turnRate: 720,
	syncRate: true,
	crossfade: 0.18,
	stance: 'auto',
	collide: true,
	cutaway: true,
	// The foot-slide check's marks (debug: green holds, red skates), opt-in. A new key on purpose: the old `footprints` default was true and sits in
	// every saved session, so reading it would keep the debug marks drawn over the gameplay footprints below for existing users.
	footSlideMarks: false,
	// Environment interaction in Play (character/footsteps.js): footprints by surface, water ripples / splash, foliage bend.
	steps: { enabled: true, prints: true, water: true, grass: true, strength: 1 },
	gamepad: true,
	targets: true,
	scale: { enabled: false, ruler: 3, human: 1.8, small: 1.1, large: 2.6, boss: 3.8, door: 2.4, tree: 6 },
	models: {},
});

export const CAMERAS = {
	diablo: 'Diablo ¾ (fixed angle)',
	iso: 'Isometric 2:1',
	chase: 'Third person',
	orbit: 'Free orbit (follow)',
};

const UP = new THREE.Vector3(0, 1, 0);
const MOVE_KEYS = { w: [0, 1], arrowup: [0, 1], s: [0, -1], arrowdown: [0, -1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export class CharacterController {
	constructor(app) {
		this.app = app;
		this.settings = app.settings.adopt('character');
		this.active = false;
		this.animator = new Animator(app.subject);
		this.equipment = new Equipment(app, () => this.modelStore());
		this.equipment.characterHeight = () => this.height || 1.8;
		this.foot = new FootCheck();
		this.scale = new ScaleReference(app);
		this.cutaway = new Cutaway(app);
		this.rig = null;
		this.map = {};
		this.stance = 'unarmed';
		this.natural = { walk: null, run: null };
		this.height = 0;
		this.velocity = new THREE.Vector3();
		this.facing = 0;
		this.moveTarget = null;
		this.attackTarget = null;
		this.queued = null;
		this.keys = new Set();
		this.walkHeld = false;
		this.pointer = null;
		this.mouseHeld = false;
		this.holdTimer = 0;
		this.collision = null;
		this.collisionScene = null;
		this.groundY = 0;
		this.listeners = new Set();
		this.pad = { buttons: [], connected: false };
		this.status = { state: 'idle', speed: 0, rate: 1 };
		this.castHold = new CastHold({ buffer: 0.3, gap: 0.45 });
		this.notice = new Notice((text, kind) => toast(text, kind, 1600));
		this.rightGesture = new RightGesture();
		this.aimPad = false;
		this.animator.onEvent = (type, state) => this.onAnimEvent(type, state);

		const canvas = app.backend.canvas;
		canvas.addEventListener('pointermove', (e) => {
			this.pointer = { x: e.clientX, y: e.clientY };
			this.rightGesture.move(e.clientX, e.clientY);
		});
		canvas.addEventListener('pointerdown', (e) => {
			if (!this.active) return;
			this.pointer = { x: e.clientX, y: e.clientY };
			if (e.button === 2) {
				// The right button casts on press and keeps casting while held. Where a right drag turns the camera (orbit, chase) it
				// could be a rotation, so only a click (no drag beyond a few px, even one that came back) casts, on release.
				if (this.rightRotates()) this.rightGesture.start(e.clientX, e.clientY);
				else this.pressCast('mouse');
				return;
			}
			if (e.button !== 0) return;
			this.mouseHeld = true;
			this.holdTimer = 0.18; // a short press is a click; holding keeps walking towards the cursor
		});
		addEventListener('pointerup', (e) => {
			if (e.button === 2) {
				this.castHold.release('mouse');
				if (this.rightGesture.finish(e.clientX, e.clientY) === 'click' && this.active && this.rightRotates()) {
					if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) this.pointer = { x: e.clientX, y: e.clientY };
					this.pressCast('mouse');
					this.castHold.release('mouse');
				}
			} else if (e.button === 0) this.mouseHeld = false;
		});
		addEventListener('pointercancel', () => {
			this.mouseHeld = false;
			this.rightGesture.cancel();
			this.castHold.release('mouse');
		});
		canvas.addEventListener('contextmenu', (e) => {
			if (this.active) e.preventDefault(); // the cast itself happens on the button release (pointerup), whatever the platform's menu timing
		});
		addEventListener('keydown', (e) => this.onKeyDown(e));
		addEventListener('keyup', (e) => this.onKeyUp(e));
		addEventListener('blur', () => {
			this.keys.clear();
			this.mouseHeld = false;
			this.rightGesture.cancel();
			this.castHold.clear();
		});
		app.on('click', (e) => this.onClick(e));
		app.on('update', (dt) => this.update(dt));
		app.on('subject', () => this.onSubject());
		app.on('scene', () => this.onScene());
		this.onSubject();
	}

	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	/** Fires once a new model is fully set up (rig, clip map, equipment). */
	onModel(fn) {
		(this.modelListeners ??= new Set()).add(fn);
		return () => this.modelListeners.delete(fn);
	}

	notify() {
		for (const fn of this.listeners) fn();
	}

	save() {
		this.app.settings.changed('character');
	}

	modelKey() {
		const s = this.app.subject;
		return s.sourceId || s.name || 'model';
	}

	modelStore() {
		const key = this.modelKey();
		return (this.settings.models[key] ??= {});
	}

	// ----------------------------------------------------------------------------------------------
	// Model setup

	async onSubject() {
		const subject = this.app.subject;
		const wasActive = this.active;
		if (wasActive) this.setActive(false, { quiet: true });
		this.rig = subject.model ? describeRig(subject.model) : null;
		this.foot.setRig(this.rig);
		const store = this.modelStore();
		// Clips that move the hips forward are made in-place (the controller moves the character).
		this.rootMotion = {};
		for (const clip of subject.clips) {
			if (clip.userData?.labInPlace) continue;
			if (/walk|run|jog|sprint/i.test(clip.name)) {
				const travelled = stripRootMotion(clip, this.rig);
				if (travelled > 0) this.rootMotion[clip.name] = travelled;
			}
			clip.userData = { ...(clip.userData || {}), labInPlace: true };
		}
		if (subject.model && store.height > 0) this.applyHeight(store.height, { persist: false });
		this.height = subject.model ? measureHeight(subject.model) : 0;
		this.scale.setCharacter(this.height);
		if (subject.model && this.rig) await this.equipment.setModel(subject.model, this.rig, subject.name);
		this.refreshMap();
		if (wasActive && subject.clips.length) this.setActive(true, { quiet: true });
		this.notify();
		for (const fn of this.modelListeners || []) fn();
	}

	/** Re-map states after a stance / override / equipment change. */
	refreshMap() {
		const clips = this.app.subject.clips;
		const store = this.modelStore();
		const auto = stanceFromItems(this.equipment.itemName('right'), this.equipment.itemName('left'));
		this.stance = this.settings.stance === 'auto' ? auto : this.settings.stance;
		this.autoStance = auto;
		this.map = mapStates(clips, this.stance, store.states || {});
		this.animator.setMap(this.map);
		this.measureNatural();
		this.notify();
	}

	setOverride(state, clipName) {
		const store = this.modelStore();
		store.states ??= {};
		if (clipName) store.states[state] = clipName;
		else delete store.states[state];
		this.save();
		this.refreshMap();
	}

	/** Natural walk / run speeds of the mapped clips (foot plants), cached per model + clip. */
	measureNatural() {
		const subject = this.app.subject;
		const store = this.modelStore();
		store.natural ??= {};
		this.natural = { walk: null, run: null };
		if (!subject.model || !this.rig) return;
		const mixerRoot = subject.mixer?.getRoot?.() || subject.model;
		for (const state of ['walk', 'run']) {
			const name = this.map[state];
			if (!name) continue;
			const key = `${name}@${this.height.toFixed(2)}`;
			let result = store.natural[key];
			if (!result) {
				const clip = subject.clips.find((c) => c.name === name);
				const holderRotation = subject.pivot.rotation.y;
				const rootRotation = subject.root.rotation.y;
				subject.pivot.rotation.y = this.forwardOffset();
				subject.root.rotation.y = 0;
				result = analyseLocomotion(mixerRoot, subject.root, clip, this.rig);
				subject.pivot.rotation.y = holderRotation;
				subject.root.rotation.y = rootRotation;
				if (result?.reliable) store.natural[key] = { speed: +result.speed.toFixed(3), stride: +result.stride.toFixed(3) };
				result = store.natural[key] || null;
			}
			this.natural[state] = result;
		}
		const fallbackWalk = 1.4 * (this.height / 1.8 || 1);
		const walk = this.natural.walk?.speed || fallbackWalk;
		const run = this.natural.run?.speed || walk * 2.6;
		this.animator.natural = { walk, run };
	}

	forwardOffset() {
		return THREE.MathUtils.degToRad(this.modelStore().forward || 0);
	}

	setForward(deg) {
		this.modelStore().forward = deg;
		this.save();
		if (this.active) this.app.subject.pivot.rotation.y = this.forwardOffset();
		this.modelStore().natural = {};
		this.measureNatural();
		this.notify();
	}

	/** Scale the model so it is `metres` tall (saved per model). */
	applyHeight(metres, { persist = true } = {}) {
		const subject = this.app.subject;
		const model = subject.model;
		if (!model || !(metres > 0)) return;
		const current = measureHeight(model);
		// Scale the pivot: it sits on the ground under the model, so the feet stay on the floor.
		if (current > 0) subject.pivot.scale.multiplyScalar(metres / current);
		subject.root.updateMatrixWorld(true);
		this.height = measureHeight(model);
		this.scale.setCharacter(this.height);
		if (persist) {
			this.modelStore().height = metres;
			this.save();
			this.measureNatural();
			if (this.scale.visible) this.placeScale();
		}
		this.notify();
	}

	/** Clips from another file (same bone names) added to the current model. */
	addClips(clips, sourceName) {
		const subject = this.app.subject;
		if (!subject.model) return;
		const { added, skipped } = compatibleClips(subject.model, clips);
		const names = new Set(subject.clips.map((c) => c.name));
		for (const clip of added) {
			if (names.has(clip.name)) clip.name = `${clip.name} (${sourceName})`;
			subject.clips.push(clip);
		}
		if (!subject.mixer && added.length) subject.mixer = new THREE.AnimationMixer(subject.model.children[0] || subject.model);
		toast(`${added.length} clip(s) added from ${sourceName}${skipped ? ` · ${skipped} skipped (other rig)` : ''}`, added.length ? 'ok' : 'error', 5000);
		this.refreshMap();
		this.app.emit('subject', subject);
	}

	// ----------------------------------------------------------------------------------------------
	// Play mode

	setActive(on, { quiet = false } = {}) {
		const app = this.app;
		on = !!on;
		if (on && app.gameplay?.active) {
			if (!quiet) toast('Gameplay is running — press Esc to leave it before using the lab controller', 'info', 3000);
			on = false;
		}
		if (on && !app.subject.clips.length) {
			if (!quiet) toast('This model has no animation clips — load the D2R Sorceress or your own animated GLB.', 'error', 5000);
			on = false;
		}
		if (on === this.active) return;
		const subject = app.subject;
		if (on) {
			this.active = true;
			this.prevCamera = app.rig.state();
			this.prevTurntable = subject.turntable;
			subject.turntable = false;
			subject.pivot.rotation.y = this.forwardOffset();
			this.facing = subject.root.rotation.y;
			this.velocity.set(0, 0, 0);
			this.moveTarget = this.attackTarget = this.queued = null;
			this.ensureCollision();
			if (this.settings.cutaway) this.cutaway.prepareScene(app.world.scene, (o) => this.isDynamic(o));
			this.groundY = subject.root.getWorldPosition(_v).y;
			this.animator.crossfade = this.settings.crossfade;
			this.animator.syncRate = this.settings.syncRate;
			this.animator.attach();
			this.animator.setMap(this.map);
			this.applyCamera();
			if (this.settings.targets && app.vfxLab && !app.vfxLab.armed) app.vfxLab.arm(true);
			this.foot.reset();
			app.current.scene.add(this.foot.group);
			app.backend.prepareObject(this.foot.group);
			document.activeElement?.blur?.();
			if (!quiet) toast('Character: WASD / click to move · Space attack · E attack 2 · right click (hold) or Q cast the selected spell / skill · 1–9 pick + cast · B block · G get hit · K death · R walk/run', 'info', 6500);
		} else {
			this.active = false;
			this.keys.clear();
			this.mouseHeld = false;
			this.rightGesture.cancel();
			this.castHold.clear();
			this.cutaway.update(app.world.camera, _v, 0, 1, false);
			this.animator.detach();
			app.rig.follow = null;
			if (this.prevCamera) {
				app.rig.setMode(this.prevCamera.mode || 'orbit');
				app.rig.restore(this.prevCamera);
			}
			subject.turntable = this.prevTurntable ?? subject.turntable;
			subject.root.position.set(0, 0, 0);
			subject.root.rotation.set(0, 0, 0);
			subject.pivot.rotation.set(0, 0, 0);
			this.foot.group.removeFromParent();
			app.shaderLab?.layout?.();
		}
		app.vfxLab?.notify?.();
		this.notify();
	}

	applyCamera() {
		const rig = this.app.rig;
		this.rightGesture.cancel();
		rig.followHeight = THREE.MathUtils.clamp((this.height || 1.8) * 0.55, 0.4, 2.5);
		rig.follow = this.app.subject.root;
		const mode = { diablo: 'play', iso: 'iso', chase: 'chase', orbit: 'orbit' }[this.settings.camera] || 'play';
		if (mode === 'chase') rig.chaseAzimuth = this.facing + Math.PI;
		rig.setMode(mode);
		const c = rig.controls;
		if (mode === 'orbit') {
			c.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
			c.enablePan = false;
		}
		if (mode === 'iso') c.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null };
		// Snap the focus onto the character so the camera does not drift in from the old view.
		const goal = this.app.subject.root.getWorldPosition(_v).add(new THREE.Vector3(0, rig.followHeight, 0));
		const delta = goal.clone().sub(c.target);
		c.target.add(delta);
		rig.camera.position.add(delta);
		c.update();
	}

	/** A right drag turns the camera in the current mode (so the button casts on release, not on press). */
	rightRotates() {
		return rightRotatesCamera(this.settings.camera, this.app.rig?.controls);
	}

	setCamera(id) {
		this.settings.camera = id;
		this.rightGesture.cancel(); // a press that started under the old camera must not cast under the new one
		this.save();
		if (this.active) this.applyCamera();
	}

	// ----------------------------------------------------------------------------------------------
	// Collision / ground

	/** Things that move or belong to the tools (never collided with, never cut away). */
	isDynamic(o) {
		const app = this.app;
		return o === app.subject.root || o === app.vfxLab?.stage || o === this.scale.group || o === this.foot.group || o === app.footsteps?.group || o === this.equipment.helper || !!o.userData?.dummy;
	}

	ensureCollision() {
		const scene = this.app.world.scene;
		if (this.collision && this.collisionScene === scene) return;
		const app = this.app;
		const t0 = performance.now();
		this.collision = new CollisionWorld(scene, (o) => this.isDynamic(o));
		this.collisionScene = scene;
		this.collisionTime = performance.now() - t0;
	}

	onScene() {
		this.collision = null;
		this.scale.clear();
		this.notify();
		if (this.active) {
			// Start at the new scene's spawn point (the subject root is re-parented to its anchor).
			this.app.subject.root.position.set(0, 0, 0);
			this.velocity.set(0, 0, 0);
			this.moveTarget = this.attackTarget = null;
			this.groundY = this.anchor().y;
			this.ensureCollision();
			if (this.settings.cutaway) this.cutaway.prepareScene(this.app.world.scene, (o) => this.isDynamic(o));
			this.app.current.scene.add(this.foot.group);
			this.applyCamera();
		}
		if (this.settings.scale.enabled) setTimeout(() => this.placeScale(), 0);
	}

	groundAt(x, z, y = this.groundY) {
		if (this.settings.collide && this.collision) {
			const g = this.collision.groundHeight(x, z, y + 0.55);
			if (g !== null) return g;
		}
		return this.app.vfxLab?.groundAt ? this.app.vfxLab.groundAt(x, z, y) : y;
	}

	anchor() {
		return this.app.current.anchor.getWorldPosition(new THREE.Vector3());
	}

	// ----------------------------------------------------------------------------------------------
	// Input

	onKeyDown(e) {
		if (!this.active || isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
		const k = e.key.toLowerCase();
		if (MOVE_KEYS[k]) {
			this.keys.add(k);
			this.moveTarget = this.attackTarget = null;
			e.preventDefault();
			return;
		}
		if (k === 'shift') this.walkHeld = true;
		if (e.repeat) return;
		if (k === ' ' || k === 'j') {
			e.preventDefault();
			this.attack('attack');
		} else if (k === 'e') this.attack('attack2');
		else if (k === 'q') this.pressCast('key');
		else if (k === 'b') this.trigger('block', { hold: true });
		else if (k === 'g') this.getHit();
		else if (k === 'k') this.toggleDeath();
		else if (k === 'r') {
			this.settings.run = !this.settings.run;
			this.save();
			toast(this.settings.run ? 'Run' : 'Walk', 'info', 900);
			this.notify();
		}
	}

	onKeyUp(e) {
		const k = e.key.toLowerCase();
		if (this.active && k === ' ' && !isTypingTarget(e.target)) e.preventDefault();
		this.keys.delete(k);
		if (k === 'q') this.castHold.release('key');
		if (k === 'shift') this.walkHeld = false;
		if (k === 'b' && this.active) this.animator.release('block');
	}

	onClick(e) {
		if (!this.active) return;
		this.app.consumedClick = true;
		this.pointer = { x: e.clientX, y: e.clientY };
		const hit = this.pick();
		if (!hit) return;
		if (e.shiftKey) {
			// Diablo: shift-click attacks in place towards the cursor.
			this.faceTowards(hit.point);
			this.attack('attack');
			return;
		}
		if (hit.dummy) {
			this.attackTarget = hit.dummy;
			this.moveTarget = null;
		} else {
			this.moveTarget = hit.point.clone();
			this.attackTarget = null;
		}
	}

	/** Ray from the pointer: training dummies first, then the walkable scene (grid-accelerated). */
	pick() {
		if (!this.pointer) return null;
		const app = this.app;
		const rect = app.backend.canvas.getBoundingClientRect();
		const ndc = new THREE.Vector2(((this.pointer.x - rect.left) / rect.width) * 2 - 1, -((this.pointer.y - rect.top) / rect.height) * 2 + 1);
		const ray = new THREE.Raycaster();
		ray.setFromCamera(ndc, app.world.camera);
		const dummies = (app.vfxLab?.dummies || []).filter((d) => d.alive);
		const dummyHit = dummies.length ? ray.intersectObjects(dummies.map((d) => d.root), true)[0] : null;
		let sceneHit = this.collision?.raycast(ray.ray.origin, ray.ray.direction, 300);
		if (!sceneHit) {
			const plane = new THREE.Plane(UP, -this.groundY);
			const p = ray.ray.intersectPlane(plane, new THREE.Vector3());
			if (p) sceneHit = { point: p, distance: p.distanceTo(ray.ray.origin) };
		}
		if (dummyHit && (!sceneHit || dummyHit.distance <= sceneHit.distance + 0.05)) {
			const dummy = dummyHit.object.userData.dummy;
			return { point: dummy.root.getWorldPosition(new THREE.Vector3()), dummy };
		}
		return sceneHit ? { point: sceneHit.point } : null;
	}

	readGamepad() {
		if (!this.settings.gamepad || !navigator.getGamepads) return null;
		const pad = [...navigator.getGamepads()].find((p) => p && p.connected);
		this.pad.connected = !!pad;
		if (!pad) return null;
		const pressed = pad.buttons.map((b) => b.pressed);
		const was = this.pad.buttons;
		const edge = (i) => pressed[i] && !was[i];
		if (edge(0)) this.attack('attack');
		if (edge(3)) this.attack('attack2');
		if (edge(2)) this.pressCast('pad');
		if (!pressed[2] && was[2]) this.castHold.release('pad');
		if (edge(1)) this.trigger('block', { hold: true });
		if (!pressed[1] && was[1]) this.animator.release('block');
		if (edge(4)) this.getHit();
		if (edge(5)) {
			this.settings.run = !this.settings.run;
			this.notify();
		}
		if (edge(9)) this.toggleDeath();
		this.pad.buttons = pressed;
		const dead = (v) => (Math.abs(v) < 0.18 ? 0 : v);
		const lx = dead(pad.axes[0] || 0);
		const ly = dead(pad.axes[1] || 0);
		const rx = dead(pad.axes[2] || 0);
		const ry = dead(pad.axes[3] || 0);
		if ((rx || ry) && ['chase', 'orbit'].includes(this.settings.camera)) this.app.rig.orbitBy(-rx * 0.045, -ry * 0.03);
		return lx || ly ? { x: lx, y: -ly, magnitude: Math.min(1, Math.hypot(lx, ly)) } : null;
	}

	// ----------------------------------------------------------------------------------------------
	// Actions

	trigger(state, options) {
		if (!this.active || (this.animator.dead && state !== 'revive')) return false;
		const ok = this.animator.trigger(state, options);
		if (!ok && !STATES[state]?.loop && !options?.quiet) toast(`No clip mapped for “${STATES[state]?.label || state}” — pick one in the Character tab.`, 'error', 2500);
		if (ok) this.velocity.set(0, 0, 0);
		this.notify();
		return ok;
	}

	attack(state = 'attack') {
		if (!this.active || this.animator.dead) return;
		const top = this.animator.current();
		if (['attack', 'attack2', 'cast', 'hit', 'blockHit', 'revive'].includes(top)) {
			this.queued = state; // pressed during a swing: chain once it ends
			return;
		}
		const target = this.attackTarget?.alive ? this.attackTarget : this.nearestTarget(this.reach() + 0.6);
		if (target) this.faceTowards(target.root.getWorldPosition(_v));
		this.attackTarget = null;
		this.moveTarget = null;
		this.trigger(state);
	}

	// ----------------------------------------------------------------------------------------------
	// Casting: the right button, Q and the gamepad's X press (buffered while busy) or hold (repeat) -> tryCast -> the VFX lab

	/** A cast press from `source` ('mouse' | 'key' | 'pad'); the next frame tries it, a hold keeps trying. */
	pressCast(source) {
		this.aimPad = source === 'pad';
		this.castHold.press(source);
	}

	/** One-shot cast at the cursor (kept for callers; same path as a press). */
	castAtCursor(fromPad = false) {
		this.pressCast(fromPad ? 'pad' : 'key');
		this.castHold.release(fromPad ? 'pad' : 'key');
	}

	/** Why a cast cannot even start (the hero is dead), else null. */
	castBlocker() {
		return gateCast({ dead: this.animator.dead });
	}

	/** Aim the VFX lab: the dummy / ground under the pointer (same picking as the move click), else the nearest dummy for the pad. */
	aimLab({ pad = false } = {}) {
		const lab = this.app.vfxLab;
		if (!lab) return;
		if (pad) {
			const target = this.nearestTarget(12);
			if (target) lab.aimAt(target.root.getWorldPosition(_v), target);
			else lab.aimForward();
			return;
		}
		const hit = this.pick();
		if (hit) lab.aimAt(hit.point, hit.dummy || null);
		// no pointer over the canvas: the lab falls back to its cursor ray, then straight ahead
	}

	/**
	 * One cast attempt (called by CastHold). Returns { ok, reason }. The lab arms itself on the first cast, so this does not
	 * depend on the VFX tab or on the "training dummies as targets" switch.
	 */
	tryCast({ fresh = true } = {}) {
		const lab = this.app.vfxLab;
		if (!this.active || !lab) return { ok: false, reason: 'unsupported' };
		const why = gateCast({ dead: this.animator.dead, locked: this.animator.busy });
		if (why) {
			if (why === 'dead' && fresh) this.notice.say('dead', castMessage(why));
			return { ok: false, reason: why };
		}
		this.aimLab({ pad: this.aimPad });
		const result = lab.castSelected({ quiet: !fresh });
		this.aimPad = false;
		return result;
	}

	/** Called by the VFX lab when it casts a spell: play the cast clip (quietly, a held button would repeat the warning). */
	onCast() {
		if (!this.active) return;
		if (!this.trigger('cast', { quiet: true })) this.notice.say('noclip', 'No cast clip mapped — pick one in the Character tab (the spell still fires).', 'error');
	}

	getHit() {
		if (!this.active || this.animator.dead) return;
		const blocking = this.animator.current() === 'block';
		this.trigger(blocking && this.map.blockHit ? 'blockHit' : 'hit', { locks: true });
		if (!blocking && this.app.vfxLab?.armed) {
			const p = this.app.subject.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, this.height * 0.6, 0));
			this.app.vfxLab.combatText(p, 7 + Math.random() * 6, 'physical');
		}
	}

	toggleDeath() {
		if (!this.active) return;
		if (this.animator.dead) {
			if (!this.animator.trigger('revive', { locks: true })) this.animator.clearOverlays();
		} else this.trigger('death');
		this.notify();
	}

	faceTowards(point) {
		const p = this.app.subject.root.getWorldPosition(_w);
		const dx = point.x - p.x;
		const dz = point.z - p.z;
		if (dx * dx + dz * dz < 1e-6) return;
		this.facing = Math.atan2(dx, dz);
		this.app.subject.root.rotation.y = this.facing;
	}

	reach() {
		const r = this.stance === 'ranged1h' || this.stance === 'ranged2h' || this.stance === 'spell' ? 9 : this.stance === '2h' ? 1.7 : 1.35;
		return r * Math.max(0.6, (this.height || 1.8) / 1.8);
	}

	nearestTarget(maxDistance) {
		const p = this.app.subject.root.getWorldPosition(new THREE.Vector3());
		let best = null;
		let bestD = maxDistance;
		for (const d of this.app.vfxLab?.dummies || []) {
			if (!d.alive) continue;
			const dist = d.root.getWorldPosition(_v).distanceTo(p);
			if (dist < bestD) {
				best = d;
				bestD = dist;
			}
		}
		return best;
	}

	onAnimEvent(type, state) {
		if (type === 'hit' && (state === 'attack' || state === 'attack2')) this.strike(state);
		if (type === 'end' && this.queued) {
			const next = this.queued;
			this.queued = null;
			setTimeout(() => this.attack(next === 'attack' ? 'attack2' : 'attack'), 0);
		}
		if (type === 'end') this.notify();
	}

	/** Impact frame of a swing / shot: hit the dummy in front (melee) or the one aimed at (ranged). */
	strike(state) {
		const lab = this.app.vfxLab;
		if (!lab?.armed) return;
		const root = this.app.subject.root;
		const p = root.getWorldPosition(new THREE.Vector3());
		const forward = new THREE.Vector3(Math.sin(this.facing), 0, Math.cos(this.facing));
		const ranged = this.reach() > 3;
		let best = null;
		let bestScore = -Infinity;
		for (const d of lab.dummies) {
			if (!d.alive) continue;
			const to = d.root.getWorldPosition(_v).sub(p).setY(0);
			const dist = to.length();
			if (dist > this.reach() + 0.45) continue;
			const dot = dist > 1e-3 ? to.normalize().dot(forward) : 1;
			if (dot < (ranged ? 0.9 : 0.35)) continue;
			const score = dot - dist * 0.1;
			if (score > bestScore) {
				best = d;
				bestScore = score;
			}
		}
		if (!best) return;
		const damage = (state === 'attack2' ? 14 : 9) + Math.random() * 6;
		lab.strike(best, { from: p.clone().add(new THREE.Vector3(0, this.height * 0.6, 0)), damage });
	}

	// ----------------------------------------------------------------------------------------------
	// Frame

	update(dt) {
		this.equipment.update();
		if (this.scale.visible) {
			const top = this.app.subject.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, this.height + 0.25, 0));
			this.scale.update(this.app.world.camera, top);
		}
		if (!this.active || !this.app.subject.model) return;
		dt = Math.min(dt, 0.05) * (this.app.vfxLab?.settings.timeScale ?? 1);
		this.castHold.step(dt, (o) => this.tryCast(o));
		const s = this.settings;
		const app = this.app;
		const root = app.subject.root;
		const anchor = this.anchor();
		const position = root.getWorldPosition(new THREE.Vector3());

		// Desired direction: keyboard / gamepad (camera-relative) or the click target.
		const camera = app.world.camera;
		const forward = camera.getWorldDirection(new THREE.Vector3()).setY(0);
		if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
		forward.normalize();
		const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
		let input = new THREE.Vector2();
		for (const k of this.keys) input.add(new THREE.Vector2(...MOVE_KEYS[k]));
		let magnitude = input.lengthSq() > 0 ? 1 : 0;
		const pad = this.readGamepad();
		if (pad) {
			input.set(pad.x, pad.y);
			magnitude = pad.magnitude;
			this.moveTarget = this.attackTarget = null;
		}
		if (this.mouseHeld) {
			this.holdTimer -= dt;
			if (this.holdTimer <= 0) {
				this.holdTimer = 0.1;
				const hit = this.pick();
				if (hit && !hit.dummy) {
					this.moveTarget = hit.point.clone();
					this.attackTarget = null;
				}
			}
		}
		const desired = new THREE.Vector3();
		if (magnitude > 0) {
			desired.addScaledVector(right, input.x).addScaledVector(forward, input.y);
			if (desired.lengthSq() > 1e-6) desired.normalize().multiplyScalar(magnitude);
		} else if (this.attackTarget) {
			if (!this.attackTarget.alive) this.attackTarget = null;
			else {
				const to = this.attackTarget.root.getWorldPosition(new THREE.Vector3()).sub(position).setY(0);
				if (to.length() <= this.reach()) this.attack('attack');
				else desired.copy(to.normalize());
			}
		} else if (this.moveTarget) {
			const to = this.moveTarget.clone().sub(position).setY(0);
			const dist = to.length();
			const stop = Math.max(0.08, this.velocity.length() * 0.05);
			if (dist < stop) this.moveTarget = null;
			else desired.copy(to.normalize()).multiplyScalar(Math.min(1, dist / 0.6 + 0.35));
		}
		const locked = this.animator.busy || this.animator.dead;
		const running = s.run !== this.walkHeld && !(pad && pad.magnitude < 0.75);
		const topSpeed = running ? s.runSpeed : s.walkSpeed;
		const goal = locked ? new THREE.Vector3() : desired.multiplyScalar(topSpeed);
		// Accelerate towards the goal velocity.
		const k = 1 - Math.exp(-dt * s.accel * 0.35);
		this.velocity.lerp(goal, k);
		if (goal.lengthSq() === 0 && this.velocity.length() < 0.05) this.velocity.set(0, 0, 0);

		// Move, then collide and follow the ground.
		const step = this.velocity.clone().multiplyScalar(dt);
		const next = position.clone().add(step);
		if (s.collide && this.collision) {
			const radius = THREE.MathUtils.clamp(this.height * 0.17, 0.18, 0.6);
			const pushed = new THREE.Vector3();
			const hitWall = this.collision.pushOut(next.x, next.z, radius, position.y + 0.3, position.y + Math.max(1, this.height * 0.8), pushed);
			if (hitWall) {
				next.x = pushed.x;
				next.z = pushed.z;
			}
			// Dummies are round obstacles.
			for (const d of app.vfxLab?.dummies || []) {
				if (!d.alive) continue;
				const c = d.root.getWorldPosition(_v);
				const dx = next.x - c.x;
				const dz = next.z - c.z;
				const dist = Math.hypot(dx, dz);
				const min = radius + 0.32;
				if (dist < min && dist > 1e-4) {
					next.x = c.x + (dx / dist) * min;
					next.z = c.z + (dz / dist) * min;
				}
			}
		}
		const ground = this.groundAt(next.x, next.z, position.y);
		if (ground - position.y > 0.55) {
			// Too high to step up: stay (a ledge / table top).
			next.x = position.x;
			next.z = position.z;
			this.velocity.set(0, 0, 0);
		} else {
			next.y = ground;
		}
		if (!Number.isFinite(next.x) || !Number.isFinite(next.y) || !Number.isFinite(next.z)) {
			next.copy(position); // never let a bad collision result teleport the character
			this.velocity.set(0, 0, 0);
		}
		const actual = next.clone().sub(position).setY(0);
		const speed = dt > 0 ? actual.length() / dt : 0;
		this.groundY = next.y;
		root.position.copy(next).sub(anchor);

		// Face the movement (turn rate), or keep the facing while standing / attacking.
		if (!locked && speed > 0.15) {
			const target = Math.atan2(actual.x, actual.z);
			let diff = target - this.facing;
			diff = Math.atan2(Math.sin(diff), Math.cos(diff));
			const maxTurn = THREE.MathUtils.degToRad(s.turnRate) * dt;
			this.facing += THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);
		}
		root.rotation.y = this.facing;

		// Third-person camera drifts behind the character while it moves.
		if (s.camera === 'chase' && speed > 0.3 && !this.mouseHeld) {
			const cam = app.rig.camera.position.clone().sub(app.rig.controls.target);
			const current = Math.atan2(cam.x, cam.z);
			let diff = this.facing + Math.PI - current;
			diff = Math.atan2(Math.sin(diff), Math.cos(diff));
			app.rig.orbitBy(diff * (1 - Math.exp(-dt * 1.5)));
		}

		this.animator.crossfade = s.crossfade;
		this.animator.syncRate = s.syncRate;
		this.animator.update(dt, speed, s.walkSpeed, s.runSpeed);
		root.updateMatrixWorld(true);
		const chest = next.clone().add(new THREE.Vector3(0, (this.height || 1.8) * 0.6, 0));
		this.cutaway.update(app.world.camera, chest, next.y, this.height || 1.8, s.cutaway);
		this.foot.enabled = s.footSlideMarks;
		this.foot.group.visible = s.footSlideMarks;
		this.foot.update(dt, root, (x, z) => this.groundAt(x, z, this.groundY), this.facing, speed);
		this.status = { state: this.animator.current(), speed, rate: this.animator.rate };
	}

	// ----------------------------------------------------------------------------------------------
	// Scale reference

	setScaleEnabled(on) {
		this.settings.scale.enabled = on;
		this.save();
		if (on) this.placeScale();
		else this.scale.clear();
		this.notify();
	}

	placeScale() {
		const app = this.app;
		if (!app.subject.model) return;
		this.ensureCollision();
		const root = app.subject.root;
		const origin = root.getWorldPosition(new THREE.Vector3());
		// Line up to the right of the character as seen from the camera.
		const camera = app.world.camera;
		const forward = camera.getWorldDirection(new THREE.Vector3()).setY(0);
		if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
		forward.normalize();
		const side = new THREE.Vector3().crossVectors(forward, UP).normalize();
		const heights = {};
		for (const kind of Object.keys(MARKERS)) heights[kind] = this.settings.scale[kind];
		this.height = measureHeight(app.subject.model);
		this.scale.setCharacter(this.height);
		this.scale.build(origin, side, heights, (x, z, y) => this.groundAt(x, z, y));
	}

	dispose() {
		this.setActive(false, { quiet: true });
		this.equipment.dispose();
		this.foot.dispose();
		this.scale.dispose();
	}
}

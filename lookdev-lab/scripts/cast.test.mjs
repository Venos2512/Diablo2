// Casting end to end without a browser: input events -> the Play cores -> the cast actually dispatched.
//   run: node --import ./scripts/test-assets-register.mjs --test scripts/cast.test.mjs   (npm run test:cast)
// Real modules: castControl, SkillSystem + the skill definitions (fx stubbed: quarks needs a canvas), the gameplay Input / Player /
// projectiles / combat / nativeSkills / GameplayHost, the Character controller and the VFX lab (a fake app around them: no renderer).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';

// ---- browser stubs: must exist before the lab modules run ------------------------------------------------------------------
const windowHandlers = new Map();
const fakeContext2d = new Proxy({}, { get: (t, k) => (k === 'canvas' ? {} : (k in t ? t[k] : () => ({ addColorStop() {}, data: new Uint8ClampedArray(4) }))), set: (t, k, v) => ((t[k] = v), true) });
function fakeEl(tag = 'div') {
	const el = {
		tag,
		style: { setProperty() {} },
		dataset: {},
		children: [],
		classList: { toggle() {}, add() {}, remove() {}, contains: () => false },
		hidden: false,
		textContent: '',
		innerHTML: '',
		clientWidth: 1000,
		width: 64,
		height: 64,
		appendChild(c) {
			this.children.push(c);
			return c;
		},
		addEventListener() {},
		removeEventListener() {},
		querySelector: () => fakeEl(),
		querySelectorAll: () => [],
		remove() {},
		getContext: () => fakeContext2d,
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
		closest: () => null,
	};
	return el;
}
globalThis.document = { createElement: fakeEl, getElementById: () => fakeEl(), activeElement: null };
globalThis.ResizeObserver = class { observe() {} };
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.sessionStorage = globalThis.localStorage;
globalThis.addEventListener = (type, fn) => {
	if (!windowHandlers.has(type)) windowHandlers.set(type, []);
	windowHandlers.get(type).push(fn);
};
const fireWindow = (type, event) => (windowHandlers.get(type) || []).forEach((fn) => fn(event));

/** A canvas whose listeners the test can fire. */
function fakeCanvas() {
	const handlers = new Map();
	return {
		addEventListener(type, fn) {
			if (!handlers.has(type)) handlers.set(type, []);
			handlers.get(type).push(fn);
		},
		fire(type, event = {}) {
			const e = { preventDefault() { e.prevented = true; }, button: 0, clientX: 400, clientY: 300, target: fakeEl(), ...event };
			for (const fn of handlers.get(type) || []) fn(e);
			return e;
		},
		getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
	};
}

const { registerDefaults, Settings } = await import('../src/core/settings.js');
const castControl = await import('../src/skills/castControl.js');
const { SkillSystem } = await import('../src/skills/runtime.js');
const { SKILLS, SKILL_ORDER } = await import('../src/skills/skills.js');
const { G, hash, tickTimers, clearTimers } = await import('../src/gameplay/state.js');
const { Engine } = await import('../src/gameplay/engine.js');
const { Input } = await import('../src/gameplay/input.js');
const { Player } = await import('../src/gameplay/player.js');
const { Actor } = await import('../src/gameplay/actor.js');
const { updateProjectiles, updateEffects, clearProjectiles } = await import('../src/gameplay/projectiles.js');
const { createNativeSkills, NATIVE_SKILLS } = await import('../src/gameplay/nativeSkills.js');
const { GameplayHost } = await import('../src/gameplay/host.js');
const { CharacterController } = await import('../src/character/controller.js');
const { VfxLab } = await import('../src/vfx/vfxLab.js');
const { SPELLS, SPELL_ORDER } = await import('../src/vfx/spells.js');

const { KEY_SCHEMES, resolveKey, keyLabel, gateCast, castMessage, CastHold, Notice, forwardAim, isTypingTarget, hasShortcutModifier, RightGesture, rightRotatesCamera } = castControl;
const DT = 1 / 60;
const frames = (seconds) => Math.round(seconds / DT);

// ---------------------------------------------------------------------------------------------------------------------------
// 1. castControl (the pure part)

test('key schemes: classic F1–F8 + 1–4 potions, modern 1–4 + Q E Z X', () => {
	assert.deepEqual(resolveKey('classic', 'F1'), { kind: 'skill', slot: 0 });
	assert.deepEqual(resolveKey('classic', 'F8'), { kind: 'skill', slot: 7 });
	assert.deepEqual(resolveKey('classic', 'Digit3'), { kind: 'potion', slot: 2 });
	assert.equal(resolveKey('classic', 'KeyQ'), null);
	assert.deepEqual(resolveKey('modern', 'Digit4'), { kind: 'skill', slot: 3 });
	assert.deepEqual(resolveKey('modern', 'KeyX'), { kind: 'potion', slot: 3 });
	assert.equal(resolveKey('modern', 'F2'), null);
	assert.deepEqual(resolveKey('nonsense', 'F2'), { kind: 'skill', slot: 1 }, 'an unknown scheme falls back to classic');
	assert.deepEqual([keyLabel('F5'), keyLabel('Digit2'), keyLabel('KeyQ')], ['F5', '2', 'Q']);
});

test('typing in a field or using a modifier never counts as a cast key', () => {
	assert.equal(isTypingTarget({ closest: (s) => (s.includes('input') ? {} : null) }), true);
	assert.equal(isTypingTarget({ closest: () => null }), false);
	assert.equal(isTypingTarget({ isContentEditable: true }), true);
	assert.equal(isTypingTarget(null), false);
	assert.equal(hasShortcutModifier({ ctrlKey: true }), true);
	assert.equal(hasShortcutModifier({}), false);
});

test('gateCast: what can never work first, then moments that pass, mana last; an aura that is on can always switch off', () => {
	assert.equal(gateCast({}), null);
	assert.equal(gateCast({ supported: false, dead: true }), 'unsupported');
	assert.equal(gateCast({ dead: true, locked: true }), 'dead');
	assert.equal(gateCast({ locked: true, cooling: true }), 'busy');
	assert.equal(gateCast({ casting: true, cooling: true }), 'casting');
	assert.equal(gateCast({ cooling: true, mana: 0, cost: 5 }), 'cooldown');
	assert.equal(gateCast({ mana: 4, cost: 5 }), 'mana');
	assert.equal(gateCast({ mana: 5, cost: 5 }), null);
	assert.equal(gateCast({ cooling: true, toggledOn: true }), null);
	assert.match(castMessage('mana'), /mana/i);
	assert.match(castMessage('cooldown', 'Fireball'), /Fireball/);
});

test('Notice: the same message at most once per interval, a different one at once', () => {
	let now = 0;
	const out = [];
	const n = new Notice((text) => out.push(text), { interval: 1, clock: () => now });
	assert.equal(n.say('a', 'A'), true);
	assert.equal(n.say('a', 'A'), false);
	assert.equal(n.say('b', 'B'), true);
	now = 1.01;
	assert.equal(n.say('a', 'A'), true);
	assert.deepEqual(out, ['A', 'B', 'A']);
});

test('CastHold: a press is tried at once; a busy hero buffers it for 0.3 s; a hold repeats every gap', () => {
	const hold = new CastHold({ buffer: 0.3, gap: 0.1 });
	const calls = [];
	let busy = true;
	const attempt = (o) => {
		calls.push(o.fresh);
		return busy ? { ok: false, reason: 'busy' } : { ok: true };
	};
	hold.press('mouse');
	hold.release('mouse'); // a quick click
	for (let i = 0; i < 10; i++) hold.step(DT, attempt); // 0.17 s busy: still buffered
	assert.ok(calls.length >= 10 && calls.every((f) => f === true), 'retries as fresh while buffered');
	busy = false;
	const before = calls.length;
	hold.step(DT, attempt);
	assert.equal(calls.length, before + 1, 'cast once the hero is free');
	for (let i = 0; i < 20; i++) hold.step(DT, attempt);
	assert.equal(calls.length, before + 1, 'no repeat after the click');
	// the buffer expires
	const late = new CastHold({ buffer: 0.3, gap: 0.1 });
	let n = 0;
	late.press('mouse');
	late.release('mouse');
	for (let i = 0; i < 60; i++) late.step(DT, () => (n++, { ok: false, reason: 'busy' }));
	const stopped = n;
	for (let i = 0; i < 60; i++) late.step(DT, () => (n++, { ok: false, reason: 'busy' }));
	assert.equal(n, stopped, 'a click that waits longer than the buffer is dropped');
	assert.equal(late.active, false);
	// a hold repeats
	const held = new CastHold({ buffer: 0.3, gap: 0.1 });
	let casts = 0;
	held.press('mouse');
	for (let i = 0; i < frames(1); i++) held.step(DT, () => (casts++, { ok: true }));
	assert.ok(casts >= 9 && casts <= 11, `${casts} casts in a second at a 0.1 s gap`);
	held.release('mouse');
	const after = casts;
	for (let i = 0; i < 30; i++) held.step(DT, () => (casts++, { ok: true }));
	assert.equal(casts, after, 'release stops the repeat');
});

test('CastHold: a reason that will not clear (no mana, unsupported) is not buffered but a held button keeps trying', () => {
	const hold = new CastHold({ buffer: 0.3, gap: 0.1 });
	let n = 0;
	hold.press('mouse');
	hold.release('mouse');
	for (let i = 0; i < 60; i++) hold.step(DT, () => (n++, { ok: false, reason: 'mana' }));
	assert.equal(n, 1, 'one attempt for a click');
	const held = new CastHold({ buffer: 0.3, gap: 0.1 });
	n = 0;
	held.press('mouse');
	for (let i = 0; i < 60; i++) held.step(DT, () => (n++, { ok: false, reason: 'mana' }));
	assert.ok(n >= 9, 'a hold retries (mana regenerates)');
});

test('forwardAim points along the facing (0 = +Z)', () => {
	const p = forwardAim(1, 2, 0, 6);
	assert.ok(Math.abs(p.x - 1) < 1e-9 && Math.abs(p.z - 8) < 1e-9);
	const q = forwardAim(0, 0, Math.PI / 2, 4);
	assert.ok(Math.abs(q.x - 4) < 1e-9 && Math.abs(q.z) < 1e-9);
});

test('rightRotatesCamera: orbit and chase rotate on the right button, diablo / iso do not; the real binding wins when there is one', () => {
	for (const id of ['orbit', 'chase']) assert.equal(rightRotatesCamera(id), true, id);
	for (const id of ['diablo', 'iso', undefined]) assert.equal(rightRotatesCamera(id), false, String(id));
	assert.equal(rightRotatesCamera('diablo', { mouseButtons: { RIGHT: 0 } }), true, 'bound to ROTATE');
	assert.equal(rightRotatesCamera('orbit', { mouseButtons: { RIGHT: null } }), false, 'unbound');
	assert.equal(rightRotatesCamera('chase', { mouseButtons: { RIGHT: 2 } }), false, 'PAN is not a rotation');
	assert.equal(rightRotatesCamera('chase', { enabled: false, mouseButtons: { RIGHT: 0 } }), false, 'controls off');
	assert.equal(rightRotatesCamera('chase', { mouseButtons: {} }), true, 'no RIGHT entry: the mode decides');
});

test('RightGesture: a click stays within the threshold, a drag stays a drag even when it comes back, cancel ends it', () => {
	const g = new RightGesture();
	assert.equal(g.finish(0, 0), null, 'no gesture');
	g.start(100, 100);
	g.move(103, 104);
	assert.equal(g.finish(103, 104), 'click', '5 px is still a click');
	g.start(100, 100);
	g.move(160, 100);
	g.move(100, 100);
	assert.equal(g.finish(100, 100), 'drag', 'out and back');
	assert.equal(g.active, false);
	g.start(100, 100);
	assert.equal(g.finish(100, 107), 'drag', 'the release position counts');
	g.start(100, 100);
	g.cancel();
	assert.equal(g.finish(100, 100), null);
	g.start(1, 1);
	assert.equal(g.finish(undefined, undefined), 'click', 'a release without coordinates keeps what was seen');
});

// ---------------------------------------------------------------------------------------------------------------------------
// 2. The GLSL skill runtime (SkillSystem + skills.js), fx stubbed

function stubSkillSystem({ targets = [] } = {}) {
	const s = Object.create(SkillSystem.prototype);
	const scene = new THREE.Group();
	const log = { cast: 0, face: 0, played: [], flashes: 0 };
	const handle = { stop() {}, release() {} };
	Object.assign(s, {
		host: {
			fxScene: scene,
			scene,
			camera: () => new THREE.PerspectiveCamera(),
			caster: { position: () => new THREE.Vector3(), hand: () => new THREE.Vector3(0, 1.1, 0), face: () => log.face++, onCast: () => log.cast++, teleport() {} },
			targets: () => targets,
			groundAt: () => 0,
			light: { flash: () => log.flashes++, hold: () => handle },
			shake() {},
		},
		fx: { attach: () => handle, play: (key) => (log.played.push(key), handle), place: () => handle, update() {}, clear() {} },
		bolts: { strike() {}, update() {}, clear() {}, bolts: [] },
		actors: new Set(),
		timers: [],
		cooldowns: {},
		toggles: {},
		casting: null,
		time: 0,
		casts: 0,
		level: 1,
	});
	return { s, log };
}

function fakeTarget(x, z) {
	const t = {
		alive: true,
		hits: [],
		position: () => new THREE.Vector3(x, 0, z),
		center: () => new THREE.Vector3(x, 1, z),
		hitTest: (p, pad = 0) => Math.hypot(p.x - x, p.z - z) < 0.45 + pad && p.y > -0.2 && p.y < 2,
		hit(amount, element) {
			t.hits.push({ amount, element });
		},
	};
	return t;
}

test('SkillSystem.canCast: ok -> casting during the charge -> cooldown -> ok again; an aura that is on can always switch off', () => {
	const { s, log } = stubSkillSystem();
	const aim = { point: new THREE.Vector3(0, 1, 5), ground: new THREE.Vector3(0, 0, 5), target: null };
	assert.equal(s.canCast('fireball'), null);
	assert.equal(s.canCast('nonsense'), 'unknown');
	assert.equal(s.cast('fireball', aim), true);
	assert.equal(log.cast, 1, 'the caster animation hook fired');
	assert.equal(s.canCast('fireball'), 'casting', 'the charge (0.25 s) blocks a second cast');
	assert.equal(s.cast('fireball', aim), false);
	s.update(0.3); // charge done: the projectile is out, the cooldown (0.45 s) runs
	assert.equal(s.canCast('fireball'), 'cooldown');
	s.update(0.5);
	assert.equal(s.canCast('fireball'), null);
	// aura toggles
	assert.equal(s.cast('holyfreeze', aim), true);
	s.update(0.01);
	assert.equal(s.isToggled('holyfreeze'), true);
	assert.equal(s.canCast('holyfreeze'), null, 'on: can switch off');
	assert.equal(s.cast('holyfreeze', aim), true);
	assert.equal(s.isToggled('holyfreeze'), false);
});

test('SkillSystem: Fireball flies to the target and burns it (28 fire at level 1) — a real cast, not an animation', () => {
	const target = fakeTarget(0, 4);
	const near = fakeTarget(0.9, 4.2);
	const { s, log } = stubSkillSystem({ targets: [target, near] });
	const aim = { point: target.center(), ground: target.position(), target };
	assert.equal(s.cast('fireball', aim), true);
	for (let i = 0; i < frames(1.5); i++) s.update(DT);
	assert.equal(target.hits.length, 1);
	assert.deepEqual(target.hits[0], { amount: 28, element: 'fire' });
	assert.ok(near.hits.length >= 1 && near.hits[0].amount < 28, 'splash on the neighbour');
	assert.ok(log.played.includes('fire.explode'));
	assert.equal(s.actors.size, 0, 'the projectile ended');
});

// ---------------------------------------------------------------------------------------------------------------------------
// 3. The gameplay Player: the right button through the real Input

function fakeModel() {
	const root = new THREE.Object3D();
	return {
		root,
		height: 1.8,
		radius: 0.38,
		onEvent: null,
		clipInfo: { cast: { duration: 0.5, impact: 0.25 }, attack1: { duration: 0.6, impact: 0.3 } },
		plays: [],
		play(name) {
			this.plays.push(name);
		},
		update() {},
		revive() {},
		flash() {},
		setTint() {},
		setFrozen() {},
		setHighlight() {},
		dispose() {},
	};
}

function resetWorld() {
	clearTimers();
	clearProjectiles();
	G.actors = [];
	G.projectiles = [];
	G.effects = [];
	G.time = 0;
	G.frame = 0;
	G.inTown = false;
	G.nav = { collide() {}, walkableAt: () => true, nearestWalkable: (x, z) => ({ x, z }), path: () => null };
	Engine.scene = new THREE.Group();
	Engine.offset.set(0, 0, 0);
	Engine.host.shake = () => {};
}

function makeMonster(x, z, life = 400) {
	const m = new Actor({ kind: 'monster', type: 'zombie', team: 1, model: fakeModel(), level: 3, life });
	m.pos.set(x, 0, z);
	m.name = 'Zombie';
	G.actors.push(m);
	return m;
}

/** A Sorceress with a recording skills adapter. `status` / `supports` are mutable through the returned handle. */
function makeHero({ skills, right = 'fireball', mana } = {}) {
	resetWorld();
	const casts = [];
	const adapter = skills || {
		kind: 'test',
		state: { status: null, supports: true },
		label: (id) => SKILLS[id]?.label || id,
		supports(id) { return this.state.supports; },
		status() { return this.state.status; },
		cost: () => 6,
		cast(id, point, target) {
			casts.push({ id, point: { x: point.x, z: point.z }, target });
			P.startAction('cast', 'cast', { lock: true });
			return true;
		},
	};
	const P = new Player(fakeModel(), { cls: 'sorceress', level: 5, ranged: false, reach: 1.9, right, skills: adapter });
	if (mana !== undefined) P.mana = mana;
	G.actors.push(P);
	G.player = P;
	const notices = [];
	P.onNotice = (text, kind, key) => notices.push({ text, kind, key });
	P.input = Input;
	Input.enabled = true;
	Input.release();
	return { P, adapter, casts, notices };
}

const canvas = fakeCanvas();
Input.init(canvas);

function step(P, seconds) {
	for (let i = 0; i < frames(seconds); i++) {
		G.time += DT;
		hash.rebuild(G.actors);
		tickTimers(DT);
		P.update(DT);
		updateProjectiles(DT);
		updateEffects(DT);
		Input.endFrame();
	}
}

function rightDown() {
	canvas.fire('pointerdown', { button: 2 });
}
function rightUp() {
	fireWindow('pointerup', { button: 2 });
}

test('right button on a monster casts the selected skill at it (hover target), spends mana, stops the move', () => {
	const { P, casts } = makeHero();
	const z = makeMonster(0, 6);
	Input.hover = { type: 'actor', ref: z };
	Input.ground.set(3, 0, 3);
	P.intent = { type: 'move', point: new THREE.Vector3(5, 0, 5), repath: 0 };
	const mana = P.mana;
	rightDown();
	rightUp();
	step(P, 0.1);
	assert.equal(casts.length, 1);
	assert.equal(casts[0].id, 'fireball');
	assert.equal(casts[0].target, z);
	assert.ok(Math.abs(P.mana - (mana - 6)) < 0.3, `mana ${mana} -> ${P.mana} (6 spent, a trickle regenerated)`);
	assert.equal(P.intent, null);
	assert.equal(P.model.plays.at(-1), 'cast');
});

test('right button on the ground casts at the ground point under the cursor', () => {
	const { P, casts } = makeHero({ right: 'blizzard' });
	Input.hover = null;
	Input.ground.set(4, 0, -2);
	rightDown();
	rightUp();
	step(P, 0.1);
	assert.equal(casts.length, 1);
	assert.deepEqual(casts[0].point, { x: 4, z: -2 });
	assert.equal(casts[0].target, null);
	assert.equal(casts[0].id, 'blizzard');
});

test('a click while the hero is mid-cast is buffered and fires when the cast ends; a hold repeats only between casts', () => {
	const { P, casts } = makeHero();
	Input.hover = null;
	Input.ground.set(0, 0, 5);
	rightDown();
	step(P, 0.02); // first cast starts: the cast action locks the hero for 0.5 s
	assert.equal(casts.length, 1);
	step(P, 0.3);
	assert.equal(casts.length, 1, 'no second cast through the running one');
	step(P, 0.4);
	assert.equal(casts.length, 2, 'held: casts again as soon as the first ended');
	rightUp();
	step(P, 1.5);
	assert.equal(casts.length, 2, 'released: nothing more');
});

test('a quick click during a long lock is dropped after the 0.3 s buffer, one during a short lock is kept', () => {
	const a = makeHero();
	Input.hover = null;
	Input.ground.set(0, 0, 5);
	a.P.startAction('attack', 'attack1', { lock: true, dur: 1.0 });
	rightDown();
	rightUp();
	step(a.P, 1.5);
	assert.equal(a.casts.length, 0, 'the swing outlasted the buffer');
	const b = makeHero();
	b.P.startAction('attack', 'attack1', { lock: true, dur: 0.2 });
	rightDown();
	rightUp();
	step(b.P, 1);
	assert.equal(b.casts.length, 1, 'the click waited for the swing and cast');
});

test('cooldown: a press says so once, a hold waits silently and casts the moment it is over', () => {
	const { P, adapter, casts, notices } = makeHero();
	Input.hover = null;
	Input.ground.set(0, 0, 5);
	adapter.state.status = 'cooldown';
	rightDown();
	step(P, 0.6);
	assert.equal(casts.length, 0);
	assert.equal(notices.filter((n) => /cooling/.test(n.text)).length, 1, 'one message, not one per frame');
	adapter.state.status = null;
	step(P, 0.05);
	assert.equal(casts.length, 1);
	rightUp();
});

test('no mana: nothing casts, the reason shows (rate-limited) while the button is held, and the cast comes back with the mana', () => {
	const { P, casts, notices } = makeHero({ mana: 0 });
	P.mana = 0;
	Input.hover = null;
	Input.ground.set(0, 0, 5);
	rightDown();
	step(P, 3);
	assert.equal(casts.length, 0);
	assert.equal(P.castFail, 'mana');
	const n = notices.filter((x) => /mana/i.test(x.text)).length;
	assert.ok(n >= 1 && n <= 3, `${n} mana messages in 3 s of holding`);
	P.mana = P.maxMana;
	step(P, 0.2);
	assert.equal(casts.length, 1);
	rightUp();
});

test('unsupported skill (renderer cannot run it) says so instead of a silent nothing; so does a Player without any skill runtime', () => {
	const a = makeHero({ right: 'bonespear' });
	a.adapter.state.supports = false;
	Input.hover = null;
	Input.ground.set(0, 0, 5);
	rightDown();
	rightUp();
	step(a.P, 0.2);
	assert.equal(a.casts.length, 0);
	assert.equal(a.P.castFail, 'unsupported');
	assert.ok(a.notices.some((n) => n.kind === 'error' && /not available/.test(n.text)), JSON.stringify(a.notices));
	const b = makeHero();
	b.P.skills = null;
	rightDown();
	rightUp();
	step(b.P, 0.2);
	assert.equal(b.P.castFail, 'unsupported');
	assert.ok(b.notices.length >= 1);
});

test('a dead hero casts nothing and a revive clears a held button', () => {
	const { P, casts } = makeHero();
	Input.hover = null;
	Input.ground.set(0, 0, 5);
	P.dead = true;
	rightDown();
	step(P, 0.3);
	assert.equal(casts.length, 0);
	P.dead = false;
	P.revive();
	assert.equal(P.castHold.active, false);
	rightUp();
});

test('quickcast: a hotkey-selected skill casts at the cursor through the same buffered press', () => {
	const { P, casts } = makeHero({ right: 'frozenorb' });
	Input.hover = null;
	Input.ground.set(1, 0, 6);
	P.quickcast();
	step(P, 0.1);
	assert.equal(casts.length, 1);
	assert.equal(casts[0].id, 'frozenorb');
});

test('Input ignores the canvas while disabled (no cast through a dead input)', () => {
	const { P, casts } = makeHero();
	Input.enabled = false;
	rightDown();
	step(P, 0.2);
	assert.equal(casts.length, 0);
	Input.enabled = true;
	rightUp();
});

test('Gameplay input F2: where a right drag turns the camera it never casts or spends mana; a click casts once on release', () => {
	const was = Input.rightRotates;
	Input.rightRotates = () => true;
	try {
		const { P, casts } = makeHero();
		Input.hover = null;
		Input.ground.set(2, 0, 5);
		const mana = P.mana;
		const move = (x, y) => fireWindow('pointermove', { clientX: x, clientY: y });
		// drag away
		canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		step(P, 0.1);
		assert.equal(casts.length, 0, 'nothing on press');
		move(450, 300);
		fireWindow('pointerup', { button: 2, clientX: 450, clientY: 300 });
		step(P, 1);
		assert.equal(casts.length, 0);
		// out and back to the start
		canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		move(480, 300);
		move(400, 300);
		fireWindow('pointerup', { button: 2, clientX: 400, clientY: 300 });
		step(P, 1);
		assert.equal(casts.length, 0, 'still a drag; no buffered cast either');
		assert.ok(P.mana >= mana, 'no mana spent');
		// pointer cancel and focus loss end the gesture
		for (const end of [() => fireWindow('pointercancel', {}), () => fireWindow('blur', {})]) {
			canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
			end();
			fireWindow('pointerup', { button: 2, clientX: 400, clientY: 300 });
			step(P, 0.6);
			assert.equal(casts.length, 0);
		}
		// a click casts exactly once, at the release position
		canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		move(402, 301);
		fireWindow('pointerup', { button: 2, clientX: 402, clientY: 301 });
		step(P, 1.5);
		assert.equal(casts.length, 1, 'one cast, no repeat');
		assert.ok(mana - P.mana > 3, 'mana spent once');
		// a gesture that started before the mode changed is dropped
		canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		Input.rightRotates = () => false;
		step(P, 0.05);
		fireWindow('pointerup', { button: 2, clientX: 400, clientY: 300 });
		step(P, 2);
		assert.equal(casts.length, 1, 'the camera mode changed under the press: no cast');
	} finally {
		Input.rightRotates = was;
		Input.release();
	}
});

test('Gameplay input F2: diablo / iso (no camera drag) still cast on press and repeat while held', () => {
	assert.equal(Input.rightRotates(), false);
	const { P, casts } = makeHero();
	Input.hover = null;
	Input.ground.set(2, 0, 5);
	rightDown();
	step(P, 0.2);
	assert.equal(casts.length, 1, 'on press');
	step(P, 1.5);
	assert.ok(casts.length >= 2, `${casts.length} casts while held`);
	rightUp();
	const n = casts.length;
	step(P, 1);
	assert.equal(casts.length, n);
});

// ---------------------------------------------------------------------------------------------------------------------------
// 4. The native skills (WebGPU · TSL has no three.quarks)

function nativeHero(extra = {}) {
	const skills = createNativeSkills();
	const hero = makeHero({ skills, ...extra });
	hero.P.pos.set(0, 0, 0);
	hero.P.facing = 0;
	return { ...hero, skills };
}

test('native: the Sorceress set casts, the rest says it needs WebGL2', () => {
	const { skills } = nativeHero();
	for (const id of ['fireball', 'frozenorb', 'chainlightning', 'meteor', 'blizzard', 'firewall', 'teleport']) assert.equal(skills.supports(id), true, id);
	for (const id of ['bonespear', 'bonespirit', 'poisonnova', 'blessedhammer', 'holyfreeze']) assert.equal(skills.supports(id), false, id);
	assert.deepEqual([...NATIVE_SKILLS].sort(), ['blizzard', 'chainlightning', 'fireball', 'firewall', 'frozenorb', 'meteor', 'teleport']);
	assert.equal(skills.cost('fireball'), Math.round(4 + SKILLS.fireball.cooldown * 5));
});

test('native Fireball through the right button: flies, hits the zombie for fire, splashes the one next to it, then cools down', () => {
	const { P, skills, notices } = nativeHero();
	const z = makeMonster(0, 5);
	const near = makeMonster(1.2, 5.3);
	const far = makeMonster(8, 5);
	Input.hover = { type: 'actor', ref: z };
	Input.ground.copy(z.pos);
	const mana = P.mana;
	rightDown();
	rightUp();
	step(P, 2);
	assert.ok(z.life < 400, 'the target took fire damage');
	assert.ok(near.life < 400 && near.life > z.life, 'splash is weaker than the direct hit');
	assert.equal(far.life, 400);
	assert.ok(mana - P.mana > 3, 'mana was spent');
	assert.equal(G.projectiles.length, 0, 'the projectile ended');
	assert.equal(Engine.scene.children.length, 0, 'no leftover meshes');
	assert.equal(notices.length, 0);
	// cooldown (0.45 s) after the cast, then free again
	assert.equal(skills.status('fireball'), null);
});

test('native skills: cooldown is reported, not silently swallowed', () => {
	const { P, skills, notices } = nativeHero();
	Input.hover = null;
	Input.ground.set(0, 0, 6);
	assert.equal(skills.cast('meteor', { x: 0, z: 6 }, null), true);
	assert.equal(skills.status('meteor'), 'cooldown');
	P.action = null;
	assert.equal(P.useSkill('meteor', { x: 0, z: 6 }, null), 'fail');
	assert.equal(P.castFail, 'cooldown');
	assert.ok(notices.some((n) => /cooling/.test(n.text)));
});

test('native Chain Lightning jumps from the target to the next in range (10 % weaker)', () => {
	const { P } = nativeHero({ right: 'chainlightning' });
	const a = makeMonster(0, 5);
	const b = makeMonster(3, 6);
	const c = makeMonster(20, 20);
	Input.hover = { type: 'actor', ref: a };
	Input.ground.copy(a.pos);
	rightDown();
	rightUp();
	step(P, 1.2);
	assert.ok(a.life < 400 && b.life < 400, 'both linked targets hurt');
	assert.ok(400 - b.life < 400 - a.life, 'the jump is weaker');
	assert.equal(c.life, 400, 'out of range untouched');
});

test('native Teleport moves the hero toward the point (12 m max) and refuses in town', () => {
	const { P, skills } = nativeHero({ right: 'teleport' });
	Input.hover = null;
	Input.ground.set(0, 0, 30);
	rightDown();
	rightUp();
	step(P, 0.8);
	assert.ok(Math.abs(P.pos.z - 12) < 0.2, `z=${P.pos.z}`);
	assert.equal(skills.status('teleport'), 'cooldown');
	// town
	const t = nativeHero({ right: 'teleport' });
	G.inTown = true;
	assert.equal(t.skills.status('teleport'), 'town');
	assert.equal(t.P.useSkill('teleport', { x: 0, z: 9 }, null), 'fail');
	assert.equal(t.P.castFail, 'town');
	G.inTown = false;
});

test('native Frozen Orb, Blizzard and Fire Wall damage what they should and clean up their meshes', () => {
	const frozen = nativeHero({ right: 'frozenorb' });
	const m1 = makeMonster(0, 5);
	Input.hover = { type: 'actor', ref: m1 };
	Input.ground.copy(m1.pos);
	rightDown();
	rightUp();
	step(frozen.P, 4);
	assert.ok(m1.life < 400, 'orb damage');
	assert.equal(Engine.scene.children.length, 0);

	const bliz = nativeHero({ right: 'blizzard' });
	const m2 = makeMonster(0, 6);
	Input.hover = null;
	Input.ground.set(0, 0, 6);
	rightDown();
	rightUp();
	step(bliz.P, 5.5);
	assert.ok(m2.life < 400 - 14, 'several blizzard ticks');
	assert.equal(Engine.scene.children.length, 0, 'the area ended and removed its meshes');

	const wall = nativeHero({ right: 'firewall' });
	const inWall = makeMonster(1.5, 6);
	const beside = makeMonster(0, 9);
	Input.ground.set(0, 0, 6);
	rightDown();
	rightUp();
	step(wall.P, 6);
	assert.ok(inWall.life < 400, 'standing in the wall burns');
	assert.equal(beside.life, 400, 'the wall is a line, not a disc');
	assert.equal(Engine.scene.children.length, 0);
});

test('native Meteor lands after its telegraph and burns the ground', () => {
	const { P } = nativeHero({ right: 'meteor' });
	const m = makeMonster(0, 7);
	Input.hover = null;
	Input.ground.set(0, 0, 7);
	rightDown();
	rightUp();
	step(P, 0.5);
	assert.equal(m.life, 400, 'still falling');
	step(P, 4);
	assert.ok(m.life <= 400 - 50, `landed (${m.life})`);
	assert.equal(Engine.scene.children.length, 0);
});

test('native Meteor F3: stopping mid-fall cancels it — no damage, shake, flash, burn or leaked mesh; stop twice is harmless; a natural landing still happens once', () => {
	let shakes = 0;
	const stopped = nativeHero({ right: 'meteor' });
	const m = makeMonster(0, 7);
	Engine.host.shake = () => shakes++;
	Input.hover = null;
	Input.ground.set(0, 0, 7);
	rightDown();
	rightUp();
	step(stopped.P, 0.5);
	assert.ok(G.effects.length > 0 && Engine.scene.children.length > 0, 'the telegraph and the rock are out');
	const mats = [];
	Engine.scene.traverse((o) => {
		if (!o.material) return;
		const rec = { disposed: 0 };
		const orig = o.material.dispose.bind(o.material);
		o.material.dispose = () => (rec.disposed++, orig());
		mats.push(rec);
	});
	clearProjectiles(); // GameplayHost.stop
	assert.equal(m.life, 400, 'no damage');
	assert.equal(shakes, 0, 'no shake');
	assert.equal(G.effects.length, 0, 'nothing spawned while clearing');
	assert.equal(Engine.scene.children.length, 0, 'no impact flash, no burn disc');
	assert.ok(mats.length >= 2 && mats.every((r) => r.disposed === 1), `every material disposed once (${mats.map((r) => r.disposed)})`);
	clearProjectiles();
	step(stopped.P, 5);
	assert.equal(m.life, 400);
	assert.equal(G.effects.length, 0);
	assert.equal(Engine.scene.children.length, 0);
	assert.equal(shakes, 0);

	// natural landing: the impact, the shake and the burn happen once each
	shakes = 0;
	const natural = nativeHero({ right: 'meteor' });
	const m2 = makeMonster(0, 7);
	Engine.host.shake = () => shakes++;
	Input.ground.set(0, 0, 7);
	rightDown();
	rightUp();
	step(natural.P, 1.5);
	assert.ok(m2.life <= 400 - 50, `landed (${m2.life})`);
	assert.equal(shakes, 1);
	assert.ok(G.effects.length > 0, 'the burn is running');
	step(natural.P, 4);
	assert.equal(G.effects.length, 0);
	assert.equal(Engine.scene.children.length, 0);
});

test('native Teleport F4: a cast with nowhere to go is refused up front — no mana, no cooldown, no cast, no turn — and says why; a real destination teleports', () => {
	const { P, skills, notices } = nativeHero({ right: 'teleport' });
	const walls = { collide() {}, walkableAt: () => false, nearestWalkable: () => null, path: () => null };
	const open = { collide() {}, walkableAt: () => true, nearestWalkable: (x, z) => ({ x, z }), path: () => null };
	G.nav = walls;
	Input.hover = null;
	Input.ground.set(6, 0, 10);
	const mana = P.mana;
	const plays = P.model.plays.length;
	P.facing = 0;
	rightDown();
	rightUp();
	step(P, 1);
	assert.equal(P.pos.z, 0);
	assert.ok(P.mana >= mana, 'no mana spent');
	assert.equal(skills.status('teleport'), null, 'no cooldown');
	assert.equal(P.model.plays.length, plays, 'no cast animation');
	assert.equal(P.facing, 0, 'did not turn');
	assert.equal(P.action, null);
	assert.equal(P.castFail, 'nodest');
	assert.ok(notices.some((n) => /Nowhere to teleport/.test(n.text)), 'the reason reaches the player');
	assert.equal(P.useSkill('teleport', { x: 0, z: 9 }, null), 'fail');

	// a destination appears: it works and is charged
	G.nav = open;
	P.notice.reset();
	Input.ground.set(0, 0, 10);
	rightDown();
	rightUp();
	step(P, 0.8);
	assert.ok(Math.abs(P.pos.z - 10) < 0.2, `z=${P.pos.z}`);
	assert.ok(mana - P.mana > 3, 'mana spent');
	assert.equal(skills.status('teleport'), 'cooldown');

	// the map changes between accepting the cast and its release: nothing moves, the player is told
	const late = nativeHero({ right: 'teleport' });
	G.nav = open;
	Input.ground.set(0, 0, 8);
	rightDown();
	rightUp();
	step(late.P, 0.1);
	G.nav = walls;
	step(late.P, 0.8);
	assert.equal(late.P.pos.z, 0, 'revalidated at the release: blocked');
	assert.ok(late.notices.some((n) => /Nowhere to teleport/.test(n.text)));
});

// ---------------------------------------------------------------------------------------------------------------------------
// 5. GameplayHost: hotkeys, quickcast, input guards, honest labels

function makeApp({ language = 'GLSL', stored = null } = {}) {
	const handlers = new Map();
	if (stored) globalThis.localStorage = { getItem: () => JSON.stringify(stored), setItem() {} };
	const settings = new Settings();
	globalThis.localStorage = { getItem: () => null, setItem() {} };
	settings.changed = () => {};
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(50, 800 / 600, 0.1, 500);
	camera.position.set(0, 10, 10);
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld(true);
	const anchor = new THREE.Object3D();
	scene.add(anchor);
	const root = new THREE.Group();
	scene.add(root);
	const cv = fakeCanvas();
	const app = {
		settings,
		backend: { canvas: cv, language, kind: language === 'GLSL' ? 'webgl' : 'webgpu', effects: {}, vfx: {}, prepareObject() {}, pipeline: null },
		dom: { viewport: fakeEl(), castbar: fakeEl(), panel: fakeEl(), tabs: fakeEl() },
		subject: { clips: [], model: null, root, pivot: new THREE.Group(), turntable: false, name: 'sorceress', sourceId: 'd2r-sorceress', mixer: null, procedural: null },
		world: { scene, camera, vfxScene: new THREE.Scene() },
		current: { scene, anchor, id: 'test' },
		rig: { state: () => ({}), follow: null, setMode() {}, restore() {}, camera, controls: { target: new THREE.Vector3(), update() {}, mouseButtons: {} }, orbitBy() {}, zoom() {} },
		on(type, fn) {
			if (!handlers.has(type)) handlers.set(type, []);
			handlers.get(type).push(fn);
		},
		emit(type, ...a) {
			(handlers.get(type) || []).forEach((fn) => fn(...a));
		},
		consumedClick: false,
	};
	return app;
}

function makeHost({ language = 'GLSL' } = {}) {
	const app = makeApp({ language });
	const host = new GameplayHost(app);
	app.gameplay = host;
	return { app, host };
}

test('GameplayHost hotkeys (classic): F1–F8 pick the right-button skill, digits drink potions; typing and Ctrl never trigger', () => {
	const { host } = makeHost({ language: 'TSL' });
	const { P } = makeHero({ skills: host.ensureSkills() });
	host.player = P;
	host.active = true;
	host.belt = [{ kind: 'life', count: 2 }, { kind: 'mana', count: 2 }, { kind: 'rejuv', count: 1 }, { kind: 'portal', count: 1 }];
	const key = (code, extra = {}) => ({ code, key: code, repeat: false, target: fakeEl(), ctrlKey: false, metaKey: false, altKey: false, ...extra });
	assert.equal(host.onKey(key('F3')), true);
	assert.equal(host.settings.right, SKILL_ORDER[2]);
	assert.equal(P.right, SKILL_ORDER[2]);
	P.life = 1;
	assert.equal(host.onKey(key('Digit1')), true);
	assert.equal(host.belt[0].count, 1, 'Digit1 drinks potion 1 in the classic scheme');
	assert.ok(P.life > 1);
	assert.equal(host.onKey(key('KeyQ')), false, 'Q is not bound in classic');
	// guards
	const typing = fakeEl();
	typing.closest = () => ({});
	assert.equal(host.onKey(key('F2', { target: typing })), false);
	assert.equal(host.settings.right, SKILL_ORDER[2], 'typing in a field did not change the skill');
	assert.equal(host.onKey(key('F2', { ctrlKey: true })), false);
	assert.equal(host.settings.right, SKILL_ORDER[2], 'Ctrl+F2 stays the browser’s');
	// the lab's own shortcuts stay out of the game's keys
	assert.equal(host.claimsKey({ code: 'F2' }), true);
	assert.equal(host.claimsKey({ code: 'KeyX' }), false);
});

test('GameplayHost hotkeys (modern): 1–4 pick skills, Q E Z X drink; quickcast also casts at the cursor', () => {
	const { host } = makeHost({ language: 'TSL' });
	host.setKeys('modern');
	const adapter = host.ensureSkills();
	const { P } = makeHero({ skills: adapter });
	host.player = P;
	host.active = true;
	host.belt = [{ kind: 'life', count: 2 }, { kind: 'mana', count: 2 }, { kind: 'rejuv', count: 1 }, { kind: 'portal', count: 1 }];
	const key = (code, extra = {}) => ({ code, key: code, repeat: false, target: fakeEl(), ctrlKey: false, metaKey: false, altKey: false, ...extra });
	assert.equal(host.onKey(key('Digit2')), true);
	assert.equal(host.settings.right, SKILL_ORDER[1]);
	assert.equal(host.onKey(key('F2')), false, 'F-keys are not bound in modern');
	P.mana = 1;
	assert.equal(host.onKey(key('KeyE')), true);
	assert.equal(host.belt[1].count, 1, 'E = potion 2 (mana)');
	assert.ok(P.mana > 1);
	assert.equal(host.claimsKey({ code: 'KeyX' }), true, 'X belongs to the game now, not to the false-colour shortcut');
	// auto-repeat of a held key does nothing
	const count = host.belt[1].count;
	host.onKey(key('KeyE', { repeat: true }));
	assert.equal(host.belt[1].count, count);
	// quickcast
	host.settings.quickcast = true;
	Input.hover = null;
	Input.ground.set(0, 0, 6);
	P.mana = P.maxMana;
	host.onKey(key('Digit1')); // fireball
	step(P, 0.1);
	assert.equal(G.player.right, 'fireball');
	assert.ok(P.mana < P.maxMana, 'the quickcast spent mana: the skill really cast');
	assert.ok(P.action || P.model.plays.includes('cast'), 'and played the cast animation');
	// not active: the game claims nothing
	host.active = false;
	assert.equal(host.claimsKey({ code: 'KeyX' }), false);
	assert.equal(host.onKey(key('Digit1')), false);
});

test('GameplayHost on WebGPU: the Sorceress set casts through the native fallback, other skills are named unavailable (never a silent no-op)', () => {
	const { host } = makeHost({ language: 'TSL' });
	const adapter = host.ensureSkills();
	assert.equal(adapter.kind, 'native');
	assert.equal(host.supportsSkill('fireball'), true);
	assert.equal(host.supportsSkill('bonespear'), false);
	host.player = { right: 'fireball' };
	assert.match(host.skillLabel(), /Fireball/);
	assert.match(host.skillLabel(), /simple mesh effects/);
	host.player.right = 'bonespear';
	assert.match(host.skillLabel(), /needs the WebGL2/);
	host.player = null;
});

test('GameplayHost: the VFX lab refuses to arm while a session runs', async () => {
	const { app, host } = makeHost({ language: 'TSL' });
	const lab = new VfxLab(app);
	app.vfxLab = lab;
	host.active = true;
	lab.arm(true, { quiet: true });
	assert.equal(lab.armed, false);
	host.active = false;
});

// ---------------------------------------------------------------------------------------------------------------------------
// 6. Character controller + VFX lab (Play without gameplay): the right button / Q really cast

function fakeDummy(x, z) {
	const root = new THREE.Object3D();
	root.position.set(x, 0, z);
	return {
		alive: true,
		root,
		center(out = new THREE.Vector3()) {
			return out.set(x, 1, z);
		},
	};
}

/** Controller + lab around the fake app. `armed: false` is an old session: the lab was never armed. */
function makeLab({ language = 'GLSL', castMode = 'spells', targets = true, armed = false, camera = 'diablo' } = {}) {
	const app = makeApp({ language });
	const lab = new VfxLab(app);
	app.vfxLab = lab;
	lab.settings.castMode = castMode;
	lab.settings.selected = SPELL_ORDER[0];
	const armCalls = [];
	// The real arm() builds a particle system and 4 lights from the renderer; here it only has to flip the state.
	lab.arm = function (on = true, opts) {
		armCalls.push(on);
		if (on && this.gameplayActive) return;
		this.armed = on;
		this.settings.armed = on;
	};
	if (armed) lab.armed = true;
	const spellCasts = [];
	const orig = {};
	for (const name of SPELL_ORDER) {
		orig[name] = SPELLS[name].cast;
		SPELLS[name].cast = (ctx) => spellCasts.push({ name, to: ctx.to.clone(), ground: ctx.ground.clone(), dummy: ctx.target });
	}
	const ctrl = new CharacterController(app);
	app.character = ctrl;
	ctrl.settings.camera = camera;
	ctrl.settings.targets = targets;
	ctrl.settings.gamepad = false;
	// A model and the animator parts the update needs.
	app.subject.model = new THREE.Group();
	app.subject.root.add(app.subject.model);
	ctrl.height = 1.75;
	ctrl.animator.update = () => {};
	ctrl.animator.attach = () => {};
	ctrl.cutaway.update = () => {};
	ctrl.foot.update = () => {};
	ctrl.equipment.update = () => {};
	const anim = { busy: false, dead: false, triggers: [], trigger: null };
	Object.defineProperty(ctrl.animator, 'busy', { get: () => anim.busy });
	Object.defineProperty(ctrl.animator, 'dead', { get: () => anim.dead });
	ctrl.animator.trigger = (state) => {
		anim.triggers.push(state);
		return true;
	};
	ctrl.animator.current = () => 'idle';
	ctrl.active = true;
	ctrl.groundY = 0;
	ctrl.pointer = { x: 400, y: 300 };
	const restore = () => {
		for (const name of SPELL_ORDER) SPELLS[name].cast = orig[name];
	};
	return { app, lab, ctrl, armCalls, spellCasts, anim, restore, canvas: app.backend.canvas };
}

const run = (ctrl, seconds) => {
	for (let i = 0; i < frames(seconds); i++) ctrl.update(DT);
};

test('Play (controller): right button casts the selected spell at the cursor — on a fresh/old session where the lab was never armed', () => {
	const t = makeLab({ armed: false });
	try {
		assert.equal(t.lab.armed, false);
		t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		fireWindow('pointerup', { button: 2 });
		run(t.ctrl, 0.1);
		assert.deepEqual(t.armCalls, [true], 'the cast armed the lab by itself (no VFX tab needed)');
		assert.equal(t.spellCasts.length, 1);
		assert.equal(t.spellCasts[0].name, SPELL_ORDER[0]);
		assert.ok(t.spellCasts[0].ground.length() < 3, 'aimed at the ground under the cursor (screen centre)');
		assert.deepEqual(t.anim.triggers, ['cast'], 'and the cast clip played');
		assert.equal(t.lab.casts, 1);
	} finally {
		t.restore();
	}
});

test('Play (controller): the lab’s own contextmenu handler stays out while Play owns the right button (one cast per click)', () => {
	const t = makeLab({ armed: true });
	try {
		t.canvas.fire('pointerdown', { button: 2 });
		const ctx = t.canvas.fire('contextmenu', { button: 2 });
		assert.equal(ctx.prevented, true, 'the browser menu is suppressed');
		fireWindow('pointerup', { button: 2 });
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1, 'not two (controller + lab)');
	} finally {
		t.restore();
	}
});

test('Play (controller): holding the right button repeats at the cast pace (not every frame); busy casts wait; release stops', () => {
	const t = makeLab({ armed: true });
	try {
		t.canvas.fire('pointerdown', { button: 2 });
		run(t.ctrl, 0.2);
		assert.equal(t.spellCasts.length, 1);
		t.anim.busy = true; // the cast clip is playing
		run(t.ctrl, 1);
		assert.equal(t.spellCasts.length, 1, 'no cast through the running clip');
		t.anim.busy = false;
		run(t.ctrl, 1);
		assert.ok(t.spellCasts.length >= 2 && t.spellCasts.length <= 4, `${t.spellCasts.length} casts after the clip ended (one per ~0.45 s)`);
		fireWindow('pointerup', { button: 2 });
		const n = t.spellCasts.length;
		run(t.ctrl, 1);
		assert.equal(t.spellCasts.length, n);
	} finally {
		t.restore();
	}
});

test('Play (controller): orbit camera — a right drag rotates (no cast), a plain click casts on release', () => {
	const t = makeLab({ armed: true, camera: 'orbit' });
	try {
		t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 0, 'nothing on press');
		t.canvas.fire('pointermove', { clientX: 460, clientY: 300 });
		t.canvas.fire('contextmenu', { button: 2, clientX: 460, clientY: 300 });
		fireWindow('pointerup', { button: 2, clientX: 460, clientY: 300 });
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 0, 'dragged: camera rotation, no cast');
		t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		t.canvas.fire('contextmenu', { button: 2, clientX: 401, clientY: 300 });
		fireWindow('pointerup', { button: 2, clientX: 401, clientY: 300 });
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1);
	} finally {
		t.restore();
	}
});

const rotateCases = [
	['orbit', 'orbit', undefined],
	['chase', 'chase', undefined],
	['diablo with a rotating right-button binding', 'diablo', { RIGHT: 0 }],
];
for (const [label, camera, buttons] of rotateCases) {
	test(`Play (controller) F1: ${label} — RMB drag never casts, a drag back to the start is still a drag, a click casts once on release`, () => {
		const t = makeLab({ armed: true, camera });
		try {
			if (buttons) t.app.rig.controls.mouseButtons = buttons;
			assert.equal(t.ctrl.rightRotates(), true);
			const casts0 = t.lab.casts;
			// drag away and release
			t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
			t.canvas.fire('pointermove', { clientX: 440, clientY: 320 });
			fireWindow('pointerup', { button: 2, clientX: 440, clientY: 320 });
			run(t.ctrl, 0.6);
			assert.equal(t.spellCasts.length, 0);
			// out and back to exactly the start: still a drag
			t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
			t.canvas.fire('pointermove', { clientX: 470, clientY: 300 });
			t.canvas.fire('pointermove', { clientX: 400, clientY: 300 });
			t.canvas.fire('contextmenu', { button: 2, clientX: 400, clientY: 300 });
			fireWindow('pointerup', { button: 2, clientX: 400, clientY: 300 });
			run(t.ctrl, 0.6);
			assert.equal(t.spellCasts.length, 0, 'no cast after a drag, nor one buffered for later');
			assert.equal(t.lab.casts, casts0);
			// a click (a 2 px wobble) casts exactly once, on release, and the menu event adds nothing
			t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
			t.canvas.fire('pointermove', { clientX: 402, clientY: 301 });
			run(t.ctrl, 0.3);
			assert.equal(t.spellCasts.length, 0, 'not on press');
			t.canvas.fire('contextmenu', { button: 2, clientX: 402, clientY: 301 });
			fireWindow('pointerup', { button: 2, clientX: 402, clientY: 301 });
			run(t.ctrl, 1);
			assert.equal(t.spellCasts.length, 1, 'one cast, no repeat after the release');
		} finally {
			t.restore();
		}
	});
}

test('Play (controller) F1: pointer cancel, focus loss and a camera change end a rotate-mode gesture without a cast; diablo / iso still cast on press and repeat while held', () => {
	const t = makeLab({ armed: true, camera: 'chase' });
	try {
		for (const end of [() => fireWindow('pointercancel', {}), () => fireWindow('blur', {}), () => t.ctrl.setCamera('chase')]) {
			t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
			end();
			fireWindow('pointerup', { button: 2, clientX: 400, clientY: 300 });
			run(t.ctrl, 0.6);
			assert.equal(t.spellCasts.length, 0);
		}
		for (const camera of ['diablo', 'iso']) {
			const before = t.spellCasts.length;
			t.ctrl.setCamera(camera);
			assert.equal(t.ctrl.rightRotates(), false, camera);
			t.canvas.fire('pointerdown', { button: 2 });
			run(t.ctrl, 0.2);
			assert.equal(t.spellCasts.length - before, 1, `${camera}: casts on press`);
			run(t.ctrl, 1);
			assert.ok(t.spellCasts.length - before >= 2, `${camera}: repeats while held`);
			fireWindow('pointerup', { button: 2 });
			const n = t.spellCasts.length;
			run(t.ctrl, 1);
			assert.equal(t.spellCasts.length, n, `${camera}: stops on release`);
		}
	} finally {
		t.restore();
	}
});

test('Play (controller): Q casts, a held Q repeats, typing in a field does not, a dead hero casts nothing and says so', () => {
	const t = makeLab({ armed: true });
	try {
		const key = (k, extra = {}) => ({ key: k, repeat: false, target: fakeEl(), ctrlKey: false, metaKey: false, altKey: false, preventDefault() {}, ...extra });
		const typing = fakeEl();
		typing.closest = () => ({});
		fireWindow('keydown', key('q', { target: typing }));
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 0, 'typing Q in a text field is not a cast');
		fireWindow('keydown', key('q'));
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1);
		fireWindow('keyup', key('q'));
		run(t.ctrl, 1);
		assert.equal(t.spellCasts.length, 1);
		fireWindow('keydown', key('q', { ctrlKey: true }));
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1, 'Ctrl+Q is the browser’s');
		t.anim.dead = true;
		fireWindow('keydown', key('q'));
		run(t.ctrl, 0.5);
		assert.equal(t.spellCasts.length, 1, 'dead: no cast');
	} finally {
		t.restore();
	}
});

test('Play (controller): losing focus releases a held cast; leaving Play clears it', () => {
	const t = makeLab({ armed: true });
	try {
		t.canvas.fire('pointerdown', { button: 2 });
		fireWindow('blur', {});
		const n0 = t.spellCasts.length;
		run(t.ctrl, 1);
		assert.ok(t.spellCasts.length - n0 <= 1, 'at most the already-buffered press');
		t.canvas.fire('pointerdown', { button: 2 });
		t.ctrl.setActive(false, { quiet: true });
		assert.equal(t.ctrl.castHold.active, false);
	} finally {
		t.restore();
	}
});

test('Play (controller): a click on a dummy aims the spell at the dummy', () => {
	const t = makeLab({ armed: true });
	try {
		const d = fakeDummy(0, 0);
		t.lab.dummies = [d];
		// pick() ray-tests dummy roots; give it a mesh at the screen centre
		const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2), new THREE.MeshBasicMaterial());
		mesh.userData.dummy = d;
		d.root.add(mesh);
		d.root.updateMatrixWorld(true);
		t.canvas.fire('pointerdown', { button: 2, clientX: 400, clientY: 300 });
		fireWindow('pointerup', { button: 2 });
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1);
		assert.equal(t.spellCasts[0].dummy, d, 'the spell receives the dummy as ctx.target');
		assert.equal(t.lab.cursor.dummy, d, 'the lab cursor was aimed at the dummy');
	} finally {
		t.restore();
	}
});

test('Play: with "training dummies as targets" off the lab still arms on the first cast, without dummies', () => {
	const t = makeLab({ armed: false, targets: false });
	try {
		assert.equal(t.lab.dummyCount(), 0);
		t.ctrl.castAtCursor();
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1);
		assert.deepEqual(t.armCalls, [true]);
	} finally {
		t.restore();
	}
});

test('Play: digits pick + cast, even when the lab was not armed yet; typed digits never do', () => {
	const t = makeLab({ armed: false });
	try {
		t.app.emit('key', '3', {});
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1);
		assert.equal(t.spellCasts[0].name, SPELL_ORDER[2]);
		assert.equal(t.lab.settings.selected, SPELL_ORDER[2], 'the digit also selected it for the right button');
		t.ctrl.active = false;
		t.lab.armed = false;
		t.app.emit('key', '4', {});
		assert.equal(t.spellCasts.length, 1, 'not playing and not armed: ignored');
	} finally {
		t.restore();
	}
});

test('Play F5: a digit is a buffered cast — it picks the spell, waits for a busy hero, and is dropped when the hero stays busy; outside Play it still previews at once', () => {
	const t = makeLab({ armed: true });
	try {
		t.anim.busy = true; // mid-action
		t.app.emit('key', '3', {});
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 0, 'not cast over the running clip');
		assert.equal(t.lab.settings.selected, SPELL_ORDER[2], 'but the spell is picked');
		t.anim.busy = false;
		run(t.ctrl, 0.1);
		assert.equal(t.spellCasts.length, 1, 'cast when the hero is free');
		assert.equal(t.spellCasts[0].name, SPELL_ORDER[2]);
		run(t.ctrl, 1);
		assert.equal(t.spellCasts.length, 1, 'once: a digit does not repeat');
		// busy for longer than the 0.3 s buffer: dropped
		t.anim.busy = true;
		t.app.emit('key', '4', {});
		run(t.ctrl, 0.8);
		t.anim.busy = false;
		run(t.ctrl, 0.5);
		assert.equal(t.spellCasts.length, 1);
		assert.equal(t.lab.settings.selected, SPELL_ORDER[3]);
		// a dead hero says so and picks nothing
		t.anim.dead = true;
		t.app.emit('key', '5', {});
		run(t.ctrl, 0.3);
		assert.equal(t.spellCasts.length, 1);
		assert.equal(t.lab.settings.selected, SPELL_ORDER[3]);
		t.anim.dead = false;
		// a held Q is not released by a digit
		t.ctrl.pressCast('key');
		t.app.emit('key', '6', {});
		assert.equal(t.ctrl.castHold.sources.has('key'), true);
		t.ctrl.castHold.clear();
		// not playing, lab armed: the VFX tab's preview casts at once
		t.ctrl.active = false;
		const before = t.spellCasts.length;
		t.app.emit('key', '2', {});
		assert.equal(t.spellCasts.length, before + 1);
		assert.equal(t.spellCasts.at(-1).name, SPELL_ORDER[1]);
	} finally {
		t.restore();
	}
});

test('VFX lab on WebGPU: skills mode falls back to the selected lab spell and tells the user once (no silent nothing)', () => {
	const t = makeLab({ language: 'TSL', castMode: 'skills', armed: true });
	try {
		const plan = t.lab.castPlan();
		assert.equal(plan.kind, 'spell');
		assert.equal(plan.substituted, true);
		const r = t.lab.castSelected();
		assert.equal(r.ok, true);
		assert.equal(t.spellCasts.length, 1);
		assert.equal(t.lab.notedSubstitute, true);
		t.lab.castSelected();
		assert.equal(t.spellCasts.length, 2);
	} finally {
		t.restore();
	}
});

test('VFX lab on WebGL: skills mode casts the selected skill; the cooldown is reported and the cast is refused', () => {
	const t = makeLab({ language: 'GLSL', castMode: 'skills', armed: true });
	try {
		t.lab.settings.skill = 'fireball';
		const { s, log } = stubSkillSystem({ targets: [] });
		t.lab.skills = s;
		t.lab.ensureSkills = () => s;
		const said = [];
		t.lab.notice = new Notice((text) => said.push(text), { clock: () => 0 });
		assert.equal(t.lab.castPlan().kind, 'skill');
		let r = t.lab.castSelected();
		assert.equal(r.ok, true);
		assert.equal(log.cast, 1);
		r = t.lab.castSelected();
		assert.equal(r.ok, false);
		assert.equal(r.reason, 'casting');
		assert.ok(said.some((x) => /Still casting/.test(x)));
		s.update(0.3);
		r = t.lab.castSelected({ quiet: true });
		assert.equal(r.reason, 'cooldown');
		assert.equal(said.filter((x) => /cooling/.test(x)).length, 0, 'quiet (a held button) does not talk');
		r = t.lab.castSelected();
		assert.equal(said.filter((x) => /cooling/.test(x)).length, 1);
	} finally {
		t.restore();
	}
});

test('VFX lab aim: the controller pick wins, then the cursor ray, then straight ahead of the caster (never "point at the ground")', () => {
	const t = makeLab({ armed: true });
	try {
		const lab = t.lab;
		lab.pointer = null;
		lab.cursor.valid = false;
		t.ctrl.facing = Math.PI / 2; // facing +X
		lab.ensureAim();
		assert.equal(lab.cursor.valid, true);
		assert.ok(lab.cursor.point.x > 5 && Math.abs(lab.cursor.point.z) < 1e-6, `forward aim ${lab.cursor.point.toArray()}`);
		lab.aimAt(new THREE.Vector3(3, 0, 4));
		lab.pointer = { x: 10, y: 10 }; // would otherwise re-raycast somewhere else
		lab.ensureAim();
		assert.deepEqual(lab.cursor.point.toArray(), [3, 0, 4], 'a fresh controller aim is not overwritten by the pointer ray');
		lab.ensureAim();
		assert.notDeepEqual(lab.cursor.point.toArray(), [3, 0, 4], 'consumed: the next cast uses the cursor ray');
	} finally {
		t.restore();
	}
});

test('Gameplay and the lab controller never run together', () => {
	const t = makeLab({ armed: false });
	try {
		t.ctrl.active = false;
		t.app.gameplay = { active: true };
		t.ctrl.setActive(true, { quiet: true });
		assert.equal(t.ctrl.active, false, 'the controller will not start under a running game');
		t.app.gameplay = { active: false };
	} finally {
		t.restore();
	}
});

// keep the registered-defaults import honest (castMode / skill defaults exist for fresh sessions)
test('fresh-session defaults: lab not armed, spells mode, nothing persisted that blocks a first cast', () => {
	const app = makeApp();
	const lab = new VfxLab(app);
	assert.equal(lab.armed, false);
	assert.equal(lab.settings.castMode, 'spells');
	assert.equal(lab.settings.armed, false);
	assert.ok(SPELLS[lab.settings.selected], 'the default selected spell exists');
	assert.ok(SKILLS[lab.settings.skill], 'the default selected skill exists');
	assert.equal(typeof registerDefaults, 'function');
});

// Cast input shared by both Play cores (the Character controller with the VFX lab, and the Ashen Crown v1 gameplay):
// key schemes, the gate that decides whether a cast may start (and why not), the hold / buffered-press state and a
// rate-limited notice so a held button never floods the screen. Pure logic (no DOM, no three) so it runs in node tests.
//
// Semantics follow the Ashen Crown controls: a hotkey selects the right-button skill, the right button queues the
// skill at the monster / ground under the cursor and repeats while held (never while a cast is running), typing in a
// field never casts. The lab adds "quickcast": the hotkey also casts at once.

/** Hotkeys by scheme. `skills` are KeyboardEvent.code values in slot order, `potions` the belt slots. */
export const KEY_SCHEMES = {
	classic: {
		label: 'Classic: F1–F8 skills, 1–4 potions',
		skills: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'],
		potions: ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
	},
	modern: {
		label: 'Modern: 1–4 skills, Q E Z X potions',
		skills: ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
		potions: ['KeyQ', 'KeyE', 'KeyZ', 'KeyX'],
	},
};
export const DEFAULT_SCHEME = 'classic';

/** What a key does in a scheme: { kind: 'skill' | 'potion', slot } or null. */
export function resolveKey(scheme, code) {
	const s = KEY_SCHEMES[scheme] || KEY_SCHEMES[DEFAULT_SCHEME];
	let slot = s.skills.indexOf(code);
	if (slot >= 0) return { kind: 'skill', slot };
	slot = s.potions.indexOf(code);
	if (slot >= 0) return { kind: 'potion', slot };
	return null;
}

/** Short label of a key code for the HUD: F1 -> F1, Digit2 -> 2, KeyQ -> Q. */
export function keyLabel(code) {
	return String(code || '').replace(/^Digit/, '').replace(/^Key/, '');
}

/** Typing in a field (or a select) never casts, and neither does a browser shortcut (Ctrl+1, Ctrl+F5…). */
export function isTypingTarget(target) {
	if (!target) return false;
	if (target.isContentEditable) return true;
	return !!target.closest?.('input, select, textarea, [contenteditable=""], [contenteditable="true"]');
}
export function hasShortcutModifier(e) {
	return !!(e && (e.ctrlKey || e.metaKey || e.altKey));
}

// ---------------------------------------------------------------------------------------------------------------------
// The gate

/** Reasons that clear on their own within a moment: a held button waits through them, a fresh press is buffered. */
export const TRANSIENT = new Set(['busy', 'casting', 'cooldown']);

export const REASONS = {
	unsupported: 'unsupported',
	dead: 'dead',
	busy: 'busy',
	casting: 'casting',
	cooldown: 'cooldown',
	mana: 'mana',
	noaim: 'noaim',
	nodest: 'nodest',
};

/**
 * Why a cast cannot start now (null = it can). Order matters: what can never work first, then the moments that pass.
 * state = { supported, dead, locked, casting, cooling, mana, cost, toggledOn }
 */
export function gateCast(state) {
	if (state.supported === false) return REASONS.unsupported;
	if (state.dead) return REASONS.dead;
	if (state.toggledOn) return null; // an aura switches off whatever the cooldown says
	if (state.locked) return REASONS.busy;
	if (state.casting) return REASONS.casting;
	if (state.cooling) return REASONS.cooldown;
	if (state.cost > 0 && state.mana < state.cost) return REASONS.mana;
	return null;
}

export function castMessage(reason, name = 'Skill') {
	switch (reason) {
		case REASONS.unsupported: return `${name} is not available in this renderer`;
		case REASONS.dead: return 'You are dead — revive first';
		case REASONS.busy: return 'Busy';
		case REASONS.casting: return 'Still casting';
		case REASONS.cooldown: return `${name} is cooling down`;
		case REASONS.mana: return 'Not enough mana';
		case REASONS.noaim: return 'Nothing to aim at';
		case REASONS.nodest: return 'Nowhere to teleport';
		case 'town': return 'You cannot do that in town';
		default: return `${name} could not be cast`;
	}
}

/** Same message at most once per `interval` seconds (a different message always shows at once). */
export class Notice {
	constructor(emit, { interval = 1.2, clock = () => performance.now() / 1000 } = {}) {
		this.emit = emit;
		this.interval = interval;
		this.clock = clock;
		this.last = new Map();
	}

	say(key, text, kind = 'info') {
		const now = this.clock();
		const at = this.last.get(key);
		if (at !== undefined && now - at < this.interval) return false;
		this.last.set(key, now);
		this.emit(text, kind, key);
		return true;
	}

	reset() {
		this.last.clear();
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Hold + buffered press

/**
 * The right button (or a held cast key): a press is tried at the next frame and, when the hero is busy or the skill is
 * cooling, kept for `buffer` seconds so a click a moment too early is not lost; while held it repeats at most every
 * `gap` seconds, silently through transient reasons.
 */
export class CastHold {
	constructor({ buffer = 0.3, gap = 0.1 } = {}) {
		this.buffer = buffer;
		this.gap = gap;
		this.sources = new Set();
		this.pending = 0;
		this.wait = 0;
		this.fresh = false;
	}

	get held() {
		return this.sources.size > 0;
	}

	get active() {
		return this.held || this.pending > 0;
	}

	press(source) {
		this.sources.add(source);
		this.pending = this.buffer;
		this.fresh = true;
	}

	release(source) {
		this.sources.delete(source);
	}

	clear() {
		this.sources.clear();
		this.pending = 0;
		this.wait = 0;
		this.fresh = false;
	}

	/**
	 * Call every frame. `attempt({ fresh })` tries the cast and returns { ok, reason }; returns that result when an
	 * attempt was made, else null.
	 */
	step(dt, attempt) {
		this.wait = Math.max(0, this.wait - dt);
		if (!this.held && this.pending <= 0) return null;
		if (this.wait > 0) {
			if (!this.held) this.pending -= dt;
			return null;
		}
		const result = attempt({ fresh: this.fresh }) || { ok: false, reason: null };
		if (result.ok) {
			this.pending = 0;
			this.fresh = false;
			this.wait = this.gap;
		} else if (result.reason && !TRANSIENT.has(result.reason)) {
			// Never going to work right now (no mana, dead, unsupported): report once, keep trying only while held.
			this.pending = 0;
			this.fresh = false;
			this.wait = this.gap;
		} else if (!this.held) {
			this.pending -= dt;
		}
		return result;
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Right button vs camera drag

const MOUSE_ROTATE = 0; // THREE.MOUSE.ROTATE (this module stays free of three)

/**
 * Does a right drag turn the camera? Then the button cannot cast on press: a click casts on release, a drag only rotates.
 * The real binding of the camera controls wins ({ mouseButtons.RIGHT }); without one the mode decides (orbit and chase rotate).
 */
export function rightRotatesCamera(cameraId, controls = null) {
	const b = controls?.mouseButtons;
	if (b && 'RIGHT' in b) return controls.enabled !== false && controls.enableRotate !== false && b.RIGHT === MOUSE_ROTATE;
	return cameraId === 'orbit' || cameraId === 'chase';
}

/**
 * One right-button gesture while a drag may rotate the camera: how far the pointer strayed from the press decides click vs
 * drag, and a drag stays a drag even when it comes back to where it started.
 */
export class RightGesture {
	constructor({ threshold = 5 } = {}) {
		this.threshold = threshold;
		this.cancel();
	}

	get active() {
		return this.down;
	}

	start(x, y) {
		this.down = true;
		this.x0 = x;
		this.y0 = y;
		this.dragged = false;
	}

	move(x, y) {
		if (!this.down || !Number.isFinite(x) || !Number.isFinite(y)) return;
		if (Math.hypot(x - this.x0, y - this.y0) > this.threshold) this.dragged = true;
	}

	/** The button went up: 'click' (cast now), 'drag' (the camera turned) or null (there was no gesture). */
	finish(x, y) {
		if (!this.down) return null;
		this.move(x, y);
		const result = this.dragged ? 'drag' : 'click';
		this.cancel();
		return result;
	}

	/** Pointer cancel, focus loss, a mode change: the gesture ends without a cast. */
	cancel() {
		this.down = false;
		this.dragged = false;
		this.x0 = this.y0 = 0;
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Aim

/** A point `distance` ahead of a caster at (x, z) facing `yaw` (radians, 0 = +Z): where a cast goes with no cursor. */
export function forwardAim(x, z, yaw, distance = 6) {
	return { x: x + Math.sin(yaw) * distance, z: z + Math.cos(yaw) * distance };
}

// Clip mapping for the character controller: which clip plays for each gameplay state, per weapon
// stance, with patterns that cover KayKit / Quaternius / Mixamo-style names and plain ones. The user
// can override any state in the Character tab (saved per model).
import * as THREE from 'three';

export const STATES = {
	idle: { label: 'Idle', loop: true },
	walk: { label: 'Walk', loop: true },
	run: { label: 'Run', loop: true },
	attack: { label: 'Attack', loop: false, hitAt: 0.45 },
	attack2: { label: 'Attack 2 / kick', loop: false, hitAt: 0.45 },
	cast: { label: 'Cast', loop: false, hitAt: 0.5 },
	block: { label: 'Block (hold)', loop: true },
	blockHit: { label: 'Block hit', loop: false },
	hit: { label: 'Get hit', loop: false },
	death: { label: 'Death', loop: false },
	revive: { label: 'Stand up / revive', loop: false },
	jump: { label: 'Jump', loop: false },
	dodge: { label: 'Dodge / roll', loop: false },
};

export const STANCES = {
	unarmed: 'Unarmed',
	'1h': 'One-handed (+ shield)',
	'2h': 'Two-handed melee',
	dual: 'Dual wield',
	ranged1h: 'One-handed ranged (crossbow, wand)',
	ranged2h: 'Two-handed ranged (crossbow, bow)',
	spell: 'Spellcaster (staff, wand, book)',
};

const P = (...list) => list;
// Stance-specific patterns first, then the generic ones. Every list is in priority order.
const PATTERNS = {
	idle: {
		'2h': P(/^2h.*melee.*idle/i, /2h.*idle/i),
		unarmed: P(/^unarmed.*idle/i),
		default: P(/^idle$/i, /^idle[^a-z]?(a|1|01)?$/i, /(?<!(jump|sit|lie|chair|floor).*)idle/i, /survey/i, /^stand(ing)?$/i, /breath/i),
	},
	walk: { default: P(/^walk(ing)?([^a-z]?a)?$/i, /^walk/i, /walk(?!.*(back|strafe|left|right|jump))/i) },
	run: { default: P(/^run(ning)?([^a-z]?a)?$/i, /^run/i, /run(?!.*(strafe|left|right|jump))/i, /jog/i, /sprint/i, /gallop/i) },
	attack: {
		'1h': P(/^1h.*melee.*attack.*chop/i, /^1h.*melee.*attack/i, /1h.*attack/i),
		'2h': P(/^2h.*melee.*attack.*(slice|chop)/i, /^2h.*melee.*attack/i, /2h.*attack/i),
		dual: P(/^dual.*attack.*(slice|chop)/i, /dual.*attack/i),
		ranged1h: P(/^1h.*ranged.*shoot$/i, /1h.*shoot/i, /shoot/i),
		ranged2h: P(/^2h.*ranged.*shoot$/i, /2h.*shoot/i, /shoot|bow|fire/i),
		spell: P(/^spellcast.*shoot/i, /spell.*shoot/i, /^spellcast/i),
		unarmed: P(/^unarmed.*punch.*a$/i, /unarmed.*punch/i, /punch/i),
		default: P(/^attack([^a-z]?(a|1|01))?$/i, /attack(?!.*(block|hit))/i, /slash|swing|chop|stab|strike|punch|smash|bite/i),
	},
	attack2: {
		'1h': P(/^1h.*melee.*attack.*stab/i, /^1h.*melee.*attack.*slice.*horizontal/i),
		'2h': P(/^2h.*melee.*attack.*spin$/i, /^2h.*melee.*attack.*stab/i),
		dual: P(/^dual.*attack.*stab/i),
		unarmed: P(/kick/i, /punch.*b$/i),
		default: P(/kick/i, /attack[^a-z]?(b|2|02)$/i, /stab|thrust/i),
	},
	cast: {
		default: P(/^spellcast[^a-z]?shoot$/i, /^spellcast/i, /spellcasting/i, /cast|spell|magic|channel/i, /throw/i, /wave/i, /^yes$/i, /cheer/i),
	},
	block: { default: P(/^blocking$/i, /^block$/i, /block(?!.*(attack|hit))/i, /guard|defend|parry/i) },
	blockHit: { default: P(/^block[^a-z]?hit$/i, /block.*hit/i) },
	hit: { default: P(/^hit[^a-z]?a$/i, /^hit/i, /(?<!block.*)hit(?!.*(block))/i, /hurt|damage|impact|recoil|react|flinch/i) },
	death: { default: P(/^death[^a-z]?a$/i, /^death(?!.*pose)/i, /death(?!.*pose)/i, /^die|dying|dead(?!.*pose)/i) },
	revive: { default: P(/^lie[^a-z]?stand[^a-z]?up$/i, /stand[^a-z]?up|get[^a-z]?up|revive|rise/i) },
	jump: { default: P(/^jump[^a-z]?full[^a-z]?short$/i, /^jump$/i, /jump(?!.*(idle|land|start))/i) },
	dodge: { default: P(/^dodge[^a-z]?forward$/i, /dodge|roll|dash|evade/i) },
};

const POSE = /pose$|t[^a-z]?pose/i;

// Diablo II: Resurrected animation sets are named <stance>_<action> (hth_walk, 1hs_attack1, stf_cast ...), where the
// stance prefix is the weapon class: hth hand to hand, 1hs / 2hs one / two-handed sword, bow, xbw crossbow, stf staff.
// The generic patterns above would pick the first "walk" of any stance, so these names are resolved exactly. A state
// the weapon class has no clip for falls back to hand to hand.
const D2_STANCE = { unarmed: 'hth', '1h': '1hs', '2h': '2hs', dual: '1hs', ranged1h: 'xbw', ranged2h: 'bow', spell: 'stf' };
const D2_ACTIONS = {
	idle: ['neutral'],
	walk: ['walk'],
	run: ['run'],
	attack: ['attack1'],
	attack2: ['attack2', 'kick'],
	cast: ['cast'],
	block: ['block'],
	hit: ['gethit'],
	death: ['death'],
};
const D2_CLIP = /^(hth|[12]h[st]|bow|xbw|stf)_/;

function d2Clip(clips, state, stance) {
	const actions = D2_ACTIONS[state];
	if (!actions) return null;
	for (const prefix of [D2_STANCE[stance] || 'hth', 'hth']) {
		for (const action of actions) {
			const clip = clips.find((c) => c.name === `${prefix}_${action}` && c.duration > 0);
			if (clip) return clip.name;
		}
	}
	return null;
}

/** Clip name for a state and stance (null when nothing fits). */
export function autoClip(clips, state, stance = 'unarmed') {
	if (clips.some((c) => D2_CLIP.test(c.name))) return d2Clip(clips, state, stance);
	const table = PATTERNS[state];
	if (!table) return null;
	const lists = [table[stance], table.default].filter(Boolean);
	for (const list of lists) {
		for (const pattern of list) {
			const clip = clips.find((c) => pattern.test(c.name) && !POSE.test(c.name) && c.duration > 0);
			if (clip) return clip.name;
		}
	}
	return null;
}

/** State -> clip name for a stance, with user overrides (state -> name, '' = auto). */
export function mapStates(clips, stance, overrides = {}) {
	const map = {};
	for (const state of Object.keys(STATES)) {
		const forced = overrides[state];
		map[state] = forced && clips.some((c) => c.name === forced) ? forced : autoClip(clips, state, stance);
	}
	// Sensible fallbacks so the controller always has locomotion.
	map.walk ??= map.run;
	map.run ??= map.walk;
	map.idle ??= clips.find((c) => c.duration > 0)?.name ?? null;
	return map;
}

/** Stance from the names of the equipped items (right / main hand, left / off hand). */
export function stanceFromItems(right, left) {
	const r = (right || '').toLowerCase();
	const l = (left || '').toLowerCase();
	if (/crossbow|bow|gun|rifle/.test(r)) return /2h|two/.test(r) || /bow(?!.*1h)/.test(r) && !/crossbow/.test(r) ? 'ranged2h' : 'ranged1h';
	if (/staff|wand|spellbook|book|orb|tome/.test(r) || /spellbook|book|orb|tome/.test(l)) return 'spell';
	if (/2h|two|great|halberd|spear|polearm|maul/.test(r)) return '2h';
	if (r && l && !/shield|buckler/.test(l)) return 'dual';
	if (r || /shield|buckler/.test(l)) return '1h';
	return 'unarmed';
}

// --------------------------------------------------------------------------------------------------
// Locomotion analysis: natural speed of a walk / run cycle measured from its foot plants.

const _a = new THREE.Vector3();
const _inv = new THREE.Matrix4();

/**
 * Sample `clip` on a throw-away mixer bound to `mixerRoot` (the live character: stopping the action
 * restores its pose) and measure, in the space of `space` (the character root: metres, faces +Z):
 *   speed   ground speed (m/s at playback rate 1) for which the planted foot stands still
 *   rootMotion  horizontal travel of the whole cycle (clips that move the root instead of staying in place)
 *   stride  distance covered by one cycle at that speed
 */
export function analyseLocomotion(mixerRoot, space, clip, rig, { samples = 48 } = {}) {
	const feet = ['left', 'right'].map((side) => rig?.[side]?.toe || rig?.[side]?.foot).filter(Boolean);
	if (!feet.length || !clip || clip.duration <= 0) return null;
	const mixer = new THREE.AnimationMixer(mixerRoot);
	const action = mixer.clipAction(clip);
	action.play();
	const root = space;
	const tracks = feet.map(() => []);
	const hips = rig.hips;
	const hipTrack = [];
	for (let i = 0; i <= samples; i++) {
		const t = (i / samples) * clip.duration;
		action.time = t;
		mixer.update(0);
		root.updateMatrixWorld(true);
		_inv.copy(root.matrixWorld).invert();
		feet.forEach((bone, k) => tracks[k].push(bone.getWorldPosition(_a).applyMatrix4(_inv).clone()));
		if (hips) hipTrack.push(hips.getWorldPosition(_a).applyMatrix4(_inv).clone());
	}
	action.stop();
	mixer.uncacheRoot(mixerRoot);
	root.updateMatrixWorld(true);
	// Should the space be scaled, convert to world metres.
	const scale = new THREE.Vector3().setFromMatrixScale(root.matrixWorld).x || 1;
	const dt = clip.duration / samples;
	const speeds = [];
	const plantHeights = [];
	for (const track of tracks) {
		const minY = Math.min(...track.map((p) => p.y));
		const maxY = Math.max(...track.map((p) => p.y));
		const threshold = minY + Math.max(0.015, (maxY - minY) * 0.12);
		plantHeights.push(minY * scale);
		for (let i = 1; i < track.length; i++) {
			const a = track[i - 1];
			const b = track[i];
			if (a.y > threshold || b.y > threshold) continue;
			// Planted foot travels backwards (-Z, the model faces +Z) at the speed the body should move.
			const d = -(b.z - a.z);
			if (d > 0) speeds.push(d);
		}
	}
	// Mean stance speed (total backward travel / stance time): moving at exactly this speed leaves no
	// net drift per footstep, even when the authored stance is not perfectly uniform.
	const speedCount = speeds.length;
	const median = speedCount ? speeds.reduce((sum, d) => sum + d, 0) / (speedCount * dt) : 0;
	const root0 = hipTrack[0];
	const root1 = hipTrack[hipTrack.length - 1];
	const rootMotion = root0 && root1 ? Math.hypot(root1.x - root0.x, root1.z - root0.z) * scale : 0;
	let speed = median * scale;
	if (rootMotion > 0.15) speed = rootMotion / clip.duration;
	if (!(speed > 0.05)) return { speed: 0, rootMotion, stride: 0, plantHeights, reliable: false };
	return { speed, rootMotion, stride: speed * clip.duration, plantHeights, reliable: speedCount >= 4 || rootMotion > 0.15 };
}

/**
 * Remove the horizontal drift of the root / hips position track (root motion) so a cycle plays in
 * place; the controller moves the character instead. Returns the travelled distance (model units).
 */
export function stripRootMotion(clip, rig) {
	const names = [rig?.hips, rig?.hips?.parent].filter((b) => b?.isBone).map((b) => b.name);
	let travelled = 0;
	for (const track of clip.tracks) {
		const [node, property] = splitTrack(track.name);
		if (property !== 'position' || !names.includes(node)) continue;
		const v = track.values;
		const n = v.length / 3;
		if (n < 2) continue;
		const dx = v[(n - 1) * 3] - v[0];
		const dz = v[(n - 1) * 3 + 2] - v[2];
		const d = Math.hypot(dx, dz);
		if (d < 1e-4) continue;
		travelled = Math.max(travelled, d);
		const times = track.times;
		const t0 = times[0];
		const span = times[times.length - 1] - t0 || 1;
		for (let i = 0; i < n; i++) {
			const f = (times[i] - t0) / span;
			v[i * 3] -= dx * f;
			v[i * 3 + 2] -= dz * f;
		}
	}
	return travelled;
}

export function splitTrack(name) {
	const dot = name.lastIndexOf('.');
	return [name.slice(0, dot), name.slice(dot + 1)];
}

/**
 * Merge clips from another file into a character: keeps the clips whose tracks target bones that exist
 * in `model` (same rig / bone names). Returns { added, skipped }.
 */
export function compatibleClips(model, clips) {
	const names = new Set();
	model.traverse((o) => names.add(o.name));
	const added = [];
	let skipped = 0;
	for (const clip of clips) {
		const tracks = clip.tracks.filter((t) => names.has(splitTrack(t.name)[0]));
		if (tracks.length >= Math.max(3, clip.tracks.length * 0.5)) {
			added.push(tracks.length === clip.tracks.length ? clip : new THREE.AnimationClip(clip.name, clip.duration, tracks));
		} else skipped++;
	}
	return { added, skipped };
}

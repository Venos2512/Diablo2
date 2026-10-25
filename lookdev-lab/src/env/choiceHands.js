// ASHLAR · Class select (scene src/scenes/choiceHands.js; Hero Concept §10, key art ashlar/art/heroes/_shared/choice_hands/keyart.png): the CPU side of the six hands that
// reach out of the ossuary wall round Gennet's candle. Pure maths plus THREE's Vector3 / Quaternion (no DOM): the slot table (order, canon lines, which hand model, palm up or
// back up, where on the arc), the arm geometry (the wall hole, the arm direction, the pose of a hand for a hover / reach / retract weight), the camera dolly, easings and the
// candle flicker. Tested by scripts/choice-hands.test.mjs.
// Coordinates are world metres: x right, y up, z toward the viewer; the wall is the plane z = 0 (its skulls stand 0..0.05 m behind it), the ledge is below y = 0, the candle is on it.
// Arm frame: local +z along the forearm toward the fingers, +y the back of the hand (as the prepared GLBs, scripts/prepare-choice-hands.py), origin at the sleeve end.
import * as THREE from 'three';
import { flicker1f, smoothstep } from './dungeon.js';

export { flicker1f, smoothstep };

const DEG = Math.PI / 180;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// ---- the set -----------------------------------------------------------------------------------------------------------------------
export const HAND_SCALE = 1.6; // default cover of a hand (x life size): a hand 1.5-2 skulls long as in the key art
export const HAND_LENGTH = 0.45; // m, sleeve end to fingertips (the prepared GLBs)
export const WALL = { width: 3.8, height: 2.3, cy: 1.05, tile: 0.92, relief: 0.05, segX: 380, segY: 230 }; // tile: one 1024 px texture = ~5 skulls (a skull is ~0.18 m); relief: the skull tops are z = 0, the recesses -0.05
export const LEDGE = { width: 4.4, depth: 0.18, height: 0.5 }; // top at y = 0, front at z = depth
export const CANDLE = { x: 0, z: 0.06, scale: 1.12, height: 0.14, radius: 0.03, flameY: 0.185 }; // on the ledge, close to the wall, between hands 3 and 4; scale: the key art's candle is a little over life size


/** How far out (reach progress 0..1) the offered hand must be before it can be taken: the buttons show and a queued grab fires. */
export const GRAB_AT = 0.85;

const vnoise = (x, y, seed) => {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;
	const sx = fx * fx * (3 - 2 * fx);
	const sy = fy * fy * (3 - 2 * fy);
	const h = (i, j) => hash01(i * 7 + j * 131, seed);
	return lerp(lerp(h(x0, y0), h(x0 + 1, y0), sx), lerp(h(x0, y0 + 1), h(x0 + 1, y0 + 1), sx), sy);
};

/**
 * How much of tile B (instead of tile A) the wall shows at a point (0..1): none in the lit middle of the frame, a smooth cross-fade over ~0.35 m through the dim ring, then
 * tile B. Noise-perturbed ellipse, so the transition has no shape the eye can follow.
 */
export function wallBlend(x, y) {
	const n = vnoise(x / 0.7 + 3.1, y / 0.7 + 7.7, 11) * 0.6 + vnoise(x / 0.3 + 9.3, y / 0.3 + 1.9, 12) * 0.4;
	const r = Math.hypot(x / 1.0, (y - 0.55) / 0.8) + (n - 0.5) * 0.35;
	return smoothstep(0.92, 1.32, r);
}

/** Where the two tiles start (in tiles) so neither has a seam or a tile border in the middle of the frame. */
export const WALL_OFFSETS = { a: [0.21, 0.37], b: [0.37, 0.61] };

/**
 * Bake rows [y0, y1) of the wall's three maps from the two 1024 px tiles (periodic, so sampled with wrap): out = { albedo, normal, height } RGBA8 arrays of W x H (row 0 =
 * the BOTTOM of the wall, the DataTexture convention), tiles = { a, b } each { albedo, normal, height } = { data, width, height } (ImageData; image row 0 = the top, so a tile's
 * v = 1 is its first row). albedo and height cross-fade, normals are blended as vectors and renormalised. One non-repeating texture for the whole wall: no repeat, no seam.
 * W x H covers WALL.width x WALL.height; pixels where wallBlend is 0 or 1 sample one tile only.
 */
export function composeWallRows(out, tiles, W, H, y0, y1) {
	const WL = WALL;
	const sample = (img, u, v, ch, store, o) => {
		const x = (u - Math.floor(u)) * img.width - 0.5;
		const y = (1 - (v - Math.floor(v))) * img.height - 0.5;
		const ix = Math.floor(x);
		const iy = Math.floor(y);
		const fx = x - ix;
		const fy = y - iy;
		const w = img.width;
		const h = img.height;
		const x0 = ((ix % w) + w) % w;
		const x1 = (x0 + 1) % w;
		const r0 = (((iy % h) + h) % h) * w;
		const r1 = ((((iy + 1) % h) + h) % h) * w;
		const d = img.data;
		for (let c = 0; c < ch; c++) {
			store[o + c] = (d[(r0 + x0) * 4 + c] * (1 - fx) + d[(r0 + x1) * 4 + c] * fx) * (1 - fy) + (d[(r1 + x0) * 4 + c] * (1 - fx) + d[(r1 + x1) * 4 + c] * fx) * fy;
		}
	};
	const a = new Float32Array(12);
	const b = new Float32Array(12);
	for (let r = y0; r < y1; r++) {
		const y = WL.cy - WL.height / 2 + ((r + 0.5) / H) * WL.height;
		for (let i = 0; i < W; i++) {
			const x = ((i + 0.5) / W - 0.5) * WL.width;
			const w = wallBlend(x, y);
			const o = (r * W + i) * 4;
			for (const [key, kind] of [['albedo', 0], ['normal', 1], ['height', 2]]) {
				const o4 = kind * 4;
				if (w < 1) sample(tiles.a[key], x / WL.tile + WALL_OFFSETS.a[0], y / WL.tile + WALL_OFFSETS.a[1], 3, a, o4);
				if (w > 0) sample(tiles.b[key], x / WL.tile + WALL_OFFSETS.b[0], y / WL.tile + WALL_OFFSETS.b[1], 3, b, o4);
			}
			for (let kind = 0; kind < 3; kind++) {
				const o4 = kind * 4;
				const dst = [out.albedo, out.normal, out.height][kind];
				let c0;
				let c1;
				let c2;
				if (kind === 1) {
					// normals: decode, blend, renormalise
					const va = [a[o4] / 127.5 - 1, a[o4 + 1] / 127.5 - 1, a[o4 + 2] / 127.5 - 1];
					const vb = [b[o4] / 127.5 - 1, b[o4 + 1] / 127.5 - 1, b[o4 + 2] / 127.5 - 1];
					let nx = w <= 0 ? va[0] : w >= 1 ? vb[0] : lerp(va[0], vb[0], w);
					let ny = w <= 0 ? va[1] : w >= 1 ? vb[1] : lerp(va[1], vb[1], w);
					let nz = w <= 0 ? va[2] : w >= 1 ? vb[2] : lerp(va[2], vb[2], w);
					const l = Math.hypot(nx, ny, nz) || 1;
					nx /= l;
					ny /= l;
					nz /= l;
					c0 = (nx + 1) * 127.5;
					c1 = (ny + 1) * 127.5;
					c2 = (nz + 1) * 127.5;
				} else {
					c0 = w <= 0 ? a[o4] : w >= 1 ? b[o4] : lerp(a[o4], b[o4], w);
					c1 = w <= 0 ? a[o4 + 1] : w >= 1 ? b[o4 + 1] : lerp(a[o4 + 1], b[o4 + 1], w);
					c2 = w <= 0 ? a[o4 + 2] : w >= 1 ? b[o4 + 2] : lerp(a[o4 + 2], b[o4 + 2], w);
				}
				dst[o] = c0;
				dst[o + 1] = c1;
				dst[o + 2] = c2;
				dst[o + 3] = 255;
			}
		}
	}
}

/** A low-frequency brightness multiplier (0.76 .. 1.08) of the wall at a point: blotches of soot and wear that stop the eye from counting tiles. */
export function wallTone(x, y) {
	const n = vnoise(x / 0.55 + 1.7, y / 0.55 + 4.1, 21) * 0.65 + vnoise(x / 0.2 + 6.3, y / 0.2 + 2.2, 22) * 0.35;
	return 0.76 + 0.32 * n;
}

/**
 * THE KEY ART, measured (ashlar/art/heroes/_shared/choice_hands/keyart.png, 1672 x 941; normalised x, y in [0, 1], origin top-left; measured on a 0.1 grid with crops, 2026-10-24).
 * wrist = the middle of the wrist joint, tip = the end of the longest finger, sleeve = where the visible sleeve leaves the wall (the hole). skulls: ~10 across the frame, so the
 * frame is ~1.8 m wide (a skull 0.18 m). The ledge's front-top edge is the line y = 0.893; the candle's dish stands on the ledge, flame tip at y 0.672.
 */
export const KEYART = {
	width: 1672,
	height: 941,
	aspect: 1672 / 941,
	frameWidthM: 1.8,
	ledgeY: 0.893,
	candle: { flameTip: [0.5, 0.672], waxTop: [0.5, 0.75], dishBase: [0.505, 0.885] },
	hands: {
		PB: { sleeve: [0.12, 0.1], wrist: [0.095, 0.235], tip: [0.137, 0.5] },
		FL: { sleeve: [0.266, 0.16], wrist: [0.257, 0.365], tip: [0.3, 0.525] },
		OS: { sleeve: [0.42, 0.245], wrist: [0.419, 0.41], tip: [0.443, 0.7] },
		BR: { sleeve: [0.59, 0.25], wrist: [0.59, 0.425], tip: [0.574, 0.73] },
		EX: { sleeve: [0.76, 0.195], wrist: [0.76, 0.39], tip: [0.705, 0.555] },
		PS: { sleeve: [0.9, 0.12], wrist: [0.9, 0.315], tip: [0.915, 0.5] },
	},
};

/**
 * The camera: the key art is a flat painting seen straight on, so a long lens (vertical fov 16 deg at 3.6 m: the frame is 1.8 m wide at the wall) a hair above the ledge
 * (2 deg), looking at the point of the wall that is the middle of the frame (0.40 m above the ledge top). `fov` is the vertical fov of the KEYART.aspect frame.
 */
export const FRAME = { fov: 16, position: [0, 0.486, 3.6], target: [0, 0.392, 0] };

/** The vertical fov that shows at least the whole key-art frame in a viewport of this aspect (wider viewports show more wall at the sides, narrower ones a taller frame). */
export function fovForAspect(aspect, base = FRAME.fov) {
	if (aspect >= KEYART.aspect) return base;
	return (2 * Math.atan(Math.tan((base * DEG) / 2) * (KEYART.aspect / aspect))) / DEG;
}

let _keyCam = null;
/** World point -> key-art normalised coordinates [x, y] (origin top-left), through the idle camera. */
export function projectToKeyArt(v, frame = FRAME) {
	if (!_keyCam || _keyCam.userData.frame !== frame) {
		_keyCam = new THREE.PerspectiveCamera(frame.fov, KEYART.aspect, 0.1, 100);
		_keyCam.userData.frame = frame;
		_keyCam.position.set(...frame.position);
		_keyCam.lookAt(...frame.target);
		_keyCam.updateMatrixWorld(true);
		_keyCam.updateProjectionMatrix();
	}
	const p = v.clone().project(_keyCam);
	return [(p.x + 1) / 2, (1 - p.y) / 2];
}

// ---- the hands ---------------------------------------------------------------------------------------------------------------------
/**
 * The prepared hand models: file = samples.json id, wrist = metres from the sleeve end to where the wrist bends (the pivot of the wrist group; the GLB's WRIST of
 * scripts/prepare-choice-hands.py), sleeve = the extension's ellipse radii (m) so a prop ring can wrap it.
 */
export const HAND_MODELS = {
	fl: { file: 'choice-hand-fl', wrist: 0.27, sleeve: [0.045, 0.046], tip: [0.087, -0.068, 0.447] }, // tip = the longest fingertip (mean of the 40 highest-z vertices), arm frame
	os: { file: 'choice-hand-os', wrist: 0.27, sleeve: [0.039, 0.041], tip: [-0.058, -0.02, 0.447] },
	br: { file: 'choice-hand-br', wrist: 0.261, sleeve: [0.043, 0.043], tip: [0.022, -0.024, 0.448] },
};

/**
 * The six hands, left to right: Voc §3.2 / §9.1 order PB FL OS BR EX PS. `pose`: 'back' = the back of the hand toward the viewer (PB OS BR: their marks are on it), 'palm' =
 * palm up / toward the viewer (FL EX PS). `source`: the model that draws it; `standIn` = no GLB of its own yet (PB EX PS: only concepts), so a clone of the hand with the same pose
 * is tinted: dropping the real GLB in means setting `file` and `standIn: false`. `entry` = the hole in the wall where the arm leaves it (world x, y; calibrated against the key art by scripts/choice-hands-calibrate.mjs; the fingertip follows from the arm direction), `a` = the in-plane direction of the arm (0 = straight
 * down, + turns toward +x), `phi` = how steeply the arm leans out of the wall at rest, `twist` = extra roll about the arm. `quote` is canon (Hero Concept §10): kept in English.
 */
export const SLOTS = [
	{ id: 'PB', name: 'Pallbearer', quote: 'Lift with the legs. And with the heart.', source: 'os', file: null, standIn: true, pose: 'back', mirror: false,
		entry: [-0.727, 0.781], a: 22.5, phi: 15, twist: 13.6, visible: 0.264, k: 0.93, tint: { mono: [0.78, 0.84, 0.94], metalness: 0.4, roughness: 0.4 }, rings: null },
	{ id: 'FL', name: 'Flagellant', quote: 'Pain is the only prayer that never lies.', source: 'fl', file: 'choice-hand-fl', standIn: false, pose: 'palm', mirror: false,
		entry: [-0.453, 0.726], a: 17.5, phi: 20.6, twist: -42.7, visible: 0.335, k: 0.85, tint: null, rings: null },
	{ id: 'OS', name: 'Ossuarist', quote: 'Only borrowing, love. We\'ll put them back.', source: 'os', file: 'choice-hand-os', standIn: false, pose: 'back', mirror: false,
		entry: [-0.171, 0.641], a: 19.4, phi: 15, twist: 7.4, visible: 0.286, k: 0.985, tint: null, rings: null },
	{ id: 'BR', name: 'Brinecaller', quote: 'Salt keeps. Salt cleans. Salt kills. Mind which you ask for.', source: 'br', file: 'choice-hand-br', standIn: false, pose: 'back', mirror: true,
		entry: [0.159, 0.645], a: 0.4, phi: 21.2, twist: 0.5, visible: 0.307, k: 1.01, tint: null, rings: null },
	{ id: 'EX', name: 'Exhumer', quote: 'Keep your light low. The things worth killing see better than you.', source: 'fl', file: null, standIn: true, pose: 'palm', mirror: true,
		entry: [0.5, 0.687], a: -23.3, phi: 16.2, twist: 39.9, visible: 0.322, k: 0.85, tint: { mono: [1.0, 0.64, 0.38], metalness: 0.0, roughness: 0.6 }, rings: null },
	{ id: 'PS', name: 'Pyre-Singer', quote: 'Sing, so they don\'t go frightened.', source: 'fl', file: null, standIn: true, pose: 'palm', mirror: true,
		entry: [0.736, 0.771], a: -15.6, phi: 21.1, twist: 20.9, visible: 0.335, k: 0.85, tint: { color: [1.0, 0.86, 0.8], metalness: 0.0, roughness: 0.78 }, rings: { color: [0.62, 0.05, 0.04], count: 2 } },
];
export const TRAIL = 'The stranger\'s hand crumbles on the ossuary floor when the Keystone lets go of the Wall'; // canon (Voc): the grasp's dust

/** Arm numbers shared by every slot. */
export const ARM = {
	visible: 0.32, // m of arm in front of the wall at rest, measured from the wall hole to the fingertips along the arm
	slide: 0.26, // local m (x the hand scale) the forearm slides out along its axis when chosen
	retract: 0.32, // m the other five slide back into the wall
	hoverSlide: 0.035, // m a hovered hand edges out
	hoverTurn: 0.1, // fraction of the way to the reach pose a hovered hand turns
	reachYaw: 16, // deg: the reached arm points nearly AT the viewer, this far toward the screen centre ...
	reachPitch: -20, // ... and this far below horizontal (the hand is offered, not thrust)
	wristBack: 8, // deg wrist pitch of a hand that rests back-up when it is offered: it has turned over by then, so it cups like the others (a negative pitch would droop it and tilt the palm toward the viewer)
	wristPalm: 8, // deg wrist pitch of a palm-up hand when offered (the palm cups)
};
/** The dissolve cuts the arm into SLABS slabs of equal thickness between SLAB_Z0 and SLAB_Z1 (m, arm frame, +z = fingers); everything below SLAB_Z0 is slab 0. */
export const SLABS = 40;
export const SLAB_Z0 = -0.02;
export const SLAB_Z1 = 0.47;
export const TIMES = { reach: 1.8, back: 1.4, tremble: 0.55, crumble: 1.9, fadeAt: 1.5, endAt: 2.9 }; // seconds

// ---- finger rig (optional: the hands are static meshes today; a rigged GLB with these bones is driven by code, no clips) -------------------
/**
 * RIG INTERFACE for the person who will rig the fingers in Blender (GLB with a skin). Names are matched case-insensitively with every non-alphanumeric
 * character ignored ("Thumb.01", "thumb_01", "THUMB01" are one name). A missing bone is skipped silently (a hand with only index + middle still works; a GLB with
 * no such bone at all stays a static mesh). Change names HERE only.
 *
 * Frame: the HAND frame of the prepared GLBs (scripts/prepare-choice-hands.py: origin = the sleeve end, +z toward the fingertips, +y the BACK of the hand, x across) is the
 * frame of the glTF scene root. The BONES' OWN LOCAL AXES CAN BE ANYTHING: Blender bones export with local +Y along the bone and any roll. At bind time the rig reads each
 * bone's rest pose in the hand frame and DERIVES its axes from the finger geometry:
 *   - along = toward the next bone of the chain (for `_03`: from the previous one);
 *   - curl axis = along x palm-ward (the palm is -y of the hand frame): a positive curl moves the fingertip toward the PALM, a negative one extends it;
 *   - spread axis = along x curl (the dorsum side): a positive spread (first segment `_01` only) moves the finger toward +x of the hand frame;
 *   - the sign is CHECKED: the axis is turned +5 deg and the tip must move toward the palm, otherwise it is flipped;
 *   - the pose is rest * spread * curl, in the bone's own local axes (no accumulation; the rest orientation, roll included, is kept).
 * So the rigger only has to: model the hand in the prepared frame, name the bones, keep each chain parent -> child (`_01` -> `_02` -> `_03`), and rig ONE hand (the scene
 * mirrors it with scale.x = -1 for the slots that need the other hand). `hand_root` and `wrist` are looked up and reported but NOT driven: the wrist bend and the squeeze are
 * group transforms in the scene, the forearm stays rigid (skin the sleeve / forearm 100 % to hand_root or wrist, each finger segment to its own bone).
 */
export const FINGER_BONES = {
	root: 'hand_root',
	forearm: 'forearm',
	twist: 'forearm_twist',
	wrist: 'wrist',
	fingers: {
		thumb: ['thumb_01', 'thumb_02', 'thumb_03'],
		index: ['index_01', 'index_02', 'index_03'],
		middle: ['middle_01', 'middle_02', 'middle_03'],
		ring: ['ring_01', 'ring_02', 'ring_03'],
		pinky: ['pinky_01', 'pinky_02', 'pinky_03'],
	},
};
/**
 * Optional per-finger override of the derived axes, given in the HAND frame: FINGER_AXES.thumb = { curl: [x, y, z], spread: [x, y, z] } (curl: positive toward the palm).
 * Empty by default: the thumb, whose chain does not run along +z, gets the same derivation from its own bones (a thumb that curls the wrong way is the first thing to check).
 */
export const FINGER_AXES = {
	// H2_FL_hand_rig.glb (qa_report.md section 7.4): the thumb lies in the palm plane, its nail toward the wrist, so the geometry-derived axis is 72-76 deg off the real hinge
	thumb: { curl: [-0.007, -0.954, -0.299], spread: [0.226, 0.29, -0.93] },
};
/**
 * Procedural poses, degrees per segment [_01, _02, _03] and the spread of _01. relaxed = idle (a loose half-curl, the little finger most), open = the hand OFFERED, palm UP (a loose
 * cup: a few degrees of curl, fingers slightly fanned: "come, take it"), grip = grasped (a closed fist). Blend: relaxed -> open by `offer`, then -> grip by `grip`.
 */
export const FINGER_POSES = {
	thumb: { relaxed: [8, 12, 8], open: [3, 5, 3], grip: [30, 38, 28], spread: { relaxed: 6, open: 14, grip: -6 } },
	index: { relaxed: [16, 22, 14], open: [7, 10, 6], grip: [72, 88, 62], spread: { relaxed: 2, open: 5, grip: 0 } },
	middle: { relaxed: [20, 26, 16], open: [9, 12, 7], grip: [76, 92, 64], spread: { relaxed: 0, open: 1, grip: 0 } },
	ring: { relaxed: [24, 30, 18], open: [11, 14, 8], grip: [76, 92, 62], spread: { relaxed: -2, open: -4, grip: 0 } },
	pinky: { relaxed: [28, 32, 20], open: [13, 16, 9], grip: [74, 86, 58], spread: { relaxed: -4, open: -10, grip: -2 } },
};
const normBone = (n) => String(n).toLowerCase().replace(/[^a-z0-9]/g, '');

/** Fractions of a 0..1 weight that a finger / a joint waits before it starts (the index leads, the little finger follows; an outer joint follows the inner one). */
const FINGER_LAG_FRAC = { thumb: 0.1, index: 0, middle: 0.03, ring: 0.06, pinky: 0.09 };
const SEG_LAG_FRAC = 0.05;
const phased = (x, lag) => clamp((x - lag) / (1 - lag), 0, 1);

/** Curl per segment (deg) and spread (deg) of one finger for an offer / grip weight (both 0..1). `sway` = a small relaxed-pose breath (-1..1). */
export function fingerAngles(finger, offer, grip, sway = 0, out = { curl: [0, 0, 0], spread: 0 }, poses = FINGER_POSES) {
	const p = poses[finger];
	const o0 = clamp(offer, 0, 1);
	const g0 = clamp(grip, 0, 1);
	const lag = FINGER_LAG_FRAC[finger] ?? 0;
	for (let k = 0; k < 3; k++) {
		// the fingers do not move as one block: each starts a little after the one before it and each outer joint a little after the inner one (both ends of the weight are untouched)
		const l = lag + SEG_LAG_FRAC * k;
		const o = phased(o0, l);
		const g = phased(g0, l);
		const rest = p.relaxed[k] * (1 + 0.12 * sway * (1 - o));
		out.curl[k] = lerp(lerp(rest, p.open[k], o), p.grip[k], g);
	}
	const ol = phased(o0, lag);
	const gl = phased(g0, lag);
	out.spread = lerp(lerp(p.spread.relaxed, p.spread.open, ol), p.spread.grip, gl);
	return out;
}

const PALM = new THREE.Vector3(0, -1, 0); // the palm side of the hand frame

// ---- the hand-test mode: anatomical limits, presets, the way a hand moves (one table, edit here) ---------------------------------------------------------
const FINGER_NAMES = ['thumb', 'index', 'middle', 'ring', 'pinky'];
/** Per finger: [min, max] curl (deg, + toward the palm) of the three joints [MCP / thumb CMC-MCP, PIP, DIP] and of the spread (+ toward the thumb side x), RELATIVE TO THE RIG'S REST POSE. Real hands, from straight: MCP 0-90 (a little hyperextension), PIP 0-110, DIP 0-80; the lower bounds go further down because a mesh modelled half curled (the Flagellant's: PIP 22-42 deg at rest) needs negative angles to straighten. */
export const HAND_LIMITS = {
	thumb: { curl: [[-25, 55], [-25, 75], [-20, 65]], spread: [-30, 45] },
	index: { curl: [[-30, 90], [-50, 110], [-35, 80]], spread: [-20, 20] },
	middle: { curl: [[-30, 90], [-50, 110], [-35, 80]], spread: [-14, 14] },
	ring: { curl: [[-30, 90], [-50, 110], [-35, 80]], spread: [-16, 16] },
	pinky: { curl: [[-30, 90], [-50, 110], [-35, 80]], spread: [-24, 24] },
};
/** Wrist flexion (+ toward the palm) / extension, deviation (+ toward the thumb) and the forearm's roll (deg). */
export const WRIST_LIMITS = { flex: [-70, 80], dev: [-20, 35], roll: [-90, 90] };
/** How a hand moves between poses: each finger starts `lag` s after the one before it (the index leads); each joint is a critically damped spring, the outer joints slower than the inner ones. */
export const HAND_MOTION = {
	lag: { thumb: 0.05, index: 0, middle: 0.02, ring: 0.04, pinky: 0.06 }, // s
	omega: { curl: [15, 12, 10], spread: 13, flex: 10, dev: 10, roll: 7 }, // rad/s of the spring of each joint
	zeta: 0.92, // a hair under critical: a tiny settle, no robot stop
};
const J = (a, b, c, spread = 0) => ({ curl: [a, b, c], spread });
/** A pose with every joint at 0 (the hand flat and straight). */
export function emptyPose() {
	return { fingers: Object.fromEntries(FINGER_NAMES.map((f) => [f, J(0, 0, 0)])), wrist: { flex: 0, dev: 0 }, roll: 0 };
}
export function copyPose(p) {
	return { fingers: Object.fromEntries(FINGER_NAMES.map((f) => [f, { curl: [...p.fingers[f].curl], spread: p.fingers[f].spread }])), wrist: { ...p.wrist }, roll: p.roll };
}
/** The pose inside the anatomical limits (a copy). */
export function clampPose(p) {
	const o = copyPose(p);
	for (const f of FINGER_NAMES) {
		const L = HAND_LIMITS[f];
		o.fingers[f].curl = o.fingers[f].curl.map((v, k) => clamp(v, ...L.curl[k]));
		o.fingers[f].spread = clamp(o.fingers[f].spread, ...L.spread);
	}
	o.wrist.flex = clamp(o.wrist.flex, ...WRIST_LIMITS.flex);
	o.wrist.dev = clamp(o.wrist.dev, ...WRIST_LIMITS.dev);
	o.roll = clamp(o.roll, ...WRIST_LIMITS.roll);
	return o;
}
/** The finger part of a pose from FINGER_POSES for given weights (the scene's own idle / offer / grip). */
export function poseFromWeights(offer, grip, poses = FINGER_POSES) {
	const p = emptyPose();
	const tmp = { curl: [0, 0, 0], spread: 0 };
	for (const f of FINGER_NAMES) {
		fingerAngles(f, offer, grip, 0, tmp, poses);
		p.fingers[f] = { curl: [...tmp.curl], spread: tmp.spread };
	}
	return p;
}
const withFingers = (base, fingers) => {
	const p = copyPose(base);
	for (const [f, v] of Object.entries(fingers)) p.fingers[f] = v;
	return p;
};
/** The hand-test presets: id -> { label, pose() } (static) or { label, dynamic: (t) => pose } (the wave). The ROM list of the rig brief. */
export const HAND_PRESETS = {
	relaxed: { label: 'Thả lỏng', pose: () => poseFromWeights(0, 0) },
	offer: { label: 'Mở mời nắm', pose: () => poseFromWeights(1, 0) },
	cup: {
		label: 'Khum chén',
		pose: () => ({ ...withFingers(emptyPose(), { thumb: J(12, 16, 10, 8), index: J(26, 34, 18, 3), middle: J(30, 38, 20, 0), ring: J(34, 42, 22, -4), pinky: J(38, 44, 24, -8) }), wrist: { flex: 10, dev: 0 }, roll: 0 }),
	},
	fist: { label: 'Nắm đấm', pose: () => withFingers(emptyPose(), { thumb: J(38, 50, 38, 0), index: J(88, 106, 72, 0), middle: J(90, 108, 74, 0), ring: J(90, 108, 74, 0), pinky: J(90, 108, 72, 0) }) },
	hold: {
		label: 'Nắm hờ (cầm tay người khác)',
		pose: () => ({ ...withFingers(emptyPose(), { thumb: J(20, 30, 20, 14), index: J(46, 58, 32, 2), middle: J(50, 62, 34, 0), ring: J(54, 64, 36, -3), pinky: J(58, 68, 38, -6) }), wrist: { flex: 6, dev: 0 }, roll: 0 }),
	},
	point: { label: 'Chỉ', pose: () => withFingers(emptyPose(), { thumb: J(30, 42, 30, 0), index: J(0, 0, 0, 2), middle: J(88, 106, 72, 0), ring: J(90, 108, 74, 0), pinky: J(90, 108, 72, 0) }) },
	spread: { label: 'Xoè hết', pose: () => withFingers(emptyPose(), { thumb: J(0, 0, 0, 40), index: J(0, 0, 0, 14), middle: J(0, 0, 0, 4), ring: J(0, 0, 0, -6), pinky: J(0, 0, 0, -18) }) },
	wave: {
		label: 'Gợn sóng ngón (út → trỏ)',
		dynamic: (t) => {
			const p = poseFromWeights(0.6, 0);
			const order = ['pinky', 'ring', 'middle', 'index']; // the wave runs from the little finger to the index, one beat behind each
			order.forEach((f, i) => {
				const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / 1.6 - i * 0.14)); // 0..1
				p.fingers[f] = J(lerp(8, 62, w), lerp(10, 80, w), lerp(6, 50, w), p.fingers[f].spread);
			});
			return p;
		},
	},
	flexed: { label: 'Cổ tay gập +40°', pose: () => ({ ...poseFromWeights(0.3, 0), wrist: { flex: 40, dev: 0 }, roll: 0 }) },
	extended: { label: 'Cổ tay ngửa −40°', pose: () => ({ ...poseFromWeights(0.3, 0), wrist: { flex: -40, dev: 0 }, roll: 0 }) },
	rollPlus: { label: 'Xoay cẳng tay +90°', pose: () => ({ ...poseFromWeights(0.3, 0), roll: 90 }) },
	rollMinus: { label: 'Xoay cẳng tay −90°', pose: () => ({ ...poseFromWeights(0.3, 0), roll: -90 }) },
};
/** The auto test loop: the presets in order, `hold` seconds each (the wave runs longer). */
export const HAND_TEST_SEQUENCE = [
	['relaxed', 1.4], ['offer', 1.6], ['cup', 1.6], ['fist', 1.6], ['hold', 1.6], ['point', 1.6], ['spread', 1.6], ['wave', 3.4],
	['flexed', 1.6], ['extended', 1.8], ['rollPlus', 1.8], ['rollMinus', 2.2], ['relaxed', 1.4],
];
/** The pose of a preset at time t (dynamic presets move with t). */
export function presetPose(id, t = 0, profile = 'default') {
	const pr = presetSet(profile)[id];
	return clampPose(pr.dynamic ? pr.dynamic(t) : pr.pose());
}

/**
 * The finger pose tables of the MODELS: angles are ADDED to the rig's rest pose. 'default' = FINGER_POSES (a straight-modelled hand). 'flRig' = the Flagellant's real rig
 * (H2_FL_hand_rig.glb): its mesh is modelled half curled (PIP 22-42 deg), so `relaxed` is ~0, the offered hand is slightly NEGATIVE (a little straighter than the mesh, not a claw), and
 * `grip` is the fist measured on contact (fingertips touch the palm, <= 1 mm; qa_report.md section 7.3, thumb from section 4) instead of a textbook fist that buries the fingers 14 mm in it.
 */
export const HAND_PROFILES = {
	default: { poses: FINGER_POSES },
	flRig: {
		poses: {
			thumb: { relaxed: [0, 0, 0], open: [-4, -8, -4], grip: [20, 40, 58], spread: { relaxed: 0, open: 6, grip: -20 } },
			index: { relaxed: [0, 0, 0], open: [-4, -12, -7], grip: [52.7, 64.8, 45.4], spread: { relaxed: 0, open: 3, grip: 0 } },
			middle: { relaxed: [0, 0, 0], open: [-4, -12, -7], grip: [42.5, 52, 35.5], spread: { relaxed: 0, open: 1, grip: 0 } },
			ring: { relaxed: [0, 0, 0], open: [-3, -10, -6], grip: [48.5, 59, 39.2], spread: { relaxed: 0, open: -3, grip: 0 } },
			pinky: { relaxed: [0, 0, 0], open: [-3, -8, -5], grip: [60.2, 70.1, 46.9], spread: { relaxed: 0, open: -7, grip: -2 } },
		},
	},
};
const lerpFinger = (a, b, t) => ({ curl: a.curl.map((v, k) => lerp(v, b.curl[k], t)), spread: lerp(a.spread, b.spread, t) });
const lerpFingers = (a, b, t) => {
	const p = copyPose(a);
	for (const f of FINGER_NAMES) p.fingers[f] = lerpFinger(a.fingers[f], b.fingers[f], t);
	return p;
};
const presetSets = new Map([['default', HAND_PRESETS]]);
/** The preset table of a profile: the default one is HAND_PRESETS; others are built from the profile's own relaxed / open / grip so a half-curled mesh never gets a claw. */
export function presetSet(profile = 'default') {
	if (!presetSets.has(profile)) {
		const P = HAND_PROFILES[profile].poses;
		const rel = poseFromWeights(0, 0, P);
		const open = poseFromWeights(1, 0, P);
		const fist = poseFromWeights(0, 1, P);
		const wr = (pose, flex = 0, roll = 0) => ({ ...pose, wrist: { flex, dev: 0 }, roll });
		const straight = (pose) => { // the index of `point`: a little more than open
			const q = copyPose(pose);
			q.fingers.index = { curl: pose.fingers.index.curl.map((v) => v * 1.8), spread: pose.fingers.index.spread };
			return q;
		};
		const mid = lerpFingers(rel, open, 0.5);
		presetSets.set(profile, {
			relaxed: { label: HAND_PRESETS.relaxed.label, pose: () => rel },
			offer: { label: HAND_PRESETS.offer.label, pose: () => open },
			cup: { label: HAND_PRESETS.cup.label, pose: () => wr(lerpFingers(rel, fist, 0.26), 10) },
			fist: { label: HAND_PRESETS.fist.label, pose: () => fist },
			hold: { label: HAND_PRESETS.hold.label, pose: () => wr(lerpFingers(rel, fist, 0.5), 6) }, // 45-55 % of the fist
			point: { label: HAND_PRESETS.point.label, pose: () => { const q = copyPose(fist); q.fingers.index = straight(open).fingers.index; q.fingers.thumb = lerpFinger(fist.fingers.thumb, rel.fingers.thumb, 0.4); return q; } },
			spread: { label: HAND_PRESETS.spread.label, pose: () => { const q = copyPose(open); const sp = { thumb: 38, index: 14, middle: 4, ring: -6, pinky: -18 }; for (const f of FINGER_NAMES) q.fingers[f].spread = sp[f]; return q; } },
			wave: {
				label: HAND_PRESETS.wave.label,
				dynamic: (t) => {
					const q = copyPose(lerpFingers(rel, open, 0.6));
					['pinky', 'ring', 'middle', 'index'].forEach((f, i) => {
						const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t / 1.6 - i * 0.14));
						q.fingers[f] = lerpFinger(open.fingers[f], fist.fingers[f], w * 0.8);
					});
					return q;
				},
			},
			flexed: { label: HAND_PRESETS.flexed.label, pose: () => wr(mid, 40) },
			extended: { label: HAND_PRESETS.extended.label, pose: () => wr(mid, -40) },
			rollPlus: { label: HAND_PRESETS.rollPlus.label, pose: () => wr(mid, 0, 90) },
			rollMinus: { label: HAND_PRESETS.rollMinus.label, pose: () => wr(mid, 0, -90) },
		});
	}
	return presetSets.get(profile);
}
/** Where the auto loop is at time t: { id, index, local } (the sequence repeats). */
export function sequenceAt(t) {
	const total = HAND_TEST_SEQUENCE.reduce((s, [, d]) => s + d, 0);
	let u = ((t % total) + total) % total;
	for (let i = 0; i < HAND_TEST_SEQUENCE.length; i++) {
		const [id, d] = HAND_TEST_SEQUENCE[i];
		if (u < d) return { id, index: i, local: u };
		u -= d;
	}
	return { id: HAND_TEST_SEQUENCE[0][0], index: 0, local: 0 };
}

/**
 * The moving hand: joints that follow a target pose like a real one. setTarget(pose) queues each finger `HAND_MOTION.lag[finger]` s after the previous (unless `lag: false`), and every joint
 * (3 curls + spread per finger, wrist flexion, deviation, roll) is a damped spring toward its target, the outer joints slower (HAND_MOTION.omega). `pose` is always inside the limits.
 */
export class HandMotion {
	constructor(pose = presetPose('relaxed')) { // (a pose; the profile's presets are made with presetPose(id, t, profile))
		this.cur = copyPose(pose);
		this.vel = emptyPose();
		this.tgt = copyPose(pose);
		this.pending = [];
		this.time = 0;
	}

	setTarget(pose, { instant = false, lag = true } = {}) {
		const p = clampPose(pose);
		this.pending = [];
		if (instant) {
			this.cur = copyPose(p);
			this.tgt = copyPose(p);
			this.vel = emptyPose();
			return;
		}
		for (const f of FINGER_NAMES) {
			const at = this.time + (lag ? HAND_MOTION.lag[f] : 0);
			if (at <= this.time) this.tgt.fingers[f] = { curl: [...p.fingers[f].curl], spread: p.fingers[f].spread };
			else this.pending.push({ f, at, v: { curl: [...p.fingers[f].curl], spread: p.fingers[f].spread } });
		}
		this.tgt.wrist = { ...p.wrist };
		this.tgt.roll = p.roll;
	}

	update(dt) {
		const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
		const h = dt / steps;
		for (let n = 0; n < steps; n++) {
			this.time += h;
			if (this.pending.length) {
				this.pending = this.pending.filter((e) => {
					if (e.at > this.time) return true;
					this.tgt.fingers[e.f] = e.v;
					return false;
				});
			}
			const z = HAND_MOTION.zeta;
			const spring = (x, v, target, w) => {
				const a = w * w * (target - x) - 2 * z * w * v;
				const nv = v + a * h;
				return [x + nv * h, nv];
			};
			for (const f of FINGER_NAMES) {
				const c = this.cur.fingers[f];
				const v = this.vel.fingers[f];
				const t = this.tgt.fingers[f];
				for (let k = 0; k < 3; k++) [c.curl[k], v.curl[k]] = spring(c.curl[k], v.curl[k], t.curl[k], HAND_MOTION.omega.curl[k]);
				[c.spread, v.spread] = spring(c.spread, v.spread, t.spread, HAND_MOTION.omega.spread);
			}
			[this.cur.wrist.flex, this.vel.wrist.flex] = spring(this.cur.wrist.flex, this.vel.wrist.flex, this.tgt.wrist.flex, HAND_MOTION.omega.flex);
			[this.cur.wrist.dev, this.vel.wrist.dev] = spring(this.cur.wrist.dev, this.vel.wrist.dev, this.tgt.wrist.dev, HAND_MOTION.omega.dev);
			[this.cur.roll, this.vel.roll] = spring(this.cur.roll, this.vel.roll, this.tgt.roll, HAND_MOTION.omega.roll);
		}
		this.cur = clampPose(this.cur);
		return this.cur;
	}

	get pose() {
		return this.cur;
	}
}

/**
 * Find the finger bones under `root` (an Object3D: a cloned GLB scene, whose local axes are the hand frame) and return a driver. { found, missing, hasFingers, hasRoot,
 * hasWrist, bones: [{ finger, seg, bone, rest, curl, spread, along }] (axes in each bone's LOCAL frame, derived as described at FINGER_BONES), apply(offer, grip, sway) }.
 * `frame` = the object whose axes are the hand frame (default `root`). Missing bones are skipped.
 */
export function createFingerRig(root, table = FINGER_BONES, axes = FINGER_AXES, frame = root, poses = FINGER_POSES) {
	const byName = new Map();
	root.traverse((o) => {
		if (o.name) byName.set(normBone(o.name), o);
	});
	frame.updateWorldMatrix(true, true);
	const inv = new THREE.Matrix4().copy(frame.matrixWorld).invert();
	const inHand = (o) => {
		const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		m.decompose(pos, quat, new THREE.Vector3());
		return { pos, quat };
	};
	const found = [];
	const missing = [];
	const bones = [];
	for (const [finger, names] of Object.entries(table.fingers)) {
		const objs = names.map((n) => byName.get(normBone(n)));
		objs.forEach((bone, seg) => {
			if (!bone) return missing.push(names[seg]);
			found.push(names[seg]);
			const me = inHand(bone);
			const next = objs.slice(seg + 1).find(Boolean);
			const prev = objs.slice(0, seg).reverse().find(Boolean);
			const along = new THREE.Vector3(0, 0, 1);
			if (next) along.copy(inHand(next).pos).sub(me.pos);
			else if (prev) along.copy(me.pos).sub(inHand(prev).pos);
			if (along.lengthSq() < 1e-12) along.set(0, 0, 1);
			along.normalize();
			let curlH;
			let spreadH;
			const o = axes[finger];
			if (o) {
				curlH = new THREE.Vector3(...o.curl).normalize();
				spreadH = new THREE.Vector3(...o.spread).normalize();
			} else {
				const n = PALM.clone().addScaledVector(along, -PALM.dot(along)); // the palm direction across the finger
				if (n.lengthSq() < 1e-6) n.set(1, 0, 0);
				n.normalize();
				curlH = new THREE.Vector3().crossVectors(along, n).normalize();
				// self-check: +5 deg about the curl axis must bring the tip toward the palm; flip otherwise
				const turned = along.clone().applyAxisAngle(curlH, 5 * DEG);
				if (turned.dot(PALM) <= along.dot(PALM)) curlH.negate();
				spreadH = new THREE.Vector3().crossVectors(along, curlH).normalize();
				if (spreadH.y < 0) spreadH.negate(); // the spread axis points to the dorsum: positive spread = toward +x for a finger along +z
			}
			const toLocal = me.quat.clone().invert();
			bones.push({ finger, seg, bone, rest: bone.quaternion.clone(), along, curlH, spreadH, curl: curlH.clone().applyQuaternion(toLocal), spread: spreadH.clone().applyQuaternion(toLocal) });
		});
	}
	const q = new THREE.Quaternion();
	const tmp = { curl: [0, 0, 0], spread: 0 };
	return {
		found, missing, bones,
		hasFingers: bones.length > 0,
		hasRoot: byName.has(normBone(table.root)),
		hasWrist: byName.has(normBone(table.wrist)),
		apply(offer = 0, grip = 0, sway = 0) {
			for (const b of bones) {
				fingerAngles(b.finger, offer, grip, sway, tmp, poses);
				b.bone.quaternion.copy(b.rest);
				if (b.seg === 0) b.bone.quaternion.multiply(q.setFromAxisAngle(b.spread, tmp.spread * DEG));
				b.bone.quaternion.multiply(q.setFromAxisAngle(b.curl, tmp.curl[b.seg] * DEG));
			}
		},
		/** Drive every finger bone to an explicit pose ({ fingers: { index: { curl: [mcp, pip, dip], spread } ... } }, degrees, limits applied): the hand-test mode. */
		applyPose(pose) {
			for (const b of bones) {
				const f = pose.fingers[b.finger];
				if (!f) continue;
				const [lo, hi] = HAND_LIMITS[b.finger].curl[b.seg];
				b.bone.quaternion.copy(b.rest);
				if (b.seg === 0) b.bone.quaternion.multiply(q.setFromAxisAngle(b.spread, clamp(f.spread, ...HAND_LIMITS[b.finger].spread) * DEG));
				b.bone.quaternion.multiply(q.setFromAxisAngle(b.curl, clamp(f.curl[b.seg], lo, hi) * DEG));
			}
		},
	};
}

/**
 * The forearm and wrist joints (bones `forearm`, `wrist`): flexion (toward the palm +), deviation (toward the thumb +) and the roll of the forearm (toward the thumb side +: the palm turns toward the thumb)
 * about the hand frame's axes x, y, z, turned into each bone's local frame like the fingers' and signed by a self-check on the geometry (the palm moves the way it should, the thumb tells the side).
 * A missing bone is skipped; { has: { wrist, forearm } } says which. `frame` = the object whose axes are the hand frame (default `root`).
 */
export function createJointRig(root, table = FINGER_BONES, frame = root) {
	const byName = new Map();
	root.traverse((o) => {
		if (o.name) byName.set(normBone(o.name), o);
	});
	frame.updateWorldMatrix(true, true);
	const inv = new THREE.Matrix4().copy(frame.matrixWorld).invert();
	const inHand = (o) => {
		const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		m.decompose(pos, quat, new THREE.Vector3());
		return { pos, quat };
	};
	const thumb = byName.get(normBone(table.fingers.thumb[0]));
	const index = byName.get(normBone(table.fingers.index[0]));
	const thumbSide = thumb && index ? Math.sign(inHand(thumb).pos.x - inHand(index).pos.x) || 1 : 1; // the thumb is on this side of x in the hand frame
	const mk = (name, axisH) => {
		const bone = byName.get(normBone(name));
		if (!bone) return null;
		const me = inHand(bone);
		return { bone, rest: bone.quaternion.clone(), axis: axisH.clone().normalize().applyQuaternion(me.quat.clone().invert()) };
	};
	// flexion: +x or -x such that the fingers (+z) move toward the palm (-y) for a positive angle: rotation about x by +a turns +z toward -y when a > 0 for -x... checked, not assumed
	const toward = (axis, from, to) => from.clone().applyAxisAngle(axis, 5 * DEG).dot(to) > from.dot(to);
	const flexAxis = toward(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), PALM) ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
	const devAxis = toward(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(thumbSide, 0, 0)) ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
	const rollAxis = toward(new THREE.Vector3(0, 0, 1), PALM, new THREE.Vector3(thumbSide, 0, 0)) ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1);
	const wrist = [mk(table.wrist, flexAxis), mk(table.wrist, devAxis)];
	const forearm = mk(table.forearm ?? 'forearm', rollAxis);
	const twist = mk(table.twist ?? 'forearm_twist', rollAxis); // the bone between the cuff and the braided cord (H2_FL_hand_rig): it takes -theta/2 so the skin between them is twisted by half, not torn
	const q = new THREE.Quaternion();
	return {
		has: { wrist: !!wrist[0], forearm: !!forearm, twist: !!twist },
		axes: { flex: flexAxis, dev: devAxis, roll: rollAxis, thumbSide },
		apply(pose) {
			if (wrist[0]) {
				wrist[0].bone.quaternion.copy(wrist[0].rest);
				wrist[0].bone.quaternion.multiply(q.setFromAxisAngle(wrist[0].axis, clamp(pose.wrist.flex, ...WRIST_LIMITS.flex) * DEG));
				wrist[0].bone.quaternion.multiply(q.setFromAxisAngle(wrist[1].axis, clamp(pose.wrist.dev, ...WRIST_LIMITS.dev) * DEG));
			}
			if (forearm) {
				forearm.bone.quaternion.copy(forearm.rest);
				const roll = clamp(pose.roll, ...WRIST_LIMITS.roll);
				forearm.bone.quaternion.multiply(q.setFromAxisAngle(forearm.axis, roll * DEG));
				if (twist) {
					twist.bone.quaternion.copy(twist.rest);
					twist.bone.quaternion.multiply(q.setFromAxisAngle(twist.axis, -0.5 * roll * DEG));
				}
			}
		},
	};
}

// ---- the showcase: what a hand shows of its CLASS the moment it is chosen -------------------------------------------------------------------
/**
 * Piecewise keyframes [[t, value], ...] sampled with a smoothstep between neighbours (clamped outside). The whole showcase is data of this kind: no clips, no timeline objects.
 */
export function keyAt(keys, t) {
	if (!keys || !keys.length) return 0;
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		if (t <= keys[i][0]) {
			const [t0, v0] = keys[i - 1];
			const [t1, v1] = keys[i];
			const u = (t - t0) / (t1 - t0 || 1);
			return lerp(v0, v1, u * u * (3 - 2 * u));
		}
	}
	return keys[keys.length - 1][1];
}

/**
 * Small hand-drawn-style VFX. `pool` 'alpha' = soft grey grains lit by the candle (normal blending), 'add' = tiny additive points (no bloom: a few px, dim). size / life are [min, max]
 * (m, s), `vel` the initial velocity (m/s) as [vx, vy, vz] ranges' half-widths + a mean [mx, my, mz], gravity m/s2 (+ down), drag 1/s, colour = an sRGB hex or [from, to] over the
 * life, `twinkle` = size flicker rate (salt), `grow` = size grows to this factor by the end of life (smoke). ART DIRECTION: warm fire only for lamp / coals / pyre, the cold
 * white-blue still points ONLY for the Ossuarist, never a white-gold halo.
 */
export const FX_PRESETS = {
	// sprite = the shape (scenes/choiceHands.js fxSprite): a jagged chip of stone / plaster, a glint, a soft point, a streak (turned along its velocity), a wisp; spin = rad/s about the view axis
	dust: { pool: 'alpha', sprite: 'shard', size: [0.0170, 0.0408], life: [0.9, 1.8], mean: [0, 0, 0], spread: [0.05, 0.03, 0.05], gravity: 0.55, drag: 1.2, spin: 4, aspect: 0.85, colour: '#6e695f' },
	flake: { pool: 'alpha', sprite: 'shardB', size: [0.0272, 0.0578], life: [1.2, 2.3], mean: [0, -0.02, 0], spread: [0.05, 0.02, 0.05], gravity: 0.4, drag: 1.4, spin: 3, colour: '#a39d8f' },
	soul: { pool: 'add', sprite: 'point', size: [0.0272, 0.0510], life: [1.6, 2.6], mean: [0, 0.07, 0], spread: [0.015, 0.02, 0.015], gravity: -0.01, drag: 0.8, colour: '#9fd0ff', fade: 'bell' },
	salt: { pool: 'add', sprite: 'crystal', size: [0.0180, 0.0380], life: [1.0, 1.9], mean: [0, -0.02, 0], spread: [0.03, 0.01, 0.03], gravity: 0.3, drag: 1.1, spin: 1.5, colour: ['#f2f8f4', '#9fb9c4'], twinkle: 18 },
	ember: { pool: 'add', sprite: 'streak', streak: 4.5, size: [0.0136, 0.0272], life: [0.9, 1.9], mean: [0, 0.2, 0], spread: [0.06, 0.05, 0.06], gravity: -0.06, drag: 0.5, colour: ['#ffb060', '#c8401a'], sway: 0.05 },
	smoke: { pool: 'alpha', sprite: 'puff', size: [0.0510, 0.1020], life: [1.6, 2.6], mean: [0, 0.07, 0], spread: [0.012, 0.01, 0.012], gravity: -0.05, drag: 0.7, spin: 0.3, colour: '#5c5853', grow: 2.4, sway: 0.03 },
};

/**
 * SHOWCASE: per class (by slot id, so the stand-ins PB EX PS borrow nothing: they run THEIR class's showcase on the donor's mesh). Time in seconds from the moment the hand has
 * come out; `dur` is when the hand rests in its offer pose again.
 *   roll   deg about the forearm: where the hand starts and how it turns to show its marks, must end at 0 (the offer pose);
 *   squeeze/tremor   a uniform squeeze about the wrist (0..0.1) and a shake (m);
 *   grip   finger fist 0..1 for a RIGGED hand (FINGER_POSES, see FINGER_BONES); a static hand uses `squeeze` for the clench;
 *   cam    { dist m, elev deg, yaw: keys deg } an orbit round the hand (yaw mirrored for the right-hand slots so it always turns toward the middle);
 *   light  { colour, anchor, dist, intensity: keys, offset?: moving offset along x of the anchor: keys }: ONE extra point light with the class's colour;
 *   offer  (optional) { colour, anchor, dist, intensity }: the class light that stays on after the showcase, in the offer pose (same scale as light.intensity: x CLASS_LIGHT_SCALE);
 *   shake  multiplier of the candle's flicker (keys): "the candle shakes harder one beat";
 *   flame  an oil flame at the anchor (strength keys); fx  [{ kind, at: anchor, from, to, rate/s, spread? }].
 * Anchors (computeAnchors): wrist, palm, dorsum, knuckles, thumb, tip.
 */
export const SHOWCASE = {
	PB: {
		dur: 3.8, note: 'Găng sắt, đinh quan tài bạc trên khớp, vết dây hằn trong lòng tay',
		roll: [[0, 0], [0.35, 0], [0.85, 170], [1.35, 170], [2.1, 0], [3.8, 0]],
		squeeze: [[2.15, 0], [2.45, 0.05], [2.75, 0.05], [3.15, 0]], tremor: [[2.15, 0], [2.4, 0.003], [2.8, 0]], grip: [[2.15, 0], [2.5, 1], [2.85, 1], [3.4, 0]],
		offer: { colour: '#ffcf9a', anchor: 'palm', dist: 1.5, intensity: 1.5 }, // after the showcase: a soft warm light keeps the steel readable at the edge of the wall
		cam: { dist: 0.95, elev: 44, yaw: [[0, -34], [2.1, 4], [3.8, 14]] },
		light: { colour: '#b6c4dc', anchor: 'knuckles', dist: 0.7, intensity: [[0, 0], [0.5, 0.9], [1.7, 0.9], [2.2, 0.15], [3.8, 0]], offset: [[0.45, 0.075], [1.75, -0.075]] },
		fx: [{ kind: 'dust', at: 'knuckles', from: 2.3, to: 3.0, rate: 85 }, { kind: 'dust', at: 'wrist', from: 2.35, to: 2.8, rate: 40 }],
	},
	FL: {
		dur: 3.6, note: 'Dây thắt nút quấn hai vòng cổ tay, cổ tay áo đen của nữ tu',
		roll: [[0, 0], [0.4, 26], [0.9, 26], [2.5, 0], [3.6, 0]],
		squeeze: [[0.5, 0], [0.95, 0.07], [1.35, 0.07], [1.8, 0]], tremor: [[0.7, 0], [1.1, 0.004], [2.0, 0.0035], [2.4, 0]], grip: [[0.7, 0], [1.1, 0.8], [1.9, 0.8], [2.6, 0]],
		cam: { dist: 0.9, elev: 40, yaw: [[0, 24], [1.6, -8], [3.6, 6]] },
		light: { colour: '#ffb870', anchor: 'wrist', dist: 0.55, intensity: [[0, 0], [3.6, 0]] }, // none of its own: the cord, the tremor and the candle that shakes are the whole showcase
		shake: [[0, 1], [0.85, 1], [1.05, 3.2], [1.6, 3.2], [2.0, 1], [3.6, 1]],
		fx: [{ kind: 'flake', at: 'wrist', from: 1.0, to: 1.7, rate: 30 }, { kind: 'dust', at: 'palm', from: 1.2, to: 2.2, rate: 22 }],
	},
	OS: {
		dur: 3.8, note: 'Bàn tay già: mực và vữa trong nếp tay, nhẫn đốt xương',
		roll: [[0, 0], [0.4, 0], [0.95, 160], [1.7, 160], [2.5, 0], [3.8, 0]],
		squeeze: [], tremor: [], grip: [],
		cam: { dist: 0.9, elev: 42, yaw: [[0, -26], [2.4, 10], [3.8, 18]] },
		light: { colour: '#8ec0ff', anchor: 'palm', dist: 0.5, intensity: [[0, 0], [0.8, 0.22], [2.6, 0.22], [3.8, 0]] },
		fx: [{ kind: 'soul', at: 'tip', from: 0.8, to: 2.8, rate: 3.2, spread: 0.09, lift: 0.025 }, { kind: 'flake', at: 'palm', from: 0.6, to: 2.6, rate: 8, lift: 0.02 }, { kind: 'dust', at: 'palm', from: 1.8, to: 2.8, rate: 10, lift: 0.02 }],
	},
	BR: {
		dur: 3.6, note: 'Muối nứt trắng ngả xanh, tay áo ố vệt triều, vòng vỏ sò',
		roll: [[0, 0], [0.4, 0], [0.9, 160], [1.7, 160], [2.4, 0], [3.6, 0]],
		squeeze: [], tremor: [], grip: [],
		offer: { colour: '#ffd6a8', anchor: 'palm', dist: 1.4, intensity: 0.8 }, // the darkest skin after the steel: it hovers at the edge of readable (mean ~50/255) without it
		cam: { dist: 0.92, elev: 44, yaw: [[0, 30], [2.2, -6], [3.6, -14]] },
		light: { colour: '#bfe0ee', anchor: 'palm', dist: 0.55, intensity: [[0, 0], [1.0, 0], [1.3, 0.8], [2.0, 0.15], [3.6, 0]] },
		fx: [{ kind: 'salt', at: 'thumb', from: 0.6, to: 3.0, rate: 32, spread: 0.05, lift: 0.07 }, { kind: 'salt', at: 'tip', from: 1.2, to: 3.0, rate: 14, spread: 0.05, lift: 0.07 }],
	},
	EX: {
		dur: 3.8, note: 'Găng tẩm dầu đèn, chai ngón cái',
		roll: [[0, 0], [0.35, 50], [0.8, 50], [1.25, 0], [3.8, 0]],
		squeeze: [[1.0, 0], [1.2, 0.04], [1.45, 0]], tremor: [], grip: [[0.9, 0], [1.25, 0.6], [1.6, 0.3], [2.2, 0]],
		cam: { dist: 0.85, elev: 40, yaw: [[0, -22], [2.0, 6], [3.8, 12]] },
		light: { colour: '#ffa24a', anchor: 'palm', dist: 0.6, intensity: [[0, 0], [1.1, 0], [1.3, 1.0], [2.3, 0.9], [2.55, 0], [3.8, 0]] },
		flame: { anchor: 'palm', lift: 0.02, strength: [[0, 0], [1.1, 0], [1.3, 1], [2.3, 0.9], [2.55, 0], [3.8, 0]] },
		fx: [{ kind: 'smoke', at: 'palm', from: 2.5, to: 3.5, rate: 9, lift: 0.03 }, { kind: 'ember', at: 'palm', from: 1.3, to: 1.7, rate: 14, lift: 0.02 }],
	},
	PS: {
		dur: 3.8, note: 'Sẹo bỏng, tro dưới móng, bím chỉ đỏ',
		roll: [[0, 0], [0.4, 38], [0.9, 38], [2.2, 0], [3.8, 0]],
		squeeze: [], tremor: [[1.0, 0], [1.6, 0.0018], [2.6, 0.001], [3.2, 0]], grip: [[1.0, 0], [1.6, 0.35], [2.8, 0.2], [3.3, 0]],
		cam: { dist: 0.9, elev: 42, yaw: [[0, 28], [2.2, -4], [3.8, -12]] },
		light: { colour: '#ff7a2a', anchor: 'palm', dist: 0.55, intensity: [[0, 0], [0.7, 0.2], [1.8, 1.1], [3.0, 0.5], [3.8, 0]] },
		fx: [{ kind: 'ember', at: 'palm', from: 0.8, to: 2.9, rate: 24, spread: 0.05, lift: 0.02 }, { kind: 'dust', at: 'tip', from: 1.5, to: 2.6, rate: 10 }],
	},
};
/** The showcase camera's framing: the hand's bounding sphere fills `fill` of the frame height and its centre sits at `centreY` of it from the top (the quote is below). */
export const SHOWCASE_FIT = { fill: 0.9, centreY: 0.38 };
/** The class light's table values (showcase `light.intensity`, `offer.intensity`) are in one scale: PointLight intensity = value x this. */
export const CLASS_LIGHT_SCALE = 0.2;
export const SHOWCASE_ORDER = ['PB', 'FL', 'OS', 'BR', 'EX', 'PS'];

/**
 * Anchors of a hand mesh in the ARM frame from its vertices (flat xyz array): where the showcase's effects are born. Only the parts that can be found are returned (merge
 * over fallbackAnchors). wrist = the axis point at the wrist (z = wristZ); tip = the 40 highest-z vertices; dorsum = the highest-y vertices of the middle of the back of the
 * hand (wrist + 0.02..0.06); knuckles = the same on the knuckle row (wrist + 0.06..0.11); palm = the lowest-y vertices of the first 8 cm beyond the wrist; thumb = the
 * vertices that stick out farthest sideways on the thumb's side, between the wrist and wrist + 0.13 (a sleeve hem below the wrist is not the thumb).
 */
export function computeAnchors(positions, wristZ) {
	const n = Math.floor(positions.length / 3);
	const X = (i) => positions[i * 3];
	const Y = (i) => positions[i * 3 + 1];
	const Z = (i) => positions[i * 3 + 2];
	const pick = (lo, hi) => {
		const out = [];
		for (let i = 0; i < n; i++) if (Z(i) > wristZ + lo && Z(i) < wristZ + hi && Number.isFinite(X(i) + Y(i))) out.push(i);
		return out;
	};
	const mean = (ids) => {
		const v = new THREE.Vector3();
		for (const i of ids) v.add(new THREE.Vector3(X(i), Y(i), Z(i)));
		return v.multiplyScalar(1 / ids.length);
	};
	const top = (ids, key, count, dir = 1) => ids.slice().sort((a, b) => dir * (positions[b * 3 + key] - positions[a * 3 + key])).slice(0, count);
	const out = { wrist: new THREE.Vector3(0, 0, wristZ) };
	const set = (name, ids) => {
		if (ids.length) out[name] = mean(ids);
	};
	const all = [];
	for (let i = 0; i < n; i++) all.push(i);
	set('tip', top(all, 2, 40));
	const band = pick(0, 0.08);
	set('dorsum', top(pick(0.02, 0.06), 1, 30));
	set('knuckles', top(pick(0.06, 0.11), 1, 30));
	set('palm', top(band, 1, 30, -1));
	const side = pick(0, 0.13);
	if (band.length && side.length) {
		const cx = mean(band).x;
		let far = 0;
		for (const i of side) if (Math.abs(X(i) - cx) > Math.abs(far)) far = X(i) - cx;
		const sgn = far < 0 ? -1 : 1; // the thumb side: where the mesh reaches farthest from the middle of the hand
		set('thumb', side.slice().sort((a, b) => sgn * (X(b) - X(a))).slice(0, 14));
	}
	return out;
}

/** Anchors from the model table alone (no mesh to measure, or a mesh that gave nothing): the showcase still has a place for every effect. */
export function fallbackAnchors(model) {
	const w = model.wrist;
	const tip = model.tip ?? [0, -0.03, w + 0.18];
	return {
		wrist: new THREE.Vector3(0, 0, w),
		tip: new THREE.Vector3(...tip),
		knuckles: new THREE.Vector3(0, 0.03, w + 0.085),
		dorsum: new THREE.Vector3(0, 0.03, w + 0.04),
		palm: new THREE.Vector3(0, -0.03, w + 0.05),
		thumb: new THREE.Vector3(0.07, 0, w + 0.06),
	};
}

/** The mesh whose vertices say where the hand's parts are: the one named 'hand', else the largest; skinned meshes too (their position attribute is the bind pose). */
function pickHandMesh(root) {
	let best = null;
	root.traverse((o) => {
		if (!o.isMesh || !o.geometry?.attributes?.position) return;
		const count = o.geometry.attributes.position.count;
		if (count < 1000) return;
		if (!best || (o.name === 'hand' && best.name !== 'hand') || (best.name !== 'hand' && count > best.geometry.attributes.position.count)) best = o;
	});
	return best;
}

/** About `max` vertices of the hand mesh from a little before the wrist to the fingertips (arm frame, [x, y, z]): what the offer camera is fitted to (null: no mesh, the model table's points are used). */
export function sampleHandPoints(root, model, max = 240) {
	const best = pickHandMesh(root);
	if (!best) return null;
	const pos = best.geometry.attributes.position;
	const keep = [];
	for (let i = 0; i < pos.count; i++) if (pos.getZ(i) >= model.wrist - 0.045) keep.push(i);
	const step = Math.max(1, Math.floor(keep.length / max));
	const out = [];
	for (let k = 0; k < keep.length; k += step) out.push([pos.getX(keep[k]), pos.getY(keep[k]), pos.getZ(keep[k])]);
	return out.length ? out : null;
}

export function handAnchors(root, model) {
	const best = pickHandMesh(root);
	let found = {};
	if (best) {
		const attr = best.geometry.attributes.position;
		let arr = attr.array;
		if (attr.isInterleavedBufferAttribute || attr.itemSize !== 3) {
			arr = new Float32Array(attr.count * 3);
			for (let i = 0; i < attr.count; i++) arr.set([attr.getX(i), attr.getY(i), attr.getZ(i)], i * 3);
		}
		found = computeAnchors(arr, model.wrist);
	}
	return { ...fallbackAnchors(model), ...found };
}

// ---- easings -----------------------------------------------------------------------------------------------------------------------
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** Settles on 1 after a small overshoot (c1 = 1.05: ~4 %). */
export const easeOutBack = (t, c1 = 1.05) => {
	const c3 = c1 + 1;
	const u = t - 1;
	return 1 + c3 * u * u * u + c1 * u * u;
};
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
/** Exponential approach: `current` moves toward `target`, reaching 63 % after 1 / rate seconds, framerate independent. */
export const damp = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * dt));

// ---- arm geometry ------------------------------------------------------------------------------------------------------------------
/** Unit direction of an arm from the in-plane angle a (deg, 0 = down, + toward +x) and its lean out of the wall phi (deg). */
export function armDirection(a, phi, out = new THREE.Vector3()) {
	const A = a * DEG;
	const P = phi * DEG;
	return out.set(Math.sin(A) * Math.cos(P), -Math.cos(A) * Math.cos(P), Math.sin(P)).normalize();
}

/**
 * Quaternion of an arm whose forearm points along `dir` and whose hand shows its back (dorsum) or its palm toward `hint` (a world direction, the viewer-ish side):
 * local +z = dir, local +y = the back of the hand (= the hint side for 'back', the opposite for 'palm').
 */
export function armQuaternion(dir, hint, pose, twist = 0, out = new THREE.Quaternion()) {
	const z = dir.clone().normalize();
	const h = hint.clone().normalize();
	const y = h.addScaledVector(z, -h.dot(z)).normalize();
	if (pose === 'palm') y.negate();
	const x = new THREE.Vector3().crossVectors(y, z).normalize();
	y.crossVectors(z, x);
	out.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
	if (twist) out.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), twist * DEG));
	return out;
}

const HINT_BACK = new THREE.Vector3(0, 0.3, 1); // the back of the hand shown toward the viewer, a little up
const HINT_PALM = new THREE.Vector3(0, 0.55, 1); // the palm up and toward the viewer
/** Offered: EVERY hand ends palm up and a little inward (toward the screen centre) and toward the viewer, like a hand held out to be taken (a back-up hand turns over on the way). */
const reachHint = (side) => new THREE.Vector3(-side * 0.32, 1, 0.3);

/**
 * Everything static about one slot's arm: the hole in the wall (`entry`), the arm direction and orientation at rest and reached, the world positions of the tip, the wrist and
 * the hand centre at rest, and the reached hand centre (for the camera). Memoise with the slot's id by the caller (cheap anyway).
 */
export function armGeometry(slot, opts = {}) {
	const visible = opts.visible ?? slot.visible ?? ARM.visible; // slot.visible / slot.k: per-slot fit to the key art (calibrate script)
	const slideReach = opts.slide ?? ARM.slide;
	const sc = (opts.scale ?? 1) * (slot.k ?? 1); // the hands are drawn bigger than life in the key art: the scene scales each arm about its wall hole; lengths below are local (model) metres
	const dir = armDirection(slot.a, slot.phi);
	const entry = new THREE.Vector3(slot.entry[0], slot.entry[1], 0); // the hole in the wall: the arm axis crosses the wall plane here
	const tip = entry.clone().addScaledVector(dir, visible * sc);
	const model = HAND_MODELS[slot.source];
	const hintIdle = slot.pose === 'back' ? HINT_BACK : HINT_PALM;
	// the idle orientation shows the BACK to the viewer for 'back' hands, the PALM for 'palm' hands (armQuaternion's pose flag handles the sign)
	const qIdle = armQuaternion(dir, hintIdle, slot.pose, slot.twist);
	// reached: the arm swings out toward the screen centre, below horizontal; the mirror of the side keeps the same sign rule
	const side = Math.sign(slot.entry[0]) || 1;
	const yaw = -side * ARM.reachYaw * DEG;
	const pitch = ARM.reachPitch * DEG;
	const dirReach = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
	// a back-up hand shows its PALM when offered (pose flipped), a palm-up hand keeps its palm up
	const qReach = armQuaternion(dirReach, reachHint(side), 'palm', 0);
	// shortest path between the two (slerp takes the short way when the dot is positive)
	if (qIdle.dot(qReach) < 0) qReach.set(-qReach.x, -qReach.y, -qReach.z, -qReach.w);
	// how far the hand turns about its own forearm on the way out (swing-twist of idle -> offer), and the sign the showcase's roll must take to turn the OTHER way (a back-up hand
	// that has already turned +121 deg must not be rolled another +170: the sleeve would wind up to ~290 deg). Computed, not hard-coded: a changed twist or mirror stays right.
	const rel = qIdle.clone().invert().multiply(qReach);
	let twist = 2 * Math.atan2(rel.z, rel.w);
	if (twist > Math.PI) twist -= 2 * Math.PI;
	if (twist < -Math.PI) twist += 2 * Math.PI;
	const rollSign = Math.abs(twist) < 0.05 ? 1 : -Math.sign(twist);
	// along the arm axis, measured from the wall hole: the sleeve end is at -(HAND_LENGTH - visible), the wrist at model.wrist - (HAND_LENGTH - visible), the tip at +visible
	const back = HAND_LENGTH - visible;
	const at = (d, s, slide = 0) => entry.clone().addScaledVector(d, (s + slide) * sc);
	const palmReach = new THREE.Vector3(0, -1, 0).applyQuaternion(qReach); // the palm side of the offered hand (local -y)
	const geo = {
		dir, dirReach, qIdle, qReach, palmReach, entry, tip, back, scale: sc, visible, twist: twist / DEG, rollSign,
		wrist: at(dir, model.wrist - back),
		hand: at(dir, visible - 0.1), // the middle of the hand, about 10 cm behind the tip
		handReach: at(dirReach, visible - 0.1, slideReach),
		tipReach: at(dirReach, visible, slideReach),
		sleeveEnd: at(dir, -back),
	};
	// the camera of the offer (distance, yaw, framing shift) is fitted on first use: see fitOfferCamera
	const cache = new Map();
	const fitFor = (view) => {
		const key = `${view.fov.toFixed(2)}/${view.aspect}`;
		if (!cache.has(key)) cache.set(key, fitOfferCamera(slot, geo, view));
		return cache.get(key);
	};
	Object.defineProperty(geo, 'offerCamFor', { enumerable: false, value: fitFor });
	Object.defineProperty(geo, 'offerCam', { enumerable: false, get: () => fitFor({ aspect: OFFER_FIT.aspect, fov: OFFER_FIT.fov }) });
	return geo;
}

/** World direction of the palm (local -y: +y is the back of the hand in the models) of a slot's hand in the offer pose: the arm's reach orientation and the wrist's cup. EVERY class ends palm up. */
export function offerPalmNormal(slot, geo, out = new THREE.Vector3()) {
	const pose = armPose(slot, geo, { reach: 1 });
	const q = pose.quat.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pose.wrist));
	return out.set(0, -1, 0).applyQuaternion(q);
}

/** Shoulder-group number of a slot's arm in a given moment: weights in [0, 1] (hover, reach, retract) -> slide (m along the axis), the orientation, the wrist pitch (rad). */
export function armPose(slot, geo, w, out = { slide: 0, quat: new THREE.Quaternion(), wrist: 0, rise: 0 }) {
	const reach = w.reach ?? 0; // eased with overshoot already
	const hover = clamp(w.hover ?? 0, 0, 1);
	const retract = clamp(w.retract ?? 0, 0, 1);
	// slide out when chosen, a little when hovered, back into the wall when another hand is chosen (never past the hole: keep 4 cm of the tips out)
	const retractMax = Math.min(ARM.retract, geo.visible - 0.04);
	out.slide = ARM.slide * reach + ARM.hoverSlide * hover * (1 - clamp(reach, 0, 1)) - retractMax * retract;
	// orientation: idle -> reached (the hover turns a tenth of the way, the reach all the way), retract does not turn
	const turn = clamp(reach, -0.2, 1.15) + ARM.hoverTurn * hover * (1 - clamp(reach, 0, 1));
	out.quat.slerpQuaternions(geo.qIdle, geo.qReach, turn);
	const pitch = (slot.pose === 'back' ? ARM.wristBack : ARM.wristPalm) * DEG;
	out.wrist = pitch * clamp(reach, 0, 1.1);
	return out;
}

/** A point of a hand mesh (arm frame: origin = the sleeve end, +z fingers) in world space for a slot at rest (the mirror, the hand scale and the arm orientation included). */
export function armPointToWorld(slot, geo, p, out = new THREE.Vector3()) {
	const mirror = slot.mirror ? -1 : 1;
	out.set(mirror * p[0], p[1], p[2] - geo.back).multiplyScalar(geo.scale).applyQuaternion(geo.qIdle);
	return out.add(geo.entry);
}

/** The three measured points of a slot at rest, in key-art coordinates: the hole (`sleeve`), the wrist joint and the longest fingertip. */
export function slotMarkers(slot, geo = armGeometry(slot, { scale: HAND_SCALE })) {
	const model = HAND_MODELS[slot.source];
	return {
		sleeve: projectToKeyArt(geo.entry),
		wrist: projectToKeyArt(armPointToWorld(slot, geo, [0, 0, model.wrist])),
		tip: projectToKeyArt(armPointToWorld(slot, geo, model.tip)),
	};
}

/**
 * The offered hand's frame, solved (not guessed): the hand (from a little sleeve behind the wrist to the fingertips, with its width) fills `height` of the frame, sits with its
 * centre at `centreY` from the top, keeps `margin` from the left / right / top and stays above `floor` (the quote and the buttons are below); and the candle with its dish and
 * flame does NOT overlap the hand's box (`gap`): the camera yaws about the hand, the smallest turn that clears it. Pure math, a 30 deg lens at the lab's usual 1.92 aspect.
 */
export const OFFER_FIT = { height: 0.34, centreY: 0.4, margin: 0.06, floor: 0.68, gap: 0.015, fov: 30, aspect: 1.92 };

const _X = new THREE.Vector3(1, 0, 0);
/** The offered hand's key points in world space (the pose of armPose reach 1, wrist cup and slide included). */
export function offerHandPoints(slot, geo) {
	const model = HAND_MODELS[slot.source];
	const pose = armPose(slot, geo, { reach: 1 });
	const rx = new THREE.Quaternion().setFromAxisAngle(_X, pose.wrist);
	const mir = slot.mirror ? -1 : 1;
	const w = model.wrist;
	const local = geo.fitLocal ?? [[0, 0, w - 0.05], model.tip, [0.075, 0, w + 0.06], [-0.075, 0, w + 0.06], [0.03, 0.03, w + 0.12], [-0.03, -0.03, w + 0.12]]; // the real mesh's vertices when the scene gives them
	return local.map(([x, y, z]) => new THREE.Vector3(mir * x, y, z - w).applyQuaternion(rx).add(new THREE.Vector3(0, 0, w - geo.back + pose.slide)).multiplyScalar(geo.scale).applyQuaternion(pose.quat).add(geo.entry));
}
/** The candle's box corners (dish with its ring handle, wax, flame) in world space. */
function candleCorners() {
	const k = CANDLE.scale;
	const out = [];
	for (const x of [-0.082, 0.145]) for (const y of [0, 0.233]) for (const z of [-0.082, 0.082]) out.push(new THREE.Vector3(CANDLE.x + x * k, y * k, CANDLE.z + z * k));
	return out;
}
/** Camera position / target of the offer for a distance, a yaw (deg about the vertical through the hand) and a vertical shift of the target. */
function offerViewPose(geo, dist, yawDeg, shift, elevDeg = 0, out = { position: new THREE.Vector3(), target: new THREE.Vector3() }) {
	const focus = geo.handReach;
	// the offer is seen from in front of the fingertips and a little above the palm: the hand reaches TOWARD the viewer and the open palm reads (the key art's viewpoint)
	const view = geo.dirReach.clone().multiplyScalar(0.78).addScaledVector(geo.palmReach, 0.85).add(new THREE.Vector3(0, 0.03, 0.1)).normalize();
	view.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawDeg * DEG);
	if (elevDeg) {
		const h = new THREE.Vector3(view.x, 0, view.z).normalize();
		view.applyAxisAngle(new THREE.Vector3(0, 1, 0).cross(h), -elevDeg * DEG); // higher: looking down on the palm and the candle drops below the hand
	}
	out.position.copy(focus).addScaledVector(view, dist);
	out.target.copy(focus).addScaledVector(geo.dirReach, 0.06);
	out.target.y += shift;
	return out;
}

/** The lens the offer is seen through for a window of this aspect (the lab widens the vertical fov of narrow windows: fovForAspect), aspect quantised so a resize does not refit every pixel. */
export function offerView(aspect) {
	const a = Math.round(clamp(aspect, 0.6, 3) * 20) / 20;
	return { aspect: a, fov: fovForAspect(a, OFFER_FIT.fov) };
}

export function fitOfferCamera(slot, geo, view = { aspect: OFFER_FIT.aspect, fov: OFFER_FIT.fov }) {
	const fit = { ...OFFER_FIT, ...view };
	const cam = new THREE.PerspectiveCamera(fit.fov, fit.aspect, 0.1, 50);
	const hand = offerHandPoints(slot, geo);
	const candle = candleCorners();
	const box = (pts) => {
		const b = { x0: 9, x1: -9, y0: 9, y1: -9 };
		for (const p of pts) {
			const v = p.clone().project(cam);
			b.x0 = Math.min(b.x0, (v.x + 1) / 2);
			b.x1 = Math.max(b.x1, (v.x + 1) / 2);
			b.y0 = Math.min(b.y0, (1 - v.y) / 2);
			b.y1 = Math.max(b.y1, (1 - v.y) / 2);
		}
		return b;
	};
	const tan = Math.tan((fit.fov * DEG) / 2);
	const pose = { position: new THREE.Vector3(), target: new THREE.Vector3() };
	const turns = []; // [yaw, elevation] pairs, the smallest turn first
	for (let e = 0; e <= 32; e += 8) for (let y = 0; y <= 32; y += 8) turns.push([y, e], ...(y ? [[-y, e]] : []));
	turns.sort((a, b) => Math.abs(a[0]) * 2 + a[1] - (Math.abs(b[0]) * 2 + b[1])); // a turn to the side runs into the end of the wall (black beyond it): lifting the camera is cheaper
	// the frames tried at each turn: the hand's height in the frame and where its centre sits (a hand a little smaller / higher can clear the candle without another turn)
	const frames = [[fit.height, fit.centreY], [fit.height - 0.02, fit.centreY - 0.03], [fit.height - 0.04, fit.centreY - 0.06], [fit.height - 0.04, fit.centreY + 0.03]];
	let best = null;
	for (const [[yaw, elev], [height, centreY]] of turns.flatMap((t) => frames.map((f) => [t, f]))) {
		let dist = 1.1;
		let shift = 0.07;
		let hb;
		for (let it = 0; it < 6; it++) {
			offerViewPose(geo, dist, yaw, shift, elev, pose);
			cam.position.copy(pose.position);
			cam.lookAt(pose.target);
			cam.updateMatrixWorld(true);
			cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
			hb = box(hand);
			dist = clamp(dist * ((hb.y1 - hb.y0) / height), 0.45, 2.4);
			shift -= ((hb.y0 + hb.y1) / 2 - centreY) * 2 * dist * tan;
		}
		offerViewPose(geo, dist, yaw, shift, elev, pose);
		cam.position.copy(pose.position);
		cam.lookAt(pose.target);
		cam.updateMatrixWorld(true);
		cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
		hb = box(hand);
		const cb = box(candle);
		const sepX = Math.max(cb.x0 - hb.x1, hb.x0 - cb.x1);
		const sepY = Math.max(cb.y0 - hb.y1, hb.y0 - cb.y1);
		const clear = Math.max(sepX, sepY); // > 0: the boxes do not touch
		const inside = Math.min(hb.x0 - fit.margin, 1 - fit.margin - hb.x1, hb.y0 - fit.margin, fit.floor - hb.y1);
		const cand = { dist, yaw, elev, shift, height, clear, inside, ok: clear >= fit.gap && inside >= 0 };
		if (cand.ok) return cand; // the smallest turn that works
		const score = Math.min(clear - fit.gap, 0) + Math.min(inside, 0);
		if (!best || score > best.score) best = { ...cand, score };
	}
	return best; // nothing fits perfectly: the least bad
}

/**
 * Camera for a reached hand: the camera home dollies toward the hand and turns to it. p = 0 home, p = 1 the offer (fitted: geo.offerCam); `out.position / out.target` are Vector3s.
 */
export function cameraPose(geo, p, out = { position: new THREE.Vector3(), target: new THREE.Vector3() }, view = null) {
	const homeP = new THREE.Vector3(...FRAME.position);
	const homeT = new THREE.Vector3(...FRAME.target);
	const c = view ? geo.offerCamFor(view) : geo.offerCam;
	const reach = offerViewPose(geo, c.dist, c.yaw, c.shift, c.elev);
	out.target.lerpVectors(homeT, reach.target, p);
	out.position.lerpVectors(homeP, reach.position, p);
	return out;
}

/** Where the candle's light stands for a reached hand: in front of it, on the palm side and a little below (the flame lights the palm it offers). */
export function reachLight(geo, out = new THREE.Vector3()) {
	return out.copy(geo.handReach).addScaledVector(geo.palmReach, 0.5).addScaledVector(geo.dirReach, -0.12).add(new THREE.Vector3(0, -0.06, 0.15));
}

/** A reproducible hash in [0, 1) (grasp dust, particle seeds). */
export function hash01(i, seed = 0) {
	const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
	return s - Math.floor(s);
}

/** Candle flame brightness: the lab's 1/f flicker with the lab's layered-sine flutter on top (~1 on average). */
export function candleLevel(t, seed = 0) {
	return flicker1f(t, seed) * (0.9 + 0.12 * Math.sin(t * 9.1 + seed) * Math.sin(t * 3.7 + seed * 1.3));
}

/** What a UI line says for a slot (caption block): { name, quote, tag } with tag '' for a real model. */
export function captionFor(slot) {
	return { name: slot.name, quote: slot.quote, tag: slot.standIn ? 'stand-in · chưa dựng (đang dùng bản sao tay cùng tư thế)' : '' };
}

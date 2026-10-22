// ASHLAR · Act I base map 6 — THE CRADLE (LD 11.12, BIO-27 cell, boss arena, D5 C4, 20 min; scene id act1Cradle). Mercy's cell under the Garden of Hush:
// a pseudo-infinite nursery (LD §7.6). The player comes down a short crypt stair from the Garden of Hush (map 5) into an aisle between rows of identical
// giant bone-rail cribs that run on into black fog both ways, passes a pair of linen curtains into a round arena ringed by cribs and curtains, lit only by
// milk-white still night-lights (Perfection light: still, even, identical), where the Hospice Mother (B05) waits behind a bed made up for the hero. The
// boss mechanic is the light: the night-lights go out one by one (the scene's "Đèn ngủ còn lại" slider; Play can dim them automatically); the soft shadow
// of each hand falls on the floor before it strikes (telegraph markers). Palette: Mercy's linen (the one allowed clean white), milk-white still light, a
// tiny poppy red, black void; no human (warm, flickering) light anywhere. Remember: dozens of soft white hands bending to tuck you in while the
// night-lights go out one by one.
// Sizes (H = 1.8 m) from ashlar/art/act-01-environments/groups/A14_the_cradle/{perspective,turnaround}_scale_v2.png and their prompt (A14.1 crib 3.5H × 2H
// × 2H, A14.2 curtains 2.4H × 3H, A14.3 night-light 1.2H, A14.4 mobile 1.8H × 1.4H, A14.5 platform 3H × 3H × 0.4H, A14.6 runners 3H × 1.6H × 0.8H); B05
// from ashlar/art/map-01-concepts/monsters/B05_hospice_mother/vA/concept_r2.png (crown 2.75H, hands 3.00H) and ASHLAR_QUY_CHUAN_QUAI_VI.md (h 2.50–3.00H).
// Pure data + small pure helpers (the engine: ../interior.js; format documented at its top).
import { assetList } from '../interior.js';

const ARENA = { cx: 0, cz: -18, r: 16 };
const BOSS = [0, -26.5];
const H = 1.8;

// ---- blockout shapes (asset frame: pivot at the bottom centre, front = +z, metres) ---------------------------------------------------------------
function cribShape() {
	const parts = [];
	const px = 2.95;
	const pz = 1.6;
	for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
		parts.push({ p: 'cone', at: [sx * px, 0.18, sz * pz], size: [0.56, 0.36, 0.56], top: 0.62 });
		parts.push({ p: 'cyl', at: [sx * px, 1.72, sz * pz], size: [0.34, 3.1, 0.34] });
		parts.push({ p: 'sphere', at: [sx * px, 3.38, sz * pz], size: [0.52, 0.46, 0.52] });
	}
	parts.push({ p: 'box', at: [0, 0.68, 0], size: [5.6, 0.2, 3.0] }); // the slatted floor (and the hero's collision band)
	for (const sz of [-1, 1]) {
		parts.push({ p: 'box', at: [0, 0.68, sz * pz], size: [5.7, 0.26, 0.26] });
		parts.push({ p: 'box', at: [0, 3.02, sz * pz], size: [5.8, 0.24, 0.24] });
		for (let i = 0; i < 11; i++) parts.push({ p: 'box', at: [-2.4 + i * 0.48, 1.85, sz * pz], size: [0.13, 2.2, 0.13] }); // bone rails
	}
	for (const sx of [-1, 1]) {
		parts.push({ p: 'box', at: [sx * px, 0.68, 0], size: [0.26, 0.26, 3.0] });
		parts.push({ p: 'box', at: [sx * px, 3.02, 0], size: [0.24, 0.24, 3.0] });
		for (let i = 0; i < 5; i++) parts.push({ p: 'box', at: [sx * px, 1.85, -1.08 + i * 0.54], size: [0.13, 2.2, 0.13] });
	}
	return parts;
}

function curtainShape() {
	// the posts, finials, rod and cords take the asset category (prop: wood, solid in Play); only the drapes are Mercy's linen and the hem the red accent
	const parts = [];
	for (const s of [-1, 1]) {
		parts.push({ p: 'box', at: [s * 2.1, 0.12, 0], size: [0.5, 0.24, 0.5] });
		parts.push({ p: 'cyl', at: [s * 2.1, 2.72, 0], size: [0.28, 5.2, 0.28] });
		parts.push({ p: 'sphere', at: [s * 2.1, 5.36, 0], size: [0.38, 0.36, 0.38] });
		parts.push({ p: 'drape', at: [s * 1.42, 2.62, 0.12], size: [1.25, 4.95, 0.34], tie: 0.36, cat: 'linen' }); // tied back: the gap between the drapes is ~2 m
		parts.push({ p: 'box', at: [s * 1.42, 0.12, 0.12], size: [0.72, 0.1, 0.26], cat: 'accent' }); // the narrow poppy-red hem band
		parts.push({ p: 'box', at: [s * 1.62, 1.85, 0.16], size: [0.44, 0.1, 0.1] }); // tie-back cord
	}
	parts.push({ p: 'cyl', at: [0, 5.02, 0], size: [0.12, 4.42, 0.12], rot: [0, 0, 90] });
	return parts;
}

const NIGHT_LIGHT = [
	{ p: 'cyl', at: [0, 0.07, 0], size: [0.86, 0.14, 0.86] },
	{ p: 'cyl', at: [0, 0.19, 0], size: [0.5, 0.1, 0.5] },
	{ p: 'cyl', at: [0, 0.98, 0], size: [0.17, 1.58, 0.17] },
	{ p: 'cone', at: [0, 1.66, 0], size: [0.42, 0.3, 0.42], top: 1.35 }, // the carved claw cup (its rim stays inside the globe's outline seen from above)
	{ p: 'glow', at: [0, 1.81, 0], size: [0.7, 0.7, 0.7] }, // the milky globe (emits; follows the light's level)
];

function mobileShape() {
	const parts = [
		{ p: 'cyl', at: [-0.85, 0.08, 0], size: [0.95, 0.16, 0.95] },
		{ p: 'cyl', at: [-0.85, 1.55, 0], size: [0.18, 2.9, 0.18] },
		{ p: 'sphere', at: [-0.85, 3.04, 0], size: [0.3, 0.3, 0.3] },
		{ p: 'box', at: [-0.2, 3.1, 0], size: [1.5, 0.17, 0.17] },
		{ p: 'box', at: [0.45, 2.86, 0], size: [0.04, 0.46, 0.04] },
		{ p: 'box', at: [0.45, 2.62, 0], size: [1.55, 0.07, 0.07] },
	];
	// the hanging bones and their cords swing free: walk-through in Play (only the stand's foot blocks, like the engine's blocker)
	[[-0.25, 0.9], [0.1, 0.6], [0.45, 1.05], [0.8, 0.7], [1.15, 0.85]].forEach(([x, h], i) => {
		parts.push({ p: 'box', at: [x, 2.45, 0], size: [0.025, 0.3, 0.025], open: true });
		parts.push({ p: 'cyl', at: [x, 2.3 - h / 2, 0], size: [0.13, h, 0.13], rot: [0, 0, (i % 2 ? -1 : 1) * 6], open: true });
		parts.push({ p: 'sphere', at: [x, 2.3 - h, 0], size: [0.2, 0.16, 0.2], open: true });
	});
	return parts;
}

function platformShape() {
	const parts = [
		{ p: 'box', at: [0, 0.2, 0], size: [5.4, 0.4, 5.4] },
		{ p: 'box', at: [0, 0.44, 0], size: [5.36, 0.08, 5.36], cat: 'linen' }, // the quilt's base under the nine panes
	];
	for (const s of [-1, 1]) {
		parts.push({ p: 'box', at: [0, 0.425, s * 2.705], size: [5.42, 0.05, 0.03], cat: 'accent' }); // the narrow poppy-red trim round the edge
		parts.push({ p: 'box', at: [s * 2.705, 0.425, 0], size: [0.03, 0.05, 5.42], cat: 'accent' });
	}
	for (const ix of [-1, 0, 1]) for (const iz of [-1, 0, 1]) parts.push({ p: 'mound', at: [ix * 1.78, 0.57, iz * 1.78], size: [1.74, 0.3, 1.74], cat: 'linen' });
	return parts;
}

const RUNNERS = [
	{ p: 'arc', at: [0, 0.72, -1.2], size: [5.4, 1.44, 0.26], lift: 0.6 },
	{ p: 'arc', at: [0, 0.72, 1.2], size: [5.4, 1.44, 0.26], lift: 0.6 },
	{ p: 'box', at: [-1.5, 0.55, 0], size: [0.18, 0.18, 2.5] },
	{ p: 'box', at: [1.5, 0.55, 0], size: [0.18, 0.18, 2.5] },
];

/** The Hospice Mother: a veiled linen bell with a grey-violet hem, a hooded head to 2.75H and ten soft arms reaching to ±1.5H (hands 3.00H). */
function motherShape() {
	const parts = [
		{ p: 'cone', at: [0, 0.28, 0], size: [5.2, 0.56, 3.9], top: 0.92, cat: 'shade', seg: 24 }, // the grey-violet inner robe shows only at the hem
		{ p: 'cone', at: [0, 1.6, 0], size: [4.9, 3.2, 3.6], top: 0.45, cat: 'linen', seg: 24 },
		{ p: 'sphere', at: [0, 3.55, 0], size: [2.3, 1.4, 1.7], cat: 'linen' },
		{ p: 'cone', at: [0, 4.36, 0.05], size: [1.15, 1.18, 1.0], top: 0.14, cat: 'linen' },
		{ p: 'box', at: [0, 2.9, 0.86], size: [0.66, 2.9, 0.12], cat: 'linen' }, // the veil's front fall
		{ p: 'box', at: [0.9, 2.3, 1.3], size: [0.05, 0.5, 0.05], cat: 'prop' },
		{ p: 'glow', at: [0.9, 1.95, 1.32], size: [0.24, 0.32, 0.24] }, // her one small amber night-lamp (the sheet's #E0A050)
	];
	const tiers = [[1.75, 0.35, 2.2], [2.15, 1.0, 2.37], [2.55, 0.55, 2.3], [2.95, 1.15, 2.37], [3.35, 0.6, 2.1]]; // [y, forward, wrist reach]: fingertips at ±2.7 m = 3.00H
	for (const s of [-1, 1]) {
		for (const [y, f, reach] of tiers) {
			const a = [s * 1.0, y, f * 0.3];
			const b = [s * reach, y - 0.28, f];
			const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
			const len = Math.hypot(...d);
			const rz = (Math.acos(d[1] / len) * 180) / Math.PI;
			const ry = (Math.atan2(d[2], -d[0]) * 180) / Math.PI;
			parts.push({ p: 'cyl', at: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], size: [0.2, len, 0.2], rot: [0, ry, rz], cat: 'skin', seg: 8 });
			parts.push({ p: 'sphere', at: [b[0] + s * 0.12, b[1] - 0.02, b[2] + 0.04], size: [0.42, 0.16, 0.34], cat: 'skin' });
		}
	}
	return parts;
}

// ---- KIT: every model the map needs (status: glb | kit | procedural | blockout) ------------------------------------------------------------------
export const KIT = {
	'A14.1': {
		name: 'Bone-rail crib frame', short: 'Cũi xương', category: 'prop', size: [3.5 * H, 2 * H, 2 * H], status: 'blockout', source: 'concept A14 cell 1 (perspective / turnaround scale v2)',
		segment: 'aisle · arena', note: 'arena-scale empty crib (giant: 2H tall); rows into the fog are the same model', shape: cribShape(),
	},
	'A14.2': {
		name: 'Linen curtain pair', short: 'Màn lanh đôi', category: 'prop', size: [2.4 * H, 3 * H, 0.7], status: 'blockout', source: 'concept A14 cell 2', segment: 'arena',
		note: 'wooden posts + rod (block), tied-back linen drapes (walk-through cloth)', shape: curtainShape(), openCats: ['linen', 'accent'], blockers: [{ at: [-2.1, 0], r: 0.45 }, { at: [2.1, 0], r: 0.45 }],
	},
	'A14.3': {
		name: 'Milk-white night-light', short: 'Đèn ngủ trắng sữa', category: 'prop', size: [0.6 * H, 1.2 * H, 0.6 * H], status: 'blockout', source: 'concept A14 cell 3', segment: 'aisle · arena',
		note: 'still Perfection light; the arena ten go out one by one (slider)', shape: NIGHT_LIGHT, round: true, foot: [0.6, 0.6],
		light: { kind: 'perfection', y: 1.81, color: '#f2ecdf', range: 10, intensity: 24, glow: 1.35, glowGain: 0.62, pool: 3.4, poolGain: 0.14, group: 'nightlight' },
	},
	'A14.4': {
		name: 'Bone mobile on stand', short: 'Chuông xương treo', category: 'prop', size: [1.4 * H, 1.8 * H, 0.9], status: 'blockout', source: 'concept A14 cell 4', segment: 'arena',
		note: 'only the stand blocks; the hanging bones are walk-through', shape: mobileShape(), blockers: [{ at: [-0.85, 0], r: 0.5 }],
	},
	'A14.5': {
		name: 'Quilted floor platform', short: 'Bục chăn chần', category: 'linen', size: [3 * H, 0.4 * H, 3 * H], status: 'blockout', source: 'concept A14 cell 5', segment: 'arena',
		note: 'the bed made up for the hero (0.72 m: too high to step on)', shape: platformShape(),
	},
	'A14.6': {
		name: 'Rocker runner pair', short: 'Đế bập bênh', category: 'prop', size: [3 * H, 0.8 * H, 1.6 * H], status: 'blockout', source: 'concept A14 cell 6', segment: 'arena',
		note: "one under Mercy's cradle behind the boss, two lying loose", shape: RUNNERS, collider: 1.0, // the runners' middle is 0.58 m: under Play's 0.6 m step
	},
	'N-CR01': {
		name: 'Linen floor runner', short: 'Thảm lanh lối đi', category: 'linen', size: [2.4, 0.03, 36], status: 'blockout', source: 'LD only, no concept', segment: 'aisle',
		note: 'a clean linen strip down the aisle into the arena (Mercy leads you in)', shape: [{ p: 'plane', at: [0, 0.015, 0], size: [2.4, 0.03, 36] }], solid: false,
	},
	'N-CR02': {
		name: 'Turned-down quilt', short: 'Chăn lật sẵn', category: 'linen', size: [3.0, 0.24, 2.6], status: 'blockout', source: 'LD only, no concept', segment: 'arena',
		note: 'on the platform: the bed is made for you', shape: [{ p: 'box', at: [0, 0.09, 0.25], size: [3.0, 0.16, 2.1] }, { p: 'box', at: [0, 0.18, -0.95], size: [3.0, 0.12, 0.5] }], solid: false,
	},
	'N-CR03': {
		name: 'Linen pillow', short: 'Gối lanh', category: 'linen', size: [1.5, 0.32, 0.75], status: 'blockout', source: 'LD only, no concept', segment: 'arena',
		shape: [{ p: 'mound', at: [0, 0.16, 0], size: [1.5, 0.32, 0.75] }], solid: false,
	},
	'N-CR04': {
		name: 'Crypt stair + arch from the Garden of Hush', short: 'Cầu thang hầm', category: 'structure', size: [3, 1.8, 5], status: 'procedural', source: 'LD only, no concept',
		segment: 'stair', note: 'built by the engine: 9 treads + vault-tile walls + a gothic arch; final art needs a stair / arch kit', unplaced: 'built by the engine (walls, treads, arch)',
	},
	'glb:dungeon-prop-crypt-wall': {
		name: 'Crypt wall module (bone niches)', short: 'Tường hầm (GLB)', category: 'structure', size: [4, 2.283, 0.6973], status: 'glb', source: 'lookdev-lab/assets/terrain-biomes/dungeon-prop-crypt-wall.glb',
		segment: 'stair', note: 'the stair head = the lowest crypt of the Garden of Hush (BIO-04): one module, x-scale 0.8', unplaced: 'laid by the engine as the wall modules of the landing',
	},
	B05: {
		name: 'The Hospice Mother (boss blockout)', short: 'Hospice Mother', category: 'linen', size: [3 * H, 2.75 * H, 2.2 * H], status: 'blockout', monster: true, fade: false, solid: false,
		source: 'monster sheet B05 vA concept_r2 (approved 2026-10-21)', segment: 'arena', note: 'veiled linen mass, ten soft arms (dozens in the final), always shushing', shape: motherShape(), glowColor: '#e0a050',
	},
};

// ---- the plan ------------------------------------------------------------------------------------------------------------------------------------
const TELEGRAPHS = [[-3.4, -22.6, 1.3], [-1.2, -21.4, 1.4], [1.4, -21.8, 1.3], [3.6, -23.2, 1.2], [-5.6, -25.6, 1.1], [5.4, -25.2, 1.2], [-4.4, -20.4, 1.0], [4.6, -20.8, 1.0]];

export const PLAN = {
	engine: 'interior',
	id: 'cradle',
	name: 'The Cradle',
	label: 'ASHLAR · Act I · base · The Cradle',
	ld: '11.12',
	biome: 'BIO-27',
	area: 'Cell · boss arena · D5 C4 · 20 min',
	seed: 1112,
	grid: 0.25,
	target: { length: 160, note: 'the aisle as a pseudo-infinite loop of 80–120 m (the same cribs pass three times, LD §7.6) + an arena ⌀ 36–40 m with a second ring of cribs; this slice is 44 × 70 m' },
	bounds: [-22, -36, 22, 34],
	floor: {
		layers: [
			{ id: 'BIO27_cradle', tile: 4 }, // 0 chalk and pale bone (the Cradle's own ground)
			{ id: 'BIO27_vault', tile: 4 }, // 1 dark bone-soot stone: the void past the edge, the edge itself
			{ id: 'BIO08_nave', tile: 4 }, // 2 old crypt flags of the stair head (the Garden of Hush above)
			{ id: 'BIO05_lime', tile: 3.5 }, // 3 clean lime: the pools of the night-lights, the arena's lit middle
			{ id: 'DG_crypt_dust', tile: 3.5 }, // 4 a little dust where the floor meets the dark
		],
		tone: 0.55,
		ppm: 6,
		apron: 16,
		mesh: 0.5,
		paint: [
			{ layer: 'BIO27_vault', kind: 'void', width: 3 },
			{ layer: 'BIO27_vault', kind: 'edge', width: 2.2, amount: 0.6, noise: 1.4 },
			{ layer: 'BIO08_nave', kind: 'room', rooms: ['well'], soft: 1 },
			{ layer: 'BIO05_lime', kind: 'around', asset: 'A14.3', r: 2.6, soft: 2.5, amount: 0.55 },
			{ layer: 'BIO05_lime', kind: 'disc', at: [ARENA.cx, ARENA.cz], r: 7.5, soft: 5, amount: 0.45 },
			{ layer: 'DG_crypt_dust', kind: 'edge', width: 1.2, noise: 1.6, amount: 0.5, clear: ['BIO05_lime'] },
		],
	},
	rooms: [
		{ id: 'arena', name: 'Arena · cũi xương & đèn ngủ', shape: { circle: [ARENA.cx, ARENA.cz, ARENA.r], segments: 64 }, y: 0, edge: 'void', tag: 'arena' },
		{ id: 'aisle', name: 'Lối vào · dãy nôi', shape: { rect: [-4, -6, 4, 32] }, y: 0, edge: 'void' },
		{
			id: 'well', name: 'Cầu thang từ Garden of Hush', shape: { rect: [4, 22, 13, 25] }, y: 1.8, walled: true,
			wall: { height: 2.6, thickness: 0.6, tile: 'BIO27_vault', tone: 0.9, top: 2.0 },
			wallSides: { e: { module: 'dungeon-prop-crypt-wall', moduleSize: [4, 2.283, 0.6973], moduleScaleY: 1.2 } },
		},
	],
	openings: [{ id: 'arch', at: [4, 23.5], width: 2.2, kind: 'arch', height: 2.8 }],
	stairs: [{ id: 'well', rect: [4, 22, 9, 25], up: 'e', y0: 0, y1: 1.8, steps: 9 }],
	structures: [
		{ asset: 'A14.2', at: [0, -2.6], yaw: 0, name: 'the threshold: linen curtains into the arena' },
		{ asset: 'B05', at: BOSS, yaw: 0 },
		{ asset: 'A14.5', at: [0, -16.5], yaw: 0 },
		{ asset: 'N-CR02', at: [0, -16.1], y: 0.72, yaw: 0 },
		{ asset: 'N-CR03', at: [0, -18.4], y: 0.72, yaw: 0 },
		{ asset: 'A14.4', at: [3.15, -17.4], yaw: 180 },
		{ asset: 'A14.4', at: [-7.6, -28.2], yaw: 30 },
		{ asset: 'A14.6', at: [0, -31.3], yaw: 0, name: "Mercy's cradle (runners)" },
		{ asset: 'A14.1', at: [0, -31.3], y: 0.58, yaw: 0, name: "Mercy's cradle" },
		{ asset: 'A14.6', at: [-10.6, -10.5], yaw: 50 },
		{ asset: 'A14.6', at: [11.2, -24.8], yaw: -35 },
		{ asset: 'N-CR01', at: [0, 13], yaw: 0 },
	],
	rows: [
		// the aisle: identical cribs, foot to the aisle, every 4.8 m; past z = 32 they go on in the dark (void)
		{ asset: 'A14.1', from: [-7.15, 31.7], to: [-7.15, 2.9], count: 7, yaw: 0 },
		{ asset: 'A14.1', from: [7.15, 31.7], to: [7.15, 2.9], count: 7, yaw: 0, except: [[3.5, 19.5, 11, 28.9]] },
		{ asset: 'A14.1', from: [-7.15, 36.5], to: [-7.15, 50.9], count: 4, yaw: 0, void: true },
		{ asset: 'A14.1', from: [7.15, 36.5], to: [7.15, 50.9], count: 4, yaw: 0, void: true },
		{ asset: 'A14.1', from: [-14.6, 48.5], to: [-14.6, 0.5], count: 11, yaw: 0, void: true },
		{ asset: 'A14.1', from: [14.6, 48.5], to: [14.6, 0.5], count: 11, yaw: 0, void: true, except: [[10, 19.5, 18, 28.9]] },
		// the aisle's night-lights (stay lit: they are not the boss's): real lights at z 29 and 9 (west) and 19 (east), glow only on the others (the light
		// budget: 15 + the hero light); the rows go on, glow only, into the fog
		{ asset: 'A14.3', from: [-4.7, 29], to: [-4.7, -1], count: 4, lightGroup: 'aisle', realEvery: 2 },
		{ asset: 'A14.3', from: [4.7, 29], to: [4.7, -1], count: 4, lightGroup: 'aisle', realEvery: 4, realOffset: 1, except: [[4, 20, 6, 27]] },
		{ asset: 'A14.3', from: [-4.7, 39], to: [-4.7, 49], count: 2, lightGroup: 'aisle', void: true, light: 'glow' },
		{ asset: 'A14.3', from: [4.7, 39], to: [4.7, 49], count: 2, lightGroup: 'aisle', void: true, light: 'glow' },
	],
	rings: [
		{ asset: 'A14.1', center: [ARENA.cx, ARENA.cz], r: ARENA.r + 1.85, count: 10, from: 0, face: 'in', skip: [0, 5] }, // north = Mercy's cradle, south = the mouth
		{ asset: 'A14.2', center: [ARENA.cx, ARENA.cz], r: ARENA.r + 0.3, count: 10, from: 18, face: 'in', skip: [4, 5] },
		{ asset: 'A14.3', center: [ARENA.cx, ARENA.cz], r: 12.5, count: 10, from: 18, face: 'in' }, // the ten night-lights of the mechanic
		{ asset: 'A14.1', center: [ARENA.cx, ARENA.cz], r: 25.5, count: 14, from: 0, face: 'in', skip: [6, 7, 8], void: true },
		// the nursery beyond the ring: glows only, and they sink with the arena's night-lights (the darkness closes in from everywhere)
		{ asset: 'A14.3', center: [ARENA.cx, ARENA.cz], r: 21.5, count: 12, from: 15, face: 'in', skip: [5, 6], void: true, light: 'glow', lightGroup: 'beyond', followGroup: 'nightlight', followFloor: 0.08 },
	],
	lights: [
		{ id: 'arch', name: 'arch lamp (stair foot)', kind: 'perfection', at: [4.9, 2.9, 23.5], color: '#f2ecdf', range: 8, intensity: 12, glow: 0.9, glowGain: 0.6 },
		// the soft key over the arena dims with the night-lights, down to a minimum (LD 11.12: the arena keeps a lowest light level)
		{ id: 'key', name: 'arena key (soft, from above)', kind: 'perfection', spot: true, at: [0, 15, -14], target: [0, 0, -21], angle: 0.78, penumbra: 1, color: '#efe9dc', range: 34, intensity: 380, shadow: true, followGroup: 'nightlight', followFloor: 0.06 },
	],
	// ambient: the scene's own lift (ambient floor + the far-view light radius) sinks to 35 % as the arena's night-lights go out
	lightGroups: { nightlight: { label: 'Đèn ngủ (arena)', slider: 'Đèn ngủ còn lại', keepNear: [0, -2], ambient: 0.35 } },
	markers: [
		{ kind: 'boss', at: BOSS, r: 3.2, label: 'B05 · The Hospice Mother', note: 'boss · cao 2.75H (4.95 m) · tay 3.00H (5.4 m)' },
		{ kind: 'lullaby', at: BOSS, r: 13, label: 'Vùng bài ru', note: 'màn hình tối dần, hero chậm lại' },
		...TELEGRAPHS.map(([x, z, r], i) => ({ kind: 'telegraph', at: [x, z], r, delay: i * 0.31, label: `bóng tay ${i + 1}` })),
		{ kind: 'landmark', at: [0, -31.3], label: 'Nôi của Mercy', note: 'cũi A14.1 trên đế bập bênh A14.6' },
		{ kind: 'vignette', at: [0, -16.5], r: 3.6, label: 'Giường dọn sẵn cho bạn', note: 'A14.5 + chăn lật + gối (không đánh dấu)', unmarked: true },
		{ kind: 'sightline', at: [4, 23.5], to: [0, -14], label: 'Chân cầu thang → vòng đèn ngủ', note: 'ánh arena thấy được dọc dãy nôi' },
		{ kind: 'note', at: [0, 31], label: 'Giả vô hạn (LD §7.6)', note: 'dãy nôi chạy tiếp vào sương đen' },
		{ kind: 'exit', at: [12.3, 23.5], yaw: -90, label: '↑ Garden of Hush (map 5)', note: 'lối vào: cầu thang xuống' },
	],
	camps: [ // lab stand-ins at low levels (the lab hero is level 5): the base map shows where the fight happens, not its balance
		{ id: 'B05', name: 'The Hospice Mother', monster: 'hollow_king', pack: 'boss', at: [0, -24.6], count: 1, mlvl: 7, boss: true },
		{ id: 'P07', name: 'Cradle-Warden', monster: 'brute', at: [-9.5, -21], count: 1, mlvl: 5 },
		{ id: 'P07', name: 'Cradle-Warden', monster: 'brute', at: [9.5, -21], count: 1, mlvl: 5 },
		{ id: 'P01', name: 'The Soothed', monster: 'zombie', at: [0.5, -11.2], count: 4, radius: 3, mlvl: 3 },
		{ id: 'P05', name: 'Wet-Nurse', monster: 'zombie', at: [-8.5, -13], count: 1, mlvl: 4 },
		{ id: 'P05', name: 'Swaddling', monster: 'spider', at: [-8.5, -13], count: 3, radius: 2, mlvl: 3 },
		{ id: 'P03', name: 'Hush-Moths', monster: 'bat', at: [8.5, -12.5], count: 5, radius: 2.5, mlvl: 3 },
	],

	segments: [
		{ id: 'stair', name: 'Cầu thang từ Garden of Hush', spawn: [11.6, 23.5], yaw: 270, view: 'stair' },
		{ id: 'aisle', name: 'Lối vào · dãy nôi', spawn: [0, 24], yaw: 0, view: 'aisle' },
		{ id: 'arena', name: 'Arena · Hospice Mother', spawn: [0, -1.4], yaw: 0, view: 'arena' },
	],
	route: [[11.6, 23.5], [9.4, 23.5], [4.0, 23.5], [1.4, 22.0], [0, 18], [0, 4], [0, -3.8], [-5.0, -9.6], [-6.4, -16.5], [-4.6, -21.8]],
	views: {
		overview: { label: 'Toàn cảnh (cầu thang → lối vào → arena, trái → phải)', target: [0, 0, 1.5], dist: 84, pitch: 55, yaw: 90 },
		overviewNorth: { label: 'Toàn cảnh (bắc lên trên)', target: [0, 0, -2], w: 44, d: 66 },
		stair: { label: 'Cầu thang từ Garden of Hush', target: [8.2, 1.1, 23.5], dist: 14, pitch: 54, yaw: -28 },
		aisle: { label: 'Lối vào · dãy nôi', target: [0, 0.5, 14], dist: 34, pitch: 52 },
		fog: { label: 'Dãy nôi chìm vào sương đen (nhìn về nam)', target: [0, 1.6, 30], dist: 26, pitch: 20, yaw: 180 },
		mouth: { label: 'Cửa arena · màn lanh', target: [0, 1.4, -1.2], dist: 16, pitch: 36 },
		arena: { label: 'Arena · vòng đèn ngủ', target: [0, 0, -18], dist: 50, pitch: 55 },
		boss: { label: 'Hospice Mother · bàn tay & bóng tay', target: [0, 1.8, -23], dist: 19, pitch: 40 },
	},
	moods: {
		cradle: {
			label: 'Cradle · ánh trắng sữa đứng yên (mặc định)', hemi: 0.55, sky: '#4c4a48', ground: '#0b0a0b', env: 'hdri-night', envI: 0.04, toneMapping: 'aces', exposure: 0.85, lights: 1, floorTone: 0.55,
			fog: { enabled: true, color: '#030304', density: 0.06, falloff: 0.22, height: 0, start: 8, inscatter: 0 },
			grade: { vignette: 0.55, contrast: 1.1, saturation: 0.82, lift: 0, temperature: 0.02, tint: 0 },
			lantern: { radius: 5.2, strength: 0.35, dim: 0.3, color: [0.52, 0.5, 0.47] },
		},
		lookdev: {
			label: 'Soi texture · sáng đều', hemi: 2.4, sky: '#c9d4e4', ground: '#3b352e', env: 'hdri-overcast', envI: 0.25, toneMapping: 'aces', exposure: 0.2, lights: 0.35, floorTone: 1,
			fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 }, lantern: { radius: 5.2, strength: 0, dim: 0, color: [0.5, 0.5, 0.5] },
		},
	},
	atmosphere: { motes: { count: 1100, box: [34, 4.5, 34] } },
	note: '<b>Cầu thang</b> từ Garden of Hush (map 5): 9 bậc 0.18 m xuống, vòm gothic, tường đá hầm (tile BIO27_vault) + 1 mô-đun tường hầm GLB ở đầu cầu thang. <b>Lối vào</b>: lối 8 m giữa hai dãy cũi xương khổng lồ (A14.1, cao 2H) giống hệt nhau, chạy tiếp vào sương đen cả hai đầu (giả vô hạn), thảm lanh dẫn vào, đèn ngủ trắng sữa đứng yên. <b>Arena</b> ⌀ 32 m: vòng cũi + màn lanh, 10 đèn ngủ (thanh <i>Đèn ngủ còn lại</i>), giường chăn chần dọn sẵn, chuông xương treo, nôi của Mercy trên đế bập bênh, <b>Hospice Mother</b> (B05, blockout đúng cỡ: cao 2.75H, tay 3H). Mọi model là blockout (màu theo nhóm); quái trong Play là mô hình thay thế đặt theo id ASHLAR.',
};

// ---- the SPEC §6b contract -------------------------------------------------------------------------------------------------------------------------
export const ASSETS = assetList(KIT, PLAN);

export const MONSTERS = [
	{ id: 'B05', name: 'The Hospice Mother', segment: 'arena', count: 1, note: 'act boss; blockout at spec size (crown 2.75H = 4.95 m, hands 3.00H = 5.4 m, vA concept_r2); Play stand-in hollow_king; no GLB' },
	{ id: 'P07', name: 'Cradle-Warden', segment: 'arena', count: 2, note: 'h 2.00–2.40H, cradle-cage on the back (shape clash with B02 still open); stand-in brute' },
	{ id: 'P01', name: 'The Soothed', segment: 'arena', count: 4, note: 'white nightgowns (the only clean white besides the linen); stand-in zombie' },
	{ id: 'P05', name: 'Wet-Nurse (+ Swaddlings)', segment: 'arena', count: 1, note: '+ 3 Swaddlings (must not read as infants); stand-ins zombie + spider' },
	{ id: 'P03', name: 'Hush-Moths', segment: 'arena', count: 5, note: 'pale swarm; stand-in bat' },
];

export const NPCS = []; // none in the Cradle (LD 11.12); Mercy's light flowing into the hero after the fight is an effect, not an NPC

export const TEXTURES = [
	{ id: 'BIO27_cradle', have: true, note: 'the Cradle floor: chalk and pale bone' },
	{ id: 'BIO27_vault', have: true, note: 'the void edge, the apron, the stair walls' },
	{ id: 'BIO08_nave', have: true, note: 'stair head flags (old crypt of the Garden of Hush)' },
	{ id: 'BIO05_lime', have: true, note: 'clean lime under the night-lights and in the lit middle' },
	{ id: 'DG_crypt_dust', have: true, note: 'a little dust at the void edge' },
	{ id: 'cradle quilted linen floor', have: false, note: 'quilted linen as ground for the arena middle (Mercy\'s linen underfoot)' },
	{ id: 'cradle void floor', have: false, note: 'dark linen / soot that sinks into black: the pseudo-infinite edge (now: BIO27_vault + vertex fade)' },
	{ id: 'bone rail + cord trim sheet', have: false, note: 'bone, cord lashing and pale wood for A14.1 / A14.4 / A14.6' },
	{ id: 'linen drape material', have: false, note: 'linen cloth with the narrow poppy-red hem (A14.2, A14.5, B05 veil)' },
	{ id: 'milk-white glass', have: false, note: 'the milky globe shade of A14.3 (canon has no hex yet; #F2ECDF proposed)' },
];

export const VFX = [
	{ id: 'night-light glow', have: 'placeholder', note: 'still additive halo + floor pool per lamp, no flicker (Perfection light)' },
	{ id: 'night-lights going out one by one', have: 'placeholder', note: 'slider "Đèn ngủ còn lại" + optional auto-dim in Play; real: a soft fade, a breath of darkness closing in' },
	{ id: 'black fog / void', have: 'placeholder', note: 'height fog + apron fading to black + void rows darkened with distance' },
	{ id: 'hand-shadow telegraph', have: 'placeholder', note: 'soft dark ellipses that grow ~1.6 s before a hand strikes (overlay preview)' },
	{ id: 'dust motes in the milk light', have: 'placeholder', note: 'GPU atmosphere motes, lit by the nearest lights' },
	{ id: 'lullaby: screen dims, hero slows', have: false, note: 'boss mechanic (LD 11.12)' },
	{ id: "Mercy's light flowing into the hero", have: false, note: 'after the fight: the life orb turns from grey to red' },
	{ id: 'linen breathing / sway', have: false, note: 'curtains and the veil move slowly, never in wind' },
	{ id: 'Hush-Moth swarm', have: false, note: 'pale wing dust that makes the eyes heavy (P03)' },
	{ id: 'shush breath', have: false, note: "the boss's constant 'shh' as a visible breath of linen" },
];

// ASHLAR · Act I base map 5 — THE GARDEN OF HUSH (LD 11.11, BIO-04 ↺, dungeon / under-place, Hybrid generation, D5 C3, 35 min; scene id act1GardenOfHush).
// The crypts under the Gentle House made into a garden: sleepers buried to the chest in rows of dark earth, a red poppy from every mouth, a small still
// pale-pink night-light beside each one (Perfection light: still, identical, many), linen canopies over the rows, hush bell posts above them (the signature
// mechanic: noise near the sleepers rings the bells, the bells call Poppy Nurses out of the root bays — the "Chuông ru" overlay), root-vaulted halls with
// damp earth walls, irrigation channels of still black water, drying racks, a harvest room. Every row is different people (the four A20 sleepers in another
// mix and length per row). No gore. The way runs west → east and always down: the whitewashed stair from the Gentle House (map 4) → the old crypt (bone
// mortar, crypt-wall GLB niches where the Wall shows; the first sleeper where the earth spills over the flags) → a root tunnel ramp → Furrow Hall I (the
// Remember image: four ward rows under linen canopies) → the channel gallery (still water, racks, W07 webs) with the breath room off it (Fen asleep in his
// row; Tamsin kneels by him with the candles and the lantern she brought: the only warm, flickering light in the Garden) → the harvest room (tables, racks,
// baskets) → a stair down to the deep rows, the hardest stretch (open-earth rows running on into the black, a bell gauntlet, root falls closing the easy
// ways, a Poppy-Mound on the wrong way) where the lamp ahead appears for the first time: a far, still white light that shows the right way (never a person
// holding it; not explained) → the exit landing (BIO27 vault stone, crypt-wall niches, the Cradle's milk-white lamp) → 9 treads down to the Cradle (map 6).
// Sizes (H = 1.8 m): A13 from ashlar/art/act-01/environments/A13_garden_of_hush/{perspective,turnaround}.png and their prompt (A13.1: the turnaround
// reads ≈ 1.5H long, the prompt's 2.4H × 1H × 0.4H is too big for one sleeper → 2.7 × 1.4 × 0.5 m; A13.2 3.5H × 2.4H × 2.4H; A13.3 0.45H × ⌀ 0.35H; A13.4
// 2H × 0.9H; A13.5 3H × 2.8H × 1H; A13.6 2.4H × 0.9H × 0.7H), A20 from the v2 batch (ashlar/art/act-01/environments/A20_garden_of_hush_sleepers
// _harvest/perspective_v1e.png, QA passed; tmp/act1-base-maps/MISSING_ENV_CONCEPTS.md: sleepers L ≈ 1H, face at 0.19H; the channel L 3 m × W 0.6 m, sunk
// into the floor here where the sheet draws a raised trough; the harvest table L 2.6 m, h 0.9 m, rail 2.2 m), A08.6 drying rack 2.4H × 2H (A08 sheet), A11.6
// steady candle stand 1.3H (A11 sheet, the hospice side of the stair). Hybrid (LD): built as a fixed layout; the row halls, the channel gallery and the deep
// rows are parametric here (ward / canopies / spine below) and could be generated later; the stairs, the old crypt, the breath room, the harvest room and
// the exit are hand-made. Pure data + small pure helpers (the engine: ../interior.js; format documented at its top).
// GLBs (2026-10-22, lookdev-lab/assets/act1-extras): the four A20 sleepers (on an A13.1 bed their flat base rests ON_BED up, in the bed's linen, at
// SLEEPER_ON_BED of the row's scale), the A20.5 channel pieces (CH_SINK down: their floor block flush, the engine's still water in their trench), the A20.6
// harvest tables and P06 Poppy-Mound (static). Kit swap (2026-10-23, lookdev-lab/assets/act1-kit): A13.1–A13.3, A13.5, A13.6, A08.6 (scale 1.1) and A11.6
// on their GLBs (the jars' and the candles' glowing globes re-anchored on the models: KIT globe); A13.4 stays a blockout (cross-like post, the user picks).
// A21–A25 swap (2026-10-23, the v3 batch, tmp/act1-base-maps/ACT1_KIT_FIT.md §A21–A25): the root rib arches (the -slim variant, rootlets cut over the lane),
// the plank crossing (laid into the earth), the root falls, the baskets, the tending kit, the coverlet (COVER_ON_BED), the shoes (×0.7) and Tamsin's lantern
// (on the floor: LANTERN_AT, its light and globe on the glass) on their GLBs.
import { assetList } from '../interior.js';

const H = 1.8;
const LV = { top: 3.6, crypt: 0, hall: -0.6, deep: -2.4, cradle: -4.2 }; // floor levels: the hospice landing → old crypt → the garden → the deep rows → the Cradle's stair

// muted part colours ('#rrggbb' as a part category: interiorBlockout.js draws it in that colour) — earth, roots, brick, cloth, keepsakes
const SOIL = '#3d2c22';
const ROOT = '#5a4838';
const BRICK = '#6a5044';
const CANVAS = '#cbc4b3'; // the canopies' dull undyed linen (Mercy's clean white is the sleepers' fold: category linen)
const BRONZE = '#56604c';
const DRIED = '#6b5a40';
const SEEDS = '#77805f'; // grey-green poppy heads
const WICKER = '#7d6845';
const SILK = '#d8ccb0'; // W07 silk (Quy chuẩn quái)
const FLESH = '#7a6052'; // P06 (#8A6A5A, muted)

// ---- blockout shapes (asset frame: pivot at the bottom centre, front = +z, metres) ---------------------------------------------------------------

/**
 * A sleeper in the earth (A20.x): on the back, head at −z, the earth mound over the body to the chest, a fold of clean linen, the folded hands holding the
 * keepsake, eyes closed, one red poppy on a short stem rising from between the lips (a plant, not a wound). W 1.0 × L 2.1 m, face 0.19H, poppy top 0.81 m.
 */
function sleeperShape({ cloth, build = 1, extra = [] }) {
	return [
		{ p: 'mound', at: [0, 0.13, 0.12], size: [1.0, 0.26, 1.86], cat: SOIL },
		{ p: 'mound', at: [0, 0.09, -0.78], size: [0.46, 0.18, 0.42], cat: SOIL }, // the earth pillow
		{ p: 'box', at: [0, 0.26, -0.38], size: [0.58 * build, 0.1, 0.36], cat: cloth }, // shoulders and upper chest
		{ p: 'box', at: [0, 0.3, -0.06], size: [0.8, 0.05, 0.46], rot: [5, 0, 0], cat: 'linen' }, // the fold of clean linen
		{ p: 'sphere', at: [0, 0.29, -0.74], size: [0.22, 0.2, 0.26], cat: 'skin', seg: 10 }, // the face, turned up, eyes closed
		{ p: 'sphere', at: [0, 0.34, -0.25], size: [0.26, 0.09, 0.15], cat: 'skin', seg: 8 }, // the folded hands
		{ p: 'cyl', at: [0, 0.58, -0.69], size: [0.028, 0.38, 0.028], rot: [-8, 0, 0], cat: 'vegetation', seg: 5 }, // the stem from the lips
		{ p: 'box', at: [0.05, 0.55, -0.69], size: [0.13, 0.02, 0.05], rot: [0, 30, 22], cat: 'vegetation' }, // a leaf
		{ p: 'cyl', at: [0, 0.78, -0.665], size: [0.2, 0.06, 0.2], cat: 'accent', seg: 9 }, // the red bloom
		{ p: 'sphere', at: [0, 0.81, -0.665], size: [0.07, 0.04, 0.07], cat: '#2a2220', seg: 6 },
		...extra,
	];
}

const SLEEPERS = {
	'A20.1': {
		name: 'Sleeper: young woman (braid, ribbon keepsake)', short: 'Người ngủ: cô gái tết tóc', cell: 1, cloth: '#5b6157',
		extra: [
			{ p: 'sphere', at: [0, 0.32, -0.8], size: [0.25, 0.12, 0.25], cat: '#4a3628', seg: 8 },
			{ p: 'box', at: [0.15, 0.27, -0.52], size: [0.07, 0.05, 0.42], rot: [0, -12, 0], cat: '#4a3628' }, // the braid over the shoulder
			{ p: 'box', at: [0.03, 0.385, -0.22], size: [0.05, 0.025, 0.24], rot: [0, 25, 0], cat: '#7b5a74' }, // the ribbon keepsake (plum, not red)
		],
	},
	'A20.2': {
		name: 'Sleeper: old man (pipe in his folded hands)', short: 'Người ngủ: ông lão', cell: 2, cloth: '#4b4540',
		extra: [
			{ p: 'sphere', at: [0, 0.31, -0.82], size: [0.25, 0.11, 0.24], cat: '#b3ac9f', seg: 8 }, // white hair
			{ p: 'box', at: [0, 0.35, -0.6], size: [0.15, 0.06, 0.13], cat: '#b3ac9f' }, // beard
			{ p: 'box', at: [0.04, 0.39, -0.22], size: [0.03, 0.03, 0.22], rot: [0, -20, 0], cat: '#3b2a1e' }, // the pipe
			{ p: 'cyl', at: [0.1, 0.41, -0.13], size: [0.055, 0.07, 0.055], cat: '#3b2a1e', seg: 6 },
		],
	},
	'A20.3': {
		name: 'Sleeper: fisherman (knitted cap, cork float)', short: 'Người ngủ: ngư phủ', cell: 3, cloth: '#46525a', build: 1.12,
		extra: [
			{ p: 'sphere', at: [0, 0.34, -0.8], size: [0.26, 0.15, 0.26], cat: '#3c4954', seg: 8 }, // the knitted cap
			{ p: 'sphere', at: [0.02, 0.4, -0.22], size: [0.11, 0.1, 0.15], cat: '#b08a5c', seg: 8 }, // the cork float
			{ p: 'box', at: [0.02, 0.4, -0.22], size: [0.12, 0.03, 0.04], cat: '#6f3a30' },
		],
	},
	'A20.4': {
		name: 'Sleeper: farm woman (apron, wooden spoon)', short: 'Người ngủ: bà nông dân', cell: 4, cloth: '#6a5a4a',
		extra: [
			{ p: 'sphere', at: [0, 0.33, -0.79], size: [0.26, 0.13, 0.27], cat: '#7c6a52', seg: 8 }, // headscarf
			{ p: 'box', at: [0, 0.325, -0.4], size: [0.42, 0.02, 0.2], cat: '#8f8879' }, // the apron's bib
			{ p: 'box', at: [-0.02, 0.39, -0.2], size: [0.035, 0.025, 0.3], rot: [0, 15, 0], cat: '#8a6a46' }, // the wooden spoon
			{ p: 'sphere', at: [0.02, 0.4, -0.36], size: [0.07, 0.03, 0.09], cat: '#8a6a46', seg: 6 },
		],
	},
};

/** A13.1 Sleeping bed furrow: a raised bed of dark soil in timber edging with a small earth pillow at the head (−z); the sleeper lies in its soil. */
const BED = [
	{ p: 'box', at: [0, 0.16, 0], size: [1.22, 0.32, 2.52], cat: SOIL },
	{ p: 'mound', at: [0, 0.37, -0.98], size: [0.72, 0.1, 0.42], cat: SOIL },
	{ p: 'box', at: [-0.65, 0.21, 0], size: [0.1, 0.38, 2.62] },
	{ p: 'box', at: [0.65, 0.21, 0], size: [0.1, 0.38, 2.62] },
	{ p: 'box', at: [0, 0.21, -1.31], size: [1.4, 0.38, 0.1] },
	{ p: 'box', at: [0, 0.21, 1.31], size: [1.4, 0.38, 0.1] },
	...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ p: 'box', at: [sx * 0.65, 0.25, sz * 1.3], size: [0.15, 0.5, 0.15] })),
];

/** A13.3 Pink night-light jar: stoneware on a flat stone, a dusty-pink glass dome (emits, still). */
const JAR = [
	{ p: 'box', at: [0, 0.05, 0], size: [0.63, 0.1, 0.63], cat: 'rock' },
	{ p: 'cyl', at: [0, 0.27, 0], size: [0.5, 0.34, 0.5], cat: '#6e5a48', seg: 12 },
	{ p: 'cyl', at: [0, 0.45, 0], size: [0.54, 0.05, 0.54], cat: 'structure', seg: 12 },
	{ p: 'glow', at: [0, 0.6, 0], size: [0.44, 0.36, 0.44], seg: 10 },
	{ p: 'cyl', at: [0, 0.785, 0], size: [0.1, 0.05, 0.1], cat: 'structure', seg: 8 },
];

/** A13.2 Cloth canopy frame: four timber posts, rails, one slack sagging awning of dull linen (3 panels). Long side along x. */
function canopyShape() {
	const parts = [];
	for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push({ p: 'box', at: [sx * 3.05, 2.06, sz * 2.06], size: [0.2, 4.12, 0.2] });
	for (const sz of [-1, 1]) parts.push({ p: 'box', at: [0, 4.02, sz * 2.06], size: [6.3, 0.12, 0.12] });
	parts.push({ p: 'box', at: [0, 3.58, 0], size: [6.1, 0.04, 1.5], cat: CANVAS });
	for (const sz of [-1, 1]) parts.push({ p: 'box', at: [0, 3.8, sz * 1.42], size: [6.1, 0.04, 1.44], rot: [-sz * 17, 0, 0], cat: CANVAS });
	return parts;
}

/** A13.4 Hush bell post: stone footing, timber post, crossbar with three small bronze-green bells on cords (one swung out a little). */
const BELL_POST = [
	{ p: 'box', at: [0, 0.22, 0], size: [0.7, 0.44, 0.7], cat: 'rock' },
	{ p: 'box', at: [0, 2.02, 0], size: [0.24, 3.16, 0.24] },
	{ p: 'box', at: [0.12, 3.32, 0], size: [1.62, 0.18, 0.18] },
	{ p: 'box', at: [-0.45, 3.0, 0], size: [0.025, 0.46, 0.025] },
	{ p: 'box', at: [0.2, 3.0, 0], size: [0.025, 0.46, 0.025] },
	{ p: 'box', at: [0.66, 3.02, 0], size: [0.025, 0.42, 0.025], rot: [0, 0, 12] },
	{ p: 'cone', at: [-0.45, 2.64, 0], size: [0.26, 0.28, 0.26], top: 0.4, cat: BRONZE },
	{ p: 'cone', at: [0.2, 2.64, 0], size: [0.26, 0.28, 0.26], top: 0.4, cat: BRONZE },
	{ p: 'cone', at: [0.71, 2.68, 0], size: [0.26, 0.28, 0.26], top: 0.4, rot: [0, 0, 14], cat: BRONZE },
];

/** A13.5 Root-vaulted wall bay: old brick piers and vault head round a dark alcove, four big roots lacing it like ribs, one patched repair. Back at −z. */
const BAY = [
	{ p: 'box', at: [-2.1, 2.1, 0], size: [1.2, 4.2, 1.8], cat: BRICK },
	{ p: 'box', at: [2.1, 2.1, 0], size: [1.2, 4.2, 1.8], cat: BRICK },
	{ p: 'box', at: [0, 4.6, 0], size: [5.4, 0.88, 1.8], cat: BRICK },
	{ p: 'box', at: [-1.5, 4.16, 0], size: [0.8, 0.8, 1.8], rot: [0, 0, 45], cat: BRICK }, // haunches: a rounder head
	{ p: 'box', at: [1.5, 4.16, 0], size: [0.8, 0.8, 1.8], rot: [0, 0, 45], cat: BRICK },
	{ p: 'box', at: [0, 1.95, -0.8], size: [3.0, 3.9, 0.2], cat: '#1c1714' }, // the dark back of the alcove
	{ p: 'box', at: [-2.3, 1.2, 0.86], size: [0.7, 0.9, 0.1], cat: '#8b7d6c' }, // one patched brick repair
	{ p: 'cyl', at: [-1.1, 3.2, 0.92], size: [0.26, 3.6, 0.26], rot: [0, 0, -28], cat: ROOT, seg: 7 },
	{ p: 'cyl', at: [1.2, 3.1, 0.92], size: [0.24, 3.6, 0.24], rot: [0, 0, 30], cat: ROOT, seg: 7 },
	{ p: 'cyl', at: [-2.5, 1.6, 0.94], size: [0.22, 3.4, 0.22], rot: [0, 0, 6], cat: ROOT, seg: 7 },
	{ p: 'cyl', at: [2.55, 1.8, 0.94], size: [0.2, 3.6, 0.2], rot: [0, 0, -5], cat: ROOT, seg: 7 },
	{ p: 'cyl', at: [0, 4.92, 0.92], size: [0.24, 4.6, 0.24], rot: [0, 0, 90], cat: ROOT, seg: 7 },
];

/** A13.6 Poppy furrow: a long timber-edged furrow with a straight row of seven healthy poppies (broad red blooms on green stems). */
function poppyFurrowShape() {
	const parts = [
		{ p: 'box', at: [0, 0.17, 0], size: [4.32, 0.34, 1.0] },
		{ p: 'box', at: [0, 0.35, 0], size: [4.12, 0.04, 0.84], cat: SOIL },
	];
	for (let i = 0; i < 7; i++) {
		const x = -1.8 + i * 0.6;
		const h = 0.72 + ((i * 37) % 5) * 0.035;
		parts.push({ p: 'sphere', at: [x, 0.47, i % 2 ? 0.1 : -0.1], size: [0.46, 0.24, 0.58], cat: 'vegetation', seg: 7 });
		parts.push({ p: 'cyl', at: [x, 0.36 + h / 2, 0], size: [0.04, h, 0.04], cat: 'vegetation', seg: 5 });
		parts.push({ p: 'cyl', at: [x, 0.36 + h + 0.03, 0], size: [0.28, 0.07, 0.28], cat: 'accent', seg: 9 });
	}
	return parts;
}

/** A08.6 Poppy-drying rack: A-frame legs, a top rail with six bundles of seed heads hanging upside down (two still red), a plank bench under it. */
function rackShape() {
	const parts = [];
	for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push({ p: 'box', at: [sx * 1.95, 1.72, sz * 0.32], size: [0.14, 3.55, 0.14], rot: [-sz * 10, 0, 0] });
	parts.push({ p: 'box', at: [0, 3.42, 0], size: [4.32, 0.16, 0.16] });
	for (let i = 0; i < 6; i++) {
		const x = -1.6 + i * 0.64;
		parts.push({ p: 'box', at: [x, 3.2, 0], size: [0.025, 0.3, 0.025] });
		parts.push({ p: 'cone', at: [x, 2.62, 0], size: [0.34, 0.9, 0.34], top: 0.25, rot: [180, 0, 0], cat: DRIED, seg: 8 });
		if (i === 1 || i === 4) parts.push({ p: 'sphere', at: [x, 2.42, 0.05], size: [0.24, 0.3, 0.22], cat: 'accent', seg: 8 });
	}
	parts.push({ p: 'box', at: [0, 0.48, 0], size: [3.2, 0.09, 0.48] });
	for (const sx of [-1, 1]) parts.push({ p: 'box', at: [sx * 1.3, 0.22, 0], size: [0.12, 0.44, 0.4] });
	return parts;
}

/** A20.5 Irrigation channel piece (3 m), laid over a channel the engine sinks into the floor (still water inside): stone lips, a small sluice gate, roots. */
const CHANNEL = [
	{ p: 'box', at: [0, 0.03, -0.6], size: [3.0, 0.16, 0.22], cat: 'rock' },
	{ p: 'box', at: [0, 0.03, 0.6], size: [3.0, 0.16, 0.22], cat: 'rock' },
	{ p: 'box', at: [1.3, 0.3, -0.42], size: [0.1, 0.9, 0.1] },
	{ p: 'box', at: [1.3, 0.3, 0.42], size: [0.1, 0.9, 0.1] },
	{ p: 'box', at: [1.3, -0.12, 0], size: [0.07, 0.5, 0.8] },
	{ p: 'box', at: [1.3, 0.78, 0], size: [0.12, 0.1, 0.96] },
	{ p: 'cyl', at: [-0.7, 0.1, 0.62], size: [0.05, 0.9, 0.05], rot: [0, 0, 78], cat: ROOT, seg: 5 },
	{ p: 'cyl', at: [0.3, 0.06, -0.64], size: [0.04, 0.7, 0.04], rot: [0, 30, 84], cat: ROOT, seg: 5 },
];

/** A20.6 Harvest table: work table, baskets of poppy heads, stone mortar and pestle, clay jars, a cloth; bundles of poppies hanging from a rail behind. */
function harvestTableShape() {
	const parts = [
		{ p: 'box', at: [0, 0.86, 0], size: [2.6, 0.08, 0.95] },
		...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ p: 'box', at: [sx * 1.18, 0.41, sz * 0.38], size: [0.1, 0.82, 0.1] })),
		{ p: 'box', at: [0, 0.22, 0], size: [2.3, 0.06, 0.06] },
		{ p: 'box', at: [-1.22, 1.54, -0.42], size: [0.09, 1.32, 0.09] },
		{ p: 'box', at: [1.22, 1.54, -0.42], size: [0.09, 1.32, 0.09] },
		{ p: 'box', at: [0, 2.16, -0.42], size: [2.62, 0.08, 0.08] },
		{ p: 'cyl', at: [-0.7, 1.01, 0.05], size: [0.52, 0.22, 0.42], cat: WICKER, seg: 10 },
		{ p: 'mound', at: [-0.7, 1.16, 0.05], size: [0.46, 0.12, 0.36], cat: SEEDS },
		{ p: 'cyl', at: [0.1, 1.01, 0.12], size: [0.48, 0.22, 0.4], cat: WICKER, seg: 10 },
		{ p: 'mound', at: [0.1, 1.16, 0.12], size: [0.42, 0.12, 0.34], cat: SEEDS },
		{ p: 'cyl', at: [0.72, 1.0, 0.12], size: [0.3, 0.2, 0.3], cat: 'rock', seg: 10 }, // mortar
		{ p: 'cyl', at: [0.8, 1.16, 0.1], size: [0.05, 0.28, 0.05], rot: [0, 0, 30], cat: 'rock', seg: 5 }, // pestle
		{ p: 'cyl', at: [1.06, 1.02, -0.18], size: [0.2, 0.24, 0.2], cat: '#7a5a44', seg: 8 },
		{ p: 'cyl', at: [1.12, 1.01, 0.2], size: [0.18, 0.22, 0.18], cat: '#7a5a44', seg: 8 },
		{ p: 'box', at: [0.35, 0.68, 0.49], size: [0.5, 0.38, 0.02], cat: 'linen' },
	];
	for (let i = 0; i < 5; i++) {
		const x = -0.96 + i * 0.48;
		parts.push({ p: 'box', at: [x, 2.0, -0.42], size: [0.02, 0.22, 0.02] });
		parts.push({ p: 'cone', at: [x, 1.66, -0.42], size: [0.28, 0.5, 0.28], top: 0.3, rot: [180, 0, 0], cat: 'vegetation', seg: 7 });
		parts.push({ p: 'sphere', at: [x, 1.42, -0.42], size: [0.22, 0.16, 0.22], cat: 'accent', seg: 7 });
	}
	return parts;
}

/** A11.6 Steady candle stand (the hospice's: one thick clean candle, a flame that never moves). */
const CANDLE_STAND = [
	{ p: 'cyl', at: [0, 0.06, 0], size: [0.62, 0.12, 0.62], seg: 12 },
	{ p: 'cyl', at: [0, 1.0, 0], size: [0.1, 1.8, 0.1], seg: 8 },
	{ p: 'cyl', at: [0, 1.93, 0], size: [0.36, 0.06, 0.36], seg: 12 },
	{ p: 'cyl', at: [0, 2.08, 0], size: [0.12, 0.26, 0.12], cat: '#e6dcc6', seg: 8 },
	{ p: 'glow', at: [0, 2.27, 0], size: [0.07, 0.12, 0.07], seg: 6 },
];

/** N-GD01 Root rib arch: one great root arching over a passage (a rib of the root vault), feet flared into the floor. Span along x. */
function ribArchShape(span = 5.8, rise = 4.9, r = 0.17) {
	const parts = [];
	const n = 10;
	const pt = (k) => {
		const a = (k / n) * Math.PI;
		return [Math.cos(a) * (span / 2), 0.25 + Math.sin(a) * (rise - 0.25)];
	};
	for (let k = 0; k < n; k++) {
		const [x0, y0] = pt(k);
		const [x1, y1] = pt(k + 1);
		const dx = x1 - x0;
		const dy = y1 - y0;
		parts.push({ p: 'cyl', at: [(x0 + x1) / 2, (y0 + y1) / 2, 0], size: [2 * r, Math.hypot(dx, dy) + 0.06, 2 * r], rot: [0, 0, (Math.atan2(-dx, dy) * 180) / Math.PI], cat: ROOT, seg: 7 });
	}
	for (const s of [-1, 1]) parts.push({ p: 'cone', at: [s * (span / 2), 0.2, 0], size: [0.7, 0.4, 0.5], top: 0.4, cat: ROOT, seg: 7 });
	for (let k = 1; k < n; k += 2) {
		const [x, y] = pt(k);
		parts.push({ p: 'sphere', at: [x * 0.97, y - 0.05, 0.14], size: [0.22, 0.22, 0.22], cat: ROOT, seg: 6 });
	}
	return parts;
}

/** N-GD02 Fen asleep in his row (story): a thin boy in a patched oilskin, a whittled wooden bird in his hands, the poppy like every other sleeper. */
const FEN = sleeperShape({
	cloth: '#59523f', build: 0.9,
	extra: [
		{ p: 'sphere', at: [0, 0.32, -0.8], size: [0.24, 0.12, 0.24], cat: '#2e2620', seg: 8 },
		{ p: 'box', at: [0.12, 0.27, -0.36], size: [0.14, 0.02, 0.12], cat: '#7d7660' }, // the patch on the oilskin
		{ p: 'sphere', at: [0, 0.4, -0.22], size: [0.09, 0.07, 0.15], cat: '#8a6a46', seg: 7 }, // the wooden bird
	],
});

/** N-GD03 Tamsin kneeling by Fen (NPC spot): kneeling, leaning toward him, a hand on his shoulder; oiled wool hood, the short bow on her back. Faces +z. */
const TAMSIN = [
	{ p: 'box', at: [0, 0.2, -0.12], size: [0.38, 0.4, 0.62], cat: 'npc' },
	{ p: 'box', at: [0, 0.68, 0.02], size: [0.42, 0.62, 0.26], rot: [8, 0, 0], cat: 'npc' },
	{ p: 'sphere', at: [0, 1.08, 0.08], size: [0.22, 0.26, 0.24], cat: 'skin', seg: 8 },
	{ p: 'sphere', at: [0, 1.12, 0.04], size: [0.28, 0.28, 0.3], cat: '#4e4a3e', seg: 8 },
	{ p: 'box', at: [0.18, 0.66, 0.26], size: [0.08, 0.08, 0.5], rot: [-30, 0, 0], cat: 'npc' }, // the arm reaching to his shoulder
	{ p: 'box', at: [-0.2, 0.8, -0.14], size: [0.04, 1.0, 0.04], rot: [0, 0, 18], cat: 'structure' }, // the short bow
];

/** N-GD04 The lamp ahead: a small plain lantern on a stone block, burning white and perfectly still. Nobody holds it; it is not explained. */
const LAMP_AHEAD = [
	{ p: 'box', at: [0, 0.42, 0], size: [0.6, 0.84, 0.6], cat: 'rock' },
	{ p: 'box', at: [0, 0.87, 0], size: [0.3, 0.06, 0.3], cat: 'structure' },
	...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ p: 'box', at: [sx * 0.12, 1.08, sz * 0.12], size: [0.025, 0.36, 0.025], cat: 'structure' })),
	{ p: 'glow', at: [0, 1.08, 0], size: [0.2, 0.3, 0.2], seg: 8 },
	{ p: 'cone', at: [0, 1.32, 0], size: [0.32, 0.14, 0.32], top: 0.2, cat: 'structure', seg: 8 },
];

/** N-GD05 Plank crossing laid where a channel stops (a 1.5 m earth crossing between two channel runs). */
const BRIDGE = [
	{ p: 'box', at: [0, 0.05, 0], size: [1.5, 0.06, 2.2] },
	{ p: 'box', at: [-0.7, 0.04, 0], size: [0.12, 0.08, 2.3] },
	{ p: 'box', at: [0.7, 0.04, 0], size: [0.12, 0.08, 2.3] },
];

/** N-GD06 Shroud web (W07's lair): a sheet of pale silk pinched in the middle with two strands across, hung between wall and floor. */
const WEB = [
	{ p: 'drape', at: [0, 1.5, 0], size: [2.8, 2.4, 0.12], tie: 0.5, folds: 2, cat: SILK },
	{ p: 'box', at: [0, 1.5, 0], size: [3.0, 0.02, 0.02], rot: [0, 0, 32], cat: SILK },
	{ p: 'box', at: [0, 1.5, 0], size: [3.0, 0.02, 0.02], rot: [0, 0, -32], cat: SILK },
];

/** N-GD07 Root fall: where the root vault came down, a heap of earth with great roots and broken brick across the way. */
const ROOT_FALL = [
	{ p: 'mound', at: [0, 0.8, 0], size: [4.6, 1.6, 5.4], cat: SOIL, seg: 16 },
	{ p: 'mound', at: [0.5, 1.6, -0.5], size: [2.6, 1.2, 3.0], cat: SOIL },
	{ p: 'cyl', at: [-0.8, 1.3, 0.3], size: [0.42, 5.2, 0.42], rot: [72, 15, 0], cat: ROOT, seg: 8 },
	{ p: 'cyl', at: [0.9, 1.1, -0.6], size: [0.36, 4.6, 0.36], rot: [65, -30, 0], cat: ROOT, seg: 8 },
	{ p: 'cyl', at: [0.2, 2.2, 0.8], size: [0.3, 3.8, 0.3], rot: [50, 70, 0], cat: ROOT, seg: 8 },
	{ p: 'cyl', at: [-1.4, 0.9, -1.4], size: [0.28, 3.2, 0.28], rot: [80, -60, 0], cat: ROOT, seg: 8 },
	{ p: 'box', at: [1.6, 0.35, 1.6], size: [0.9, 0.6, 0.7], rot: [0, 20, 8], cat: BRICK },
	{ p: 'box', at: [-1.7, 0.3, 1.9], size: [0.7, 0.5, 0.6], rot: [10, -15, 0], cat: BRICK },
	{ p: 'box', at: [1.2, 0.3, -2.2], size: [0.6, 0.45, 0.8], rot: [0, 40, -6], cat: BRICK },
];

/** N-GD08 Harvest basket: a wicker basket heaped with poppy heads. */
const BASKET = [
	{ p: 'cyl', at: [0, 0.16, 0], size: [0.56, 0.32, 0.46], cat: WICKER, seg: 10 },
	{ p: 'mound', at: [0, 0.38, 0], size: [0.5, 0.12, 0.4], cat: SEEDS },
	{ p: 'box', at: [0, 0.42, 0], size: [0.04, 0.2, 0.5], cat: WICKER },
];

/** N-GD09 A Poppy Nurse's tending kit left by a row: a stool with a folded clean cloth, a tin watering can. */
const NURSE_KIT = [
	{ p: 'cyl', at: [0, 0.42, 0], size: [0.42, 0.06, 0.42], seg: 10 },
	{ p: 'box', at: [-0.12, 0.2, -0.1], size: [0.05, 0.4, 0.05] },
	{ p: 'box', at: [0.14, 0.2, -0.06], size: [0.05, 0.4, 0.05] },
	{ p: 'box', at: [0, 0.2, 0.15], size: [0.05, 0.4, 0.05] },
	{ p: 'box', at: [0, 0.47, 0], size: [0.3, 0.04, 0.22], cat: 'linen' },
	{ p: 'cyl', at: [0.55, 0.16, 0.05], size: [0.3, 0.3, 0.24], cat: '#7d7f7a', seg: 10 },
	{ p: 'box', at: [0.78, 0.24, 0.05], size: [0.3, 0.04, 0.04], rot: [0, 0, 35], cat: '#7d7f7a' },
];

/** N-GD10 A clean linen coverlet turned down on an empty bed: made up and lit, nobody in it yet. */
const COVERLET = [
	{ p: 'box', at: [0, 0.03, 0.35], size: [1.14, 0.05, 1.6], cat: 'linen' },
	{ p: 'box', at: [0, 0.07, -0.5], size: [1.14, 0.08, 0.3], cat: 'linen' },
];

/** N-GD11 A pair of shoes placed neatly at the foot of a furrow. */
const SHOES = [
	{ p: 'box', at: [-0.09, 0.05, 0], size: [0.11, 0.1, 0.28], cat: '#4a3a2c' },
	{ p: 'box', at: [0.09, 0.05, 0.02], size: [0.11, 0.1, 0.28], cat: '#4a3a2c' },
];

/** N-GD15 Tamsin's lantern: a patched tin lantern hung from a root bracket on the wall (human light: warm, flickering, sooty). Back at −z. */
const LANTERN = [
	{ p: 'box', at: [0, 0.95, -0.25], size: [0.08, 0.08, 0.55] },
	{ p: 'box', at: [0, 0.8, 0], size: [0.02, 0.26, 0.02] },
	...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ p: 'box', at: [sx * 0.11, 0.5, sz * 0.11], size: [0.03, 0.32, 0.03] })),
	{ p: 'glow', at: [0, 0.5, 0], size: [0.17, 0.24, 0.17], seg: 8 },
	{ p: 'cone', at: [0, 0.71, 0], size: [0.3, 0.12, 0.3], top: 0.2, seg: 8 },
	{ p: 'box', at: [0, 0.33, 0], size: [0.28, 0.04, 0.28] },
	{ p: 'box', at: [0.1, 0.62, 0.08], size: [0.12, 0.1, 0.02], cat: '#2a2624' }, // soot on the glass
];

/** N-GD16 Fallen poppy heads and petals (scattered on the harvest room floor; flat, walk-through). */
const FALLEN = [
	{ p: 'cyl', at: [0, 0.01, 0], size: [0.12, 0.02, 0.09], cat: 'accent', seg: 7 },
	{ p: 'sphere', at: [0.12, 0.03, 0.05], size: [0.07, 0.06, 0.07], cat: SEEDS, seg: 6 },
	{ p: 'cyl', at: [-0.1, 0.01, -0.08], size: [0.1, 0.015, 0.07], cat: 'accent', seg: 7 },
	{ p: 'sphere', at: [-0.02, 0.03, 0.12], size: [0.06, 0.05, 0.06], cat: SEEDS, seg: 6 },
];

/** P06 Poppy-Mound (monster blockout): a round, still mound of many sleepers grown together, blooming — no faces, no limbs drawn. */
function poppyMoundShape() {
	const parts = [
		{ p: 'mound', at: [0, 0.8, 0], size: [4.4, 1.6, 4.0], cat: FLESH, seg: 18 },
		{ p: 'mound', at: [1.1, 1.05, 0.6], size: [2.0, 1.1, 1.8], cat: FLESH },
		{ p: 'mound', at: [-1.2, 0.95, -0.5], size: [1.8, 1.0, 1.6], cat: FLESH },
		{ p: 'mound', at: [0.2, 0.25, 2.0], size: [2.6, 0.5, 1.0], cat: SOIL },
	];
	for (const [x, y, z] of [[0, 1.6, 0], [0.9, 1.5, 0.6], [-0.9, 1.45, -0.4], [1.5, 1.2, -0.6], [-1.6, 1.1, 0.5], [0.4, 1.45, -1.1], [-0.3, 1.4, 1.0], [1.9, 0.8, 0.9], [-1.9, 0.7, -1.0]]) {
		parts.push({ p: 'cyl', at: [x, y + 0.2, z], size: [0.04, 0.4, 0.04], cat: 'vegetation', seg: 5 });
		parts.push({ p: 'cyl', at: [x, y + 0.42, z], size: [0.3, 0.08, 0.3], cat: 'accent', seg: 9 });
	}
	return parts;
}

// ---- KIT: every model the map needs (status: glb | kit | procedural | blockout) ------------------------------------------------------------------
const PINK = '#dcb0b3'; // the night-lights: pale dusty pink, still (canon has no hex; proposal)
/** The four sleepers' Tripo GLBs (lookdev-lab/assets/act1-extras, real size: 2.1 m long, each with its own 1.4–1.5 m earth mound and a flat base). */
const SLEEPER_GLB = {
	'A20.1': ['act1-a20-1-sleeper-young-woman', [1.41, 0.535, 2.1]],
	'A20.2': ['act1-a20-2-sleeper-old-man', [1.508, 0.692, 2.1]],
	'A20.3': ['act1-a20-3-sleeper-fisherman', [1.508, 0.79, 2.1]],
	'A20.4': ['act1-a20-4-sleeper-farm-woman', [1.496, 0.583, 2.1]],
};
/** The A13.1 bed's linen top (GLB act1-a13-1-bed-furrow: 0.46–0.50 m; the blockout bed's soil top was 0.32 m). */
const BED_TOP = 0.46;
/** A GLB sleeper on an A13.1 bed: its flat base 0.04 m under the linen top, so the mound, the face and the poppy read above the timber sides. */
const ON_BED = 0.42;
/** …at this share of its row's scale: the sleepers' soil mounds are 1.4–1.5 m wide, the GLB bed 1.16 m (at 0.85 they overhang it by ≤ 0.1 m a side). */
const SLEEPER_ON_BED = 0.85;
/** The A24.4 coverlet GLB over an empty A13.1 bed: its top (0.27–0.30 m) lies ≈ 0.03 m over the bed's linen (98 % of the sheet; the foot posts show) and its pillow takes in the bed's own. */
const COVER_ON_BED = 0.25;
/** The A25.2 planks laid into the earth crossing: their deck top (0.14–0.17 m) stands ≈ 0.04 m over the floor the hero walks. */
const PLANK_SINK = 0.12;
/** Tamsin's lantern (A25.6) on the breath room floor at Fen's pillow, between Tamsin and his bed (the GLB 0.02 m off the bed, its clod 0.17 m off Tamsin's
 * spot, its back 0.03 m off the north wall; east of her, so the game camera from the south sees it past her) and its glass in the GLB frame: the map's
 * one shadowed light and the KIT globe sit there. */
const LANTERN_AT = [-7.75, -27.2];
const LANTERN_GLASS = [0.23, 0.5, 0.07];
const sleeperKit = (id) => {
	const v = SLEEPERS[id];
	const [model, size] = SLEEPER_GLB[id];
	return {
		name: v.name, short: v.short, category: 'story', size, status: 'glb', source: `concept A20 cell ${v.cell} (v2 batch, perspective_v1e)`, segment: 'every row',
		note: 'buried to the chest, a poppy from the lips (no gore); rows mix the four people with their own length', shape: sleeperShape(v), collider: 1.0, model,
	};
};

export const KIT = {
	'A13.1': {
		name: 'Sleeping bed furrow', short: 'Luống giường ngủ', category: 'structure', size: [1.161, 0.561, 2.7], status: 'glb', source: 'concept A13 cell 1', segment: 'furrow hall · breath room',
		note: 'turnaround reads ≈ 1.5H long; the prompt\'s 2.4H × 1H is too big for one sleeper; the GLB is keyed on the 2.7 m length: a linen-draped timber box 1.16 m wide (concept 1.4 m), linen top 0.46–0.50 m; a GLB sleeper on it lies ON_GLB_BED up at SLEEPER_ON_GLB_BED of its row scale (its 1.4–1.5 m soil mound would hang over the narrower bed)',
		shape: BED, collider: 1.0, model: 'act1-a13-1-bed-furrow',
	},
	'A13.2': {
		name: 'Cloth canopy frame', short: 'Khung mái vải', category: 'structure', size: [6.3, 4.063, 4.368], status: 'glb', source: 'concept A13 cell 2', segment: 'furrow hall', model: 'act1-a13-2-canopy-frame',
		note: 'one per three beds; the awning is walk-through (the GLB canvas sags to ≈ 2.4 m), the posts block; the GLB posts lean (not a rectangle): the blockers are their 0.35–1.7 m footprints', shape: canopyShape(), openCats: [CANVAS],
		blockers: [{ rect: [-3.15, -1.88, -2.55, -1.28] }, { rect: [2.35, -2.18, 2.85, -1.58] }, { rect: [-2.95, 1.52, -2.35, 2.12] }, { rect: [2.45, 1.32, 2.95, 1.82] }],
	},
	'A13.3': {
		name: 'Pink night-light jar', short: 'Đèn ngủ hồng', category: 'prop', size: [0.696, 0.81, 0.668], status: 'glb', source: 'concept A13 cell 3', segment: 'every row', model: 'act1-a13-3-night-light-jar',
		note: 'one beside every sleeper; still Perfection light (a real light every few, glow + floor pool elsewhere); the GLB\'s pink glass (r ≈ 0.31 m round (−0.01, 0.46, 0), in an iron-banded bowl on a stone slab) carries the light, its halo and the glowing globe (KIT globe); ×263: a collider prism keeps its 4.4 k triangles out of Play\'s collision',
		shape: JAR, round: true, collider: 1.0,
		globe: [{ p: 'glow', at: [-0.01, 0.47, 0], size: [0.64, 0.64, 0.64], seg: 14 }], // over the GLB glass (its bowl hides the lower half)
		// the jar glows below the bloom threshold in a slightly deeper pink, so it stays a small pale-pink light after tone mapping (the lamp ahead is the one white light)
		glowColor: '#cf8c97', globeGain: 0.42,
		light: { kind: 'perfection', y: 0.47, offset: [-0.01, 0], color: PINK, range: 6.5, intensity: 8, glow: 0.3, glowGain: 0.15, pool: 2.1, poolGain: 0.24 },
	},
	'A13.4': {
		name: 'Hush bell post', short: 'Cột chuông ru', category: 'structure', size: [0.9 * H, 2 * H, 0.7], status: 'blockout', source: 'concept A13 cell 4', segment: 'furrow hall · deep rows',
		note: 'the signature mechanic: noise within ~6 m rings it, it calls Poppy Nurses (overlay "Chuông ru") · kept as a blockout (kit swap 2026-10-23): the act1-a13-4-bell-post GLB\'s post rises 0.3 m over the bar and reads as a cross; the user picks it or its -trim variant (docs/act1-base/act1-kit-cross-check.png)',
		shape: BELL_POST, blockers: [{ at: [0, 0], r: 0.4 }],
	},
	'A13.5': {
		name: 'Root-vaulted wall bay', short: 'Hốc tường vòm rễ', category: 'building', size: [5.4, 3.52, 2.395], status: 'glb', source: 'concept A13 cell 5', segment: 'furrow hall · gallery · deep rows', model: 'act1-a13-5-root-wall-bay',
		note: 'against the earth walls; the Poppy Nurses come out of these bays when a bell rings; the GLB is a shallow niche 3.5 m tall (concept 5.04 m) whose invented smooth mud-dome back (QA) sits ≈ 0.3 m inside the 0.7 m earth wall, out of sight; a box collider (its 15 k triangles × 17 stay out of Play\'s collision)',
		shape: BAY, collider: 3.0,
	},
	'A13.6': {
		name: 'Poppy furrow', short: 'Luống anh túc', category: 'vegetation', size: [4.32, 1.758, 1.749], status: 'glb', source: 'concept A13 cell 6', segment: 'furrow hall · deep rows', model: 'act1-a13-6-poppy-furrow',
		note: 'in the spines between facing rows; the GLB poppies reach 1.76 m (concept 1.26 m); the collider covers the 1.0 m planter (foot), the leaning stems stay walk-through', shape: poppyFurrowShape(), foot: [4.32, 1.0], collider: 1.0,
	},
	'A20.1': sleeperKit('A20.1'),
	'A20.2': sleeperKit('A20.2'),
	'A20.3': sleeperKit('A20.3'),
	'A20.4': sleeperKit('A20.4'),
	'A20.5': {
		name: 'Irrigation channel piece (sluice)', short: 'Kênh tưới (cửa cống)', category: 'structure', size: [3.0, 0.893, 1.88], status: 'glb', source: 'concept A20 cell 5 (v2 batch)', segment: 'furrow hall · gallery · deep rows',
		note: 'the GLB brings its cut-out floor block (top 0.55 m): placed CH_SINK = 0.55 m down so the block is flush with the floor, its trench (floor 0.13 m under the floor) holds the engine\'s still water (0.1 m under the floor); the runs between the pieces are engine-built (N-GD14)',
		shape: CHANNEL, model: 'act1-a20-5-irrigation-channel', foot: [3.0, 1.42], collider: 1.55, // collider top 1.0 m above the floor (the placement is 0.55 m down)
	},
	'A20.6': {
		name: 'Harvest table', short: 'Bàn thu hoạch', category: 'prop', size: [2.6, 2.171, 1.428], status: 'glb', source: 'concept A20 cell 6 (v2 batch)', segment: 'harvest room',
		note: 'table top 0.84 m; 1.43 m deep with the baskets and the cloth (the collider covers it)', shape: harvestTableShape(), collider: 1.0, model: 'act1-a20-6-harvest-table',
	},
	'A08.6': {
		name: 'Poppy-drying rack', short: 'Giá phơi anh túc', category: 'structure', size: [3.6, 2.929, 1.802], status: 'glb', source: 'concept A08 cell 6 (Poppy Reach kit, shared)', segment: 'gallery · harvest room', model: 'act1-a08-6-poppy-rack',
		note: 'the GLB at scale 1.1 (3.96 × 3.22 × 1.98 m; concept 4.32 × 3.6 m: at 1.2 its splayed A-frame would stand in the gallery wall or its channel), bench ≈ 0.85 m; its crossed A-frame ends read as an X, not a cross (QA)',
		shape: rackShape(), collider: 1.2,
	},
	'A11.6': {
		name: 'Steady candle stand', short: 'Chân nến đứng yên', category: 'prop', size: [0.611, 2.34, 0.617], status: 'glb', source: 'concept A11 cell 6 (Gentle House kit, shared)', segment: 'landing', model: 'act1-a11-6-candle-stand',
		note: 'the hospice side of the stair: a flame that never moves (Perfection); the light, its halo and the still flame (KIT globe) on the GLB flame (0.04, 2.24, 0.06)', shape: CANDLE_STAND, round: true, foot: [0.6, 0.6], glowColor: '#efe5d2',
		globe: [{ p: 'glow', at: [0.04, 2.245, 0.06], size: [0.075, 0.17, 0.075] }],
		light: { kind: 'perfection', y: 2.24, offset: [0.04, 0.06], color: '#efe5d2', range: 9, intensity: 10, glow: 0.55, glowGain: 0.75, pool: 2.2, poolGain: 0.1 },
	},
	'N-GD01': {
		name: 'Root rib arch', short: 'Vòm sườn rễ', category: 'vegetation', size: [6.5, 4.046, 1.943], status: 'glb', source: 'concept A25 cell 1 (v3 batch; lab variant -slim)', segment: 'root tunnel',
		note: 'one great root arching over a passage: the ribs of the root vault (no ceilings in the lab); the -slim GLB (root feet squeezed to 1.94 m deep), 4.05 m tall (concept 4.9 m); the feet block (x < −0.85 and > +1.45 at walking height), the 2.3 m lane between them is centred at x +0.3, off the pivot; the thin rootlets that hung into the lane (to 0.74–1.02 m at x −0.85…−0.49 and +0.75…+1.15) are cut below 2.05 m, so the lane keeps ≥ 2 m headroom',
		model: 'act1-a25-1-root-rib-arch-slim', shape: ribArchShape(), blockers: [{ rect: [-3.25, -0.97, -0.85, 0.97] }, { rect: [1.45, -0.97, 3.25, 0.97] }], collider: 2.5,
		cut: [[-0.86, 0.3, -0.97, 1.4, 2.05, 0.97]],
	},
	'N-GD02': {
		name: 'Fen asleep in his row (NPC stand-in)', short: 'Fen đang ngủ', category: 'story', size: [1.0, 0.82, 2.1], status: 'blockout', npc: true, source: 'LD only, no NPC model', segment: 'breath room',
		note: 'Tamsin cannot wake him; a whittled wooden bird in his hands', shape: FEN, collider: 1.0,
	},
	'N-GD03': {
		name: 'Tamsin kneeling by Fen (NPC stand-in)', short: 'Tamsin', category: 'npc', size: [0.6, 1.25, 0.9], status: 'blockout', npc: true, source: 'LD only, no NPC model', segment: 'breath room',
		note: 'NPC spot figure; she brought the candles and the lantern', shape: TAMSIN,
	},
	'N-GD04': {
		name: 'The lamp ahead', short: 'Ngọn đèn phía trước', category: 'story', size: [0.6, 1.4, 0.6], status: 'blockout', source: 'AD §4.5 motif, no concept', segment: 'deep rows → exit',
		note: 'first appearance (AD §4.5, §10.2 item 7): a far still white light that shows the right way; no holder, not explained', shape: LAMP_AHEAD, glowColor: '#f4f6f8',
		light: { kind: 'ahead', kindLabel: 'Lamp ahead', y: 1.08, color: '#f4f6f8', range: 10, intensity: 9, glow: 2.6, glowGain: 1.1, pool: 2.4, poolGain: 0.15 },
	},
	'N-GD05': {
		name: 'Plank crossing', short: 'Ván qua kênh', category: 'structure', size: [0.911, 0.189, 2.3], status: 'glb', source: 'concept A25 cell 2 (v3 batch)', segment: 'gallery',
		note: '0.91 m wide (concept 1.5 m), the rope loop at −z, deck top 0.14–0.17 m: laid PLANK_SINK into the earth crossing, so the deck is ≈ 0.04 m over the floor the hero walks (walk-through: no deck in Play); QA: wavy planks with gaps',
		shape: BRIDGE, solid: false, model: 'act1-a25-2-plank-crossing',
	},
	'N-GD06': {
		name: 'Shroud web (W07 lair)', short: 'Mạng tơ liệm', category: 'prop', size: [3.0, 2.7, 0.3], status: 'blockout', source: 'LD only, no concept (W07 sheet: silk #D8CCB0)', segment: 'gallery · deep rows',
		note: 'webs only (no wrapped bodies)', shape: WEB, solid: false,
	},
	'N-GD07': {
		name: 'Root fall (collapsed vault)', short: 'Rễ sập', category: 'rock', size: [4.6, 3.206, 4.825], status: 'glb', source: 'concept A25 cell 3 (v3 batch)', segment: 'deep rows',
		note: 'closes the easy ways of the hardest stretch; 3.21 m tall (concept 2.6 m), 4.83 m deep (concept 5.4 m): both ways stay shut (at Play\'s 0.3 m radius the shorter heap only frees a 0.25 m strip along the north fall\'s +z face, no way past either fall); blocks as a whole (a box collider: Play does not climb the heap)',
		shape: ROOT_FALL, collider: 3.0, model: 'act1-a25-3-root-fall',
	},
	'N-GD08': {
		name: 'Harvest basket of poppy heads', short: 'Giỏ đầu anh túc', category: 'prop', size: [0.56, 0.287, 0.388], status: 'glb', source: 'concept A25 cell 4 (v3 batch)', segment: 'harvest room',
		note: 'keyed on the 0.56 m width: low, 0.29 m tall (concept 0.45 m); the folded white cloth over the +x end; QA: the poppies are a few red smudges', shape: BASKET, round: true, collider: 0.9, model: 'act1-a25-4-harvest-basket',
	},
	'N-GD09': {
		name: "Poppy Nurse's tending kit (stool, watering can)", short: 'Ghế + bình tưới', category: 'prop', size: [1.0, 0.528, 0.515], status: 'glb', source: 'concept A25 cell 5 (v3 batch)', segment: 'furrow hall',
		note: 'the stool with the book and scissors, the watering can at +x', shape: NURSE_KIT, collider: 0.9, model: 'act1-a25-5-tending-kit',
	},
	'N-GD10': {
		name: 'Linen coverlet turned down (empty bed)', short: 'Chăn lanh lật sẵn', category: 'linen', size: [1.14, 0.505, 2.716], status: 'glb', source: 'concept A24 cell 4 (v3 batch)', segment: 'furrow hall',
		note: 'a bed made up and lit, nobody in it yet (unmarked vignette); the GLB is a thick layer (top 0.27–0.30 m, underside 0 → 0.21 m head to foot, pillow to 0.51 m at −z) that covers the A13.1 bed exactly: laid at COVER_ON_BED over the bed, its top lies ≈ 0.03 m over the bed\'s linen and its pillow takes in the bed\'s own pillow (no double pillow)',
		shape: COVERLET, solid: false, model: 'act1-a24-4-turned-down-coverlet',
	},
	'N-GD11': {
		name: 'Shoes placed at the foot of a furrow', short: 'Đôi giày', category: 'prop', size: [0.45, 0.18, 0.439], status: 'glb', source: 'concept A22 cell 1 (v3 batch)', segment: 'furrow hall',
		note: 'the fens\' pair (N-FN02) placed at scale 0.7 (0.32 × 0.13 × 0.31 m), toes to +z', shape: SHOES, solid: false, model: 'act1-a22-1-worn-shoes',
	},
	'N-GD12': {
		name: 'Whitewashed stair down from the Gentle House', short: 'Cầu thang từ hospice', category: 'structure', size: [4, 3.6, 10], status: 'procedural', source: 'LD only, no concept', segment: 'landing',
		note: 'built by the engine: 17 treads of 0.2 m + lime / bone-mortar walls; final art needs a stair kit', unplaced: 'built by the engine (walls, treads)',
	},
	'N-GD13': {
		name: 'Crypt stair + arch down to the Cradle', short: 'Cầu thang xuống Cradle', category: 'structure', size: [4, 1.8, 5], status: 'procedural', source: 'LD only, no concept', segment: 'exit',
		note: '9 treads of 0.18 m and an arch, the mirror of the Cradle\'s stair (map 6)', unplaced: 'built by the engine (walls, treads, arch)',
	},
	'N-GD14': {
		name: 'Irrigation channel runs (sunk floor + still water)', short: 'Mương nước tĩnh', category: 'structure', size: [1.0, 0.4, 3.0], status: 'procedural', source: 'concept A20 cell 5 (runs between the pieces)', segment: 'furrow hall · gallery · deep rows',
		note: 'the engine sinks the floor 0.4 m and lays an opaque still-water surface 0.1 m under the floor', unplaced: 'built by the engine (sunk rooms + water bodies)',
	},
	'N-GD15': {
		name: "Tamsin's lantern on a root bracket", short: 'Đèn lồng của Tamsin', category: 'prop', size: [0.707, 1.0, 0.831], status: 'glb', source: 'concept A25 cell 6 (v3 batch)', segment: 'breath room',
		note: 'human light: warm, flickering (the one shadowed light of the map); the GLB is a root bracket standing on a clod of earth (not the blockout\'s wall bracket): it stands on the floor, its arm reaching +x; the plan light `lantern` and the KIT globe sit on its glass (LANTERN_GLASS, measured on the mesh: the tin lantern spans x 0.13–0.33, y 0.35–0.75, z −0.03…0.17)',
		shape: LANTERN, model: 'act1-a25-6-tamsin-lantern', glowColor: '#e0a050', globeGain: 1.1, globe: [{ p: 'glow', at: [...LANTERN_GLASS], size: [0.21, 0.28, 0.21], seg: 10 }],
		foot: [0.65, 0.65], collider: 1.0,
	},
	'N-GD16': {
		name: 'Fallen poppy heads and petals', short: 'Đầu anh túc rơi', category: 'vegetation', size: [0.35, 0.06, 0.3], status: 'blockout', source: 'LD only, no concept', segment: 'harvest room',
		shape: FALLEN, solid: false,
	},
	'glb:dungeon-prop-crypt-wall': {
		name: 'Crypt wall module (bone niches)', short: 'Tường hầm (GLB)', category: 'structure', size: [4, 2.283, 0.6973], status: 'glb', source: 'lookdev-lab/assets/terrain-biomes/dungeon-prop-crypt-wall.glb',
		segment: 'old crypt · exit', note: 'the old crypt\'s west wall and the exit landing: where the Wall shows', unplaced: 'laid by the engine as the wall modules of two runs',
	},
	'glb:dungeon-prop-broken-column': {
		name: 'Broken column', short: 'Cột gãy (GLB)', category: 'rock', size: [1.68, 1.5, 1.02], status: 'glb', model: 'dungeon-prop-broken-column', source: 'lookdev-lab/assets/terrain-biomes/dungeon-prop-broken-column.glb',
		segment: 'old crypt · breath room · exit', note: 'sparingly: the older crypt',
	},
	'glb:dungeon-prop-candle-cluster': {
		name: 'Candle cluster on a stone block', short: 'Cụm nến (GLB)', category: 'prop', size: [0.77, 0.8, 0.76], status: 'glb', model: 'dungeon-prop-candle-cluster', source: 'lookdev-lab/assets/terrain-biomes/dungeon-prop-candle-cluster.glb',
		segment: 'old crypt · breath room', note: 'one cold in the old crypt; the one Tamsin lit by Fen is the Garden\'s only warm, flickering light',
		light: { kind: 'human', y: 0.8, color: '#e6a858', range: 7, intensity: 10, glow: 0.7, glowGain: 0.8, pool: 2.4, poolGain: 0.2 },
	},
	P06: {
		name: 'Poppy-Mound (static GLB)', short: 'Poppy-Mound', category: 'encounter', size: [4.5, 1.699, 4.425], status: 'glb', monster: true, fade: false, round: true, collider: 1.3,
		source: 'ashlar/3d/act-01/monsters/P06_poppy_mound (Tripo, concept vA r2; width 2.5H = 4.5 m)', segment: 'deep rows', model: 'act1-p06-poppy-mound',
		note: 'stationary spawner on the wrong way; releases Hush-Moths. The static model stays in Play (solid, a collider keeps the hero off its slopes); the camp\'s stand-in brute spawns at its edge',
		shape: poppyMoundShape(),
	},
};

// ---- the layout ------------------------------------------------------------------------------------------------------------------------------------
const S = []; // structures, filled by the helpers below
const BELLS = []; // the hush bells: { at, r, calls } → 'bell' markers

/**
 * One ward row along x: `n` places `pitch` m apart from x0, every head toward `head` ('n' | 's'). A place = its A13.1 bed (or open earth: bed null, the A20
 * mound lies on the floor), its sleeper (the row's own `mix` of the four A20 people, `scale` = the row's length) and its pink night-light jar in the gap
 * beside the head (a real light where `real` lists the place, glow + floor pool elsewhere). `skip`: places left out (crossings, root falls); `empty`: beds
 * made up and lit with nobody in them yet; `swap`: { place: asset } (Fen); `noJar`: places whose jar is set by hand; `dark`: drawn in the void past the floor.
 */
function ward({ x0, z, n, pitch = 2.1, head, y, mix, scale = 1, bed = 'A13.1', real = [], skip = [], empty = [], swap = {}, noJar = [], dark = false }) {
	const yaw = head === 'n' ? 0 : 180;
	const toHead = head === 'n' ? -1 : 1;
	const half = (bed ? 2.7 : 2.1 * scale) / 2;
	const v = dark ? { void: true } : {};
	for (let i = 0; i < n; i++) {
		if (skip.includes(i)) continue;
		const x = +(x0 + i * pitch).toFixed(3);
		if (bed) S.push({ asset: bed, at: [x, z], yaw, y, ...v });
		if (empty.includes(i)) S.push({ asset: 'N-GD10', at: [x, z], yaw, y: +(y + (bed ? COVER_ON_BED : 0)).toFixed(3), ...v });
		else {
			const who = swap[i] ?? mix[i % mix.length];
			const glb = bed && SLEEPER_GLB[who];
			const lift = bed ? (glb ? ON_BED : BED_TOP - 0.28) : 0; // a GLB sleeper rests its flat base in the bed's linen; a stand-in keeps its old 0.28 m below the top
			S.push({ asset: who, at: [x, +(z + toHead * (bed ? 0.06 : 0)).toFixed(3)], yaw, y: +(y + lift).toFixed(3), scale: glb ? +(scale * SLEEPER_ON_BED).toFixed(3) : scale, ...v });
		}
		if (!noJar.includes(i)) S.push({ asset: 'A13.3', at: [+(x + pitch / 2).toFixed(3), +(z + toHead * (half - 0.4)).toFixed(3)], yaw: 0, y, light: real.includes(i) && !dark ? undefined : 'glow', ...v });
	}
}

/** Linen canopy frames (A13.2) over a bed row: one per three places, on the middle bed (a hair under full size, so neighbours' posts stand side by side). */
function canopies({ x0, z, n, pitch = 2.1, y }) {
	for (let k = 0; 3 * k + 2 < n; k++) S.push({ asset: 'A13.2', at: [+(x0 + (3 * k + 1) * pitch).toFixed(3), z], yaw: 0, y, scale: 0.985 });
}

/** The spine between two facing rows (head to head): poppy furrows (A13.6) and hush bell posts (A13.4, crossbar across the spine) calling Nurses from `doors`. */
function spine({ z, y, bells = [], furrows = [], doors = [], r = 6 }) {
	for (const x of furrows) S.push({ asset: 'A13.6', at: [x, z], yaw: 0, y });
	for (const x of bells) {
		S.push({ asset: 'A13.4', at: [x, z], yaw: 90, y });
		const calls = [...doors].sort((a, b) => Math.hypot(a[0] - x, a[1] - z) - Math.hypot(b[0] - x, b[1] - z)).slice(0, 2);
		BELLS.push({ at: [x, z], r, calls });
	}
}

/** A13.5 bays along a wall; returns the Nurse door in front of each (1.4 m out from the bay). side = the wall the bays stand against. */
function bays(side, line, list, y) {
	const yaw = { n: 0, s: 180, w: 90, e: -90 }[side];
	const out = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[side];
	return list.map((t) => {
		const at = side === 'n' || side === 's' ? [t, line + out[1] * 0.9] : [line + out[0] * 0.9, t];
		S.push({ asset: 'A13.5', at, yaw, y });
		return [+(at[0] + out[0] * 2.3).toFixed(2), +(at[1] + out[1] * 2.3).toFixed(2)];
	});
}

// sunk irrigation channels (0.4 m below their room, still water 0.1 m under the floor): rooms listed first so their floor wins. The A20.5 GLB pieces at
// their ends stand CH_SINK down: their cut-out floor block flush with the floor, their trench floor 0.03 m under the water
const CH_SINK = 0.55;
const CHANNELS = [
	{ id: 'chHall', rect: [-66, -18.5, -30, -17.5], y: LV.hall },
	{ id: 'chGalN', rect: [-22, -38, 6, -37], y: LV.hall },
	{ id: 'chGalSa', rect: [-22, -31, -11, -30], y: LV.hall },
	{ id: 'chGalSb', rect: [-9, -31, 6, -30], y: LV.hall },
	{ id: 'chDeep', rect: [26, 12, 78, 13], y: LV.deep },
];

// -- the landing (the hospice side) and the old crypt
S.push({ asset: 'A11.6', at: [-98.7, -52], yaw: 90, y: LV.top }, { asset: 'A11.6', at: [-89.3, -52], yaw: -90, y: LV.top, light: 'glow' });
S.push(
	{ asset: 'glb:dungeon-prop-broken-column', at: [-100, -29], yaw: 12, y: LV.crypt },
	{ asset: 'glb:dungeon-prop-broken-column', at: [-92, -29], yaw: -8, y: LV.crypt },
	{ asset: 'glb:dungeon-prop-broken-column', at: [-100, -23], yaw: 95, y: LV.crypt },
	{ asset: 'glb:dungeon-prop-candle-cluster', at: [-104.9, -26.2], yaw: 90, y: LV.crypt, light: false, name: 'cold candles before the bone niches' },
	// the first sleeper, where the garden earth spills over the crypt flags
	{ asset: 'A13.1', at: [-85.5, -24.5], yaw: 90, y: LV.crypt, name: 'the first bed' },
	{ asset: 'A20.4', at: [-85.44, -24.5], yaw: 90, y: LV.crypt + ON_BED, scale: SLEEPER_ON_BED },
	{ asset: 'A13.3', at: [-86.45, -25.55], yaw: 0, y: LV.crypt },
);
// -- the root tunnel: three rib arches over the ramp down into the garden. The A25.1-slim lane between the feet is centred 0.3 m off the pivot along the arch,
// so each pivot stands 0.3 m south of the route (z −34); each arch stands on the floor at its downhill edge (the ramp falls 0.15 m per m to the east, the
// arch is 1.94 m deep: its uphill feet sink ≤ 0.27 m, none floats)
const tunnelFloor = (x) => +(LV.crypt + Math.min(1, Math.max(0, (x + 76) / 4)) * (LV.hall - LV.crypt)).toFixed(3);
for (const x of [-78.2, -75.4, -72.8]) S.push({ asset: 'N-GD01', at: [x, -33.7], yaw: 90, y: tunnelFloor(x + 0.97) });

// -- Furrow Hall I: two blocks of facing ward rows under linen canopies, bells and poppies in the spines, root bays on every wall
const HX0 = -62.7;
const hallDoors = [
	...bays('n', -52, [-60, -48, -36], LV.hall),
	...bays('s', -14, [-60, -48, -36], LV.hall),
	...bays('w', -72, [-46, -22], LV.hall),
	...bays('e', -24, [-46, -20], LV.hall),
];
ward({ x0: HX0, z: -44.65, n: 15, head: 's', y: LV.hall, mix: ['A20.1', 'A20.3', 'A20.4', 'A20.2'], scale: 1, real: [3] });
ward({ x0: HX0, z: -38.35, n: 15, head: 'n', y: LV.hall, mix: ['A20.2', 'A20.2', 'A20.4', 'A20.3', 'A20.1'], scale: 0.95, real: [10] });
ward({ x0: HX0, z: -29.65, n: 15, head: 's', y: LV.hall, mix: ['A20.3', 'A20.1', 'A20.1', 'A20.4'], scale: 1.05, real: [4] });
ward({ x0: HX0, z: -23.35, n: 15, head: 'n', y: LV.hall, mix: ['A20.4', 'A20.2', 'A20.3'], scale: 0.92, real: [14], empty: [14] });
for (const z of [-44.65, -23.35]) canopies({ x0: HX0, z, n: 15, y: LV.hall }); // the outer rows under linen; the two rows along the middle path stay open (the Remember image)
const HALL_FURROWS = [-61.0, -55.5, -50.7, -45.3, -40.5, -35.0];
spine({ z: -41.5, y: LV.hall, bells: [-58.2, -48.0, -37.8], furrows: HALL_FURROWS, doors: hallDoors });
spine({ z: -26.5, y: LV.hall, bells: [-58.2, -48.0, -37.8], furrows: HALL_FURROWS, doors: hallDoors });
S.push(
	{ asset: 'N-GD11', at: [-56.4, -36.75], yaw: 0, y: LV.hall, scale: 0.7, name: 'shoes at the foot of a furrow' },
	{ asset: 'N-GD09', at: [-42.4, -31.75], yaw: 0, y: LV.hall, name: "a Nurse's stool and watering can" },
	{ asset: 'A20.5', at: [-64.5, -18], yaw: 0, y: LV.hall - CH_SINK },
	{ asset: 'A20.5', at: [-31.5, -18], yaw: 180, y: LV.hall - CH_SINK },
);

// -- the channel gallery: two still channels, racks behind the north one, a plank crossing to the breath room, W07 webs at the east end
S.push(
	{ asset: 'A20.5', at: [-20.5, -37.5], yaw: 0, y: LV.hall - CH_SINK },
	{ asset: 'A20.5', at: [4.5, -37.5], yaw: 180, y: LV.hall - CH_SINK },
	{ asset: 'A20.5', at: [-20.5, -30.5], yaw: 0, y: LV.hall - CH_SINK },
	{ asset: 'A20.5', at: [-7.5, -30.5], yaw: 0, y: LV.hall - CH_SINK },
	{ asset: 'N-GD05', at: [-10, -30.5], yaw: 0, y: +(LV.hall - PLANK_SINK).toFixed(3) }, // the planks laid into the earth crossing
	{ asset: 'A13.3', at: [-18.6, -36.4], yaw: 0, y: LV.hall, light: 'glow' }, // the Perfection keeps the channels lit for its Nurses
	{ asset: 'A13.3', at: [-5.9, -31.6], yaw: 0, y: LV.hall },
	{ asset: 'A13.3', at: [2.8, -36.4], yaw: 0, y: LV.hall, light: 'glow' },
	{ asset: 'A08.6', at: [-17, -39.1], yaw: 0, y: LV.hall, scale: 1.1 },
	{ asset: 'A08.6', at: [-9, -39.1], yaw: 0, y: LV.hall, scale: 1.1 },
	{ asset: 'A08.6', at: [-1, -39.1], yaw: 0, y: LV.hall, scale: 1.1 },
	{ asset: 'N-GD06', at: [3.2, -39.6], yaw: 0, y: LV.hall },
	{ asset: 'N-GD06', at: [7.2, -29.6], yaw: -90, y: LV.hall },
	{ asset: 'N-GD06', at: [-4.6, -28.9], yaw: 180, y: LV.hall },
);
bays('s', -28, [-19.5, 1.5], LV.hall);

// -- the breath room: Fen's row along the north wall, either side of the door; Tamsin kneels at his side with the candles and the lantern she brought
// (the only warm light), seen from the door and from the D2 camera alike
ward({ x0: -16.4, z: -26.15, n: 6, pitch: 2.4, head: 'n', y: LV.hall, mix: ['A20.2', 'A20.1', 'A20.3', 'A20.3', 'A20.4', 'A20.4'], swap: { 4: 'N-GD02' }, skip: [2, 3] });
S.push(
	{ asset: 'N-GD03', at: [-8.2, -26.4], yaw: 90, y: LV.hall, name: 'Tamsin' },
	{ asset: 'glb:dungeon-prop-candle-cluster', at: [-8.4, -24.4], yaw: 20, y: LV.hall, name: 'the candles Tamsin lit' },
	{ asset: 'N-GD15', at: [...LANTERN_AT], yaw: 0, y: LV.hall, name: "Tamsin's lantern" }, // on the floor by Fen's head, the arm reaching toward him
	{ asset: 'glb:dungeon-prop-broken-column', at: [-16, -18.6], yaw: 40, y: LV.hall },
);

// -- the harvest room: tables, racks, baskets, fallen heads; the Perfection's work lights
S.push(
	{ asset: 'A20.6', at: [12.5, -38.5], yaw: 0, y: LV.hall },
	{ asset: 'A20.6', at: [19, -38.5], yaw: 0, y: LV.hall, name: 'the harvest table (vignette)' },
	{ asset: 'A20.6', at: [25.5, -38.5], yaw: 0, y: LV.hall },
	{ asset: 'A20.6', at: [15.5, -32.5], yaw: 180, y: LV.hall },
	{ asset: 'A20.6', at: [22.5, -32.5], yaw: 180, y: LV.hall },
	{ asset: 'A08.6', at: [12.5, -45.0], yaw: 0, y: LV.hall, scale: 1.1 },
	{ asset: 'A08.6', at: [19, -45.0], yaw: 0, y: LV.hall, scale: 1.1 },
	{ asset: 'A08.6', at: [25.5, -45.0], yaw: 0, y: LV.hall, scale: 1.1 },
	{ asset: 'A13.3', at: [9.4, -38.5], yaw: 0, y: LV.hall, light: 'glow' },
	{ asset: 'A13.3', at: [28.6, -38.5], yaw: 0, y: LV.hall, light: 'glow' },
	{ asset: 'A13.3', at: [19, -35.5], yaw: 0, y: LV.hall },
	{ asset: 'A13.3', at: [28.6, -30.5], yaw: 0, y: LV.hall, light: 'glow' },
);

// -- the deep rows (the hardest stretch): open-earth rows running on into the void past the south edge, a bell gauntlet, two root falls, the N gap (right)
const DX0 = 25.0;
const deepDoors = [...bays('n', -16, [38, 48, 75], LV.deep), ...bays('w', 16, [4, 13], LV.deep)];
const DEEP = { y: LV.deep, bed: null };
ward({ ...DEEP, x0: DX0, z: -9.95, n: 23, head: 's', mix: ['A20.2', 'A20.4', 'A20.4', 'A20.1', 'A20.3', 'A20.2'], scale: 0.98, skip: [0, 1, 2, 15, 16] });
ward({ ...DEEP, x0: DX0, z: -4.85, n: 23, head: 'n', mix: ['A20.3', 'A20.3', 'A20.1', 'A20.2'], scale: 1.06, skip: [15, 16], real: [6] });
ward({ ...DEEP, x0: DX0, z: 3.25, n: 26, head: 's', mix: ['A20.1', 'A20.4', 'A20.2', 'A20.3', 'A20.4'], scale: 0.94, skip: [8, 9] });
ward({ ...DEEP, x0: DX0, z: 8.35, n: 26, head: 'n', mix: ['A20.4', 'A20.1', 'A20.3'], scale: 1, skip: [8, 9], real: [20] });
ward({ ...DEEP, x0: DX0, z: 16.45, n: 26, head: 's', mix: ['A20.2', 'A20.1', 'A20.3', 'A20.4', 'A20.1'], scale: 1.02 });
ward({ ...DEEP, x0: DX0, z: 21.55, n: 26, head: 'n', mix: ['A20.3', 'A20.2', 'A20.4'], scale: 0.97, dark: true });
ward({ ...DEEP, x0: DX0, z: 27.55, n: 26, head: 's', mix: ['A20.4', 'A20.4', 'A20.1', 'A20.2'], scale: 1, dark: true });
ward({ ...DEEP, x0: DX0, z: 32.65, n: 26, head: 'n', mix: ['A20.1', 'A20.3'], scale: 0.95, dark: true });
spine({ z: -7.4, y: LV.deep, bells: [34, 46, 66], furrows: [40, 51.5], doors: deepDoors });
spine({ z: 5.8, y: LV.deep, bells: [30, 50, 64, 74], furrows: [36, 57], doors: deepDoors });
spine({ z: 19.0, y: LV.deep, bells: [36, 58], doors: deepDoors });
S.push(
	{ asset: 'N-GD07', at: [28, -13.2], yaw: 0, y: LV.deep, name: 'root fall: the north path closed' },
	{ asset: 'N-GD07', at: [64, -0.8], yaw: 0, y: LV.deep, name: 'root fall: the middle path closed' },
	{ asset: 'A20.5', at: [27.5, 12.5], yaw: 0, y: LV.deep - CH_SINK },
	{ asset: 'A20.5', at: [76.5, 12.5], yaw: 180, y: LV.deep - CH_SINK },
	{ asset: 'P06', at: [52, 10.7], yaw: 15, y: LV.deep }, // the GLB's two sleeping faces are on its +z side: turned toward the game camera
	{ asset: 'N-GD06', at: [79.3, 11], yaw: -90, y: LV.deep },
	{ asset: 'N-GD06', at: [79.3, 14.6], yaw: -90, y: LV.deep },
	{ asset: 'N-GD04', at: [66.6, -20.6], yaw: 0, y: LV.deep, name: 'the lamp ahead' },
);

// -- the exit landing (the lowest crypt of the Garden = the head of the Cradle's stair)
S.push({ asset: 'glb:dungeon-prop-broken-column', at: [72.6, -33], yaw: -20, y: LV.deep });

// ---- the plan ------------------------------------------------------------------------------------------------------------------------------------
const wallOf = (tile, height, top, extra = {}) => ({ tile, height, top, thickness: 0.7, tone: 1, ...extra });
const EARTH = wallOf('BIO04_garden', 5.0, 3.4, { tone: 0.95 });
const BONE = wallOf('BIO04_ossuary', 4.0, 3.0);
const LIME = wallOf('BIO05_lime', 3.4, 2.8);
const VAULT = wallOf('BIO27_vault', 4.0, 2.8, { tone: 0.9 });
const CRYPT_WALL = { module: 'dungeon-prop-crypt-wall', moduleSize: [4, 2.283, 0.6973] };
const grow = ([x0, z0, x1, z1], d) => [x0 - d, z0 - d, x1 + d, z1 + d];

export const PLAN = {
	engine: 'interior',
	id: 'gardenOfHush',
	name: 'The Garden of Hush',
	label: 'ASHLAR · Act I · base · Garden of Hush',
	ld: '11.11',
	biome: 'BIO-04 ↺',
	area: 'Dungeon (under-place) · Hybrid · D5 C3 · 35 min',
	seed: 1111,
	grid: 0.25,
	target: { length: 420, note: 'a 35-min dungeon: ~400 m of way over 2 floors (3–4 row halls, 2 channel galleries, the harvest room, the deep rows as a pseudo-infinite cell); this slice is 190 × 82 m, ~260 m of route' },
	bounds: [-108, -58, 82, 24],
	floor: {
		layers: [
			{ id: 'BIO04_garden', tile: 4 }, // 0 dark garden earth (the base)
			{ id: 'BIO04_ossuary', tile: 3.5 }, // 1 bone-mortar flags: the old crypt rooms
			{ id: 'DW_damp', tile: 3 }, // 2 damp soil at the foot of the weeping walls and round the channels
			{ id: 'DW_mud', tile: 3 }, // 3 mud on the channel lips
			{ id: 'BIO05_lime', tile: 3.5 }, // 4 the hospice landing's whitewashed flags
			{ id: 'BIO08_nave', tile: 4 }, // 5 old crypt flags of the exit (the head of the Cradle's stair)
			{ id: 'DG_crypt_damp', tile: 3.5 }, // 6 damp seep on the crypt floors
		],
		tone: 0.6,
		ppm: 3.5,
		apron: 12,
		mesh: 0.5,
		paint: [
			{ layer: 'BIO04_ossuary', kind: 'room', rooms: ['crypt', 'stairEntry', 'breath', 'harvest', 'stairDeep'], soft: 1.2 },
			{ layer: 'BIO04_garden', kind: 'disc', at: [-85.5, -24.5], r: 3.0, soft: 3, clear: ['BIO04_ossuary'] }, // the earth spills over the crypt flags
			{ layer: 'BIO05_lime', kind: 'room', rooms: ['landing'], soft: 0.6 },
			{ layer: 'BIO08_nave', kind: 'room', rooms: ['exitLanding', 'exitStair', 'threshold'], soft: 1.2 },
			{ layer: 'DW_damp', kind: 'edge', width: 1.6, amount: 0.75, noise: 1.4, clear: ['BIO05_lime'] },
			{ layer: 'DW_damp', kind: 'noise', scale: 0.11, lo: 0.58, hi: 0.76, rooms: ['deep', 'hall'] },
			...CHANNELS.map((c) => ({ layer: 'DW_damp', kind: 'rect', rect: grow(c.rect, 1.1), soft: 1.6 })),
			...CHANNELS.map((c) => ({ layer: 'DW_mud', kind: 'rect', rect: grow(c.rect, 0.3), soft: 0.7 })),
			{ layer: 'DG_crypt_damp', kind: 'noise', scale: 0.17, lo: 0.56, hi: 0.72, rooms: ['crypt', 'harvest', 'breath', 'exitLanding'] },
			{ wet: 0.35, kind: 'edge', width: 1.2 }, // the walls weep (the channels are wet through their water depth)
		],
	},
	rooms: [
		...CHANNELS.map((c) => ({ id: c.id, name: 'Mương nước tĩnh', shape: { rect: c.rect }, y: c.y - 0.4, edge: 'none' })),
		{ id: 'landing', name: 'Chiếu nghỉ hospice (vôi trắng)', shape: { rect: [-100, -56, -88, -48] }, y: LV.top, walled: true, wall: LIME },
		{ id: 'stairEntry', name: 'Cầu thang từ Gentle House', shape: { rect: [-96, -48, -92, -38] }, y: LV.crypt, walled: true, wall: BONE },
		{ id: 'crypt', name: 'Hầm cũ (ossuary)', shape: { rect: [-106, -38, -80, -20] }, y: LV.crypt, walled: true, wall: BONE, wallSides: { w: { ...CRYPT_WALL, moduleScaleY: 1.3 } } },
		{ id: 'tunnel', name: 'Đường hầm rễ', shape: { rect: [-80, -37, -72, -31] }, y: LV.crypt, walled: true, wall: { ...EARTH, height: 4.4, top: 3.0 } },
		{ id: 'hall', name: 'Vườn ngủ · luống đầu', shape: { rect: [-72, -52, -24, -14] }, y: LV.hall, walled: true, wall: EARTH },
		{ id: 'gallery', name: 'Hành lang kênh tưới', shape: { rect: [-24, -40, 8, -28] }, y: LV.hall, walled: true, wall: { ...EARTH, height: 4.4, top: 3.0 } },
		{ id: 'breath', name: 'Phòng thở · Fen & Tamsin', shape: { rect: [-18, -28, -2, -16] }, y: LV.hall, walled: true, wall: BONE },
		{ id: 'harvest', name: 'Phòng thu hoạch', shape: { rect: [8, -46, 30, -24] }, y: LV.hall, walled: true, wall: { ...BONE, height: 4.4 } },
		{ id: 'stairDeep', name: 'Cầu thang xuống luống sâu', shape: { rect: [16, -24, 22, -16] }, y: LV.deep, walled: true, wall: BONE },
		{ id: 'deep', name: 'Luống sâu · đoạn khó nhất', shape: { rect: [16, -16, 80, 22] }, y: LV.deep, walled: true, edge: { default: 'wall', s: 'void' }, wall: { ...EARTH, height: 5.5, top: 3.6 } },
		{ id: 'corridor', name: 'Hành lang ra (đèn phía trước)', shape: { rect: [62, -24, 68, -16] }, y: LV.deep, walled: true, wall: { ...EARTH, height: 4.4, top: 3.0 } },
		{ id: 'exitLanding', name: 'Hầm thấp nhất · đầu cầu thang Cradle', shape: { rect: [56, -36, 76, -24] }, y: LV.deep, walled: true, wall: VAULT, wallSides: { n: { ...CRYPT_WALL, moduleScaleY: 1.25 } } },
		{ id: 'exitStair', name: 'Cầu thang xuống The Cradle', shape: { rect: [51, -32, 56, -28] }, y: LV.cradle, walled: true, wall: VAULT },
		{ id: 'threshold', name: 'Ngưỡng Cradle', shape: { rect: [45, -33, 51, -27] }, y: LV.cradle, walled: true, edge: { default: 'wall', w: 'void' }, wall: VAULT },
	],
	openings: [
		{ id: 'hospiceDoor', at: [-94, -56], width: 2, kind: 'door', height: 2.6 },
		{ id: 'stairTop', at: [-94, -48], width: 4, kind: 'gap' },
		{ id: 'stairFoot', at: [-94, -38], width: 4, kind: 'gap' },
		{ id: 'cryptArch', at: [-80, -34], width: 3, kind: 'arch', height: 3.0 },
		{ id: 'hallMouth', at: [-72, -34], width: 6, kind: 'gap' },
		{ id: 'galleryArch', at: [-24, -34], width: 4, kind: 'arch', height: 3.4 },
		{ id: 'breathDoor', at: [-10, -28], width: 2.2, kind: 'door', height: 2.5 },
		{ id: 'harvestArch', at: [8, -34], width: 3.2, kind: 'arch', height: 3.2 },
		{ id: 'deepStairTop', at: [19, -24], width: 6, kind: 'gap' },
		{ id: 'deepStairFoot', at: [19, -16], width: 6, kind: 'gap' },
		{ id: 'deepExit', at: [65, -16], width: 6, kind: 'gap' },
		{ id: 'landingArch', at: [65, -24], width: 3.2, kind: 'arch', height: 3.0 },
		{ id: 'exitStairTop', at: [56, -30], width: 4, kind: 'gap' },
		{ id: 'cradleArch', at: [51, -30], width: 2.4, kind: 'arch', height: 2.8 },
	],
	stairs: [
		{ id: 'entry', rect: [-96, -48, -92, -38], up: 'n', y0: LV.crypt, y1: LV.top, steps: 17 },
		{ id: 'deep', rect: [16, -24, 22, -16], up: 'n', y0: LV.deep, y1: LV.hall, steps: 9 },
		{ id: 'cradle', rect: [51, -32, 56, -28], up: 'e', y0: LV.cradle, y1: LV.deep, steps: 9 },
	],
	ramps: [{ id: 'tunnel', rect: [-76, -37, -72, -31], up: 'w', y0: LV.hall, y1: LV.crypt }],
	water: CHANNELS.map((c) => ({ id: c.id, shape: { rect: c.rect }, level: c.y - 0.1 })),
	structures: S,
	scatters: [
		{ asset: 'N-GD08', rect: [9.5, -44, 28.5, -40.2], count: 6, gap: 1.8, seed: 1101, scale: [0.9, 1.15], keep: 0.7 },
		{ asset: 'N-GD08', rect: [9.5, -27.6, 14.5, -25.2], count: 2, gap: 1.6, seed: 1102, scale: [0.9, 1.1], keep: 0.7 },
		{ asset: 'N-GD08', rect: [23.5, -27.6, 28.5, -25.2], count: 2, gap: 1.6, seed: 1103, scale: [0.9, 1.1], keep: 0.7 },
		{ asset: 'N-GD16', rect: [9, -45, 29, -25], count: 46, gap: 0.6, seed: 1104, scale: [0.7, 1.3], keep: 0.3, solid: false },
	],
	lights: [
		{ id: 'niches', name: 'the bone niches (the Wall shows)', kind: 'wall', at: [-103.8, 2.2, -29.5], color: '#dce6f2', range: 15, intensity: 34, glow: 0.7, glowGain: 0.35 },
		// on the A25.6 GLB's glass (the lantern stands on the floor: the light is 0.5 m up, not the old wall bracket's 1.88 m)
		{ id: 'lantern', name: "Tamsin's lantern (the only warm light)", kind: 'human', spot: true, at: [LANTERN_AT[0] + LANTERN_GLASS[0], LV.hall + LANTERN_GLASS[1], LANTERN_AT[1] + LANTERN_GLASS[2]], target: [-7.4, LV.hall, -25.3], angle: 1.05, penumbra: 0.85, color: '#e0a050', range: 9, intensity: 30, shadow: true, glow: 0.9, glowGain: 0.85 },
		{ id: 'stairHead', name: "the Cradle's milk-white lamp (stair head)", kind: 'perfection', at: [57.3, LV.deep + 2.9, -30], color: '#f2ecdf', range: 8, intensity: 12, glow: 0.9, glowGain: 0.6 },
	],
	markers: [
		...BELLS.map((b, i) => ({ kind: 'bell', at: b.at, r: b.r, calls: b.calls, label: `Chuông ru ${i + 1}`, note: `ồn trong ${b.r} m → chuông rung → ${b.calls.length} Poppy Nurse` })),
		{ kind: 'npc', at: [-6.8, -26.15], label: 'Fen (đang ngủ)', note: 'Tamsin không đánh thức được cậu' },
		{ kind: 'npc', at: [-8.2, -26.4], label: 'Tamsin', note: 'quỳ bên Fen; nến + đèn lồng cô mang theo = ánh người duy nhất' },
		{ kind: 'vignette', at: [-7.4, -25.2], r: 3, label: 'Tamsin bên Fen (phòng thở)', note: 'ánh ấm lập lòe duy nhất của Garden' },
		{ kind: 'vignette', at: [-85.5, -24.5], r: 2.4, label: 'Người ngủ đầu tiên', note: 'đất vườn tràn lên nền đá hầm cũ' },
		{ kind: 'vignette', at: [-104, -29], r: 2.6, label: 'Xương cũ, người ngủ mới', note: 'hốc xương của Tường + nến nguội' },
		{ kind: 'vignette', at: [-56.4, -36.4], r: 1.6, label: 'Đôi giày để ngay ngắn', note: 'cuối luống, ghế + bình tưới của Poppy Nurse gần đó' },
		{ kind: 'vignette', at: [-33.3, -23.35], r: 1.8, label: 'Giường trống đã thắp đèn', note: 'dọn sẵn, chưa ai nằm (không đánh dấu trên map)', unmarked: true },
		{ kind: 'vignette', at: [19, -38.5], r: 2.2, label: 'Bàn thu hoạch', note: 'đầu anh túc, cối giã, bó hoa treo' },
		{ kind: 'landmark', at: [66.6, -20.6], label: 'Ngọn đèn phía trước', note: 'lần đầu xuất hiện: trắng, đứng yên, xa trong bóng tối' },
		{ kind: 'landmark', at: [-48, -34], label: 'Luống đầu (hình Remember)', note: 'hàng người ngủ, anh túc từ mỗi miệng' },
		{ kind: 'sightline', at: [57.6, -0.8], to: [66.6, -20.6], label: 'Chỗ khó nhất → đèn phía trước', note: 'khe phía bắc là đường đúng' },
		{ kind: 'sightline', at: [20, -0.8], to: [57.6, -0.8], label: 'Lối giữa: dãy chuông hai bên', note: 'đi êm, đừng chạy' },
		{ kind: 'note', at: [48, 20.5], label: 'Đường sai: luống chìm vào bóng tối', note: 'giả vô hạn; Poppy-Mound + Hush-Moth' },
		{ kind: 'note', at: [-48, -50.6], label: 'Hybrid: phòng luống có thể sinh procedural', note: 'ward(): số luống, độ dài, người, khe' },
		{ kind: 'exit', at: [-94, -55], yaw: 0, label: '↑ Gentle House (map 4)', note: 'cầu thang lên hospice' },
		{ kind: 'exit', at: [46.5, -30], yaw: 90, label: '↓ The Cradle (map 6)', note: '9 bậc xuống, nối cầu thang của Cradle' },
	],
	camps: [ // lab stand-ins at low levels (the lab hero is level 5): the base map shows where the fights are, not their balance
		{ id: 'P01', name: 'The Soothed', monster: 'zombie', at: [-50, -34], count: 3, radius: 3, mlvl: 3 },
		{ id: 'F02', name: 'Poppy Nurse', monster: 'skeleton_mage', at: [-28.5, -44], count: 1, radius: 2, mlvl: 4 },
		{ id: 'P03', name: 'Hush-Moths', monster: 'bat', at: [-56, -20], count: 4, radius: 2.5, mlvl: 3 },
		{ id: 'W07', name: 'Shroud-Spinner', monster: 'spider', at: [2.5, -34], count: 2, radius: 2.5, mlvl: 4 },
		{ id: 'F02', name: 'Poppy Nurse', monster: 'skeleton_mage', at: [19, -35.6], count: 2, radius: 2.5, mlvl: 4 },
		{ id: 'P05', name: 'Wet-Nurse', monster: 'zombie', at: [24.5, -28.6], count: 1, radius: 1.5, mlvl: 5 },
		{ id: 'P05', name: 'Swaddling', monster: 'spider', at: [24.5, -28.6], count: 3, radius: 2, mlvl: 3 },
		{ id: 'F02', name: 'Poppy Nurse', monster: 'skeleton_mage', at: [36, -0.8], count: 1, radius: 2, mlvl: 4 },
		{ id: 'P01', name: 'The Soothed', monster: 'zombie', at: [44, -0.8], count: 3, radius: 2.5, mlvl: 3 },
		{ id: 'F02', name: 'Poppy Nurse', monster: 'skeleton_mage', at: [50, -0.8], count: 1, radius: 2, mlvl: 4 },
		{ id: 'P06', name: 'Poppy-Mound', monster: 'brute', at: [52, 10.7], count: 1, radius: 0.5, mlvl: 5 },
		{ id: 'P03', name: 'Hush-Moths', monster: 'bat', at: [48.5, 11.2], count: 5, radius: 2.5, mlvl: 3 },
		{ id: 'W07', name: 'Shroud-Spinner', monster: 'spider', at: [75.5, 10.6], count: 1, radius: 1.5, mlvl: 4 },
		{ id: 'P01', name: 'The Soothed', monster: 'zombie', at: [68, -30], count: 2, radius: 2, mlvl: 3 },
	],
	segments: [
		{ id: 'landing', name: 'Cầu thang từ Gentle House', spawn: [-94, -51.5], yaw: 180, view: 'landing' },
		{ id: 'hall', name: 'Vườn ngủ · luống đầu', spawn: [-69, -34], yaw: 90, view: 'hall' },
		{ id: 'gallery', name: 'Hành lang kênh tưới · phòng thở', spawn: [-20, -34], yaw: 90, view: 'gallery' },
		{ id: 'harvest', name: 'Phòng thu hoạch', spawn: [11.5, -34], yaw: 90, view: 'harvest' },
		{ id: 'deep', name: 'Luống sâu · đèn phía trước', spawn: [19.5, -13], yaw: 180, view: 'deep' },
		{ id: 'exit', name: 'Đầu cầu thang xuống The Cradle', spawn: [66, -30], yaw: 270, view: 'exit' },
	],
	route: [[-94, -51.5], [-94, -48.6], [-94, -37.4], [-92, -34], [-80, -34], [-72, -34], [-30, -34], [-24, -34], [8, -34], [12, -34], [12, -29.6], [19, -29.6], [19, -24.4], [19, -15.6], [19.8, -12], [20, -0.8], [57.6, -0.8], [57.6, -13.5], [64.5, -13.5], [64.5, -24.5], [60, -30], [56.5, -30], [51, -30], [47.5, -30]],
	views: {
		overview: { label: 'Toàn cảnh (hospice → hầm cũ → vườn → luống sâu → Cradle, trái → phải)', target: [-13, -1, -17], dist: 205, pitch: 55 },
		overviewNorth: { label: 'Toàn cảnh (bắc lên trên, khít khung)', target: [-13, -1, -17], w: 192, d: 84 },
		landing: { label: 'Chiếu nghỉ hospice → cầu thang xuống', target: [-94, 2.2, -46], dist: 20, pitch: 52, yaw: -24 },
		crypt: { label: 'Hầm cũ · người ngủ đầu tiên', target: [-91, 0, -29], dist: 32, pitch: 55 },
		firstSleeper: { label: 'Người ngủ đầu tiên (cận)', target: [-85.5, 0.3, -24.5], dist: 8, pitch: 40, yaw: 20 },
		hall: { label: 'Vườn ngủ · luống đầu (hình Remember)', target: [-48, -0.6, -33], dist: 52, pitch: 55 },
		rows: { label: 'Hàng người ngủ · anh túc từ mỗi miệng (cận)', target: [-51.6, -0.3, -38.9], dist: 9.5, pitch: 52, yaw: 10 },
		bells: { label: 'Cột chuông ru trên luống (cơ chế)', target: [-48, 0.8, -41.5], dist: 17, pitch: 46, yaw: -18 },
		gallery: { label: 'Hành lang kênh tưới (nước tĩnh)', target: [-8, -0.6, -34], dist: 32, pitch: 55 },
		breath: { label: 'Phòng thở · Tamsin bên Fen (ánh người)', target: [-8.4, -0.3, -24.6], dist: 13, pitch: 50, yaw: 6 },
		harvest: { label: 'Phòng thu hoạch', target: [19, -0.6, -35], dist: 28, pitch: 52 },
		deep: { label: 'Luống sâu · đoạn khó nhất (toàn cảnh)', target: [48, -2.4, 2], dist: 64, pitch: 55 },
		lamp: { label: 'Ngọn đèn phía trước (từ khe phía bắc)', target: [60.5, -2.0, -8.5], dist: 20, pitch: 42 },
		exit: { label: 'Hầm thấp nhất · cầu thang xuống The Cradle', target: [58, -3.2, -30], dist: 22, pitch: 52, yaw: 20 },
	},
	// Play moods brightened 10-23 (hemi, envI, exposure, floorTone); the old values are in tmp/act1-base-maps/BRIGHTNESS.md.
	moods: {
		hush: {
			label: 'Garden of Hush · hầm tối (mặc định)', hemi: 1.5, sky: '#4c4548', ground: '#140f0f', env: 'hdri-night', envI: 0.08, toneMapping: 'aces', exposure: 1.3, lights: 1, floorTone: 0.66,
			fog: { enabled: true, color: '#070506', density: 0.035, falloff: 0.35, height: -0.6, start: 12, inscatter: 0 },
			grade: { vignette: 0.5, contrast: 1.08, saturation: 0.86, lift: 0, temperature: -0.01, tint: 0.02 },
			lantern: { radius: 6.0, strength: 0.45, dim: 0.24, color: [0.5, 0.47, 0.47] },
		},
		lookdev: {
			label: 'Soi texture · sáng đều', hemi: 2.4, sky: '#c9d4e4', ground: '#3b352e', env: 'hdri-overcast', envI: 0.25, toneMapping: 'aces', exposure: 0.2, lights: 0.35, floorTone: 1,
			fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 }, lantern: { radius: 5.2, strength: 0, dim: 0, color: [0.5, 0.5, 0.5] },
		},
	},
	atmosphere: { motes: { count: 1300, box: [34, 4.5, 34] } },
	note: '<b>Chiếu nghỉ hospice</b> (vôi trắng, 2 chân nến đứng yên) → <b>cầu thang</b> 17 bậc xuống <b>hầm cũ</b> (đá vữa xương, hốc xương GLB nơi Tường lộ ra, cột gãy, người ngủ đầu tiên nơi đất vườn tràn lên nền đá) → đường hầm rễ dốc xuống <b>vườn ngủ</b>: bốn luống người ngủ vùi tới ngực, anh túc đỏ từ mỗi miệng, đèn ngủ hồng đứng yên bên mỗi người, mái vải lanh, cột chuông ru trên luống (overlay <i>Chuông ru</i>: ồn → chuông → Poppy Nurse ra từ hốc rễ), mương nước tĩnh → <b>hành lang kênh tưới</b> (giá phơi, mạng tơ W07) với <b>phòng thở</b>: Fen ngủ trong luống, Tamsin quỳ bên, nến + đèn lồng cô mang theo là ánh ấm lập lòe duy nhất → <b>phòng thu hoạch</b> → cầu thang xuống <b>luống sâu</b> (đoạn khó nhất: luống chìm vào bóng tối, dãy chuông, rễ sập chặn lối dễ, Poppy-Mound ở đường sai) nơi <b>ngọn đèn phía trước</b> hiện lần đầu (trắng, đứng yên, xa) → hầm thấp nhất → 9 bậc xuống <b>The Cradle</b>. Mọi model còn thiếu là blockout đúng cỡ (màu theo nhóm); quái trong Play là mô hình thay thế đặt theo id ASHLAR.',
};

// ---- the SPEC §6b contract -------------------------------------------------------------------------------------------------------------------------
export const ASSETS = assetList(KIT, PLAN);

export const MONSTERS = [
	{ id: 'F02', name: 'Poppy Nurse', segment: 'hall · harvest · deep', count: 5, note: 'h 0.95–1.05H, white wimple with poppy embroidery, long silver needle; caster + healer, must not look evil; called by the hush bells out of the root bays (overlay); stand-in skeleton_mage' },
	{ id: 'P01', name: 'The Soothed', segment: 'hall · deep · exit', count: 8, note: 'white nightgowns (the only clean white besides the linen), eyes closed, slow; stand-in zombie' },
	{ id: 'P03', name: 'Hush-Moths', segment: 'hall · deep', count: 9, note: 'pale swarm over the poppies and round the Poppy-Mound; stand-in bat' },
	{ id: 'P05', name: 'Wet-Nurse (+ Swaddlings)', segment: 'harvest', count: 1, note: '+ 3 Swaddlings (bundles, never infant-shaped); stand-ins zombie + spider' },
	{ id: 'P06', name: 'Poppy-Mound', segment: 'deep (the wrong way)', count: 1, note: 'stationary spawner, W 2.5H, releases Hush-Moths; the static Tripo GLB (act1-p06-poppy-mound, 4.5 × 1.7 m, no rig) stands at the spawner in every view and in Play; the stand-in brute of its camp spawns at its edge (the camp system takes lab monster types only)' },
	{ id: 'W07', name: 'Shroud-Spinner', segment: 'gallery · deep', count: 3, note: 'pale spider, silk #D8CCB0, webs slow; webs only in the base map (no wrapped bodies); reduced-fear option (LD §8.4); stand-in spider' },
];

export const NPCS = [
	{ name: 'Fen', segment: 'breath room', note: 'asleep in his row with a poppy like the others; Tamsin cannot wake him (stand-in N-GD02, a sleeper blockout)' },
	{ name: 'Tamsin', segment: 'breath room', note: 'kneels by Fen; the candles and the lantern she brought are the only warm, flickering light in the Garden (stand-in N-GD03, kneeling)' },
];

export const TEXTURES = [
	{ id: 'BIO04_garden', have: true, note: 'dark garden earth: the floor of the row halls and the earth walls' },
	{ id: 'BIO04_ossuary', have: true, note: 'bone-mortar flags and walls of the old crypt rooms (crypt, breath room, harvest room)' },
	{ id: 'DW_damp', have: true, note: 'damp soil at the foot of the weeping walls and round the channels (Dark Wood set, stand-in)' },
	{ id: 'DW_mud', have: true, note: 'mud on the channel lips (Dark Wood set, stand-in)' },
	{ id: 'BIO05_lime', have: true, note: 'the hospice landing (whitewash, no patch)' },
	{ id: 'BIO08_nave', have: true, note: 'old crypt flags at the exit (= the Cradle\'s stair head)' },
	{ id: 'DG_crypt_damp', have: true, note: 'damp seep on the crypt floors' },
	{ id: 'BIO27_vault', have: true, note: 'wall tile of the exit landing and the stair to the Cradle' },
	{ id: 'sleeper furrow soil', have: false, note: 'raked dark garden earth with low furrow ridges and linen edges (the rows\' ground)' },
	{ id: 'root-laced earth wall', have: false, note: 'packed earth with roots and old brick for vertical walls (now: the floor tile on the walls)' },
	{ id: 'wet stone channel lining', have: false, note: 'the channel lips and inner faces' },
	{ id: 'still black water', have: false, note: 'a mirror-still dark water material (now: an opaque glossy surface)' },
	{ id: 'dull undyed linen + Mercy linen', have: false, note: 'canopy cloth vs the sleepers\' clean fold' },
	{ id: 'dusty-pink glass', have: false, note: 'the night-light dome (canon has no hex; #DCB0B3 proposed)' },
];

export const VFX = [
	{ id: 'pink night-lights', have: 'placeholder', note: 'still additive halo + floor pool per jar, a real light every few (Perfection: no flicker)' },
	{ id: 'the lamp ahead', have: 'placeholder', note: 'one big still white halo + pool + a small real light; real: a far point that moves on ahead, never explained' },
	{ id: 'human light (Tamsin)', have: 'placeholder', note: '1/f flicker of the lantern spot (the one shadow) and the candle cluster' },
	{ id: 'Wall light in the bone niches', have: 'placeholder', note: 'cold white slow shimmer' },
	{ id: 'motes / pollen in the dark', have: 'placeholder', note: 'GPU atmosphere motes' },
	{ id: 'still water', have: 'placeholder', note: 'opaque glossy surface, reflects the night-lights' },
	{ id: 'hush bells ringing', have: false, note: 'bells sway + ring, a ripple of sound over the rows; overlay preview only (noise ring → bell → Poppy Nurse doors)' },
	{ id: 'sleepers breathing together', have: false, note: 'hundreds of chests and linen folds rising in one slow shared rhythm' },
	{ id: 'poppy petals / seed dust drifting', have: false, note: 'slow fall over the rows' },
	{ id: 'Hush-Moth swarm', have: false, note: 'pale wing dust that makes the eyes heavy (P03), released by the Poppy-Mound' },
	{ id: 'W07 web slow', have: false, note: 'silk strands catching the hero' },
];

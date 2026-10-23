// ASHLAR · Act I base map 4 — THE GENTLE HOUSE (LD 11.9, BIO-05 holy place, D4 C0, 12 min, no combat; scene id act1GentleHouse). The hilltop hospice of
// the Poppy Reach: the player climbs a wet flint path through the last poppies (rain, grey day), up whitewashed terrace steps (A18.6) into a forecourt walled
// by niche walls with still candles (A18.5), and through the gate tower (A11.4) where the rain stops (LD proposal): inside it is dry, warm and still. A square
// cloister (A11.1 bays) runs round an open garth; north of it the long ward range: the ward with two rows of beds (A11.2) and smiling sleepers in clean
// linen (Mercy's linen: the one allowed clean white), tall windows with one steady candle on every sill (A19.6), identical candle stands that never flicker
// (A11.6: Perfection light, still and even); up seven steps at its west end Mother Hawise's parlour, whose high warm window faces the valley — the act's
// brightest, stillest light (the window of the far silhouette N-GH in maps 1–3) — with her window chair (A19.3) and the poppy tea (A19.2): the vision
// trigger. East of the cloister the refectory with bread (A11.3), the kitchen with its spotless, unlit hearth and cauldron (A11.5), the linen room (A19.4,
// A19.5); from the kitchen the night stair goes down into the dark: the Garden of Hush (map 5). New whitewash everywhere and not one patch (the warning):
// no repairs anywhere, flowers in vases (A19.1). Beats: the tea by the warm window; Tamsin hiding behind a linen screen at Fen's empty bed, to be got out
// before the sisters notice (patrol routes + sight cones as an overlay; being seen = led kindly to the gate, a marker only). No red light, no tilted camera,
// the camera lower and closer than the other maps (LD proposal). The exterior roofs show only while the focus is outdoors (the engine's room.outdoor).
// Sizes (H = 1.8 m): A11 from ashlar/art/act-01-environments/groups/A11_gentle_house/perspective.prompt.txt (cloister bay 3H × 2.4H × 1.2H, bed 1.2H × 0.6H ×
// 0.4H, table 2.4H × 0.8H × 0.45H, gate tower 4H × 2.4H × 2.4H, hearth 1.6H × 2H × 1H, candle stand 1.3H × 0.5H); A18 / A19 from the v2 batch
// (ashlar/art/act-01-environments-v2/README_VI.md §3, tmp/act1-base-maps/MISSING_ENV_CONCEPTS.md; sheets A18 perspective_v1e, A19 perspective_v2e); the
// garth / garden beds, pots and drying line (N-HS02–05 = A23.3–A23.6) and the kitchen / linen-room tables and bread rack (N-HS06–08 = A24.1–A24.3) from the
// v3 batch (ashlar/art/act-01-environments-v3, MISSING_ENV_CONCEPTS_2.md) on their act1-kit GLBs (tmp/act1-base-maps/ACT1_KIT_FIT.md §A21–A25).
// Pure data + small pure helpers (the engine: ../interior.js; format documented at its top).
import { assetList } from '../interior.js';

const H = 1.8;
const CANDLE = '#e0a050'; // the Act I candle amber (biome doc BIO-05: still, warm; canon has no hex for a candle that never flickers)
const WINDOW = '#f6b468'; // the high warm window (= N-GH's window in the outdoor maps)
const DAY = '#aeb7be'; // grey overcast daylight (outside and over the garth)
const PARLOUR_Y = 1.2; // Mother Hawise's parlour: seven steps above the ward

// ---- blockout shapes (asset frame: pivot at the bottom centre, front = +z, metres) ---------------------------------------------------------------
/** A11.1: three round arches on square piers (the front face = the garth side) with a short tiled eave; the lean-to roof over the walk is N-HS12. */
function cloisterBayShape() {
	const parts = [];
	const fz = 0.83; // the arcade's centre line (front face at +1.08)
	for (const x of [-2.7, -0.9, 0.9, 2.7]) {
		parts.push({ p: 'box', at: [x, 0.125, fz], size: [0.62, 0.25, 0.62] }); // plain base
		parts.push({ p: 'box', at: [x, 1.325, fz], size: [0.5, 2.15, 0.5] }); // square pier
		parts.push({ p: 'box', at: [x, 3.03, fz], size: [0.7, 0.55, 0.46] }); // spandrel over the pier
	}
	for (const x of [-1.8, 0, 1.8]) parts.push({ p: 'arc', at: [x, 2.85, fz], size: [1.8, 0.9, 0.42], lift: 0.6, rot: [0, 0, 180] }); // round arch head
	parts.push({ p: 'box', at: [0, 3.68, fz], size: [5.9, 0.76, 0.5] }); // the wall band over the arches
	parts.push({ p: 'box', at: [0, 4.18, fz + 0.05], size: [5.9, 0.12, 0.95], rot: [12, 0, 0], cat: 'structure' }); // the eave (tiles)
	return parts;
}

/** A11.2: a plain scrubbed-wood bed, white linen sheet, folded pale blanket with one narrow poppy-red band, one plump pillow (head at the back, −z). */
const BED = [
	...[-0.49, 0.49].map((x) => ({ p: 'box', at: [x, 0.36, -1.03], size: [0.1, 0.72, 0.1] })),
	...[-0.49, 0.49].map((x) => ({ p: 'box', at: [x, 0.275, 1.03], size: [0.1, 0.55, 0.1] })),
	...[-0.49, 0.49].map((x) => ({ p: 'box', at: [x, 0.3, 0], size: [0.06, 0.12, 2.0] })),
	{ p: 'box', at: [0, 0.52, -1.03], size: [0.9, 0.3, 0.05] }, // headboard
	{ p: 'box', at: [0, 0.4, 1.03], size: [0.9, 0.18, 0.05] }, // footboard
	{ p: 'box', at: [0, 0.38, 0], size: [0.94, 0.16, 1.98], cat: 'linen' }, // mattress + sheet
	{ p: 'mound', at: [0, 0.53, -0.76], size: [0.68, 0.14, 0.36], cat: 'linen' }, // pillow
	{ p: 'box', at: [0, 0.495, 0.72], size: [0.96, 0.07, 0.46], cat: 'linen' }, // folded blanket
	{ p: 'box', at: [0, 0.5, 0.93], size: [0.97, 0.075, 0.05], cat: 'accent' }, // its narrow poppy-red band
];

/** A11.3: a long scrubbed table on trestles with two benches, a clean linen runner, three loaves and a jug (long axis = x). */
const TABLE = [
	{ p: 'box', at: [0, 0.77, 0], size: [4.32, 0.08, 0.8] },
	...[-1.7, 1.7].map((x) => ({ p: 'box', at: [x, 0.365, 0], size: [0.1, 0.73, 0.6] })),
	{ p: 'box', at: [0, 0.25, 0], size: [3.4, 0.08, 0.08] },
	...[-0.58, 0.58].flatMap((z) => [
		{ p: 'box', at: [0, 0.45, z], size: [4.0, 0.06, 0.28] },
		...[-1.6, 1.6].map((x) => ({ p: 'box', at: [x, 0.21, z], size: [0.08, 0.42, 0.24] })),
	]),
	{ p: 'box', at: [0, 0.817, 0], size: [3.6, 0.014, 0.45], cat: 'linen' },
	{ p: 'mound', at: [-1.3, 0.9, 0.02], size: [0.42, 0.16, 0.26] },
	{ p: 'mound', at: [-0.7, 0.9, -0.05], size: [0.4, 0.16, 0.26] },
	{ p: 'mound', at: [-0.1, 0.9, 0.04], size: [0.42, 0.15, 0.26] },
	{ p: 'cyl', at: [0.75, 0.95, 0.08], size: [0.16, 0.26, 0.16], cat: 'linen' }, // jug
];

/** A11.4: a square whitewashed tower over a round-arched passage (2 m wide, 3.2 m to the crown), a bell opening near the top, a low pyramid roof. */
const GATE_TOWER = [
	...[-1.58, 1.58].map((x) => ({ p: 'box', at: [x, 1.8, 0], size: [1.16, 3.6, 4.32] })), // the two side walls of the passage
	{ p: 'arc', at: [0, 3.1, 0], size: [2.0, 1.0, 4.32], lift: 0.6, rot: [0, 0, 180] }, // the vault over the passage
	...[-0.85, 0.85].map((x) => ({ p: 'box', at: [x, 3.3, 0], size: [0.32, 0.6, 4.32] })),
	{ p: 'box', at: [0, 5.05, 0], size: [4.32, 2.9, 4.32] }, // the body
	{ p: 'box', at: [0, 5.55, 2.17], size: [0.8, 1.1, 0.08], cat: 'shade' }, // bell opening (front)
	{ p: 'cone', at: [0, 5.45, 2.0], size: [0.42, 0.42, 0.42], top: 0.35, cat: 'shade' }, // the bell
	{ p: 'box', at: [0, 6.56, 0], size: [4.6, 0.12, 4.6], cat: 'structure' }, // eaves
	{ p: 'cone', at: [0, 6.93, 0], size: [4.9, 0.62, 4.9], top: 0, seg: 4, rot: [0, 45, 0], cat: 'structure' }, // low pyramid roof
];

/** A11.5: a clean stone hearth, unlit and spotless, an empty iron cauldron on a hook, two ladles, one neat block of split logs. */
const HEARTH = [
	{ p: 'box', at: [0, 0.125, 0], size: [3.6, 0.25, 1.8] },
	...[-1.52, 1.52].map((x) => ({ p: 'box', at: [x, 1.12, -0.1], size: [0.56, 1.74, 1.5] })),
	{ p: 'box', at: [0, 1.12, -0.75], size: [2.5, 1.74, 0.3] },
	{ p: 'box', at: [0, 2.22, -0.05], size: [3.6, 0.46, 1.62] }, // mantel
	{ p: 'box', at: [0, 2.67, -0.3], size: [2.3, 0.42, 1.05] }, // hood
	{ p: 'sphere', at: [0, 0.68, 0.05], size: [0.78, 0.62, 0.78], cat: 'shade' }, // cauldron (iron)
	{ p: 'box', at: [0, 1.5, 0.05], size: [0.04, 0.9, 0.04], cat: 'shade' }, // hook chain
	...[0.62, 0.78].map((x) => ({ p: 'box', at: [x, 1.3, -0.55], size: [0.05, 0.62, 0.05], cat: 'shade' })), // ladles
	{ p: 'box', at: [0.95, 0.45, 0.25], size: [0.7, 0.4, 0.45], cat: 'prop' }, // split logs as one block
];

/** A11.6: a tall plain wooden candle stand with one thick cream candle and a small still flame (emits; follows the light's level). */
const CANDLE_STAND = [
	{ p: 'box', at: [0, 0.05, 0], size: [0.5, 0.1, 0.5] },
	{ p: 'box', at: [0, 0.15, 0], size: [0.36, 0.1, 0.36] },
	{ p: 'box', at: [0, 1.075, 0], size: [0.14, 1.75, 0.14] },
	{ p: 'box', at: [0, 2.0, 0], size: [0.24, 0.1, 0.24] },
	{ p: 'cyl', at: [0, 2.07, 0], size: [0.42, 0.04, 0.42] },
	{ p: 'cyl', at: [0, 2.2, 0], size: [0.14, 0.22, 0.14], cat: 'linen' }, // the thick cream candle
	{ p: 'glow', at: [0, 2.39, 0], size: [0.08, 0.15, 0.08] }, // still teardrop flame
];

/** A18.5: a whitewashed wall section with end pillars, smooth coping and a niche holding one still candle (front = the niche side). */
const NICHE_WALL = [
	...[-2.6, 2.6].flatMap((x) => [
		{ p: 'box', at: [x, 1.725, 0], size: [0.8, 3.45, 0.85] },
		{ p: 'box', at: [x, 3.51, 0], size: [0.9, 0.12, 0.95] },
		{ p: 'mound', at: [x, 3.66, 0], size: [0.8, 0.18, 0.85] },
	]),
	{ p: 'box', at: [0, 1.475, 0], size: [4.4, 2.95, 0.7] },
	{ p: 'box', at: [0, 3.025, 0], size: [4.4, 0.15, 0.8] },
	{ p: 'box', at: [0, 1.66, 0.33], size: [0.56, 0.76, 0.08], cat: 'shade' }, // the niche (dark inset)
	{ p: 'box', at: [0, 1.28, 0.4], size: [0.62, 0.06, 0.16] },
	{ p: 'cyl', at: [0, 1.4, 0.4], size: [0.1, 0.18, 0.1], cat: 'linen' },
	{ p: 'glow', at: [0, 1.55, 0.4], size: [0.06, 0.12, 0.06] },
];

/** A19.1: a plain white-glazed jug-vase with meadow flowers and two poppies. */
const VASE = [
	{ p: 'cyl', at: [0, 0.12, 0], size: [0.2, 0.24, 0.2], cat: 'linen' },
	{ p: 'cyl', at: [0, 0.28, 0], size: [0.1, 0.08, 0.1], cat: 'linen' },
	{ p: 'sphere', at: [0, 0.39, 0], size: [0.3, 0.2, 0.3], cat: 'vegetation' },
	{ p: 'sphere', at: [0.08, 0.47, 0.03], size: [0.07, 0.06, 0.07], cat: 'accent' },
	{ p: 'sphere', at: [-0.06, 0.45, -0.05], size: [0.07, 0.06, 0.07], cat: 'accent' },
];

/** A19.2: a clean wooden tray with a small teapot, two cups and a dish of dried poppy heads. */
const TEA_TRAY = [
	{ p: 'box', at: [0, 0.015, 0], size: [0.5, 0.03, 0.35] },
	{ p: 'sphere', at: [-0.13, 0.1, 0], size: [0.16, 0.14, 0.16], cat: 'linen' },
	...[0.04, 0.13].map((x, i) => ({ p: 'cyl', at: [x, 0.06, i ? -0.08 : 0.08], size: [0.07, 0.06, 0.07], cat: 'linen' })),
	{ p: 'cyl', at: [0.16, 0.045, 0.06], size: [0.12, 0.03, 0.12] },
	...[[0.14, 0.04], [0.18, 0.08], [0.17, 0.03]].map(([x, z]) => ({ p: 'sphere', at: [x, 0.08, z], size: [0.04, 0.04, 0.04], cat: 'vegetation' })),
];

/** A19.3: Mother Hawise's high-backed wooden chair with a clean linen cushion (one narrow red band), and a small round side table at its left (−x). */
const WINDOW_CHAIR = [
	{ p: 'box', at: [0.2, 0.45, 0], size: [0.6, 0.08, 0.6] },
	...[[-0.07, -0.27], [0.47, -0.27], [-0.07, 0.27], [0.47, 0.27]].map(([x, z]) => ({ p: 'box', at: [x, 0.225, z], size: [0.06, 0.45, 0.06] })),
	{ p: 'box', at: [0.2, 0.84, -0.28], size: [0.6, 0.76, 0.07] },
	...[-0.07, 0.47].map((x) => ({ p: 'sphere', at: [x, 1.2, -0.28], size: [0.08, 0.1, 0.08] })),
	...[-0.07, 0.47].map((x) => ({ p: 'box', at: [x, 0.62, 0], size: [0.06, 0.26, 0.55] })),
	{ p: 'box', at: [0.2, 0.53, 0.02], size: [0.56, 0.08, 0.56], cat: 'linen' },
	{ p: 'box', at: [0.2, 0.82, -0.22], size: [0.52, 0.42, 0.08], cat: 'linen' },
	{ p: 'box', at: [0.2, 0.92, -0.175], size: [0.52, 0.04, 0.01], cat: 'accent' },
	{ p: 'cyl', at: [-0.35, 0.6, 0], size: [0.4, 0.04, 0.4] },
	{ p: 'cyl', at: [-0.35, 0.29, 0], size: [0.08, 0.58, 0.08] },
	{ p: 'cyl', at: [-0.35, 0.02, 0], size: [0.28, 0.04, 0.28] },
];

/** A19.4: a tall wooden linen press with its doors open and neat piles of folded clean linen. */
const LINEN_PRESS = [
	{ p: 'box', at: [0, 0.97, -0.03], size: [1.2, 1.78, 0.54] },
	{ p: 'box', at: [0, 1.88, 0], size: [1.3, 0.1, 0.62] },
	...[-0.52, 0.52].map((x) => ({ p: 'box', at: [x, 0.04, 0], size: [0.14, 0.08, 0.5] })),
	...[-0.62, 0.62].map((x) => ({ p: 'box', at: [x, 1.0, 0.56], size: [0.05, 1.56, 0.56] })), // the open doors
	...[0.36, 0.73, 1.1, 1.47].flatMap((y) => [-0.27, 0.27].map((x) => ({ p: 'box', at: [x, y, 0.06], size: [0.48, 0.2, 0.42], cat: 'linen' }))),
];

/** A19.5: a three-panel ward screen, clean linen in plain wooden frames, standing in a shallow zig-zag. */
const LINEN_SCREEN = [
	...[[-0.8, 0.1, 18], [0, -0.06, 0], [0.8, 0.1, -18]].flatMap(([x, z, ry]) => [
		{ p: 'box', at: [x, 0.98, z], size: [0.72, 1.4, 0.025], rot: [0, ry, 0], cat: 'linen' },
		{ p: 'box', at: [x, 1.74, z], size: [0.8, 0.05, 0.05], rot: [0, ry, 0] },
		{ p: 'box', at: [x, 0.22, z], size: [0.8, 0.05, 0.05], rot: [0, ry, 0] },
	]),
	...[[-1.2, 0.17], [-0.4, 0.02], [0.4, 0.02], [1.2, 0.17]].flatMap(([x, z]) => [
		{ p: 'cyl', at: [x, 0.9, z], size: [0.05, 1.8, 0.05] },
		{ p: 'sphere', at: [x, 1.82, z], size: [0.08, 0.08, 0.08] },
	]),
];

/** A19.6 (the dressing of an engine window opening): a deep whitewashed sill, wooden glazing bars and one steady candle on the sill (front = inside). */
const WARD_WINDOW = [
	{ p: 'box', at: [0, 0.84, 0.3], size: [1.5, 0.08, 0.46] },
	{ p: 'box', at: [0, 2.2, 0], size: [0.05, 2.8, 0.05], cat: 'prop' },
	...[1.6, 2.4, 3.1].map((y) => ({ p: 'box', at: [0, y, 0], size: [1.3, 0.05, 0.05], cat: 'prop' })),
	{ p: 'arc', at: [0, 3.45, 0.05], size: [1.5, 0.45, 0.62], lift: 0.6, rot: [0, 0, 180] }, // the round head of the reveal
	{ p: 'cyl', at: [0.42, 0.98, 0.34], size: [0.1, 0.2, 0.1], cat: 'linen' },
	{ p: 'glow', at: [0.42, 1.14, 0.34], size: [0.06, 0.12, 0.06] },
];

/** A standing NPC stand-in: habit, a white wimple and veil with the narrow poppy-red embroidered band (the Poppy Sisters, Mother Hawise). */
function sisterShape(h = 1.72, veil = 0.42) {
	const k = h / 1.72;
	return [
		{ p: 'cone', at: [0, 0.62 * k, 0], size: [0.62 * k, 1.24 * k, 0.5 * k], top: 0.5, seg: 12 },
		{ p: 'cyl', at: [0, 1.35 * k, 0], size: [0.36 * k, 0.26 * k, 0.26 * k], seg: 10 },
		{ p: 'sphere', at: [0, 1.5 * k, 0], size: [0.46 * k, 0.16 * k, 0.3 * k] },
		{ p: 'cone', at: [0, (1.62 - veil / 2) * k, -0.05], size: [0.52 * k, veil * k, 0.42 * k], top: 0.45, seg: 12, cat: 'linen' }, // the veil
		{ p: 'sphere', at: [0, 1.62 * k, -0.02], size: [0.27 * k, 0.29 * k, 0.27 * k], cat: 'linen' }, // the wimple
		{ p: 'sphere', at: [0, 1.6 * k, 0.07], size: [0.17 * k, 0.21 * k, 0.17 * k], cat: 'skin' }, // the face in the wimple
		{ p: 'cyl', at: [0, 1.5 * k, -0.02], size: [0.34 * k, 0.035, 0.32 * k], seg: 12, cat: 'accent' }, // the poppy-red embroidery
		{ p: 'box', at: [0, 1.12 * k, 0.2 * k], size: [0.22 * k, 0.12, 0.08], cat: 'skin' }, // hands folded
	];
}

/** Tamsin (16, thin): an oiled wool hood, a quilted coat, a short bow on the back, traps at the belt. */
const TAMSIN = [
	...[-0.09, 0.09].map((x) => ({ p: 'cyl', at: [x, 0.4, 0], size: [0.12, 0.8, 0.12], cat: 'shade' })),
	{ p: 'cone', at: [0, 1.06, 0], size: [0.44, 0.62, 0.3], top: 0.75, seg: 10 },
	{ p: 'sphere', at: [0, 1.4, 0], size: [0.4, 0.14, 0.26] },
	{ p: 'sphere', at: [0, 1.53, 0.04], size: [0.16, 0.2, 0.17], cat: 'skin' },
	{ p: 'sphere', at: [0, 1.56, -0.02], size: [0.25, 0.27, 0.25], cat: 'prop' }, // the oiled wool hood
	{ p: 'arc', at: [0.04, 1.1, -0.18], size: [0.18, 0.95, 0.04], lift: 0.5, rot: [0, 90, 90], cat: 'prop' }, // the short bow on the back
	{ p: 'box', at: [0.18, 0.86, 0.1], size: [0.12, 0.1, 0.08], cat: 'shade' }, // a trap at the belt
];

/** A smiling sleeper on a hospice bed (head at the back, −z, on the pillow): the body under the clean sheet, the hands folded on it. */
const SLEEPER = [
	{ p: 'mound', at: [0, 0.11, 0.2], size: [0.62, 0.22, 1.5], cat: 'linen' },
	{ p: 'box', at: [0, 0.2, -0.5], size: [0.66, 0.05, 0.12], cat: 'linen' }, // the turned-down hem
	{ p: 'sphere', at: [0, 0.13, -0.74], size: [0.2, 0.19, 0.24], cat: 'skin' },
	{ p: 'sphere', at: [0, 0.15, -0.8], size: [0.22, 0.15, 0.18] }, // hair
	{ p: 'box', at: [0, 0.23, -0.28], size: [0.36, 0.06, 0.12], cat: 'skin' },
];

// ---- KIT: every model the map needs (status: glb | kit | procedural | blockout) ------------------------------------------------------------------
const A11 = 'concept A11 cell';
const V2 = (g, c) => `concept ${g} cell ${c} (v2 batch)`;
const V3 = (g, c) => `concept ${g} cell ${c} (v3 batch)`;
export const KIT = {
	'A11.1': {
		name: 'Whitewashed cloister bay (three round arches)', short: 'Vòm cloister', category: 'building', size: [5.4, 3.815, 2.82], status: 'glb', source: `${A11} 1`,
		segment: 'cloister', shape: cloisterBayShape(), model: 'act1-a11-1-cloister-bay',
		note: 'the GLB is a closed little pavilion (solid back wall, both end walls, a gable roof over a 1 m walk): its back and end walls below the roof (y < 2.42 m) are cut away so the walk behind the arches stays 1.9 m wide and runs on from bay to bay; arches 1.1 / 1.0 / 0.9 m between the four piers (the blockers); the roof covers the walk (the wall fade opens it round the focus; the exterior-only N-HS12 roofs are dropped)',
		// cut boxes in the GLB frame [x0, y0, z0, x1, y1, z1]: the back wall, the two end walls behind the end piers, a flap of the west end wall's inner face
		// and a sliver at the back-west corner (the build drops the triangles whose centroid is inside; the walk band 0.35–1.7 m behind the piers is then empty)
		cut: [[-2.75, -0.05, -1.45, 2.75, 2.42, -0.45], [-2.75, -0.05, -1.45, -2.05, 2.42, 0.29], [1.75, -0.05, -1.45, 2.75, 2.42, 0.42], [-2.23, 0.3, 0.285, -2.15, 1.9, 0.326], [-2.75, 2.42, -1.45, -2.05, 2.48, -0.45]],
		blockers: [{ rect: [-2.65, 0.31, -2.1, 0.86] }, { rect: [-1.0, 0.41, -0.5, 0.95] }, { rect: [0.5, 0.45, 0.9, 1.0] }, { rect: [1.8, 0.5, 2.3, 1.0] }], // the GLB piers (0.35–1.7 m band)
	},
	'A11.2': {
		name: 'Hospice bed', short: 'Giường bệnh', category: 'prop', size: [1.198, 1.07, 2.16], status: 'glb', source: `${A11} 2`, segment: 'ward', model: 'act1-a11-2-hospice-bed',
		note: 'two rows in the ward; Fen\'s bed (north row, east end) is empty; the GLB is keyed on the 2.16 m length; uniformly it was 1.71 m wide (concept 1.08 m) and read as a double bed with one sleeper, so the prep narrows its width alone ×0.7 to 1.2 m (prepare-act1-kit.py SQUASH, kit fix 10-23: a plain bed frame, the texture stretch is small); 1.5 m stays between beds at the 2.71 m pitch (the candle stands and windows stand there); mattress top 0.67 m (the sleepers lie at 0.70)',
		shape: BED, collider: 1.0, // mattress 0.67 m: the prism keeps the hero off the beds (and their sleepers)
	},
	'A11.3': {
		name: 'Refectory table with bread (two benches)', short: 'Bàn ăn + bánh mì', category: 'prop', size: [4.32, 2.073, 2.575], status: 'glb', source: `${A11} 3`,
		segment: 'refectory', model: 'act1-a11-3-refectory-table', shape: TABLE,
		note: 'two tables + the high table; the bread is always fresh; keyed on the 4.32 m length the GLB top stands at 1.2 m: placed at scale 0.68 (2.94 × 1.41 × 1.75 m, top 0.82 m, benches 0.40–0.46 m); it brings its own jug of flowers (no A19.1 vase on it)',
		collider: 1.5, // × the 0.68 placement scale = 1.02 m: the benches are under Play's 0.6 m step
	},
	'A11.4': {
		name: 'Gate tower', short: 'Tháp cổng', category: 'building', size: [2.4 * H, 4 * H, 2.4 * H], status: 'blockout', source: `${A11} 4`, segment: 'gate',
		note: 'the rain stops here (LD proposal); the passage is 2 m wide; the blockers are its side walls · kept as a blockout (kit swap 2026-10-23): the act1-a11-4-gate-tower GLB has no through passage (its front arch opens into a hall closed by a blind back wall) and no +x wall below ≈ 4 m: it needs a rebuild',
		shape: GATE_TOWER, blockers: [{ rect: [-2.16, -2.16, -1.0, 2.16] }, { rect: [1.0, -2.16, 2.16, 2.16] }],
	},
	'A11.5': {
		name: 'Kitchen hearth with cauldron', short: 'Lò bếp + nồi', category: 'building', size: [2.333, 2.88, 1.963], status: 'glb', source: `${A11} 5`, segment: 'kitchen', model: 'act1-a11-5-kitchen-hearth',
		note: 'unlit and spotless (concept): a kitchen that never seems to cook; the GLB is 2.33 m wide (concept 3.6 m), its back on the kitchen\'s north wall', shape: HEARTH,
		collider: 2.0, // a box over the footprint: the hero does not step into the fire opening (the model stays out of Play's collision)
	},
	'A11.6': {
		name: 'Steady candle stand', short: 'Chân nến đứng yên', category: 'prop', size: [0.611, 2.34, 0.617], status: 'glb', source: `${A11} 6`, segment: 'ward · refectory · kitchen · cloister', model: 'act1-a11-6-candle-stand',
		note: 'Perfection light: the candles never flicker; many identical in rows (a real light on some, a still glow on the others); the light, its halo and the still flame (KIT globe) sit on the GLB flame (0.04, 2.24, 0.06; 2.16–2.33 m)', shape: CANDLE_STAND, round: true, foot: [0.6, 0.6],
		globe: [{ p: 'glow', at: [0.04, 2.245, 0.06], size: [0.075, 0.17, 0.075] }], // the still teardrop flame over the GLB's painted one
		light: { kind: 'perfection', y: 2.24, offset: [0.04, 0.06], color: CANDLE, range: 6.5, intensity: 7, glow: 0.5, glowGain: 0.9, pool: 1.7, poolGain: 0.12 },
	},
	'A18.4': {
		name: 'Hospice ward range (exterior)', short: 'Dãy nhà bệnh (ngoại thất)', category: 'building', size: [30, 11, 9], status: 'blockout', source: V2('A18', 4), segment: 'ward',
		unplaced: 'built by the engine: the ward range = the lime walls and windows of the ward and the parlour + the roof N-HS10 (exterior only); the model serves the far views (N-GH) and map 3',
	},
	'A18.5': {
		name: 'Hospice boundary wall with niche (still candle)', short: 'Tường hốc nến', category: 'structure', size: [6, 2.95, 0.85], status: 'glb', source: V2('A18', 5), segment: 'forecourt',
		note: 'the forecourt\'s side walls; the niche candles burn still in the rain', shape: NICHE_WALL, model: 'act1-a18-5-hospice-wall-niche', collider: 2.0, // a box over the footprint (the model stays out of Play's collision)
		light: { kind: 'perfection', y: 1.5, offset: [0, 0.1], color: CANDLE, range: 4, intensity: 3, glow: 0.4, glowGain: 0.85, fadeWithWall: true }, // the GLB's niche candle
	},
	'A18.6': {
		name: 'Hilltop approach steps (whitewashed retaining terrace)', short: 'Bậc thềm lên đồi', category: 'structure', size: [4, 2, 5], status: 'procedural', source: V2('A18', 6), segment: 'approach',
		unplaced: 'built by the engine: the walled steps room (10 treads × 0.18 m, lime parapets) + the forecourt\'s retaining wall; the two potted flowers are N-HS03',
	},
	'A19.1': {
		name: 'Flowers in a vase', short: 'Hoa trong bình', category: 'prop', size: [0.4, 0.5, 0.2], status: 'glb', source: V2('A19', 1), segment: 'ward · refectory · kitchen · parlour',
		note: 'on the ward window sills and the tables', shape: VASE, solid: false, model: 'act1-a19-1-vase-flowers',
	},
	'A19.2': {
		name: 'Poppy tea on a tray', short: 'Khay trà anh túc', category: 'prop', size: [0.5, 0.22, 0.31], status: 'glb', source: V2('A19', 2), segment: 'parlour · kitchen',
		note: 'the vision trigger (Mother Hawise offers it by the warm window)', shape: TEA_TRAY, solid: false, model: 'act1-a19-2-poppy-tea-tray',
	},
	'A19.3': {
		name: 'Mother Hawise\'s window chair (+ side table)', short: 'Ghế cửa sổ của Hawise', category: 'prop', size: [1.18, 1.2, 0.71], status: 'glb', source: V2('A19', 3), segment: 'parlour',
		note: 'seat 0.53 m, side table top 0.56 m at (−0.39, 0.15)', shape: WINDOW_CHAIR, model: 'act1-a19-3-window-chair', collider: 1.0, // seat under Play's 0.6 m step: the prism keeps the hero off it
	},
	'A19.4': {
		name: 'Linen press', short: 'Tủ vải lanh', category: 'prop', size: [1.35, 1.9, 0.95], status: 'glb', source: V2('A19', 4), segment: 'linen room · parlour', shape: LINEN_PRESS,
		note: 'the open doors reach 0.35 m in front of the carcass (back at local z −0.475); top 1.90 m', model: 'act1-a19-4-linen-press', collider: 1.9,
	},
	'A19.5': {
		name: 'Linen folding screen', short: 'Bình phong lanh', category: 'linen', size: [2.0, 1.8, 0.96], status: 'glb', source: V2('A19', 5), segment: 'ward · linen room',
		note: 'Tamsin hides behind one at Fen\'s bed; a deep zig-zag (0.96 m)', shape: LINEN_SCREEN, model: 'act1-a19-5-linen-screen', collider: 1.8,
	},
	'A19.6': {
		name: 'Tall ward window (deep sill, one steady candle)', short: 'Cửa sổ cao + nến', category: 'building', size: [2.4, 3.29, 0.67], status: 'glb', source: V2('A19', 6), segment: 'ward · parlour',
		note: 'a wall section with a blind window (solid back) mounted on the inner face of an engine window opening (the opening, its pane and glow stay the engine\'s; the opening is 2.4 m tall so the 3.29 m section covers it); fades with its wall',
		shape: WARD_WINDOW, solid: false, model: 'act1-a19-6-tall-ward-window',
		light: { kind: 'perfection', y: 1.19, offset: [-0.47, 0.12], color: CANDLE, range: 4.5, intensity: 3, glow: 0.38, glowGain: 0.85, pool: 0.9, poolGain: 0.1, fadeWithWall: true }, // the GLB's sill candle
	},
	'N-HS02': {
		name: 'Garth flower bed (pale flowers, two poppies)', short: 'Bồn hoa sân cỏ', category: 'vegetation', size: [3.2, 1.269, 3.23], status: 'glb', source: V3('A23', 3), segment: 'cloister',
		note: 'a square limewashed kerb (soil top ≈ 0.49 m) with pale flower mounds to 1.27 m (concept 0.55 m overall) and the two poppies in the middle; blocks as a whole (3.2 m square, was a 3.2 m disc)',
		model: 'act1-a23-3-garth-flower-bed', collider: 1.3, // the kerb is under Play's 0.6 m step: the prism keeps the hero off the flowers
		shape: [
			{ p: 'box', at: [0, 0.245, 0], size: [3.2, 0.49, 3.23], cat: 'building' },
			{ p: 'mound', at: [0, 0.75, 0], size: [2.9, 0.52, 2.9], seg: 16 },
			{ p: 'sphere', at: [0.25, 1.15, 0.1], size: [0.14, 0.12, 0.14], cat: 'accent' },
			{ p: 'sphere', at: [-0.25, 1.15, -0.1], size: [0.14, 0.12, 0.14], cat: 'accent' },
		],
	},
	'N-HS03': {
		name: 'Potted flowers (clean terracotta pot)', short: 'Chậu hoa', category: 'vegetation', size: [0.592, 0.75, 0.6], status: 'glb', source: V3('A23', 4),
		segment: 'forecourt · cloister', note: 'the six pots are identical (no placement-scale variety: Perfection keeps every plant the same); QA: no lavender spikes, many flowers grey-green instead of cream',
		model: 'act1-a23-4-potted-flowers', collider: 0.9, round: true, shape: [
			{ p: 'cone', at: [0, 0.21, 0], size: [0.5, 0.42, 0.5], top: 1.25, cat: 'prop', seg: 12 },
			{ p: 'sphere', at: [0, 0.57, 0], size: [0.6, 0.36, 0.6] },
			{ p: 'sphere', at: [0.12, 0.72, 0.08], size: [0.09, 0.08, 0.09], cat: 'accent' },
		],
	},
	'N-HS04': {
		name: 'Walled flower bed (herbs, white flowers)', short: 'Luống hoa vườn', category: 'vegetation', size: [4, 1.105, 1.242], status: 'glb', source: V3('A23', 5), segment: 'Mother\'s garden',
		note: 'the walled garden under the high window (seen, not walked); kerb top 0.27 m, leaves to 1.11 m (concept 0.5 m); QA: the lavender and white flower spikes are missing (spiky leaves, a few flat flowers)',
		model: 'act1-a23-5-walled-flower-bed', collider: 1.1, shape: [
			{ p: 'box', at: [0, 0.135, 0], size: [4, 0.27, 1.24], cat: 'building' },
			{ p: 'mound', at: [0, 0.6, 0], size: [3.7, 0.66, 1.0] },
			{ p: 'sphere', at: [1.1, 0.95, 0.1], size: [0.1, 0.09, 0.1], cat: 'accent' },
		],
	},
	'N-HS05': {
		name: 'Linen drying line (clean sheets)', short: 'Dây phơi vải lanh', category: 'linen', size: [3.829, 2.2, 0.268], status: 'glb', source: V3('A23', 6), segment: 'Mother\'s garden',
		note: 'clean sheets hanging dead still in the dry, windless garden; 3.83 m wide (concept 6 m): the GLB posts\' feet are at x −1.79 and +1.80 (measured on the mesh), the sheets hang from the line (≈ 1.9 m) to 0.25–0.55 m; only the posts block (the garden is seen, not walked: the sheets would be a cloth wall where the hero could reach it)',
		model: 'act1-a23-6-drying-line', blockers: [{ at: [-1.79, 0], r: 0.18 }, { at: [1.8, 0], r: 0.18 }], collider: 2.2, shape: [
			...[-1.79, 1.8].map((x) => ({ p: 'box', at: [x, 1.1, 0], size: [0.12, 2.2, 0.12], cat: 'prop' })),
			{ p: 'box', at: [0, 1.95, 0], size: [3.6, 0.02, 0.02], cat: 'prop' },
			...[-1.1, 0, 1.1].map((x) => ({ p: 'drape', at: [x, 1.15, 0], size: [1.05, 1.5, 0.12], folds: 2 })),
		],
	},
	'N-HS06': {
		name: 'Kitchen work table (bowls, bread)', short: 'Bàn bếp', category: 'prop', size: [2.4, 1.111, 1.007], status: 'glb', source: V3('A24', 1), segment: 'kitchen',
		note: 'top 0.84 m; it brings its own three nested bowls (x −1.0…−0.5, to 1.11 m), two loaves on a board with the knife (x −0.3…+0.4) and a folded white cloth (x +0.4…+1.1, top 0.90 m): the poppy tea tray stands on the cloth, no A19.1 vase on it',
		model: 'act1-a24-1-kitchen-table', collider: 1.1, shape: [
			{ p: 'box', at: [0, 0.86, 0], size: [2.4, 0.08, 1.0] },
			...[[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]].map(([x, z]) => ({ p: 'box', at: [x, 0.41, z], size: [0.08, 0.82, 0.08] })),
			...[-0.8, -0.35].map((x) => ({ p: 'cyl', at: [x, 0.95, 0.15], size: [0.3, 0.1, 0.3], cat: 'linen' })),
			{ p: 'mound', at: [0.75, 0.98, 0], size: [0.42, 0.16, 0.26] },
		],
	},
	'N-HS07': {
		name: 'Bread rack (fresh loaves)', short: 'Giá bánh mì', category: 'prop', size: [1.164, 1.8, 0.508], status: 'glb', source: V3('A24', 2), segment: 'kitchen',
		note: 'replaces the A19.4 linen press stand-in; 1.16 m wide (concept 1.6 m: keyed on the width it would be 2.42 m tall), shelves 0.15–1.34 m; the back 0.25 m behind the pivot (on the wall at x + 0.26)',
		model: 'act1-a24-2-bread-rack', foot: [1.2, 0.55], collider: 1.8, shape: [
			...[-0.55, 0.55].map((x) => ({ p: 'box', at: [x, 0.9, 0], size: [0.06, 1.8, 0.5] })),
			...[0.15, 0.55, 0.95, 1.34].flatMap((y) => [
				{ p: 'box', at: [0, y, 0], size: [1.06, 0.04, 0.48] },
				...[-0.3, 0, 0.3].map((x) => ({ p: 'mound', at: [x, y + 0.1, 0], size: [0.26, 0.16, 0.24], cat: 'story' })),
			]),
		],
	},
	'N-HS08': {
		name: 'Folding table with folded linen', short: 'Bàn gấp vải', category: 'prop', size: [2.4, 1.091, 1.032], status: 'glb', source: V3('A24', 3), segment: 'linen room',
		note: 'trestle table, top 0.82 m, the folded linen stacks to 1.09 m (one tied with a poppy-red ribbon)', model: 'act1-a24-3-linen-folding-table', collider: 1.1, shape: [
			{ p: 'box', at: [0, 0.86, 0], size: [2.4, 0.08, 1.0] },
			...[[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]].map(([x, z]) => ({ p: 'box', at: [x, 0.41, z], size: [0.08, 0.82, 0.08] })),
			...[-0.75, 0, 0.75].map((x, i) => ({ p: 'box', at: [x, 0.98 + 0.05 * i, 0], size: [0.55, 0.16 + 0.1 * i, 0.45], cat: 'linen' })),
		],
	},
	'N-HS09': {
		name: 'Night stair down to the Garden of Hush', short: 'Cầu thang đêm', category: 'structure', size: [3, 3, 6], status: 'procedural', source: 'LD only, no concept', segment: 'stair',
		note: 'built by the engine: 15 treads (0.1875 m) from the kitchen down to a landing whose far end sinks into the dark; final art: a stair / vault kit',
		unplaced: 'built by the engine (the stair hall: treads, lime walls, the void end)',
	},
	'N-HS10': {
		name: 'Ward range roof (slate, exterior only)', short: 'Mái dãy nhà bệnh', category: 'structure', size: [10.4, 4.2, 31.6], status: 'blockout', source: 'LD only (part of A18.4)', segment: 'ward',
		note: 'shown while the focus is outdoors; the interior has no ceilings (camera)', shape: [{ p: 'prism', at: [0, 2.1, 0], size: [10.4, 4.2, 31.6] }], roof: true, solid: false,
	},
	'N-HS11': {
		name: 'East range roof (slate, exterior only)', short: 'Mái dãy nhà ăn', category: 'structure', size: [11, 3.6, 32.4], status: 'blockout', source: 'LD only, no concept', segment: 'refectory · kitchen',
		shape: [{ p: 'prism', at: [0, 1.8, 0], size: [11, 3.6, 32.4] }], roof: true, solid: false,
	},
	'N-HS12': {
		name: 'Cloister lean-to roof bay (tiles, exterior only)', short: 'Mái hiên cloister', category: 'structure', size: [5.4, 1.0, 3.7], status: 'blockout', source: 'part of A11.1 (its lean-to roof)', segment: 'cloister',
		note: 'split off A11.1 so the walk reads from the camera; shown while the focus is outdoors', shape: [{ p: 'box', at: [0, 0.5, 0], size: [5.4, 0.14, 3.7], rot: [15, 0, 0] }], roof: true, solid: false,
		unplaced: 'not placed since the kit swap (2026-10-23): the A11.1 GLB brings its own gable roof over the walk, these exterior-only lean-to roofs would double it',
	},
	'N-HS13': {
		name: 'Night stair roof (exterior only)', short: 'Mái cầu thang đêm', category: 'structure', size: [3.8, 1.4, 12.4], status: 'blockout', source: 'LD only, no concept', segment: 'stair',
		shape: [{ p: 'prism', at: [0, 0.7, 0], size: [3.8, 1.4, 12.4] }], roof: true, solid: false,
	},
	'A08.1': {
		name: 'Poppy drift clump', short: 'Khóm anh túc', category: 'vegetation', size: [1.5 * H, 0.6 * H, 1.5 * H], status: 'blockout', source: 'concept A08 cell 1 (shared with map 3)', segment: 'approach',
		note: 'the last poppies of the Reach on the lower slope (walk-through)', solid: false, shape: [
			{ p: 'mound', at: [0, 0.35, 0], size: [2.5, 0.7, 2.3] },
			...[[0.5, 0.2], [-0.6, 0.3], [0.1, -0.6], [-0.3, -0.1], [0.8, -0.4], [-0.9, -0.5]].map(([x, z]) => ({ p: 'sphere', at: [x, 0.78 + 0.08 * z, z], size: [0.34, 0.12, 0.34], cat: 'accent' })),
		],
	},
	'glb:dungeon-prop-flint-boulders': {
		name: 'Flint boulders (2 m wide)', short: 'Đá lửa (GLB)', category: 'rock', size: [2, 1.1, 1.8], status: 'glb', model: 'dungeon-prop-flint-boulders',
		source: 'lookdev-lab/assets/terrain-biomes/dungeon-prop-flint-boulders.glb (ashlar/3d/props/dungeon_v1)', segment: 'approach', note: 'flint country of the Poppy Reach: the hillside',
	},
	// NPC stand-ins (KIT npc: reported in NPCS, not in ASSETS; walk-through)
	'NPC.Hawise': {
		name: 'Mother Hawise (NPC stand-in)', short: 'Mẹ Hawise', category: 'npc', size: [0.7, 1.82, 0.6], status: 'blockout', npc: true, solid: false, segment: 'parlour', shape: sisterShape(1.82, 0.62),
	},
	'NPC.Sister': {
		name: 'Poppy Sister (NPC stand-in)', short: 'Sơ Anh Túc', category: 'npc', size: [0.65, 1.72, 0.55], status: 'blockout', npc: true, solid: false, segment: 'cloister · ward · kitchen · gate', shape: sisterShape(),
	},
	'NPC.Tamsin': {
		name: 'Tamsin (NPC stand-in)', short: 'Tamsin', category: 'npc', size: [0.5, 1.66, 0.45], status: 'blockout', npc: true, solid: false, segment: 'ward', shape: TAMSIN,
	},
	'NPC.Sleeper': {
		name: 'Smiling sleeper (NPC stand-in on a bed)', short: 'Người ngủ mỉm cười', category: 'npc', size: [0.7, 0.3, 1.9], status: 'blockout', npc: true, solid: false, segment: 'ward', shape: SLEEPER,
	},
};

// ---- layout (metres; the compound's floor is y = 0, the hill falls away to the south toward the Poppy Reach) ----------------------------------------------
const WARD_X = [-9.5, -6.786, -4.071, -1.357, 1.357, 4.071, 6.786, 9.5]; // eight bed places per row (2.71 m apart); the gaps take the windows / candle stands
const GAPS = [-8.143, -5.429, -2.714, 0, 2.714, 5.429, 8.143];
const BED_N = -21.82; // north row (heads at the north wall)
const BED_S = -15.6; // south row (heads at the shared wall with the north walk)
const DOOR_GAP = [[-2.0, -17.0, 2.0, -14.0]]; // the ward door (from the north walk) keeps the south row's two middle places free
const FEN = [[9.0, -23.0, 10.0, -20.5]]; // Fen's bed: no sleeper
const HILL_PATH = [[-1.5, 63], [4.5, 53], [-3.5, 44.5], [-9.6, 33], [-9.6, 25.1]];
const PATROL_CLOISTER = [[-9.6, -12.6], [9.6, -12.6], [9.6, 6.6], [-9.6, 6.6]];
const PATROL_WARD = [[-9.0, -18.2], [5.0, -17.75], [9.8, -18.0]];
const PATROL_KITCHEN = [[16.2, -19.8], [16.2, -10.5], [16.0, -7.4], [13.0, -4.0], [9.6, -4.0]];
const ESCORT = [[8.0, -19.7], [8.0, -17.75], [0.0, -17.75], [0.0, -12.9], [-9.6, -12.6], [-9.6, 6.6], [-9.6, 12.4], [-9.6, 17.5]];

const LIME = 'BIO05_lime';
const HOUSE_WALL = { height: 5.0, thickness: 0.6, tile: LIME, tone: 1.15, normal: 0.3, top: 4.3 }; // a soft normal: new whitewash, the tile's cells must not read as cracks

export const PLAN = {
	engine: 'interior',
	id: 'gentleHouse',
	name: 'The Gentle House',
	label: 'ASHLAR · Act I · base · Gentle House',
	ld: '11.9',
	biome: 'BIO-05',
	area: 'Holy place · no combat · D4 C0 · 12 min',
	seed: 1109,
	grid: 0.25,
	target: {
		length: 160,
		note: 'full map: the climb from the Poppy Reach (~100 m of switchbacks between drystone walls), the forecourt, a compound ≈ 45 × 35 m with the ward\'s upper storey (the high window), a chapel and the sisters\' dormitory; this slice is 66 × 94 m (a 40 m climb)',
	},
	bounds: [-30, -28, 36, 66],
	heroLight: true,
	floor: {
		layers: [
			{ id: 'BIO05_lime', tile: 3.5 }, // 0 limed flags of the house (ward, parlour, refectory): new, clean
			{ id: 'BIO24_keystone', tile: 3 }, // 1 dressed stone flags: walks, forecourt, steps, kitchen, linen room, the garth's paths
			{ id: 'DW_grass', tile: 3 }, // 2 garth lawn, the Mother's garden, the hillside
			{ id: 'BIO02_meadow', tile: 4 }, // 3 the poppy meadow at the foot of the hill (the Reach)
			{ id: 'BIO03_flint', tile: 3 }, // 4 the flint path up the hill
			{ id: 'BIO08_nave', tile: 3.5 }, // 5 the old flags of the night stair (the crypts below)
		],
		tone: 0.82,
		ppm: 6,
		apron: 10,
		mesh: 0.5,
		paint: [
			{ layer: 'BIO24_keystone', kind: 'room', rooms: ['walkN', 'walkS', 'walkW', 'walkE', 'forecourt', 'steps', 'kitchen', 'linen'], soft: 0.5, noise: 0.2 },
			{ layer: 'DW_grass', kind: 'room', rooms: ['garth', 'garden', 'hill'], soft: 0.8, noise: 0.3 },
			{ layer: 'BIO24_keystone', kind: 'path', points: [[-8.1, -3], [8.1, -3]], width: 1.6, soft: 0.5, clear: ['DW_grass'] },
			{ layer: 'BIO24_keystone', kind: 'path', points: [[0, -11.1], [0, 5.1]], width: 1.6, soft: 0.5, clear: ['DW_grass'] },
			{ layer: 'BIO02_meadow', kind: 'rect', rect: [-32, 46, 22, 72], soft: 10, amount: 0.95, clear: ['DW_grass'] },
			{ layer: 'BIO02_meadow', kind: 'noise', scale: 0.12, lo: 0.56, hi: 0.72, rooms: ['hill'], amount: 0.7 },
			{ layer: 'BIO03_flint', kind: 'path', points: HILL_PATH, width: 2.6, soft: 1.6, noise: 0.6 },
			{ layer: 'BIO08_nave', kind: 'room', rooms: ['stairHall'], soft: 0.6 },
			{ layer: 'DW_grass', kind: 'void', width: 0.6, noise: 0.3 }, // the dark apron past the void edges: the hillside falling away
			{ layer: 'BIO08_nave', kind: 'rect', rect: [33, -9, 48, 2], soft: 2, clear: ['DW_grass'] }, // … and the night stair going on down
			{ wet: 0.8, kind: 'room', rooms: ['hill', 'forecourt', 'steps'], soft: 1 }, // outside the gate the ground is wet; inside, dry
		],
	},
	wall: HOUSE_WALL,
	rooms: [
		// walled rooms first (a shared wall takes the style of the earlier room)
		{
			id: 'parlour', name: 'Phòng Mẹ Hawise · cửa sổ ấm', shape: { rect: [-19, -23, -11.1, -14.1] }, y: PARLOUR_Y, walled: true, tag: 'parlour',
			wall: { ...HOUSE_WALL, height: 4.0, top: 3.4 },
		},
		{ id: 'ward', name: 'Phòng bệnh dài', shape: { rect: [-11.1, -23, 11.1, -14.1] }, y: 0, walled: true, tag: 'ward', wall: { ...HOUSE_WALL, height: 5.2, top: 4.5 } },
		{
			id: 'garden', name: 'Vườn của Mẹ (có tường, không vào được)', shape: { rect: [-19, -14.1, -11.1, 8.1] }, y: 0, walled: true, outdoor: true, tag: 'garden',
			wall: { ...HOUSE_WALL, height: 3.2, top: 2.8 }, wallSides: { e: { height: 5.0, top: 4.3 }, s: { height: 5.0, top: 4.3 } },
		},
		{ id: 'refectory', name: 'Nhà ăn', shape: { rect: [11.1, -23, 21.5, -9] }, y: 0, walled: true, tag: 'refectory', wall: { ...HOUSE_WALL, height: 4.8, top: 4.1 } },
		{ id: 'kitchen', name: 'Bếp', shape: { rect: [11.1, -9, 21.5, 1.5] }, y: 0, walled: true, tag: 'kitchen', wall: { ...HOUSE_WALL, height: 4.8, top: 4.1 } },
		{ id: 'linen', name: 'Phòng vải lanh', shape: { rect: [11.1, 1.5, 21.5, 8.1] }, y: 0, walled: true, tag: 'linen', wall: { ...HOUSE_WALL, height: 4.8, top: 4.1 } },
		{
			id: 'stairHall', name: 'Cầu thang đêm xuống Garden of Hush', shape: { rect: [21.5, -5.5, 33.5, -2.5] }, y: -3, walled: true, edge: { default: 'wall', e: 'void' }, tag: 'stair',
			wall: { ...HOUSE_WALL, height: 1.4, tone: 0.8, top: 1.0 }, // low: the stair reads from the camera
		},
		{ id: 'steps', name: 'Bậc thềm lên đồi', shape: { rect: [-11.6, 20.1, -7.6, 25.1] }, y: -1, walled: true, outdoor: true, tag: 'steps', wall: { ...HOUSE_WALL, height: 0.9, thickness: 0.45, top: 3 } },
		{
			id: 'forecourt', name: 'Sân trước cổng (dưới mưa)', shape: { rect: [-17, 8.1, -2, 20.1] }, y: 0, walled: true, outdoor: true, edge: { default: 'wall', w: 'none', e: 'none' }, tag: 'forecourt',
			wall: { ...HOUSE_WALL, height: 0.9, thickness: 0.5, top: 3 }, wallSides: { n: { height: 5.0, thickness: 0.6, top: 4.3 } },
		},
		// the cloister: four walks (they merge with the garth: no wall, the arcade bays stand on the line)
		{ id: 'walkN', name: 'Hành lang cloister bắc', shape: { rect: [-11.1, -14.1, 11.1, -11.1] }, y: 0, tag: 'cloister' },
		{ id: 'walkS', name: 'Hành lang cloister nam', shape: { rect: [-11.1, 5.1, 11.1, 8.1] }, y: 0, tag: 'cloister' },
		{ id: 'walkW', name: 'Hành lang cloister tây', shape: { rect: [-11.1, -11.1, -8.1, 5.1] }, y: 0, tag: 'cloister' },
		{ id: 'walkE', name: 'Hành lang cloister đông', shape: { rect: [8.1, -11.1, 11.1, 5.1] }, y: 0, tag: 'cloister' },
		{ id: 'garth', name: 'Sân cỏ giữa cloister (garth, ngoài trời nhưng khô)', shape: { rect: [-8.1, -11.1, 8.1, 5.1] }, y: 0, tag: 'garth' },
		{
			id: 'hill', name: 'Lối lên đồi từ Poppy Reach (mưa)', outdoor: true, tag: 'approach', edge: 'void',
			shape: { poly: [[-24, 20.1], [-11.6, 20.1], [-11.6, 25.1], [-7.6, 25.1], [-7.6, 20.1], [6, 20.1], [13, 31], [14, 46], [9, 63], [-12, 63], [-22, 52], [-27, 36]] },
			y: { base: -2, gz: -0.17, at: [-9.6, 25.1], noise: [0.12, 8] },
			sky: { color: DAY, intensity: 2400, height: 18 },
		},
	],
	walls: [
		// the balustrades of the parlour stair (the parlour floor stands 1.2 m above the treads at its sides)
		{ id: 'parlourStairN', a: [-14.1, -19.8], b: [-11.1, -19.8], height: 0.95, thickness: 0.3, tile: LIME, tone: 1.15, top: 3 },
		{ id: 'parlourStairS', a: [-14.1, -17.2], b: [-11.1, -17.2], height: 0.95, thickness: 0.3, tile: LIME, tone: 1.15, top: 3 },
	],
	openings: [
		{ id: 'gate', at: [-9.6, 8.1], width: 2.0, kind: 'door', height: 3.2 }, // through the gate tower into the cloister's south-west corner
		{ id: 'stepsTop', at: [-9.6, 20.1], width: 3.6, kind: 'gap' },
		{ id: 'stepsFoot', at: [-9.6, 25.1], width: 3.6, kind: 'gap' },
		{ id: 'wardDoor', at: [0, -14.1], width: 2.2, kind: 'door', height: 2.8 },
		{ id: 'parlourDoor', at: [-11.1, -18.5], width: 2.0, kind: 'door', height: 2.6 },
		{ id: 'wardEast', at: [11.1, -19.6], width: 2.0, kind: 'door', height: 2.6 },
		{ id: 'refectoryKitchen', at: [16.0, -9], width: 2.0, kind: 'door', height: 2.6 },
		{ id: 'kitchenWalk', at: [11.1, -4.0], width: 1.8, kind: 'door', height: 2.6 },
		{ id: 'kitchenLinen', at: [16.3, 1.5], width: 1.6, kind: 'door', height: 2.4 },
		{ id: 'kitchenStair', at: [21.5, -4.0], width: 2.2, kind: 'door', height: 2.6 },
		// the high warm window: in the parlour's south wall, over the Mother's garden, facing the valley (sill 0.8 m above the parlour floor; 2.4 m tall: the
		// A19.6 section set into the wall covers it from inside; its warm pane sits on the garden face, so the hill still sees the window)
		{
			id: 'highWindow', at: [-15.0, -14.1], width: 1.3, kind: 'window', sill: PARLOUR_Y + 0.8, height: 2.4, pane: 'outer',
			glow: { color: WINDOW, intensity: 5.5, light: { kind: 'perfection', range: 9, intensity: 26, color: WINDOW } },
		},
		// the ward's tall windows (grey day outside; 2.4 m tall: the A19.6 wall section, 3.29 m, covers the opening from inside), refectory, kitchen and linen room windows
		...GAPS.map((x, i) => ({ id: `wardWindow${i}`, at: [x, -23.3], width: 1.3, kind: 'window', sill: 0.8, height: 2.4, glow: { color: '#a9b3bb', intensity: 0.9 } })),
		...[-20.0, -15.5, -11.0].map((z, i) => ({ id: `refectoryWindow${i}`, at: [21.8, z], width: 1.3, kind: 'window', sill: 0.9, height: 2.6, glow: { color: '#a9b3bb', intensity: 0.9 } })),
		{ id: 'kitchenWindow', at: [21.8, 0.2], width: 1.3, kind: 'window', sill: 1.0, height: 2.2, glow: { color: '#a9b3bb', intensity: 0.9 } },
		...[14.85, 17.75].map((x, i) => ({ id: `linenWindow${i}`, at: [x, 8.4], width: 1.3, kind: 'window', sill: 0.9, height: 2.4, glow: { color: '#a9b3bb', intensity: 0.9 } })),
	],
	stairs: [
		{ id: 'approachSteps', rect: [-11.6, 20.1, -7.6, 25.1], up: 'n', y0: -2, y1: 0, steps: 10 },
		{ id: 'parlourStair', rect: [-14.1, -19.8, -11.1, -17.2], up: 'w', y0: 0, y1: PARLOUR_Y, steps: 6 },
		{ id: 'nightStair', rect: [21.5, -5.5, 27.5, -2.5], up: 'w', y0: -3, y1: 0, steps: 15 },
	],
	structures: [
		// the approach and the forecourt
		{ asset: 'A11.4', at: [-9.6, 10.26], yaw: 0, name: 'the gate tower: the rain stops here' },
		...[[-17.0, 11.1, 90], [-17.0, 17.1, 90], [-2.0, 11.1, -90], [-2.0, 17.1, -90]].map(([x, z, yaw]) => ({ asset: 'A18.5', at: [x, z], yaw, light: 'glow' })), // still niche candles (glow only)
		{ asset: 'N-HS03', at: [-12.3, 19.2] },
		{ asset: 'N-HS03', at: [-6.9, 19.2] },
		{ asset: 'glb:dungeon-prop-flint-boulders', at: [8.2, 37.5], yaw: 20 },
		{ asset: 'glb:dungeon-prop-flint-boulders', at: [-19.5, 43.5], yaw: 130 },
		{ asset: 'glb:dungeon-prop-flint-boulders', at: [-8.5, 56.5], yaw: 250, scale: 0.85 },
		// the cloister
		{ asset: 'N-HS02', at: [0, -3] },
		...[[-5, -8], [5, -8], [-5, 2], [5, 2]].map((at) => ({ asset: 'N-HS03', at })),
		{ asset: 'A11.6', at: [-10.4, 7.4], name: 'the first still light inside the gate' },
		{ asset: 'A11.6', at: [10.4, -13.4] },
		{ asset: 'A11.6', at: [-10.4, -13.4], light: 'glow' },
		{ asset: 'A11.6', at: [10.4, 7.4], light: 'glow' },
		// Mother Hawise's parlour (raised 1.2 m): the high warm window (the A19.6 section set into the shared wall like the ward's: its face 9 cm proud of the
		// parlour face, its back 2 cm inside the garden face behind the outer warm pane), her chair, the tea on its side table (GLB top 0.56 m)
		{ asset: 'A19.6', at: [-15.0, -14.155], yaw: 180, y: PARLOUR_Y, light: 'glow', name: 'the high warm window (inside)' },
		{ asset: 'A19.3', at: [-16.4, -15.3], yaw: 90, name: 'Mother Hawise\'s window chair' },
		{ asset: 'A19.2', at: [-16.25, -14.915], yaw: 90, y: PARLOUR_Y + 0.565, name: 'the poppy tea' },
		{ asset: 'A19.4', at: [-18.45, -20.2], yaw: 90 },
		{ asset: 'A19.1', at: [-18.45, -20.2], y: PARLOUR_Y + 1.9 },
		{ asset: 'A11.6', at: [-18.3, -15.1], light: 'glow' },
		{ asset: 'NPC.Hawise', at: [-15.1, -16.5], yaw: 70, name: 'Mother Hawise offers rest and poppy tea' },
		// the ward: Tamsin behind the screen at Fen's empty bed
		{ asset: 'A19.5', at: [7.0, -19.7], yaw: 90, name: 'the screen across the aisle by the empty bed of Fen' }, // the GLB is 0.96 m deep: clear of the bed foot
		{ asset: 'NPC.Tamsin', at: [8.0, -19.7], yaw: -90, name: 'Tamsin, hidden from the door side' },
		{ asset: 'NPC.Sister', at: [-6.0, -18.2], yaw: 90, name: 'sister on the ward round' },
		// the refectory, the kitchen, the linen room
		// the A11.3 GLB at scale 0.68 (top 0.82 m) brings its own bread and jug of flowers
		{ asset: 'A11.3', at: [13.6, -13.4], yaw: 90, scale: 0.68 },
		{ asset: 'A11.3', at: [18.8, -13.4], yaw: 90, scale: 0.68 },
		{ asset: 'A11.3', at: [16.2, -21.4], yaw: 0, scale: 0.68, name: 'the high table' },
		...[[13.6, -17.0], [18.8, -17.0], [13.6, -9.9], [18.8, -9.9]].map((at, i) => ({ asset: 'A11.6', at, light: i === 0 || i === 3 ? undefined : 'glow' })),
		{ asset: 'A11.5', at: [19.5, -7.72], yaw: 0 }, // the GLB's back (local z −0.98) on the north wall's face (z −8.7)
		// the A24.1 GLB brings its own bowls, loaves and folded cloth: the poppy tea stands on the cloth (top 0.90 m), no vase
		{ asset: 'N-HS06', at: [15.0, -3.6], yaw: 0 },
		{ asset: 'A19.2', at: [15.72, -3.7], y: 0.9 },
		{ asset: 'N-HS07', at: [11.66, -6.8], yaw: 90 }, // the A24.2 back (local z −0.254) on the kitchen's west face (x 11.4: a shared wall)
		{ asset: 'N-HS07', at: [11.66, -0.5], yaw: 90 },
		{ asset: 'A11.6', at: [13.0, -8.0] },
		{ asset: 'A11.6', at: [20.6, -1.9], name: 'the last still light before the night stair' },
		{ asset: 'NPC.Sister', at: [14.0, -6.3], yaw: 200, name: 'sister in the kitchen' },
		...[13.4, 16.3, 19.2].map((x) => ({ asset: 'A19.4', at: [x, 7.6], yaw: 180 })), // backs to the south wall (8.1)
		{ asset: 'N-HS08', at: [16.3, 4.6], yaw: 0 },
		{ asset: 'A19.5', at: [20.4, 4.0], yaw: -90 },
		{ asset: 'A11.6', at: [12.0, 2.4], light: 'glow' },
		// the Mother's garden (walled, seen from the high window)
		...[[-16.8, -10.0], [-13.3, -10.0], [-16.8, -4.6], [-13.3, -4.6]].map((at) => ({ asset: 'N-HS04', at, yaw: 90 })),
		{ asset: 'N-HS05', at: [-15.0, 2.4], yaw: 90 },
		// the porter sister and the cloister sister
		{ asset: 'NPC.Sister', at: [-8.0, 6.8], yaw: 180, name: 'the porter: leads you kindly back to the gate' },
		{ asset: 'NPC.Sister', at: [9.6, -8.0], yaw: 180, name: 'sister on the cloister round' },
		// exterior roofs (only while the focus is outdoors)
		{ asset: 'N-HS10', at: [-4.1, -18.7], yaw: 90, y: 5.2 },
		{ asset: 'N-HS11', at: [16.3, -7.45], yaw: 0, y: 4.8 },
		{ asset: 'N-HS13', at: [27.6, -4.0], yaw: 90, y: 1.4 },
	],
	rows: [
		// the cloister arcades (the bays' fronts on the garth's edges)
		{ asset: 'A11.1', from: [-5.4, -12.18], to: [5.4, -12.18], count: 3, yaw: 0 },
		{ asset: 'A11.1', from: [-5.4, 6.18], to: [5.4, 6.18], count: 3, yaw: 180 },
		{ asset: 'A11.1', from: [-9.18, -8.4], to: [-9.18, 2.4], count: 3, yaw: 90 },
		{ asset: 'A11.1', from: [9.18, -8.4], to: [9.18, 2.4], count: 3, yaw: -90 },
		// the ward: two rows of beds and their sleepers (Fen's bed empty), identical candle stands, a steady candle and flowers on every window sill
		{ asset: 'A11.2', from: [WARD_X[0], BED_N], to: [WARD_X[7], BED_N], count: 8, yaw: 0 },
		{ asset: 'A11.2', from: [WARD_X[0], BED_S], to: [WARD_X[7], BED_S], count: 8, yaw: 180, except: DOOR_GAP },
		{ asset: 'NPC.Sleeper', from: [WARD_X[0], BED_N], to: [WARD_X[7], BED_N], count: 8, yaw: 0, y: 0.7, except: FEN },
		{ asset: 'NPC.Sleeper', from: [WARD_X[0], BED_S], to: [WARD_X[7], BED_S], count: 8, yaw: 180, y: 0.7, except: DOOR_GAP },
		{ asset: 'A11.6', from: [GAPS[0], -14.85], to: [GAPS[6], -14.85], count: 7, except: [[-1, -15.5, 1, -14]], realEvery: 2 },
		// the A19.6 sections sit in the wall (face 5 cm proud of the inner face, so the bed heads stay clear); the vase on each GLB sill (top 0.88 m)
		{ asset: 'A19.6', from: [GAPS[0], -23.285], to: [GAPS[6], -23.285], count: 7, yaw: 0, y: 0, light: 'glow' },
		{ asset: 'A19.1', from: [GAPS[0] + 0.25, -23.115], to: [GAPS[6] + 0.25, -23.115], count: 7, y: 0.88 },
		// (the cloister walks' exterior roofs N-HS12 are gone: the A11.1 GLB has its own roof)
	],
	scatters: [{ asset: 'A08.1', rect: [-24, 40, 12, 62], count: 9, gap: 5, keep: 1.5, scale: [0.8, 1.1], seed: 1106 }],
	lights: [
		// grey daylight over the open garth (still; the one shadowed light: the arches' soft shadows into the walks)
		{ id: 'garthDay', name: 'daylight over the garth (grey, still)', kind: 'perfection', spot: true, at: [0, 18, -3], target: [0, 0, -3], angle: 0.66, penumbra: 0.8, color: DAY, range: 34, intensity: 700, shadow: true },
		// the high window seen from outside: a big still halo (VFX layer: it reads through the rain and the fog)
		{ id: 'highWindowHalo', name: 'the high warm window (outside halo)', kind: 'perfection', at: [-15.0, 3.6, -13.5], real: false, color: WINDOW, glow: 4.2, glowGain: 1.25, fadeWithWall: true },
	],
	rain: { dry: [[-40, -40, 44, 8.1], [-11.76, 8.1, -7.44, 12.42]], count: 1800, box: [44, 16, 44], color: '#9eabb6' }, // the rain stops at the gate
	markers: [
		{ kind: 'landmark', at: [-15.0, -13.2], label: 'Cửa sổ cao ấm của Mẹ Hawise', note: 'ánh sáng sáng nhất, đứng yên nhất của act (khớp N-GH ở map 1–3)' },
		{ kind: 'landmark', at: [-9.6, 12.9], label: 'Tháp cổng A11.4 · mưa dừng ở đây', note: 'ngoài: mưa xám · trong: khô, ấm, đứng yên (đề xuất LD)' },
		{ kind: 'sightline', at: [-3.5, 44.5], to: [-15.0, -14.1], label: 'Lối lên đồi → cửa sổ ấm', note: 'cửa sổ cao nhìn ra thung lũng, thấy từ khi còn dưới mưa' },
		{ kind: 'vignette', at: [-15.8, -16.1], r: 1.4, remember: true, label: 'REMEMBER: chén trà anh túc trong ánh cửa sổ ấm', note: 'một người phụ nữ hiền bảo bạn có thể nghỉ rồi' },
		{ kind: 'note', at: [-15.4, -17.4], r: 1.0, label: 'Vision trigger · uống trà', note: 'tu viện bên biển, đèn cửa sổ cao, giọng nói "Come home."' },
		{ kind: 'vignette', at: [9.5, -21.8], unmarked: true, label: 'Giường trống của Fen (không đánh dấu)', note: 'gối sạch, chăn gấp: người ngủ đã được đưa xuống dưới' },
		{ kind: 'vignette', at: [16.2, -16.6], label: 'Bánh mì lúc nào cũng mới · hoa trong bình', note: 'bếp không bao giờ đỏ lửa' },
		{ kind: 'note', at: [0, 0.4], label: 'Vôi mới, không một chỗ vá', note: 'đó chính là lời cảnh báo (AD §10.2)' },
		{ kind: 'note', at: [-7.8, 3.6], label: 'Bị các sơ thấy = được dẫn ra cổng', note: 'không chiến đấu: chỉ đi bộ, UI chiến đấu ẩn' },
		{ kind: 'npc', at: [-15.1, -16.5], label: 'Mẹ Hawise', note: 'mời nghỉ và trà anh túc bên cửa sổ ấm' },
		{ kind: 'npc', at: [8.0, -19.7], label: 'Tamsin', note: 'trốn sau bình phong ở giường trống của Fen' },
		{ kind: 'npc', at: [-1.36, -21.8], label: 'Người ngủ mỉm cười ×13', note: 'vải lanh sạch: màu trắng sạch duy nhất được phép' },
		{ kind: 'npc', at: [-8.0, 6.8], label: 'Sơ gác cổng', note: 'dẫn bạn ra cổng, nhẹ nhàng' },
		{ kind: 'npc', at: [9.6, -8.0], label: 'Sơ Anh Túc (cloister)' },
		{ kind: 'npc', at: [-6.0, -18.2], label: 'Sơ Anh Túc (phòng bệnh)' },
		{ kind: 'npc', at: [14.0, -6.3], label: 'Sơ Anh Túc (nhà ăn · bếp)' },
		{ kind: 'patrol', at: PATROL_CLOISTER[0], points: PATROL_CLOISTER, loop: true, cone: { range: 7, angle: 70 }, label: 'Tuần tra · cloister', note: 'nón = tầm nhìn của sơ' },
		{ kind: 'patrol', at: PATROL_WARD[0], points: PATROL_WARD, cone: { range: 8, angle: 60 }, label: 'Tuần tra · phòng bệnh', note: 'đi lại dọc lối giữa hai hàng giường' },
		{ kind: 'patrol', at: PATROL_KITCHEN[0], points: PATROL_KITCHEN, cone: { range: 6, angle: 70 }, label: 'Tuần tra · nhà ăn → bếp → cloister' },
		{ kind: 'patrol', at: [-8.0, 6.8], points: [[-8.0, 6.8]], yaw: 180, cone: { range: 6, angle: 80 }, label: 'Sơ gác cổng (đứng yên)' },
		{ kind: 'escort', at: ESCORT[0], points: ESCORT, label: 'Đưa Tamsin ra cổng trước khi các sơ để ý', note: 'phòng bệnh → hành lang bắc → hành lang tây → cổng' },
		{ kind: 'exit', at: [32.6, -4.0], yaw: -90, label: '↓ Garden of Hush (map 5)', note: 'cầu thang đêm chìm vào bóng tối' },
		{ kind: 'exit', at: [-1.5, 61.5], yaw: 180, label: '↓ Poppy Reach (map 3)', note: 'lối vào: leo đồi từ đồng anh túc' },
	],
	camps: [], // no combat in the Gentle House (LD 11.9: walking only, combat UI hidden)
	segments: [
		{ id: 'hill', name: 'Lối lên đồi dưới mưa (từ Poppy Reach)', spawn: [-8, 38], yaw: 0, view: 'approach' },
		{ id: 'gate', name: 'Sân trước cổng · mưa dừng ở cổng', spawn: [-9.6, 15.5], yaw: 0, view: 'gate' },
		{ id: 'cloister', name: 'Cloister · hành lang tây', spawn: [-9.6, -1], yaw: 0, view: 'cloister' },
		{ id: 'ward', name: 'Phòng bệnh dài', spawn: [-3, -18.7], yaw: 90, view: 'ward' },
		{ id: 'parlour', name: 'Phòng Mẹ Hawise · cửa sổ ấm', spawn: [-16.6, -20.3], yaw: 180, view: 'hawise' },
		{ id: 'refectory', name: 'Nhà ăn → bếp', spawn: [16.2, -18.2], yaw: 180, view: 'refectory' },
		{ id: 'stair', name: 'Chân cầu thang đêm (xuống Garden of Hush)', spawn: [30.5, -4.0], yaw: 90, view: 'stair' },
	],
	route: [
		[-1.5, 61], [4.5, 53], [-3.5, 44.5], [-9.6, 33], [-9.6, 26.5], [-9.6, 20.5], [-9.6, 14], [-9.6, 8.1], [-9.6, 6.6], [-9.6, -12.6], [0, -12.6], [0, -15.5], [0, -18.6],
		[-9.4, -18.6], [-11.1, -18.5], [-14.6, -18.5], [-15.6, -17.4], [-14.6, -18.5], [-11.1, -18.5], [-9.4, -18.6], [5.5, -17.75], [8.4, -17.75], [9.9, -18.6], [11.1, -19.6],
		[16.2, -19.6], [16.2, -10.5],
		[16.0, -9.0], [16.0, -7.2], [20.4, -4.0], [21.5, -4.0], [27.5, -4.0], [31.2, -4.0],
	],
	views: {
		overview: { label: 'Toàn cảnh (đồi → cổng → cloister → phòng bệnh → bếp → cầu thang)', target: [3, 0, 7.6], w: 62, d: 100 }, // target inside: no roofs
		compound: { label: 'Khu nhà từ trên cao (bắc lên trên)', target: [1, 0, -6.5], w: 46, d: 36 },
		exterior: { label: 'Ngoại thất: tháp cổng, dãy nhà bệnh, cửa sổ cao (mái hiện)', target: [-8, 2, 16], dist: 48, pitch: 30, yaw: 12 },
		approach: { label: 'Lối lên đồi dưới mưa · cửa sổ ấm trên đỉnh', target: [-9, 0, 27], dist: 26, pitch: 26, yaw: 6 },
		gate: { label: 'Tháp cổng · mưa dừng ở cổng', target: [-9.6, 0.8, 13.5], dist: 15, pitch: 30, yaw: 18 },
		cloister: { label: 'Cloister quanh sân cỏ (garth)', target: [0, 0, -2], dist: 24, pitch: 42, yaw: 0 },
		ward: { label: 'Phòng bệnh dài · hàng giường, người ngủ mỉm cười', target: [-1, 0.6, -18.6], dist: 20, pitch: 36, yaw: 90 },
		hawise: { label: 'Cửa sổ ấm của Mẹ Hawise · trà anh túc (vision)', target: [-15.6, 2.0, -15.4], dist: 9.5, pitch: 30, yaw: 200 },
		tamsin: { label: 'Tamsin sau bình phong, giường trống của Fen', target: [8.2, 0.7, -20.2], dist: 11, pitch: 40, yaw: 150 },
		patrols: { label: 'Tuần tra các sơ + tầm nhìn (bật overlay)', target: [3, 0, -6], w: 44, d: 34 },
		refectory: { label: 'Nhà ăn · bánh mì · hoa', target: [16.2, 0.7, -15.5], dist: 15, pitch: 40, yaw: -24 },
		kitchen: { label: 'Bếp · lò sưởi & nồi (không lửa)', target: [17.6, 1.0, -5.5], dist: 13, pitch: 36, yaw: 8 },
		stair: { label: 'Cầu thang đêm xuống Garden of Hush', target: [26.5, -1.6, -4], dist: 15, pitch: 58, yaw: 25 },
		window: { label: 'Cửa sổ cao ấm nhìn từ lối lên đồi', target: [-14, 3.2, -4], dist: 44, pitch: 16, yaw: 8 },
	},
	// Play moods brightened 10-23 (hemi, envI, exposure, warm floorTone; round 2: warm + rain grade saturation); the old values are in tmp/act1-base-maps/BRIGHTNESS.md.
	moods: {
		warm: {
			label: 'Gentle House · trong nhà ấm (mặc định)', hemi: 3.3, sky: '#7a6d5f', ground: '#1d1813', env: 'hdri-overcast', envI: 0.1, toneMapping: 'aces', exposure: 0.95, lights: 1, floorTone: 0.86,
			background: '#141715', rain: 1,
			fog: { enabled: true, color: '#2a2e2b', density: 0.004, falloff: 0.1, height: 0, start: 40, inscatter: 0 },
			grade: { vignette: 0.32, contrast: 1.04, saturation: 1.03, lift: 0.01, temperature: 0.06, tint: 0 },
			lantern: { radius: 5, strength: 0.18, dim: 0.1, color: [0.56, 0.5, 0.44] },
		},
		rain: {
			label: 'Ngoài cổng · mưa xám ban ngày', hemi: 3.6, sky: '#a9b1a6', ground: '#4a3526', env: 'hdri-overcast', envI: 0.32, toneMapping: 'aces', exposure: 0.78, lights: 0.6, floorTone: 0.78,
			background: '#2a302c', rain: 1.2,
			fog: { enabled: true, color: '#7f877e', density: 0.008, falloff: 0.1, height: 0, start: 28, inscatter: 0 },
			grade: { vignette: 0.24, contrast: 1.02, saturation: 0.9, lift: 0, temperature: -0.02, tint: 0 },
			lantern: { radius: 5, strength: 0.1, dim: 0.05, color: [0.5, 0.52, 0.54] },
		},
		lookdev: {
			label: 'Soi texture · sáng đều', hemi: 2.4, sky: '#c9d4e4', ground: '#3b352e', env: 'hdri-overcast', envI: 0.25, toneMapping: 'aces', exposure: 0.2, lights: 0.35, floorTone: 1, rain: 0,
			fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 }, lantern: { radius: 5, strength: 0, dim: 0, color: [0.5, 0.5, 0.5] },
		},
	},
	atmosphere: { motes: { count: 900, box: [30, 4.5, 30] } },
	note: '<b>Lối lên đồi</b> từ Poppy Reach: đường đá lửa ướt dưới mưa, khóm anh túc cuối cùng, bậc thềm vôi trắng (A18.6) lên <b>sân trước cổng</b> có tường hốc nến đứng yên (A18.5). <b>Tháp cổng</b> (A11.4): mưa dừng ở cổng — bên trong khô, ấm, đứng yên. <b>Cloister</b> vuông 12 vòm (A11.1) quanh sân cỏ (garth). <b>Phòng bệnh dài</b>: 14 giường (A11.2), 13 người ngủ mỉm cười trong vải lanh sạch, giường trống của Fen, Tamsin trốn sau bình phong (A19.5), cửa sổ cao mỗi bậu một ngọn nến đứng yên (A19.6), chân nến giống hệt nhau không bao giờ lập lòe (A11.6). Bảy bậc lên <b>phòng Mẹ Hawise</b>: <b>cửa sổ cao ấm</b> nhìn ra thung lũng (ánh sáng sáng nhất, đứng yên nhất của act), ghế cửa sổ (A19.3), trà anh túc (A19.2, vision). <b>Nhà ăn</b> (A11.3, bánh mì, hoa), <b>bếp</b> (lò A11.5 sạch, không lửa), phòng vải lanh, <b>cầu thang đêm</b> xuống Garden of Hush. Không chiến đấu; overlay <i>Tuần tra</i>: lối đi + nón tầm nhìn của các sơ, lối đưa Tamsin ra cổng. Mái nhà chỉ hiện khi tâm camera ở ngoài trời.',
};

// ---- the SPEC §6b contract -------------------------------------------------------------------------------------------------------------------------
export const ASSETS = assetList(KIT, PLAN);

export const MONSTERS = []; // no combat in the Gentle House (LD 11.9: walking only; being seen = led kindly to the gate)

export const NPCS = [
	{ name: 'Mother Hawise', segment: 'parlour', note: 'offers rest and poppy tea by the high warm window (the vision trigger); later the Hospice Mother (B05, map 6); blockout stand-in, no model' },
	{ name: 'Poppy Sisters ×4', segment: 'cloister · ward · kitchen · gate', note: 'white wimples embroidered with poppy red; three on patrol routes with sight cones (overlay), one porter at the gate; being seen = led kindly to the gate' },
	{ name: 'Tamsin', segment: 'ward', note: 'hides behind a linen screen at Fen\'s empty bed; must be got out before the sisters notice (escort path overlay); 16, thin, oiled wool hood, short bow' },
	{ name: 'Smiling sleepers ×13', segment: 'ward', note: 'on the ward beds under clean linen (the one allowed clean white); every face different in the final (now one blockout); Fen\'s bed is empty' },
];

export const TEXTURES = [
	{ id: 'BIO05_lime', have: 'partial', note: 'used for the whitewash walls (tone 1.15) and the limed floor flags, but its blotchy cells read as patches on the walls (the house must have not one patch): a seamless new-whitewash tile is still needed' },
	{ id: 'BIO24_keystone', have: true, note: 'dressed stone flags: cloister walks, forecourt, steps, kitchen, linen room, the garth\'s paths' },
	{ id: 'DW_grass', have: true, note: 'garth lawn, the Mother\'s garden, the hillside' },
	{ id: 'BIO02_meadow', have: true, note: 'the poppy meadow at the foot of the hill (the Reach)' },
	{ id: 'BIO03_flint', have: true, note: 'the flint path up the hill' },
	{ id: 'BIO08_nave', have: true, note: 'the old flags of the night stair (the crypts below)' },
	{ id: 'new whitewash wall tile (seamless, not one patch)', have: false, note: 'BIO05_lime shows soft cloud patches; the Gentle House needs a too-clean, seamless whitewash + a plain lime skirting' },
	{ id: 'scrubbed pale floorboards (ward, parlour)', have: false, note: 'pale scrubbed wood, very clean (now limed flags)' },
	{ id: 'linen with the poppy-red embroidered band', have: false, note: 'sheets, wimples, screens, curtains (Mercy\'s linen)' },
	{ id: 'slate roof + terracotta eave tiles', have: false, note: 'the exterior roofs (A18.4 slate, A11.1 / A11.4 tiles)' },
	{ id: 'wet chalk-and-flint hill path', have: false, note: 'rain-darkened path with chalk mud between the flints (now BIO03_flint + the wet channel)' },
	{ id: 'clipped garth lawn', have: false, note: 'too even, too green (now the Dark Wood grass)' },
];

export const VFX = [
	{ id: 'the rain stops at the gate', have: 'placeholder', note: 'rain streaks round the focus outside the dry rects (compound + gate tower) + wet ground outside; real: a visible curtain edge at the gate, dripping eaves outside only' },
	{ id: 'still candle light (never flickers)', have: 'placeholder', note: 'still halos + floor pools, identical candles in rows (Perfection light); real: a round, even glow, no smoke' },
	{ id: 'the high warm window (brightest still light of the act)', have: 'placeholder', note: 'an emitting pane + a big still halo outside + a warm light inside; must match N-GH far away' },
	{ id: 'dust motes in the warm light', have: 'placeholder', note: 'GPU atmosphere motes, lit by the nearest lights' },
	{ id: 'grey daylight in the garth', have: 'placeholder', note: 'one soft spot from above (the shadowed light)' },
	{ id: 'poppy tea vision (seaside monastery, high window, "Come home.")', have: false, note: 'the vision when the tea is drunk' },
	{ id: 'being seen: led kindly to the gate', have: false, note: 'a soft fade and the sister walking you out (now a marker)' },
	{ id: 'sleepers breathing in unison', have: false, note: 'the linen rising and falling, perfectly in sync' },
	{ id: 'steam from the tea and the fresh bread', have: false, note: 'small, still, too perfect' },
	{ id: 'a lullaby drifting from the house', have: false, note: 'audio (the act image)' },
];

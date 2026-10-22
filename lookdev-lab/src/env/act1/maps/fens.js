// ASHLAR · Act I · base map 2 `fens`: The Night Fens (LD 11.4, quest *The Count of the Sleepers*) → Rook's Weir (LD 11.5), BIO-01 (spec tmp/act1-base-maps/SPEC.md §3 map 2).
// One terrain, 256 × 192 m, almost all of it black fen water: the only ground is earth dikes, a few peat islands, a stepping-stone ford and, in Rook's Weir, plank
// bridges, rafts and the ridges of drowned roofs — open water is never walkable (every shore drops off steeply; the bed lies 1.45 m down). The Night Fens run east
// → west: the dike road from Lychgate (east edge), the lichen stone island (rite 1), the act's arch (A17.1, two standing stones leaning together over the dike),
// the crossing island where the drowned road comes ashore and the Soothed (P01, white nightgowns) wade on across the Procession Mere toward the far warm window of
// the Gentle House (N-GH, the act image), the broken bridge and its ford, the field of unlit lure posts where corpse-candles (W05) hang still, the side dike to the
// Willow Mere (11.7), and the Lullaby Man's island (B02, mid-boss). After him, the quiet beat: the weir, then Rook's Weir in the north-west — half-drowned flint
// cottages, gable walls with door arches (the plank lane passes through one), sunken roof ridges walked on planks, pontoon rafts, rook roost poles, the drowned bell
// tower, the supper table under the water, the lace window, the Gentle House night dock with the linen-canopied boat and its still white lamp, the dead ferryman
// (*The Ferryman's Toll*), and the causeway north to the Poppy Reach (11.6). No quest marker: the route is followed by ear → "lullaby source" markers (kind 'sound').
// Light grammar: no human light anywhere in the fens — the only warm point is the far window; corpse-candles and the dock / boat lamp are still, even and beautiful
// (lures and Mercy). Plain data + the §6b exports. Format: env/act1/outdoor.js (header). Sizes: concept sheets (H = 1.8 m) — A03 / A04 / A06 / A07
// (ashlar/art/act-01-environments) and A17 (act-01-environments-v2, tmp/act1-base-maps/MISSING_ENV_CONCEPTS.md); `N-FN…` = LD only. Blockout massing uses the
// data-driven `parts` shape of env/act1/blockout.js ([primitive, …args] in the def's local frame, metres).
import { withCounts } from '../outdoor.js';
import { GENTLE_HOUSE_FAR } from '../gentleHouseFar.js';

const LV = 0; // the one water level (the weir is broken: the drowned village and the fen stand at the same level)
const BED = -1.45; // the black water's bed (deep everywhere but the shoals)
const DIKE = 0.5; // dike crests
const ISLE = 0.45; // island tops
const FORD = -0.06; // the ford causeway (ankle-deep; dike → ford is a 0.56 m step, under Play's 0.6 m)
const ROAD = -0.75; // the drowned road under the Procession Mere: waist-deep, the Soothed wade it, the hero cannot step down to it
const PLANK = 0.62; // plank bridges (A01.2) and the dock
const RAFT = 0.5; // pontoon raft decks
const RIDGE = 1.05; // the plank walk on a sunken roof ridge
const GH = { x: -260, z: -340 }; // the Gentle House on its far hill (NNW, ≈ 430 m): beyond Rook's Weir, where the Poppy Reach climbs
const GH_WINDOW_Y = 43.5; // its high window: hill 34 m + 9.5 m
/** An eye-level view toward the far window: the orbit rig keeps ≤ 400 m to its target, so it looks at a point 40 % of the way along the same line of sight. */
const towardWindow = (label, [x, z], eyeY) => ({ label, eye: [x, eyeY, z], look: [x + (GH.x - x) * 0.4, eyeY + (GH_WINDOW_Y - eyeY) * 0.4, z + (GH.z - z) * 0.4], fov: 32 });

// ---- small pure helpers -------------------------------------------------------------------------------------------------------------------------
const DEG = Math.PI / 180;
/** Yaw (deg) whose front (local +z) faces (dx, dz). */
const face = (dx, dz) => Math.atan2(dx, dz) / DEG;
/** Yaw (deg) that lays local +x along (dx, dz). */
const along = (dx, dz) => Math.atan2(-dz, dx) / DEG;
/** World point of a local offset [lx, ly, lz] of a placement { x, z, yaw (deg), y }. */
const local = (p, [lx, ly, lz]) => {
	const c = Math.cos(p.yaw * DEG);
	const s = Math.sin(p.yaw * DEG);
	return [p.x + lx * c + lz * s, (p.y ?? 0) + ly, p.z - lx * s + lz * c];
};
/** Point at arc length s of a polyline: [x, z, dirX, dirZ]. */
const at = (pts, s) => {
	for (let i = 1; i < pts.length; i++) {
		const [ax, az] = pts[i - 1];
		const [bx, bz] = pts[i];
		const len = Math.hypot(bx - ax, bz - az);
		if (s <= len || i === pts.length - 1) {
			const t = Math.min(1, Math.max(0, s / len));
			return [ax + (bx - ax) * t, az + (bz - az) * t, (bx - ax) / len, (bz - az) / len];
		}
		s -= len;
	}
	return [pts[0][0], pts[0][1], 1, 0];
};
/** A polyline shifted sideways by `d` metres along (−dirZ, dirX): + = to the right of travel (heading north, + is east; heading west, + is north). */
const shift = (pts, d) => pts.map((p, i) => {
	const a = pts[Math.max(0, i - 1)];
	const b = pts[Math.min(pts.length - 1, i + 1)];
	const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
	return [p[0] - ((b[1] - a[1]) / len) * d, p[1] + ((b[0] - a[0]) / len) * d];
});

// ---- blockout primitives (env/act1/blockout.js `parts`: Parts.box | cyl | cone | blob | mound | gable | anchor, o = { x, y, z, rx, ry, rz, tone, color }) -------
const B = (w, h, d, o = {}) => ['box', w, h, d, o];
const C = (rt, rb, h, o = {}, seg = 8) => ['cyl', rt, rb, h, o, seg];
const K = (r, h, o = {}, seg = 8) => ['cone', r, h, o, seg];
const O = (rx, ry, rz, o = {}, seg = 9) => ['blob', rx, ry, rz, o, seg];
const M = (rx, ry, rz, o = {}, seg = 12) => ['mound', rx, ry, rz, o, seg];
const G = (w, h, d, o = {}) => ['gable', w, h, d, o];
const AN = (kind, p, n = [0, 0, 1], size = 0.4, extra = {}) => ['anchor', kind, p, n, size, extra];
const parts = (...list) => ({ kind: 'parts', parts: list });
// muted part colours (the category colour stays the base; these are the few materials a blockout must read as)
const ROCK = '#7b8088';
const LICHEN = '#7a8559';
const PEAT = '#4a3526';
const TIMBER = '#6e6255';
const THATCH = '#6a5a40';
const BRICK = '#6c5244';
const BARK = '#4f4236';
const NEST = '#35302a';
const LINEN = '#e4e0d6'; // Mercy's linen: the one allowed clean white (the boat canopy, the dock's strip, the Soothed's nightgowns)
const LACE = '#c9c2b0'; // human lace: pale, never clean white
const LAMP = '#efeee6'; // the still white lamp's glass
const BRASS = '#86784f';

const SHAPES = {
	stone: parts( // A06.2 lichen standing stone (0.9 × 2.6 × 0.7)
		B(0.82, 1.75, 0.62, { y: -0.3 }), B(0.72, 0.95, 0.56, { y: 1.42, x: -0.04, rz: 0.07, tone: 1.06 }), B(0.86, 0.1, 0.66, { y: 1.18, tone: 0.55 }),
		O(0.34, 0.2, 0.3, { x: 0.36, z: 0.24, y: 0.04, tone: 0.9 }), O(0.26, 0.16, 0.24, { x: -0.36, z: -0.22, y: 0.03, tone: 0.95 }),
		B(0.42, 0.55, 0.04, { x: 0.12, y: 0.55, z: 0.31, color: LICHEN }), B(0.04, 0.42, 0.3, { x: -0.41, y: 1.65, z: 0.05, color: LICHEN }), B(0.3, 0.35, 0.04, { x: -0.1, y: 1.5, z: -0.3, color: LICHEN }),
	),
	arch: parts( // A17.1 the leaning stones: two slabs, vertical to 2.2 m (a 2.44 m passage for the 1 m Play grid; concept 1.6 m) then leaning in until the tops touch at 4.6 m
		B(1.0, 2.6, 1.3, { x: -1.72, y: -0.4 }), B(1.0, 2.6, 1.3, { x: 1.72, y: -0.4, tone: 0.96 }),
		B(0.88, 2.8, 1.18, { x: -1.6, y: 2.0, rz: -0.56, tone: 1.03 }), B(0.88, 2.8, 1.18, { x: 1.6, y: 2.0, rz: 0.56, tone: 0.98 }), O(0.5, 0.32, 0.6, { y: 4.3, tone: 1.05 }),
		B(0.5, 0.7, 0.04, { x: -1.75, y: 0.7, z: 0.66, color: LICHEN }), B(0.6, 0.5, 0.04, { x: 1.65, y: 1.3, z: 0.66, color: LICHEN }), B(0.04, 0.6, 0.5, { x: 2.23, y: 0.9, color: LICHEN }),
		B(0.5, 0.6, 0.04, { x: -1.15, y: 3.0, z: 0.6, rz: -0.56, color: LICHEN }), B(0.04, 0.5, 0.45, { x: -2.23, y: 1.2, z: -0.2, color: LICHEN }),
	),
	ford: parts( // A06.3 stepping-stone ford (2.4 × 0.5 × 7): six flat stones along local z and one plank
		...[[-3.0, 0.25, 0.48], [-1.8, -0.3, 0.44], [-0.6, 0.3, 0.5], [0.6, -0.25, 0.46], [1.8, 0.3, 0.48], [3.0, -0.2, 0.45]].map(([z, x, r], i) => C(r * 0.88, r, 0.46, { x, z, y: -0.06, tone: 0.92 + (i % 3) * 0.06 }, 9)),
		B(0.32, 0.07, 1.25, { x: 0.02, z: 1.2, y: 0.36, ry: 0.3, color: TIMBER }), B(0.5, 0.03, 0.4, { x: 0.3, z: -0.6, y: 0.41, color: LICHEN }),
	),
	lure: parts( // A06.4 unlit bog-lure post (1.3 × 2.9 × 0.9): stone base, post, arm, chain, an empty cage (never lit: the lure is the corpse-candle)
		B(0.9, 0.55, 0.9, { color: ROCK }), B(0.28, 2.8, 0.28, { y: 0.1, tone: 0.95 }), B(0.82, 0.1, 0.1, { x: 0.38, y: 2.6, tone: 0.9 }), B(0.07, 0.6, 0.07, { x: 0.2, y: 2.05, rz: -0.75, tone: 0.9 }),
		B(0.03, 0.32, 0.03, { x: 0.74, y: 2.28, tone: 0.4 }), B(0.3, 0.44, 0.3, { x: 0.74, y: 1.84, tone: 0.42 }), B(0.36, 0.05, 0.36, { x: 0.74, y: 2.27, tone: 0.42 }), B(0.3, 0.5, 0.3, { y: 0.55, color: LICHEN, tone: 0.9 }),
	),
	punt: parts( // A06.5 half-sunk punt (3.4 × 0.7 × 1.2); placed at the water level − 0.3
		B(2.7, 0.42, 1.1, { tone: 0.85 }), B(0.55, 0.4, 1.0, { x: 1.48, y: 0.08, rz: 0.5, tone: 0.8 }), B(0.42, 0.38, 1.05, { x: -1.42, y: 0.04, rz: -0.35, tone: 0.8 }),
		B(2.5, 0.05, 0.9, { y: 0.24, tone: 0.32 }), B(0.12, 0.06, 1.0, { x: 0.1, y: 0.4, tone: 1.0 }), B(3.6, 0.05, 0.05, { x: -0.2, y: 0.46, z: 0.45, ry: 0.12, tone: 1.15 }),
	),
	pier: parts( // A06.6 broken bridge pier (3.8 × 5.0 × 2.2), base on the bed: the pier and the broken springing of its arch
		B(2.0, 5.0, 2.1, { x: 0.8, color: ROCK }), B(1.8, 1.0, 2.0, { x: -0.95, y: 3.9, color: ROCK, tone: 0.95 }), B(1.2, 0.9, 2.0, { x: -0.35, y: 3.15, rz: 0.55, color: ROCK, tone: 0.9 }),
		B(2.1, 0.22, 2.2, { x: 0.8, y: 5.0, color: LICHEN, tone: 0.85 }), B(0.9, 0.5, 2.0, { x: -1.5, y: 4.9, rz: -0.3, color: ROCK, tone: 1.08 }), B(0.6, 0.9, 0.05, { x: 0.6, y: 2.0, z: 1.06, color: LICHEN }),
	),
	tower: parts( // A17.2 drowned bell tower (4.2 × 12.3 × 4.2), base on the bed: the top two storeys stand ≈ 10.8 m above the water
		B(4.0, 7.3, 4.0), B(4.25, 0.3, 4.25, { y: 7.3, tone: 1.12 }), B(3.8, 2.3, 3.8, { y: 7.6, tone: 1.05 }),
		B(1.0, 1.45, 3.9, { y: 8.0, tone: 0.28 }), B(3.9, 1.45, 1.0, { y: 8.0, tone: 0.28 }), K(0.4, 0.6, { y: 8.25, tone: 0.55 }, 10),
		B(4.1, 0.25, 4.1, { y: 9.9, tone: 1.1 }), K(3.2, 2.2, { y: 10.1, ry: Math.PI / 4, tone: 0.6 }, 4), O(0.75, 0.3, 0.6, { x: 1.35, y: 10.55, z: 0.55, color: NEST }),
		B(0.5, 0.45, 0.05, { x: -0.7, y: 10.75, z: 1.2, rx: -0.6, tone: 0.95 }), B(1.2, 4.5, 0.05, { x: -1.2, y: 0.2, z: 2.01, tone: 0.9 }), B(0.05, 3.5, 1.0, { x: 2.01, y: 2.5, z: -0.8, tone: 1.12 }),
	),
	boat: parts( // A17.3 the Gentle House boat (7 × 2.7 × 1.6): dark punt, a canopy of clean white linen, one still white lamp on a bow pole
		B(5.6, 0.5, 1.5, { tone: 0.62 }), B(1.0, 0.45, 1.3, { x: 3.1, y: 0.12, rz: 0.32, tone: 0.6 }), B(0.8, 0.45, 1.35, { x: -2.95, y: 0.1, rz: -0.25, tone: 0.6 }),
		B(5.4, 0.06, 1.3, { y: 0.44, tone: 0.75 }), M(1.75, 1.15, 0.76, { x: -0.25, y: 0.48, color: LINEN }), B(0.55, 0.18, 0.42, { x: 1.25, y: 0.5, color: LINEN }),
		B(0.07, 2.1, 0.07, { x: 3.15, y: 0.5, tone: 0.5 }), B(0.5, 0.05, 0.05, { x: 3.0, y: 2.56, tone: 0.5 }), B(0.24, 0.32, 0.24, { x: 2.8, y: 2.2, color: LAMP }),
		B(6.4, 0.05, 0.05, { x: -0.3, y: 0.56, z: 0.68, ry: 0.04, tone: 1.1 }), AN('lamp', [2.8, 2.36, 0], [0, 0, 1], 0.4, { still: true }),
	),
	supper: parts( // A17.4 flooded supper table (2.4 × 1.05 × 1.7): laid for supper; placed so the top lies just under the water, the jug and chair backs break it
		B(2.2, 0.07, 0.9, { y: 0.72, color: TIMBER }), ...[[-0.98, -0.36], [0.98, -0.36], [-0.98, 0.36], [0.98, 0.36]].map(([x, z]) => B(0.07, 0.72, 0.07, { x, z, color: TIMBER, tone: 0.9 })),
		...[[-0.6, 0.72, 1], [0.6, 0.72, 1], [-0.6, -0.72, -1], [0.6, -0.72, -1]].flatMap(([x, z, s]) => [B(0.42, 0.05, 0.42, { x, z, y: 0.44, color: TIMBER, tone: 0.95 }), B(0.42, 0.6, 0.05, { x, z: z + s * 0.2, y: 0.46, color: TIMBER, tone: 0.85 })]),
		...[[-0.6, 0.2], [0.6, 0.2], [-0.6, -0.2], [0.6, -0.2]].map(([x, z]) => C(0.12, 0.12, 0.02, { x, z, y: 0.79, tone: 1.25 }, 10)),
		C(0.08, 0.11, 0.3, { x: 0.12, y: 0.79, tone: 0.75 }, 8), O(0.16, 0.08, 0.1, { x: -0.22, y: 0.83, tone: 1.1 }), C(0.04, 0.035, 0.1, { x: 0.45, z: -0.22, y: 0.79, tone: 1.2 }, 6),
	),
	lace: parts( // A17.5 flooded window with lace curtains (2.4 × 2.9 × 0.6): a flint wall section, dark flooded room behind, frayed lace drifting, a waterline stain
		B(2.4, 2.9, 0.55), B(0.9, 0.35, 0.55, { x: -0.7, y: 2.9, tone: 0.98 }), B(1.05, 1.15, 0.6, { y: 1.35, tone: 0.26 }), B(1.2, 0.1, 0.62, { y: 1.28, color: TIMBER }), B(1.2, 0.1, 0.62, { y: 2.5, color: TIMBER }),
		B(0.4, 1.0, 0.03, { x: -0.25, y: 1.42, z: 0.31, ry: 0.15, color: LACE }), B(0.36, 0.86, 0.03, { x: 0.28, y: 1.55, z: 0.31, ry: -0.25, rz: 0.08, color: LACE }),
		B(0.18, 0.4, 0.03, { x: 0.05, y: 1.36, z: 0.33, rz: 0.4, color: LACE }), B(2.42, 0.28, 0.57, { y: 0.92, tone: 0.55 }),
	),
	dock: parts( // A17.6 the Gentle House night dock (6 × 5.3 × 2.1), base on the bed; its deck is the walkway `dock`: posts, mooring posts, the still white lamp, linen
		...[-2.8, -0.9, 0.9, 2.8].flatMap((x) => [-0.95, 0.95].map((z) => C(0.1, 0.12, 2.15, { x, z }, 6))), C(0.13, 0.15, 3.0, { x: 2.8, z: 0.95, tone: 0.9 }, 6), C(0.13, 0.15, 3.0, { x: -2.8, z: 0.95, tone: 0.9 }, 6),
		B(0.12, 3.3, 0.12, { x: 2.6, z: -0.95, y: 2.0, tone: 0.7 }), B(0.06, 0.06, 0.55, { x: 2.6, z: -0.7, y: 5.15, tone: 0.7 }), B(0.26, 0.36, 0.26, { x: 2.6, z: -0.45, y: 4.72, color: LAMP }),
		C(0.22, 0.22, 0.08, { x: 1.4, z: 0.45, y: 2.12, tone: 1.2 }, 10), B(0.14, 0.55, 0.02, { x: 2.8, z: 1.08, y: 2.45, color: LINEN }), AN('lamp', [2.6, 4.9, -0.45], [0, 0, 1], 0.45, { still: true }),
	),
	cottage: parts( // A07.1 half-drowned flint cottage (7 × 6.2 × 5), base 1.2 m under the water: flint walls, patched thatch, chimney, door half drowned, dark windows
		B(6.4, 2.9, 4.4), G(7.0, 2.6, 5.2, { y: 2.85, color: THATCH }), B(0.75, 1.7, 0.75, { x: 2.55, y: 4.35, tone: 0.95 }), B(0.95, 1.85, 0.06, { z: 2.22, y: 0.55, color: TIMBER, tone: 0.65 }),
		B(0.62, 0.62, 0.06, { x: -1.9, z: 2.22, y: 1.75, tone: 0.3 }), B(0.62, 0.62, 0.06, { x: 1.9, z: 2.22, y: 1.75, tone: 0.3 }), B(1.4, 0.06, 0.9, { x: -1.2, y: 4.15, z: 1.05, rx: -0.78, color: TIMBER }),
		B(0.62, 0.62, 0.06, { x: 0.6, z: -2.22, y: 1.75, tone: 0.3 }),
	),
	weir: parts( // A07.2 timber-and-stone weir segment (4.2 × 1.9 × 1.0): stone fill, three posts and two planks on the face (+z), moss on the top
		B(4.1, 1.45, 0.8, { color: ROCK, tone: 0.95 }), ...[-2.0, 0, 2.0].map((x) => B(0.24, 1.9, 0.24, { x, z: 0.42, color: TIMBER })),
		B(4.2, 0.16, 0.1, { y: 1.15, z: 0.46, color: TIMBER }), B(4.2, 0.16, 0.1, { y: 1.6, z: 0.46, color: TIMBER, tone: 0.9 }), B(4.1, 0.12, 0.8, { y: 1.45, color: LICHEN, tone: 0.8 }),
	),
	gable: parts( // A07.3 gable wall with door arch (5 × 5.3 × 0.7), base 0.5 m under the water: the door is 2.2 × 2.6 m (concept ≈ 1.3 × 2.3, widened for Play)
		B(1.4, 3.8, 0.7, { x: -1.8 }), B(1.4, 3.8, 0.7, { x: 1.8, tone: 0.97 }), B(2.2, 1.0, 0.7, { tone: 0.95 }), B(2.2, 0.7, 0.7, { y: 3.6, tone: 1.18 }),
		B(0.32, 2.7, 0.74, { x: -1.27, y: 1.0, tone: 1.18 }), B(0.32, 2.7, 0.74, { x: 1.27, y: 1.0, tone: 1.18 }), G(0.7, 1.5, 5.0, { y: 3.8, ry: Math.PI / 2 }), B(0.45, 0.55, 0.74, { x: -1.8, y: 2.5, tone: 0.3 }),
		B(0.6, 0.6, 0.72, { x: 2.25, y: 4.0, tone: 0.9 }),
	),
	roof: parts( // A07.4 sunken roof-ridge platform (6 × 3.2 × 4.8), base 1.5 m under the water: the ridge at +1.0, planks along it, a brick chimney
		G(6.0, 2.5, 4.8, { color: THATCH, tone: 0.92 }), B(0.8, 1.25, 0.8, { x: 1.7, y: 1.85, color: BRICK }), B(1.0, 0.12, 1.0, { x: 1.7, y: 3.1, color: ROCK }),
		B(5.4, 0.08, 0.45, { y: 2.46, color: TIMBER, tone: 1.05 }), B(0.08, 0.6, 2.2, { x: -2.6, y: 1.2, rx: 0.5, color: TIMBER }), B(0.9, 0.06, 0.5, { x: -1.0, y: 1.6, z: 1.0, rx: -0.8, color: TIMBER }),
	),
	raft: parts( // A07.5 pontoon plank raft (3.6 × 1.7 × 2.4), base 0.24 m under the water: barrels, plank deck (top +0.48), a rope post
		...[-1.1, 1.1].flatMap((x) => [-0.75, 0.75].map((z) => O(0.55, 0.32, 0.32, { x, y: 0.3, z, tone: 0.75 }))), B(3.6, 0.14, 2.4, { y: 0.58 }), B(0.1, 1.0, 0.1, { x: 1.65, z: 1.05, y: 0.72, tone: 0.85 }),
		B(0.7, 0.03, 0.5, { x: -0.6, y: 0.72, z: 0.4, tone: 1.2 }),
	),
	roost: parts( // A07.6 rook roost pole (2.8 × 6.2 × 1.4), base on the bed: stone foot, pole, cross arms, three nests
		B(1.1, 1.9, 1.1, { color: ROCK }), C(0.1, 0.13, 4.3, { y: 1.9 }, 6), B(2.6, 0.1, 0.1, { y: 5.2, tone: 0.9 }), B(1.5, 0.1, 0.1, { y: 4.1, ry: 0.5, x: 0.2, tone: 0.9 }),
		O(0.42, 0.18, 0.42, { x: -1.15, y: 5.35, color: NEST }), O(0.42, 0.18, 0.42, { x: 1.15, y: 5.35, color: NEST }), O(0.38, 0.16, 0.38, { x: 0.75, y: 4.25, z: 0.45, color: NEST }),
	),
	peat: parts( // A03.5 peat bank chunk (2.9 × 1.4 × 1.2): cut peat strata, rank grass on top, roots
		B(2.8, 1.12, 1.1, { color: PEAT }), B(2.9, 0.1, 1.2, { y: 1.1, color: '#56603f' }), B(2.82, 0.04, 1.12, { y: 0.4, color: '#3a2a1e' }), B(2.82, 0.04, 1.12, { y: 0.75, color: '#3a2a1e' }),
		B(0.08, 0.55, 0.08, { x: 1.0, z: 0.6, y: 0.1, rz: 0.6, color: BARK }), B(0.07, 0.5, 0.07, { x: -0.8, z: 0.6, y: 0.2, rz: -0.5, color: BARK }),
	),
	trunk: parts( // A04.5 fallen hollow trunk (5 × 1.3 × 1.6): a hollow log, root plate and broken branches at one end, a moss band
		C(0.55, 0.62, 4.6, { x: 2.3, y: 0.58, rz: Math.PI / 2, color: BARK }, 10), C(0.42, 0.42, 0.05, { x: 2.33, y: 0.58, rz: Math.PI / 2, tone: 0.3, color: '#1f1a15' }, 10),
		O(0.45, 0.55, 0.6, { x: -2.45, y: 0.62, color: BARK, tone: 0.9 }), B(0.08, 1.0, 0.08, { x: -2.4, y: 0.8, rz: 0.8, color: BARK }), B(0.07, 0.9, 0.07, { x: -2.3, y: 0.7, rx: 0.9, color: BARK }),
		M(1.5, 0.14, 0.45, { x: 0.3, y: 1.1, color: LICHEN }),
	),
	roots: parts( // A04.6 exposed willow root cluster (4.6 × 2.2 × 4.0): a low root dome and arched roots
		M(1.2, 1.5, 1.1, { color: BARK, tone: 0.9 }), ...[0, 1, 2, 3, 4, 5, 6].map((k) => {
			const a = (k / 7) * Math.PI * 2 + 0.3;
			return B(0.22, 1.9, 0.22, { x: Math.cos(a) * 0.55, z: Math.sin(a) * 0.55, y: 0.25, ry: -a, rz: -1.05, color: BARK, tone: 0.95 + (k % 2) * 0.1 });
		}), M(0.9, 0.2, 0.8, { y: 1.3, color: LICHEN, tone: 0.9 }),
	),
	soothed: parts( // N-FN01 one of the Soothed in procession (0.55 × 1.75 × 0.45): white nightgown, pale head, arms held out (sleepwalking)
		C(0.15, 0.27, 1.45, {}, 9), O(0.105, 0.125, 0.11, { y: 1.58, color: '#cbc3b4' }), B(0.07, 0.07, 0.42, { x: -0.15, y: 1.22, z: 0.2, tone: 0.97 }), B(0.07, 0.07, 0.42, { x: 0.15, y: 1.22, z: 0.2, tone: 0.97 }),
	),
	shoes: parts( // N-FN02 a pair of shoes set neatly at the water's edge, a folded shawl (unmarked vignette)
		B(0.11, 0.09, 0.27, { x: -0.08, color: '#4b4038' }), B(0.11, 0.09, 0.27, { x: 0.08, color: '#4b4038' }), B(0.3, 0.05, 0.2, { x: 0.05, z: -0.22, color: '#8f8a7f' }),
	),
	bogGrave: parts( // N-FN03 bog grave: a peat mound, a willow stake with faded ribbons, cut turves
		M(0.62, 0.38, 1.15, { color: PEAT }), B(0.08, 1.6, 0.08, { z: -1.05, color: TIMBER, tone: 0.8 }), B(0.04, 0.5, 0.02, { z: -1.0, y: 1.0, x: 0.05, rz: 0.2, tone: 1.25 }),
		B(0.04, 0.42, 0.02, { z: -1.1, y: 1.05, x: -0.04, rz: -0.25, tone: 1.15 }), B(0.5, 0.25, 0.3, { x: 0.6, z: 0.6, color: PEAT, tone: 1.2 }), B(0.45, 0.22, 0.3, { x: 0.65, z: 0.15, y: 0.0, ry: 0.3, color: PEAT, tone: 1.1 }),
	),
	toll: parts(B(0.14, 1.15, 0.14, { color: TIMBER }), C(0.2, 0.13, 0.05, { y: 1.15, color: BRASS }, 12), C(0.03, 0.03, 0.02, { y: 1.2, x: 0.05, color: BRASS }, 6)), // N-FN06
	cradle: parts( // N-FN08 an empty wicker cradle on rockers
		B(0.9, 0.38, 0.5, { y: 0.12, tone: 0.85 }), B(0.42, 0.32, 0.52, { x: -0.25, y: 0.48, tone: 0.8 }), B(0.95, 0.07, 0.07, { z: 0.22 }), B(0.95, 0.07, 0.07, { z: -0.22 }), B(0.5, 0.04, 0.42, { x: 0.15, y: 0.5, tone: 0.65 }),
	),
};

// ---- asset defs (the §6b ASSETS rows; count is filled by withCounts) ------------------------------------------------------------------------------------
const A = (id, name, category, size, status, source, segment, extra = {}) => ({ id, name, category, size, status, source, segment, note: '', ...extra });
const DEFS = [
	// the Night Fens kit (A06)
	A('A06.1', 'Fen causeway segment (dike revetment posts)', 'structure', [2.31, 0.9, 0.51], 'kit', 'concept A06 cell 1 (Night Fens kit)', 'fens', { model: 'kit:fence.run_broken', fit: 'native', shape: 'posts', collide: false, note: 'kit tạm (Blood-Moor broken fence run, 2.31 m modules); the causeway is the dike terrain itself; these are its revetment posts, run along the dike banks below the crest (no collision needed)' }),
	A('A06.2', 'Lichen standing stone (upright marker stone)', 'rock', [0.9, 2.6, 0.7], 'blockout', 'concept A06 cell 2 (Night Fens kit)', 'fens', { shape: SHAPES.stone, blockers: [[0, 0, 0.82, 0.62]], note: 'sheet reads ≈ 2–3 m; a ring of five on the stone island (rite 1), singles as route markers on the dikes' }),
	A('A06.3', 'Stepping-stone ford (one tile of river stones)', 'rock', [1.0, 0.46, 0.93], 'glb', 'concept A06 cell 3 (Night Fens kit)', 'fens', { model: 'biome-prop-riverbank-stones', fit: 'native', shape: SHAPES.ford, collide: false, blockers: [], note: 'glb tạm: the ASHLAR riverbank stones tiled seven to a 7 m ford (the concept ford is 2.4 × 0.5 × 7 m) along a causeway 6 cm under the water (the walk surface); the stones are walk-through' }),
	A('A06.4', 'Unlit bog-lure post (empty cage)', 'structure', [1.47, 2.82, 0.84], 'kit', 'concept A06 cell 4 (Night Fens kit)', 'fens', { model: 'kit:lighting.lantern_post', fit: 'native', shape: SHAPES.lure, blockers: [[0.28, 0, 0.9, 0.84]], note: 'kit tạm (camp lantern post: an empty dark cage on an arm, no flame, no emissive, no light); never lit: the corpse-candles are the lure; on the dike banks, base at the waterline' }),
	A('A06.5', 'Half-sunk fen punt', 'prop', [3.4, 0.7, 1.2], 'blockout', 'concept A06 cell 5 (Night Fens kit)', 'fens', { shape: SHAPES.punt, collide: false, note: 'at the water level − 0.3 m' }),
	A('A06.6', 'Broken bridge pier', 'structure', [3.8, 5.0, 2.2], 'blockout', 'concept A06 cell 6 (Night Fens kit)', 'fens', { shape: SHAPES.pier, note: 'two piers of the fallen bridge stand in the channel; the route detours over the ford' }),
	A('A17.1', 'The leaning stones (Act I arch)', 'story', [4.6, 4.6, 1.4], 'blockout', 'concept A17 cell 1 (v2 batch)', 'fens', { shape: SHAPES.arch, blockers: [[-1.72, 0, 1.0, 1.3], [1.72, 0, 1.0, 1.3]], note: 'THE landmark of the fens: over the dike, 4.6 m; passage 2.44 m (concept 1.6 m, widened for the 1 m Play grid). Stays a blockout: the A17.1 GLB opens only 0.9–1.1 m (2.44 m needed; ×2.2 would make it 10 m tall) and stands on a 5.9 m ground disc that would cover the dike' }),
	// the fen's plants, rocks and wood (A03, A04) and the existing GLBs
	A('A03.1', 'Low grass clump', 'vegetation', [0.6, 0.5, 0.6], 'procedural', 'concept A03 cell 1 (E01 fen kit)', 'both', { procedural: 'grass', collide: false, note: 'Dark Wood grass cards on the grass layers (crests, islands)' }),
	A('A03.2', 'Tall reeds clump', 'vegetation', [0.8, 1.8, 0.8], 'procedural', 'concept A03 cell 2 (E01 fen kit)', 'both', { procedural: 'reeds', collide: false, note: 'shore-plant cards: fringes on every bank and dense reed shoals in the open water (sheet reads up to ≈ 2.5 m)' }),
	A('A03.3', 'Sedge water clump', 'vegetation', [0.7, 0.9, 0.7], 'procedural', 'concept A03 cell 3 (E01 fen kit)', 'both', { procedural: 'sedge', collide: false }),
	A('A03.4', 'Large moss rock', 'rock', [3.15, 1.8, 2.01], 'kit', 'concept A03 cell 4 (E01 fen kit)', 'fens', { model: 'kit:mossy.standard_side', fit: 'native', note: 'kit tạm: Blood-Moor mossy rock, the side piece at its own size (placed ×0.64–0.88 ≈ the 2.3 × 1.6 × 2.0 m sheet; no per-axis stretch)' }),
	A('A03.5', 'Peat bank chunk', 'rock', [2.9, 1.4, 1.2], 'blockout', 'concept A03 cell 5 (E01 fen kit)', 'fens', { shape: SHAPES.peat }),
	A('A03.6', 'Waterlogged root stump', 'vegetation', [1.4, 1.3, 1.4], 'kit', 'concept A03 cell 6 (E01 fen kit)', 'both', { model: 'kit:deadTrees.stump', fit: 'size', note: 'kit tạm (Blood-Moor dead-tree stump)' }),
	A('A04.1', 'Old broad weeping willow', 'vegetation', [6, 5.4, 6], 'blockout', 'concept A04 cell 1 (E02 willow kit)', 'fens', { shape: { kind: 'tree', crown: 'weeping' }, blockers: [[0, 0, 0.9, 0.9]], note: 'sheet reads ≈ 5 m tall, 5.5 m wide; placed at ×1.0–1.25 on the islands, the trunk blocks' }),
	A('A04.2', 'Young willow', 'vegetation', [4, 6, 4], 'blockout', 'concept A04 cell 2 (E02 willow kit)', 'fens', { shape: { kind: 'tree', crown: 'weeping' }, blockers: [[0, 0, 0.7, 0.7]], note: 'along the side dike to the Willow Mere' }),
	A('A04.3', 'Dead angular tree', 'vegetation', [3, 7, 3], 'kit', 'concept A04 cell 3 (E02 willow kit)', 'fens', { model: 'kit:deadTrees.tall', fit: 'size', blockers: [[0, 0, 0.9, 0.9]], note: 'kit tạm (Blood-Moor dead tree stretched to the sheet size ≈ 3.8H); many stand in the open water' }),
	A('A04.5', 'Fallen hollow trunk', 'vegetation', [5, 1.3, 1.6], 'blockout', 'concept A04 cell 5 (E02 willow kit)', 'fens', { shape: SHAPES.trunk }),
	A('A04.6', 'Exposed willow root cluster', 'vegetation', [4.6, 2.2, 4.0], 'blockout', 'concept A04 cell 6 (E02 willow kit)', 'fens', { shape: SHAPES.roots, note: 'on the side dike to the Willow Mere (its kit is the Mere\'s)' }),
	A('glb:biome-prop-riverbank-stones', 'Riverbank stones', 'rock', [1.0, 0.35, 1.0], 'glb', 'ashlar/3d/props/clutter_v1/riverbank_stones', 'both', { model: 'biome-prop-riverbank-stones', fit: 'native', collide: false }),
	A('glb:biome-prop-stump', 'Mossy stump', 'vegetation', [0.8, 0.5, 0.8], 'glb', 'ashlar/3d/props/clutter_v1/mossy_stump', 'fens', { model: 'biome-prop-stump', fit: 'native', collide: false }),
	A('glb:biome-prop-mushrooms', 'Mushroom cluster', 'vegetation', [0.4, 0.3, 0.4], 'glb', 'ashlar/3d/props/clutter_v1/mushroom_cluster', 'fens', { model: 'biome-prop-mushrooms', fit: 'native', collide: false }),
	A('glb:dungeon-prop-candle-cluster', 'Candle cluster (unlit)', 'prop', [0.8, 0.8, 0.8], 'glb', 'ashlar/3d/props/dungeon_v1/candle_cluster', 'both', { model: 'dungeon-prop-candle-cluster', fit: 'native', collide: false, note: 'at the rite sites, all out: no human light in the night fens' }),
	A('glb:dungeon-prop-fallen-bell', 'Fallen bell (drowned)', 'prop', [1.3, 1.25, 1.3], 'glb', 'ashlar/3d/props/dungeon_v1/fallen_bell', 'weir', { model: 'dungeon-prop-fallen-bell', fit: 'native', collide: false, note: 'half under the black water below the drowned bell tower' }),
	// Rook's Weir (A07, A17, A01.2)
	A('A07.1', 'Half-drowned flint cottage', 'building', [7, 6.2, 5], 'blockout', 'concept A07 cell 1 (Rook\'s Weir kit)', 'weir', { shape: SHAPES.cottage, note: 'base 1.2 m under the water: 1.7 m of wall shows, ridge +4.2 m; no lit window (the village is empty)' }),
	A('A07.2', 'Timber-and-stone weir segment', 'structure', [4.2, 1.9, 1.0], 'blockout', 'concept A07 cell 2 (Rook\'s Weir kit)', 'weir', { shape: SHAPES.weir, note: 'run along the south face of the weir dike (its crest is the walk); two broken segments stand in the water west of it' }),
	A('A07.3', 'Gable wall with door arch', 'building', [5, 5.3, 0.7], 'blockout', 'concept A07 cell 3 (Rook\'s Weir kit)', 'weir', { shape: SHAPES.gable, blockers: [[-1.8, 0, 1.4, 0.7], [1.8, 0, 1.4, 0.7]], note: 'the plank lane passes through one; two make the supper-house ruin; one is rite 5 (door 2.2 × 2.6 m, concept ≈ 1.3 × 2.3, widened for Play)' }),
	A('A07.4', 'Sunken roof-ridge platform', 'building', [6, 3.2, 4.8], 'blockout', 'concept A07 cell 4 (Rook\'s Weir kit)', 'weir', { shape: SHAPES.roof, collide: false, note: 'ridge 1.0 m above the water; two carry the plank walk (walkways `ridgeW`, `ridgeE`): "walk on roofs"' }),
	A('A07.5', 'Pontoon plank raft', 'structure', [3.6, 1.7, 2.4], 'blockout', 'concept A07 cell 5 (Rook\'s Weir kit)', 'weir', { shape: SHAPES.raft, collide: false, note: 'deck +0.48 m; the walk surface is its raft walkway (deck 0.5 m), the junctions of the plank lanes' }),
	A('A07.6', 'Rook roost (dead tree)', 'structure', [4.19, 3.42, 1.81], 'kit', 'concept A07 cell 6 (Rook\'s Weir kit)', 'weir', { model: 'kit:deadTrees.tall', fit: 'native', shape: SHAPES.roost, blockers: [[0.24, -0.08, 1.0, 1.0]], note: 'kit tạm: a Blood-Moor dead tree at ×1.35 standing in the water (base 0.4 m under it, top ≈ 4.2 m above it; the concept pole is 4.75 m) — rooks nest in dead trees; they circle it and settle on its branch tips' }),
	A('A01.2', 'Raised wooden walkway segment (plank bridge)', 'structure', [4.0, 1.2, 1.4], 'blockout', 'concept A01 cell 2 (E03 village kit)', 'weir', { shape: 'deck', note: 'the plank bridges of Rook\'s Weir (deck 0.62 m, 1.8 m wide): built per deck segment from the walkway paths (the deck mesh is the walk surface)' }),
	A('A01.5', 'Village well', 'structure', [2.2, 3.4, 2.0], 'blockout', 'concept A01 cell 5 (E03 village kit)', 'weir', { shape: 'well', note: 'the drowned village well on its stone platform (WELL): the junction of the plank lanes and the one dry spawn spot' }),
	A('A17.2', 'Drowned bell tower', 'building', [5.74, 10.0, 7.1], 'glb', 'concept A17 cell 2 (v2 batch)', 'weir', { model: 'act1-a17-2-drowned-bell-tower', fit: 'native', shape: SHAPES.tower, note: 'GLB 5.7 × 10 × 7.1 m (with the rook\'s nest on −x), cut flat at the waterline: its base stands 0.25 m under the water (≈ 9.75 m above it), not on the bed; louvres, bell, patched slate cap' }),
	A('A17.3', 'The Gentle House boat (linen canopy, still white lamp)', 'story', [7, 3.23, 2.02], 'glb', 'concept A17 cell 3 (v2 batch)', 'weir', { model: 'act1-a17-3-gentle-boat', fit: 'native', shape: SHAPES.boat, collide: false, note: 'GLB 7 × 3.23 × 2.02 m, keel 0.25 m under the water; moored along the dock\'s deck edge; the canopy is Mercy\'s clean linen, the bow lamp burns still and even (Perfection light, on the model lamp)' }),
	A('A17.4', 'Flooded supper table (laid for supper)', 'prop', [2.4, 1.31, 1.46], 'glb', 'concept A17 cell 4 (v2 batch)', 'weir', { model: 'act1-a17-4-flooded-supper-table', fit: 'native', shape: SHAPES.supper, collide: false, note: 'GLB 2.4 × 1.31 × 1.46 m; in the roofless supper-house ruin: the top (0.94 m) lies 0.14 m under the water; the jug and chair backs break the surface' }),
	A('A17.5', 'Flooded window with lace curtains', 'building', [2.2, 2.21, 1.39], 'glb', 'concept A17 cell 5 (v2 batch)', 'weir', { model: 'act1-a17-5-flooded-lace-window', fit: 'native', shape: SHAPES.lace, blockers: [[0, 0.15, 2.2, 0.7]], note: 'GLB 2.2 × 2.21 × 1.39 m (the lace is a solid mass; its dark half-disc floor behind the wall lies under the black water); the north wall of the supper-house ruin, seen from its doorway, sill 0.15 m above the water' }),
	A('A17.6', 'Gentle House night dock', 'structure', [6, 3.44, 2.96], 'glb', 'concept A17 cell 6 (v2 batch)', 'weir', { model: 'act1-a17-6-gentle-dock', fit: 'native', shape: SHAPES.dock, collide: false, note: 'GLB 6 × 3.44 × 2.96 m, deck 0.94 m above its base: placed so the deck top is the walkway `dock` (0.62 m; the posts end 0.3 m under the water), whose own planks are hidden (walk surface only); the still white lamp on its lamp post (+z side), a strip of clean linen' }),
	// LD only (no concept): N-FN…
	A('N-FN01', 'The Soothed in procession (P01 stand-in figures, white nightgowns)', 'linen', [0.55, 1.75, 0.45], 'blockout', 'LD only, no concept (P01 sheet: ashlar/art/map-01-concepts/monsters)', 'fens', { shape: SHAPES.soothed, collide: false, note: 'the Remember image: a line wading waist-deep along the drowned road toward the far window; the only clean white in Dolmoor' }),
	A('N-FN02', 'Shoes left at the water\'s edge (unmarked vignette)', 'prop', [0.45, 0.16, 0.45], 'blockout', 'LD only, no concept', 'fens', { shape: SHAPES.shoes, collide: false }),
	A('N-FN03', 'Bog grave (peat mound, willow stake, ribbons)', 'story', [1.77, 0.82, 2.4], 'glb', 'LD only, no concept', 'fens', { model: 'act1-a16-4-fresh-grave', fit: 'native', shape: SHAPES.bogGrave, collide: false, note: 'glb tạm: the churchyard fresh grave A16.4 (heaped earth, marker post, spade) in the same form; the willow stake and ribbons are still missing; rite 4' }),
	A('N-FN04', 'Small stone cairn', 'rock', [1.73, 0.84, 1.36], 'kit', 'LD only, no concept', 'fens', { model: 'kit:rocks.low', fit: 'native', note: 'kit tạm (Blood-Moor low rock at its own size; the old shrine cairn was squashed ×0.5): the heart of the lichen ring, rite 1' }),
	A('N-FN05', 'Drying eel net', 'prop', [4, 1.8, 1.4], 'kit', 'LD only, no concept', 'fens', { model: 'kit:crafts.fishing_net', fit: 'native', collide: false, note: 'kit tạm: the eel-catcher\'s net at rite 2' }),
	A('A01.6', 'Eel-trap fishing rack', 'structure', [3.96, 1.8, 1.38], 'kit', 'concept A01 cell 6 (E03 village kit)', 'fens', { model: 'kit:crafts.fishing_net', fit: 'native', shape: 'rack', note: 'kit tạm (camp fishing net between poles); rite 2: the drowned eel-catcher\'s rack by the broken bridge' }),
	A('N-FN06', 'Toll post with a coin dish (The Ferryman\'s Toll)', 'story', [0.5, 1.3, 0.5], 'blockout', 'LD only, no concept', 'weir', { shape: SHAPES.toll, collide: false }),
	A('N-FN07', 'Rook (ambient, circling the roost poles)', 'story', [0.45, 0.35, 0.25], 'procedural', 'LD only, no concept', 'weir', { procedural: 'crow', collide: false, note: 'they circle until the Count is done (toggle "các mộ đã yên"), then settle on the poles' }),
	A('N-FN08', 'Empty wicker cradle', 'story', [1.0, 0.75, 0.6], 'blockout', 'LD only, no concept', 'fens', { shape: SHAPES.cradle, collide: false, note: 'in the Lullaby Man\'s arena' }),
	A('N-GH', 'The Gentle House, far silhouette (gate tower + long ward + high warm still window)', 'story', [46, 20, 30], 'glb', 'act1 GLBs A18.4 ward range + 11 × A18.5 wall-with-niche sections (env/act1/gentleHouseFar.js); A11.4 gate tower still a box', 'far', { ...GENTLE_HOUSE_FAR, shape: 'compound', collide: false, note: 'shared far silhouette of the outdoor maps: the A18.4 range\'s own lit window carries the brightest, stillest light of the act (glow in the VFX layer: it reads through the fog); A11.4 has no model yet (box); if a GLB fails the full compound blockout stands in' }),
];

// ---- layout: dikes, islands, the ford, the drowned road (all `dike` paths: raised over the carved water, after it) ----------------------------------------
const dike = (id, label, points, o = {}) => ({ id, kind: 'dike', label, points, width: o.width ?? 2.8, dike: { crest: o.crest ?? DIKE, bank: o.bank ?? 1.4 }, surface: 'packed', smooth: o.smooth ?? 2, role: o.role ?? 'dike' });
const isle = (id, label, points, width, o = {}) => dike(id, label, points, { width, crest: o.crest ?? ISLE, bank: o.bank ?? 2.2, smooth: o.smooth ?? 1, role: 'isle' });
const walk = (id, label, points, o = {}) => ({ id, kind: 'walkway', label, points, width: o.width ?? 1.8, deck: o.deck ?? PLANK, surface: 'wood', asset: o.asset === undefined ? 'A01.2' : o.asset ?? undefined, ramps: o.ramps ?? false, ...(o.hidden ? { hidden: true } : {}) });

const D1 = [[128, 50], [118, 50.5], [107, 47.5], [97, 42.5], [88, 38]];
const D2 = [[60, 25], [51, 21.85], [42, 18.7], [33, 15.55], [24, 12.4]];
const ARCH = { x: 42, z: 18.7, yaw: face(-36, -12.6) }; // on D2, the passage along the dike
const I1 = [[84, 35.5], [74, 31.5], [64, 27]]; // the stone island
const I2 = [[22, 11], [13, 5.5], [4, 1]]; // the crossing island
const D3 = [[3, 9], [-1, 16], [-5.5, 23.5]]; // to the broken bridge's east abutment
const D3B = [[-1, 16], [-1.5, 25], [-3, 33.5]]; // down the channel's east bank to the ford
const FORD_L = [[-3.5, 34], [-11.5, 35], [-19.5, 35.5]];
const D4 = [[-20, 35.5], [-26, 38.5], [-31, 43], [-35, 47.5], [-38, 50.5]]; // the lure posts, into the arena
const D4W = [[-24.5, 36.8], [-21.5, 31.5], [-19.5, 28.8]]; // the west abutment stub
const WILLOW = [[-26, 38.5], [-22, 50], [-20.5, 62], [-21.5, 70], [-24, 78], [-28, 88], [-30, 96]];
const I3 = [[-58, 64], [-50, 60.5], [-42, 56]]; // the Lullaby Man's island
const I4 = [[-17.5, 64], [-15, 68]]; // the bog-grave islet on the willow dike
const D5 = [[-46, 47], [-45.5, 36], [-44, 27]];
const WEIR = [[-92, 24.6], [-78, 23.6], [-66, 23.6], [-54, 24.2], [-40, 25.2]]; // west → east (the A07.2 run faces south, the camera side)
const EXIT_N = [[-101.2, -44], [-110, -48.5], [-117, -60], [-120, -78], [-118.5, -96]];
const ROAD_S = [[22, 96], [20, 60], [14, 32], [11, 22]]; // the drowned road, from the villages to the crossing island (stops 2 m short of its bank foot)
const ROAD_N = [[-8, -9], [-30, -26], [-52, -45], [-74, -56], [-92, -63]]; // … and on across the Procession Mere to the night dock (stops 13 m short of every deck)

// Rook's Weir: plank lanes (A01.2), rafts, roof ridges, the dock (walkways: deck mesh = walk surface; `ramps` only where a lane meets the weir crest)
const L1 = [[-70, 22.6], [-70.6, 12], [-71.6, 3.2]];
const L2 = [[-72.2, -1.2], [-72.5, -6], [-72.5, -18], [-73.2, -24.5]];
const L3 = [[-74.8, -27.2], [-80, -27.6], [-85.6, -28]];
const L4 = [[-99.6, -30.8], [-100.6, -40], [-102.2, -49], [-103.6, -54.6]];
const L5A = [[-72.4, -27.4, PLANK], [-69.4, -28.2, RIDGE], [-63.6, -29.8, RIDGE], [-60.6, -30.8, PLANK]]; // over the east roof
const L6 = [[-72.6, -19.6], [-66.5, -20], [-62.2, -20.2]]; // to the drowned doorway (rite 5)
const L7 = [[-71, 11.6], [-75.5, 12], [-79.4, 12.2]]; // into the supper-house doorway
const RIDGE_W = [[-85.2, -28, 0.8], [-87.4, -28, RIDGE], [-94.6, -28, RIDGE], [-96.6, -28.4, 0.75]];
const RA = [ // rafts: centre, axis yaw (local x along the raft), walkway ends
	{ id: 'raft1', x: -72, z: 0.8, yaw: 90, a: [-72, 2.6], b: [-72, -1.0] },
	{ id: 'raft3', x: -98.4, z: -29.4, yaw: along(-4, -0.4), a: [-96.4, -29.2], b: [-100.4, -29.6] },
	{ id: 'raft4', x: -58.5, z: -31.6, yaw: along(3.4, -0.8), a: [-60.2, -31.2], b: [-56.8, -32] },
];
const WELL = { x: -73.5, z: -27.1 }; // the well-head platform: the one piece of dry ground in the drowned village (the junction of L2, L3, L5)
// the A17.6 GLB dock: its deck (6 m along local x, 2.6 m of planks, top 0.94 m above its base) starts at the end of plank lane L4 and runs on toward the open
// water and the window; its deck top is the hidden walkway `dock` (PLANK). Model points (GLB frame): lamp glass (1.65, 2.72, 1.1), boat bow lamp (2.93, 2.7, 0.29).
const L4_END = L4[L4.length - 1];
const DOCK_U = [-2.6 / Math.hypot(2.6, 6.6), -6.6 / Math.hypot(2.6, 6.6)]; // the dock's axis (local +x)
const DOCK = { x: L4_END[0] + DOCK_U[0] * 3.0, z: L4_END[1] + DOCK_U[1] * 3.0, yaw: along(DOCK_U[0], DOCK_U[1]), y: PLANK - 0.94 };
const DOCK_L = [[-103.6, -54.4], [L4_END[0] + DOCK_U[0] * 5.85, L4_END[1] + DOCK_U[1] * 5.85]]; // lane end → 0.15 m short of the far deck end
const BOAT = (() => { // moored along the dock's west side (the dock's local −z, clear of its 1.45 m deck edge), bow toward the open water and the window
	const [x, , z] = local(DOCK, [0, 0, -2.6]);
	return { x, z, yaw: DOCK.yaw, y: LV - 0.25 };
})();
// the rook roosts (A07.6 = the kit dead tree ×1.35, base 0.4 m under the water) and the drowned tower (A17.2 GLB, cut base 0.25 m under the water)
const ROOSTS = [[-48, -28], [-46, -46], [-64.5, -8], [-90, 2], [-110, -28], [-82, -46]].map(([x, z], i) => ({ x, z, yaw: i * 33, y: LV - 0.4, scale: 1.35 }));
const ROOST_TIPS = [[1.17, 3.42, -0.13], [-1.05, 2.78, 0.34]]; // two branch tips of the kit tree (unscaled): where the rooks settle
const TOWER = { x: -53, z: -38, yaw: 10, y: LV - 0.25 };
const TOWER_NEST = [-1.8, 8.06, 0]; // the top of the rook's nest on the tower model
const DOCK_LAMP = local(DOCK, [1.65, 2.72, 1.1]);
const BOAT_LAMP = local(BOAT, [2.93, 2.7, 0.29]);
const FERRYMAN = local(BOAT, [-2.3, 0.22, 0]);
const TOLL = local(DOCK, [-0.8, 0, 0.72]); // on the dock's east edge

// The Soothed in procession on the drowned road (north part), receding toward the dock and the window
const PROCESSION = [1.5, 4, 6.5, 9, 11.5, 14, 16.5, 19.5, 23, 27, 33, 41].map((s) => {
	const [x, z, dx, dz] = at(ROAD_N, s);
	return { asset: 'N-FN01', x: x + Math.sin(s * 1.7) * 0.25, z: z + Math.cos(s * 1.3) * 0.2, yaw: face(dx, dz) + Math.sin(s) * 6, y: ROAD + 0.03, name: 'The Soothed (procession)' };
});

// lure posts and standing stones along the way (offsets from a dike centreline: on the bank, base at the waterline)
const onBank = (pts, s, side, off = 1.95) => {
	const [x, z, dx, dz] = at(pts, s);
	return [x - dz * side * off, z + dx * side * off, face(dx, dz)];
};
const LURES = [[D4, 3, 1], [D4, 9, -1], [D4, 14.5, 1], [D4, 19, -1], [D1, 24, -1], [D2, 10, 1], [D3B, 6, 1], [WILLOW, 20, 1]].map(([p, s, side], i) => {
	const [x, z, yaw] = onBank(p, s, side);
	return { asset: 'A06.4', x, z, yaw: yaw + side * 90 + 180 + (i % 2 ? 8 : -6), name: 'Unlit bog-lure post' }; // +180: the kit cage hangs on its −x (the blockout's on +x)
});
const RING = { x: 73, z: 30.5 }; // rite 1, the lichen ring on the stone island
const RING_STONES = [10, 80, 150, 222, 292].map((a, i) => {
	const x = RING.x + Math.cos(a * DEG) * 5.2;
	const z = RING.z + Math.sin(a * DEG) * 5.2;
	return { asset: 'A06.2', x, z, yaw: face(RING.x - x, RING.z - z) + (i % 2 ? 7 : -5), scale: 0.9 + ((i * 7) % 4) * 0.08, name: 'Lichen standing stone (the ring)' };
});
const MARKER_STONES = [[D1, 9, 1], [D2, 3, -1], [D2, 30, -1], [D4, 1.5, -1], [WILLOW, 32, -1]].map(([p, s, side], i) => {
	const [x, z, yaw] = onBank(p, s, side, 1.9);
	return { asset: 'A06.2', x, z, yaw: yaw + 90 * side, scale: 0.95 + (i % 3) * 0.08, name: 'Lichen standing stone (route marker)' };
});
const REVET = (pts, side, from, to) => {
	const sh = shift(pts, side * 2.15);
	return sh.slice(from, to);
};

// reed shoals in the open water (height ops before the carve: −0.5 m, isolated by deep water from everything walkable)
const SHOALS = [
	[-20, -50, 9, 4, 20], [8, -40, 7, 3.5, -10], [30, -62, 10, 5, 30], [-46, -14, 6, 3, 0], [56, -36, 12, 6, 15], [96, -22, 10, 5, -20], [90, -70, 14, 6, 10], [40, -84, 10, 4, 0],
	[30, 52, 9, 4.5, 10], [52, 72, 12, 6, -15], [6, 70, 7, 4, 30], [102, 72, 10, 5, 0], [112, 24, 8, 4, 40], [76, 58, 9, 4, -30], [118, -50, 7, 4, 0],
	[-90, 62, 10, 5, 0], [-102, 82, 8, 4, 20], [-70, 86, 9, 4, -10], [-58, 40, 5, 2.5, 80], [-118, 40, 6, 3.5, 0], [-12, 86, 6, 3, -20], [72, 4, 8, 3.5, 20], [118, -84, 8, 4, 0],
];

export const PLAN = {
	id: 'fens',
	engine: 'outdoor',
	label: "Night Fens → Rook's Weir",
	biome: 'BIO-01',
	seed: 1104,
	bounds: [-128, -96, 128, 96],
	cell: 0.5,
	splat: { res: 1024 },
	target: {
		length: 520,
		note: "Full game: the Night Fens (35 min, D4 C3) want ≈ 1.1 km of dike route through ≈ 520 × 400 m with open / choke every 40–60 s (≈ 225–335 m of route) — this slice compresses that to a beat every ≈ 15–25 s (≈ 290 m of fen route); Rook's Weir (18 min, D4 C2) wants ≈ 220 × 220 m with 2–3 times the plank network shown here (≈ 190 m of planks, 2 walkable roofs). Keep: no walkable open water, the far window across the Procession Mere, the lullaby breadcrumbs.",
	},
	edge: { width: 6, y: -1.8 },
	heights: [
		{ kind: 'base', y: BED },
		{ kind: 'noise', amp: 0.18, scale: 11, seed: 2.4 },
		...SHOALS.map(([x, z, rx, rz, rot]) => ({ kind: 'flatten', area: { ellipse: [x, z, rx, rz, rot] }, y: -0.5, soft: 1.2 })),
	],
	water: [
		// one body over the whole map (its outline lies outside the bounds, so no shelf inside): the carve only caps the ground at −0.26; the bed, the shoals and every
		// shore come from the height ops and the dikes (raised after the carve). Depth anywhere = 0 − ground.
		{ id: 'fen', label: 'Black fen water (the Night Fens, the Procession Mere, Rook\'s Weir)', level: LV, tint: 'fen', wobble: 0, shelf: [1.5, 0.3], drop: [1.5, 0], reach: 6, area: { rect: [-150, -118, 150, 118] } },
	],
	paths: [
		dike('D1', 'Dike road from Lychgate (east)', D1),
		isle('I1', 'The stone island (lichen ring)', I1, 15),
		dike('D2', "Dike under the leaning stones (the act's arch)", D2, { smooth: 0 }),
		dike('ARCH', 'The arch footing', [[46.2, 20.17], [37.8, 17.23]], { width: 5.6, smooth: 0 }),
		isle('I2', 'The crossing island (the drowned road comes ashore)', I2, 17),
		dike('D3', 'Dike to the broken bridge', D3),
		dike('D3B', 'East bank of the channel', D3B),
		dike('FORD', 'The stepping-stone ford (ankle-deep causeway)', FORD_L, { crest: FORD, bank: 1.0, smooth: 1, role: 'ford' }),
		dike('D4W', 'West abutment of the broken bridge', D4W),
		dike('D4', 'Dike through the lure posts', D4),
		dike('WILLOW', 'Side dike to the Willow Mere', WILLOW),
		isle('I4', 'Bog-grave islet', I4, 7),
		isle('I3', "The Lullaby Man's island", I3, 22, { crest: 0.4 }),
		dike('D5', 'Dike north to the weir', D5),
		dike('WEIR', "Rook's Weir (the weir crest)", WEIR, { smooth: 1 }),
		dike('EXIT_N', 'Causeway north to the Poppy Reach', EXIT_N),
		dike('ROAD_S', 'The drowned road (south, under water)', ROAD_S, { width: 3, crest: ROAD, bank: 1.0, role: 'road' }),
		dike('ROAD_N', 'The drowned road across the Procession Mere (under water)', ROAD_N, { width: 3, crest: ROAD, bank: 1.0, role: 'road' }),
		walk('L1', 'Plank lane from the weir', L1, { ramps: 'start' }),
		walk('L2', 'Plank lane through the gable door', L2),
		walk('L3', 'Plank lane west to the roofs', L3),
		walk('L4', 'Plank lane to the night dock', L4),
		walk('L5', 'Plank walk over the east roof to the bell tower', L5A, { asset: null, width: 1.6 }),
		walk('L6', 'Plank spur to the drowned doorway (rite 5)', L6, { width: 1.6 }),
		walk('L7', 'Plank spur into the supper house', L7, { width: 1.6 }),
		isle('WELL', 'The well-head platform (dry stone kerb, the village junction)', [[WELL.x, WELL.z + 1.1], [WELL.x, WELL.z - 1.1]], 4.2, { crest: DIKE, bank: 0.9 }),
		walk('ridgeW', 'Plank walk along the west roof ridge', RIDGE_W, { asset: null, width: 1.4 }),
		...RA.map((r) => walk(r.id, `Raft ${r.id.slice(4)} (A07.5)`, [[...r.a, RAFT], [...r.b, RAFT]], { asset: null, width: 2.4, deck: RAFT })),
		walk('dock', 'The Gentle House night dock (A17.6 deck; the GLB planks are the visible deck)', DOCK_L, { asset: null, width: 2.4, hidden: true }),
	],
	layers: [
		{ id: 'BIO01_peat', tile: 4.5 }, // 0 wet peat: dike crests, island tops (the base)
		{ id: 'DW_mud', tile: 3.2 }, // 1 black mud: banks, shores, the bed under the shallows
		{ id: 'DW_damp', tile: 3.2 }, // 2 damp soil on the crests
		{ id: 'DW_dense', tile: 3.2 }, // 3 rank grass on the island fringes
		{ id: 'DW_sparse', tile: 3.2 }, // 4 thin grass on the dike shoulders
		{ id: 'DW_grass', tile: 3.2 }, // 5 island meadow
		{ id: 'DW_dirt', tile: 3.2 }, // 6 the trodden strip on the dikes, the arena, the rite sites
	],
	paint: [
		// mud everywhere at and below the waterline, a little up the banks (wobbly)
		{ layer: 'DW_mud', kind: 'height', range: [-4, 0.22], soft: 0.9, value: 1, edge: { amp: 0.8, scale: 3 } },
		// damp soil, rank grass, thin grass, meadow on the dry ground
		{ layer: 'DW_damp', kind: 'height', range: [0.12, 0.62], soft: 0.8, value: 0.6, patchy: { scale: 6, cover: 0.55 } },
		{ layer: 'DW_dense', kind: 'height', range: [0.18, 0.44], soft: 0.7, value: 0.8, patchy: { scale: 5, cover: 0.65 } },
		{ layer: 'DW_dense', kind: 'path', paths: ['I1', 'I2', 'I3', 'I4'], extra: -1.2, soft: 1.6, value: 0.5, patchy: { scale: 7, cover: 0.45 } },
		{ layer: 'DW_sparse', kind: 'path', paths: ['D1', 'D2', 'D3', 'D3B', 'D4', 'D4W', 'WILLOW', 'D5', 'WEIR', 'EXIT_N', 'ARCH'], extra: 0.2, soft: 0.8, value: 0.85, patchy: { scale: 4, cover: 0.7 } },
		{ layer: 'DW_grass', kind: 'path', paths: ['I1', 'I2', 'I3', 'I4'], extra: -2.6, soft: 2.2, value: 0.85, edge: { amp: 1.2, scale: 4 }, patchy: { scale: 8, cover: 0.6 } },
		// the trodden strip down the middle of every dike, the arena floor, the rite sites
		{ layer: 'DW_dirt', kind: 'path', paths: ['D1', 'D2', 'D3', 'D3B', 'D4', 'D4W', 'WILLOW', 'D5', 'WEIR', 'EXIT_N', 'ARCH'], extra: -0.75, soft: 0.8, value: 0.9, edge: { amp: 0.35, scale: 2.2 } },
		{ layer: 'DW_dirt', kind: 'area', area: { ellipse: [-50, 60, 11, 7, -28] }, soft: 2.2, value: 0.7, patchy: { scale: 3, cover: 0.7 }, edge: { amp: 1.2, scale: 3 } },
		{ layer: 'DW_dirt', kind: 'points', points: [[RING.x, RING.z, 2.2], [-29, 41, 1.6], [-17, 66.5, 1.6]], soft: 1.2, value: 0.75 },
		{ layer: 'DW_dirt', kind: 'path', paths: ['FORD'], extra: 0.3, soft: 0.8, value: 0.8 },
		// wetness: night dew everywhere, the shores and the shallows wet
		{ layer: 'wet', kind: 'fill', value: 0.45 },
		{ layer: 'wet', kind: 'height', range: [-4, 0.3], soft: 0.9, value: 1 },
	],
	assets: DEFS,
	structures: [
		// the arch and the stone island (rite 1)
		{ asset: 'A17.1', x: ARCH.x, z: ARCH.z, yaw: ARCH.yaw, name: 'The leaning stones (the act\'s arch)', label: 'A17.1 The leaning stones' },
		...RING_STONES,
		{ asset: 'N-FN04', x: RING.x, z: RING.z, yaw: 20, name: 'Cairn in the lichen ring (rite 1)' },
		{ asset: 'glb:dungeon-prop-candle-cluster', x: RING.x + 1.1, z: RING.z + 0.9, yaw: 30, name: 'Candles on the cairn (out)' },
		...MARKER_STONES,
		...LURES,
		// the broken bridge, the ford, rite 2 (the eel-catcher's punt)
		{ asset: 'A06.6', x: -10.2, z: 25.4, yaw: along(-14, 5.3), name: 'Broken bridge pier (east)' },
		{ asset: 'A06.6', x: -15.0, z: 27.2, yaw: along(-14, 5.3) + 180, name: 'Broken bridge pier (west)' },
		// the two fords: seven river-stone tiles each along the ford (local z), a little jitter across it, sunk 0.12 m
		...[[-7.5, 34.5, face(-8, 1)], [-15.5, 35.25, face(-8, 0.5)]].flatMap(([x, z, yaw], f) => [-3, -2, -1, 0, 1, 2, 3].map((k) => {
			const [sx, , sz] = local({ x, z, yaw }, [(((k * 37 + f * 11) % 5) - 2) * 0.12, 0, k * 0.98]);
			return { asset: 'A06.3', x: sx, z: sz, yaw: yaw + k * 53 + f * 20, dy: -0.12, name: 'Stepping-stone ford (river stones)' };
		})),
		{ asset: 'A06.5', x: -7.6, z: 21.3, yaw: 25, y: 'water', dy: -0.3, name: 'Half-sunk punt (rite 2, tied to the abutment)' },
		{ asset: 'A01.6', x: -3.2, z: 19.6, yaw: face(-1, 1.6) + 90, name: 'Eel-trap rack (rite 2)' },
		{ asset: 'N-FN05', x: 0.6, z: 20.8, yaw: face(-1, 1.6), name: 'Drying eel net (rite 2)' },
		// rite 3 (the lure post) is LURES[0]; rite 4 (the bog grave) on its islet; the arena dressing
		{ asset: 'N-FN03', x: -16.6, z: 66.4, yaw: 30, name: 'Bog grave (rite 4)' },
		{ asset: 'A03.5', x: -14.2, z: 63.4, yaw: 120, name: 'Peat bank chunk (rite 4)' },
		{ asset: 'A03.5', x: -13.6, z: 69.6, yaw: 70, scale: 0.85, name: 'Peat bank chunk' },
		{ asset: 'A04.6', x: -13.8, z: 73.2, yaw: 40, name: 'Exposed willow roots' },
		{ asset: 'N-FN08', x: -55.5, z: 66.5, yaw: 20, name: 'Empty wicker cradle (arena)' },
		{ asset: 'N-FN08', x: -47.2, z: 64.8, yaw: -70, scale: 0.9, name: 'Empty wicker cradle (arena)' },
		// the crossing: shoes (unmarked vignette), the procession
		{ asset: 'N-FN02', x: -2.6, z: -2.7, yaw: face(-0.87, -0.49), name: 'Shoes left at the water\'s edge (unmarked)' },
		...PROCESSION,
		// trees, trunks, rocks, punts, stumps of the fens (islands, banks, and dead trees standing in the black water)
		...[[78, 38.5, 1.15], [66, 22.5, 1.0], [8, 13, 1.2], [20, -1.5, 1.05], [-60, 69.5, 1.25], [-40, 64.5, 1.1], [-14.5, 61, 1.0]].map(([x, z, sc], i) => ({ asset: 'A04.1', x, z, yaw: i * 50, scale: sc, name: 'Old weeping willow' })),
		...[[-17.2, 76.5], [-25.5, 83.5], [-17.5, 57]].map(([x, z], i) => ({ asset: 'A04.2', x, z, yaw: i * 70, scale: 0.9 + i * 0.08, name: 'Young willow (toward the Willow Mere)' })),
		...[[96, 36], [104, 55], [116, 43], [82, 46], [60, 33], [48, 11], [34, 24], [28, 2], [-12, 12], [6, 28], [-30, 30], [-14, 46], [-36, 36], [-62, 52], [-66, 72], [-40, 74], [-30, 60], [-52, 30], [-34, 18], [-12, 58]]
			.map(([x, z], i) => ({ asset: 'A04.3', x, z, yaw: i * 37, scale: 0.85 + ((i * 13) % 5) * 0.07, name: 'Dead angular tree' })),
		...[[86, 30, 15], [70, 37, -20], [16, 12, 60], [-56, 57, 30], [-35, 55, 100]].map(([x, z, yaw]) => ({ asset: 'A04.5', x, z, yaw, name: 'Fallen hollow trunk' })),
		...[[80, 27.5], [64, 30.5], [18, 9], [6, -1], [-50, 52], [-44, 66], [-62, 61]].map(([x, z], i) => ({ asset: 'A03.4', x, z, yaw: i * 61, scale: +((0.8 + (i % 3) * 0.15) * 0.8).toFixed(3), name: 'Large moss rock' })),
		...[[88, 31.5], [58, 26.8], [26, 9.8], [1.5, -0.5], [-36.2, 61.5], [-62.6, 58.8], [-12.4, 67.5]].map(([x, z], i) => ({ asset: 'A03.5', x, z, yaw: i * 47 + 10, scale: 0.8 + (i % 2) * 0.2, name: 'Peat bank chunk' })),
		...[[59.5, 19], [-38, 71], [-62, 31], [28.5, 24]].map(([x, z], i) => ({ asset: 'A06.5', x, z, yaw: i * 75 + 15, y: 'water', dy: -0.32, name: 'Half-sunk punt' })),
		...[[90, 26.6], [70, 24], [6, 15.5], [-58, 70], [-41, 51], [-14, 71.5], [24, 4]].map(([x, z], i) => ({ asset: 'A03.6', x, z, yaw: i * 53, scale: 0.85 + (i % 3) * 0.12, name: 'Waterlogged root stump' })),
		...[[83.5, 29], [62.5, 23.8], [21.5, 15.5], [2, 6.5], [-46.5, 50.5], [-60.5, 64.5], [-17, 61.8], [-4.2, 31.2], [-22.2, 37.8]].map(([x, z], i) => ({ asset: 'glb:biome-prop-riverbank-stones', x, z, yaw: i * 83, scale: 0.9 + (i % 3) * 0.15 })),
		...[[75.5, 35.6], [12, 1.2], [-52, 66.5], [-16, 63]].map(([x, z], i) => ({ asset: 'glb:biome-prop-stump', x, z, yaw: i * 71 })),
		...[[76.2, 35.2], [11.4, 1.8], [-51.4, 67], [-46, 62.2], [-16.8, 68.6]].map(([x, z], i) => ({ asset: 'glb:biome-prop-mushrooms', x, z, yaw: i * 40 })),
		// Rook's Weir: the weir's broken west end, cottages, roofs, gable walls, rafts, roost poles, the tower, the supper house, the dock and the boat
		{ asset: 'A07.2', x: -97.5, z: 25.6, yaw: 4, y: BED, dy: 0.2, name: 'Weir segment (broken off)' },
		{ asset: 'A07.2', x: -103.2, z: 26.4, yaw: -10, y: BED, dy: 0.2, name: 'Weir segment (broken off)' },
		...[[-63.5, 13, -90], [-63, -1, -90], [-80.5, -3, 90], [-81.5, -17, 90], [-88, -40, 0], [-92.5, -50, 35], [-113, -38, -60], [-61, -40.5, 0], [-90, 14, 0]].map(([x, z, yaw], i) => ({ asset: 'A07.1', x, z, yaw, y: -1.2, name: i === 8 ? 'Half-drowned cottage (next to the supper house)' : 'Half-drowned flint cottage' })),
		{ asset: 'A07.4', x: -91, z: -28, yaw: 0, y: RIDGE - 0.05 - 2.5, name: 'Sunken roof ridge (west, walked)' },
		{ asset: 'A07.4', x: -66.5, z: -29, yaw: along(6, -1.6), y: RIDGE - 0.05 - 2.5, name: 'Sunken roof ridge (east, walked)' },
		{ asset: 'A07.4', x: -112, z: -20, yaw: 30, y: -1.5, name: 'Sunken roof ridge' },
		{ asset: 'A07.4', x: -57.5, z: 9, yaw: -20, y: -1.5, name: 'Sunken roof ridge' },
		{ asset: 'A07.3', x: -72.5, z: -12, yaw: 0, y: -0.5, name: 'Gable wall with door arch (the lane passes through)', label: 'A07.3 Gable wall · the lane door' },
		{ asset: 'A07.3', x: -60.6, z: -20.2, yaw: 90, y: -0.5, name: 'Gable wall with door arch (the drowned doorway, rite 5)' },
		{ asset: 'A07.3', x: -79.8, z: 12.2, yaw: 90, y: -0.5, name: 'Supper house, east gable (its doorway)' },
		{ asset: 'A07.3', x: -85, z: 12.2, yaw: 90, y: -0.5, name: 'Supper house, west gable' },
		{ asset: 'A17.5', x: -82.4, z: 9.9, yaw: 0, y: -0.85, name: 'Flooded window with lace curtains (supper house)' },
		{ asset: 'A17.4', x: -82.4, z: 12.5, yaw: 0, y: -1.08, name: 'Supper table laid under the water' },
		{ asset: 'A01.5', x: WELL.x, z: WELL.z - 3.0, yaw: 0, y: DIKE - 0.1, name: 'The drowned village well (its kerb above the flood)', label: 'A01.5 Village well' },
		...RA.map((r) => ({ asset: 'A07.5', x: r.x, z: r.z, yaw: r.yaw, y: RAFT - 0.72, name: `Pontoon raft (${r.id})` })),
		...ROOSTS.map((r) => ({ asset: 'A07.6', ...r, name: 'Rook roost (dead tree)' })),
		{ asset: 'A17.2', ...TOWER, name: 'The drowned bell tower', label: 'A17.2 Drowned bell tower' },
		{ asset: 'glb:dungeon-prop-fallen-bell', x: -57.6, z: -36.2, yaw: 40, y: -0.55, name: 'The drowned bell' },
		{ asset: 'A17.6', x: DOCK.x, z: DOCK.z, yaw: DOCK.yaw, y: DOCK.y, name: 'The Gentle House night dock', label: 'A17.6 Gentle House night dock' },
		{ asset: 'A17.3', x: BOAT.x, z: BOAT.z, yaw: BOAT.yaw, y: BOAT.y, name: 'The Gentle House boat (linen canopy, still lamp)', label: 'A17.3 Gentle House boat' },
		{ asset: 'N-FN06', x: TOLL[0], z: TOLL[2], yaw: DOCK.yaw + 90, y: 'deck', name: "The ferryman's toll post" },
		{ asset: 'glb:dungeon-prop-candle-cluster', x: -62.1, z: -19.7, yaw: 10, y: 'deck', name: 'Candles at the drowned doorway (out, rite 5)' },
		// rooks on the roost poles (they circle until the Count is done)
		...[...ROOSTS.map((r, i) => [r, i % 2]), [TOWER, -1], [ROOSTS[0], 1]].map(([r, t], i) => {
			const [x, y, z] = t < 0 ? local(r, TOWER_NEST) : local(r, ROOST_TIPS[t].map((v) => v * r.scale)); // on a branch tip of the roost tree / the tower's nest
			return { asset: 'N-FN07', x, z, yaw: i * 70, y, name: 'Rook' };
		}),
	],
	runs: [
		{ asset: 'A06.1', points: REVET(D1, -1, 0, 5), y: 'min', parapet: 0.2, gaps: [[107, 49.6, 2]], tag: 'revetment' },
		{ asset: 'A06.1', points: REVET(D2, -1, 0, 3), y: 'min', parapet: 0.2, tag: 'revetment' },
		{ asset: 'A06.1', points: REVET(D2, -1, 3, 5), y: 'min', parapet: 0.2, tag: 'revetment' },
		{ asset: 'A06.1', points: REVET(D4, 1, 1, 5), y: 'min', parapet: 0.2, tag: 'revetment' },
		{ asset: 'A07.2', points: shift(WEIR, 1.95), y: 'min', parapet: 0.45, gaps: [[-44.2, 27.1, 3.2]], tag: 'weir' }, // open where the dike from the arena climbs onto the weir
	],
	scatters: [
		{ asset: 'A03.1', count: 520, area: { rect: [-128, -96, 128, 96] }, spacing: 1.1, clear: { paths: 0.9, structures: 0.4, decks: 0.8 }, height: [0.28, 1.2], scale: [0.7, 1.25], seed: 31 },
		{ asset: 'A03.2', count: 700, area: { rect: [-128, -96, 128, 96] }, spacing: 0.8, height: [-1.2, 0.12], clear: { decks: 0.8, structures: 0.2 }, scale: [1.0, 1.55], seed: 41, tag: 'reed fringe' },
		{ asset: 'A03.2', count: 900, area: { rect: [-128, -96, 128, 96] }, spacing: 0.85, height: [-0.62, -0.38], clear: { decks: 1.5 }, scale: [1.05, 1.6], seed: 43, tag: 'reed shoals' },
		{ asset: 'A03.3', count: 185, area: { rect: [-128, -96, 128, 96] }, spacing: 0.9, height: [0.05, 0.42], clear: { paths: 1.1, decks: 0.6, structures: 0.3 }, scale: [0.7, 1.2], seed: 47 },
	],
	lights: [
		// no human light in the Night Fens (the brief: the only warm point is the far window). Corpse-candles (W05) are lures: still, even, beautiful (light grammar
		// of a lie); the dock lamp and the boat lamp are Mercy's (Perfection): still white. ≤ 8 real point lights.
		{ id: 'cc1', kind: 'perfection', label: 'Corpse-candle (W05) over the lure posts — still', x: -31.5, z: 39, yAbs: 1.0, color: '#cfe2f0', intensity: 3.2, range: 7, flicker: 0, real: true, glow: 0.75, flag: 'lures' },
		{ id: 'cc2', kind: 'perfection', label: 'Corpse-candle off the stone island', x: 77, z: 20.5, yAbs: 1.1, color: '#cfe2f0', intensity: 3.0, range: 7, flicker: 0, real: true, glow: 0.7, flag: 'lures' },
		{ id: 'cc3', kind: 'perfection', label: 'Corpse-candle on the Procession Mere', x: -8, z: -20, yAbs: 0.95, color: '#cfe2f0', intensity: 3.0, range: 7, flicker: 0, real: true, glow: 0.7, flag: 'lures' },
		{ id: 'cc4', kind: 'perfection', label: "Corpse-candle in Rook's Weir (the drowned lane)", x: -66, z: -13, yAbs: 1.0, color: '#cfe2f0', intensity: 2.8, range: 7, flicker: 0, real: true, glow: 0.7, flag: 'lures' },
		{ id: 'dockLamp', kind: 'perfection', label: 'The night dock lamp (still white, Mercy)', x: DOCK_LAMP[0], z: DOCK_LAMP[2], yAbs: DOCK_LAMP[1], color: '#eef0ea', intensity: 9, range: 13, flicker: 0, real: true, glow: 1.1, flag: 'dockLamp' },
		{ id: 'boatLamp', kind: 'perfection', label: 'The boat lamp (still white)', x: BOAT_LAMP[0], z: BOAT_LAMP[2], yAbs: BOAT_LAMP[1], color: '#eef0ea', intensity: 0, range: 0, flicker: 0, real: false, glow: 0.95, flag: 'dockLamp' },
		...[[-36, 53], [40, 30], [-12, 45], [100, 30], [-88, 6], [8, -30], [52, 4], [-28, -10], [-114, -64], [-40, 32]].map(([x, z], i) => ({ id: `ccg${i + 1}`, kind: 'perfection', label: 'Corpse-candle (glow only)', x, z, yAbs: 0.8 + (i % 3) * 0.25, color: '#cfe2f0', intensity: 0, range: 0, flicker: 0, real: false, glow: 0.55 + (i % 2) * 0.15, flag: 'lures' })),
		{ id: 'gentleHouse', kind: 'perfection', label: 'The Gentle House window (still, far — the only warm point)', anchor: 'N-GH', x: GH.x, z: GH.z, far: true, y: 9.2, color: '#f6b468', intensity: 0, range: 0, flicker: 0, real: false, glow: 5.5, flag: 'gentleHouse' },
	],
	markers: [
		// encounters (Night Fens: P01, W03, W04 at the water edges, W05, U05, B02; Rook's Weir: U01 Mire tier, U05, W05)
		{ kind: 'encounter', id: 'E1', x: 79, z: 26.5, r: 5, segment: 'stones', label: 'E1 · W04 ×4 (bờ nước)', monsters: [{ id: 'W04', count: 4, standIn: 'bat' }], note: 'Mire-Suckers come off the water onto the stone island' },
		{ kind: 'encounter', id: 'E2', x: 53, z: 22.6, r: 4, segment: 'arch', label: 'E2 · U05 ×2', monsters: [{ id: 'U05', count: 2, standIn: 'zombie' }], note: 'the Swollen block the dike before the arch' },
		{ kind: 'encounter', id: 'E3', x: 12, z: 5.5, r: 7, segment: 'crossing', label: 'E3 · P01 ×5 (nghe, thấy, rồi đánh)', monsters: [{ id: 'P01', count: 5, standIn: 'zombie' }], note: 'the Soothed cross the island humming; they are victims' },
		{ kind: 'encounter', id: 'E4', x: -24, z: 37.6, r: 4, segment: 'ford', label: 'E4 · W03 ×3', monsters: [{ id: 'W03', count: 3, standIn: 'spider' }], note: 'Hush-Wolves wait at the west end of the ford' },
		{ kind: 'encounter', id: 'E5', x: -31.5, z: 44.5, r: 4, segment: 'ford', label: 'E5 · W05 ×3 + U05 ×1', monsters: [{ id: 'W05', count: 3, standIn: 'wraith' }, { id: 'U05', count: 1, standIn: 'zombie' }], note: 'corpse-candles over the lure posts' },
		{ kind: 'encounter', id: 'E6', x: -50, z: 60.5, r: 9, segment: 'arena', label: 'E6 · B02 Lullaby Man + P01 ×3', monsters: [{ id: 'B02', count: 1, standIn: 'brute', single: true }, { id: 'P01', count: 3, standIn: 'zombie' }], note: 'mid-boss; never hit the cradle-cage on his back' },
		{ kind: 'encounter', id: 'E7', x: -21, z: 64, r: 4, segment: 'willow', label: 'E7 · W04 ×3', monsters: [{ id: 'W04', count: 3, standIn: 'bat' }], note: 'on the side dike to the Willow Mere' },
		{ kind: 'encounter', id: 'E8', x: -60, z: 24, r: 5, segment: 'weir', label: 'E8 · U01 ×3 (Mire-Shambler)', monsters: [{ id: 'U01', count: 3, standIn: 'zombie' }], note: 'on the weir crest' },
		{ kind: 'encounter', id: 'E9', x: -72.5, z: -9, r: 3, segment: 'village', label: 'E9 · W05 ×2', monsters: [{ id: 'W05', count: 2, standIn: 'wraith' }], note: 'over the drowned lane by the gable door' },
		{ kind: 'encounter', id: 'E10', x: -98.4, z: -29.4, r: 2.5, segment: 'dock', label: 'E10 · U05 ×1', monsters: [{ id: 'U05', count: 1, standIn: 'zombie' }], note: 'on the west raft' },
		// rite sites (The Count of the Sleepers: each a different small scene)
		{ kind: 'rite', id: 'R1', x: RING.x, z: RING.z, segment: 'stones', label: 'Rite 1 · vòng đá địa y', note: 'five lichen stones round a cairn; the candles are out' },
		{ kind: 'rite', id: 'R2', x: -4.6, z: 20.5, segment: 'crossing', label: 'Rite 2 · thuyền chìm người bắt lươn', note: 'the broken bridge: a half-sunk punt, eel traps, a net' },
		{ kind: 'rite', id: 'R3', x: LURES[0].x, z: LURES[0].z, segment: 'ford', label: 'Rite 3 · cột đèn mồi', note: 'the one who followed the light: an empty cage, a corpse-candle beyond' },
		{ kind: 'rite', id: 'R4', x: -16.6, z: 66.4, segment: 'willow', label: 'Rite 4 · mộ than bùn dưới liễu', note: 'a bog grave with a willow stake and ribbons' },
		{ kind: 'rite', id: 'R5', x: -62.4, z: -20.2, y: PLANK, segment: 'village', label: 'Rite 5 · ô cửa nhà chìm', note: 'a doorway standing alone in the water at the end of a plank' },
		// lullaby sources (no quest marker: the route is followed by ear)
		{ kind: 'sound', id: 'RU1', x: 86, z: 37, r: 22, segment: 'fenroad', label: 'Tiếng ru 1 · rất khẽ, vọng từ tây', note: 'first heard from the dike road' },
		{ kind: 'sound', id: 'RU2', x: ARCH.x, z: ARCH.z, r: 20, segment: 'arch', label: 'Tiếng ru 2 · qua vòm đá', note: 'the hum seems to come through the arch' },
		{ kind: 'sound', id: 'RU3', x: -2, z: -4, r: 24, segment: 'crossing', label: 'Tiếng ru 3 · đoàn người ngân nga', note: 'the Soothed humming, then the window across the water' },
		{ kind: 'sound', id: 'RU4', x: -11.5, z: 35, r: 18, segment: 'ford', label: 'Tiếng ru 4 · bên kia chỗ lội', note: 'across the ford, among the lure posts' },
		{ kind: 'sound', id: 'RU5', x: -50, z: 60, r: 26, segment: 'arena', label: 'Tiếng ru 5 · Lullaby Man (to nhất)', note: 'heard before he is seen' },
		{ kind: 'sound', id: 'RU6', x: -72.5, z: -12, y: PLANK, r: 22, segment: 'village', label: 'Tiếng ru 6 · qua ô cửa, từ bến', note: 'through the gable door, from the dock' },
		{ kind: 'sound', id: 'RU7', x: DOCK.x, z: DOCK.z, y: PLANK, r: 24, segment: 'dock', label: 'Tiếng ru 7 · bến đêm, thuyền chờ', note: 'the sleepers waiting at the boat; the window beyond' },
		// landmarks and sightlines
		{ kind: 'landmark', id: 'L1', x: ARCH.x, z: ARCH.z, label: 'Vòm đá nghiêng (vòm của Act I)' },
		{ kind: 'landmark', id: 'L2', x: -53, z: -38, label: 'Tháp chuông chìm (Rook\'s Weir)' },
		{ kind: 'landmark', id: 'L3', x: DOCK.x, z: DOCK.z, y: PLANK, label: 'Đèn bến đêm (trắng, đứng yên)' },
		{ kind: 'sightline', id: 'S1', from: [-1, -1.5, 1.7], target: 'far:N-GH', label: 'Bến lội → cửa sổ Gentle House qua nước đen' },
		{ kind: 'sightline', id: 'S2', from: [-106, -60.6, 1.7], target: 'far:N-GH', label: 'Bến đêm → cửa sổ Gentle House' },
		{ kind: 'sightline', id: 'S3', from: [110, 48.2, 1.7], target: [ARCH.x, 0, ARCH.z], targetLift: 4.2, label: 'Đê vào → vòm đá nghiêng' },
		{ kind: 'sightline', id: 'S4', from: [-48, 52, 1.7], target: [-53, 0, -38], targetLift: 9, label: 'Đảo Lullaby Man → tháp chuông chìm' },
		// vignettes (one unmarked) and the two Remember beats
		{ kind: 'vignette', id: 'V1', x: -2.6, z: -2.7, unmarked: true, segment: 'crossing', label: 'Đôi giày để ngay ngắn bên mép nước (không đánh dấu)' },
		{ kind: 'vignette', id: 'V2', x: 1, z: -0.5, remember: true, segment: 'crossing', label: 'REMEMBER (Night Fens): hàng người áo ngủ trắng lội nước đen về cửa sổ ấm' },
		{ kind: 'vignette', id: 'V3', x: -82.4, z: 12.5, y: 0.2, segment: 'weir', label: 'Bàn ăn bày sẵn dưới nước (A17.4)' },
		{ kind: 'vignette', id: 'V4', x: -82.4, z: 10.4, y: 0.6, segment: 'weir', label: 'Rèm ren trôi trong phòng ngập (A17.5)' },
		{ kind: 'vignette', id: 'V5', x: FERRYMAN[0], z: FERRYMAN[2], y: 0.4, remember: true, segment: 'dock', label: "REMEMBER (Rook's Weir): lái đò chết chống thuyền mái lanh, xin thêm một đồng" },
		{ kind: 'vignette', id: 'V6', x: -57.6, z: -36.2, y: 0.2, segment: 'village', label: 'Chuông chìm dưới tháp' },
		{ kind: 'vignette', id: 'V7', x: -51.5, z: 66, segment: 'arena', label: 'Nôi mây rỗng trên đảo Lullaby Man' },
		// NPC spot and exits
		{ kind: 'npc', id: 'ferryman', x: FERRYMAN[0], z: FERRYMAN[2], y: FERRYMAN[1], label: "Lái đò chết (The Ferryman's Toll)", segment: 'dock' },
		{ kind: 'exit', id: 'X0', x: 125, z: 50, label: '← Lychgate (đê về làng)', to: 'lychgate' },
		{ kind: 'exit', id: 'X1', x: -29.6, z: 93, label: '→ The Willow Mere (11.7)', to: 'willowMere' },
		{ kind: 'exit', id: 'X2', x: -118.6, z: -93, label: '→ The Poppy Reach (11.6)', to: 'poppyReach' },
	],
	segments: [
		{ id: 'fenroad', kind: 'wild', label: 'Đê vào từ Lychgate', spawn: [112, 48.8], view: 'fenroad', route: [[112, 48.8], [100, 44], [88, 38], [78, 33], [72, 30.4], [66, 28], [58, 24.6]] },
		{ id: 'stones', kind: 'wild', label: 'Đảo đá địa y (Rite 1)', spawn: [70, 29.6], view: 'stones', route: [[70, 29.6], [79, 26.5], [84, 35.5], [66, 28], [58, 24.6], [50, 21.5]] },
		{ id: 'arch', kind: 'wild', label: 'Vòm đá nghiêng (landmark)', spawn: [52, 22.2], view: 'arch', route: [[52, 22.2], [46, 20.1], [42, 18.7], [37, 16.9], [28, 13.8], [16, 6.2], [8, 3]] },
		{ id: 'crossing', kind: 'wild', label: 'Đảo bến lội (đoàn người ngủ)', spawn: [12, 5.5], view: 'crossing', route: [[12, 5.5], [2, 1], [-1.5, -1.5], [4, 4], [2, 10], [-1, 16], [-5, 22.8], [-1, 16.5], [-1.4, 25], [-3, 33.5]] },
		{ id: 'ford', kind: 'wild', label: 'Cầu gãy + chỗ lội + cột đèn mồi', spawn: [-2, 29], view: 'ford', route: [[-2, 29], [-3, 33.5], [-11.5, 35], [-19.5, 35.5], [-26, 38.5], [-31, 43], [-35, 47.5], [-26, 38.5], [-22.5, 33.5], [-20, 29.6]] },
		{ id: 'willow', kind: 'wild', label: 'Đê nhánh ra Willow Mere (Rite 4)', spawn: [-21, 60], view: 'willow', route: [[-26, 39], [-22, 50], [-21, 60], [-16.6, 64.6], [-20.6, 66], [-21.5, 70], [-24, 78], [-28, 88], [-29.6, 93]] },
		{ id: 'arena', kind: 'wild', label: 'Đảo Lullaby Man (mid-boss)', spawn: [-44, 54], view: 'arena', route: [[-38, 50.5], [-44, 54], [-54, 62], [-62, 66], [-50, 59], [-46, 47], [-45.5, 36], [-44, 27.5], [-56, 24.1]] },
		{ id: 'weir', kind: 'wild', label: "Đập Rook's Weir", spawn: [-58, 24.2], view: 'weir', route: [[-44, 27.5], [-58, 24.2], [-70, 23.6], [-70.6, 12], [-79, 12.2], [-70.6, 12], [-71.6, 3], [-72, 0.8], [-72.4, -6], [-72.5, -12], [-72.5, -18]] },
		{ id: 'village', kind: 'wild', label: "Làng chìm · mái nhà, ô cửa", spawn: [WELL.x, WELL.z + 0.4], view: 'village', route: [[-72.5, -12], [-72.5, -19.6], [-66.5, -20], [-62.6, -20.2], [-72.5, -20], [WELL.x, WELL.z], [-80, -27.6], [-85.6, -28], [-91, -28], [-96.4, -28.4], [-98.4, -29.4], [-80, -27.6], [WELL.x, WELL.z], [-69.4, -28.2], [-66.5, -29], [-60.6, -30.8], [-58.5, -31.6]] },
		{ id: 'dock', kind: 'wild', label: 'Bến đêm Gentle House (xuất phát trên đê bắc) + đường ra Poppy Reach', spawn: [-109, -48], view: 'dock', route: [[-98.4, -29.4], [-100.6, -40], [-102.2, -49], [-103.6, -54.6], [-106, -60.6], [-103.6, -54.6], [-102.2, -49], [-101.2, -44], [-110, -48.5], [-117, -60], [-120, -78], [-118.6, -92]] },
	],
	views: {
		overview: { label: 'Toàn cảnh (base map)', target: [0, 0], fit: [256, 192] },
		fenroad: { label: 'Đê vào từ Lychgate', target: [100, 44], dist: 44, pitch: 52 },
		stones: { label: 'Đảo đá địa y (Rite 1)', target: [73, 30], dist: 40, pitch: 50 },
		arch: { label: 'Vòm đá nghiêng trên đê (landmark)', target: [ARCH.x, ARCH.z], dist: 22, pitch: 34, yaw: 20, lift: 1.6 },
		crossing: { label: 'Đảo bến lội · đường chìm', target: [6, 0], dist: 44, pitch: 52 },
		procession: towardWindow('REMEMBER: đoàn người mộng du về cửa sổ ấm', [-0.5, 0.5], ISLE + 2.9),
		ford: { label: 'Cầu gãy · chỗ lội đá', target: [-10, 30], dist: 34, pitch: 50 },
		lures: { label: 'Cột đèn mồi · corpse-candle', target: [-28, 42], dist: 30, pitch: 46 },
		arena: { label: 'Đảo Lullaby Man (mid-boss)', target: [-50, 60], dist: 52, pitch: 54 },
		willow: { label: 'Đê nhánh ra Willow Mere', target: [-20, 70], dist: 40, pitch: 50 },
		weir: { label: "Đập Rook's Weir", target: [-66, 20], dist: 44, pitch: 52 },
		village: { label: 'Làng chìm (lối ván, mái nhà)', target: [-80, -18], dist: 62, pitch: 55 },
		supper: { label: 'Bàn ăn dưới nước · rèm ren', target: [-82.2, 11.8], dist: 14, pitch: 42, yaw: 14, lift: 0.4 },
		tower: { label: 'Tháp chuông chìm', target: [-55, -36], dist: 32, pitch: 36, yaw: 15, lift: 3 },
		dock: { label: 'REMEMBER: bến đêm, thuyền mái lanh, lái đò chết', target: [-105.5, -58], dist: 22, pitch: 38, yaw: 25, lift: 1 },
		dockGentle: towardWindow('Từ bến đêm nhìn Gentle House', [-104.6, -57.2], PLANK + 2.2),
	},
	far: {
		level: LV,
		size: 2400,
		hills: [{ x: GH.x, z: GH.z, r: 115, h: 34 }, { x: 40, z: -460, r: 170, h: 12 }, { x: -500, z: -60, r: 150, h: 16 }, { x: 320, z: 160, r: 150, h: 9 }, { x: -220, z: 380, r: 170, h: 11 }, { x: 420, z: -260, r: 160, h: 10 }],
		items: [{ asset: 'N-GH', x: GH.x, z: GH.z, yaw: face(-GH.x, -GH.z) }],
	},
	defaultMood: 'night',
	moods: {
		night: {
			label: 'Night Fens · đêm', sky: '#3a4a64', ground: '#121816', hemi: 1.35, sun: { elev: 38, az: 150, intensity: 0.55, kelvin: 9500 }, env: 'hdri-night', envI: 0.12,
			toneMapping: 'aces', exposure: 1.7, background: '#070a0e', rainTone: 0.4,
			fog: { enabled: true, color: '#18212a', density: 0.014, falloff: 0.13, height: 0, start: 10, inscatter: 0 },
			grade: { vignette: 0.55, contrast: 1.08, saturation: 0.78, lift: 0, temperature: -0.06, tint: 0 },
			rain: 0, mist: 1.0, stars: 1, human: 1, perfection: 1.15, windows: 0, flags: { gentleHouse: true, lures: true, dockLamp: true, accent: false, graveCandles: false },
		},
		still: {
			label: "Rook's Weir · đêm lặng (ít sương, nước gương)", sky: '#40506a', ground: '#141a18', hemi: 1.3, sun: { elev: 44, az: 170, intensity: 0.7, kelvin: 9000 }, env: 'hdri-night', envI: 0.16,
			toneMapping: 'aces', exposure: 1.6, background: '#080b10', rainTone: 0.4,
			fog: { enabled: true, color: '#1a232c', density: 0.008, falloff: 0.12, height: 0, start: 14, inscatter: 0 },
			grade: { vignette: 0.5, contrast: 1.06, saturation: 0.8, lift: 0, temperature: -0.05, tint: 0 },
			rain: 0, mist: 0.45, stars: 1.25, human: 1, perfection: 1.2, windows: 0, flags: { gentleHouse: true, lures: true, dockLamp: true, accent: false, graveCandles: false },
		},
		lookdev: {
			label: 'Soi texture · sáng đều', sky: '#c9d4e4', ground: '#3b352e', hemi: 2.4, sun: { elev: 50, az: -135, intensity: 1.1, kelvin: 5600 }, env: 'hdri-overcast', envI: 0.25,
			toneMapping: 'aces', exposure: 0.2, background: '#30353a',
			fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 },
			rain: 0, mist: 0, stars: 0, human: 0.5, perfection: 1, windows: 0, flags: { gentleHouse: true, lures: true, dockLamp: true, accent: false, graveCandles: false },
		},
	},
	notes: {
		fens: 'Night Fens (11.4, wild, 35 phút, D4 C3, quest The Count of the Sleepers): đê đất hẹp giữa lau sậy và nước đen — đê, đảo, chỗ lội là đất duy nhất, nước mở không bao giờ đi được (bờ nào cũng hụt sâu). Không có marker: đi theo tiếng ru (overlay "Landmark + tầm nhìn" hiện các nguồn tiếng ru RU1–RU7). Đá dựng địa y, chỗ lội đá, cột đèn mồi không thắp, thuyền chìm nửa, trụ cầu gãy; vòm đá nghiêng trên đê là landmark; đường chìm dưới Procession Mere là lối của the Soothed (áo ngủ trắng) về cửa sổ ấm xa của Gentle House (N-GH) — ánh ấm duy nhất. Corpse-candle đứng yên, đẹp (mồi). Đảo Lullaby Man (B02) là mid-boss; nhánh đê phía nam ra Willow Mere.',
		weir: "Rook's Weir (11.5, wild, 18 phút, D4 C2, nhịp lặng sau mid-boss): làng chìm — chỉ đi trên đập, lối ván, bè và nóc mái (hai mái có lối ván dọc nóc), không bao giờ bơi. Nhà đá lửa ngập nửa, tường hồi có cửa vòm (lối ván xuyên qua một cái), cột tổ quạ, tháp chuông chìm, bàn ăn bày dưới nước và rèm ren trong nhà đổ, bến đêm Gentle House với thuyền mái lanh và đèn trắng đứng yên, lái đò chết (The Ferryman's Toll), đường đê ra Poppy Reach ở góc tây bắc.",
	},
};

export const ASSETS = withCounts(PLAN);

export const MONSTERS = [
	{ id: 'P01', name: 'The Soothed', segment: 'crossing', count: 8, note: 'E3 ×5 on the crossing island (hear, see, then fight: they are victims), E6 ×3 escorting the Lullaby Man · stand-in `zombie` · h 0.90–1.00 H, white nightgown #E8E1D0; the procession figures (N-FN01) are dressing, not camps' },
	{ id: 'W03', name: 'Hush-Wolf', segment: 'ford', count: 3, note: 'E4 at the west end of the ford · stand-in `spider` (fast pack hunter)' },
	{ id: 'W04', name: 'Mire-Sucker', segment: 'stones', count: 7, note: 'E1 ×4 off the stone island, E7 ×3 on the willow dike (water edges) · stand-in `bat` (erratic flier)' },
	{ id: 'W05', name: 'Corpse-Candle', segment: 'ford', count: 5, note: 'E5 ×3 over the lure posts, E9 ×2 in Rook\'s Weir · stand-in `wraith` (mana burn ≈ "drains resources"); their still pale-blue glows (#D8E7EF) are in the light layer' },
	{ id: 'U05', name: 'The Swollen', segment: 'arch', count: 4, note: 'E2 ×2 before the arch, E5 ×1, E10 ×1 on a Rook\'s Weir raft · stand-in `zombie` (slow; kept > 14 m from the P01 camps so the names stay right)' },
	{ id: 'B02', name: 'The Lullaby Man (mid-boss)', segment: 'arena', count: 1, note: 'E6 on his island · stand-in `brute` (unique) · h 2.0–2.4 H with a cradle-cage on his back that must not be hit' },
	{ id: 'U01', name: 'Mire-Shambler (Shambler, Rook\'s Weir tier)', segment: 'weir', count: 3, note: 'E8 on the weir crest · stand-in `zombie`' },
];

export const NPCS = [
	{ name: 'The dead ferryman', segment: 'dock', note: "side quest The Ferryman's Toll: at the stern of the Gentle House boat by the night dock, poling sleepers under the linen canopy, asking for one more coin (Remember)" },
];

export const TEXTURES = [
	{ id: 'BIO01_peat', have: true, note: 'wet peat: dike crests, island tops' },
	{ id: 'DW_mud (darkwood mud)', have: true, note: 'banks, shores, the shallows' },
	{ id: 'DW_damp (darkwood soil-damp)', have: true, note: 'damp crests' },
	{ id: 'DW_dense / DW_sparse / DW_grass (darkwood grass set)', have: true, note: 'rank grass, thin grass, island meadow' },
	{ id: 'DW_dirt (darkwood dirt)', have: true, note: 'the trodden strip on the dikes, the arena, the rite sites' },
	{ id: 'biome-darkwood-water-n', have: true, note: 'ripple normal of the black water' },
	{ id: 'biome-shore-plants · biome-darkwood-grass-cards', have: true, note: 'reed / sedge and grass card atlases' },
	{ id: 'fen shore mud → water (A05 cell 2)', have: false, note: 'concept only; the base uses darkwood mud + the water mesh' },
	{ id: 'peat meadow floor (A05 cell 1)', have: false, note: 'concept only; BIO01_peat stands in' },
	{ id: 'dike crest: flagstones + trodden peat (A06.1 top)', have: false, note: 'the causeway top of the concept; the base paints dirt on peat' },
	{ id: 'reed-bed litter / floating mat at the shores', have: false, note: 'not made' },
	{ id: 'lichen standing stone material', have: false, note: 'blockouts are flat-coloured' },
	{ id: 'knapped flint walls + thatch (drowned cottages, gable walls)', have: false, note: 'shared need with map 1 (A15) — blockouts are flat-coloured' },
	{ id: 'still black water that mirrors the houses', have: false, note: 'the water mesh has a ripple normal + env reflection only; needs planar reflection / SSR and a calm-water preset' },
];

export const VFX = [
	{ id: 'mist lying on the water', have: false, note: 'placeholder: the drifting low sheets + post height fog (mist × mood: 1.0 in the night, 0.45 still)' },
	{ id: 'more stars than usual (cold, still, too even)', have: false, note: 'placeholder: a still star dome in the far frame (mood stars); no twinkle, slightly too regular' },
	{ id: 'corpse-candles (W05 lures)', have: false, note: 'placeholder: 4 still pale-blue point lights + 14 still glows; needs a pale flame with a faint face, slow hover, still light' },
	{ id: 'Gentle House window (still, warm, far)', have: false, note: 'placeholder: a big still glow in the VFX layer on N-GH (the only warm point of the map)' },
	{ id: 'dock lamp + boat lamp (still white, Mercy)', have: false, note: 'placeholder: 1 still white point light + 2 still glows' },
	{ id: 'the Soothed procession (wading, humming)', have: false, note: 'placeholder: 12 still white figure blockouts on the drowned road; needs the walk cycle, wading ripples, the hum' },
	{ id: 'lullaby (sound is the map)', have: false, note: 'markers only (kind sound, RU1–RU7); needs positional audio of the lullaby with the falloff the markers show' },
	{ id: 'rooks circling the roost poles', have: false, note: 'placeholder: the procedural crows circling / settled by the toggle' },
	{ id: 'water ripples / wading rings, frogs falling silent when the Soothed pass', have: false, note: 'not built' },
];

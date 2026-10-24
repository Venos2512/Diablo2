// Seed generator for the Act I hub, Lychgate (LD 11.2, BIO-03): ONE seed → a compact 64 × 64 m plan of the shape of the moor plans
// (planGen.js / DEMO_PLAN): bounds, zones, paths (the route causeway → square → lychgate, plank walkways, lanes), water, doors, interactions,
// masses with the real footprints and heights of the GLBs (lookdev-lab/src/env/act1/maps/lychgate.js asset table), a seeded ground(x, z),
// start, exits, meta (route length, walk / run seconds). The hub is a rest room, not a city (LD §7.3: crossed in ~40 s): safe, no spawns,
// no arenas, no hosts, no events. Layout only: the plan is dressed by layoutBiome (engine) and later built in 3D.
//
//   generateHubPlan(seed, { size = 64, attempt = 0 })     pure and fast (no renderer, no layout); attempt >= familyAttempts draws the fallback gate pair
//   checkHubPlan(plan)                                    hub checks, re-derived from the plan alone
//   generateHubMap(seed, catalog, options)                attempts until every hub check AND every engine check passes
//
// Camera (AD 12 §5.2): looks north-west, forward = (−1, −1) in x/z. Screen top = the north / west edges (back), bottom = the south / east
// edges (front). Tall things stand at the back of what the hero walks to; doors / gates face the front half-plane (normal · (1, 1) > 0).
// Randomness: seeded streams keyed by purpose, hash32(seed, attempt, purpose) — never Math.random or the clock.
import { DEFAULT_OPTIONS, Stream, UNITS, convexHull, hash32, layoutBiome, makeObb, obbSeparation, occlusionPolygon, occlusionWindows, pointInPoly, pointPolySigned, preparePlan, segPolyDistance, shapeGap, toWorld, vnoise, yawFacing } from './biomeLayout.js';
import { smoothPath } from './biomeLayoutDemo.js';
import { PLAN_GEN_RULES, mapBudgets } from './planGen.js';

export const HUB_GEN_VERSION = 'hub-gen/4';

// ---------------------------------------------------------------------------------------------------------------
// Rules: every number with its source. "LD" = ashlar/LEVEL_DESIGN (§7.3 hubs are crossed in ~40 s, §11.2 Lychgate), "BIO-03" =
// ashlar/docs/ASHLAR_BIOME_VA_KHU_VUC_VI.md §2.1 + BIO-03, "assets" = the A()/DEFS table of src/env/act1/maps/lychgate.js, "controller" =
// src/character/controller.js, "AD12" = legacy/art-direction/12, "spec" = tmp/hub-gen/SPEC.md (user brief 2026-10-23), "tuning" = no source gives a number.

const RULE_TABLE = [
	['size', 64, 'spec: ~64 × 64 m (the user: the hub is too big; today 216 × 160 m); LD §7.3: crossed in ~40 s'],
	['walkSpeed', 1.6, 'controller: CONTROLLER walkSpeed 1.6 m/s'], ['runSpeed', 4.0, 'controller: runSpeed 4.0 m/s'],
	['routeRange', [50, 80], 'spec: main route causeway → square → lychgate 50–80 m (≈ 31–50 s walking, 13–20 s running)'],
	['squareFromCauseway', 25, 'spec: the square is ≤ 25 m from the causeway end'],
	['npcFromRoute', 12, 'spec: every NPC point ≤ 12 m off the main route'],
	['exitFromRoute', 26, 'tuning: the vault door is at most 26 m (a lane) off the main route: the terrace walls need 17 m of the back edge beside the lychgate wall'],
	['cottages', [5, 7], 'spec: 5–7 stilt cottages including Edda\'s house'],
	['squareRadius', [5.6, 7.0], 'spec: the square is ~10–14 m across (diameter 11.2–14.0 m standing area; the rim items stand outside it)'],
	['squareWell', 3.0, 'tuning: the well stands ≤ 3.0 m off the square centre (spec: "near its centre")'],
	['routeWidth', 3.0, 'tuning: the route is 3.0 m (AD12 §4.3 main path ≥ 3 Sub = 1.4 m; the causeway deck A06.1 is 1.71 m deep, two abreast on the square)'],
	['walkwayWidth', 1.8, 'assets: A01.2 deck 1.75 m wide (width 1.99 incl. rail)'], ['laneWidth', 1.6, 'tuning: a lane between the route and a door (AD12 §4.3 trail 1.4 m)'],
	['causewayLength', [12, 15], 'tuning: the black water in front of the island is crossed by 4–5 A06.1 segments (module 3.0 m, assets)'],
	['causewayModule', 3.0, 'assets: A06.1 module 3.0 m'], ['walkwayModule', 4.0, 'assets: A01.2 segment length 4.0 m'],
	['frontWater', [12, 15], 'tuning: the water between the entrance edge and the island (the causeway crosses it)'],
	['sideWater', [7, 11], 'tuning: black fen water on the other front edge (BIO-03: the island sits in the fen)'], ['backWaterChance', 0.5, 'tuning: the other back edge is water in half of the maps (water on 2–3 sides)'],
	['backWater', [6.5, 9.5], 'tuning: no source gives a number'], ['cornerRadius', [7, 11], 'tuning: rounded island corners'], ['shoreNoise', 2.2, 'tuning: shoreline wobble amplitude (m)'],
	['edgeInset', 1.0, 'tuning: the causeway / lychgate exits sit 1 m inside the edge (planGen endInset 2; exit tolerance 3)'],
	['waterClear', 1.2, 'AD12 §4.4 clear water edge (planGen waterClearSolid 2.5 on 128 m; 1.2 on a 64 m island)'],
	['gap', 1.2, 'tuning: gap between two masses (engine passGap 0.94 m = 2 Sub; authored pairs are exempt, the hero still has to pass)'],
	['routeClear', 0.7, 'tuning: a mass keeps 0.7 m off the route corridor edge (engine pathClear 0.3)'], ['laneClear', 0.6, 'tuning: no source gives a number'],
	['frontCheck', PLAN_GEN_RULES.frontCheck, 'planGen frontCheck: cos of the door normal vs south-east ≥ 0.2 (normal · (1, 1) ≥ 0.283)'],
	['tallMin', 2.0, 'tuning: a mass ≥ 2.0 m casts a camera shadow that is kept off the route, doors and NPC points (engine tallMin 0.9 = 0.5 H)'],
	['shadowSlope', 1 / Math.tan(UNITS.CAMERA.pitch), 'AD12 §5.2 / engine: the shadow of a mass of height h is the footprint swept h / tan(30°) along the camera forward'],
	['npcRadius', 1.5, 'tuning: NPC interaction circle'], ['doorCottage', { width: 1.4, depth: 2.6 }, 'engine doorSize.door (AD12 §5.1: door ≥ 2 Sub)'], ['doorWide', { width: 3.0, depth: 3.0 }, 'engine doorSize.entrance'],
	['wallModule', 3.4, 'assets: A01.3 flint wall 3.4 m module'], ['wallEnds', [2, 3], 'tuning: 2–3 wall modules each side of the lychgate'],
	['vaultRunScale', 1.55, 'assets: N02 runs stand ×1.55 (6.2 m modules, 3.35 m tall)'],
	['fenceRuns', [2, 4], 'tuning: willow hurdle fence modules (A01.4 3.2 m) as yard edges'],
	['rackScale', 0.85, 'assets: A01.6 eel-trap rack is placed ×0.85'],
	['agent', 0.35, 'engine agentRadius 0.35'], ['slopeMax', 0.55, 'planGen slopeMax 0.55'],
	// ---- v2: the walled hub (tmp/hub-gen/SPEC-v2.md, user brief 2026-10-23)
	['wallRing', [40, 48], 'spec v2: one wall ring of about 40–48 m per side (centreline bounding box; the card of the user measured ≈ 45 × 45 m)'],
	['wallClear', 2.5, 'spec v2: ≥ 2.5 m walkable gap between every building (every solid mass ≥ 2 m tall) and the wall'],
	['wallClearLow', 1.0, 'tuning: low solid dressing (barrels, peat stacks, goods, fences, bones, the rack) keeps ≥ 1.0 m from the wall (the 0.7 m agent passes); walk-through decor may touch it'],
	['wallStretch', 0.08, 'tuning: a wall module is stretched or squeezed by at most 8 % along its length to close the ring'],
	['wallGap', 0.06, 'tuning: 6 cm between two wall pieces (centres and sizes are rounded to 1 cm, so touching pieces never overlap)'],
	['wallLeak', 0.7, 'engine agentRadius 0.35 × 2: a gap narrower than 0.7 m cannot be passed (the closure test dilates every wall piece by 0.35 m)'],
	['gateOpening', 4.8, 'tuning: clear opening of the main gate; the 3.0 m route plus 0.7 m route clearance on each side'],
	['bank', 0.25, 'tuning (v3, review M1): the land hugs the wall: the footing extends 0.25 m beyond the wall face (< the 0.35 m agent radius, so no hero can stand on it); outside is fen water'],
	['gateApron', [4.1, 1.0], 'tuning (v3, review M1): the only land outside the wall is a small apron at the main gate: half width 4.1 m (the outer edge of the gate piers, 2.4 + 1.6 + 0.1) and 1.0 m beyond the footing line; where the causeway lands'],
	['apronReach', 5.0, 'tuning (v3, review M1): the bypass check ignores dry cells within 5.0 m of the main gate centre (the apron: 4.1 m half width, 1.0 m deep, plus the pier corners)'],
	['hillLane', 2.6, 'tuning: half width of the dry strip from the lychgate to the map edge (the way up to the churchyard)'],
	['squareRadiusWalled', [5.2, 6.3], 'spec v2 + spec v1: the square is ~10–14 m across; inside the ring it stays at the small end (diameter 10.4–12.6 m) to leave room for the buildings'],
	['squareFromGate', 24, 'tuning (v3, n4): the square is at most 24 m from the main gate: measured worst 21.0 m over seeds 1–40 + 3 m (v1 asked 25 m from the causeway end on a 64 m island; v2 allowed 32 m = vacuous in a 45 m ring)'],
	['routeInside', [35, 55], 'spec v2: main gate → square → lychgate 35–55 m (≈ 22–34 s walking at 1.6 m/s, 9–14 s running)'],
	['cottagesWalled', [4, 5], 'spec v2 + user decision (fix r1, m3): compactness first: 4 stilt cottages inside the ring including the house of Edda, and a fifth in ≈ 6 % of the seeds (11 of seeds 1–200; 0 of 1–40) — the 45 m ring with the square, the pond, the vault lane and the post has no room for 6, and rarely for 5'],
	['cottageFive', 0.5, 'tuning (v3, m3): half of the attempts ask for a fifth cottage (the phase retries its rounds for it; four are accepted); the fifth is built in only ≈ 6 % of the accepted maps (the shadow rules leave no room)'],
	['familyAttempts', 60, 'tuning (v4, B2): attempts per layout family. Attempts 0..N−1 use the gate pair drawn for the seed; if none is accepted, attempts N.. use a second seed-only stream that always draws the OPPOSITE gate pair (the cheap family), so no seed is rejected and the same seed always gives the same map; see REPORT-fix-r2 for the measurement'],
	['adjacentGate', 0.2, 'tuning (v3, m4): chance that the lychgate stands in the west wall (adjacent to the main gate) instead of the north wall; drawn per seed (never per attempt); see REPORT-fix-r1 for the measurement'],
	['causewayWalled', [6, 12], 'tuning (v3, n3): the causeway of the walled hub crosses 6–12 m of fen water (map margin 8–11 m minus the apron)'],
	['routeClearGate', 4.2, 'tuning (v3, n3): the route may come within the wall half depth + 1.7 m of the wall only within 4.2 m of the main gate'],
	['routeClearLych', 6.2, 'tuning (v3, n3): … and within 6.2 m of the lychgate'],
	['lychApproach', 7.5, 'tuning (v3, n3): the route bends 7.5 m in front of the lychgate and then runs straight into its door corridor'],
	['gateApproach', 8.5, 'tuning (v3, n3): the route runs 8.5 m straight in from the main gate before it bends toward the square'],
	['npcOffRoute', 0.25, 'tuning (v3, m2): an NPC circle keeps ≥ 0.25 m off the route corridor'],
	['routeEndNear', 2.0, 'tuning (v3, m1): the route ends within 2.0 m of the lychgate door corridor'],
	['vaultFromRoute', 36, 'tuning (v3, n4): the vault door is at most 36 m off the main route in a straight line: measured worst 33.6 m over seeds 1–40 + 2.4 m (the ring is 44 m across and the vault stands in a back wall)'],
	['vaultLane', 44, 'tuning (v3, n4): the vault lane (spur + one bend) is at most 44 m long: measured worst 39.8 m over seeds 1–40 + 4.2 m'],
	['frontMargin', [8, 11], 'tuning: fen water between the map edge and the front wall; the causeway (A06.1, 3 m modules) crosses it'],
	['gateMargin', [6.5, 10], 'tuning: dry strip between the lychgate wall and the map edge (adjacent-gate layouts)'],
	['sideMargin', 4, 'tuning: every other margin between the ring and the map edge is at least 4 m of water'],
	['osricFromGate', 12, 'spec v2: the watch post of Osric stands just inside the main gate (≤ 12 m from its centre; measured worst 11.9 m over seeds 1–40, so this one is tight)'],
	['fadeReach', 1.0, 'tuning: a wall piece whose camera shadow covers more than 1 m² of the walkable interior is fade-flagged (front-wall policy)'],
	['maxAttempts', 100, 'tuning: bounded retries; planGen uses 8. A walled hub attempt costs ≈ 80 ms (plan + hub checks; the engine only runs on a plan that passed every hub check); seeds 1–200 (hub-gen/4): opposite gate pair 3–4 attempts on average, 17 at worst; adjacent pair (fixed per seed for familyAttempts = 60 attempts) 15 on average, 51 at worst (adjacent + palisade 17 / 51, adjacent + stone 5 / 11); 2 of 200 seeds fall back to the opposite pair after 60 attempts and are accepted after 67 and 79 attempts in all, so 100 attempts (60 + 40) leave a margin of 21; ≈ 15 s per seed at worst'],
];
export const HUB_RULES = Object.freeze(Object.fromEntries(RULE_TABLE.map(([k, v]) => [k, typeof v === 'object' && v !== null ? Object.freeze(v) : v])));
export const HUB_RULE_SOURCES = Object.freeze(Object.fromEntries(RULE_TABLE.map(([k, , s]) => [k, s])));
const R = HUB_RULES;

/** Real sizes [w, h, d] of the GLBs the hub uses (asset table of src/env/act1/maps/lychgate.js; the test re-reads that file and compares). */
export const HUB_ASSETS = Object.freeze({
	'A01.1': { name: 'Stilt cottage', size: [5.42, 5.2, 5.23] }, 'A01.2': { name: 'Plank walkway segment', size: [4.0, 2.16, 1.99] }, 'A01.3': { name: 'Flint wall', size: [3.4, 1.37, 0.58] },
	'A01.4': { name: 'Hurdle fence', size: [3.2, 1.6, 0.32] }, 'A01.5': { name: 'Well', size: [2.73, 3.4, 2.39] }, 'A01.6': { name: 'Eel-trap rack', size: [4.7, 3.0, 1.98] },
	'A15.2': { name: "Brannoc's forge", size: [6, 4.05, 4.1] }, 'A15.3': { name: 'Name board', size: [2.6, 2.31, 1.24] }, 'A15.4': { name: 'Bell frame', size: [3.14, 3.4, 1.98] },
	'A15.5': { name: "Nell's stall", size: [4.01, 2.3, 1.93] }, 'A15.6': { name: "Osric's watch post", size: [3, 3.89, 3.46] }, 'N01': { name: 'Barrow vault door', size: [3.7, 2.8, 1.07] },
	'N02': { name: 'Flint retaining wall', size: [4, 2.16, 0.73] }, 'N03': { name: 'Rain barrel', size: [0.8, 1.0, 0.8] }, 'N04': { name: 'Peat stack', size: [1.6, 0.66, 1.14] },
	'N06': { name: 'Washing line', size: [4.1, 2.1, 0.85] }, 'N07': { name: 'Drying net', size: [4, 1.8, 1.4] }, 'N08': { name: 'Goods', size: [1.9, 1.3, 1.8] }, 'N12': { name: 'Peat barrow', size: [1.2, 1.0, 2.4] },
	'A04.2': { name: 'Young willow', size: [4.94, 6.0, 5.22] }, 'A02.1': { name: 'Lychgate', size: [3.51, 3.8, 3.3] }, 'A06.1': { name: 'Causeway segment', size: [4.0, 0.97, 1.71] },
	'bone-pile': { name: 'Bone pile', size: [1.2, 0.6, 1.2] },
	'palisade.wall_a': { name: 'Palisade wall (kitSizes.json)', size: [3.76, 3.32, 2.24] }, 'palisade.wall_angle': { name: 'Palisade angle (kitSizes.json)', size: [4.06, 3.39, 3.15] },
});

/**
 * The two wall types of the walled hub. Modules: stone = N02 flint retaining wall 4 × 0.73 h 2.16 (act1 asset table, spec v2), palisade = kit
 * `palisade.wall_a` 3.76 × 2.24 h 3.32 (src/env/kitSizes.json). Corner towers and gate piers are blockout masses with a label (no GLB yet; palisade
 * corners use the footprint of `palisade.wall_angle` as a square).
 */
export const HUB_WALLS = Object.freeze({
	stone: Object.freeze({ glb: 'N02', label: 'Flint town wall', module: 4.0, depth: 0.73, h: 2.16, corner: Object.freeze({ glb: 'blockout.tower', label: 'Corner tower (blockout)', prefix: 'corner-tower', w: 4.2, d: 4.2, h: 5.6 }), pier: Object.freeze({ glb: 'blockout.gate-pier', label: 'Gate pier (blockout)', prefix: 'gate-pier', w: 1.6, d: 1.6, h: 4.4 }), joint: Object.freeze({ glb: 'blockout.joint-pier', label: 'Joint pier (blockout)', prefix: 'joint-pier', h: 2.9 }), prefix: 'wall' }),
	palisade: Object.freeze({ glb: 'palisade.wall_a', label: 'Palisade wall', module: 3.76, depth: 2.24, h: 3.32, corner: Object.freeze({ glb: 'palisade.wall_angle', label: 'Palisade angle', prefix: 'palisade-angle', w: 3.2, d: 3.2, h: 3.39 }), pier: Object.freeze({ glb: 'blockout.gate-post', label: 'Gate post (blockout)', prefix: 'gate-post', w: 1.2, d: 1.2, h: 4.2 }), joint: Object.freeze({ glb: 'blockout.joint-stake', label: 'Joint stake (blockout)', prefix: 'joint-stake', h: 3.7 }), prefix: 'palisade' }),
});
const SIZE = (id) => HUB_ASSETS[id].size;

// ---------------------------------------------------------------------------------------------------------------
// Small geometry

const TAU = Math.PI * 2;
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};
const pt = (p) => ({ x: r2(p.x), z: r2(p.z) });
const front = (yaw) => ({ x: Math.sin(yaw), z: Math.cos(yaw) });
const add = (p, v, k = 1) => ({ x: p.x + v.x * k, z: p.z + v.z * k });
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const norm = (x, z) => {
	const l = Math.hypot(x, z) || 1;
	return { x: x / l, z: z / l };
};
const segDist = (x, z, a, b) => {
	const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
};
const CAM = { camera: { sweepK: R.shadowSlope, forward: UNITS.CAMERA.forward } };
/** The camera shadow of a footprint of height h (what it hides): the footprint swept along the camera forward. */
const shadowOf = (fp, h) => occlusionPolygon(CAM, fp, 0, h);
/** Yaw range that keeps a door normal in the front half-plane with a margin (sin y + cos y ≥ 0.4). */
const YAW_FRONT = [-0.45, 2.02];
const doorDot = (yaw) => Math.sin(yaw) + Math.cos(yaw);
const clampYaw = (yaw) => {
	let y = ((yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
	if (y >= YAW_FRONT[0] && y <= YAW_FRONT[1]) return y;
	return Math.abs(y - YAW_FRONT[0]) < Math.abs(y - YAW_FRONT[1]) ? YAW_FRONT[0] : YAW_FRONT[1];
};
const polyArea = (p) => {
	let a = 0;
	for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j].x * p[i].z - p[i].x * p[j].z);
	return a / 2;
};
function simplify(pts, tol) {
	if (pts.length < 3) return pts;
	const keep = new Uint8Array(pts.length);
	keep[0] = keep[pts.length - 1] = 1;
	const stack = [[0, pts.length - 1]];
	while (stack.length) {
		const [a, b] = stack.pop();
		let far = -1, fd = tol;
		for (let i = a + 1; i < b; i++) {
			const d = segDist(pts[i].x, pts[i].z, pts[a], pts[b]);
			if (d > fd) { fd = d; far = i; }
		}
		if (far >= 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
	}
	return pts.filter((_, i) => keep[i]);
}

/** A polyline with arclength: nearest(x, z) → { x, z, s, d }. */
class Line {
	constructor(points) {
		this.pts = points.map((p) => ({ x: p.x, z: p.z }));
		this.cum = [0];
		for (let i = 1; i < this.pts.length; i++) this.cum.push(this.cum[i - 1] + dist(this.pts[i], this.pts[i - 1]));
		this.length = this.cum[this.cum.length - 1];
	}

	at(s) {
		s = clamp(s, 0, this.length);
		let i = 1;
		while (i < this.pts.length - 1 && this.cum[i] < s) i++;
		const a = this.pts[i - 1], b = this.pts[i], len = this.cum[i] - this.cum[i - 1] || 1, t = clamp((s - this.cum[i - 1]) / len, 0, 1);
		return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
	}

	nearest(x, z) {
		let best = null;
		for (let i = 1; i < this.pts.length; i++) {
			const a = this.pts[i - 1], b = this.pts[i], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
			const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (len * len), 0, 1);
			const px = a.x + dx * t, pz = a.z + dz * t, d = Math.hypot(x - px, z - pz);
			if (!best || d < best.d) best = { x: px, z: pz, d, s: this.cum[i - 1] + t * len };
		}
		return best;
	}
}

/** 3×3 chamfer distance (metres) from the cells where `seed(x, z)` is true, on a grid of `cell` m over the box; bilinear lookup. */
class DistGrid {
	constructor(box, cell, seed) {
		this.x0 = box.x0; this.z0 = box.z0; this.cell = cell;
		this.nx = Math.round((box.x1 - box.x0) / cell) + 1; this.nz = Math.round((box.z1 - box.z0) / cell) + 1;
		const { nx, nz } = this, d = (this.d = new Float32Array(nx * nz).fill(1e4));
		for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (seed(this.x0 + i * cell, this.z0 + j * cell)) d[j * nx + i] = 0;
		const D = cell, G = cell * Math.SQRT2;
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				let v = d[j * nx + i];
				if (i > 0) v = Math.min(v, d[j * nx + i - 1] + D);
				if (j > 0) { v = Math.min(v, d[(j - 1) * nx + i] + D); if (i > 0) v = Math.min(v, d[(j - 1) * nx + i - 1] + G); if (i < nx - 1) v = Math.min(v, d[(j - 1) * nx + i + 1] + G); }
				d[j * nx + i] = v;
			}
		}
		for (let j = nz - 1; j >= 0; j--) {
			for (let i = nx - 1; i >= 0; i--) {
				let v = d[j * nx + i];
				if (i < nx - 1) v = Math.min(v, d[j * nx + i + 1] + D);
				if (j < nz - 1) { v = Math.min(v, d[(j + 1) * nx + i] + D); if (i < nx - 1) v = Math.min(v, d[(j + 1) * nx + i + 1] + G); if (i > 0) v = Math.min(v, d[(j + 1) * nx + i - 1] + G); }
				d[j * nx + i] = v;
			}
		}
	}

	at(x, z) {
		const fx = clamp((x - this.x0) / this.cell, 0, this.nx - 1.001), fz = clamp((z - this.z0) / this.cell, 0, this.nz - 1.001);
		const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, d = this.d, nx = this.nx;
		return (d[j * nx + i] * (1 - tx) + d[j * nx + i + 1] * tx) * (1 - tz) + (d[(j + 1) * nx + i] * (1 - tx) + d[(j + 1) * nx + i + 1] * tx) * tz;
	}
}

// ---------------------------------------------------------------------------------------------------------------
// Edges: N / W are the back edges, S / E the front edges (the camera looks north-west)

const IN = { N: { x: 0, z: 1 }, S: { x: 0, z: -1 }, W: { x: 1, z: 0 }, E: { x: -1, z: 0 } }; // inward normal
const ALONG = { N: { x: 1, z: 0 }, S: { x: 1, z: 0 }, W: { x: 0, z: 1 }, E: { x: 0, z: 1 } };
const GATE_YAW = { N: 0, W: Math.PI / 2 }; // a back-edge piece faces the front: south (yaw 0) or east (yaw π/2)
const ROUTES = [['S', 'N', 0.32], ['E', 'W', 0.32], ['S', 'W', 0.18], ['E', 'N', 0.18]];
const SE = norm(1, 1), NW = norm(-1, -1), NE_SW = norm(1, -1);
const edgePoint = (h, edge, u, inset = 0) => (edge === 'N' ? { x: u, z: -h + inset } : edge === 'S' ? { x: u, z: h - inset } : edge === 'W' ? { x: -h + inset, z: u } : { x: h - inset, z: u });
const lateralOf = (edge, p) => (edge === 'N' || edge === 'S' ? p.x : p.z);
const kindOfEdge = (b, p, tol) => (Math.abs(p.x - b.x0) <= tol ? 'W' : Math.abs(p.x - b.x1) <= tol ? 'E' : Math.abs(p.z - b.z0) <= tol ? 'N' : Math.abs(p.z - b.z1) <= tol ? 'S' : null);

const circle = (x, z, r, extra = {}) => ({ t: 'circle', x, z, r, ...extra });
const capsule = (a, b, r, extra = {}) => ({ t: 'capsule', a, b, r, ...extra });
const polyShape = (pts, extra = {}) => ({ t: 'poly', pts, ...extra });
/** The corridor in front of a door, as preparePlan builds it (door.at on the wall, `depth` m out along the facing). */
function doorCorridor(d) {
	const eps = 0.05, c = toWorld(d.at.x, d.at.z, d.yaw, 0, eps + (d.depth - eps) / 2);
	return makeObb(c.x, c.z, d.width / 2, (d.depth - eps) / 2, d.yaw);
}
const circleOrPoly = (s) => (s.t === 'circle' ? makeObb(s.x, s.z, s.r, s.r, 0).pts : s.pts);
const polyBoxOf = (pts) => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); } return { x0, x1, z0, z1 }; };
const shapeBox = (s) => (s.t === 'circle' ? { x0: s.x - s.r, x1: s.x + s.r, z0: s.z - s.r, z1: s.z + s.r } : s.t === 'capsule' ? { x0: Math.min(s.a.x, s.b.x) - s.r, x1: Math.max(s.a.x, s.b.x) + s.r, z0: Math.min(s.a.z, s.b.z) - s.r, z1: Math.max(s.a.z, s.b.z) + s.r } : polyBoxOf(s.pts));
const pondContains = (poly, x, z) => pointInPoly(poly, x, z);

class Hub {
	constructor(seed, attempt, size) {
		this.seed = seed; this.attempt = attempt; this.size = size;
		this.h = size / 2;
		this.b = { x0: -this.h, z0: -this.h, x1: this.h, z1: this.h };
		this.items = []; // { m, fp, hull, tag }
		this.masses = []; this.doors = []; this.interactions = []; this.paths = []; this.zones = []; this.notes = []; this.unplaced = [];
		this.keep = []; // shapes the camera shadows must not cover: route, doors, NPC points
		this.block = []; // shapes the masses must not enter: corridors, door corridors, NPC circles (with `clear`)
		this.hulls = []; // camera shadows of the tall masses
		this.counter = {};
		this.tries = 0;
		this.why = {};
	}

	S(purpose) { return new Stream(hash32(this.seed, this.attempt, `hub-${purpose}${this.round ? `-r${this.round}` : ''}`)); }

	snapshot() { return { items: this.items.slice(), masses: this.masses.slice(), doors: this.doors.slice(), interactions: this.interactions.slice(), block: this.block.slice(), keep: this.keep.slice(), hulls: this.hulls.slice(), paths: this.paths.slice(), unplaced: this.unplaced.slice(), counter: { ...this.counter } }; }

	restore(o) { Object.assign(this, { items: o.items.slice(), masses: o.masses.slice(), doors: o.doors.slice(), interactions: o.interactions.slice(), block: o.block.slice(), keep: o.keep.slice(), hulls: o.hulls.slice(), paths: o.paths.slice(), unplaced: o.unplaced.slice(), counter: { ...o.counter } }); }

	/** Run a placement phase up to `rounds` times with fresh streams (bounded, seeded) until `good()` holds; the best round stays. */
	phase(run, good, rounds = 5) {
		const base = this.snapshot();
		let best = null;
		for (let r = 0; r < rounds; r++) {
			this.round = r;
			if (r) this.restore(base);
			run();
			const score = good();
			if (!best || score > best.score) best = { score, r };
			if (score >= 1) break;
		}
		if (best.r !== this.round) { this.restore(base); this.round = best.r; run(); }
		this.round = 0;
		return best.score;
	}

	id(prefix) {
		this.counter[prefix] = (this.counter[prefix] ?? 0) + 1;
		return `${prefix}-${this.counter[prefix]}`;
	}

	// ---- the island: a rounded rectangle of land in black fen water; it runs off the map at the gate edge (the hill to the church)
	makeLand() {
		const rng = this.S('land'), h = this.h;
		const [inEdge, gateEdge] = rng.weighted(ROUTES, (r) => r[2]);
		this.inEdge = inEdge; this.gateEdge = gateEdge;
		const back = gateEdge === 'N' ? 'W' : 'N', side = inEdge === 'S' ? 'E' : 'S';
		const inset = { N: -80, S: -80, W: -80, E: -80 };
		inset[inEdge] = rng.range(...R.frontWater);
		inset[side] = rng.range(...R.sideWater);
		this.backWater = rng.chance(R.backWaterChance);
		if (this.backWater) inset[back] = rng.range(...R.backWater);
		this.inset = inset; this.side = side; this.back = back;
		const rc = rng.range(...R.cornerRadius), ox = rng.range(0, 300), oz = rng.range(0, 300), sN = hash32(this.seed, this.attempt, 'shore') & 0xffff;
		const x0 = -h + inset.W, x1 = h - inset.E, z0 = -h + inset.N, z1 = h - inset.S; // a negative inset runs the rectangle far off the map
		const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
		this.sdf = (x, z) => {
			const qx = Math.abs(x - cx) - (hx - rc), qz = Math.abs(z - cz) - (hz - rc);
			return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rc + (vnoise(x * 0.085 + ox, z * 0.085 + oz, sN) - 0.5) * R.shoreNoise;
		};
		const c = { x: (Math.max(x0, -h) + Math.min(x1, h)) / 2, z: (Math.max(z0, -h) + Math.min(z1, h)) / 2 };
		this.c = c;
		const N = 360, ring = [];
		for (let i = 0; i < N; i++) {
			const a = (i / N) * TAU, dx = Math.cos(a), dz = Math.sin(a);
			let t = 0;
			while (t < 140 && this.sdf(c.x + dx * t, c.z + dz * t) < 0) t += 1.0;
			let lo = Math.max(0, t - 1.0), hi = t;
			for (let k = 0; k < 9; k++) { const m = (lo + hi) / 2; if (this.sdf(c.x + dx * m, c.z + dz * m) < 0) lo = m; else hi = m; }
			const tb = Math.min(dx > 0 ? (h - c.x) / dx : dx < 0 ? (-h - c.x) / dx : Infinity, dz > 0 ? (h - c.z) / dz : dz < 0 ? (-h - c.z) / dz : Infinity);
			ring.push({ a, x: c.x + dx * Math.min(lo, tb), z: c.z + dz * Math.min(lo, tb), onBounds: lo >= tb - 1e-6 });
		}
		this.ring = ring;
	}

	/** The black water of the fen as ONE polygon (the map outside the island), open where the island runs off the map. */
	fenPolygon() {
		const ring = this.ring, N = ring.length, h = this.h;
		let start = -1;
		for (let i = 0; i < N; i++) if (ring[i].onBounds && !ring[(i + 1) % N].onBounds) { start = (i + 1) % N; break; }
		if (start < 0) return null;
		const arc = [];
		let i = start;
		while (!ring[i].onBounds) { arc.push({ x: ring[i].x, z: ring[i].z }); i = (i + 1) % N; }
		const first = ring[(start - 1 + N) % N], last = ring[i];
		const a0 = ring[start].a, span = ((ring[(i - 1 + N) % N].a - a0) % TAU + TAU) % TAU;
		const off = (a) => ((a - a0) % TAU + TAU) % TAU;
		// the map corners the arc sweeps over lie on the water side; from the arc end they are visited back toward its start
		const corners = [{ x: h, z: h }, { x: -h, z: h }, { x: -h, z: -h }, { x: h, z: -h }]
			.map((q) => ({ ...q, o: off(Math.atan2(q.z - this.c.z, q.x - this.c.x)) })).filter((q) => q.o < span).sort((p, q) => q.o - p.o);
		const poly = [{ x: first.x, z: first.z }, ...simplify(arc, 0.25), { x: last.x, z: last.z }, ...corners.map((q) => ({ x: q.x, z: q.z }))];
		return polyArea(poly) < 0 ? poly.reverse() : poly;
	}

	landOk(x, z, margin) { return this.sdf(x, z) < -margin && !(this.pond && pondContains(this.pond.poly, x, z)); }

	// ---- the route: causeway (straight over the water) → island → square → lychgate
	makeRoute() {
		const rng = this.S('route'), h = this.h, inE = this.inEdge, gE = this.gateEdge, ins = this.inset[inE];
		const al = ALONG[inE], inn = IN[inE];
		let best = null;
		for (let k = 0; k < 120; k++) {
			this.tries++;
			const rs = rng.range(...R.squareRadius);
			const u = rng.range(-0.3, 0.3) * h, E0 = edgePoint(h, inE, u, R.edgeInset);
			const C = add(E0, inn, ins + 2.0 - R.edgeInset);
			const Q = add(add(C, inn, rng.range(12, 21)), al, rng.range(-10, 10));
			if (dist(C, Q) > R.squareFromCauseway - 0.5 || Math.abs(Q.x) > 14 || Math.abs(Q.z) > 14) continue;
			if (this.sdf(Q.x, Q.z) > -(rs + 5.5)) continue;
			// room for the buildings behind the square: land in the back half-plane
			let ok = 0, tot = 0;
			for (const r of [10, 14, 18, 22]) for (let a = -90; a <= 90; a += 15) {
				const d = norm(NW.x * Math.cos(a * Math.PI / 180) - NW.z * Math.sin(a * Math.PI / 180), NW.x * Math.sin(a * Math.PI / 180) + NW.z * Math.cos(a * Math.PI / 180));
				const p = add(Q, d, r);
				tot++;
				if (Math.abs(p.x) < h - 2 && Math.abs(p.z) < h - 2 && this.sdf(p.x, p.z) < -2) ok++;
			}
			if (ok / tot < 0.62) continue;
			const gx = rng.range(-14, 14);
			const gc = edgePoint(h, gE, gx, 0.85 + 3.3 / 2), Gp = add(gc, IN[gE], 7.5), Ge = add(gc, IN[gE], 3.3 / 2 + 1.7); // the route ends 1.7 m in front of the gate: the gate's door corridor is the way through
			const dirCG = norm(Gp.x - C.x, Gp.z - C.z), pp = { x: -dirCG.z, z: dirCG.x }, Qr = add(Q, pp.x + pp.z >= 0 ? pp : { x: -pp.x, z: -pp.z }, rng.range(3.8, 4.6)); // the route skirts the standing area on its front side
			const est = ins + 2.0 - R.edgeInset + dist(C, Qr) * 1.05 + dist(Qr, Gp) * 1.1 + dist(Gp, Ge);
			if (est < R.routeRange[0] + 3 || est > R.routeRange[1] - 4) continue;
			const mid = add(lerp2(Qr, Gp, rng.range(0.4, 0.6)), norm(-(Gp.z - Qr.z), Gp.x - Qr.x), rng.range(-3.5, 3.5));
			const ctrl = [[C.x, C.z], [C.x + inn.x * 3.5, C.z + inn.z * 3.5], [Qr.x, Qr.z], [mid.x, mid.z], [Gp.x, Gp.z], [Ge.x, Ge.z]];
			const smooth = smoothPath(ctrl, 2.5);
			// causeway: straight from the edge to C in 3 m modules
			const L = dist(E0, C), n = Math.max(1, Math.round(L / R.causewayModule)), causeway = [];
			for (let i = 0; i < n; i++) causeway.push(pt(lerp2(E0, C, i / n)));
			const pts = causeway.concat(smooth);
			const line = new Line(pts);
			// the smooth part keeps to dry land
			let dry = true;
			for (let s = L + 1; s <= line.length && dry; s += 1) { const p = line.at(s); if (this.sdf(p.x, p.z) > -1.2 || Math.abs(p.x) > h - 0.4 || Math.abs(p.z) > h - 0.4) dry = false; }
			if (!dry) continue;
			if (line.length < R.routeRange[0] + 1 || line.length > R.routeRange[1] - 1) continue;
			best = { rs, E0, C, Q, Qr, gc, Gp, Ge, gx, pts, line, causewayLength: L, causeway: n };
			break;
		}
		this.route = best;
		return !!best;
	}

	// ---- pond + Edda's house (on the far bank, door onto the pond, reached over the water by a plank walkway)
	makePond() {
		const rng = this.S('pond'), Q = this.route.Q, rs = this.route.rs, line = this.route.line, h = this.h;
		const dEdda = SIZE('A01.1');
		for (let k = 0; k < 420; k++) {
			this.tries++;
			const [a, yaw] = rng.weighted([[SE, Math.PI / 4, 0.5], [{ x: 0, z: 1 }, 0, 0.25], [{ x: 1, z: 0 }, Math.PI / 2, 0.25]], (q) => q[2]);
			const rpa = rng.range(3.0, 4.2), rpb = rng.range(3.6, 5.0), g = 1.5;
			const ang = rng.range(0, TAU), rad = rng.range(rs + 9, 26), H = { x: Q.x + Math.cos(ang) * rad, z: Q.z + Math.sin(ang) * rad };
			if (dist(H, Q) < rs + 11 || dist(H, Q) > 27 || this.sdf(H.x, H.z) > -4.8) { this.pw(1); continue; }
			const Pc = add(H, a, dEdda[2] / 2 + g + rpa), perp = { x: -a.z, z: a.x };
			const poly = [];
			for (let i = 0; i < 20; i++) {
				const t = (i / 20) * TAU, rr = 1 + (vnoise(i * 1.7 + k, 3.3, this.seed & 255) - 0.5) * 0.22;
				poly.push(pt({ x: Pc.x + a.x * Math.cos(t) * rpa * rr + perp.x * Math.sin(t) * rpb * rr, z: Pc.z + a.z * Math.cos(t) * rpa * rr + perp.z * Math.sin(t) * rpb * rr }));
			}
			const S0 = add(Pc, a, rpa + 1.5), door = add(H, a, dEdda[2] / 2 + 0.15);
			if (![...poly, S0].every((p) => Math.abs(p.x) < h - 3.5 && Math.abs(p.z) < h - 3.5)) { this.pw(2); continue; }
			if (!poly.every((p) => this.sdf(p.x, p.z) < -3.5) || this.sdf(S0.x, S0.z) > -1.8) { this.pw(3); continue; }
			// the pond keeps off the route and the square; its lane to the route is short, dry and does not cross the pond
			if (line.nearest(Pc.x, Pc.z).d < Math.max(rpa, rpb) + 4.0 || dist(Pc, Q) < rs + Math.max(rpa, rpb) + 4.5) { this.pw(4); continue; }
			const near = line.nearest(S0.x, S0.z);
			if (near.d > R.exitFromRoute - 4 || near.d < 3 || segDist(Q.x, Q.z, S0, near) < rs + 1.5 || segDist(this.route.C.x, this.route.C.z, S0, near) < 9 || dist(this.route.C, Pc) < 13) { this.pw(5); continue; }
			let wet = false;
			for (let t = 0; t <= 1; t += 0.1) { const q = lerp2(S0, near, t); if (pondContains(poly, q.x, q.z) || this.sdf(q.x, q.z) > -1.2) wet = true; }
			if (wet) { this.pw(6); continue; }
			// the house's camera shadow stays off the route and the square
			const fp = makeObb(H.x, H.z, dEdda[0] / 2, dEdda[2] / 2, yaw), hull = shadowOf(fp, dEdda[1]);
			let hidden = false;
			for (let i = 0; i + 1 < this.route.pts.length && !hidden; i++) if (segPolyDistance(this.route.pts[i], this.route.pts[i + 1], hull) < R.routeWidth / 2 + 0.3) hidden = true;
			if (hidden || pointPolySigned(hull, Q.x, Q.z) < rs * 0.62 + 0.5) { this.pw(7); continue; }
			// the house itself must fit among what already stands (vault, gate, route), and the lane must not cross it
			const eh = this.mass('A01.1', "Edda's house", H, yaw, { kind: 'building', prefix: 'edda-house' }), edr = this.door(eh, 'door', R.doorCottage, { id: 'edda-door' });
			if (this.fits(eh, { wm: 1.0, brings: [edr.shape], owner: eh.id, passRoute: true }) || this.items.some((it) => segPolyDistance(S0, near, it.fp.pts) < 1.2)) { this.pw(8); continue; }
			this.pond = { poly, c: Pc, a, yaw, rpa, rpb, H, S0, door, g };
			return true;
		}
		return false;
	}

	pw(i) { this.why[`pond${i}`] = (this.why[`pond${i}`] ?? 0) + 1; }

	// ---- masses
	mass(glb, label, at, yaw, o = {}) {
		const [w, hgt, d] = o.dims ?? SIZE(glb);
		return { id: o.id ?? this.id(o.prefix ?? glb.toLowerCase().replace('.', '')), kind: o.kind ?? 'prop', footprint: { w: r2(o.w ?? w), d: r2(o.d ?? d) }, height: r2(o.h ?? hgt), at: pt(at), yaw: r2(yaw), label, glb, ...(o.collision === false ? { collision: false } : {}), ...(o.tag ? { tag: o.tag } : {}) };
	}

	/** Whether the mass fits; if it does, commit it (and the doors / NPC points / reserved shapes it brings). */
	place(m, o = {}) {
		const why = this.fits(m, o);
		if (why) { const k = `${m.glb}:${why}`; this.why[k] = (this.why[k] ?? 0) + 1; return false; }
		const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw);
		const tall = m.height >= R.tallMin && !o.noShadow && m.collision !== false;
		const hull = tall ? shadowOf(fp, m.height) : null;
		const brings = o.brings ?? [];
		this.items.push({ m, fp, hull, tag: o.tag ?? m.tag ?? m.glb });
		this.masses.push(m);
		if (hull) this.hulls.push(hull);
		for (const s of brings) {
			this.block.push({ ...s, clear: s.clear ?? 0.2 });
			if (s.keep !== false) this.keep.push(s);
		}
		return true;
	}

	/** The reason the mass does not fit, or null. */
	fits(m, o = {}) {
		const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw), b = this.b;
		this.tries++;
		if (fp.x0 < b.x0 + 0.7 || fp.x1 > b.x1 - 0.7 || fp.z0 < b.z0 + 0.7 || fp.z1 > b.z1 - 0.7) return 'bounds';
		const wm = o.wm ?? R.waterClear;
		const samples = [...fp.pts, { x: fp.cx, z: fp.cz }];
		for (let i = 0; i < 4; i++) samples.push({ x: (fp.pts[i].x + fp.pts[(i + 1) % 4].x) / 2, z: (fp.pts[i].z + fp.pts[(i + 1) % 4].z) / 2 });
		let wmin = Infinity;
		for (const p of samples) { const d = this.wd.at(p.x, p.z); if (d < wm) return 'water'; wmin = Math.min(wmin, d); }
		if (wmin < 1.5) for (const poly of [this.fenPoly, this.pond?.poly]) if (poly && samples.some((p) => pointInPoly(poly, p.x, p.z))) return 'water-polygon'; // the polygons the engine reserves (a sample ≥ 1.5 m from every water cell cannot be inside one)
		const gap = o.gap ?? R.gap;
		const sa = fp.hx + fp.hz;
		for (const it of this.items) {
			// obbSeparation ≥ |centre distance| / √2 − (hx + hz) of both boxes (the best of the four axes is within 45° of the centre line): far boxes skip the exact test
			if (Math.hypot(it.fp.cx - fp.cx, it.fp.cz - fp.cz) * Math.SQRT1_2 - sa - it.fp.hx - it.fp.hz >= gap) continue;
			if (obbSeparation(fp, it.fp) < gap) return `mass:${it.tag}`;
		}
		for (const r of this.block) {
			const bb = (r.bb ??= shapeBox(r));
			if (fp.x1 < bb.x0 - r.clear - 0.1 || fp.x0 > bb.x1 + r.clear + 0.1 || fp.z1 < bb.z0 - r.clear - 0.1 || fp.z0 > bb.z1 + r.clear + 0.1) continue;
			if (o.owner && r.owner === o.owner) continue;
			if (o.inSquare && r.tag === 'disk') continue;
			if (o.passRoute && r.pass) continue;
			if (shapeGap(r, fp.pts) < r.clear) return `block:${r.tag}`;
		}
		const tall = m.height >= R.tallMin && !o.noShadow && m.collision !== false;
		if (tall) {
			const hull = shadowOf(fp, m.height), hb = polyBoxOf(hull);
			for (const r of this.keep) {
				const bb = (r.bb ??= shapeBox(r));
				if (hb.x1 < bb.x0 || hb.x0 > bb.x1 || hb.z1 < bb.z0 || hb.z0 > bb.z1) continue;
				if (!(o.inSquare && r.tag === 'disk') && shapeGap(r, hull) < 0) return `shadow-on:${r.tag}`;
			}
			if (o.crown) for (const r of this.keep) if (shapeGap(r, makeObb(m.at.x, m.at.z, o.crown, o.crown, 0).pts) < 0) return `crown-on:${r.tag}`;
		}
		// what the mass brings: door corridors / NPC circles stay clear of earlier masses and of earlier camera shadows
		for (const s of o.brings ?? []) {
			const sb = (s.bb ??= shapeBox(s));
			for (const it of this.items) if (!(it.fp.x1 < sb.x0 - 0.2 || it.fp.x0 > sb.x1 + 0.2 || it.fp.z1 < sb.z0 - 0.2 || it.fp.z0 > sb.z1 + 0.2) && shapeGap(s, it.fp.pts) < 0.15) return `brings-${s.tag}-vs-mass:${it.tag}`;
			for (const hl of this.hulls) { const hb = polyBoxOf(hl); if (s.keep !== false && !(hb.x1 < sb.x0 || hb.x0 > sb.x1 || hb.z1 < sb.z0 || hb.z0 > sb.z1) && shapeGap(s, hl) < 0) return `brings-${s.tag}-in-shadow`; }
			if (shapeGap(s, fp.pts) < -0.02) return 'brings-inside';
			for (const r of this.block) if ((r.tag === 'route' || r.tag === 'lane' || r.tag === 'walkway') && !(o.passRoute && r.pass) && shapeGap(r, circleOrPoly(s)) < 0) return `brings-${s.tag}-on-${r.tag}`;
		}
		return null;
	}

	door(m, kind, spec, o = {}) {
		const f = front(m.yaw), at = add(m.at, f, m.footprint.d / 2);
		const d = { id: o.id ?? `door-${m.id}`, at: pt(at), yaw: r2(m.yaw), kind, width: spec.width, depth: spec.depth, mass: m.id, ...(o.exit ? { exit: o.exit } : {}), ...(o.poppy ? { poppy: true } : {}) };
		return { door: d, shape: polyShape(doorCorridor(d).pts, { tag: 'door', owner: m.id, clear: 0.2, id: d.id }) };
	}

	npc(id, label, at, owner, radius = R.npcRadius) {
		return { npc: { id, at: pt(at), radius, label }, shape: circle(at.x, at.z, radius, { tag: 'npc', owner, clear: 0.25, id }) };
	}

	commit(extra) {
		if (extra.door) this.doors.push(extra.door);
		if (extra.npc) this.interactions.push(extra.npc);
	}

	// ---- thresholds
	placeOsric() {
		const rng = this.S('osric'), { C } = this.route, al = ALONG[this.inEdge], inn = IN[this.inEdge];
		const s = al.x + al.z < 0 ? 1 : -1; // the lateral side that lies toward the back (north / west)
		for (let k = 0; k < 140; k++) {
			const p = add(add(C, al, (k % 3 === 2 ? -s : s) * rng.range(4.4, 6.8)), inn, rng.range(0.5, 3.5));
			const yaw = clampYaw(yawFacing(C.x - p.x, C.z - p.z) + rng.range(-0.25, 0.25));
			const m = this.mass('A15.6', "Osric's watch post", p, yaw, { kind: 'building', prefix: 'osric-post' });
			const npc = this.npc('osric', 'Osric', add(p, front(yaw), m.footprint.d / 2 + 1.7), m.id);
			if (this.place(m, { wm: 1.0, brings: [npc.shape], owner: m.id, tag: 'post' })) { this.commit(npc); this.osricPost = m; this.osricNpc = npc.npc.at; return true; }
		}
		return false;
	}

	/** Lychgate in a patched flint wall at the back edge; the route runs straight through it to the exit. */
	placeLychgate() {
		const { gc, gx } = this.route, gE = this.gateEdge, yaw = GATE_YAW[gE], along = ALONG[gE], rng = this.S('gate');
		const gate = this.mass('A02.1', 'Lychgate', gc, yaw, { kind: 'building', prefix: 'lychgate', tag: 'threshold' });
		const dr = this.door(gate, 'gate', { width: 2.4, depth: 3.0 }, { id: 'lychgate', exit: { to: 'Churchyard', label: 'Lychgate → Churchyard' } });
		if (!this.place(gate, { wm: 0.5, noShadow: true, brings: [dr.shape], owner: gate.id, gap: 0, passRoute: true })) return false;
		this.commit(dr);
		this.gate = gate;
		return true;
	}

	/** The patched flint wall either side of the lychgate, as many modules (2–3 a side) as the vault terrace leaves room for. */
	placeWalls() {
		const { gc } = this.route, gE = this.gateEdge, yaw = GATE_YAW[gE], along = ALONG[gE], rng = this.S('walls'), gate = this.gate;
		const half = SIZE('A02.1')[0] / 2 + R.wallModule / 2 + 0.02, per = rng.int(...R.wallEnds);
		this.wallSides = [];
		for (const sgn of [-1, 1]) {
			let n = 0;
			for (let k = 0; k < 3 && n < per; k++) {
				const p = add(gc, along, sgn * (half + k * (R.wallModule + 0.02)));
				const w = this.mass('A01.3', 'Flint wall', p, yaw, { kind: 'wall', prefix: 'flint-wall', tag: 'threshold', collision: true });
				if (!this.place(w, { wm: 0.8, gap: -0.02, noShadow: true, passRoute: true })) break;
				n++;
			}
			this.wallSides.push(n);
		}
		return true;
	}

	/** Barrow vault door in a flint retaining wall on the back side, with a lane to the route. */
	placeVault() {
		const rng = this.S('vault'), h = this.h, route = this.route.line, vline = new Line(this.route.pts.filter((q) => dist(q, this.route.gc) >= 8)), [vw, vh, vd] = SIZE('N01'), [rw, , rd] = SIZE('N02');
		const runW = rw * R.vaultRunScale, runD = rd * R.vaultRunScale, runH = 2.16 * R.vaultRunScale;
		const edges = this.backWater ? [this.gateEdge] : [this.gateEdge, this.back];
		for (let k = 0; k < 240; k++) {
			const edge = rng.pick(edges), yaw = GATE_YAW[edge], along = ALONG[edge], inn = IN[edge];
			const gl = lateralOf(edge, this.route.gc);
			const v = edge === this.gateEdge ? gl + rng.sign() * rng.range(17.5, 24) : rng.range(-14, 14);
			if (Math.abs(v) > h - 9 || this.sdf(...Object.values(edgePoint(h, edge, v - 8.4, 2))) > -1.5 || this.sdf(...Object.values(edgePoint(h, edge, v + 8.4, 2))) > -1.5) continue;
			const zf = 0.7 + runD; // the wall face stands 0.7 m + its depth from the edge
			const faceAt = edgePoint(h, edge, v, zf);
			const mid = add(faceAt, inn, -vd / 2);
			const vault = this.mass('N01', 'Barrow vault door', mid, yaw, { kind: 'building', prefix: 'vault-door', tag: 'threshold', h: vh });
			const dr = this.door(vault, 'door', { width: 2.2, depth: 3.0 }, { id: 'vault-door', exit: { to: 'The Barrow vault', label: 'One for the Footing' } });
			const spur0 = add(dr.door.at, front(yaw), 1.2);
			const near = vline.nearest(spur0.x, spur0.z);
			if (near.d > R.exitFromRoute) continue;
			if (segDist(this.route.Q.x, this.route.Q.z, spur0, near) < this.route.rs + 1.5) continue;
			if (this.items.some((it) => segPolyDistance(spur0, near, it.fp.pts) < R.laneWidth / 2 + R.laneClear + 0.2)) continue;
			const lane = capsule(spur0, near, R.laneWidth / 2, { tag: 'lane', clear: R.laneClear });
			if (!this.place(vault, { wm: 0.5, noShadow: true, brings: [dr.shape], owner: vault.id, gap: -0.02 })) continue;
			const runs = [];
			for (const sgn of [-1, 1]) {
				const rc = add(edgePoint(h, edge, v, 0.7 + runD / 2), along, sgn * (vw / 2 + runW / 2 + 0.02));
				runs.push(this.mass('N02', 'Flint retaining wall', rc, yaw, { kind: 'wall', prefix: 'retaining-wall', tag: 'threshold', w: runW, d: runD, h: runH }));
			}
			if (!runs.every((m) => this.place(m, { wm: 0.5, noShadow: true, gap: -0.02 }))) { this.unwind(vault.id); continue; }
			this.commit(dr);
			this.vault = { edge, v, mass: vault };
			this.addPath({ id: 'lane-vault', kind: 'trail', width: R.laneWidth, points: [pt(spur0), pt(near)] });
			this.block.push({ ...lane, owner: null });
			this.keep.push(lane);
			return true;
		}
		return false;
	}

	unwind(id) {
		// remove a vault door that was placed before its wall runs failed
		const i = this.items.findIndex((it) => it.m.id === id);
		if (i >= 0) { this.items.splice(i, 1); this.masses = this.masses.filter((m) => m.id !== id); this.block = this.block.filter((r) => r.owner !== id); this.keep = this.keep.filter((r) => r.owner !== id); }
	}

	addPath(p) { this.paths.push({ inhabited: true, ...p }); }

	placeEdda() {
		const P = this.pond, rng = this.S('edda');
		const m = this.mass('A01.1', "Edda's house", P.H, P.yaw, { kind: 'building', prefix: 'edda-house' });
		const dr = this.door(m, 'door', R.doorCottage, { id: 'edda-door', exit: { to: "Edda's Dream", label: 'The Broth → Edda\'s Dream' }, poppy: true });
		void rng;
		// walkway over the water from S0 to the door; a lane from S0 to the route
		const walk = [pt(P.S0), pt(add(dr.door.at, front(P.yaw), 1.0))];
		const route = this.route.line, near = route.nearest(P.S0.x, P.S0.z);
		const lane = [pt(P.S0), pt(near)];
		const eo = { wm: 0.8, brings: [dr.shape], owner: m.id, tag: 'cottage', passRoute: true };
		const why = this.fits(m, eo);
		if (why) { this.why[`edda:${why}`] = (this.why[`edda:${why}`] ?? 0) + 1; return false; }
		this.place(m, eo);
		this.commit(dr);
		this.edda = { mass: m, walkway: walk, lane };
		this.addPath({ id: 'walkway-edda', kind: 'branch', width: R.walkwayWidth, points: walk, deck: true });
		this.addPath({ id: 'lane-edda', kind: 'trail', width: R.laneWidth, points: lane });
		return true;
	}

	// ---- the square
	/** The square's disk is reserved (no mass inside) and its standing area kept clear of camera shadows; idempotent. */
	reserveSquare() {
		if (this.squareReserved) return;
		const { Q, rs } = this.route;
		this.square = { x: r2(Q.x), z: r2(Q.z), r: r2(rs) };
		this.block.push(circle(Q.x, Q.z, rs, { tag: 'disk', clear: 0 }));
		this.keep.push(circle(Q.x, Q.z, rs * 0.62, { tag: 'disk', clear: 0 })); // the standing area the camera shadows keep clear (the well may shade its own side)
		this.squareReserved = true;
	}

	placeSquare() {
		const rng = this.S('square'), { Q, rs } = this.route;
		this.reserveSquare();
		// well near the centre, where the route leaves most room
		let wellOk = false;
		for (let k = 0; k < 80 && !wellOk; k++) {
			const [dx, dz] = rng.disc(R.squareWell);
			const m = this.mass('A01.5', 'Village well', { x: Q.x + dx, z: Q.z + dz }, rng.range(-0.3, 0.3), { kind: 'prop', prefix: 'well' });
			wellOk = this.place(m, { inSquare: true, tag: 'well' });
		}
		if (!wellOk) this.unplaced.push('well');
		const order = [0, 1, 2, 3];
		for (let i = 3; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
		const away = this.rimAway ? this.rimAway() : norm(Q.x - this.route.Qr.x, Q.z - this.route.Qr.z), nwA = Math.atan2(away.z, away.x), slotA = (slot) => nwA + (slot - 1.5) * (this.rimSpread ?? 0.78) + rng.range(-0.12, 0.12); // four slots spread over the back arc
		let slotNo = 0;
		const rim = (glb, label, o, npcSpec, tries = this.rimTries ?? 240) => {
			const slot = order[slotNo++];
			for (let k = 0; k < tries; k++) {
				const [w, , d] = SIZE(glb), wide = k < 40 ? 0.22 : 0.7, a = slotA(slot) + rng.range(-wide, wide) * (1 + k / 60);
				const rr = rs + Math.max(d / 2, 0.8) + rng.range(0.3, 1.6) + (k > 60 ? rng.range(0, 4) : 0);
				const p = { x: Q.x + Math.cos(a) * rr, z: Q.z + Math.sin(a) * rr };
				void w;
				const yaw = clampYaw(yawFacing(Q.x - p.x, Q.z - p.z) + rng.range(-0.18, 0.18));
				const m = this.mass(glb, label, p, yaw, { prefix: o.prefix, kind: o.kind ?? 'prop' });
				const brings = [];
				let dr = null, npc = null;
				if (o.door) { dr = this.door(m, o.door.kind, o.door.spec, { id: `door-${o.prefix}` }); brings.push(dr.shape); }
				if (npcSpec && this.route.line.nearest(m.at.x + front(yaw).x * (m.footprint.d / 2 + npcSpec.off), m.at.z + front(yaw).z * (m.footprint.d / 2 + npcSpec.off)).d > R.npcFromRoute - 1.5) { this.pw('npcfar'); continue; }
				if (npcSpec) { npc = this.npc(npcSpec.id, npcSpec.label, add(m.at, front(yaw), m.footprint.d / 2 + npcSpec.off), m.id, npcSpec.r); brings.push(npc.shape); }
				if (this.place(m, { brings, owner: m.id, tag: o.tag })) { if (dr) this.commit(dr); if (npc) this.commit(npc); return m; }
			}
			this.unplaced.push(o.prefix);
			return null;
		};
		this.forge = rim('A15.2', "Brannoc's forge", { prefix: 'forge', kind: 'building', tag: 'forge', door: { kind: 'entrance', spec: R.doorWide } }, { id: 'brannoc', label: 'Brannoc', off: 2.0 });
		this.bell = rim('A15.4', 'Mourning bell frame', { prefix: 'bell-frame', tag: 'bell' }, { id: 'bell', label: 'Bell', off: 1.6, r: 1.3 });
		this.board = rim('A15.3', 'Sleeper name board', { prefix: 'name-board', tag: 'board' }, { id: 'name-board', label: 'Name board', off: 1.5, r: 1.3 });
		this.stall = rim('A15.5', "Nell Coppercoin's stall", { prefix: 'stall', tag: 'stall' }, { id: 'nell', label: 'Nell', off: 1.9 });
	}

	// ---- stilt cottages
	placeCottages() {
		const rng = this.S('cottages'), { Q, rs } = this.route, n = rng.int(R.cottages[0] - 1, R.cottages[1] - 1); // + Edda's house
		this.style = rng.weighted([['ring', 0.4], ['row', 0.35], ['cluster', 0.25]], (s) => s[1]);
		const [cw, , cd] = SIZE('A01.1');
		const dir = norm(NW.x + rng.range(-0.25, 0.25), NW.z + rng.range(-0.25, 0.25));
		const rowD = rng.range(rs + 9.5, rs + 12);
		const cluC = add(Q, norm(dir.x + rng.range(-0.5, 0.5), dir.z + rng.range(-0.5, 0.5)), rng.range(14, 18));
		const cand = (k, t) => {
			if (this.style === 'row' && t < 50) return add(add(Q, dir, rowD + rng.range(-1, 1)), NE_SW, (k - (n - 1) / 2) * (cw + rng.range(1.4, 3.2)));
			if (this.style === 'cluster' && t < 50) return add(cluC, norm(rng.range(-1, 1), rng.range(-1, 1)), rng.range(0, 8));
			const a = Math.atan2(NW.z, NW.x) + rng.range(-1, 1) * (t < 120 ? 2.4 : Math.PI), rr = rng.range(rs + 8.5, rs + 22);
			return { x: Q.x + Math.cos(a) * rr, z: Q.z + Math.sin(a) * rr };
		};
		let placed = 0;
		for (let k = 0; k < n; k++) {
			for (let t = 0; t < 240; t++) {
				const p = cand(k, t);
				if (Math.abs(p.x) > this.h - 4 || Math.abs(p.z) > this.h - 4 || this.wd.at(p.x, p.z) < 3.2) continue;
				const yaw = clampYaw(yawFacing(Q.x - p.x, Q.z - p.z) + rng.range(-0.22, 0.22));
				const m = this.mass('A01.1', k === 0 ? "Gennet Barrow's cottage" : 'Stilt cottage', p, yaw, { kind: 'building', prefix: 'cottage' });
				const dr = this.door(m, 'door', R.doorCottage, { id: `door-${m.id}`, poppy: true });
				if (this.place(m, { wm: 0.9, brings: [dr.shape], owner: m.id, tag: 'cottage' })) { this.commit(dr); placed++; break; }
			}
		}
		void cd;
		this.cottageCount = placed;
	}

	// ---- water-edge life: eel rack on a jetty, willows, net, peat, barrels, barrow, washing line, goods, hurdle fences, bone pile
	placeLife() {
		const rng = this.S('life'), P = this.pond, { Q } = this.route;
		// jetty into the pond (or the fen) from its shore, linked by a lane; the rack stands on the bank beside it
		// fen shore within reach of the route (or of Edda's lane): the jetty root is linked to the nearest path by a short lane
		const land = new Line(this.route.pts.slice(this.route.causeway).filter((q) => this.wd.at(q.x, q.z) >= 1.6));
		const shoreNear = (this._shoreNear ??= this.ring.filter((v, i) => i % 2 === 0 && !v.onBounds && Math.abs(v.x) < this.h - 5 && Math.abs(v.z) < this.h - 5 && (v.d = land.nearest(v.x, v.z).d) >= 3.5 && v.d <= 11));
		for (let k = 0; k < 220 && !this.jetty; k++) {
			let shore, dirOut, link;
			if (P && k % 4 === 0) {
				const ang = rng.pick([-1, 1]) * rng.range(1.15, 1.6), cs = Math.cos(ang), sn = Math.sin(ang);
				dirOut = norm(-P.a.x * cs + P.a.z * sn, -P.a.x * sn - P.a.z * cs); // from the pond centre, turned off the walkway axis
				let rr = 0;
				while (pointInPoly(P.poly, P.c.x + dirOut.x * rr, P.c.z + dirOut.z * rr)) rr += 0.1;
				shore = add(P.c, dirOut, rr);
				dirOut = { x: -dirOut.x, z: -dirOut.z }; // toward the water
				link = null;
			} else {
				const v = shoreNear[Math.floor(rng.next() * shoreNear.length)];
				if (!v) continue;
				shore = { x: v.x, z: v.z };
				dirOut = norm(v.x - this.c.x, v.z - this.c.z);
				link = this.route.line.nearest(v.x, v.z);
			}
			const root = add(shore, dirOut, -1.0), tip = add(shore, dirOut, R.walkwayModule - 0.4);
			link = link ?? land.nearest(root.x, root.z);
			if (P && this.edda) { const l2 = new Line(this.edda.lane).nearest(root.x, root.z); if (l2.d < link.d) link = l2; }
			const to = add(link, norm(root.x - link.x, root.z - link.z), 0);
			if (dist(root, to) > 14) { this.pw('j1'); continue; }
			if (this.wd.at(root.x, root.z) < 0.7) { this.pw('j2'); continue; }
			if (this.items.some((it) => segPolyDistance(root, to, it.fp.pts) < R.laneWidth / 2 + R.laneClear + 0.2)) { this.pw('j4'); continue; }
			if (!this.walkableLine(root, to)) { this.pw('j3'); continue; }
			const side = { x: -dirOut.z, z: dirOut.x }, rp = add(add(shore, dirOut, -rng.range(1.7, 2.6)), side, rng.pick([-1, 1]) * rng.range(3.8, 4.8));
			const [rw, rh, rd] = SIZE('A01.6');
			const rack = this.mass('A01.6', 'Eel-trap rack', rp, clampYaw(yawFacing(dirOut.x, dirOut.z)), { kind: 'prop', prefix: 'eel-rack', w: rw * R.rackScale, d: rd * R.rackScale, h: rh * R.rackScale });
			const capL = capsule(root, to, R.laneWidth / 2, { tag: 'lane', clear: R.laneClear });
			const capJ = capsule(root, tip, R.walkwayWidth / 2, { tag: 'walkway', clear: R.laneClear }), nb = this.block.length, nk = this.keep.length;
			this.block.push(capJ, capL); this.keep.push(capJ, capL);
			if (!this.place(rack, { tag: 'rack', wm: 0.4 })) { this.block.length = nb; this.keep.length = nk; continue; }
			this.addPath({ id: 'jetty', kind: 'trail', width: R.walkwayWidth, points: [pt(root), pt(tip)], deck: true, jetty: true });
			this.addPath({ id: 'lane-jetty', kind: 'trail', width: R.laneWidth, points: [pt(root), pt(to)] });
			this.jetty = { root: pt(root), tip: pt(tip), rack: rack.id, at: P && k % 4 === 0 ? 'pond' : 'fen' };
		}
		if (!this.jetty) this.unplaced.push('jetty');
		const want = [['A04.2', 'Young willow', rng.int(2, 3)]];
		// willows by the water, at the back or the side of the walking space (their shade never falls on the route)
		let w = 0;
		for (let k = 0; k < 500 && w < want[0][2]; k++) {
			const p = { x: rng.range(-this.h + 3, this.h - 3), z: rng.range(-this.h + 3, this.h - 3) };
			const d = this.wd.at(p.x, p.z);
			if (d < 1.6 || d > 3.6) continue;
			const m = this.mass('A04.2', 'Young willow', p, rng.range(0, TAU), { kind: 'tree', prefix: 'willow', w: 2.2, d: 2.2 });
			if (this.place(m, { wm: 1.0, crown: 2.5, tag: 'willow' })) w++;
		}
		if (w < 2) this.unplaced.push('willows');
		this.willows = w;
		// dressing near the cottages
		const cottages = this.items.filter((it) => it.tag === 'cottage');
		const near = (it, side, off) => {
			const f = front(it.m.yaw), r = { x: f.z, z: -f.x };
			return add(add(it.m.at, r, side * (it.m.footprint.w / 2 + off)), f, rng.range(-1.6, 1.6));
		};
		const dress = (glb, label, count, o = {}) => {
			let n = 0;
			for (let k = 0; k < 60 && n < count && cottages.length; k++) {
				const it = rng.pick(cottages), p = near(it, rng.sign(), rng.range(o.off0 ?? 1.0, o.off1 ?? 2.4));
				const m = this.mass(glb, label, p, it.m.yaw + rng.range(-0.3, 0.3) + (o.turn ?? 0), { kind: 'prop', prefix: o.prefix, collision: o.collision, ...(o.dims ? { dims: o.dims } : {}) });
				if (this.place(m, { gap: o.gap ?? 0.6, wm: o.wm ?? 0.6, tag: o.prefix })) n++;
			}
			return n;
		};
		this.dressed = {
			barrels: dress('N03', 'Rain barrel', rng.int(2, 3), { prefix: 'barrel', gap: 0.3 }),
			peat: dress('N04', 'Peat stack', rng.int(2, 4), { prefix: 'peat-stack', gap: 0.3 }),
			barrow: dress('N12', 'Peat barrow', 1, { prefix: 'peat-barrow', collision: false, gap: 0.3 }),
			washing: dress('N06', 'Washing line', 1, { prefix: 'washing-line', collision: false, gap: 0.3, off0: 2.4, off1: 3.4, turn: Math.PI / 2 }),
			net: 0,
		};
		// drying net by the water (walk-through)
		for (let k = 0; k < 500 && !this.dressed.net; k++) {
			const p = { x: rng.range(-this.h + 4, this.h - 4), z: rng.range(-this.h + 4, this.h - 4) }, d = this.wd.at(p.x, p.z);
			if (d < 1.5 || d > 4) continue;
			const m = this.mass('N07', 'Drying net', p, rng.range(0, TAU), { prefix: 'drying-net', collision: false });
			if (this.place(m, { gap: 0.5, wm: 1.2, tag: 'net' })) this.dressed.net = 1;
		}
		// goods by Nell's stall
		if (this.stall) {
			const f = front(this.stall.yaw), r = { x: f.z, z: -f.x };
			for (let k = 0; k < 20; k++) {
				const p = add(add(this.stall.at, r, rng.pick([-1, 1]) * (SIZE('A15.5')[0] / 2 + 1.1)), f, rng.range(-0.6, 0.8));
				const m = this.mass('N08', 'Village goods', p, this.stall.yaw + rng.range(-0.3, 0.3), { prefix: 'goods' });
				if (this.place(m, { gap: 0.4, tag: 'goods' })) { this.dressed.goods = 1; break; }
			}
		}
		// willow hurdle fences as yard edges beside the cottages
		let fences = 0;
		const nf = rng.int(...R.fenceRuns);
		for (let k = 0; k < 80 && fences < nf && cottages.length; k++) {
			const it = rng.pick(cottages), f = front(it.m.yaw), r = { x: f.z, z: -f.x };
			const p = add(add(it.m.at, r, rng.sign() * (it.m.footprint.w / 2 + 2.2 + fences * 0.0)), f, it.m.footprint.d / 2 + rng.range(0.5, 1.5));
			const m = this.mass('A01.4', 'Willow hurdle fence', p, it.m.yaw + Math.PI / 2, { kind: 'wall', prefix: 'hurdle-fence' });
			if (this.place(m, { gap: 0.3, wm: 0.8, noShadow: true, tag: 'fence' })) fences++;
		}
		this.dressed.fences = fences;
		// bone pile by the vault
		if (this.vault) {
			const e = this.vault.edge, yaw = GATE_YAW[e];
			for (let k = 0; k < 30; k++) {
				const p = add(edgePoint(this.h, e, this.vault.v + rng.sign() * rng.range(6, 9), 4.0 + rng.range(0, 1.5)), IN[e], 0);
				const m = this.mass('bone-pile', 'Bone pile (skulls to count)', p, yaw + rng.range(-0.4, 0.4), { prefix: 'bone-pile' });
				if (this.place(m, { gap: 0.6, tag: 'bones' })) { this.dressed.bones = 1; break; }
			}
		}
	}

	walkableLine(a, b) {
		for (let t = 0; t <= 1; t += 0.1) {
			const p = lerp2(a, b, t);
			if (this.wd.at(p.x, p.z) < 0.25) return false;
		}
		return true;
	}

	/** Height share (0..1) of the land rising toward the back edges (the hill to the church). */
	makeRise() {
		const h = this.h, backEdges = [this.gateEdge, ...(this.backWater ? [] : [this.back])];
		return (x, z) => {
			let v = 0;
			for (const e of backEdges) v = Math.max(v, 1 - sm(0, 13, e === 'N' ? z + h : x + h));
			return v;
		};
	}

	// ---- ground
	makeGround() {
		const seed = this.seed, attempt = this.attempt, { Q, rs } = this.route, b = this.b, h = this.h;
		const sB = hash32(seed, attempt, 'g-bump') & 0xffff, sW = hash32(seed, attempt, 'g-wet') & 0xffff, sG = hash32(seed, attempt, 'g-grass') & 0xffff;
		const pathLines = this.paths.map((p) => p.points).concat([this.route.pts]);
		const box = { x0: b.x0 - 2, z0: b.z0 - 2, x1: b.x1 + 2, z1: b.z1 + 2 };
		const pd = (x, z) => {
			let d = 99;
			for (const line of pathLines) for (let i = 0; i + 1 < line.length; i++) {
				const a = line[i], c = line[i + 1];
				if (x < Math.min(a.x, c.x) - 6 || x > Math.max(a.x, c.x) + 6 || z < Math.min(a.z, c.z) - 6 || z > Math.max(a.z, c.z) + 6) continue;
				d = Math.min(d, segDist(x, z, a, c));
			}
			return d;
		};
		const pathGrid = new DistGrid(box, 1, (x, z) => pd(x, z) < 0.9);
		const rise = this.makeRise();
		const pondP = this.pond;
		const inPond = (x, z) => !!pondP && pondContains(pondP.poly, x, z);
		const wd = this.wd;
		const baseH = (x, z) => 0.3 + (vnoise(x * 0.12, z * 0.12, sB) - 0.5) * 0.35 + rise(x, z) * 2.4;
		const hQ = baseH(Q.x, Q.z);
		this.ground = (x, z) => {
			const water = (this.isWater ? this.isWater(x, z) : this.sdf(x, z) >= 0) || inPond(x, z);
			const d = wd.at(x, z), rs0 = rise(x, z);
			let height = this.relief ? baseH(x, z) - this.relief * (1 - sm(0, 3.5, d)) : lerp(-0.35, baseH(x, z), sm(0, 3.5, d));
			const w = 1 - sm(rs + 1, rs + 5.5, Math.hypot(x - Q.x, z - Q.z));
			height = lerp(height, hQ, w * 0.9);
			const wet = water ? 1 : clamp(0.1 + 0.78 * (1 - sm(0, 4.5, d)) + 0.18 * (vnoise(x * 0.07, z * 0.07, sW) - 0.5), 0, 1);
			const trampled = 1 - sm(0, 2.8, pathGrid.at(x, z)), plaza = w;
			const grass = water ? 0 : clamp(0.62 + 0.5 * (vnoise(x * 0.09, z * 0.09, sG) - 0.5) - wet * 0.3 - trampled * 0.5 - plaza * 0.35, 0, 1);
			const rock = clamp(rs0 * 0.42 + (vnoise(x * 0.11, z * 0.11, sG + 7) - 0.5) * 0.25 * rs0, 0, 1);
			return { height, wet, grass, blood: 0, rock, water };
		};
	}

	build() {
		this.makeLand();
		const fen = this.fenPolygon();
		this.fenPoly = fen ? simplify(fen, 0.2).map(pt) : null;
		if (!this.makeRoute()) { this.notes.push('no route ' + JSON.stringify(this.why)); return null; }
		const grid = () => new DistGrid({ x0: -this.h - 4, z0: -this.h - 4, x1: this.h + 4, z1: this.h + 4 }, 0.5, (x, z) => this.sdf(x, z) >= 0 || (!!this.pond && pondContains(this.pond.poly, x, z)));
		this.wd = grid();
		// the corridors first, so that everything else keeps off them
		const rc = this.route.pts;
		for (let i = 0; i + 1 < rc.length; i++) {
			const c = capsule(rc[i], rc[i + 1], R.routeWidth / 2, { tag: 'route', clear: R.routeClear, pass: dist(lerp2(rc[i], rc[i + 1], 0.5), this.route.gc) < 9 });
			this.block.push(c); this.keep.push(c);
		}
		this.placeOsric();
		if (!this.placeLychgate()) this.unplaced.push('lychgate');
		if (!this.placeVault()) this.unplaced.push('vault');
		// the pond is chosen against what already stands (the vault, the gate), then the water grid learns about it
		const gotPond = this.makePond();
		this.wd = grid();
		if (gotPond) {
			const P = this.pond, near = this.route.line.nearest(P.S0.x, P.S0.z), end = add(P.door, front(P.yaw), 1.0);
			const wc = capsule(pt(P.S0), pt(end), R.walkwayWidth / 2, { tag: 'walkway', clear: R.laneClear, pass: true }), lc = capsule(pt(P.S0), pt(near), R.laneWidth / 2, { tag: 'lane', clear: R.laneClear, pass: true });
			this.block.push(wc, lc); this.keep.push(wc, lc);
		}
		if (gotPond) this.placeEdda(); else this.unplaced.push('edda');
		this.placeWalls();
		const u0 = this.unplaced.length;
		this.phase(() => { this.placeSquare(); }, () => (this.unplaced.length === u0 ? 1 : 0));
		this.phase(() => { this.placeCottages(); }, () => (this.masses.filter((m) => m.glb === 'A01.1').length >= R.cottages[0] ? 1 : this.masses.filter((m) => m.glb === 'A01.1').length / R.cottages[0]));
		this.phase(() => { this.jetty = null; this.willows = 0; this.dressed = null; this.placeLife(); }, () => (this.jetty && this.willows >= 2 && this.dressed?.net ? 1 : 0), 4);
		this.makeGround();
		return this.assemble();
	}

	assemble() {
		// stable ids: number the masses of one kind in placement order (failed candidates do not leave gaps)
		const seen = {}, rename = new Map();
		for (const m of this.masses) {
			const prefix = m.id.replace(/-\d+$/, ''), n = (seen[prefix] = (seen[prefix] ?? 0) + 1);
			rename.set(m.id, `${prefix}-${n}`);
		}
		for (const d of this.doors) { if (d.mass && rename.has(d.mass)) { if (d.id === `door-${d.mass}`) d.id = `door-${rename.get(d.mass)}`; d.mass = rename.get(d.mass); } }
		for (const m of this.masses) m.id = rename.get(m.id);
		const { route, pond, b } = this;
		const water = [];
		if (this.fenPoly) water.push({ id: 'fen', polygon: this.fenPoly });
		if (pond) water.push({ id: 'pond', polygon: pond.poly });
		const paths = [{ id: 'route', kind: 'road', points: route.pts, width: R.routeWidth, inhabited: true }, ...this.paths];
		const zones = [{ id: 'square', kind: 'village', shape: { x: this.square.x, z: this.square.z, r: this.square.r } }];
		if (pond) zones.push({ id: 'pond-banks', kind: 'bank', shape: { x: r2(pond.c.x), z: r2(pond.c.z), r: r2(Math.max(pond.rpa, pond.rpb) + 3) } });
		const line = route.line;
		const sSquare = line.nearest(route.Qr.x, route.Qr.z).s, sC = route.causewayLength, sEnd = line.length;
		const exits = [
			{ id: 'causeway', edge: this.inEdge, at: pt(route.E0), to: 'Night Fens (the dike road)' },
			{ id: 'lychgate', edge: this.gateEdge, at: pt(route.gc), to: 'Churchyard' },
		];
		const exitDoors = this.doors.filter((d) => d.exit);
		return {
			id: `gen-hub-${this.size}-s${this.seed}`,
			seed: this.seed,
			bounds: { ...b },
			defaultZone: 'moor',
			autoMasses: false, // the hub is authored: no random rocks or dead trees
			zones,
			paths,
			water,
			doors: this.doors,
			interactions: this.interactions,
			spawns: [], arenas: [], hosts: [], events: [],
			masses: this.masses,
			ground: this.ground,
			start: pt(line.at(2)),
			exits,
			square: this.square,
			hub: {
				inEdge: this.inEdge, gateEdge: this.gateEdge, side: this.side, back: this.back, backWater: this.backWater, inset: { ...this.inset },
				waterSides: ['N', 'S', 'W', 'E'].filter((e) => this.inset[e] > 0),
				causeway: { from: pt(route.E0), to: pt(route.C), length: r2(route.causewayLength), segments: route.causeway },
				doorExits: exitDoors.map((d) => ({ id: d.id, ...d.exit })),
				pond: pond ? { c: pt(pond.c), rpa: r2(pond.rpa), rpb: r2(pond.rpb) } : null,
				edda: this.edda ? { house: this.edda.mass.id, walkway: this.edda.walkway, segments: Math.ceil(dist(this.edda.walkway[0], this.edda.walkway[1]) / R.walkwayModule) } : null,
				jetty: this.jetty ?? null, vault: this.vault ? { edge: this.vault.edge, v: r2(this.vault.v) } : null, style: this.style,
				wallModules: this.wallSides, dressed: this.dressed ?? {}, willows: this.willows ?? 0, unplaced: this.unplaced, why: this.why,
			},
			meta: {
				generator: HUB_GEN_VERSION, seed: this.seed, attempt: this.attempt, biome: 'hub', size: this.size, notes: this.notes, tries: this.tries,
				cottages: this.masses.filter((m) => m.glb === 'A01.1').length,
				route: {
					length: r2(line.length), walkS: r2(line.length / R.walkSpeed), runS: r2(line.length / R.runSpeed), causeway: r2(sC), causewayToSquare: r2(dist(route.C, route.Q)), toSquare: r2(sSquare), squareToGate: r2(sEnd - sSquare),
				},
			},
		};
	}
}

// ---------------------------------------------------------------------------------------------------------------
// v2: the walled hub. Built in a canonical frame — main gate on the SOUTH wall, lychgate on the NORTH wall (opposite) or the WEST wall
// (adjacent) — and transposed (x ↔ z, a mirror about the camera axis) for 50 % of the seeds, which gives the E-gate layouts (E → W, E → N).

const wrapPi = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const unit = (a, b) => norm(b.x - a.x, b.z - a.z);

/** Outward offset of a convex clockwise polygon (x east, z south) by o metres, mitred. */
function convexOffset(poly, o) {
	const n = poly.length;
	return poly.map((p, i) => {
		const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n], t1 = unit(a, p), t2 = unit(p, b), n1 = { x: t1.z, z: -t1.x }, n2 = { x: t2.z, z: -t2.x }, k = o / (1 + n1.x * n2.x + n1.z * n2.z);
		return { x: p.x + (n1.x + n2.x) * k, z: p.z + (n1.z + n2.z) * k };
	});
}
const boxSdf = (b, x, z) => {
	const dx = Math.max(b.x0 - x, x - b.x1), dz = Math.max(b.z0 - z, z - b.z1);
	return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
};
/** The fen water around a convex island whose dry lane (x in [a, b]) leaves through the north edge: ONE polygon (map frame minus the island, slit along the lane). */
function fenSlit(B, a, b, h) {
	let i0 = -1, zt = 0;
	for (let i = 0; i < B.length; i++) {
		const p = B[i], q = B[(i + 1) % B.length];
		if (Math.abs(p.z - q.z) < 1e-6 && p.x < q.x && p.x < a && q.x > b) { i0 = i; zt = p.z; break; }
	}
	if (i0 < 0) return null;
	const poly = [{ x: b, z: -h }, { x: h, z: -h }, { x: h, z: h }, { x: -h, z: h }, { x: -h, z: -h }, { x: a, z: -h }, { x: a, z: zt }];
	for (let k = 0; k < B.length; k++) poly.push(B[(i0 - k + B.length) % B.length]);
	poly.push({ x: b, z: zt });
	return poly;
}

/** Modules and the fixed items of one wall edge: counts of modules in the gaps between the items (≥ `min` each) and the stretched module length. */
function fillEdge(len, s0, s1, items, L, min, rng) {
	const filler = len - s0 - s1 - items.reduce((a, i) => a + i.w, 0), gaps = items.length + 1, lo = items.length ? min : 1, total = Math.round(filler / L);
	if (filler <= 0 || total < gaps * lo) return null;
	const f = filler / total;
	if (Math.abs(f / L - 1) > R.wallStretch) return null;
	const counts = new Array(gaps).fill(lo);
	for (let k = 0; k < total - gaps * lo; k++) counts[rng.int(0, gaps - 1)]++;
	return { counts, f };
}

/** Centres of the fixed items (gate, lychgate, vault) of an edge, in the frame of the edge's own points: id → { x, z }. */
function edgeItemCentres(e) {
	const t = unit(e.a, e.b), out = {};
	let u = e.s0;
	for (let j = 0; j < e.items.length; j++) {
		u += e.fill.counts[j] * e.fill.f;
		out[e.items[j].id] = add(e.a, t, u + e.items[j].w / 2);
		u += e.items[j].w;
	}
	return out;
}

/** Clearance to the wall: buildings and every solid mass ≥ 2 m tall keep 2.5 m, low solid dressing 1.0 m, walk-through decor 0.3 m. */
const wallClearOf = (m) => (m.collision === false ? 0.3 : m.height >= R.tallMin ? R.wallClear : R.wallClearLow);

/** Whether a polyline passes within `d` m of a polygon. */
const segPolyLine = (pts, poly, d) => pts.some((q, i) => i && segPolyDistance(pts[i - 1], q, poly) < d);

class WalledHub extends Hub {
	constructor(seed, attempt, size, familyAttempts = R.familyAttempts) {
		super(seed, attempt, size);
		this.familyAttempts = familyAttempts;
		this.rimSpread = 1.0; this.rimTries = 420; // the rim items of the square spread over a wider back arc: the ring leaves less room than the island
		this.wallType = ['stone', 'palisade'][hash32(seed, 0, 'hub-wall-type') & 1];
		this.wt = HUB_WALLS[this.wallType];
		this.wallItems = []; // wall pieces (their footprints), for the clearance test
		this.inEdge = 'S'; this.side = 'E'; this.back = 'W'; this.backWater = false; this.wallSides = [];
	}

	/** Distance (m) of a point inside the ring to the nearest wall line (negative outside the ring). */
	innerDist(p) {
		let d = Infinity;
		for (const e of this.ringEdges) d = Math.min(d, (p.x - e.a.x) * e.n.x + (p.z - e.a.z) * e.n.z);
		return d;
	}

	// ---- the ring: wall pieces (modules between fixed items), corner towers or mitred clips, the gate positions
	makeRing() {
		const rng = this.S('ring'), wt = this.wt, L = wt.module, depth = wt.depth, trim = (depth / 2) * Math.tan(Math.PI / 8), c = wt.corner.w, h = this.h, S = this.size;
		// the layout family (gate pair, front side) belongs to the seed: a retry never changes it — until familyAttempts attempts have failed; then the next
		// seed-only stream (round 1, 2, …) is drawn and always takes the opposite gate pair, which is cheap (≈ 4–6 attempts), so no seed is rejected
		this.familyRound = Math.floor(this.attempt / this.familyAttempts);
		const fam = new Stream(hash32(this.seed, this.familyRound, 'hub-gate-pair'));
		const gateEdge = fam.chance(R.adjacentGate) && this.familyRound === 0 ? 'W' : 'N';
		this.gateEdge = gateEdge;
		this.transposed = fam.chance(0.5);
		const vaultEdge = gateEdge === 'N' ? 'W' : 'N'; // the vault stands in the other back wall
		const gateW = R.gateOpening + 2 * wt.pier.w, vaultW = SIZE('N01')[0] + 2 * SIZE('N02')[0];
		const itemsOf = { N: [], S: [{ id: 'main', w: gateW }], W: [], E: [] };
		itemsOf[gateEdge].push({ id: 'lych', w: SIZE('A02.1')[0] });
		itemsOf[vaultEdge].push({ id: 'vault', w: vaultW });
		const style = rng.weighted([['square', 0.25], ['clipped', 0.3], ['rounded', 0.2], ['irregular', 0.25]], (q) => q[1])[0];
		for (let k = 0; k < 800; k++) {
			this.tries++;
			const W = rng.range(R.wallRing[0] + 5.5, R.wallRing[1]), H = rng.range(R.wallRing[0] + 5.5, R.wallRing[1]);
			const types = [0, 1, 2, 3].map(() => (style === 'square' ? 0 : style === 'clipped' ? 1 : style === 'rounded' ? 2 : rng.weighted([[0, 0.4], [1, 0.4], [2, 0.2]], (q) => q[1])[0]));
			const [kNW, kNE, kSE, kSW] = types.map((t) => (t ? (t * L + 2 * trim) / Math.SQRT2 : 0));
			const x0 = -W / 2, x1 = W / 2, z0 = -H / 2, z1 = H / 2;
			const V = { NWa: { x: x0 + kNW, z: z0 }, NEa: { x: x1 - kNE, z: z0 }, NEb: { x: x1, z: z0 + kNE }, SEa: { x: x1, z: z1 - kSE }, SEb: { x: x1 - kSE, z: z1 }, SWa: { x: x0 + kSW, z: z1 }, SWb: { x: x0, z: z1 - kSW }, NWb: { x: x0, z: z0 + kNW } };
			const end = (t) => (t ? 'clip' : 'tower');
			const edges = [{ id: 'N', a: V.NWa, b: V.NEa, ea: end(types[0]), eb: end(types[1]) }];
			if (types[1]) edges.push({ id: 'NE', a: V.NEa, b: V.NEb, ea: 'clip', eb: 'clip' });
			edges.push({ id: 'E', a: V.NEb, b: V.SEa, ea: end(types[1]), eb: end(types[2]) });
			if (types[2]) edges.push({ id: 'SE', a: V.SEa, b: V.SEb, ea: 'clip', eb: 'clip' });
			edges.push({ id: 'S', a: V.SEb, b: V.SWa, ea: end(types[2]), eb: end(types[3]) });
			if (types[3]) edges.push({ id: 'SW', a: V.SWa, b: V.SWb, ea: 'clip', eb: 'clip' });
			edges.push({ id: 'W', a: V.SWb, b: V.NWb, ea: end(types[3]), eb: end(types[0]) });
			if (types[0]) edges.push({ id: 'NW', a: V.NWb, b: V.NWa, ea: 'clip', eb: 'clip' });
			let ok = true;
			for (const e of edges) {
				const items = itemsOf[e.id] ?? [], len = dist(e.a, e.b), sup = (kind) => (kind === 'tower' ? c / 2 : trim);
				e.fill = fillEdge(len, sup(e.ea), sup(e.eb), items, L, items.length === 1 ? 2 : 1, rng);
				e.items = items; e.len = len; e.s0 = sup(e.ea);
				if (!e.fill) { ok = false; break; }
			}
			if (!ok) { this.pw('r1'); continue; }
			// the route must be able to pass the square on its front side: the lychgate stands on the east half of a north wall / the south half of a west wall
			// item positions (the route passes the square on its front side, Edda's corner stays free): the lychgate on the east half of a north wall /
			// the south half of a west wall, the vault east of the lychgate on the same wall, on the east part of the north wall, or on the south half of the west wall
			const okAt = (e, c) => {
				if (c.main && c.main.x > 9) return false; // the route leaves the gate toward the north-east, away from the post of Osric (west of the gate)
				if (c.lych) { const l = c.lych; if (e.id === 'N' ? l.x < 7 : l.z < 9) return false; }
				if (c.vault) { const v = c.vault; if (e.id === 'N' ? v.x < 6 : v.z < -2) return false; }
				return true;
			};
			let fail = false;
			for (const e of edges.filter((q) => q.items.length)) {
				const gaps = e.items.length + 1, total = e.fill.counts.reduce((a, b) => a + b, 0), mins = gaps === 2 ? [2, 2] : [2, 1, 2], ways = [];
				const rec = (i, left, acc) => {
					if (i === gaps - 1) { if (left >= mins[i]) { e.fill.counts = [...acc, left]; if (okAt(e, edgeItemCentres(e))) ways.push([...acc, left]); } return; }
					for (let c = mins[i]; c <= left - mins.slice(i + 1).reduce((a, b) => a + b, 0); c++) rec(i + 1, left - c, [...acc, c]);
				};
				rec(0, total, []);
				if (!ways.length) { fail = true; break; }
				e.fill.counts = rng.pick(ways);
			}
			if (fail) { this.pw('r2'); continue; }
			// the route must be feasible with these gates: a square east of the main gate, passing it on the front side, 35–55 m to the lychgate
			{
				const G = edgeItemCentres(edges.find((e) => e.id === 'S')).main, ge = edges.find((e) => e.id === gateEdge), Lg = edgeItemCentres(ge).lych, nL = unit(ge.a, ge.b);
				const nIn = { x: -nL.z, z: nL.x }, Gp = add(Lg, nIn, R.lychApproach), Ge = add(Lg, nIn, SIZE('A02.1')[2] / 2 + 1.7), P1 = { x: G.x, z: G.z - R.gateApproach };
				const qx0 = Math.max(5, G.x + 1), qx1 = gateEdge === 'N' ? Math.min(12, Lg.x - 1.5) : 12, qz1 = gateEdge === 'N' ? 11 : Math.min(11, Lg.z - 2);
				let good = false;
				if (qx1 >= qx0 && qz1 >= 4) {
					for (const [fx, fz] of [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0.5]]) {
						const Q = { x: qx0 + (qx1 - qx0) * fx, z: 4 + (qz1 - 4) * fz }, d = unit(P1, Gp), pp = { x: -d.z, z: d.x }, Qr = add(Q, pp.x + pp.z >= 0 ? pp : { x: -pp.x, z: -pp.z }, 2.6);
						const est = dist(G, P1) + dist(P1, Qr) * 1.05 + dist(Qr, Gp) * 1.1 + dist(Gp, Ge);
						if (est >= R.routeInside[0] + 1 && est <= R.routeInside[1] - 3) good = true;
					}
				}
				if (!good) { this.pw('r5'); continue; }
			}
			// the position on the map: the front margin (fen water the causeway crosses), the gate-edge margin (dry strip to the map edge), 4 m elsewhere
			const mS = rng.range(R.frontMargin[0], Math.min(R.frontMargin[1], S - H - (gateEdge === 'N' ? R.gateMargin[0] : R.sideMargin)));
			if (mS < R.frontMargin[0]) { this.pw('r3'); continue; }
			let cx, cz = h - mS - H / 2;
			if (gateEdge === 'N') { const sx = (S - W) / 2 - R.sideMargin; cx = rng.range(-sx, sx); } else cx = -h + rng.range(...R.gateMargin) + W / 2;
			if (cx + W / 2 > h - R.sideMargin + 1e-9 || cx - W / 2 < -h + R.sideMargin - 1e-9 || cz - H / 2 < -h + R.sideMargin - 1e-9) { this.pw('r4'); continue; }
			this.ringC = { cx, cz }; this.ringBox = { W, H, x0: cx - W / 2, x1: cx + W / 2, z0: cz - H / 2, z1: cz + H / 2 }; this.ringStyle = style; this.ringTypes = types;
			this.margins = { S: mS, N: cz - H / 2 + h, W: cx - W / 2 + h, E: h - (cx + W / 2) };
			const T = (p) => ({ x: p.x + cx, z: p.z + cz });
			this.ringEdges = edges.map((e) => {
				const a = T(e.a), b = T(e.b), t = unit(a, b);
				return { ...e, a, b, t, n: { x: -t.z, z: t.x } };
			});
			for (const e of this.ringEdges) e.yawIn = Math.atan2(e.n.x, e.n.z); // the front (+z) of a piece on this edge looks into the ring; its local x runs along the edge
			this.ringPoly = this.ringEdges.map((e) => ({ x: e.a.x, z: e.a.z }));
			return true;
		}
		return false;
	}

	/** Every wall piece as a definition (centre, yaw, size, kind), in the order along the ring. */
	makeWallDefs() {
		const wt = this.wt, defs = [], [vw, vh, vd] = SIZE('N01'), [rw, rh, rd] = SIZE('N02'), [lw, lh, ld] = SIZE('A02.1');
		this.gates = {};
		// a tower stands on every 90° corner: the vertex shared by two straight edges (clip ends are mitred joints)
		for (const e of this.ringEdges) {
			if (e.ea === 'clip') { // v3 (review n6): a joint post closes the outside V-notch where two module boxes meet at 45° (they touch only at the inner corner)
				const p = this.ringEdges[(this.ringEdges.indexOf(e) + this.ringEdges.length - 1) % this.ringEdges.length], d = wt.depth, trim = (d / 2) * Math.tan(Math.PI / 8);
				const I = add(add(e.a, e.t, trim), e.n, d / 2), O1 = add(add(e.a, p.t, -trim), p.n, -d / 2), O2 = add(add(e.a, e.t, trim), e.n, -d / 2), m = norm(O1.x + O2.x - 2 * I.x, O1.z + O2.z - 2 * I.z);
				// the notch is the triangle I–O1–O2 (apex I, 45°); the post is the biggest rectangle along the bisector that stays inside it (2 cm clear of both module boxes: no overlap)
				const t0 = d / 2 + 0.02, t1 = d * Math.cos(Math.PI / 8) - 0.02;
				defs.push({ kind: 'joint', glb: wt.joint.glb, label: wt.joint.label, prefix: wt.joint.prefix, at: add(I, m, (t0 + t1) / 2), yaw: Math.atan2(m.x, m.z), w: 2 * t0 * Math.tan(Math.PI / 8) - 0.04, d: t1 - t0, h: wt.joint.h, massKind: 'building', edge: e.id });
			}
			if (e.ea === 'tower') defs.push({ kind: 'tower', glb: wt.corner.glb, label: wt.corner.label, prefix: wt.corner.prefix, at: e.a, yaw: 0, w: wt.corner.w, d: wt.corner.d, h: wt.corner.h, massKind: 'building' });
			let u = e.s0;
			const gaps = e.items.length + 1;
			for (let j = 0; j < gaps; j++) {
				for (let k = 0; k < e.fill.counts[j]; k++) {
					const at = add(e.a, e.t, u + e.fill.f / 2);
					defs.push({ kind: 'module', glb: wt.glb, label: wt.label, prefix: wt.prefix, at, yaw: e.yawIn, w: e.fill.f - R.wallGap, d: wt.depth, h: wt.h, massKind: 'wall', edge: e.id });
					u += e.fill.f;
				}
				const it = e.items[j];
				if (!it) continue;
				const mid = add(e.a, e.t, u + it.w / 2);
				if (it.id === 'main') {
					const off = R.gateOpening / 2 + wt.pier.w / 2;
					for (const sg of [-1, 1]) defs.push({ kind: 'pier', glb: wt.pier.glb, label: wt.pier.label, prefix: wt.pier.prefix, at: add(mid, e.t, sg * off), yaw: e.yawIn, w: wt.pier.w, d: wt.pier.d, h: wt.pier.h, massKind: 'building', edge: e.id });
					this.gates.main = { at: mid, edge: e.id, out: { x: -e.n.x, z: -e.n.z }, inward: e.n };
				} else if (it.id === 'lych') {
					defs.push({ kind: 'lychgate', glb: 'A02.1', label: 'Lychgate', prefix: 'lychgate', at: mid, yaw: e.yawIn, w: lw, d: ld, h: lh, massKind: 'building', edge: e.id });
					this.gates.lych = { at: mid, edge: e.id, inward: e.n, yaw: e.yawIn };
				} else {
					for (const sg of [-1, 1]) defs.push({ kind: 'wing', glb: 'N02', label: 'Flint retaining wall', prefix: 'retaining-wall', at: add(mid, e.t, sg * (vw / 2 + R.wallGap + (rw - 1.5 * R.wallGap) / 2)), yaw: e.yawIn, w: rw - 1.5 * R.wallGap, d: rd, h: rh, massKind: 'wall', edge: e.id });
					defs.push({ kind: 'vault', glb: 'N01', label: 'Barrow vault door', prefix: 'vault-door', at: mid, yaw: e.yawIn, w: vw, d: vd, h: vh, massKind: 'building', edge: e.id });
					this.gates.vault = { at: mid, edge: e.id, inward: e.n, yaw: e.yawIn };
				}
				u += it.w;
			}
		}
		this.wallDefs = defs;
		// the ring inside: the polygon inner area used for the camera-shadow test
		return defs;
	}

	/** Which wall pieces cast a camera shadow onto the walkable interior (those are the front walls: fade-flagged, see the policy in REPORT-v2). */
	shadowOnInterior(fp, height) {
		const hull = shadowOf(fp, height), hb = polyBoxOf(hull);
		let n = 0;
		for (let x = Math.ceil(hb.x0 * 2) / 2; x <= hb.x1; x += 0.5) for (let z = Math.ceil(hb.z0 * 2) / 2; z <= hb.z1; z += 0.5) if (this.innerDist({ x, z }) > this.wt.depth / 2 + 0.2 && pointInPoly(hull, x, z)) n++;
		return n * 0.25;
	}

	placeWalls() {
		const wt = this.wt;
		for (const d of this.wallDefs) {
			const m = this.mass(d.glb, d.label, d.at, d.yaw, { kind: d.massKind, prefix: d.prefix, tag: 'wall', dims: [d.w, d.h, d.d] });
			m.piece = d.kind;
			const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw);
			const area = this.shadowOnInterior(fp, m.height);
			m.fade = area > R.fadeReach;
			if (m.fade) m.fadeArea = r2(area);
			const it = { m, fp, hull: null, tag: 'wall' };
			this.items.push(it); this.masses.push(m); this.wallItems.push(it);
			d.mass = m;
		}
		// doors: the lychgate (an exit, set into the back wall), the vault door, the main gate (an opening between two piers, facing out)
		const gate = this.wallDefs.find((q) => q.kind === 'lychgate').mass, vault = this.wallDefs.find((q) => q.kind === 'vault').mass, piers = this.wallDefs.filter((q) => q.kind === 'pier');
		const lych = this.door(gate, 'gate', { width: 2.4, depth: 3.0 }, { id: 'lychgate', exit: { to: 'Churchyard', label: 'Lychgate → Churchyard' } });
		const vd = this.door(vault, 'door', { width: 2.2, depth: 3.0 }, { id: 'vault-door', exit: { to: 'The Barrow vault', label: 'One for the Footing' } });
		const G = this.gates.main, mg = { id: 'main-gate', at: pt(G.at), yaw: r2(Math.atan2(G.out.x, G.out.z)), kind: 'gate', width: R.doorWide.width, depth: R.doorWide.depth, mass: piers[0].mass.id };
		const mgShape = polyShape(doorCorridor(mg).pts, { tag: 'door', owner: piers[0].mass.id, clear: 0.2, id: mg.id });
		for (const [door, shape] of [[lych.door, lych.shape], [vd.door, vd.shape], [mg, mgShape]]) {
			this.doors.push(door);
			this.block.push({ ...shape, clear: shape.clear ?? 0.2 }); this.keep.push(shape);
		}
		this.gates.lych.mass = gate; this.gates.vault.mass = vault; this.gates.vaultDoor = vd.door;
		void wt;
	}

	// ---- the land (v3, review M1): the footing hugs the wall (0.25 m beyond its face), plus a small apron at the main gate (where the causeway lands) and,
	// behind the lychgate, the dry hill lane to the map edge; everything else — the whole outside of the ring — is fen water. The lychgate is the only way to the lane.
	makeLand() {
		const wt = this.wt, h = this.h, hl = R.hillLane, lg = this.gates.lych.at, o = wt.depth / 2 + R.bank, tw = wt.corner.w / 2 + R.bank, B = [];
		const edges = this.ringEdges, n = edges.length, [ax, ad] = R.gateApron;
		for (let i = 0; i < n; i++) {
			const e = edges[i], p = edges[(i - 1 + n) % n], V = e.a, oc = { x: -e.n.x, z: -e.n.z }, op = { x: -p.n.x, z: -p.n.z };
			if (e.ea === 'tower') { // the tower stands on the vertex (axis-aligned square): the footing goes round it
				const tp = p.t, tc = e.t;
				B.push(add(add(V, tp, -tw), op, o), add(add(V, tp, -tw), op, tw), add(add(V, tp, tw), op, tw), add(add(V, tp, tw), tc, tw), add(add(V, tc, tw), oc, o));
			} else { // a 45° joint: the footing follows the outer faces of the two module ends and the chord between them (the joint post stands inside), not the mitre tip
				const trim = (wt.depth / 2) * Math.tan(Math.PI / 8);
				B.push(add(add(V, p.t, -trim), op, o), add(add(V, e.t, trim), oc, o));
			}
			if (e.id === this.gates.vault.edge && o > 0.365 + R.bank + 1e-6) { // the vault pieces are thinner than a palisade: the footing follows them (wings 0.73 m, door 1.07 m), so no dry strip is left outside
				const Vm = this.gates.vault.at, t = e.t, hw = SIZE('N01')[0] / 2 + R.wallGap + SIZE('N02')[0] - 1.5 * R.wallGap, hd = SIZE('N01')[0] / 2 + R.wallGap, ow = SIZE('N02')[2] / 2 + R.bank, ov = SIZE('N01')[2] / 2 + R.bank;
				for (const [u, off] of [[-hw, o], [-hw, ow], [-hd, ow], [-hd, ov], [hd, ov], [hd, ow], [hw, ow], [hw, o]]) B.push(add(add(Vm, t, u), oc, off));
			}
			if (e.id === this.gates.main.edge) { // the gate apron: a bump in the front edge, centred on the gate
				const G = this.gates.main.at, t = e.t, zOut = o + ad;
				B.push(add(add(G, t, -ax), oc, o), add(add(G, t, -ax), oc, zOut), add(add(G, t, ax), oc, zOut), add(add(G, t, ax), oc, o));
			}
		}
		this.bank = B;
		const ge = this.ringEdges.find((e) => e.id === this.gateEdge), north = this.gateEdge === 'N';
		this.laneBox = north ? { x0: lg.x - hl, x1: lg.x + hl, z0: -h - 4, z1: ge.a.z - o + 0.5 } : { x0: -h - 4, x1: ge.a.x - o + 0.5, z0: lg.z - hl, z1: lg.z + hl };
		this.sdf = (x, z) => Math.min(pointPolySigned(B, x, z), boxSdf(this.laneBox, x, z));
		this.isWater = (x, z) => boxSdf(this.laneBox, x, z) >= 0 && !pointInPoly(B, x, z); // the sign of sdf without the distance (the water grids and the ground ask millions of times)
		let fen;
		if (north) fen = fenSlit(B, lg.x - hl, lg.x + hl, h);
		else {
			const Bt = B.map((p) => ({ x: p.z, z: p.x })).reverse();
			fen = fenSlit(Bt, lg.z - hl, lg.z + hl, h)?.map((p) => ({ x: p.z, z: p.x }));
		}
		if (!fen) return false;
		this.fenPoly = (polyArea(fen) < 0 ? fen.slice().reverse() : fen).map(pt);
		this.inset = { S: this.margins.S, N: this.margins.N, W: this.margins.W, E: this.margins.E };
		return true;
	}

	// ---- the route: causeway → main gate → square → lychgate
	makeRoute() {
		const rng = this.S('route'), h = this.h, G = this.gates.main.at, Lg = this.gates.lych.at, nL = this.gates.lych.inward, { cx, cz } = this.ringC, half = this.wt.depth / 2;
		const E0 = { x: G.x, z: h - R.edgeInset }, inn = this.gates.main.inward, causeL = dist(E0, G), cn = Math.max(1, Math.round(causeL / R.causewayModule)), causeway = [];
		for (let i = 0; i < cn; i++) causeway.push(pt(lerp2(E0, G, i / cn)));
		const Gp = add(Lg, nL, R.lychApproach), Ge = add(Lg, nL, SIZE('A02.1')[2] / 2 + 1.7), P1 = add(G, inn, R.gateApproach);
		this.route = null;
		for (let k = 0; k < 400; k++) {
			this.tries++;
			// the square lies east of the main gate and of the lychgate line (north wall) / north of the lychgate (west wall): the route passes it on its front side
			const rs = rng.range(...R.squareRadiusWalled), qx0 = Math.max(cx + 5, G.x + 1), qx1 = this.gateEdge === 'N' ? Math.min(cx + 12, Lg.x - 1.5) : cx + 12, qz1 = this.gateEdge === 'N' ? cz + 11 : Math.min(cz + 11, Lg.z - 2);
			if (qx1 < qx0 || qz1 < cz + 4) { this.pw('rq1'); continue; }
			const Q = { x: rng.range(qx0, qx1), z: rng.range(cz + 4, qz1) };
			if (this.gateEdge === 'N' ? Q.x > Lg.x - 1.5 : Q.z > Lg.z - 2) { this.pw('rq1'); continue; }
			if (this.innerDist(Q) < rs + 5 || dist(Q, G) > R.squareFromGate) { this.pw('rq2'); continue; }
			const dirCG = norm(Gp.x - P1.x, Gp.z - P1.z), pp = { x: -dirCG.z, z: dirCG.x }, Qr = add(Q, pp.x + pp.z >= 0 ? pp : { x: -pp.x, z: -pp.z }, rng.range(2.0, 3.2));
			const est = dist(G, P1) + dist(P1, Qr) * 1.05 + dist(Qr, Gp) * 1.1 + dist(Gp, Ge);
			if (est < R.routeInside[0] - 2 || est > R.routeInside[1] - 1) { this.pw('rq3'); continue; }
			const mid = add(lerp2(Qr, Gp, rng.range(0.4, 0.6)), norm(-(Gp.z - Qr.z), Gp.x - Qr.x), rng.range(-3, 3));
			const smooth = smoothPath([[G.x, G.z], [P1.x, P1.z], [Qr.x, Qr.z], [mid.x, mid.z], [Gp.x, Gp.z], [Ge.x, Ge.z]], 2.5);
			const pts = causeway.concat(smooth), line = new Line(pts), inside = line.length - causeL;
			if (inside < R.routeInside[0] + 0.5 || inside > R.routeInside[1] - 0.5) { this.pw('rq4'); continue; }
			let dry = true;
			for (let s = causeL + 0.5; s <= line.length && dry; s += 1) { const p = line.at(s); if (dist(p, G) > R.routeClearGate && dist(p, Lg) > R.routeClearLych && this.innerDist(p) < half + 1.7) dry = false; }
			if (!dry) { this.pw('rq5'); continue; }
			if (this.osricPost && this.items.some((it) => it.tag === 'post' && (it.hull ? segPolyLine(pts, it.hull, R.routeWidth / 2 + 0.3) || segPolyLine(pts, it.fp.pts, R.routeWidth / 2 + 0.7) : false))) { this.pw('rq6'); continue; } // no camera shadow of the post on the route
			if (this.osricNpc && pts.some((q, i) => i && segDist(this.osricNpc.x, this.osricNpc.z, pts[i - 1], q) < R.npcRadius + R.routeWidth / 2 + R.npcOffRoute)) { this.pw('rq7'); continue; }
			this.route = { rs, E0, C: pt(G), Q, Qr, gc: Lg, Gp, Ge, pts, line, causewayLength: causeL, causeway: cn };
			break;
		}
		return !!this.route;
	}

	// ---- Osric's watch post just inside the main gate, on the back side of the route, facing it
	placeOsric() {
		const rng = this.S('osric'), G = this.gates.main.at, inn = this.gates.main.inward, al = { x: inn.z, z: -inn.x }, side = al.x + al.z < 0 ? 1 : -1; // lateral side toward the back
		for (let k = 0; k < 160; k++) {
			const east = this.gateEdge === 'W', p = add(add(G, al, (east ? -side : side) * (east ? rng.range(8.4, 10.4) : rng.range(5.4, 7.8))), inn, // a west lychgate is approached along the south of the ring: the post stands on the other side of the gate
				 this.wt.depth / 2 + R.wallClear + 1.75 + rng.range(0, 1.8));
			if (dist(p, G) > R.osricFromGate) continue; // the post stands just inside the gate (the thresholds check): a west lychgate draws up to 12.6 m, so those draws are skipped
			const yaw = clampYaw(yawFacing(G.x - p.x + inn.x * 2, G.z - p.z + inn.z * 2) + rng.range(-0.25, 0.25));
			const m = this.mass('A15.6', "Osric's watch post", p, yaw, { kind: 'building', prefix: 'osric-post' });
			const npc = this.npc('osric', 'Osric', add(p, front(yaw), m.footprint.d / 2 + 1.7), m.id);
			if (this.place(m, { wm: 1.0, brings: [npc.shape], owner: m.id, tag: 'post' })) { this.commit(npc); this.osricPost = m; this.osricNpc = npc.npc.at; return true; }
		}
		return false;
	}

	/** Barrow vault door: lane to the route (the vault pieces are wall pieces of the back wall). */
	placeVault() {
		const V = this.gates.vault, vd = this.gates.vaultDoor, G = this.gates.main.at, Lg = this.gates.lych.at, f = front(V.yaw), spur0 = add(vd.at, f, 1.2);
		const rl = this.route.line;
		const mine = new Set(this.wallDefs.filter((q) => q.kind === 'vault' || q.kind === 'wing').map((q) => q.mass.id));
		// the lane meets the route at the nearest point that it can reach without crossing the square, a mass or a camera shadow — straight, or
		// bent once at a waypoint (4 m grid) when a straight lane has no way through
		const clearSeg = (p, q) => segDist(this.route.Q.x, this.route.Q.z, p, q) >= this.route.rs + 8 // the ring around the square is kept for the forge, the bell frame, the board and the stall
			&& !this.items.some((it) => !mine.has(it.m.id) && segPolyDistance(p, q, it.fp.pts) < R.laneWidth / 2 + R.laneClear + 0.2) && !this.hulls.some((h) => segPolyDistance(p, q, h) < R.laneWidth / 2)
			&& !this.block.some((r) => (r.tag === 'door' || r.tag === 'npc' || r.tag === 'walkway') && r.id !== 'vault-door' && shapeGap(r, makeObb((p.x + q.x) / 2, (p.z + q.z) / 2, dist(p, q) / 2, R.laneWidth / 2, Math.atan2(-(q.z - p.z), q.x - p.x)).pts) < 0.3);
		const cands = [];
		for (let s = this.route.causewayLength; s <= rl.length; s += 1.5) { const p = rl.at(s); if (dist(p, G) >= 6 && dist(p, Lg) >= 8 && dist(p, this.route.Q) >= this.route.rs + 8) cands.push({ ...p, d: dist(p, spur0) }); }
		cands.sort((p, q) => p.d - q.d);
		let near = null, via = null;
		for (const c of cands) { if (c.d > R.vaultFromRoute) break; if (clearSeg(spur0, c)) { near = c; break; } }
		if (!near) {
			const { cx, cz } = this.ringC, { W, H } = this.ringBox, ok = [];
			for (let x = cx - W / 2 + 4; x <= cx + W / 2 - 4; x += 4) for (let z = cz - H / 2 + 4; z <= cz + H / 2 - 4; z += 4) {
				const w = { x, z };
				if (this.innerDist(w) < this.wt.depth / 2 + 2.5 || dist(w, spur0) > R.vaultFromRoute || !clearSeg(spur0, w)) continue;
				ok.push({ ...w, d: dist(spur0, w) });
			}
			let best = Infinity;
			for (const w of ok) for (const c of cands) {
				const total = w.d + dist(w, c);
				if (total >= best || total > R.vaultFromRoute + 8 || !clearSeg(w, c)) continue;
				best = total; near = c; via = w;
			}
		}
		if (!near) { this.pw('vaultnone'); return false; }
		const pts = via ? [spur0, via, near] : [spur0, near];
		this.addPath({ id: 'lane-vault', kind: 'trail', width: R.laneWidth, points: pts.map(pt) });
		for (let i = 0; i + 1 < pts.length; i++) { const lane = capsule(pts[i], pts[i + 1], R.laneWidth / 2, { tag: 'lane', clear: R.laneClear }); this.block.push({ ...lane, owner: null }); this.keep.push(lane); }
		this.vault = { edge: V.edge, v: r2(lateralOf(V.edge === 'N' ? 'N' : 'W', V.at)), mass: V.mass };
		return true;
	}

	/** The hill lane outside the lychgate to the map edge. */
	placeHillLane() {
		const Lg = this.gates.lych.at, out = { x: -this.gates.lych.inward.x, z: -this.gates.lych.inward.z }, h = this.h;
		const start = add(Lg, out, SIZE('A02.1')[2] / 2 + 1.4), end = this.gateEdge === 'N' ? { x: Lg.x, z: -h + R.edgeInset } : { x: -h + R.edgeInset, z: Lg.z };
		this.hill = { start: pt(start), end: pt(end) };
		this.paths.push({ id: 'hill-trail', kind: 'trail', width: 2.4, points: [pt(start), pt(end)], inhabited: true });
	}

	// ---- Edda's pond and house inside the ring
	makePond() {
		const rng = this.S('pond'), { Q, rs, line } = this.route, dEdda = SIZE('A01.1'), half = this.wt.depth / 2, G = this.gates.main.at, { cx, cz } = this.ringC, { W, H } = this.ringBox;
		for (let k = 0; k < 600; k++) {
			this.tries++;
			const [a, yaw] = rng.weighted([[SE, Math.PI / 4, 0.5], [{ x: 0, z: 1 }, 0, 0.25], [{ x: 1, z: 0 }, Math.PI / 2, 0.25]], (q) => q[2]);
			const rpa = rng.range(2.3, 3.0), rpb = rng.range(2.8, 3.6), g = 1.3;
			const e = rng.pick(this.ringEdges.filter((q) => q.id === 'N' || q.id === 'W'));
			const H0 = add(add(e.a, e.t, e.len * (e.id === 'N' ? rng.range(0.04, 0.5) : rng.range(0.5, 0.96))), e.n, half + R.wallClear + dEdda[2] / 2 + rng.range(0, 5));
			if (dist(H0, Q) < rs + 11 || dist(H0, Q) > 28 || this.innerDist(H0) < half + R.wallClear + 2.7) { this.pw(1); continue; }
			const Pc = add(H0, a, dEdda[2] / 2 + g + rpa), perp = { x: -a.z, z: a.x };
			const poly = [];
			for (let i = 0; i < 20; i++) {
				const t = (i / 20) * TAU, rr = 1 + (vnoise(i * 1.7 + k, 3.3, this.seed & 255) - 0.5) * 0.22;
				poly.push(pt({ x: Pc.x + a.x * Math.cos(t) * rpa * rr + perp.x * Math.sin(t) * rpb * rr, z: Pc.z + a.z * Math.cos(t) * rpa * rr + perp.z * Math.sin(t) * rpb * rr }));
			}
			const S0 = add(Pc, a, rpa + 1.5), door = add(H0, a, dEdda[2] / 2 + 0.15);
			if (![...poly, S0].every((p) => this.innerDist(p) > half + 2.2)) { this.pw(2); continue; }
			if (line.nearest(Pc.x, Pc.z).d < Math.max(rpa, rpb) + 2.6 || dist(Pc, Q) < rs + Math.max(rpa, rpb) + 5.5) { this.pw(4); continue; }
			const near = line.nearest(S0.x, S0.z);
			if (near.d > 20 || near.d < 3 || segDist(Q.x, Q.z, S0, near) < rs + 1.3 || dist(G, S0) < 6 || near.s < this.route.causewayLength + 4) { this.pw(5); continue; }
			let wet = false;
			for (let t = 0; t <= 1; t += 0.1) { const q = lerp2(S0, near, t); if (pondContains(poly, q.x, q.z)) wet = true; }
			if (wet) { this.pw(6); continue; }
			if (this.items.some((it) => !(it.tag === 'wall') && (poly.some((p) => pointPolySigned(it.fp.pts, p.x, p.z) < 1.0) || pointPolySigned(it.fp.pts, Pc.x, Pc.z) < 1.0))) { this.pw(7); continue; }
			if (this.block.some((r) => r.tag === 'lane' && segDist(Pc.x, Pc.z, r.a, r.b) < Math.max(rpa, rpb) + 1.5)) { this.pw(7); continue; }
			const fp = makeObb(H0.x, H0.z, dEdda[0] / 2, dEdda[2] / 2, yaw), hull = shadowOf(fp, dEdda[1]);
			let hidden = false;
			for (let i = 0; i + 1 < this.route.pts.length && !hidden; i++) if (segPolyDistance(this.route.pts[i], this.route.pts[i + 1], hull) < R.routeWidth / 2 + 0.3) hidden = true;
			if (hidden || pointPolySigned(hull, Q.x, Q.z) < rs * 0.62 + 0.5) { this.pw(8); continue; }
			const eh = this.mass('A01.1', "Edda's house", H0, yaw, { kind: 'building', prefix: 'edda-house' }), edr = this.door(eh, 'door', R.doorCottage, { id: 'edda-door' });
			if (this.fits(eh, { wm: 1.0, brings: [edr.shape], owner: eh.id, passRoute: true }) || this.items.some((it) => segPolyDistance(S0, near, it.fp.pts) < 1.2)) { this.pw(9); continue; }
			this.pond = { poly, c: Pc, a, yaw, rpa, rpb, H: H0, S0, door, g };
			return true;
		}
		return false;
	}

	/** The mass must stand inside the ring and keep wallClear (2.5 m) from every wall piece (and every brought door corridor / NPC circle ≥ 0.15 m). */
	fits(m, o = {}) {
		const why = super.fits(m, o);
		if (why) return why;
		if (!this.wallItems.length) return null;
		const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw), clear = o.wallClear ?? wallClearOf(m);
		if (this.innerDist({ x: fp.cx, z: fp.cz }) < 0) return 'outside-ring';
		for (const w of this.wallItems) {
			if (fp.x1 < w.fp.x0 - clear || fp.x0 > w.fp.x1 + clear || fp.z1 < w.fp.z0 - clear || fp.z0 > w.fp.z1 + clear) continue;
			if (obbSeparation(fp, w.fp) < clear) return 'wall';
		}
		return null;
	}

	// ---- stilt cottages: along the walls (back walls first: their camera shadow falls outside the ring), every door faces into the ring.
	// Candidates are a seeded lattice along the wall lines (u along the wall, three inward offsets); the first fit wins, so a wall fills up densely.
	placeCottages() {
		const rng = this.S('cottages'), { Q } = this.route, n = this.cottagesDrawn - 1, [, , cd] = SIZE('A01.1'), half = this.wt.depth / 2;
		const style = rng.weighted([['band', 0.4], ['split', 0.35], ['corner', 0.25]], (q) => q[1])[0];
		this.style = style;
		const edge = (id) => this.ringEdges.find((e) => e.id === id);
		const shuffle = (list) => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };
		const lattice = (e, lo = 0.04, hi = 0.96, offs = [0, 1.5, 3.2]) => { const out = []; for (let u = lo; u <= hi; u += 0.035) for (const o of offs) out.push({ e, u: u + rng.range(-0.01, 0.01), o }); return shuffle(out); };
		const deep = [6, 9, 12]; // a second row of cottages further in, behind the first
		const N = edge('N'), Wd = edge('W'), S = edge('S'), E = edge('E');
		let list;
		if (style === 'band') { const first = rng.pick([N, Wd]); const second = first === N ? Wd : N; list = [...lattice(first), ...lattice(second), ...lattice(first, 0.04, 0.96, deep), ...lattice(second, 0.04, 0.96, deep), ...lattice(S, 0.5), ...lattice(E, 0, 0.5)]; }
		else if (style === 'split') { const a = lattice(N), b = lattice(Wd), c = lattice(S, 0.5), d = lattice(E, 0, 0.5); list = []; for (let i = 0; i < a.length; i++) list.push(a[i], b[i], c[i] ?? a[i], d[i] ?? b[i]); list.push(...lattice(N, 0.04, 0.96, deep), ...lattice(Wd, 0.04, 0.96, deep)); }
		else list = [...lattice(N, 0.04, 0.5).sort((p, q) => p.u - q.u), ...lattice(Wd, 0.5, 0.96).sort((p, q) => q.u - p.u), ...lattice(N, 0.5), ...lattice(Wd, 0, 0.5), ...lattice(N, 0.04, 0.96, deep), ...lattice(Wd, 0.04, 0.96, deep), ...lattice(S, 0.5), ...lattice(E, 0, 0.5)];
		let placed = 0;
		for (let k = 0; k < n; k++) {
			for (const c of list) {
				const p = add(add(c.e.a, c.e.t, c.e.len * c.u), c.e.n, half + R.wallClear + cd / 2 + c.o), yaw = clampYaw(c.e.yawIn + (c.o === 0 ? 0 : rng.range(-0.1, 0.1)));
				if (dist(p, Q) < this.route.rs + 6) continue; // the ring around the square belongs to the forge, the bell frame, the board and the stall
				const m = this.mass('A01.1', k === 0 ? "Gennet Barrow's cottage" : 'Stilt cottage', p, yaw, { kind: 'building', prefix: 'cottage' });
				const dr = this.door(m, 'door', R.doorCottage, { id: `door-${m.id}`, poppy: true });
				if (this.place(m, { wm: 0.9, gap: 0.9, brings: [dr.shape], owner: m.id, tag: 'cottage' })) { this.commit(dr); placed++; break; }
			}
		}
		this.cottageCount = placed;
	}

	// ---- water-edge life at the inner pond: eel rack on a jetty, willows, net, peat, barrels, barrow, washing line, goods, hurdle fences, bone pile
	placeJetty() {
		const rng = this.S('jetty'), P = this.pond;
		const land = new Line(this.route.pts.slice(this.route.causeway));
		for (let k = 0; k < 260 && !this.jetty; k++) {
			const ang = rng.pick([-1, 1]) * rng.range(0.9, 1.7), cs = Math.cos(ang), sn = Math.sin(ang);
			let dirOut = norm(-P.a.x * cs + P.a.z * sn, -P.a.x * sn - P.a.z * cs), rr = 0;
			while (pointInPoly(P.poly, P.c.x + dirOut.x * rr, P.c.z + dirOut.z * rr)) rr += 0.1;
			const shore = add(P.c, dirOut, rr);
			dirOut = { x: -dirOut.x, z: -dirOut.z }; // toward the water
			const root = add(shore, dirOut, -1.0), tip = add(shore, dirOut, R.walkwayModule - 0.4);
			let link = land.nearest(root.x, root.z);
			if (this.edda) { const l2 = new Line(this.edda.lane).nearest(root.x, root.z); if (l2.d < link.d) link = l2; }
			const to = add(link, norm(root.x - link.x, root.z - link.z), 0);
			if (dist(root, to) > 14) { this.pw('j1'); continue; }
			if (this.items.some((it) => segPolyDistance(root, to, it.fp.pts) < R.laneWidth / 2 + R.laneClear + 0.2)) { this.pw('j4'); continue; }
			if (this.innerDist(root) < this.wt.depth / 2 + 2.0 || this.innerDist(tip) < this.wt.depth / 2 + 2.0) { this.pw('j3'); continue; }
			const side = { x: -dirOut.z, z: dirOut.x }, rp = add(add(shore, dirOut, -rng.range(1.7, 2.6)), side, rng.pick([-1, 1]) * rng.range(3.8, 4.8));
			const [rw, rh, rd] = SIZE('A01.6');
			const rack = this.mass('A01.6', 'Eel-trap rack', rp, clampYaw(yawFacing(dirOut.x, dirOut.z)), { kind: 'prop', prefix: 'eel-rack', w: rw * R.rackScale, d: rd * R.rackScale, h: rh * R.rackScale });
			const capL = capsule(root, to, R.laneWidth / 2, { tag: 'lane', clear: R.laneClear });
			const capJ = capsule(root, tip, R.walkwayWidth / 2, { tag: 'walkway', clear: R.laneClear }), nb = this.block.length, nk = this.keep.length;
			this.block.push(capJ, capL); this.keep.push(capJ, capL);
			if (!this.place(rack, { tag: 'rack', wm: 0.4 })) { this.block.length = nb; this.keep.length = nk; continue; }
			this.addPath({ id: 'jetty', kind: 'trail', width: R.walkwayWidth, points: [pt(root), pt(tip)], deck: true, jetty: true });
			this.addPath({ id: 'lane-jetty', kind: 'trail', width: R.laneWidth, points: [pt(root), pt(to)] });
			this.jetty = { root: pt(root), tip: pt(tip), rack: rack.id, at: 'pond' };
		}
		if (!this.jetty) this.unplaced.push('jetty');
		const pr = Math.max(P.rpa, P.rpb);
		let w = 0;
		for (let k = 0; k < 700 && w < 2 && !(w >= 1 && k > 350); k++) {
			const wa = Math.atan2(-1, -1) + rng.range(-1.7, 1.7), p = add(P.c, { x: Math.cos(wa), z: Math.sin(wa) }, pr + rng.range(1.9, 5.5)); // a willow's shadow falls to the north-west
			const m = this.mass('A04.2', 'Young willow', p, rng.range(0, TAU), { kind: 'tree', prefix: 'willow', w: 2.2, d: 2.2 });
			if (this.wd.at(p.x, p.z) < 1.6 || this.wd.at(p.x, p.z) > 4.6) continue;
			if (this.place(m, { wm: 1.0, crown: 1.5, tag: 'willow' })) w++;
		}
		if (w < 1) this.unplaced.push('willows');
		this.willows = w;
	}

	placeLife() {
		const rng = this.S('life'), P = this.pond, pr = Math.max(P.rpa, P.rpb);
		const cottages = this.items.filter((it) => it.tag === 'cottage');
		const near = (it, sd, off) => {
			const f = front(it.m.yaw), r = { x: f.z, z: -f.x };
			return add(add(it.m.at, r, sd * (it.m.footprint.w / 2 + off)), f, rng.range(-1.6, 1.6));
		};
		const walls = this.ringEdges.filter((e) => ['N', 'W', 'S', 'E'].includes(e.id));
		const dress = (glb, label, count, o = {}) => {
			let n = 0;
			for (let k = 0; k < 260 && n < count; k++) {
				// beside a cottage; after 120 tries also along the wall lines (a washing line, a fence, a barrow against the wall)
				let p, yaw;
				if (k < 120 && cottages.length) { const it = rng.pick(cottages); p = near(it, rng.sign(), rng.range(o.off0 ?? 1.0, o.off1 ?? 3.4)); yaw = it.m.yaw + rng.range(-0.3, 0.3) + (o.turn ?? 0); }
				else { const e = rng.pick(walls); p = add(add(e.a, e.t, e.len * rng.range(0.05, 0.95)), e.n, this.wt.depth / 2 + rng.range(0.8, 3.2)); yaw = e.yawIn + (o.turn ? Math.PI / 2 : 0) + rng.range(-0.3, 0.3); }
				const m = this.mass(glb, label, p, yaw, { kind: o.kind ?? 'prop', prefix: o.prefix, collision: o.collision });
				if (this.place(m, { gap: o.gap ?? 0.6, wm: o.wm ?? 0.6, tag: o.prefix, noShadow: o.noShadow })) n++;
			}
			return n;
		};
		this.dressed = {
			barrels: dress('N03', 'Rain barrel', rng.int(2, 3), { prefix: 'barrel', gap: 0.3 }),
			peat: dress('N04', 'Peat stack', rng.int(2, 4), { prefix: 'peat-stack', gap: 0.3 }),
			barrow: dress('N12', 'Peat barrow', 1, { prefix: 'peat-barrow', collision: false, gap: 0.3 }),
			washing: dress('N06', 'Washing line', 1, { prefix: 'washing-line', collision: false, gap: 0.3, off0: 2.4, off1: 3.4, turn: Math.PI / 2 }),
			net: 0,
		};
		for (let k = 0; k < 500 && !this.dressed.net; k++) {
			const p = add(P.c, norm(rng.range(-1, 1), rng.range(-1, 1)), pr + rng.range(1.5, 4.0));
			const m = this.mass('N07', 'Drying net', p, rng.range(0, TAU), { prefix: 'drying-net', collision: false });
			if (this.place(m, { gap: 0.5, wm: 1.2, tag: 'net' })) this.dressed.net = 1;
		}
		if (this.stall) {
			const f = front(this.stall.yaw), r = { x: f.z, z: -f.x };
			for (let k = 0; k < 20; k++) {
				const p = add(add(this.stall.at, r, rng.pick([-1, 1]) * (SIZE('A15.5')[0] / 2 + 1.1)), f, rng.range(-0.6, 0.8));
				const m = this.mass('N08', 'Village goods', p, this.stall.yaw + rng.range(-0.3, 0.3), { prefix: 'goods' });
				if (this.place(m, { gap: 0.4, tag: 'goods' })) { this.dressed.goods = 1; break; }
			}
		}
		const fences = dress('A01.4', 'Willow hurdle fence', rng.int(...R.fenceRuns), { prefix: 'hurdle-fence', kind: 'wall', noShadow: true, gap: 0.3, wm: 0.8, turn: Math.PI / 2, off0: 1.6, off1: 3.4 });
		this.dressed.fences = fences;
		if (this.vault) {
			const V = this.gates.vault, f = front(V.yaw), r = { x: f.z, z: -f.x };
			for (let k = 0; k < 40; k++) {
				const p = add(add(V.at, f, 4.6 + rng.range(0, 1.8)), r, rng.sign() * rng.range(3.0, 6.5));
				const m = this.mass('bone-pile', 'Bone pile (skulls to count)', p, V.yaw + rng.range(-0.4, 0.4), { prefix: 'bone-pile' });
				if (this.place(m, { gap: 0.6, tag: 'bones' })) { this.dressed.bones = 1; break; }
			}
		}
	}

	/** The rim items of the square stand on the side away from the route (where it enters and leaves the square), turned toward the north-west. */
	rimAway() {
		const { Q } = this.route, near = this.route.pts.slice(this.route.causeway).filter((p) => dist(p, Q) < 14);
		for (const path of this.paths) if (path.id.startsWith('lane')) for (let i = 0; i + 1 < path.points.length; i++) for (let s = 0; s <= 1; s += 0.1) { const p = lerp2(path.points[i], path.points[i + 1], s); if (dist(p, Q) < 16) near.push(p); }
		const mx = near.reduce((s, p) => s + p.x, 0) / near.length, mz = near.reduce((s, p) => s + p.z, 0) / near.length, a = norm(Q.x - mx, Q.z - mz);
		return norm(a.x + NW.x * 0.8, a.z + NW.z * 0.8);
	}

	makeRise() {
		const { cx, cz } = this.ringC;
		this.relief = 0.65; // a pond is a bowl of 0.65 m below its banks, wherever the banks stand on the hill
		return (x, z) => (1 - sm(-26, 12, ((x - cx) + (z - cz)) * Math.SQRT1_2)) * (1 - sm(0, 6, this.sdf(x, z))); // the hill fades out over the fen water around the bank
	}

	build() {
		if (!this.makeRing()) { this.notes.push('no ring ' + JSON.stringify(this.why)); return null; }
		this.makeWallDefs();
		if (!this.makeLand()) { this.notes.push('no land'); return null; }
		const grid = () => new DistGrid({ x0: -this.h - 4, z0: -this.h - 4, x1: this.h + 4, z1: this.h + 4 }, 0.5, (x, z) => this.isWater(x, z) || (!!this.pond && pondContains(this.pond.poly, x, z)));
		this.wd = grid();
		this.placeWalls();
		// Osric's post first, then the route that keeps clear of its shadow and its NPC circle; another post position when no route fits
		const base = this.snapshot();
		let routed = false;
		for (let r = 0; r < 8 && !routed; r++) {
			this.round = r;
			if (r) { this.restore(base); this.osricPost = null; this.osricNpc = null; }
			const placed = this.placeOsric();
			routed = this.makeRoute();
			if (!routed && !placed) break;
			if (routed && !placed) this.unplaced.push('osric');
		}
		this.round = 0;
		if (!routed) { this.notes.push('no route ' + JSON.stringify(this.why)); return null; }
		const rc = this.route.pts;
		for (let i = 0; i + 1 < rc.length; i++) {
			const c = capsule(rc[i], rc[i + 1], R.routeWidth / 2, { tag: 'route', clear: R.routeClear, pass: dist(lerp2(rc[i], rc[i + 1], 0.5), this.gates.lych.at) < 9 || dist(lerp2(rc[i], rc[i + 1], 0.5), this.gates.main.at) < 6 });
			this.block.push(c); this.keep.push(c);
		}
		if (!this.placeVault()) this.unplaced.push('vault');
		this.placeHillLane();
		const gotPond = this.makePond();
		this.wd = grid();
		if (gotPond) {
			const P = this.pond, near = this.route.line.nearest(P.S0.x, P.S0.z), end = add(P.door, front(P.yaw), 1.0);
			const wc = capsule(pt(P.S0), pt(end), R.walkwayWidth / 2, { tag: 'walkway', clear: R.laneClear, pass: true }), lc = capsule(pt(P.S0), pt(near), R.laneWidth / 2, { tag: 'lane', clear: R.laneClear, pass: true });
			this.block.push(wc, lc); this.keep.push(wc, lc);
			this.placeEdda();
		} else this.unplaced.push('edda');
		if (this.pond) this.phase(() => { this.jetty = null; this.willows = 0; this.placeJetty(); }, () => (this.jetty && this.willows >= 2 ? 1 : this.jetty && this.willows >= 1 ? 0.9 : 0), 4);
		const u0 = this.unplaced.length;
		this.reserveSquare();
		const nCot = () => this.masses.filter((m) => m.glb === 'A01.1').length;
		this.phase(() => { this.placeSquare(); }, () => (this.unplaced.length === u0 ? 1 : 0), 6);
		this.cottagesDrawn = R.cottagesWalled[0] + (new Stream(hash32(this.seed, this.attempt, 'hub-cottage-count')).chance(R.cottageFive) ? 1 : 0); // drawn per attempt, not per round: the rounds chase the same count
		this.phase(() => { this.placeCottages(); }, () => Math.min(1, nCot() / this.cottagesDrawn), 3);
		if (this.pond) this.phase(() => { this.dressed = null; this.placeLife(); }, () => (this.dressed?.net ? 1 : 0), 3);
		this.makeGround();
		return this.assemble();
	}

	assemble() {
		const plan = super.assemble(), ringEdges = this.ringEdges, wt = this.wt, mods = this.masses.filter((m) => m.tag === 'wall');
		plan.id = `gen-hub-${this.size}-s${this.seed}`;
		const lg = this.gates.lych, G = this.gates.main, line = this.route.line, inside = line.length - this.route.causewayLength, sSq = line.nearest(this.route.Qr.x, this.route.Qr.z).s;
		plan.exits = [{ id: 'causeway', edge: 'S', at: pt(this.route.E0), to: 'Night Fens (the dike road)' }, { id: 'lychgate', edge: this.gateEdge, at: this.hill.end, to: 'Churchyard' }];
		plan.meta.route = {
			length: r2(inside), walkS: r2(inside / R.walkSpeed), runS: r2(inside / R.runSpeed), total: r2(line.length), causeway: r2(this.route.causewayLength), toSquare: r2(sSq - this.route.causewayLength), squareToGate: r2(line.length - sSq), causewayToSquare: r2(dist(this.route.C, this.route.Q)),
		};
		plan.meta.cottages = this.masses.filter((m) => m.glb === 'A01.1').length;
		const count = {};
		for (const m of mods) count[m.piece] = (count[m.piece] ?? 0) + 1;
		let stretch = 0;
		for (const e of ringEdges) stretch = Math.max(stretch, Math.abs(e.fill.f / wt.module - 1));
		plan.hub = {
			...plan.hub, layout: 'walled', transposed: false, inEdge: 'S', gateEdge: this.gateEdge, familyRound: this.familyRound, side: 'E', back: this.gateEdge === 'N' ? 'W' : 'N',
			ring: { poly: this.ringPoly.map(pt), W: r2(this.ringBox.W), H: r2(this.ringBox.H), style: this.ringStyle, corners: this.ringTypes.slice(), centre: pt({ x: this.ringC.cx, z: this.ringC.cz }) },
			wall: { type: this.wallType, glb: wt.glb, module: wt.module, depth: wt.depth, height: wt.h, frontPolicy: 'fade', stretch: r2(stretch), pieces: count, fade: mods.filter((m) => m.fade).length, total: mods.length },
			gates: { main: { at: pt(G.at), edge: 'S', opening: R.gateOpening }, lychgate: { at: pt(lg.at), edge: lg.edge }, vault: { at: pt(this.gates.vault.at), edge: this.gates.vault.edge } },
			hill: this.hill,
			margins: Object.fromEntries(Object.entries(this.margins).map(([k, v]) => [k, r2(v)])),
		};
		plan.hub.waterSides = ['N', 'S', 'W', 'E'];
		if (this.transposed) transposePlan(plan);
		return plan;
	}
}

/** Mirror a canonical plan about the camera axis (x ↔ z): S ↔ E, N ↔ W; every yaw becomes π/2 − yaw. */
function transposePlan(plan) {
	const sp = (p) => ({ x: p.z, z: p.x }), E = { N: 'W', W: 'N', S: 'E', E: 'S' }, ty = (y) => r2(wrapPi(Math.PI / 2 - y)), g = plan.ground;
	plan.ground = (x, z) => g(z, x);
	for (const m of plan.masses) { m.at = sp(m.at); m.yaw = ty(m.yaw); }
	for (const d of plan.doors) { d.at = sp(d.at); d.yaw = ty(d.yaw); }
	for (const i of plan.interactions) i.at = sp(i.at);
	for (const p of plan.paths) p.points = p.points.map(sp);
	for (const w of plan.water) { w.polygon = w.polygon.map(sp); if (polyArea(w.polygon) < 0) w.polygon.reverse(); }
	for (const z of plan.zones) z.shape = { ...z.shape, x: z.shape.z, z: z.shape.x };
	plan.square = { x: plan.square.z, z: plan.square.x, r: plan.square.r };
	for (const e of plan.exits) { e.at = sp(e.at); e.edge = E[e.edge]; }
	plan.start = sp(plan.start);
	const h = plan.hub;
	h.transposed = true;
	h.inEdge = E[h.inEdge]; h.gateEdge = E[h.gateEdge]; h.side = E[h.side]; h.back = E[h.back];
	h.inset = { N: h.inset.W, W: h.inset.N, S: h.inset.E, E: h.inset.S };
	h.margins = { N: h.margins.W, W: h.margins.N, S: h.margins.E, E: h.margins.S };
	h.waterSides = h.waterSides.map((e) => E[e]);
	h.causeway.from = sp(h.causeway.from); h.causeway.to = sp(h.causeway.to);
	if (h.pond) h.pond.c = sp(h.pond.c);
	if (h.edda) h.edda.walkway = h.edda.walkway.map(sp);
	if (h.jetty) { h.jetty.root = sp(h.jetty.root); h.jetty.tip = sp(h.jetty.tip); }
	if (h.vault) h.vault.edge = E[h.vault.edge];
	h.ring.poly = h.ring.poly.map(sp).reverse(); h.ring.centre = sp(h.ring.centre); [h.ring.W, h.ring.H] = [h.ring.H, h.ring.W];
	const [cNW, cNE, cSE, cSW] = h.ring.corners; h.ring.corners = [cNW, cSW, cSE, cNE]; // x ↔ z swaps the NE and SW corners
	const gt = h.gates;
	gt.main = { ...gt.main, at: sp(gt.main.at), edge: E[gt.main.edge] }; gt.lychgate = { ...gt.lychgate, at: sp(gt.lychgate.at), edge: E[gt.lychgate.edge] }; gt.vault = { ...gt.vault, at: sp(gt.vault.at), edge: E[gt.vault.edge] };
	h.hill = { start: sp(h.hill.start), end: sp(h.hill.end) };
}


const lerp2 = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });

/** One seed → a complete hub plan. `attempt` re-rolls every stream (generateHubMap retries). Never throws on a bad layout: the checks say what is wrong. */
export function generateHubPlan(seed, { size = R.size, attempt = 0, layout = 'walled', familyAttempts = R.familyAttempts } = {}) {
	const hub = layout === 'island' ? new Hub(seed, attempt, size) : new WalledHub(seed, attempt, size, familyAttempts);
	const plan = hub.build();
	if (plan) return plan;
	return { id: `gen-hub-${size}-s${seed}`, seed, failed: true, meta: { generator: HUB_GEN_VERSION, seed, attempt, size, notes: hub.notes, route: null }, bounds: hub.b };
}

/** The ground of a plan on a coarse grid, as plain numbers (determinism tests compare this instead of the closure). */
export function hubGroundGrid(plan, step = 4) {
	const out = [], b = plan.bounds;
	for (let z = b.z0; z <= b.z1; z += step) for (let x = b.x0; x <= b.x1; x += step) {
		const g = plan.ground(x, z);
		out.push([r2(g.height), r2(g.wet), r2(g.grass), r2(g.rock), g.water ? 1 : 0]);
	}
	return out;
}


// ---------------------------------------------------------------------------------------------------------------
// Hub checks: independent of the generator, from the plan alone

const polyOf = (m) => makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw ?? 0);
const isGlb = (m, id) => m.glb === id;
const polyLineDist = (p, pts) => Math.min(...pts.slice(1).map((q, i) => segDist(p.x, p.z, pts[i], q)));
const walkLine = (plan, id) => plan.paths.find((p) => p.id === id);
const edgeMid = (b, e) => (e === 'N' ? { x: 0, z: b.z0 + 1 } : e === 'S' ? { x: 0, z: b.z1 - 1 } : e === 'W' ? { x: b.x0 + 1, z: 0 } : { x: b.x1 - 1, z: 0 });
function nearWater(plan, p) {
	for (let r = 0.5; r <= 6; r += 0.5) for (let a = 0; a < 16; a++) if (plan.ground(p.x + Math.cos((a / 16) * TAU) * r, p.z + Math.sin((a / 16) * TAU) * r).water) return r;
	return Infinity;
}

/** Whether shapes are reached from the start by a 0.4 m flood fill (agent radius 0.35): masses block, water blocks except under a path (but not under `skipPaths`); `each(fn)` visits every reached cell. */
function reachMap(plan, cell = 0.4, skipPaths = []) {
	const b = plan.bounds, nx = Math.ceil((b.x1 - b.x0) / cell), nz = Math.ceil((b.z1 - b.z0) / cell), ar = R.agent;
	const blocked = new Uint8Array(nx * nz), cx = (i) => b.x0 + (i + 0.5) * cell, cz = (j) => b.z0 + (j + 0.5) * cell;
	for (const m of plan.masses) {
		if (m.collision === false) continue;
		const fp = polyOf(m);
		for (let j = Math.max(0, Math.floor((fp.z0 - ar - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((fp.z1 + ar - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((fp.x0 - ar - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((fp.x1 + ar - b.x0) / cell)); i++) if (pointPolySigned(fp.pts, cx(i), cz(j)) < ar) blocked[j * nx + i] = 1;
		}
	}
	const lines = plan.paths.filter((p) => !skipPaths.includes(p.id)).map((p) => ({ pts: p.points, half: p.width / 2 + 0.1 }));
	const onPath = (x, z) => lines.some((l) => { for (let i = 0; i + 1 < l.pts.length; i++) if (segDist(x, z, l.pts[i], l.pts[i + 1]) <= l.half) return true; return false; });
	for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (!blocked[j * nx + i] && plan.ground(cx(i), cz(j)).water && !onPath(cx(i), cz(j))) blocked[j * nx + i] = 1;
	const reached = new Uint8Array(nx * nz), st = plan.paths[0].points[0];
	const si = clamp(Math.floor((st.x - b.x0) / cell), 0, nx - 1), sj = clamp(Math.floor((st.z - b.z0) / cell), 0, nz - 1);
	const queue = new Int32Array(nx * nz);
	let head = 0, tail = 0;
	if (!blocked[sj * nx + si]) { queue[tail++] = sj * nx + si; reached[sj * nx + si] = 1; }
	while (head < tail) {
		const k = queue[head++], i = k % nx, j = (k - i) / nx;
		for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const ni = i + di, nj = j + dj;
			if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || reached[nj * nx + ni] || blocked[nj * nx + ni]) continue;
			reached[nj * nx + ni] = 1;
			queue[tail++] = nj * nx + ni;
		}
	}
	const touches = (shape) => {
		const sb = shape.t === 'circle' ? { x0: shape.x - shape.r, x1: shape.x + shape.r, z0: shape.z - shape.r, z1: shape.z + shape.r } : { x0: Math.min(...shape.pts.map((p) => p.x)), x1: Math.max(...shape.pts.map((p) => p.x)), z0: Math.min(...shape.pts.map((p) => p.z)), z1: Math.max(...shape.pts.map((p) => p.z)) };
		for (let j = Math.max(0, Math.floor((sb.z0 - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((sb.z1 - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((sb.x0 - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((sb.x1 - b.x0) / cell)); i++) {
				const inside = shape.t === 'circle' ? Math.hypot(cx(i) - shape.x, cz(j) - shape.z) <= shape.r : pointInPoly(shape.pts, cx(i), cz(j));
				if (inside && reached[j * nx + i]) return true;
			}
		}
		return false;
	};
	const each = (fn) => { for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (reached[j * nx + i]) fn(cx(i), cz(j)); };
	return { touches, each };
}

/** The ring as edges with inward normals, from the polygon of the plan alone (either winding). */
function ringGeom(plan) {
	const poly = plan.hub.ring.poly, n = poly.length, s = polyArea(poly) > 0 ? 1 : -1;
	return poly.map((a, i) => {
		const b = poly[(i + 1) % n], t = norm(b.x - a.x, b.z - a.z), nn = { x: -t.z * s, z: t.x * s }, o = { x: -nn.x, z: -nn.z };
		const letter = o.z > 0.9 ? 'S' : o.z < -0.9 ? 'N' : o.x > 0.9 ? 'E' : o.x < -0.9 ? 'W' : 'D';
		return { a, b, t, n: nn, len: dist(a, b), letter, front: o.x + o.z };
	});
}
const ringDist = (ring, p) => Math.min(...ring.map((e) => (p.x - e.a.x) * e.n.x + (p.z - e.a.z) * e.n.z));
/** The wall line a point lies on (distance, edge) — the nearest edge segment. */
function wallLineOf(ring, p) {
	let best = null;
	for (const e of ring) { const d = segDist(p.x, p.z, e.a, e.b); if (!best || d < best.d) best = { d, e }; }
	return best;
}

/**
 * Flood the ring interior from `from` with every wall piece dilated by the agent radius (0.35 m, 0.25 m cells): which cells outside the ring are
 * reached, with and without a plug in the main gate opening. `sealed` = the ring is closed once the main gate is plugged; `open` = the gate lets the hero out.
 */
function ringClosure(plan, walls, ring, from, gate) {
	const wt = HUB_WALLS[plan.hub.wall.type], pad = 4, cell = 0.25, ar = R.agent;
	const xs = plan.hub.ring.poly.map((p) => p.x), zs = plan.hub.ring.poly.map((p) => p.z), x0 = Math.min(...xs) - pad - wt.corner.w, z0 = Math.min(...zs) - pad - wt.corner.w;
	const nx = Math.ceil((Math.max(...xs) + pad + wt.corner.w - x0) / cell), nz = Math.ceil((Math.max(...zs) + pad + wt.corner.w - z0) / cell), blocked = new Uint8Array(nx * nz);
	for (const m of walls) {
		const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw);
		for (let j = Math.max(0, Math.floor((fp.z0 - ar - z0) / cell)); j <= Math.min(nz - 1, Math.floor((fp.z1 + ar - z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((fp.x0 - ar - x0) / cell)); i <= Math.min(nx - 1, Math.floor((fp.x1 + ar - x0) / cell)); i++) if (pointPolySigned(fp.pts, x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell) < ar) blocked[j * nx + i] = 1;
		}
	}
	const plug = (x, z) => { const o = { x: x - gate.at.x, z: z - gate.at.z }, f = { x: Math.sin(gate.yaw), z: Math.cos(gate.yaw) }; return Math.abs(o.x * f.z - o.z * f.x) <= R.gateOpening / 2 + 0.3 && Math.abs(o.x * f.x + o.z * f.z) <= 1.2; };
	const run = (plugged) => {
		const seen = new Uint8Array(nx * nz), queue = new Int32Array(nx * nz);
		let head = 0, tail = 0, out = 0;
		const si = Math.floor((from.x - x0) / cell), sj = Math.floor((from.z - z0) / cell);
		queue[tail++] = sj * nx + si; seen[sj * nx + si] = 1;
		while (head < tail) {
			const k = queue[head++], i = k % nx, j = (k - i) / nx;
			if (ringDist(ring, { x: x0 + (i + 0.5) * cell, z: z0 + (j + 0.5) * cell }) < -1.0) out++;
			for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const ni = i + di, nj = j + dj;
				if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || seen[nj * nx + ni] || blocked[nj * nx + ni]) continue;
				if (plugged && plug(x0 + (ni + 0.5) * cell, z0 + (nj + 0.5) * cell)) continue;
				seen[nj * nx + ni] = 1; queue[tail++] = nj * nx + ni;
			}
		}
		return out;
	};
	return { sealedOutside: run(true), openOutside: run(false) };
}

/** Camera shadow of a wall piece onto the walkable interior (m²): grid points of its hull that stand inside the ring clear of the wall faces. */
function interiorShadow(ring, m, depth) {
	const hull = shadowOf(polyOf(m), m.height), hb = polyBoxOf(hull);
	let n = 0;
	for (let x = Math.ceil(hb.x0 * 2) / 2; x <= hb.x1; x += 0.5) for (let z = Math.ceil(hb.z0 * 2) / 2; z <= hb.z1; z += 0.5) if (ringDist(ring, { x, z }) > depth / 2 + 0.2 && pointInPoly(hull, x, z)) n++;
	return n * 0.25;
}

/** The checks that only make sense for the walled layout (spec v2): the ring, the gates, the interior, the route, the front-wall policy, the surroundings, the vault. */
function walledChecks(plan, addc, { b, hub, route, line, find, Q }) {
	const some = (l, n = 6) => l.slice(0, n), ring = ringGeom(plan), walls = plan.masses.filter((m) => m.tag === 'wall'), wt = HUB_WALLS[hub.wall?.type] ?? null;
	const wallFp = walls.map(polyOf), mg = plan.doors.find((d) => d.id === 'main-gate'), gate = find('A02.1')[0];
	let closure = null;
	{
		const bad = [], xs = hub.ring.poly.map((p) => p.x), zs = hub.ring.poly.map((p) => p.z), W = Math.max(...xs) - Math.min(...xs), H = Math.max(...zs) - Math.min(...zs);
		if (!wt) bad.push('wall type is not recorded');
		else {
			if (W < R.wallRing[0] - 0.05 || W > R.wallRing[1] + 0.05 || H < R.wallRing[0] - 0.05 || H > R.wallRing[1] + 0.05) bad.push(`ring ${r2(W)} × ${r2(H)} m outside ${R.wallRing}`);
			const mods = walls.filter((m) => m.piece === 'module');
			if (mods.length < 24 || mods.some((m) => m.glb !== wt.glb || m.kind !== 'wall' || Math.abs((m.footprint.w + R.wallGap) / wt.module - 1) > R.wallStretch + 0.012 || m.footprint.d !== wt.depth || m.height !== wt.h)) bad.push('wall modules do not match the wall type');
			if (hub.wall.frontPolicy !== 'fade') bad.push('front-wall policy');
		}
		if (!mg || !gate) bad.push('gates missing');
		else {
			closure = ringClosure(plan, walls, ring, Q, mg);
			if (closure.sealedOutside !== 0) bad.push(`the ring leaks: ${closure.sealedOutside} cells outside are reached with the main gate plugged`);
			if (closure.openOutside < 200) bad.push('the main gate does not let the hero out');
		}
		// every 45° joint of the ring (clipped / rounded corners) has a joint post that closes the outside V-notch between the two module boxes
		{
			const pl = hub.ring.poly, np = pl.length;
			for (let i = 0; i < np; i++) {
				const a = pl[(i - 1 + np) % np], v = pl[i], c = pl[(i + 1) % np], t1 = norm(v.x - a.x, v.z - a.z), t2 = norm(c.x - v.x, c.z - v.z), turn = Math.acos(clamp(t1.x * t2.x + t1.z * t2.z, -1, 1));
				if (Math.abs(turn - Math.PI / 4) < 0.1 && !walls.some((m) => m.piece === 'joint' && dist(m.at, v) < 0.7)) bad.push(`no joint post at the 45° joint (${r2(v.x)}, ${r2(v.z)})`);
			}
		}
		const mods = walls.filter((m) => m.piece === 'module'), seen = new Set();
		for (const m of walls) { if (m.collision === false || m.kind === undefined) bad.push(`${m.id}: kind`); seen.add(m.piece); }
		for (const need of ['module', 'pier', 'lychgate', 'vault', 'wing']) if (!seen.has(need)) bad.push(`no ${need} piece`);
		addc('ring', `one wall ring of 40–48 m per side (stone town wall or wooden palisade, recorded), closed except the main gate: with the gate plugged the 0.35 m agent cannot get out`, bad.length === 0, { violations: some(bad), type: hub.wall?.type, size: [r2(W), r2(H)], modules: mods.length, closure });
	}
	{
		const bad = [], post = find('A15.6')[0], cw = hub.causeway, [cwMin, cwMax] = R.causewayWalled;
		const [e0, e1] = plan.exits;
		if (!mg || !gate) bad.push('gates');
		else {
			const lm = wallLineOf(ring, mg.at), lg = wallLineOf(ring, gate.at);
			if (!['S', 'E'].includes(lm.e.letter) || lm.e.letter !== hub.inEdge || lm.d > 0.3) bad.push(`the main gate is not on a front wall (${lm.e.letter}, ${r2(lm.d)} m off the line)`);
			if (!['N', 'W'].includes(lg.e.letter) || lg.e.letter !== hub.gateEdge || lg.d > 0.3) bad.push(`the lychgate is not set into a back wall (${lg.e.letter}, ${r2(lg.d)} m off the line)`);
			const d = plan.doors.find((q) => q.id === 'lychgate');
			if (!d || d.kind !== 'gate' || !d.exit || !/Churchyard/.test(d.exit.to)) bad.push('the lychgate door is not the churchyard exit');
			if (walls.filter((m) => m.id !== gate.id && obbSeparation(polyOf(gate), polyOf(m)) < 0.1).length < 2) bad.push('the lychgate is not between two wall pieces');
			if (!post || dist(post.at, mg.at) > R.osricFromGate || ringDist(ring, post.at) <= 0) bad.push("Osric's post is not just inside the main gate");
			if (plan.exits.length !== 2) bad.push('exits');
			else {
				if (e0.edge !== hub.inEdge || kindOfEdge(b, e0.at, 3) !== e0.edge || !['S', 'E'].includes(e0.edge)) bad.push('the causeway exit is not on a front map edge');
				if (e1.edge !== hub.gateEdge || kindOfEdge(b, e1.at, 3) !== e1.edge) bad.push('the lychgate exit is not on its back map edge');
				if (Math.abs(e0.edge === 'S' ? e0.at.x - mg.at.x : e0.at.z - mg.at.z) > 0.5) bad.push('the causeway does not arrive at the gate');
			}
			const hill = walkLine(plan, 'hill-trail');
			if (!hill || dist(hill.points.at(-1), e1.at) > 0.6 || dist(hill.points[0], gate.at) > SIZE('A02.1')[2] / 2 + 1.6) bad.push('no hill lane from the lychgate to the map edge');
			if (cw.segments !== Math.max(1, Math.round(cw.length / R.causewayModule)) || cw.length < cwMin || cw.length > cwMax || dist(cw.to, mg.at) > 0.1) bad.push(`causeway ${cw.length} m / ${cw.segments} segments`);
			const dry = line.cum.every((s, i) => s <= cw.length + 1 || !plan.ground(route.points[i].x, route.points[i].z).water);
			if (!dry) bad.push('the route wets its feet beyond the causeway');
			if (closure && closure.sealedOutside === 0 && closure.openOutside < 200) bad.push('main gate blocked');
		}
		addc('thresholds', "two lit land thresholds only: the main gate in a front wall (S / E; the causeway arrives from the map edge, Osric's post just inside) and the lychgate set into a back wall (N / W; a hill lane leads on to the map edge); no other land opening", bad.length === 0, { violations: some(bad), inEdge: hub.inEdge, gateEdge: hub.gateEdge });
	}
	{
		const bad = [], inside = (p, k = 0) => ringDist(ring, p) >= k;
		for (const m of plan.masses) {
			if (m.tag === 'wall') continue;
			const fp = polyOf(m);
			if (!inside({ x: m.at.x, z: m.at.z }) || fp.pts.some((p) => !inside(p))) { bad.push({ mass: m.id, why: 'outside the ring' }); continue; }
			for (let i = 0; i < walls.length; i++) { const gap = obbSeparation(fp, wallFp[i]); if (gap < wallClearOf(m) - 0.02) { bad.push({ mass: m.id, wall: walls[i].id, gap: r2(gap) }); break; } }
		}
		for (const i of plan.interactions) if (!inside(i.at, 0.5)) bad.push({ npc: i.id });
		for (const d of plan.doors) if (d.id !== 'main-gate' && !inside(d.at, -0.7)) bad.push({ door: d.id });
		const cw = hub.causeway.length;
		for (const p of plan.paths) {
			if (p.id === 'hill-trail') continue;
			let acc = 0;
			for (let i = 0; i < p.points.length; i++) {
				if (i) acc += dist(p.points[i], p.points[i - 1]);
				if (p.id === 'route' && acc <= cw + 0.5) continue;
				if (!inside(p.points[i], p.id === 'route' ? -0.01 : 0.3)) { bad.push({ path: p.id, at: pt(p.points[i]) }); break; }
			}
		}
		const pond = plan.water.find((w) => w.id === 'pond');
		if (pond && pond.polygon.some((p) => !inside(p, 1.5))) bad.push({ water: 'pond' });
		addc('interior', 'every building, prop, NPC point, door and path (but the causeway and the hill lane) lies inside the ring; buildings and every solid mass ≥ 2 m tall keep ≥ 2.5 m from the wall, low solid dressing ≥ 1.0 m', bad.length === 0, { violations: some(bad), masses: plan.masses.length - walls.length });
	}
	{
		const L = line.length, cwl = hub.causeway.length, inside = L - cwl, start = line.nearest(plan.start.x, plan.start.z);
		const ok = inside >= R.routeInside[0] && inside <= R.routeInside[1] && mg && dist(mg.at, Q) <= R.squareFromGate && line.nearest(Q.x, Q.z).d <= Q.r && start.d < 0.5 && Math.abs(plan.meta.route.length - inside) < 0.03 && Math.abs(plan.meta.route.walkS - r2(inside / R.walkSpeed)) < 0.02 && Math.abs(plan.meta.route.runS - r2(inside / R.runSpeed)) < 0.02;
		// v3 (review m1): the route runs gate → square → lychgate: its first point inside the ring is the main gate, it passes the square before the lychgate and ends in the lychgate's door corridor
		const bad = [], lyd = plan.doors.find((d) => d.id === 'lychgate'), end = route.points.at(-1), sQ = line.nearest(Q.x, Q.z).s;
		if (!lyd || pointPolySigned(doorCorridor(lyd).pts, end.x, end.z) > R.routeEndNear) bad.push(`the route ends ${r2(lyd ? pointPolySigned(doorCorridor(lyd).pts, end.x, end.z) : -1)} m from the lychgate door corridor`);
		if (!(sQ > cwl && sQ < L - 1)) bad.push('the order gate → square → lychgate');
		let first = null;
		for (let s = Math.max(0, cwl - 3); s <= L && !first; s += 0.25) { const p = line.at(s); if (ringDist(ring, p) >= 0) first = p; }
		if (!first || !mg || dist(first, mg.at) > 1.5) bad.push('the first point inside the ring is not the main gate');
		const rw = route.width / 2;
		for (const i of plan.interactions) { const gap = line.nearest(i.at.x, i.at.z).d - i.radius - rw; if (gap < R.npcOffRoute - 1e-6) bad.push(`${i.id}: the NPC circle is ${r2(gap)} m from the route corridor`); }
		addc('route', 'main gate → square → lychgate 35–55 m (≈ 22–34 s walking, 9–14 s running): the first point inside the ring is the main gate, then the square, then the lychgate door corridor; the square is on the route and ≤ 24 m from the gate; NPC circles keep ≥ 0.25 m off the route corridor', ok && bad.length === 0, { length: r2(inside), walkS: r2(inside / R.walkSpeed), runS: r2(inside / R.runSpeed), total: r2(L), causeway: r2(cwl), violations: some(bad) });
	}
	{
		// v3 (review M1): the lychgate is the only way from the hub to the hill lane. Flood from the causeway start with the lychgate solid and the hill trail not counted as a path:
		// no dry cell outside the ring is reached beyond the apron at the main gate (≤ 5 m from its centre), so the hill lane (and the Churchyard exit) cannot be walked round the wall
		const bad = [], rm = reachMap(plan, 0.4, ['hill-trail']), hill = walkLine(plan, 'hill-trail');
		let far = 0, lane = 0, at = null;
		if (!mg || !hill) bad.push('gate or hill trail missing');
		else rm.each((x, z) => {
			if (ringDist(ring, { x, z }) > -0.3 || plan.ground(x, z).water || dist({ x, z }, mg.at) <= R.apronReach) return;
			far++; at ??= { x: r2(x), z: r2(z) };
			if (polyLineDist({ x, z }, hill.points) <= hill.width / 2 + 1) lane++;
		});
		if (far) bad.push(`${far} dry cells outside the ring are reached on foot beyond the gate apron (${lane} on the hill lane), first at ${JSON.stringify(at)}`);
		addc('bypass', 'the hero cannot reach (on foot, flood fill from the causeway start with the lychgate solid) any dry ground outside the wall beyond a small apron at the main gate (≤ 5 m from it): not the hill lane behind the lychgate, not the Churchyard exit. Dry ground the hero cannot reach (the 0.25 m footing strip) is not tested here; the acceptance test sweeps it', bad.length === 0, { violations: some(bad), far, lane });
	}
	{
		const bad = [], depth = wt?.depth ?? 1, cells = [];
		let fade = 0;
		for (const m of walls) {
			const area = interiorShadow(ring, m, depth), should = area > R.fadeReach;
			if (Math.abs(area - R.fadeReach) > 0.6 && should !== !!m.fade) bad.push({ wall: m.id, shadowM2: r2(area), fade: !!m.fade });
			if (m.fade) { fade++; cells.push(shadowOf(polyOf(m), m.height)); }
		}
		// share of the interior ground a faded wall hides from the camera (1 m grid)
		const xs = hub.ring.poly.map((p) => p.x), zs = hub.ring.poly.map((p) => p.z);
		let inCells = 0, hid = 0;
		for (let x = Math.min(...xs) + 0.5; x < Math.max(...xs); x += 1) for (let z = Math.min(...zs) + 0.5; z < Math.max(...zs); z += 1) {
			if (ringDist(ring, { x, z }) < depth / 2 + R.wallClear) continue;
			inCells++;
			if (cells.some((h) => pointInPoly(h, x, z))) hid++;
		}
		addc('front-wall', 'one policy: every wall piece whose camera shadow covers > 1 m² of the walkable interior (the front walls S / E and the towers on them) is fade-flagged, the back walls (N / W) stay full height', bad.length === 0 && hub.wall.frontPolicy === 'fade', { violations: some(bad), fade, walls: walls.length, hiddenShare: inCells ? r2(hid / inCells) : 0 });
	}
	{
		const bad = [], g = plan.ground, hh = (b.x1 - b.x0) / 2;
		const e1 = plan.exits[1];
		let dry = 0, far = 0;
		for (const side of ['N', 'S', 'W', 'E']) for (let i = 0; i < 128; i++) {
			const u = -hh + 0.25 + i * 0.5, p = side === 'N' ? { x: u, z: b.z0 + 0.3 } : side === 'S' ? { x: u, z: b.z1 - 0.3 } : side === 'W' ? { x: b.x0 + 0.3, z: u } : { x: b.x1 - 0.3, z: u };
			if (!g(p.x, p.z).water) { dry++; if (dist(p, e1.at) > 3.8) far++; }
		}
		if (far) bad.push(`${far} dry samples on the map edges away from the hill lane`);
		if (!dry) bad.push('no dry lane at the map edge');
		const xs = hub.ring.poly.map((p) => p.x), zs = hub.ring.poly.map((p) => p.z);
		for (const [name, v] of Object.entries({ W: Math.min(...xs) - b.x0, E: b.x1 - Math.max(...xs), N: Math.min(...zs) - b.z0, S: b.z1 - Math.max(...zs) })) if (v < R.sideMargin - 0.05) bad.push(`margin ${name} ${r2(v)} m`);
		const fen = plan.water.find((w) => w.id === 'fen');
		if (!fen || !plan.water.find((w) => w.id === 'pond')) bad.push('fen / pond polygons');
		for (const q of [{ x: hub.ring.centre.x, z: hub.ring.centre.z }]) if (g(q.x, q.z).water) bad.push('the ring interior is water');
		addc('water-sides', 'the ring stands on a peat bank in black fen water: the map edges are water except the dry hill lane behind the lychgate, ≥ 4 m of water on every other side', bad.length === 0, { violations: some(bad), dryEdgeSamples: dry });
	}
	{
		const bad = [], v = find('N01')[0], vd = plan.doors.find((d) => d.id === 'vault-door'), wings = walls.filter((m) => m.piece === 'wing');
		if (!v || !vd || !vd.exit) bad.push('no vault door exit');
		else {
			const lv = wallLineOf(ring, v.at);
			if (!['N', 'W'].includes(lv.e.letter) || lv.d > 0.3) bad.push(`the vault door is not set into a back wall (${lv.e.letter}, ${r2(lv.d)} m)`);
			if (wings.length !== 2 || wings.some((w) => w.glb !== 'N02' || obbSeparation(polyOf(v), polyOf(w)) > 0.1)) bad.push('the vault door is not between two flint retaining wall runs');
			else { const t = lv.e.t, s = wings.map((w) => (w.at.x - v.at.x) * t.x + (w.at.z - v.at.z) * t.z); if (!(s[0] * s[1] < 0)) bad.push('one run each side'); }
			const lane = walkLine(plan, 'lane-vault');
			if (!lane || line.nearest(lane.points.at(-1).x, lane.points.at(-1).z).d > 0.5 || line.nearest(vd.at.x, vd.at.z).d > R.vaultFromRoute) bad.push('the vault door has no lane to the route');
			else if (lane.points.slice(1).reduce((a, q, i) => a + dist(q, lane.points[i]), 0) > R.vaultLane) bad.push(`the vault lane is longer than ${R.vaultLane} m`);
		}
		addc('vault', 'Barrow vault door (N01) set into a back wall between two flint retaining wall runs (N02), an exit, a lane (≤ 44 m long, door ≤ 36 m from the route) to the route', bad.length === 0, { violations: some(bad) });
	}
}

/** Hub checks: every rule of the brief re-derived from the plan. Returns [{ id, rule, pass, details }]. */
export function checkHubPlan(plan) {
	const checks = [];
	const addc = (id, rule, pass, details = {}) => checks.push({ id, rule, pass, details });
	if (plan.failed) return [{ id: 'plan', rule: 'a plan was generated', pass: false, details: { notes: plan.meta.notes } }];
	const b = plan.bounds, h = (b.x1 - b.x0) / 2, hub = plan.hub, route = plan.paths.find((p) => p.id === 'route'), line = new Line(route.points);
	const some = (l, n = 6) => l.slice(0, n);
	const Q = plan.square;
	const cottages = plan.masses.filter((m) => isGlb(m, 'A01.1'));
	const find = (glb) => plan.masses.filter((m) => isGlb(m, glb));
	const doorOf = (m) => plan.doors.find((d) => d.mass === m.id);
	const corridors = plan.doors.map((d) => ({ d, poly: doorCorridor(d).pts }));
	const lineShapes = plan.paths.map((p) => ({ p, caps: p.points.slice(1).map((q, i) => capsule(p.points[i], q, p.width / 2)) }));
	const alongAt = (m, g, edge) => (m.at.x - g.at.x) * ALONG[edge].x + (m.at.z - g.at.z) * ALONG[edge].z;
	const walled = hub.layout === 'walled';

	{
		const bad = [];
		for (const m of plan.masses) { const fp = polyOf(m); if (fp.x0 < b.x0 + 0.5 || fp.x1 > b.x1 - 0.5 || fp.z0 < b.z0 + 0.5 || fp.z1 > b.z1 - 0.5) bad.push(m.id); }
		for (const p of plan.paths) for (const q of p.points) if (Math.abs(q.x) > h + 0.01 || Math.abs(q.z) > h + 0.01) bad.push(p.id);
		for (const i of plan.interactions) if (Math.abs(i.at.x) > h || Math.abs(i.at.z) > h) bad.push(i.id);
		const ids = new Set();
		for (const x of [...plan.masses, ...plan.doors, ...plan.interactions, ...plan.paths]) { if (ids.has(`${x.id}`)) bad.push(`dup:${x.id}`); ids.add(`${x.id}`); }
		addc('bounds', 'every mass, path and NPC point lies inside the 64 × 64 m bounds; ids are unique', bad.length === 0 && b.x1 - b.x0 === R.size && b.z1 - b.z0 === R.size, { violations: some(bad), size: b.x1 - b.x0 });
	}
	if (!walled) {
		const bad = [];
		const [e0, e1] = plan.exits;
		if (!['S', 'E'].includes(e0.edge) || e0.edge !== hub.inEdge) bad.push('the causeway is not on a front edge (S / E)');
		if (!['N', 'W'].includes(e1.edge) || e1.edge !== hub.gateEdge) bad.push('the lychgate is not on a back edge (N / W)');
		for (const e of plan.exits) if (kindOfEdge(b, e.at, 3) !== e.edge) bad.push(`${e.id}: not on its edge`);
		const gate = find('A02.1'), walls = plan.masses.filter((m) => isGlb(m, 'A01.3'));
		if (gate.length !== 1) bad.push('exactly one lychgate');
		else {
			const g = gate[0], d = doorOf(g);
			if (!d || d.kind !== 'gate') bad.push('the lychgate has a gate door');
			const nearWall = walls.filter((w) => Math.abs(w.yaw - g.yaw) < 0.01 && dist(w.at, g.at) < 14);
			if (nearWall.length < 4 || [-1, 1].some((sg) => nearWall.filter((w) => sg * alongAt(w, g, e1.edge) > 0).length < 2)) bad.push(`flint wall modules next to the gate: ${nearWall.length}, fewer than 2 on a side`);
			const across = nearWall.map((w) => Math.abs((w.at.x - g.at.x) * front(g.yaw).x + (w.at.z - g.at.z) * front(g.yaw).z));
			if (across.some((v) => v > 0.2)) bad.push('flint wall modules are not in the lychgate line');
			if (!nearWall.some((w) => alongAt(w, g, e1.edge) > 0) || !nearWall.some((w) => alongAt(w, g, e1.edge) < 0)) bad.push('the gate is not between wall runs');
			if (line.nearest(g.at.x, g.at.z).d > 4.2) bad.push('the route does not end at the lychgate');
		}
		const cw = hub.causeway, cwSeg = Math.round(cw.length / R.causewayModule);
		if (cw.segments !== cwSeg || cw.length < R.causewayLength[0] - 3 || cw.length > R.causewayLength[1] + 3) bad.push(`causeway ${cw.length} m / ${cw.segments} segments`);
		const post = find('A15.6');
		if (post.length !== 1 || dist(post[0].at, cw.to) > 9.5) bad.push("Osric's watch post is not at the island end of the causeway");
		const dry = line.cum.every((s, i) => s <= cw.length + 1 || !plan.ground(route.points[i].x, route.points[i].z).water);
		if (!dry) bad.push('the route wets its feet beyond the causeway');
		addc('thresholds', "two lit land thresholds only: the fen causeway (front edge S / E, Osric's post at its island end) and the lychgate in a flint wall line (back edge N / W)", bad.length === 0, { violations: some(bad), inEdge: hub.inEdge, gateEdge: hub.gateEdge });
	}
	if (!walled) {
		const sides = ['N', 'S', 'W', 'E'].filter((e) => { const p = edgeMid(b, e); return plan.ground(p.x, p.z).water; });
		addc('water-sides', 'black fen water on 2–3 sides of the map; the gate edge is land, the causeway edge is water', sides.length >= 2 && sides.length <= 3 && !sides.includes(hub.gateEdge) && sides.includes(hub.inEdge), { sides });
	}
	if (!walled) {
		const L = line.length, cs = dist(hub.causeway.to, Q), start = line.nearest(plan.start.x, plan.start.z);
		const ok = L >= R.routeRange[0] && L <= R.routeRange[1] && cs <= R.squareFromCauseway && line.nearest(Q.x, Q.z).d <= Q.r && start.d < 0.5 && plan.meta.route.length === r2(L) && Math.abs(plan.meta.route.walkS - r2(L / R.walkSpeed)) < 0.02;
		addc('route', 'main route causeway → square → lychgate 50–80 m (≈ 31–50 s walking, 13–20 s running); the square is ≤ 25 m from the causeway end and on the route', ok, { length: r2(L), walkS: r2(L / R.walkSpeed), runS: r2(L / R.runSpeed), causewayToSquare: r2(cs) });
	}
	{
		const bad = [];
		const sq = plan.zones.find((z) => z.id === 'square');
		if (!sq || sq.shape.r * 2 < 10.4 || sq.shape.r * 2 > 14.2) bad.push('square size');
		const need = { 'A01.5': 'well', 'A15.3': 'name board', 'A15.4': 'bell frame', 'A15.5': "Nell's stall", 'A15.2': "Brannoc's forge" };
		for (const [glb, name] of Object.entries(need)) if (find(glb).length !== 1) bad.push(`${name}: ${find(glb).length}`);
		const well = find('A01.5')[0];
		if (well && dist(well.at, Q) > R.squareWell + 0.2) bad.push('the well is not near the centre');
		for (const glb of ['A15.3', 'A15.4', 'A15.5', 'A15.2']) for (const m of find(glb)) {
			const gap = pointPolySigned(polyOf(m).pts, Q.x, Q.z) - Q.r;
			if (gap < -0.3 || gap > 5.5) bad.push(`${m.id} is ${r2(gap)} m off the square rim`);
		}
		for (const m of plan.masses) if (!isGlb(m, 'A01.5') && m.collision !== false && pointPolySigned(polyOf(m).pts, Q.x, Q.z) - Q.r < -0.3) bad.push(`${m.id} stands in the standing area`);
		const forge = find('A15.2')[0];
		if (forge) { const f = front(forge.yaw), v = norm(Q.x - forge.at.x, Q.z - forge.at.z); if (f.x * v.x + f.z * v.z < 0.5) bad.push('the forge does not open on the square'); }
		addc('square', "a square 10–14 m across with the well near its centre; the name board, bell frame, Nell's stall and Brannoc's forge on its rim; a clear standing area; the forge open to the square", bad.length === 0, { violations: some(bad), diameter: Q.r * 2 });
	}
	{
		const bad = [];
		const n = cottages.length;
		const cr = walled ? R.cottagesWalled : R.cottages;
		if (n < cr[0] || n > cr[1]) bad.push(`${n} stilt cottages`);
		const edda = cottages.find((m) => m.label === "Edda's house");
		if (!edda) bad.push("no Edda's house");
		for (const m of cottages) { const d = doorOf(m); if (!d || !d.poppy) bad.push(`${m.id}: door / poppy sprig`); }
		if (edda) {
			const d = doorOf(edda), w = walkLine(plan, 'walkway-edda'), pond = plan.water.find((q) => q.id === 'pond');
			if (!d?.exit) bad.push("Edda's door is not an exit");
			if (!w) bad.push('no plank walkway');
			else {
				const end = w.points.at(-1), start = w.points[0], len = dist(start, end);
				if (dist(end, d.at) > 1.5) bad.push("the walkway does not end at Edda's door");
				let wet = 0;
				for (let t = 0; t <= 1; t += 0.05) { const p = lerp2(start, end, t); if (plan.ground(p.x, p.z).water) wet++; }
				if (wet < 6) bad.push('the walkway does not cross water');
				if (plan.ground(start.x, start.z).water) bad.push('the walkway starts in the water');
				if (!pond || Math.abs(w.width - R.walkwayWidth) > 0.01 || len < 6) bad.push('walkway / pond');
			}
		}
		addc('cottages', `${cr[0]}–${cr[1]} stilt cottages (A01.1)${walled ? ' (compactness first: 4, a fifth in ≈ 6 % of the seeds)' : ''} with a poppy sprig on every door, one of them Edda's house (an exit) over the pond, reached by a plank walkway (A01.2)`, bad.length === 0, { count: n, violations: some(bad) });
	}
	if (!walled) {
		const bad = [];
		const vd = plan.doors.find((d) => d.id === 'vault-door'), v = find('N01')[0], runs = plan.masses.filter((m) => isGlb(m, 'N02'));
		if (!vd || !v || !vd.exit) bad.push('no vault door exit');
		else {
			const edge = kindOfEdge(b, { x: v.at.x, z: v.at.z }, 5);
			if (edge !== 'N' && edge !== 'W') bad.push(`the vault terrace is not on a back edge (${edge})`);
			else if (runs.length < 2 || !runs.some((r) => alongAt(r, v, edge) > 0) || !runs.some((r) => alongAt(r, v, edge) < 0)) bad.push('the vault door is not between two retaining wall runs');
			if (line.nearest(vd.at.x, vd.at.z).d > R.exitFromRoute) bad.push('the vault door is far from the route');
		}
		addc('vault', 'Barrow vault door (N01) in a flint retaining wall (N02 runs) on the back side, an exit, a lane to the route', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		const jetty = walkLine(plan, 'jetty'), rack = find('A01.6')[0];
		if (!jetty || !rack || dist(rack.at, jetty.points[0]) > 7) bad.push('eel-trap rack on a jetty');
		else { const tip = jetty.points.at(-1); if (!plan.ground(tip.x, tip.z).water) bad.push('the jetty does not reach the water'); }
		const count = (glb) => find(glb).length;
		if (walled) {
			// spec v2: "water-edge life / dressing as v1 where it fits" inside the ring: a willow at the pond and at least 3 of the 6 dressing kinds
			if (count('A04.2') < 1) bad.push(`young willows: ${count('A04.2')}`);
			const kinds = { net: count('N07') >= 1, peat: count('N04') >= 2, barrow: count('N12') >= 1, barrels: count('N03') >= 1, washing: count('N06') >= 1, fences: count('A01.4') >= 1 };
			if (Object.values(kinds).filter(Boolean).length < 3) bad.push(`dressing: ${Object.entries(kinds).filter(([, v]) => v).map(([k]) => k)}`);
		} else {
			if (count('A04.2') < 2) bad.push(`young willows: ${count('A04.2')}`);
			if (count('N07') < 1) bad.push('drying net');
			if (count('N04') < 2) bad.push('peat stacks');
			if (count('N12') < 1) bad.push('peat barrow');
			if (count('N03') < 1) bad.push('rain barrels');
			if (count('N06') < 1) bad.push('washing line');
			if (count('A01.4') < R.fenceRuns[0]) bad.push('hurdle fences');
		}
		for (const m of find('A04.2')) if (plan.ground(m.at.x, m.at.z).water || !(nearWater(plan, m.at) < 5)) bad.push(`${m.id}: not at the water`);
		addc('water-life', walled ? 'water-edge life where it fits: eel-trap rack on a jetty at the inner pond, a young willow by the water, at least 3 of: drying net, peat stacks, peat barrow, rain barrels, washing line, hurdle fences' : 'water-edge life: eel-trap rack on a jetty, young willows by the water, drying net, peat stacks and barrow, rain barrels, washing line, hurdle fences', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		if (plan.spawns.length || plan.arenas.length || plan.hosts.length || plan.events.length) bad.push('spawns / arenas / hosts / events');
		if (plan.autoMasses !== false) bad.push('auto masses');
		for (const need of ['osric', 'brannoc', 'nell', 'name-board', 'bell']) {
			const i = plan.interactions.find((q) => q.id === need);
			if (!i) { bad.push(`no NPC point ${need}`); continue; }
			const d = line.nearest(i.at.x, i.at.z).d;
			if (d > R.npcFromRoute) bad.push(`${need}: ${r2(d)} m off the route`);
		}
		addc('safe', 'safe hub: no spawns, arenas, hosts or events; NPC points for Osric, Brannoc, Nell, the name board and the bell, each ≤ 12 m off the main route', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		for (const d of plan.doors) { const dot = Math.sin(d.yaw) + Math.cos(d.yaw); if (dot < R.frontCheck * Math.SQRT2 - 1e-6) bad.push({ door: d.id, dot: r2(dot) }); }
		for (const m of plan.masses.filter((q) => ['A01.1', 'A15.2', 'A15.6', 'A15.5', 'A15.3', 'A02.1', 'N01'].includes(q.glb))) { const dot = Math.sin(m.yaw) + Math.cos(m.yaw); if (dot < R.frontCheck * Math.SQRT2 - 1e-6) bad.push({ mass: m.id, dot: r2(dot) }); }
		addc('doors-front', 'every door, gate, vault door and open side faces the front half-plane (normal · (1, 1) > 0)', bad.length === 0, { doors: plan.doors.length, violations: some(bad) });
	}
	{
		const bad = [];
		const keepers = [
			...plan.paths.filter((p) => ['route', 'walkway-edda', 'jetty'].includes(p.id) || p.id.startsWith('lane')).flatMap((p) => p.points.slice(1).map((q, i) => capsule(p.points[i], q, p.width / 2, { name: p.id }))),
			...corridors.map((c) => polyShape(c.poly, { name: c.d.id })), ...plan.interactions.map((i) => circle(i.at.x, i.at.z, i.radius, { name: i.id })), circle(Q.x, Q.z, Q.r * 0.62, { name: 'standing-area', disk: true }),
		];
		for (const m of plan.masses) {
			if (m.height < R.tallMin || m.collision === false || m.fade || (walled ? ['lychgate', 'vault', 'wing'].includes(m.piece) : ['A02.1', 'N01', 'N02', 'A01.3', 'A01.4'].includes(m.glb))) continue; // walled: by role (a faded front wall, the lychgate, the vault door and its wings)
			const hl = shadowOf(polyOf(m), m.height);
			for (const k of keepers) {
				if (isGlb(m, 'A01.5') && k.disk) continue;
				if (shapeGap(k, hl) < 0) { bad.push({ mass: m.id, hides: k.name }); break; }
			}
		}
		addc('camera', 'AD12 §5.2: the camera shadow of every tall mass (≥ 2 m) never covers the route, a lane or walkway, a door corridor, an NPC point or the standing area (the well may shade its own side)', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		const obbs = plan.masses.map((m) => ({ m, fp: polyOf(m) }));
		for (let i = 0; i < obbs.length; i++) for (let k = i + 1; k < obbs.length; k++) if (!(obbs[i].m.tag === 'wall' && obbs[k].m.tag === 'wall') && obbSeparation(obbs[i].fp, obbs[k].fp) < -0.001) bad.push({ a: obbs[i].m.id, b: obbs[k].m.id });
		for (const { m, fp } of obbs) {
			if (plan.ground(m.at.x, m.at.z).water) bad.push({ mass: m.id, why: 'on water' });
			for (const c of corridors) if (c.d.mass !== m.id && shapeGap(polyShape(c.poly), fp.pts) < -0.001) bad.push({ mass: m.id, door: c.d.id });
			for (const i of plan.interactions) if (shapeGap(circle(i.at.x, i.at.z, i.radius), fp.pts) < -0.001) bad.push({ mass: m.id, npc: i.id });
			if (m.collision !== false) for (const l of lineShapes) { if (l.p.id === 'route' && (m.glb === 'A02.1' || m.glb === 'A01.3')) continue; for (const c of l.caps) if (shapeGap(c, fp.pts) < -0.001) { bad.push({ mass: m.id, path: l.p.id }); break; } }
			for (const w of plan.water) if (m.glb !== 'A04.2' ? fp.pts.some((q) => pointInPoly(w.polygon, q.x, q.z)) || pointInPoly(w.polygon, fp.cx, fp.cz) : pointInPoly(w.polygon, fp.cx, fp.cz)) bad.push({ mass: m.id, water: w.id });
		}
		addc('play-space', 'masses do not overlap and stand off the water, the route, lanes, walkways, door corridors and NPC points, inside the bounds', bad.length === 0, { masses: plan.masses.length, violations: some(bad) });
	}
	{
		const bad = [];
		for (const p of plan.paths) {
			if (p.deck && !p.jetty) { const e = p.points.at(-1); if (!plan.doors.some((d) => dist(d.at, e) < 1.5)) bad.push({ path: p.id, why: 'walkway to nowhere' }); }
			if (p.jetty && !find('A01.6').some((r) => dist(r.at, p.points[0]) < 7)) bad.push({ path: p.id, why: 'jetty without a rack' });
			if (p.id.startsWith('lane')) {
				const ends = [p.points[0], p.points.at(-1)];
				const near = (e) => lineShapes.some((l) => l.p.id !== p.id && l.p.points.some((q, i) => i + 1 < l.p.points.length && segDist(e.x, e.z, q, l.p.points[i + 1]) < 1.2));
				if (!ends.every(near) && !(near(ends[1]) || near(ends[0]))) bad.push({ path: p.id, why: 'lane to nowhere' });
			}
		}
		addc('walkways', 'every plank walkway ends at a door (or is a jetty with its rack); every lane joins another path', bad.length === 0, { paths: plan.paths.length, violations: some(bad) });
	}
	{
		const bad = [];
		const rm = reachMap(plan);
		for (const d of plan.doors) if (!rm.touches(polyShape(doorCorridor(d).pts))) bad.push({ door: d.id });
		for (const i of plan.interactions) if (!rm.touches(circle(i.at.x, i.at.z, i.radius))) bad.push({ npc: i.id });
		addc('reach', 'every door, exit and NPC point is reachable on foot from the causeway (0.4 m flood fill, agent 0.35 m, water only under a path)', bad.length === 0, { violations: some(bad) });
	}
	{
		let max = 0, at = null;
		const g = plan.ground, probe = 0.4;
		for (const p of plan.paths) for (let s = 0; s + 1 < p.points.length; s++) for (const t of [0, 0.5]) {
			const q = lerp2(p.points[s], p.points[s + 1], t);
			if (g(q.x, q.z).water) continue;
			const v = Math.hypot(g(q.x + probe, q.z).height - g(q.x - probe, q.z).height, g(q.x, q.z + probe).height - g(q.x, q.z - probe).height) / (2 * probe);
			if (v > max) { max = v; at = { path: p.id, x: r2(q.x), z: r2(q.z) }; }
		}
		addc('slopes', 'slopes on paths stay below 0.55', max <= R.slopeMax, { max: r2(max), at });
	}
	if (walled) walledChecks(plan, addc, { b, hub, route, line, find, Q });
	return checks;
}

// ---------------------------------------------------------------------------------------------------------------
// One seed → the whole map

/**
 * Engine checks that mean nothing on a hub, each waived by an explicit, narrow rule on the plan (never a blanket pass). A waiver gets
 * (check, plan, result) and returns a reason string when it applies; generateHubMap lists every waived check in `waived`.
 */
/** Ceiling of the engine's raw occlusion share on a hub once the excluded wall pieces are left out (tuning; see HUB_OCCLUSION_SOURCE for the measurement it comes from). */
export const HUB_OCCLUSION_CEILING = 0.6;
export const HUB_OCCLUSION_SOURCE = 'tuning: a round number, NOT worst + margin: the measured worst share over seeds 1–40 with the excluded wall pieces left out (agent-aware walkable mask, 0.1 m samples, hidden area ≥ π · 0.35² m²) is 0.567 (a margin of 0.033; the exclusions do not move with the sample grid); over seeds 41–200 the ceiling is binding (max 0.596: attempts above it are retried, so the maximum is censored); with every wall piece the share reaches 0.713 over seeds 1–40 (26 of 40 above the ceiling) and 0.726 over seeds 41–200 (97 of 160)';

/**
 * Walkable ground of the plan for the occlusion waiver: the hero's CENTRE can stand there — dry (or water under a path) AND at least R.agent from every
 * solid mass (the notion of the M1 flood fill, without asking for reachability: the hill lane is walked through the lychgate). A strip narrower than
 * the agent (the 0.25 m footing beside a wall) is therefore not walkable. Exact polygon distance, no grid.
 */
function walkableMask(plan) {
	const solid = plan.masses.filter((m) => m.collision !== false).map((m) => polyOf(m)), lines = plan.paths.map((p) => ({ pts: p.points, half: p.width / 2 })), ar = R.agent;
	return (x, z) => {
		if (plan.ground(x, z).water && !lines.some((l) => l.pts.some((q, i) => i && segDist(x, z, l.pts[i - 1], q) <= l.half))) return false;
		return !solid.some((fp) => x >= fp.x0 - ar && x <= fp.x1 + ar && z >= fp.z0 - ar && z <= fp.z1 + ar && pointPolySigned(fp.pts, x, z) < ar);
	};
}
/** Sample step (m) of the shadow hull in occlusionExcludedWalls: finer than any feature of the mask (the agent margin is 0.35 m). */
export const HUB_OCCLUSION_STEP = 0.1;
/** A shadow hides the hero only where it covers at least the standing area of one agent (π · R.agent² ≈ 0.385 m²): a pocket or sliver smaller than that (measured on seeds 1–40: 0.0004–0.12 m², the next larger hidden area is ≥ 0.6 m²) cannot hide anybody. */
export const HUB_OCCLUSION_MIN_AREA = Math.PI * R.agent * R.agent;
/**
 * The wall pieces left out of the walled hub's occlusion share: (a) the fade-flagged pieces (the front walls fade out when they hide the hero) and (b)
 * back pieces whose camera shadow hides less than HUB_OCCLUSION_MIN_AREA of walkable ground (fen water outside the wall, the footing strip, other walls).
 * `offset` shifts the sample grid (the tests assert the result does not depend on it). Precondition: the plan passed the hub checks (its `camera` check
 * says no shadow lies on the route, lanes, doors or NPC points); a plan that failed them has no meaningful occlusion waiver.
 */
export function occlusionExcludedWalls(plan, { offset = 0 } = {}) {
	const walkable = walkableMask(plan), out = [], st = HUB_OCCLUSION_STEP, need = Math.ceil(HUB_OCCLUSION_MIN_AREA / (st * st));
	for (const m of plan.masses) {
		if (m.tag !== 'wall') continue;
		if (m.fade) { out.push({ id: m.id, why: 'fade' }); continue; }
		const hull = shadowOf(polyOf(m), m.height), hb = polyBoxOf(hull);
		let hidden = 0;
		for (let i = Math.ceil((hb.x0 - offset) / st); offset + i * st <= hb.x1 && hidden < need; i++) for (let j = Math.ceil((hb.z0 - offset) / st); offset + j * st <= hb.z1 && hidden < need; j++) { const x = offset + i * st, z = offset + j * st; if (pointInPoly(hull, x, z) && walkable(x, z)) hidden++; }
		if (hidden < need) out.push({ id: m.id, why: 'shadow-on-unwalkable' });
	}
	return out;
}
export const HUB_ENGINE_WAIVERS = Object.freeze({
	// AD12 §4.3 "tall props cover ≤ 25 % of every screen window" is written for an open moor: a window is 21 × 24 m (512 m²) and one stilt cottage
	// already hides ~75 m² behind it, so a village of 4–5 cottages, a forge and a watch post can never keep every window under 25 %. What the
	// rule protects is the hero: no walkable ground hidden. For a hub that is exactly the hub `camera` check (no shadow on the route, lanes,
	// walkways, doors, NPC points or the standing area), which has already passed when the engine runs. The engine check is waived only when the raw share,
	// counted WITHOUT the excluded wall pieces, stays under HUB_OCCLUSION_CEILING. Excluded: (a) fade-flagged wall pieces and (b) back pieces whose camera
	// shadow hides no ground the hero's centre can stand on (fen water, the 0.25 m footing strip, other walls; see occlusionExcludedWalls) — the full-height back
	// walls (N / W) are what pushes the share past the cap. PRECONDITION: the hub checks passed (generateHubMap calls the engine only then); the reason text
	// "camera and front-wall checks hold" is not re-verified here, so this exported table must not be applied to a plan that failed checkHubPlan.
	occlusion: (check, plan, result) => {
		let raw = check.details.raw, shown = `hidden share ${r3(raw)}`;
		if (plan.hub?.layout === 'walled' && result) {
			const ex = new Set(occlusionExcludedWalls(plan).map((q) => q.id)), walls = new Set(plan.masses.filter((m) => m.tag === 'wall' && ex.has(m.id)).map((m) => `mass:${m.id}`));
			const rules = result.report.rules, occ = occlusionWindows(preparePlan(plan, rules), result.placements.filter((p) => !(p.mass && walls.has(`mass:${p.mass}`)) && !walls.has(p.id)), rules);
			raw = occ.raw; shown = `hidden share without ${ex.size} excluded wall pieces ${r3(occ.raw)} (with every wall piece ${r3(check.details.raw)})`;
		}
		return raw <= HUB_OCCLUSION_CEILING ? `hub: ${shown} ≤ ${HUB_OCCLUSION_CEILING}, camera${plan.hub?.layout === 'walled' ? ' and front-wall checks hold' : ' check holds'} (nothing walkable hidden)` : null;
	},
});

/**
 * Attempt 0, 1, … (up to maxAttempts): generate, run checkHubPlan, and only if it passes run layoutBiome; accept when every hub check and
 * every engine check passes. Returns { ok, seed, plan, result, hubChecks, waived, attempt, attempts: [{ attempt, failed }], timing }.
 * If no attempt passes, the attempt with the fewest failures is returned with ok: false. Never throws, never loops unbounded.
 */
export function generateHubMap(seed, catalog, options = {}) {
	const { size = R.size, maxAttempts: asked = R.maxAttempts, layout = 'walled', familyAttempts = R.familyAttempts, ...layoutOptions } = options;
	const maxAttempts = Number.isFinite(asked) && asked >= 1 ? Math.floor(asked) : R.maxAttempts; // NaN / ≤ 0 / non-numbers → the default
	const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);
	const t0 = now(), attempts = [], times = [];
	const budgets = mapBudgets(size, layoutOptions.budgets);
	let best = null;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const a0 = now(), failed = [], waived = [];
		let plan = null, result = null, hubChecks = null;
		try {
			plan = generateHubPlan(seed, { size, attempt, layout, familyAttempts });
			hubChecks = checkHubPlan(plan);
			for (const c of hubChecks) if (!c.pass) failed.push(`hub:${c.id}`);
			if (!failed.length) {
				try {
					result = layoutBiome(plan, catalog, { ...layoutOptions, budgets });
					for (const c of result.report.checks) {
						if (c.pass) continue;
						const why = HUB_ENGINE_WAIVERS[c.id]?.(c, plan, result);
						if (why) waived.push({ id: c.id, why }); else failed.push(`engine:${c.id}`);
					}
				} catch (error) { failed.push('engine:throw'); result = null; }
			}
		} catch (error) { failed.push('hub:throw'); }
		attempts.push({ attempt, failed });
		times.push(now() - a0);
		const entry = { attempt, plan, result, hubChecks, failed, waived };
		const score = (e) => e.failed.reduce((n, id) => n + (id.startsWith('hub:') ? 100 : 1), 0);
		if (!best || score(entry) < score(best)) best = entry;
		if (!failed.length) break;
	}
	const ok = best.failed.length === 0;
	if (!ok && best.plan && !best.plan.failed && !best.result) { try { best.result = layoutBiome(best.plan, catalog, { ...layoutOptions, budgets }); } catch (error) { best.result = null; } }
	return { ok, seed, plan: best.plan, result: best.result, hubChecks: best.hubChecks, waived: best.waived, attempt: best.attempt, attempts, timing: { total: now() - t0, attempts: times } };
}

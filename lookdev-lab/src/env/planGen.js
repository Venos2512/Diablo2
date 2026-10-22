// Plan generator for the biome layout engine: ONE seed → a complete plan of the shape of DEMO_PLAN (biomeLayoutDemo.js) —
// bounds, a meandering road with a hidden bend, branches and trails, a creek that crosses the road once, a pond, the zones
// (farm, camp, den, graveyard) with their doors, masses, hosts, events, spawns and arenas, a ridge on the back edges, and
// a seeded ground(x, z). layoutBiome (biomeLayout.js) then dresses it as it dresses the demo. Same seed → same map.
//
//   generatePlan(seed, { size, biome, attempt })   pure and fast (no renderer, no layout)
//   checkPlan(plan, { catalog })                    plan-level checks (before the engine)
//   generateMap(seed, catalog, options)             attempts 0…maxAttempts−1 until every plan check and all 19 engine checks pass
//
// Camera (AD 12 §5.2, the engine's camera): it looks north-west, forward = normalize(−1, −1) in x/z. Screen top-left = the west
// edge, top-right = the north edge, bottom = the south and east edges. Tall things belong at the back (north / west of what the
// hero walks to); everything in front (south / east) of the hero stays ≤ 0.5 H. Doors, gates and den mouths face the front
// half-plane (normal · (1, 1) > 0), so the building, the wall or the rock stands behind the opening as the camera sees it.
// Randomness: seeded streams keyed by purpose, hash32(seed, attempt, purpose) — never Math.random or the clock.
import {
	DEFAULT_OPTIONS, LAYOUT_RULES, Stream, footprintObb, hash32, layoutBiome, makeObb, obbSeparation, patchField, pointInPoly, pointPolySigned, polyDistance, preparePlan,
	segmentsIntersect, shapeGap, vnoise,
} from './biomeLayout.js';
import { bufferPolyline, smoothPath } from './biomeLayoutDemo.js';
import { Frame, ZONE_RULES, buildCamp, buildDen, buildFarm, buildGraveyard } from './planGenZones.js';
import { MODULE_RULES, checkModules, loadOrder, mapStart, splitModules } from './mapModules.js';

export const PLAN_GEN_VERSION = 'plan-gen/2'; // /2: poi-count ≤ max, reach per zone, plan id with the size, budgets from the engine's defaults

// ---------------------------------------------------------------------------------------------------------------
// Rules: every number with its source. "demo" = read off DEMO_PLAN; "AD12" = art-direction/12 section; "H/Sub" = the metre
// conversion of UNITS (H = 1.8 m, 1 Sub ≈ 0.47 m); "spec" = the stage-B brief; "tuning" = no source gives a number.

const RULE_TABLE = [
	// size and edges
	['size', 128, 'demo: 128 × 128 m (bounds −64…64); options 192 / 256'],
	['endInset', 2, 'demo: the road starts at x = −62 on a −64 edge'],
	['edgeSpan', 0.5, 'tuning: road / creek ends sit within ±50 % of half the edge from its middle'],
	// road
	['roadWidth', 4.2, 'demo: road 4.2 m (AD12 §4.3 main path ≥ 3 Sub = 1.4 m)'],
	['roadPoints', [3, 5], 'spec: 3–5 interior control points'],
	['roadBackMargin', 14, 'spec: interior road ≥ 14 m off the back edges (ridge band)'],
	['roadFrontMargin', 8, 'spec: ≥ 8 m off the front edges'],
	['roadMeander', [4, 9], 'demo: the road wanders ±8 m round its chord'],
	['roadKink', [4.5, 7], 'demo: the hidden bend is a ~10 m dog-leg (−1, 3) → (0.5, −3) → (1, −10); offsets ±4.5–7 m, raised in steps of 20 % until the engine sees a bend ≥ 44°'],
	['roadKinkSpan', [9, 11], 'AD12 §4.9 / engine bendSpan 8 m: the turn happens over ~8 m'],
	['roadBendMin', 44, 'engine bendAngle 35° + margin: the strongest turn over bendSpan, in degrees'],
	['roadStep', 2.5, 'demo: smoothPath default step'],
	['roadStartAlong', 14, 'spec: the start is 14 m along the road from the entrance'],
	['rutsChance', 0.6, 'tuning: "optional ruts on one straight section"'],
	['rutsLength', 14, 'demo: ruts from x = 24 to 38'],
	['rutsGap', 1.3, 'demo: ruts 1.3 m apart'], ['rutsWidth', 0.32, 'demo: ruts 0.32 m wide'],
	['adjacentChance', 0.2, 'spec: adjacent entrance / exit edges "with a smaller chance"'],
	// water
	['creekChance', 0.7, 'spec: water ≈ 70 %'], ['creekWidth', 3.2, 'demo: CREEK_WIDTH 3.2 m'], ['creekBank', 7, 'demo: bufferPolyline(creek, 7)'], ['creekStep', 3, 'demo: smoothPath(…, 3)'],
	['creekWobble', [5, 11], 'demo: the creek wanders ±5 m'],
	['creekCrossing', [0.3, 0.88], 'tuning: the ford is in the middle 60 % of the road'],
	['creekFromStart', 18, 'tuning: ≥ 18 m of road between the start and the ford'], ['creekBend', 10, 'engine bendSpan: the ford is not decided on a bend'],
	['creekAngle', 40, 'tuning: the creek crosses the road at ≥ 40°, never along it'],
	['pondChance', 0.5, 'spec: a pond in ≈ 50 % of the maps'], ['pondRadius', [4, 6], 'spec / demo (polygon r ≈ 4–6)'], ['pondBank', 4, 'demo: bank zone r = pond r + 4'], ['pondPathClear', 6, 'spec: pond ≥ 6 m off the paths'],
	['waterClearSolid', 2.5, 'AD12 §4.4 clear water edge + footprint margin (tuning)'],
	// waypoint
	['waypointRadius', 2.6, 'demo / spec'], ['waypointBeside', [6, 10], 'spec: 6–10 m beside the road'], ['waypointAlong', [11, 23], 'spec: 10–24 m from the entrance'], ['waypointPad', 4, 'demo: pad r 4'],
	// points of interest
	['poiMin', 3, 'spec: 3–4 of farm, camp, den, graveyard'], ['poiMax', 4, 'spec: 3–4 points of interest'], ['poiScale', 0.8, 'tuning: on a bigger map the minimum grows with 0.8 × the area ratio (192 m: 5, 256 m: 9), the maximum with the area ratio'],
	['poiChance', { camp: 0.85, farm: 0.8, den: 0.75, graveyard: 0.7 }, 'tuning (spec: "per the recipe probabilities")'],
	['poiRoadDistance', { farm: [24, 40], camp: [22, 38], den: [18, 36], graveyard: [20, 36] }, 'spec: 12–35 m off the road (zone centre to road centre line); raised for the big zones so that the gate / yard (12–15 m from the centre) keeps clear of the road, and to 38 for the farm and camp because r 26 / 24 + 4 m of edge leaves little room on 128 m'],
	['zoneGap', 8, 'spec: ≥ 8 m between zone circles'], ['zoneEdge', 4, 'spec: ≥ r + 4 m from the map edges'],
	['busyStart', 45, 'spec: busy zones (camp, farm) start ≥ 45 m from the start'], ['spawnStart', 25, 'tuning: no spawn within 25 m of the start (first screens stay light)'],
	['campBack', 0.3, 'spec: camp behind the road: cos of the angle between (camp − road) and the camera forward ≥ 0.3'],
	['facingRoad', 0.34, 'tuning: the doors / mouth face the road within ~70°'],
	['frontLimit', 72, 'spec: rotate so that normal · (1, 1) > 0; generation keeps the door normal within 72° of south-east (check: 78°)'],
	['frontCheck', 0.2, 'check: cos of the angle between the door normal and south-east ≥ 0.2 (normal · (1,1) ≥ 0.28)'],
	['solidRoadGap', 1.5, 'tuning: a footprint keeps 1.5 m off the road corridor edge (engine pathClear 0.3)'],
	['solidGap', 3, 'tuning: footprints of two zones keep 3 m (engine passGap 0.94 m)'],
	['laneRoadGap', 1.8, 'tuning: a branch keeps 1.8 m off the road (beyond the junction), water and other zones'],
	['laneJunction', 35, 'tuning: a branch leaves the road at ≥ 35° (a fork, not a parallel lane)'],
	['laneMax', 85, 'tuning: a branch is at most 85 m long'],
	['forkGap', 14, 'tuning: junctions 14 m apart (a fork marker and its torch gap 7 m on each side)'],
	['spreadReach', 60, 'tuning: gap to the nearest placed zone that counts fully for the spread bias'], ['spreadWeight', 0.4, 'tuning: weight of that bias against the seeded random order of the candidate centres'], ['tries', 160, 'tuning: candidates per zone'], ['poiRounds', 6, 'tuning: the wanted zones are placed in up to 6 seeded orders; the fullest map wins'],
	// extras
	['cartChance', 0.5, 'spec: ≈ 50 %'], ['treeScale', [1.2, 1.4], 'spec: landmark tree scale 1.2–1.4 (deadTrees.tall 3.42 m × 1.2 ≥ 2 H)'], ['treeBack', [8, 11], 'tuning: the landmark tree stands behind the fork'], ['treeHostGap', 9, 'engine hostKeepOut 8 + margin'],
	['landmarkSpacing', 6, 'engine landmarkSpacing'],
	// boundary
	['ridgeBand', 10, 'demo: the north rise starts 10 m off the edge'], ['ridgeAmp', [1.2, 2.4], 'demo: 1.2 + noise × 1.2'], ['ridgeGap', [2, 11], 'tuning: the rise dies out within 11 m of a road / creek end'],
	['cliffWidth', [20, 26], 'demo: cliff 26 × 4'], ['cliffDepth', 4, 'demo: cliff 26 × 4'], ['cliffHeight', [3.6, 4.4], 'demo: 4'], ['cliffCount', [1, 2], 'spec: 1–2 cliffs per back edge'],
	['cliffGap', 21, 'footprint half 13 + road half 2.1 + 6 m: a cliff stays clear of a road / creek end'], ['cliffInset', 5, 'demo: centre 5 m off the edge'],
	['frontWet', 6, 'spec: front edges stay low and wet / muddy'],
	// ground (demo)
	['groundLow', 3.2, 'demo: lowAt amplitude 3.2 m'], ['groundLowScale', 0.018, 'demo: lowAt frequency'], ['groundBump', 0.7, 'demo: bump amplitude 0.7 m'], ['groundBumpScale', 0.14, 'demo: bump frequency'],
	['flatNear', 1.5, 'demo sm(1.5, 6, …)'], ['flatFar', 6, 'demo: sm(1.5, 6, …)'], ['trample', 3, 'demo sm(0, 3, …)'], ['fieldCell', 1, 'demo: 1 m distance fields'],
	['levelBlend', 3, 'demo: level pads blend over 3 m'],
	// checks
	['slopeMax', 0.55, 'check: gradient on paths and in zone cores (the demo peaks at 0.48 on its ridge)'], ['slopeProbe', LAYOUT_RULES.slopeProbe, 'engine slopeProbe'],
	['startClear', 12, 'check: no door / spawn / arena / host inside this radius of the start'],
	['exitTolerance', 3, 'check: exits sit within 3 m of their edge'],
	['maxAttempts', 8, 'spec: bounded retries'],
];

export const PLAN_GEN_RULES = Object.freeze(Object.fromEntries(RULE_TABLE.map(([k, v]) => [k, Object.isFrozen(v) || typeof v !== 'object' ? v : Object.freeze(v)])));
export const PLAN_GEN_RULE_SOURCES = Object.freeze(Object.fromEntries(RULE_TABLE.map(([k, , s]) => [k, s])));
const R = PLAN_GEN_RULES;

/** What a map of a biome contains and with what probability (data: later ASHLAR biomes are new entries). */
export const BIOME_RECIPES = Object.freeze({
	moor: Object.freeze({
		label: 'Đồng hoang Act I', source: 'AD12 §4.5 / §4.11 dòng 1; demo biomeLayoutDemo.js',
		defaultZone: 'moor',
		road: Object.freeze({ width: R.roadWidth, ruts: R.rutsChance }),
		water: Object.freeze({ creek: R.creekChance, pond: R.pondChance }),
		pois: Object.freeze({ camp: R.poiChance.camp, farm: R.poiChance.farm, den: R.poiChance.den, graveyard: R.poiChance.graveyard }),
		poiMin: R.poiMin, poiMax: R.poiMax,
		extras: Object.freeze({ cart: R.cartChance, tree: 1 }),
		boundary: Object.freeze({ back: ['N', 'W'], front: ['S', 'E'] }),
	}),
});

// ---------------------------------------------------------------------------------------------------------------
// Small geometry

const TAU = Math.PI * 2;
const FORWARD = Object.freeze({ x: -Math.SQRT1_2, z: -Math.SQRT1_2 }); // camera forward (engine UNITS.CAMERA.forward)
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};
const pt = (p) => ({ x: r2(p.x), z: r2(p.z) });
const segDist = (x, z, a, b) => {
	const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
};
const unit = (x, z) => {
	const l = Math.hypot(x, z) || 1;
	return { x: x / l, z: z / l };
};

/** A polyline with arclength: at(s) → { x, z, tx, tz }, nearest(x, z) → { x, z, s, d, tx, tz }. */
export class Line {
	constructor(points) {
		this.pts = points.map((p) => ({ x: p.x, z: p.z }));
		this.cum = [0];
		for (let i = 1; i < this.pts.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(this.pts[i].x - this.pts[i - 1].x, this.pts[i].z - this.pts[i - 1].z));
		this.length = this.cum[this.cum.length - 1];
	}

	at(s) {
		const n = this.pts.length;
		s = clamp(s, 0, this.length);
		let i = 1;
		while (i < n - 1 && this.cum[i] < s) i++;
		const a = this.pts[i - 1], b = this.pts[i], len = this.cum[i] - this.cum[i - 1] || 1, t = clamp((s - this.cum[i - 1]) / len, 0, 1);
		return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, tx: (b.x - a.x) / len, tz: (b.z - a.z) / len };
	}

	nearest(x, z) {
		let best = null;
		for (let i = 1; i < this.pts.length; i++) {
			const a = this.pts[i - 1], b = this.pts[i], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
			const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (len * len), 0, 1);
			const px = a.x + dx * t, pz = a.z + dz * t, d = Math.hypot(x - px, z - pz);
			if (!best || d < best.d) best = { x: px, z: pz, d, s: this.cum[i - 1] + t * len, tx: dx / len, tz: dz / len };
		}
		return best;
	}
}

/** Distance field on a grid of nodes (cell metres, capped): addPolyline(points, sub) keeps the minimum of (distance − sub). */
class DistField {
	constructor(bounds, cell, cap) {
		this.x0 = bounds.x0; this.z0 = bounds.z0; this.cell = cell; this.cap = cap;
		this.nx = Math.round((bounds.x1 - bounds.x0) / cell) + 1; this.nz = Math.round((bounds.z1 - bounds.z0) / cell) + 1;
		this.data = new Float32Array(this.nx * this.nz).fill(cap);
	}

	addSegment(a, b, sub = 0) {
		const { cell, cap, nx, nz } = this;
		const i0 = Math.max(0, Math.floor((Math.min(a.x, b.x) - cap - this.x0) / cell)), i1 = Math.min(nx - 1, Math.ceil((Math.max(a.x, b.x) + cap - this.x0) / cell));
		const j0 = Math.max(0, Math.floor((Math.min(a.z, b.z) - cap - this.z0) / cell)), j1 = Math.min(nz - 1, Math.ceil((Math.max(a.z, b.z) + cap - this.z0) / cell));
		for (let j = j0; j <= j1; j++) {
			for (let i = i0; i <= i1; i++) {
				const d = segDist(this.x0 + i * cell, this.z0 + j * cell, a, b) - sub;
				if (d < this.data[j * nx + i]) this.data[j * nx + i] = d;
			}
		}
	}

	addPolyline(points, sub = 0) {
		for (let i = 0; i + 1 < points.length; i++) this.addSegment(points[i], points[i + 1], sub);
	}

	addDisc(x, z, r) {
		const { cell, cap, nx, nz } = this;
		const i0 = Math.max(0, Math.floor((x - r - cap - this.x0) / cell)), i1 = Math.min(nx - 1, Math.ceil((x + r + cap - this.x0) / cell));
		const j0 = Math.max(0, Math.floor((z - r - cap - this.z0) / cell)), j1 = Math.min(nz - 1, Math.ceil((z + r + cap - this.z0) / cell));
		for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.data[j * nx + i] = Math.min(this.data[j * nx + i], Math.hypot(this.x0 + i * cell - x, this.z0 + j * cell - z) - r);
	}

	at(x, z) {
		const fx = clamp((x - this.x0) / this.cell, 0, this.nx - 1.001), fz = clamp((z - this.z0) / this.cell, 0, this.nz - 1.001);
		const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, d = this.data, nx = this.nx;
		const a = d[j * nx + i] * (1 - tx) + d[j * nx + i + 1] * tx, b = d[(j + 1) * nx + i] * (1 - tx) + d[(j + 1) * nx + i + 1] * tx;
		return a * (1 - tz) + b * tz;
	}
}

/** Exact distance to a few polylines within `reach` (a coarse cell index of the segments); Infinity beyond. */
class SegIndex {
	constructor(lines, reach, cell = 8) {
		this.cell = cell; this.cells = new Map();
		for (const line of lines) {
			for (let i = 0; i + 1 < line.length; i++) {
				const a = line[i], b = line[i + 1];
				for (let cx = Math.floor((Math.min(a.x, b.x) - reach) / cell); cx <= Math.floor((Math.max(a.x, b.x) + reach) / cell); cx++) {
					for (let cz = Math.floor((Math.min(a.z, b.z) - reach) / cell); cz <= Math.floor((Math.max(a.z, b.z) + reach) / cell); cz++) {
						const k = cx * 4096 + cz;
						let list = this.cells.get(k);
						if (!list) this.cells.set(k, (list = []));
						list.push(a, b);
					}
				}
			}
		}
	}

	dist(x, z) {
		const list = this.cells.get(Math.floor(x / this.cell) * 4096 + Math.floor(z / this.cell));
		if (!list) return Infinity;
		let d = Infinity;
		for (let i = 0; i < list.length; i += 2) d = Math.min(d, segDist(x, z, list[i], list[i + 1]));
		return d;
	}
}

/** Sample points on a polygon outline (vertices, then every ~step m along the edges) plus its centroid. */
function outline(poly, step = 1.6) {
	const out = [];
	let cx = 0, cz = 0;
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i], b = poly[(i + 1) % poly.length];
		cx += a.x; cz += a.z;
		const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / step));
		for (let k = 0; k < n; k++) out.push({ x: lerp(a.x, b.x, k / n), z: lerp(a.z, b.z, k / n) });
	}
	out.push({ x: cx / poly.length, z: cz / poly.length });
	return out;
}

const polyBox = (poly) => {
	let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
	for (const p of poly) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
	return { x0, x1, z0, z1 };
};

/** Heading turn (rad, signed) over the engine's bend span at arclength s, the metric detectDecisions uses for hidden bends. */
function bendAt(line, s) {
	const span = LAYOUT_RULES.bendSpan / 2, probe = LAYOUT_RULES.bendProbe;
	const head = (c) => {
		const a = line.at(clamp(c - probe, 0, line.length)), b = line.at(clamp(c + probe, 0, line.length));
		return { x: b.x - a.x, z: b.z - a.z };
	};
	const a = head(s - span), b = head(s + span);
	return Math.atan2(a.x * b.z - a.z * b.x, a.x * b.x + a.z * b.z);
}

/** Every bend the engine will see: [{ s, turn }] with |turn| above the engine's bendAngle. */
function bends(line) {
	const span = LAYOUT_RULES.bendSpan / 2, probe = LAYOUT_RULES.bendProbe, out = [];
	for (let s = span + probe; s <= line.length - span - probe; s += probe) {
		const turn = bendAt(line, s);
		if (Math.abs(turn) > LAYOUT_RULES.bendAngle) out.push({ s, turn });
	}
	return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Assets the generator places by id: footprint boxes of the declared kit pieces (kitSizes.json × the catalog's shrink), used
// so that the plan can be checked without a catalog. generateMap passes the real catalog; the test compares both.

export const ASSET_BOX = Object.freeze({
	'palisade.wall_c': { box: { x0: -2.424, x1: 2.424, z0: -1.049, z1: 1.049 }, scale: [1, 1] },
	'palisade.wall_a': { box: { x0: -1.69, x1: 1.69, z0: -1.01, z1: 1.01 }, scale: [1, 1] },
	'lighting.beacon': { box: { x0: -0.7065, x1: 0.7065, z0: -0.6354, z1: 0.6354 }, scale: [1, 1] },
	'tentsB.cart_awning': { box: { x0: -2.897, x1: 2.897, z0: -1.72, z1: 1.72 }, scale: [0.9, 1.05] },
	'deadTrees.tall': { box: { x0: -0.736, x1: 1.223, z0: -0.907, z1: 0.757 }, scale: [1, 1.35] },
});

/** Footprint OBB of an authored mass: procedural (footprint w × d) or an asset piece (catalog box when given, else ASSET_BOX). */
export function massObb(m, catalog = null) {
	if (!m.asset) return makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw ?? 0);
	const a = catalog?.resolve ? catalog.resolve(m.asset)[0] : null;
	const box = a ? a.footprint : ASSET_BOX[m.asset]?.box;
	const range = a ? a.scale : ASSET_BOX[m.asset]?.scale ?? [1, 1];
	if (!box) return makeObb(m.at.x, m.at.z, 1, 1, m.yaw ?? 0);
	return footprintObb(box, m.at.x, m.at.z, m.yaw ?? 0, m.scale ?? (range[0] + range[1]) / 2);
}

// ---------------------------------------------------------------------------------------------------------------
// The generator

const PLACED = ['circles', 'solids', 'bundles', 'paths', 'masses', 'events', 'pads', 'levelPads', 'rocks', 'blood', 'notes'];
/** Fewest zones of a map of `scale` × the area of 128 × 128 m. */
const poiMin = (base, scale) => (scale <= 1 ? base : Math.max(base, Math.floor(base * scale * R.poiScale)));
const stream = (seed, attempt, purpose) => new Stream(hash32(seed, attempt, purpose));
// entrance → exit edges: opposite edges, or (with R.adjacentChance) adjacent ones; weights inside each group. The west edge is a back edge: the hero
// walks in from the back and out to the front most often (W → E), the road never joins the two back edges (north and west).
const ROUTES_OPPOSITE = [['W', 'E', 0.38], ['E', 'W', 0.21], ['N', 'S', 0.205], ['S', 'N', 0.205]];
const ROUTES_ADJACENT = [['W', 'S', 0.2], ['N', 'E', 0.2], ['S', 'W', 0.2], ['E', 'N', 0.2], ['E', 'S', 0.1], ['S', 'E', 0.1]];
const INWARD = { W: { x: 1, z: 0 }, E: { x: -1, z: 0 }, N: { x: 0, z: 1 }, S: { x: 0, z: -1 } };

class Gen {
	constructor(seed, attempt, size, recipe) {
		this.seed = seed; this.attempt = attempt; this.size = size; this.recipe = recipe;
		this.half = size / 2;
		this.bounds = { x0: -this.half, z0: -this.half, x1: this.half, z1: this.half };
		this.scale = (size * size) / (128 * 128);
		this.roadField = new DistField(this.bounds, 1, 60);
		this.waterField = new DistField(this.bounds, 1, 60);
		this.circles = []; // zone circles { x, z, r, id } (placed zones)
		this.solids = []; // { poly, label, margin, bundle }
		this.bundles = [];
		this.paths = []; // branch / trail / animal: { id, kind, width, inhabited, points, line }
		this.masses = []; this.events = []; this.pads = []; this.levelPads = []; this.rocks = []; this.blood = [];
		this.notes = [];
		this.water = []; this.zonesBank = [];
		this.instances = {};
		this.rects = []; // extra no-go discs { x, z, r } (waypoint, cart, tree)
		this.nearMemo = new Map(); // nearest road point of the 3 m candidate grid, shared by every zone and round
		this.rejected = {}; // why candidates of the zones were rejected (kind:reason → count), for tuning and the report
	}

	S(purpose) { return stream(this.seed, this.attempt, purpose); }

	// ---- road
	edgePoint(edge, t) {
		const h = this.half, u = lerp(-h * R.edgeSpan, h * R.edgeSpan, t), e = h - R.endInset;
		return edge === 'W' ? { x: -e, z: u } : edge === 'E' ? { x: e, z: u } : edge === 'N' ? { x: u, z: -e } : { x: u, z: e };
	}

	makeRoad() {
		const rng = this.S('road'), h = this.half;
		const group = rng.chance(R.adjacentChance) ? ROUTES_ADJACENT : ROUTES_OPPOSITE;
		const route = rng.weighted(group, (r) => r[2]);
		const [e0, e1] = route;
		const A = this.edgePoint(e0, rng.next()), B = this.edgePoint(e1, rng.next());
		// base curve: a straight chord between opposite edges, a quarter turn (quadratic Bézier through the corner) between adjacent ones
		const adjacent = (e0 === 'W' || e0 === 'E') !== (e1 === 'W' || e1 === 'E');
		const K = adjacent ? (INWARD[e0].x !== 0 ? { x: B.x, z: A.z } : { x: A.x, z: B.z }) : { x: (A.x + B.x) / 2, z: (A.z + B.z) / 2 };
		const base = (t) => ({ x: (1 - t) * (1 - t) * A.x + 2 * t * (1 - t) * K.x + t * t * B.x, z: (1 - t) * (1 - t) * A.z + 2 * t * (1 - t) * K.z + t * t * B.z });
		const chord = Math.hypot(B.x - A.x, B.z - A.z);
		const n = rng.int(R.roadPoints[0], R.roadPoints[1]);
		const k = rng.int(0, n - 2); // the dog-leg joins control points k and k+1
		const meander = rng.range(...R.roadMeander);
		const ts = Array.from({ length: n }, (_, i) => (i + 1) / (n + 1) + rng.range(-0.04, 0.04));
		const offs = ts.map(() => rng.range(-1, 1) * meander);
		const span = rng.range(...R.roadKinkSpan);
		ts[k + 1] = ts[k] + span / chord; // the two points of the dog-leg sit one bend span apart
		for (let i = k + 2; i < n; i++) ts[i] = Math.max(ts[i], ts[i - 1] + 0.08);
		const kinkSign = rng.sign(), amp0 = rng.range(...R.roadKink);
		let road = null;
		for (let tryK = 0; tryK < 5; tryK++) {
			const amp = amp0 * (1 + tryK * 0.2);
			const o = offs.slice();
			o[k] = kinkSign * amp; o[k + 1] = -kinkSign * amp * 0.9;
			const ctrl = [A];
			ts.forEach((t, i) => {
				const p = base(clamp(t, 0.06, 0.94)), q = base(clamp(t + 0.01, 0, 1)), q0 = base(clamp(t - 0.01, 0, 1));
				const tan = unit(q.x - q0.x, q.z - q0.z);
				// the perpendicular offset; interior points stay off the back edges (≥ 14 m, the ridge band) and the front edges (≥ 8 m)
				ctrl.push({ x: clamp(p.x - tan.z * o[i], -h + R.roadBackMargin, h - R.roadFrontMargin), z: clamp(p.z + tan.x * o[i], -h + R.roadBackMargin, h - R.roadFrontMargin) });
			});
			ctrl.push(B);
			const pts = smoothPath(ctrl.map((p) => [p.x, p.z]), R.roadStep);
			const line = new Line(pts);
			const bd = bends(line);
			road = { pts, line, bend: bd.length ? Math.max(...bd.map((b2) => Math.abs(b2.turn))) : 0, route: `${e0}→${e1}`, e0, e1, A, B };
			if (road.bend >= (R.roadBendMin * Math.PI) / 180) break;
		}
		this.road = road;
		this.roadLine = road.line;
		this.roadField.addPolyline(road.pts, 0);
		this.start = pt(road.line.at(R.roadStartAlong));
		// ruts on the straightest ~14 m between 25 % and 85 % of the road
		if (rng.chance(R.rutsChance)) {
			let best = null;
			for (let s = road.line.length * 0.25; s + R.rutsLength < road.line.length * 0.85; s += 2) {
				let turn = 0;
				for (let q = s; q < s + R.rutsLength; q += 2) turn = Math.max(turn, Math.abs(bendAt(road.line, q)));
				const jitter = rng.next() * 0.05;
				if (!best || turn + jitter < best.turn) best = { s, turn: turn + jitter };
			}
			if (best && best.turn < 0.35) road.ruts = { s0: r2(best.s), s1: r2(best.s + R.rutsLength), gap: R.rutsGap, width: R.rutsWidth };
		}
		this.notes.push(`road ${road.route}, hidden bend ${Math.round((road.bend * 180) / Math.PI)}°${road.ruts ? ', ruts' : ''}`);
	}

	// ---- waypoint
	makeWaypoint() {
		const rng = this.S('waypoint'), line = this.roadLine, h = this.half;
		const edge = h - 12;
		const first = rng.sign();
		for (let k = 0; k < 24; k++) {
			const s = rng.range(...R.waypointAlong), d = rng.range(...R.waypointBeside), at = line.at(s), side = first * (k % 2 ? -1 : 1);
			const p = { x: at.x + at.tz * d * side, z: at.z - at.tx * d * side };
			if (Math.abs(p.x) > edge || Math.abs(p.z) > edge) continue;
			const back = line.nearest(p.x, p.z); // on a bend the nearest road point is not the one we measured from
			if (back.d < R.waypointBeside[0] - 0.4 || back.d > R.waypointBeside[1] + 0.4 || back.s < R.waypointAlong[0] - 0.5 || back.s > R.waypointAlong[1] + 0.5) continue;
			this.waypoint = { id: 'waypoint', at: pt(p), radius: R.waypointRadius };
			this.pads.push({ x: p.x, z: p.z, r: R.waypointPad });
			this.rects.push({ x: p.x, z: p.z, r: R.waypointRadius + 2.5 });
			return;
		}
		const at = line.at(17);
		this.waypoint = { id: 'waypoint', at: pt({ x: at.x + at.tz * 7, z: at.z - at.tx * 7 }), radius: R.waypointRadius };
		this.pads.push({ x: this.waypoint.at.x, z: this.waypoint.at.z, r: R.waypointPad });
		this.rects.push({ x: this.waypoint.at.x, z: this.waypoint.at.z, r: R.waypointRadius + 2.5 });
	}

	// ---- creek
	makeCreek() {
		const rng = this.S('creek'), h = this.half, road = this.road;
		if (!rng.chance(this.recipe.water.creek)) return;
		const vertical = Math.abs(road.B.x - road.A.x) >= Math.abs(road.B.z - road.A.z) ? true : rng.chance(0.5);
		const roadBends = bends(road.line);
		for (let cand = 0; cand < 24; cand++) {
			const flip = rng.chance(0.5);
			const a = rng.range(-0.5, 0.5) * h, b = rng.range(-0.5, 0.5) * h;
			const from = vertical ? { x: a, z: flip ? h : -h } : { x: flip ? h : -h, z: a }, to = vertical ? { x: b, z: flip ? -h : h } : { x: flip ? -h : h, z: b };
			const n = rng.int(5, 7), wobble = rng.range(...R.creekWobble), pts = [[from.x, from.z]];
			for (let i = 1; i <= n; i++) {
				const t = i / (n + 1) + rng.range(-0.03, 0.03), o = rng.range(-1, 1) * wobble;
				const x = lerp(from.x, to.x, t) + (vertical ? o : 0), z = lerp(from.z, to.z, t) + (vertical ? 0 : o);
				pts.push([clamp(x, -h + 6, h - 6), clamp(z, -h + 6, h - 6)]);
			}
			pts.push([to.x, to.z]);
			const creek = smoothPath(pts, R.creekStep);
			// exactly one crossing with the road, in its middle, away from the start and from the bends
			const hits = [];
			for (let i = 0; i + 1 < creek.length; i++) {
				for (let j = 0; j + 1 < road.pts.length; j++) {
					if (!segmentsIntersect(creek[i], creek[i + 1], road.pts[j], road.pts[j + 1])) continue;
					const m = road.line.nearest((creek[i].x + creek[i + 1].x) / 2, (creek[i].z + creek[i + 1].z) / 2);
					const tan = { x: creek[i + 1].x - creek[i].x, z: creek[i + 1].z - creek[i].z }, tl = Math.hypot(tan.x, tan.z) || 1;
					hits.push({ s: road.line.cum[j] + Math.hypot(road.pts[j + 1].x - road.pts[j].x, road.pts[j + 1].z - road.pts[j].z) / 2, sn: m.s, angle: Math.acos(Math.min(1, Math.abs((tan.x * m.tx + tan.z * m.tz) / tl))) });
				}
			}
			if (!hits.length) continue;
			const spread = Math.max(...hits.map((x) => x.sn)) - Math.min(...hits.map((x) => x.sn));
			if (spread > 5) continue;
			const s = hits[0].sn, L = road.line.length;
			if (s < L * R.creekCrossing[0] || s > L * R.creekCrossing[1]) continue;
			if (s < R.roadStartAlong + R.creekFromStart) continue;
			if (roadBends.some((b2) => Math.abs(b2.s - s) < R.creekBend)) continue;
			if (hits[0].angle < (R.creekAngle * Math.PI) / 180) continue;
			// the road meets the water only at the ford: elsewhere (entrance, exit, a bend that comes back) it keeps 1 m off the water edge
			let wet = false;
			for (let q = 0; q <= L && !wet; q += 2) {
				if (Math.abs(q - s) < 12) continue;
				const p = road.line.at(q);
				let d = Infinity;
				for (let i = 0; i + 1 < creek.length; i++) d = Math.min(d, segDist(p.x, p.z, creek[i], creek[i + 1]));
				if (d - R.creekWidth / 2 < R.roadWidth / 2 + 1) wet = true;
			}
			if (wet) continue;
			// the waypoint keeps its distance
			const wp = this.waypoint.at;
			let near = Infinity;
			for (let i = 0; i + 1 < creek.length; i++) near = Math.min(near, segDist(wp.x, wp.z, creek[i], creek[i + 1]));
			if (near < R.creekWidth / 2 + 8) continue;
			this.creek = creek;
			this.creekLine = new Line(creek);
			this.water.push({ id: 'creek', points: creek, width: R.creekWidth });
			this.zonesBank.push({ id: 'creek-banks', kind: 'bank', shape: bufferPolyline(creek, R.creekBank).map(pt) });
			this.waterField.addPolyline(creek, R.creekWidth / 2);
			this.creekIndex = new SegIndex([creek], 14);
			this.notes.push(`creek ${vertical ? 'N–S' : 'W–E'}, ford at s = ${Math.round(s)}`);
			return;
		}
	}

	// ---- clearance of a disc / a solid
	/** A disc (x, z, r) is clear of the road corridor (+ gap), water, the edge, placed zones, solids and no-go discs. */
	clear(x, z, r, { road = true, solids = true } = {}) {
		const h = this.half;
		if (Math.abs(x) > h - r - 3 || Math.abs(z) > h - r - 3) return false;
		if (road && this.roadField.at(x, z) < R.roadWidth / 2 + r + R.solidRoadGap) return false;
		if (this.waterField.at(x, z) < r + R.waterClearSolid) return false;
		for (const c of this.circles) if (Math.hypot(x - c.x, z - c.z) < c.r + r + 2) return false;
		for (const c of this.rects) if (Math.hypot(x - c.x, z - c.z) < c.r + r) return false;
		for (const p of this.paths) if (p.line.nearest(x, z).d < r + p.width / 2 + 1) return false;
		if (solids) {
			for (const s of this.solids) {
				const bb = s.box ??= polyBox(s.poly), m = r + s.margin + 1.5;
				if (x < bb.x0 - m || x > bb.x1 + m || z < bb.z0 - m || z > bb.z1 + m) continue;
				if (pointPolySigned(s.poly, x, z) < m) return false;
			}
		}
		return true;
	}

	/** Why a bundle does not fit (a solid on the road, in water, over the edge, on the waypoint or too near an earlier solid), or null. */
	solidsFit(bundle) {
		const h = this.half;
		for (const s of bundle.solids) {
			const box = polyBox(s.poly);
			if (box.x0 < -h + 3 || box.x1 > h - 3 || box.z0 < -h + 3 || box.z1 > h - 3) return `${s.label}:edge`;
			for (const p of outline(s.poly)) {
				if (this.roadField.at(p.x, p.z) < R.roadWidth / 2 + R.solidRoadGap + s.margin) return `${s.label}:road`;
				if (this.waterField.at(p.x, p.z) < R.waterClearSolid + s.margin) return `${s.label}:water`;
				for (const c of this.rects) if (Math.hypot(p.x - c.x, p.z - c.z) < c.r) return `${s.label}:waypoint`;
			}
			if (s.label === 'field') for (const c of this.circles) if (pointPolySigned(s.poly, c.x, c.z) < c.r + 1) return `field:zone`; // another zone's circle would win the zone lookup over the field
			for (const o of this.solids) {
				const ob = polyBox(o.poly);
				const gap = R.solidGap + s.margin + o.margin;
				if (box.x1 + gap < ob.x0 || ob.x1 + gap < box.x0 || box.z1 + gap < ob.z0 || ob.z1 + gap < box.z0) continue;
				if (polyDistance(s.poly, o.poly) < gap) return `${s.label}:solid`;
			}
		}
		return null;
	}

	// ---- branch routing
	/** Whether a candidate path is allowed: off water, off the road (beyond the junction), out of other zones and solids, clear of other paths. */
	pathOk(points, half, bundle) {
		const line = new Line(points);
		if (line.length > R.laneMax || line.length < 4) return false;
		const h = this.half;
		for (let s = 0; s <= line.length; s += 1) {
			const p = line.at(s);
			if (Math.abs(p.x) > h - 3 || Math.abs(p.z) > h - 3) return false;
			if (s > 7 && this.roadField.at(p.x, p.z) < R.roadWidth / 2 + half + R.laneRoadGap) return false;
			if (this.waterField.at(p.x, p.z) < half + R.laneRoadGap) return false;
			for (const c of this.circles) if (c.bundle !== bundle && Math.hypot(p.x - c.x, p.z - c.z) < c.r + 1.5) return false;
			for (const c of this.rects) if (Math.hypot(p.x - c.x, p.z - c.z) < c.r) return false;
			if (s >= 8) { // not the junction itself
				for (const o of this.paths) {
					const bb = o.box ??= polyBox(o.points);
					const m = half + o.width / 2 + 3;
					if (p.x < bb.x0 - m || p.x > bb.x1 + m || p.z < bb.z0 - m || p.z > bb.z1 + m) continue;
					if (o.line.nearest(p.x, p.z).d < m) return false;
				}
			}
			for (const sol of this.solids) {
				const bb = sol.box ??= polyBox(sol.poly), m = half + 1 + sol.margin * 0.5;
				if (p.x < bb.x0 - m || p.x > bb.x1 + m || p.z < bb.z0 - m || p.z > bb.z1 + m) continue;
				if (pointPolySigned(sol.poly, p.x, p.z) < m) return false;
			}
			for (const sol of bundle.solids) {
				if (sol.pass) continue;
				const bb = sol.box ??= polyBox(sol.poly), m = half + 1 + sol.margin * 0.5;
				if (p.x < bb.x0 - m || p.x > bb.x1 + m || p.z < bb.z0 - m || p.z > bb.z1 + m) continue;
				if (pointPolySigned(sol.poly, p.x, p.z) < m) return false;
			}
		}
		return true;
	}

	/** Route a lane from the road to `end`, arriving along `away` reversed (the lane leaves the end along `away`). Returns the smoothed points or null. */
	routeLane(bundle, rng) {
		const lane = bundle.lane, E = lane.end, away = lane.away, ahead = bundle.kind === 'graveyard' ? 6 : 9;
		const pre = { x: E.x + away.x * ahead, z: E.z + away.z * ahead };
		const line = this.roadLine, L = line.length;
		const forks = this.paths.filter((p) => p.junction !== undefined).map((p) => p.junction);
		const cands = [];
		for (let s = 8; s <= L - 8; s += 2) {
			const p = line.at(s);
			if (forks.some((f) => Math.abs(f - s) < R.forkGap)) continue;
			if (this.creekLine && Math.abs(s - this.crossingS()) < 10) continue;
			if (Math.hypot(p.x - this.waypoint.at.x, p.z - this.waypoint.at.z) < 9) continue;
			cands.push({ s, p, d: Math.hypot(p.x - pre.x, p.z - pre.z) });
		}
		cands.sort((a, b) => a.d - b.d);
		for (const c of cands.slice(0, 10)) {
			const ctrl = [[c.p.x, c.p.z]];
			const gap = Math.hypot(pre.x - c.p.x, pre.z - c.p.z);
			if (gap > 16) {
				const w = rng.range(2, 5) * rng.sign(), nx = -(pre.z - c.p.z) / gap, nz = (pre.x - c.p.x) / gap;
				ctrl.push([lerp(c.p.x, pre.x, 0.5) + nx * w, lerp(c.p.z, pre.z, 0.5) + nz * w]);
			}
			ctrl.push([pre.x, pre.z], [E.x, E.z]);
			const pts = smoothPath(ctrl, 2.5);
			// leaves the road at a fork angle
			const p0 = pts[0], p2 = pts[Math.min(2, pts.length - 1)], hd = unit(p2.x - p0.x, p2.z - p0.z), rd = line.nearest(p0.x, p0.z);
			if (Math.abs(hd.x * rd.tz - hd.z * rd.tx) < Math.sin((R.laneJunction * Math.PI) / 180)) continue;
			if (!this.pathOk(pts, lane.width / 2, bundle)) continue;
			return { points: pts, junction: c.s };
		}
		return null;
	}

	crossingS() {
		if (this._cs !== undefined) return this._cs;
		let best = null;
		for (let i = 0; i + 1 < this.creek.length; i++) {
			for (let j = 0; j + 1 < this.road.pts.length; j++) {
				if (segmentsIntersect(this.creek[i], this.creek[i + 1], this.road.pts[j], this.road.pts[j + 1])) { best = this.road.line.cum[j]; break; }
			}
			if (best !== null) break;
		}
		return (this._cs = best ?? -999);
	}

	// ---- points of interest
	choosePois(rng) {
		const kinds = Object.keys(this.recipe.pois), want = [];
		const S = Math.max(1, this.scale);
		for (const kind of kinds) {
			const e = this.recipe.pois[kind] * S, n = Math.floor(e) + (rng.chance(e - Math.floor(e)) ? 1 : 0);
			for (let i = 0; i < n; i++) want.push(kind);
		}
		const min = poiMin(this.recipe.poiMin, S), max = Math.round(this.recipe.poiMax * S);
		const byProb = kinds.slice().sort((a, b) => this.recipe.pois[b] - this.recipe.pois[a]);
		for (let i = 0; want.length < min && i < 40; i++) {
			const kind = byProb[i % byProb.length];
			if (S > 1 || !want.includes(kind)) want.push(kind); // one of each kind on a 128 m map
		}
		const order = ['farm', 'camp', 'den', 'graveyard'];
		want.sort((a, b) => order.indexOf(a) - order.indexOf(b));
		while (want.length > max) want.pop();
		return want;
	}

	/** Snapshot / restore of everything a zone placement appends to (the zones are placed again in another order when the map is not full). */
	snapshot() {
		const o = { instances: { ...this.instances } };
		for (const k of PLACED) o[k] = this[k].slice();
		return o;
	}

	restore(o) {
		for (const k of PLACED) this[k] = o[k].slice();
		this.instances = { ...o.instances };
	}

	makePois() {
		const rng = this.S('poi'), want = this.choosePois(rng);
		const min = poiMin(this.recipe.poiMin, Math.max(1, this.scale)), base = this.snapshot();
		const kinds = ['farm', 'camp', 'den', 'graveyard'], goal = Math.min(want.length, 4 * Math.max(1, Math.round(this.scale)));
		const rounds = [];
		// the big zones (farm, camp) crowd out the rest: try the wanted kinds in a few seeded orders; the fullest map wins, a tie goes to a seeded pick
		for (let round = 0; round < R.poiRounds; round++) {
			const order = want.slice();
			if (round > 0) for (let i = order.length - 1; i > 0; i--) { const k = Math.floor(rng.next() * (i + 1)); [order[i], order[k]] = [order[k], order[i]]; }
			let placed = 0, wanted = 0;
			for (const kind of order) {
				const n = (this.instances[kind] = (this.instances[kind] ?? 0) + 1);
				if (this.placePoi(kind, n, round)) { placed++; wanted++; }
				else { this.instances[kind] = n - 1; this.notes.push(`no room for a ${kind}`); }
			}
			// replacements for the kinds that did not fit, as long as the minimum is not met
			for (const kind of kinds) {
				if (placed >= min) break;
				if (this.instances[kind]) continue;
				this.instances[kind] = 1;
				if (this.placePoi(kind, 1, round)) placed++; else this.instances[kind] = 0;
			}
			rounds.push({ score: wanted + (placed - wanted) * 0.5, snap: this.snapshot() });
			if (wanted >= goal) break;
			this.restore(base);
		}
		const top = Math.max(...rounds.map((r) => r.score)), tied = rounds.filter((r) => r.score === top);
		this.restore(tied[Math.floor(rng.next() * tied.length)].snap);
	}

	/** The door normal that points at the road as closely as the front half-plane allows (clamped to 72° off south-east). */
	frontOf(u, jitter = 0) {
		const front0 = Math.PI / 4, lim = (R.frontLimit * Math.PI) / 180;
		let delta = Math.atan2(u.x, u.z) - front0;
		delta = Math.atan2(Math.sin(delta), Math.cos(delta));
		const theta = front0 + clamp(clamp(delta, -lim, lim) + jitter, -lim, lim);
		return { x: Math.sin(theta), z: Math.cos(theta), theta };
	}

	/** Why a zone circle of kind `kind` cannot be centred at (cx, cz) (cheap tests only), or null. */
	centreOk(kind, cx, cz, memo = false) {
		const zr = ZONE_RULES[kind].r, h = this.half, [dMin, dMax] = R.poiRoadDistance[kind], busy = kind === 'farm' || kind === 'camp';
		if (Math.abs(cx) > h - zr - R.zoneEdge || Math.abs(cz) > h - zr - R.zoneEdge) return 'edge';
		if (this.circles.some((c) => Math.hypot(cx - c.x, cz - c.z) < c.r + zr + R.zoneGap)) return 'zone-gap';
		for (const s of this.solids) if (s.label === 'field' && pointPolySigned(s.poly, cx, cz) < zr + 1) return 'field'; // this circle would win the zone lookup over an earlier field
		if (Math.hypot(cx - this.start.x, cz - this.start.z) < (busy ? R.busyStart : kind === 'den' ? R.spawnStart + 13 : R.spawnStart + 5)) return 'start';
		let near;
		if (memo) {
			const key = Math.round(cx * 4) * 8192 + Math.round(cz * 4);
			near = this.nearMemo.get(key);
			if (!near) this.nearMemo.set(key, (near = this.roadLine.nearest(cx, cz)));
		} else near = this.roadLine.nearest(cx, cz);
		if (near.d < dMin || near.d > dMax) return 'road-distance';
		if (this.waterField.at(cx, cz) < 6 || this.rects.some((c) => Math.hypot(cx - c.x, cz - c.z) < c.r + zr * 0.5)) return 'water';
		const u = unit(near.x - cx, near.z - cz);
		if (kind === 'camp' && -(u.x * FORWARD.x + u.z * FORWARD.z) < R.campBack) return 'camp-back'; // behind the road: the road is south-east of the camp
		if (kind !== 'graveyard') {
			const f = this.frontOf(u);
			if (f.x * u.x + f.z * u.z < R.facingRoad) return 'facing'; // the door normal cannot both face the road and stay in the front half-plane
		}
		return null;
	}

	placePoi(kind, n, round = 0) {
		const rng = this.S(`poi:${kind}:${n}:${round}`), nm = (base) => (n > 1 ? `${base}-${n}` : base);
		const zr = ZONE_RULES[kind].r, h = this.half, line = this.roadLine;
		const no = (why) => { const k = `${kind}:${why}`; this.rejected[k] = (this.rejected[k] ?? 0) + 1; };
		// the feasible centres on a 3 m grid (edge, zone gap, start, road distance, water), visited in a seeded order
		const cands = [];
		for (let gx = -h + zr + R.zoneEdge; gx <= h - zr - R.zoneEdge; gx += 3) {
			for (let gz = -h + zr + R.zoneEdge; gz <= h - zr - R.zoneEdge; gz += 3) {
				const why = this.centreOk(kind, gx, gz, true);
				if (why) this.rejected[`${kind}:grid-${why}`] = (this.rejected[`${kind}:grid-${why}`] ?? 0) + 1;
				else cands.push({ x: gx, z: gz });
			}
		}
		// seeded order, biased to open ground: a candidate far from the zones placed so far comes earlier (the map is not all on one side)
		for (const c of cands) {
			let gap = R.spreadReach;
			for (const o of this.circles) gap = Math.min(gap, Math.hypot(c.x - o.x, c.z - o.z) - o.r);
			c.key = rng.next() + (R.spreadWeight * gap) / R.spreadReach;
		}
		cands.sort((a, b) => b.key - a.key || a.x - b.x || a.z - b.z);
		for (let attempt = 0; attempt < Math.min(cands.length, R.tries); attempt++) {
			const cx = cands[attempt].x + rng.range(-1.4, 1.4), cz = cands[attempt].z + rng.range(-1.4, 1.4);
			const why0 = this.centreOk(kind, cx, cz);
			if (why0) { no(why0); continue; }
			const near = line.nearest(cx, cz);
			const u = unit(near.x - cx, near.z - cz); // to the road
			// the frame: doors / the gate / the den mouth face the road within the front half-plane (graveyard: its road side is local −z)
			const theta = kind === 'graveyard' ? Math.atan2(-u.x, -u.z) + rng.range(-0.35, 0.35) : this.frontOf(u, rng.range(-0.12, 0.12)).theta;
			// the sampled point is the zone circle's centre; the frame's origin is placed so that the template's own centre c0 lands on it;
			// both mirror images are tried (a field, a pen or a meadow may only fit on one side)
			const mirror0 = rng.chance(0.5);
			let bundle = null, why = null;
			for (const mirror of [mirror0, !mirror0]) {
				const F0 = new Frame(0, 0, theta, mirror), c0 = F0.vec(...ZONE_RULES[kind].c0);
				const F = new Frame(cx - c0.x, cz - c0.z, theta, mirror);
				const b = this.build(kind, F, rng, nm, u);
				if (!b) { why = 'template'; continue; }
				const misfit = this.solidsFit(b);
				if (misfit) { why = `solids:${misfit.replace(/-\d+$/, '')}`; continue; }
				if (!this.clear(b.lane ? b.lane.end.x : b.centre.x, b.lane ? b.lane.end.z : b.centre.z, 0.5, { solids: false })) { why = 'lane-end'; continue; }
				if (b.lane && this.roadField.at(b.lane.end.x, b.lane.end.z) < (kind === 'graveyard' ? 8 : 9)) { why = 'lane-end-near-road'; continue; }
				bundle = b;
				break;
			}
			if (!bundle) { no(why); continue; }
			bundle.n = n;
			// the way in
			let route = null;
			if (kind === 'den') {
				const trail = bundle.trail, points = smoothPath(trail.points.map((p) => [p.x, p.z]), 2.5);
				if (this.pathOk(points, trail.width / 2, bundle)) route = { points, junction: undefined }; // an animal trail is no fork: it does not have to touch the road
			} else route = this.routeLane(bundle, this.S(`lane:${kind}:${n}:${round}:${attempt}`));
			if (!route) { no('route'); continue; }
			this.commit(bundle, route, rng);
			return bundle;
		}
		return null;
	}

	build(kind, F, rng, nm, u) {
		const ctx = { road: (x, z) => this.roadLine.nearest(x, z), clear: (x, z, r) => this.clear(x, z, r), water: (x, z) => this.waterField.at(x, z) };
		switch (kind) {
			case 'farm': return buildFarm(F, rng, nm);
			case 'camp': return buildCamp(F, rng, nm);
			case 'den': return buildDen(F, rng, nm, ctx);
			default: return buildGraveyard(F, rng, nm, u, ctx);
		}
	}

	commit(bundle, route, rng) {
		const lane = bundle.lane ?? bundle.trail;
		const points = route.points;
		const entry = { id: lane.id, kind: lane.kind, width: lane.width, inhabited: lane.inhabited, points, line: new Line(points), junction: route.junction };
		this.paths.push(entry);
		if (bundle.afterLane) {
			const free = (x, z, r) => this.clear(x, z, r) && this.paths.every((p) => p.line.nearest(x, z).d > r + 1);
			bundle.afterLane(entry.line, free, this.S(`after:${lane.id}`));
		}
		this.circles.push({ x: bundle.centre.x, z: bundle.centre.z, r: bundle.r, id: bundle.id, bundle });
		for (const s of bundle.solids) this.solids.push({ ...s, bundle });
		this.bundles.push(bundle);
		this.masses.push(...bundle.masses); this.events.push(...bundle.events);
		this.pads.push(...bundle.pads); this.levelPads.push(...bundle.levelPads); this.rocks.push(...bundle.rocks); this.blood.push(...bundle.blood);
		this.notes.push(`${bundle.kind} ${bundle.id} at (${Math.round(bundle.centre.x)}, ${Math.round(bundle.centre.z)}), lane ${Math.round(entry.line.length)} m`);
	}

	// ---- road extras: a wrecked cart with a spill, a landmark tree near a fork
	makeCart() {
		const rng = this.S('cart');
		if (!rng.chance(this.recipe.extras.cart)) return;
		const line = this.roadLine, L = line.length, forks = this.paths.filter((p) => p.junction !== undefined).map((p) => p.junction);
		for (let k = 0; k < 60; k++) {
			const s = rng.range(L * 0.25, L * 0.85);
			if (forks.some((f) => Math.abs(f - s) < 14) || (this.creekLine && Math.abs(s - this.crossingS()) < 14)) continue;
			const at = line.at(s), n0 = { x: at.tz, z: -at.tx };
			const sign = n0.x * FORWARD.x + n0.z * FORWARD.z > 0 ? 1 : -1; // the back (north-west) side of the road
			const n = { x: n0.x * sign, z: n0.z * sign };
			const yaw = Math.atan2(-at.tz, at.tx) + rng.range(-0.15, 0.15), scale = 0.975;
			const box = ASSET_BOX['tentsB.cart_awning'].box;
			let off = R.roadWidth / 2 + 0.6 + 1.9;
			let placed = null;
			for (let i = 0; i < 8; i++) {
				const c = { x: at.x + n.x * off, z: at.z + n.z * off }, fp = footprintObb(box, c.x, c.z, yaw, scale);
				const gap = Math.min(...outline(fp.pts, 0.8).map((p) => this.roadField.at(p.x, p.z))) - R.roadWidth / 2;
				if (gap >= 0.6) { placed = { c, fp }; break; }
				off += 0.4;
			}
			if (!placed) continue;
			const { c, fp } = placed;
			if (!this.clear(c.x, c.z, 4.2, { road: false })) continue;
			const ev = { x: c.x + n.x * 4.5, z: c.z + n.z * 4.5 };
			if (!this.clear(ev.x, ev.z, 2.2, { road: false }) || this.roadField.at(ev.x, ev.z) < R.roadWidth / 2 + 2) continue;
			this.masses.push({ id: 'cart', asset: 'tentsB.cart_awning', at: pt(c), yaw: r3(yaw), label: 'Wrecked cart' });
			this.events.push({ id: 'cart', cause: 'spill', host: 'cart', at: pt(ev), dir: r3(Math.atan2(n.z, n.x)), age: 'old' });
			this.pads.push({ x: c.x, z: c.z, r: 4.5 });
			this.rects.push({ x: c.x, z: c.z, r: 4.2 });
			this.solids.push({ poly: fp.pts, label: 'cart', margin: 0.5, bundle: null });
			this.notes.push(`cart at s = ${Math.round(s)}`);
			return;
		}
	}

	/** A landmark tree (deadTrees.tall, ≥ 2 H) on the back side of the road within `spread` m of arclength `s`; null when nothing fits. */
	placeTree(rng, s, id, tries = 40, spread = 5) {
		const line = this.roadLine, box = ASSET_BOX['deadTrees.tall'].box;
		const hostPts = this.bundles.flatMap((b) => [...b.hosts.filter((h) => h.at).map((h) => h.at), ...b.events.filter((e) => e.at).map((e) => e.at)]).concat(this.events.filter((e) => e.at).map((e) => e.at));
		for (let k = 0; k < tries; k++) {
			const at = line.at(clamp(s + rng.range(-spread, spread), 0, line.length)), n0 = { x: at.tz, z: -at.tx };
			// the back (north-west) side first; when it has no room (the road runs along the map edge) the front side, far enough that the tree's
			// camera shadow (height × 1.73 ≈ 8 m) stays off the road
			const front = k >= tries * 0.6, back = n0.x * FORWARD.x + n0.z * FORWARD.z > 0 ? 1 : -1, sign = front ? -back : back;
			const d = front ? rng.range(R.treeBack[1] + 2, R.treeBack[1] + 6) : rng.range(R.treeBack[0], R.treeBack[1] + (k > tries / 3 ? 3 : 0));
			const p = { x: at.x + n0.x * sign * d + at.tx * rng.range(-4, 4), z: at.z + n0.z * sign * d + at.tz * rng.range(-4, 4) };
			const scale = r2(rng.range(...R.treeScale)), yaw = r3(rng.range(-Math.PI, Math.PI));
			if (!this.clear(p.x, p.z, 3.2)) continue;
			if (hostPts.some((q) => Math.hypot(p.x - q.x, p.z - q.z) < R.treeHostGap)) continue;
			if (this.masses.some((m) => (m.asset === 'lighting.beacon' || m.asset === 'deadTrees.tall') && Math.hypot(p.x - m.at.x, p.z - m.at.z) < R.landmarkSpacing + 4)) continue;
			const fp = footprintObb(box, p.x, p.z, yaw, scale);
			const mass = { id, asset: 'deadTrees.tall', at: pt(p), yaw, scale, label: 'Landmark tree' };
			this.masses.push(mass);
			this.rects.push({ x: p.x, z: p.z, r: 3.2 });
			this.solids.push({ poly: fp.pts, label: id, margin: 0.5, bundle: null });
			return mass;
		}
		return null;
	}

	/**
	 * Landmarks (AD 12 §4.3: one ≥ 2 H per 1–2 screens of the main path): a tree near a fork, plus a tree for every 32 m window of the road
	 * that has none within sight (the camp's beacon counts). The engine's own insertion looks 9–16 m north-west of the window mid-point and
	 * fails near the road ends, in water and in camps, so the plan carries them: the engine then finds every window covered.
	 */
	makeLandmarks() {
		const rng = this.S('tree'), line = this.roadLine, L = line.length;
		const forks = this.paths.filter((p) => p.junction !== undefined).map((p) => p.junction);
		const anchor = forks.length ? forks[rng.int(0, forks.length - 1)] : rng.range(L * 0.3, L * 0.8);
		if (this.placeTree(rng, anchor, 'old-tree')) this.notes.push('landmark tree near a fork');
		const seen = (s0, s1) => {
			for (let s = s0; s <= s1 + 1e-6; s += 4) {
				const q = line.at(Math.min(s, L));
				if (this.masses.some((m) => (m.asset === 'lighting.beacon' || m.asset === 'deadTrees.tall') && Math.hypot(m.at.x - q.x, m.at.z - q.z) <= LAYOUT_RULES.landmarkSee)) return true;
			}
			return false;
		};
		const win = LAYOUT_RULES.landmarkWindow;
		let extra = 0;
		for (let s0 = 0; s0 < L - win * LAYOUT_RULES.landmarkMinTail; s0 += win) {
			const s1 = Math.min(L, s0 + win);
			if (seen(s0, s1)) continue;
			if (this.placeTree(rng, (s0 + s1) / 2, `old-tree-${++extra + 1}`, 120, (s1 - s0) / 2 - 4)) this.notes.push(`landmark tree for the window s = ${Math.round(s0)}–${Math.round(s1)}`);
		}
	}

	// ---- pond
	makePond() {
		const rng = this.S('pond');
		if (!rng.chance(this.recipe.water.pond)) return;
		const h = this.half;
		for (let k = 0; k < 50; k++) {
			const r = rng.range(...R.pondRadius), cx = rng.range(-h + r + 12, h - r - 12), cz = rng.range(-h + r + 12, h - r - 12);
			const rr = r * 1.25 + 1;
			if (this.roadField.at(cx, cz) < R.pondPathClear + rr || this.waterField.at(cx, cz) < 8 + rr) continue;
			if (this.circles.some((c) => Math.hypot(cx - c.x, cz - c.z) < c.r + rr + 2)) continue;
			if (this.rects.some((c) => Math.hypot(cx - c.x, cz - c.z) < c.r + rr + 2)) continue;
			if (this.paths.some((p) => p.line.nearest(cx, cz).d < R.pondPathClear + rr)) continue;
			if (this.solids.some((s) => pointPolySigned(s.poly, cx, cz) < rr + 3)) continue;
			const n = 7, a0 = rng.next() * TAU, poly = [];
			let rmax = 0;
			for (let i = 0; i < n; i++) {
				const a = a0 + ((i + rng.range(-0.25, 0.25)) / n) * TAU, rad = r * rng.range(0.75, 1.25);
				rmax = Math.max(rmax, rad);
				poly.push({ x: r2(cx + Math.cos(a) * rad), z: r2(cz + Math.sin(a) * rad) });
			}
			this.pond = { poly, x: cx, z: cz, r: rmax };
			this.water.push({ id: 'pond', polygon: poly });
			this.zonesBank.push({ id: 'pond-bank', kind: 'bank', shape: { x: r2(cx), z: r2(cz), r: r2(rmax + R.pondBank) } });
			this.waterField.addDisc(cx, cz, rmax);
			this.notes.push('pond');
			return;
		}
	}

	// ---- boundary: the ridge on the back edges (north always, west unless the road starts or ends there), cliffs on it
	makeBoundary() {
		const rng = this.S('ridge'), h = this.half, road = this.road;
		const roadOnW = road.e0 === 'W' || road.e1 === 'W';
		this.ridge = { N: true, W: !roadOnW };
		// gaps: where the road and the creek meet a back edge the rise dies out
		this.gaps = [];
		const ends = [road.pts[0], road.pts[road.pts.length - 1]].concat(this.creek ? [this.creek[0], this.creek[this.creek.length - 1]] : []);
		for (const p of ends) if (p.z <= -h + R.endInset + 1 || p.x <= -h + R.endInset + 1) this.gaps.push({ x: p.x, z: p.z });
		this.cliffs = [];
		const edges = [['N', true], ['W', this.ridge.W]];
		for (const [edge, on] of edges) {
			if (!on) continue;
			const count = rng.int(R.cliffCount[0], R.cliffCount[1]);
			const along = (g) => (edge === 'N' ? g.x : g.z);
			const gapsHere = this.gaps.filter((g) => (edge === 'N' ? g.z <= -h + R.endInset + 1 : g.x <= -h + R.endInset + 1)).map(along);
			const placed = [];
			for (let i = 0; i < count; i++) {
				for (let k = 0; k < 60; k++) {
					const w = k < 24 ? rng.range(...R.cliffWidth) : rng.range(14, R.cliffWidth[0]), c = rng.range(-h + w / 2 + 6, h - w / 2 - 6); // a shorter piece when the long ones find no gap
					if (gapsHere.some((g) => Math.abs(c - g) < R.cliffGap - 13 + w / 2 + 2)) continue;
					if (placed.some((q) => Math.abs(c - q.c) < (w + q.w) / 2 + 6)) continue;
					// off the zones' solids (a camp's palisade or beacon near the edge), the road and the water
					const poly = massObb({ footprint: { w, d: R.cliffDepth }, at: edge === 'N' ? { x: c, z: -h + R.cliffInset } : { x: -h + R.cliffInset, z: c }, yaw: edge === 'N' ? 0 : Math.PI / 2 }).pts;
					if (this.solids.some((o) => polyDistance(poly, o.poly) < R.solidGap + o.margin)) continue;
					if (outline(poly).some((q) => this.roadField.at(q.x, q.z) < R.roadWidth / 2 + 3 || this.waterField.at(q.x, q.z) < 3)) continue;
					placed.push({ c, w });
					break;
				}
			}
			placed.forEach((q, i) => {
				const height = r2(rng.range(...R.cliffHeight));
				const at = edge === 'N' ? { x: q.c, z: -h + R.cliffInset } : { x: -h + R.cliffInset, z: q.c };
				const cliff = { id: `cliff-${edge.toLowerCase()}${placed.length > 1 ? i + 1 : ''}`, kind: 'cliff', footprint: { w: r2(q.w), d: R.cliffDepth }, height, at: pt(at), yaw: edge === 'N' ? 0 : Math.PI / 2, label: edge === 'N' ? 'North ridge' : 'West ridge' };
				this.masses.push(cliff);
				this.solids.push({ poly: massObb(cliff).pts, label: cliff.id, margin: 0.5, bundle: null });
			});
		}
		// the first cliff keeps the demo's id so a scene that looks for 'cliff' finds it
		const first = this.masses.find((m) => m.kind === 'cliff');
		if (first) first.id = 'cliff';
	}

	// ---- ground
	makeGround() {
		const seed = this.seed, attempt = this.attempt, rng = this.S('ground'), b = this.bounds;
		const sLow = hash32(seed, attempt, 'g-low') & 0xffff, sBump = hash32(seed, attempt, 'g-bump') & 0xffff, sRidge = hash32(seed, attempt, 'g-ridge') & 0xffff;
		const sWet = hash32(seed, attempt, 'g-wet') & 0xffff, sRock = hash32(seed, attempt, 'g-rock') & 0xffff, sGrass = (hash32(seed, attempt, 'g-grass') & 0x3fff) + 23;
		const ox = rng.range(0, 400), oz = rng.range(0, 400), gx = rng.range(-300, 300), gz = rng.range(-300, 300);
		const lowAt = (x, z) => (vnoise(x * R.groundLowScale + ox, z * R.groundLowScale + oz, sLow) - 0.5) * R.groundLow;
		// 1 m distance fields: flatField = paths and pads (the terrain is levelled there), walkField = paths only (they are trampled bare)
		const flat = new DistField(b, R.fieldCell, R.flatFar + 2), walk = new DistField(b, R.fieldCell, R.trample + 1);
		const lines = [this.road.pts, ...this.paths.map((p) => p.points)];
		for (const l of lines) { flat.addPolyline(l); walk.addPolyline(l); }
		for (const p of this.pads) flat.addDisc(p.x, p.z, p.r);
		const level = this.levelPads.map((p) => ({ ...p, h: lowAt(p.x, p.z) }));
		const creekIdx = this.creekIndex ?? null, cw = R.creekWidth;
		const pond = this.pond ?? null, pondBox = pond ? polyBox(pond.poly) : null;
		const ridgeN = this.ridge.N, ridgeW = this.ridge.W, gaps = this.gaps, hh = this.half, band = R.ridgeBand;
		const rocks = this.rocks.map((r) => ({ ...r })), blood = this.blood.map((r) => ({ ...r }));
		const frontWetW = R.frontWet;
		const ridgeAt = (x, z) => {
			let t = 0;
			if (ridgeN) t = sm(-hh + band, -hh, z);
			if (ridgeW) t = Math.max(t, sm(-hh + band, -hh, x));
			if (t <= 0) return { h: 0, rock: 0 };
			let gap = 1;
			for (const g of gaps) gap = Math.min(gap, sm(R.ridgeGap[0], R.ridgeGap[1], Math.hypot(x - g.x, z - g.z)));
			const k = t * gap;
			return { h: k * (R.ridgeAmp[0] + vnoise(x * 0.07, z * 0.07, sRidge) * (R.ridgeAmp[1] - R.ridgeAmp[0])), rock: k * (0.5 + vnoise(x * 0.1, z * 0.1, sRock)) };
		};
		this.ground = (x, z) => {
			const low = lowAt(x, z), bumps = (vnoise(x * R.groundBumpScale, z * R.groundBumpScale, sBump) - 0.5) * R.groundBump;
			const fl = 1 - sm(R.flatNear, R.flatFar, flat.at(x, z));
			const ridge = ridgeAt(x, z);
			let height = low + bumps * (1 - fl) + ridge.h;
			for (const p of level) {
				const w = 1 - sm(p.r, p.r + R.levelBlend, Math.hypot(x - p.x, z - p.z));
				if (w > 0) height = height * (1 - w) + p.h * w;
			}
			const cd = creekIdx ? creekIdx.dist(x, z) : Infinity;
			const inPond = pond && x >= pondBox.x0 && x <= pondBox.x1 && z >= pondBox.z0 && z <= pondBox.z1 && pointInPoly(pond.poly, x, z);
			const water = cd < cw / 2 || !!inPond;
			const hollow = sm(0.1, -1.1, low + bumps) * 0.3;
			const pondSoft = pond ? (1 - sm(pond.r, pond.r + 4, Math.hypot(x - pond.x, z - pond.z))) * 0.5 : 0;
			const edgeWet = Math.max(sm(hh - frontWetW, hh, z), sm(hh - frontWetW, hh, x)) * (0.3 + 0.3 * vnoise(x * 0.2, z * 0.2, sWet + 5));
			const wet = Math.min(1, 0.08 + 0.2 * vnoise(x * 0.05, z * 0.05, sWet) + hollow + (1 - sm(cw / 2, cw / 2 + 4, cd)) * 0.8 + (inPond ? 1 : 0) + pondSoft + edgeWet);
			let rock = ridge.rock;
			for (const r of rocks) rock = Math.max(rock, sm(r.r, r.r * 0.375, Math.hypot(x - r.x, z - r.z)) * r.k);
			rock = Math.min(1, rock);
			const trampled = 1 - sm(0, R.trample, walk.at(x, z));
			const grass = clamp(0.3 + 0.85 * patchField(x + gx, z + gz, sGrass) - rock * 0.9 - wet * 0.25 - trampled * 0.45, 0, 1);
			let bl = 0;
			for (const r of blood) bl = Math.max(bl, sm(r.r, r.r * 0.27, Math.hypot(x - r.x, z - r.z)) * r.k);
			return { height, wet, grass, blood: bl, rock, water };
		};
	}

	// ---- the plan
	assemble(seed) {
		const b = this.bounds, road = this.road;
		const zones = [...this.zonesBank];
		for (const bundle of this.bundles) zones.push(...bundle.zones);
		const paths = [{ id: 'road', kind: 'road', points: road.pts, width: R.roadWidth, inhabited: true, ...(road.ruts ? { ruts: road.ruts } : {}) }];
		for (const p of this.paths) paths.push({ id: p.id, kind: p.kind, points: p.points, width: p.width, ...(p.kind === 'animal' ? {} : { inhabited: p.inhabited }) });
		const doors = [], interactions = [this.waypoint], spawns = [], arenas = [], hosts = [];
		for (const bundle of this.bundles) { doors.push(...bundle.doors); interactions.push(...bundle.interactions); spawns.push(...bundle.spawns); arenas.push(...bundle.arenas); hosts.push(...bundle.hosts); }
		const t = R.endInset + 1, edgeOf = (p) => (p.x <= -this.half + t ? 'W' : p.x >= this.half - t ? 'E' : p.z <= -this.half + t ? 'N' : 'S');
		const first = road.pts[0], last = road.pts[road.pts.length - 1];
		return {
			id: `gen-moor-${this.size}-s${seed}`, // unique per (size, seed): baked files of two maps never overwrite each other
			seed,
			bounds: { ...b },
			defaultZone: this.recipe.defaultZone,
			zones,
			paths,
			water: this.water,
			doors,
			interactions,
			spawns,
			arenas,
			masses: this.masses,
			hosts,
			events: this.events,
			ground: this.ground,
			start: this.start,
			exits: [{ id: 'entrance', edge: edgeOf(first), at: pt(first) }, { id: 'exit', edge: edgeOf(last), at: pt(last) }],
			meta: { generator: PLAN_GEN_VERSION, seed, attempt: this.attempt, biome: 'moor', size: this.size, zones: zones.filter((z) => z.kind !== 'bank' && z.kind !== 'field').map((z) => z.id), notes: this.notes, rejected: this.rejected },
		};
	}
}

/**
 * One seed → a complete plan of the shape of DEMO_PLAN (+ start, exits, meta). `attempt` re-rolls every stream (generateMap retries).
 * The ground sampler is a closure: compare plans with groundGrid(), not with deep equality of functions.
 */
export function generatePlan(seed, { size = R.size, biome = 'moor', attempt = 0 } = {}) {
	const recipe = BIOME_RECIPES[biome];
	if (!recipe) throw new Error(`unknown biome ${biome}`);
	const g = new Gen(seed, attempt, size, recipe);
	g.makeRoad();
	g.makeWaypoint();
	g.makeCreek();
	g.makePois();
	g.makeBoundary();
	g.makeCart();
	g.makeLandmarks();
	g.makePond();
	g.makeGround();
	return g.assemble(seed);
}

/** The ground of a plan on a coarse grid, as plain numbers (determinism tests compare this instead of the closure). */
export function groundGrid(plan, step = 8) {
	const out = [], b = plan.bounds;
	for (let z = b.z0; z <= b.z1; z += step) for (let x = b.x0; x <= b.x1; x += step) {
		const g = plan.ground(x, z);
		out.push([r2(g.height), r2(g.wet), r2(g.grass), r2(g.blood), r2(g.rock), g.water ? 1 : 0]);
	}
	return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Plan checks: independent of the generator, from the plan alone (+ preparePlan's reserved shapes)

const arenaAt = (a) => a.at ?? (a.rect.x0 !== undefined ? { x: (a.rect.x0 + a.rect.x1) / 2, z: (a.rect.z0 + a.rect.z1) / 2 } : a.rect);
const kindOfEdge = (b, p, tol) => (Math.abs(p.x - b.x0) <= tol ? 'W' : Math.abs(p.x - b.x1) <= tol ? 'E' : Math.abs(p.z - b.z0) <= tol ? 'N' : Math.abs(p.z - b.z1) <= tol ? 'S' : null);

/** Plan-level checks. `catalog` (optional) gives the real footprints of asset masses; without it ASSET_BOX is used. */
export function checkPlan(plan, { catalog = null } = {}) {
	const checks = [];
	const add = (id, rule, pass, details = {}) => checks.push({ id, rule, pass, details });
	const b = plan.bounds, half = (b.x1 - b.x0) / 2;
	const P = preparePlan(plan);
	const road = new Line(plan.paths.find((p) => p.kind === 'road').points);
	const roadPath = plan.paths.find((p) => p.kind === 'road');
	const creek = plan.water.find((w) => w.points);
	const pond = plan.water.find((w) => w.polygon);
	const walkable = plan.paths.filter((p) => p.kind === 'branch' || p.kind === 'trail');
	const circleZones = plan.zones.filter((z) => z.shape && z.shape.r !== undefined && z.kind !== 'bank');
	const fieldZones = plan.zones.filter((z) => z.kind === 'field');
	const some = (list, n = 6) => list.slice(0, n);
	const inside = (p, m = 0) => p.x >= b.x0 + m && p.x <= b.x1 - m && p.z >= b.z0 + m && p.z <= b.z1 - m;
	const waterGap = (x, z) => {
		let d = Infinity;
		if (creek) for (let i = 0; i + 1 < creek.points.length; i++) d = Math.min(d, segDist(x, z, creek.points[i], creek.points[i + 1]) - creek.width / 2);
		if (pond) d = Math.min(d, pointPolySigned(pond.polygon, x, z));
		return d;
	};

	// 1 · bounds: everything lies inside, the ids are unique, every reference resolves
	{
		const bad = [];
		const pts = [...plan.paths.flatMap((p) => p.points), ...(creek ? creek.points : []), ...plan.doors.map((d) => d.at), ...plan.interactions.map((i) => i.at), ...plan.spawns.map((s) => s.at), ...plan.masses.map((m) => m.at), ...plan.hosts.filter((h) => h.at).map((h) => h.at), ...plan.events.filter((e) => e.at).map((e) => e.at)];
		for (const p of pts) if (!inside(p, -0.01)) bad.push({ x: p.x, z: p.z });
		for (const m of plan.masses) if (m.at && !inside(m.at, 1)) bad.push({ mass: m.id });
		add('bounds', 'every path, water, door, interaction, spawn, mass, host and event lies inside the bounds', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		const dup = (list, label) => { const seen = new Set(); for (const x of list) { if (seen.has(x.id)) bad.push({ [label]: x.id }); seen.add(x.id); } };
		for (const [label, list] of [['zones', plan.zones], ['paths', plan.paths], ['water', plan.water], ['doors', plan.doors], ['interactions', plan.interactions], ['spawns', plan.spawns], ['arenas', plan.arenas], ['masses', plan.masses], ['hosts', plan.hosts], ['events', plan.events]]) dup(list, label);
		const all = new Set([...plan.masses, ...plan.hosts, ...plan.doors, ...plan.interactions, ...plan.spawns].map((x) => x.id));
		const hostIds = new Set(plan.hosts.map((h) => h.id)), massIds = new Set(plan.masses.map((m) => m.id)), owned = new Set([...plan.interactions, ...plan.spawns].map((x) => x.id));
		for (const h of plan.hosts) { if (h.mass && !massIds.has(h.mass)) bad.push({ host: h.id, mass: h.mass }); if (h.owns && !owned.has(h.owns)) bad.push({ host: h.id, owns: h.owns }); if (!h.mass && !h.at) bad.push({ host: h.id, why: 'no at' }); }
		for (const e of plan.events) if (typeof e.host === 'string' && !all.has(e.host) && !hostIds.has(e.host)) bad.push({ event: e.id, host: e.host });
		add('refs', 'every id is unique and every reference (host mass, owns, event host) resolves', bad.length === 0, { violations: some(bad) });
	}

	// 2 · zones: separation, edges, none on water
	{
		const bad = [];
		for (let i = 0; i < circleZones.length; i++) {
			const a = circleZones[i].shape;
			if (Math.min(a.x - b.x0, b.x1 - a.x, a.z - b.z0, b.z1 - a.z) < a.r + 4 - 0.01) bad.push({ zone: circleZones[i].id, why: 'closer than r + 4 to an edge' });
			for (let k = i + 1; k < circleZones.length; k++) {
				const c = circleZones[k].shape, gap = Math.hypot(a.x - c.x, a.z - c.z) - a.r - c.r;
				if (gap < 8 - 0.01) bad.push({ a: circleZones[i].id, b: circleZones[k].id, gap: r2(gap) });
			}
		}
		add('zone-separation', 'zone circles keep ≥ 8 m between them and ≥ r + 4 m from the map edges', bad.length === 0, { zones: circleZones.length, violations: some(bad) });
	}
	{
		const bad = [];
		const pts = [...circleZones.map((z) => ({ id: z.id, ...z.shape })), ...plan.doors.map((d) => ({ id: d.id, ...d.at })), ...plan.spawns.map((s) => ({ id: s.id, ...s.at })), ...plan.interactions.map((s) => ({ id: s.id, ...s.at })), ...plan.hosts.filter((h) => h.at).map((h) => ({ id: h.id, ...h.at })), ...plan.arenas.map((a) => ({ id: a.id, ...arenaAt(a) })), ...plan.masses.map((m) => ({ id: m.id, ...m.at }))];
		for (const p of pts) if (plan.ground(p.x, p.z).water || waterGap(p.x, p.z) < 1.2) bad.push({ id: p.id, gap: r2(waterGap(p.x, p.z)) });
		add('on-water', 'no zone centre, door, spawn, interaction, host, arena or mass on (or within 1.2 m of) water', bad.length === 0, { violations: some(bad) });
	}

	// 3 · paths: every zone reachable from the road by its branch, no water, no other zones
	{
		const bad = [], info = [];
		const pairs = [];
		// each path belongs to ONE zone, as in branch-zones: the nearest zone to its far end (the end away from the road), within r + 8
		const ownerOf = new Map();
		for (const p of plan.paths) {
			if (p.kind === 'road') continue;
			const far = [p.points[0], p.points[p.points.length - 1]].sort((a, c) => road.nearest(c.x, c.z).d - road.nearest(a.x, a.z).d)[0];
			let best = null, bestGap = Infinity;
			for (const z of circleZones) {
				const gap = Math.hypot(far.x - z.shape.x, far.z - z.shape.z) - z.shape.r;
				if (gap < bestGap) { best = z; bestGap = gap; }
			}
			if (best && bestGap <= 8) ownerOf.set(p, best);
		}
		for (const z of circleZones) {
			const own = plan.paths.filter((p) => ownerOf.get(p) === z);
			if (!own.length) { bad.push({ zone: z.id, why: 'no path ends in it' }); continue; }
			const ok = own.some((p) => {
				const roadEnd = [p.points[0], p.points[p.points.length - 1]].map((q) => road.nearest(q.x, q.z).d);
				const limit = p.kind === 'animal' ? 14 : 3.2;
				pairs.push({ zone: z.id, path: p.id });
				return Math.min(...roadEnd) <= limit;
			});
			if (!ok) bad.push({ zone: z.id, why: 'its path does not reach the road' });
			info.push(z.id);
		}
		add('reach', 'every farm, camp, den and graveyard has a path that reaches the road (branch / trail: a fork on it; animal trail: within 14 m of it)', bad.length === 0, { zones: info.length, paths: pairs, violations: some(bad) });
	}
	{
		const bad = [];
		for (const p of walkable.concat(plan.paths.filter((q) => q.kind === 'animal'))) {
			const line = new Line(p.points);
			for (let s = 0; s <= line.length; s += 1) {
				const q = line.at(s), g = waterGap(q.x, q.z);
				if (g < p.width / 2 + 0.5) { bad.push({ path: p.id, s: Math.round(s), gap: r2(g) }); break; }
			}
		}
		add('branch-water', 'branch paths, trails and animal trails never cross (or touch) water', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		for (const p of plan.paths) {
			if (p.kind === 'road') continue;
			const line = new Line(p.points);
			const ends = [p.points[0], p.points[p.points.length - 1]].sort((a, c) => road.nearest(c.x, c.z).d - road.nearest(a.x, a.z).d);
			const owner = circleZones.find((z) => Math.hypot(ends[0].x - z.shape.x, ends[0].z - z.shape.z) <= z.shape.r + 2); // the zone the far end of the path is in
			for (let s = 0; s <= line.length; s += 1) {
				const q = line.at(s);
				const hit = circleZones.find((z) => z !== owner && Math.hypot(q.x - z.shape.x, q.z - z.shape.z) < z.shape.r);
				if (hit) { bad.push({ path: p.id, zone: hit.id }); break; }
				const fz = fieldZones.find((z) => pointInPoly(z.shape, q.x, q.z));
				if (fz) { bad.push({ path: p.id, zone: fz.id }); break; }
			}
		}
		add('branch-zones', 'branch paths do not run through other zones (or fields)', bad.length === 0, { violations: some(bad) });
	}
	{
		// walk the road: how many times does its centre line enter the creek's water band (width 3.2)?
		let crossings = 0;
		if (creek) {
			const d = (q) => { let m = Infinity; for (let i = 0; i + 1 < creek.points.length; i++) m = Math.min(m, segDist(q.x, q.z, creek.points[i], creek.points[i + 1])); return m - creek.width / 2; };
			let inside = false;
			for (let s = 0; s <= road.length; s += 0.5) {
				const w = d(road.at(s)) <= 0;
				if (w && !inside) crossings++;
				inside = w;
			}
		}
		add('road-creek', 'the creek (if any) crosses the road exactly once (the road centre line enters its water once: one ford, none at the ends)', !creek || crossings === 1, { crossings });
	}

	// 4 · road: margins, hidden bend, start, exits
	{
		const bad = [];
		const L = road.length;
		for (let s = 20; s <= L - 20; s += 2) {
			const p = road.at(s), back = Math.min(p.x - b.x0, p.z - b.z0), front = Math.min(b.x1 - p.x, b.z1 - p.z);
			if (back < R.roadBackMargin - 2.5 || front < R.roadFrontMargin - 2.5) { bad.push({ s: Math.round(s), x: r2(p.x), z: r2(p.z) }); break; }
		}
		add('road-margins', 'the road, once it is 20 m in, stays ≥ 14 m off the back edges and ≥ 8 m off the front edges (± the spline overshoot)', bad.length === 0, { violations: bad });
	}
	{
		const bd = bends(road), max = bd.length ? Math.max(...bd.map((x) => Math.abs(x.turn))) : 0;
		add('hidden-bend', 'the road has a bend the engine sees (turn > 35° over 8 m); generation asks for 44°', max >= (R.roadBendMin * Math.PI) / 180 - 0.02, { bendDeg: Math.round((max * 180) / Math.PI), bends: bd.length });
	}
	{
		const bad = [];
		const s0 = plan.start ? road.nearest(plan.start.x, plan.start.z) : null;
		if (!s0 || s0.d > 0.5 || Math.abs(s0.s - R.roadStartAlong) > 1) bad.push({ why: 'start is not 14 m along the road', s: s0 ? r2(s0.s) : null, d: s0 ? r2(s0.d) : null });
		if (!plan.exits || plan.exits.length < 2) bad.push({ why: 'exits missing' });
		else for (const e of plan.exits) {
			const edge = kindOfEdge(b, e.at, R.exitTolerance);
			if (edge !== e.edge) bad.push({ exit: e.id, edge: e.edge, found: edge });
			const near = road.nearest(e.at.x, e.at.z);
			if (near.d > 0.5) bad.push({ exit: e.id, why: 'not on the road' });
		}
		add('exits', 'start = 14 m along the road; entrance and exit lie on map edges, on the road', bad.length === 0, { violations: some(bad) });
	}

	// 5 · camera and play: doors face the front, the camp is behind the road, busy zones are far from the start
	{
		const bad = [];
		for (const d of plan.doors) {
			const dot = Math.sin(d.yaw ?? 0) + Math.cos(d.yaw ?? 0);
			if (dot < R.frontCheck * Math.SQRT2 - 1e-6) bad.push({ door: d.id, dot: r2(dot) });
		}
		for (const m of plan.masses) if (m.kind === 'den') { const dot = Math.sin(m.yaw ?? 0) + Math.cos(m.yaw ?? 0); if (dot < R.frontCheck * Math.SQRT2 - 1e-6) bad.push({ mass: m.id, dot: r2(dot) }); }
		add('doors-front', 'every door, gate and den mouth faces the front half-plane (normal · (1, 1) > 0): the building / wall / rock stands behind the opening', bad.length === 0, { doors: plan.doors.length, violations: some(bad) });
	}
	{
		const bad = [];
		for (const z of plan.zones.filter((q) => q.kind === 'camp')) {
			const near = road.nearest(z.shape.x, z.shape.z), v = unit(z.shape.x - near.x, z.shape.z - near.z);
			const back = v.x * FORWARD.x + v.z * FORWARD.z;
			if (back < R.campBack - 1e-6) bad.push({ zone: z.id, back: r2(back) });
		}
		add('walled-back', 'a walled zone (camp) lies on the back side of the road (north / west of it)', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [], st = plan.start ?? road.at(R.roadStartAlong);
		for (const z of plan.zones.filter((q) => q.kind === 'camp' || q.kind === 'farm')) if (Math.hypot(z.shape.x - st.x, z.shape.z - st.z) < R.busyStart - 0.01) bad.push({ zone: z.id, d: r2(Math.hypot(z.shape.x - st.x, z.shape.z - st.z)) });
		for (const s of plan.spawns) if (Math.hypot(s.at.x - st.x, s.at.z - st.z) < R.spawnStart) bad.push({ spawn: s.id });
		for (const q of [...plan.doors.map((d) => ({ id: d.id, ...d.at })), ...plan.arenas.map((a) => ({ id: a.id, ...arenaAt(a) })), ...plan.hosts.filter((h) => h.at).map((h) => ({ id: h.id, ...h.at }))]) if (Math.hypot(q.x - st.x, q.z - st.z) < R.startClear) bad.push({ id: q.id });
		add('start-light', 'busy zones (camp, farm) start ≥ 45 m from the start; no spawn within 25 m; no door, arena or host within 12 m', bad.length === 0, { violations: some(bad) });
	}
	{
		const bad = [];
		const wp = plan.interactions.find((i) => i.id === 'waypoint');
		if (!wp) bad.push({ why: 'no waypoint' });
		else {
			const near = road.nearest(wp.at.x, wp.at.z);
			if (near.d < 5.5 || near.d > 10.5) bad.push({ why: 'not 6–10 m beside the road', d: r2(near.d) });
			if (near.s < 10 || near.s > 24.5) bad.push({ why: 'not 10–24 m from the entrance', s: r2(near.s) });
			if (wp.radius !== R.waypointRadius) bad.push({ why: 'radius' });
		}
		add('waypoint', 'the waypoint (r 2.6) is 6–10 m beside the road, 10–24 m along it from the entrance', bad.length === 0, { violations: bad });
	}
	{
		const kinds = new Set(circleZones.map((z) => z.kind));
		const S = Math.max(1, (b.x1 - b.x0) ** 2 / (128 * 128));
		const min = poiMin(R.poiMin, S), max = Math.round(R.poiMax * S);
		const n = circleZones.length;
		add('poi-count', 'a map holds 3–4 points of interest (farm, camp, den, graveyard), scaled with the area', n >= min && n <= max, { n, min, max, kinds: [...kinds] });
	}

	// 6 · boundary and landmarks
	{
		const bad = [], info = {};
		const roadEnds = [roadPath.points[0], roadPath.points.at(-1)];
		const roadOnW = roadEnds.some((p) => p.x <= b.x0 + R.endInset + 1);
		for (const edge of ['N', 'W']) {
			if (edge === 'W' && roadOnW) continue;
			const cliffs = plan.masses.filter((m) => m.kind === 'cliff' && (edge === 'N' ? m.at.z <= b.z0 + 8 : m.at.x <= b.x0 + 8));
			info[edge] = cliffs.length;
			if (!cliffs.length) bad.push({ edge, why: 'no cliff mass on the ridge' });
			// the rise: rock and height on the band, except at gaps
			const samples = [];
			for (let k = 0; k < 24; k++) {
				const t = -half + 12 + ((k + 0.5) / 24) * (2 * half - 24), p = edge === 'N' ? { x: t, z: b.z0 + 2.5 } : { x: b.x0 + 2.5, z: t };
				if ([...roadEnds, ...(creek ? [creek.points[0], creek.points.at(-1)] : [])].some((e) => Math.hypot(e.x - p.x, e.z - p.z) < 14)) continue;
				samples.push({ rock: plan.ground(p.x, p.z).rock });
			}
			const rock = samples.reduce((s, q) => s + q.rock, 0) / (samples.length || 1);
			if (rock < 0.25) bad.push({ edge, why: 'no rock on the ridge band', rock: r2(rock) });
		}
		for (const e of roadEnds) {
			const edge = kindOfEdge(b, e, 3);
			if (edge === 'N' || edge === 'W') {
				const g = plan.ground(e.x, e.z), inner = plan.ground(edge === 'N' ? e.x : b.x0 + 16, edge === 'N' ? b.z0 + 16 : e.z);
				if (g.height - inner.height > 1.1 || g.rock > 0.35) bad.push({ edge, why: 'the ridge has no gap where the road crosses', rise: r2(g.height - inner.height), rock: r2(g.rock) });
			}
		}
		for (const m of plan.masses.filter((q) => q.kind === 'cliff')) {
			const fp = massObb(m);
			for (const p of plan.paths) for (let i = 0; i + 1 < p.points.length; i++) if (segPolyGap(p.points[i], p.points[i + 1], fp.pts) < p.width / 2 + 3) { bad.push({ cliff: m.id, path: p.id, why: 'the cliff leaves no gap for the road' }); break; }
		}
		add('boundary', 'a ridge (rock + cliff mass) closes the back edges (north; west unless the road is there) with a gap where the road / creek meet them; the front edges stay open', bad.length === 0, { cliffs: info, violations: some(bad) });
	}
	{
		const bad = [];
		const landmarks = plan.masses.filter((m) => m.asset === 'lighting.beacon' || m.asset === 'deadTrees.tall');
		for (let i = 0; i < landmarks.length; i++) for (let k = i + 1; k < landmarks.length; k++) if (Math.hypot(landmarks[i].at.x - landmarks[k].at.x, landmarks[i].at.z - landmarks[k].at.z) < LAYOUT_RULES.landmarkSpacing) bad.push({ a: landmarks[i].id, b: landmarks[k].id });
		const keep = [...plan.hosts.filter((h) => h.at).map((h) => h.at), ...plan.events.filter((e) => e.at).map((e) => e.at)];
		for (const l of landmarks.filter((m) => m.asset === 'deadTrees.tall')) if (keep.some((q) => Math.hypot(l.at.x - q.x, l.at.z - q.z) < LAYOUT_RULES.hostKeepOut)) bad.push({ landmark: l.id, why: 'on a host / event' });
		add('landmark-spacing', 'authored landmarks keep the engine\'s landmarkSpacing (6 m) from each other and hostKeepOut (8 m) from hosts and events', bad.length === 0, { landmarks: landmarks.length, violations: some(bad) });
	}
	{
		const bad = [];
		for (const a of plan.arenas) {
			const size = a.at ? a.r * 2 : a.rect.x0 !== undefined ? Math.min(a.rect.x1 - a.rect.x0, a.rect.z1 - a.rect.z0) : Math.min(a.rect.w, a.rect.d);
			if (size < LAYOUT_RULES.arenaMin) bad.push({ arena: a.id, size: r2(size) });
		}
		for (const s of plan.spawns) {
			const gap = Math.min(...plan.arenas.map((a) => (a.at ? Math.hypot(a.at.x - s.at.x, a.at.z - s.at.z) - a.r : pointPolySigned(P.arenas.find((q) => q.id === a.id).shape.pts, s.at.x, s.at.z))));
			if (!(gap <= 22)) bad.push({ spawn: s.id, gap: r2(gap) });
		}
		for (const z of plan.zones.filter((q) => q.kind === 'camp' || q.kind === 'den')) if (!plan.arenas.some((a) => Math.hypot(arenaAt(a).x - z.shape.x, arenaAt(a).z - z.shape.z) < 30)) bad.push({ zone: z.id, why: 'no combat area' });
		add('combat-space', 'AD12 §4.3: arenas ≥ 8×8 Sub (3.8 m); every spawn has a combat area within 22 m; camps and dens have one', bad.length === 0, { arenas: plan.arenas.length, violations: some(bad) });
	}

	// 7 · the play space and the footprints of the authored masses (the engine commits authored masses even when they do not fit)
	{
		const bad = [];
		const obbs = plan.masses.map((m) => ({ m, fp: massObb(m, catalog) }));
		for (const { m, fp } of obbs) {
			for (const r of P.reserved) {
				const gap = shapeGap(r, fp.pts);
				if (gap < -0.001) bad.push({ mass: m.id, with: `${r.kind}:${r.id}`, gap: r2(gap) });
			}
			if (fp.x0 < b.x0 + 0.5 || fp.x1 > b.x1 - 0.5 || fp.z0 < b.z0 + 0.5 || fp.z1 > b.z1 - 0.5) bad.push({ mass: m.id, why: 'outside the bounds' });
			if (plan.ground(m.at.x, m.at.z).water) bad.push({ mass: m.id, why: 'on water' });
		}
		for (let i = 0; i < obbs.length; i++) for (let k = i + 1; k < obbs.length; k++) if (obbSeparation(obbs[i].fp, obbs[k].fp) < 0.01) bad.push({ a: obbs[i].m.id, b: obbs[k].m.id, why: 'overlap' });
		add('play-space', 'authored masses stay out of corridors, water, doors, spawns, interactions and arenas, inside the bounds, and do not overlap each other', bad.length === 0, { masses: plan.masses.length, violations: some(bad) });
	}
	{
		const bad = [];
		// hosts and events stand on dry ground off the road corridor
		for (const h of plan.hosts) if (h.at && (roadGap(road, h.at) < roadPath.width / 2 + 1)) bad.push({ host: h.id, why: 'on the road' });
		for (const e of plan.events) if (e.at && plan.ground(e.at.x, e.at.z).water) bad.push({ event: e.id, why: 'on water' });
		add('hosts', 'hosts stand off the road corridor; events are not on water', bad.length === 0, { violations: some(bad) });
	}
	{
		let max = 0, at = null;
		const probe = LAYOUT_RULES.slopeProbe, g = plan.ground;
		const slope = (x, z) => Math.hypot(g(x + probe, z).height - g(x - probe, z).height, g(x, z + probe).height - g(x, z - probe).height) / (2 * probe);
		for (const p of plan.paths) {
			const line = new Line(p.points);
			for (let s = 0; s <= line.length; s += 2) { const q = line.at(s), v = slope(q.x, q.z); if (v > max) { max = v; at = { path: p.id, x: r2(q.x), z: r2(q.z) }; } }
		}
		for (const z of circleZones) {
			for (let a = 0; a < 16; a++) for (const rr of [0, 0.4, 0.7]) {
				const x = z.shape.x + Math.cos((a / 16) * TAU) * z.shape.r * rr, zz = z.shape.z + Math.sin((a / 16) * TAU) * z.shape.r * rr, v = slope(x, zz);
				if (v > max) { max = v; at = { zone: z.id, x: r2(x), z: r2(zz) }; }
			}
		}
		add('slopes', 'slopes on paths and inside zone cores stay below 0.55 (the demo peaks at 0.48 on its ridge)', max <= R.slopeMax, { max: r2(max), at });
	}
	return checks;
}

const roadGap = (road, p) => road.nearest(p.x, p.z).d;
const segPolyGap = (a, b, poly) => {
	if (pointInPoly(poly, a.x, a.z) || pointInPoly(poly, b.x, b.z)) return 0;
	let best = Infinity;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const p = poly[j], q = poly[i];
		if (segmentsIntersect(a, b, p, q)) return 0;
		best = Math.min(best, segDist(a.x, a.z, p, q), segDist(b.x, b.z, p, q), segDist(p.x, p.z, a, b), segDist(q.x, q.z, a, b));
	}
	return best;
};

// ---------------------------------------------------------------------------------------------------------------
// One seed → the whole map

/** The engine's budgets for a map of `size` m: its own defaults, scaled with the area on bigger maps; the caller's win. generateMap and the scene's warm path use the same. */
export function mapBudgets(size, budgets = {}) {
	const scale = (size * size) / (128 * 128);
	const base = DEFAULT_OPTIONS.budgets;
	return { ...(scale > 1 ? { hosts: Math.round(base.hosts * scale), members: Math.round(base.members * scale), guides: Math.round(base.guides * scale), events: Math.round(base.events * scale) } : {}), ...budgets };
}

/**
 * Attempt 0, 1, … (up to maxAttempts): generate, run checkPlan, and only if it passes run layoutBiome; accept when every plan check and every
 * engine check passes (and, with `options.modules = { kitBytes }`, every `module-*` check of mapModules.js too: ids `module:<check>`). Returns { ok, seed, plan, result, attempt, attempts: [{ attempt, failed: ['plan:id' | 'engine:id'] }], timing: { total, attempts: [ms] } }
 * (timing is the only part that differs between two runs). If no attempt
 * passes, the attempt with the fewest failures is returned with ok: false. Never throws, never loops unbounded.
 */
export function generateMap(seed, catalog, options = {}) {
	const { size = R.size, biome = 'moor', maxAttempts: asked = R.maxAttempts, modules = null, ...layoutOptions } = options;
	const maxAttempts = Math.max(1, Math.floor(asked)); // at least one attempt, never unbounded
	const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
	const budgets = mapBudgets(size, layoutOptions.budgets);
	const attempts = [], times = [];
	let best = null;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const a0 = typeof performance !== 'undefined' ? performance.now() : 0;
		let plan = null, result = null;
		const failed = [];
		try {
			plan = generatePlan(seed, { size, biome, attempt });
			const checks = checkPlan(plan, { catalog });
			for (const c of checks) if (!c.pass) failed.push(`plan:${c.id}`);
			if (!failed.length) {
				try {
					result = layoutBiome(plan, catalog, { ...layoutOptions, budgets });
					for (const c of result.report.checks) if (!c.pass) failed.push(`engine:${c.id}`);
					if (modules && !failed.length) {
						// opt-in: the fast-load rules of AD 12 §4.14 (module budgets + the start ring) are acceptance criteria too
						const { manifest } = splitModules(plan, result, { kitBytes: modules.kitBytes ?? null });
						for (const c of checkModules(manifest, loadOrder(manifest, mapStart(plan)), MODULE_RULES)) if (!c.pass) failed.push(`module:${c.id}`);
					}
				} catch (error) {
					failed.push('engine:throw');
					result = null;
				}
			}
		} catch (error) {
			failed.push('plan:throw');
		}
		attempts.push({ attempt, failed });
		times.push((typeof performance !== 'undefined' ? performance.now() : 0) - a0);
		const entry = { attempt, plan, result, failed };
		const score = (e) => e.failed.reduce((n, id) => n + (id.startsWith('plan:') ? 100 : 1), 0); // a rejected plan is worse than an accepted plan the engine disliked
		if (!best || score(entry) < score(best)) best = entry;
		if (!failed.length) break;
	}
	const ok = best.failed.length === 0;
	// a rejected plan never reached the engine: run it once so that the caller has something to look at
	if (!ok && best.plan && !best.result) {
		try { best.result = layoutBiome(best.plan, catalog, { ...layoutOptions, budgets }); } catch (error) { best.result = null; }
	}
	return { ok, seed, plan: best.plan, result: best.result, attempt: best.attempt, attempts, timing: { total: (typeof performance !== 'undefined' ? performance.now() : 0) - t0, attempts: times } };
}

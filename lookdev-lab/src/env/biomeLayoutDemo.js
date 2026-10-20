// A 128 × 128 m Act I area that exercises every rule of the biome layout engine (biomeLayout.js) and every sub-zone of
// art direction 12 §4.11: a main road W→E with a hidden bend, a cart section with ruts and a ford; a fork to an abandoned
// farm (procedural house + barn, a field with rows, a pen); an enemy camp with a palisade gate; a beast den with an animal
// trail to a meadow arena and predation events; a graveyard by a wayside shrine; a creek with damp banks and a pond.
// Used by the tests, the 2D preview and (later) the 3D lab scene. Pure: no renderer, ground() is a deterministic function.
import { patchField, pointInPoly, vnoise } from './biomeLayout.js';

const sm = (a, b, x) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** Centripetal-free Catmull-Rom through [x, z] pairs, resampled every `step` metres. */
export function smoothPath(pairs, step = 2.5) {
	const p = pairs.map(([x, z]) => ({ x, z }));
	const dense = [];
	for (let i = 0; i + 1 < p.length; i++) {
		const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
		for (let k = 0; k < 12; k++) {
			const t = k / 12, t2 = t * t, t3 = t2 * t;
			const f = (v0, v1, v2, v3) => 0.5 * (2 * v1 + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (-v0 + 3 * v1 - 3 * v2 + v3) * t3);
			dense.push({ x: f(a.x, b.x, c.x, d.x), z: f(a.z, b.z, c.z, d.z) });
		}
	}
	dense.push(p[p.length - 1]);
	const out = [dense[0]];
	let acc = 0;
	for (let i = 1; i < dense.length; i++) {
		const seg = Math.hypot(dense[i].x - dense[i - 1].x, dense[i].z - dense[i - 1].z);
		acc += seg;
		if (acc >= step) { out.push(dense[i]); acc = 0; }
	}
	const last = dense[dense.length - 1];
	if (Math.hypot(out[out.length - 1].x - last.x, out[out.length - 1].z - last.z) > 1e-6) out.push(last);
	return out.map((q) => ({ x: Math.round(q.x * 100) / 100, z: Math.round(q.z * 100) / 100 }));
}

/** Polygon round a polyline (left side out, right side back): the damp bank zone along a creek. */
export function bufferPolyline(points, r) {
	const left = [], right = [];
	for (let i = 0; i < points.length; i++) {
		const a = points[Math.max(0, i - 1)], b = points[Math.min(points.length - 1, i + 1)];
		const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1;
		left.push({ x: points[i].x - (dz / l) * r, z: points[i].z + (dx / l) * r });
		right.push({ x: points[i].x + (dz / l) * r, z: points[i].z - (dx / l) * r });
	}
	return left.concat(right.reverse());
}

const arclength = (pts, x) => {
	let s = 0;
	for (let i = 1; i < pts.length; i++) {
		const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
		if (pts[i].x >= x) return s + (seg * (x - pts[i - 1].x)) / (pts[i].x - pts[i - 1].x || 1);
		s += seg;
	}
	return s;
};

// ---------------------------------------------------------------------------------------------------------------
// The plan

const ROAD = smoothPath([[-62, 18], [-50, 17], [-38, 13], [-28, 11], [-20, 10], [-12, 8], [-5, 6.5], [-1, 3], [0.5, -3], [1, -10], [5, -15], [12, -18], [20, -18], [30, -16], [40, -14], [52, -14], [62, -14]]);
const FARM_LANE = smoothPath([[-37, 13.4], [-38, 2], [-36, -10], [-34, -20], [-33, -29]]);
const CAMP_ROAD = smoothPath([[40, -14.2], [40, -19], [38.5, -23], [38, -26]]);
const SHRINE_PATH = smoothPath([[-47.5, 16.8], [-46, 24], [-43.5, 29]]);
const WOLF_TRAIL = smoothPath([[41, 37], [34, 35], [26, 32], [18, 30], [14, 22], [13, 8], [12, -4]]);
const CREEK = smoothPath([[-10, -64], [-14, -44], [-19, -24], [-21, -6], [-20, 8], [-21, 22], [-17, 38], [-12, 52], [-14, 64]], 3);
const POND = [[-3, 44], [0, 42], [4, 43], [6, 46], [4, 49], [-1, 50], [-4, 48]].map(([x, z]) => ({ x, z }));

const CREEK_WIDTH = 3.2;

export const DEMO_PLAN = {
	id: 'demo-ashen-moor',
	seed: 20261020,
	bounds: { x0: -64, z0: -64, x1: 64, z1: 64 },
	defaultZone: 'moor',
	zones: [
		{ id: 'creek-banks', kind: 'bank', shape: bufferPolyline(CREEK, 7) },
		{ id: 'pond-bank', kind: 'bank', shape: { x: 1, z: 46, r: 9 } },
		{ id: 'farm', kind: 'farm', shape: { x: -32, z: -31, r: 26 } },
		{ id: 'barley', kind: 'field', shape: [{ x: -62, z: -34 }, { x: -46, z: -34 }, { x: -46, z: -14 }, { x: -62, z: -14 }], rows: { angle: 0 } },
		{ id: 'camp', kind: 'camp', shape: { x: 38, z: -39, r: 24 } },
		{ id: 'den', kind: 'den', shape: { x: 47, z: 42, r: 13 } },
		{ id: 'graves', kind: 'graveyard', shape: { x: -46, z: 37, r: 13 } },
	],
	paths: [
		{ id: 'road', kind: 'road', points: ROAD, width: 4.2, inhabited: true, ruts: { s0: arclength(ROAD, 24), s1: arclength(ROAD, 38), gap: 1.3, width: 0.32 } },
		{ id: 'farm-lane', kind: 'branch', points: FARM_LANE, width: 2.6, inhabited: true },
		{ id: 'camp-road', kind: 'branch', points: CAMP_ROAD, width: 2.6, inhabited: true },
		{ id: 'shrine-path', kind: 'trail', points: SHRINE_PATH, width: 1.6, inhabited: true },
		{ id: 'wolf-trail', kind: 'animal', points: WOLF_TRAIL, width: 1 },
	],
	water: [
		{ id: 'creek', points: CREEK, width: CREEK_WIDTH },
		{ id: 'pond', polygon: POND },
	],
	doors: [
		{ id: 'house-door', at: { x: -44, z: -35.5 }, yaw: 0, kind: 'door', width: 1.6, depth: 3 },
		{ id: 'barn-door', at: { x: -22, z: -37 }, yaw: 0, kind: 'door', width: 3, depth: 3 },
		{ id: 'camp-gate', at: { x: 38, z: -27.5 }, yaw: 0, kind: 'gate', width: 4, depth: 4, important: true },
		{ id: 'den-mouth', at: { x: 44, z: 41 }, yaw: -Math.PI / 2, kind: 'entrance', width: 3, depth: 3 },
	],
	interactions: [
		{ id: 'waypoint', at: { x: -56, z: 21 }, radius: 2.6 },
		{ id: 'wayside-shrine', at: { x: -42, z: 33 }, radius: 3.4 },
	],
	spawns: [
		{ id: 'spawn-camp-a', at: { x: 33, z: -44 }, radius: 1.4 },
		{ id: 'spawn-camp-b', at: { x: 43, z: -45 }, radius: 1.4 },
		{ id: 'spawn-den', at: { x: 40, z: 31 }, radius: 1.4 },
	],
	arenas: [
		{ id: 'meadow', at: { x: 20, z: 30 }, r: 8 },
		{ id: 'camp-yard', rect: { x0: 34, z0: -37.5, x1: 42, z1: -31.5 } },
	],
	masses: [
		{ id: 'house', kind: 'building', footprint: { w: 7, d: 5 }, height: 4.1, at: { x: -44, z: -38 }, yaw: 0, focal: true, label: 'Farmhouse' },
		{ id: 'barn', kind: 'building', footprint: { w: 9, d: 6 }, height: 4.6, at: { x: -22, z: -40 }, yaw: 0, label: 'Barn' },
		{ id: 'cliff', kind: 'cliff', footprint: { w: 26, d: 4 }, height: 4, at: { x: 14, z: -59 }, yaw: 0, label: 'North ridge' },
		{ id: 'den', kind: 'den', footprint: { w: 6.4, d: 5.8 }, height: 2, at: { x: 47, z: 41 }, yaw: -Math.PI / 2, focal: true, label: 'Den' }, // the mouth (local +z) faces the den-mouth door
		{ id: 'carcass', kind: 'carcass', footprint: { w: 2.8, d: 1.5 }, height: 0.5, at: { x: 28, z: 40 }, yaw: 0.8, collision: false, label: 'Carcass' }, // walk-through decor
		{ id: 'old-tree', asset: 'deadTrees.tall', at: { x: -8, z: -41 }, yaw: 1.2, scale: 1.35, label: 'Landmark tree' },
		{ id: 'cart', asset: 'tentsB.cart_awning', at: { x: 14, z: -23.3 }, yaw: 0.1, label: 'Wrecked cart' },
		{ id: 'beacon', asset: 'lighting.beacon', at: { x: 56, z: -24 }, yaw: 0, scale: 1.3, label: 'Camp beacon' },
		{ id: 'pal-l1', asset: 'palisade.wall_c', at: { x: 30.4, z: -27.6 }, yaw: 0 },
		{ id: 'pal-l2', asset: 'palisade.wall_a', at: { x: 25.7, z: -27.6 }, yaw: 0 },
		{ id: 'pal-r1', asset: 'palisade.wall_c', at: { x: 45.6, z: -27.6 }, yaw: 0 },
		{ id: 'pal-r2', asset: 'palisade.wall_a', at: { x: 50.3, z: -27.6 }, yaw: 0 },
	],
	hosts: [
		{ id: 'house-yard', recipe: 'farmyard', mass: 'house' },
		{ id: 'barn-yard', recipe: 'farmyard', mass: 'barn' },
		{ id: 'goat-pen', recipe: 'pen', at: { x: -9, z: -30 }, yaw: Math.PI / 2 },
		{ id: 'fire', recipe: 'campfire', at: { x: 38, z: -42 }, yaw: 0.4 },
		{ id: 'tent-a', recipe: 'tent', at: { x: 27, z: -42 }, face: { x: 38, z: -42 } },
		{ id: 'tent-b', recipe: 'tent', at: { x: 49, z: -42 }, face: { x: 38, z: -42 } },
		{ id: 'cookpot', recipe: 'kitchen', at: { x: 45.5, z: -49.5 }, yaw: Math.PI },
		{ id: 'stores', recipe: 'storage', at: { x: 25, z: -34 }, yaw: Math.PI / 2 },
		{ id: 'forge', recipe: 'smithy', at: { x: 55, z: -50 }, yaw: Math.PI },
		{ id: 'yard', recipe: 'training', at: { x: 20, z: -45 }, yaw: Math.PI / 2 },
		{ id: 'altar', recipe: 'ritual', at: { x: 38, z: -52 }, yaw: 0 },
		{ id: 'tannery', recipe: 'tannery', at: { x: -42, z: -15 }, yaw: Math.PI / 2 }, // by the farm lane: an abandoned farm keeps its hides
		{ id: 'butchery', recipe: 'hunt', at: { x: 22, z: -53 }, yaw: Math.PI / 2 },
		{ id: 'shrine', recipe: 'wayside', at: { x: -42, z: 33 }, yaw: Math.PI / 4, owns: 'wayside-shrine' },
		{ id: 'graves-a', recipe: 'graves', at: { x: -52, z: 40 }, yaw: 0.2 },
		{ id: 'graves-b', recipe: 'graves', at: { x: -37, z: 43 }, yaw: -0.15 },
		{ id: 'graves-c', recipe: 'graves', at: { x: -46, z: 47 }, yaw: 0.1 },
	],
	events: [
		{ id: 'den-kill', cause: 'predation', host: 'den-mouth', at: { x: 40, z: 44 }, dir: Math.PI, age: 'old' },
		{ id: 'meadow-kill', cause: 'predation', host: 'carcass', at: { x: 23, z: 43 }, dir: Math.PI * 0.9, age: 'fresh' },
		{ id: 'house-raid', cause: 'raid', host: 'house-door', at: { x: -41, z: -30 }, dir: Math.PI / 2, age: 'old' },
		{ id: 'barn-roof', cause: 'collapse', host: 'barn', at: { x: -31, z: -40 }, dir: 3.3, age: 'old' },
		{ id: 'dug-grave', cause: 'grave', host: 'graves-a', at: { x: -57.5, z: 33.5 }, dir: 4.4, age: 'fresh' },
		{ id: 'cart', cause: 'spill', host: 'cart', at: { x: 17.5, z: -28 }, dir: -1.6, age: 'old' },
		{ id: 'rite', cause: 'ritual', host: 'altar', at: { x: 33, z: -53 }, age: 'fresh' }, // west of the altar: the cookpot's yard (45.5, −49.5) is east of it
		{ id: 'skirmish', cause: 'raid', host: 'camp-gate', at: { x: 32, z: -23 }, dir: 1.2, age: 'old' },
	],
};

// ---------------------------------------------------------------------------------------------------------------
// The ground: a pure sampler. Gentle terrain flattened under paths and pads, a rocky ridge in the north, wet banks and
// hollows, blood near the altar. Distances to the paths come from a 1 m field computed once.

const FIELD = 1, NF = 129;
const polylines = DEMO_PLAN.paths.map((p) => p.points);
const pads = [
	{ x: -33, z: -30, r: 12 }, { x: 38, z: -42, r: 17 }, { x: -43, z: 33, r: 7 }, { x: 20, z: 30, r: 7 }, { x: -56, z: 21, r: 4 }, { x: 44, z: 38, r: 5 }, { x: 14, z: -23.3, r: 4.5 },
];
const segDist = (x, z, a, b) => {
	const dx = b.x - a.x, dz = b.z - a.z, t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
};
// flatField: distance to a path or a flattened pad (the terrain is levelled there); walkField: distance to a path only (only
// paths are trampled bare: a pad such as the meadow arena keeps its turf)
const flatField = new Float32Array(NF * NF), walkField = new Float32Array(NF * NF);
for (let j = 0; j < NF; j++) {
	for (let i = 0; i < NF; i++) {
		const x = -64 + i * FIELD, z = -64 + j * FIELD;
		let d = 99;
		for (const line of polylines) for (let k = 0; k + 1 < line.length; k++) d = Math.min(d, segDist(x, z, line[k], line[k + 1]));
		walkField[j * NF + i] = d;
		for (const p of pads) d = Math.min(d, Math.max(0, Math.hypot(x - p.x, z - p.z) - p.r));
		flatField[j * NF + i] = d;
	}
}
const sampleField = (field, x, z) => {
	const fx = Math.min(NF - 1.001, Math.max(0, (x + 64) / FIELD)), fz = Math.min(NF - 1.001, Math.max(0, (z + 64) / FIELD));
	const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
	const a = field[j * NF + i] * (1 - tx) + field[j * NF + i + 1] * tx, b = field[(j + 1) * NF + i] * (1 - tx) + field[(j + 1) * NF + i + 1] * tx;
	return a * (1 - tz) + b * tz;
};
const pathDistance = (x, z) => sampleField(flatField, x, z);
const walkDistance = (x, z) => sampleField(walkField, x, z);
const creekDistance = (x, z) => {
	let d = 99;
	for (let k = 0; k + 1 < CREEK.length; k++) d = Math.min(d, segDist(x, z, CREEK[k], CREEK[k + 1]));
	return d;
};
const ALTAR = { x: 38, z: -52 };

const lowAt = (x, z) => (vnoise(x * 0.018 + 4.1, z * 0.018 + 9.7, 7) - 0.5) * 3.2;
// radius = half the diagonal of the building's footprint + 0.8 m (a house 7 × 5, a barn 9 × 6, both unrotated)
const levelPads = [{ x: -44, z: -38, r: 5.1 }, { x: -22, z: -40, r: 6.2 }].map((p) => ({ ...p, h: lowAt(p.x, p.z) }));

/** Ground at (x, z): { height (m), wet, grass, blood, rock (0..1), water (bool) }. */
export function demoGround(x, z) {
	const low = lowAt(x, z), bumps = (vnoise(x * 0.14, z * 0.14, 11) - 0.5) * 0.7;
	const flat = 1 - sm(1.5, 6, pathDistance(x, z));
	// the back boundary: a soft rise along the north edge (≤ ~26° anywhere), not a wall; it starts behind the camp's altar and
	// butchery (z −52, −53) so those hosts stand on level ground
	const ridge = sm(-54, -64, z) * (1.2 + vnoise(x * 0.07, z * 0.07, 13) * 1.2);
	let height = low + bumps * (1 - flat) + ridge;
	// building pads: the ground is level under the house and the barn (their floors sit on it), blending back over 3 m
	for (const pad of levelPads) {
		const w = 1 - sm(pad.r, pad.r + 3, Math.hypot(x - pad.x, z - pad.z));
		if (w > 0) height = height * (1 - w) + pad.h * w;
	}
	const cd = creekDistance(x, z);
	const pond = pointInPoly(POND, x, z);
	const water = cd < CREEK_WIDTH / 2 || pond;
	const hollow = sm(0.1, -1.1, low + bumps) * 0.3;
	const wet = Math.min(1, 0.08 + 0.2 * vnoise(x * 0.05, z * 0.05, 17) + hollow + (1 - sm(CREEK_WIDTH / 2, CREEK_WIDTH / 2 + 4, cd)) * 0.8 + (pond ? 1 : 0));
	const rock = Math.min(1, sm(-54, -62, z) * (0.5 + vnoise(x * 0.1, z * 0.1, 19)) + sm(8, 3, Math.hypot(x - 47, z - 41)) * 0.8);
	const trampled = 1 - sm(0, 3, walkDistance(x, z));
	const grass = Math.min(1, Math.max(0, 0.3 + 0.85 * patchField(x, z, 23) - rock * 0.9 - wet * 0.25 - trampled * 0.45));
	const blood = Math.max(sm(7.5, 2, Math.hypot(x - ALTAR.x, z - ALTAR.z)) * 0.95, sm(5, 1.5, Math.hypot(x - 29, z - 37)) * 0.4);
	return { height, wet, grass, blood, rock, water };
}

DEMO_PLAN.ground = demoGround;

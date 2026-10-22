// ASHLAR · The Old Face (Prologue, Level Design §10.1; scene src/scenes/oldFace.js): the CPU side of the fixed, hand-authored tutorial dungeon under Lychgate church.
// Pure maths, no THREE: the rooms and the distance-to-wall field, the wall runs and their crypt-wall modules, floor heights (flood basin, stair), the ground masks (evaluated into
// one LayerSplat like the dungeon's), the blockers, the path, the encounters, the story pieces, the lights and the camera views.
// Coordinates are world metres: x east, z south (toward the default camera, which looks north), y up. Everything is deterministic.
import { smoothParams } from './biomeMix.js';
import { noise, fbm, smoothstep, flicker1f, textureId, porosity, turnMode, PROP_IDS } from './dungeon.js';

export { smoothParams, noise, fbm, smoothstep, flicker1f, textureId, porosity, turnMode, PROP_IDS };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;

/** The crypt-wall GLB: 4 m wide, 2.28 m tall, 0.6973 m deep (front face at +z, pivot bottom centre). */
export const MODULE = { width: 4, height: 2.283, half: 0.3486 };

// ---- the horseshoe (the Face) ------------------------------------------------------------------------------------------------------
// Inner radius 6 (not 5): six 30-degree sides then need x-scale 0.80 (the brief's lower bound), and the apex falls on a vertex between two modules, which is where the hole goes.
export const FACE = (() => {
	const cx = -23.5;
	const cz = -2.5;
	const R = 6;
	const W = R / Math.cos(15 * DEG);
	const verts = Array.from({ length: 7 }, (_, k) => [cx - W * Math.cos(30 * DEG * k), cz - W * Math.sin(30 * DEG * k)]);
	return { cx, cz, R, W, drop: 3, verts, apex: { x: cx, z: cz - W }, south: cz + 3 };
})();

export const SPAWN = { x: FACE.cx, z: FACE.apex.z + 1.6 }; // 1.6 m out: with the spot at the fissure plane the hero's shadow falls forward, not in spokes
/** The hole: the gap between the two apex modules. */
export const HOLE = { x: FACE.apex.x, z: FACE.apex.z, pull: 0.6, width: 1.16, height: 2.3 };
export const DOOR = { x: 13.7, z: -6.0, width: 1.4, height: 2.6 };

export const FLOOD = { x0: 6.0, x1: 10.6, z0: 1.5, z1: 4.9, ramp: 0.6 }; // 0.4 m down over 0.6 m measured ALONG THE SLOPE (see basinY): 34 degrees on the curve itself (the ramp is measured as true distance to the shore curve, so it keeps its width round bends); on the 0.25 m floor mesh the steepest triangle is 39 degrees (tested: < 53); a floor to the nav (a face steeper than ~53 degrees counts as a wall and walls off the shore cells)
export const LEVEL = { dry: 0, basin: -0.4, water: -0.18 };
export const STAIR = { x0: 12.0, x1: 15.4, z0: 1.5, rise: 0.18, run: 0.42, count: 10, top: 1.8 }; // 10 risers of 0.18 m: at most 3 per 1 m, so the 1 m nav grid's 0.6 m step limit holds
STAIR.zTop = STAIR.z0 - (STAIR.count - 1) * STAIR.run; // the landing begins here (tread 10 is the landing itself)

export const COLLAPSE = { x: -5.0, z: 1.75, lean: 27 * DEG, yaw: 0.14, sink: 0.3, sx: 1.0, sy: 1.0 };

// ---- rooms ------------------------------------------------------------------------------------------------------------------------
const rect = (name, x0, x1, z0, z1) => ({ name, kind: 'rect', x0, x1, z0, z1 });
const faceRoom = { name: 'face', kind: 'poly', pts: [[FACE.verts[0][0], FACE.south], ...FACE.verts, [FACE.verts[6][0], FACE.south]] };
export const ROOMS = [
	faceRoom,
	rect('neck', -24.8, -22.2, 0.5, 2.9),
	rect('passage', -24.8, -7.0, 2.9, 5.5),
	rect('squeeze', -7.0, -3.0, COLLAPSE.z, 4.9),
	rect('bay', -3.0, 4.0, -1.5, 4.9),
	rect('flood', 4.0, 12.0, FLOOD.z0, 4.9),
	rect('foyer', 12.0, 15.4, FLOOD.z0, 4.9),
	rect('stair', STAIR.x0, STAIR.x1, STAIR.zTop, STAIR.z0),
	rect('landing', STAIR.x0, STAIR.x1, DOOR.z, STAIR.zTop),
];

function inPoly(pts, x, z) {
	let sign = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		const c = (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]);
		if (Math.abs(c) < 1e-9) continue;
		if (sign === 0) sign = Math.sign(c);
		else if (Math.sign(c) !== sign) return false;
	}
	return true;
}

export function roomAt(x, z) {
	for (const r of ROOMS) {
		if (r.kind === 'rect' ? x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 : inPoly(r.pts, x, z)) return r.name;
	}
	return null;
}
export const inside = (x, z) => roomAt(x, z) !== null;

// the distance field: a 0.25 m raster of `inside`, exact (brute force within 3 m), positive in the rooms, negative outside; sampled bilinearly
const DF = { x0: -34, z0: -13, cell: 0.25, nx: 212, nz: 88, max: 3 };
let dfData = null;
function buildDistanceField() {
	const { x0, z0, cell, nx, nz, max } = DF;
	const ins = new Uint8Array(nx * nz);
	for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) ins[j * nx + i] = inside(x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell) ? 1 : 0;
	const r = Math.ceil(max / cell);
	const out = new Float32Array(nx * nz);
	for (let j = 0; j < nz; j++) {
		for (let i = 0; i < nx; i++) {
			const me = ins[j * nx + i];
			let best = max * max;
			for (let dj = -r; dj <= r; dj++) {
				const jj = j + dj;
				if (jj < 0 || jj >= nz) continue;
				for (let di = -r; di <= r; di++) {
					const ii = i + di;
					if (ii < 0 || ii >= nx || ins[jj * nx + ii] === me) continue;
					const d2 = (di * di + dj * dj) * cell * cell;
					if (d2 < best) best = d2;
				}
			}
			const d = Math.max(0, Math.sqrt(best) - cell / 2);
			out[j * nx + i] = me ? d : -d;
		}
	}
	return out;
}

/** Signed distance to the nearest wall (m, positive inside the rooms, negative outside), clamped to ±3. */
export function wallDistance(x, z) {
	dfData ??= buildDistanceField();
	const { x0, z0, cell, nx, nz, max } = DF;
	const fx = (x - x0) / cell - 0.5;
	const fz = (z - z0) / cell - 0.5;
	if (fx < 0 || fz < 0 || fx >= nx - 1 || fz >= nz - 1) return -max;
	const i = Math.floor(fx);
	const j = Math.floor(fz);
	const tx = fx - i;
	const tz = fz - j;
	const at = (ii, jj) => dfData[jj * nx + ii];
	return (at(i, j) * (1 - tx) + at(i + 1, j) * tx) * (1 - tz) + (at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx) * tz;
}

// ---- heights ------------------------------------------------------------------------------------------------------------------------
/** The flooded step's shore (x of the west / east stone edge at z): irregular, within about +-1.1 m of the straight edges. */
export const shoreX0 = (z) => FLOOD.x0 + (fbm(z * 1.2 + 3.1, 2.7) - 0.5) * 2.2;
export const shoreX1 = (z) => FLOOD.x1 + (fbm(z * 1.2 + 9.7, 3.7) - 0.5) * 1.6;
/** Signed distance (m) from (x, z) to the shore curve x = fn(z): positive on the water side (`side` +1 west shore, -1 east shore). The true distance, not the x offset, so the ramp is the same width round a bend. */
const shoreDist = (fn, x, z, side) => {
	let best = Infinity;
	for (let k = -24; k <= 24; k++) {
		const zi = z + k * 0.05;
		const d = Math.hypot(x - fn(zi), z - zi);
		if (d < best) best = d;
	}
	return side * (x - fn(z)) >= 0 ? best : -best;
};
export function basinY(x, z) {
	const f = FLOOD;
	if (z < f.z0 - 0.01 || z > f.z1 + 0.01) return LEVEL.dry;
	const down = clamp(shoreDist(shoreX0, x, z, 1) / f.ramp, 0, 1);
	const up = clamp(shoreDist(shoreX1, x, z, -1) / f.ramp, 0, 1);
	return lerp(LEVEL.dry, LEVEL.basin, Math.min(down, up));
}
/** Stair / landing height at z (the stairwell column): steps of `rise` every `run`, ten risers up to the landing. */
export function stairY(z) {
	const s = STAIR;
	if (z >= s.z0) return 0;
	if (z <= s.zTop) return s.top;
	return s.rise * Math.ceil((s.z0 - z) / s.run);
}
export const onStairColumn = (x, z) => x >= STAIR.x0 - 0.01 && x <= STAIR.x1 + 0.01 && z < STAIR.z0;
/** Floor height (m) at world xz. */
export function floorY(x, z) {
	return onStairColumn(x, z) ? stairY(z) : basinY(x, z);
}
/** Water depth (m, 0 = dry) at world xz: the standing water of the flooded step. */
export function waterDepth(x, z) {
	if (!inside(x, z)) return 0;
	return Math.max(0, LEVEL.water - floorY(x, z));
}

// ---- wall runs and their modules ---------------------------------------------------------------------------------------------------
const norm = (x, z) => {
	const l = Math.hypot(x, z) || 1;
	return [x / l, z / l];
};
const toward = (a, b, c) => norm(c[0] - (a[0] + b[0]) / 2, c[1] - (a[1] + b[1]) / 2);
const V = FACE.verts;
const C = [FACE.cx, FACE.cz];

/** Bone runs (crypt-wall modules). a -> b along the wall's inner face, `in` = unit normal into the room, sy = module y scale. */
export const BONE_RUNS = [
	...Array.from({ length: 6 }, (_, k) => ({ id: `face${k}`, a: V[k], b: V[k + 1], in: toward(V[k], V[k + 1], C), sy: 1.2, n: 1, sx: Math.hypot(V[k + 1][0] - V[k][0], V[k + 1][1] - V[k][1]) / 4, shift: k === 2 ? -HOLE.pull : k === 3 ? HOLE.pull : 0 })),
	{ id: 'faceW', a: [V[0][0], FACE.south], b: V[0], in: [1, 0], sy: 1.2, n: 1, sx: 0.8 },
	{ id: 'faceE', a: V[6], b: [V[6][0], FACE.south], in: [-1, 0], sy: 1.2, n: 1, sx: 0.8 },
	{ id: 'closeW', a: [V[0][0], FACE.south], b: [-24.8, FACE.south], in: [0, -1], sy: 1.2 },
	{ id: 'closeE', a: [-22.2, FACE.south], b: [V[6][0], FACE.south], in: [0, -1], sy: 1.2 },
	{ id: 'neckE', a: [-22.2, 0.5], b: [-22.2, 2.9], in: [-1, 0], sy: 1.0 },
	{ id: 'passW', a: [-24.8, 0.5], b: [-24.8, 5.5], in: [1, 0], sy: 1.0 },
	{ id: 'passN', a: [-22.2, 2.9], b: [-7.0, 2.9], in: [0, 1], sy: 1.0, warm: 1 },
	{ id: 'passS', a: [-24.8, 5.5], b: [-7.0, 5.5], in: [0, -1], sy: 1.0 },
	{ id: 'collapse', a: [-7.0, COLLAPSE.z], b: [-3.0, COLLAPSE.z], in: [0, 1], sy: 1.0, n: 1, lean: true },
	{ id: 'bayW', a: [-3.0, COLLAPSE.z], b: [-3.0, -1.5], in: [1, 0], sy: 1.0 },
	{ id: 'bayN', a: [-3.0, -1.5], b: [4.0, -1.5], in: [0, 1], sy: 1.0, niches: 1 },
	{ id: 'bayE', a: [4.0, -1.5], b: [4.0, 1.5], in: [-1, 0], sy: 1.0 },
	{ id: 'floodN', a: [4.0, 1.5], b: [12.0, 1.5], in: [0, 1], sy: 1.0 },
	{ id: 'southS', a: [-7.0, 4.9], b: [12.0, 4.9], in: [0, -1], sy: 1.0 },
];

/** Plain cut Mason stone runs (stairwell, doorway, small repairs): a -> b, `in`, height h. */
export const STONE_RUNS = [
	{ id: 'jogN', a: [-7.0, 2.9], b: [-7.0, COLLAPSE.z], in: [1, 0], h: 2.6 },
	{ id: 'jogS', a: [-7.0, 4.9], b: [-7.0, 5.5], in: [-1, 0], h: 2.6 },
	{ id: 'foyerS', a: [12.0, 4.9], b: [15.4, 4.9], in: [0, -1], h: 3.4 },
	{ id: 'stairE', a: [15.4, 4.9], b: [15.4, DOOR.z], in: [-1, 0], h: 4.4 },
	{ id: 'stairW', a: [12.0, FLOOD.z0], b: [12.0, DOOR.z], in: [1, 0], h: 4.4 },
	{ id: 'door', a: [12.0, DOOR.z], b: [15.4, DOOR.z], in: [0, 1], h: 4.4, door: true },
];

/** Modules of one bone run. Each: { x, y, z, yaw, tilt, sx, sy, run, i, tag }. */
export function runModules(run) {
	const [ax, az] = run.a;
	const [bx, bz] = run.b;
	const len = Math.hypot(bx - ax, bz - az);
	const dx = (bx - ax) / len;
	const dz = (bz - az) / len;
	const n = run.n ?? Math.max(1, Math.ceil(len / (MODULE.width * 1.1) - 1e-9));
	const sx = run.sx ?? clamp(len / (MODULE.width * n), 0.8, 1.1);
	const spacing = len / n;
	const overlap = sx * MODULE.width > spacing + 0.01;
	const out = [];
	for (let i = 0; i < n; i++) {
		const t = (i + 0.5) * spacing + (run.shift ?? 0);
		const stagger = overlap ? 0.02 * (i % 2) : 0;
		const off = -MODULE.half + stagger;
		const m = { x: ax + dx * t + run.in[0] * off, y: 0, z: az + dz * t + run.in[1] * off, yaw: Math.atan2(run.in[0], run.in[1]), tilt: 0, sx, sy: run.sy, run: run.id, i, tag: '' };
		if (run.lean) Object.assign(m, { tilt: COLLAPSE.lean, yaw: m.yaw + COLLAPSE.yaw, y: -COLLAPSE.sink, sx: COLLAPSE.sx, sy: COLLAPSE.sy, tag: 'collapse' });
		if (run.warm && i === 1) m.tag = 'warm';
		if (run.niches) m.tag = 'niches';
		out.push(m);
	}
	return out;
}
export const wallModules = () => BONE_RUNS.flatMap(runModules);

// ---- footprints (blockers) ---------------------------------------------------------------------------------------------------------
function hull(points) {
	const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
	if (p.length < 3) return p;
	const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
	const lower = [];
	for (const q of p) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
		lower.push(q);
	}
	const upper = [];
	for (let i = p.length - 1; i >= 0; i--) {
		const q = p[i];
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
		upper.push(q);
	}
	upper.pop();
	lower.pop();
	return lower.concat(upper);
}

/** Footprint (convex polygon, world xz) of a placed module in the hero's height band (default 0.35..1.7 m above the floor). */
export function moduleFootprint(m, band = [0.35, 1.7], floor = 0) {
	const pts = [];
	const ct = Math.cos(m.tilt);
	const st = Math.sin(m.tilt);
	const cy = Math.cos(m.yaw);
	const sy = Math.sin(m.yaw);
	for (let a = -1; a <= 1.0001; a += 0.25) {
		for (let h = 0; h <= 1.0001; h += 1 / 24) {
			for (const lz of [-MODULE.half, MODULE.half]) {
				const lx = a * 2 * m.sx;
				const ly = h * MODULE.height * m.sy;
				const y = ly * ct - lz * st + m.y;
				if (y < floor + band[0] || y > floor + band[1]) continue;
				const z0 = ly * st + lz * ct;
				pts.push([m.x + lx * cy + z0 * sy, m.z - lx * sy + z0 * cy]);
			}
		}
	}
	return hull(pts);
}

/** The leaning, sunk module of the squeeze (built from its run, so the scene and the tests use the same numbers). */
export const collapseModule = () => runModules(BONE_RUNS.find((r) => r.id === 'collapse'))[0];

export function inConvex(pts, x, z) {
	return pts.length >= 3 && inPoly(pts, x, z);
}

/** Static blockers of the hero (polygons) and obstacles (discs): everything solid that stands on the walkable floor. */
export const BLOCKERS = [{ id: 'collapse slab', pts: moduleFootprint(collapseModule()) }];

/** Story and prop pieces that stand in the rooms (also the nav obstacles). */
export const CHAIR = { x: -21.8, z: -6.3, yaw: Math.atan2(FACE.apex.x + 21.8, FACE.apex.z + 6.3) + 0.12 }; // faces the Face (its front is local +z), a little crooked
export const WAX_SHELF = (() => {
	// a low ledge along the west apex module, 1.9 m from the apex, standing off the face by half its depth
	const a = V[2];
	const b = V[3];
	const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
	const dx = (b[0] - a[0]) / len;
	const dz = (b[1] - a[1]) / len;
	const inn = toward(a, b, C);
	const t = 1.2; // the shelf's centre along the west apex side (the module spans 0..2.4 m from the side's start once pulled off the hole)
	const depth = 0.35;
	return { x: a[0] + dx * t + inn[0] * (depth / 2 + 0.02), z: a[1] + dz * t + inn[1] * (depth / 2 + 0.02), yaw: Math.atan2(inn[0], inn[1]), len: 2.4, depth, h: 0.8 };
})();
export const STATUE = { x: 14.85, z: -5.2, yaw: -1.0, head: 0.8 };
export const GENNET = { x: 12.55, z: -5.8, y: STAIR.top + 1.25 }; // the lantern hangs from an iron hook on the door wall, left of the opening (y = the lantern's centre)

export const OBSTACLES = [
	{ id: 'chair', x: CHAIR.x, z: CHAIR.z, r: 0.42 },
	{ id: 'statue', x: STATUE.x, z: STATUE.z, r: 0.5 },
	{ id: 'shelf', x: WAX_SHELF.x, z: WAX_SHELF.z, r: 1.2 },
	{ id: 'pile west', x: FACE.cx - 0.75, z: FACE.apex.z + 0.5, r: 0.38 },
	{ id: 'pile east', x: FACE.cx + 0.7, z: FACE.apex.z + 0.5, r: 0.38 },
];

/** Bone piles, candle clusters, boulders, column: { kind, x, z, yaw, scale, lit?, ao? }. The hero's path keeps clear of every one of them. */
export const PROPS = [
	// the hero crawled out over these, at the hole's foot
	{ kind: 'bonePile', x: FACE.cx - 0.75, z: FACE.apex.z + 0.5, yaw: 0.4, scale: 0.6, ao: 1.1 },
	{ kind: 'bonePile', x: FACE.cx + 0.7, z: FACE.apex.z + 0.5, yaw: 2.6, scale: 0.55, ao: 1.1 },
	{ kind: 'bonePile', x: FACE.cx - 3.9, z: FACE.apex.z + 1.7, yaw: 5.1, scale: 0.7 },
	{ kind: 'bonePile', x: FACE.cx + 4.4, z: FACE.apex.z + 2.6, yaw: 1.3, scale: 0.65 },
	{ kind: 'bonePile', x: FACE.cx - 5.3, z: -1.2, yaw: 3.4, scale: 0.75 },
	{ kind: 'bonePile', x: FACE.cx + 5.2, z: -0.8, yaw: 0.2, scale: 0.7 },
	{ kind: 'bonePile', x: -24.1, z: 5.0, yaw: 1.1, scale: 0.55 },
	{ kind: 'bonePile', x: -1.9, z: -0.9, yaw: 0.6, scale: 0.7 },
	{ kind: 'bonePile', x: 2.9, z: -0.8, yaw: 4.1, scale: 0.6 },
	// the waxy shelf: three candle clusters, unlit (the Vigil candles went out)
	{ kind: 'candles', x: WAX_SHELF.x + 0.0, z: WAX_SHELF.z + 0.0, yaw: 0.3, scale: 0.7, lit: false, shelf: -0.8 },
	{ kind: 'candles', x: WAX_SHELF.x, z: WAX_SHELF.z, yaw: 1.9, scale: 0.85, lit: false, shelf: 0.0 },
	{ kind: 'candles', x: WAX_SHELF.x, z: WAX_SHELF.z, yaw: 4.2, scale: 0.6, lit: false, shelf: 0.85 },
	// the collapse
	{ kind: 'boulders', x: -3.55, z: 2.45, yaw: 0.8, scale: 0.5, ao: 1.2 },
	{ kind: 'boulders', x: -6.55, z: 2.4, yaw: 2.4, scale: 0.42, ao: 1.2 },
	{ kind: 'column', x: -5.35, z: 2.25, yaw: 1.0, scale: 0.62, ao: 1.0 },
	{ kind: 'bonePile', x: -4.2, z: 2.35, yaw: 2.0, scale: 0.55 },
	{ kind: 'bonePile', x: -6.0, z: 2.3, yaw: 5.5, scale: 0.5 },
];

// ---- path, clearance --------------------------------------------------------------------------------------------------------------
export const PATH = [
	[SPAWN.x, SPAWN.z], [SPAWN.x, -2.5], [SPAWN.x, 1.5], [-23.3, 3.4], [-22.0, 4.2], [-15, 4.2], [-8.0, 4.0], [-5.0, 3.95], [-3.0, 3.8], [-1.0, 3.4], [2.0, 3.3], [4.5, 3.2],
	[8.5, 3.2], [11.5, 3.2], [13.7, 3.3], [13.7, 1.5], [13.7, -4.4],
];

/** Samples of the path every `step` m of arc length: [x, z, segment index]. */
export function pathSamples(step = 0.5) {
	const out = [];
	let next = 0; // arc length of the next sample
	let start = 0; // arc length at the segment's start
	for (let i = 0; i + 1 < PATH.length; i++) {
		const [ax, az] = PATH[i];
		const [bx, bz] = PATH[i + 1];
		const len = Math.hypot(bx - ax, bz - az);
		for (; next < start + len - 1e-9; next += step) {
			const s = next - start;
			out.push([ax + ((bx - ax) * s) / len, az + ((bz - az) * s) / len, i]);
		}
		start += len;
	}
	out.push([...PATH[PATH.length - 1], PATH.length - 2]);
	return out;
}
export function pathDistance(x, z) {
	let best = 1e9;
	for (let i = 0; i + 1 < PATH.length; i++) {
		const [ax, az] = PATH[i];
		const [bx, bz] = PATH[i + 1];
		const dx = bx - ax;
		const dz = bz - az;
		const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
		best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
	}
	return best;
}

/** Distance (m) from a point to the nearest solid thing: wall, blocker, obstacle (positive = free). */
export function clearance(x, z) {
	let d = wallDistance(x, z);
	for (const o of OBSTACLES) d = Math.min(d, Math.hypot(x - o.x, z - o.z) - o.r);
	for (const b of BLOCKERS) d = Math.min(d, inConvex(b.pts, x, z) ? -polyEdgeDistance(b.pts, x, z) : polyEdgeDistance(b.pts, x, z));
	return d;
}
function polyEdgeDistance(pts, x, z) {
	let best = 1e9;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		const dx = b[0] - a[0];
		const dz = b[1] - a[1];
		const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1);
		best = Math.min(best, Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t)));
	}
	return best;
}

/** Free width (m) across the path at a point: scan both ways along the perpendicular until something solid. */
export function freeWidth(x, z, dx, dz, limit = 6) {
	const px = -dz;
	const pz = dx;
	const scan = (sign) => {
		let s = 0;
		for (; s < limit; s += 0.05) if (clearance(x + px * sign * s, z + pz * sign * s) < 0) break;
		return s;
	};
	return scan(1) + scan(-1);
}

/** Walkable from spawn to the door on a 0.25 m grid with `margin` of clearance (flood fill); returns { reached, cells }. */
export function connectivity(margin = 0.35, cell = 0.25) {
	const x0 = -32;
	const z0 = -11;
	const nx = Math.ceil(52 / cell);
	const nz = Math.ceil(20 / cell);
	const ok = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && clearance(x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell) >= margin;
	const start = [Math.floor((SPAWN.x - x0) / cell), Math.floor((SPAWN.z - z0) / cell)];
	const goal = [Math.floor((DOOR.x - x0) / cell), Math.floor((DOOR.z + 1.6 - z0) / cell)];
	const seen = new Uint8Array(nx * nz);
	const queue = [start[0] + start[1] * nx];
	seen[queue[0]] = 1;
	for (let q = 0; q < queue.length; q++) {
		const k = queue[q];
		const i = k % nx;
		const j = (k / nx) | 0;
		for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const ni = i + di;
			const nj = j + dj;
			if (!ok(ni, nj) || seen[ni + nj * nx]) continue;
			seen[ni + nj * nx] = 1;
			queue.push(ni + nj * nx);
		}
	}
	return { reached: !!seen[goal[0] + goal[1] * nx], cells: queue.length, start: ok(start[0], start[1]), goal: ok(goal[0], goal[1]) };
}

// ---- ground layers and masks ------------------------------------------------------------------------------------------------------
export const LAYERS = [
	{ id: 'BIO08_nave', tile: 4 }, // 0 grey flagstones (the base)
	{ id: 'BIO27_vault', tile: 4 }, // 1 dark ossuary stone toward the walls and corners
	{ id: 'BIO27_cradle', tile: 3.5 }, // 2 pale chalk-and-bone mortar in the horseshoe (BIO04_ossuary is orange-brown: an accent colour the Prologue does not have)
	{ id: 'DG_crypt_rubble', tile: 3.5 }, // 3 the collapse
	{ id: 'DG_crypt_dust', tile: 3.5 }, // 4 sparse dust in the dry corners
	{ id: 'DG_crypt_damp', tile: 3.5 }, // 5 the weeping Face's foot, the flood and its banks
	{ id: 'BIO07_limestone', tile: 4 }, // 6 the faint worn line of the path
];
export const layerIds = () => LAYERS.map((l) => l.id);

/** The splat's square: covers x -32..18, z -12..8 (50 x 50 would be wasteful: the splat is rectangular in metres but square in texels, so use the larger side). */
export const SPLAT = { cx: -7, cz: -2, extent: 52, res: 576 };

const rectDistance = (x, z, r) => Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1));
const FLOOD_RECT = { x0: FLOOD.x0, x1: FLOOD.x1, z0: FLOOD.z0, z1: FLOOD.z1 };

/** Ground masks (x, z, out): out[i] (i = 1..6) = coverage of layer i over those below, out[7] = wetness. `sp` = smoothParams(slider). Outside the walls (beyond a 3 m margin) nothing is evaluated. */
export function makeMasks(sp) {
	const k = 0.5 + (1.5 * sp.blurM) / 0.95;
	return (x, z, out) => {
		const d = wallDistance(x, z);
		if (d < -2.6) return;
		const n1 = fbm(x * 0.34 + 4.1, z * 0.34 + 1.7, sp.detail);
		const n2 = fbm(x * 0.21 + 11.3, z * 0.21 + 6.4, sp.detail);
		const nHi = fbm(x * 0.9 + 2.3, z * 0.9 + 8.8, sp.detail);
		const dx = x - FACE.cx;
		const face = 1 - smoothstep(4.6, 4.6 + 3.2 * k, Math.hypot(dx, (z - (FACE.cz + 0.5)) * 0.9));
		const foot = 1 - smoothstep(0.9, 0.9 + 3.4 * k, Math.hypot(dx * 0.8, z - (FACE.apex.z + 1.4)));
		const pd = pathDistance(x, z);
		const walk = (1 - smoothstep(0.5 * k, 1.4 * k, pd + (n1 - 0.5) * 0.9)) * (1 - face);
		const bd = rectDistance(x, z, FLOOD_RECT);
		const basin = 1 - smoothstep(0.0, 1.5 * k, bd);
		const collapse = 1 - smoothstep(1.4, 1.4 + 2.6 * k, Math.hypot((x - COLLAPSE.x) * 0.8, z - 2.7));
		const stairFoot = 1 - smoothstep(0.3, 0.3 + 1.6 * k, Math.hypot(x - 13.7, (z - 1.7) * 1.2));
		const damp = Math.max(foot * 0.95, basin, stairFoot * 0.55);
		out[1] = clamp((0.5 + 0.4 * (1 - smoothstep(0.1, 1.9 * k, d + (n2 - 0.5) * 1.8)) + 0.3 * smoothstep(0.62, 0.85, n1) - 0.3 * walk) * (1 - 0.5 * face), 0, 1);
		out[2] = clamp(face * (0.4 + 0.2 * smoothstep(0.3, 0.65, n1)) * (1 - 0.5 * foot), 0, 1);
		out[3] = clamp(collapse * smoothstep(0.2, 0.45, nHi + 0.25) * (1 - 0.5 * basin), 0, 1);
		out[4] = clamp((1 - smoothstep(0.15, 1.6 * k, d)) * smoothstep(0.5, 0.68, nHi + (n2 - 0.5) * 0.3) * 0.7 * (1 - 0.9 * walk) * (1 - damp), 0, 1);
		out[5] = clamp(damp, 0, 1);
		out[6] = clamp(walk * 0.45 * (0.7 + 0.3 * smoothstep(0.35, 0.65, nHi)) * (1 - damp), 0, 1);
		const warm = 1 - smoothstep(0.2, 2.2, Math.hypot(x + 16.5, (z - 3.0) * 1.3)); // the weeping warm wall
		out[7] = clamp(0.9 * foot + 1.0 * basin + 0.55 * stairFoot + 0.45 * warm + 0.12 * (1 - smoothstep(0.2, 1.4, d)), 0, 1);
	};
}

// ---- story pieces ------------------------------------------------------------------------------------------------------------------
/** Dead iron sconces on the wall faces: { x, y, z, yaw, nx, nz }. Positions on the bone runs at the joints between modules (the stone seams). */
export function sconces() {
	const out = [];
	const add = (run, t, y = 1.45) => {
		const [ax, az] = run.a;
		const [bx, bz] = run.b;
		const len = Math.hypot(bx - ax, bz - az);
		out.push({ x: ax + ((bx - ax) * t) / len + run.in[0] * 0.01, y, z: az + ((bz - az) * t) / len + run.in[1] * 0.01, yaw: Math.atan2(run.in[0], run.in[1]), nx: run.in[0], nz: run.in[1], run: run.id });
	};
	const R = (id) => BONE_RUNS.find((r) => r.id === id);
	for (const id of ['face0', 'face1', 'face4', 'face5']) add(R(id), Math.hypot(R(id).b[0] - R(id).a[0], R(id).b[1] - R(id).a[1]) * 0.5, 1.7);
	add(R('faceW'), 1.5, 1.6);
	add(R('faceE'), 1.5, 1.6);
	for (const x of [-20.2, -12.4]) add(R('passN'), x + 22.2);
	for (const x of [-16.2, -8.4]) add(R('passS'), x + 24.8);
	add(R('bayN'), 3.6, 1.5);
	add(R('floodN'), 3.6);
	add(R('southS'), 15.6);
	add(R('southS'), 8.0);
	return out;
}

/** Still cold pinpoints in the horseshoe: { x, y, z, nx, nz } (emissive specks, no lights). */
export function pinpoints(count = 9) {
	const rand = rng(4417);
	const out = [];
	const runs = BONE_RUNS.filter((r) => r.id.startsWith('face') && r.id !== 'face2' && r.id !== 'face3');
	for (let i = 0; i < count; i++) {
		const run = runs[i % runs.length];
		const [ax, az] = run.a;
		const [bx, bz] = run.b;
		const t = 0.1 + 0.8 * rand();
		out.push({ x: ax + (bx - ax) * t + run.in[0] * 0.355, y: 0.45 + rand() * 1.85, z: az + (bz - az) * t + run.in[1] * 0.355, nx: run.in[0], nz: run.in[1] });
	}
	return out;
}

/** The knocking niches of the bay's north wall (E2 cues): world xz at the wall face and floor. */
export const KNOCK = [{ x: -0.95, z: -1.3 }, { x: 1.75, z: -1.3 }];
/** The warm wall's rat holes at the foot of the passage's north wall (E1 cues). */
export const RAT_HOLES = [{ x: -17.4, z: 3.0 }, { x: -16.4, z: 3.0 }, { x: -15.5, z: 3.0 }];
export const WARM_WALL = { x: -16.5, z: 2.9, width: 3.6 };

/** Seeded PRNG (mulberry32): the same as kit.rng, copied so this module stays free of THREE. */
export function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---- encounters (Play) ------------------------------------------------------------------------------------------------------------
/**
 * Each: a circular trigger on the hero's world position, gated by `rooms` (roomAt) so it never fires through a wall, the cues (dust puffs: { x, z, delay s }) that come first, then the spawn after `spawnAfter` s.
 * type: gameplay monster ('spider' stands in for the Mortar-Rat, 'zombie' for the Shambler), at: spawn points (world xz), mlvl kept low.
 */
export const ENCOUNTERS = [
	{
		id: 'E1', label: 'E1 · Chuột vữa (Mortar-Rat) từ bức tường ấm', trigger: { x: WARM_WALL.x, z: 3.8, r: 7.0, rooms: ['neck', 'passage'] },
		cues: RAT_HOLES.map((h, i) => ({ x: h.x, z: h.z + 0.15, delay: i * 0.35 })), spawnAfter: 1.4,
		spawn: [{ type: 'spider', name: 'Mortar-Rat', mlvl: 1, at: [[-17.3, 3.9], [-16.3, 4.0], [-15.4, 3.9]] }],
	},
	{
		id: 'E2', label: 'E2 · Hốc gõ — Shambler vỡ ra', trigger: { x: 0.5, z: 2.0, r: 4.4, rooms: ['bay'] },
		cues: [{ ...KNOCK[0], delay: 0 }, { ...KNOCK[1], delay: 0.5 }, { ...KNOCK[0], delay: 1.0 }], spawnAfter: 1.7,
		spawn: [{ type: 'zombie', name: 'Shambler', mlvl: 1, rise: true, at: [[KNOCK[0].x, -0.2], [KNOCK[1].x, -0.2]] }],
	},
	{
		id: 'E3', label: 'E3 · Bậc ngập nước', trigger: { x: 9.6, z: 3.2, r: 2.6, rooms: ['flood'] },
		cues: [{ x: 13.3, z: 4.6, delay: 0 }, { x: 14.6, z: 4.6, delay: 0.4 }], spawnAfter: 1.3,
		spawn: [{ type: 'spider', name: 'Mortar-Rat', mlvl: 1, at: [[12.9, 3.0], [13.2, 4.2]] }, { type: 'zombie', name: 'Shambler', mlvl: 1, rise: true, at: [[14.7, 4.2]] }],
	},
];

/** Does the hero at world (x, z) fire this encounter? Inside the circle AND in one of its rooms (no triggering through a wall). */
export function triggerHit(enc, x, z) {
	const t = enc.trigger;
	return Math.hypot(x - t.x, z - t.z) < t.r && t.rooms.includes(roomAt(x, z));
}

// ---- lights --------------------------------------------------------------------------------------------------------------------------
export const LIGHTS = {
	spot: { x: FACE.apex.x, y: 2.0, z: FACE.apex.z + 0.3, tx: FACE.cx + 0.2, ty: 0.2, tz: FACE.south + 1.5 },
	lift: { x: FACE.apex.x, y: 1.5, z: FACE.apex.z + 0.9 },
	lantern: { x: GENNET.x, y: GENNET.y + 0.12, z: GENNET.z + 0.1 },
	spill: { x: 13.7, y: 2.2, z: -0.4 }, // about 1.3 m above tread 5 (0.9 m): not a hot spot on the stone
	cold: '#dce6f2', // the Wall's light, a proposal: ~8500 K cold white
	warm: '#e0a050', // Gennet's lantern (canon)
};
/** The Wall's slow shimmer (never a flicker): 1 ± 0.06 sin over 5.3 s + a slow noise. */
export const shimmer = (t) => 1 + 0.06 * Math.sin((2 * Math.PI * t) / 5.3) + 0.04 * (noise(t * 0.4, 3.3) - 0.5);

// ---- camera views and labels -----------------------------------------------------------------------------------------------------------
export const VIEWS = {
	overview: { label: 'Toàn cảnh', target: [-7.5, 0.2, -1.6], w: 50, d: 18 },
	face: { label: 'Mặt Tường (hốc sáng · bảng chữ · ghế)', target: [-23.3, 1.0, -6.3], dist: 9.5, pitch: 34 },
	passage: { label: 'Hành lang sọ', target: [-15.5, 0.5, 4.0], dist: 13, pitch: 46 },
	collapse: { label: 'Hốc sập + hốc gõ', target: [-2.2, 0.4, 2.4], dist: 14, pitch: 48 },
	flood: { label: 'Bậc ngập nước', target: [8.7, -0.1, 3.2], dist: 11, pitch: 46 },
	stair: { label: 'Cầu thang · đèn Gennet', target: [13.7, 2.4, -3.4], dist: 13, pitch: 38 },
};

export const SEGMENTS = [
	{ id: 'A', label: 'A · Mặt Tường', x: FACE.cx, z: FACE.cz - 2 },
	{ id: 'B', label: 'B · Hành lang sọ', x: -15.5, z: 4.2 },
	{ id: 'C', label: 'C · Hốc sập', x: -5.0, z: 3.9 },
	{ id: 'D1', label: 'D1 · Hốc gõ', x: 0.5, z: 0.5 },
	{ id: 'D2', label: 'D2 · Bậc ngập nước', x: 8.5, z: 3.2 },
	{ id: 'E', label: 'E · Cầu thang → nhà thờ', x: 13.7, z: -2.4 },
];

/** The whole map as plain data for the 2D plan (scripts/old-face-plan.py). */
export function planData() {
	const walls = wallModules().map((m) => ({ x: m.x, z: m.z, yaw: m.yaw, w: 4 * m.sx, tag: m.tag, tilt: m.tilt }));
	const grid = [];
	for (let z = -11; z < 8; z += 0.25) for (let x = -33; x < 18; x += 0.25) if (inside(x + 0.125, z + 0.125)) grid.push([x, z, +floorY(x + 0.125, z + 0.125).toFixed(2)]);
	return {
		face: FACE, spawn: SPAWN, hole: HOLE, door: DOOR, flood: FLOOD, level: LEVEL, stair: STAIR, collapse: COLLAPSE,
		rooms: ROOMS, cells: grid, walls, stone: STONE_RUNS, path: PATH, encounters: ENCOUNTERS, lights: LIGHTS, props: PROPS, obstacles: OBSTACLES,
		blockers: BLOCKERS, chair: CHAIR, shelf: WAX_SHELF, statue: STATUE, gennet: GENNET, sconces: sconces(), pinpoints: pinpoints(), knock: KNOCK, ratHoles: RAT_HOLES, warm: WARM_WALL,
		views: VIEWS, segments: SEGMENTS,
	};
}

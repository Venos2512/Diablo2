// ASHLAR · Dungeon (scene src/scenes/dungeon.js): the CPU side of the two areas, a CRYPT (BIO-08 Bell Catacombs + BIO-04 Old Face) and a CAVE (BIO-06 Flint Delvings).
// Pure maths, no THREE: layer lists, the ground masks (evaluated into each area's LayerSplat like the biome mix), the cave's outline / height / pond, the crypt's wall
// layout and the placement lists of the props. Coordinates are area-local metres (x east, z south = toward the default camera), centred on the area.
import { smoothParams } from './biomeMix.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smoothstep = (e0, e1, x) => {
	const t = clamp((x - e0) / (e1 - e0), 0, 1);
	return t * t * (3 - 2 * t);
};
const fract = (x) => x - Math.floor(x);

// ---- noise (the viewer's bmHash / bmNoise / bmFbm, as in env/biomeMix.js) ---------------------------------------------------------
function hash(x, y) {
	let px = fract(x * 123.34);
	let py = fract(y * 456.21);
	const d = px * (px + 45.32) + py * (py + 45.32);
	px += d;
	py += d;
	return fract(px * py);
}
export function noise(x, y) {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	let fx = x - ix;
	let fy = y - iy;
	fx = fx * fx * (3 - 2 * fx);
	fy = fy * fy * (3 - 2 * fy);
	const a = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * fx;
	const b = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * fx;
	return a + (b - a) * fy;
}
export function fbm(x, y, detail = 1) {
	let s = 0.5 * noise(x, y);
	x = x * 2.03 + 17.1;
	y = y * 2.03 + 9.2;
	s += 0.25 * noise(x, y);
	x = x * 2.03 + 17.1;
	y = y * 2.03 + 9.2;
	s += 0.125 * detail * noise(x, y);
	x = x * 2.03 + 17.1;
	y = y * 2.03 + 9.2;
	s += 0.0625 * detail * noise(x, y);
	return s / (0.75 + 0.1875 * detail);
}

/** Candle / fire flicker, the research report's 1/f mix: slow drift dominates, fast flicker is weak; ~1 ± 0.2, eased (never a strobe). */
export function flicker1f(t, seed = 0) {
	const n = (x) => noise(x, seed * 7.13 + 3.1) * 2 - 1;
	return 1 + 0.12 * n(t * 0.8) + 0.05 * n(t * 3.1 + 11) + 0.02 * n(t * 11 + 23);
}

// ---- layers ----------------------------------------------------------------------------------------------------------------------
/** Texture id (the layer library key) -> samples.json id prefix. BIO ids are biome-<id> (the biome mix's), DG_ ids the dungeon set's. */
const DG_FILES = { DG_crypt_dust: 'crypt-dust', DG_crypt_damp: 'crypt-damp', DG_crypt_rubble: 'crypt-rubble', DG_cave_floor: 'cave-floor', DG_cave_clay: 'cave-clay', DG_cave_rubble: 'cave-rubble', DG_cave_flowstone: 'cave-flowstone' };
export const textureId = (id) => (id.startsWith('DG_') ? `dungeon-${DG_FILES[id]}` : `biome-${id}`);

// How much a layer darkens / glosses when wet (damp stone and clay high, dry dust medium, flags and rock low).
const POROSITY = { DG_crypt_damp: 1, DG_crypt_dust: 0.8, DG_crypt_rubble: 0.6, DG_cave_clay: 1, DG_cave_floor: 0.7, DG_cave_rubble: 0.5, DG_cave_flowstone: 0.4, BIO04_ossuary: 0.9, BIO08_nave: 0.4, BIO27_vault: 0.45, BIO07_limestone: 0.3, BIO19_coastal_rock: 0.3, BIO12_dark_planks: 0.3, BIO06_flint_spoil: 0.45 };
export const porosity = (id) => POROSITY[id] ?? 0.5;
/** Anti-tiling off for the regular layers (flags, planks, blocks); everything else offsets + quarter turns. */
export const turnMode = (id) => (id === 'BIO08_nave' || id === 'BIO07_limestone' || id === 'BIO12_dark_planks' || id === 'BIO24_keystone' ? -1 : 1);

// layers bottom -> top (≤ 8): { id, tile (m per texture repeat) }; the masks below fill them in this order.
export const CRYPT_LAYERS = [
	{ id: 'BIO08_nave', tile: 4 }, // 0 flagstone floor
	{ id: 'BIO27_vault', tile: 4 }, // 1 dark ossuary stone toward the walls and corners
	{ id: 'DG_crypt_dust', tile: 3.5 }, // 2 dust drifts in the corners and along the walls
	{ id: 'DG_crypt_rubble', tile: 3.5 }, // 3 collapse round the broken columns
	{ id: 'BIO04_ossuary', tile: 3.5 }, // 4 bone-mortar inlay in front of the ossuary alcove
	{ id: 'BIO07_limestone', tile: 4 }, // 5 the worn, cleaner walkway
	{ id: 'DG_crypt_damp', tile: 3.5 }, // 6 the damp seep in the low corner
];
export const CAVE_LAYERS = [
	{ id: 'DG_cave_floor', tile: 4 }, // 0 chalk floor
	{ id: 'BIO06_flint_spoil', tile: 4 }, // 1 flint spoil patches
	{ id: 'DG_cave_rubble', tile: 3.5 }, // 2 flint rubble
	{ id: 'DG_cave_clay', tile: 3.5 }, // 3 wet clay in the hollows
	{ id: 'DG_cave_flowstone', tile: 3.5 }, // 4 flowstone round the pool
	{ id: 'BIO19_coastal_rock', tile: 4 }, // 5 dark rock band at the walls
	{ id: 'BIO12_dark_planks', tile: 3 }, // 6 the mine walkway
];

/** Every texture id the two areas use, for the layer library. */
export const layerIds = () => [...new Set([...CRYPT_LAYERS, ...CAVE_LAYERS].map((l) => l.id))];

// ---- the areas -------------------------------------------------------------------------------------------------------------------
export const AREAS = {
	crypt: { id: 'crypt', name: 'Hầm mộ (Bell Catacombs)', cx: -17, cz: 0, splat: 28, res: 320, layers: CRYPT_LAYERS, half: { x: 12, z: 8 } },
	cave: { id: 'cave', name: 'Hang động (Flint Delvings)', cx: 18, cz: 0, splat: 30, res: 360, layers: CAVE_LAYERS, rx: 12.5, rz: 9.5 },
};

// ---- crypt -----------------------------------------------------------------------------------------------------------------------
export const CRYPT = {
	hx: 12, // inner half width (x) of the chamber
	hz: 8, // inner half depth (z)
	corridor: { hx: 2, z0: 8, z1: 12 }, // the entrance: a 4 x 4 m corridor on the south side
	bell: { x: 0.6, z: -3.0 },
	columns: [{ x: 6.6, z: 0.2, r: 3.3 }, { x: -9.3, z: 4.0, r: 2.4 }],
	seep: { x: 9.3, z: 4.8, r: 3.6 },
	alcove: { x0: -5.5, x1: 5.5, z0: -8, z1: -4.6 },
	walkway: [[0, 14], [0.2, 9], [-0.5, 5], [0.9, 0.5], [0.6, -1.4]],
};

/** Distance to the nearest wall of the crypt (positive inside), for the chamber and its corridor. */
export function cryptWallDistance(x, z) {
	const main = Math.min(CRYPT.hx - Math.abs(x), CRYPT.hz - Math.abs(z));
	const c = CRYPT.corridor;
	const corridor = z > 0 ? Math.min(c.hx - Math.abs(x), c.z1 - z) : -9;
	return Math.max(main, corridor);
}

function walkwayDistance(path, x, z) {
	let best = 1e9;
	for (let i = 0; i + 1 < path.length; i++) {
		const [ax, az] = path[i];
		const [bx, bz] = path[i + 1];
		const dx = bx - ax;
		const dz = bz - az;
		const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
		best = Math.min(best, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
	}
	return best;
}

/** Wall modules of the crypt (4 m wide, 0.7 m thick, inner faces on the chamber's boundary): { x, z, yaw } with the module's front facing +z at yaw 0 (the room is inside). */
export function cryptWalls() {
	const out = [];
	const t = 0.35;
	for (const x of [-12, -8, -4, 4, 8, 12]) out.push({ x, z: CRYPT.hz + t, yaw: 0 }); // south: a 4 m gap at x in [-2, 2] is the corridor's mouth
	for (const x of [-12, -8, -4, 0, 4, 8, 12]) out.push({ x, z: -CRYPT.hz - t, yaw: Math.PI }); // north
	for (const z of [-6, -2, 2, 6]) {
		out.push({ x: CRYPT.hx + t, z, yaw: -Math.PI / 2 }); // east
		out.push({ x: -CRYPT.hx - t, z, yaw: Math.PI / 2 }); // west
	}
	const c = CRYPT.corridor;
	out.push({ x: c.hx + t, z: 10, yaw: -Math.PI / 2 }, { x: -c.hx - t, z: 10, yaw: Math.PI / 2 }); // the corridor's sides
	out.push({ x: 0, z: c.z1 + t, yaw: 0 }); // and its end
	return out;
}

/** Crypt ground masks: (x, z, out) with out[i] (i = 1..6) the coverage of layer i over the ones below, out[7] the wetness. `sp` = smoothParams(slider). */
export function makeCryptMasks(sp) {
	const k = 0.5 + (1.5 * sp.blurM) / 0.95; // transition widths follow the smoothness slider (0.6 crisp .. 2 very soft)
	const seep = CRYPT.seep;
	return (x, z, out) => {
		const d = cryptWallDistance(x, z);
		const n1 = fbm(x * 0.34 + 4.1, z * 0.34 + 1.7, sp.detail);
		const n2 = fbm(x * 0.21 + 11.3, z * 0.21 + 6.4, sp.detail);
		const nHi = fbm(x * 0.9 + 2.3, z * 0.9 + 8.8, sp.detail);
		const walk = 1 - smoothstep(0.7 * k, 1.9 * k, walkwayDistance(CRYPT.walkway, x, z) + (n1 - 0.5) * 0.9);
		// 1 dark vault stone: toward the walls and the corners, in blotches
		out[1] = clamp(0.9 * (1 - smoothstep(0.2, 2.3 * k, d + (n2 - 0.5) * 2.2)) + 0.45 * smoothstep(0.6, 0.85, n1) - 0.7 * walk, 0, 1);
		// 2 dust: drifts along the walls and into the corners; swept off the walkway
		const cx = Math.min(CRYPT.hx - Math.abs(x), 99);
		const cz = Math.min(CRYPT.hz - Math.abs(z), 99);
		const corner = 1 - smoothstep(0.3 * k, 4.2 * k, Math.hypot(cx, cz) - 0.5); // distance to the nearest inner corner (cx, cz = distances to its two walls)
		const wallDust = (1 - smoothstep(0.1, 2.4 * k, d)) * smoothstep(0.38, 0.62, nHi + (n2 - 0.5) * 0.4);
		out[2] = clamp(Math.max(corner * 0.85 * smoothstep(0.3, 0.55, n1 + 0.15), wallDust * 0.8) * (1 - 0.9 * walk), 0, 1);
		// 3 rubble: the collapse round the broken columns, a little at the bell
		let rub = 0;
		for (const c of CRYPT.columns) rub = Math.max(rub, 1 - smoothstep(c.r * 0.35, c.r + (n1 - 0.5) * 1.6, Math.hypot(x - c.x, z - c.z)));
		rub = Math.max(rub, 0.8 * (1 - smoothstep(0.6, 1.9, Math.hypot(x - CRYPT.bell.x, z - CRYPT.bell.z))));
		out[3] = clamp(rub * smoothstep(0.25, 0.5, nHi + 0.2), 0, 1);
		// 4 bone mortar: the inlay in front of the ossuary alcove (a soft rectangle) and a ring round the bell
		const a = CRYPT.alcove;
		const rect = smoothstep(0, 0.9 * k, x - a.x0) * smoothstep(0, 0.9 * k, a.x1 - x) * smoothstep(0, 0.9 * k, z - a.z0) * smoothstep(0, 1.2 * k, a.z1 - z);
		const ring = Math.abs(Math.hypot(x - CRYPT.bell.x, z - CRYPT.bell.z) - 2.9);
		out[4] = clamp(Math.max(rect * 0.85, (1 - smoothstep(0.2, 0.9 * k, ring)) * 0.55) * (0.55 + 0.45 * smoothstep(0.3, 0.6, n1)), 0, 1);
		// 5 the worn walkway: lighter, cleaner limestone, half covered so the flags still read through
		out[5] = clamp(walk * 0.62 * (0.7 + 0.3 * smoothstep(0.35, 0.65, nHi)), 0, 1);
		// 6 the damp seep: a dark wet corner
		const sr = Math.hypot(x - seep.x, z - seep.z) + (n1 - 0.5) * 1.5;
		out[6] = clamp(1 - smoothstep(seep.r * 0.3, seep.r * k * 0.72 + 0.6, sr), 0, 1);
		// wetness: the seep, a little damp along the walls (puddles only where the seep is wet enough)
		out[7] = clamp(0.95 * (1 - smoothstep(0.4, seep.r + 0.6, sr)) + 0.14 * (1 - smoothstep(0.2, 1.4, d)), 0, 1);
	};
}

// ---- cave ------------------------------------------------------------------------------------------------------------------------
export const CAVE = {
	pool: { x: -3.0, z: 2.4, rx: 3.5, rz: 2.6, wobble: 0.5, level: -0.28, depth: 0.62 },
	kiln: { x: 8.6, z: -4.6 }, // the glowing cracks at the east wall
	walkway: [[6.1, 9.4], [5.8, 5.0], [5.5, 0.6]], // north-south, so the boards (planks run along x) lie across it and the timber frames face the camera
	seed: 3.7,
};

/** Wall radius of the cave's outline at angle `a` (rad, from +x toward +z): an irregular ellipse. */
export function caveRadius(a) {
	const { rx, rz } = AREAS.cave;
	const re = (rx * rz) / Math.hypot(rz * Math.cos(a), rx * Math.sin(a));
	const bulge = (fbm(Math.cos(a) * 1.7 + 5.1, Math.sin(a) * 1.7 + 2.3, 1) - 0.5) * 0.36 + 0.06 * Math.sin(5 * a + 1.1) + 0.04 * Math.sin(9 * a);
	return re * (1 + bulge);
}
/** Normalised radius (1 = the wall) of a point and its angle. */
export function caveRho(x, z) {
	const a = Math.atan2(z, x);
	return { a, r: Math.hypot(x, z), R: caveRadius(a) };
}
/** Signed distance to the pond's shore in metres (negative inside), a wobbling ellipse. */
export function poolDistance(x, z) {
	const p = CAVE.pool;
	const wx = x + (fbm(x * 0.3 + CAVE.seed, z * 0.3 + CAVE.seed, 1) - 0.5) * p.wobble * 2;
	const wz = z + (fbm(x * 0.3 + CAVE.seed + 5.3, z * 0.3 + CAVE.seed + 5.3, 1) - 0.5) * p.wobble * 2;
	return (Math.hypot((wx - p.x) / p.rx, (wz - p.z) / p.rz) - 1) * Math.min(p.rx, p.rz);
}
/** Distance from the wall (positive inside) along the ray from the centre: close enough to the true distance for bands. */
export function caveWallDistance(x, z) {
	const { r, R } = caveRho(x, z);
	return R - r;
}
/** Ground height of the cave (m): gently rolling, a basin round the pool, rising toward the walls. */
export function caveHeight(x, z) {
	const { r, R } = caveRho(x, z);
	const roll = (fbm(x * 0.22 + 3.3, z * 0.22 + 8.1, 1) - 0.5) * 0.34;
	const basin = -CAVE.pool.depth * (1 - smoothstep(-1.6, 3.2, poolDistance(x, z)));
	const rise = 0.55 * smoothstep(1.8, 0.0, R - r) * smoothstep(0.0, 1.0, (fbm(x * 0.5 + 1.1, z * 0.5 + 4.4, 1) + 0.5));
	// flat under the walkway
	const wd = walkwayDistance(CAVE.walkway, x, z);
	const flat = 1 - smoothstep(0.9, 2.2, wd);
	return lerp(roll + basin + rise, 0.0 + basin * 0.0, flat * 0.85);
}
export const caveWallHeight = (a) => 2.65 + 0.85 * (fbm(Math.cos(a) * 1.3 + 7.7, Math.sin(a) * 1.3 + 1.9, 1));

/** Cave ground masks (same contract as makeCryptMasks). */
export function makeCaveMasks(sp) {
	const k = 0.5 + (1.5 * sp.blurM) / 0.95;
	return (x, z, out) => {
		const { r, R } = caveRho(x, z);
		const d = R - r;
		const pd = poolDistance(x, z);
		const n1 = fbm(x * 0.3 + 9.1, z * 0.3 + 2.7, sp.detail);
		const n2 = fbm(x * 0.2 + 1.9, z * 0.2 + 13.2, sp.detail);
		const nHi = fbm(x * 0.8 + 6.3, z * 0.8 + 3.9, sp.detail);
		const walk = 1 - smoothstep(0.55, 0.95 + 0.2 * k, walkwayDistance(CAVE.walkway, x, z));
		// 1 flint spoil patches
		out[1] = clamp(smoothstep(0.5 - 0.1 * k, 0.5 + 0.1 * k, n1 * 0.7 + n2 * 0.3 + 0.0) * (1 - walk), 0, 1);
		// 2 flint rubble: toward the walls and on the spoil
		out[2] = clamp((0.75 * (1 - smoothstep(1.0, 5.5 * k, d)) * smoothstep(0.35, 0.6, nHi) + 0.3 * smoothstep(0.62, 0.8, n2)) * (1 - walk), 0, 1);
		// 3 wet clay: the hollows (low-lying noise) and the pool's near bank
		const hollow = 1 - smoothstep(0.36, 0.52, n2 * 0.6 + n1 * 0.4);
		out[3] = clamp(Math.max(hollow * 0.9, 1 - smoothstep(0.2, 2.4 * k, pd)) * (1 - 0.8 * walk), 0, 1);
		// 4 flowstone: a ring of it round the pool, fingers of it in the south-west
		out[4] = clamp((1 - smoothstep(0.0, 1.0 * k, Math.abs(pd - 0.9))) * 0.9 * smoothstep(0.3, 0.55, nHi + 0.15) + 0.5 * smoothstep(0.7, 0.85, n1) * (1 - smoothstep(0, 5, pd)), 0, 1);
		// 5 the dark rock band at the walls
		out[5] = clamp(1 - smoothstep(0.5, 2.1 * k, d + (nHi - 0.5) * 1.1), 0, 1);
		// 6 the plank walkway: manufactured, so its edges stay sharp
		out[6] = clamp(walk >= 0.5 ? 1 : smoothstep(0.0, 0.5, walk) * 2, 0, 1) * smoothstep(0.35, 0.5, walk);
		// wetness: the pool's bank, hollows, a little along the walls
		out[7] = clamp(0.95 * (1 - smoothstep(0.2, 3.2, pd)) + 0.16 * hollow * (1 - smoothstep(1, 6, pd)) + 0.08 * (1 - smoothstep(0.2, 1.4, d)), 0, 1);
	};
}

export { smoothParams };

// ---- the props -------------------------------------------------------------------------------------------------------------------
/** GLB sample ids (assets/terrain-biomes/dungeon-prop-*.glb, real size, pivot at the bottom centre). */
export const PROP_IDS = {
	sarcophagus: 'dungeon-prop-sarcophagus', bonePile: 'dungeon-prop-bone-pile', column: 'dungeon-prop-broken-column', candles: 'dungeon-prop-candle-cluster', bell: 'dungeon-prop-fallen-bell',
	wall: 'dungeon-prop-crypt-wall', stalagmites: 'dungeon-prop-stalagmites', timber: 'dungeon-prop-mine-timber', boulders: 'dungeon-prop-flint-boulders',
};

/** Crypt props: area-local x, z, yaw (rad), scale (the GLBs are at real size). `light` marks the clusters that carry a flame + a point light. */
export const CRYPT_PROPS = [
	{ kind: 'bell', x: CRYPT.bell.x, z: CRYPT.bell.z, yaw: 0.55, scale: 1.0 },
	{ kind: 'sarcophagus', x: -7.6, z: -4.9, yaw: 0.12, scale: 1.0, hero: true },
	{ kind: 'sarcophagus', x: 7.5, z: -5.3, yaw: -0.18, scale: 0.9 },
	{ kind: 'sarcophagus', x: 8.8, z: 1.9, yaw: Math.PI / 2 + 0.1, scale: 0.85 },
	{ kind: 'column', x: 6.6, z: 0.2, yaw: 0.9, scale: 1.0 },
	{ kind: 'column', x: -9.3, z: 4.0, yaw: 2.4, scale: 0.9 },
	{ kind: 'candles', x: 2.9, z: -1.5, yaw: 0.4, scale: 0.9, light: true },
	{ kind: 'candles', x: -5.5, z: -3.4, yaw: 1.2, scale: 1.0, light: true },
	{ kind: 'candles', x: -10.7, z: 6.6, yaw: 0.2, scale: 0.9, light: true },
	{ kind: 'candles', x: 10.7, z: 6.9, yaw: 2.0, scale: 0.8, light: true },
	{ kind: 'candles', x: 10.8, z: -6.9, yaw: 3.0, scale: 1.0, light: true },
	{ kind: 'candles', x: -10.8, z: -6.7, yaw: 4.2, scale: 0.9, light: true },
	{ kind: 'bonePile', x: -10.9, z: -4.6, yaw: 0.6, scale: 1.0 },
	{ kind: 'bonePile', x: 10.9, z: 4.0, yaw: 3.6, scale: 0.9 },
	{ kind: 'bonePile', x: -3.6, z: -7.3, yaw: 0.1, scale: 0.8 },
	{ kind: 'bonePile', x: 4.6, z: -7.2, yaw: 5.0, scale: 0.9 },
	{ kind: 'bonePile', x: -9.6, z: 7.0, yaw: 2.2, scale: 0.7 },
];

/** Cave props by polar placement: angle a (rad), fraction of the wall radius f. */
export const CAVE_PROPS = [
	{ kind: 'stalagmites', a: 3.55, f: 0.84, yaw: 0.3, scale: 1.0 },
	{ kind: 'stalagmites', a: 4.1, f: 0.86, yaw: 2.0, scale: 0.8 },
	{ kind: 'stalagmites', a: 4.9, f: 0.87, yaw: 4.0, scale: 1.1 },
	{ kind: 'stalagmites', a: 2.75, f: 0.84, yaw: 1.2, scale: 0.7 },
	{ kind: 'stalagmites', a: 5.9, f: 0.82, yaw: 0.1, scale: 0.9 },
	{ kind: 'boulders', a: 3.9, f: 0.7, yaw: 0.2, scale: 0.9 },
	{ kind: 'boulders', a: 0.2, f: 0.8, yaw: 2.2, scale: 1.1 },
	{ kind: 'boulders', a: 2.2, f: 0.82, yaw: 4.4, scale: 0.8 },
	{ kind: 'boulders', a: 5.2, f: 0.74, yaw: 1.0, scale: 0.7 },
];
/** Mine timber frames over the walkway (local x, z): the frame spans the walkway (its width along x, facing +z), `torch` hangs a torch on it. */
export const CAVE_TIMBERS = [{ x: 5.95, z: 7.2, torch: false }, { x: 5.75, z: 4.1, torch: true }, { x: 5.55, z: 1.1, torch: false }];

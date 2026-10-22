// Ground surfaces for the character's environment interaction (footprints, water ripples, grass bend): what the hero is
// standing on at a world point, read from the data each scene already has - the splat weights (R wet, G grass), the layer
// weights of the N-layer terrain, the path / pond / creek geometry - never from names or one global guess.
// Pure maths (no THREE, no DOM): a scene supplies `surfaceAt(x, z, out)` on top of these helpers; character/footsteps.js
// consumes it. Precedence for every scene: water > path > mud (wet) > grass > soil; the layer-based scenes pick the dominant layer.

/** Visual / behavioural response per surface. print: dark footprint { alpha, life (s), scale, tint (linear rgb), lift (m, above the shell grass) } or null; wetPrint: what a hard surface keeps when wet. */
export const SURFACES = {
	none: { label: 'No ground', print: null, wetPrint: null, puff: null, soft: 0 },
	stone: { label: 'Stone', print: null, wetPrint: { alpha: 0.3, life: 2.4, scale: 1, tint: [0.012, 0.014, 0.017] }, puff: null, soft: 0 },
	wood: { label: 'Planks', print: null, wetPrint: { alpha: 0.3, life: 2.2, scale: 1, tint: [0.012, 0.01, 0.008] }, puff: null, soft: 0 },
	packed: { label: 'Packed earth', print: { alpha: 0.16, life: 7, scale: 0.95, tint: [0.02, 0.016, 0.012] }, wetPrint: null, puff: { count: 1, color: [0.2, 0.16, 0.11], size: 0.05, life: 0.5 }, soft: 0.25 },
	soil: { label: 'Soil', print: { alpha: 0.42, life: 24, scale: 1, tint: [0.014, 0.01, 0.007] }, wetPrint: null, puff: { count: 2, color: [0.2, 0.15, 0.1], size: 0.055, life: 0.55 }, soft: 0.6 },
	grass: { label: 'Grass', print: { alpha: 0.28, life: 9, scale: 1.05, tint: [0.012, 0.022, 0.008], lift: 0.05 }, wetPrint: null, puff: null, soft: 0.35 },
	mud: { label: 'Mud', print: { alpha: 0.66, life: 34, scale: 1.12, tint: [0.008, 0.006, 0.004] }, wetPrint: null, puff: { count: 3, color: [0.09, 0.07, 0.05], size: 0.05, life: 0.6 }, soft: 1 },
	sand: { label: 'Sand', print: { alpha: 0.38, life: 20, scale: 1.05, tint: [0.1, 0.08, 0.05] }, wetPrint: null, puff: { count: 3, color: [0.55, 0.47, 0.32], size: 0.06, life: 0.7 }, soft: 0.8 },
	snow: { label: 'Snow', print: { alpha: 0.5, life: 32, scale: 1.1, tint: [0.12, 0.15, 0.22] }, wetPrint: null, puff: { count: 4, color: [0.85, 0.9, 0.98], size: 0.06, life: 0.8 }, soft: 0.9 },
	dust: { label: 'Dust / ash', print: { alpha: 0.32, life: 14, scale: 1, tint: [0.02, 0.018, 0.016] }, wetPrint: null, puff: { count: 3, color: [0.4, 0.37, 0.33], size: 0.065, life: 0.8 }, soft: 0.55 },
	water: { label: 'Water', print: null, wetPrint: null, puff: null, soft: 0 },
};

/** Surface of a ground layer id (the biome mix / dungeon texture ids). { id, wet } - wet is the least wetness the layer itself implies. */
export const LAYER_SURFACE = {
	DW_dirt: { id: 'soil' },
	DW_mud: { id: 'mud' },
	DW_damp: { id: 'soil', wet: 0.55 },
	DW_grass: { id: 'grass' },
	DW_dense: { id: 'grass' },
	DW_sparse: { id: 'grass' },
	DW_water: { id: 'mud', wet: 0.9 },
	BIO01_peat: { id: 'soil', wet: 0.4 },
	BIO02_meadow: { id: 'grass' },
	BIO03_flint: { id: 'stone' },
	BIO04_garden: { id: 'soil' },
	BIO04_ossuary: { id: 'stone' },
	BIO05_lime: { id: 'stone' },
	BIO06_flint_spoil: { id: 'packed' },
	BIO06_salt_mine: { id: 'packed' },
	BIO07_limestone: { id: 'stone' },
	BIO08_nave: { id: 'stone' },
	BIO09_ash_snow: { id: 'snow' },
	BIO10_salt_crust: { id: 'packed' },
	BIO11_white_hulk: { id: 'stone' },
	BIO12_dark_planks: { id: 'wood' },
	BIO13_salt_glass: { id: 'stone' },
	BIO14_blue_ice: { id: 'stone' },
	BIO15_pyre_ash: { id: 'dust' },
	BIO16_blackwood: { id: 'wood' },
	BIO17_varnished: { id: 'wood' },
	BIO18_wet_slate: { id: 'stone', wet: 0.6 },
	BIO19_coastal_rock: { id: 'stone' },
	BIO20_wet_sand: { id: 'sand', wet: 0.7 },
	BIO21_sunken_floor: { id: 'stone', wet: 0.5 },
	BIO22_abbey: { id: 'stone' },
	BIO23_course: { id: 'stone' },
	BIO24_keystone: { id: 'stone' },
	BIO26_dream: { id: 'stone' },
	BIO27_cradle: { id: 'stone' },
	BIO27_vault: { id: 'stone' },
	BIO27_salt: { id: 'stone' },
	BIO27_deep: { id: 'stone' },
	DG_crypt_dust: { id: 'dust' },
	DG_crypt_damp: { id: 'stone', wet: 0.7 },
	DG_crypt_rubble: { id: 'stone' },
	DG_cave_floor: { id: 'dust' },
	DG_cave_clay: { id: 'mud' },
	DG_cave_rubble: { id: 'stone' },
	DG_cave_flowstone: { id: 'stone', wet: 0.35 },
};

/** Layers whose surface is living ground cover (they bend grass, and the hero's weight just flattens them). */
const GRASSY = new Set(['DW_grass', 'DW_dense', 'DW_sparse', 'BIO02_meadow']);

// Thresholds of the splat classifier (G = grass, R = wet): where the mud begins, where the turf does.
export const MUD_WET = 0.6;
export const GRASS_COVER = 0.42;
export const WATER_MIN_DEPTH = 0.03;

export const newSample = () => ({ id: 'none', wet: 0, grass: 0, soft: 0, water: false, waterDepth: 0, waterLevel: 0, path: false });

export function resetSample(out) {
	out.id = 'none';
	out.wet = 0;
	out.grass = 0;
	out.soft = 0;
	out.water = false;
	out.waterDepth = 0;
	out.waterLevel = 0;
	out.path = false;
	return out;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Open water at this point: the surface becomes 'water' whatever lies below (the bed is never marked). depth in metres, level = world y of the water surface. */
export function applyWater(out, depth, level) {
	if (!(depth > WATER_MIN_DEPTH)) return out;
	out.water = true;
	out.waterDepth = depth;
	out.waterLevel = level;
	out.id = 'water';
	out.soft = 0;
	return out;
}

/**
 * Splat-painted ground (TerrainScene: R wet, G grass). `path` = { amount (0..1), surface } where a path covers the point; it beats mud and grass
 * (a worn road stays a road when the splat says wet), and wetness is kept so a wet cobble still leaves a short wet print.
 */
export function classifySplat(out, splat, path = null) {
	resetSample(out);
	const wet = clamp01(splat.wet ?? 0);
	const grass = clamp01(splat.grass ?? 0);
	out.wet = wet;
	out.grass = grass;
	if (path && path.amount >= 0.5) {
		out.id = path.surface || 'packed';
		out.path = true;
	} else if (wet >= MUD_WET) out.id = 'mud';
	else if (grass >= GRASS_COVER) out.id = 'grass';
	else out.id = 'soil';
	out.soft = SURFACES[out.id].soft;
	return out;
}

/**
 * Dominant layer of a weight list (final weights of the N-layer terrain, sum 1): keys[i] <-> weights[i]. The id is the heaviest layer's; softness, grass
 * cover and wetness are blends, so a print fades in across a soft border instead of jumping. `wetness` = the splat's wetness channel.
 */
export function classifyLayers(out, keys, weights, wetness = 0, table = LAYER_SURFACE) {
	resetSample(out);
	let best = -1;
	let bestW = -1;
	let soft = 0;
	let grass = 0;
	let wetLayer = 0;
	let total = 0;
	for (let i = 0; i < keys.length; i++) {
		const w = weights[i];
		if (!(w > 0)) continue;
		const entry = table[keys[i]];
		total += w;
		soft += w * SURFACES[entry?.id ?? 'stone'].soft;
		if (GRASSY.has(keys[i])) grass += w;
		wetLayer += w * (entry?.wet ?? 0);
		if (w > bestW) {
			bestW = w;
			best = i;
		}
	}
	if (best < 0) return out; // no weight at all: 'none'
	const inv = total > 0 ? 1 / total : 1;
	const entry = table[keys[best]];
	out.id = entry?.id ?? 'stone';
	out.soft = soft * inv;
	out.grass = grass * inv;
	out.wet = clamp01(Math.max(wetness, wetLayer * inv));
	return out;
}

// ---- layer weights from a LayerSplat (the same maths the tufts / decals use: the GPU's own blend) ------------------------------------

const scratchOut = new Float32Array(8);
const scratchMask = new Float32Array(8);
const scratchWeights = new Float32Array(8);

/**
 * Final layer weights at world xz from a LayerSplat-like { sample(x, z, out) } (out[0..6] = layers 1..7, out[7] = wetness): masks through `shaderMask`
 * (the effect's coverage of an upper layer), stacked bottom -> top by `finalWeights` (both from env/biomeMix.js, passed in so this stays dependency-free).
 * Returns the wetness; the weights are in `weights` (length >= n).
 */
export function layerWeightsAt(splat, n, x, z, shaderMask, finalWeights, sp, weights = scratchWeights) {
	splat.sample(x, z, scratchOut);
	scratchMask[0] = 1;
	for (let k = 1; k < n; k++) scratchMask[k] = shaderMask(scratchOut[k - 1], sp);
	finalWeights(scratchMask, n, weights);
	return scratchOut[7];
}

// ---- scene adapters (pure, tested with fakes) ---------------------------------------------------------------------------------------

/** Index of the patch whose square contains (x, z), or -1 (the gaps between the biome mix's patches are not ground). patches: [{ c: { x, z, size } }]. */
export function patchAt(patches, x, z) {
	for (let i = 0; i < patches.length; i++) {
		const c = patches[i].c;
		const h = c.size / 2;
		if (x >= c.x - h && x <= c.x + h && z >= c.z - h && z <= c.z + h) return i;
	}
	return -1;
}

/**
 * Biome mix: the patch under (x, z), its layer weights from its own splat, the pond's water if it has one. deps = { shaderMask, finalWeights, pondDistance,
 * groundHeight } from env/biomeMix.js. A point outside every patch stays 'none'.
 */
export function biomeMixSurface(out, patches, sp, x, z, deps) {
	resetSample(out);
	const k = patchAt(patches, x, z);
	if (k < 0) return out;
	const p = patches[k];
	const n = p.sample.layers.length;
	const lx = x - p.c.x;
	const lz = z - p.c.z;
	const wetness = layerWeightsAt(p.splat, n, x, z, deps.shaderMask, deps.finalWeights, sp);
	const keys = p.keys ?? (p.keys = p.sample.layers.map((l) => l.id));
	classifyLayers(out, keys, scratchWeights, wetness);
	if (p.sample.pond && p.sample.water) {
		const inside = deps.pondDistance(p.sample.pond, p.sample.seed, lx, lz) < 0;
		if (inside) applyWater(out, p.sample.water.level - deps.groundHeight(p.sample, lx, lz), p.sample.water.level);
	}
	return out;
}

/**
 * Dungeon: the crypt or the cave whose outline contains (x, z) (area-local metres via the area's centre), its layer weights from its splat, the cave's pool.
 * areas: [{ kind, def: { cx, cz, layers: [{ id }] }, splat }]; deps = { shaderMask, finalWeights, inside(kind, lx, lz), poolDistance(lx, lz), poolLevel, groundHeight(kind, lx, lz) }.
 */
export function dungeonSurface(out, areas, sp, x, z, deps) {
	resetSample(out);
	for (const area of areas) {
		const lx = x - area.def.cx;
		const lz = z - area.def.cz;
		if (!deps.inside(area.kind, lx, lz)) continue;
		const n = area.def.layers.length;
		const wetness = layerWeightsAt(area.splat, n, x, z, deps.shaderMask, deps.finalWeights, sp);
		const keys = area.keys ?? (area.keys = area.def.layers.map((l) => l.id));
		classifyLayers(out, keys, scratchWeights, wetness);
		if (area.kind === 'cave' && deps.poolDistance(lx, lz) < 0) applyWater(out, deps.poolLevel - deps.groundHeight('cave', lx, lz), deps.poolLevel);
		return out;
	}
	return out;
}

/** Distance from (x, z) to the polyline `points` ([{ x, z }]). */
export function polylineDistance(points, x, z) {
	let best = Infinity;
	for (let i = 1; i < points.length; i++) {
		const a = points[i - 1];
		const b = points[i];
		const dx = b.x - a.x;
		const dz = b.z - a.z;
		const t = Math.min(1, Math.max(0, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
		best = Math.min(best, Math.hypot(x - a.x - t * dx, z - a.z - t * dz));
	}
	return best;
}

/** Coverage of a point by the paths of a plan: { amount 1, surface } when it lies within half a path's width, else amount 0. paths: [{ points, width, surface }]. */
export function pathCoverage(paths, x, z, out = { amount: 0, surface: 'packed' }) {
	out.amount = 0;
	for (const p of paths) {
		if (polylineDistance(p.points, x, z) <= p.width / 2) {
			out.amount = 1;
			out.surface = p.surface || 'packed';
			break;
		}
	}
	return out;
}

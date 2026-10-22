// ASHLAR · Biome mix (scene src/scenes/biomeMix.js): the sample patches and the CPU side of their blends.
// A sample = an N-layer list (bottom → top, up to 8) shown by the lab's N-layer terrain effect (createTerrainLayers: texture arrays, a 2-texture
// splat of 7 layer weights + wetness, per-layer tile / normal strength / anti-tiling mode). The masks of the standalone viewer
// (ashlar/art/terrain-biomes-v1/biome_mix: roles base / patch / path / low / cell, defined in METRES in a patch-centred frame) are evaluated on
// the CPU into the patch's splat; the effect's softness / height blend / edge noise do the rest. Textures: assets/terrain-biomes/
// (scripts/prepare-terrain-biomes-v1.py). The natural sample adds a pond: shore bands, wet ground, puddles and a water surface mesh.
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};
const fract = (x) => x - Math.floor(x);

export const PATCH = 14; // m, the side of a small sample patch
export const NATURAL_SIZE = 30; // m, the natural sample
export const GAP = 2.4; // m between patches
export const COLS = 5;
export const MAX_LAYERS = 8;
export const DW_GRASS = 'DW_grass'; // the Dark Wood grass layer

// Dark Wood natural set (assets/terrain-biomes/biome-darkwood-<file>…)
const DW_FILES = { DW_dirt: 'dirt', DW_mud: 'mud', DW_grass: 'grass', DW_dense: 'grass-dense', DW_sparse: 'grass-sparse', DW_damp: 'soil-damp', DW_water: 'water' };
/** Texture ids of assets/terrain-biomes (samples.json): `<id>` albedo, `-h` height, `-n` normal, `-r` roughness. */
export const textureId = (id) => (id.startsWith('DW_') ? `biome-darkwood-${DW_FILES[id]}` : `biome-${id}`);

// Maps with a mean normal tilt of about 15 deg or more (normal_metadata.json: BIO09 22.6, BIO23 15.8, BIO14 15.6, BIO21 15.1, and BIO26 14.8, which the brief listed
// with them): lower normal strength.
const HIGH_TILT = new Set(['BIO09_ash_snow', 'BIO14_blue_ice', 'BIO21_sunken_floor', 'BIO23_course', 'BIO26_dream']);
export const normalScale = (id) => (HIGH_TILT.has(id) ? 0.7 : 1);
// Anti-tiling mode per layer (the effect's turn mode): planks and regular blocks -1 (plain repeat), the ice's diagonal streaks 2 (half turns),
// wet sand 0 (offsets only), everything else 1 (offsets + quarter turns).
const NO_BREAKUP = new Set(['BIO07_limestone', 'BIO08_nave', 'BIO12_dark_planks', 'BIO16_blackwood', 'BIO17_varnished', 'BIO22_abbey', 'BIO24_keystone']);
export const turnMode = (id) => (NO_BREAKUP.has(id) ? -1 : id === 'BIO14_blue_ice' ? 2 : id === 'BIO20_wet_sand' ? 0 : 1);

// How much a layer darkens and glosses when wet (soil and mud high, grass medium, stone, planks, snow, ice low).
const POROSITY = { DW_mud: 1, DW_damp: 1, DW_dirt: 0.9, DW_sparse: 0.75, DW_grass: 0.55, DW_dense: 0.5, BIO01_peat: 1, BIO04_garden: 0.9, BIO02_meadow: 0.6, BIO20_wet_sand: 0.9, BIO15_pyre_ash: 0.8,
	BIO09_ash_snow: 0.25, BIO14_blue_ice: 0.2, BIO12_dark_planks: 0.3, BIO16_blackwood: 0.3, BIO17_varnished: 0.2, BIO07_limestone: 0.3, BIO08_nave: 0.3, BIO22_abbey: 0.3, BIO24_keystone: 0.3 };
export const porosity = (id) => POROSITY[id] ?? 0.45;

const CRISP_SOFT = { patch: 0.07, low: 0.07, path: 0.42, cell: 0.6 };
const L = (id, role, o = {}) => ({ id, role, tile: id.startsWith('DW_') ? 3.2 : 5, coverage: 0.5, width: 2.6, ...o });
const S = (id, name, layers, o = {}) => ({ id, name, layers, noise: 0.375, seed: 0, size: PATCH, ...o });

/**
 * Roles (per layer): base (everywhere) | patch (warped fBm blobs, `coverage`) | path (band, `width` m) | low (hollows) | cell (Voronoi region; a sample whose
 * layers are all cells) | shore (only the `band`). Any layer may carry `band: [from, to, soft]`: it is kept to that range of the distance to the pond (m,
 * negative inside) — a patch with a band is a patch only there. `sample.pond` = { x, z, rx, rz, wobble } (the natural sample).
 */
export const SAMPLES = [
	S('natural', 'Đồng cỏ & bờ nước', [
		L('DW_dirt', 'base', { tile: 3 }),
		L('DW_sparse', 'patch', { tile: 3, coverage: 0.74 }), // cỏ thưa over most of the dirt
		L('DW_grass', 'patch', { tile: 3, coverage: 0.52, band: [8, 99, 2.5] }), // cỏ
		L('DW_dense', 'patch', { tile: 3, coverage: 0.34, band: [12, 99, 2.8] }), // cỏ dày, further out
		L('DW_dirt', 'path', { tile: 3, width: 2.3 }), // trodden path
		L('DW_damp', 'shore', { tile: 3, band: [-99, 5.4, 2.2] }), // đất ẩm gần nước
		L('DW_mud', 'shore', { tile: 3, band: [-99, 2.6, 1.2] }), // bùn quanh ao (nền vũng nước)
	], { size: NATURAL_SIZE, seed: 21.4, noise: 0.3, pond: { x: -5.5, z: -4, rx: 5.4, rz: 3.9, wobble: 1.5 }, water: { level: -0.2, depth: 0.55 }, wet: { from: 1.2, to: 7.5, blobs: 0.1 } }),
	S('marsh_village', 'Đầm lầy & làng đá lửa', [L('BIO01_peat', 'base'), L('BIO02_meadow', 'patch', { coverage: 0.4 }), L('BIO03_flint', 'path', { width: 3.1 })], { seed: 1.7 }),
	S('moor_dw', 'Đồng hoang · cỏ Dark Wood', [L('BIO01_peat', 'base'), L(DW_GRASS, 'patch', { coverage: 0.55 }), L('BIO03_flint', 'path', { width: 2.6 })], { seed: 3.1 }),
	S('meadow_dw', 'Đồng cỏ BIO02 + cỏ Dark Wood', [L('BIO02_meadow', 'base'), L(DW_GRASS, 'patch', { coverage: 0.5 }), L('BIO01_peat', 'low', { coverage: 0.38 })], { seed: 14.2 }),
	S('garden_dw', 'Vườn xương & cỏ Dark Wood', [L('BIO04_garden', 'base'), L(DW_GRASS, 'patch', { coverage: 0.5 }), L('BIO04_ossuary', 'path', { width: 2.8 })], { seed: 6.6 }),
	S('ossuary_garden', 'Hầm xương & vườn đất', [L('BIO04_garden', 'base'), L('BIO01_peat', 'low', { coverage: 0.5 }), L('BIO04_ossuary', 'patch', { coverage: 0.45 })], { seed: 5.3 }),
	S('salt_mine', 'Mỏ muối & spoil', [L('BIO06_flint_spoil', 'base'), L('BIO06_salt_mine', 'patch', { coverage: 0.5 }), L('BIO10_salt_crust', 'path', { width: 2.4 })], { seed: 9.1 }),
	S('cathedral', 'Nhà thờ & thành đá vôi', [L('BIO08_nave', 'base'), L('BIO07_limestone', 'patch', { coverage: 0.5 }), L('BIO05_lime', 'path', { width: 2.9 })], { seed: 13.9 }),
	S('ash_pass', 'Đèo tuyết tro & băng', [L('BIO09_ash_snow', 'base'), L('BIO15_pyre_ash', 'patch', { coverage: 0.48 }), L('BIO14_blue_ice', 'low', { coverage: 0.45 })], { seed: 2.9 }),
	S('white_hulk', 'Hulk trắng', [L('BIO11_white_hulk', 'base'), L('BIO13_salt_glass', 'patch', { coverage: 0.5 }), L('BIO12_dark_planks', 'path', { width: 2.6, tile: 4 })], { seed: 7.7 }),
	S('vesnagrad', 'Vesnagrad & phòng ướp', [L('BIO16_blackwood', 'base', { tile: 4 }), L('BIO17_varnished', 'path', { width: 4.8, tile: 4 }), L('BIO14_blue_ice', 'patch', { coverage: 0.28 })], { seed: 11.3 }),
	S('harbour', 'Cảng Wrackhaven', [L('BIO19_coastal_rock', 'base'), L('BIO20_wet_sand', 'low', { coverage: 0.55 }), L('BIO18_wet_slate', 'path', { width: 2.9 })], { seed: 4.1 }),
	S('tidal_abbey', 'Tu viện thủy triều & tàu chìm', [L('BIO22_abbey', 'base'), L('BIO21_sunken_floor', 'low', { coverage: 0.5 }), L('BIO20_wet_sand', 'patch', { coverage: 0.4 })], { seed: 8.3 }),
	S('the_course', 'The Course & cổng keystone', [L('BIO23_course', 'base'), L('BIO24_keystone', 'path', { width: 6.6, soft: 0.36 })], { seed: 3.3 }),
	S('edda_dream', 'Mộng Edda', [L('BIO26_dream', 'base'), L('BIO27_cradle', 'path', { width: 3.6 })], { seed: 6.1 }),
	S('cell_perfection', 'Cell Perfection', [L('BIO27_cradle', 'cell'), L('BIO27_vault', 'cell'), L('BIO27_salt', 'cell'), L('BIO27_deep', 'cell')], { seed: 10.7 }),
];

/** Every texture id the samples use as a ground layer (the Dark Wood ones included), for the layer library and the coverage check. */
export const layerIds = () => [...new Set(SAMPLES.flatMap((s) => s.layers.map((l) => l.id)))];

// ---- layout: the natural sample on top, the small patches in a 5-column grid below, all centred on the origin ------------------------
const SMALL = SAMPLES.filter((s) => s.size === PATCH);
const ROWS = Math.ceil(SMALL.length / COLS);
const SMALL_W = COLS * PATCH + (COLS - 1) * GAP;
const SMALL_D = ROWS * PATCH + (ROWS - 1) * GAP;
export const GRID = { width: Math.max(SMALL_W, NATURAL_SIZE), depth: NATURAL_SIZE + GAP + SMALL_D };
const LAYOUT = SAMPLES.map((s) => {
	const top = -GRID.depth / 2;
	if (s.size === NATURAL_SIZE) return { x: 0, z: top + NATURAL_SIZE / 2, size: NATURAL_SIZE };
	const k = SMALL.indexOf(s);
	const row = Math.floor(k / COLS);
	return { x: ((k % COLS) - (COLS - 1) / 2) * (PATCH + GAP), z: top + NATURAL_SIZE + GAP + PATCH / 2 + row * (PATCH + GAP), size: PATCH };
});
/** Patch centre and side (m) of sample k. */
export const gridCell = (k) => LAYOUT[k];

/** The slider's default (BIOME_MIX_DEFAULTS.smooth in the scene). */
export const DEFAULT_SMOOTH = 0.8;

/**
 * Everything the smoothness slider (0 crisp … 1 very soft) drives: the mask shape on the CPU (softness of the ramps in metres / noise
 * units, fewer high octaves, less contrast, gentler domain warp and path edge noise, softer shore bands), the splat blur (in metres: a double box
 * blur, see LayerSplat.refresh) and the effect's own softness / height blend / edge noise (the height only leads the edge slightly when smooth).
 * 0 is the crisp end of rounds 1-8; the default and the top are wide, painterly cross-fades (see HUONG_DAN §7i for the measured widths).
 */
export function smoothParams(slider) {
	const v = slider <= DEFAULT_SMOOTH ? slider : DEFAULT_SMOOTH + (slider - DEFAULT_SMOOTH) * 0.6; // past the default the slider moves 60 % as fast: the top is wider, not a smear
	return {
		freq: lerp(1, 0.42, v), // scale of the patch / hollow blobs: the soft end makes them broader (cell size 1 / (noise * freq) m)
		detail: lerp(1, 0, v),
		contrast: lerp(2.1, 1.0, v),
		warpFreq: lerp(0.7, 0.35, v),
		edgeAmp: lerp(1.3, 0.18, v),
		edgeFreq: lerp(0.75, 0.31, v),
		warp: lerp(2.6, 2.1, v),
		soft: { patch: lerp(CRISP_SOFT.patch, 0.36, v), low: lerp(CRISP_SOFT.low, 0.36, v), path: lerp(CRISP_SOFT.path, 3.0, v), cell: lerp(CRISP_SOFT.cell, 3.3, v) },
		band: lerp(0.4, 1.7, v),
		blurM: lerp(0.09, 0.95, v), // splat blur radius (m, each side, two passes)
		blurWetM: Math.min(lerp(0.09, 0.95, v), 0.25), // the wetness channel keeps a narrow blur: the puddle field and its halo do not follow the slider
		softness: lerp(0.12, 0.49, v),
		heightBlend: lerp(0.7, 0.05, v),
		edgeNoise: lerp(0.5, 0.03, v),
	};
}

/** The effect's coverage of an upper layer from its splat weight (terrain_layers.glsl labTLMask with no height difference), for the CPU readers (tufts, decals, measurements). */
export function shaderMask(weight, sp) {
	const hb = sp.heightBlend;
	return smoothstep(0.5 - sp.softness, 0.5 + sp.softness, weight * (1 + 2 * hb) - hb);
}

// ---- noise (a port of the viewer's GLSL bmHash / bmNoise / bmFbm) --------------------------------------------------------------
function hash(x, y) {
	let px = fract(x * 123.34);
	let py = fract(y * 456.21);
	const d = px * (px + 45.32) + py * (py + 45.32);
	px += d;
	py += d;
	return fract(px * py);
}
function noise(x, y) {
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
function fbm(x, y, detail) {
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

const CELL_POINTS = [[-3.6, -1.2], [1.7, -3.8], [-1.4, 3.6], [3.7, 1.9]].map(([x, z]) => [x * (PATCH / 12), z * (PATCH / 12)]);

// ---- the pond --------------------------------------------------------------------------------------------------------------------------
/** Distance to the pond edge in metres (negative inside), a wobbling ellipse. Independent of the smoothness slider: the water mesh and the splat agree. */
export function pondDistance(pond, seed, x, z) {
	const wx = x + (fbm(x * 0.22 + seed, z * 0.22 + seed, 1) - 0.5) * pond.wobble * 2;
	const wz = z + (fbm(x * 0.22 + seed + 5.3, z * 0.22 + seed + 5.3, 1) - 0.5) * pond.wobble * 2;
	return (Math.hypot((wx - pond.x) / pond.rx, (wz - pond.z) / pond.rz) - 1) * Math.min(pond.rx, pond.rz);
}
/** Ground height (m, patch-local y) of a sample: flat, except the natural sample's basin round the pond. */
export function groundHeight(sample, x, z) {
	if (!sample.pond) return 0;
	return -sample.water.depth * (1 - smoothstep(-2.5, 3.5, pondDistance(sample.pond, sample.seed, x, z)));
}

/**
 * Masks of a sample: (x, z, out) in the patch-centred frame (m) → out[i] (i < layers) = the weight with which layer i covers the ones below it
 * (0..1, the base 1), out[layers] = wetness. Stacking is the effect's: bottom → top. The all-cell sample returns region weights converted to that.
 */
export function makeMasks(sample, sp) {
	const { seed, noise: nf, pond } = sample;
	const n = sample.layers.length;
	const layers = sample.layers.map((l, i) => {
		const target = sp.soft[l.role];
		// a layer's own `soft` is its crisp value: it follows the slider by the same ratio as the role default
		return { ...l, soft: target === undefined ? 0 : l.soft === undefined ? target : (l.soft * target) / CRISP_SOFT[l.role], seedI: seed + i * 7.31 };
	});
	const contrast = (v) => Math.min(1, Math.max(0, (v - 0.5) * sp.contrast + 0.5));
	const warped = (x, z) => [
		x + (fbm(x * nf * sp.warpFreq + 3.1, z * nf * sp.warpFreq + 3.1, sp.detail) - 0.5) * sp.warp,
		z + (fbm(x * nf * sp.warpFreq + 9.7, z * nf * sp.warpFreq + 9.7, sp.detail) - 0.5) * sp.warp,
	];
	const band = (l, d) => (l.band ? smoothstep(l.band[0] - l.band[2] * sp.band, l.band[0] + l.band[2] * sp.band, d) * (1 - smoothstep(l.band[1] - l.band[2] * sp.band, l.band[1] + l.band[2] * sp.band, d)) : 1);
	const mask = (l, x, z, wx, wz, d) => {
		const s = l.seedI;
		if (l.role === 'base') return 1;
		if (l.role === 'shore') return band(l, d);
		if (l.role === 'patch') {
			const v = contrast(fbm((wx * nf + s) * sp.freq, (wz * nf + s) * sp.freq, sp.detail));
			const t = 0.5 + (0.5 - l.coverage) * 0.262 * sp.contrast;
			return smoothstep(t - l.soft, t + l.soft, v) * band(l, d);
		}
		if (l.role === 'low') {
			const v = contrast(fbm((wx * nf + s) * 0.65 * sp.freq, (wz * nf + s) * 0.65 * sp.freq, sp.detail));
			const t = 0.5 - (0.5 - l.coverage) * 0.262 * sp.contrast;
			return (1 - smoothstep(t - l.soft, t + l.soft, v)) * band(l, d);
		}
		if (l.role === 'path') {
			const ang = (hash(s, 1.3) - 0.5) * 1.2;
			const ca = Math.cos(ang);
			const sa = Math.sin(ang);
			const rx = ca * x - sa * z;
			const rz = sa * x + ca * z;
			const c = 1.56 * Math.sin(rx * 0.433 + s) + 0.6 * Math.sin(rx * 0.94 + s * 2.1);
			const dd = Math.abs(rz - c) + (fbm(x * sp.edgeFreq + s, z * sp.edgeFreq + s, sp.detail) - 0.5) * sp.edgeAmp;
			return (1 - smoothstep(l.width * 0.5 - 0.5 * l.soft, l.width * 0.5 + l.soft, dd)) * band(l, d);
		}
		return 0;
	};
	if (layers.every((l) => l.role === 'cell')) {
		const soft = sp.soft.cell;
		return (x, z, out) => {
			const [wx, wz] = warped(x, z);
			const qx = x + (wx - x) * 2.2;
			const qz = z + (wz - z) * 2.2;
			const dist = CELL_POINTS.slice(0, n).map(([px, pz]) => Math.hypot(qx - px, qz - pz));
			const dmin = Math.min(...dist);
			const w = dist.map((v) => 1 - smoothstep(0, soft, v - dmin));
			let acc = 0;
			for (let i = 0; i < n; i++) {
				acc += w[i];
				out[i] = i ? w[i] / acc : 1; // what covers the layers below it: w_i / (w_0 + … + w_i)
			}
			out[n] = 0;
		};
	}
	const wetCfg = sample.wet;
	return (x, z, out) => {
		const [wx, wz] = warped(x, z);
		const d = pond ? pondDistance(pond, seed, x, z) : 0;
		for (let i = 0; i < n; i++) out[i] = mask(layers[i], x, z, wx, wz, d);
		let wet = 0;
		if (wetCfg) {
			wet = 1 - smoothstep(wetCfg.from, wetCfg.to, d);
			if (wetCfg.blobs) {
				const v = contrast(fbm(wx * nf * 0.9 + seed * 3, wz * nf * 0.9 + seed * 3, sp.detail));
				wet = Math.max(wet, 0.85 * smoothstep(1 - wetCfg.blobs - 0.06, 1 - wetCfg.blobs + 0.06, v));
			}
		}
		out[n] = wet;
	};
}

/** Final weight of every layer from its coverage masks: w_i = m_i · Π_{j>i} (1 − m_j). Writes into `out` (length ≥ n). */
export function finalWeights(masks, n, out) {
	let above = 1;
	for (let i = n - 1; i >= 0; i--) {
		out[i] = masks[i] * above;
		above *= 1 - masks[i];
	}
	return out;
}

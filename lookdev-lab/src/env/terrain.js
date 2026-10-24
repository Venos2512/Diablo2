// Terrain splat map: a world-space RGBA8 texture that says where the upper terrain layers cover the dry dirt
// base (R = wet dirt, G = grass, B = blood-soaked; A unused). Layers stack bottom to top — dirt → wet dirt → grass —
// so painting wet dirt also clears grass, and painting dirt clears everything. Blood (the Remnant corruption, e.g. the blood
// ground near the altar in Bố trí biome) tints whatever lies under it and kills grass. Shaded by the `terrain` surface patch
// (shaders/effects/terrain.glsl and its TSL twin), which blends the three forged layer sets by height.
import * as THREE from 'three';
import { noise2 } from './kit.js';
import { getForge } from './materials.js';

export const TERRAIN_LAYERS = ['moorDirt', 'moorMud', 'moorGrass'];
/**
 * Terrain texture sets. 'procedural' = forged recipes (src/shaders/forge/moor_*.glsl); 'painted' = swatches cut
 * from the moor concept sheet, 'tiles' = separate painted tiles (legacy/art-direction/reference/terrain-tiles), both made
 * tileable by scripts/prepare-terrain-swatches.py (albedo + height PNG per layer, files <prefix>-<layer>[-h].png).
 * low = height band [from, to] read as the wet layer's hollows (puddles: glossy).
 * tile = metres per repeat; water / waterRough = standing-water level in the wet layer's height and its roughness; tufts = 3D grass density factor,
 * tuftColor = per channel [base, + dry] (linear) so the tufts sit in the grass layer's palette.
 * variationScale / rotate = anti-tiling: breakup areas per metre (default 0.09) and quarter-turn variants (0/1).
 */
export const TERRAIN_SETS = {
	// Generated tiles after the D2R Blood Moor (legacy/art-direction/reference/terrain-moor, scripts/prepare-terrain-moor.py):
	// several grass patterns mixed in one 2 × 2 tile, dry dirt + sparse-grass transition, wet dirt; the road ruts
	// and the creek water are ribbon meshes along the scene's curves (ribbons: their texture prefix).
	moor: { label: 'D2R moor (generated: grass mix / ruts / creek)', prefix: 'terrain3', ribbons: 'terrain3', low: [0.12, 0.24], tiles: [3.5, 3.5, 7], water: 0.18, waterRough: 0.15, tufts: 0.35, tuftColor: [[0.035, 0.05], [0.07, 0.07], [0.018, 0.02]], relief: [3, 2.5, 6], cards: 'terrain3-grass-cards' },
	// Natural lush grass after a D2R gameplay screenshot (legacy/art-output/terrain-grass-d2r, scripts/prepare-terrain-meadow.py):
	// six grass patterns in four turns mixed into one 7 m tile, sparse grass + soil, damp ground; the moor's ruts,
	// creek and grass cards.
	meadow: { label: 'D2R lush grass (natural mix)', prefix: 'terrain4', ribbons: 'terrain3', cards: 'terrain3-grass-cards', variationScale: 0.2, rotate: 1, low: [0.12, 0.24], tiles: [7, 3.5, 7], water: 0.18, waterRough: 0.12, tufts: 0.35, tuftColor: [[0.028, 0.018], [0.041, 0.026], [0.006, 0.004]], relief: [3, 2.5, 4] },
	tiles: { label: 'Painted tiles (mud / grass / transition)', prefix: 'terrain2', low: [0.2, 0.3], tiles: [3.5, 4, 3], water: 0.26, waterRough: 0.22, tufts: 0.15, tuftColor: [[0.06, 0.1], [0.09, 0.08], [0.025, 0.03]] },
	painted: { label: 'Painted (concept swatches)', prefix: 'terrain', low: [0.08, 0.2], tiles: [3.2, 4, 3], water: 0.14, waterRough: 0.22, tufts: 0.15, tuftColor: [[0.07, 0.1], [0.1, 0.08], [0.025, 0.03]] },
	// Act I biomes after the colour script (art-direction Ch.11 §10): Codex-generated tiles in the moor tiles' style
	// (legacy/art-output/terrain-biomes, scripts/prepare-terrain-biomes.py), dirt = base ground, mud = wet ground, grass = cover.
	coldPlains: { label: 'Act I · Cold Plains', prefix: 'biome-cold-plains', variationScale: 0.3, rotate: 1, low: [0.1, 0.22], tiles: [3.5, 3.5, 3.5], water: 0.16, waterRough: 0.12, tufts: 0.3, tuftColor: [[0.056, 0.036], [0.056, 0.036], [0.038, 0.024]] },
	burialGrounds: { label: 'Act I · Burial Grounds', prefix: 'biome-burial-grounds', variationScale: 0.3, rotate: 1, low: [0.1, 0.22], tiles: [3.5, 3.5, 3.5], water: 0.16, waterRough: 0.1, tufts: 0.25, tuftColor: [[0.017, 0.011], [0.018, 0.011], [0.019, 0.012]] },
	stonyField: { label: 'Act I · Stony Field', prefix: 'biome-stony-field', variationScale: 0.3, rotate: 1, low: [0.1, 0.2], tiles: [3.5, 3.5, 3.5], water: 0.14, waterRough: 0.15, tufts: 0.2, tuftColor: [[0.057, 0.036], [0.037, 0.024], [0.016, 0.01]] },
	tristram: { label: 'Act I · Tristram (ash)', prefix: 'biome-tristram', variationScale: 0.3, rotate: 1, low: [0.1, 0.2], tiles: [3.5, 3.5, 3.5], water: 0.14, waterRough: 0.2, tufts: 0.15, tuftColor: [[0.017, 0.011], [0.014, 0.009], [0.01, 0.007]] },
	darkWood: { label: 'Act I · Dark Wood', prefix: 'biome-dark-wood', variationScale: 0.3, rotate: 1, low: [0.1, 0.22], tiles: [3.5, 3.5, 3.5], water: 0.16, waterRough: 0.1, tufts: 0.25, tuftColor: [[0.013, 0.008], [0.014, 0.009], [0.003, 0.002]] },
	blackMarsh: { label: 'Act I · Black Marsh', prefix: 'biome-black-marsh', variationScale: 0.3, rotate: 1, low: [0.12, 0.26], tiles: [3.5, 3.5, 3.5], water: 0.22, waterRough: 0.1, tufts: 0.35, tuftColor: [[0.022, 0.014], [0.021, 0.014], [0.007, 0.005]] },
	tamoeHighland: { label: 'Act I · Tamoe Highland', prefix: 'biome-tamoe-highland', variationScale: 0.3, rotate: 1, low: [0.1, 0.2], tiles: [3.5, 3.5, 3.5], water: 0.14, waterRough: 0.12, tufts: 0.25, tuftColor: [[0.05, 0.032], [0.038, 0.024], [0.021, 0.013]] },
	monastery: { label: 'Act I · Monastery courtyard (paving)', prefix: 'biome-monastery-courtyard', variationScale: 0.3, rotate: 1, low: [0.08, 0.18], tiles: [4.5, 4.5, 4.5], water: 0.12, waterRough: 0.08, tufts: 0.08, tuftColor: [[0.053, 0.034], [0.042, 0.027], [0.016, 0.01]] },
	cave: { label: 'Act I · Cave floor', prefix: 'biome-cave', variationScale: 0.3, rotate: 1, low: [0.08, 0.18], tiles: [3.5, 3.5, 3.5], water: 0.12, waterRough: 0.08, tufts: 0, tuftColor: [[0.031, 0.019], [0.022, 0.014], [0.014, 0.009]] },
	catacombs: { label: 'Act I · Catacombs (stone + blood)', prefix: 'biome-catacombs', variationScale: 0.3, rotate: 1, low: [0.08, 0.18], tiles: [4, 4, 4], water: 0.12, waterRough: 0.1, tufts: 0, tuftColor: [[0.021, 0.013], [0.005, 0.003], [0.002, 0.001]] },
	// Poly Haven photo scans (CC0, scripts/prepare-terrain-polyhaven.py): brown_mud_02 / brown_mud_03 / forrest_ground_01, albedo
	// matched per channel to the moor tiles' means (the raw scans are far lighter than the Act I palette).
	// pbr = the set also ships normal (-n) and roughness (-r) maps (loadPaintedSets loads them only for sets with shipNormals; the removed Relief scene was the one that used the others).
	polyhaven: { label: 'Poly Haven · đất / bùn / cỏ (ảnh quét, palette Act I)', prefix: 'ph-moor', pbr: true, variationScale: 0.3, rotate: 1, low: [0.2, 0.35], tiles: [1.6, 1.6, 2.5], water: 0.12, waterRough: 0.1, tufts: 0.3, tuftColor: [[0.035, 0.05], [0.07, 0.07], [0.018, 0.02]] },
	// Diablo Immortal's Dark Wood after a night screenshot (legacy/art-output/terrain-darkwood, scripts/prepare-terrain-darkwood.py): blue-grey
	// loam, wet ground, sparse wiry shade grass, a cobble path ribbon (ribbons: darkwood-ruts, no creek) and grass cards. shipNormals =
	// loadPaintedSets uses the set's own -n / -r maps instead of deriving them from the height (only this set opts in).
	darkWoodRef: { label: 'Act I · Dark Wood (realistic)', prefix: 'darkwood', ribbons: 'darkwood', creek: false, cards: 'darkwood-grass-cards', pbr: true, shipNormals: true, variationScale: 0.3, rotate: 1, low: [0.1, 0.22], tiles: [2.8, 2.8, 2.8], water: 0.16, waterRough: 0.1, tufts: 0, tuftColor: [[0.04, 0.026], [0.058, 0.036], [0.06, 0.038]] },
	// roadTile = the path as a tile that repeats in u and v (scripts/prepare-road-tile.py, 300 px per metre: the paving stones are ~0.55 m), laid
	// by DarkWoodScene.buildRibbons; the -ruts strip (ribbons) stays for the sets without one.
	// The same set repainted in a stylized, painterly look (ashlar/art/textures/terrain-dark-wood/stylized2, smoother heights, gentler normals).
	darkWoodStylized: { label: 'Act I · Dark Wood (stylized)', prefix: 'darkwood-sty', ribbons: 'darkwood-sty', roadTile: { id: 'darkwood-sty-cobble', pxPerM: 300 }, creek: false, cards: 'darkwood-sty-grass-cards', pbr: true, shipNormals: true, variationScale: 0.3, rotate: 1, low: [0.1, 0.22], tiles: [2.8, 2.8, 2.8], water: 0.16, waterRough: 0.1, tufts: 0, tuftColor: [[0.045, 0.029], [0.063, 0.040], [0.068, 0.043]] },
	// The stylized set recoloured greener (ashlar/art/textures/terrain-dark-wood/recolor_green.py, same strokes): the Diablo II mood's ground.
	darkWoodGreen: { label: 'Act I · Dark Wood (stylized, green)', prefix: 'darkwood-sty-green', ribbons: 'darkwood-sty-green', roadTile: { id: 'darkwood-sty-green-cobble', pxPerM: 300 }, creek: false, cards: 'darkwood-sty-green-grass-cards', pbr: true, shipNormals: true, variationScale: 0.3, rotate: 1, low: [0.1, 0.22], tiles: [2.8, 2.8, 2.8], water: 0.16, waterRough: 0.1, tufts: 0, tuftColor: [[0.046, 0.029], [0.067, 0.042], [0.029, 0.017]] },
	procedural: { label: 'Procedural (texture forge)', tiles: [3, 3.5, 2.5], water: 0.22, waterRough: 0.05, tufts: 1, tuftColor: [[0.04, 0.12], [0.05, 0.1], [0.025, 0.05]] },
};


/** Per painted layer: file suffix, roughness of the dry surface, of its lowest parts (puddles), normal strength. */
const PAINTED = [
	{ layer: 'dirt', label: 'dry dirt', rough: 0.9, lowRough: 0.75, relief: 3.0 },
	{ layer: 'mud', label: 'wet dirt', rough: 0.62, lowRough: 0.08, relief: 2.5 }, // the paintings already read wet: keep the sheen low
	{ layer: 'grass', label: 'grass', rough: 0.82, lowRough: 0.9, relief: 3.5 },
];

function layerTexture(data, size, name, colorSpace, anisotropy) {
	const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
	tex.name = name;
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.generateMipmaps = true;
	tex.minFilter = THREE.LinearMipmapLinearFilter;
	tex.magFilter = THREE.LinearFilter;
	tex.anisotropy = anisotropy;
	tex.colorSpace = colorSpace;
	tex.needsUpdate = true;
	return tex;
}

/**
 * Build forge-compatible sets ({ map, normalMap (height in alpha), ormMap, recipe }) from the painted
 * albedo + height images. Rows are flipped so the image top is v = 1, like an image texture.
 */
export async function loadPaintedSets(app, setId = 'painted') {
	app._paintedTerrainSets ??= {};
	if (app._paintedTerrainSets[setId]) return app._paintedTerrainSets[setId];
	const def = TERRAIN_SETS[setId];
	const anisotropy = Math.min(8, app.backend.caps.maxAnisotropy || 4);
	const sets = [];
	for (const [i, painted] of PAINTED.entries()) {
		const layer = { ...painted, relief: def.relief?.[i] ?? painted.relief, id: `${def.prefix}-${painted.layer}`, label: `${def.label.split(' (')[0]} · ${painted.label}` };
		const [albedo, heightImg] = await Promise.all([app.loader.loadImageData(layer.id), app.loader.loadImageData(layer.id + '-h')]);
		// shipNormals: the set's own normal (-n, OpenGL) and roughness (-r) maps replace the ones derived below; packed into the
		// same normalMap (height in alpha) and ormMap textures, so the terrain shader samples the same textures as before.
		const shipped = def.shipNormals ? await Promise.all([app.loader.loadImageData(layer.id + '-n'), app.loader.loadImageData(layer.id + '-r')]) : null;
		const size = albedo.width;
		const map = new Uint8Array(size * size * 4);
		const normal = new Uint8Array(size * size * 4);
		const orm = new Uint8Array(size * size * 4);
		const h = new Float32Array(size * size);
		for (let y = 0; y < size; y++) {
			const src = (size - 1 - y) * size;
			for (let x = 0; x < size; x++) {
				const o = (src + x) * 4;
				const d = (y * size + x) * 4;
				map[d] = albedo.data[o];
				map[d + 1] = albedo.data[o + 1];
				map[d + 2] = albedo.data[o + 2];
				map[d + 3] = 255;
				h[y * size + x] = heightImg.data[o] / 255;
			}
		}
		const at = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const d = (y * size + x) * 4;
				const v = at(x, y);
				const nx = -(at(x + 1, y) - at(x - 1, y)) * 0.5 * layer.relief;
				const ny = -(at(x, y + 1) - at(x, y - 1)) * 0.5 * layer.relief;
				const len = Math.hypot(nx, ny, 1);
				normal[d] = Math.round((nx / len * 0.5 + 0.5) * 255);
				normal[d + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);
				normal[d + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
				normal[d + 3] = Math.round(v * 255);
				const low = 1 - Math.min(1, Math.max(0, (v - def.low[0]) / (def.low[1] - def.low[0])));
				orm[d] = Math.round(Math.min(1, 0.55 + 0.6 * v) * 255);
				orm[d + 1] = Math.round((layer.rough + (layer.lowRough - layer.rough) * low) * 255);
				orm[d + 2] = 0;
				orm[d + 3] = 255;
				if (shipped) {
					const o = ((size - 1 - y) * size + x) * 4;
					normal[d] = shipped[0].data[o];
					normal[d + 1] = shipped[0].data[o + 1];
					normal[d + 2] = shipped[0].data[o + 2];
					orm[d + 1] = shipped[1].data[o];
				}
			}
		}
		sets.push({
			id: layer.id,
			recipe: { label: layer.label, tile: def.tiles[i] },
			map: layerTexture(map, size, layer.label + ' · map', THREE.SRGBColorSpace, anisotropy),
			normalMap: layerTexture(normal, size, layer.label + ' · normalMap', THREE.NoColorSpace, anisotropy),
			ormMap: layerTexture(orm, size, layer.label + ' · ormMap', THREE.NoColorSpace, anisotropy),
		});
	}
	app._paintedTerrainSets[setId] = sets;
	return sets;
}

/**
 * Ribbon textures of a set (road ruts RGBA + height, creek water): { ruts: { map, normalMap }, water: { map } }.
 * Height → tangent-space normal like the layers; rows flipped so v runs along the image from bottom to top.
 */
export async function loadRibbonTextures(app, prefix) {
	app._terrainRibbons ??= {};
	// What the ribbons of a prefix ship is a property of the set(s) using it (creek: false = no water texture, shipNormals = own
	// -ruts-n), never of the caller: the cache is per prefix, so caller options would hand a water-less result to the moor scenes.
	const owner = Object.values(TERRAIN_SETS).find((d) => d.ribbons === prefix) ?? {}; // the first set that uses the prefix: sets sharing one must agree on creek / shipNormals
	const withWater = owner.creek !== false;
	const shipNormals = !!owner.shipNormals;
	if (app._terrainRibbons[prefix]) return app._terrainRibbons[prefix];
	const anisotropy = Math.min(8, app.backend.caps.maxAnisotropy || 4);
	const read = async (id) => {
		const img = await app.loader.loadImageData(id);
		const { width: w, height: hgt } = img;
		const out = new Uint8Array(w * hgt * 4);
		for (let y = 0; y < hgt; y++) out.set(img.data.subarray((hgt - 1 - y) * w * 4, (hgt - y) * w * 4), y * w * 4);
		return { data: out, w, h: hgt };
	};
	const texture = ({ data, w, h }, name, colorSpace) => {
		const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
		Object.assign(tex, { name, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy, colorSpace, needsUpdate: true });
		return tex;
	};
	const ruts = await read(`${prefix}-ruts`);
	const height = await read(`${prefix}-ruts-h`);
	const { w, h } = height;
	const shipped = shipNormals ? await read(`${prefix}-ruts-n`) : null; // the set's own OpenGL normal (wraps along v)
	const normal = shipped ? shipped.data : new Uint8Array(w * h * 4);
	const at = (x, y) => height.data[(((y + h) % h) * w + Math.min(w - 1, Math.max(0, x))) * 4] / 255;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			if (shipped) {
				normal[(y * w + x) * 4 + 3] = 255;
				continue;
			}
			const nx = -(at(x + 1, y) - at(x - 1, y)) * 1.5;
			const ny = -(at(x, y + 1) - at(x, y - 1)) * 1.5;
			const len = Math.hypot(nx, ny, 1);
			const d = (y * w + x) * 4;
			normal[d] = Math.round((nx / len * 0.5 + 0.5) * 255);
			normal[d + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);
			normal[d + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
			normal[d + 3] = 255;
		}
	}
	const result = {
		ruts: { map: texture(ruts, 'Road ruts · map', THREE.SRGBColorSpace), normalMap: texture({ data: normal, w, h }, 'Road ruts · normalMap', THREE.NoColorSpace) },
	};
	if (!withWater) {
		app._terrainRibbons[prefix] = result; // sets without a creek (darkwood): no water texture, no shore alpha
		return result;
	}
	result.water = { map: texture(await read(`${prefix}-water`), 'Creek water · map', THREE.SRGBColorSpace) };
	result.water.map.wrapS = THREE.RepeatWrapping;
	// Shore fade across the ribbon (u), wandering along it (v, tiles): the water edge dissolves into the bank.
	const aw = 64;
	const ah = 256;
	const alpha = new Uint8Array(aw * ah * 4);
	for (let y = 0; y < ah; y++) {
		const ring = (r, seed) => noise2(Math.cos((y / ah) * Math.PI * 2) * r, Math.sin((y / ah) * Math.PI * 2) * r, seed);
		const width = 0.3 * ring(2, 31) + 0.12 * ring(7, 32); // the creek widens and narrows
		for (let x = 0; x < aw; x++) {
			const t = (x + 0.5) / aw * 2 - 1;
			const shift = 0.25 * ring(3, 33); // and meanders inside its ribbon
			const u = Math.abs(t - shift) - width + noise2(x * 0.35, y * 0.12, 34) * 0.08;
			const a = Math.round(smooth(0.85, 0.5, u) * 255);
			alpha.set([a, a, a, 255], (y * aw + x) * 4);
		}
	}
	result.water.alphaMap = texture({ data: alpha, w: aw, h: ah }, 'Creek water · shore alpha', THREE.NoColorSpace);
	result.water.alphaMap.repeat.set(1, 0.2); // one shore pattern per 5 water tiles (~25 m)
	app._terrainRibbons[prefix] = result;
	return result;
}

/**
 * The cobble road tile of a set (TERRAIN_SETS[..].roadTile): colour + OpenGL normal, both repeating in u and v (rows flipped like the
 * ribbon textures). → { map, normalMap, width, height } (px); metres per tile = px / roadTile.pxPerM.
 */
export async function loadRoadTile(app, { id }) {
	app._roadTiles ??= {};
	if (app._roadTiles[id]) return app._roadTiles[id];
	const anisotropy = Math.min(8, app.backend.caps.maxAnisotropy || 4);
	const read = async (name, colorSpace) => {
		const img = await app.loader.loadImageData(name);
		const { width: w, height: h } = img;
		const data = new Uint8Array(w * h * 4);
		for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
		const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
		Object.assign(tex, { name: `Road tile · ${name}`, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy, colorSpace, needsUpdate: true });
		return tex;
	};
	const map = await read(id, THREE.SRGBColorSpace);
	const normalMap = await read(`${id}-n`, THREE.NoColorSpace);
	return (app._roadTiles[id] = { map, normalMap, width: map.image.width, height: map.image.height });
}

/** Grass card atlas (2 × 2 tufts, RGBA, image top = v 1) as a mipmapped sRGB texture. */
export async function loadGrassCards(app, id) {
	app._grassCards ??= {};
	if (app._grassCards[id]) return app._grassCards[id];
	const img = await app.loader.loadImageData(id);
	const { width: w, height: h } = img;
	const data = new Uint8Array(w * h * 4);
	for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
	const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: 'Grass cards (2 × 2)', generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(4, app.backend.caps.maxAnisotropy || 4), colorSpace: THREE.SRGBColorSpace, needsUpdate: true });
	app._grassCards[id] = tex;
	return tex;
}

/**
 * Three crossed quads (60° apart), 1 × 1 m, standing on y = 0, UVs on atlas cell `cell` (0..3, row-major from the
 * image top). Normals point up so the tuft is lit like the ground it grows from, not like a vertical wall.
 */
export function grassCardGeometry(cell) {
	const u0 = (cell % 2) * 0.5;
	const v0 = cell < 2 ? 0.5 : 0;
	const pos = [];
	const uv = [];
	const nrm = [];
	const index = [];
	for (let q = 0; q < 3; q++) {
		const a = (q / 3) * Math.PI;
		const cx = Math.cos(a) * 0.5;
		const cz = Math.sin(a) * 0.5;
		const base = pos.length / 3;
		for (const [t, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
			const s = t * 2 - 1;
			pos.push(cx * s, y - 0.03 * (1 - y), cz * s);
			uv.push(u0 + t * 0.5, v0 + y * 0.5);
			nrm.push(0, 1, 0);
		}
		index.push(base, base + 1, base + 2, base + 2, base + 1, base + 3, base, base + 2, base + 1, base + 2, base + 3, base + 1); // both windings, up normals on each (DoubleSide would flip them down)
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setIndex(index);
	return g;
}

/** Forged (procedural) layer sets. */
export function proceduralSets(app) {
	const forge = getForge(app);
	return TERRAIN_LAYERS.map((id) => forge.get(id));
}

export const BRUSH_LAYERS = { 'Dirt (clears wet + grass)': 'dirt', 'Wet dirt': 'wet', Grass: 'grass' };
/** Brush layers of scenes that use the blood-soaked channel (B). */
export const BRUSH_LAYERS_BLOOD = { 'Dirt (clears all)': 'dirt', 'Wet dirt': 'wet', Grass: 'grass', 'Blood-soaked (Remnant)': 'blood' };

const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

export class TerrainSplat {
	/** Covers the square [originX, originX + extent] × [originZ, originZ + extent] (metres). */
	constructor({ size = 512, originX = -60, originZ = -60, extent = 120 } = {}) {
		this.size = size;
		this.originX = originX;
		this.originZ = originZ;
		this.extent = extent;
		this.data = new Uint8Array(size * size * 4); // painted weights (what the brush edits)
		this.smoothed = new Uint8Array(size * size * 4); // uploaded copy, box-blurred by `blur` texels (wider, softer transitions)
		this.blur = 2;
		this.scratch = new Float32Array(size * size);
		this.ao = null; // baked sky visibility per texel (0..255), uploaded as the alpha channel; null = open sky
		const tex = new THREE.DataTexture(this.smoothed, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
		tex.name = 'Terrain splat (R wet, G grass, B blood, A baked sky visibility)';
		tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
		tex.magFilter = THREE.LinearFilter;
		tex.minFilter = THREE.LinearFilter;
		tex.generateMipmaps = false;
		tex.colorSpace = THREE.NoColorSpace;
		tex.needsUpdate = true;
		this.texture = tex;
		this.rect = new THREE.Vector4(originX, originZ, 1 / extent, 1 / extent);
		this.undoStack = [];
	}

	/** Texel centre → world xz. Row 0 is z = originZ (texture v = 0). */
	worldOf(i, j) {
		const k = this.extent / this.size;
		return [this.originX + (i + 0.5) * k, this.originZ + (j + 0.5) * k];
	}

	/** Fill from fn(x, z) -> [wet, grass, blood = 0] (0..1). */
	fill(fn) {
		const { size, data } = this;
		for (let j = 0; j < size; j++) {
			for (let i = 0; i < size; i++) {
				const [x, z] = this.worldOf(i, j);
				const [wet, grass, blood = 0] = fn(x, z);
				const o = (j * size + i) * 4;
				data[o] = Math.round(Math.min(1, Math.max(0, wet)) * 255);
				data[o + 1] = Math.round(Math.min(1, Math.max(0, grass)) * 255);
				data[o + 2] = Math.round(Math.min(1, Math.max(0, blood)) * 255);
				data[o + 3] = 255;
			}
		}
		this.refresh();
	}

	/** Rebuild the uploaded copy: separable box blur of R, G and B (running sums, O(texels)), then upload. */
	refresh() {
		const { size, data, smoothed, scratch } = this;
		const r = Math.max(0, Math.round(this.blur));
		if (!r) smoothed.set(data);
		for (let c = 0; c < 3 && r; c++) {
			const norm = 1 / (2 * r + 1);
			for (let j = 0; j < size; j++) {
				let sum = 0;
				for (let k = -r; k <= r; k++) sum += data[(j * size + Math.min(size - 1, Math.max(0, k))) * 4 + c];
				for (let i = 0; i < size; i++) {
					scratch[j * size + i] = sum * norm;
					sum += data[(j * size + Math.min(size - 1, i + r + 1)) * 4 + c] - data[(j * size + Math.max(0, i - r)) * 4 + c];
				}
			}
			for (let i = 0; i < size; i++) {
				let sum = 0;
				for (let k = -r; k <= r; k++) sum += scratch[Math.min(size - 1, Math.max(0, k)) * size + i];
				for (let j = 0; j < size; j++) {
					smoothed[(j * size + i) * 4 + c] = Math.round(sum * norm);
					sum += scratch[Math.min(size - 1, j + r + 1) * size + i] - scratch[Math.max(0, j - r) * size + i];
				}
			}
		}
		this.writeAO();
	}

	/** Baked sky visibility (Uint8Array, one 0..255 value per texel) into the alpha channel; null clears it. */
	setAO(ao) {
		this.ao = ao;
		this.writeAO();
	}

	writeAO() {
		const { size, smoothed, ao } = this;
		for (let p = 0; p < size * size; p++) smoothed[p * 4 + 3] = ao ? ao[p] : 255;
		this.texture.needsUpdate = true;
	}

	/** Bilinear weights at world xz (of the smoothed copy the GPU sees): { wet, grass, blood } in 0..1. */
	sample(x, z) {
		const { size } = this;
		const data = this.smoothed;
		const fx = Math.min(size - 1.001, Math.max(0, ((x - this.originX) / this.extent) * size - 0.5));
		const fz = Math.min(size - 1.001, Math.max(0, ((z - this.originZ) / this.extent) * size - 0.5));
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		const tx = fx - i;
		const tz = fz - j;
		const at = (ii, jj, c) => data[(jj * size + ii) * 4 + c];
		const lerp2 = (c) => ((at(i, j, c) * (1 - tx) + at(i + 1, j, c) * tx) * (1 - tz) + (at(i, j + 1, c) * (1 - tx) + at(i + 1, j + 1, c) * tx) * tz) / 255;
		return { wet: lerp2(0), grass: lerp2(1), blood: lerp2(2) };
	}

	/**
	 * One brush dab at world xz. layer 'dirt' | 'wet' | 'grass' | 'blood'; radius in metres; strength 0..1 per dab;
	 * hardness 0..1 (falloff start); noise 0..1 breaks the edge up so strokes look organic. Call flush() to upload.
	 */
	paint(x, z, { layer, radius, strength, hardness = 0.4, noise = 0.5 }) {
		const { size, data } = this;
		const k = size / this.extent;
		const ci = (x - this.originX) * k - 0.5;
		const cj = (z - this.originZ) * k - 0.5;
		const rt = radius * k;
		const i0 = Math.max(0, Math.floor(ci - rt));
		const i1 = Math.min(size - 1, Math.ceil(ci + rt));
		const j0 = Math.max(0, Math.floor(cj - rt));
		const j1 = Math.min(size - 1, Math.ceil(cj + rt));
		if (i0 > i1 || j0 > j1) return false;
		for (let j = j0; j <= j1; j++) {
			for (let i = i0; i <= i1; i++) {
				const d = Math.hypot(i - ci, j - cj) / rt;
				if (d >= 1) continue;
				const [wx, wz] = this.worldOf(i, j);
				const grain = noise2(wx * 0.9, wz * 0.9, 21) * 0.5 + 0.5;
				const a = strength * (1 - smooth(Math.min(hardness, 0.99), 1, d)) * (1 - noise + noise * smooth(0.25, 0.75, grain) * 1.6);
				if (a <= 0) continue;
				const o = (j * size + i) * 4;
				let r = data[o] / 255;
				let g = data[o + 1] / 255;
				let b = data[o + 2] / 255;
				if (layer === 'wet') {
					r += (1 - r) * a;
					g *= 1 - a;
				} else if (layer === 'grass') {
					g += (1 - g) * a;
					b *= 1 - a * 0.5; // grass grows back over soaked ground
				} else if (layer === 'blood') {
					b += (1 - b) * a;
					g *= 1 - a * 0.6; // and dies where it soaks in
				} else {
					r *= 1 - a;
					g *= 1 - a;
					b *= 1 - a;
				}
				data[o] = Math.round(Math.min(1, Math.max(0, r)) * 255);
				data[o + 1] = Math.round(Math.min(1, Math.max(0, g)) * 255);
				data[o + 2] = Math.round(Math.min(1, Math.max(0, b)) * 255);
			}
		}
		this.dirty = true; // uploaded by flush(): one blur per pointer event, not per dab
		return true;
	}

	flush() {
		if (!this.dirty) return;
		this.dirty = false;
		this.refresh();
	}

	pushUndo() {
		this.undoStack.push(this.data.slice());
		if (this.undoStack.length > 20) this.undoStack.shift();
	}

	undo() {
		const prev = this.undoStack.pop();
		if (!prev) return false;
		this.data.set(prev);
		this.refresh();
		return true;
	}

	/** PNG of the splat (top row = north = -z, like the top-down map view). */
	toCanvas() {
		const { size, data } = this;
		const c = document.createElement('canvas');
		c.width = c.height = size;
		const ctx = c.getContext('2d');
		const img = ctx.createImageData(size, size);
		for (let j = 0; j < size; j++) img.data.set(data.subarray(j * size * 4, (j + 1) * size * 4), j * size * 4);
		ctx.putImageData(img, 0, 0);
		return c;
	}

	/** Load an image painted elsewhere (R wet, G grass, B blood), resampled to the splat size. */
	fromImage(image) {
		const { size } = this;
		const c = document.createElement('canvas');
		c.width = c.height = size;
		const ctx = c.getContext('2d', { willReadFrequently: true });
		ctx.drawImage(image, 0, 0, size, size);
		const px = ctx.getImageData(0, 0, size, size).data;
		this.pushUndo();
		for (let p = 0; p < size * size; p++) {
			this.data[p * 4] = px[p * 4];
			this.data[p * 4 + 1] = px[p * 4 + 1];
			this.data[p * 4 + 2] = px[p * 4 + 2];
			this.data[p * 4 + 3] = 255;
		}
		this.refresh();
	}

	dispose() {
		this.texture.dispose();
	}
}

/** Terrain material + its splat patch for three layer sets. Returns { material (what the mesh should use), effect }; effect.setLayers(sets) swaps them. */
export function createTerrainMaterial(app, splat, sets) {
	const base = new THREE.MeshStandardMaterial({ name: 'Moor terrain (splat: dirt · wet dirt · grass)', color: 0xffffff, roughness: 1, metalness: 0 });
	const effect = app.backend.effects.createTerrain({ layers: sets, splat: splat.texture, rect: splat.rect });
	return { material: effect.apply(base), effect };
}

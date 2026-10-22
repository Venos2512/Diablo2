// Act I · Dark Wood after Diablo Immortal's zone (reference: output/immortal-artstyle/dark-wood.jpg): a high 3/4 view at night,
// cold blue-grey moonlight with almost no saturation, mist, dark blue-grey loam with sparse wiry grass, a worn cobble path
// crossing the frame diagonally, huge twisted trunks and roots on the left, mossy rocks, a cool pool of light round the
// player. It is the moor's TerrainScene (splat ground, ribbons, grass tufts / cards / shells, brush, ground blend) with its
// own landscape, texture set (TERRAIN_SETS.darkWoodRef: scripts/prepare-terrain-darkwood.py), forest and lighting; the
// campfire, tents, palisade, torches and creek of the moor are left out.
//
// Lights: the moon (one shadow map) + sky ambient + the player's light. No fire / torch shadow maps: the terrain shader already
// samples many textures and WebGPU allows 16 per stage.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { TerrainScene, TERRAIN_DEFAULTS } from './terrain.js';
import { TERRAIN_SETS, loadRibbonTextures, loadRoadTile, grassCardGeometry } from '../env/terrain.js';
import { act1Materials } from '../env/materials.js';
import { GroundBlend, GROUND_PROFILES } from '../env/groundBlend.js';
import { InstanceBuilder } from '../env/instancing.js';
import { shellTexture } from '../env/grassShells.js';
import { loadKits, kitGround, smooth } from '../env/outdoor.js';
import { kelvinToColor } from '../core/grading.js';
import * as kit from '../env/kit.js';

export const DARKWOOD_DEFAULTS = {
	...TERRAIN_DEFAULTS,
	look: 0,
	layerSet: 'darkWoodStylized',
	time: 'moonlit',
	roadRuts: true,
	rutsOpacity: 1,
	creekWater: false,
	tileDirt: 2.8, // 2.8 m: the painted tufts are 0.4–0.7 m (0.25–0.4 H), leaves ≈ 0.14 m
	tileWet: 2.8,
	tileGrass: 2.8,
	variationScale: 0.3,
	rotate: 1,
	water: 0.16,
	waterRough: 0.1,
	macro: 0.35,
	grassDensity: 1,
	edgeCards: 1.6,
	wind: 0.18,
	shellCoverage: 0.45,
	shellHeight: 0.14,
	shadowStrength: 0.7,
	fill: true,
	fillStrength: 1.1,
	fillColor: '#3a4a66',
	fillThreshold: 0.07,
};
registerDefaults('darkWood', DARKWOOD_DEFAULTS);

/**
 * What differs between the Dark Wood scenes (the Immortal mood here, the Diablo II mood in darkWoodD2.js): id, texture set, time
 * presets, kit tints, the path ribbon's width / colour and the camera. Layout, landscape, forest and rules are the same.
 */
export const IMMORTAL_VARIANT = {
	id: 'darkWood',
	label: 'Act I · Dark Wood (Immortal ref)',
	sceneName: 'Dark Wood',
	set: 'darkWoodStylized',
	time: 'moonlit',
	tints: { bark: [0.62, 0.7, 0.85], burned: [0.45, 0.52, 0.65], rock: [0.42, 0.5, 0.62], shrub: [0.5, 0.62, 0.8], cards: [0.5, 0.66, 0.82] },
	path: { name: 'Cobble path (ribbon)', width: 4.4, color: [1.5, 1.55, 1.7] }, // width: the old -ruts strip's ribbon (sets without a roadTile; its paving fills ~90 % of it ≈ 3.9 m); the tile ribbon is laid by ROAD_* below
	iso: false,
};

const SIZE = 120;
const LOOK = 6; // 6: scale pass — everything measured against the 1.8 m character (see SCALE below)
const KITS = [['deadTrees', 'kit-dead-trees'], ['burnedTrees', 'kit-burned-trees'], ['mossy', 'kit-mossy-rocks'], ['shrubs', 'kit-shrubs']];
const CELL = 16;

// Frame the scene like the screenshot: the player stands left of the path's middle, the path runs from the lower right to
// the upper left, the big trunks stand on the left edge. Coordinates (a, b) = metres to the screen's right / away from the camera.
const TARGET = new THREE.Vector3(4, 0, 4);
const CAMERA_OFFSET = new THREE.Vector3(10.4, 24.7, 15.6);
const FORWARD = new THREE.Vector2(-CAMERA_OFFSET.x, -CAMERA_OFFSET.z).normalize();
const RIGHT = new THREE.Vector2(-FORWARD.y, FORWARD.x);
const screenToWorld = (a, b) => [TARGET.x + RIGHT.x * a + FORWARD.x * b, TARGET.z + RIGHT.y * a + FORWARD.y * b];
const worldToScreen = (x, z) => [(x - TARGET.x) * RIGHT.x + (z - TARGET.z) * RIGHT.y, (x - TARGET.x) * FORWARD.x + (z - TARGET.z) * FORWARD.y];

export const DARKWOOD_TIMES = {
	moonlit: {
		label: 'Moonlit · Immortal Dark Wood', moonK: 9000, moon: 4.4, sunElev: 52, sunAz: -38, hemi: 2.2, sky: '#3b4f78', ground: '#161c28',
		env: 'hdri-night', envI: 0.09, bgI: 0, exposure: 0.1, sun: 0.1,
		hero: { color: '#b4c6e6', intensity: 30, distance: 13, decay: 1.25, height: 3.4 },
		fog: { color: '#1a2434', density: 0.045, falloff: 0.28, start: 9, inscatter: 0.2 },
		grade: { vignette: 0.75, contrast: 1.06, saturation: 0.72, lift: -0.004, temperature: -0.3, tint: 0 },
	},
	deepNight: {
		label: 'Deep night (darker, denser mist)', moonK: 10000, moon: 2.2, sunElev: 44, sunAz: -38, hemi: 1.1, sky: '#2a3a5c', ground: '#0f131c',
		env: 'hdri-night', envI: 0.05, bgI: 0, exposure: -0.7, sun: 0.08,
		hero: { color: '#a8bce0', intensity: 34, distance: 12, decay: 1.25, height: 3.4 },
		fog: { color: '#141c2a', density: 0.065, falloff: 0.25, start: 7, inscatter: 0.15 },
		grade: { vignette: 0.85, contrast: 1.08, saturation: 0.65, lift: -0.006, temperature: -0.34, tint: 0 },
	},
};

/**
 * SCALE — H = the character's 1.8 m (art-direction/12_QUY_CHUAN §4.3 / §4.7): ordinary trees 1.7–3 H, the hero trunks / roots on the
 * left 2.5–4 H, rocks mostly ≤ 0.5 H, bushes 0.3–0.7 H, edge grass 0.2–0.35 H.
 * The path (stylized sets): the stylized2 cobble strip cut into a tile that repeats in u and v (scripts/prepare-road-tile.py) at 300 px/m,
 * so its paving stones are ≈ 0.55 m long (median; 0.4–0.9 m, 0.30 H) — measured on the tile, printed by the script. The ribbon is
 * paved 3.2 m wide (alpha ≥ 0.5 ≈ 1.8 H), its ragged edge fades over ±0.3 m. (The old -ruts strip, still used by the realistic set, has its
 * stones filling ~90 % of a 4.4 m ribbon ≈ 3.9 m with 0.9–1.4 m stones.) The road-distance thresholds below were made for a 6.4 m ribbon
 * whose paving was 3.84 m wide: × PATH_K keeps them the same distance from the paved edge. Solid things (trunk / root bases, rocks, bushes)
 * are kept off the paving by their footprint, not their centre: outlineClear() / ROAD_CLEAR.
 */
const ROAD_HALF = 1.6; // half the paved width (m)
const ROAD_FADE = 0.3; // the paving's edge fades from alpha 1 to 0 over ±0.3 m
const ROAD_RIBBON_HALF = ROAD_HALF + ROAD_FADE + 0.35; // the ribbon's half width: room for the edge to wander (±0.3 m)
const ROAD_CLEAR = ROAD_HALF + 0.3; // solid things stay this far from the centre line (footprint outline), i.e. 0.3 m off the paved edge
const PATH_K = ROAD_HALF / 1.92;
const RIM_ROAD_CLEAR = 3.4 * PATH_K * 1.4; // m from the centre line: the home view's rim trees (planForest) keep this far off the path, 1.4 × the ordinary trees' 3.4·K ≈ 4 m = 2.4 m off the paved edge

/** The paving's half width at world xz: ROAD_HALF + a wandering edge (tileRibbon's alpha is 1 inside it − ROAD_FADE, 0 beyond it + ROAD_FADE). */
const pavedEdge = (x, z) => ROAD_HALF + 0.17 * kit.noise2(x * 0.28, z * 0.28, 71) + 0.09 * kit.noise2(x * 1.1, z * 1.1, 72) + 0.05 * kit.noise2(x * 3.2, z * 3.2, 73);
const TREE_SCALE = 0.62; // PIECE_HEIGHT is a piece's height at size 1, × this
const PIECE_HEIGHT = { standard: 5.2, standard_front: 5.2, standard_side: 5.2, tall: 7.5, tall_b: 7.5, hooked: 5.6, uprooted: 4.6, uprooted_b: 4.6, roots: 3, sapling: 2.6, thorn_bush: 1.7, stump: 1.2 };
const pieceHeight = (name) => (PIECE_HEIGHT[name] ?? 5) * TREE_SCALE;

/** Axis-aligned xz box { x0, x1, z0, z1 } (+ its size) of a geometry's vertices below `maxY`, in the geometry's own units, pivot-relative. */
function footprintBox(geometry, maxY = Infinity) {
	const pos = geometry.attributes.position;
	const box = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
	for (let i = 0; i < pos.count; i++) {
		if (pos.getY(i) > maxY) continue;
		box.x0 = Math.min(box.x0, pos.getX(i));
		box.x1 = Math.max(box.x1, pos.getX(i));
		box.z0 = Math.min(box.z0, pos.getZ(i));
		box.z1 = Math.max(box.z1, pos.getZ(i));
	}
	return box;
}

/**
 * Smallest distance (m) from the path's centre line to the rectangle `box` (geometry units) scaled by k, turned by yaw (three's rotation
 * about +y: local (x, z) → (x cos + z sin, -x sin + z cos)) and standing at (x, z). Sampled on a 7 × 7 grid over the rectangle, so a piece
 * straddling the path counts as on it even if its outline is clear on both sides. `roadAt(x, z)` = the scene's distance field.
 */
function outlineClear(roadAt, x, z, yaw, box, k) {
	const c = Math.cos(yaw);
	const s = Math.sin(yaw);
	let best = Infinity;
	for (let i = 0; i <= 6; i++) {
		const lx = (box.x0 + ((box.x1 - box.x0) * i) / 6) * k;
		for (let j = 0; j <= 6; j++) {
			const lz = (box.z0 + ((box.z1 - box.z0) * j) / 6) * k;
			best = Math.min(best, roadAt(x + lx * c + lz * s, z - lx * s + lz * c));
		}
	}
	return best;
}

export class DarkWoodScene extends TerrainScene {
	constructor(app, variant = IMMORTAL_VARIANT) {
		super(app, variant.id);
		this.variant = variant;
		this.times = variant.times ?? DARKWOOD_TIMES;
		this.label = variant.label;
		this.scene.name = variant.sceneName;
		this.home = variant.iso
			? { mode: 'iso', target: new THREE.Vector3(TARGET.x, this.height(TARGET.x, TARGET.z) + 0.9, TARGET.z), height: variant.isoHeight ?? 12 }
			: { position: TARGET.clone().add(CAMERA_OFFSET), target: TARGET.clone() };
		this.treeSpots = [];
		this.rockSpots = [];
		this.treeGrid = new Map();
	}

	/** The cobble path, lower right to upper left; no creek (the base constructor builds the distance field from this). */
	curves() {
		const pts = [[26, -14], [14, -8], [4, -2.5], [-6, 3], [-16, 9], [-28, 17], [-44, 28]].map(([a, b]) => new THREE.Vector3(...screenToWorld(a, b)).setY(0));
		return { road: new THREE.CatmullRomCurve3(pts).getSpacedPoints(160), creek: [] };
	}

	creekDistance() {
		return 99;
	}

	/** The paved cobble (within the wandering paved edge of the path ribbon) is stone; with the path ribbon hidden it is the splat's bare earth. */
	pathCoverageAt(x, z) {
		const c = (this._pathCoverage ??= { amount: 0, surface: 'stone' });
		c.amount = this.settings.roadRuts && this.roadDistance(x, z) <= pavedEdge(x, z) ? 1 : 0;
		c.surface = 'stone';
		return c;
	}

	/** Rolling forest floor, calm round the player and flattened where the path runs. */
	height(x, z, road = this.roadDistance(x, z)) {
		let h = kit.noise2(x * 0.03, z * 0.03, 21) * 2.0 + kit.noise2(x * 0.09, z * 0.09, 22) * 0.55 + kit.noise2(x * 0.3, z * 0.3, 24) * 0.07;
		h *= 1 - 0.7 * smooth(30, 8, Math.hypot(x - TARGET.x, z - TARGET.z));
		const r = 1 - smooth(1.8 * PATH_K, 4.5 * PATH_K, road);
		return h * (1 - 0.65 * r) - 0.05 * (1 - smooth(0.8 * PATH_K, 2 * PATH_K, road));
	}

	// -- forest layout ------------------------------------------------------------------------------------------------

	treeCellKey(x, z) {
		return `${Math.floor(x / 6)},${Math.floor(z / 6)}`;
	}

	/** Distance (m) to the nearest tree's trunk edge (≈ half its size) within 6 m, else 6. */
	treeNear(x, z) {
		const cx = Math.floor(x / 6);
		const cz = Math.floor(z / 6);
		let best = 6;
		for (let j = -1; j <= 1; j++) {
			for (let i = -1; i <= 1; i++) {
				for (const t of this.treeGrid.get(`${cx + i},${cz + j}`) ?? []) best = Math.min(best, Math.hypot(t.x - x, t.z - z) - t.radius);
			}
		}
		return Math.max(0, best);
	}

	addTree(spot) {
		this.treeSpots.push(spot);
		const key = this.treeCellKey(spot.x, spot.z);
		if (!this.treeGrid.has(key)) this.treeGrid.set(key, []);
		this.treeGrid.get(key).push(spot);
	}

	/** A kit piece's footprint boxes (geometry units): `full` = everything (crown and branches too), `base` = its lowest 15 % (trunk / roots). */
	footprints(kitKey, name) {
		this._footprints ??= new Map();
		const key = `${kitKey}.${name}`;
		if (!this._footprints.has(key)) {
			const geometry = this.piece(kitKey, name).geometry;
			const box = geometry.boundingBox ?? (geometry.computeBoundingBox(), geometry.boundingBox);
			const height = box.max.y - box.min.y;
			this._footprints.set(key, { height, full: footprintBox(geometry), base: footprintBox(geometry, box.min.y + 0.15 * height) });
		}
		return this._footprints.get(key);
	}

	/** Trunks: big ones on the left of the frame and along the far side, none on the path or in the player's clearing. */
	planForest() {
		const r = kit.rng(5150);
		const ry = kit.rng(2718); // the trees' yaws: their own stream, so the layout's r() sequence is not disturbed
		const roadAt = (x, z) => this.roadDistance(x, z);
		/** The tree's base (trunk / roots) stays ROAD_CLEAR off the centre line; hero: the whole piece too (no crown across the path). */
		const offRoad = (x, z, yaw, kitKey, name, height, hero = false) => {
			const fp = this.footprints(kitKey, name);
			const k = height / fp.height;
			return outlineClear(roadAt, x, z, yaw, fp.base, k) >= ROAD_CLEAR && (!hero || outlineClear(roadAt, x, z, yaw, fp.full, k) >= 0.3);
		};
		const dead = ['standard', 'standard_front', 'standard_side', 'tall', 'tall_b', 'hooked'].filter((n) => this.kits.deadTrees?.[n]);
		const big = ['uprooted', 'uprooted_b', 'roots', 'hooked', 'tall'].filter((n) => this.kits.deadTrees?.[n]);
		const burned = ['standard', 'standard_front', 'charcoal'].filter((n) => this.kits.burnedTrees?.[n]);
		const free = (x, z, radius) => this.treeNear(x, z) > radius * 0.8 + 0.6;
		// The big twisted trunks of the screenshot's left edge, placed by hand in screen coordinates (a right, b away from the camera).
		// Heights in metres (2.5–4 H); size = height / the piece's own height, so every piece reaches the same landmark height.
		const heroes = [[-11, 2, 'uprooted', 6.3], [-8, 11, 'roots', 4.8], [-14, 9, 'hooked', 5.9], [-5, 17, 'uprooted_b', 6], [-17, 0, 'tall', 6], [12, 16, 'hooked', 4.9], [4, 20, 'tall_b', 5.1]];
		this.layoutLog = { heroes: [], rocks: [] };
		for (const [a, b, name, height] of heroes) {
			let [x, z] = screenToWorld(a, b);
			const piece = this.kits.deadTrees?.[name] ? name : dead[0];
			if (!piece) continue;
			// Try 12 turns of the piece; if none keeps its base ROAD_CLEAR (and its crown 0.3 m) off the path, step away from the path and try again.
			const y0 = ry() * Math.PI * 2;
			const from = [x, z];
			let yaw = null;
			for (let step = 0; step < 40 && yaw === null; step++) {
				for (let i = 0; i < 12 && yaw === null; i++) if (offRoad(x, z, y0 + (i * Math.PI) / 6, 'deadTrees', piece, height, true)) yaw = y0 + (i * Math.PI) / 6;
				if (yaw !== null) break;
				const gx = roadAt(x + 0.5, z) - roadAt(x - 0.5, z);
				const gz = roadAt(x, z + 0.5) - roadAt(x, z - 0.5);
				const len = Math.hypot(gx, gz) || 1;
				x += (gx / len) * 0.5;
				z += (gz / len) * 0.5;
			}
			if (yaw === null) continue;
			const fp = this.footprints('deadTrees', piece);
			const k = height / fp.height;
			this.layoutLog.heroes.push({ name: piece, height, moved: +Math.hypot(x - from[0], z - from[1]).toFixed(1), base: [+((fp.base.x1 - fp.base.x0) * k).toFixed(1), +((fp.base.z1 - fp.base.z0) * k).toFixed(1)], full: [+((fp.full.x1 - fp.full.x0) * k).toFixed(1), +((fp.full.z1 - fp.full.z0) * k).toFixed(1)] });
			// radius (trunk edge for treeNear): half the narrow side of the base footprint, from the real box
			const radius = 0.5 * Math.min(fp.base.x1 - fp.base.x0, fp.base.z1 - fp.base.z0) * k;
			this.addTree({ x, z, yaw, size: height / pieceHeight(piece), height, hero: true, kit: 'deadTrees', name: piece, radius });
		}
		// A tree of the ordinary kinds at (x, z): giants (big roots / hooked) on the left, a few burned ones, the rest dead standing trees.
		const plant = (x, z, giant) => {
			const height = giant ? 4.6 + r() * 2 : 3 + r() * 2.6; // m: giants 2.5–3.7 H, the rest 1.7–3.1 H
			const radius = height * (giant ? 0.2 : 0.14);
			if (!free(x, z, radius)) return false;
			let kitKey = 'deadTrees';
			let name;
			if (giant && big.length) name = big[Math.floor(r() * big.length)];
			else if (burned.length && r() < 0.1) [kitKey, name] = ['burnedTrees', burned[Math.floor(r() * burned.length)]];
			else name = dead[Math.floor(r() * dead.length)];
			const size = Math.min(2.4, height / pieceHeight(name)); // the wide root pieces (roots, uprooted_b) stay below ×2.4
			const yaw = ry() * Math.PI * 2;
			if (!offRoad(x, z, yaw, kitKey, name, size * pieceHeight(name))) return false;
			this.addTree({ x, z, yaw, size, height: size * pieceHeight(name), kit: kitKey, name, radius });
			return true;
		};
		const want = 300; // trees are ~0.6× the size they were: more of them keep the forest's density
		for (let i = 0, n = 0; i < want * 30 && n < want; i++) {
			const x = (r() - 0.5) * SIZE * 0.82;
			const z = (r() - 0.5) * SIZE * 0.82;
			const [a, b] = worldToScreen(x, z);
			const road = this.roadDistance(x, z);
			const toPlayer = Math.hypot(x - TARGET.x, z - TARGET.z);
			if (road < 4.5 * PATH_K || toPlayer < 6) continue;
			// Density: thin near the path and the clearing, thick in the left and far parts of the frame (like the screenshot).
			const left = smooth(6, -22, a);
			const far = smooth(8, 26, b);
			const chance = smooth(4.5 * PATH_K, 11 * PATH_K, road) * smooth(6, 15, toPlayer) * (0.18 + 0.82 * Math.max(left, far * 0.8));
			if (r() > chance) continue;
			if (plant(x, z, left > 0.55 && r() < 0.28)) n++;
		}
		// The home view's rim: with the smaller trees the wall of trunks has to stand close to the frame (left edge and far edge of the 3/4 view).
		for (let i = 0, n = 0; i < 6000 && n < 90; i++) {
			const a = -24 + r() * 46;
			const b = -6 + r() * 34;
			const [x, z] = screenToWorld(a, b);
			const rim = Math.max(smooth(-7, -11, a), smooth(8, 12, b));
			if (r() > rim * 0.9 || this.roadDistance(x, z) < RIM_ROAD_CLEAR || Math.hypot(x - TARGET.x, z - TARGET.z) < 7) continue;
			if (plant(x, z, a < -12 && r() < 0.3)) n++;
		}
		// Rocks: along the path's edges and at the trunks' feet.
		const mossy = Object.keys(this.kits.mossy ?? {});
		// A rock is on the path when any part of its box (× size, turned by yaw) is closer than ROAD_CLEAR to the centre line.
		const rockClear = (x, z, yaw, name, size) => outlineClear(roadAt, x, z, yaw, this.footprints('mossy', name).full, size);
		// Three by hand in the home view, as scale cues next to the character: 0.5 H, 0.25 H and 0.35 H high. A cue that lands on the path is
		// stepped away from it (this.layoutLog.rocks says how far; the 'light' one stood 0.9 m from the centre line at (-2.2, 5.2) in round 1).
		for (const [a, b, size, want] of [[-5.2, -2.4, 0.62, 'standard'], [4.6, -3.6, 0.34, 'medium'], [-3.3, 3.5, 0.4, 'light']]) {
			if (!mossy.length) break;
			let [x, z] = screenToWorld(a, b);
			const name = mossy.includes(want) ? want : mossy[0];
			const yaw = r() * 6.28;
			const from = [x, z];
			for (let step = 0; step < 40 && rockClear(x, z, yaw, name, size) < ROAD_CLEAR; step++) {
				const gx = roadAt(x + 0.5, z) - roadAt(x - 0.5, z);
				const gz = roadAt(x, z + 0.5) - roadAt(x, z - 0.5);
				const len = Math.hypot(gx, gz) || 1;
				x += (gx / len) * 0.25;
				z += (gz / len) * 0.25;
			}
			this.layoutLog.rocks.push({ name, size, from: from.map((v) => +v.toFixed(2)), to: [x, z].map((v) => +v.toFixed(2)), clear: +rockClear(x, z, yaw, name, size).toFixed(2) });
			this.rockSpots.push({ x, z, size, name, yaw });
		}
		for (let i = 0, n = 0; mossy.length && i < 1600 && n < 130; i++) {
			const x = (r() - 0.5) * SIZE * 0.8;
			const z = (r() - 0.5) * SIZE * 0.8;
			const road = this.roadDistance(x, z);
			if (road < 2.6 * PATH_K || Math.hypot(x - TARGET.x, z - TARGET.z) < 3.5) continue;
			const nearTree = this.treeNear(x, z);
			const chance = Math.max(smooth(7 * PATH_K, 3.2 * PATH_K, road) * 0.6, smooth(3.5, 0.4, nearTree) * 0.9, 0.03);
			if (r() > chance || nearTree < 0.2) continue;
			// The kit's boulders are 1.2–1.9 m high × 3.1–3.7 m wide: ×0.22–0.8 = 0.3–1.5 m high (0.15–0.8 H), most of them under 0.5 H.
			const size = 0.22 + r() ** 2.2 * 0.58;
			const name = mossy[Math.floor(r() * mossy.length)];
			const yaw = r() * 6.28;
			if (rockClear(x, z, yaw, name, size) < ROAD_CLEAR) continue;
			this.rockSpots.push({ x, z, size, name, yaw });
			n++;
		}
	}

	/**
	 * Splat: wet dark loam in the hollows, sparse grass in patches, tufts round the trunks, none on the path. The verge (the ground from the
	 * paved edge out to 3–4 m, its outer edge wandering) is mostly grass instead (~75 %), with bare loam / mud in 1–3 m patches for the rest.
	 * The grass starts only 0.42 m beyond the paved edge: the splat is blurred ±0.7 m and the shell blades would poke through the opaque paving.
	 */
	weights(x, z) {
		const road = this.roadDistance(x, z);
		const out = road - pavedEdge(x, z); // m beyond the paved edge (the paving is opaque below −ROAD_FADE, gone beyond ROAD_FADE)
		const h = this.height(x, z, road);
		const big = kit.noise2(x * 0.06, z * 0.06, 31) * 0.5 + 0.5;
		const fine = kit.noise2(x * 0.45, z * 0.45, 32) * 0.5 + 0.5;
		const spots = kit.noise2(x * 0.14, z * 0.14, 33) * 0.5 + 0.5;
		const tree = this.treeNear(x, z);
		const low = smooth(-0.3, -1.1, h) * 0.8;
		const patches = smooth(0.7, 0.84, spots + (fine - 0.5) * 0.2) * 0.75;
		const rootBed = smooth(2.2, 0.2, tree) * 0.7; // leaf mould under the trunks
		let wet = Math.max(low, patches, rootBed * 0.5);
		let grass = smooth(0.5, 0.78, big + (fine - 0.5) * 0.55) * 0.4; // open loam between the clumps
		grass = Math.max(grass, smooth(4, 1.2, tree) * 0.55 * smooth(0.25, 0.5, fine + 0.15)); // wiry clumps round the roots
		grass *= 1 - Math.min(1, low + patches) * 0.7;
		const reach = 3.4 + 1.2 * kit.noise2(x * 0.11, z * 0.11, 34);
		const verge = 1 - smooth(reach - 1, reach + 1.2, out);
		if (verge > 0) {
			const patch = (kit.noise2(x * 0.3, z * 0.3, 35) * 0.5 + 0.5) * 0.75 + (kit.noise2(x * 0.9, z * 0.9, 36) * 0.5 + 0.5) * 0.25;
			const bare = smooth(0.58, 0.68, patch - 0.1 * (1 - smooth(0.4, 2, out))); // fewer patches against the paving
			grass += ((1 - bare) * (0.82 + 0.18 * fine) - grass) * verge;
			wet = wet * (1 - verge) + bare * 0.4 * verge;
		}
		grass *= smooth(0.42, 0.62, out);
		return [wet, grass];
	}

	// -- build ---------------------------------------------------------------------------------------------------------

	async init() {
		this.mat = act1Materials(this.app);
		this.scene.add(this.anchor);
		this.anchor.position.set(TARGET.x, this.height(TARGET.x, TARGET.z) + 0.02, TARGET.z);
		const s = this.settings;
		if (s.look !== LOOK) {
			delete this.app.settings.data.scenePost?.[this.id];
			// A reset re-applies every tuned default of the variant (older saves kept stale edgeCards, fill, shell, wind ... values), then
			// the set's own water values are put back over useSetDefaults' (the Diablo II mood wants a rougher puddle sheen).
			const { look, ...tuned } = this.variant.defaults ?? DARKWOOD_DEFAULTS;
			Object.assign(s, tuned, { look: LOOK, layerSet: this.variant.set, time: this.variant.time, roadRuts: true, creekWater: false });
			this.useSetDefaults(this.variant.set);
		}
		this.splat.blur = s.splatBlur;
		this.kits = await loadKits(this.app, KITS);
		this.fire = new THREE.Vector3(1e4, 0, 1e4); // the moor's campfire lies far off the map: the base class' checks never trigger
		this.tentSpots = this.dressSpots = this.torchSpots = [];
		this.planForest();
		this.generateSplat();
		await this.buildTerrain();
		await this.buildRibbons();
		this.buildProps();
		await this.loadCards();
		this.buildGrass();
		this.buildShrubs();
		this.buildLights();
		this.buildCursor();
		this.windGrass = this.app.backend.effects.create('wind', { strength: s.wind, height: 1, frequency: 1.9 });
		this.windTrees = this.app.backend.effects.create('wind', { strength: s.wind * 0.35, height: 6 * TREE_SCALE, frequency: 0.9, gust: 0.8, bend: 0 });
		this.windShrubs = this.app.backend.effects.create('wind', { strength: s.wind * 0.6, height: 1.2, frequency: 1.4, gust: 0.6 });
		this.grass.material = this.windGrass.apply(this.grass.material);
		this.swapMaterials(this.trees, (m) => this.windTrees.apply(m));
		if (this.shrubs.length) {
			const material = this.windShrubs.apply(this.shrubs[0].material);
			for (const m of this.shrubs) m.material = material;
		}
		this.shadowFill = this.app.backend.effects.createShadowFill();
		this.applyFill();
		this.buildCards();
		this.buildShells();
		this.applyLayerSettings();
		await this.applyTime();
		this.buildGroundBlend();
	}

	/** meshes' materials through fn, once per distinct material (the meshes of a kit share one). */
	swapMaterials(meshes, fn) {
		const done = new Map();
		for (const mesh of meshes) {
			if (!mesh?.material) continue;
			if (!done.has(mesh.material)) {
				const wrapped = fn(mesh.material);
				done.set(mesh.material, wrapped);
				if (wrapped !== mesh.material) (this.wrapped ??= new Set()).add(wrapped);
			}
			mesh.material = done.get(mesh.material);
		}
	}

	/** Kit material for the night wood: pulled toward cold blue-grey, a little darker (the atlases are warm brown). */
	kitMaterial(source, tint, name) {
		this.kitMaterials ??= new Map();
		const key = `${source.uuid}:${tint.getHexString()}`;
		if (!this.kitMaterials.has(key)) {
			const m = source.clone();
			m.color = (m.color ?? new THREE.Color(1, 1, 1)).clone().multiply(tint);
			m.name = name;
			m.side = THREE.DoubleSide;
			this.kitMaterials.set(key, m);
		}
		return this.kitMaterials.get(key);
	}

	piece(kitKey, name) {
		return this.kits[kitKey]?.[name];
	}

	/** Kit trees and mossy rocks as instances in cells (env/instancing.js); this.trees = the tree cell meshes. */
	buildProps() {
		const up = new THREE.Vector3(0, 1, 0);
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const barkTint = new THREE.Color(...this.variant.tints.bark);
		const rockTint = new THREE.Color(...this.variant.tints.rock);
		const burnedTint = new THREE.Color(...(this.variant.tints.burned ?? this.variant.tints.bark));
		this.treeGeometries = new Map();
		const trees = new InstanceBuilder('Dark Wood trees (instanced cells)', { cell: CELL * 2, pad: 1, castShadow: true });
		this.staticGroup = new THREE.Group(); // nothing merged here: the base class' fill / blend lists read its children
		this.staticGroup.name = 'Dark Wood statics';
		this.scene.add(this.staticGroup);
		this.trees = [];
		for (const t of this.treeSpots) {
			const piece = this.piece(t.kit, t.name) ?? this.piece('deadTrees', 'standard');
			if (!piece) continue;
			if (!this.treeGeometries.has(piece)) {
				const box = piece.geometry.boundingBox;
				const unit = pieceHeight(t.name) / Math.max(0.1, box.max.y - box.min.y);
				const g = piece.geometry.clone().scale(unit, unit, unit);
				g.computeBoundingBox();
				g.name = piece.name;
				this.treeGeometries.set(piece, g);
			}
			const geometry = this.treeGeometries.get(piece);
			const yaw = t.yaw;
			const y = kitGround((x, z) => this.height(x, z), { geometry }, t.x, t.z, yaw, t.size) - 0.12 * t.size;
			m4.compose(new THREE.Vector3(t.x, y, t.z), q.setFromAxisAngle(up, yaw), new THREE.Vector3(t.size, t.size, t.size));
			trees.add(geometry, this.kitMaterial(piece.material, t.kit === 'burnedTrees' ? burnedTint : barkTint, t.kit === 'burnedTrees' ? 'Dark Wood burned bark' : 'Dark Wood bark'), m4);
		}
		this.treeCells = trees.build();
		for (const mesh of this.treeCells.children) mesh.userData.labSolid = true;
		this.trees = [...this.treeCells.children];
		this.scene.add(this.treeCells);

		const rocks = new InstanceBuilder('Dark Wood rocks (instanced cells)', { cell: CELL * 2, pad: 0, castShadow: true });
		for (const s of this.rockSpots) {
			const piece = this.piece('mossy', s.name);
			if (!piece) continue;
			const y = kitGround((x, z) => this.height(x, z), piece, s.x, s.z, s.yaw, s.size) - 0.22 * s.size;
			m4.compose(new THREE.Vector3(s.x, y, s.z), q.setFromAxisAngle(up, s.yaw), new THREE.Vector3(s.size, s.size, s.size));
			rocks.add(piece.geometry, this.kitMaterial(piece.material, rockTint, 'Dark Wood rock'), m4);
		}
		this.rockCells = rocks.build();
		this.scene.add(this.rockCells);
	}

	/** Dense bushes in the forest's border (round the trunks, far side, left), a few along the path's shoulders. */
	buildShrubs() {
		this.shrubs = [];
		const pieces = Object.values(this.kits.shrubs ?? {});
		if (!pieces.length) return;
		const material = this.kitMaterial(pieces[0].material, new THREE.Color(...this.variant.tints.shrub), 'Dark Wood shrubs');
		const r = kit.rng(913);
		const builder = new InstanceBuilder('Dark Wood shrubs (instanced cells)', { cell: CELL, pad: 0.3, castShadow: true });
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const up = new THREE.Vector3(0, 1, 0);
		this.shrubSpots = [];
		const footprints = new Map();
		const roadAt = (x, z) => this.roadDistance(x, z);
		const max = Math.round(560 * this.settings.grassDensity);
		for (let i = 0, n = 0; i < max * 14 && n < max; i++) {
			const x = (r() - 0.5) * SIZE * 0.85;
			const z = (r() - 0.5) * SIZE * 0.85;
			const road = this.roadDistance(x, z);
			if (road < 2.8 * PATH_K || Math.hypot(x - TARGET.x, z - TARGET.z) < 3) continue;
			const [a, b] = worldToScreen(x, z);
			const border = Math.max(smooth(8, -18, a), smooth(6, 24, b)) * smooth(5, 12, Math.hypot(x - TARGET.x, z - TARGET.z));
			const tree = this.treeNear(x, z);
			const chance = Math.max(border * 0.7, smooth(4, 0.6, tree) * 0.7, smooth(4.6 * PATH_K, 3.2 * PATH_K, road) * 0.18);
			if (r() > chance || tree < 0.1) continue;
			const yaw = r() * Math.PI * 2;
			const piece = pieces[Math.floor(r() * pieces.length)];
			// Aim 0.55–1.1 m high (0.3–0.6 H), never wider than 1.6 m (0.9 H): the kit's bushes are 0.35–1.1 m high × 1–2.1 m wide. A bush that the
			// clamp leaves under 0.54 m (0.3 H) is dropped, and so is one whose footprint touches the paving (ROAD_CLEAR).
			if (!piece.geometry.boundingBox) piece.geometry.computeBoundingBox();
			const box = piece.geometry.boundingBox;
			const s = Math.max(0.45, Math.min(1.3, (0.55 + r() * 0.55) / Math.max(0.1, box.max.y - box.min.y), 1.6 / Math.max(0.1, Math.max(box.max.x - box.min.x, box.max.z - box.min.z))));
			if ((box.max.y - box.min.y) * s < 0.54) continue;
			if (!footprints.has(piece)) footprints.set(piece, footprintBox(piece.geometry));
			if (outlineClear(roadAt, x, z, yaw, footprints.get(piece), s) < ROAD_CLEAR) continue;
			this.shrubSpots.push({ name: piece.name, s, height: (box.max.y - box.min.y) * s, width: Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * s });
			m4.compose(new THREE.Vector3(x, this.height(x, z) - 0.05 * s, z), q.setFromAxisAngle(up, yaw), new THREE.Vector3(s, s, s));
			builder.add(piece.geometry, material, m4);
			n++;
		}
		this.shrubCells = builder.build();
		this.shrubs = [...this.shrubCells.children];
		this.scene.add(this.shrubCells);
	}

	/**
	 * Grass clumps (atlas cards, a few cards each) clustered along the path's edges and round the trunks and rocks, open loam
	 * in between — the screenshot's wiry tufts hug the cobbles and the roots. Cold-tinted: the atlas is a saturated green, the
	 * material colour multiplies the instance colours.
	 */
	buildCards() {
		if (this.cards) {
			this.scene.remove(this.cards);
			for (const m of this.cards.children) {
				m.geometry.dispose();
				m.dispose?.();
			}
			this.cards = null;
		}
		const density = this.settings.edgeCards;
		if (!this.cardTexture || !density) return;
		this.cardBase ??= new THREE.MeshStandardMaterial({ name: 'Grass cards', alphaTest: 0.45, roughness: 0.85, metalness: 0, color: new THREE.Color(...this.variant.tints.cards) });
		if (this.cardBase.map !== this.cardTexture) {
			this.cardBase.map = this.cardTexture;
			this.cardBase.needsUpdate = true;
		}
		// Re-applied on every build: on WebGPU apply() returns the node twin of the source material, refreshed from its current
		// properties each call, so after a set switch (new atlas) the twin must be applied again to see the new map. The previous
		// wrappers are disposed (never the source material).
		for (const m of [this.cardWind, this.cardMaterial]) if (m && m !== this.cardBase) m.dispose();
		this.cardWind = this.windGrass.apply(this.cardBase);
		this.cardMaterial = this.shadowFill.apply(this.cardWind);
		const r = kit.rng(313);
		const centres = [];
		for (let k = 0; k < this.road.length; k += 2) {
			const p = this.road[k];
			const q = this.road[Math.min(k + 1, this.road.length - 1)];
			const dir = new THREE.Vector3().subVectors(q, p).setY(0).normalize();
			for (const side of [-1, 1]) {
				if (r() > 0.5 * density) continue;
				const off = side * (2.5 + r() * 1.1) * PATH_K;
				centres.push({ x: p.x - dir.z * off, z: p.z + dir.x * off, spread: 0.8, n: 3 + Math.floor(r() * 5), lo: 0.36, span: 0.27 }); // edge grass 0.2–0.35 H
			}
		}
		for (const t of this.treeSpots) {
			for (let k = 0; k < Math.round(2 * density); k++) {
				const a = r() * Math.PI * 2;
				const d = t.radius * 0.7 + 0.4 + r() * 1.4;
				centres.push({ x: t.x + Math.cos(a) * d, z: t.z + Math.sin(a) * d, spread: 0.7, n: 3 + Math.floor(r() * 4), lo: 0.25, span: 0.3 }); // clumps at the roots 0.14–0.3 H
			}
		}
		for (const s of this.rockSpots) {
			const a = r() * Math.PI * 2;
			centres.push({ x: s.x + Math.cos(a) * s.size * 1.3, z: s.z + Math.sin(a) * s.size * 1.3, spread: 0.5, n: 2 + Math.floor(r() * 3), lo: 0.25, span: 0.3 });
		}
		const geometries = [0, 1, 2, 3].map((cell) => grassCardGeometry(cell));
		const builder = new InstanceBuilder('Grass cards (instanced cells)', { cell: CELL * 2, pad: 0.4 });
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const up = new THREE.Vector3(0, 1, 0);
		const color = new THREE.Color();
		for (const c of centres) {
			if (Math.abs(c.x) > 56 || Math.abs(c.z) > 56) continue;
			for (let i = 0; i < c.n; i++) {
				const a = r() * Math.PI * 2;
				const d = Math.sqrt(r()) * c.spread;
				const x = c.x + Math.cos(a) * d;
				const z = c.z + Math.sin(a) * d;
				if (this.roadDistance(x, z) < 2.0 * PATH_K || Math.hypot(x - TARGET.x, z - TARGET.z) < 1.2) continue;
				const { wet } = this.splat.sample(x, z);
				if (wet > 0.7) continue;
				const h = c.lo + r() ** 2 * c.span;
				const w = h * (0.9 + r() * 0.4);
				const tone = 0.55 + r() * 0.3;
				m4.compose(new THREE.Vector3(x, this.height(x, z), z), q.setFromAxisAngle(up, r() * Math.PI), new THREE.Vector3(w, h, w));
				builder.add(geometries[Math.floor(r() * 4)], this.cardMaterial, m4, color.setRGB(tone * 0.92, tone, tone * 0.86));
			}
		}
		this.cards = builder.build();
		this.cards.material = this.cardMaterial;
		this.scene.add(this.cards);
	}

	/** The set's defaults, then this variant's water look over them: the mood owns it, whichever texture set is selected (also after setLayerSet). */
	useSetDefaults(id) {
		super.useSetDefaults(id);
		const d = this.variant.defaults ?? DARKWOOD_DEFAULTS;
		this.settings.water = d.water;
		this.settings.waterRough = d.waterRough;
	}

	/** Shell grass, its texture darkened by variant.shellTint (the pale blades of a recoloured grass tile read minty under the hero light). */
	buildShells() {
		const tint = this.variant.shellTint;
		const s = this.settings;
		if (tint && s.shells && this.currentSets && TERRAIN_SETS[s.layerSet]?.prefix) {
			this._shellTextures ??= {};
			if (!this._shellTextures[s.layerSet]) {
				const tex = shellTexture(this.currentSets[2], Math.min(8, this.app.backend.caps.maxAnisotropy || 4));
				if (tex) {
					const d = tex.image.data;
					for (let o = 0; o < d.length; o += 4) for (let c = 0; c < 3; c++) d[o + c] *= tint[c];
					tex.needsUpdate = true;
					this._shellTextures[s.layerSet] = tex;
				}
			}
		}
		super.buildShells();
	}

	/**
	 * The path as a dense strip (0.3 m along × ~0.15 m across) textured with the repeating cobble tile: u runs across in metres / tile
	 * width, v along in metres / tile height, so the paving stones keep their size whatever the ribbon's width. Where the strip paves is
	 * a per-vertex alpha (RGBA vertex colour): 1 inside the paved half width ROAD_HALF, 0 beyond it + ROAD_FADE, the edge wandering with
	 * world-space noise (3.5 m, 0.9 m and 0.3 m wavelengths) so it is never a straight line. The tile's u is drifted along the path (±1 m over
	 * ~18 m) and its v wobbled (±0.25 m), so the 4.3 m repeat does not line up with itself from one tile to the next.
	 * Returns { geometry, paved: { min, mean, max } } (width where alpha ≥ 0.5, metres; for the layout report).
	 */
	tileRibbon(tileW, tileH, y) {
		const step = 0.3;
		const across = 31;
		const pts = [];
		let along = 0;
		let next = 0;
		for (let k = 1; k < this.road.length; k++) {
			const a = this.road[k - 1];
			const b = this.road[k];
			const len = a.distanceTo(b);
			while (next <= along + len + 1e-9) {
				const t = len ? (next - along) / len : 0;
				pts.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, s: next });
				next += step;
			}
			along += len;
		}
		const pos = [];
		const uv = [];
		const color = [];
		const index = [];
		const paved = [];
		pts.forEach((p, k) => {
			const a = pts[Math.max(0, k - 1)];
			const b = pts[Math.min(pts.length - 1, k + 1)];
			const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
			const nx = -(b.z - a.z) / len;
			const nz = (b.x - a.x) / len;
			const drift = 1.0 * kit.noise2(p.s * 0.055, 0.5, 74); // m, u shift of the tile along the path
			let inside = 0;
			for (let j = 0; j < across; j++) {
				const o = ((j / (across - 1)) - 0.5) * 2 * ROAD_RIBBON_HALF;
				const x = p.x + nx * o;
				const z = p.z + nz * o;
				const edge = pavedEdge(x, z);
				const alpha = smooth(edge + ROAD_FADE, edge - ROAD_FADE, Math.abs(o));
				if (alpha >= 0.5) inside += 1;
				pos.push(x, y(x, z), z);
				uv.push((o + drift) / tileW, (p.s + 0.25 * kit.noise2(x * 0.5, z * 0.5, 75)) / tileH);
				color.push(1, 1, 1, alpha);
				if (k && j) {
					const c = k * across + j;
					index.push(c - across - 1, c - across, c - 1, c - across, c, c - 1); // counter-clockwise from above (+y normals)
				}
			}
			paved.push((inside * 2 * ROAD_RIBBON_HALF) / (across - 1));
		});
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setAttribute('color', new THREE.Float32BufferAttribute(color, 4));
		g.setIndex(index);
		g.computeVertexNormals();
		return { geometry: g, paved: { min: Math.min(...paved), mean: paved.reduce((u, v) => u + v, 0) / paved.length, max: Math.max(...paved) } };
	}

	/** The cobble path: the set's repeating road tile (roadTile) or, for a set without one, its -ruts strip; own normal map, no creek. */
	async buildRibbons() {
		if (this.roadMesh) {
			this.scene.remove(this.roadMesh);
			this.roadMesh.geometry.dispose();
			this.roadMesh = null;
		}
		const def = TERRAIN_SETS[this.settings.layerSet];
		if (!def?.ribbons && !def?.roadTile) return;
		let tex;
		try {
			tex = def.roadTile ? await loadRoadTile(this.app, def.roadTile) : (await loadRibbonTextures(this.app, def.ribbons)).ruts;
		} catch (error) {
			console.error(`Road textures of "${this.settings.layerSet}" failed to load; the path stays splat-only`, error);
			return;
		}
		this.roadMaterial ??= new THREE.MeshStandardMaterial({ name: this.variant.path.name, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.85, metalness: 0, color: new THREE.Color(...this.variant.path.color) }); // Immortal: only a little lighter than the loam: a worn path that fades into the shadows
		Object.assign(this.roadMaterial, { map: tex.map, normalMap: tex.normalMap, vertexColors: !!def.roadTile }); // the tile's alpha is per vertex, the strip's is in its texture
		this.roadMaterial.needsUpdate = true;
		const heightAt = (x, z) => this.height(x, z) + 0.025;
		let geometry;
		if (def.roadTile) {
			const tileW = tex.width / def.roadTile.pxPerM;
			const tileH = tex.height / def.roadTile.pxPerM;
			const built = this.tileRibbon(tileW, tileH, heightAt);
			geometry = built.geometry;
			this.roadInfo = { tile: [tileW, tileH], paved: built.paved, stone: 0.55 };
		} else {
			// The strip ribbon is as wide as the variant says (the texture's road fills most of it); the texture's aspect sets the repeat length.
			const width = this.variant.path.width;
			const { width: tw, height: th } = tex.map.image;
			geometry = this.ribbon(this.road, width, width * th / tw, heightAt);
			this.roadInfo = { strip: width };
		}
		const road = new THREE.Mesh(geometry, this.roadMaterial);
		road.name = this.variant.path.name;
		road.receiveShadow = true;
		road.renderOrder = 1;
		this.roadMesh = road;
		this.scene.add(road);
		if (this.shadowFill) road.material = this.shadowFill.apply(road.material);
		this.applyRibbonSettings();
	}

	buildLights() {
		this.moon = new THREE.DirectionalLight(0xffffff, 0.3);
		this.moon.name = 'Moon';
		this.moon.castShadow = true;
		this.moon.shadow.mapSize.set(2048, 2048);
		if (this.variant.softShadows) {
			this.moon.shadow.radius = 4;
			this.moon.shadow.normalBias = 0.05;
		}
		const cam = this.moon.shadow.camera;
		cam.left = cam.bottom = -34;
		cam.right = cam.top = 34;
		cam.near = 1;
		cam.far = 150;
		this.moon.target.position.copy(TARGET);
		this.scene.add(this.moon, this.moon.target);
		this.hemi = new THREE.HemisphereLight(0x3b4f78, 0x161c28, 0.3);
		this.hemi.name = 'Sky / ground ambient';
		this.scene.add(this.hemi);
		// Stand-ins for the moor's fire (the shared mood / fill code touches them): no lights, no shadow maps.
		this.flames = { lightScale: 1, update() {}, dispose() {} };
		this.fireLight = { color: new THREE.Color(), distance: 0, shadow: { intensity: 0 } };
		this.torchLights = [];
		this.propLights = [];
		this.heroLight = new THREE.PointLight(0xffffff, 0, 12, 1.2);
		this.heroLight.name = 'Player light radius';
		this.heroLight.visible = false;
		this.scene.add(this.heroLight);
		this.lights = [
			{ name: 'Moon', light: this.moon, kelvin: 9000, base: 0.3 },
			{ name: 'Sky ambient', light: this.hemi, base: 0.3 },
		];
	}

	buildGroundBlend() {
		const rocks = new Set(this.rockCells.children);
		this.groundBlend = new GroundBlend(this.app, { ground: this.ground, terrain: this.terrain, heightAt: (x, z) => this.height(x, z), splat: this.splat });
		this.groundBlend.setAssets([...this.trees, ...rocks], (mesh) => (rocks.has(mesh) ? GROUND_PROFILES.rock : GROUND_PROFILES.tree));
	}

	wetRoots() {
		return [this.ground, this.treeCells, this.rockCells, this.grass, ...this.shrubs, ...(this.cards ? [this.cards] : [])];
	}

	async applyTime() {
		const t = this.times[this.settings.time] || Object.values(this.times)[0];
		const elev = THREE.MathUtils.degToRad(t.sunElev);
		const az = THREE.MathUtils.degToRad(t.sunAz);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(TARGET).addScaledVector(dir, 60);
		this.moon.color.copy(kelvinToColor(t.moonK));
		this.lights[0].kelvin = t.moonK;
		this.lights[0].base = t.moon;
		this.lights[1].base = t.hemi;
		this.hemi.color.set(t.sky);
		this.hemi.groundColor.set(t.ground);
		this.applyRigIntensity();
		this.heroLight.visible = !!t.hero && !this.mood;
		Object.assign(this.heroLight, { distance: t.hero.distance, decay: t.hero.decay, intensity: t.hero.intensity });
		this.heroLight.color.set(t.hero.color);
		this.heroHeight = t.hero.height;
		this.sun.direction.copy(dir);
		this.updateGrassShadow();
		this.sun.color.copy(this.moon.color).multiplyScalar(t.sun);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		this.scene.environment = env;
		this.scene.background = env;
		this.scene.environmentIntensity = t.envI;
		this.scene.backgroundIntensity = t.bgI;
		this.scene.backgroundBlurriness = 0.08;
		this.postDefaults = { toneMapping: t.toneMapping, exposure: t.exposure, fog: { enabled: true, height: 0, ...t.fog }, grade: { vignette: 0.35, ...t.grade } };
	}

	/** Shadow fill on the ground, path, trees, rocks, grass and shrubs (each distinct material once). */
	applyFill() {
		this.updateFill();
		const meshes = [this.ground, this.roadMesh, ...this.trees, ...this.rockCells.children, this.grass, ...this.shrubs].filter((m) => m?.isMesh);
		this.swapMaterials(meshes, (m) => this.shadowFill.apply(m));
	}

	update(delta, elapsed) {
		if (this.heroLight.visible) {
			this.app.subject.root.getWorldPosition(this.heroLight.position);
			this.heroLight.position.y += this.heroHeight ?? 3;
		}
		this.groundBlend?.update();
	}

	buildLightingControls(folder, rebuildLights) {
		if (this.mood) return;
		const s = this.settings;
		folder.add(s, 'time', Object.fromEntries(Object.entries(this.times).map(([id, t]) => [t.label, id]))).name('Time of day').onChange(async () => {
			this.app.settings.changed(this.id);
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
	}

	dispose() {
		this.groundBlend?.dispose();
		this.scene.traverse((o) => o.geometry?.dispose());
		this.splat.dispose();
		// Materials this scene made: kit clones, the cards, the path ribbon and the wind / shadow-fill wrappers of them.
		for (const m of this.kitMaterials?.values() ?? []) m.dispose();
		for (const m of this.wrapped ?? []) m.dispose();
		for (const m of [this.cardBase, this.cardWind, this.cardMaterial, this.roadMaterial]) m?.dispose();
	}
}

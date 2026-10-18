// Act I · Weeping Fields — the colour-rule test map (rule sheet "Quy tắc màu cho gameplay và môi trường" of The Dying
// Gods · Act I; docs/HUONG_DAN.md §7b). Valdren Core Kit as the base, Redbound + Blightbeasts on top, as the sheet
// pairs them for this area: a farm on moss-green fields; the farmhouse by the well taken by the Remnant (god-blood
// veins run from the well under the footing, up through the floor and along the wall cracks) beside its untouched
// twin; the barn the Redbound keep as a pen; a small Redbound nest round the blood well; a meadow for the
// "12 Redbound on grass" check; a wolf den and crows at a carcass (Blightbeasts); the road with a wayside shrine and a
// waypoint (interactables).
// Rule tools (Environment tab → Rules): palette panel, gameplay class view, looping telegraphs, interact glint by
// proximity, a swatch sampler on the grass, Redbound stand-in crowds, checklist camera views. The readability check
// views (value / colour vision) live in Post & camera and work in every scene.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { FlameField } from '../env/flames.js';
import { TerrainSplat, createTerrainMaterial, loadPaintedSets, loadRibbonTextures, loadGrassCards, grassCardGeometry, proceduralSets, TERRAIN_SETS, BRUSH_LAYERS_BLOOD } from '../env/terrain.js';
import * as kit from '../env/kit.js';
import * as V from '../env/valdren.js';
import { Telegraph, Ring, Disc, groundLabel, decalTexture } from '../env/signals.js';
import { createMonster, modelsReady } from '../procedural/models.js';
import { useNodeMaterial } from '../procedural/nodeMaterial.js';
import { CHECK_VIEWS } from '../core/lut.js';
import { matchDisplay, asShown, displayKey } from '../core/displayMatch.js';
import { note } from '../ui/gui.js';

registerDefaults('weeping', {
	look: 0,
	time: 'overcast',
	paletteLock: true,
	roadRuts: true,
	rutsOpacity: 0.9,
	creekWater: true,
	waterLevel: 0.28,
	waterOpacity: 0.7,
	waterFlow: 0.1,
	grassDensity: 1,
	edgeCards: 1,
	wind: 0.3,
	softness: 0.24,
	heightBlend: 0.45,
	variation: 1,
	macro: 0.25,
	edgeNoise: 0.5,
	splatBlur: 3,
	water: 0.18,
	waterRough: 0.15,
	damp: 0.25,
	ao: 0.6,
	grassShadow: 0.55,
	grassLift: 0.08,
	grassBlade: 0.18,
	showWeights: false,
	// Remnant corruption
	blood: 1,
	bloodTint: '#ffc4bc', // linear multiplier (1, 0.55, 0.5) shown as sRGB: the ground turns red-brown but stays in its value band
	veinColor: '#5a1f21',
	veins: true,
	wellPulse: 0.4,
	// Rule tools
	classView: false,
	telegraphs: true,
	sampler: true,
	glint: true,
	glintStrength: 1,
	signalMatch: true, // signal decals display their hex (tone mapping compensated, core/displayMatch.js)
	crowdMeadow: false,
	crowdWell: false,
	view: 'overview',
	// Lighting extras
	cartFire: true,
	lanterns: 1,
	shadowStrength: 0.6,
	fill: true,
	fillStrength: 1.2,
	fillColor: '#4c5a50',
	fillThreshold: 0.08,
	// Brush
	paint: false,
	brushLayer: 'blood',
	brushRadius: 2.5,
	brushStrength: 0.35,
	brushHardness: 0.35,
	brushNoise: 0.5,
});

const SIZE = 128;
const LOOK = 1;
const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};
const v3 = (x, z) => new THREE.Vector3(x, 0, z);

// Layout (metres; x east, z south — the game camera looks from the south-east, so tall things stand north / west).
const WELL = v3(2, -14);
const HOUSE = { w: 8, d: 5.6, door: -0.6, seed: 31 }; // both houses: same build, the corrupted one changed by the blood
const HOUSES = [
	{ id: 'normal', x: -12, z: -21, corrupted: false },
	{ id: 'corrupted', x: 10.5, z: -21, corrupted: true },
];
const BARN = { x: -1, z: -34, w: 10, d: 7 };
const MEADOW = v3(31, -15);
const DEN = v3(43, -37);
const CARCASS = v3(37.5, -24);
const FIELD = { x0: -37, x1: -17, z0: -9, z1: 6 };
const SHRINE = v3(-20, 18);
const WAYPOINT = v3(-5, 15.5);
const CART = v3(-5, -10);
const SHACK = v3(17.5, -14.5);
const SPAWN = v3(1, 8.5);
const SAMPLER = { x: 0, z: 22, step: 4.2 };
const TENTS = [['tattered', -4.5, -7, 0.5], ['lean_to', 9.5, -9, -0.6], ['sagging', -8.5, -14.5, 1.3]];

/**
 * Time-of-day presets. Overcast is the neutral palette check (the rule sheet: judge colours in neutral light); the
 * key light comes from screen upper-left (west) for every preset (art-direction/04: one light direction).
 */
export const WEEPING_TIMES = {
	overcast: {
		label: 'Overcast · neutral palette check', sunK: 6500, sun: 1.3, sunElev: 50, sunAz: -90, hemi: 1.0, sky: '#a3aaa4', ground: '#3d362b',
		env: 'hdri-overcast', envI: 0.45, bgI: 0.3, exposure: -0.2, fire: 0.25, lanterns: 0.15, fireDistance: 10,
		fog: { color: '#727873', density: 0.016, falloff: 0.22, start: 20, inscatter: 0.1 },
		grade: { vignette: 0.32, contrast: 1, saturation: 1, lift: 0, temperature: 0, tint: 0 },
	},
	dusk: {
		label: 'Dusk · weeping fog', sunK: 2900, sun: 2.4, sunElev: 11, sunAz: -100, hemi: 0.55, sky: '#7d7b74', ground: '#2f2920',
		env: 'hdri-overcast', envI: 0.22, bgI: 0.15, exposure: 0.2, fire: 0.85, lanterns: 0.75, fireDistance: 13,
		fog: { color: '#544d45', density: 0.042, falloff: 0.32, start: 9, inscatter: 1.1 },
		grade: { vignette: 0.5, contrast: 1.02, saturation: 0.95, lift: 0, temperature: 0.05, tint: 0 },
	},
	night: {
		label: 'Night · light radius (D2R)', sunK: 7800, sun: 3.2, sunElev: 46, sunAz: -70, hemi: 1.4, sky: '#46665a', ground: '#262016',
		env: 'hdri-night', envI: 0.06, bgI: 0, exposure: -0.45, fire: 1, lanterns: 1, fireDistance: 14,
		hero: { color: '#cfd8d6', intensity: 28, distance: 12, decay: 1.3, height: 3.2 },
		fog: { color: '#232c28', density: 0.032, falloff: 0.3, start: 12, inscatter: 0.15 },
		grade: { vignette: 0.66, contrast: 1.05, saturation: 1, lift: -0.006, temperature: -0.1, tint: -0.08 },
	},
};

/** Checklist camera views (rule sheet VII) — game ¾ framing: the camera sits south-east of the target. */
const VIEWS = {
	overview: { label: 'Tổng quan trang trại (game ¾)', target: [2, 0, -15], distance: 34 },
	meadow: { label: 'VII · Đồng cỏ + 12 Redbound (stand-in)', target: [31, 0.6, -15], distance: 17, crowd: 'meadow' },
	well: { label: 'Redbound trên nền nhiễm huyết (giếng)', target: [3, 0.6, -12.5], distance: 14, crowd: 'well' },
	houses: { label: 'Nhà thường ↔ nhà bị thần huyết xâm thực', target: [-0.5, 1.5, -19.5], distance: 25 },
	nest: { label: 'Tổ Redbound · vật thể gameplay', target: [6, 0.6, -12], distance: 18 },
	wild: { label: 'Blightbeasts · hang sói, quạ, đường thú', target: [39, 1, -27], distance: 21 },
	interact: { label: 'Điểm tương tác · miếu, waypoint', target: [-12, 0.5, 16.5], distance: 17 },
	sampler: { label: 'Bảng mẫu 6 màu chức năng trên cỏ', target: [11, 0, 23], distance: 25 },
};

/** Redbound stand-ins (the Groveling = small red hunched skirmisher, its shaman = caster, the Pit Fiend = brute). */
const CROWDS = {
	meadow: [
		['imp', -3, -1], ['imp', -1.4, -2.6], ['imp', 0.3, -0.8], ['imp', 1.8, -2.2], ['imp', 3.2, -0.4], ['imp', -2.2, 1.3],
		['imp', -0.3, 1.6], ['imp', 2.1, 1.2], ['imp_shaman', -4.2, -3.6], ['imp_shaman', 4.4, -3.2], ['brute', -1.2, -5.2], ['brute', 2.6, -5.6],
	],
	well: [['imp', 0.2, 2.6], ['imp', 1.8, 1.4], ['imp', -1.5, 3.4], ['imp', 3.4, 3.2], ['imp_shaman', -2.6, 1.0], ['brute', 1.4, 4.8]],
};
const CROWD_CENTER = { meadow: MEADOW, well: v3(2.5, -13) };

/**
 * Both faces of a blade geometry with the same (upward) normals: a DoubleSide material flips the normal of back faces
 * (down → unlit, black blades), so the back faces are real triangles here and the material stays FrontSide.
 */
function twoSided(geometry) {
	const g = geometry.index ? geometry.toNonIndexed() : geometry;
	const out = new THREE.BufferGeometry();
	for (const [name, attr] of Object.entries(g.attributes)) {
		const n = attr.count;
		const size = attr.itemSize;
		const data = new Float32Array(n * size * 2);
		data.set(attr.array, 0);
		for (let t = 0; t < n; t += 3) {
			for (const [k, src] of [[0, t], [1, t + 2], [2, t + 1]]) data.set(attr.array.subarray(src * size, src * size + size), (n + t + k) * size);
		}
		out.setAttribute(name, new THREE.BufferAttribute(data, size));
	}
	return out;
}

const ribbonGeometry = (points, width, tile, y, across = 9, alpha = null) => {
	const pos = [];
	const uv = [];
	const color = [];
	const index = [];
	let along = 0;
	points.forEach((p, k) => {
		if (k) along += p.distanceTo(points[k - 1]);
		const a = points[Math.max(0, k - 1)];
		const b = points[Math.min(points.length - 1, k + 1)];
		const dx = b.x - a.x;
		const dz = b.z - a.z;
		const len = Math.hypot(dx, dz) || 1;
		for (let j = 0; j < across; j++) {
			const t = j / (across - 1);
			const o = (t - 0.5) * width;
			const x = p.x - (dz / len) * o;
			const z = p.z + (dx / len) * o;
			pos.push(x, y(x, z, p), z);
			uv.push(t, along / tile);
			if (alpha) color.push(1, 1, 1, alpha(x, z));
			if (k && j) {
				const c = k * across + j;
				index.push(c - across - 1, c - across, c - 1, c - across, c, c - 1);
			}
		}
	});
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	if (alpha) g.setAttribute('color', new THREE.Float32BufferAttribute(color, 4));
	g.setIndex(index);
	g.computeVertexNormals();
	return g;
};

export class WeepingFieldsScene {
	constructor(app) {
		this.app = app;
		this.id = 'weeping';
		this.label = 'Act I · Weeping Fields (colour rules)';
		this.moodKind = 'exterior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'Weeping Fields';
		this.settings = app.settings.adopt('weeping');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group();
		this.vfx.name = 'Weeping Fields VFX';
		this.home = this.viewCamera(VIEWS.overview);
		this.sun = { direction: new THREE.Vector3(), color: new THREE.Color() };
		this.lights = [];
		this.postDefaults = null;
		const curve = (pts, n = 180) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))).getSpacedPoints(n);
		this.road = curve([[-66, 34], [-44, 24], [-24, 15], [-6, 9.5], [10, 5], [26, -2], [42, -12], [54, -22], [66, -30]]);
		this.creek = curve([[-38, -66], [-42, -40], [-49, -14], [-47, 8], [-54, 30], [-50, 66]]);
		this.trail = curve([[41, -33], [38.5, -28], [37, -24.5], [33, -19], [27, -11], [22, -5]], 60);
		// God-blood trunk on the ground: well → the corrupted house's footing (then under it, see buildVeins).
		this.veinPath = curve([[WELL.x, WELL.z], [4.6, -16.2], [6.9, -18.2]], 30);
		this.roadField = this.distanceField(this.road);
		this.creekField = this.distanceField(this.creek);
		this.trailField = this.distanceField(this.trail);
		this.splat = new TerrainSplat({ size: 512, originX: -SIZE / 2, originZ: -SIZE / 2, extent: SIZE });
		this.stroke = null;
		this.telegraphs = [];
		this.crowds = {};
		this.time = 0;
	}

	/** Orbit camera for a VIEWS entry: game ¾ angle (45° azimuth, ~52° from vertical). */
	viewCamera(view) {
		const target = new THREE.Vector3(...view.target);
		const offset = new THREE.Vector3().setFromSphericalCoords(view.distance, THREE.MathUtils.degToRad(52), THREE.MathUtils.degToRad(45));
		return { position: target.clone().add(offset), target };
	}

	distanceField(samples, cell = 0.5) {
		const n = Math.round(SIZE / cell) + 1;
		const field = new Float32Array(n * n);
		for (let j = 0; j < n; j++) {
			for (let i = 0; i < n; i++) {
				const x = -SIZE / 2 + i * cell;
				const z = -SIZE / 2 + j * cell;
				let best = Infinity;
				for (const p of samples) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2);
				field[j * n + i] = Math.sqrt(best);
			}
		}
		return { field, n, cell };
	}

	lookup({ field, n, cell }, x, z) {
		const fx = Math.min(n - 1.001, Math.max(0, (x + SIZE / 2) / cell));
		const fz = Math.min(n - 1.001, Math.max(0, (z + SIZE / 2) / cell));
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		const tx = fx - i;
		const tz = fz - j;
		const a = field[j * n + i] * (1 - tx) + field[j * n + i + 1] * tx;
		const b = field[(j + 1) * n + i] * (1 - tx) + field[(j + 1) * n + i + 1] * tx;
		return a * (1 - tz) + b * tz;
	}

	roadDistance(x, z) {
		return this.lookup(this.roadField, x, z);
	}

	creekDistance(x, z) {
		return this.lookup(this.creekField, x, z);
	}

	trailDistance(x, z) {
		return this.lookup(this.trailField, x, z);
	}

	veinDistance(x, z) {
		let best = Infinity;
		for (const p of this.veinPath) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2);
		return Math.sqrt(best);
	}

	height(x, z, road = this.roadDistance(x, z), creek = this.creekDistance(x, z)) {
		let h = kit.noise2(x * 0.028, z * 0.028, 21) * 1.3 + kit.noise2(x * 0.085, z * 0.085, 22) * 0.35 + kit.noise2(x * 0.3, z * 0.3, 24) * 0.05;
		h += 1.8 * smooth(-24, -60, z); // the land rises behind the farm (north): a natural back wall for the frame
		h += 2.6 * (1 - smooth(5, 14, Math.hypot(x - DEN.x, z - DEN.z))); // the den's rocky rise
		// Calm pads where the action is: farmstead yard, meadow arena, fields, the road shoulder by the spawn.
		const pad = Math.max(
			1 - smooth(13, 20, Math.hypot(x - 0, (z + 21) * 1.2)),
			1 - smooth(9, 14, Math.hypot(x - MEADOW.x, z - MEADOW.z)),
			1 - smooth(4, 9, Math.max(FIELD.x0 - x, x - FIELD.x1, FIELD.z0 - z, z - FIELD.z1, 0) + 4),
			1 - smooth(8, 14, Math.hypot(x - SPAWN.x, z - SPAWN.z)),
		);
		h *= 1 - 0.8 * pad;
		h -= 0.7 * (1 - smooth(0.6, 4.5, creek));
		const r = 1 - smooth(1.6, 4, road);
		h = h * (1 - 0.6 * r) - 0.06 * (1 - smooth(0.8, 1.8, road));
		return h;
	}

	/** Generated layer weights at world xz: [wet, grass, blood]. */
	weights(x, z) {
		const road = this.roadDistance(x, z);
		const creek = this.creekDistance(x, z);
		const h = this.height(x, z, road, creek);
		const e = 0.6;
		const slope = Math.hypot(this.height(x + e, z) - this.height(x - e, z), this.height(x, z + e) - this.height(x, z - e)) / (2 * e);
		const big = kit.noise2(x * 0.07, z * 0.07, 11) * 0.5 + 0.5;
		const fine = kit.noise2(x * 0.4, z * 0.4, 12) * 0.5 + 0.5;
		const spots = kit.noise2(x * 0.12, z * 0.12, 13) * 0.5 + 0.5;
		const dWell = Math.hypot(x - WELL.x, z - WELL.z);
		const yard = 1 - smooth(8, 14, Math.hypot(x - 0, (z + 20) * 1.2));
		const meadow = 1 - smooth(8, 11.5, Math.hypot(x - MEADOW.x, z - MEADOW.z));
		const field = 1 - smooth(-0.5, 1.5, Math.max(FIELD.x0 - x, x - FIELD.x1, FIELD.z0 - z, z - FIELD.z1));
		const rooting = smooth(0.62, 0.8, kit.noise2(x * 0.3, z * 0.3, 17) * 0.5 + 0.5) * (1 - smooth(3, 7, Math.hypot(x - 39, z + 10)));

		// Wet: creek banks, hollows, ruts, puddles, the trampled mud round the well and the barn door, furrows, rooting.
		const creekWet = 1 - smooth(0.8, 4, creek + (fine - 0.5) * 2.2);
		const low = smooth(-0.25, -0.9, h) * 0.85;
		const rut = (1 - smooth(0.12, 0.42, Math.abs(road - 0.75))) * (0.45 + 0.55 * big) * smooth(2.5, 1.0, road);
		const patches = smooth(0.76, 0.88, spots + (fine - 0.5) * 0.2) * 0.75;
		const mud = (1 - smooth(1.5, 6.5, dWell + (fine - 0.5) * 2)) * 0.9;
		const barnMud = (1 - smooth(1, 5, Math.hypot(x - BARN.x, (z - (BARN.z + 4.6)) * 1.4) + (fine - 0.5) * 1.5)) * 0.85;
		const furrow = field * (Math.sin(z * Math.PI * 2) > 0.2 ? 0.55 : 0.12);
		let wet = Math.max(creekWet, low, rut * 0.95, patches, mud, barnMud, furrow, rooting * 0.9);
		wet *= 1 - meadow * 0.75 * (1 - rooting);

		// Grass: moss patches, none on the road (but its middle strip), trodden round the farm, dead where blood soaked in.
		let grass = Math.max(smooth(0.3, 0.6, big + (fine - 0.5) * 0.4), 0.42);
		grass *= 1 - (1 - smooth(1.3, 2.7, road + (fine - 0.5) * 0.9));
		grass = Math.max(grass, (1 - smooth(0.15, 0.45, road)) * (0.55 + 0.45 * smooth(0.3, 0.7, fine)));
		grass *= 1 - smooth(0.35, 0.7, slope);
		grass *= 1 - Math.min(1, creekWet + low + patches + mud + barnMud) * 0.75;
		grass *= 1 - yard * 0.55;
		grass *= 1 - field * 0.92;
		grass *= 1 - (1 - smooth(0.35, 1.4, this.trailDistance(x, z) + (fine - 0.5) * 0.6)) * 0.85;
		grass *= smooth(2.5, 6.5, Math.hypot(x - DEN.x + 2, z - DEN.z - 4));
		grass = Math.max(grass, meadow * 0.95);
		grass *= 1 - rooting;

		// Blood-soaked ground: round the well, along the trunk to the corrupted house, a few splashes in the nest only.
		const core = 1 - smooth(1.4, 4.8, dWell + (fine - 0.5) * 1.8);
		const trunk = 1 - smooth(0.4, 1.9, this.veinDistance(x, z) + (fine - 0.5) * 0.7);
		const splash = smooth(0.82, 0.93, kit.noise2(x * 0.3, z * 0.3, 19) * 0.5 + 0.5) * (1 - smooth(7, 11, dWell)) * 0.75;
		const blood = Math.max(core, trunk * 0.92, splash);
		grass *= 1 - smooth(0.2, 0.7, blood);
		return [wet, grass, blood];
	}

	/** Inside a building / prop footprint (grass, shrubs, rocks stay out). */
	blocked(x, z, pad = 0) {
		for (const f of this.footprints ?? []) {
			if (f.r !== undefined ? Math.hypot(x - f.x, z - f.z) < f.r + pad : Math.abs(x - f.x) < f.hw + pad && Math.abs(z - f.z) < f.hd + pad) return true;
		}
		return false;
	}

	async init() {
		const app = this.app;
		this.mat = V.valdrenMaterials(app);
		this.scene.add(this.anchor);
		this.anchor.position.set(SPAWN.x, this.height(SPAWN.x, SPAWN.z) + 0.02, SPAWN.z);
		const s = this.settings;
		if (s.look !== LOOK) {
			delete app.settings.data.scenePost?.weeping;
			s.look = LOOK;
		}
		this.footprints = [
			...HOUSES.map((h) => ({ x: h.x, z: h.z, hw: HOUSE.w / 2 + 0.4, hd: HOUSE.d / 2 + 0.6 })),
			{ x: BARN.x, z: BARN.z, hw: BARN.w / 2 + 0.4, hd: BARN.d / 2 + 0.5 },
			{ x: WELL.x, z: WELL.z, r: 1.4 },
			{ x: WAYPOINT.x, z: WAYPOINT.z, r: 2.6 },
			{ x: SHRINE.x, z: SHRINE.z, r: 1.2 },
			{ x: CART.x, z: CART.z, r: 2.2 },
			{ x: SHACK.x, z: SHACK.z, r: 2.2 },
			...TENTS.map(([, x, z]) => ({ x, z, r: 2.4 })),
			// The swatch sampler: no rocks, tufts or shrubs on the discs.
			...Object.keys(V.FUNCTION).map((_, i) => ({ x: SAMPLER.x + i * SAMPLER.step, z: SAMPLER.z, r: 1.7 })),
		];
		this.splat.blur = s.splatBlur;
		this.generateSplat();
		await this.buildTerrain();
		await this.buildRibbons();
		this.kits = await this.loadKits();
		this.buildWorld();
		this.buildVeins();
		await this.loadCards();
		this.buildGrass();
		this.buildShrubs();
		this.buildTrees();
		this.buildLights();
		this.buildSignals();
		this.refreshSignalColors();
		this.buildCursor();
		this.windGrass = app.backend.effects.create('wind', { strength: s.wind, height: 1, frequency: 1.9 });
		this.windTrees = app.backend.effects.create('wind', { strength: s.wind * 0.35, height: 6, frequency: 0.9, gust: 0.8 });
		this.windShrubs = app.backend.effects.create('wind', { strength: s.wind * 0.6, height: 1.2, frequency: 1.4, gust: 0.6 });
		this.windCloth = app.backend.effects.create('wind', { strength: s.wind * 0.7, height: 1.1, frequency: 2.4, gust: 0.7 });
		this.grass.material = this.windGrass.apply(this.grass.material);
		this.treeMaterial = this.windTrees.apply(this.treeMaterial);
		for (const t of this.trees) t.material = this.treeMaterial;
		if (this.shrubs.length) {
			const material = this.windShrubs.apply(this.shrubs[0].material);
			for (const m of this.shrubs) m.material = material;
		}
		if (this.cloth) this.cloth.material = this.windCloth.apply(this.cloth.material);
		this.shadowFill = app.backend.effects.createShadowFill();
		this.applyFill();
		this.applyGlintPatches();
		this.buildCards();
		this.applyLayerSettings();
		this.applyCorruption();
		this.applyRuleViews();
		await this.applyTime();
	}

	generateSplat() {
		this.splat.fill((x, z) => this.weights(x, z));
	}

	/** Painted moor layers, palette-locked to Valdren earth / mud / moss (or as painted; procedural as a fallback). */
	async layerSets() {
		try {
			const sets = await loadPaintedSets(this.app, 'moor');
			if (!this.settings.paletteLock) return sets;
			this.lockedSets ??= V.lockTerrainSets(sets, [V.VALDREN.earth, V.VALDREN.mud, V.VALDREN.moss]);
			return this.lockedSets;
		} catch (error) {
			console.error('Painted terrain textures failed to load, using the procedural set', error);
			return proceduralSets(this.app);
		}
	}

	async buildTerrain() {
		const segs = 224;
		const g = new THREE.PlaneGeometry(SIZE, SIZE, segs, segs);
		g.rotateX(-Math.PI / 2);
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) pos.setY(i, this.height(pos.getX(i), pos.getZ(i)));
		g.computeVertexNormals();
		const { material, effect } = createTerrainMaterial(this.app, this.splat, await this.layerSets());
		material.name = 'Weeping Fields terrain (splat: dirt · wet · grass · blood)';
		this.terrain = effect;
		this.ground = new THREE.Mesh(g, material);
		this.ground.name = 'Terrain (splat)';
		this.ground.receiveShadow = true;
		this.scene.add(this.ground);
	}

	async setPaletteLock(on) {
		this.settings.paletteLock = on;
		this.terrain.setLayers(await this.layerSets());
		this.rebuildGrass();
		this.app.settings.changed('weeping');
	}

	/** Road ruts (lighter than the ground: it guides without glowing, rule II.2) and the creek along the west edge. */
	async buildRibbons() {
		let tex;
		try {
			tex = await loadRibbonTextures(this.app, TERRAIN_SETS.moor.ribbons);
		} catch (error) {
			console.error('Ribbon textures failed to load; road and creek stay splat-only', error);
			return;
		}
		this.roadMaterial = new THREE.MeshStandardMaterial({ name: 'Road ruts (ribbon)', map: tex.ruts.map, normalMap: tex.ruts.normalMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.8, metalness: 0 });
		this.roadMaterial.color.setRGB(1.32, 1.26, 1.18); // path swatch: a step lighter than the earth around it
		this.roadMesh = new THREE.Mesh(ribbonGeometry(this.road, 4, 6.7, (x, z) => this.height(x, z) + 0.025), this.roadMaterial);
		this.roadMesh.name = 'Road ruts (ribbon)';
		this.roadMesh.receiveShadow = true;
		this.roadMesh.renderOrder = 1;
		this.scene.add(this.roadMesh);
		this.waterMaterial = new THREE.MeshStandardMaterial({ name: 'Creek water (ribbon)', map: tex.water.map, alphaMap: tex.water.alphaMap, vertexColors: true, transparent: true, depthWrite: false, roughness: 0.08, metalness: 0, envMapIntensity: 1.5 });
		const ford = (x, z) => smooth(3, 7, this.roadDistance(x, z)); // the road fords the creek: dry stones there
		this.waterMesh = new THREE.Mesh(ribbonGeometry(this.creek, 6, 5, (x, z, c) => this.height(c.x, c.z) + this.settings.waterLevel, 5, ford), this.waterMaterial);
		this.waterMesh.name = 'Creek water (ribbon)';
		this.waterMesh.receiveShadow = true;
		this.waterMesh.renderOrder = 2;
		this.scene.add(this.waterMesh);
		this.applyRibbonSettings();
	}

	applyRibbonSettings() {
		const s = this.settings;
		if (this.roadMesh) {
			this.roadMesh.visible = s.roadRuts;
			this.roadMaterial.opacity = s.rutsOpacity;
		}
		if (this.waterMesh) {
			this.waterMesh.visible = s.creekWater;
			this.waterMaterial.opacity = s.waterOpacity;
		}
	}

	/** Prop kits split from the project's prop sheets: { fence, palisade, tents, shrubs } → { name: Mesh }. */
	async loadKits() {
		const kits = {};
		for (const [key, id] of [['fence', 'kit-wooden-fence'], ['tents', 'kit-tents'], ['shrubs', 'kit-shrubs']]) {
			try {
				const gltf = await this.app.loader.loadLibrary(id);
				const pieces = {};
				gltf.scene.traverse((o) => {
					if (o.isMesh) pieces[o.name.replace(/^[a-z]+_\d+_/, '')] = o;
				});
				for (const mesh of Object.values(pieces)) mesh.geometry.computeBoundingBox();
				kits[key] = pieces;
			} catch (error) {
				console.error(`Prop kit "${id}" failed to load; the scene goes without it`, error);
			}
		}
		return kits;
	}

	/**
	 * Kit GLB material palette-locked to a swatch (one clone per source material and swatch): its texture is recoloured
	 * to the swatch's hue and chroma, keeping a quarter of its own colour (V.lockTexture), the tint stays white.
	 */
	kitMaterial(source, hex, name) {
		this.kitMaterials ??= new Map();
		const key = `${source.uuid}:${hex}`;
		if (!this.kitMaterials.has(key)) {
			const m = source.clone();
			m.name = name;
			if (source.map) {
				m.map = V.lockTexture(source.map, hex, 0.25);
				m.color = m.map === source.map ? V.lockColor(source.map, hex) : new THREE.Color(1, 1, 1);
			} else m.color = new THREE.Color(hex);
			m.userData.swatch = hex;
			this.kitMaterials.set(key, m);
		}
		return this.kitMaterials.get(key);
	}

	/** Lowest ground under a kit piece (pivot at its bottom centre, length along +x), turned by yaw. */
	kitY(mesh, x, z, yaw) {
		const len = (mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x) / 2;
		return Math.min(this.height(x, z), this.height(x + Math.cos(yaw) * len, z - Math.sin(yaw) * len), this.height(x - Math.cos(yaw) * len, z + Math.sin(yaw) * len));
	}

	/** Drop Parts into a batch at a world position / yaw (material per key, overrides first). */
	addParts(batch, parts, position, yaw = 0, overrides = {}, opts = {}) {
		for (const [key, geometry] of parts.build()) {
			const material = overrides[key] ?? this.mat[key];
			if (!material) {
				console.warn(`Weeping Fields: no material for part "${key}"`);
				continue;
			}
			batch.add(geometry, material, { position, rotation: [0, yaw, 0], ...opts });
		}
	}

	// ---------------------------------------------------------------------------------------------
	// World

	buildWorld() {
		const m = this.mat;
		const r = kit.rng(2024);
		const B = {
			obstacle: new kit.StaticBatch('Weeping Fields · obstacles'),
			destructible: new kit.StaticBatch('Weeping Fields · destructibles'),
			decor: new kit.StaticBatch('Weeping Fields · decor (walk-through)'),
		};
		this.classMeshes = { obstacle: [], destructible: [], interactive: [], hazard: [] };
		this.interactables = [];
		this.sacs = [];
		this.nests = [];

		// Valdren farmhouses: the same build twice; the one by the well is taken by the god-blood.
		this.houses = HOUSES.map((spec) => {
			let hi = -Infinity;
			let lo = Infinity;
			for (let i = 0; i <= 8; i++) {
				for (let j = 0; j <= 6; j++) {
					const h = this.height(spec.x + (i / 8 - 0.5) * (HOUSE.w + 1), spec.z + (j / 6 - 0.5) * (HOUSE.d + 1.6));
					hi = Math.max(hi, h);
					lo = Math.min(lo, h);
				}
			}
			const y = hi + 0.1;
			const built = V.house({ ...HOUSE, corrupted: spec.corrupted, foot: y - lo + 0.45 });
			this.addParts(B.obstacle, built.parts, [spec.x, y, spec.z]);
			return { ...spec, y, built };
		});
		const [houseN, houseC] = this.houses;
		this.houseC = houseC;

		// Barn the Redbound keep as a pen, and its broken cattle fence.
		{
			let hi = -Infinity;
			let lo = Infinity;
			for (let i = 0; i <= 8; i++) for (let j = 0; j <= 6; j++) {
				const h = this.height(BARN.x + (i / 8 - 0.5) * (BARN.w + 1), BARN.z + (j / 6 - 0.5) * (BARN.d + 1));
				hi = Math.max(hi, h);
				lo = Math.min(lo, h);
			}
			this.barnY = hi + 0.06;
			this.addParts(B.obstacle, V.barn({ w: BARN.w, d: BARN.d, foot: this.barnY - lo + 0.4 }).parts, [BARN.x, this.barnY, BARN.z]);
		}

		// Blood well (Redbound gathering point, source of the corruption).
		this.wellY = this.height(WELL.x, WELL.z) + 0.02;
		const wellParts = V.well({ blood: true }).parts;
		const liquid = wellParts.byKey.get('wellBlood');
		wellParts.byKey.delete('wellBlood');
		this.addParts(B.obstacle, wellParts, [WELL.x, this.wellY, WELL.z]);
		this.wellLiquid = new THREE.Mesh(kit.worldUV(liquid[0]), m.wellBlood);
		this.wellLiquid.position.set(WELL.x, this.wellY, WELL.z);
		this.wellLiquid.name = 'Blood well liquid';
		this.scene.add(this.wellLiquid);

		const kits = this.kits ?? {};
		const fenceMat = (piece) => this.kitMaterial(piece.material, V.VALDREN.greyWood, 'Weeping Fields grey fence');

		// Cattle pen in front of the barn: grey fence runs, two broken, one gap where the Redbound broke out.
		if (kits.fence) {
			const runs = ['run2', 'rails_post', 'run_sag', 'run_end'].filter((n) => kits.fence[n]);
			const broken = ['run_broken', 'run_fallen', 'broken_pair'].filter((n) => kits.fence[n]);
			const penZ = BARN.z + BARN.d / 2 + 4.2;
			let x = BARN.x - 8;
			for (let i = 0; x < BARN.x + 8 && runs.length; i++) {
				const name = i === 2 || i === 5 ? broken[i % broken.length] : runs[i % runs.length];
				const piece = kits.fence[name] ?? kits.fence[runs[0]];
				const len = piece.geometry.boundingBox.max.x - piece.geometry.boundingBox.min.x;
				if (i !== 3) B.obstacle.add(piece.geometry, fenceMat(piece), { position: [x + len / 2, this.kitY(piece, x + len / 2, penZ, 0) - 0.05, penZ], rotation: [0, 0, 0], uv: 'keep' });
				x += len - 0.08;
			}
			for (const side of [-1, 1]) {
				let z = penZ;
				for (let k = 0; k < 2; k++) {
					const piece = kits.fence[runs[(k + (side > 0 ? 1 : 0)) % runs.length]];
					const len = piece.geometry.boundingBox.max.x - piece.geometry.boundingBox.min.x;
					const px = BARN.x + side * 8.1;
					B.obstacle.add(piece.geometry, fenceMat(piece), { position: [px, this.kitY(piece, px, z - len / 2, Math.PI / 2) - 0.05, z - len / 2], rotation: [0, Math.PI / 2, 0], uv: 'keep' });
					z -= len - 0.08;
				}
			}
			// Road fence north of the road (Valdren grey wood), with gaps at the farm track.
			this.buildRoadFence(B.obstacle, kits.fence, fenceMat, r);
		}

		this.buildFarm(B, r, houseN);
		this.buildNest(B, r, houseC);
		this.buildWilds(B, r);
		this.buildRoadside(B, r);

		// Batches → meshes. Decor is walk-through (no collision), the rest blocks.
		this.groups = {};
		for (const [id, batch] of Object.entries(B)) {
			const group = batch.build(true);
			if (id === 'decor') group.userData.labNoCollide = true;
			this.groups[id] = group;
			this.scene.add(group);
			if (id !== 'decor') this.classMeshes[id].push(...group.children);
		}
		this.buildDecals();
	}

	/** Grey fence runs along the north side of the road between the fields and the meadow, gaps at the farm track. */
	buildRoadFence(batch, pieces, fenceMat, r) {
		const offset = 3.6;
		const line = this.road.map((p, k) => {
			const q = this.road[Math.min(k + 1, this.road.length - 1)];
			const prev = this.road[Math.max(k - 1, 0)];
			const dir = new THREE.Vector3().subVectors(q, prev).setY(0).normalize();
			return new THREE.Vector3(p.x + dir.z * offset, 0, p.z - dir.x * offset);
		});
		const cum = [0];
		for (let k = 1; k < line.length; k++) cum.push(cum[k - 1] + line[k].distanceTo(line[k - 1]));
		const at = (d) => {
			let k = 1;
			while (k < cum.length - 1 && cum[k] < d) k++;
			const t = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
			return line[k - 1].clone().lerp(line[k], Math.min(1, Math.max(0, t)));
		};
		const runs = ['run2', 'run_end', 'rails_post', 'run_sag', 'post_rails_long'].filter((n) => pieces[n]);
		const broken = ['run_broken', 'run_fallen', 'post_lean', 'post_short'].filter((n) => pieces[n]);
		if (!runs.length) return;
		let d = 0;
		while (d < cum[cum.length - 1] - 2) {
			const roll = r();
			const a0 = at(d);
			if (roll < 0.07 || (a0.x > -9 && a0.x < 7) || a0.x < -42 || a0.x > 24) {
				d += 1.5 + r() * 2;
				continue;
			}
			const list = roll < 0.25 && broken.length ? broken : runs;
			const mesh = pieces[list[Math.floor(r() * list.length)]];
			const len = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
			const b = at(d + len);
			const c = a0.clone().lerp(b, 0.5);
			d += len - 0.08;
			if (this.blocked(c.x, c.z, 1) || this.creekDistance(c.x, c.z) < 3) continue;
			const yaw = Math.atan2(a0.z - b.z, b.x - a0.x) + (r() < 0.5 ? Math.PI : 0);
			batch.add(mesh.geometry, fenceMat(mesh), { position: [c.x, this.kitY(mesh, c.x, c.z, yaw) - 0.06, c.z], rotation: [0, yaw, 0], uv: 'keep' });
		}
	}

	/** Valdren core: the untouched farmhouse's yard, the fields, haystacks, the scarecrow, the chest (interactable). */
	buildFarm(B, r, houseN) {
		const hy = houseN.y;
		const front = houseN.z + HOUSE.d / 2;
		// Porch life: barrels, crates, sacks, firewood, a bench; a lantern bracket by the door.
		const put = (batch, built, x, z, yaw = r() * 6, sink = 0.02) => this.addParts(batch, built.parts, [x, this.height(x, z) - sink, z], yaw);
		put(B.destructible, V.barrel(), houseN.x + 2.6, front + 0.7, 0);
		put(B.destructible, V.barrel(), houseN.x + 3.25, front + 0.55, 1);
		put(B.destructible, V.crate(), houseN.x + 3.0, front + 1.4, 0.3);
		put(B.decor, V.sack(), houseN.x - 2.2, front + 0.6);
		put(B.decor, V.sack(), houseN.x - 2.7, front + 0.9);
		const bench = new V.Parts();
		bench.box('plank', 1.6, 0.08, 0.38, { p: [0, 0.46, 0] });
		for (const x of [-0.65, 0.65]) bench.box('timber', 0.08, 0.44, 0.32, { p: [x, 0.22, 0] });
		this.addParts(B.obstacle, bench, [houseN.x - 2.9, hy - 0.02, front + 0.45]);
		const wood = new V.Parts();
		for (let i = 0; i < 9; i++) wood.add('bark', kit.log({ length: 1.1, radius: 0.09 }), { p: [0, 0.1 + Math.floor(i / 4) * 0.17, (i % 4) * 0.19 - 0.3], r: [0, Math.PI / 2, 0] });
		this.addParts(B.obstacle, wood, [houseN.x - HOUSE.w / 2 - 0.45, this.height(houseN.x - HOUSE.w / 2 - 0.45, houseN.z) - 0.02, houseN.z + 0.4]);
		const bracket = new V.Parts();
		bracket.box('iron', 0.05, 0.05, 0.45, { p: [0, 2.35, 0.22] });
		bracket.box('iron', 0.2, 0.26, 0.2, { p: [0, 2.15, 0.45] });
		bracket.add('iron', new THREE.ConeGeometry(0.17, 0.14, 4), { p: [0, 2.35, 0.45], r: [0, Math.PI / 4, 0] });
		const lanternAt = new THREE.Vector3(houseN.x + 0.45, hy, front - 0.1);
		this.addParts(B.obstacle, bracket, lanternAt.toArray());
		this.lanternSpots = [lanternAt.clone().add(new THREE.Vector3(0, 2.15, 0.45))];

		// Chest by the door (interactable).
		const chestPos = v3(houseN.x + 1.45, front + 0.75);
		this.addInteractable('Rương (chest)', V.chest(), chestPos, -0.2, 0.95);

		// Fields: dry-stone walls round the plot with gaps, haystacks, the scarecrow (decor: away from the arena).
		for (const [x0, z0, x1, z1] of [[FIELD.x0, FIELD.z0, FIELD.x1, FIELD.z0], [FIELD.x0, FIELD.z1, FIELD.x1 - 6, FIELD.z1], [FIELD.x0, FIELD.z0, FIELD.x0, FIELD.z1]]) {
			const len = Math.hypot(x1 - x0, z1 - z0);
			const yaw = Math.atan2(-(z1 - z0), x1 - x0);
			for (let d = 2; d < len - 1; d += 4.2) {
				if (r() < 0.22) continue;
				const t = (d + 2) / len;
				const x = x0 + (x1 - x0) * t;
				const z = z0 + (z1 - z0) * t;
				this.addParts(B.obstacle, V.fieldWall(4, Math.round(d * 13 + x0)).parts, [x, this.height(x, z), z], yaw);
			}
		}
		for (const [x, z] of [[-31, -13], [-23, -14.5], [-40, 2]]) put(B.obstacle, V.haystack(), x, z, r() * 6, 0.05);
		put(B.decor, V.scarecrow(), -26, -1, 0.7, 0.1);
		this.footprints.push({ x: -26, z: -1, r: 0.6 }, { x: -31, z: -13, r: 1.6 }, { x: -23, z: -14.5, r: 1.6 }, { x: -40, z: 2, r: 1.6 });
		// A normal (unburnt) cart left in the yard of the whole house.
		put(B.obstacle, V.cart(), houseN.x - 5.5, houseN.z + 6.5, 2.2);
		this.footprints.push({ x: houseN.x - 5.5, z: houseN.z + 6.5, r: 2 });
	}

	/**
	 * Redbound · Bloodbound Settlements, small nest (rule III.1): hide tents, a shack of fence boards, bone stakes and
	 * rings, torn red banners, bones, rusted sickles, the wrecked (burning) cart; gameplay objects: bone alarm drum,
	 * resonance pillar, blood sacs, ambush nests. Everything clusters round the well — the source of the god-blood.
	 */
	buildNest(B, r, houseC) {
		const m = this.mat;
		const kits = this.kits ?? {};
		// Hide tents (patchwork: two hide tints).
		if (kits.tents) {
			TENTS.forEach(([name, x, z, yaw], i) => {
				const piece = kits.tents[name] ?? Object.values(kits.tents)[i];
				if (!piece) return;
				B.obstacle.add(piece.geometry, this.kitMaterial(piece.material, i % 2 ? V.DECOR.hideGrey : V.DECOR.hide, 'Redbound patchwork hide tent'), { position: [x, this.kitY(piece, x, z, yaw) - 0.08, z], rotation: [0, yaw, 0], uv: 'keep' });
			});
		}
		// Shack of fence boards leaning together, hides over it (a weak structure: destructible).
		if (kits.fence) {
			const run = kits.fence.run2 ?? Object.values(kits.fence)[0];
			const y = this.height(SHACK.x, SHACK.z) - 0.1;
			for (const side of [-1, 1]) B.destructible.add(run.geometry, this.kitMaterial(run.material, V.VALDREN.greyWood, 'Weeping Fields grey fence'), { position: [SHACK.x, y, SHACK.z + side * 0.85], rotation: [-side * 0.72, 0, 0], uv: 'keep' });
			const hide = new V.Parts();
			hide.box('hide', 2.6, 0.04, 1.25, { p: [0, 1.15, -0.42], r: [0.85, 0, 0] });
			hide.box('hideGrey', 1.9, 0.04, 1.1, { p: [0.3, 1.1, 0.45], r: [-0.85, 0, 0] });
			this.addParts(B.destructible, hide, [SHACK.x, y + 0.1, SHACK.z]);
		}
		// Bone stakes ring the well and mark the nest at the barn door and the farm track.
		const stakes = [[-3.2, -10.2], [6.6, -10.8], [-4.2, -17.6], [5.4, -19.2], [7.8, -13.5], [-2.2, -26.8], [3.6, -26.6], [-1.5, -3.2], [4.4, -2.6]];
		stakes.forEach(([x, z], i) => {
			const built = V.boneStake({ height: 1.7 + r() * 0.5, ring: i % 3 !== 2, seed: 70 + i });
			this.addParts(B.decor, built.parts, [x, this.height(x, z) - 0.05, z], -Math.PI / 4 + (r() - 0.5) * 0.6);
		});
		// Torn banners (hanging cloth sways: instanced in buildCloth) — the poles and bars go in the decor batch.
		this.banners = [[-6.2, -9.0, 0.6], [11.2, -11.4, -0.4], [-0.8, -28.2, 0.1], [14.6, -16.4, 0.3]];
		for (const [x, z, yaw] of this.banners) {
			const built = V.tatteredBanner({ seed: Math.round(x * 7) });
			built.parts.byKey.delete('redCloth');
			this.addParts(B.decor, built.parts, [x, this.height(x, z) - 0.15, z], yaw);
		}
		// Bones and sickles in the trampled mud.
		const decor = new V.Parts();
		const scatter = (n, rad, fn) => {
			for (let i = 0; i < n; i++) {
				const a = r() * Math.PI * 2;
				const d = 2 + Math.sqrt(r()) * rad;
				const x = WELL.x + Math.cos(a) * d;
				const z = WELL.z + Math.sin(a) * d;
				if (this.blocked(x, z, 0.3)) continue;
				fn(x, z, a);
			}
		};
		scatter(14, 8, (x, z) => decor.merge(V.longBone(0.35 + r() * 0.3), { p: [x, this.height(x, z) + 0.02, z], r: [0, r() * 6, 0] }));
		scatter(4, 7, (x, z) => decor.merge(V.cowSkull(), { p: [x, this.height(x, z) + 0.06, z], r: [0.3 + r() * 0.3, r() * 6, r() * 0.4] }));
		for (const [x, z, yaw] of [[-1.8, -21.5, 0.4], [8.6, -6.2, 2.1]]) decor.merge(V.ribcage(Math.round(x * 3)), { p: [x, this.height(x, z) - 0.05, z], r: [0, yaw, 0] });
		for (const [x, z] of [[-3.1, -8.4], [10.6, -10.6], [6.2, -7.6]]) {
			const sickle = new V.Parts();
			sickle.add('rust', new THREE.TorusGeometry(0.22, 0.014, 4, 16, 3.5), { s: [1, 1, 0.5] });
			sickle.rod('timber', [0.22, 0, 0], [0.55, 0.02, 0], 0.02, 0.02, 5);
			decor.merge(sickle, { p: [x, this.height(x, z) + 0.03, z], r: [-Math.PI / 2 + 0.1, r() * 6, 0] });
		}
		this.addParts(B.decor, decor, [0, 0, 0]);

		// Wrecked cart — burning at night (the Redbound raid): fire light for the "red light on red monsters" check.
		this.addParts(B.obstacle, V.cart({ wrecked: true }).parts, [CART.x, this.height(CART.x, CART.z) - 0.02, CART.z], 0.9, { plank: m.charred, timber: m.charred });
		this.cartFire = new THREE.Vector3(CART.x + 0.2, this.height(CART.x, CART.z) + 0.55, CART.z - 0.1);

		// Gameplay objects.
		// Bone alarm drum (destructible: the Redbound beat it to call the camp).
		const drumAt = v3(6.4, -8.4);
		this.addParts(B.destructible, V.boneDrum().parts, [drumAt.x, this.height(drumAt.x, drumAt.z) - 0.05, drumAt.z], 0.4);
		this.footprints.push({ x: drumAt.x, z: drumAt.z, r: 0.9 });
		// Resonance pillar (destructible; its heart pulses with the Bellwether's rhythm — rule I.4).
		const pillarAt = v3(-1.2, -21.6);
		const pillar = V.resonancePillar();
		const py = this.height(pillarAt.x, pillarAt.z) - 0.05;
		this.addParts(B.destructible, pillar.parts, [pillarAt.x, py, pillarAt.z], 0.3);
		this.heartMaterial = V.bloodSacMaterial();
		this.heartMaterial.name = 'Resonance heart (blood signal)';
		this.heart = new THREE.Mesh(kit.worldUV(pillar.heart), this.heartMaterial);
		this.heart.position.set(pillarAt.x, py, pillarAt.z);
		this.heart.rotation.y = 0.3;
		this.heart.castShadow = true;
		this.heart.name = 'Resonance pillar heart';
		this.scene.add(this.heart);
		this.classMeshes.destructible.push(this.heart);
		this.footprints.push({ x: pillarAt.x, z: pillarAt.z, r: 0.9 });
		// Blood sacs (hazard + destructible): slow activity pulse; the one by the well bursts with the Vessel telegraph.
		this.sacMaterial = V.bloodSacMaterial();
		const sacSpots = [[3.0, -12.3, 1], [houseC.x - 2.6, houseC.z + HOUSE.d / 2 + 0.55, 0.9], [SHACK.x - 0.4, SHACK.z + 1.6, 0.8], [BARN.x + 3.1, BARN.z + BARN.d / 2 + 0.6, 0.85]];
		sacSpots.forEach(([x, z, s], i) => {
			const sac = new THREE.Mesh(kit.worldUV(V.bloodSac(90 + i)), this.sacMaterial);
			sac.position.set(x, this.height(x, z) - 0.06, z);
			sac.scale.setScalar(s);
			sac.rotation.y = r() * 6;
			sac.castShadow = true;
			sac.receiveShadow = true;
			sac.name = `Blood sac ${i + 1}`;
			sac.userData.base = s;
			this.scene.add(sac);
			this.sacs.push(sac);
			this.classMeshes.hazard.push(sac);
		});
		// Ambush nests (hazard): breathing mound + gnawed bones — the tell a harmless haystack does not have.
		for (const [x, z, yaw] of [[15.5, -1.5, -0.6], [-14, -8.5, 0.5]]) {
			const g = new THREE.Group();
			const built = V.ambushNest(Math.round(x * 5)).parts.build();
			for (const [key, geometry] of built) {
				const mesh = new THREE.Mesh(kit.worldUV(geometry), this.mat[key]);
				mesh.castShadow = mesh.receiveShadow = true;
				g.add(mesh);
				this.classMeshes.hazard.push(mesh);
			}
			g.position.set(x, this.height(x, z) - 0.08, z);
			g.rotation.y = yaw;
			g.name = 'Ambush nest';
			g.userData.phase = r() * 6;
			this.scene.add(g);
			this.nests.push(g);
			this.footprints.push({ x, z, r: 1.6 });
		}
	}

	/** Blightbeasts · Diseased Wilderness (rule III.3): wolf den, carcass and crows, trail signs. No bone posts, no altars. */
	buildWilds(B, r) {
		const toMeadow = Math.atan2(MEADOW.x - DEN.x, MEADOW.z - DEN.z);
		this.addParts(B.obstacle, V.wolfDen(14).parts, [DEN.x, this.height(DEN.x, DEN.z), DEN.z], toMeadow);
		this.footprints.push({ x: DEN.x, z: DEN.z, r: 4.5 });
		this.addParts(B.decor, V.carcass(13).parts, [CARCASS.x, this.height(CARCASS.x, CARCASS.z) - 0.05, CARCASS.z], 0.8);
		this.footprints.push({ x: CARCASS.x, z: CARCASS.z, r: 1.6 });
		// Fur and bones dragged along the trail, clods where the boar rooted.
		const decor = new V.Parts();
		for (let i = 0; i < 26; i++) {
			const p = this.trail[Math.floor(r() * this.trail.length)];
			const x = p.x + (r() - 0.5) * 1.6;
			const z = p.z + (r() - 0.5) * 1.6;
			if (i % 3) decor.add('fur', new THREE.ConeGeometry(0.05 + r() * 0.04, 0.07, 5), { p: [x, this.height(x, z) + 0.02, z], r: [Math.PI / 2 * r(), r() * 6, 0] });
			else decor.merge(V.longBone(0.3 + r() * 0.2), { p: [x, this.height(x, z) + 0.02, z], r: [0, r() * 6, 0] });
		}
		for (let i = 0; i < 22; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 5;
			const x = 39 + Math.cos(a) * d;
			const z = -10 + Math.sin(a) * d;
			decor.add('clod', kit.rock({ radius: 0.08 + r() * 0.1, seed: 300 + i, squash: 0.6 }), { p: [x, this.height(x, z) - 0.03, z] });
		}
		this.addParts(B.decor, decor, [0, 0, 0]);
		// Crows round the carcass (instanced, animated in update).
		const crows = 6;
		this.crowMesh = new THREE.InstancedMesh(kit.worldUV(V.crowGeometry()), this.mat.crow, crows);
		this.crowMesh.name = 'Crows (instanced)';
		this.crowMesh.castShadow = true;
		this.crowMesh.frustumCulled = false;
		this.crowSpots = Array.from({ length: crows }, (_, i) => {
			const a = (i / crows) * Math.PI * 2 + r() * 0.5;
			const d = 1.2 + r() * 0.9;
			return { x: CARCASS.x + Math.cos(a) * d, z: CARCASS.z + Math.sin(a) * d, yaw: Math.atan2(CARCASS.x - (CARCASS.x + Math.cos(a) * d), CARCASS.z - (CARCASS.z + Math.sin(a) * d)), phase: r() * 10, s: 0.9 + r() * 0.3 };
		});
		this.scene.add(this.crowMesh);
		this.updateCrows(0);

		// Boulders across the map (Valdren rock), kept off the road, the creek, buildings and the arenas.
		for (let i = 0, placed = 0; i < 180 && placed < 40; i++) {
			const x = (r() - 0.5) * SIZE * 0.86;
			const z = (r() - 0.5) * SIZE * 0.86;
			if (this.roadDistance(x, z) < 3.2 || this.creekDistance(x, z) < 2 || this.blocked(x, z, 2.5)) continue;
			if (Math.hypot(x - MEADOW.x, z - MEADOW.z) < 12 || Math.hypot(x - 0, z + 20) < 14 || Math.hypot(x - SPAWN.x, z - SPAWN.z) < 6) continue;
			if (x > FIELD.x0 - 1 && x < FIELD.x1 + 1 && z > FIELD.z0 - 1 && z < FIELD.z1 + 1) continue;
			const s = 0.25 + r() ** 2 * 1.2;
			B.obstacle.add(kit.rock({ radius: s, seed: i * 2.9, squash: 0.5 + r() * 0.3 }), this.mat.rock, { position: [x, this.height(x, z) - s * 0.25, z], rotation: [0, r() * 6, 0] });
			placed++;
		}
	}

	/** Road furniture: wayside shrine and waypoint (interactables), a lantern post, the signpost to Gallows Crossing. */
	buildRoadside(B, r) {
		const shrine = V.wayShrine();
		this.addInteractable('Miếu ven đường (shrine)', shrine, SHRINE, Math.PI / 4 + 0.3, 1.5);
		const sy = this.height(SHRINE.x, SHRINE.z);
		const flame = new THREE.Vector3(...shrine.flame).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4 + 0.3).add(new THREE.Vector3(SHRINE.x, sy, SHRINE.z));
		this.candleSpot = flame;
		this.addInteractable('Waypoint', V.waypointPad(), WAYPOINT, Math.PI / 4, 2.6, { sink: 0.06 });
		const post = V.lanternPost();
		const lx = WAYPOINT.x + 3.1;
		const lz = WAYPOINT.z - 2.2;
		this.addParts(B.obstacle, post.parts, [lx, this.height(lx, lz) - 0.05, lz], Math.PI * 0.8);
		this.lanternSpots.push(new THREE.Vector3(...post.light).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.8).add(new THREE.Vector3(lx, this.height(lx, lz) - 0.05, lz)));
		this.addParts(B.obstacle, V.signpost().parts, [52, this.height(52, -24.5), -24.5], 0.5);
	}

	/**
	 * Interactable (rule VI): its own meshes and materials — the interact glint (rim in the interaction ivory) brightens
	 * with proximity, and a ground ring fades in. Collides like an obstacle.
	 */
	addInteractable(label, built, at, yaw, ringRadius, { sink = 0.02 } = {}) {
		const batch = new kit.StaticBatch(`Interactable · ${label}`);
		const overrides = {};
		for (const key of built.parts.byKey.keys()) overrides[key] = this.mat[key].clone();
		const y = this.height(at.x, at.z) - sink;
		this.addParts(batch, built.parts, [at.x, y, at.z], yaw, overrides);
		const group = batch.build(true);
		this.scene.add(group);
		this.classMeshes.interactive.push(...group.children);
		this.footprints.push({ x: at.x, z: at.z, r: ringRadius * 0.8 });
		this.interactables.push({ label, group, at: new THREE.Vector3(at.x, y, at.z), ringRadius, glint: 0 });
	}

	/** Handprints (god-blood, dark) on the corrupted house, the barn and the well posts; claw marks on wood. */
	buildDecals() {
		const hand = new THREE.MeshStandardMaterial({ name: 'Decal · red handprint', map: decalTexture('hand'), color: '#4a1517', roughness: 0.6, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
		const claw = new THREE.MeshStandardMaterial({ name: 'Decal · claw marks', map: decalTexture('claw'), color: '#8a7a62', roughness: 0.9, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
		const batch = new kit.StaticBatch('Weeping Fields · decals');
		const hc = this.houseC;
		const frontZ = hc.z + HOUSE.d / 2 - 0.1 + 0.02;
		const quad = (w, h) => new THREE.PlaneGeometry(w, h);
		// Front wall of the corrupted house (wall-local x: door −1.25..0.05, window 1.08..1.92 above 1.45 m).
		for (const [x, y, rot] of [[-2.7, 1.55, 0.2], [-2.25, 1.9, -0.1], [2.65, 1.5, 0.3], [0.55, 1.62, 0]]) batch.add(quad(0.24, 0.28), hand, { position: [hc.x + x, hc.y + y, frontZ], rotation: [0, 0, rot], uv: 'keep', castShadow: false });
		const barnFront = BARN.z + BARN.d / 2 - 0.04 + 0.03;
		for (const [x, y, rot] of [[BARN.x - 3.4, 1.4, 0.15], [BARN.x + 2.4, 1.6, -0.2], [BARN.x + 3.3, 1.2, 0.4]]) batch.add(quad(0.24, 0.28), hand, { position: [x, this.barnY + y, barnFront], rotation: [0, 0, rot], uv: 'keep', castShadow: false });
		for (const side of [-1, 1]) batch.add(quad(0.2, 0.24), hand, { position: [WELL.x + side * 1.0 + side * 0.085, this.wellY + 1.25, WELL.z], rotation: [0, side * Math.PI / 2, 0.2], uv: 'keep', castShadow: false });
		for (const [x, y] of [[BARN.x - 1.95, 1.3], [BARN.x + 1.95, 1.0]]) batch.add(quad(0.3, 0.42), claw, { position: [x, this.barnY + y, BARN.z + BARN.d / 2 + 0.03], uv: 'keep', castShadow: false });
		batch.add(quad(0.3, 0.42), claw, { position: [hc.x + HOUSE.door - 0.8, hc.y + 1.2, frontZ + 0.01], uv: 'keep', castShadow: false });
		this.decals = batch.build(true);
		this.decals.userData.labNoCollide = true;
		for (const mesh of this.decals.children) mesh.receiveShadow = true;
		this.scene.add(this.decals);
	}

	/**
	 * God-blood veins (environment tier: dark, matte): from the well's footing along the ground to the corrupted house,
	 * under the footing, up through the hole in the floor, across the planks and up the wall cracks. Short roots fan
	 * out round the well the other way.
	 */
	buildVeins() {
		const r = kit.rng(77);
		const hc = this.houseC;
		const tubes = [];
		const add = (points, r0, r1, seg = 24) => tubes.push(V.place(kit.taperedTube(new THREE.CatmullRomCurve3(points), { segments: seg, radial: 6, r0, r1 })));
		const g = (x, z, dy = 0) => new THREE.Vector3(x, this.height(x, z) + dy, z);
		const wobble = (a, b, n, dy, amp) => {
			const pts = [];
			for (let i = 0; i <= n; i++) {
				const t = i / n;
				const x = a.x + (b.x - a.x) * t + (r() - 0.5) * amp * Math.sin(t * Math.PI);
				const z = a.z + (b.z - a.z) * t + (r() - 0.5) * amp * Math.sin(t * Math.PI);
				pts.push(g(x, z, dy(t)));
			}
			return pts;
		};
		// Trunk: well → footing (half sunk), then diving under it.
		const corner = v3(hc.x - HOUSE.w / 2 + 0.3, hc.z + HOUSE.d / 2 - 0.2);
		const start = v3(WELL.x + 0.9, WELL.z - 0.5);
		add(wobble(start, corner, 10, (t) => 0.02 - t * t * 0.45, 0.8), 0.11, 0.07, 40);
		for (const k of [-1, 1]) add(wobble(v3(start.x + k * 0.3, start.z - 0.2), v3(corner.x - 1.5, corner.z + k * 0.9), 7, (t) => -0.01 - t * 0.2, 1.0), 0.06, 0.025, 24);
		// Roots fanning round the well.
		for (let i = 0; i < 7; i++) {
			const a = -0.6 + i * 0.75 + r() * 0.3;
			const from = v3(WELL.x + Math.cos(a) * 0.95, WELL.z + Math.sin(a) * 0.95);
			const to = v3(WELL.x + Math.cos(a) * (2.6 + r() * 2.2), WELL.z + Math.sin(a) * (2.6 + r() * 2.2));
			add(wobble(from, to, 6, (t) => 0.02 - t * 0.12, 0.7), 0.06, 0.018, 18);
		}
		// Inside the corrupted house: up through the floor hole, across the planks, up the cracks.
		const fy = hc.y;
		const hole = new THREE.Vector3(hc.x + hc.built.floorHole[0], fy, hc.z + hc.built.floorHole[1]);
		const up = (x, z, y) => new THREE.Vector3(x, y, z);
		for (const crack of hc.built.cracks) {
			// Where the vein meets the wall inside the room (0.6 m in from the crack's foot), it goes out under the footing.
			const side = crack[0][0] > HOUSE.w / 2;
			const base = side ? new THREE.Vector3(hc.x + crack[0][0] - 0.6, fy + 0.03, hc.z + crack[0][2]) : new THREE.Vector3(hc.x + crack[0][0], fy + 0.03, hc.z + crack[0][2] - 0.6);
			add([up(hole.x, hole.z, fy - 0.5), up(hole.x + (base.x - hole.x) * 0.15, hole.z + (base.z - hole.z) * 0.15, fy + 0.05), up(hole.x + (base.x - hole.x) * 0.6 + (r() - 0.5) * 0.4, hole.z + (base.z - hole.z) * 0.6, fy + 0.04), base], 0.07, 0.05, 20);
			const climb = crack.map(([x, y, z]) => new THREE.Vector3(hc.x + x, fy + y, hc.z + z));
			climb[0] = base.clone().lerp(climb[0], 0.7);
			add(climb, 0.05, 0.012, 40);
		}
		for (let i = 0; i < 5; i++) {
			const a = r() * Math.PI * 2;
			const d = 0.8 + r() * 1.3;
			add([up(hole.x, hole.z, fy - 0.4), up(hole.x + Math.cos(a) * 0.3, hole.z + Math.sin(a) * 0.3, fy + 0.04), up(hole.x + Math.cos(a) * d, hole.z + Math.sin(a) * d * 0.7, fy + 0.03)], 0.05, 0.015, 12);
		}
		this.veinMesh = new THREE.Mesh(kit.worldUV(V.mergeAll(tubes)), this.mat.vein);
		this.veinMesh.name = 'God-blood veins';
		this.veinMesh.castShadow = true;
		this.veinMesh.receiveShadow = true;
		this.veinMesh.userData.labNoCollide = true;
		this.scene.add(this.veinMesh);
	}

	async loadCards() {
		try {
			this.cardTexture = await loadGrassCards(this.app, TERRAIN_SETS.moor.cards);
		} catch (error) {
			console.error('Grass cards failed to load; the grass edges stay flat', error);
			this.cardTexture = null;
		}
	}

	/** Tuft colour per channel: [base, + dry] (linear), from the moss and straw swatches (or the painted moor set). */
	tuftColor() {
		if (!this.settings.paletteLock) return TERRAIN_SETS.moor.tuftColor;
		const moss = new THREE.Color(V.VALDREN.moss);
		const straw = new THREE.Color(V.VALDREN.straw);
		return [[moss.r, (straw.r - moss.r) * 0.55], [moss.g, (straw.g - moss.g) * 0.55], [moss.b, (straw.b - moss.b) * 0.55]];
	}

	/** Grass tufts where the splat says grass, plus the stubble rows of the fields. Rebuilt after brush strokes. */
	buildGrass() {
		const density = this.settings.grassDensity;
		const max = Math.round(9000 * density * TERRAIN_SETS.moor.tufts) + Math.round(2600 * density);
		this.grassBase ??= new THREE.MeshStandardMaterial({ name: 'Grass blades', color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true });
		this.tuftGeometry ??= twoSided(kit.grassTuft({ blades: 7, seed: 8 }));
		const mesh = new THREE.InstancedMesh(this.tuftGeometry, this.grassBase.clone(), Math.max(1, max));
		mesh.name = 'Weeping Fields grass + stubble (instanced)';
		const r = kit.rng(77);
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		const tone = this.tuftColor();
		const straw = new THREE.Color(V.VALDREN.straw);
		let n = 0;
		const meadowCap = Math.round(9000 * density * TERRAIN_SETS.moor.tufts);
		for (let i = 0; i < meadowCap * 4 && n < meadowCap; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 52;
			const x = Math.cos(a) * d + 2;
			const z = Math.sin(a) * d - 6;
			const { grass, wet } = this.splat.sample(x, z);
			if (r() > smooth(0.35, 0.9, grass) * (1 - wet * 0.6) || this.blocked(x, z, 0.2)) continue;
			dummy.position.set(x, this.height(x, z) - 0.02, z);
			dummy.rotation.set((r() - 0.5) * 0.3, r() * Math.PI * 2, (r() - 0.5) * 0.3);
			const h = (0.18 + r() * 0.32) * (0.5 + 0.6 * grass);
			const w = 0.8 + r() * 0.6;
			dummy.scale.set(w, h, w);
			dummy.updateMatrix();
			mesh.setMatrixAt(n, dummy.matrix);
			const dry = r() ** 1.5;
			color.setRGB(...tone.map((c) => c[0] + dry * c[1])).multiplyScalar(0.85 + r() * 0.3);
			mesh.setColorAt(n, color);
			n++;
		}
		// Stubble rows on the ridges between the furrows.
		for (let z = FIELD.z0 + 0.75; z < FIELD.z1 - 0.3 && n < max; z += 1) {
			for (let x = FIELD.x0 + 0.6; x < FIELD.x1 - 0.4 && n < max; x += 0.32 + r() * 0.22) {
				if (r() < 0.18 || this.blocked(x, z, 0.3)) continue;
				const zz = z + (r() - 0.5) * 0.18;
				dummy.position.set(x, this.height(x, zz) - 0.02, zz);
				dummy.rotation.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4);
				const h = 0.22 + r() * 0.22;
				dummy.scale.set(0.7, h, 0.7);
				dummy.updateMatrix();
				mesh.setMatrixAt(n, dummy.matrix);
				color.copy(straw).multiplyScalar(0.7 + r() * 0.35);
				mesh.setColorAt(n, color);
				n++;
			}
		}
		mesh.count = n;
		mesh.instanceMatrix.needsUpdate = true;
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
		mesh.receiveShadow = true;
		mesh.frustumCulled = false;
		this.grass = mesh;
		this.scene.add(mesh);
	}

	rebuildGrass() {
		this.scene.remove(this.grass);
		this.grass.dispose?.();
		this.buildGrass();
		this.grass.material = this.windGrass.apply(this.grass.material);
		if (this.shadowFill) this.grass.material = this.shadowFill.apply(this.grass.material);
		this.app.backend.prepareObject(this.grass);
		this.buildCards();
		if (this.cards) this.app.backend.prepareObject(this.cards);
		this.app.mood?.onSceneRebuilt(this);
	}

	/** 3D grass cards along the grass edges (atlas tufts), toned into the moss palette. */
	buildCards() {
		if (this.cards) {
			this.scene.remove(this.cards);
			for (const mesh of this.cards.children) {
				mesh.geometry.dispose();
				mesh.dispose?.();
			}
			this.cards = null;
		}
		const count = Math.round(5000 * this.settings.edgeCards);
		if (!this.cardTexture || !count) return;
		this.cardBase ??= new THREE.MeshStandardMaterial({ name: 'Grass cards', map: this.cardTexture, alphaTest: 0.45, roughness: 0.85, metalness: 0 });
		let material = this.cardBase;
		if (this.windGrass) material = this.windGrass.apply(material);
		if (this.shadowFill) material = this.shadowFill.apply(material);
		const r = kit.rng(313);
		const spots = [[], [], [], []];
		const lock = this.settings.paletteLock;
		for (let i = 0, n = 0; i < count * 12 && n < count; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 52;
			const x = Math.cos(a) * d + 2;
			const z = Math.sin(a) * d - 6;
			if (this.roadDistance(x, z) < 2.1 || this.blocked(x, z, 0.4)) continue;
			const { grass, wet } = this.splat.sample(x, z);
			const edge = Math.min(1, 4 * grass * (1 - grass));
			if (r() > (edge * 0.9 + smooth(0.6, 1, grass) * 0.1) * (1 - smooth(0.4, 0.8, wet))) continue;
			const h = 0.32 + r() ** 2 * 0.45;
			spots[Math.floor(r() * 4)].push({ x, z, h, w: h * (0.9 + r() * 0.4), yaw: r() * Math.PI, tone: 0.62 + r() * 0.25, dry: r() });
			n++;
		}
		const group = new THREE.Group();
		group.name = 'Grass cards (instanced)';
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		spots.forEach((list, cell) => {
			if (!list.length) return;
			const mesh = new THREE.InstancedMesh(grassCardGeometry(cell), material, list.length);
			mesh.name = `Grass cards · tuft ${cell + 1}`;
			list.forEach((p, i) => {
				dummy.position.set(p.x, this.height(p.x, p.z), p.z);
				dummy.rotation.set(0, p.yaw, 0);
				dummy.scale.set(p.w, p.h, p.w);
				dummy.updateMatrix();
				mesh.setMatrixAt(i, dummy.matrix);
				// Locked: pull the atlas' olive toward moss (less red, a touch more blue).
				if (lock) mesh.setColorAt(i, color.setRGB(p.tone * (0.78 + p.dry * 0.14), p.tone * 0.98, p.tone * 0.95));
				else mesh.setColorAt(i, color.setRGB(p.tone * (0.85 + p.dry * 0.15), p.tone, p.tone * 0.85));
			});
			mesh.receiveShadow = true;
			mesh.frustumCulled = false;
			group.add(mesh);
		});
		this.cards = group;
		this.scene.add(group);
	}

	/** Shrubs from the shrub kit (instanced, wind): banks, fence lines, field edges; never on the road or the arenas. */
	buildShrubs() {
		this.shrubs = [];
		const pieces = Object.values(this.kits?.shrubs ?? {});
		if (!pieces.length) return;
		const material = this.kitMaterial(pieces[0].material, V.VALDREN.mossDark, 'Weeping Fields shrubs');
		material.side = THREE.DoubleSide;
		const r = kit.rng(913);
		const spots = pieces.map(() => []);
		const max = Math.round(240 * (this.settings.grassDensity ?? 1));
		for (let i = 0, n = 0; i < max * 14 && n < max; i++) {
			const x = (r() - 0.5) * SIZE * 0.9;
			const z = (r() - 0.5) * SIZE * 0.9;
			const road = this.roadDistance(x, z);
			const creek = this.creekDistance(x, z);
			if (road < 2.6 || creek < 1.1 || this.blocked(x, z, 0.8) || Math.hypot(x - MEADOW.x, z - MEADOW.z) < 11 || Math.hypot(x - SPAWN.x, z - SPAWN.z) < 4) continue;
			if (Math.hypot(x - 0, z + 20) < 11) continue;
			const { grass, wet, blood } = this.splat.sample(x, z);
			if (blood > 0.2) continue;
			const edge = Math.max(smooth(3, 1.1, creek), smooth(5.5, 3.6, road) * smooth(2.6, 3.6, road));
			if (r() > Math.max(smooth(0.4, 0.95, grass) * 0.3, edge * 0.8) * (1 - wet * 0.5)) continue;
			const s = (0.6 + r() * 0.5) * (0.8 + 0.4 * grass);
			spots[Math.floor(r() * pieces.length)].push({ x, z, s, yaw: r() * Math.PI * 2 });
			n++;
		}
		const dummy = new THREE.Object3D();
		pieces.forEach((piece, k) => {
			if (!spots[k].length) return;
			const mesh = new THREE.InstancedMesh(piece.geometry, material, spots[k].length);
			mesh.name = `Weeping Fields shrubs · ${piece.name}`;
			spots[k].forEach((p, i) => {
				dummy.position.set(p.x, this.height(p.x, p.z) - 0.05 * p.s, p.z);
				dummy.rotation.set(0, p.yaw, 0);
				dummy.scale.setScalar(p.s);
				dummy.updateMatrix();
				mesh.setMatrixAt(i, dummy.matrix);
			});
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			this.shrubs.push(mesh);
			this.scene.add(mesh);
		});
	}

	/** Dead trees (Valdren core): the northern rise, the creek, the den; one old tree in each farm yard. */
	buildTrees() {
		this.trees = [];
		this.treeMaterial ??= this.mat.bark.clone();
		const spots = [[-20, -30, 1.2], [-30, -38, 1.0], [14, -38, 1.1], [24, -44, 1.3], [-6, -46, 1.0], [34, -40, 0.9], [50, -32, 1.2], [47, -44, 1.0],
			[-45, -22, 1.1], [-50, 4, 0.9], [-44, 20, 1.2], [-19, -26, 1.0], [20, -24, 0.9], [8, 30, 1.0], [26, 14, 1.1], [-34, 30, 0.9]];
		for (const [x, z, s] of spots) {
			if (this.blocked(x, z, 1.5)) continue;
			const tree = new THREE.Mesh(kit.worldUV(kit.deadTree({ seed: Math.round(x * 7 + z), height: 4.5 * s })), this.treeMaterial);
			tree.position.set(x, this.height(x, z) - 0.05, z);
			tree.rotation.y = x + z;
			tree.castShadow = true;
			tree.receiveShadow = true;
			tree.name = 'Dead tree';
			this.trees.push(tree);
			this.scene.add(tree);
			this.footprints.push({ x, z, r: 0.8 });
		}
		this.buildCloth();
	}

	/** Hanging cloth (banners): one instanced mesh, built hem-down so the wind mask grows toward the hem. */
	buildCloth() {
		const g = new THREE.PlaneGeometry(1, 1, 5, 8);
		g.translate(0, 0.5, 0);
		const pos = g.attributes.position;
		const r = kit.rng(55);
		for (let i = 0; i < pos.count; i++) {
			const y = pos.getY(i);
			const x = pos.getX(i);
			if (y > 0.99) pos.setY(i, y - r() * 0.42); // torn hem (local y grows toward the hem; the mesh hangs flipped)
			pos.setZ(i, Math.sin(x * 7 + y * 3) * 0.03);
		}
		g.computeVertexNormals();
		const material = this.mat.redCloth.clone();
		this.cloth = new THREE.InstancedMesh(g, material, this.banners.length);
		this.cloth.name = 'Redbound banners (instanced)';
		const dummy = new THREE.Object3D();
		this.banners.forEach(([x, z, yaw], i) => {
			const top = this.height(x, z) - 0.15 + 2.7 - 0.15;
			dummy.position.set(x + Math.sin(yaw) * 0.1, top, z + Math.cos(yaw) * 0.1);
			dummy.rotation.set(Math.PI, -yaw, 0); // flipped: local +y points down
			dummy.scale.set(0.62, 1.15, 1);
			dummy.updateMatrix();
			this.cloth.setMatrixAt(i, dummy.matrix);
		});
		this.cloth.castShadow = true;
		this.cloth.receiveShadow = true;
		this.cloth.frustumCulled = false;
		this.scene.add(this.cloth);
	}

	// ---------------------------------------------------------------------------------------------
	// Signals (rule I.2 / I.5 / VI)

	buildSignals() {
		const height = (x, z) => this.height(x, z);
		this.signals = new THREE.Group();
		this.signals.name = 'Gameplay signals';
		this.signals.userData.labNoPick = this.signals.userData.labNoCollide = true;
		this.scene.add(this.signals);
		const dir = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
		this.telegraphs = [
			new Telegraph({ kind: 'circle', center: v3(MEADOW.x - 2, MEADOW.z + 1), radius: 3.2, fill: 'danger', windup: 1.3, period: 4.6, offset: 0, height, label: 'Brute slam (vật lý)' }),
			new Telegraph({ kind: 'circle', center: v3(3.4, -11.4), radius: 2.6, fill: 'blood', windup: 1.0, period: 5.2, offset: 1.3, height, label: 'Vessel burst (thần huyết)' }),
			new Telegraph({ kind: 'line', center: v3(14.6, -0.4), length: 9, width: 1.5, yaw: dir(v3(14.6, -0.4), v3(9, 7.5)), fill: 'danger', windup: 0.8, period: 3.9, offset: 2.2, height, label: 'Piercer volley (gai xương)' }),
			new Telegraph({ kind: 'circle', center: v3(40, -29.5), radius: 2.8, fill: 'poison', windup: 1.4, period: 5.6, offset: 0.6, height, label: 'Disease cloud (Blightbeast)' }),
		];
		this.wellTelegraph = this.telegraphs[1];
		for (const t of this.telegraphs) this.signals.add(t.group);

		// Swatch sampler: the six function colours on the moss grass, under the scene light (base fill, highlight ring).
		this.sampler = new THREE.Group();
		this.sampler.name = 'Function colour sampler';
		this.sampler.userData.labNoPick = this.sampler.userData.labNoCollide = true;
		this.samplerParts = [];
		Object.entries(V.FUNCTION).forEach(([id, f], i) => {
			const center = v3(SAMPLER.x + i * SAMPLER.step, SAMPLER.z);
			// Opaque chip in the middle (the hex itself on screen), translucent fill round it (how an area reads on grass).
			const disc = new Disc({ center, radius: 1.45, color: f.colors[0], alpha: 0.45, chip: 0.34, height });
			const ring = new Ring({ center, radius: 1.55, width: 0.16, color: f.colors[1], height });
			const label = groundLabel(`${f.label.split(' /')[0]}\n${f.colors[0].toUpperCase()}`, { center: v3(center.x + 1.25, center.z + 1.75), width: 2.9, height, yaw: Math.PI / 4 });
			this.sampler.add(disc.group, ring.group, label);
			this.samplerParts.push(disc, ring, label);
			this.samplerSwatches ??= [];
			this.samplerSwatches.push({ id, disc, ring });
		});
		this.scene.add(this.sampler);

		// Interact rings (fade in with proximity).
		for (const it of this.interactables) {
			it.ring = new Ring({ center: it.at, radius: it.ringRadius, width: 0.12, color: V.FUNCTION.interact.colors[1], height });
			it.ring.setOpacity(0);
			this.signals.add(it.ring.group);
		}

		// Class view overlays (rule VI): flat class colour over the lit object.
		this.classOverlay = new THREE.Group();
		this.classOverlay.name = 'Gameplay class view';
		this.classOverlay.userData.labNoPick = this.classOverlay.userData.labNoCollide = true;
		this.classOverlay.visible = false;
		this.scene.add(this.classOverlay);
		this.rebuildClassOverlay();
	}

	/**
	 * Signal colours (telegraphs, sampler, interact rings): the function hexes as linear scene colours — display-matched
	 * through the current exposure / grade / tone mapping (so the screen shows the hex), or raw (what a plain unlit
	 * colour gives). Re-run when those post settings change (update()).
	 */
	refreshSignalColors() {
		const post = this.app.settings.data.post;
		const match = this.settings.signalMatch;
		this.signalReport = {};
		const palette = {};
		for (const [id, f] of Object.entries(V.FUNCTION)) {
			palette[id] = f.colors.map((hex) => {
				const shown = asShown(hex, post);
				const matched = matchDisplay(hex, post);
				(this.signalReport[id] ??= []).push({ hex, raw: shown.hex, rawError: shown.error, matchError: matched.error });
				return match ? matched.color : new THREE.Color(hex);
			});
		}
		for (const t of this.telegraphs) t.setColors(palette[t.fill][0], palette[t.fill][1], palette.danger[1]);
		for (const s of this.samplerSwatches ?? []) {
			s.disc.setColor(palette[s.id][0]);
			s.ring.setColor(palette[s.id][1]);
		}
		for (const it of this.interactables) it.ring?.setColor(palette.interact[1]);
		this.signalKey = `${displayKey(post)}|${match}`;
		this.onSignalReport?.();
	}

	rebuildClassOverlay() {
		for (const child of [...this.classOverlay.children]) this.classOverlay.remove(child);
		this.overlayMaterials ??= Object.fromEntries(Object.entries(V.CLASSES).map(([id, c]) => [id, new THREE.MeshBasicMaterial({ name: `Class view · ${id}`, color: new THREE.Color(c.color), transparent: true, opacity: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })]));
		for (const [id, meshes] of Object.entries(this.classMeshes)) {
			for (const mesh of meshes) {
				const o = new THREE.Mesh(mesh.geometry, this.overlayMaterials[id]);
				o.matrixAutoUpdate = false;
				o.userData.source = mesh;
				o.userData.labNoPick = o.userData.labNoCollide = true;
				o.renderOrder = 6;
				this.classOverlay.add(o);
			}
		}
	}

	/** Rim glint on the interactables' own materials (interaction ivory); intensity follows proximity in update(). */
	applyGlintPatches() {
		for (const it of this.interactables) {
			it.rim = this.app.backend.effects.create('rim', { color: new THREE.Color(V.FUNCTION.interact.colors[1]), power: 2.4, intensity: 0 });
			for (const mesh of it.group.children) mesh.material = it.rim.apply(mesh.material);
		}
	}

	// ---------------------------------------------------------------------------------------------
	// Stand-in crowds (checklist VII: "12 Redbound on the meadow", "Redbound on blood-soaked ground")

	async setCrowd(id, on) {
		const key = id === 'meadow' ? 'crowdMeadow' : 'crowdWell';
		this.settings[key] = on;
		this.app.settings.changed('weeping');
		const old = this.crowds[id];
		if (old) {
			for (const model of old.models) model.dispose();
			this.scene.remove(old.group);
			delete this.crowds[id];
		}
		if (!on) return;
		await modelsReady;
		if (!this.settings[key] || this.crowds[id]) return;
		const group = new THREE.Group();
		group.name = `Redbound stand-ins · ${id}`;
		group.userData.labNoCollide = true;
		const center = CROWD_CENTER[id];
		const cam = this.viewCamera(VIEWS[id === 'meadow' ? 'meadow' : 'well']).position;
		// Motion reads before colour (rule I.1): every fourth one prowls a small circle, the rest idle.
		const walks = [];
		const models = CROWDS[id].map(([kind, dx, dz], i) => {
			const model = createMonster(kind, { seed: 40 + i });
			if (kind === 'brute') {
				// The Pit Fiend's lava cracks are fire (danger orange): off, tinted toward the Redbound Brute's burgundy.
				model.material.userData.u.uEmis.value = 0;
				model.material.userData.u.uCrack.value = 0;
				model.setTint(0x7a2432, 0.55);
			}
			if (this.app.backend.kind !== 'webgl') useNodeMaterial(model);
			const x = center.x + dx;
			const z = center.z + dz;
			model.root.position.set(x, this.height(x, z), z);
			model.root.rotation.y = Math.atan2(cam.x - x, cam.z - z) + ((i % 3) - 1) * 0.5; // facing the camera, loosely
			model.root.traverse((o) => (o.userData.labNoCollide = true));
			walks.push(i % 4 === 3 ? { x, z, r: 1.4, phase: i, speed: kind === 'brute' ? 1.1 : 1.5 } : null);
			model.update(i * 0.37, { speed: 0 });
			group.add(model.root);
			return model;
		});
		this.scene.add(group);
		this.app.backend.prepareObject(group);
		this.crowds[id] = { group, models, walks };
	}

	updateCrowds(delta, elapsed) {
		for (const crowd of Object.values(this.crowds)) {
			crowd.models.forEach((model, i) => {
				const w = crowd.walks[i];
				if (!w) {
					model.update(delta, { speed: 0 });
					return;
				}
				const a = w.phase + (elapsed * w.speed) / w.r;
				const x = w.x + Math.cos(a) * w.r;
				const z = w.z + Math.sin(a) * w.r;
				model.root.position.set(x, this.height(x, z), z);
				model.root.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); // along the circle (counter-clockwise)
				model.update(delta, { speed: w.speed });
			});
		}
	}

	// ---------------------------------------------------------------------------------------------
	// Lights

	buildLights() {
		this.moon = new THREE.DirectionalLight(0xffffff, 1);
		this.moon.name = 'Sun / moon';
		this.moon.castShadow = true;
		this.moon.shadow.mapSize.set(2048, 2048);
		const cam = this.moon.shadow.camera;
		cam.left = cam.bottom = -40;
		cam.right = cam.top = 40;
		cam.near = 1;
		cam.far = 160;
		this.moon.shadow.bias = -0.0004;
		this.moon.shadow.normalBias = 0.03;
		this.moon.target.position.set(6, 0, -12);
		this.scene.add(this.moon, this.moon.target);
		this.hemi = new THREE.HemisphereLight(0x9aa29c, 0x3d362b, 1);
		this.hemi.name = 'Sky / ground ambient';
		this.scene.add(this.hemi);

		this.flames = new FlameField(this.app, 16);
		this.vfx.add(this.flames.mesh);
		const fire = new THREE.PointLight(kelvinToColor(1850), 40, 14, 2);
		fire.position.copy(this.cartFire).add(new THREE.Vector3(0, 0.8, 0));
		fire.castShadow = true;
		fire.shadow.mapSize.set(512, 512);
		fire.shadow.bias = -0.002;
		fire.shadow.normalBias = 0.03;
		fire.name = 'Burning cart';
		this.scene.add(fire);
		this.fireLight = fire;
		this.fireFlames = [];
		for (const [dx, dz, w, h] of [[0, 0, 0.7, 1.1], [-0.6, 0.3, 0.45, 0.7], [0.7, -0.35, 0.4, 0.6]]) {
			this.fireFlames.push(this.flames.add(this.cartFire.clone().add(new THREE.Vector3(dx, 0, dz)), { light: dx === 0 ? fire : null, width: w, height: h, strength: 1.1 }));
		}
		const embers = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), this.mat.ember);
		embers.rotation.x = -Math.PI / 2;
		embers.position.set(CART.x, this.height(CART.x, CART.z) + 0.05, CART.z);
		embers.name = 'Cart embers';
		this.embers = embers;
		this.scene.add(embers);
		// Lanterns (house bracket, waypoint post) and the shrine candle: small warm pools, no shadows.
		this.lanternLights = this.lanternSpots.map((p) => {
			const light = new THREE.PointLight(kelvinToColor(2100), 10, 8, 2);
			light.position.copy(p);
			light.name = 'Lantern';
			this.scene.add(light);
			return light;
		});
		this.lanternGlass = this.lanternSpots.map((p) => {
			const glass = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), this.mat.glass);
			glass.position.copy(p);
			glass.userData.labNoCollide = true;
			this.scene.add(glass);
			return glass;
		});
		const candle = new THREE.PointLight(kelvinToColor(1900), 2.5, 3.5, 2);
		candle.position.copy(this.candleSpot).add(new THREE.Vector3(0, 0.1, 0));
		candle.name = 'Shrine candle';
		this.scene.add(candle);
		this.candleLight = candle;
		this.candleFlame = this.flames.add(this.candleSpot, { light: candle, width: 0.07, height: 0.14, strength: 0.9 });
		// The player's light radius (Diablo II), night only.
		this.heroLight = new THREE.PointLight(0xffffff, 0, 9, 1.1);
		this.heroLight.name = 'Player light radius';
		this.heroLight.visible = false;
		this.scene.add(this.heroLight);
		this.lights = [
			{ name: 'Sun / moon', light: this.moon, kelvin: 6500, base: 1 },
			{ name: 'Sky ambient', light: this.hemi, base: 1 },
		];
	}

	applyRigIntensity() {
		for (const l of this.lights) l.light.intensity = l.base;
	}

	/**
	 * Fire and lantern levels for the preset (or the mood's torch scale). The cart's light stays in the scene at
	 * intensity 0 when it is out: hiding a light changes the light count and recompiles every lit material.
	 */
	applyFireSettings(t = WEEPING_TIMES[this.settings.time] ?? WEEPING_TIMES.overcast) {
		const s = this.settings;
		const fire = s.cartFire ? (this.mood ? this.mood.torches.scale : t.fire ?? 1) : 0;
		const lanterns = (this.mood ? this.mood.torches.scale : t.lanterns ?? 1) * s.lanterns;
		const entries = this.flames.entries;
		this.flames.lightScale = 1;
		for (const i of this.fireFlames) entries[i].strength = s.cartFire ? 1.1 : 0;
		entries[this.fireFlames[0]].lightBase = 40 * fire;
		this.fireLight.distance = t.fireDistance ?? 14;
		this.embers.visible = s.cartFire;
		for (const light of this.lanternLights) light.intensity = 10 * lanterns;
		entries[this.candleFlame].lightBase = 2.5 * Math.max(0.35, lanterns);
		this.mat.glass.emissiveIntensity = 0.4 + 1.8 * Math.min(1, lanterns);
	}

	async applyMood(block) {
		this.mood = block;
		this.heroLight.visible = false;
		this.fireLight.color.copy(kelvinToColor(block ? block.torches.kelvin : 1850));
		if (!block) {
			await this.applyTime();
			return;
		}
		const elev = THREE.MathUtils.degToRad(block.moon.elevation);
		const az = THREE.MathUtils.degToRad(block.moon.azimuth);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(70).add(this.moon.target.position);
		this.moon.color.copy(kelvinToColor(block.moon.kelvin));
		this.lights[0].kelvin = block.moon.kelvin;
		this.lights[0].base = block.moon.lux;
		this.hemi.color.set(block.sky.color);
		this.hemi.groundColor.set(block.sky.ground);
		this.lights[1].base = block.sky.intensity;
		this.applyRigIntensity();
		this.applyFireSettings();
		this.sun.direction.copy(dir);
		this.updateGrassShadow();
		this.sun.color.copy(this.moon.color).multiplyScalar(block.sun);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(block.env.id));
		if (this.mood !== block) return;
		this.scene.environment = env;
		this.scene.background = env;
		this.scene.environmentIntensity = block.env.intensity;
		this.scene.backgroundIntensity = block.env.background;
		this.scene.backgroundBlurriness = block.env.blur;
	}

	wetRoots() {
		return [this.ground, ...Object.values(this.groups ?? {}), ...this.trees, this.grass, ...this.shrubs, ...(this.cards ? [this.cards] : []), ...this.interactables.map((it) => it.group)];
	}

	async applyTime() {
		const t = WEEPING_TIMES[this.settings.time] || WEEPING_TIMES.overcast;
		const elev = THREE.MathUtils.degToRad(t.sunElev);
		const az = THREE.MathUtils.degToRad(t.sunAz);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(70).add(this.moon.target.position);
		this.moon.color.copy(kelvinToColor(t.sunK));
		this.lights[0].kelvin = t.sunK;
		this.lights[0].base = t.sun;
		this.lights[1].base = t.hemi;
		this.hemi.color.set(t.sky);
		this.hemi.groundColor.set(t.ground);
		this.applyRigIntensity();
		this.applyFireSettings(t);
		const hero = t.hero;
		this.heroLight.visible = !!hero && !this.mood;
		if (hero) {
			this.heroLight.color.set(hero.color);
			this.heroLight.intensity = hero.intensity;
			this.heroLight.distance = hero.distance;
			this.heroLight.decay = hero.decay;
			this.heroHeight = hero.height;
		}
		this.sun.direction.copy(dir);
		this.updateGrassShadow();
		this.sun.color.copy(this.moon.color).multiplyScalar(this.settings.time === 'night' ? 0.12 : 0.6);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		this.scene.environment = env;
		this.scene.background = env;
		this.scene.environmentIntensity = t.envI;
		this.scene.backgroundIntensity = t.bgI;
		this.scene.backgroundBlurriness = 0.1;
		this.postDefaults = { exposure: t.exposure, fog: { enabled: true, height: 0, ...t.fog }, grade: { vignette: 0.3, ...t.grade } };
	}

	/** Shadow fill on every lit static asset (terrain, batches, trees, grass, shrubs, banners) + its settings. */
	applyFill() {
		this.updateFill();
		const meshes = [this.ground, this.roadMesh, ...Object.values(this.groups).flatMap((g) => g.children), ...this.trees, this.grass, this.veinMesh, this.cloth, ...this.interactables.flatMap((it) => it.group.children)].filter((m) => m?.isMesh);
		for (const mesh of meshes) mesh.material = this.shadowFill.apply(mesh.material);
		this.treeMaterial = this.trees[0]?.material ?? this.treeMaterial;
		if (this.shrubs.length) {
			const material = this.shadowFill.apply(this.shrubs[0].material);
			for (const s of this.shrubs) s.material = material;
		}
	}

	updateFill() {
		const s = this.settings;
		this.moon.shadow.intensity = s.shadowStrength;
		this.fireLight.shadow.intensity = s.shadowStrength;
		const u = this.shadowFill.uniforms;
		u.strength.value = s.fill ? s.fillStrength : 0;
		u.color.value.set(s.fillColor);
		u.threshold.value = s.fillThreshold;
	}

	applyLayerSettings() {
		const s = this.settings;
		const u = this.terrain.uniforms;
		const tiles = TERRAIN_SETS.moor.tiles;
		u.tile.value.set(1 / tiles[0], 1 / tiles[1], 1 / tiles[2]);
		u.softness.value = s.softness;
		u.heightBlend.value = s.heightBlend;
		u.water.value = s.water;
		u.damp.value = s.damp;
		u.ao.value = s.ao;
		u.variation.value = s.variation;
		u.macro.value = s.macro;
		u.edgeNoise.value = s.edgeNoise;
		u.waterRough.value = s.waterRough;
		if (this.splat.blur !== s.splatBlur) {
			this.splat.blur = s.splatBlur;
			this.splat.refresh();
		}
		u.debug.value = s.showWeights ? 1 : 0;
		u.grassShadow.value = s.grassShadow;
		u.grassLift.value = s.grassLift;
		this.updateGrassShadow();
	}

	/** Remnant corruption settings → terrain uniforms, vein meshes, the well's pulse. */
	applyCorruption() {
		const s = this.settings;
		const u = this.terrain.uniforms;
		u.blood.value = s.blood;
		u.bloodColor.value.set(s.bloodTint);
		u.veinColor.value.set(s.veinColor);
		this.veinMesh.visible = s.veins;
	}

	/** Rule tool toggles → visibility. */
	applyRuleViews() {
		const s = this.settings;
		this.classOverlay.visible = s.classView;
		for (const t of this.telegraphs) t.enabled = s.telegraphs;
		this.sampler.visible = s.sampler;
		for (const id of ['meadow', 'well']) {
			const want = s[id === 'meadow' ? 'crowdMeadow' : 'crowdWell'];
			if (want !== !!this.crowds[id]) this.setCrowd(id, want);
		}
	}

	updateGrassShadow() {
		const d = this.sun.direction;
		const flat = Math.hypot(d.x, d.z);
		const reach = Math.min(0.8, (this.settings.grassBlade * flat) / Math.max(0.15, d.y));
		this.terrain?.uniforms.grassShadowOffset.value.set(flat ? (d.x / flat) * reach : 0, flat ? (d.z / flat) * reach : 0);
	}

	frameView(id) {
		const view = VIEWS[id];
		if (!view) return;
		this.settings.view = id;
		if (view.crowd && !this.crowds[view.crowd]) this.setCrowd(view.crowd, true);
		const { position, target } = this.viewCamera(view);
		const rig = this.app.rig;
		if (rig.follow) return; // the character / gameplay camera owns the view while playing
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		rig.lookAt(position, target);
	}

	// ---------------------------------------------------------------------------------------------
	// Brush (left drag paints while "Paint" is on)

	buildCursor() {
		const pts = [];
		for (let i = 0; i < 64; i++) pts.push(new THREE.Vector3());
		const g = new THREE.BufferGeometry().setFromPoints(pts);
		const ring = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: 0xb8323c, depthTest: false, transparent: true, opacity: 0.9 }));
		ring.name = 'Brush cursor';
		ring.renderOrder = 999;
		ring.frustumCulled = false;
		ring.visible = false;
		ring.userData.labNoPick = true;
		ring.userData.labNoView = true;
		this.cursor = ring;
		this.scene.add(ring);
	}

	placeCursor(point) {
		const s = this.settings;
		const pos = this.cursor.geometry.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const a = (i / pos.count) * Math.PI * 2;
			const x = point.x + Math.cos(a) * s.brushRadius;
			const z = point.z + Math.sin(a) * s.brushRadius;
			pos.setXYZ(i, x, this.height(x, z) + 0.06, z);
		}
		pos.needsUpdate = true;
		this.cursor.geometry.computeBoundingSphere();
		this.cursor.material.color.setHex({ dirt: 0xd09a5c, wet: 0x5aa0ff, grass: 0x8fd060, blood: 0xd03a44 }[s.brushLayer] ?? 0xffffff);
		this.cursor.visible = true;
	}

	hitGround(event) {
		return this.app.raycast(event, [this.ground])[0]?.point || null;
	}

	dab(point) {
		const s = this.settings;
		this.splat.paint(point.x, point.z, { layer: s.brushLayer, radius: s.brushRadius, strength: s.brushStrength, hardness: s.brushHardness, noise: s.brushNoise });
		this.stroke.last = point.clone();
	}

	setPaint(on) {
		this.settings.paint = on;
		const c = this.app.rig.controls;
		if (on) {
			this._savedLeft ??= c.mouseButtons.LEFT;
			c.mouseButtons.LEFT = -1;
		} else {
			if (this._savedLeft !== undefined) c.mouseButtons.LEFT = this._savedLeft;
			this._savedLeft = undefined;
			this.cursor.visible = false;
		}
	}

	activate() {
		this.app.world.vfxScene.add(this.vfx);
		const canvas = this.app.backend.canvas;
		this._onDown = (e) => {
			if (!this.settings.paint || e.button !== 0) return;
			const p = this.hitGround(e);
			if (!p) return;
			this.splat.pushUndo();
			this.stroke = { last: null };
			this.dab(p);
			this.splat.flush();
		};
		this._onMove = (e) => {
			if (!this.settings.paint) return;
			const p = this.hitGround(e);
			if (!p) {
				this.cursor.visible = false;
				return;
			}
			this.placeCursor(p);
			if (!this.stroke) return;
			const step = Math.max(0.1, this.settings.brushRadius * 0.25);
			const from = this.stroke.last;
			const dist = from.distanceTo(p);
			for (let t = step; t <= dist; t += step) this.dab(from.clone().lerp(p, t / dist));
			this.splat.flush();
		};
		this._onUp = () => {
			if (!this.stroke) return;
			this.stroke = null;
			this.rebuildGrass();
		};
		this._onKey = (e) => {
			if (!this.settings.paint || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
			e.preventDefault();
			if (this.splat.undo()) this.rebuildGrass();
		};
		canvas.addEventListener('pointerdown', this._onDown);
		canvas.addEventListener('pointermove', this._onMove);
		addEventListener('pointerup', this._onUp);
		addEventListener('keydown', this._onKey);
		this._offClick = this.app.on('click', () => {
			if (this.settings.paint) this.app.consumedClick = true;
		});
		if (this.settings.paint) this.setPaint(true);
	}

	deactivate() {
		this.app.world.vfxScene.remove(this.vfx);
		const canvas = this.app.backend.canvas;
		canvas.removeEventListener('pointerdown', this._onDown);
		canvas.removeEventListener('pointermove', this._onMove);
		removeEventListener('pointerup', this._onUp);
		removeEventListener('keydown', this._onKey);
		this._offClick?.();
		this._onUp();
		const keep = this.settings.paint;
		this.setPaint(false);
		this.settings.paint = keep;
	}

	// ---------------------------------------------------------------------------------------------
	// Frame

	update(delta, elapsed) {
		this.time = elapsed;
		const subject = this.app.subject.root.getWorldPosition(this._subject ??= new THREE.Vector3());
		if (this.heroLight.visible) {
			this.heroLight.position.copy(subject);
			this.heroLight.position.y += this.heroHeight ?? 3;
		}
		this.flames.update(elapsed);
		if (this.waterMesh?.visible) this.waterMaterial.map.offset.y = (-elapsed * this.settings.waterFlow) % 1;

		// God-blood well: slow, low pulse (environment tier: barely there).
		this.mat.wellBlood.emissiveIntensity = 0.04 + 0.16 * this.settings.wellPulse * (0.5 + 0.5 * Math.sin(elapsed * 1.3));

		// Telegraphs; the well's Vessel burst pops the blood sac beside it.
		const post = this.app.settings.data.post;
		if (this.signalKey !== `${displayKey(post)}|${this.settings.signalMatch}`) this.refreshSignalColors();
		for (const t of this.telegraphs) t.update(elapsed);
		const burst = this.wellTelegraph;
		const sac = this.sacs[0];
		if (sac) {
			const tt = (((elapsed + burst.offset) % burst.period) + burst.period) % burst.period;
			const after = tt - burst.windup;
			if (!this.settings.telegraphs) sac.scale.setScalar(sac.userData.base);
			else if (after >= 0 && after < 1.6) sac.scale.setScalar(after < 0.12 ? sac.userData.base * (1 + after * 2.5) : sac.userData.base * Math.max(0.02, smooth(1.0, 1.6, after)));
			else sac.scale.setScalar(sac.userData.base * (1 + (tt < burst.windup ? (tt / burst.windup) * 0.18 : 0)));
		}
		// Hazard activity: the sacs breathe; the resonance heart beats in the Bellwether's double rhythm.
		this.sacMaterial.emissiveIntensity = 0.04 + 0.32 * (0.5 + 0.5 * Math.sin(elapsed * 2.1)) ** 3; // slow swell: the activity tell
		const beat = (x) => Math.exp(-(((x % 1.6) * 9) ** 2)) + 0.7 * Math.exp(-((((x % 1.6) - 0.28) * 9) ** 2));
		this.heartMaterial.emissiveIntensity = this.settings.telegraphs ? 0.1 + 1.6 * beat(elapsed) : 0.08;
		for (const nest of this.nests) nest.scale.y = 1 + 0.035 * Math.sin(elapsed * 2.4 + nest.userData.phase);
		this.updateCrows(elapsed);

		// Interact glint: ivory rim + ground ring as the character comes close (rule VI: same sign in every area).
		const glint = this.settings.glint ? this.settings.glintStrength : 0;
		for (const it of this.interactables) {
			const d = Math.hypot(subject.x - it.at.x, subject.z - it.at.z);
			const near = 1 - smooth(it.ringRadius + 1.2, it.ringRadius + 6, d);
			it.glint += (near - it.glint) * Math.min(1, delta * 6);
			if (it.rim) it.rim.uniforms.intensity.value = glint * (0.35 + 2.2 * it.glint) * (0.85 + 0.15 * Math.sin(elapsed * 3));
			it.ring?.setOpacity(glint ? it.glint : 0);
		}

		this.updateCrowds(delta, elapsed);
		if (this.classOverlay.visible) for (const o of this.classOverlay.children) o.matrix.copy(o.userData.source.matrixWorld);
	}

	updateCrows(time) {
		if (!this.crowMesh) return;
		const dummy = new THREE.Object3D();
		this.crowSpots.forEach((c, i) => {
			const t = time + c.phase;
			const hop = Math.max(0, Math.sin(t * 2.2)) ** 6 * 0.12;
			const peck = Math.max(0, Math.sin(t * 5.3 + i)) ** 4 * 0.5;
			dummy.position.set(c.x, this.height(c.x, c.z) + hop, c.z);
			dummy.rotation.set(peck, c.yaw + Math.sin(t * 0.7) * 0.6, 0);
			dummy.scale.setScalar(c.s);
			dummy.updateMatrix();
			this.crowMesh.setMatrixAt(i, dummy.matrix);
		});
		this.crowMesh.instanceMatrix.needsUpdate = true;
	}

	// ---------------------------------------------------------------------------------------------
	// Panels

	buildLightingControls(folder, rebuildLights) {
		const s = this.settings;
		const save = () => this.app.settings.changed('weeping');
		if (!this.mood) {
			folder.add(s, 'time', Object.fromEntries(Object.entries(WEEPING_TIMES).map(([id, t]) => [t.label, id]))).name('Time of day').onChange(async () => {
				save();
				await this.applyTime();
				this.app.applyScenePost(this, true);
				rebuildLights();
			});
		}
		folder.add(s, 'cartFire').name('Burning cart (fire light)').onChange(() => (save(), this.applyFireSettings()));
		folder.add(s, 'lanterns', 0, 3, 0.01).name('Lanterns ×').onChange(() => (save(), this.applyFireSettings()));
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const app = this.app;
		const save = () => app.settings.changed('weeping');

		// Rules ---------------------------------------------------------------------------------
		const fr = folder.addFolder('Rules · màu & khả năng đọc');
		note(fr, this.paletteHtml());
		fr.add(s, 'view', Object.fromEntries(Object.entries(VIEWS).map(([id, v]) => [v.label, id]))).name('Góc kiểm tra (checklist)').onChange((id) => (save(), this.frameView(id)));
		fr.add({ frame: () => this.frameView(s.view) }, 'frame').name('↺ Đưa camera về góc đã chọn');
		const post = app.settings.data.post;
		post.check ??= 'none';
		fr.add(post, 'check', Object.fromEntries(Object.entries(CHECK_VIEWS).map(([id, c]) => [c.label, id]))).name('Readability check view').onChange(() => {
			app.settings.changed('post');
			app.applyLut();
			app.panels?.refresh();
		}).listen();
		const views = () => (save(), this.applyRuleViews());
		fr.add(s, 'classView').name('Class view (VI): cản · phá · tương tác · nguy hiểm').onChange(views);
		note(fr, `<div class="wf-legend">${Object.values(V.CLASSES).map((c) => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('')}</div>`);
		fr.add(s, 'telegraphs').name('Telegraph demo (I.5) + nhịp tim cột cộng hưởng').onChange(views);
		fr.add(s, 'sampler').name('Bảng mẫu 6 màu chức năng trên cỏ').onChange(views);
		fr.add(s, 'glint').name('Interact glint theo khoảng cách').onChange(save);
		fr.add(s, 'glintStrength', 0, 3, 0.01).name('Glint strength').onChange(save);
		fr.add(s, 'signalMatch').name('Màu tín hiệu = đúng hex trên màn hình').onChange(() => (save(), this.refreshSignalColors()));
		const report = note(fr, '');
		this.onSignalReport = () => (report.innerHTML = this.signalReportHtml());
		this.onSignalReport();
		fr.add(s, 'crowdMeadow').name('Stand-in: 12 Redbound · đồng cỏ').onChange((v) => this.setCrowd('meadow', v));
		fr.add(s, 'crowdWell').name('Stand-in: 6 Redbound · nền huyết').onChange((v) => this.setCrowd('well', v));
		note(fr, 'Stand-in = quái procedural của lab (Groveling đỏ ≈ Scavenger, Shaman ≈ Bellwether, Pit Fiend ≈ Brute): kiểm tra <b>màu/độ sáng</b> trên nền, không phải silhouette thật của Redbound.');

		// Corruption --------------------------------------------------------------------------------
		const fc = folder.addFolder('Remnant corruption · thần huyết');
		const cor = () => (save(), this.applyCorruption());
		fc.add(s, 'blood', 0, 1.5, 0.01).name('Blood-soaked ground').onChange(cor);
		fc.addColor(s, 'bloodTint').name('Soaked tint (× ground)').onChange(cor);
		fc.addColor(s, 'veinColor').name('Vein lines').onChange(cor);
		fc.add(s, 'veins').name('3D veins (giếng → móng → sàn → vết nứt)').onChange(cor);
		fc.add(s, 'wellPulse', 0, 1, 0.01).name('Well pulse (môi trường: rất nhẹ)').onChange(save);

		// Terrain ---------------------------------------------------------------------------------
		const layers = () => (save(), this.applyLayerSettings());
		const fl = folder.addFolder('Terrain layers · dirt → wet → grass → blood').close();
		fl.add(s, 'paletteLock').name('Palette lock (Valdren swatches)').onChange((v) => this.setPaletteLock(v));
		fl.add(s, 'showWeights').name('Show layer weights').onChange(layers);
		fl.add(s, 'softness', 0.02, 0.49, 0.01).name('Transition softness').onChange(layers);
		fl.add(s, 'heightBlend', 0, 1.5, 0.01).name('Height-based blend').onChange(layers);
		fl.add(s, 'water', 0, 0.6, 0.01).name('Standing water level').onChange(layers);
		fl.add(s, 'damp', 0, 0.6, 0.01).name('Damp halo around wet').onChange(layers);
		fl.add(s, 'grassShadow', 0, 1, 0.01).name('Contact shadow around grass').onChange(layers);
		fl.add(s, 'grassLift', -0.3, 0.6, 0.01).name('Grass over soil (height bias)').onChange(layers);
		fl.add(s, 'edgeCards', 0, 3, 0.05).name('3D grass along edges').onFinishChange(() => (save(), this.rebuildGrass()));
		fl.add(s, 'variation', 0, 1, 0.01).name('Tiling breakup').onChange(layers);
		fl.add(s, 'macro', 0, 0.8, 0.01).name('Large-scale variation').onChange(layers);
		fl.add(s, 'edgeNoise', 0, 1, 0.01).name('Edge noise').onChange(layers);
		fl.add(s, 'splatBlur', 0, 8, 1).name('Splat smoothing (texels)').onFinishChange(() => (layers(), this.rebuildGrass()));
		const ribbons = () => (save(), this.applyRibbonSettings());
		fl.add(s, 'roadRuts').name('Road ruts').onChange(ribbons);
		fl.add(s, 'creekWater').name('Creek water').onChange(ribbons);

		// Atmosphere --------------------------------------------------------------------------------
		const p = app.settings.data.post;
		const postChanged = () => {
			app.settings.changed('post');
			app.applyPost();
			app.panels?.refresh();
		};
		const fa = folder.addFolder('Atmosphere · fog, vignette, shadows').close();
		fa.add(p.fog, 'enabled').name('Height fog').onChange(postChanged).listen();
		fa.add(p.fog, 'density', 0, 0.3, 0.001).name('Fog density').onChange(postChanged).listen();
		fa.add(p.fog, 'falloff', 0.01, 2, 0.01).name('Fog height falloff').onChange(postChanged).listen();
		fa.add(p.fog, 'start', 0, 40, 0.5).name('Fog start (m)').onChange(postChanged).listen();
		fa.addColor(p.fog, 'color').name('Fog colour').onChange(postChanged).listen();
		fa.add(p.grade, 'vignette', 0, 1.2, 0.01).name('Vignette').onChange(postChanged).listen();
		fa.add(p, 'exposure', -4, 4, 0.05).name('Exposure (EV)').onChange(postChanged).listen();
		const fill = () => (save(), this.updateFill());
		fa.add(s, 'shadowStrength', 0, 1, 0.01).name('Cast shadow strength').onChange(fill);
		fa.add(s, 'fill').name('Shadow fill on assets').onChange(fill);
		fa.add(s, 'fillStrength', 0, 4, 0.01).name('Shadow fill strength').onChange(fill);
		fa.addColor(s, 'fillColor').name('Shadow fill colour').onChange(fill);
		fa.add({ reset: () => app.applyScenePost(this, true) }, 'reset').name('Reset to time-of-day preset');

		// Brush ---------------------------------------------------------------------------------------
		const fb = folder.addFolder('Brush (left drag in the viewport)').close();
		fb.add(s, 'paint').name('Paint').onChange((v) => (save(), this.setPaint(v)));
		fb.add(s, 'brushLayer', BRUSH_LAYERS_BLOOD).name('Layer').onChange(save);
		fb.add(s, 'brushRadius', 0.3, 12, 0.1).name('Radius (m)').onChange(save);
		fb.add(s, 'brushStrength', 0.02, 1, 0.01).name('Strength').onChange(save);
		fb.add(s, 'brushHardness', 0, 0.95, 0.01).name('Hardness').onChange(save);
		fb.add(s, 'brushNoise', 0, 1, 0.01).name('Edge noise').onChange(save);
		const actions = {
			undo: () => this.splat.undo() && this.rebuildGrass(),
			regenerate: () => (this.splat.pushUndo(), this.generateSplat(), this.rebuildGrass()),
			exportPng: () => {
				const a = document.createElement('a');
				a.download = 'weeping_splat_R-wet_G-grass_B-blood.png';
				a.href = this.splat.toCanvas().toDataURL('image/png');
				a.click();
			},
		};
		fb.add(actions, 'undo').name('Undo (Ctrl+Z)');
		fb.add(actions, 'regenerate').name('Regenerate from landscape');
		fb.add(actions, 'exportPng').name('Export splat PNG');

		const fg = folder.addFolder('Grass & wind').close();
		fg.add(s, 'grassDensity', 0, 3, 0.05).name('Tuft density').onFinishChange(() => (save(), this.rebuildGrass()));
		fg.add(s, 'wind', 0, 1.2, 0.01).name('Wind strength').onChange((v) => {
			save();
			this.windGrass.uniforms.strength.value = v;
			this.windTrees.uniforms.strength.value = v * 0.35;
			this.windShrubs.uniforms.strength.value = v * 0.6;
			this.windCloth.uniforms.strength.value = v * 0.7;
		});
	}

	/**
	 * How the current display transform treats the function palette: each hex drawn as a plain colour (what an engine
	 * shows if the signal goes through tone mapping) and the error left after matching (out of gamut when large).
	 */
	signalReportHtml() {
		const post = this.app.settings.data.post;
		const rows = Object.entries(this.signalReport ?? {}).map(([id, list]) => list.map((r) => `<div class="wf-row"><b>${V.FUNCTION[id].label.split(' /')[0]}</b><span><i class="wf-sw" style="background:${r.hex}" title="spec ${r.hex}"></i><i class="wf-sw" style="background:${r.raw}" title="shown ${r.raw}"></i></span><em>${r.hex} → ${r.raw} · ΔE ${r.rawError.toFixed(0)}${r.matchError > 3 ? ` · khớp tối đa ΔE ${r.matchError.toFixed(0)}` : ''}</em></div>`).join('')).join('');
		return `<div class="wf-palette"><h4>Tín hiệu qua tone mapping (${post.toneMapping}, ${post.exposure >= 0 ? '+' : ''}${(+post.exposure).toFixed(2)} EV)</h4>
			<p>Ô trái = hex quy định, ô phải = hex đó vẽ thẳng như màu phẳng sau grade + tone mapping (CIE76). Với "đúng hex" bật, decal tín hiệu được bù để hiển thị ô trái; ΔE còn lại lớn = ngoài gam của tone mapper.</p>${rows}</div>`;
	}

	/** Palette panel: Valdren swatches (with the locked materials using them), function colours, priority scale. */
	paletteHtml() {
		const sw = (hex, title) => `<i class="wf-sw" style="background:${hex}" title="${title} ${hex}"></i>`;
		const groups = V.VALDREN_GROUPS.map(([name, desc, keys]) => `<div class="wf-row"><b>${name}</b><span>${keys.map((k) => sw(V.VALDREN[k], k)).join('')}</span><em>${desc}</em></div>`).join('');
		const funcs = Object.values(V.FUNCTION).map((f) => `<div class="wf-row"><b>${f.label}</b><span>${sw(f.colors[0], 'base')}${sw(f.colors[1], 'highlight')}</span><em>${f.colors.join(' · ')}</em></div>`).join('');
		const prio = V.PRIORITY.map(([name, v]) => `<div class="wf-bar"><span>${name}</span><i style="width:${v}%"></i><b>${v}</b></div>`).join('');
		return `<div class="wf-palette">
			<p>Thế giới = bối cảnh · sinh vật = danh tính · hiệu ứng = thông tin gameplay.</p>
			<h4>Bảng màu Valdren (swatch đề xuất — vật liệu được khoá về đúng màu trung bình này)</h4>${groups}
			<h4>Màu chức năng (I.2)</h4>${funcs}
			<h4>Thang nổi bật (I.3)</h4>${prio}
		</div>`;
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

	dispose() {
		this.scene.traverse((o) => o.geometry?.dispose());
		this.flames.dispose();
		this.splat.dispose();
		for (const t of this.telegraphs) t.dispose();
		for (const p of this.samplerParts ?? []) p.dispose?.();
		for (const crowd of Object.values(this.crowds)) for (const model of crowd.models) model.dispose();
	}
}

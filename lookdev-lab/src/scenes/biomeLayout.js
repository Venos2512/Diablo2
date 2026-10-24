// Act I · Bố trí biome (thuật toán) — the 3D view of the biome layout engine (env/biomeLayout.js, art direction 12 §4.13).
// ONE seed → the whole map: planSource 'seed' (default) generates the plan from `mapSeed` (env/planGen.js, AD 12 §4.15) and dresses it with the
// engine; planSource 'demo' is the hand-made DEMO_PLAN. The plan is chosen per scene instance (this.plan), in init(), before anything reads it.
// The scene renders layoutBiome(plan, catalog, options) with the real kits so the result can be judged from the game
// camera, and shows WHY things stand where they stand: overlays for the locked play space, footprints, use zones, camera
// occlusion zones, decision points, clusters, trace events and the drops, a report panel (counts, drops, warnings, the 15
// checks, per-step ms) and per-group seeds / densities.
//
// It is the moor's TerrainScene (splat ground, ribbons, shells, brush, ground blend, wind, shadow fill, time presets) with the
// plan's own landscape: height() and weights() are the plan's ground sampler — the very function the engine placed things on —
// and the paths / water of the plan are the road and creek of the base class. The terrain is the plan's 128 m (the base class
// is hard-wired to 120 m), so the splat is replaced and buildTerrain() is overridden.
//
// Lights: the moon (one shadow map) + sky ambient + the player's light. The plan's lights (torches, lanterns, braziers,
// candles) are flames with small point lights WITHOUT shadows: the terrain's fragment stage has 16 sampler slots on WebGPU.
//
// Load: the map is cut into 16 m modules (env/mapModules.js, AD 12 §4.14). loadMode 'modules' loads only the kits of the modules around
// the hero before the first frame and streams the rest in (env/mapStream.js) without a hitch; 'all' loads every kit and builds every
// module first, as it always did (A/B). The layout and the splat come from the browser cache (env/mapCache.js) or the baked file
// assets/maps/ (npm run bake:map) when their key matches, so a known map never runs the engine on load. A generated map is cached by (seed, size,
// generator version, options, code) → the accepted attempt: a warm load regenerates the plan from it (generatePlan(seed, { attempt }), ≈ 40 ms)
// and takes the layout and the splat from the cache; the engine and the attempt search run only on a cold load.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { note } from '../ui/gui.js';
import { TerrainScene, TERRAIN_DEFAULTS } from './terrain.js';
import { FIELD_TIMES as WEEPING_TIMES } from '../env/fieldTimes.js';
import { TerrainSplat, TERRAIN_SETS, BRUSH_LAYERS, createTerrainMaterial, loadRibbonTextures, grassCardGeometry } from '../env/terrain.js';
import * as V from '../env/valdren.js';
import * as kit from '../env/kit.js';
import { InstanceBuilder, InstanceCells } from '../env/instancing.js';
import { FlameField } from '../env/flames.js';
import { GroundBlend, GROUND_PROFILES } from '../env/groundBlend.js';
import { loadKits, ribbonGeometry, twoSided, smooth } from '../env/outdoor.js';
import { groundLabel } from '../env/signals.js';
import { polylineDistance, pathCoverage } from '../env/surfaces.js';
import { layoutBiome, obbFrom, pointInPoly, toWorld, DEFAULT_OPTIONS } from '../env/biomeLayout.js';
import { PLAN_GEN_VERSION, checkPlan, generateMap, generatePlan, mapBudgets } from '../env/planGen.js';
import { ASSETS, buildCatalog } from '../env/biomeCatalog.js';
import { DEMO_PLAN } from '../env/biomeLayoutDemo.js';
import { KIT_SAMPLES, MODULE_RULES, bakeBytes, bakeLayout, checkModules, acceptKey, genKey, layoutKey, loadOrder, mapStart, restoreLayout, splitModules } from '../env/mapModules.js';
import { codeOf } from '../env/mapCodeText.js';
import { MapStream } from '../env/mapStream.js';
import { mapCache } from '../env/mapCache.js';
import { sampleById } from '../core/assets.js';
import sizes from '../env/kitSizes.json';
import kitBytes from '../env/kitBytes.json';

const MAP_SIZES = [128, 192, 256]; // m. planGen makes all three (192 / 256 scale the zone counts) and the scene, terrain, splat and modules handle them; Play's nav grid is 128 m around the spawn (gameplay/host.js GRID) whatever the size
const LOOK = 1;
const RULES = MODULE_RULES;
const SPLAT_VERSION = 1; // bump when the SHAPE of the cached splat data changes; a different painter is already a different key (the splat key hashes this file, kit.js and terrain.js)
const SPLAT_CACHE = 'splat';
const TUFT_DRAWS = 5; // random numbers one grass tuft draws (width, three angles, colour): see buildGrass

registerDefaults('biomeLayout', {
	...TERRAIN_DEFAULTS,
	look: 0,
	layerSet: 'moor',
	time: 'night',
	view: 'play',
	roadRuts: true,
	rutsOpacity: 0.9,
	creekWater: true,
	waterLevel: 0.05,
	waterOpacity: 0.7,
	water: 0.18,
	waterRough: 0.32,
	wind: 0.3,
	edgeCards: 1,
	shellCount: 10,
	shadowStrength: 0.6,
	fill: false,
	fillStrength: 1.2,
	fillColor: '#4c5a50',
	fillThreshold: 0.08,
	cells: 16, // instancing cell (m); 0 = map-wide
	// One seed → the whole map (planGen). Build-time: a change reloads the scene.
	planSource: 'seed', // 'seed' = generated from mapSeed; 'demo' = the hand-made DEMO_PLAN
	mapSeed: 1,
	mapSize: 128,
	// The algorithm: the demo's master seed (plan.seed; a generated map's master seed is mapSeed), one seed per group, densities. Build-time: a change reloads the scene.
	seed: DEMO_PLAN.seed ?? 1,
	seedMass: DEFAULT_OPTIONS.seeds.mass,
	seedCluster: DEFAULT_OPTIONS.seeds.cluster,
	seedGuide: DEFAULT_OPTIONS.seeds.guide,
	seedEcology: DEFAULT_OPTIONS.seeds.ecology,
	seedTrace: DEFAULT_OPTIONS.seeds.trace,
	densityGrass: DEFAULT_OPTIONS.density.grass,
	densityShrubs: DEFAULT_OPTIONS.density.shrubs,
	densityTraces: DEFAULT_OPTIONS.density.traces,
	densityMasses: DEFAULT_OPTIONS.density.masses,
	// Explanation overlays and the class view.
	classView: false,
	ovPlay: false,
	ovFootprints: false,
	ovUse: false,
	ovOcclusion: false,
	ovDecisions: false,
	ovClusters: false,
	ovEvents: false,
	ovDrops: false,
	pointLights: true,
	// Fast load (AD 12 §4.14). Build-time: a change reloads the scene.
	loadMode: 'modules', // 'modules' = the first frame needs only the kits around the hero, the rest streams in; 'all' = everything first (A/B)
	useCache: true, // layout + splat from the browser cache / the baked file (off = the engine and the generator run on every load)
	ovModules: false, // overlay: the module grid
});

/** Time presets: the Weeping Fields ones (Night = Diablo II light radius, Overcast = neutral colour check, Dusk). */
export const BIOME_TIMES = { night: WEEPING_TIMES.night, overcast: WEEPING_TIMES.overcast, dusk: WEEPING_TIMES.dusk };

// kit key (as the catalog's assets name it) → library sample id (one table for the scene and the node scripts)
const KIT_IDS = KIT_SAMPLES;
const TREE_KITS = new Set(['deadTrees', 'burnedTrees']);
const WALK_CLEAR = 0.3; // the hero stands at least this far from walk-through pieces (m)
const CLASS_ORDER = ['obstacle', 'destructible', 'decor', 'guide', 'interactive', 'hazard'];
/** Class colours (class view and the footprint overlay): V.CLASSES for the four of AD 12 §4.12, own ones for decor and guide. */
const CLASS_COLORS = { ...Object.fromEntries(Object.entries(V.CLASSES).map(([id, c]) => [id, c.color])), decor: '#8fbf6a', guide: '#ffb347' };
const CLASS_LABELS = { ...Object.fromEntries(Object.entries(V.CLASSES).map(([id, c]) => [id, c.label])), decor: 'Trang trí (đi xuyên)', guide: 'Dẫn đường (đuốc, biển)' };
/** Flame [width, height] and light power by kit piece (the engine gives the light's position; the look is the scene's). */
const FLAMES = { torch: [0.26, 0.5, 12], lantern_post: [0.22, 0.4, 12], brazier: [0.55, 0.85, 16], beacon: [0.7, 1.15, 20], candles: [0.07, 0.14, 3], pot_tripod: [0.4, 0.5, 9] };
const FLAME_DEFAULT = [0.3, 0.5, 10];
const OV = {
	path: '#4aa3ff', door: '#37d6c5', interaction: '#ffe27a', spawn: '#ff5d5d', arena: '#ff9a3c', water: '#4fc3ff',
	use: '#c76bff', occlusion: '#ff4fa8', drop: '#ff3030', event: '#ffb347', eventDropped: '#ff3030',
	decision: { fork: '#ffd84a', gate: '#ff9a3c', bridge: '#4fc3ff', bend: '#b48cff' },
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const segDist = (x, z, a, b) => {
	const dx = b.x - a.x;
	const dz = b.z - a.z;
	const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
	return Math.hypot(x - a.x - t * dx, z - a.z - t * dz);
};
const centreOf = (shape) => {
	if (!shape) return null;
	if (Array.isArray(shape)) return { x: shape.reduce((s, p) => s + p.x, 0) / shape.length, z: shape.reduce((s, p) => s + p.z, 0) / shape.length };
	if (shape.r !== undefined) return { x: shape.x, z: shape.z };
	if (shape.x0 !== undefined) return { x: (shape.x0 + shape.x1) / 2, z: (shape.z0 + shape.z1) / 2 };
	return null;
};
/** kit.rng(seed) already advanced by `skip` draws, in O(1): mulberry32's state moves by a constant per draw, so every tuft can draw from its own place in the stream. */
const rngAt = (seed, skip) => kit.rng((seed + skip * 0x6d2b79f5) >>> 0);
const toVec3 = (points) => points.map((p) => new THREE.Vector3(p.x, 0, p.z));

/** Distance (m) to the nearest of `segments` ([a, b] pairs) or, with `inside`, 0 inside the polygons; exact, on a `cell` grid over the square `{ origin, size }`. */
function exactField(segments, polygons, { origin, size }, cell = 0.5) {
	const n = Math.round(size / cell) + 1;
	const field = new Float32Array(n * n);
	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			const x = origin.x + i * cell;
			const z = origin.z + j * cell;
			let best = Infinity;
			for (const [a, b] of segments) best = Math.min(best, segDist(x, z, a, b));
			if (polygons.some((poly) => pointInPoly(poly, x, z))) best = 0;
			field[j * n + i] = best;
		}
	}
	return { field, n, cell, origin };
}

function lookup({ field, n, cell, origin }, x, z) {
	const fx = clamp((x - origin.x) / cell, 0, n - 1.001);
	const fz = clamp((z - origin.z) / cell, 0, n - 1.001);
	const i = Math.floor(fx);
	const j = Math.floor(fz);
	const tx = fx - i;
	const tz = fz - j;
	const a = field[j * n + i] * (1 - tx) + field[j * n + i + 1] * tx;
	const b = field[(j + 1) * n + i] * (1 - tx) + field[(j + 1) * n + i + 1] * tx;
	return a * (1 - tz) + b * tz;
}

const pathSegments = (path) => path.points.slice(1).map((p, k) => [path.points[k], p]);

/** Points of a polyline resampled every `step` m (closed: back to the first point). */
function sampleLine(points, closed, step = 0.8) {
	const out = [];
	const n = closed ? points.length : points.length - 1;
	for (let i = 0; i < n; i++) {
		const a = points[i];
		const b = points[(i + 1) % points.length];
		const len = Math.hypot(b.x - a.x, b.z - a.z);
		const k = Math.max(1, Math.ceil(len / step));
		for (let s = 0; s < k; s++) out.push({ x: a.x + ((b.x - a.x) * s) / k, z: a.z + ((b.z - a.z) * s) / k });
	}
	out.push(closed ? { ...points[0] } : { ...points[points.length - 1] });
	return out;
}

/** n upward normals: the overlay geometries are unlit, but the WebGPU node materials still look for the attribute (and a uv: without it fills render black). */
const upNormals = (n) => new THREE.Float32BufferAttribute(Array.from({ length: n * 3 }, (_, i) => (i % 3 === 1 ? 1 : 0)), 3);

/** Circle as a polygon (counter-clockwise from above). */
const circlePoly = (x, z, r, n = 40) => Array.from({ length: n }, (_, i) => ({ x: x + Math.cos((i / n) * Math.PI * 2) * r, z: z + Math.sin((i / n) * Math.PI * 2) * r }));

export class BiomeLayoutScene extends TerrainScene {
	constructor(app) {
		super(app, 'biomeLayout');
		this.label = 'Act I · Bố trí biome (thuật toán)';
		this.scene.name = 'Biome layout';
		// The plan is chosen in init() (adoptPlan: a generated one may come from the cache), so everything that reads it - the splat, the distance
		// fields, the views, the start - is made there. The base class sized its splat for 120 m: it is replaced.
		this.plan = null;
		this.splat.dispose();
		this.splat = null;
		this.times = BIOME_TIMES;
		this.defaultSubject = 'd2r-sorceress'; // the map is judged with the hero next to it
		this.cell = this.settings.cells > 0 ? this.settings.cells : Infinity; // read once: a change reloads the scene
		this.overlays = {};
		this.classMeshes = {};
		this.groups = {};
		this.warnedKinds = new Set();
		this.warmFrames = 0;
		this.stream = null;
		this.ready = false; // init finished: later builds (streamed modules) tag their programs themselves
		this.deferred = [];
		this.lastFrameAt = 0;
		this.staging = null; // while a streamed module is built: { id, root, attach[], classes }, see attach()
		this.uploaded = new WeakSet(); // textures a mesh of the scene has used (or that were uploaded ahead of it)
		this.compiledClasses = new Set(); // program classes (programClass) that exist: the ring-0 content and every module compiled since
		this.pendingReveals = 0; // staged modules that are compiling
		this.disposed = false;
	}

	// -- plan → base class ------------------------------------------------------------------------------------------

	/** The main road and the creek of the plan (the base constructor builds its distance fields from these; ours are exact). The base constructor runs before the plan exists: nothing then. */
	curves() {
		if (!this.plan) return { road: [], creek: [] };
		const main = this.plan.paths.find((p) => p.kind === 'road') ?? this.plan.paths[0];
		const creek = this.plan.water.find((w) => w.points && !w.polygon);
		return { road: toVec3(main.points), creek: creek ? toVec3(creek.points) : [] };
	}

	/**
	 * Makes the plan this scene instance is about: its square, the terrain splat, the distance fields, the start, the views. Called once, from
	 * loadLayout, as soon as the plan exists (the layout and the checks come after it).
	 */
	adoptPlan(plan) {
		this.plan = plan;
		this.bounds = plan.bounds;
		this.size = Math.max(plan.bounds.x1 - plan.bounds.x0, plan.bounds.z1 - plan.bounds.z0); // the terrain covers the plan's square
		this.origin = { x: plan.bounds.x0, z: plan.bounds.z0 };
		this.splat = new TerrainSplat({ size: 512, originX: this.origin.x, originZ: this.origin.z, extent: this.size });
		this.splat.blur = this.settings.splatBlur;
		const extent = { origin: this.origin, size: this.size };
		this.pathField = exactField(plan.paths.flatMap(pathSegments), [], extent);
		const waterSegments = plan.water.filter((w) => w.points && !w.polygon).flatMap((w) => w.points.slice(1).map((p, k) => [w.points[k], p]));
		this.waterField = exactField(waterSegments, plan.water.filter((w) => w.polygon).map((w) => w.polygon), extent);
		this.hero = mapStart(plan); // the same start the bake checks and the module order use; resolveStands() moves it to the free spot near it
		this.views = this.makeViews();
		if (!this.views[this.settings.view]) this.settings.view = 'play'; // a saved view of an area this map does not have
		this.home = this.viewCamera(this.views.play);
	}

	roadDistance(x, z) {
		return lookup(this.pathField, x, z);
	}

	creekDistance(x, z) {
		return lookup(this.waterField, x, z);
	}

	/** The plan's ground — the SAME function the engine placed everything on. */
	height(x, z) {
		return this.plan.ground(x, z).height;
	}

	/** Carpet density (0..1) of the engine's ecology at (x, z): zero where grass may not grow (corridors, footprints, water). */
	carpetAt(x, z) {
		const c = this.result?.ecology.carpet;
		if (!c) return 1;
		const fx = clamp((x - c.x0) / c.cell - 0.5, 0, c.nx - 1.001);
		const fz = clamp((z - c.z0) / c.cell - 0.5, 0, c.nz - 1.001);
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		const tx = fx - i;
		const tz = fz - j;
		const d = c.density;
		const a = d[j * c.nx + i] * (1 - tx) + d[j * c.nx + i + 1] * tx;
		const b = d[(j + 1) * c.nx + i] * (1 - tx) + d[(j + 1) * c.nx + i + 1] * tx;
		return a * (1 - tz) + b * tz;
	}

	/** [wet, grass, blood]: the plan's ground; the grass layer (and so the shell grass) follows the engine's carpet, so it stops at corridors and footprints. */
	weights(x, z) {
		const g = this.plan.ground(x, z);
		const grass = Math.min(g.grass, this.carpetAt(x, z) * 1.15);
		return [g.water ? 1 : g.wet, grass, g.blood];
	}

	/** Weights, then the engine's ground paint (bare dirt / damp under traces and prop feet). */
	generateSplat() {
		super.generateSplat();
		for (const p of this.result?.groundPaint ?? []) this.splat.paint(p.x, p.z, { layer: p.layer, radius: p.radius, strength: p.strength, hardness: 0.4, noise: 0.35 });
		this.splat.flush();
	}

	// -- views --------------------------------------------------------------------------------------------------------

	/**
	 * Camera views, derived from the plan's zones / hosts / water: play (D2 iso 2:1), overview, and each area in ¾ and in the game camera.
	 * A generated plan may lack a farm, camp, den, graveyard, creek or cliff: the views of an area the map does not have are not offered.
	 */
	makeViews() {
		const PLAN = this.plan;
		const BOUNDS = PLAN.bounds;
		const inside = (shape, p) => (shape.r !== undefined ? Math.hypot(p.x - shape.x, p.z - shape.z) <= shape.r : Array.isArray(shape) && pointInPoly(shape, p.x, p.z));
		const area = (kind, fallback) => {
			const zone = PLAN.zones.find((z) => z.kind === kind);
			if (!zone) return null;
			const members = [...(PLAN.hosts ?? []), ...(PLAN.masses ?? [])].map((h) => h.at).filter((p) => p && inside(zone.shape, p));
			const c = centreOf(members.length ? members : zone.shape);
			return { x: c.x, z: c.z, r: zone.shape.r ?? 14 };
		};
		const creek = PLAN.water.find((w) => w.points && !w.polygon);
		const road = PLAN.paths.find((p) => p.kind === 'road') ?? PLAN.paths[0];
		let ford = null;
		if (creek) {
			let best = Infinity;
			for (const p of sampleLine(road.points, false, 1)) {
				const d = this.creekDistanceRaw(p.x, p.z, creek);
				if (d < best) {
					best = d;
					ford = p;
				}
			}
		}
		const farmZone = area('farm');
		const farm = farmZone && this.farmArea(farmZone);
		const camp = area('camp');
		const den = area('den');
		const grave = area('graveyard');
		const cliff = (PLAN.masses ?? []).find((m) => m.kind === 'cliff')?.at ?? null;
		const views = {
			play: { label: 'Góc chơi D2 · isometric 2:1 (mặc định)', iso: true, target: [this.hero.x, 0.9, this.hero.z], height: 12 },
			overview: { label: 'Tổng quan cả map (game ¾)', target: [(BOUNDS.x0 + BOUNDS.x1) / 2, 0, (BOUNDS.z0 + BOUNDS.z1) / 2], distance: this.size * 1.17 },
		};
		if (farm) {
			views.farm = { label: 'Trang trại · nhà, kho, ruộng (¾)', target: [farm.x, 1, farm.z], distance: farm.distance };
			views.farmPlay = { label: 'Trang trại · góc chơi D2 (iso)', iso: true, target: [farm.x, 0.9, farm.z], height: 12 };
		}
		if (camp) {
			views.camp = { label: 'Trại địch · lửa, lều, cổng (¾)', target: [camp.x, 1, camp.z], distance: 42 };
			views.campPlay = { label: 'Trại địch · góc chơi D2 (iso)', iso: true, target: [camp.x, 0.9, camp.z], height: 12 };
		}
		if (den) {
			views.den = { label: 'Hang sói · xác thú, đường mòn (¾)', target: [den.x, 1, den.z], distance: 30 };
			views.denPlay = { label: 'Hang sói · góc chơi D2 (iso)', iso: true, target: [den.x, 0.9, den.z], height: 12 };
		}
		if (grave) {
			views.graveyard = { label: 'Nghĩa địa + miếu ven đường (¾)', target: [grave.x, 1, grave.z], distance: 30 };
			views.gravePlay = { label: 'Nghĩa địa · góc chơi D2 (iso)', iso: true, target: [grave.x, 0.9, grave.z], height: 12 };
		}
		if (cliff) views.ridge = { label: 'Sườn đá phía bắc · ranh giới sau lưng (¾)', target: [cliff.x, 1.5, cliff.z], distance: 40 };
		if (ford) {
			views.ford = { label: 'Suối + đường: ford / cầu (¾)', target: [ford.x, 0.5, ford.z], distance: 26 };
			views.fordPlay = { label: 'Suối + đường · góc chơi D2 (iso)', iso: true, target: [ford.x, 0.9, ford.z], height: 12 };
		}
		return views;
	}

	/** The farm's buildings plus the field zones inside the farm circle: the ¾ view frames both (the barley field is part of the farm). */
	farmArea(area) {
		const PLAN = this.plan;
		const zone = PLAN.zones.find((z) => z.kind === 'farm');
		const pts = [{ x: area.x, z: area.z }];
		const spread = [];
		const inside = (p) => zone && zone.shape.r !== undefined && Math.hypot(p.x - zone.shape.x, p.z - zone.shape.z) <= zone.shape.r;
		for (const m of [...(PLAN.hosts ?? []), ...(PLAN.masses ?? [])]) if (m.at && inside(m.at)) spread.push(m.at);
		for (const f of PLAN.zones.filter((z) => z.kind === 'field')) {
			const c = centreOf(f.shape);
			if (c && inside(c)) {
				pts.push(c);
				spread.push(...(Array.isArray(f.shape) ? f.shape : [c]));
			}
		}
		const x = pts.reduce((a, q) => a + q.x, 0) / pts.length;
		const z = pts.reduce((a, q) => a + q.z, 0) / pts.length;
		const reach = Math.max(14, ...spread.map((q) => Math.hypot(q.x - x, q.z - z)));
		return { x, z, r: area.r, distance: clamp(reach * 1.9 + 10, 40, 80) };
	}

	/** Distance to the creek centre line (the water field does not exist yet while the views are made). */
	creekDistanceRaw(x, z, creek) {
		if (!creek) return Infinity;
		let best = Infinity;
		for (let i = 1; i < creek.points.length; i++) best = Math.min(best, segDist(x, z, creek.points[i - 1], creek.points[i]));
		return best;
	}

	/** Orbit camera for a view: ¾ game angle (45° azimuth, 52° from vertical) or the iso play camera on the target. */
	viewCamera(view) {
		const target = new THREE.Vector3(...view.target);
		if (view.iso) return { mode: 'iso', target: target.setY(this.height(target.x, target.z) + target.y), height: view.height };
		target.y += this.height(target.x, target.z);
		const offset = new THREE.Vector3().setFromSphericalCoords(view.distance, THREE.MathUtils.degToRad(52), THREE.MathUtils.degToRad(45));
		return { position: target.clone().add(offset), target };
	}

	/** The streamer builds the modules around a view next (the focus moved from the hero's start): called when the view changes mid-stream and when the scene opens on a saved view. */
	refocus(id) {
		const view = this.views[id];
		if (!view || !this.stream || this.streamEnded) return;
		const at = view.stand ?? { x: view.target[0], z: view.target[2] };
		this.stream.reprioritise(at);
	}

	/** Frame a view; the iso views also stand the hero in the middle so the scale reads. */
	frameView(id) {
		const view = this.views[id];
		if (!view) return;
		this.settings.view = id;
		this.refocus(id);
		const camera = this.viewCamera(view);
		if (view.iso) {
			const at = view.stand ?? { x: view.target[0], z: view.target[2] };
			this.anchor.position.set(at.x, this.height(at.x, at.z) + 0.02, at.z);
		}
		const rig = this.app.rig;
		if (rig.follow) return;
		if (camera.mode === 'iso') {
			rig.isoFocus(camera.target, camera.height);
			return;
		}
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		rig.lookAt(camera.position, camera.target);
	}

	/**
	 * True when (x, z) is a spot for the hero to stand: dry, clear of every blocking footprint by `margin` m (placements that block,
	 * authored masses, trees) and WALK_CLEAR m from walk-through pieces (arrows, helmets, a carcass: the hero does not pierce them).
	 */
	isFreeSpot(x, z, margin = 0.7) {
		if (this.plan.ground(x, z).water || this.waterDistance(x, z) < 0.4) return false;
		const inside = (fp, m) => {
			const c = Math.cos(fp.yaw);
			const s = Math.sin(fp.yaw);
			const dx = x - fp.cx;
			const dz = z - fp.cz;
			return Math.abs(dx * c - dz * s) < fp.hx + m && Math.abs(dx * s + dz * c) < fp.hz + m;
		};
		for (const p of this.blockers) if (inside(p.footprint, margin)) return false;
		for (const p of this.walkThrough) if (inside(p.footprint, WALK_CLEAR)) return false;
		return true;
	}

	waterDistance(x, z) {
		return lookup(this.waterField, x, z);
	}

	/** The plan's worn paths (roads, lanes, the shrine trail; not the faint animal trail) as packed earth, by their own widths. */
	pathCoverageAt(x, z) {
		this._stepPaths ??= this.plan.paths.filter((p) => p.kind !== 'animal').map((p) => ({ points: p.points, width: p.width ?? this.catalogRules().pathWidth[p.kind] ?? 2, surface: 'packed' }));
		return pathCoverage(this._stepPaths, x, z, (this._pathCoverage ??= { amount: 0, surface: 'packed' }));
	}

	/** The creek and the pond of the plan, where the water surface is shown: a film `waterLevel` m over the ground (shallow, a ford where the road crosses). */
	waterAt(x, z) {
		const s = this.settings;
		if (!s.creekWater || !this.waterMeshes?.length || s.waterLevel <= 0) return null;
		const hit = this.plan.water.some((w) => (w.polygon ? pointInPoly(w.polygon, x, z) : polylineDistance(w.points, x, z) <= (w.width ?? 3) / 2));
		if (!hit) return null;
		const w = (this._water ??= { depth: 0, level: 0 });
		w.depth = s.waterLevel;
		w.level = this.height(x, z) + s.waterLevel;
		return w;
	}

	/**
	 * Where the hero stands for a view: on the view target when it is free; otherwise the nearest free spot, preferably inside the
	 * corridor of a door within 9 m (so the hero stands where the plan keeps the way clear), else the nearest free spot on a spiral.
	 */
	standFor(target) {
		const t = { x: target[0], z: target[2] };
		if (this.isFreeSpot(t.x, t.z)) return t;
		let best = null;
		let bestD = Infinity;
		for (const r of this.result.reserved.filter((q) => q.kind === 'door')) {
			const pts = r.shape.points;
			const c = centreOf(pts);
			if (Math.hypot(c.x - t.x, c.z - t.z) > 9) continue;
			const xs = pts.map((q) => q.x);
			const zs = pts.map((q) => q.z);
			for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.25) {
				for (let z = Math.min(...zs); z <= Math.max(...zs); z += 0.25) {
					const d = Math.hypot(x - t.x, z - t.z);
					if (d < bestD && pointInPoly(pts, x, z) && this.isFreeSpot(x, z, 0.7)) {
						best = { x, z };
						bestD = d;
					}
				}
			}
		}
		if (best) return best;
		for (let r = 0.5; r <= 40; r += 0.5) {
			for (let k = 0; k < Math.ceil(r * 8); k++) {
				const a = (k / Math.ceil(r * 8)) * Math.PI * 2;
				const x = t.x + Math.cos(a) * r;
				const z = t.z + Math.sin(a) * r;
				if (this.isFreeSpot(x, z)) return { x, z };
			}
		}
		return t;
	}

	/** After the layout: stand the hero of every iso view on a free spot (the camera stays on the view target). */
	resolveStands() {
		this.blockers = this.result.placements.filter((p) => p.footprint && p.blocks);
		this.walkThrough = this.result.placements.filter((p) => p.footprint && !p.blocks && p.class === 'decor' && p.layer !== 'decal');
		this.standMoves = [];
		for (const [id, view] of Object.entries(this.views)) {
			if (!view.iso) continue;
			view.stand = this.standFor(view.target);
			const moved = Math.hypot(view.stand.x - view.target[0], view.stand.z - view.target[2]);
			if (moved > 0.01) this.standMoves.push(`${id} ${moved.toFixed(1)} m`);
		}
		this.hero = this.views.play.stand;
		this.anchor.position.set(this.hero.x, this.height(this.hero.x, this.hero.z) + 0.02, this.hero.z);
	}

	/** Camera on a point of the report (a drop, a warning): ¾ view 14 m away; the matching overlay is switched on. */
	frameAt(x, z, overlay = null) {
		if (overlay && !this.settings[overlay]) {
			this.settings[overlay] = true;
			this.app.settings.changed(this.id);
			this.applyOverlays();
			this.app.panels?.refresh();
		}
		const rig = this.app.rig;
		if (rig.follow) return;
		const target = new THREE.Vector3(x, this.height(x, z) + 0.5, z);
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		rig.lookAt(target.clone().add(new THREE.Vector3().setFromSphericalCoords(14, THREE.MathUtils.degToRad(52), THREE.MathUtils.degToRad(45))), target);
	}

	// -- build --------------------------------------------------------------------------------------------------------

	async init() {
		const app = this.app;
		const t0 = performance.now();
		this.t0 = t0;
		const s = this.settings;
		const modular = s.loadMode !== 'all'; // read once: a change reloads the scene
		// The Valdren materials (forged textures, ~1 s of CPU) are only needed by the builders. 'all' makes them first, as it always did;
		// 'modules' makes them while the kits and terrain textures download.
		if (!modular) this.mat = V.valdrenMaterials(app);
		const matMs = performance.now() - t0;
		this.scene.add(this.anchor); // placed by resolveStands() once the plan and its start exist
		if (s.look !== LOOK) {
			delete app.settings.data.scenePost?.[this.id]; // saved exposure / fog / vignette of an older look
			Object.assign(s, { look: LOOK, layerSet: 'moor', time: 'night', view: 'play', fill: false, waterRough: 0.32, waterLevel: 0.05 });
			this.useSetDefaults('moor');
		}
		// 'modules': the terrain's painted textures start loading now (their fetch and decode overlap the forge and the layout); buildTerrain takes the same promise
		if (modular) this.earlySets = { id: s.layerSet, promise: super.layerSets(s.layerSet) };
		this.loadMode = modular ? 'modules' : 'all';
		this.timing = { mode: this.loadMode, cache: !!s.useCache, frames: { max: 0, count: 0, over33: 0, over50: 0 }, phases: { materials: matMs } };
		const phase = (name, since) => (this.timing.phases[name] = performance.now() - since);
		let p0 = performance.now();
		await this.loadLayout();
		phase('layout', p0);
		p0 = performance.now();
		this.resolveStands();
		this.planModules();
		this.makeEffects();
		this.makeContainers();
		this.buildLights();
		phase('plan + lights', p0);
		p0 = performance.now();
		// 'all' = every kit and every module before the first frame (the way it was). 'modules' = ring 0's kits only, in parallel with the
		// terrain textures; the streamer builds the rest behind the first frame.
		this.kits = modular ? {} : await loadKits(app, this.kitList());
		const globals = this.buildGlobals();
		if (modular) {
			this.stream = this.makeStream();
			const started = this.stream.start();
			const m0 = performance.now();
			this.mat = V.valdrenMaterials(app);
			this.timing.phases.materials = performance.now() - m0;
			await Promise.all([globals, started]);
			this.buildProps([], { ...this.cellOptions(), pads: true }); // the waypoint pads belong to no module
		} else {
			await globals;
			this.buildContent(this.wholeMap(), { ...this.cellOptions(), pads: true });
		}
		phase(modular ? 'terrain + ring 0' : 'terrain + all', p0);
		p0 = performance.now();
		this.buildCursor();
		this.fire = new THREE.Vector3(1e4, 0, 1e4); // the base class' campfire lies far off the map
		this.applyFill();
		this.buildCards();
		this.buildShells();
		this.applyLayerSettings();
		this.applyBlood();
		this.buildClassOverlay();
		for (const id of ['play', 'footprints', 'use', 'occlusion', 'decisions', 'clusters', 'events', 'drops']) this.overlay(id); // built hidden: showing one later is a visibility flip, not new geometry on WebGPU
		this.applyOverlays();
		await this.applyTime();
		this.buildGroundBlend();
		phase('overlays + time', p0);
		this.ready = true;
		this.noteUploaded(this.scene);
		this.loadMs = performance.now() - t0;
		const loaded = Object.keys(this.kits);
		this.timing.initMs = this.loadMs;
		this.timing.initAt = performance.now();
		this.timing.t0 = t0;
		this.timing.kitsAtInit = loaded.length;
		this.timing.kitMBAtInit = loaded.reduce((n, k) => n + (kitBytes[k] ?? 0), 0) / 1e6;
		this.timing.modulesAtInit = this.loadedModules.size;
		if (s.view !== 'play') this.refocus(s.view); // opened on a saved view: the modules around it come next, not the ones around the hero
		this.timing.requiredKits = modular ? this.stream.ring0Kits() : loaded;
		this.timing.requiredMB = this.timing.requiredKits.reduce((n, k) => n + (kitBytes[k] ?? 0), 0) / 1e6;
		if (!modular) this.markAllLoaded();
		console.info(`Biome layout [${this.loadMode}] ${this.mapInfo.source === 'seed' ? `seed ${this.mapInfo.seed} · ${this.mapInfo.size} m` : 'demo'}: ${this.result.placements.length} placements + ${this.result.ecology.tufts.x.length} tufts, layout from ${this.layoutSource} in ${this.layoutMs.toFixed(0)} ms, scene built in ${this.loadMs.toFixed(0)} ms (${this.timing.requiredKits.length} kits / ${this.timing.requiredMB.toFixed(1)} MB before the first frame)`);
	}

	/** [key, sample id] of every kit the catalog's assets use and the library has (the palette decided from the registry, not from what has loaded). */
	kitList() {
		const keys = [...new Set(ASSETS.map((a) => a.kit))];
		for (const key of keys) if (!KIT_IDS[key]) console.warn(`Biome layout: no sample id for kit "${key}"`);
		return keys.filter((k) => KIT_IDS[k] && sampleById(KIT_IDS[k])).map((k) => [k, KIT_IDS[k]]);
	}

	/** The engine's options from the settings (seeds, densities). */
	layoutOptions() {
		const s = this.settings;
		return {
			seeds: { mass: s.seedMass, cluster: s.seedCluster, guide: s.seedGuide, ecology: s.seedEcology, trace: s.seedTrace },
			density: { grass: s.densityGrass, shrubs: s.densityShrubs, traces: s.densityTraces, masses: s.densityMasses },
		};
	}

	/**
	 * The map: plan + layout, from the cheapest source. planSource 'demo' = the hand-made plan; 'seed' = one seed → the whole map (planGen).
	 *   layout: browser cache (IndexedDB, by layout key) → the baked file assets/maps/ (when its key matches) → the engine.
	 *   generated plan: the record under the generator key (seed, size, PLAN_GEN_VERSION, options, catalog, code) holds the accepted attempt, so a
	 *   warm load regenerates the plan with generatePlan(seed, { attempt }) (≈ 40 ms) and takes the layout from the cache; only a cold load
	 *   searches the attempts (generateMap: plan checks + the engine's 19 checks). A fresh result is stored after the first frames.
	 * The catalog's availability is the registered palette, never what has loaded yet: the layout must not depend on load timing.
	 */
	async loadLayout() {
		const s = this.settings;
		const t0 = performance.now();
		const catalog = buildCatalog({ sizes, available: new Set(this.kitList().map(([key]) => key)) });
		const options = this.layoutOptions();
		const generated = s.planSource !== 'demo';
		const size = MAP_SIZES.includes(s.mapSize) ? s.mapSize : MAP_SIZES[0];
		const seed = generated ? Math.max(1, Math.floor(s.mapSeed) || 1) : s.seed;
		const code = codeOf(generated ? ['layout', 'generator'] : ['layout']); // the source text of the engine / generator: an edit of the code is a new key
		let plan;
		let key;
		let found = null;
		let gen = null;
		let genStore = null;
		const timing = { source: generated ? 'seed' : 'demo', planMs: 0, generateMs: null };
		if (generated) {
			const genId = `gen|${genKey({ seed, size, version: PLAN_GEN_VERSION }, options, catalog, { code, accept: acceptKey(kitBytes) })}`;
			let record = s.useCache ? await mapCache.get(genId) : null;
			let from = 'cache';
			if (!record && s.useCache) {
				record = await this.fetchBakedGen(genId.slice(4));
				from = 'file';
			}
			if (record?.version !== PLAN_GEN_VERSION) record = null; // a stale record never survives a new generator
			if (record) {
				const p0 = performance.now();
				plan = generatePlan(seed, { size, attempt: record.attempt });
				timing.planMs = performance.now() - p0;
				key = layoutKey(plan, options, catalog, { code });
				found = await this.cachedLayout(key);
				gen = { ...record, source: from };
				if (from === 'file') genStore = { id: genId, record };
				if (!found) {
					// the layout was evicted (or never stored): the engine on the plan the record names - no attempt search
					found = { result: layoutBiome(plan, catalog, { ...options, budgets: mapBudgets(size, options.budgets) }), source: 'engine', bakeSize: null, store: 'bake' };
				}
			} else {
				const g0 = performance.now();
				const map = generateMap(seed, catalog, { size, modules: { kitBytes }, ...options }); // the fast-load rules (§4.14) are acceptance criteria too
				timing.generateMs = performance.now() - g0;
				if (!map.plan || !map.result) throw new Error(`Biome layout: generateMap(${seed}) found no usable attempt (${map.attempts.map((a) => a.failed.join('+')).join(' | ')})`);
				plan = map.plan;
				key = layoutKey(plan, options, catalog, { code });
				found = { result: map.result, source: 'engine', bakeSize: null, store: 'bake' };
				gen = { version: PLAN_GEN_VERSION, attempt: map.attempt, attempts: map.attempts, ok: map.ok, key, source: 'engine' };
				genStore = { id: genId, record: { version: PLAN_GEN_VERSION, attempt: map.attempt, attempts: map.attempts, ok: map.ok, key } };
			}
		} else {
			plan = { ...DEMO_PLAN, seed };
			key = layoutKey(plan, options, catalog, { code });
			found = await this.cachedLayout(key);
			if (!found) found = { result: layoutBiome(plan, catalog, options), source: 'engine', bakeSize: null, store: 'bake' };
		}
		this.adoptPlan(plan); // the square, the splat, the fields, the start and the views of THIS map
		this.result = found.result;
		this.catalog = catalog;
		this.layoutKey = key;
		this.layoutSource = found.source;
		this.layoutMs = performance.now() - t0;
		this.bakeSize = found.bakeSize;
		this.mapInfo = { source: timing.source, seed, size: this.size, planId: plan.id, zones: plan.meta?.zones ?? plan.zones.filter((z) => z.shape?.r !== undefined).map((z) => z.id), gen, mapSeed: seed };
		this.planChecks = null;
		this.timing.layout = { source: found.source, ms: this.layoutMs, key, engineMs: found.source === 'engine' ? found.result.report.ms.total : null };
		this.timing.plan = timing;
		if (found.store || genStore) this.defer(() => this.storeLayout(found.store, genStore));
		if (generated) this.defer(() => this.runPlanChecks());
		this.checkGround();
	}

	/** The 22 plan checks of the generator (not run for the hand-made demo, which differs from the generator's rules on purpose), after the first frames. */
	runPlanChecks() {
		const t0 = performance.now();
		this.planChecks = checkPlan(this.plan, { catalog: this.catalog });
		this.timing.planChecksMs = performance.now() - t0;
		this.refreshReports();
	}

	/** The layout under `key` from the browser cache, else the baked file: { result, source, bakeSize, store } or null (store: what to put into the cache). */
	async cachedLayout(key) {
		if (!this.settings.useCache) return null;
		const hit = await mapCache.get(key);
		if (hit?.baked) {
			try {
				return { result: restoreLayout(hit.baked), source: 'cache', bakeSize: hit.size ?? null, store: null };
			} catch (error) {
				console.warn('Biome layout: the cached map could not be read; it is generated again', error);
			}
		}
		const file = await this.fetchBaked(key);
		if (file) {
			try {
				return { result: restoreLayout(file.baked), source: 'file', bakeSize: file.size, store: { baked: file.baked, size: file.size } };
			} catch (error) {
				console.warn('Biome layout: the baked map could not be read; it is generated again', error);
			}
		}
		return null;
	}

	/** The terrain's layer sets: the first call for the id init started early takes that promise, every other call is the base class'. */
	layerSets(id) {
		const early = this.earlySets;
		if (early?.id !== id) return super.layerSets(id);
		this.earlySets = null;
		return early.promise;
	}

	/** assets/maps/index.json (relative to the page: the lab may be hosted under a sub-path), read once; null when there is none (offline build, file://). */
	bakedIndex() {
		this._bakedIndex ??= (async () => {
			if (location.protocol === 'file:') return null;
			try {
				const index = await fetch('assets/maps/index.json');
				return index.ok ? await index.json() : null;
			} catch {
				return null;
			}
		})();
		return this._bakedIndex;
	}

	/** The baked file of layout `key` ({ baked, size }), or null (no index, no entry, another key). */
	async fetchBaked(key) {
		const entry = (await this.bakedIndex())?.maps?.[key];
		if (!entry) return null;
		try {
			const response = await fetch(`assets/maps/${entry.file}`);
			if (!response.ok) return null;
			const file = await response.json();
			if (file.key !== key) return null;
			return { baked: { format: file.format, meta: file.meta, result: file.result }, size: entry.bakeBytes ?? null };
		} catch {
			return null;
		}
	}

	/** The generator record a bake left for `genKey` (accepted attempt of a seed + size), or null. */
	async fetchBakedGen(genKeyText) {
		const record = (await this.bakedIndex())?.gen?.[genKeyText];
		return record ? { ...record } : null;
	}

	/** Puts the layout (and the generator record) into the browser cache: a baked file's content as it is, or a fresh engine result encoded now. */
	async storeLayout(store, genStore = null) {
		let entry = store;
		if (store === 'bake') {
			const baked = bakeLayout(this.result, { key: this.layoutKey, plan: this.plan.id, seed: this.mapInfo.seed });
			entry = { baked, size: bakeBytes(baked) };
			this.bakeSize = entry.size;
			this.runModuleChecks();
			this.refreshReports();
		}
		if (entry) await mapCache.put(this.layoutKey, entry, this.layoutKey); // one group per map: the least recently used maps are evicted
		if (genStore) await mapCache.put(genStore.id, genStore.record, this.layoutKey);
	}

	/** Runs `fn` on a later frame (one per frame, after the first frames): work that must not sit in front of the first frame. */
	defer(fn) {
		(this.deferred ??= []).push(fn);
	}

	/**
	 * The splat (R wet, G grass, B blood): painted data from the cache when the key matches (layout key + splat version + size; the
	 * blur is applied on top, it is not part of the data), else generated from the plan's ground and the engine's carpet and ground paint.
	 */
	async initSplat() {
		const t0 = performance.now();
		const key = `${this.layoutKey}|${SPLAT_CACHE}${SPLAT_VERSION}|${this.splat.size}|${this.splat.extent}|${codeOf(['splat']).slice(0, 14)}`; // the painter's source (this scene's weights / carpet / generateSplat, kit.js noise2, terrain.js) is part of the key
		let source = 'engine';
		if (this.settings.useCache) {
			const hit = await mapCache.get(key);
			if (hit instanceof Uint8Array && hit.length === this.splat.data.length) {
				this.splat.data.set(hit);
				this.splat.refresh();
				source = 'cache';
			}
		}
		if (source === 'engine') {
			this.generateSplat();
			if (this.settings.useCache) {
				const data = this.splat.data.slice();
				this.defer(() => mapCache.put(key, data, this.layoutKey));
			}
		}
		this.timing.splat = { source, ms: performance.now() - t0 };
	}

	/** Cuts the layout into modules, orders them from the hero's stand and runs the fast-load checks (AD 12 §4.14). */
	planModules() {
		const { manifest, modules } = splitModules(this.plan, this.result, { kitBytes });
		this.manifest = manifest;
		this.moduleList = modules;
		this.moduleById = new Map(modules.map((m) => [m.id, m]));
		this.moduleSize = manifest.size;
		this.order = loadOrder(manifest, this.hero, RULES);
		this.orderIndex = new Map(this.order.map((o, k) => [o.id, k]));
		this.loadedModules = new Set();
		this.runModuleChecks();
	}

	runModuleChecks() {
		this.moduleChecks = checkModules(this.manifest, this.order, RULES, { bakeBytes: this.bakeSize });
		this.overBudget = new Set(this.moduleChecks.flatMap((c) => (c.details?.violations ?? []).map((v) => v.id)).filter((id) => this.moduleById.has(id)));
		this.moduleOverlayDirty = true;
	}

	/** Wind and shadow fill, made once: the builders apply them to each module's meshes as they come (one wrapped copy per source material). */
	makeEffects() {
		const s = this.settings;
		const fx = this.app.backend.effects;
		this.windGrass = fx.create('wind', { strength: s.wind, height: 1, frequency: 1.9 });
		this.windTrees = fx.create('wind', { strength: s.wind * 0.35, height: 4, frequency: 0.9, gust: 0.8, bend: 0 });
		this.windShrubs = fx.create('wind', { strength: s.wind * 0.6, height: 1.2, frequency: 1.4, gust: 0.6 });
		this.shadowFill = fx.createShadowFill();
		this.memo = { windTrees: new Map(), fill: new Map() };
	}

	/** The map-wide containers the module builders add their meshes to (the scene's lists and the panels read these, whatever the load mode). */
	makeContainers() {
		this.classMeshes = Object.fromEntries(CLASS_ORDER.map((c) => [c, []]));
		this.treeInstances = Object.fromEntries(CLASS_ORDER.map((c) => [c, 0]));
		this.treeCells = new InstanceCells('Biome layout trees (instanced cells)');
		this.scene.add(this.treeCells);
		this.trees = [];
		this.staticGroup = new THREE.Group(); // the base class' lists read its children; the real groups are in this.groups
		this.staticGroup.name = 'Biome layout statics';
		this.scene.add(this.staticGroup);
		this.groups = {};
		for (const cls of CLASS_ORDER) {
			const group = new THREE.Group();
			group.name = `Biome layout · ${cls}`;
			group.matrixAutoUpdate = false; // baked in place, like StaticBatch's own groups
			group.userData.pieceCount = 0;
			group.userData.meshCount = 0;
			if (cls === 'decor') group.userData.labNoCollide = true;
			this.groups[cls] = group;
			this.staticGroup.add(group);
		}
		this.grass = new InstanceCells('Biome layout grass (instanced cells)');
		this.scene.add(this.grass);
		this.shrubCells = new InstanceCells('Biome layout shrubs (instanced cells)');
		this.shrubs = [];
		this.scene.add(this.shrubCells);
	}

	/** The parts that need no kit: splat, terrain, ribbons, the grass-card texture. */
	async buildGlobals() {
		const t0 = performance.now();
		await this.initSplat();
		await this.buildTerrain();
		await this.buildRibbons();
		await this.loadCards();
		this.timing.globalsMs = performance.now() - t0;
	}

	/** Instancing / batching cells for the build: 'all' keeps the `cells` setting; a module is its own cell (16 m, aligned with the instancing grid). */
	cellOptions() {
		if (this.loadMode === 'all') return { staticCell: this.cell, treeCell: this.cell * 2, cell: this.cell };
		return { staticCell: 0, treeCell: this.moduleSize, cell: this.moduleSize };
	}

	/** Everything the map has, as one build (the 'all' mode). */
	wholeMap() {
		const r = this.result;
		return { placements: r.placements, shrubs: r.ecology.shrubs, tufts: null, lights: r.placements.map((p, k) => (p.light ? k : -1)).filter((k) => k >= 0) };
	}

	/** The streamer: ring 0 first, then by distance, kits by priority; it builds through buildModule(). */
	makeStream() {
		const ids = Object.fromEntries(this.kitList());
		return new MapStream({
			order: this.order,
			kitsOf: (id) => this.moduleById.get(id).kits.filter((k) => ids[k]),
			loadKit: async (key) => Object.assign(this.kits, await loadKits(this.app, [[key, ids[key]]])),
			buildModule: (id) => this.buildModule(id),
			reorder: (point) => loadOrder(this.manifest, point, RULES),
			rules: RULES,
			holdBackground: true,
		});
	}

	/** One module's content (props, trees, shrubs, tufts, flames) from the layout result; the kits it needs are loaded. */
	buildModule(id) {
		const m = this.moduleById.get(id);
		const r = this.result;
		const content = { placements: m.placements.map((k) => r.placements[k]), shrubs: m.shrubs.map((k) => r.ecology.shrubs[k]), tufts: m.tufts, lights: m.lights };
		if (!this.ready) {
			// before the first frame: built into the scene; the scene's own compile pass links its programs
			this.buildContent(content, this.cellOptions());
			this.loadedModules.add(id);
			this.moduleOverlayDirty = true;
			return;
		}
		// after it: built off-scene, its programs linked with the scene's lights, then attached in one go — a program first needed inside a frame would stall it
		const stage = (this.staging = { id, root: new THREE.Scene(), attach: [], classes: new Set(), lights: m.lights });
		stage.root.name = `Module ${id} (staging)`;
		(this.stagedModules ??= new Set()).add(stage); // not in the scene until revealed: dispose() frees what never got there
		try {
			this.buildContent(content, this.cellOptions(), true);
		} finally {
			this.staging = null;
		}
		stage.textures = this.newTextures(stage.root);
		if (!stage.textures.length && [...stage.classes].every((k) => this.compiledClasses.has(k))) {
			this.commit(stage); // every program and texture it needs exists: nothing to prepare, it is part of the scene at once
			(this.timing.reveals ??= []).push({ id, start: performance.now(), compileMs: 0, revealMs: 0 });
			return;
		}
		this.pendingReveals++;
		this.compileQueue = (this.compileQueue ?? Promise.resolve()).then(() => this.reveal(stage));
	}

	/** Textures of the meshes under `root` that no mesh in the scene has used yet. */
	newTextures(root) {
		const out = new Set();
		root.traverse((o) => {
			if (!o.isMesh) return;
			for (const value of Object.values(o.material)) if (value?.isTexture && !this.uploaded.has(value)) out.add(value);
		});
		return [...out];
	}

	/** The textures of everything in the scene now: drawn by the first frames, so not worth a pre-upload. */
	noteUploaded(root) {
		root.traverse((o) => {
			if (!o.isMesh || !o.material) return;
			for (const m of Array.isArray(o.material) ? o.material : [o.material]) for (const value of Object.values(m)) if (value?.isTexture) this.uploaded.add(value);
		});
	}

	/** A staged module becomes part of the scene: meshes into their containers, its lamps lit. */
	commit(stage) {
		this.stagedModules?.delete(stage);
		for (const attach of stage.attach) attach();
		this.lightFlames(stage.lights);
		this.loadedModules.add(stage.id);
		this.moduleOverlayDirty = true;
	}

	/** Adds a built mesh to its map-wide container now, or (while a module is staged) when the module is revealed. */
	attach(container, mesh) {
		const tag = container === this.treeCells ? 'tree' : container === this.grass ? 'grass' : container === this.shrubCells ? 'shrub' : 'static';
		const key = this.programClass(mesh, tag);
		if (!this.staging) {
			container.add(mesh);
			this.compiledClasses.add(key); // in the scene before the first frame: the scene's own compile pass links it
			return;
		}
		this.staging.root.add(mesh);
		this.staging.attach.push(() => container.add(mesh));
		this.staging.classes.add(key);
	}

	/**
	 * What decides whether the first draw of a mesh needs a program that does not exist yet: the material's structure (the maps it has, side,
	 * alpha, vertex colours; never its textures), the geometry layout, instancing, the shadow flags and which wrapper (wind, fill) it got.
	 * A module whose classes are all known needs no compile pass.
	 */
	programClass(mesh, tag) {
		const src = this.app.backend.effects.sourceOf(mesh.material);
		const g = mesh.geometry;
		const flags = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'bumpMap', 'alphaMap'].map((k) => (src[k] ? 1 : 0)).join('');
		return [tag, src.type, flags, src.side, src.transparent ? 1 : 0, src.alphaTest > 0 ? 1 : 0, src.vertexColors ? 1 : 0, mesh.isInstancedMesh ? 1 : 0, mesh.instanceColor ? 1 : 0, mesh.castShadow ? 1 : 0, mesh.receiveShadow ? 1 : 0, Object.keys(g.attributes).sort().join(','), g.index ? 1 : 0].join('|');
	}

	/** Links the programs of a staged module (compileAsync of its root with this scene's lights), then makes it part of the scene. */
	async reveal(stage) {
		const t0 = performance.now();
		try {
			// an earlier module in the queue may have linked what this one needs
			if (!this.disposed && ![...stage.classes].every((k) => this.compiledClasses.has(k))) await this.precompile(stage.root);
		} catch (error) {
			console.warn(`Biome layout: precompile of ${stage.id} failed; it is shown anyway`, error);
		}
		for (const k of stage.classes) this.compiledClasses.add(k);
		const compiled = performance.now();
		// textures that no mesh of the scene has used yet: uploaded here, one per frame (a kit's atlas is 2048² with mips; a first draw would stall the frame)
		const renderer = this.app.backend.renderer;
		for (const texture of stage.textures) {
			if (this.disposed) break;
			if (this.uploaded.has(texture)) continue;
			try {
				const u0 = performance.now();
				renderer.initTexture?.(texture);
				(this.timing.uploads ??= []).push({ name: texture.name, at: u0, ms: performance.now() - u0 });
			} catch (error) {
				console.warn('Biome layout: texture pre-upload failed; it uploads on its first draw', error);
			}
			this.uploaded.add(texture);
			await new Promise((resolve) => requestAnimationFrame(resolve));
		}
		if (!this.disposed) this.commit(stage);
		this.pendingReveals--;
		(this.timing.reveals ??= []).push({ id: stage.id, start: t0, compileMs: compiled - t0, revealMs: performance.now() - compiled });
	}

	/**
	 * compileAsync on a group that is not in the scene yet: the lights, fog and environment come from this scene, the meshes are not
	 * frustum-culled while it runs (the pass only compiles what the camera would see). Bounded: a stuck compile does not hold the module back for ever.
	 */
	async precompile(root) {
		const backend = this.app.backend;
		const renderer = backend.renderer;
		if (!renderer?.compileAsync) return;
		const meshes = [];
		root.traverse((o) => o.isMesh && meshes.push(o));
		const culled = meshes.map((o) => o.frustumCulled);
		for (const o of meshes) o.frustumCulled = false;
		// WebGPU keys a render object by the scene it belongs to (environment, fog): the staging scene carries this scene's
		root.environment = this.scene.environment;
		root.environmentIntensity = this.scene.environmentIntensity;
		root.fog = this.scene.fog;
		const target = !backend.isWebGPU ? backend.pipeline?.sceneRT : null; // the WebGL path compiles against the HDR scene target (its program keys differ from the screen's)
		const previous = target ? renderer.getRenderTarget() : null;
		let timer = 0;
		try {
			if (target) renderer.setRenderTarget(target);
			const done = renderer.compileAsync(root, this.app.rig.camera, this.scene);
			if (target) renderer.setRenderTarget(previous);
			await Promise.race([done, new Promise((resolve) => (timer = setTimeout(resolve, 4000)))]);
		} finally {
			clearTimeout(timer);
			meshes.forEach((o, i) => (o.frustumCulled = culled[i]));
		}
	}

	/** Builds a set of items { placements, shrubs, tufts (indices; null = all), lights (placement indices) } into the map-wide containers. */
	buildContent(content, options, staged = false) {
		this.buildProps(content.placements, options);
		this.buildShrubs(content.shrubs, options);
		this.buildGrass(content.tufts, options);
		if (!staged) this.lightFlames(content.lights); // a staged module lights its lamps when it is revealed
	}

	/**
	 * Placement y must sit on the terrain, both ways: the engine puts a piece at the lowest ground under its footprint (the centre
	 * for slope-aligned ones) minus its sink. Warn when it is more than 2 cm off, above (floating) or below (buried).
	 */
	checkGround() {
		const rules = this.result.report.rules;
		let checked = 0;
		let floating = 0;
		let buried = 0;
		let worst = 0;
		const list = [];
		for (const p of this.result.placements) {
			if (p.procedural || !p.footprint) continue;
			const asset = this.catalog.get(p.asset);
			if (!asset) continue;
			const fp = obbFrom(p.footprint);
			const samples = [{ x: fp.cx, z: fp.cz }, ...fp.pts, ...fp.pts.map((q, i) => ({ x: (q.x + fp.pts[(i + 1) % 4].x) / 2, z: (q.z + fp.pts[(i + 1) % 4].z) / 2 }))];
			const ground = p.tilt ? this.height(p.x, p.z) : Math.min(...samples.map((q) => this.height(q.x, q.z)));
			const expected = ground - Math.max(rules.minSink, asset.sink * asset.height * p.scale);
			const delta = p.y - expected;
			checked++;
			if (Math.abs(delta) <= 0.02) continue;
			if (delta > 0) floating++;
			else buried++;
			worst = Math.max(worst, Math.abs(delta));
			list.push(`${p.id} ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(1)} cm`);
		}
		this.groundCheck = { checked, floating, buried, worst, list };
		if (floating + buried) console.warn(`Biome layout: ${floating} placements float and ${buried} sit buried more than 2 cm off the ground (worst ${(worst * 100).toFixed(1)} cm): ${list.slice(0, 4).join(', ')}`);
	}

	async buildTerrain() {
		const segs = 224;
		const g = new THREE.PlaneGeometry(this.size, this.size, segs, segs);
		g.rotateX(-Math.PI / 2);
		g.translate(this.origin.x + this.size / 2, 0, this.origin.z + this.size / 2);
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) pos.setY(i, this.height(pos.getX(i), pos.getZ(i)));
		g.computeVertexNormals();
		const { material, effect } = createTerrainMaterial(this.app, this.splat, await this.layerSets(this.settings.layerSet));
		material.name = 'Biome layout terrain (splat: dirt · wet · grass · blood)';
		this.terrain = effect;
		const ground = new THREE.Mesh(g, material);
		ground.name = 'Terrain (splat)';
		ground.receiveShadow = true;
		this.ground = ground;
		this.scene.add(ground);
	}

	/** The plan's blood ground (near the altar) in the Weeping Fields look: dark, still in the ground's value band. */
	applyBlood() {
		const u = this.terrain.uniforms;
		u.blood.value = 1;
		u.bloodColor.value.set('#ffc4bc');
		u.veinColor.value.set('#5a1f21');
	}

	/**
	 * One ribbon per plan path (road with ruts as the base class; lanes narrower; the animal trail a faint strip) and the
	 * creek, plus a water surface for every pond. The paving fades out at the open ends.
	 */
	async buildRibbons() {
		for (const m of [...(this.roadMeshes ?? []), ...(this.waterMeshes ?? [])]) {
			this.scene.remove(m);
			m.geometry.dispose();
		}
		this.roadMeshes = [];
		this.waterMeshes = [];
		this.roadMesh = null;
		this.waterMesh = null;
		const prefix = TERRAIN_SETS[this.settings.layerSet]?.ribbons;
		if (!prefix) return;
		let tex;
		try {
			tex = await loadRibbonTextures(this.app, prefix);
		} catch (error) {
			console.error(`Ribbon textures "${prefix}" failed to load; paths and water stay splat-only`, error);
			return;
		}
		const standard = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.78, metalness: 0, vertexColors: true };
		this.roadMaterial ??= new THREE.MeshStandardMaterial({ name: 'Paths (ribbons)', ...standard });
		this.trailMaterial ??= new THREE.MeshStandardMaterial({ name: 'Animal trail (faint ribbon)', ...standard, color: new THREE.Color(0.8, 0.76, 0.7) });
		for (const m of [this.roadMaterial, this.trailMaterial]) {
			Object.assign(m, { map: tex.ruts.map, normalMap: tex.ruts.normalMap });
			m.needsUpdate = true;
		}
		const heightAt = (x, z) => this.height(x, z) + 0.025;
		for (const path of this.plan.paths) {
			const width = path.width ?? this.catalogRules().pathWidth[path.kind] ?? 2;
			const pts = toVec3(sampleLine(path.points, false, 1.4));
			const first = pts[0];
			const last = pts[pts.length - 1];
			const fade = (x, z) => smooth(0, 3, Math.min(Math.hypot(x - first.x, z - first.z), Math.hypot(x - last.x, z - last.z)));
			const mesh = new THREE.Mesh(ribbonGeometry(pts, width + 0.6, 6.7 * ((width + 0.6) / 4), heightAt, 9, fade), path.kind === 'animal' ? this.trailMaterial : this.roadMaterial);
			mesh.name = `Path · ${path.id} (${path.kind})`;
			mesh.receiveShadow = true;
			mesh.renderOrder = 1;
			mesh.userData.path = path.id;
			this.roadMeshes.push(mesh);
			this.scene.add(mesh);
		}
		this.roadMesh = this.roadMeshes[0] ?? null;
		if (!tex.water) {
			this.applyRibbonSettings();
			return;
		}
		this.waterMaterial ??= new THREE.MeshStandardMaterial({ name: 'Water (ribbons)', vertexColors: true, transparent: true, depthWrite: false, roughness: 0.08, metalness: 0, envMapIntensity: 1.5 });
		// A faint steel-blue lift of its own: at night the water reflects a black sky and would read as a dark band (the creek is a gameplay edge).
		Object.assign(this.waterMaterial, { map: tex.water.map, alphaMap: tex.water.alphaMap, emissive: new THREE.Color('#2f4048'), emissiveIntensity: 0.45 });
		this.waterMaterial.needsUpdate = true;
		const level = this.settings.waterLevel;
		for (const water of this.plan.water) {
			let geometry;
			if (water.polygon) geometry = this.pondGeometry(water.polygon, level);
			else {
				// A shallow ford where a path crosses: the water stays but thins (the paving lies under it).
				const ford = (x, z) => 0.55 + 0.45 * smooth(1, 3.2, this.roadDistance(x, z));
				geometry = ribbonGeometry(toVec3(sampleLine(water.points, false, 1.5)), (water.width ?? 3) + 0.6, 5, (x, z) => this.height(x, z) + level, 5, ford);
			}
			const mesh = new THREE.Mesh(geometry, this.waterMaterial);
			mesh.name = `Water · ${water.id}`;
			mesh.receiveShadow = true;
			mesh.renderOrder = 2;
			this.waterMeshes.push(mesh);
			this.scene.add(mesh);
		}
		this.waterMesh = this.waterMeshes[0] ?? null;
		this.applyRibbonSettings();
	}

	catalogRules() {
		return this.result?.report.rules ?? { pathWidth: {} };
	}

	/** A pond: rings from the centre to the bank, every vertex on the ground + level, the rim fading out. */
	pondGeometry(polygon, level) {
		const c = centreOf(polygon);
		const rings = 6;
		const n = polygon.length;
		const pos = [];
		const uv = [];
		const color = [];
		const index = [];
		pos.push(c.x, this.height(c.x, c.z) + level, c.z);
		uv.push(c.x / 5, c.z / 5);
		color.push(1, 1, 1, 0.9);
		for (let r = 1; r <= rings; r++) {
			const t = r / rings;
			for (let i = 0; i < n; i++) {
				const x = c.x + (polygon[i].x - c.x) * t;
				const z = c.z + (polygon[i].z - c.z) * t;
				pos.push(x, this.height(x, z) + level, z);
				uv.push(x / 5, z / 5);
				color.push(1, 1, 1, 0.9 * (1 - smooth(0.7, 1, t)));
			}
		}
		for (let i = 0; i < n; i++) index.push(0, 1 + ((i + 1) % n), 1 + i);
		for (let r = 1; r < rings; r++) {
			for (let i = 0; i < n; i++) {
				const a = 1 + (r - 1) * n + i;
				const b = 1 + (r - 1) * n + ((i + 1) % n);
				const c0 = 1 + r * n + i;
				const d = 1 + r * n + ((i + 1) % n);
				index.push(a, b, c0, b, d, c0);
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setAttribute('color', new THREE.Float32BufferAttribute(color, 4));
		g.setIndex(index);
		g.computeVertexNormals();
		if (g.attributes.normal.getY(0) < 0) {
			// wound clockwise from above: flip every triangle
			for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2], index[k + 1]];
			g.setIndex(index);
			g.computeVertexNormals();
		}
		return g;
	}

	applyRibbonSettings() {
		const s = this.settings;
		for (const m of this.roadMeshes ?? []) m.visible = s.roadRuts;
		if (this.roadMaterial) this.roadMaterial.opacity = s.rutsOpacity;
		if (this.trailMaterial) this.trailMaterial.opacity = s.rutsOpacity * 0.5;
		for (const m of this.waterMeshes ?? []) m.visible = s.creekWater;
		if (this.waterMaterial) this.waterMaterial.opacity = s.waterOpacity;
	}

	/** Kit piece by kit and name (undefined when the kit did not load). */
	piece(kitKey, name) {
		return this.kits?.[kitKey]?.[name];
	}

	/** This map's copy of a kit atlas material: the Tripo atlases carry no normal map, so the albedo doubles as a bump map. */
	kitMaterial(source) {
		this.kitMaterials ??= new Map();
		if (!this.kitMaterials.has(source.uuid)) {
			const m = source.clone();
			if (m.map) {
				m.bumpMap = m.map;
				m.bumpScale = 2;
			}
			this.kitMaterials.set(source.uuid, m);
		}
		return this.kitMaterials.get(source.uuid);
	}

	/** meshes' materials through fn, once per distinct material (the meshes of a set share one). */
	swapMaterials(meshes, fn, done = new Map()) { // `done` kept by the caller: later calls reuse the wrapped copies
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

	/** Drop Parts (Valdren builders) into a batch at a world position / yaw. */
	addParts(batch, parts, position, yaw = 0, overrides = {}, scale = [1, 1, 1]) {
		for (const [key, geometry] of parts.build()) {
			const material = overrides[key] ?? this.mat[key];
			if (!material) {
				console.warn(`Biome layout: no material for part "${key}"`);
				continue;
			}
			batch.add(geometry, material, { position, rotation: [0, yaw, 0], scale });
		}
	}

	// -- placements → meshes ------------------------------------------------------------------------------------------

	/**
	 * Engine placements → one StaticBatch per class (cells), kit trees as instanced cells with wind, authored masses as procedural builds.
	 * Builds the placements given (a module's, or all of them) into the map-wide containers: `staticCell` is the batching cell (0 = one mesh
	 * per material), `treeCell` the tree instancing cell; `pads` adds the waypoint platforms of the plan (they belong to no module).
	 */
	buildProps(placements, { staticCell, treeCell, pads = false }) {
		const batches = Object.fromEntries(CLASS_ORDER.map((c) => [c, new kit.StaticBatch(`Biome layout · ${c}`)]));
		const trees = new InstanceBuilder('Biome layout trees (instanced cells)', { cell: treeCell, pad: 1, castShadow: true });
		const treeClass = new Map(); // geometry uuid|material uuid → class (the class view colours the instances)
		const m4 = new THREE.Matrix4();
		const qYaw = new THREE.Quaternion();
		const qTilt = new THREE.Quaternion();
		const up = new THREE.Vector3(0, 1, 0);
		const tilt = new THREE.Vector3();
		const missing = new Set();
		for (const p of placements) {
			if (p.procedural) {
				this.buildProcedural(p, batches[p.class] ?? batches.obstacle);
				continue;
			}
			const piece = this.piece(p.kit, p.piece);
			if (!piece) {
				missing.add(p.asset);
				continue;
			}
			const cls = batches[p.class] ? p.class : 'obstacle';
			qYaw.setFromAxisAngle(up, p.yaw);
			if (p.tilt) qTilt.setFromUnitVectors(up, tilt.set(p.tilt.x, p.tilt.y, p.tilt.z).normalize()).multiply(qYaw);
			else qTilt.copy(qYaw);
			if (TREE_KITS.has(p.kit)) {
				m4.compose(new THREE.Vector3(p.x, p.y, p.z), qTilt, new THREE.Vector3(p.scale, p.scale, p.scale));
				trees.add(piece.geometry, this.kitMaterial(piece.material), m4);
				treeClass.set(piece.geometry.uuid, cls);
				this.treeInstances[cls]++;
				continue;
			}
			const euler = new THREE.Euler().setFromQuaternion(qTilt);
			batches[cls].add(piece.geometry, this.kitMaterial(piece.material), { position: [p.x, p.y, p.z], rotation: [euler.x, euler.y, euler.z], scale: p.scale, uv: 'keep', castShadow: !(cls === 'decor' && (p.height ?? 1) < 0.3) });
		}
		for (const asset of missing) console.warn(`Biome layout: kit piece of ${asset} is missing; skipped`);
		if (pads) this.interactionPads(batches.interactive);
		const treeMeshes = [...trees.build().children];
		for (const mesh of treeMeshes) {
			mesh.userData.labSolid = true;
			this.attach(this.treeCells, mesh);
			this.trees.push(mesh);
			this.addClassMesh(treeClass.get(mesh.geometry.uuid) ?? 'obstacle', mesh);
		}
		this.adoptMeshes(treeMeshes, this.windTrees, 'windTrees');
		for (const [cls, batch] of Object.entries(batches)) {
			const built = batch.build(true, { cell: staticCell });
			const group = this.groups[cls];
			group.userData.pieceCount += built.userData.pieceCount;
			group.userData.meshCount += built.userData.meshCount;
			const meshes = [...built.children];
			for (const mesh of meshes) {
				this.attach(group, mesh);
				this.addClassMesh(cls, mesh);
			}
			this.adoptMeshes(meshes);
		}
	}

	/**
	 * Materials of meshes that were just built: the wind effect (when given; one wrapped copy per source material, kept in this.memo so
	 * a later module reuses it and its program) and the shadow fill; after init also the backend's program tagging (WebGL: shadow twins).
	 */
	adoptMeshes(meshes, wind = null, memoKey = null) {
		if (!meshes.length) return;
		if (wind) this.swapMaterials(meshes, (m) => wind.apply(m), this.memo[memoKey]);
		this.swapMaterials(meshes, (m) => this.shadowFill.apply(m), this.memo.fill);
		if (this.ready) for (const mesh of meshes) this.app.backend.prepareObject(mesh);
	}

	/** A built mesh joins its class (the class view colours it); the class view's own mesh follows when that exists. */
	addClassMesh(cls, mesh) {
		this.classMeshes[cls].push(mesh);
		if (!this.classOverlay) return;
		const overlay = this.classOverlayMesh(mesh, cls);
		this.classOverlay.add(overlay);
		if (this.ready) this.app.backend.prepareObject(overlay);
	}

	/** Flat, walkable platform of an interaction the plan names a waypoint; other interactions are only zones (their owner builds the piece). */
	interactionPads(batch) {
		for (const it of this.plan.interactions ?? []) {
			if (!/waypoint/i.test(it.id)) continue;
			let hi = -Infinity;
			for (let k = 0; k < 12; k++) hi = Math.max(hi, this.height(it.at.x + Math.cos((k / 12) * Math.PI * 2) * 1.75, it.at.z + Math.sin((k / 12) * Math.PI * 2) * 1.75));
			this.addParts(batch, V.waypointPad().parts, [it.at.x, hi - 0.05, it.at.z], 0);
		}
	}

	/** Highest y of a Parts build (m above its origin), the stone aside: the chimney is a narrow stack, the building's top is its roof. */
	partsTop(parts) {
		let top = -Infinity;
		for (const [key, g] of parts.build()) {
			if (key === 'stone') continue;
			g.computeBoundingBox();
			top = Math.max(top, g.boundingBox.max.y);
		}
		return top;
	}

	/** Door corridors (world polygons) of the plan. */
	doorCorridors() {
		return this.result.reserved.filter((r) => r.kind === 'door').map((r) => r.shape.points);
	}

	/**
	 * A building's builder pieces that lie on the ground in front of its wall inside a door corridor (the torn-down door leaf across
	 * the entrance): left out, so the way the plan keeps clear is clear. Returns how many pieces were left out.
	 */
	clearDoorCorridor(parts, p, fp) {
		const corridors = this.doorCorridors();
		let removed = 0;
		for (const [key, list] of parts.byKey) {
			parts.byKey.set(key, list.filter((g) => {
				g.computeBoundingBox();
				const c = g.boundingBox.getCenter(new THREE.Vector3());
				if (key === 'stone' || Math.abs(c.z) <= fp.hz + 0.05 || g.boundingBox.max.y > 0.8) return true; // the body, the footing / step, anything standing upright (the ajar leaf)
				const w = toWorld(p.x, p.z, p.yaw, c.x, c.z);
				if (!corridors.some((poly) => pointInPoly(poly, w.x, w.z))) return true;
				removed++;
				return false;
			}));
		}
		return removed;
	}

	/**
	 * The plan's authored masses without a kit piece: buildings (Valdren house / barn: the top lands where the plan's occlusion zone
	 * says), cliffs (a ridge of boulders inside the footprint), the wolf den and the carcass (Valdren builders fitted to the footprint);
	 * anything else a placeholder.
	 */
	buildProcedural(p, batch) {
		const kind = p.asset.split('.')[1];
		const fp = p.footprint;
		if (kind === 'building') {
			const w = fp.hx * 2;
			const d = fp.hz * 2;
			let hi = -Infinity;
			let lo = Infinity;
			for (let i = 0; i <= 8; i++) {
				for (let j = 0; j <= 6; j++) {
					const q = toWorld(p.x, p.z, p.yaw, (i / 8 - 0.5) * (w + 1), (j / 6 - 0.5) * (d + 1.6));
					const h = this.height(q.x, q.z);
					hi = Math.max(hi, h);
					lo = Math.min(lo, h);
				}
			}
			const y = hi + 0.1;
			const foot = y - lo + 0.45;
			const height = p.height ?? 4;
			// The door sits where the plan's door corridor meets the front wall (local +z).
			const c = Math.cos(p.yaw);
			const s = Math.sin(p.yaw);
			let door = 0;
			for (const d0 of this.plan.doors ?? []) {
				const dx = d0.at.x - p.x;
				const dz = d0.at.z - p.z;
				const lx = dx * c - dz * s;
				const lz = dx * s + dz * c;
				if (Math.abs(lz - fp.hz) < 1.5 && Math.abs(lx) < fp.hx) door = lx;
			}
			const barn = /barn|kho|chuồng/i.test(`${p.mass} ${p.label ?? ''}`);
			// The plan says the top stands `height` above the engine's ground (p.y); the floor is raised to the highest ground + 0.1 m,
			// so eave and roof are what is left above the floor. Measured, then corrected, within the builders' minimums.
			const room = p.y + height - y;
			const minEave = barn ? 2.9 : 2.45;
			const minRise = 1.25;
			const make = (eave, rise) => (barn ? V.barn({ w, d, foot, wall: eave, rise, seed: 2 }) : V.house({ w, d, foot, door, eave, rise, seed: 31 })).parts;
			let eave = clamp(room * (barn ? 0.66 : 0.7), minEave, 3.2);
			let rise = Math.max(minRise, room - eave - 0.3);
			let parts = make(eave, rise);
			for (let k = 0; k < 4; k++) {
				const over = this.partsTop(parts) - room;
				if (Math.abs(over) < 0.02) break;
				let nextRise = rise - over;
				let nextEave = eave;
				if (nextRise < minRise) {
					nextEave = Math.max(minEave, eave - (minRise - nextRise));
					nextRise = minRise;
				}
				if (nextRise === rise && nextEave === eave) break;
				[rise, eave] = [nextRise, nextEave];
				parts = make(eave, rise);
			}
			const removed = this.clearDoorCorridor(parts, p, fp);
			(this.buildingFit ??= []).push({ id: p.id, planTop: p.y + height, top: y + this.partsTop(parts), floor: y, eave, rise, removed });
			this.addParts(batch, parts, [p.x, y, p.z], p.yaw);
			return;
		}
		if (kind === 'cliff') {
			this.buildRidge(p, batch);
			return;
		}
		if (kind === 'den' || kind === 'carcass') {
			this.buildFitted(p, batch, kind === 'den' ? V.wolfDen().parts : V.carcass().parts);
			return;
		}
		if (!this.warnedKinds.has(kind)) {
			this.warnedKinds.add(kind);
			console.warn(`Biome layout: no procedural builder for mass kind "${kind}" (${p.id}); a placeholder block stands in`);
		}
		const g = new THREE.BoxGeometry(fp.hx * 2, p.height ?? 2, fp.hz * 2);
		g.translate(0, (p.height ?? 2) / 2, 0);
		batch.add(g, this.mat.stone, { position: [p.x, p.y, p.z], rotation: [0, p.yaw, 0] });
	}

	/**
	 * A cliff: boulders along the footprint's length, every one inside the footprint (radius ≤ 0.95 of the half depth, the row inside
	 * the length) and stretched up so the top never passes the plan's height above the engine's ground (the tallest touches it);
	 * heights drift along the ridge, a boulder always stands ≥ 0.9 m clear of its own ground, and small rocks sit in the lee of the big ones.
	 */
	buildRidge(p, batch) {
		const fp = p.footprint;
		const r = kit.rng(Math.round(p.x * 31 + p.z * 17));
		const planH = p.height ?? 4;
		const top = p.y + planH;
		const radiusMax = fp.hz * 0.95;
		const phase = [r() * 6, r() * 6];
		const list = [];
		let t = -fp.hx + radiusMax * 0.5;
		while (t < fp.hx - radiusMax * 0.5) {
			const radius = radiusMax * (0.42 + r() * 0.58);
			list.push({ t: clamp(t, -fp.hx + radius, fp.hx - radius), radius, frac: clamp(0.62 + 0.28 * Math.sin(t * 0.29 + phase[0]) + 0.16 * Math.sin(t * 0.83 + phase[1]) + (r() - 0.5) * 0.18, 0.35, 1) });
			t += radius * (0.55 + r() * 0.5);
		}
		const tallest = list.reduce((best, q, i) => (q.frac > list[best].frac ? i : best), 0);
		list[tallest].frac = 1;
		list.forEach(({ t: along, radius, frac }, i) => {
			const lz = (r() * 2 - 1) * Math.max(0, fp.hz - radius);
			const at = toWorld(p.x, p.z, p.yaw, along, lz);
			const geometry = kit.rock({ radius: 1, seed: Math.round(along * 7 + p.x), squash: 0.8 + r() * 0.5 });
			let reach = 0;
			let crest = -Infinity;
			const pos = geometry.attributes.position;
			for (let k = 0; k < pos.count; k++) {
				reach = Math.max(reach, Math.hypot(pos.getX(k), pos.getZ(k)));
				crest = Math.max(crest, pos.getY(k));
			}
			let lowest = Infinity;
			let highest = -Infinity;
			for (let k = 0; k < 12; k++) {
				const h = this.height(at.x + Math.cos((k / 12) * Math.PI * 2) * radius, at.z + Math.sin((k / 12) * Math.PI * 2) * radius);
				lowest = Math.min(lowest, h);
				highest = Math.max(highest, h);
			}
			const base = lowest - 0.3; // sunk into the slope
			const want = Math.max(i === tallest ? top : p.y + planH * (0.4 + 0.6 * frac) - r() * 0.3, highest + 0.9);
			const sxz = radius / reach;
			batch.add(geometry, this.mat.rock, { position: [at.x, base, at.z], rotation: [0, r() * 6, 0], scale: [sxz, (want - base) / crest, sxz] });
		});
	}

	/** A Valdren builder (wolf den, carcass) scaled to the placement's footprint and height, its +z side (the mouth, the head) facing along the placement's yaw. */
	buildFitted(p, batch, parts) {
		const fp = p.footprint;
		const box = new THREE.Box3();
		for (const g of parts.build().values()) {
			g.computeBoundingBox();
			box.union(g.boundingBox);
		}
		const size = box.getSize(new THREE.Vector3());
		const sxz = Math.min((fp.hx * 2) / size.x, (fp.hz * 2) / size.z);
		const sy = p.height ? clamp(p.height / Math.max(0.05, box.max.y), sxz * 0.5, sxz * 1.7) : sxz;
		const mid = box.getCenter(new THREE.Vector3());
		(this.fitted ??= []).push({ id: p.id, built: [size.x, size.y, size.z].map((v) => +v.toFixed(2)), footprint: [fp.hx * 2, fp.hz * 2], scale: [sxz, sy].map((v) => +v.toFixed(2)) });
		const at = toWorld(p.x, p.z, p.yaw, -mid.x * sxz, -mid.z * sxz);
		this.addParts(batch, parts, [at.x, p.y, at.z], p.yaw, {}, [sxz, sy, sxz]);
	}

	// -- ecology → tufts, shrubs, cards -----------------------------------------------------------------------------------

	/**
	 * Grass tufts of the engine (positions, heights, tones, kinds) as instanced cells; the kit-free blade tuft of the other maps.
	 * `indices` = the tufts to build (a module's), null = all. Every tuft draws its random numbers from its own place in the stream
	 * (rngAt), so a tuft looks the same whichever module — or the whole-map build — makes it.
	 */
	buildGrass(indices, { cell }) {
		const t = this.result.ecology.tufts;
		const strawKind = t.kinds.row;
		const look = TERRAIN_SETS[this.settings.layerSet] ?? TERRAIN_SETS.moor;
		this.grassBase ??= new THREE.MeshStandardMaterial({ name: 'Grass blades', color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true });
		if (!this.tuftGeometry) {
			const g = twoSided(kit.grassTuft({ blades: 7, seed: 8 }));
			g.computeBoundingBox();
			g.scale(1, 1 / Math.max(0.1, g.boundingBox.max.y), 1); // unit height: the engine's h is metres
			this.tuftGeometry = g;
		}
		this.grassMaterial ??= this.grassBase.clone();
		const builder = new InstanceBuilder('Biome layout grass (instanced cells)', { cell, pad: 0.4 });
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const e = new THREE.Euler();
		const color = new THREE.Color();
		const straw = new THREE.Color(V.VALDREN.straw);
		const count = indices ? indices.length : t.x.length;
		for (let n = 0; n < count; n++) {
			const i = indices ? indices[n] : n;
			const r = rngAt(77, i * TUFT_DRAWS);
			const h = t.h[i];
			const w = 0.75 + r() * 0.45;
			e.set((r() - 0.5) * 0.22, r() * Math.PI * 2, (r() - 0.5) * 0.22);
			m4.compose(new THREE.Vector3(t.x[i], this.height(t.x[i], t.z[i]) - 0.02, t.z[i]), q.setFromEuler(e), new THREE.Vector3(w, h, w));
			if (t.kind[i] === strawKind) color.copy(straw).multiplyScalar(0.75 + r() * 0.2);
			else color.setRGB(...look.tuftColor.map((c) => c[0] + t.tone[i] * c[1])).multiplyScalar(0.9 + r() * 0.15);
			builder.add(this.tuftGeometry, this.grassMaterial, m4, color);
		}
		const meshes = [...builder.build().children];
		if (!meshes.length) return;
		if (!this.grassWrapped) {
			const windy = this.windGrass.apply(this.grassMaterial);
			this.grassWrapped = this.shadowFill.apply(windy);
			for (const m of [this.grassMaterial, windy, this.grassWrapped]) (this.wrapped ??= new Set()).add(m); // disposed with the scene
		}
		for (const mesh of meshes) {
			mesh.material = this.grassWrapped;
			this.attach(this.grass, mesh);
		}
		if (this.ready) for (const mesh of meshes) this.app.backend.prepareObject(mesh);
	}

	rebuildGrass() {
		// Tufts come from the engine; a brush stroke or "regenerate" only changes the splat, so only the shell grass follows.
		this.buildShells();
		this.app.mood?.onSceneRebuilt(this);
	}

	/** Shrubs of the engine (kit shrubs, 0.3–0.7 H, walk-through): `list` = the shrubs to build (a module's, or all), instanced cells with wind. */
	buildShrubs(list, { cell }) {
		const builder = new InstanceBuilder('Biome layout shrubs (instanced cells)', { cell, pad: 0.3, castShadow: true });
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const up = new THREE.Vector3(0, 1, 0);
		for (const p of list) {
			const piece = this.piece(p.kit, p.piece);
			if (!piece) continue;
			if (!this.shrubMaterial) {
				const material = piece.material.clone();
				material.side = THREE.DoubleSide; // single-sided leaf cards
				material.color.multiplyScalar(0.85);
				material.name = 'Biome layout shrubs';
				this.shrubMaterial = material;
			}
			m4.compose(new THREE.Vector3(p.x, p.y, p.z), q.setFromAxisAngle(up, p.yaw), new THREE.Vector3(p.scale, p.scale, p.scale));
			builder.add(piece.geometry, this.shrubMaterial, m4);
		}
		const meshes = [...builder.build().children];
		if (!meshes.length) return;
		if (!this.shrubWrapped) {
			const windy = this.windShrubs.apply(this.shrubMaterial);
			this.shrubWrapped = this.shadowFill.apply(windy);
			for (const m of [windy, this.shrubWrapped]) (this.wrapped ??= new Set()).add(m);
		}
		for (const mesh of meshes) {
			mesh.material = this.shrubWrapped;
			this.attach(this.shrubCells, mesh);
			this.shrubs.push(mesh);
		}
		if (this.ready) for (const mesh of meshes) this.app.backend.prepareObject(mesh);
	}

	/** Atlas grass cards on the engine's tufts of the open ground (so they obey every exclusion the tufts do): the 3D edge grass. */
	buildCards() {
		if (this.cards) {
			this.scene.remove(this.cards);
			for (const m of this.cards.children) m.dispose?.();
			this.cards = null;
		}
		const density = this.settings.edgeCards;
		if (!this.cardTexture || !density) return;
		this.cardBase ??= new THREE.MeshStandardMaterial({ name: 'Grass cards', alphaTest: 0.45, roughness: 0.85, metalness: 0 });
		if (this.cardBase.map !== this.cardTexture) {
			this.cardBase.map = this.cardTexture;
			this.cardBase.needsUpdate = true;
		}
		let material = this.windGrass ? this.windGrass.apply(this.cardBase) : this.cardBase;
		if (this.shadowFill) material = this.shadowFill.apply(material);
		const t = this.result.ecology.tufts;
		const r = kit.rng(313);
		const geometries = [0, 1, 2, 3].map((cell) => Object.assign(grassCardGeometry(cell), { name: `tuft ${cell + 1}` }));
		const builder = new InstanceBuilder('Biome layout grass cards (instanced cells)', { cell: this.cell * 2, pad: 0.4 });
		const m4 = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const up = new THREE.Vector3(0, 1, 0);
		const color = new THREE.Color();
		const rowKind = t.kinds.row;
		for (let i = 0; i < t.x.length; i++) {
			if (t.kind[i] === rowKind || r() > 0.16 * density || t.h[i] < 0.2) continue; // cultivated rows stay stubble; cards mark the clumps (h ≥ 0.2 m)
			const h = clamp(t.h[i] * 1.6, 0.3, 0.62);
			const w = h * (0.9 + r() * 0.4);
			const tone = 0.62 + r() * 0.25;
			m4.compose(new THREE.Vector3(t.x[i], this.height(t.x[i], t.z[i]), t.z[i]), q.setFromAxisAngle(up, r() * Math.PI), new THREE.Vector3(w, h, w));
			builder.add(geometries[Math.floor(r() * 4)], material, m4, color.setRGB(tone * (0.85 + t.tone[i] * 0.15), tone, tone * 0.85));
		}
		this.cards = builder.build();
		this.cards.material = material;
		this.scene.add(this.cards);
	}

	// -- lights -------------------------------------------------------------------------------------------------------

	buildLights() {
		this.moon = new THREE.DirectionalLight(0xffffff, 1);
		this.moon.name = 'Sun / moon';
		this.moon.castShadow = true;
		this.moon.shadow.mapSize.set(2048, 2048);
		const cam = this.moon.shadow.camera;
		cam.left = cam.bottom = -34;
		cam.right = cam.top = 34;
		cam.near = 1;
		cam.far = 180;
		this.moon.shadow.bias = -0.0004;
		this.moon.shadow.normalBias = 0.03;
		this.moon.target.position.set(this.hero.x, 0, this.hero.z);
		this.scene.add(this.moon, this.moon.target);
		this.moonDir = new THREE.Vector3(0.5, 0.7, 0.5).normalize();
		this.shadowHalf = 34;
		this.hemi = new THREE.HemisphereLight(0x9aa29c, 0x3d362b, 1);
		this.hemi.name = 'Sky / ground ambient';
		this.scene.add(this.hemi);
		// Stand-ins for the moor's fire (the shared mood / fill code touches them): no campfire here, so no fire shadow map.
		this.fireLight = { color: new THREE.Color(), distance: 0, shadow: { intensity: 0 } };
		this.torchLights = [];
		this.propLights = [];
		// The plan's lights: a flame and a small warm point light each, no shadows (sampler budget). ALL point lights exist from here on:
		// the light count is part of every lit material's program key, so a light added later would recompile every lit material. In
		// 'modules' mode a light starts dark and its flame is added when the module that owns it is built (lightFlames).
		const modular = this.loadMode === 'modules';
		const spots = [];
		this.result.placements.forEach((p, k) => p.light && spots.push([k, p]));
		this.flames = new FlameField(this.app, Math.max(8, spots.length + 4));
		this.vfx.add(this.flames.mesh);
		this.lampOf = new Map(); // placement index → { light, position, width, height, power }
		this.lampLights = spots.map(([k, p]) => {
			const [width, height, power] = FLAMES[p.piece] ?? FLAME_DEFAULT;
			const light = new THREE.PointLight(kelvinToColor(1900), modular ? 0 : power, 7.5, 2);
			light.position.set(p.light.x, p.light.y + 0.25, p.light.z);
			light.castShadow = false;
			light.name = `Light · ${p.asset}`;
			this.scene.add(light);
			this.lampOf.set(k, { light, position: new THREE.Vector3(p.light.x, p.light.y, p.light.z), width, height, power });
			if (!modular) this.flames.add(this.lampOf.get(k).position, { light, width, height, strength: 1 });
			return light;
		});
		this.heroLight = new THREE.PointLight(0xffffff, 0, 12, 1.2);
		this.heroLight.name = 'Player light radius';
		this.heroLight.visible = false;
		this.scene.add(this.heroLight);
		this.lights = [
			{ name: 'Sun / moon', light: this.moon, kelvin: 6500, base: 1 },
			{ name: 'Sky ambient', light: this.hemi, base: 1 },
		];
	}

	/** Lamp level of the preset (night 1, overcast almost off); the lights stay in the scene so the shader does not recompile. */
	applyLampSettings(t = this.times[this.settings.time] ?? this.times.night) {
		const scale = this.settings.pointLights ? (this.mood ? this.mood.torches.scale : t.lanterns ?? 1) : 0;
		this.flames.lightScale = scale;
		for (const e of this.flames.entries) e.strength = scale > 0.02 ? 1 : 0;
		for (const l of this.lampLights) l.distance = 7.5 * Math.max(0.6, scale);
	}

	async applyTime() {
		const t = this.times[this.settings.time] || this.times.night;
		const elev = THREE.MathUtils.degToRad(t.sunElev);
		const az = THREE.MathUtils.degToRad(t.sunAz);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moonDir.copy(dir);
		this.placeMoon(true);
		this.moon.color.copy(kelvinToColor(t.sunK));
		this.lights[0].kelvin = t.sunK;
		this.lights[0].base = t.sun;
		this.lights[1].base = t.hemi;
		this.hemi.color.set(t.sky);
		this.hemi.groundColor.set(t.ground);
		this.applyRigIntensity();
		this.applyLampSettings(t);
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
		this.postDefaults = { toneMapping: t.toneMapping, exposure: t.exposure, fog: { enabled: true, height: 0, ...t.fog }, grade: { vignette: 0.3, ...t.grade } };
	}

	async applyMood(block) {
		await super.applyMood(block);
		if (block) this.moonDir.copy(this.moon.position).normalize();
		this.placeMoon(true);
		this.applyLampSettings();
	}

	/** The moon's shadow map (±34 m, more when the camera is far out) follows the camera's focus: the map is 128 m, the shadow box is not. */
	placeMoon(force = false) {
		const rig = this.app.rig;
		const target = rig.controls.target;
		const dist = rig.mode === 'iso' ? 0 : rig.camera.position.distanceTo(target);
		const half = rig.mode === 'iso' ? 34 : clamp(dist * 0.45, 34, 80);
		const moved = this._moonAt ? Math.hypot(target.x - this._moonAt.x, target.z - this._moonAt.z) : Infinity;
		if (!force && moved < 3 && Math.abs(half - this.shadowHalf) < 3) return;
		(this._moonAt ??= new THREE.Vector3()).copy(target);
		this.moon.target.position.set(target.x, 0, target.z);
		this.moon.position.set(target.x, 0, target.z).addScaledVector(this.moonDir, 80);
		if (Math.abs(half - this.shadowHalf) >= 3 || force) {
			const cam = this.moon.shadow.camera;
			cam.left = cam.bottom = -half;
			cam.right = cam.top = half;
			cam.updateProjectionMatrix();
			this.shadowHalf = half;
		}
	}

	/** Shadow fill on the ground and the paths; the meshes of the content get theirs as they are adopted (adoptMeshes). */
	applyFill() {
		this.updateFill();
		this.swapMaterials([this.ground, ...this.roadMeshes].filter((m) => m?.isMesh), (m) => this.shadowFill.apply(m), this.memo.fill);
	}

	buildGroundBlend() {
		this.groundBlend = new GroundBlend(this.app, { ground: this.ground, terrain: this.terrain, heightAt: (x, z) => this.height(x, z), splat: this.splat });
		this.setBlendAssets();
	}

	/** The blend's asset list (statics and trees built so far) and how each is classified; the atlases are read from the kits loaded now. */
	setBlendAssets() {
		const fx = this.app.backend.effects;
		const atlas = (keys) => new Set(keys.flatMap((k) => Object.values(this.kits?.[k] ?? {}).map((piece) => piece.material.map)).filter(Boolean));
		const rocks = atlas(['rocks', 'mossy']);
		const wood = atlas(['deadTrees', 'burnedTrees']);
		const remains = atlas(['corpses']);
		const assets = [...Object.values(this.groups).flatMap((g) => g.children), ...this.trees];
		this.groundBlend.setAssets(assets, (mesh) => {
			const material = fx.sourceOf(mesh.material);
			const map = material.map;
			if (rocks.has(map) || material === this.mat.rock) return GROUND_PROFILES.rock;
			if (this.trees.includes(mesh) || wood.has(map)) return GROUND_PROFILES.tree;
			return remains.has(map) ? GROUND_PROFILES.remains : GROUND_PROFILES.built;
		});
	}

	wetRoots() {
		return [this.ground, ...Object.values(this.groups), this.treeCells, this.grass, ...this.shrubs, ...(this.cards ? [this.cards] : [])];
	}

	// -- class view (AD 12 §4.12) and the explanation overlays --------------------------------------------------------

	/** Flat class colour over each lit mesh (the Weeping Fields class view): obstacle · destructible · decor · guide · interactive · hazard. Streamed modules add theirs (addClassMesh). */
	buildClassOverlay() {
		this.classOverlay = new THREE.Group();
		this.classOverlay.name = 'Gameplay class view';
		this.classOverlay.userData.labNoPick = this.classOverlay.userData.labNoCollide = true;
		this.classOverlay.visible = false;
		this.classMaterials = Object.fromEntries(Object.entries(CLASS_COLORS).map(([id, color]) => [id, new THREE.MeshBasicMaterial({ name: `Class view · ${id}`, color: new THREE.Color(color), transparent: true, opacity: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })]));
		for (const [cls, meshes] of Object.entries(this.classMeshes)) for (const mesh of meshes) this.classOverlay.add(this.classOverlayMesh(mesh, cls));
		this.scene.add(this.classOverlay);
	}

	/** The class view's twin of a lit mesh: same geometry (and, instanced, the same instances) in the class colour. */
	classOverlayMesh(mesh, cls) {
		const material = this.classMaterials[cls];
		let o;
		if (mesh.isInstancedMesh) {
			o = new THREE.InstancedMesh(mesh.geometry, material, mesh.count);
			o.instanceMatrix = mesh.instanceMatrix; // the same instances
		} else o = new THREE.Mesh(mesh.geometry, material);
		o.matrixAutoUpdate = false;
		o.userData.labNoPick = o.userData.labNoCollide = true;
		o.renderOrder = 6;
		return o;
	}

	/** Overlay group by id (built once, hidden; the labels are canvases). */
	overlay(id) {
		if (!this.overlays[id]) {
			const group = new THREE.Group();
			group.name = `Overlay · ${id}`;
			group.userData.labNoPick = group.userData.labNoCollide = group.userData.labNoView = true;
			group.visible = false;
			this[`build_${id}`](group);
			this.scene.add(group);
			this.overlays[id] = group;
			this.app.backend.prepareObject?.(group);
		}
		return this.overlays[id];
	}

	applyOverlays() {
		const s = this.settings;
		// While warming (the first frames after the build) every overlay is visible so the scene's compile pass links their pipelines:
		// a pipeline first needed later makes WebGPU skip frames (a black screen) until it is ready.
		const warm = this.warmFrames < 3;
		this.classOverlay.visible = s.classView || warm;
		const flags = { play: s.ovPlay, footprints: s.ovFootprints, use: s.ovUse, occlusion: s.ovOcclusion, decisions: s.ovDecisions, clusters: s.ovClusters, events: s.ovEvents, drops: s.ovDrops };
		for (const [id, on] of Object.entries(flags)) this.overlay(id).visible = on || warm;
		if (s.ovModules) this.overlay('modules').visible = true; // built the first time it is shown
		else if (this.overlays.modules) this.overlays.modules.visible = false;
	}

	/** Line segments draped on the terrain (`dy` above it): lines = [{ pts, closed }]. */
	drapedLines(lines, color, dy = 0.14, opacity = 0.95) {
		const pos = [];
		for (const { pts, closed } of lines) {
			const dense = sampleLine(pts, closed, 0.8);
			for (let i = 1; i < dense.length; i++) {
				const a = dense[i - 1];
				const b = dense[i];
				pos.push(a.x, this.height(a.x, a.z) + dy, a.z, b.x, this.height(b.x, b.z) + dy, b.z);
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('normal', upNormals(pos.length / 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
		const line = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false }));
		line.renderOrder = 8;
		line.frustumCulled = false;
		return line;
	}

	/** Polygons filled and draped: ear-clipped, then the long edges bisected until every edge is under `maxEdge`. */
	drapedFill(polys, color, opacity = 0.3, dy = 0.1, maxEdge = 1.6) {
		const pos = [];
		for (const poly of polys) {
			const contour = poly.map((p) => new THREE.Vector2(p.x, p.z));
			if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
			let faces;
			try {
				faces = THREE.ShapeUtils.triangulateShape(contour, []);
			} catch {
				continue;
			}
			const stack = faces.map(([a, b, c]) => [contour[a].x, contour[a].y, contour[b].x, contour[b].y, contour[c].x, contour[c].y]);
			let guard = 6000;
			while (stack.length && guard-- > 0) {
				const t = stack.pop();
				const e = [Math.hypot(t[2] - t[0], t[3] - t[1]), Math.hypot(t[4] - t[2], t[5] - t[3]), Math.hypot(t[0] - t[4], t[1] - t[5])];
				const k = e.indexOf(Math.max(...e));
				if (e[k] <= maxEdge) {
					// wound counter-clockwise seen from above (+y normal): WebGPU renders the back face of a double-sided basic material black
					const up = (t[3] - t[1]) * (t[4] - t[0]) - (t[2] - t[0]) * (t[5] - t[1]);
					for (const v of up >= 0 ? [0, 1, 2] : [0, 2, 1]) pos.push(t[v * 2], this.height(t[v * 2], t[v * 2 + 1]) + dy, t[v * 2 + 1]);
					continue;
				}
				const [a, b, c] = [[t[0], t[1]], [t[2], t[3]], [t[4], t[5]]];
				const [p, q, o] = k === 0 ? [a, b, c] : k === 1 ? [b, c, a] : [c, a, b]; // longest edge p–q, opposite vertex o
				const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
				stack.push([p[0], p[1], m[0], m[1], o[0], o[1]], [m[0], m[1], q[0], q[1], o[0], o[1]]);
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('normal', upNormals(pos.length / 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
		const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
		mesh.renderOrder = 7;
		mesh.frustumCulled = false;
		return mesh;
	}

	/** A strip of `width` m along a polyline, draped (path corridors, creek margins). */
	drapedStrip(points, width, color, opacity = 0.3, dy = 0.1) {
		const mesh = new THREE.Mesh(ribbonGeometry(toVec3(sampleLine(points, false, 1.2)), width, 10, (x, z) => this.height(x, z) + dy, 5), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
		mesh.renderOrder = 7;
		mesh.frustumCulled = false;
		return mesh;
	}

	/**
	 * A text lying on the ground. With `slots` (one list per overlay) the label slides along the page's vertical until it clears
	 * the labels already placed (they are rotated 45°: the test is in the text's own frame), so neighbouring labels stay readable.
	 */
	groundText(text, x, z, color, width = 2.8, slots = null) {
		const yaw = Math.PI / 4;
		const ux = Math.cos(yaw); // along the text: (cos yaw, -sin yaw)
		const uz = -Math.sin(yaw);
		const vx = Math.sin(yaw); // across the text
		const vz = Math.cos(yaw);
		const h = width * 0.25;
		let cx = x;
		let cz = z;
		if (slots) {
			const clear = (px, pz) => slots.every((q) => Math.abs((px - q.x) * ux + (pz - q.z) * uz) >= (width + q.w) / 2 + 0.1 || Math.abs((px - q.x) * vx + (pz - q.z) * vz) >= (h + q.h) / 2 + 0.05);
			for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) {
				if (clear(x + vx * k * h * 1.1, z + vz * k * h * 1.1)) {
					cx = x + vx * k * h * 1.1;
					cz = z + vz * k * h * 1.1;
					break;
				}
			}
			slots.push({ x: cx, z: cz, w: width, h });
		}
		const mesh = groundLabel(text, { center: { x: cx, z: cz }, width, height: (px, pz) => this.height(px, pz) + 0.3, yaw, color });
		mesh.renderOrder = 9;
		mesh.material.depthTest = false;
		return mesh;
	}

	/** An arrow (shaft + head) from (x, z) along `angle` (atan2(dx, dz)) for `len` m, draped. */
	arrowLines(x, z, angle, len) {
		const dx = Math.sin(angle);
		const dz = Math.cos(angle);
		const tip = { x: x + dx * len, z: z + dz * len };
		const head = (side) => ({ x: tip.x - dx * 0.8 + dz * 0.45 * side, z: tip.z - dz * 0.8 - dx * 0.45 * side });
		return [{ pts: [{ x, z }, tip], closed: false }, { pts: [head(1), tip, head(-1)], closed: false }];
	}

	/** A red cross of arm length `r` at (x, z). */
	crossLines(x, z, r) {
		return [{ pts: [{ x: x - r, z: z - r }, { x: x + r, z: z + r }], closed: false }, { pts: [{ x: x - r, z: z + r }, { x: x + r, z: z - r }], closed: false }];
	}

	/** Step 1 · the locked play space: path corridors (+ the clear band beside them), door corridors, interaction / spawn / arena zones, water + bank margin. */
	build_play(group) {
		const rules = this.result.report.rules;
		const slots = [];
		const lines = {};
		const push = (kind, pts) => (lines[kind] ??= []).push({ pts, closed: true });
		for (const r of this.result.reserved) {
			const sh = r.shape;
			if (r.kind === 'path') {
				group.add(this.drapedStrip(sh.points, sh.width, OV.path, 0.28, 0.1));
				push('path', this.strip(sh.points, sh.width / 2 + rules.pathClear, 1));
			} else if (r.kind === 'water') {
				if (sh.type === 'polygon') {
					group.add(this.drapedFill([sh.points], OV.water, 0.25));
					push('water', sh.points);
				} else {
					group.add(this.drapedStrip(sh.points, sh.width + 2 * rules.waterClear, OV.water, 0.25, 0.1));
					push('water', this.strip(sh.points, sh.width / 2 + rules.waterClear, 1));
				}
			} else {
				const poly = sh.type === 'circle' ? circlePoly(sh.x, sh.z, sh.r) : sh.points;
				group.add(this.drapedFill([poly], OV[r.kind], r.kind === 'arena' ? 0.2 : 0.38));
				push(r.kind, poly);
				const c = centreOf(poly);
				group.add(this.groundText(r.id, c.x, c.z, OV[r.kind], 2.8, slots));
			}
		}
		for (const [kind, list] of Object.entries(lines)) group.add(this.drapedLines(list, OV[kind]));
	}

	/** Outline of a strip `half` m either side of a polyline, as one closed polygon (left side out, right side back). */
	strip(points, half, step) {
		const dense = sampleLine(points, false, step);
		const left = [];
		const right = [];
		dense.forEach((p, i) => {
			const a = dense[Math.max(0, i - 1)];
			const b = dense[Math.min(dense.length - 1, i + 1)];
			const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
			left.push({ x: p.x - ((b.z - a.z) / len) * half, z: p.z + ((b.x - a.x) / len) * half });
			right.push({ x: p.x + ((b.z - a.z) / len) * half, z: p.z - ((b.x - a.x) / len) * half });
		});
		return left.concat(right.reverse());
	}

	/** Footprints (oriented boxes) by class: what blocks, what is walk-through. */
	build_footprints(group) {
		const byClass = {};
		for (const p of this.result.placements) {
			if (!p.footprint) continue;
			(byClass[p.class] ??= []).push({ pts: obbFrom(p.footprint).pts, closed: true });
		}
		for (const [cls, list] of Object.entries(byClass)) group.add(this.drapedLines(list, CLASS_COLORS[cls] ?? '#ffffff', 0.16));
		const tufts = this.result.ecology.shrubs.filter((p) => p.footprint).map((p) => ({ pts: obbFrom(p.footprint).pts, closed: true }));
		if (tufts.length) group.add(this.drapedLines(tufts, '#6fae5a', 0.16, 0.7));
	}

	/** Use / operating zones that must stay clear (the butcher's block front, a tent's door, a forge's mouth). */
	build_use(group) {
		const polys = this.result.placements.filter((p) => p.use).map((p) => obbFrom(p.use).pts);
		if (polys.length) {
			group.add(this.drapedFill(polys, OV.use, 0.34));
			group.add(this.drapedLines(polys.map((pts) => ({ pts, closed: true })), OV.use, 0.16));
		}
	}

	/** Camera occlusion zones of the tall pieces (footprint swept along the view direction): where something tall hides the ground behind it. */
	build_occlusion(group) {
		const polys = this.result.placements.filter((p) => p.occlusion?.length >= 3).map((p) => p.occlusion);
		if (polys.length) {
			group.add(this.drapedFill(polys, OV.occlusion, 0.12, 0.08, 2.2));
			group.add(this.drapedLines(polys.map((pts) => ({ pts, closed: true })), OV.occlusion, 0.12, 0.6));
		}
	}

	/** Decision points (fork / gate / bridge / bend), the radius a marker may stand in, and a line to each marker placed for it. */
	build_decisions(group) {
		const slots = [];
		const byId = new Map(this.result.placements.map((p) => [p.id, p]));
		const radius = this.result.report.rules.decisionRadius;
		for (const d of this.result.decisions) {
			const color = OV.decision[d.kind] ?? '#ffffff';
			group.add(this.drapedLines([{ pts: circlePoly(d.x, d.z, 0.9, 20), closed: true }, { pts: circlePoly(d.x, d.z, radius, 48), closed: true }], color, 0.2, 0.55));
			const post = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(d.x, this.height(d.x, d.z), d.z), new THREE.Vector3(d.x, this.height(d.x, d.z) + 3.2, d.z)]);
			post.setAttribute('normal', upNormals(2));
			post.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(4), 2));
			const mast = new THREE.Line(post, new THREE.LineBasicMaterial({ color, toneMapped: false }));
			mast.frustumCulled = false;
			mast.renderOrder = 8;
			group.add(mast);
			const links = (d.markers ?? []).map((id) => byId.get(id)).filter(Boolean).map((m) => ({ pts: [{ x: d.x, z: d.z }, { x: m.x, z: m.z }], closed: false }));
			if (links.length) group.add(this.drapedLines(links, color, 0.2));
			group.add(this.groundText(`${d.kind}${d.important ? ' ★' : ''}${d.hidden ? ' (khuất)' : ''}`, d.x, d.z + 1.4, color, 2.8, slots));
		}
	}

	/** Functional clusters: the host, its radius, a line to every member; the recipe's name on the ground. */
	build_clusters(group) {
		const slots = [];
		const palette = ['#ffd84a', '#7fd6ff', '#ff9ad5', '#9dff8a', '#ffa45c', '#c3a1ff'];
		const byId = new Map(this.result.placements.map((p) => [p.id, p]));
		this.result.clusters.forEach((c, i) => {
			const color = palette[i % palette.length];
			const host = c.host;
			if (!host) return;
			const lines = [{ pts: circlePoly(host.x, host.z, Math.max(1.2, c.radius ?? 2), 40), closed: true }];
			for (const id of c.members ?? []) {
				const m = byId.get(id);
				if (m) lines.push({ pts: [{ x: host.x, z: host.z }, { x: m.x, z: m.z }], closed: false });
			}
			group.add(this.drapedLines(lines, color, 0.2, c.dropped ? 0.35 : 0.9));
			group.add(this.groundText(`${c.id} · ${c.recipe} ${c.placed > c.requested ? `${c.requested} +${c.placed - c.requested} repair` : `${c.placed}/${c.requested}`}`, host.x, host.z - 1.2, color, 3.4, slots));
		});
	}

	/** Trace events: the main piece, the lean arrow and its sector, the secondary pieces; dropped events in red. */
	build_events(group) {
		const slots = [];
		const byId = new Map(this.result.placements.map((p) => [p.id, p]));
		const spread = this.result.report.rules.massLean ?? 0.7;
		for (const e of this.result.events) {
			const color = e.dropped ? OV.eventDropped : OV.event;
			const main = byId.get(e.main);
			const at = main ?? e.at;
			if (!at) continue;
			const lines = [];
			if (e.lean !== undefined && e.lean !== null) {
				lines.push(...this.arrowLines(at.x, at.z, e.lean, 3.4));
				for (const side of [-1, 1]) lines.push({ pts: [{ x: at.x, z: at.z }, { x: at.x + Math.sin(e.lean + side * spread) * 3, z: at.z + Math.cos(e.lean + side * spread) * 3 }], closed: false });
			}
			for (const id of e.placed ?? []) {
				const m = byId.get(id);
				if (m && m !== main) lines.push({ pts: [{ x: at.x, z: at.z }, { x: m.x, z: m.z }], closed: false });
			}
			if (e.hostPos) lines.push({ pts: [{ x: at.x, z: at.z }, { x: e.hostPos.x, z: e.hostPos.z }], closed: false });
			lines.push({ pts: circlePoly(at.x, at.z, 0.8, 20), closed: true });
			group.add(this.drapedLines(lines, color, 0.22));
			group.add(this.groundText(`${e.id} · ${e.cause}${e.dropped ? ' ✕ bỏ' : ''}`, at.x, at.z + 1.5, color, 3.4, slots));
		}
	}

	/** Drops: a red cross where the engine gave up, with step · reason · detail on the ground. */
	build_drops(group) {
		const drops = this.result.report.drops.filter((d) => Number.isFinite(d.x));
		const crosses = drops.flatMap((d) => this.crossLines(d.x, d.z, 0.6));
		if (crosses.length) group.add(this.drapedLines(crosses, OV.drop, 0.25));
		const slots = [];
		for (const d of drops) group.add(this.groundText(`${d.step}·${d.reason}${d.detail ? `: ${String(d.detail).slice(0, 22)}` : ''}`, d.x, d.z + 1.1, '#ff8a80', 3.6, slots));
	}

	// -- frame --------------------------------------------------------------------------------------------------------

	/** Flames of the lights a module owns: the lights exist since init, a module only lights its own (dark → its power) and adds the flame sprite. */
	lightFlames(indices) {
		if (this.loadMode !== 'modules' || !indices.length) return; // 'all' added them with the lights
		for (const k of indices) {
			const lamp = this.lampOf.get(k);
			lamp.light.intensity = lamp.power;
			this.flames.add(lamp.position, { light: lamp.light, width: lamp.width, height: lamp.height, strength: 1 });
		}
		this.applyLampSettings();
	}

	/** 'all' mode: every module is in when init ends. */
	markAllLoaded() {
		for (const m of this.moduleList) this.loadedModules.add(m.id);
		this.timing.allMs = this.loadMs;
		this.timing.allLoadedAt = performance.now();
		this.moduleOverlayDirty = true;
	}

	/** The streamer finished: ground blend and the wet layer see every mesh, the reports get the final numbers. */
	onStreamDone() {
		this.timing.allLoadedAt = performance.now();
		this.timing.allMs = this.timing.allLoadedAt - this.t0;
		this.timing.stream = this.stream.stats();
		if (this.groundBlend) this.setBlendAssets();
		this.app.mood?.onSceneRebuilt(this);
		this.refreshReports();
	}

	/** Re-renders the report panel and the module status (they were drawn when the panel opened). */
	refreshReports() {
		if (this.reportEl?.isConnected) this.reportEl.innerHTML = this.reportHtml();
		if (this.moduleStatusEl?.isConnected) this.moduleStatusEl.innerHTML = this.moduleStatusHtml();
		if (this.instancingEl?.isConnected) this.instancingEl.innerHTML = this.instancingHtml();
	}

	/**
	 * Build budget of a frame (ms): the rules' 4 ms at 60 fps. A renderer that is slower is not slowed further by a one-module frame, so it gets a
	 * quarter of its smoothed frame time instead, at most 25 ms (and one stall is not a frame time: samples are clamped at 250 ms).
	 */
	streamBudget(frameMs) {
		const sample = Math.min(frameMs, 250);
		this.frameEma = this.frameEma ? this.frameEma * 0.8 + sample * 0.2 : sample;
		return Math.min(25, Math.max(RULES.frameBudgetMs, 0.25 * this.frameEma));
	}

	/** Once per frame after the warm-up: a module or two inside the frame budget, deferred work, frame-time bookkeeping. */
	stepStream(now) {
		const stream = this.stream;
		if (this.warmFrames < 3) return;
		if (stream && !this.streamEnded) {
			if (this.lastFrameAt) {
				const ms = now - this.lastFrameAt;
				const f = this.timing.frames;
				f.max = Math.max(f.max, ms);
				f.count++;
				if (ms > 33.4) f.over33++;
				if (ms > 50) f.over50++;
			}
			const built = stream.step(this.streamBudget(this.lastFrameAt ? now - this.lastFrameAt : 16.7));
			if (built && stream.builtCount % 8 === 0) this.refreshReports();
			if (stream.builtCount === stream.modules.length && this.pendingReveals === 0) {
				this.streamEnded = true;
				this.onStreamDone();
			}
		}
		this.lastFrameAt = now;
		if (this.deferred?.length && this.warmFrames >= 6) this.deferred.shift()();
		if (this.moduleOverlayDirty && this.overlays.modules?.visible) this.refreshModuleOverlay();
	}

	update(delta, elapsed) {
		if (this.heroLight.visible) {
			this.app.subject.root.getWorldPosition(this.heroLight.position);
			this.heroLight.position.y += this.heroHeight ?? 3;
		}
		this.placeMoon();
		if (!this.timing.firstFrameAt) {
			this.timing.firstFrameAt = performance.now(); // ms since the page opened
			this.stream?.release(); // the background kits may start now: until the first frame the hero's model, the sky and the shaders own the bandwidth
		}
		if (this.warmFrames < 3 && ++this.warmFrames === 3) this.applyOverlays();
		else if (this.warmFrames >= 3 && this.warmFrames < 6) this.warmFrames++;
		this.flames.update(elapsed);
		if (this.waterMesh?.visible) this.waterMaterial.map.offset.y = (-elapsed * this.settings.waterFlow) % 1;
		this.groundBlend?.update();
		this.stepStream(performance.now());
	}

	activate() {
		super.activate();
		this.lastFrameAt = 0;
		this.stream?.resume();
	}

	deactivate() {
		this.stream?.pause(); // streaming goes on when the scene comes back
		super.deactivate();
	}

	/**
	 * "Lưới module": the 16 m squares of the module grid with id · ring · load order. Colour = state: green loaded, grey waiting,
	 * red = breaks a budget (dim red until loaded). Built the first time it is shown; the squares swap between three shared materials.
	 */
	build_modules(group) {
		const colors = { loaded: '#8fd070', pending: '#6c7a88', over: '#ff4f4f', overPending: '#8a3a3a' };
		this.moduleMaterials = Object.fromEntries(Object.entries(colors).map(([k, c]) => [k, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false })]));
		this.moduleLines = new Map();
		this.moduleLabels = new Map();
		for (const m of this.manifest.modules) {
			const { x0, z0, x1, z1 } = m.cell;
			const line = this.drapedLines([{ pts: [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }], closed: true }], '#ffffff', 0.2);
			line.material.dispose();
			line.material = this.moduleMaterials.pending;
			this.moduleLines.set(m.id, line);
			group.add(line);
			const o = this.order[this.orderIndex.get(m.id)];
			const label = this.groundText(`${m.id} · ${o.ring === 0 ? 'vòng 0' : `v${o.ring}`} · #${this.orderIndex.get(m.id) + 1}`, (x0 + x1) / 2, (z0 + z1) / 2, '#e8e4d8', 8);
			this.moduleLabels.set(m.id, label);
			group.add(label);
		}
		this.refreshModuleOverlay();
	}

	/** Squares and labels follow the state: loaded or waiting, over budget or not. */
	refreshModuleOverlay() {
		if (!this.moduleLines) return;
		this.moduleOverlayDirty = false;
		for (const [id, line] of this.moduleLines) {
			const loaded = this.loadedModules.has(id);
			const over = this.overBudget.has(id);
			line.material = this.moduleMaterials[over ? (loaded ? 'over' : 'overPending') : loaded ? 'loaded' : 'pending'];
			const label = this.moduleLabels.get(id);
			label.material.transparent = true;
			label.material.opacity = loaded ? 1 : 0.45;
		}
	}

	/** Module & tải nhanh: source of the layout and the splat, time to the first frame and to the last module, kits and MB, streaming frame times. */
	moduleStatusHtml() {
		const t = this.timing ?? {};
		const row = (a, b, c = '') => `<div class="wf-row"><b>${a}</b><span>${b}</span><em>${c}</em></div>`;
		const ms = (v) => (Number.isFinite(v) ? `${v.toFixed(0)} ms` : '…');
		const src = { cache: 'cache trình duyệt (IndexedDB)', file: 'file bake assets/maps/', engine: 'engine (chạy lại thuật toán)' };
		const total = this.moduleList.length;
		const stream = this.stream?.stats();
		const kitsNow = Object.keys(this.kits ?? {}).length;
		const f = t.frames ?? { max: 0, count: 0, over33: 0, over50: 0 };
		return `<div class="wf-palette">
			${row('Chế độ', t.mode === 'all' ? 'all' : 'modules', t.mode === 'all' ? 'mọi kit + mọi module trước khung đầu (như cũ)' : `vòng 0 trước, ${total - (this.order.filter((o) => o.ring === 0).length)} module còn lại tải dần`)}
			${row('Layout', ms(t.layout?.ms), `${src[t.layout?.source] ?? ''}${t.layout?.engineMs ? ` · engine ${t.layout.engineMs} ms` : ''} · key ${t.layout?.key?.slice(0, 8) ?? ''}`)}
			${row('Plan', t.plan?.source === 'seed' ? ms(t.plan.generateMs ?? t.plan.planMs) : 'demo', t.plan?.source === 'seed' ? (t.plan.generateMs !== null ? 'generateMap: tìm lần thử + engine (nguội)' : `generatePlan(seed, { attempt }) từ ${this.mapInfo?.gen?.source === 'file' ? 'file bake' : 'cache'} (không tìm lại)`) : 'DEMO_PLAN làm tay')}
				${row('Splat', ms(t.splat?.ms), t.splat?.source === 'cache' ? 'từ cache (bỏ generateSplat)' : 'generateSplat')}
			${row('Khung đầu', ms(t.initMs), `init (kit vòng 0 + terrain song song, phần toàn cục ${ms(t.globalsMs)}) · hình hiện ở ${ms(t.firstFrameAt)} kể từ lúc mở trang`)}
			${row('Kit trước khung đầu', `${t.requiredKits?.length ?? '…'} kit`, `${(t.requiredMB ?? 0).toFixed(1)} MB cần thiết (vòng 0) · lúc hết init đã tải ${t.kitsAtInit ?? '…'} kit / ${(t.kitMBAtInit ?? 0).toFixed(1)} MB`)}
			${row('Module đã vào', `${this.loadedModules.size}/${total}`, `${t.modulesAtInit ?? 0} trước khung đầu · đủ sau ${t.allMs ? ms(t.allMs) : '…'}${stream ? ` · dựng ${stream.buildMsTotal.toFixed(0)} ms (CPU)` : ''}`)}
			${row('Kit đã tải', `${kitsNow}`, stream ? `đồng thời tối đa ${stream.maxInflight}${stream.kitErrors.length ? ` · lỗi ${stream.kitErrors.map((e) => e.key).join(', ')}` : ''}` : '')}
			${row('Khung hình khi stream', `max ${f.max.toFixed(1)} ms`, `${f.count} khung · >33 ms: ${f.over33} · >50 ms: ${f.over50}`)}
		</div>`;
	}

	/** Module checks and the per-module timing table, for the report panel. */
	moduleReportHtml() {
		const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
		const checks = this.moduleChecks ?? [];
		const passed = checks.filter((c) => c.pass).length;
		const rows = checks.map((c) => `<div class="wf-row" title="${esc(JSON.stringify(c.details ?? '').slice(0, 600))}"><b style="color:${c.pass ? '#8fd070' : '#ff6a5e'}">${c.pass ? '✓' : '✗'} ${esc(c.id)}</b><span>${c.details?.max ?? c.details?.value ?? ''}${c.details?.limit !== undefined ? ` / ${c.details.limit}` : ''}</span><em>${esc(c.rule)}${c.details?.violations?.length ? ` — ${c.details.violations.length} vi phạm` : ''}${c.details?.skipped ? ` — bỏ qua: ${esc(c.details.skipped)}` : ''}</em></div>`).join('');
		const stream = this.stream?.stats();
		const table = stream ? stream.modules.filter((m) => m.built).map((m) => `<div class="wf-row"><b>${m.id}</b><span>vòng ${m.ring}</span><em>kit ${m.kitWaitMs === null ? '—' : m.kitWaitMs.toFixed(0)} ms · dựng ${m.buildMs.toFixed(1)} ms · chờ khung ${m.lagMs.toFixed(0)} ms</em></div>`).join('') : '';
		return `<h4>Module & tải nhanh §4.14 · ${passed}/${checks.length} đạt</h4>${rows}${table ? `<details><summary>Thời gian từng module (kit chờ · dựng · chờ khung)</summary>${table}</details>` : ''}`;
	}

	// -- panels -------------------------------------------------------------------------------------------------------

	buildLightingControls(folder, rebuildLights) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		if (!this.mood) {
			folder.add(s, 'time', Object.fromEntries(Object.entries(this.times).map(([id, t]) => [t.label, id]))).name('Time of day').onChange(async () => {
				save();
				await this.applyTime();
				this.app.applyScenePost(this, true);
				rebuildLights();
			});
		}
		folder.add(s, 'pointLights').name('Đèn của plan (lửa + point light)').onChange(() => (save(), this.applyLampSettings()));
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const app = this.app;
		const save = () => app.settings.changed(this.id);
		const reload = () => {
			save();
			app.reloadScene(); // the layout is part of the build: rebuilding in place renders black on WebGPU
		};

		// The algorithm ---------------------------------------------------------------------------------------
		const fb = folder.addFolder('Bố trí biome · thuật toán');
		note(fb, 'Map này vẽ kết quả của <b>layoutBiome()</b> (legacy/art-direction/12 §4.13) trên một plan: đạo cụ kit thật, cỏ/bụi từ <b>ecology</b>, đèn từ <b>light</b>. Bật overlay để xem <b>vì sao</b> mỗi thứ nằm ở đó; báo cáo ở thư mục dưới.');
		const fseed = fb.addFolder('Map từ một seed (đổi = tải lại map)');
		note(fseed, 'Một con số → cả map: <b>planGen</b> (legacy/art-direction/12 §4.15) sinh đường, suối/ao, vùng (trại, nông trại, hang, nghĩa địa), công trình và địa hình; <b>layoutBiome</b> trang trí. Cùng seed → cùng map. Lần đầu thuật toán thử vài lần cho tới khi mọi kiểm tra đạt; lần sau lấy từ cache (không chạy lại engine).');
		fseed.add(s, 'planSource', { 'Sinh từ một seed (mặc định)': 'seed', 'Plan demo làm tay': 'demo' }).name('Nguồn plan').onChange(reload);
		fseed.add(s, 'mapSeed', 1, 99999999, 1).name('Seed map').onFinishChange(reload);
		fseed.add(s, 'mapSize', Object.fromEntries(MAP_SIZES.map((n) => [`${n} × ${n} m${n > 128 ? ' (Play chỉ đi được 128 m quanh điểm xuất phát)' : ''}`, n]))).name('Cỡ map').onChange(reload);
		fseed.add({ roll: () => {
			s.mapSeed = Math.floor(Math.random() * 99999999) + 1;
			s.planSource = 'seed';
			reload();
		} }, 'roll').name('🎲 Map mới');
		fb.add(s, 'view', Object.fromEntries(Object.entries(this.views).map(([id, v]) => [v.label, id]))).name('Góc camera').onChange((id) => (save(), this.frameView(id)));
		fb.add({ frame: () => this.frameView(s.view) }, 'frame').name('↺ Đưa camera về góc đã chọn');
		fb.add(s, 'classView').name('Class view (§4.12): cản · phá · trang trí · đường · tương tác').onChange(() => (save(), this.applyOverlays()));
		note(fb, `<div class="wf-legend">${CLASS_ORDER.map((c) => `<span><i style="background:${CLASS_COLORS[c]}"></i>${CLASS_LABELS[c]}</span>`).join('')}</div>`);

		const fo = fb.addFolder('Overlay giải thích');
		const ov = () => (save(), this.applyOverlays());
		fo.add(s, 'ovPlay').name('1 · Play space: đường, cửa, vùng đứng, spawn, arena, nước').onChange(ov);
		fo.add(s, 'ovFootprints').name('2 · Footprint theo class (OBB)').onChange(ov);
		fo.add(s, 'ovUse').name('3 · Use zone (vùng thao tác phải trống)').onChange(ov);
		fo.add(s, 'ovOcclusion').name('Occlusion zone (vùng bị che theo camera)').onChange(ov);
		fo.add(s, 'ovDecisions').name('4 · Điểm quyết định + marker dẫn đường').onChange(ov);
		fo.add(s, 'ovClusters').name('3 · Cluster: host → thành viên').onChange(ov);
		fo.add(s, 'ovEvents').name('6 · Trace: sự kiện + mũi tên nghiêng').onChange(ov);
		fo.add(s, 'ovDrops').name('Drops (✕ + lý do)').onChange(ov);
		note(fo, `<div class="wf-legend"><span><i style="background:${OV.path}"></i>đường</span><span><i style="background:${OV.door}"></i>cửa</span><span><i style="background:${OV.interaction}"></i>tương tác</span><span><i style="background:${OV.spawn}"></i>spawn</span><span><i style="background:${OV.arena}"></i>arena</span><span><i style="background:${OV.water}"></i>nước</span><span><i style="background:${OV.use}"></i>use</span><span><i style="background:${OV.occlusion}"></i>che</span><span><i style="background:${OV.drop}"></i>drop</span></div>`);

		const fs = fb.addFolder('Nâng cao · seed nhóm & mật độ (đổi = tải lại map)').close();
		const seeds = [['seed', 'Seed gốc của plan demo (plan.seed; map sinh dùng Seed map)'], ['seedMass', 'Seed khối lớn (mass)'], ['seedCluster', 'Seed cụm chức năng (cluster)'], ['seedGuide', 'Seed dẫn đường (guide)'], ['seedEcology', 'Seed sinh thái (ecology)'], ['seedTrace', 'Seed dấu vết (trace)']];
		for (const [key, name] of seeds) fs.add(s, key, 0, 99999999, 1).name(name).onFinishChange(reload);
		fs.add({ roll: () => {
			const roll = () => Math.floor(Math.random() * 99999) + 1;
			Object.assign(s, { seedMass: roll(), seedCluster: roll(), seedGuide: roll(), seedEcology: roll(), seedTrace: roll() });
			reload();
		} }, 'roll').name('🎲 Đổi cả 5 seed nhóm');
		fs.add({ reset: () => {
			Object.assign(s, { seed: DEMO_PLAN.seed ?? 1, seedMass: DEFAULT_OPTIONS.seeds.mass, seedCluster: DEFAULT_OPTIONS.seeds.cluster, seedGuide: DEFAULT_OPTIONS.seeds.guide, seedEcology: DEFAULT_OPTIONS.seeds.ecology, seedTrace: DEFAULT_OPTIONS.seeds.trace });
			reload();
		} }, 'reset').name('↺ Seed mặc định');
		fs.add(s, 'densityGrass', 0, 2, 0.05).name('Mật độ cỏ').onFinishChange(reload);
		fs.add(s, 'densityShrubs', 0, 2, 0.05).name('Mật độ bụi').onFinishChange(reload);
		fs.add(s, 'densityTraces', 0, 2, 0.05).name('Mật độ dấu vết').onFinishChange(reload);
		fs.add(s, 'densityMasses', 0, 2, 0.05).name('Mật độ khối lớn').onFinishChange(reload);

		const fm = fb.addFolder('Module & tải nhanh');
		note(fm, 'Map chia thành <b>module 16 m</b> (legacy/art-direction/12 §4.14). Chế độ <b>modules</b> chỉ tải kit của vòng 0 (quanh điểm xuất phát) trước khung đầu, phần còn lại tải dần theo khoảng cách mà không khựng hình; <b>all</b> tải mọi thứ trước (như cũ, để so A/B). Layout và splat lấy từ cache trình duyệt hoặc file bake (<code>npm run bake:map</code>) khi khoá khớp, nên map đã biết không chạy lại thuật toán.');
		fm.add(s, 'loadMode', { 'modules · vòng 0 trước, còn lại tải dần (mặc định)': 'modules', 'all · mọi kit + module trước khung đầu (như cũ)': 'all' }).name('Chế độ tải (tải lại trang)').onChange(reload);
		fm.add(s, 'useCache').name('Dùng cache map (IndexedDB + file bake)').onChange(reload);
		const cleared = note(fm, '');
		fm.add({ clear: async () => {
			const n = await mapCache.clear();
			cleared.textContent = `Đã xoá ${n} mục cache; tải lại trang để thấy lần tải nguội.`;
		} }, 'clear').name('Xoá cache map');
		fm.add(s, 'ovModules').name('Lưới module: ô, vòng tải, đỏ = vượt ngân sách').onChange(ov);
		this.moduleStatusEl = note(fm, this.moduleStatusHtml());

		const fr = fb.addFolder('Báo cáo');
		const report = (this.reportEl = note(fr, this.reportHtml()));
		report.addEventListener('click', (e) => {
			const el = e.target.closest('[data-x]');
			if (el) this.frameAt(+el.dataset.x, +el.dataset.z, el.dataset.overlay || null);
		});

		// Terrain ---------------------------------------------------------------------------------------------
		const layers = () => (save(), this.applyLayerSettings());
		const fl = folder.addFolder('Terrain layers · dirt → wet → grass → blood').close();
		fl.add(s, 'showWeights').name('Show layer weights').onChange(layers);
		fl.add(s, 'softness', 0.02, 0.49, 0.01).name('Transition softness').onChange(layers);
		fl.add(s, 'heightBlend', 0, 1.5, 0.01).name('Height-based blend').onChange(layers);
		fl.add(s, 'water', 0, 0.6, 0.01).name('Standing water level').onChange(layers);
		fl.add(s, 'damp', 0, 0.6, 0.01).name('Damp halo around wet').onChange(layers);
		fl.add(s, 'grassShadow', 0, 1, 0.01).name('Contact shadow around grass').onChange(layers);
		fl.add(s, 'grassLift', -0.3, 0.6, 0.01).name('Grass over soil (height bias)').onChange(layers);
		fl.add(s, 'edgeCards', 0, 3, 0.05).name('3D grass cards on tufts').onFinishChange(() => (save(), this.buildCards(), this.cards && app.backend.prepareObject(this.cards)));
		const shells = () => (save(), this.buildShells());
		fl.add(s, 'shells').name('Shell grass (raised blades)').onChange(shells);
		fl.add(s, 'shellCount', 2, 24, 1).name('Shell layers').onFinishChange(shells);
		fl.add(s, 'shellHeight', 0.02, 0.3, 0.005).name('Shell grass height (m)').onFinishChange(shells);
		fl.add(s, 'shellCoverage', 0.1, 0.95, 0.01).name('Shell grass cover at the roots').onFinishChange(shells);
		fl.add(s, 'variation', 0, 1, 0.01).name('Tiling breakup').onChange(layers);
		fl.add(s, 'macro', 0, 0.8, 0.01).name('Large-scale variation').onChange(layers);
		fl.add(s, 'edgeNoise', 0, 1, 0.01).name('Edge noise').onChange(layers);
		fl.add(s, 'splatBlur', 0, 8, 1).name('Splat smoothing (texels)').onFinishChange(() => (layers(), this.rebuildGrass()));
		const ribbons = () => (save(), this.applyRibbonSettings());
		fl.add(s, 'roadRuts').name('Path ribbons').onChange(ribbons);
		fl.add(s, 'rutsOpacity', 0, 1, 0.01).name('Path opacity').onChange(ribbons);
		fl.add(s, 'creekWater').name('Water surfaces').onChange(ribbons);
		fl.add(s, 'waterOpacity', 0, 1, 0.01).name('Water opacity').onChange(ribbons);

		// Atmosphere ------------------------------------------------------------------------------------------
		const post = app.settings.data.post;
		const postChanged = () => {
			app.settings.changed('post');
			app.applyPost();
			app.panels?.refresh();
		};
		const fa = folder.addFolder('Atmosphere · fog, vignette, shadows').close();
		fa.add(post.fog, 'enabled').name('Height fog').onChange(postChanged).listen();
		fa.add(post.fog, 'density', 0, 0.3, 0.001).name('Fog density').onChange(postChanged).listen();
		fa.add(post.fog, 'falloff', 0.01, 2, 0.01).name('Fog height falloff').onChange(postChanged).listen();
		fa.add(post.fog, 'start', 0, 40, 0.5).name('Fog start (m)').onChange(postChanged).listen();
		fa.addColor(post.fog, 'color').name('Fog colour').onChange(postChanged).listen();
		fa.add(post.grade, 'vignette', 0, 1.2, 0.01).name('Vignette').onChange(postChanged).listen();
		fa.add(post, 'exposure', -4, 4, 0.05).name('Exposure (EV)').onChange(postChanged).listen();
		const fill = () => (save(), this.updateFill());
		fa.add(s, 'shadowStrength', 0, 1, 0.01).name('Cast shadow strength').onChange(fill);
		fa.add(s, 'fill').name('Shadow fill on assets').onChange(fill);
		fa.add(s, 'fillStrength', 0, 4, 0.01).name('Shadow fill strength').onChange(fill);
		fa.addColor(s, 'fillColor').name('Shadow fill colour').onChange(fill);
		fa.add({ reset: () => app.applyScenePost(this, true) }, 'reset').name('Reset to time-of-day preset');

		// Brush -----------------------------------------------------------------------------------------------
		const fbr = folder.addFolder('Brush (left drag in the viewport)').close();
		fbr.add(s, 'paint').name('Paint').onChange((v) => (save(), this.setPaint(v)));
		fbr.add(s, 'brushLayer', BRUSH_LAYERS).name('Layer').onChange(save);
		fbr.add(s, 'brushRadius', 0.3, 12, 0.1).name('Radius (m)').onChange(save);
		fbr.add(s, 'brushStrength', 0.02, 1, 0.01).name('Strength').onChange(save);
		fbr.add(s, 'brushHardness', 0, 0.95, 0.01).name('Hardness').onChange(save);
		fbr.add(s, 'brushNoise', 0, 1, 0.01).name('Edge noise').onChange(save);
		fbr.add({ undo: () => this.splat.undo() && this.rebuildGrass() }, 'undo').name('Undo (Ctrl+Z)');
		fbr.add({ regenerate: () => (this.splat.pushUndo(), this.generateSplat(), this.rebuildGrass()) }, 'regenerate').name('Regenerate from the layout');

		const fg = folder.addFolder('Wind & GPU instancing').close();
		fg.add(s, 'wind', 0, 1.2, 0.01).name('Wind strength').onChange((v) => {
			save();
			this.windGrass.uniforms.strength.value = v;
			this.windTrees.uniforms.strength.value = v * 0.35;
			this.windShrubs.uniforms.strength.value = v * 0.6;
		});
		fg.add(s, 'cells', { 'Tắt · mỗi bộ một khối cả map': 0, '16 m (mặc định)': 16, '24 m': 24, '32 m': 32 }).name('Cỡ ô · chế độ all (tải lại trang)').onChange(reload);
		note(fg, this.loadMode === 'modules' ? 'Chế độ <b>modules</b>: mỗi module 16 m là một ô (cài đặt cỡ ô bên trên chỉ áp dụng cho chế độ <b>all</b>).' : '');
		this.instancingEl = note(fg, this.instancingHtml());
		this.groundBlend?.buildControls(folder);
	}

	/** Instances and meshes per set, static pieces → meshes. */
	instancingHtml() {
		const row = (label, root) => {
			if (!root) return '';
			let instances = 0;
			let meshes = 0;
			root.traverse((o) => {
				if (!o.isInstancedMesh) return;
				meshes++;
				instances += o.count;
			});
			return `<div class="wf-row"><b>${label}</b><em>${instances.toLocaleString()} instance · ${meshes} mesh</em></div>`;
		};
		const groups = Object.values(this.groups);
		const pieces = groups.reduce((n, g) => n + (g.userData.pieceCount ?? 0), 0);
		const meshes = groups.reduce((n, g) => n + (g.userData.meshCount ?? 0), 0);
		return `<div class="wf-palette">${row('Cỏ (tuft)', this.grass)}${row('Thẻ cỏ', this.cards)}${row('Bụi', this.shrubCells)}${row('Cây (kit)', this.treeCells)}<div class="wf-row"><b>Đạo cụ tĩnh</b><em>${pieces} mảnh → ${meshes} mesh (theo class × vật liệu × ô)</em></div></div>`;
	}

	/** The map section of the report: the source, seed and size, the zones, the attempts the generator needed (and why it rejected the others), the plan time. */
	mapReportHtml() {
		const info = this.mapInfo;
		const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
		const row = (a, b, c = '') => `<div class="wf-row"><b>${a}</b><span>${b}</span><em>${c}</em></div>`;
		if (info.source === 'demo') return `<h4>Map · plan demo</h4>${row('Plan', esc(info.planId), `DEMO_PLAN làm tay · seed gốc ${info.seed} · ${info.size} m`)}`;
		const g = info.gen;
		const t = this.timing.plan;
		const rejected = g.attempts.filter((a) => a.failed.length);
		const where = t.generateMs !== null ? `generateMap ${t.generateMs.toFixed(0)} ms (nguội)` : `generatePlan ${t.planMs.toFixed(0)} ms (nóng: lần thử đã lưu, từ ${g.source === 'file' ? 'file bake' : 'cache'})`;
		return `<h4>Map · một seed → cả map</h4>
			${row('Seed · cỡ', `${info.seed} · ${info.size} m`, `plan ${esc(info.planId)} · ${esc(g.version)}`)}
			${row('Vùng', `${info.zones.length}`, esc(info.zones.join(', ') || '—'))}
			${row('Lần thử', `<span style="color:${g.ok ? '#8fd070' : '#ff6a5e'}">${g.ok ? 'đạt' : 'KHÔNG đạt'} · lần ${g.attempt + 1}/${g.attempts.length}</span>`, rejected.length ? rejected.map((a) => `lần ${a.attempt + 1} bị loại: ${esc(a.failed.join(', '))}`).join(' · ') : 'lần đầu đạt mọi kiểm tra plan + engine')}
			${row('Thời gian plan', where, '')}`;
	}

	/** The generator's plan checks (checkPlan), next to the engine's: run after the first frames. */
	planChecksHtml() {
		if (this.mapInfo.source !== 'seed') return '';
		const checks = this.planChecks;
		if (!checks) return '<h4>Kiểm tra plan §4.15 · đang chạy…</h4>';
		const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
		const rows = checks.map((c) => `<div class="wf-row" title="${esc(JSON.stringify(c.details ?? '').slice(0, 600))}"><b style="color:${c.pass ? '#8fd070' : '#ff6a5e'}">${c.pass ? '✓' : '✗'} ${esc(c.id)}</b><span></span><em>${esc(c.rule)}${c.details?.violations?.length ? ` — ${c.details.violations.length} vi phạm` : ''}</em></div>`).join('');
		return `<h4>Kiểm tra plan §4.15 · ${checks.filter((c) => c.pass).length}/${checks.length} đạt${this.timing.planChecksMs ? ` (${this.timing.planChecksMs.toFixed(0)} ms)` : ''}</h4>${rows}`;
	}

	/** The report panel: counts, checks, drops (click → camera), warnings, per-step ms, seeds. */
	reportHtml() {
		const r = this.result;
		const rep = r.report;
		const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
		const row = (a, b, c = '') => `<div class="wf-row"><b>${a}</b><span>${b}</span><em>${c}</em></div>`;
		const counts = (o) => Object.entries(o ?? {}).map(([k, v]) => `${k} ${v}`).join(' · ');
		const byClass = {};
		for (const p of r.placements) byClass[p.class] = (byClass[p.class] ?? 0) + 1;
		const passed = rep.checks.filter((c) => c.pass).length;
		const eco = rep.counts.ecology;
		const kindNames = Object.fromEntries(Object.entries(r.ecology.tufts.kinds).map(([name, id]) => [id, name]));
		const kindCounts = Object.fromEntries(Object.entries(eco.byKind ?? {}).map(([id, n]) => [kindNames[id] ?? id, n]));
		const seeds = Object.entries(rep.seeds).map(([k, v]) => `${k} ${v}`).join(' · ');
		const dens = Object.entries(rep.density).map(([k, v]) => `${k} ${v}`).join(' · ');
		const checks = rep.checks.map((c) => `<div class="wf-row" title="${esc(JSON.stringify(c.details ?? '').slice(0, 600))}"><b style="color:${c.pass ? '#8fd070' : '#ff6a5e'}">${c.pass ? '✓' : '✗'} ${esc(c.id)}</b><span></span><em>${esc(c.rule)}${c.details?.violations?.length ? ` — ${c.details.violations.length} vi phạm` : ''}</em></div>`).join('');
		const reasons = {};
		for (const d of rep.drops) (reasons[d.reason] ??= []).push(d);
		const drops = Object.entries(reasons).map(([reason, list]) => `<h4>${esc(reason)} · ${list.length}</h4>${list.map((d) => (Number.isFinite(d.x) ? `<div class="wf-row" data-x="${d.x}" data-z="${d.z}" data-overlay="ovDrops" style="cursor:pointer" title="Bước ${d.step} · ${esc(d.group)} · ${esc(d.item)}"><b>${d.step} · ${esc(d.group)}</b><span></span><em>${esc(d.asset ?? d.item)}${d.detail ? ` — ${esc(d.detail)}` : ''}</em></div>` : '')).join('')}`).join('');
		const warnings = rep.warnings.map((w) => `<div class="wf-row"><b>${esc(w.code ?? 'warn')}</b><span></span><em>${esc(w.message ?? w.id ?? '')}</em></div>`).join('');
		const ms = Object.entries(rep.ms).map(([k, v]) => `${k} ${v}`).join(' · ');
		const ground = this.groundCheck;
		return `<div class="wf-palette">
			${this.mapReportHtml()}
			<h4>Tổng quan</h4>
			${row('Placement', `${r.placements.length}`, counts(byClass))}
			${row('Theo bước', '', counts(Object.fromEntries(Object.entries(rep.counts.step ?? {}).map(([k, v]) => [`bước ${k}`, v]))))}
			${row('Theo nhóm', '', counts(rep.counts.group))}
			${row('Theo vai trò', '', counts(rep.counts.role))}
			${row('Sinh thái', `${eco.tufts} tuft`, `${eco.shrubs} bụi · ${counts(kindCounts)}`)}
			${row('Cluster / trace', `${r.clusters.length} / ${r.events.length}`, `${r.events.filter((e) => e.dropped).length} trace bị bỏ`)}
			${row('Thời gian', `${(this.layoutMs ?? 0).toFixed(0)} ms`, `${this.layoutSource === 'engine' ? '' : `layout lấy từ ${this.layoutSource} (engine lúc tạo: ${rep.ms.total} ms) · `}${ms}`)}
			${row('Seed', '', seeds)}
			${row('Mật độ', '', dens)}
			${row('y trên mặt đất', ground ? `${ground.floating + ground.buried}/${ground.checked}` : '', `lệch > 2 cm so với điểm thấp nhất dưới footprint trừ độ lún (nổi ${ground?.floating ?? 0} · chìm ${ground?.buried ?? 0})`)}
			${this.planChecksHtml()}
			<h4>Kiểm tra engine §4.12 · ${passed}/${rep.checks.length} đạt</h4>${checks}
			${this.moduleReportHtml()}
			<h4>Drops · ${rep.drops.length} (bấm để xem trên map)</h4>${drops || '<p>Không có.</p>'}
			<h4>Cảnh báo · ${rep.warnings.length}</h4>${warnings || '<p>Không có.</p>'}
		</div>`;
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

	dispose() {
		this.disposed = true;
		this.stream?.cancel();
		this.groundBlend?.dispose();
		this.scene.traverse((o) => o.geometry?.dispose());
		for (const stage of this.stagedModules ?? []) stage.root.traverse((o) => o.geometry?.dispose()); // modules still waiting to compile
		this.stagedModules?.clear();
		this.flames?.dispose();
		this.splat?.dispose();
		for (const m of this.kitMaterials?.values() ?? []) m.dispose();
		for (const m of this.wrapped ?? []) m.dispose();
		for (const m of [this.cardBase, this.roadMaterial, this.trailMaterial, this.waterMaterial, this.shrubMaterial, this.grassBase, ...Object.values(this.classMaterials ?? {}), ...Object.values(this.moduleMaterials ?? {})]) m?.dispose();
	}
}

// Act I terrain lab — an open stretch of moor in the spirit of the Blood Moor: rolling ground, a cart road
// with muddy wheel ruts and grass down the middle, a shallow creek that soaks the soil around it, a ford where
// they cross. The ground is one mesh shaded by the terrain splat patch: dry dirt → wet dirt → grass, blended by
// layer height (env/terrain.js, shaders/effects/terrain.glsl). The splat is generated from the landscape and
// can be painted with a brush in the viewport (Environment tab → Brush).
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { act1Materials } from '../env/materials.js';
import { FlameField } from '../env/flames.js';
import { TerrainSplat, createTerrainMaterial, loadPaintedSets, loadRibbonTextures, loadGrassCards, grassCardGeometry, proceduralSets, TERRAIN_SETS, BRUSH_LAYERS } from '../env/terrain.js';
import { GRAVEYARD_TIMES } from './graveyard.js';
import * as kit from '../env/kit.js';

registerDefaults('terrain', {
	look: 0, // < LOOK: saved settings from an older look get the current defaults once (see init)
	layerSet: 'moor',
	time: 'nightCamp',
	// Ribbon meshes of sets that have them (TERRAIN_SETS[].ribbons): wheel-rutted road, creek water surface.
	roadRuts: true,
	rutsOpacity: 1,
	creekWater: true,
	waterLevel: 0.3,
	waterOpacity: 0.7,
	waterFlow: 0.12,
	grassDensity: 1,
	wind: 0.25,
	tileDirt: 3.2,
	tileWet: 4,
	tileGrass: 3,
	softness: 0.24,
	heightBlend: 0.45,
	variation: 1,
	macro: 0.3,
	edgeNoise: 0.5,
	splatBlur: 3,
	waterRough: 0.22,
	water: 0.14,
	damp: 0.25,
	ao: 0.6,
	// Grass mat relief: contact shadow around / under its edge, lift in the height blend, blade height for the
	// shadow cast away from the key light (m), 3D grass cards along the grass edges (sets with cards).
	grassShadow: 0.6,
	grassLift: 0.08,
	grassBlade: 0.18,
	edgeCards: 1,
	showWeights: false,
	paint: false,
	// Shadow fill on the scene's assets (shaders/effects/shadow_fill.glsl): dark areas keep a tinted share of their albedo.
	// Cast-shadow strength of the moon and the campfire (LightShadow.intensity: 1 = black shadows, 0 = none).
	shadowStrength: 0.55,
	fill: true,
	fillStrength: 1.4,
	fillColor: '#4c6a5c',
	fillThreshold: 0.08,
	brushLayer: 'grass',
	brushRadius: 2.5,
	brushStrength: 0.35,
	brushHardness: 0.35,
	brushNoise: 0.5,
});

const SIZE = 120;
const LOOK = 9;

// Time-of-day presets: the graveyard's, plus the look of the moor concept sheet — a dim, neutral dusk where the
// campfire's warm pool is the brightest thing on screen (sky/ground = hemisphere colours, fire = light scale).
// Painted textures carry their own shading, so the ambient lights them close to 1:1 and reflections stay low.
export const TERRAIN_TIMES = {
	// After Diablo II: Resurrected's Rogue Encampment at night: a cool, slightly green moon as the key (soft shadows
	// falling screen-left), almost no ambient, the player's light radius as the brightest cool area, small warm
	// torch pools, a thin dark haze and a heavy, contrasty grade with crushed blacks and a strong vignette.
	nightCamp: {
		label: 'Night camp · D2R look', moonK: 7800, moon: 3.6, sunElev: 46, sunAz: -46, hemi: 1.5, sky: '#4a6e60', ground: '#2a2418',
		env: 'hdri-night', envI: 0.06, bgI: 0.0, exposure: -0.6, fire: 0.45, fireDistance: 11, torches: 1, sun: 0.1,
		hero: { color: '#cfd8d6', intensity: 28, distance: 12, decay: 1.3, height: 3.2 },
		fog: { color: '#26312c', density: 0.035, falloff: 0.3, start: 12, inscatter: 0.15 }, // dark green-grey: the distance fades, it does not go black
		// Tuned against the reference by numbers: median luminance ~0.12, edge/centre ~0.6, neutral-green average (R ~ G).
		grade: { vignette: 0.7, contrast: 1.05, saturation: 1.0, lift: -0.006, temperature: -0.12, tint: -0.1 },
	},
	campfire: {
		label: 'Campfire dusk · concept look', moonK: 6200, moon: 0.6, sunElev: 38, sunAz: -130, hemi: 1.1, sky: '#c4c8b8', ground: '#5a4634',
		env: 'hdri-overcast', envI: 0.08, bgI: 0.04, exposure: 0.5, fire: 2.2, fireDistance: 22,
		// Low mist hugging the moor: dense at the ground, gone a few metres up (falloff), so the play area stays
		// readable and the distance sinks into a dark warm murk; the vignette closes the frame around the fire.
		fog: { color: '#2a2723', density: 0.11, falloff: 0.42, start: 5, inscatter: 0.3 },
		grade: { vignette: 0.7 },
	},
	...GRAVEYARD_TIMES,
};
const BRUSH_COLORS = { dirt: 0xd09a5c, wet: 0x5aa0ff, grass: 0x8fd060 };
const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

export class TerrainScene {
	constructor(app) {
		this.app = app;
		this.id = 'terrain';
		this.label = 'Act I · Moor terrain (splat layers)';
		this.moodKind = 'exterior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'Moor terrain';
		this.settings = app.settings.adopt('terrain');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group();
		this.vfx.name = 'Terrain VFX';
		// Game-camera framing of the concept: campfire left of centre, the muddy road crossing the frame on the right.
		this.home = { position: new THREE.Vector3(14, 15, 21), target: new THREE.Vector3(5.5, 0, 4) };
		this.sun = { direction: new THREE.Vector3(), color: new THREE.Color() };
		this.lights = [];
		this.postDefaults = null;
		const curve = (pts) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))).getSpacedPoints(160);
		this.road = curve([[-66, 20], [-34, 12], [-10, 5], [10, -3], [34, -15], [66, -22]]);
		this.creek = curve([[-30, -66], [-18, -36], [-5, -12], [3, 10], [-1, 36], [-12, 66]]);
		this.roadField = TerrainScene.distanceField(this.road);
		this.creekField = TerrainScene.distanceField(this.creek);
		this.splat = new TerrainSplat({ size: 512, originX: -SIZE / 2, originZ: -SIZE / 2, extent: SIZE });
		this.stroke = null;
	}

	/** Distance (m) to a polyline, precomputed on a 0.5 m grid over the terrain (bilinear lookups are cheap). */
	static distanceField(samples, cell = 0.5) {
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

	static lookup({ field, n, cell }, x, z) {
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
		return TerrainScene.lookup(this.roadField, x, z);
	}

	creekDistance(x, z) {
		return TerrainScene.lookup(this.creekField, x, z);
	}

	height(x, z, road = this.roadDistance(x, z), creek = this.creekDistance(x, z)) {
		let h = kit.noise2(x * 0.03, z * 0.03, 1) * 1.6 + kit.noise2(x * 0.09, z * 0.09, 2) * 0.45 + kit.noise2(x * 0.3, z * 0.3, 4) * 0.06;
		h *= 1 - 0.65 * smooth(28, 8, Math.hypot(x, z)); // calmer ground where the character plays
		h -= 0.6 * (1 - smooth(0.6, 4, creek)); // creek bed
		const r = 1 - smooth(1.6, 4, road);
		h = h * (1 - 0.6 * r) - 0.07 * (1 - smooth(0.8, 1.8, road)); // road is levelled and worn in
		return h;
	}

	/** Generated layer weights: [wet, grass] at world xz. */
	weights(x, z) {
		const road = this.roadDistance(x, z);
		const creek = this.creekDistance(x, z);
		const h = this.height(x, z, road, creek);
		const e = 0.6;
		const slope = Math.hypot(this.height(x + e, z) - this.height(x - e, z), this.height(x, z + e) - this.height(x, z - e)) / (2 * e);
		const big = kit.noise2(x * 0.07, z * 0.07, 11) * 0.5 + 0.5;
		const fine = kit.noise2(x * 0.4, z * 0.4, 12) * 0.5 + 0.5;
		const spots = kit.noise2(x * 0.12, z * 0.12, 13) * 0.5 + 0.5;

		// Wet: around the creek, in low ground, in the wheel ruts, a few soaked patches.
		const creekWet = 1 - smooth(0.8, 4, creek + (fine - 0.5) * 2.2);
		const low = smooth(-0.25, -0.9, h) * 0.85;
		const rut = (1 - smooth(0.12, 0.42, Math.abs(road - 0.75))) * (0.45 + 0.55 * big) * smooth(2.5, 1.0, road);
		const patches = smooth(0.74, 0.86, spots + (fine - 0.5) * 0.2) * 0.8;
		const wet = Math.max(creekWet, low, rut * 0.95, patches);

		// Grass: big patches broken up by fine noise, none on the road (except its middle strip),
		// thin on steeper ground and where the soil is soaked.
		let grass = smooth(0.32, 0.62, big + (fine - 0.5) * 0.4);
		grass = Math.max(grass, 0.35);
		const roadMask = 1 - smooth(1.3, 2.7, road + (fine - 0.5) * 0.9);
		grass *= 1 - roadMask;
		grass = Math.max(grass, (1 - smooth(0.15, 0.45, road)) * (0.55 + 0.45 * smooth(0.3, 0.7, fine))); // middle strip
		grass *= 1 - smooth(0.35, 0.7, slope);
		grass *= 1 - Math.min(1, creekWet + low + patches) * 0.75;
		return [wet, grass];
	}

	async init() {
		this.mat = act1Materials(this.app);
		this.scene.add(this.anchor);
		this.anchor.position.set(4, this.height(4, 8) + 0.02, 8);
		const s = this.settings;
		if (s.look !== LOOK) {
			delete this.app.settings.data.scenePost?.terrain; // saved exposure / fog / vignette of an older look
			Object.assign(s, { look: LOOK, layerSet: 'moor', roadRuts: true, creekWater: true, grassShadow: 0.6, grassLift: 0.08, grassBlade: 0.18, edgeCards: 1, time: 'nightCamp', fill: true, fillStrength: 1.4, fillColor: '#4c6a5c', fillThreshold: 0.08, softness: 0.24, heightBlend: 0.45, variation: 1, macro: 0.3, edgeNoise: 0.5, splatBlur: 3 });
			this.useSetDefaults('moor');
		}
		this.splat.blur = s.splatBlur;
		this.generateSplat();
		await this.buildTerrain();
		await this.buildRibbons();
		this.kits = await this.loadKits();
		this.buildProps();
		await this.loadCards();
		this.buildGrass();
		this.buildShrubs();
		this.buildLights();
		this.buildCursor();
		this.windGrass = this.app.backend.effects.create('wind', { strength: this.settings.wind, height: 1, frequency: 1.9 });
		this.windTrees = this.app.backend.effects.create('wind', { strength: this.settings.wind * 0.35, height: 6, frequency: 0.9, gust: 0.8 });
		this.windShrubs = this.app.backend.effects.create('wind', { strength: this.settings.wind * 0.6, height: 1.2, frequency: 1.4, gust: 0.6 });
		this.grass.material = this.windGrass.apply(this.grass.material);
		this.treeMaterial = this.windTrees.apply(this.treeMaterial);
		if (this.shrubs.length) {
			const material = this.windShrubs.apply(this.shrubs[0].material);
			for (const s of this.shrubs) s.material = material;
		}
		for (const t of this.trees) t.material = this.treeMaterial;
		this.shadowFill = this.app.backend.effects.createShadowFill();
		this.applyFill();
		this.buildCards();
		this.applyLayerSettings();
		await this.applyTime();
	}

	generateSplat() {
		this.splat.fill((x, z) => this.weights(x, z));
	}

	/** Layer sets for 'painted' | 'procedural' (painted falls back to procedural if its images fail to load). */
	async layerSets(id) {
		if (TERRAIN_SETS[id]?.prefix) {
			try {
				return await loadPaintedSets(this.app, id);
			} catch (error) {
				console.error('Painted terrain textures failed to load, using the procedural set', error);
			}
		}
		return proceduralSets(this.app);
	}

	useSetDefaults(id) {
		const set = TERRAIN_SETS[id];
		[this.settings.tileDirt, this.settings.tileWet, this.settings.tileGrass] = set.tiles;
		this.settings.water = set.water;
		this.settings.waterRough = set.waterRough;
	}

	async setLayerSet(id) {
		this.settings.layerSet = id;
		this.useSetDefaults(id);
		this.terrain.setLayers(await this.layerSets(id));
		await this.buildRibbons();
		await this.loadCards();
		this.applyLayerSettings();
		this.rebuildGrass();
		this.app.settings.changed('terrain');
	}

	async buildTerrain() {
		const segs = 200;
		const g = new THREE.PlaneGeometry(SIZE, SIZE, segs, segs);
		g.rotateX(-Math.PI / 2);
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) pos.setY(i, this.height(pos.getX(i), pos.getZ(i)));
		g.computeVertexNormals();
		const { material, effect } = createTerrainMaterial(this.app, this.splat, await this.layerSets(this.settings.layerSet));
		this.terrain = effect;
		const ground = new THREE.Mesh(g, material);
		ground.name = 'Terrain (splat)';
		ground.receiveShadow = true;
		this.ground = ground;
		this.scene.add(ground);
	}

	/**
	 * Strip mesh along a curve: `across` vertices per sample, u = 0..1 across, v = metres along / tile.
	 * y(x, z, centre) gives each vertex height; optional alpha(x, z) → per-vertex opacity (RGBA vertex colour).
	 */
	ribbon(points, width, tile, y, across = 9, alpha = null) {
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
					index.push(c - across - 1, c - across, c - 1, c - across, c, c - 1); // counter-clockwise from above (+y normals)
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
	}

	/** Road ruts and creek water ribbons of the current texture set (removed for sets without them). */
	async buildRibbons() {
		for (const m of [this.roadMesh, this.waterMesh]) {
			if (!m) continue;
			this.scene.remove(m);
			m.geometry.dispose();
		}
		this.roadMesh = this.waterMesh = null;
		const prefix = TERRAIN_SETS[this.settings.layerSet]?.ribbons;
		if (!prefix) return;
		let tex;
		try {
			tex = await loadRibbonTextures(this.app, prefix);
		} catch (error) {
			console.error(`Ribbon textures "${prefix}" failed to load; road and creek stay splat-only`, error);
			return;
		}
		this.roadMaterial ??= new THREE.MeshStandardMaterial({ name: 'Road ruts (ribbon)', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.78, metalness: 0 });
		Object.assign(this.roadMaterial, { map: tex.ruts.map, normalMap: tex.ruts.normalMap });
		this.roadMaterial.needsUpdate = true;
		const road = new THREE.Mesh(this.ribbon(this.road, 4, 6.7, (x, z) => this.height(x, z) + 0.025), this.roadMaterial);
		road.name = 'Road ruts (ribbon)';
		road.receiveShadow = true;
		road.renderOrder = 1;
		this.roadMesh = road;
		this.scene.add(road);

		this.waterMaterial ??= new THREE.MeshStandardMaterial({ name: 'Creek water (ribbon)', vertexColors: true, transparent: true, depthWrite: false, roughness: 0.08, metalness: 0, envMapIntensity: 1.5 });
		Object.assign(this.waterMaterial, { map: tex.water.map, alphaMap: tex.water.alphaMap });
		this.waterMaterial.needsUpdate = true;
		// The creek runs dry (wet mud only) through the play area around the subject anchor and the camp.
		const dry = (x, z) => smooth(4.5, 9, Math.hypot(x - this.anchor.position.x, z - this.anchor.position.z));
		const water = new THREE.Mesh(this.ribbon(this.creek, 6, 5, (x, z, c) => this.height(c.x, c.z) + this.settings.waterLevel, 5, dry), this.waterMaterial);
		water.name = 'Creek water (ribbon)';
		water.receiveShadow = true;
		water.renderOrder = 2;
		this.waterMesh = water;
		this.scene.add(water);
		if (this.shadowFill) road.material = this.shadowFill.apply(road.material);
		this.applyRibbonSettings();
	}

	applyRibbonSettings() {
		const s = this.settings;
		if (this.roadMesh) {
			this.roadMesh.visible = s.roadRuts;
			this.roadMesh.material.opacity = s.rutsOpacity;
		}
		if (this.waterMesh) {
			this.waterMesh.visible = s.creekWater;
			this.waterMaterial.opacity = s.waterOpacity;
		}
	}

	/** Prop kits split from the project's prop sheets (scripts/prepare-prop-kit.py): { fence, palisade, tents, shrubs } → { name: Mesh }. */
	async loadKits() {
		const kits = {};
		for (const [key, id] of [['fence', 'kit-wooden-fence'], ['palisade', 'kit-palisade'], ['tents', 'kit-tents'], ['shrubs', 'kit-shrubs']]) {
			try {
				const gltf = await this.app.loader.loadLibrary(id);
				const pieces = {};
				gltf.scene.traverse((o) => {
					if (o.isMesh) pieces[o.name.replace(/^[a-z]+_\d+_/, '')] = o; // "fence_04_run_sag" → "run_sag"
				});
				for (const mesh of Object.values(pieces)) mesh.geometry.computeBoundingBox();
				kits[key] = pieces;
			} catch (error) {
				console.error(`Prop kit "${id}" failed to load; the scene goes without it (fences fall back to procedural ones)`, error);
			}
		}
		return kits;
	}

	/** Add a kit piece (pivot at its bottom centre, length along +x) at world xz, turned by yaw, settled into the ground. */
	addKitPiece(batch, mesh, x, z, yaw, sink = 0.06) {
		const y = Math.min(this.height(x, z), ...[-0.5, 0.5].map((t) => {
			const len = mesh.geometry.boundingBox.max.x * 2 * t;
			return this.height(x + Math.cos(yaw) * len, z - Math.sin(yaw) * len);
		}));
		batch.add(mesh.geometry, mesh.material, { position: [x, y - sink, z], rotation: [0, yaw, 0], uv: 'keep' });
	}

	buildProps() {
		const m = this.mat;
		const batch = new kit.StaticBatch('Moor props');
		this.rockMaterial ??= m.weathered.clone();
		this.rockMaterial.color.setScalar(0.45); // boulders sit in the ground value range, not brighter
		this.rockMaterial.name = 'Moor rock';
		const r = kit.rng(4242);
		this.fire = new THREE.Vector3(8, this.height(8, 7), 7);
		const kits = this.kits ?? {};
		this.tentSpots = kits.tents ? this.planTents(kits.tents) : [];
		const nearTent = (x, z, pad) => this.tentSpots.some((t) => Math.hypot(t.x - x, t.z - z) < t.radius + pad);

		// Boulders, half sunk, kept off the road and out of the creek.
		for (let i = 0, placed = 0; i < 120 && placed < 34; i++) {
			const x = (r() - 0.5) * SIZE * 0.85;
			const z = (r() - 0.5) * SIZE * 0.85;
			if (this.roadDistance(x, z) < 3 || this.creekDistance(x, z) < 2 || Math.hypot(x - 4, z - 8) < 5 || nearTent(x, z, 1.5)) continue;
			const s = 0.2 + r() ** 2 * 1.2;
			batch.add(kit.rock({ radius: s, seed: i * 2.9, squash: 0.5 + r() * 0.3 }), this.rockMaterial, { position: [x, this.height(x, z) - s * 0.25, z], rotation: [0, r() * 6, 0] });
			placed++;
		}
		// Stepping stones across the ford.
		for (let i = 0; i < 6; i++) {
			const t = (i - 2.5) * 0.95;
			const x = -1.6 + t * 0.9;
			const z = 3.6 + t * 0.45;
			batch.add(kit.rock({ radius: 0.32 + r() * 0.12, seed: 70 + i, squash: 0.45 }), this.rockMaterial, { position: [x, this.height(x, z) + 0.02, z], rotation: [0, r() * 6, 0] });
		}
		for (const t of this.tentSpots) this.addKitPiece(batch, t.mesh, t.x, t.z, t.yaw, 0.08);
		if (kits.palisade) this.buildPalisade(batch, kits.palisade, r);
		if (kits.fence) this.buildKitFence(batch, kits.fence, r);
		// Procedural fallback: broken wooden fence along the north side of the road.
		const fence = [];
		for (let k = 0; k < this.road.length && !kits.fence; k += 3) {
			const p = this.road[k];
			const q = this.road[Math.min(k + 1, this.road.length - 1)];
			const dir = new THREE.Vector3().subVectors(q, p).normalize();
			const side = new THREE.Vector3(dir.z, 0, -dir.x);
			const x = p.x + side.x * 3.6;
			const z = p.z + side.z * 3.6;
			if (Math.abs(x) > 40 || this.creekDistance(x, z) < 3) continue;
			fence.push({ x, z, lean: (r() - 0.5) * 0.25 });
		}
		fence.forEach((f, i) => {
			const y = this.height(f.x, f.z);
			if (r() < 0.15) return; // missing post
			batch.add(kit.woodenPost({ height: 1.15 + r() * 0.2, size: 0.11 }), m.wood, { position: [f.x, y - 0.1, f.z], rotation: [f.lean, 0, f.lean * 0.5] });
			const next = fence[i + 1];
			if (!next || r() < 0.3) return; // broken rail
			const len = Math.hypot(next.x - f.x, next.z - f.z);
			if (len > 4) return;
			const mid = [(f.x + next.x) / 2, (y + this.height(next.x, next.z)) / 2 + 0.75, (f.z + next.z) / 2];
			batch.add(kit.log({ length: len, radius: 0.05 }), m.wood, { position: mid, rotation: [0, Math.atan2(f.z - next.z, next.x - f.x), 0] }); // log runs along x
		});
		// Tripod torches around the camp (lights are added in buildLights).
		this.torchSpots = [];
		for (const [x, z] of [[2.9, 3.4], [14.3, 6.4], [5.5, 12.6], [12.6, 13.2]]) {
			const y = this.height(x, z);
			for (let k = 0; k < 3; k++) {
				const a = (k / 3) * Math.PI * 2 + x;
				batch.add(kit.woodenPost({ height: 1.75, size: 0.07 }), m.wood, {
					position: [x + Math.cos(a) * 0.28, y - 0.05, z + Math.sin(a) * 0.28],
					rotation: [-Math.sin(a) * 0.16, 0, Math.cos(a) * 0.16], // tops lean in (0.16 rad x 1.75 m = the 0.28 m foot offset)
				});
			}
			batch.add(kit.torchCup({ radius: 0.12, height: 0.16 }), m.iron, { position: [x, y + 1.62, z], castShadow: false });
			this.torchSpots.push(new THREE.Vector3(x, y + 1.76, z));
		}
		// Campfire near the ford: the warm light radius against the grey moor.
		for (let i = 0; i < 9; i++) {
			const a = (i / 9) * Math.PI * 2;
			batch.add(kit.rock({ radius: 0.22, seed: 50 + i, squash: 0.7 }), this.rockMaterial, { position: [this.fire.x + Math.cos(a) * 0.75, this.fire.y, this.fire.z + Math.sin(a) * 0.75], rotation: [0, a, 0], castShadow: false }); // no spoke shadows from the fire light
		}
		for (let i = 0; i < 4; i++) {
			const a = (i / 4) * Math.PI + 0.3;
			batch.add(kit.log({ length: 1.0, radius: 0.08 }), m.bark, { position: [this.fire.x, this.fire.y + 0.1 + i * 0.03, this.fire.z], rotation: [0.2, a, 0.15], castShadow: false });
		}
		this.staticGroup = batch.build(true);
		this.scene.add(this.staticGroup);

		const embers = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), m.ember);
		embers.rotation.x = -Math.PI / 2;
		embers.position.copy(this.fire).add(new THREE.Vector3(0, 0.06, 0));
		this.scene.add(embers);

		this.trees = [];
		this.treeMaterial ??= m.bark.clone();
		for (const [x, z, s] of [[-12, 14, 1.1], [16, 4, 0.9], [-20, -10, 1.3], [22, 24, 1], [-6, -24, 1.2], [30, -30, 1.1]]) {
			const tree = new THREE.Mesh(kit.worldUV(kit.deadTree({ seed: Math.round(x * 7 + z), height: 4.5 * s })), this.treeMaterial);
			tree.position.set(x, this.height(x, z) - 0.05, z);
			tree.rotation.y = x + z;
			tree.castShadow = true;
			tree.receiveShadow = true;
			tree.name = 'Dead tree';
			this.trees.push(tree);
			this.scene.add(tree);
		}
	}

	/** Fence pieces chained along the north side of the road: mostly whole runs, some broken or fallen, a few gaps. */
	buildKitFence(batch, pieces, r) {
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
		const runs = ['run2', 'run_end', 'rails_post', 'run_sag', 'corner_low', 'post_rails_long'].filter((n) => pieces[n]);
		const broken = ['run_broken', 'run_fallen', 'broken_pair', 'post_lean', 'post_stubs', 'post_short'].filter((n) => pieces[n]);
		if (!runs.length || !broken.length) return;
		let d = 0;
		while (d < cum[cum.length - 1] - 2) {
			const roll = r();
			if (roll < 0.08) {
				d += 1.5 + r() * 2; // gap: a section is missing
				continue;
			}
			const name = (roll < 0.3 ? broken : runs)[Math.floor(r() * (roll < 0.3 ? broken.length : runs.length))];
			const mesh = pieces[name];
			const len = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
			const a = at(d);
			const b = at(d + len);
			const c = a.clone().lerp(b, 0.5);
			d += len - 0.08; // posts overlap a little so runs read as one fence
			if (Math.abs(c.x) > 42 || Math.abs(c.z) > 42 || this.creekDistance(c.x, c.z) < 3 || c.distanceTo(this.fire) < (this.palisadeRadius ?? 0) + 3) continue;
			this.addKitPiece(batch, mesh, c.x, c.z, Math.atan2(a.z - b.z, b.x - a.x) + (r() < 0.5 ? Math.PI : 0));
		}
	}

	/** A Rogue-camp style palisade arc behind the campfire (the side away from the game camera), stakes at its ends. */
	buildPalisade(batch, pieces, r) {
		const R = (this.palisadeRadius = 7.5);
		const walls = ['wall_a', 'wall_b', 'wall_crossbar', 'wall_c', 'wall_braced', 'wall_end'].filter((n) => pieces[n]);
		if (!walls.length) return;
		let angle = THREE.MathUtils.degToRad(222);
		const end = THREE.MathUtils.degToRad(338);
		for (let i = 0; angle < end; i++) {
			const mesh = pieces[walls[i % walls.length]];
			const len = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
			const mid = angle + len / 2 / R;
			const x = this.fire.x + Math.cos(mid) * R;
			const z = this.fire.z + Math.sin(mid) * R;
			// tangent of the arc: +x of the piece follows the circle
			this.addKitPiece(batch, mesh, x, z, Math.atan2(-Math.cos(mid), -Math.sin(mid)), 0.1);
			angle += (len - 0.15) / R;
		}
		if (pieces.stake) {
			for (const deg of [214, 346]) {
				const a = THREE.MathUtils.degToRad(deg);
				this.addKitPiece(batch, pieces.stake, this.fire.x + Math.cos(a) * R, this.fire.z + Math.sin(a) * R, r() * 6, 0.1);
			}
		}
		// A log barrier closing the road west of the ford, a broken wall section left in the grass.
		if (pieces.log_barrier) {
			const p = this.road[Math.floor(this.road.length * 0.3)];
			const q = this.road[Math.floor(this.road.length * 0.3) + 1];
			this.addKitPiece(batch, pieces.log_barrier, p.x, p.z, Math.atan2(-(q.z - p.z), q.x - p.x) + Math.PI / 2, 0.05); // across the road
		}
		if (pieces.wall_broken) this.addKitPiece(batch, pieces.wall_broken, -18, 16, 0.6, 0.15);
	}

	/**
	 * Where the tents go: two small ones inside the palisade arc, facing the fire, the larger ones in a loose camp
	 * on both flanks of the game camera (not between it and the fire). Each tent takes the free spot nearest to its
	 * target: clear of the road and its fence, the creek, the palisade, torches, trees and the other tents.
	 */
	planTents(pieces) {
		const R = 7.5; // palisade radius (buildPalisade)
		const f = this.fire;
		const plan = [
			// [piece, target x, z, inside the palisade]
			['ridge', f.x + Math.cos(4.4) * 4.9, f.z + Math.sin(4.4) * 4.9, true],
			['a_frame', f.x + Math.cos(5.24) * 4.9, f.z + Math.sin(5.24) * 4.9, true],
			['pavilion', 23, 3],
			['sagging', 31, 16],
			['pup', 25, 9],
			['market_stall', -7, 15],
			['lean_to', -11, 10],
			['tattered', -4, 22],
		];
		const keepOut = [
			...[[2.9, 3.4], [14.3, 6.4], [5.5, 12.6], [12.6, 13.2]].map(([x, z]) => ({ x, z, radius: 0.6 })), // torches
			...[[-12, 14], [16, 4], [-20, -10], [22, 24], [-6, -24], [30, -30]].map(([x, z]) => ({ x, z, radius: 1 })), // dead trees
			{ x: 4, z: 8, radius: 2.5 }, // subject anchor
		];
		const spots = [];
		for (const [name, tx, tz, inside] of plan) {
			const mesh = pieces[name];
			if (!mesh) continue;
			const box = mesh.geometry.boundingBox;
			const radius = Math.hypot(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
			const ok = (x, z) => {
				const toFire = Math.hypot(x - f.x, z - f.z);
				if (inside ? toFire < 2.6 + radius * 0.5 || toFire > R - radius * 0.45 : toFire < R + radius + 1.5) return false;
				// The fence runs 3.6 m off the road; inside the arc the palisade already stands between tent and road.
				if ((!inside && this.roadDistance(x, z) < radius + 5.5) || this.creekDistance(x, z) < radius + 1.5) return false;
				return [...keepOut, ...spots].every((o) => Math.hypot(o.x - x, o.z - z) > o.radius + (inside ? radius * 0.6 + 0.3 : radius + 1));
			};
			let best = null;
			for (let dz = -8; dz <= 8; dz += 0.5) {
				for (let dx = -8; dx <= 8; dx += 0.5) {
					const d = dx * dx + dz * dz;
					if ((!best || d < best.d) && ok(tx + dx, tz + dz)) best = { x: tx + dx, z: tz + dz, d };
				}
			}
			if (!best) continue;
			// Long side towards the fire (inside the arc, like the palisade walls) or turned a little off it (camp).
			const a = Math.atan2(best.z - f.z, best.x - f.x);
			const yaw = Math.atan2(-Math.cos(a), -Math.sin(a)) + (inside ? 0 : ((spots.length % 3) - 1) * 0.35);
			spots.push({ mesh, x: best.x, z: best.z, yaw, radius: inside ? radius * 0.6 : radius });
		}
		return spots;
	}

	/**
	 * Shrubs from the shrub kit, one wind-swayed instanced mesh per variant: sparse on grass, dense on the creek
	 * banks, along the fence line and at the foot of the tents; never on the road, by the fire or on the subject.
	 */
	buildShrubs() {
		this.shrubs = [];
		const pieces = Object.values(this.kits?.shrubs ?? {});
		if (!pieces.length) return;
		const material = pieces[0].material.clone();
		material.side = THREE.DoubleSide; // single-sided leaf cards
		material.color.multiplyScalar(0.85); // sit in the moor's value range under the night grade
		material.name = 'Moor shrubs';
		const r = kit.rng(913);
		const spots = pieces.map(() => []);
		const max = Math.round(260 * (this.settings.grassDensity ?? 1));
		const torches = this.torchSpots ?? [];
		const tents = this.tentSpots ?? [];
		for (let i = 0, n = 0; i < max * 12 && n < max; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 46;
			const x = Math.cos(a) * d + 4;
			const z = Math.sin(a) * d + 4;
			const road = this.roadDistance(x, z);
			const creek = this.creekDistance(x, z);
			if (road < 2.6 || creek < 1.1 || Math.hypot(x - this.fire.x, z - this.fire.z) < 3.2 || Math.hypot(x - 4, z - 8) < 2.2) continue;
			if (torches.some((t) => Math.hypot(t.x - x, t.z - z) < 1)) continue;
			const tent = tents.reduce((m, t) => Math.min(m, Math.hypot(t.x - x, t.z - z) - t.radius), Infinity);
			if (tent < 0) continue;
			const { grass, wet } = this.splat.sample(x, z);
			const edge = Math.max(smooth(3, 1.1, creek), smooth(5.5, 3.6, road) * smooth(2.6, 3.6, road), smooth(2.5, 0, tent));
			const chance = Math.max(smooth(0.4, 0.95, grass) * 0.35, edge * 0.8) * (1 - wet * 0.5);
			if (r() > chance) continue;
			const s = (0.6 + r() * 0.5) * (0.8 + 0.4 * grass);
			spots[Math.floor(r() * pieces.length)].push({ x, z, s, yaw: r() * Math.PI * 2 });
			n++;
		}
		const dummy = new THREE.Object3D();
		pieces.forEach((piece, k) => {
			if (!spots[k].length) return;
			const mesh = new THREE.InstancedMesh(piece.geometry, material, spots[k].length);
			mesh.name = `Moor shrubs · ${piece.name}`;
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

	/** Grass tufts only where the splat says grass (rebuilt after every brush stroke). */
	buildGrass() {
		const look = TERRAIN_SETS[this.settings.layerSet] ?? TERRAIN_SETS.procedural;
		const max = Math.round(9000 * this.settings.grassDensity * look.tufts);
		const material = this.mat.grassBlade.clone();
		material.vertexColors = true;
		const mesh = new THREE.InstancedMesh(kit.grassTuft({ blades: 7, seed: 8 }), material, Math.max(1, max));
		mesh.name = 'Moor grass tufts (instanced)';
		const r = kit.rng(77);
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		let n = 0;
		for (let i = 0; i < max * 4 && n < max; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 46;
			const x = Math.cos(a) * d + 2;
			const z = Math.sin(a) * d + 4;
			const { grass, wet } = this.splat.sample(x, z);
			const chance = smooth(0.35, 0.9, grass) * (1 - wet * 0.6);
			if (r() > chance) continue;
			dummy.position.set(x, this.height(x, z) - 0.02, z);
			dummy.rotation.set((r() - 0.5) * 0.3, r() * Math.PI * 2, (r() - 0.5) * 0.3);
			const h = (0.18 + r() * 0.32) * (0.5 + 0.6 * grass);
			const w = 0.8 + r() * 0.6;
			dummy.scale.set(w, h, w);
			dummy.updateMatrix();
			mesh.setMatrixAt(n, dummy.matrix);
			// Same palette as the grass layer: olive-grey #3E4638 … straw #6F6F5C, darker roots from the tuft.
			const dry = r() ** 1.5;
			color.setRGB(...look.tuftColor.map((c) => c[0] + dry * c[1])).multiplyScalar(0.85 + r() * 0.3);
			mesh.setColorAt(n, color);
			n++;
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
		this.grass.geometry.dispose();
		this.grass.dispose?.();
		this.buildGrass();
		this.grass.material = this.windGrass.apply(this.grass.material);
		if (this.shadowFill) this.grass.material = this.shadowFill.apply(this.grass.material);
		this.app.backend.prepareObject(this.grass);
		this.buildCards();
		if (this.cards) this.app.backend.prepareObject(this.cards);
		this.app.mood?.onSceneRebuilt(this);
	}

	async loadCards() {
		const id = TERRAIN_SETS[this.settings.layerSet]?.cards;
		try {
			this.cardTexture = id ? await loadGrassCards(this.app, id) : null;
		} catch (error) {
			console.error(`Grass cards "${id}" failed to load; the grass edges stay flat`, error);
			this.cardTexture = null;
		}
	}

	/**
	 * 3D grass tufts (alpha-cut cards from the set's atlas) where grass meets soil, a few inside the grass: they
	 * break the flat edge of the grass layer and stand above the ground like the clumps in D2R. One instanced
	 * mesh per atlas cell; wind and shadow fill as on the blade tufts.
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
		const count = Math.round(5000 * this.settings.edgeCards);
		if (!this.cardTexture || !count) return;
		this.cardBase ??= new THREE.MeshStandardMaterial({ name: 'Grass cards', alphaTest: 0.45, roughness: 0.85, metalness: 0 });
		if (this.cardBase.map !== this.cardTexture) {
			this.cardBase.map = this.cardTexture;
			this.cardBase.needsUpdate = true;
		}
		let material = this.cardBase;
		if (this.windGrass) material = this.windGrass.apply(material);
		if (this.shadowFill) material = this.shadowFill.apply(material);
		const r = kit.rng(313);
		const spots = [[], [], [], []];
		for (let i = 0, n = 0; i < count * 12 && n < count; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 46;
			const x = Math.cos(a) * d + 2;
			const z = Math.sin(a) * d + 4;
			if (this.roadDistance(x, z) < 2.1 || Math.hypot(x - this.fire.x, z - this.fire.z) < 1.6) continue;
			const { grass, wet } = this.splat.sample(x, z);
			const edge = Math.min(1, 4 * grass * (1 - grass));
			const chance = (edge * 0.9 + smooth(0.6, 1, grass) * 0.1) * (1 - smooth(0.4, 0.8, wet));
			if (r() > chance) continue;
			const h = 0.32 + r() ** 2 * 0.45;
			spots[Math.floor(r() * 4)].push({ x, z, h, w: h * (0.9 + r() * 0.4), yaw: r() * Math.PI, tone: 0.62 + r() * 0.25, dry: r() }); // darker than the atlas: sits in the grass layer's value range
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
				mesh.setColorAt(i, color.setRGB(p.tone * (0.85 + p.dry * 0.15), p.tone, p.tone * 0.85));
			});
			mesh.receiveShadow = true;
			mesh.frustumCulled = false;
			group.add(mesh);
		});
		this.cards = group;
		this.scene.add(group);
	}

	buildLights() {
		this.moon = new THREE.DirectionalLight(0xffffff, 0.3);
		this.moon.name = 'Moon / sun';
		this.moon.castShadow = true;
		this.moon.shadow.mapSize.set(2048, 2048);
		const cam = this.moon.shadow.camera;
		cam.left = cam.bottom = -30;
		cam.right = cam.top = 30;
		cam.near = 1;
		cam.far = 140;
		this.moon.target.position.set(0, 0, 0);
		this.scene.add(this.moon, this.moon.target);
		this.hemi = new THREE.HemisphereLight(0x2a3656, 0x0d0b08, 0.3);
		this.hemi.name = 'Sky / ground ambient';
		this.scene.add(this.hemi);

		this.flames = new FlameField(this.app, 12);
		this.vfx.add(this.flames.mesh);
		const light = new THREE.PointLight(kelvinToColor(1850), 45, 16, 2);
		light.position.copy(this.fire).add(new THREE.Vector3(0, 0.9, 0)); // above the stone ring: a soft pool, not spokes
		light.castShadow = true;
		light.shadow.mapSize.set(512, 512);
		light.shadow.bias = -0.002;
		light.shadow.normalBias = 0.03;
		light.name = 'Campfire light';
		this.scene.add(light);
		this.flames.add(this.fire.clone().add(new THREE.Vector3(0, 0.05, 0)), { light, width: 0.85, height: 1.25, strength: 1.2 });
		this.fireLight = light;
		this.torchLights = (this.torchSpots ?? []).map((p) => {
			const torch = new THREE.PointLight(kelvinToColor(1900), 14, 7.5, 2);
			torch.position.copy(p).add(new THREE.Vector3(0, 0.3, 0));
			// No torch shadows: the terrain shader already samples 10 textures, and each shadow map counts against
			// WebGPU's 16 sampled textures per stage (moon + campfire + environment use the rest).
			torch.castShadow = false;
			torch.name = 'Torch light';
			this.scene.add(torch);
			this.flames.add(p, { light: torch, width: 0.26, height: 0.5, strength: 1 });
			return torch;
		});
		// The player's light radius (Diablo II): a soft cool point light riding above the character.
		this.heroLight = new THREE.PointLight(0xffffff, 0, 9, 1.1);
		this.heroLight.name = 'Player light radius';
		this.heroLight.visible = false;
		this.scene.add(this.heroLight);
		this.lights = [
			{ name: 'Moon / sun', light: this.moon, kelvin: 9000, base: 0.3 },
			{ name: 'Sky ambient', light: this.hemi, base: 0.3 },
		];
	}

	applyRigIntensity() {
		for (const l of this.lights) l.light.intensity = l.base;
	}

	async applyMood(block) {
		this.mood = block;
		this.heroLight.visible = false; // the mood brings its own hero light
		this.fireLight.color.copy(kelvinToColor(block ? block.torches.kelvin : 1850));
		this.flames.lightScale = block?.torches.scale ?? TERRAIN_TIMES[this.settings.time]?.fire ?? 1;
		if (!block) {
			await this.applyTime();
			return;
		}
		const elev = THREE.MathUtils.degToRad(block.moon.elevation);
		const az = THREE.MathUtils.degToRad(block.moon.azimuth);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(60);
		this.moon.color.copy(kelvinToColor(block.moon.kelvin));
		this.lights[0].kelvin = block.moon.kelvin;
		this.lights[0].base = block.moon.lux;
		this.hemi.color.set(block.sky.color);
		this.hemi.groundColor.set(block.sky.ground);
		this.lights[1].base = block.sky.intensity;
		this.applyRigIntensity();
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
		return [this.ground, this.staticGroup, ...this.trees, this.grass, ...this.shrubs, ...(this.cards ? [this.cards] : [])];
	}

	async applyTime() {
		const t = TERRAIN_TIMES[this.settings.time] || TERRAIN_TIMES.campfire;
		const elev = THREE.MathUtils.degToRad(t.sunElev);
		const az = THREE.MathUtils.degToRad(t.sunAz);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(60);
		this.moon.color.copy(kelvinToColor(t.moonK));
		this.lights[0].kelvin = t.moonK;
		this.lights[0].base = t.moon;
		this.lights[1].base = t.hemi;
		this.hemi.color.set(t.sky ?? 0x2a3656);
		this.hemi.groundColor.set(t.ground ?? 0x0d0b08);
		this.applyRigIntensity();
		this.flames.lightScale = t.fire ?? 1;
		this.fireLight.distance = t.fireDistance ?? 16;
		for (const torch of this.torchLights) torch.distance = 7.5 * (t.torches ?? 1);
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
		this.sun.color.copy(this.moon.color).multiplyScalar(t.sun ?? (this.settings.time === 'dusk' ? 0.8 : 0.12));
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		this.scene.environment = env;
		this.scene.background = env;
		this.scene.environmentIntensity = t.envI;
		this.scene.backgroundIntensity = t.bgI;
		this.scene.backgroundBlurriness = 0.08;
		this.postDefaults = { exposure: t.exposure, fog: { enabled: true, height: 0, ...t.fog }, grade: { vignette: 0.35, ...t.grade } };
	}

	/** Shadow fill on every lit asset of the scene (terrain, merged props, trees, grass, shrubs) + its settings. */
	applyFill() {
		this.updateFill();
		const meshes = [this.ground, this.roadMesh, ...this.staticGroup.children, ...this.trees, this.grass].filter((m) => m?.isMesh);
		for (const mesh of meshes) mesh.material = this.shadowFill.apply(mesh.material);
		this.treeMaterial = this.trees[0]?.material ?? this.treeMaterial;
		if (this.shrubs.length) {
			const material = this.shadowFill.apply(this.shrubs[0].material);
			for (const s of this.shrubs) s.material = material;
		}
	}

	/** Settings → uniforms only (no recompile). */
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
		u.tile.value.set(1 / s.tileDirt, 1 / s.tileWet, 1 / s.tileGrass);
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

	/** Splat tap toward the key light: blades of height grassBlade throw their shadow this far (capped at low sun). */
	updateGrassShadow() {
		const d = this.sun.direction;
		const flat = Math.hypot(d.x, d.z);
		const reach = Math.min(0.8, (this.settings.grassBlade * flat) / Math.max(0.15, d.y));
		this.terrain?.uniforms.grassShadowOffset.value.set(flat ? (d.x / flat) * reach : 0, flat ? (d.z / flat) * reach : 0);
	}

	// ---------------------------------------------------------------------------------------------
	// Brush: left drag paints while "Paint" is on (orbit keeps right-drag pan and wheel zoom).

	buildCursor() {
		const pts = [];
		for (let i = 0; i < 64; i++) pts.push(new THREE.Vector3());
		const g = new THREE.BufferGeometry().setFromPoints(pts);
		const ring = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: BRUSH_COLORS.grass, depthTest: false, transparent: true, opacity: 0.9 }));
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
		this.cursor.material.color.setHex(BRUSH_COLORS[s.brushLayer]);
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
			// Dabs spaced along the stroke so speed does not change the coverage.
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
			if (this.settings.paint) this.app.consumedClick = true; // no mesh picking while painting
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
		this.settings.paint = keep; // resume painting when the scene comes back
	}

	update(delta, elapsed) {
		if (this.heroLight.visible) {
			this.app.subject.root.getWorldPosition(this.heroLight.position);
			this.heroLight.position.y += this.heroHeight ?? 3;
		}
		this.flames.update(elapsed);
		if (this.waterMesh?.visible) this.waterMaterial.map.offset.y = (-elapsed * this.settings.waterFlow) % 1;
	}

	// ---------------------------------------------------------------------------------------------
	// Panels

	buildLightingControls(folder, rebuildLights) {
		const s = this.settings;
		if (this.mood) return;
		folder.add(s, 'time', Object.fromEntries(Object.entries(TERRAIN_TIMES).map(([id, t]) => [t.label, id]))).name('Time of day').onChange(async () => {
			this.app.settings.changed('terrain');
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed('terrain');
		const layers = () => (save(), this.applyLayerSettings());

		const fl = folder.addFolder('Terrain layers · dirt → wet dirt → grass');
		fl.add(s, 'layerSet', Object.fromEntries(Object.entries(TERRAIN_SETS).map(([id, t]) => [t.label, id]))).name('Texture set').onChange(async (id) => {
			await this.setLayerSet(id);
			fl.controllersRecursive().forEach((c) => c.updateDisplay());
		});
		fl.add(s, 'showWeights').name('Show layer weights').onChange(layers);
		fl.add(s, 'softness', 0.02, 0.49, 0.01).name('Transition softness').onChange(layers);
		fl.add(s, 'heightBlend', 0, 1.5, 0.01).name('Height-based blend').onChange(layers);
		fl.add(s, 'water', 0, 0.6, 0.01).name('Standing water level').onChange(layers);
		fl.add(s, 'damp', 0, 0.6, 0.01).name('Damp halo around wet').onChange(layers);
		fl.add(s, 'ao', 0, 1, 0.01).name('Texture AO').onChange(layers);
		const fgr = fl.addFolder('Grass relief (raised grass mat)');
		fgr.add(s, 'grassShadow', 0, 1, 0.01).name('Contact shadow around grass').onChange(layers);
		fgr.add(s, 'grassLift', -0.3, 0.6, 0.01).name('Grass over soil (height bias)').onChange(layers);
		fgr.add(s, 'grassBlade', 0, 0.6, 0.01).name('Blade height for cast shadow (m)').onChange(layers);
		fgr.add(s, 'edgeCards', 0, 3, 0.05).name('3D grass along edges').onFinishChange(() => (save(), this.rebuildGrass()));
		fl.add(s, 'waterRough', 0.02, 0.8, 0.01).name('Standing water roughness').onChange(layers);
		const ft = fl.addFolder('Anti-tiling & transitions');
		ft.add(s, 'variation', 0, 1, 0.01).name('Tiling breakup (UV offsets)').onChange(layers);
		ft.add(s, 'macro', 0, 0.8, 0.01).name('Large-scale variation').onChange(layers);
		ft.add(s, 'edgeNoise', 0, 1, 0.01).name('Edge noise').onChange(layers);
		ft.add(s, 'splatBlur', 0, 8, 1).name('Splat smoothing (texels)').onFinishChange(() => (layers(), this.rebuildGrass()));
		fl.add(s, 'tileDirt', 0.5, 12, 0.1).name('Dirt tile (m)').onChange(layers);
		fl.add(s, 'tileWet', 0.5, 12, 0.1).name('Wet dirt tile (m)').onChange(layers);
		fl.add(s, 'tileGrass', 0.5, 12, 0.1).name('Grass tile (m)').onChange(layers);
		const fr = fl.addFolder('Road ruts & creek water (sets with ribbons)');
		const ribbons = () => (save(), this.applyRibbonSettings());
		fr.add(s, 'roadRuts').name('Wheel-rutted road').onChange(ribbons);
		fr.add(s, 'rutsOpacity', 0, 1, 0.01).name('Road opacity').onChange(ribbons);
		fr.add(s, 'creekWater').name('Creek water surface').onChange(ribbons);
		fr.add(s, 'waterOpacity', 0, 1, 0.01).name('Water opacity').onChange(ribbons);
		fr.add(s, 'waterLevel', 0, 0.6, 0.01).name('Water level over bed (m)').onFinishChange(() => (save(), this.buildRibbons()));
		fr.add(s, 'waterFlow', 0, 1, 0.01).name('Flow speed (tiles / s)').onChange(save);

		// Atmosphere: the scene's own exposure / fog / vignette (same values as the Post & camera tab, saved per scene).
		const app = this.app;
		const post = app.settings.data.post;
		const postChanged = () => {
			app.settings.changed('post');
			app.applyPost();
			app.panels?.refresh();
		};
		const fa = folder.addFolder('Atmosphere · fog & vignette');
		fa.add(post.fog, 'enabled').name('Height fog').onChange(postChanged).listen();
		fa.add(post.fog, 'density', 0, 0.3, 0.001).name('Fog density').onChange(postChanged).listen();
		fa.add(post.fog, 'falloff', 0.01, 2, 0.01).name('Fog height falloff').onChange(postChanged).listen();
		fa.add(post.fog, 'height', -2, 6, 0.05).name('Fog base height (m)').onChange(postChanged).listen();
		fa.add(post.fog, 'start', 0, 40, 0.5).name('Fog start (m)').onChange(postChanged).listen();
		fa.add(post.fog, 'inscatter', 0, 3, 0.01).name('Fog sun / moon glow').onChange(postChanged).listen();
		fa.addColor(post.fog, 'color').name('Fog colour').onChange(postChanged).listen();
		fa.add(post.grade, 'vignette', 0, 1.2, 0.01).name('Vignette').onChange(postChanged).listen();
		fa.add(post, 'exposure', -4, 4, 0.05).name('Exposure (EV)').onChange(postChanged).listen();
		const fill = () => (save(), this.updateFill());
		fa.add(s, 'shadowStrength', 0, 1, 0.01).name('Cast shadow strength').onChange(fill);
		fa.add(s, 'fill').name('Shadow fill on assets').onChange(fill);
		fa.add(s, 'fillStrength', 0, 4, 0.01).name('Shadow fill strength').onChange(fill);
		fa.addColor(s, 'fillColor').name('Shadow fill colour').onChange(fill);
		fa.add(s, 'fillThreshold', 0.005, 0.5, 0.005).name('Shadow fill: below luminance').onChange(fill);
		fa.add({ reset: () => app.applyScenePost(this, true) }, 'reset').name('Reset to time-of-day preset');

		const fb = folder.addFolder('Brush (left drag in the viewport)');
		const paint = fb.add(s, 'paint').name('Paint').onChange((v) => (save(), this.setPaint(v)));
		fb.add(s, 'brushLayer', BRUSH_LAYERS).name('Layer').onChange(save);
		fb.add(s, 'brushRadius', 0.3, 12, 0.1).name('Radius (m)').onChange(save);
		fb.add(s, 'brushStrength', 0.02, 1, 0.01).name('Strength').onChange(save);
		fb.add(s, 'brushHardness', 0, 0.95, 0.01).name('Hardness').onChange(save);
		fb.add(s, 'brushNoise', 0, 1, 0.01).name('Edge noise').onChange(save);
		const actions = {
			undo: () => this.splat.undo() && this.rebuildGrass(),
			regenerate: () => (this.splat.pushUndo(), this.generateSplat(), this.rebuildGrass()),
			clear: () => (this.splat.pushUndo(), this.splat.fill(() => [0, 0]), this.rebuildGrass()),
			exportPng: () => {
				const a = document.createElement('a');
				a.download = 'moor_splat_R-wet_G-grass.png';
				a.href = this.splat.toCanvas().toDataURL('image/png');
				a.click();
			},
			importPng: () => {
				const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'image/*' });
				input.onchange = async () => {
					const file = input.files?.[0];
					if (!file) return;
					const bitmap = await createImageBitmap(file);
					this.splat.fromImage(bitmap);
					bitmap.close?.();
					this.rebuildGrass();
				};
				input.click();
			},
		};
		fb.add(actions, 'undo').name('Undo (Ctrl+Z)');
		fb.add(actions, 'regenerate').name('Regenerate from landscape');
		fb.add(actions, 'clear').name('Clear to dry dirt');
		fb.add(actions, 'exportPng').name('Export splat PNG');
		fb.add(actions, 'importPng').name('Import splat PNG');
		this._paintController = paint;

		const fg = folder.addFolder('Grass tufts & wind');
		fg.add(s, 'grassDensity', 0, 3, 0.05).name('Tuft density').onFinishChange(() => (save(), this.rebuildGrass()));
		fg.add(s, 'wind', 0, 1.2, 0.01).name('Wind strength').onChange((v) => {
			save();
			this.windGrass.uniforms.strength.value = v;
			this.windTrees.uniforms.strength.value = v * 0.35;
			this.windShrubs.uniforms.strength.value = v * 0.6;
		});
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

	dispose() {
		this.scene.traverse((o) => o.geometry?.dispose());
		this.flames.dispose();
		this.splat.dispose();
	}
}

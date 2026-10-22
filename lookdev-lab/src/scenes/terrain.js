// Act I terrain base — the shared machinery of the open-ground scenes (Dark Wood, Bố trí biome): the ground is one mesh shaded
// by the terrain splat patch: dry dirt → wet dirt → grass, blended by layer height (env/terrain.js, shaders/effects/terrain.glsl).
// The splat is generated from the landscape and can be painted with a brush in the viewport (Environment tab → Brush).
// A subclass supplies the landscape and the scene: curves(), creekDistance(), height(), weights(), init(), the props, lights,
// time presets, update() and dispose(); the base class has the distance fields, texture sets, ribbon strips, grass tufts / shells,
// shadow fill, mood hook, brush and the Scene options panel.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { shellTexture, createGrassShells } from '../env/grassShells.js';
import { TerrainSplat, createTerrainMaterial, loadPaintedSets, loadGrassCards, proceduralSets, TERRAIN_SETS, BRUSH_LAYERS } from '../env/terrain.js';
import * as kit from '../env/kit.js';
import { classifySplat, applyWater } from '../env/surfaces.js';

/** The terrain scene's settings defaults (the Dark Wood scene starts from the same list). */
export const TERRAIN_DEFAULTS = {
	look: 0, // each subclass compares it with its own LOOK: saved settings from an older look get the current defaults once
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
	variationScale: 0.09,
	rotate: 0,
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
	shells: true, // shell grass: stacked alpha-tested copies of the ground where the grass layer is (env/grassShells.js)
	shellCount: 12,
	shellHeight: 0.18,
	shellCoverage: 0.6,
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
};
registerDefaults('terrain', TERRAIN_DEFAULTS);

const SIZE = 120;

const BRUSH_COLORS = { dirt: 0xd09a5c, wet: 0x5aa0ff, grass: 0x8fd060 };
const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

export class TerrainScene {
	constructor(app, id = 'terrain') {
		this.app = app;
		this.id = id;
		this.label = 'Act I · Moor terrain (splat layers)';
		this.moodKind = 'exterior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'Moor terrain';
		this.settings = app.settings.adopt(id); // the settings section is the scene's id (subclasses pass their own: adopt() replaces the object)
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group();
		this.vfx.name = 'Terrain VFX';
		// Game-camera framing of the concept: campfire left of centre, the muddy road crossing the frame on the right.
		this.home = { position: new THREE.Vector3(14, 15, 21), target: new THREE.Vector3(5.5, 0, 4) };
		this.sun = { direction: new THREE.Vector3(), color: new THREE.Color() };
		this.lights = [];
		this.postDefaults = null;
		const { road, creek } = this.curves();
		this.road = road;
		this.creek = creek;
		this.roadField = TerrainScene.distanceField(this.road);
		this.creekField = creek.length ? TerrainScene.distanceField(creek) : null; // subclasses without a creek skip the field
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

	/**
	 * What the hero stands on at world xz, for footprints / ripples / foliage bend (env/surfaces.js, read by character/footsteps.js): the splat's wet and
	 * grass channels, the path under the point (pathCoverageAt) and open water (waterAt). Precedence: water > path > mud > grass > soil.
	 */
	surfaceAt(x, z, out) {
		classifySplat(out, this.splat.sample(x, z), this.pathCoverageAt(x, z));
		const water = this.waterAt(x, z);
		if (water) applyWater(out, water.depth, water.level);
		return out;
	}

	/** { amount 0..1, surface } of the worn road under xz; subclasses with other paths override. */
	pathCoverageAt(x, z) {
		const c = (this._pathCoverage ??= { amount: 0, surface: 'packed' });
		c.amount = this.roadDistance(x, z) <= 1.3 ? 1 : 0;
		c.surface = 'packed';
		return c;
	}

	/** { depth (m), level (world y of the surface) } when xz is open water, else null; scenes with a creek / pond override. */
	waterAt() {
		return null;
	}

	generateSplat() {
		this.splat.fill((x, z) => this.weights(x, z));
	}

	/** Layer sets for 'painted' | 'procedural' (painted falls back to procedural if its images fail to load). */
	async layerSets(id) {
		if (TERRAIN_SETS[id]?.prefix) {
			try {
				return (this.currentSets = await loadPaintedSets(this.app, id));
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
		this.settings.variationScale = set.variationScale ?? 0.09;
		this.settings.rotate = set.rotate ?? 0;
	}

	async setLayerSet(id) {
		this.settings.layerSet = id;
		this.useSetDefaults(id);
		this.terrain.setLayers(await this.layerSets(id));
		await this.buildRibbons();
		await this.loadCards();
		this.applyLayerSettings();
		this.rebuildGrass();
		this.app.settings.changed(this.id);
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

	applyRibbonSettings() {
		const s = this.settings;
		if (this.roadMesh) {
			this.roadMesh.visible = s.roadRuts;
			this.roadMesh.material.opacity = s.rutsOpacity;
		}
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
		this.buildShells();
		this.app.mood?.onSceneRebuilt(this);
	}

	/** Shell grass over the painted grass layer (sets with CPU-side textures only; rebuilt with the grass). */
	buildShells() {
		if (this.shells) {
			this.scene.remove(this.shells);
			this.shells.dispose();
			this.shells = null;
		}
		const s = this.settings;
		if (!s.shells || !TERRAIN_SETS[s.layerSet]?.prefix || !this.currentSets) return;
		this._shellTextures ??= {};
		const texture = (this._shellTextures[s.layerSet] ??= shellTexture(this.currentSets[2], Math.min(8, this.app.backend.caps.maxAnisotropy || 4)));
		if (!texture) return;
		this.shells = createGrassShells({ geometry: this.ground.geometry, splat: this.splat, texture, tile: s.tileGrass, count: s.shellCount, height: s.shellHeight, coverage: s.shellCoverage });
		if (this.shadowFill) this.shells.children.forEach((m) => (m.material = this.shadowFill.apply(m.material)));
		this.scene.add(this.shells);
		this.app.backend.prepareObject(this.shells);
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

	applyRigIntensity() {
		for (const l of this.lights) l.light.intensity = l.base;
	}

	async applyMood(block) {
		this.mood = block;
		this.heroLight.visible = false; // the mood brings its own hero light
		this.fireLight.color.copy(kelvinToColor(block ? block.torches.kelvin : 1850));
		this.flames.lightScale = block?.torches.scale ?? 1;
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
		u.variationScale.value = s.variationScale ?? 0.09;
		u.rotate.value = s.rotate ?? 0;
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
		this.groundBlend?.activate();
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
		this.groundBlend?.deactivate(); // the act I materials are shared with the other scenes
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

	// ---------------------------------------------------------------------------------------------
	// Panels

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
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
		const shells = () => (save(), this.buildShells());
		fgr.add(s, 'shells').name('Shell grass (raised blades)').onChange(shells);
		fgr.add(s, 'shellCount', 2, 24, 1).name('Shell layers').onFinishChange(shells);
		fgr.add(s, 'shellHeight', 0.02, 0.3, 0.005).name('Shell grass height (m)').onFinishChange(shells);
		fgr.add(s, 'shellCoverage', 0.1, 0.95, 0.01).name('Shell grass cover at the roots').onFinishChange(shells);
		fl.add(s, 'waterRough', 0.02, 0.8, 0.01).name('Standing water roughness').onChange(layers);
		const ft = fl.addFolder('Anti-tiling & transitions');
		ft.add(s, 'variation', 0, 1, 0.01).name('Tiling breakup (UV offsets)').onChange(layers);
		ft.add(s, 'variationScale', 0.02, 0.6, 0.01).name('Breakup areas per metre').onChange(layers);
		ft.add(s, 'rotate', 0, 1, 1).name('Turn variants (quarter turns)').onChange(layers);
		ft.add(s, 'macro', 0, 0.8, 0.01).name('Large-scale variation').onChange(layers);
		ft.add(s, 'edgeNoise', 0, 1, 0.01).name('Edge noise').onChange(layers);
		ft.add(s, 'splatBlur', 0, 8, 1).name('Splat smoothing (texels)').onFinishChange(() => (layers(), this.rebuildGrass()));
		fl.add(s, 'tileDirt', 0.5, 12, 0.1).name('Dirt tile (m)').onChange(layers);
		fl.add(s, 'tileWet', 0.5, 12, 0.1).name('Wet dirt tile (m)').onChange(layers);
		fl.add(s, 'tileGrass', 0.5, 12, 0.1).name('Grass tile (m)').onChange(layers).onFinishChange(() => this.buildShells());
		const fr = fl.addFolder('Road ribbon (sets with ribbons)');
		const ribbons = () => (save(), this.applyRibbonSettings());
		fr.add(s, 'roadRuts').name('Road ribbon').onChange(ribbons);
		fr.add(s, 'rutsOpacity', 0, 1, 0.01).name('Road opacity').onChange(ribbons);

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
		this.groundBlend?.buildControls(folder);
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

}

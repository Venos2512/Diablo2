// ASHLAR · Biome mix: the 31 textures of ashlar/art/textures/terrain-biomes-v1 + the Dark Wood natural ground set (assets/terrain-biomes/, one folder,
// scripts/prepare-terrain-biomes-v1.py) as sample patches: a big natural one (cỏ · đất · cỏ dày · cỏ thưa · đất ẩm gần nước · vũng nước · nước) and a grid of
// small mixes. Every patch has its own LayerSplat (7 layer weights + wetness, filled on the CPU from the viewer's masks: env/biomeMix.js) and its own
// material of the lab's N-layer terrain effect (createTerrainLayers: GLSL + TSL twins, texture arrays shared by all patches). The natural sample adds a basin,
// a pond with a water surface mesh, wet ground and puddles; Dark Wood grass cards stand on the grass layers by density.
// One "Độ mịn" slider drives the mask softness, the splat blur and the effect's softness / height blend / edge noise together.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { loadGrassCards } from '../env/terrain.js';
import { LayerSplat, buildLayerLibrary, createLayerTerrain } from '../env/terrainLayers.js';
import { SAMPLES, GRID, gridCell, layerIds, textureId, normalScale, turnMode, porosity, smoothParams, shaderMask, makeMasks, finalWeights, groundHeight, pondDistance } from '../env/biomeMix.js';
import { biomeMixSurface } from '../env/surfaces.js';
import { note } from '../ui/gui.js';
import { BiomeDecor, rootShaded } from '../env/biomeMixDecor.js';
import { D2_TIMES } from './darkWoodD2.js';
import * as kit from '../env/kit.js';

export const BIOME_MIX_DEFAULTS = {
	look: 7,
	time: 'lookdev',
	smooth: 0.8,
	antiTiling: true,
	variationScale: 0.18,
	macro: 0.12,
	showWeights: false,
	puddles: 0.36,
	wetDarken: 0.45,
	labels: true,
	tufts: true,
	tuftDensity: 1,
	wind: 0.25,
	waterOpacity: 0.92,
	waterFlow: 1,
	blendContrast: 0.65,
	rain: 0,
	decals: 1,
	plants: 1,
	props: true,
	shadows: true,
	subject: false,
};
registerDefaults('biomeMix', BIOME_MIX_DEFAULTS);

const PITCH = THREE.MathUtils.degToRad(55);
const GRASS_CARDS = 'biome-darkwood-grass-cards';
const TUFT_CAPACITY = 4000; // per atlas cell
// Grass cards per layer: tries per m² and the card height range (m). The small Dark Wood samples use the plain grass.
const TUFTS = { DW_grass: { density: 4.2, h: [0.3, 0.64] }, DW_dense: { density: 9, h: [0.36, 0.7] }, DW_sparse: { density: 1.5, h: [0.24, 0.46] } };

// Time presets: a neutral daylight for judging the textures, and the Diablo II moods of the Dark Wood D2 scene (lit from the screen's upper left,
// no hero light, no mist: the patches stay comparable).
const TIMES = {
	lookdev: {
		label: 'Soi texture · ánh sáng ban ngày trung tính', moonK: 5400, moon: 3.4, sunElev: 44, sunAz: -135, hemi: 1.5, sky: '#c9d4e4', ground: '#3b352e',
		env: 'hdri-overcast', envI: 0.25, toneMapping: 'aces', exposure: 0.2, sun: 0.1,
		fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.02, lift: 0, temperature: 0, tint: 0 },
	},
	d2Dusk: { ...D2_TIMES.d2Dusk, label: 'Hoàng hôn (D2, sáng hơn)', sunAz: -135, hero: null, fog: { enabled: false }, exposure: 0.9 },
	d2Night: { ...D2_TIMES.d2Night, label: 'Đêm (D2)', sunAz: -135, moon: 4.2, hero: null, fog: { enabled: false }, exposure: 1.3 },
};

/** A plain image sample as a mipmapped DataTexture, rows flipped so the image top is v = 1. */
async function loadPlain(app, id, colorSpace) {
	const img = await app.loader.loadImageData(id);
	const { width: w, height: h } = img;
	const data = new Uint8Array(w * h * 4);
	for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
	const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: id, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(8, app.backend.caps.maxAnisotropy || 4), colorSpace, needsUpdate: true });
	return tex;
}

/** The ground textures of every sample packed into the layer arrays (once per app). */
async function loadLibrary(app) {
	app._biomeMixLibrary ??= buildLayerLibrary(app, layerIds().map((id) => ({ key: id, file: textureId(id) })));
	return app._biomeMixLibrary;
}

function labelPlane(sample, size) {
	const c = document.createElement('canvas');
	c.width = 768;
	c.height = 128;
	const g = c.getContext('2d');
	g.fillStyle = 'rgba(8, 10, 12, 0.72)';
	g.beginPath();
	g.roundRect(4, 4, 760, 120, 18);
	g.fill();
	g.textAlign = 'center';
	g.fillStyle = '#f1e9d4';
	g.font = '600 46px system-ui, "Segoe UI", sans-serif';
	g.fillText(sample.name, 384, 56, 730);
	g.fillStyle = '#a9b6a4';
	g.font = '34px system-ui, "Segoe UI", sans-serif';
	const ids = [...new Set(sample.layers.map((l) => (l.id.startsWith('DW_') ? `DW ${l.id.slice(3)}` : l.id.replace(/^BIO/, ''))))];
	g.fillText(ids.join(' · '), 384, 102, 730);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	// a plane tilted to face the default camera (a Sprite would break Raycaster calls made without a camera)
	const w = Math.min(size * 0.8, 16);
	const label = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * 128) / 768), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, fog: false, depthWrite: false }));
	label.rotation.x = -PITCH;
	label.renderOrder = 5;
	label.userData.labNoPick = label.userData.labNoView = label.userData.labNoCollide = true;
	return label;
}

export class BiomeMixScene {
	constructor(app) {
		this.app = app;
		this.id = 'biomeMix';
		this.label = 'ASHLAR · Biome mix (31 texture + cỏ Dark Wood)';
		this.moodKind = 'exterior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'ASHLAR biome mix';
		this.settings = app.settings.adopt('biomeMix');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.sun = { direction: new THREE.Vector3(), color: new THREE.Color() };
		this.lights = [];
		this.times = TIMES;
		this.postDefaults = null;
		this.view = 'overview';
		this.home = this.cameraFor('overview');
		this.patches = [];
	}

	/** Orbit camera for the whole grid or one sample patch, the viewer's ARPG pitch (55°) at the rig's fov. */
	cameraFor(view) {
		const { persp } = this.app.rig ?? {};
		const fov = persp?.fov ?? 35;
		const size = this.app.size ?? { w: 16, h: 9 };
		const aspect = size.w / size.h;
		let target = new THREE.Vector3(0, 0, 0);
		let w = GRID.width;
		let d = GRID.depth;
		let margin = 1.03;
		if (view !== 'overview') {
			const c = gridCell(SAMPLES.findIndex((s) => s.id === view));
			target = new THREE.Vector3(c.x, 0, c.z);
			w = d = c.size + 1.5;
			margin = 1.0;
		} else d += 3.2; // the label strip under the last row
		const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
		// width: the near edge is (d / 2) cos(pitch) closer to the camera along the view axis than the target; height: the far / near edges' projections
		const dist = Math.max(w / 2 / (t * aspect) + (d / 2) * Math.cos(PITCH), (d * Math.sin(PITCH)) / (2 * t) + d * Math.cos(PITCH) * 0.5) * margin;
		return { position: new THREE.Vector3(target.x, dist * Math.sin(PITCH), target.z + dist * Math.cos(PITCH)), target, dist };
	}

	/** Frame the grid ('overview') or one sample (its id). */
	frame(view, { shore = false } = {}) {
		const { rig } = this.app;
		this.view = view;
		for (const p of this.patches) p.label.visible = this.settings.labels && view === 'overview';
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		const cam = this.cameraFor(view);
		let { position, target } = cam;
		if (shore && view === 'natural') {
			// close on the pond's shore: the camera low over the south-east bank looking at the water
			const p = this.patches.find((x) => x.sample.id === 'natural');
			target = new THREE.Vector3(p.c.x + p.sample.pond.x + 2, 0, p.c.z + p.sample.pond.z + 1);
			position = target.clone().add(new THREE.Vector3(2.5, 6.5, 9));
			cam.dist = 12;
		}
		rig.lookAt(position, target);
		rig.persp.near = Math.max(0.1, cam.dist / 200);
		rig.persp.far = Math.max(400, cam.dist * 20);
		rig.persp.updateProjectionMatrix();
		this.placeSubject();
	}

	placeSubject() {
		this.anchor.visible = !!this.settings.subject;
		if (!this.settings.subject) return;
		const k = SAMPLES.findIndex((s) => s.id === (this.view === 'overview' ? 'natural' : this.view));
		const c = gridCell(Math.max(0, k));
		this.anchor.position.set(c.x + (k === 0 ? 4 : 0), 0.02, c.z + c.size * 0.2);
	}

	async init() {
		const { app, scene, settings: s } = this;
		scene.add(this.anchor);
		scene.background = new THREE.Color(0x14161a);
		if (s.look !== BIOME_MIX_DEFAULTS.look) {
			Object.assign(s, BIOME_MIX_DEFAULTS);
			delete app.settings.data.scenePost?.[this.id];
		}
		const library = await loadLibrary(app);
		this.library = library;
		this.buildLights();
		this.windGrass = app.backend.effects.create('wind', { strength: s.wind, height: 1, frequency: 1.9 });
		this.group = new THREE.Group();
		this.group.name = 'Sample patches';
		scene.add(this.group);
		const sp = smoothParams(s.smooth);
		this.geometries = new Map();
		SAMPLES.forEach((sample, k) => {
			const c = gridCell(k);
			const splat = new LayerSplat({ size: sample.size > 20 ? 360 : 160, originX: c.x - c.size / 2, originZ: c.z - c.size / 2, extent: c.size });
			splat.setBlurMetres(sp.blurM, sp.blurWetM);
			const { material, effect } = this.makePatchMaterial(sample, splat, library);
			const mesh = new THREE.Mesh(this.patchGeometry(sample, c.size), material);
			mesh.name = `Patch · ${sample.name}`;
			mesh.position.set(c.x, 0, c.z);
			this.group.add(mesh);
			const label = labelPlane(sample, c.size);
			label.position.set(c.x, 0.55, c.z + c.size / 2 + 1.25);
			label.visible = s.labels;
			this.group.add(label);
			this.patches.push({ sample, splat, effect, mesh, label, c, masks: null });
		});
		this.applyEffectSettings();
		this.regenerate();
		await this.buildWater();
		await this.buildTufts();
		await this.buildDecor();
		await this.applyTime();
		this.placeSubject();
	}

	/**
	 * What the hero stands on at world xz (env/surfaces.js, read by character/footsteps.js): the patch under the point, its layer weights from its own splat
	 * (the blend the GPU draws) and the natural sample's pond where the water mesh is. The gaps between patches are no ground.
	 */
	surfaceAt(x, z, out) {
		this._surfaceDeps ??= { shaderMask, finalWeights, groundHeight, pondDistance: (...a) => (this.water ? pondDistance(...a) : 1) };
		return biomeMixSurface(out, this.patches, smoothParams(this.settings.smooth), x, z, this._surfaceDeps);
	}

	/** Flat square, or — for a sample with a pond — a fine grid with the basin's heights. */
	patchGeometry(sample, size) {
		const segs = sample.pond ? Math.round(size / 0.2) : 1;
		const g = new THREE.PlaneGeometry(size, size, segs, segs);
		g.rotateX(-Math.PI / 2);
		if (sample.pond) {
			const pos = g.attributes.position;
			for (let i = 0; i < pos.count; i++) pos.setY(i, groundHeight(sample, pos.getX(i), pos.getZ(i)));
			g.computeVertexNormals();
		}
		this.geometries.set(sample.id, g);
		return g;
	}

	// ---- material, splat, effect settings --------------------------------------------------------------------------------------------

	/** THE place where a sample (an N-layer list) meets the terrain effect: one array slice per layer. Returns { material, effect }. */
	makePatchMaterial(sample, splat, library) {
		return createLayerTerrain(this.app, splat, library, sample.layers.map((l) => ({ key: l.id, tile: l.tile, ns: normalScale(l.id), mode: turnMode(l.id), porosity: porosity(l.id) })));
	}

	/** CPU masks → the effect's splat (layers 1..7 + wetness). */
	fillSplat(p, sp) {
		p.masks = makeMasks(p.sample, sp);
		const n = p.sample.layers.length;
		const tmp = new Float32Array(n + 1);
		p.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		p.splat.fill((x, z, out) => {
			p.masks(x - p.c.x, z - p.c.z, tmp);
			for (let i = 1; i < n; i++) out[i - 1] = tmp[i];
			out[7] = tmp[n];
		});
	}

	/** Fill every patch's splat (CPU) and refresh the tufts. */
	regenerate() {
		const sp = smoothParams(this.settings.smooth);
		for (const p of this.patches) this.fillSplat(p, sp);
		this.scatter?.();
		this.decor?.scatter();
	}

	/** Effect uniforms: the slider's softness / height blend / edge noise, anti-tiling, puddles and wet darkening. */
	applyEffectSettings() {
		const s = this.settings;
		const sp = smoothParams(s.smooth);
		for (const { effect, sample } of this.patches) {
			const u = effect.uniforms;
			u.softness.value = sp.softness;
			u.heightBlend.value = sp.heightBlend;
			u.edgeNoise.value = sp.edgeNoise;
			u.variation.value = s.antiTiling ? 1 : 0;
			u.variationScale.value = s.variationScale;
			u.macro.value = s.macro;
			u.water.value = s.puddles;
			u.wetDarken.value = s.wetDarken;
			u.waterRough.value = 0.08; // a glossy film once it is complete (the gloss ramps in late, see terrain_layers.glsl): micro-ripple + compression keep the sun to small sparkles
			u.contrast.value = s.blendContrast;
			u.rain.value = s.rain;
			u.puddleRefl.value = 1.0;
			u.waterY.value = sample.water ? sample.water.level : -1e4; // below the pond's surface: no puddles, matte, darker with depth
			// palette-bounded macro drift of this sample + what its puddles mirror (the sky of the current time preset, linear)
			u.macroCool.value.setRGB(...(sample.macro?.cool ?? [0.965, 0.995, 1.03]));
			u.macroWarm.value.setRGB(...(sample.macro?.warm ?? [1.045, 1.01, 0.955]));
			u.sky.value.copy(this.skyTint ?? u.sky.value);
			u.debug.value = s.showWeights ? 1 : 0;
		}
	}

	setSmooth(v) {
		this.settings.smooth = v;
		this.applyEffectSettings();
		clearTimeout(this._regen);
		this._regen = setTimeout(() => this.regenerate(), 120); // the CPU masks follow once the slider rests
	}

	// ---- water ---------------------------------------------------------------------------------------------------------------------

	/**
	 * Water surface over the natural sample's pond: a fine grid at the water level whose vertex colour carries the depth colour (muddy green-brown in the shallows
	 * → dark forest green in the deep) and the alpha fade (the lab's WebGPU alphaMap reads the red channel, so the fade rides on vertex alpha); no foam (a still forest pond has none: the depth fade and the terrain's wet halo make the bank); two slowly
	 * scrolling normal layers (a second, specular-only mesh over the first); a MeshPhysicalMaterial with roughness 0.3 and the specular intensity capped at 0.1 (0.2 on the second layer), so the
	 * pond mirrors a dark, tinted sky in a few sharp highlights instead of a pale sheet.
	 */
	async buildWater() {
		const p = this.patches.find((x) => x.sample.pond);
		if (!p) return;
		const { sample, c } = p;
		const normalMap = await loadPlain(this.app, 'biome-darkwood-water-n', THREE.NoColorSpace);
		const { pond, water } = sample;
		const step = 0.07;
		const x0 = pond.x - pond.rx - 4;
		const z0 = pond.z - pond.rz - 4;
		const nx = Math.ceil((pond.rx * 2 + 8) / step);
		const nz = Math.ceil((pond.rz * 2 + 8) / step);
		const pos = [];
		const uv = [];
		const colors = [];
		const colors2 = [];
		const alpha = new Float32Array((nx + 1) * (nz + 1));
		const sm = (v, e0, e1) => THREE.MathUtils.smoothstep(v, e0, e1);
		const shallow = new THREE.Color(0.045, 0.058, 0.026);
		const deep = new THREE.Color(0.004, 0.024, 0.017);
		const col = new THREE.Color();
		for (let j = 0; j <= nz; j++) {
			for (let i = 0; i <= nx; i++) {
				const x = x0 + i * step;
				const z = z0 + j * step;
				const depth = water.level - groundHeight(sample, x, z); // m of water above the ground
				const a = sm(depth, 0.0, 0.16) * (0.62 + 0.38 * sm(depth, 0.02, 0.45)); // the shallows let the mud bed show through
				col.copy(shallow).lerp(deep, sm(depth, 0.03, 0.5));
				alpha[j * (nx + 1) + i] = a;
				pos.push(x, water.level, z);
				uv.push(x / 5, -z / 5);
				colors.push(col.r, col.g, col.b, a);
				colors2.push(0.015, 0.03, 0.025, a * 0.2);
			}
		}
		const index = [];
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				const k = j * (nx + 1) + i;
				if ([k, k + 1, k + nx + 1, k + nx + 2].every((v) => alpha[v] <= 0)) continue; // dry
				index.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2); // counter-clockwise from above (+y normals)
			}
		}
		const make = (color) => {
			const g = new THREE.BufferGeometry();
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
			g.setAttribute('color', new THREE.Float32BufferAttribute(color, 4));
			g.setIndex(index);
			g.computeVertexNormals();
			return g;
		};
		const material = (name, map, scale, roughness, opacity) => new THREE.MeshPhysicalMaterial({ name, normalMap: map, normalScale: new THREE.Vector2(scale, scale), roughness, metalness: 0, ior: 1.33, specularIntensity: 0.1, envMapIntensity: 0.45, transparent: true, opacity, vertexColors: true, depthWrite: false });
		this.waterMaterial = material('Pond water', normalMap, 0.45, 0.3, this.settings.waterOpacity);
		const normal2 = normalMap.clone();
		normal2.repeat.set(3.1, 3.1); // a finer ripple scale: the specular-only layer breaks the backlit sun into glitter
		normal2.needsUpdate = true;
		this.waterMaterial2 = material('Pond water · second ripple layer', normal2, 0.4, 0.26, 1);
		this.waterMaterial2.specularIntensity = 0.2;
		// WebGPU only: r180's direct light ignores the capped F90 (specularIntensity 0.1 / 0.2) and burns a pale sheen on the backlit half; the twin honours it (a no-op on WebGL)
		const waterFx = this.app.backend.effects.createWaterSpecular?.();
		if (waterFx) {
			this.waterMaterial = waterFx.apply(this.waterMaterial);
			this.waterMaterial2 = waterFx.apply(this.waterMaterial2);
		}
		this.water = new THREE.Mesh(make(colors), this.waterMaterial);
		this.water2 = new THREE.Mesh(make(colors2), this.waterMaterial2);
		this.water2.position.y = 0.002;
		for (const [m, order] of [[this.water, 2], [this.water2, 3]]) {
			m.name = m === this.water ? 'Pond water (surface)' : 'Pond water (second ripple layer)';
			m.position.x = c.x;
			m.position.z = c.z;
			m.renderOrder = order;
			m.userData.labNoPick = true;
			this.group.add(m);
		}
	}

	// ---- decals, shore plants, props, sun shadow -------------------------------------------------------------------------------------

	/** Ground decals, shore plants and the authored props of the natural sample (env/biomeMixDecor.js), plus the sun's shadow over it. */
	async buildDecor() {
		const natural = this.patches.find((x) => x.sample.pond);
		this.decor = new BiomeDecor({ app: this.app, group: this.group, patches: this.patches, library: this.library, windGrass: this.windGrass, settings: this.settings });
		try {
			await this.decor.load();
		} catch (error) {
			console.error('Decals / props failed to load; the patches stay undressed', error);
			this.decor = null;
			return;
		}
		this.decor.buildProps();
		this.decor.scatter();
		this.decor.setDetail(false);
		if (natural) {
			natural.mesh.receiveShadow = true;
			const cam = this.moon.shadow.camera;
			cam.left = cam.bottom = -19;
			cam.right = cam.top = 19;
			cam.near = 1;
			cam.far = 160;
			// the shadow map's size is the Lighting panel's (settings.lighting.shadowMapSize): a different size here would be resized and the map disposed by
			// applyShadowSettings after the scene has rendered (destroyed-texture errors on WebGPU). Allocated at that size from the start; bias stays ours.
			const size = this.app.settings.data.lighting?.shadowMapSize ?? 2048;
			this.moon.shadow.mapSize.set(size, size);
			this.moon.userData.labBiasOverride = true;
			this.moon.shadow.bias = -0.0004;
			this.moon.shadow.normalBias = 0.04;
			this.moon.shadow.radius = 3;
			this.moon.target.position.set(natural.c.x, 0, natural.c.z);
			this.applyShadows();
		}
	}

	applyShadows() {
		this.moon.castShadow = this.settings.shadows;
		this.moon.shadow.intensity = 0.65;
	}

	// ---- Dark Wood grass cards ----------------------------------------------------------------------------------------------------

	async buildTufts() {
		try {
			this.cardTexture = await loadGrassCards(this.app, GRASS_CARDS);
		} catch (error) {
			console.error('Dark Wood grass cards failed to load; the grass layers stay flat', error);
			return;
		}
		const material = new THREE.MeshStandardMaterial({ name: 'Grass cards (Dark Wood)', map: this.cardTexture, alphaTest: 0.45, roughness: 0.85, metalness: 0, vertexColors: true, color: new THREE.Color(0.62, 0.74, 0.55) });
		this.tuftMaterial = this.windGrass.apply(material);
		this.tuftBase = material;
		this.tufts = [0, 1, 2, 3].map((cell) => {
			const mesh = new THREE.InstancedMesh(rootShaded(cell), this.tuftMaterial, TUFT_CAPACITY);
			mesh.name = `Grass cards · cell ${cell}`;
			mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(TUFT_CAPACITY * 3), 3);
			mesh.count = 0;
			mesh.frustumCulled = false;
			mesh.userData.labNoPick = true;
			this.group.add(mesh);
			return mesh;
		});
		this.scatter = () => this.scatterTufts();
		this.scatterTufts();
	}

	/** Cards on the grass layers by density: dense on cỏ dày, normal on cỏ, sparse on cỏ thưa; none on dirt, damp soil, mud or water. */
	scatterTufts() {
		if (!this.tufts) return;
		const s = this.settings;
		const r = kit.rng(4242);
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		const counts = [0, 0, 0, 0];
		const smooth = (e0, e1, x) => THREE.MathUtils.smoothstep(x, e0, e1);
		const sp = smoothParams(s.smooth);
		const out = new Float32Array(8);
		const m = new Float32Array(8);
		const w = new Float32Array(8);
		if (s.tufts) {
			for (const p of this.patches) {
				const n = p.sample.layers.length;
				const types = p.sample.layers.map((l, i) => ({ i, cfg: TUFTS[l.id] })).filter((t) => t.cfg);
				if (!types.length) continue;
				const area = p.c.size * p.c.size;
				const half = p.c.size / 2 - 0.25;
				for (const { i, cfg } of types) {
					const tries = Math.round(area * cfg.density * s.tuftDensity);
					for (let t = 0; t < tries; t++) {
						const lx = (r() * 2 - 1) * half;
						const lz = (r() * 2 - 1) * half;
						p.splat.sample(p.c.x + lx, p.c.z + lz, out);
						// coverage masks of layers 1..n-1 (the splat, through the effect's own mask function) → final weight of layer i: the cards fade in and out with the texture's weight
						m[0] = 1;
						for (let k = 1; k < n; k++) m[k] = shaderMask(out[k - 1], sp);
						finalWeights(m, n, w);
						const fade = smooth(0.2, 0.9, w[i]);
						if (r() > fade * 0.85) continue;
						const cell = Math.floor(r() * 4);
						if (counts[cell] >= TUFT_CAPACITY) continue;
						const h = (cfg.h[0] + r() ** 2 * (cfg.h[1] - cfg.h[0])) * (0.6 + 0.4 * fade); // shorter where the layer only just begins
						dummy.position.set(p.c.x + lx, groundHeight(p.sample, lx, lz), p.c.z + lz);
						dummy.rotation.set(0, r() * Math.PI, 0);
						dummy.scale.set(h * (0.9 + r() * 0.4), h, h * (0.9 + r() * 0.4));
						dummy.updateMatrix();
						// tinted toward the ground colour at its root (chroma only), taller / denser on the dense grass by config, a little lighter on the dense
						const tone = 0.55 + r() * 0.3;
						let mr = 0;
						let mg = 0;
						let mb = 0;
						for (let k = 0; k < n; k++) {
							const mean = this.library.mean[p.sample.layers[k].id];
							mr += w[k] * mean[0];
							mg += w[k] * mean[1];
							mb += w[k] * mean[2];
						}
						const lum = Math.max(1e-4, 0.2126 * mr + 0.7152 * mg + 0.0722 * mb);
						this.tufts[cell].setMatrixAt(counts[cell], dummy.matrix);
						this.tufts[cell].setColorAt(counts[cell], color.setRGB(tone * 0.92 * (1 + 0.4 * (mr / lum - 1)), tone * (1 + 0.4 * (mg / lum - 1)), tone * 0.86 * (1 + 0.4 * (mb / lum - 1))));
						counts[cell]++;
					}
				}
			}
		}
		this.tufts.forEach((mesh, cell) => {
			mesh.count = counts[cell];
			mesh.instanceMatrix.needsUpdate = true;
			mesh.instanceColor.needsUpdate = true;
			mesh.visible = counts[cell] > 0;
		});
		this.tuftCount = counts.reduce((a, b) => a + b, 0);
	}

	// ---- lights -------------------------------------------------------------------------------------------------------------------

	buildLights() {
		this.moon = new THREE.DirectionalLight(0xffffff, 1);
		this.moon.name = 'Sun / moon (one shadow map, over the natural sample)';
		this.scene.add(this.moon, this.moon.target);
		this.hemi = new THREE.HemisphereLight(0xc9d4e4, 0x3b352e, 1);
		this.hemi.name = 'Sky / ground ambient';
		this.scene.add(this.hemi);
		this.lights = [
			{ name: 'Sun', light: this.moon, kelvin: 5400, base: 1 },
			{ name: 'Sky ambient', light: this.hemi, base: 1 },
		];
	}

	applyRigIntensity() {
		for (const l of this.lights) l.light.intensity = l.base;
	}

	wetRoots() {
		return []; // rain moods leave the painted patches alone
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	async applyTime() {
		const t = this.times[this.settings.time] || this.times.lookdev;
		const elev = THREE.MathUtils.degToRad(t.sunElev);
		const az = THREE.MathUtils.degToRad(t.sunAz);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(60).add(this.moon.target.position);
		this.moon.color.copy(kelvinToColor(t.moonK));
		this.lights[0].kelvin = t.moonK;
		this.lights[0].base = t.moon;
		this.lights[1].base = t.hemi;
		this.hemi.color.set(t.sky);
		this.hemi.groundColor.set(t.ground);
		this.applyRigIntensity();
		this.sun.direction.copy(dir);
		this.sun.color.copy(this.moon.color).multiplyScalar(t.sun);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		if (this.disposed) return env.dispose?.(); // the scene was left while the HDRI loaded
		const previous = this._env;
		this._env = this.scene.environment = env;
		if (previous && previous !== env) previous.dispose?.();
		this.scene.environmentIntensity = t.envI;
		this.scene.background = new THREE.Color(0x14161a);
		// what a puddle mirrors: the sky of the time preset scaled by the hemisphere's intensity (the warmth of the puddles comes from `puddleTint`); THREE.Color(hex) is already linear working space
		this.skyTint = new THREE.Color(t.sky).multiplyScalar(t.hemi / Math.PI);
		this.applyEffectSettings();
		this.postDefaults = { toneMapping: t.toneMapping, exposure: t.exposure, fog: { enabled: false, height: 0, ...t.fog }, grade: { vignette: 0.3, ...t.grade } };
	}

	async applyMood(block) {
		this.mood = block;
		if (!block) {
			await this.applyTime();
			return;
		}
		const elev = THREE.MathUtils.degToRad(block.moon.elevation);
		const az = THREE.MathUtils.degToRad(block.moon.azimuth);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(60).add(this.moon.target.position);
		this.moon.color.copy(kelvinToColor(block.moon.kelvin));
		this.lights[0].kelvin = block.moon.kelvin;
		this.lights[0].base = block.moon.lux;
		this.hemi.color.set(block.sky.color);
		this.hemi.groundColor.set(block.sky.ground);
		this.lights[1].base = block.sky.intensity;
		this.applyRigIntensity();
		this.sun.direction.copy(dir);
		this.sun.color.copy(this.moon.color).multiplyScalar(block.sun);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(block.env.id));
		if (this.mood !== block) return;
		this.scene.environment = env;
		this.scene.environmentIntensity = block.env.intensity;
	}

	// ---- panels -------------------------------------------------------------------------------------------------------------------

	buildLightingControls(folder, rebuildLights) {
		if (this.mood) return;
		folder.add(this.settings, 'time', Object.fromEntries(Object.entries(this.times).map(([id, t]) => [t.label, id]))).name('Time of day').onChange(async () => {
			this.app.settings.changed(this.id);
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		const fx = () => (save(), this.applyEffectSettings());
		const views = { 'Toàn lưới (overview)': 'overview', ...Object.fromEntries(SAMPLES.map((x) => [x.name, x.id])) };
		const state = { view: this.view, shore: () => this.frame('natural', { shore: true }) };
		folder.add(state, 'view', views).name('Mẫu (khung camera)').onChange((v) => this.frame(v)).listen();
		folder.add(state, 'shore').name('Cận cảnh bờ ao (Đồng cỏ & bờ nước)');
		const smooth = folder.add(s, 'smooth', 0, 1, 0.01).name('Độ mịn (blend)');
		folder.add(s, 'blendContrast', 0, 1, 0.01).name('Giữ tương phản khi trộn (variance-preserving)').onChange(fx);
		folder.add(s, 'rain', 0, 1, 0.01).name('Mưa (gợn sóng trên vũng)').onChange(fx);
		smooth.onChange((v) => (save(), this.setSmooth(v)));
		folder.add(s, 'antiTiling').name('Chống lặp texture (anti-tiling)').onChange(fx);
		folder.add(s, 'showWeights').name('Debug: trọng số layer (màu theo thứ tự layer, xanh dương = ẩm, lam nhạt = vũng)').onChange(fx);
		folder.add(s, 'puddles', 0, 0.6, 0.01).name('Mực vũng nước (0 = không vũng)').onChange(fx);
		folder.add(s, 'wetDarken', 0, 0.8, 0.01).name('Đất ẩm tối màu').onChange(fx);
		folder.add(s, 'variationScale', 0.03, 0.5, 0.01).name('Anti-tiling: vùng / m').onChange(fx);
		folder.add(s, 'macro', 0, 0.5, 0.01).name('Biến thiên sáng tối diện rộng').onChange(fx);
		folder.add(s, 'labels').name('Nhãn mẫu').onChange((v) => (save(), this.patches.forEach((p) => (p.label.visible = v && this.view === 'overview'))));
		const ft = folder.addFolder('Cỏ Dark Wood (3D cards)');
		ft.add(s, 'tufts').name('Cỏ 3D trên layer cỏ').onChange(() => (save(), this.scatterTufts?.()));
		ft.add(s, 'tuftDensity', 0.2, 2, 0.05).name('Mật độ').onFinishChange(() => (save(), this.scatterTufts?.()));
		ft.add(s, 'wind', 0, 1.2, 0.01).name('Gió').onChange((v) => (save(), (this.windGrass.uniforms.strength.value = v)));
		const fd = folder.addFolder('Chi tiết mặt đất (decal · cây bờ nước · prop)');
		fd.add(s, 'decals', 0, 2, 0.05).name('Decal (lá, cành, sỏi, rêu…) mật độ').onFinishChange(() => (save(), this.decor?.scatter()));
		fd.add(s, 'plants', 0, 2, 0.05).name('Cây bờ nước (lau, sậy…) mật độ').onFinishChange(() => (save(), this.decor?.scatter()));
		fd.add(s, 'props').name('Prop 3D (gốc cây, nấm, đá bờ sông…)').onChange((v) => (save(), this.decor && (this.decor.props.visible = v && this.decor.near !== false)));
		fd.add(s, 'shadows').name('Bóng nắng (trên mẫu tự nhiên)').onChange(() => (save(), this.applyShadows()));
		const fw = folder.addFolder('Mặt nước (ao)');
		fw.add(s, 'waterOpacity', 0.3, 1, 0.01).name('Độ đặc').onChange((v) => (save(), this.waterMaterial && (this.waterMaterial.opacity = v)));
		fw.add(s, 'waterFlow', 0, 3, 0.05).name('Tốc độ gợn sóng').onChange(save);
		folder.add(s, 'subject').name('Nhân vật mẫu (thước 1.8 m)').onChange(() => (save(), this.placeSubject()));
		note(folder, '<b>7 trạng thái của Đồng cỏ &amp; bờ nước</b> (layer, dưới → trên): <b>đất</b> (nền) · <b>cỏ thưa</b> · <b>cỏ</b> · <b>cỏ dày</b> (xa ao) · lối mòn đất · <b>đất ẩm</b> gần nước · <b>bùn</b> quanh ao; <b>vũng nước</b> = độ ẩm cao + chỗ trũng của bùn / đất ẩm (shader); <b>nước</b> = mặt nước của ao (mesh). Màu debug: nâu đất · đỏ cỏ thưa · vàng cỏ · xanh nõn cỏ dày · xanh lá lối · xanh ngọc đất ẩm · tím bùn.');
		this._viewState = state;
	}

	update(delta, elapsed) {
		if (this._viewState) this._viewState.view = this.view;
		if (this.decor) {
			const { rig } = this.app;
			const near = rig.persp.position.distanceTo(rig.controls.target) < 70 || rig.mode !== 'orbit';
			this.decor.setDetail(near);
			// the water's second ripple layer is close-up detail as well (~0.7 ms of GPU time in the overview)
			if (this.water2) this.water2.visible = near;
		}
		if (this.waterMaterial) {
			const t = elapsed * this.settings.waterFlow;
			this.waterMaterial.normalMap.offset.set(t * 0.012, t * 0.007);
			this.waterMaterial2.normalMap.offset.set(-t * 0.009, t * 0.011);
		}
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.group);
	}

	/**
	 * Leaving the scene (the App keeps scenes cached and never calls dispose). WebGL2: everything is freed — the layer arrays (~435 MB of GPU memory, ~265 MB
	 * of CPU copies), the grass-card atlas, splats, tufts, water — and the scene leaves the App's cache, so coming back builds it again (~4 s). WebGPU: building
	 * a scene a second time renders black (the lab's known scene-switch bug, see App.reloadScene), so the scene stays cached and only the layer arrays and
	 * the card atlas lose their GPU copies (they upload again from the CPU data when the scene returns; the CPU copies stay). `webgpu-gl` (WebGPU renderer on
	 * WebGL2, backend.kind 'webgpu') takes the same keep-cached path as WebGPU.
	 */
	deactivate() {
		if (this.app.backend.kind === 'webgl') {
			// out of the cache and the app's library at once (coming back builds afresh), but freed only when the shaders have finished linking: disposing
			// textures while the App is still compiling this scene (renderHold) breaks the compile (isReady / GL_INVALID_VALUE)
			this.app.sceneCache.delete(this.id);
			this.app._biomeMixLibrary = null;
			const free = () => this.dispose();
			const hold = this.app.renderHold;
			if (hold) hold.then(free, free);
			else free();
			return;
		}
		// (the decal / plant atlases stay: disposing a texture that a cached instanced mesh still binds leaves an empty binding and breaks the shader precompile on re-entry)
		for (const t of [this.library?.map, this.library?.normalMap, this.library?.ormMap, this.cardTexture]) t?.dispose();
	}

	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		clearTimeout(this._regen);
		const lib = this.library;
		if (lib) for (const t of [lib.map, lib.normalMap, lib.ormMap]) t.dispose();
		if (this.cardTexture) {
			this.cardTexture.dispose();
			delete this.app._grassCards?.[GRASS_CARDS];
		}
		for (const g of this.geometries?.values() ?? []) g.dispose();
		for (const p of this.patches) {
			p.splat.dispose();
			p.mesh.material.dispose();
			p.label.geometry.dispose();
			p.label.material.map.dispose();
			p.label.material.dispose();
		}
		this.water?.geometry.dispose();
		this.water2?.geometry.dispose();
		this.waterMaterial?.normalMap?.dispose();
		this.waterMaterial2?.normalMap?.dispose();
		this.waterMaterial?.dispose();
		this.waterMaterial2?.dispose();
		this.decor?.dispose();
		this.moon?.shadow.dispose(); // the sun's shadow map
		this._env?.dispose?.(); // the PMREM of the time preset's HDRI
		for (const m of this.tufts ?? []) {
			m.geometry.dispose();
			m.dispose(); // the instance buffers
		}
		this.tuftMaterial?.dispose();
		this.tuftBase?.dispose();
	}
}

// ASHLAR · Act I · base maps — the OUTDOOR scene: one class for every outdoor base map (Lychgate → Churchyard, the Night Fens → Rook's Weir, the Poppy Reach),
// registered per map in scenes/index.js as `new Act1OutdoorScene(app, '<mapId>')`. It loads src/env/act1/maps/<mapId>.js (its PLAN + the §6b exports),
// evaluates it (env/act1/outdoor.js: heights, water, paths, decks, masks, placements) and builds it (env/act1/outdoorBuild.js + blockout.js): the N-layer terrain
// from one LayerSplat, water, cobble lanes, walkways, blockouts at real size labelled by asset id, the fitting GLBs and "kit tạm" stand-ins, procedural cards, the
// light grammar (human light small, warm, 1/f flicker; Perfection light still), rain / mist placeholders, overlays (off by default except the legend) and the
// far frame with the Gentle House silhouette. Moods per map (+ a lookdev preset), views per beat, a "Điểm xuất phát" spawn per segment for Play (the nav grid is
// 128 m round the spawn), surfaceAt + water depth for footsteps, scene.monsterCamps() placeholders named after the ASHLAR ids. Settings key = the scene id.
// Spec: tmp/act1-base-maps/SPEC.md. Docs: HUONG_DAN.md §7l. Tests: scripts/act1-outdoor.test.mjs.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { LayerSplat, buildLayerLibrary, createLayerTerrain } from '../env/terrainLayers.js';
import { shaderMask, finalWeights } from '../env/biomeMix.js';
import { resetSample, layerWeightsAt, classifyLayers, applyWater } from '../env/surfaces.js';
import { evaluatePlan, smoothParams, maskRaster, textureId, porosity, turnMode, normalScale } from '../env/act1/outdoor.js';
import { OutdoorBuild } from '../env/act1/outdoorBuild.js';
import { CATEGORY_COLORS } from '../env/act1/blockout.js';
import { note } from '../ui/gui.js';

export const ACT1_OUTDOOR_DEFAULTS = {
	look: 1,
	mood: null, // null = the plan's defaultMood
	spawn: null, // null = the first segment
	smooth: 0.8,
	antiTiling: true,
	variationScale: 0.18,
	macro: 0.1,
	showWeights: false,
	puddles: 0.24,
	wetDarken: 0.5,
	blendContrast: 0.65,
	rain: 1, // × the mood's rain
	mist: 1, // × the mood's mist
	ritesDone: false, // after the five rites: the mist thins and the crows settle
	flicker: true,
	labels: false,
	encounters: false,
	rites: false,
	landmarks: false,
	vignettes: false,
	npcs: false,
	exits: false,
	legend: true,
	blockouts: true,
	props: true,
	cards: true,
	grassDensity: 1,
	monsters: true,
	subject: false,
	waterOpacity: 0.92,
	waterFlow: 1,
	smoke: true, // sleep smoke as terrain (plans with `smoke`: the Poppy Reach)
	smokeSpeed: 1, // × the wind
	smokeInfo: false, // labels "đứng trong: chậm dần → ngủ"
};

const PITCH = THREE.MathUtils.degToRad(55);
const sceneIdOf = (mapId) => `act1${mapId[0].toUpperCase()}${mapId.slice(1)}`;
/** The map files, bundled by esbuild's glob import (a new maps/<id>.js needs no edit here). */
const loadMap = (mapId) => import(`../env/act1/maps/${mapId}.js`);

export class Act1OutdoorScene {
	constructor(app, mapId) {
		this.app = app;
		this.mapId = mapId;
		this.id = sceneIdOf(mapId);
		this.label = `ASHLAR · Act I · base · ${mapId}`;
		this.moodKind = 'exterior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = `ASHLAR Act I base · ${mapId}`;
		registerDefaults(this.id, ACT1_OUTDOOR_DEFAULTS);
		this.settings = app.settings.adopt(this.id);
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor (spawn)';
		this.vfx = new THREE.Group(); // glows, rain (the app's VFX layer: composited after the fog)
		this.vfx.name = `Act I ${mapId} VFX`;
		this.sun = { direction: new THREE.Vector3(0.3, 1, 0.2).normalize(), color: new THREE.Color(0, 0, 0) };
		this.lights = [];
		this.times = {};
		this.postDefaults = null;
		this.view = 'overview';
		this.defaultSubject = 'd2r-sorceress'; // Play needs a character
		this.home = null;
		this._focus = new THREE.Vector3();
		this._hero = new THREE.Vector3();
		this._weights = new Float32Array(8);
		this._player = null;
	}

	// ---- camera ----------------------------------------------------------------------------------------------------------------------------------

	cameraFor(view) {
		const W = this.world;
		const v = W?.views[view] ?? W?.views.overview;
		if (!v) return { position: new THREE.Vector3(0, 120, 120), target: new THREE.Vector3(), dist: 170 };
		const { persp } = this.app.rig ?? {};
		const fov = persp?.fov ?? 35;
		const size = this.app.size ?? { w: 16, h: 9 };
		const aspect = size.w / size.h;
		if (v.eye) {
			const position = new THREE.Vector3(...v.eye);
			const target = new THREE.Vector3(...v.look);
			return { position, target, dist: position.distanceTo(target), far: 4000 };
		}
		const target = new THREE.Vector3(...v.target);
		if (v.fit) {
			const [w, d] = v.fit;
			const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
			const dist = Math.max(w / 2 / (t * aspect) + (d / 2) * Math.cos(PITCH), (d * Math.sin(PITCH)) / (2 * t) + d * Math.cos(PITCH) * 0.5) * 1.02;
			return { position: new THREE.Vector3(target.x, target.y + dist * Math.sin(PITCH), target.z + dist * Math.cos(PITCH)), target, dist };
		}
		const p = THREE.MathUtils.degToRad(v.pitch ?? 55);
		const y = THREE.MathUtils.degToRad(v.yaw ?? 0);
		const position = new THREE.Vector3(target.x + v.dist * Math.cos(p) * Math.sin(y), target.y + v.dist * Math.sin(p), target.z + v.dist * Math.cos(p) * Math.cos(y));
		return { position, target, dist: v.dist };
	}

	frame(view) {
		const { rig } = this.app;
		this.view = view;
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		const cam = this.cameraFor(view);
		rig.lookAt(cam.position, cam.target);
		rig.persp.near = Math.max(0.1, cam.dist / 300);
		rig.persp.far = Math.max(cam.far ?? 0, 1800, cam.dist * 20);
		rig.persp.updateProjectionMatrix();
		this.placeSubject();
	}

	/** The anchor (the character and Play's spawn) stands on the chosen segment's spawn. */
	spawnPoint() {
		const W = this.world;
		return W.spawns.find((s) => s.id === this.settings.spawn) ?? W.spawns[0];
	}

	placeSubject() {
		if (!this.world) return;
		const sp = this.spawnPoint();
		this.anchor.visible = !!this.settings.subject;
		this.anchor.position.set(sp.x, sp.y + 0.02, sp.z);
	}

	/** Change the spawn segment (Environment tab); a running Play restarts there (its nav grid is 128 m round the spawn). */
	setSpawn(id) {
		this.settings.spawn = id;
		this.app.settings.changed(this.id);
		this.placeSubject();
		const sp = this.spawnPoint();
		const seg = this.world.segments.find((s) => s.id === sp.id);
		if (seg?.view && this.world.views[seg.view] && !this.app.gameplay?.active) this.frame(seg.view);
		if (this.app.gameplay?.active) this.app.gameplay.restart();
	}

	// ---- init --------------------------------------------------------------------------------------------------------------------------------------

	async init() {
		const { app, scene, settings: s } = this;
		const t0 = performance.now();
		const mod = await loadMap(this.mapId);
		if (mod.PLAN?.engine !== 'outdoor') throw new Error(`maps/${this.mapId}.js is not an outdoor plan (PLAN.engine = ${mod.PLAN?.engine})`);
		this.mod = mod;
		this.plan = mod.PLAN;
		this.label = `ASHLAR · Act I · base · ${this.plan.label}`;
		if (s.look !== ACT1_OUTDOOR_DEFAULTS.look) {
			Object.assign(s, ACT1_OUTDOOR_DEFAULTS);
			delete app.settings.data.scenePost?.[this.id];
		}
		if (!this.plan.moods[s.mood]) s.mood = this.plan.defaultMood ?? Object.keys(this.plan.moods)[0];
		this.times = this.plan.moods;
		const world = (this.world = evaluatePlan(this.plan));
		this.timing = { evaluate: performance.now() - t0 };
		if (!world.spawns.some((x) => x.id === s.spawn)) s.spawn = world.spawns[0]?.id ?? null;
		this.home = this.cameraFor('overview');
		scene.add(this.anchor);
		scene.background = new THREE.Color(this.plan.moods[s.mood].background ?? '#30353a');
		this.group = new THREE.Group();
		this.group.name = `Act I base map · ${this.plan.label}`;
		scene.add(this.group);
		// ground: the layer library (once per app and map), one splat over the bounds' square, the N-layer terrain
		const t1 = performance.now();
		app._act1Libraries ??= {};
		app._act1Libraries[this.mapId] ??= buildLayerLibrary(app, this.plan.layers.map((l) => ({ key: l.id, file: textureId(l.id) })));
		this.library = await app._act1Libraries[this.mapId];
		this.timing.library = performance.now() - t1;
		const [x0, z0, x1, z1] = this.plan.bounds;
		const extent = Math.max(x1 - x0, z1 - z0);
		const sp = smoothParams(s.smooth);
		this.splat = new LayerSplat({ size: this.plan.splat?.res ?? 768, originX: (x0 + x1) / 2 - extent / 2, originZ: (z0 + z1) / 2 - extent / 2, extent });
		const { material, effect } = createLayerTerrain(app, this.splat, this.library, this.plan.layers.map((l) => ({ key: l.id, tile: l.tile, ns: normalScale(l.id) * (l.ns ?? 1), mode: l.mode ?? turnMode(l.id), porosity: l.porosity ?? porosity(l.id) })));
		this.material = material;
		this.effect = effect;
		const t2 = performance.now();
		this.fillSplat(sp);
		this.timing.splat = performance.now() - t2;
		this.applyEffectSettings();
		// everything else
		const t3 = performance.now();
		this.build = new OutdoorBuild({ app, world, group: this.group, vfx: this.vfx, settings: s, splat: this.splat, library: this.library, sp });
		await this.build.load();
		this.build.buildTerrain(material);
		this.build.buildWater();
		this.build.buildLanes();
		this.build.buildDecks();
		this.build.buildDeepWater();
		this.build.buildWalkFloor();
		this.build.buildAssets();
		this.build.buildFar();
		this.build.buildLights();
		this.build.buildWeather();
		this.build.buildOverlays();
		this.timing.build = performance.now() - t3;
		this.buildLights();
		this.applyVisibility();
		await this.applyTime();
		this.placeSubject();
		this.timing.total = performance.now() - t0;
		console.info(`[act1] ${this.id}: evaluate ${this.timing.evaluate.toFixed(0)} ms · library ${this.timing.library.toFixed(0)} ms · splat ${this.timing.splat.toFixed(0)} ms · build ${this.timing.build.toFixed(0)} ms · total ${this.timing.total.toFixed(0)} ms · items ${world.structures.length}`);
	}

	// ---- ground ----------------------------------------------------------------------------------------------------------------------------------

	/** The masks into the splat (every 2nd texel evaluated, bilinear in between), then the splat's own blur. */
	fillSplat(sp) {
		const masks = this.world.makeMasks(sp);
		const { originX, originZ, extent, size } = this.splat;
		const raw = maskRaster(masks, { originX, originZ, extent, size, step: 2 });
		this.splat.raw[0].set(raw[0]);
		this.splat.raw[1].set(raw[1]);
		this.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		this.splat.refresh();
	}

	/** What the hero stands on (env/surfaces.js → character/footsteps.js): a walkway deck is wood, the cobble lane stone, else the splat's layers; open water wins. */
	surfaceAt(x, z, out) {
		resetSample(out);
		const W = this.world;
		if (!this.splat || !W?.inBounds(x, z)) return out;
		const deck = W.deckAt(x, z);
		const ground = W.height(x, z);
		if (deck !== null && deck > ground + 0.05) {
			out.id = 'wood';
			out.wet = 0.35;
			out.path = true;
			return out;
		}
		this._keys ??= this.plan.layers.map((l) => l.id);
		const wetness = layerWeightsAt(this.splat, this.plan.layers.length, x, z, shaderMask, finalWeights, smoothParams(this.settings.smooth), this._weights);
		classifyLayers(out, this._keys, this._weights, wetness);
		if (W.pathDistance(x, z, (p) => p.ribbon === 'cobble') < 1.2) {
			out.id = 'stone';
			out.path = true;
			out.soft = 0;
		}
		const water = W.waterAt(x, z);
		if (water) applyWater(out, water.depth, water.level);
		return out;
	}

	/** Water depth (m) at world xz (0 = dry): the fen, the mere … */
	waterDepth(x, z) {
		return this.world?.waterDepth(x, z) ?? 0;
	}

	/** Ground height for the atmosphere / helpers. */
	height(x, z) {
		return this.world?.height(x, z) ?? 0;
	}

	applyEffectSettings() {
		const s = this.settings;
		const sp = smoothParams(s.smooth);
		const u = this.effect.uniforms;
		const mood = this.plan.moods[s.mood] ?? {};
		u.softness.value = sp.softness;
		u.heightBlend.value = sp.heightBlend;
		u.edgeNoise.value = sp.edgeNoise;
		u.variation.value = s.antiTiling ? 1 : 0;
		u.variationScale.value = s.variationScale;
		u.macro.value = s.macro;
		u.water.value = s.puddles;
		u.wetDarken.value = s.wetDarken;
		u.waterRough.value = 0.08;
		u.contrast.value = s.blendContrast;
		u.rain.value = Math.min(1, (mood.rain ?? 0) * s.rain);
		u.puddleRefl.value = 1.0;
		u.roughMin.value = 0.62;
		u.waterY.value = this.world.water.length ? Math.min(...this.world.water.map((b) => b.level)) : -1e4;
		u.sky.value.copy(this.skyTint ?? u.sky.value);
		u.debug.value = s.showWeights ? 1 : 0;
		// the hero's light radius: only at night (a small neutral pool, D2's light radius); never in the day drizzle
		const night = (mood.hemi ?? 1) < 1;
		u.lanternColor.value.setRGB(0.55, 0.52, 0.46);
		u.lantern.value.w = 6.5;
		u.lanternP.value.set(2.4, night ? 0.32 : 0, night ? 0.35 : 0, 0);
	}

	setSmooth(v) {
		this.settings.smooth = v;
		this.applyEffectSettings();
		clearTimeout(this._regen);
		this._regen = setTimeout(() => this.fillSplat(smoothParams(this.settings.smooth)), 150);
	}

	// ---- lights and moods --------------------------------------------------------------------------------------------------------------------------

	buildLights() {
		this.hemi = new THREE.HemisphereLight(0xa9b1a6, 0x4a3526, 1);
		this.hemi.name = 'Sky / ground ambient (overcast)';
		this.dir = new THREE.DirectionalLight(0xffffff, 0.5);
		this.dir.name = 'Sky key (soft, no shadow: drizzle is shadowless)';
		this.scene.add(this.hemi, this.dir, this.dir.target);
		this.lights = [
			{ name: 'Sky / ground ambient', light: this.hemi, base: 1 },
			{ name: 'Sky key (no shadow)', light: this.dir, kelvin: 7000, base: 0.5 },
			...this.build.lights.map((l) => ({ name: l.light.name, light: l.light, base: l.base, ref: l })),
		];
	}

	applyRigIntensity() {
		this.hemi.intensity = this.lights[0].base;
		this.dir.intensity = this.lights[1].base;
		for (const e of this.lights) if (e.ref) e.ref.base = e.base;
	}

	wetRoots() {
		return [];
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	async applyTime() {
		const s = this.settings;
		const t = this.plan.moods[s.mood] ?? Object.values(this.plan.moods)[0];
		const elev = THREE.MathUtils.degToRad(t.sun?.elev ?? 55);
		const az = THREE.MathUtils.degToRad(t.sun?.az ?? -135);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		const [x0, z0, x1, z1] = this.plan.bounds;
		this.dir.target.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
		this.dir.position.copy(dir).multiplyScalar(120).add(this.dir.target.position);
		this.dir.color.copy(kelvinToColor(t.sun?.kelvin ?? 6500));
		this.lights[1].kelvin = t.sun?.kelvin ?? 6500;
		this.lights[1].base = t.sun?.intensity ?? 0.5;
		this.lights[0].base = t.hemi ?? 1;
		this.hemi.color.set(t.sky ?? '#a9b1a6');
		this.hemi.groundColor.set(t.ground ?? '#4a3526');
		this.build.applyMood(s.mood, t);
		for (const e of this.lights) if (e.ref) e.base = e.ref.base;
		this.applyRigIntensity();
		this.sun.direction.copy(dir);
		this.sun.color.copy(this.dir.color).multiplyScalar(0.0);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env ?? 'hdri-overcast'));
		if (this.disposed) return env.dispose?.();
		const previous = this._env;
		this._env = this.scene.environment = env;
		if (previous && previous !== env) previous.dispose?.();
		this.scene.environmentIntensity = t.envI ?? 0.3;
		this.scene.background = new THREE.Color(t.background ?? '#30353a');
		this.skyTint = new THREE.Color(t.sky ?? '#a9b1a6').multiplyScalar(((t.hemi ?? 1) / Math.PI) * 0.7);
		this.applyEffectSettings();
		this.postDefaults = { toneMapping: t.toneMapping ?? 'aces', exposure: t.exposure ?? 0.3, fog: { enabled: false, height: 0, ...t.fog }, grade: { vignette: 0.3, ...t.grade } };
	}

	async applyMood(block) {
		this.mood = block;
		await this.applyTime(); // the base map keeps its own mood presets under every lab mood
	}

	async setMood(id) {
		this.settings.mood = id;
		this.app.settings.changed(this.id);
		await this.applyTime();
		this.app.applyScenePost(this, true);
	}

	// ---- panels ------------------------------------------------------------------------------------------------------------------------------------

	buildLightingControls(folder, rebuildLights) {
		if (this.mood) return;
		folder.add(this.settings, 'mood', Object.fromEntries(Object.entries(this.plan.moods).map(([id, t]) => [t.label, id]))).name('Ánh sáng (mood)').onChange(async (id) => {
			await this.setMood(id);
			rebuildLights();
		});
	}

	applyVisibility() {
		const s = this.settings;
		const L = this.build.layers;
		if (L.Blockouts) L.Blockouts.visible = s.blockouts;
		if (L['Models (glb · kit tạm)']) L['Models (glb · kit tạm)'].visible = s.props;
		if (this.build.cardGroup) for (const m of this.build.cardMeshes ?? []) m.visible = s.cards;
		if (this.build.waterMaterial) this.build.waterMaterial.opacity = s.waterOpacity;
		this.build.setOverlays(s);
		this.updateLegend();
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const W = this.world;
		const save = () => this.app.settings.changed(this.id);
		const fx = () => (save(), this.applyEffectSettings());
		const vis = () => (save(), this.applyVisibility());
		const state = { view: this.view, spawn: s.spawn };
		folder.add(state, 'view', Object.fromEntries(Object.entries(W.views).map(([id, v]) => [v.label, id]))).name('Khu vực (khung camera)').onChange((v) => this.frame(v)).listen();
		folder.add(state, 'spawn', Object.fromEntries(W.spawns.map((x) => [x.label, x.id]))).name('Điểm xuất phát (Play)').onChange((id) => this.setSpawn(id));
		folder.add(s, 'mood', Object.fromEntries(Object.entries(this.plan.moods).map(([id, t]) => [t.label, id]))).name('Mood').onChange((id) => this.setMood(id));
		folder.add(s, 'smooth', 0, 1, 0.01).name('Độ mịn (blend)').onChange((v) => (save(), this.setSmooth(v)));
		const fo = folder.addFolder('Lớp phủ (overlay)');
		fo.add(s, 'labels').name('Nhãn asset (mã + tên + trạng thái)').onChange(vis);
		fo.add(s, 'encounters').name('Chạm trán (mã quái × số lượng)').onChange(vis);
		fo.add(s, 'rites').name('Điểm Rite (mộ chưa yên)').onChange(vis);
		fo.add(s, 'landmarks').name('Landmark + tầm nhìn').onChange(vis);
		fo.add(s, 'vignettes').name('Vignette (cả cảnh không đánh dấu)').onChange(vis);
		fo.add(s, 'npcs').name('Vị trí NPC').onChange(vis);
		fo.add(s, 'exits').name('Lối ra').onChange(vis);
		fo.add(s, 'legend').name('Chú giải (màu blockout)').onChange(vis);
		const fw = folder.addFolder('Thời tiết & ánh sáng');
		fw.add(s, 'rain', 0, 2, 0.05).name('Mưa (× mood)').onChange(fx);
		fw.add(s, 'mist', 0, 2, 0.05).name('Sương thấp (× mood)').onChange(save);
		fw.add(s, 'ritesDone').name('Các mộ đã yên (sau Rite): sương mỏng, quạ đậu').onChange(save);
		fw.add(s, 'flicker').name('Ánh sáng người chập chờn (1/f)').onChange(save);
		if (this.plan.smoke) {
			const fk = folder.addFolder('Khói ngủ (địa hình)');
			fk.add(s, 'smoke').name('Hiện khói ngủ (vùng có viền, trôi theo gió)').onChange(save);
			fk.add(s, 'smokeSpeed', 0, 4, 0.05).name('Tốc độ trôi (× gió)').onChange(save);
			fk.add(s, 'smokeInfo').name('Nhãn: đứng trong → chậm dần → ngủ').onChange(save);
		}
		const fd = folder.addFolder('Chi tiết');
		fd.add(s, 'blockouts').name('Blockout (asset chưa có model)').onChange(vis);
		fd.add(s, 'props').name('GLB ASHLAR + kit tạm').onChange(vis);
		fd.add(s, 'cards').name('Cỏ / lau sậy (thẻ procedural)').onChange(vis);
		fd.add(s, 'puddles', 0, 0.6, 0.01).name('Mực vũng nước (0 = không)').onChange(fx);
		fd.add(s, 'wetDarken', 0, 0.8, 0.01).name('Đất ẩm tối màu').onChange(fx);
		fd.add(s, 'antiTiling').name('Chống lặp texture').onChange(fx);
		fd.add(s, 'waterOpacity', 0.3, 1, 0.01).name('Mặt nước: độ đặc').onChange(vis);
		fd.add(s, 'waterFlow', 0, 3, 0.05).name('Mặt nước: tốc độ gợn').onChange(save);
		const fm = folder.addFolder('Quái (Play)');
		fm.add(s, 'monsters').name('Đặt quái thay thế (theo mã ASHLAR)').onChange(save);
		fm.add({ respawn: () => this.respawnMonsters() }, 'respawn').name('Gọi lại quái');
		folder.add(s, 'showWeights').name('Debug: trọng số layer').onChange(fx);
		folder.add(s, 'subject').name('Nhân vật mẫu (thước 1.8 m)').onChange(() => (save(), this.placeSubject()));
		note(folder, this.noteHtml());
		this._viewState = state;
	}

	noteHtml() {
		const counts = {};
		for (const a of this.mod.ASSETS) counts[a.status] = (counts[a.status] ?? 0) + 1;
		const notes = Object.values(this.plan.notes ?? {}).map((t) => `<p>${t}</p>`).join('');
		return `${notes}<p><b>Asset</b> (${this.mod.ASSETS.length} mã): glb ${counts.glb ?? 0} · kit tạm ${counts.kit ?? 0} · procedural ${counts.procedural ?? 0} · <b>blockout ${counts.blockout ?? 0}</b> — danh sách đầy đủ ở <code>docs/act1-base/ASSETS.md</code>. Quái trong Play là mô hình thay thế (zombie, skeleton, archer, spider, bat, imp) mang tên mã ASHLAR. Map dài nên Play chỉ có lưới 128 m quanh điểm xuất phát: đổi <b>Điểm xuất phát</b> để chơi đoạn khác.</p>`;
	}

	/** A small on-screen legend of the blockout colours and the overlay markers (DOM, bottom left of the viewport). */
	updateLegend() {
		const show = this.settings.legend && this.active;
		if (!show) {
			this.legendEl?.remove();
			return;
		}
		if (!this.legendEl) {
			const el = document.createElement('div');
			el.className = 'act1-legend';
			el.style.cssText = 'position:absolute;left:10px;bottom:10px;z-index:5;padding:6px 8px;border-radius:6px;background:rgba(10,11,12,0.72);color:#e9e2cf;font:11px/1.35 system-ui,"Segoe UI",sans-serif;pointer-events:none;max-width:250px';
			const sw = (c) => `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px;background:${c}"></span>`;
			const cat = { building: 'nhà', structure: 'công trình · rào · lối ván', vegetation: 'cây', rock: 'đá', prop: 'đồ vật', story: 'cốt truyện · landmark', npc: 'NPC', encounter: 'chạm trán' };
			el.innerHTML = `<b>Base map · ${this.plan.label}</b><br>${Object.entries(cat).map(([k, v]) => `${sw(CATEGORY_COLORS[k])}${v}`).join('<br>')}<br><span style="opacity:.75">Blockout = asset còn thiếu (đúng cỡ). Overlay: tab Environment.</span>`;
			this.legendEl = el;
		}
		if (!this.legendEl.isConnected) this.app.dom.viewport.appendChild(this.legendEl);
	}

	// ---- Play --------------------------------------------------------------------------------------------------------------------------------------

	/** Monster placeholders (gameplay/host.js spawnCamps at Play start): the plan's encounters with stand-in procedural monsters, named after the ASHLAR ids. */
	monsterCamps() {
		if (!this.settings.monsters || !this.world) return [];
		const names = Object.fromEntries((this.mod.MONSTERS ?? []).map((m) => [m.id, m.name]));
		const camps = [];
		for (const m of this.world.markers.filter((q) => q.kind === 'encounter')) {
			for (const g of m.monsters ?? []) {
				const name = `${g.id} ${names[g.id] ?? ''}`.trim();
				if (g.single) for (let i = 0; i < g.count; i++) camps.push({ x: m.x + i * 1.5, z: m.z, monster: g.standIn, pack: 'unique', minions: 0, mods: [], count: 1, mlvl: 2, radius: 1.5, name, ashlar: g.id });
				else camps.push({ x: m.x, z: m.z, monster: g.standIn, pack: 'normal', count: g.count, mlvl: 2, radius: Math.max(2, (m.r ?? 4) * 0.6), name, ashlar: g.id });
			}
		}
		return camps;
	}

	/** Name the spawned stand-ins after the ASHLAR id of their nearest camp of the same type (normal packs do not carry a name). */
	nameMonsters() {
		const gp = this.app.gameplay;
		if (!gp?.active || !gp.group) return;
		const camps = this.monsterCamps();
		const off = gp.group.position;
		for (const a of gp.state.actors) {
			if (a.team !== 1 || a._act1Named) continue;
			const wx = a.pos.x + off.x;
			const wz = a.pos.z + off.z;
			let best = null;
			let bestD = 14;
			for (const c of camps) {
				if (c.monster !== a.type && !(c.monster === 'imp' && a.type === 'imp_shaman')) continue;
				const d = Math.hypot(c.x - wx, c.z - wz);
				if (d < bestD) {
					bestD = d;
					best = c;
				}
			}
			if (best) a.name = best.name;
			a._act1Named = true;
		}
	}

	respawnMonsters() {
		const gp = this.app.gameplay;
		if (!gp?.active) return;
		gp.clearMonsters();
		gp.spawnCamps();
		this.nameMonsters();
	}

	// ---- per frame ---------------------------------------------------------------------------------------------------------------------------------

	focusPoint() {
		const { app } = this;
		const subject = app.subject?.root;
		if (subject && (app.gameplay?.active || this.settings.subject)) return subject.getWorldPosition(this._focus);
		return this._focus.copy(app.rig.controls.target);
	}

	update(delta, elapsed) {
		if (!this.build) return;
		if (this._viewState) this._viewState.view = this.view;
		const s = this.settings;
		const { app } = this;
		const mood = this.plan.moods[s.mood] ?? {};
		const focus = this.focusPoint();
		const gp = app.gameplay;
		const playing = !!(gp?.active && gp.player);
		this.anchor.visible = !!s.subject || playing;
		if (playing && this._player !== gp.player) {
			this._player = gp.player;
			this.nameMonsters();
		} else if (!playing) this._player = null;
		this.build.update(elapsed, delta, {
			camera: app.world.camera ?? app.rig.camera,
			focus,
			rain: (mood.rain ?? 0) * s.rain,
			mist: (mood.mist ?? 0) * s.mist,
			flicker: s.flicker,
			ritesDone: s.ritesDone,
			waterFlow: s.waterFlow,
			labels: s.labels || s.encounters || s.rites || s.landmarks || s.vignettes || s.npcs || s.exits,
		});
		const u = this.effect.uniforms;
		u.lantern.value.set(focus.x, focus.y, focus.z, 6.5);
	}

	bounds() {
		const [x0, z0, x1, z1] = this.plan.bounds;
		return new THREE.Box3(new THREE.Vector3(x0, -2, z0), new THREE.Vector3(x1, 16, z1));
	}

	// ---- leaving -----------------------------------------------------------------------------------------------------------------------------------

	/**
	 * Leaving (the App keeps scenes cached and never calls dispose). WebGL2: everything is freed and the scene leaves the App's cache (coming back builds it
	 * again). WebGPU / webgpu-gl: a rebuilt scene renders black (the lab's known scene-switch bug), so it stays cached and only the layer arrays lose their GPU
	 * copies (they upload again from the CPU data); textures bound to cached materials are not disposed.
	 */
	activate() {
		this.active = true;
		this.app.world.vfxScene.add(this.vfx);
		this.updateLegend();
	}

	deactivate() {
		this.active = false;
		this.legendEl?.remove();
		this.app.world.vfxScene.remove(this.vfx);
		if (this.app.backend.kind === 'webgl') {
			this.app.sceneCache.delete(this.id);
			if (this.app._act1Libraries) delete this.app._act1Libraries[this.mapId];
			const free = () => this.dispose();
			const hold = this.app.renderHold;
			if (hold) hold.then(free, free);
			else free();
			return;
		}
		for (const t of [this.library?.map, this.library?.normalMap, this.library?.ormMap]) t?.dispose();
	}

	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		clearTimeout(this._regen);
		const lib = this.library;
		if (lib) for (const t of [lib.map, lib.normalMap, lib.ormMap]) t.dispose();
		this.splat?.dispose();
		this.material?.dispose();
		this.build?.dispose();
		this._env?.dispose?.();
	}
}

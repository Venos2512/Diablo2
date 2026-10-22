// ASHLAR · Act I base maps — ONE scene class for every interior map (Act1InteriorScene(app, mapId); registry: scenes/index.js, one line per map). A map is
// a plan in src/env/act1/maps/<mapId>.js (format at the top of src/env/act1/interior.js): compiled by the pure engine, built by env/act1/interiorBuild.js
// (floor through LayerSplat + createLayerTerrain, walls with the biome tiles and the camera wall fade, stairs, blockouts at real size, the existing GLBs, the
// light grammar, glows, overlays). The scene adds what every map shares: per-map settings (key = the scene id), mood presets from the plan (incl. a
// "Soi texture · sáng đều" lookdev preset), the views (one per beat, D2 pitch), the Play spawn per segment ("Điểm xuất phát"; the Play nav grid is 128 m
// round the spawn), surfaceAt for the footsteps, monsterCamps() stand-ins named after the ASHLAR ids, a slider per light group (the Cradle's "Đèn ngủ còn
// lại": the night-lights go out one by one, optionally by themselves in Play), the hero light radius, the overlays (off by default) and a small legend.
// Docs: docs/HUONG_DAN.md §7l, docs/act1-base/<map>.md.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { LayerSplat, buildLayerLibrary, createLayerTerrain } from '../env/terrainLayers.js';
import { shaderMask, finalWeights } from '../env/biomeMix.js';
import { resetSample, layerWeightsAt, classifyLayers, applyWater } from '../env/surfaces.js';
import { SCENE_ATMOSPHERE } from '../env/atmosphere.js';
import * as I from '../env/act1/interior.js';
import { InteriorBuild } from '../env/act1/interiorBuild.js';
import { CATEGORY_COLORS, CATEGORY_LABELS, MARKER_COLORS } from '../env/act1/interiorBlockout.js';
import { note } from '../ui/gui.js';
import * as CRADLE from '../env/act1/maps/cradle.js';
import * as GENTLE_HOUSE from '../env/act1/maps/gentleHouse.js';
import * as GARDEN_OF_HUSH from '../env/act1/maps/gardenOfHush.js';

/** Interior maps by id (add one line per map: the module exports PLAN, KIT, ASSETS, MONSTERS, NPCS, TEXTURES, VFX). */
export const INTERIOR_MAPS = {
	cradle: CRADLE,
	gentleHouse: GENTLE_HOUSE,
	gardenOfHush: GARDEN_OF_HUSH,
};

const PITCH = THREE.MathUtils.degToRad(55);
const sceneIdOf = (mapId) => `act1${mapId[0].toUpperCase()}${mapId.slice(1)}`;

function defaultsFor(plan) {
	const moods = Object.keys(plan.moods ?? {});
	const first = plan.moods?.[moods[0]] ?? {};
	const lantern = first.lantern ?? { radius: 5, strength: 0.35, dim: 0.3 };
	return {
		look: 1,
		time: moods[0] ?? 'default',
		smooth: 0.8,
		antiTiling: true,
		variationScale: 0.18,
		macro: 0.1,
		showWeights: false,
		puddles: 0,
		wetDarken: 0.5,
		blendContrast: 0.65,
		floorTone: first.floorTone ?? plan.floor?.tone ?? 0.8,
		lantern: true,
		lanternRadius: lantern.radius,
		lanternStrength: lantern.strength,
		lanternDim: lantern.dim,
		wallFade: true,
		flicker: true,
		spawn: plan.segments?.[0]?.id ?? null,
		groups: Object.fromEntries(Object.keys(plan.lightGroups ?? {}).map((g) => [g, 99])), // remaining lights per group (clamped to the group's count)
		autoDim: false,
		autoDimPeriod: 9,
		camps: true,
		boss: true,
		overlays: { labels: false, encounters: false, telegraph: false, landmarks: false, npc: false, exits: false, rites: false, patrols: false, bells: false },
		rain: 1, // × the mood's rain (plan.rain: streaks outside the dry rects)
		roofs: true, // exterior roofs (KIT.roof) while the focus is outdoors
		telegraphAnim: true,
		legend: true,
		subject: false,
	};
}

/** The ground textures of a map, packed into the layer arrays once per app and map. */
async function loadLibrary(app, mapId, plan) {
	app._act1Libraries ??= {};
	app._act1Libraries[mapId] ??= buildLayerLibrary(app, plan.floor.layers.map((l) => ({ key: l.id, file: I.textureId(l.id) })));
	return app._act1Libraries[mapId];
}

export class Act1InteriorScene {
	/** mapId: an INTERIOR_MAPS key, or a map module object { PLAN, KIT, ASSETS? } (tests, tools). */
	constructor(app, mapId) {
		const map = typeof mapId === 'string' ? INTERIOR_MAPS[mapId] : { ASSETS: [], ...mapId };
		if (!map?.PLAN) throw new Error(`unknown interior map "${mapId}"`);
		if (typeof mapId !== 'string') mapId = map.PLAN.id;
		this.app = app;
		this.mapId = mapId;
		this.map = map;
		this.plan = map.PLAN;
		this.id = sceneIdOf(mapId);
		this.label = this.plan.label;
		this.moodKind = 'interior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = `ASHLAR ${this.plan.name}`;
		this.defaults = defaultsFor(this.plan);
		registerDefaults(this.id, this.defaults);
		this.settings = app.settings.adopt(this.id);
		this.model = I.compile(this.plan, map.KIT);
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor (Play spawn)';
		this.vfx = new THREE.Group();
		this.vfx.name = `${this.plan.name} VFX`;
		this.sun = { direction: new THREE.Vector3(0.3, 1, 0.2).normalize(), color: new THREE.Color(0, 0, 0) };
		this.lights = [];
		this.times = this.plan.moods ?? {};
		this.postDefaults = null;
		this.view = 'overview';
		this.defaultSubject = 'd2r-sorceress'; // Play needs a character
		this.home = this.cameraFor('overview');
		this.lightScale = 1;
		this.height = (x, z) => this.model.floorY(x, z); // the GPU atmosphere lays its particles on this
		this._focus = new THREE.Vector3();
		this._hero = new THREE.Vector3();
		this._weights = new Float32Array(8);
		this._player = null;
		this._dimT = 0;
		const atm = this.plan.atmosphere;
		if (atm) SCENE_ATMOSPHERE[this.id] = atm.layers ? atm : { layers: atm }; // registered at run time: the atmosphere module keeps its own table ({ layers: { kind: overrides } })
	}

	// ---- camera -------------------------------------------------------------------------------------------------------------------------------------

	cameraFor(view) {
		const v = this.plan.views?.[view] ?? this.plan.views?.overview ?? { target: [0, 0, 0], dist: 40, pitch: 55 };
		const fov = this.app.rig?.persp?.fov ?? 35;
		const size = this.app.size ?? { w: 16, h: 9 };
		const aspect = size.w / size.h;
		const target = new THREE.Vector3(...v.target);
		if (v.dist) {
			const p = THREE.MathUtils.degToRad(v.pitch ?? 55);
			const yaw = THREE.MathUtils.degToRad(v.yaw ?? 0); // 0 = the camera south of the target looking north
			const h = v.dist * Math.cos(p);
			return { position: new THREE.Vector3(target.x + h * Math.sin(yaw), target.y + v.dist * Math.sin(p), target.z + h * Math.cos(yaw)), target, dist: v.dist };
		}
		const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
		const dist = Math.max(v.w / 2 / (t * aspect) + (v.d / 2) * Math.cos(PITCH), (v.d * Math.sin(PITCH)) / (2 * t) + v.d * Math.cos(PITCH) * 0.5) * 1.02;
		return { position: new THREE.Vector3(target.x, target.y + dist * Math.sin(PITCH), target.z + dist * Math.cos(PITCH)), target, dist };
	}

	frame(view) {
		const { rig } = this.app;
		this.view = view;
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		const cam = this.cameraFor(view);
		rig.lookAt(cam.position, cam.target);
		rig.persp.near = Math.max(0.1, cam.dist / 200);
		rig.persp.far = Math.max(400, cam.dist * 20);
		rig.persp.updateProjectionMatrix();
		this.placeSubject();
	}

	segment() {
		return this.model.segments.find((s) => s.id === this.settings.spawn) ?? this.model.segments[0];
	}

	/** The anchor sits at the chosen segment's spawn (Play starts there); the toggle only shows the sample character. */
	placeSubject() {
		const s = this.segment();
		this.anchor.visible = !!this.settings.subject;
		if (s) this.anchor.position.set(s.spawn[0], this.model.floorY(s.spawn[0], s.spawn[1]) + 0.02, s.spawn[1]);
	}

	// ---- init ---------------------------------------------------------------------------------------------------------------------------------------

	async init() {
		const { app, scene, settings: s, plan, model } = this;
		const t0 = performance.now();
		scene.add(this.anchor);
		scene.background = new THREE.Color(0x020203);
		if (s.look !== this.defaults.look) {
			Object.assign(s, structuredClone(this.defaults));
			delete app.settings.data.scenePost?.[this.id];
		}
		if (!this.times[s.time]) s.time = Object.keys(this.times)[0];
		const library = await loadLibrary(app, this.mapId, plan);
		this.library = library;
		this.group = new THREE.Group();
		this.group.name = plan.name;
		scene.add(this.group);
		this.wallFade = app.backend.effects.createWallFade();
		this.buildLights();
		const sp = I.smoothParams(s.smooth);
		const S = model.splat;
		this.splat = new LayerSplat({ size: S.res, originX: S.originX, originZ: S.originZ, extent: S.extent });
		this.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		const layers = plan.floor.layers;
		const { material, effect } = createLayerTerrain(app, this.splat, library, layers.map((l) => ({ key: l.id, tile: l.tile, ns: 0.5, mode: I.turnMode(l.id), porosity: I.porosity(l.id) })));
		material.vertexColors = true; // the apron past the void edges sinks into black through the floor's vertex colours
		material.needsUpdate = true;
		this.material = material;
		this.effect = effect;
		this.applyEffectSettings();
		this.fillSplat(sp);
		this.build = new InteriorBuild({ app, model, group: this.group, vfx: this.vfx, material, settings: s, wallFade: this.wallFade });
		try {
			await this.build.load();
			this.build.build();
			this.lights.push(...this.build.lights);
		} catch (error) {
			console.error(`${plan.name}: the build failed; the map stays bare`, error);
		}
		this.applyGroups();
		this.build?.snapLevels?.(); // a saved slider value shows at once (the 0.6 s fade is for changes)
		this.applyOverlays();
		await this.applyTime();
		this.placeSubject();
		this.loadMs = performance.now() - t0;
	}

	// ---- ground -------------------------------------------------------------------------------------------------------------------------------------

	fillSplat(sp) {
		const masks = this.model.makeMasks(sp);
		this.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		this.splat.fill((x, z, out) => masks(x, z, out));
	}

	/** What the hero stands on at world xz (env/surfaces.js, read by character/footsteps.js): the layer weights of the splat, standing water. */
	surfaceAt(x, z, out) {
		resetSample(out);
		if (!this.splat || this.model.wallDistance(x, z) < -0.3) return out;
		this._keys ??= this.plan.floor.layers.map((l) => l.id);
		const wetness = layerWeightsAt(this.splat, this._keys.length, x, z, shaderMask, finalWeights, I.smoothParams(this.settings.smooth), this._weights);
		classifyLayers(out, this._keys, this._weights, wetness);
		const depth = this.model.waterDepth(x, z);
		if (depth > 0) applyWater(out, depth, this.model.waterAt(x, z)?.level ?? 0);
		return out;
	}

	applyEffectSettings() {
		const s = this.settings;
		const sp = I.smoothParams(s.smooth);
		const u = this.effect.uniforms;
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
		u.rain.value = 0;
		u.puddleRefl.value = 1.0;
		u.roughMin.value = 0.7;
		u.waterY.value = -100;
		u.sky.value.copy(this.skyTint ?? u.sky.value);
		u.debug.value = s.showWeights ? 1 : 0;
		this.material.color.setScalar(this.settings.time === 'lookdev' ? 1 : s.floorTone);
		const L = this.times[s.time]?.lantern ?? { color: [0.5, 0.5, 0.5] };
		u.lanternColor.value.setRGB(...(L.color ?? [0.5, 0.5, 0.5]));
		u.lantern.value.w = s.lanternRadius;
		u.lanternP.value.set(2.2, s.lantern ? s.lanternStrength : 0, s.lantern ? s.lanternDim : 0, 0);
	}

	setSmooth(v) {
		this.settings.smooth = v;
		this.applyEffectSettings();
		clearTimeout(this._regen);
		this._regen = setTimeout(() => this.fillSplat(I.smoothParams(this.settings.smooth)), 120);
	}

	// ---- lights -------------------------------------------------------------------------------------------------------------------------------------

	buildLights() {
		this.hemi = new THREE.HemisphereLight(0x4c4a48, 0x0b0a0b, 1);
		this.hemi.name = 'Ambient floor (sky / ground)';
		this.scene.add(this.hemi);
		// the hero's light (props, walls and the hero; the ground gets the shader pool too): unshadowed, finite, neutral
		this.lanternLight = new THREE.PointLight(kelvinToColor(5000), 0, 7, 1.6);
		this.lanternLight.name = 'Hero light';
		if (this.plan.heroLight !== false) this.scene.add(this.lanternLight); // counted in the plan's light budget (interior.js lightBudget); the shader pool stays either way
		this.lights = [
			{ name: 'Ambient floor', light: this.hemi, base: 1 },
			{ name: 'Hero light', light: this.lanternLight, kelvin: 5000, base: 0 },
		];
	}

	applyRigIntensity() {
		this.hemi.intensity = this.lights[0].base;
	}

	wetRoots() {
		return [];
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	async applyTime() {
		const t = this.times[this.settings.time] ?? Object.values(this.times)[0];
		this.hemi.color.set(t.sky ?? '#4c4a48');
		this.hemi.groundColor.set(t.ground ?? '#0b0a0b');
		this.lights[0].base = t.hemi ?? 1;
		this.applyRigIntensity();
		this.lightScale = t.lights ?? 1;
		if (this.build) this.build.lightScale = this.lightScale;
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env ?? 'hdri-night'));
		if (this.disposed) return env.dispose?.();
		const previous = this._env;
		this._env = this.scene.environment = env;
		if (previous && previous !== env) previous.dispose?.();
		this.scene.environmentIntensity = t.envI ?? 0.04;
		this.scene.background = new THREE.Color(t.background ?? 0x020203);
		this.skyTint = new THREE.Color(t.sky ?? '#4c4a48').multiplyScalar(((t.hemi ?? 1) / Math.PI) * 0.6);
		if (t.floorTone !== undefined && this.settings.time !== 'lookdev') this.settings.floorTone = t.floorTone;
		this.applyEffectSettings();
		this.postDefaults = { toneMapping: t.toneMapping ?? 'aces', exposure: t.exposure ?? 0.85, fog: { enabled: false, height: 0, ...(t.fog ?? {}) }, grade: { vignette: 0.3, ...(t.grade ?? {}) } };
	}

	async applyMood(block) {
		this.mood = block;
		await this.applyTime(); // the map keeps its own lighting under every Act I mood
	}

	buildLightingControls(folder, rebuildLights) {
		if (this.mood) return;
		folder.add(this.settings, 'time', Object.fromEntries(Object.entries(this.times).map(([id, t]) => [t.label, id]))).name('Ánh sáng (mood)').onChange(async () => {
			this.app.settings.changed(this.id);
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
	}

	// ---- light groups (the night-lights going out one by one) -------------------------------------------------------------------------------------

	groupCount(g) {
		return this.model.lightGroups[g]?.count ?? 0;
	}

	applyGroups() {
		for (const g of Object.keys(this.model.lightGroups)) {
			const n = Math.min(this.groupCount(g), Math.max(0, Math.round(this.settings.groups[g] ?? 99)));
			this.settings.groups[g] = n;
			this.build?.setGroupLevel(g, n);
		}
	}

	/**
	 * Target of the scene's own lift (the far-view hemisphere boost and light-radius pool that keep the whole map readable in orbit views): a light group
	 * with `ambient: <floor>` pulls it down as its lights go out (floor + (1 − floor) · n / N), so the slider's darkness also shows in the far views.
	 * Play's own hero light radius is not touched.
	 */
	ambientTarget() {
		let k = 1;
		for (const [g, def] of Object.entries(this.model.lightGroups)) {
			if (def.ambient === undefined || !def.count) continue;
			k = Math.min(k, def.ambient + (1 - def.ambient) * ((this.settings.groups[g] ?? def.count) / def.count));
		}
		return k;
	}

	/** Lights and the scene lift jump to their targets now (captures render frames back to back). */
	snapLights() {
		this.build?.snapLevels();
		this._amb = this.ambientTarget();
	}

	// ---- overlays and legend --------------------------------------------------------------------------------------------------------------------

	applyOverlays() {
		for (const [k, on] of Object.entries(this.settings.overlays)) this.build?.setOverlay(k, !!on);
		this.showLegend(this.active && this.settings.legend);
	}

	showLegend(on) {
		if (!on) {
			this.legend?.remove();
			this.legend = null;
			return;
		}
		if (this.legend) return;
		const cats = [...new Set(Object.values(this.map.KIT).flatMap((k) => [k.category, ...(k.shape ?? []).map((p) => p.cat).filter(Boolean)]))].filter((c) => CATEGORY_LABELS[c]);
		const el = document.createElement('div');
		el.className = 'act1-legend';
		Object.assign(el.style, { position: 'absolute', left: '10px', bottom: '10px', zIndex: 5, padding: '6px 9px', borderRadius: '6px', background: 'rgba(8,9,11,0.72)', color: '#e8e2d2', font: '11px/1.45 system-ui, "Segoe UI", sans-serif', pointerEvents: 'none', maxWidth: '300px' });
		const sw = (c) => `<span style="display:inline-block;width:9px;height:9px;margin-right:5px;border-radius:2px;background:${c};vertical-align:-1px"></span>`;
		el.innerHTML = `<b>${this.plan.name}</b> · base map (blockout)<br>${cats.map((c) => `${sw(CATEGORY_COLORS[c])}${CATEGORY_LABELS[c]}`).join('<br>')}<br>${sw('#f2ecdf')}Đèn Perfection (đứng yên)${this.model.lights.some((l) => l.kind === 'human') ? `<br>${sw('#e0a050')}Đèn người (lập lòe)` : ''}<br>${sw(MARKER_COLORS.encounter)}Overlay: tab Environment`;
		this.app.dom.viewport.appendChild(el);
		this.legend = el;
	}

	// ---- panels -------------------------------------------------------------------------------------------------------------------------------------

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		const fx = () => (save(), this.applyEffectSettings());
		const state = { view: this.view };
		folder.add(state, 'view', Object.fromEntries(Object.entries(this.plan.views).map(([id, v]) => [v.label, id]))).name('Khung camera (beat)').onChange((v) => this.frame(v)).listen();
		if (this.model.segments.length) {
			folder.add(s, 'spawn', Object.fromEntries(this.model.segments.map((g) => [g.name, g.id]))).name('Điểm xuất phát (Play)').onChange(() => {
				save();
				this.placeSubject();
				if (this.app.gameplay?.active) this.app.gameplay.restart();
			});
		}
		folder.add(s, 'smooth', 0, 1, 0.01).name('Độ mịn (blend)').onChange((v) => (save(), this.setSmooth(v)));
		const groups = Object.entries(this.model.lightGroups);
		if (groups.length) {
			const fg = folder.addFolder('Ánh sáng Perfection (đứng yên)');
			for (const [g, def] of groups) fg.add(s.groups, g, 0, def.count, 1).name(def.slider ?? `${def.label ?? g}: còn lại`).onChange(() => (save(), this.applyGroups())).listen();
			fg.add(s, 'autoDim').name('Play: đèn tự tắt dần khi vào arena').onChange(save);
			fg.add(s, 'autoDimPeriod', 3, 30, 1).name('  ↳ mỗi (giây)').onChange(save);
			fg.add({ all: () => ((Object.keys(s.groups).forEach((g) => (s.groups[g] = this.groupCount(g)))), save(), this.applyGroups()) }, 'all').name('Thắp lại tất cả');
		}
		const fl = folder.addFolder('Vầng sáng nhân vật (light radius)');
		fl.add(s, 'lantern').name('Bật vầng sáng quanh nhân vật / tâm camera').onChange(fx);
		fl.add(s, 'lanternRadius', 3, 9, 0.1).name('Bán kính (m)').onChange(fx);
		fl.add(s, 'lanternStrength', 0, 2, 0.05).name('Độ sáng').onChange(fx);
		fl.add(s, 'lanternDim', 0, 0.8, 0.01).name('Tối dần ngoài vầng sáng').onChange(fx);
		const fo = folder.addFolder('Overlay (bản đồ thiết kế)');
		const ov = () => (save(), this.applyOverlays());
		fo.add(s.overlays, 'labels').name('Nhãn asset (id + tên + cỡ)').onChange(ov);
		fo.add(s.overlays, 'encounters').name('Chạm trán (quái, số lượng, boss)').onChange(ov);
		fo.add(s.overlays, 'telegraph').name('Bóng tay telegraph (sàn)').onChange(ov);
		fo.add(s, 'telegraphAnim').name('  ↳ xem thử nhịp đánh (bóng lớn dần → đập)').onChange(save);
		fo.add(s.overlays, 'landmarks').name('Mốc, tầm nhìn, vignette, vùng ru').onChange(ov);
		if (this.model.markers.some((m) => m.kind === 'rite')) fo.add(s.overlays, 'rites').name('Điểm nghi lễ').onChange(ov);
		fo.add(s.overlays, 'npc').name('Chỗ NPC').onChange(ov);
		fo.add(s.overlays, 'exits').name('Lối ra / nối map').onChange(ov);
		if (this.model.markers.some((m) => m.kind === 'patrol' || m.kind === 'escort')) {
			s.overlays.patrols ??= false;
			fo.add(s.overlays, 'patrols').name('Tuần tra + tầm nhìn (nón) · lối đưa ra').onChange(ov);
		}
		if (this.model.markers.some((m) => m.kind === 'bell')) {
			s.overlays.bells ??= false;
			fo.add(s.overlays, 'bells').name('Chuông ru (cơ chế): vùng ồn → chuông → Poppy Nurse ra từ hốc rễ').onChange(ov);
			fo.add(s, 'telegraphAnim').name('  ↳ xem thử: tiếng ồn lan ra từ chuông').onChange(save);
		}
		fo.add(s, 'legend').name('Chú giải nhỏ (góc màn hình)').onChange(ov);
		const fa = folder.addFolder('Không khí & tường');
		fa.add(s, 'wallFade').name('Tường / vật cao mờ dần giữa camera và tâm').onChange(save);
		fa.add(s, 'flicker').name('Đèn người lập lòe · Tường lung linh (Perfection luôn đứng yên)').onChange(save);
		if (this.plan.rain) {
			s.rain ??= 1;
			fa.add(s, 'rain', 0, 2, 0.05).name('Mưa ngoài vùng khô (× mood)').onChange(save);
		}
		if (this.build?.roofMeshes?.length) {
			s.roofs ??= true;
			fa.add(s, 'roofs').name('Mái nhà khi tâm ở ngoài trời (ẩn khi vào trong)').onChange(save);
		}
		const fd = folder.addFolder('Chi tiết mặt đất');
		fd.add(s, 'floorTone', 0.2, 1, 0.01).name('Độ sáng nền (albedo)').onChange(fx);
		fd.add(s, 'puddles', 0, 0.6, 0.01).name('Mực vũng nước (0 = không)').onChange(fx);
		fd.add(s, 'wetDarken', 0, 0.8, 0.01).name('Đất ẩm tối màu').onChange(fx);
		if (this.model.camps.length) {
			const fe = folder.addFolder('Quái (Play) · mô hình thay thế');
			fe.add(s, 'camps').name('Quái thường (theo id ASHLAR)').onChange(save);
			if (this.model.camps.some((c) => c.boss)) fe.add(s, 'boss').name('Boss (blockout ẩn khi Play)').onChange(save);
			fe.add({ respawn: () => this.app.gameplay?.spawnCamps?.() }, 'respawn').name('Gọi lại quái (đang Play)');
		}
		folder.add(s, 'showWeights').name('Debug: trọng số layer').onChange(fx);
		folder.add(s, 'subject').name('Nhân vật mẫu (thước 1.8 m)').onChange(() => (save(), this.placeSubject()));
		const counts = this.map.ASSETS.reduce((a, x) => ((a[x.status] = (a[x.status] ?? 0) + 1), a), {});
		note(folder, `${this.plan.note ?? ''}<br><b>Asset</b>: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' · ')} (báo cáo: docs/act1-base/ASSETS.md). Nạp: ${this.loadMs ? `${(this.loadMs / 1000).toFixed(1)} s` : '—'}.`);
		this._viewState = state;
	}

	// ---- Play -----------------------------------------------------------------------------------------------------------------------------------------

	/** The map's monster camps as lab stand-ins (scene.monsterCamps(), world xz), named after the ASHLAR ids. */
	monsterCamps() {
		const s = this.settings;
		return this.model.camps.filter((c) => (c.boss ? s.boss : s.camps)).map((c) => ({ x: c.at[0], z: c.at[1], monster: c.monster, pack: c.pack, count: c.count, mlvl: c.mlvl, radius: c.radius, name: `${c.id} ${c.name}` }));
	}

	onPlayStart() {
		this._dimT = 0;
		this._nameT = 0;
		this._groupsBeforePlay = { ...this.settings.groups }; // the auto-dim only lasts while Play runs
	}

	/** Play stopped: the night-lights the auto-dim put out come back (the slider shows the value from before Play again). */
	onPlayStop() {
		const saved = this._groupsBeforePlay;
		this._groupsBeforePlay = null;
		if (!saved) return;
		Object.assign(this.settings.groups, saved);
		this.applyGroups();
		this.app.settings.changed(this.id);
	}

	/**
	 * The host's packs keep the lab monster names ("Hollowed", "Pit Fiend"); every stand-in takes the ASHLAR id and name of the camp it came from
	 * (nearest camp of its type by its home point), so the HUD reads "P07 Cradle-Warden". Runs a few times a second in Play (camps can be respawned).
	 */
	nameCamps() {
		const gp = this.app.gameplay;
		if (!gp?.active || !gp.group) return;
		const off = gp.group.position; // gameplay space = world − offset
		const camps = this.monsterCamps();
		for (const m of gp.state.actors) {
			if (m.team !== 1 || m._ashlarName) continue;
			const x = m.home.x + off.x;
			const z = m.home.z + off.z;
			let best = null;
			let bd = Infinity;
			for (const c of camps) {
				if (c.monster !== m.type) continue;
				const d = Math.hypot(c.x - x, c.z - z);
				if (d < bd) {
					bd = d;
					best = c;
				}
			}
			if (best && bd < (best.radius ?? 2.5) + 6) {
				m.name = best.name;
				m._ashlarName = true;
			}
		}
	}

	updatePlay(delta, hero) {
		const s = this.settings;
		this._nameT = (this._nameT ?? 0) - delta;
		if (this._nameT <= 0) {
			this._nameT = 0.5;
			this.nameCamps();
		}
		if (!s.autoDim) return;
		const room = this.model.roomAt(hero.x, hero.z);
		if (room?.tag !== 'arena') return;
		this._dimT += delta;
		if (this._dimT < s.autoDimPeriod) return;
		this._dimT = 0;
		for (const g of Object.keys(this.model.lightGroups)) s.groups[g] = Math.max(1, (s.groups[g] ?? 0) - 1); // LD: a minimum light level stays
		this.applyGroups();
	}

	// ---- per frame -------------------------------------------------------------------------------------------------------------------------------------

	focusPoint() {
		const { app } = this;
		const subject = app.subject?.root;
		if (subject && (app.gameplay?.active || this.settings.subject)) return subject.getWorldPosition(this._focus);
		return this._focus.copy(app.rig.controls.target);
	}

	update(delta, elapsed) {
		if (this._viewState) this._viewState.view = this.view;
		const s = this.settings;
		const { app } = this;
		const focus = this.focusPoint();
		const cam = app.rig.persp.position;
		const dist = cam.distanceTo(focus);
		const u = this.wallFade.uniforms;
		u.focus.value.set(focus.x, focus.y + 0.9, focus.z);
		// the kept wall foot is a WORLD height in the shaders: put it 0.3 m above the floor under the focus (rooms sit at −4.2 … +2 m; a fixed 0.3 kept whole
		// walls of the low rooms from fading)
		const fadeFloor = this.model.floorY(focus.x, focus.z) + 0.3;
		u.params.value.set(THREE.MathUtils.clamp(dist * 0.12, 3.5, 9), s.wallFade ? 3 : 0, fadeFloor, 0);
		const gp = app.gameplay;
		const playing = !!(gp?.active && gp.player);
		this.anchor.visible = !!s.subject || playing;
		// far orbit views: the light radius grows with the camera distance so the whole map reads (Play and the sample character keep the set radius)
		const far = playing || s.subject ? 1 : THREE.MathUtils.clamp(dist / 14, 1, 4.5);
		// the scene's lift follows a group with `ambient` (the night-lights going out darken the room, not only their lamps); the far-view part of the light
		// radius follows it too, the hero's own radius in Play does not
		const ambT = this.ambientTarget();
		this._amb = this._amb === undefined || !(delta > 0) ? ambT : this._amb + (ambT - this._amb) * Math.min(1, delta / 0.6);
		const farK = THREE.MathUtils.lerp(1, this._amb, THREE.MathUtils.clamp(far - 1, 0, 1));
		const tu = this.effect.uniforms;
		tu.lantern.value.set(focus.x, focus.y, focus.z, s.lanternRadius * far);
		tu.lanternP.value.x = 2.2 * far;
		tu.lanternP.value.y = s.lantern ? s.lanternStrength * (1 + 0.1 * (far - 1)) * farK : 0;
		tu.lanternP.value.z = s.lantern ? s.lanternDim / far : 0;
		this.hemi.intensity = this.lights[0].base * (1 + 0.6 * (far - 1)) * this._amb;
		this.lanternLight.position.set(focus.x, focus.y + 2.0 * far, focus.z);
		this.lanternLight.distance = 7 * far;
		this.lanternLight.intensity = s.lantern ? 9 * s.lanternStrength * far ** 1.5 * farK * (this.lights[1].base > 0 ? this.lights[1].base : 1) : 0;
		if (playing) {
			if (this._player !== gp.player) {
				this._player = gp.player;
				this.onPlayStart();
			}
			const hero = gp.heroWorld?.(this._hero);
			if (hero && delta > 0) this.updatePlay(delta, hero);
		} else if (this._player) {
			this._player = null;
			this.onPlayStop();
		}
		if (this.build) {
			for (const m of this.build.monsterMeshes ?? []) m.visible = !(playing && s.boss);
			if (this.build.roofMeshes?.length) {
				const room = this.model.roomAt(focus.x, focus.z);
				const outdoors = !!s.roofs && (!room || !!room.outdoor);
				for (const m of this.build.roofMeshes) m.visible = outdoors;
			}
			const rain = (this.times[s.time]?.rain ?? 0) * (s.rain ?? 1);
			this.build.update(elapsed, delta, { camera: app.rig.camera ?? app.world?.camera, telegraph: s.telegraphAnim, flicker: s.flicker, focus, rain });
		}
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.group);
	}

	// ---- leaving --------------------------------------------------------------------------------------------------------------------------------------

	/**
	 * WebGL2: leaving frees everything (layer arrays, splat, build) and drops the scene from the App's cache, so coming back builds it again.
	 * WebGPU / webgpu-gl: a rebuilt scene renders black (the lab's known scene-switch bug), so it stays cached; only the layer arrays lose their GPU
	 * copies (they upload again from the CPU data). Textures bound to cached materials are never disposed there.
	 */
	activate() {
		this.active = true;
		this.app.world.vfxScene.add(this.vfx);
		this.showLegend(this.settings.legend);
	}

	deactivate() {
		this.active = false;
		this.showLegend(false);
		this.app.world.vfxScene.remove(this.vfx);
		if (this.app.backend.kind === 'webgl') {
			this.app.sceneCache.delete(this.id);
			if (this.app._act1Libraries) this.app._act1Libraries[this.mapId] = null;
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

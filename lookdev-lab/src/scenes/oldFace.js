// ASHLAR · The Old Face (Prologue, Level Design §10.1): the ossuary under Lychgate church, the game's first area. A fixed, hand-authored tutorial crawl built from the lab's own pieces:
// a horseshoe of bone niches round the hole in the Wall (the first light, cold white), a low passage of skull shelves, a collapsed niche to squeeze through, a knocking bay, a flooded step,
// and the stair up to the church door where Gennet's lantern (the second light, warm amber) appears. One LayerSplat + the N-layer terrain for the floor, the dungeon's wall modules
// (one instanced mesh), the radial hero light, ONE shadowed spot (the hole), 1/f candle flicker for the lantern, a slow shimmer for the Wall, and three small encounters in Play.
// Pure maths: env/oldFace.js (tested by scripts/old-face.test.mjs). Dressing: env/oldFaceDecor.js. Docs: HUONG_DAN.md §7k.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { LayerSplat, buildLayerLibrary, createLayerTerrain } from '../env/terrainLayers.js';
import { shaderMask, finalWeights } from '../env/biomeMix.js';
import { resetSample, layerWeightsAt, classifyLayers, applyWater } from '../env/surfaces.js';
import * as O from '../env/oldFace.js';
import { OldFaceDecor } from '../env/oldFaceDecor.js';
import { note } from '../ui/gui.js';

export const OLD_FACE_DEFAULTS = {
	look: 1,
	time: 'night',
	smooth: 0.8,
	antiTiling: true,
	variationScale: 0.18,
	macro: 0.1,
	showWeights: false,
	puddles: 0.2,
	wetDarken: 0.55,
	blendContrast: 0.65,
	floorTone: 0.34, // the floor's albedo multiplier: quiet, low-contrast stone in the near dark
	lantern: true, // the hero's light radius (small and cold here)
	lanternRadius: 4.4,
	lanternStrength: 0.4,
	lanternDim: 0.5,
	gennet: 'near', // 'near' = the lantern appears when the hero comes near (Play) · 'always'
	wallFade: true,
	flicker: true,
	wallShimmer: true,
	dust: true,
	decals: 1,
	props: true,
	subject: false,
	encounters: true,
	waterOpacity: 0.9,
	waterFlow: 1,
};
registerDefaults('oldFace', OLD_FACE_DEFAULTS);

const PITCH = THREE.MathUtils.degToRad(55);

// Lighting presets. The Prologue is night with no accent colour: a very low cold hemisphere under black-green depth fog; the dressing's lights do the work.
const TIMES = {
	night: {
		label: 'Prologue · đêm (mặc định)', hemi: 0.9, sky: '#4a5870', ground: '#1f2a24', env: 'hdri-night', envI: 0.03, toneMapping: 'aces', exposure: 0.85, lights: 1,
		fog: { enabled: true, color: '#070908', density: 0.075, falloff: 0.35, height: 0, start: 5, inscatter: 0.1 },
		grade: { vignette: 0.6, contrast: 1.12, saturation: 0.85, lift: 0, temperature: -0.04, tint: 0 },
	},
	lookdev: {
		label: 'Soi texture · sáng đều', hemi: 2.4, sky: '#c9d4e4', ground: '#3b352e', env: 'hdri-overcast', envI: 0.25, toneMapping: 'aces', exposure: 0.2, lights: 0.35,
		fog: { enabled: false },
		grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 },
	},
};

const SEGMENT_NOTE = '<b>A · Mặt Tường</b>: vòng móng ngựa 6 mô-đun xương (bán kính 6 m), <i>lỗ hổng</i> ở đỉnh phát sáng trắng lạnh (ánh sáng đầu tiên của game, nhấp nháy rất chậm), bảng "BE KIND TO THEM", ghế + chăn gấp + tro tẩu, giá sáp 30 đời nến. <b>B · Hành lang sọ</b>: hai dãy kệ sọ thấp, <i>tường ấm</i> rỉ nước với 3 hang chuột (E1). <b>C · Hốc sập</b>: mô-đun đổ nghiêng, cột gãy, đá lăn; khe lách hẹp ~2.1 m. <b>D1 · Hốc gõ</b>: phòng 7×6 m, hai hốc gõ (E2). <b>D2 · Bậc ngập nước</b>: bậc thấp 0.4 m, nước ~20 cm (E3). <b>E · Cầu thang</b>: 10 bậc đá thợ hồ lên khung cửa vòm nhà thờ, đèn Gennet (ánh sáng thứ hai, ấm) và tượng không mặt đầu tiên. Quái trong Play: "Mortar-Rat" = mô hình <i>spider</i>, "Shambler" = <i>zombie</i> (chưa có mô hình riêng).';

/** The ground textures packed into the layer arrays (once per app). */
async function loadLibrary(app) {
	app._oldFaceLibrary ??= buildLayerLibrary(app, O.layerIds().map((id) => ({ key: id, file: O.textureId(id) })));
	return app._oldFaceLibrary;
}

export class OldFaceScene {
	constructor(app) {
		this.app = app;
		this.id = 'oldFace';
		this.label = 'ASHLAR · Prologue · The Old Face (hầm xương)';
		this.moodKind = 'interior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'ASHLAR The Old Face';
		this.settings = app.settings.adopt('oldFace');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group(); // flames, glows, motes, dust puffs (rendered in the app's VFX layer)
		this.vfx.name = 'Old Face VFX';
		this.sun = { direction: new THREE.Vector3(0.3, 1, 0.2).normalize(), color: new THREE.Color(0, 0, 0) };
		this.lights = [];
		this.times = TIMES;
		this.postDefaults = null;
		this.view = 'overview';
		this.defaultSubject = 'd2r-sorceress'; // Play needs a character; the shader ball would not walk
		this.home = this.cameraFor('overview');
		this.lightScale = 1;
		this._focus = new THREE.Vector3();
		this._hero = new THREE.Vector3();
		this._weights = new Float32Array(8);
		this.lanternLevel = 0;
		this.lanternWanted = false; // Play: set once the hero reaches the flooded step / comes within 10 m of the door
		this.encounterState = O.ENCOUNTERS.map(() => ({ fired: false, t: 0, done: [], spawned: false, active: false }));
		this._player = null;
	}

	// ---- camera ----------------------------------------------------------------------------------------------------------------

	cameraFor(view) {
		const v = O.VIEWS[view] ?? O.VIEWS.overview;
		const { persp } = this.app.rig ?? {};
		const fov = persp?.fov ?? 35;
		const size = this.app.size ?? { w: 16, h: 9 };
		const aspect = size.w / size.h;
		const target = new THREE.Vector3(...v.target);
		if (v.dist) {
			const p = THREE.MathUtils.degToRad(v.pitch);
			return { position: new THREE.Vector3(target.x, target.y + v.dist * Math.sin(p), target.z + v.dist * Math.cos(p)), target, dist: v.dist };
		}
		const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
		const dist = Math.max(v.w / 2 / (t * aspect) + (v.d / 2) * Math.cos(PITCH), (v.d * Math.sin(PITCH)) / (2 * t) + v.d * Math.cos(PITCH) * 0.5) * 1.02;
		return { position: new THREE.Vector3(target.x, dist * Math.sin(PITCH), target.z + dist * Math.cos(PITCH)), target, dist };
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

	/** The anchor always sits at the spawn, in front of the hole (Play starts there); the toggle only shows the sample character. */
	placeSubject() {
		this.anchor.visible = !!this.settings.subject;
		this.anchor.position.set(O.SPAWN.x, O.floorY(O.SPAWN.x, O.SPAWN.z) + 0.02, O.SPAWN.z);
	}

	// ---- init ------------------------------------------------------------------------------------------------------------------

	async init() {
		const { app, scene, settings: s } = this;
		scene.add(this.anchor);
		scene.background = new THREE.Color(0x030404);
		if (s.look !== OLD_FACE_DEFAULTS.look) {
			Object.assign(s, OLD_FACE_DEFAULTS);
			delete app.settings.data.scenePost?.[this.id];
		}
		const library = await loadLibrary(app);
		this.library = library;
		this.group = new THREE.Group();
		this.group.name = 'The Old Face';
		scene.add(this.group);
		this.wallFade = app.backend.effects.createWallFade();
		this.buildLights();
		const sp = O.smoothParams(s.smooth);
		this.splat = new LayerSplat({ size: O.SPLAT.res, originX: O.SPLAT.cx - O.SPLAT.extent / 2, originZ: O.SPLAT.cz - O.SPLAT.extent / 2, extent: O.SPLAT.extent });
		this.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		const { material, effect } = createLayerTerrain(app, this.splat, library, O.LAYERS.map((l) => ({ key: l.id, tile: l.tile, ns: 0.5, mode: O.turnMode(l.id), porosity: O.porosity(l.id) })));
		this.material = material;
		this.effect = effect;
		this.applyEffectSettings();
		this.regenerate(false);
		this.decor = new OldFaceDecor({ app, group: this.group, vfx: this.vfx, splat: this.splat, library, material, settings: s, wallFade: this.wallFade });
		try {
			await this.decor.load();
			this.decor.lightScale = TIMES[s.time]?.lights ?? 1;
			this.decor.build();
			this.applyDressingVisibility();
			this.collectLights();
		} catch (error) {
			console.error('Old Face props / decals failed to load; the map stays bare', error);
			this.decor?.dispose();
			this.decor = null;
			this.buildBareFloor();
		}
		await this.applyTime();
		this.placeSubject();
	}

	/** Fallback when the dressing could not load: only the floor, so the scene still opens. */
	buildBareFloor() {
		const g = new THREE.PlaneGeometry(50, 20);
		g.rotateX(-Math.PI / 2);
		const mesh = new THREE.Mesh(g, this.material);
		mesh.position.set(-7, 0, -2);
		this.group.add(mesh);
		this.bareFloor = mesh;
	}

	// ---- ground ----------------------------------------------------------------------------------------------------------------

	/** What the hero stands on at world xz (env/surfaces.js, read by character/footsteps.js): the layer weights of the splat, standing water in the flooded step. */
	surfaceAt(x, z, out) {
		resetSample(out);
		if (!this.splat || O.wallDistance(x, z) < -0.3) return out;
		this._keys ??= O.LAYERS.map((l) => l.id);
		const wetness = layerWeightsAt(this.splat, O.LAYERS.length, x, z, shaderMask, finalWeights, O.smoothParams(this.settings.smooth), this._weights);
		classifyLayers(out, this._keys, this._weights, wetness);
		const depth = O.waterDepth(x, z);
		if (depth > 0) applyWater(out, depth, O.LEVEL.water);
		return out;
	}

	fillSplat(sp) {
		const masks = O.makeMasks(sp);
		const tmp = new Float32Array(8);
		this.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		this.splat.fill((x, z, out) => {
			tmp.fill(0);
			masks(x, z, tmp);
			for (let i = 1; i < O.LAYERS.length; i++) out[i - 1] = tmp[i];
			out[7] = tmp[7];
		});
	}

	regenerate(scatter = true) {
		this.fillSplat(O.smoothParams(this.settings.smooth));
		if (scatter) this.decor?.scatterDecals();
	}

	applyEffectSettings() {
		const s = this.settings;
		const sp = O.smoothParams(s.smooth);
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
		u.waterY.value = O.LEVEL.water; // no puddles under the standing water
		u.sky.value.copy(this.skyTint ?? u.sky.value);
		u.debug.value = s.showWeights ? 1 : 0;
		this.material.color.setScalar(this.settings.time === 'lookdev' ? 1 : s.floorTone);
		// the hero's light radius: small and cold here (the Wall's light is behind the hero, the lantern's is ahead)
		u.lanternColor.value.setRGB(0.5, 0.52, 0.5);
		u.lantern.value.w = s.lanternRadius;
		u.lanternP.value.set(2.2, s.lantern ? s.lanternStrength : 0, s.lantern ? s.lanternDim : 0, 0);
	}

	setSmooth(v) {
		this.settings.smooth = v;
		this.applyEffectSettings();
		clearTimeout(this._regen);
		this._regen = setTimeout(() => this.regenerate(), 120);
	}

	// ---- lights ----------------------------------------------------------------------------------------------------------------

	buildLights() {
		this.hemi = new THREE.HemisphereLight(0x53627a, 0x1f2a24, 1);
		this.hemi.name = 'Cold ambient (sky / ground)';
		this.scene.add(this.hemi);
		// the hero's light (props, walls and the hero itself; the ground gets the shader pool too): unshadowed, finite, cold
		this.lanternLight = new THREE.PointLight(kelvinToColor(6500), 0, 7, 1.6);
		this.lanternLight.name = 'Hero light (cold)';
		this.scene.add(this.lanternLight);
		this.lights = [
			{ name: 'Cold ambient', light: this.hemi, base: 1 },
			{ name: 'Hero light', light: this.lanternLight, kelvin: 6500, base: 0 },
		];
	}

	/** After the dressing exists: the hole's shadowed spot and cold lift join the Lighting panel's list. */
	collectLights() {
		const d = this.decor;
		if (!d) return;
		this.lights.push({ name: 'The hole (shadowed spot)', light: d.spot, kelvin: 8500, base: d.spot.intensity });
		this.lights.push({ name: 'The hole (cold lift)', light: d.lift.light, kelvin: 8500, base: d.lift.base });
		this.lights.push({ name: "Gennet's lantern", light: d.lanternSource.light, kelvin: 2400, base: d.lanternSource.base });
	}

	applyRigIntensity() {
		for (const l of this.lights) if (l.light === this.hemi) l.light.intensity = l.base;
	}

	wetRoots() {
		return [];
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	async applyTime() {
		const t = this.times[this.settings.time] || this.times.night;
		this.hemi.color.set(t.sky);
		this.hemi.groundColor.set(t.ground);
		this.lights[0].base = t.hemi;
		this.applyRigIntensity();
		this.lightScale = t.lights;
		if (this.decor) this.decor.lightScale = t.lights;
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		if (this.disposed) return env.dispose?.();
		const previous = this._env;
		this._env = this.scene.environment = env;
		if (previous && previous !== env) previous.dispose?.();
		this.scene.environmentIntensity = t.envI;
		this.scene.background = new THREE.Color(0x030404);
		this.skyTint = new THREE.Color(t.sky).multiplyScalar((t.hemi / Math.PI) * 0.6);
		this.applyEffectSettings();
		this.postDefaults = { toneMapping: t.toneMapping, exposure: t.exposure, fog: { enabled: false, height: 0, ...t.fog }, grade: { vignette: 0.3, ...t.grade } };
	}

	async applyMood(block) {
		this.mood = block;
		await this.applyTime(); // the Prologue keeps its own lighting under every mood
	}

	// ---- panels ----------------------------------------------------------------------------------------------------------------

	buildLightingControls(folder, rebuildLights) {
		if (this.mood) return;
		folder.add(this.settings, 'time', Object.fromEntries(Object.entries(this.times).map(([id, t]) => [t.label, id]))).name('Ánh sáng').onChange(async () => {
			this.app.settings.changed(this.id);
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
	}

	applyDressingVisibility() {
		const s = this.settings;
		if (!this.decor) return;
		this.decor.props.visible = s.props;
		if (this.decor.points) this.decor.points.visible = s.dust;
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		const fx = () => (save(), this.applyEffectSettings());
		const state = { view: this.view };
		folder.add(state, 'view', Object.fromEntries(Object.entries(O.VIEWS).map(([id, v]) => [v.label, id]))).name('Khu vực (khung camera)').onChange((v) => this.frame(v)).listen();
		folder.add(s, 'smooth', 0, 1, 0.01).name('Độ mịn (blend)').onChange((v) => (save(), this.setSmooth(v)));
		const fl = folder.addFolder('Vầng sáng nhân vật (light radius)');
		fl.add(s, 'lantern').name('Bật vầng sáng quanh nhân vật / tâm camera').onChange(fx);
		fl.add(s, 'lanternRadius', 3, 9, 0.1).name('Bán kính (m)').onChange(fx);
		fl.add(s, 'lanternStrength', 0, 2, 0.05).name('Độ sáng').onChange(fx);
		fl.add(s, 'lanternDim', 0, 0.8, 0.01).name('Tối dần ngoài vầng sáng').onChange(fx);
		const fg = folder.addFolder('Ánh sáng của Tường & đèn Gennet');
		fg.add(s, 'gennet', { 'Hiện khi tới gần (Play)': 'near', 'Luôn sáng': 'always' }).name('Đèn lồng Gennet').onChange(save);
		fg.add(s, 'wallShimmer').name('Ánh sáng Tường lập lòe chậm (shimmer)').onChange(save);
		fg.add(s, 'flicker').name('Đèn Gennet chập chờn (1/f)').onChange(save);
		const fa = folder.addFolder('Không khí');
		fa.add(s, 'wallFade').name('Tường mờ dần giữa camera và tâm (dither)').onChange(save);
		fa.add(s, 'dust').name('Bụi lơ lửng').onChange(() => (save(), this.applyDressingVisibility()));
		const fd = folder.addFolder('Chi tiết mặt đất');
		fd.add(s, 'decals', 0, 2, 0.05).name('Decal (xương, sáp, vết nứt, đá…) mật độ').onFinishChange(() => (save(), this.decor?.scatterDecals()));
		fd.add(s, 'props').name('Prop 3D (đống xương, nến, cột gãy, đá…)').onChange(() => (save(), this.applyDressingVisibility()));
		fd.add(s, 'puddles', 0, 0.6, 0.01).name('Mực vũng nước (0 = không)').onChange(fx);
		fd.add(s, 'wetDarken', 0, 0.8, 0.01).name('Đất ẩm tối màu').onChange(fx);
		fd.add(s, 'floorTone', 0.2, 1, 0.01).name('Độ sáng nền đá (albedo)').onChange(fx);
		const fe = folder.addFolder('Quái (Play)');
		fe.add(s, 'encounters').name('Bật 3 cuộc chạm trán (E1 · E2 · E3)').onChange(save);
		fe.add({ rearm: () => this.rearm() }, 'rearm').name('Gọi lại quái (đặt lại các cú kích hoạt)');
		fe.add({ hand: () => this.crumbleHand() }, 'hand').name('Bụi bàn tay vỡ vụn (xem thử)');
		folder.add(s, 'showWeights').name('Debug: trọng số layer').onChange(fx);
		folder.add(s, 'subject').name('Nhân vật mẫu (thước 1.8 m)').onChange(() => (save(), this.placeSubject()));
		note(folder, SEGMENT_NOTE);
		this._viewState = state;
	}

	// ---- Play: the hand, the lantern, the encounters ---------------------------------------------------------------------------

	/** "The hand crumbling": a pale dust burst at the hole's foot (once when Play starts). */
	crumbleHand() {
		const { apex } = O.FACE;
		this.decor?.puff(apex.x - 0.1, 0.1, apex.z + 0.65, { count: 26, kind: 'hand', spread: 1.1 });
		setTimeout(() => this.decor?.puff(apex.x + 0.1, 0.1, apex.z + 0.7, { count: 12, kind: 'hand', spread: 0.8 }), 450);
	}

	/** Reset every trigger (Play start, the panel's button): the encounters can fire again; living monsters stay. */
	rearm() {
		this.encounterState = O.ENCOUNTERS.map(() => ({ fired: false, t: 0, done: [], spawned: false, active: false }));
	}

	onPlayStart() {
		this.rearm();
		this.lanternWanted = false;
		if (this.settings.gennet !== 'always') this.lanternLevel = 0; // Play begins in the dark: the lantern appears when the hero gets near
		this.crumbleHand();
	}

	updatePlay(delta, hero) {
		const gp = this.app.gameplay;
		if (!this.lanternWanted) {
			// the flooded step, or the foot of the stair: seen from the water the lantern appears at the top
			if (hero.x > O.FLOOD.x0 || Math.hypot(hero.x - O.DOOR.x, hero.z - O.DOOR.z) < 10) this.lanternWanted = true;
		}
		if (!this.settings.encounters) return;
		for (let i = 0; i < O.ENCOUNTERS.length; i++) {
			const enc = O.ENCOUNTERS[i];
			const st = this.encounterState[i];
			if (!st.fired && O.triggerHit(enc, hero.x, hero.z)) {
				st.fired = st.active = true;
				st.t = 0;
				st.done.length = 0;
				st.spawned = false;
			}
			if (!st.active) continue;
			st.t += delta;
			for (let k = 0; k < enc.cues.length; k++) {
				const cue = enc.cues[k];
				if (st.t < cue.delay || st.done[k]) continue;
				st.done[k] = true;
				this.decor?.puff(cue.x, 0.25, cue.z, { count: 16, kind: 'mortar', spread: 0.9 });
			}
			if (!st.spawned && st.t >= enc.spawnAfter) {
				st.spawned = true;
				for (const group of enc.spawn) {
					for (const at of group.at) gp.spawnAt?.({ type: group.type, x: at[0], z: at[1], mlvl: group.mlvl, name: group.name, rise: !!group.rise });
				}
			}
			if (st.spawned && st.t > enc.spawnAfter + 2.5) st.active = false;
		}
	}

	// ---- per frame -------------------------------------------------------------------------------------------------------------

	/** The point the wall fade and the hero light follow: the hero (Play, or the sample character), else the camera's target. */
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
		// the wall fade: a cylinder round the line of sight to the focus, scaled with the camera distance
		const dist = cam.distanceTo(focus);
		const u = this.wallFade.uniforms;
		u.focus.value.set(focus.x, focus.y + 0.9, focus.z);
		u.params.value.set(THREE.MathUtils.clamp(dist * 0.12, 3.5, 9), s.wallFade ? 3 : 0, 0.3, 0); // strength 3: the cylinder's core is a clean cut and its rim and foot are only a narrow dithered band
		// the hero's light: a pool on the ground (shader) + a cold light for the props / walls
		// Play
		const gp = app.gameplay;
		const playing = !!(gp?.active && gp.player);
		this.anchor.visible = !!s.subject || playing; // the hero is the subject: shown in Play whatever the sample-character toggle says
		// in the far orbit views the radius grows with the camera distance, so the whole map still reads (Play and the sample character keep the set radius)
		const far = playing || s.subject ? 1 : THREE.MathUtils.clamp(dist / 14, 1, 4.5);
		this.effect.uniforms.lantern.value.set(focus.x, focus.y, focus.z, s.lanternRadius * far);
		this.effect.uniforms.lanternP.value.x = 2.2 * far;
		this.effect.uniforms.lanternP.value.y = s.lantern ? s.lanternStrength * (1 + 0.1 * (far - 1)) : 0;
		this.hemi.intensity = this.lights[0].base * (1 + 0.8 * (far - 1)); // far orbit views: the cold floor under everything rises a little so the whole map reads
		this.lanternLight.position.set(focus.x, focus.y + 2.0 * far, focus.z);
		this.lanternLight.distance = 7 * far;
		this.lanternLight.intensity = s.lantern ? 9 * s.lanternStrength * far ** 1.5 : 0;
		let target = 1; // outside Play the lantern is lit
		if (playing) {
			if (this._player !== gp.player) {
				this._player = gp.player;
				this.onPlayStart();
			}
			const hero = gp.heroWorld?.(this._hero);
			if (hero && delta > 0) this.updatePlay(delta, hero);
			target = s.gennet === 'always' || this.lanternWanted ? 1 : 0;
		} else this._player = null;
		if (playing) this.lanternLevel += THREE.MathUtils.clamp(target - this.lanternLevel, -delta / 2.5, delta / 2.5);
		else this.lanternLevel = 1; // orbit views: lit at once
		if (this.decor) {
			this.decor.lantern = s.gennet === 'always' ? 1 : this.lanternLevel;
			this.decor.update(elapsed, delta);
		}
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.group);
	}

	// ---- leaving ---------------------------------------------------------------------------------------------------------------

	/**
	 * Leaving the scene (the App keeps scenes cached and never calls dispose). WebGL2: everything is freed (the layer arrays, atlases, props, splat) and the scene leaves the
	 * App's cache, so coming back builds it again. WebGPU / webgpu-gl: a rebuilt scene renders black (the lab's known scene-switch bug), so it stays cached and only the layer
	 * arrays lose their GPU copies (they upload again from the CPU data); textures bound to cached materials are NOT disposed.
	 */
	activate() {
		this.app.world.vfxScene.add(this.vfx);
	}

	deactivate() {
		this.app.world.vfxScene.remove(this.vfx);
		if (this.app.backend.kind === 'webgl') {
			this.app.sceneCache.delete(this.id);
			this.app._oldFaceLibrary = null;
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
		this.bareFloor?.geometry.dispose();
		this.decor?.dispose();
		this._env?.dispose?.();
	}
}

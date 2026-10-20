// Atmosphere: GPU particles that fill the air of the Act I maps — dust motes catching the light, falling ash with a few
// embers, dead leaves skimming on the wind, fireflies over the water, wisps over the graves, blood spores rising off the
// Redbound ground, moths round the lamps, low fog.
//
// Each layer is ONE instanced draw (shaders/vfx/atmosphere.*.glsl, TSL twin in backends/webgpu/vfx.js) whose
// instances are only random seeds: place, drift, wander, tumble, blink and light are functions of time in the vertex
// shader, so nothing is simulated or uploaded per particle — the CPU sets a handful of uniforms a frame (the box round the
// view, the wind, the eight lights nearest the view, the moths' lamps) whatever the particle count. The CPU emitters of
// vfx/particles.js stay for effects with a life (fire, smoke, spells).
//
// A layer wraps in a box that follows the view on x / z and lies on the scene's ground: a height map baked once from
// scene.height(x, z) and read in the vertex shader (four texel loads, no sampler). The box's edges fade, so particles
// are anchored in the world and come in softly as the view moves. Zones (circles) keep a layer to its place: fireflies
// over the creek, spores on blood-soaked ground. Layers lit by the scene take three's point-light falloff from the
// nearest lights plus the sky ambient, so dust shows in the hero's light radius and round the fires and stays dark
// elsewhere — the Diablo II night. Presets per scene below; Environment tab → Scene options → Atmosphere.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { note, readout } from '../ui/gui.js';
import { rng } from './kit.js';

registerDefaults('atmosphere', { enabled: true, density: 1, scenes: {} }); // scenes[id][layer] = { on, amount }

const SHAPES = { mote: 0, flake: 1, leaf: 2, wisp: 3, glow: 4, moth: 5 };
const LIGHTS = 8;
const ZONES = 6;
const ANCHORS = 8;

/**
 * Layer kinds. box [x, band height, z] (m) round the view; base: band bottom above the ground; wind: share of the scene's
 * wind (m/s); drift: own velocity; fall: m/s down the band (< 0 rises); wander [m, rate]; skim: hugs the ground, lifted
 * by gusts; tumble rad/s; size [min, max] m; colors (albedo pair); lit: share of the scene's light it takes (the point
 * lights, plus the sky ambient × `ambient`); glow [hex, HDR intensity] for `glowShare` of the particles, which blink with
 * `blink` [period s, lit part]; time [day, night] visibility; dry: settles in the mood's rain; order: draw order in the
 * VFX layer.
 */
export const KINDS = {
	motes: {
		label: 'Bụi lơ lửng (bắt ánh đèn)', shape: 'mote', count: 1500, box: [32, 4.5, 32], base: 0.1, wind: 0.06, drift: [0, 0.02, 0], fall: 0,
		wander: [0.4, 0.18], tumble: 0.3, size: [0.03, 0.06], colors: ['#f2e6d0', '#7a6d5c'], lit: 2.4, ambient: 0.03, alpha: 0.8,
		additive: 1, softness: 0.2, time: [0.15, 1], dry: true, order: 9,
	},
	ash: {
		label: 'Tro bay + tàn lửa', shape: 'flake', count: 1500, box: [30, 10, 30], base: 0, wind: 0.5, drift: [0, 0, 0], fall: 0.32,
		wander: [0.3, 0.55], tumble: 3, size: [0.035, 0.07], colors: ['#6e6a66', '#9a948c'], lit: 1.6, ambient: 0.6, alpha: 0.85, additive: 0,
		softness: 0.1, glow: ['#ff8a3a', 8], glowShare: 0.06, time: [1, 1], dry: true, order: 7,
	},
	leaves: {
		label: 'Lá khô theo gió', shape: 'leaf', count: 300, box: [36, 1.2, 36], base: 0.02, wind: 1.4, drift: [0, 0, 0], fall: 0,
		wander: [0.5, 0.6], skim: true, tumble: 5, size: [0.1, 0.16], colors: ['#4d3a22', '#7a5c30'], lit: 1.1, ambient: 0.7, alpha: 1,
		additive: 0, softness: 0.04, time: [1, 1], dry: true, order: 7,
	},
	fireflies: {
		label: 'Đom đóm (bờ suối)', shape: 'glow', count: 220, box: [36, 2.4, 36], base: 0.3, wind: 0.04, drift: [0, 0, 0], fall: 0,
		wander: [0.9, 0.16], tumble: 0, size: [0.14, 0.22], colors: ['#000000'], lit: 0, ambient: 0, alpha: 1, additive: 1, softness: 0.05,
		glow: ['#d4ff7a', 5], glowShare: 1, blink: [4.5, 0.4], time: [0, 1], dry: true, order: 9,
	},
	wisps: {
		label: 'Hồn ma lập lòe (mộ)', shape: 'glow', count: 50, box: [30, 2.5, 30], base: 0.4, wind: 0.02, drift: [0, 0, 0], fall: 0,
		wander: [1.4, 0.07], tumble: 0, size: [0.3, 0.5], colors: ['#000000'], lit: 0, ambient: 0, alpha: 1, additive: 1, softness: 0.1,
		glow: ['#9fdcff', 3.5], glowShare: 1, blink: [9, 0.75], time: [0.1, 1], order: 9,
	},
	spores: {
		label: 'Bào tử máu bốc lên (nhiễm huyết)', shape: 'mote', count: 450, box: [26, 4, 26], base: 0.05, wind: 0.06, drift: [0, 0.14, 0], fall: 0,
		wander: [0.35, 0.3], tumble: 0.2, size: [0.04, 0.07], colors: ['#3a0805'], lit: 0.5, ambient: 0.2, alpha: 0.9, additive: 1,
		softness: 0.1, glow: ['#ff2a18', 2.6], glowShare: 1, blink: [6, 0.85], time: [0.6, 1], order: 9,
	},
	moths: {
		label: 'Bướm đêm quanh đèn', shape: 'moth', count: 40, anchors: true, box: [1, 1, 1], base: 0, wind: 0, drift: [0, 0, 0], fall: 0,
		wander: [0, 0], tumble: 0.4, size: [0.06, 0.09], colors: ['#8a8174', '#b3a894'], lit: 0.3, ambient: 0.05, alpha: 1, additive: 0,
		softness: 0.02, time: [0, 1], dry: true, order: 8,
	},
	fog: {
		label: 'Sương thấp trôi', shape: 'wisp', count: 60, box: [44, 1.2, 44], base: 0.15, wind: 0.2, drift: [0, 0, 0], fall: 0,
		wander: [0.7, 0.05], tumble: 0.1, size: [3, 6], colors: ['#7c8a86', '#5f6b67'], lit: 1, ambient: 1.2, alpha: 0.1, additive: 0,
		softness: 1.5, time: [0.4, 1], order: 4,
	},
};

/**
 * Layers per scene id: kind → overrides (zones [[x, z, r], …] up to six; `on: false` = present but off by default). The scenes
 * that are left (studio, Dark Wood, Bố trí biome) carry no GPU atmosphere yet; a scene gets one by adding its id here.
 */
export const SCENE_ATMOSPHERE = {};

/** Visibility by time of day (the scenes' presets) — the Act I moods are all dark. */
const NIGHT = { night: 1, nightCamp: 1, campfire: 0.75, dusk: 0.65, overcast: 0, day: 0 };

/** Ground heights of a scene on a grid (texelFetch'd in the vertex shader): scene.height(x, z), or flat. */
function groundMap(entry) {
	let x0 = -64;
	let z0 = -64;
	let size = 128;
	if (entry.splat?.extent) {
		x0 = entry.splat.originX;
		z0 = entry.splat.originZ;
		size = entry.splat.extent;
	} else if (entry.ground?.geometry) {
		const box = new THREE.Box3().setFromObject(entry.ground);
		x0 = box.min.x;
		z0 = box.min.z;
		size = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
	}
	const height = typeof entry.height === 'function' ? (x, z) => entry.height(x, z) : null;
	const n = height ? 160 : 2;
	const data = new Float32Array(n * n);
	for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) data[j * n + i] = height ? height(x0 + ((i + 0.5) * size) / n, z0 + ((j + 0.5) * size) / n) : entry.floorY ?? 0;
	const texture = new THREE.DataTexture(data, n, n, THREE.RedFormat, THREE.FloatType);
	texture.minFilter = texture.magFilter = THREE.NearestFilter;
	texture.generateMipmaps = false;
	texture.name = 'Atmosphere ground heights';
	texture.needsUpdate = true;
	return { texture, rect: new THREE.Vector4(x0, z0, size, n) };
}

/** One layer: an instanced quad per particle, seeds only. */
class Layer {
	constructor(app, id, overrides, ground, seed) {
		const cfg = (this.cfg = { ...KINDS[id], ...overrides });
		this.id = id;
		this.max = cfg.count;
		this.zones = Array.from({ length: ZONES }, () => new THREE.Vector4());
		(cfg.zones ?? []).slice(0, ZONES).forEach(([x, z, r], i) => this.zones[i].set(x, z, r, 1));
		this.anchors = Array.from({ length: ANCHORS }, () => new THREE.Vector4());
		this.lights = Array.from({ length: LIGHTS }, () => new THREE.Vector4(0, -1e4, 0, 1));
		this.lightColors = Array.from({ length: LIGHTS }, () => new THREE.Vector4(0, 0, 0, 2));
		const glow = new THREE.Color(cfg.glow?.[0] ?? '#000000').multiplyScalar(cfg.glow?.[1] ?? 0);
		const { material, uniforms } = app.backend.vfx.atmosphereMaterial({
			focus: new THREE.Vector3(),
			box: new THREE.Vector3(...cfg.box),
			base: cfg.base,
			velocity: new THREE.Vector3(),
			fall: cfg.fall,
			wander: new THREE.Vector2(...cfg.wander),
			skim: cfg.skim ? 1 : 0,
			tumble: cfg.tumble,
			size: new THREE.Vector2(...cfg.size),
			shape: SHAPES[cfg.shape],
			colorA: new THREE.Color(cfg.colors[0]),
			colorB: new THREE.Color(cfg.colors[1] ?? cfg.colors[0]),
			glow: new THREE.Vector4(glow.r, glow.g, glow.b, cfg.glowShare ?? 0),
			blink: new THREE.Vector2(...(cfg.blink ?? [0, 1])),
			lit: cfg.lit,
			ambient: new THREE.Color(),
			alpha: cfg.alpha,
			additive: cfg.additive,
			softness: cfg.softness,
			anchorCount: 0,
			anchors: this.anchors,
			zones: this.zones,
			zoned: cfg.zones?.length ? 1 : 0,
			lights: this.lights,
			lightColors: this.lightColors,
			ground: ground.texture,
			groundRect: ground.rect,
		});
		this.material = material;
		this.uniforms = uniforms;
		// Seeds for twice the preset count (the density slider goes to 2×); the draw uses the first instanceCount.
		const base = new THREE.PlaneGeometry(1, 1);
		const g = new THREE.InstancedBufferGeometry();
		g.index = base.index;
		g.setAttribute('position', base.attributes.position);
		g.setAttribute('uv', base.attributes.uv);
		const r = rng(seed);
		const seeds = new Float32Array(this.max * 2 * 4);
		for (let i = 0; i < seeds.length; i++) seeds[i] = r();
		g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
		g.instanceCount = this.max;
		this.geometry = g;
		this.mesh = new THREE.Mesh(g, material);
		this.mesh.name = `Atmosphere · ${cfg.label}`;
		this.mesh.frustumCulled = false; // the box follows the view
		this.mesh.renderOrder = cfg.order;
		this.mesh.userData.labNoView = true;
		this.drawn = 0;
	}

	/** Per frame: count, visibility and the uniforms that follow the view, the wind and the lights. */
	update(ctx, state) {
		const cfg = this.cfg;
		const u = this.uniforms;
		const time = THREE.MathUtils.lerp(cfg.time[0], cfg.time[1], ctx.night);
		const alpha = cfg.alpha * time * (cfg.dry ? 1 - ctx.rain : 1);
		const count = Math.round(this.max * Math.min(2, ctx.density * state.amount));
		let anchors = 0;
		if (cfg.anchors) {
			anchors = Math.min(ANCHORS, ctx.anchors.length);
			for (let i = 0; i < anchors; i++) this.anchors[i].copy(ctx.anchors[i]);
			u.anchorCount.value = anchors;
		}
		const on = ctx.enabled && state.on && count > 0 && alpha > 0.01 && (!cfg.anchors || anchors > 0);
		this.mesh.visible = on;
		this.drawn = on ? count : 0;
		if (!on) return 0;
		this.geometry.instanceCount = count;
		u.alpha.value = alpha;
		u.focus.value.copy(ctx.focus);
		u.velocity.value.copy(ctx.wind).multiplyScalar(cfg.wind).add(_v.fromArray(cfg.drift));
		u.ambient.value.copy(ctx.ambient).multiplyScalar(cfg.ambient);
		for (let i = 0; i < LIGHTS; i++) {
			this.lights[i].copy(ctx.lights[i]);
			this.lightColors[i].copy(ctx.lightColors[i]);
		}
		return count;
	}
}

const _v = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();

/** The layers of one scene build, its ground map and the lights it can borrow. */
class Field {
	constructor(app, entry, preset) {
		this.app = app;
		this.entry = entry;
		this.ground = groundMap(entry);
		this.group = new THREE.Group();
		this.group.name = 'Atmosphere (GPU particles)';
		this.group.userData.labNoView = true;
		this.layers = Object.entries(preset.layers).map(([id, overrides], i) => new Layer(app, id, overrides, this.ground, 7001 + i * 131));
		for (const layer of this.layers) this.group.add(layer.mesh);
		this.lights = [];
		this.frame = 0;
		this.ctx = {
			focus: new THREE.Vector3(),
			wind: new THREE.Vector3(),
			ambient: new THREE.Color(),
			lights: Array.from({ length: LIGHTS }, () => new THREE.Vector4(0, -1e4, 0, 1)),
			lightColors: Array.from({ length: LIGHTS }, () => new THREE.Vector4(0, 0, 0, 2)),
			anchors: [],
			anchorPool: Array.from({ length: 32 }, () => new THREE.Vector4()),
			night: 1,
			rain: 0,
			density: 1,
			enabled: true,
		};
	}

	/** Lights of the scene (point, spot, hemisphere, ambient, directional) — rescanned now and then (moods add lights). */
	scan() {
		this.lights = [];
		this.entry.scene.traverse((o) => {
			if (o.isLight) this.lights.push(o);
		});
	}

	update(settings, states) {
		const app = this.app;
		const entry = this.entry;
		const ctx = this.ctx;
		if (this.frame++ % 60 === 0) this.scan();
		ctx.enabled = settings.enabled;
		ctx.density = settings.density;
		ctx.focus.copy(app.rig.controls.target);
		const mood = app.mood?.active ? app.mood : null;
		ctx.night = mood || entry.moodKind === 'interior' ? 1 : NIGHT[entry.settings?.time] ?? 0.6;
		ctx.rain = mood && !mood.indoors ? Math.min(1, mood.live.rain ?? 0) : 0;
		// Wind: the mood's (as its rain uses it), else the scene's grass wind (strength, direction °) — leaves blow the
		// way the grass sways. Strength 0.3 ≈ 1.5 m/s.
		if (mood) ctx.wind.set(Math.cos(0.6), 0, Math.sin(0.6)).multiplyScalar((mood.live.wind ?? 0) * 4);
		else {
			const w = entry.windGrass?.uniforms;
			const angle = THREE.MathUtils.degToRad(w?.direction?.value ?? 35);
			ctx.wind.set(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar((w?.strength?.value ?? entry.settings?.wind ?? 0.25) * 5);
		}
		// Lights: ambient from the sky / ambient / directional lights; the eight point and spot lights that matter most at the
		// view (intensity over distance², within reach of the box); moths take the small lamps near the view.
		ctx.ambient.setRGB(0, 0, 0);
		const near = [];
		ctx.anchors.length = 0;
		for (const light of this.lights) {
			if (!shown(light) || light.intensity <= 0) continue;
			if (light.isHemisphereLight) ctx.ambient.add(_c.copy(light.color).add(light.groundColor).multiplyScalar(0.5 * light.intensity));
			else if (light.isAmbientLight) ctx.ambient.add(_c.copy(light.color).multiplyScalar(light.intensity));
			else if (light.isDirectionalLight) ctx.ambient.add(_c.copy(light.color).multiplyScalar(light.intensity * 0.15)); // scattered moonlight
			else if (light.isPointLight || light.isSpotLight) {
				light.getWorldPosition(_p);
				const range = light.distance > 0 ? light.distance : 40;
				const d2 = _p.distanceToSquared(ctx.focus);
				if (d2 > (range + 26) ** 2) continue;
				near.push({ light, x: _p.x, y: _p.y, z: _p.z, range, score: light.intensity / Math.max(1, d2) });
				if (light.isPointLight && light.intensity <= 25 && d2 < 26 * 26 && ctx.anchors.length < ctx.anchorPool.length) {
					ctx.anchors.push(ctx.anchorPool[ctx.anchors.length].set(_p.x, _p.y - 0.15, _p.z, 0.6 + Math.min(0.5, light.intensity * 0.02))); // lamps, torches, candles
				}
			}
		}
		near.sort((a, b) => b.score - a.score);
		for (let i = 0; i < LIGHTS; i++) {
			const n = near[i];
			if (!n) {
				ctx.lights[i].set(0, -1e4, 0, 1);
				ctx.lightColors[i].set(0, 0, 0, 2);
				continue;
			}
			const c = n.light.color;
			ctx.lights[i].set(n.x, n.y, n.z, n.range);
			ctx.lightColors[i].set(c.r * n.light.intensity, c.g * n.light.intensity, c.b * n.light.intensity, n.light.decay);
		}
		ctx.anchors.sort((a, b) => (a.x - ctx.focus.x) ** 2 + (a.z - ctx.focus.z) ** 2 - ((b.x - ctx.focus.x) ** 2 + (b.z - ctx.focus.z) ** 2));
		let count = 0;
		for (const layer of this.layers) count += layer.update(ctx, states(layer));
		return count;
	}
}

/** Visible in the scene graph (a light hidden with its group does not count). */
function shown(object) {
	for (let o = object; o; o = o.parent) if (!o.visible) return false;
	return true;
}

/** The app's atmosphere: the current scene's layers in the VFX layer, updated every frame. */
export class Atmosphere {
	constructor(app) {
		this.app = app;
		this.settings = app.settings.adopt('atmosphere');
		this.fields = new WeakMap(); // scene entry -> Field (a rebuilt scene is a new entry)
		this.field = null;
		this.count = 0;
		this.ms = 0;
		this.show = null;
		app.on('scene', (entry) => this.onScene(entry));
		app.on('update', () => this.update());
		if (app.current) this.onScene(app.current);
	}

	onScene(entry) {
		this.field?.group.removeFromParent();
		this.field = null;
		this.count = 0;
		const preset = SCENE_ATMOSPHERE[entry?.id];
		if (!preset) return;
		let field = this.fields.get(entry);
		if (!field) {
			field = new Field(this.app, entry, preset);
			this.fields.set(entry, field);
		}
		this.field = field;
		this.app.world.vfxScene.add(field.group);
		this.app.backend.prepareObject(field.group);
		this.update();
	}

	/** { on, amount } of a layer in the current scene (persisted in settings.atmosphere.scenes). */
	state(layer) {
		const id = this.field.entry.id;
		const scene = (this.settings.scenes[id] ??= {});
		return (scene[layer.id] ??= { on: layer.cfg.on ?? true, amount: 1 });
	}

	update() {
		if (!this.field) return;
		const t0 = performance.now();
		this.count = this.field.update(this.settings, (layer) => this.state(layer));
		this.ms = this.ms * 0.95 + (performance.now() - t0) * 0.05;
		if (this.show && this.field.frame % 20 === 0) {
			const drawn = this.field.layers.filter((l) => l.drawn);
			this.show(`${drawn.length} lớp · ${this.count.toLocaleString()} hạt · ${drawn.length} draw · CPU ${this.ms.toFixed(3)} ms/khung`);
		}
	}

	/** Environment tab → Scene options: master switch, density, one switch and amount per layer. */
	buildControls(folder) {
		this.show = null;
		if (!this.field) return;
		const s = this.settings;
		const save = () => this.app.settings.changed('atmosphere');
		const f = folder.addFolder('Bầu không khí · hạt GPU (atmosphere)');
		note(f, 'Mỗi lớp là <b>một draw instanced</b>: mỗi hạt chỉ là một seed ngẫu nhiên, vị trí / chuyển động / ánh sáng tính trong vertex shader theo thời gian (GLSL + TSL) — CPU chỉ gửi vài uniform mỗi khung. Hạt bám mặt đất, trôi theo gió của cỏ, sáng theo 8 đèn gần camera nhất (bụi chỉ hiện trong vùng sáng của hero và quanh lửa).');
		f.add(s, 'enabled').name('Bật').onChange(save);
		f.add(s, 'density', 0, 2, 0.05).name('Mật độ ×').onChange(save);
		for (const layer of this.field.layers) {
			const state = this.state(layer);
			f.add(state, 'on').name(layer.cfg.label).onChange(save);
			f.add(state, 'amount', 0, 2, 0.05).name(`  ↳ lượng × (${layer.max.toLocaleString()})`).onChange(save);
		}
		this.show = readout(f);
	}
}

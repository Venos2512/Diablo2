// Ground blend: static assets meet the terrain — and each other — the way rocks, trunks and posts meet real soil.
// The terrain's own material (albedo + roughness, world normal + height) is rendered top-down into two textures around
// the camera, like a runtime virtual texture; a surface patch on the asset materials (shaders/effects/ground_blend.glsl
// and its TSL twin in backends/webgpu/effects.js) reads them at each fragment's world xz and fades the asset into the
// ground near it. Where assets touch each other a per-vertex contact, baked once on the CPU (env/contact.js), fills the
// crevice with ground. The capture is drawn again only when the view leaves it or the terrain changes (settings, layer
// sets, painting), on a stable texel grid so the blend never swims while the camera follows the hero.
// Off by default: until it is switched on in a shown scene (realize()) there is no bake, no patch and no capture.
// The settings have their own section ('groundBlend'), shared by every scene that uses it; so are the capture targets
// (one effect per app: only the active scene draws into them).
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { note, readout } from '../ui/gui.js';
import { bakeContacts, instancedGround } from './contact.js';
import * as kit from './kit.js';

/**
 * Goes up when DEFAULTS are retuned: older saved values are replaced once (the lab saves every section on any change).
 * 2 → 3 only switches the blend off (it is off by default now, it costs frame time); the saved tuning stays.
 */
const VERSION = 3;
const DEFAULTS = {
	enabled: false, // off until switched on: the bake, the patches and the capture programs only exist from then on (realize())
	debug: false,
	band: 0.22, // m: how far up a vertical face the ground creeps
	width: 0.3, // m across the ground: flatter faces get a lower band (a mud rim only a sliver)
	fraction: 0.3, // the band is at most this fraction of the asset's local relief (a pebble keeps its shape)
	noise: 0.6,
	softness: 0.35,
	normal: 0.85,
	unroll: 1,
	top: 0.35,
	contact: 0.85,
	darken: 0.4,
	contactHeight: 1.2,
	contactRadius: 0.25,
	resolution: 2048,
};
registerDefaults('groundBlend', DEFAULTS);

const RESOLUTIONS = { '1024 (rẻ)': 1024, 2048: 2048, '4096 (nét)': 4096 };
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const REACH = 70; // m: how far from the focus a view ray counts when it meets the ground far away (or never)

const _near = new THREE.Vector3();
const _far = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _color = new THREE.Color();

/** Profile factors of an asset class: top cover ×, contact fill ×, band ×. */
export const GROUND_PROFILES = {
	rock: { top: 1, contact: 1, band: 1 },
	tree: { top: 0, contact: 1, band: 0.5 }, // roots keep their bark: soil only at the very foot; no ground on the branches
	remains: { top: 0, contact: 0.6, band: 0.8 },
	built: { top: 0, contact: 0, band: 1 }, // a fence run's rails touching the next run are not a crevice
};

export class GroundBlend {
	/**
	 * ground = the terrain mesh, terrain = its splat effect (createTerrain: the capture shades with the same uniforms and
	 * layer sets), heightAt(x, z) = ground height (focus of the view), splat = the scene's TerrainSplat (painting recaptures),
	 * pileKit() = { rocks: [mesh], tree: mesh, material(source) } for the test pile (procedural stand-ins without it).
	 */
	constructor(app, { ground, terrain, heightAt = null, splat = null, pileKit = null }) {
		this.app = app;
		this.settings = app.settings.adopt('groundBlend');
		if (this.settings.version === 2) {
			Object.assign(this.settings, { enabled: false, version: VERSION }); // once; switching it on again is kept from here on
			app.settings.changed('groundBlend');
		} else if (this.settings.version !== VERSION) Object.assign(this.settings, DEFAULTS, { version: VERSION });
		this.effect = app._groundBlend ??= GroundBlend.createEffect(app, this.settings.resolution);
		this.ground = ground;
		this.terrain = terrain;
		this.heightAt = heightAt;
		this.splat = splat;
		this.pileKit = pileKit;
		this.pile = null; // the test pile: { group, meshes, classify (the scene's own) }
		this.assets = [];
		this.classify = () => null;
		this.patched = new Set(); // materials carrying the patch
		this.region = null; // { x, z, size } of the capture in the targets
		this.dirty = true;
		this.active = false;
		this.live = false; // realize() ran: the contacts are baked, the materials patched, the capture programs linking
		this.key = NaN;
		this.frames = 0;
		this.stats = { captures: 0, ms: 0, contacts: null };
		// The capture: the ground mesh drawn again, with its splat patch and the capture output, from straight above.
		this.captureScene = new THREE.Scene();
		this.captureScene.name = 'Ground blend capture';
		this.captureMesh = new THREE.Mesh(ground.geometry, this.effect.captureMaterial(terrain));
		this.captureMesh.matrixAutoUpdate = false;
		this.captureScene.add(this.captureMesh);
		ground.geometry.computeBoundingBox();
		const box = ground.geometry.boundingBox;
		this.span = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, box.max.y - box.min.y + 40);
		this.camera.rotation.set(-Math.PI / 2, 0, 0); // looking down, -z up the image (labGroundUv)
		this.cameraY = box.max.y + 20;
		// A new layer set (palette lock, painted ↔ procedural) changes what the capture shows.
		const setLayers = terrain.setLayers;
		terrain.setLayers = (sets) => {
			setLayers(sets);
			this.dirty = true;
		};
		this.restoreLayers = () => (terrain.setLayers = setLayers);
		this.ready = false;
		this.applySettings();
	}

	/** The app's one effect (the capture targets are only allocated and cleared by clearTargets, when the blend is first used). */
	static createEffect(app, size) {
		return app.backend.effects.createGroundBlend({ size });
	}

	/** Both capture targets cleared (coverage 0 = no blend) before anything samples them; once per app. */
	static clearTargets(app, effect) {
		if (effect.cleared) return;
		effect.cleared = true;
		const renderer = app.backend.renderer;
		const previous = renderer.getRenderTarget();
		const color = renderer.getClearColor(_color);
		const alpha = renderer.getClearAlpha();
		renderer.setClearColor(0x000000, 0);
		for (const target of Object.values(effect.targets)) {
			renderer.setRenderTarget(target);
			renderer.clear();
		}
		renderer.setRenderTarget(previous);
		renderer.setClearColor(color, alpha);
	}

	/**
	 * First time the blend is on in a shown scene: clear the targets, link the capture programs, bake the contacts and patch
	 * the asset materials. Until then none of that runs (a scene that never switches it on pays nothing). The patches stay
	 * once made, see activate().
	 */
	realize() {
		if (this.live) return;
		this.live = true;
		GroundBlend.clearTargets(this.app, this.effect);
		this.compile().then(() => (this.ready = true));
		this.bake();
		this.applyPatches();
	}

	/** Link the capture programs (one per target format) before the first capture needs them. */
	compile() {
		const renderer = this.app.backend.renderer;
		if (!renderer.compileAsync) return Promise.resolve();
		const previous = renderer.getRenderTarget();
		const jobs = Object.values(this.effect.targets).map((target) => {
			renderer.setRenderTarget(target); // program / pipeline keys depend on the bound target
			return renderer.compileAsync(this.captureScene, this.camera);
		});
		renderer.setRenderTarget(previous);
		let timer = 0;
		return Promise.race([Promise.all(jobs), new Promise((resolve) => (timer = setTimeout(resolve, 4000)))])
			.catch((error) => console.warn('Ground blend: capture precompile failed', error))
			.finally(() => clearTimeout(timer));
	}

	/**
	 * The assets to blend (static meshes: merged batches, trees, props); classify(mesh) → a profile ({ top, contact,
	 * band } factors, see GROUND_PROFILES) or null to leave the mesh alone. Bakes their contacts and patches their
	 * materials (once the blend is live, see realize(); before that only remembers them). A material that drops out keeps
	 * its patch (inert on its own; see activate() for why it stays).
	 */
	setAssets(meshes, classify) {
		this.assets = meshes.filter((m) => m?.isMesh && !m.isSkinnedMesh && !Array.isArray(m.material));
		this.classify = classify;
		if (!this.live) return;
		this.bake();
		this.applyPatches();
	}

	/** Contacts of the meshes; instanced ones (trees in cells) share their geometry, so they get its relief and no contacts. */
	bake() {
		const query = (mesh) => (this.classify(mesh)?.contact ?? 0) > 0; // built pieces' crevices never fill (GROUND_PROFILES)
		for (const mesh of this.assets) if (mesh.isInstancedMesh) instancedGround(mesh.geometry);
		this.stats.contacts = bakeContacts(this.assets.filter((m) => !m.isInstancedMesh), { radius: this.settings.contactRadius, heightAt: this.heightAt, query });
	}

	applyPatches() {
		const next = new Map(); // material -> patched material
		for (const mesh of this.assets) {
			const material = mesh.material;
			if (!next.has(material)) {
				const profile = this.classify(mesh);
				const surface = profile && this.effect.profile(profile.top, profile.contact, profile.band);
				next.set(material, surface?.accepts(material) ? surface.apply(material) : material);
				if (surface?.accepts(material)) this.patched.add(next.get(material));
			}
			mesh.material = next.get(material);
			this.app.backend.prepareObject(mesh); // WebGPU: the twin needs the lab's MRT-aware program key
		}
	}

	removePatches() {
		const back = new Map();
		for (const material of this.patched) back.set(material, this.effect.remove(material));
		for (const mesh of this.assets) {
			if (!back.has(mesh.material)) continue;
			mesh.material = back.get(mesh.material);
			this.app.backend.prepareObject(mesh);
		}
		this.patched.clear();
	}

	/**
	 * The scene is shown / hidden. The patch stays on the materials either way (only its strength goes to 0 while the
	 * scene is hidden — the act I materials are shared with other scenes): taking an onBeforeCompile patch off and
	 * putting it back makes WebGLRenderer reuse the patched program with the uniforms of the unpatched one (three r180
	 * getProgram() only refreshes materialProperties.uniforms when it compiles), so the capture textures would be lost.
	 */
	activate() {
		this.active = true;
		this.applySettings();
	}

	deactivate() {
		this.active = false;
		this.applySettings();
	}

	applySettings() {
		const s = this.settings;
		const u = this.effect.uniforms;
		for (const key of ['band', 'width', 'fraction', 'noise', 'softness', 'normal', 'unroll', 'top', 'contact', 'darken', 'contactHeight']) u[key].value = s[key];
		u.debug.value = s.debug ? 1 : 0;
		u.strength.value = s.enabled && this.active ? 1 : 0;
		if (s.enabled && this.active) this.realize();
		this.dirty = true;
	}

	resize() {
		const n = this.settings.resolution;
		for (const target of Object.values(this.effect.targets)) target.setSize(n, n);
		this.dirty = true;
	}

	/** Fingerprint of what the capture depends on: the terrain's uniform values and the splat texture's version. */
	terrainKey() {
		let key = this.splat?.texture.version ?? 0;
		let k = 1;
		for (const { value: v } of Object.values(this.terrain.uniforms)) {
			k += 1.37;
			if (typeof v === 'number') key += v * k;
			else if (v?.isColor) key += (v.r + v.g * 3.1 + v.b * 7.3) * k;
			else if (v && typeof v.x === 'number') key += (v.x + v.y * 3.1 + (v.z ?? 0) * 7.3 + (v.w ?? 0) * 13.7) * k;
		}
		return key;
	}

	/** The ground the view shows: the frustum's corner rays met with the ground plane at the focus. { x, z, size } */
	footprint() {
		const rig = this.app.rig;
		const camera = rig.camera;
		const focus = rig.controls.target;
		const y = this.heightAt ? this.heightAt(focus.x, focus.z) : focus.y;
		let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
		for (const [cx, cy] of CORNERS) {
			_near.set(cx, cy, -1).unproject(camera);
			_far.set(cx, cy, 1).unproject(camera);
			_dir.subVectors(_far, _near);
			let x, z;
			if (_dir.y < -1e-6) {
				const t = (y - _near.y) / _dir.y;
				x = _near.x + _dir.x * t;
				z = _near.z + _dir.z * t;
			} else {
				x = focus.x + _dir.x * 1e6; // never meets the ground: as far as it goes, clamped below
				z = focus.z + _dir.z * 1e6;
			}
			const d = Math.hypot(x - focus.x, z - focus.z);
			if (d > REACH) {
				x = focus.x + ((x - focus.x) / d) * REACH;
				z = focus.z + ((z - focus.z) / d) * REACH;
			}
			x0 = Math.min(x0, x);
			x1 = Math.max(x1, x);
			z0 = Math.min(z0, z);
			z1 = Math.max(z1, z);
		}
		return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, size: Math.max(x1 - x0, z1 - z0) };
	}

	/** Every frame (before the render): capture again when the view left the capture, zoomed far in, or the ground changed. */
	update() {
		if (!this.active || !this.settings.enabled || !this.ready) return;
		const key = this.terrainKey();
		if (key !== this.key) {
			this.key = key;
			this.dirty = true;
		}
		const view = this.footprint();
		const r = this.region;
		const fits = r && Math.abs(view.x - r.x) + view.size / 2 <= r.size / 2 && Math.abs(view.z - r.z) + view.size / 2 <= r.size / 2 && view.size * 1.4 > r.size * 0.4;
		if (this.dirty || !fits) this.capture(view);
		if (++this.frames % 20 === 0) this.onStats?.();
	}

	/** Draw the ground around `view` into the targets: 1.4 × the view in 8 m steps, centred on whole texels. */
	capture(view) {
		const t0 = performance.now();
		const { albedo, normal } = this.effect.targets;
		const size = Math.min(this.span + 16, Math.max(16, Math.ceil((view.size * 1.4) / 8) * 8));
		const texel = size / albedo.width;
		const x = Math.round(view.x / texel) * texel;
		const z = Math.round(view.z / texel) * texel;
		const camera = this.camera;
		camera.left = camera.bottom = -size / 2;
		camera.right = camera.top = size / 2;
		camera.position.set(x, this.cameraY, z);
		camera.updateProjectionMatrix();
		camera.updateMatrixWorld(true);
		this.captureMesh.matrix.copy(this.ground.matrixWorld);
		this.captureMesh.matrixWorldNeedsUpdate = true;

		const renderer = this.app.backend.renderer;
		const previous = renderer.getRenderTarget();
		const color = renderer.getClearColor(_color);
		const alpha = renderer.getClearAlpha();
		const autoClear = renderer.autoClear;
		renderer.setClearColor(0x000000, 0);
		renderer.autoClear = true;
		const mode = this.effect.captureMode;
		mode.value = 0;
		renderer.setRenderTarget(albedo);
		renderer.render(this.captureScene, camera);
		mode.value = 1;
		renderer.setRenderTarget(normal);
		renderer.render(this.captureScene, camera);
		renderer.setRenderTarget(previous);
		renderer.setClearColor(color, alpha);
		renderer.autoClear = autoClear;

		this.effect.uniforms.rect.value.set(x - size / 2, z - size / 2, 1 / size, 1 / size);
		this.region = { x, z, size };
		this.dirty = false;
		this.stats.captures++;
		this.stats.ms = performance.now() - t0;
	}

	/**
	 * Test pile (not saved): rocks leaning on rocks, one resting on another's shoulder, a dead tree growing out between
	 * them — the cases the contact fill is for — 3 m to the right of the view's focus. Built from the scene's kits when it
	 * has them, else from procedural rocks and a procedural tree.
	 */
	setTestPile(on) {
		if (this.pile) {
			this.pile.group.removeFromParent();
			const keep = this.assets.filter((m) => !this.pile.meshes.includes(m));
			for (const mesh of this.pile.meshes) mesh.geometry.dispose();
			const classify = this.pile.classify;
			this.pile = null;
			this.setAssets(keep, classify);
		}
		if (!on) return;
		const rig = this.app.rig;
		const right = new THREE.Vector3(1, 0, 0).applyQuaternion(rig.camera.quaternion).setY(0).normalize();
		const at = rig.controls.target.clone().addScaledVector(right, 3);
		const height = (x, z) => (this.heightAt ? this.heightAt(x, z) : at.y);
		const k = this.pileKit?.() ?? {};
		const fallback = { rock: new THREE.MeshStandardMaterial({ name: 'Test pile rock', color: 0x5a5a52, roughness: 0.95 }), bark: new THREE.MeshStandardMaterial({ name: 'Test pile bark', color: 0x3b2e24, roughness: 0.9 }) };
		const rocks = k.rocks?.length ? k.rocks : null;
		const r = kit.rng(77);
		const batch = new kit.StaticBatch('Ground blend · test pile');
		// [piece index, along, across, lift (fraction of the main rock's height), scale, yaw]; offsets in main-rock radii.
		const layout = [[0, 0, 0, 0, 0.62, 0.3], [1, 0.8, 0.35, 0, 0.5, 1.7], [2, -0.85, 0.3, 0, 0.55, 2.6], [3, 0.15, -0.1, 0.62, 0.32, 4.1], [1, -0.2, -0.85, 0, 0.4, 5.2]];
		let main = null;
		for (const [i, along, across, lift, scale, yaw] of layout) {
			const piece = rocks?.[i % rocks.length];
			const geometry = piece ? piece.geometry : kit.rock({ radius: 0.9 * scale, seed: 31 + i * 7, squash: 0.6 });
			geometry.computeBoundingBox();
			const box = geometry.boundingBox;
			const s = piece ? scale : 1;
			const radius = Math.max(-box.min.x, box.max.x, -box.min.z, box.max.z) * s;
			main ??= { radius, top: (box.max.y - box.min.y) * s };
			const x = at.x + right.x * along * main.radius - right.z * across * main.radius;
			const z = at.z + right.z * along * main.radius + right.x * across * main.radius;
			const y = height(x, z) + lift * main.top - (lift ? 0.05 : 0.12 * (box.max.y - box.min.y) * s);
			batch.add(geometry, piece ? (k.material?.(piece.material) ?? piece.material) : fallback.rock, { position: [x, y, z], rotation: [0, yaw + r() * 0.3, 0], scale: s, uv: piece ? 'keep' : 'world' });
		}
		const group = batch.build(true);
		const meshes = [...group.children];
		const tx = at.x - right.z * 0.95 * main.radius;
		const tz = at.z + right.x * 0.95 * main.radius;
		const tree = k.tree
			? new THREE.Mesh(k.tree.geometry, k.material?.(k.tree.material) ?? k.tree.material)
			: new THREE.Mesh(kit.worldUV(kit.deadTree({ seed: 5, height: 3.6 })), fallback.bark);
		if (k.tree) {
			k.tree.geometry.computeBoundingBox();
			const box = k.tree.geometry.boundingBox;
			tree.scale.setScalar(3.6 / (box.max.y - box.min.y));
		}
		tree.position.set(tx, height(tx, tz) - 0.08, tz);
		tree.rotation.y = 1.1;
		group.add(tree);
		meshes.push(tree);
		for (const mesh of meshes) mesh.castShadow = mesh.receiveShadow = true;
		group.userData.labNoCollide = true;
		this.ground.parent.add(group);
		group.updateMatrixWorld(true);
		const profiles = new Map(meshes.map((m) => [m, m === tree ? GROUND_PROFILES.tree : GROUND_PROFILES.rock]));
		const classify = this.classify;
		this.pile = { group, meshes, classify };
		this.setAssets([...this.assets, ...meshes], (mesh) => profiles.get(mesh) ?? classify(mesh));
	}

	statsText() {
		if (!this.live) return 'Đang tắt: chưa bake khe, chưa patch shader, chưa chụp đất (chạy từ lúc bật).';
		const r = this.region;
		const c = this.stats.contacts;
		const res = this.effect.targets.albedo.width;
		const lines = [
			r ? `capture ${r.size} m · ${((r.size / res) * 100).toFixed(1)} cm/texel · ${this.stats.captures}× (last ${this.stats.ms.toFixed(1)} ms CPU)` : 'capture: chưa chụp',
			`${this.patched.size} materials · ${this.assets.length} meshes`,
		];
		if (c) lines.push(`contacts: ${c.vertices} vertices · ${c.near}/${c.pieces} pieces near another · ${Math.round(c.ms)} ms`);
		return lines.join('\n');
	}

	buildControls(folder) {
		const s = this.settings;
		const app = this.app;
		const set = () => (app.settings.changed('groundBlend'), this.applySettings());
		const f = folder.addFolder('Ground blend · asset ăn vào đất');
		note(f, 'Chân asset lấy đúng vật liệu mặt đất ngay dưới nó (màu, độ nhám, normal: ánh sáng liền mạch), mép có nhiễu; đá chạm đá, cây chạm đá thì khe được lấp đất. Mặt đất được chụp từ trên xuống quanh camera (kiểu runtime virtual texture), không thêm pass nào mỗi frame.');
		f.add(s, 'enabled').name('Bật hòa trộn (mặc định tắt, tốn máy)').onChange(() => (set(), this.onStats?.()));
		f.add(s, 'debug').name('Xem vùng trộn: đỏ chân · lục mặt trên · lam khe').onChange(set);
		f.add(s, 'band', 0, 0.8, 0.01).name('Đất leo lên mặt đứng (m)').onChange(set);
		f.add(s, 'width', 0.02, 1.5, 0.01).name('Bề rộng chuyển tiếp trên đất (m)').onChange(set);
		f.add(s, 'fraction', 0.05, 1, 0.01).name('Tối đa × chiều cao asset').onChange(set);
		f.add(s, 'noise', 0, 1, 0.01).name('Nhiễu mép').onChange(set);
		f.add(s, 'softness', 0.05, 1, 0.01).name('Độ mềm mép').onChange(set);
		f.add(s, 'normal', 0, 1, 0.01).name('Trộn normal (ánh sáng liền)').onChange(set);
		f.add(s, 'unroll', 0, 1, 0.01).name('Trải texture đất lên mặt đứng').onChange(set);
		f.add(s, 'top', 0, 1, 0.01).name('Phủ mặt trên: bụi / rêu (đá)').onChange(set);
		f.add(s, 'contact', 0, 1, 0.01).name('Lấp khe giữa các asset').onChange(set);
		f.add(s, 'darken', 0, 1, 0.01).name('Tối khe + viền đất').onChange(set);
		f.add(s, 'contactHeight', 0.2, 4, 0.05).name('Khe tắt dần trên độ cao (m)').onChange(set);
		f.add(s, 'contactRadius', 0.05, 1, 0.01).name('Bán kính dò khe (m, bake lại)').onFinishChange(() => {
			app.settings.changed('groundBlend');
			if (this.live) this.bake();
			this.onStats?.();
		});
		f.add(s, 'resolution', RESOLUTIONS).name('Độ phân giải capture').onChange(() => (app.settings.changed('groundBlend'), this.resize()));
		const rig = app.rig;
		const pile = { on: !!this.pile, frame: () => this.pile && rig.frame(new THREE.Box3().setFromObject(this.pile.group), { padding: 1.6 }) };
		f.add(pile, 'on').name('Cụm thử: đá chồng đá + cây giữa đá (tạm)').onChange((v) => {
			this.setTestPile(v);
			this.onStats?.();
		});
		f.add(pile, 'frame').name('↺ Camera vào cụm thử');
		const info = readout(f);
		this.onStats = () => info(this.statsText());
		this.onStats();
		return f;
	}

	dispose() {
		if (this.pile) this.setTestPile(false);
		this.deactivate();
		this.removePatches();
		this.captureMesh.material.dispose();
		this.restoreLayers();
		this.onStats = null;
	}
}

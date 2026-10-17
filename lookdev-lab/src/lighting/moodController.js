// Act I mood controller (Lighting tab → Mood). Applies a preset from lighting/moods.js to whichever
// scene is active — the scene's own lights, environment and torches through scene.applyMood(), exposure
// and fog per scene, grade / bloom / tone mapping / LUT through the post settings — and runs what a
// preset cannot express as values:
//   hero light   a soft point light that follows the character (the "player light" of the game camera)
//   rim          fresnel rim on the character's materials (GLSL patch / TSL node patch)
//   weather      rain streaks and splashes, wet ground with puddle ripples, lightning flashes
//   air          dust motes and drifting ground mist
// Mood lights are added once per scene and switched by intensity, so tweaking never changes the light
// count (which would recompile every lit material). Turning the mood off restores every scene it
// touched and the grade that was active before.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { MOODS, moodLive } from './moods.js';
import { ParticleSystem } from '../vfx/particles.js';

registerDefaults('mood', { id: 'off', post: true, tweaks: {}, saved: null });

const POST_KEYS = ['toneMapping', 'bloom', 'grade', 'lut'];
const clone = (v) => JSON.parse(JSON.stringify(v));
const TAU = Math.PI * 2;
const _v = new THREE.Vector3();
const _vel = new THREE.Vector3();
const _cam = new THREE.Vector3();

export class MoodController {
	constructor(app) {
		this.app = app;
		this.settings = app.settings.adopt('mood');
		if (!MOODS[this.settings.id]) this.settings.id = 'off';
		this.listeners = new Set();
		this.applied = new Set(); // scene entries whose lights currently carry a mood
		this.live = moodLive(this.settings.id, this.settings.tweaks);
		this.token = 0;
		this.time = 0;
		this.particleCount = 0;

		// Inverse-linear falloff (decay 1) like a game light: the head is not blown out next to the feet.
		this.hero = new THREE.PointLight(0xffffff, 0, 10, 1);
		this.hero.name = 'Hero light (mood)';
		this.heroGroup = new THREE.Group();
		this.heroGroup.name = 'Mood · hero light';
		this.heroGroup.add(this.hero);

		this.bolt = new THREE.DirectionalLight(kelvinToColor(8000), 0);
		this.bolt.name = 'Lightning (mood)';
		this.boltSky = new THREE.HemisphereLight(0xa9c2ff, 0x16161c, 0);
		this.boltSky.name = 'Lightning sky (mood)';
		this.stormGroup = new THREE.Group();
		this.stormGroup.name = 'Mood · lightning';
		this.stormGroup.add(this.bolt, this.bolt.target, this.boltSky);
		this.strike = null;
		this.nextStrike = 0;

		this.rim = null; // backend effect, created on first use
		this.rimMeshes = new Set();
		this.wet = null;
		this.wetMeshes = new Set();
		this.wetScene = null;
		this.particles = null;
		this.emitters = null;
		this.carry = { rain: 0, splash: 0, dust: 0, mist: 0 };
		this.heroPos = new THREE.Vector3();
		this.mistColor = new THREE.Color();
		this.dustColor = new THREE.Color();

		app.on('scene', (entry) => this.onScene(entry));
		app.on('subject', () => this.onSubject());
		app.on('update', (dt) => this.update(dt));
		app.character?.equipment?.onChange(() => this.onSubject());
	}

	get active() {
		return this.settings.id !== 'off' && !!MOODS[this.settings.id];
	}

	get mood() {
		return MOODS[this.settings.id];
	}

	/** True when the current scene is an interior (no rain, lightning or wet ground). */
	get indoors() {
		return this.app.current?.moodKind === 'interior';
	}

	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	notify() {
		for (const fn of this.listeners) fn();
	}

	save() {
		this.app.settings.changed('mood');
	}

	/** Re-apply a persisted mood once the first scene and subject exist. */
	async init() {
		if (this.active) await this.apply();
	}

	/** Select a mood by id ('off' restores the scenes' own lighting and the previous grade). */
	async set(id) {
		if (!MOODS[id]) id = 'off';
		this.settings.id = id;
		this.save();
		if (id === 'off') await this.disable();
		else await this.apply();
		this.notify();
	}

	async apply() {
		this.live = moodLive(this.settings.id, this.settings.tweaks);
		this.applyPost();
		await this.applyScene(this.app.current);
		this.applyRim();
		this.applyLive();
		this.restartParticles();
	}

	async disable() {
		const app = this.app;
		this.token++;
		this.endStrike();
		this.restorePost();
		app.settings.changed('post');
		app.applyLut();
		const scenes = [...this.applied];
		this.applied.clear();
		for (const entry of scenes) await entry.applyMood?.(null);
		this.removeWet();
		this.removeRim();
		this.heroGroup.removeFromParent();
		this.stormGroup.removeFromParent();
		this.clearParticles();
		this.save();
		if (app.current) {
			app.world.sun = app.current.sun || null;
			app.applyScenePost(app.current); // the scene's own (saved or default) exposure and fog
		}
	}

	// ---------------------------------------------------------------------------------------------
	// Post: grade, bloom, tone mapping, LUT (global) + exposure and fog (per scene)

	/** Write the mood's grade (remembering the user's own once), or restore it when "post" is off. */
	applyPost() {
		const app = this.app;
		const post = app.settings.data.post;
		const mood = this.mood;
		if (this.active && this.settings.post && mood.post) {
			this.settings.saved ??= clone(Object.fromEntries(POST_KEYS.map((k) => [k, post[k]])));
			post.toneMapping = mood.post.toneMapping;
			Object.assign(post.bloom, mood.post.bloom);
			Object.assign(post.grade, mood.post.grade);
			Object.assign(post.lut, mood.post.lut);
		} else {
			this.restorePost();
		}
		this.save();
		app.settings.changed('post');
		app.applyLut(); // LUT texture + every other post setting
		app.panels?.refresh();
	}

	restorePost() {
		const saved = this.settings.saved;
		if (!saved) return;
		const post = this.app.settings.data.post;
		post.toneMapping = saved.toneMapping;
		Object.assign(post.bloom, saved.bloom);
		Object.assign(post.grade, saved.grade);
		Object.assign(post.lut, saved.lut);
		this.settings.saved = null;
	}

	/** Scene part of the mood: lights through scene.applyMood, then exposure / fog and the mood lights. */
	async applyScene(entry) {
		if (!entry || !this.active) return;
		const token = ++this.token;
		const block = this.mood[entry.moodKind] || null;
		if (entry.applyMood) {
			this.applied.add(entry);
			await entry.applyMood(block);
			if (token !== this.token) return; // the mood or the scene changed while an HDRI loaded
		}
		const app = this.app;
		if (block) {
			const post = app.settings.data.post;
			post.exposure = block.exposure;
			Object.assign(post.fog, { enabled: true, ...block.fog });
			app.settings.changed('post');
			app.applyPost();
			this.mistColor.set(block.fog.color).multiplyScalar(2);
		}
		app.world.sun = entry.sun || null;
		entry.scene.add(this.heroGroup);
		if (entry.moodKind === 'interior') this.stormGroup.removeFromParent();
		else entry.scene.add(this.stormGroup);
		app.backend.prepareObject(this.heroGroup);
		app.panels?.refresh();
		app.updateBadges();
	}

	onScene(entry) {
		this.endStrike();
		this.removeWet(); // shared Act I materials: puddles must not follow into the next scene
		this.heroGroup.removeFromParent();
		this.stormGroup.removeFromParent();
		this.clearParticles();
		this.pending = null;
		if (!this.active) return;
		// App.setScene waits on this before compiling: the mood adds lights, and lights are part of every program key.
		this.pending = this.applyScene(entry).then(() => {
			if (this.app.current !== entry || !this.active) return;
			this.applyLive();
			this.restartParticles();
			this.notify(); // panels show the mood-driven lights of this scene
		});
	}

	/** A scene rebuilt its static meshes (merge toggle, grass density): re-apply the wet layer. */
	onSceneRebuilt(entry) {
		if (this.wetScene !== entry) return;
		this.removeWet();
		this.applyWet();
	}

	onSubject() {
		if (this.active) this.applyRim();
	}

	// ---------------------------------------------------------------------------------------------
	// Live parameters (panel)

	setLive(key, value) {
		if (!this.active) return;
		this.live[key] = value;
		const tweaks = (this.settings.tweaks[this.settings.id] ??= {});
		tweaks[key] = value;
		this.save();
		this.applyLive();
	}

	resetLive() {
		if (!this.active) return;
		delete this.settings.tweaks[this.settings.id];
		this.live = moodLive(this.settings.id, this.settings.tweaks);
		this.save();
		this.applyLive();
		this.notify();
	}

	applyLive() {
		if (!this.active) return;
		const L = this.live;
		this.hero.color.copy(kelvinToColor(L.heroKelvin));
		this.hero.intensity = L.hero ? L.heroIntensity : 0;
		this.hero.distance = L.heroRange;
		if (this.rim) {
			const u = this.rim.uniforms;
			u.color.value.set(L.rimColor);
			u.intensity.value = L.rim ? L.rimIntensity : 0;
			u.power.value = L.rimPower;
			u.bias.value = L.rimBias;
		}
		this.dustColor.copy(kelvinToColor(Math.min(L.heroKelvin, 4200))).multiplyScalar(0.45);
		if (!this.lightningOn) this.endStrike();
		else if (this.nextStrike <= this.time) this.nextStrike = this.time + 2 + Math.random() * 4;
		this.applyWet();
		if (this.rainOn || L.dust > 0 || L.mist > 0) this.ensureParticles();
	}

	/** Fresh particles for a new mood or scene, simulated ahead so mist and dust are already spread out. */
	restartParticles() {
		this.clearParticles();
		if (this.particles && this.active) this.prewarm();
	}

	get rainOn() {
		return this.active && !this.indoors && this.live.rain > 0;
	}

	get lightningOn() {
		return this.active && !this.indoors && !!this.live.lightning;
	}

	// ---------------------------------------------------------------------------------------------
	// Material layers: character rim, wet ground

	swap(mesh, fn) {
		const views = this.app.views;
		const base = views.baseMaterial(mesh);
		const next = Array.isArray(base) ? base.map(fn) : fn(base);
		const changed = Array.isArray(base) ? next.some((m, i) => m !== base[i]) : next !== base;
		if (changed) views.setBaseMaterial(mesh, next);
	}

	applyRim() {
		this.removeRim();
		const model = this.app.subject.model;
		if (!this.active || !model) return;
		this.rim ??= this.app.backend.effects.createHeroRim?.() || null;
		if (!this.rim) return;
		model.traverse((o) => {
			if (!o.isMesh || !o.material || o.userData.labNoView) return;
			this.swap(o, (m) => this.rim.apply(m));
			this.rimMeshes.add(o);
		});
		this.app.backend.prepareObject(this.app.subject.root);
		this.applyLive();
	}

	removeRim() {
		if (!this.rim) return;
		for (const mesh of this.rimMeshes) this.swap(mesh, (m) => this.rim.remove(m));
		this.rimMeshes.clear();
	}

	applyWet() {
		const entry = this.app.current;
		const L = this.live;
		const want = this.rainOn && L.wet > 0 && !!entry?.wetRoots;
		if (!want) {
			this.removeWet();
			return;
		}
		this.wet ??= this.app.backend.effects.create('liquid', { tint: new THREE.Color('#0b1116'), coverage: 0.3, rippleScale: 2.4, rippleSpeed: 1.5, roughness: 0.12, wetness: 0.5 });
		const u = this.wet.uniforms;
		u.coverage.value = Math.min(1, L.wet);
		u.wetness.value = Math.min(0.8, 0.25 + 0.45 * L.rain);
		u.rippleSpeed.value = 0.7 + 0.8 * Math.min(2, L.rain);
		if (this.wetScene === entry) return;
		this.removeWet();
		for (const root of entry.wetRoots()) {
			root?.traverse((o) => {
				if (!o.isMesh || !o.material || o.userData.labNoView) return;
				this.swap(o, (m) => (m.transparent ? m : this.wet.apply(m)));
				this.wetMeshes.add(o);
			});
		}
		this.wetScene = entry;
		this.app.backend.prepareObject(entry.scene);
	}

	removeWet() {
		if (!this.wet) return;
		for (const mesh of this.wetMeshes) this.swap(mesh, (m) => this.wet.remove(m));
		this.wetMeshes.clear();
		if (this.wetScene) this.app.backend.prepareObject(this.wetScene.scene);
		this.wetScene = null;
	}

	// ---------------------------------------------------------------------------------------------
	// Particles: rain, splashes, dust, mist (one draw per emitter, simulated on the CPU)

	ensureParticles() {
		if (this.particles) return;
		this.particles = new ParticleSystem(this.app);
		this.particles.group.name = 'Mood particles';
		const make = (config) => this.particles.emitter(config, { autoRemove: false });
		this.emitters = {
			rain: make({ name: 'Rain', max: 6000, shape: 'spark', align: 'velocity', additive: 1, softness: 0.05, size: [0.022, 0.022], stretch: 0.032, colors: [[0, '#a9bfd8', 0.14]], alpha: 0.45, fadeIn: 0.04, fadeOut: 0.08 }),
			splash: make({ name: 'Rain splashes', max: 600, shape: 'ring', align: 'ground', additive: 1, softness: 0.02, size: [0.02, 0.12], colors: [[0, '#b5c8dd', 0.3]], alpha: 0.6, fadeIn: 0, fadeOut: 0.8, frozen: true }),
			dust: make({ name: 'Dust motes', max: 500, shape: 'soft', align: 'camera', additive: 1, softness: 0.3, size: [0.03, 0.03], colors: [[0, '#ffffff', 1]], alpha: 0.35, fadeIn: 0.3, fadeOut: 0.4, turbulence: 0.12 }),
			mist: make({ name: 'Ground mist', max: 140, shape: 'smoke', align: 'camera', additive: 0, softness: 1.5, size: [4.5, 7], colors: [[0, '#ffffff', 1]], alpha: 0.22, fadeIn: 0.3, fadeOut: 0.4, renderOrder: 6 }),
		};
		this.emitters.dust.color = (t, out) => out.copy(this.dustColor);
		this.emitters.mist.color = (t, out) => out.copy(this.mistColor);
	}

	/** Run the particle simulation ahead so mist and dust are already spread out when a mood starts. */
	prewarm(seconds = 12) {
		if (!this.particles) return;
		const focus = this.app.rig.controls.target;
		const subject = this.app.subject.root;
		const heroPos = subject.parent ? subject.getWorldPosition(this.heroPos) : this.heroPos.copy(focus);
		const dt = 0.2;
		for (let t = 0; t < seconds; t += dt) {
			this.spawn(dt, focus, heroPos);
			this.particles.update(dt);
		}
		this.particleCount = this.particles.count;
	}

	clearParticles() {
		if (!this.emitters) return;
		for (const e of Object.values(this.emitters)) {
			e.alive = 0;
			e.geometry.instanceCount = 0;
		}
		this.particleCount = 0;
	}

	/** Ground height for splashes / mist (character collision grid, built once per scene). */
	groundAt(x, z, y) {
		const character = this.app.character;
		if (!character) return y;
		if (!character.collision || character.collisionScene !== this.app.world.scene) character.ensureCollision();
		const g = character.collision?.groundHeight(x, z, y + 4);
		return g ?? null;
	}

	spawn(dt, focus, heroPos) {
		const L = this.live;
		const e = this.emitters;
		const rnd = Math.random;
		const camera = this.app.world.camera;
		_cam.copy(camera.position);
		const windAngle = 0.6;
		const wx = Math.cos(windAngle) * L.wind * 4;
		const wz = Math.sin(windAngle) * L.wind * 4;

		if (this.rainOn) {
			const dist = Math.max(1, _cam.distanceTo(focus));
			const radius = THREE.MathUtils.clamp(dist * 0.7, 8, 20);
			const cx = focus.x + (_cam.x - focus.x) * 0.3;
			const cz = focus.z + (_cam.z - focus.z) * 0.3;
			const top = focus.y + 8;
			const meanLife = 11 / 11.5;
			const rate = Math.min(L.rain * 7 * Math.PI * radius * radius, (e.rain.capacity * 0.95) / meanLife);
			this.carry.rain += rate * dt;
			const n = Math.floor(this.carry.rain);
			this.carry.rain -= n;
			for (let i = 0; i < n; i++) {
				const a = rnd() * TAU;
				const r = Math.sqrt(rnd()) * radius;
				const y = top + rnd() * 3;
				const speed = 10 + rnd() * 3;
				e.rain.add({ position: _v.set(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r), velocity: _vel.set(wx, -speed, wz), life: (y - focus.y + 3) / speed, size: 0.7 + rnd() * 0.6 });
			}
			if (L.splashes) {
				this.carry.splash += Math.min(2, L.rain) * 160 * dt;
				const m = Math.floor(this.carry.splash);
				this.carry.splash -= m;
				for (let i = 0; i < m; i++) {
					const a = rnd() * TAU;
					const r = Math.sqrt(rnd()) * 8;
					const x = cx + Math.cos(a) * r;
					const z = cz + Math.sin(a) * r;
					const g = this.groundAt(x, z, focus.y);
					if (g === null) continue;
					e.splash.add({ position: _v.set(x, g + 0.03, z), life: 0.22 + rnd() * 0.15, size: 0.6 + rnd() * 0.8 });
				}
			}
		}

		if (L.dust > 0) {
			// Inside the hero light's pool, where motes would actually catch light.
			const life = 8;
			this.carry.dust += ((L.dust * 90) / life) * dt;
			const n = Math.floor(this.carry.dust);
			this.carry.dust -= n;
			for (let i = 0; i < n; i++) {
				const a = rnd() * TAU;
				const r = Math.sqrt(rnd()) * 3.5;
				e.dust.add({
					position: _v.set(heroPos.x + Math.cos(a) * r, heroPos.y + 0.3 + rnd() * 2.4, heroPos.z + Math.sin(a) * r),
					velocity: _vel.set((rnd() - 0.5) * 0.1 + wx * 0.05, (rnd() - 0.3) * 0.06, (rnd() - 0.5) * 0.1 + wz * 0.05),
					life: life * (0.75 + rnd() * 0.5),
					size: 0.5 + rnd(),
				});
			}
		}

		if (L.mist > 0) {
			const life = 16;
			this.carry.mist += ((L.mist * 55) / life) * dt;
			const n = Math.floor(this.carry.mist);
			this.carry.mist -= n;
			for (let i = 0; i < n; i++) {
				const a = rnd() * TAU;
				const r = Math.sqrt(rnd()) * 13;
				const x = focus.x + Math.cos(a) * r;
				const z = focus.z + Math.sin(a) * r;
				const g = this.groundAt(x, z, focus.y) ?? focus.y - 0.9;
				e.mist.add({
					position: _v.set(x, g + 0.35 + rnd() * 0.7, z),
					velocity: _vel.set(wx * 0.06 + (rnd() - 0.5) * 0.2, 0, wz * 0.06 + (rnd() - 0.5) * 0.2),
					life: life * (0.8 + rnd() * 0.4),
					size: 0.8 + rnd() * 0.4,
					rotation: rnd() * TAU,
					spin: (rnd() - 0.5) * 0.08,
				});
			}
		}
	}

	// ---------------------------------------------------------------------------------------------
	// Lightning: a cold directional flash + sky ambient + background, two or three pulses per strike

	/** One lightning strike now (the panel's "Strike now" works even with automatic strikes off). */
	strikeNow() {
		if (!this.active || this.indoors || !this.app.current) return;
		const scene = this.app.current.scene;
		const focus = this.app.rig.controls.target;
		const az = Math.random() * TAU;
		const elev = THREE.MathUtils.degToRad(55 + Math.random() * 20);
		this.bolt.position.set(focus.x + Math.cos(az) * Math.cos(elev) * 50, focus.y + Math.sin(elev) * 50, focus.z + Math.sin(az) * Math.cos(elev) * 50);
		this.bolt.target.position.copy(focus);
		if (!this.strike) this.strike = { scene, background: scene.backgroundIntensity };
		this.strike.start = this.time;
		this.strike.pulses = [
			[0, 0.5, 0.05],
			[0.08 + Math.random() * 0.06, 1, 0.08],
			[0.3 + Math.random() * 0.2, 0.35 + Math.random() * 0.35, 0.16],
		];
		this.nextStrike = this.time + this.live.lightningEvery * (0.5 + Math.random());
	}

	endStrike() {
		if (!this.strike) return;
		this.strike.scene.backgroundIntensity = this.strike.background;
		this.strike = null;
		this.bolt.intensity = 0;
		this.boltSky.intensity = 0;
	}

	updateStrike() {
		const s = this.strike;
		if (!s) return;
		const t = this.time - s.start;
		let e = 0;
		for (const [start, amp, decay] of s.pulses) {
			const k = t - start;
			if (k >= 0) e += amp * Math.min(1, k / 0.015) * Math.exp(-k / decay);
		}
		if (t > 1.6) {
			this.endStrike();
			return;
		}
		const strength = this.live.lightningStrength;
		this.bolt.intensity = e * strength * 5;
		this.boltSky.intensity = e * strength * 1.1;
		s.scene.backgroundIntensity = s.background * (1 + e * strength * 4);
	}

	// ---------------------------------------------------------------------------------------------

	update(dt) {
		if (!this.active || !this.app.current) return;
		this.time += dt;
		const app = this.app;
		const L = this.live;
		const focus = app.rig.controls.target;
		const subject = app.subject.root;
		const heroPos = subject.parent ? subject.getWorldPosition(this.heroPos) : this.heroPos.copy(focus);

		// Hero light: above the character, pulled a little towards the camera so the front is lit.
		if (this.hero.intensity > 0) {
			_v.copy(app.world.camera.position).sub(heroPos).setY(0);
			if (_v.lengthSq() > 1e-6) _v.normalize().multiplyScalar(L.heroToCamera);
			this.hero.position.set(heroPos.x + _v.x, heroPos.y + L.heroHeight, heroPos.z + _v.z);
		}

		if (this.lightningOn && this.time >= this.nextStrike) this.strikeNow();
		this.updateStrike();

		if (this.particles) {
			this.spawn(dt, focus, heroPos);
			this.particles.update(dt);
			this.particleCount = this.particles.count;
		}
	}
}

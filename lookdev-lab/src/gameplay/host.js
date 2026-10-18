// Gameplay preview: Ashen Crown v1's core (player intents, A* nav, monster AI, combat, projectiles) running
// in the lab on the current scene with the current preview character.
//   - nav grid: 1 m cells flood-filled from the spawn point over the scene's walk collision (step 0.6 m)
//   - gameplay space: a group shifted so cells start at 0 (see engine.js); actors follow the ground
//   - player: the preview character scaled to the hero height (1.8 m), driven through HeroModel
//   - monsters: Ashen Crown's procedural monsters (src/procedural), v1 stats / packs / AI
//   - right-click skills: the lab's skill runtime (three.quarks, WebGL2) with the monsters as targets
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { SHARED } from '../core/shared.js';
import { toast } from '../ui/toast.js';
import { modelsReady } from '../procedural/models.js';
import { useNodeMaterial } from '../procedural/nodeMaterial.js';
import { SkillSystem } from '../skills/runtime.js';
import { SKILLS, SKILL_ORDER } from '../skills/skills.js';
import { measureHeight } from '../character/rig.js';
import { G, hash, tickTimers, clearTimers, Events } from './state.js';
import { Nav } from './nav.js';
import { Engine } from './engine.js';
import { FX } from './fx.js';
import { Floaters } from './floaters.js';
import { ModelHost, createMonster } from './models.js';
import { Input } from './input.js';
import { HeroModel } from './heroModel.js';
import { Player, CLASSES } from './player.js';
import { MDEF, spawnPack, updateAuras } from './monsters.js';
import { updateProjectiles, updateEffects, clearProjectiles } from './projectiles.js';
import { dealDamage } from './combat.js';
import { GameHud } from './hud.js';

registerDefaults('gameplay', {
	enabled: true,
	cls: 'auto',
	level: 5,
	heroHeight: 1.8,
	monster: 'zombie',
	pack: 'normal',
	count: 4,
	mlvl: 5,
	waves: false,
	waveSize: 8,
	right: 'fireball',
});

/** Monsters offered in the panel (allies-only summons are left out). */
export const SPAWNABLE = Object.keys(MDEF).filter((k) => k !== 'bone_golem' && k !== 'ancestor');
export const PACKS = { normal: 'Normal pack', champion: 'Champions', unique: 'Unique + minions', boss: 'Boss (single)' };

const GRID = 128; // cells (1 m) — the playable square around the spawn point
const STEP = 0.6; // highest step between neighbouring cells
const ELEMENT = { fire: 'fire', cold: 'cold', lightning: 'light', poison: 'poison', magic: 'magic', physical: 'phys' };
const _w = new THREE.Vector3();
const _l = new THREE.Vector3();

export class GameplayHost {
	constructor(app) {
		this.app = app;
		this.settings = app.settings.adopt('gameplay');
		this.active = false;
		this.starting = false;
		this.player = null;
		this.group = null;
		this.collision = null;
		this.groundGrid = null;
		this.skills = null;
		this.hud = new GameHud(app.dom.viewport);
		this.listeners = new Set();
		this.flowT = 0;
		this.auraT = 0;
		this.waveT = 0;
		this.rng = G.rng;

		Input.init(app.backend.canvas);
		Input.onKey((e) => this.onKey(e));
		Engine.canvas = app.backend.canvas;
		Engine.host = {
			raycast: (origin, direction) => this.collision?.raycast(origin, direction, 300)?.point ?? null,
			groundY: () => (this.player ? this.player.pos.y : this.anchor().y),
			shake: (s) => app.vfxLab?.shake(s),
			hurt: (a) => this.hud.hurt(a),
		};
		Floaters.sink = (p, text, kind) => app.vfxLab?.combatText(p, text, kind);
		ModelHost.prepare = (model) => {
			if (app.backend.kind !== 'webgl') useNodeMaterial(model);
			app.backend.prepareObject(model.root);
		};
		Events.on('playerDied', () => this.notify());
		Events.on('levelUp', () => this.notify());

		app.on('update', (dt) => this.update(dt));
		app.on('click', () => {
			if (this.active) app.consumedClick = true; // no mesh picking / selection while playing
		});
		app.on('scene', () => this.active && this.restart());
		app.on('subject', () => this.active && !this.starting && this.restart());
	}

	/** Live game state (players, monsters, projectiles) — for the panel, tests and the console. */
	get state() {
		return G;
	}

	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	notify() {
		for (const fn of this.listeners) fn();
	}

	save() {
		this.app.settings.changed('gameplay');
	}

	anchor() {
		return this.app.current.anchor.getWorldPosition(new THREE.Vector3());
	}

	heroClass() {
		const s = this.settings;
		if (s.cls !== 'auto') return s.cls;
		const id = this.app.subject.sourceId || '';
		const m = /^proc:hero:(\w+)/.exec(id);
		return m && CLASSES[m[1]] ? m[1] : 'barbarian';
	}

	// ---------------------------------------------------------------------------------------------
	// Start / stop

	async setActive(on) {
		if (on) await this.start();
		else this.stop();
	}

	async restart() {
		this.stop({ quiet: true });
		await this.start({ quiet: true });
	}

	async start({ quiet = false } = {}) {
		const app = this.app;
		const ctrl = app.character;
		const subject = app.subject;
		if (this.active || this.starting) return;
		if (!subject.model) return toast('Load a character first (Character tab or the sample rail).', 'error', 4000);
		if (!subject.procedural && !subject.clips.length) {
			return toast('This model has no animation clips — load an animated character (KayKit, Robot, Fox, a procedural hero) or your own GLB.', 'error', 5000);
		}
		this.starting = true;
		try {
			await modelsReady;
			if (ctrl.active) ctrl.setActive(false, { quiet: true });
			this.vfxWasArmed = !!app.vfxLab?.armed;
			if (this.vfxWasArmed) app.vfxLab.arm(false); // its dummies, castbar keys and right click would fight the game input

			// Character: hero height, facing offset, animation layer.
			this.saved = { pivotScale: subject.pivot.scale.clone(), turntable: subject.turntable, camera: app.rig.state() };
			subject.turntable = false;
			subject.root.position.set(0, 0, 0);
			subject.root.rotation.set(0, 0, 0);
			subject.pivot.rotation.set(0, ctrl.forwardOffset(), 0);
			const height = this.normaliseHeight();
			if (subject.procedural) subject.externalMixer = true;
			else {
				ctrl.animator.crossfade = ctrl.settings.crossfade;
				ctrl.animator.syncRate = true;
				ctrl.animator.attach();
				ctrl.animator.setMap(ctrl.map);
			}

			// World: collision, nav grid, gameplay space.
			ctrl.ensureCollision();
			this.collision = ctrl.collision;
			const spawn = this.anchor();
			this.buildNav(spawn);
			this.group = new THREE.Group();
			this.group.name = 'Gameplay (Ashen Crown v1)';
			this.group.userData.labNoCollide = true;
			this.group.position.set(-Engine.offset.x, 0, -Engine.offset.z);
			app.world.scene.add(this.group);
			Engine.scene = this.group;
			Engine.camera = app.world.camera;
			await this.warmUp(spawn);

			// Game state.
			clearTimers();
			G.actors = [];
			G.projectiles = [];
			G.effects = [];
			G.time = 0;
			G.frame = 0;
			G.hitstop = 0;
			G.difficulty = 0;
			G.inTown = false;
			G.cine = null;
			G.mode = 'game';
			G.level = { mlvl: this.settings.mlvl, outdoor: true, theme: app.current.id };

			const model = new HeroModel({ subject, animator: ctrl.animator, height, speeds: () => ({ walk: ctrl.settings.walkSpeed, run: ctrl.settings.runSpeed }) });
			this.group.add(model.root);
			const ranged = ['ranged1h', 'ranged2h'].includes(ctrl.stance);
			const player = new Player(model, {
				cls: this.heroClass(),
				level: this.settings.level,
				ranged,
				reach: ranged ? 0 : ctrl.reach() * 1.1,
				right: this.settings.right,
				skills: this.ensureSkills(),
			});
			const local = Engine.toLocal(spawn, new THREE.Vector3());
			player.pos.set(local.x, spawn.y, local.z);
			G.player = player;
			G.actors.push(player);
			this.player = player;

			// Camera follows the character (the Character tab's camera choice).
			ctrl.applyCamera();
			this.syncSubject();
			if (ctrl.settings.cutaway) ctrl.cutaway.prepareScene(app.world.scene, (o) => ctrl.isDynamic(o) || o === this.group);

			Input.enabled = true;
			Input.release();
			this.active = true;
			this.hud.show(true);
			this.waveT = 2;
			document.activeElement?.blur?.();
			if (!quiet) toast('Gameplay (Ashen Crown v1): left click move / attack · Shift + click attack in place · right click skill · F1–F8 pick skill · N spawn pack · R walk/run · Esc quit', 'info', 7000);
		} catch (error) {
			console.error(error);
			toast(`Gameplay failed to start: ${error.message}`, 'error', 6000);
			this.stop({ quiet: true });
		} finally {
			this.starting = false;
			this.notify();
		}
	}

	stop({ quiet = false } = {}) {
		const app = this.app;
		const ctrl = app.character;
		const subject = app.subject;
		const wasActive = this.active || this.group;
		this.active = false;
		Input.enabled = false;
		Input.release();
		this.hud.show(false);
		for (const a of G.actors) if (a !== this.player) a.removeFromWorld();
		clearProjectiles();
		clearTimers();
		G.actors = [];
		G.player = null;
		G.mode = 'menu';
		this.skills?.clear?.();
		this.player?.model.dispose();
		this.player = null;
		this.group?.removeFromParent();
		this.group = null;
		if (!wasActive) return;
		ctrl.cutaway.update(app.world.camera, _w, 0, 1, false);
		if (subject.procedural) {
			subject.externalMixer = false;
			subject.procedural.play('idle', { fade: 0.2 });
		} else ctrl.animator.detach();
		subject.root.position.set(0, 0, 0);
		subject.root.rotation.set(0, 0, 0);
		subject.pivot.rotation.set(0, 0, 0);
		if (this.saved) {
			subject.pivot.scale.copy(this.saved.pivotScale);
			subject.turntable = this.saved.turntable;
			app.rig.follow = null;
			app.rig.setMode(this.saved.camera.mode || 'orbit');
			app.rig.restore(this.saved.camera);
			ctrl.height = measureHeight(subject.model);
		}
		this.saved = null;
		if (this.vfxWasArmed) app.vfxLab.arm(true);
		this.vfxWasArmed = false;
		if (!quiet) toast('Gameplay stopped', 'info', 1200);
		this.notify();
	}

	/** Link the monster shader before the first spawn (a program first needed mid-frame stalls it, seconds on D3D11). */
	async warmUp(spawn) {
		if (this.warmed === this.app.world.scene) return;
		const probe = createMonster('zombie', { seed: 1 });
		Engine.toLocal(spawn, probe.root.position);
		this.group.add(probe.root);
		await this.app.backend.compile(this.group, this.app.world.camera).catch(() => {});
		probe.root.removeFromParent();
		probe.dispose();
		this.warmed = this.app.world.scene;
	}

	/** Scale the preview character to the hero height (default 1.8 m) for this session. */
	normaliseHeight() {
		const subject = this.app.subject;
		const target = this.settings.heroHeight;
		const current = measureHeight(subject.model);
		if (current > 0 && target > 0) subject.pivot.scale.multiplyScalar(target / current);
		subject.root.updateMatrixWorld(true);
		const height = measureHeight(subject.model) || target;
		this.app.character.height = height;
		return height;
	}

	// ---------------------------------------------------------------------------------------------
	// Nav grid from the scene's walk collision

	buildNav(spawn) {
		const t0 = performance.now();
		const c = this.collision;
		const half = GRID / 2;
		const ox = Math.floor(spawn.x) - half;
		const oz = Math.floor(spawn.z) - half;
		Engine.offset.set(-ox, 0, -oz); // local = world + offset -> the spawn sits at cell (half, half)
		const walk = new Uint8Array(GRID * GRID);
		const ground = new Float32Array(GRID * GRID).fill(NaN);
		const groundAt = (i, j, from) => c?.groundHeight(ox + i + 0.5, oz + j + 0.5, from + STEP) ?? null;
		let start = groundAt(half, half, spawn.y + 0.5);
		const flat = start === null; // no walk collision under the spawn (e.g. an empty studio): a flat floor
		if (flat) start = spawn.y;
		const out = new THREE.Vector3();
		const queue = [half + half * GRID];
		walk[queue[0]] = 1;
		ground[queue[0]] = start;
		const D = [1, 0, -1, 0, 0, 1, 0, -1];
		for (let q = 0; q < queue.length; q++) {
			const k = queue[q];
			const i = k % GRID;
			const j = (k / GRID) | 0;
			const g0 = ground[k];
			for (let d = 0; d < 8; d += 2) {
				const ni = i + D[d];
				const nj = j + D[d + 1];
				if (ni < 0 || nj < 0 || ni >= GRID || nj >= GRID) continue;
				const nk = ni + nj * GRID;
				if (walk[nk] || ground[nk] === -Infinity) continue;
				let g = flat ? start : groundAt(ni, nj, g0);
				if (g === null || Math.abs(g - g0) > STEP) continue;
				const x = ox + ni + 0.5;
				const z = oz + nj + 0.5;
				if (c && c.pushOut(x, z, 0.3, g + 0.35, g + 1.7, out) && Math.hypot(out.x - x, out.z - z) > 0.05) {
					ground[nk] = -Infinity; // wall / prop: never walkable
					continue;
				}
				walk[nk] = 1;
				ground[nk] = g;
				queue.push(nk);
			}
		}
		G.nav = new Nav({ w: GRID, h: GRID, walk });
		this.groundGrid = ground;
		this.flat = flat ? start : null;
		this.navStats = { cells: queue.length, ms: performance.now() - t0 };
	}

	/** Ground height at a gameplay-space point (scene collision, else the nav grid's cell height). */
	groundAt(x, z, reference) {
		if (this.flat !== null) return this.flat;
		const i = Math.floor(x);
		const j = Math.floor(z);
		const cell = i >= 0 && j >= 0 && i < GRID && j < GRID ? this.groundGrid[i + j * GRID] : NaN;
		const ref = Number.isFinite(cell) ? cell : reference;
		const g = this.collision?.groundHeight(x - Engine.offset.x, z - Engine.offset.z, ref + STEP);
		return g ?? ref;
	}

	// ---------------------------------------------------------------------------------------------
	// Skills: the lab runtime with monsters as targets (WebGL2 / GLSL only — three.quarks)

	ensureSkills() {
		const app = this.app;
		const host = this;
		if (app.backend.language !== 'GLSL') {
			FX.lib = null;
			return null;
		}
		if (!this.skills) {
			const targetOf = (m) =>
				(m.skillTarget ??= {
					get alive() {
						return !m.dead && !m.removed;
					},
					position: () => Engine.toWorld(m.pos, new THREE.Vector3()),
					center: () => Engine.toWorld(m.chestPos(new THREE.Vector3()), new THREE.Vector3()),
					hitTest: (p, padding = 0) => {
						Engine.toLocal(p, _l);
						return Math.hypot(_l.x - m.pos.x, _l.z - m.pos.z) <= m.radius + padding && _l.y >= m.pos.y - 0.3 && _l.y <= m.pos.y + m.height + 0.3;
					},
					hit: (amount, element = 'physical') => {
						const key = ELEMENT[element] || 'magic';
						const packet = { [key]: amount };
						if (key === 'cold') packet.coldDur = 2;
						if (key === 'poison') {
							packet.poison = amount;
							packet.poisonDur = 2.5;
						}
						dealDamage(m, packet, host.player);
					},
				});
			this.skills = new SkillSystem(
				{
					fxScene: app.world.vfxScene,
					scene: app.world.scene,
					camera: () => app.world.camera,
					depthTexture: app.backend.pipeline?.sceneDepthTexture ?? null,
					caster: {
						position: () => Engine.toWorld(host.player.pos, new THREE.Vector3()),
						hand: () => {
							const p = host.player;
							return Engine.toWorld(new THREE.Vector3(p.pos.x + Math.sin(p.facing) * 0.45, p.pos.y + p.height * 0.62, p.pos.z + Math.cos(p.facing) * 0.45), new THREE.Vector3());
						},
						face: (point) => {
							Engine.toLocal(point, _l);
							host.player.face(_l.x, _l.z, true);
						},
						onCast: () => host.player.startAction('cast', 'cast', { speed: host.player.castSpeed, lock: true }),
						teleport: (point) => {
							Engine.toLocal(point, _l);
							const p = G.nav.walkableAt(_l.x, _l.z) ? _l : G.nav.nearestWalkable(_l.x, _l.z, 4);
							host.player.pos.x = p.x;
							host.player.pos.z = p.z;
							host.player.path = null;
							host.player.intent = null;
						},
					},
					targets: () => G.actors.filter((a) => a.team === 1 && !a.dead).map(targetOf),
					groundAt: (x, z, y) => host.groundAt(x + Engine.offset.x, z + Engine.offset.z, y),
					light: { flash: () => {}, hold: () => ({ release() {} }) }, // no new lights: they would recompile every material
					shake: (s) => app.vfxLab?.shake(s),
				},
				{ soft: true },
			);
		}
		FX.lib = this.skills.fx;
		const skills = this.skills;
		return {
			cost: (id) => Math.round(4 + (SKILLS[id]?.cooldown || 0.5) * 5),
			cast: (id, localPoint, target) => {
				if (!SKILLS[id]) return false;
				skills.level = 1 + Math.floor((host.player.level - 1) / 4);
				const ground = Engine.toWorld(new THREE.Vector3(localPoint.x, host.groundAt(localPoint.x, localPoint.z, host.player.pos.y), localPoint.z), new THREE.Vector3());
				const aimTarget = target && !target.dead ? target.skillTarget || null : null;
				const point = aimTarget ? aimTarget.center() : ground.clone().add(new THREE.Vector3(0, 1, 0));
				return skills.cast(id, { point, ground, target: aimTarget });
			},
		};
	}

	skillLabel() {
		const id = this.player?.right;
		if (!this.skills) return 'Right click: attack (skills need the WebGL2 · GLSL renderer)';
		return `Right click: ${SKILLS[id]?.label || '—'} (F1–F8)`;
	}

	setRightSkill(id) {
		this.settings.right = id;
		this.save();
		if (this.player) this.player.right = id;
		this.notify();
	}

	// ---------------------------------------------------------------------------------------------
	// Spawning

	/** A pack of `type` some metres away from the player (in front, as seen by the camera). */
	spawn({ type = this.settings.monster, pack = this.settings.pack, count = this.settings.count, mlvl = this.settings.mlvl, distance = 9 } = {}) {
		if (!this.active || !this.player) return null;
		const P = this.player;
		const cam = this.app.world.camera.getWorldDirection(new THREE.Vector3()).setY(0);
		if (cam.lengthSq() < 1e-6) cam.set(0, 0, -1);
		cam.normalize();
		let best = null;
		for (let tries = 0; tries < 16 && !best; tries++) {
			const a = Math.atan2(cam.x, cam.z) + (this.rng.next() - 0.5) * (tries < 8 ? 1.4 : Math.PI * 2);
			const d = distance * (0.8 + this.rng.next() * 0.5);
			const x = P.pos.x + Math.sin(a) * d;
			const z = P.pos.z + Math.cos(a) * d;
			const p = G.nav.nearestWalkable(x, z, 6);
			if (G.nav.walkableAt(p.x, p.z) && Math.hypot(p.x - P.pos.x, p.z - P.pos.z) > 4) best = p;
		}
		if (!best) {
			toast('No walkable ground to spawn on near the character', 'error', 2500);
			return null;
		}
		const sp = { x: best.x, z: best.z, pack, monster: pack === 'boss' && type === 'zombie' ? 'hollow_king' : type, count, radius: 3, mlvl };
		const result = spawnPack(sp, 0, this.rng);
		for (const m of result.members) {
			m.pos.y = this.groundAt(m.pos.x, m.pos.z, P.pos.y);
			m.home.y = m.pos.y;
		}
		this.notify();
		return result;
	}

	clearMonsters() {
		for (const a of G.actors) if (a !== this.player) a.removeFromWorld();
		G.actors = this.player ? [this.player] : [];
		clearProjectiles();
		this.notify();
	}

	monsterCount() {
		return G.actors.filter((a) => a.team === 1 && !a.dead).length;
	}

	revive() {
		if (!this.player?.dead) return;
		this.player.revive();
		this.notify();
	}

	// ---------------------------------------------------------------------------------------------
	// Input

	onKey(e) {
		if (!this.active) return false;
		const k = e.key.toLowerCase();
		const f = /^f([1-8])$/.exec(k);
		if (f) {
			const id = SKILL_ORDER[Number(f[1]) - 1];
			if (id) {
				this.setRightSkill(id);
				toast(`Right click: ${SKILLS[id].label}`, 'info', 900);
			}
			return true;
		}
		if (e.repeat) return false;
		if (k === 'escape') {
			this.stop();
			return true;
		}
		if (k === 'enter' && this.player?.dead) {
			this.revive();
			return true;
		}
		if (k === 'n') {
			this.spawn();
			return true;
		}
		if (k === 'r' && this.player) {
			this.player.walk = !this.player.walk;
			toast(this.player.walk ? 'Walk' : 'Run', 'info', 800);
			return true;
		}
		return false;
	}

	// ---------------------------------------------------------------------------------------------
	// Frame (v1 main.js gameUpdate order)

	update(rawDt) {
		if (!this.active || !this.player) return;
		const app = this.app;
		const P = this.player;
		let dt = Math.min(rawDt, 0.05) * (app.vfxLab?.settings.timeScale ?? 1);
		if (G.hitstop > 0) {
			G.hitstop -= rawDt;
			dt *= 0.1;
		}
		G.time += dt;
		G.frame++;
		Engine.camera = app.world.camera;
		SHARED.uniforms.uTime.value += dt; // procedural shaders' clock (the subject no longer advances it while we drive it)

		Input.frame();
		P.input = Input;
		for (const a of G.actors) a.setHighlight?.(Input.hover?.ref === a);
		tickTimers(dt);
		hash.rebuild(G.actors);
		for (let i = 0; i < G.actors.length; i++) {
			const a = G.actors[i];
			if (a === P || a.removed) continue;
			const d2 = (a.pos.x - P.pos.x) ** 2 + (a.pos.z - P.pos.z) ** 2;
			if (!a.dead && d2 > 42 * 42 && a.team !== 0) {
				a.root.visible = d2 < 60 * 60;
				continue;
			}
			if (!a.dead) a.root.visible = true;
			a.update(dt);
		}
		P.update(dt);
		if (G.frame % 30 === 0) G.actors = G.actors.filter((a) => !a.removed);
		updateProjectiles(dt);
		updateEffects(dt);

		// v1 World.update duties: flow field toward the player, might auras.
		this.flowT -= dt;
		if (this.flowT <= 0) {
			this.flowT = 0.25;
			G.nav.buildFlow(P.pos.x, P.pos.z, 40);
		}
		this.auraT -= dt;
		if (this.auraT <= 0) {
			this.auraT = 0.5;
			updateAuras();
		}

		// Everyone stands on the scene's ground (v1 is flat; corpses keep their sink offset).
		for (const a of G.actors) {
			if (a.removed) continue;
			const sink = a.dead && a.deadT > 75 ? -((a.deadT - 75) / 3) * 0.4 : 0;
			a.pos.y = this.groundAt(a.pos.x, a.pos.z, a.pos.y) + sink;
		}

		this.updateWaves(dt);
		this.syncSubject();
		this.skills?.update(dt);
		app.vfxLab?.updateTexts(rawDt);
		app.vfxLab?.updateShake(rawDt);
		const ctrl = app.character;
		if (ctrl.settings.cutaway) {
			const chest = app.subject.root.getWorldPosition(_w).add(new THREE.Vector3(0, P.height * 0.6, 0));
			ctrl.cutaway.update(app.world.camera, chest, chest.y - P.height * 0.6, P.height, true);
		}
		this.hud.update(rawDt, { player: P, hover: Input.hover, skillLabel: this.skillLabel() });
		Input.endFrame();
	}

	updateWaves(dt) {
		if (!this.settings.waves || this.player.dead) return;
		this.waveT -= dt;
		if (this.waveT > 0) return;
		this.waveT = 4;
		if (this.monsterCount() >= this.settings.waveSize) return;
		const types = SPAWNABLE.filter((t) => t !== 'hollow_king');
		const type = types[Math.floor(this.rng.next() * types.length)];
		const roll = this.rng.next();
		const pack = roll < 0.12 ? 'unique' : roll < 0.3 ? 'champion' : 'normal';
		this.spawn({ type, pack, count: 3 + Math.floor(this.rng.next() * 3), distance: 14 });
	}

	/** Player proxy (gameplay space) -> the preview character under the scene anchor. */
	syncSubject() {
		const root = this.app.subject.root;
		const proxy = this.player.root;
		proxy.updateMatrixWorld(true);
		proxy.getWorldPosition(_w);
		root.parent.updateMatrixWorld(true);
		root.position.copy(root.parent.worldToLocal(_w));
		root.rotation.set(0, proxy.rotation.y, 0);
		root.updateMatrixWorld(true);
	}
}

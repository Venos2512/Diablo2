// Skill runtime: cast → anticipation (charge effect at the hand for `castTime`) → release (the skill's run())
// → motion (projectile / homing / nova / chain / area / follow) → impact → elemental death. Everything the
// skills touch in the world goes through a small host interface, so the same skills run in the lab (dummies)
// and in the game (monsters):
//
//   host = {
//     fxScene,                     // scene for particles and bolts (the lab's VFX layer)
//     scene,                       // scene for solid, lit projectile meshes (bone spear, hammer, meteor)
//     camera(),                    // current camera (bolts face it)
//     depthTexture,                // scene depth for soft particles (optional)
//     caster: { position(), hand(), face(point), onCast(skill), teleport(point) },
//     targets(),                   // [{ alive, position(), center(), hitTest(point, padding), hit(amount, element, { direction }) }]
//     groundAt(x, z, y),
//     light: { flash(point, colour, intensity, opts), hold(getPoint, colour, intensity, opts) -> { release() } },
//     shake(strength),             // optional: big events only (art-direction/07 §2)
//   }
import * as THREE from 'three';
import { FxLibrary } from './fx.js';
import { LightningPool } from './lightning.js';
import { SKILLS } from './skills.js';

/** Death effect per element (art-direction/07 §3: elemental deaths). */
const DEATH_FX = { fire: 'death.fire', cold: 'death.cold', lightning: 'death.shock', poison: 'death.poison', magic: 'bone.hit', physical: 'blood.hit' };
const Z = new THREE.Vector3(0, 0, 1);

export class SkillSystem {
	constructor(host, { soft = true } = {}) {
		this.host = host;
		this.fx = new FxLibrary({ scene: host.fxScene, depthTexture: host.depthTexture, soft });
		this.bolts = new LightningPool(host.fxScene);
		this.actors = new Set();
		this.timers = [];
		this.cooldowns = {};
		this.toggles = {};
		this.casting = null;
		this.time = 0;
		this.casts = 0;
		this.level = 1;
	}

	// ---------------------------------------------------------------------------------------------
	// Casting

	/** Remaining cooldown as 0..1 of the skill's cooldown. */
	cooldown(id) {
		const until = this.cooldowns[id] || 0;
		const total = SKILLS[id]?.cooldown || 1;
		return Math.max(0, Math.min(1, (until - this.time) / total));
	}

	isToggled(id) {
		return !!this.toggles[id];
	}

	/**
	 * Cast `id` at `aim` = { point, ground, target }. Returns false when it cannot (cooldown, still casting).
	 * Toggle skills (auras) switch off when recast.
	 */
	cast(id, aim) {
		const skill = SKILLS[id];
		if (!skill) return false;
		if (skill.toggle && this.toggles[id]) {
			this.toggles[id].stop();
			delete this.toggles[id];
			return true;
		}
		if (this.cooldown(id) > 0 || this.casting) return false;
		const host = this.host;
		host.caster.face?.(aim.point);
		host.caster.onCast?.(skill);
		this.cooldowns[id] = this.time + (skill.cooldown || 0);
		this.casts++;
		const release = () => {
			this.casting = null;
			const ctx = this.context(skill, aim);
			const result = skill.run(ctx);
			if (skill.toggle && result) this.toggles[id] = result;
		};
		const castTime = skill.castTime || 0;
		if (castTime > 0) {
			const charge = skill.charge ? this.fx.attach(skill.charge, () => host.caster.hand(), { scale: this.scale }) : null;
			this.casting = { id, charge };
			this.after(castTime, () => {
				charge?.stop();
				release();
			});
		} else release();
		return true;
	}

	get scale() {
		// Higher level: same effect, bigger (art-direction/07 rule 4) — sizes grow slower than damage.
		return Math.sqrt(this.level);
	}

	targets() {
		return this.host.targets().filter((t) => t.alive);
	}

	// ---------------------------------------------------------------------------------------------
	// The API a skill's run(ctx) gets

	context(skill, aim) {
		const host = this.host;
		const rt = this;
		const casterPos = host.caster.position();
		const from = host.caster.hand();
		const ground = (aim.ground || aim.point).clone();
		const flat = ground.clone().sub(casterPos).setY(0);
		if (flat.lengthSq() < 1e-6) flat.set(0, 0, 1);
		flat.normalize();
		// Aim: at a target's body, else level with the hand toward the cursor (D2 projectiles fly flat).
		const to = aim.target ? aim.target.center() : ground.clone().setY(from.y);
		const dir = to.clone().sub(from);
		if (dir.lengthSq() < 1e-6) dir.copy(flat);
		dir.normalize();
		const scale = this.scale;
		const level = this.level;
		return {
			skill,
			level,
			scale,
			element: skill.element,
			caster: host.caster,
			casterPos,
			from,
			to,
			ground,
			dir,
			flat,
			target: aim.target || null,
			fx: this.fx,
			play: (key, p, o = {}) => this.fx.play(key, p, { scale, ...o }),
			attach: (key, get, o = {}) => this.fx.attach(key, get, { scale, ...o }),
			place: (key, p, o = {}) => this.fx.place(key, p, { scale, ...o }),
			bolt: (a, b, o) => this.bolts.strike(a, b, o),
			flash: (p, color, intensity, o) => host.light?.flash(p, color, intensity, o),
			hold: (get, color, intensity, o) => host.light?.hold(get, color, intensity, o),
			shake: (s) => host.shake?.(s),
			groundAt: (x, z, y) => host.groundAt(x, z, y),
			targets: () => this.targets(),
			after: (t, fn) => this.after(t, fn),
			spawn: (actor) => this.spawn(actor),
			damage: (t, amount, opts) => this.damage(t, amount * level, { element: skill.element, ...opts }),
			inRadius: (center, r) => this.targets().filter((t) => t.position().setY(center.y).distanceTo(center) <= r),
			nearest: (p, maxDist = Infinity, exclude = null) => {
				let best = null;
				let bestD = maxDist;
				for (const t of this.targets()) {
					if (exclude?.has(t)) continue;
					const d = t.center().distanceTo(p);
					if (d < bestD) {
						bestD = d;
						best = t;
					}
				}
				return best;
			},
			projectile: (o) => rt.projectile({ scale, ...o }),
			nova: (o) => rt.nova(o),
			area: (o) => rt.area(o),
			mesh: (factory) => {
				const m = factory();
				host.scene.add(m);
				return m;
			},
		};
	}

	damage(target, amount, { element = 'physical', direction = null, hitFx = null } = {}) {
		if (!target?.alive) return;
		target.hit(Math.round(amount), element, { direction });
		if (hitFx) this.fx.play(hitFx, target.center());
		if (!target.alive) this.fx.play(DEATH_FX[element] || DEATH_FX.physical, target.position());
	}

	after(seconds, fn) {
		this.timers.push({ t: seconds, fn });
	}

	spawn(actor) {
		this.actors.add(actor);
		return actor;
	}

	// ---------------------------------------------------------------------------------------------
	// Motions

	/**
	 * Straight or steered projectile. o = { from, dir, speed, range, radius, fx, light: [colour, intensity],
	 * mesh(): Object3D, spin(mesh, dt), steer(dir, pos, dt), pierce, ground (collide, default true),
	 * onHit(target, pos, dir), onEnd(pos, reason, dir), scale }
	 */
	projectile(o) {
		const host = this.host;
		const pos = o.from.clone();
		const dir = o.dir.clone().normalize();
		const hit = new Set();
		let travelled = 0;
		let done = false;
		const fx = o.fx ? this.fx.attach(o.fx, () => pos, { getDir: () => dir, scale: o.scale }) : null;
		const mesh = o.mesh ? o.mesh() : null;
		if (mesh) host.scene.add(mesh);
		const light = o.light ? host.light?.hold(() => pos, o.light[0], o.light[1], { flicker: o.light[2] ?? 0.5 }) : null;
		const cleanup = () => {
			done = true;
			fx?.stop();
			light?.release();
			mesh?.removeFromParent();
		};
		const end = (reason, target) => {
			cleanup();
			o.onEnd?.(pos.clone(), reason, dir.clone(), target);
		};
		const sample = new THREE.Vector3();
		const actor = {
			pos,
			dir,
			end,
			get done() {
				return done;
			},
			update: (dt) => {
				if (done) return false;
				o.steer?.(dir, pos, dt);
				const step = o.speed * dt;
				const prev = sample.copy(pos);
				pos.addScaledVector(dir, step);
				travelled += step;
				if (mesh) {
					mesh.position.copy(pos);
					mesh.quaternion.setFromUnitVectors(Z, dir);
					o.spin?.(mesh, dt);
				}
				// Hit test at the end point and the midpoint of this frame's step.
				for (const t of this.targets()) {
					if (hit.has(t)) continue;
					const mid = prev.clone().lerp(pos, 0.5);
					if (t.hitTest(pos, o.radius ?? 0.3) || t.hitTest(mid, o.radius ?? 0.3)) {
						hit.add(t);
						o.onHit?.(t, pos.clone(), dir.clone());
						if (!o.pierce) {
							end('hit', t);
							return false;
						}
					}
				}
				if (o.ground !== false) {
					const g = host.groundAt(pos.x, pos.z, pos.y + 0.5);
					if (pos.y <= g + 0.05) {
						pos.y = g + 0.05;
						end('ground');
						return false;
					}
				}
				if (travelled >= o.range) {
					end('range');
					return false;
				}
				return true;
			},
			dispose: cleanup,
		};
		return this.spawn(actor);
	}

	/** Expanding ring on the ground: hits each target once as the front passes it. o = { center, speed, radius, onHit(target) } */
	nova(o) {
		const hit = new Set();
		let r = 0;
		return this.spawn({
			update: (dt) => {
				r += o.speed * dt;
				for (const t of this.targets()) {
					if (hit.has(t)) continue;
					if (t.position().setY(o.center.y).distanceTo(o.center) <= r) {
						hit.add(t);
						o.onHit(t);
					}
				}
				return r < o.radius;
			},
		});
	}

	/**
	 * Effect area that ticks: o = { duration, interval, test(target) -> bool, onTick(target), handles: [fx / light
	 * handles to stop at the end], onEnd() }
	 */
	area(o) {
		let age = 0;
		let tick = 0;
		const stop = () => {
			for (const h of o.handles || []) (h.stop || h.release)?.call(h);
			o.onEnd?.();
		};
		return this.spawn({
			update: (dt) => {
				age += dt;
				tick += dt;
				if (tick >= o.interval) {
					tick -= o.interval;
					for (const t of this.targets()) if (o.test(t)) o.onTick(t);
				}
				if (age >= o.duration) {
					stop();
					return false;
				}
				return true;
			},
			dispose: stop,
		});
	}

	// ---------------------------------------------------------------------------------------------

	update(dt) {
		this.time += dt;
		const due = [];
		this.timers = this.timers.filter((t) => {
			t.t -= dt;
			if (t.t <= 0) due.push(t);
			return t.t > 0;
		});
		for (const t of due) {
			try {
				t.fn();
			} catch (error) {
				console.error(error);
			}
		}
		for (const a of [...this.actors]) {
			let keep = false;
			try {
				keep = a.update(dt);
			} catch (error) {
				console.error(error);
			}
			if (!keep) this.actors.delete(a);
		}
		this.fx.update(dt);
		const camera = this.host.camera?.();
		if (camera) this.bolts.update(dt, camera);
	}

	get stats() {
		return { ...this.fx.stats, actors: this.actors.size, casts: this.casts, bolts: this.bolts.bolts.filter((b) => b.active).length };
	}

	/** Stop every skill, aura and effect now. */
	clear() {
		for (const t of Object.values(this.toggles)) t.stop();
		this.toggles = {};
		for (const a of this.actors) a.dispose?.();
		this.actors.clear();
		this.timers = [];
		this.casting?.charge?.stop();
		this.casting = null;
		this.cooldowns = {};
		this.fx.clear();
		this.bolts.clear();
	}

	dispose() {
		this.clear();
		this.fx.dispose();
		this.bolts.dispose();
	}
}


// Gameplay skills without three.quarks. The quarks skill library (src/skills) builds GLSL ShaderMaterials, so on the WebGPU · TSL
// renderer (and its WebGL2 fallback) it cannot run; instead of a dead right button the Sorceress skills run here on the gameplay's
// own primitives: projectiles and timed effects (projectiles.js), the v1 damage model (combat.js) and plain emissive meshes
// (MeshBasicMaterial works on both backends). The effects are simpler than the quarks ones — the numbers are the same:
// they come from src/skills/skills.js (damage, radius, durations, cooldown), scaled by the skill level like the quarks adapter.
//
// Structure follows the skill executor of the reference game (installSkills): resolve the aim once (dirTo: toward the target,
// else the facing when the point is on the caster), build the effect from missiles / fields (persistent effects with a tick and an
// end) / delayed callbacks, damage everything hostile inside a radius, and tell the player why when a skill cannot be used.
import * as THREE from 'three';
import { G, enemiesNear, after } from './state.js';
import { Engine } from './engine.js';
import { spawnProjectile, spawnEffect } from './projectiles.js';
import { dealDamage } from './combat.js';
import { SKILLS } from '../skills/skills.js';
import { REASONS, castMessage } from '../skills/castControl.js';

/** Skills this fallback can run (the Sorceress set); every other skill needs the WebGL2 · GLSL renderer. */
export const NATIVE_SKILLS = ['fireball', 'frozenorb', 'chainlightning', 'meteor', 'blizzard', 'firewall', 'teleport'];

const COLORS = { fire: 0xff7a2a, cold: 0x8fd8ff, light: 0xb9cdff };
const CAST_DELAY_MAX = 0.45;

const _hits = [];
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);

let kit = null;
function shared() {
	return (kit ??= {
		ring: new THREE.RingGeometry(0.82, 1, 40).rotateX(-Math.PI / 2),
		disc: new THREE.CircleGeometry(1, 36).rotateX(-Math.PI / 2),
		orb: new THREE.SphereGeometry(1, 14, 10),
		bar: new THREE.CylinderGeometry(1, 1, 1, 6),
		box: new THREE.BoxGeometry(1, 1, 1),
	});
}

function glowMaterial(color, opacity = 0.85) {
	return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
}

function place(mesh) {
	mesh.userData.labNoPick = mesh.userData.labNoCollide = true;
	Engine.scene?.add(mesh);
	return mesh;
}

/** A shape that scales from r0 to r1 and fades over `dur` seconds (rings, discs, flashes). */
function flash(pos, { shape = 'ring', color, r0 = 0.3, r1 = 2, dur = 0.4, y = 0.1, opacity = 0.85 }) {
	const mat = glowMaterial(color, opacity);
	const mesh = place(new THREE.Mesh(shared()[shape], mat));
	mesh.position.set(pos.x, pos.y + y, pos.z);
	mesh.scale.setScalar(r0);
	return spawnEffect({
		dur,
		update(_dt, e) {
			const k = Math.min(1, e.t / dur);
			mesh.scale.setScalar(r0 + (r1 - r0) * k);
			mat.opacity = opacity * (1 - k);
		},
		end() {
			mesh.removeFromParent();
			mat.dispose();
		},
	});
}

/** A straight glowing bar between two points for a moment (lightning). */
function bolt(a, b, color, dur = 0.22) {
	const mat = glowMaterial(color, 0.95);
	const mesh = place(new THREE.Mesh(shared().bar, mat));
	const len = Math.max(0.01, a.distanceTo(b));
	mesh.position.copy(a).add(b).multiplyScalar(0.5);
	mesh.scale.set(0.05, len, 0.05);
	mesh.quaternion.copy(_q.setFromUnitVectors(UP, _v.copy(b).sub(a).normalize()));
	return spawnEffect({
		dur,
		update(_dt, e) {
			mat.opacity = 0.95 * (1 - e.t / dur) * (0.6 + 0.4 * Math.sin(e.t * 90));
		},
		end() {
			mesh.removeFromParent();
			mat.dispose();
		},
	});
}

/** Damage every hostile within `r` (flat distance, bodies count): the reference's explode() / hostilesNear(). */
function hurtNear(owner, x, z, r, packet, skip = null) {
	enemiesNear(x, z, r, owner.team, _hits);
	for (const e of [..._hits]) if (e !== skip) dealDamage(e, { ...packet }, owner);
}

/** Direction caster -> aim point (dirTo in the reference: a point on the caster falls back to the facing). */
function dirTo(caster, point) {
	const dx = point.x - caster.pos.x;
	const dz = point.z - caster.pos.z;
	const l = Math.hypot(dx, dz);
	if (l < 1e-3) return { dx: Math.sin(caster.facing || 0), dz: Math.cos(caster.facing || 0), dist: 0 };
	return { dx: dx / l, dz: dz / l, dist: l };
}

const handPos = (c, d, h = 0.62) => new THREE.Vector3(c.pos.x + d.dx * 0.45, c.pos.y + c.height * h, c.pos.z + d.dz * 0.45);
const groundOf = (point, y) => new THREE.Vector3(point.x, y, point.z);

// ---------------------------------------------------------------------------------------------------------------------
// The skills. run(ctx): ctx = { P (caster), point (aim, gameplay space), target (actor | null), L (skill level), sc (effect scale), dmg(n), d (direction), g (ground point) }

/** Where a Teleport toward `point` lands (12 m at most, a walkable spot), or null when there is nowhere to go. */
function teleportDestination(P, point) {
	const nav = G.nav;
	if (!nav) return null;
	let dx = point.x - P.pos.x;
	let dz = point.z - P.pos.z;
	const l = Math.hypot(dx, dz);
	if (l > 12) {
		dx *= 12 / l;
		dz *= 12 / l;
	}
	const x = P.pos.x + dx;
	const z = P.pos.z + dz;
	const dest = nav.walkableAt(x, z) ? { x, z } : nav.nearestWalkable(x, z, 6);
	return dest && nav.walkableAt(dest.x, dest.z) ? { x: dest.x, z: dest.z } : null;
}

/** Skills that can refuse before anything is spent: id -> (caster, aim point) -> a REASONS code, else null. The cast keeps what it found in ctx. */
const PREFLIGHT = {
	teleport(P, point, ctx) {
		const dest = teleportDestination(P, point);
		if (!dest) return REASONS.nodest;
		if (ctx) ctx.dest = dest;
		return null;
	},
};

const RUN = {
	fireball(c) {
		const { P, sc, d } = c;
		spawnProjectile({
			kind: 'fireball', pos: handPos(P, d), dir: new THREE.Vector3(d.dx, 0, d.dz), speed: 15, range: 18, radius: 0.35, team: 0, owner: P,
			packet: { fire: c.dmg(28) }, data: { explodeOnWall: true },
			onHit: (_p, hit, pos) => {
				hurtNear(P, pos.x, pos.z, 2 * sc, { fire: c.dmg(17) }, hit);
				flash(pos, { shape: 'disc', color: COLORS.fire, r0: 0.4, r1: 2 * sc, dur: 0.35, y: 0.6 });
				flash(pos, { color: 0xffd9a0, r0: 0.3, r1: 2.6 * sc, dur: 0.5, y: 0.2 });
			},
		});
	},

	frozenorb(c) {
		const { P, sc, d } = c;
		let tick = 0;
		const burst = (pos, r, damage) => {
			hurtNear(P, pos.x, pos.z, r, { cold: damage, coldDur: 2 });
			flash(pos, { color: COLORS.cold, r0: 0.4, r1: r, dur: 0.45, y: 0.5 });
		};
		spawnProjectile({
			kind: 'cold_orb', visual: 'cold_orb', pos: handPos(P, d), dir: new THREE.Vector3(d.dx, 0, d.dz), speed: 5.5, range: 11, radius: 0.3, team: 0, owner: P,
			pierce: true, packet: { cold: c.dmg(4), coldDur: 2 },
			onTick: (p, dt) => {
				tick += dt;
				if (tick < 0.25) return;
				tick = 0;
				burst(p.pos, 2.8 * sc, c.dmg(4)); // the spray: cold ticks to whatever is in reach of the shards
			},
			onExpire: (p) => burst(p.pos, 3.2 * sc, c.dmg(12)), // the shard nova at the end of its path
		});
	},

	chainlightning(c) {
		const { P, d, L } = c;
		const from = handPos(P, d, 0.7);
		const ground = c.g.clone();
		ground.y += 1;
		enemiesNear(ground.x, ground.z, 3, P.team, _hits);
		let target = c.target && !c.target.dead ? c.target : [..._hits].sort((a, b) => Math.hypot(a.pos.x - ground.x, a.pos.z - ground.z) - Math.hypot(b.pos.x - ground.x, b.pos.z - ground.z))[0] || null;
		if (!target) {
			const end = c.g.clone();
			end.y += 0.1;
			bolt(from, end, COLORS.light, 0.25);
			flash(end, { color: COLORS.light, r0: 0.2, r1: 1.2, dur: 0.25 });
			return;
		}
		const done = new Set();
		let damage = 18 * L;
		let origin = from;
		const jump = (i) => {
			if (!target || target.dead || i >= 5) return;
			const to = target.chestPos(new THREE.Vector3());
			bolt(origin, to, COLORS.light, 0.25);
			flash(target.pos, { color: COLORS.light, r0: 0.2, r1: 1.1, dur: 0.25, y: 0.6 });
			dealDamage(target, { light: damage }, P);
			done.add(target);
			damage *= 0.9; // 10 % weaker per jump
			origin = to;
			enemiesNear(target.pos.x, target.pos.z, 6, P.team, _hits);
			const here = target;
			target = [..._hits].filter((e) => !done.has(e)).sort((a, b) => Math.hypot(a.pos.x - here.pos.x, a.pos.z - here.pos.z) - Math.hypot(b.pos.x - here.pos.x, b.pos.z - here.pos.z))[0] || null;
			if (target) after(0.09, () => jump(i + 1));
		};
		jump(0);
	},

	meteor(c) {
		const { P, sc } = c;
		const g = c.g;
		const fall = 0.8;
		flash(g, { color: COLORS.fire, r0: 2.4 * sc, r1: 2.4 * sc, dur: fall, y: 0.08, opacity: 0.6 }); // telegraph: the spot is marked before the rock lands
		const rockMat = glowMaterial(0xff6a20, 1);
		const rock = place(new THREE.Mesh(shared().orb, rockMat));
		rock.scale.setScalar(0.5);
		spawnEffect({
			dur: fall,
			update(_dt, e) {
				const k = Math.min(1, e.t / fall);
				rock.position.set(g.x - 3 * (1 - k), g.y + 11 * (1 - k * k) + 0.4, g.z - 2 * (1 - k));
			},
			end(e) {
				rock.removeFromParent();
				rockMat.dispose();
				if (e.cancelled) return; // stopped mid-fall: the rock is gone, nothing lands
				hurtNear(P, g.x, g.z, 2.4 * sc, { fire: c.dmg(50) });
				flash(g, { shape: 'disc', color: 0xffa040, r0: 0.5, r1: 3.2 * sc, dur: 0.6, y: 0.7 });
				flash(g, { color: 0xffd9a0, r0: 0.5, r1: 4 * sc, dur: 0.6, y: 0.2 });
				Engine.rig.shake(0.35);
				// the ground burns for 3 s (burnTick in the reference: damage on a short period)
				const burn = glowMaterial(COLORS.fire, 0.35);
				const mesh = place(new THREE.Mesh(shared().disc, burn));
				mesh.position.set(g.x, g.y + 0.06, g.z);
				mesh.scale.setScalar(1.6 * sc);
				let acc = 0;
				spawnEffect({
					dur: 3,
					update(dt, f) {
						burn.opacity = 0.3 + 0.1 * Math.sin(f.t * 14);
						acc += dt;
						if (acc >= 0.5) {
							acc = 0;
							hurtNear(P, g.x, g.z, 1.6 * sc, { fire: c.dmg(5) });
						}
					},
					end() {
						mesh.removeFromParent();
						burn.dispose();
					},
				});
			},
		});
	},

	blizzard(c) {
		const { P, sc } = c;
		const g = c.g;
		const R = 3.4 * sc;
		const mat = glowMaterial(COLORS.cold, 0.22);
		const mesh = place(new THREE.Mesh(shared().disc, mat));
		mesh.position.set(g.x, g.y + 0.07, g.z);
		mesh.scale.setScalar(R);
		let acc = 0.4;
		spawnEffect({
			dur: 4,
			update(dt, e) {
				mat.opacity = 0.2 + 0.08 * Math.sin(e.t * 9);
				acc += dt;
				if (acc < 0.4) return;
				acc = 0;
				hurtNear(P, g.x, g.z, R, { cold: c.dmg(7), coldDur: 2 });
				const a = Math.random() * Math.PI * 2;
				const r = Math.sqrt(Math.random()) * R;
				flash(_v.set(g.x + Math.sin(a) * r, g.y, g.z + Math.cos(a) * r), { color: 0xdff4ff, r0: 0.1, r1: 0.9, dur: 0.35, y: 0.1 });
			},
			end() {
				mesh.removeFromParent();
				mat.dispose();
			},
		});
	},

	firewall(c) {
		const { P, sc, d } = c;
		const g = c.g;
		const half = 2.25 * sc;
		const along = { x: -d.dz, z: d.dx }; // perpendicular to the cast direction
		const mat = glowMaterial(COLORS.fire, 0.6);
		const wall = place(new THREE.Mesh(shared().box, mat));
		wall.position.set(g.x, g.y + 0.45, g.z);
		wall.scale.set(half * 2, 0.9, 0.5);
		wall.rotation.y = Math.atan2(-along.z, along.x); // the box's long axis runs along `along`
		let acc = 0.35;
		spawnEffect({
			dur: 5,
			update(dt, e) {
				mat.opacity = 0.5 + 0.15 * Math.sin(e.t * 17);
				wall.scale.y = 0.8 + 0.25 * Math.sin(e.t * 11);
				acc += dt;
				if (acc < 0.35) return;
				acc = 0;
				enemiesNear(g.x, g.z, half + 0.8, P.team, _hits);
				for (const t of [..._hits]) {
					const rx = t.pos.x - g.x;
					const rz = t.pos.z - g.z;
					if (Math.abs(rx * along.x + rz * along.z) < half && Math.abs(rx * d.dx + rz * d.dz) < 0.6) dealDamage(t, { fire: c.dmg(7) }, P);
				}
			},
			end() {
				wall.removeFromParent();
				mat.dispose();
			},
		});
	},

	teleport(c) {
		const { P, dest } = c;
		// The destination was chosen (and checked) when the cast was accepted; the delay may have changed the map, so look again.
		const here = G.nav.walkableAt(dest.x, dest.z) ? dest : G.nav.nearestWalkable(dest.x, dest.z, 6);
		if (!here || !G.nav.walkableAt(here.x, here.z)) {
			P.notice?.say('teleport:blocked', castMessage(REASONS.nodest), 'info'); // mana and cooldown were spent when the cast started
			return;
		}
		const from = P.pos.clone();
		flash(from, { color: 0xb890ff, r0: 0.3, r1: 1.6, dur: 0.4 });
		P.pos.x = here.x;
		P.pos.z = here.z;
		P.path = null;
		P.intent = null;
		flash(P.pos, { color: 0xb890ff, r0: 1.8, r1: 0.3, dur: 0.45 });
	},
};

// ---------------------------------------------------------------------------------------------------------------------

/**
 * The skills adapter the Player talks to (same shape as the quarks adapter in host.js):
 *   supports(id) · cost(id) · status(id) -> null | 'cooldown' | 'casting' · cast(id, point, target) -> bool · clear()
 */
export function createNativeSkills() {
	const until = {};
	const levelOf = (P) => 1 + Math.floor((P.level - 1) / 4);
	return {
		kind: 'native',
		label: (id) => SKILLS[id]?.label || id,
		supports: (id) => NATIVE_SKILLS.includes(id),
		cost: (id) => Math.round(4 + (SKILLS[id]?.cooldown || 0.5) * 5),
		status(id) {
			if (!SKILLS[id]) return 'unknown';
			if (id === 'teleport' && G.inTown) return 'town';
			return (until[id] || 0) > G.time ? 'cooldown' : null;
		},
		/** Why this cast would be refused before anything is spent (turning, mana, cooldown): a REASONS code, else null. */
		check(id, point, target) {
			const P = G.player;
			if (!P || !PREFLIGHT[id]) return null;
			const aim = target && !target.dead ? target.pos : point;
			return PREFLIGHT[id](P, aim, null);
		},
		cast(id, point, target) {
			const P = G.player;
			const run = RUN[id];
			if (!P || !run || !SKILLS[id]) return false;
			if (this.status(id)) return false;
			const L = levelOf(P);
			const aim = target && !target.dead ? target.pos : point;
			const d = dirTo(P, aim);
			const ctx = { P, point: { x: aim.x, z: aim.z }, target: target && !target.dead ? target : null, L, sc: Math.sqrt(L), dmg: (n) => n * L, d, g: groundOf(aim, P.pos.y) };
			if (PREFLIGHT[id]?.(P, aim, ctx)) return false; // refused: no cooldown, no animation (the Player reports the reason via check())
			until[id] = G.time + (SKILLS[id].cooldown || 0);
			// the animation first, the effect when the cast clip reaches its release (a timer, so a hit that interrupts the clip does not eat the cast)
			const action = P.startAction('cast', 'cast', { speed: P.castSpeed, lock: true });
			after(Math.min(action?.impact ?? 0.25, CAST_DELAY_MAX), () => {
				if (P.dead) return;
				try {
					run(ctx);
				} catch (error) {
					console.error('native skill', id, error);
				}
			});
			return true;
		},
		clear() {
			for (const id of Object.keys(until)) delete until[id];
		},
	};
}

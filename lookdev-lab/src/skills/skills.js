// Skill definitions: Act I class skills in the element language of legacy/art-direction/07 §4. Each skill is data
// (label, class, element, cast time, cooldown, charge effect, numbers) plus a run(ctx) that wires motions
// and effects from the runtime (see runtime.js for ctx). Effects live in fx.js; numbers are per level 1
// (the runtime multiplies damage by the level and scales effects by √level).
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------
// Solid projectile meshes (lit, in the main scene): shared geometry + materials, one Mesh per cast.

let meshKit = null;
function kit() {
	if (meshKit) return meshKit;
	const bone = new THREE.MeshStandardMaterial({ color: '#e8dfc4', roughness: 0.55, emissive: '#7fbf90', emissiveIntensity: 0.6 });
	const spear = new THREE.ConeGeometry(0.07, 1.1, 6).rotateX(Math.PI / 2);
	const spearBack = new THREE.ConeGeometry(0.07, 0.25, 6).rotateX(-Math.PI / 2).translate(0, 0, -0.67);
	const gold = new THREE.MeshStandardMaterial({ color: '#ffd77a', metalness: 0.9, roughness: 0.3, emissive: '#ffcf60', emissiveIntensity: 1.6 });
	const head = new THREE.BoxGeometry(0.34, 0.2, 0.2);
	const handle = new THREE.CylinderGeometry(0.035, 0.035, 0.45, 6).translate(0, -0.3, 0);
	const rock = new THREE.MeshStandardMaterial({ color: '#2a1d16', roughness: 0.95, emissive: '#ff5a10', emissiveIntensity: 1.2 });
	const rockGeo = new THREE.DodecahedronGeometry(0.45, 1);
	meshKit = { bone, spear, spearBack, gold, head, handle, rock, rockGeo };
	return meshKit;
}

const noPick = (o) => {
	o.traverse((c) => (c.userData.labNoPick = true));
	return o;
};

function boneSpearMesh() {
	const k = kit();
	const g = new THREE.Group();
	g.add(new THREE.Mesh(k.spear, k.bone), new THREE.Mesh(k.spearBack, k.bone));
	return noPick(g);
}

function hammerMesh() {
	const k = kit();
	const g = new THREE.Group();
	const pivot = new THREE.Group();
	pivot.add(new THREE.Mesh(k.head, k.gold), new THREE.Mesh(k.handle, k.gold));
	g.add(pivot);
	g.userData.pivot = pivot;
	return noPick(g);
}

function meteorMesh() {
	const k = kit();
	return noPick(new THREE.Mesh(k.rockGeo, k.rock));
}

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------------------------------

export const SKILLS = {
	fireball: {
		label: 'Fireball', class: 'Sorceress', element: 'fire', castTime: 0.25, cooldown: 0.45, charge: 'fire.charge',
		summary: 'Rolling flame head with embers and black smoke; explodes on contact (flash, flame burst, sparks, shockwave). 28 fire + 60 % splash in 2 m.',
		run(ctx) {
			ctx.projectile({
				from: ctx.from, dir: ctx.dir, speed: 15, range: 18, radius: 0.35, fx: 'fire.ball', light: ['#ff8a30', 30, 0.6],
				onEnd: (p) => {
					ctx.play('fire.explode', p);
					ctx.flash(p, '#ff8a3a', 70, { duration: 0.4 });
					for (const t of ctx.inRadius(p, 2 * ctx.scale)) ctx.damage(t, t.hitTest(p, 0.5) ? 28 : 17, { direction: t.position().sub(p) });
				},
			});
		},
	},

	frozenorb: {
		label: 'Frozen Orb', class: 'Sorceress', element: 'cold', castTime: 0.3, cooldown: 1.2, charge: 'cold.charge',
		summary: 'A slow orb that sprays ice bolts in a turning spiral (circle emitter in Loop mode) and bursts into a shard nova at the end of its path. Chills.',
		run(ctx) {
			const dir = ctx.flat.clone();
			const p = ctx.projectile({
				from: ctx.from, dir, speed: 5.5, range: 11, radius: 0.3, fx: 'cold.orb', light: ['#8fc8ff', 25, 0.2], pierce: true, ground: false,
				onEnd: (pos) => {
					ctx.play('cold.burst', pos);
					ctx.flash(pos, '#a8d8ff', 50);
					for (const t of ctx.inRadius(pos, 3.2 * ctx.scale)) ctx.damage(t, 12);
				},
			});
			// The spray: cold ticks to whatever is in reach of the shards.
			let tick = 0;
			ctx.spawn({
				update: (dt) => {
					tick += dt;
					if (tick >= 0.25) {
						tick = 0;
						for (const t of ctx.inRadius(p.pos, 2.8 * ctx.scale)) ctx.damage(t, 4);
					}
					return !p.done;
				},
			});
		},
	},

	chainlightning: {
		label: 'Chain Lightning', class: 'Sorceress', element: 'lightning', castTime: 0.2, cooldown: 0.6, charge: 'shock.charge',
		summary: 'Jagged, flickering bolt (re-rolled every 50 ms, with forks) that jumps to up to 5 targets, 10 % weaker per jump.',
		run(ctx) {
			let target = ctx.target || ctx.nearest(ctx.ground.clone().setY(ctx.ground.y + 1), 3);
			let from = ctx.from;
			if (!target) {
				const end = ctx.ground.clone().add(v3(0, 0.1, 0));
				ctx.bolt(from, end, { width: 0.1, life: 0.25 });
				ctx.play('shock.hit', end);
				ctx.flash(end, '#b8ccff', 40, { duration: 0.2 });
				return;
			}
			const hit = new Set();
			let damage = 18;
			const jump = (i) => {
				if (!target || i >= 5) return;
				const to = target.center();
				ctx.bolt(from, to, { width: 0.1, life: 0.25, forks: 2 });
				ctx.play('shock.hit', to);
				ctx.flash(to, '#b8ccff', 45, { duration: 0.2 });
				ctx.damage(target, damage);
				hit.add(target);
				damage *= 0.9;
				from = to;
				target = ctx.nearest(to, 6, hit);
				ctx.after(0.09, () => jump(i + 1));
			};
			jump(0);
		},
	},

	meteor: {
		label: 'Meteor', class: 'Sorceress', element: 'fire', castTime: 0.4, cooldown: 2, charge: 'fire.charge',
		summary: 'Telegraphed: a rune circle marks the spot for 0.9 s, then a burning rock falls. Impact: flame dome, rocks (mesh particles) whose sub-emitters trail fire, dust ring, screen shake; the ground burns for 3 s.',
		run(ctx) {
			const g = ctx.ground.clone();
			const mark = ctx.place('meteor.target', g);
			ctx.after(0.9, () => mark.stop());
			ctx.after(0.35, () => {
				const start = g.clone().add(ctx.flat.clone().multiplyScalar(-4)).add(v3(0, 11, 0));
				const dir = g.clone().sub(start).normalize();
				ctx.projectile({
					from: start, dir, speed: 20, range: start.distanceTo(g) + 0.5, radius: 0.2, fx: 'meteor.fall', light: ['#ff7a2a', 40, 0.8], ground: true,
					mesh: meteorMesh, spin: (m, dt) => m.rotateX(dt * 6),
					onEnd: (p) => {
						p.copy(g);
						ctx.play('meteor.impact', p);
						ctx.flash(p.clone().add(v3(0, 1, 0)), '#ff8a3a', 160, { duration: 0.6, distance: 12 });
						ctx.shake(0.35);
						for (const t of ctx.inRadius(p, 2.4 * ctx.scale)) ctx.damage(t, 50, { direction: t.position().sub(p) });
						const burn = ctx.place('fire.ground', p);
						const light = ctx.hold(() => p.clone().add(v3(0, 0.6, 0)), '#ff6a20', 18, { flicker: 1 });
						ctx.area({ duration: 3, interval: 0.5, test: (t) => t.position().setY(p.y).distanceTo(p) < 1.6 * ctx.scale, onTick: (t) => ctx.damage(t, 5), handles: [burn, light] });
					},
				});
			});
		},
	},

	blizzard: {
		label: 'Blizzard', class: 'Sorceress', element: 'cold', castTime: 0.4, cooldown: 3, charge: 'cold.charge',
		summary: 'Ice shards (stretched billboards) rain on a 3.4 m area for 4 s; each shard bursts into frost and chips where it dies (death sub-emitters). Snow on a turbulence field.',
		run(ctx) {
			const g = ctx.ground.clone();
			const fx = ctx.place('blizzard', g);
			const light = ctx.hold(() => g.clone().add(v3(0, 2, 0)), '#7fb6ff', 22, { flicker: 0.3 });
			ctx.area({ duration: 4, interval: 0.4, test: (t) => t.position().setY(g.y).distanceTo(g) < 3.4 * ctx.scale, onTick: (t) => ctx.damage(t, 7), handles: [fx, light] });
		},
	},

	firewall: {
		label: 'Fire Wall', class: 'Sorceress', element: 'fire', castTime: 0.3, cooldown: 2.5, charge: 'fire.charge',
		summary: 'A 4.5 m wall of flame across the cast direction (grid emitter, flame flipbook, smoke on turbulence, embers on noise). Burns for 5 s.',
		run(ctx) {
			const g = ctx.ground.clone();
			const fx = ctx.place('fire.wall', g, { dir: ctx.flat });
			const along = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), ctx.flat).normalize();
			const light = ctx.hold(() => g.clone().add(v3(0, 0.8, 0)), '#ff7a2a', 35, { flicker: 1 });
			const halfLength = 2.25 * ctx.scale;
			ctx.area({
				duration: 5, interval: 0.35, handles: [fx, light],
				test: (t) => {
					const d = t.position().sub(g).setY(0);
					return Math.abs(d.dot(along)) < halfLength && Math.abs(d.dot(ctx.flat)) < 0.6;
				},
				onTick: (t) => ctx.damage(t, 7),
			});
		},
	},

	bonespear: {
		label: 'Bone Spear', class: 'Necromancer', element: 'magic', castTime: 0.25, cooldown: 0.5, charge: 'bone.charge',
		summary: 'A lit bone spear (solid mesh) trailing ghost-green wisps and splinters; pierces every target in its line. Hits shatter bone splinters (mesh particles).',
		run(ctx) {
			ctx.projectile({
				from: ctx.from, dir: ctx.dir, speed: 21, range: 16, radius: 0.25, pierce: true, fx: 'bone.spear', light: ['#bfe8c8', 14, 0.1],
				mesh: boneSpearMesh,
				onHit: (t, p, dir) => {
					ctx.play('bone.hit', p, { dir });
					ctx.flash(p, '#d8f0d0', 20, { duration: 0.2 });
					ctx.damage(t, 22, { direction: dir });
				},
				onEnd: (p, reason) => reason === 'ground' && ctx.play('bone.hit', p),
			});
		},
	},

	bonespirit: {
		label: 'Bone Spirit', class: 'Necromancer', element: 'magic', castTime: 0.3, cooldown: 0.8, charge: 'bone.charge',
		summary: 'A wailing spirit that wanders, then seeks the nearest target. Its ribbon is a quarks trail that follows the head and drains when the spirit is spent.',
		run(ctx) {
			const wander = Math.random() * 10;
			let age = 0;
			ctx.projectile({
				from: ctx.from, dir: ctx.dir.clone().add(v3(0, 0.4, 0)).normalize(), speed: 7, range: 26, radius: 0.35, fx: 'bone.spirit', light: ['#a8ffc8', 14, 0.3], ground: false,
				steer: (dir, pos, dt) => {
					age += dt;
					const target = age > 0.25 ? ctx.target?.alive ? ctx.target : ctx.nearest(pos, 14) : null;
					const desired = target ? target.center().sub(pos).normalize() : dir.clone();
					desired.x += Math.sin(age * 5 + wander) * 0.35;
					desired.y += Math.cos(age * 4 + wander) * 0.25 + (pos.y < ctx.groundAt(pos.x, pos.z, pos.y) + 0.6 ? 0.8 : 0);
					dir.lerp(desired.normalize(), 1 - Math.exp(-(target ? 3.5 : 1) * dt)).normalize();
				},
				onHit: (t, p, dir) => {
					ctx.play('bone.hit', p, { dir });
					ctx.flash(p, '#c8ffd8', 35, { duration: 0.3 });
					ctx.damage(t, 40, { direction: dir });
				},
			});
		},
	},

	poisonnova: {
		label: 'Poison Nova', class: 'Necromancer', element: 'poison', castTime: 0.35, cooldown: 1.5, charge: 'bone.charge',
		summary: 'A ring of toxic cloud and droplets expanding to 7 m (the hit front follows the ring). Poisons: damage over time.',
		run(ctx) {
			const c = ctx.casterPos.clone();
			ctx.play('poison.nova', c);
			ctx.flash(c.clone().add(v3(0, 1, 0)), '#8cff40', 40, { duration: 0.6 });
			ctx.nova({ center: c, speed: 6.4 * ctx.scale, radius: 7 * ctx.scale, onHit: (t) => ctx.damage(t, 5) });
		},
	},

	blessedhammer: {
		label: 'Blessed Hammer', class: 'Paladin', element: 'magic', castTime: 0.2, cooldown: 0.35,
		summary: 'A glowing hammer (lit mesh) spirals out from the caster for 2.2 s with a golden ribbon; hits whatever it sweeps through (again every 0.6 s).',
		run(ctx) {
			const centre = ctx.casterPos.clone().add(v3(0, 0.9, 0));
			const a0 = Math.atan2(ctx.flat.x, ctx.flat.z);
			const pos = centre.clone();
			const mesh = ctx.mesh(hammerMesh);
			const fx = ctx.attach('holy.hammer', () => pos);
			const light = ctx.hold(() => pos, '#ffd070', 16, { flicker: 0.2 });
			const lastHit = new Map();
			let t = 0;
			const stop = () => {
				fx.stop();
				light?.release();
				mesh.removeFromParent();
			};
			ctx.spawn({
				update: (dt) => {
					t += dt;
					const a = a0 + t * Math.PI * 1.4;
					const r = 0.6 + t * 1.5 * ctx.scale;
					pos.set(centre.x + Math.sin(a) * r, centre.y, centre.z + Math.cos(a) * r);
					mesh.position.copy(pos);
					mesh.rotation.y = a + Math.PI / 2;
					mesh.userData.pivot.rotation.z -= dt * 18;
					for (const target of ctx.targets()) {
						if (!target.hitTest(pos, 0.45)) continue;
						if (t - (lastHit.get(target) ?? -1) < 0.6) continue;
						lastHit.set(target, t);
						ctx.play('holy.hit', pos);
						ctx.damage(target, 14, { direction: target.position().sub(centre) });
					}
					if (t >= 2.2) {
						stop();
						return false;
					}
					return true;
				},
				dispose: stop,
			});
		},
	},

	holyfreeze: {
		label: 'Holy Freeze', class: 'Paladin', element: 'cold', castTime: 0, cooldown: 0.3, toggle: true,
		summary: 'Aura (toggle): a slowly turning rune circle under the feet, motes orbiting upward, ice shards; every second a cold pulse chills enemies within 4.5 m.',
		run(ctx) {
			const feet = () => ctx.caster.position();
			const aura = ctx.attach('aura.freeze', feet);
			const light = ctx.hold(() => feet().add(v3(0, 1, 0)), '#9fd0ff', 12, { flicker: 0.2 });
			let tick = 0;
			let stopped = false;
			const actor = ctx.spawn({
				update: (dt) => {
					if (stopped) return false;
					tick += dt;
					if (tick >= 1) {
						tick = 0;
						const p = feet();
						ctx.play('aura.pulse', p);
						for (const t of ctx.inRadius(p, 4.5 * ctx.scale)) ctx.damage(t, 3);
					}
					return true;
				},
				dispose: () => stop(),
			});
			const stop = () => {
				if (stopped) return;
				stopped = true;
				aura.stop();
				light?.release();
			};
			return { stop, actor };
		},
	},

	teleport: {
		label: 'Teleport', class: 'Sorceress', element: 'magic', castTime: 0.15, cooldown: 0.8,
		summary: 'Violet column out, the caster jumps to the cursor (12 m max), streaks rain down where it lands.',
		run(ctx) {
			const start = ctx.casterPos.clone();
			const offset = ctx.ground.clone().sub(start).setY(0);
			if (offset.length() > 12) offset.setLength(12);
			const dest = start.clone().add(offset);
			dest.y = ctx.groundAt(dest.x, dest.z, ctx.ground.y);
			ctx.play('teleport.out', start);
			ctx.flash(start.clone().add(v3(0, 1, 0)), '#b890ff', 30, { duration: 0.3 });
			ctx.caster.teleport?.(dest);
			ctx.play('teleport.in', dest);
			ctx.flash(dest.clone().add(v3(0, 1, 0)), '#b890ff', 40, { duration: 0.4 });
		},
	},
};

export const SKILL_ORDER = ['fireball', 'frozenorb', 'chainlightning', 'meteor', 'blizzard', 'firewall', 'bonespear', 'bonespirit', 'poisonnova', 'blessedhammer', 'holyfreeze', 'teleport'];
export const SKILL_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

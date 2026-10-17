// Spell and impact presets for the VFX lab, in the spirit of Act I skills. Every preset is built from
// the same few pieces — particle emitters, pooled lights, ground decals, dummy hits (status + damage) —
// so they double as recipes. `cast(ctx)` gets:
//   ctx.from (hand position), ctx.to (aim point), ctx.ground (ground under the aim), ctx.target (dummy or null),
//   ctx.emitter(config), ctx.flash(position, colour, intensity, opts), ctx.hold(getPosition, colour, intensity, opts),
//   ctx.actor({ update(dt) -> keep alive? }), ctx.dummies, ctx.hit(dummy, damage, kind, opts), ctx.lightning(a, b, opts),
//   ctx.groundAt(x, z, fallbackY), ctx.flame(position, opts), ctx.effect(name, overrides), ctx.vfxScene, ctx.stage
import * as THREE from 'three';

const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const arr = (v) => [v.x, v.y, v.z];

/** Fire / spark / smoke impact used by several spells. */
function impact(ctx, at, { color = '#ffb347', hot = '#ffffff', sparks = 36, smoke = 6, scorch = true, light = '#ff7a2a', lightIntensity = 60 } = {}) {
	ctx.emitter({
		name: 'Impact sparks', shape: 'spark', align: 'velocity', position: arr(at), max: sparks, burst: sparks,
		life: [0.25, 0.6], speed: [3, 7.5], spread: Math.PI, gravity: [0, -9.8, 0], drag: 1.2, size: [0.035, 0.02], stretch: 0.035,
		colors: [[0, hot, 6], [0.4, color, 4], [1, '#7a2a08', 1]], fadeIn: 0, fadeOut: 0.5, softness: 0.05,
	});
	ctx.emitter({
		name: 'Impact burst', shape: 'soft', position: arr(at), max: 24, burst: 20, radial: true, emitShape: 'sphere', radius: 0.12,
		life: [0.18, 0.35], speed: [0.8, 2.4], drag: 3, size: [0.35, 0.7], colors: [[0, hot, 5], [0.5, color, 3], [1, '#5a1a06', 0.5]], fadeIn: 0, fadeOut: 0.7,
	});
	if (smoke) {
		ctx.emitter({
			name: 'Impact smoke', shape: 'smoke', position: arr(at), max: smoke, burst: smoke, additive: 0, alpha: 0.45, emitShape: 'sphere', radius: 0.15,
			life: [0.8, 1.4], speed: [0.2, 0.6], gravity: [0, 0.6, 0], drag: 1, size: [0.35, 1.0], colors: [[0, '#4a3f38', 1], [1, '#2a2622', 1]], fadeIn: 0.15, fadeOut: 0.6,
		});
	}
	if (scorch && ctx.ground) {
		const g = ctx.ground.clone();
		g.y = ctx.groundAt(at.x, at.z, g.y) + 0.02;
		if (at.distanceTo(g) < 1.2) {
			ctx.emitter({
				name: 'Scorch decal', shape: 'splat', align: 'ground', position: [at.x, g.y, at.z], max: 1, burst: 1, additive: 0, alpha: 0.8,
				life: 7, speed: 0, size: [1.0, 1.1], sizeRandom: 0.2, spin: [0, 0], colors: [[0, '#0d0907', 1]], fadeIn: 0.02, fadeOut: 0.35, softness: 0.03,
			});
		}
	}
	ctx.flash(at, light, lightIntensity, { duration: 0.4, distance: 7 });
}

function projectile(ctx, { speed, onImpact, head, trail = [], light, maxRange = 30, homing = 0, wobble = 0 }) {
	const pos = ctx.from.clone();
	const dir = ctx.to.clone().sub(ctx.from).normalize();
	const vel = dir.clone().multiplyScalar(speed);
	const emitters = [head, ...trail].filter(Boolean).map((cfg) => ctx.emitter({ ...cfg, position: arr(pos) }, { autoRemove: true }));
	const held = light ? ctx.hold(() => pos, light.color, light.intensity, { distance: light.distance ?? 6, flicker: light.flicker ?? 0.5 }) : null;
	let travelled = 0;
	let t = 0;
	const state = { pos, done: false };
	const finish = (at, dummy) => {
		state.done = true;
		for (const e of emitters) e.stop();
		held?.release();
		onImpact?.(at, dummy, vel.clone().normalize());
	};
	ctx.actor({
		update(dt) {
			t += dt;
			if (wobble) {
				vel.x += (Math.random() - 0.5) * wobble * dt * speed;
				vel.z += (Math.random() - 0.5) * wobble * dt * speed;
				vel.y += (Math.random() - 0.5) * wobble * 0.3 * dt * speed;
				vel.setLength(speed);
			}
			if (homing && ctx.target?.alive) {
				const want = ctx.target.center().sub(pos).normalize().multiplyScalar(speed);
				vel.lerp(want, Math.min(1, homing * dt)).setLength(speed);
			}
			const step = vel.clone().multiplyScalar(dt);
			const steps = Math.max(1, Math.ceil(step.length() / 0.15));
			for (let i = 0; i < steps; i++) {
				pos.addScaledVector(step, 1 / steps);
				const hitDummy = ctx.dummies.find((d) => d.hitTest(pos, 0.05));
				const ground = ctx.groundAt(pos.x, pos.z, ctx.casterGround.y);
				if (hitDummy || pos.y <= ground + 0.03) {
					if (!hitDummy) pos.y = ground + 0.05;
					finish(pos.clone(), hitDummy);
					return false;
				}
			}
			for (const e of emitters) e.moveTo(pos);
			travelled += step.length();
			if (travelled > maxRange || t > 6) {
				finish(pos.clone(), null);
				return false;
			}
			return true;
		},
	});
	return state;
}

/** Expanding ring that hits each dummy once when the front passes it. */
function nova(ctx, { speed, radius, onHit }) {
	const center = ctx.ground.clone();
	const hit = new Set();
	let r = 0;
	ctx.actor({
		update(dt) {
			r += speed * dt;
			for (const d of ctx.dummies) {
				if (hit.has(d) || !d.alive) continue;
				const p = d.root.getWorldPosition(new THREE.Vector3());
				if (Math.hypot(p.x - center.x, p.z - center.z) <= r + 0.3) {
					hit.add(d);
					onHit(d);
				}
			}
			return r < radius;
		},
	});
}

export const SPELLS = {
	firebolt: {
		key: '1',
		label: 'Fire Bolt',
		kind: 'fire',
		summary: 'Projectile: flare head, rising ember trail, smoke, a moving point light; impact sparks, flash and a scorch decal. Sets dummies burning.',
		cast(ctx) {
			projectile(ctx, {
				speed: 14,
				head: { name: 'Fire Bolt head', shape: 'flare', max: 24, rate: 70, life: [0.08, 0.16], speed: [0, 0.2], size: [0.55, 0.25], spin: [-3, 3], colors: [[0, '#ffffff', 6], [0.5, '#ffc46b', 5], [1, '#ff5a1a', 3]], fadeIn: 0, fadeOut: 0.6 },
				trail: [
					{ name: 'Fire Bolt trail', shape: 'soft', max: 220, rate: 260, life: [0.2, 0.45], speed: [0.1, 0.5], spread: Math.PI, gravity: [0, 1.4, 0], drag: 2, size: [0.24, 0.04], colors: [[0, '#ffe2a0', 5], [0.35, '#ff7a1e', 3], [1, '#5a1404', 0.6]], fadeIn: 0.05, fadeOut: 0.5 },
					{ name: 'Fire Bolt smoke', shape: 'smoke', max: 60, rate: 36, life: [0.6, 1.0], speed: [0.1, 0.3], spread: Math.PI, gravity: [0, 0.7, 0], drag: 1, size: [0.18, 0.55], additive: 0, alpha: 0.32, colors: [[0, '#3c3430', 1], [1, '#1e1b19', 1]], fadeIn: 0.2, fadeOut: 0.6 },
				],
				light: { color: '#ff8a3d', intensity: 26, distance: 6 },
				onImpact(at, dummy, dir) {
					impact(ctx, at, { color: '#ffb347' });
					if (dummy) ctx.hit(dummy, 22, 'fire', { direction: dir, statusDuration: 2.5 });
				},
			});
		},
	},

	frostnova: {
		key: '2',
		label: 'Frost Nova',
		kind: 'cold',
		summary: 'Ground shockwave ring, ice shards stretched along velocity, cold mist; dummies hit by the front are frozen (status shader).',
		cast(ctx) {
			const c = ctx.casterGround.clone();
			c.y += 0.06;
			const speed = 12;
			const radius = 8;
			ctx.ground = c;
			ctx.emitter({ name: 'Frost Nova ring', shape: 'ring', align: 'ground', position: arr(c), max: 1, burst: 1, life: radius / speed, speed: 0, spin: [0, 0], size: [0.4, radius * 2 * 1.1], sizeRandom: 0, colors: [[0, '#ffffff', 5], [0.5, '#9fdcff', 3], [1, '#3d8bff', 1.5]], fadeIn: 0, fadeOut: 0.5, softness: 0.05 });
			ctx.emitter({ name: 'Frost Nova shards', shape: 'shard', align: 'velocity', position: [c.x, c.y + 0.35, c.z], max: 110, burst: 110, radial: true, planar: true, emitShape: 'ring', radius: 0.4, life: [0.55, 0.7], speed: [9, 12.5], size: [0.09, 0.05], stretch: 0.03, colors: [[0, '#ffffff', 4], [1, '#6ec8ff', 2]], fadeIn: 0, fadeOut: 0.4 });
			ctx.emitter({ name: 'Frost Nova mist', shape: 'smoke', position: [c.x, c.y + 0.25, c.z], max: 48, burst: 48, radial: true, planar: true, emitShape: 'ring', radius: 0.6, life: [0.8, 1.4], speed: [3, 7], drag: 1.6, size: [0.5, 1.5], additive: 0.35, alpha: 0.4, colors: [[0, '#e8f8ff', 1.4], [1, '#9fc8e8', 0.8]], fadeIn: 0.1, fadeOut: 0.6 });
			ctx.flash(v3(c.x, c.y + 0.8, c.z), '#7fc8ff', 70, { duration: 0.55, distance: 10 });
			nova(ctx, { speed, radius, onHit: (d) => ctx.hit(d, 12, 'cold', { statusDuration: 3.5 }) });
		},
	},

	poisonnova: {
		key: '3',
		label: 'Poison Nova',
		kind: 'poison',
		summary: 'Expanding ring of toxic clouds (half additive, half alpha — mixed blending in one draw) and bubbles; poisons dummies (damage over time).',
		cast(ctx) {
			const c = ctx.casterGround.clone();
			c.y += 0.06;
			ctx.emitter({ name: 'Poison Nova clouds', shape: 'smoke', position: [c.x, c.y + 0.3, c.z], max: 140, burst: 140, radial: true, planar: true, emitShape: 'ring', radius: 0.35, life: [1.1, 1.7], speed: [5, 7], drag: 0.7, turbulence: 2, size: [0.45, 1.5], additive: 0.5, alpha: 0.6, colors: [[0, '#b6ff8a', 2], [0.5, '#4fd12e', 1.2], [1, '#1d4a12', 0.6]], fadeIn: 0.1, fadeOut: 0.5 });
			ctx.emitter({ name: 'Poison Nova bubbles', shape: 'soft', position: [c.x, c.y + 0.2, c.z], max: 70, burst: 70, radial: true, planar: true, emitShape: 'ring', radius: 0.3, life: [0.9, 1.4], speed: [5, 6.5], gravity: [0, 0.8, 0], drag: 0.6, size: [0.09, 0.05], colors: [[0, '#e2ffc4', 4], [1, '#6dff3a', 2]] });
			ctx.emitter({ name: 'Poison Nova ring', shape: 'ring', align: 'ground', position: arr(c), max: 1, burst: 1, life: 0.75, speed: 0, spin: [0, 0], size: [0.4, 14], sizeRandom: 0, colors: [[0, '#d6ffb0', 3], [1, '#3fae1e', 1]], fadeIn: 0, fadeOut: 0.6, softness: 0.05 });
			ctx.flash(v3(c.x, c.y + 0.8, c.z), '#7dff4a', 40, { duration: 0.6, distance: 9 });
			ctx.ground = c;
			nova(ctx, { speed: 9, radius: 7.5, onHit: (d) => ctx.hit(d, 6, 'poison', { statusDuration: 4 }) });
		},
	},

	chargedbolt: {
		key: '4',
		label: 'Charged Bolt',
		kind: 'lightning',
		summary: 'Five erratic sparks that wander towards the target, each crackling with procedural lightning arcs (stretched spark particles).',
		cast(ctx) {
			for (let i = 0; i < 5; i++) {
				const spread = (i - 2) * 0.18;
				const to = ctx.to.clone().sub(ctx.from).applyAxisAngle(new THREE.Vector3(0, 1, 0), spread).add(ctx.from);
				const sub = { ...ctx, to };
				let arcTimer = Math.random() * 0.1;
				const bolt = projectile(sub, {
					speed: 6.5,
					wobble: 7,
					maxRange: 11,
					head: { name: 'Charged Bolt spark', shape: 'flare', max: 12, rate: 50, life: [0.05, 0.12], speed: 0, size: [0.32, 0.18], spin: [-6, 6], colors: [[0, '#ffffff', 7], [1, '#6f9dff', 4]], fadeIn: 0, fadeOut: 0.5 },
					trail: [{ name: 'Charged Bolt crackle', shape: 'spark', align: 'velocity', max: 40, rate: 45, life: [0.08, 0.18], speed: [1.5, 3], spread: Math.PI, size: [0.02, 0.01], stretch: 0.05, colors: [[0, '#ffffff', 6], [1, '#5a7dff', 3]], fadeIn: 0, fadeOut: 0.5 }],
					light: i === 2 ? { color: '#8fb0ff', intensity: 18, distance: 5, flicker: 2 } : null,
					onImpact(at, dummy, dir) {
						ctx.emitter({ name: 'Charged Bolt pop', shape: 'spark', align: 'velocity', position: arr(at), max: 14, burst: 14, life: [0.12, 0.25], speed: [2, 5], spread: Math.PI, size: [0.025, 0.015], stretch: 0.04, colors: [[0, '#ffffff', 6], [1, '#6f9dff', 3]], fadeIn: 0 });
						ctx.flash(at, '#9fb8ff', 18, { duration: 0.18, distance: 4 });
						if (dummy) ctx.hit(dummy, 6, 'lightning', { direction: dir });
					},
				});
				// Occasional arcs from each spark down to the ground.
				ctx.actor({
					update(dt) {
						if (bolt.done) return false;
						arcTimer -= dt;
						if (arcTimer <= 0) {
							arcTimer = 0.1 + Math.random() * 0.15;
							const a = bolt.pos.clone();
							const b = a.clone().add(v3((Math.random() - 0.5) * 1.4, 0, (Math.random() - 0.5) * 1.4));
							b.y = ctx.groundAt(b.x, b.z, a.y - 1.2) + 0.02;
							ctx.lightning(a, b, { segments: 7, jitter: 0.22, life: 0.09 });
						}
						return true;
					},
				});
			}
		},
	},

	hit: {
		key: '5',
		label: 'Hit: sparks & blood',
		kind: 'physical',
		summary: 'Melee impact: stretched sparks, alpha-blended blood droplets with gravity, a blood splat decal on the ground and a dust puff.',
		cast(ctx) {
			const at = ctx.target ? ctx.target.center() : ctx.to.clone();
			const dir = at.clone().sub(ctx.from).setY(0).normalize();
			ctx.emitter({ name: 'Hit sparks', shape: 'spark', align: 'velocity', position: arr(at), max: 30, burst: 30, direction: arr(dir.clone().negate().add(v3(0, 0.5, 0))), spread: 1.1, life: [0.15, 0.4], speed: [3, 7], gravity: [0, -9.8, 0], size: [0.03, 0.015], stretch: 0.03, colors: [[0, '#ffffff', 5], [1, '#ffb347', 3]], fadeIn: 0 });
			ctx.emitter({ name: 'Blood droplets', shape: 'soft', position: arr(at), max: 40, burst: 40, direction: arr(dir.clone().add(v3(0, 0.6, 0))), spread: 0.8, life: [0.5, 0.9], speed: [1.5, 4], gravity: [0, -9.8, 0], size: [0.07, 0.04], additive: 0, alpha: 1, colors: [[0, '#7a0606', 1], [1, '#2a0202', 1]], fadeIn: 0, fadeOut: 0.2, softness: 0.02 });
			const g = ctx.groundAt(at.x, at.z, at.y - 1);
			const splat = at.clone().addScaledVector(dir, 0.6);
			ctx.emitter({ name: 'Blood splat decal', shape: 'splat', align: 'ground', position: [splat.x, g + 0.02, splat.z], max: 1, burst: 1, additive: 0, alpha: 0.95, life: 9, speed: 0, size: [0.25, 0.8], sizeRandom: 0.2, spin: [0, 0], colors: [[0, '#3a0303', 1]], fadeIn: 0.02, fadeOut: 0.3, softness: 0.03 });
			ctx.emitter({ name: 'Dust puff', shape: 'smoke', position: [at.x, g + 0.15, at.z], max: 8, burst: 8, additive: 0, alpha: 0.35, emitShape: 'disc', radius: 0.3, radial: true, planar: true, life: [0.7, 1.1], speed: [0.4, 0.9], drag: 1.5, size: [0.3, 0.8], colors: [[0, '#9a8a74', 1], [1, '#6a5e50', 1]] });
			if (ctx.target) ctx.hit(ctx.target, 8, 'physical', { direction: dir });
		},
	},

	death: {
		key: '6',
		label: 'Dissolve death',
		kind: 'fire',
		summary: 'Kills the targeted (or nearest) dummy with the dissolve surface shader and an ember burst; it is summoned back with the same shader in reverse.',
		cast(ctx) {
			const d = ctx.target || ctx.nearestDummy();
			if (!d) return;
			const at = d.center();
			ctx.emitter({ name: 'Death embers', shape: 'soft', position: arr(at), max: 80, burst: 0, rate: 70, duration: 1.2, emitShape: 'sphere', radius: 0.45, life: [0.6, 1.2], speed: [0.2, 0.6], gravity: [0, 1.2, 0], turbulence: 2, size: [0.06, 0.02], colors: [[0, '#ffd27a', 5], [1, '#ff4a0a', 2]] });
			ctx.flash(at, '#ff7a2a', 30, { duration: 1.0, distance: 6 });
			d.die('fire');
		},
	},

	portal: {
		key: '7',
		label: 'Town Portal',
		kind: 'utility',
		summary: 'Opens a portal at the cursor (the Shaders-tab portal material) with a scale-in, orbiting motes and a light; closes after 15 s or on recast.',
		persistent: true,
		cast(ctx) {
			const g = ctx.ground.clone();
			const inst = ctx.effect('portal');
			const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.0), inst.material);
			mesh.name = 'Town portal (cast)';
			mesh.position.set(g.x, g.y + 1.04, g.z);
			mesh.scale.setScalar(0.01);
			mesh.renderOrder = 6;
			ctx.vfxScene.add(mesh);
			ctx.prepare(mesh);
			const motes = ctx.emitter({ name: 'Portal motes', shape: 'soft', position: [g.x, g.y + 0.1, g.z], max: 80, rate: 30, life: [1.2, 2], emitShape: 'ring', radius: 0.7, speed: [0.3, 0.7], direction: [0, 1, 0], spread: 0.3, swirl: 1.4, size: [0.07, 0.03], colors: [[0, '#cfe4ff', 4], [1, '#3d8bff', 2]] }, { autoRemove: true });
			const light = ctx.hold(() => mesh.getWorldPosition(new THREE.Vector3()).add(v3(0, 0, 0.4)), '#4d8fff', 0, { distance: 7, flicker: 0.3 });
			ctx.flash(v3(g.x, g.y + 1, g.z), '#9fc8ff', 40, { duration: 0.5 });
			let t = 0;
			let closing = false;
			const close = () => (closing = true);
			ctx.actor({
				update(dt) {
					t += dt;
					const cam = ctx.camera.position;
					mesh.rotation.y = Math.atan2(cam.x - mesh.position.x, cam.z - mesh.position.z);
					const open = closing ? Math.max(0, mesh.scale.x - dt * 2.5) : Math.min(1, t / 0.6);
					const eased = closing ? open : 1 - Math.pow(1 - open, 3);
					mesh.scale.set(eased, eased, 1);
					light.setIntensity(eased * 9);
					if (t > 15) closing = true;
					if (closing && mesh.scale.x <= 0) {
						mesh.removeFromParent();
						mesh.geometry.dispose();
						motes.stop();
						light.release();
						return false;
					}
					return true;
				},
				close,
			});
			return { close };
		},
	},

	waypoint: {
		key: '8',
		label: 'Waypoint',
		kind: 'utility',
		summary: 'Activates a rune circle at the cursor (the Shaders-tab runes material): sweep-in, rising light motes and a glow; fades after 12 s or on recast.',
		persistent: true,
		cast(ctx) {
			const g = ctx.ground.clone();
			const inst = ctx.effect('runes', { activation: 0 });
			const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-Math.PI / 2), inst.material);
			mesh.name = 'Waypoint runes (cast)';
			mesh.position.set(g.x, g.y + 0.015, g.z);
			mesh.renderOrder = 6;
			ctx.vfxScene.add(mesh);
			ctx.prepare(mesh);
			const motes = ctx.emitter({ name: 'Waypoint motes', shape: 'soft', position: [g.x, g.y + 0.05, g.z], max: 90, rate: 45, life: [1, 1.8], emitShape: 'ring', radius: 1.15, speed: [0.6, 1.2], direction: [0, 1, 0], spread: 0.1, size: [0.06, 0.02], colors: [[0, '#d6f4ff', 4], [1, '#5fd0ff', 2]] }, { autoRemove: true });
			const light = ctx.hold(() => v3(g.x, g.y + 0.6, g.z), '#5fd0ff', 0, { distance: 6 });
			let t = 0;
			let closing = false;
			ctx.actor({
				update(dt) {
					t += dt;
					const a = inst.uniforms.activation;
					a.value = closing ? Math.max(0, a.value - dt * 1.5) : Math.min(1, t / 1.2);
					light.setIntensity(a.value * 6);
					if (t > 12) closing = true;
					if (closing && a.value <= 0) {
						mesh.removeFromParent();
						mesh.geometry.dispose();
						motes.stop();
						light.release();
						return false;
					}
					return true;
				},
				close: () => (closing = true),
			});
		},
	},

	campfire: {
		key: '9',
		label: 'Campfire',
		kind: 'utility',
		summary: 'Toggles a campfire at the cursor: instanced flame billboards, rising embers with turbulence, alpha-blended smoke and a flickering light.',
		persistent: true,
		cast(ctx) {
			const g = ctx.ground.clone();
			const flames = ctx.flame(g, [[0, 0.02, 0, 0.55, 1.0], [0.16, 0.02, 0.08, 0.38, 0.7], [-0.14, 0.02, -0.06, 0.42, 0.75]]);
			const embers = ctx.emitter({ name: 'Campfire embers', shape: 'soft', position: [g.x, g.y + 0.3, g.z], max: 120, rate: 28, life: [1.5, 3], emitShape: 'disc', radius: 0.25, speed: [0.6, 1.4], direction: [0, 1, 0], spread: 0.35, gravity: [0, 0.6, 0], turbulence: 3, size: [0.035, 0.015], colors: [[0, '#ffd27a', 6], [0.6, '#ff6a1a', 3], [1, '#3a0d02', 0]] }, { autoRemove: true });
			const smoke = ctx.emitter({ name: 'Campfire smoke', shape: 'smoke', position: [g.x, g.y + 0.9, g.z], max: 40, rate: 5, life: [3, 5], emitShape: 'disc', radius: 0.2, speed: [0.3, 0.6], direction: [0, 1, 0], spread: 0.25, gravity: [0, 0.25, 0], turbulence: 0.6, size: [0.5, 2.2], additive: 0, alpha: 0.35, colors: [[0, '#4a4440', 1], [1, '#2a2826', 1]], fadeIn: 0.15, fadeOut: 0.5 }, { autoRemove: true });
			const light = ctx.hold(() => v3(g.x, g.y + 0.7, g.z), '#ff8a3d', 22, { distance: 8, flicker: 2.5 });
			let closing = false;
			let t = 0;
			ctx.actor({
				update(dt) {
					t += dt;
					if (!closing) return true;
					flames.dispose();
					embers.stop();
					smoke.stop();
					light.release();
					return false;
				},
				close: () => (closing = true),
			});
		},
	},
};

export const SPELL_ORDER = ['firebolt', 'frostnova', 'poisonnova', 'chargedbolt', 'hit', 'death', 'portal', 'waypoint', 'campfire'];

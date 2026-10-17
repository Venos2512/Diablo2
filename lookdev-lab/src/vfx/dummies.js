// Training dummies for the VFX lab: hit reactions, status overlays and dissolve death/respawn — the
// surface effects from the Shaders tab driven by gameplay. Each dummy owns its own effect instances
// (status + rim + dissolve) applied once at spawn, so hits only change uniforms (no recompiles).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getForge } from '../env/materials.js';
import { forgedMaterial } from '../env/forge.js';

export const DAMAGE_COLORS = { fire: '#ff8a3d', cold: '#8fd8ff', poison: '#8dff6a', lightning: '#b9cdff', physical: '#f2e6d0' };
const STATUS_MODE = { cold: 1, fire: 2, poison: 3 };
const DEATH_EDGE = { fire: '#ff6a1a', cold: '#7fd8ff', poison: '#7dff4a', lightning: '#9fc4ff', physical: '#ff3a1a' };

let sharedGeometry = null;

function dummyGeometry() {
	if (sharedGeometry) return sharedGeometry;
	const part = (g, x, y, z, rz = 0) => {
		g.rotateZ(rz);
		g.translate(x, y, z);
		return g;
	};
	const wood = mergeGeometries([
		part(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 20), 0, 0.04, 0),
		part(new THREE.CylinderGeometry(0.05, 0.06, 1.75, 10), 0, 0.875, 0),
		part(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 8), 0, 1.38, 0, Math.PI / 2),
	]);
	const cloth = mergeGeometries([
		part(new THREE.CylinderGeometry(0.24, 0.29, 0.78, 18, 3), 0, 1.12, 0),
		part(new THREE.SphereGeometry(0.17, 18, 12), 0, 1.68, 0),
		part(new THREE.CylinderGeometry(0.075, 0.06, 0.16, 10), -0.5, 1.38, 0, Math.PI / 2),
		part(new THREE.CylinderGeometry(0.075, 0.06, 0.16, 10), 0.5, 1.38, 0, -Math.PI / 2),
	]);
	sharedGeometry = { wood, cloth };
	return sharedGeometry;
}

export class Dummy {
	constructor(app, index) {
		this.app = app;
		this.index = index;
		const geo = dummyGeometry();
		const wood = forgedMaterial(getForge(app), 'wood', { name: `Dummy ${index + 1} · wood` });
		const cloth = new THREE.MeshStandardMaterial({ name: `Dummy ${index + 1} · burlap`, color: new THREE.Color('#8f7350'), roughness: 0.95 });
		this.root = new THREE.Group();
		this.root.name = `Training dummy ${index + 1}`;
		this.body = new THREE.Group(); // wobbles on hit
		this.root.add(this.body);
		this.meshes = [new THREE.Mesh(geo.wood, wood), new THREE.Mesh(geo.cloth, cloth)];
		for (const m of this.meshes) {
			m.castShadow = true;
			m.receiveShadow = true;
			m.userData.dummy = this;
			this.body.add(m);
		}
		const fx = app.backend.effects;
		this.fx = {
			status: fx.create('status', { amount: 0, intensity: 3 }),
			rim: fx.create('rim', { color: new THREE.Color('#ffffff'), power: 1.4, intensity: 0 }),
			dissolve: fx.create('dissolve', { progress: 0, edgeIntensity: 14, scale: 3.2 }),
		};
		for (const mesh of this.meshes) {
			let m = mesh.material;
			for (const inst of Object.values(this.fx)) m = inst.apply(m);
			mesh.material = m;
		}
		app.backend.prepareObject(this.root);
		this.maxHp = 100;
		this.hp = this.maxHp;
		this.status = { kind: null, until: 0 };
		this.flash = 0;
		this.wobble = new THREE.Vector2();
		this.wobbleVel = new THREE.Vector2();
		this.state = 'alive'; // alive | dying | dead | spawning
		this.stateTime = 0;
		this.dotTimer = 0;
		this.onDamage = null;
	}

	get alive() {
		return this.state === 'alive' || this.state === 'spawning';
	}

	/** Center of the hit volume in world space. */
	center(target = new THREE.Vector3()) {
		return this.root.getWorldPosition(target).add(new THREE.Vector3(0, 1.1, 0));
	}

	hitTest(point, padding = 0) {
		if (!this.alive) return false;
		const p = this.root.getWorldPosition(new THREE.Vector3());
		const dy = point.y - p.y;
		return dy > -0.2 && dy < 2.0 && Math.hypot(point.x - p.x, point.z - p.z) < 0.4 + padding;
	}

	hit(damage, kind, { time, direction = null, statusDuration = 3 } = {}) {
		if (!this.alive) return;
		this.hp -= damage;
		this.flash = 1;
		const push = direction ? new THREE.Vector2(direction.x, direction.z).normalize() : new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize();
		this.wobbleVel.addScaledVector(push, 2.2 * Math.min(1, damage / 15 + 0.3));
		if (STATUS_MODE[kind]) {
			this.status.kind = kind;
			this.status.until = time + statusDuration;
			this.fx.status.uniforms.mode.value = STATUS_MODE[kind];
		}
		this.onDamage?.(this, damage, kind);
		if (this.hp <= 0) this.die(kind);
	}

	die(kind = 'physical') {
		if (this.state === 'dying' || this.state === 'dead') return;
		this.state = 'dying';
		this.stateTime = 0;
		this.fx.dissolve.uniforms.edgeColor.value.set(DEATH_EDGE[kind] || DEATH_EDGE.physical);
		this.status.kind = null;
	}

	update(dt, time) {
		this.stateTime += dt;
		const d = this.fx.dissolve.uniforms;
		if (this.state === 'dying') {
			d.progress.value = Math.min(1, this.stateTime / 1.3);
			if (this.stateTime > 1.3) {
				this.state = 'dead';
				this.stateTime = 0;
			}
		} else if (this.state === 'dead') {
			if (this.stateTime > 1.4) {
				this.state = 'spawning';
				this.stateTime = 0;
				this.hp = this.maxHp;
				d.edgeColor.value.set('#9fd8ff');
			}
		} else if (this.state === 'spawning') {
			d.progress.value = Math.max(0, 1 - this.stateTime / 1.0);
			if (this.stateTime > 1.0) this.state = 'alive';
		}

		// Status: full while active, fades out over the last 0.4 s; poison ticks damage.
		const s = this.status;
		const remaining = s.kind ? s.until - time : 0;
		if (s.kind && remaining <= 0) s.kind = null;
		this.fx.status.uniforms.amount.value = s.kind ? Math.min(1, remaining / 0.4) : 0;
		if (s.kind === 'poison' && this.alive) {
			this.dotTimer += dt;
			if (this.dotTimer >= 0.5) {
				this.dotTimer -= 0.5;
				this.hp -= 3;
				this.onDamage?.(this, 3, 'poison');
				if (this.hp <= 0) this.die('poison');
			}
		}

		// Hit flash (rim) and a damped wobble.
		this.flash = Math.max(0, this.flash - dt * 6);
		this.fx.rim.uniforms.intensity.value = this.flash * this.flash * 5;
		this.wobbleVel.addScaledVector(this.wobble, -40 * dt).multiplyScalar(Math.max(0, 1 - 6 * dt));
		this.wobble.addScaledVector(this.wobbleVel, dt);
		this.body.rotation.set(this.wobble.y * 0.35, 0, -this.wobble.x * 0.35);
	}

	dispose() {
		this.root.removeFromParent();
		for (const m of this.meshes) m.material.dispose();
	}
}

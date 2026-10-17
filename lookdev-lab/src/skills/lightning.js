// Lightning ribbons: camera-facing strips along a jagged path (midpoint jitter that re-rolls every few
// frames, so the bolt flickers), with forks. Plain MeshBasicMaterial, so it runs on either renderer.
// quarks has no "particle between two points", which is what a bolt is.
import * as THREE from 'three';
import { skillTextures } from './textures.js';

const MAX_POINTS = 24;
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _side = new THREE.Vector3();
const _view = new THREE.Vector3();

class Bolt {
	constructor() {
		const geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(MAX_POINTS * 2 * 3);
		const uvs = new Float32Array(MAX_POINTS * 2 * 2);
		const index = [];
		for (let i = 0; i < MAX_POINTS - 1; i++) {
			const a = i * 2;
			index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
		for (let i = 0; i < MAX_POINTS; i++) {
			uvs.set([i / (MAX_POINTS - 1), 0, i / (MAX_POINTS - 1), 1], i * 4);
		}
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
		geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
		geometry.setIndex(index);
		this.material = new THREE.MeshBasicMaterial({
			map: skillTextures().beam,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			side: THREE.DoubleSide,
			// Additive colour, target alpha untouched (the VFX layer is composited premultiplied).
			blending: THREE.CustomBlending,
			blendEquation: THREE.AddEquation,
			blendSrc: THREE.SrcAlphaFactor,
			blendDst: THREE.OneFactor,
			blendSrcAlpha: THREE.ZeroFactor,
			blendDstAlpha: THREE.OneFactor,
		});
		this.mesh = new THREE.Mesh(geometry, this.material);
		this.mesh.frustumCulled = false;
		this.mesh.visible = false;
		this.mesh.userData.labNoPick = true;
		this.points = [];
		this.count = 0;
		this.age = 0;
		this.life = 0;
		this.active = false;
	}

	start(a, b, { color = '#cfe0ff', intensity = 4, width = 0.12, life = 0.22, segments = 12, jitter = 0.18, flicker = 0.05 } = {}) {
		this.a = a.clone();
		this.b = b.clone();
		this.width = width;
		this.life = life;
		this.age = 0;
		this.segments = Math.min(MAX_POINTS - 1, segments);
		this.jitter = jitter;
		this.flicker = flicker;
		this.reroll = 0;
		this.material.color.set(color).multiplyScalar(intensity);
		this.active = true;
		this.mesh.visible = true;
		this.roll();
	}

	/** New jagged path: displaced midpoints, strongest in the middle of the bolt. */
	roll() {
		const { a, b, segments } = this;
		const dir = _a.copy(b).sub(a);
		const len = dir.length();
		const n1 = new THREE.Vector3().crossVectors(dir, THREE.Object3D.DEFAULT_UP);
		if (n1.lengthSq() < 1e-6) n1.set(1, 0, 0);
		n1.normalize();
		const n2 = new THREE.Vector3().crossVectors(dir, n1).normalize();
		this.points.length = 0;
		for (let i = 0; i <= segments; i++) {
			const t = i / segments;
			const amp = i === 0 || i === segments ? 0 : this.jitter * len * Math.sin(Math.PI * t);
			this.points.push(a.clone().lerp(b, t).addScaledVector(n1, (Math.random() - 0.5) * amp).addScaledVector(n2, (Math.random() - 0.5) * amp));
		}
		this.count = this.points.length;
	}

	update(dt, camera) {
		if (!this.active) return;
		this.age += dt;
		if (this.age >= this.life) {
			this.active = false;
			this.mesh.visible = false;
			return;
		}
		this.reroll += dt;
		if (this.reroll >= this.flicker) {
			this.reroll = 0;
			this.roll();
		}
		const k = this.age / this.life;
		this.material.opacity = (1 - k) * (0.75 + Math.random() * 0.25);
		const pos = this.mesh.geometry.attributes.position;
		const camPos = camera.getWorldPosition(_view);
		const n = this.count;
		for (let i = 0; i < MAX_POINTS; i++) {
			const p = this.points[Math.min(i, n - 1)];
			const prev = this.points[Math.max(0, Math.min(i, n - 1) - 1)];
			const next = this.points[Math.min(n - 1, Math.min(i, n - 1) + 1)];
			const tangent = _a.copy(next).sub(prev).normalize();
			const toCam = _b.copy(camPos).sub(p).normalize();
			_side.crossVectors(tangent, toCam).normalize().multiplyScalar(this.width * 0.5 * (i >= n - 1 ? 0.4 : 1));
			pos.setXYZ(i * 2, p.x - _side.x, p.y - _side.y, p.z - _side.z);
			pos.setXYZ(i * 2 + 1, p.x + _side.x, p.y + _side.y, p.z + _side.z);
		}
		pos.needsUpdate = true;
	}
}

export class LightningPool {
	constructor(scene, size = 24) {
		this.group = new THREE.Group();
		this.group.name = 'Lightning bolts';
		this.bolts = [];
		for (let i = 0; i < size; i++) {
			const bolt = new Bolt();
			this.bolts.push(bolt);
			this.group.add(bolt.mesh);
		}
		scene?.add(this.group);
		this.next = 0;
	}

	acquire() {
		const free = this.bolts.find((b) => !b.active);
		if (free) return free;
		return this.bolts[this.next++ % this.bolts.length];
	}

	/** Bolt from a to b with `forks` short side branches. */
	strike(a, b, { forks = 2, ...opts } = {}) {
		this.acquire().start(a, b, opts);
		// A thin, wide-jitter double of the bolt reads as the glow around the core.
		this.acquire().start(a, b, { ...opts, width: (opts.width ?? 0.12) * 3, intensity: (opts.intensity ?? 4) * 0.25, jitter: (opts.jitter ?? 0.18) * 1.2 });
		const dir = b.clone().sub(a);
		for (let i = 0; i < forks; i++) {
			const t = 0.25 + Math.random() * 0.5;
			const from = a.clone().lerp(b, t);
			const to = from.clone().add(dir.clone().multiplyScalar(0.25 + Math.random() * 0.2).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.6) * 1, (Math.random() - 0.5) * 1.2)));
			this.acquire().start(from, to, { ...opts, width: (opts.width ?? 0.12) * 0.5, segments: 6, life: (opts.life ?? 0.22) * 0.7 });
		}
	}

	update(dt, camera) {
		for (const b of this.bolts) b.update(dt, camera);
	}

	clear() {
		for (const b of this.bolts) {
			b.active = false;
			b.mesh.visible = false;
		}
	}

	dispose() {
		for (const b of this.bolts) {
			b.mesh.geometry.dispose();
			b.material.dispose();
		}
		this.group.removeFromParent();
	}
}

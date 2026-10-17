// Stress tests: crowds of the current model (draw calls, skinning), many moving point lights (forward
// shading cost per light) and many particle emitters (CPU simulation + overdraw). Everything lives in
// one group so it can be cleared in one go, and it follows the active scene.
import * as THREE from 'three';
import { clone as cloneObject } from 'three/addons/utils/SkeletonUtils.js';
import { kelvinToColor } from '../core/grading.js';

export class StressTests {
	constructor(app) {
		this.app = app;
		this.group = new THREE.Group();
		this.group.name = 'Stress tests';
		this.crowd = [];
		this.mixers = [];
		this.lights = [];
		this.emitters = [];
		this.counts = { crowd: 0, lights: 0, emitters: 0 };
		this.time = 0;
		app.on('update', (dt) => this.update(dt));
		app.on('scene', (entry) => entry.scene.add(this.group));
		app.on('subject', () => this.counts.crowd && this.setCrowd(this.counts.crowd));
		app.current?.scene.add(this.group);
	}

	center() {
		return this.app.current.anchor.getWorldPosition(new THREE.Vector3());
	}

	ground(x, z, fallback) {
		return this.app.vfxLab ? this.app.vfxLab.groundAt(x, z, fallback) : fallback;
	}

	/** n copies of the subject (shared geometry + materials; skinned copies get their own mixer). */
	setCrowd(n) {
		for (const o of this.crowd) o.removeFromParent();
		this.crowd = [];
		this.mixers = [];
		this.counts.crowd = n;
		const subject = this.app.subject;
		if (!n || !subject.model) return;
		const box = new THREE.Box3().setFromObject(subject.model);
		const size = box.getSize(new THREE.Vector3());
		const spacing = Math.max(1.4, Math.max(size.x, size.z) * 1.35);
		const c = this.center();
		// Square spiral around the subject, skipping the centre cell.
		const cells = [];
		for (let ring = 1; cells.length < n; ring++) {
			for (let x = -ring; x <= ring; x++) for (let z = -ring; z <= ring; z++) if (Math.max(Math.abs(x), Math.abs(z)) === ring) cells.push([x, z]);
		}
		for (let i = 0; i < n; i++) {
			const [gx, gz] = cells[i];
			const copy = cloneObject(subject.model);
			const x = c.x + gx * spacing;
			const z = c.z + gz * spacing;
			const offset = subject.model.position; // the holder's centring offset inside the subject
			copy.position.set(x + offset.x, this.ground(x, z, c.y) + offset.y, z + offset.z);
			copy.rotation.y = Math.random() * Math.PI * 2;
			copy.name = `Crowd ${i + 1}`;
			copy.traverse((o) => (o.userData.labNoPick = true));
			this.group.add(copy);
			this.crowd.push(copy);
			if (subject.clips.length) {
				const mixer = new THREE.AnimationMixer(copy);
				const clip = subject.action?.getClip() || subject.clips[0];
				const action = mixer.clipAction(clip);
				action.play();
				action.time = Math.random() * clip.duration;
				this.mixers.push(mixer);
			}
		}
		this.app.backend.prepareObject(this.group);
		this.app.views.refresh([this.app.world.scene]);
	}

	/** n coloured point lights circling the subject (no shadows). */
	setLights(n) {
		for (const l of this.lights) l.removeFromParent();
		this.lights = [];
		this.counts.lights = n;
		for (let i = 0; i < n; i++) {
			const light = new THREE.PointLight(kelvinToColor(1800 + ((i * 2371) % 7000)), 6, 4.5, 2);
			light.name = `Stress light ${i + 1}`;
			light.userData.orbit = { radius: 1.5 + (i % 5) * 0.9, speed: 0.3 + ((i * 7) % 11) / 20, phase: (i / Math.max(1, n)) * Math.PI * 2, height: 0.4 + ((i * 3) % 7) * 0.25 };
			this.group.add(light);
			this.lights.push(light);
		}
	}

	/** n fire + smoke emitters on a ring (needs the VFX lab's particle system). */
	setEmitters(n) {
		const lab = this.app.vfxLab;
		for (const e of this.emitters) lab.particles?.remove(e);
		this.emitters = [];
		this.counts.emitters = n;
		if (!n) return;
		if (!lab.armed) lab.arm(true);
		const c = this.center();
		for (let i = 0; i < n; i++) {
			const a = (i / n) * Math.PI * 2;
			const r = 2.5 + (i % 3) * 1.2;
			const x = c.x + Math.cos(a) * r;
			const z = c.z + Math.sin(a) * r;
			const y = this.ground(x, z, c.y);
			const fire = lab.particles.emitter({ name: `Stress fire ${i + 1}`, shape: 'soft', position: [x, y + 0.1, z], max: 300, rate: 150, life: [0.5, 1.0], emitShape: 'disc', radius: 0.2, speed: [0.6, 1.4], direction: [0, 1, 0], spread: 0.3, gravity: [0, 0.8, 0], turbulence: 2, size: [0.3, 0.05], colors: [[0, '#ffe2a0', 4], [0.4, '#ff7a1e', 2.5], [1, '#3a0d02', 0]] }, { autoRemove: false });
			const smoke = lab.particles.emitter({ name: `Stress smoke ${i + 1}`, shape: 'smoke', position: [x, y + 0.8, z], max: 120, rate: 25, life: [2, 3.5], emitShape: 'disc', radius: 0.2, speed: [0.3, 0.6], direction: [0, 1, 0], spread: 0.3, gravity: [0, 0.3, 0], size: [0.4, 1.8], additive: 0, alpha: 0.3, colors: [[0, '#4a4440', 1], [1, '#2a2826', 1]] }, { autoRemove: false });
			this.emitters.push(fire, smoke);
		}
	}

	clear() {
		this.setCrowd(0);
		this.setLights(0);
		this.setEmitters(0);
	}

	update(dt) {
		this.time += dt;
		for (const m of this.mixers) m.update(dt);
		if (this.lights.length) {
			const c = this.center();
			for (const l of this.lights) {
				const o = l.userData.orbit;
				const a = o.phase + this.time * o.speed;
				l.position.set(c.x + Math.cos(a) * o.radius, c.y + o.height + Math.sin(this.time * 1.3 + o.phase) * 0.2, c.z + Math.sin(a) * o.radius);
			}
		}
	}
}

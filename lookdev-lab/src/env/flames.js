// Instanced flame field: every torch, candle and brazier flame of a scene in one draw call, each with
// its own seed, size and flicker; optionally drives a point light with the same flicker curve.
import * as THREE from 'three';
import { flicker } from '../lighting/studioRigs.js';

export class FlameField {
	constructor(app, capacity = 96) {
		const base = new THREE.PlaneGeometry(1, 1);
		base.translate(0, 0.5, 0);
		const g = new THREE.InstancedBufferGeometry();
		g.index = base.index;
		g.setAttribute('position', base.attributes.position);
		g.setAttribute('uv', base.attributes.uv);
		const attr = (size) => new THREE.InstancedBufferAttribute(new Float32Array(capacity * size), size);
		this.center = attr(3);
		this.size = attr(2);
		this.seed = attr(1);
		this.intensity = attr(1);
		this.intensity.setUsage(THREE.DynamicDrawUsage);
		g.setAttribute('aCenter', this.center);
		g.setAttribute('aSize', this.size);
		g.setAttribute('aSeed', this.seed);
		g.setAttribute('aIntensity', this.intensity);
		g.instanceCount = 0;
		this.geometry = g;
		this.capacity = capacity;
		this.effect = app.backend.effects.create('flame');
		this.mesh = new THREE.Mesh(g, this.effect.material);
		this.mesh.name = 'Flames (instanced)';
		this.mesh.frustumCulled = false;
		this.mesh.renderOrder = 5;
		this.entries = [];
		this.lightScale = 1;
	}

	/** light: optional PointLight whose intensity follows the flame (base intensity = light.intensity). */
	add(position, { width = 0.3, height = 0.55, strength = 1, light = null } = {}) {
		const i = this.entries.length;
		if (i >= this.capacity) return -1;
		const seed = Math.random() * 100;
		this.center.setXYZ(i, position.x, position.y, position.z);
		this.size.setXY(i, width, height);
		this.seed.setX(i, seed);
		this.intensity.setX(i, strength);
		this.entries.push({ seed, strength, light, lightBase: light ? light.intensity : 0 });
		this.geometry.instanceCount = this.entries.length;
		this.center.needsUpdate = this.size.needsUpdate = this.seed.needsUpdate = true;
		return i;
	}

	/** Move flame `i` (and its light, if it should follow) to a new base position. */
	move(i, position) {
		if (i >= this.entries.length) return;
		this.center.setXYZ(i, position.x, position.y, position.z);
		this.center.needsUpdate = true;
	}

	update(elapsed) {
		const arr = this.intensity.array;
		for (let i = 0; i < this.entries.length; i++) {
			const e = this.entries[i];
			const f = flicker(elapsed, e.seed);
			arr[i] = e.strength * (0.8 + 0.3 * f);
			if (e.light) e.light.intensity = e.lightBase * f * this.lightScale;
		}
		this.intensity.needsUpdate = true;
	}

	get lights() {
		return this.entries.filter((e) => e.light).map((e) => e.light);
	}

	dispose() {
		this.geometry.dispose();
		this.effect.material.dispose();
	}
}

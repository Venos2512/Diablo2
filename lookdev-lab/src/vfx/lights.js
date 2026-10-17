// Pooled point lights for spell flashes and projectiles. The pool size is fixed while the VFX lab is
// armed, so casting never changes the light count (which would recompile every lit material).
import * as THREE from 'three';

export class LightPool {
	constructor(size = 4) {
		this.group = new THREE.Group();
		this.group.name = 'VFX light pool';
		this.slots = [];
		for (let i = 0; i < size; i++) {
			const light = new THREE.PointLight(0xffffff, 0, 6, 2);
			light.name = `VFX light ${i + 1}`;
			light.castShadow = false;
			this.group.add(light);
			this.slots.push({ light, owner: null, until: 0, peak: 0, decay: 0, started: 0, follow: null });
		}
		this.time = 0;
	}

	/** Least recently used slot that is not held by a projectile (or the oldest one). */
	acquire() {
		const free = this.slots.filter((s) => !s.follow);
		const pool = free.length ? free : this.slots;
		return pool.reduce((a, b) => (a.started <= b.started ? a : b));
	}

	/** Short flash: quick attack, exponential decay over `duration` seconds. */
	flash(position, color, intensity, { duration = 0.35, distance = 7 } = {}) {
		const slot = this.acquire();
		slot.follow = null;
		slot.light.position.copy(position);
		slot.light.color.set(color);
		slot.light.distance = distance;
		slot.peak = intensity;
		slot.started = this.time;
		slot.until = this.time + duration;
		slot.decay = duration;
		return slot;
	}

	/** Light that follows `getPosition()` until released (projectiles, portals, fires). */
	hold(getPosition, color, intensity, { distance = 6, flicker = 0 } = {}) {
		const slot = this.acquire();
		slot.follow = getPosition;
		slot.light.color.set(color);
		slot.light.distance = distance;
		slot.peak = intensity;
		slot.flicker = flicker;
		slot.started = this.time;
		slot.until = Infinity;
		return {
			slot,
			setIntensity: (v) => (slot.peak = v),
			release: () => {
				if (slot.follow === getPosition) {
					slot.follow = null;
					slot.until = this.time;
				}
			},
		};
	}

	update(dt) {
		this.time += dt;
		for (const s of this.slots) {
			if (s.follow) {
				s.light.position.copy(s.follow());
				const f = s.flicker ? 1 + Math.sin(this.time * 23 + s.started) * 0.08 * s.flicker + Math.sin(this.time * 9.7) * 0.06 * s.flicker : 1;
				s.light.intensity = s.peak * f;
			} else if (this.time < s.until) {
				const k = (this.time - s.started) / Math.max(1e-3, s.decay);
				s.light.intensity = s.peak * Math.min(1, k * 12) * Math.exp(-k * 4);
			} else {
				s.light.intensity = 0;
			}
		}
	}

	reset() {
		for (const s of this.slots) {
			s.follow = null;
			s.until = 0;
			s.light.intensity = 0;
		}
	}
}

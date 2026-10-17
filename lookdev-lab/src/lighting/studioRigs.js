// Studio light rigs for model lookdev. Intensities use three.js physical units
// (directional: lux, spot/point: candela, rect area: nits).
import * as THREE from 'three';
import { kelvinToColor } from '../core/grading.js';

export const STUDIO_RIGS = {
	softbox: { label: 'Softbox studio', env: 0.35 },
	threepoint: { label: 'Three-point (spot key)', env: 0.18 },
	sun: { label: 'Hard sun', env: 0.55 },
	rim: { label: 'Rim / silhouette check', env: 0.06 },
	candle: { label: 'Candle-lit (Act I mood)', env: 0.025 },
	hdri: { label: 'HDRI only', env: 1.0 },
};

function shadowed(light, size = 2048, frustum = 3) {
	light.castShadow = true;
	light.shadow.mapSize.set(size, size);
	light.shadow.bias = -0.0002;
	light.shadow.normalBias = 0.02;
	if (light.isDirectionalLight) {
		const cam = light.shadow.camera;
		cam.left = cam.bottom = -frustum;
		cam.right = cam.top = frustum;
		cam.near = 0.5;
		cam.far = 30;
	}
	return light;
}

/** Returns { group, lights: [{ name, light, kelvin, intensity, flicker? }] }. */
export function buildStudioRig(id) {
	const group = new THREE.Group();
	group.name = `Rig: ${STUDIO_RIGS[id]?.label || id}`;
	const lights = [];
	const aim = (light, target = new THREE.Vector3(0, 0.9, 0)) => {
		if (light.isRectAreaLight) light.lookAt(target);
		else if (light.target) {
			light.target.position.copy(target);
			group.add(light.target);
		}
		return light;
	};
	const add = (name, light, kelvin, extra = {}) => {
		light.name = name;
		light.color.copy(kelvinToColor(kelvin));
		group.add(light);
		lights.push({ name, light, kelvin, intensity: light.intensity, ...(extra.flicker !== undefined ? { flickerAmount: 1 } : {}), ...extra });
		return light;
	};

	if (id === 'softbox') {
		const key = add('Key softbox', new THREE.RectAreaLight(0xffffff, 9, 1.4, 1.0), 5600);
		key.position.set(-2.2, 2.4, 2.0);
		aim(key);
		const fill = add('Fill softbox', new THREE.RectAreaLight(0xffffff, 2.2, 1.2, 1.2), 6500);
		fill.position.set(2.6, 1.4, 1.6);
		aim(fill);
		const top = add('Top bounce', new THREE.RectAreaLight(0xffffff, 1.4, 2.0, 2.0), 6000);
		top.position.set(0, 3.4, 0.2);
		aim(top, new THREE.Vector3(0, 0, 0.2));
		const shadow = add('Contact shadow', new THREE.DirectionalLight(0xffffff, 0.6), 5600);
		shadow.position.set(-2.2, 4, 2.0);
		aim(shadowed(shadow));
	} else if (id === 'threepoint') {
		const key = add('Key spot', new THREE.SpotLight(0xffffff, 85, 0, THREE.MathUtils.degToRad(30), 0.65, 2), 5200);
		key.position.set(-2.6, 3.0, 2.4);
		aim(shadowed(key));
		const fill = add('Fill', new THREE.DirectionalLight(0xffffff, 0.45), 7500);
		fill.position.set(2.5, 1.5, 2);
		aim(fill);
		const rim = add('Rim spot', new THREE.SpotLight(0xffffff, 120, 0, THREE.MathUtils.degToRad(28), 0.5, 2), 4300);
		rim.position.set(0.9, 2.7, -3.0);
		aim(rim);
	} else if (id === 'sun') {
		const sun = add('Sun', new THREE.DirectionalLight(0xffffff, 3.2), 5800);
		sun.position.set(4, 6, 3);
		aim(shadowed(sun));
	} else if (id === 'rim') {
		const left = add('Rim left', new THREE.SpotLight(0xffffff, 160, 0, THREE.MathUtils.degToRad(26), 0.4, 2), 6500);
		left.position.set(-2.4, 2.2, -2.6);
		aim(left);
		const right = add('Rim right', new THREE.SpotLight(0xffffff, 140, 0, THREE.MathUtils.degToRad(26), 0.4, 2), 3800);
		right.position.set(2.4, 2.0, -2.4);
		aim(right);
	} else if (id === 'candle') {
		const spots = [
			['Candle A', new THREE.Vector3(-1.1, 0.95, 0.9), 5.5, true],
			['Candle B', new THREE.Vector3(1.25, 1.45, -0.6), 4.0, false],
			['Candle C', new THREE.Vector3(0.35, 0.45, 1.35), 2.5, false],
		];
		for (const [name, pos, intensity, shadow] of spots) {
			const light = add(name, new THREE.PointLight(0xffffff, intensity, 0, 2), 1900, { flicker: Math.random() * 100 });
			light.position.copy(pos);
			if (shadow) {
				light.castShadow = true;
				light.shadow.mapSize.set(1024, 1024);
				light.shadow.bias = -0.002;
				light.shadow.normalBias = 0.02;
				light.shadow.radius = 3;
			}
		}
	}
	return { group, lights };
}

/** Candle / torch flicker: layered sines + noise-like jitter, ~5 Hz main flutter. */
export function flicker(t, seed) {
	const a = Math.sin(t * 7.3 + seed) * 0.5 + Math.sin(t * 13.1 + seed * 1.7) * 0.3 + Math.sin(t * 23.7 + seed * 0.3) * 0.2;
	return 0.82 + 0.18 * a;
}

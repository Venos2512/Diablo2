// Shared grading math so the GLSL and TSL display transforms receive identical inputs.
import * as THREE from 'three';

export const TONE_MAPPINGS = {
	none: { label: 'None (clamp)', index: 0, three: THREE.NoToneMapping },
	linear: { label: 'Linear', index: 1, three: THREE.LinearToneMapping },
	reinhard: { label: 'Reinhard', index: 2, three: THREE.ReinhardToneMapping },
	cineon: { label: 'Cineon', index: 3, three: THREE.CineonToneMapping },
	aces: { label: 'ACES Filmic', index: 4, three: THREE.ACESFilmicToneMapping },
	agx: { label: 'AgX', index: 5, three: THREE.AgXToneMapping },
	neutral: { label: 'Khronos PBR Neutral', index: 6, three: THREE.NeutralToneMapping },
};

const WARM = new THREE.Vector3(1.0, 0.9, 0.74);
const COOL = new THREE.Vector3(0.74, 0.86, 1.0);
const ONE = new THREE.Vector3(1, 1, 1);

/** temperature, tint in [-1, 1] -> luminance-preserving RGB multipliers. */
export function whiteBalance(temperature = 0, tint = 0, target = new THREE.Vector3()) {
	const t = THREE.MathUtils.clamp(temperature, -1, 1);
	target.copy(ONE).lerp(t >= 0 ? WARM : COOL, Math.abs(t));
	const g = THREE.MathUtils.clamp(tint, -1, 1);
	target.x *= 1 + 0.08 * g;
	target.y *= 1 - 0.16 * g;
	target.z *= 1 + 0.08 * g;
	const luma = 0.2126 * target.x + 0.7152 * target.y + 0.0722 * target.z;
	return target.multiplyScalar(1 / luma);
}

export function exposureScale(ev) {
	return Math.pow(2, ev);
}

/** Linear sRGB colour of a black body at `kelvin` (Tanner Helland fit), normalised to max channel 1. */
export function kelvinToColor(kelvin, target = new THREE.Color()) {
	const t = THREE.MathUtils.clamp(kelvin, 1000, 40000) / 100;
	let r, g, b;
	if (t <= 66) {
		r = 255;
		g = 99.4708025861 * Math.log(t) - 161.1195681661;
		b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
	} else {
		r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
		g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
		b = 255;
	}
	const c = (v) => THREE.MathUtils.clamp(v, 0, 255) / 255;
	target.setRGB(c(r), c(g), c(b), THREE.SRGBColorSpace);
	return target;
}

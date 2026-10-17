// 3D colour LUTs for the display transform: Adobe/Resolve .cube files (dropped on the viewport or loaded
// in the Post tab) and a few generated looks. Applied in display space after tone mapping + sRGB,
// which is how creative LUTs from grading tools are authored.
//
// Each LUT is uploaded twice:
//   texture  Data3DTexture (size³)           -> GLSL sampler3D, one hardware-trilinear fetch (WebGL2).
//   strip    DataTexture (size² × size)      -> TSL: the blue slices side by side, two bilinear fetches
//            blended by hand. Used by the WebGPU renderer because three r180 uploads 3D textures one slice
//            at a time, and some WebGPU implementations (Dawn on SwiftShader, at least) fail to lazy-clear
//            the rest of the volume — the whole frame is then dropped.
import * as THREE from 'three';

const STORE_KEY = 'sanctuary-lookdev-lab:lut:v1';

function configure(texture) {
	texture.format = THREE.RGBAFormat;
	texture.type = THREE.HalfFloatType;
	texture.minFilter = texture.magFilter = THREE.LinearFilter;
	texture.wrapS = texture.wrapT = texture.wrapR = THREE.ClampToEdgeWrapping;
	texture.generateMipmaps = false;
	texture.flipY = false;
	texture.unpackAlignment = 1;
	texture.colorSpace = THREE.NoColorSpace;
	texture.needsUpdate = true;
	return texture;
}

/** rgb: size³ triplets, red fastest, then green, then blue (the .cube order). */
function makeTextures(size, rgb) {
	const volume = new Uint16Array(size * size * size * 4);
	const strip = new Uint16Array(size * size * size * 4);
	const one = THREE.DataUtils.toHalfFloat(1);
	for (let b = 0, i = 0; b < size; b++) {
		for (let g = 0; g < size; g++) {
			for (let r = 0; r < size; r++, i++) {
				const j = (g * size * size + b * size + r) * 4; // strip texel (x = r + b·size, y = g)
				for (let c = 0; c < 3; c++) volume[i * 4 + c] = strip[j + c] = THREE.DataUtils.toHalfFloat(rgb[i * 3 + c]);
				volume[i * 4 + 3] = strip[j + 3] = one;
			}
		}
	}
	return {
		texture: configure(new THREE.Data3DTexture(volume, size, size, size)),
		strip: configure(new THREE.DataTexture(strip, size * size, size)),
	};
}

export function disposeLut(lut) {
	lut?.texture.dispose();
	lut?.strip.dispose();
}

/** Parse a 3D .cube LUT (red varies fastest, then green, then blue — the Data3DTexture x/y/z order). */
export function parseCubeLUT(text, name = 'LUT') {
	let size = 0;
	let title = name.replace(/\.cube$/i, '');
	let domainMin = [0, 0, 0];
	let domainMax = [1, 1, 1];
	const values = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const parts = line.split(/\s+/);
		const key = parts[0].toUpperCase();
		if (key === 'TITLE') title = line.slice(5).trim().replace(/^"|"$/g, '') || title;
		else if (key === 'LUT_3D_SIZE') size = parseInt(parts[1], 10);
		else if (key === 'LUT_1D_SIZE') throw new Error('1D LUTs are not supported — export a 3D .cube.');
		else if (key === 'DOMAIN_MIN') domainMin = parts.slice(1, 4).map(Number);
		else if (key === 'DOMAIN_MAX') domainMax = parts.slice(1, 4).map(Number);
		else if (/^[-+.\d]/.test(parts[0]) && parts.length >= 3) values.push(Number(parts[0]), Number(parts[1]), Number(parts[2]));
	}
	if (!size || size < 2 || size > 128) throw new Error('Missing or invalid LUT_3D_SIZE.');
	if (values.length !== size * size * size * 3) throw new Error(`Expected ${size ** 3} entries, found ${values.length / 3}.`);
	if (domainMin.some((v) => v !== 0) || domainMax.some((v) => v !== 1)) console.warn(`${name}: DOMAIN_MIN/MAX other than 0..1 are ignored.`);
	return { title, size, ...makeTextures(size, values) };
}

const luma = (r, g, b) => r * 0.2126 + g * 0.7152 + b * 0.0722;
const sat = (r, g, b, s) => {
	const l = luma(r, g, b);
	return [l + (r - l) * s, l + (g - l) * s, l + (b - l) * s];
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (e0, e1, x) => {
	const t = clamp01((x - e0) / (e1 - e0));
	return t * t * (3 - 2 * t);
};
/** Contrast S-curve around 0.5 (amount 0 = identity); black and white stay put. */
const sCurve = (x, amount) => {
	const v = clamp01(x);
	return v + (v * v * (3 - 2 * v) - v) * amount;
};

/**
 * The final grade of the v1 game (core/renderer.js GradeShader, after ACES + sRGB): lift / gamma / gain,
 * shadow / highlight tint, saturation, contrast. Same display space as the LUT, so the port is exact.
 */
const gameGrade = ({ sat: s, contrast, lift, gamma, gain, shadow, high }) => (r, g, b) => {
	let c = [r, g, b].map((x, i) => Math.max(0, x * gain[i] + lift[i] * (1 - x)) ** (1 / gamma[i]));
	let l = luma(...c);
	const sw = 1 - smooth(0, 0.45, l);
	const hw = smooth(0.4, 1, l);
	c = c.map((x, i) => x + shadow[i] * sw + high[i] * hw);
	l = luma(...c);
	return c.map((x) => (l + (x - l) * s - 0.5) * contrast + 0.5);
};

/** Generated looks (display-referred functions of sRGB in → sRGB out). */
export const LOOKS = {
	none: { label: 'None' },
	tealOrange: {
		label: 'Teal & orange',
		fn(r, g, b) {
			const l = luma(r, g, b);
			const warm = clamp01((l - 0.45) * 2.5);
			const cool = clamp01(1 - l * 2.6);
			let [R, G, B] = sat(r, g, b, 1.12);
			R += 0.06 * warm - 0.04 * cool;
			G += 0.015 * warm + 0.02 * cool;
			B += -0.07 * warm + 0.07 * cool;
			return [R, G, B];
		},
	},
	bleach: {
		label: 'Bleach bypass',
		fn(r, g, b) {
			const l = luma(r, g, b);
			const contrast = (x) => clamp01((x - 0.5) * 1.25 + 0.5);
			const [R, G, B] = sat(r, g, b, 0.45);
			return [contrast(R * 0.6 + l * 0.4), contrast(G * 0.6 + l * 0.4), contrast(B * 0.6 + l * 0.4)];
		},
	},
	gloom: {
		label: 'Sanctuary gloom',
		fn(r, g, b) {
			// Desaturated, cold shadows, warm candle-lit highlights, slightly crushed blacks.
			const l = luma(r, g, b);
			let [R, G, B] = sat(r, g, b, 0.72);
			const shadow = 1 - clamp01(l * 2.2);
			const high = clamp01((l - 0.55) * 2.2);
			R += -0.03 * shadow + 0.05 * high;
			G += -0.005 * shadow + 0.02 * high;
			B += 0.035 * shadow - 0.05 * high;
			const crush = (x) => clamp01((x - 0.025) / 0.975) ** 1.06;
			return [crush(R), crush(G), crush(B)];
		},
	},
	// Diablo III Act I looks (used by the Lighting tab moods). Split toning keeps pure black and white
	// neutral: the tint peaks in deep shadows / upper mids instead of lifting the black point.
	act1Tristram: {
		label: 'Act I · New Tristram (teal night, amber fire)',
		fn(r, g, b) {
			const l = luma(r, g, b);
			let [R, G, B] = sat(r, g, b, 1.1);
			const shadow = smooth(0.0, 0.06, l) * (1 - smooth(0.12, 0.55, l));
			const high = smooth(0.38, 0.9, l) * (1 - smooth(0.92, 1.0, l) * 0.6);
			R += -0.05 * shadow + 0.05 * high;
			G += 0.012 * shadow + 0.025 * high;
			B += 0.06 * shadow - 0.055 * high;
			return [sCurve(R, 0.22), sCurve(G, 0.22), sCurve(B, 0.22)];
		},
	},
	act1Hollow: {
		label: 'Act I · Weeping Hollow (green-grey murk)',
		fn(r, g, b) {
			const l = luma(r, g, b);
			let [R, G, B] = sat(r, g, b, 0.82);
			const shadow = smooth(0.0, 0.08, l) * (1 - smooth(0.15, 0.6, l));
			const high = smooth(0.4, 0.95, l);
			R += -0.03 * shadow + 0.045 * high;
			G += 0.025 * shadow + 0.04 * high;
			B += 0.005 * shadow - 0.05 * high;
			// Fog-lifted blacks, soft shoulder.
			const fade = (x) => 0.018 + x * 0.965;
			return [fade(sCurve(R, 0.1)), fade(sCurve(G, 0.1)), fade(sCurve(B, 0.1))];
		},
	},
	act1Cathedral: {
		label: 'Act I · Cathedral (cold stone, torch orange)',
		fn(r, g, b) {
			const l = luma(r, g, b);
			let [R, G, B] = sat(r, g, b, 0.92);
			const shadow = smooth(0.0, 0.05, l) * (1 - smooth(0.1, 0.5, l));
			const high = smooth(0.35, 0.85, l) * (1 - smooth(0.9, 1.0, l) * 0.5);
			R += -0.035 * shadow + 0.05 * high;
			G += -0.002 * shadow + 0.03 * high;
			B += 0.05 * shadow - 0.06 * high;
			const crush = (x) => clamp01((x - 0.018) / 0.982) ** 1.05;
			return [crush(sCurve(R, 0.3)), crush(sCurve(G, 0.3)), crush(sCurve(B, 0.3))];
		},
	},
	v1Moor: {
		label: 'v1 game · Ashen Moor grade',
		fn: gameGrade({ sat: 0.85, contrast: 1.08, lift: [0.006, 0.01, 0.02], gamma: [1, 1, 1], gain: [1.0, 1.0, 0.98], shadow: [-0.006, 0.0, 0.02], high: [0.025, 0.018, -0.008] }),
	},
};

export function generateLook(id, size = 33) {
	const look = LOOKS[id];
	if (!look?.fn) return null;
	const rgb = new Float32Array(size * size * size * 3);
	let i = 0;
	for (let bz = 0; bz < size; bz++) {
		for (let gy = 0; gy < size; gy++) {
			for (let rx = 0; rx < size; rx++) {
				const out = look.fn(rx / (size - 1), gy / (size - 1), bz / (size - 1));
				rgb[i++] = clamp01(out[0]);
				rgb[i++] = clamp01(out[1]);
				rgb[i++] = clamp01(out[2]);
			}
		}
	}
	return { title: look.label, size, ...makeTextures(size, rgb) };
}

/** Remembers the last custom .cube (when small enough) so it survives a reload / renderer switch. */
export function storeCustomLut(name, text) {
	try {
		if (text.length > 2.5e6) return false;
		localStorage.setItem(STORE_KEY, JSON.stringify({ name, text }));
		return true;
	} catch {
		return false;
	}
}

export function loadCustomLut() {
	try {
		const stored = JSON.parse(localStorage.getItem(STORE_KEY));
		return stored ? parseCubeLUT(stored.text, stored.name) : null;
	} catch {
		return null;
	}
}

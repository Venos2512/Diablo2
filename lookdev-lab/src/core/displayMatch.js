// Display-matched colours: the scene-referred (linear) colour that the lab's display transform turns into a given
// sRGB hex. Gameplay signal palettes are written as screen colours; drawn as plain unlit colours they go through
// exposure, grade and tone mapping like everything else, and AgX in particular pulls bright saturated colours
// toward beige (#FFB16B shows as ~#CEA985). Matching inverts the final pass of backends/*/pipeline.js — exposure →
// white balance → contrast → saturation → tone mapping → lift / gain / gamma — for a colour that fills the pixel
// (vignette, fog, bloom and the LUT are left out). Some hexes are outside what a tone mapper can show at all
// (AgX cannot reach the full saturation of #E66A39): the closest reachable colour is returned with its error.
import * as THREE from 'three';
import { exposureScale, whiteBalance } from './grading.js';

const col = (c0, c1, c2) => [[c0[0], c1[0], c2[0]], [c0[1], c1[1], c2[1]], [c0[2], c1[2], c2[2]]]; // GLSL mat3 columns
const mul = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

const SRGB_TO_REC2020 = col([0.6274, 0.0691, 0.0164], [0.3293, 0.9195, 0.088], [0.0433, 0.0113, 0.8956]);
const REC2020_TO_SRGB = col([1.6605, -0.1246, -0.0182], [-0.5876, 1.1329, -0.1006], [-0.0728, -0.0083, 1.1187]);
const AGX_IN = col([0.856627153315983, 0.137318972929847, 0.11189821299995], [0.0951212405381588, 0.761241990602591, 0.0767994186031903], [0.0482516061458583, 0.101439036467562, 0.811302368396859]);
const AGX_OUT = col([1.1271005818144368, -0.1413297634984383, -0.14132976349843826], [-0.11060664309660323, 1.157823702216272, -0.11060664309660294], [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405]);
const ACES_IN = col([0.59719, 0.076, 0.0284], [0.35458, 0.90834, 0.13383], [0.04823, 0.01566, 0.83777]);
const ACES_OUT = col([1.60475, -0.10208, -0.00327], [-0.53108, 1.10813, -0.07276], [-0.07367, -0.00605, 1.07602]);

/** three.js tone mappers (r180 GLSL / TSL), linear sRGB in → linear sRGB out, exposure already applied. */
export const TONE_MAPPERS = {
	none: (c) => c.map(clamp01),
	linear: (c) => c.map(clamp01),
	reinhard: (c) => c.map((v) => clamp01(v / (1 + v))),
	cineon: (c) => c.map((v) => {
		const x = Math.max(0, v - 0.004);
		return ((x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06)) ** 2.2;
	}),
	aces: (c) => {
		const v = mul(ACES_IN, c.map((x) => x / 0.6)).map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
		return mul(ACES_OUT, v).map(clamp01);
	},
	agx: (c) => {
		let v = mul(AGX_IN, mul(SRGB_TO_REC2020, c));
		v = v.map((x) => clamp01((Math.log2(Math.max(x, 1e-10)) + 12.47393) / (4.026069 + 12.47393)));
		v = v.map((x) => {
			const x2 = x * x;
			const x4 = x2 * x2;
			return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
		});
		v = mul(AGX_OUT, v).map((x) => Math.max(0, x) ** 2.2);
		return mul(REC2020_TO_SRGB, v).map(clamp01);
	},
	neutral: (c) => {
		const start = 0.76;
		const x = Math.min(...c);
		const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
		let v = c.map((k) => k - offset);
		const peak = Math.max(...v);
		if (peak < start) return v;
		const d = 1 - start;
		const top = 1 - (d * d) / (peak + d - start);
		v = v.map((k) => (k * top) / peak);
		const g = 1 - 1 / (0.15 * (peak - top) + 1);
		return v.map((k) => k + (top - k) * g);
	},
};

const _wb = new THREE.Vector3();
/** The lab's final pass (backends/webgl/pipeline.js final.frag.glsl) for one flat colour → display linear sRGB. */
export function displayTransform(rgb, post) {
	const g = post.grade;
	const wb = whiteBalance(g.temperature, g.tint, _wb);
	const e = exposureScale(post.exposure);
	let c = [rgb[0] * e * wb.x, rgb[1] * e * wb.y, rgb[2] * e * wb.z].map((v) => Math.max(0, v));
	c = c.map((v) => (v / 0.18 + 1e-6) ** g.contrast * 0.18);
	const luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
	c = c.map((v) => Math.max(0, luma + (v - luma) * g.saturation));
	c = (TONE_MAPPERS[post.toneMapping] ?? TONE_MAPPERS.agx)(c);
	c = c.map((v) => clamp01(v * g.gain + g.lift * (1 - v)) ** (1 / Math.max(0.01, g.gamma)));
	return c;
}

function toLab([r, g, b]) {
	const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
	const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
	const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
	const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
	return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Linear scene colour whose display transform lands closest to `hex` (CIE76 ΔE in Lab). Returns { color, error }.
 * Coordinate search in log2 space from the hex itself, step halving (~300 evaluations).
 */
export function matchDisplay(hex, post) {
	const target = new THREE.Color(hex);
	const t = toLab([target.r, target.g, target.b]);
	let x = [target.r, target.g, target.b].map((v) => Math.log2(Math.max(v, 1e-4) / exposureScale(post.exposure)));
	const err = (lx) => dist(toLab(displayTransform(lx.map((v) => 2 ** v), post)), t);
	let best = err(x);
	for (let step = 1.5; step > 0.004; ) {
		let moved = false;
		for (let i = 0; i < 3; i++) {
			for (const s of [step, -step]) {
				const y = x.slice();
				y[i] = Math.min(6, Math.max(-14, y[i] + s));
				const e = err(y);
				if (e < best) {
					best = e;
					x = y;
					moved = true;
				}
			}
		}
		if (!moved) step *= 0.5;
	}
	return { color: new THREE.Color(2 ** x[0], 2 ** x[1], 2 ** x[2]), error: best };
}

/** What the display transform makes of `hex` drawn as a plain 1× unlit colour: { hex, error }. */
export function asShown(hex, post) {
	const c = new THREE.Color(hex);
	const shown = displayTransform([c.r, c.g, c.b], post);
	return { hex: `#${new THREE.Color(...shown).getHexString()}`, error: dist(toLab(shown), toLab([c.r, c.g, c.b])) };
}

/** Signature of the post settings the match depends on (re-match when it changes). */
export function displayKey(post) {
	const g = post.grade;
	return [post.toneMapping, post.exposure, g.temperature, g.tint, g.contrast, g.saturation, g.lift, g.gamma, g.gain].join('|');
}

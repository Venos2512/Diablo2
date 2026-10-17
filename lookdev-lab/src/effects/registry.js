// Shared effect schemas. Each effect is implemented twice — GLSL (src/backends/webgl/effects.js +
// src/shaders/effects/*.glsl) and TSL (src/backends/webgpu/effects.js) — with the same parameters,
// so the shader lab can compare look and cost one-to-one.
//
// lab: how the Shaders tab shows the effect by default — `target` for surface effects ('subject' or a
// probe shape: 'sphere' | 'knot' | 'disc'), `place` for VFX ('side' | 'behind' | 'ground').
// animate: optional parameter the lab can loop ({ param, period seconds, mode 'pingpong' | 'pulse' }).
import * as THREE from 'three';

const color = (hex, label) => ({ type: 'color', value: new THREE.Color(hex), label });
const num = (value, min, max, step = 0.01, label) => ({ type: 'number', value, min, max, step, label });

export const EFFECTS = {
	wind: {
		label: 'Vertex wind',
		kind: 'surface',
		summary: 'World-space sway with travelling gusts (grass, trees, banners). Height-masked so roots stay planted; shadows sway too.',
		lab: { target: 'subject' },
		params: {
			strength: num(0.25, 0, 1.5, 0.01, 'Strength (m)'),
			frequency: num(1.4, 0.1, 6, 0.01, 'Frequency'),
			gust: num(0.6, 0, 1, 0.01, 'Gust amount'),
			direction: num(35, -180, 180, 1, 'Direction °'),
			height: num(1, 0.05, 20, 0.05, 'Mask height (m)'),
		},
	},
	flame: {
		label: 'Flame billboard',
		kind: 'vfx',
		summary: 'Procedural flame on a cylindrical billboard: scrolling fbm distortion, teardrop mask, HDR core for bloom. Drives a flickering point light.',
		lab: { place: 'side' },
		params: {
			intensity: num(7, 0, 40, 0.1, 'Intensity (HDR)'),
			coreColor: color('#ffd27a', 'Core colour'),
			edgeColor: color('#ff4a0a', 'Edge colour'),
			turbulence: num(1, 0, 3, 0.01, 'Turbulence'),
			speed: num(1, 0, 4, 0.01, 'Speed'),
		},
	},
	dissolve: {
		label: 'Dissolve (death / spawn)',
		kind: 'surface',
		summary: 'Noise threshold with a scorched rim and a burning HDR edge — the classic monster death / summon effect. The shadow dissolves with it.',
		lab: { target: 'subject' },
		animate: { param: 'progress', period: 4, mode: 'pingpong' },
		params: {
			progress: num(0.35, 0, 1, 0.001, 'Progress'),
			edgeWidth: num(0.06, 0.001, 0.3, 0.001, 'Edge width'),
			edgeColor: color('#ff6a1a', 'Edge colour'),
			edgeIntensity: num(12, 0, 60, 0.1, 'Edge intensity'),
			scale: num(2.2, 0.1, 10, 0.01, 'Noise scale (1/m)'),
		},
	},
	status: {
		label: 'Status overlay',
		kind: 'surface',
		summary: 'Gameplay-readable states on any character: frozen (fresnel ice + glints), burning (rising embers), poisoned (pulsing veins), hit flash.',
		lab: { target: 'subject' },
		animate: { param: 'amount', period: 1.6, mode: 'pulse' },
		params: {
			mode: { type: 'select', value: 1, options: { Frozen: 1, Burning: 2, Poisoned: 3, 'Hit flash': 4 }, label: 'State' },
			amount: num(1, 0, 1, 0.01, 'Amount'),
			intensity: num(3, 0, 20, 0.1, 'Glow intensity'),
			speed: num(1, 0, 5, 0.01, 'Animation speed'),
		},
	},
	rim: {
		label: 'Fresnel rim',
		kind: 'surface',
		summary: 'View-dependent rim light — selection highlight / elite monster aura.',
		lab: { target: 'subject' },
		params: {
			color: color('#7fb7ff', 'Colour'),
			power: num(3, 0.5, 8, 0.01, 'Power'),
			intensity: num(2, 0, 20, 0.1, 'Intensity'),
		},
	},
	liquid: {
		label: 'Puddle (water / blood)',
		kind: 'surface',
		summary: 'Thin liquid layer on upward-facing surfaces: noise-shaped puddles, darkened tinted albedo, glossy dielectric response, rain ripples via analytic normals. Wetness darkens and glosses everything else (rain).',
		lab: { target: 'disc' },
		params: {
			tint: color('#2a0606', 'Tint (blood → try #0c1114 for water)'),
			coverage: num(0.45, 0, 1, 0.01, 'Coverage'),
			rippleScale: num(3, 0.2, 12, 0.01, 'Ripple scale'),
			rippleSpeed: num(1, 0, 4, 0.01, 'Ripple speed'),
			roughness: num(0.04, 0, 1, 0.01, 'Roughness'),
			wetness: num(0, 0, 1, 0.01, 'Surface wetness (rain)'),
		},
	},
	portal: {
		label: 'Town portal',
		kind: 'vfx',
		summary: 'Swirling vortex oval: polar fbm, rim mask, HDR glow; the inside darkens what is behind it. Drives a matching point light.',
		lab: { place: 'behind' },
		params: {
			color: color('#3d8bff', 'Colour'),
			intensity: num(3.5, 0, 30, 0.1, 'Intensity'),
			swirl: num(2.5, 0, 8, 0.01, 'Swirl'),
			speed: num(1, 0, 4, 0.01, 'Speed'),
		},
	},
	runes: {
		label: 'Waypoint runes',
		kind: 'vfx',
		summary: 'Ground rune circle with an activation sweep and soft floor intersection — shows how decals read under the game camera.',
		lab: { place: 'ground' },
		animate: { param: 'activation', period: 3, mode: 'pingpong' },
		params: {
			color: color('#5fd0ff', 'Colour'),
			intensity: num(5, 0, 30, 0.1, 'Intensity'),
			activation: num(1, 0, 1, 0.001, 'Activation'),
			speed: num(1, 0, 4, 0.01, 'Speed'),
		},
	},
};

/** Fresh parameter set (cloned values) for an effect instance. */
export function defaultParams(name) {
	const out = {};
	for (const [key, def] of Object.entries(EFFECTS[name].params)) out[key] = def.value?.isColor ? def.value.clone() : def.value;
	return out;
}

/** Value of an animated parameter at time `t` (seconds). */
export function animatedValue(spec, def, t) {
	const phase = (t / spec.period) % 1;
	const lo = def.min ?? 0;
	const hi = def.max ?? 1;
	if (spec.mode === 'pulse') {
		const k = Math.exp(-phase * 6); // sharp attack, exponential decay (hit flash / status proc)
		return lo + (hi - lo) * k;
	}
	const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
	const eased = tri * tri * (3 - 2 * tri);
	return lo + (hi - lo) * eased;
}

// TSL ports of src/shaders/chunks/common.glsl and pbr_validate.glsl (same math, same constants).
import { Fn, vec3, float, dot, mix, pow, max, log2, select } from 'three/tsl';

export const labLuma = Fn(([c]) => dot(c, vec3(0.2126, 0.7152, 0.0722))).setLayout({
	name: 'labLuma', type: 'float', inputs: [{ name: 'c', type: 'vec3' }],
});

export const labSRGBToLinear = Fn(([c]) => {
	const a = pow(c.mul(0.9478672986).add(vec3(0.0521327014)), vec3(2.4));
	const b = c.mul(0.0773993808);
	return mix(a, b, c.lessThanEqual(0.04045));
}).setLayout({ name: 'labSRGBToLinear', type: 'vec3', inputs: [{ name: 'c', type: 'vec3' }] });

export const labLinearToSRGB = Fn(([rgb]) => {
	const c = max(rgb, vec3(0.0));
	const a = pow(c, vec3(0.41666)).mul(1.055).sub(vec3(0.055));
	const b = c.mul(12.92);
	return mix(a, b, c.lessThanEqual(0.0031308));
}).setLayout({ name: 'labLinearToSRGB', type: 'vec3', inputs: [{ name: 'rgb', type: 'vec3' }] });

// Pure select() chains (no If/assign) so the WGSL and GLSL outputs are straightforward expressions.
export const labFalseColor = Fn(([lum]) => {
	const ev = log2(max(lum, float(1e-6)).div(0.18));
	let c = vec3(1.0, 0.75, 0.9);
	c = select(ev.lessThan(6.0), vec3(0.9, 0.1, 0.05), c);
	c = select(ev.lessThan(4.0), vec3(0.95, 0.5, 0.05), c);
	c = select(ev.lessThan(2.0), vec3(0.85, 0.8, 0.1), c);
	c = select(ev.lessThan(0.5), vec3(0.5), c);
	c = select(ev.lessThan(-0.5), vec3(0.12, 0.55, 0.15), c);
	c = select(ev.lessThan(-2.0), vec3(0.0, 0.45, 0.55), c);
	c = select(ev.lessThan(-4.0), vec3(0.05, 0.12, 0.65), c);
	c = select(ev.lessThan(-6.0), vec3(0.18, 0.0, 0.28), c);
	return c;
}).setLayout({ name: 'labFalseColor', type: 'vec3', inputs: [{ name: 'lum', type: 'float' }] });

export const labPbrValidate = Fn(([albedoLinear, metal]) => {
	const l = labLuma(labLinearToSRGB(albedoLinear));
	const grey = vec3(labLuma(albedoLinear));
	const dielectric = select(l.lessThan(30.0 / 255.0), vec3(0.85, 0.02, 0.02), select(l.greaterThan(240.0 / 255.0), vec3(0.02, 0.2, 0.95), grey));
	const metallic = select(l.lessThan(180.0 / 255.0), vec3(0.95, 0.35, 0.02), grey);
	const mixed = metal.greaterThan(0.1).and(metal.lessThan(0.9));
	return select(mixed, vec3(0.75, 0.05, 0.75), select(metal.greaterThanEqual(0.9), metallic, dielectric));
}).setLayout({ name: 'labPbrValidate', type: 'vec3', inputs: [{ name: 'albedoLinear', type: 'vec3' }, { name: 'metal', type: 'float' }] });

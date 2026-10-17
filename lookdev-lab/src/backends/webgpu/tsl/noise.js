// TSL port of src/shaders/chunks/noise.glsl — identical hashing constants and interpolation, so a GLSL
// effect and its TSL twin produce the same pattern and comparable instruction counts.
import { Fn, vec2, vec3, float, fract, floor, dot, mix, sqrt, min } from 'three/tsl';

export const labHash12 = Fn(([p]) => {
	const p3 = fract(vec3(p.x, p.y, p.x).mul(0.1031)).toVar();
	p3.addAssign(dot(p3, p3.yzx.add(33.33)));
	return fract(p3.x.add(p3.y).mul(p3.z));
}).setLayout({ name: 'labHash12', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] });

export const labHash13 = Fn(([p]) => {
	const p3 = fract(p.mul(0.1031)).toVar();
	p3.addAssign(dot(p3, p3.zyx.add(31.32)));
	return fract(p3.x.add(p3.y).mul(p3.z));
}).setLayout({ name: 'labHash13', type: 'float', inputs: [{ name: 'p', type: 'vec3' }] });

export const labHash22 = Fn(([p]) => {
	const p3 = fract(vec3(p.x, p.y, p.x).mul(vec3(0.1031, 0.103, 0.0973))).toVar();
	p3.addAssign(dot(p3, p3.yzx.add(33.33)));
	return fract(vec2(p3.x, p3.x).add(p3.yz).mul(p3.zy));
}).setLayout({ name: 'labHash22', type: 'vec2', inputs: [{ name: 'p', type: 'vec2' }] });

export const labHash33 = Fn(([p]) => {
	const p3 = fract(p.mul(vec3(0.1031, 0.103, 0.0973))).toVar();
	p3.addAssign(dot(p3, p3.yxz.add(33.33)));
	return fract(p3.xxy.add(p3.yxx).mul(p3.zyx));
}).setLayout({ name: 'labHash33', type: 'vec3', inputs: [{ name: 'p', type: 'vec3' }] });

/** Gradient noise in [-1, 1]. */
export const labNoise3 = Fn(([p]) => {
	const i = floor(p).toVar();
	const f = fract(p).toVar();
	const u = f.mul(f).mul(f).mul(f.mul(f.mul(6.0).sub(15.0)).add(10.0)).toVar();
	const corner = (x, y, z) => {
		const o = vec3(x, y, z);
		return dot(labHash33(i.add(o)).mul(2.0).sub(1.0), f.sub(o));
	};
	const nx00 = mix(corner(0, 0, 0), corner(1, 0, 0), u.x);
	const nx10 = mix(corner(0, 1, 0), corner(1, 1, 0), u.x);
	const nx01 = mix(corner(0, 0, 1), corner(1, 0, 1), u.x);
	const nx11 = mix(corner(0, 1, 1), corner(1, 1, 1), u.x);
	return mix(mix(nx00, nx10, u.y), mix(nx01, nx11, u.y), u.z).mul(1.6);
}).setLayout({ name: 'labNoise3', type: 'float', inputs: [{ name: 'p', type: 'vec3' }] });

/** Four-octave fbm, roughly [-1, 1] (loop unrolled at graph-build time like the GLSL compiler would). */
export const labFbm3 = Fn(([p0]) => {
	const p = vec3(p0).toVar();
	const sum = float(0).toVar();
	let amp = 0.5;
	for (let i = 0; i < 4; i++) {
		sum.addAssign(labNoise3(p).mul(amp));
		p.assign(p.mul(2.03).add(vec3(17.1, 3.7, 9.2)));
		amp *= 0.5;
	}
	return sum.div(0.9375);
}).setLayout({ name: 'labFbm3', type: 'float', inputs: [{ name: 'p0', type: 'vec3' }] });

/** Distance to the nearest feature point (F1) of a 2D cellular pattern. */
export const labVoronoi2 = Fn(([p]) => {
	const i = floor(p).toVar();
	const f = fract(p).toVar();
	const best = float(8.0).toVar();
	for (let y = -1; y <= 1; y++) {
		for (let x = -1; x <= 1; x++) {
			const cell = vec2(x, y);
			const d = cell.add(labHash22(i.add(cell))).sub(f);
			best.assign(min(best, dot(d, d)));
		}
	}
	return sqrt(best);
}).setLayout({ name: 'labVoronoi2', type: 'float', inputs: [{ name: 'p', type: 'vec2' }] });

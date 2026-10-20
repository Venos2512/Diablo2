// TSL ports of src/shaders/post/*.glsl. Each function documents the GLSL file it mirrors.
import {
	Fn, vec2, vec3, vec4, float, uniform, mix, min, max, clamp, pow, exp, length, normalize, dot, smoothstep, select, fract, sin,
	floor, abs, time, screenUV, screenCoordinate, getViewPosition, toneMapping, If, texture,
} from 'three/tsl';
import * as THREE from 'three/webgpu';
import { labLuma, labLinearToSRGB, labFalseColor } from './common.js';

/** Uniform set shared by the WebGPU post graph (same names/semantics as the GLSL uniforms). */
export function createPostUniforms() {
	return {
		exposure: uniform(1),
		whiteBalance: uniform(new THREE.Vector3(1, 1, 1)),
		saturation: uniform(1),
		contrast: uniform(1),
		lift: uniform(0),
		gamma: uniform(1),
		gain: uniform(1),
		vignette: uniform(0.2),
		grain: uniform(0),
		chromatic: uniform(0),
		resolution: uniform(new THREE.Vector2(1, 1)),
		aoIntensity: uniform(1),
		fogDensity: uniform(0.03),
		fogFalloff: uniform(0.3),
		fogHeight: uniform(0),
		fogStart: uniform(2),
		fogMaxDist: uniform(250),
		fogColor: uniform(new THREE.Color()),
		sunDir: uniform(new THREE.Vector3(0, 1, 0)),
		sunColor: uniform(new THREE.Color()),
		inscatter: uniform(0.5),
		projInv: uniform(new THREE.Matrix4()),
		camWorld: uniform(new THREE.Matrix4()),
		camPos: uniform(new THREE.Vector3()),
		retroHeight: uniform(480),
		retroLevels: uniform(24),
		retroDither: uniform(0.6),
		lutIntensity: uniform(0),
	};
}

/** Mirrors heightFog() in composite.frag.glsl. */
export function heightFog(u) {
	return Fn(([colorIn, depthIn]) => {
		const sky = depthIn.greaterThanEqual(0.999999);
		const depth = select(sky, float(0.999), depthIn);
		const viewPos = getViewPosition(screenUV, depth, u.projInv);
		const worldPos = u.camWorld.mul(vec4(viewPos, 1.0)).xyz;
		const ray = worldPos.sub(u.camPos);
		const dist = select(sky, u.fogMaxDist, length(ray));
		const dir = normalize(ray);
		const s0 = u.fogStart;
		const s1 = max(dist, s0);
		const a = u.fogDensity.mul(exp(clamp(u.fogFalloff.negate().mul(u.camPos.y.sub(u.fogHeight)), -80.0, 80.0)));
		const b = u.fogFalloff.mul(dir.y);
		const integrated = a.mul(exp(clamp(b.negate().mul(s0), -80.0, 80.0)).sub(exp(clamp(b.negate().mul(s1), -80.0, 80.0)))).div(b);
		const amount = select(abs(b).greaterThan(1e-5), integrated, a.mul(s1.sub(s0)));
		const transmittance = exp(max(amount, 0.0).negate());
		const sun = pow(max(dot(dir, u.sunDir), 0.0), 8.0).mul(u.inscatter);
		const fogColor = u.fogColor.add(u.sunColor.mul(sun));
		return colorIn.mul(transmittance).add(fogColor.mul(transmittance.oneMinus()));
	});
}

/**
 * Mirrors final.frag.glsl. `sampleHdr(uv)` returns linear HDR rgb; `mode` and `toneMappingType` are
 * structural (a change rebuilds the graph), everything else is a uniform.
 */
export function displayTransform(u, { sampleHdr, mode, toneMappingType, chromatic, lut = null }) {
	return Fn(() => {
		const uv = screenUV;
		const hdr = vec3(0).toVar();
		if (chromatic) {
			const d = uv.sub(0.5).mul(u.chromatic).mul(0.012);
			hdr.assign(vec3(sampleHdr(uv.add(d)).r, sampleHdr(uv).g, sampleHdr(uv.sub(d)).b));
		} else {
			hdr.assign(sampleHdr(uv));
		}

		if (mode === 'falsecolor') return labFalseColor(labLuma(hdr.mul(u.exposure)));

		const c = hdr.mul(u.exposure).mul(u.whiteBalance).max(0.0).toVar();
		c.assign(pow(c.div(0.18).add(1e-6), vec3(u.contrast)).mul(0.18));
		const luma = labLuma(c);
		c.assign(max(mix(vec3(luma), c, u.saturation), vec3(0.0)));

		if (toneMappingType === THREE.NoToneMapping) c.assign(clamp(c, 0.0, 1.0));
		else c.assign(toneMapping(toneMappingType, float(1.0), c));

		c.assign(clamp(c.mul(u.gain).add(vec3(u.lift).mul(c.oneMinus())), 0.0, 1.0));
		c.assign(pow(c, vec3(float(1.0).div(max(u.gamma, 0.01)))));

		const p = uv.sub(0.5).toVar();
		p.x.mulAssign(u.resolution.x.div(u.resolution.y));
		c.mulAssign(mix(float(1.0), smoothstep(0.25, 0.95, p.length()).oneMinus(), u.vignette));

		c.assign(labLinearToSRGB(c));

		// 3D LUT in display space (structural: present only while a LUT is loaded). Sampled from the 2D
		// strip (blue slices side by side, see core/lut.js): bilinear red/green inside a slice, blue blended
		// between the two nearest slices — the same result as the GLSL sampler3D fetch.
		if (lut) {
			const size = lut.size;
			const cell = clamp(c, 0.0, 1.0).mul(size - 1).toVar();
			const slice = floor(cell.b).toVar();
			const next = min(slice.add(1.0), size - 1);
			const v = cell.g.add(0.5).div(size);
			const lo = texture(lut.strip, vec2(cell.r.add(0.5).add(slice.mul(size)).div(size * size), v)).rgb;
			const hi = texture(lut.strip, vec2(cell.r.add(0.5).add(next.mul(size)).div(size * size), v)).rgb;
			c.assign(mix(c, mix(lo, hi, cell.b.sub(slice)), u.lutIntensity));
		}

		If(u.grain.greaterThan(0.0), () => {
			const seed = screenCoordinate.xy.add(fract(time.mul(7.31)).mul(97.0));
			const n = fract(sin(dot(seed, vec2(12.9898, 78.233))).mul(43758.5453)).sub(0.5);
			const mid = float(1.0).sub(abs(labLuma(c).mul(2.0).sub(1.0)));
			c.addAssign(n.mul(u.grain).mul(mid.mul(0.65).add(0.35)));
		});

		// Half a display step of interleaved-gradient noise: no banding in dark gradients (night, vignette, fog).
		c.addAssign(fract(fract(dot(screenCoordinate.xy, vec2(0.06711056, 0.00583715))).mul(52.9829189)).sub(0.5).div(255.0));

		return c;
	})();
}

/** Mirrors retro.frag.glsl (closed-form 4x4 Bayer). `source` must be a texture node. */
export function retroPreview(u, source) {
	const bayer2 = Fn(([a]) => {
		const f = floor(a);
		return fract(f.x.div(2.0).add(f.y.mul(f.y).mul(0.75)));
	});
	return Fn(() => {
		const scale = max(1.0, u.resolution.y.div(u.retroHeight));
		const cells = floor(u.resolution.div(scale));
		const cell = floor(screenUV.mul(cells));
		const uv = cell.add(0.5).div(cells);
		const color = source.sample(uv).rgb;
		const steps = max(u.retroLevels.sub(1.0), 1.0);
		const dither = bayer2(cell.mul(0.5)).mul(0.25).add(bayer2(cell)).sub(0.5);
		return clamp(floor(color.mul(steps).add(0.5).add(dither.mul(u.retroDither))).div(steps), 0.0, 1.0);
	})();
}

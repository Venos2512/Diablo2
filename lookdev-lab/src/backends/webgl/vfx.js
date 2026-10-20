// GLSL side of the VFX lab: the shared particle material (one program for every emitter) and the atmosphere layers.
// TSL twin: ../webgpu/vfx.js. Compute particles are WebGPU-only (no compute shaders in WebGL2).
import * as THREE from 'three';
import { labTime, premultipliedAdditive } from './effects.js';
import { hotMaterial } from './hot.js';
import particleVert from '../../shaders/vfx/particle.vert.glsl';
import particleFrag from '../../shaders/vfx/particle.frag.glsl';
import atmosphereVert from '../../shaders/vfx/atmosphere.vert.glsl';
import atmosphereFrag from '../../shaders/vfx/atmosphere.frag.glsl';

export const GLSL_VFX_SOURCES = { particle: [particleVert, particleFrag], atmosphere: [atmosphereVert, atmosphereFrag] };

export function createGLSLVfx(backend) {
	let particleMaterial = null;
	return {
		language: 'GLSL',
		sources: GLSL_VFX_SOURCES,
		particleMaterial() {
			if (particleMaterial) return particleMaterial;
			particleMaterial = new THREE.ShaderMaterial({
				name: 'Particles (GLSL)',
				vertexShader: particleVert.code,
				fragmentShader: particleFrag.code,
				uniforms: { labTime, ...backend.pipeline.vfxUniforms },
				side: THREE.DoubleSide,
				...premultipliedAdditive,
			});
			hotMaterial(particleMaterial, particleVert, particleFrag);
			return particleMaterial;
		},
		/**
		 * One atmosphere layer (env/atmosphere.js). values = { key: initial value } (numbers, vectors, colours, arrays of
		 * Vector4 that the layer updates in place, the ground height texture) → { material, uniforms: { key: { value } } }.
		 * Each key is the shader's uniform without its `u` (focus → uFocus).
		 */
		atmosphereMaterial(values) {
			const uniforms = {};
			const named = {};
			for (const [key, value] of Object.entries(values)) named[`u${key[0].toUpperCase()}${key.slice(1)}`] = uniforms[key] = { value };
			const material = new THREE.ShaderMaterial({
				name: 'Atmosphere (GLSL)',
				vertexShader: atmosphereVert.code,
				fragmentShader: atmosphereFrag.code,
				uniforms: { labTime, ...backend.pipeline.vfxUniforms, ...named },
				side: THREE.DoubleSide,
				...premultipliedAdditive,
			});
			hotMaterial(material, atmosphereVert, atmosphereFrag);
			return { material, uniforms };
		},
		/** Compute-shader particle field: WebGPU only. */
		createComputeField: null,
		setOverdraw(on) {
			backend.pipeline.vfxUniforms.uOverdraw.value = on ? 1 : 0;
		},
	};
}

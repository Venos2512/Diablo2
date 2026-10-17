// GLSL side of the VFX lab: the shared particle material (one program for every emitter).
// TSL twin: ../webgpu/vfx.js. Compute particles are WebGPU-only (no compute shaders in WebGL2).
import * as THREE from 'three';
import { labTime, premultipliedAdditive } from './effects.js';
import { hotMaterial } from './hot.js';
import particleVert from '../../shaders/vfx/particle.vert.glsl';
import particleFrag from '../../shaders/vfx/particle.frag.glsl';

export const GLSL_VFX_SOURCES = { particle: [particleVert, particleFrag] };

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
		/** Compute-shader particle field: WebGPU only. */
		createComputeField: null,
		setOverdraw(on) {
			backend.pipeline.vfxUniforms.uOverdraw.value = on ? 1 : 0;
		},
	};
}

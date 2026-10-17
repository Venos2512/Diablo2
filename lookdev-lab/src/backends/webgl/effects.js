// GLSL implementations of the effects in src/effects/registry.js.
// Surface effects are onBeforeCompile patches on built-in materials (composable, see patches.js);
// VFX effects are ShaderMaterials rendered into the VFX layer. The TSL twins live in
// ../webgpu/effects.js with the same parameters, so the shader lab can compare them one-to-one.
// The `#region` markers are read by the Shaders panel to show each effect's glue code.
import * as THREE from 'three';
import { EFFECTS, defaultParams } from '../../effects/registry.js';
import { addPatch, removePatch, after, replace } from './patches.js';
import { hotMaterial } from './hot.js';
import windEntry from '../../shaders/effects/wind.glsl';
import flameVert from '../../shaders/effects/flame.vert.glsl';
import flameFrag from '../../shaders/effects/flame.frag.glsl';
import dissolveEntry from '../../shaders/effects/dissolve.glsl';
import statusEntry from '../../shaders/effects/status.glsl';
import rimEntry from '../../shaders/effects/rim.glsl';
import liquidEntry from '../../shaders/effects/liquid.glsl';
import quadVert from '../../shaders/effects/vfx_quad.vert.glsl';
import portalFrag from '../../shaders/effects/portal.frag.glsl';
import runesFrag from '../../shaders/effects/runes.frag.glsl';

/** Shared animation clock, updated by the backend every frame. */
export const labTime = { value: 0 };

const DEG = Math.PI / 180;

/** GLSL sources used by each effect (shown and editable in the Shaders panel). */
export const GLSL_SOURCES = {
	wind: [windEntry],
	flame: [flameVert, flameFrag],
	dissolve: [dissolveEntry],
	status: [statusEntry],
	rim: [rimEntry],
	liquid: [liquidEntry],
	portal: [quadVert, portalFrag],
	runes: [quadVert, runesFrag],
};

/** Uniform objects ({ value }) for an effect; colours stay THREE.Color (linear). */
function makeUniforms(name, overrides = {}) {
	const values = { ...defaultParams(name), ...overrides };
	const uniforms = {};
	for (const [key, value] of Object.entries(values)) uniforms[key] = { value };
	return uniforms;
}

export const premultipliedAdditive = {
	transparent: true,
	depthTest: false,
	depthWrite: false,
	blending: THREE.CustomBlending,
	blendEquation: THREE.AddEquation,
	blendSrc: THREE.OneFactor,
	blendDst: THREE.OneMinusSrcAlphaFactor,
	blendSrcAlpha: THREE.OneFactor,
	blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

/** True for materials whose shader has the lit chunks the surface patches anchor to. */
const isLit = (material) => !!material?.isMeshStandardMaterial;

/** Surface effect = one patch added to / removed from built-in materials. */
function surface(patch, accepts = isLit) {
	return {
		patch,
		accepts,
		apply(material) {
			if (accepts(material)) addPatch(material, patch);
			return material;
		},
		remove(material) {
			removePatch(material, patch.id);
			return material;
		},
	};
}

/** Insert the effect's .glsl file after `#include <common>` (read at compile time, so hot edits apply). */
const withSource = (source, entry) => after(source, '#include <common>', entry.code);
const isLitShader = (shader) => shader.fragmentShader.includes('#include <emissivemap_fragment>');

export function createGLSLEffects(backend) {
	const vfxUniforms = () => backend.pipeline.vfxUniforms;

	const builders = {
		// #region wind
		wind(u) {
			// Direction is edited in degrees, the shader wants radians.
			const dir = { get value() { return u.direction.value * DEG; } };
			return surface({
				id: 'lab-wind',
				order: 10,
				shadow: true,
				apply(shader) {
					Object.assign(shader.uniforms, {
						labTime,
						uWindStrength: u.strength,
						uWindFrequency: u.frequency,
						uWindGust: u.gust,
						uWindDir: dir,
						uWindHeight: u.height,
					});
					shader.vertexShader = after(shader.vertexShader, '#include <common>', `#include <lab_noise>\n${windEntry.code}`);
					// Displace in world space (after instancing), mask by height in metres.
					shader.vertexShader = replace(shader.vertexShader, '#include <project_vertex>', `
	vec4 labWorld = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		labWorld = instanceMatrix * labWorld;
	#endif
	labWorld = modelMatrix * labWorld;
	float labWindMask = clamp( position.y * length( ( modelMatrix * vec4( 1.0, 0.0, 0.0, 0.0 ) ).xyz ) / uWindHeight, 0.0, 1.0 );
	labWorld.xyz += labWindOffset( labWorld.xyz, labWindMask );
	vec4 mvPosition = viewMatrix * labWorld;
	gl_Position = projectionMatrix * mvPosition;`);
				},
			}, (material) => !!material && !material.isShaderMaterial);
		},
		// #endregion

		// #region dissolve
		dissolve(u) {
			return surface({
				id: 'lab-dissolve',
				order: 50,
				shadow: true,
				needs: ['objectPos'],
				apply(shader) {
					Object.assign(shader.uniforms, {
						uDissolveProgress: u.progress,
						uDissolveEdge: u.edgeWidth,
						uDissolveEdgeColor: u.edgeColor,
						uDissolveEdgeIntensity: u.edgeIntensity,
						uDissolveScale: u.scale,
					});
					shader.fragmentShader = withSource(shader.fragmentShader, dissolveEntry);
					if (!isLitShader(shader)) {
						// Shadow depth twin: only the discard.
						shader.fragmentShader = after(shader.fragmentShader, '#include <alphatest_fragment>', 'labDissolve();');
						return;
					}
					shader.fragmentShader = after(shader.fragmentShader, '#include <alphatest_fragment>', `
	vec2 labDissolveFx = labDissolve();
	diffuseColor.rgb *= 1.0 - 0.85 * labDissolveFx.y;`);
					shader.fragmentShader = after(shader.fragmentShader, '#include <emissivemap_fragment>', 'totalEmissiveRadiance += uDissolveEdgeColor * uDissolveEdgeIntensity * labDissolveFx.x;');
				},
			});
		},
		// #endregion

		// #region status
		status(u) {
			return surface({
				id: 'lab-status',
				order: 30,
				needs: ['objectPos'],
				apply(shader) {
					Object.assign(shader.uniforms, {
						labTime,
						uStatusMode: u.mode,
						uStatusAmount: u.amount,
						uStatusIntensity: u.intensity,
						uStatusSpeed: u.speed,
					});
					shader.fragmentShader = withSource(shader.fragmentShader, statusEntry);
					shader.fragmentShader = after(shader.fragmentShader, '#include <map_fragment>', 'diffuseColor.rgb = labStatusAlbedo( diffuseColor.rgb );');
					shader.fragmentShader = after(shader.fragmentShader, '#include <roughnessmap_fragment>', 'roughnessFactor = labStatusRoughness( roughnessFactor );');
					shader.fragmentShader = after(shader.fragmentShader, '#include <emissivemap_fragment>', 'totalEmissiveRadiance += labStatusEmissive( normal );');
				},
			});
		},
		// #endregion

		// #region rim
		rim(u) {
			return surface({
				id: 'lab-rim',
				order: 40,
				apply(shader) {
					Object.assign(shader.uniforms, { uRimColor: u.color, uRimPower: u.power, uRimIntensity: u.intensity });
					shader.fragmentShader = withSource(shader.fragmentShader, rimEntry);
					shader.fragmentShader = after(shader.fragmentShader, '#include <emissivemap_fragment>', 'totalEmissiveRadiance += labRimEmissive( normal );');
				},
			});
		},
		// #endregion

		// #region liquid
		liquid(u) {
			return surface({
				id: 'lab-liquid',
				order: 20,
				needs: ['worldPos', 'worldNormal'],
				apply(shader) {
					Object.assign(shader.uniforms, {
						labTime,
						uLiquidTint: u.tint,
						uLiquidCoverage: u.coverage,
						uRippleScale: u.rippleScale,
						uRippleSpeed: u.rippleSpeed,
						uLiquidRoughness: u.roughness,
					});
					shader.fragmentShader = withSource(shader.fragmentShader, liquidEntry);
					shader.fragmentShader = after(shader.fragmentShader, '#include <map_fragment>', `
	float labPuddle = labPuddleMask();
	diffuseColor.rgb = labLiquidAlbedo( diffuseColor.rgb, labPuddle );`);
					shader.fragmentShader = after(shader.fragmentShader, '#include <roughnessmap_fragment>', 'roughnessFactor = mix( roughnessFactor, uLiquidRoughness, labPuddle );');
					shader.fragmentShader = after(shader.fragmentShader, '#include <metalnessmap_fragment>', 'metalnessFactor *= 1.0 - labPuddle;');
					shader.fragmentShader = after(shader.fragmentShader, '#include <normal_fragment_maps>', `
	vec3 labRippleView = ( viewMatrix * vec4( labRippleNormal( vLabWorldPos.xz ), 0.0 ) ).xyz;
	normal = normalize( mix( normal, labRippleView, labPuddle ) );`);
				},
			});
		},
		// #endregion

		// #region flame
		flame(u) {
			const material = new THREE.ShaderMaterial({
				name: 'Flame (GLSL)',
				vertexShader: flameVert.code,
				fragmentShader: flameFrag.code,
				uniforms: {
					labTime,
					uIntensity: u.intensity,
					uCoreColor: u.coreColor,
					uEdgeColor: u.edgeColor,
					uTurbulence: u.turbulence,
					uSpeed: u.speed,
					...vfxUniforms(),
				},
				...premultipliedAdditive,
			});
			hotMaterial(material, flameVert, flameFrag);
			return { material };
		},
		// #endregion

		// #region portal
		portal(u) {
			const material = new THREE.ShaderMaterial({
				name: 'Town portal (GLSL)',
				vertexShader: quadVert.code,
				fragmentShader: portalFrag.code,
				uniforms: { labTime, uColor: u.color, uIntensity: u.intensity, uSwirl: u.swirl, uSpeed: u.speed, ...vfxUniforms() },
				side: THREE.DoubleSide,
				...premultipliedAdditive,
			});
			hotMaterial(material, quadVert, portalFrag);
			return { material };
		},
		// #endregion

		// #region runes
		runes(u) {
			const material = new THREE.ShaderMaterial({
				name: 'Waypoint runes (GLSL)',
				vertexShader: quadVert.code,
				fragmentShader: runesFrag.code,
				uniforms: { labTime, uColor: u.color, uIntensity: u.intensity, uActivation: u.activation, uSpeed: u.speed, ...vfxUniforms() },
				side: THREE.DoubleSide,
				...premultipliedAdditive,
			});
			hotMaterial(material, quadVert, runesFrag);
			return { material };
		},
		// #endregion
	};

	return {
		language: 'GLSL',
		labTime,
		sources: GLSL_SOURCES,
		/**
		 * Create an effect instance: { name, uniforms, apply?(material) -> material, remove?(material) -> material,
		 * accepts?(material), material? }. apply/remove return the material the mesh should use.
		 */
		create(name, overrides) {
			if (!EFFECTS[name]) throw new Error(`Unknown effect ${name}`);
			const build = builders[name];
			if (!build) return null;
			const uniforms = makeUniforms(name, overrides);
			return { name, uniforms, ...build(uniforms) };
		},
		has(name) {
			return !!builders[name];
		},
		update(elapsed) {
			labTime.value = elapsed;
		},
	};
}

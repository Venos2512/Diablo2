// GLSL implementations of the effects in src/effects/registry.js.
// Surface effects are onBeforeCompile patches on built-in materials (composable, see patches.js);
// VFX effects are ShaderMaterials rendered into the VFX layer. The TSL twins live in
// ../webgpu/effects.js with the same parameters, so the shader lab can compare them one-to-one.
// The `#region` markers are read by the Shaders panel to show each effect's glue code.
import * as THREE from 'three';
import { EFFECTS, defaultParams } from '../../effects/registry.js';
import { addPatch, removePatch, after, before, replace } from './patches.js';
import { hotMaterial } from './hot.js';
import { createBakedShadowGL } from './bakedShadow.js';
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
import cutawayEntry from '../../shaders/effects/cutaway.glsl';
import heroRimEntry from '../../shaders/effects/hero_rim.glsl';
import terrainEntry from '../../shaders/effects/terrain.glsl';
import shadowFillEntry from '../../shaders/effects/shadow_fill.glsl';
import groundBlendEntry from '../../shaders/effects/ground_blend.glsl';

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
						uLiquidWetness: u.wetness,
					});
					shader.fragmentShader = withSource(shader.fragmentShader, liquidEntry);
					shader.fragmentShader = after(shader.fragmentShader, '#include <map_fragment>', `
	float labPuddle = labPuddleMask();
	diffuseColor.rgb = labLiquidAlbedo( diffuseColor.rgb, labPuddle );`);
					shader.fragmentShader = after(shader.fragmentShader, '#include <roughnessmap_fragment>', 'roughnessFactor = labLiquidRoughness( roughnessFactor, labPuddle );');
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
		/**
		 * Character see-through circle (not a shader-lab effect): one shared instance, uniforms
		 * { center: Vector3, radius, feet, on } updated by the character controller every frame.
		 */
		createCutaway() {
			const u = { center: { value: new THREE.Vector3() }, radius: { value: 0.3 }, feet: { value: 0 }, on: { value: 0 } };
			return {
				uniforms: u,
				...surface(
					{
						id: 'lab-cutaway',
						order: 5,
						needs: ['worldPos'],
						apply(shader) {
							Object.assign(shader.uniforms, { uCutCenter: u.center, uCutRadius: u.radius, uCutFeet: u.feet, uCutOn: u.on });
							shader.fragmentShader = withSource(shader.fragmentShader, cutawayEntry);
							shader.fragmentShader = after(shader.fragmentShader, '#include <clipping_planes_fragment>', 'labCutaway( -vViewPosition, vLabWorldPos.y );');
						},
					},
					(m) => !!m?.isMeshStandardMaterial && !m.transparent,
				),
			};
		},
		/** Character rim light of the Act I moods (src/lighting/moodController.js); uniforms { color, intensity, power, bias }. */
		createHeroRim() {
			const u = { color: { value: new THREE.Color(0x8fb2ff) }, intensity: { value: 0 }, power: { value: 3 }, bias: { value: 0.6 } };
			return {
				uniforms: u,
				...surface({
					id: 'lab-hero-rim',
					order: 41,
					apply(shader) {
						Object.assign(shader.uniforms, { uHeroRimColor: u.color, uHeroRimIntensity: u.intensity, uHeroRimPower: u.power, uHeroRimBias: u.bias });
						shader.fragmentShader = withSource(shader.fragmentShader, heroRimEntry);
						shader.fragmentShader = after(shader.fragmentShader, '#include <emissivemap_fragment>', 'totalEmissiveRadiance += labHeroRim( normal );');
					},
				}),
			};
		},
		/**
		 * Terrain splat material (src/env/terrain.js): `layers` = three forged sets (dirt, wet dirt, grass; height in
		 * normal alpha), `splat` = RGBA DataTexture (R wet, G grass, B blood-soaked, A baked sky visibility) covering `rect`
		 * (Vector4: origin x, z, 1/size, 1/size). Uniforms { tile: Vector3, softness, heightBlend, water, waterRough, damp, ao,
		 * variation, variationScale (per metre), rotate (0/1: quarter-turn variants), macro, edgeNoise, debug, rect, blood, bloodColor (linear multiplier), veinColor, bakedAo (strength of A on
		 * the indirect light) }; setLayers(sets) swaps the sets.
		 */
		createTerrain({ layers, splat, rect }) {
			const u = {
				tile: { value: new THREE.Vector3(...layers.map((l) => 1 / l.recipe.tile)) },
				softness: { value: 0.12 },
				heightBlend: { value: 0.6 },
				water: { value: 0.3 },
				waterRough: { value: 0.05 },
				variation: { value: 1 },
				variationScale: { value: 0.09 },
				rotate: { value: 0 },
				macro: { value: 0.3 },
				edgeNoise: { value: 0.5 },
				damp: { value: 0.25 },
				ao: { value: 0.6 },
				debug: { value: 0 },
				grassShadow: { value: 0 },
				grassLift: { value: 0 },
				grassShadowOffset: { value: new THREE.Vector2() },
				blood: { value: 1 },
				bloodColor: { value: new THREE.Color(1, 0.55, 0.5) },
				veinColor: { value: new THREE.Color('#5a1f21') },
				bakedAo: { value: 0 },
				rect: { value: rect },
			};
			const textures = {};
			const setLayers = (sets) => sets.forEach((l, i) => {
				for (const [slot, key] of [['Albedo', 'map'], ['Normal', 'normalMap'], ['Orm', 'ormMap']]) (textures[`uTerrain${slot}${i}`] ??= { value: null }).value = l[key];
			});
			setLayers(layers);
			return {
				uniforms: u,
				setLayers,
				...surface({
					id: 'lab-terrain',
					order: 2,
					needs: ['worldPos', 'worldNormal'],
					apply(shader) {
						Object.assign(shader.uniforms, textures, {
							uTerrainSplat: { value: splat },
							uTerrainRect: u.rect,
							uTerrainTile: u.tile,
							uTerrainSoftness: u.softness,
							uTerrainHeightBlend: u.heightBlend,
							uTerrainWater: u.water,
							uTerrainWaterRough: u.waterRough,
							uTerrainVariation: u.variation,
							uTerrainVariationScale: u.variationScale,
							uTerrainRotate: u.rotate,
							uTerrainMacro: u.macro,
							uTerrainEdgeNoise: u.edgeNoise,
							uTerrainDamp: u.damp,
							uTerrainAo: u.ao,
							uTerrainDebug: u.debug,
							uTerrainGrassShadow: u.grassShadow,
							uTerrainGrassLift: u.grassLift,
							uTerrainGrassShadowOffset: u.grassShadowOffset,
							uTerrainBlood: u.blood,
							uTerrainBloodColor: u.bloodColor,
							uTerrainVeinColor: u.veinColor,
							uTerrainBakedAo: u.bakedAo,
						});
						shader.fragmentShader = withSource(shader.fragmentShader, terrainEntry);
						shader.fragmentShader = after(shader.fragmentShader, '#include <map_fragment>', `
	LabTerrain labTer = labTerrain( vLabWorldPos, vLabWorldNormal );
	diffuseColor.rgb *= labTer.albedo;`);
						shader.fragmentShader = after(shader.fragmentShader, '#include <roughnessmap_fragment>', 'roughnessFactor *= labTer.rough;');
						shader.fragmentShader = after(shader.fragmentShader, '#include <normal_fragment_maps>', 'normal = normalize( ( viewMatrix * vec4( labTer.normal, 0.0 ) ).xyz );');
						// Baked sky visibility darkens the indirect light only, like an aoMap.
						shader.fragmentShader = after(shader.fragmentShader, '#include <aomap_fragment>', `
	reflectedLight.indirectDiffuse *= labTer.sky;
	reflectedLight.indirectSpecular *= labTer.sky;`);
					},
				}),
			};
		},
		/**
		 * Shadow fill for scene assets (shaders/effects/shadow_fill.glsl): dark lit results are lifted toward a tinted
		 * fraction of the albedo. One shared instance; uniforms { color, strength, threshold }.
		 */
		createShadowFill() {
			const u = { color: { value: new THREE.Color(0x3c5248) }, strength: { value: 0 }, threshold: { value: 0.05 } };
			return {
				uniforms: u,
				...surface({
					id: 'lab-shadow-fill',
					order: 90,
					apply(shader) {
						Object.assign(shader.uniforms, { uFillColor: u.color, uFillStrength: u.strength, uFillThreshold: u.threshold });
						shader.fragmentShader = withSource(shader.fragmentShader, shadowFillEntry);
						shader.fragmentShader = before(shader.fragmentShader, '#include <opaque_fragment>', 'outgoingLight = labShadowFill( outgoingLight, diffuseColor.rgb );');
					},
				}),
			};
		},
		/**
		 * Ground blend for the assets of a terrain scene (shaders/effects/ground_blend.glsl, env/groundBlend.js), one per
		 * app. Uniforms { band, width, fraction, noise, strength, normal, top, contact, darken, unroll, contactHeight,
		 * softness, debug, rect (Vector4: capture origin x, z, 1 / size, 1 / size) }; targets { albedo (RGBA8: √albedo, roughness), normal
		 * (RGBA16F: world normal xz, height, coverage) }; profile(top, contact, band) = the surface patch for materials with
		 * those top-cover / contact / band factors; captureMaterial(terrain) = a ground material writing the capture (captureMode 0:
		 * albedo, 1: normal + height); remove(material) takes the patch off.
		 */
		createGroundBlend({ size = 2048 } = {}) {
			const u = {
				band: { value: 0.22 },
				width: { value: 0.3 },
				fraction: { value: 0.3 },
				noise: { value: 0.6 },
				strength: { value: 1 },
				normal: { value: 0.85 },
				top: { value: 0.35 },
				contact: { value: 0.85 },
				darken: { value: 0.3 },
				unroll: { value: 1 },
				contactHeight: { value: 1.2 },
				softness: { value: 0.35 },
				debug: { value: 0 },
				rect: { value: new THREE.Vector4(0, 0, 1, 1) },
			};
			const targets = {
				albedo: new THREE.WebGLRenderTarget(size, size, { type: THREE.UnsignedByteType }),
				normal: new THREE.WebGLRenderTarget(size, size, { type: THREE.HalfFloatType }),
			};
			targets.albedo.texture.name = 'Ground blend · capture (√albedo, roughness)';
			targets.normal.texture.name = 'Ground blend · capture (normal xz, height, coverage)';
			// The packed vec4 uniforms read the scalar ones at upload (getters), so nothing has to be kept in sync.
			const packed = (a, b, c, d) => {
				const v = new THREE.Vector4();
				return { get value() { return v.set(a.value, b.value, c.value, d.value); } };
			};
			const shared = {
				uGroundA: { value: targets.albedo.texture },
				uGroundB: { value: targets.normal.texture },
				uGroundRect: u.rect,
				uGroundBand: packed(u.band, u.width, u.noise, u.strength),
				uGroundLayers: packed(u.normal, u.top, u.contact, u.darken),
				uGroundMore: packed(u.unroll, u.contactHeight, u.debug, u.softness),
				uGroundFraction: u.fraction,
			};
			const accepts = (m) => !!m?.isMeshStandardMaterial && !m.transparent;
			const profiles = new Map();
			const profile = (top = 0, contact = 1, band = 1) => {
				const key = `${top}|${contact}|${band}`;
				if (!profiles.has(key)) {
					const amount = { value: new THREE.Vector3(top, contact, band) };
					profiles.set(key, surface({
						id: 'lab-ground-blend',
						key: 'lab-ground-blend', // one program for every profile: the factors are uniforms
						order: 4,
						needs: ['worldPos', 'worldNormal'],
						apply(shader) {
							Object.assign(shader.uniforms, shared, { uGroundProfile: amount });
							shader.vertexShader = after(shader.vertexShader, '#include <common>', 'attribute vec2 labGround;\nvarying vec2 vLabGround;');
							shader.vertexShader = after(shader.vertexShader, '#include <begin_vertex>', 'vLabGround = labGround;');
							shader.fragmentShader = withSource(shader.fragmentShader, groundBlendEntry);
							// Before the vertex colours (the props' baked AO darkens the blended foot like the rest of the prop).
							shader.fragmentShader = after(shader.fragmentShader, '#include <map_fragment>', `
	LabGround labGnd = labGroundBlend( vLabWorldPos, normalize( vLabWorldNormal ), diffuseColor.rgb, vLabGround );
	diffuseColor.rgb = mix( diffuseColor.rgb, labGnd.albedo, labGnd.weight ) * labGnd.shade;
	if ( uGroundMore.z > 0.5 ) diffuseColor.rgb = vec3( 0.03 );`);
							// Debug view: the weights glow (readable at night too).
							shader.fragmentShader = after(shader.fragmentShader, '#include <emissivemap_fragment>', 'totalEmissiveRadiance += labGnd.debug * 0.6 * step( 0.5, uGroundMore.z );');
							shader.fragmentShader = after(shader.fragmentShader, '#include <roughnessmap_fragment>', 'roughnessFactor = mix( roughnessFactor, labGnd.rough, labGnd.weight );');
							shader.fragmentShader = after(shader.fragmentShader, '#include <metalnessmap_fragment>', 'metalnessFactor *= 1.0 - labGnd.weight;');
							shader.fragmentShader = after(shader.fragmentShader, '#include <normal_fragment_maps>', 'normal = normalize( mix( normal, ( viewMatrix * vec4( labGnd.normal, 0.0 ) ).xyz, labGnd.normalWeight ) );');
						},
					}, accepts));
				}
				return profiles.get(key);
			};
			const captureMode = { value: 0 };
			const capturePatch = {
				id: 'lab-ground-capture',
				order: 200,
				needs: ['worldPos'],
				apply(shader) {
					shader.uniforms.uGroundCaptureMode = captureMode;
					shader.fragmentShader = after(shader.fragmentShader, '#include <common>', 'uniform float uGroundCaptureMode;');
					shader.fragmentShader = after(shader.fragmentShader, '#include <dithering_fragment>', `
	vec3 labCaptureNormal = inverseTransformDirection( normal, viewMatrix );
	gl_FragColor = uGroundCaptureMode < 0.5 ? vec4( sqrt( max( diffuseColor.rgb, vec3( 0.0 ) ) ), roughnessFactor ) : vec4( labCaptureNormal.xz * 0.5 + 0.5, vLabWorldPos.y, 1.0 );`);
				},
			};
			return {
				uniforms: u,
				targets,
				captureMode,
				profile,
				remove(material) {
					removePatch(material, 'lab-ground-blend');
					return material;
				},
				captureMaterial(terrain) {
					const material = new THREE.MeshStandardMaterial({ name: 'Ground blend · capture', color: 0xffffff, roughness: 1, metalness: 0 });
					terrain.apply(material);
					addPatch(material, capturePatch);
					return material;
				},
			};
		},
		/**
		 * Baked shadow of a directional light: static casters rendered once per light direction, moving ones every frame,
		 * percentage-closer soft filtering (env/bakedShadow.js, ./bakedShadow.js). Options { scene, name }.
		 */
		createBakedShadow: (light, options) => createBakedShadowGL(backend, light, options),
		/** Source material of a mesh's material (WebGL patches materials in place: always itself). */
		sourceOf: (material) => material,
	};
}

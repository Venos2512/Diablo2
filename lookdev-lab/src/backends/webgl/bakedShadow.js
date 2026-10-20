// WebGL2 half of the baked directional shadow (env/bakedShadow.js). three's own shadow pass renders the static casters
// once into a second target (RGBA-packed depth, like the live map); every frame the cover quad's depth material copies
// it texel for texel into the live map, onBeforeShadow keeps the static meshes out of the light's live pass, and only
// the moving casters are drawn. A negative shadow radius switches the light to percentage-closer soft shadows: three's
// getShadow() gets a wrapper that sends those lights to labPcssShadow() (shaders/chunks/pcss.glsl).
import * as THREE from 'three';
import { replace, before } from './patches.js';
import { pcssScale, coverQuad, fitCoverQuad, castersIn, movingCasters, withHidden, bakeKey } from '../../env/bakedShadow.js';

const GET_SHADOW = 'float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {';

/**
 * Wrap three's getShadow() (every lit material): a negative radius means PCSS, anything else keeps three's filter.
 * Installed when this module loads: three caches programs by material parameters, not by chunk text, so the chunk
 * has to change before the first program is built.
 */
function installPcss() {
	const chunk = THREE.ShaderChunk.shadowmap_pars_fragment;
	if (chunk.includes('labThreeGetShadow')) return;
	const renamed = replace(chunk, GET_SHADOW, GET_SHADOW.replace('getShadow', 'labThreeGetShadow'));
	THREE.ShaderChunk.shadowmap_pars_fragment = before(renamed, 'vec2 cubeToUV( vec3 v, float texelSizeY ) {', `#include <lab_pcss>

	${GET_SHADOW}
		float shadow;
		#ifndef SHADOWMAP_TYPE_VSM
			if ( shadowRadius < 0.0 ) {
				shadow = labPcssShadow( shadowMap, shadowMapSize, shadowIntensity, shadowBias, - shadowRadius, shadowCoord );
			} else {
				shadow = labThreeGetShadow( shadowMap, shadowMapSize, shadowIntensity, shadowBias, shadowRadius, shadowCoord );
			}
		#else
			shadow = labThreeGetShadow( shadowMap, shadowMapSize, shadowIntensity, shadowBias, shadowRadius, shadowCoord );
		#endif
		return shadow; // one exit: ANGLE's HLSL compiler warns about early returns (X4000)
	}
`);
}
installPcss();

/** Depth material of the cover quad: the baked texel under this fragment, as depth and as packed colour. */
function copyMaterial(name) {
	return new THREE.ShaderMaterial({
		name: `${name} · baked shadow copy`,
		side: THREE.DoubleSide,
		uniforms: { uBaked: { value: null } },
		vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
		fragmentShader: `#include <packing>
uniform sampler2D uBaked;
void main() {
	vec4 packedDepth = texelFetch( uBaked, ivec2( gl_FragCoord.xy ), 0 );
	gl_FragDepth = unpackRGBAToDepth( packedDepth );
	gl_FragColor = packedDepth;
}`,
	});
}

// A draw is skipped by an empty draw range for the duration of one pass (onBefore… / onAfter… pairs).
const drop = (geometry) => {
	if (geometry.drawRange.count < 0) return;
	geometry.userData.labDrawCount = geometry.drawRange.count;
	geometry.drawRange.count = -1;
};
const restore = (geometry) => {
	if (geometry.drawRange.count < 0) geometry.drawRange.count = geometry.userData.labDrawCount ?? Infinity;
};

/**
 * Baked shadow for `light` (orthographic shadow camera) in `scene`. Methods: setStatics(roots), setEnabled(on),
 * setSoftness(degrees: light angular radius, 0 = three's filter), update() every frame before rendering, info(),
 * maps(), dispose().
 */
export function createBakedShadowGL(backend, light, { scene, name = light.name }) {
	const renderer = backend.renderer;
	const shadowCamera = light.shadow.camera;
	const state = { enabled: true, softness: 0, statics: new Set(), key: '', ready: false, pending: false, mode: 'off', radius: Math.max(0, light.shadow.radius), ms: 0 };
	const copy = copyMaterial(name);
	const quad = coverQuad(`${name} · baked shadow`, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, colorWrite: false, depthWrite: false }));
	quad.customDepthMaterial = copy;
	// The quad only ever draws in the light's live shadow pass.
	quad.onBeforeRender = (r, s, c, geometry) => drop(geometry);
	quad.onAfterRender = (r, s, c, geometry) => restore(geometry);
	quad.onBeforeShadow = (r, o, c, shadowCam, geometry) => {
		if (shadowCam !== shadowCamera || state.mode !== 'live') drop(geometry);
	};
	quad.onAfterShadow = (r, o, c, shadowCam, geometry) => restore(geometry);
	scene.add(quad);
	let target = null;
	const afterRender = scene.onAfterRender;
	scene.onAfterRender = function (r, s, view, renderTarget) {
		afterRender.call(this, r, s, view, renderTarget);
		if (!state.pending) return;
		state.pending = false;
		bake(view);
	};

	function hookStatic(mesh) {
		if (mesh.userData.labBakedShadow) return;
		mesh.userData.labBakedShadow = true;
		const onBefore = mesh.onBeforeShadow;
		const onAfter = mesh.onAfterShadow;
		mesh.onBeforeShadow = function (r, object, cam, shadowCam, geometry, depthMaterial, group) {
			onBefore.call(this, r, object, cam, shadowCam, geometry, depthMaterial, group);
			if (shadowCam === shadowCamera && state.mode === 'live' && state.statics.has(this)) drop(geometry);
		};
		mesh.onAfterShadow = function (r, object, cam, shadowCam, geometry, depthMaterial, group) {
			restore(geometry);
			onAfter.call(this, r, object, cam, shadowCam, geometry, depthMaterial, group);
		};
	}

	/** Static casters into `target`. Runs inside a render (scene.onAfterRender): three's shadow pass needs its render state. */
	function bake(view) {
		const t0 = performance.now();
		const shadowMap = renderer.shadowMap;
		const size = light.shadow.mapSize;
		target ??= new THREE.WebGLRenderTarget(size.x, size.y, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
		target.texture.name = `${name} · baked shadow (static casters)`;
		if (target.width !== size.x || target.height !== size.y) target.setSize(size.x, size.y);
		const live = light.shadow.map;
		const flags = [shadowMap.autoUpdate, shadowMap.needsUpdate];
		state.mode = 'bake';
		withHidden(movingCasters(scene, state.statics, quad), () => {
			light.shadow.map = target;
			light.shadow.needsUpdate = true;
			shadowMap.needsUpdate = true;
			shadowMap.render([light], scene, view);
		});
		// three swaps in a new target when the shadow type just switched to or from VSM.
		if (light.shadow.map !== target) {
			target.dispose();
			target = light.shadow.map;
		}
		light.shadow.map = live;
		[shadowMap.autoUpdate, shadowMap.needsUpdate] = flags;
		copy.uniforms.uBaked.value = target.texture;
		fitCoverQuad(quad, shadowCamera);
		state.key = bakeKey(light);
		state.ready = true;
		state.mode = 'live';
		state.ms = performance.now() - t0;
	}

	return {
		quad,
		setStatics(roots) {
			state.statics = castersIn(roots);
			state.statics.forEach(hookStatic);
			state.ready = false;
		},
		setEnabled(on) {
			state.enabled = on;
		},
		setSoftness(degrees) {
			state.softness = degrees;
		},
		/**
		 * Every frame before rendering: when the light moved (time of day, mood) or the map changed, this frame draws every
		 * caster live and the bake runs after it.
		 */
		update() {
			const shadowMap = renderer.shadowMap;
			const vsm = shadowMap.type === THREE.VSMShadowMap;
			if (state.enabled && state.statics.size && shadowMap.enabled && light.castShadow && !vsm) {
				if (!state.ready || bakeKey(light) !== state.key) {
					state.mode = 'off';
					state.pending = true;
				}
			} else {
				state.mode = 'off';
				state.ready = false;
				state.pending = false;
			}
			// The Lighting tab resets every shadow radius (scene / mood change): keep the PCSS flag on this one.
			if (light.shadow.radius >= 0) state.radius = light.shadow.radius;
			light.shadow.radius = state.softness > 0 && !vsm ? -pcssScale(light.shadow, state.softness) : state.radius;
		},
		info() {
			return { baked: state.mode === 'live', ms: state.ms, statics: state.statics.size, softness: state.softness, scale: -Math.min(0, light.shadow.radius) };
		},
		/** Render targets for inspection: the light's live map and the baked one. */
		maps() {
			return { live: light.shadow.map, baked: target };
		},
		dispose() {
			scene.remove(quad);
			scene.onAfterRender = afterRender;
			quad.geometry.dispose();
			quad.material.dispose();
			copy.dispose();
			target?.dispose();
			state.statics.clear();
			state.mode = 'off';
			state.pending = false;
			if (light.shadow.radius < 0) light.shadow.radius = state.radius;
		},
	};
}

// Baked directional shadow (the Weeping Fields moon). The shadow depth of everything that never moves is rendered once
// per light direction into a second target; every frame a quad that fills the light's shadow frustum writes that depth
// back into the live shadow map, and only the moving casters (characters, crows, wind-blown trees and shrubs) are drawn
// on top of it. Receivers sample the light's own map as usual, so every material — terrain, props, characters — gets
// the static and the moving shadows without a patch or an extra sampler. The map is filtered with percentage-closer
// soft shadows (shaders/chunks/pcss.glsl and its TSL twin): hard where a caster stands on the ground, soft far from it.
// Backends: backends/webgl/bakedShadow.js (three's shadow pass + per-mesh hooks), backends/webgpu/bakedShadow.js (a
// ShadowNode subclass). This module holds what both share.
import * as THREE from 'three';

/** Blocker search radius as a fraction of the penumbra scale (see LAB_PCSS_SEARCH_SCALE in pcss.glsl). */
export const PCSS_SEARCH_SCALE = 0.1;
export const PCSS_MAX_TEXELS = 32;
export const PCSS_SEARCH = 16;
export const PCSS_TAPS = 24;

/**
 * Penumbra texels per unit of shadow depth for a light of angular radius `degrees` (orthographic shadow camera): a
 * receiver d metres behind its occluder gets a penumbra of d·tan(angle) metres.
 */
export function pcssScale(shadow, degrees) {
	const cam = shadow.camera;
	const texel = (cam.right - cam.left) / cam.zoom / shadow.mapSize.x;
	return ((cam.far - cam.near) * Math.tan(THREE.MathUtils.degToRad(degrees))) / texel;
}

/**
 * The cover quad: a unit plane placed in the light's shadow frustum by fitCoverQuad(). It casts (its depth material
 * writes the baked depth), never receives, and is invisible to raycasts and the nav / collision builders.
 */
export function coverQuad(name, material) {
	const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
	quad.name = name;
	quad.castShadow = true;
	quad.receiveShadow = false;
	quad.frustumCulled = false;
	quad.matrixAutoUpdate = false;
	quad.raycast = () => {};
	quad.userData.labNoCollide = true;
	return quad;
}

const _place = new THREE.Matrix4();

/** Fill `camera`'s orthographic frustum with the quad, halfway between near and far (a little oversized). */
export function fitCoverQuad(quad, camera) {
	const w = (camera.right - camera.left) / camera.zoom;
	const h = (camera.top - camera.bottom) / camera.zoom;
	_place.makeScale(w * 1.02, h * 1.02, 1).setPosition((camera.right + camera.left) / 2, (camera.top + camera.bottom) / 2, -(camera.near + camera.far) / 2);
	quad.matrix.multiplyMatrices(camera.matrixWorld, _place);
	quad.matrixWorldNeedsUpdate = true;
}

/** Shadow-casting meshes under `roots`. */
export function castersIn(roots) {
	const set = new Set();
	for (const root of roots) root?.traverse((o) => o.isMesh && o.castShadow && set.add(o));
	return set;
}

/** Shadow casters of `scene` outside `statics` (and other than `skip`): what has to be drawn every frame. */
export function movingCasters(scene, statics, skip) {
	const list = [];
	scene.traverse((o) => {
		if (o.isMesh && o.castShadow && o !== skip && !statics.has(o)) list.push(o);
	});
	return list;
}

/** Run `fn` with the visible ones of `objects` hidden. */
export function withHidden(objects, fn) {
	const hidden = [];
	for (const o of objects) {
		if (!o.visible) continue;
		o.visible = false;
		hidden.push(o);
	}
	try {
		return fn();
	} finally {
		for (const o of hidden) o.visible = true;
	}
}

/**
 * What the baked depth depends on: light placement, map size, frustum. A change means a new bake (time of day, mood,
 * the Lighting tab's map size).
 */
export function bakeKey(light) {
	const s = light.shadow;
	const c = s.camera;
	const p = light.getWorldPosition(_from);
	const t = light.target.getWorldPosition(_to);
	return [p.x, p.y, p.z, t.x, t.y, t.z, s.mapSize.x, s.mapSize.y, c.left, c.right, c.top, c.bottom, c.near, c.far, c.zoom].map((v) => v.toFixed(3)).join(',');
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();

// Composable onBeforeCompile patches for built-in three.js materials (WebGL / GLSL path).
// Several effects can patch one material; the program cache key includes every patch id and
// the shader hot-reload version, so edits in src/shaders recompile affected programs.
// Patch lists live in a WeakMap (not userData) because Material.copy JSON-clones userData.
//
// A patch is { id, order, apply(shader, material, renderer), needs?: ['objectPos' | 'worldPos' | 'worldNormal'],
// shadow?: true }. `needs` asks for shared varyings (declared once even when several patches use them);
// `shadow` patches are also applied to per-mesh shadow depth twins (see syncShadowTwins) so wind sways
// and dissolved parts vanish in shadows too — the TSL path gets the same through node overrides.
import * as THREE from 'three';
import { shaderVersion } from '../../core/shaderRegistry.js';

const registry = new WeakMap();
const patched = new Set(); // every material with at least one patch (for hot reload)

const VARYINGS = {
	// Rest-pose object position scaled to metres: stable on skinned characters, size-independent noise.
	objectPos: {
		decl: 'varying vec3 vLabObjectPos;',
		code: 'vLabObjectPos = position * length( ( modelMatrix * vec4( 1.0, 0.0, 0.0, 0.0 ) ).xyz );',
	},
	worldPos: {
		decl: 'varying vec3 vLabWorldPos;',
		code: `vec4 labWorldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		labWorldPosition = batchingMatrix * labWorldPosition;
	#endif
	#ifdef USE_INSTANCING
		labWorldPosition = instanceMatrix * labWorldPosition;
	#endif
	vLabWorldPos = ( modelMatrix * labWorldPosition ).xyz;`,
	},
	worldNormal: {
		decl: 'varying vec3 vLabWorldNormal;',
		code: 'vLabWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );',
		lit: true,
	},
};

function injectVaryings(shader, needs) {
	const lit = shader.vertexShader.includes('#include <defaultnormal_vertex>');
	let decl = '';
	let code = '';
	for (const key of needs) {
		const v = VARYINGS[key];
		if (!v || (v.lit && !lit)) continue;
		decl += v.decl + '\n';
		code += v.code + '\n';
	}
	if (!decl) return;
	shader.vertexShader = after(shader.vertexShader, '#include <common>', decl);
	shader.vertexShader = after(shader.vertexShader, '#include <clipping_planes_vertex>', code);
	shader.fragmentShader = after(shader.fragmentShader, '#include <common>', decl);
}

function labOnBeforeCompile(shader, renderer) {
	const list = registry.get(this) || [];
	const needs = new Set(list.flatMap((p) => p.needs || []));
	if (needs.size) injectVaryings(shader, needs);
	for (const patch of list) patch.apply(shader, this, renderer);
}

function labCacheKey() {
	return (registry.get(this) || []).map((p) => p.key || p.id).join('|') + '#' + shaderVersion();
}

function onPatchedDispose(event) {
	patched.delete(event.target);
}

function install(material, list) {
	registry.set(material, list);
	material.onBeforeCompile = labOnBeforeCompile;
	material.customProgramCacheKey = labCacheKey;
	material.needsUpdate = true;
	if (!patched.has(material)) {
		patched.add(material);
		material.addEventListener('dispose', onPatchedDispose);
	}
}

export function addPatch(material, patch) {
	const list = [...(registry.get(material) || [])];
	const index = list.findIndex((p) => p.id === patch.id);
	if (index >= 0) list[index] = patch;
	else list.push(patch);
	list.sort((a, b) => (a.order || 0) - (b.order || 0));
	install(material, list);
}

export function removePatch(material, id) {
	const list = registry.get(material);
	if (!list) return false;
	const index = list.findIndex((p) => p.id === id);
	if (index < 0) return false;
	install(material, list.filter((p) => p.id !== id));
	return true;
}

export function getPatch(material, id) {
	return registry.get(material)?.find((p) => p.id === id) || null;
}

export function listPatches(material) {
	return registry.get(material) || [];
}

/** Recompile every patched material (a shader file or chunk changed). */
export function invalidatePatched() {
	for (const m of patched) m.needsUpdate = true;
}

// ---------------------------------------------------------------------------------------------
// Shadow twins: per-mesh customDepthMaterial / customDistanceMaterial carrying the material's
// `shadow` patches. Without them WebGLShadowMap renders plain depth (no sway, no dissolve).

const shadowTwins = new WeakMap(); // source material -> { depth, distance }

function twinsFor(material) {
	let twins = shadowTwins.get(material);
	if (!twins) {
		twins = {
			depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }),
			distance: new THREE.MeshDistanceMaterial(),
		};
		twins.depth.name = `${material.name || material.type} · shadow depth`;
		twins.distance.name = `${material.name || material.type} · shadow distance`;
		shadowTwins.set(material, twins);
	}
	return twins;
}

export function syncShadowTwins(root) {
	root.traverse((object) => {
		if (!object.isMesh || !object.material) return;
		const material = Array.isArray(object.material) ? object.material.find((m) => listPatches(m).some((p) => p.shadow)) : object.material;
		const patches = material ? listPatches(material).filter((p) => p.shadow) : [];
		const ours = object.userData.labShadowTwin === true;
		if (!patches.length) {
			if (ours) {
				object.customDepthMaterial = undefined;
				object.customDistanceMaterial = undefined;
				delete object.userData.labShadowTwin;
			}
			return;
		}
		if (object.customDepthMaterial && !ours) return; // keep custom depth materials set by someone else
		const twins = twinsFor(material);
		const key = patches.map((p) => p.id).join('|');
		for (const twin of [twins.depth, twins.distance]) {
			if (twin.userData.labKey !== key || listPatches(twin).some((p, i) => p !== patches[i])) {
				install(twin, [...patches]);
				twin.userData.labKey = key;
			}
		}
		object.customDepthMaterial = twins.depth;
		object.customDistanceMaterial = twins.distance;
		object.userData.labShadowTwin = true;
	});
}

// ---------------------------------------------------------------------------------------------
// Source helpers. Inserted code is wrapped in marker comments so several patches using the same
// anchor run in patch order (each new block goes after the blocks already inserted there).

const OPEN = '// <lab>';
const CLOSE = '// </lab>';

function anchorIndex(source, anchor) {
	const i = source.indexOf(anchor);
	if (i < 0) throw new Error(`Shader patch anchor not found: ${anchor}`);
	return i;
}

/** Insert `code` after the first occurrence of `anchor` (throws if missing so broken patches are loud). */
export function after(source, anchor, code) {
	let at = anchorIndex(source, anchor) + anchor.length;
	while (source.startsWith('\n' + OPEN, at)) at = source.indexOf(CLOSE, at) + CLOSE.length;
	return source.slice(0, at) + '\n' + OPEN + '\n' + code + '\n' + CLOSE + source.slice(at);
}

export function before(source, anchor, code) {
	const i = anchorIndex(source, anchor);
	return source.slice(0, i) + code + '\n' + source.slice(i);
}

export function replace(source, anchor, code) {
	const i = anchorIndex(source, anchor);
	return source.slice(0, i) + code + source.slice(i + anchor.length);
}

// ---------------------------------------------------------------------------------------------
// Lookdev channel views for MeshStandardMaterial / MeshPhysicalMaterial.

export const debugUniform = { value: 0 };

const debugPatch = {
	id: 'lab-debug',
	order: 100,
	apply(shader) {
		shader.uniforms.labDebugMode = debugUniform;
		shader.fragmentShader = after(shader.fragmentShader, '#include <common>', '#include <lab_common>\n#include <lab_pbr_validate>\nuniform int labDebugMode;');
		shader.fragmentShader = after(shader.fragmentShader, '#include <dithering_fragment>', `
	if ( labDebugMode > 0 ) {
		vec3 labDbg = vec3( 0.0 );
		if ( labDebugMode == 1 ) labDbg = diffuseColor.rgb;
		else if ( labDebugMode == 2 ) labDbg = labSRGBToLinear( inverseTransformDirection( normal, viewMatrix ) * 0.5 + 0.5 );
		else if ( labDebugMode == 3 ) labDbg = labSRGBToLinear( vec3( roughnessFactor ) );
		else if ( labDebugMode == 4 ) labDbg = labSRGBToLinear( vec3( metalnessFactor ) );
		else if ( labDebugMode == 5 ) {
			#ifdef USE_AOMAP
				labDbg = labSRGBToLinear( vec3( ambientOcclusion ) );
			#else
				labDbg = vec3( 1.0 );
			#endif
		}
		else if ( labDebugMode == 6 ) labDbg = totalEmissiveRadiance;
		else if ( labDebugMode == 7 ) labDbg = labPbrValidate( diffuseColor.rgb, metalnessFactor );
		gl_FragColor = vec4( labDbg, 1.0 );
	}`);
	},
};

const prepared = new WeakSet();

export function prepareMaterial(material) {
	if (!material || prepared.has(material)) return;
	prepared.add(material);
	if (material.isMeshStandardMaterial) addPatch(material, debugPatch);
}

// WebGPU / TSL version of the procedural character material (rig.js makeCharMaterial patches
// MeshStandardMaterial with onBeforeCompile, which node materials ignore). Reads the same uniform
// objects (material.userData.u) through reference nodes, so flash / tint / frozen / rim / highlight /
// ghost set from the CharacterModel API keep working. Not ported: the Hollow King's lava cracks (uCrack).
import * as THREE from 'three/webgpu';
import { attribute, reference, vertexColor, normalView, positionViewDirection, materialOpacity, vec3, float, dot, mix, step } from 'three/tsl';

export function makeCharNodeMaterial(source) {
	const u = source.userData.u;
	const f = (k) => reference('value', 'float', u[k]);
	const c = (k) => reference('value', 'color', u[k]);
	const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.8, metalness: 0 });
	m.name = 'procedural-char';
	m.userData.u = u;
	m.transparent = source.transparent;
	m.depthWrite = source.depthWrite;

	const aMat = attribute('aMat', 'vec3');
	const base = vertexColor().rgb;
	const rim = float(1).sub(dot(normalView, positionViewDirection).clamp()).pow(2.4);
	const lum = dot(base, vec3(0.3, 0.55, 0.15));
	const frozen = f('uFrozen');
	const ghost = step(0.5, f('uGhost'));

	let color = mix(base, c('uTint').mul(lum.mul(1.4).add(0.3)), f('uTintAmt'));
	color = mix(color, vec3(0.6, 0.82, 1.0).mul(lum.add(0.5)), frozen.mul(0.75));
	color = mix(color, c('uFlashColor'), f('uFlash').mul(0.6));
	m.colorNode = color;
	m.roughnessNode = mix(aMat.x, float(0.15), frozen);
	m.metalnessNode = mix(aMat.y, float(0), frozen.mul(0.6));
	m.emissiveNode = base.mul(aMat.z).mul(f('uEmis'))
		.add(c('uTint').mul(f('uTintAmt')).mul(rim.mul(0.35).add(0.04)))
		.add(vec3(0.04, 0.12, 0.26).add(vec3(0.35, 0.65, 1.0).mul(rim).mul(0.9)).mul(frozen))
		.add(c('uRimColor').mul(rim).mul(f('uRim')))
		.add(base.mul(0.25).add(vec3(1.0, 0.86, 0.62).mul(rim).mul(0.85)).mul(f('uHighlight')))
		.add(c('uFlashColor').mul(f('uFlash')).mul(1.1))
		.add(c('uRimColor').mul(rim.mul(1.5).add(0.18)).mul(ghost));
	m.opacityNode = materialOpacity.mul(mix(float(1), rim.mul(0.78).add(0.22), ghost));
	return m;
}

/** Swaps a CharacterModel's material for the node version (call before adding it to the scene). */
export function useNodeMaterial(model) {
	const node = makeCharNodeMaterial(model.material);
	node.opacity = model.material.opacity;
	model.material.dispose();
	model.material = node;
	model.mesh.material = node;
}

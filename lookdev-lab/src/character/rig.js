// Rig discovery for arbitrary characters: hands (weapon slots), feet (foot-plant checks), hips, head.
// Works on the original node names (GLTFLoader keeps them in userData.name; three's own names drop
// '.' ':' '/' '[' ']'), so "hand.r", "Hand_R", "mixamorig:RightHand", "b_RightHand_08" all resolve.
import * as THREE from 'three';

export const originalName = (o) => (o.userData?.name || o.name || '').toString();

/** 'left' | 'right' | null from tokens such as .L _R -r Left Right (letters glued to words are ignored). */
export function sideOf(name) {
	const n = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
	if (/left/.test(n) || /(^|[^a-z0-9])l(\d*)([^a-z]|$)/.test(n)) return 'left';
	if (/right/.test(n) || /(^|[^a-z0-9])r(\d*)([^a-z]|$)/.test(n)) return 'right';
	return null;
}

const FINGERS = /thumb|index|middle|ring|pinky|little|finger|digit|metacarpal/;
const IK = /(^|[^a-z])ik([^a-z]|$)|ik-|-ik|pole|target|control|ctrl/;

// Priority lists: the first pattern that matches a bone on the requested side wins.
const PARTS = {
	slot: [/handslot|hand[^a-z]*slot|weapon[^a-z]*(slot|socket)|grip|prop/],
	hand: [/(^|[^a-z])hand($|[^a-z])|hand(?!le)/, /palm/, /wrist/, /fore[^a-z]*arm|lower[^a-z]*arm/],
	foot: [/foot|ankle/, /toe/],
	toe: [/toe|ball/],
	hips: [/hips?$|hips|pelvis/],
	head: [/head(?!.*(top|end|nub))/],
};

/** Every bone (and bone-like joint node) under `root`. */
export function bonesOf(root) {
	const bones = [];
	root.traverse((o) => {
		if (o.isBone) bones.push(o);
	});
	if (!bones.length) {
		// Some exporters keep joints as plain nodes: use the skinned meshes' skeletons.
		root.traverse((o) => o.isSkinnedMesh && o.skeleton && bones.push(...o.skeleton.bones));
	}
	return [...new Set(bones)];
}

export function findBone(root, part, side = null, bones = bonesOf(root)) {
	for (const pattern of PARTS[part]) {
		const match = bones.find((b) => {
			const name = originalName(b).toLowerCase();
			if (FINGERS.test(name) || IK.test(name)) return false;
			if (!pattern.test(name)) return false;
			return side === null || sideOf(originalName(b)) === side;
		});
		if (match) return match;
	}
	return null;
}

/** Hand bones + weapon slots; slot falls back to the hand bone. */
export function describeRig(root) {
	const bones = bonesOf(root);
	const rig = { bones, hips: findBone(root, 'hips', null, bones), head: findBone(root, 'head', null, bones) };
	for (const side of ['left', 'right']) {
		const hand = findBone(root, 'hand', side, bones);
		const slot = findBone(root, 'slot', side, bones);
		rig[side] = {
			hand,
			slot: slot || hand,
			foot: findBone(root, 'foot', side, bones),
			toe: findBone(root, 'toe', side, bones),
		};
	}
	return rig;
}

/** Meshes parented (directly) under a bone: built-in weapons / shields of packs such as KayKit. */
export function attachedItems(bone) {
	if (!bone) return [];
	return bone.children.filter((c) => (c.isMesh || c.isGroup || c.type === 'Object3D') && !c.isBone && !c.userData.labItem);
}

const _box = new THREE.Box3();
const _v = new THREE.Vector3();

/** World-space height of the posed character (skinned vertices included), feet to top of head. */
export function measureHeight(model) {
	model.updateMatrixWorld(true);
	_box.makeEmpty();
	model.traverse((o) => {
		if (!o.isMesh || !o.visible || o.userData.labItem) return;
		if (isHeldItem(o)) return;
		if (o.isSkinnedMesh) {
			o.computeBoundingBox();
			_box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
		} else {
			o.geometry.computeBoundingBox?.();
			if (o.geometry.boundingBox) _box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
		}
	});
	return _box.isEmpty() ? 0 : _box.getSize(_v).y;
}

/** Meshes that hang under a hand bone are props, not part of the body height. */
export function isHeldItem(object) {
	for (let p = object.parent; p; p = p.parent) {
		if (!p.isBone) continue;
		const name = originalName(p).toLowerCase();
		return /hand|slot|palm|wrist|grip/.test(name) && !FINGERS.test(name);
	}
	return false;
}

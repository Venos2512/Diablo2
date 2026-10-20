// Diablo-style "see-through" circle: while the character is played, scene geometry between the camera
// and the character is dithered out around it (walls, pillars, tree tops), so it never disappears
// behind the Act I architecture. The patch is applied once per scene material and switched with a
// uniform afterwards (no recompiles while playing).
import * as THREE from 'three';

const _v = new THREE.Vector3();

export class Cutaway {
	constructor(app) {
		this.app = app;
		this.instance = null;
		this.patchedScenes = new WeakSet();
		this.size = 0.8; // circle radius ~ this x character height on screen
	}

	ensure() {
		this.instance ??= this.app.backend.effects.createCutaway?.() || null;
		return this.instance;
	}

	/** Patch the static, lit materials of `scene` (skips the character, VFX, dummies and helpers). */
	prepareScene(scene, exclude) {
		if (!this.ensure() || this.patchedScenes.has(scene)) return;
		const app = this.app;
		const views = app.views;
		const meshes = [];
		scene.traverse((o) => {
			if (!o.isMesh || (o.isInstancedMesh && !o.userData.labSolid) || o.isSkinnedMesh || o.userData.labNoView || o.userData.labNoPick) return; // instanced trees: solid
			for (let p = o; p; p = p.parent) if (exclude(p) || p.userData?.dummy) return;
			meshes.push(o);
		});
		const inst = this.instance;
		for (const mesh of meshes) {
			const base = views.baseMaterial(mesh);
			const next = Array.isArray(base) ? base.map((m) => inst.apply(m)) : inst.apply(base);
			const changed = Array.isArray(base) ? next.some((m, i) => m !== base[i]) : next !== base;
			if (changed) views.setBaseMaterial(mesh, next);
		}
		app.backend.prepareObject(scene);
		this.patchedScenes.add(scene);
	}

	/** Per frame: character chest (world), feet height and height (m); off when `on` is false. */
	update(camera, chest, feetY, height, on) {
		const u = this.instance?.uniforms;
		if (!u) return;
		u.on.value = on ? 1 : 0;
		if (!on) return;
		_v.copy(chest).applyMatrix4(camera.matrixWorldInverse);
		const depth = Math.max(0.05, -_v.z);
		const ortho = camera.isOrthographicCamera;
		u.center.value.set(ortho ? _v.x : _v.x / depth, ortho ? _v.y : _v.y / depth, depth);
		u.radius.value = (ortho ? height : height / depth) * this.size;
		u.feet.value = feetY;
	}
}

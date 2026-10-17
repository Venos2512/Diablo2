// Scale reference lineup for the Character tab: neutral stand-ins (human, small / large monster, boss,
// door, tree) and a metre ruler next to the character, each labelled with its height, so the game's
// scale standard (character vs monster vs door vs tree) can be judged in the real scene and camera.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const MARKERS = {
	ruler: { label: 'Ruler', height: 3 },
	human: { label: 'Human', height: 1.8 },
	small: { label: 'Small monster', height: 1.1 },
	large: { label: 'Large monster', height: 2.6 },
	boss: { label: 'Boss', height: 3.8 },
	door: { label: 'Door', height: 2.4 },
	tree: { label: 'Tree', height: 6 },
};

const place = (g, x, y, z, rx = 0, ry = 0, rz = 0) => {
	g.rotateX(rx).rotateY(ry).rotateZ(rz);
	g.translate(x, y, z);
	return g;
};

/** Unit-height silhouettes (1 m tall), scaled to the marker height at placement. */
function unitGeometry(kind) {
	if (kind === 'human' || kind === 'small' || kind === 'large' || kind === 'boss') {
		const build = { human: [0.13, 0.075, 0.1], small: [0.2, 0.11, 0.15], large: [0.2, 0.09, 0.15], boss: [0.15, 0.07, 0.12] }[kind];
		const [body, head, leg] = build;
		const parts = [
			place(new THREE.CapsuleGeometry(leg * 0.45, 0.42, 4, 10), -leg * 0.6, 0.25, 0),
			place(new THREE.CapsuleGeometry(leg * 0.45, 0.42, 4, 10), leg * 0.6, 0.25, 0),
			place(new THREE.CapsuleGeometry(body, 0.28, 6, 14), 0, 0.64, 0),
			place(new THREE.SphereGeometry(head, 16, 12), 0, 1 - head, 0),
			place(new THREE.CapsuleGeometry(body * 0.28, 0.32, 4, 8), -body * 1.35, 0.62, 0, 0, 0, 0.12),
			place(new THREE.CapsuleGeometry(body * 0.28, 0.32, 4, 8), body * 1.35, 0.62, 0, 0, 0, -0.12),
		];
		if (kind === 'small') parts.push(place(new THREE.ConeGeometry(0.035, 0.12, 8), -0.05, 0.98, 0, 0, 0, 0.5), place(new THREE.ConeGeometry(0.035, 0.12, 8), 0.05, 0.98, 0, 0, 0, -0.5));
		if (kind === 'boss') parts.push(place(new THREE.ConeGeometry(0.22, 0.5, 4), -0.2, 0.62, -0.06, 0, 0, 1.0), place(new THREE.ConeGeometry(0.22, 0.5, 4), 0.2, 0.62, -0.06, 0, 0, -1.0));
		return mergeGeometries(parts.map((g) => g.toNonIndexed()));
	}
	if (kind === 'door') {
		// 2.4 m door, 1.4 m wide (proportions kept when scaled).
		const w = 1.4 / 2.4;
		return mergeGeometries([
			place(new THREE.BoxGeometry(0.06, 1, 0.12), -w / 2, 0.5, 0),
			place(new THREE.BoxGeometry(0.06, 1, 0.12), w / 2, 0.5, 0),
			place(new THREE.BoxGeometry(w + 0.06, 0.06, 0.12), 0, 0.97, 0),
		].map((g) => g.toNonIndexed()));
	}
	if (kind === 'tree') {
		return mergeGeometries([
			place(new THREE.CylinderGeometry(0.02, 0.045, 0.75, 8), 0, 0.375, 0),
			place(new THREE.CylinderGeometry(0.008, 0.018, 0.32, 6), -0.08, 0.72, 0, 0, 0, 0.75),
			place(new THREE.CylinderGeometry(0.008, 0.016, 0.3, 6), 0.09, 0.8, 0, 0, 0, -0.65),
			place(new THREE.CylinderGeometry(0.006, 0.014, 0.25, 6), 0.02, 0.9, 0.04, 0.4, 0, -0.2),
		].map((g) => g.toNonIndexed()));
	}
	return null;
}

function rulerGeometry(height) {
	const parts = [place(new THREE.BoxGeometry(0.04, height, 0.04), 0, height / 2, 0)];
	for (let i = 1; i <= Math.round(height * 10); i++) {
		const y = i / 10;
		const major = i % 10 === 0;
		const half = i % 5 === 0;
		const w = major ? 0.22 : half ? 0.14 : 0.08;
		parts.push(place(new THREE.BoxGeometry(w, major ? 0.012 : 0.006, 0.05), w / 2, y, 0));
	}
	return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

export class ScaleReference {
	constructor(app) {
		this.app = app;
		this.group = new THREE.Group();
		this.group.name = 'Scale reference';
		this.group.userData.labNoView = true;
		this.material = new THREE.MeshStandardMaterial({ name: 'Scale reference', color: 0x9aa3ad, roughness: 0.75, metalness: 0 });
		this.rulerMaterial = new THREE.MeshStandardMaterial({ name: 'Scale ruler', color: 0xe6c88c, roughness: 0.5, emissive: 0x2a2010 });
		this.meshes = {};
		this.labels = [];
		this.layer = document.createElement('div');
		this.layer.className = 'scale-label-layer';
		app.dom.viewport.appendChild(this.layer);
		this.layer.hidden = true;
		this.characterLabel = this.makeLabel('character');
		this.characterHeight = 0;
	}

	makeLabel(kind) {
		const el = document.createElement('div');
		el.className = `scale-label ${kind}`;
		this.layer.appendChild(el);
		return { el, kind, position: new THREE.Vector3() };
	}

	/**
	 * Build the lineup beside `origin` (Vector3, ground) along `side` (unit Vector3), using `heights`
	 * (marker -> metres, 0 hides) and `groundAt(x, z, y)`.
	 */
	build(origin, side, heights, groundAt) {
		this.clear();
		const order = ['ruler', 'human', 'small', 'large', 'boss', 'door', 'tree'];
		let offset = 1.1;
		for (const kind of order) {
			const h = heights[kind];
			if (!(h > 0)) continue;
			const width = { ruler: 0.5, human: 0.8, small: 0.9, large: 1.3, boss: 1.6, door: 1.8, tree: 2.6 }[kind] * Math.max(0.6, kind === 'ruler' ? 1 : h / MARKERS[kind].height);
			offset += width / 2;
			const p = origin.clone().addScaledVector(side, offset);
			p.y = groundAt(p.x, p.z, origin.y);
			offset += width / 2 + 0.35;
			const geometry = kind === 'ruler' ? rulerGeometry(h) : unitGeometry(kind);
			const mesh = new THREE.Mesh(geometry, kind === 'ruler' ? this.rulerMaterial : this.material);
			mesh.name = `Scale · ${MARKERS[kind].label}`;
			if (kind !== 'ruler') mesh.scale.setScalar(h);
			mesh.position.copy(p);
			mesh.rotation.y = Math.atan2(side.x, side.z) - Math.PI / 2;
			mesh.castShadow = mesh.receiveShadow = true;
			mesh.userData.labNoView = true;
			mesh.userData.labScaleRef = kind;
			this.group.add(mesh);
			this.meshes[kind] = mesh;
			const label = this.makeLabel(kind);
			label.el.innerHTML = kind === 'ruler' ? `<b>${h.toFixed(1)} m</b> ruler` : `${MARKERS[kind].label}<b>${h.toFixed(2)} m</b>`;
			label.position.copy(p).add(new THREE.Vector3(0, h + 0.18, 0));
			this.labels.push(label);
		}
		const grid = new THREE.GridHelper(Math.ceil(offset + 2) * 2, Math.ceil(offset + 2) * 2, 0x6b6250, 0x3a352c);
		// Lines have no normals; the WebGPU scene pass writes normals for GTAO, so give them "up".
		const count = grid.geometry.attributes.position.count;
		grid.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(count * 3).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
		grid.position.copy(origin).add(new THREE.Vector3(0, 0.015, 0));
		grid.material.transparent = true;
		grid.material.opacity = 0.55;
		grid.material.depthWrite = false;
		grid.userData.labNoPick = grid.userData.labNoView = grid.userData.labNoCollide = true;
		grid.name = 'Scale grid (1 m)';
		this.group.add(grid);
		this.app.current.scene.add(this.group);
		this.app.backend.prepareObject(this.group);
		this.layer.hidden = false;
	}

	setCharacter(height) {
		this.characterHeight = height;
	}

	clear() {
		for (const child of [...this.group.children]) {
			child.removeFromParent();
			child.geometry?.dispose();
			if (child.isLineSegments) child.material.dispose();
		}
		this.meshes = {};
		for (const l of this.labels) l.el.remove();
		this.labels = [];
		this.group.removeFromParent();
		this.layer.hidden = true;
	}

	get visible() {
		return !!this.group.parent;
	}

	/** Project labels; the character label follows the head. */
	update(camera, characterTop) {
		if (!this.visible) return;
		const rect = this.app.dom.viewport.getBoundingClientRect();
		const project = (label, position) => {
			const v = position.clone().project(camera);
			const visible = v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
			label.el.style.display = visible ? '' : 'none';
			label.el.style.transform = `translate(${((v.x + 1) / 2) * rect.width}px, ${((1 - v.y) / 2) * rect.height}px) translate(-50%, -100%)`;
		};
		for (const l of this.labels) project(l, l.position);
		if (characterTop && this.characterHeight > 0) {
			this.characterLabel.el.innerHTML = `Character<b>${this.characterHeight.toFixed(2)} m</b>`;
			project(this.characterLabel, characterTop);
		}
	}

	dispose() {
		this.clear();
		this.material.dispose();
		this.rulerMaterial.dispose();
		this.layer.remove();
	}
}

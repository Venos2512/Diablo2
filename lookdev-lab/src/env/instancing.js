// GPU instancing in spatial cells, for the outdoor maps' repeated meshes (grass tufts, grass cards, shrubs, kit trees).
//
// One InstancedMesh per geometry × material × cell of the xz grid — not one mesh per object (every tree its own draw)
// and not one per map. A map-wide InstancedMesh has map-wide bounds, so it is never culled: in the village the 6,900
// grass tufts were all drawn every frame for an isometric view that shows a tenth of them, and the shrubs were drawn
// in all six cube faces of the campfire's shadow. Each cell keeps its own bounds, so the camera and every shadow camera
// (the fires' cube faces, the hero light's spot, the moon) skip the cells they do not see.
//
// Instanced meshes are walk-through and outside the see-through circle unless userData.labSolid is set (trees):
// character/collision.js and character/cutaway.js then treat every instance like a mesh of its own.
import * as THREE from 'three';

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _c = new THREE.Color();

/**
 * Instanced meshes of one set split into cells. `material` is the set's (every cell's), so the scenes' material swaps
 * (wind, shadow fill, wet ground) work on the set as on one mesh — also when it has no cells (density 0).
 */
export class InstanceCells extends THREE.Group {
	constructor(name) {
		super();
		this.name = name;
		this.matrixAutoUpdate = false; // static: three would otherwise recompose this matrix and every cell's each frame
		this.setsMaterial = null;
	}

	get material() {
		return this.children[0]?.material ?? this.setsMaterial;
	}

	set material(material) {
		this.setsMaterial = material;
		for (const mesh of this.children) mesh.material = material;
	}

	/** Instances in all cells. */
	get count() {
		let n = 0;
		for (const mesh of this.children) n += mesh.count;
		return n;
	}

	dispose() {
		for (const mesh of this.children) mesh.dispose();
	}
}

/**
 * Collects instances ({ geometry, material, matrix, colour }) and builds them into cells of `cell` metres. `pad` grows
 * each cell's bounds by what the vertex shader adds (wind sway), so a swaying tip is not culled at the frustum's edge.
 */
export class InstanceBuilder {
	constructor(name, { cell = 16, pad = 0, castShadow = false, receiveShadow = true } = {}) {
		this.name = name;
		this.cell = cell;
		this.pad = pad;
		this.castShadow = castShadow;
		this.receiveShadow = receiveShadow;
		this.sets = new Map(); // geometry|material -> { geometry, material, cells: Map(cell -> { matrices: [], colors: [] }) }
	}

	add(geometry, material, matrix, color = null) {
		const key = `${geometry.uuid}|${material.uuid}`;
		let set = this.sets.get(key);
		if (!set) this.sets.set(key, (set = { geometry, material, cells: new Map() }));
		_p.setFromMatrixPosition(matrix);
		const id = `${Math.floor(_p.x / this.cell)},${Math.floor(_p.z / this.cell)}`;
		let cell = set.cells.get(id);
		if (!cell) set.cells.set(id, (cell = { matrices: [], colors: color ? [] : null }));
		cell.matrices.push(...matrix.elements);
		if (cell.colors && color) cell.colors.push(color.r, color.g, color.b);
		return this;
	}

	/** InstanceCells with one InstancedMesh per geometry × material × cell (ordered by geometry, then cell). */
	build() {
		const group = new InstanceCells(this.name);
		for (const { geometry, material, cells } of this.sets.values()) {
			for (const [id, { matrices, colors }] of cells) {
				const count = matrices.length / 16;
				const mesh = new THREE.InstancedMesh(geometry, material, count);
				mesh.instanceMatrix.array.set(matrices);
				if (colors) mesh.instanceColor = new THREE.InstancedBufferAttribute(Float32Array.from(colors), 3);
				this.finish(mesh, `${this.name} · ${geometry.name || 'cell'} ${id}`);
				group.add(mesh);
			}
		}
		return group;
	}

	finish(mesh, name) {
		mesh.name = name;
		mesh.matrixAutoUpdate = false; // identity, placed by its instance matrices
		mesh.castShadow = this.castShadow;
		mesh.receiveShadow = this.receiveShadow;
		mesh.computeBoundingSphere();
		mesh.boundingSphere.radius += this.pad;
		mesh.frustumCulled = true;
	}
}

/**
 * An InstancedMesh filled the usual way (setMatrixAt / setColorAt, count) split into cells: an InstanceCells group with
 * the source's geometry, material, shadow flags and instance colours. The source is not changed (and never drawn).
 */
export function splitIntoCells(source, { cell = 16, pad = 0, name = source.name } = {}) {
	const builder = new InstanceBuilder(name, { cell, pad, castShadow: source.castShadow, receiveShadow: source.receiveShadow });
	for (let i = 0; i < source.count; i++) {
		source.getMatrixAt(i, _m);
		if (source.instanceColor) source.getColorAt(i, _c); // getColorAt fills _c and returns nothing (r180)
		builder.add(source.geometry, source.material, _m, source.instanceColor ? _c : null);
	}
	const group = builder.build();
	group.material = source.material;
	group.userData = { ...source.userData };
	return group;
}

/**
 * Panel note of a map's instancing: instances and meshes per set (sets: [[label, root]]), static batch pieces → meshes
 * (statics: the groups StaticBatch.build returned), and the cell size (Infinity: map-wide).
 */
export function instancingHtml(sets, statics, cell) {
	const rows = sets.filter(([, root]) => root).map(([label, root]) => {
		let instances = 0;
		let meshes = 0;
		root.traverse((o) => {
			if (!o.isInstancedMesh) return;
			meshes++;
			instances += o.count;
		});
		return `<div class="wf-row"><b>${label}</b><em>${instances.toLocaleString()} instance · ${meshes} mesh</em></div>`;
	});
	const groups = Object.values(statics ?? {});
	const pieces = groups.reduce((n, g) => n + (g.userData.pieceCount ?? 0), 0);
	const meshes = groups.reduce((n, g) => n + (g.userData.meshCount ?? 0), 0);
	rows.push(`<div class="wf-row"><b>Đạo cụ tĩnh (gộp)</b><em>${pieces} mảnh → ${meshes} mesh</em></div>`);
	const size = Number.isFinite(cell) ? `ô ${cell} m; thẻ cỏ và cây ô ${cell * 2} m` : 'không chia ô: mỗi bộ một khối cả map';
	return `<div class="wf-palette"><p>Vật thể lặp lại vẽ bằng một InstancedMesh cho mỗi hình × ô (${size}); đạo cụ tĩnh gộp theo vật liệu × ô. Camera và các camera bóng đổ (6 mặt bóng của lửa, đèn hero, trăng) chỉ vẽ những ô chúng thấy.</p>${rows.join('')}</div>`;
}

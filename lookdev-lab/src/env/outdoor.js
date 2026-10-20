// Building blocks of the outdoor Act I maps (Dark Wood, Bố trí biome):
// distance fields to road / creek polylines, ribbon strips along them, two-sided blade geometry, kit loading and the
// "lowest ground under a piece" rule the kit placement uses.
import * as THREE from 'three';

export const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/** Points along a Catmull-Rom curve through [x, z] pairs, evenly spaced (y = 0). */
export function curvePoints(pairs, count = 160) {
	return new THREE.CatmullRomCurve3(pairs.map(([x, z]) => new THREE.Vector3(x, 0, z))).getSpacedPoints(count);
}

/**
 * Distance (m) to the nearest of `lines` (each a list of points), precomputed on a `cell` grid over the square
 * [-size / 2, size / 2]²; read bilinearly with fieldDistance().
 */
export function polylineField(lines, size, cell = 0.5) {
	const n = Math.round(size / cell) + 1;
	const field = new Float32Array(n * n).fill(Infinity);
	const points = lines.flat();
	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			const x = -size / 2 + i * cell;
			const z = -size / 2 + j * cell;
			let best = Infinity;
			for (const p of points) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2);
			field[j * n + i] = Math.sqrt(best);
		}
	}
	return { field, n, cell, size };
}

export function fieldDistance({ field, n, cell, size }, x, z) {
	const fx = Math.min(n - 1.001, Math.max(0, (x + size / 2) / cell));
	const fz = Math.min(n - 1.001, Math.max(0, (z + size / 2) / cell));
	const i = Math.floor(fx);
	const j = Math.floor(fz);
	const tx = fx - i;
	const tz = fz - j;
	const a = field[j * n + i] * (1 - tx) + field[j * n + i + 1] * tx;
	const b = field[(j + 1) * n + i] * (1 - tx) + field[(j + 1) * n + i + 1] * tx;
	return a * (1 - tz) + b * tz;
}

/**
 * Strip along a polyline: `across` vertices per point, u = 0..1 across, v = metres along / tile; y(x, z, centre)
 * gives each vertex height, alpha(x, z) an optional per-vertex opacity (RGBA vertex colour).
 */
export function ribbonGeometry(points, width, tile, y, across = 9, alpha = null) {
	const pos = [];
	const uv = [];
	const color = [];
	const index = [];
	let along = 0;
	points.forEach((p, k) => {
		if (k) along += p.distanceTo(points[k - 1]);
		const a = points[Math.max(0, k - 1)];
		const b = points[Math.min(points.length - 1, k + 1)];
		const dx = b.x - a.x;
		const dz = b.z - a.z;
		const len = Math.hypot(dx, dz) || 1;
		for (let j = 0; j < across; j++) {
			const t = j / (across - 1);
			const o = (t - 0.5) * width;
			const x = p.x - (dz / len) * o;
			const z = p.z + (dx / len) * o;
			pos.push(x, y(x, z, p), z);
			uv.push(t, along / tile);
			if (alpha) color.push(1, 1, 1, alpha(x, z));
			if (k && j) {
				const c = k * across + j;
				index.push(c - across - 1, c - across, c - 1, c - across, c, c - 1);
			}
		}
	});
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	if (alpha) g.setAttribute('color', new THREE.Float32BufferAttribute(color, 4));
	g.setIndex(index);
	g.computeVertexNormals();
	return g;
}

/**
 * Both faces of a blade geometry with the same (upward) normals: a DoubleSide material flips the normal of back faces
 * (down → unlit, black blades), so the back faces are real triangles here and the material stays FrontSide.
 */
export function twoSided(geometry) {
	const g = geometry.index ? geometry.toNonIndexed() : geometry;
	const out = new THREE.BufferGeometry();
	for (const [name, attr] of Object.entries(g.attributes)) {
		const n = attr.count;
		const size = attr.itemSize;
		const data = new Float32Array(n * size * 2);
		data.set(attr.array, 0);
		for (let t = 0; t < n; t += 3) {
			for (const [k, src] of [[0, t], [1, t + 2], [2, t + 1]]) data.set(attr.array.subarray(src * size, src * size + size), (n + t + k) * size);
		}
		out.setAttribute(name, new THREE.BufferAttribute(data, size));
	}
	return out;
}

/** Prop kits (GLB libraries): { key: { pieceName: mesh } }; a kit that fails to load is left out (logged). */
export async function loadKits(app, list) {
	const kits = {};
	await Promise.all(list.map(async ([key, id]) => {
		try {
			const gltf = await app.loader.loadLibrary(id);
			const pieces = {};
			gltf.scene.traverse((o) => {
				if (o.isMesh) pieces[o.name.replace(/^[a-z]+_\d+_/, '')] = o; // "storage_03_barrels" → "barrels"
			});
			for (const mesh of Object.values(pieces)) mesh.geometry.computeBoundingBox();
			kits[key] = pieces;
		} catch (error) {
			console.error(`Prop kit "${id}" failed to load; the scene goes without it`, error);
		}
	}));
	return kits;
}

/** Lowest ground under a kit piece (pivot at its bottom centre, length along +x) at x, z turned by yaw. */
export function kitGround(height, mesh, x, z, yaw, scale = 1) {
	const box = mesh.geometry.boundingBox;
	const len = ((box.max.x - box.min.x) / 2) * scale;
	return Math.min(height(x, z), height(x + Math.cos(yaw) * len, z - Math.sin(yaw) * len), height(x - Math.cos(yaw) * len, z + Math.sin(yaw) * len));
}

/** Yaw that turns a piece's +x toward the direction (dx, dz). */
export const yawAlong = (dx, dz) => Math.atan2(-dz, dx);

/** Items in a uniform grid of `cell` metres by their xz bounds: some() visits each item overlapping a box once. */
export class SpatialList {
	constructor(cell = 4) {
		this.cell = cell;
		this.cells = new Map();
		this.stamp = 0;
	}

	add(item, x0, z0, x1, z1) {
		const c = this.cell;
		for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) {
			for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) {
				const key = (i + 4096) * 8192 + (j + 4096);
				let list = this.cells.get(key);
				if (!list) this.cells.set(key, (list = []));
				list.push(item);
			}
		}
		return item;
	}

	/** True as soon as fn(item) is true for an item whose cells overlap the box. */
	some(x0, z0, x1, z1, fn) {
		const c = this.cell;
		const stamp = ++this.stamp;
		for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) {
			for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) {
				const list = this.cells.get((i + 4096) * 8192 + (j + 4096));
				if (!list) continue;
				for (const item of list) {
					if (item.stamp === stamp) continue;
					item.stamp = stamp;
					if (fn(item)) return true;
				}
			}
		}
		return false;
	}
}

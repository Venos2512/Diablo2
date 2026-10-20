// Per-vertex ground data of static assets for the ground blend (env/groundBlend.js), attribute labGround (vec2):
//  x = contact: 1 where a vertex lies on another asset's surface, 0 from the reach on — the crevice where a rock leans
//      on a rock, a trunk stands on a stone or a barrel touches a crate fills with ground. The reach is `radius`, less
//      for small pieces (half their height), so a ring of fist-sized stones is not filled over;
//  y = local relief: how high the vertex's piece rises above the ground near it (the highest point of the piece in
//      the 3 × 3 cells of RELIEF_CELL metres around the vertex). The shader keeps the soil band to a fraction of it, so
//      a pebble, a root tip or a bone lying by a carcass keeps its shape while the foot of a boulder gets the whole band.
// Assets are pieces: a merged batch keeps its pieces' vertex counts in geometry.userData.labPieces (env/kit.js
// StaticBatch), any other mesh is one piece. Pieces whose bounds stay `radius` away from every other piece get no
// contacts; the surfaces of the others are point-sampled (a point every `spacing` metres) into a hash grid of `radius`
// cells, and each of their vertices looks for the nearest point of another piece in the 27 cells around it.
import * as THREE from 'three';

const OFFSET = 4096; // cells per half axis in the integer key (±1200 m at 0.3 m cells)
const cellKey = (i, j, k) => ((i + OFFSET) * 8192 + (j + OFFSET)) * 8192 + (k + OFFSET);
const owners = new WeakMap(); // geometry copied for one mesh -> that mesh
const RELIEF_CELL = 0.25;

/** heightAt(x, z) cached on a 0.25 m lattice and read bilinearly (the scenes' height functions are noise sums). */
function groundSampler(heightAt) {
	if (!heightAt) return null;
	const k = 0.25;
	const cache = new Map();
	const at = (i, j) => {
		const key = (i + 32768) * 65536 + (j + 32768);
		let h = cache.get(key);
		if (h === undefined) cache.set(key, (h = heightAt(i * k, j * k)));
		return h;
	};
	return (x, z) => {
		const fx = x / k, fz = z / k;
		const i = Math.floor(fx), j = Math.floor(fz);
		const tx = fx - i, tz = fz - j;
		return (at(i, j) * (1 - tx) + at(i + 1, j) * tx) * (1 - tz) + (at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx) * tz;
	};
}

/**
 * Bake labGround on every mesh of `meshes` (static, world matrices final); heightAt(x, z) = ground height. A mesh that
 * is not a merged batch gets its own copy of the geometry first (kit pieces share theirs between instances and scenes).
 * query(mesh) = whether its vertices want contacts at all (a material whose crevices never fill skips the search; its
 * surface still counts for its neighbours). Returns { pieces, near, vertices (vertices in contact), points, ms }.
 */
export function bakeContacts(meshes, { radius = 0.3, spacing = radius / 4, heightAt = null, query = () => true } = {}) {
	const t0 = performance.now();
	const v = new THREE.Vector3();
	const ground = groundSampler(heightAt);
	const pieces = [];
	for (const mesh of meshes) {
		mesh.updateWorldMatrix(true, false);
		const wanted = query(mesh);
		const geometry = mesh.geometry;
		const pos = geometry.attributes.position;
		const world = new Float32Array(pos.count * 3);
		for (let i = 0; i < pos.count; i++) {
			v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
			world[i * 3] = v.x;
			world[i * 3 + 1] = v.y;
			world[i * 3 + 2] = v.z;
		}
		const counts = !geometry.index && geometry.userData.labPieces ? geometry.userData.labPieces : [pos.count];
		let start = 0;
		for (const count of counts) {
			const min = [Infinity, Infinity, Infinity];
			const max = [-Infinity, -Infinity, -Infinity];
			for (let i = start; i < start + count; i++) {
				for (let k = 0; k < 3; k++) {
					const c = world[i * 3 + k];
					if (c < min[k]) min[k] = c;
					if (c > max[k]) max[k] = c;
				}
			}
			const size = Math.max(0.02, max[1] - (ground ? ground((min[0] + max[0]) / 2, (min[2] + max[2]) / 2) : min[1]));
			pieces.push({ mesh, world, index: geometry.index, start, count, min, max, reach: Math.min(radius, size * 0.5), near: false, wanted });
			start += count;
		}
	}

	// Pieces within `radius` of another piece where at least one of the two wants contacts (sweep along x).
	const order = pieces.map((_, i) => i).sort((a, b) => pieces[a].min[0] - pieces[b].min[0]);
	for (let a = 0; a < order.length; a++) {
		const p = pieces[order[a]];
		for (let b = a + 1; b < order.length; b++) {
			const q = pieces[order[b]];
			if (q.min[0] > p.max[0] + radius) break;
			if (!p.wanted && !q.wanted) continue;
			if (q.min[1] > p.max[1] + radius || p.min[1] > q.max[1] + radius || q.min[2] > p.max[2] + radius || p.min[2] > q.max[2] + radius) continue;
			p.near = q.near = true;
		}
	}

	// Surface points of those pieces: their vertices plus random points inside each triangle, `spacing` apart on average.
	const grid = new Map(); // cell -> [piece, x, y, z, piece, x, y, z, …]
	let points = 0;
	const push = (id, x, y, z) => {
		const key = cellKey(Math.floor(x / radius), Math.floor(y / radius), Math.floor(z / radius));
		let list = grid.get(key);
		if (!list) grid.set(key, (list = []));
		list.push(id, x, y, z);
		points++;
	};
	let seed = 0x9e3779b9;
	const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
	const area2 = spacing * spacing * 2;
	pieces.forEach((p, id) => {
		if (!p.near) return;
		const w = p.world;
		for (let i = p.start; i < p.start + p.count; i++) push(id, w[i * 3], w[i * 3 + 1], w[i * 3 + 2]);
		const tris = p.index ? p.index.count / 3 : p.count / 3;
		for (let t = 0; t < tris; t++) {
			const a = (p.index ? p.index.getX(t * 3) : p.start + t * 3) * 3;
			const b = (p.index ? p.index.getX(t * 3 + 1) : p.start + t * 3 + 1) * 3;
			const c = (p.index ? p.index.getX(t * 3 + 2) : p.start + t * 3 + 2) * 3;
			const ux = w[b] - w[a], uy = w[b + 1] - w[a + 1], uz = w[b + 2] - w[a + 2];
			const vx = w[c] - w[a], vy = w[c + 1] - w[a + 1], vz = w[c + 2] - w[a + 2];
			const cross = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx); // twice the area
			const n = Math.min(512, Math.floor(cross / area2));
			for (let s = 0; s < n; s++) {
				let r1 = rand();
				let r2 = rand();
				if (r1 + r2 > 1) {
					r1 = 1 - r1;
					r2 = 1 - r2;
				}
				push(id, w[a] + ux * r1 + vx * r2, w[a + 1] + uy * r1 + vy * r2, w[a + 2] + uz * r1 + vz * r2);
			}
		}
	});

	// Per vertex: the local relief of its piece, and the nearest point of another piece (near pieces only).
	const out = new Map(); // mesh -> Float32Array (contact, relief per vertex)
	let vertices = 0;
	pieces.forEach((p, id) => {
		let values = out.get(p.mesh);
		if (!values) out.set(p.mesh, (values = new Float32Array(p.mesh.geometry.attributes.position.count * 2)));
		const w = p.world;
		const top = new Map(); // relief cell -> highest lift of the piece in it
		const cellOf = (i) => (Math.floor(w[i * 3] / RELIEF_CELL) + 32768) * 65536 + (Math.floor(w[i * 3 + 2] / RELIEF_CELL) + 32768);
		for (let i = p.start; i < p.start + p.count; i++) {
			const lift = w[i * 3 + 1] - (ground ? ground(w[i * 3], w[i * 3 + 2]) : p.min[1]);
			const key = cellOf(i);
			if (!(top.get(key) >= lift)) top.set(key, lift);
		}
		for (let i = p.start; i < p.start + p.count; i++) {
			const key = cellOf(i);
			let relief = 0.02;
			for (let di = -1; di <= 1; di++) for (let dk = -1; dk <= 1; dk++) relief = Math.max(relief, top.get(key + di * 65536 + dk) ?? 0);
			values[i * 2 + 1] = relief;
		}
		if (!p.near || !p.wanted) return;
		const r2 = p.reach * p.reach;
		for (let i = p.start; i < p.start + p.count; i++) {
			const x = w[i * 3], y = w[i * 3 + 1], z = w[i * 3 + 2];
			const ci = Math.floor(x / radius), cj = Math.floor(y / radius), ck = Math.floor(z / radius);
			let best = r2;
			for (let di = -1; di <= 1; di++) {
				for (let dj = -1; dj <= 1; dj++) {
					for (let dk = -1; dk <= 1; dk++) {
						const list = grid.get(cellKey(ci + di, cj + dj, ck + dk));
						if (!list) continue;
						for (let k = 0; k < list.length; k += 4) {
							if (list[k] === id) continue;
							const dx = list[k + 1] - x, dy = list[k + 2] - y, dz = list[k + 3] - z;
							const d2 = dx * dx + dy * dy + dz * dz;
							if (d2 < best) best = d2;
						}
					}
				}
			}
			if (best < r2) {
				values[i * 2] = 1 - Math.sqrt(best) / p.reach;
				vertices++;
			}
		}
	});

	for (const mesh of meshes) {
		if (!mesh.geometry.userData.labPieces && owners.get(mesh.geometry) !== mesh) {
			mesh.geometry = mesh.geometry.clone();
			mesh.geometry.userData = { ...mesh.geometry.userData }; // clone() shares the userData object
			owners.set(mesh.geometry, mesh);
		}
		const values = out.get(mesh);
		const attribute = mesh.geometry.attributes.labGround;
		if (!attribute) mesh.geometry.setAttribute('labGround', new THREE.BufferAttribute(values, 2));
		else {
			attribute.array.set(values); // a rebake rewrites in place
			attribute.needsUpdate = true;
		}
	}
	return { pieces: pieces.length, near: pieces.filter((p) => p.near).length, vertices, points, ms: performance.now() - t0 };
}

/**
 * labGround of a geometry drawn instanced (the kit trees in cells, env/instancing.js): the instances share it, so there
 * are no contacts (they are per placement) and the relief is measured in the geometry's own space, over flat ground at
 * its lowest point — what bakeContacts finds for an upright piece on level ground. Kept once set.
 */
export function instancedGround(geometry) {
	if (geometry.attributes.labGround) return;
	const pos = geometry.attributes.position;
	geometry.computeBoundingBox();
	const floor = geometry.boundingBox.min.y;
	const cellOf = (i) => (Math.floor(pos.getX(i) / RELIEF_CELL) + 32768) * 65536 + (Math.floor(pos.getZ(i) / RELIEF_CELL) + 32768);
	const top = new Map();
	for (let i = 0; i < pos.count; i++) {
		const key = cellOf(i);
		const lift = pos.getY(i) - floor;
		if (!(top.get(key) >= lift)) top.set(key, lift);
	}
	const values = new Float32Array(pos.count * 2);
	for (let i = 0; i < pos.count; i++) {
		const key = cellOf(i);
		let relief = 0.02;
		for (let di = -1; di <= 1; di++) for (let dk = -1; dk <= 1; dk++) relief = Math.max(relief, top.get(key + di * 65536 + dk) ?? 0);
		values[i * 2 + 1] = relief;
	}
	geometry.setAttribute('labGround', new THREE.BufferAttribute(values, 2));
}

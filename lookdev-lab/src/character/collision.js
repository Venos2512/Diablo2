// Walk collision for the character controller: the static triangles of the current scene bucketed into
// a 2D grid (XZ), so ground height, wall push-out and mouse picking only test the few triangles near
// the query instead of whole merged meshes (Act I batches are tens of thousands of triangles).
import * as THREE from 'three';

const CELL = 1.0;
const FLOOR = 0.6; // normal.y above this: walkable
const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _inst = new THREE.Matrix4();
const _world = new THREE.Matrix4();

export class CollisionWorld {
	/**
	 * @param {THREE.Object3D} scene
	 * @param {(o: THREE.Object3D) => boolean} exclude - dynamic things (character, dummies, VFX stage)
	 */
	constructor(scene, exclude = () => false) {
		this.cells = new Map();
		const positions = [];
		const kinds = []; // 1 floor, 2 wall
		const skipTree = (o) => {
			for (let p = o; p; p = p.parent) if (exclude(p) || p.userData?.labNoCollide) return true;
			return false;
		};
		scene.updateMatrixWorld(true);
		scene.traverse((o) => {
			if (!o.isMesh || o.isSkinnedMesh || o.isBatchedMesh || !o.visible) return;
			if (o.isInstancedMesh && !o.userData.labSolid) return; // grass, cards, shrubs: walk-through (instanced trees are solid)
			if (o.userData.labNoPick || o.userData.labProbe || o.userData.dummy) return;
			const material = Array.isArray(o.material) ? o.material[0] : o.material;
			if (material?.side === THREE.BackSide) return; // sky domes, interiors seen from outside
			if (material?.transparent && material.opacity < 0.2) return;
			const g = o.geometry;
			if (!g?.attributes.position) return;
			g.computeBoundingSphere();
			if (g.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis() > 400) return; // backdrops
			if (skipTree(o)) return;
			const pos = g.attributes.position;
			const index = g.index;
			const count = index ? index.count : pos.count;
			for (let k = 0, instances = o.isInstancedMesh ? o.count : 1; k < instances; k++) {
				let m = o.matrixWorld;
				if (o.isInstancedMesh) {
					o.getMatrixAt(k, _inst);
					m = _world.multiplyMatrices(o.matrixWorld, _inst);
				}
				for (let i = 0; i + 2 < count; i += 3) {
					const ia = index ? index.getX(i) : i;
					const ib = index ? index.getX(i + 1) : i + 1;
					const ic = index ? index.getX(i + 2) : i + 2;
					_a.fromBufferAttribute(pos, ia).applyMatrix4(m);
					_b.fromBufferAttribute(pos, ib).applyMatrix4(m);
					_c.fromBufferAttribute(pos, ic).applyMatrix4(m);
					_e1.subVectors(_b, _a);
					_e2.subVectors(_c, _a);
					_n.crossVectors(_e1, _e2);
					const area = _n.length();
					if (area < 1e-8) continue;
					_n.divideScalar(area);
					const ny = Math.abs(_n.y);
					// Double-sided thinking: a floor seen from below is a ceiling — ignore real ceilings only.
					const kind = _n.y > FLOOR || (ny > FLOOR && material?.side === THREE.DoubleSide) ? 1 : ny <= FLOOR ? 2 : 0;
					if (!kind) continue;
					positions.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z, _c.x, _c.y, _c.z);
					kinds.push(kind);
				}
			}
		});
		this.tri = new Float32Array(positions);
		this.kind = new Uint8Array(kinds);
		this.count = kinds.length;
		for (let t = 0; t < this.count; t++) {
			const o = t * 9;
			const x0 = Math.min(this.tri[o], this.tri[o + 3], this.tri[o + 6]);
			const x1 = Math.max(this.tri[o], this.tri[o + 3], this.tri[o + 6]);
			const z0 = Math.min(this.tri[o + 2], this.tri[o + 5], this.tri[o + 8]);
			const z1 = Math.max(this.tri[o + 2], this.tri[o + 5], this.tri[o + 8]);
			const cx0 = Math.floor(x0 / CELL);
			const cx1 = Math.floor(x1 / CELL);
			const cz0 = Math.floor(z0 / CELL);
			const cz1 = Math.floor(z1 / CELL);
			if ((cx1 - cx0 + 1) * (cz1 - cz0 + 1) > 4096) continue; // enormous ground planes: handled below
			for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) this.cellList(cx, cz, true).push(t);
		}
		// Huge triangles (studio floor, terrain skirts) are kept in a short global list.
		this.large = [];
		for (let t = 0; t < this.count; t++) {
			const o = t * 9;
			const w = Math.max(this.tri[o], this.tri[o + 3], this.tri[o + 6]) - Math.min(this.tri[o], this.tri[o + 3], this.tri[o + 6]);
			const d = Math.max(this.tri[o + 2], this.tri[o + 5], this.tri[o + 8]) - Math.min(this.tri[o + 2], this.tri[o + 5], this.tri[o + 8]);
			if ((Math.floor(w / CELL) + 1) * (Math.floor(d / CELL) + 1) > 4096) this.large.push(t);
		}
		this.stamp = new Uint32Array(this.count);
		this.query = 0;
	}

	cellList(cx, cz, create = false) {
		const key = cx * 73856093 ^ cz * 19349663;
		let list = this.cells.get(key);
		if (!list && create) {
			list = [];
			this.cells.set(key, list);
		}
		return list;
	}

	/** Visit each triangle near (x, z) within `r` once. */
	forEachNear(x, z, r, fn) {
		const q = ++this.query;
		const cx0 = Math.floor((x - r) / CELL);
		const cx1 = Math.floor((x + r) / CELL);
		const cz0 = Math.floor((z - r) / CELL);
		const cz1 = Math.floor((z + r) / CELL);
		for (let cx = cx0; cx <= cx1; cx++) {
			for (let cz = cz0; cz <= cz1; cz++) {
				const list = this.cellList(cx, cz);
				if (!list) continue;
				for (const t of list) {
					if (this.stamp[t] === q) continue;
					this.stamp[t] = q;
					if (fn(t) === false) return;
				}
			}
		}
		for (const t of this.large) {
			if (this.stamp[t] === q) continue;
			this.stamp[t] = q;
			if (fn(t) === false) return;
		}
	}

	/** Highest walkable surface under (x, z) that is not above `maxY` (current height + step). */
	groundHeight(x, z, maxY) {
		let best = null;
		const T = this.tri;
		this.forEachNear(x, z, 0, (t) => {
			if (this.kind[t] !== 1) return;
			const o = t * 9;
			const y = heightOnTriangle(x, z, T[o], T[o + 1], T[o + 2], T[o + 3], T[o + 4], T[o + 5], T[o + 6], T[o + 7], T[o + 8]);
			if (y === null || y > maxY) return;
			if (best === null || y > best) best = y;
		});
		return best;
	}

	/**
	 * Push a circle (x, z, radius) out of wall triangles that overlap the height band [y0, y1].
	 * Returns the corrected position in `out` (Vector3, y untouched) and whether anything was hit.
	 */
	pushOut(x, z, radius, y0, y1, out) {
		let px = x;
		let pz = z;
		let hit = false;
		const T = this.tri;
		for (let iteration = 0; iteration < 3; iteration++) {
			let moved = false;
			this.forEachNear(px, pz, radius, (t) => {
				if (this.kind[t] !== 2) return;
				const o = t * 9;
				const ty0 = Math.min(T[o + 1], T[o + 4], T[o + 7]);
				const ty1 = Math.max(T[o + 1], T[o + 4], T[o + 7]);
				if (ty1 < y0 || ty0 > y1) return;
				// Closest point of the triangle's footprint (2D) to the circle centre.
				closestOnTriangle2D(px, pz, T[o], T[o + 2], T[o + 3], T[o + 5], T[o + 6], T[o + 8], _p);
				let dx = px - _p.x;
				let dz = pz - _p.y;
				const d = Math.hypot(dx, dz);
				if (d >= radius) return;
				if (d < 1e-6) {
					// Centre on the wall line: push along the wall normal.
					_e1.set(T[o + 3] - T[o], T[o + 4] - T[o + 1], T[o + 5] - T[o + 2]);
					_e2.set(T[o + 6] - T[o], T[o + 7] - T[o + 1], T[o + 8] - T[o + 2]);
					_n.crossVectors(_e1, _e2).setY(0);
					if (_n.lengthSq() < 1e-10) return;
					_n.normalize();
					dx = _n.x;
					dz = _n.z;
					px += dx * radius;
					pz += dz * radius;
				} else {
					px += (dx / d) * (radius - d);
					pz += (dz / d) * (radius - d);
				}
				moved = hit = true;
			});
			if (!moved) break;
		}
		out.x = px;
		out.z = pz;
		return hit;
	}

	/** First hit of a ray (picking): walks the grid cells along the ray. */
	raycast(origin, direction, far = 200) {
		const T = this.tri;
		let best = null;
		let bestT = far;
		const test = (t) => {
			const o = t * 9;
			_a.set(T[o], T[o + 1], T[o + 2]);
			_b.set(T[o + 3], T[o + 4], T[o + 5]);
			_c.set(T[o + 6], T[o + 7], T[o + 8]);
			const d = rayTriangle(origin, direction, _a, _b, _c);
			if (d !== null && d < bestT) {
				bestT = d;
				best = t;
			}
		};
		// Sample the ray every half cell (cheap DDA) and test the triangles of the cells it crosses.
		const q = ++this.query;
		const step = CELL * 0.5;
		for (let s = 0; s <= far && s <= bestT + CELL; s += step) {
			const x = origin.x + direction.x * s;
			const z = origin.z + direction.z * s;
			const list = this.cellList(Math.floor(x / CELL), Math.floor(z / CELL));
			if (list) {
				for (const t of list) {
					if (this.stamp[t] === q) continue;
					this.stamp[t] = q;
					test(t);
				}
			}
		}
		for (const t of this.large) test(t);
		if (best === null) return null;
		const o = best * 9;
		_e1.set(T[o + 3] - T[o], T[o + 4] - T[o + 1], T[o + 5] - T[o + 2]);
		_e2.set(T[o + 6] - T[o], T[o + 7] - T[o + 1], T[o + 8] - T[o + 2]);
		const normal = new THREE.Vector3().crossVectors(_e1, _e2).normalize();
		if (normal.dot(direction) > 0) normal.negate();
		return { distance: bestT, point: origin.clone().addScaledVector(direction, bestT), normal, walkable: this.kind[best] === 1 };
	}
}

function heightOnTriangle(x, z, ax, ay, az, bx, by, bz, cx, cy, cz) {
	const v0x = cx - ax;
	const v0z = cz - az;
	const v1x = bx - ax;
	const v1z = bz - az;
	const v2x = x - ax;
	const v2z = z - az;
	const d00 = v0x * v0x + v0z * v0z;
	const d01 = v0x * v1x + v0z * v1z;
	const d02 = v0x * v2x + v0z * v2z;
	const d11 = v1x * v1x + v1z * v1z;
	const d12 = v1x * v2x + v1z * v2z;
	const den = d00 * d11 - d01 * d01;
	if (Math.abs(den) < 1e-12) return null;
	const u = (d11 * d02 - d01 * d12) / den;
	const v = (d00 * d12 - d01 * d02) / den;
	if (u < -1e-5 || v < -1e-5 || u + v > 1 + 1e-5) return null;
	return ay + u * (cy - ay) + v * (by - ay);
}

/**
 * Closest point (x, z) -> out.x / out.y on triangle a b c in 2D. Walls are vertical, so their footprint
 * is usually a zero-area triangle (a segment): handle that without dividing by the area.
 */
function closestOnTriangle2D(px, pz, ax, az, bx, bz, cx, cz, out) {
	const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax);
	if (Math.abs(area) > 1e-9) {
		const w0 = (bx - px) * (cz - pz) - (bz - pz) * (cx - px);
		const w1 = (cx - px) * (az - pz) - (cz - pz) * (ax - px);
		const w2 = (ax - px) * (bz - pz) - (az - pz) * (bx - px);
		const inside = area > 0 ? w0 >= 0 && w1 >= 0 && w2 >= 0 : w0 <= 0 && w1 <= 0 && w2 <= 0;
		if (inside) return out.set(px, pz, 0);
	}
	let best = Infinity;
	let bx2 = ax;
	let bz2 = az;
	const edge = (x0, z0, x1, z1) => {
		const dx = x1 - x0;
		const dz = z1 - z0;
		const len = dx * dx + dz * dz;
		const t = len > 1e-12 ? Math.min(1, Math.max(0, ((px - x0) * dx + (pz - z0) * dz) / len)) : 0;
		const qx = x0 + dx * t;
		const qz = z0 + dz * t;
		const d = (px - qx) * (px - qx) + (pz - qz) * (pz - qz);
		if (d < best) {
			best = d;
			bx2 = qx;
			bz2 = qz;
		}
	};
	edge(ax, az, bx, bz);
	edge(bx, bz, cx, cz);
	edge(cx, cz, ax, az);
	return out.set(bx2, bz2, 0);
}

/** Möller–Trumbore, both faces. */
function rayTriangle(o, d, a, b, c) {
	const e1x = b.x - a.x, e1y = b.y - a.y, e1z = b.z - a.z;
	const e2x = c.x - a.x, e2y = c.y - a.y, e2z = c.z - a.z;
	const px = d.y * e2z - d.z * e2y, py = d.z * e2x - d.x * e2z, pz = d.x * e2y - d.y * e2x;
	const det = e1x * px + e1y * py + e1z * pz;
	if (Math.abs(det) < 1e-10) return null;
	const inv = 1 / det;
	const tx = o.x - a.x, ty = o.y - a.y, tz = o.z - a.z;
	const u = (tx * px + ty * py + tz * pz) * inv;
	if (u < 0 || u > 1) return null;
	const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
	const v = (d.x * qx + d.y * qy + d.z * qz) * inv;
	if (v < 0 || u + v > 1) return null;
	const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
	return t > 1e-4 ? t : null;
}

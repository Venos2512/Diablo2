// Procedural Act I kit: modular walls, gothic arches, pillars, graves, rocks, dead trees, torches,
// grass blades. Builders return BufferGeometry in local space (y = 0 at the base). StaticBatch bakes
// transforms + world-space UVs (metres) so neighbouring modules tile seamlessly, then optionally merges
// everything that shares a material into one draw call.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';

const perlin = new ImprovedNoise();
export const noise2 = (x, y, seed = 0) => perlin.noise(x, y, seed * 7.31 + 0.5);

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Box-projected UVs from the (already placed) positions: 1 UV unit = 1 metre. */
export function worldUV(geometry) {
	if (!geometry.attributes.normal) geometry.computeVertexNormals();
	const pos = geometry.attributes.position;
	const nor = geometry.attributes.normal;
	const uv = new Float32Array(pos.count * 2);
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const y = pos.getY(i);
		const z = pos.getZ(i);
		const nx = Math.abs(nor.getX(i));
		const ny = Math.abs(nor.getY(i));
		const nz = Math.abs(nor.getZ(i));
		let u;
		let v;
		if (ny >= nx && ny >= nz) {
			u = x;
			v = z;
		} else if (nx >= nz) {
			u = z;
			v = y;
		} else {
			u = x;
			v = y;
		}
		uv[i * 2] = u;
		uv[i * 2 + 1] = v;
	}
	geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
	return geometry;
}

// ---------------------------------------------------------------------------------------------
// Architecture

/** Straight wall module; `jag` lowers the top edge with noise for ruined walls. */
export function wallPanel({ length = 3, height = 4, thickness = 0.7, jag = 0, seed = 0 } = {}) {
	const segs = Math.max(1, Math.round(length * 3));
	const g = new THREE.BoxGeometry(length, height, thickness, segs, 1, 1);
	g.translate(0, height / 2, 0);
	if (jag > 0) {
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			if (pos.getY(i) > height - 1e-4) {
				const x = pos.getX(i);
				const drop = (noise2(x * 0.9, 0.5, seed) * 0.5 + 0.5) * jag + Math.abs(noise2(x * 3.1, 2.5, seed)) * jag * 0.35;
				pos.setY(i, height - drop);
			}
		}
		g.computeVertexNormals();
	}
	return g;
}

/** Points along an equilateral gothic arch opening (bottom-left -> apex -> bottom-right). */
function gothicOpening(width, height, sill, segments = 10) {
	const r = width;
	const rise = width * 0.866;
	const spring = sill + Math.max(height - rise, 0.1);
	const pts = [new THREE.Vector2(-width / 2, sill), new THREE.Vector2(-width / 2, spring)];
	for (let i = 1; i <= segments; i++) {
		const a = Math.PI - (Math.PI / 3) * (i / segments);
		pts.push(new THREE.Vector2(width / 2 + Math.cos(a) * r, spring + Math.sin(a) * r));
	}
	for (let i = 1; i <= segments; i++) {
		const a = Math.PI / 3 - (Math.PI / 3) * (i / segments);
		pts.push(new THREE.Vector2(-width / 2 + Math.cos(a) * r, spring + Math.sin(a) * r));
	}
	pts.push(new THREE.Vector2(width / 2, sill));
	return pts;
}

/** Wall module with a pointed-arch window (sill > 0) or doorway (sill = 0). */
export function archPanel({ length = 3, height = 4, thickness = 0.7, openingWidth = 1.2, openingHeight = 2.6, sill = 0.9 } = {}) {
	const w = length / 2;
	const opening = gothicOpening(openingWidth, openingHeight, sill);
	let shape;
	if (sill <= 0.001) {
		shape = new THREE.Shape();
		shape.moveTo(-w, 0);
		for (const p of opening) shape.lineTo(p.x, p.y);
		shape.lineTo(w, 0);
		shape.lineTo(w, height);
		shape.lineTo(-w, height);
		shape.closePath();
	} else {
		shape = new THREE.Shape([new THREE.Vector2(-w, 0), new THREE.Vector2(w, 0), new THREE.Vector2(w, height), new THREE.Vector2(-w, height)]);
		shape.holes.push(new THREE.Path(opening.slice().reverse()));
	}
	const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 12 });
	g.translate(0, 0, -thickness / 2);
	return g;
}

/** Square pillar with plinth and capital. */
export function pillar({ height = 4.2, size = 0.6 } = {}) {
	const parts = [];
	const base = new THREE.BoxGeometry(size * 1.35, 0.35, size * 1.35);
	base.translate(0, 0.175, 0);
	const shaft = new THREE.BoxGeometry(size, height - 0.75, size);
	shaft.translate(0, 0.35 + (height - 0.75) / 2, 0);
	const capital = new THREE.BoxGeometry(size * 1.3, 0.4, size * 1.3);
	capital.translate(0, height - 0.2, 0);
	parts.push(base, shaft, capital);
	return mergeGeometries(parts.map((p) => p.toNonIndexed()));
}

/** Octagonal column (interiors). */
export function column({ height = 4, radius = 0.3 } = {}) {
	const shaft = new THREE.CylinderGeometry(radius, radius * 1.08, height - 0.6, 8, 1);
	shaft.translate(0, 0.3 + (height - 0.6) / 2, 0);
	const base = new THREE.CylinderGeometry(radius * 1.45, radius * 1.55, 0.3, 8, 1);
	base.translate(0, 0.15, 0);
	const capital = new THREE.CylinderGeometry(radius * 1.5, radius * 1.15, 0.3, 8, 1);
	capital.translate(0, height - 0.15, 0);
	return mergeGeometries([base, shaft, capital].map((p) => p.toNonIndexed()));
}

export function floorTile({ size = 3, thickness = 0.2 } = {}) {
	const g = new THREE.BoxGeometry(size, thickness, size);
	g.translate(0, -thickness / 2, 0);
	return g;
}

export function steps({ width = 2.4, count = 3, rise = 0.18, run = 0.4 } = {}) {
	const parts = [];
	for (let i = 0; i < count; i++) {
		const s = new THREE.BoxGeometry(width, rise * (i + 1), run);
		s.translate(0, (rise * (i + 1)) / 2, -i * run);
		parts.push(s.toNonIndexed());
	}
	return mergeGeometries(parts);
}

// ---------------------------------------------------------------------------------------------
// Graveyard props

export function tombstone({ width = 0.6, height = 1.0, depth = 0.16, style = 'round' } = {}) {
	const w = width / 2;
	const shape = new THREE.Shape();
	shape.moveTo(-w, 0);
	shape.lineTo(w, 0);
	if (style === 'round') {
		shape.lineTo(w, height - w);
		shape.absarc(0, height - w, w, 0, Math.PI, false);
	} else if (style === 'pointed') {
		shape.lineTo(w, height * 0.78);
		shape.lineTo(0, height);
		shape.lineTo(-w, height * 0.78);
	} else {
		shape.lineTo(w, height);
		shape.lineTo(-w, height);
	}
	shape.lineTo(-w, 0);
	const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 10 });
	g.translate(0, 0, -depth / 2);
	return g;
}

export function stoneCross({ height = 1.5, span = 0.75, thickness = 0.16 } = {}) {
	const v = new THREE.BoxGeometry(thickness, height, thickness);
	v.translate(0, height / 2, 0);
	const h = new THREE.BoxGeometry(span, thickness, thickness);
	h.translate(0, height * 0.72, 0);
	const base = new THREE.BoxGeometry(thickness * 2.6, 0.25, thickness * 2.6);
	base.translate(0, 0.125, 0);
	return mergeGeometries([v, h, base].map((p) => p.toNonIndexed()));
}

export function graveMound({ length = 2.0, width = 0.9, height = 0.35 } = {}) {
	const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
	g.scale(width / 2, height, length / 2);
	return g;
}

export function sarcophagus({ length = 2.2, width = 0.95, height = 0.9 } = {}) {
	const body = new THREE.BoxGeometry(width, height * 0.8, length);
	body.translate(0, height * 0.4, 0);
	const lid = new THREE.BoxGeometry(width * 1.1, height * 0.2, length * 1.06);
	lid.translate(0, height * 0.9, 0);
	const ridge = new THREE.CylinderGeometry(width * 0.18, width * 0.5, length * 0.98, 4, 1);
	ridge.rotateX(Math.PI / 2);
	ridge.rotateZ(Math.PI / 4);
	ridge.scale(1, 0.4, 1);
	ridge.translate(0, height * 1.02, 0);
	return mergeGeometries([body, lid, ridge].map((p) => p.toNonIndexed()));
}

export function altar({ width = 2.2, depth = 1.0, height = 1.05 } = {}) {
	const block = new THREE.BoxGeometry(width * 0.85, height - 0.15, depth * 0.85);
	block.translate(0, (height - 0.15) / 2, 0);
	const slab = new THREE.BoxGeometry(width, 0.15, depth);
	slab.translate(0, height - 0.075, 0);
	return mergeGeometries([block, slab].map((p) => p.toNonIndexed()));
}

export function rock({ radius = 0.5, seed = 1, detail = 2, squash = 0.7 } = {}) {
	let g = new THREE.IcosahedronGeometry(radius, detail);
	g.deleteAttribute('normal');
	g.deleteAttribute('uv');
	g = mergeVertices(g);
	const pos = g.attributes.position;
	const v = new THREE.Vector3();
	for (let i = 0; i < pos.count; i++) {
		v.fromBufferAttribute(pos, i);
		const n = perlin.noise(v.x * 2.1 + seed, v.y * 2.1, v.z * 2.1) * 0.35 + perlin.noise(v.x * 5.3, v.y * 5.3 + seed, v.z * 5.3) * 0.12;
		v.multiplyScalar(1 + n);
		v.y *= squash;
		pos.setXYZ(i, v.x, v.y, v.z);
	}
	g.computeVertexNormals();
	g.translate(0, radius * squash * 0.35, 0);
	return g;
}

// ---------------------------------------------------------------------------------------------
// Wood / iron props

export function woodenPost({ height = 1.9, size = 0.12 } = {}) {
	const g = new THREE.BoxGeometry(size, height, size);
	g.translate(0, height / 2, 0);
	return g;
}

export function torchCup({ radius = 0.11, height = 0.14 } = {}) {
	const cup = new THREE.CylinderGeometry(radius, radius * 0.6, height, 10, 1, true);
	cup.translate(0, height / 2, 0);
	const ring = new THREE.TorusGeometry(radius, 0.012, 6, 16);
	ring.rotateX(Math.PI / 2);
	ring.translate(0, height, 0);
	return mergeGeometries([cup.toNonIndexed(), ring.toNonIndexed()]);
}

export function wallBracket() {
	const plate = new THREE.BoxGeometry(0.16, 0.3, 0.04);
	plate.translate(0, 0, 0.02);
	const arm = new THREE.BoxGeometry(0.04, 0.04, 0.32);
	arm.translate(0, -0.05, 0.18);
	const cup = torchCup({ radius: 0.08, height: 0.1 });
	cup.translate(0, -0.03, 0.32);
	return mergeGeometries([plate.toNonIndexed(), arm.toNonIndexed(), cup]);
}

export function log({ length = 1, radius = 0.09 } = {}) {
	const g = new THREE.CylinderGeometry(radius, radius * 1.1, length, 8, 1);
	g.rotateZ(Math.PI / 2);
	return g;
}

/** Tapered tube along a curve (radius r0 at start -> r1 at end). */
export function taperedTube(curve, { segments = 12, radial = 7, r0 = 0.2, r1 = 0.04 } = {}) {
	const frames = curve.computeFrenetFrames(segments, false);
	const positions = [];
	const indices = [];
	const p = new THREE.Vector3();
	for (let i = 0; i <= segments; i++) {
		const t = i / segments;
		curve.getPointAt(t, p);
		const r = THREE.MathUtils.lerp(r0, r1, t);
		const N = frames.normals[i];
		const B = frames.binormals[i];
		for (let j = 0; j <= radial; j++) {
			const a = (j / radial) * Math.PI * 2;
			const s = Math.sin(a);
			const c = -Math.cos(a);
			positions.push(p.x + r * (c * N.x + s * B.x), p.y + r * (c * N.y + s * B.y), p.z + r * (c * N.z + s * B.z));
		}
	}
	for (let i = 0; i < segments; i++) {
		for (let j = 0; j < radial; j++) {
			const a = i * (radial + 1) + j;
			const b = (i + 1) * (radial + 1) + j;
			indices.push(a, b, a + 1, b, b + 1, a + 1);
		}
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
	g.setIndex(indices);
	g.computeVertexNormals();
	return g;
}

/** Leafless gnarled tree: trunk + recursive branches, all merged. */
export function deadTree({ seed = 1, height = 5 } = {}) {
	const r = rng(seed);
	const parts = [];
	const grow = (start, dir, length, radius, depth) => {
		const pts = [start.clone()];
		const d = dir.clone();
		let p = start.clone();
		const steps = 4;
		for (let i = 1; i <= steps; i++) {
			d.x += (r() - 0.5) * 0.5;
			d.z += (r() - 0.5) * 0.5;
			d.y += depth === 0 ? 0.15 : (r() - 0.35) * 0.3;
			d.normalize();
			p = p.clone().addScaledVector(d, length / steps);
			pts.push(p);
		}
		const curve = new THREE.CatmullRomCurve3(pts);
		parts.push(taperedTube(curve, { segments: 10, radial: depth === 0 ? 8 : 5, r0: radius, r1: radius * 0.35 }));
		if (depth >= 3) return;
		const count = depth === 0 ? 4 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
		for (let i = 0; i < count; i++) {
			const t = depth === 0 ? 0.45 + r() * 0.5 : 0.35 + r() * 0.6;
			const origin = curve.getPointAt(t);
			const tangent = curve.getTangentAt(t);
			const side = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize();
			const nd = tangent.clone().multiplyScalar(0.5).add(side).add(new THREE.Vector3(0, 0.35 + r() * 0.4, 0)).normalize();
			grow(origin, nd, length * (0.42 + r() * 0.25), radius * 0.45 * (1 - t * 0.4), depth + 1);
		}
	};
	grow(new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 1, 0), height, 0.22 + r() * 0.08, 0);
	return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

/** Single grass blade (3 segments) with up-facing normals so it lights like the ground it grows on. */
export function grassBlade({ width = 0.06, height = 1 } = {}) {
	const pos = [];
	const segs = 3;
	for (let i = 0; i <= segs; i++) {
		const t = i / segs;
		const w = width * (1 - t * 0.85);
		const bend = t * t * 0.18;
		pos.push(-w / 2, t * height, bend, w / 2, t * height, bend);
	}
	const idx = [];
	for (let i = 0; i < segs; i++) {
		const a = i * 2;
		idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array((segs + 1) * 2).fill([0, 1, 0]).flat(), 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((segs + 1) * 2).fill(0).map((_, i) => [i % 2, Math.floor(i / 2) / segs]).flat(), 2));
	g.setIndex(idx);
	return g;
}

/** Clump of blades (one instance = one tuft) with a dark-root vertex colour gradient. */
export function grassTuft({ blades = 7, seed = 1, radius = 0.12 } = {}) {
	const r = rng(seed);
	const parts = [];
	for (let i = 0; i < blades; i++) {
		const b = grassBlade({ width: 0.025 + r() * 0.02, height: 0.6 + r() * 0.4 });
		const a = r() * Math.PI * 2;
		const d = r() * radius;
		b.rotateX((r() - 0.5) * 0.5);
		b.rotateY(r() * Math.PI * 2);
		b.translate(Math.cos(a) * d, 0, Math.sin(a) * d);
		const pos = b.attributes.position;
		const colors = new Float32Array(pos.count * 3);
		for (let k = 0; k < pos.count; k++) {
			const t = Math.min(1, Math.max(0, pos.getY(k)));
			const v = 0.3 + 0.7 * t;
			colors.set([v, v, v], k * 3);
		}
		b.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		parts.push(b.toNonIndexed());
	}
	const g = mergeGeometries(parts);
	// Keep the up-facing normals the blades were authored with (ground-like lighting).
	return g;
}

// ---------------------------------------------------------------------------------------------

/**
 * Collects placed pieces. build(merge, { cell }) bakes each piece's transform into a geometry clone, computes
 * world-space UVs and returns meshes — one per material (per cell) when merged, one per piece otherwise.
 */
export class StaticBatch {
	constructor(name) {
		this.name = name;
		this.pieces = [];
	}

	add(geometry, material, { position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], castShadow = true, receiveShadow = true, uv = 'world' } = {}) {
		const m = new THREE.Matrix4().compose(
			new THREE.Vector3(...position),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
			new THREE.Vector3(...(Array.isArray(scale) ? scale : [scale, scale, scale])),
		);
		this.pieces.push({ geometry, material, matrix: m, castShadow, receiveShadow, uv });
		return this;
	}

	/**
	 * cell (metres, merged only): one mesh per material per cell of the xz grid (by each piece's centre) instead of one per
	 * material for the whole map. A map-wide batch has map-wide bounds and is never culled: the village's fire drew every
	 * prop of the map into all six faces of its shadow cube each frame.
	 */
	build(merge = true, { cell = 0 } = {}) {
		const group = new THREE.Group();
		group.name = this.name;
		group.matrixAutoUpdate = false; // baked in place: no matrix to recompose every frame (one per mesh adds up in cells)
		const byMaterial = new Map();
		for (const piece of this.pieces) {
			let g = piece.geometry.index ? piece.geometry.toNonIndexed() : piece.geometry.clone();
			for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
			g.applyMatrix4(piece.matrix);
			if (!g.attributes.normal) g.computeVertexNormals();
			if (piece.uv === 'world' || !g.attributes.uv) worldUV(g);
			let key = piece.material.uuid + (piece.castShadow ? 'c' : '') + (piece.receiveShadow ? 'r' : '');
			let at = '';
			if (merge && cell > 0) {
				g.computeBoundingBox(); // the centre, not the pivot: merged Parts sit at the origin with their pieces far away
				const box = g.boundingBox;
				at = `${Math.floor((box.min.x + box.max.x) / 2 / cell)},${Math.floor((box.min.z + box.max.z) / 2 / cell)}`;
				key += `@${at}`;
			}
			if (!byMaterial.has(key)) byMaterial.set(key, { material: piece.material, castShadow: piece.castShadow, receiveShadow: piece.receiveShadow, at, geometries: [] });
			byMaterial.get(key).geometries.push(g);
		}
		let meshes = 0;
		for (const entry of byMaterial.values()) {
			const list = merge ? [mergeGeometries(entry.geometries)] : entry.geometries;
			if (merge) list[0].userData.labPieces = entry.geometries.map((g) => g.attributes.position.count); // piece boundaries (env/contact.js)
			for (const g of list) {
				const mesh = new THREE.Mesh(g, entry.material);
				mesh.matrixAutoUpdate = false;
				mesh.castShadow = entry.castShadow;
				mesh.receiveShadow = entry.receiveShadow;
				mesh.name = `${this.name} · ${entry.material.name}${entry.at ? ` · cell ${entry.at}` : ''}`;
				group.add(mesh);
				meshes++;
			}
		}
		group.userData.meshCount = meshes;
		group.userData.pieceCount = this.pieces.length;
		return group;
	}
}

// ASHLAR · Act I base maps — BLOCKOUTS (THREE): honest massing models at real size for every asset that has no model yet (SPEC §1.2, §6b).
// Each shape is a few primitives merged into one geometry with vertex colours: one flat, muted colour per CATEGORY (tones of it per part: roof darker,
// door near-black), roughness high, no metal, flat shading. Repeated assets are one InstancedMesh each (userData.assetId, userData.instances, `labSolid`
// when they block the hero). Shapes may expose ANCHORS (local points: windows, lamps, jar candles, hearths) for the builder's glows. Floating labels share
// one canvas atlas. Owned by the outdoor engine (env/act1/outdoor*.js); the interior engine may import it read-only — keep these exports stable:
//   CATEGORY_COLORS, BLOCKOUT_SHAPES, blockoutShape(def) → { geometry, anchors }, blockoutMaterial(), instancedBlockout(def, items, material, shapeCache),
//   placementMatrix(item) (x, y, z, yaw rad, scale [sx, sy, sz]), labelAtlas(entries) → { group, face(camera), dispose }, personMarker(color).
// Local frame of a shape: size [w, h, d] = local x, y, z; base at y = 0; the front (doors, faces) is local +z. Built at the def's size; a placement's scale
// is the instance matrix.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** SPEC §6b: muted blockout colours by category (both engines use the same values). */
export const CATEGORY_COLORS = Object.freeze({
	building: '#8a8478', structure: '#6e6255', vegetation: '#55624f', rock: '#7b8088', prop: '#9a8c6e', linen: '#e4e0d6', story: '#a39b8a', npc: '#c9a86a', encounter: '#8e3b3b',
});

const TAU = Math.PI * 2;

/** Collects primitives in a shape's local frame, then merges them (non-indexed) with per-part vertex colours. */
class Parts {
	constructor(base) {
		this.base = new THREE.Color(base);
		this.list = [];
		this.anchors = [];
	}

	/** Add a geometry: o = { x, y, z (its origin), rx, ry, rz (radians), sx, sy, sz, tone (× base colour), color (explicit, overrides tone) }. */
	add(g, o = {}) {
		const m = new THREE.Matrix4().compose(
			new THREE.Vector3(o.x ?? 0, o.y ?? 0, o.z ?? 0),
			new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, 'YXZ')),
			new THREE.Vector3(o.sx ?? 1, o.sy ?? 1, o.sz ?? 1),
		);
		const geo = (g.index ? g.toNonIndexed() : g).applyMatrix4(m);
		if (g.index) g.dispose();
		const c = o.color ? new THREE.Color(o.color) : this.base.clone().multiplyScalar(o.tone ?? 1);
		const n = geo.attributes.position.count;
		const col = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
		geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
		if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
		this.list.push(geo);
		return geo;
	}

	/** Box w × h × d whose BOTTOM is at o.y (centre x / z at o.x / o.z). */
	box(w, h, d, o = {}) {
		const g = new THREE.BoxGeometry(w, h, d);
		g.translate(0, h / 2, 0);
		return this.add(g, o);
	}

	/** Cylinder (rTop, rBottom, h) standing on o.y. */
	cyl(rTop, rBottom, h, o = {}, seg = 10) {
		const g = new THREE.CylinderGeometry(rTop, rBottom, h, seg, 1);
		g.translate(0, h / 2, 0);
		return this.add(g, o);
	}

	/** Cone (radius r, height h) standing on o.y. */
	cone(r, h, o = {}, seg = 10) {
		const g = new THREE.ConeGeometry(r, h, seg, 1);
		g.translate(0, h / 2, 0);
		return this.add(g, o);
	}

	/** Ellipsoid (sphere scaled to rx, ry, rz) centred at o. */
	blob(rx, ry, rz, o = {}, seg = 10) {
		const g = new THREE.SphereGeometry(1, seg, Math.max(5, Math.round(seg * 0.6)));
		return this.add(g, { ...o, sx: rx, sy: ry, sz: rz });
	}

	/** Upper half of an ellipsoid (a mound) standing on o.y. */
	mound(rx, ry, rz, o = {}, seg = 12) {
		const g = new THREE.SphereGeometry(1, seg, 6, 0, TAU, 0, Math.PI / 2);
		return this.add(g, { ...o, sx: rx, sy: ry, sz: rz });
	}

	/** Gable prism: base w (local x, the ridge runs along x) × d (local z), apex h above o.y. */
	gable(w, h, d, o = {}) {
		const s = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, h)]);
		const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
		g.translate(0, 0, -w / 2);
		g.rotateY(Math.PI / 2); // extrusion (local z) → x; the triangle's base (shape x) → local z
		return this.add(g, o);
	}

	anchor(kind, p, n = [0, 0, 1], size = 0.4, extra = {}) {
		this.anchors.push({ kind, p, n, size, ...extra });
	}

	merge() {
		const g = mergeGeometries(this.list, false);
		for (const p of this.list) p.dispose();
		g.computeBoundingBox();
		g.computeBoundingSphere();
		return g;
	}
}

// ---- the shape catalogue (size = [w, h, d]; o = the def's shape options) --------------------------------------------------------------------------
const DARK = 0.42;
const SHAPES = {
	box(P, [w, h, d]) {
		P.box(w, h, d);
	},
	wall(P, [w, h, d]) {
		P.box(w, h - 0.12, d, { tone: 1 });
		P.box(w + 0.04, 0.12, d + 0.08, { y: h - 0.12, tone: 0.82 }); // coping
		P.box(w * 0.3, h * 0.45, d + 0.02, { x: w * 0.12, y: h * 0.2, tone: 1.14 }); // a repair patch
	},
	fence(P, [w, h, d]) {
		for (const x of [-w / 2 + 0.1, 0, w / 2 - 0.1]) P.cyl(0.07, 0.08, h + 0.1, { x, tone: 0.8 }, 6);
		P.box(w - 0.1, h * 0.82, Math.max(0.06, d * 0.7), { y: 0.12, tone: 1.08 });
	},
	posts(P, [w, h, d]) {
		const n = Math.max(2, Math.round(w / 0.8));
		for (let i = 0; i < n; i++) P.cyl(0.08, 0.1, h, { x: -w / 2 + (w * (i + 0.5)) / n, tone: 0.85 }, 6);
		P.box(w, 0.22, Math.max(0.06, d * 0.4), { y: h * 0.35, tone: 1.05 });
	},
	deck(P, [w, h, d]) {
		P.box(w, 0.14, d, { y: h - 0.14 });
		for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) for (const z of [-d / 2 + 0.1, d / 2 - 0.1]) P.cyl(0.08, 0.09, h, { x, z, tone: 0.75 }, 6);
	},
	'stilt-cottage'(P, [w, h, d]) {
		const s = 0.7; // stilts
		const wallH = 1.95;
		for (const x of [-w / 2 + 0.25, 0, w / 2 - 0.25]) for (const z of [-d / 2 + 0.25, d / 2 - 0.25]) P.cyl(0.1, 0.12, s + 0.1, { x, z, tone: 0.7 }, 6);
		P.box(w, 0.16, d, { y: s, tone: 0.8 });
		P.box(w * 0.9, wallH, d * 0.86, { y: s + 0.16, tone: 1 });
		P.gable(w + 0.6, h - (s + 0.16 + wallH), d + 0.7, { y: s + 0.16 + wallH - 0.05, tone: 0.74 });
		P.box(0.9, 1.6, 0.06, { z: (d * 0.86) / 2 + 0.01, y: s + 0.18, tone: DARK }); // door (front, local +z)
		for (let k = 0; k < 3; k++) P.box(1.0, 0.12, 0.32, { z: d / 2 + 0.25 + k * 0.3, y: s - 0.22 - k * 0.24, tone: 0.75 }); // steps down to the ground
		P.box(0.06, 0.5, 0.6, { x: (w * 0.9) / 2 + 0.01, y: s + 1.1, tone: DARK }); // window (east side)
		P.anchor('window', [(w * 0.9) / 2 + 0.05, s + 1.35, 0], [1, 0, 0], 0.55);
		P.box(0.5, 1.3, 0.5, { x: -w * 0.28, z: -d * 0.18, y: h - 1.6, tone: 0.6 }); // chimney (peat smoke)
	},
	church(P, [w, h, d]) {
		const wallH = 6;
		const ridge = 9;
		P.box(w, wallH, d);
		P.gable(w + 0.5, ridge - wallH, d + 0.7, { y: wallH - 0.05, tone: 0.72 });
		for (const x of [-w / 4, w / 4]) for (const z of [-1, 1]) P.box(0.8, wallH * 0.75, 0.9, { x, z: z * (d / 2 + 0.4), tone: 0.9 }); // buttresses
		P.box(1.6, h - ridge + 0.6, 1.4, { x: -w / 2 + 0.8, y: ridge - 0.6, tone: 0.95 }); // bell-cote on the west gable
		P.box(0.9, 0.9, 0.9, { x: -w / 2 + 0.8, y: ridge + 0.3, tone: 0.45 }); // its bell opening
		P.box(0.08, 2.4, 1.4, { x: -w / 2 - 0.02, y: 0, tone: DARK }); // west door
		P.box(0.12, 0.4, 0.5, { x: -w / 2 - 0.05, y: 2.5, tone: 1.2 }); // the Wedge (keystone) over it — no cross
		for (const x of [-w / 4 + 2, 0, w / 4 + 1.5]) for (const z of [-1, 1]) P.box(0.5, 1.3, 0.06, { x, z: z * (d / 2 + 0.01), y: 3.2, tone: DARK }); // small deep windows
		P.anchor('door', [-w / 2 - 0.1, 1.3, 0], [-1, 0, 0], 0.6);
	},
	tower(P, [w, h, d]) {
		const r = w / 2;
		const wallH = h * 0.66;
		P.cyl(r * 0.88, r, wallH, {}, 14);
		P.cone(r + 0.3, h - wallH + 0.1, { y: wallH - 0.05, tone: 0.72 }, 14);
		P.box(1.0, 2.0, 0.3, { z: r - 0.05, tone: DARK }); // door (front)
		for (const y of [2.6, 3.4, 4.2]) P.box(0.16, 0.5, 0.2, { z: r * 0.9, y, tone: DARK }); // slit windows
		P.anchor('door', [0, 1.1, r + 0.15], [0, 0, 1], 0.5);
	},
	lychgate(P, [w, h, d]) {
		const px = w / 2 - 0.27;
		const pz = d / 2 - 0.4;
		for (const x of [-px, px]) for (const z of [-pz, pz]) {
			P.box(0.55, 0.75, 0.55, { x, z, tone: 1.12, color: null }); // flint plinths
			P.box(0.22, 2.25, 0.22, { x, z, y: 0.75, tone: 0.9 });
		}
		for (const x of [-px, px]) P.box(0.24, 0.24, d + 0.3, { x, y: 2.95, tone: 0.85 }); // wall plates
		for (const z of [-pz, pz]) P.box(w, 0.2, 0.2, { z, y: 3.0, tone: 0.85 }); // tie beams
		P.gable(w + 0.7, h - 3.15, d + 0.9, { y: 3.15, tone: 0.7 });
		for (const s of [-1, 1]) P.box(0.06, 1.55, 0.95, { x: s * (px - 0.2), z: d / 2 + 0.55, y: 0.1, ry: s * 0.25, tone: 0.95 }); // gate leaves, swung open outward
		P.box(0.24, 0.32, 0.24, { y: 2.42, tone: 0.5 }); // the lamp, hung under the ridge
		P.box(0.03, 0.4, 0.03, { y: 2.74, tone: 0.4 });
		P.anchor('lamp', [0, 2.55, 0], [0, 0, 1], 0.5);
	},
	well(P, [w, h, d]) {
		P.cyl(0.8, 0.85, 0.9, { tone: 1.1 }, 14);
		P.cyl(0.62, 0.62, 0.02, { y: 0.9, tone: 0.25 }, 14);
		for (const x of [-0.85, 0.85]) P.box(0.14, h - 0.8, 0.14, { x, tone: 0.8 });
		P.cyl(0.09, 0.09, 1.7, { y: 1.75, rz: Math.PI / 2, x: 0.85, tone: 0.7 }, 8); // windlass
		P.gable(w, 0.85, d, { y: h - 0.85, tone: 0.72 });
	},
	rack(P, [w, h, d]) {
		for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) for (const s of [-1, 1]) P.box(0.12, h * 1.04, 0.12, { x, z: s * d * 0.25, rx: s * 0.28, tone: 0.8 });
		P.cyl(0.08, 0.08, w, { y: h - 0.15, rz: Math.PI / 2, x: w / 2, tone: 0.8 }, 6);
		for (const x of [-0.9, 0, 0.9]) P.cone(0.24, 0.8, { x, y: h - 0.35, rx: Math.PI, tone: 1.12 }, 8); // hanging eel traps
		P.cone(0.2, 0.9, { x: w / 2 - 0.35, z: 0.45, y: 0.05, rx: 0.5, tone: 1.12 }, 8);
	},
	forge(P, [w, h, d]) {
		P.box(w, h * 0.82, 0.45, { z: -d / 2 + 0.22, tone: 1.05 }); // back wall (flint)
		for (const s of [-1, 1]) P.box(0.45, h * 0.7, d * 0.55, { x: s * (w / 2 - 0.22), z: -d / 2 + (d * 0.55) / 2, tone: 1.05 });
		for (const s of [-1, 1]) P.box(0.2, h * 0.68, 0.2, { x: s * (w / 2 - 0.3), z: d / 2 - 0.3, tone: 0.75 }); // front posts
		P.box(w + 0.5, 0.18, d + 0.5, { y: h * 0.75, rx: -0.2, tone: 0.72 }); // lean-to roof falling to the front
		P.box(1.6, 0.95, 1.2, { x: -w / 2 + 1.4, z: -d / 2 + 1.0, tone: 0.62 }); // hearth
		P.box(0.5, 0.25, 0.5, { x: -w / 2 + 1.4, z: -d / 2 + 1.0, y: 0.95, tone: 0.3 });
		P.cyl(0.25, 0.3, 0.55, { x: 0.7, z: 0.4, tone: 0.65 }, 8); // anvil stump
		P.box(0.62, 0.3, 0.24, { x: 0.7, z: 0.4, y: 0.55, tone: 0.45 }); // anvil
		P.cyl(0.4, 0.38, 0.6, { x: w / 2 - 1.0, z: 0.9, tone: 0.8 }, 10); // quench tub
		for (let k = 0; k < 4; k++) P.box(0.05, 1.5, 0.05, { x: w / 2 - 0.6 - k * 0.12, z: -d / 2 + 0.6, y: 0, rz: 0.12, tone: 0.4 }); // grave-irons leaning
		P.anchor('hearth', [-w / 2 + 1.4, 1.1, -d / 2 + 1.4], [0, 0, 1], 0.9);
	},
	board(P, [w, h, d]) {
		for (const s of [-1, 1]) P.box(0.14, h - 0.15, 0.14, { x: s * (w / 2 - 0.15), tone: 0.8 });
		P.box(w - 0.1, 1.25, 0.08, { y: 0.85, tone: 1.15 });
		for (let i = 0; i < 18; i++) P.box(0.3, 0.12, 0.02, { x: -w / 2 + 0.3 + (i % 6) * 0.38, y: 1.0 + Math.floor(i / 6) * 0.35, z: 0.05, tone: 0.75 }); // name slates
		P.gable(w + 0.3, 0.35, 0.55, { y: h - 0.35, tone: 0.72 });
	},
	bellframe(P, [w, h, d]) {
		for (const s of [-1, 1]) {
			P.box(0.26, h - 0.2, 0.26, { x: s * (w / 2 - 0.15), tone: 0.8 });
			P.box(0.14, 1.1, 0.14, { x: s * (w / 2 - 0.55), y: h - 1.25, rz: s * 0.7, tone: 0.8 });
		}
		P.box(w + 0.3, 0.26, 0.3, { y: h - 0.26, tone: 0.8 });
		P.cone(0.42, 0.72, { y: h - 1.05, tone: 0.48 }, 12); // bronze bell
		P.box(0.03, 2.0, 0.03, { x: 0.25, y: 0.5, tone: 1.2 }); // pull rope
	},
	stall(P, [w, h, d]) {
		P.box(w * 0.92, 0.85, d * 0.75, { y: 0.4, tone: 0.95 });
		for (const s of [-1, 1]) P.cyl(0.42, 0.42, 0.1, { x: s * w * 0.3, z: s * 0.0 + d * 0.39, y: 0.42, rx: Math.PI / 2, tone: 0.7 }, 12);
		for (const s of [-1, 1]) P.box(0.07, h - 0.1, 0.07, { x: s * (w / 2 - 0.1), z: d / 2 - 0.1, tone: 0.75 });
		P.box(w + 0.2, 0.05, d, { y: h - 0.35, rx: 0.22, tone: 1.12 }); // patched canvas awning
		for (let i = 0; i < 6; i++) P.box(0.2, 0.16, 0.16, { x: -w / 2 + 0.45 + i * 0.42, y: 1.25, z: 0.15, tone: 0.75 + (i % 3) * 0.12 }); // goods
	},
	watchpost(P, [w, h, d]) {
		const deckY = 2.0;
		for (const x of [-w / 2 + 0.15, w / 2 - 0.15]) for (const z of [-d / 2 + 0.15, d / 2 - 0.15]) P.box(0.18, h - 0.25, 0.18, { x, z, tone: 0.8 });
		P.box(w, 0.18, d, { y: deckY, tone: 0.9 });
		for (const z of [-d / 2 + 0.1, d / 2 - 0.1]) P.box(w, 0.08, 0.08, { z, y: deckY + 0.95, tone: 0.8 });
		P.box(w + 0.4, 0.14, d + 0.4, { y: h - 0.45, rx: 0.16, tone: 0.72 });
		P.box(0.5, 2.6, 0.08, { x: 0, z: d / 2 + 0.55, y: 0, rx: -0.38, tone: 0.75 }); // ladder
		P.cyl(0.3, 0.2, 0.4, { x: w / 2 - 0.35, z: -d / 2 + 0.35, y: deckY + 1.1, tone: 0.4 }, 8); // iron fire basket
		P.anchor('fire', [w / 2 - 0.35, deckY + 1.55, -d / 2 + 0.35], [0, 1, 0], 0.6);
	},
	vaultdoor(P, [w, h, d]) {
		for (const s of [-1, 1]) P.box(0.45, h - 0.4, d, { x: s * (w / 2 - 0.22), tone: 1.1 });
		P.box(w, 0.42, d, { y: h - 0.42, tone: 1.15 });
		P.box(w - 0.9, h - 0.45, 0.2, { z: -d / 2 + 0.15, tone: 0.32 }); // the door, recessed
		P.box(0.14, 0.14, 0.05, { z: -d / 2 + 0.27, y: 1.1, x: 0.35, tone: 0.8 });
		P.anchor('door', [0, 1.2, d / 2], [0, 0, 1], 0.5);
	},
	peatstack(P, [w, h, d]) {
		const layers = 3;
		for (let k = 0; k < layers; k++) P.box(w * (1 - k * 0.18), h / layers, d * (1 - k * 0.15), { y: (k * h) / layers, tone: 0.62 - k * 0.04 });
	},
	statue(P, [w, h, d]) {
		P.box(1.4, 0.55, 1.15, { tone: 1.05 });
		P.box(1.05, 0.45, 0.85, { y: 0.55, tone: 1.0 });
		P.cyl(0.32, 0.45, 2.0, { y: 1.0, tone: 0.95 }, 10); // robe
		P.blob(0.2, 0.25, 0.2, { y: 3.18, tone: 1.02 }); // the smooth, faceless head
		for (const s of [-1, 1]) P.box(0.14, 0.95, 0.14, { x: s * 0.42, y: 2.55, rz: -s * 0.55, tone: 0.95 }); // arms raised to the arch
		const R = 1.05;
		for (let i = 0; i <= 6; i++) {
			const a = Math.PI * (i / 6);
			P.box(0.34, 0.3, 0.34, { x: Math.cos(a) * R, y: 3.35 + Math.sin(a) * R * 0.8, rz: a - Math.PI / 2, tone: 0.98 });
		}
	},
	cart(P, [w, h, d]) {
		P.box(w * 0.62, 0.1, d * 0.85, { y: 0.72, x: -w * 0.12, tone: 0.9 });
		for (const s of [-1, 1]) P.box(w * 0.62, 0.22, 0.05, { y: 0.82, x: -w * 0.12, z: s * d * 0.42, tone: 0.85 });
		for (const s of [-1, 1]) P.cyl(0.52, 0.52, 0.07, { y: 0.55, x: 0.05, z: s * (d / 2 - 0.04), rx: Math.PI / 2, tone: 0.7 }, 12);
		for (const s of [-1, 1]) P.box(w * 0.42, 0.06, 0.06, { x: w * 0.3, y: 0.85, z: s * d * 0.3, rz: -0.1, tone: 0.8 }); // handles
		for (const s of [-1, 1]) P.box(0.07, 0.75, 0.07, { x: -w * 0.4, z: s * d * 0.35, tone: 0.8 }); // legs
	},
	mortsafe(P, [w, h, d]) {
		P.box(w, 0.3, d, { tone: 1.1, color: null });
		const n = 5;
		for (let i = 0; i < n; i++) {
			const x = -w / 2 + 0.25 + (i * (w - 0.5)) / (n - 1);
			for (const s of [-1, 1]) P.box(0.06, h - 0.35, 0.06, { x, z: s * (d / 2 - 0.15), y: 0.3, tone: 0.45 });
			P.box(0.06, 0.06, d - 0.24, { x, y: h - 0.08, tone: 0.45 });
		}
		for (const z of [-0.25, 0.25]) P.box(w - 0.4, 0.05, 0.05, { z, y: h - 0.04, tone: 0.45 });
	},
	headstones(P, [w, h, d]) {
		P.mound(w / 2, 0.22, d / 2, { tone: 0.75 });
		const stones = [[-0.95, 0.65, 1.0, 0.16, 0.12], [-0.25, 0.75, 1.3, 0.2, -0.05], [0.45, 0.5, h, 0.22, 0.06], [1.0, 0.55, 0.8, 0.16, 0.3]];
		stones.forEach(([x, sw, sh, sd, tilt], i) => P.box(sw, sh, sd, { x, z: -0.2 + (i % 2) * 0.3, rz: tilt * 0.4, rx: tilt * 0.3, tone: 1 + (i % 2) * 0.1 }));
		P.blob(0.3, 0.25, 0.28, { x: 0.75, z: 0.55, y: 0.15, tone: 0.95 });
	},
	'grave-jars'(P, [w, h, d]) {
		P.mound(w / 2, 0.32, d / 2, { tone: 0.5 }); // earthen mound (darker), the headstone lighter
		P.box(0.6, h, 0.14, { z: -d / 2 + 0.12, tone: 1.08 });
		const jars = [[-0.3, -0.6], [0.28, -0.55], [-0.2, 0.1], [0.25, 0.35], [0, 0.75]];
		for (const [x, z] of jars) {
			P.cyl(0.05, 0.05, 0.11, { x, z: z * (d / 2.2), y: 0.24 - Math.abs(z) * 0.06, tone: 0.55 }, 6);
			P.anchor('jar', [x, 0.42 - Math.abs(z) * 0.06, z * (d / 2.2)], [0, 1, 0], 0.07);
		}
	},
	'grave-fresh'(P, [w, h, d]) {
		P.mound(w / 2, 0.5, d / 2, { tone: 0.42 });
		P.box(0.08, 1.0, 0.08, { z: -d / 2 + 0.05, tone: 0.8 });
		P.box(0.32, 0.22, 0.03, { z: -d / 2 + 0.1, y: 0.7, tone: 0.6 });
		P.box(0.18, 1.1, 0.03, { x: 0.25, z: 0.3, y: 0.15, rz: 0.25, tone: 0.7 }); // spade
		for (const s of [-1, 1]) P.box(0.24, 0.04, 2.2, { x: s * (w / 2 + 0.25), tone: 0.85 }); // planks
	},
	'grave-risen'(P, [w, h, d]) {
		P.mound(w / 2, 0.25, d / 2, { tone: 0.42 });
		P.box(w * 0.45, 0.35, d * 0.8, { x: -w * 0.35, rz: 0.5, tone: 0.6 }); // heaved earth
		P.box(w * 0.45, 0.35, d * 0.8, { x: w * 0.35, rz: -0.5, tone: 0.6 });
		P.box(0.62, 0.06, 1.9, { y: 0.35, x: 0.15, rz: -0.45, tone: 0.85 }); // the cracked lid, tilted up
		for (let i = 0; i < 4; i++) for (const s of [-1, 1]) P.box(0.06, h - 0.1, 0.06, { x: s * 0.62, z: -d / 2 + 0.4 + i * 0.6, rz: s * 0.5, tone: 0.42 }); // bars bent outward
	},
	gibbet(P, [w, h, d]) {
		P.box(0.26, h, 0.26, { tone: 0.32 });
		P.box(w, 0.18, 0.18, { x: w / 2 - 0.1, y: h - 0.35, tone: 0.32 });
		P.box(0.12, 1.2, 0.12, { x: 0.45, y: h - 1.35, rz: -0.75, tone: 0.32 });
		P.box(0.03, 0.75, 0.03, { x: w - 0.25, y: h - 1.1, tone: 0.5 }); // chain
		const cy = h - 2.05;
		for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [0.28, 0.28], [-0.28, 0.28]]) P.box(0.04, 0.95, 0.04, { x: w - 0.25 + x, z, y: cy, tone: 0.5 });
		for (const y of [cy, cy + 0.93]) P.box(0.62, 0.04, 0.62, { x: w - 0.25, y, tone: 0.5 });
	},
	lamppost(P, [w, h, d]) {
		P.box(0.12, h, 0.12, { tone: 0.45 });
		P.box(0.6, 0.05, 0.05, { x: 0.3, y: h - 0.2, tone: 0.45 });
		P.box(0.22, 0.3, 0.22, { x: 0.55, y: h - 0.55, tone: 0.5 });
		P.box(0.3, 0.05, 0.3, { x: 0.18, y: 1.1, tone: 0.6 }); // ledge
		P.cyl(0.11, 0.08, 0.06, { x: 0.18, y: 1.15, tone: 1.25 }, 8); // the bowl of milk
		P.anchor('lamp', [0.55, h - 0.4, 0], [0, 0, 1], 0.35);
	},
	chair(P, [w, h, d]) {
		for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) P.box(0.05, 0.45, 0.05, { x, z, tone: 0.8 });
		P.box(w, 0.06, d, { y: 0.45, rz: 0.06 });
		P.box(w, 0.5, 0.05, { y: 0.45, z: -d / 2 + 0.03, rx: -0.12 });
		P.box(w * 0.75, 0.1, d * 0.6, { y: 0.51, tone: 1.25 }); // folded blanket
	},
	compound(P, [w, h, d]) {
		// the Gentle House from afar: long ward range, gate tower, boundary wall round a court; one high window (anchor) glows warm and still
		P.box(30, 8, 9, { z: -d / 2 + 4.5, tone: 1.32 }); // whitewash reads paler than the land
		P.gable(30.6, 3, 9.8, { y: 7.95, z: -d / 2 + 4.5, tone: 0.8 });
		P.box(6, h - 3, 6, { x: -w / 2 + 3, z: d / 2 - 6, tone: 1.25 }); // gate tower
		P.cone(4.6, 3.2, { x: -w / 2 + 3, z: d / 2 - 6, y: h - 3.05, tone: 0.8 }, 4);
		P.box(w - 6, 3.2, 0.6, { x: 3, z: d / 2 - 0.3, tone: 1.2 }); // court wall (front)
		for (const s of [-1, 1]) P.box(0.6, 3.2, d - 9, { x: s * (w / 2 - 0.3) + (s < 0 ? 0 : 0), z: d / 2 - (d - 9) / 2, tone: 1.2 });
		P.box(1.6, 2.2, 0.1, { x: 4, y: 8.4, z: -d / 2 + 9.05, tone: 0.3 }); // the high window's frame
		P.anchor('window', [4, 9.5, -d / 2 + 9.15], [0, 0, 1], 2.0, { still: true });
	},
	tree(P, [w, h, d], o = {}) {
		if (o.crown === 'weeping') {
			P.cyl(0.18, 0.3, h * 0.5, { tone: 0.6, color: null }, 7);
			P.mound(w / 2, h * 0.42, d / 2, { y: h * 0.5, tone: 1.05 }, 10);
			P.cyl(w / 2 - 0.05, w / 2 + 0.25, h * 0.38, { y: h * 0.18, tone: 0.92 }, 12); // hanging curtain of twigs
			return;
		}
		// yew: thick short trunk, broad near-black crown of a few big masses
		P.cyl(0.38, 0.55, h * 0.3, { tone: 0.62, color: '#5a4636' }, 8);
		P.blob(w * 0.48, h * 0.32, d * 0.46, { y: h * 0.5, tone: 0.62 }, 10);
		P.blob(w * 0.36, h * 0.28, d * 0.34, { y: h * 0.68, x: w * 0.12, z: -d * 0.08, tone: 0.56 }, 9);
		P.blob(w * 0.3, h * 0.24, d * 0.3, { y: h * 0.4, x: -w * 0.18, z: d * 0.14, tone: 0.66 }, 9);
	},
	// ---- map 3 · the Poppy Reach (A08 kit, A18 extras, N-PR…): drystone field walls, gates, the farm, the hospice edge ----------------------------------
	drystone(P, [w, h, d]) {
		P.box(w, h * 0.56, d, { tone: 0.96 });
		P.box(w, h * 0.3, d * 0.84, { y: h * 0.56, tone: 1.02 }); // battered upper courses
		const n = Math.max(3, Math.round(w / 0.42));
		for (let i = 0; i < n; i++) P.box((w / n) * 0.86, h * 0.15, d * 0.7, { x: -w / 2 + (w * (i + 0.5)) / n, y: h * 0.85, rz: i % 2 ? 0.1 : -0.08, tone: 0.8 + (i % 3) * 0.05 }); // upright coping stones
		P.box(w * 0.26, h * 0.42, d + 0.03, { x: -w * 0.2, y: h * 0.08, tone: 1.13 }); // a rebuilt patch
		P.box(0.26, 0.13, d + 0.22, { x: w * 0.3, y: h * 0.42, tone: 0.88 }); // a through-stone
	},
	stile(P, [w, h, d]) {
		// a squeeze stile: the wall stops for a person-wide gap with a worn sill and a step stone each side (blockers: the two stubs only)
		const stub = 0.7;
		for (const s of [-1, 1]) {
			P.box(stub, h * 0.85, d, { x: s * (w / 2 - stub / 2), tone: 0.96 });
			P.box(stub * 0.9, h * 0.15, d * 0.7, { x: s * (w / 2 - stub / 2), y: h * 0.85, tone: 0.82 });
			P.box(0.5, 0.24, 0.42, { x: s * 0.35, z: s * (d / 2 + 0.28), tone: 1.06 });
		}
		P.box(w - 2 * stub - 0.1, 0.12, d * 0.9, { tone: 1.1 });
	},
	fieldgate(P, [w, h, d]) {
		// two drystone posts with cap stones; a five-bar timber gate swung open into the field, hinged on the west post (blockers: the posts only)
		const px = w / 2 - 0.3;
		for (const s of [-1, 1]) {
			P.box(0.6, h - 0.16, 0.6, { x: s * px, tone: 1.12 });
			P.box(0.68, 0.16, 0.68, { x: s * px, y: h - 0.16, tone: 0.9 });
		}
		const L = w - 1.35;
		const hx = -px + 0.32;
		const a = 1.25;
		const cx = hx + (Math.cos(a) * L) / 2;
		const cz = -(Math.sin(a) * L) / 2;
		for (const y of [0.22, 0.46, 0.7, 0.94, 1.12]) P.box(L, 0.07, 0.05, { x: cx, z: cz, y, ry: a, tone: 0.82 });
		for (const t of [0, 1]) P.box(0.09, 1.0, 0.07, { x: hx + Math.cos(a) * L * t, z: -Math.sin(a) * L * t, y: 0.2, ry: a, tone: 0.75 });
		P.box(Math.hypot(L, 0.85), 0.06, 0.05, { x: cx, z: cz, y: 0.26, ry: a, rz: Math.atan2(0.85, L), tone: 0.75 }); // the brace
	},
	farmhouse(P, [w, h, d]) {
		// abandoned hillside farmhouse (A08.3): stone walls, door hanging open (front, +z), the west half still roofed, the east half fallen in to bare
		// rafters so the empty beds show from above; chimney on the west gable. Blockers: the four walls (the door gap is walkable)
		const t = 0.5;
		const wallH = 2.7;
		const doorX = -1.2;
		const doorW = 1.8;
		P.box(w, wallH, t, { z: -d / 2 + t / 2 });
		for (const s of [-1, 1]) P.box(t, wallH, d - 2 * t, { x: s * (w / 2 - t / 2) });
		const fl = doorX - doorW / 2 + w / 2;
		const fr = w / 2 - (doorX + doorW / 2);
		P.box(fl, wallH, t, { x: -w / 2 + fl / 2, z: d / 2 - t / 2 });
		P.box(fr, wallH, t, { x: w / 2 - fr / 2, z: d / 2 - t / 2 });
		P.box(doorW, wallH - 2.15, t, { x: doorX, y: 2.15, z: d / 2 - t / 2 }); // lintel
		P.box(doorW * 0.5, 2.0, 0.08, { x: doorX - doorW * 0.42, z: d / 2 + 0.2, ry: -0.9, tone: 0.55 }); // the door leaf, hanging open
		P.box(0.9, 0.8, 0.06, { x: 2.0, y: 1.1, z: d / 2 + 0.01, tone: 0.38 }); // shuttered window
		P.box(1.3, 1.0, t + 0.04, { x: -2.6, y: 0.35, z: d / 2 - t / 2, tone: 1.14 }); // a mended patch of lighter stone
		const roofH = h - 1.0 - wallH;
		P.gable(w / 2 + 0.35, roofH, d + 0.7, { x: -w / 4 - 0.17, y: wallH - 0.05, tone: 0.66 });
		P.gable(t, roofH, d - 0.1, { x: w / 2 - t / 2, y: wallH - 0.05, tone: 0.95 }); // the east gable end still stands
		const L = Math.hypot(d / 2 + 0.35, roofH);
		for (const x of [w * 0.08, w * 0.24, w * 0.4]) for (const s of [-1, 1]) P.box(0.12, 0.12, L, { x, y: wallH + roofH / 2 - 0.06, z: (s * d) / 4, rx: s * Math.atan2(roofH, d / 2 + 0.35), tone: 0.55 }); // bare rafters
		P.box(w / 2, 0.14, 0.14, { x: w / 4, y: wallH + roofH - 0.1, tone: 0.55 }); // ridge beam
		P.box(0.9, h - wallH + 0.2, 0.9, { x: -w / 2 + 0.55, y: wallH - 0.2, z: -0.4, tone: 0.92 }); // chimney
	},
	rick(P, [w, h, d]) {
		const r = Math.min(w, d) / 2;
		P.box(w * 0.86, 0.2, d * 0.86, { tone: 0.6 }); // staddle timbers
		P.cyl(r * 0.9, r * 0.96, h * 0.42, { y: 0.2, tone: 1.08 }, 14);
		P.cone(r * 0.96, h * 0.5, { y: 0.18 + h * 0.42, tone: 1.12 }, 14);
		P.cyl(r * 0.93, r * 0.93, 0.08, { y: 0.2 + h * 0.36, tone: 0.7 }, 14); // rope band
		P.cyl(0.06, 0.08, h * 0.22, { y: h * 0.8, tone: 0.6 }, 6); // the pole
	},
	dryingrack(P, [w, h, d]) {
		// poppy-drying rack (A08.6): two A-frames, a pole, bunches of seed heads hung by the stems (some still red), a bench beneath
		for (const s of [-1, 1]) for (const k of [-1, 1]) P.box(0.12, h * 1.02, 0.12, { x: s * (w / 2 - 0.22), z: k * d * 0.24, rx: k * 0.3, tone: 0.8 });
		P.cyl(0.07, 0.07, w, { y: h - 0.12, rz: Math.PI / 2, x: w / 2, tone: 0.8 }, 6);
		for (let i = 0; i < 5; i++) {
			const x = -w / 2 + 0.55 + (i * (w - 1.1)) / 4;
			P.box(0.015, 0.35, 0.015, { x, y: h - 0.47, tone: 0.6 });
			P.cone(0.17, 0.6, { x, y: h - 1.1, tone: 0.55 }, 7);
			if (i % 2 === 0) P.blob(0.09, 0.07, 0.09, { x: x + 0.06, y: h - 0.98, color: '#b3262a' }, 6);
		}
		P.box(w * 0.7, 0.08, 0.36, { y: 0.44, tone: 0.9 });
		for (const s of [-1, 1]) P.box(0.1, 0.44, 0.3, { x: s * w * 0.3, tone: 0.75 });
	},
	oxcart(P, [w, h, d]) {
		// abandoned two-wheeled ox cart (A18.1), shafts down on the ground ahead (+z), still piled with quilts, a straw mattress and one clean pillow
		const bedL = d * 0.6;
		const bz = -d * 0.12;
		for (const s of [-1, 1]) P.cyl(0.74, 0.74, 0.1, { x: s * (w / 2 - 0.05), y: 0.74, z: bz, rz: Math.PI / 2, tone: 0.62 }, 14);
		P.box(w, 0.1, 0.1, { y: 0.69, z: bz, tone: 0.5 }); // axle
		P.box(w * 0.78, 0.12, bedL, { y: 0.9, z: bz, tone: 0.85 });
		for (const s of [-1, 1]) P.box(0.08, 0.36, bedL, { x: s * w * 0.39, y: 0.98, z: bz, tone: 0.8 });
		P.box(w * 0.78, 0.36, 0.08, { y: 0.98, z: bz - bedL / 2, tone: 0.8 }); // tailboard
		const L = d / 2 - (bz + bedL / 2) + 0.3;
		for (const s of [-1, 1]) P.box(0.1, 0.1, Math.hypot(L, 0.95), { x: s * w * 0.28, y: 0.42, z: bz + bedL / 2 + L / 2 - 0.25, rx: Math.atan2(0.95, L), tone: 0.75 }); // shafts
		P.box(w * 0.7, 0.18, bedL * 0.86, { y: 1.02, z: bz, tone: 1.15 }); // straw mattress
		P.blob(w * 0.36, 0.22, bedL * 0.32, { y: 1.22, z: bz + bedL * 0.14, color: '#5d6650' }, 9); // patched quilt
		P.blob(w * 0.3, 0.18, bedL * 0.22, { y: 1.3, z: bz - bedL * 0.16, x: 0.12, color: '#7d6a4a' }, 9);
		P.box(0.56, 0.17, 0.36, { y: 1.42, z: bz - bedL * 0.3, ry: 0.15, color: '#e4e0d6' }); // the one clean pillow (Mercy's linen)
	},
	bed(P, [w, h, d]) {
		// rustic plank bed (A18.2; foot = front, +z): rumpled patched blanket, one perfectly clean pillow at the head (−z)
		for (const s of [-1, 1]) {
			P.box(0.1, h, 0.1, { x: s * (w / 2 - 0.05), z: -d / 2 + 0.05, tone: 0.8 });
			P.box(0.1, h * 0.62, 0.1, { x: s * (w / 2 - 0.05), z: d / 2 - 0.05, tone: 0.8 });
			P.box(0.07, 0.16, d - 0.1, { x: s * (w / 2 - 0.05), y: 0.28, tone: 0.75 });
		}
		P.box(w - 0.1, h * 0.42, 0.06, { y: h * 0.5, z: -d / 2 + 0.05, tone: 0.85 });
		P.box(w - 0.12, 0.2, d - 0.16, { y: 0.32, tone: 1.12 });
		P.box(w - 0.08, 0.1, d * 0.6, { y: 0.5, z: d * 0.17, rx: 0.04, color: '#5f6a52' });
		P.box(0.34, 0.11, 0.3, { y: 0.54, z: d * 0.3, x: 0.18, color: '#7a6646' });
		P.box(w * 0.62, 0.15, 0.36, { y: 0.53, z: -d / 2 + 0.3, color: '#e4e0d6' }); // the clean pillow
	},
	minecut(P, [w, h, d]) {
		// Flint Delvings mine mouth (A18.3): a chalk-and-flint hillside cut with a dark entrance (front, +z; the GLB timber portal stands in it), flint
		// nodules in the chalk, a spoil heap of chalk rubble, antler picks leaning. Blockers: the cheeks and the back (the entrance stays walkable)
		P.mound(w / 2, h, d / 2, { z: -d * 0.1, tone: 1.32 }, 14);
		P.box(1.9, 2.15, 1.6, { z: d / 2 - 1.3, color: '#0c0b0a' });
		for (const [x, y, z, r] of [[-1.7, 1.9, 1.3, 0.22], [1.5, 2.4, 1.1, 0.2], [-0.4, 2.9, 0.9, 0.18], [2.2, 1.1, 1.0, 0.2], [-2.4, 0.8, 1.2, 0.24]]) P.blob(r * 1.3, r, r, { x, y, z, color: '#2e3036' }, 6);
		P.mound(1.5, 0.85, 1.2, { x: w / 2 - 1.1, z: d / 2 - 0.4, tone: 1.42 }, 10);
		for (let i = 0; i < 3; i++) P.box(0.05, 1.3, 0.05, { x: -w / 2 + 1.0 + i * 0.12, z: d / 2 - 0.5, rz: 0.2 + i * 0.05, tone: 0.95 });
	},
	ward(P, [w, h, d]) {
		// the hospice ward range (A18.4): brand-new whitewash, not one patch; clean steep slate roof; rows of identical windows; one high window warm and still
		// (the act image; the plan's Perfection light and glow sit on it)
		const eave = 6.5;
		P.box(w, eave, d, { tone: 1.36 });
		P.gable(w + 0.3, h - eave, d + 0.5, { y: eave - 0.05, tone: 0.5 });
		for (const x of [-w * 0.3, w * 0.28]) P.box(0.7, 1.4, 0.9, { x, y: h - 1.6, z: -0.8, tone: 1.2 });
		const n = 11;
		const warm = 7;
		for (let i = 0; i < n; i++) {
			const x = -w / 2 + 1.6 + (i * (w - 3.2)) / (n - 1);
			for (const y of [1.3, 4.1]) {
				if (y < 2 && Math.abs(x) < 1.4) continue;
				const lit = y > 2 && i === warm;
				P.box(0.9, 1.45, lit ? 0.1 : 0.08, { x, y, z: d / 2 + 0.01, ...(lit ? { color: '#f0b86a' } : { tone: 0.38 }) });
				if (lit) P.anchor('stillWindow', [x, y + 0.72, d / 2 + 0.12], [0, 0, 1], 1.2, { still: true });
			}
		}
		P.box(1.5, 2.5, 0.1, { z: d / 2 + 0.02, tone: 0.42 }); // door
		P.box(2.4, 0.18, 1.2, { z: d / 2 + 0.6, tone: 1.2 }); // door step
	},
	limewall(P, [w, h, d], o = {}) {
		// whitewashed hospice wall section (A18.5): seamless, smooth coping, end piers; a niche with a still candle (a row of them = Perfection's light)
		P.box(w, h - 0.2, d, { tone: 1.3 });
		P.box(w + 0.06, 0.2, d + 0.14, { y: h - 0.2, tone: 1.2 });
		for (const s of [-1, 1]) {
			P.box(0.62, h + 0.12, d + 0.2, { x: s * (w / 2 - 0.31), tone: 1.33 });
			P.cone(0.46, 0.32, { x: s * (w / 2 - 0.31), y: h + 0.12, ry: Math.PI / 4, tone: 1.25 }, 4);
		}
		if (o.niche !== false) {
			P.box(0.62, 0.8, 0.07, { y: 1.3, z: d / 2 + 0.01, tone: 0.62 });
			P.box(0.7, 0.06, 0.16, { y: 1.28, z: d / 2 + 0.06, tone: 1.25 });
			P.cyl(0.035, 0.035, 0.16, { y: 1.34, z: d / 2 + 0.07, tone: 1.4 }, 6);
			P.anchor('niche', [0, 1.62, d / 2 + 0.12], [0, 0, 1], 0.3, { still: true });
		}
	},
	steps(P, [w, h, d]) {
		// hilltop approach steps (A18.6): clean stone steps up a whitewashed retaining terrace (no repairs), potted flowers on the cheeks at the top; the
		// bottom step is the front (+z), the flight rises toward −z. Walk surface = the terrain ramp under it (the def does not collide)
		const n = 8;
		const rise = (h - 0.5) / n;
		const run = d / n;
		for (let k = 0; k < n; k++) P.box(w - 0.6, rise * (k + 1), run + 0.02, { z: d / 2 - run * (k + 0.5), tone: 1.18 });
		for (const s of [-1, 1]) {
			const x = s * (w / 2 - 0.15);
			P.box(0.3, h, d, { x, tone: 1.32 });
			P.cyl(0.24, 0.17, 0.36, { x, y: h, z: -d / 2 + 0.3, tone: 0.75 }, 8);
			P.blob(0.26, 0.2, 0.26, { x, y: h + 0.46, z: -d / 2 + 0.3, color: '#55624f' }, 7);
			for (const [dx, dz, c] of [[0.1, 0.05, '#b3262a'], [-0.09, -0.06, '#d6cfbd'], [0.0, 0.12, '#b3262a']]) P.blob(0.06, 0.05, 0.06, { x: x + dx, y: h + 0.6, z: -d / 2 + 0.3 + dz, color: c }, 5);
		}
	},
	thorn(P, [w, h, d]) {
		// a lone wind-bent hawthorn (rite site): leaning trunk, the crown blown east, ribbons tied in it, a sleeper's shoes left beneath
		P.cyl(0.16, 0.26, h * 0.42, { rz: -0.22, color: '#4e3f33' }, 7);
		P.cyl(0.1, 0.15, h * 0.3, { y: h * 0.36, x: 0.42, rz: -0.6, color: '#4e3f33' }, 6);
		P.blob(w * 0.42, h * 0.2, d * 0.34, { y: h * 0.62, x: w * 0.16, tone: 0.78 }, 9);
		P.blob(w * 0.28, h * 0.16, d * 0.26, { y: h * 0.74, x: w * 0.3, z: -d * 0.06, tone: 0.7 }, 8);
		P.blob(w * 0.24, h * 0.13, d * 0.22, { y: h * 0.55, x: -w * 0.08, z: d * 0.1, tone: 0.86 }, 8);
		for (const [x, z, c, L] of [[0.9, 0.5, '#b3262a', 0.9], [1.5, -0.4, '#cfc6b4', 0.7], [0.3, -0.7, '#8a6a3a', 0.8], [2.1, 0.3, '#b3262a', 0.6], [-0.4, 0.6, '#cfc6b4', 0.75]]) P.box(0.06, L, 0.02, { x, y: h * 0.5 - L, z, color: c });
		for (const s of [-1, 1]) P.box(0.11, 0.09, 0.27, { x: 0.35 + s * 0.08, z: 0.55, ry: 0.3, color: '#3a2e26' });
	},
	cairn(P, [w, h, d]) {
		P.blob(w * 0.48, h * 0.24, d * 0.44, { y: h * 0.16, tone: 1.0 }, 7);
		P.blob(w * 0.36, h * 0.2, d * 0.34, { y: h * 0.44, tone: 1.08 }, 7);
		P.blob(w * 0.24, h * 0.16, d * 0.22, { y: h * 0.68, tone: 0.95 }, 6);
		P.blob(w * 0.14, h * 0.1, d * 0.12, { y: h * 0.86, tone: 1.1 }, 6);
		P.box(0.34, 0.24, 0.04, { y: h * 0.3, z: d * 0.42, rx: -0.2, tone: 0.6 }); // a name slate
		for (const [x, c] of [[-0.18, '#b3262a'], [0.12, '#cfc6b4'], [0.24, '#8a6a3a']]) P.box(0.05, 0.42, 0.015, { x, y: h * 0.42, z: d * 0.38, color: c });
	},
	reaping(P) {
		// an abandoned reaping: sheaves, a scythe left lying in the stubble, a straw hat
		for (const [x, z, r] of [[-0.7, -0.4, 0.22], [-0.25, -0.62, 0.2], [-0.9, 0.2, 0.21]]) {
			P.cyl(r * 0.7, r, 0.72, { x, z, tone: 1.15 }, 7);
			P.cone(r * 0.95, 0.32, { x, z, y: 0.72, tone: 1.2 }, 7);
		}
		P.box(0.05, 0.05, 1.6, { x: 0.5, y: 0.04, z: 0.1, ry: 0.5, tone: 0.7 });
		P.box(0.7, 0.02, 0.1, { x: 0.85, y: 0.05, z: 0.75, ry: 1.2, tone: 0.55 });
		P.cyl(0.26, 0.26, 0.03, { x: 0.2, z: -0.25, tone: 1.18 }, 10);
		P.blob(0.13, 0.09, 0.13, { x: 0.2, y: 0.03, z: -0.25, tone: 1.15 }, 8);
	},
	crook(P, [w, h]) {
		P.box(0.05, h, 0.05, { rz: 0.18, tone: 0.7 });
		P.box(0.24, 0.05, 0.05, { x: -0.36, y: h * 0.97, tone: 0.7 });
		P.box(0.5, 0.12, 0.34, { x: 0.25, z: 0.12, color: '#5a4c3e' }); // a folded coat
	},
	doll(P, [w, h]) {
		P.cyl(w * 0.22, w * 0.32, h * 0.62, { tone: 1.2 }, 6);
		P.blob(w * 0.2, w * 0.2, w * 0.2, { y: h * 0.75, tone: 1.18 }, 6);
		P.box(w * 0.9, 0.04, 0.04, { y: h * 0.5, tone: 1.1 });
		P.box(0.02, h * 0.3, 0.02, { x: 0.03, y: h * 0.2, z: 0.03, color: '#b3262a' });
	},
	/** Data-driven massing kept in the map file (no code here per asset): spec.parts = [[primitive, …args], …], primitive = box | cyl | cone | blob | mound |
	 * gable | anchor (the Parts calls above, def-local metres, options { x, y, z, rx, ry, rz, tone, color }); an unknown primitive is skipped with a warning. */
	parts(P, size, o = {}) {
		for (const [method, ...args] of o.parts ?? []) {
			if (['box', 'cyl', 'cone', 'blob', 'mound', 'gable', 'anchor'].includes(method)) P[method](...args);
			else console.warn(`Blockout parts: unknown primitive "${method}"`);
		}
	},
};

/** Blockout kinds available to map files (the def's `shape`: a kind, or { kind, …options }). */
export const BLOCKOUT_SHAPES = Object.keys(SHAPES);

/** Geometry + anchors of an asset def's blockout at its def size (cached per def id by instancedBlockout). */
export function blockoutShape(def) {
	const spec = typeof def.shape === 'string' ? { kind: def.shape } : def.shape ?? { kind: 'box' };
	const build = SHAPES[spec.kind] ?? SHAPES.box;
	if (!SHAPES[spec.kind]) console.warn(`Blockout "${spec.kind}" of ${def.id} is unknown: a box stands in`);
	const P = new Parts(CATEGORY_COLORS[def.category] ?? '#888888');
	build(P, def.size, spec);
	return { geometry: P.merge(), anchors: P.anchors };
}

/** The one blockout material: vertex colours (category tones), matte, flat shaded. */
export function blockoutMaterial() {
	return new THREE.MeshStandardMaterial({ name: 'Act I blockout (category colours)', vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true });
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/** Instance matrix of a placed item (position, yaw, scale). */
export function placementMatrix(it, out = _m) {
	return out.compose(_p.set(it.x, it.y, it.z), _q.setFromAxisAngle(_up, it.yaw), _s.set(it.scale[0], it.scale[1], it.scale[2]));
}

/**
 * One InstancedMesh for every placement of an asset (items: world placements { x, y, z, yaw, scale, uid, name }). userData: assetId, assetName, status,
 * instances (uid / name per instance), anchors (shape-local). Solid (blocks the hero) when the def collides.
 */
export function instancedBlockout(def, items, material, shapeCache = new Map()) {
	let shape = shapeCache.get(def.id);
	if (!shape) shapeCache.set(def.id, (shape = blockoutShape(def)));
	const mesh = new THREE.InstancedMesh(shape.geometry, material, items.length);
	items.forEach((it, i) => mesh.setMatrixAt(i, placementMatrix(it)));
	mesh.instanceMatrix.needsUpdate = true;
	mesh.computeBoundingSphere();
	mesh.name = `Blockout · ${def.id} · ${def.name}`;
	mesh.castShadow = mesh.receiveShadow = true;
	Object.assign(mesh.userData, { assetId: def.id, assetName: def.name, status: def.status, instances: items.map((it) => ({ uid: it.uid, name: it.name })), anchors: shape.anchors });
	if (def.collide !== false) mesh.userData.labSolid = true;
	return mesh;
}

// ---- labels ------------------------------------------------------------------------------------------------------------------------------------
/**
 * Floating labels from one canvas atlas: entries { text, sub, x, y, z, color, width (m) } → a group of camera-facing quads (call `face(camera)` each
 * frame; Meshes, not Sprites: raycasts without a camera stay safe). Cells 512 × 72 px, 4 per row; the atlas grows to fit (max 2048 × 4096).
 */
export function labelAtlas(entries, { width = 5.5 } = {}) {
	const cols = 4;
	const cw = 512;
	const ch = 72;
	const rows = Math.max(1, Math.ceil(entries.length / cols));
	const canvas = document.createElement('canvas');
	canvas.width = cw * cols;
	canvas.height = Math.min(4096, THREE.MathUtils.ceilPowerOfTwo(rows * ch));
	const g = canvas.getContext('2d');
	const max = Math.floor(canvas.height / ch) * cols;
	entries.slice(0, max).forEach((e, i) => {
		const x = (i % cols) * cw;
		const y = Math.floor(i / cols) * ch;
		g.fillStyle = 'rgba(10, 11, 12, 0.74)';
		g.beginPath();
		g.roundRect(x + 3, y + 3, cw - 6, ch - 6, 12);
		g.fill();
		g.fillStyle = e.color ?? '#f1e9d4';
		g.fillRect(x + 3, y + 3, 8, ch - 6);
		g.textAlign = 'left';
		g.fillStyle = '#f1e9d4';
		g.font = `600 ${e.sub ? 27 : 31}px system-ui, "Segoe UI", sans-serif`;
		g.fillText(e.text, x + 20, y + (e.sub ? 33 : 46), cw - 30);
		if (e.sub) {
			g.fillStyle = '#b8c2b0';
			g.font = '22px system-ui, "Segoe UI", sans-serif';
			g.fillText(e.sub, x + 20, y + 60, cw - 30);
		}
	});
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false, depthTest: true, fog: false });
	const group = new THREE.Group();
	group.name = 'Labels';
	const geometries = [];
	entries.slice(0, max).forEach((e, i) => {
		const u0 = (i % cols) / cols;
		const v1 = 1 - (Math.floor(i / cols) * ch) / canvas.height;
		const v0 = v1 - ch / canvas.height;
		const wq = e.width ?? width;
		const geo = new THREE.PlaneGeometry(wq, (wq * ch) / cw);
		geo.translate(0, (wq * ch) / cw / 2, 0);
		const uv = geo.attributes.uv;
		for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / cols, v0 + uv.getY(k) * (v1 - v0));
		const mesh = new THREE.Mesh(geo, material);
		mesh.position.set(e.x, e.y, e.z);
		mesh.renderOrder = 6;
		mesh.userData.labNoPick = mesh.userData.labNoCollide = mesh.userData.labNoView = true;
		group.add(mesh);
		geometries.push(geo);
	});
	group.userData.labNoPick = group.userData.labNoCollide = true;
	return {
		group,
		/** Turn every label to the camera and keep it readable from afar (scale grows with the distance, 1× within 40 m, up to 6×; call per frame while visible). */
		face(camera) {
			for (const m of group.children) {
				m.quaternion.copy(camera.quaternion);
				m.scale.setScalar(THREE.MathUtils.clamp(camera.position.distanceTo(m.position) / 40, 1, 6));
			}
		},
		dispose() {
			for (const g2 of geometries) g2.dispose();
			material.dispose();
			texture.dispose();
		},
	};
}

/** A 1.8 m person marker (NPC spot): capsule + head, the NPC marker colour. */
export function personMarker(color = CATEGORY_COLORS.npc) {
	const P = new Parts(color);
	P.cyl(0.24, 0.28, 1.35, {}, 10);
	P.blob(0.17, 0.2, 0.17, { y: 1.58 });
	return P.merge();
}

// ASHLAR · Act I base maps — blockouts of the INTERIOR engine (THREE side; pure plan: ./interior.js, build: ./interiorBuild.js). Every model a map still lacks
// is drawn as simple massing at its real size (the KIT size, read from the concept sheet with H = 1.8 m), one flat muted colour per category (the SPEC §6b
// values, shared with the outdoor engine's blockout.js), high roughness, no metalness. A KIT entry's `shape` is a list of parts in the asset's frame (pivot
// at the bottom centre, front = +z): box · cyl · cone · sphere · gable (a house: walls + roof) · prism (a roof) · mound (a half ellipsoid) · arc (a rocker /
// bent bar) · drape (a hanging cloth panel with folds, tied back with `tie`) · plane (a flat sheet on the floor) · glow (an emitting part: lamp globes,
// windows; its colour follows the scene's light level). Parts carry their own `cat` when an asset mixes materials (wood base + linen top); `open: true`
// keeps a part walk-through in Play (pendants, cords) while its asset blocks; KIT `openCats` does the same for whole categories (cloth).
// All placements of one asset share one geometry per category and one InstancedMesh per (asset, category, solid | open | void); swapping a blockout for its
// final GLB is the asset's `model` field (the build instances the GLB instead). userData.assetId / assetName ride on every mesh; labels are instanced
// camera-facing quads (one canvas per asset: id + short name), off by default.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Blockout colours by category (SPEC §6b; accent / skin / shade are the few extra tones the monster and linen blockouts need). */
export const CATEGORY_COLORS = {
	building: '#8a8478',
	structure: '#6e6255',
	vegetation: '#55624f',
	rock: '#7b8088',
	prop: '#9a8c6e',
	linen: '#e4e0d6', // Mercy's linen: the one allowed clean white
	story: '#a39b8a',
	npc: '#c9a86a',
	encounter: '#8e3b3b',
	accent: '#9a3a36', // a tiny poppy-red trim (the concept's hem bands)
	skin: '#d6c4b4', // B05's soft white hands (#EBD6C4, muted)
	shade: '#4b4552', // B05's grey-violet inner robe
};
export const CATEGORY_LABELS = {
	building: 'Nhà / công trình', structure: 'Kết cấu · rào · lối đi', vegetation: 'Cây cỏ', rock: 'Đá', prop: 'Prop · đồ đạc', linen: 'Vải lanh Mercy (trắng duy nhất)',
	story: 'Cốt truyện · mốc', npc: 'Chỗ NPC', encounter: 'Chạm trán · quái',
};
export const MARKER_COLORS = { encounter: '#8e3b3b', boss: '#b0413c', telegraph: '#1a1416', rite: '#7d6aa8', landmark: '#a39b8a', sightline: '#c9c2a8', vignette: '#8aa39b', npc: '#c9a86a', exit: '#6f9fbf', lullaby: '#c8b8d8', note: '#9aa0a6', patrol: '#d9c9a3', escort: '#8fc7a0', bell: '#c4a9d8' };

const DEG = Math.PI / 180;
/** A faint self-light for thin cloth (and skin) blockouts, as a fraction of their colour. */
const TRANSLUCENT = { linen: 0.07, skin: 0.04 };
const UP = new THREE.Vector3(0, 1, 0);

/** Keep position / normal / uv only, non-indexed (mergeGeometries needs the same attributes everywhere). */
function clean(g) {
	const n = g.index ? g.toNonIndexed() : g;
	for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
	if (!n.attributes.normal) n.computeVertexNormals();
	if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
	if (n !== g) g.dispose();
	return n;
}

function extrudeProfile(points, depth) {
	const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
	const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
	g.translate(0, 0, -depth / 2);
	return g;
}

/** A hanging cloth panel: two sheets (front / back) with vertical folds, pinched at `tie` (0..1 of the height, null = straight). Centred, w × h × d. */
function drapeGeometry(w, h, d, tie = null, folds = 3) {
	const nx = 18;
	const ny = 10;
	const pos = [];
	const idx = [];
	const sheet = (offset, flip) => {
		const base = pos.length / 3;
		for (let j = 0; j <= ny; j++) {
			const v = j / ny; // 0 = hem, 1 = rod
			let pinch = 1;
			if (tie !== null) pinch = v < tie ? THREE.MathUtils.lerp(0.75, 0.32, v / tie) : THREE.MathUtils.lerp(0.32, 1, (v - tie) / (1 - tie));
			for (let i = 0; i <= nx; i++) {
				const u = i / nx - 0.5;
				const x = u * w * pinch;
				const z = Math.sin((i / nx) * folds * 2 * Math.PI) * (d / 2 - 0.03) * (0.55 + 0.45 * pinch) + offset;
				pos.push(x, v * h - h / 2, z);
			}
		}
		for (let j = 0; j < ny; j++) {
			for (let i = 0; i < nx; i++) {
				const a = base + j * (nx + 1) + i;
				const b = a + 1;
				const c = a + nx + 1;
				const e = c + 1;
				if (flip) idx.push(a, c, b, b, c, e);
				else idx.push(a, b, c, b, e, c);
			}
		}
	};
	sheet(0.025, false);
	sheet(-0.025, true);
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setIndex(idx);
	g.computeVertexNormals();
	return g;
}

/** A rocker / bent bar along x: the underside is a circular-ish arc that rises `lift` × h at the ends; w long, h tall, d thick. Centred. */
function arcGeometry(w, h, d, lift = 0.55) {
	const n = 16;
	const pts = [];
	const bar = h * (1 - lift);
	for (let i = 0; i <= n; i++) {
		const x = (i / n - 0.5) * w;
		pts.push([x, ((x / (w / 2)) ** 2) * h * lift - h / 2]);
	}
	for (let i = n; i >= 0; i--) {
		const x = (i / n - 0.5) * w;
		pts.push([x, ((x / (w / 2)) ** 2) * h * lift - h / 2 + bar]);
	}
	return extrudeProfile(pts, d);
}

/** One primitive, centred at the origin with size [w, h, d] (gable / prism / mound / plane sit on y = −h / 2 like the others). */
export function primitive(p) {
	const [w, h, d] = p.size ?? [1, 1, 1];
	let g;
	switch (p.p) {
		case 'cyl':
			g = new THREE.CylinderGeometry(w / 2, w / 2, h, p.seg ?? 10, 1);
			g.scale(1, 1, d / w);
			break;
		case 'cone':
			g = new THREE.CylinderGeometry((w / 2) * (p.top ?? 0), w / 2, h, p.seg ?? 12, 1);
			g.scale(1, 1, d / w);
			break;
		case 'sphere':
		case 'glow':
			g = new THREE.SphereGeometry(0.5, p.seg ?? 12, Math.max(4, Math.round((p.seg ?? 12) * 0.6)));
			g.scale(w, h, d);
			break;
		case 'gable': {
			const e = p.eave ?? 0.6; // the walls' share of the height
			g = extrudeProfile([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, -h / 2 + h * e], [0, h / 2], [-w / 2, -h / 2 + h * e]], d);
			break;
		}
		case 'prism':
			g = extrudeProfile([[-w / 2, -h / 2], [w / 2, -h / 2], [0, h / 2]], d);
			break;
		case 'mound':
			g = new THREE.SphereGeometry(0.5, p.seg ?? 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
			g.scale(w, h * 2, d);
			g.translate(0, -h / 2, 0);
			break;
		case 'arc':
			g = arcGeometry(w, h, d, p.lift ?? 0.55);
			break;
		case 'drape':
			g = drapeGeometry(w, h, d, p.tie ?? null, p.folds ?? 3);
			break;
		case 'plane':
			g = new THREE.BoxGeometry(w, Math.max(h, 0.01), d);
			break;
		default:
			g = new THREE.BoxGeometry(w, h, d);
	}
	g = clean(g);
	const [rx, ry, rz] = (p.rot ?? [0, 0, 0]).map((v) => v * DEG);
	const m = new THREE.Matrix4().compose(new THREE.Vector3(...(p.at ?? [0, h / 2, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
	g.applyMatrix4(m);
	return g;
}

/** The geometries of one KIT entry: Map(category, or `${category}~open` for walk-through parts → BufferGeometry) in the asset frame (no shape → a box of the asset size). */
export function assetGeometries(k) {
	const parts = k.shape?.length ? k.shape : [{ p: 'box', at: [0, k.size[1] / 2, 0], size: k.size }];
	const byCat = new Map();
	for (const part of parts) {
		const cat = part.p === 'glow' ? 'glow' : part.cat ?? k.category ?? 'prop';
		const key = part.open ? `${cat}~open` : cat; // part.open: drawn in its category's colour but walk-through (pendants, cords)
		if (!byCat.has(key)) byCat.set(key, []);
		byCat.get(key).push(primitive(part));
	}
	const out = new Map();
	for (const [cat, list] of byCat) {
		const merged = list.length === 1 ? list[0] : mergeGeometries(list);
		if (merged !== list[0]) for (const g of list) g.dispose();
		merged.computeBoundingSphere();
		out.set(cat, merged);
	}
	return out;
}

/** A label canvas (asset id + short name), as a texture. */
export function labelTexture(title, sub = '', { color = '#f1e9d4', bg = 'rgba(8, 9, 11, 0.74)', subColor = '#b7b1a2' } = {}) {
	const c = document.createElement('canvas');
	c.width = 512;
	c.height = sub ? 128 : 84;
	const g = c.getContext('2d');
	g.fillStyle = bg;
	g.beginPath();
	g.roundRect(3, 3, c.width - 6, c.height - 6, 16);
	g.fill();
	g.textAlign = 'center';
	g.fillStyle = color;
	g.font = '600 40px system-ui, "Segoe UI", sans-serif';
	g.fillText(title, c.width / 2, 54, c.width - 30);
	if (sub) {
		g.fillStyle = subColor;
		g.font = '30px system-ui, "Segoe UI", sans-serif';
		g.fillText(sub, c.width / 2, 100, c.width - 30);
	}
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.anisotropy = 4;
	tex.userData.aspect = c.width / c.height;
	return tex;
}

/**
 * Camera-facing instanced label quads: add(texture, key) once per text, place(key, x, y, z) per spot, update(camera) every frame (the quads copy the
 * camera's orientation; a Sprite would break Raycaster calls made without a camera).
 */
export class LabelSet {
	constructor(name, height = 0.7) {
		this.group = new THREE.Group();
		this.group.name = name;
		this.group.userData.labNoPick = this.group.userData.labNoView = this.group.userData.labNoCollide = true;
		this.height = height;
		this.kinds = new Map(); // key -> { texture, spots: [] , mesh }
		this.materials = [];
		this.geometries = [];
		this._m = new THREE.Matrix4();
		this._s = new THREE.Vector3();
		this._p = new THREE.Vector3();
	}

	add(key, texture, scale = 1) {
		if (!this.kinds.has(key)) this.kinds.set(key, { texture, spots: [], scale });
		return this.kinds.get(key);
	}

	place(key, x, y, z) {
		this.kinds.get(key)?.spots.push([x, y, z]);
	}

	build() {
		for (const [key, k] of this.kinds) {
			if (!k.spots.length) continue;
			const aspect = k.texture.userData.aspect ?? 4;
			const h = this.height * k.scale;
			const geometry = new THREE.PlaneGeometry(h * aspect, h);
			const material = new THREE.MeshBasicMaterial({ map: k.texture, transparent: true, depthWrite: false, depthTest: false, toneMapped: false, fog: false });
			this.geometries.push(geometry);
			this.materials.push(material);
			const mesh = new THREE.InstancedMesh(geometry, material, k.spots.length);
			mesh.name = `Label · ${key}`;
			mesh.frustumCulled = false;
			mesh.renderOrder = 20;
			mesh.userData.labNoPick = mesh.userData.labNoView = mesh.userData.labNoCollide = true;
			k.mesh = mesh;
			this.group.add(mesh);
		}
	}

	/** Face the camera; beyond `near` m the quads grow with the distance, so a label keeps about the same size on screen in the far views. */
	update(camera, near = 14) {
		if (!this.group.visible) return;
		for (let o = this.group.parent; o; o = o.parent) if (!o.visible) return;
		const q = camera.quaternion;
		const c = camera.position;
		for (const k of this.kinds.values()) {
			if (!k.mesh) continue;
			k.spots.forEach(([x, y, z], i) => {
				const f = Math.max(1, Math.hypot(x - c.x, y - c.y, z - c.z) / near);
				k.mesh.setMatrixAt(i, this._m.compose(this._p.set(x, y + (f - 1) * this.height * 0.5, z), q, this._s.set(f, f, f)));
			});
			k.mesh.instanceMatrix.needsUpdate = true;
		}
	}

	dispose() {
		for (const g of this.geometries) g.dispose();
		for (const m of this.materials) m.dispose();
		for (const k of this.kinds.values()) k.texture.dispose();
	}
}

/**
 * The blockouts of a compiled interior: one InstancedMesh per (asset, category, bucket), bucket = solid (blocks the hero: labSolid) | open (walk-through) |
 * void (drawn in the dark past the floor, darkened with the distance). `fade` = the camera wall fade effect (applied to every material); `glow` = the
 * emitting parts' material (instance colour = the light's level, set by the build).
 */
export class BlockoutSet {
	constructor({ model, kit, fade = null, skip = () => false }) {
		this.model = model;
		this.kit = kit;
		this.fade = fade;
		this.group = new THREE.Group();
		this.group.name = 'Blockouts (missing models, real size)';
		this.materials = new Map();
		this.geometries = new Map(); // assetId -> Map(cat -> geometry)
		this.meshes = [];
		this.glowMeshes = []; // { mesh, placements: [index] }
		this.skip = skip;
		this._m = new THREE.Matrix4();
		this._q = new THREE.Quaternion();
		this._c = new THREE.Color();
	}

	material(cat) {
		if (!this.materials.has(cat)) {
			let m;
			if (cat === 'glow') m = new THREE.MeshBasicMaterial({ name: 'Blockout · glow', color: 0xffffff, toneMapped: false });
			else {
				const color = new THREE.Color(CATEGORY_COLORS[cat] ?? (/^#[0-9a-f]{6}$/i.test(cat) ? cat : CATEGORY_COLORS.prop)); // a '#rrggbb' part cat: its own muted tone (clothes, roots, brick)
				m = new THREE.MeshStandardMaterial({ name: `Blockout · ${cat}`, color, roughness: 0.92, metalness: 0 });
				if (TRANSLUCENT[cat]) m.emissive = color.clone().multiplyScalar(TRANSLUCENT[cat]); // cloth lets a little light through: backlit linen must not read black
				if (this.fade) m = this.fade.apply(m);
			}
			this.materials.set(cat, m);
		}
		return this.materials.get(cat);
	}

	geometriesOf(id) {
		if (!this.geometries.has(id)) this.geometries.set(id, assetGeometries(this.kit[id]));
		return this.geometries.get(id);
	}

	/** Build the meshes for every placement whose asset has no model (or whose model failed to load). */
	build() {
		const groups = new Map(); // `${asset}|${bucket}` -> placements
		for (const p of this.model.placements) {
			const k = this.kit[p.asset];
			if (!k || this.skip(p, k)) continue;
			const bucket = p.void ? 'void' : p.solid ? 'solid' : 'open';
			const key = `${p.asset}|${bucket}`;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(p);
		}
		for (const [key, list] of groups) {
			const [id, bucket] = key.split('|');
			const k = this.kit[id];
			for (const [part, geometry] of this.geometriesOf(id)) {
				const [cat, flag] = part.split('~');
				const mesh = new THREE.InstancedMesh(geometry, this.material(cat), list.length);
				mesh.name = `${id} ${k.name} · ${cat}${flag ? ' (walk-through parts)' : ''}${bucket === 'solid' ? '' : ` (${bucket})`}`;
				mesh.userData.assetId = id;
				mesh.userData.assetName = k.name;
				mesh.userData.blockout = true;
				mesh.castShadow = cat !== 'glow' && bucket !== 'void';
				mesh.receiveShadow = cat !== 'glow';
				if (bucket === 'solid' && flag !== 'open' && !k.openCats?.includes(cat) && cat !== 'glow') mesh.userData.labSolid = true; // cloth (openCats) and open parts stay walk-through
				if (bucket === 'void') mesh.userData.labNoCollide = mesh.userData.labNoPick = true;
				const colors = cat === 'glow' || bucket === 'void' ? new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3).fill(1), 3) : null;
				if (colors) mesh.instanceColor = colors;
				list.forEach((p, i) => {
					this._q.setFromAxisAngle(UP, p.yaw);
					mesh.setMatrixAt(i, this._m.compose(new THREE.Vector3(p.x, p.y, p.z), this._q, new THREE.Vector3(p.scale, p.scale, p.scale)));
					if (bucket === 'void' && cat !== 'glow') {
						const dark = voidShade(this.model, p);
						colors.setXYZ(i, dark, dark, dark);
					}
				});
				mesh.instanceMatrix.needsUpdate = true;
				mesh.computeBoundingSphere();
				this.group.add(mesh);
				this.meshes.push(mesh);
				if (cat === 'glow') this.glowMeshes.push({ mesh, placements: list.map((p) => p.index) });
			}
		}
	}

	dispose() {
		for (const map of this.geometries.values()) for (const g of map.values()) g.dispose();
		for (const m of this.materials.values()) m.dispose();
	}
}

/** How dark a void placement is drawn: 1 at the floor's edge, fading to ~0.05 by 14 m out (the pseudo-infinite rows sink into the black). */
export function voidShade(model, p) {
	const d = -model.wallDistance(p.x, p.z);
	const t = THREE.MathUtils.smoothstep(d, 0, 14);
	return THREE.MathUtils.lerp(0.85, 0.05, t);
}

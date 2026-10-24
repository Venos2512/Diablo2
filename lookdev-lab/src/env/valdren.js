// Valdren Core Kit and the Weeping Fields population kits (Redbound, Blightbeasts), built in code for the lab.
//
// Colour rules of The Dying Gods · Act I (rule sheet "Quy tắc màu cho gameplay và môi trường"):
// world colour = context, creature colour = identity, effect colour = gameplay information.
//   VALDREN   base palette of every Act I exterior. The sheet names the families; the hex values are the lab's
//             concept proposal (after legacy/art-direction/04 Act I values) — change them here, every locked material follows.
//   DECOR     population set dressing (Redbound camp, Remnant corruption, Blightbeast signs): environment tier,
//             kept darker and less saturated than the creatures that own them.
//   FUNCTION  gameplay signal palette of the sheet: [base, highlight].
//   PRIORITY  the sheet's visual priority scale (relative, not shader values).
//   CLASSES   the four readable object classes of section VI (debug colours for the class view).
//
// Materials are "palette locked": a forged texture keeps its detail and its average albedo is moved onto the swatch
// (material colour = swatch / texture mean, per channel in linear space), so the palette is the single source of truth.
// Kit builders return Parts (geometry lists per material key, local space, y = 0 = ground / floor level) that a scene
// drops into a StaticBatch; StaticBatch adds world-space UVs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getForge } from './materials.js';
import { rng, noise2, taperedTube, archPanel, rock } from './kit.js';

export const VALDREN = {
	earth: '#4a4234', mud: '#2f2a23', path: '#5c5242',
	moss: '#3b4333', mossDark: '#2a3125', straw: '#615b48',
	stone: '#5c5f5a', limestone: '#6e6b61', rock: '#55554e', daub: '#5d5a52',
	wetWood: '#4b4135', timber: '#382c22', roof: '#2d2a27', greyWood: '#69655b', bark: '#3d352d',
	iron: '#2d2c2a', rust: '#694a35',
	linen: '#7d7666', burlap: '#5f5646', leather: '#56412f',
};

/** Palette families of the rule sheet (section II.1) → swatch keys. */
export const VALDREN_GROUPS = [
	['Đất và đường', 'nâu đất lạnh, bùn, đường mòn', ['earth', 'mud', 'path']],
	['Cỏ và thảm thực vật', 'xanh rêu giảm bão hoà', ['moss', 'mossDark', 'straw']],
	['Đá và kiến trúc', 'đá xám, đá vôi già', ['stone', 'limestone', 'rock', 'daub']],
	['Gỗ và mái', 'gỗ ngấm nước, mái cũ', ['wetWood', 'timber', 'roof', 'greyWood', 'bark']],
	['Sắt và kim loại', 'sắt đen, gỉ nâu', ['iron', 'rust']],
	['Vải và vật dụng', 'lanh bẩn, vải thô, da', ['linen', 'burlap', 'leather']],
];

export const DECOR = {
	// Redbound camp (Bloodbound Settlements): rotten wood, blood red, ivory bone, dark earth. Bone stays well below
	// the interaction ivory in value (L* ~53 vs ~83) so bone stakes never read as something to click. An ambush nest is
	// rotten straw, never the clean straw of a haystack (rule VI).
	hide: '#54402f', hideGrey: '#4a433b', redCloth: '#5e2427', bone: '#857d6b', rotStraw: '#3f3b2f',
	// Remnant corruption (god-blood in the environment): dark and low chroma; only the well has a slow pulse.
	vein: '#4a1a1c', wellBlood: '#3c0f11', sac: '#3e1418',
	// Blightbeast signs: natural animal colours.
	fur: '#4a4540', carcass: '#3d3229', flesh: '#3a2421', crow: '#1b1c1f', hollow: '#0d0c0b',
};

export const FUNCTION = {
	danger: { label: 'Nguy hiểm tức thời', use: 'vùng đòn, bẫy kích hoạt, cảnh báo sát thương', colors: ['#e66a39', '#ffb16b'] },
	blood: { label: 'Thần huyết / Blood', use: 'sát thương thần huyết, chảy máu, ma thuật huyết', colors: ['#b7353e', '#ea7180'] },
	poison: { label: 'Độc / Disease', use: 'độc tố, khí bệnh, dịch sinh vật, hoá chất', colors: ['#90af48', '#c2d76b'] },
	spirit: { label: 'Linh hồn / Memory', use: 'ma thuật linh hồn, ký ức, hiện tượng siêu thực', colors: ['#658fc0', '#a2c4e2'] },
	ritual: { label: 'Thần thánh / Ritual', use: 'phong ấn, thánh thuật, nghi lễ Consecrated', colors: ['#d7b46b', '#f0deab'] },
	interact: { label: 'Điểm tương tác', use: 'vật kích hoạt được, cơ chế quan trọng, đường nhiệm vụ', colors: ['#e2cf9b', '#fff0cf'] },
};

export const PRIORITY = [
	['Môi trường nền', 25],
	['Công trình và vật cản', 40],
	['Quái thường', 60],
	['Quái tinh anh / Boss', 75],
	['Hiệu ứng gameplay quan trọng', 90],
	['Cảnh báo nguy hiểm tức thời', 100],
];

export const CLASSES = {
	obstacle: { label: 'Vật cản cố định', note: 'tối, chắc, không tín hiệu', color: '#5f6a76' },
	destructible: { label: 'Phá huỷ được', note: 'vết nứt, kết cấu yếu — không dựa vào màu vàng', color: '#3fb8a8' },
	interactive: { label: 'Tương tác', note: 'ánh ngà ấm, hình khối riêng, dấu hiệu khi lại gần', color: FUNCTION.interact.colors[0] },
	hazard: { label: 'Nguy hiểm', note: 'tín hiệu hoạt động + hình cảnh báo + phản hồi', color: FUNCTION.danger.colors[0] },
};

// ---------------------------------------------------------------------------------------------
// Palette lock

const LIN8 = Float32Array.from({ length: 256 }, (_, i) => {
	const c = i / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

const toSrgb8 = (v) => {
	const c = Math.min(1, Math.max(0, v));
	return Math.round((c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
};

/** RGBA8 pixels of a texture: DataTexture data, or a 64² resample of an image (GLB textures). Null if unreadable. */
function texturePixels(texture) {
	const img = texture?.image;
	if (!img) return null;
	if (img.data && img.width && img.height) return img;
	try {
		const c = new OffscreenCanvas(64, 64);
		const g = c.getContext('2d', { willReadFrequently: true });
		g.drawImage(img, 0, 0, 64, 64);
		return g.getImageData(0, 0, 64, 64);
	} catch {
		return null;
	}
}

/** Mean albedo (linear) of an sRGB RGBA8 texture (white if it cannot be read). */
export function textureMean(texture) {
	const pixels = texturePixels(texture);
	if (!pixels) return new THREE.Color(1, 1, 1);
	const { data, width, height } = pixels;
	const count = width * height;
	const step = Math.max(1, Math.floor(count / 65536));
	let r = 0;
	let g = 0;
	let b = 0;
	let n = 0;
	for (let p = 0; p < count; p += step) {
		r += LIN8[data[p * 4]];
		g += LIN8[data[p * 4 + 1]];
		b += LIN8[data[p * 4 + 2]];
		n++;
	}
	return new THREE.Color(r / n, g / n, b / n);
}

/** Material colour that moves a texture's mean albedo onto `hex`. */
export function lockColor(texture, hex) {
	const mean = textureMean(texture);
	const target = new THREE.Color(hex);
	return new THREE.Color(target.r / Math.max(1e-4, mean.r), target.g / Math.max(1e-4, mean.g), target.b / Math.max(1e-4, mean.b));
}

/**
 * Strong palette lock: a copy of the texture whose pixels take the swatch's hue and chroma, keeping their own
 * luminance variation (the detail) — `keep` = share of the original colour mixed back in. A per-channel gain alone
 * cannot do it when a texture's hue shifts with brightness (painted wood: dark grey-brown, yellow highlights).
 * Works on DataTextures and on image textures (GLB kits); returns the source if its pixels cannot be read.
 */
export function lockTexture(texture, hex, keep = 0.3) {
	const img = texture?.image;
	if (!img) return texture;
	let data;
	let width;
	let height;
	if (img.data) ({ data, width, height } = img);
	else {
		try {
			width = img.width;
			height = img.height;
			const c = new OffscreenCanvas(width, height);
			const g = c.getContext('2d', { willReadFrequently: true });
			g.drawImage(img, 0, 0);
			data = g.getImageData(0, 0, width, height).data;
		} catch {
			return texture;
		}
	}
	const mean = textureMean(texture);
	const target = new THREE.Color(hex);
	const gain = [target.r / Math.max(1e-4, mean.r), target.g / Math.max(1e-4, mean.g), target.b / Math.max(1e-4, mean.b)];
	const my = Math.max(1e-4, 0.2126 * mean.r + 0.7152 * mean.g + 0.0722 * mean.b);
	const t = [target.r, target.g, target.b];
	const out = new Uint8Array(width * height * 4);
	for (let p = 0; p < width * height * 4; p += 4) {
		const r = LIN8[data[p]];
		const g = LIN8[data[p + 1]];
		const b = LIN8[data[p + 2]];
		const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / my;
		out[p] = toSrgb8(t[0] * y * (1 - keep) + r * gain[0] * keep);
		out[p + 1] = toSrgb8(t[1] * y * (1 - keep) + g * gain[1] * keep);
		out[p + 2] = toSrgb8(t[2] * y * (1 - keep) + b * gain[2] * keep);
		out[p + 3] = data[p + 3];
	}
	const tex = new THREE.DataTexture(out, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
	for (const key of ['wrapS', 'wrapT', 'magFilter', 'minFilter', 'anisotropy', 'colorSpace', 'flipY', 'channel']) tex[key] = texture[key];
	tex.repeat.copy(texture.repeat);
	tex.offset.copy(texture.offset);
	tex.generateMipmaps = true;
	if (tex.minFilter === THREE.LinearFilter || tex.minFilter === THREE.NearestFilter) tex.minFilter = THREE.LinearMipmapLinearFilter;
	tex.name = `${texture.name || 'texture'} · locked ${hex}`;
	tex.needsUpdate = true;
	return tex;
}

/**
 * Terrain layer sets with their albedo moved onto palette targets (one hex per layer: dirt, wet dirt, grass).
 * Per-pixel linear gain = target / layer mean: the painting keeps its detail, its average becomes the swatch.
 * Normal and ORM maps are shared with the source sets.
 */
export function lockTerrainSets(sets, targets) {
	return sets.map((set, i) => {
		const src = set.map.image;
		const mean = textureMean(set.map);
		const target = new THREE.Color(targets[i]);
		const gain = [target.r / Math.max(1e-4, mean.r), target.g / Math.max(1e-4, mean.g), target.b / Math.max(1e-4, mean.b)];
		const out = new Uint8Array(src.data.length);
		for (let p = 0; p < src.data.length; p += 4) {
			out[p] = toSrgb8(LIN8[src.data[p]] * gain[0]);
			out[p + 1] = toSrgb8(LIN8[src.data[p + 1]] * gain[1]);
			out[p + 2] = toSrgb8(LIN8[src.data[p + 2]] * gain[2]);
			out[p + 3] = 255;
		}
		const map = new THREE.DataTexture(out, src.width, src.height, THREE.RGBAFormat, THREE.UnsignedByteType);
		for (const key of ['wrapS', 'wrapT', 'generateMipmaps', 'minFilter', 'magFilter', 'anisotropy', 'colorSpace']) map[key] = set.map[key];
		map.name = `${set.map.name} · Valdren lock`;
		map.needsUpdate = true;
		return { ...set, map, recipe: { ...set.recipe, label: `${set.recipe.label} · Valdren lock` } };
	});
}

/** The set's textures with features `scale` times their forged size (shares the image data). */
function scaledSet(set, scale) {
	const out = {};
	for (const key of ['map', 'normalMap', 'ormMap']) {
		const tex = set[key].clone();
		tex.repeat.copy(set[key].repeat).divideScalar(scale);
		tex.needsUpdate = true;
		out[key] = tex;
	}
	return out;
}

/**
 * Shared Valdren materials, created once per app. Forged sets are locked to VALDREN / DECOR swatches; small props
 * use flat materials. userData.swatch keeps the target for the palette panel.
 */
export function valdrenMaterials(app) {
	if (app._valdrenMaterials) return app._valdrenMaterials;
	const forge = getForge(app);
	const locked = (recipe, hex, name, { scale = 1, strong = 0, ...extra } = {}) => {
		const set = forge.get(recipe);
		const tex = scale === 1 ? set : scaledSet(set, scale);
		const map = strong ? lockTexture(tex.map, hex, 1 - strong) : tex.map;
		const material = new THREE.MeshStandardMaterial({
			name,
			map,
			normalMap: tex.normalMap,
			aoMap: tex.ormMap,
			roughnessMap: tex.ormMap,
			metalnessMap: tex.ormMap,
			roughness: 1,
			metalness: 1,
			color: strong ? new THREE.Color(1, 1, 1) : lockColor(set.map, hex),
			...extra,
		});
		material.userData.swatch = hex;
		return material;
	};
	const plaster = (hex, name) => {
		const set = scaledSet(forge.get('dirt'), 0.9);
		const material = new THREE.MeshStandardMaterial({ name, color: hex, roughness: 0.95, metalness: 0, normalMap: set.normalMap, normalScale: new THREE.Vector2(0.6, 0.6) });
		material.userData.swatch = hex;
		return material;
	};
	const flat = (hex, name, rough = 0.9, extra = {}) => {
		const material = new THREE.MeshStandardMaterial({ name, color: hex, roughness: rough, metalness: 0, ...extra });
		material.userData.swatch = hex;
		return material;
	};
	const V = VALDREN;
	const D = DECOR;
	const m = {
		stone: locked('stoneBricks', V.stone, 'Valdren stone wall', { scale: 0.6 }),
		cobble: locked('cobblestone', V.rock, 'Valdren cobbles'),
		limestone: locked('stoneWeathered', V.limestone, 'Valdren old limestone'),
		rock: locked('stoneWeathered', V.rock, 'Valdren rock', { scale: 1.6 }),
		daub: plaster(V.daub, 'Valdren daub (lime plaster)'),
		roof: locked('stoneBricks', V.roof, 'Valdren slate roof', { scale: 0.38 }),
		timber: locked('wood', V.timber, 'Valdren timber frame'),
		plank: locked('wood', V.wetWood, 'Valdren wet planks', { strong: 0.5 }),
		greyWood: locked('wood', V.greyWood, 'Valdren grey fence wood', { strong: 0.75 }),
		bark: locked('wood', V.bark, 'Valdren dead bark'),
		charred: locked('wood', '#201b17', 'Charred wood'),
		iron: locked('iron', V.iron, 'Valdren black iron'),
		rust: locked('iron', V.rust, 'Valdren rust'),
		hay: locked('grass', V.straw, 'Valdren straw', { scale: 0.5, metalness: 0 }),
		rotStraw: locked('grass', DECOR.rotStraw, 'Rotten straw (ambush nest)', { scale: 0.7, metalness: 0 }),
		linen: flat(V.linen, 'Dirty linen', 0.95),
		burlap: flat(V.burlap, 'Coarse cloth', 0.97),
		leather: flat(V.leather, 'Leather', 0.75),
		hollow: flat(D.hollow, 'Dark hollow', 1),
		clod: flat(V.mud, 'Earth clods', 0.95),
		// Redbound camp
		bone: flat(D.bone, 'Redbound camp bone', 0.72),
		redCloth: flat(D.redCloth, 'Redbound torn cloth', 0.92, { side: THREE.DoubleSide }),
		hide: flat(D.hide, 'Patchwork hide', 0.85, { side: THREE.DoubleSide }),
		hideGrey: flat(D.hideGrey, 'Patchwork hide (grey)', 0.85, { side: THREE.DoubleSide }),
		// Remnant corruption
		vein: flat(D.vein, 'Remnant vein', 0.62),
		wellBlood: flat(D.wellBlood, 'Blood well liquid', 0.22, { emissive: new THREE.Color('#6e1414'), emissiveIntensity: 0.12, envMapIntensity: 0.35 }),
		water: flat('#1d2220', 'Well water', 0.06),
		// Blightbeast signs
		fur: flat(D.fur, 'Fur tufts', 1),
		carcass: flat(D.carcass, 'Carcass hide', 0.8),
		flesh: flat(D.flesh, 'Carcass flesh', 0.55),
		crow: flat(D.crow, 'Crow', 0.55),
		// Light sources
		ember: new THREE.MeshStandardMaterial({ name: 'Embers', color: 0x1a0d08, roughness: 0.9, emissive: new THREE.Color(1.0, 0.32, 0.08), emissiveIntensity: 3 }),
		glass: new THREE.MeshStandardMaterial({ name: 'Lantern glass', color: 0x2a2014, roughness: 0.4, emissive: new THREE.Color('#ffb768'), emissiveIntensity: 2.2 }),
		wax: flat('#b9ae95', 'Candle wax', 0.6),
	};
	app._valdrenMaterials = m;
	return m;
}

/** A material per hazard / interactable instance (they pulse or glint on their own). */
export function bloodSacMaterial() {
	const material = new THREE.MeshStandardMaterial({ name: 'Blood sac', color: DECOR.sac, roughness: 0.4, metalness: 0, emissive: new THREE.Color(FUNCTION.blood.colors[0]), emissiveIntensity: 0.05 });
	material.userData.swatch = DECOR.sac;
	return material;
}

// ---------------------------------------------------------------------------------------------
// Geometry helpers

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

/** Non-indexed, position + normal copy with a transform baked in (p position, r Euler XYZ, s scale). */
export function place(geometry, { p = [0, 0, 0], r = [0, 0, 0], s = 1, matrix = null } = {}) {
	let g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
	for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
	if (!g.attributes.normal) g.computeVertexNormals();
	_m.compose(_p.set(...p), _q.setFromEuler(_e.set(...r)), Array.isArray(s) ? _s.set(...s) : _s.setScalar(s));
	g.applyMatrix4(_m);
	if (matrix) g.applyMatrix4(matrix);
	geometry.dispose();
	return g;
}

/** Merge position + normal geometries (place() output) into one. */
export const mergeAll = (list) => mergeGeometries(list);

/** Geometry lists per material key. */
export class Parts {
	constructor() {
		this.byKey = new Map();
	}

	add(key, geometry, t) {
		if (!this.byKey.has(key)) this.byKey.set(key, []);
		this.byKey.get(key).push(place(geometry, t));
		return this;
	}

	box(key, w, h, d, t) {
		return this.add(key, new THREE.BoxGeometry(w, h, d), t);
	}

	/** A box from a to b (centre line), w × h cross-section — beams, braces, bones. */
	beam(key, a, b, w, h = w, roll = 0) {
		const A = new THREE.Vector3(...a);
		const B = new THREE.Vector3(...b);
		const len = A.distanceTo(B);
		const g = new THREE.BoxGeometry(w, h, len);
		g.rotateZ(roll);
		const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), B.clone().sub(A).normalize());
		g.applyQuaternion(q);
		const mid = A.add(B).multiplyScalar(0.5);
		return this.add(key, g, { p: mid.toArray() });
	}

	/** Cylinder from a to b (radius r0 at a, r1 at b). */
	rod(key, a, b, r0, r1 = r0, segments = 7) {
		const A = new THREE.Vector3(...a);
		const B = new THREE.Vector3(...b);
		const g = new THREE.CylinderGeometry(r1, r0, A.distanceTo(B), segments, 1);
		g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
		return this.add(key, g, { p: A.add(B).multiplyScalar(0.5).toArray() });
	}

	/** Copy every part of `other` under a transform. */
	merge(other, t = {}) {
		_m.compose(_p.set(...(t.p ?? [0, 0, 0])), _q.setFromEuler(_e.set(...(t.r ?? [0, 0, 0]))), _s.setScalar(t.s ?? 1));
		const matrix = _m.clone();
		for (const [key, list] of other.byKey) for (const g of list) {
			if (!this.byKey.has(key)) this.byKey.set(key, []);
			this.byKey.get(key).push(g.clone().applyMatrix4(matrix));
		}
		return this;
	}

	/** Map(key → merged geometry). */
	build() {
		const out = new Map();
		for (const [key, list] of this.byKey) out.set(key, list.length === 1 ? list[0] : mergeGeometries(list));
		return out;
	}
}

/** Wall slab along local x (centred), y0..y1, with rectangular holes { x0, x1, y0, y1 } cut out of it. */
function wallWithHoles(P, key, { length, y0, y1, thick, holes = [], matrix }) {
	const xs = new Set([-length / 2, length / 2]);
	for (const h of holes) {
		xs.add(Math.max(-length / 2, Math.min(length / 2, h.x0)));
		xs.add(Math.max(-length / 2, Math.min(length / 2, h.x1)));
	}
	const cuts = [...xs].sort((a, b) => a - b);
	for (let i = 0; i < cuts.length - 1; i++) {
		const a = cuts[i];
		const b = cuts[i + 1];
		if (b - a < 1e-3) continue;
		const mid = (a + b) / 2;
		let spans = [[y0, y1]];
		for (const h of holes) {
			if (h.x0 >= mid || h.x1 <= mid) continue;
			spans = spans.flatMap(([s0, s1]) => [[s0, Math.min(s1, h.y0)], [Math.max(s0, h.y1), s1]]).filter(([s0, s1]) => s1 - s0 > 1e-3);
		}
		for (const [s0, s1] of spans) {
			const g = new THREE.BoxGeometry(b - a, s1 - s0, thick);
			g.translate(mid, (s0 + s1) / 2, 0);
			P.add(key, g, { matrix });
		}
	}
}

/** LatheGeometry with hard edges at every profile corner (corner points doubled: each segment keeps its own normal). */
export function latheCrisp(profile, segments = 16) {
	const pts = [];
	profile.forEach(([x, y], i) => {
		const v = new THREE.Vector2(x, y);
		pts.push(v);
		if (i > 0 && i < profile.length - 1) pts.push(v.clone());
	});
	return new THREE.LatheGeometry(pts, segments);
}

const wallMatrix = (x, z, yaw) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
const lineGeometry = (points) => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));

// ---------------------------------------------------------------------------------------------
// Valdren Core: buildings

/**
 * Valdren farmhouse: stone footing and lower wall, timber-framed daub upper wall, slate gable roof, chimney.
 * Footprint w (x) × d (z) centred on the origin, floor at y = 0, the door in the front (+z) wall at x = door.
 * foot = how far the stone footing reaches below the floor (terrain under the house).
 * corrupted: the front roof slope has caved in (floor and interior visible from the game camera), the door is
 * torn off, the walls crack — same materials and colours, the change is in the form (rule II.2).
 * Returns { parts, cracks: [[x, y, z] polyline in local space] (where the scene grows veins), floorHole: [x, z] }.
 */
export function house({ w = 8, d = 5.6, plinth = 1.1, eave = 3.0, rise = 2.3, door = -0.6, foot = 0.8, corrupted = false, seed = 1 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	const t = 0.5;
	const td = 0.3;
	const hw = w / 2;
	const hd = d / 2;
	const doorW = 1.3;
	const doorH = 2.25;
	const win = (x) => ({ x0: x - 0.42, x1: x + 0.42, y0: 1.45, y1: 2.35 });
	const walls = [
		// [centre x, z, yaw, length, holes]
		{ x: 0, z: hd - t / 2, yaw: 0, len: w, holes: [{ x0: door - doorW / 2, x1: door + doorW / 2, y0: -1, y1: doorH }, win(door + 2.1)], side: 'front' },
		{ x: 0, z: -hd + t / 2, yaw: Math.PI, len: w, holes: [win(0.4)], side: 'back' },
		{ x: hw - t / 2, z: 0, yaw: Math.PI / 2, len: d - 2 * t, holes: [win(0)], side: 'right' },
		{ x: -hw + t / 2, z: 0, yaw: -Math.PI / 2, len: d - 2 * t, holes: [win(0.2)], side: 'left' },
	];
	for (const wl of walls) {
		const stoneM = wallMatrix(wl.x, wl.z, wl.yaw);
		wallWithHoles(P, 'stone', { length: wl.len, y0: -foot, y1: plinth, thick: t, holes: wl.holes, matrix: stoneM });
		// Daub on the stone's centre line: its face sits 0.1 m behind the stone face (a plinth ledge).
		const daubM = wallMatrix(wl.x, wl.z, wl.yaw);
		const len = wl.side === 'front' || wl.side === 'back' ? w - 0.2 : d - 0.8;
		wallWithHoles(P, 'daub', { length: len, y0: plinth, y1: eave, thick: td, holes: wl.holes, matrix: daubM });
		// Timber frame on the daub's outer face: sill, top plate, posts beside openings and every ~1.6 m, braces.
		const out = td / 2 + 0.04;
		const frame = (geo, x, y) => {
			geo.translate(x, y, out);
			P.add('timber', geo, { matrix: daubM });
		};
		frame(new THREE.BoxGeometry(len, 0.2, 0.12), 0, plinth + 0.1);
		frame(new THREE.BoxGeometry(len, 0.2, 0.12), 0, eave - 0.1);
		const posts = new Set([-len / 2 + 0.1, len / 2 - 0.1]);
		for (const h of wl.holes) {
			if (h.y1 < plinth) continue;
			posts.add(h.x0 - 0.09);
			posts.add(h.x1 + 0.09);
			if (h.y0 > plinth) frame(new THREE.BoxGeometry(h.x1 - h.x0 + 0.36, 0.16, 0.12), (h.x0 + h.x1) / 2, h.y0 - 0.08);
			frame(new THREE.BoxGeometry(h.x1 - h.x0 + 0.36, 0.18, 0.12), (h.x0 + h.x1) / 2, Math.min(eave - 0.2, h.y1 + 0.09));
		}
		for (let x = -len / 2 + 1.6; x < len / 2 - 0.8; x += 1.6) if (![...posts].some((p) => Math.abs(p - x) < 0.6) && !wl.holes.some((h) => x > h.x0 - 0.2 && x < h.x1 + 0.2)) posts.add(x);
		const sorted = [...posts].sort((a, b) => a - b);
		for (const x of sorted) frame(new THREE.BoxGeometry(0.18, eave - plinth - 0.4, 0.12), x, (plinth + eave) / 2);
		// One brace in panels with no opening.
		for (let i = 0; i < sorted.length - 1; i++) {
			const a = sorted[i] + 0.09;
			const b = sorted[i + 1] - 0.09;
			if (b - a < 0.8 || wl.holes.some((h) => h.x1 > a && h.x0 < b && h.y1 > plinth)) continue;
			if (r() < 0.35) continue;
			const flip = r() < 0.5;
			const y0 = plinth + 0.2;
			const y1 = eave - 0.2;
			const g = new THREE.BoxGeometry(0.14, Math.hypot(b - a, y1 - y0), 0.1);
			g.rotateZ((flip ? 1 : -1) * Math.atan2(b - a, y1 - y0));
			frame(g, (a + b) / 2, (y0 + y1) / 2);
		}
	}

	// Gables (daub triangle + king post + rafters' ends) at x = ±hw.
	for (const side of [-1, 1]) {
		const shape = new THREE.Shape([new THREE.Vector2(-hd + 0.05, 0), new THREE.Vector2(hd - 0.05, 0), new THREE.Vector2(0, rise - 0.05)]);
		const g = new THREE.ExtrudeGeometry(shape, { depth: td, bevelEnabled: false });
		g.translate(0, 0, -td / 2);
		g.rotateY(Math.PI / 2);
		P.add('daub', g, { p: [side * (hw - t / 2), eave, 0] });
		const xo = side * (hw - t / 2 + td / 2 + 0.04);
		P.box('timber', 0.12, rise - 0.15, 0.18, { p: [xo, eave + (rise - 0.15) / 2, 0] });
		P.beam('timber', [xo, eave + 0.05, -hd + 0.25], [xo, eave + rise - 0.05, 0], 0.16, 0.12);
		P.beam('timber', [xo, eave + 0.05, hd - 0.25], [xo, eave + rise - 0.05, 0], 0.16, 0.12);
	}

	// Roof slabs: ridge at y = eave + rise, eave overhang o.
	const o = 0.45;
	const a = Math.atan2(rise, hd);
	const span = hd + o;
	const L = span / Math.cos(a);
	const lift = 0.12;
	const slab = (zSign, from = 0, to = 1, lengthX = w + 0.7, x = 0) => {
		const l0 = L * from;
		const l1 = L * to;
		const mid = (l0 + l1) / 2;
		const zc = zSign * mid * Math.cos(a);
		const yc = eave + rise + lift - mid * Math.sin(a);
		P.box('roof', lengthX, 0.16, l1 - l0, { p: [x, yc, zc], r: [zSign * a, 0, 0] });
	};
	slab(-1);
	if (!corrupted) slab(1);
	else {
		// Caved-in front slope: a strip below the ridge and two stubs at the gables; rafters hang into the room.
		slab(1, 0, 0.32);
		slab(1, 0.32, 0.85, 1.4, -hw + 0.35);
		slab(1, 0.32, 0.6, 1.1, hw - 0.2);
		for (const [x, drop] of [[-1.6, 1.1], [0.2, 3.1], [1.9, 1.6]]) {
			const top = [x, eave + rise - 0.25 * L * Math.sin(a), 0.25 * L * Math.cos(a)];
			P.beam('timber', top, [x + (r() - 0.5) * 0.6, Math.max(0.2, eave + 0.3 - drop), hd * 0.55], 0.14, 0.14);
		}
		for (let i = 0; i < 7; i++) {
			const x = (r() - 0.5) * (w - 2);
			const z = (r() - 0.2) * (d - 2) * 0.5;
			P.box(i % 3 ? 'roof' : 'timber', 0.9 + r() * 0.7, 0.08, 0.25 + r() * 0.2, { p: [x, 0.1 + r() * 0.15, z], r: [r() * 0.3, r() * 3, r() * 0.2] });
		}
	}
	P.box('timber', w + 0.8, 0.2, 0.28, { p: [0, eave + rise + lift + 0.06, 0] });

	// Chimney (back slope, left gable).
	const chH = rise + 1.2;
	P.box('stone', 0.85, chH, 0.85, { p: [-hw + 1.1, eave - 0.2 + chH / 2, -hd * 0.42] });
	P.box('stone', 1.0, 0.14, 1.0, { p: [-hw + 1.1, eave - 0.2 + chH + 0.07, -hd * 0.42] });

	// Plank floor; the corrupted house has a hole where the veins come up.
	const floorHole = [door + 1.4, -0.5];
	const inner = { x0: -hw + t, x1: hw - t, z0: -hd + t, z1: hd - t };
	for (let z = inner.z0 + 0.15, i = 0; z < inner.z1; z += 0.3, i++) {
		const near = corrupted && Math.abs(z - floorHole[1]) < 0.75;
		if (!near) {
			P.box('plank', inner.x1 - inner.x0, 0.06, 0.28, { p: [0, -0.03, z] });
			continue;
		}
		// Planks broken around the hole: two stubs, one prised up.
		const gap0 = floorHole[0] - 0.6 - r() * 0.3;
		const gap1 = floorHole[0] + 0.6 + r() * 0.3;
		P.box('plank', gap0 - inner.x0, 0.06, 0.28, { p: [(inner.x0 + gap0) / 2, -0.03, z] });
		P.box('plank', inner.x1 - gap1, 0.06, 0.28, { p: [(gap1 + inner.x1) / 2, -0.03, z] });
		if (i % 2) P.box('plank', 1.0, 0.06, 0.28, { p: [floorHole[0] + 0.2, 0.18, z], r: [0, 0.4, 0.45] });
	}
	if (corrupted) P.box('hollow', 1.5, 0.02, 1.4, { p: [floorHole[0], -0.12, floorHole[1]] });

	// Door: frame, leaf ajar (or torn off and lying in front), step.
	const leaf = new THREE.BoxGeometry(doorW - 0.08, doorH - 0.06, 0.07);
	if (!corrupted) {
		leaf.translate((doorW - 0.08) / 2, (doorH - 0.06) / 2, 0);
		leaf.rotateY(-1.1);
		P.add('plank', leaf, { p: [door - doorW / 2 + 0.04, 0.02, hd - t / 2 - 0.1] });
	} else P.add('plank', leaf, { p: [door + 0.3, 0.05, hd + 1.4], r: [-Math.PI / 2, 0, 0.35] });
	P.box('stone', doorW + 0.5, foot, 0.8, { p: [door, -foot / 2 - 0.02, hd + 0.4] });

	// Shutters (one hanging loose on the corrupted house).
	// Shutter hinged at the left edge of a window (wall-local x), swung open against the wall or hanging loose.
	const shutter = (wl, x, loose) => {
		const g = new THREE.BoxGeometry(0.42, 0.9, 0.05);
		g.translate(-0.21, 0, 0.025);
		if (loose) g.rotateZ(0.55);
		g.rotateY(loose ? -0.5 : -1.35);
		g.translate(x - 0.43, 1.9, td / 2 + 0.02);
		P.add('plank', g, { matrix: wallMatrix(wl.x, wl.z, wl.yaw) });
	};
	shutter(walls[0], door + 2.1, corrupted);
	shutter(walls[1], 0.4, false);

	// Cracks of the corrupted house: from the footing beside the floor hole up the front wall to the window.
	const cracks = [];
	if (corrupted) {
		const crack = [];
		let x = door + 1.25;
		for (let y = -0.1; y < 2.7; y += 0.18) {
			x += (r() - 0.5) * 0.28 + (y > 1.4 ? 0.06 : 0);
			crack.push([x, y, y < plinth ? hd + 0.02 : hd - 0.08]);
		}
		cracks.push(crack);
		const side = [];
		let z = 0.6;
		for (let y = -0.1; y < 2.4; y += 0.18) {
			z += (r() - 0.5) * 0.25;
			side.push([y < plinth ? hw + 0.02 : hw - 0.08, y, z]);
		}
		cracks.push(side);
		for (const c of cracks) for (let i = 0; i < c.length - 1; i++) P.beam('hollow', c[i], c[i + 1], 0.06, 0.03);
	}
	return { parts: P, cracks, floorHole, door: [door, hd + 0.4] };
}

/**
 * Plank barn on a low stone plinth: big door in the front (+z), one leaf open, one torn down (Redbound took it).
 */
export function barn({ w = 10, d = 7, wall = 3.3, rise = 2.8, foot = 0.8, seed = 2 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	const hw = w / 2;
	const hd = d / 2;
	const doorW = 3.4;
	const doorH = 2.9;
	const plinth = 0.55;
	const walls = [
		{ x: 0, z: hd - 0.2, yaw: 0, len: w, holes: [{ x0: -doorW / 2, x1: doorW / 2, y0: -2, y1: doorH }] },
		{ x: 0, z: -hd + 0.2, yaw: Math.PI, len: w, holes: [] },
		{ x: hw - 0.2, z: 0, yaw: Math.PI / 2, len: d - 0.4, holes: [{ x0: -0.5, x1: 0.5, y0: 1.8, y1: 2.5 }] },
		{ x: -hw + 0.2, z: 0, yaw: -Math.PI / 2, len: d - 0.4, holes: [] },
	];
	for (const wl of walls) {
		const M = wallMatrix(wl.x, wl.z, wl.yaw);
		wallWithHoles(P, 'stone', { length: wl.len, y0: -foot, y1: plinth, thick: 0.45, holes: wl.holes, matrix: M });
		// Vertical planks, a few missing or short.
		for (let x = -wl.len / 2 + 0.15; x < wl.len / 2 - 0.1; x += 0.3) {
			const hole = wl.holes.find((h) => x > h.x0 - 0.1 && x < h.x1 + 0.1);
			const top = wall - (r() < 0.08 ? 0.4 + r() * 0.8 : 0);
			if (r() < 0.04) continue;
			const g = new THREE.BoxGeometry(0.27, 1, 0.08);
			const spans = hole ? [[plinth, hole.y0], [hole.y1, top]] : [[plinth, top]];
			for (const [y0, y1] of spans) {
				if (y1 - y0 < 0.05) continue;
				const gp = g.clone();
				gp.scale(1, y1 - y0, 1);
				gp.translate(x, (y0 + y1) / 2, 0.12);
				P.add('plank', gp, { matrix: M });
			}
			g.dispose();
		}
		for (const y of [plinth + 0.15, 1.7, wall - 0.12]) {
			let segs = [[-wl.len / 2, wl.len / 2]];
			for (const h of wl.holes) if (y > h.y0 && y < h.y1) segs = segs.flatMap(([a, b]) => [[a, Math.min(b, h.x0)], [Math.max(a, h.x1), b]]).filter(([a, b]) => b - a > 0.05);
			for (const [a, b] of segs) {
				const g = new THREE.BoxGeometry(b - a, 0.16, 0.1);
				g.translate((a + b) / 2, y, 0.21);
				P.add('timber', g, { matrix: M });
			}
		}
	}
	// Corner posts and door posts.
	for (const [x, z] of [[-hw + 0.2, -hd + 0.2], [hw - 0.2, -hd + 0.2], [-hw + 0.2, hd - 0.2], [hw - 0.2, hd - 0.2], [-doorW / 2 - 0.1, hd - 0.1], [doorW / 2 + 0.1, hd - 0.1]]) {
		P.box('timber', 0.24, wall + 0.1 - plinth, 0.24, { p: [x, (wall + plinth) / 2, z] });
	}
	P.box('timber', doorW + 0.6, 0.24, 0.24, { p: [0, doorH + 0.12, hd - 0.1] });
	// Gable planks (stepped) at the front and back.
	for (const zs of [-1, 1]) {
		for (let x = -hw + 0.35; x < hw - 0.2; x += 0.3) {
			const h = rise * (1 - Math.abs(x) / hw) - 0.1;
			if (h < 0.15) continue;
			P.box('plank', 0.27, h, 0.08, { p: [x, wall + h / 2, zs * (hd - 0.08)] });
		}
	}
	// Roof: the ridge runs along z, so the gables face the well (front) and the back.
	const a = Math.atan2(rise, hw);
	const o = 0.5;
	const L = (hw + o) / Math.cos(a);
	for (const xs of [-1, 1]) {
		const mid = L / 2;
		const g = new THREE.BoxGeometry(L, 0.16, d + 0.8);
		g.rotateZ(-xs * a);
		P.add('roof', g, { p: [xs * mid * Math.cos(a), wall + rise + 0.1 - mid * Math.sin(a), 0] });
	}
	P.box('timber', 0.3, 0.2, d + 0.9, { p: [0, wall + rise + 0.16, 0] });
	// Door leaves: one swung open, one torn down.
	P.box('plank', doorW / 2 - 0.05, doorH - 0.1, 0.08, { p: [-doorW / 2 - 0.25, doorH / 2, hd + doorW / 4 + 0.05], r: [0, Math.PI / 2 - 0.25, 0] });
	P.box('plank', doorW / 2 - 0.05, 0.08, doorH - 0.1, { p: [1.0, 0.1, hd + 1.8], r: [0.08, 0.5, 0.1] });
	// Inside: stalls and hay.
	for (const x of [-2.6, 0, 2.6]) P.box('plank', 0.1, 1.2, 2.6, { p: [x, 0.6, -hd + 1.6] });
	for (let i = 0; i < 4; i++) P.box('hay', 1.1, 0.55, 0.6, { p: [-3.4 + i * 1.1 + r() * 0.3, 0.27 + (i === 2 ? 0.55 : 0), -hd + 0.8], r: [0, r() * 0.3, 0] });
	P.box('plank', w - 0.5, 0.06, d - 0.5, { p: [0, -0.03, 0] });
	return { parts: P, door: [0, hd + 0.5] };
}

/** Farm well: limestone ring, posts, crossbeam and a small slate roof. blood: the Redbound blood well. */
export function well({ blood = false, seed = 3 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	const ri = 0.6;
	const ro = 0.92;
	P.add('stone', latheCrisp([[ri, -0.6], [ro, -0.6], [ro, 0.7], [ro + 0.05, 0.72], [ro + 0.05, 0.86], [ri - 0.05, 0.86], [ri - 0.05, 0.72], [ri, 0.7], [ri, -0.6]], 22));
	const liquid = new THREE.CircleGeometry(ri - 0.01, 24);
	liquid.rotateX(-Math.PI / 2);
	liquid.translate(0, blood ? 0.55 : 0.25, 0);
	P.add(blood ? 'wellBlood' : 'water', liquid);
	for (const x of [-1, 1]) P.box('timber', 0.16, 2.3, 0.16, { p: [x * (ro + 0.08), 1.15, 0], r: [0, 0, blood && x > 0 ? 0.06 : 0] });
	P.rod('timber', [-(ro + 0.25), 1.95, 0], [ro + 0.25, 1.95, 0], 0.07);
	P.box('iron', 0.05, 0.35, 0.05, { p: [ro + 0.3, 1.82, 0] });
	for (const zs of [-1, 1]) P.box('roof', 2.5, 0.08, 0.95, { p: [0, 2.42, zs * 0.36], r: [zs * 0.6, 0, 0] });
	P.box('timber', 2.6, 0.12, 0.12, { p: [0, 2.7, 0] });
	const bucket = [[0, 0], [0.15, 0], [0.17, 0.26], [0.17, 0.28], [0, 0.28]];
	if (!blood) {
		P.add('plank', latheCrisp(bucket, 10), { p: [0, 1.15, 0] });
		P.rod('linen', [0, 1.43, 0], [0, 1.9, 0], 0.012, 0.012, 4);
	} else {
		P.add('plank', latheCrisp(bucket, 10), { p: [1.5, 0.15, 0.7], r: [Math.PI / 2 - 0.2, 0, 0.6] });
		P.rod('linen', [0, 1.55, 0], [0, 1.9, 0], 0.012, 0.012, 4);
		// Ring stones knocked out at the base.
		for (let i = 0; i < 4; i++) {
			const ang = 0.6 + i * 0.5 + r() * 0.3;
			P.add('rock', rock({ radius: 0.22 + r() * 0.08, seed: 30 + i, squash: 0.6 }), { p: [Math.cos(ang) * 1.3, 0, Math.sin(ang) * 1.3], r: [0, r() * 6, 0] });
		}
	}
	return { parts: P };
}

// ---------------------------------------------------------------------------------------------
// Valdren Core: props

export function cart({ wrecked = false, seed = 4 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	const bed = new Parts();
	bed.box('plank', 2.3, 0.1, 1.25, { p: [0, 0.75, 0] });
	for (const z of [-0.6, 0.6]) bed.box('plank', 2.3, 0.35, 0.06, { p: [0, 0.97, z] });
	bed.box('plank', 0.06, 0.35, 1.2, { p: [-1.12, 0.97, 0] });
	bed.box('timber', 2.4, 0.08, 0.08, { p: [0, 0.66, 0] });
	const wheel = (x, z, flat) => {
		const W = new Parts();
		W.add('timber', new THREE.TorusGeometry(0.5, 0.055, 6, 18));
		for (let i = 0; i < 6; i++) W.box('timber', 0.05, 0.95, 0.04, { r: [0, 0, (i / 6) * Math.PI] });
		W.add('iron', new THREE.CylinderGeometry(0.09, 0.09, 0.18, 8), { r: [Math.PI / 2, 0, 0] });
		P.merge(W, flat ? { p: [x, 0.07, z], r: [Math.PI / 2, 0, r()] } : { p: [x, 0.5, z] });
	};
	if (!wrecked) {
		P.merge(bed);
		wheel(-0.2, -0.72, false);
		wheel(-0.2, 0.72, false);
		for (const z of [-0.45, 0.45]) P.beam('timber', [1.15, 0.7, z], [2.9, 0.45, z * 0.75], 0.08, 0.08);
	} else {
		P.merge(bed, { p: [0, -0.28, 0], r: [0.32, 0.2, 0.24] });
		wheel(-0.25, 0.72, false);
		wheel(1.4, -1.5, true);
		P.beam('timber', [1.1, 0.35, 0.4], [2.2, 0.1, 0.7], 0.08, 0.08);
		P.beam('timber', [2.3, 0.05, -0.3], [3.4, 0.05, 0.2], 0.08, 0.08);
	}
	return { parts: P };
}

export function barrel() {
	const P = new Parts();
	P.add('plank', latheCrisp([[0, 0], [0.27, 0], [0.32, 0.2], [0.34, 0.4], [0.32, 0.6], [0.27, 0.8], [0, 0.8]], 14));
	for (const [y, rr] of [[0.12, 0.31], [0.68, 0.31]]) P.add('iron', new THREE.TorusGeometry(rr, 0.018, 4, 18), { p: [0, y, 0], r: [Math.PI / 2, 0, 0] });
	return { parts: P };
}

export function crate(size = 0.7) {
	const P = new Parts();
	P.box('plank', size, size, size, { p: [0, size / 2, 0] });
	for (const y of [0.04, size - 0.04]) for (const z of [-1, 1]) P.box('timber', size + 0.04, 0.07, 0.05, { p: [0, y, z * (size / 2 + 0.01)] });
	return { parts: P };
}

export function sack() {
	const P = new Parts();
	P.add('burlap', new THREE.SphereGeometry(0.3, 10, 8), { p: [0, 0.2, 0], s: [1, 0.7, 0.78] });
	P.add('burlap', new THREE.ConeGeometry(0.09, 0.18, 6), { p: [0, 0.44, 0] });
	return { parts: P };
}

export function haystack() {
	const P = new Parts();
	P.add('hay', new THREE.CylinderGeometry(1.15, 1.25, 1.2, 12), { p: [0, 0.6, 0] });
	P.add('hay', new THREE.ConeGeometry(1.25, 1.1, 12), { p: [0, 1.75, 0] });
	return { parts: P };
}

/** Low dry-stone field wall segment (Valdren core). */
export function fieldWall(length = 4, seed = 5) {
	const P = new Parts();
	const r = rng(seed);
	for (let x = -length / 2 + 0.3; x < length / 2; x += 0.45 + r() * 0.2) {
		P.add('rock', rock({ radius: 0.3 + r() * 0.1, seed: seed * 7 + x * 3, squash: 0.55 }), { p: [x, -0.05, (r() - 0.5) * 0.15], r: [0, r() * 6, 0] });
		if (r() < 0.7) P.add('rock', rock({ radius: 0.24 + r() * 0.08, seed: seed * 11 + x * 5, squash: 0.6 }), { p: [x + 0.2, 0.32, (r() - 0.5) * 0.1], r: [0, r() * 6, 0] });
	}
	return { parts: P };
}

export function scarecrow(seed = 6) {
	const P = new Parts();
	const r = rng(seed);
	P.box('timber', 0.1, 2.3, 0.1, { p: [0, 1.15, 0], r: [0.04, 0, 0.05] });
	P.box('timber', 1.6, 0.08, 0.08, { p: [0, 1.75, 0], r: [0, 0, 0.08] });
	P.add('burlap', new THREE.SphereGeometry(0.19, 8, 6), { p: [0.05, 2.12, 0], s: [1, 1.15, 1] });
	P.add('leather', new THREE.ConeGeometry(0.26, 0.32, 9), { p: [0.04, 2.38, 0], r: [0.1, 0, -0.12] });
	P.add('leather', new THREE.CylinderGeometry(0.36, 0.36, 0.03, 12), { p: [0.04, 2.24, 0], r: [0.1, 0, -0.12] });
	P.add('linen', new THREE.CylinderGeometry(0.22, 0.42, 1.0, 8, 1, true), { p: [0, 1.38, 0] });
	for (const x of [-0.8, 0.8]) P.add('hay', new THREE.ConeGeometry(0.1, 0.35, 5), { p: [x, 1.62, 0], r: [0, 0, Math.PI + (r() - 0.5)] });
	return { parts: P };
}

export function lanternPost() {
	const P = new Parts();
	P.box('timber', 0.14, 2.6, 0.14, { p: [0, 1.3, 0] });
	P.box('timber', 0.7, 0.1, 0.1, { p: [0.3, 2.45, 0] });
	P.box('iron', 0.2, 0.26, 0.2, { p: [0.55, 2.13, 0] });
	P.add('iron', new THREE.ConeGeometry(0.17, 0.14, 4), { p: [0.55, 2.33, 0], r: [0, Math.PI / 4, 0] });
	return { parts: P, light: [0.55, 2.13, 0], glass: [0.55, 2.13, 0] };
}

export function signpost() {
	const P = new Parts();
	P.box('timber', 0.14, 2.2, 0.14, { p: [0, 1.1, 0], r: [0, 0, 0.03] });
	P.box('greyWood', 1.0, 0.24, 0.05, { p: [0.4, 1.85, 0.06], r: [0, 0, 0.06] });
	P.box('greyWood', 0.9, 0.22, 0.05, { p: [-0.35, 1.5, -0.06], r: [0, 0.25, -0.05] });
	return { parts: P };
}

// ---------------------------------------------------------------------------------------------
// Interactables (Valdren core shapes; the scene adds the interact glint)

/** Wayside shrine: limestone pillar with a pointed niche, a small figure, a candle. */
export function wayShrine() {
	const P = new Parts();
	P.box('limestone', 1.3, 0.22, 1.0, { p: [0, 0.11, 0] });
	P.box('limestone', 1.0, 0.2, 0.78, { p: [0, 0.32, 0] });
	P.add('limestone', archPanel({ length: 0.72, height: 1.75, thickness: 0.55, openingWidth: 0.4, openingHeight: 0.72, sill: 0.62 }), { p: [0, 0.42, 0] });
	P.box('limestone', 0.6, 0.9, 0.08, { p: [0, 1.3, -0.24] });
	P.add('limestone', new THREE.ConeGeometry(0.56, 0.55, 4), { p: [0, 2.45, 0], r: [0, Math.PI / 4, 0] });
	P.add('limestone', new THREE.ConeGeometry(0.09, 0.4, 6), { p: [0, 1.25, -0.05] });
	P.add('limestone', new THREE.SphereGeometry(0.06, 8, 6), { p: [0, 1.5, -0.05] });
	P.box('limestone', 0.5, 0.06, 0.22, { p: [0, 0.98, 0.32] });
	P.add('wax', new THREE.CylinderGeometry(0.025, 0.028, 0.14, 8), { p: [0.16, 1.08, 0.33] });
	P.add('iron', new THREE.CylinderGeometry(0.07, 0.05, 0.05, 8), { p: [-0.12, 1.03, 0.33] });
	return { parts: P, flame: [0.16, 1.2, 0.33] };
}

/** Waypoint platform: limestone disc, an inlaid ring, four standing stones. */
export function waypointPad() {
	const P = new Parts();
	P.add('limestone', latheCrisp([[0, -0.4], [1.75, -0.4], [1.75, 0.12], [1.62, 0.26], [0, 0.26]], 28));
	P.add('stone', new THREE.TorusGeometry(1.15, 0.06, 5, 40), { p: [0, 0.25, 0], r: [Math.PI / 2, 0, 0] });
	for (let i = 0; i < 4; i++) {
		const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
		P.box('limestone', 0.42, 1.15, 0.32, { p: [Math.cos(a) * 2.05, 0.45, Math.sin(a) * 2.05], r: [0, -a, 0] });
		P.add('limestone', new THREE.ConeGeometry(0.3, 0.3, 4), { p: [Math.cos(a) * 2.05, 1.17, Math.sin(a) * 2.05], r: [0, -a + Math.PI / 4, 0] });
	}
	return { parts: P };
}

export function chest() {
	const P = new Parts();
	P.box('plank', 0.95, 0.48, 0.58, { p: [0, 0.24, 0] });
	P.add('plank', new THREE.CylinderGeometry(0.29, 0.29, 0.95, 10, 1, false, 0, Math.PI), { p: [0, 0.48, 0], r: [0, 0, Math.PI / 2] });
	for (const x of [-0.32, 0, 0.32]) P.add('iron', new THREE.TorusGeometry(0.3, 0.022, 4, 12, Math.PI), { p: [x, 0.48, 0], r: [0, Math.PI / 2, 0] });
	for (const x of [-0.32, 0.32]) P.box('iron', 0.045, 0.48, 0.6, { p: [x, 0.24, 0] });
	P.box('iron', 0.12, 0.14, 0.04, { p: [0, 0.44, 0.3] });
	return { parts: P };
}

// ---------------------------------------------------------------------------------------------
// Redbound · Bloodbound Settlements

export function cowSkull() {
	const P = new Parts();
	P.add('bone', new THREE.SphereGeometry(0.12, 9, 7), { s: [1, 0.85, 1.3] });
	P.add('bone', new THREE.CylinderGeometry(0.05, 0.08, 0.22, 7), { p: [0, -0.03, 0.18], r: [Math.PI / 2 + 0.25, 0, 0] });
	for (const x of [-1, 1]) {
		P.add('bone', new THREE.ConeGeometry(0.035, 0.32, 6), { p: [x * 0.2, 0.08, -0.02], r: [0, 0, -x * 1.2] });
		P.add('hollow', new THREE.SphereGeometry(0.025, 5, 4), { p: [x * 0.06, 0.03, 0.11] });
	}
	return P;
}

export function longBone(len = 0.5) {
	const P = new Parts();
	P.rod('bone', [0, 0, -len / 2], [0, 0, len / 2], 0.022, 0.02, 6);
	for (const z of [-1, 1]) P.add('bone', new THREE.SphereGeometry(0.035, 6, 4), { p: [0.012, 0, (z * len) / 2], s: [1.3, 0.9, 1] });
	return P;
}

/** Bone stake: wooden stake, crossed bones, an animal skull, a bone ring hung on it (habitation sign). */
export function boneStake({ height = 1.9, ring = true, cloth = false, seed = 7 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	P.box('timber', 0.1, height, 0.1, { p: [0, height / 2 - 0.15, 0] });
	P.add('timber', new THREE.ConeGeometry(0.07, 0.2, 4), { p: [0, height - 0.05, 0], r: [0, Math.PI / 4, 0] });
	P.merge(longBone(0.65), { p: [0, height - 0.55, 0.07], r: [0, Math.PI / 2, 0.7] });
	P.merge(longBone(0.6), { p: [0, height - 0.55, 0.08], r: [0, Math.PI / 2, -0.7] });
	P.merge(cowSkull(), { p: [0, height - 0.18, 0.1], r: [0.2, 0, (r() - 0.5) * 0.3] });
	if (ring) P.add('bone', new THREE.TorusGeometry(0.17, 0.028, 5, 16), { p: [0.02, height - 0.95, 0.12], r: [0.25, 0.1, 0] });
	if (cloth) P.box('redCloth', 0.12, 0.55, 0.01, { p: [-0.07, height - 0.85, 0.06], r: [0, 0, 0.1] });
	return { parts: P };
}

/** Hanging banner of torn red cloth on a crossbar pole (Redbound camp marker, environment tier). */
export function tatteredBanner({ height = 2.7, width = 0.62, length = 1.15, seed = 8 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	P.box('timber', 0.1, height, 0.1, { p: [0, height / 2 - 0.2, 0] });
	P.box('timber', width + 0.3, 0.07, 0.07, { p: [0, height - 0.15, 0.06] });
	const g = new THREE.PlaneGeometry(width, length, 5, 8);
	const pos = g.attributes.position;
	for (let i = 0; i < pos.count; i++) {
		const y = pos.getY(i);
		const x = pos.getX(i);
		if (y < -length / 2 + 0.01) pos.setY(i, y + r() * length * 0.45); // torn hem
		pos.setZ(i, Math.sin(x * 7 + y * 3) * 0.03);
	}
	g.computeVertexNormals();
	P.add('redCloth', g, { p: [0, height - 0.15 - length / 2, 0.1] });
	return { parts: P };
}

/** Animal ribcage (spine + ribs) lying on its side. */
export function ribcage(seed = 9) {
	const P = new Parts();
	const r = rng(seed);
	const spine = lineGeometry([[-0.7, 0.18, 0], [0, 0.22, 0], [0.7, 0.15, 0]]);
	P.add('bone', taperedTube(spine, { segments: 10, radial: 6, r0: 0.05, r1: 0.04 }));
	for (let i = 0; i < 6; i++) {
		const x = -0.45 + i * 0.18;
		for (const side of [-1, 1]) {
			const c = lineGeometry([[x, 0.2, 0], [x + 0.05, 0.42, side * 0.25], [x + 0.08, 0.3, side * 0.45], [x + 0.1, 0.04, side * (0.48 + r() * 0.06)]]);
			P.add('bone', taperedTube(c, { segments: 8, radial: 4, r0: 0.022, r1: 0.012 }));
		}
	}
	return P;
}

/** Bone alarm drum (gameplay: Redbound beat it to call the camp; destructible). */
export function boneDrum() {
	const P = new Parts();
	P.add('hide', new THREE.CylinderGeometry(0.44, 0.38, 0.55, 14), { p: [0, 0.9, 0] });
	P.add('hideGrey', new THREE.CylinderGeometry(0.46, 0.46, 0.04, 14), { p: [0, 1.19, 0] });
	for (let i = 0; i < 4; i++) {
		const a = (i / 4) * Math.PI * 2 + 0.4;
		P.beam('bone', [Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62], [Math.cos(a) * 0.36, 1.1, Math.sin(a) * 0.36], 0.05, 0.05);
	}
	for (let i = 0; i < 8; i++) {
		const a = (i / 8) * Math.PI * 2;
		P.add('bone', new THREE.ConeGeometry(0.025, 0.16, 4), { p: [Math.cos(a) * 0.45, 1.27, Math.sin(a) * 0.45] });
	}
	P.merge(longBone(0.55), { p: [0.55, 0.32, 0.3], r: [0.9, 0.4, 0] });
	P.merge(longBone(0.5), { p: [0.62, 0.3, 0.1], r: [0.95, 0.2, 0] });
	return { parts: P };
}

/**
 * Resonance pillar (gameplay: amplifies the Bellwether's rhythm, buffs nearby Redbound; destructible). Its power
 * organ — the blood heart wrapped round the spine — is returned on its own so the scene can pulse it (rule I.4:
 * empowerment shows at the organ that makes the power).
 */
export function resonancePillar({ height = 3.1, seed = 10 } = {}) {
	const P = new Parts();
	const r = rng(seed);
	for (let y = 0.2, i = 0; y < height; y += 0.21, i++) {
		P.add('bone', new THREE.CylinderGeometry(0.15, 0.17, 0.15, 9), { p: [0, y, 0], r: [0, i * 0.7, 0] });
		P.add('bone', new THREE.ConeGeometry(0.04, 0.22, 4), { p: [i % 2 ? 0.2 : -0.2, y, 0.04], r: [0, 0, i % 2 ? -1.4 : 1.4] });
	}
	for (const [y, rr] of [[1.0, 0.5], [1.85, 0.42], [2.6, 0.32]]) {
		P.add('bone', new THREE.TorusGeometry(rr, 0.035, 5, 22), { p: [0, y, 0], r: [Math.PI / 2 + (r() - 0.5) * 0.15, 0, (r() - 0.5) * 0.15] });
		for (const s of [-1, 1]) P.beam('bone', [0, y, 0], [s * rr, y, 0], 0.035, 0.035);
	}
	for (let i = 0; i < 7; i++) {
		const a = (i / 7) * Math.PI * 2;
		P.add('rock', rock({ radius: 0.24 + r() * 0.1, seed: 60 + i, squash: 0.6 }), { p: [Math.cos(a) * 0.45, -0.05, Math.sin(a) * 0.45] });
	}
	const hg = [];
	for (const [x, y, z, rr] of [[0.12, 1.38, 0.1, 0.22], [-0.1, 1.48, 0.08, 0.17], [0.02, 1.25, -0.12, 0.16]]) {
		const g = new THREE.SphereGeometry(rr, 12, 9);
		g.translate(x, y, z);
		hg.push(place(g));
	}
	return { parts: P, heart: mergeGeometries(hg), heartCenter: [0.03, 1.38, 0.03] };
}

/** Blood sac: a cluster of swollen sacs (hazard: bursts into a blood pool; destructible). */
export function bloodSac(seed = 11) {
	const r = rng(seed);
	const list = [];
	for (const [x, y, z, rr] of [[0, 0.3, 0, 0.32], [0.26, 0.22, 0.1, 0.22], [-0.18, 0.18, 0.2, 0.18]]) {
		const g = new THREE.SphereGeometry(rr, 12, 9);
		const pos = g.attributes.position;
		for (let i = 0; i < pos.count; i++) {
			const k = 1 + noise2(pos.getX(i) * 9 + seed, pos.getY(i) * 9 + pos.getZ(i) * 5, 3) * 0.12;
			pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.92, pos.getZ(i) * k);
		}
		g.translate(x + (r() - 0.5) * 0.04, y, z);
		list.push(place(g));
	}
	const g = mergeGeometries(list);
	g.computeBoundingSphere();
	return g;
}

/**
 * Ambush nest (hazard): a mound of straw and hides with a dark burrow. Its tell is motion (the mound breathes) and
 * the gnawed bones around it — a harmless haystack has neither (rule VI: a trap never looks like harmless decor).
 */
export function ambushNest(seed = 12) {
	const P = new Parts();
	const r = rng(seed);
	const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
	const pos = g.attributes.position;
	for (let i = 0; i < pos.count; i++) {
		const k = 1 + noise2(pos.getX(i) * 2.5 + seed, pos.getZ(i) * 2.5, 5) * 0.18;
		pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
	}
	P.add('rotStraw', g, { s: [1.35, 0.68, 1.05] });
	P.add('hollow', new THREE.CircleGeometry(0.46, 12, 0, Math.PI), { p: [0.1, 0.02, 0.93], r: [-0.35, 0, 0], s: [1.15, 0.8, 1] });
	P.box('hide', 1.1, 0.04, 0.8, { p: [-0.45, 0.55, -0.1], r: [0.2, 0.4, 0.5] });
	P.box('hideGrey', 0.9, 0.04, 0.7, { p: [0.5, 0.5, -0.25], r: [-0.3, -0.5, -0.45] });
	P.box('hide', 0.8, 0.04, 0.6, { p: [0.15, 0.62, 0.35], r: [-0.55, 0.2, 0.1] });
	for (let i = 0; i < 4; i++) P.merge(longBone(0.3 + r() * 0.25), { p: [(r() - 0.5) * 2.6, 0.03, 0.9 + r() * 0.8], r: [0, r() * 3, 0] });
	return { parts: P };
}

// ---------------------------------------------------------------------------------------------
// Blightbeasts · Diseased Wilderness

/** Cattle carcass the crows gather round: a slumped, sunken hide, ribs showing through, skull, stiff legs. No gore. */
export function carcass(seed = 13) {
	const P = new Parts();
	const g = new THREE.SphereGeometry(1, 20, 12);
	const pos = g.attributes.position;
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const y = pos.getY(i);
		const z = pos.getZ(i);
		// Sunken flank between hip and shoulder, lumpy hide, flat underside.
		const sag = 1 - 0.35 * Math.exp(-((x * 1.4) ** 2)) * Math.max(0, y);
		const k = (1 + noise2(x * 3 + seed, z * 3 + y * 2, 7) * 0.12) * sag;
		pos.setXYZ(i, x * k, Math.max(-0.2, y * k), z * k);
	}
	g.computeVertexNormals();
	P.add('carcass', g, { p: [0, 0.16, 0], s: [1.15, 0.36, 0.52] });
	P.add('flesh', new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), { p: [0.05, 0.26, 0.24], s: [1.3, 0.35, 0.6] });
	for (let i = 0; i < 5; i++) {
		const x = -0.32 + i * 0.15;
		P.add('bone', taperedTube(lineGeometry([[x, 0.3, 0.02], [x + 0.03, 0.42, 0.2], [x + 0.05, 0.3, 0.42]]), { segments: 6, radial: 4, r0: 0.022, r1: 0.012 }));
	}
	P.merge(cowSkull(), { p: [1.2, 0.1, 0.12], r: [0.3, 1.4, 0.6], s: 1.15 });
	for (const [a, b] of [[[-0.7, 0.12, 0.22], [-1.35, 0.28, 0.6]], [[-0.6, 0.1, -0.18], [-1.2, 0.06, -0.62]], [[0.65, 0.12, 0.18], [1.0, 0.36, 0.78]], [[0.6, 0.1, -0.2], [0.95, 0.05, -0.7]]]) {
		P.rod('carcass', a, b, 0.065, 0.045, 6);
		const B = new THREE.Vector3(...b);
		P.add('hollow', new THREE.CylinderGeometry(0.05, 0.06, 0.1, 6), { p: B.toArray() }); // hooves
	}
	return { parts: P };
}

/** Low-poly crow (instanced; ~0.45 m long). */
export function crowGeometry() {
	const P = new Parts();
	P.add('crow', new THREE.SphereGeometry(0.1, 8, 6), { p: [0, 0.16, 0], s: [0.8, 0.75, 1.5] });
	P.add('crow', new THREE.SphereGeometry(0.065, 7, 5), { p: [0, 0.24, 0.13] });
	P.add('crow', new THREE.ConeGeometry(0.02, 0.09, 5), { p: [0, 0.23, 0.22], r: [Math.PI / 2 + 0.25, 0, 0] });
	P.box('crow', 0.09, 0.015, 0.16, { p: [0, 0.17, -0.2], r: [0.3, 0, 0] });
	for (const x of [-1, 1]) {
		P.box('crow', 0.025, 0.07, 0.24, { p: [x * 0.075, 0.17, -0.02], r: [0.15, 0, x * 0.2] });
		P.rod('crow', [x * 0.03, 0.09, 0.02], [x * 0.035, 0, 0.04], 0.008, 0.008, 4);
	}
	return P.build().get('crow');
}

/** Wolf den: a rock outcrop over a dark hollow, a fallen trunk across it, prey bones and fur at the mouth. */
export function wolfDen(seed = 14) {
	const P = new Parts();
	const r = rng(seed);
	const stones = [[-2.2, -0.6, 1.6], [2.0, -0.4, 1.5], [-0.9, -1.6, 1.9], [1.0, -1.7, 1.7], [0, -2.6, 2.1], [-3.1, 0.6, 1.0], [3.0, 0.7, 0.9], [2.4, -2.4, 1.2]];
	for (const [x, z, s] of stones) P.add('rock', rock({ radius: s, seed: seed + x * 3 + z, squash: 0.62 + r() * 0.2 }), { p: [x, -0.35 * s, z], r: [0, r() * 6, 0] });
	P.add('hollow', new THREE.SphereGeometry(1.15, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), { p: [0, -0.15, -0.35], s: [1.25, 0.85, 1] });
	P.add('bark', taperedTube(lineGeometry([[-3.4, 1.0, -0.2], [-1, 1.65, 0.2], [1.5, 1.45, 0.1], [3.6, 0.9, -0.4]]), { segments: 12, radial: 8, r0: 0.38, r1: 0.22 }));
	for (let i = 0; i < 5; i++) P.merge(longBone(0.3 + r() * 0.3), { p: [(r() - 0.5) * 2.4, 0.03, 1.3 + r() * 1.2], r: [0, r() * 3, 0] });
	P.merge(ribcage(seed + 1), { p: [1.4, 0, 2.0], r: [0, 0.7, 0.1], s: 0.7 });
	for (let i = 0; i < 9; i++) P.add('fur', new THREE.ConeGeometry(0.05 + r() * 0.05, 0.08, 5), { p: [(r() - 0.5) * 3, 0.02, 1.0 + r() * 1.5], r: [Math.PI / 2 * r(), r() * 6, 0] });
	return { parts: P };
}

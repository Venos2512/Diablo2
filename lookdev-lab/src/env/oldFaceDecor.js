// ASHLAR · The Old Face dressing (scene src/scenes/oldFace.js): the crypt-wall modules (one instanced mesh), the stairwell's cut Mason stone, the floor, the stair, the flooded step's
// water, the hole in the Wall (fissure, recess, the scene's one shadowed spot), the vigil (plaque, chair, blanket, pipe, bowl, waxy shelf), dead sconces, pinpoints, Gennet's lantern,
// the first faceless statue, props with contact shadows, decals, dust motes and the dust puffs that cue the encounters. Everything is deterministic (seeded).
// Pure maths lives in env/oldFace.js (no THREE); the pieces here are procedural, the bones / candles / boulders are the dungeon_v1 Tripo props.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { loadGrassCards } from './terrain.js';
import { FlameField } from './flames.js';
import { kelvinToColor } from '../core/grading.js';
import { finalWeights } from './biomeMix.js';
import * as kit from './kit.js';
import * as O from './oldFace.js';
import { radialTexture, moteTexture, decalGeometry, withDefaultAttributes, meshOf } from './dungeonDecor.js';

const CAPACITY = 900; // decal instances per atlas cell
const smooth = (v, e0, e1) => THREE.MathUtils.smoothstep(v, e0, e1);
const UP = new THREE.Vector3(0, 1, 0);
const NO_PICK = (o) => {
	o.userData.labNoPick = o.userData.labNoCollide = true;
	return o;
};

/** A plain image sample as a mipmapped DataTexture, rows flipped so the image top is v = 1 (as scenes/dungeon.js). */
export async function loadPlain(app, id, colorSpace) {
	const img = await app.loader.loadImageData(id);
	const { width: w, height: h } = img;
	const data = new Uint8Array(w * h * 4);
	for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
	const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: id, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(8, app.backend.caps.maxAnisotropy || 4), colorSpace, needsUpdate: true });
	return tex;
}

const PROP_KINDS = ['wall', 'bonePile', 'column', 'candles', 'boulders'];
const COLD = new THREE.Color(O.LIGHTS.cold);
const WARM = new THREE.Color(O.LIGHTS.warm);

/** Bake `geometry` by a matrix and drop what the merge does not need (position / normal / uv stay). */
const baked = (geometry, matrix) => {
	const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
	for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
	if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
	return g.applyMatrix4(matrix);
};

export class OldFaceDecor {
	/**
	 * @param {object} o { app, group, vfx, splat, library, material (the layer terrain), settings, wallFade }
	 */
	constructor(o) {
		Object.assign(this, o);
		this.root = new THREE.Group();
		this.root.name = 'Old Face dressing';
		this.group.add(this.root);
		this.props = new THREE.Group();
		this.props.name = 'Props';
		this.root.add(this.props);
		this.ownMaterials = [];
		this.ownTextures = [];
		this.ownGeometries = [];
		this.sources = []; // { light, base, seed, steady }
		this.spots = []; // authored decal spots: { x, z, cell, size }
		this.counts = { props: 0, decals: 0, walls: 0, lights: 0, flames: 0 };
		this.lightScale = 1;
		this.lantern = 0; // 0..1 (Gennet's lantern, driven by the scene)
		this.puffs = null;
		this._m4 = new THREE.Matrix4();
		this._c = new THREE.Color();
	}

	async load() {
		const { app } = this;
		const [atlas, vault, vaultN, waterN, ...gltfs] = await Promise.all([
			loadGrassCards(app, 'dungeon-decals-crypt'),
			loadPlain(app, 'biome-BIO27_vault', THREE.SRGBColorSpace),
			loadPlain(app, 'biome-BIO27_vault-n', THREE.NoColorSpace),
			loadPlain(app, 'biome-darkwood-water-n', THREE.NoColorSpace),
			...PROP_KINDS.map((k) => app.loader.loadSample(O.PROP_IDS[k]).catch((e) => (console.error(`Old Face prop "${O.PROP_IDS[k]}" failed to load`, e), null))),
		]);
		this.atlas = this.desaturated(atlas, 0.42); // no accent colour in the Prologue: rust and orange of the dungeon's atlas pulled toward grey
		this.vault = vault;
		this.vaultN = vaultN;
		this.waterN = waterN;
		this.gltf = Object.fromEntries(PROP_KINDS.map((k, i) => [k, gltfs[i]]));
		this.mesh = Object.fromEntries(PROP_KINDS.map((k, i) => [k, meshOf(gltfs[i])]));
		const aniso = Math.min(8, app.backend.caps.maxAnisotropy || 4);
		for (const m of Object.values(this.mesh)) if (m) for (const key of ['map', 'normalMap']) if (m.material[key]) m.material[key].anisotropy = aniso;
		this.decalMaterial = new THREE.MeshStandardMaterial({ name: 'Old Face decals', map: this.atlas, alphaTest: 0.4, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
		this.decalMeshes = Array.from({ length: 16 }, (_, cell) => {
			const mesh = new THREE.InstancedMesh(decalGeometry(cell), this.decalMaterial, CAPACITY);
			mesh.name = `Decals · cell ${cell}`;
			mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3);
			mesh.count = 0;
			mesh.frustumCulled = false;
			NO_PICK(mesh);
			this.root.add(mesh);
			return mesh;
		});
		this.aoTexture = radialTexture(0.9);
		this.aoMaterial = new THREE.MeshBasicMaterial({ name: 'Contact shadow', map: this.aoTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false });
		this.aoGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
		// the cut Mason stone's textures: 1 uv unit = 1 m, the texture repeats every 4 m
		this.stoneMap = vault.clone();
		this.stoneNormal = vaultN.clone();
		for (const t of [this.stoneMap, this.stoneNormal]) {
			t.repeat.set(0.25, 0.25);
			t.needsUpdate = true;
		}
	}

	// ---- helpers ---------------------------------------------------------------------------------------------------------------

	/** A copy of a DataTexture with its colour pulled toward luminance by `keep` (1 = unchanged); the cached original (shared with the dungeon scene) stays as it was. */
	desaturated(source, keep) {
		const { data, width, height } = source.image;
		const out = new Uint8Array(data.length);
		for (let i = 0; i < data.length; i += 4) {
			const grey = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
			out[i] = grey + (data[i] - grey) * keep;
			out[i + 1] = grey + (data[i + 1] - grey) * keep;
			out[i + 2] = grey + (data[i + 2] - grey) * keep;
			out[i + 3] = data[i + 3];
		}
		const tex = new THREE.DataTexture(out, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
		Object.assign(tex, { name: 'Old Face decal atlas (desaturated)', generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: source.anisotropy, colorSpace: source.colorSpace, needsUpdate: true });
		return tex;
	}

	own(material) {
		this.ownMaterials.push(material);
		return material;
	}

	ownGeo(g) {
		this.ownGeometries.push(g);
		return g;
	}

	mat(color, roughness = 0.9, extra = {}) {
		return this.own(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }));
	}

	/** Add a mesh to `parent` (default: the props group). */
	add(geometry, material, x, y, z, { parent = this.props, yaw = 0, cast = true, receive = true, name = '' } = {}) {
		const m = new THREE.Mesh(this.ownGeo(geometry), material);
		m.position.set(x, y, z);
		m.rotation.y = yaw;
		m.castShadow = cast;
		m.receiveShadow = receive;
		if (name) m.name = name;
		parent.add(m);
		return m;
	}

	/** Place a Tripo prop (a Mesh sharing the source geometry) on the floor, with a contact shadow. */
	put(source, x, z, { scale = 1, yaw = 0, sink = 0.02, ao = 1.4, y = null, castShadow = true } = {}) {
		if (!source) return null;
		const gy = y ?? O.floorY(x, z);
		const m = new THREE.Mesh(source.geometry, source.material);
		m.name = `Prop · ${source.name || 'mesh'}`;
		m.position.set(x, gy - sink, z);
		m.rotation.y = yaw;
		m.scale.setScalar(scale);
		m.castShadow = castShadow;
		m.receiveShadow = true;
		this.props.add(m);
		this.counts.props++;
		if (ao > 0) {
			source.geometry.computeBoundingBox();
			const box = source.geometry.boundingBox;
			const w = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * scale;
			const blob = new THREE.Mesh(this.aoGeometry, this.aoMaterial);
			blob.scale.set(w * ao, 1, w * ao);
			blob.position.set(x, gy + 0.016, z);
			blob.renderOrder = 1;
			NO_PICK(blob);
			this.props.add(blob);
		}
		return m;
	}

	addLight({ name, x, y, z, color, kelvin = 2300, base, distance = 7, decay = 2, seed = Math.random() * 50, steady = false }) {
		const light = new THREE.PointLight(color ?? kelvinToColor(kelvin), base, distance, decay);
		light.position.set(x, y, z);
		light.castShadow = false;
		light.name = name;
		this.group.add(light);
		const entry = { light, base, seed, steady, name, kelvin };
		this.sources.push(entry);
		this.counts.lights++;
		return entry;
	}

	// ---- build -----------------------------------------------------------------------------------------------------------------

	build() {
		this.flames = new FlameField(this.app, 8);
		this.vfx.add(this.flames.mesh);
		this.buildFloor();
		this.buildBoneWalls();
		this.buildStoneWalls();
		this.buildStair();
		this.buildCoping();
		this.buildWater();
		this.buildHole();
		this.buildPlaque();
		this.buildVigil();
		this.buildShelf();
		this.buildSconces();
		this.buildPinpoints();
		this.buildWarmWall();
		this.buildProps();
		this.buildGennet();
		this.buildStatue();
		this.buildAtmosphere();
		this.buildPuffs();
		this.scatterDecals();
	}

	// ---- floor, stair, water ----------------------------------------------------------------------------------------------------

	/** The floor: a 0.25 m height field clipped to the rooms (+0.2 m under the walls), without the stair and landing column (their own meshes). */
	buildFloor() {
		const cell = 0.25;
		const x0 = -34;
		const z0 = -13;
		const nx = Math.ceil(54 / cell);
		const nz = Math.ceil(22 / cell);
		const S = O.STAIR;
		const want = (i, j) => {
			const x = x0 + (i + 0.5) * cell;
			const z = z0 + (j + 0.5) * cell;
			if (x >= S.x0 - 0.01 && x <= S.x1 + 0.01 && z < S.z0) return false; // the stair column
			return O.wallDistance(x, z) > -0.2;
		};
		const index = new Int32Array((nx + 1) * (nz + 1)).fill(-1);
		const pos = [];
		const idx = [];
		const vert = (i, j) => {
			const k = j * (nx + 1) + i;
			if (index[k] < 0) {
				const x = x0 + i * cell;
				const z = z0 + j * cell;
				index[k] = pos.length / 3;
				pos.push(x, O.floorY(x, z), z);
			}
			return index[k];
		};
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				if (!want(i, j)) continue;
				const a = vert(i, j);
				const b = vert(i + 1, j);
				const c = vert(i, j + 1);
				const d = vert(i + 1, j + 1);
				idx.push(a, c, b, b, c, d);
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		const uv = new Float32Array((pos.length / 3) * 2);
		for (let i = 0; i < pos.length / 3; i++) uv.set([pos[i * 3], pos[i * 3 + 2]], i * 2);
		g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
		this.floorGeometry = this.ownGeo(g);
		const floor = new THREE.Mesh(g, this.material);
		floor.name = 'Floor (height field)';
		floor.receiveShadow = true;
		this.group.add(floor);
		this.floor = floor;
		// the landing: flat, at the stair's top
		const land = new THREE.PlaneGeometry(S.x1 - S.x0, S.zTop - O.DOOR.z);
		land.rotateX(-Math.PI / 2);
		const lm = this.add(land, this.material, (S.x0 + S.x1) / 2, S.top, (S.zTop + O.DOOR.z) / 2, { parent: this.group, cast: false, name: 'Landing' });
		this.landing = lm;
	}

	/** Ten risers of cut stone, boxes without overlap (tread k is z0 - k run .. z0 - (k - 1) run, k rise high). */
	buildStair() {
		const S = O.STAIR;
		const parts = [];
		for (let k = 1; k <= S.count - 1; k++) {
			const h = k * S.rise;
			const box = new THREE.BoxGeometry(S.x1 - S.x0, h + 0.4, S.run);
			parts.push(baked(box, this._m4.makeTranslation((S.x0 + S.x1) / 2, h / 2 - 0.2, S.z0 - (k - 0.5) * S.run)));
			box.dispose();
		}
		const g = kit.worldUV(mergeGeometries(parts));
		const mat = this.stoneMaterial(0.88, false);
		this.stairGeometry = this.ownGeo(g);
		this.stairMaterial = mat;
		mat.emissive = new THREE.Color(0.9, 0.55, 0.3);
		mat.emissiveIntensity = 0;
		this.stair = this.add(g, mat, 0, 0, 0, { parent: this.group, name: 'Stair (ten risers)' });
		this.stair.castShadow = true;
	}

	stoneMaterial(tone = 1, vertexColors = true) {
		return this.own(new THREE.MeshStandardMaterial({ name: 'Mason stone', map: this.stoneMap, normalMap: this.stoneNormal, normalScale: new THREE.Vector2(0.9, 0.9), color: new THREE.Color(0.72 * tone, 0.72 * tone, 0.7 * tone), roughness: 0.92, metalness: 0, vertexColors }));
	}

	/** The stone edge of the flooded step: a row of worn coping blocks along both shores (the step down is 0.4 m). */
	buildCoping() {
		const F = O.FLOOD;
		const rand = kit.rng(6606);
		const parts = [];
		for (const east of [false, true]) {
			for (let z = F.z0 + 0.25; z < F.z1 - 0.1; z += 0.3 + rand() * 0.1) {
				const x = (east ? O.shoreX1(z) : O.shoreX0(z)) + (east ? 0.1 : -0.1);
				const q = new THREE.Quaternion().setFromAxisAngle(UP, (rand() - 0.5) * 0.35);
				const b = new THREE.BoxGeometry(0.3 + rand() * 0.12, 0.08 + rand() * 0.03, 0.26 + rand() * 0.1);
				parts.push(baked(b, this._m4.compose(new THREE.Vector3(x, 0.02, z), q, new THREE.Vector3(1, 1, 1))));
			}
		}
		const g = kit.worldUV(mergeGeometries(parts));
		this.coping = this.add(g, this.stoneMaterial(1.8, false), 0, 0, 0, { parent: this.group, name: 'Flooded step · stone edge' });
		this.coping.userData.labNoCollide = true; // a 0.08 m lip: dressing only, it must not wall off the basin cells of the nav grid
	}

	/** The flooded step's water: a fine grid at the water level, vertex colour = depth tint, vertex alpha = the fade at the bank (WebGPU's alphaMap reads R, so the fade rides on vertex alpha). */
	buildWater() {
		const F = O.FLOOD;
		const step = 0.08;
		const x0 = F.x0 - 1.2;
		const z0 = F.z0 - 0.4;
		const nx = Math.ceil((F.x1 - F.x0 + 2.4) / step);
		const nz = Math.ceil((F.z1 - F.z0 + 0.8) / step);
		const pos = [];
		const uv = [];
		const colors = [];
		const colors2 = [];
		const alpha = new Float32Array((nx + 1) * (nz + 1));
		const shallow = new THREE.Color(0.034, 0.05, 0.052);
		const deep = new THREE.Color(0.012, 0.022, 0.026);
		const col = new THREE.Color();
		for (let j = 0; j <= nz; j++) {
			for (let i = 0; i <= nx; i++) {
				const x = x0 + i * step;
				const z = z0 + j * step;
				const depth = O.LEVEL.water - O.floorY(x, z);
				const wall = smooth(O.wallDistance(x, z), -0.05, 0.05);
				const a = smooth(depth, 0.0, 0.07) * (0.7 + 0.3 * smooth(depth, 0.02, 0.3)) * wall; // a narrow fade: a soft, dark, wet edge rather than a wide glossy slope
				col.copy(shallow).lerp(deep, smooth(depth, 0.03, 0.3));
				alpha[j * (nx + 1) + i] = a;
				pos.push(x, O.LEVEL.water, z);
				uv.push(x / 5, -z / 5);
				colors.push(col.r, col.g, col.b, a);
				colors2.push(0.012, 0.03, 0.03, a * 0.2);
			}
		}
		const index = [];
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				const k = j * (nx + 1) + i;
				if ([k, k + 1, k + nx + 1, k + nx + 2].every((v) => alpha[v] <= 0)) continue;
				index.push(k, k + nx + 1, k + 1, k + 1, k + nx + 1, k + nx + 2);
			}
		}
		const make = (color) => {
			const g = new THREE.BufferGeometry();
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
			g.setAttribute('color', new THREE.Float32BufferAttribute(color, 4));
			g.setIndex(index);
			g.computeVertexNormals();
			return this.ownGeo(g);
		};
		const material = (name, map, scale, roughness, opacity) => this.own(new THREE.MeshPhysicalMaterial({ name, normalMap: map, normalScale: new THREE.Vector2(scale, scale), roughness, metalness: 0, ior: 1.33, specularIntensity: 0.1, envMapIntensity: 0.45, transparent: true, opacity, vertexColors: true, depthWrite: false, emissive: new THREE.Color(0.0002, 0.0012, 0.0012) }));
		this.waterMaterial = material('Flood water', this.waterN, 0.55, 0.16, this.settings.waterOpacity);
		this.waterMaterial.specularIntensity = 0.7; // the night environment is almost black: the sheen has to come from the lights themselves
		const normal2 = this.waterN.clone();
		normal2.repeat.set(3.1, 3.1);
		normal2.needsUpdate = true;
		this.waterNormal2 = normal2;
		this.waterMaterial2 = material('Flood water · second ripple layer', normal2, 0.5, 0.2, 1);
		this.waterMaterial2.specularIntensity = 0.5;
		const waterFx = this.app.backend.effects.createWaterSpecular?.(); // WebGPU only: honour the capped F90 (see biomeMix.js)
		if (waterFx) {
			this.waterMaterial = waterFx.apply(this.waterMaterial);
			this.waterMaterial2 = waterFx.apply(this.waterMaterial2);
		}
		this.buildSheen();
		this.water = new THREE.Mesh(make(colors), this.waterMaterial);
		this.water2 = new THREE.Mesh(make(colors2), this.waterMaterial2);
		this.water2.position.y = 0.002;
		// the reflections, drawn on the water's own grid so they take its shore shape: the stair's warm light as a broken streak running out over the surface, a faint cold sheen from
		// the Wall side, and a broad dim grey-teal sky (the night environment is too dark to reflect anything). Normal blending (an additive quad would leave a box in the VFX target).
		const layer = (name, map, repeat, alphaAt, order) => {
			const col = new Float32Array((nx + 1) * (nz + 1) * 4).fill(1);
			for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) col[(j * (nx + 1) + i) * 4 + 3] = alpha[j * (nx + 1) + i] * alphaAt(x0 + i * step, z0 + j * step);
			const mat = this.own(new THREE.MeshBasicMaterial({ name, map, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1, 1, 1), opacity: 0 }));
			map.repeat.set(repeat[0], repeat[1]);
			const mesh = new THREE.Mesh(make(col), mat);
			mesh.name = name;
			mesh.position.y = 0.004 * order;
			mesh.renderOrder = 3 + order;
			NO_PICK(mesh);
			this.group.add(mesh);
			return mat;
		};
		const east = (x) => THREE.MathUtils.clamp((x - F.x0 + 0.5) / (F.x1 - F.x0 + 0.5), 0, 1);
		const band = (z, mid, sigma) => Math.exp(-(((z - mid) / sigma) ** 2));
		this.coldSheenMap = this.sheenMap.clone(); // its own texture: the repeat is per texture, so the two layers must not share one
		this.coldSheenMap.needsUpdate = true;
		this.ownTextures.push(this.coldSheenMap);
		// warm: one soft band running from the middle of the pool to the stair foot (the bounce light sits at the east end, z ~ 3), widest and brightest at the east shore, fading sideways
		this.warmSheenMaterial = layer('Water sheen · warm (stair light)', this.sheenMap, [1.5, 1.1], (x, z) => east(x) ** 2.2 * (0.12 + 0.88 * band(z, 3.05, 0.55 + 0.5 * east(x))), 1);
		// cold: a faint, wide sheen in the west half, from the Wall's side
		this.coldSheenMaterial = layer('Water sheen · cold (the Wall)', this.coldSheenMap, [1.1, 0.8], (x, z) => (1 - east(x)) ** 1.8 * (0.25 + 0.75 * band(z, 3.1, 1.1)), 2);
		this.skySheenMaterial = layer('Water sheen · sky', this.skyMap, [0.8, 0.9], () => 0.7, 3);
		for (const [m, order, name] of [[this.water, 2, 'Flood water (surface)'], [this.water2, 3, 'Flood water (second ripple layer)']]) {
			m.name = name;
			m.renderOrder = order;
			NO_PICK(m);
			this.group.add(m);
		}
	}

	/**
	 * What makes the black water read as water: the warm light of the stair reflected as a broken streak that runs out across it, a faint cold sheen from the Wall side, and a pale
	 * wet line along the shore. Here only the textures and the shore line are built; the reflection layers are meshes on the water's own grid (see buildWater).
	 */
	buildSheen() {
		const F = O.FLOOD;
		const rand = kit.rng(4747);
		const c = document.createElement('canvas');
		c.width = 1024;
		c.height = 256;
		const g = c.getContext('2d');
		// ripple glints: soft-ended streaks of very different length, width and strength, irregularly spaced (a regular dash grid reads as glitter)
		for (let i = 0; i < 150; i++) {
			const x = rand() * 1024;
			const y = 8 + rand() * 240;
			const w = 70 + rand() ** 1.4 * 330;
			const h = 2 + rand() ** 2 * 6;
			const a = 0.18 + rand() ** 1.5 * 0.7;
			for (const dx of [-1024, 0, 1024]) {
				g.save();
				g.translate(x + dx, y);
				g.scale(w / 2, h / 2);
				const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
				grad.addColorStop(0, `rgba(255,255,255,${a})`);
				grad.addColorStop(0.4, `rgba(255,255,255,${a * 0.6})`);
				grad.addColorStop(1, 'rgba(255,255,255,0)');
				g.fillStyle = grad;
				g.beginPath();
				g.arc(0, 0, 1, 0, Math.PI * 2);
				g.fill();
				g.restore();
			}
		}
		const map = new THREE.CanvasTexture(c);
		map.wrapS = map.wrapT = THREE.RepeatWrapping;
		map.colorSpace = THREE.SRGBColorSpace;
		this.ownTextures.push(map);
		this.sheenMap = map;
		// the broad soft ground of the sheen: a few big blurred clouds on a transparent canvas
		const sc2 = document.createElement('canvas');
		sc2.width = 256;
		sc2.height = 128;
		const sg = sc2.getContext('2d');
		sg.filter = 'blur(10px)';
		for (let i = 0; i < 16; i++) {
			sg.fillStyle = `rgba(255,255,255,${0.25 + rand() * 0.5})`;
			for (const dx of [-256, 0, 256]) {
				sg.beginPath();
				sg.ellipse(rand() * 256 + dx, 14 + rand() * 100, 30 + rand() * 60, 8 + rand() * 18, 0, 0, Math.PI * 2);
				sg.fill();
			}
		}
		const skyMap = new THREE.CanvasTexture(sc2);
		skyMap.wrapS = skyMap.wrapT = THREE.RepeatWrapping;
		skyMap.colorSpace = THREE.SRGBColorSpace;
		this.ownTextures.push(skyMap);
		this.skyMap = skyMap;
		// the waterline: a soft pale foam line where the surface meets the sloped shore (found by bisection on the floor height), feathered both ways so it reads as a damp edge,
		// not as slivers between the coping stones
		const W = O.LEVEL.water;
		const pos = [];
		const idx = [];
		const colors = [];
		for (const east of [false, true]) {
			const s = east ? 1 : -1;
			const first = pos.length / 3;
			let n = 0;
			for (let z = F.z0 + 0.2; z <= F.z1 - 0.2; z += 0.08) {
				let x = east ? O.shoreX1(z) + 0.2 : O.shoreX0(z) - 0.2; // dry side
				for (let k = 0; k < 140 && O.floorY(x, z) > W; k++) x -= s * 0.01; // walk toward the water until the floor drops below the surface
				for (const [dx, a] of [[-0.2, 0], [0, 0.09], [0.2, 0]]) {
					pos.push(x + dx, W + 0.016, z);
					colors.push(0.26, 0.31, 0.31, a);
				}
				if (n) {
					const k = first + n * 3;
					idx.push(k - 3, k, k - 2, k - 2, k, k + 1, k - 2, k + 1, k - 1, k - 1, k + 1, k + 2);
				}
				n++;
			}
		}
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
		geo.setIndex(idx);
		geo.computeVertexNormals();
		withDefaultAttributes(geo);
		const shore = new THREE.Mesh(this.ownGeo(geo), this.own(new THREE.MeshBasicMaterial({ name: 'Waterline foam', vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })));
		shore.renderOrder = 7;
		NO_PICK(shore);
		this.group.add(shore);
	}

	// ---- walls -----------------------------------------------------------------------------------------------------------------

	/** The crypt-wall modules: one InstancedMesh, dark-top vertex colours (no ceiling: the room dissolves into black), solid for the hero. */
	buildBoneWalls() {
		const wall = this.mesh.wall;
		if (!wall) return;
		const g = wall.geometry;
		if (!g.attributes.color) {
			const pos = g.attributes.position;
			const col = new Float32Array(pos.count * 3);
			for (let i = 0; i < pos.count; i++) {
				const y = pos.getY(i);
				col.fill(THREE.MathUtils.lerp(1, 0.06, smooth(y, 1.0, 2.28)) * (0.82 + 0.18 * smooth(y, 0.0, 0.4)), i * 3, i * 3 + 3);
			}
			g.setAttribute('color', new THREE.BufferAttribute(col, 3));
		}
		const material = wall.material.clone();
		material.vertexColors = true;
		material.side = THREE.DoubleSide; // the module is a hollow shell (open niches): seen from outside (orbit views over the near wall) its partitions showed as slanted black blades
		this.own(material);
		const list = O.wallModules();
		const mesh = new THREE.InstancedMesh(g, this.wallFade.apply(material), list.length);
		mesh.name = 'Old Face walls (instanced modules)';
		const q = new THREE.Quaternion();
		const e = new THREE.Euler(0, 0, 0, 'YXZ');
		list.forEach((w, i) => {
			q.setFromEuler(e.set(w.tilt, w.yaw, 0));
			this._m4.compose(new THREE.Vector3(w.x, w.y, w.z), q, new THREE.Vector3(w.sx, w.sy, 1));
			mesh.setMatrixAt(i, this._m4);
		});
		mesh.instanceMatrix.needsUpdate = true;
		mesh.frustumCulled = false;
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.userData.labSolid = true; // walls block the hero (instanced meshes are walk-through unless solid)
		this.group.add(mesh);
		this.wallMesh = mesh;
		this.counts.walls = list.length;
	}

	/** Plain cut Mason stone: the stairwell, the jog's corners and the door wall (a gothic arch, opening 1.4 x 2.6 m on the landing). */
	buildStoneWalls() {
		const parts = [];
		const T = 0.7;
		for (const run of O.STONE_RUNS) {
			const [ax, az] = run.a;
			const [bx, bz] = run.b;
			const len = Math.hypot(bx - ax, bz - az);
			const yaw = Math.atan2(run.in[0], run.in[1]);
			const cx = (ax + bx) / 2 - run.in[0] * (T / 2);
			const cz = (az + bz) / 2 - run.in[1] * (T / 2);
			const place = (geometry, y) => parts.push(baked(geometry, this._m4.compose(new THREE.Vector3(cx, y, cz), new THREE.Quaternion().setFromAxisAngle(UP, yaw), new THREE.Vector3(1, 1, 1))));
			if (run.door) {
				const base = new THREE.BoxGeometry(len + T, O.STAIR.top, T);
				place(base.translate(0, O.STAIR.top / 2, 0), 0);
				const arch = kit.archPanel({ length: len + T, height: run.h - O.STAIR.top, thickness: T, openingWidth: O.DOOR.width, openingHeight: O.DOOR.height, sill: 0 });
				place(arch, O.STAIR.top);
			} else {
				const box = new THREE.BoxGeometry(len + T, run.h, T);
				place(box.translate(0, run.h / 2, 0), 0);
			}
		}
		const g = kit.worldUV(mergeGeometries(parts));
		const pos = g.attributes.position;
		const col = new Float32Array(pos.count * 3);
		for (let i = 0; i < pos.count; i++) {
			const y = pos.getY(i);
			col.fill(THREE.MathUtils.lerp(1, 0.07, smooth(y, 2.6, 5.0)) * (0.8 + 0.2 * smooth(y, 0, 0.5)), i * 3, i * 3 + 3);
		}
		g.setAttribute('color', new THREE.BufferAttribute(col, 3));
		this.stoneWalls = this.add(g, this.wallFade.apply(this.stoneMaterial(1)), 0, 0, 0, { parent: this.group, name: 'Mason stone walls (stairwell, door)' });
		this.stoneWalls.userData.labSolid = true;
	}

	// ---- the hole in the Wall (the first light) --------------------------------------------------------------------------------

	buildHole() {
		const { apex } = O.FACE;
		const H = O.HOLE;
		const group = new THREE.Group();
		group.name = 'The hole in the Wall';
		group.position.set(apex.x, 0, apex.z);
		this.root.add(group);
		this.holeGroup = group;
		// behind the wall: a black back plate, and a cold-white emissive plate that only shows through the cracks of the stone plug in front of it
		this.add(new THREE.BoxGeometry(2.6, 2.7, 0.12), this.own(new THREE.MeshBasicMaterial({ color: 0x000000 })), 0, 1.35, -1.0, { parent: group, cast: false, name: 'Recess · back' });
		this.fissureMaterial = this.own(new THREE.MeshBasicMaterial({ name: 'Fissure (HDR cold white)', color: new THREE.Color(3.0, 3.35, 3.9), toneMapped: false }));
		const lightPlate = this.add(new THREE.PlaneGeometry(1.1, 2.15).translate(0, 1.075, 0), this.fissureMaterial, 0, 0, -0.28, { parent: group, cast: false, receive: false, name: 'Fissure light' });
		NO_PICK(lightPlate);
		// the plug: bone-and-mortar wall filling the gap, a jagged crack (about 0.6 m wide at the floor, a hairline near 2.3 m) and three thin side cracks cut through it
		const rand = kit.rng(5521);
		const left = [];
		const right = [];
		const N = 18;
		for (let i = 0; i <= N; i++) {
			const t = i / N;
			const y = t * H.height;
			const half = (0.3 * (1 - t ** 1.15) + 0.008) * (0.75 + 0.5 * rand());
			const sway = Math.sin(t * 7.3 + 1.1) * 0.06 * (1 - t) + (rand() - 0.5) * 0.045;
			left.push([sway - half, y]);
			right.push([sway + half * (0.8 + 0.4 * rand()), y]);
		}
		const W = 1.56; // wider than the gap: the plug's ends sit behind the modules
		const shape = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(W / 2, 2.72), new THREE.Vector2(-W / 2, 2.72)]);
		const main = new THREE.Path();
		main.moveTo(left[0][0], -0.01);
		for (const p of left) main.lineTo(p[0], p[1]);
		for (let i = right.length - 1; i >= 0; i--) main.lineTo(right[i][0], right[i][1]);
		main.closePath();
		shape.holes.push(main);
		const crack = (x0, y0, len, lean, w) => {
			const p = new THREE.Path();
			const pts = [];
			const n = 6;
			for (let i = 0; i <= n; i++) pts.push([x0 + lean * (i / n) * len + (rand() - 0.5) * 0.03, y0 + (len * i) / n]);
			p.moveTo(pts[0][0] - w, pts[0][1]);
			for (let i = 1; i <= n; i++) p.lineTo(pts[i][0] - w * (1 - i / n) - 0.004, pts[i][1]);
			for (let i = n; i >= 0; i--) p.lineTo(pts[i][0] + w * (1 - i / n) + 0.004, pts[i][1]);
			p.closePath();
			shape.holes.push(p);
		};
		crack(-0.5, 0.5, 0.75, 0.2, 0.014);
		crack(0.48, 1.1, 0.8, -0.25, 0.012);
		crack(-0.42, 1.55, 0.55, -0.15, 0.01);
		const plugGeometry = kit.worldUV(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false, curveSegments: 4 }));
		const pc = new Float32Array(plugGeometry.attributes.position.count * 3);
		for (let i = 0; i < pc.length / 3; i++) pc.fill(THREE.MathUtils.lerp(1, 0.06, smooth(plugGeometry.attributes.position.getY(i), 1.0, 2.7)) * 0.85, i * 3, i * 3 + 3);
		plugGeometry.setAttribute('color', new THREE.BufferAttribute(pc, 3));
		this.add(plugGeometry, this.stoneMaterial(1), 0, 0, -0.15, { parent: group, name: 'Plug (bone and mortar round the crack)' }); // front face flush with the modules' fronts: no dark jambs
		// a few skulls and long bones set into the plug round the crack's edge
		const bone = this.mat(0x4b473d, 0.9);
		const skull = new THREE.SphereGeometry(0.06, 10, 8);
		const jaw = new THREE.BoxGeometry(0.065, 0.035, 0.055);
		[[-0.5, 0.35], [0.46, 0.8], [-0.52, 1.35], [0.4, 1.8], [0.56, 1.3], [-0.34, 2.0], [0.34, 0.25], [-0.58, 0.9]].forEach(([x, y], i) => {
			const s = this.add(skull, bone, x, y, 0.16, { parent: group, name: 'Skull in the Wall' });
			s.scale.set(1, 1.1, 0.9);
			s.rotation.set(0.2, (i - 2) * 0.35, 0);
			this.add(jaw, bone, x, y - 0.06, 0.2, { parent: group, cast: false, name: 'Jaw' }).rotation.y = (i - 2) * 0.35;
		});
		for (const [x, y, z, len] of [[0.28, 0.62, -0.5, 0.42], [-0.4, 1.05, 0.3, 0.38], [0.42, 1.5, -0.8, 0.36], [-0.3, 0.2, 0.9, 0.34], [0.5, 2.0, 0.4, 0.3]]) this.add(new THREE.CylinderGeometry(0.014, 0.016, len, 6), bone, x, y, 0.155, { parent: group, cast: false, name: 'Long bone set in the mortar' }).rotation.z = z;
		// a soft cold halo round it and the glow it throws on the floor in front (additive, VFX layer: it must not enter the scene pass' normal target)
		const glowTex = this.softGlow();
		this.haloMaterial = this.own(new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(0.55, 0.7, 1.0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.22 }));
		const halo = new THREE.Mesh(this.ownGeo(new THREE.PlaneGeometry(2.0, 3.4)), this.haloMaterial);
		halo.position.set(apex.x, 1.3, apex.z + 0.35);
		halo.renderOrder = 4;
		NO_PICK(halo);
		this.vfx.add(halo);
		(this.billboards ??= []).push(halo); // faces the camera: a vertical quad seen from above would be a bright bar
		this.glowMaterial = this.own(new THREE.MeshBasicMaterial({ map: glowTex, color: new THREE.Color(0.5, 0.65, 1.0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.1 }));
		const glow = new THREE.Mesh(this.aoGeometry, this.glowMaterial);
		glow.scale.set(6.5, 1, 6.0);
		glow.position.set(apex.x, 0.05, apex.z + 2.0);
		glow.renderOrder = 3;
		NO_PICK(glow);
		this.vfx.add(glow);
		// the lights: the scene's one shadowed spot (aimed across the horseshoe toward its opening) and one small unshadowed cold point
		const L = O.LIGHTS;
		const spot = new THREE.SpotLight(COLD, 130, 22, 1.0, 0.9, 2);
		spot.name = 'Light · the hole (shadowed spot)';
		spot.position.set(L.spot.x, L.spot.y, L.spot.z);
		spot.target.position.set(L.spot.tx, L.spot.ty, L.spot.tz);
		spot.castShadow = true;
		const size = this.app.settings.data.lighting?.shadowMapSize ?? 2048; // the Lighting panel owns the size; allocated at it from the start (a later change would dispose the map)
		spot.shadow.mapSize.set(size, size);
		spot.shadow.bias = -0.0006;
		spot.shadow.normalBias = 0.03;
		spot.shadow.radius = 4; // soft edge: one long shadow, not hard spokes
		spot.shadow.camera.near = 0.4;
		spot.shadow.camera.far = 24;
		spot.userData.labBiasOverride = true;
		this.group.add(spot, spot.target);
		this.spot = spot;
		this.sources.push({ light: spot, base: 130, seed: 0, steady: true, shimmer: true, name: 'The hole (shadowed spot)', kelvin: 8500 });
		this.counts.lights++;
		this.lift = this.addLight({ name: 'The hole (cold lift)', x: L.lift.x, y: L.lift.y, z: L.lift.z, color: COLD, base: 2.5, distance: 5, decay: 2, steady: true });
		this.lift.shimmer = true;
	}

	/** A white soft round glow (alpha falloff) for additive blends: radialTexture() is black, for contact shadows. */
	softGlow() {
		if (this._softGlow) return this._softGlow;
		const c = document.createElement('canvas');
		c.width = c.height = 128;
		const g = c.getContext('2d');
		const grad = g.createRadialGradient(64, 64, 0, 64, 64, 62);
		grad.addColorStop(0, 'rgba(255,255,255,1)');
		grad.addColorStop(0.3, 'rgba(255,255,255,0.5)');
		grad.addColorStop(0.65, 'rgba(255,255,255,0.12)');
		grad.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = grad;
		g.fillRect(0, 0, 128, 128);
		const tex = new THREE.CanvasTexture(c);
		tex.colorSpace = THREE.SRGBColorSpace;
		this.ownTextures.push(tex);
		return (this._softGlow = tex);
	}

	/** The inscription over the fissure: carved capitals in a worn grey lintel, a normal map from the blurred letter mask so the light from below catches the cuts. */
	buildPlaque() {
		const W = 1024;
		const Hh = 200;
		const rand = kit.rng(9001);
		const c = document.createElement('canvas');
		c.width = W;
		c.height = Hh;
		const g = c.getContext('2d');
		const px = g.createImageData(W, Hh);
		for (let y = 0; y < Hh; y++) {
			for (let x = 0; x < W; x++) {
				const n = O.fbm(x * 0.012, y * 0.02 + 3, 1) * 0.65 + O.noise(x * 0.35, y * 0.35) * 0.35;
				const v = 44 + n * 50 + (y < 10 || y > Hh - 12 ? -16 : 0);
				const o = (y * W + x) * 4;
				px.data[o] = v * 0.98;
				px.data[o + 1] = v;
				px.data[o + 2] = v * 0.95;
				px.data[o + 3] = 255;
			}
		}
		g.putImageData(px, 0, 0);
		// hairline cracks and chipped corners
		g.strokeStyle = 'rgba(25,26,24,0.55)';
		g.lineWidth = 2;
		for (let k = 0; k < 7; k++) {
			g.beginPath();
			let x = rand() * W;
			let y = rand() < 0.5 ? 0 : Hh;
			g.moveTo(x, y);
			for (let s = 0; s < 6; s++) {
				x += (rand() - 0.5) * 50;
				y += (y === 0 ? 1 : -1) * rand() * 30;
				g.lineTo(x, y);
			}
			g.stroke();
		}
		// stains: long dark-green drips from the top edge and a few damp blooms
		for (let k = 0; k < 16; k++) {
			const x = rand() * W;
			const grad = g.createLinearGradient(0, 0, 0, Hh);
			grad.addColorStop(0, `rgba(20,26,22,${0.25 + rand() * 0.3})`);
			grad.addColorStop(1, 'rgba(20,26,22,0)');
			g.fillStyle = grad;
			g.fillRect(x, 0, 3 + rand() * 16, Hh * (0.4 + rand() * 0.6));
		}
		const text = 'BE KIND TO THEM';
		g.font = 'bold 100px "Times New Roman", Georgia, serif';
		g.letterSpacing = '10px';
		const fontPx = Math.floor((100 * (W - 200)) / Math.max(W - 200, g.measureText(text).width)); // the whole line fits, whatever serif the browser picks
		const draw = (ctx, fill, dx = 0, dy = 0) => {
			ctx.save();
			ctx.fillStyle = fill;
			ctx.textBaseline = 'middle';
			ctx.font = `bold ${fontPx}px "Times New Roman", Georgia, serif`;
			ctx.letterSpacing = '10px';
			ctx.fillText(text, 150 + dx, Hh / 2 + 4 + dy);
			// the Wedge (a keystone) before the text
			ctx.beginPath();
			ctx.moveTo(54 + dx, 62 + dy);
			ctx.lineTo(124 + dx, 62 + dy);
			ctx.lineTo(108 + dx, 142 + dy);
			ctx.lineTo(70 + dx, 142 + dy);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		};
		g.filter = 'blur(0.7px)';
		draw(g, 'rgba(176,192,208,0.46)', 1.5, 2); // the lit lower lip of each cut: a cold catch-light
		g.filter = 'blur(0.9px)'; // the cut edges are worn, not crisp
		draw(g, 'rgba(40,43,45,0.82)'); // the groove floor: dark, but a little lighter than before so the letters read
		g.filter = 'none';
		// weathering: stone-coloured specks eat the letters
		for (let k = 0; k < 2200; k++) {
			g.fillStyle = `rgba(${70 + rand() * 40},${72 + rand() * 40},${68 + rand() * 38},${0.25 + rand() * 0.5})`;
			g.fillRect(rand() * W, 40 + rand() * (Hh - 80), 1 + rand() * 3, 1 + rand() * 3);
		}
		// the height from the blurred letter mask → a tangent-space normal map
		const m = document.createElement('canvas');
		m.width = W;
		m.height = Hh;
		const mg = m.getContext('2d');
		mg.fillStyle = '#000';
		mg.fillRect(0, 0, W, Hh);
		mg.filter = 'blur(2.5px)';
		draw(mg, '#fff');
		const mask = mg.getImageData(0, 0, W, Hh).data;
		const normal = document.createElement('canvas');
		normal.width = W;
		normal.height = Hh;
		const ng = normal.getContext('2d');
		const nd = ng.createImageData(W, Hh);
		const hAt = (x, y) => 1 - mask[(Math.min(Hh - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))) * 4] / 255; // letters are lowered
		for (let y = 0; y < Hh; y++) {
			for (let x = 0; x < W; x++) {
				const dx = (hAt(x + 1, y) - hAt(x - 1, y)) * 5.5;
				const dy = (hAt(x, y + 1) - hAt(x, y - 1)) * 5.5;
				const inv = 1 / Math.hypot(dx, dy, 1);
				const o = (y * W + x) * 4;
				nd.data[o] = (-dx * inv * 0.5 + 0.5) * 255;
				nd.data[o + 1] = (dy * inv * 0.5 + 0.5) * 255; // OpenGL: +y up in the image → flip the green
				nd.data[o + 2] = (inv * 0.5 + 0.5) * 255;
				nd.data[o + 3] = 255;
			}
		}
		ng.putImageData(nd, 0, 0);
		const map = new THREE.CanvasTexture(c);
		map.colorSpace = THREE.SRGBColorSpace;
		map.anisotropy = Math.min(8, this.app.backend.caps.maxAnisotropy || 4);
		const normalMap = new THREE.CanvasTexture(normal);
		normalMap.colorSpace = THREE.NoColorSpace;
		normalMap.anisotropy = map.anisotropy;
		this.ownTextures.push(map, normalMap);
		const material = this.own(new THREE.MeshStandardMaterial({ name: 'Plaque (BE KIND TO THEM)', map, normalMap, normalScale: new THREE.Vector2(2.0, 2.0), roughness: 0.95, metalness: 0, color: new THREE.Color(0.42, 0.42, 0.4) }));
		const { apex } = O.FACE;
		const edge = this.mat(0x2e2f2c, 0.95); // the cut sides and top: dark, so the skylight does not turn the lintel into a white bar from above
		const plaque = this.add(new THREE.BoxGeometry(1.7, 0.34, 0.14), [edge, edge, edge, edge, material, edge], apex.x, 2.4, apex.z + 0.27, { parent: this.root, name: 'Plaque · BE KIND TO THEM' });
		this.plaque = plaque;
	}

	// ---- the vigil -------------------------------------------------------------------------------------------------------------

	buildVigil() {
		const C = O.CHAIR;
		const wood = this.mat(0x4a3a2a, 0.88);
		const woodDark = this.mat(0x3a2d21, 0.9);
		const chair = new THREE.Group();
		chair.name = 'Vigil chair';
		chair.position.set(C.x, O.floorY(C.x, C.z), C.z);
		chair.rotation.set(0.012, C.yaw, 0.028, 'YXZ'); // crooked: patched and mended
		this.props.add(chair);
		const leg = (x, z, h = 0.45, tilt = 0) => {
			const m = this.add(new THREE.BoxGeometry(0.045, h, 0.045), woodDark, x, h / 2, z, { parent: chair, name: 'Chair leg' });
			m.rotation.z = tilt;
		};
		leg(-0.19, 0.18);
		leg(0.19, 0.18);
		leg(-0.18, -0.19, 0.44, 0.025);
		leg(0.2, -0.2, 0.46, -0.02);
		this.add(new THREE.BoxGeometry(0.46, 0.04, 0.44), wood, 0, 0.465, 0, { parent: chair, name: 'Chair seat' });
		// the back posts rise behind the seat (local -z, away from the Face)
		for (const s of [-1, 1]) this.add(new THREE.BoxGeometry(0.04, 0.5, 0.04), woodDark, s * 0.2, 0.7, -0.2, { parent: chair, name: 'Chair back post' }).rotation.x = -0.07;
		for (const [y, tilt] of [[0.68, 0.01], [0.82, -0.015], [0.94, 0.02]]) this.add(new THREE.BoxGeometry(0.4, 0.045, 0.025), wood, 0, y, -0.225, { parent: chair, name: 'Chair rung' }).rotation.z = tilt;
		// the folded blanket: a rounded box of muted grey-green wool, two folds
		const wool = this.mat(0x586153, 1);
		this.add(new RoundedBoxGeometry(0.42, 0.075, 0.36, 3, 0.03), wool, 0.0, 0.52, 0.0, { parent: chair, name: 'Folded blanket' }).rotation.y = 0.12;
		this.add(new RoundedBoxGeometry(0.4, 0.05, 0.3, 3, 0.02), this.mat(0x4a5246, 1), 0.01, 0.58, 0.01, { parent: chair, name: 'Folded blanket · top fold' }).rotation.y = 0.2;
		// the clay pipe and its ash
		const pipe = new THREE.Group();
		pipe.name = 'Clay pipe';
		const clay = this.mat(0xb4a88f, 0.7);
		this.add(new THREE.CylinderGeometry(0.006, 0.007, 0.15, 6).rotateZ(Math.PI / 2), clay, 0, 0.008, 0, { parent: pipe, cast: false });
		this.add(new THREE.CylinderGeometry(0.019, 0.013, 0.04, 8), clay, 0.07, 0.027, 0, { parent: pipe, cast: false });
		pipe.position.set(C.x - 0.45, O.floorY(C.x, C.z) + 0.01, C.z + 0.12);
		pipe.rotation.y = 0.9;
		this.props.add(pipe);
		this.spots.push({ x: C.x - 0.4, z: C.z + 0.1, cell: 7, size: 0.7 }, { x: C.x - 0.15, z: C.z + 0.3, cell: 12, size: 0.5 }, { x: C.x + 0.25, z: C.z + 0.1, cell: 7, size: 0.45 });
		// a bowl of milk for the Kind Ones at the Face's foot (creamy, dim, never clean white)
		const { apex } = O.FACE;
		const bx = apex.x + 1.2;
		const bz = apex.z + 0.5;
		const lathe = new THREE.LatheGeometry([[0, 0], [0.06, 0], [0.1, 0.045], [0.125, 0.09], [0.115, 0.095], [0.09, 0.05], [0, 0.03]].map((p) => new THREE.Vector2(p[0], p[1])), 14);
		const bowl = this.add(lathe, this.mat(0x5d5448, 0.8, { side: THREE.DoubleSide }), bx, O.floorY(bx, bz), bz, { name: 'Bowl of milk' });
		bowl.rotation.y = 0.3;
		this.add(new THREE.CircleGeometry(0.1, 14).rotateX(-Math.PI / 2), this.mat(0xb9ae92, 0.25), bx, O.floorY(bx, bz) + 0.075, bz, { cast: false, name: 'Milk' });
	}

	/** The waxy shelf: a low stone ledge, ivory wax drips over its front and a pale wax crust on top, wax decals below; the candle clusters stand on it (PROPS). */
	buildShelf() {
		const S = O.WAX_SHELF;
		const group = new THREE.Group();
		group.name = 'Waxy shelf';
		group.position.set(S.x, 0, S.z);
		group.rotation.y = S.yaw;
		this.props.add(group);
		const stone = this.stoneMaterial(0.9, false);
		const body = this.add(kit.worldUV(new THREE.BoxGeometry(S.len, S.h, S.depth)), stone, 0, S.h / 2, 0, { parent: group, name: 'Shelf · stone' });
		body.geometry.attributes.uv.array.forEach((v, i, a) => (a[i] = v * 0.6));
		const wax = this.mat(0xb3a784, 0.24);
		const rand = kit.rng(2207);
		const parts = [];
		const place = (g, x, y, z, sx, sy, sz) => parts.push(baked(g, this._m4.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz))));
		// a thin crust on top, uneven
		for (let i = 0; i < 16; i++) place(new THREE.SphereGeometry(0.045 + rand() * 0.04, 8, 5), -S.len / 2 + 0.12 + rand() * (S.len - 0.24), S.h - 0.014 + rand() * 0.008, -0.07 + rand() * 0.07, 1 + rand() * 1.4, 0.35 + rand() * 0.25, 0.7 + rand() * 0.5); // an uneven crust at the back of the ledge, not discs along its front
		// drips: elongated rounded blobs hanging from the front edge, different lengths
		for (let x = -S.len / 2 + 0.12; x < S.len / 2 - 0.1;) {
			const clump = rand() < 0.4 ? 2 + Math.floor(rand() * 3) : 1; // some drips run together
			for (let c = 0; c < clump; c++) {
				const len = 0.03 + rand() ** 2.2 * 0.3;
				const r = 0.008 + rand() ** 1.5 * 0.022;
				const dx = x + c * (0.025 + rand() * 0.03);
				place(new THREE.SphereGeometry(r, 7, 6), dx, S.h - len / 2 + 0.02, S.depth / 2 + r * 0.4, 1, (len / 2 + r) / r, 0.7);
				if (rand() < 0.7) place(new THREE.SphereGeometry(r * 1.4, 7, 6), dx, S.h - len + 0.02, S.depth / 2 + r * 0.4, 1, 1, 0.7); // the bulb at the end
			}
			x += 0.07 + rand() ** 1.6 * 0.4 + clump * 0.03;
		}
		// (no loose lumps on the floor: they read as pale buttons; the wax decals below the shelf carry the spill)
		this.add(mergeGeometries(parts), wax, 0, 0, 0, { parent: group, name: 'Shelf · wax drips' });
		// wax and soot on the floor round it, and the stubs of thirty generations
		const fx = Math.sin(S.yaw);
		const fz = Math.cos(S.yaw);
		for (const [k, cell, size] of [[0.15, 5, 0.6], [-0.3, 7, 0.9]]) this.spots.push({ x: S.x + fx * 0.6 + fz * k, z: S.z + fz * 0.6 - fx * k, cell, size });
	}

	// ---- dead sconces, pinpoints -----------------------------------------------------------------------------------------------

	buildSconces() {
		const list = O.sconces();
		const bracket = this.ownGeo(kit.wallBracket());
		const stub = this.ownGeo(new THREE.CylinderGeometry(0.02, 0.022, 0.11, 7).translate(0, -0.03 + 0.055, 0.32));
		const iron = this.wallFade.apply(this.own(new THREE.MeshStandardMaterial({ name: 'Iron', color: 0x2a2a28, roughness: 0.6, metalness: 0.7 })));
		const wick = this.wallFade.apply(this.own(new THREE.MeshStandardMaterial({ name: 'Candle stub', color: 0xbdb398, roughness: 0.6 })));
		const make = (geometry, material, name) => {
			const mesh = new THREE.InstancedMesh(geometry, material, list.length);
			mesh.name = name;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.frustumCulled = false;
			mesh.userData.labNoCollide = true;
			this.root.add(mesh);
			return mesh;
		};
		const a = make(bracket, iron, 'Dead sconces (iron)');
		const b = make(stub, wick, 'Dead sconces (candle stubs)');
		const soot = new THREE.InstancedMesh(this.ownGeo(decalGeometry(7).rotateX(Math.PI / 2)), this.wallFade.apply(this.own(this.decalMaterial.clone())), list.length);
		soot.name = 'Soot above the sconces';
		soot.frustumCulled = false;
		NO_PICK(soot);
		this.root.add(soot);
		const q = new THREE.Quaternion();
		list.forEach((s, i) => {
			q.setFromAxisAngle(UP, s.yaw);
			a.setMatrixAt(i, this._m4.compose(new THREE.Vector3(s.x, s.y, s.z), q, new THREE.Vector3(1, 1, 1)));
			b.setMatrixAt(i, this._m4);
			soot.setMatrixAt(i, this._m4.compose(new THREE.Vector3(s.x + s.nx * 0.012, s.y + 0.62, s.z + s.nz * 0.012), q, new THREE.Vector3(0.75, 0.9, 1)));
		});
		soot.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3).fill(0.45), 3);
		this.sconceList = list;
	}

	/** 6-10 still cold pinpoints leaking from cracks in the horseshoe: emissive specks + a small additive halo, no lights. */
	buildPinpoints() {
		const list = O.pinpoints();
		const core = new THREE.InstancedMesh(this.ownGeo(new THREE.CircleGeometry(0.018, 8)), this.own(new THREE.MeshBasicMaterial({ name: 'Pinpoints (emissive)', color: new THREE.Color(1, 1, 1), toneMapped: false })), list.length);
		core.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
		core.frustumCulled = false;
		core.name = 'Pinpoints';
		NO_PICK(core);
		this.root.add(core);
		const haloTex = this.softGlow();
		const halo = new THREE.InstancedMesh(this.ownGeo(new THREE.PlaneGeometry(0.09, 0.09)), this.own(new THREE.MeshBasicMaterial({ map: haloTex, color: new THREE.Color(0.5, 0.65, 1.0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.12 })), list.length);
		halo.frustumCulled = false;
		halo.name = 'Pinpoint halos';
		NO_PICK(halo);
		this.vfx.add(halo);
		const q = new THREE.Quaternion();
		list.forEach((p, i) => {
			q.setFromAxisAngle(UP, Math.atan2(p.nx, p.nz));
			core.setMatrixAt(i, this._m4.compose(new THREE.Vector3(p.x + p.nx * 0.006, p.y, p.z + p.nz * 0.006), q, new THREE.Vector3(1, 1, 1)));
			halo.setMatrixAt(i, this._m4.compose(new THREE.Vector3(p.x + p.nx * 0.05, p.y, p.z + p.nz * 0.05), q, new THREE.Vector3(1, 1, 1)));
		});
		this.pinCore = core;
		this.pinHalo = halo;
		this.pinCount = list.length;
	}

	/** The warm wall: wet dark streaks over one module (peat brown, glossy), crumbled mortar and three rat holes at its foot. */
	buildWarmWall() {
		const W = O.WARM_WALL;
		const rand = kit.rng(3303);
		const c = document.createElement('canvas');
		c.width = 512;
		c.height = 256;
		const g = c.getContext('2d');
		for (let k = 0; k < 46; k++) {
			const x = rand() * 512;
			const w = 4 + rand() * 18;
			const h = 60 + rand() * 190;
			const y0 = rand() * 40;
			const grad = g.createLinearGradient(0, y0, 0, y0 + h);
			grad.addColorStop(0, `rgba(48,34,24,${0.1 + rand() * 0.2})`);
			grad.addColorStop(0.6, `rgba(34,24,17,${0.3 + rand() * 0.3})`);
			grad.addColorStop(1, 'rgba(34,24,17,0)');
			g.fillStyle = grad;
			g.beginPath();
			g.ellipse(x, y0 + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
			g.fill();
		}
		const map = new THREE.CanvasTexture(c);
		map.colorSpace = THREE.SRGBColorSpace;
		this.ownTextures.push(map);
		const material = this.own(new THREE.MeshStandardMaterial({ name: 'Warm wall (wet streaks)', map, transparent: true, depthWrite: false, roughness: 0.28, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
		const streak = this.add(new THREE.PlaneGeometry(W.width, 1.9), material, W.x, 1.05, W.z + 0.05, { cast: false, name: 'Warm wall · streaks' });
		streak.userData.labNoPick = streak.userData.labNoCollide = true;
		// the rat holes
		const hc = document.createElement('canvas');
		hc.width = hc.height = 128;
		const hg = hc.getContext('2d');
		const r = hg.createRadialGradient(64, 78, 6, 64, 78, 58);
		r.addColorStop(0, 'rgba(0,0,0,1)');
		r.addColorStop(0.62, 'rgba(2,1,1,0.96)');
		r.addColorStop(0.86, 'rgba(24,18,14,0.5)');
		r.addColorStop(1, 'rgba(24,18,14,0)');
		hg.fillStyle = r;
		hg.beginPath();
		hg.moveTo(8, 128);
		hg.quadraticCurveTo(10, 20, 64, 14);
		hg.quadraticCurveTo(118, 20, 120, 128);
		hg.closePath();
		hg.fill();
		const holeMap = new THREE.CanvasTexture(hc);
		holeMap.colorSpace = THREE.SRGBColorSpace;
		this.ownTextures.push(holeMap);
		const holeMat = this.own(new THREE.MeshBasicMaterial({ map: holeMap, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 }));
		this.ratHoles = [];
		for (const h of O.RAT_HOLES) {
			const m = this.add(new THREE.PlaneGeometry(0.42, 0.42), holeMat, h.x, 0.21, W.z + 0.06, { cast: false, receive: false, name: 'Rat hole' });
			NO_PICK(m);
			this.ratHoles.push(m);
			this.spots.push({ x: h.x + 0.05, z: h.z - 0.1, cell: 11, size: 0.75 }, { x: h.x - 0.2, z: h.z + 0.25, cell: 12, size: 0.6 });
		}
		for (const k of O.KNOCK) this.spots.push({ x: k.x, z: k.z + 0.4, cell: 11, size: 0.6 });
	}

	// ---- props -----------------------------------------------------------------------------------------------------------------

	buildProps() {
		const shelf = O.WAX_SHELF;
		const fx = Math.cos(shelf.yaw);
		const fz = -Math.sin(shelf.yaw);
		const rand = kit.rng(7301);
		for (const p of O.PROPS) {
			const src = this.mesh[p.kind];
			if (!src) continue;
			if (p.shelf !== undefined) {
				const x = shelf.x + fx * p.shelf;
				const z = shelf.z + fz * p.shelf;
				this.put(src, x, z, { scale: p.scale, yaw: p.yaw, y: shelf.h + 0.05, sink: 0, ao: 0 });
				continue;
			}
			let source = src;
			if (p.kind === 'boulders') {
				// the flint boulders' albedo is bone white: greyed down so they stay rubble in the near dark
				this.boulderMaterial ??= Object.assign(this.own(src.material.clone()), { color: new THREE.Color(0.28, 0.28, 0.27) });
				source = { geometry: src.geometry, material: this.boulderMaterial, name: src.name };
			}
			this.put(source, p.x, p.z, { scale: p.scale, yaw: p.yaw, ao: p.ao ?? (p.kind === 'bonePile' ? 1.15 : 1.3), sink: p.kind === 'column' ? 0.08 : 0.03 });
			if (p.kind === 'bonePile') for (let i = 0; i < 3; i++) this.spots.push({ x: p.x + (rand() - 0.5) * 2, z: p.z + (rand() - 0.5) * 1.8, cell: [0, 2, 3, 3][Math.floor(rand() * 4)], size: 0.3 + rand() * 0.2 });
			else if (p.kind === 'column' || p.kind === 'boulders') for (let i = 0; i < 3; i++) this.spots.push({ x: p.x + (rand() - 0.5) * 3, z: p.z + (rand() - 0.5) * 2.4, cell: 11, size: 0.4 + rand() * 0.3 });
		}
	}

	// ---- Gennet's lantern, the first faceless statue ---------------------------------------------------------------------------

	buildGennet() {
		const G = O.GENNET;
		const group = new THREE.Group();
		group.name = "Gennet's lantern";
		group.position.set(G.x, G.y, G.z + 0.1);
		this.root.add(group);
		const iron = this.own(new THREE.MeshStandardMaterial({ name: 'Lantern iron', color: 0x1f1e1c, roughness: 0.55, metalness: 0.8 }));
		// the hook in the door wall and the chain
		const hook = new THREE.Group();
		hook.position.set(G.x, G.y + 0.62, O.DOOR.z + 0.04);
		this.add(new THREE.BoxGeometry(0.05, 0.05, 0.3), iron, 0, 0, 0.15, { parent: hook, cast: false });
		this.add(new THREE.TorusGeometry(0.035, 0.01, 6, 12), iron, 0, -0.04, 0.3, { parent: hook, cast: false }).rotation.y = Math.PI / 2;
		this.root.add(hook);
		this.add(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 5), iron, 0, 0.55, 0.16 - 0.1, { parent: group, cast: false, name: 'Lantern chain' });
		// the cage: base plate, six thin bars, a ring, the cap
		this.add(new THREE.CylinderGeometry(0.12, 0.14, 0.05, 10), iron, 0, -0.2, 0, { parent: group, name: 'Lantern base' });
		for (let k = 0; k < 6; k++) {
			const a = (k / 6) * Math.PI * 2;
			this.add(new THREE.CylinderGeometry(0.013, 0.013, 0.4, 5), iron, Math.cos(a) * 0.1, 0.02, Math.sin(a) * 0.1, { parent: group, cast: false, name: 'Lantern bar' });
		}
		this.add(new THREE.TorusGeometry(0.1, 0.012, 5, 14).rotateX(Math.PI / 2), iron, 0, 0.22, 0, { parent: group, cast: false });
		this.add(new THREE.TorusGeometry(0.1, 0.012, 5, 14).rotateX(Math.PI / 2), iron, 0, -0.16, 0, { parent: group, cast: false });
		this.add(new THREE.ConeGeometry(0.16, 0.14, 10), iron, 0, 0.3, 0, { parent: group, name: 'Lantern cap' });
		this.add(new THREE.TorusGeometry(0.03, 0.009, 5, 10), iron, 0, 0.4, 0, { parent: group, cast: false });
		// the candle inside and its glow body
		this.add(new THREE.CylinderGeometry(0.03, 0.034, 0.12, 8), this.mat(0xc7bd9c, 0.6), 0, -0.11, 0, { parent: group, cast: false });
		this.lanternGlowMaterial = this.own(new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false }));
		this.add(new THREE.SphereGeometry(0.04, 8, 6), this.lanternGlowMaterial, 0, 0.0, 0, { parent: group, cast: false, receive: false, name: 'Lantern flame core' });
		this.lanternGroup = group;
		// a warm halo round the lantern and a light leak on the landing: additive, VFX layer, HDR so they bloom in the far views too
		this.lanternHaloMaterial = this.own(new THREE.MeshBasicMaterial({ map: this.softGlow(), color: new THREE.Color(0, 0, 0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const halo = new THREE.Mesh(this.ownGeo(new THREE.PlaneGeometry(0.8, 0.8)), this.lanternHaloMaterial);
		halo.position.set(G.x, G.y, G.z + 0.6);
		halo.renderOrder = 5;
		NO_PICK(halo);
		this.vfx.add(halo);
		(this.billboards ??= []).push(halo);
		this.doorGlowMaterial = this.own(new THREE.MeshBasicMaterial({ map: this.softGlow(), color: new THREE.Color(0, 0, 0), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const leak = new THREE.Mesh(this.aoGeometry, this.doorGlowMaterial);
		leak.scale.set(4.2, 1, 4.6);
		leak.position.set(13.7, O.STAIR.top + 0.05, -4.3);
		leak.renderOrder = 3;
		NO_PICK(leak);
		this.vfx.add(leak);
		// soot above on the wall
		const soot = new THREE.Mesh(this.ownGeo(new THREE.PlaneGeometry(1, 1)), this.own(new THREE.MeshBasicMaterial({ map: this.aoTexture, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8 })));
		soot.position.set(G.x, G.y + 0.9, O.DOOR.z + 0.045);
		soot.scale.set(0.9, 1.5, 1);
		NO_PICK(soot);
		this.root.add(soot);
		// the sliver of church floor past the threshold: warm, fading to black two metres in
		const cg = new THREE.PlaneGeometry(O.DOOR.width + 0.4, 2.0, 1, 5).rotateX(-Math.PI / 2);
		const cp = cg.attributes.position;
		const cc = new Float32Array(cp.count * 3);
		for (let i = 0; i < cp.count; i++) cc.fill(Math.max(0, (cp.getZ(i) + 1.0) / 2.0) ** 1.5, i * 3, i * 3 + 3); // z -1 (far) .. +1 (threshold)
		cg.setAttribute('color', new THREE.BufferAttribute(cc, 3));
		this.churchFloorMaterial = this.own(new THREE.MeshBasicMaterial({ name: 'Church floor past the door', color: new THREE.Color(0, 0, 0), vertexColors: true }));
		const church = this.add(cg, this.churchFloorMaterial, O.DOOR.x, O.STAIR.top + 0.012, O.DOOR.z - 1.05, { cast: false, receive: false, name: 'Church floor (past the door)' });
		NO_PICK(church);
		// the flame (a billboard of the lab's flame effect) and the warm lights
		const fi = this.flames.add(new THREE.Vector3(G.x, G.y - 0.1, G.z + 0.1), { width: 0.16, height: 0.3, strength: 0 });
		this.lanternFlame = fi;
		this.counts.flames = 1;
		const L = O.LIGHTS;
		this.lanternSource = this.addLight({ name: "Gennet's lantern", x: L.lantern.x, y: L.lantern.y, z: L.lantern.z + 0.35, color: WARM.clone().lerp(kelvinToColor(2400), 0.45), base: 18, distance: 11, decay: 2, seed: 4 });
		// a dim warm bounce at the stair's foot, aimed up the risers (they face south, away from the lantern)
		this.bounceSource = this.addLight({ name: 'Lantern bounce (stair foot)', x: 13.7, y: 0.6, z: 2.9, color: WARM.clone().lerp(kelvinToColor(2200), 0.5), base: 9, distance: 6, decay: 2, seed: 12 });
		this.spillSource = this.addLight({ name: 'Lantern spill (stair)', x: L.spill.x, y: L.spill.y, z: L.spill.z, color: WARM.clone().lerp(kelvinToColor(2200), 0.5), base: 6, distance: 7, decay: 2, seed: 9 });
	}

	buildStatue() {
		const S = O.STATUE;
		const stone = this.own(new THREE.MeshStandardMaterial({ name: 'Statue stone', map: this.stoneMap, normalMap: this.stoneNormal, color: new THREE.Color(0.62, 0.62, 0.6), roughness: 0.95, metalness: 0 }));
		const group = new THREE.Group();
		group.name = 'Faceless statue';
		group.position.set(S.x, O.STAIR.top, S.z);
		group.rotation.y = S.yaw;
		this.props.add(group);
		this.add(kit.worldUV(new THREE.BoxGeometry(0.78, 0.2, 0.78)), stone, 0, 0.1, 0, { parent: group, name: 'Statue plinth' });
		// the robe: a lathe from the hem to the neck
		const profile = [[0.0, 0.2], [0.36, 0.2], [0.33, 0.45], [0.28, 0.85], [0.23, 1.15], [0.26, 1.42], [0.2, 1.58], [0.07, 1.66], [0.0, 1.66]].map((p) => new THREE.Vector2(p[0], p[1]));
		const robe = new THREE.LatheGeometry(profile, 18);
		kit.worldUV(robe);
		this.add(robe, stone, 0, 0, 0, { parent: group, name: 'Statue robe' });
		// the head: a smooth egg, no face, turned toward the stair foot
		const head = new THREE.Mesh(this.ownGeo(new THREE.SphereGeometry(0.115, 14, 10)), stone);
		head.scale.set(0.9, 1.3, 1.0);
		head.position.set(0, 1.84, 0.02);
		const toFoot = Math.atan2(13.7 - S.x, 1.5 - S.z) - S.yaw;
		head.rotation.y = toFoot;
		head.castShadow = true;
		group.add(head);
		// the arms fold to the chest: two forearms meeting in clasped hands (the first clasped hands)
		for (const s of [-1, 1]) {
			const arm = this.add(new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), stone, s * 0.15, 1.36, 0.14, { parent: group, name: 'Statue forearm' });
			arm.rotation.set(0.1, 0, s * -1.05);
		}
		this.add(new THREE.SphereGeometry(0.07, 10, 8), stone, 0, 1.34, 0.26, { parent: group, name: 'Statue clasped hands' }).scale.set(1.2, 0.9, 0.9);
	}

	// ---- atmosphere ------------------------------------------------------------------------------------------------------------

	buildAtmosphere() {
		const rand = kit.rng(6011);
		const pts = [];
		const around = (cx, cy, cz, rad, hgt, n) => {
			for (let i = 0; i < n; i++) pts.push([cx + (rand() - 0.5) * 2 * rad, cy + rand() * hgt, cz + (rand() - 0.5) * 2 * rad, rand() * 6.28, 0.015 + rand() * 0.04]);
		};
		around(O.FACE.cx, 0.2, O.FACE.cz - 1.0, 5.2, 2.8, 110);
		around(-15, 0.2, 4.2, 8, 2.0, 40);
		around(0.5, 0.2, 1.6, 3.4, 2.2, 22);
		around(13.7, 1.9, -2.0, 1.8, 2.6, 20);
		const positions = new Float32Array(pts.length * 3);
		pts.forEach((p, i) => positions.set(p.slice(0, 3), i * 3));
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		withDefaultAttributes(g);
		this.motes = { data: pts, positions, geometry: this.ownGeo(g) };
		this.moteTexture = moteTexture();
		this.ownTextures.push(this.moteTexture);
		this.moteMaterial = this.own(new THREE.PointsMaterial({ name: 'Dust motes', map: this.moteTexture, color: new THREE.Color(0.75, 0.8, 0.9), size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const points = new THREE.Points(g, this.moteMaterial);
		points.name = 'Dust motes';
		points.frustumCulled = false;
		NO_PICK(points);
		this.vfx.add(points);
		this.points = points;
	}

	/** Dust puffs (the encounters' cues, the crumbling hand): a pool of additive points that burst outward, rise and fade. */
	buildPuffs() {
		const N = 480;
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3).fill(-9999), 3));
		g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
		withDefaultAttributes(g);
		const material = this.own(new THREE.PointsMaterial({ name: 'Dust puffs', map: this.moteTexture, vertexColors: true, size: 0.3, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const points = new THREE.Points(this.ownGeo(g), material);
		points.name = 'Dust puffs';
		points.frustumCulled = false;
		NO_PICK(points);
		this.vfx.add(points);
		this.puffs = { points, N, next: 0, p: Array.from({ length: N }, () => ({ age: 9, life: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, r: 0, g: 0, b: 0 })) };
	}

	/** A puff of pale dust at a world point. kind: 'mortar' (warm grey) / 'bone' (ivory) / 'hand' (pale, cold). */
	puff(x, y, z, { count = 14, kind = 'mortar', spread = 1 } = {}) {
		if (!this.puffs) return;
		this.puffs.live = true;
		const tone = { mortar: [0.42, 0.37, 0.31], bone: [0.52, 0.5, 0.42], hand: [0.5, 0.54, 0.6] }[kind] ?? [0.4, 0.4, 0.4];
		for (let i = 0; i < count; i++) {
			const q = this.puffs.p[this.puffs.next];
			this.puffs.next = (this.puffs.next + 1) % this.puffs.N;
			const a = Math.random() * Math.PI * 2;
			const s = (0.15 + Math.random() * 0.5) * spread;
			Object.assign(q, { age: 0, life: 1.1 + Math.random() * 1.3, x: x + (Math.random() - 0.5) * 0.2, y: y + Math.random() * 0.15, z: z + (Math.random() - 0.5) * 0.2, vx: Math.cos(a) * s, vy: 0.25 + Math.random() * 0.5, vz: Math.sin(a) * s, r: tone[0], g: tone[1], b: tone[2] });
		}
	}

	// ---- decals ----------------------------------------------------------------------------------------------------------------

	/** Final layer weights (the GPU's own, smoothed splat) at world xz: out.w[i]; out.mean = the blended mean albedo; out.wet. */
	probe(x, z, out) {
		const n = O.LAYERS.length;
		this.splat.sample(x, z, out.raw);
		out.m[0] = 1;
		for (let k = 1; k < n; k++) out.m[k] = out.raw[k - 1];
		finalWeights(out.m, n, out.w);
		const r = [0, 0, 0];
		O.LAYERS.forEach((l, i) => {
			const mean = this.library.mean[l.id];
			for (let c = 0; c < 3; c++) r[c] += out.w[i] * mean[c];
		});
		out.mean = r;
		out.wet = out.raw[7];
		return out;
	}

	/** (Re)scatter every decal from the current ground weights (call after the splat changed). */
	scatterDecals() {
		const s = this.settings;
		const out = { raw: new Float32Array(8), m: new Float32Array(8), w: new Float32Array(8) };
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		const rand = kit.rng(9917);
		const counts = new Array(16).fill(0);
		const meshes = this.decalMeshes;
		const S = O.STAIR;
		this.counts.decals = 0;
		const emit = (cell, x, z, size, yaw, extra = 0) => {
			if (counts[cell] >= CAPACITY) return;
			if (!O.inside(x, z) || O.wallDistance(x, z) < 0.25) return;
			if (x >= S.x0 - 0.1 && x <= S.x1 + 0.1 && z < S.z0 + 0.2 && z > O.DOOR.z) return; // stair and landing
			if (O.waterDepth(x, z) > 0) return;
			const y = O.floorY(x, z);
			if (Math.abs(O.floorY(x + 0.35, z) - y) > 0.06 || Math.abs(O.floorY(x - 0.35, z) - y) > 0.06) return; // not on the basin's slopes
			this.probe(x, z, out);
			const lum = Math.max(1e-4, 0.2126 * out.mean[0] + 0.7152 * out.mean[1] + 0.0722 * out.mean[2]);
			const k = 0.8; // chroma follows the ground under it: no accent colour in the Prologue
			color.setRGB(1 + k * (out.mean[0] / lum - 1), 1 + k * (out.mean[1] / lum - 1), 1 + k * (out.mean[2] / lum - 1)).multiplyScalar((0.5 + rand() * 0.14) * (1 - 0.25 * smooth(out.wet, 0.3, 0.9)) * (cell === 15 ? 0.7 : cell >= 4 && cell <= 6 ? 0.6 : 1));
			dummy.position.set(x, y + 0.014 + extra + rand() * 0.004, z);
			dummy.rotation.set(0, yaw, 0);
			dummy.scale.set(size, 1, size);
			dummy.updateMatrix();
			meshes[cell].setMatrixAt(counts[cell], dummy.matrix);
			meshes[cell].setColorAt(counts[cell], color);
			counts[cell]++;
		};
		const pick = (list) => list[Math.floor(rand() * list.length)];
		const size = (lo, hi) => lo + (hi - lo) * rand();
		if (s.decals > 0) {
			const tries = Math.round(3600 * s.decals);
			for (let t = 0; t < tries; t++) {
				const x = -31.5 + rand() * 49;
				const z = -11 + rand() * 18;
				const d = O.wallDistance(x, z);
				if (d < 0.3) continue;
				this.probe(x, z, out);
				const [nave, vault, ossuary, rubble, dust, damp, lime] = out.w;
				const yaw = rand() * Math.PI * 2;
				const r = rand();
				if (r < 0.26) { if (rand() < 0.9 * dust ** 1.2) emit(12, x, z, size(1.2, 2.2), yaw); }
				else if (r < 0.42) { if (rand() < 0.1 * (nave + vault) * (1 - lime)) emit(pick([8, 9, 10]), x, z, size(0.9, 1.6), yaw); }
				else if (r < 0.54) { if (rand() < 0.5 * rubble) emit(11, x, z, size(0.35, 0.7), yaw); }
				else if (r < 0.64) { if (rand() < 0.14 * damp) emit(15, x, z, size(0.9, 1.6), yaw); }
				else if (r < 0.78) { if (rand() < 0.2 * (0.4 + ossuary) * (1 - smooth(d, 0.5, 2.2)) * (1 - 0.8 * lime)) emit(pick([0, 2, 2, 3, 3, 3, 0, 2, 1]), x, z, size(0.28, 0.5), yaw); } // ribs, vertebrae, small skulls; crossed bones rare
				else if (r < 0.84) { if (rand() < 0.16 * (1 - smooth(d, 0.4, 1.4))) emit(13, x, z, size(0.4, 0.7), yaw); }
			}
			for (const sp of this.spots) emit(sp.cell, sp.x, sp.z, sp.size, rand() * Math.PI * 2, 0.004);
		}
		meshes.forEach((m, cell) => {
			m.count = counts[cell];
			m.instanceMatrix.needsUpdate = true;
			if (m.instanceColor) m.instanceColor.needsUpdate = true;
			m.visible = counts[cell] > 0;
		});
		this.counts.decals = counts.reduce((x, y) => x + y, 0);
	}

	// ---- per frame -------------------------------------------------------------------------------------------------------------

	update(elapsed, delta) {
		const s = this.settings;
		const wall = s.wallShimmer ? O.shimmer(elapsed) : 1;
		if (this.billboards) for (const b of this.billboards) b.quaternion.copy(this.app.world.camera.quaternion);
		const flick = s.flicker;
		for (const e of this.sources) {
			if (e === this.lanternSource || e === this.spillSource || e === this.bounceSource) {
				const f = flick ? O.flicker1f(elapsed, e.seed) : 1;
				e.light.intensity = e.base * f * this.lantern * this.lightScale;
				continue;
			}
			e.light.intensity = e.base * this.lightScale * (e.shimmer ? wall : 1);
		}
		if (this.fissureMaterial) this.fissureMaterial.color.setRGB(3.0 * wall, 3.35 * wall, 3.9 * wall);
		if (this.haloMaterial) this.haloMaterial.opacity = 0.22 * wall;
		if (this.glowMaterial) this.glowMaterial.opacity = 0.1 * (0.7 + 0.3 * wall);
		if (this.pinCore) {
			for (let i = 0; i < this.pinCount; i++) {
				const f = 0.75 + 0.5 * (s.wallShimmer ? 0.5 + 0.5 * Math.sin(elapsed * 0.9 + i * 2.1) * 0.6 : 0.3);
				this.pinCore.setColorAt(i, this._c.setRGB(2.2 * f, 2.5 * f, 3 * f));
			}
			this.pinCore.instanceColor.needsUpdate = true;
		}
		// Gennet's lantern: the flame, the glow core and the cage follow the fade
		if (this.flames) {
			this.flames.entries[this.lanternFlame].strength = this.lantern;
			this.flames.lightScale = 0;
			this.flames.update(elapsed);
		}
		if (this.stairMaterial) this.stairMaterial.emissiveIntensity = 0.03 * this.lantern; // the risers face away from the lantern: a faint warm bounce so the steps read as solid
		if (this.lanternGlowMaterial) this.lanternGlowMaterial.color.setRGB(7 * this.lantern, 4 * this.lantern, 1.4 * this.lantern);
		const lf = this.lantern * (0.85 + 0.15 * O.flicker1f(elapsed, 4));
		if (this.lanternHaloMaterial) this.lanternHaloMaterial.color.setRGB(1.1 * lf, 0.58 * lf, 0.2 * lf);
		if (this.churchFloorMaterial) this.churchFloorMaterial.color.setRGB(0.42 * lf, 0.25 * lf, 0.11 * lf);
		if (this.doorGlowMaterial) this.doorGlowMaterial.color.setRGB(0.2 * lf, 0.1 * lf, 0.035 * lf);
		if (this.points?.visible && delta > 0) {
			const { data, positions } = this.motes;
			for (let i = 0; i < data.length; i++) {
				const d = data[i];
				d[3] += delta * 0.35;
				positions[i * 3] = d[0] + Math.sin(d[3] * 1.3 + i) * 0.18;
				d[1] += d[4] * delta;
				if (d[1] > 3.2) d[1] = 0.15;
				positions[i * 3 + 1] = d[1];
				positions[i * 3 + 2] = d[2] + Math.cos(d[3] * 0.9 + i * 1.7) * 0.18;
			}
			this.motes.geometry.attributes.position.needsUpdate = true;
		}
		if (this.puffs?.live && delta > 0) {
			let live = false;
			const pos = this.puffs.points.geometry.attributes.position;
			const col = this.puffs.points.geometry.attributes.color;
			for (let i = 0; i < this.puffs.N; i++) {
				const q = this.puffs.p[i];
				if (q.age >= q.life) {
					if (q.age < 9) {
						pos.setXYZ(i, 0, -9999, 0);
						q.age = 9;
						live = true; // upload this frame's removal
					}
					continue;
				}
				live = true;
				q.age += delta;
				const damp = Math.exp(-2.2 * delta);
				q.vx *= damp;
				q.vz *= damp;
				q.vy = q.vy * Math.exp(-1.2 * delta) - 0.1 * delta;
				q.x += q.vx * delta;
				q.y += q.vy * delta;
				q.z += q.vz * delta;
				const a = Math.max(0, 1 - q.age / q.life) ** 1.4;
				pos.setXYZ(i, q.x, q.y, q.z);
				col.setXYZ(i, q.r * a, q.g * a, q.b * a);
			}
			pos.needsUpdate = col.needsUpdate = true;
			this.puffs.live = live;
		}
		if (this.warmSheenMaterial) {
			const lf = this.lantern * (0.8 + 0.2 * O.flicker1f(elapsed, 4));
			this.warmSheenMaterial.color.setRGB(1.0, 0.55, 0.2);
			this.warmSheenMaterial.opacity = 0.7 * lf;
			this.coldSheenMaterial.color.setRGB(0.55, 0.72, 1.0);
			this.coldSheenMaterial.opacity = 0.2 * wall;
			this.skySheenMaterial.color.setRGB(0.4, 0.5, 0.55);
			this.skySheenMaterial.opacity = 0.07 * wall;
			this.skyMap.offset.set(elapsed * 0.004, 0);
			this.sheenMap.offset.set(elapsed * 0.012, Math.sin(elapsed * 0.3) * 0.02);
			this.coldSheenMap.offset.set(-elapsed * 0.008, Math.sin(elapsed * 0.23 + 1) * 0.02);
		}
		if (this.waterMaterial) {
			const t = elapsed * (s.waterFlow ?? 1);
			this.waterMaterial.normalMap.offset.set(t * 0.01, t * 0.006);
			this.waterMaterial2.normalMap.offset.set(-t * 0.008, t * 0.01);
		}
	}

	dispose() {
		for (const m of this.decalMeshes ?? []) {
			m.geometry.dispose();
			m.dispose();
		}
		for (const gltf of Object.values(this.gltf ?? {})) {
			gltf?.scene.traverse((o) => {
				if (!o.isMesh) return;
				o.geometry.dispose();
				for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
					for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) mat[key]?.dispose();
					mat.dispose();
				}
			});
		}
		this.wallMesh?.dispose();
		for (const g of this.ownGeometries) g.dispose();
		for (const m of this.ownMaterials) m.dispose();
		for (const t of this.ownTextures) t.dispose();
		for (const t of [this.vault, this.vaultN, this.stoneMap, this.stoneNormal, this.waterN, this.waterNormal2]) t?.dispose();
		this.decalMaterial?.dispose();
		this.atlas?.dispose();
		this.aoMaterial?.dispose();
		this.aoTexture?.dispose();
		this.aoGeometry?.dispose();
		this.flames?.dispose();
		this.spot?.shadow.dispose();
	}
}

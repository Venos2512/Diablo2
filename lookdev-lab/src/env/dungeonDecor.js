// ASHLAR · Dungeon dressing (scene src/scenes/dungeon.js): the Tripo props at real size (sarcophagi, bone piles, columns, candle clusters, the fallen bell, stalagmites, flint
// boulders, mine timbers) with contact shadows, the crypt's wall modules (one instanced mesh), ground decals scattered by rules from the ground weights, the flames and warm
// point lights (unshadowed, finite distance, 1/f flicker), the bell's fake light shaft, dust motes and the cave's kiln glow. Everything is deterministic (seeded).
import * as THREE from 'three';
import { loadGrassCards } from './terrain.js';
import { FlameField } from './flames.js';
import { kelvinToColor } from '../core/grading.js';
import { finalWeights } from './biomeMix.js';
import * as D from './dungeon.js';
import * as kit from './kit.js';

const CAPACITY = 700; // decal instances per atlas cell
const smooth = (v, e0, e1) => THREE.MathUtils.smoothstep(v, e0, e1);
const UP = new THREE.Vector3(0, 1, 0);

export function radialTexture(alpha = 0.85) {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
	grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
	grad.addColorStop(0.5, `rgba(0,0,0,${alpha * 0.45})`);
	grad.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 128, 128);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

/** A soft round sprite for the dust motes. */
export function moteTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 64;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(32, 32, 0, 32, 32, 30);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 64, 64);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

/** A flat 1 x 1 quad on cell `cell` of a 4 x 4 atlas (row-major from the image top), lying on the ground. */
export function decalGeometry(cell) {
	const g = new THREE.PlaneGeometry(1, 1);
	g.rotateX(-Math.PI / 2);
	const u0 = (cell % 4) / 4;
	const v0 = 1 - (Math.floor(cell / 4) + 1) / 4;
	const uv = g.attributes.uv;
	for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) / 4, v0 + uv.getY(i) / 4);
	return g;
}

/** Constant normal (+y) and uv attributes for hand-built geometry: the node renderers read both even for an unlit material (a missing attribute warns on webgpu-gl). */
export function withDefaultAttributes(g) {
	const n = g.attributes.position.count;
	if (!g.attributes.normal) g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from({ length: n * 3 }, (_, i) => (i % 3 === 1 ? 1 : 0)), 3));
	if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
	return g;
}

/** Wick tops of a candle cluster (geometry space): the highest local maxima on a 7 cm grid, at least `gap` apart. */
export function candleTops(geometry, count = 5, gap = 0.16) {
	geometry.computeBoundingBox();
	const top = geometry.boundingBox.max.y;
	const pos = geometry.attributes.position;
	const cell = 0.07;
	const grid = new Map();
	for (let i = 0; i < pos.count; i++) {
		const x = pos.getX(i);
		const y = pos.getY(i);
		const z = pos.getZ(i);
		if (y < top * 0.35) continue;
		const key = `${Math.round(x / cell)},${Math.round(z / cell)}`;
		const cur = grid.get(key);
		if (!cur || y > cur[1]) grid.set(key, [x, y, z]);
	}
	const sorted = [...grid.values()].sort((a, b) => b[1] - a[1]);
	const picked = [];
	for (const p of sorted) {
		if (picked.length >= count) break;
		if (picked.every((q) => Math.hypot(q[0] - p[0], q[2] - p[2]) > gap)) picked.push(p);
	}
	return picked;
}

export const meshOf = (gltf) => {
	let found = null;
	gltf?.scene.traverse((o) => {
		if (o.isMesh && !found) found = o;
	});
	return found;
};

export class DungeonDecor {
	/**
	 * @param {object} o { app, group, vfx (the scene's VFX group), areas ({ crypt, cave }: { def, splat, floorY(x, z) }), library, settings, wallFade (effect), flames }
	 */
	constructor(o) {
		Object.assign(this, o);
		this.root = new THREE.Group();
		this.root.name = 'Dungeon dressing';
		this.group.add(this.root);
		this.props = new THREE.Group();
		this.props.name = 'Props';
		this.root.add(this.props);
		this.ownMaterials = [];
		this.ownTextures = [];
		this.sources = []; // { light, base, seed, kind, area }
		this.spots = { crypt: [], cave: [] }; // authored decal spots: { x, z, cell, size }
		this.candleSpots = []; // flame bases (world) for the dust motes
		this.counts = { props: 0, decals: 0, walls: 0, lights: 0, flames: 0 };
	}

	async load() {
		const { app } = this;
		const names = Object.keys(D.PROP_IDS);
		const [crypt, cave, ...gltfs] = await Promise.all([
			loadGrassCards(app, 'dungeon-decals-crypt'),
			loadGrassCards(app, 'dungeon-decals-cave'),
			...names.map((k) => app.loader.loadSample(D.PROP_IDS[k]).catch((e) => (console.error(`Dungeon prop "${D.PROP_IDS[k]}" failed to load`, e), null))),
		]);
		this.atlas = { crypt, cave };
		this.gltf = Object.fromEntries(names.map((k, i) => [k, gltfs[i]]));
		this.mesh = Object.fromEntries(names.map((k) => [k, meshOf(this.gltf[k])]));
		// anisotropy on the GLB maps (the lab's 2048 + anisotropy convention)
		const aniso = Math.min(8, app.backend.caps.maxAnisotropy || 4);
		for (const m of Object.values(this.mesh)) if (m) for (const key of ['map', 'normalMap']) if (m.material[key]) m.material[key].anisotropy = aniso;
		this.decalMaterial = {};
		this.decalMeshes = {};
		for (const kind of ['crypt', 'cave']) {
			const material = new THREE.MeshStandardMaterial({ name: `Dungeon decals · ${kind}`, map: this.atlas[kind], alphaTest: 0.4, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
			this.decalMaterial[kind] = material;
			this.decalMeshes[kind] = Array.from({ length: 16 }, (_, cell) => {
				const mesh = new THREE.InstancedMesh(decalGeometry(cell), material, CAPACITY);
				mesh.name = `Decals · ${kind} · cell ${cell}`;
				mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3);
				mesh.count = 0;
				mesh.frustumCulled = false;
				mesh.userData.labNoPick = true;
				this.root.add(mesh);
				return mesh;
			});
		}
		this.aoTexture = radialTexture(0.9);
		this.aoMaterial = new THREE.MeshBasicMaterial({ name: 'Contact shadow', map: this.aoTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false });
		this.aoGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
	}

	// ---- helpers ---------------------------------------------------------------------------------------------------------------

	/** Floor height of an area at an area-local position. */
	floorY(kind, x, z) {
		return kind === 'cave' ? D.caveHeight(x, z) : 0;
	}

	worldOf(kind, x, z) {
		const a = D.AREAS[kind];
		return [a.cx + x, a.cz + z];
	}

	/** Final layer weights (the GPU's own, smoothed splat) at an area-local position: out.w[i]; out.mean = the blended mean albedo; out.wet. */
	probe(kind, lx, lz, out) {
		const area = this.areas[kind];
		const def = area.def;
		const n = def.layers.length;
		area.splat.sample(def.cx + lx, def.cz + lz, out.raw);
		out.m[0] = 1;
		for (let k = 1; k < n; k++) out.m[k] = out.raw[k - 1];
		finalWeights(out.m, n, out.w);
		const r = [0, 0, 0];
		def.layers.forEach((l, i) => {
			const mean = this.library.mean[l.id];
			for (let c = 0; c < 3; c++) r[c] += out.w[i] * mean[c];
		});
		out.mean = r;
		out.wet = out.raw[7];
		return out;
	}

	/** Place a prop (a Mesh sharing the source geometry) on the floor, with a contact shadow. Returns the mesh. */
	put(kind, source, lx, lz, { scale = 1, yaw = 0, sink = 0.02, castShadow = true, ao = 1.4, y = null, tilt = 0 } = {}) {
		if (!source) return null;
		const a = D.AREAS[kind];
		const gy = y ?? this.floorY(kind, lx, lz);
		const m = new THREE.Mesh(source.geometry, source.material);
		m.name = `Prop · ${kind} · ${source.name || 'mesh'}`;
		m.position.set(a.cx + lx, gy - sink, a.cz + lz);
		m.rotation.set(tilt, yaw, 0, 'YXZ');
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
			blob.position.set(a.cx + lx, gy + 0.016, a.cz + lz);
			blob.renderOrder = 1;
			blob.userData.labNoPick = blob.userData.labNoCollide = true;
			this.props.add(blob);
		}
		return m;
	}

	addLight({ kind, area, x, y, z, kelvin = 2300, base, distance = 7, decay = 2, seed = Math.random() * 50 }) {
		const light = new THREE.PointLight(kelvinToColor(kelvin), base, distance, decay);
		light.position.set(x, y, z);
		light.castShadow = false;
		light.name = `Light · ${kind}`;
		this.group.add(light);
		this.sources.push({ light, base, seed, kind, area, kelvin });
		this.counts.lights++;
		return light;
	}

	// ---- build -----------------------------------------------------------------------------------------------------------------

	build() {
		this.flames = new FlameField(this.app, 40);
		this.vfx.add(this.flames.mesh); // the VFX layer (its soft-particle depth fade reads the scene depth: not in the scene pass)
		this.buildCrypt();
		this.buildCave();
		this.buildAtmosphere();
		this.scatterDecals();
	}

	/** The crypt: instanced wall modules, props, flames + candle lights, the bell's shaft and shadowed spot. */
	buildCrypt() {
		const a = D.AREAS.crypt;
		const rand = kit.rng(7301);
		const out = { raw: new Float32Array(8), m: new Float32Array(8), w: new Float32Array(8) };
		// wall modules: one instanced mesh; height gradient in vertex colour (the top is dark: no ceiling, the room dissolves into black), y scale 1.2 -> 2.74 m
		const wall = this.mesh.wall;
		if (wall) {
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
			this.ownMaterials.push(material);
			const faded = this.wallFade.apply(material);
			const list = D.cryptWalls();
			const mesh = new THREE.InstancedMesh(g, faded, list.length);
			mesh.name = 'Crypt walls (instanced modules)';
			const m4 = new THREE.Matrix4();
			const q = new THREE.Quaternion();
			list.forEach((w, i) => {
				q.setFromAxisAngle(UP, w.yaw);
				m4.compose(new THREE.Vector3(a.cx + w.x, 0, a.cz + w.z), q, new THREE.Vector3(1, 1.2, 1));
				mesh.setMatrixAt(i, m4);
			});
			mesh.instanceMatrix.needsUpdate = true;
			mesh.frustumCulled = false;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.userData.labSolid = true; // walls block the hero (instanced meshes are walk-through unless solid)
			this.group.add(mesh);
			this.wallMesh = mesh;
			this.counts.walls += list.length;
		}
		// props
		for (const p of D.CRYPT_PROPS) {
			const src = this.mesh[p.kind];
			if (!src) continue;
			const m = this.put('crypt', src, p.x, p.z, { scale: p.scale, yaw: p.yaw, ao: p.kind === 'bonePile' ? 1.15 : 1.35, sink: p.kind === 'bell' ? 0.0 : 0.03 });
			if (p.kind === 'bell' && m) this.bell = m;
			if (p.light && m) this.candleCluster(m, src, p, rand);
			// authored decals round each prop
			const r = (n, lo, hi) => lo + (hi - lo) * rand();
			if (p.kind === 'bonePile') {
				for (let i = 0; i < 4; i++) this.spots.crypt.push({ x: p.x + (rand() - 0.5) * 2.2, z: p.z + (rand() - 0.5) * 2.0, cell: [0, 1, 2, 3][Math.floor(rand() * 4)], size: r(0, 0.55, 0.9) });
			} else if (p.kind === 'sarcophagus') {
				this.spots.crypt.push({ x: p.x + (rand() - 0.5) * 3, z: p.z + 1.1, cell: 14, size: r(0, 0.9, 1.3) }, { x: p.x - 1.6, z: p.z + (rand() - 0.5), cell: 12, size: 1.6 }, { x: p.x + 0.8, z: p.z - 1.0, cell: 11, size: 0.7 });
			} else if (p.kind === 'column') {
				for (let i = 0; i < 4; i++) this.spots.crypt.push({ x: p.x + (rand() - 0.5) * 3.6, z: p.z + (rand() - 0.5) * 3.2, cell: 11, size: r(0, 0.6, 1.0) });
			} else if (p.kind === 'bell') {
				this.spots.crypt.push({ x: p.x + 1.1, z: p.z + 0.4, cell: 1, size: 0.7 }, { x: p.x - 1.0, z: p.z + 1.2, cell: 12, size: 1.5 });
			}
		}
		// the cold wall light on the alcove (BIO-04: "cold, close"; cold-white wall light)
		this.addLight({ kind: 'crypt wall light', area: 'crypt', x: a.cx - 0.5, y: 2.1, z: a.cz - 7.0, kelvin: 7800, base: 10, distance: 10, decay: 2 });
		// the bell's shaft: an additive cone + a cold shadowed spot (the one shadowed light of the crypt)
		const bx = a.cx + D.CRYPT.bell.x;
		const bz = a.cz + D.CRYPT.bell.z;
		this.shaft = this.buildShaft(bx, bz);
		const spot = new THREE.SpotLight(0xdbe6ff, 150, 14, 0.34, 0.9, 2);
		spot.name = 'Light · bell shaft (shadowed spot)';
		spot.position.set(bx - 0.5, 7.0, bz + 1.4);
		spot.target.position.set(bx, 0.3, bz);
		spot.castShadow = true;
		const size = this.app.settings.data.lighting?.shadowMapSize ?? 2048; // the Lighting panel owns the size; allocated at it from the start (a later change would dispose the map)
		spot.shadow.mapSize.set(size, size);
		spot.shadow.bias = -0.0006;
		spot.shadow.normalBias = 0.03;
		spot.shadow.camera.near = 2;
		spot.shadow.camera.far = 16;
		spot.userData.labBiasOverride = true;
		this.group.add(spot, spot.target);
		this.spot = spot;
		this.sources.push({ light: spot, base: 150, seed: 3, kind: 'shaft', area: 'crypt', steady: true });
		this.counts.lights++;
	}

	/** Flames on the wicks of a candle cluster + one warm point light above it. */
	candleCluster(mesh, source, p, rand) {
		const a = D.AREAS.crypt;
		const tops = candleTops(source.geometry);
		const q = new THREE.Quaternion().setFromAxisAngle(UP, p.yaw);
		const v = new THREE.Vector3();
		for (const t of tops) {
			v.set(t[0] * p.scale, t[1] * p.scale + 0.03, t[2] * p.scale).applyQuaternion(q).add(mesh.position);
			this.flames.add(v.clone(), { width: 0.1 * p.scale + 0.03, height: 0.2 * p.scale + 0.05, strength: 1 });
			this.counts.flames++;
		}
		this.candleSpots.push(new THREE.Vector3(mesh.position.x, 0.8 * p.scale, mesh.position.z));
		this.addLight({ kind: 'candles', area: 'crypt', x: mesh.position.x, y: 1.0 * p.scale + 0.35, z: mesh.position.z, kelvin: 2400, base: 20 * p.scale, distance: 7, decay: 2, seed: rand() * 60 });
		// wax, soot round the foot
		this.spots.crypt.push(
			{ x: p.x + 0.9, z: p.z + 0.5, cell: 4, size: 0.8 }, { x: p.x - 0.8, z: p.z + 0.9, cell: 5, size: 0.95 }, { x: p.x + 0.2, z: p.z - 1.0, cell: 6, size: 0.8 },
			{ x: p.x - 0.4, z: p.z + 0.2, cell: 7, size: 1.2 },
		);
	}

	/** The cave: stalagmites, boulders, timber frames, torch, kiln glow. (The wall mesh is the scene's.) */
	buildCave() {
		const a = D.AREAS.cave;
		const rand = kit.rng(8123);
		const placeAt = (ang, f) => {
			const R = D.caveRadius(ang);
			return [Math.cos(ang) * R * f, Math.sin(ang) * R * f];
		};
		for (const p of D.CAVE_PROPS) {
			const src = this.mesh[p.kind];
			if (!src) continue;
			const [x, z] = placeAt(p.a, p.f);
			this.put('cave', src, x, z, { scale: p.scale, yaw: p.yaw, ao: p.kind === 'boulders' ? 1.25 : 1.2, sink: 0.05 });
			if (p.kind === 'boulders') for (let i = 0; i < 3; i++) this.spots.cave.push({ x: x + (rand() - 0.5) * 3, z: z + (rand() - 0.5) * 3, cell: [0, 1, 2][i], size: 0.6 + rand() * 0.4 });
		}
		const timber = this.mesh.timber;
		for (const t of D.CAVE_TIMBERS) {
			const m = this.put('cave', timber, t.x, t.z, { scale: 1, yaw: 0, ao: 0.9, sink: 0.04 });
			this.spots.cave.push({ x: t.x + 1.4, z: t.z + 0.9, cell: 15, size: 1.1 });
			if (t.torch && m) {
				const tx = a.cx + t.x - 1.2; // the frame's west post
				const tz = a.cz + t.z + 0.3;
				const ty = this.floorY('cave', t.x - 1.2, t.z) + 2.0;
				this.flames.add(new THREE.Vector3(tx, ty, tz), { width: 0.3, height: 0.55, strength: 1 });
				this.counts.flames++;
				this.addLight({ kind: 'torch', area: 'cave', x: tx, y: ty + 0.3, z: tz, kelvin: 2100, base: 34, distance: 8, decay: 2 });
				this.candleSpots.push(new THREE.Vector3(tx, ty - 0.6, tz));
				this.spots.cave.push({ x: t.x - 1.6, z: t.z + 0.4, cell: 14, size: 1.0 });
			}
		}
		this.spots.cave.push({ x: 4.3, z: 5.6, cell: 3, size: 0.95 }, { x: 7.4, z: 2.4, cell: 3, size: 0.9 });
		// the kiln: glowing cracks along the east wall's foot + a pulsing orange light
		this.buildKiln();
		// a faint teal tint near the pool
		this.addLight({ kind: 'pool tint', area: 'cave', x: a.cx + D.CAVE.pool.x, y: 1.4, z: a.cz + D.CAVE.pool.z - 0.5, kelvin: 9500, base: 14, distance: 8, decay: 2 });
		this.sources[this.sources.length - 1].light.color.set('#4aa8a0');
		this.sources[this.sources.length - 1].steady = true;
	}

	buildKiln() {
		const a = D.AREAS.cave;
		const rand = kit.rng(5059);
		const base = Math.atan2(D.CAVE.kiln.z, D.CAVE.kiln.x);
		const pos = [];
		const idx = [];
		const strip = (pts, w0, w1) => {
			const first = pos.length / 3;
			for (let i = 0; i < pts.length; i++) {
				const p = pts[i];
				const q = pts[Math.min(pts.length - 1, i + 1)];
				const o = pts[Math.max(0, i - 1)];
				let dx = q[0] - o[0];
				let dz = q[1] - o[1];
				const len = Math.hypot(dx, dz) || 1;
				dx /= len;
				dz /= len;
				const w = THREE.MathUtils.lerp(w0, w1, i / (pts.length - 1)) * 0.5;
				const y = this.floorY('cave', p[0], p[1]) + 0.03;
				pos.push(a.cx + p[0] - dz * w, y, a.cz + p[1] + dx * w, a.cx + p[0] + dz * w, y, a.cz + p[1] - dx * w);
				if (i) {
					const k = first + i * 2;
					idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
				}
			}
		};
		for (let c = 0; c < 6; c++) {
			const ang = base + (c - 2.5) * 0.085 + (rand() - 0.5) * 0.04;
			const R = D.caveRadius(ang);
			let r = R - 0.45;
			let th = ang;
			const pts = [];
			for (let i = 0; i < 8; i++) {
				pts.push([Math.cos(th) * r, Math.sin(th) * r]);
				r -= 0.22 + rand() * 0.18;
				th += (rand() - 0.5) * 0.07;
			}
			strip(pts, 0.1 + rand() * 0.06, 0.02);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		withDefaultAttributes(g);
		this.kilnMaterial = new THREE.MeshBasicMaterial({ name: 'Kiln cracks (emissive)', color: new THREE.Color(1.2, 0.2, 0.035), side: THREE.DoubleSide, toneMapped: false });
		this.kiln = new THREE.Mesh(g, this.kilnMaterial);
		this.kiln.name = 'Kiln cracks';
		this.kiln.userData.labNoPick = this.kiln.userData.labNoCollide = true;
		this.root.add(this.kiln);
		// glow on the floor round the cracks: an additive soft quad
		const tex = radialTexture(1);
		this.ownTextures.push(tex);
		const glowMaterial = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.0, 0.34, 0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.5 });
		this.glowMaterial = glowMaterial;
		const kx = a.cx + Math.cos(base) * (D.caveRadius(base) - 1.4);
		const kz = a.cz + Math.sin(base) * (D.caveRadius(base) - 1.4);
		const glow = new THREE.Mesh(this.aoGeometry, glowMaterial);
		glow.scale.set(6.5, 1, 4.8);
		glow.position.set(kx, this.floorY('cave', kx - a.cx, kz - a.cz) + 0.045, kz);
		glow.rotation.y = -base;
		glow.renderOrder = 3;
		glow.userData.labNoPick = glow.userData.labNoCollide = true;
		this.vfx.add(glow); // VFX layer (see buildShaft)
		this.addLight({ kind: 'kiln', area: 'cave', x: kx, y: 0.9, z: kz, kelvin: 1800, base: 46, distance: 10, decay: 2 });
		this.sources[this.sources.length - 1].light.color.set('#e2622b');
		this.sources[this.sources.length - 1].bellows = true;
		this.kilnPos = new THREE.Vector3(kx, 0.6, kz);
		// ember specks at the cracks: authored charcoal smudges
		this.spots.cave.push({ x: kx - a.cx - 0.6, z: kz - a.cz + 0.5, cell: 14, size: 1.3 }, { x: kx - a.cx - 1.8, z: kz - a.cz - 0.7, cell: 14, size: 0.9 });
	}

	/**
	 * A fake light shaft: three vertical planes crossed about the axis (0, 60, 120 deg), each a strip of columns whose vertex alpha is a gaussian across the width (soft edges from
	 * every side) times a ramp along the height (bright at the source, none at the floor, so it never cuts a hard line into the ground); additive, no depth write.
	 */
	buildShaft(x, z) {
		const group = new THREE.Group();
		group.name = 'Bell light shaft';
		const H = 7;
		const COLS = 11;
		const ROWS = 9;
		for (let p = 0; p < 3; p++) {
			const pos = [];
			const col = [];
			const idx = [];
			for (let r = 0; r <= ROWS; r++) {
				const t = r / ROWS; // 0 floor .. 1 source
				const half = THREE.MathUtils.lerp(2.5, 0.55, t); // the cone: wide at the floor, narrow at the source
				for (let c = 0; c <= COLS; c++) {
					const u = (c / COLS) * 2 - 1;
					pos.push(u * half, t * H, 0);
					const a = 0.075 * Math.exp(-u * u * 3.4) * smooth(t, 0.02, 0.5) * (1 - 0.35 * smooth(t, 0.8, 1.0));
					col.push(0.78, 0.88, 1.0, a);
				}
			}
			for (let r = 0; r < ROWS; r++) {
				for (let c = 0; c < COLS; c++) {
					const k = r * (COLS + 1) + c;
					idx.push(k, k + 1, k + COLS + 1, k + 1, k + COLS + 2, k + COLS + 1);
				}
			}
			const g = new THREE.BufferGeometry();
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
			g.setIndex(idx);
			withDefaultAttributes(g);
			const m = new THREE.MeshBasicMaterial({ name: 'Shaft', vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
			this.ownMaterials.push(m);
			const mesh = new THREE.Mesh(g, m);
			mesh.rotation.y = (p * Math.PI) / 3;
			mesh.renderOrder = 6;
			mesh.userData.labNoPick = mesh.userData.labNoCollide = true;
			group.add(mesh);
		}
		group.position.set(x - 0.15, 0.02, z + 0.5);
		group.rotation.set(0.1, 0, -0.08);
		// the VFX layer, not the scene pass: an additive blend also accumulates into the scene pass' MRT normal target, and the AO pass then darkens a wedge where the planes cut the floor (webgpu-gl)
		this.vfx.add(group);
		return group;
	}

	/** Dust motes: a few hundred additive points in the shaft, round the flames and in the open air. */
	buildAtmosphere() {
		const rand = kit.rng(6011);
		const a = D.AREAS.crypt;
		const c = D.AREAS.cave;
		const pts = [];
		const around = (cx, cy, cz, rad, hgt, n) => {
			for (let i = 0; i < n; i++) pts.push([cx + (rand() - 0.5) * 2 * rad, cy + rand() * hgt, cz + (rand() - 0.5) * 2 * rad, rand() * 6.28, 0.02 + rand() * 0.05]);
		};
		around(a.cx + D.CRYPT.bell.x, 0.2, a.cz + D.CRYPT.bell.z, 1.8, 6, 120);
		for (const p of this.candleSpots) if (p.x < 0) around(p.x, 0.3, p.z, 1.6, 2.4, 14);
		around(a.cx, 0.3, a.cz, 11, 2.6, 70);
		around(c.cx + 4, 0.3, c.cz + 1, 9, 2.6, 50);
		if (this.kilnPos) around(this.kilnPos.x, 0.2, this.kilnPos.z, 2.4, 3.2, 40);
		for (const p of this.candleSpots) if (p.x > 0) around(p.x, 0.5, p.z, 1.5, 2.2, 10);
		const positions = new Float32Array(pts.length * 3);
		pts.forEach((p, i) => positions.set(p.slice(0, 3), i * 3));
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		withDefaultAttributes(g);
		this.motes = { data: pts, positions, geometry: g };
		this.moteTexture = moteTexture();
		this.moteMaterial = new THREE.PointsMaterial({ name: 'Dust motes', map: this.moteTexture, color: new THREE.Color(1.0, 0.9, 0.7), size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
		const points = new THREE.Points(g, this.moteMaterial);
		points.name = 'Dust motes';
		points.frustumCulled = false;
		points.userData.labNoPick = points.userData.labNoCollide = true;
		this.vfx.add(points);
		this.points = points;
	}

	// ---- decals ----------------------------------------------------------------------------------------------------------------

	/** (Re)scatter every decal from the current ground weights (call after the splats changed). */
	scatterDecals() {
		const s = this.settings;
		const out = { raw: new Float32Array(8), m: new Float32Array(8), w: new Float32Array(8) };
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		const yawQ = new THREE.Quaternion();
		const normalQ = new THREE.Quaternion();
		this.counts.decals = 0;
		for (const kind of ['crypt', 'cave']) {
			const rand = kit.rng(kind === 'crypt' ? 9917 : 7719);
			const counts = new Array(16).fill(0);
			const meshes = this.decalMeshes[kind];
			const emit = (cell, lx, lz, size, yaw, extra = 0) => {
				if (counts[cell] >= CAPACITY) return;
				if (kind === 'cave' && D.poolDistance(lx, lz) < 0.25) return; // not under the water
				if (kind === 'cave' && D.caveWallDistance(lx, lz) < 0.5) return;
				if (kind === 'crypt' && D.cryptWallDistance(lx, lz) < 0.25) return;
				this.probe(kind, lx, lz, out);
				const lum = Math.max(1e-4, 0.2126 * out.mean[0] + 0.7152 * out.mean[1] + 0.0722 * out.mean[2]);
				const k = 0.45;
				// chroma toward the ground under it (the decal keeps its own value), a little darker where wet
				color.setRGB(1 + k * (out.mean[0] / lum - 1), 1 + k * (out.mean[1] / lum - 1), 1 + k * (out.mean[2] / lum - 1)).multiplyScalar((0.78 + rand() * 0.18) * (1 - 0.25 * smooth(out.wet, 0.3, 0.9)) * (kind === 'cave' ? (cell === 12 || cell === 13 ? 1.7 : cell === 8 || cell === 9 ? 1.45 : 1) : 1));
				const gy = this.floorY(kind, lx, lz);
				let n = UP;
				if (kind === 'cave') {
					const e = 0.12;
					const dx = (D.caveHeight(lx + e, lz) - D.caveHeight(lx - e, lz)) / (2 * e);
					const dz = (D.caveHeight(lx, lz + e) - D.caveHeight(lx, lz - e)) / (2 * e);
					n = new THREE.Vector3(-dx, 1, -dz).normalize();
				}
				const [wx, wz] = this.worldOf(kind, lx, lz);
				dummy.position.set(wx, gy, wz).addScaledVector(n, 0.014 + extra + rand() * 0.004);
				dummy.quaternion.copy(normalQ.setFromUnitVectors(UP, n)).multiply(yawQ.setFromAxisAngle(UP, yaw));
				dummy.scale.set(size, 1, size);
				dummy.updateMatrix();
				meshes[cell].setMatrixAt(counts[cell], dummy.matrix);
				meshes[cell].setColorAt(counts[cell], color);
				counts[cell]++;
			};
			const pick = (list) => list[Math.floor(rand() * list.length)];
			const size = (lo, hi) => lo + (hi - lo) * rand();
			if (s.decals > 0) {
				const area = D.AREAS[kind];
				const extent = kind === 'crypt' ? [CRYPT_HALF.x, CRYPT_HALF.z] : [area.rx, area.rz];
				const tries = Math.round((kind === 'crypt' ? 3200 : 3600) * s.decals);
				for (let t = 0; t < tries; t++) {
					const lx = (rand() * 2 - 1) * (extent[0] + 0.5);
					let lz = (rand() * 2 - 1) * (extent[1] + (kind === 'crypt' ? 0.5 : 0.5));
					if (kind === 'crypt' && rand() < 0.07) lz = 8 + rand() * 3.6; // some in the corridor
					if (kind === 'crypt' ? D.cryptWallDistance(lx, lz) < 0.3 : D.caveWallDistance(lx, lz) < 0.6) continue;
					this.probe(kind, lx, lz, out);
					const w = out.w;
					const yaw = rand() * Math.PI * 2;
					const r = rand();
					if (kind === 'crypt') {
						const [nave, vault, dust, rubble, , walk, damp] = w;
						const d = D.cryptWallDistance(lx, lz);
						if (r < 0.3) { if (rand() < 0.9 * dust ** 1.2) emit(12, lx, lz, size(1.2, 2.2), yaw); }
						else if (r < 0.48) { if (rand() < 0.1 * (nave + vault) * (1 - walk)) emit(pick([8, 9, 10]), lx, lz, size(0.9, 1.6), yaw); }
						else if (r < 0.6) { if (rand() < 0.7 * rubble) emit(11, lx, lz, size(0.55, 1.0), yaw); }
						else if (r < 0.7) { if (rand() < 0.3 * damp) emit(15, lx, lz, size(1.0, 1.9), yaw); }
						else if (r < 0.78) { if (rand() < 0.5 * (1 - smooth(d, 0.4, 1.6)) * (1 - walk)) emit(pick([0, 1, 2, 3]), lx, lz, size(0.5, 0.85), yaw); }
						else if (r < 0.84) { if (rand() < 0.45 * (1 - smooth(d, 0.4, 1.4))) emit(13, lx, lz, size(0.9, 1.3), yaw); }
					} else {
						const [floor, flint, rubble, clay, flow, rock, planks] = w;
						const d = D.caveWallDistance(lx, lz);
						if (r < 0.25) { if (rand() < 0.55 * (flint + rubble) * (1 - planks)) emit(pick([0, 1, 2]), lx, lz, size(0.55, 1.0), yaw); }
						else if (r < 0.42) { if (rand() < 0.3 * floor * (1 - clay) * (1 - planks)) emit(pick([4, 5, 6]), lx, lz, size(0.55, 1.0), yaw); }
						else if (r < 0.52) { if (rand() < 0.7 * flow) emit(7, lx, lz, size(0.9, 1.6), yaw); }
						else if (r < 0.66) { if (rand() < 0.12 * clay + 0.04 * flow) emit(pick([8, 9]), lx, lz, size(1.5, 2.4), yaw); }
						else if (r < 0.74) { if (rand() < 0.14 * floor * (1 - clay) * (1 - planks)) emit(11, lx, lz, size(1.4, 2.4), yaw); }
						else if (r < 0.9) { if (rand() < 0.3 * (1 - smooth(d, 0.8, 3.0)) * (1 - planks) + 0.2 * flow) emit(pick([12, 13]), lx, lz, size(1.2, 2.0), yaw); }
						else if (rand() < 0.4 * planks) emit(15, lx, lz, size(0.7, 1.2), yaw);
					}
				}
				for (const sp of this.spots[kind]) emit(sp.cell, sp.x, sp.z, sp.size, rand() * Math.PI * 2, 0.004);
			}
			meshes.forEach((m, cell) => {
				m.count = counts[cell];
				m.instanceMatrix.needsUpdate = true;
				if (m.instanceColor) m.instanceColor.needsUpdate = true;
				m.visible = counts[cell] > 0;
			});
			this.counts.decals += counts.reduce((x, y) => x + y, 0);
		}
	}

	// ---- per frame -------------------------------------------------------------------------------------------------------------

	update(elapsed, delta) {
		const s = this.settings;
		const flick = s.flicker;
		for (const e of this.sources) {
			if (e.steady) {
				e.light.intensity = e.base * this.lightScale;
				continue;
			}
			let f = flick ? D.flicker1f(elapsed, e.seed) : 1;
			if (e.bellows) {
				// the kiln breathes like a bellows: a slow pulse (about 0.4 Hz) with an eased flutter on top
				const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.6 + Math.sin(elapsed * 0.7) * 1.3);
				f = flick ? (0.62 + 0.5 * pulse) * (1 + 0.1 * (D.flicker1f(elapsed * 1.7, e.seed) - 1) / 0.2) : 1;
				if (this.kilnMaterial) this.kilnMaterial.color.setRGB(1.2 * (0.55 + 0.6 * f), 0.2 * (0.5 + 0.7 * f), 0.035 * f);
				if (this.glowMaterial) this.glowMaterial.opacity = 0.32 + 0.3 * f;
			}
			e.light.intensity = e.base * f * this.lightScale;
		}
		this.flames.lightScale = 0; // the lights are driven above
		this.flames.update(elapsed);
		if (this.points?.visible && delta > 0) {
			const { data, positions } = this.motes;
			for (let i = 0; i < data.length; i++) {
				const d = data[i];
				d[3] += delta * 0.35;
				positions[i * 3] = d[0] + Math.sin(d[3] * 1.3 + i) * 0.18;
				d[1] += d[4] * delta;
				if (d[1] > 6.4) d[1] = 0.15;
				positions[i * 3 + 1] = d[1];
				positions[i * 3 + 2] = d[2] + Math.cos(d[3] * 0.9 + i * 1.7) * 0.18;
			}
			this.motes.geometry.attributes.position.needsUpdate = true;
		}
	}

	dispose() {
		for (const list of Object.values(this.decalMeshes ?? {})) for (const m of list) {
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
		for (const m of this.ownMaterials) m.dispose();
		for (const t of this.ownTextures) t.dispose();
		for (const m of Object.values(this.decalMaterial ?? {})) m.dispose();
		for (const t of Object.values(this.atlas ?? {})) t?.dispose();
		if (this.app._grassCards) {
			delete this.app._grassCards['dungeon-decals-crypt'];
			delete this.app._grassCards['dungeon-decals-cave'];
		}
		this.aoMaterial?.dispose();
		this.aoTexture?.dispose();
		this.aoGeometry?.dispose();
		this.motes?.geometry.dispose();
		this.moteMaterial?.dispose();
		this.moteTexture?.dispose();
		this.kilnMaterial?.dispose();
		this.glowMaterial?.dispose();
		this.kiln?.geometry.dispose();
		this.flames?.dispose();
		this.spot?.shadow.dispose();
		for (const g of this.shaft?.children ?? []) g.geometry.dispose();
	}
}

const CRYPT_HALF = { x: D.CRYPT.hx, z: D.CRYPT.hz };

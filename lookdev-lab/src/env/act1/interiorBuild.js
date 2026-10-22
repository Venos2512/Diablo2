// ASHLAR · Act I base maps — the INTERIOR engine, THREE side (pure plan: ./interior.js; blockouts: ./interiorBlockout.js; scene: scenes/act1Interior.js).
// From a compiled plan it builds: the floor (cells of `floor.mesh` m clipped to the walkable area, the N-layer terrain material, vertex colours that sink
// the apron past the void edges into black; the apron is a second mesh the hero never walks on), the walls (extruded boxes per run piece with the room's
// biome tile, world UVs, a top that fades to black because there are no ceilings, the camera wall fade; or GLB modules laid along the run), stair treads,
// window panes (they fade with their wall), the blockouts and the existing GLBs (`model`: instanced per asset and 32 m cell so the camera culls them, kept out
// of Play's walk collision when the KIT has a `collider`, darkened in the void) of every placement, the lights with the light grammar (Perfection = still and even, human =
// 1/f flicker, Wall = slow shimmer; groups the scene dims one by one), additive glow halos and floor pools (VFX layer), and the overlays (labels, encounter
// rings, telegraph hand-shadows, landmarks, sightlines, vignettes, NPC spots, exits, lullaby zones; all off by default). Deterministic; owns and frees
// every geometry / material / texture it makes (GLB sources stay with the loader's cache).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as kit from '../kit.js';
import { flicker1f, noise, runPieces, segmentDistance, hashSeed, lightTarget, rng, footprints } from './interior.js';
import { BlockoutSet, LabelSet, labelTexture, MARKER_COLORS, voidShade } from './interiorBlockout.js';

const smooth = (v, e0, e1) => THREE.MathUtils.smoothstep(v, e0, e1);
const UP = new THREE.Vector3(0, 1, 0);
/** Opacity of the additive halo / pool sprites (the VFX composite cuts the scene by alpha: keep it low, the colour is boosted by 1 / SPRITE_ALPHA). */
const SPRITE_ALPHA = 0.3;
/** Side (m) of the square cells the instanced GLB placements are chunked by (one InstancedMesh per asset, bucket and cell: frustum culling per chunk). */
const MODEL_CELL = 32;
const NO_PICK = (o) => {
	o.userData.labNoPick = o.userData.labNoCollide = o.userData.labNoView = true;
	return o;
};

/** A plain image sample as a mipmapped DataTexture, rows flipped so the image top is v = 1 (the dungeon scenes' loader pattern). */
async function loadPlain(app, id, colorSpace) {
	const img = await app.loader.loadImageData(id);
	const { width: w, height: h } = img;
	const data = new Uint8Array(w * h * 4);
	for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
	const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: id, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(8, app.backend.caps.maxAnisotropy || 4), colorSpace, needsUpdate: true });
	return tex;
}

/** A soft radial sprite: white core → transparent (glows, pools) or black core → transparent (shadows), as a canvas texture. */
function radialTexture(kind = 'glow') {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(64, 64, 2, 64, 64, 63);
	if (kind === 'shadow') {
		grad.addColorStop(0, 'rgba(0,0,0,0.92)');
		grad.addColorStop(0.45, 'rgba(0,0,0,0.6)');
		grad.addColorStop(1, 'rgba(0,0,0,0)');
	} else {
		grad.addColorStop(0, 'rgba(255,255,255,1)');
		grad.addColorStop(0.2, 'rgba(255,255,255,0.55)');
		grad.addColorStop(0.55, 'rgba(255,255,255,0.14)');
		grad.addColorStop(1, 'rgba(255,255,255,0)');
	}
	g.fillStyle = grad;
	g.fillRect(0, 0, 128, 128);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

/** How much of a point survives the camera wall fade (1 = untouched, 0 = dithered out): the shaders' own test (backends/webgl/effects.js
 * createWallFade: a cylinder round the camera → focus line, nothing behind the focus, nothing under the kept foot) on the CPU. */
function wallFadeVisible(u, cam, x, y, z) {
	const [r, strength, floor] = [u.params.value.x, u.params.value.y, u.params.value.z];
	if (!(strength > 0)) return 1;
	const f = u.focus.value;
	const ax = f.x - cam.x;
	const ay = f.y - cam.y;
	const az = f.z - cam.z;
	const t = ((x - cam.x) * ax + (y - cam.y) * ay + (z - cam.z) * az) / Math.max(ax * ax + ay * ay + az * az, 1e-4);
	const tc = THREE.MathUtils.clamp(t, 0, 1);
	const d = Math.hypot(x - (cam.x + ax * tc), y - (cam.y + ay * tc), z - (cam.z + az * tc));
	const amt = (1 - smooth(d, r * 0.55, r)) * (1 - smooth(t, 0.8, 0.97)) * smooth(y, floor, floor + 0.8) * strength;
	return 1 - THREE.MathUtils.clamp(amt * 0.92, 0, 1);
}

const meshOf = (gltf) => {
	let found = null;
	gltf?.scene.traverse((o) => {
		if (o.isMesh && !found) found = o;
	});
	return found;
};

/** Constant normal (+y) and uv for hand-built geometry (node renderers read both even for unlit materials). */
function withDefaults(g) {
	const n = g.attributes.position.count;
	if (!g.attributes.normal) g.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from({ length: n * 3 }, (_, i) => (i % 3 === 1 ? 1 : 0)), 3));
	if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
	return g;
}

/** Bake a geometry by a matrix keeping position / normal / uv, non-indexed. */
function baked(geometry, matrix) {
	const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
	for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
	if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
	return g.applyMatrix4(matrix);
}

export class InteriorBuild {
	/**
	 * @param {object} o { app, model (compile()), group (scene side), vfx (VFX layer group), material (the layer terrain material), settings, wallFade }
	 */
	constructor(o) {
		Object.assign(this, o);
		this.kit = o.model.kit;
		this.root = new THREE.Group();
		this.root.name = `${o.model.plan.name} · build`;
		this.group.add(this.root);
		this.ownMaterials = [];
		this.ownTextures = [];
		this.ownGeometries = [];
		this.sources = []; // { L, light, base, level, target, seed }
		this.lights = []; // Lighting-panel entries
		this.overlays = {};
		this.counts = { blockouts: 0, models: 0, lights: 0, glows: 0, wallPieces: 0, floorCells: 0 };
		this.lightScale = 1;
		this.groupLevels = {}; // group -> remaining count (the scene's slider)
		this._m4 = new THREE.Matrix4();
		this._q = new THREE.Quaternion();
		this._c = new THREE.Color();
		this._v = new THREE.Vector3();
		this._s = new THREE.Vector3();
		this._cam = new THREE.Vector3();
	}

	own(m) {
		this.ownMaterials.push(m);
		return m;
	}

	ownGeo(g) {
		this.ownGeometries.push(g);
		return g;
	}

	ownTex(t) {
		this.ownTextures.push(t);
		return t;
	}

	async load() {
		const { app, model } = this;
		const tiles = new Set(model.runs.map((r) => r.style.tile));
		for (const s of model.stairs) tiles.add(s.tile ?? model.byId[this.stairRoom(s)?.id]?.wall.tile ?? 'BIO27_vault');
		const modules = new Set(model.runs.map((r) => r.style.module).filter(Boolean));
		const assetModels = new Set(Object.values(this.kit).map((k) => k.model).filter(Boolean));
		const tileList = [...tiles].filter(Boolean);
		const [tileTextures, gltfs] = await Promise.all([
			Promise.all(tileList.map((t) => Promise.all([loadPlain(app, `biome-${t}`, THREE.SRGBColorSpace), loadPlain(app, `biome-${t}-n`, THREE.NoColorSpace)]).catch((e) => (console.error(`Interior wall tile "${t}" failed to load`, e), null)))),
			Promise.all([...modules, ...assetModels].map((id) => app.loader.loadSample(id).then((g) => [id, g]).catch((e) => (console.error(`Interior model "${id}" failed to load (the blockout stays)`, e), [id, null])))),
		]);
		this.tiles = {};
		tileList.forEach((t, i) => {
			const pair = tileTextures[i];
			if (!pair) return;
			const [map, normal] = pair.map((tex) => {
				tex.repeat.set(0.25, 0.25); // world UVs: 1 uv = 1 m, the tile repeats every 4 m
				return this.ownTex(tex);
			});
			this.tiles[t] = { map, normal };
		});
		this.gltf = Object.fromEntries(gltfs);
		this.glowTexture = this.ownTex(radialTexture('glow'));
		this.shadowTexture = this.ownTex(radialTexture('shadow'));
	}

	stairRoom(s) {
		const cx = (s.rect[0] + s.rect[2]) / 2;
		const cz = (s.rect[1] + s.rect[3]) / 2;
		return this.model.roomAt(cx, cz);
	}

	build() {
		this.buildFloor();
		this.buildWalls();
		this.buildStairs();
		this.buildPlacements();
		this.buildLights();
		this.buildOverlays();
		this.buildWeather();
		this.buildWater();
		this.buildColliders();
	}

	/** Standing water (plan.water): one flat surface per body at its level, opaque (it writes depth: no fog step at its edge), dark and glossy so the
	 * still lights read in it; never walked on, never picked. */
	buildWater() {
		const M = this.model;
		if (!M.waters.length) return;
		const mat = this.own(new THREE.MeshStandardMaterial({ name: 'Still water (opaque)', color: new THREE.Color(0.012, 0.016, 0.015), roughness: 0.07, metalness: 0, envMapIntensity: 0.6 }));
		for (const w of M.waters) {
			const g = this.ownGeo(new THREE.ShapeGeometry(new THREE.Shape(w.pts.map(([x, z]) => new THREE.Vector2(x, -z)))).rotateX(-Math.PI / 2)); // shape (x, −z) → world (x, 0, z), facing up
			const mesh = NO_PICK(new THREE.Mesh(g, mat));
			mesh.position.y = w.level;
			mesh.name = `Water · ${w.id ?? 'still'}`;
			mesh.receiveShadow = true;
			this.group.add(mesh);
		}
	}

	/** Collision-only prisms (KIT `collider`: height in m, opt-in) over the walk blockers of the solid placements of low blockouts: Play's walk collision sees
	 * walls only 0.35–1.7 m above the ground and steps up 0.6 m, so a 0.5 m bed or a sleeper's mound would be walked over. Side faces only; never drawn
	 * (layer 31 + an invisible material, like the outdoor engine's deep-water walls) but in the collision, kept out of the camera cutaway. */
	buildColliders() {
		const M = this.model;
		const pos = [];
		const side = (ax, az, bx, bz, y0, y1) => pos.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
		for (const p of M.placements) {
			const k = this.kit[p.asset];
			if (!k?.collider || !p.solid || p.void) continue;
			const y1 = p.y + k.collider * p.scale;
			for (const f of footprints(p, k)) {
				const pts = f.kind === 'disc' ? Array.from({ length: 10 }, (_, i) => [f.x + Math.cos((i / 10) * 2 * Math.PI) * f.r, f.z + Math.sin((i / 10) * 2 * Math.PI) * f.r]) : f.pts;
				for (let i = 0; i < pts.length; i++) {
					const a = pts[i];
					const b = pts[(i + 1) % pts.length];
					side(a[0], a[1], b[0], b[1], p.y - 0.1, y1);
				}
			}
		}
		if (!pos.length) return;
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.computeVertexNormals();
		const mesh = new THREE.Mesh(this.ownGeo(withDefaults(g)), this.own(new THREE.MeshBasicMaterial({ name: 'Walk colliders (collision only)', visible: false })));
		mesh.name = 'Walk colliders of low blockouts (collision only)';
		mesh.layers.set(31);
		mesh.userData.labNoView = true;
		mesh.frustumCulled = false;
		this.group.add(mesh);
		this.colliders = mesh;
	}

	// ---- floor ------------------------------------------------------------------------------------------------------------------------------------

	/**
	 * The floor: square cells of `floor.mesh` m (default 0.5) where the floor is (tucked under the walls; at a void edge it stops at the edge, so Play's
	 * nav grid, which walks on this mesh, ends where the plan's floor ends); the apron: cells past a void edge up to `apron` m, darkened toward black (vertex
	 * colours), never walkable. Each cell has its own four corners (heights read just inside the cell) and risers close every step between cells, so a
	 * level change or a landing edge stays a crisp step; stair rects are left to the stair treads.
	 */
	buildFloor() {
		const M = this.model;
		const fc = M.plan.floor?.mesh ?? 0.5;
		const [bx0, bz0, bx1, bz1] = M.bounds;
		const pad = M.apron;
		const x0 = bx0 - pad;
		const z0 = bz0 - pad;
		const nx = Math.ceil((bx1 - bx0 + 2 * pad) / fc);
		const nz = Math.ceil((bz1 - bz0 + 2 * pad) / fc);
		const voidDistance = (x, z) => {
			let best = 1e9;
			for (const v of M.voids) best = Math.min(best, segmentDistance(x, z, v.a[0], v.a[1], v.b[0], v.b[1]).d);
			return best;
		};
		const sets = { walk: { pos: [], col: [], idx: [] }, apron: { pos: [], col: [], idx: [] } };
		const inStair = (x, z) => M.stairs.some((s) => x > s.rect[0] && x < s.rect[2] && z > s.rect[1] && z < s.rect[3]);
		const e = 0.001;
		const CORNERS = [[0, 0], [1, 0], [0, 1], [1, 1]];
		const kind = new Int8Array(nx * nz); // 0 none, 1 floor, 2 apron, 3 stair (the treads are their own mesh)
		const corner = new Float32Array(nx * nz * 4); // corner heights read just inside each cell
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				const k = j * nx + i;
				const cx = x0 + (i + 0.5) * fc;
				const cz = z0 + (j + 0.5) * fc;
				if (inStair(cx, cz)) kind[k] = 3;
				else {
					const d = M.wallDistance(cx, cz);
					const nearVoid = M.voids.length && d > -pad ? voidDistance(cx, cz) : 1e9;
					// Play walks on this mesh: at a void edge the walkable floor stops at the edge (the strip past it is apron); at a wall it tucks under the wall
					if (d > (nearVoid < fc ? 0 : -0.3)) kind[k] = 1;
					else if (d > -pad && nearVoid < pad) kind[k] = 2;
					else continue;
				}
				CORNERS.forEach(([ox, oz], c) => (corner[k * 4 + c] = M.floorY(x0 + (i + ox) * fc + (ox ? -e : e), z0 + (j + oz) * fc + (oz ? -e : e))));
			}
		}
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				const k = j * nx + i;
				if (kind[k] !== 1 && kind[k] !== 2) continue;
				const set = kind[k] === 1 ? sets.walk : sets.apron;
				const base = set.pos.length / 3;
				CORNERS.forEach(([ox, oz], c) => {
					const x = x0 + (i + ox) * fc;
					const z = z0 + (j + oz) * fc;
					set.pos.push(x, corner[k * 4 + c], z);
					const dv = M.wallDistance(x, z);
					const shade = set === sets.walk ? 0.86 + 0.14 * smooth(dv, -0.2, 1.2) : 0.86 * (1 - smooth(-dv, 0, pad * 0.8));
					set.col.push(shade, shade, shade);
				});
				set.idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
				this.counts.floorCells++;
				// risers: where this cell's edge stands above its neighbour's (a level change, a ramp's side, a landing over a stair), a vertical face closes the step
				for (const [di, dj, mine, theirs] of [[1, 0, [1, 3], [0, 2]], [-1, 0, [0, 2], [1, 3]], [0, 1, [2, 3], [0, 1]], [0, -1, [0, 1], [2, 3]]]) {
					const ni = i + di;
					const nj = j + dj;
					if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
					const nk = nj * nx + ni;
					if (!kind[nk]) continue;
					const hi = [corner[k * 4 + mine[0]], corner[k * 4 + mine[1]]];
					const lo = [corner[nk * 4 + theirs[0]], corner[nk * 4 + theirs[1]]];
					if (!(hi[0] - lo[0] > 0.02 || hi[1] - lo[1] > 0.02)) continue;
					const p = mine.map((c) => [x0 + (i + CORNERS[c][0]) * fc, z0 + (j + CORNERS[c][1]) * fc]);
					const b = set.pos.length / 3;
					set.pos.push(p[0][0], Math.min(lo[0], hi[0]), p[0][1], p[1][0], Math.min(lo[1], hi[1]), p[1][1], p[0][0], hi[0], p[0][1], p[1][0], hi[1], p[1][1]);
					set.col.push(0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8);
					// winding: the face looks toward the lower neighbour (di, dj)
					const ex = p[1][0] - p[0][0];
					const ez = p[1][1] - p[0][1];
					const toward = ez * di - ex * dj; // (b, b+2, b+1) has its normal along (ez, 0, −ex): keep it when that faces the neighbour
					if (toward > 0) set.idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
					else set.idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
				}
			}
		}
		const make = (s, name, collide) => {
			if (!s.idx.length) return null;
			const g = new THREE.BufferGeometry();
			g.setAttribute('position', new THREE.Float32BufferAttribute(s.pos, 3));
			g.setAttribute('color', new THREE.Float32BufferAttribute(s.col, 3));
			const uv = new Float32Array((s.pos.length / 3) * 2);
			for (let k = 0; k < s.pos.length / 3; k++) uv.set([s.pos[k * 3], s.pos[k * 3 + 2]], k * 2);
			g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
			g.setIndex(s.idx);
			g.computeVertexNormals();
			// a riser with one corner on the level gives a degenerate triangle: its lone vertex keeps a zero normal → NaN in the terrain shader, which the
			// bloom then spreads into big black blocks over the frame; such vertices take the floor's up normal
			const nrm = g.attributes.normal;
			for (let i = 0; i < nrm.count; i++) if (Math.abs(nrm.getX(i)) + Math.abs(nrm.getY(i)) + Math.abs(nrm.getZ(i)) < 1e-6) nrm.setXYZ(i, 0, 1, 0);
			// risers (vertical faces) cannot take the terrain material: its world-xz texture frame is degenerate on them, the shader turns NaN there and the
			// bloom spreads it into big black blocks over the frame. They become their own mesh (same attributes) with the wall material of the map's main
			// wall tile, uv along the face (u = the run, v = height)
			const pa = g.attributes.position;
			const ua = g.attributes.uv;
			for (let i = 0; i < nrm.count; i++) if (Math.abs(nrm.getY(i)) < 0.5) ua.setXY(i, Math.abs(nrm.getZ(i)) > Math.abs(nrm.getX(i)) ? pa.getX(i) : pa.getZ(i), pa.getY(i));
			const all = g.index.array;
			const flat = [];
			const steep = [];
			for (let t = 0; t < all.length; t += 3) (Math.abs(nrm.getY(all[t]) + nrm.getY(all[t + 1]) + nrm.getY(all[t + 2])) < 1.5 ? steep : flat).push(all[t], all[t + 1], all[t + 2]);
			if (steep.length) {
				g.setIndex(flat);
				const rg = new THREE.BufferGeometry();
				for (const k of ['position', 'normal', 'color', 'uv']) rg.setAttribute(k, g.attributes[k]);
				rg.setIndex(steep);
				const len = {};
				for (const r of M.runs) if (!r.style.module) len[r.style.tile] = (len[r.style.tile] ?? 0) + r.len;
				const tile = Object.entries(len).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'BIO27_vault';
				const risers = new THREE.Mesh(this.ownGeo(rg), this.wallMaterial(tile, 0.85));
				risers.name = `${name} · risers (wall tile ${tile})`;
				risers.receiveShadow = true;
				if (!collide) risers.userData.labNoCollide = true;
				this.group.add(risers);
			}
			const mesh = new THREE.Mesh(this.ownGeo(g), this.material);
			mesh.name = name;
			mesh.receiveShadow = true;
			if (!collide) mesh.userData.labNoCollide = true;
			this.group.add(mesh);
			return mesh;
		};
		this.floor = make(sets.walk, 'Floor (walkable)', true);
		this.apronMesh = make(sets.apron, 'Floor apron (the void past the edge, not walkable)', false);
	}

	// ---- walls ------------------------------------------------------------------------------------------------------------------------------------

	wallMaterial(tile, tone = 1, normal = 0.9) {
		const key = `${tile}|${tone}|${normal}`;
		this._wallMats ??= new Map();
		if (!this._wallMats.has(key)) {
			const t = this.tiles[tile];
			const m = this.own(new THREE.MeshStandardMaterial({ name: `Wall · ${tile}`, map: t?.map ?? null, normalMap: t?.normal ?? null, normalScale: new THREE.Vector2(normal, normal), color: new THREE.Color(0.78 * tone, 0.77 * tone, 0.75 * tone), roughness: 0.93, metalness: 0, vertexColors: true }));
			this._wallMats.set(key, this.wallFade ? this.wallFade.apply(m) : m);
		}
		return this._wallMats.get(key);
	}

	/** Extruded boxes per run piece (arches: kit.archPanel), merged per tile; GLB modules for runs with style.module. */
	buildWalls() {
		const M = this.model;
		const byKey = new Map();
		const modules = new Map(); // sample id -> [{ x, y, z, yaw, sx }]
		for (const run of M.runs) {
			const st = run.style;
			const yaw = Math.atan2(-run.dir[1], run.dir[0]);
			this._q.setFromAxisAngle(UP, yaw);
			const t = run.thickness;
			const off = run.offset === 'out' ? -t / 2 : 0;
			if (st.module && this.gltf[st.module]) {
				const [w = 4, , dDepth = 0.7] = st.moduleSize ?? [];
				const n = Math.max(1, Math.ceil(run.len / (w * 1.1) - 1e-9));
				const sx = THREE.MathUtils.clamp(run.len / (w * n), 0.8, 1.1);
				const spacing = run.len / n;
				const list = modules.get(st.module) ?? [];
				for (let i = 0; i < n; i++) {
					const tc = (i + 0.5) * spacing;
					list.push({ x: run.a[0] + run.dir[0] * tc - run.inward[0] * (dDepth / 2), y: run.y0, z: run.a[1] + run.dir[1] * tc - run.inward[1] * (dDepth / 2), yaw: Math.atan2(run.inward[0], run.inward[1]), sx, sy: st.moduleScaleY ?? 1 });
				}
				modules.set(st.module, list);
				continue;
			}
			const key = `${st.tile}|${st.tone ?? 1}|${st.top ?? ''}|${st.normal ?? ''}`;
			if (!byKey.has(key)) byKey.set(key, { style: st, parts: [] });
			const parts = byKey.get(key).parts;
			for (const p of runPieces(run)) {
				const ext0 = p.t0 < 1e-3 && run.offset === 'out' ? t / 2 : 0;
				const ext1 = p.t1 > run.len - 1e-3 && run.offset === 'out' ? t / 2 : 0;
				const L = p.t1 - p.t0 + ext0 + ext1;
				const tc = (p.t0 - ext0 + p.t1 + ext1) / 2;
				const pos = new THREE.Vector3(run.a[0] + run.dir[0] * tc + run.inward[0] * off, run.y0 + p.y0, run.a[1] + run.dir[1] * tc + run.inward[1] * off);
				const h = p.y1 - p.y0;
				let g;
				if (p.kind === 'arch') {
					g = kit.archPanel({ length: L, height: h, thickness: t, openingWidth: Math.min(p.openingWidth, L - 0.1), openingHeight: Math.min(p.opening.height ?? 2.8, h - 0.25), sill: 0 });
				} else {
					g = new THREE.BoxGeometry(L, h, t);
					g.translate(0, h / 2, 0);
				}
				parts.push(baked(g, this._m4.compose(pos, this._q, new THREE.Vector3(1, 1, 1))));
				g.dispose();
				this.counts.wallPieces++;
				if (p.kind === 'sill' && p.opening?.kind === 'window') this.addWindowPane(run, p, off);
			}
		}
		this.wallMeshes = [];
		for (const { style, parts } of byKey.values()) {
			if (!parts.length) continue;
			const g = kit.worldUV(mergeGeometries(parts));
			for (const p of parts) p.dispose();
			const pos = g.attributes.position;
			const col = new Float32Array(pos.count * 3);
			const top = style.top ?? style.height * 0.62;
			for (let i = 0; i < pos.count; i++) {
				const y = pos.getY(i) - this.model.floorY(pos.getX(i), pos.getZ(i));
				col.fill(THREE.MathUtils.lerp(1, 0.07, smooth(y, top, top + 2.6)) * (0.82 + 0.18 * smooth(y, 0, 0.5)), i * 3, i * 3 + 3);
			}
			g.setAttribute('color', new THREE.BufferAttribute(col, 3));
			const mesh = new THREE.Mesh(this.ownGeo(g), this.wallMaterial(style.tile, style.tone ?? 1, style.normal ?? 0.9));
			mesh.name = `Walls · ${style.tile}`;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.userData.labSolid = true;
			this.group.add(mesh);
			this.wallMeshes.push(mesh);
		}
		for (const [id, list] of modules) {
			const src = meshOf(this.gltf[id]);
			if (!src) continue;
			const material = src.material.clone();
			material.side = THREE.DoubleSide; // the crypt-wall module is a hollow shell (open niches)
			this.own(material);
			const mesh = new THREE.InstancedMesh(src.geometry, this.wallFade ? this.wallFade.apply(material) : material, list.length);
			mesh.name = `Wall modules · ${id}`;
			list.forEach((w, i) => mesh.setMatrixAt(i, this._m4.compose(new THREE.Vector3(w.x, w.y, w.z), this._q.setFromAxisAngle(UP, w.yaw), new THREE.Vector3(w.sx, w.sy, 1))));
			mesh.instanceMatrix.needsUpdate = true;
			mesh.frustumCulled = false;
			mesh.castShadow = mesh.receiveShadow = true;
			mesh.userData.labSolid = true;
			mesh.userData.assetId = `glb:${id}`;
			this.group.add(mesh);
			this.wallMeshes.push(mesh);
		}
	}

	/** A window's emitting pane (the glow colour of the opening) in the middle of the wall. With the camera wall fade it is an emitting standard material
	 * (black albedo), so it dithers out with its wall instead of floating in the faded wall (a window model mounted on the wall fades the same way). */
	addWindowPane(run, sill, off) {
		const o = sill.opening;
		const glow = o.glow ?? { color: '#e0a050', intensity: 2 };
		const w = o.t1 - o.t0;
		const h = o.height ?? 1.6;
		const tc = (o.t0 + o.t1) / 2;
		const color = new THREE.Color(glow.color).multiplyScalar(glow.intensity ?? 2);
		this._paneMats ??= new Map();
		const key = `${glow.color}|${glow.intensity ?? 2}`;
		if (!this._paneMats.has(key)) {
			this._paneMats.set(key, this.wallFade
				? this.wallFade.apply(this.own(new THREE.MeshStandardMaterial({ name: 'Window pane (emits)', color: 0x000000, emissive: color, roughness: 1, metalness: 0, envMapIntensity: 0, toneMapped: false, side: THREE.DoubleSide })))
				: this.own(new THREE.MeshBasicMaterial({ name: 'Window pane (emits)', color, toneMapped: false, side: THREE.DoubleSide })));
		}
		const mat = this._paneMats.get(key);
		const pane = new THREE.Mesh(this.ownGeo(withDefaults(new THREE.PlaneGeometry(w, h))), mat);
		const at = o.pane === 'outer' ? off - run.thickness / 2 - 0.01 : off; // 'outer': 1 cm outside the outer face (a window model fills the wall from inside)
		pane.position.set(run.a[0] + run.dir[0] * tc + run.inward[0] * at, run.y0 + sill.y1 + h / 2, run.a[1] + run.dir[1] * tc + run.inward[1] * at);
		pane.rotation.y = Math.atan2(run.inward[0], run.inward[1]);
		NO_PICK(pane);
		this.group.add(pane);
	}

	// ---- stairs -----------------------------------------------------------------------------------------------------------------------------------

	buildStairs() {
		const M = this.model;
		for (const s of M.stairs) {
			const room = this.stairRoom(s);
			const tile = s.tile ?? room?.wall.tile ?? 'BIO27_vault';
			const parts = [];
			const [x0, z0, x1, z1] = s.rect;
			for (let k = 0; k < s.steps; k++) {
				const h = s.y0 + (k + 1) * s.rise;
				const a = k * s.run;
				const b = (k + 1) * s.run;
				let cx, cz, w, d;
				if (s.up === 'e' || s.up === 'w') {
					const xa = s.up === 'e' ? x0 + a : x1 - b;
					cx = xa + s.run / 2;
					cz = (z0 + z1) / 2;
					w = s.run;
					d = z1 - z0;
				} else {
					const za = s.up === 's' ? z0 + a : z1 - b;
					cz = za + s.run / 2;
					cx = (x0 + x1) / 2;
					w = x1 - x0;
					d = s.run;
				}
				const bottom = Math.min(s.y0, s.y1) - 0.3;
				const box = new THREE.BoxGeometry(w, h - bottom, d);
				parts.push(baked(box, this._m4.makeTranslation(cx, (h + bottom) / 2, cz)));
				box.dispose();
			}
			const g = kit.worldUV(mergeGeometries(parts));
			for (const p of parts) p.dispose();
			const col = new Float32Array(g.attributes.position.count * 3).fill(0.92);
			g.setAttribute('color', new THREE.BufferAttribute(col, 3));
			const mesh = new THREE.Mesh(this.ownGeo(g), this.wallMaterial(tile, 0.95));
			mesh.name = `Stair · ${s.id}`;
			mesh.castShadow = mesh.receiveShadow = true;
			this.group.add(mesh);
		}
	}

	// ---- placements: blockouts and existing models ------------------------------------------------------------------------------------------------

	buildPlacements() {
		const M = this.model;
		const kitById = this.kit;
		// assets with a loaded GLB: instanced from the GLB's first mesh (real size, pivot at the bottom centre), one InstancedMesh per asset, bucket and
		// MODEL_CELL square so the camera culls the chunks it does not see (the Garden's ~250 sleepers are ~2 M triangles); one material per asset
		const modelled = new Set();
		this.modelMeshes = [];
		const groups = new Map();
		for (const p of M.placements) {
			const k = kitById[p.asset];
			if (!k?.model || !meshOf(this.gltf[k.model])) continue;
			modelled.add(p.asset);
			const key = `${p.asset}|${p.void ? 'void' : p.solid ? 'solid' : 'open'}|${Math.floor(p.x / MODEL_CELL)},${Math.floor(p.z / MODEL_CELL)}`;
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key).push(p);
		}
		const materials = new Map();
		for (const [key, list] of groups) {
			const [id, bucket] = key.split('|');
			const k = kitById[id];
			const src = meshOf(this.gltf[k.model]);
			if (!materials.has(id)) {
				const material = this.own(src.material.clone());
				materials.set(id, k.fade === false || !this.wallFade ? material : this.wallFade.apply(material));
			}
			const mesh = new THREE.InstancedMesh(src.geometry, materials.get(id), list.length);
			mesh.name = `${id} ${k.name} · ${k.model}`;
			mesh.userData.assetId = id;
			mesh.userData.assetName = k.name;
			// in Play's walk collision unless the KIT has a `collider`: its invisible prisms block the hero then (the model's own triangles would only add
			// millions of walkable tops and walls to the collision grid, e.g. the sleepers' mounds)
			if (bucket === 'solid' && !k.collider) mesh.userData.labSolid = true;
			if (bucket === 'void') {
				NO_PICK(mesh);
				// drawn in the dark past the floor: darkened with the distance like the void blockouts (the instance colour multiplies the albedo)
				mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
				list.forEach((p, i) => {
					const d = voidShade(M, p);
					mesh.instanceColor.setXYZ(i, d, d, d);
				});
			}
			list.forEach((p, i) => mesh.setMatrixAt(i, this._m4.compose(new THREE.Vector3(p.x, p.y, p.z), this._q.setFromAxisAngle(UP, p.yaw), new THREE.Vector3(p.scale, p.scale, p.scale))));
			mesh.instanceMatrix.needsUpdate = true;
			mesh.computeBoundingSphere();
			mesh.castShadow = bucket !== 'void';
			mesh.receiveShadow = true;
			this.group.add(mesh);
			this.modelMeshes.push(mesh);
			this.counts.models += list.length;
		}
		// everything else: blockouts (assets with fade: false get their own materials, e.g. the boss or an NPC: they must not dither out in their beat view)
		const unfaded = (k) => k.fade === false || k.monster || k.npc;
		this.blockouts = new BlockoutSet({ model: M, kit: kitById, fade: this.wallFade, skip: (p, k) => modelled.has(p.asset) || unfaded(k) });
		this.blockouts.build();
		this.group.add(this.blockouts.group);
		this.solo = new BlockoutSet({ model: M, kit: kitById, fade: null, skip: (p, k) => modelled.has(p.asset) || !unfaded(k) });
		this.solo.build();
		this.solo.group.name = 'Blockouts (no wall fade: monsters, NPC stand-ins, beat pieces)';
		this.group.add(this.solo.group);
		this.counts.blockouts = M.placements.length - this.counts.models;
		// monster blockouts (KIT.monster) hide in Play while their stand-in camp is on: the scene toggles them through this list
		this.monsterMeshes = this.solo.meshes.filter((m) => kitById[m.userData.assetId]?.monster);
		// exterior roofs (KIT.roof) show only while the focus is outdoors (room.outdoor or off the floor): the scene toggles them through this list
		this.roofMeshes = [...this.blockouts.meshes, ...this.solo.meshes].filter((m) => kitById[m.userData.assetId]?.roof);
	}

	// ---- lights -----------------------------------------------------------------------------------------------------------------------------------

	buildLights() {
		const M = this.model;
		const shadowSize = this.app.settings.data.lighting?.shadowMapSize ?? 2048; // the Lighting panel owns the size; allocated at it from the start
		for (const L of M.lights) {
			let light = null;
			if (L.real) {
				const color = new THREE.Color(L.color);
				if (L.spot) {
					light = new THREE.SpotLight(color, L.intensity, L.range, L.angle ?? 0.8, L.penumbra ?? 1, L.decay ?? 2);
					light.target.position.set(...(L.target ?? [L.x, 0, L.z]));
					this.group.add(light.target);
				} else light = new THREE.PointLight(color, L.intensity, L.range, L.decay ?? 2);
				light.position.set(L.x, L.y, L.z);
				light.name = `${L.kind} · ${L.name ?? L.id}`;
				light.castShadow = !!L.shadow;
				if (L.shadow) {
					light.shadow.mapSize.set(shadowSize, shadowSize);
					light.shadow.bias = -0.0006;
					light.shadow.normalBias = 0.03;
					light.shadow.camera.near = 0.5;
					light.shadow.camera.far = L.range + 4;
					light.userData.labBiasOverride = true;
				}
				this.group.add(light);
				this.counts.lights++;
			}
			// the Lighting panel edits entry.base; the frame loop multiplies it by the grammar and the level
			const entry = light ? { name: `${L.kindLabel ?? (L.kind === 'perfection' ? 'Perfection' : L.kind === 'human' ? 'Human' : 'Wall')} · ${L.name ?? L.id}`, light, base: L.intensity } : null;
			if (entry) this.lights.push(entry);
			// colours parsed once: the frame loop only scales them
			this.sources.push({ L, light, base: L.intensity, level: 1, target: 1, seed: (hashSeed(String(L.id)) % 997) / 13, entry, color: new THREE.Color(L.color), shade: L.void ? voidShade(M, { x: L.x, z: L.z }) : 1 });
		}
		this.snapLevels();
		// halos (camera-facing) and floor pools: additive, in the VFX layer (an additive blend in the scene pass also adds into the normal / AO targets). The
		// VFX layer is composited as scene · (1 − a) + rgb, so a sprite's alpha also cuts the scene: the sprites keep a low opacity (SPRITE_ALPHA, their colour
		// is boosted to match) and shrink to nothing when their light is out — a dimmed sprite would paint a dark disc.
		const halos = this.sources.filter((s) => s.L.glow > 0);
		const pools = this.sources.filter((s) => s.L.pool > 0);
		const glowMat = this.own(new THREE.MeshBasicMaterial({ name: 'Light halos', map: this.glowTexture, transparent: true, opacity: SPRITE_ALPHA, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const poolMat = this.own(new THREE.MeshBasicMaterial({ name: 'Light pools on the floor', map: this.glowTexture, transparent: true, opacity: SPRITE_ALPHA, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
		const instanced = (list, geometry, material, name) => {
			if (!list.length) return null;
			const mesh = new THREE.InstancedMesh(this.ownGeo(withDefaults(geometry)), material, list.length);
			mesh.name = name;
			mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3);
			mesh.frustumCulled = false;
			NO_PICK(mesh);
			this.vfx.add(mesh);
			return mesh;
		};
		this.halos = { list: halos, mesh: instanced(halos, new THREE.PlaneGeometry(1, 1), glowMat, 'Light halos (still)') };
		this.pools = { list: pools, mesh: instanced(pools, new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), poolMat, 'Light pools (floor)') };
		for (const s of pools) s.poolY = this.model.floorY(s.L.x, s.L.z) + 0.04;
		// glow parts of the blockouts (lamp globes) follow the level of the light of their placement
		const byPlacement = new Map(this.sources.filter((s) => s.L.placement !== undefined).map((s) => [s.L.placement, s]));
		this.globes = [...this.blockouts.glowMeshes, ...this.solo.glowMeshes].map(({ mesh, placements }) => ({
			mesh, color: new THREE.Color(this.kit[mesh.userData.assetId]?.glowColor ?? '#f2ecdf'), sources: placements.map((i) => byPlacement.get(i) ?? null), shade: placements.map((i) => (M.placements[i].void ? voidShade(M, M.placements[i]) : 1)),
			own: !!this.kit[mesh.userData.assetId]?.glowColor, // an explicit KIT glowColor tints the glass; otherwise the globe takes its light's colour
			gain: this.kit[mesh.userData.assetId]?.globeGain ?? 2.67, // KIT globeGain: how hot a lit globe is (≥ ~1.4 blooms to white; keep a tinted lamp below it so its hue survives tone mapping)
		}));
		this.counts.glows = halos.length;
	}

	/** Remaining lights of a group (the scene's slider): the `n` lights nearest the group's keepNear stay lit (the others fade out over ~0.6 s). */
	setGroupLevel(group, n) {
		this.groupLevels[group] = n;
	}

	/** Jump every light to its target level now (captures and tests render frames back to back, so the 0.6 s fade would not finish). */
	snapLevels() {
		for (const s of this.sources) s.level = s.target = lightTarget(this.model, s.L, this.groupLevels);
	}

	// ---- overlays ---------------------------------------------------------------------------------------------------------------------------------

	overlayMaterial(color, opacity = 0.85) {
		this._overlayMats ??= new Map();
		const key = `${color}|${opacity}`;
		if (!this._overlayMats.has(key)) this._overlayMats.set(key, this.own(new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
		return this._overlayMats.get(key);
	}

	overlayGroup(name, label) {
		const g = NO_PICK(new THREE.Group());
		g.name = label;
		g.visible = false;
		this.root.add(g);
		this.overlays[name] = g;
		return g;
	}

	ring(group, x, z, r, color, width = 0.14, dashed = false) {
		const M = this.model;
		const y = M.floorY(x, z) + 0.06;
		if (!dashed) {
			const g = this.ownGeo(withDefaults(new THREE.RingGeometry(Math.max(0.01, r - width), r, 64).rotateX(-Math.PI / 2)));
			const m = NO_PICK(new THREE.Mesh(g, this.overlayMaterial(color)));
			m.position.set(x, y, z);
			m.renderOrder = 8;
			group.add(m);
			return;
		}
		const n = Math.max(12, Math.round((2 * Math.PI * r) / 1.4));
		for (let k = 0; k < n; k += 2) {
			const g = this.ownGeo(withDefaults(new THREE.RingGeometry(r - width, r, 6, 1, (k / n) * 2 * Math.PI, (2 * Math.PI) / n).rotateX(-Math.PI / 2)));
			const m = NO_PICK(new THREE.Mesh(g, this.overlayMaterial(color)));
			m.position.set(x, y, z);
			m.renderOrder = 8;
			group.add(m);
		}
	}

	line(group, a, b, color, width = 0.12, dash = 1.2) {
		const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
		const n = Math.max(1, Math.floor(len / dash));
		const yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
		for (let k = 0; k < n; k += 2) {
			const t = (k + 0.5) / n;
			const x = a[0] + (b[0] - a[0]) * t;
			const z = a[1] + (b[1] - a[1]) * t;
			const g = this.ownGeo(withDefaults(new THREE.PlaneGeometry(len / n, width).rotateX(-Math.PI / 2)));
			const m = NO_PICK(new THREE.Mesh(g, this.overlayMaterial(color)));
			m.position.set(x, this.model.floorY(x, z) + 0.07, z);
			m.rotation.y = yaw;
			m.renderOrder = 8;
			group.add(m);
		}
	}

	buildOverlays() {
		const M = this.model;
		const labels = this.overlayGroup('labels', 'Overlay · nhãn asset');
		this.labelSet = new LabelSet('Asset labels', 0.55);
		labels.add(this.labelSet.group);
		const seen = new Set();
		for (const p of M.placements) {
			if (p.void) continue;
			const k = this.kit[p.asset];
			if (!k) continue;
			if (!seen.has(p.asset)) {
				seen.add(p.asset);
				this.labelSet.add(p.asset, labelTexture(`${p.asset} · ${k.short ?? k.name}`, `${k.model && this.gltf[k.model] ? (k.status === 'kit' ? 'GLB stand-in' : 'GLB') : k.monster ? 'monster blockout' : k.status ?? 'blockout'} · ${k.size.map((v) => +v.toFixed(2)).join(' × ')} m`));
			}
			this.labelSet.place(p.asset, p.x, p.y + k.size[1] * p.scale + 0.45, p.z);
		}
		this.labelSet.build();

		const enc = this.overlayGroup('encounters', 'Overlay · chạm trán');
		this.markerLabels = new LabelSet('Marker labels', 0.6);
		const markerLabel = (key, title, sub, x, y, z, color) => {
			this.markerLabels.add(key, labelTexture(title, sub, { color }));
			this.markerLabels.place(key, x, y, z);
		};
		M.camps.forEach((c, i) => {
			this.ring(enc, c.at[0], c.at[1], Math.max(0.8, c.radius), MARKER_COLORS[c.boss ? 'boss' : 'encounter'], c.boss ? 0.2 : 0.14);
			// on the ring's south edge (toward the camera), low: a boss camp shares its centre with the boss marker's own label
			const lz = c.at[1] + Math.max(0.8, c.radius);
			markerLabel(`camp${i}`, `${c.id} ×${c.count} · ${c.name}`, `Play: ${c.monster}${c.boss ? ' (boss)' : ''}`, c.at[0], M.floorY(c.at[0], lz) + 0.7, lz, '#f0c9c4');
		});
		const groups = { encounter: enc, boss: enc, telegraph: null, rite: this.overlayGroup('rites', 'Overlay · điểm nghi lễ'), landmark: null, sightline: null, vignette: null, lullaby: null, note: null, npc: this.overlayGroup('npc', 'Overlay · chỗ NPC'), exit: this.overlayGroup('exits', 'Overlay · lối ra') };
		const story = this.overlayGroup('landmarks', 'Overlay · mốc, tầm nhìn, vignette, vùng ru');
		for (const kind of ['landmark', 'sightline', 'vignette', 'lullaby', 'note']) groups[kind] = story;
		const tele = this.overlayGroup('telegraph', 'Overlay · bóng tay telegraph');
		const patrols = this.overlayGroup('patrols', 'Overlay · tuần tra, tầm nhìn (nón), lối đưa ra');
		const bells = this.overlayGroup('bells', 'Overlay · chuông ru: tiếng ồn → chuông → Poppy Nurse');
		this.bellRipples = [];
		this.telegraphs = [];
		const shadowMat = this.own(new THREE.MeshBasicMaterial({ name: 'Hand shadow (telegraph)', map: this.shadowTexture, color: 0x000000, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
		const strikeMat = this.own(new THREE.MeshBasicMaterial({ name: 'Hand strike flash', map: this.glowTexture, color: new THREE.Color('#f2ecdf'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const flat = this.ownGeo(withDefaults(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)));
		for (const m of M.markers) {
			const [x, z] = m.at;
			const y = M.floorY(x, z);
			const color = MARKER_COLORS[m.kind] ?? MARKER_COLORS.note;
			const g = groups[m.kind] ?? story;
			if (m.kind === 'telegraph') {
				const mat = shadowMat.clone();
				this.own(mat);
				const shadow = NO_PICK(new THREE.Mesh(flat, mat));
				shadow.position.set(x, y + 0.035, z);
				shadow.rotation.y = (m.yaw ?? 0) * (Math.PI / 180);
				shadow.renderOrder = 6;
				tele.add(shadow);
				const smat = strikeMat.clone();
				this.own(smat);
				const flash = NO_PICK(new THREE.Mesh(flat, smat));
				flash.position.set(x, y + 0.05, z);
				flash.renderOrder = 7;
				flash.visible = false;
				this.vfx.add(flash);
				this.telegraphs.push({ m, shadow, flash, phase: (m.delay ?? this.telegraphs.length * 0.37) % 2.6 });
				continue;
			}
			if (m.kind === 'sightline' && m.to) {
				this.line(g, m.at, m.to, color, 0.14, 1.6);
				markerLabel(`m${m.index}`, m.label ?? 'Tầm nhìn', m.note ?? '', x, y + 1.6, z, '#e8e2cc');
				continue;
			}
			// a patrol route (dashed, a sight cone at every point facing the next one) or an escort path out (finer dashes, no cones)
			// a hush bell (marker kind 'bell': r = its noise radius, calls = the doors its Poppy Nurses come out of): a dashed ring, dashed links to the doors,
			// a ring at each door; with the preview on, a ripple runs out from the bell to the radius
			if (m.kind === 'bell') {
				this.ring(bells, x, z, m.r ?? 6, color, 0.12, true);
				for (const c of m.calls ?? []) {
					this.line(bells, m.at, c, MARKER_COLORS.encounter, 0.1, 0.8);
					this.ring(bells, c[0], c[1], 0.8, MARKER_COLORS.encounter, 0.16);
				}
				this._bellRing ??= this.ownGeo(withDefaults(new THREE.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2)));
				const ripple = NO_PICK(new THREE.Mesh(this._bellRing, this.own(this.overlayMaterial(color).clone())));
				ripple.position.set(x, y + 0.08, z);
				ripple.visible = false;
				ripple.renderOrder = 8;
				bells.add(ripple);
				this.bellRipples.push({ m, ripple, phase: (this.bellRipples.length * 0.53) % 2.4 });
				markerLabel(`m${m.index}`, m.label ?? 'Chuông ru', m.note ?? '', x, y + 3.9, z, '#e8dcf0');
				continue;
			}
			if (m.kind === 'patrol' || m.kind === 'escort') {
				const pts = m.points?.length ? m.points : [m.at];
				const dash = m.kind === 'escort' ? 0.7 : 1.4;
				for (let i = 0; i + 1 < pts.length; i++) this.line(patrols, pts[i], pts[i + 1], color, 0.12, dash);
				if (m.loop && pts.length > 2) this.line(patrols, pts[pts.length - 1], pts[0], color, 0.12, dash);
				if (m.cone) {
					const half = ((m.cone.angle ?? 60) * Math.PI) / 360;
					pts.forEach((p, i) => {
						const q = pts.length > 1 ? (i + 1 < pts.length ? pts[i + 1] : m.loop ? pts[0] : pts[i - 1]) : null;
						const yaw = ((m.yaw ?? 0) * Math.PI) / 180;
						const a = q ? Math.atan2(-(q[1] - p[1]), q[0] - p[0]) : Math.atan2(-Math.cos(yaw), Math.sin(yaw)); // CircleGeometry angle θ → (cos θ, −sin θ) on xz
						const fan = NO_PICK(new THREE.Mesh(this.ownGeo(withDefaults(new THREE.CircleGeometry(m.cone.range ?? 6, 18, a - half, 2 * half).rotateX(-Math.PI / 2))), this.overlayMaterial(color, 0.2)));
						fan.position.set(p[0], M.floorY(p[0], p[1]) + 0.05, p[1]);
						fan.renderOrder = 7;
						patrols.add(fan);
					});
				}
				markerLabel(`m${m.index}`, m.label ?? m.kind, m.note ?? '', x, y + 1.8, z, '#eee6d2');
				continue;
			}
			if (m.kind === 'lullaby') this.ring(g, x, z, m.r ?? 10, color, 0.16, true);
			else if (m.kind === 'boss' || m.kind === 'encounter') this.ring(g, x, z, m.r ?? 2, color, 0.22);
			else if (m.kind === 'landmark') {
				const beam = NO_PICK(new THREE.Mesh(this.ownGeo(withDefaults(new THREE.CylinderGeometry(0.05, 0.05, 7, 6))), this.overlayMaterial(color, 0.75)));
				beam.position.set(x, y + 3.5, z);
				g.add(beam);
			} else if (m.kind === 'exit') {
				const tri = new THREE.Shape([new THREE.Vector2(-0.7, -0.5), new THREE.Vector2(0.7, -0.5), new THREE.Vector2(0, 0.9)]);
				const arrow = NO_PICK(new THREE.Mesh(this.ownGeo(withDefaults(new THREE.ShapeGeometry(tri).rotateX(-Math.PI / 2))), this.overlayMaterial(color)));
				arrow.position.set(x, y + 0.08, z);
				arrow.rotation.y = (m.yaw ?? 0) * (Math.PI / 180);
				g.add(arrow);
			} else this.ring(g, x, z, m.r ?? 0.9, color, 0.16);
			// a zone's label sits on its ring (south-east, toward the camera), not on the centre it shares with the boss and camp labels
			const [lx, lz] = m.kind === 'lullaby' ? [x + (m.r ?? 10) * 0.5, z + (m.r ?? 10) * 0.866] : [x, z];
			markerLabel(`m${m.index}`, m.label ?? m.kind, m.note ?? (m.ids ? m.ids.join(' · ') : ''), lx, M.floorY(lx, lz) + (m.kind === 'landmark' ? 7.4 : 1.8), lz, m.kind === 'boss' ? '#f0c9c4' : '#eee6d2');
		}
		this.markerLabels.build();
		// marker labels show with any of their overlays: one shared label group, visible when one of them is on
		this.markerLabels.group.visible = false;
		this.root.add(this.markerLabels.group);
	}

	setOverlay(name, on) {
		if (this.overlays[name]) this.overlays[name].visible = on;
		this.markerLabels.group.visible = ['encounters', 'landmarks', 'npc', 'exits', 'rites', 'patrols', 'bells'].some((k) => this.overlays[k]?.visible);
	}

	// ---- weather ----------------------------------------------------------------------------------------------------------------------------------

	/**
	 * Rain (plan.rain; a placeholder like the outdoor engine's): line streaks in a box that follows the focus; a drop over one of the plan's dry rects
	 * is not drawn (the Gentle House: the rain stops at the gate). The amount comes from the scene (the mood's rain × its slider).
	 */
	buildWeather() {
		const R = this.model.plan.rain;
		if (!R) return;
		const N = R.count ?? 1800;
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 6), 3));
		const mat = this.own(new THREE.LineBasicMaterial({ name: 'Rain streaks (placeholder)', color: new THREE.Color(R.color ?? '#9eabb6'), transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }));
		const lines = NO_PICK(new THREE.LineSegments(this.ownGeo(withDefaults(g)), mat));
		lines.name = 'Rain (placeholder: outside the dry areas)';
		lines.frustumCulled = false;
		lines.visible = false;
		this.vfx.add(lines);
		const r = rng(R.seed ?? 5150);
		const dry = (R.dry ?? []).map(([a, b, c, d]) => [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)]);
		this.rain = { lines, mat, N, box: R.box ?? [44, 16, 44], dry, drops: Array.from({ length: N }, () => ({ x: r() * 2 - 1, y: r(), z: r() * 2 - 1, s: 0.85 + r() * 0.3 })) };
	}

	/** Rain streaks round the focus (none over the dry rects); they fade out in far views (the box follows the focus: from afar it reads as noise). */
	updateRain(delta, camera, focus, rain) {
		const R = this.rain;
		const far = camera && focus ? 1 - smooth(camera.position.distanceTo(focus), 55, 110) : 0;
		R.lines.visible = rain * far > 0.01;
		if (!R.lines.visible) return;
		R.mat.opacity = 0.3 * Math.min(1, rain) * far;
		const [bw, bh, bd] = R.box;
		const arr = R.lines.geometry.attributes.position.array;
		const n = Math.round(R.N * Math.min(1, 0.35 + 0.65 * rain));
		const fall = 9.5 * delta;
		for (let i = 0; i < R.N; i++) {
			const d = R.drops[i];
			d.y -= (fall * d.s) / bh;
			if (d.y < 0) d.y += 1;
			const o = i * 6;
			const x = focus.x + d.x * bw * 0.5;
			const z = focus.z + d.z * bd * 0.5;
			let dry = i >= n;
			for (let k = 0; !dry && k < R.dry.length; k++) {
				const q = R.dry[k];
				dry = x >= q[0] && x <= q[2] && z >= q[1] && z <= q[3];
			}
			if (dry) {
				arr.fill(0, o, o + 6);
				arr[o + 1] = arr[o + 4] = -1e4;
				continue;
			}
			const y = focus.y - 4 + d.y * bh;
			arr[o] = x;
			arr[o + 1] = y;
			arr[o + 2] = z;
			arr[o + 3] = x + 0.06;
			arr[o + 4] = y - 0.55 * d.s;
			arr[o + 5] = z + 0.02;
		}
		R.lines.geometry.attributes.position.needsUpdate = true;
	}

	// ---- per frame --------------------------------------------------------------------------------------------------------------------------------

	/** Light grammar, group levels, halos / pools / globes, telegraph preview, labels, rain. `telegraph` = animate the hand shadows; `focus` + `rain` = the
	 * rain streaks (plan.rain). */
	update(elapsed, delta, { camera, telegraph = false, flicker = true, focus = null, rain = 0 } = {}) {
		if (this.rain) this.updateRain(delta, camera, focus, rain);
		const ease = delta > 0 ? Math.min(1, delta / 0.6) : 1;
		const sources = this.sources;
		for (let i = 0; i < sources.length; i++) {
			const s = sources[i];
			const L = s.L;
			s.target = lightTarget(this.model, L, this.groupLevels); // group lights on / off by the slider, followers dim with their group
			s.level += (s.target - s.level) * ease;
			s.k = L.kind === 'human' && flicker ? flicker1f(elapsed, s.seed) : L.kind === 'wall' && flicker ? 1 + 0.06 * Math.sin((2 * Math.PI * elapsed) / 5.3) + 0.04 * (noise(elapsed * 0.4, s.seed) - 0.5) : 1;
			if (s.light) s.light.intensity = (s.entry?.base ?? s.base) * s.k * s.level * this.lightScale;
		}
		const cq = camera?.quaternion;
		const boost = 1 / SPRITE_ALPHA;
		if (this.halos.mesh && cq) {
			const { mesh, list } = this.halos;
			const wf = this.wallFade?.uniforms;
			if (wf && camera) this._cam.setFromMatrixPosition(camera.matrixWorld);
			for (let i = 0; i < list.length; i++) {
				const s = list[i];
				// a light on a wall-mounted model (L.fadeWithWall) goes with its wall when the camera wall fade dithers it out
				const vis = s.L.fadeWithWall && wf && camera ? wallFadeVisible(wf, this._cam, s.L.x, s.L.y, s.L.z) : 1;
				const size = s.level > 0.01 && vis > 0.02 ? s.L.glow * (0.55 + 0.45 * s.level) * vis : 0; // out = gone (a black sprite would still cut the scene)
				mesh.setMatrixAt(i, this._m4.compose(this._v.set(s.L.x, s.L.y, s.L.z), cq, this._s.set(size, size, size)));
				mesh.setColorAt(i, this._c.copy(s.color).multiplyScalar((s.L.glowGain ?? 0.9) * boost * s.level * s.shade * s.k * this.lightScale));
			}
			mesh.instanceMatrix.needsUpdate = true;
			mesh.instanceColor.needsUpdate = true;
		}
		if (this.pools.mesh) {
			const { mesh, list } = this.pools;
			for (let i = 0; i < list.length; i++) {
				const s = list[i];
				const r = s.level > 0.01 ? s.L.pool * 2 : 0;
				mesh.setMatrixAt(i, this._m4.compose(this._v.set(s.L.x, s.poolY, s.L.z), this._q.identity(), this._s.set(r, 1, r)));
				mesh.setColorAt(i, this._c.copy(s.color).multiplyScalar((s.L.poolGain ?? 0.16) * boost * s.level * s.shade * this.lightScale));
			}
			mesh.instanceMatrix.needsUpdate = true;
			mesh.instanceColor.needsUpdate = true;
		}
		// lamp globes: lit = HDR milk-white (bloom), out = a flat dull tint of the glass (unlit material: no rim, no dark core)
		const scale = Math.max(0.25, this.lightScale);
		for (let g = 0; g < this.globes.length; g++) {
			const gm = this.globes[g];
			for (let i = 0; i < gm.sources.length; i++) {
				const s = gm.sources[i];
				const level = s ? s.level : 1;
				gm.mesh.setColorAt(i, this._c.copy(s && !gm.own ? s.color : gm.color).multiplyScalar((0.07 + gm.gain * level) * gm.shade[i] * scale));
			}
			gm.mesh.instanceColor.needsUpdate = true;
		}
		// telegraph preview: each hand's soft shadow grows and darkens for ~1.6 s, then the hand strikes (a short milk-white flash) and lifts
		for (const t of this.telegraphs) {
			const r = t.m.r ?? 1.3;
			const on = telegraph && this.overlays.telegraph?.visible;
			if (!on) {
				t.shadow.scale.set(r * 2, 1, r * 1.4);
				t.shadow.material.opacity = 0.55;
				t.flash.visible = false;
				continue;
			}
			t.phase = (t.phase + delta) % 2.6;
			const grow = smooth(t.phase, 0, 1.6);
			t.shadow.scale.set(r * 2 * (0.55 + 0.45 * grow), 1, r * 1.4 * (0.55 + 0.45 * grow));
			t.shadow.material.opacity = t.phase < 1.8 ? 0.15 + 0.7 * grow : 0.85 * (1 - smooth(t.phase, 1.8, 2.4));
			const f = t.phase > 1.6 && t.phase < 2.0 ? 1 - Math.abs(t.phase - 1.75) / 0.25 : 0;
			t.flash.visible = f > 0;
			t.flash.scale.set(r * 2.6, 1, r * 2.6);
			t.flash.material.opacity = Math.max(0, f) * 0.8;
		}
		// hush-bell preview (the bells overlay on + the scene's preview toggle): a ripple runs out from each bell to its noise radius and fades
		for (const b of this.bellRipples ?? []) {
			const on = telegraph && this.overlays.bells?.visible;
			b.ripple.visible = !!on;
			if (!on) continue;
			b.phase = (b.phase + delta) % 2.4;
			const t = Math.min(1, b.phase / 1.8);
			const r = Math.max(0.05, (b.m.r ?? 6) * t);
			b.ripple.scale.set(r, 1, r);
			b.ripple.material.opacity = 0.85 * (1 - t);
		}
		if (camera) {
			this.labelSet?.update(camera);
			this.markerLabels?.update(camera);
		}
	}

	dispose() {
		for (const g of this.ownGeometries) g.dispose();
		for (const m of this.ownMaterials) m.dispose();
		for (const t of this.ownTextures) t.dispose();
		this.blockouts?.dispose();
		this.solo?.dispose();
		this.labelSet?.dispose();
		this.markerLabels?.dispose();
	}
}

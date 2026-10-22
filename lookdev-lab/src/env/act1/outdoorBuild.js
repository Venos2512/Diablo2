// ASHLAR · Act I base maps — the OUTDOOR builder (THREE side of env/act1/outdoor.js; scene scenes/act1Outdoor.js; docs HUONG_DAN.md §7l).
// From an evaluated world: the heightfield mesh (the scene's N-layer terrain material), water surfaces (the biome-mix pond approach: depth-tinted vertex
// colour + alpha, a slow ripple normal, capped specular; black for the fen), the cobble lane ribbons (the Dark Wood road tile), timber walkway decks (one
// walkable mesh: deck + ramps + posts), blockouts per asset id (env/act1/blockout.js, instanced, labelled by id), the existing GLBs and old kits that stand
// in ("kit tạm"), procedural placeholders (grass / reed / sedge cards, poppy sprigs, crows), the light grammar (human light: small, warm, 1/f flicker;
// Perfection light: still, even; ≤ 8 real point lights, the rest still glow sprites in the VFX layer), rain streaks and low mist sheets (placeholders),
// overlays (labels, encounters, rite sites, landmarks + sightlines, vignettes, NPC spots, exits) and the far frame (black water, far hills, the Gentle House
// silhouette N-GH). Everything is deterministic; swapping a blockout for a GLB is the asset def's `status: 'glb', model` (this file then fits the model).
import * as THREE from 'three';
import { loadKits } from '../outdoor.js';
import { loadRoadTile, loadGrassCards, grassCardGeometry } from '../terrain.js';
import { moteTexture, withDefaultAttributes } from '../dungeonDecor.js';
import { finalWeights, shaderMask } from '../biomeMix.js';
import { CATEGORY_COLORS, blockoutMaterial, blockoutShape, instancedBlockout, placementMatrix, labelAtlas, personMarker } from './blockout.js';
import { lightLevel, rng, smoothstep, fbm, clamp, WADE } from './outdoor.js';
import { MeadowBuild } from './meadowBuild.js';

/** Old kit key → samples.json id (the Blood-Moor / camp kits; env/mapModules.js has the full table). */
const KIT_IDS = {
	fence: 'kit-wooden-fence', kitchen: 'kit-camp-kitchen', storage: 'kit-camp-storage', training: 'kit-camp-training', crafts: 'kit-camp-crafts', lighting: 'kit-camp-lighting',
	banners: 'kit-camp-banners', seating: 'kit-camp-seating', shrine: 'kit-camp-shrine', animals: 'kit-camp-animals', clutter: 'kit-camp-clutter', stations: 'kit-camp-stations',
	rocks: 'kit-moor-rocks', mossy: 'kit-mossy-rocks', deadTrees: 'kit-dead-trees', shrubs: 'kit-shrubs',
};
const GRASS_CARDS = 'biome-darkwood-grass-cards';
const PLANT_ATLAS = 'biome-shore-plants'; // 2 × 2: 0 cattail · 1 tall reeds · 2 sedge · 3 horsetail
const NO_PICK = (o) => {
	o.userData.labNoPick = o.userData.labNoCollide = true;
	return o;
};
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

/** A plain image sample as a mipmapped repeating DataTexture (rows flipped: image top = v 1). */
async function loadPlain(app, id, colorSpace) {
	const img = await app.loader.loadImageData(id);
	const { width: w, height: h } = img;
	const data = new Uint8Array(w * h * 4);
	for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
	const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: id, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(8, app.backend.caps.maxAnisotropy || 4), colorSpace, needsUpdate: true });
	return tex;
}

export class OutdoorBuild {
	/** world = evaluatePlan(plan); group = the scene's world group; vfx = the VFX-layer group (not fogged); splat / library = the terrain's. */
	constructor({ app, world, group, vfx, settings, splat, library, sp }) {
		Object.assign(this, { app, world, group, vfx, settings, splat, library, sp });
		this.plan = world.plan;
		this.own = { geometries: [], materials: [], textures: [] };
		this.layers = {}; // named groups: blockouts, models, cards, decks, lanes, water, overlays …
		this.lights = []; // { def, light (PointLight), base }
		this.glows = null;
		this.windows = null;
		this.counts = { blockout: 0, glb: 0, kit: 0, procedural: 0 };
		this.moodId = null;
		this.flags = {};
		this.levels = { human: 1, perfection: 1, windows: 0.5 };
	}

	ownGeo(g) {
		this.own.geometries.push(g);
		return g;
	}

	ownMat(m) {
		this.own.materials.push(m);
		return m;
	}

	sub(name) {
		const g = new THREE.Group();
		g.name = name;
		this.group.add(g);
		this.layers[name] = g;
		return g;
	}

	// ---- loading --------------------------------------------------------------------------------------------------------------------------------

	/** Textures, ASHLAR GLBs (own copies) and old kits (the shared library cache) the plan needs. A missing one is logged and left out. */
	async load() {
		const { app, plan } = this;
		const defs = plan.assets;
		// a def's own model + the GLB parts of a composite (the far Gentle House: A18.4 + an A18.5 run round the A11.4 tower box)
		const glbIds = [...new Set(defs.flatMap((d) => [...(d.status === 'glb' && d.model ? [d.model] : []), ...(d.composite?.parts ?? []).map((p) => p.model)]))];
		const kitKeys = [...new Set(defs.filter((d) => d.status === 'kit' && d.model?.startsWith('kit:')).map((d) => d.model.slice(4).split('.')[0]))];
		const soft = (p, what) => p.catch((e) => (console.error(`Act I base map: ${what} failed to load; it is left out`, e), null));
		const [water, cards, plants, cobble, kits, ...glbs] = await Promise.all([
			soft(loadPlain(app, 'biome-darkwood-water-n', THREE.NoColorSpace), 'water normal'),
			soft(loadGrassCards(app, GRASS_CARDS), 'grass cards'),
			soft(loadGrassCards(app, PLANT_ATLAS), 'shore plant cards'),
			plan.paths?.some((p) => p.ribbon === 'cobble') ? soft(loadRoadTile(app, { id: 'darkwood-sty-green-cobble' }), 'cobble tile') : null,
			kitKeys.length ? loadKits(app, kitKeys.map((k) => [k, KIT_IDS[k]])) : {},
			...glbIds.map((id) => soft(app.loader.loadSample(id), `GLB ${id}`)),
		]);
		this.tex = { water, cards, plants, cobble };
		if (water) this.own.textures.push(water);
		this.kits = kits;
		this.glbs = Object.fromEntries(glbIds.map((id, i) => [id, glbs[i]]));
	}

	// ---- ground ---------------------------------------------------------------------------------------------------------------------------------

	/** The heightfield as one mesh (vertex grid of the world's height grid), normals from central differences. */
	buildTerrain(material) {
		const H = this.world.heights;
		const { nx, nz, x0, z0, cell, data } = H;
		const pos = new Float32Array(nx * nz * 3);
		const nor = new Float32Array(nx * nz * 3);
		const uv = new Float32Array(nx * nz * 2);
		const at = (i, j) => data[clamp(j, 0, nz - 1) * nx + clamp(i, 0, nx - 1)];
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				const k = j * nx + i;
				const x = x0 + i * cell;
				const z = z0 + j * cell;
				pos.set([x, data[k], z], k * 3);
				_v.set((at(i - 1, j) - at(i + 1, j)) / (2 * cell), 1, (at(i, j - 1) - at(i, j + 1)) / (2 * cell)).normalize();
				nor.set([_v.x, _v.y, _v.z], k * 3);
				uv.set([x / 4, -z / 4], k * 2);
			}
		}
		const index = new Uint32Array((nx - 1) * (nz - 1) * 6);
		let o = 0;
		for (let j = 0; j + 1 < nz; j++) {
			for (let i = 0; i + 1 < nx; i++) {
				const k = j * nx + i;
				index.set([k, k + nx, k + 1, k + 1, k + nx, k + nx + 1], o); // counter-clockwise from above (+y)
				o += 6;
			}
		}
		const g = this.ownGeo(new THREE.BufferGeometry());
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
		g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
		g.setIndex(new THREE.BufferAttribute(index, 1));
		g.computeBoundingBox();
		g.computeBoundingSphere();
		const mesh = new THREE.Mesh(g, material);
		mesh.name = `Terrain · ${this.plan.id} (${nx} × ${nz}, ${cell} m)`;
		mesh.receiveShadow = true;
		this.group.add(mesh);
		this.terrain = mesh;
		return mesh;
	}

	/** Water surfaces: a grid per body at its level, vertex colour = depth tint, vertex alpha = the depth fade into the bank; one shared material. */
	buildWater() {
		const W = this.world;
		if (!W.water.length) return;
		const group = this.sub('Water');
		const normalMap = this.tex.water;
		const mat = new THREE.MeshPhysicalMaterial({ name: 'Act I water (depth tint)', normalMap, normalScale: new THREE.Vector2(0.38, 0.38), roughness: 0.3, metalness: 0, ior: 1.33, specularIntensity: 0.08, envMapIntensity: 0.16, transparent: true, opacity: this.settings.waterOpacity ?? 0.92, vertexColors: true, depthWrite: true }); // writes depth: the post fog then measures to the water surface, as it does on the opaque far water (no fog step at the bounds)
		if (normalMap) normalMap.repeat.set(1, 1);
		let material = mat;
		const fx = this.app.backend.effects.createWaterSpecular?.(); // WebGPU: honour the capped F90 (a no-op on WebGL)
		if (fx) material = fx.apply(mat);
		this.waterMaterial = this.ownMat(material);
		if (material !== mat) this.ownMat(mat);
		const TINT = { fen: [[0.03, 0.04, 0.032], [0.004, 0.009, 0.008]], pond: [[0.045, 0.052, 0.03], [0.008, 0.02, 0.014]] };
		const [bx0, bz0, bx1, bz1] = W.bounds;
		for (const b of W.water) {
			const step = 0.5;
			const x0 = Math.max(bx0, b.box[0]);
			const z0 = Math.max(bz0, b.box[1]);
			const nx = Math.ceil((Math.min(bx1, b.box[2]) - x0) / step) + 1;
			const nz = Math.ceil((Math.min(bz1, b.box[3]) - z0) / step) + 1;
			const depth = new Float32Array(nx * nz);
			for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
				const x = x0 + i * step;
				const z = z0 + j * step;
				depth[j * nx + i] = (W.waterSignedAt ?? W.waterSigned)(b, x, z) <= b.reach ? b.level - W.height(x, z) : -1;
			}
			const map = new Int32Array(nx * nz).fill(-1);
			const pos = [];
			const col = [];
			const uv = [];
			const index = [];
			const [shallow, deep] = TINT[b.tint] ?? TINT.fen;
			const vert = (i, j) => {
				const k = j * nx + i;
				if (map[k] >= 0) return map[k];
				const x = x0 + i * step;
				const z = z0 + j * step;
				const d = depth[k];
				const a = smoothstep(0.0, 0.14, d) * (0.6 + 0.4 * smoothstep(0.02, 0.5, d));
				const t = smoothstep(0.03, 0.6, d);
				pos.push(x, b.level, z);
				col.push(shallow[0] + (deep[0] - shallow[0]) * t, shallow[1] + (deep[1] - shallow[1]) * t, shallow[2] + (deep[2] - shallow[2]) * t, a);
				uv.push(x / 6, -z / 6);
				map[k] = pos.length / 3 - 1;
				return map[k];
			};
			for (let j = 0; j + 1 < nz; j++) for (let i = 0; i + 1 < nx; i++) {
				const k = j * nx + i;
				if (depth[k] <= 0 && depth[k + 1] <= 0 && depth[k + nx] <= 0 && depth[k + nx + 1] <= 0) continue;
				const a = vert(i, j);
				const bb = vert(i + 1, j);
				const c = vert(i, j + 1);
				const d = vert(i + 1, j + 1);
				index.push(a, c, bb, bb, c, d);
			}
			if (!index.length) continue;
			const g = this.ownGeo(new THREE.BufferGeometry());
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
			g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
			g.setIndex(index);
			g.computeVertexNormals();
			const mesh = NO_PICK(new THREE.Mesh(g, this.waterMaterial));
			mesh.name = `Water · ${b.label ?? b.id}`;
			mesh.renderOrder = 2;
			group.add(mesh);
		}
	}

	/** Cobble lanes: a dense strip along the path textured with the repeating road tile (u across, v along, metres / tile), alpha at the wandering edges. */
	buildLanes() {
		const tile = this.tex.cobble;
		const W = this.world;
		const lanes = W.paths.filter((p) => p.ribbon === 'cobble');
		if (!tile || !lanes.length) return;
		const group = this.sub('Lanes');
		const tileW = tile.width / 300;
		const tileH = tile.height / 300;
		const material = this.ownMat(new THREE.MeshStandardMaterial({ name: 'Cobble lane (Dark Wood road tile, stand-in)', map: tile.map, normalMap: tile.normalMap, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.86, metalness: 0, color: new THREE.Color(0.8, 0.8, 0.76) }));
		for (const p of lanes) {
			const across = 15;
			const half = p.width / 2;
			const fade = 0.55;
			const pts = [];
			const total = p.length;
			for (let s = 0; s <= total + 1e-6; s += 0.3) pts.push(pointOn(p.pts, Math.min(s, total)));
			const pos = [];
			const uv = [];
			const col = [];
			const index = [];
			pts.forEach(([x, z, dx, dz, s], k) => {
				const nx = -dz;
				const nz = dx;
				for (let j = 0; j < across; j++) {
					const o = (j / (across - 1) - 0.5) * 2 * (half + fade);
					const px = x + nx * o;
					const pz = z + nz * o;
					const edge = half + (fbm(px * 0.6 + 3.3, pz * 0.6 + 1.7, 1) - 0.5) * 0.9;
					const a = smoothstep(edge + fade, edge - fade, Math.abs(o));
					pos.push(px, W.height(px, pz) + 0.03, pz);
					uv.push(o / tileW, s / tileH);
					col.push(1, 1, 1, a);
					if (k && j) {
						const c = k * across + j;
						index.push(c - across - 1, c - across, c - 1, c - across, c, c - 1);
					}
				}
			});
			const g = this.ownGeo(new THREE.BufferGeometry());
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
			g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
			g.setIndex(index);
			g.computeVertexNormals();
			const mesh = NO_PICK(new THREE.Mesh(g, material));
			mesh.name = `Lane · ${p.label ?? p.id}`;
			mesh.renderOrder = 1;
			mesh.receiveShadow = true;
			group.add(mesh);
		}
	}

	/**
	 * Walkway decks + ramps as ONE walkable mesh (the hero's floor over the water), vertex-coloured planks (structure colour); the posts are a second mesh out
	 * of the collision: they stand proud of the deck, and Play's nav would close a deck cell near one for good.
	 */
	buildDecks() {
		const W = this.world;
		if (!W.decks.length) return;
		const parts = [];
		const postParts = [];
		const base = new THREE.Color(CATEGORY_COLORS.structure);
		const r = rng(77);
		const add = (g, m, tone, list = parts) => {
			const geo = g.toNonIndexed().applyMatrix4(m);
			g.dispose();
			const n = geo.attributes.position.count;
			const c = base.clone().multiplyScalar(tone);
			const col = new Float32Array(n * 3);
			for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
			geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
			list.push(geo);
		};
		const hidden = new Set(W.paths.filter((p) => p.kind === 'walkway' && p.hidden).map((p) => p.id));
		const hiddenParts = [];
		for (const s of W.decks) {
			const dx = s.bx - s.ax;
			const dz = s.bz - s.az;
			const len = Math.hypot(dx, dz);
			if (len < 0.05) continue;
			const yaw = Math.atan2(-dz, dx);
			const pitch = Math.atan2(s.yb - s.ya, len);
			const L = Math.hypot(len, s.yb - s.ya);
			const thick = 0.14;
			const mid = new THREE.Vector3((s.ax + s.bx) / 2, (s.ya + s.yb) / 2 - thick / 2, (s.az + s.bz) / 2);
			const m = new THREE.Matrix4().makeTranslation(mid.x, mid.y, mid.z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationZ(pitch));
			const hide = hidden.has(s.path); // a model's own planks are the visible deck (the GLB night dock): walk surface only, no posts
			add(new THREE.BoxGeometry(L + (s.kind === 'deck' ? 0.1 : 0), thick, s.w), m, 0.95 + r() * 0.15, hide ? hiddenParts : parts);
			if (s.kind !== 'deck' || hide) continue;
			const nx = -dz / len;
			const nz = dx / len;
			for (const t of [0, 1]) for (const side of [-1, 1]) {
				const px = s.ax + dx * t + nx * side * (s.w / 2 - 0.08);
				const pz = s.az + dz * t + nz * side * (s.w / 2 - 0.08);
				const top = (t ? s.yb : s.ya) + 0.55; // posts stand proud of the deck (rope rail height)
				const bottom = W.height(px, pz) - 0.3;
				const h = top - bottom;
				add(new THREE.CylinderGeometry(0.08, 0.1, h, 6), new THREE.Matrix4().makeTranslation(px, bottom + h / 2, pz), 0.72, postParts);
			}
		}
		const g = this.ownGeo(withDefaultAttributes(mergeAll(parts)));
		const mesh = new THREE.Mesh(g, this.blockoutMaterial());
		mesh.name = 'Walkways · A01.2 Raised wooden walkway (blockout, walkable)';
		mesh.castShadow = mesh.receiveShadow = true;
		mesh.userData.assetId = 'A01.2';
		const group = this.sub('Decks');
		group.add(mesh);
		this.decks = mesh;
		if (hiddenParts.length) {
			// walkable but not drawn (layer 31 + labNoView like the walk floor): the model above it is what you see
			const under = new THREE.Mesh(this.ownGeo(withDefaultAttributes(mergeAll(hiddenParts))), this.ownMat(new THREE.MeshBasicMaterial({ name: 'Walkway under a model deck (collision only)', visible: false })));
			under.name = 'Walkways under a model deck (hidden, walkable)';
			under.layers.set(31);
			under.userData.labNoView = true;
			group.add(under);
		}
		if (postParts.length) {
			const posts = new THREE.Mesh(this.ownGeo(withDefaultAttributes(mergeAll(postParts))), this.blockoutMaterial());
			posts.name = 'Walkway posts (no collision)';
			posts.castShadow = posts.receiveShadow = true;
			posts.userData.assetId = 'A01.2';
			posts.userData.labNoCollide = true;
			group.add(posts);
		}
	}

	/**
	 * Never swim: the world's deep-water walls (W.deepWalls: the WADE.depth contour of every water body, the far water over a sunken edge, the guards and caps
	 * of walkways over water) as an invisible collision mesh: two faces WADE.thick apart per segment, from the bed to WADE.top above the water (a hero on a
	 * deck or a dike crest stands above it). Hidden (material.visible = false), on layer 31 (the lab's picking skips it), out of the cut-away and views
	 * (labNoView); Play's nav and the character controller collide with it like any wall.
	 */
	buildDeepWater() {
		const walls = this.world.deepWalls ?? [];
		if (!walls.length) return;
		const pos = new Float32Array(walls.length * 2 * 6 * 3);
		let o = 0;
		const quad = (ax, az, bx, bz, y0, y1) => {
			for (const [x, y, z] of [[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y0, az], [bx, y1, bz], [ax, y1, az]]) {
				pos[o++] = x;
				pos[o++] = y;
				pos[o++] = z;
			}
		};
		for (const w of walls) {
			const len = Math.hypot(w.bx - w.ax, w.bz - w.az) || 1;
			const h = (w.thick ?? WADE.thick) / 2;
			const nx = (-(w.bz - w.az) / len) * h;
			const nz = ((w.bx - w.ax) / len) * h;
			quad(w.ax + nx, w.az + nz, w.bx + nx, w.bz + nz, w.y0, w.y1);
			quad(w.bx - nx, w.bz - nz, w.ax - nx, w.az - nz, w.y0, w.y1);
		}
		const g = this.ownGeo(new THREE.BufferGeometry());
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		g.computeVertexNormals();
		withDefaultAttributes(g);
		g.computeBoundingSphere();
		const mesh = new THREE.Mesh(g, this.ownMat(new THREE.MeshBasicMaterial({ name: 'Deep-water walls (collision only)', visible: false })));
		mesh.name = `Deep-water walls · never swim (${walls.length} segments, collision only)`;
		mesh.layers.set(31);
		mesh.userData.labNoView = true;
		mesh.frustumCulled = false;
		this.group.add(mesh);
		this.deepWater = mesh;
	}

	/**
	 * Play's walk floor: the terrain grid cut to the world's floor field (W.floorField ≥ 0 — no floor in water deeper than WADE.depth, under walkways,
	 * within the hero's radius of a colliding structure; triangles clipped along the field's zero line), as invisible collision-only meshes in 64 m tiles
	 * (the collision skips a mesh over 400 m across). The visible terrain leaves the collision (labNoCollide): Play's nav and the walk stand on this floor.
	 * The colliding structures (W.blockers — footprints, or a def's `blockers` rects) stand in as wall-only boxes (no top: never a floor), from 0.5 m under
	 * their base to their top, so the free walk meets the same walls as walkGrid.
	 */
	buildWalkFloor() {
		const W = this.world;
		const F = W.floorField;
		if (!F || !this.terrain) return;
		const { nx, nz, x0, z0, cell, data } = W.heights;
		this.terrain.userData.labNoCollide = true;
		const material = this.ownMat(new THREE.MeshBasicMaterial({ name: 'Walk floor (collision only)', visible: false }));
		const group = new THREE.Group();
		const T = 128;
		let tris = 0;
		for (let tj = 0; tj < nz - 1; tj += T) {
			for (let ti = 0; ti < nx - 1; ti += T) {
				const i1 = Math.min(ti + T, nx - 1);
				const j1 = Math.min(tj + T, nz - 1);
				const w = i1 - ti + 1;
				const pos = [];
				for (let j = tj; j <= j1; j++) for (let i = ti; i <= i1; i++) pos.push(x0 + i * cell, data[j * nx + i], z0 + j * cell);
				const index = [];
				const local = (i, j) => (j - tj) * w + (i - ti);
				// one triangle of buildTerrain's split, clipped to F ≥ 0 (3 or 4 corners, fanned; the winding stays counter-clockwise from above)
				const tri = (ia, ja, ib, jb, ic, jc) => {
					const fa = F[ja * nx + ia];
					const fb = F[jb * nx + ib];
					const fc = F[jc * nx + ic];
					if (fa >= 0 && fb >= 0 && fc >= 0) {
						index.push(local(ia, ja), local(ib, jb), local(ic, jc));
						return;
					}
					if (fa < 0 && fb < 0 && fc < 0) return;
					const P = [[ia, ja, fa], [ib, jb, fb], [ic, jc, fc]];
					const out = [];
					for (let e = 0; e < 3; e++) {
						const [pi, pj, fp] = P[e];
						const [qi, qj, fq] = P[(e + 1) % 3];
						if (fp >= 0) out.push(local(pi, pj));
						if (fp >= 0 !== fq >= 0) {
							const t = fp / (fp - fq);
							out.push(pos.length / 3);
							pos.push(x0 + (pi + (qi - pi) * t) * cell, data[pj * nx + pi] + (data[qj * nx + qi] - data[pj * nx + pi]) * t, z0 + (pj + (qj - pj) * t) * cell);
						}
					}
					for (let m = 1; m + 1 < out.length; m++) index.push(out[0], out[m], out[m + 1]);
				};
				for (let j = tj; j < j1; j++) {
					for (let i = ti; i < i1; i++) {
						tri(i, j, i, j + 1, i + 1, j);
						tri(i + 1, j, i, j + 1, i + 1, j + 1);
					}
				}
				if (!index.length) continue;
				const g = this.ownGeo(new THREE.BufferGeometry());
				g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
				g.setIndex(index);
				withDefaultAttributes(g);
				g.computeBoundingSphere();
				const mesh = new THREE.Mesh(g, material);
				mesh.name = `Walk floor ${ti / T}·${tj / T} (collision only)`;
				mesh.layers.set(31);
				mesh.userData.labNoView = true;
				mesh.frustumCulled = false;
				group.add(mesh);
				tris += index.length / 3;
			}
		}
		const tiles = group.children.length;
		const byTile = new Map();
		for (const b of W.blockers) {
			const key = `${Math.floor(b.x / 64)},${Math.floor(b.z / 64)}`;
			if (!byTile.has(key)) byTile.set(key, []);
			byTile.get(key).push(b);
		}
		for (const [key, list] of byTile) {
			const pos = [];
			for (const b of list) {
				const p = b.pts;
				const y0 = b.y0 - 0.5;
				const y1 = b.y1;
				const ccw = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]) > 0; // x-z winding
				for (let e = 0; e < p.length; e++) {
					const [ax, az] = p[ccw ? (e + 1) % p.length : e];
					const [bx, bz] = p[ccw ? e : (e + 1) % p.length];
					pos.push(ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az);
				}
			}
			const g = this.ownGeo(new THREE.BufferGeometry());
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.computeVertexNormals();
			withDefaultAttributes(g);
			g.computeBoundingSphere();
			const mesh = new THREE.Mesh(g, material);
			mesh.name = `Structure walls ${key} (${list.length} blockers, collision only)`;
			mesh.layers.set(31);
			mesh.userData.labNoView = true;
			mesh.frustumCulled = false;
			group.add(mesh);
		}
		group.name = `Walk floor · terrain with holes (${tris} triangles, ${tiles} tiles) + ${W.blockers.length} structure boxes (collision only)`;
		this.group.add(group);
		this.walkFloor = group;
	}

	blockoutMaterial() {
		if (!this._blockMat) {
			this._blockMat = this.ownMat(blockoutMaterial());
			this._blockMat.color.setScalar(0.78); // muted: the category colours sit in the overcast light like the ground does
		}
		return this._blockMat;
	}

	// ---- assets: blockouts, GLBs, kits, procedural ------------------------------------------------------------------------------------------------

	/** Every placed item by its def's status: blockout → instanced shape; glb / kit → instanced model; procedural → its builder. */
	buildAssets() {
		const W = this.world;
		const byAsset = new Map();
		for (const s of W.structures) {
			if (s.deck) continue;
			if (!byAsset.has(s.asset)) byAsset.set(s.asset, []);
			byAsset.get(s.asset).push(s);
		}
		const blockouts = this.sub('Blockouts');
		const models = this.sub('Models (glb · kit tạm)');
		// out of the walk collision (labSolid stays for the cut-away): a structure's top would be a floor to Play's nav (a low wall up a slope is a path
		// over it); buildWalkFloor stands W.blockers in as wall-only boxes
		blockouts.userData.labNoCollide = models.userData.labNoCollide = true;
		this.shapeCache ??= new Map();
		this.anchorsWorld = [];
		for (const [id, items] of byAsset) {
			const def = W.defs.get(id);
			if (def.status === 'procedural') continue;
			let mesh = null;
			if (def.status === 'glb' || def.status === 'kit') mesh = this.modelInstances(def, items);
			if (!mesh) {
				mesh = instancedBlockout(def, items, this.blockoutMaterial(), this.shapeCache);
				if (def.status !== 'blockout') mesh.name += ' (model missing: blockout)';
				blockouts.add(mesh);
				this.counts.blockout += items.length;
				for (const a of mesh.userData.anchors) for (const it of items) this.anchorsWorld.push({ asset: id, kind: a.kind, size: a.size, p: new THREE.Vector3(...a.p).applyMatrix4(placementMatrix(it)), n: new THREE.Vector3(...a.n).applyQuaternion(_q.setFromAxisAngle(UP, it.yaw)), item: it });
			} else {
				models.add(mesh);
				this.counts[def.status] += items.length;
				(this.modelShown ??= new Set()).add(id);
				// the model's own feature points (def.anchors, def / GLB frame): jar candles, lamps, windows — the glows sit on the real model
				for (const a of def.anchors ?? []) for (const it of items) this.anchorsWorld.push({ asset: id, kind: a.kind, size: a.size, p: new THREE.Vector3(...a.p).applyMatrix4(placementMatrix(it)), n: new THREE.Vector3(...(a.n ?? [0, 0, 1])).applyQuaternion(_q.setFromAxisAngle(UP, it.yaw)), item: it });
			}
		}
		this.buildProcedural(byAsset);
	}

	/** The loaded mesh of a GLB sample (its first mesh; the act1 extras are one mesh each), or null. */
	glbMesh(id) {
		let mesh = null;
		this.glbs?.[id]?.scene.traverse((o) => {
			if (o.isMesh && !mesh) mesh = o;
		});
		return mesh;
	}

	/**
	 * A composite def at one placement (the far Gentle House): its GLB parts ({ model, x, y, z, yaw (deg), scale } in the def frame), one instanced mesh per
	 * model, plus the leftover blockout pieces that have no model yet (comp.shape, e.g. the A11.4 gate tower box). Far away: no shadows, no collision.
	 */
	compositeMeshes(it, comp) {
		const out = [];
		const byModel = new Map();
		for (const p of comp.parts) {
			if (!byModel.has(p.model)) byModel.set(p.model, []);
			byModel.get(p.model).push(p);
		}
		const base = placementMatrix(it, new THREE.Matrix4());
		for (const [id, parts] of byModel) {
			const src = this.glbMesh(id);
			this.glbs[id].scene.updateMatrixWorld(true);
			this.own.geometries.push(src.geometry);
			for (const m of [].concat(src.material)) {
				this.own.materials.push(m);
				for (const t of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) if (m[t]) this.own.textures.push(m[t]);
			}
			const inst = new THREE.InstancedMesh(src.geometry, src.material, parts.length);
			parts.forEach((p, i) => {
				const local = placementMatrix({ x: p.x, y: p.y ?? 0, z: p.z, yaw: ((p.yaw ?? 0) * Math.PI) / 180, scale: [p.scale ?? 1, p.scale ?? 1, p.scale ?? 1] }, new THREE.Matrix4());
				inst.setMatrixAt(i, base.clone().multiply(local).multiply(src.matrixWorld));
			});
			inst.instanceMatrix.needsUpdate = true;
			inst.computeBoundingSphere();
			inst.name = `GLB · ${it.def.id} · ${id} ×${parts.length} (far)`;
			Object.assign(inst.userData, { assetId: it.def.id, model: id, labNoCollide: true });
			out.push(inst);
		}
		if (comp.shape) {
			const rest = instancedBlockout({ ...it.def, id: `${it.def.id} · ${comp.label ?? 'no model yet'}`, shape: comp.shape }, [it], this.blockoutMaterial(), this.shapeCache);
			rest.name += ' (far)';
			delete rest.userData.labSolid;
			out.push(rest);
		}
		return out;
	}

	/** Anchors of a placed def: its model's (def.anchors) when the model stands in the map, else its blockout shape's. */
	anchorsOf(def, modelShown) {
		return modelShown && def.anchors ? def.anchors : (this.shapeFor(def)?.anchors ?? []);
	}

	/** A GLB / kit piece instanced at the placements (native size, or fitted to the def size); null when the model did not load. */
	modelInstances(def, items) {
		if (globalThis.__act1ForceBlockout?.has?.(def.id)) return null; // A/B (perf, before / after shots): these ids draw their blockout fallback
		let geometry;
		let material;
		let local = new THREE.Matrix4();
		if (def.status === 'glb') {
			const gltf = this.glbs[def.model];
			const mesh = this.glbMesh(def.model);
			if (!mesh) return null;
			gltf.scene.updateMatrixWorld(true);
			geometry = mesh.geometry;
			material = mesh.material;
			local = mesh.matrixWorld.clone();
			this.own.geometries.push(geometry);
			for (const m of [].concat(material)) {
				this.own.materials.push(m);
				for (const t of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) if (m[t]) this.own.textures.push(m[t]);
			}
		} else {
			const [kitKey, piece] = def.model.slice(4).split('.');
			const mesh = this.kits[kitKey]?.[piece];
			if (!mesh) {
				console.warn(`Act I base map: kit piece ${def.model} not found; ${def.id} stays a blockout`);
				return null;
			}
			geometry = mesh.geometry; // shared with the kit library (never disposed here)
			material = mesh.material;
		}
		geometry.computeBoundingBox();
		if (def.fit === 'size') {
			const b = geometry.boundingBox;
			const sx = def.size[0] / Math.max(1e-3, b.max.x - b.min.x);
			const sy = def.size[1] / Math.max(1e-3, b.max.y - b.min.y);
			const sz = def.size[2] / Math.max(1e-3, b.max.z - b.min.z);
			local = new THREE.Matrix4().makeScale(sx, sy, sz).multiply(local);
		}
		const inst = new THREE.InstancedMesh(geometry, material, items.length);
		items.forEach((it, i) => {
			// a native-size model ignores the def size, keeps the placement's own scale
			inst.setMatrixAt(i, placementMatrix(it, _m).multiply(local));
		});
		inst.instanceMatrix.needsUpdate = true;
		inst.computeBoundingSphere();
		inst.castShadow = inst.receiveShadow = true;
		inst.name = `${def.status === 'kit' ? 'Kit tạm' : 'GLB'} · ${def.id} · ${def.name}`;
		Object.assign(inst.userData, { assetId: def.id, assetName: def.name, status: def.status, model: def.model, instances: items.map((it) => ({ uid: it.uid, name: it.name })) });
		if (def.collide !== false) inst.userData.labSolid = true;
		else inst.userData.labNoCollide = true;
		return inst;
	}

	/** Procedural placeholders: grass / reed / sedge cards (atlases), poppy sprigs (the accent), crows. */
	buildProcedural(byAsset) {
		const W = this.world;
		const group = this.sub('Procedural (cards, sprigs, crows)');
		const r = rng(9091);
		const cards = { grass: [], reeds: [], sedge: [] };
		for (const [id, items] of byAsset) {
			const def = W.defs.get(id);
			if (def.status !== 'procedural') continue;
			this.counts.procedural += items.length;
			if (def.procedural in cards) cards[def.procedural].push(...items);
			else if (def.procedural === 'poppy') this.poppies = this.smallInstances(group, def, items, sprigGeometry(), '#b3262a');
			else if (def.procedural === 'crow') this.crows = this.smallInstances(group, def, items, crowGeometry(), '#17151a');
		}
		// cards: grass on the grass layers only (the splat's own blend), reeds in the shallows, sedge on the banks
		const wind = (this.windGrass ??= this.app.backend.effects.create('wind', { strength: 0.22, height: 1, frequency: 1.7 }));
		const mk = (name, tex, tint) => {
			if (!tex) return null;
			const base = this.ownMat(new THREE.MeshStandardMaterial({ name, map: tex, alphaTest: 0.45, roughness: 0.88, metalness: 0, vertexColors: true, color: tint }));
			return this.ownMat(wind.apply(base));
		};
		const grassMat = mk('Grass cards (Dark Wood, A03.1 stand-in)', this.tex.cards, new THREE.Color(0.55, 0.66, 0.5));
		const plantMat = mk('Reed / sedge cards (shore plants, A03.2 / A03.3 stand-in)', this.tex.plants, new THREE.Color(0.58, 0.64, 0.52));
		const layerIdx = W.plan.layers.map((l, i) => (['DW_grass', 'DW_dense', 'DW_sparse', 'BIO02_meadow'].includes(l.id) ? i : -1)).filter((i) => i >= 0);
		const sample = new Float32Array(8);
		const mask = new Float32Array(8);
		const weights = new Float32Array(8);
		const sp = this.sp;
		const grassWeight = (x, z) => {
			if (!this.splat || !layerIdx.length) return 1;
			this.splat.sample(x, z, sample);
			mask[0] = 1;
			for (let k = 1; k < W.layers.length; k++) mask[k] = shaderMask(sample[k - 1], sp);
			finalWeights(mask, W.layers.length, weights);
			return layerIdx.reduce((a, i) => a + weights[i], 0);
		};
		const lists = [[], [], [], []];
		const density = this.settings.grassDensity ?? 1;
		const tuft = (cell, x, z, h, w, yaw, tone, list) => {
			const y = W.height(x, z);
			list.push({ cell, x, y: y - 0.03, z, h, w, yaw, tone });
		};
		const grass = [[], [], [], []];
		for (const it of cards.grass) {
			const gw = grassWeight(it.x, it.z);
			if (gw < 0.3 || r() > density) continue;
			const n = 3 + Math.floor(r() * 4);
			for (let k = 0; k < n; k++) {
				const a = r() * Math.PI * 2;
				const d = Math.sqrt(r()) * 0.45 * it.scale[0];
				const h = (0.28 + r() * 0.34) * it.scale[1] * (0.7 + 0.3 * smoothstep(0.3, 0.8, gw));
				tuft(Math.floor(r() * 4), it.x + Math.cos(a) * d, it.z + Math.sin(a) * d, h, h * (0.9 + r() * 0.4), r() * Math.PI, 0.55 + r() * 0.3, grass[Math.floor(r() * 4)]);
			}
		}
		for (const it of cards.reeds) {
			const n = 3 + Math.floor(r() * 4);
			for (let k = 0; k < n; k++) {
				const a = r() * Math.PI * 2;
				const d = Math.sqrt(r()) * 0.5 * it.scale[0];
				const cell = r() < 0.55 ? 1 : 0;
				const h = (1.05 + r() * 0.75) * it.scale[1];
				tuft(cell, it.x + Math.cos(a) * d, it.z + Math.sin(a) * d, h, h * 0.55, r() * Math.PI, 0.5 + r() * 0.3, lists[cell]);
			}
		}
		for (const it of cards.sedge) {
			const n = 2 + Math.floor(r() * 3);
			for (let k = 0; k < n; k++) {
				const a = r() * Math.PI * 2;
				const d = Math.sqrt(r()) * 0.4 * it.scale[0];
				const cell = r() < 0.6 ? 2 : 3;
				const h = (0.45 + r() * 0.45) * it.scale[1];
				tuft(cell, it.x + Math.cos(a) * d, it.z + Math.sin(a) * d, h, h * 0.9, r() * Math.PI, 0.55 + r() * 0.3, lists[cell]);
			}
		}
		this.cardMeshes = [];
		const emit = (name, material, perCell) => {
			if (!material) return;
			perCell.forEach((list, cell) => {
				if (!list.length) return;
				const geo = this.ownGeo(rootShadedCard(cell));
				const mesh = new THREE.InstancedMesh(geo, material, list.length);
				const dummy = new THREE.Object3D();
				list.forEach((t, i) => {
					dummy.position.set(t.x, t.y, t.z);
					dummy.rotation.set(0, t.yaw, 0);
					dummy.scale.set(t.w, t.h, t.w);
					dummy.updateMatrix();
					mesh.setMatrixAt(i, dummy.matrix);
					mesh.setColorAt(i, _c.setRGB(t.tone, t.tone * 1.04, t.tone * 0.9));
				});
				mesh.instanceMatrix.needsUpdate = true;
				if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
				mesh.computeBoundingSphere();
				mesh.name = `${name} · cell ${cell} (${list.length})`;
				mesh.userData.labNoPick = true;
				group.add(mesh);
				this.cardMeshes.push(mesh);
			});
		};
		emit('Grass cards', grassMat, grass);
		emit('Reed / sedge cards', plantMat, lists);
		this.cardGroup = group;
		// plans with a field, sleep smoke or a land apron beyond the bounds (env/act1/meadow*.js; first: the Poppy Reach)
		if (W.plan.field || W.plan.smoke || W.plan.far?.apron) this.meadow = new MeadowBuild(this).build();
	}

	/** A few small procedural pieces (sprigs, crows) as one instanced mesh with an explicit colour. */
	smallInstances(group, def, items, geometry, color) {
		const mat = this.ownMat(new THREE.MeshStandardMaterial({ name: `${def.id} · ${def.name}`, color: new THREE.Color(color), roughness: 0.85, metalness: 0, flatShading: true }));
		const mesh = new THREE.InstancedMesh(this.ownGeo(geometry), mat, items.length);
		items.forEach((it, i) => mesh.setMatrixAt(i, placementMatrix(it)));
		mesh.instanceMatrix.needsUpdate = true;
		mesh.computeBoundingSphere();
		mesh.name = `Procedural · ${def.id} · ${def.name}`;
		Object.assign(mesh.userData, { assetId: def.id, assetName: def.name, status: def.status, labNoCollide: true });
		mesh.userData.items = items;
		group.add(mesh);
		return mesh;
	}

	// ---- light grammar --------------------------------------------------------------------------------------------------------------------------------

	/**
	 * Real point lights (the plan's `real` lights, ≤ 8, unshadowed, finite range) + still glow sprites (an instanced billboard in the VFX layer, so a far window
	 * reads through the fog): the plan's glows, the cottages' windows, the jar candles of the graves. Emissive window panes stay in the scene (they fog).
	 */
	buildLights() {
		const W = this.world;
		const glows = [];
		for (const l of W.lights) {
			let p = new THREE.Vector3(l.x, l.yWorld, l.z);
			if (l.anchor) {
				const item = W.far?.items.find((f) => f.asset === l.anchor) ?? W.structures.find((s) => s.asset === l.anchor);
				const a = item && this.anchorsOf(item.def, this.modelShown?.has(item.asset)).find((q) => q.kind === 'window');
				if (a) p = new THREE.Vector3(...a.p).applyMatrix4(placementMatrix(item));
			}
			if (l.real && l.intensity > 0) {
				const light = new THREE.PointLight(new THREE.Color(l.color), l.intensity, l.range ?? 8, 2);
				light.name = `${l.kind === 'human' ? 'Human light' : l.kind === 'perfection' ? 'Perfection light' : 'Wall light'} · ${l.label ?? l.id}`;
				light.position.copy(p);
				this.group.add(light);
				this.lights.push({ def: l, light, base: l.intensity });
			}
			if (l.glow > 0) glows.push({ def: l, p, size: l.glow, color: new THREE.Color(l.color), kind: l.kind });
		}
		const winGeo = this.ownGeo(new THREE.PlaneGeometry(0.46, 0.4));
		const panes = [];
		for (const a of this.anchorsWorld) {
			if (a.kind === 'window') {
				glows.push({ p: a.p.clone().addScaledVector(a.n, 0.12), size: 0.9, color: new THREE.Color('#e0a050'), kind: 'human', window: true, seed: a.item.uid });
				panes.push(a);
			} else if (a.kind === 'jar') glows.push({ p: a.p.clone(), size: 0.16, color: new THREE.Color('#e8a858'), kind: 'human', jar: true, seed: a.item.uid * 5 + glows.length });
		}
		// emissive window panes (in the scene: they fog like the walls round them)
		if (panes.length) {
			this.windowMat = this.ownMat(new THREE.MeshBasicMaterial({ name: 'Window panes (amber, human light)', color: new THREE.Color('#e0a050'), toneMapped: false }));
			const mesh = new THREE.InstancedMesh(winGeo, this.windowMat, panes.length);
			panes.forEach((a, i) => {
				_q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), a.n);
				mesh.setMatrixAt(i, _m.compose(a.p.clone().addScaledVector(a.n, 0.02), _q, new THREE.Vector3(1, 1, 1)));
			});
			mesh.instanceMatrix.needsUpdate = true;
			mesh.computeBoundingSphere();
			mesh.name = 'Window panes';
			NO_PICK(mesh);
			this.group.add(mesh);
			this.windows = mesh;
		}
		if (!glows.length) return;
		this.glowTexture = moteTexture();
		this.own.textures.push(this.glowTexture);
		const mat = this.ownMat(new THREE.MeshBasicMaterial({ name: 'Light glows (still sprites)', map: this.glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
		const mesh = new THREE.InstancedMesh(this.ownGeo(new THREE.PlaneGeometry(1, 1)), mat, glows.length);
		mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(glows.length * 3), 3);
		mesh.frustumCulled = false;
		mesh.name = 'Light glows';
		NO_PICK(mesh);
		this.vfx.add(mesh);
		this.glows = { mesh, list: glows };
	}

	shapeFor(def) {
		this.shapeCache ??= new Map();
		if (!this.shapeCache.has(def.id)) this.shapeCache.set(def.id, blockoutShape(def));
		return this.shapeCache.get(def.id);
	}

	// ---- weather placeholders ---------------------------------------------------------------------------------------------------------------------------

	/** Rain: line streaks in a box that follows the view (VFX layer); mist: a few big soft sheets lying in the low ground (they drift). */
	buildWeather() {
		const N = 2200;
		const pos = new Float32Array(N * 6);
		const g = this.ownGeo(new THREE.BufferGeometry());
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		withDefaultAttributes(g);
		this.rainMat = this.ownMat(new THREE.LineBasicMaterial({ name: 'Rain streaks (placeholder)', color: new THREE.Color(0.62, 0.68, 0.74), transparent: true, opacity: 0.3, depthWrite: false, toneMapped: false }));
		const lines = new THREE.LineSegments(g, this.rainMat);
		lines.frustumCulled = false;
		lines.name = 'Rain (placeholder)';
		NO_PICK(lines);
		this.vfx.add(lines);
		const r = rng(5150);
		this.rain = { lines, N, drops: Array.from({ length: N }, () => ({ x: r() * 2 - 1, y: r(), z: r() * 2 - 1, s: 0.85 + r() * 0.3 })), box: [46, 20, 46] };
		// mist sheets over the low ground
		const W = this.world;
		const tex = moteTexture(); // white with a soft radial alpha: the sheet's colour is the material's
		this.own.textures.push(tex);
		this.mistMat = this.ownMat(new THREE.MeshBasicMaterial({ name: 'Low mist (placeholder sheets)', map: tex, color: new THREE.Color('#8e978c'), transparent: true, opacity: 0.06, depthWrite: false }));
		const sheetGeo = this.ownGeo(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
		const group = this.sub('Mist (placeholder)');
		const rm = rng(808);
		const sheets = [];
		const [x0, z0, x1, z1] = W.bounds;
		for (let tries = 0; sheets.length < 26 && tries < 600; tries++) {
			const x = x0 + 8 + rm() * (x1 - x0 - 16);
			const z = z0 + 8 + rm() * (z1 - z0 - 16);
			const h = W.height(x, z);
			if (h > 3.5 && rm() > 0.25) continue; // hollows and low ground first (LD: mist in the hollows until noon)
			const s = 14 + rm() * 18;
			const base = new THREE.Vector3(x, Math.max(h, W.waterAt(x, z)?.level ?? h) + 0.7 + rm() * 1.1, z);
			const scale = new THREE.Vector3(s, 1, s * (0.6 + rm() * 0.5));
			const turn = new THREE.Quaternion().setFromAxisAngle(_v.set(0, 1, 0), rm() * Math.PI);
			sheets.push({ base, scale, turn, phase: rm() * 10 });
		}
		// one instanced draw for all the sheets (they drift: update() writes their matrices)
		const inst = NO_PICK(new THREE.InstancedMesh(sheetGeo, this.mistMat, Math.max(1, sheets.length)));
		inst.count = sheets.length;
		inst.name = `Low mist (${sheets.length} sheets, instanced)`;
		inst.renderOrder = 4;
		inst.frustumCulled = false;
		group.add(inst);
		this.mist = { group, sheets, inst };
		this.driftMist(0);
	}

	/** Mist sheets at time t: each drifts a few metres round its base. */
	driftMist(t) {
		const { sheets, inst } = this.mist;
		for (let i = 0; i < sheets.length; i++) {
			const s = sheets[i];
			_v.set(s.base.x + Math.sin(t * 0.03 + s.phase) * 3, s.base.y, s.base.z + Math.cos(t * 0.025 + s.phase * 1.3) * 2);
			inst.setMatrixAt(i, _m.compose(_v, s.turn, s.scale));
		}
		inst.instanceMatrix.needsUpdate = true;
	}

	// ---- overlays ---------------------------------------------------------------------------------------------------------------------------------------

	/** Labels, encounters, rite sites, landmarks + sightlines, vignettes, NPC spots, exits: one group each (off by default; the scene toggles them). */
	buildOverlays() {
		const W = this.world;
		const O = (this.overlays = {});
		const mat = (color, o = {}) => this.ownMat(new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: o.opacity ?? 0.85, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, ...o.extra }));
		const group = (name) => {
			const g = NO_PICK(new THREE.Group());
			g.name = `Overlay · ${name}`;
			g.visible = false;
			this.group.add(g);
			return g;
		};
		const labelsOf = (g, entries) => {
			if (!entries.length) return;
			const atlas = labelAtlas(entries);
			g.add(atlas.group);
			(this.labelSets ??= []).push(atlas);
		};
		const ring = (x, z, r, width, material) => {
			const seg = Math.max(24, Math.round(r * 10));
			const pos = [];
			const index = [];
			for (let i = 0; i <= seg; i++) {
				const a = (i / seg) * Math.PI * 2;
				for (const rr of [r - width, r]) {
					const px = x + Math.cos(a) * rr;
					const pz = z + Math.sin(a) * rr;
					pos.push(px, Math.max(W.surfaceY(px, pz), W.waterAt(px, pz)?.level ?? -Infinity) + 0.09, pz); // on the water surface, not the hidden bed
				}
				if (i) {
					const k = i * 2;
					index.push(k - 2, k - 1, k, k - 1, k + 1, k);
				}
			}
			const g = this.ownGeo(new THREE.BufferGeometry());
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setIndex(index);
			withDefaultAttributes(g);
			const mesh = new THREE.Mesh(g, material);
			mesh.renderOrder = 5;
			return mesh;
		};
		// asset labels: every unique-ish placement (≤ 2 of its id) + one per repeated id (its first placement) + one per walkway
		O.labels = group('Nhãn asset');
		const seen = new Map();
		const entries = [];
		for (const s of W.structures) {
			if (s.scatter !== undefined || s.def.status === 'procedural') continue;
			const n = (seen.get(s.asset) ?? 0) + 1;
			seen.set(s.asset, n);
			const total = W.structures.filter((q) => q.asset === s.asset).length;
			if (total > 2 && n > 1) continue;
			entries.push({ text: `${s.asset} · ${s.def.name}`.slice(0, 46), sub: `${s.def.status === 'kit' ? 'kit tạm' : s.def.status}${total > 2 ? ` · ×${total}` : ''} · ${s.size.map((v) => v.toFixed(1)).join(' × ')} m`, x: s.x, y: s.top + 0.5, z: s.z, color: CATEGORY_COLORS[s.def.category] });
		}
		for (const p of W.paths.filter((q) => q.kind === 'walkway')) {
			const [x, z] = p.pts[Math.floor(p.pts.length / 2)];
			entries.push({ text: `${p.asset ?? 'A01.2'} · walkway ${p.id}`, sub: `blockout · deck ${p.deck} m`, x, y: (p.deck ?? 0.6) + 1.4, z, color: CATEGORY_COLORS.structure });
		}
		for (const s of W.far?.items ?? []) entries.push({ text: `${s.asset} · far silhouette`, sub: s.def.name.slice(0, 44), x: s.x, y: s.top + 8, z: s.z, color: CATEGORY_COLORS.story, width: 60 });
		labelsOf(O.labels, entries);
		// encounters
		O.encounters = group('Chạm trán (quái)');
		const encMat = mat('#c0504f', { opacity: 0.75 });
		const enc = [];
		for (const m of W.markers.filter((q) => q.kind === 'encounter')) {
			O.encounters.add(ring(m.x, m.z, m.r ?? 4, 0.3, encMat));
			enc.push({ text: m.label, sub: m.note?.slice(0, 50), x: m.x, y: m.y + 2.6, z: m.z, color: CATEGORY_COLORS.encounter });
		}
		labelsOf(O.encounters, enc);
		// rites
		O.rites = group('Điểm Rite');
		const riteMat = mat('#e8e4d8', { opacity: 0.8 });
		const rites = [];
		for (const m of W.markers.filter((q) => q.kind === 'rite')) {
			O.rites.add(ring(m.x, m.z, 2.4, 0.18, riteMat), ring(m.x, m.z, 1.2, 0.12, riteMat));
			rites.push({ text: m.label, sub: m.note?.slice(0, 50), x: m.x, y: m.y + 2.2, z: m.z, color: '#e8e4d8' });
		}
		labelsOf(O.rites, rites);
		// landmarks + sightlines
		O.landmarks = group('Landmark + tầm nhìn');
		const lmMat = mat('#d8b65a', { opacity: 0.9 });
		const lm = [];
		const pole = this.ownGeo(new THREE.CylinderGeometry(0.1, 0.1, 1, 6).translate(0, 0.5, 0));
		const gem = this.ownGeo(new THREE.OctahedronGeometry(0.6));
		for (const m of W.markers.filter((q) => q.kind === 'landmark')) {
			const top = Math.max(m.y + 9, (W.structures.find((s) => Math.hypot(s.x - m.x, s.z - m.z) < 2 && !s.scatter)?.top ?? 0) + 2);
			const p = new THREE.Mesh(pole, lmMat);
			p.position.set(m.x, m.y, m.z);
			p.scale.y = top - m.y;
			const d = new THREE.Mesh(gem, lmMat);
			d.position.set(m.x, top + 0.6, m.z);
			O.landmarks.add(p, d);
			lm.push({ text: m.label, x: m.x, y: top + 1.4, z: m.z, color: '#d8b65a' });
		}
		const lineMat = this.ownMat(new THREE.LineBasicMaterial({ name: 'Sightlines', color: new THREE.Color('#e8c860'), transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
		for (const m of W.markers.filter((q) => q.kind === 'sightline')) {
			const g = this.ownGeo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...m.fromP), new THREE.Vector3(...m.toP)]));
			withDefaultAttributes(g);
			const line = new THREE.Line(g, lineMat);
			line.frustumCulled = false;
			O.landmarks.add(line);
			lm.push({ text: m.label, x: m.fromP[0], y: m.fromP[1] + 1.2, z: m.fromP[2], color: '#e8c860' });
		}
		// sound sources (kind 'sound': a route followed by ear, e.g. the fens' lullaby): the audible radius, a small ring at the source, a label
		const soundMat = mat('#a9c7e6', { opacity: 0.7 });
		for (const m of W.markers.filter((q) => q.kind === 'sound')) {
			O.landmarks.add(ring(m.x, m.z, m.r ?? 12, 0.22, soundMat), ring(m.x, m.z, 1.0, 0.16, soundMat));
			lm.push({ text: `♪ ${m.label}`, sub: m.note?.slice(0, 50), x: m.x, y: m.y + 2.4, z: m.z, color: '#a9c7e6' });
		}
		labelsOf(O.landmarks, lm);
		// vignettes
		O.vignettes = group('Vignette');
		const vg = [];
		const vMat = mat('#b48ee0', { opacity: 0.9 });
		const vMatR = mat('#f4f0e6', { opacity: 0.95 });
		const vMatU = mat('#7a5aa8', { opacity: 0.9 });
		const small = this.ownGeo(new THREE.OctahedronGeometry(0.35));
		for (const m of W.markers.filter((q) => q.kind === 'vignette')) {
			const d = new THREE.Mesh(small, m.remember ? vMatR : m.unmarked ? vMatU : vMat);
			d.position.set(m.x, m.y + 1.4, m.z);
			O.vignettes.add(d);
			vg.push({ text: m.label.slice(0, 48), sub: m.unmarked ? 'không đánh dấu trên map' : m.remember ? 'Remember' : 'vignette', x: m.x, y: m.y + 2.1, z: m.z, color: m.remember ? '#f4f0e6' : '#b48ee0' });
		}
		labelsOf(O.vignettes, vg);
		// NPC spots (a 1.8 m figure)
		O.npcs = group('NPC');
		const npcGeo = this.ownGeo(personMarker());
		const npcMat = this.blockoutMaterial();
		const np = [];
		this.npcMarkers = [];
		for (const m of W.markers.filter((q) => q.kind === 'npc')) {
			const fig = new THREE.Mesh(npcGeo, npcMat);
			fig.position.set(m.x, m.y, m.z);
			fig.userData.moods = m.moods ?? null;
			O.npcs.add(fig);
			this.npcMarkers.push(fig);
			np.push({ text: m.label, x: m.x, y: m.y + 2.15, z: m.z, color: CATEGORY_COLORS.npc });
		}
		labelsOf(O.npcs, np);
		// exits: a ground arrow + a pole
		O.exits = group('Lối ra');
		const exMat = mat('#78d88c', { opacity: 0.9 });
		const ex = [];
		const arrow = new THREE.Shape([new THREE.Vector2(-0.9, -1.1), new THREE.Vector2(0, 1.2), new THREE.Vector2(0.9, -1.1), new THREE.Vector2(0, -0.5)]);
		const arrowGeo = this.ownGeo(new THREE.ShapeGeometry(arrow).rotateX(-Math.PI / 2));
		for (const m of W.markers.filter((q) => q.kind === 'exit')) {
			const a = new THREE.Mesh(arrowGeo, exMat);
			a.position.set(m.x, m.y + 0.12, m.z);
			const p = new THREE.Mesh(pole, exMat);
			p.position.set(m.x, m.y, m.z);
			p.scale.y = 3.2;
			O.exits.add(a, p);
			ex.push({ text: m.label, x: m.x, y: m.y + 3.6, z: m.z, color: '#78d88c' });
		}
		labelsOf(O.exits, ex);
	}

	// ---- the far frame -----------------------------------------------------------------------------------------------------------------------------------

	/** Black water beyond the bounds (a frame round the map), low far hills, the far silhouettes (N-GH) — no collision, fogged like everything else. */
	buildFar() {
		const W = this.world;
		const far = W.far;
		if (!far) return;
		const group = NO_PICK(this.sub('Far (water, hills, N-GH)'));
		const [x0, z0, x1, z1] = W.bounds;
		const S = far.size / 2;
		const frame = new THREE.Shape([new THREE.Vector2(-S, -S), new THREE.Vector2(S, -S), new THREE.Vector2(S, S), new THREE.Vector2(-S, S)]);
		frame.holes.push(new THREE.Path([new THREE.Vector2(x0, -z0), new THREE.Vector2(x0, -z1), new THREE.Vector2(x1, -z1), new THREE.Vector2(x1, -z0)]));
		const fg = this.ownGeo(new THREE.ShapeGeometry(frame).rotateX(-Math.PI / 2));
		withDefaultAttributes(fg);
		const waterMat = this.ownMat(new THREE.MeshPhysicalMaterial({ name: 'Far black water', color: new THREE.Color(0.01, 0.016, 0.014), roughness: 0.34, metalness: 0, specularIntensity: 0.08, envMapIntensity: 0.12, normalMap: this.tex.water, normalScale: new THREE.Vector2(0.3, 0.3) }));
		const fx = this.app.backend.effects.createWaterSpecular?.();
		const water = new THREE.Mesh(fg, fx ? this.ownMat(fx.apply(waterMat)) : waterMat);
		water.position.y = far.level - 0.005;
		water.name = 'Far black water';
		group.add(NO_PICK(water));
		// an opaque dark bed under the island: water writes no depth, so a view ray that slips past the terrain's sunken edge would read as sky to the post fog
		const bedGeo = this.ownGeo(new THREE.PlaneGeometry(x1 - x0 + 24, z1 - z0 + 24).rotateX(-Math.PI / 2));
		const bed = new THREE.Mesh(bedGeo, this.ownMat(new THREE.MeshBasicMaterial({ name: 'Fen bed (under the island)', color: new THREE.Color(0.006, 0.01, 0.009) })));
		bed.position.set((x0 + x1) / 2, Math.min(far.level, this.plan.edge?.y ?? far.level) - 0.6, (z0 + z1) / 2);
		bed.name = 'Fen bed (depth under the water)';
		group.add(NO_PICK(bed));
		// far hills: polar meshes
		const hillMat = this.ownMat(new THREE.MeshStandardMaterial({ name: 'Far hills', color: new THREE.Color('#2c3428'), roughness: 0.95, metalness: 0, flatShading: false }));
		for (const h of far.hills ?? []) {
			const rings = 14;
			const seg = 40;
			const pos = [];
			const index = [];
			for (let i = 0; i <= rings; i++) {
				const rr = (i / rings) * h.r * 1.02;
				for (let j = 0; j < seg; j++) {
					const a = (j / seg) * Math.PI * 2;
					const x = h.x + Math.cos(a) * rr * (1 + 0.08 * Math.sin(a * 3 + h.x));
					const z = h.z + Math.sin(a) * rr * (1 + 0.08 * Math.cos(a * 2 + h.z));
					pos.push(x, far.hillY(x, z) - (i === rings ? 0.6 : 0), z);
					if (i) {
						const k = i * seg + j;
						const kn = i * seg + ((j + 1) % seg);
						index.push(k - seg, k, kn - seg, kn - seg, k, kn);
					}
				}
			}
			const g = this.ownGeo(new THREE.BufferGeometry());
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setIndex(index);
			g.computeVertexNormals();
			withDefaultAttributes(g);
			const mesh = new THREE.Mesh(g, hillMat);
			mesh.name = 'Far hill';
			group.add(NO_PICK(mesh));
		}
		for (const it of far.items) {
			const comp = it.def.composite;
			if (comp?.parts.length && !globalThis.__act1ForceBlockout?.has?.(it.asset) && comp.parts.every((p) => this.glbMesh(p.model))) {
				for (const m of this.compositeMeshes(it, comp)) group.add(NO_PICK(m));
				(this.modelShown ??= new Set()).add(it.asset);
				continue;
			}
			const mesh = instancedBlockout(it.def, [it], this.blockoutMaterial(), this.shapeCache);
			mesh.name += ' (far)';
			delete mesh.userData.labSolid;
			group.add(NO_PICK(mesh));
		}
		if (Object.values(this.plan.moods ?? {}).some((m) => (m.stars ?? 0) > 0)) this.buildStars(group);
	}

	/**
	 * A still star dome for the moods with `stars` > 0 (AD §4.5: cold white points, never twinkling, set a little too evenly; more of them act by act): small
	 * quads on a 900 m dome over the map from a jittered elevation × azimuth grid, one unlit mesh in the scene (depth-tested behind the far hills, fogged
	 * only near the horizon). applyMood scales it by mood.stars.
	 */
	buildStars(group) {
		const [x0, z0, x1, z1] = this.world.bounds;
		const c = new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2);
		const DEG2 = Math.PI / 180;
		const R = 900;
		const r = rng(4242);
		const pos = [];
		const col = [];
		const dir = new THREE.Vector3();
		const u = new THREE.Vector3();
		const v = new THREE.Vector3();
		for (let row = 0; row < 26; row++) {
			const e0 = 4 + row * 3.3; // elevation band (deg), denser toward the horizon like the eye expects
			const n = Math.max(6, Math.round(150 * Math.cos(e0 * DEG2)));
			for (let i = 0; i < n; i++) {
				const e = (e0 + (r() - 0.5) * 2.2) * DEG2;
				const a = ((i + 0.5 + (r() - 0.5) * 0.7) / n) * Math.PI * 2;
				dir.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a));
				u.set(Math.cos(a), 0, -Math.sin(a));
				v.crossVectors(dir, u);
				const s = (0.9 + r() * r() * 1.8) * 0.5;
				const p = c.clone().addScaledVector(dir, R);
				const corners = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([a1, b1]) => p.clone().addScaledVector(u, a1).addScaledVector(v, b1));
				for (const k of [0, 2, 1, 0, 3, 2]) pos.push(corners[k].x, corners[k].y, corners[k].z);
				const b = 0.45 + r() * 0.55;
				for (let k = 0; k < 6; k++) col.push(b * 0.92, b * 0.96, b);
			}
		}
		const g = this.ownGeo(new THREE.BufferGeometry());
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
		withDefaultAttributes(g);
		const mat = this.ownMat(new THREE.MeshBasicMaterial({ name: 'Stars (still, cold)', vertexColors: true, toneMapped: false, fog: false, side: THREE.DoubleSide }));
		const mesh = new THREE.Mesh(g, mat);
		mesh.name = `Stars (${pos.length / 18}, still)`;
		mesh.frustumCulled = false;
		group.add(NO_PICK(mesh));
		this.stars = { mesh, mat };
	}

	// ---- moods and frames -------------------------------------------------------------------------------------------------------------------------------

	/** The mood's flags and levels: accent sprigs, grave candles, the Gentle House window, the forge, night overrides of lights, NPC markers per mood. */
	applyMood(id, mood) {
		this.moodId = id;
		this.flags = mood.flags ?? {};
		this.levels = { human: mood.human ?? 1, perfection: mood.perfection ?? 1, windows: mood.windows ?? 0.5 };
		this.rainTone = mood.rainTone ?? 1; // the streaks are unlit: dimmer at night
		if (this.poppies) this.poppies.visible = this.flags.accent !== false;
		for (const l of this.lights) {
			const night = id === 'night' && l.def.night;
			l.base = night?.intensity ?? l.def.intensity;
			l.light.distance = night?.range ?? l.def.range ?? 8;
		}
		for (const fig of this.npcMarkers ?? []) fig.visible = !fig.userData.moods || fig.userData.moods.includes(id);
		if (this.stars) {
			this.stars.mesh.visible = (mood.stars ?? 0) > 0;
			this.stars.mat.color.setScalar(Math.min(1.5, mood.stars ?? 0));
		}
	}

	/** Is a light / glow on under the current mood? (flags + per-light mood lists) */
	lightOn(def) {
		if (!def) return true;
		if (def.moods && !def.moods.includes(this.moodId)) return false;
		if (def.flag && this.flags[def.flag] === false) return false;
		return true;
	}

	update(elapsed, delta, { camera, focus, rain = 0, mist = 0, flicker = true, ritesDone = false, waterFlow = 1, labels = false }) {
		const t = elapsed;
		// real lights: people's light flickers (1/f), Perfection's stands still
		for (const l of this.lights) {
			const on = this.lightOn(l.def);
			const level = flicker ? lightLevel(l.def, t) : 1;
			const scale = l.def.kind === 'perfection' ? this.levels.perfection : this.levels.human;
			l.light.intensity = on ? l.base * scale * level : 0;
			l.light.visible = on;
		}
		if (this.windows) this.windowMat.color.setRGB(0.88, 0.63, 0.31).multiplyScalar(1.4 * this.levels.windows);
		// glows: face the camera, flicker per seed, mood gating
		if (this.glows && camera) {
			const { mesh, list } = this.glows;
			list.forEach((g, i) => {
				let on = this.lightOn(g.def);
				if (g.jar) on = this.flags.graveCandles !== false;
				const k = g.kind === 'perfection' ? this.levels.perfection : g.window ? this.levels.windows * 0.9 : this.levels.human;
				const f = flicker && g.kind === 'human' ? lightLevel({ kind: 'human', flicker: g.def?.flicker ?? 0.8, seed: g.def?.seed ?? g.seed ?? i }, t) : 1;
				const size = (this.moodId === 'night' ? g.def?.night?.glow : undefined) ?? g.size; // a light's night override (Prologue) may shrink its glow
				const s = on ? size * (g.kind === 'perfection' ? 1 : 0.9 + 0.1 * f) : 0.0001;
				mesh.setMatrixAt(i, _m.compose(g.p, camera.quaternion, _v.set(s, s, s)));
				mesh.setColorAt(i, _c.copy(g.color).multiplyScalar(on ? (g.kind === 'perfection' ? 2.2 : 1.1) * k * f : 0));
			});
			mesh.instanceMatrix.needsUpdate = true;
			mesh.instanceColor.needsUpdate = true;
		}
		// rain streaks round the focus
		if (this.rain) {
			const R = this.rain;
			const far = camera ? 1 - smoothstep(55, 110, camera.position.distanceTo(focus)) : 1; // the streak box follows the view: from far away it would read as noise
			R.lines.visible = rain * far > 0.01;
			this.rainMat.opacity = 0.32 * Math.min(1, rain) * far * (this.rainTone ?? 1);
			if (R.lines.visible) {
				const [bw, bh, bd] = R.box;
				const arr = R.lines.geometry.attributes.position.array;
				const n = Math.round(R.N * Math.min(1, 0.35 + 0.65 * rain));
				const fall = 9.5 * delta;
				for (let i = 0; i < R.N; i++) {
					const d = R.drops[i];
					d.y -= (fall * d.s) / bh;
					if (d.y < 0) d.y += 1;
					const o = i * 6;
					if (i >= n) {
						arr.fill(0, o, o + 6);
						arr[o + 1] = arr[o + 4] = -1e4;
						continue;
					}
					const x = focus.x + d.x * bw * 0.5;
					const z = focus.z + d.z * bd * 0.5;
					const y = focus.y - 3 + d.y * bh;
					arr[o] = x;
					arr[o + 1] = y;
					arr[o + 2] = z;
					arr[o + 3] = x + 0.06;
					arr[o + 4] = y - 0.55 * d.s;
					arr[o + 5] = z + 0.02;
				}
				R.lines.geometry.attributes.position.needsUpdate = true;
			}
		}
		// mist sheets drift; they thin once the five graves are quiet
		if (this.mist) {
			this.mistMat.opacity = 0.065 * mist * (ritesDone ? 0.4 : 1);
			this.mist.group.visible = mist > 0.01;
			if (this.mist.group.visible) this.driftMist(t);
		}
		// crows: circling over the gibbet and the graves until the rites are done, then settled where the plan put them
		if (this.crows) {
			const items = this.crows.userData.items;
			items.forEach((it, i) => {
				if (ritesDone) this.crows.setMatrixAt(i, placementMatrix(it));
				else {
					const a = t * (0.35 + 0.05 * (i % 3)) + i * 1.7;
					const rr = 4 + (i % 3) * 1.6;
					_v.set(it.x + Math.cos(a) * rr, it.y + 5 + Math.sin(t * 0.7 + i) * 0.6 + (i % 2) * 1.2, it.z + Math.sin(a) * rr);
					this.crows.setMatrixAt(i, _m.compose(_v, _q.setFromAxisAngle(UP, -a), new THREE.Vector3(1.2, 1.2, 1.2)));
				}
			});
			this.crows.instanceMatrix.needsUpdate = true;
		}
		if (this.waterMaterial?.normalMap) this.waterMaterial.normalMap.offset.set(t * 0.006 * waterFlow, t * 0.004 * waterFlow);
		if (labels && camera) for (const set of this.labelSets ?? []) if (set.group.parent?.visible) set.face(camera);
		this.meadow?.update(elapsed, delta, { camera });
	}

	/** The overlay groups' visibility from the scene's settings. */
	setOverlays(s) {
		const O = this.overlays ?? {};
		for (const [k, g] of Object.entries(O)) g.visible = !!s[k];
	}

	dispose() {
		for (const g of this.own.geometries) g.dispose();
		for (const m of this.own.materials) m.dispose();
		for (const t of this.own.textures) t.dispose();
		for (const set of this.labelSets ?? []) set.dispose();
		for (const [, g] of this.shapeCache ?? []) g.geometry.dispose();
		this.group.traverse((o) => {
			if (o.isInstancedMesh) o.dispose();
		});
		this.vfx.traverse((o) => {
			if (o.isInstancedMesh) o.dispose();
		});
	}
}

// ---- small geometry helpers -----------------------------------------------------------------------------------------------------------------------

/** Point at arc length s of a polyline: [x, z, dirX, dirZ, s]. */
function pointOn(pts, s) {
	let acc = 0;
	for (let i = 1; i < pts.length; i++) {
		const [ax, az] = pts[i - 1];
		const [bx, bz] = pts[i];
		const len = Math.hypot(bx - ax, bz - az);
		if (acc + len >= s || i === pts.length - 1) {
			const t = len ? clamp((s - acc) / len, 0, 1) : 0;
			return [ax + (bx - ax) * t, az + (bz - az) * t, (bx - ax) / (len || 1), (bz - az) / (len || 1), s];
		}
		acc += len;
	}
	return [pts[0][0], pts[0][1], 1, 0, s];
}

function mergeAll(parts) {
	let n = 0;
	for (const p of parts) n += p.attributes.position.count;
	const pos = new Float32Array(n * 3);
	const nor = new Float32Array(n * 3);
	const col = new Float32Array(n * 3);
	let o = 0;
	for (const p of parts) {
		pos.set(p.attributes.position.array, o * 3);
		nor.set(p.attributes.normal.array, o * 3);
		col.set(p.attributes.color.array, o * 3);
		o += p.attributes.position.count;
		p.dispose();
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
	g.setAttribute('color', new THREE.BufferAttribute(col, 3));
	g.computeBoundingBox();
	g.computeBoundingSphere();
	return g;
}

/** A 2 × 2 atlas card (grassCardGeometry), darker toward the root (vertex colour). */
function rootShadedCard(cell) {
	const g = grassCardGeometry(cell);
	const pos = g.attributes.position;
	const col = new Float32Array(pos.count * 3);
	for (let i = 0; i < pos.count; i++) col.fill(0.5 + 0.5 * clamp(pos.getY(i), 0, 1), i * 3, i * 3 + 3);
	g.setAttribute('color', new THREE.BufferAttribute(col, 3));
	return g;
}

/** Poppy sprig on a door: a stem and three small red heads (the accent, procedural). */
function sprigGeometry() {
	const parts = [];
	const stem = new THREE.BoxGeometry(0.02, 0.3, 0.02).translate(0, 0.15, 0);
	parts.push(stem.toNonIndexed());
	for (const [x, y] of [[-0.05, 0.3], [0.04, 0.34], [0.0, 0.25]]) parts.push(new THREE.IcosahedronGeometry(0.045, 0).translate(x, y, 0.01)); // polyhedra are already non-indexed
	stem.dispose();
	for (const p of parts) p.deleteAttribute('uv');
	const g = new THREE.BufferGeometry();
	const n = parts.reduce((a, p) => a + p.attributes.position.count, 0);
	const pos = new Float32Array(n * 3);
	const nor = new Float32Array(n * 3);
	let o = 0;
	for (const p of parts) {
		pos.set(p.attributes.position.array, o * 3);
		nor.set(p.attributes.normal.array, o * 3);
		o += p.attributes.position.count;
		p.dispose();
	}
	g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
	return withDefaultAttributes(g);
}

/** A crow: a small dark body, head and tail (procedural placeholder). */
function crowGeometry() {
	const parts = [new THREE.SphereGeometry(0.13, 6, 4).scale(1.5, 0.8, 0.8).translate(0, 0.14, 0), new THREE.SphereGeometry(0.07, 6, 4).translate(0.2, 0.25, 0), new THREE.BoxGeometry(0.18, 0.02, 0.1).translate(-0.22, 0.12, 0)];
	const flat = parts.map((p) => {
		const q = p.toNonIndexed();
		p.dispose();
		q.deleteAttribute('uv');
		return q;
	});
	const n = flat.reduce((a, p) => a + p.attributes.position.count, 0);
	const pos = new Float32Array(n * 3);
	const nor = new Float32Array(n * 3);
	let o = 0;
	for (const p of flat) {
		pos.set(p.attributes.position.array, o * 3);
		nor.set(p.attributes.normal.array, o * 3);
		o += p.attributes.position.count;
		p.dispose();
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
	return withDefaultAttributes(g);
}


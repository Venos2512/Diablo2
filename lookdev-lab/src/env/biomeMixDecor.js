// ASHLAR · Biome mix dressing: what makes a flat blend read as a place (research report 2.5 / 2.6 / 2.8): ground decals (leaves, twigs, roots, pebbles, moss,
// cracks, mud splashes) scattered from the splat masks by rules, shore plant cards along the water's edge, authored 3D prop compositions with contact shadows,
// and rooted, ground-tinted grass cards. Everything is deterministic (seeded) and rebuilt when the masks change (the "Độ mịn" slider). Decals and cards are
// instanced; one mesh per atlas cell.
import * as THREE from 'three';
import { loadGrassCards, grassCardGeometry } from './terrain.js';
import { loadKits } from './outdoor.js';
import { groundHeight, pondDistance, finalWeights } from './biomeMix.js';
import * as kit from './kit.js';

const DECAL_ATLAS = 'biome-decals-ground';
const PLANT_ATLAS = 'biome-shore-plants';
const PROPS = { stones: 'biome-prop-riverbank-stones', mushrooms: 'biome-prop-mushrooms', stump: 'biome-prop-stump' };
const CAPACITY = 900; // instances per atlas cell
const smooth = (v, e0, e1) => THREE.MathUtils.smoothstep(v, e0, e1);

// Layer ids by what they are, for the decal rules (a layer that is none of these takes no decals: salt, ice, stone floors ...).
const GROUPS = {
	grass: new Set(['DW_grass', 'DW_dense', 'DW_sparse', 'BIO02_meadow']),
	dirt: new Set(['DW_dirt', 'BIO01_peat', 'BIO04_garden']),
	wet: new Set(['DW_mud', 'DW_damp']),
	stone: new Set(['BIO03_flint', 'BIO04_ossuary']),
};

// Decal atlas cells (row-major from the image top): 0-2 dry leaves, 3 wet leaves, 4-5 twigs, 6 roots, 7 needle / leaf crumbs, 8-10 pebble groups, 11 flat stone,
// 12-13 moss, 14 crack, 15 mud splash. Size = metres of the quad's side.
const DECALS = [
	{ cells: [0, 1, 2], size: [0.4, 0.7] }, { cells: [3], size: [0.4, 0.6] }, { cells: [4, 5], size: [0.55, 0.9] }, { cells: [6], size: [0.8, 1.3] }, { cells: [7], size: [0.4, 0.65] },
	{ cells: [8, 9, 10], size: [0.25, 0.45] }, { cells: [11], size: [0.25, 0.4] }, { cells: [12, 13], size: [0.6, 1.1] }, { cells: [14], size: [1.0, 1.7] }, { cells: [15], size: [0.55, 1.0] },
];

/** A cell of a 2 x 2 (plants) or 4 x 4 (decals) atlas as a bottom-aligned, upright 3-quad card (grassCardGeometry) or a flat quad, rooted-shaded by vertex colour. */
function cardGeometry(cell, cols) {
	const g = cols === 2 ? grassCardGeometry(cell) : new THREE.PlaneGeometry(1, 1);
	if (cols === 4) {
		g.rotateX(-Math.PI / 2);
		const u0 = (cell % 4) / 4;
		const v0 = 1 - (Math.floor(cell / 4) + 1) / 4;
		const uv = g.attributes.uv;
		for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) / 4, v0 + uv.getY(i) / 4);
		return g;
	}
	const pos = g.attributes.position;
	const col = new Float32Array(pos.count * 3);
	for (let i = 0; i < pos.count; i++) col.fill(0.5 + 0.5 * THREE.MathUtils.clamp(pos.getY(i), 0, 1), i * 3, i * 3 + 3); // darker toward the root
	g.setAttribute('color', new THREE.BufferAttribute(col, 3));
	return g;
}

/** Cards darkened toward the root (vertex colour) — used by the grass tufts too. */
export const rootShaded = (cell) => cardGeometry(cell, 2);

function radialTexture() {
	const c = document.createElement('canvas');
	c.width = c.height = 128;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
	grad.addColorStop(0, 'rgba(0,0,0,0.85)');
	grad.addColorStop(0.5, 'rgba(0,0,0,0.38)');
	grad.addColorStop(1, 'rgba(0,0,0,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 128, 128);
	const tex = new THREE.CanvasTexture(c);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

export class BiomeDecor {
	constructor({ app, group, patches, library, windGrass, settings }) {
		this.app = app;
		this.group = group;
		this.patches = patches;
		this.library = library;
		this.windGrass = windGrass;
		this.settings = settings;
		this.ownMaterials = [];
		this.ownTextures = [];
		this.props = new THREE.Group();
		this.props.name = 'Natural sample props';
		group.add(this.props);
		this.counts = { decals: 0, plants: 0, props: 0 };
	}

	async load() {
		const { app } = this;
		const [decals, plants, kits, stones, mushrooms, stump] = await Promise.all([
			loadGrassCards(app, DECAL_ATLAS), loadGrassCards(app, PLANT_ATLAS),
			loadKits(app, [['trees', 'kit-dead-trees'], ['rocks', 'kit-mossy-rocks'], ['shrubs', 'kit-shrubs']]),
			...Object.values(PROPS).map((id) => app.loader.loadSample(id).catch((e) => (console.error(`Prop "${id}" failed to load`, e), null))),
		]);
		this.decalTexture = decals;
		this.plantTexture = plants;
		this.kits = kits;
		this.propGltf = { stones, mushrooms, stump };
		const decalMaterial = new THREE.MeshStandardMaterial({ name: 'Ground decals', map: decals, alphaTest: 0.4, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
		this.decalMeshes = Array.from({ length: 16 }, (_, cell) => this.instanced(`Decals · cell ${cell}`, cardGeometry(cell, 4), decalMaterial));
		const plantMaterial = new THREE.MeshStandardMaterial({ name: 'Shore plants', map: plants, alphaTest: 0.45, roughness: 0.85, metalness: 0, vertexColors: true, color: new THREE.Color(0.62, 0.7, 0.54) });
		this.plantMaterial = this.windGrass.apply(plantMaterial);
		this.plantBase = plantMaterial;
		this.plantMeshes = [0, 1, 2, 3].map((cell) => this.instanced(`Shore plants · cell ${cell}`, cardGeometry(cell, 2), this.plantMaterial));
		this.aoTexture = radialTexture();
		this.aoMaterial = new THREE.MeshBasicMaterial({ name: 'Contact shadow', map: this.aoTexture, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, toneMapped: false });
		this.aoGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
		this.decalMaterial = decalMaterial;
	}

	instanced(name, geometry, material) {
		const mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
		mesh.name = name;
		mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPACITY * 3), 3);
		mesh.count = 0;
		mesh.frustumCulled = false;
		mesh.userData.labNoPick = true;
		this.group.add(mesh);
		return mesh;
	}

	/** Unit normal of a sample's ground at a patch-local position (finite differences of groundHeight; straight up where it is flat). */
	groundNormal(sample, x, z, out = new THREE.Vector3()) {
		if (!sample.pond) return out.set(0, 1, 0);
		const e = 0.12;
		const dx = (groundHeight(sample, x + e, z) - groundHeight(sample, x - e, z)) / (2 * e);
		const dz = (groundHeight(sample, x, z + e) - groundHeight(sample, x, z - e)) / (2 * e);
		return out.set(-dx, 1, -dz).normalize();
	}

	/** Layer-group weights, wetness and pond distance at a patch-local position (from the GPU's own, smoothed splat). */
	probe(p, lx, lz, out) {
		const n = p.sample.layers.length;
		p.splat.sample(p.c.x + lx, p.c.z + lz, out.raw);
		out.m[0] = 1;
		for (let k = 1; k < n; k++) out.m[k] = out.raw[k - 1];
		finalWeights(out.m, n, out.w);
		out.grass = out.dirt = out.wet = out.stone = out.path = out.mud = out.damp = out.sparse = out.dense = 0;
		const r = [0, 0, 0];
		p.sample.layers.forEach((l, i) => {
			const w = out.w[i];
			for (const g of Object.keys(GROUPS)) if (GROUPS[g].has(l.id)) out[g] += w;
			if (l.role === 'path') out.path += w;
			if (l.id === 'DW_mud') out.mud += w;
			if (l.id === 'DW_damp') out.damp += w;
			if (l.id === 'DW_sparse') out.sparse += w;
			if (l.id === 'DW_dense') out.dense += w;
			const mean = this.library.mean[l.id];
			for (let c = 0; c < 3; c++) r[c] += w * mean[c];
		});
		out.mean = r;
		out.wetness = out.raw[7];
		out.d = p.sample.pond ? pondDistance(p.sample.pond, p.sample.seed, lx, lz) : 99;
		return out;
	}

	/**
	 * Level of detail: the dressing is for the close views. Far away (the whole-grid overview, ~100 m) decals, plants and props are tiny and cost ~3 ms of GPU
	 * time (WebGL2, measured), so they are hidden beyond `far` metres; visibility toggles do not recompile anything.
	 */
	setDetail(near) {
		if (this.near === near) return;
		this.near = near;
		this.decalMeshes?.forEach((m, i) => (m.visible = near && m.count > 0));
		this.plantMeshes?.forEach((m) => (m.visible = near && m.count > 0));
		if (this.props) this.props.visible = near && this.settings.props;
	}

	/** Scatter everything again (call after the splats changed). */
	scatter() {
		const s = this.settings;
		const rand = kit.rng(9917);
		const out = { raw: new Float32Array(8), m: new Float32Array(8), w: new Float32Array(8) };
		const counts = new Array(16).fill(0);
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		const stoneRand = [];
		const stoneSpots = (this.stage?.decalSpots ?? []).filter((d) => d.cell >= 8 && d.cell <= 11);
		const yawQ = new THREE.Quaternion();
		const up = new THREE.Vector3(0, 1, 0);
		const emit = (p, cell, lx, lz, size, yaw, extra = 0) => {
			if (counts[cell] >= CAPACITY) return;
			// not below the pond's surface (faint specks show through the water)
			if (p.sample.water && groundHeight(p.sample, lx, lz) < p.sample.water.level - 0.03) return;
			const isStone = cell >= 8 && cell <= 11;
			// no leaves stacked on stones
			if (cell <= 3 && (stoneSpots.some((d) => Math.hypot(d.x - lx, d.z - lz) < 0.5) || stoneRand.some((d) => Math.hypot(d.x - lx, d.z - lz) < 0.5))) return;
			if (isStone) stoneRand.push({ x: lx, z: lz });
			const { mean, wetness } = out;
			// toward the ground colour under it (chroma only; the decal keeps its own value, stones darker and more tinted), a little darker where wet
			const lum = Math.max(1e-4, 0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]);
			const k = isStone ? 0.65 : 0.4;
			color.setRGB(1 + k * (mean[0] / lum - 1), 1 + k * (mean[1] / lum - 1), 1 + k * (mean[2] / lum - 1)).multiplyScalar((isStone ? 0.5 + rand() * 0.14 : 0.66 + rand() * 0.18) * (1 - 0.3 * smooth(wetness, 0.3, 0.9)));
			// flat on the ground: tilted to its normal (the pond's slope would clip half of a level quad and float the other half), then turned about it
			const n = this.groundNormal(p.sample, lx, lz);
			dummy.position.set(p.c.x + lx, groundHeight(p.sample, lx, lz), p.c.z + lz).addScaledVector(n, 0.014 + extra + rand() * 0.004);
			dummy.quaternion.setFromUnitVectors(up, n).multiply(yawQ.setFromAxisAngle(up, yaw));
			dummy.scale.set(size, 1, size);
			dummy.updateMatrix();
			this.decalMeshes[cell].setMatrixAt(counts[cell], dummy.matrix);
			this.decalMeshes[cell].setColorAt(counts[cell], color);
			counts[cell]++;
		};
		const pick = (list) => list[Math.floor(rand() * list.length)];
		const size = ([a, b]) => a + (b - a) * rand();
		if (s.decals > 0) {
			for (const p of this.patches) {
				const present = new Set(p.sample.layers.map((l) => l.id));
				if (![...GROUPS.grass].some((id) => present.has(id))) continue; // salt, ice, stone floors ...: no leaf litter
				const area = p.c.size * p.c.size;
				const half = p.c.size / 2 - 0.4;
				const tries = Math.round(area * 2.6 * s.decals);
				for (let t = 0; t < tries; t++) {
					const lx = (rand() * 2 - 1) * half;
					const lz = (rand() * 2 - 1) * half;
					this.probe(p, lx, lz, out);
					const edgeGrass = 4 * out.grass * (1 - out.grass);
					const edgePath = 4 * out.path * (1 - out.path);
					const shore = p.sample.pond ? smooth(out.d, 0.1, 0.7) * (1 - smooth(out.d, 1.8, 3.4)) : 0;
					const r = rand();
					const yaw = rand() * Math.PI * 2;
					// leaves: at the grass edges, a few on the grass; the dark wet ones near the damp ground
					if (r < 0.34) {
						if (rand() < 0.75 * edgeGrass + 0.1 * out.grass) emit(p, out.wet > 0.35 || out.wetness > 0.5 ? 3 : pick([0, 1, 2]), lx, lz, size(DECALS[0].size), yaw);
					} else if (r < 0.52) { // twigs, roots, crumbs: dirt and sparse grass
						if (rand() < 0.2 * (out.dirt + out.sparse) * (1 - out.wet)) {
							const k = rand();
							if (k < 0.5) emit(p, pick([4, 5]), lx, lz, size(DECALS[2].size), yaw);
							else if (k < 0.72) emit(p, 6, lx, lz, size(DECALS[3].size), yaw);
							else emit(p, 7, lx, lz, size(DECALS[4].size), yaw);
						}
					} else if (r < 0.7) { // pebbles: along the path's edges and the shore
						if (rand() < 0.36 * edgePath + 0.26 * shore + 0.22 * 4 * out.stone * (1 - out.stone)) emit(p, pick([8, 9, 10]), lx, lz, size(DECALS[5].size), yaw);
					} else if (r < 0.84) { // moss on damp soil
						if (rand() < 0.42 * out.damp * (1 - out.mud)) emit(p, pick([12, 13]), lx, lz, size(DECALS[7].size), yaw);
					} else if (r < 0.9) { // cracks on dry dirt
						if (rand() < 0.1 * smooth(out.dirt, 0.6, 0.9) * (1 - out.wetness)) emit(p, 14, lx, lz, size(DECALS[8].size), yaw);
					} else if (rand() < 0.5 * out.mud + 0.12 * smooth(out.wetness, 0.5, 0.9) * out.dirt) { // splashes at the mud ring and the wet dirt
						emit(p, 15, lx, lz, size(DECALS[9].size), yaw);
					}
				}
			}
			this.authoredDecals(emit, rand, out);
		}
		this.decalMeshes.forEach((m, cell) => {
			m.count = counts[cell];
			m.instanceMatrix.needsUpdate = true;
			m.instanceColor.needsUpdate = true;
			m.visible = counts[cell] > 0 && this.near !== false;
		});
		this.counts.decals = counts.reduce((a, b) => a + b, 0);
		this.scatterPlants(rand);
	}

	/** Decals that belong to a prop: leaves, twigs, roots round the stump, pebbles round the stones (the natural sample's local coordinates). */
	authoredDecals(emit, rand, out) {
		const p = this.patches.find((x) => x.sample.pond);
		if (!p || !this.stage) return;
		for (const item of this.stage.decalSpots) {
			this.probe(p, item.x, item.z, out);
			emit(p, item.cell, item.x, item.z, item.size, rand() * Math.PI * 2, 0.004);
		}
	}

	scatterPlants(rand) {
		const p = this.patches.find((x) => x.sample.pond);
		const counts = [0, 0, 0, 0];
		const placed = [[], [], [], []];
		if (p && this.settings.plants > 0) {
			const { pond } = p.sample;
			const dummy = new THREE.Object3D();
			const color = new THREE.Color();
			const out = { raw: new Float32Array(8), m: new Float32Array(8), w: new Float32Array(8) };
			const tries = Math.round(2600 * this.settings.plants);
			for (let t = 0; t < tries; t++) {
				const lx = pond.x + (rand() * 2 - 1) * (pond.rx + 3.4);
				const lz = pond.z + (rand() * 2 - 1) * (pond.rz + 3.4);
				const d = pondDistance(pond, p.sample.seed, lx, lz);
				if (d < -0.85 || d > 2.6) continue;
				const clump = kit.noise2(lx * 0.65, lz * 0.65, 81) * 0.5 + 0.5;
				const chance = smooth(d, -0.85, -0.25) * (1 - smooth(d, 1.2, 2.6)) * smooth(clump, 0.38, 0.62);
				if (rand() > chance) continue;
				this.probe(p, lx, lz, out);
				if (out.path > 0.3) continue;
				// in the water and on the bank: cattails and tall reeds out in the shallows, sedge and horsetail on the bank
				const cell = d < 0.1 ? (rand() < 0.5 ? 0 : 1) : d < 1.2 ? pick4(rand, [0, 1, 2, 3, 2, 3]) : pick4(rand, [2, 2, 3]);
				if (counts[cell] >= CAPACITY) continue;
				const [h0, h1] = [[1.0, 1.55], [1.0, 1.65], [0.42, 0.72], [0.5, 0.95]][cell];
				// clumps differ in size; spacing: no two plants of a kind closer than 0.3 m; each leans a little (outward from the pond), with its own width
				const clumpSize = 0.72 + 0.62 * (kit.noise2(lx * 0.31, lz * 0.31, 83) * 0.5 + 0.5);
				if (placed[cell].some((q) => (q[0] - lx) ** 2 + (q[1] - lz) ** 2 < 0.09)) continue;
				placed[cell].push([lx, lz]);
				const h = (h0 + (h1 - h0) * rand() ** 1.5) * clumpSize;
				const lum = Math.max(1e-4, 0.2126 * out.mean[0] + 0.7152 * out.mean[1] + 0.0722 * out.mean[2]);
				color.setRGB(1 + 0.3 * (out.mean[0] / lum - 1), 1 + 0.3 * (out.mean[1] / lum - 1), 1 + 0.3 * (out.mean[2] / lum - 1)).multiplyScalar(0.85 + rand() * 0.25);
				dummy.position.set(p.c.x + lx, groundHeight(p.sample, lx, lz) - 0.02, p.c.z + lz);
				const out2 = Math.atan2(lz - pond.z, lx - pond.x);
				dummy.rotation.set((rand() - 0.5) * 0.22 + Math.sin(out2) * 0.07, rand() * Math.PI, (rand() - 0.5) * 0.22 - Math.cos(out2) * 0.07, 'YXZ');
				dummy.scale.set(h * (0.55 + rand() * 0.7), h, h * (0.55 + rand() * 0.7));
				dummy.updateMatrix();
				this.plantMeshes[cell].setMatrixAt(counts[cell], dummy.matrix);
				this.plantMeshes[cell].setColorAt(counts[cell], color);
				counts[cell]++;
			}
		}
		this.plantMeshes.forEach((m, cell) => {
			m.count = counts[cell];
			m.instanceMatrix.needsUpdate = true;
			m.instanceColor.needsUpdate = true;
			m.visible = counts[cell] > 0 && this.near !== false;
		});
		this.counts.plants = counts.reduce((a, b) => a + b, 0);
	}

	// ---- authored props ----------------------------------------------------------------------------------------------------------

	/**
	 * Kit pieces whose texture is green rather than dry brown (the shrub atlas mixes autumn and green plants): the colour of the atlas under the piece's UVs,
	 * read from a small canvas copy. Falls back to every piece when the image cannot be read.
	 */
	greenPieces(pieces) {
		try {
			const canvases = new Map();
			const keep = pieces.filter((piece) => {
				const image = piece.material.map?.image;
				const uv = piece.geometry.attributes.uv;
				if (!image || !uv) return true;
				if (!canvases.has(image)) {
					const c = document.createElement('canvas');
					c.width = c.height = 256;
					const g = c.getContext('2d', { willReadFrequently: true });
					g.drawImage(image, 0, 0, 256, 256);
					canvases.set(image, g);
				}
				const g = canvases.get(image);
				let r = 0;
				let gr = 0;
				let n = 0;
				for (let i = 0; i < uv.count; i += Math.max(1, Math.floor(uv.count / 60))) {
					const px = g.getImageData(Math.min(255, Math.floor(uv.getX(i) * 256)), Math.min(255, Math.floor((piece.material.map.flipY ? 1 - uv.getY(i) : uv.getY(i)) * 256)), 1, 1).data;
					r += px[0];
					gr += px[1];
					n++;
				}
				return gr / n >= 0.95 * (r / n);
			});
			return keep.length ? keep : pieces;
		} catch (error) {
			console.warn('Could not read the shrub atlas colours; using every shrub piece', error);
			return pieces;
		}
	}

	/**
	 * A kit piece whose atlas is desaturated and darkened (the dead-tree atlas is saturated orange, which sits outside the Dark Wood palette): a canvas copy
	 * of the atlas drawn with a CSS filter, on a cloned material. Falls back to a plain dark tint when the image cannot be read.
	 */
	muted(mesh, saturation, brightness) {
		const map = mesh.material.map;
		const m = mesh.material.clone();
		try {
			const image = map.image;
			const size = Math.min(1024, image.width || 1024);
			const c = document.createElement('canvas');
			c.width = c.height = size;
			const g = c.getContext('2d');
			g.filter = `saturate(${saturation}) brightness(${brightness})`;
			g.drawImage(image, 0, 0, size, size);
			const tex = new THREE.CanvasTexture(c);
			Object.assign(tex, { flipY: map.flipY, colorSpace: map.colorSpace, wrapS: map.wrapS, wrapT: map.wrapT, anisotropy: map.anisotropy });
			m.map = tex;
			this.ownTextures.push(tex);
		} catch (error) {
			console.warn('Could not desaturate the log atlas; tinting it instead', error);
			m.color = (m.color ?? new THREE.Color(1, 1, 1)).clone().multiplyScalar(0.4);
		}
		this.ownMaterials.push(m);
		return { geometry: mesh.geometry, material: m, name: mesh.name };
	}

	/** Source mesh of a loaded GLB or kit piece. */
	meshOf(gltf) {
		let found = null;
		gltf?.scene.traverse((o) => { if (o.isMesh && !found) found = o; });
		return found;
	}

	/**
	 * A deterministic composition on the natural sample: a mossy stump with mushrooms, roots and leaves; two riverbank stone clusters at the shore with pebbles; a
	 * fallen log at a grass edge; shrubs at the dense-grass edges; a few small mossy rocks along the path. Each prop gets a contact shadow quad; the sun casts the rest.
	 * Positions are patch-local (m); the pond is at (-5.5, -4).
	 */
	buildProps() {
		const p = this.patches.find((x) => x.sample.pond);
		if (!p) return;
		const { sample, c } = p;
		const r = kit.rng(5521);
		this.stage = { decalSpots: [] };
		const out = { raw: new Float32Array(8), m: new Float32Array(8), w: new Float32Array(8) };
		const tinted = new Map();
		const tint = (mesh, rgb) => {
			// kit pieces share one atlas material: a tinted clone per (material, tint) so the Tripo colours sit in the Dark Wood palette
			const key = `${mesh.material.uuid}:${rgb.join(',')}`;
			if (!tinted.has(key)) {
				const m = mesh.material.clone();
				m.color = (m.color ?? new THREE.Color(1, 1, 1)).clone().multiply(new THREE.Color(...rgb));
				this.ownMaterials.push(m);
				tinted.set(key, m);
			}
			return { geometry: mesh.geometry, material: tinted.get(key), name: mesh.name };
		};
		const put = (mesh, x, z, { scale = 1, yaw = 0, sink = 0.02, tilt = 0, ao = 1.5, ground = true, shadow = true } = {}) => {
			const m = new THREE.Mesh(mesh.geometry, mesh.material);
			m.name = `Prop · ${mesh.name || 'mesh'}`;
			m.position.set(c.x + x, groundHeight(sample, x, z) - sink, c.z + z);
			m.rotation.set(tilt, yaw, 0, 'YXZ');
			m.scale.setScalar(scale);
			m.castShadow = shadow;
			m.receiveShadow = true;
			m.userData.labNoPick = true;
			this.props.add(m);
			this.counts.props++;
			if (ground) {
				mesh.geometry.computeBoundingBox();
				const box = mesh.geometry.boundingBox;
				const w = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * scale;
				const blob = new THREE.Mesh(this.aoGeometry, this.aoMaterial);
				blob.scale.setScalar(w * ao);
				const n = this.groundNormal(sample, x, z);
				blob.position.set(c.x + x, groundHeight(sample, x, z), c.z + z).addScaledVector(n, 0.016);
				blob.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n); // lies on the slope, like the decals
				blob.renderOrder = 1;
				blob.userData.labNoPick = true;
				this.props.add(blob);
			}
			return m;
		};
		const ring = (cx, cz, n, rad, cells, size) => {
			for (let i = 0; i < n; i++) {
				const a = (i / n) * Math.PI * 2 + r();
				this.stage.decalSpots.push({ x: cx + Math.cos(a) * rad * (0.6 + r() * 0.7), z: cz + Math.sin(a) * rad * (0.6 + r() * 0.7), cell: cells[Math.floor(r() * cells.length)], size: size[0] + (size[1] - size[0]) * r() });
			}
		};
		const stump = this.meshOf(this.propGltf.stump);
		const mush = this.meshOf(this.propGltf.mushrooms);
		const stones = this.meshOf(this.propGltf.stones);
		// 1. the stump on the grass east of the pond, mushrooms at its foot, roots / leaves / twigs round it
		const sx = 7.2;
		const sz = -3.6;
		if (stump) put(stump, sx, sz, { yaw: 0.6, sink: 0.04, ao: 1.7 });
		if (mush) {
			put(mush, sx - 0.62, sz + 0.5, { yaw: 2.1, scale: 1.1, sink: 0.01, ao: 1.5, shadow: false });
			put(mush, sx + 0.85, sz + 0.65, { yaw: 4.0, scale: 0.8, sink: 0.01, ao: 1.4, shadow: false });
		}
		ring(sx, sz, 5, 1.1, [0, 1, 2], [0.5, 0.75]);
		ring(sx, sz, 2, 0.9, [4, 5], [0.6, 0.85]);
		this.stage.decalSpots.push({ x: sx + 0.5, z: sz - 0.9, cell: 6, size: 1.2 }, { x: sx - 1.0, z: sz + 0.2, cell: 6, size: 1.0 }, { x: sx - 0.2, z: sz + 0.9, cell: 7, size: 0.6 });
		// 2. two riverbank stone clusters on the bank (placed round the pond's rim), pebbles round them
		const pond = sample.pond;
		for (const [a, k, rr] of [[0.75, 1.0, 0.9], [3.7, 0.8, 1.5]]) {
			const x = pond.x + Math.cos(a) * (pond.rx + 0.9);
			const z = pond.z + Math.sin(a) * (pond.rz + 0.9);
			if (stones) put(stones, x, z, { yaw: r() * 6.28, scale: k, sink: 0.07, ao: 1.4 });
			ring(x, z, 4, 0.9, [8, 9, 10], [0.25, 0.42]);
			if (rr > 1) ring(x, z, 3, 1.3, [12], [0.7, 1.0]);
		}
		// 2b. small stones: scaled-down copies of the Tripo stone cluster scattered along the shore (instead of big flat decal plates)
		if (stones) {
			for (let i = 0; i < 12; i++) {
				const a = r() * Math.PI * 2;
				const k = 0.35 + r() * 0.9;
				const x = pond.x + Math.cos(a) * (pond.rx + 0.5 + k);
				const z = pond.z + Math.sin(a) * (pond.rz + 0.5 + k);
				this.probe(p, x, z, out);
				if (out.path > 0.3 || Math.hypot(x - sx, z - sz) < 1.6) continue;
				put(stones, x, z, { yaw: r() * 6.28, scale: 0.16 + r() * 0.14, sink: 0.025, ao: 1.15, shadow: false });
			}
		}
		// 3. a fallen log at a grass edge
		const log = this.kits.trees?.fallen ?? this.kits.trees?.branches ?? Object.values(this.kits.trees ?? {})[0];
		if (log) {
			log.geometry.computeBoundingBox();
			const len = log.geometry.boundingBox.max.x - log.geometry.boundingBox.min.x;
			put(this.muted(log, 0.28, 0.62), -10.2, 6.8, { scale: 2.6 / Math.max(len, 0.5), yaw: 0.35, sink: 0.05, ao: 1.35 });
			ring(-10.2, 6.8, 4, 1.4, [0, 1, 4, 5], [0.45, 0.7]);
		}
		// 4. shrubs on the dense-grass edge (found on the splat), small mossy rocks along the path
		const shrubs = this.greenPieces(Object.values(this.kits.shrubs ?? {}));
		const rocks = Object.values(this.kits.rocks ?? {});
		let nShrubs = 0;
		let nRocks = 0;
		let nPebbles = 0;
		for (let i = 0; i < 6000 && (nShrubs < 6 || nRocks < 6 || nPebbles < 8); i++) {
			const x = (r() * 2 - 1) * 13.5;
			const z = (r() * 2 - 1) * 13.5;
			if (sample.pond && pondDistance(sample.pond, sample.seed, x, z) < 3.5) continue;
			if (Math.hypot(x - sx, z - sz) < 2.2) continue;
			this.probe(p, x, z, out);
			if (shrubs.length && nShrubs < 6 && out.dense > 0.25 && out.dense < 0.7 && out.path < 0.05) {
				const piece = shrubs[Math.floor(r() * shrubs.length)];
				piece.geometry.computeBoundingBox();
				const wd = piece.geometry.boundingBox.max.x - piece.geometry.boundingBox.min.x;
				put(tint(piece, [0.55, 0.72, 0.45]), x, z, { scale: (1.25 + r() * 0.75) / Math.max(wd, 0.4), yaw: r() * 6.28, sink: 0.03, ao: 1.5 });
				nShrubs++;
			} else if (rocks.length && nRocks < 6 && 4 * out.path * (1 - out.path) > 0.55) {
				const piece = rocks[Math.floor(r() * rocks.length)];
				piece.geometry.computeBoundingBox();
				const wdt = piece.geometry.boundingBox.max.x - piece.geometry.boundingBox.min.x;
				put(tint(piece, [0.45, 0.5, 0.45]), x, z, { scale: (0.35 + r() * 0.3) / Math.max(wdt, 0.5), yaw: r() * 6.28, sink: 0.06, ao: 1.3 });
				this.stage.decalSpots.push({ x: x + 0.5, z: z + 0.2, cell: 8 + Math.floor(r() * 3), size: 0.32 });
				nRocks++;
			} else if (stones && nPebbles < 8 && 4 * out.path * (1 - out.path) > 0.7) {
				put(stones, x, z, { yaw: r() * 6.28, scale: 0.16 + r() * 0.14, sink: 0.025, ao: 1.15, shadow: false });
				nPebbles++;
			}
		}
	}

	dispose() {
		for (const m of [...(this.decalMeshes ?? []), ...(this.plantMeshes ?? [])]) {
			m.geometry.dispose();
			m.dispose(); // the instance buffers
		}
		// the Tripo props are loaded per visit (loadSample does not cache): free their geometry and every texture
		for (const gltf of Object.values(this.propGltf ?? {})) {
			gltf?.scene.traverse((o) => {
				if (!o.isMesh) return;
				o.geometry.dispose();
				for (const mat of Array.isArray(o.material) ? o.material : [o.material]) {
					for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']) mat[key]?.dispose();
					mat.dispose();
				}
			});
		}
		for (const t of this.ownTextures) t.dispose();
		this.decalMaterial?.dispose();
		this.plantMaterial?.dispose();
		this.plantBase?.dispose();
		this.aoMaterial?.dispose();
		for (const m of this.ownMaterials) m.dispose();
		this.aoTexture?.dispose();
		this.aoGeometry?.dispose();
		for (const t of [this.decalTexture, this.plantTexture]) t?.dispose();
		if (this.app._grassCards) {
			delete this.app._grassCards[DECAL_ATLAS];
			delete this.app._grassCards[PLANT_ATLAS];
		}
	}
}

const pick4 = (rand, list) => list[Math.floor(rand() * list.length)];


// ASHLAR · Dungeon: a CRYPT (BIO-08 Bell Catacombs + BIO-04 Old Face: bone, soot, candle gold, "vang, chôn, hợp xướng") and a CAVE (BIO-06 Flint Delvings: chalk, flint, timber,
// a red-orange kiln glow, "hot, muttering, greedy") side by side, built from the lab's own pieces: the N-layer terrain effect (one LayerSplat + material per area, the biome mix's
// smoothness slider), a water mesh with the waterY gate for the cave's pool, the puddle recipe, Tripo props at real size, decals, FlameField flames, unshadowed point lights with
// 1/f flicker (finite distance), ONE shadowed spot (the bell's shaft), a fake shaft cone, dust motes, a wall fade (dither between the camera and the focus) and a Diablo-style
// radial lantern in the ground shader. Research: tmp/dungeon-research/REPORT.md (top 12 + pitfalls). Docs: HUONG_DAN.md §7j.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { LayerSplat, buildLayerLibrary, createLayerTerrain } from '../env/terrainLayers.js';
import { smoothParams, shaderMask, finalWeights } from '../env/biomeMix.js';
import { dungeonSurface } from '../env/surfaces.js';
import * as D from '../env/dungeon.js';
import { DungeonDecor } from '../env/dungeonDecor.js';
import { note } from '../ui/gui.js';

export const DUNGEON_DEFAULTS = {
	look: 1,
	time: 'atmo',
	smooth: 0.8,
	antiTiling: true,
	variationScale: 0.18,
	macro: 0.1,
	showWeights: false,
	puddles: 0.3,
	wetDarken: 0.5,
	blendContrast: 0.65,
	lantern: false,
	lanternRadius: 7.5,
	lanternStrength: 0.9,
	lanternDim: 0.35,
	wallFade: true,
	flicker: true,
	shafts: true,
	dust: true,
	decals: 1,
	props: true,
	subject: false,
	waterOpacity: 0.9,
	waterFlow: 1,
};
registerDefaults('dungeon', DUNGEON_DEFAULTS);

const PITCH = THREE.MathUtils.degToRad(55);
const smooth = THREE.MathUtils.smoothstep;

// Lighting presets. `lights` scales every candle / torch / kiln; the cold ambient is the floor under them (never black). Grade, fog and exposure are the scene's post defaults.
const TIMES = {
	atmo: {
		label: 'Hầm tối · khí quyển (mặc định)', hemi: 1.5, sky: '#7a8fb0', ground: '#2c2622', env: 'hdri-night', envI: 0.05, toneMapping: 'aces', exposure: 0.8, lights: 1,
		fog: { enabled: true, color: '#0c0a09', density: 0.05, falloff: 0.35, height: 0, start: 7, inscatter: 0.12 },
		grade: { vignette: 0.55, contrast: 1.12, saturation: 0.98, lift: 0, temperature: -0.02, tint: 0 },
	},
	lookdev: {
		label: 'Soi texture · sáng đều', hemi: 2.4, sky: '#c9d4e4', ground: '#3b352e', env: 'hdri-overcast', envI: 0.25, toneMapping: 'aces', exposure: 0.2, lights: 0.35,
		fog: { enabled: false },
		grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 },
	},
};

// camera views: a target + the area to fit (w x d m) at the ARPG pitch, or a close-up (distance + pitch)
const VIEWS = {
	overview: { label: 'Toàn cảnh (hai khu)', target: [0, 0, 1], w: 66, d: 26 },
	crypt: { label: 'Hầm mộ', target: [D.AREAS.crypt.cx, 0, 2], w: 29, d: 22 },
	cave: { label: 'Hang động', target: [D.AREAS.cave.cx, 0, 0], w: 28, d: 21 },
	bell: { label: 'Chuông rơi (tiêu điểm)', target: [D.AREAS.crypt.cx + D.CRYPT.bell.x, 0.5, D.AREAS.crypt.cz + D.CRYPT.bell.z], dist: 11, pitch: 50 },
	pool: { label: 'Hồ ngầm + lò nung', target: [D.AREAS.cave.cx + 1.5, 0, 1.0], dist: 15, pitch: 50 },
};

/** A plain image sample as a mipmapped DataTexture, rows flipped so the image top is v = 1. */
async function loadPlain(app, id, colorSpace) {
	const img = await app.loader.loadImageData(id);
	const { width: w, height: h } = img;
	const data = new Uint8Array(w * h * 4);
	for (let y = 0; y < h; y++) data.set(img.data.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
	const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
	Object.assign(tex, { name: id, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: Math.min(8, app.backend.caps.maxAnisotropy || 4), colorSpace, needsUpdate: true });
	return tex;
}

/** The ground textures of both areas packed into the layer arrays (once per app). */
async function loadLibrary(app) {
	app._dungeonLibrary ??= buildLayerLibrary(app, D.layerIds().map((id) => ({ key: id, file: D.textureId(id) })));
	return app._dungeonLibrary;
}

export class DungeonScene {
	constructor(app) {
		this.app = app;
		this.id = 'dungeon';
		this.label = 'ASHLAR · Hầm mộ & hang động (dungeon)';
		this.moodKind = 'interior';
		this.mood = null;
		this.scene = new THREE.Scene();
		this.scene.name = 'ASHLAR dungeon';
		this.settings = app.settings.adopt('dungeon');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group(); // flames (rendered in the app's VFX layer)
		this.vfx.name = 'Dungeon VFX';
		this.sun = { direction: new THREE.Vector3(0.3, 1, 0.2).normalize(), color: new THREE.Color(0, 0, 0) };
		this.lights = [];
		this.times = TIMES;
		this.postDefaults = null;
		this.view = 'overview';
		this.defaultSubject = 'd2r-sorceress'; // Play needs a character; the shader ball would not walk
		this.areas = {};
		this.home = this.cameraFor('overview');
		this.lightScale = 1;
		this._focus = new THREE.Vector3();
		this._v = new THREE.Vector3();
	}

	// ---- camera ----------------------------------------------------------------------------------------------------------------

	cameraFor(view) {
		const v = VIEWS[view] ?? VIEWS.overview;
		const { persp } = this.app.rig ?? {};
		const fov = persp?.fov ?? 35;
		const size = this.app.size ?? { w: 16, h: 9 };
		const aspect = size.w / size.h;
		const target = new THREE.Vector3(...v.target);
		if (v.dist) {
			const p = THREE.MathUtils.degToRad(v.pitch);
			return { position: new THREE.Vector3(target.x, target.y + v.dist * Math.sin(p), target.z + v.dist * Math.cos(p)), target, dist: v.dist };
		}
		const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
		const dist = Math.max(v.w / 2 / (t * aspect) + (v.d / 2) * Math.cos(PITCH), (v.d * Math.sin(PITCH)) / (2 * t) + v.d * Math.cos(PITCH) * 0.5) * 1.02;
		return { position: new THREE.Vector3(target.x, dist * Math.sin(PITCH), target.z + dist * Math.cos(PITCH)), target, dist };
	}

	frame(view) {
		const { rig } = this.app;
		this.view = view;
		if (rig.mode !== 'orbit') rig.setMode('orbit');
		const cam = this.cameraFor(view);
		rig.lookAt(cam.position, cam.target);
		rig.persp.near = Math.max(0.1, cam.dist / 200);
		rig.persp.far = Math.max(400, cam.dist * 20);
		rig.persp.updateProjectionMatrix();
		this.placeSubject();
	}

	placeSubject() {
		this.anchor.visible = !!this.settings.subject;
		if (!this.settings.subject) return;
		const c = this.view === 'cave' || this.view === 'pool' ? D.AREAS.cave : D.AREAS.crypt;
		const x = c === D.AREAS.cave ? c.cx + 6.0 : c.cx + 0.4;
		const z = c === D.AREAS.cave ? c.cz + 5.8 : c.cz + 6.5;
		this.anchor.position.set(x, c === D.AREAS.cave ? D.caveHeight(x - c.cx, z - c.cz) + 0.02 : 0.02, z);
	}

	// ---- init ------------------------------------------------------------------------------------------------------------------

	async init() {
		const { app, scene, settings: s } = this;
		scene.add(this.anchor);
		scene.background = new THREE.Color(0x050404);
		if (s.look !== DUNGEON_DEFAULTS.look) {
			Object.assign(s, DUNGEON_DEFAULTS);
			delete app.settings.data.scenePost?.[this.id];
		}
		const library = await loadLibrary(app);
		this.library = library;
		this.group = new THREE.Group();
		this.group.name = 'Dungeon';
		scene.add(this.group);
		this.wallFade = app.backend.effects.createWallFade();
		this.buildLights();
		const sp = smoothParams(s.smooth);
		for (const [kind, def] of Object.entries(D.AREAS)) {
			const splat = new LayerSplat({ size: def.res, originX: def.cx - def.splat / 2, originZ: def.cz - def.splat / 2, extent: def.splat });
			splat.setBlurMetres(sp.blurM, sp.blurWetM);
			const { material, effect } = createLayerTerrain(app, splat, library, def.layers.map((l) => ({ key: l.id, tile: l.tile, ns: 1, mode: D.turnMode(l.id), porosity: D.porosity(l.id) })));
			this.areas[kind] = { kind, def, splat, effect, material, meshes: [], masks: null };
		}
		this.buildCryptFloor();
		this.buildCaveFloor();
		await this.buildCaveWalls();
		this.applyEffectSettings();
		this.regenerate(false);
		await this.buildWater();
		this.decor = new DungeonDecor({ app, group: this.group, vfx: this.vfx, areas: this.areas, library, settings: s, wallFade: this.wallFade });
		try {
			await this.decor.load();
		} catch (error) {
			console.error('Dungeon props / decals failed to load; the areas stay bare', error);
			this.decor = null;
		}
		if (this.decor) {
			this.decor.lightScale = TIMES[s.time]?.lights ?? 1;
			this.decor.build();
			this.applyDressingVisibility();
			this.collectLights();
		}
		await this.applyTime();
		this.placeSubject();
	}

	buildCryptFloor() {
		const { crypt } = this.areas;
		const c = crypt.def;
		const add = (w, d, x, z) => {
			const g = new THREE.PlaneGeometry(w, d);
			g.rotateX(-Math.PI / 2);
			const mesh = new THREE.Mesh(g, crypt.material);
			mesh.name = 'Crypt floor';
			mesh.position.set(c.cx + x, 0, c.cz + z);
			mesh.receiveShadow = true;
			this.group.add(mesh);
			crypt.meshes.push(mesh);
		};
		add(24.9, 16.9, 0, 0);
		add(4.9, 4.9, 0, 10.2); // the entrance corridor
	}

	/** The cave's floor: a polar grid out to the wall (+0.45 m under it), heights from caveHeight. */
	buildCaveFloor() {
		const { cave } = this.areas;
		const c = cave.def;
		const NR = 64;
		const NA = 288;
		const pos = new Float32Array((NR + 1) * NA * 3);
		for (let i = 0; i <= NR; i++) {
			for (let j = 0; j < NA; j++) {
				const a = (j / NA) * Math.PI * 2;
				const rho = (i / NR) ** 0.92 * (D.caveRadius(a) + 0.45);
				const x = Math.cos(a) * rho;
				const z = Math.sin(a) * rho;
				pos.set([x, D.caveHeight(x, z), z], (i * NA + j) * 3);
			}
		}
		const idx = [];
		for (let i = 0; i < NR; i++) {
			for (let j = 0; j < NA; j++) {
				const k = i * NA + j;
				const k2 = i * NA + ((j + 1) % NA);
				// counter-clockwise seen from above (+y normals): angle grows from +x toward +z, which is clockwise from above, so the order is reversed
				idx.push(k, k2, k + NA, k2, k2 + NA, k + NA);
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		if (g.attributes.normal.getY(NA * 10) < 0) {
			for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
			g.setIndex(idx);
			g.computeVertexNormals();
		}
		const mesh = new THREE.Mesh(g, cave.material);
		mesh.name = 'Cave floor';
		mesh.position.set(c.cx, 0, c.cz);
		mesh.receiveShadow = true;
		this.group.add(mesh);
		cave.meshes.push(mesh);
		this.caveFloorGeometry = g;
	}

	/** The cave's wall: a noise-displaced ring over the outline (2.5-3.5 m, leaning out), UVs from the arc length and the height (no planar stretch), darker toward the top. */
	async buildCaveWalls() {
		const c = D.AREAS.cave;
		const NA = 480;
		const NJ = 14;
		const tile = 3.5;
		const map = await loadPlain(this.app, 'dungeon-cave-floor', THREE.SRGBColorSpace);
		const normalMap = await loadPlain(this.app, 'dungeon-cave-floor-n', THREE.NoColorSpace);
		const rim = [];
		let arc = 0;
		for (let j = 0; j <= NA; j++) {
			const a = ((j % NA) / NA) * Math.PI * 2;
			const R = D.caveRadius(a) + 0.05;
			const p = [Math.cos(a) * R, Math.sin(a) * R];
			if (j) arc += Math.hypot(p[0] - rim[j - 1].p[0], p[1] - rim[j - 1].p[1]);
			rim.push({ a, R, p, arc, H: D.caveWallHeight(a) });
		}
		const pos = [];
		const uv = [];
		const col = [];
		const idx = [];
		for (let j = 0; j <= NA; j++) {
			const { a, R, p, arc: s, H } = rim[j];
			const base = D.caveHeight(p[0] * 0.97, p[1] * 0.97) - 0.3;
			for (let i = 0; i <= NJ; i++) {
				const t = i / NJ;
				const y = H * t;
				const bulge = (D.fbm(a * 6.2 + y * 0.9, y * 1.2 + 3.1) - 0.5) * 1.2 * smooth(t, 0.05, 0.4) + 0.3 * t ** 1.6;
				const r = R + bulge;
				pos.push(Math.cos(a) * r, base + y, Math.sin(a) * r);
				uv.push((s * 1.0) / tile, (y + base) / tile);
				const dark = THREE.MathUtils.lerp(1, 0.05, smooth(t, 0.55, 1.0)) * (0.72 + 0.28 * smooth(t, 0.0, 0.3));
				col.push(dark, dark, dark);
			}
		}
		for (let j = 0; j < NA; j++) {
			for (let i = 0; i < NJ; i++) {
				const k = j * (NJ + 1) + i;
				const k2 = (j + 1) * (NJ + 1) + i;
				idx.push(k, k + 1, k2, k + 1, k2 + 1, k2); // inward-facing (checked below)
			}
		}
		// the lid: a ring from the wall top outward, so no floor of the void shows over the rim
		const lid0 = pos.length / 3;
		for (let j = 0; j <= NA; j++) {
			const { a, R, H } = rim[j];
			const base = D.caveHeight(rim[j].p[0] * 0.97, rim[j].p[1] * 0.97) - 0.3;
			const r1 = R + 0.3 + 0.3 * 1;
			for (const rr of [r1, r1 + 4]) {
				pos.push(Math.cos(a) * rr, base + H, Math.sin(a) * rr);
				uv.push(rim[j].arc / tile, 0);
				col.push(0.03, 0.03, 0.03);
			}
		}
		for (let j = 0; j < NA; j++) {
			const k = lid0 + j * 2;
			idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		// the wall must face the room: flip the wall triangles when their normal points outward
		const n = g.attributes.normal;
		const probe = Math.floor(NA * 0.25) * (NJ + 1) + 4;
		const toCentre = -(pos[probe * 3] * n.getX(probe) + pos[probe * 3 + 2] * n.getZ(probe));
		if (toCentre < 0) {
			const wallTris = NA * NJ * 6;
			for (let i = 0; i < wallTris; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
			// the lid faces up
			g.setIndex(idx);
			g.computeVertexNormals();
		}
		const lidProbe = lid0 + 1;
		if (n.getY(lidProbe) < 0) {
			for (let i = NA * NJ * 6; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
			g.setIndex(idx);
			g.computeVertexNormals();
		}
		const material = new THREE.MeshStandardMaterial({ name: 'Cave wall (chalk rock)', map, normalMap, normalScale: new THREE.Vector2(1.1, 1.1), vertexColors: true, color: new THREE.Color(0.8, 0.78, 0.74), roughness: 0.95, metalness: 0, side: THREE.FrontSide });
		this.wallTextures = [map, normalMap];
		this.caveWallMaterial = material;
		const mesh = new THREE.Mesh(g, this.wallFade.apply(material));
		mesh.name = 'Cave wall';
		mesh.position.set(c.cx, 0, c.cz);
		mesh.receiveShadow = true;
		mesh.castShadow = true;
		this.group.add(mesh);
		this.caveWall = mesh;
	}

	/** The cave's pool: a fine grid at the water level; vertex colour = depth colour, vertex alpha = the fade at the shore (the lab's WebGPU alphaMap reads R, so the fade rides on vertex alpha). */
	async buildWater() {
		const c = D.AREAS.cave;
		const p = D.CAVE.pool;
		const normalMap = await loadPlain(this.app, 'biome-darkwood-water-n', THREE.NoColorSpace);
		const step = 0.08;
		const x0 = p.x - p.rx - 3.5;
		const z0 = p.z - p.rz - 3.5;
		const nx = Math.ceil((p.rx * 2 + 7) / step);
		const nz = Math.ceil((p.rz * 2 + 7) / step);
		const pos = [];
		const uv = [];
		const colors = [];
		const colors2 = [];
		const alpha = new Float32Array((nx + 1) * (nz + 1));
		const sm = (v, e0, e1) => smooth(v, e0, e1);
		const shallow = new THREE.Color(0.014, 0.04, 0.036);
		const deep = new THREE.Color(0.003, 0.014, 0.02);
		const col = new THREE.Color();
		for (let j = 0; j <= nz; j++) {
			for (let i = 0; i <= nx; i++) {
				const x = x0 + i * step;
				const z = z0 + j * step;
				const depth = p.level - D.caveHeight(x, z);
				const a = sm(depth, 0.0, 0.16) * (0.66 + 0.34 * sm(depth, 0.02, 0.4));
				col.copy(shallow).lerp(deep, sm(depth, 0.03, 0.45));
				alpha[j * (nx + 1) + i] = a;
				pos.push(x, p.level, z);
				uv.push(x / 5, -z / 5);
				colors.push(col.r, col.g, col.b, a);
				colors2.push(0.01, 0.03, 0.03, a * 0.2);
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
			return g;
		};
		const material = (name, map, scale, roughness, opacity) => new THREE.MeshPhysicalMaterial({ name, normalMap: map, normalScale: new THREE.Vector2(scale, scale), roughness, metalness: 0, ior: 1.33, specularIntensity: 0.1, envMapIntensity: 0.45, transparent: true, opacity, vertexColors: true, depthWrite: false, emissive: new THREE.Color(0.003, 0.02, 0.019) }); // a faint teal glow of its own: the pool reads in the dark
		this.waterMaterial = material('Pool water', normalMap, 0.45, 0.3, this.settings.waterOpacity);
		const normal2 = normalMap.clone();
		normal2.repeat.set(3.1, 3.1);
		normal2.needsUpdate = true;
		this.waterMaterial2 = material('Pool water · second ripple layer', normal2, 0.4, 0.26, 1);
		this.waterMaterial2.specularIntensity = 0.2;
		const waterFx = this.app.backend.effects.createWaterSpecular?.(); // WebGPU only: honour the capped F90 (see biomeMix.js)
		if (waterFx) {
			this.waterMaterial = waterFx.apply(this.waterMaterial);
			this.waterMaterial2 = waterFx.apply(this.waterMaterial2);
		}
		this.water = new THREE.Mesh(make(colors), this.waterMaterial);
		this.water2 = new THREE.Mesh(make(colors2), this.waterMaterial2);
		this.water2.position.y = 0.002;
		for (const [m, order] of [[this.water, 2], [this.water2, 3]]) {
			m.name = m === this.water ? 'Pool water (surface)' : 'Pool water (second ripple layer)';
			m.position.x = c.cx;
			m.position.z = c.cz;
			m.renderOrder = order;
			m.userData.labNoPick = true;
			this.group.add(m);
		}
		this.waterTextures = [normalMap, normal2];
	}

	// ---- ground ----------------------------------------------------------------------------------------------------------------

	/**
	 * What the hero stands on at world xz (env/surfaces.js, read by character/footsteps.js): the crypt or the cave under the point (outside both: no ground),
	 * its layer weights from its own splat (the blend the GPU draws) and the cave's pool. The crypt has no standing water.
	 */
	surfaceAt(x, z, out) {
		this._surfaceDeps ??= {
			shaderMask,
			finalWeights,
			inside: (kind, lx, lz) => (kind === 'crypt' ? D.cryptWallDistance(lx, lz) > -0.3 : D.caveWallDistance(lx, lz) > -0.3),
			poolDistance: D.poolDistance,
			poolLevel: D.CAVE.pool.level,
			groundHeight: (kind, lx, lz) => D.caveHeight(lx, lz),
		};
		return dungeonSurface(out, (this._areaList ??= Object.values(this.areas)), smoothParams(this.settings.smooth), x, z, this._surfaceDeps);
	}

	fillSplat(area, sp) {
		area.masks = area.kind === 'crypt' ? D.makeCryptMasks(sp) : D.makeCaveMasks(sp);
		const tmp = new Float32Array(8);
		area.splat.setBlurMetres(sp.blurM, sp.blurWetM);
		area.splat.fill((x, z, out) => {
			area.masks(x - area.def.cx, z - area.def.cz, tmp);
			for (let i = 1; i < area.def.layers.length; i++) out[i - 1] = tmp[i];
			out[7] = tmp[7];
		});
	}

	regenerate(scatter = true) {
		const sp = smoothParams(this.settings.smooth);
		for (const a of Object.values(this.areas)) this.fillSplat(a, sp);
		if (scatter) this.decor?.scatterDecals();
	}

	applyEffectSettings() {
		const s = this.settings;
		const sp = smoothParams(s.smooth);
		for (const { effect, kind } of Object.values(this.areas)) {
			const u = effect.uniforms;
			u.softness.value = sp.softness;
			u.heightBlend.value = sp.heightBlend;
			u.edgeNoise.value = sp.edgeNoise;
			u.variation.value = s.antiTiling ? 1 : 0;
			u.variationScale.value = s.variationScale;
			u.macro.value = s.macro;
			u.water.value = s.puddles;
			u.wetDarken.value = s.wetDarken;
			u.waterRough.value = 0.08;
			u.contrast.value = s.blendContrast;
			u.rain.value = 0;
			u.puddleRefl.value = 1.0;
			u.roughMin.value = 0.7;
			u.waterY.value = kind === 'cave' ? D.CAVE.pool.level : -1e4;
			u.sky.value.copy(this.skyTint ?? u.sky.value);
			u.debug.value = s.showWeights ? 1 : 0;
			// the radial lantern (off at strength 0)
			u.lantern.value.w = s.lanternRadius;
			u.lanternP.value.set(2.6, s.lantern ? s.lanternStrength : 0, s.lantern ? s.lanternDim : 0, 0);
		}
	}

	setSmooth(v) {
		this.settings.smooth = v;
		this.applyEffectSettings();
		clearTimeout(this._regen);
		this._regen = setTimeout(() => this.regenerate(), 120);
	}

	// ---- lights ----------------------------------------------------------------------------------------------------------------

	buildLights() {
		this.hemi = new THREE.HemisphereLight(0x7a8fb0, 0x2c2622, 1);
		this.hemi.name = 'Cold ambient (sky / ground)';
		this.scene.add(this.hemi);
		// the hero's lantern light (props, walls and the hero itself; the ground gets the shader pool too): unshadowed, finite
		this.lanternLight = new THREE.PointLight(kelvinToColor(2600), 0, 9, 1.6);
		this.lanternLight.name = 'Player lantern';
		this.scene.add(this.lanternLight);
		this.lights = [
			{ name: 'Cold ambient', light: this.hemi, base: 1 },
			{ name: 'Lantern (player)', light: this.lanternLight, kelvin: 2600, base: 0 },
		];
	}

	/** After the dressing exists: the bell's shadowed spot joins the Lighting panel's list. */
	collectLights() {
		if (this.decor?.spot) this.lights.push({ name: 'Bell shaft (shadowed spot)', light: this.decor.spot, kelvin: 8000, base: this.decor.spot.intensity });
	}

	applyRigIntensity() {
		for (const l of this.lights) if (l.light === this.hemi) l.light.intensity = l.base;
	}

	wetRoots() {
		return [];
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	async applyTime() {
		const t = this.times[this.settings.time] || this.times.atmo;
		this.hemi.color.set(t.sky);
		this.hemi.groundColor.set(t.ground);
		this.lights[0].base = t.hemi;
		this.applyRigIntensity();
		this.lightScale = t.lights;
		if (this.decor) this.decor.lightScale = t.lights;
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		if (this.disposed) return env.dispose?.();
		const previous = this._env;
		this._env = this.scene.environment = env;
		if (previous && previous !== env) previous.dispose?.();
		this.scene.environmentIntensity = t.envI;
		this.scene.background = new THREE.Color(0x050404);
		this.skyTint = new THREE.Color(t.sky).multiplyScalar((t.hemi / Math.PI) * 0.6);
		this.applyEffectSettings();
		this.postDefaults = { toneMapping: t.toneMapping, exposure: t.exposure, fog: { enabled: false, height: 0, ...t.fog }, grade: { vignette: 0.3, ...t.grade } };
	}

	async applyMood(block) {
		this.mood = block;
		await this.applyTime(); // the dungeon keeps its own lighting under every mood
	}

	// ---- panels ----------------------------------------------------------------------------------------------------------------

	buildLightingControls(folder, rebuildLights) {
		if (this.mood) return;
		folder.add(this.settings, 'time', Object.fromEntries(Object.entries(this.times).map(([id, t]) => [t.label, id]))).name('Ánh sáng').onChange(async () => {
			this.app.settings.changed(this.id);
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
	}

	applyDressingVisibility() {
		const s = this.settings;
		if (!this.decor) return;
		this.decor.props.visible = s.props;
		if (this.decor.shaft) this.decor.shaft.visible = s.shafts;
		if (this.decor.points) this.decor.points.visible = s.dust;
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed(this.id);
		const fx = () => (save(), this.applyEffectSettings());
		const state = { view: this.view };
		folder.add(state, 'view', Object.fromEntries(Object.entries(VIEWS).map(([id, v]) => [v.label, id]))).name('Khu vực (khung camera)').onChange((v) => this.frame(v)).listen();
		folder.add(s, 'smooth', 0, 1, 0.01).name('Độ mịn (blend)').onChange((v) => (save(), this.setSmooth(v)));
		const fl = folder.addFolder('Đèn lồng người chơi (lantern)');
		fl.add(s, 'lantern').name('Bật vầng sáng quanh nhân vật / tâm camera').onChange(fx);
		fl.add(s, 'lanternRadius', 4, 12, 0.1).name('Bán kính (m)').onChange(fx);
		fl.add(s, 'lanternStrength', 0, 2, 0.05).name('Độ sáng').onChange(fx);
		fl.add(s, 'lanternDim', 0, 0.8, 0.01).name('Tối dần ngoài vầng sáng').onChange(fx);
		const fa = folder.addFolder('Không khí');
		fa.add(s, 'wallFade').name('Tường mờ dần giữa camera và tâm (dither)').onChange(save);
		fa.add(s, 'flicker').name('Đèn nến chập chờn (1/f)').onChange(save);
		fa.add(s, 'shafts').name('Chùm sáng giả (chuông)').onChange(() => (save(), this.applyDressingVisibility()));
		fa.add(s, 'dust').name('Bụi lơ lửng').onChange(() => (save(), this.applyDressingVisibility()));
		const fd = folder.addFolder('Chi tiết mặt đất');
		fd.add(s, 'decals', 0, 2, 0.05).name('Decal (xương, sáp, vết nứt, đá…) mật độ').onFinishChange(() => (save(), this.decor?.scatterDecals()));
		fd.add(s, 'props').name('Prop 3D (quan tài, cột, chuông, măng đá…)').onChange(() => (save(), this.applyDressingVisibility()));
		fd.add(s, 'puddles', 0, 0.6, 0.01).name('Mực vũng nước (0 = không)').onChange(fx);
		fd.add(s, 'wetDarken', 0, 0.8, 0.01).name('Đất ẩm tối màu').onChange(fx);
		folder.add(s, 'showWeights').name('Debug: trọng số layer').onChange(fx);
		folder.add(s, 'subject').name('Nhân vật mẫu (thước 1.8 m)').onChange(() => (save(), this.placeSubject()));
		note(folder, '<b>Hầm mộ</b> (24×16 m + hành lang): nền đá phiến nave · đá vault tối ở chân tường · bụi dồn góc · đống đổ nát quanh cột gãy · vữa xương trước hốc · lối đi mòn (limestone) · vết thấm ẩm + vũng góc đông nam; tường mô-đun Tripo 4 m (instanced). <b>Hang động</b> (26×20 m): nền phấn · đá lửa vụn · đất sét ướt ở chỗ trũng · flowstone quanh hồ · dải đá tối chân vách · lối ván (BIO12) dọc khung gỗ chống hầm. Màu debug theo thứ tự layer của từng khu.');
		this._viewState = state;
	}

	// ---- per frame -------------------------------------------------------------------------------------------------------------

	/** The point the wall fade and the lantern follow: the hero (Play, or the sample character), else the camera's target. */
	focusPoint() {
		const { app } = this;
		const subject = app.subject?.root;
		if (subject && (app.gameplay?.active || this.settings.subject)) return subject.getWorldPosition(this._focus);
		return this._focus.copy(app.rig.controls.target);
	}

	update(delta, elapsed) {
		if (this._viewState) this._viewState.view = this.view;
		const s = this.settings;
		const { app } = this;
		const focus = this.focusPoint();
		const cam = app.rig.persp.position;
		// the wall fade: a cylinder round the line of sight to the focus, scaled with the camera distance
		const dist = cam.distanceTo(focus);
		const u = this.wallFade.uniforms;
		u.focus.value.set(focus.x, focus.y + 0.9, focus.z);
		u.params.value.set(THREE.MathUtils.clamp(dist * 0.18, 5, 14), s.wallFade ? 1 : 0, 0.35, 0);
		// the lantern: a pool on the ground (shader) + a light for the props / walls
		for (const a of Object.values(this.areas)) a.effect.uniforms.lantern.value.set(focus.x, focus.y, focus.z, s.lanternRadius);
		this.lanternLight.position.set(focus.x, focus.y + 2.2, focus.z);
		this.lanternLight.intensity = s.lantern ? 18 * s.lanternStrength : 0;
		this.decor?.update(elapsed, delta);
		if (this.waterMaterial) {
			const t = elapsed * s.waterFlow;
			this.waterMaterial.normalMap.offset.set(t * 0.01, t * 0.006);
			this.waterMaterial2.normalMap.offset.set(-t * 0.008, t * 0.01);
		}
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.group);
	}

	// ---- leaving ---------------------------------------------------------------------------------------------------------------

	/**
	 * Leaving the scene (the App keeps scenes cached and never calls dispose). WebGL2: everything is freed (the layer arrays, atlases, props, splats) and the scene leaves the
	 * App's cache, so coming back builds it again. WebGPU / webgpu-gl: a rebuilt scene renders black (the lab's known scene-switch bug), so it stays cached and only the layer
	 * arrays lose their GPU copies (they upload again from the CPU data); textures bound to cached materials are NOT disposed.
	 */
	activate() {
		this.app.world.vfxScene.add(this.vfx);
	}

	deactivate() {
		this.app.world.vfxScene.remove(this.vfx);
		if (this.app.backend.kind === 'webgl') {
			this.app.sceneCache.delete(this.id);
			this.app._dungeonLibrary = null;
			const free = () => this.dispose();
			const hold = this.app.renderHold;
			if (hold) hold.then(free, free);
			else free();
			return;
		}
		for (const t of [this.library?.map, this.library?.normalMap, this.library?.ormMap]) t?.dispose();
	}

	dispose() {
		if (this.disposed) return;
		this.disposed = true;
		clearTimeout(this._regen);
		const lib = this.library;
		if (lib) for (const t of [lib.map, lib.normalMap, lib.ormMap]) t.dispose();
		for (const a of Object.values(this.areas)) {
			a.splat.dispose();
			a.material.dispose();
			for (const m of a.meshes) m.geometry.dispose();
		}
		this.caveWall?.geometry.dispose();
		this.caveWallMaterial?.dispose();
		for (const t of this.wallTextures ?? []) t.dispose();
		this.water?.geometry.dispose();
		this.water2?.geometry.dispose();
		for (const t of this.waterTextures ?? []) t.dispose();
		this.waterMaterial?.dispose();
		this.waterMaterial2?.dispose();
		this.decor?.dispose();
		this._env?.dispose?.();
	}
}

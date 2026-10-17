// Act I exterior — an original "burial grounds" scene in the spirit of the first act: a ruined gothic
// chapel, two grave plots behind broken fences, dead trees, wind-blown moor grass, torches and a
// campfire under a cold moon. Everything is procedural (kit.js + forged textures).
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { act1Materials } from '../env/materials.js';
import { FlameField } from '../env/flames.js';
import * as kit from '../env/kit.js';

registerDefaults('graveyard', {
	time: 'night',
	merge: true,
	grassDensity: 1,
	wind: 0.22,
	torchIntensity: 1,
	torchShadows: false,
});

export const GRAVEYARD_TIMES = {
	night: { label: 'Night · moon + torches', moonK: 9000, moon: 0.32, sunElev: 52, sunAz: -145, hemi: 0.32, env: 'hdri-night', envI: 0.35, bgI: 0.4, exposure: 1.3, fog: { color: '#1b2330', density: 0.045, falloff: 0.28, start: 4, inscatter: 0.35 } },
	dusk: { label: 'Dusk · low sun', moonK: 2700, moon: 2.4, sunElev: 9, sunAz: -105, hemi: 0.45, env: 'hdri-overcast', envI: 0.3, bgI: 0.45, exposure: 0.2, fog: { color: '#5d4637', density: 0.035, falloff: 0.22, start: 6, inscatter: 1.6 } },
	overcast: { label: 'Overcast day', moonK: 6800, moon: 0.9, sunElev: 48, sunAz: -60, hemi: 0.6, env: 'hdri-overcast', envI: 1.0, bgI: 0.9, exposure: -0.3, fog: { color: '#7d858c', density: 0.022, falloff: 0.2, start: 8, inscatter: 0.2 } },
};

const CHAPEL = { minX: -4.4, maxX: 4.4, minZ: -14.4, maxZ: -1.6 };
const smooth = (e0, e1, x) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

export class GraveyardScene {
	constructor(app) {
		this.app = app;
		this.id = 'graveyard';
		this.label = 'Act I · Burial grounds (exterior)';
		this.moodKind = 'exterior';
		this.mood = null; // Act I mood block (lighting/moods.js) driving the lights while set
		this.scene = new THREE.Scene();
		this.scene.name = 'Graveyard';
		this.settings = app.settings.adopt('graveyard');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group();
		this.vfx.name = 'Graveyard VFX';
		this.home = { position: new THREE.Vector3(7.5, 4.6, 15.5), target: new THREE.Vector3(0, 1.0, 4.5) };
		this.sun = { direction: new THREE.Vector3(), color: new THREE.Color() };
		this.lights = [];
		this.postDefaults = null;
		this.path = new THREE.CatmullRomCurve3([
			new THREE.Vector3(3, 0, 40), new THREE.Vector3(1.5, 0, 28), new THREE.Vector3(-0.6, 0, 17), new THREE.Vector3(0.2, 0, 8), new THREE.Vector3(0, 0, -1.2),
		]);
		this.pathSamples = this.path.getSpacedPoints(80);
	}

	height(x, z) {
		let h = kit.noise2(x * 0.035, z * 0.035, 1) * 1.7 + kit.noise2(x * 0.11, z * 0.11, 2) * 0.35;
		const flat = smooth(20, 11, Math.hypot(x, (z + 4) * 0.8));
		h *= 1 - 0.88 * flat;
		return h - 0.05;
	}

	distanceToPath(x, z) {
		let best = Infinity;
		for (const p of this.pathSamples) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2);
		return Math.sqrt(best);
	}

	inChapel(x, z, pad = 0) {
		return x > CHAPEL.minX - pad && x < CHAPEL.maxX + pad && z > CHAPEL.minZ - pad && z < CHAPEL.maxZ + pad;
	}

	async init() {
		const app = this.app;
		this.mat = act1Materials(app);
		this.scene.add(this.anchor);
		const y = this.height(0, 5.5);
		this.anchor.position.set(0, y + 0.02, 5.5);

		this.buildTerrain();
		this.buildStatic();
		this.buildGrass();
		this.buildLights();

		this.windGrass = app.backend.effects.create('wind', { strength: this.settings.wind, height: 1, frequency: 1.9 });
		this.windTrees = app.backend.effects.create('wind', { strength: this.settings.wind * 0.35, height: 6, frequency: 0.9, gust: 0.8 });
		this.grass.material = this.windGrass.apply(this.grass.material);
		this.treeMaterial = this.windTrees.apply(this.treeMaterial);
		for (const t of this.trees) t.material = this.treeMaterial;

		await this.applyTime();
	}

	buildTerrain() {
		const size = 96;
		const segs = 150;
		const g = new THREE.PlaneGeometry(size, size, segs, segs);
		g.rotateX(-Math.PI / 2);
		const pos = g.attributes.position;
		const colors = new Float32Array(pos.count * 3);
		const uv = new Float32Array(pos.count * 2);
		const dirtTint = new THREE.Color(0.78, 0.6, 0.45);
		const c = new THREE.Color();
		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i);
			const z = pos.getZ(i);
			pos.setY(i, this.height(x, z));
			const path = 1 - smooth(1.4, 3.2, this.distanceToPath(x, z));
			const patches = smooth(0.25, 0.65, kit.noise2(x * 0.09, z * 0.09, 5) * 0.5 + 0.5);
			const chapel = this.inChapel(x, z, 1.5) ? 0.8 : 0;
			const dirt = Math.min(1, path * 0.9 + patches * 0.55 + chapel);
			c.setRGB(1, 1, 1).lerp(dirtTint, dirt).multiplyScalar(0.92 + 0.16 * kit.noise2(x * 0.3, z * 0.3, 9));
			colors.set([c.r, c.g, c.b], i * 3);
			uv[i * 2] = x;
			uv[i * 2 + 1] = -z;
		}
		g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
		g.computeVertexNormals();
		const ground = new THREE.Mesh(g, this.mat.ground);
		ground.receiveShadow = true;
		ground.name = 'Terrain';
		this.ground = ground;
		this.scene.add(ground);

		// Cobbled path ribbon following the curve, draped on the terrain.
		const pts = this.path.getSpacedPoints(120);
		const positions = [];
		const indices = [];
		const half = 1.15;
		for (let i = 0; i < pts.length; i++) {
			const p = pts[i];
			const next = pts[Math.min(i + 1, pts.length - 1)];
			const prev = pts[Math.max(i - 1, 0)];
			const dir = next.clone().sub(prev).setY(0).normalize();
			const side = new THREE.Vector3(-dir.z, 0, dir.x);
			for (const s of [-1, 1]) {
				const x = p.x + side.x * half * s;
				const z = p.z + side.z * half * s;
				positions.push(x, this.height(x, z) + 0.045, z);
			}
			if (i < pts.length - 1) {
				const a = i * 2;
				indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
			}
		}
		const pg = new THREE.BufferGeometry();
		pg.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		pg.setIndex(indices);
		pg.computeVertexNormals();
		kit.worldUV(pg);
		const path = new THREE.Mesh(pg, this.mat.cobble);
		path.receiveShadow = true;
		path.name = 'Path';
		this.pathMesh = path;
		this.scene.add(path);
	}

	buildStatic() {
		const m = this.mat;
		const batch = new kit.StaticBatch('Graveyard static');
		const r = kit.rng(1337);
		const H = 5.4;

		// Chapel walls (front with door, sides with windows, ruined back).
		const front = [
			{ x: -3.0, len: 2.8, type: 'wall', jag: 0.4 },
			{ x: 0, len: 3.2, type: 'door' },
			{ x: 3.0, len: 2.8, type: 'wall', jag: 1.2 },
		];
		for (const f of front) {
			const geo = f.type === 'door' ? kit.archPanel({ length: f.len, height: H, thickness: 0.8, openingWidth: 1.9, openingHeight: 3.4, sill: 0 }) : kit.wallPanel({ length: f.len, height: H, thickness: 0.8, jag: f.jag, seed: f.x });
			batch.add(geo, m.stone, { position: [f.x, 0, -2] });
		}
		for (const side of [-1, 1]) {
			for (let i = 0; i < 4; i++) {
				const z = -3.5 - i * 3;
				if (side === 1 && i === 2) {
					batch.add(kit.wallPanel({ length: 3, height: 1.3, thickness: 0.8, jag: 0.9, seed: 40 }), m.stone, { position: [4, 0, z], rotation: [0, Math.PI / 2, 0] });
					continue;
				}
				const geo = i % 2 === 0
					? kit.archPanel({ length: 3, height: H, thickness: 0.8, openingWidth: 1.15, openingHeight: 2.9, sill: 1.3 })
					: kit.wallPanel({ length: 3, height: H, thickness: 0.8, jag: 0.6 + r() * 1.6, seed: i * 3 + side });
				batch.add(geo, m.stone, { position: [side * 4, 0, z], rotation: [0, Math.PI / 2, 0] });
			}
		}
		batch.add(kit.archPanel({ length: 8.8, height: H + 1.2, thickness: 0.8, openingWidth: 2.4, openingHeight: 4.4, sill: 1.4 }), m.stone, { position: [0, 0, -14] });
		for (const [x, z] of [[-4.4, -2], [4.4, -2], [-4.4, -14], [4.4, -14], [-4.4, -8], [4.4, -8]]) {
			batch.add(kit.pillar({ height: z === -8 && x > 0 ? 3.6 : 6.1, size: 0.95 }), m.stone, { position: [x, 0, z] });
		}
		// Interior floor: cobble tiles with a few missing (dirt shows through).
		for (let ix = 0; ix < 3; ix++) {
			for (let iz = 0; iz < 4; iz++) {
				if ((ix === 2 && iz === 1) || (ix === 0 && iz === 3)) continue;
				batch.add(kit.floorTile({ size: 2.6, thickness: 0.18 }), m.cobble, { position: [-2.6 + ix * 2.6, 0.12, -3.3 - iz * 2.95] });
			}
		}
		batch.add(kit.steps({ width: 2.6, count: 2, rise: 0.12, run: 0.45 }), m.stone, { position: [0, 0, -0.6], rotation: [0, Math.PI, 0] });
		batch.add(kit.altar({}), m.weathered, { position: [0, 0.12, -12.4] });
		batch.add(kit.stoneCross({ height: 2.4, span: 1.2, thickness: 0.22 }), m.weathered, { position: [0, 0.12, -13.4] });
		batch.add(kit.column({ height: 3.6, radius: 0.28 }), m.weathered, { position: [-2.2, 0.35, -9.2], rotation: [0, 0.3, Math.PI / 2] });
		batch.add(kit.column({ height: 3.4, radius: 0.28 }), m.weathered, { position: [2.4, 0.12, -6.5] });

		// Rubble inside and around the collapsed east wall.
		for (let i = 0; i < 26; i++) {
			const inside = i < 12;
			const x = inside ? -3.4 + r() * 6.8 : 4.2 + r() * 2.2;
			const z = inside ? -13.5 + r() * 11 : -10 + r() * 4;
			const s = 0.18 + r() * 0.45;
			batch.add(kit.rock({ radius: s, seed: i * 1.7 }), m.stone, { position: [x, this.height(x, z) + (inside ? 0.14 : 0), z], rotation: [r(), r() * 6, r()] });
		}

		// Grave plots east and west of the path.
		this.graves = [];
		for (const side of [-1, 1]) {
			for (let row = 0; row < 3; row++) {
				for (let col = 0; col < 4; col++) {
					if (r() < 0.12) continue;
					const x = side * (7.2 + row * 3.1) + (r() - 0.5) * 0.4;
					const z = 5.5 - col * 3.4 + (r() - 0.5) * 0.5;
					const y = this.height(x, z);
					const style = ['round', 'pointed', 'flat', 'cross'][Math.floor(r() * 4)];
					const facing = side > 0 ? -Math.PI / 2 : Math.PI / 2;
					const tilt = [(r() - 0.5) * 0.25, facing + (r() - 0.5) * 0.3, (r() - 0.5) * 0.2];
					const head = [x - side * 0.9, y - 0.12, z];
					if (style === 'cross') batch.add(kit.stoneCross({ height: 1.3 + r() * 0.5 }), m.weathered, { position: head, rotation: tilt });
					else batch.add(kit.tombstone({ width: 0.55 + r() * 0.25, height: 0.8 + r() * 0.5, style }), m.weathered, { position: head, rotation: tilt });
					batch.add(kit.graveMound({ length: 1.9, width: 0.85, height: 0.22 + r() * 0.12 }), m.dirt, { position: [x + side * 0.3, y - 0.04, z], rotation: [0, Math.PI / 2, 0] });
					this.graves.push(new THREE.Vector3(x, y, z));
				}
			}
			// Broken low stone fence around the plot.
			const x0 = side * 5.4;
			for (let k = 0; k < 5; k++) {
				const z = 7.6 - k * 3.2;
				if (r() < 0.25) continue;
				batch.add(kit.wallPanel({ length: 3, height: 0.95, thickness: 0.4, jag: 0.45, seed: k + side * 10 }), m.stone, { position: [x0, this.height(x0, z) - 0.1, z], rotation: [0, Math.PI / 2, 0] });
			}
			for (let k = 0; k < 4; k++) {
				const x = x0 + side * (1.6 + k * 3);
				if (r() < 0.3) continue;
				batch.add(kit.wallPanel({ length: 3, height: 0.95, thickness: 0.4, jag: 0.45, seed: k * 7 + side }), m.stone, { position: [x, this.height(x, 9) - 0.1, 9] });
			}
		}

		// Scattered boulders on the moor.
		for (let i = 0; i < 30; i++) {
			const a = r() * Math.PI * 2;
			const d = 14 + r() * 26;
			const x = Math.cos(a) * d;
			const z = Math.sin(a) * d;
			if (this.distanceToPath(x, z) < 3 || this.inChapel(x, z, 2)) continue;
			const s = 0.3 + r() * 1.1;
			batch.add(kit.rock({ radius: s, seed: i * 3.3, squash: 0.55 + r() * 0.3 }), m.stone, { position: [x, this.height(x, z) - s * 0.15, z], rotation: [0, r() * 6, 0] });
		}

		// Torch posts, iron cups, campfire ring.
		this.torchSpots = [];
		for (const [x, z] of [[-1.9, 0.3], [1.9, 0.3], [-2.1, 9.5], [2.0, 15.5], [-1.4, 22], [2.5, 27]]) {
			const y = this.height(x, z);
			batch.add(kit.woodenPost({ height: 1.95 }), m.wood, { position: [x, y, z] });
			batch.add(kit.torchCup(), m.iron, { position: [x, y + 1.93, z] });
			this.torchSpots.push(new THREE.Vector3(x, y + 2.03, z));
		}
		this.sconces = [];
		for (const side of [-1, 1]) {
			const pos = new THREE.Vector3(side * 3.58, 2.3, -6.5);
			batch.add(kit.wallBracket(), m.iron, { position: pos.toArray(), rotation: [0, -side * Math.PI / 2, 0] });
			this.sconces.push(pos.clone().add(new THREE.Vector3(-side * 0.32, 0.05, 0)));
		}
		this.fire = new THREE.Vector3(7.5, this.height(7.5, 16.5), 16.5);
		for (let i = 0; i < 9; i++) {
			const a = (i / 9) * Math.PI * 2;
			batch.add(kit.rock({ radius: 0.22, seed: 50 + i, squash: 0.7 }), m.stone, { position: [this.fire.x + Math.cos(a) * 0.75, this.fire.y, this.fire.z + Math.sin(a) * 0.75], rotation: [0, a, 0] });
		}
		for (let i = 0; i < 4; i++) {
			const a = (i / 4) * Math.PI + 0.3;
			batch.add(kit.log({ length: 1.0, radius: 0.08 }), m.bark, { position: [this.fire.x, this.fire.y + 0.1 + i * 0.03, this.fire.z], rotation: [0.2, a, 0.15] });
		}

		this.staticGroup = batch.build(this.settings.merge);
		this.scene.add(this.staticGroup);

		const embers = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), this.mat.ember);
		embers.rotation.x = -Math.PI / 2;
		embers.position.copy(this.fire).add(new THREE.Vector3(0, 0.06, 0));
		this.scene.add(embers);

		// Dead trees (separate meshes so they can sway with the wind effect).
		this.trees = [];
		this.treeMaterial ??= this.mat.bark.clone();
		for (const [x, z, s] of [[-10, 11, 1], [12.5, 13, 1.2], [-14, -15, 0.9], [16, -6, 1.1], [-7, 23, 1], [10, -18, 1.3]]) {
			const tree = new THREE.Mesh(kit.worldUV(kit.deadTree({ seed: Math.round(x * 13 + z), height: 4.5 * s })), this.treeMaterial);
			tree.position.set(x, this.height(x, z), z);
			tree.rotation.y = x;
			tree.castShadow = true;
			tree.receiveShadow = true;
			tree.name = 'Dead tree';
			this.trees.push(tree);
			this.scene.add(tree);
		}
	}

	buildGrass() {
		const density = this.settings.grassDensity;
		const max = Math.round(7000 * density);
		const tuft = kit.grassTuft({ blades: 7, seed: 5 });
		const material = this.mat.grassBlade.clone();
		material.vertexColors = true;
		const mesh = new THREE.InstancedMesh(tuft, material, Math.max(1, max));
		mesh.name = 'Moor grass (instanced)';
		const r = kit.rng(99);
		const dummy = new THREE.Object3D();
		const color = new THREE.Color();
		let n = 0;
		for (let i = 0; i < max * 3 && n < max; i++) {
			const a = r() * Math.PI * 2;
			const d = Math.sqrt(r()) * 34 + 2;
			const x = Math.cos(a) * d;
			const z = Math.sin(a) * d + 2;
			if (this.distanceToPath(x, z) < 1.6 || this.inChapel(x, z, 0.6)) continue;
			const clump = kit.noise2(x * 0.15, z * 0.15, 3) * 0.5 + 0.5;
			if (r() > clump * 1.3) continue;
			dummy.position.set(x, this.height(x, z) - 0.02, z);
			dummy.rotation.set((r() - 0.5) * 0.3, r() * Math.PI * 2, (r() - 0.5) * 0.3);
			const h = 0.22 + r() * 0.38 * (0.4 + clump);
			const w = 0.8 + r() * 0.6;
			dummy.scale.set(w, h, w);
			dummy.updateMatrix();
			mesh.setMatrixAt(n, dummy.matrix);
			const dry = r();
			color.setRGB(0.13 + dry * 0.15, 0.16 + dry * 0.07, 0.06 + dry * 0.04).multiplyScalar(0.8 + r() * 0.35);
			mesh.setColorAt(n, color);
			n++;
		}
		mesh.count = n;
		mesh.instanceMatrix.needsUpdate = true;
		mesh.instanceColor.needsUpdate = true;
		mesh.receiveShadow = true;
		mesh.castShadow = false;
		mesh.frustumCulled = false;
		this.grass = mesh;
		this.scene.add(mesh);
	}

	buildLights() {
		const app = this.app;
		this.moon = new THREE.DirectionalLight(0xffffff, 0.3);
		this.moon.name = 'Moon / sun';
		this.moon.castShadow = true;
		this.moon.shadow.mapSize.set(2048, 2048);
		const cam = this.moon.shadow.camera;
		cam.left = cam.bottom = -26;
		cam.right = cam.top = 26;
		cam.near = 1;
		cam.far = 140;
		this.moon.target.position.set(0, 0, 0);
		this.scene.add(this.moon, this.moon.target);
		this.hemi = new THREE.HemisphereLight(0x2a3656, 0x0d0b08, 0.3);
		this.hemi.name = 'Sky / ground ambient';
		this.scene.add(this.hemi);

		this.flames = new FlameField(app, 32);
		this.vfx.add(this.flames.mesh);
		const torchColor = kelvinToColor(1850);
		const addTorch = (pos, { intensity = 14, distance = 11, shadow = false, flame = {} } = {}) => {
			const light = new THREE.PointLight(torchColor, intensity, distance, 2);
			light.position.copy(pos).add(new THREE.Vector3(0, 0.25, 0));
			light.castShadow = shadow;
			if (shadow) {
				light.shadow.mapSize.set(512, 512);
				light.shadow.bias = -0.002;
				light.shadow.normalBias = 0.03;
				light.shadow.radius = 2;
			}
			light.name = 'Torch light';
			this.scene.add(light);
			this.flames.add(pos, { light, ...flame });
			return light;
		};
		this.torchLights = [];
		this.torchSpots.forEach((p, i) => this.torchLights.push(addTorch(p, { shadow: i < 2 })));
		this.sconces.forEach((p) => this.torchLights.push(addTorch(p, { intensity: 10, distance: 9, flame: { width: 0.24, height: 0.45 } })));
		this.torchLights.push(addTorch(this.fire.clone().add(new THREE.Vector3(0, 0.05, 0)), { intensity: 45, distance: 16, shadow: true, flame: { width: 0.85, height: 1.25, strength: 1.2 } }));
		// Altar candles: small flames, no lights (shows how many flames one draw call can carry).
		for (let i = 0; i < 5; i++) this.flames.add(new THREE.Vector3(-0.8 + i * 0.4, 1.17 + 0.12, -12.4 + (i % 2) * 0.15), { width: 0.06, height: 0.12, strength: 0.8 });

		this.lights = [
			{ name: 'Moon / sun', light: this.moon, kelvin: 9000, base: 0.3 },
			{ name: 'Sky ambient', light: this.hemi, base: 0.3 },
		];
		this.applyTorchSettings();
	}

	applyTorchSettings() {
		const s = this.settings;
		this.flames.lightScale = s.torchIntensity * (this.mood?.torches.scale ?? 1);
		this.torchLights.forEach((l, i) => (l.castShadow = s.torchShadows && (i < 2 || i === this.torchLights.length - 1)));
	}

	applyRigIntensity() {
		for (const l of this.lights) l.light.intensity = l.base;
	}

	setTorchKelvin(kelvin) {
		const color = kelvinToColor(kelvin);
		for (const light of this.torchLights) light.color.copy(color);
	}

	/** Act I mood (lighting/moods.js exterior block) or null to go back to the time-of-day lighting. */
	async applyMood(block) {
		this.mood = block;
		this.setTorchKelvin(block ? block.torches.kelvin : 1850);
		this.applyTorchSettings();
		if (!block) {
			await this.applyTime();
			return;
		}
		const elev = THREE.MathUtils.degToRad(block.moon.elevation);
		const az = THREE.MathUtils.degToRad(block.moon.azimuth);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(60);
		this.moon.color.copy(kelvinToColor(block.moon.kelvin));
		this.lights[0].kelvin = block.moon.kelvin;
		this.lights[0].base = block.moon.lux;
		this.hemi.color.set(block.sky.color);
		this.hemi.groundColor.set(block.sky.ground);
		this.lights[1].base = block.sky.intensity;
		this.applyRigIntensity();
		this.sun.direction.copy(dir);
		this.sun.color.copy(this.moon.color).multiplyScalar(block.sun);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(block.env.id));
		if (this.mood !== block) return;
		this.scene.environment = env;
		this.scene.background = env;
		this.scene.environmentIntensity = block.env.intensity;
		this.scene.backgroundIntensity = block.env.background;
		this.scene.backgroundBlurriness = block.env.blur;
	}

	/** Surfaces that get wet in a rain mood. */
	wetRoots() {
		return [this.ground, this.pathMesh, this.staticGroup, ...this.trees, this.grass];
	}

	async applyTime() {
		const t = GRAVEYARD_TIMES[this.settings.time] || GRAVEYARD_TIMES.night;
		const elev = THREE.MathUtils.degToRad(t.sunElev);
		const az = THREE.MathUtils.degToRad(t.sunAz);
		const dir = new THREE.Vector3(Math.cos(elev) * Math.sin(az), Math.sin(elev), Math.cos(elev) * Math.cos(az));
		this.moon.position.copy(dir).multiplyScalar(60);
		this.moon.color.copy(kelvinToColor(t.moonK));
		this.lights[0].kelvin = t.moonK;
		this.lights[0].base = t.moon;
		this.lights[1].base = t.hemi;
		this.hemi.color.set(0x2a3656);
		this.hemi.groundColor.set(0x0d0b08);
		this.applyRigIntensity();
		this.sun.direction.copy(dir);
		this.sun.color.copy(this.moon.color).multiplyScalar(this.settings.time === 'dusk' ? 0.8 : 0.12);
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample(t.env));
		this.scene.environment = env;
		this.scene.background = env;
		this.scene.environmentIntensity = t.envI;
		this.scene.backgroundIntensity = t.bgI;
		this.scene.backgroundBlurriness = 0.08;
		this.postDefaults = { exposure: t.exposure, fog: { enabled: true, height: 0, ...t.fog } };
	}

	activate() {
		this.app.world.vfxScene.add(this.vfx);
	}

	deactivate() {
		this.app.world.vfxScene.remove(this.vfx);
	}

	update(delta, elapsed) {
		this.flames.update(elapsed);
	}

	/** Rebuild static meshes (merge on/off) without touching lights or grass. */
	rebuildStatic() {
		this.scene.remove(this.staticGroup);
		for (const m of this.staticGroup.children) m.geometry.dispose();
		const keepTrees = this.trees;
		for (const t of keepTrees) this.scene.remove(t);
		this.buildStatic();
		this.app.backend.prepareObject(this.scene);
		this.app.mood?.onSceneRebuilt(this);
	}

	rebuildGrass() {
		this.scene.remove(this.grass);
		this.grass.geometry.dispose();
		this.grass.dispose?.();
		this.buildGrass();
		this.grass.material = this.windGrass.apply(this.grass.material);
		this.app.backend.prepareObject(this.grass);
		this.app.mood?.onSceneRebuilt(this);
	}

	buildLightingControls(folder, rebuildLights) {
		const s = this.settings;
		const save = () => this.app.settings.changed('graveyard');
		if (!this.mood) folder.add(s, 'time', Object.fromEntries(Object.entries(GRAVEYARD_TIMES).map(([id, t]) => [t.label, id]))).name('Time of day').onChange(async () => {
			save();
			await this.applyTime();
			this.app.applyScenePost(this, true);
			rebuildLights();
		});
		folder.add(s, 'torchIntensity', 0, 3, 0.01).name('Torch lights ×').onChange(() => (save(), this.applyTorchSettings()));
		folder.add(s, 'torchShadows').name('Torch + campfire shadows').onChange(() => (save(), this.applyTorchSettings()));
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed('graveyard');
		const stats = () => `${this.staticGroup.userData.pieceCount} kit pieces → ${this.staticGroup.userData.meshCount} meshes · ${this.grass.count.toLocaleString()} grass blades · ${this.torchLights.length} point lights · ${this.flames.entries.length} flames (1 draw)`;
		const info = { text: stats() };
		folder.add(s, 'merge').name('Merge static meshes').onChange(() => {
			save();
			this.rebuildStatic();
			info.text = stats();
		});
		folder.add(s, 'grassDensity', 0, 3, 0.05).name('Grass density').onFinishChange(() => {
			save();
			this.rebuildGrass();
			info.text = stats();
		});
		folder.add(s, 'wind', 0, 1.2, 0.01).name('Wind strength').onChange((v) => {
			save();
			this.windGrass.uniforms.strength.value = v;
			this.windTrees.uniforms.strength.value = v * 0.35;
		});
		folder.add(info, 'text').name('Scene').listen().disable();
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

	dispose() {
		this.scene.traverse((o) => o.geometry?.dispose());
		this.flames.dispose();
	}
}

// Act I interior — an original catacomb level assembled from an ASCII layout with the modular kit:
// floor tiles, wall panels on every floor/solid edge, corner pillars, arched doorways, sconce torches,
// braziers (the Pot of Coals sample), sarcophagi and a waypoint platform.
import * as THREE from 'three';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { act1Materials } from '../env/materials.js';
import { FlameField } from '../env/flames.js';
import * as kit from '../env/kit.js';

registerDefaults('catacombs', {
	merge: true,
	ceiling: false,
	torchIntensity: 1,
	torchShadows: false,
	torchEvery: 2,
});

// # solid · . floor · D doorway · P column · B brazier · T sarcophagus · S subject · W waypoint
export const CATACOMB_MAP = [
	'#############',
	'#...#...#...#',
	'#.P.D.B.D.T.#',
	'#...#...#...#',
	'##D###D###D##',
	'#...........#',
	'#.P...S...P.#',
	'#...........#',
	'#####D#D#####',
	'    #...#    ',
	'    #.W.#    ',
	'    #...#    ',
	'    #####    ',
];

const CELL = 3;
const WALL_H = 3.4;

export class CatacombsScene {
	constructor(app) {
		this.app = app;
		this.id = 'catacombs';
		this.label = 'Act I · Catacombs (interior)';
		this.scene = new THREE.Scene();
		this.scene.name = 'Catacombs';
		this.settings = app.settings.adopt('catacombs');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.vfx = new THREE.Group();
		this.vfx.name = 'Catacombs VFX';
		this.rows = CATACOMB_MAP.length;
		this.cols = CATACOMB_MAP[0].length;
		this.sun = null;
		this.lights = [];
		this.postDefaults = { exposure: 1.1, fog: { enabled: true, color: '#120d0a', density: 0.05, falloff: 0.0, height: 0, start: 3, inscatter: 0 } };
		const s = this.cellCenter(6, 6);
		this.home = { position: new THREE.Vector3(s.x + 11, 17, s.z + 15), target: new THREE.Vector3(s.x, 0.8, s.z) };
	}

	cell(c, r) {
		if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return ' ';
		return CATACOMB_MAP[r][c];
	}

	isFloor(c, r) {
		const ch = this.cell(c, r);
		return ch !== '#' && ch !== ' ';
	}

	cellCenter(c, r) {
		return new THREE.Vector3((c - this.cols / 2 + 0.5) * CELL, 0, (r - this.rows / 2 + 0.5) * CELL);
	}

	async init() {
		this.mat = act1Materials(this.app);
		this.scene.add(this.anchor);
		this.flames = new FlameField(this.app, 96);
		this.vfx.add(this.flames.mesh);
		this.brazierModel = await this.app.loader.loadSample('pot-of-coals').then((g) => g.scene).catch(() => null);
		this.buildStatic();
		this.buildLights();
		const env = this.app.backend.envFromEquirect(await this.app.loader.loadSample('hdri-night'));
		this.scene.environment = env;
		this.scene.environmentIntensity = 0.06;
		this.scene.background = new THREE.Color(0x050403);
	}

	buildStatic() {
		const m = this.mat;
		const batch = new kit.StaticBatch('Catacombs static');
		const r = kit.rng(7);
		this.torchSpots = [];
		this.braziers = [];
		let wallIndex = 0;
		const dirs = [
			{ dc: 0, dr: -1, rot: 0, off: [0, -1] },
			{ dc: 1, dr: 0, rot: -Math.PI / 2, off: [1, 0] },
			{ dc: 0, dr: 1, rot: Math.PI, off: [0, 1] },
			{ dc: -1, dr: 0, rot: Math.PI / 2, off: [-1, 0] },
		];
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				if (!this.isFloor(col, row)) continue;
				const ch = this.cell(col, row);
				const c = this.cellCenter(col, row);
				batch.add(kit.floorTile({ size: CELL, thickness: 0.25 }), m.cobble, { position: [c.x, 0, c.z] });
				if (this.settings.ceiling) batch.add(kit.floorTile({ size: CELL, thickness: 0.3 }), m.stone, { position: [c.x, WALL_H + 0.3, c.z], castShadow: false });

				for (const d of dirs) {
					const nCh = this.cell(col + d.dc, row + d.dr);
					const edge = new THREE.Vector3(c.x + (d.off[0] * CELL) / 2, 0, c.z + (d.off[1] * CELL) / 2);
					if (!this.isFloor(col + d.dc, row + d.dr)) {
						const jag = r() < 0.15 ? 0.6 + r() : 0;
						batch.add(kit.wallPanel({ length: CELL, height: WALL_H, thickness: 0.5, jag, seed: wallIndex }), m.stone, { position: [edge.x, 0, edge.z], rotation: [0, d.rot, 0] });
						wallIndex++;
						if (wallIndex % this.settings.torchEvery === 0 && ch !== 'D') {
							const inward = new THREE.Vector3(-d.off[0], 0, -d.off[1]);
							const pos = edge.clone().addScaledVector(inward, 0.25).setY(2.1);
							batch.add(kit.wallBracket(), m.iron, { position: pos.toArray(), rotation: [0, Math.atan2(inward.x, inward.z), 0] });
							this.torchSpots.push(pos.clone().addScaledVector(inward, 0.32).setY(2.15));
						}
					} else if (ch === 'D' && nCh !== 'D') {
						batch.add(kit.archPanel({ length: CELL, height: WALL_H, thickness: 0.6, openingWidth: 1.9, openingHeight: 3.0, sill: 0 }), m.stone, { position: [edge.x, 0, edge.z], rotation: [0, d.rot, 0] });
					}
				}

				if (ch === 'P') batch.add(kit.column({ height: WALL_H, radius: 0.32 }), m.weathered, { position: [c.x, 0, c.z] });
				if (ch === 'T') {
					batch.add(kit.sarcophagus({}), m.weathered, { position: [c.x, 0, c.z], rotation: [0, Math.PI / 2, 0] });
					for (let i = 0; i < 3; i++) this.flames.add(new THREE.Vector3(c.x - 0.4 + i * 0.4, 1.12, c.z + 0.2), { width: 0.06, height: 0.13, strength: 0.8 });
				}
				if (ch === 'W') {
					const disc = new THREE.CylinderGeometry(1.3, 1.4, 0.18, 32);
					disc.translate(0, 0.09, 0);
					batch.add(disc, m.weathered, { position: [c.x, 0, c.z] });
					this.waypoint = c.clone().setY(0.19);
				}
				if (ch === 'S') this.anchor.position.set(c.x, 0, c.z + 0.6);
				if (ch === 'B') this.braziers.push(c.clone());
				// Bone and rubble litter near walls.
				if (r() < 0.45) {
					const x = c.x + (r() - 0.5) * 2.2;
					const z = c.z + (r() - 0.5) * 2.2;
					batch.add(kit.rock({ radius: 0.12 + r() * 0.22, seed: row * 31 + col }), m.stone, { position: [x, 0, z], rotation: [r(), r() * 6, r()] });
				}
			}
		}
		// Corner pillars wherever a grid vertex touches both floor and solid cells.
		for (let row = 0; row <= this.rows; row++) {
			for (let col = 0; col <= this.cols; col++) {
				const around = [this.isFloor(col - 1, row - 1), this.isFloor(col, row - 1), this.isFloor(col - 1, row), this.isFloor(col, row)];
				const floors = around.filter(Boolean).length;
				if (floors === 0 || floors === 4) continue;
				const x = (col - this.cols / 2) * CELL;
				const z = (row - this.rows / 2) * CELL;
				batch.add(kit.pillar({ height: WALL_H + 0.25, size: 0.75 }), m.stone, { position: [x, 0, z] });
			}
		}
		this.staticGroup = batch.build(this.settings.merge);
		this.scene.add(this.staticGroup);

		// Braziers: the Pot of Coals sample, scaled to ~0.85 m.
		this.brazierGroup?.removeFromParent();
		this.brazierGroup = new THREE.Group();
		this.brazierGroup.name = 'Braziers';
		if (this.brazierModel) {
			const box = new THREE.Box3().setFromObject(this.brazierModel);
			const size = box.getSize(new THREE.Vector3());
			const scale = 0.85 / Math.max(size.x, size.y, size.z);
			for (const b of this.braziers) {
				const pot = this.brazierModel.clone(true);
				pot.scale.setScalar(scale);
				pot.position.set(b.x, -box.min.y * scale, b.z);
				pot.traverse((o) => {
					if (o.isMesh) {
						o.castShadow = true;
						o.receiveShadow = true;
					}
				});
				this.brazierGroup.add(pot);
			}
		}
		this.scene.add(this.brazierGroup);
	}

	buildLights() {
		const torchColor = kelvinToColor(1850);
		this.torchLights?.forEach((l) => l.removeFromParent());
		this.torchLights = [];
		const add = (pos, { intensity = 14, distance = 11, flame = {} } = {}) => {
			const light = new THREE.PointLight(torchColor, intensity, distance, 2);
			light.position.copy(pos).add(new THREE.Vector3(0, 0.25, 0));
			light.shadow.mapSize.set(512, 512);
			light.shadow.bias = -0.002;
			light.shadow.normalBias = 0.03;
			light.name = 'Torch light';
			this.scene.add(light);
			this.torchLights.push(light);
			this.flames.add(pos, { light, ...flame });
		};
		for (const p of this.torchSpots) add(p, { flame: { width: 0.24, height: 0.46 } });
		for (const b of this.braziers) add(b.clone().setY(0.82), { intensity: 26, distance: 13, flame: { width: 0.6, height: 0.9, strength: 1.1 } });
		this.hemi = new THREE.HemisphereLight(0x1a2233, 0x080605, 0.06);
		this.hemi.name = 'Ambient bounce';
		this.scene.add(this.hemi);
		this.lights = [{ name: 'Ambient bounce', light: this.hemi, base: 0.06 }];
		this.applyTorchSettings();
	}

	applyTorchSettings() {
		this.flames.lightScale = this.settings.torchIntensity;
		const shadowed = new Set(this.braziers.map((_, i) => this.torchSpots.length + i));
		this.torchLights.forEach((l, i) => (l.castShadow = this.settings.torchShadows && shadowed.has(i)));
	}

	applyRigIntensity() {
		for (const l of this.lights) l.light.intensity = l.base;
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

	rebuild() {
		this.scene.remove(this.staticGroup);
		for (const mesh of this.staticGroup.children) mesh.geometry.dispose();
		for (const l of this.torchLights) l.removeFromParent();
		this.vfx.remove(this.flames.mesh);
		this.flames.dispose();
		this.flames = new FlameField(this.app, 96);
		this.vfx.add(this.flames.mesh);
		this.buildStatic();
		this.buildLights();
		this.app.backend.prepareObject(this.scene);
		this.app.backend.prepareObject(this.vfx);
	}

	buildLightingControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed('catacombs');
		folder.add(s, 'torchIntensity', 0, 3, 0.01).name('Torch lights ×').onChange(() => (save(), this.applyTorchSettings()));
		folder.add(s, 'torchShadows').name('Brazier shadows (cube maps)').onChange(() => (save(), this.applyTorchSettings()));
	}

	buildEnvironmentControls(folder) {
		const s = this.settings;
		const save = () => this.app.settings.changed('catacombs');
		const stats = () => `${this.staticGroup.userData.pieceCount} kit pieces → ${this.staticGroup.userData.meshCount} meshes · ${this.torchLights.length} point lights · ${this.flames.entries.length} flames (1 draw)`;
		const info = { text: stats() };
		const rebuild = () => {
			save();
			this.rebuild();
			info.text = stats();
		};
		folder.add(s, 'merge').name('Merge static meshes').onChange(rebuild);
		folder.add(s, 'ceiling').name('Ceiling (off for top-down cams)').onChange(rebuild);
		folder.add(s, 'torchEvery', 1, 6, 1).name('Torch every N walls').onFinishChange(rebuild);
		folder.add(info, 'text').name('Scene').listen().disable();
		folder.add({ go: () => this.app.rig.setMode('game') }, 'go').name('Game ¾ camera');
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

	dispose() {
		this.scene.traverse((o) => o.geometry?.dispose());
		this.flames.dispose();
	}
}

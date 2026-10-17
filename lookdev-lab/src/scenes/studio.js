// Neutral lookdev studio: environment (procedural room or HDRI), pedestal, reference balls, colour chart,
// selectable light rigs. The subject model is owned by the App and parented to `anchor`.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { registerDefaults } from '../core/settings.js';
import { createBalls, createColorChecker } from '../lookdev/references.js';
import { STUDIO_RIGS, buildStudioRig, flicker } from '../lighting/studioRigs.js';
import { kelvinToColor } from '../core/grading.js';

registerDefaults('studio', {
	env: 'room',
	envIntensity: 1,
	envRotation: 0,
	background: 'blur',
	bgBlur: 0.45,
	bgIntensity: 0.55,
	bgColor: '#1a1e1b',
	rig: 'softbox',
	rigIntensity: 1,
	rigRotation: 0,
	showBalls: true,
	showChecker: true,
	showPedestal: true,
	floor: 'dark',
});

export const STUDIO_ENVS = {
	room: 'Procedural room (neutral)',
	'hdri-overcast': 'Quarry · overcast',
	'hdri-sun': 'Royal Esplanade · sun',
	'hdri-night': 'Moonless Golf · night',
};

export class StudioScene {
	constructor(app) {
		this.app = app;
		this.id = 'studio';
		this.label = 'Studio';
		this.scene = new THREE.Scene();
		this.scene.name = 'Studio';
		this.settings = app.settings.adopt('studio');
		this.anchor = new THREE.Group();
		this.anchor.name = 'Subject anchor';
		this.scene.add(this.anchor);
		this.lights = [];
		this.rig = null;
		this.envCache = new Map();
		this.customEnv = null;
		this.home = { position: new THREE.Vector3(3.3, 1.85, 4.7), target: new THREE.Vector3(0.05, 0.75, 0) };
		this.sun = { direction: new THREE.Vector3(0.4, 0.8, 0.45).normalize(), color: new THREE.Color(0, 0, 0) };
		this.postDefaults = { exposure: 0, fog: { enabled: false } };
	}

	async init() {
		const { app, scene } = this;
		app.backend.initRectAreaLights();

		const floorMat = new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, name: 'Studio floor' });
		this.floor = new THREE.Mesh(new THREE.CircleGeometry(14, 96), floorMat);
		this.floor.rotation.x = -Math.PI / 2;
		this.floor.receiveShadow = true;
		this.floor.name = 'Floor';
		scene.add(this.floor);

		const stone = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(0.035, 0.038, 0.036), roughness: 0.62, name: 'Pedestal stone' });
		const brass = new THREE.MeshStandardMaterial({ color: new THREE.Color('#c9a464'), roughness: 0.32, metalness: 1, name: 'Pedestal brass' });
		this.pedestal = new THREE.Group();
		this.pedestal.name = 'Pedestal';
		const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.06, 0.12, 96), stone);
		base.position.y = 0.06;
		const rim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.018, 12, 128), brass);
		rim.rotation.x = Math.PI / 2;
		rim.position.y = 0.12;
		for (const m of [base, rim]) {
			m.castShadow = true;
			m.receiveShadow = true;
			this.pedestal.add(m);
		}
		scene.add(this.pedestal);

		this.balls = createBalls();
		this.balls.position.set(-1.55, 0, 0.35);
		scene.add(this.balls);

		this.checker = createColorChecker();
		this.checker.position.set(1.55, 0.83, -0.45);
		this.checker.rotation.y = -0.55;
		scene.add(this.checker);

		this.applyLayout();
		this.applyRig();
		await this.applyEnvironment();
	}

	get anchorY() {
		return this.settings.showPedestal ? 0.12 : 0;
	}

	applyLayout() {
		const s = this.settings;
		this.pedestal.visible = s.showPedestal;
		this.balls.visible = s.showBalls;
		this.checker.visible = s.showChecker;
		this.anchor.position.set(0, this.anchorY, 0);
		const floorColors = { dark: [0.03, 0.032, 0.03], grey: [0.18, 0.18, 0.18], white: [0.7, 0.7, 0.7] };
		this.floor.visible = s.floor !== 'none';
		if (floorColors[s.floor]) this.floor.material.color.setRGB(...floorColors[s.floor]);
	}

	applyRig() {
		if (this.rig) {
			this.scene.remove(this.rig.group);
			this.rig.group.traverse((o) => o.dispose?.());
		}
		const s = this.settings;
		this.rig = buildStudioRig(s.rig);
		this.rig.group.rotation.y = THREE.MathUtils.degToRad(s.rigRotation);
		this.scene.add(this.rig.group);
		this.lights = this.rig.lights;
		for (const l of this.lights) l.base = l.intensity;
		this.applyRigIntensity();
		const sunLight = this.lights.find((l) => l.light.isDirectionalLight);
		if (sunLight) {
			this.sun.direction.copy(sunLight.light.position).normalize();
			this.sun.color.copy(sunLight.light.color).multiplyScalar(0.25);
		} else this.sun.color.setRGB(0, 0, 0);
		this.app.onLightsChanged?.();
	}

	applyRigIntensity() {
		const s = this.settings;
		for (const l of this.lights) l.light.intensity = l.base * s.rigIntensity;
		this.rig.group.rotation.y = THREE.MathUtils.degToRad(s.rigRotation);
		this.applyEnvIntensity();
	}

	setLightKelvin(entry, kelvin) {
		entry.kelvin = kelvin;
		entry.light.color.copy(kelvinToColor(kelvin));
	}

	async environmentTexture(id) {
		if (id === 'custom' && this.customEnv) return this.customEnv;
		if (this.envCache.has(id)) return this.envCache.get(id);
		let texture;
		if (id === 'room' || !id.startsWith('hdri')) {
			const room = new RoomEnvironment();
			texture = this.app.backend.envFromScene(room, 0.04);
			room.traverse((o) => o.geometry?.dispose());
		} else {
			texture = this.app.backend.envFromEquirect(await this.app.loader.loadSample(id));
		}
		this.envCache.set(id, texture);
		return texture;
	}

	async applyEnvironment() {
		const s = this.settings;
		const env = await this.environmentTexture(s.env);
		this.scene.environment = env;
		this.applyEnvIntensity();
		this.applyBackground(env);
	}

	setCustomEnvironment(texture) {
		this.customEnv = this.app.backend.envFromEquirect(texture);
		this.settings.env = 'custom';
		return this.applyEnvironment();
	}

	applyEnvIntensity() {
		const s = this.settings;
		const rigFactor = STUDIO_RIGS[s.rig]?.env ?? 1;
		this.scene.environmentIntensity = s.envIntensity * rigFactor;
		const rot = THREE.MathUtils.degToRad(s.envRotation);
		this.scene.environmentRotation.set(0, rot, 0);
		this.scene.backgroundRotation.set(0, rot, 0);
	}

	applyBackground(env = this.scene.environment) {
		const s = this.settings;
		if (s.background === 'color') {
			this.scene.background = new THREE.Color(s.bgColor);
		} else {
			this.scene.background = env;
			this.scene.backgroundBlurriness = s.background === 'blur' ? s.bgBlur : 0;
			this.scene.backgroundIntensity = s.bgIntensity * (STUDIO_RIGS[s.rig]?.env ?? 1) ** 0.5;
		}
	}

	update(delta, elapsed) {
		for (const l of this.lights) {
			if (l.flicker !== undefined) l.light.intensity = l.base * this.settings.rigIntensity * (1 + (flicker(elapsed, l.flicker) - 1) * (l.flickerAmount ?? 1));
		}
	}

	bounds() {
		return new THREE.Box3().setFromObject(this.anchor);
	}

	dispose() {
		this.scene.traverse((o) => {
			o.geometry?.dispose();
			if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
		});
		for (const t of this.envCache.values()) t.dispose?.();
	}
}

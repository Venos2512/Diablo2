// Shader lab controller (backend-agnostic): applies the registry effects through whichever backend
// is active — GLSL patches (WebGL2) or TSL node patches (WebGPU) — to the subject model or to probe
// shapes, and stages VFX effects next to the subject. State persists in settings, so after a
// renderer switch the same effects come back with the same parameters for a like-for-like compare.
import * as THREE from 'three';
import { EFFECTS, animatedValue } from './registry.js';
import { registerDefaults } from '../core/settings.js';
import { FlameField } from '../env/flames.js';
import { getForge } from '../env/materials.js';
import { forgedMaterial } from '../env/forge.js';
import { kelvinToColor } from '../core/grading.js';

registerDefaults('shaderLab', { effect: 'dissolve', effects: {} });

export const TARGETS = {
	subject: 'Subject model',
	sphere: 'Probe · sphere',
	knot: 'Probe · torus knot',
	disc: 'Probe · ground disc',
};

const isColorDef = (def) => def.type === 'color';
const storedValue = (def, value) => (isColorDef(def) ? (value?.isColor ? '#' + value.getHexString() : String(value)) : value);

function setUniform(uniform, def, value) {
	if (!uniform) return;
	if (isColorDef(def)) uniform.value.set(value);
	else uniform.value = Number(value);
}

export class ShaderLab {
	constructor(app) {
		this.app = app;
		this.settings = app.settings.adopt('shaderLab');
		this.instances = {}; // effect name -> backend instance
		this.applied = new Map(); // surface effect name -> target it is applied to
		this.probes = {}; // shape -> { mesh, radius }
		this.vfx = {}; // name -> { objects: [], lights: [] }
		this.listeners = new Set();
		this.stage = new THREE.Group();
		this.stage.name = 'Shader lab';
		this.spots = null;
		app.on('update', (delta, elapsed) => this.update(delta, elapsed));
		app.on('scene', (entry) => this.onScene(entry));
		app.on('subject', () => this.onSubject());
	}

	/** Re-apply persisted effects (called once the first scene and subject exist). */
	init() {
		this.onScene(this.app.current);
		for (const name of Object.keys(EFFECTS)) {
			const st = this.settings.effects[name];
			if (!st?.enabled) continue;
			st.enabled = false;
			try {
				this.setEnabled(name, true, { persist: false });
			} catch (error) {
				console.error(error);
				this.app.errors.text('lab', `Shader lab: could not apply ${name}`, String(error?.stack || error));
			}
		}
	}

	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	notify(name) {
		for (const fn of this.listeners) fn(name);
	}

	save() {
		this.app.settings.changed('shaderLab');
	}

	// ---------------------------------------------------------------------------------------------
	// State

	state(name) {
		const all = this.settings.effects;
		const def = EFFECTS[name];
		if (!all[name]) all[name] = { enabled: false, target: def.lab?.target || 'subject', animate: false, params: {} };
		const st = all[name];
		for (const [key, p] of Object.entries(def.params)) if (st.params[key] === undefined) st.params[key] = storedValue(p, p.value);
		if (def.kind === 'surface' && !TARGETS[st.target]) st.target = 'subject';
		return st;
	}

	isEnabled(name) {
		return !!this.settings.effects[name]?.enabled;
	}

	activeEffects() {
		return Object.keys(EFFECTS).filter((name) => this.isEnabled(name));
	}

	instance(name) {
		if (name === 'flame') return this.ensureFlame().field.effect;
		if (this.instances[name]) return this.instances[name];
		const st = this.state(name);
		const overrides = {};
		for (const [key, def] of Object.entries(EFFECTS[name].params)) overrides[key] = isColorDef(def) ? new THREE.Color(st.params[key]) : st.params[key];
		const inst = this.app.backend.effects.create(name, overrides);
		if (!inst) throw new Error(`${name} has no ${this.app.backend.language} implementation`);
		this.instances[name] = inst;
		return inst;
	}

	setParam(name, key, value, { persist = true } = {}) {
		const def = EFFECTS[name].params[key];
		const st = this.state(name);
		st.params[key] = storedValue(def, value);
		const inst = name === 'flame' ? this.flame?.field.effect : this.instances[name];
		if (inst) setUniform(inst.uniforms[key], def, st.params[key]);
		if (name === 'flame' && key === 'intensity' && this.flame) this.flame.field.lightScale = Number(value) / 7;
		if (name === 'portal' && key === 'color' && this.vfx.portal) this.vfx.portal.light.color.set(st.params.color);
		if (persist) this.save();
	}

	resetParams(name) {
		for (const [key, def] of Object.entries(EFFECTS[name].params)) this.setParam(name, key, def.value, { persist: false });
		this.save();
		this.notify(name);
	}

	setAnimate(name, on) {
		this.state(name).animate = on;
		this.save();
	}

	// ---------------------------------------------------------------------------------------------
	// Enable / target

	setEnabled(name, on, { persist = true } = {}) {
		const def = EFFECTS[name];
		const st = this.state(name);
		if (def.kind === 'surface') {
			if (on && !this.applied.has(name)) this.applySurface(name, st.target);
			if (!on && this.applied.has(name)) this.removeSurface(name);
		} else if (on) this.showVfx(name);
		else this.hideVfx(name);
		st.enabled = on;
		if (persist) this.save();
		this.notify(name);
	}

	setTarget(name, target) {
		const st = this.state(name);
		if (st.target === target) return;
		const wasApplied = this.applied.has(name);
		if (wasApplied) this.removeSurface(name);
		st.target = target;
		if (wasApplied) this.applySurface(name, target);
		this.save();
		this.notify(name);
	}

	/** Meshes a surface effect would be applied to for `target`. */
	meshesFor(target) {
		const root = target === 'subject' ? this.app.subject.model : this.probes[target]?.mesh;
		const meshes = [];
		root?.traverse((o) => {
			if (o.isMesh && o.material && !o.userData.labNoView) meshes.push(o);
		});
		return meshes;
	}

	/** First object the effect is visible on (compiled-shader view, benchmark framing). */
	representative(name) {
		if (EFFECTS[name].kind === 'surface') {
			const target = this.applied.get(name) || this.state(name).target;
			return this.meshesFor(target)[0] || null;
		}
		return this.vfx[name]?.mesh || null;
	}

	swapMaterials(mesh, fn) {
		const views = this.app.views;
		const base = views.baseMaterial(mesh);
		const next = Array.isArray(base) ? base.map(fn) : fn(base);
		const changed = Array.isArray(base) ? next.some((m, i) => m !== base[i]) : next !== base;
		if (changed) views.setBaseMaterial(mesh, next);
	}

	applySurface(name, target) {
		if (target !== 'subject') this.ensureProbe(target);
		const inst = this.instance(name);
		let skipped = 0;
		const meshes = this.meshesFor(target);
		for (const mesh of meshes) {
			this.swapMaterials(mesh, (m) => {
				if (!inst.accepts(m)) skipped++;
				return inst.apply(m);
			});
		}
		this.applied.set(name, target);
		this.prepare(target);
		this.lastApply = { name, target, meshes: meshes.length, skipped };
		return this.lastApply;
	}

	removeSurface(name) {
		const target = this.applied.get(name);
		const inst = this.instances[name];
		this.applied.delete(name);
		if (inst) for (const mesh of this.meshesFor(target)) this.swapMaterials(mesh, (m) => inst.remove(m));
		this.prepare(target);
		this.releaseProbes();
	}

	prepare(target) {
		const root = target === 'subject' ? this.app.subject.root : this.probes[target]?.mesh;
		if (root) this.app.backend.prepareObject(root);
	}

	// ---------------------------------------------------------------------------------------------
	// Probes

	ensureProbe(shape) {
		let probe = this.probes[shape];
		if (!probe) {
			probe = this.probes[shape] = this.createProbe(shape);
			this.app.backend.prepareObject(probe.mesh);
		}
		if (probe.mesh.parent !== this.stage) {
			this.stage.add(probe.mesh);
			this.app.views.refresh([this.app.world.scene]);
		}
		this.layout();
		return probe;
	}

	releaseProbes() {
		for (const [shape, probe] of Object.entries(this.probes)) {
			const used = [...this.applied.values()].includes(shape);
			if (!used && probe.mesh.parent) {
				this.app.views.restoreMesh?.(probe.mesh);
				probe.mesh.removeFromParent();
				if (this.app.selected === probe.mesh) this.app.clearSelection();
			}
		}
	}

	createProbe(shape) {
		let geometry;
		let material;
		if (shape === 'disc') {
			geometry = discGeometry(1);
			material = forgedMaterial(getForge(this.app), 'cobblestone', { name: 'Lab probe · cobblestone' });
			material.polygonOffset = true;
			material.polygonOffsetFactor = -2;
			material.polygonOffsetUnits = -2;
		} else {
			geometry = shape === 'knot' ? new THREE.TorusKnotGeometry(0.26, 0.085, 256, 32) : new THREE.SphereGeometry(0.42, 96, 64);
			geometry.translate(0, shape === 'knot' ? 0.48 : 0.42, 0);
			material = new THREE.MeshStandardMaterial({ name: 'Lab probe · clay', color: new THREE.Color().setRGB(0.3, 0.29, 0.27), roughness: 0.45, metalness: 0 });
		}
		const mesh = new THREE.Mesh(geometry, material);
		mesh.name = TARGETS[shape];
		mesh.castShadow = shape !== 'disc';
		mesh.receiveShadow = true;
		mesh.userData.labProbe = shape;
		return { shape, mesh, radius: 1 };
	}

	// ---------------------------------------------------------------------------------------------
	// VFX staging

	ensureFlame() {
		if (this.flame) return this.flame;
		const field = new FlameField(this.app, 2);
		const st = this.state('flame');
		for (const [key, def] of Object.entries(EFFECTS.flame.params)) setUniform(field.effect.uniforms[key], def, st.params[key]);
		field.lightScale = Number(st.params.intensity) / 7;
		const light = new THREE.PointLight(kelvinToColor(1900), 10, 7, 2);
		light.name = 'Lab flame light';
		const stand = new THREE.Mesh(
			new THREE.CylinderGeometry(0.19, 0.13, 0.2, 24),
			new THREE.MeshStandardMaterial({ name: 'Lab brazier', color: new THREE.Color().setRGB(0.05, 0.045, 0.04), roughness: 0.55, metalness: 0.85 }),
		);
		stand.castShadow = stand.receiveShadow = true;
		stand.name = 'Lab brazier';
		this.app.backend.prepareObject(stand);
		field.add(new THREE.Vector3(), { width: 0.42, height: 0.85, strength: 1, light });
		this.flame = { field, light, stand };
		this.vfx.flame = { mesh: field.mesh, light, extra: [stand] };
		return this.flame;
	}

	showVfx(name) {
		const vfx = name === 'flame' ? (this.ensureFlame(), this.vfx.flame) : (this.vfx[name] ??= this.createVfx(name));
		this.app.world.vfxScene.add(vfx.mesh);
		this.app.backend.prepareObject(vfx.mesh);
		if (vfx.light) this.stage.add(vfx.light);
		for (const o of vfx.extra || []) this.stage.add(o);
		this.layout();
	}

	hideVfx(name) {
		const vfx = this.vfx[name];
		if (!vfx) return;
		vfx.mesh.removeFromParent();
		vfx.light?.removeFromParent();
		for (const o of vfx.extra || []) o.removeFromParent();
	}

	createVfx(name) {
		const inst = this.instance(name);
		const st = this.state(name);
		let mesh;
		let light = null;
		if (name === 'portal') {
			mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.0), inst.material);
			light = new THREE.PointLight(new THREE.Color(st.params.color), 12, 7, 2);
			light.name = 'Lab portal light';
		} else {
			mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), inst.material);
		}
		mesh.name = `${EFFECTS[name].label} (${this.app.backend.language})`;
		mesh.renderOrder = 6;
		mesh.userData.labNoView = true;
		return { mesh, light };
	}

	// ---------------------------------------------------------------------------------------------
	// Layout: probes and VFX are placed around the subject, on whatever ground is under them.

	groundAt(x, z, fallback) {
		const scene = this.app.world.scene;
		const ray = new THREE.Raycaster(new THREE.Vector3(x, fallback + 4, z), new THREE.Vector3(0, -1, 0), 0, 10);
		const subjectRoot = this.app.subject.root;
		const excluded = (o) => {
			for (let p = o; p; p = p.parent) if (p === subjectRoot || p === this.stage) return true;
			return false;
		};
		const hits = ray.intersectObjects(scene.children, true).filter((h) => h.object.isMesh && h.object.visible && !h.object.isInstancedMesh && !h.object.userData.labNoPick && !excluded(h.object));
		return hits.length ? hits[0].point.y : fallback;
	}

	layout() {
		const app = this.app;
		const entry = app.current;
		if (!entry) return;
		entry.scene.updateMatrixWorld(true);
		const anchor = entry.anchor.getWorldPosition(new THREE.Vector3());
		const box = new THREE.Box3();
		if (app.subject.model) box.setFromObject(app.subject.model);
		if (box.isEmpty()) box.setFromCenterAndSize(anchor.clone().add(new THREE.Vector3(0, 0.8, 0)), new THREE.Vector3(0.8, 1.6, 0.8));
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const half = THREE.MathUtils.clamp(Math.max(size.x, size.z) / 2, 0.3, 3);
		const spot = (dx, dz) => {
			const x = center.x + dx;
			const z = center.z + dz;
			return new THREE.Vector3(x, this.groundAt(x, z, anchor.y), z);
		};
		const s = (this.spots = {
			right: spot(half + 0.6, 0.45),
			farRight: spot(half + 1.65, 0.45),
			frontLeft: spot(-(half * 0.6 + 0.35), half + 0.55),
			behind: spot(-(half * 0.5 + 0.55), -(half + 0.9)),
			ground: new THREE.Vector3(center.x, anchor.y, center.z),
			radius: Math.max(1, half + 0.45),
		});

		if (this.probes.sphere) this.probes.sphere.mesh.position.copy(s.right);
		if (this.probes.knot) this.probes.knot.mesh.position.copy(this.probes.sphere?.mesh.parent ? s.farRight : s.right);
		const disc = this.probes.disc;
		if (disc) {
			if (Math.abs(disc.radius - s.radius) > 1e-3) {
				disc.mesh.geometry.dispose();
				disc.mesh.geometry = discGeometry(s.radius);
				disc.radius = s.radius;
			}
			disc.mesh.position.copy(s.ground).add(new THREE.Vector3(0, 0.004, 0));
		}
		if (this.flame) {
			const p = s.frontLeft;
			this.flame.stand.position.set(p.x, p.y + 0.1, p.z);
			this.flame.field.move(0, new THREE.Vector3(p.x, p.y + 0.17, p.z));
			this.flame.light.position.set(p.x, p.y + 0.6, p.z);
		}
		if (this.vfx.portal) {
			const p = s.behind;
			this.vfx.portal.mesh.position.set(p.x, p.y + 1.04, p.z);
			this.vfx.portal.light.position.set(p.x, p.y + 1.1, p.z + 0.45);
		}
		if (this.vfx.runes) {
			this.vfx.runes.mesh.position.copy(s.ground).add(new THREE.Vector3(0, 0.012, 0));
			this.vfx.runes.mesh.scale.setScalar(s.radius * 1.05);
		}
	}

	onScene(entry) {
		if (!entry) return;
		entry.scene.add(this.stage);
		this.layout();
	}

	onSubject() {
		// A new model has fresh materials: re-apply every effect that targets the subject.
		for (const [name, target] of [...this.applied]) {
			if (target !== 'subject') continue;
			this.applied.delete(name);
			this.applySurface(name, 'subject');
		}
		this.layout();
	}

	// ---------------------------------------------------------------------------------------------

	update(delta, elapsed) {
		for (const name of Object.keys(EFFECTS)) {
			const def = EFFECTS[name];
			const st = this.settings.effects[name];
			if (!def.animate || !st?.enabled || !st.animate) continue;
			const key = def.animate.param;
			this.setParam(name, key, animatedValue(def.animate, def.params[key], elapsed), { persist: false });
		}
		if (this.flame && this.flame.field.mesh.parent) this.flame.field.update(elapsed);
		const portal = this.vfx.portal;
		if (portal?.mesh.parent) {
			const cam = this.app.world.camera.position;
			const p = portal.mesh.position;
			portal.mesh.rotation.set(0, Math.atan2(cam.x - p.x, cam.z - p.z), 0);
			const intensity = Number(this.state('portal').params.intensity);
			portal.light.intensity = intensity * 2.2 * (1 + 0.08 * Math.sin(elapsed * 2.7));
			portal.light.position.set(p.x + Math.sin(portal.mesh.rotation.y) * 0.45, p.y + 0.06, p.z + Math.cos(portal.mesh.rotation.y) * 0.45);
		}
	}
}

/** Flat disc in the XZ plane with UVs in metres (forged textures repeat every `tile` metres). */
function discGeometry(radius) {
	const g = new THREE.CircleGeometry(radius, 96);
	const pos = g.attributes.position;
	const uv = g.attributes.uv;
	for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getY(i));
	g.rotateX(-Math.PI / 2);
	return g;
}

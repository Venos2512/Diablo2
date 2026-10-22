// Equipment for the character preview: what each hand holds (the model's own weapons parented under its
// hand bones, props from the KayKit library, or your own GLB), with an editable grip (position /
// rotation / scale relative to the hand bone, gizmo in the viewport) saved per model and exportable.
import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { attachedItems, originalName } from './rig.js';

export const PROPS_LIBRARY = 'kaykit-props';
// Height of a KayKit character in its own units: props from the pack are scaled by
// (character height / this) when they go into the hand of another rig.
const KAYKIT_HEIGHT = 2.45;

// Grips that reproduce the pack's own weapon placement on KayKit "handslot" bones.
const Y180 = [0, -1, 0, 0];
const KAYKIT_GRIPS = {
	right: {
		default: { p: [0, 0.033, 0], q: Y180 },
		staff: { p: [0, 0, 0], q: Y180 },
		wand: { p: [0, 0, 0], q: Y180 },
		dagger: { p: [0, 0, 0], q: Y180 },
		crossbow_1handed: { p: [-0.105, -0.01, 0], q: [0, Math.SQRT1_2, 0, Math.SQRT1_2] },
		crossbow_2handed: { p: [-0.105, -0.01, 0], q: [0, Math.SQRT1_2, 0, Math.SQRT1_2] },
	},
	left: {
		default: { p: [0, 0.017, 0], q: [0, 0, 0, 1] },
		shield: { p: [0, 0.017, 0.156], q: [0, 0, 0, 1] },
		spellbook_open: { p: [0, 0.145, 0], q: [0, -Math.SQRT1_2, -Math.SQRT1_2, 0] },
	},
};

const label = (name) => name.replace(/_/g, ' ');

export class Equipment {
	constructor(app, store) {
		this.app = app;
		this.store = store; // () => per-model settings object
		this.rig = null;
		this.model = null;
		this.slots = { right: null, left: null }; // { id, object, builtin }
		this.builtins = { right: [], left: [] };
		this.custom = []; // { id, name, scene }
		this.props = null;
		this.gizmo = null;
		this.gizmoSide = null;
		this.listeners = new Set();
	}

	onChange(fn) {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	notify() {
		for (const fn of this.listeners) fn();
	}

	async loadProps() {
		if (this.props) return this.props;
		const gltf = await this.app.loader.loadLibrary(PROPS_LIBRARY);
		this.props = gltf.scene.children.filter((c) => c.isMesh).map((mesh) => ({ name: originalName(mesh), mesh }));
		return this.props;
	}

	/** New model: find its slots and built-in items, restore (or default) the loadout. */
	async setModel(model, rig, name) {
		this.detachGizmo();
		this.model = model;
		this.rig = rig;
		this.slots = { right: null, left: null };
		this.builtins = {
			right: attachedItems(rig.right.slot).concat(rig.right.slot !== rig.right.hand ? attachedItems(rig.right.hand) : []),
			left: attachedItems(rig.left.slot).concat(rig.left.slot !== rig.left.hand ? attachedItems(rig.left.hand) : []),
		};
		const saved = this.store()?.items;
		for (const side of ['right', 'left']) {
			let id = saved?.[side];
			if (id === undefined) {
				const builtinName = this.builtins[side][0] ? originalName(this.builtins[side][0]) : null;
				id = builtinName ? `builtin:${builtinName}` : 'none';
			}
			await this.equip(side, id, { persist: false }).catch((e) => console.warn(e));
		}
		this.notify();
	}

	options(side) {
		const list = { Empty: 'none' };
		for (const item of this.builtins[side]) list[`Model · ${label(originalName(item))}`] = `builtin:${originalName(item)}`;
		for (const prop of this.props || []) list[`KayKit · ${label(prop.name)}`] = `prop:${prop.name}`;
		for (const c of this.custom) list[`File · ${c.name}`] = `file:${c.id}`;
		return list;
	}

	current(side) {
		return this.slots[side]?.id || 'none';
	}

	/** Display name of what a hand holds (drives the stance). */
	itemName(side) {
		const slot = this.slots[side];
		if (!slot) return '';
		return slot.id.split(':').slice(1).join(':');
	}

	bone(side) {
		return this.rig?.[side]?.slot || this.rig?.[side]?.hand || null;
	}

	async equip(side, id, { persist = true } = {}) {
		const bone = this.bone(side);
		const previous = this.slots[side];
		if (previous && !previous.builtin) {
			if (this.gizmo?.object === previous.object) this.detachGizmo();
			previous.object.removeFromParent();
		}
		this.slots[side] = null;
		// Built-ins of this hand: only the chosen one stays visible.
		for (const item of this.builtins[side]) item.visible = id === `builtin:${originalName(item)}`;
		if (!bone || !id || id === 'none') {
			if (persist) this.save(side, 'none');
			this.notify();
			return;
		}
		const [kind, ...rest] = id.split(':');
		const name = rest.join(':');
		let object = null;
		let builtin = false;
		if (kind === 'builtin') {
			object = this.builtins[side].find((i) => originalName(i) === name) || null;
			builtin = true;
		} else if (kind === 'prop') {
			const props = await this.loadProps();
			const prop = props.find((p) => p.name === name);
			if (prop) {
				object = prop.mesh.clone();
				object.material = prop.mesh.material; // shared: the texture editor can make it unique
			}
		} else if (kind === 'file') {
			const custom = this.custom.find((c) => c.id === name);
			if (custom) object = custom.scene.clone(true);
		}
		if (!object) {
			if (persist) this.save(side, 'none');
			this.notify();
			return;
		}
		if (!builtin) {
			object.userData.labItem = true;
			object.name = `${side === 'right' ? 'Main hand' : 'Off hand'} · ${label(name)}`;
			object.traverse((o) => {
				if (o.isMesh) {
					o.castShadow = true;
					o.receiveShadow = true;
				}
			});
			bone.add(object);
			this.applyGrip(side, object, id);
			this.app.backend.prepareObject(object);
		}
		object.visible = true;
		this.slots[side] = { id, object, builtin };
		if (persist) this.save(side, id);
		this.notify();
	}

	gripKey(side, id) {
		return `${side}|${id}`;
	}

	/** Default grip: the pack's placement on KayKit slots, identity (scaled to the rig) elsewhere. */
	defaultGrip(side, id) {
		const bone = this.bone(side);
		const kaykitSlot = /handslot/i.test(originalName(bone || {}));
		const name = id.split(':').slice(1).join(':');
		if (kaykitSlot) {
			const table = KAYKIT_GRIPS[side];
			const entry = table[name] || (/shield/.test(name) ? table.shield : table.default);
			return { p: [...entry.p], q: [...entry.q], s: 1 };
		}
		// Another rig: make the prop as large relative to this character as it is to a KayKit one, and
		// point it (props are modelled along +Y) forward and a little up from the hand, whatever the
		// bone's own axes are. Fine-tune with the gizmo.
		if (!bone) return { p: [0, 0, 0], q: [0, 0, 0, 1], s: 1 };
		bone.updateWorldMatrix(true, false);
		const boneQuat = new THREE.Quaternion();
		const boneScale = new THREE.Vector3();
		bone.matrixWorld.decompose(new THREE.Vector3(), boneQuat, boneScale);
		let s = 1;
		if (id.startsWith('prop:')) s = (this.characterHeight?.() || 1.8) / KAYKIT_HEIGHT / (boneScale.x || 1);
		const facing = new THREE.Quaternion();
		(this.app.subject.pivot || bone).getWorldQuaternion(facing);
		const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(facing);
		const up = new THREE.Vector3(0, 1, 0);
		const shield = /shield|book/.test(name);
		// Weapons: blade forward / up. Shields and books: face forward, upright.
		const axisY = shield ? up : forward.clone().multiplyScalar(0.55).add(up.clone().multiplyScalar(0.85)).normalize();
		const axisZ = shield ? forward : new THREE.Vector3().crossVectors(new THREE.Vector3().crossVectors(axisY, forward).normalize(), axisY);
		const axisX = new THREE.Vector3().crossVectors(axisY, axisZ).normalize();
		const world = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(axisX, axisY, axisZ));
		const local = boneQuat.clone().invert().multiply(world);
		return { p: [0, 0, 0], q: local.toArray().map(round), s: round(s) };
	}

	grip(side) {
		const slot = this.slots[side];
		if (!slot || slot.builtin) return null;
		const saved = this.store()?.grips?.[this.gripKey(side, slot.id)];
		return saved || this.defaultGrip(side, slot.id);
	}

	applyGrip(side, object = this.slots[side]?.object, id = this.slots[side]?.id) {
		if (!object || !id) return;
		const saved = this.store()?.grips?.[this.gripKey(side, id)];
		const g = saved || this.defaultGrip(side, id);
		object.position.fromArray(g.p);
		object.quaternion.fromArray(g.q).normalize();
		object.scale.setScalar(g.s ?? 1);
	}

	/** Store the current transform of a hand's item as its grip. */
	captureGrip(side) {
		const slot = this.slots[side];
		if (!slot || slot.builtin) return;
		const o = slot.object;
		const store = this.store();
		store.grips ??= {};
		store.grips[this.gripKey(side, slot.id)] = { p: o.position.toArray().map(round), q: o.quaternion.toArray().map(round), s: round(o.scale.x) };
		this.app.settings.changed('character');
	}

	resetGrip(side) {
		const slot = this.slots[side];
		if (!slot) return;
		const store = this.store();
		if (store.grips) delete store.grips[this.gripKey(side, slot.id)];
		this.app.settings.changed('character');
		this.applyGrip(side);
		this.notify();
	}

	save(side, id) {
		const store = this.store();
		if (!store) return;
		store.items ??= {};
		store.items[side] = id;
		this.app.settings.changed('character');
	}

	addCustom(name, scene) {
		const id = `${name}-${this.custom.length + 1}`;
		scene.traverse((o) => {
			if (o.isMesh) o.castShadow = o.receiveShadow = true;
		});
		this.custom.push({ id, name, scene });
		return `file:${id}`;
	}

	// ----------------------------------------------------------------------------------------------
	// Gizmo

	attachGizmo(side, mode = 'rotate') {
		const slot = this.slots[side];
		if (!slot || slot.builtin) return false;
		const app = this.app;
		if (!this.gizmo) {
			const gizmo = new TransformControls(app.world.camera, app.backend.canvas);
			gizmo.setSpace('local');
			gizmo.setSize(0.8);
			gizmo.addEventListener('dragging-changed', (e) => {
				app.rig.controls.enabled = !e.value;
				if (!e.value && this.gizmoSide) this.captureGrip(this.gizmoSide);
				this.dragging = e.value;
			});
			gizmo.addEventListener('objectChange', () => this.notify());
			const helper = gizmo.getHelper();
			helper.name = 'Grip gizmo';
			helper.traverse((o) => {
				o.userData.labNoPick = true;
				o.userData.labNoView = true;
				o.userData.labNoCollide = true;
			});
			this.gizmo = gizmo;
			this.helper = helper;
			// A click that ends a gizmo drag must not select / move.
			app.on('click', () => {
				if (this.gizmo?.object && (this.dragging || this.gizmo.axis)) app.consumedClick = true;
			});
		}
		this.gizmo.camera = app.world.camera;
		this.gizmo.setMode(mode);
		this.gizmo.attach(slot.object);
		this.gizmoSide = side;
		if (this.helper.parent !== app.world.scene) app.world.scene.add(this.helper);
		app.backend.prepareObject(this.helper);
		return true;
	}

	detachGizmo() {
		if (!this.gizmo) return;
		this.gizmo.detach();
		this.helper.removeFromParent();
		this.gizmoSide = null;
		this.app.rig.controls.enabled = true;
	}

	update() {
		if (this.gizmo?.object) this.gizmo.camera = this.app.world.camera;
	}

	exportGrips(modelName) {
		const store = this.store() || {};
		const data = {
			model: modelName,
			bones: { right: originalName(this.bone('right') || {}), left: originalName(this.bone('left') || {}) },
			loadout: store.items || {},
			grips: Object.fromEntries(Object.entries(store.grips || {}).map(([key, g]) => [key, { position: g.p, quaternion: g.q, scale: g.s }])),
			note: 'Grip = local transform of the item under the hand bone (metres in the bone space, quaternion x y z w).',
		};
		return JSON.stringify(data, null, 2);
	}

	dispose() {
		this.detachGizmo();
		this.gizmo?.dispose();
	}
}

const round = (v) => Math.round(v * 10000) / 10000;

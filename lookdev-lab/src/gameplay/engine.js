// Stand-in for Ashen Crown's Engine singleton (src/core/renderer.js in v1), backed by the lab.
// Gameplay runs in its own space: the nav grid needs cell coordinates from 0, so every actor lives in
// `Engine.scene` — a group shifted by -offset inside the lab scene (local x, z = world x, z + offset).
// Heights stay world heights (actors follow the lab's ground every frame).
import * as THREE from 'three';

const _v = new THREE.Vector3();
const _ndc = new THREE.Vector2();
const _ray = new THREE.Raycaster();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export const Engine = {
	scene: null, // THREE.Group (gameplay space)
	camera: null,
	canvas: null,
	offset: new THREE.Vector3(),
	lightRadius: 1,
	lowLife: 0,
	/** Lab hooks, set by the gameplay host. */
	host: {
		raycast: null, // (origin, direction) -> world point | null
		groundY: () => 0,
		shake: () => {},
		hurt: () => {},
	},
	rig: {
		shake: (amount) => Engine.host.shake(amount),
		zoom: () => {},
	},

	toWorld(local, out = new THREE.Vector3()) {
		return out.set(local.x - this.offset.x, local.y, local.z - this.offset.z);
	},
	toLocal(world, out = new THREE.Vector3()) {
		return out.set(world.x + this.offset.x, world.y, world.z + this.offset.z);
	},

	/** Gameplay-space point -> client pixels { x, y, visible } (v1 compares them with the mouse). */
	project(local, out) {
		const rect = this.canvas.getBoundingClientRect();
		this.toWorld(local, _v).project(this.camera);
		out.visible = _v.z < 1 && _v.z > -1;
		out.x = rect.left + ((_v.x + 1) / 2) * rect.width;
		out.y = rect.top + ((1 - _v.y) / 2) * rect.height;
		return out;
	},

	/** Mouse -> ground under the cursor (scene collision, else a plane at the player's height), in gameplay space. */
	screenToGround(px, py, _planeY, out) {
		const rect = this.canvas.getBoundingClientRect();
		_ndc.set(((px - rect.left) / rect.width) * 2 - 1, -((py - rect.top) / rect.height) * 2 + 1);
		_ray.setFromCamera(_ndc, this.camera);
		let hit = this.host.raycast?.(_ray.ray.origin, _ray.ray.direction) || null;
		if (!hit) {
			_plane.constant = -this.host.groundY();
			hit = _ray.ray.intersectPlane(_plane, _v);
		}
		if (hit) this.toLocal(hit, out);
		return out;
	},

	hurtFlash(amount) {
		this.host.hurt(amount);
	},
};

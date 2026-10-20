// Camera modes: free orbit, game three-quarter (perspective, fixed pitch), true isometric
// (orthographic 2:1 dimetric = 30° elevation, like the original sprite camera) and play (follows a target).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;

export const CAMERA_MODES = {
	orbit: 'Free orbit',
	game: 'Game ¾ (perspective)',
	iso: 'Isometric 2:1 (orthographic)',
	play: 'Play (follow, click to move)',
	chase: 'Third person (follow)',
};

export class CameraRig {
	constructor(domElement) {
		this.dom = domElement;
		this.persp = new THREE.PerspectiveCamera(35, 1, 0.05, 600);
		this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, -300, 600);
		this.persp.position.set(3.2, 1.9, 4.2);
		this.controls = new OrbitControls(this.persp, domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.09;
		this.controls.target.set(0, 0.8, 0);
		this.controls.screenSpacePanning = true;
		this.mode = 'orbit';
		this.aspect = 1;
		this.orthoHeight = 14;
		this.follow = null; // Object3D followed (play mode, character preview)
		this.followHeight = 0.9;
		this.gameDistance = 16;
		this.chaseDistance = 4.2;
		this.saved = {};
		this.controls.update();
	}

	get camera() {
		return this.mode === 'iso' ? this.ortho : this.persp;
	}

	setFov(fov) {
		this.persp.fov = fov;
		this.persp.updateProjectionMatrix();
	}

	setAspect(aspect) {
		this.aspect = aspect;
		this.persp.aspect = aspect;
		this.persp.updateProjectionMatrix();
		this.updateOrtho();
	}

	updateOrtho() {
		const h = this.orthoHeight / 2;
		this.ortho.left = -h * this.aspect;
		this.ortho.right = h * this.aspect;
		this.ortho.top = h;
		this.ortho.bottom = -h;
		this.ortho.updateProjectionMatrix();
	}

	/** Switch mode; keeps the current focus point. */
	setMode(mode) {
		if (!CAMERA_MODES[mode]) mode = 'orbit';
		this.saved[this.mode] = this.state();
		this.mode = mode;
		const c = this.controls;
		const target = c.target.clone();
		c.object = this.camera;
		c.minPolarAngle = 0;
		c.maxPolarAngle = Math.PI;
		c.minAzimuthAngle = -Infinity;
		c.maxAzimuthAngle = Infinity;
		c.enableRotate = true;
		c.enablePan = true;
		c.minDistance = 0.05;
		c.maxDistance = 400;
		c.minZoom = 0.05;
		c.maxZoom = 40;
		c.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

		if (mode === 'game' || mode === 'play') {
			const polar = 42 * DEG;
			c.minPolarAngle = c.maxPolarAngle = polar;
			c.minAzimuthAngle = c.maxAzimuthAngle = 45 * DEG;
			c.minDistance = 5;
			c.maxDistance = 40;
			this.place(this.persp, target, polar, 45 * DEG, this.gameDistance);
			if (mode === 'play') c.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: null }; // left moves, right casts
		} else if (mode === 'chase') {
			// Behind-the-shoulder follow camera: right-drag orbits, wheel zooms (left click is for moving).
			c.minDistance = 1.2;
			c.maxDistance = 14;
			c.minPolarAngle = 25 * DEG;
			c.maxPolarAngle = 88 * DEG;
			c.enablePan = false;
			c.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
			this.place(this.persp, target, 66 * DEG, this.chaseAzimuth ?? Math.PI, this.chaseDistance);
		} else if (mode === 'iso') {
			const polar = 60 * DEG; // 30° elevation -> ground plane squashed 2:1
			c.minPolarAngle = c.maxPolarAngle = polar;
			c.minAzimuthAngle = c.maxAzimuthAngle = 45 * DEG;
			this.place(this.ortho, target, polar, 45 * DEG, 60);
			this.ortho.zoom = this.saved.iso?.zoom ?? 1;
			this.updateOrtho();
		} else if (this.saved.orbit) {
			this.restore(this.saved.orbit);
			return;
		}
		c.target.copy(target);
		c.update();
	}

	place(camera, target, polar, azimuth, distance) {
		const offset = new THREE.Vector3().setFromSphericalCoords(distance, polar, azimuth);
		camera.position.copy(target).add(offset);
		camera.lookAt(target);
	}

	/** Frame a bounding box (orbit) or move the focus point (game/iso). */
	frame(box, { padding = 1.25 } = {}) {
		if (box.isEmpty()) return;
		const center = box.getCenter(new THREE.Vector3());
		const size = box.getSize(new THREE.Vector3());
		const radius = Math.max(size.length() * 0.5, 0.05);
		const c = this.controls;
		if (this.mode === 'orbit') {
			const dir = this.persp.position.clone().sub(c.target);
			if (dir.lengthSq() < 1e-6) dir.set(1, 0.5, 1);
			dir.normalize();
			const dist = (radius * padding) / Math.sin((this.persp.fov * DEG) / 2);
			c.target.copy(center);
			this.persp.position.copy(center).addScaledVector(dir, dist);
			this.persp.near = Math.max(0.01, dist / 200);
			this.persp.far = Math.max(200, dist * 40);
			this.persp.updateProjectionMatrix();
		} else {
			const delta = center.clone().sub(c.target);
			c.target.add(delta);
			this.camera.position.add(delta);
		}
		c.update();
	}

	lookAt(position, target) {
		this.persp.position.copy(position);
		this.controls.target.copy(target);
		this.controls.update();
	}

	/** Isometric 2:1 view centred on `target`, showing `height` metres vertically (setMode keeps the previous framing). */
	isoFocus(target, height = this.orthoHeight) {
		if (this.mode !== 'iso') this.setMode('iso');
		const c = this.controls;
		this.ortho.position.add(target.clone().sub(c.target));
		c.target.copy(target);
		this.ortho.zoom = this.orthoHeight / height;
		this.updateOrtho();
		c.update();
	}

	update(delta) {
		if (this.follow) {
			// Every mode can follow: the focus point and the camera move together.
			const c = this.controls;
			const goal = this.follow.getWorldPosition(new THREE.Vector3());
			goal.y += this.followHeight;
			const step = goal.sub(c.target).multiplyScalar(1 - Math.exp(-delta * (this.mode === 'chase' ? 9 : 6)));
			c.target.add(step);
			this.camera.position.add(step);
		}
		this.controls.update(delta);
	}

	/** Rotate the camera around the focus point (yaw, radians) — chase-camera auto-align, gamepad. */
	orbitBy(yaw, pitch = 0) {
		const c = this.controls;
		const offset = this.camera.position.clone().sub(c.target);
		const s = new THREE.Spherical().setFromVector3(offset);
		s.theta += yaw;
		s.phi = THREE.MathUtils.clamp(s.phi + pitch, c.minPolarAngle + 1e-3, c.maxPolarAngle - 1e-3);
		this.camera.position.copy(c.target).add(new THREE.Vector3().setFromSpherical(s));
		this.camera.lookAt(c.target);
	}

	state() {
		const cam = this.camera;
		return { mode: this.mode, position: cam.position.toArray(), target: this.controls.target.toArray(), zoom: cam.zoom, fov: this.persp.fov, near: this.persp.near, far: this.persp.far };
	}

	restore(state) {
		if (!state) return;
		if (state.mode && state.mode !== this.mode) {
			this.mode = state.mode;
			this.controls.object = this.camera;
		}
		const cam = this.camera;
		if (state.position) cam.position.fromArray(state.position);
		if (state.target) this.controls.target.fromArray(state.target);
		if (state.zoom) cam.zoom = state.zoom;
		if (state.near && state.far) {
			this.persp.near = state.near;
			this.persp.far = state.far;
			this.persp.updateProjectionMatrix();
		}
		cam.updateProjectionMatrix();
		this.controls.update();
	}

	dispose() {
		this.controls.dispose();
	}
}

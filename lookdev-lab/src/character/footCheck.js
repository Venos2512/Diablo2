// Foot-slide check: while a foot is planted (near its lowest point and moving backwards relative to the
// body, i.e. the stance phase) its net horizontal drift in world space is sliding. Each plant leaves a footprint coloured by how much it slid, and the panel shows
// live numbers per foot. Natural speeds come from clips.analyseLocomotion.
import * as THREE from 'three';

const MAX_PRINTS = 48;
const GOOD = new THREE.Color('#5fd17a');
const WARN = new THREE.Color('#f0c24a');
const BAD = new THREE.Color('#f0533a');
const _p = new THREE.Vector3();
const _local = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function soleTexture() {
	const c = document.createElement('canvas');
	c.width = 64;
	c.height = 128;
	const g = c.getContext('2d');
	g.fillStyle = '#fff';
	g.beginPath();
	g.ellipse(32, 42, 20, 36, 0, 0, Math.PI * 2); // ball of the foot
	g.fill();
	g.beginPath();
	g.ellipse(32, 100, 15, 20, 0, 0, Math.PI * 2); // heel
	g.fill();
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.NoColorSpace;
	return t;
}

export class FootCheck {
	constructor() {
		this.group = new THREE.Group();
		this.group.name = 'Footprints';
		this.group.userData.labNoPick = this.group.userData.labNoCollide = this.group.userData.labNoView = true;
		const geometry = new THREE.PlaneGeometry(0.11, 0.24).rotateX(-Math.PI / 2);
		const material = new THREE.MeshBasicMaterial({ color: 0xffffff, alphaMap: soleTexture(), transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
		material.name = 'Footprints';
		this.prints = new THREE.InstancedMesh(geometry, material, MAX_PRINTS);
		this.prints.count = 0;
		this.prints.frustumCulled = false;
		this.prints.userData.labNoPick = this.prints.userData.labNoCollide = this.prints.userData.labNoView = true;
		this.prints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
		this.prints.setColorAt(0, GOOD);
		this.group.add(this.prints);
		this.next = 0;
		this.feet = [];
		this.enabled = true;
		this.window = []; // recent slip samples for the rolling average
		this.stats = { left: null, right: null, slip: 0, plantedShare: 0 };
	}

	setRig(rig) {
		this.feet = ['left', 'right']
			.map((side) => ({ side, bone: rig?.[side]?.toe || rig?.[side]?.foot }))
			.filter((f) => f.bone)
			.map((f) => ({ ...f, prev: null, prevLocal: null, start: null, planted: false, plantTime: 0, minHeight: Infinity, recentMin: [], print: -1, lastSlip: 0 }));
		this.reset();
	}

	reset() {
		this.prints.count = 0;
		this.next = 0;
		this.prints.instanceMatrix.needsUpdate = true;
		this.window = [];
		for (const f of this.feet) Object.assign(f, { prev: null, prevLocal: null, start: null, planted: false, plantTime: 0, minHeight: Infinity, recentMin: [], print: -1, lastSlip: 0 });
	}

	/**
	 * root: the character root (faces +Z); groundY(x, z) -> ground height; facing: yaw; moving: speed (m/s).
	 * A foot is planted (stance phase) when it is near its lowest height and moves backwards relative to
	 * the body — then any motion in world space is sliding.
	 */
	update(dt, root, groundY, facing, moving) {
		if (!this.feet.length || dt <= 0) return;
		_inv.copy(root.matrixWorld).invert();
		for (const f of this.feet) {
			f.bone.getWorldPosition(_p);
			_local.copy(_p).applyMatrix4(_inv);
			const ground = groundY(_p.x, _p.z);
			const height = _p.y - ground;
			// Rolling minimum of the foot height (2 s) = its planted height for this character / clip.
			f.recentMin.push(height);
			if (f.recentMin.length > 120) f.recentMin.shift();
			const floor = Math.min(...f.recentMin);
			const backwards = f.prevLocal ? -(_local.z - f.prevLocal.z) / dt : 0;
			const planted = moving > 0.05 && height < floor + 0.025 && backwards > 0.05;
			if (planted && !f.planted) {
				f.plantTime = 0;
				f.start = (f.start || new THREE.Vector3()).copy(_p);
				if (this.enabled) f.print = this.addPrint(_p.x, ground, _p.z, facing);
			}
			if (planted) {
				// Net drift of the planted foot over its stance (what the eye reads as skating).
				f.plantTime += dt;
				f.lastSlip = f.plantTime > 0.03 ? Math.hypot(_p.x - f.start.x, _p.z - f.start.z) / f.plantTime : 0;
				if (f.print >= 0) this.colorPrint(f.print, f.lastSlip);
			} else if (f.planted && f.plantTime > 0.03) {
				this.window.push({ slip: f.lastSlip, dt: f.plantTime });
			}
			f.planted = planted;
			f.prev = (f.prev || new THREE.Vector3()).copy(_p);
			f.prevLocal = (f.prevLocal || new THREE.Vector3()).copy(_local);
		}
		let time = 0;
		let sum = 0;
		while (this.window.length > 24) this.window.shift();
		for (const w of this.window) {
			sum += w.slip * w.dt;
			time += w.dt;
		}
		this.stats.slip = time > 0 ? sum / time : 0;
		for (const f of this.feet) this.stats[f.side] = { planted: f.planted, slip: f.lastSlip };
	}

	addPrint(x, y, z, facing) {
		const i = this.next;
		this.next = (this.next + 1) % MAX_PRINTS;
		this.prints.count = Math.min(MAX_PRINTS, Math.max(this.prints.count, i + 1));
		_q.setFromAxisAngle(UP, facing);
		_m.compose(_p.set(x, y + 0.012, z), _q, _s.set(1, 1, 1));
		this.prints.setMatrixAt(i, _m);
		this.prints.instanceMatrix.needsUpdate = true;
		this.colorPrint(i, 0);
		return i;
	}

	colorPrint(i, slip) {
		// Net drift per step, cm/s: < 8 holds, < 20 noticeable, above that it skates.
		const cm = slip * 100;
		this.prints.setColorAt(i, cm < 8 ? GOOD : cm < 20 ? WARN : BAD);
		this.prints.instanceColor.needsUpdate = true;
	}

	dispose() {
		this.group.removeFromParent();
		this.prints.geometry.dispose();
		this.prints.material.alphaMap.dispose();
		this.prints.material.dispose();
	}
}

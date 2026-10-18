// The model being looked at: normalisation, turntable, animation clips and asset statistics.
import * as THREE from 'three';
import { SHARED } from '../core/shared.js';

export class Subject {
	constructor() {
		this.root = new THREE.Group();
		this.root.name = 'Subject';
		this.pivot = new THREE.Group(); // turntable rotates this
		this.root.add(this.pivot);
		this.model = null;
		this.name = '';
		this.mixer = null;
		this.clips = [];
		this.action = null;
		this.playing = true;
		this.speed = 1;
		this.turntable = false;
		this.turntableSpeed = 20;
		this.sourceId = null;
		// The character controller drives the mixer itself (weights, synced locomotion) while it is active.
		this.externalMixer = false;
		// Procedural character (src/procedural CharacterModel): animates its own bones, no mixer / clips.
		this.procedural = null;
		this.locoSpeed = 0; // m/s fed to its locomotion auto-select (idle / walk / run)
	}

	setProcedural(model, name, sourceId) {
		// Built in metres at game scale (bats and imps are meant to be small): no size normalisation.
		this.set(model.root, [], name, sourceId, { normalize: false });
		this.procedural = model;
		return this;
	}

	set(object, animations = [], name = 'Model', sourceId = null, { normalize = true } = {}) {
		this.clear();
		this.name = name;
		this.sourceId = sourceId;
		object.updateMatrixWorld(true);
		const box = new THREE.Box3().setFromObject(object);
		const size = box.getSize(new THREE.Vector3());
		const maxDim = Math.max(size.x, size.y, size.z) || 1;
		const scale = normalize && (maxDim > 6 || maxDim < 0.3) ? 1.6 / maxDim : 1;
		this.scale = scale;
		const holder = new THREE.Group();
		holder.name = name;
		holder.add(object);
		holder.scale.setScalar(scale);
		holder.updateMatrixWorld(true);
		// Characters stand on their own feet: centre and ground them on the skinned body, not on the
		// weapons / props they carry (a sword in front would put the pivot outside the body).
		const scaled = bodyBounds(holder);
		const center = scaled.getCenter(new THREE.Vector3());
		holder.position.set(-center.x, -scaled.min.y, -center.z);
		holder.traverse((o) => {
			if (o.isMesh) {
				o.castShadow = true;
				o.receiveShadow = true;
				// glTF allows meshes without normals (flat shaded). Override materials used by G-buffer
				// passes (GTAO normals) need the attribute, so generate it; the material stays flat.
				if (o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals();
			}
		});
		this.model = holder;
		this.pivot.add(holder);
		this.clips = animations;
		if (animations.length) {
			this.mixer = new THREE.AnimationMixer(object);
			const idle = animations.findIndex((c) => /^idle$/i.test(c.name));
			const anyIdle = animations.findIndex((c) => /idle|survey/i.test(c.name));
			this.play(idle >= 0 ? idle : anyIdle >= 0 ? anyIdle : 0);
		}
		return this;
	}

	play(index) {
		if (!this.mixer) return;
		this.mixer.stopAllAction();
		const clip = this.clips[index];
		this.action = clip ? this.mixer.clipAction(clip) : null;
		if (this.action) {
			this.action.reset().play();
			this.action.paused = !this.playing;
		}
	}

	setPlaying(playing) {
		this.playing = playing;
		if (this.action) this.action.paused = !playing;
	}

	seek(t) {
		if (!this.action) return;
		const paused = this.action.paused;
		this.action.paused = false;
		this.action.time = t;
		this.mixer.update(0);
		this.action.paused = paused;
	}

	update(delta) {
		if (this.mixer && !this.externalMixer) this.mixer.update(delta * this.speed);
		if (this.procedural && !this.externalMixer) {
			// externalMixer: gameplay drives the procedural character (and advances the shared time itself)
			const dt = this.playing ? delta * this.speed : 0;
			SHARED.uniforms.uTime.value += dt;
			this.procedural.update(dt, { speed: this.locoSpeed });
		}
		if (this.turntable) this.pivot.rotation.y += THREE.MathUtils.degToRad(this.turntableSpeed) * delta;
	}

	clear() {
		this.mixer?.stopAllAction();
		// Its geometry is a shared, cached template: dispose only the instance (material, skeleton, cape).
		if (this.procedural) {
			this.procedural.dispose();
			this.procedural = null;
		}
		if (this.model) {
			this.pivot.remove(this.model);
			disposeTree(this.model);
		}
		this.model = null;
		this.mixer = null;
		this.clips = [];
		this.action = null;
		this.pivot.rotation.set(0, 0, 0);
		this.pivot.scale.set(1, 1, 1);
	}

	stats() {
		if (!this.model) return null;
		let triangles = 0;
		let meshes = 0;
		let skinned = 0;
		let bones = 0;
		const materials = new Set();
		const textures = new Set();
		this.model.traverse((o) => {
			if (o.isMesh) {
				meshes++;
				if (o.isSkinnedMesh) {
					skinned++;
					bones = Math.max(bones, o.skeleton?.bones.length || 0);
				}
				const g = o.geometry;
				const count = g.index ? g.index.count : g.attributes.position.count;
				triangles += (count / 3) * (o.isInstancedMesh ? o.count : 1);
				for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
					materials.add(m);
					for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
				}
			}
		});
		let textureBytes = 0;
		for (const t of textures) {
			const img = t.image;
			const w = img?.width || img?.videoWidth || 0;
			const h = img?.height || img?.videoHeight || 0;
			textureBytes += w * h * 4 * (t.generateMipmaps === false ? 1 : 1.333);
		}
		return {
			triangles: Math.round(triangles),
			meshes,
			skinned,
			bones,
			materials: materials.size,
			textures: textures.size,
			textureMB: textureBytes / 1048576,
			clips: this.clips.length,
			scale: this.scale,
		};
	}
}

export function disposeTree(root) {
	root.traverse((o) => {
		// Items held by the character (props library clones) share geometry / materials: keep them.
		for (let p = o; p && p !== root.parent; p = p.parent) if (p.userData.labItem) return;
		o.geometry?.dispose();
		if (o.material) {
			for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
				for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
				m.dispose();
			}
		}
	});
}

/** Bounds of the skinned meshes when there are any (the body), else of everything. */
export function bodyBounds(root) {
	root.updateMatrixWorld(true);
	const box = new THREE.Box3();
	let skinned = false;
	root.traverse((o) => {
		if (!o.isSkinnedMesh || !o.visible) return;
		skinned = true;
		o.computeBoundingBox();
		box.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));
	});
	return skinned && !box.isEmpty() ? box : new THREE.Box3().setFromObject(root);
}

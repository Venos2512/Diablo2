// Lookdev view modes. Channel views are rendered by the backend (GLSL patch / TSL MRT);
// clay, UV checker and wireframe swap materials in shared code so both renderers behave the same.
import * as THREE from 'three';
import { createUvChecker } from './references.js';

export const VIEWS = {
	lit: { label: 'Lit (final image)', channel: 0 },
	albedo: { label: 'Base colour (albedo)', channel: 1 },
	normal: { label: 'World normal', channel: 2 },
	roughness: { label: 'Roughness', channel: 3 },
	metalness: { label: 'Metalness', channel: 4 },
	ao: { label: 'Material AO map', channel: 5, webglOnly: true },
	emissive: { label: 'Emissive', channel: 6 },
	validate: { label: 'PBR validation', channel: 7 },
	ssao: { label: 'SSAO buffer (GTAO)', channel: 8 },
	clay: { label: 'Clay (lighting only)', swap: 'clay' },
	uv: { label: 'UV checker', swap: 'uv' },
	wire: { label: 'Wireframe', swap: 'wire' },
};

export const VIEW_LEGENDS = {
	validate: [
		['#d90505', 'Non-metal too dark (< 30 sRGB)'],
		['#0533f2', 'Non-metal too bright (> 240 sRGB)'],
		['#f25905', 'Metal too dark (< 180 sRGB)'],
		['#bf0dbf', 'Mixed metalness (0.1 – 0.9)'],
		['#777777', 'In range (shown as grey)'],
	],
	falsecolor: [
		['#ffbfe6', '> +6 EV'],
		['#e61a0d', '+4 … +6 EV'],
		['#f2800d', '+2 … +4 EV'],
		['#d9cc1a', '+0.5 … +2 EV'],
		['#808080', '18% grey ± 0.5 EV'],
		['#1f8c26', '−2 … −0.5 EV'],
		['#00738c', '−4 … −2 EV'],
		['#0d1fa6', '−6 … −4 EV'],
		['#2e0047', '< −6 EV'],
	],
};

export class ViewModes {
	constructor() {
		this.current = 'lit';
		this.originals = new Map(); // mesh -> original material(s)
		this.cache = new WeakMap(); // original material -> swapped material (per mode)
		this.uvTexture = null;
	}

	swapMaterial(original, mode) {
		let perMode = this.cache.get(original);
		if (!perMode) this.cache.set(original, (perMode = {}));
		if (perMode[mode]) return perMode[mode];
		let m;
		if (mode === 'wire') {
			m = original.clone();
			m.wireframe = true;
		} else {
			m = new THREE.MeshStandardMaterial({
				color: mode === 'clay' ? new THREE.Color().setRGB(0.35, 0.35, 0.35) : 0xffffff,
				roughness: 0.55,
				metalness: 0,
				map: mode === 'uv' ? (this.uvTexture ??= createUvChecker()) : null,
				normalMap: original.normalMap || null,
				normalScale: original.normalScale ? original.normalScale.clone() : new THREE.Vector2(1, 1),
				side: original.side,
				transparent: false,
				alphaTest: original.alphaTest || 0,
				alphaMap: original.alphaTest ? original.alphaMap || original.map || null : null,
				flatShading: original.flatShading || false,
			});
			if (original.normalMap && original.normalMapType !== undefined) m.normalMapType = original.normalMapType;
		}
		m.name = `${original.name || original.type} · ${mode}`;
		m.userData.labViewSwap = true;
		perMode[mode] = m;
		return m;
	}

	/** Apply `mode` to every mesh under `roots` (restoring the previous swap first). */
	apply(mode, roots) {
		this.restore();
		this.current = mode;
		const def = VIEWS[mode];
		if (!def?.swap) return;
		for (const root of roots) {
			root.traverse((object) => {
				if (!object.isMesh || !object.material || object.userData.labNoView) return;
				const original = object.material;
				this.originals.set(object, original);
				object.material = Array.isArray(original) ? original.map((m) => this.swapMaterial(m, def.swap)) : this.swapMaterial(original, def.swap);
			});
		}
	}

	restore() {
		for (const [mesh, material] of this.originals) mesh.material = material;
		this.originals.clear();
	}

	/** Give a mesh its real material back (e.g. before it leaves the scene). */
	restoreMesh(mesh) {
		if (!this.originals.has(mesh)) return;
		mesh.material = this.originals.get(mesh);
		this.originals.delete(mesh);
	}

	/** Material the mesh shows in lit / channel views (a swap view may currently cover it). */
	baseMaterial(mesh) {
		return this.originals.has(mesh) ? this.originals.get(mesh) : mesh.material;
	}

	/** Replace the mesh's real material without breaking an active swap view. */
	setBaseMaterial(mesh, material) {
		if (!this.originals.has(mesh)) {
			mesh.material = material;
			return;
		}
		this.originals.set(mesh, material);
		const swap = VIEWS[this.current]?.swap;
		mesh.material = Array.isArray(material) ? material.map((m) => this.swapMaterial(m, swap)) : this.swapMaterial(material, swap);
	}

	/** Re-apply after new objects were added while a swap view is active. */
	refresh(roots) {
		if (VIEWS[this.current]?.swap) this.apply(this.current, roots);
	}
}

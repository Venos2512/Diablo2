// Support for the N-layer terrain effect (createTerrainLayers: shaders/effects/terrain_layers.glsl + its TSL twin):
//  · LayerSplat — a world-space two-texture splat: splat 0 = layers 1..4 (RGBA), splat 1 = layers 5..7 (RGB) + wetness (A). Layer 0 is the base.
//  · buildLayerLibrary — the ground textures packed into THREE.DataArrayTexture (albedo, OpenGL normal + height in A, ORM with G = roughness), one slice per
//    texture, shared by every material that uses the effect (rows flipped so the image top is v = 1, like loadPaintedSets).
//  · createLayerTerrain — a material + effect for a list of layers { id, tile (m), ns (normal strength), mode (anti-tiling: -1 off, 0 offsets, 1 + quarter, 2 + half turns) }.
import * as THREE from 'three';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export class LayerSplat {
	/** Covers the square [originX, originX + extent] × [originZ, originZ + extent] (metres); texture row 0 is z = originZ (v = 0). */
	constructor({ size = 256, originX = 0, originZ = 0, extent = 14 } = {}) {
		this.size = size;
		this.originX = originX;
		this.originZ = originZ;
		this.extent = extent;
		this.blur = 2;
		this.blurWet = 2;
		this.passes = 2;
		this.raw = [new Uint8Array(size * size * 4), new Uint8Array(size * size * 4)];
		this.smoothed = [new Uint8Array(size * size * 4), new Uint8Array(size * size * 4)];
		this.scratch = new Float32Array(size * size);
		this.plane = new Float32Array(size * size);
		this.textures = this.smoothed.map((data, i) => {
			const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);
			Object.assign(tex, { name: `Terrain layer splat ${i}${i ? ' (layers 5..7, wetness)' : ' (layers 1..4)'}`, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false, colorSpace: THREE.NoColorSpace, needsUpdate: true });
			return tex;
		});
		this.rect = new THREE.Vector4(originX, originZ, 1 / extent, 1 / extent);
	}

	/** Fill from fn(x, z, out): out[0..6] = coverage of layers 1..7, out[7] = wetness (0..1). */
	fill(fn) {
		const { size, raw, extent } = this;
		const k = extent / size;
		const out = new Float32Array(8);
		for (let j = 0; j < size; j++) {
			for (let i = 0; i < size; i++) {
				out.fill(0);
				fn(this.originX + (i + 0.5) * k, this.originZ + (j + 0.5) * k, out);
				const o = (j * size + i) * 4;
				for (let c = 0; c < 4; c++) {
					raw[0][o + c] = Math.round(clamp01(out[c]) * 255);
					raw[1][o + c] = Math.round(clamp01(out[4 + c]) * 255);
				}
			}
		}
		this.refresh();
	}

	/**
	 * Blur of the painted weights into the uploaded copies, then upload: `passes` separable box blurs of `blur` texels each side (two passes = a smooth
	 * bell-shaped kernel; the transition of a hard edge is then about 2.2 x blur wide, 10-90 %). The wetness channel (splat 1 alpha) has its own radius
	 * `blurWet` (one pass), so wide ground blends do not move the puddle field's wet halo / gating.
	 */
	refresh() {
		const { size, scratch } = this;
		const passes = Math.max(1, Math.round(this.passes));
		const plane = this.plane;
		for (let t = 0; t < 2; t++) {
			const src = this.raw[t];
			const dst = this.smoothed[t];
			for (let c = 0; c < 4; c++) {
				const r = Math.max(0, Math.round(t === 1 && c === 3 ? this.blurWet : this.blur));
				if (!r) {
					for (let p = 0; p < size * size; p++) dst[p * 4 + c] = src[p * 4 + c];
					continue;
				}
				for (let p = 0; p < size * size; p++) plane[p] = src[p * 4 + c];
				const norm = 1 / (2 * r + 1);
				for (let pass = 0; pass < (t === 1 && c === 3 ? 1 : passes); pass++) {
					for (let j = 0; j < size; j++) {
						const row = j * size;
						let sum = 0;
						for (let k = -r; k <= r; k++) sum += plane[row + Math.min(size - 1, Math.max(0, k))];
						for (let i = 0; i < size; i++) {
							scratch[row + i] = sum * norm;
							sum += plane[row + Math.min(size - 1, i + r + 1)] - plane[row + Math.max(0, i - r)];
						}
					}
					for (let i = 0; i < size; i++) {
						let sum = 0;
						for (let k = -r; k <= r; k++) sum += scratch[Math.min(size - 1, Math.max(0, k)) * size + i];
						for (let j = 0; j < size; j++) {
							plane[j * size + i] = sum * norm;
							sum += scratch[Math.min(size - 1, j + r + 1) * size + i] - scratch[Math.max(0, j - r) * size + i];
						}
					}
				}
				for (let p = 0; p < size * size; p++) dst[p * 4 + c] = Math.round(plane[p]);
			}
		}
		for (const tex of this.textures) tex.needsUpdate = true;
	}

	/** Blur radii from metres: `metres` for the ground layers, at most `wetMetres` for the wetness channel. */
	setBlurMetres(metres, wetMetres = metres) {
		const texel = this.extent / this.size;
		this.blur = Math.round(metres / texel);
		this.blurWet = Math.min(this.blur, Math.round(wetMetres / texel));
	}

	/** Bilinear weights at world xz of the smoothed copies the GPU sees: out[0..6] = layers 1..7, out[7] = wetness (0..1). */
	sample(x, z, out) {
		const { size } = this;
		const fx = Math.min(size - 1.001, Math.max(0, ((x - this.originX) / this.extent) * size - 0.5));
		const fz = Math.min(size - 1.001, Math.max(0, ((z - this.originZ) / this.extent) * size - 0.5));
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		const tx = fx - i;
		const tz = fz - j;
		for (let t = 0; t < 2; t++) {
			const data = this.smoothed[t];
			for (let c = 0; c < 4; c++) {
				const at = (ii, jj) => data[(jj * size + ii) * 4 + c];
				out[t * 4 + c] = ((at(i, j) * (1 - tx) + at(i + 1, j) * tx) * (1 - tz) + (at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx) * tz) / 255;
			}
		}
		return out;
	}

	dispose() {
		for (const tex of this.textures) tex.dispose();
	}
}

function arrayTexture(data, w, h, depth, name, colorSpace, anisotropy) {
	const tex = new THREE.DataArrayTexture(data, w, h, depth);
	Object.assign(tex, { name, format: THREE.RGBAFormat, type: THREE.UnsignedByteType, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy, colorSpace, needsUpdate: true });
	return tex;
}

/**
 * Pack textures into the three arrays. entries = [{ key, file }] (file = the sample id prefix: `<file>`, `-h`, `-n`, `-r`). Returns
 * { map, normalMap, ormMap, index: { key → slice }, size }. Albedo / height / normal must share one size (1024); roughness lives in its own, smaller array (the smallest -r size; larger ones are box-filtered).
 */
export async function buildLayerLibrary(app, entries, { concurrency = 4 } = {}) {
	const aniso = Math.min(8, app.backend.caps.maxAnisotropy || 4);
	const decoded = new Array(entries.length);
	let next = 0;
	const worker = async () => {
		while (next < entries.length) {
			const i = next++;
			const f = entries[i].file;
			decoded[i] = await Promise.all([f, `${f}-h`, `${f}-n`, `${f}-r`].map((id) => app.loader.loadImageData(id)));
		}
	};
	await Promise.all(Array.from({ length: concurrency }, worker));
	const size = decoded[0][0].width;
	const rs = Math.min(...decoded.map((d) => d[3].width)); // roughness is low-frequency: the smallest size wins, bigger maps are box-filtered down
	const depth = entries.length;
	const map = new Uint8Array(size * size * 4 * depth);
	const normal = new Uint8Array(size * size * 4 * depth);
	const orm = new Uint8Array(rs * rs * 4 * depth);
	const index = {};
	const mean = {}; // key -> mean albedo, linear rgb (the effect's variance-preserving blends and decal tints)
	const toLinear = (v) => ((v / 255 + 0.055) / 1.055) ** 2.4;
	decoded.forEach(([a, h, n, r], d) => {
		if (a.width !== size || h.width !== size || n.width !== size || r.width % rs) throw new Error(`${entries[d].file}: sizes differ from the library's (${size} / ${rs})`);
		index[entries[d].key] = d;
		const sum = [0, 0, 0];
		let count = 0;
		for (let y = 0; y < size; y += 8) for (let x = 0; x < size; x += 8) {
			const o = (y * size + x) * 4;
			sum[0] += toLinear(a.data[o]);
			sum[1] += toLinear(a.data[o + 1]);
			sum[2] += toLinear(a.data[o + 2]);
			count++;
		}
		mean[entries[d].key] = sum.map((v) => v / count);
		const base = d * size * size * 4;
		for (let y = 0; y < size; y++) {
			const src = (size - 1 - y) * size * 4;
			const dst = base + y * size * 4;
			for (let x = 0; x < size * 4; x += 4) {
				map[dst + x] = a.data[src + x];
				map[dst + x + 1] = a.data[src + x + 1];
				map[dst + x + 2] = a.data[src + x + 2];
				map[dst + x + 3] = 255;
				normal[dst + x] = n.data[src + x];
				normal[dst + x + 1] = n.data[src + x + 1];
				normal[dst + x + 2] = n.data[src + x + 2];
				normal[dst + x + 3] = h.data[src + x];
			}
		}
		const obase = d * rs * rs * 4;
		const f = r.width / rs;
		for (let y = 0; y < rs; y++) {
			for (let x = 0; x < rs; x++) {
				let sum = 0;
				for (let v = 0; v < f; v++) for (let u = 0; u < f; u++) sum += r.data[((rs - 1 - y) * f + v) * r.width * 4 + (x * f + u) * 4];
				orm.set([255, Math.round(sum / (f * f)), 0, 255], obase + (y * rs + x) * 4);
			}
		}
	});
	return {
		map: arrayTexture(map, size, size, depth, 'Terrain layers · map (sRGB)', THREE.SRGBColorSpace, aniso),
		normalMap: arrayTexture(normal, size, size, depth, 'Terrain layers · normalMap (height in alpha)', THREE.NoColorSpace, aniso),
		ormMap: arrayTexture(orm, rs, rs, depth, 'Terrain layers · ormMap (G roughness)', THREE.NoColorSpace, aniso),
		index,
		mean,
		size,
		depth,
	};
}

/**
 * Material + effect for `layers` (2..8, bottom → top: { key, tile, ns, mode, porosity }) of `library`, covering `splat`. Porosity (0..1) is how much the layer
 * darkens and glosses when wet (soil, mud ~1; grass ~0.5; stone, planks ~0.25). Returns { material, effect }; effect.uniforms are the effect's controls.
 */
export function createLayerTerrain(app, splat, library, layers) {
	if (layers.length < 2 || layers.length > 8) throw new Error(`the layer terrain takes 2..8 layers, got ${layers.length}`);
	const effect = app.backend.effects.createTerrainLayers({ library, count: layers.length, splats: splat.textures, rect: splat.rect });
	layers.forEach((l, i) => {
		effect.uniforms.params[i].set(1 / l.tile, l.ns ?? 1, l.mode ?? 1, library.index[l.key]);
		const m = library.mean[l.key];
		effect.uniforms.params2[i].set(m[0], m[1], m[2], l.porosity ?? 0.7);
	});
	// MeshPhysicalMaterial (no clearcoat, sheen or transmission: the same lighting cost as Standard): the puddle edge damps the specular through F0 / F90 (GLSL) and the `specularScale` hook (TSL)
	const base = new THREE.MeshPhysicalMaterial({ name: 'Layer terrain (splat arrays)', color: 0xffffff, roughness: 1, metalness: 0 });
	return { material: effect.apply(base), effect };
}

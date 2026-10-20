// Shell grass: stacked copies of the terrain mesh where the splat has grass, each lifted a few millimetres and
// alpha-tested against the grass layer's height (rank-normalised, so shell k keeps the tallest (1 - k/N) of the
// texels) times the splat's grass weight. The painted grass gets a real thickness: blade tips stand off the ground,
// the grass mat's edge rises off the soil (partial weights keep only the low shells), and it shows parallax as the
// camera moves. Low shells are darker (roots), high ones lighter (tips). Coverage stays partial (the bottom shell keeps
// about half the texels), so the ground shading under it (macro variation, contact shadow) still shows between blades.
// Plain MeshStandardMaterial (map + alphaMap + alphaTest), so both renderers draw it without a custom shader.
import * as THREE from 'three';

/**
 * RGBA texture for the shells from a painted layer set ({ map, normalMap } DataTextures, height in normal alpha):
 * rgb = the layer's albedo, a = its height mapped through its own histogram (uniform 0..1 coverage).
 * Null for sets without CPU-side data (procedural forge sets).
 */
export function shellTexture(set, anisotropy = 4) {
	const albedo = set?.map?.image?.data;
	const normal = set?.normalMap?.image?.data;
	if (!albedo || !normal) return null;
	const { width, height } = set.map.image;
	const hist = new Float64Array(256);
	for (let o = 3; o < normal.length; o += 4) hist[normal[o]]++;
	const cdf = new Uint8Array(256);
	let sum = 0;
	for (let v = 0; v < 256; v++) {
		sum += hist[v];
		cdf[v] = Math.round((sum / (width * height)) * 255);
	}
	const data = new Uint8Array(width * height * 4);
	for (let o = 0; o < data.length; o += 4) {
		data[o] = albedo[o];
		data[o + 1] = albedo[o + 1];
		data[o + 2] = albedo[o + 2];
		data[o + 3] = cdf[normal[o + 3]];
	}
	const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
	tex.name = 'Grass shells (albedo + height rank)';
	tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
	tex.generateMipmaps = true;
	tex.minFilter = THREE.LinearMipmapLinearFilter;
	tex.magFilter = THREE.LinearFilter;
	tex.anisotropy = anisotropy;
	tex.colorSpace = set.map.colorSpace;
	tex.needsUpdate = true;
	return tex;
}

/**
 * @param {{ geometry: THREE.BufferGeometry, splat: import('./terrain.js').TerrainSplat, texture: THREE.Texture,
 *   tile: number, count?: number, height?: number, coverage?: number, minWeight?: number }} o
 * geometry = the terrain mesh geometry (world space); tile = metres per repeat of the grass layer (texture
 * lines up with the terrain shader's own grass: u = x / tile, v = -z / tile).
 * Returns a Group (one mesh per shell, sharing one geometry) with dispose().
 */
export function createGrassShells({ geometry, splat, texture, tile, count = 12, height = 0.1, coverage = 0.5, minWeight = 12 }) {
	const { originX, originZ, extent, size } = splat;
	const src = splat.smoothed;
	const weight = (x, z) => {
		const i = Math.min(size - 1, Math.max(0, Math.floor(((x - originX) / extent) * size)));
		const j = Math.min(size - 1, Math.max(0, Math.floor(((z - originZ) / extent) * size)));
		return src[(j * size + i) * 4 + 1];
	};
	// Splat-space UV (alphaMap reads the splat's G directly); only triangles that touch grass.
	const pos = geometry.attributes.position;
	const uv = new Float32Array(pos.count * 2);
	const w = new Uint8Array(pos.count);
	for (let i = 0; i < pos.count; i++) {
		uv[i * 2] = (pos.getX(i) - originX) / extent;
		uv[i * 2 + 1] = (pos.getZ(i) - originZ) / extent;
		w[i] = weight(pos.getX(i), pos.getZ(i));
	}
	const src3 = geometry.index.array;
	const index = [];
	for (let t = 0; t < src3.length; t += 3) {
		const a = src3[t], b = src3[t + 1], c = src3[t + 2];
		if (Math.max(w[a], w[b], w[c]) >= minWeight) index.push(a, b, c);
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', pos);
	g.setAttribute('normal', geometry.attributes.normal);
	g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
	g.setIndex(index);

	// Albedo in world tiling, through the texture transform: uv' = uv × repeat + offset = (x / tile, -z / tile).
	texture.repeat.set(extent / tile, -extent / tile);
	texture.offset.set(originX / tile, -originZ / tile);

	const group = new THREE.Group();
	group.name = `Grass shells (${count})`;
	for (let k = 0; k < count; k++) {
		const t = (k + 1) / count;
		const shade = 0.72 + 0.4 * t; // roots dark, tips light
		const material = new THREE.MeshStandardMaterial({
			name: `Grass shell ${k + 1}`,
			map: texture,
			alphaMap: splat.texture,
			alphaTest: 1 - coverage + (coverage - 0.03) * t, // the bottom shell keeps `coverage` of the texels, the top one 3 %
			color: new THREE.Color(shade * 1.02, shade, shade * (0.92 - 0.06 * t)),
			roughness: 0.92,
			metalness: 0,
		});
		const mesh = new THREE.Mesh(g, material);
		mesh.name = `Grass shell ${k + 1}`;
		mesh.position.y = height * t;
		mesh.receiveShadow = true;
		mesh.castShadow = false;
		group.add(mesh);
	}
	group.dispose = () => {
		g.dispose();
		group.children.forEach((m) => m.material.dispose());
	};
	return group;
}

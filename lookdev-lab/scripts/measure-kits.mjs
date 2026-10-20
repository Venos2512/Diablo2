// Measures every prop kit GLB (geometry-local bounding boxes, no dependencies) into src/env/kitSizes.json, which the
// biome layout catalog derives footprints and sizes from. The scenes position `mesh.geometry` directly and ignore node
// transforms, so this reads raw POSITION accessors the same way.
// Usage: npm run measure:kits
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const samples = path.join(root, 'assets/samples');
const out = path.join(root, 'src/env/kitSizes.json');

// kit key (as scenes load it) → samples.json id
export const KITS = {
	fence: 'kit-wooden-fence', palisade: 'kit-palisade', tents: 'kit-tents', tentsB: 'kit-tents-b', shrubs: 'kit-shrubs',
	kitchen: 'kit-camp-kitchen', storage: 'kit-camp-storage', training: 'kit-camp-training', crafts: 'kit-camp-crafts',
	lighting: 'kit-camp-lighting', banners: 'kit-camp-banners', seating: 'kit-camp-seating', shrine: 'kit-camp-shrine',
	animals: 'kit-camp-animals', clutter: 'kit-camp-clutter', stations: 'kit-camp-stations', rocks: 'kit-moor-rocks',
	mossy: 'kit-mossy-rocks', corpses: 'kit-buried-corpses', deadTrees: 'kit-dead-trees', burnedTrees: 'kit-burned-trees',
};

const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ARRAYS = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
// normalised integer positions (KHR_mesh_quantization) map back to [-1, 1] / [0, 1]
const NORMAL = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 };

function parseGlb(buffer) {
	const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	if (view.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
	let json = null;
	let bin = null;
	for (let at = 12; at < buffer.byteLength;) {
		const length = view.getUint32(at, true);
		const type = view.getUint32(at + 4, true);
		const data = buffer.subarray(at + 8, at + 8 + length);
		if (type === 0x4e4f534a) json = JSON.parse(Buffer.from(data).toString('utf8'));
		else if (type === 0x004e4942 && !bin) bin = data;
		at += 8 + length;
	}
	return { json, bin };
}

/** Reads an accessor into a plain Float64Array of its components (sparse accessors are not used by the kits). */
function readAccessor(json, bin, index) {
	const acc = json.accessors[index];
	const comps = COMPONENTS[acc.type];
	const Type = ARRAYS[acc.componentType];
	const view = json.bufferViews[acc.bufferView];
	const stride = view.byteStride || comps * Type.BYTES_PER_ELEMENT;
	const base = bin.byteOffset + (view.byteOffset || 0) + (acc.byteOffset || 0);
	const dv = new DataView(bin.buffer, 0, bin.buffer.byteLength);
	const getter = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[acc.componentType];
	const out = new Float64Array(acc.count * comps);
	for (let i = 0; i < acc.count; i++) {
		for (let c = 0; c < comps; c++) {
			let v = dv[getter](base + i * stride + c * Type.BYTES_PER_ELEMENT, true);
			if (acc.normalized && NORMAL[acc.componentType]) v = Math.max(v / NORMAL[acc.componentType], -1);
			out[i * comps + c] = v;
		}
	}
	return out;
}

const mm = (v) => Math.round(v * 1000) / 1000;

/** Geometry-local bbox of a mesh's POSITION data plus the xz box of its lowest 15 % (trunks, roots). */
function measureMesh(json, bin, mesh) {
	const verts = [];
	for (const prim of mesh.primitives) {
		if (prim.attributes.POSITION == null) continue;
		const data = readAccessor(json, bin, prim.attributes.POSITION);
		for (let i = 0; i < data.length; i += 3) verts.push(data[i], data[i + 1], data[i + 2]);
	}
	if (!verts.length) return null;
	const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
	for (let i = 0; i < verts.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], verts[i + k]); hi[k] = Math.max(hi[k], verts[i + k]); }
	const height = hi[1] - lo[1];
	const cut = lo[1] + height * 0.15;
	const b = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
	for (let i = 0; i < verts.length; i += 3) {
		if (verts[i + 1] > cut) continue;
		b.x0 = Math.min(b.x0, verts[i]); b.x1 = Math.max(b.x1, verts[i]);
		b.z0 = Math.min(b.z0, verts[i + 2]); b.z1 = Math.max(b.z1, verts[i + 2]);
	}
	return {
		base: { x0: mm(b.x0), x1: mm(b.x1), z0: mm(b.z0), z1: mm(b.z1) },
		height: mm(height),
		x0: mm(lo[0]), x1: mm(hi[0]), y0: mm(lo[1]), y1: mm(hi[1]), z0: mm(lo[2]), z1: mm(hi[2]),
	};
}

const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));

export async function measureAll() {
	const sizes = {};
	for (const [key, id] of Object.entries(KITS)) {
		const file = path.join(samples, `${id}.glb`);
		let glb;
		try { glb = parseGlb(await readFile(file)); } catch (error) { console.warn(`  skip ${key}: ${error.message}`); continue; }
		const pieces = {};
		for (const node of glb.json.nodes ?? []) {
			if (node.mesh == null) continue;
			const mesh = glb.json.meshes[node.mesh];
			// the scenes key pieces by the node (object) name, falling back to the mesh name
			const name = (node.name ?? mesh.name ?? '').replace(/^[a-z]+_\d+_/, '');
			const m = measureMesh(glb.json, glb.bin, mesh);
			if (m && name) pieces[`${key}.${name}`] = m;
		}
		for (const [k, v] of Object.entries(pieces)) {
			sizes[k] = { base: v.base, height: v.height, x0: v.x0, x1: v.x1, y0: v.y0, y1: v.y1, z0: v.z0, z1: v.z1 };
		}
		console.log(`  ${key.padEnd(12)} ${id.padEnd(22)} ${Object.keys(pieces).length} pieces`);
	}
	return sorted(sizes);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const sizes = await measureAll();
	await writeFile(out, `${JSON.stringify(sizes, null, '\t')}\n`);
	console.log(`${Object.keys(sizes).length} pieces → ${path.relative(root, out)}`);
}

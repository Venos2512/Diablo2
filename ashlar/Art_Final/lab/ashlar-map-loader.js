// ashlar-map-loader.js: builds an ASHLAR map ("ashlar-map/1" JSON + the Art_Final folder) in three.js, with no other game or lab code.
//
//   import { loadAshlarMap } from './ashlar-map-loader.js';
//   const map = await loadAshlarMap('/art/lab/act1Fens.json', {
//     baseUrl: '/art/',                 // URL of the Art_Final root; every path in the JSON is relative to it (default: the JSON's ../)
//     renderer, scene,                  // optional, see below
//     mood: 'night',                    // optional; default = lighting.default of the JSON
//     shadows: false,                   // true: the sun / spot lights cast shadows and objects receive them
//     onProgress: (fraction, label) => {},
//     gltfLoader, textureLoader,        // optional: your own loaders (e.g. with a KTX2 / Draco decoder); defaults are plain
//   });
//   scene.add(map.root);
//   map.update(timeSeconds);           // every frame: light flicker, water scroll (optional; the height fog needs no per-frame call)
//   map.setMood('rain');                // switches lights / fog / background / exposure / environment in place
//   map.heightAt(x, z);                 // ground height in metres (NaN where the map has no ground)
//   map.dispose();
//
// Returns { root, data, kind, terrain, water, lights, moods, mood, setMood, bind, update, heightAt, surfaceAt, blockers, colliders, markers, spawns,
//           views, defaultView, viewCamera, bounds, missing, stats, dispose }.
//   root       THREE.Group with everything (terrain, water, GLB instances, cards, far silhouettes, lights, glow sprites).
//   terrain    THREE.Mesh or THREE.Group (dungeon: one mesh per area).   water: THREE.Group (may be empty).
//   lights     [{ id, light (THREE.Light or null), sprite (THREE.Sprite or null), def }].
//   moods      names in the JSON; mood = current name.   setMood(name) keeps the number of lights constant, only intensities / colours change.
//   bind(scene, renderer)   remembers the scene + renderer (also given as options) and applies the current mood to them: scene.background (= the fog colour when fog is on: the lab's sky is fully fogged),
//                           scene.environment (+ environmentIntensity, equirect HDR; three converts it itself) and renderer.toneMapping (ACES) / toneMappingExposure.
//                           Without a scene the loader only fills map.look = { background, fog:{color,density,falloff,height,start}, environment, environmentIntensity, exposure }.
//   heightAt   bilinear sample of the embedded heightfield.  surfaceAt also counts the walkable decks.
//   blockers   walk.blockers as in the JSON (outdoor footprints).  colliders = [{ type:'poly'|'wall'|'solid', ... }] plain data (see buildColliders).
//   markers, spawns   walk.markers / walk.spawns.   views = [{ id, label, position:[x,y,z], target:[x,y,z], fov }] for a 16:9 window; viewCamera(view, aspect) re-fits.
//   missing    [{ asset, reason, count }]: things that could not be drawn (no GLB, no shape, not implemented) with the reason.
//
// Dependencies (peer): 'three' (r180; nothing removed in later r18x is used) and 'three/addons/loaders/GLTFLoader.js'. A WebGLRenderer (WebGL2) is assumed;
// the terrain shader uses sampler2DArray / textureGrad.  No other import, no network access except the files of Art_Final.
//
// IMPLEMENTED
//   outdoor (act1Fens, act1Lychgate, act1LychgateHub, act1PoppyReach): heightfield mesh with the spec normals; up to 8 ground layers blended by the embedded splat
//   (box-blurred like the lab, softness / heightBlend coverage, wetness darkens + glosses, OpenGL normal maps, roughness maps); water bodies (0.5 m grid, depth
//   tint + bank alpha, scrolling normal map); far black water frame, far hills, far silhouettes (composite parts); cobble road ribbons; grass / reed / sedge /
//   poppy cards from anchors and from the meadow buffers (instanced); every GLB object as InstancedMesh (one load per file, shared geometry + materials,
//   world = placement * asset.matrix, `cut` boxes applied); blockout assets as grey boxes of defSize; lights, moods, fog, background, exposure, HDR environment, glow
//   sprites, flicker.
//   interior (act1Cradle, act1GardenOfHush, act1GentleHouse): floor heightfield (NaN = no floor) with the layer material, wall runs as boxes with openings (door,
//   gap, arch as a lintel, window sill + lintel), crypt-wall GLB modules for runs with style.module, objects, spot / point lights with lightScale per mood.
//   oldFace, dungeon: floor / cave heightfields with layer materials, cave wall ring, crypt floor planes, wall modules (quaternion + non-uniform scale), props,
//   the dressing (procedural meshes, instanced groups, decals, flames), water rectangle of oldFace, lights and moods.
//   choiceHands: wall plane (two tiles mixed by the blend mask, tone mask as vertex colour), ledge, candle (dish, wax, flame, glow), lights, hand stand-in boxes.
//
// NOT IMPLEMENTED (honest list)
//   the lab's post pass: the exponential height fog is evaluated per fragment in every mesh material (same formula and numbers as the lab's composite shader,
//   inscatter term omitted; sprites are not fogged; the sky is the fog colour), but colour grade / vignette are not applied, no god rays;
//   anti-tiling of the ground textures (modes 0..2), layer height maps bending the blend, edge noise of the blend, the puddle shader (only wetness darkening);
//   rain streaks, mist, stars, smoke zones of Poppy Reach, meadow apron (land beyond the bounds), crows, the poppy field is drawn from the meadow buffers only;
//   warp variants (A21.5 wide, A25.1 slim) are drawn unbent; trim variants (A07.6, A13.4) are drawn untrimmed; window panes / glow of interior windows;
//   interior light groups (night-light dimming), hero light, interior apron (the dark floor past void edges; the NaN cells of the floor are simply not drawn),
//   interior floor shade uses a rebuilt dv (distance to the nearest wall run, + inside the finite floor, - outside) instead of the lab's exact wallDistance; wall run arch panels are boxes with a lintel;
//   oldFace / dungeon: Lathe / Extrude / Buffer geometries without parameters are drawn as their bounding boxes; cave floor image extras (caveFloor) unused;
//   choiceHands: the hand models (not in Art_Final), finger rig, dust motes, key art overlay, interaction (the scene is a static stage), wall displacement;
//   colliders are data only (the loader does not simulate walking).

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);

// ============================================================================================================================================================
// Pure helpers (exported for tests; no WebGL needed)
// ============================================================================================================================================================

/** base64 -> Uint8Array. */
export function b64ToBytes(b64) {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

/** "float32-le-base64" payload -> Float32Array (little-endian hosts). */
export function decodeFloat32(b64) {
	const bytes = b64ToBytes(b64);
	return new Float32Array(bytes.buffer, 0, bytes.length >> 2);
}

async function inflate(u8) {
	const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Decode an 8-bit, non-interlaced PNG (grey, grey+alpha, RGB, RGBA) without a canvas, so alpha stays data. Returns { width, height, channels, data }. */
export async function decodePng(bytes) {
	const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (dv.getUint32(0) !== 0x89504e47) throw new Error('not a PNG');
	let p = 8;
	let width = 0;
	let height = 0;
	let depth = 8;
	let ctype = 6;
	let interlace = 0;
	const parts = [];
	while (p < bytes.length) {
		const len = dv.getUint32(p);
		const type = String.fromCharCode(bytes[p + 4], bytes[p + 5], bytes[p + 6], bytes[p + 7]);
		const body = bytes.subarray(p + 8, p + 8 + len);
		if (type === 'IHDR') {
			width = dv.getUint32(p + 8);
			height = dv.getUint32(p + 12);
			depth = bytes[p + 16];
			ctype = bytes[p + 17];
			interlace = bytes[p + 20];
		} else if (type === 'IDAT') parts.push(body);
		else if (type === 'IEND') break;
		p += 12 + len;
	}
	const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[ctype];
	if (!channels || depth !== 8 || interlace) throw new Error(`unsupported PNG (colour type ${ctype}, depth ${depth}, interlace ${interlace})`);
	let total = 0;
	for (const b of parts) total += b.length;
	const joined = new Uint8Array(total);
	let o = 0;
	for (const b of parts) {
		joined.set(b, o);
		o += b.length;
	}
	const raw = await inflate(joined);
	const stride = width * channels;
	const out = new Uint8Array(height * stride);
	for (let y = 0; y < height; y++) {
		const f = raw[y * (stride + 1)];
		const src = y * (stride + 1) + 1;
		const dst = y * stride;
		for (let x = 0; x < stride; x++) {
			const v = raw[src + x];
			const a = x >= channels ? out[dst + x - channels] : 0;
			const b = y ? out[dst - stride + x] : 0;
			const c = x >= channels && y ? out[dst - stride + x - channels] : 0;
			let r;
			switch (f) {
				case 0: r = v; break;
				case 1: r = v + a; break;
				case 2: r = v + b; break;
				case 3: r = v + ((a + b) >> 1); break;
				default: {
					const pp = a + b - c;
					const pa = Math.abs(pp - a);
					const pb = Math.abs(pp - b);
					const pc = Math.abs(pp - c);
					r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
				}
			}
			out[dst + x] = r & 255;
		}
	}
	return { width, height, channels, data: out };
}

/** Expand a decoded PNG to RGBA (grey -> RGB, missing alpha = 255). */
export function pngToRgba(png) {
	const { width, height, channels, data } = png;
	if (channels === 4) return data;
	const out = new Uint8Array(width * height * 4);
	for (let i = 0; i < width * height; i++) {
		const s = i * channels;
		const r = data[s];
		const g = channels >= 3 ? data[s + 1] : r;
		const b = channels >= 3 ? data[s + 2] : r;
		const a = channels === 2 ? data[s + 1] : channels === 4 ? data[s + 3] : 255;
		out[i * 4] = r;
		out[i * 4 + 1] = g;
		out[i * 4 + 2] = b;
		out[i * 4 + 3] = a;
	}
	return out;
}

/** The lab's splat smoothing: `passes` separable box blurs of radius r texels per channel; the wetness channel (map 1 alpha) one pass of radius `rWet`. */
export function blurSplat(raws, size, r, rWet, passes = 2) {
	const plane = new Float32Array(size * size);
	const tmp = new Float32Array(size * size);
	return raws.map((src, t) => {
		const dst = new Uint8Array(src.length);
		for (let c = 0; c < 4; c++) {
			const wet = t === 1 && c === 3;
			const rad = Math.max(0, Math.round(wet ? rWet : r));
			for (let p = 0; p < size * size; p++) plane[p] = src[p * 4 + c];
			if (rad > 0) {
				const norm = 1 / (2 * rad + 1);
				for (let pass = 0; pass < (wet ? 1 : passes); pass++) {
					for (let j = 0; j < size; j++) {
						const row = j * size;
						let sum = 0;
						for (let k = -rad; k <= rad; k++) sum += plane[row + Math.min(size - 1, Math.max(0, k))];
						for (let i = 0; i < size; i++) {
							tmp[row + i] = sum * norm;
							sum += plane[row + Math.min(size - 1, i + rad + 1)] - plane[row + Math.max(0, i - rad)];
						}
					}
					for (let i = 0; i < size; i++) {
						let sum = 0;
						for (let k = -rad; k <= rad; k++) sum += tmp[Math.min(size - 1, Math.max(0, k)) * size + i];
						for (let j = 0; j < size; j++) {
							plane[j * size + i] = sum * norm;
							sum += tmp[Math.min(size - 1, j + rad + 1) * size + i] - tmp[Math.max(0, j - rad) * size + i];
						}
					}
				}
			}
			for (let p = 0; p < size * size; p++) dst[p * 4 + c] = Math.round(plane[p]);
		}
		return dst;
	});
}

/** Height sampler of a heightfield object (outdoor: vertices; field `sample` present: cell centres). Bilinear; NaN where there is no ground. */
export function makeHeightSampler(hf, data = decodeFloat32(hf.data)) {
	const { x0, z0, cell, nx, nz } = hf;
	const off = 'sample' in hf ? 0.5 : 0;
	return (x, z) => {
		const fx = Math.min(nx - 1, Math.max(0, (x - x0) / cell - off));
		const fz = Math.min(nz - 1, Math.max(0, (z - z0) / cell - off));
		const i = Math.min(nx - 2, Math.floor(fx));
		const j = Math.min(nz - 2, Math.floor(fz));
		const tx = fx - i;
		const tz = fz - j;
		const h00 = data[j * nx + i];
		const h10 = data[j * nx + i + 1];
		const h01 = data[(j + 1) * nx + i];
		const h11 = data[(j + 1) * nx + i + 1];
		const w00 = (1 - tx) * (1 - tz);
		const w10 = tx * (1 - tz);
		const w01 = (1 - tx) * tz;
		const w11 = tx * tz;
		if (h00 === h00 && h10 === h10 && h01 === h01 && h11 === h11) return h00 * w00 + h10 * w10 + h01 * w01 + h11 * w11;
		// no ground in the nearest sample -> none; otherwise average the valid neighbours
		const nearest = [h00, h10, h01, h11][(tz > 0.5 ? 2 : 0) + (tx > 0.5 ? 1 : 0)];
		if (nearest !== nearest) return NaN;
		let s = 0;
		let w = 0;
		for (const [h, ww] of [[h00, w00], [h10, w10], [h01, w01], [h11, w11]]) if (h === h) { s += h * ww; w += ww; }
		return w > 0 ? s / w : NaN;
	};
}

/** Vertex normals from central differences (clamped at the edges; NaN neighbours use the centre value). */
export function heightfieldNormals(f, nx, nz, cell) {
	const n = new Float32Array(nx * nz * 3);
	const at = (i, j, fallback) => {
		const v = f[Math.min(nz - 1, Math.max(0, j)) * nx + Math.min(nx - 1, Math.max(0, i))];
		return v === v ? v : fallback;
	};
	for (let j = 0; j < nz; j++) {
		for (let i = 0; i < nx; i++) {
			const c = f[j * nx + i];
			const o = (j * nx + i) * 3;
			if (c !== c) { n[o + 1] = 1; continue; }
			let gx = (at(i - 1, j, c) - at(i + 1, j, c)) / (2 * cell);
			let gz = (at(i, j - 1, c) - at(i, j + 1, c)) / (2 * cell);
			const l = Math.hypot(gx, 1, gz);
			n[o] = gx / l;
			n[o + 1] = 1 / l;
			n[o + 2] = gz / l;
		}
	}
	return n;
}

const _mA = new THREE.Matrix4();
const _mB = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

/** objectMatrix * asset.matrix for one `objects` row (the one formula of FORMAT.md 2.1). */
export function placementMatrix(row, asset, out = new THREE.Matrix4()) {
	_p.set(row.p[0], row.p[1], row.p[2]);
	if (row.q) _q.set(row.q[0], row.q[1], row.q[2], row.q[3]);
	else _q.setFromAxisAngle(UP, (row.r || 0) * DEG);
	if (row.s) _s.set(row.s[0], row.s[1], row.s[2]);
	else _s.set(1, 1, 1);
	out.compose(_p, _q, _s);
	if (asset?.matrix) out.multiply(_mB.fromArray(asset.matrix));
	return out;
}

/** Placement of a composite part (far silhouettes): compose(x, y, z, yawDeg, scale) * part.matrix. */
export function partMatrix(part, out = new THREE.Matrix4()) {
	_p.set(part.x || 0, part.y || 0, part.z || 0);
	_q.setFromAxisAngle(UP, (part.yawDeg || 0) * DEG);
	const k = part.scale ?? 1;
	_s.set(k, k, k);
	out.compose(_p, _q, _s);
	if (part.matrix) out.multiply(_mB.fromArray(part.matrix));
	return out;
}

/**
 * Triangles to keep after the `cut` boxes: a triangle whose centroid (after `fromOptimized`) lies inside any box [x0,y0,z0,x1,y1,z1] is dropped.
 * positions: flat xyz array; index: flat index array or null; returns a Uint32Array of kept indices.
 */
export function keepTriangles(positions, index, fromOptimized, boxes) {
	const m = new THREE.Matrix4().fromArray(fromOptimized);
	const count = index ? index.length : positions.length / 3;
	const kept = [];
	const v = new THREE.Vector3();
	const c = new THREE.Vector3();
	for (let t = 0; t + 2 < count; t += 3) {
		c.set(0, 0, 0);
		const ids = [0, 1, 2].map((k) => (index ? index[t + k] : t + k));
		for (const id of ids) c.add(v.set(positions[id * 3], positions[id * 3 + 1], positions[id * 3 + 2]));
		c.multiplyScalar(1 / 3).applyMatrix4(m);
		let drop = false;
		for (const b of boxes) {
			if (c.x >= b[0] && c.y >= b[1] && c.z >= b[2] && c.x <= b[3] && c.y <= b[4] && c.z <= b[5]) { drop = true; break; }
		}
		if (!drop) kept.push(ids[0], ids[1], ids[2]);
	}
	return Uint32Array.from(kept);
}

/** Radiance .hdr (RGBE) -> { width, height, data: Uint16Array RGBA half floats }. */
export function parseRGBE(bytes) {
	let pos = 0;
	const line = () => {
		let s = '';
		while (pos < bytes.length) {
			const c = bytes[pos++];
			if (c === 10) break;
			s += String.fromCharCode(c);
		}
		return s;
	};
	if (!line().startsWith('#?')) throw new Error('not a Radiance HDR');
	let l;
	while ((l = line()) !== '' && pos < bytes.length);
	const m = /-Y (\d+) \+X (\d+)/.exec(line());
	if (!m) throw new Error('unsupported HDR orientation');
	const height = +m[1];
	const width = +m[2];
	const rgbe = new Uint8Array(width * height * 4);
	for (let y = 0; y < height; y++) {
		const row = y * width * 4;
		if (width >= 8 && width < 32768 && bytes[pos] === 2 && bytes[pos + 1] === 2 && !(bytes[pos + 2] & 128)) {
			pos += 4;
			for (let c = 0; c < 4; c++) {
				let x = 0;
				while (x < width) {
					let n = bytes[pos++];
					if (n > 128) {
						n -= 128;
						const v = bytes[pos++];
						for (let k = 0; k < n; k++) rgbe[row + (x++) * 4 + c] = v;
					} else {
						for (let k = 0; k < n; k++) rgbe[row + (x++) * 4 + c] = bytes[pos++];
					}
				}
			}
		} else {
			for (let x = 0; x < width * 4; x++) rgbe[row + x] = bytes[pos++];
		}
	}
	const out = new Uint16Array(width * height * 4);
	const half = THREE.DataUtils.toHalfFloat;
	for (let i = 0; i < width * height; i++) {
		const e = rgbe[i * 4 + 3];
		const f = e ? 2 ** (e - 136) : 0;
		out[i * 4] = half(rgbe[i * 4] * f);
		out[i * 4 + 1] = half(rgbe[i * 4 + 1] * f);
		out[i * 4 + 2] = half(rgbe[i * 4 + 2] * f);
		out[i * 4 + 3] = half(1);
	}
	return { width, height, data: out };
}

/** The pieces a wall run is made of once its openings are cut (a port of the lab's runPieces): [{ t0, t1, y0, y1, kind }], y relative to run.y0. */
export function wallPieces(run) {
	const H = run.y1 - run.y0;
	const pieces = [];
	let t = 0;
	for (const o of run.openings || []) {
		const a = o.t0;
		const b = o.t1;
		if (a > t + 1e-3) pieces.push({ t0: t, t1: a, y0: 0, y1: H, kind: 'solid' });
		const base = Math.max(0, (o.floor ?? run.y0) - run.y0);
		if (o.kind === 'door' || o.kind === 'arch') pieces.push({ t0: a, t1: b, y0: base + (o.height ?? 2.4), y1: H, kind: 'lintel' });
		else if (o.kind === 'window') {
			pieces.push({ t0: a, t1: b, y0: 0, y1: base + (o.sill ?? 1), kind: 'sill' });
			pieces.push({ t0: a, t1: b, y0: base + (o.sill ?? 1) + (o.height ?? 1.6), y1: H, kind: 'lintel' });
		}
		if (base > 1e-3 && o.kind !== 'window') pieces.push({ t0: a, t1: b, y0: 0, y1: base, kind: 'sill' });
		t = Math.max(t, b);
	}
	if (run.len > t + 1e-3) pieces.push({ t0: t, t1: run.len, y0: 0, y1: H, kind: 'solid' });
	return pieces.filter((p) => p.y1 > p.y0 + 1e-3 && p.t1 > p.t0 + 1e-3);
}

/** Signed distance (metres) from (x, z) to a polygon [[x,z],...]: negative inside. */
export function polySignedDistance(poly, x, z) {
	let inside = false;
	let best = Infinity;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, zi] = poly[i];
		const [xj, zj] = poly[j];
		if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
		const dx = xj - xi;
		const dz = zj - zi;
		const l2 = dx * dx + dz * dz;
		const t = l2 ? Math.min(1, Math.max(0, ((x - xi) * dx + (z - zi) * dz) / l2)) : 0;
		best = Math.min(best, Math.hypot(x - (xi + t * dx), z - (zi + t * dz)));
	}
	return inside ? -best : best;
}

/** Distance in metres from (x, z) to the nearest wall run segment. */
export function wallRunDistance(runs, x, z) {
	let d = Infinity;
	for (const r of runs) {
		const dx = r.b[0] - r.a[0];
		const dz = r.b[1] - r.a[1];
		const l2 = dx * dx + dz * dz;
		const t = l2 ? Math.min(1, Math.max(0, ((x - r.a[0]) * dx + (z - r.a[1]) * dz) / l2)) : 0;
		d = Math.min(d, Math.hypot(x - (r.a[0] + t * dx), z - (r.a[1] + t * dz)));
	}
	return d;
}

/** Interior void darkening (FORMAT.md 8): lerp(0.85, 0.05, smoothstep(d, 0, 14)), d = distance to the nearest wall run. */
export function voidShadeAt(runs, x, z) {
	const t = smoothstep(0, 14, wallRunDistance(runs, x, z));
	return 0.85 + (0.05 - 0.85) * t;
}

const smoothstep = (a, b, x) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** Camera for a `views` entry: { position, target, fov } (the lab's fit rules; yaw 0 = camera at +z looking north, pitch 55 deg by default). */
export function viewCamera(view, { aspect = 16 / 9, fov = 35 } = {}) {
	if (view.eye) return { position: view.eye.slice(), target: view.look.slice(), fov: view.fov ?? fov };
	const target = view.target.slice();
	const pitch = (view.pitch ?? 55) * DEG;
	const yaw = (view.yaw ?? 0) * DEG;
	const fit = view.fit ?? (view.w && view.d ? [view.w, view.d] : null);
	let dist = view.dist;
	if (!dist && fit) {
		const t = Math.tan((fov * DEG) / 2);
		dist = Math.max(fit[0] / 2 / (t * aspect) + (fit[1] / 2) * Math.cos(pitch), (fit[1] * Math.sin(pitch)) / (2 * t) + fit[1] * Math.cos(pitch) * 0.5) * 1.02;
	}
	dist ??= 40;
	return {
		position: [target[0] + dist * Math.cos(pitch) * Math.sin(yaw), target[1] + dist * Math.sin(pitch), target[2] + dist * Math.cos(pitch) * Math.cos(yaw)],
		target,
		fov: view.fov ?? fov,
	};
}

function mulberry32(a) {
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ============================================================================================================================================================
// Loader context: URLs, caches, bookkeeping
// ============================================================================================================================================================

class Ctx {
	constructor(data, opts) {
		this.data = data;
		this.opts = opts;
		this.base = opts.baseUrl;
		this.textureLoader = opts.textureLoader ?? new THREE.TextureLoader();
		this.gltfLoader = opts.gltfLoader ?? new GLTFLoader();
		this.renderer = opts.renderer ?? null;
		this.shadows = !!opts.shadows;
		this.aniso = Math.min(8, this.renderer?.capabilities?.getMaxAnisotropy?.() ?? 4);
		this.texCache = new Map();
		this.glbCache = new Map();
		this.pixCache = new Map();
		this.missing = new Map();
		this.disposables = [];
		this.tick = 0;
		this.steps = 1;
	}
	url(path) { return new URL(path, this.base).href; }
	own(o) { this.disposables.push(o); return o; }
	miss(asset, reason, count = 1) {
		const k = `${asset}|${reason}`;
		const e = this.missing.get(k) ?? { asset, reason, count: 0 };
		e.count += count;
		this.missing.set(k, e);
	}
	step(label) {
		this.tick++;
		this.opts.onProgress?.(Math.min(1, this.tick / this.steps), label);
	}
	texture(path, { srgb = true, repeat = true, flipY = true } = {}) {
		const key = `${path}|${srgb}|${repeat}|${flipY}`;
		if (!this.texCache.has(key)) {
			this.texCache.set(key, this.textureLoader.loadAsync(this.url(path)).then((t) => {
				t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
				t.flipY = flipY;
				if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
				t.anisotropy = this.aniso;
				t.needsUpdate = true;
				return this.own(t);
			}));
		}
		return this.texCache.get(key);
	}
	/**
	 * RGBA bytes of an image resampled to size x size through a 2D canvas (no colour conversion). NOTE: the canvas is premultiplied, so an image with
	 * alpha < 1 loses RGB precision here (alpha 0 loses RGB entirely). Ground layers are opaque, so this is harmless today; never use it for data stored in alpha.
	 */
	pixels(path, size) {
		const key = `${path}|${size}`;
		if (!this.pixCache.has(key)) {
			this.pixCache.set(key, (async () => {
				const blob = await (await fetch(this.url(path))).blob();
				const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
				const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(size, size) : Object.assign(document.createElement('canvas'), { width: size, height: size });
				const g = canvas.getContext('2d', { willReadFrequently: true });
				g.imageSmoothingQuality = 'high';
				g.drawImage(bmp, 0, 0, size, size);
				bmp.close?.();
				return g.getImageData(0, 0, size, size).data;
			})());
		}
		return this.pixCache.get(key);
	}
	glb(path) {
		if (!this.glbCache.has(path)) this.glbCache.set(path, this.gltfLoader.loadAsync(this.url(path)).then((g) => (this.disposables.push({ dispose: () => disposeObject(g.scene) }), g)));
		return this.glbCache.get(path);
	}
}

function disposeObject(o) {
	o.traverse?.((n) => {
		n.geometry?.dispose?.();
		const mats = Array.isArray(n.material) ? n.material : n.material ? [n.material] : [];
		for (const m of mats) {
			for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
			m.dispose?.();
		}
	});
}

let _glow = null;
function glowTexture() {
	if (_glow || typeof document === 'undefined') return _glow;
	const c = document.createElement('canvas');
	c.width = c.height = 64;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
	grad.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, 64, 64);
	_glow = new THREE.CanvasTexture(c);
	_glow.colorSpace = THREE.SRGBColorSpace;
	return _glow;
}

// ============================================================================================================================================================
// Ground material: up to 8 layers blended by the splat (sampler2DArray, textureGrad)
// ============================================================================================================================================================

const TERRAIN_VERT_COMMON = 'varying vec2 vTerrXZ;';
const TERRAIN_FRAG_COMMON = `
uniform highp sampler2DArray tTAlb;
uniform highp sampler2DArray tTNrm;
uniform highp sampler2DArray tTRgh;
uniform sampler2D tTSplat0;
uniform sampler2D tTSplat1;
uniform vec3 uTSplat;   // originX, originZ, 1 / extent
uniform vec4 uTP[8];    // 1 / tile, normal strength, porosity, slice
uniform vec4 uTBlend;   // softness, heightBlend, wetDarken, tone
uniform int uTCount;
varying vec2 vTerrXZ;
void terrSample(int k, vec2 xz, vec2 dx, vec2 dy, out vec3 alb, out vec3 nrm, out float rough) {
	vec4 p = uTP[k];
	vec2 uv = vec2(xz.x, -xz.y) * p.x;
	vec2 gx = vec2(dx.x, -dx.y) * p.x;
	vec2 gy = vec2(dy.x, -dy.y) * p.x;
	alb = textureGrad(tTAlb, vec3(uv, p.w), gx, gy).rgb;
	vec3 n = textureGrad(tTNrm, vec3(uv, p.w), gx, gy).xyz * 2.0 - 1.0;
	n.xy *= p.y;
	nrm = n;
	rough = textureGrad(tTRgh, vec3(uv, p.w), gx, gy).g;
}`;
const TERRAIN_MAP_FRAGMENT = `
vec3 terrAlb; vec3 terrN; float terrRough; float terrWet; float terrPor;
{
	vec2 suv = (vTerrXZ - uTSplat.xy) * uTSplat.z;
	vec4 s0 = texture2D(tTSplat0, suv);
	vec4 s1 = texture2D(tTSplat1, suv);
	float wts[8];
	wts[0] = 1.0; wts[1] = s0.r; wts[2] = s0.g; wts[3] = s0.b; wts[4] = s0.a; wts[5] = s1.r; wts[6] = s1.g; wts[7] = s1.b;
	vec2 dx = dFdx(vTerrXZ);
	vec2 dy = dFdy(vTerrXZ);
	terrSample(0, vTerrXZ, dx, dy, terrAlb, terrN, terrRough);
	terrPor = uTP[0].z;
	for (int k = 1; k < 8; k++) {
		if (k >= uTCount) break;
		float m = smoothstep(0.5 - uTBlend.x, 0.5 + uTBlend.x, wts[k] * (1.0 + 2.0 * uTBlend.y) - uTBlend.y);
		if (m < 0.004) continue;
		vec3 a; vec3 n; float r;
		terrSample(k, vTerrXZ, dx, dy, a, n, r);
		terrAlb = mix(terrAlb, a, m);
		terrN = mix(terrN, n, m);
		terrRough = mix(terrRough, r, m);
		terrPor = mix(terrPor, uTP[k].z, m);
	}
	terrWet = s1.a * terrPor;
	terrAlb *= 1.0 - uTBlend.z * terrWet;
	terrRough = mix(terrRough, 0.28, terrWet * 0.7);
	diffuseColor.rgb = terrAlb * uTBlend.w;
}`;
const TERRAIN_NORMAL_FRAGMENT = `
{
	vec3 wN = inverseTransformDirection(normal, viewMatrix);
	vec3 Bw = normalize(vec3(0.0, 0.0, 1.0) - wN * wN.z);
	vec3 Tw = normalize(cross(wN, Bw));
	vec3 pn = normalize(Tw * terrN.x + Bw * terrN.y + wN * max(terrN.z, 0.05));
	normal = normalize(transformDirection(pn, viewMatrix));
}`;

function arrayTexture(data, w, h, depth, srgb, aniso) {
	const t = new THREE.DataArrayTexture(data, w, h, depth);
	t.format = THREE.RGBAFormat;
	t.type = THREE.UnsignedByteType;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.generateMipmaps = true;
	t.minFilter = THREE.LinearMipmapLinearFilter;
	t.magFilter = THREE.LinearFilter;
	t.anisotropy = aniso;
	t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
	t.needsUpdate = true;
	return t;
}

/** { splat, layers, tone } (a `terrain` or a dungeon area) -> MeshStandardMaterial with the layer-blend shader. */
async function makeGroundMaterial(ctx, terrain, { tone = 1, name = 'Ground', vertexColors = false } = {}) {
	const layers = terrain.layers.slice(0, 8);
	const S = 1024;
	const R = 256;
	const count = layers.length;
	const alb = new Uint8Array(S * S * 4 * count);
	const nrm = new Uint8Array(S * S * 4 * count);
	const rgh = new Uint8Array(R * R * 4 * count);
	await Promise.all(layers.map(async (l, i) => {
		const [a, n, r] = await Promise.all([ctx.pixels(l.textures.albedo, S), ctx.pixels(l.textures.normal, S), ctx.pixels(l.textures.roughness, R)]);
		alb.set(a, i * S * S * 4);
		nrm.set(n, i * S * S * 4);
		rgh.set(r, i * R * R * 4);
	}));
	const sp = terrain.splat;
	const pngs = await Promise.all(sp.maps.map((b64) => decodePng(b64ToBytes(b64))));
	const e = sp.extent / sp.size;
	const smooth = blurSplat(pngs.map(pngToRgba), sp.size, sp.blurMetres / e, Math.min(sp.blurMetres, sp.wetBlurMetres ?? sp.blurMetres) / e, 2);
	const splatTex = smooth.map((d) => {
		const t = new THREE.DataTexture(d, sp.size, sp.size, THREE.RGBAFormat, THREE.UnsignedByteType);
		t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
		t.magFilter = t.minFilter = THREE.LinearFilter;
		t.generateMipmaps = false;
		t.colorSpace = THREE.NoColorSpace;
		t.needsUpdate = true;
		return t;
	});
	const tex = [arrayTexture(alb, S, S, count, true, ctx.aniso), arrayTexture(nrm, S, S, count, false, ctx.aniso), arrayTexture(rgh, R, R, count, false, 1), ...splatTex];
	tex.forEach((t) => ctx.own(t));
	const uniforms = {
		tTAlb: { value: tex[0] },
		tTNrm: { value: tex[1] },
		tTRgh: { value: tex[2] },
		tTSplat0: { value: tex[3] },
		tTSplat1: { value: tex[4] },
		uTSplat: { value: new THREE.Vector3(sp.originX, sp.originZ, 1 / sp.extent) },
		uTP: { value: Array.from({ length: 8 }, (_, i) => (i < count ? new THREE.Vector4(1 / layers[i].tile, layers[i].ns ?? 1, layers[i].porosity ?? 0.7, i) : new THREE.Vector4(1, 1, 0, 0))) },
		uTBlend: { value: new THREE.Vector4(sp.softness ?? 0.4, sp.heightBlend ?? 0.15, 0.5, tone) },
		uTCount: { value: count },
	};
	const mat = new THREE.MeshStandardMaterial({ name, color: 0xffffff, roughness: 1, metalness: 0, vertexColors: !!vertexColors });
	mat.userData.terrainUniforms = uniforms;
	mat.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, uniforms);
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', `#include <common>\n${TERRAIN_VERT_COMMON}`)
			.replace('#include <begin_vertex>', '#include <begin_vertex>\n vTerrXZ = (modelMatrix * vec4(position, 1.0)).xz;');
		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', `#include <common>\n${TERRAIN_FRAG_COMMON}`)
			.replace('#include <map_fragment>', TERRAIN_MAP_FRAGMENT)
			.replace('#include <roughnessmap_fragment>', 'float roughnessFactor = terrRough;')
			.replace('#include <normal_fragment_maps>', TERRAIN_NORMAL_FRAGMENT);
	};
	mat.customProgramCacheKey = () => 'ashlar-ground-v1';
	return ctx.own(mat);
}

/** Heightfield -> indexed mesh geometry (quads with any NaN corner are skipped). */
function heightGeometry(hf, f, shade = null) {
	const { nx, nz, x0, z0, cell } = hf;
	const off = 'sample' in hf ? 0.5 : 0;
	const pos = new Float32Array(nx * nz * 3);
	for (let j = 0; j < nz; j++) {
		for (let i = 0; i < nx; i++) {
			const o = (j * nx + i) * 3;
			const h = f[j * nx + i];
			pos[o] = x0 + (i + off) * cell;
			pos[o + 1] = h === h ? h : 0;
			pos[o + 2] = z0 + (j + off) * cell;
		}
	}
	const idx = [];
	for (let j = 0; j + 1 < nz; j++) {
		for (let i = 0; i + 1 < nx; i++) {
			const k = j * nx + i;
			if (f[k] !== f[k] || f[k + 1] !== f[k + 1] || f[k + nx] !== f[k + nx] || f[k + nx + 1] !== f[k + nx + 1]) continue;
			idx.push(k, k + nx, k + 1, k + 1, k + nx, k + nx + 1);
		}
	}
	const g = new THREE.BufferGeometry();
	if (shade) {
		const col = new Float32Array(nx * nz * 3);
		for (let i = 0; i < nx * nz; i++) col.fill(shade(pos[i * 3], pos[i * 3 + 2], f[i] === f[i]), i * 3, i * 3 + 3);
		g.setAttribute('color', new THREE.BufferAttribute(col, 3));
	}
	g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	g.setAttribute('normal', new THREE.BufferAttribute(heightfieldNormals(f, nx, nz, cell), 3));
	g.setIndex(new THREE.BufferAttribute(nx * nz > 65535 ? Uint32Array.from(idx) : Uint16Array.from(idx), 1));
	g.computeBoundingSphere();
	return g;
}

// ============================================================================================================================================================
// GLB objects as instanced meshes
// ============================================================================================================================================================

let _greyMat = null;
const greyMaterial = () => (_greyMat ??= new THREE.MeshStandardMaterial({ name: 'Blockout', color: 0x8a8a84, roughness: 0.95, metalness: 0 }));

function setShadows(mesh, ctx, far) {
	if (ctx.shadows && !far) {
		mesh.castShadow = true;
		mesh.receiveShadow = true;
	}
}

function makeInstanced(ctx, geometry, material, mats, { name, far, colors } = {}) {
	const mesh = new THREE.InstancedMesh(geometry, material, mats.length);
	for (let i = 0; i < mats.length; i++) mesh.setMatrixAt(i, mats[i]);
	if (colors) for (let i = 0; i < mats.length; i++) mesh.setColorAt(i, colors[i]);
	mesh.instanceMatrix.needsUpdate = true;
	mesh.computeBoundingSphere();
	mesh.name = name;
	setShadows(mesh, ctx, far);
	return mesh;
}

/** Place a list of object rows of one asset. Returns the number of instances drawn. */
async function placeAsset(ctx, id, asset, rows, parent, { far = false } = {}) {
	const runs = ctx.data.interior?.wallRuns ?? [];
	const colors = rows.some((r) => r.void) ? rows.map((r) => { const k = r.void ? voidShadeAt(runs, r.p[0], r.p[2]) : 1; return new THREE.Color(k, k, k); }) : null;
	const matsFor = (extra) => rows.map((r) => {
		const m = placementMatrix(r, extra ? { matrix: null } : asset);
		if (extra) m.multiply(extra);
		return m;
	});
	// composite (far silhouettes made of GLB parts)
	if (asset.composite?.parts?.length && (far || !asset.glb)) {
		for (const part of asset.composite.parts) {
			const g = await ctx.glb(part.glb);
			const pm = partMatrix(part);
			const mats = matsFor(pm);
			addGltfInstances(ctx, g, mats, parent, { name: `${id} (${part.glb.split('/').pop()})`, far, colors });
		}
		return rows.length;
	}
	if (asset.glb) {
		const g = await ctx.glb(asset.glb);
		const mats = rows.map((r) => placementMatrix(r, asset));
		if (asset.cut?.length && !asset.fromOptimized) ctx.miss(id, '`cut` boxes present but `fromOptimized` missing: cut not applied', rows.length);
		addGltfInstances(ctx, g, mats, parent, { name: id, far, colors, cut: asset.cut, fromOptimized: asset.fromOptimized, shade: asset.material });
		return rows.length;
	}
	if (asset.kind === 'blockout' || (asset.kind === 'hand-static' && asset.defSize)) {
		const [w, h, d] = asset.defSize ?? [1, 1, 1];
		const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
		ctx.own(geo);
		const mats = rows.map((r) => placementMatrix(r, { matrix: null }));
		parent.add(makeInstanced(ctx, geo, greyMaterial(), mats, { name: `${id} (blockout)`, far, colors }));
		ctx.miss(id, `blockout: ${asset.reason ?? 'no model'}; drawn as a grey box of defSize`, rows.length);
		return rows.length;
	}
	ctx.miss(id, `asset has no glb, composite or blockout shape (kind ${asset.kind})`, rows.length);
	return 0;
}

function addGltfInstances(ctx, gltf, mats, parent, { name, far, colors, cut, fromOptimized, shade }) {
	gltf.scene.updateMatrixWorld(true);
	gltf.scene.traverse((node) => {
		if (!node.isMesh || node.isSkinnedMesh) return;
		let geometry = node.geometry;
		if (cut?.length && fromOptimized) {
			const pos = geometry.attributes.position;
			const positions = new Float32Array(pos.count * 3);
			for (let i = 0; i < pos.count; i++) {
				positions[i * 3] = pos.getX(i);
				positions[i * 3 + 1] = pos.getY(i);
				positions[i * 3 + 2] = pos.getZ(i);
			}
			geometry = geometry.clone();
			geometry.setIndex(new THREE.BufferAttribute(keepTriangles(positions, geometry.index?.array ?? null, fromOptimized, cut), 1));
			ctx.own(geometry);
		}
		let material = node.material;
		if (shade && fromOptimized) {
			// crypt wall look: grey vertex colour by height in the lab frame (top of the wall fades to black), optionally double-sided
			const vs = shade.vertexShade;
			const pos = geometry.attributes.position;
			const m = new THREE.Matrix4().fromArray(fromOptimized);
			const v = new THREE.Vector3();
			const col = new Float32Array(pos.count * 3);
			for (let i = 0; i < pos.count; i++) {
				const y = v.fromBufferAttribute(pos, i).applyMatrix4(m).y;
				const c = (1 + (vs.topLerp.to - vs.topLerp.from) * smoothstep(vs.topLerp.edge0, vs.topLerp.edge1, y)) * (vs.footMul.base + vs.footMul.gain * smoothstep(vs.footMul.edge0, vs.footMul.edge1, y));
				col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = c;
			}
			geometry = geometry === node.geometry ? geometry.clone() : geometry;
			geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
			material = node.material.clone();
			material.vertexColors = true;
			if (shade.side === 'double') material.side = THREE.DoubleSide;
			ctx.own(geometry);
			ctx.own(material);
		}
		const local = node.matrixWorld;
		const list = local.equals(_mA.identity()) ? mats : mats.map((m) => m.clone().multiply(local));
		parent.add(makeInstanced(ctx, geometry, material, list, { name: `${name}${node.name ? ` / ${node.name}` : ''}`, far, colors }));
		const mat = node.material;
		for (const v of Object.values(mat)) if (v?.isTexture) v.anisotropy = Math.max(v.anisotropy, ctx.aniso);
	});
}

async function placeObjects(ctx, rows, parent, { far = false, label = 'Objects' } = {}) {
	const group = new THREE.Group();
	group.name = label;
	parent.add(group);
	const by = new Map();
	const cards = [];
	for (const r of rows) {
		const a = ctx.data.assets[r.a];
		if (!a) { ctx.miss(r.a, 'asset id missing from the assets table'); continue; }
		if (!by.has(r.a)) by.set(r.a, []);
		by.get(r.a).push(r);
	}
	const jobs = [];
	for (const [id, list] of by) {
		const a = ctx.data.assets[id];
		if (!a.glb && !a.composite && a.kind !== 'blockout' && !(a.kind === 'hand-static' && a.defSize)) {
			if (a.kind === 'procedural') {
				if (['grass', 'reeds', 'sedge'].includes(a.procedural)) cards.push({ type: a.procedural, rows: list });
				else ctx.miss(id, `procedural ${a.procedural ?? ''}: not drawn (${a.reason ?? 'no model'})`, list.length);
			} else ctx.miss(id, a.reason ?? 'no GLB', list.length);
			continue;
		}
		jobs.push(placeAsset(ctx, id, a, list, group, { far }).catch((err) => ctx.miss(id, `load failed: ${err.message}`, list.length)));
	}
	await Promise.all(jobs);
	return { group, cards };
}

// ============================================================================================================================================================
// Atlas cards (grass, reeds, sedge, poppies, decals)
// ============================================================================================================================================================

function crossQuad() {
	const pos = [];
	const uv = [];
	const idx = [];
	for (let q = 0; q < 2; q++) {
		const a = (q * Math.PI) / 2;
		const c = Math.cos(a) * 0.5;
		const s = Math.sin(a) * 0.5;
		const b = q * 4;
		pos.push(-c, 0, s, c, 0, -s, c, 1, -s, -c, 1, s);
		uv.push(0, 0, 1, 0, 1, 1, 0, 1);
		idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
	}
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(8).fill([0, 1, 0]).flat(), 3));
	g.setIndex(idx);
	return g;
}

function flatQuad() {
	const g = new THREE.PlaneGeometry(1, 1);
	g.rotateX(-Math.PI / 2);
	return g;
}

/** InstancedMesh of atlas quads: items = [{ m: Matrix4, cell, color: THREE.Color }]. */
function atlasMesh(ctx, { texture, cols, rows, items, geometry, name, decal = false }) {
	const geo = geometry.clone();
	geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(Float32Array.from(items, (it) => it.cell), 1));
	const mat = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 1, metalness: 0, alphaTest: decal ? 0 : 0.45, transparent: decal, depthWrite: !decal, polygonOffset: decal, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
	mat.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', '#include <common>\nattribute float aCell;')
			.replace('#include <uv_vertex>', `#include <uv_vertex>
#ifdef USE_MAP
	float cc = floor(aCell + 0.5);
	float cCol = mod(cc, ${cols.toFixed(1)});
	float cRow = floor(cc / ${cols.toFixed(1)});
	vMapUv = vec2((vMapUv.x + cCol) / ${cols.toFixed(1)}, (vMapUv.y + ${(rows - 1).toFixed(1)} - cRow) / ${rows.toFixed(1)});
#endif`);
	};
	mat.customProgramCacheKey = () => `ashlar-atlas-${cols}x${rows}`;
	ctx.own(geo);
	ctx.own(mat);
	const mesh = new THREE.InstancedMesh(geo, mat, items.length);
	items.forEach((it, i) => {
		mesh.setMatrixAt(i, it.m);
		mesh.setColorAt(i, it.color);
	});
	mesh.instanceMatrix.needsUpdate = true;
	mesh.instanceColor.needsUpdate = true;
	mesh.frustumCulled = true;
	mesh.computeBoundingSphere();
	mesh.name = name;
	if (decal) mesh.renderOrder = 1;
	return mesh;
}

function poppyTexture() {
	if (typeof document === 'undefined') return null;
	const c = document.createElement('canvas');
	c.width = 384;
	c.height = 256;
	const g = c.getContext('2d');
	const rnd = mulberry32(5);
	for (let v = 0; v < 3; v++) {
		const ox = v * 128;
		g.strokeStyle = '#4b6a2c';
		g.lineWidth = 3;
		g.beginPath();
		g.moveTo(ox + 64, 256);
		g.quadraticCurveTo(ox + 60 + v * 4, 150, ox + 64, 80);
		g.stroke();
		g.fillStyle = '#56773a';
		g.beginPath();
		g.ellipse(ox + 50, 200, 14, 5, -0.5, 0, 7);
		g.ellipse(ox + 80, 180, 14, 5, 0.5, 0, 7);
		g.fill();
		const n = 1 + v;
		for (let k = 0; k < n; k++) {
			const cx = ox + 64 + (k - (n - 1) / 2) * 20;
			const cy = 70 + rnd() * 30 - k * 4;
			g.fillStyle = k % 2 ? '#a3201b' : '#c42d22';
			g.beginPath();
			g.ellipse(cx, cy, 22, 17, 0, 0, 7);
			g.fill();
			g.fillStyle = '#1b0f0d';
			g.beginPath();
			g.arc(cx, cy, 5, 0, 7);
			g.fill();
		}
	}
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 4;
	return t;
}

function addCards(ctx, root, groups) {
	// groups: [{ texture, cols, rows, items, name }]
	for (const g of groups) {
		if (!g.items.length) continue;
		const m = atlasMesh(ctx, { ...g, geometry: crossQuad() });
		root.add(m);
	}
}

// ============================================================================================================================================================
// Exponential height fog, the lab's formula (composite.frag.glsl heightFog), evaluated per fragment in linear HDR before tone mapping
// ============================================================================================================================================================

/** Uniforms shared by every patched material of a map: setMood only changes their values (no recompile). */
function makeFogUniforms() {
	return { uAshFog: { value: new THREE.Vector4(0, 0.3, 0, 2) }, uAshFogColor: { value: new THREE.Color(0x000000) } }; // density, falloff, height, start
}

const FOG_VERT_COMMON = 'varying vec3 vAshRay;';
const FOG_FRAG_COMMON = `
uniform vec4 uAshFog;
uniform vec3 uAshFogColor;
varying vec3 vAshRay;`;
const FOG_FRAG = `
{
	vec3 ashRay = vAshRay;
	float ashDist = max(length(ashRay), 1e-4);
	vec3 ashDir = ashRay / ashDist;
	float s0 = uAshFog.w;
	float s1 = max(ashDist, s0);
	float fa = uAshFog.x * exp(clamp(-uAshFog.y * (cameraPosition.y - uAshFog.z), -80.0, 80.0));
	float fb = uAshFog.y * ashDir.y;
	float amount = abs(fb) > 1e-5 ? fa * (exp(clamp(-fb * s0, -80.0, 80.0)) - exp(clamp(-fb * s1, -80.0, 80.0))) / fb : fa * (s1 - s0);
	float trans = exp(-max(amount, 0.0));
	gl_FragColor.rgb = gl_FragColor.rgb * trans + uAshFogColor * (1.0 - trans);
}
#include <tonemapping_fragment>`;

/** Patch a mesh material (Standard / Physical / Basic) so it applies the shared height fog; chained after any existing onBeforeCompile. */
export function patchFog(material, uniforms) {
	if (material.userData.ashFog) return;
	material.userData.ashFog = true;
	const prev = material.onBeforeCompile;
	const prevKey = material.customProgramCacheKey;
	material.onBeforeCompile = function (shader, renderer) {
		prev?.call(this, shader, renderer);
		Object.assign(shader.uniforms, uniforms);
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', `#include <common>\n${FOG_VERT_COMMON}`)
			.replace('#include <project_vertex>', '#include <project_vertex>\n vAshRay = transpose(mat3(viewMatrix)) * mvPosition.xyz;');
		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', `#include <common>\n${FOG_FRAG_COMMON}`)
			.replace('#include <tonemapping_fragment>', FOG_FRAG)
			.replace('#include <fog_fragment>', '');
	};
	material.customProgramCacheKey = function () { return `${prevKey ? prevKey.call(this) : ''}|ashlar-fog-v1`; };
	material.needsUpdate = true;
}

/** Transmittance of the lab fog along a ray (pure; for tests and numbers): camera height camY, ray direction y component dirY, distance dist. */
export function fogTransmittance(fog, camY, dirY, dist) {
	if (!fog) return 1;
	const s0 = fog.start ?? 0;
	const s1 = Math.max(dist, s0);
	const a = fog.density * Math.exp(Math.min(80, Math.max(-80, -fog.falloff * (camY - fog.height))));
	const b = fog.falloff * dirY;
	const amount = Math.abs(b) > 1e-5 ? (a * (Math.exp(-b * s0) - Math.exp(-b * s1))) / b : a * (s1 - s0);
	return Math.exp(-Math.max(amount, 0));
}

// ============================================================================================================================================================
// Lighting + moods
// ============================================================================================================================================================

class Lighting {
	constructor(ctx, root, kind) {
		this.ctx = ctx;
		this.root = root;
		this.kind = kind;
		this.data = ctx.data;
		this.moods = ctx.data.lighting?.moods ?? {};
		this.names = Object.keys(this.moods);
		this.entries = [];
		this.hemi = null;
		this.sun = null;
		this.envCache = new Map();
		this.scene = ctx.opts.scene ?? null;
		this.renderer = ctx.renderer;
		this.look = {};
		this.current = null;
		this.floorUniforms = [];
		this.fogU = makeFogUniforms();
		this.envReady = new Map();
		this.ownEnv = new Set();
		this.ownBackground = null;
		this.envFallback = null;
		this.build();
	}

	build() {
		const { data, ctx, root, kind } = this;
		const first = this.moods[data.lighting?.default] ?? this.moods[this.names[0]];
		if (first?.hemisphere) {
			this.hemi = new THREE.HemisphereLight(first.hemisphere.skyColor, first.hemisphere.groundColor, first.hemisphere.intensity);
			this.hemi.name = 'Hemisphere';
			root.add(this.hemi);
		}
		if (first?.sun) {
			this.sun = new THREE.DirectionalLight(first.sun.color, first.sun.intensity);
			this.sun.name = 'Sun';
			root.add(this.sun, this.sun.target);
			if (ctx.shadows) {
				const b = data.bounds;
				const r = Math.max(b.x1 - b.x0, b.z1 - b.z0) * 0.6;
				const c = this.sun.shadow.camera;
				c.left = c.bottom = -r;
				c.right = c.top = r;
				c.near = 1;
				c.far = 400;
				this.sun.castShadow = true;
				this.sun.shadow.mapSize.set(2048, 2048);
				this.sun.shadow.bias = -0.0004;
			}
		}
		for (const def of data.lights ?? []) this.entries.push(this.makeLight(def, kind));
	}

	makeLight(def, kind) {
		const { ctx, root } = this;
		const e = { id: def.id ?? def.name, def, light: null, sprite: null, base: def.intensity ?? 0, phase: Math.random() * 100 };
		const pos = def.position ?? [def.x, def.y, def.z];
		if (kind === 'outdoor' || kind === 'interior') {
			if (def.real) {
				if (def.spot) {
					e.light = new THREE.SpotLight(def.color, def.intensity, def.range, def.angle ?? 0.8, def.penumbra ?? 0.5, def.decay ?? 2);
					e.light.target.position.set(...def.target);
					root.add(e.light.target);
					if (ctx.shadows && def.shadow) { e.light.castShadow = true; e.light.shadow.mapSize.set(1024, 1024); }
				} else e.light = new THREE.PointLight(def.color, def.intensity, def.range, def.decay ?? 2);
			}
		} else {
			const t = def.type;
			if (t === 'SpotLight') {
				e.light = new THREE.SpotLight(def.color, def.intensity, def.distance ?? 0, (def.angleDeg ?? 45) * DEG, def.penumbra ?? 0, def.decay ?? 2);
				if (def.target) { e.light.target.position.set(...def.target); root.add(e.light.target); }
				if (ctx.shadows && def.castShadow) {
					e.light.castShadow = true;
					const s = def.shadow ?? {};
					e.light.shadow.mapSize.set(...(Array.isArray(s.mapSize) ? s.mapSize : [1024, 1024]));
					e.light.shadow.camera.near = s.near ?? 0.3;
					e.light.shadow.camera.far = s.far ?? 30;
					e.light.shadow.bias = s.bias ?? -0.0005;
					e.light.shadow.normalBias = s.normalBias ?? 0.02;
				}
			} else if (t === 'PointLight') e.light = new THREE.PointLight(def.color, def.intensity, def.distance ?? 0, def.decay ?? 2);
			else if (t === 'DirectionalLight') {
				e.light = new THREE.DirectionalLight(def.color, def.baseIntensity ?? def.intensity ?? 1);
				e.light.target.position.set(...(def.target ?? [0, 0, 0]));
				root.add(e.light.target);
			} else if (t === 'HemisphereLight') e.light = new THREE.HemisphereLight(def.skyColor, def.groundColor, def.baseIntensity ?? 0.5);
			e.base = def.intensity ?? def.baseIntensity ?? 0;
		}
		if (e.light) {
			if (!e.light.isHemisphereLight) e.light.position.set(...pos);
			e.light.name = `Light ${e.id}`;
			root.add(e.light);
		}
		if (def.glow > 0 && glowTexture()) {
			e.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: def.color ?? '#ffb060', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
			e.sprite.position.set(...pos);
			e.sprite.scale.setScalar(def.glow * 2);
			e.sprite.name = `Glow ${e.id}`;
			root.add(e.sprite);
			ctx.own(e.sprite.material);
		}
		e.voidK = def.void && ctx.data.interior ? voidShadeAt(ctx.data.interior.wallRuns, pos[0], pos[2]) : 1;
		e.flicker = def.flicker > 0 ? def.flicker : def.kind === 'human' ? 0.1 : /candle|lantern|torch/i.test(def.name ?? '') ? 0.08 : 0;
		return e;
	}

	async envTexture(path) {
		if (!this.envCache.has(path)) {
			this.envCache.set(path, (async () => {
				const buf = new Uint8Array(await (await fetch(this.ctx.url(path))).arrayBuffer());
				const { width, height, data } = parseRGBE(buf);
				const t = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.HalfFloatType);
				t.mapping = THREE.EquirectangularReflectionMapping;
				t.colorSpace = THREE.LinearSRGBColorSpace;
				t.magFilter = t.minFilter = THREE.LinearFilter;
				t.generateMipmaps = false;
				t.needsUpdate = true;
				this.envReady.set(path, t);
				return this.ctx.own(t);
			})().catch((err) => { this.ctx.miss(path, `environment map failed: ${err.message}`); return null; }));
		}
		return this.envCache.get(path);
	}

	async preload() {
		const maps = new Set(Object.values(this.moods).map((m) => m.environment?.map).filter(Boolean));
		await Promise.all([...maps].map((p) => this.envTexture(p)));
		this.envFallback = [...maps].map((p) => this.envReady.get(p)).find(Boolean) ?? null;
	}

	bind(scene, renderer) {
		this.scene = scene ?? this.scene;
		this.renderer = renderer ?? this.renderer;
		if (this.current) this.apply(this.current);
	}

	apply(name) {
		const m = this.moods[name];
		if (!m) return;
		this.current = name;
		const { hemi, sun } = this;
		if (hemi && m.hemisphere) {
			hemi.color.set(m.hemisphere.skyColor);
			hemi.groundColor.set(m.hemisphere.groundColor);
			hemi.intensity = m.hemisphere.intensity;
		}
		if (sun && m.sun) {
			sun.color.set(m.sun.color);
			sun.intensity = m.sun.intensity;
			sun.position.set(...m.sun.lightPosition);
			sun.target.position.set(...m.sun.lightTarget);
		}
		const scale = m.lightScale ?? 1;
		const states = new Map((m.lights ?? []).map((s) => [s.id, s]));
		for (const e of this.entries) {
			const d = e.def;
			const st = states.get(e.id);
			let on = true;
			let k;
			if (this.kind === 'outdoor') {
				on = st ? st.on : false;
				if (d.flag && m.flags && m.flags[d.flag] === false) on = false;
				if (d.moods && !d.moods.includes(name)) on = false;
				k = st ? st.intensity * (st.levelScale ?? 1) : 0;
				if (e.light) {
					if (st?.range) e.light.distance = st.range;
				}
				e.glowK = st && on ? st.glow : 0;
			} else {
				k = e.base * scale * e.voidK;
				e.glowK = d.glow ?? 0;
			}
			e.on = on;
			e.k = on ? k : 0;
			if (e.light && !e.light.isHemisphereLight) e.light.intensity = e.k;
			if (e.sprite) {
				e.sprite.scale.setScalar(Math.max(0.001, (e.glowK ?? 0) * 2));
				e.sprite.visible = (e.glowK ?? 0) > 0 && on;
			}
		}
		// ground tone (interior / oldFace floors)
		for (const u of this.floorUniforms) u.value.w = m.floorTone ?? u.base;
		this.updateLook(m);
	}

	/** Synchronous (the HDRs are preloaded): fills this.look, the shared fog uniforms and, when bound, scene / renderer. Program-affecting state never changes between moods. */
	updateLook(m) {
		const envPath = m.environment?.map;
		const own = envPath ? this.envReady.get(envPath) : null;
		const tex = own || this.envFallback; // never null when any mood has a map: scene.environment stays defined
		const fog = m.post?.fog;
		const on = !!fog?.enabled;
		const u = this.fogU;
		u.uAshFog.value.set(on ? fog.density : 0, fog?.falloff ?? 0.3, fog?.height ?? 0, fog?.start ?? 2);
		if (fog?.color) u.uAshFogColor.value.set(fog.color);
		this.look = {
			background: on ? fog.color : m.background, // the lab's sky is fully fogged
			fog: on ? { color: fog.color, density: fog.density, falloff: fog.falloff ?? 0, height: fog.height ?? 0, start: fog.start ?? 0 } : null,
			environment: tex,
			environmentIntensity: own ? m.environment.intensity ?? 1 : 0,
			exposure: m.post?.exposure ?? 1,
			toneMapping: THREE.ACESFilmicToneMapping,
		};
		const { scene, renderer, look } = this;
		if (scene) {
			this.ownBackground = new THREE.Color(look.background);
			scene.background = this.ownBackground;
			scene.fog = null; // the fog lives in the materials (shared uniforms), so nothing here ever changes a program
			if (look.environment) { scene.environment = look.environment; this.ownEnv.add(look.environment); }
			if ('environmentIntensity' in scene) scene.environmentIntensity = look.environmentIntensity;
		}
		if (renderer) {
			renderer.toneMapping = look.toneMapping;
			renderer.toneMappingExposure = look.exposure;
		}
	}

	release() {
		const { scene } = this;
		if (!scene) return;
		if (scene.environment && this.ownEnv.has(scene.environment)) scene.environment = null;
		if (this.ownBackground && scene.background === this.ownBackground) scene.background = null;
	}

	update(t) {
		for (const e of this.entries) {
			if (!e.flicker || !e.on) continue;
			const n = 1 + e.flicker * (0.55 * Math.sin(t * 7.3 + e.phase) + 0.3 * Math.sin(t * 13.1 + e.phase * 1.7) + 0.15 * Math.sin(t * 29 + e.phase * 0.3));
			if (e.light) e.light.intensity = e.k * n;
			if (e.sprite?.visible) e.sprite.material.opacity = 0.8 * (0.85 + 0.15 * n);
		}
	}
}

// ============================================================================================================================================================
// Water, far frame, cobble ribbons
// ============================================================================================================================================================

const WATER_TINT = { fen: [[0.03, 0.04, 0.032], [0.004, 0.009, 0.008]], pond: [[0.045, 0.052, 0.03], [0.008, 0.02, 0.014]] };

function areaPoly(area) {
	if (area.poly) return area.poly;
	if (area.rect) { const [x0, z0, x1, z1] = area.rect; return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
	return null;
}

function buildWater(ctx, group, heightAt, normalMap) {
	const d = ctx.data;
	const mat = new THREE.MeshPhysicalMaterial({
		name: 'Water', normalMap, normalScale: new THREE.Vector2(0.38, 0.38), roughness: 0.3, metalness: 0, ior: 1.33, specularIntensity: 0.08,
		envMapIntensity: 0.16, transparent: true, opacity: 0.92, vertexColors: true, depthWrite: true,
	});
	ctx.own(mat);
	const { x0: bx0, z0: bz0, x1: bx1, z1: bz1 } = d.bounds;
	for (const b of d.water) {
		const poly = areaPoly(b.area);
		if (!poly) continue;
		const step = 0.5;
		const reach = b.reach ?? 0;
		const xs = poly.map((p) => p[0]);
		const zs = poly.map((p) => p[1]);
		const x0 = Math.max(bx0, Math.min(...xs) - reach);
		const z0 = Math.max(bz0, Math.min(...zs) - reach);
		const nx = Math.ceil((Math.min(bx1, Math.max(...xs) + reach) - x0) / step) + 1;
		const nz = Math.ceil((Math.min(bz1, Math.max(...zs) + reach) - z0) / step) + 1;
		if (nx < 2 || nz < 2) continue;
		const depth = new Float32Array(nx * nz);
		for (let j = 0; j < nz; j++) {
			for (let i = 0; i < nx; i++) {
				const x = x0 + i * step;
				const z = z0 + j * step;
				const h = heightAt(x, z);
				depth[j * nx + i] = polySignedDistance(poly, x, z) <= reach && h === h ? b.levelY - h : -1;
			}
		}
		const map = new Int32Array(nx * nz).fill(-1);
		const pos = [];
		const col = [];
		const uv = [];
		const index = [];
		const [shallow, deep] = WATER_TINT[b.tint] ?? WATER_TINT.fen;
		const vert = (i, j) => {
			const k = j * nx + i;
			if (map[k] >= 0) return map[k];
			const x = x0 + i * step;
			const z = z0 + j * step;
			const dd = depth[k];
			const a = smoothstep(0, 0.14, dd) * (0.6 + 0.4 * smoothstep(0.02, 0.5, dd));
			const t = smoothstep(0.03, 0.6, dd);
			pos.push(x, b.levelY, z);
			col.push(shallow[0] + (deep[0] - shallow[0]) * t, shallow[1] + (deep[1] - shallow[1]) * t, shallow[2] + (deep[2] - shallow[2]) * t, a);
			uv.push(x / 6, -z / 6);
			map[k] = pos.length / 3 - 1;
			return map[k];
		};
		for (let j = 0; j + 1 < nz; j++) {
			for (let i = 0; i + 1 < nx; i++) {
				const k = j * nx + i;
				if (depth[k] <= 0 && depth[k + 1] <= 0 && depth[k + nx] <= 0 && depth[k + nx + 1] <= 0) continue;
				const a = vert(i, j);
				const bb = vert(i + 1, j);
				const c = vert(i, j + 1);
				const dd = vert(i + 1, j + 1);
				index.push(a, c, bb, bb, c, dd);
			}
		}
		if (!index.length) continue;
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex(index);
		g.computeVertexNormals();
		ctx.own(g);
		const mesh = new THREE.Mesh(g, mat);
		mesh.name = `Water ${b.id}`;
		mesh.renderOrder = 2;
		group.add(mesh);
	}
}

function buildFar(ctx, group, normalMap) {
	const far = ctx.data.far;
	if (!far) return;
	const { x0, z0, x1, z1 } = ctx.data.bounds;
	const S = far.size / 2;
	const shape = new THREE.Shape([new THREE.Vector2(-S, -S), new THREE.Vector2(S, -S), new THREE.Vector2(S, S), new THREE.Vector2(-S, S)]);
	shape.holes.push(new THREE.Path([new THREE.Vector2(x0, -z0), new THREE.Vector2(x0, -z1), new THREE.Vector2(x1, -z1), new THREE.Vector2(x1, -z0)]));
	const fg = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
	const wm = new THREE.MeshPhysicalMaterial({ name: 'Far black water', color: new THREE.Color(0.01, 0.016, 0.014), roughness: 0.34, metalness: 0, specularIntensity: 0.08, envMapIntensity: 0.12, normalMap, normalScale: new THREE.Vector2(0.3, 0.3) });
	ctx.own(fg);
	ctx.own(wm);
	const water = new THREE.Mesh(fg, wm);
	water.position.y = (far.level ?? 0) - 0.005;
	water.name = 'Far black water';
	group.add(water);
	const bedGeo = new THREE.PlaneGeometry(x1 - x0 + 24, z1 - z0 + 24).rotateX(-Math.PI / 2);
	const bedMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.006, 0.01, 0.009) });
	ctx.own(bedGeo);
	ctx.own(bedMat);
	const bed = new THREE.Mesh(bedGeo, bedMat);
	bed.position.set((x0 + x1) / 2, Math.min(far.level ?? 0, ctx.data.terrain.edge?.y ?? far.level ?? 0) - 0.6, (z0 + z1) / 2);
	bed.name = 'Bed under the island';
	group.add(bed);
	const hillMat = new THREE.MeshStandardMaterial({ name: 'Far hills', color: new THREE.Color('#2c3428'), roughness: 0.95, metalness: 0 });
	ctx.own(hillMat);
	for (const h of far.hills ?? []) {
		const rings = 14;
		const seg = 40;
		const pos = [];
		const idx = [];
		for (let i = 0; i <= rings; i++) {
			const rr = (i / rings) * h.r * 1.02;
			for (let j = 0; j < seg; j++) {
				const a = (j / seg) * Math.PI * 2;
				const x = h.x + Math.cos(a) * rr * (1 + 0.08 * Math.sin(a * 3 + h.x));
				const z = h.z + Math.sin(a) * rr * (1 + 0.08 * Math.cos(a * 2 + h.z));
				const q = Math.max(0, 1 - (rr / h.r) ** 2);
				pos.push(x, (far.level ?? 0) + h.h * q ** 1.4 - (i === rings ? 0.6 : 0), z);
				if (i) {
					const k = i * seg + j;
					const kn = i * seg + ((j + 1) % seg);
					idx.push(k - seg, k, kn - seg, kn - seg, k, kn);
				}
			}
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		ctx.own(g);
		const m = new THREE.Mesh(g, hillMat);
		m.name = 'Far hill';
		group.add(m);
	}
}

async function buildCobble(ctx, group, heightAt) {
	const cr = ctx.data.terrain.cobbleRoad;
	if (!cr) return;
	const [map, normalMap] = await Promise.all([ctx.texture(cr.albedo), ctx.texture(cr.normal, { srgb: false })]);
	const mat = new THREE.MeshStandardMaterial({ name: 'Cobble road', map, normalMap, roughness: 0.92, metalness: 0, transparent: true, vertexColors: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
	ctx.own(mat);
	const TILE = 2.5;
	for (const p of ctx.data.paths) {
		if (!cr.onPaths.includes(p.id) || p.hidden) continue;
		const pts = p.smoothedPointsXZ ?? p.pointsXZ;
		if (!pts || pts.length < 2) continue;
		const dense = [];
		for (let i = 0; i + 1 < pts.length; i++) {
			const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
			const n = Math.max(1, Math.round(L / 0.5));
			for (let k = 0; k < n; k++) dense.push([pts[i][0] + ((pts[i + 1][0] - pts[i][0]) * k) / n, pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * k) / n]);
		}
		dense.push(pts[pts.length - 1]);
		const across = [-1, -0.8, 0, 0.8, 1];
		const alpha = [0, 1, 1, 1, 0];
		const pos = [];
		const col = [];
		const uv = [];
		const idx = [];
		let along = 0;
		dense.forEach((pt, i) => {
			const a = dense[Math.max(0, i - 1)];
			const b = dense[Math.min(dense.length - 1, i + 1)];
			let tx = b[0] - a[0];
			let tz = b[1] - a[1];
			const l = Math.hypot(tx, tz) || 1;
			tx /= l;
			tz /= l;
			if (i) along += Math.hypot(pt[0] - dense[i - 1][0], pt[1] - dense[i - 1][1]);
			across.forEach((s, c) => {
				const x = pt[0] - tz * s * p.widthM * 0.5;
				const z = pt[1] + tx * s * p.widthM * 0.5;
				const h = heightAt(x, z);
				pos.push(x, (h === h ? h : 0) + 0.03, z);
				col.push(1, 1, 1, alpha[c]);
				uv.push((s * p.widthM * 0.5) / TILE, along / TILE);
			});
			if (i) {
				for (let c = 0; c < 4; c++) {
					const k = i * 5 + c;
					idx.push(k - 5, k, k - 4, k - 4, k, k + 1);
				}
			}
		});
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
		g.setIndex(idx);
		g.computeVertexNormals();
		// make sure the ribbon faces up whichever way the path runs
		const n = g.attributes.normal;
		if (n.getY(Math.floor(n.count / 2)) < 0) { g.index.array.reverse(); g.computeVertexNormals(); }
		ctx.own(g);
		const mesh = new THREE.Mesh(g, mat);
		mesh.name = `Cobble ${p.id}`;
		mesh.renderOrder = 1;
		group.add(mesh);
	}
}

// ============================================================================================================================================================
// Card scatter (outdoor)
// ============================================================================================================================================================

const CARD_SPEC = {
	grass: { atlas: 'grassCards', cells: [0, 1, 2, 3], height: [0.3, 0.6], n: [3, 6] },
	reeds: { atlas: 'shorePlants', cells: [0, 1], height: [0.9, 1.6], n: [3, 5] },
	sedge: { atlas: 'shorePlants', cells: [2, 3], height: [0.5, 0.9], n: [3, 5] },
};

async function buildCards(ctx, root, cardJobs, heightAt) {
	const c = ctx.data.cards;
	if (!c) return;
	const out = new Map();
	const tint = new THREE.Color(0.55, 0.66, 0.5);
	const m = new THREE.Matrix4();
	for (const job of cardJobs) {
		const spec = CARD_SPEC[job.type];
		if (!spec || !c[spec.atlas]) continue;
		if (!out.has(spec.atlas)) out.set(spec.atlas, []);
		const items = out.get(spec.atlas);
		for (const r of job.rows) {
			const rnd = mulberry32(((typeof r.u === 'number' ? r.u : 7) + 1) * 2654435761);
			const n = spec.n[0] + Math.floor(rnd() * (spec.n[1] - spec.n[0] + 1));
			for (let i = 0; i < n; i++) {
				const a = rnd() * Math.PI * 2;
				const rad = Math.sqrt(rnd()) * 0.5;
				const x = r.p[0] + Math.cos(a) * rad;
				const z = r.p[2] + Math.sin(a) * rad;
				const h = spec.height[0] + rnd() * (spec.height[1] - spec.height[0]);
				const gy = heightAt(x, z);
				m.compose(_p.set(x, gy === gy ? gy : r.p[1], z), _q.setFromAxisAngle(UP, rnd() * Math.PI * 2), _s.set(h * 0.9, h, h * 0.9));
				items.push({ m: m.clone(), cell: spec.cells[Math.floor(rnd() * spec.cells.length)], color: tint });
			}
		}
	}
	for (const [atlas, items] of out) {
		const texture = await ctx.texture(c[atlas], { repeat: false });
		root.add(atlasMesh(ctx, { texture, cols: 2, rows: 2, items, geometry: crossQuad(), name: `Cards ${atlas}` }));
	}
}

async function buildMeadow(ctx, root) {
	const mw = ctx.data.meadow;
	if (!mw) return;
	const m = new THREE.Matrix4();
	if (mw.grass && ctx.data.cards?.grassCards) {
		const f = decodeFloat32(mw.grass.data);
		const items = [];
		const tint = new THREE.Color();
		for (let i = 0; i < mw.grass.count; i++) {
			const o = i * 7;
			const cell = Math.floor(f[o + 6] / 10 + 1e-4);
			const tone = (Math.round(f[o + 6]) % 10) / 10;
			const k = 0.6 + 0.4 * tone;
			m.compose(_p.set(f[o], f[o + 1], f[o + 2]), _q.setFromAxisAngle(UP, f[o + 3]), _s.set(f[o + 5], f[o + 4], f[o + 5]));
			items.push({ m: m.clone(), cell: cell & 3, color: tint.clone().setRGB(0.55 * k, 0.66 * k, 0.5 * k) });
		}
		const texture = await ctx.texture(ctx.data.cards.grassCards, { repeat: false });
		root.add(atlasMesh(ctx, { texture, cols: 2, rows: 2, items, geometry: crossQuad(), name: 'Meadow grass' }));
	}
	if (mw.poppies) {
		const tex = poppyTexture();
		if (tex) {
			ctx.own(tex);
			const f = decodeFloat32(mw.poppies.data);
			const items = [];
			for (let i = 0; i < mw.poppies.count; i++) {
				const o = i * 7;
				const h = f[o + 4];
				m.compose(_p.set(f[o], f[o + 1], f[o + 2]), _q.setFromAxisAngle(UP, f[o + 3]), _s.set(h * 0.5, h, h * 0.5));
				const k = 0.75 + 0.25 * f[o + 5];
				items.push({ m: m.clone(), cell: Math.min(2, Math.max(0, Math.round(f[o + 6]))), color: new THREE.Color(k, k, k) });
			}
			root.add(atlasMesh(ctx, { texture: tex, cols: 3, rows: 1, items, geometry: crossQuad(), name: 'Poppies' }));
		}
	}
}

// ============================================================================================================================================================
// Interior walls
// ============================================================================================================================================================

async function buildInteriorWalls(ctx, root, floorY) {
	const it = ctx.data.interior;
	const texById = new Map();
	for (const w of it.wallTextures ?? []) texById.set(w.tile, w.textures);
	const groups = new Map();
	const modules = new Map();
	const q = new THREE.Quaternion();
	const m4 = new THREE.Matrix4();
	for (const run of it.wallRuns) {
		const st = run.style;
		const t = run.thickness;
		const off = run.offset === 'out' ? -t / 2 : 0;
		const yaw = Math.atan2(-run.dir[1], run.dir[0]);
		if (st.module) {
			const [w = 4, , dDepth = 0.7] = st.moduleSize ?? [];
			const n = Math.max(1, Math.ceil(run.len / (w * 1.1) - 1e-9));
			const sx = Math.min(1.1, Math.max(0.8, run.len / (w * n)));
			const sp = run.len / n;
			const key = `glb:${st.module}`;
			if (!modules.has(key)) modules.set(key, []);
			for (let i = 0; i < n; i++) {
				const tc = (i + 0.5) * sp;
				modules.get(key).push({
					a: key,
					p: [run.a[0] + run.dir[0] * tc - run.inward[0] * (dDepth / 2), run.y0, run.a[1] + run.dir[1] * tc - run.inward[1] * (dDepth / 2)],
					r: Math.atan2(run.inward[0], run.inward[1]) / DEG,
					s: [sx, st.moduleScaleY ?? 1, 1],
				});
			}
			continue;
		}
		const key = `${st.tile}|${st.tone ?? 1}|${st.top ?? ''}`;
		if (!groups.has(key)) groups.set(key, { st, pos: [], nor: [], uv: [], col: [], idx: [] });
		const G = groups.get(key);
		q.setFromAxisAngle(UP, yaw);
		for (const p of wallPieces(run)) {
			const ext0 = p.t0 < 1e-3 && run.offset === 'out' ? t / 2 : 0;
			const ext1 = p.t1 > run.len - 1e-3 && run.offset === 'out' ? t / 2 : 0;
			const L = p.t1 - p.t0 + ext0 + ext1;
			const tc = (p.t0 - ext0 + p.t1 + ext1) / 2;
			const h = p.y1 - p.y0;
			const geo = new THREE.BoxGeometry(L, h, t);
			geo.translate(0, h / 2, 0);
			m4.compose(_p.set(run.a[0] + run.dir[0] * tc + run.inward[0] * off, run.y0 + p.y0, run.a[1] + run.dir[1] * tc + run.inward[1] * off), q, _s.set(1, 1, 1));
			geo.applyMatrix4(m4);
			const base = G.pos.length / 3;
			const P = geo.attributes.position;
			const N = geo.attributes.normal;
			const T = 3;
			for (let i = 0; i < P.count; i++) {
				const x = P.getX(i);
				const y = P.getY(i);
				const z = P.getZ(i);
				const nx = N.getX(i);
				const nz = N.getZ(i);
				G.pos.push(x, y, z);
				{
					// wall shade (interior.wallShade): h = height above the floor under the vertex; NaN floor (outer faces) -> the run's y0
					const ws = it.wallShade ?? { topDark: 0.07, fade: 2.6, footBase: 0.82, footGain: 0.18, footEdge: 0.5, defaultTopOfHeight: 0.62 };
					let fy = floorY(x, z);
					if (!(fy === fy)) fy = run.y0;
					const h = y - fy;
					const top = st.top ?? st.height * ws.defaultTopOfHeight;
					const c = (1 + (ws.topDark - 1) * smoothstep(top, top + ws.fade, h)) * (ws.footBase + ws.footGain * smoothstep(0, ws.footEdge, h));
					G.col.push(c, c, c);
				}
				G.nor.push(nx, N.getY(i), nz);
				if (Math.abs(N.getY(i)) > 0.5) G.uv.push(x / T, z / T);
				else if (Math.abs(nx) > Math.abs(nz)) G.uv.push(z / T, y / T);
				else G.uv.push(x / T, y / T);
			}
			for (const i of geo.index.array) G.idx.push(base + i);
			geo.dispose();
		}
	}
	const wallGroup = new THREE.Group();
	wallGroup.name = 'Walls';
	root.add(wallGroup);
	for (const [key, G] of groups) {
		const tex = texById.get(G.st.tile);
		const [map, normalMap] = tex ? await Promise.all([ctx.texture(tex.albedo), ctx.texture(tex.normal, { srgb: false })]) : [null, null];
		const tone = G.st.tone ?? 1;
		const mat = new THREE.MeshStandardMaterial({ name: `Wall ${G.st.tile}`, map, normalMap, normalScale: new THREE.Vector2(0.9, 0.9), color: new THREE.Color(0.78 * tone, 0.77 * tone, 0.75 * tone), roughness: 0.93, metalness: 0, vertexColors: true });
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
		g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
		g.setAttribute('uv', new THREE.Float32BufferAttribute(G.uv, 2));
		g.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
		g.setIndex(G.idx);
		ctx.own(g);
		ctx.own(mat);
		const mesh = new THREE.Mesh(g, mat);
		mesh.name = `Walls ${key}`;
		if (ctx.shadows) { mesh.castShadow = true; mesh.receiveShadow = true; }
		wallGroup.add(mesh);
	}
	return [...modules.values()].flat();
}

// ============================================================================================================================================================
// oldFace / dungeon dressing
// ============================================================================================================================================================

function dressingGeometry(g) {
	const p = g.parameters ?? {};
	const bb = g.bboxLocal;
	const box = () => {
		if (!bb) return null;
		const s = [bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]];
		if (Math.max(...s) > 3) return null; // a big unknown shape as a box would hide the room
		return new THREE.BoxGeometry(...s).translate((bb.max[0] + bb.min[0]) / 2, (bb.max[1] + bb.min[1]) / 2, (bb.max[2] + bb.min[2]) / 2);
	};
	try {
		switch (g.type) {
			case 'BoxGeometry': return new THREE.BoxGeometry(p.width, p.height, p.depth);
			case 'RoundedBoxGeometry': return new THREE.BoxGeometry(p.width, p.height, p.depth);
			case 'CylinderGeometry': return new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments, p.heightSegments, false, p.thetaStart, p.thetaLength);
			case 'SphereGeometry': return new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
			case 'PlaneGeometry': return new THREE.PlaneGeometry(p.width, p.height);
			case 'CircleGeometry': return new THREE.CircleGeometry(p.radius, p.segments, p.thetaStart, p.thetaLength);
			case 'ConeGeometry': return new THREE.ConeGeometry(p.radius, p.height, p.radialSegments, p.heightSegments, false, p.thetaStart, p.thetaLength);
			case 'TorusGeometry': return new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments, p.arc);
			case 'CapsuleGeometry': return new THREE.CapsuleGeometry(p.radius, Math.max(0.001, p.height - 2 * p.radius), p.capSegments, p.radialSegments);
			default: return box();
		}
	} catch { return box(); }
}

function dressingMaterial(m, ctx) {
	if (m.type === 'MeshBasicMaterial') return null;
	const mat = new THREE.MeshStandardMaterial({ color: m.color ?? '#888', roughness: m.roughness ?? 0.9, metalness: m.metalness ?? 0, side: THREE.DoubleSide });
	if (m.emissive) mat.emissive = new THREE.Color(m.emissive);
	return ctx.own(mat);
}

const _e = new THREE.Euler();
function eulerQuat(r) {
	return _q.setFromEuler(_e.set((r.x || 0) * DEG, (r.y || 0) * DEG, (r.z || 0) * DEG, r.order || 'YXZ')).clone();
}

async function buildDressing(ctx, root) {
	const dr = ctx.data.dressing;
	if (!dr) return;
	const group = new THREE.Group();
	group.name = 'Dressing';
	root.add(group);
	for (const p of dr.procedural ?? []) {
		const geo = dressingGeometry(p.geometry);
		const mat = dressingMaterial(p.material, ctx);
		if (!geo || !mat) { ctx.miss(p.name ?? p.geometry.type, `dressing ${p.geometry.type}${mat ? '' : ' (basic emissive)'}: no geometry parameters`); continue; }
		ctx.own(geo);
		const mesh = new THREE.Mesh(geo, mat);
		mesh.position.set(...p.position);
		mesh.quaternion.copy(eulerQuat(p.rotationEulerDeg ?? {}));
		mesh.scale.set(...(p.scale ?? [1, 1, 1]));
		mesh.name = p.name ?? p.geometry.type;
		if (ctx.shadows) { mesh.castShadow = p.castShadow !== false; mesh.receiveShadow = true; }
		group.add(mesh);
	}
	for (const [name, ins] of Object.entries(dr.instanced ?? {})) {
		const geo = dressingGeometry(ins.geometry);
		const mat = dressingMaterial(ins.material, ctx);
		if (!geo || !mat) { ctx.miss(name, `instanced dressing ${ins.geometry.type}: not drawable`, ins.count); continue; }
		ctx.own(geo);
		const mats = ins.instances.map((i) => new THREE.Matrix4().compose(_p.set(...i.position), eulerQuat(i.rotationEulerDeg ?? {}), _s.set(...(i.scale ?? [1, 1, 1]))));
		group.add(makeInstanced(ctx, geo, mat, mats, { name }));
	}
	// decals: flat quads on the ground, atlas 4 x 4
	const byAtlas = new Map();
	for (const d of dr.decals ?? []) {
		const key = d.atlas ?? 'default';
		if (!byAtlas.has(key)) byAtlas.set(key, []);
		byAtlas.get(key).push(d);
	}
	for (const [key, list] of byAtlas) {
		const path = ctx.data.textures?.decals;
		const file = typeof path === 'string' ? path : path?.[key] ?? Object.values(path ?? {})[0];
		if (!file) continue;
		const texture = await ctx.texture(file, { repeat: false });
		const items = list.map((d) => ({ m: new THREE.Matrix4().compose(_p.set(...d.position), _q.setFromAxisAngle(UP, (d.yawDeg || 0) * DEG), _s.set(d.size, 1, d.size)), cell: d.cell, color: new THREE.Color(1, 1, 1) }));
		group.add(atlasMesh(ctx, { texture, cols: 4, rows: 4, items, geometry: flatQuad(), name: `Decals ${key}`, decal: true }));
	}
	// flames: additive billboards
	const tex = glowTexture();
	if (tex) {
		for (const f of dr.flames ?? []) {
			if (!(f.strength > 0)) continue;
			const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#ffa850', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
			s.position.set(...f.position);
			s.scale.set(Math.max(f.widthM * 3, 0.1), Math.max(f.heightM * 2.5, 0.1), 1);
			s.name = 'Flame';
			group.add(s);
			ctx.own(s.material);
		}
	}
}

// ============================================================================================================================================================
// choiceHands (static stage)
// ============================================================================================================================================================

async function buildChoiceHands(ctx, root, out) {
	const d = ctx.data;
	const w = d.wall;
	const [aTex, bTex, aN, bN] = await Promise.all([
		ctx.texture(w.tiles.a.albedo), ctx.texture(w.tiles.b.albedo), ctx.texture(w.tiles.a.normal, { srgb: false }), ctx.texture(w.tiles.b.normal, { srgb: false }),
	]);
	const [blendPng, tonePng] = await Promise.all([decodePng(b64ToBytes(w.blendMask.data)), decodePng(b64ToBytes(w.toneMask.data))]);
	// blend mask -> texture (row 0 = top of the wall = v 1): flip rows
	const bw = blendPng.width;
	const bh = blendPng.height;
	const bd = new Uint8Array(bw * bh * 4);
	for (let y = 0; y < bh; y++) {
		for (let x = 0; x < bw; x++) {
			const v = blendPng.data[(bh - 1 - y) * bw * blendPng.channels + x * blendPng.channels];
			const o = (y * bw + x) * 4;
			bd[o] = bd[o + 1] = bd[o + 2] = v;
			bd[o + 3] = 255;
		}
	}
	const blendTex = new THREE.DataTexture(bd, bw, bh, THREE.RGBAFormat, THREE.UnsignedByteType);
	blendTex.magFilter = blendTex.minFilter = THREE.LinearFilter;
	blendTex.colorSpace = THREE.NoColorSpace;
	blendTex.needsUpdate = true;
	ctx.own(blendTex);
	const geo = new THREE.PlaneGeometry(w.widthM, w.heightM, w.segmentsX, w.segmentsY);
	const col = new Float32Array(geo.attributes.position.count * 3);
	for (let i = 0; i < geo.attributes.position.count; i++) {
		const k = 0.76 + (0.32 * tonePng.data[i * tonePng.channels]) / 255;
		col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
	}
	geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
	const m = w.material;
	const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(...m.color), roughness: m.roughness, metalness: 0, vertexColors: true, map: aTex });
	const uA = new THREE.Vector4(1 / w.tileSizeM, 1 / w.tileSizeM, ...w.offsets.a);
	const uB = new THREE.Vector4(1 / w.tileSizeM, 1 / w.tileSizeM, ...w.offsets.b);
	mat.onBeforeCompile = (shader) => {
		Object.assign(shader.uniforms, { tB: { value: bTex }, tBlend: { value: blendTex }, uA: { value: uA }, uB: { value: uB }, uWall: { value: new THREE.Vector4(w.widthM, w.heightM, w.position[0], w.position[1]) } });
		shader.vertexShader = shader.vertexShader
			.replace('#include <common>', '#include <common>\nvarying vec2 vWallXY; varying vec2 vWallUv;')
			.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWallXY = (modelMatrix * vec4(position, 1.0)).xy; vWallUv = uv;');
		shader.fragmentShader = shader.fragmentShader
			.replace('#include <common>', '#include <common>\nuniform sampler2D tB; uniform sampler2D tBlend; uniform vec4 uA; uniform vec4 uB; varying vec2 vWallXY; varying vec2 vWallUv;')
			.replace('#include <map_fragment>', `
	float wb = texture2D(tBlend, vWallUv).r;
	vec4 ca = texture2D(map, vWallXY * uA.xy + uA.zw);
	vec4 cb = texture2D(tB, vWallXY * uB.xy + uB.zw);
	diffuseColor *= mix(ca, cb, wb);`);
	};
	mat.customProgramCacheKey = () => 'ashlar-wall-v1';
	ctx.own(geo);
	ctx.own(mat);
	const wall = new THREE.Mesh(geo, mat);
	wall.position.set(...w.position);
	wall.name = 'Wall';
	root.add(wall);
	// ledge
	const l = d.ledge;
	const stone = new THREE.MeshStandardMaterial({ color: '#5b5249', roughness: 0.93, metalness: 0 });
	ctx.own(stone);
	const ledge = new THREE.Mesh(new THREE.BoxGeometry(...l.sizeM), stone);
	ledge.position.set(...l.position);
	root.add(ledge);
	const lip = new THREE.Mesh(new THREE.BoxGeometry(...l.lip.sizeM), stone);
	lip.position.set(...l.lip.position);
	root.add(lip);
	// candle
	const c = d.candle;
	const cg = new THREE.Group();
	cg.position.set(...c.group.position);
	cg.scale.setScalar(c.group.uniformScale);
	const brass = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.34, 0.27, 0.17), roughness: 0.5, metalness: 0.75 });
	const wax = new THREE.MeshStandardMaterial({ color: '#d9c79a', roughness: 0.7, metalness: 0, emissive: '#3a2a10' });
	ctx.own(brass);
	ctx.own(wax);
	for (const part of c.parts) {
		let g = null;
		const nums = (part.geometry.match(/\(([^)]*)\)/)?.[1] ?? '').split(',').map((s) => parseFloat(s));
		if (part.geometry.startsWith('LatheGeometry')) g = new THREE.LatheGeometry(part.profileRadiusY.map(([r, y]) => new THREE.Vector2(r, y)), nums[1] ?? 32);
		else if (part.geometry.startsWith('TorusGeometry')) g = new THREE.TorusGeometry(...nums);
		else if (part.geometry.startsWith('CylinderGeometry')) g = new THREE.CylinderGeometry(...nums);
		else if (part.geometry.startsWith('CapsuleGeometry')) g = new THREE.CapsuleGeometry(...nums);
		if (!g) continue;
		ctx.own(g);
		const mesh = new THREE.Mesh(g, part.name === 'Wax' || part.name === 'Wax drip' ? wax : part.name === 'Wick' ? greyMaterial() : brass);
		if (part.position) mesh.position.set(...part.position);
		if (part.rotationZDeg) mesh.rotation.z = part.rotationZDeg * DEG;
		cg.add(mesh);
	}
	root.add(cg);
	const tex = glowTexture();
	if (tex) {
		const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: '#ffb060', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
		flame.position.set(...c.flame.basePosition);
		flame.scale.set(c.flame.widthM * 3, c.flame.heightM * 2.2, 1);
		root.add(flame);
		const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(...c.glowSprite.colour), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.15 }));
		glow.position.set(...c.glowSprite.position);
		glow.scale.setScalar(c.glowSprite.size);
		root.add(glow);
		ctx.own(flame.material);
		ctx.own(glow.material);
	}
	// lights
	const entries = [];
	for (const L of d.lights) {
		let light = null;
		if (L.type === 'HemisphereLight') light = new THREE.HemisphereLight(L.skyColor, L.groundColor, L.baseIntensity);
		else if (L.type === 'SpotLight') {
			light = new THREE.SpotLight(L.color, L.baseIntensity, L.distance ?? 0, L.angleRad, L.penumbra, L.decay);
			light.position.set(...L.position);
			light.target.position.set(...L.target);
			root.add(light.target);
		} else if (L.type === 'PointLight' && L.positionRelativeToSpot) {
			const sp = d.lights.find((x) => x.type === 'SpotLight');
			light = new THREE.PointLight(L.color, L.baseIntensity, L.distance, L.decay);
			light.position.set(sp.position[0] + L.positionRelativeToSpot[0], sp.position[1] + L.positionRelativeToSpot[1], sp.position[2] + L.positionRelativeToSpot[2]);
		} else if (L.type === 'DirectionalLight') {
			light = new THREE.DirectionalLight(L.color, L.baseIntensity);
			light.position.set(...L.position);
			light.target.position.set(...L.target);
			root.add(light.target);
		}
		if (light) { light.name = L.name; root.add(light); entries.push({ id: L.name, light, def: L, sprite: null }); }
	}
	out.lights = entries;
	// hand stand-ins
	const hm = new THREE.MeshStandardMaterial({ color: '#8f8a84', roughness: 0.6, metalness: 0.3 });
	ctx.own(hm);
	const hg = new THREE.BoxGeometry(0.14, 0.26, 0.06).translate(0, 0.13, 0);
	ctx.own(hg);
	for (const o of d.objects) {
		const mesh = new THREE.Mesh(hg, hm);
		mesh.position.set(...o.p);
		mesh.quaternion.set(...o.q);
		mesh.scale.set(...o.s);
		mesh.name = `Hand stand-in ${o.u}`;
		root.add(mesh);
		ctx.miss(o.a, `class-select hand ${o.u}: model not in Art_Final; drawn as a grey box`);
	}
	out.lookFixed = { background: d.lighting?.background ?? '#020202', environment: d.environment };
}

// ============================================================================================================================================================
// Colliders (plain data)
// ============================================================================================================================================================

/** Plain collision data: outdoor footprints, interior wall runs (with openings) and solid objects. Nothing here is simulated by the loader. */
export function buildColliders(data) {
	const out = [];
	for (const b of data.walk?.blockers ?? []) out.push({ type: 'poly', u: b.u, asset: b.a, polyXZ: b.polyXZ, y0: b.y0, y1: b.y1 });
	for (const r of data.interior?.wallRuns ?? []) out.push({ type: 'wall', id: r.id, a: r.a, b: r.b, thickness: r.thickness, y0: r.y0, y1: r.y1, offset: r.offset, inward: r.inward, openings: r.openings });
	if (data.interior) for (const o of data.objects) if (o.solid && !o.nc) out.push({ type: 'solid', u: o.u, asset: o.a, p: o.p, r: o.r, collider: data.assets[o.a]?.collider ?? null, blockers: data.assets[o.a]?.blockers ?? null });
	return out;
}

// ============================================================================================================================================================
// Main entry
// ============================================================================================================================================================

/**
 * Load and build a map. `jsonOrUrl` is the parsed "ashlar-map/1" object or the URL of the JSON.
 * Options: baseUrl, renderer, scene, mood, shadows, onProgress, gltfLoader, textureLoader (see the header).
 */
export async function loadAshlarMap(jsonOrUrl, opts = {}) {
	const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
	let data = jsonOrUrl;
	let baseUrl = opts.baseUrl;
	if (typeof jsonOrUrl === 'string') {
		const abs = new URL(jsonOrUrl, typeof location !== 'undefined' ? location.href : undefined).href;
		data = await (await fetch(abs)).json();
		baseUrl ??= new URL('../', abs).href;
	}
	if (data.format !== 'ashlar-map/1') throw new Error(`unsupported map format: ${data.format}`);
	if (!baseUrl) throw new Error('loadAshlarMap: options.baseUrl (URL of the Art_Final root) is required when a parsed JSON is passed');
	if (!baseUrl.endsWith('/')) baseUrl += '/';
	opts = { ...opts, baseUrl: new URL(baseUrl, typeof location !== 'undefined' ? location.href : undefined).href };
	const ctx = new Ctx(data, opts);
	const kind = data.meta.kind;
	const root = new THREE.Group();
	root.name = `ashlar-map ${data.meta.id}`;
	const api = { root, data, kind, terrain: null, water: new THREE.Group(), lights: [], moods: [], mood: null, blockers: data.walk?.blockers ?? [], markers: data.walk?.markers ?? [], spawns: data.walk?.spawns ?? [], bounds: data.bounds };
	api.water.name = 'Water';
	let heightAt = () => NaN;
	let decks = data.decks ?? [];
	ctx.steps = 8;
	ctx.step('start');

	// ---- ground ----
	let groundMat = null;
	const floorUniforms = [];
	const terrainGroup = new THREE.Group();
	terrainGroup.name = 'Terrain';
	root.add(terrainGroup);
	const defaultMoodName = data.lighting?.default ?? Object.keys(data.lighting?.moods ?? {})[0] ?? null;
	const tone0 = (name) => data.lighting?.moods?.[name]?.floorTone ?? data.terrain?.tone ?? 1;

	const groundJobs = [];
	if (kind === 'dungeon') {
		const areas = data.terrain.areas;
		const samplers = [];
		for (const id of Object.keys(areas)) {
			const a = areas[id];
			groundJobs.push((async () => {
				const mat = await makeGroundMaterial(ctx, a, { name: `Ground ${id}`, tone: 1 });
				if (a.heightfield) {
					const f = decodeFloat32(a.heightfield.data);
					samplers.push(makeHeightSampler(a.heightfield, f));
					const mesh = new THREE.Mesh(ctx.own(heightGeometry({ ...a.heightfield, sample: true }, f)), mat);
					mesh.name = `Floor ${id}`;
					terrainGroup.add(mesh);
					// cave wall ring
					if (a.outline) {
						const N = a.outline.samples.length;
						const pos = [];
						const idx = [];
						for (let j = 0; j <= N; j++) {
							const [r, h] = a.outline.samples[j % N];
							const ang = (j / N) * Math.PI * 2;
							const x = a.centre[0] + Math.cos(ang) * r;
							const z = a.centre[1] + Math.sin(ang) * r;
							pos.push(x, -0.5, z, x, h, z);
							if (j) { const k = j * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
						}
						const g = new THREE.BufferGeometry();
						g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
						g.setIndex(idx);
						g.computeVertexNormals();
						const wm = new THREE.MeshStandardMaterial({ color: '#2a2622', roughness: 0.95, side: THREE.BackSide });
						ctx.own(g);
						ctx.own(wm);
						const wallMesh = new THREE.Mesh(g, wm);
						wallMesh.name = 'Cave wall';
						terrainGroup.add(wallMesh);
					}
				} else {
					for (const fp of a.def.floorPlanes ?? []) {
						const g = new THREE.PlaneGeometry(fp.sizeXZ[0], fp.sizeXZ[1], 1, 1).rotateX(-Math.PI / 2);
						g.translate(a.centre[0] + fp.centreLocal[0], 0, a.centre[1] + fp.centreLocal[1]);
						ctx.own(g);
						const mesh = new THREE.Mesh(g, mat);
						mesh.name = `Floor ${id}`;
						terrainGroup.add(mesh);
					}
					samplers.push((x, z) => (Math.abs(x - a.centre[0]) <= a.half + 0.5 && Math.abs(z - a.centre[1]) <= a.half + 0.5 ? 0 : NaN));
				}
			})());
		}
		await Promise.all(groundJobs);
		heightAt = (x, z) => { for (const s of samplers) { const h = s(x, z); if (h === h) return h; } return NaN; };
		api.terrain = terrainGroup;
	} else if (data.terrain?.heightfield) {
		const f = decodeFloat32(data.terrain.heightfield.data);
		heightAt = makeHeightSampler(data.terrain.heightfield, f);
		groundMat = await makeGroundMaterial(ctx, data.terrain, { tone: tone0(defaultMoodName), name: 'Ground', vertexColors: kind === 'interior' && !!data.interior.floorShade });
		if (kind !== 'outdoor') floorUniforms.push({ value: groundMat.userData.terrainUniforms.uTBlend.value, base: data.terrain.tone ?? 1 });
		let floorShade = null;
		if (kind === 'interior' && data.interior.floorShade) {
			// dv = wallDistance is not exported: rebuilt as +distance to the nearest wall run inside the floor (finite cells), -distance outside
			const fs = data.interior.floorShade.floor;
			const runs = data.interior.wallRuns;
			floorShade = (x, z, inside) => { const d = wallRunDistance(runs, x, z) * (inside ? 1 : -1); return fs.base + fs.gain * smoothstep(fs.edge0, fs.edge1, d); };
		}
		const mesh = new THREE.Mesh(ctx.own(heightGeometry(data.terrain.heightfield, f, floorShade)), groundMat);
		mesh.name = 'Terrain';
		if (ctx.shadows) mesh.receiveShadow = true;
		terrainGroup.add(mesh);
		api.terrain = mesh;
	}
	ctx.step('ground');

	// ---- lighting object (lights exist before the rest so the light count is constant) ----
	const lighting = new Lighting(ctx, root, kind === 'choiceHands' ? 'choice' : kind === 'outdoor' ? 'outdoor' : kind === 'interior' ? 'interior' : 'stage');
	lighting.floorUniforms = floorUniforms.map((u) => ({ get value() { return u.value; }, base: u.base }));
	api.moods = lighting.names;
	api.lights = lighting.entries;

	// ---- per kind ----
	let objectRows = data.objects ?? [];
	let cardJobs = [];
	if (kind === 'outdoor') {
		const waterNormal = data.waterNormalMap ? await ctx.texture(data.waterNormalMap).catch(() => null) : null;
		api.waterNormal = waterNormal;
		if (data.water?.length) buildWater(ctx, api.water, heightAt, waterNormal);
		root.add(api.water);
		const far = new THREE.Group();
		far.name = 'Far';
		root.add(far);
		buildFar(ctx, far, waterNormal);
		await buildCobble(ctx, root, heightAt);
		ctx.step('water + far');
		const farObjs = await placeObjects(ctx, data.far?.objects ?? [], far, { far: true, label: 'Far silhouettes' });
		void farObjs;
	} else if (kind === 'interior') {
		const mods = await buildInteriorWalls(ctx, root, heightAt);
		objectRows = objectRows.concat(mods);
		ctx.step('walls');
	} else if (kind === 'oldFace') {
		if (data.water?.rect && !Array.isArray(data.water)) {
			const wtr = data.water;
			const nm = wtr.normalMap ? await ctx.texture(wtr.normalMap).catch(() => null) : null;
			const sh = wtr.shore;
			const pos = [];
			const uv = [];
			const idx = [];
			if (sh?.x0?.length && sh.x0.length === sh.x1?.length) {
				sh.x0.forEach((p0, i) => {
					const p1 = sh.x1[i];
					pos.push(p0[0], wtr.level, p0[1], p1[0], wtr.level, p1[1]);
					uv.push(p0[0] / 3, -p0[1] / 3, p1[0] / 3, -p1[1] / 3);
					if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); }
				});
			} else {
				const r = wtr.rect;
				pos.push(r.x0, wtr.level, r.z0, r.x1, wtr.level, r.z0, r.x0, wtr.level, r.z1, r.x1, wtr.level, r.z1);
				uv.push(r.x0 / 3, -r.z0 / 3, r.x1 / 3, -r.z0 / 3, r.x0 / 3, -r.z1 / 3, r.x1 / 3, -r.z1 / 3);
				idx.push(0, 2, 1, 1, 2, 3);
			}
			const g = new THREE.BufferGeometry();
			g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
			g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
			g.setIndex(idx);
			g.computeVertexNormals();
			if (g.attributes.normal.getY(0) < 0) { g.index.array.reverse(); g.computeVertexNormals(); }
			const wm = new THREE.MeshPhysicalMaterial({ color: '#0a1210', roughness: 0.2, metalness: 0, normalMap: nm, normalScale: new THREE.Vector2(0.3, 0.3), transparent: true, opacity: 0.85 });
			ctx.own(g);
			ctx.own(wm);
			const wmesh = new THREE.Mesh(g, wm);
			wmesh.name = 'Water';
			api.water.add(wmesh);
		}
		root.add(api.water);
	}
	if (kind === 'choiceHands') {
		await buildChoiceHands(ctx, root, api);
	} else {
		const placed = await placeObjects(ctx, objectRows, root, { label: 'Objects' });
		cardJobs = placed.cards;
		ctx.step('objects');
		if (kind === 'outdoor') {
			await buildCards(ctx, root, cardJobs, heightAt);
			await buildMeadow(ctx, root);
			for (const c of cardJobs) void c;
		}
		if (kind === 'oldFace' || kind === 'dungeon') await buildDressing(ctx, root);
		ctx.step('details');
	}

	// ---- fog patch on every mesh material of the map ----
	root.traverse((o) => {
		if (!(o.isMesh || o.isInstancedMesh)) return;
		for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
			if (m && (m.isMeshStandardMaterial || m.isMeshBasicMaterial || m.isMeshPhysicalMaterial)) patchFog(m, lighting.fogU);
		}
	});

	// ---- moods ----
	await lighting.preload();
	lighting.scene = opts.scene ?? null;
	const initial = opts.mood && lighting.moods[opts.mood] ? opts.mood : defaultMoodName;
	if (initial) {
		lighting.apply(initial);
	}
	api.mood = initial;
	ctx.step('lighting');

	// ---- API ----
	const surfaceAt = (x, z) => {
		let best = heightAt(x, z);
		for (const d of decks) {
			const dx = d.bx - d.ax;
			const dz = d.bz - d.az;
			const l2 = dx * dx + dz * dz;
			if (!l2) continue;
			const t = ((x - d.ax) * dx + (z - d.az) * dz) / l2;
			if (t < 0 || t > 1) continue;
			const lat = Math.abs((x - d.ax) * dz - (z - d.az) * dx) / Math.sqrt(l2);
			if (lat > d.w / 2) continue;
			const y = d.ya + (d.yb - d.ya) * t;
			if (!(best >= y)) best = y;
		}
		return best;
	};
	const views = kind === 'choiceHands' && data.camera?.idle
		? { idle: { label: 'idle (class select)', eye: data.camera.idle.position, look: data.camera.idle.target, fov: data.camera.idle.fovDeg } }
		: data.views ?? {};
	const viewList = (aspect = 16 / 9) => Object.entries(views).map(([id, v]) => ({ id, label: v.label ?? id, ...viewCamera(v, { aspect }) }));
	Object.assign(api, {
		heightAt,
		surfaceAt,
		colliders: buildColliders(data),
		views: viewList(),
		defaultView: views.overview ? 'overview' : Object.keys(views)[0] ?? null,
		viewCamera: (view, aspect = 16 / 9, fov = 35) => viewCamera(typeof view === 'string' ? views[view] : view, { aspect, fov }),
		get look() { return lighting.look; },
		setMood(name) {
			if (!lighting.moods[name]) throw new Error(`unknown mood "${name}" (have: ${lighting.names.join(', ')})`);
			api.mood = name;
			lighting.apply(name);
			return Promise.resolve(); // synchronous now; still a promise for older callers
		},
		bind(scene, renderer) { lighting.bind(scene, renderer); },
		update(t) {
			lighting.update(t);
			if (api.waterNormal) api.waterNormal.offset.set(t * 0.006, t * 0.004);
		},
		missing: [],
		loadMs: 0,
		dispose() {
			root.traverse((o) => o.isInstancedMesh && o.dispose());
			lighting.release();
			root.removeFromParent();
			for (const d of ctx.disposables) d.dispose?.();
			ctx.texCache.clear();
			ctx.glbCache.clear();
		},
	});
	api.missing = [...ctx.missing.values()];
	api.loadMs = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
	ctx.step('done');
	opts.onProgress?.(1, 'done');
	return api;
}

export default loadAshlarMap;

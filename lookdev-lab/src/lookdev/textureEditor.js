// Texture editor for the selected asset (character, held item or any clicked mesh):
//   slots     preview, replace (PNG/JPG/WebP), add, remove, reset, export PNG
//   adjust    colour maps: hue, saturation, brightness, contrast, gamma, tint — data maps: levels,
//             invert (per channel, so packed ORM maps keep their other channels) — normal: flip green
//   area      adjustments can be limited to the UV area of one mesh (atlas textures such as KayKit's)
//   uv        repeat / offset / rotation, wrap, filtering, anisotropy
// Edits are baked into a canvas on the CPU, so WebGL2 and WebGPU sample the very same texels.
import * as THREE from 'three';
import { note, colorProxy, clearFolder } from '../ui/gui.js';
import { toast } from '../ui/toast.js';

export const SLOTS = [
	{ key: 'map', label: 'Base colour', kind: 'color' },
	{ key: 'emissiveMap', label: 'Emissive', kind: 'color' },
	{ key: 'normalMap', label: 'Normal', kind: 'normal' },
	{ key: 'roughnessMap', label: 'Roughness', kind: 'data', channel: 1 },
	{ key: 'metalnessMap', label: 'Metalness', kind: 'data', channel: 2 },
	{ key: 'aoMap', label: 'Ambient occlusion', kind: 'data', channel: 0 },
	{ key: 'alphaMap', label: 'Opacity', kind: 'data', channel: 1 },
	{ key: 'bumpMap', label: 'Height (bump)', kind: 'data', channel: 0 },
];
const SLOT = Object.fromEntries(SLOTS.map((s) => [s.key, s]));
const COLOR_DEFAULT = { hue: 0, saturation: 1, brightness: 1, contrast: 1, gamma: 1, tint: '#ffffff' };
const CHANNEL_DEFAULT = { low: 0, high: 1, invert: false };

const drawable = (image) =>
	!!image &&
	((typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) ||
		(typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement) ||
		(typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) ||
		(typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas));

export function textureImage(texture) {
	return texture?.userData?.labEdit?.canvas || texture?.image || null;
}

export function isEditable(texture) {
	return !!texture && !texture.isCompressedTexture && !texture.isDataTexture && drawable(texture.userData?.labEdit?.source || texture.image);
}

/** Edit state stored on the texture (the original image is kept for reset / re-baking). */
export function editState(texture) {
	if (!isEditable(texture)) return null;
	if (!texture.userData.labEdit) {
		const source = texture.image;
		texture.userData.labEdit = {
			source,
			width: source.width,
			height: source.height,
			color: { ...COLOR_DEFAULT },
			channels: [0, 1, 2].map(() => ({ ...CHANNEL_DEFAULT })),
			flipGreen: false,
			mask: null, // { mesh, uuid }
			canvas: null,
			pixels: null,
		};
	}
	return texture.userData.labEdit;
}

const isDefaultColor = (c) => Object.entries(COLOR_DEFAULT).every(([k, v]) => c[k] === v);
const isDefaultChannel = (c) => c.low === 0 && c.high === 1 && !c.invert;

export function isEdited(texture) {
	const e = texture?.userData?.labEdit;
	return !!e && (!isDefaultColor(e.color) || !e.channels.every(isDefaultChannel) || e.flipGreen);
}

function readPixels(image, width, height) {
	const c = document.createElement('canvas');
	c.width = width;
	c.height = height;
	const g = c.getContext('2d', { willReadFrequently: true });
	g.drawImage(image, 0, 0, width, height);
	return g.getImageData(0, 0, width, height);
}

/** CSS-filter style hue-rotate x saturate matrix (on sRGB values, like an image editor). */
function hueSatMatrix(hueDeg, sat) {
	const a = (hueDeg * Math.PI) / 180;
	const c = Math.cos(a);
	const s = Math.sin(a);
	const H = [
		0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
		0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
		0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
	];
	const S = [
		0.213 + 0.787 * sat, 0.715 - 0.715 * sat, 0.072 - 0.072 * sat,
		0.213 - 0.213 * sat, 0.715 + 0.285 * sat, 0.072 - 0.072 * sat,
		0.213 - 0.213 * sat, 0.715 - 0.715 * sat, 0.072 + 0.928 * sat,
	];
	const M = new Array(9);
	for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) M[r * 3 + k] = S[r * 3] * H[k] + S[r * 3 + 1] * H[3 + k] + S[r * 3 + 2] * H[6 + k];
	return M;
}

function colorLUTs(color) {
	// The tint multiplies sRGB values, like a multiply layer in an image editor.
	const tint = new THREE.Color(color.tint).getRGB({}, THREE.SRGBColorSpace);
	const tints = [tint.r, tint.g, tint.b];
	return [0, 1, 2].map((ch) => {
		const lut = new Uint8ClampedArray(256);
		const t = tints[ch];
		for (let v = 0; v < 256; v++) {
			let x = (v / 255) * color.brightness;
			x = (x - 0.5) * color.contrast + 0.5;
			x = Math.min(1, Math.max(0, x));
			x = Math.pow(x, 1 / Math.max(0.05, color.gamma)) * t;
			lut[v] = Math.round(x * 255);
		}
		return lut;
	});
}

function channelLUT(c) {
	const lut = new Uint8ClampedArray(256);
	const span = Math.max(1e-3, c.high - c.low);
	for (let v = 0; v < 256; v++) {
		let x = (v / 255 - c.low) / span;
		x = Math.min(1, Math.max(0, x));
		if (c.invert) x = 1 - x;
		lut[v] = Math.round(x * 255);
	}
	return lut;
}

/** UV triangles of `mesh` rasterised into a coverage mask (1 px dilation to avoid seams). */
function uvMask(mesh, texture, width, height) {
	const geometry = mesh?.geometry;
	const uvAttr = geometry?.attributes[texture.channel ? `uv${texture.channel}` : 'uv'] || geometry?.attributes.uv;
	if (!uvAttr) return null;
	const c = document.createElement('canvas');
	c.width = width;
	c.height = height;
	const g = c.getContext('2d', { willReadFrequently: true });
	g.fillStyle = '#fff';
	g.strokeStyle = '#fff';
	g.lineWidth = 2;
	g.lineJoin = 'round';
	texture.updateMatrix();
	const m = texture.matrix;
	const index = geometry.index;
	const count = index ? index.count : uvAttr.count;
	const p = new THREE.Vector2();
	const pt = (i) => {
		p.fromBufferAttribute(uvAttr, i).applyMatrix3(m);
		const u = p.x - Math.floor(p.x);
		const v = p.y - Math.floor(p.y);
		return [u * width, (texture.flipY ? 1 - v : v) * height];
	};
	g.beginPath();
	for (let i = 0; i + 2 < count; i += 3) {
		const a = pt(index ? index.getX(i) : i);
		const b = pt(index ? index.getX(i + 1) : i + 1);
		const d = pt(index ? index.getX(i + 2) : i + 2);
		g.moveTo(a[0], a[1]);
		g.lineTo(b[0], b[1]);
		g.lineTo(d[0], d[1]);
		g.closePath();
	}
	g.fill();
	g.stroke();
	const data = g.getImageData(0, 0, width, height).data;
	const mask = new Uint8Array(width * height);
	for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3];
	return mask;
}

/** Re-bake the texture from its original image with the current adjustments. */
export function bake(texture, slotKinds = usageKinds(texture)) {
	const e = editState(texture);
	if (!e) return false;
	const { width, height } = e;
	e.pixels ??= readPixels(e.source, width, height);
	const src = e.pixels.data;
	const out = new ImageData(new Uint8ClampedArray(src), width, height);
	const dst = out.data;
	const useColor = slotKinds.has('color') && !isDefaultColor(e.color);
	const M = useColor ? hueSatMatrix(e.color.hue, e.color.saturation) : null;
	const luts = useColor ? colorLUTs(e.color) : null;
	const chan = e.channels.map((c) => (isDefaultChannel(c) ? null : channelLUT(c)));
	const flip = e.flipGreen;
	let mask = null;
	if (e.mask?.mesh) {
		e.maskCache ??= {};
		const key = `${e.mask.mesh.uuid}|${width}x${height}`;
		mask = e.maskCache[key] ??= uvMask(e.mask.mesh, texture, width, height);
	}
	for (let i = 0, px = 0; i < dst.length; i += 4, px++) {
		const weight = mask ? mask[px] / 255 : 1;
		if (weight === 0) continue;
		let r = src[i];
		let g = src[i + 1];
		let b = src[i + 2];
		if (M) {
			const nr = M[0] * r + M[1] * g + M[2] * b;
			const ng = M[3] * r + M[4] * g + M[5] * b;
			const nb = M[6] * r + M[7] * g + M[8] * b;
			r = luts[0][nr < 0 ? 0 : nr > 255 ? 255 : nr | 0];
			g = luts[1][ng < 0 ? 0 : ng > 255 ? 255 : ng | 0];
			b = luts[2][nb < 0 ? 0 : nb > 255 ? 255 : nb | 0];
		}
		if (chan[0]) r = chan[0][r];
		if (chan[1]) g = chan[1][g];
		if (chan[2]) b = chan[2][b];
		if (flip) g = 255 - g;
		if (weight < 1) {
			r = src[i] + (r - src[i]) * weight;
			g = src[i + 1] + (g - src[i + 1]) * weight;
			b = src[i + 2] + (b - src[i + 2]) * weight;
		}
		dst[i] = r;
		dst[i + 1] = g;
		dst[i + 2] = b;
	}
	if (!e.canvas) {
		e.canvas = document.createElement('canvas');
		e.canvas.width = width;
		e.canvas.height = height;
		// Own image source from now on (clones that shared the original keep it).
		texture.source = new THREE.Source(e.canvas);
	}
	e.canvas.getContext('2d').putImageData(out, 0, 0);
	texture.needsUpdate = true;
	return true;
}

/** Undo every adjustment (back to the original image). */
export function resetEdits(texture) {
	const e = texture?.userData?.labEdit;
	if (!e) return;
	texture.source = new THREE.Source(e.source);
	delete texture.userData.labEdit;
	texture.needsUpdate = true;
}

/** Which kinds of slot use this texture (in materials that registered it). */
function usageKinds(texture) {
	const kinds = new Set();
	for (const key of Object.keys(texture.userData.labSlots || {})) kinds.add(SLOT[key]?.kind);
	if (!kinds.size) kinds.add('color');
	return kinds;
}

function registerUsage(material) {
	for (const { key } of SLOTS) {
		const t = material[key];
		if (!t) continue;
		t.userData.labSlots ??= {};
		t.userData.labSlots[key] = true;
	}
}

export async function loadImage(file) {
	const url = URL.createObjectURL(file);
	try {
		const img = new Image();
		img.src = url;
		await img.decode();
		return img;
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 2000);
	}
}

/** Put `image` into `slot` of `material` (replacing, or adding when the slot was empty). */
export function assignImage(material, slotKey, image, { anisotropy = 4 } = {}) {
	const slot = SLOT[slotKey];
	const old = material[slotKey];
	material.userData.labOriginalMaps ??= {};
	if (!(slotKey in material.userData.labOriginalMaps)) material.userData.labOriginalMaps[slotKey] = old || null;
	const texture = new THREE.Texture(image);
	const reference = old || material.map || null;
	if (old) {
		for (const k of ['wrapS', 'wrapT', 'magFilter', 'minFilter', 'anisotropy', 'flipY', 'channel', 'rotation', 'generateMipmaps']) texture[k] = old[k];
		texture.repeat.copy(old.repeat);
		texture.offset.copy(old.offset);
		texture.center.copy(old.center);
	} else {
		texture.flipY = reference ? reference.flipY : true;
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.anisotropy = anisotropy;
	}
	texture.colorSpace = slot.kind === 'color' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
	texture.name = image.name || slotKey;
	texture.needsUpdate = true;
	// A packed map (ORM) used by several slots of this material is replaced in all of them.
	const keys = old ? SLOTS.filter((s) => material[s.key] === old).map((s) => s.key) : [slotKey];
	for (const k of keys) material[k] = texture;
	if (slotKey === 'emissiveMap' && material.emissive?.getHex() === 0) material.emissive.set(0xffffff);
	if (slotKey === 'alphaMap') material.transparent = true;
	if (slotKey === 'roughnessMap' && !old) material.roughness = 1;
	if (slotKey === 'metalnessMap' && !old) material.metalness = 1;
	material.needsUpdate = true;
	registerUsage(material);
	return texture;
}

export function removeSlot(material, slotKey) {
	material.userData.labOriginalMaps ??= {};
	if (!(slotKey in material.userData.labOriginalMaps)) material.userData.labOriginalMaps[slotKey] = material[slotKey] || null;
	material[slotKey] = null;
	material.needsUpdate = true;
}

/** Restore the slot's original texture (and drop its adjustments). */
export function resetSlot(material, slotKey) {
	const original = material.userData.labOriginalMaps?.[slotKey];
	if (original !== undefined) {
		material[slotKey] = original;
		delete material.userData.labOriginalMaps[slotKey];
		material.needsUpdate = true;
	}
	if (material[slotKey]) resetEdits(material[slotKey]);
}

export function exportPNG(texture, filename) {
	const image = textureImage(texture);
	if (!drawable(image)) return toast('This texture cannot be exported (compressed or data texture).', 'error', 3000);
	const c = document.createElement('canvas');
	c.width = image.width;
	c.height = image.height;
	c.getContext('2d').drawImage(image, 0, 0);
	c.toBlob((blob) => {
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = filename.replace(/[^\w.-]+/g, '_') + '.png';
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 4000);
	}, 'image/png');
}

/** Give one mesh its own copy of a shared material (and of its textures). */
export function makeUnique(mesh, material, app) {
	const copy = material.clone();
	copy.name = `${material.name || 'material'} (unique)`;
	for (const { key } of SLOTS) {
		const t = material[key];
		if (!t) continue;
		const clone = t.clone();
		if (t.userData.labEdit) {
			// Keep the edits, on a canvas of its own: the clone re-bakes from the same original image.
			const e = t.userData.labEdit;
			let canvas = null;
			if (e.canvas) {
				canvas = document.createElement('canvas');
				canvas.width = e.canvas.width;
				canvas.height = e.canvas.height;
				canvas.getContext('2d').drawImage(e.canvas, 0, 0);
			}
			clone.userData = { labSlots: { ...(t.userData.labSlots || {}) }, labEdit: { ...e, canvas, color: { ...e.color }, channels: e.channels.map((c) => ({ ...c })), mask: null, maskCache: null } };
			clone.source = new THREE.Source(canvas || e.source);
		}
		copy[key] = clone;
	}
	// Twins keep shader-lab patches working: hand the new material to the backend like any new mesh.
	if (Array.isArray(mesh.material)) mesh.material = mesh.material.map((m) => (m === material ? copy : m));
	else mesh.material = copy;
	app.backend.prepareObject(mesh);
	return copy;
}

function thumbnail(texture, size = 64) {
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const g = c.getContext('2d');
	g.fillStyle = '#0b0d0c';
	g.fillRect(0, 0, size, size);
	const image = textureImage(texture);
	if (drawable(image)) g.drawImage(image, 0, 0, size, size);
	else {
		g.fillStyle = '#8b968a';
		g.font = '10px sans-serif';
		g.fillText('no preview', 6, size / 2);
	}
	return c;
}

/**
 * UI in a lil-gui folder. getTarget() -> { root, mesh, label } | null
 *   root   object whose meshes are listed (materials), mesh: the mesh used for UV overlay / area masks.
 */
export function buildTextureEditor(folder, app, getTarget) {
	const state = { materialIndex: 0, slot: 'map', overlay: true, area: false };
	const box = document.createElement('div');
	box.className = 'tex-editor';
	folder.$children.appendChild(box);
	const fAdjust = folder.addFolder('Adjust selected map');
	const fUV = folder.addFolder('UV & filtering').close();
	const fMaterial = folder.addFolder('Material factors').close();
	let materials = [];
	let target = null;
	let pending = null;

	const scheduleBake = (texture) => {
		if (pending) return;
		pending = requestAnimationFrame(() => {
			pending = null;
			bake(texture);
			drawPreview();
			drawStrip();
		});
	};

	function collect() {
		target = getTarget?.() || null;
		materials = [];
		const users = new Map();
		target?.root?.traverse((o) => {
			if (!o.isMesh || !o.visible || o.userData.labNoView === true) return;
			for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
				if (!m || m.userData?.labViewSwap) continue;
				if (!users.has(m)) {
					users.set(m, []);
					materials.push(m);
				}
				users.get(m).push(o);
			}
		});
		for (const m of materials) registerUsage(m);
		return users;
	}

	let users = new Map();
	let preview = null;
	let strip = null;

	function material() {
		return materials[Math.min(state.materialIndex, materials.length - 1)] || null;
	}

	function maskMesh() {
		const m = material();
		if (!m) return null;
		if (target?.mesh && users.get(m)?.includes(target.mesh)) return target.mesh;
		return users.get(m)?.[0] || null;
	}

	function drawStrip() {
		if (!strip) return;
		strip.innerHTML = '';
		const m = material();
		if (!m) return;
		for (const slot of SLOTS) {
			const t = m[slot.key];
			if (!t) continue;
			const cell = document.createElement('button');
			cell.className = `tex-slot${state.slot === slot.key ? ' active' : ''}${isEdited(t) ? ' edited' : ''}`;
			cell.title = `${slot.label}${t.image?.width ? ` · ${t.image.width}×${t.image.height}` : ''}`;
			cell.appendChild(thumbnail(t));
			const label = document.createElement('span');
			label.textContent = slot.label;
			cell.appendChild(label);
			cell.addEventListener('click', () => {
				state.slot = slot.key;
				rebuild(false);
			});
			strip.appendChild(cell);
		}
		const empty = SLOTS.filter((s) => !m[s.key]);
		if (empty.length) {
			const add = document.createElement('select');
			add.className = 'tex-add';
			add.innerHTML = `<option value="">+ Add map…</option>${empty.map((s) => `<option value="${s.key}">${s.label}</option>`).join('')}`;
			add.addEventListener('change', () => {
				const key = add.value;
				add.value = '';
				if (key) pickFile((image) => {
					assignImage(m, key, image, { anisotropy: app.backend.caps.maxAnisotropy });
					state.slot = key;
					rebuild(false);
				});
			});
			strip.appendChild(add);
		}
	}

	function drawPreview() {
		if (!preview) return;
		const g = preview.getContext('2d');
		const size = preview.width;
		g.fillStyle = '#0b0d0c';
		g.fillRect(0, 0, size, size);
		const m = material();
		const t = m?.[state.slot];
		const image = textureImage(t);
		if (drawable(image)) g.drawImage(image, 0, 0, size, size);
		if (!state.overlay || !t) return;
		const mesh = maskMesh();
		const uv = mesh?.geometry?.attributes.uv;
		if (!uv) return;
		t.updateMatrix();
		const index = mesh.geometry.index;
		const count = Math.min(index ? index.count : uv.count, 60000);
		const p = new THREE.Vector2();
		g.strokeStyle = 'rgba(230, 200, 140, 0.55)';
		g.lineWidth = 0.6;
		g.beginPath();
		const pt = (i) => {
			p.fromBufferAttribute(uv, i).applyMatrix3(t.matrix);
			return [(p.x - Math.floor(p.x)) * size, (t.flipY ? 1 - (p.y - Math.floor(p.y)) : p.y - Math.floor(p.y)) * size];
		};
		for (let i = 0; i + 2 < count; i += 3) {
			const a = pt(index ? index.getX(i) : i);
			const b = pt(index ? index.getX(i + 1) : i + 1);
			const c = pt(index ? index.getX(i + 2) : i + 2);
			g.moveTo(a[0], a[1]);
			g.lineTo(b[0], b[1]);
			g.lineTo(c[0], c[1]);
			g.closePath();
		}
		g.stroke();
	}

	function pickFile(onImage) {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/png,image/jpeg,image/webp,image/avif';
		input.addEventListener('change', async () => {
			const file = input.files?.[0];
			if (!file) return;
			try {
				const image = await loadImage(file);
				image.name = file.name;
				onImage(image);
				toast(`${file.name} · ${image.width}×${image.height}`, 'ok', 2500);
			} catch (error) {
				toast(`${file.name}: ${error.message}`, 'error', 5000);
			}
		});
		input.click();
	}

	function button(label, onClick, className = '') {
		const b = document.createElement('button');
		b.className = `button small ${className}`;
		b.textContent = label;
		b.addEventListener('click', onClick);
		return b;
	}

	function rebuild(recollect = true) {
		if (recollect) users = collect();
		box.innerHTML = '';
		clearFolder(fAdjust);
		clearFolder(fUV);
		clearFolder(fMaterial);
		if (!target || !materials.length) {
			box.innerHTML = '<p class="tex-empty">Pick an asset: the character, a held item, or click a mesh in the viewport.</p>';
			fAdjust.hide();
			fUV.hide();
			fMaterial.hide();
			return;
		}
		fAdjust.show();
		fUV.show();
		fMaterial.show();
		const m = material();
		if (!m[state.slot]) state.slot = SLOTS.find((s) => m[s.key])?.key || 'map';
		const head = document.createElement('div');
		head.className = 'tex-head';
		const meshes = users.get(m) || [];
		const shared = meshes.length;
		head.innerHTML = `<b>${target.label}</b> · ${materials.length} material${materials.length > 1 ? 's' : ''}`;
		if (materials.length > 1) {
			const select = document.createElement('select');
			select.innerHTML = materials.map((mat, i) => `<option value="${i}">${mat.name || mat.type} (${users.get(mat).length})</option>`).join('');
			select.value = String(Math.min(state.materialIndex, materials.length - 1));
			select.addEventListener('change', () => {
				state.materialIndex = Number(select.value);
				rebuild(false);
			});
			head.appendChild(select);
		} else {
			const span = document.createElement('span');
			span.className = 'tex-mat';
			span.textContent = `${m.name || m.type} · used by ${shared} mesh${shared === 1 ? '' : 'es'}`;
			head.appendChild(span);
		}
		box.appendChild(head);
		strip = document.createElement('div');
		strip.className = 'tex-strip';
		box.appendChild(strip);
		drawStrip();

		const t = m[state.slot];
		const slot = SLOT[state.slot];
		const wrap = document.createElement('div');
		wrap.className = 'tex-preview';
		preview = document.createElement('canvas');
		preview.width = preview.height = 256;
		wrap.appendChild(preview);
		const info = document.createElement('div');
		info.className = 'tex-info';
		info.textContent = t ? `${slot.label} · ${t.image?.width || '?'}×${t.image?.height || '?'} · ${t.colorSpace === THREE.SRGBColorSpace ? 'sRGB' : 'linear'}${t.flipY ? '' : ' · glTF UV'}${isEdited(t) ? ' · edited' : ''}` : 'No texture in this slot';
		wrap.appendChild(info);
		box.appendChild(wrap);
		drawPreview();

		const actions = document.createElement('div');
		actions.className = 'tex-actions';
		actions.append(
			button('Replace…', () => pickFile((image) => {
				assignImage(m, state.slot, image, { anisotropy: app.backend.caps.maxAnisotropy });
				rebuild(false);
			})),
			button('Export PNG', () => t && exportPNG(t, `${m.name || 'material'}_${slot.label}`)),
			button('Reset', () => {
				resetSlot(m, state.slot);
				rebuild(false);
			}),
			button('Remove', () => {
				removeSlot(m, state.slot);
				rebuild(false);
			}, 'danger'),
		);
		if (shared > 1 && target.mesh && meshes.includes(target.mesh)) {
			actions.append(button('Make unique to this mesh', () => {
				makeUnique(target.mesh, m, app);
				toast(`“${target.mesh.name}” has its own material now`, 'ok', 2500);
				rebuild(true);
			}));
		}
		box.appendChild(actions);

		const e = editState(t);
		if (!t) note(fAdjust, 'Empty slot — use <b>+ Add map…</b> to load an image into it.');
		else if (!e) note(fAdjust, 'Compressed / data texture: replace it with a PNG or JPEG to adjust it here.');
		else {
			const rebake = () => scheduleBake(t);
			const fullUsers = (n) => (n > 1 ? `Shared by ${n} meshes: every one of them changes. ` : '');
			if (slot.kind === 'color') {
				fAdjust.add(e.color, 'hue', -180, 180, 1).name('Hue °').onChange(rebake);
				fAdjust.add(e.color, 'saturation', 0, 2, 0.01).name('Saturation').onChange(rebake);
				fAdjust.add(e.color, 'brightness', 0, 2, 0.01).name('Brightness').onChange(rebake);
				fAdjust.add(e.color, 'contrast', 0, 2, 0.01).name('Contrast').onChange(rebake);
				fAdjust.add(e.color, 'gamma', 0.2, 3, 0.01).name('Gamma').onChange(rebake);
				fAdjust.addColor(e.color, 'tint').name('Tint (multiply)').onChange(rebake);
			} else if (slot.kind === 'data') {
				const c = e.channels[slot.channel];
				const channelName = 'RGB'[slot.channel];
				fAdjust.add(c, 'low', 0, 1, 0.01).name(`Levels in · black (${channelName})`).onChange(rebake);
				fAdjust.add(c, 'high', 0, 1, 0.01).name(`Levels in · white (${channelName})`).onChange(rebake);
				fAdjust.add(c, 'invert').name(slot.key === 'roughnessMap' ? 'Invert (gloss → roughness)' : 'Invert').onChange(rebake);
			} else if (slot.kind === 'normal') {
				fAdjust.add(e, 'flipGreen').name('Flip green (DirectX ↔ OpenGL)').onChange(rebake);
				if (m.normalScale) {
					const n = { strength: Math.abs(m.normalScale.x) };
					fAdjust.add(n, 'strength', 0, 3, 0.01).name('Normal strength').onChange((v) => m.normalScale.set(v, Math.sign(m.normalScale.y || 1) * v));
				}
			}
			const mesh = maskMesh();
			if (mesh && slot.kind !== 'normal') {
				const area = { get on() { return !!e.mask; }, set on(v) { e.mask = v ? { mesh } : null; rebake(); } };
				fAdjust.add(area, 'on').name(`Only “${(mesh.name || 'mesh').slice(0, 22)}” UV area`);
			}
			fAdjust.add({ reset: () => { resetEdits(t); rebuild(false); } }, 'reset').name('Reset adjustments');
			note(fAdjust, `${fullUsers(shared)}Adjustments are baked on the CPU into the texture, so both renderers see identical pixels. <b>Export PNG</b> saves the result.`);
		}

		// UV & filtering ----------------------------------------------------------------------
		if (t) {
			const upd = () => {
				t.needsUpdate = true;
				drawPreview();
			};
			fUV.add(t.repeat, 'x', 0.05, 16, 0.01).name('Repeat U').onChange(drawPreview);
			fUV.add(t.repeat, 'y', 0.05, 16, 0.01).name('Repeat V').onChange(drawPreview);
			fUV.add(t.offset, 'x', -1, 1, 0.001).name('Offset U').onChange(drawPreview);
			fUV.add(t.offset, 'y', -1, 1, 0.001).name('Offset V').onChange(drawPreview);
			const rot = { deg: THREE.MathUtils.radToDeg(t.rotation) };
			fUV.add(rot, 'deg', -180, 180, 1).name('Rotation °').onChange((v) => {
				t.rotation = THREE.MathUtils.degToRad(v);
				t.center.set(0.5, 0.5);
				drawPreview();
			});
			fUV.add(t, 'wrapS', { Repeat: THREE.RepeatWrapping, Clamp: THREE.ClampToEdgeWrapping, Mirror: THREE.MirroredRepeatWrapping }).name('Wrap').onChange((v) => {
				t.wrapT = v;
				upd();
			});
			const filter = { get mode() { return t.magFilter === THREE.NearestFilter ? 'nearest' : 'linear'; }, set mode(v) {
				t.magFilter = v === 'nearest' ? THREE.NearestFilter : THREE.LinearFilter;
				t.minFilter = v === 'nearest' ? THREE.NearestMipmapNearestFilter : THREE.LinearMipmapLinearFilter;
				upd();
			} };
			fUV.add(filter, 'mode', { 'Smooth (linear + mipmaps)': 'linear', 'Pixelated (nearest)': 'nearest' }).name('Filtering');
			fUV.add(t, 'anisotropy', 1, app.backend.caps.maxAnisotropy || 16, 1).name('Anisotropy').onChange(upd);
		}

		// Material factors ------------------------------------------------------------------
		if (m.color) fMaterial.addColor(colorProxy(m.color), 'hex').name('Base colour (multiplies map)');
		if ('roughness' in m) fMaterial.add(m, 'roughness', 0, 1, 0.01).name('Roughness');
		if ('metalness' in m) fMaterial.add(m, 'metalness', 0, 1, 0.01).name('Metalness');
		if (m.emissive) {
			fMaterial.addColor(colorProxy(m.emissive), 'hex').name('Emissive colour');
			fMaterial.add(m, 'emissiveIntensity', 0, 20, 0.01).name('Emissive intensity');
		}
		if ('envMapIntensity' in m) fMaterial.add(m, 'envMapIntensity', 0, 3, 0.01).name('Env intensity');
	}

	const api = {
		folder,
		refresh: () => rebuild(true),
		setOverlay(v) {
			state.overlay = v;
			drawPreview();
		},
	};
	rebuild(true);
	return api;
}

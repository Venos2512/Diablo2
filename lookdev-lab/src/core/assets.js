// Asset access + loaders. In the offline build every sample (and the Draco / Basis decoders) is embedded
// as a base64 <script data-asset>; in dev they are fetched from the dev server.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import samples from '../assets/samples.json';

export const SAMPLES = samples.assets;
export const sampleById = (id) => SAMPLES.find((a) => a.id === id);

const DECODERS = {
	'draco_wasm_wrapper.js': 'decoders/draco_wasm_wrapper.js',
	'draco_decoder.wasm': 'decoders/draco_decoder.wasm',
	'basis_transcoder.js': 'decoders/basis_transcoder.js',
	'basis_transcoder.wasm': 'decoders/basis_transcoder.wasm',
};

const blobUrls = new Map();

function mimeFor(file) {
	if (file.endsWith('.js')) return 'text/javascript';
	if (file.endsWith('.wasm')) return 'application/wasm';
	if (file.endsWith('.glb')) return 'model/gltf-binary';
	if (file.endsWith('.png')) return 'image/png';
	return 'application/octet-stream';
}

/** URL for a bundled asset path such as "samples/fox.glb". */
export function assetUrl(file) {
	if (blobUrls.has(file)) return blobUrls.get(file);
	const tag = document.querySelector(`script[data-asset="${CSS.escape(file)}"]`);
	if (tag) {
		const binary = atob(tag.textContent.trim());
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		const url = URL.createObjectURL(new Blob([bytes], { type: mimeFor(file) }));
		blobUrls.set(file, url);
		tag.remove(); // free the base64 text once decoded
		return url;
	}
	return '/' + (file.startsWith('decoders/') ? file : 'assets/' + file);
}

export class AssetLoader {
	constructor() {
		this.manager = new THREE.LoadingManager();
		this.manager.setURLModifier((url) => {
			const name = url.split('/').pop();
			if (DECODERS[name]) return assetUrl(DECODERS[name]);
			return url;
		});
		this.draco = new DRACOLoader(this.manager).setDecoderPath('');
		this.ktx2 = new KTX2Loader(this.manager).setTranscoderPath('');
		this.gltf = new GLTFLoader(this.manager).setDRACOLoader(this.draco).setKTX2Loader(this.ktx2).setMeshoptDecoder(MeshoptDecoder);
		this.hdr = new HDRLoader(this.manager);
		this.exr = new EXRLoader(this.manager);
		this.texture = new THREE.TextureLoader(this.manager);
		this.ktx2Ready = false;
	}

	/** KTX2 transcoding needs to know the renderer's compressed-format support (WebGL or WebGPU). */
	bindRenderer(renderer) {
		try {
			this.ktx2.detectSupport(renderer);
			this.ktx2Ready = true;
		} catch (err) {
			console.warn('KTX2 support detection failed', err);
		}
	}

	async loadSample(id) {
		const entry = sampleById(id);
		if (!entry) throw new Error(`Unknown sample "${id}"`);
		const url = assetUrl(entry.file);
		if (entry.kind === 'hdri') return this.loadHDR(url);
		return this.loadGLTF(url);
	}

	/**
	 * Shared sample files (animation libraries, the props library): loaded once and cached. Clips and
	 * prop meshes are shared between every character that uses them (clone props before attaching).
	 */
	loadLibrary(id) {
		this.libraries ??= new Map();
		if (!this.libraries.has(id)) {
			const promise = this.loadSample(id).catch((error) => {
				this.libraries.delete(id);
				throw error;
			});
			this.libraries.set(id, promise);
		}
		return this.libraries.get(id);
	}

	/** Pixels of a bundled image sample (kind 'texture') as ImageData, no colour conversion. */
	async loadImageData(id) {
		const entry = sampleById(id);
		if (!entry) throw new Error(`Unknown sample "${id}"`);
		const blob = await (await fetch(assetUrl(entry.file))).blob();
		const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
		const ctx = canvas.getContext('2d', { willReadFrequently: true });
		ctx.drawImage(bitmap, 0, 0);
		bitmap.close();
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	async loadGLTF(url) {
		return this.gltf.loadAsync(url);
	}

	async loadHDR(url, ext = 'hdr') {
		const loader = ext === 'exr' ? this.exr : this.hdr;
		const texture = await loader.loadAsync(url);
		texture.mapping = THREE.EquirectangularReflectionMapping;
		return texture;
	}

	/**
	 * Load dropped files. Returns { kind, ... } records. A .gltf dropped together with its .bin and
	 * textures resolves those siblings through blob URLs.
	 */
	async loadFiles(files) {
		const list = [...files];
		const byName = new Map(list.map((f) => [f.name.toLowerCase(), f]));
		const urls = new Map();
		const urlFor = (file) => {
			if (!urls.has(file)) urls.set(file, URL.createObjectURL(file));
			return urls.get(file);
		};
		const siblingManager = new THREE.LoadingManager();
		siblingManager.setURLModifier((url) => {
			const name = decodeURIComponent(url.split(/[\\/]/).pop()).toLowerCase();
			if (DECODERS[name]) return assetUrl(DECODERS[name]);
			const file = byName.get(name);
			return file ? urlFor(file) : url;
		});

		const results = [];
		const images = [];
		for (const file of list) {
			const name = file.name.toLowerCase();
			const ext = name.split('.').pop();
			try {
				if (ext === 'glb' || ext === 'gltf') {
					const loader = new GLTFLoader(siblingManager).setDRACOLoader(this.draco).setMeshoptDecoder(MeshoptDecoder);
					if (this.ktx2Ready) loader.setKTX2Loader(this.ktx2);
					const gltf = await loader.loadAsync(urlFor(file));
					results.push({ kind: 'model', name: file.name, scene: gltf.scene, animations: gltf.animations || [] });
				} else if (ext === 'fbx') {
					const loader = new FBXLoader(siblingManager);
					const object = loader.parse(await file.arrayBuffer(), '');
					results.push({ kind: 'model', name: file.name, scene: object, animations: object.animations || [] });
				} else if (ext === 'obj') {
					const object = new OBJLoader(siblingManager).parse(await file.text());
					results.push({ kind: 'model', name: file.name, scene: object, animations: [] });
				} else if (ext === 'hdr' || ext === 'exr') {
					const texture = await this.loadHDR(urlFor(file), ext);
					results.push({ kind: 'hdri', name: file.name, texture });
				} else if (ext === 'cube') {
					results.push({ kind: 'lut', name: file.name, text: await file.text() });
				} else if (['png', 'jpg', 'jpeg', 'webp', 'avif', 'tga'].includes(ext)) {
					images.push(file);
				} else if (ext === 'json') {
					results.push({ kind: 'preset', name: file.name, text: await file.text() });
				} else if (ext !== 'bin') {
					results.push({ kind: 'unsupported', name: file.name });
				}
			} catch (error) {
				results.push({ kind: 'error', name: file.name, error });
			}
		}
		if (images.length && !list.some((f) => /\.gltf$/i.test(f.name))) {
			const textures = await Promise.all(images.map(async (file) => {
				const texture = await this.texture.loadAsync(urlFor(file));
				texture.name = file.name;
				return texture;
			}));
			results.push({ kind: 'textures', textures });
		}
		return results;
	}
}

/** Substance / common DCC naming -> material slot. */
export function classifyTexture(name) {
	const n = name.toLowerCase().replace(/\.[a-z0-9]+$/, '');
	const tests = [
		['orm', /(occlusionroughnessmetal(lic|ness)?|_orm$|[_-]orm[_-]|ao[_-]?rough(ness)?[_-]?metal)/],
		['normal', /(normal(gl|dx|opengl|directx)?|_nrm|_nor$|_n$)/],
		['roughness', /(roughness|_rough$|_r$)/],
		['metalness', /(metal(lic|ness)?|_m$)/],
		['ao', /(ambientocclusion|occlusion|_ao$|[_-]ao[_-])/],
		['emissive', /(emissive|emission|_e$)/],
		['height', /(height|displacement|_disp$)/],
		['opacity', /(opacity|alpha|transparen)/],
		['color', /(base_?colou?r|albedo|diffuse|_col$|_bc$|_d$|color)/],
	];
	for (const [slot, re] of tests) if (re.test(n)) return slot;
	return 'color';
}

export function isDirectXNormal(name) {
	return /(normaldx|normal_directx|_dx$|directx)/i.test(name);
}

// WebGPU backend: THREE.WebGPURenderer + TSL node materials / post-processing.
// mode 'webgpu'    -> WebGPU device (falls back to WebGL2 automatically when WebGPU is missing)
// mode 'webgpu-gl' -> forceWebGL: same renderer and TSL, compiled to GLSL on a WebGL2 context
import * as THREE from 'three/webgpu';
import { WebGPUPipeline, TSL_PLAYGROUND } from './pipeline.js';
import * as TSL from 'three/tsl';
import { createTSLEffects, getShadowMask } from './effects.js';
import { createTSLVfx } from './vfx.js';
import { glFence } from '../../core/gpuSync.js';
import { RectAreaLightTexturesLib } from 'three/addons/lights/RectAreaLightTexturesLib.js';

export async function createWebGPUBackend({ container, forceWebGL = false, onShaderError }) {
	const renderer = new THREE.WebGPURenderer({ antialias: false, forceWebGL, trackTimestamp: true, powerPreference: 'high-performance' });
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setClearColor(0x000000, 0);
	container.appendChild(renderer.domElement);
	await renderer.init();

	const isWebGPU = renderer.backend.isWebGPUBackend === true;
	const pipeline = new WebGPUPipeline(renderer);

	// three r180 caches node-builder states per material, not per MRT layout. When the scene pass
	// MRT layout changes (AO / TRAA / debug channels), every material must get a new program, so
	// the layout id is folded into each material's program cache key.
	// Node materials keep their own key (a hash of their node graph) so effect edits still recompile.
	let mrtLayout = 'output';
	const nodeMaterialKey = THREE.NodeMaterial.prototype.customProgramCacheKey;
	function labProgramCacheKey() {
		return (this.isNodeMaterial ? nodeMaterialKey.call(this) : '') + '|lab-mrt:' + mrtLayout;
	}
	const tagMaterials = (root) =>
		root?.traverse((o) => {
			if (!o.material) return;
			for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.customProgramCacheKey = labProgramCacheKey;
		});
	pipeline.onLayoutChange = (layout, world) => {
		mrtLayout = layout;
		tagMaterials(world.scene);
		tagMaterials(world.vfxScene);
		// The renderer's internal background sphere (env / texture backgrounds) needs the same treatment.
		const backgroundMesh = renderer._background?.get?.(world.scene)?.backgroundMesh;
		if (backgroundMesh) backgroundMesh.material.customProgramCacheKey = labProgramCacheKey;
	};
	renderer.info.autoReset = false;

	// Shadow pass + dissolve: three replaces every material by one shared shadow material during the
	// shadow pass (only positionNode carries over). Materials with a shadow mask get a masked copy of
	// that shadow material instead, so dissolved parts stop casting shadows (GLSL: shadow depth twins).
	const maskedShadow = new WeakMap(); // shadow material -> WeakMap(material -> masked copy)
	const baseRenderObject = renderer.renderObject;
	renderer.renderObject = function (object, scene, camera, geometry, material, ...rest) {
		const override = scene.overrideMaterial;
		const mask = override?.isShadowPassMaterial ? getShadowMask(material) : null;
		if (!mask) return baseRenderObject.call(this, object, scene, camera, geometry, material, ...rest);
		let perMaterial = maskedShadow.get(override);
		if (!perMaterial) maskedShadow.set(override, (perMaterial = new WeakMap()));
		let masked = perMaterial.get(material);
		if (!masked) {
			masked = new THREE.NodeMaterial();
			masked.name = `${override.name} · masked`;
			masked.isShadowPassMaterial = true;
			masked.fog = false;
			masked.colorNode = override.colorNode;
			masked.depthNode = override.depthNode;
			perMaterial.set(material, masked);
		}
		if (masked.maskNode !== mask) {
			masked.maskNode = mask;
			masked.needsUpdate = true;
		}
		scene.overrideMaterial = masked;
		try {
			return baseRenderObject.call(this, object, scene, camera, geometry, material, ...rest);
		} finally {
			scene.overrideMaterial = override;
		}
	};

	let device = null;
	if (isWebGPU) {
		device = renderer.backend.device;
		device.addEventListener?.('uncapturederror', (event) => {
			onShaderError?.({ backend: 'webgpu', program: String(event.error?.message || event.error), vertex: null, fragment: null });
		});
	}

	let lastNodeFrame = -1;
	let timestampsPaused = false;
	let pipelineWorld = null;
	let gpuTotal = null;
	let gpuRaw = null; // latest unsmoothed ms per frame (benchmarks), gpuTotal is smoothed for the HUD
	let gpuSerial = 0;
	let frame = 0;
	let lastResolvedFrame = 0;
	let resolving = false;
	let pmrem = null;
	const getPmrem = () => (pmrem ??= new THREE.PMREMGenerator(renderer));
	const hasTimestamps = isWebGPU ? renderer.hasFeature('timestamp-query') : !!renderer.backend.disjoint || !!renderer.getContext?.()?.getExtension?.('EXT_disjoint_timer_query_webgl2');

	const adapterInfo = isWebGPU ? renderer.backend.adapter?.info || {} : {};
	const gpuName = isWebGPU
		? [adapterInfo.vendor, adapterInfo.architecture, adapterInfo.description].filter(Boolean).join(' · ') || 'WebGPU adapter'
		: (() => {
				const gl = renderer.getContext();
				const ext = gl.getExtension('WEBGL_debug_renderer_info');
				return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
			})();

	const backend = {
		kind: 'webgpu',
		language: 'TSL',
		renderer,
		pipeline,
		canvas: renderer.domElement,
		isWebGPU,
		caps: {
			webgpu: isWebGPU,
			compute: true,
			gpuTimer: hasTimestamps,
			maxAnisotropy: renderer.getMaxAnisotropy(),
			maxSamples: 4,
			gpu: gpuName,
		},
		effects: null,

		setSize(width, height, pixelRatio) {
			renderer.setPixelRatio(pixelRatio);
			renderer.setSize(width, height, false);
			pipeline.setSize(width * pixelRatio, height * pixelRatio);
		},

		configure(post) {
			pipeline.configure(post);
		},

		setShadowType(type) {
			const map = { basic: THREE.BasicShadowMap, pcf: THREE.PCFShadowMap, pcfsoft: THREE.PCFSoftShadowMap, vsm: THREE.VSMShadowMap };
			renderer.shadowMap.type = map[type];
		},

		/** Benchmark bursts render without yielding, so timestamp queries could not be resolved in time. */
		/** Display-space 3D LUT ({ texture, size } from core/lut.js) or null. */
		setLut(lut) {
			pipeline.setLut(lut);
		},

		setTimestampTracking(on) {
			timestampsPaused = !on;
			if (hasTimestamps && isWebGPU) renderer.backend.trackTimestamp = on;
		},

		setShadowsEnabled(on) {
			renderer.shadowMap.enabled = on;
			pipelineWorld?.scene.traverse((o) => o.material && (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)));
		},

		/** Channel views come from extra MRT attachments of the scene pass (rebuilds the graph). */
		setDebugChannel(index) {
			pipeline.setPassthrough(index);
		},

		prepareObject(root) {
			// Built-in materials are converted to node materials by the renderer; only tag the program key.
			tagMaterials(root);
		},

		render(world, delta, elapsed) {
			pipelineWorld = world;
			// three advances its node frame (FRAME-type updates: transmission backdrop copies, TRAA
			// history, node time) only in its own rAF tick. Frames rendered outside it — benchmark bursts,
			// test captures — must advance it themselves or those nodes go stale.
			const nodeFrame = renderer._nodes?.nodeFrame;
			if (nodeFrame) {
				if (nodeFrame.frameId === lastNodeFrame) nodeFrame.update();
				lastNodeFrame = nodeFrame.frameId;
			}
			backend.effects.update(elapsed);
			backend.effects.setCamera(world.camera);
			pipeline.render(world);
			if (timestampsPaused) return; // untimed frames (benchmark bursts) must not dilute the average
			frame++;
			// resolveTimestampsAsync returns the summed GPU time of every pass since the previous
			// resolve, so divide by the number of frames it covers. Compute passes (the GPU particle
			// field) have their own query pool; it is resolved only when it holds new queries, because
			// an empty pool returns its previous total again.
			if (hasTimestamps && !resolving) {
				resolving = true;
				const frames = frame - lastResolvedFrame;
				lastResolvedFrame = frame;
				const computePool = renderer.backend.timestampQueryPool?.[THREE.TimestampQuery.COMPUTE];
				Promise.all([
					renderer.resolveTimestampsAsync(THREE.TimestampQuery.RENDER),
					computePool?.currentQueryIndex > 0 ? renderer.resolveTimestampsAsync(THREE.TimestampQuery.COMPUTE) : 0,
				]).then(([renderMs, computeMs]) => {
					resolving = false;
					const value = ((Number(renderMs) || 0) + (Number(computeMs) || 0)) / Math.max(1, frames);
					if (Number.isFinite(value) && value > 0) {
						gpuTotal = gpuTotal === null ? value : gpuTotal + (value - gpuTotal) * 0.15;
						gpuRaw = value;
						gpuSerial++;
					}
				}).catch(() => (resolving = false));
			}
		},

		initRectAreaLights() {
			THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init());
		},

		envFromScene(scene, sigma = 0.04) {
			return getPmrem().fromScene(scene, sigma).texture;
		},

		envFromEquirect(texture) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			return texture;
		},

		timings() {
			return { total: hasTimestamps ? gpuTotal : null, passes: [], raw: hasTimestamps ? gpuRaw : null, serial: gpuSerial };
		},

		info() {
			const i = renderer.info;
			return {
				calls: i.render.drawCalls,
				triangles: i.render.triangles,
				points: i.render.points,
				lines: i.render.lines,
				geometries: i.memory.geometries,
				textures: i.memory.textures,
				programs: null,
			};
		},

		resetInfo() {
			renderer.info.reset();
		},

		async compile(scene, camera) {
			await renderer.compileAsync(scene, camera);
		},

		/** Resolves when the GPU has finished every submitted command. */
		sync() {
			return isWebGPU ? device.queue.onSubmittedWorkDone() : glFence(renderer.getContext());
		},

		/**
		 * Generated WGSL (or GLSL on the WebGL2 fallback) for `object`. Compiled for a direct render of the
		 * scene: the lab's scene pass adds MRT outputs (AO normals / debug channels) on top of this.
		 */
		async shaderSource(object, scene, camera) {
			const { vertexShader, fragmentShader } = await renderer.debug.getShaderAsync(scene, camera, object);
			const material = Array.isArray(object.material) ? object.material[0] : object.material;
			return { language: isWebGPU ? 'WGSL (generated)' : 'GLSL ES 3.00 (generated)', material: material?.name || material?.type, vertex: vertexShader, fragment: fragmentShader };
		},

		capture() {
			return renderer.domElement;
		},

		dispose() {
			pipeline.dispose();
			pmrem?.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		},
	};

	backend.effects = createTSLEffects(backend);
	backend.vfx = createTSLVfx(backend);
	if (window.__LAB__) window.__LAB__.tsl = { ...TSL_PLAYGROUND, TSL };
	return backend;
}

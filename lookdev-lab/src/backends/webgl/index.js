// WebGL2 backend: THREE.WebGLRenderer + GLSL (ShaderMaterial / onBeforeCompile patches).
import * as THREE from 'three';
import '../../shaders/chunks/index.js';
import { WebGLPipeline } from './pipeline.js';
import { WebGLGpuTimer } from './gpuTimer.js';
import { prepareMaterial, debugUniform, invalidatePatched, syncShadowTwins } from './patches.js';
import { glFence } from '../../core/gpuSync.js';
import { onAnyShaderEdit } from './hot.js';
import { createGLSLEffects } from './effects.js';
import { createGLSLVfx } from './vfx.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export async function createWebGLBackend({ container, onShaderError }) {
	const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.NoToneMapping; // display transform happens in the final pass
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setClearColor(0x000000, 1);
	container.appendChild(renderer.domElement);

	const gl = renderer.getContext();
	const timer = new WebGLGpuTimer(gl);
	const pipeline = new WebGLPipeline(renderer, timer);

	renderer.debug.onShaderError = (glContext, program, vertexShader, fragmentShader) => {
		const log = (shader) => glContext.getShaderInfoLog(shader)?.trim();
		const source = (shader) => glContext.getShaderSource(shader) || '';
		onShaderError?.({
			backend: 'webgl',
			program: glContext.getProgramInfoLog(program)?.trim(),
			vertex: { log: log(vertexShader), source: source(vertexShader) },
			fragment: { log: log(fragmentShader), source: source(fragmentShader) },
		});
	};

	let pmrem = null;
	const getPmrem = () => (pmrem ??= new THREE.PMREMGenerator(renderer));
	let worldRef = null;

	const backend = {
		kind: 'webgl',
		language: 'GLSL',
		renderer,
		pipeline,
		canvas: renderer.domElement,
		caps: {
			webgpu: false,
			compute: false,
			gpuTimer: timer.supported,
			maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
			maxSamples: renderer.capabilities.maxSamples,
			gpu: (() => {
				const ext = gl.getExtension('WEBGL_debug_renderer_info');
				return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
			})(),
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
			if (renderer.shadowMap.type !== map[type]) {
				renderer.shadowMap.type = map[type];
				worldRef?.scene.traverse((o) => o.material && (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)));
			}
		},

		/** Display-space 3D LUT ({ texture, size } from core/lut.js) or null. */
		setLut(lut) {
			pipeline.setLut(lut);
		},

		setTimestampTracking(on) {
			timer.enabled = on && timer.supported;
		},

		setShadowsEnabled(on) {
			renderer.shadowMap.enabled = on;
			worldRef?.scene.traverse((o) => o.material && (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)));
		},

		/** Channel views (albedo, normal, ...) come from a GLSL patch on every standard material. */
		setDebugChannel(index) {
			pipeline.showAO = index === 8;
			debugUniform.value = index === 8 ? 0 : index;
			pipeline.setPassthrough(index > 0);
		},

		prepareObject(root) {
			root.traverse((object) => {
				if (!object.material) return;
				for (const m of Array.isArray(object.material) ? object.material : [object.material]) prepareMaterial(m);
			});
			syncShadowTwins(root);
		},

		render(world, delta, elapsed) {
			worldRef = world;
			backend.effects.update(elapsed);
			pipeline.render(world, delta, elapsed);
		},

		initRectAreaLights() {
			RectAreaLightUniformsLib.init();
		},

		envFromScene(scene, sigma = 0.04) {
			return getPmrem().fromScene(scene, sigma).texture;
		},

		envFromEquirect(texture) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			return texture; // WebGLRenderer converts equirect environments to PMREM on demand
		},

		timings() {
			return timer.snapshot();
		},

		info() {
			const i = renderer.info;
			return {
				calls: i.render.calls,
				triangles: i.render.triangles,
				points: i.render.points,
				lines: i.render.lines,
				geometries: i.memory.geometries,
				textures: i.memory.textures,
				programs: i.programs?.length ?? 0,
			};
		},

		resetInfo() {
			renderer.info.reset();
		},

		/** Link every program `scene` needs before it is shown (otherwise each one stalls the frame it first appears in). */
		async compile(scene, camera) {
			if (!renderer.compileAsync) return;
			// Program keys depend on the bound target (linear output into the HDR buffer, sRGB on screen): compile
			// against the scene target so the cached programs are the ones render() asks for. The target only matters
			// for the synchronous part of compileAsync.
			const previous = renderer.getRenderTarget();
			renderer.setRenderTarget(pipeline.sceneRT);
			const done = renderer.compileAsync(scene, camera);
			renderer.setRenderTarget(previous);
			// compileAsync polls each program until it reports ready; a material recompiled meanwhile leaves it
			// polling a deleted program forever, so never wait longer than a few seconds.
			let timer = 0;
			await Promise.race([done, new Promise((resolve) => (timer = setTimeout(resolve, 4000)))]);
			clearTimeout(timer);
		},

		/** Resolves when the GPU has finished every submitted command. */
		sync() {
			return glFence(gl);
		},

		/** Final GLSL of the program last used by `object` (null before its first render). */
		async shaderSource(object) {
			const material = Array.isArray(object.material) ? object.material[0] : object.material;
			const program = material && renderer.properties.get(material).currentProgram;
			if (!program) return null;
			return {
				language: 'GLSL ES 3.00',
				material: material.name || material.type,
				vertex: gl.getShaderSource(program.vertexShader),
				fragment: gl.getShaderSource(program.fragmentShader),
			};
		},

		capture() {
			return renderer.domElement;
		},

		dispose() {
			pipeline.dispose();
			pmrem?.dispose();
			timer.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		},
	};

	renderer.info.autoReset = false;
	backend.effects = createGLSLEffects(backend);
	backend.vfx = createGLSLVfx(backend);
	onAnyShaderEdit(() => invalidatePatched());
	return backend;
}

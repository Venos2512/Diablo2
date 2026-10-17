// Renderer mode selection. Switching modes reloads the page (renderers cannot share GPU resources),
// so camera and UI state are stored in sessionStorage first.
export const RENDERER_MODES = {
	webgl: {
		id: 'webgl',
		label: 'WebGL2 · GLSL',
		short: 'WebGL2',
		detail: 'THREE.WebGLRenderer, shaders written in GLSL (ShaderMaterial / onBeforeCompile).',
	},
	webgpu: {
		id: 'webgpu',
		label: 'WebGPU · TSL',
		short: 'WebGPU',
		detail: 'THREE.WebGPURenderer on a WebGPU device, shaders written in TSL (compiled to WGSL).',
	},
	'webgpu-gl': {
		id: 'webgpu-gl',
		label: 'WebGPU renderer · WebGL2 backend',
		short: 'WGPU→GL2',
		detail: 'THREE.WebGPURenderer with forceWebGL: the same TSL compiled to GLSL. What players without WebGPU get.',
	},
};

const KEY = 'sanctuary-lookdev-lab:renderer';

export function resolveMode() {
	const params = new URLSearchParams(location.search);
	const fromUrl = params.get('renderer');
	if (fromUrl && RENDERER_MODES[fromUrl]) return fromUrl;
	try {
		const stored = localStorage.getItem(KEY);
		if (stored && RENDERER_MODES[stored]) return stored;
	} catch {
		/* storage blocked */
	}
	return 'webgl';
}

export function rememberMode(mode) {
	try {
		localStorage.setItem(KEY, mode);
	} catch {
		/* storage blocked */
	}
}

export function switchMode(mode, beforeReload) {
	if (!RENDERER_MODES[mode]) return;
	rememberMode(mode);
	beforeReload?.();
	const url = new URL(location.href);
	url.searchParams.set('renderer', mode);
	location.href = url.toString();
}

export async function createBackend(mode, options) {
	if (mode === 'webgl') {
		const { createWebGLBackend } = await import('../backends/webgl/index.js');
		return createWebGLBackend(options);
	}
	const { createWebGPUBackend } = await import('../backends/webgpu/index.js');
	return createWebGPUBackend({ ...options, forceWebGL: mode === 'webgpu-gl' });
}

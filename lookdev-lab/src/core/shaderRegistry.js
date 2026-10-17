// Registry for GLSL sources imported from src/shaders (see scripts/esbuild-plugins.mjs).
// Files under shaders/chunks/ are also published as THREE.ShaderChunk entries named `lab_<file>`,
// so any GLSL (ShaderMaterial or onBeforeCompile patch) can `#include <lab_noise>`.
// In dev mode the server pushes edited files here and every material that uses them recompiles.
import { ShaderChunk } from 'three';

const entries = new Map();
const listeners = new Set();
let version = 0;

function publishChunk(entry) {
	const match = entry.path.match(/^shaders\/chunks\/(.+)\.glsl$/);
	if (match) {
		entry.chunk = 'lab_' + match[1].replace(/[^\w]/g, '_');
		ShaderChunk[entry.chunk] = entry.code;
	}
}

export function defineShader(path, code) {
	let entry = entries.get(path);
	if (!entry) {
		entry = { path, code, original: code, version: 0, chunk: null };
		entries.set(path, entry);
		publishChunk(entry);
	}
	return entry;
}

/** Bumped on every hot update; used in program cache keys so recompiles happen even for chunk-only edits. */
export function shaderVersion() {
	return version;
}

/**
 * Replace a shader's source and recompile everything that uses it. `fromFile` (dev server push) also
 * makes it the new baseline that "Revert" goes back to; in-browser edits pass fromFile = false.
 */
export function hotUpdateShader(path, code, { fromFile = true } = {}) {
	const entry = entries.get(path);
	if (!entry) return false;
	entry.code = code;
	if (fromFile) entry.original = code;
	entry.version++;
	version++;
	publishChunk(entry);
	for (const fn of listeners) fn(entry);
	return true;
}

export function onShaderChange(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function listShaders() {
	return [...entries.values()];
}

export function getShader(path) {
	return entries.get(path) || null;
}

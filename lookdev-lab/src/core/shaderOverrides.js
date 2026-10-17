// In-browser GLSL edits (Shaders tab) kept per browser, so they survive a reload or a renderer switch.
// The files on disk stay untouched — download the edited file or paste it back into src/shaders.
import { hotUpdateShader, getShader } from './shaderRegistry.js';

const KEY = 'sanctuary-lookdev-lab:shader-overrides:v1';

export function readOverrides() {
	try {
		return JSON.parse(localStorage.getItem(KEY)) || {};
	} catch {
		return {};
	}
}

function write(map) {
	try {
		localStorage.setItem(KEY, JSON.stringify(map));
	} catch {
		/* storage blocked: edits only last for this page */
	}
}

/** Apply an edit now and remember it (code = null forgets it and restores the file version). */
export function setOverride(path, code) {
	const map = readOverrides();
	const entry = getShader(path);
	if (code === null || (entry && code === entry.original)) {
		delete map[path];
		if (entry) hotUpdateShader(path, entry.original, { fromFile: false });
	} else {
		map[path] = code;
		hotUpdateShader(path, code, { fromFile: false });
	}
	write(map);
}

/** The dev server pushed a new version of the file: it wins over a stored edit. */
export function dropOverride(path) {
	const map = readOverrides();
	if (!(path in map)) return;
	delete map[path];
	write(map);
}

/** Re-apply stored edits (call once the backend has registered its shaders). Returns applied paths. */
export function applyStoredOverrides() {
	const applied = [];
	for (const [path, code] of Object.entries(readOverrides())) {
		if (getShader(path) && hotUpdateShader(path, code, { fromFile: false })) applied.push(path);
	}
	return applied;
}

export function isOverridden(path) {
	return path in readOverrides();
}

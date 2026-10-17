// Hot-swap support for ShaderMaterials built from src/shaders (dev server pushes edits).
import { onShaderChange, shaderVersion } from '../../core/shaderRegistry.js';

const bound = new Set();
const globalListeners = new Set();

/** Keep `material` in sync with registry entries; chunk edits (lab_*) recompile every bound material. */
export function hotMaterial(material, vertexEntry, fragmentEntry) {
	const record = { material, vertexEntry, fragmentEntry };
	bound.add(record);
	material.defines ??= {};
	material.addEventListener('dispose', () => bound.delete(record));
	return material;
}

/** Called for any shader edit (used to recompile patched built-in materials). */
export function onAnyShaderEdit(fn) {
	globalListeners.add(fn);
	return () => globalListeners.delete(fn);
}

onShaderChange((entry) => {
	for (const record of bound) {
		const uses = entry.chunk || record.vertexEntry === entry || record.fragmentEntry === entry;
		if (!uses) continue;
		if (record.vertexEntry) record.material.vertexShader = record.vertexEntry.code;
		if (record.fragmentEntry) record.material.fragmentShader = record.fragmentEntry.code;
		record.material.defines.LAB_REV = shaderVersion();
		record.material.needsUpdate = true;
	}
	for (const fn of globalListeners) fn(entry);
});

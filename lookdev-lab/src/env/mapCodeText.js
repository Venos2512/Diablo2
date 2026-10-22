// The hashes of the engine / generator / painter source files, for the cache keys (AD 12 §4.14.4). The bundler turns each `?hash` import
// into the 28-hex-digit hash of that file's text, computed at build time (esbuild-plugins.mjs: hashPlugin; only the hash is shipped, not the
// source), so the scene knows the files it was built from. Node scripts hash the same files with readFileSync (scripts/map-tools.mjs
// codeHashOnDisk) and scripts/map-modules.test.mjs proves the two agree by bundling this file.
// Browser / bundle only (a plain node import cannot resolve `?hash`).
import biomeLayout from './biomeLayout.js?hash';
import biomePlacement from './biomePlacement.js?hash';
import biomeCatalog from './biomeCatalog.js?hash';
import biomeLayoutDemo from './biomeLayoutDemo.js?hash';
import planGen from './planGen.js?hash';
import planGenZones from './planGenZones.js?hash';
import mapModules from './mapModules.js?hash';
import kit from './kit.js?hash';
import terrain from './terrain.js?hash';
import scene from '../scenes/biomeLayout.js?hash';
import { CODE_FILES, codeHash } from './mapModules.js';

/** Path from `src/` → hash of the file's text; exactly the files of CODE_FILES. */
export const CODE_HASHES = Object.freeze({
	'env/biomeLayout.js': biomeLayout,
	'env/biomePlacement.js': biomePlacement,
	'env/biomeCatalog.js': biomeCatalog,
	'env/biomeLayoutDemo.js': biomeLayoutDemo,
	'env/planGen.js': planGen,
	'env/planGenZones.js': planGenZones,
	'env/mapModules.js': mapModules,
	'env/kit.js': kit,
	'env/terrain.js': terrain,
	'scenes/biomeLayout.js': scene,
});

/** `code` for a key: the hash of the files of the named CODE_FILES groups ('layout', 'generator', 'splat'), in that order. */
export function codeOf(groups) {
	return codeHash(groups.flatMap((g) => CODE_FILES[g]).map((f) => {
		if (typeof CODE_HASHES[f] !== 'string') throw new Error(`mapCodeText: no hash for ${f}`);
		return CODE_HASHES[f];
	}));
}

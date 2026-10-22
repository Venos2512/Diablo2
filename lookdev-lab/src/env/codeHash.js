// Hash of source text for the map cache keys (AD 12 §4.14.4). Renderer-free and dependency-free: the same functions run in the bundle,
// in node scripts (scripts/map-tools.mjs) and in the esbuild `?hash` plugin (scripts/esbuild-plugins.mjs), which is what makes the three agree.

/** 53-bit string hash (cyrb53) as 14 hex digits. */
export function hash53(text, seed = 0) {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0; i < text.length; i++) {
		const c = text.charCodeAt(i);
		h1 = Math.imul(h1 ^ c, 2654435761);
		h2 = Math.imul(h2 ^ c, 1597334677);
	}
	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
	return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Two seeds → 28 hex digits. */
export const hashPair = (text) => `${hash53(text)}${hash53(text, 0x9e3779b9)}`;

/** Hash of one file's source text; a BOM and CRLF / CR line endings are normalised away. -> 28 hex digits. */
export const fileHash = (text) => hashPair(String(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n'));

/** The `code` of a key: the hash of the files' hashes, in the caller's order (so file boundaries count). -> 28 hex digits. */
export const codeHash = (fileHashes) => hashPair(fileHashes.join('|'));

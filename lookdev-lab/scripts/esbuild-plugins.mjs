// Shared esbuild plugins for dev and production builds.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileHash } from '../src/env/codeHash.js';

const toPosix = (p) => p.split(path.sep).join('/');

/**
 * Turns `import x from './foo.glsl'` into a registry entry `{ path, code }`.
 * GLSL files live in a private namespace so esbuild's own watcher ignores them;
 * the dev server watches src/shaders itself and hot-swaps shaders without a reload.
 */
export function glslPlugin(root) {
	const registry = toPosix(path.join(root, 'src/core/shaderRegistry.js'));
	return {
		name: 'lab-glsl',
		setup(build) {
			build.onResolve({ filter: /\.glsl$/ }, (args) => ({
				path: path.resolve(args.resolveDir, args.path),
				namespace: 'lab-glsl',
			}));
			build.onLoad({ filter: /.*/, namespace: 'lab-glsl' }, async (args) => {
				const code = await readFile(args.path, 'utf8');
				const rel = toPosix(path.relative(path.join(root, 'src'), args.path));
				return {
					contents: `import { defineShader } from ${JSON.stringify(registry)};\nexport default defineShader(${JSON.stringify(rel)}, ${JSON.stringify(code)});\n`,
					loader: 'js',
					resolveDir: path.dirname(args.path),
				};
			});
		},
	};
}

/**
 * `import text from './file.js?raw'` → the file's source as a string (the Shaders tab shows the
 * GLSL glue and TSL code of each effect from it; works in the offline single-file build too).
 */
export function rawPlugin() {
	return {
		name: 'lab-raw',
		setup(build) {
			build.onResolve({ filter: /\?raw$/ }, (args) => ({
				path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
				namespace: 'lab-raw',
			}));
			build.onLoad({ filter: /.*/, namespace: 'lab-raw' }, async (args) => ({
				contents: await readFile(args.path, 'utf8'),
				loader: 'text',
				watchFiles: [args.path],
			}));
		},
	};
}

/**
 * `import h from './file.js?hash'` → the 28-hex-digit hash of the file's source text (BOM / CRLF normalised, exactly like the node side:
 * src/env/codeHash.js `fileHash`), and nothing else: the map cache keys (env/mapCodeText.js) need the hash, not 370 KB of source.
 */
export function hashPlugin() {
	return {
		name: 'lab-hash',
		setup(build) {
			build.onResolve({ filter: /\?hash$/ }, (args) => ({
				path: path.resolve(args.resolveDir, args.path.replace(/\?hash$/, '')),
				namespace: 'lab-hash',
			}));
			build.onLoad({ filter: /.*/, namespace: 'lab-hash' }, async (args) => ({
				contents: `export default ${JSON.stringify(fileHash(await readFile(args.path, 'utf8')))};`,
				loader: 'js',
				watchFiles: [args.path],
			}));
		},
	};
}

export function bundleOptions(root, { dev }) {
	return {
		entryPoints: { main: path.join(root, 'src/main.js') },
		bundle: true,
		format: 'iife',
		target: ['es2022'],
		minify: !dev,
		sourcemap: dev ? 'inline' : false,
		legalComments: dev ? 'none' : 'inline',
		define: { __DEV__: dev ? 'true' : 'false' },
		loader: { '.css': 'css', '.webp': 'dataurl' },
		logLevel: 'silent',
		plugins: [glslPlugin(root), rawPlugin(), hashPlugin()],
	};
}

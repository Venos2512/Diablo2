// Production build: one self-contained offline HTML (code, styles, shaders and sample assets embedded).
import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleOptions } from './esbuild-plugins.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const started = performance.now();

const result = await esbuild.build({ ...bundleOptions(root, { dev: false }), outdir: path.join(root, 'dist'), write: false, metafile: true });
if (result.errors.length) process.exit(1);
const out = (ext) => result.outputFiles.find((f) => f.path.endsWith(ext))?.text ?? '';
const js = out('.js').replace(/<\/script/gi, '<\\/script');
const css = out('.css');

const manifest = JSON.parse(await readFile(path.join(root, 'src/assets/samples.json'), 'utf8'));
const libs = path.join(root, 'node_modules/three/examples/jsm/libs');
const embeds = [
	...manifest.assets.map((entry) => [entry.file, path.join(root, 'assets', entry.file)]),
	// Decoders so Draco / KTX2 (Basis) compressed GLBs load offline too.
	['decoders/draco_wasm_wrapper.js', path.join(libs, 'draco/gltf/draco_wasm_wrapper.js')],
	['decoders/draco_decoder.wasm', path.join(libs, 'draco/gltf/draco_decoder.wasm')],
	['decoders/basis_transcoder.js', path.join(libs, 'basis/basis_transcoder.js')],
	['decoders/basis_transcoder.wasm', path.join(libs, 'basis/basis_transcoder.wasm')],
];
let assetTags = '';
let assetBytes = 0;
for (const [key, file] of embeds) {
	const data = await readFile(file);
	assetBytes += data.length;
	assetTags += `<script type="application/octet-stream" data-asset="${key}">${data.toString('base64')}</script>\n`;
}

const template = await readFile(path.join(root, 'src/index.html'), 'utf8');
const html = template
	.replace('<!--LAB:STYLE-->', () => `<style>${css}</style>`)
	.replace('<!--LAB:ASSETS-->', () => assetTags)
	.replace('<!--LAB:SCRIPT-->', () => `<script>${js}</script>`);

await mkdir(path.join(root, 'dist'), { recursive: true });
await writeFile(path.join(root, 'dist/index.html'), html);
await writeFile(path.join(root, '../Sanctuary_Lookdev_Lab.html'), html);

const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
console.log(`Built offline HTML ${mb(Buffer.byteLength(html))} (code ${mb(js.length)}, samples ${mb(assetBytes)}) in ${((performance.now() - started) / 1000).toFixed(1)} s`);
console.log('  dist/index.html');
console.log('  ../Sanctuary_Lookdev_Lab.html');

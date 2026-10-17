// Dev server: esbuild watch + live reload, CSS hot swap and GLSL hot swap (no page reload).
// Usage: npm run dev   (PORT=4174 by default)
import * as esbuild from 'esbuild';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleOptions } from './esbuild-plugins.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4174);
const outputs = new Map(); // basename -> { text, hash }
const clients = new Set();
let silentRebuild = false;
let lastError = null;

const MIME = {
	'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
	'.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
	'.hdr': 'application/octet-stream', '.exr': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ktx2': 'image/ktx2', '.wasm': 'application/wasm', '.cube': 'text/plain',
};

function broadcast(message) {
	const payload = `data: ${JSON.stringify(message)}\n\n`;
	for (const res of clients) res.write(payload);
}

function formatErrors(errors) {
	return errors.map((e) => {
		const loc = e.location ? `${e.location.file}:${e.location.line}:${e.location.column}\n  ${e.location.lineText}\n` : '';
		return `${loc}${e.text}`;
	}).join('\n\n');
}

const reporter = {
	name: 'lab-dev-reporter',
	setup(build) {
		build.onEnd((result) => {
			const silent = silentRebuild;
			silentRebuild = false;
			if (result.errors.length) {
				lastError = formatErrors(result.errors);
				console.error(`\n[lab] build failed\n${lastError}`);
				broadcast({ type: 'error', text: lastError });
				return;
			}
			const changed = new Set();
			for (const file of result.outputFiles || []) {
				const name = path.basename(file.path);
				const hash = createHash('sha1').update(file.contents).digest('hex');
				if (outputs.get(name)?.hash !== hash) changed.add(name);
				outputs.set(name, { text: file.text, hash });
			}
			const hadError = lastError !== null;
			lastError = null;
			if (hadError) broadcast({ type: 'ok' });
			if (silent || changed.size === 0) return;
			const onlyCss = [...changed].every((n) => n.endsWith('.css'));
			console.log(`[lab] rebuilt (${[...changed].join(', ')})`);
			broadcast({ type: onlyCss ? 'css' : 'reload' });
		});
	},
};

const options = bundleOptions(root, { dev: true });
const ctx = await esbuild.context({ ...options, outdir: path.join(root, '.dev'), write: false, plugins: [...options.plugins, reporter] });
await ctx.rebuild().catch(() => {});
await ctx.watch();

// GLSL hot swap: push new source to the page, then refresh the bundle silently so a later reload stays current.
const shaderDir = path.join(root, 'src/shaders');
const pending = new Map();
// On Windows fs.watch also fires when a file is only read (esbuild rebuilds, searches, antivirus). Each push
// recompiles every material using the chunk, so only push real edits.
const shaderText = new Map();
for (const entry of await readdir(shaderDir, { recursive: true, withFileTypes: true })) {
	if (!entry.isFile() || !entry.name.endsWith('.glsl')) continue;
	const file = path.join(entry.parentPath ?? entry.path, entry.name);
	shaderText.set(path.relative(shaderDir, file), await readFile(file, 'utf8'));
}
watch(shaderDir, { recursive: true }, (event, filename) => {
	if (!filename || !filename.endsWith('.glsl')) return;
	clearTimeout(pending.get(filename));
	pending.set(filename, setTimeout(async () => {
		pending.delete(filename);
		try {
			const code = await readFile(path.join(shaderDir, filename), 'utf8');
			if (shaderText.get(filename) === code) return;
			shaderText.set(filename, code);
			const rel = 'shaders/' + filename.split(path.sep).join('/');
			console.log(`[lab] shader ${rel}`);
			broadcast({ type: 'glsl', path: rel, code });
			silentRebuild = true;
			await ctx.rebuild().catch(() => {});
		} catch (err) {
			console.warn('[lab] shader read failed', err.message);
		}
	}, 60));
});

async function devHtml() {
	const template = await readFile(path.join(root, 'src/index.html'), 'utf8');
	const client = `<script>(function(){var es=new EventSource('/__events');es.onmessage=function(e){var m=JSON.parse(e.data),lab=window.__LAB__;
if(m.type==='reload'){if(lab&&lab.saveSession)lab.saveSession();location.reload();}
else if(m.type==='css'){var l=document.getElementById('lab-css');if(l)l.href='/main.css?'+Date.now();}
else if(m.type==='glsl'){if(lab&&lab.hotShader)lab.hotShader(m.path,m.code);}
else if(m.type==='error'){if(lab&&lab.buildError)lab.buildError(m.text);else console.error(m.text);}
else if(m.type==='ok'){if(lab&&lab.buildError)lab.buildError(null);}};})();</script>`;
	return template
		.replace('<!--LAB:STYLE-->', () => '<link rel="stylesheet" href="/main.css" id="lab-css">')
		.replace('<!--LAB:ASSETS-->', () => '<script>window.__LAB_DEV__=true;</script>')
		.replace('<!--LAB:SCRIPT-->', () => `<script src="/main.js"></script>${client}`);
}

http.createServer(async (req, res) => {
	const url = decodeURIComponent((req.url || '/').split('?')[0]);
	try {
		if (url === '/__events') {
			res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
			res.write(': connected\n\n');
			if (lastError) res.write(`data: ${JSON.stringify({ type: 'error', text: lastError })}\n\n`);
			clients.add(res);
			req.on('close', () => clients.delete(res));
			return;
		}
		if (url === '/' || url === '/index.html') {
			res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
			res.end(await devHtml());
			return;
		}
		const name = url.slice(1);
		if (outputs.has(name)) {
			res.writeHead(200, { 'Content-Type': MIME[path.extname(name)], 'Cache-Control': 'no-store' });
			res.end(outputs.get(name).text);
			return;
		}
		if (url.startsWith('/decoders/')) {
			const name = path.basename(url);
			const libs = path.join(root, 'node_modules/three/examples/jsm/libs');
			const file = name.startsWith('draco') ? path.join(libs, 'draco/gltf', name) : path.join(libs, 'basis', name);
			res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
			res.end(await readFile(file));
			return;
		}
		if (url.startsWith('/assets/')) {
			const file = path.join(root, url);
			if (!file.startsWith(path.join(root, 'assets'))) throw Object.assign(new Error('forbidden'), { code: 403 });
			await stat(file);
			res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
			res.end(await readFile(file));
			return;
		}
		res.writeHead(404);
		res.end('Not found');
	} catch (err) {
		res.writeHead(err.code === 403 ? 403 : 404);
		res.end(err.code === 403 ? 'Forbidden' : 'Not found');
	}
}).listen(port, '127.0.0.1', () => {
	console.log(`\n  Sanctuary Lookdev Lab (dev)  http://127.0.0.1:${port}\n`);
	console.log('  ?renderer=webgl | webgpu | webgpu-gl     GLSL edits in src/shaders hot-swap without reload\n');
});

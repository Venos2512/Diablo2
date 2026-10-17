// Serves the single-page build. Only "/" (and "/index.html") answer — no directory listing, no other
// file on the machine is reachable — so it is safe to expose through a tunnel or on the LAN.
//
//   npm start                                   dist/index.html on http://127.0.0.1:4175
//   node scripts/serve.mjs --host 0.0.0.0       also reachable from the LAN
//   node scripts/serve.mjs --file ../Sanctuary_Lookdev_Lab.html --port 8080
//
// Without a dist/ build it falls back to ../Sanctuary_Lookdev_Lab.html (the offline file). The page is
// gzipped once in memory (about 70 % of the size over the wire) and revalidated with an ETag.
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES = [path.join(here, '../dist/index.html'), path.join(here, '../../Sanctuary_Lookdev_Lab.html')];

export async function resolvePage(file) {
	for (const candidate of file ? [path.resolve(file)] : CANDIDATES) {
		try {
			if ((await stat(candidate)).isFile()) return candidate;
		} catch {
			/* next */
		}
	}
	return null;
}

export function lanAddresses() {
	return Object.values(os.networkInterfaces())
		.flat()
		.filter((a) => a && a.family === 'IPv4' && !a.internal)
		.map((a) => a.address);
}

/** Start the server; resolves { server, port, host, file } once listening. */
export async function startServer({ host = '127.0.0.1', port = 4175, file = null } = {}) {
	const page = await resolvePage(file);
	if (!page) throw new Error('No page to serve: run `npm run build`, or pass --file <path to Sanctuary_Lookdev_Lab.html>.');
	let cache = null;
	const load = async () => {
		const info = await stat(page);
		if (cache && cache.mtime === info.mtimeMs) return cache;
		const raw = await readFile(page);
		cache = { mtime: info.mtimeMs, raw, gzip: zlib.gzipSync(raw, { level: 6 }), etag: `"${crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16)}"` };
		return cache;
	};
	await load();
	const server = http.createServer(async (req, res) => {
		const url = (req.url || '/').split('?')[0];
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			res.writeHead(405, { Allow: 'GET, HEAD' });
			res.end();
			return;
		}
		if (url !== '/' && url !== '/index.html') {
			res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end('Not found');
			return;
		}
		try {
			const page = await load();
			const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', ETag: page.etag, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
			if (req.headers['if-none-match'] === page.etag) {
				res.writeHead(304, headers);
				res.end();
				return;
			}
			const gzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
			const body = gzip ? page.gzip : page.raw;
			res.writeHead(200, { ...headers, 'Content-Length': body.length, ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}) });
			res.end(req.method === 'HEAD' ? undefined : body);
		} catch (error) {
			res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
			res.end(String(error.message || error));
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(port, host, resolve);
	});
	return { server, port: server.address().port, host, file: page, size: cache.raw.length, gzipSize: cache.gzip.length };
}

export function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--host') args.host = argv[++i];
		else if (a === '--port') args.port = Number(argv[++i]);
		else if (a === '--file') args.file = argv[++i];
		else if (a === '--lan') args.host = '0.0.0.0';
	}
	return args;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	const args = parseArgs(process.argv.slice(2));
	const mb = (n) => (n / 1048576).toFixed(1) + ' MB';
	try {
		const s = await startServer({ port: Number(process.env.PORT) || 4175, ...args });
		console.log(`Sanctuary Lookdev Lab · ${path.basename(s.file)} (${mb(s.size)}, ${mb(s.gzipSize)} gzipped)`);
		console.log(`  http://127.0.0.1:${s.port}`);
		if (s.host === '0.0.0.0') {
			for (const ip of lanAddresses()) console.log(`  http://${ip}:${s.port}   (LAN — WebGPU needs https, LAN viewers get WebGL2)`);
		}
	} catch (error) {
		console.error(error.message || error);
		process.exit(1);
	}
}

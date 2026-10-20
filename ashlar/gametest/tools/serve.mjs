// Dev server (127.0.0.1 only):  node tools/serve.mjs [port=8765]
//   /                  source/index.html          edit a file under source/, reload the page: no build step
//   /js/bundle.js      the files of source/js/manifest.json concatenated in order (ONE module, as in the build)
//   /<anything else>   static file under source/ (css, fonts, assets/ashlar/terrain/*, assets/ashlar/kits/*)
//   /dist/<file>       dist/<file>                 e.g. /dist/gametest.html
//   /orig              src/Unhallowed.html         the untouched original
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'source');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary' };

export function bundle(dir = sourceDir) {
  const { files } = JSON.parse(fs.readFileSync(path.join(dir, 'js', 'manifest.json'), 'utf8'));
  return files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
}

function send(res, code, type, body) {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

function within(base, rel) {
  const p = path.normalize(path.join(base, rel));
  return p.startsWith(base + path.sep) || p === base ? p : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] ?? 8765);
  http.createServer((req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (url === '/js/bundle.js') return send(res, 200, mime['.js'], bundle());
      if (url === '/orig') return send(res, 200, mime['.html'], fs.readFileSync(path.join(root, 'src', 'Unhallowed.html')));
      const file = url.startsWith('/dist/') ? within(path.join(root, 'dist'), url.slice(6)) : within(sourceDir, url === '/' ? 'index.html' : url.slice(1));
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'text/plain', 'not found');
      send(res, 200, mime[path.extname(file)] ?? 'application/octet-stream', fs.readFileSync(file));
    } catch (e) {
      send(res, 500, 'text/plain', String(e));
    }
  }).listen(port, '127.0.0.1', () => console.log(`serving http://127.0.0.1:${port}/  (source/, /dist/, /orig)`));
}

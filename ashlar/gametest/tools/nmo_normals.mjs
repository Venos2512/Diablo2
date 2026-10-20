#!/usr/bin/env node
// Drives the real NormalMap-Online web app (https://cpetry.github.io/NormalMap-Online/) in headless
// Chrome over CDP and reads its normal map back at full resolution. Nothing is re-implemented here:
// the image goes in through the page's own <input type=file id=select_file_height> handler, the
// settings through its own DOM inputs / NMO_NormalMap.setNormalSetting, and the pixels come from
// the page's WebGL framebuffer (gl.readPixels right after NMO_RenderNormalview.renderNormalView()).
//
// usage: node nmo_normals.mjs [--assets <terrain dir>] [--out <dir>] [--install] [--jobs jobs.json]
//                              [--site <url>] [--chrome <chrome.exe>] [--layers grass,dirt,...]
// Node >= 22 (global WebSocket, zlib.crc32). Own random debugging port, temp profile, --headless=new.
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import zlib from 'node:zlib';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const SITE = arg('site', 'https://cpetry.github.io/NormalMap-Online/');
const ASSETS = resolve(arg('assets', fileURLToPath(new URL('../source/assets/ashlar/terrain', import.meta.url))));
const OUT = resolve(arg('out', join(tmpdir(), 'gametest-nmo')));
const CHROME = arg('chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const GL = arg('gl', 'default');   // default = Chrome's own choice (real GPU via ANGLE). 'swiftshader' = software GL: it garbles the outer 2 px of every border, do not use.
const PAD = +arg('pad', 16);   // periodic padding (px) fed around the tile, cropped off again; 0 = feed the file untouched through the file input
const LAYERS = arg('layers', 'grass,dirt,mud,cobble').split(',');

// ---- site settings --------------------------------------------------------------------------
// Site defaults (read from normalMap.js / index.html, re-read from the live DOM at run time):
//   strength 2.5 (0.01..5), level 7 (4..10), blur/sharp 0 (-32..32), filter Sobel, invert R/G/Height off, "-1 to +1" on.
// The shader builds N = normalize(dx*255, dy*255, dz) with dz = (1+2^level)/strength, dx/dy = 8-bit
// Sobel (or Scharr) of the red channel.  The game's Kh() builds N = normalize(-Gx*s, -Gy*s, 1) on a
// 0..1 height, so   strength = s * (1 + 2^level) / 255   reproduces a game strength s exactly.
// "invert Height" flips R and G together; with it ON the site's sign matches the game's Kh().
const SITE_DEFAULTS = { strength: 2.5, level: 7, blur: 0, type: 'sobel', invR: false, invG: false, invH: false, heightOffset: true };
const GAME_S = { grass: 0.1999, dirt: 0.2068, mud: 0.4103, cobble: 0.2986 }; // config.json normalStrength
const LEVEL = 4;                      // lowest level => strength numbers stay in a comfortable range
const strengthFor = (s) => +(s * (1 + 2 ** LEVEL) / 255).toFixed(5);

// Each job: one NMO render. source = 'height' | 'albedo' (the file that is given to the site).
// job.final => written to <out>/<final>.png, otherwise <out>/variants/<name>.png.
// Chosen finals (see params.json for the reasoning):
//   nmo-height : 2x the game's strength, blur -3  (clear relief, no pixel noise; the game's own x1 is kept as a variant)
//   nmo-albedo : the albedo goes through the same HeightMap path, so the site only sees its RED channel; the albedo is dark and
//                low-contrast, so its strength is scaled (ALBEDO_MULT x game strength) to land on the same RMS slope as nmo-height.
const FINAL_MULT = 2, FINAL_BLUR = -3;
const ALBEDO_MULT = { grass: 9.3, dirt: 21, mud: 13.6, cobble: 10.5 };   // measured: rms(nmo-height final) / (rms(albedo @ x1, blur -3) per unit strength)
function defaultJobs() {
  const jobs = [];
  for (const layer of LAYERS) {
    const s = GAME_S[layer], am = ALBEDO_MULT[layer];
    const base = { layer, level: LEVEL, type: 'sobel', invR: false, invG: false, invH: true, heightOffset: true };
    const add = (source, name, mult, blur, final) => jobs.push({ ...base, source, name, ...(final ? { final: name } : {}), gameS: +(s * mult).toFixed(4), strength: strengthFor(s * mult), blur });
    add('height', `${layer}.nmo-height`, FINAL_MULT, FINAL_BLUR, true);
    add('albedo', `${layer}.nmo-albedo`, am, FINAL_BLUR, true);
    add('height', `${layer}.nmo-height.x1`, 1, 0);            // exactly the game's current strength, no blur (drop-in)
    add('height', `${layer}.nmo-height.x2`, 2, 0);
    add('height', `${layer}.nmo-height.x3b`, 3, -3);
    add('albedo', `${layer}.nmo-albedo.x1`, 1, 0);            // game strength: nearly flat
    add('albedo', `${layer}.nmo-albedo.m`, am, 0);            // matched strength, no blur: noisy
    add('albedo', `${layer}.nmo-albedo.mb6`, am, -6);         // matched strength, heavier blur
  }
  return jobs;
}
const JOBS = arg('jobs') ? JSON.parse(readFileSync(arg('jobs'), 'utf8')) : defaultJobs();

// ---- PNG writer (RGB 8-bit) ----------------------------------------------------------------
function pngRGB(w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// ---- Chrome / CDP ---------------------------------------------------------------------------
const freePort = () => new Promise((res) => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let chrome, profile;
function killChrome() {
  if (chrome && chrome.pid) { try { execFileSync('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* already gone */ } }
  if (profile) { try { rmSync(profile, { recursive: true, force: true, maxRetries: 5 }); } catch { /* ignore */ } }
}
process.on('exit', killChrome);

async function launch() {
  const port = await freePort();
  profile = mkdtempSync(join(tmpdir(), 'nmo-chrome-'));
  chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--window-size=1400,1000', '--ignore-gpu-blocklist',
    ...(GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : GL === 'default' ? [] : [`--use-angle=${GL}`]), 'about:blank'], { stdio: 'ignore', windowsHide: true });
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) break; } catch { /* not yet */ }
    await sleep(200);
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
    else listeners.forEach((l) => l(d));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, timeout: 120000 });
    if (r.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  return { send, evaluate, listeners };
}

async function waitFor(evaluate, expr, what, ms = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (await evaluate(expr)) return; } catch { /* page still loading */ } await sleep(150); }
  throw new Error('timeout waiting for ' + what);
}

async function loadSite(c) {
  await c.send('Page.enable'); await c.send('DOM.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: SITE });
  await waitFor(c.evaluate, `typeof NMO_RenderNormalview !== 'undefined' && !!NMO_RenderNormalview.composer_Normalview && !!document.getElementById('select_file_height')`, 'site init');
  await sleep(500);
  // count completions of the page's own image loader
  await c.evaluate(`window.__loaded = 0; (function(){ const o = NMO_FileDrop.loadHeightmap; NMO_FileDrop.loadHeightmap = function(s){ return o.call(this, s).then(() => { window.__loaded++; }); }; })(); true`);
}

async function giveImage(c, file) {
  const before = await c.evaluate('window.__loaded');
  if (PAD > 0) {
    // The site's shader already wraps at the border, but its outermost 2 px per side deviate a little on real GPUs.
    // So hand it the tile wrapped with PAD px of periodic padding on every side (via the page's own loadHeightmap) and crop afterwards.
    const ext = file.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/png';
    const b64 = readFileSync(file).toString('base64');
    await c.evaluate(`(async function(){
      const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:${ext};base64,${b64}'; });
      const n = img.naturalWidth, p = ${PAD}, cv = document.createElement('canvas'); cv.width = cv.height = n + 2 * p;
      const g = cv.getContext('2d', { colorSpaceConversion: 'none' });
      for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) g.drawImage(img, p + tx * n, p + ty * n);
      NMO_FileDrop.loadHeightmap(cv.toDataURL('image/png'));
      return true; })()`);
  } else {
    const doc = await c.send('DOM.getDocument', { depth: 1 });
    const { nodeId } = await c.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#select_file_height' });
    await c.send('DOM.setFileInputFiles', { files: [file], nodeId });
  }
  await waitFor(c.evaluate, `window.__loaded > ${before}`, 'image load');
  await sleep(300);
}

async function applySettings(c, j) {
  await c.evaluate(`(function(j){
    const $ = (id) => document.getElementById(id);
    $('strength_nmb').value = j.strength; $('level_nmb').value = j.level; $('blur_sharp_nmb').value = j.blur;
    $('normal_type').value = j.type;
    for (const [id, want] of [['invert_r', j.invR], ['invert_g', j.invG], ['invert_height', j.invH], ['height_offset', j.heightOffset]])
      if ($(id).checked !== !!want) $(id).click();       // same handler the UI uses
    NMO_NormalMap.setNormalSetting('type', j.type);
    NMO_NormalMap.setNormalSetting('strength', j.strength);
    NMO_NormalMap.setNormalSetting('level', j.level);
    NMO_NormalMap.setNormalSetting('blur_sharp', j.blur);
    return true; })(${JSON.stringify(j)})`);
}

// Render once more and read the default framebuffer in the same task (drawing buffer is still valid).
async function readNormal(c) {
  return await c.evaluate(`(async function(){
    NMO_RenderNormalview.renderNormalView();
    const r = NMO_RenderNormalview.renderer_Normalview, gl = r.getContext();
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const rgb = new Uint8Array(w * h * 3); let amin = 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {          // flip: GL origin is bottom-left
      const s = ((h - 1 - y) * w + x) * 4, d = (y * w + x) * 3;
      rgb[d] = px[s]; rgb[d + 1] = px[s + 1]; rgb[d + 2] = px[s + 2]; if (px[s + 3] < amin) amin = px[s + 3];
    }
    const img = NMO_FileDrop.height_image;
    const durl = await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(new Blob([rgb])); });
    return { w, h, natW: img.naturalWidth, natH: img.naturalHeight, alphaMin: amin, b64: durl.slice(durl.indexOf(',') + 1) };
  })()`);
}

async function siteInfo(c) {
  return await c.evaluate(`({
    ua: navigator.userAgent, title: document.title,
    defaultsInPage: { strength: NMO_NormalMap.getInitialStrength(), level: NMO_NormalMap.getInitialLevel(), blur: NMO_NormalMap.getInitialSmoothing(),
                      type: NMO_NormalMap.getInitialNormalType(), invertRGS: NMO_NormalMap.getInitialInvertRGS(), heightOffset: NMO_NormalMap.getInitialHeightOffset() },
    sliderRanges: { strength: ['strength_slider'].map(i => { const e = document.getElementById(i); return e ? [e.min, e.max, e.step] : null; })[0],
                    level: (() => { const e = document.getElementById('level_slider'); return e ? [e.min, e.max, e.step] : null; })(),
                    blur: (() => { const e = document.getElementById('blur_sharp_slider'); return e ? [e.min, e.max, e.step] : null; })() },
    filters: [...document.getElementById('normal_type').options].map(o => o.value),
    gl: (() => { const g = NMO_RenderNormalview.renderer_Normalview.getContext(); const d = g.getExtension('WEBGL_debug_renderer_info'); return { renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER), maxTex: g.getParameter(g.MAX_TEXTURE_SIZE) }; })()
  })`);
}

// ---- main -----------------------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'variants'), { recursive: true });
const c = await launch();
const results = [];
let info = null;
try {
  const bySource = new Map();
  for (const j of JOBS) { const key = `${j.layer}|${j.source}`; if (!bySource.has(key)) bySource.set(key, []); bySource.get(key).push(j); }
  for (const [key, jobs] of bySource) {
    const [layer, source] = key.split('|');
    const file = join(ASSETS, source === 'height' ? `${layer}.height.png` : `${layer}.albedo.webp`).replace(/\//g, '\\');
    if (!existsSync(file)) throw new Error('missing ' + file);
    await loadSite(c);                       // fresh page per input => no state leaks between inputs
    if (!info) info = await siteInfo(c);
    await giveImage(c, file);
    for (const j of jobs) {
      await applySettings(c, j);
      await sleep(150);
      const r = await readNormal(c);
      if (r.w !== r.natW || r.h !== r.natH) throw new Error(`${j.name}: output ${r.w}x${r.h} != input ${r.natW}x${r.natH}`);
      if (r.alphaMin !== 255) console.warn(`${j.name}: alpha min ${r.alphaMin} (input has transparency?)`);
      let rgb = Buffer.from(r.b64, 'base64'), W = r.w - 2 * PAD, H = r.h - 2 * PAD;
      if (PAD > 0) {                                                // crop the padding off again
        const out = Buffer.alloc(W * H * 3);
        for (let y = 0; y < H; y++) rgb.copy(out, y * W * 3, ((y + PAD) * r.w + PAD) * 3, ((y + PAD) * r.w + PAD + W) * 3);
        rgb = out;
      }
      const png = pngRGB(W, H, rgb);
      const rel = j.final ? `${j.final}.png` : `variants/${j.name}.png`;
      writeFileSync(join(OUT, rel), png);
      results.push({ ...j, file: rel, width: W, height: H, pad: PAD, fedSize: r.w, alphaMin: r.alphaMin, input: file });
      console.log('wrote', rel, `${W}x${H} (fed ${r.w})`, `strength=${j.strength} level=${j.level} blur=${j.blur}`);
    }
  }
} finally {
  killChrome();
}
if (argv.includes('--install')) {   // finals -> the game's terrain dir as lossless WebP (2.3x smaller than PNG, bit-identical): <layer>.normal.webp (from the height map), <layer>.normal-albedo.webp (from the albedo). Needs python + Pillow.
  const py = 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", lossless=True, quality=100, method=6)';
  for (const layer of LAYERS) {
    execFileSync('python', ['-I', '-c', py, join(OUT, `${layer}.nmo-height.png`), join(ASSETS, `${layer}.normal.webp`)]);
    execFileSync('python', ['-I', '-c', py, join(OUT, `${layer}.nmo-albedo.png`), join(ASSETS, `${layer}.normal-albedo.webp`)]);
    console.log('installed', `${layer}.normal.webp`, `${layer}.normal-albedo.webp`);
  }
}
writeFileSync(join(OUT, 'nmo_run.json'), JSON.stringify({ site: SITE, date: new Date().toISOString(), siteDefaults: SITE_DEFAULTS, info, jobs: results }, null, 2));

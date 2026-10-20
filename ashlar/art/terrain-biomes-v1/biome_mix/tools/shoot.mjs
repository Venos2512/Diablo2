// Headless screenshots of the biome_mix viewer over the Chrome DevTools protocol (adapted from gametest/tools/cdp.mjs).
//   node shoot.mjs --port 9655 --base http://127.0.0.1:8791/biome_mix/ --out ../shots \
//        --shots "overview=;focus_marsh_village=sample=marsh_village;marsh_weights=sample=marsh_village&debug=weights" [--size 1600x900] [--eval "expr"]
// Start Chrome yourself (headless, unique port, temp profile):
//   chrome.exe --headless=new --use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --remote-debugging-port=9655 --user-data-dir=%TEMP%\bmix-cdp about:blank
// Per shot: navigate -> wait for window.__BIOME_MIX.ready (frames, not seconds) -> +90 frames -> screenshot <out>/<name>.png.
// Prints ready time, frame ms, texture count, errors and the console warnings/errors.
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const port = arg('port'), base = arg('base', 'http://127.0.0.1:8791/biome_mix/'), outDir = arg('out', 'shots');
const shots = String(arg('shots', 'overview=')).split(';').filter(Boolean).map((s) => { const i = s.indexOf('='); return [s.slice(0, i), s.slice(i + 1)]; });
const [W, H] = String(arg('size', '1600x900')).split('x').map(Number);
const evalExpr = arg('eval', null), preExpr = arg('pre', null); // pre: JS run on every page after ready, before the screenshot
if (!port) { console.error('usage: --port N [--base URL --out DIR --shots "name=query;..." --size WxH]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  else if (m.method === 'Runtime.consoleAPICalled') { if (['warning', 'error', 'assert'].includes(m.params.type)) logs.push(`[${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 600)); }
  else if (m.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 700));
  else if (m.method === 'Log.entryAdded' && ['warning', 'error'].includes(m.params.entry.level)) logs.push(`[log:${m.params.entry.level}] ${m.params.entry.text} ${m.params.entry.url ?? ''}`.slice(0, 500));
};
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

const report = [];
for (const [name, query] of shots) {
  const t0 = Date.now();
  await send('Page.navigate', { url: base + (query ? '?' + query : '') });
  let ok = false;
  for (let t = 0; t < 480; t++) {
    await sleep(250);
    if (await evalJs('!!(window.__BIOME_MIX && window.__BIOME_MIX.ready)').catch(() => false)) { ok = true; break; }
    const errs = await evalJs('window.__BIOME_MIX ? window.__BIOME_MIX.errors.length : -1').catch(() => -1);
    if (errs > 0) break;
  }
  const readyMs = Date.now() - t0;
  const f0 = await evalJs('window.__BIOME_MIX?.frames ?? 0').catch(() => 0);
  for (let t = 0; t < 300; t++) { await sleep(100); if ((await evalJs('window.__BIOME_MIX?.frames ?? 0').catch(() => 0)) >= f0 + 90) break; }
  if (preExpr) { await evalJs(preExpr).catch((e) => console.log('pre failed', e.message)); await sleep(700); }
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'));
  const d = await evalJs(`(() => { const d = window.__BIOME_MIX || {}; return JSON.stringify({ ready: d.ready, frames: d.frames, loaded: d.loaded, textures: d.textures, frameMs: d.frameMs, drawCalls: d.drawCalls, errors: d.errors }); })()`).catch((e) => JSON.stringify({ error: e.message }));
  console.log(`shot ${name} ok=${ok} readyMs=${readyMs} ${d}`);
  report.push({ name, query, ok, readyMs, ...JSON.parse(d) });
}
const click = arg('click', null); // "x,y": real mouse click on the last page, then a screenshot named clicked.png
if (click) {
  const [cx, cy] = click.split(',').map(Number);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: cx, y: cy, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  await sleep(1500);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${outDir}/clicked.png`, Buffer.from(r.data, 'base64'));
  console.log('after click view =', await evalJs('window.__BIOME_MIX.view + " ready=" + window.__BIOME_MIX.ready'));
}
if (evalExpr) console.log('eval:', JSON.stringify(await evalJs(evalExpr).catch((e) => 'ERR ' + e.message)));
console.log('--- console (warnings/errors) ---'); console.log(logs.slice(0, 60).join('\n') || '(none)');
fs.writeFileSync(`${outDir}/shots_report.json`, JSON.stringify({ report, console: logs }, null, 2));
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
process.exit(0);

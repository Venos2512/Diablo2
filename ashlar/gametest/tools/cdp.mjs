// Headless screenshot driver over the Chrome DevTools protocol.
//   node tools/cdp.mjs --port 9611 --url http://127.0.0.1:8765/?ashlar=off --out shots --suffix off --states title,town,active-play
//        [--seed 42] [--freeze] [--size 1600x900] [--tune '{"strengthMul":1.5}'] [--settle 4000] [--names title=title,fields=fields]
//
// Start Chrome yourself (headless, unique port, temp profile), e.g.
//   chrome.exe --headless=new --use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --remote-debugging-port=9611 --user-data-dir=%TEMP%\uh-cdp about:blank
// For every state: seed(n) -> setState(state) -> wait -> [freeze] -> screenshot <out>/<state>-<suffix>.png.
// Prints boot time, window.__UNHALLOWED__.sources, window.__ASHLAR, window.__ASHLAR_KITS, renderer calls/triangles per state and the console (warnings/errors).
// Writes <out>/<suffix>.json with the same data.
import fs from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || i + 1 >= process.argv.length ? true : process.argv[i + 1]); };
const port = arg('port'), pageUrl = arg('url'), outDir = arg('out', 'shots'), suffix = arg('suffix', 'shot');
const states = String(arg('states', '')).split(',').filter(Boolean);
const seed = Number(arg('seed', 42)), freeze = arg('freeze', false) === true, settle = Number(arg('settle', 4000));
const [W, H] = String(arg('size', '1600x900')).split('x').map(Number);
const tune = arg('tune', null), evalExpr = arg('eval', null);
if (!port || !pageUrl) { console.error('usage: --port N --url URL [--out DIR --suffix S --states a,b ...]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const logs = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  else if (m.method === 'Runtime.consoleAPICalled') { if (['warning', 'error', 'assert'].includes(m.params.type)) logs.push(`[${m.params.type}] ` + m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500)); }
  else if (m.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 700));
  else if (m.method === 'Log.entryAdded' && ['warning', 'error'].includes(m.params.entry.level)) logs.push(`[log:${m.params.entry.level}] ${m.params.entry.text} ${m.params.entry.url ?? ''}`.slice(0, 500));
};
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
if (tune) await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__ASHLAR_TUNE = ${tune};` });

const t0 = Date.now();
await send('Page.navigate', { url: pageUrl });
let booted = false;
for (let t = 0; t < 480; t++) { await sleep(250); if (await evalJs('!!(window.__UNHALLOWED__ && window.__THREE_GAME_TEST_HOOKS__)').catch(() => false)) { booted = true; break; } }
const bootMs = Date.now() - t0;
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${outDir}/${name}-${suffix}.png`, Buffer.from(r.data, 'base64')); };
const info = JSON.parse(await evalJs(`JSON.stringify({ sources: window.__UNHALLOWED__?.sources, ashlar: window.__ASHLAR ?? null, kits: window.__ASHLAR_KITS ?? null, href: location.href.slice(0, 90), protocol: location.protocol })`).catch((e) => JSON.stringify({ error: e.message })));
const result = { url: pageUrl, booted, bootMs, ...info, states: {} };
console.log('boot', booted, `${bootMs}ms`, JSON.stringify(info));
await sleep(2500);
if (!states.length) await shot('boot');
const hooks = 'window.__THREE_GAME_TEST_HOOKS__';
for (const st of states) {
  const t1 = Date.now();
  try {
    await evalJs(`(async()=>{ await ${hooks}.setPausedForScreenshot?.(false); await ${hooks}.setReducedMotion?.(false); await ${hooks}.seed(${seed}); await ${hooks}.setState(${JSON.stringify(st)}); })()`);
  } catch (e) { console.log('setState failed', st, e.message.slice(0, 300)); }
  await sleep(settle);
  if (freeze) { await evalJs(`(async()=>{ await ${hooks}.setReducedMotion?.(true); await ${hooks}.setPausedForScreenshot?.(true); })()`).catch((e) => console.log('freeze failed', e.message)); await sleep(1500); }
  const d = await evalJs(`JSON.stringify((()=>{ const r = window.__THREE_GAME_DIAGNOSTICS__?.renderer; return r ? { calls: r.calls, triangles: r.triangles } : null; })())`).catch(() => 'null');
  await shot(st);
  result.states[st] = JSON.parse(d);
  console.log('state', st, `${Date.now() - t1}ms`, d);
}
if (evalExpr) console.log('eval:', JSON.stringify(await evalJs(evalExpr).catch((e) => 'ERR ' + e.message)));
result.console = logs;
console.log('--- console (warnings/errors) ---'); console.log(logs.slice(0, 60).join('\n') || '(none)');
fs.writeFileSync(`${outDir}/${suffix}.json`, JSON.stringify(result, null, 2));
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
process.exit(0);

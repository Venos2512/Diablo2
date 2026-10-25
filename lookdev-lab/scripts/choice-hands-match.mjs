// How close is the scene's idle frame to the key art? (own headless Chrome, never the user's screen)
//  1. MARKERS: the hole, the wrist joint and the longest fingertip of every hand (projected from the real scene graph and the real hand mesh), the candle's dish / wax / flame and the
//     ledge line, in key-art coordinates, against env/choiceHands.js KEYART: the error of each (limit 0.03 of the frame on either axis);
//  2. LIGHT: the frame (key-art rectangle cropped out of the page) and the key art are cut into 6 x 4 cells; mean luminance (sRGB, 0-255), hue and saturation of every cell,
//     render vs key art, and the luminance difference in % of the key art's cell (reference of the lighting work: <= ~15 % per cell);
//  3. IMAGES: render | key art | overlay 50 % (and the render alone) in <outDir>.
// Usage: node scripts/choice-hands-match.mjs <cdpPort> <pageUrlPrefix> <webgl|webgpu> <outDir>      (a session script starts the dev server, the proxy and Chrome)
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [port, base, mode, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = `${base}/?scene=choiceHands&renderer=${mode}`;
let list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
let page = list.find((p) => p.type === 'page' && p.url.startsWith(base));
if (!page) page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
	const m = JSON.parse(ev.data);
	if (m.id && pending.has(m.id)) (m.error ? pending.get(m.id).reject(new Error(JSON.stringify(m.error))) : pending.get(m.id).resolve(m.result), pending.delete(m.id));
};
const send = (method, params = {}) => new Promise((resolve, reject) => ((pending.set(++id, { resolve, reject }), ws.send(JSON.stringify({ id, method, params })))));
const evaluate = async (expression) => {
	const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 300000 });
	if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
	return r.result.value;
};
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 780, deviceScaleFactor: 1, mobile: false });
await send('Page.bringToFront');
await send('Page.navigate', { url });
for (let i = 0; i < 240; i++) {
	await sleep(500);
	if (await evaluate(`!!(window.__LAB__ && __LAB__.app.current && __LAB__.app.current.id === 'choiceHands' && __LAB__.app.current.ready && !__LAB__.app.renderHold)`).catch(() => false)) break;
}
await evaluate(`(async () => { const a = __LAB__.app; a.toggleUI(true); a.resize(); a.current.settings.overlay = 0; await a.nextFrames(90); return true; })()`);

// ---- 1. markers
const markers = await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current, V = s._v.constructor;
	const cam = a.rig.camera, W = a.size.w, H = a.size.h, T = ${JSON.stringify({ aspect: 1672 / 941 })}.aspect;
	const rw = Math.min(W, H * T), rh = rw / T, x0 = (W - rw) / 2, y0 = (H - rh) / 2;
	const key = (v) => { const p = v.clone().project(cam); return [((p.x + 1) / 2 * W - x0) / rw, ((1 - p.y) / 2 * H - y0) / rh]; };
	const out = { rect: [x0, y0, rw, rh], hands: {} };
	for (const slot of s.slots) {
		slot.root.updateMatrixWorld(true);
		const model = slot.def.source;
		const hand = slot.meshes.find((m) => m.name === 'hand') || slot.meshes[0];
		const pos = hand.geometry.attributes.position;
		let best = [];
		for (let i = 0; i < pos.count; i++) best.push([pos.getZ(i), i]);
		best.sort((p, q) => q[0] - p[0]);
		const tip = new V();
		for (const [, i] of best.slice(0, 40)) tip.add(new V(pos.getX(i), pos.getY(i), pos.getZ(i)));
		tip.multiplyScalar(1 / 40);
		const wrist = new V(0, 0, ${JSON.stringify({ fl: 0.27, os: 0.27, br: 0.261 })}[model]);
		out.hands[slot.def.id] = { sleeve: key(slot.geo.entry), wrist: key(slot.armG.localToWorld(wrist)), tip: key(slot.armG.localToWorld(tip)) };
	}
	const K = ${JSON.stringify({ x: 0, z: 0.06, scale: 1.12 })};
	out.candle = { dishBase: key(new V(K.x, 0.004, K.z)), waxTop: key(new V(K.x, 0.1355 * K.scale, K.z)), flameTip: key(new V(K.x, (0.148 + 0.085 * 0.8) * K.scale, K.z)), ledge: key(new V(0, 0, 0.16)) };
	return out;
})()`);
const KEY = {
	PB: { sleeve: [0.12, 0.1], wrist: [0.095, 0.235], tip: [0.137, 0.5] },
	FL: { sleeve: [0.266, 0.16], wrist: [0.257, 0.365], tip: [0.3, 0.525] },
	OS: { sleeve: [0.42, 0.245], wrist: [0.419, 0.41], tip: [0.443, 0.7] },
	BR: { sleeve: [0.59, 0.25], wrist: [0.59, 0.425], tip: [0.574, 0.73] },
	EX: { sleeve: [0.76, 0.195], wrist: [0.76, 0.39], tip: [0.705, 0.555] },
	PS: { sleeve: [0.9, 0.12], wrist: [0.9, 0.315], tip: [0.915, 0.5] },
};
const CANDLE = { dishBase: [0.505, 0.885], waxTop: [0.5, 0.75], flameTip: [0.5, 0.672], ledge: [0.5, 0.893] };
let worst = 0;
const rows = [];
for (const [h, m] of Object.entries(markers.hands)) {
	for (const k of ['sleeve', 'wrist', 'tip']) {
		const e = Math.max(Math.abs(m[k][0] - KEY[h][k][0]), Math.abs(m[k][1] - KEY[h][k][1]));
		worst = Math.max(worst, e);
		rows.push(`${h} ${k.padEnd(6)} got (${m[k][0].toFixed(3)}, ${m[k][1].toFixed(3)})  key (${KEY[h][k][0].toFixed(3)}, ${KEY[h][k][1].toFixed(3)})  err ${e.toFixed(3)}`);
	}
}
for (const [k, m] of Object.entries(markers.candle)) {
	const e = Math.max(Math.abs(m[0] - CANDLE[k][0]), Math.abs(m[1] - CANDLE[k][1]));
	if (k !== 'ledge') worst = Math.max(worst, e);
	rows.push(`candle ${k.padEnd(9)} got (${m[0].toFixed(3)}, ${m[1].toFixed(3)})  key (${CANDLE[k][0].toFixed(3)}, ${CANDLE[k][1].toFixed(3)})  err ${e.toFixed(3)}`);
}
console.log('MARKERS (real scene graph, real mesh; normalised frame coordinates)');
console.log(rows.join('\n'));
console.log(`worst marker error ${worst.toFixed(3)} (limit 0.03)`);

// ---- 2. light grid and 3. images
const shot = async (opacity, name) => {
	await evaluate(`(async () => { __LAB__.app.current.settings.overlay = ${opacity}; await __LAB__.app.nextFrames(8); return true; })()`);
	const [x, y, w, h] = markers.rect;
	const r = await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: 1 } });
	writeFileSync(path.join(outDir, `${mode}-${name}.png`), Buffer.from(r.data, 'base64'));
	return `data:image/png;base64,${r.data}`;
};
const render = await shot(0, 'render');
await shot(0.5, 'overlay50');
await evaluate(`__LAB__.app.current.settings.overlay = 0`);
const grid = await evaluate(`(async () => {
	const load = async (src) => { const img = new Image(); img.src = src; await img.decode(); return img; };
	const cellStats = (img) => {
		const C = 6, R = 4, S = 64;
		const c = document.createElement('canvas'); c.width = C * S; c.height = R * S;
		const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, C * S, R * S);
		const d = g.getImageData(0, 0, C * S, R * S).data;
		const out = [];
		for (let r = 0; r < R; r++) for (let q = 0; q < C; q++) {
			let rr = 0, gg = 0, bb = 0, n = 0, lum = 0;
			for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const i = ((r * S + y) * C * S + q * S + x) * 4; rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; lum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
			rr /= n * 255; gg /= n * 255; bb /= n * 255;
			const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb), dd = mx - mn;
			let h = 0;
			if (dd > 0) h = mx === rr ? ((gg - bb) / dd) % 6 : mx === gg ? (bb - rr) / dd + 2 : (rr - gg) / dd + 4;
			out.push({ lum: lum / n, hue: ((h * 60) + 360) % 360, sat: mx ? dd / mx : 0 });
		}
		return out;
	};
	const a = cellStats(await load(${JSON.stringify(render)}));
	const b = cellStats(await load(location.origin + '/assets/choice-hands/choice-keyart.webp'));
	return { render: a, key: b };
})()`);
const fmt = (arr, f) => [0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((c) => f(arr[r * 6 + c]).padStart(6)).join('')).join('\n');
console.log('\nLUMINANCE 0-255 (mean of the sRGB luminance of the cell), render');
console.log(fmt(grid.render, (c) => c.lum.toFixed(0)));
console.log('key art');
console.log(fmt(grid.key, (c) => c.lum.toFixed(0)));
const diffs = grid.render.map((c, i) => (100 * (c.lum - grid.key[i].lum)) / grid.key[i].lum);
console.log('difference in % of the key art cell (render - key) / key');
console.log([0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4, 5].map((c) => (diffs[r * 6 + c] >= 0 ? '+' : '') + diffs[r * 6 + c].toFixed(0).padStart(4) + '%').map((x) => x.padStart(7)).join('')).join('\n'));
console.log('hue deg / saturation, render');
console.log(fmt(grid.render, (c) => `${c.hue.toFixed(0)}/${c.sat.toFixed(2)}`));
console.log('hue deg / saturation, key art');
console.log(fmt(grid.key, (c) => `${c.hue.toFixed(0)}/${c.sat.toFixed(2)}`));
const within = diffs.filter((d) => Math.abs(d) <= 15).length;
const meanAbs = diffs.reduce((s, d) => s + Math.abs(d), 0) / diffs.length;
console.log(`cells within +-15 %: ${within}/24, mean |difference| ${meanAbs.toFixed(1)} %`);
writeFileSync(path.join(outDir, `${mode}-match.json`), JSON.stringify({ markers, worst, grid, diffs, within, meanAbs }, null, 1));
ws.close();
process.exit(0);

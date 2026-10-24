// Browser test of the class-select scene (scene choiceHands) in MY OWN headless Chrome (never the user's screen, never another thread's page): opens ?scene=choiceHands&renderer=<mode>,
// waits on rendered frames (app.nextFrames), checks the console, drives the scene through hover (all six) / reach / back / grasp, with real mouse + keyboard events, and writes PNGs.
// Usage: node scripts/choice-hands-browser.mjs <cdpPort> <pageUrlPrefix> <webgl|webgpu> <outDir> [--only a,b]
// (a session script starts the dev server, the /__events proxy and Chrome: see E:\tmp_choice_hands\session.sh; the page URL prefix is the proxy: http://127.0.0.1:4932)
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [port, base, mode, outDir, ...rest] = process.argv.slice(2);
const only = rest.includes('--only') ? rest[rest.indexOf('--only') + 1].split(',') : null;
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
	const url = `${base}/?scene=choiceHands&renderer=${mode}`;
	let list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
	let page = list.find((p) => p.type === 'page' && p.url.startsWith(base));
	if (!page) page = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })).json();
	const ws = new WebSocket(page.webSocketDebuggerUrl);
	await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
	let id = 0;
	const pending = new Map();
	const logs = [];
	ws.onmessage = (ev) => {
		const msg = JSON.parse(ev.data);
		if (msg.id && pending.has(msg.id)) {
			const { resolve, reject } = pending.get(msg.id);
			pending.delete(msg.id);
			if (msg.error) reject(new Error(JSON.stringify(msg.error)));
			else resolve(msg.result);
		} else if (msg.method === 'Runtime.consoleAPICalled') logs.push({ type: msg.params.type, text: msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ') });
		else if (msg.method === 'Runtime.exceptionThrown') logs.push({ type: 'exception', text: msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text });
		else if (msg.method === 'Log.entryAdded') logs.push({ type: `log.${msg.params.entry.level}`, text: `${msg.params.entry.text} ${msg.params.entry.url ?? ''}` });
	};
	const send = (method, params = {}) => new Promise((resolve, reject) => {
		const mid = ++id;
		pending.set(mid, { resolve, reject });
		ws.send(JSON.stringify({ id: mid, method, params }));
	});
	const evaluate = async (expression, timeout = 300000) => {
		const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout });
		if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
		return r.result.value;
	};
	await send('Runtime.enable');
	await send('Log.enable');
	await send('Page.enable');
	return { send, evaluate, logs, url, page, close: () => ws.close() };
}

const cdp = await connect();
const { send, evaluate, logs } = cdp;
const results = { mode, steps: [], errors: [] };
const step = (name, data = {}) => {
	results.steps.push({ name, ...data });
	console.log(`  ${name}`, Object.keys(data).length ? JSON.stringify(data) : '');
};

await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 780, deviceScaleFactor: 1, mobile: false });
await send('Page.bringToFront');
const mark = logs.length;
await send('Page.navigate', { url: cdp.url });
// wait for the scene (frames, not seconds)
let ready = false;
for (let i = 0; i < 240 && !ready; i++) {
	await sleep(500);
	ready = await evaluate(`!!(window.__LAB__ && __LAB__.app.current && __LAB__.app.current.id === 'choiceHands' && __LAB__.app.current.ready && !__LAB__.app.renderHold)`).catch(() => false);
}
if (!ready) {
	console.log('scene never became ready');
	console.log(logs.slice(mark).map((l) => `${l.type}: ${l.text}`).join('\n'));
	process.exit(2);
}
await evaluate(`(async () => { const a = __LAB__.app; a.toggleUI(true); a.resize(); await a.nextFrames(30); return true; })()`);
const frames = (n) => evaluate(`__LAB__.app.nextFrames(${n}).then(() => true)`);
const S = (code) => evaluate(`(() => { const s = __LAB__.app.current; return (${code}); })()`);
let overlayOk = true; // the lab's own error overlay (shader / pipeline errors never reach console.error): must stay empty while this scene is the only one used
const shot = async (name) => {
	const overlay = await evaluate(`document.getElementById('error-overlay').textContent.trim().slice(0, 400)`);
	if (overlay && overlayOk) {
		results.errors.push({ type: 'overlay', text: `${name}: ${overlay}` });
		console.log(`  ERROR OVERLAY at ${name}: ${overlay}`);
	}
	if (only && !only.includes(name)) return;
	const r = await send('Page.captureScreenshot', { format: 'png' });
	writeFileSync(path.join(outDir, `${mode}-${name}.png`), Buffer.from(r.data, 'base64'));
	step(`shot ${name}`);
};
const settle = async (n = 45) => {
	await frames(n);
};
// client coordinates of a point of slot i (rest hand centre), from the camera
const slotPoint = (i) => S(`(() => { const c = __LAB__.app.rig.camera; const r = __LAB__.app.backend.canvas.getBoundingClientRect(); const v = s.slots[${i}].geo.hand.clone().project(c); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; })()`);
// centre (client coordinates) of one of the scene's overlay buttons
const X = (code) => evaluate(`(() => { const s = __LAB__.app.current; ${code} return true; })()`); // statements
const buttonPoint = (act) => evaluate(`(() => { const b = document.querySelector('.ch-ui [data-act=${act}]'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, shown: getComputedStyle(b.parentElement).opacity }; })()`);
const clickAt = async (x, y) => {
	await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
	await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
	await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
};
const clickButton = async (act) => {
	const p = await buttonPoint(act);
	await clickAt(p.x, p.y);
	return p;
};
const until = (cond, max = 900) => evaluate(`(async () => { const a = __LAB__.app, s = a.current; let n = 0; while (!(${cond}) && n < ${max}) { await a.nextFrames(1); n++; } return { frames: n, ok: !!(${cond}) }; })()`);
// pixels of the page canvas that differ between two captures (the dust test): counts channel differences above `th` between two data URLs
const diffPixels = (a, b, th = 28) => evaluate(`(async () => {
	const load = async (url) => { const bmp = await createImageBitmap(await (await fetch(url)).blob()); const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0); return g.getImageData(0, 0, bmp.width, bmp.height).data; };
	const A = await load(${JSON.stringify(a)}), B = await load(${JSON.stringify(b)});
	let n = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > ${th}) n++;
	return n;
})()`);
// pixels of the FINGERS: the frame with the arm shown against the frame with it hidden (hand and grains frozen, no dust), counted inside a box round the middle of the hand.
// The dissolve test: the count must fall clearly between the tremble and the crumble, on both backends
const handPixels = (half = 100) => evaluate(`(async () => {
	const a = __LAB__.app, s = a.current, slot = s.slots[s.sel];
	s._ug = s.updateGrasp; s._ud = s.updateDust; s.updateGrasp = () => {}; s.updateDust = () => {};
	const dustVis = s.dustMesh.visible; s.dustMesh.visible = false;
	const centre = s._v.clone().set(0, 0, 0.4); // the fingers
	slot.armG.updateWorldMatrix(true, false);
	slot.armG.localToWorld(centre);
	const ndc = centre.project(a.rig.camera);
	const r = a.backend.canvas.getBoundingClientRect();
	const cx = Math.round((ndc.x + 1) / 2 * r.width), cy = Math.round((1 - ndc.y) / 2 * r.height);
	await a.nextFrames(2);
	const A = await a.captureFrame('image/png');
	const was = slot.slices.map((sl) => sl.mesh.visible);
	for (const sl of slot.slices) if (sl.lo >= 0.3) sl.mesh.visible = false; // the fingertip slabs only: what is left of them when the front has passed
	await a.nextFrames(2);
	const B = await a.captureFrame('image/png');
	slot.slices.forEach((sl, i) => (sl.mesh.visible = was[i]));
	s.updateGrasp = s._ug; s.updateDust = s._ud; s.dustMesh.visible = dustVis;
	const load = async (url) => { const bmp = await createImageBitmap(await (await fetch(url)).blob()); const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0); return { w: bmp.width, h: bmp.height, d: g.getImageData(0, 0, bmp.width, bmp.height).data }; };
	const [IA, IB] = [await load(A), await load(B)];
	const x0 = Math.max(0, cx - ${half}), x1 = Math.min(IA.w, cx + ${half}), y0 = Math.max(0, cy - ${half}), y1 = Math.min(IA.h, cy + ${half});
	let n = 0;
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * IA.w + x) * 4; if (Math.abs(IA.d[i] - IB.d[i]) + Math.abs(IA.d[i + 1] - IB.d[i + 1]) + Math.abs(IA.d[i + 2] - IB.d[i + 2]) > 40) n++; }
	return { n, box: [x0, y0, x1, y1], front: +s.grasp.front.toFixed(3), t: +s.grasp.t.toFixed(2) };
})()`);
const mouse = (type, x, y, extra = {}) => send('Input.dispatchMouseEvent', { type, x, y, button: 'none', ...extra });
const key = async (k, code) => {
	await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: code ?? k, windowsVirtualKeyCode: { Escape: 27, Enter: 13, ArrowRight: 39, ArrowLeft: 37 }[k] ?? k.toUpperCase().charCodeAt(0), text: k.length === 1 ? k : undefined });
	await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: code ?? k, windowsVirtualKeyCode: { Escape: 27, Enter: 13, ArrowRight: 39, ArrowLeft: 37 }[k] ?? k.toUpperCase().charCodeAt(0) });
};

const info = await evaluate(`(() => { const a = __LAB__.app; return { mode: a.mode, language: a.backend.language, kind: a.backend.kind, size: a.size, slots: a.current.slots.map((s) => s.def.id), state: a.current.state }; })()`);
step('boot', info);

// 1. idle
await settle(60);
await shot('01-idle');

// 2. hover every hand with the keyboard hook, shoot OS (index 2) and one outer hand
for (let i = 0; i < 6; i++) {
	await S(`s.hover(${i})`);
	await settle(40);
	const cap = await S(`({ shown: s.cap.shown, alpha: +s.cap.alpha.toFixed(2), name: s.ui.name.textContent, quote: s.ui.quote.textContent, hover: s.slots[${i}].hover.toFixed(2) })`);
	step(`hover ${i}`, cap);
	if (i === 2) await shot('02-hover-OS');
	if (i === 0) await shot('02b-hover-PB');
	if (i === 5) await shot('02c-hover-PS');
}
await S('s.hover(-1)');

// 3. real pointer path: move onto hand 3 (BR), click it, check the state
const p3 = await slotPoint(3);
await mouse('mouseMoved', 20, 20);
await settle(10);
await mouse('mouseMoved', p3.x, p3.y);
await settle(40);
step('pointer hover', await S('({ hoverIndex: s.hoverIndex, cursor: __LAB__.app.backend.canvas.style.cursor })'));
await mouse('mousePressed', p3.x, p3.y, { button: 'left', buttons: 1, clickCount: 1 });
await mouse('mouseReleased', p3.x, p3.y, { button: 'left', buttons: 0, clickCount: 1 });
await frames(3);
step('after click', await S('({ state: s.state, sel: s.sel, selected: !!__LAB__.app.selected })'));
// run the reach in real frames and count them
const t0 = await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.reach.t < 1 && n < 900) { await __LAB__.app.nextFrames(1); n++; } return { frames: n, value: s.reach.value }; })()`);
step('reach BR done', t0);
await settle(40);
await shot('03-reach-BR');
// Esc back (keyboard path), then right-click path later
await key('Escape');
const t1 = await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.state !== 'idle' && n < 900) { await __LAB__.app.nextFrames(1); n++; } return { frames: n, state: s.state }; })()`);
step('Esc back', t1);
await settle(40);
await shot('04-back-idle');

// 4. FL: keyboard path (digits + Enter), then right-click back
await key('2');
await settle(10);
step('key 2', await S('({ keyHover: s.keyHover })'));
await key('Enter');
await frames(3);
step('Enter select', await S('({ state: s.state, sel: s.sel })'));
await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.reach.t < 1 && n < 900) { await __LAB__.app.nextFrames(1); n++; } return n; })()`);
await settle(40);
await shot('05-reach-FL');
await mouse('mousePressed', 700, 400, { button: 'right', buttons: 2, clickCount: 1 });
await mouse('mouseReleased', 700, 400, { button: 'right', buttons: 0, clickCount: 1 });
await frames(3);
step('right click', await S('({ state: s.state })'));
await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.state !== 'idle' && n < 900) { await __LAB__.app.nextFrames(1); n++; } return n; })()`);

// 5. OS and PB (stand-in) reaches, then grasp OS
for (const [i, name] of [[2, 'OS'], [0, 'PB'], [4, 'EX'], [5, 'PS']]) {
	await S('s.back(true)');
	await settle(8);
	await S(`s.select(${i}, true)`);
	await settle(60);
	step(`reach ${name}`, await S('({ state: s.state, sel: s.sel, colour: s.slots[s.sel].mats[0].color.toArray().map((v) => +v.toFixed(2)) })'));
	await shot(`06-reach-${name}`);
}
// grasp the OS one: first the real timeline for the tremble and the crumble in frames
await S('s.back(true)');
await settle(10);
await S('s.select(2, true)');
await settle(60);
const g = await S('s.grab()');
step('grab', { ok: g });
await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.grasp.t < 0.3 && n < 600) { await __LAB__.app.nextFrames(1); n++; } return n; })()`);
const hp0 = await handPixels();
await shot('07-grasp-tremble');
await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.grasp.t < 1.35 && n < 600) { await __LAB__.app.nextFrames(1); n++; } return n; })()`);
const hp1 = await handPixels();
await shot('08-grasp-crumble');
step('dissolve pixels', { tremble: hp0, crumble: hp1, ok: hp0.n > 1500 && hp1.n < hp0.n * 0.5 });
if (!(hp0.n > 1500 && hp1.n < hp0.n * 0.5)) results.errors.push({ type: 'dissolve', text: `hand pixels ${hp0.n} -> ${hp1.n}` });
// H1: the ash must be more than a 1 px dot on both backends: with / without the dust mesh, same moment (control = two captures with it hidden, to know the noise floor)
{
	const cap = () => evaluate(`__LAB__.app.captureFrame('image/png')`);
	await evaluate(`(() => { const s = __LAB__.app.current; s._ug = s.updateGrasp; s._ud = s.updateDust; s.updateGrasp = () => {}; s.updateDust = () => {}; s.dustMesh.visible = true; })()`); // freeze the hand and the grains (the 52 Hz tremble moves every edge between two frames)
	const shown = await cap();
	await evaluate(`__LAB__.app.current.dustMesh.visible = false`);
	const hidden1 = await cap();
	const hidden2 = await cap();
	await evaluate(`(() => { const s = __LAB__.app.current; s.updateGrasp = s._ug; s.updateDust = s._ud; s.dustMesh.visible = true; })()`);
	const dust = await diffPixels(shown, hidden1);
	const noise = await diffPixels(hidden1, hidden2);
	const live = await S('s.dust.p.filter((q) => q.age < q.life).length');
	step('dust pixels', { dust, noise, live, ok: dust > 400 && dust > noise * 3 });
	if (!(dust > 400 && dust > noise * 3)) results.errors.push({ type: 'dust', text: `dust pixels ${dust} (noise ${noise}, live ${live})` });
}
await evaluate(`(async () => { const s = __LAB__.app.current; let n = 0; while (s.state === 'grasp' && n < 900) { await __LAB__.app.nextFrames(1); n++; } return n; })()`);
await settle(70);
step('end', await S('({ state: s.state, endName: s.ui.endName.textContent })'));
await shot('09-end');
// replay
await clickButton('replay');
await settle(40);
step('replay', await S('({ state: s.state, opacity: s.slots[2].mats[0].opacity, transparent: s.slots[2].mats[0].transparent, visible: s.slots[2].armG.visible })'));
await shot('10-replay-idle');

// ---- review round 2: input and state machine ------------------------------------------------------------------------------------
// M1: a clicked button must not keep keyboard focus: click "Quay lại", then arrow + Enter selects once and STAYS selected (not back at once)
await X('s.replay();');
await settle(10);
await key('3');
await key('Enter');
step('M1 select OS', await until(`s.reach.value > 0.9 && s.ui.actions.classList.contains('on')`));
const back0 = await clickButton('back');
step('M1 click Quay lai', { shown: back0.shown, ...(await until(`s.state === 'idle'`)) });
await key('ArrowRight');
await key('ArrowRight');
await key('Enter');
await frames(4);
const m1a = await S('({ state: s.state, sel: s.sel, active: document.activeElement && document.activeElement.className })');
await settle(40);
const m1b = await S('({ state: s.state, sel: s.sel })');
step('M1 arrow + Enter after the click', { before: m1a, after: m1b, ok: m1a.state === 'reach' && m1b.state === 'reach' && m1a.sel === m1b.sel });
if (!(m1a.state === 'reach' && m1b.state === 'reach')) results.errors.push({ type: 'M1', text: JSON.stringify([m1a, m1b]) });
await X('s.replay();');
await settle(10);
// L1: the buttons show only once the hand is out far enough; Enter before that is remembered and fires then
await key('2');
await key('Enter');
await frames(6);
const l1a = await S('({ value: +s.reach.value.toFixed(2), buttons: s.ui.actions.classList.contains("on"), state: s.state, pending: s.pendingGrab })');
await key('Enter'); // too early: queued
await frames(1);
const l1b = await S('({ pending: s.pendingGrab, state: s.state })');
const l1c = await until(`s.state === 'grasp'`);
const l1d = await S('({ value: +s.reach.value.toFixed(2), state: s.state })');
step('L1 queued grab', { early: l1a, queued: l1b, ...l1c, at: l1d, ok: !l1a.buttons && l1b.pending && l1d.state === 'grasp' && l1d.value >= 0.84 });
if (!(!l1a.buttons && l1b.pending && l1d.state === 'grasp' && l1d.value >= 0.84)) results.errors.push({ type: 'L1', text: JSON.stringify([l1a, l1b, l1d]) });
await X('s.replay();');
await settle(10);
// M3: with a hand held out, the pointer over THAT hand is a pointer cursor and a click on it takes it
await X('s.select(3, true);');
await settle(70);
const hp = await S(`(() => { const c = __LAB__.app.rig.camera; const r = __LAB__.app.backend.canvas.getBoundingClientRect(); const v = s.slots[3].geo.handReach.clone().project(c); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; })()`);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 30, y: 30, button: 'none' });
await frames(2);
const cur0 = await S('__LAB__.app.backend.canvas.style.cursor');
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hp.x, y: hp.y, button: 'none' });
await frames(2);
const cur1 = await S('__LAB__.app.backend.canvas.style.cursor');
await clickAt(hp.x, hp.y);
await frames(3);
const m3 = await S('({ state: s.state, sel: s.sel })');
step('M3 click the offered hand', { cursorAway: cur0, cursorOver: cur1, ...m3, ok: cur0 !== 'pointer' && cur1 === 'pointer' && m3.state === 'grasp' });
if (!(cur0 !== 'pointer' && cur1 === 'pointer' && m3.state === 'grasp')) results.errors.push({ type: 'M3', text: JSON.stringify([cur0, cur1, m3]) });
// L3a: replay in the middle of the grasp puts everything back
await until(`s.grasp.t > 1.0`);
await X('s.replay();');
await settle(30);
step('L3 replay mid-grasp', await S(`({ state: s.state, planeFar: s.slots[3].slices === null, visible: s.slots[3].armG.visible, shadow: s.slots[3].meshes[0].castShadow, camP: +s.camP.toFixed(2), live: s.dust.p.filter((q) => q.age < q.life).length })`));
await shot('15-replay-mid-grasp');
// L3b: Esc in the middle of the reach
await X('s.select(1);');
await frames(25);
await key('Escape');
const l3b = await until(`s.state === 'idle'`);
step('L3 Esc mid-reach', { ...l3b, ...(await S('({ state: s.state, value: +s.reach.value.toFixed(2), sel: s.sel })')) });
// L3c: hiding the stand-ins while a stand-in is the chosen hand
await X('s.select(0, true);');
await settle(20);
await X('s.settings.showStandIns = false; s.applyStandIns();');
await settle(5);
step('L3 hide stand-ins while PB is chosen', await S('({ state: s.state, sel: s.sel, hiddenPB: s.slots[0].hidden })'));
await X('s.settings.showStandIns = true; s.applyStandIns();');
await settle(5);
// hand size slider
step('hand scale', await S(`(() => { s.settings.handScale = 1; s.applyHandScale(); const a = s.slots[2].geo.scale; const pk = s.pick(0, 0); s.settings.handScale = 1.5; s.applyHandScale(); return { scale1: a, scaleBack: s.slots[2].geo.scale, rootScale: s.slots[2].root.scale.x }; })()`));
await settle(5);

// B1: the red thread rings of PS must dissolve WITH the wrist (they are cut by their z in the arm frame, not in their own space)
await X('s.replay();');
await settle(10);
await X('s.select(5, true);');
await settle(70);
await X('s.grab();');
const ringPx = () => evaluate(`(async () => {
	const a = __LAB__.app, s = a.current, slot = s.slots[5];
	s._ug = s.updateGrasp; s._ud = s.updateDust; s.updateGrasp = () => {}; s.updateDust = () => {};
	const dustVis = s.dustMesh.visible; s.dustMesh.visible = false;
	const rings = slot.slices.filter((sl) => sl.original.geometry.type === 'TorusGeometry');
	const centre = s._v.clone().set(0, 0, 0.23);
	slot.armG.updateWorldMatrix(true, false);
	slot.armG.localToWorld(centre);
	const ndc = centre.project(a.rig.camera);
	const r = a.backend.canvas.getBoundingClientRect();
	const cx = Math.round((ndc.x + 1) / 2 * r.width), cy = Math.round((1 - ndc.y) / 2 * r.height);
	await a.nextFrames(2);
	const A = await a.captureFrame('image/png');
	const was = rings.map((sl) => sl.mesh.visible);
	for (const sl of rings) sl.mesh.visible = false;
	await a.nextFrames(2);
	const B = await a.captureFrame('image/png');
	rings.forEach((sl, i) => (sl.mesh.visible = was[i]));
	s.updateGrasp = s._ug; s.updateDust = s._ud; s.dustMesh.visible = dustVis;
	const load = async (url) => { const bmp = await createImageBitmap(await (await fetch(url)).blob()); const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(bmp, 0, 0); return { w: bmp.width, d: g.getImageData(0, 0, bmp.width, bmp.height).data, h: bmp.height }; };
	const [IA, IB] = [await load(A), await load(B)];
	let n = 0;
	for (let y = Math.max(0, cy - 100); y < Math.min(IA.h, cy + 100); y++) for (let x = Math.max(0, cx - 100); x < Math.min(IA.w, cx + 100); x++) { const i = (y * IA.w + x) * 4; if (Math.abs(IA.d[i] - IB.d[i]) + Math.abs(IA.d[i + 1] - IB.d[i + 1]) + Math.abs(IA.d[i + 2] - IB.d[i + 2]) > 40) n++; }
	return { n, rings: rings.length, visibleRings: was.filter(Boolean).length, slabs: rings.map((sl) => sl.mesh.name.split(' ').pop()).join(','), front: +s.grasp.front.toFixed(3), t: +s.grasp.t.toFixed(2) };
})()`);
await until(`s.grasp.t >= 0.3`);
const rp0 = await ringPx();
await shot('16-ps-dissolve-a');
await until(`s.grasp.t >= 1.3`);
await shot('16-ps-dissolve-b');
await until(`s.grasp.front < 0.0`);
await shot('16-ps-dissolve-c');
const rp1 = await ringPx();
step('PS rings dissolve with the wrist', { tremble: rp0, after: rp1, ok: rp0.n > 100 && rp0.rings >= 2 && rp1.n < 400 && rp1.visibleRings === 0 });
if (!(rp0.n > 100 && rp0.rings >= 2 && rp1.n < 400 && rp1.visibleRings === 0)) results.errors.push({ type: 'rings', text: JSON.stringify([rp0, rp1]) });
await X('s.replay();');
await settle(10);

// 5b. the optional finger rig: a fake rigged hand (bones named like the table, a box on each segment) is bound to the OS slot; the scene must drive it relaxed / open / fist
await S('s.back(true)');
await settle(5);
step('finger rig', await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current;
	const Group = s.anchor.constructor, Mesh = s.ledge.constructor, Box = s.ledge.geometry.constructor;
	const slot = s.slots[2];
	const staticBefore = slot.rig === null;
	const fake = new Group();
	fake.name = 'fake rig';
	const names = { thumb: 'Thumb', index: 'Index', middle: 'Middle', ring: 'Ring', pinky: 'Pinky' };
	const x0 = { thumb: -0.04, index: -0.025, middle: -0.005, ring: 0.015, pinky: 0.033 };
	for (const [f, label] of Object.entries(names)) {
		let parent = fake;
		for (let k = 1; k <= 3; k++) {
			const bone = new Group();
			bone.isBone = true;
			bone.name = label + '.0' + k; // Index.01 matches index_01
			bone.position.set(k === 1 ? x0[f] : 0, k === 1 ? 0.012 : 0, k === 1 ? 0.2 : 0.045);
			const box = new Mesh(new Box(0.012, 0.012, 0.045), s.ledgeMaterial);
			box.position.z = 0.022;
			bone.add(box);
			parent.add(bone);
			parent = bone;
		}
	}
	slot.armG.add(fake);
	const rig = s.bindFingerRig(slot);
	const info = { staticBefore, bound: !!rig, found: slot.rigInfo.found, missing: slot.rigInfo.missing.length };
	const idx = fake.getObjectByName('Index.02');
	const angle = () => +idx.quaternion.angleTo(new idx.quaternion.constructor()).toFixed(3);
	await a.nextFrames(30);
	info.relaxed = angle();
	s.select(2, true);
	await a.nextFrames(60);
	info.offered = angle();
	window.__fake = fake;
	return info;
})()`));
await shot('13-rig-offered');
step('finger rig grip', await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current, fake = window.__fake;
	const idx = fake.getObjectByName('Index.02');
	s.grab();
	let n = 0;
	while (s.grasp.t < 0.45 && n < 600) { await a.nextFrames(1); n++; }
	const out = { gripAt: +s.gripW.toFixed(2), angle: +idx.quaternion.angleTo(new idx.quaternion.constructor()).toFixed(3), squeezeScale: +s.slots[2].wristG.scale.x.toFixed(3) };
	return out;
})()`));
await shot('14-rig-grip');
await evaluate(`(() => { const s = __LAB__.app.current; s.replay(); s.slots[2].armG.remove(window.__fake); s.bindFingerRig(s.slots[2]); return true; })()`);
step('rig removed', await S('({ rig: s.slots[2].rig === null })'));
await settle(10);

// 6. panels: the Environment tab holds this scene's controls, the Lighting tab its three lights; toggles and sliders act
step('panels', await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current;
	a.toggleUI(false);
	a.panels.show('lighting');
	await a.nextFrames(4);
	const light = a.panels.lighting.el.textContent;
	a.panels.show('environment');
	await a.nextFrames(4);
	const env = a.panels.environment.el.textContent;
	return { envHasHands: env.includes('Chọn tay'), envHasStandIn: env.includes('stand-in'), lightHasCandle: light.includes("Gennet's candle"), lights: s.lights.length };
})()`));
await settle(5);
await shot('11-panel');
step('stand-in toggle', await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current;
	s.settings.showStandIns = false; s.applyStandIns(); await a.nextFrames(3);
	const hidden = s.slots.filter((x) => x.hidden).map((x) => x.def.id);
	const accepted = s.select(0, true); // PB is a stand-in: refused (false) while hidden
	s.settings.showStandIns = true; s.applyStandIns(); await a.nextFrames(3);
	return { hidden, accepted, visible: s.slots.filter((x) => !x.hidden).length };
})()`));
step('unlock camera', await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current;
	s.settings.lockCamera = false; await a.nextFrames(3);
	const enabled = a.rig.controls.enabled;
	s.settings.lockCamera = true; await a.nextFrames(3);
	return { enabledWhenUnlocked: enabled, enabledWhenLocked: a.rig.controls.enabled };
})()`));
// leaving the scene restores the camera, the controls and the DOM
const leaveMark = logs.length;
overlayOk = false; // the Studio scene's colour checker has a pipeline error on WebGPU (pre-existing; seen without this scene too): not ours
await evaluate(`(async () => { const a = __LAB__.app, s = a.current; s.select(2, true); await a.nextFrames(30); s.grab(); await a.nextFrames(20); return s.state; })()`); // leave in the middle of a grasp
step('leave', await evaluate(`(async () => {
	const a = __LAB__.app;
	await a.setScene('studio');
	await a.nextFrames(5);
	const out = { overlay: !!document.querySelector('.ch-ui'), style: document.head.textContent.includes('.ch-ui'), controls: a.rig.controls.enabled, fov: a.rig.persp.fov, scene: a.current.id };
	await a.setScene('choiceHands');
	await a.nextFrames(20);
	out.back = { overlay: !!document.querySelector('.ch-ui'), fov: a.rig.persp.fov, state: a.current.state, hands: a.current.slots.every((x) => x.armG.visible && x.slices === null), dim: a.current.slots.map((x) => +x.dim.toFixed(2)).join(',') };
	return out;
})()`));
await settle(30);
await shot('12-after-leave');
// L2: dispose frees the scene's GPU resources (WebGL: the renderer's texture / geometry counters fall)
step('dispose', await evaluate(`(async () => {
	const a = __LAB__.app, s = a.current, info = a.backend.renderer.info;
	await a.setScene('studio');
	await a.nextFrames(5);
	const before = info.memory ? { textures: info.memory.textures, geometries: info.memory.geometries } : null;
	s.dispose();
	await a.nextFrames(3);
	const after = info.memory ? { textures: info.memory.textures, geometries: info.memory.geometries } : null;
	return { disposed: s.disposed, before, after, proxies: s.proxyRoot.children.length };
})()`));

// console errors (the favicon 404 of the dev server aside) and GPU warnings, up to the moment the scene is left for the Studio
const errs = [
	...results.errors,
	...logs.slice(mark).filter((l) => ['error', 'exception', 'log.error'].includes(l.type) && !/favicon\.ico/.test(l.text)),
	...logs.slice(mark, leaveMark).filter((l) => /warning/.test(l.type) && /invalid|Color target|three|shader|WebGL/i.test(l.text)),
];
results.errors = errs;
console.log(`console problems: ${errs.length}`);
for (const e of errs.slice(0, 20)) console.log(`  ${e.type}: ${e.text.slice(0, 300)}`);
writeFileSync(path.join(outDir, `${mode}-result.json`), JSON.stringify(results, null, 1));
cdp.close();
process.exit(errs.length ? 1 : 0);

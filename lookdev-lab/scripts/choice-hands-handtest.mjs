// Browser test of the HAND-TEST mode (scene choiceHands, ?handtest=1) and of the rigged Flagellant hand, in my own headless Chrome: opens ?scene=choiceHands&renderer=<mode>&handtest=1, checks the rig,
// puts the hand into every preset (screenshot each), runs the auto loop, toggles the skeleton / wireframe / rig, leaves the mode, then takes the rigged hand through a grasp (the dissolve of a
// skinned mesh) twice. Console and the lab's error overlay must stay clean.
// Usage: node scripts/choice-hands-handtest.mjs <cdpPort> <pageUrlPrefix> <webgl|webgpu> <outDir>
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const [port, base, mode, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = `${base}/?scene=choiceHands&renderer=${mode}&handtest=1`;
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
const evaluate = async (expression) => {
	const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 300000 });
	if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
	return r.result.value;
};
await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1500, height: 780, deviceScaleFactor: 1, mobile: false });
await send('Page.bringToFront');
const mark = logs.length;
await send('Page.navigate', { url });
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
const results = { mode, steps: [], errors: [] };
const step = (name, data = {}) => {
	results.steps.push({ name, ...data });
	console.log(`  ${name}`, Object.keys(data).length ? JSON.stringify(data) : '');
	if (data.ok === false) results.errors.push({ type: name, text: JSON.stringify(data) });
};
const frames = (n) => evaluate(`__LAB__.app.nextFrames(${n}).then(() => true)`);
const S = (code) => evaluate(`(() => { const s = __LAB__.app.current; return (${code}); })()`);
const X = (code) => evaluate(`(() => { const s = __LAB__.app.current; ${code} return true; })()`);
const until = (cond, max = 900) => evaluate(`(async () => { const a = __LAB__.app, s = a.current; let n = 0; while (!(${cond}) && n < ${max}) { await a.nextFrames(1); n++; } return { frames: n, ok: !!(${cond}) }; })()`);
const shot = async (name) => {
	await frames(4);
	const overlay = await evaluate(`document.getElementById('error-overlay').textContent.trim().slice(0, 400)`);
	if (overlay) {
		results.errors.push({ type: 'overlay', text: `${name}: ${overlay}` });
		console.log(`  ERROR OVERLAY at ${name}: ${overlay}`);
	}
	const r = await send('Page.captureScreenshot', { format: 'png' });
	writeFileSync(path.join(outDir, `${mode}-${name}.png`), Buffer.from(r.data, 'base64'));
	console.log(`  shot ${name}`);
};
await evaluate(`(async () => { const a = __LAB__.app; a.toggleUI(true); a.resize(); await a.nextFrames(20); return true; })()`);

await X(`s.settings.rigAlways = false;`); // a setting kept by an earlier run in this profile must not decide the test
// 1. the mode is on, the rig is bound
const on = await until('s.handtest.on', 300);
await frames(30);
const info = await S(`(() => { const sl = s.handtestSlot(); const ex = s.gltfs.flrig?.asset?.extras ?? null; return { on: s.handtest.on, state: s.state, hasGlb: !!s.gltfs.flrig, synthetic: !!ex?.synthetic_rig, skinned: sl.skinned, rig: !!sl.rig, found: sl.rigInfo.found, missing: sl.rigInfo.missing, joints: sl.joints ? sl.joints.has : null, sockets: Object.keys(sl.sockets ?? {}), lock: s.settings.lockCamera, uiHidden: s.ui.root.style.display }; })()`);
step('handtest on, rig bound', { ...info, ok: on.ok && info.on && info.rig && info.found === 15 && info.missing.length === 0 && info.lock === false && info.uiHidden === 'none' });
await shot('00-start');

// 2. every preset: the pose is reached, the mesh stays sane (finite, a hand's size), a screenshot each
const PRESETS = ['relaxed', 'offer', 'cup', 'fist', 'hold', 'point', 'spread', 'wave', 'flexed', 'extended', 'rollPlus', 'rollMinus'];
const sane = () => S(`(() => { const sl = s.handtestSlot(); let box = null; sl.armG.traverse((o) => { if (o.isSkinnedMesh) { o.computeBoundingBox(); box = o.boundingBox.clone(); } }); if (!box) return null; const sz = box.getSize(box.min.clone()); return { size: [sz.x, sz.y, sz.z].map((v) => +v.toFixed(3)), finite: [sz.x, sz.y, sz.z].every(Number.isFinite) }; })()`);
for (const idp of PRESETS) {
	await X(`s.setHandPreset('${idp}', { instant: true });`);
	await frames(idp === 'wave' ? 40 : 25);
	const pose = await S(`(() => { const p = s.handtest.motion.pose; return { idxMcp: +p.fingers.index.curl[0].toFixed(1), idxPip: +p.fingers.index.curl[1].toFixed(1), pinkySpread: +p.fingers.pinky.spread.toFixed(1), flex: +p.wrist.flex.toFixed(1), roll: +p.roll.toFixed(1) }; })()`);
	const sz = await sane();
	step(`preset ${idp}`, { pose, mesh: sz, ok: !sz || (sz.finite && sz.size.every((v) => v < 0.7)) });
	await shot(`preset-${idp}`);
}

// three views of the fingers (from above, from the thumb side, from the fingertips) for the poses where a claw, a buried finger or a lost thumb would show
const viewShot = async (idp, view, dir) => {
	await X(`s.setHandPreset('${idp}', { instant: true });`);
	await frames(20);
	await X(`const sl = s.handtestSlot(); const f = s.anchorWorld(sl, 'palm', new sl.root.position.constructor()); f.addScaledVector(sl.geo.dirReach, 0.07 * sl.geo.scale); const d = new sl.root.position.constructor(${dir.join(', ')}).normalize(); s.app.rig.lookAt(f.clone().addScaledVector(d, 0.55), f);`);
	await frames(10);
	await shot(`view-${idp}-${view}`);
};
for (const idp of ['fist', 'hold', 'cup', 'offer', 'point']) {
	await viewShot(idp, 'top', [0, 1, 0.12]);
	await viewShot(idp, 'thumb', [1, 0.35, 0.1]);
	await viewShot(idp, 'tips', [0.05, 0.4, 1]);
}
await X(`s.placeHandTestCamera();`);

// the curl goes the right way on the real bones: toward the palm (-y of the hand frame) and back toward the wrist; the wrist flexes toward the palm; roll turns the palm toward the thumb side
const tipOf = (name) => S(`(() => { const sl = s.handtestSlot(); sl.armG.updateWorldMatrix(true, true); let b = null; sl.model3d.traverse((o) => { if (o.name === '${name}') b = o; }); const w = b.getWorldPosition(new sl.root.position.constructor()); const l = sl.armG.worldToLocal(w); return [l.x, l.y, l.z].map((v) => +v.toFixed(4)); })()`);
await X(`s.setHandPreset('offer', { instant: true });`);
await frames(15);
const idxOpen = await tipOf('index_03');
const midOpen = await tipOf('middle_03');
await X(`s.setHandPreset('fist', { instant: true });`);
await frames(15);
const idxFist = await tipOf('index_03');
await X(`s.setHandPreset('offer', { instant: true });`);
await frames(15);
step('curl direction', { open: idxOpen, fist: idxFist, ok: idxFist[1] < idxOpen[1] - 0.01 && idxFist[2] < idxOpen[2] - 0.05 });
await X(`s.setHandPreset('offer', { instant: true });`);
await frames(15);
const thOpen = await tipOf('thumb_03');
const palmOpen = await tipOf('fx_palm');
await X(`s.setHandPreset('fist', { instant: true });`);
await frames(15);
const thFist = await tipOf('thumb_03');
const tipFist = await tipOf('fx_tip_index');
const palmFist = await tipOf('fx_palm');
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
step('fist: the thumb folds across the palm, the index fingertip comes to the palm', { thumbOpen: thOpen, thumbFist: thFist, tipToPalm: +dist(tipFist, palmFist).toFixed(3), palmMoved: +dist(palmOpen, palmFist).toFixed(4), ok: thFist[0] < thOpen[0] - 0.015 && dist(tipFist, palmFist) < 0.05 });
await X(`s.setHandPreset('flexed', { instant: true });`);
await frames(15);
const midFlex = await tipOf('middle_03');
step('wrist flexion direction', { open: midOpen, flexed: midFlex, ok: midFlex[1] < midOpen[1] - 0.04 });

// 3. the auto loop goes through the whole sequence smoothly (the index of the preset advances, the sliders follow)
await X(`s.setHandPreset('relaxed', { instant: true }); s.setHandTestRun(true);`);
let seen = new Set();
let worstStep = 0;
let prev = null;
for (let i = 0; i < 4000; i++) {
	await frames(6);
	const r = await S(`({ idx: s.handtest.runIndex, mode: s.handtest.mode, t: +s.handtest.runT.toFixed(2), mcp: s.handtest.motion.pose.fingers.index.curl[0], pip: s.handtest.motion.pose.fingers.index.curl[1], flex: s.handtest.motion.pose.wrist.flex, roll: s.handtest.motion.pose.roll })`);
	seen.add(r.idx);
	if (prev) worstStep = Math.max(worstStep, Math.abs(r.mcp - prev.mcp), Math.abs(r.pip - prev.pip), Math.abs(r.flex - prev.flex) * 0.5, Math.abs(r.roll - prev.roll) * 0.5);
	prev = r;
	if ([3, 7, 10, 11].includes(r.idx) && !seen.has(`shot${r.idx}`) && r.t > 0) {
		seen.add(`shot${r.idx}`);
		await frames(30);
		await shot(`run-${r.idx}`);
	}
	if (r.idx === 12 && r.t > 2) break;
}
step('auto loop', { visited: [...seen].filter((v) => typeof v === 'number').length, largestJumpPer6Frames: +worstStep.toFixed(1), ok: [...seen].filter((v) => typeof v === 'number').length >= 13 && Number.isFinite(worstStep) });
await X('s.setHandTestRun(false);');

// 4. views: skeleton, wireframe, the rig toggle (static hand and back)
await X(`s.setHandPreset('cup', { instant: true }); s.setHandTestSkeleton(true);`);
await frames(20);
await shot('skeleton');
const sk = await S(`({ helper: !!s.handtest.skeleton, bones: s.handtest.skeleton?.bones?.length ?? 0 })`);
await X(`s.setHandTestSkeleton(false); s.setHandTestWire(true);`);
await frames(20);
await shot('wireframe');
await X(`s.setHandTestWire(false);`);
step('skeleton / wireframe', { ...sk, ok: sk.helper && sk.bones >= 15 });
await X(`s.settings.flRig = false; s.rebuildFlRig();`);
await until('s.handtest.on', 200);
await frames(30);
const stat = await S(`({ on: s.handtest.on, rig: !!s.handtestSlot().rig, skinned: s.handtestSlot().skinned })`);
await shot('static-hand');
await X(`s.settings.flRig = true; s.rebuildFlRig();`);
await until('s.handtest.on', 200);
await frames(30);
const back = await S(`({ on: s.handtest.on, rig: !!s.handtestSlot().rig, skinned: s.handtestSlot().skinned })`);
step('rig toggle', { off: stat, on: back, ok: stat.on && !stat.rig && !stat.skinned && back.on && back.rig && back.skinned });

// 5. Esc leaves the mode, the scene is back to its wall
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await until(`!s.handtest.on && s.state === 'idle'`, 400);
await frames(60);
const out = await S(`({ on: s.handtest.on, state: s.state, lock: s.settings.lockCamera, ui: s.ui.root.style.display, skel: !!s.handtest.skeleton, skinnedAfter: s.slots[1].skinned, synthetic: s.rigIsSynthetic })`);
step('Esc leaves the hand test', { ...out, ok: !out.on && out.state === 'idle' && out.lock === true && out.ui === '' && !out.skel && (out.synthetic ? out.skinnedAfter === false : out.skinnedAfter === true) });
await shot('after-exit');

await X(`s.settings.rigAlways = true; s.swapFlSlot();`); // a synthetic rig is otherwise used only in the hand test
// 6. the rigged hand through a grasp: the dissolve of a skinned mesh (twice: the second one is cut anew from a fresh pose)
for (const round of [1, 2]) {
	await X(`s.select(1, true);`);
	await until(`s.showcase.started`, 200);
	await X(`s.skipShowcase();`);
	await until(`s.offered`, 600);
	await frames(20);
	await X(`s.grab();`);
	const marks = [];
	for (const t of [0.3, 0.8, 1.4, 2.0, 2.6]) {
		await until(`s.grasp.t >= ${t} || s.state === 'done'`, 900);
		const st = await S(`({ t: +s.grasp.t.toFixed(2), slices: s.slots[1].slices ? s.slots[1].slices.length : 0, frozen: s.slots[1].frozen ? s.slots[1].frozen.length : 0, skinnedVisible: (() => { let v = false; s.slots[1].armG.traverse((o) => { if (o.isSkinnedMesh && o.visible) v = true; }); return v; })(), front: +s.grasp.front.toFixed(3), live: s.dust.p.filter((q) => q.age < q.life).length })`);
		marks.push(st);
		if (round === 1 && [0.8, 1.4, 2.0].includes(t)) await shot(`grasp-${t}`);
	}
	await until(`s.state === 'done'`, 900);
	const mid = marks[2];
	step(`rigged hand grasp ${round}`, { marks, ok: mid.slices > 0 && mid.frozen === 1 && !mid.skinnedVisible && marks[3].front < marks[1].front });
	await X(`s.replay();`);
	await frames(30);
	const after = await S(`({ state: s.state, slices: s.slots[1].slices, frozen: s.slots[1].frozen.length, skinnedVisible: (() => { let v = false; s.slots[1].armG.traverse((o) => { if (o.isSkinnedMesh && o.visible) v = true; }); return v; })(), twins: (() => { let n = 0; s.slots[1].armG.traverse((o) => { if (o.userData.frozenTwin) n++; }); return n; })() })`);
	step(`replay after grasp ${round}`, { ...after, ok: after.state === 'idle' && after.slices === null && after.frozen === 0 && after.skinnedVisible && after.twins === 0 });
}

await X(`s.settings.rigAlways = false; s.swapFlSlot();`);
const problems = logs.slice(mark).filter((l) => ['error', 'exception', 'log.error', 'warning', 'log.warning'].includes(l.type) && !/favicon|__events|WebGPU.*experimental|powerPreference/i.test(l.text));
console.log(`console problems: ${problems.length}`);
for (const p of problems.slice(0, 10)) console.log(`  ${p.type}: ${p.text.slice(0, 300)}`);
for (const p of problems) results.errors.push({ type: 'console', text: p.text.slice(0, 300) });
writeFileSync(path.join(outDir, `${mode}-handtest-result.json`), JSON.stringify(results, null, 1));
console.log(results.errors.length ? `FAILED: ${results.errors.length}` : 'ALL OK');
ws.close();
process.exit(results.errors.length ? 1 : 0);

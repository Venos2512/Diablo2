// Minimal Chrome DevTools Protocol client for the Tripo Studio tab (Chrome started with --remote-debugging-port=9333).
// Copy of ../../../../legacy/tripo-models/_tools/cdp.mjs with CDP_TARGET (one pinned tab) for the nature-prop sheets.
// Usage:
//   node cdp.mjs eval "<js expression or async IIFE>"     → prints JSON result
//   node cdp.mjs evalfile <file.js>                        → same, source from file
//   node cdp.mjs shot <out.png>                            → viewport screenshot
//   node cdp.mjs upload "<css selector>" <file>            → set files on an <input type=file>
//   node cdp.mjs downloads <dir>                           → send downloads of this browser to <dir>
//   node cdp.mjs goto <url>
import { readFileSync, writeFileSync } from 'node:fs';

const PORT = process.env.CDP_PORT || 9333;
const [cmd, a, b] = process.argv.slice(2);

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const match = process.env.CDP_MATCH || 'tripo3d.ai';
// CDP_TARGET pins one tab by its target id, so another session driving a Tripo tab in the same browser is left alone.
const pinned = process.env.CDP_TARGET && list.find((t) => t.id === process.env.CDP_TARGET);
if (process.env.CDP_TARGET && !pinned) throw new Error(`tab ${process.env.CDP_TARGET} is gone`);
const page = pinned || list.find((t) => t.type === 'page' && t.url.includes(match)) || list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
	const msg = JSON.parse(m.data);
	if (msg.id && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
	}
};
const send = (method, params = {}) => new Promise((ok) => {
	const n = ++id;
	pending.set(n, ok);
	ws.send(JSON.stringify({ id: n, method, params }));
});

async function evaluate(src) {
	const r = await send('Runtime.evaluate', { expression: src, awaitPromise: true, returnByValue: true, userGesture: true, timeout: 600000 });
	if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800));
	return r.result?.result?.value;
}

try {
	if (cmd === 'eval') console.log(JSON.stringify(await evaluate(a)));
	else if (cmd === 'evalfile') console.log(JSON.stringify(await evaluate(readFileSync(a, 'utf8'))));
	else if (cmd === 'shot') {
		const r = await send('Page.captureScreenshot', { format: 'png' });
		writeFileSync(a, Buffer.from(r.result.data, 'base64'));
		console.log('saved', a);
	} else if (cmd === 'upload') {
		const doc = await send('DOM.getDocument', { depth: -1 });
		const q = await send('DOM.querySelectorAll', { nodeId: doc.result.root.nodeId, selector: a });
		const ids = q.result.nodeIds;
		if (!ids.length) throw new Error('no element for ' + a);
		await send('DOM.setFileInputFiles', { nodeId: ids[0], files: [b] });
		console.log('uploaded to', ids.length, 'match(es)');
	} else if (cmd === 'downloads') {
		const r = await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: a, eventsEnabled: false });
		console.log(JSON.stringify(r.error || 'ok'));
	} else if (cmd === 'wheel') { // wheel <deltaY> [times]: real mouse wheel at the viewport centre
		const m = await send('Page.getLayoutMetrics');
		const { clientWidth: w, clientHeight: h } = m.result.cssLayoutViewport;
		for (let i = 0; i < Number(b || 1); i++) {
			await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: w * 0.47, y: h * 0.5, deltaX: 0, deltaY: Number(a) });
			await new Promise((r) => setTimeout(r, 80));
		}
		console.log('wheeled');
	} else if (cmd === 'click') { // click <x> <y>: real left click (CSS px)
		for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: Number(a), y: Number(b), button: 'left', clickCount: 1 });
		console.log('clicked', a, b);
	} else if (cmd === 'drag') { // drag <x1,y1> <x2,y2>: left-button drag (orbit the 3D viewer)
		const [x1, y1] = a.split(',').map(Number);
		const [x2, y2] = b.split(',').map(Number);
		const ev = (type, x, y, buttons) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: type === 'mouseReleased' ? 1 : 0 });
		await ev('mouseMoved', x1, y1, 0);
		await ev('mousePressed', x1, y1, 1);
		for (let i = 1; i <= 20; i++) { await ev('mouseMoved', x1 + ((x2 - x1) * i) / 20, y1 + ((y2 - y1) * i) / 20, 1); await new Promise((r) => setTimeout(r, 15)); }
		await ev('mouseReleased', x2, y2, 0);
		console.log('dragged', a, b);
	} else if (cmd === 'key') { // key <key> [modifiers]: real key press (e.g. n, Enter; modifiers 2 = Ctrl)
		const modifiers = Number(b || 0);
		const code = a.length === 1 ? `Key${a.toUpperCase()}` : a;
		const keyCode = a.length === 1 ? a.toUpperCase().charCodeAt(0) : { Enter: 13, Tab: 9, Backspace: 8 }[a];
		await send('Input.dispatchKeyEvent', { type: 'keyDown', key: a, code, windowsVirtualKeyCode: keyCode, modifiers, text: a.length === 1 && !modifiers ? a : a === 'Enter' ? '\r' : undefined });
		await send('Input.dispatchKeyEvent', { type: 'keyUp', key: a, code, windowsVirtualKeyCode: keyCode, modifiers });
		console.log('key', a);
	} else if (cmd === 'type') { // type <text>: insert text at the focused element as if typed
		await send('Input.insertText', { text: a });
		console.log('typed', a);
	} else if (cmd === 'drag') { // drag <dx> <dy> [button=right]: real drag from the viewport centre (orbit pan/rotate)
		const m = await send('Page.getLayoutMetrics');
		const { clientWidth: w, clientHeight: h } = m.result.cssLayoutViewport;
		const button = process.argv[5] || 'right';
		const x0 = w * 0.47, y0 = h * 0.5;
		await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0, y: y0 });
		await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x0, y: y0, button, buttons: button === 'right' ? 2 : 1, clickCount: 1 });
		for (let i = 1; i <= 20; i++) {
			await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x0 + (Number(a) * i) / 20, y: y0 + (Number(b) * i) / 20, button, buttons: button === 'right' ? 2 : 1 });
			await new Promise((r) => setTimeout(r, 16));
		}
		await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x0 + Number(a), y: y0 + Number(b), button, buttons: 0, clickCount: 1 });
		console.log('dragged');
	} else if (cmd === 'goto') {
		await send('Page.navigate', { url: a });
		await new Promise((r) => setTimeout(r, 5000));
		console.log('at', a);
	} else console.log('unknown command');
} finally {
	ws.close();
}

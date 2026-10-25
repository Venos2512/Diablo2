// Calibrates the six hands of the class-select scene against the key art's MEASURED markers (env/choiceHands.js KEYART): for every slot it searches the hole in the wall
// (entry x, y), the arm direction (a = in-plane, phi = lean out of the wall) and the roll (twist) so that the PROJECTED hole, wrist joint and longest fingertip land on the
// measured points, through the real idle camera and the real hand geometry (armGeometry + the GLB's local fingertip). Nelder-Mead, 40 random restarts per slot.
// Usage: node scripts/choice-hands-calibrate.mjs            prints the table (and the error of every marker); paste the numbers into SLOTS.
//        node scripts/choice-hands-calibrate.mjs --check    exits 1 when a marker of the CURRENT slot table is more than 0.03 of the frame off.
import * as C from '../src/env/choiceHands.js';

const check = process.argv.includes('--check');
const A = C.KEYART.aspect;
const err = (p, q) => Math.hypot((p[0] - q[0]) * A, p[1] - q[1]); // isotropic, in frame heights (the fit)
const axisErr = (p, q) => Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1])); // the acceptance: largest error on either normalised axis of the frame

function markerError(slot, params) {
	const s = { ...slot, entry: [params[0], params[1]], a: params[2], phi: params[3], twist: params[4], visible: params[5], k: params[6] };
	const m = C.slotMarkers(s);
	const t = C.KEYART.hands[slot.id];
	return { sleeve: err(m.sleeve, t.sleeve), wrist: err(m.wrist, t.wrist), tip: err(m.tip, t.tip), axis: Math.max(axisErr(m.sleeve, t.sleeve), axisErr(m.wrist, t.wrist), axisErr(m.tip, t.tip)), m };
}

function cost(slot, p) {
	if (p[3] < 15 || p[3] > 60 || Math.abs(p[4]) > 70 || p[5] < 0.2 || p[5] > 0.42 || p[6] < 0.85 || p[6] > 1.18) return 1e3;
	const e = markerError(slot, p);
	return e.sleeve ** 2 * 0.6 + e.wrist ** 2 + e.tip ** 2 + 1e-6 * p[4] ** 2 + 0.002 * (p[6] - 1) ** 2 + 0.02 * (p[5] - 0.32) ** 2;
}

function nelderMead(f, x0, step, iters = 400) {
	const n = x0.length;
	let pts = [x0.slice()];
	for (let i = 0; i < n; i++) {
		const p = x0.slice();
		p[i] += step[i];
		pts.push(p);
	}
	let vals = pts.map(f);
	for (let it = 0; it < iters; it++) {
		const order = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]);
		pts = order.map((i) => pts[i]);
		vals = order.map((i) => vals[i]);
		const c = Array.from({ length: n }, (_, k) => pts.slice(0, n).reduce((s, p) => s + p[k], 0) / n);
		const along = (t) => c.map((v, k) => v + t * (pts[n][k] - v));
		const r = along(-1);
		const fr = f(r);
		if (fr < vals[0]) {
			const e = along(-2);
			const fe = f(e);
			if (fe < fr) (pts[n] = e), (vals[n] = fe);
			else (pts[n] = r), (vals[n] = fr);
		} else if (fr < vals[n - 1]) (pts[n] = r), (vals[n] = fr);
		else {
			const cc = along(fr < vals[n] ? -0.5 : 0.5);
			const fc = f(cc);
			if (fc < Math.min(fr, vals[n])) (pts[n] = cc), (vals[n] = fc);
			else for (let i = 1; i <= n; i++) (pts[i] = pts[0].map((v, k) => v + 0.5 * (pts[i][k] - v))), (vals[i] = f(pts[i]));
		}
	}
	const best = vals.indexOf(Math.min(...vals));
	return { x: pts[best], f: vals[best] };
}

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
let worst = 0;
const table = [];
for (const slot of C.SLOTS) {
	const t = C.KEYART.hands[slot.id];
	let best;
	const starts = check ? [[slot.entry[0], slot.entry[1], slot.a, slot.phi, slot.twist, slot.visible ?? C.ARM.visible, slot.k ?? 1]] : [];
	if (!check) {
		const wx = (t.sleeve[0] - 0.5) * C.KEYART.frameWidthM;
		const wy = (C.KEYART.ledgeY - t.sleeve[1]) * (C.KEYART.frameWidthM / C.KEYART.aspect);
		for (let k = 0; k < 40; k++) starts.push([wx + (rnd() - 0.5) * 0.3, wy + (rnd() - 0.5) * 0.3, slot.a + (rnd() - 0.5) * 60, 20 + rnd() * 35, (rnd() - 0.5) * 80, 0.32, 1]);
	}
	for (const s0 of starts) {
		const r = check ? { x: s0, f: cost(slot, s0) } : nelderMead((p) => cost(slot, p), s0, [0.08, 0.08, 15, 10, 15, 0.04, 0.08]);
		if (!best || r.f < best.f) best = r;
	}
	const e = markerError(slot, best.x);
	worst = Math.max(worst, e.axis);
	table.push({ id: slot.id, entry: [+best.x[0].toFixed(3), +best.x[1].toFixed(3)], a: +best.x[2].toFixed(1), phi: +best.x[3].toFixed(1), twist: +best.x[4].toFixed(1), visible: +best.x[5].toFixed(3), k: +best.x[6].toFixed(3), err: { sleeve: +e.sleeve.toFixed(3), wrist: +e.wrist.toFixed(3), tip: +e.tip.toFixed(3) } });
}
for (const r of table) console.log(`${r.id}  entry: [${r.entry.join(', ')}], a: ${r.a}, phi: ${r.phi}, twist: ${r.twist}, visible: ${r.visible}, k: ${r.k}   error (frame heights) hole ${r.err.sleeve} wrist ${r.err.wrist} tip ${r.err.tip}`);
console.log(`worst marker error ${worst.toFixed(3)} (largest error on either normalised axis of the key-art frame; limit 0.03)`);
if (check && worst > 0.03) process.exit(1);

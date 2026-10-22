// ASHLAR · Act I base maps — 2D top-down plan of an outdoor map (pure node, no browser, no canvas): the evaluated ground (dominant layer colour, hillshade,
// 1 m contours, water by depth), cobble lanes, walkway decks, structures (footprints in the blockout category colours), scatters, encounters, rite sites,
// landmarks + sightlines, vignettes, NPC spots, exits, spawns and their routes, and a legend. Writes docs/act1-base/<mapId>-plan.png.
// Usage: node scripts/act1-plan-preview.mjs [mapId …]   (no id: every outdoor map file in src/env/act1/maps/). Text is a 5 × 7 bitmap font (ASCII; diacritics dropped).
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';
import { evaluatePlan, smoothParams, clamp } from '../src/env/act1/outdoor.js';
import { finalWeights } from '../src/env/biomeMix.js';
import { fieldSampler } from '../src/env/act1/meadow.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'src/env/act1/maps');
const outDir = path.join(root, 'docs/act1-base');

// ---- colours ----------------------------------------------------------------------------------------------------------------------------------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
/** Blockout category colours (SPEC §6b; the same values as env/act1/blockout.js). */
const CAT = { building: '#8a8478', structure: '#6e6255', vegetation: '#55624f', rock: '#7b8088', prop: '#9a8c6e', linen: '#e4e0d6', story: '#a39b8a', npc: '#c9a86a', encounter: '#8e3b3b' };
/** Approximate albedo of the ground layers (for the plan only). */
const LAYER_RGB = {
	BIO01_peat: '#4a3a2c', BIO02_meadow: '#6b7148', BIO03_flint: '#7a7a74', BIO04_garden: '#3a2f26', BIO04_ossuary: '#8a7258', BIO05_lime: '#c8c2b2', BIO27_cradle: '#cfc6b4',
	DW_damp: '#3f3a2e', DW_grass: '#55663e', DW_dense: '#465a34', DW_sparse: '#6a6a48', DW_dirt: '#6a5840', DW_mud: '#3a3024', DW_water: '#2a3a34',
};
const layerRgb = (id) => hex(LAYER_RGB[id] ?? '#707070');

// ---- a tiny raster ------------------------------------------------------------------------------------------------------------------------------
class Raster {
	constructor(w, h, bg = [24, 26, 28]) {
		this.w = w;
		this.h = h;
		this.px = new Uint8Array(w * h * 3);
		for (let i = 0; i < w * h; i++) this.px.set(bg, i * 3);
	}

	set(x, y, rgb, a = 1) {
		x = Math.round(x);
		y = Math.round(y);
		if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
		const o = (y * this.w + x) * 3;
		for (let c = 0; c < 3; c++) this.px[o + c] = Math.round(this.px[o + c] * (1 - a) + rgb[c] * a);
	}

	disc(cx, cy, r, rgb, a = 1) {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, rgb, a);
	}

	ring(cx, cy, r, rgb, width = 1.5, a = 1) {
		for (let y = Math.floor(cy - r - width); y <= Math.ceil(cy + r + width); y++) {
			for (let x = Math.floor(cx - r - width); x <= Math.ceil(cx + r + width); x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (Math.abs(d - r) <= width / 2) this.set(x, y, rgb, a);
			}
		}
	}

	line(x0, y0, x1, y1, rgb, width = 1, a = 1, dash = 0) {
		const len = Math.hypot(x1 - x0, y1 - y0);
		const n = Math.max(1, Math.ceil(len * 2));
		for (let i = 0; i <= n; i++) {
			const t = i / n;
			if (dash && Math.floor((t * len) / dash) % 2) continue;
			const x = x0 + (x1 - x0) * t;
			const y = y0 + (y1 - y0) * t;
			if (width <= 1) this.set(x, y, rgb, a);
			else this.disc(x, y, width / 2, rgb, a);
		}
	}

	/** Even-odd scanline fill of a polygon [[x, y], …]. */
	poly(pts, rgb, a = 1) {
		const ys = pts.map((p) => p[1]);
		for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(this.h - 1, Math.ceil(Math.max(...ys))); y++) {
			const xs = [];
			for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
				const [xi, yi] = pts[i];
				const [xj, yj] = pts[j];
				if (yi > y + 0.5 !== yj > y + 0.5) xs.push(xi + ((y + 0.5 - yi) * (xj - xi)) / (yj - yi));
			}
			xs.sort((p, q) => p - q);
			for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) this.set(x, y, rgb, a);
		}
	}

	outline(pts, rgb, width = 1, a = 1) {
		for (let i = 0; i < pts.length; i++) this.line(...pts[i], ...pts[(i + 1) % pts.length], rgb, width, a);
	}

	text(x, y, str, rgb, scale = 2, shadow = true) {
		const s = String(str).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').replace(/→/g, '>').replace(/×/g, 'x').replace(/·/g, '.').toUpperCase();
		let cx = x;
		for (const ch of s) {
			const g = FONT[ch] ?? FONT['?'];
			for (let r = 0; r < 7; r++) {
				for (let c = 0; c < 5; c++) {
					if (!((g[r] >> (4 - c)) & 1)) continue;
					for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
						if (shadow) this.set(cx + c * scale + dx + 1, y + r * scale + dy + 1, [0, 0, 0], 0.85);
					}
				}
			}
			for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if ((g[r] >> (4 - c)) & 1) for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) this.set(cx + c * scale + dx, y + r * scale + dy, rgb);
			cx += 6 * scale;
		}
		return cx;
	}

	png() {
		const { w, h, px } = this;
		const raw = Buffer.alloc((w * 3 + 1) * h);
		for (let y = 0; y < h; y++) {
			raw[y * (w * 3 + 1)] = 0;
			Buffer.from(px.buffer, y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
		}
		const chunk = (type, data) => {
			const len = Buffer.alloc(4);
			len.writeUInt32BE(data.length);
			const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
			const crc = Buffer.alloc(4);
			crc.writeUInt32BE(crc32(td) >>> 0);
			return Buffer.concat([len, td, crc]);
		};
		const ihdr = Buffer.alloc(13);
		ihdr.writeUInt32BE(w, 0);
		ihdr.writeUInt32BE(h, 4);
		ihdr[8] = 8; // bit depth
		ihdr[9] = 2; // RGB
		return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
	}
}

const CRC = (() => {
	const t = new Int32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		t[n] = c;
	}
	return t;
})();
function crc32(buf) {
	let c = -1;
	for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
	return c ^ -1;
}

// 5 × 7 bitmap font (rows of 5 bits, MSB = left)
const G = (...rows) => rows.map((r) => parseInt(r, 2));
const FONT = {
	A: G('01110', '10001', '10001', '11111', '10001', '10001', '10001'), B: G('11110', '10001', '10001', '11110', '10001', '10001', '11110'), C: G('01110', '10001', '10000', '10000', '10000', '10001', '01110'),
	D: G('11100', '10010', '10001', '10001', '10001', '10010', '11100'), E: G('11111', '10000', '10000', '11110', '10000', '10000', '11111'), F: G('11111', '10000', '10000', '11110', '10000', '10000', '10000'),
	G: G('01110', '10001', '10000', '10111', '10001', '10001', '01111'), H: G('10001', '10001', '10001', '11111', '10001', '10001', '10001'), I: G('01110', '00100', '00100', '00100', '00100', '00100', '01110'),
	J: G('00111', '00010', '00010', '00010', '00010', '10010', '01100'), K: G('10001', '10010', '10100', '11000', '10100', '10010', '10001'), L: G('10000', '10000', '10000', '10000', '10000', '10000', '11111'),
	M: G('10001', '11011', '10101', '10101', '10001', '10001', '10001'), N: G('10001', '10001', '11001', '10101', '10011', '10001', '10001'), O: G('01110', '10001', '10001', '10001', '10001', '10001', '01110'),
	P: G('11110', '10001', '10001', '11110', '10000', '10000', '10000'), Q: G('01110', '10001', '10001', '10001', '10101', '10010', '01101'), R: G('11110', '10001', '10001', '11110', '10100', '10010', '10001'),
	S: G('01111', '10000', '10000', '01110', '00001', '00001', '11110'), T: G('11111', '00100', '00100', '00100', '00100', '00100', '00100'), U: G('10001', '10001', '10001', '10001', '10001', '10001', '01110'),
	V: G('10001', '10001', '10001', '10001', '10001', '01010', '00100'), W: G('10001', '10001', '10001', '10101', '10101', '10101', '01010'), X: G('10001', '10001', '01010', '00100', '01010', '10001', '10001'),
	Y: G('10001', '10001', '10001', '01010', '00100', '00100', '00100'), Z: G('11111', '00001', '00010', '00100', '01000', '10000', '11111'),
	0: G('01110', '10001', '10011', '10101', '11001', '10001', '01110'), 1: G('00100', '01100', '00100', '00100', '00100', '00100', '01110'), 2: G('01110', '10001', '00001', '00010', '00100', '01000', '11111'),
	3: G('11111', '00010', '00100', '00010', '00001', '10001', '01110'), 4: G('00010', '00110', '01010', '10010', '11111', '00010', '00010'), 5: G('11111', '10000', '11110', '00001', '00001', '10001', '01110'),
	6: G('00110', '01000', '10000', '11110', '10001', '10001', '01110'), 7: G('11111', '00001', '00010', '00100', '01000', '01000', '01000'), 8: G('01110', '10001', '10001', '01110', '10001', '10001', '01110'),
	9: G('01110', '10001', '10001', '01111', '00001', '00010', '01100'),
	' ': G('00000', '00000', '00000', '00000', '00000', '00000', '00000'), '.': G('00000', '00000', '00000', '00000', '00000', '01100', '01100'), ',': G('00000', '00000', '00000', '00000', '01100', '00100', '01000'),
	':': G('00000', '01100', '01100', '00000', '01100', '01100', '00000'), ';': G('00000', '01100', '01100', '00000', '01100', '00100', '01000'), '-': G('00000', '00000', '00000', '11111', '00000', '00000', '00000'),
	'+': G('00000', '00100', '00100', '11111', '00100', '00100', '00000'), '/': G('00000', '00001', '00010', '00100', '01000', '10000', '00000'), '(': G('00010', '00100', '01000', '01000', '01000', '00100', '00010'),
	')': G('01000', '00100', '00010', '00010', '00010', '00100', '01000'), '#': G('01010', '01010', '11111', '01010', '11111', '01010', '01010'), "'": G('01100', '00100', '01000', '00000', '00000', '00000', '00000'),
	'!': G('00100', '00100', '00100', '00100', '00100', '00000', '00100'), '?': G('01110', '10001', '00001', '00010', '00100', '00000', '00100'), '=': G('00000', '00000', '11111', '00000', '11111', '00000', '00000'),
	'>': G('01000', '00100', '00010', '00001', '00010', '00100', '01000'), '<': G('00010', '00100', '01000', '10000', '01000', '00100', '00010'), '_': G('00000', '00000', '00000', '00000', '00000', '00000', '11111'),
	'*': G('00000', '00100', '10101', '01110', '10101', '00100', '00000'), '&': G('01100', '10010', '10100', '01000', '10101', '10010', '01101'), '%': G('11000', '11001', '00010', '00100', '01000', '10011', '00011'),
	'"': G('01010', '01010', '01010', '00000', '00000', '00000', '00000'), '[': G('01110', '01000', '01000', '01000', '01000', '01000', '01110'), ']': G('01110', '00010', '00010', '00010', '00010', '00010', '01110'),
};

// ---- the plan --------------------------------------------------------------------------------------------------------------------------------------
function draw(mod) {
	const plan = mod.PLAN;
	const W = evaluatePlan(plan);
	const [x0, z0, x1, z1] = plan.bounds;
	const S = 5; // px per metre
	const pad = 16;
	const top = 44;
	const legendW = 360;
	const mw = Math.round((x1 - x0) * S);
	const mh = Math.round((z1 - z0) * S);
	const R = new Raster(mw + pad * 2 + legendW, Math.max(mh + top + pad, 900));
	const X = (x) => pad + (x - x0) * S;
	const Y = (z) => top + (z - z0) * S;

	// ground
	const sp = smoothParams(0.8);
	const masks = W.makeMasks(sp);
	const out = new Float32Array(8);
	const m = new Float32Array(8);
	const w = new Float32Array(8);
	const n = W.layers.length;
	const cols = W.layers.map((l) => layerRgb(l.id));
	const L = [-0.55, 0.62, -0.55];
	for (let py = 0; py < mh; py++) {
		for (let px = 0; px < mw; px++) {
			const x = x0 + (px + 0.5) / S;
			const z = z0 + (py + 0.5) / S;
			masks(x, z, out);
			m[0] = 1;
			for (let k = 1; k < n; k++) m[k] = out[k - 1];
			finalWeights(m, n, w);
			const rgb = [0, 0, 0];
			for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) rgb[c] += w[k] * cols[k][c];
			const wet = out[7];
			const h = W.height(x, z);
			const gx = (W.height(x + 0.4, z) - W.height(x - 0.4, z)) / 0.8;
			const gz = (W.height(x, z + 0.4) - W.height(x, z - 0.4)) / 0.8;
			const nl = Math.hypot(gx, 1, gz);
			const shade = clamp(0.55 + 0.75 * ((-gx * L[0] + L[1] - gz * L[2]) / nl - 0.55), 0.35, 1.25);
			for (let c = 0; c < 3; c++) rgb[c] *= shade * (1 - 0.18 * wet);
			const depth = W.waterDepth(x, z);
			if (depth > 0) {
				const t = clamp(depth / 0.6, 0, 1);
				const water = [18 + 10 * (1 - t), 30 + 10 * (1 - t), 30 + 8 * (1 - t)];
				for (let c = 0; c < 3; c++) rgb[c] = rgb[c] * (1 - (0.55 + 0.45 * t)) + water[c] * (0.55 + 0.45 * t);
			}
			const contour = Math.floor(h) !== Math.floor(W.height(x + 1 / S, z)) || Math.floor(h) !== Math.floor(W.height(x, z + 1 / S));
			if (contour && h > 0.3) for (let c = 0; c < 3; c++) rgb[c] *= 0.72;
			R.set(X(x) - 0.5, Y(z) - 0.5, rgb.map((v) => clamp(v, 0, 255)));
		}
	}

	// lanes (cobble), decks, dike crest
	for (const p of W.paths) {
		if (p.ribbon === 'cobble') for (let i = 1; i < p.pts.length; i++) R.line(X(p.pts[i - 1][0]), Y(p.pts[i - 1][1]), X(p.pts[i][0]), Y(p.pts[i][1]), [128, 126, 118], p.width * S, 0.85);
	}
	for (const d of W.decks) {
		const len = Math.hypot(d.bx - d.ax, d.bz - d.az);
		const nx = (-(d.bz - d.az) / len) * (d.w / 2);
		const nz = ((d.bx - d.ax) / len) * (d.w / 2);
		const quad = [[d.ax + nx, d.az + nz], [d.bx + nx, d.bz + nz], [d.bx - nx, d.bz - nz], [d.ax - nx, d.az - nz]].map(([x, z]) => [X(x), Y(z)]);
		R.poly(quad, d.kind === 'ramp' ? [150, 120, 84] : [128, 100, 70]);
		R.outline(quad, [60, 46, 34]);
	}

	// deep-water walls (never swim: the hero wades up to them; dikes and decks stand above them)
	for (const w of W.deepWalls ?? []) R.line(X(w.ax), Y(w.az), X(w.bx), Y(w.bz), w.body.startsWith('deck:') ? [214, 180, 120] : [150, 196, 214], 1.3, 0.9);

	// meadow plans (env/act1/meadow.js): the poppy drifts as red stipple by density (the lanes stay quiet)
	if (plan.field) {
		const F = fieldSampler(W);
		for (let z = z0 + 1; z < z1; z += 2.2) for (let x = x0 + 1; x < x1; x += 2.2) {
			const p = F.poppy(x, z);
			if (p > 0.18) R.disc(X(x), Y(z), 1.1 + p * 1.3, [196, 40, 44], 0.35 + 0.5 * p);
		}
	}

	// structures: footprints by category (scatter items as dots)
	for (const s of W.structures) {
		if (s.scatter !== undefined || s.deck) continue;
		const rgb = hex(CAT[s.def.category] ?? '#999999');
		const pts = s.footprint.map(([x, z]) => [X(x), Y(z)]);
		R.poly(pts, rgb, 0.92);
		R.outline(pts, rgb.map((v) => v * 0.45));
	}
	for (const s of W.structures) {
		if (s.scatter === undefined) continue;
		const proc = s.def.procedural;
		if (proc === 'grass') continue;
		const rgb = proc === 'reeds' ? [70, 92, 54] : proc === 'sedge' ? [96, 110, 70] : hex(CAT[s.def.category] ?? '#999999');
		R.disc(X(s.x), Y(s.z), proc ? 1.2 : Math.max(1.5, (s.size[0] * S) / 2.5), rgb, 0.9);
	}

	// routes (dashed), sightlines, markers
	const cyan = [96, 214, 230];
	for (const seg of W.segments) {
		const r = seg.route ?? [];
		for (let i = 1; i < r.length; i++) R.line(X(r[i - 1][0]), Y(r[i - 1][1]), X(r[i][0]), Y(r[i][1]), cyan, 2, 0.8, 4);
	}
	const yellow = [236, 204, 96];
	for (const mk of W.markers) {
		if (mk.kind !== 'sightline') continue;
		const [fx, , fz] = mk.fromP;
		let [tx, , tz] = mk.toP;
		const far = !(tx >= x0 && tx <= x1 && tz >= z0 && tz <= z1);
		if (far) {
			// clip the line to the map edge and mark the far target there
			const dx = tx - fx;
			const dz = tz - fz;
			const t = Math.min(dx < 0 ? (x0 + 2 - fx) / dx : (x1 - 2 - fx) / dx, dz < 0 ? (z0 + 2 - fz) / dz : (z1 - 2 - fz) / dz);
			const dist = Math.hypot(dx, dz);
			tx = fx + dx * t;
			tz = fz + dz * t;
			R.disc(X(tx), Y(tz), 5, yellow);
			R.text(X(tx) + 8, Y(tz) - 6, `N-GH ${Math.round(dist)} M`, yellow, 2);
		}
		R.line(X(fx), Y(fz), X(tx), Y(tz), yellow, 1.5, 0.9, 6);
	}
	const red = hex(CAT.encounter).map((v) => Math.min(255, v * 1.6));
	for (const mk of W.markers) {
		const x = X(mk.x ?? 0);
		const y = Y(mk.z ?? 0);
		if (mk.kind === 'encounter') {
			R.ring(x, y, (mk.r ?? 4) * S, red, 2.5);
			R.text(x - 12, y - 7, mk.id, [255, 160, 150], 2);
		} else if (mk.kind === 'rite') {
			R.ring(x, y, 9, [240, 240, 228], 2.5);
			R.ring(x, y, 4, [240, 240, 228], 1.5);
			R.text(x + 11, y - 7, mk.id, [240, 240, 228], 2);
		} else if (mk.kind === 'landmark') {
			R.poly([[x, y - 11], [x + 8, y], [x, y + 11], [x - 8, y]], yellow);
			R.outline([[x, y - 11], [x + 8, y], [x, y + 11], [x - 8, y]], [60, 50, 20]);
		} else if (mk.kind === 'vignette') {
			const c = mk.unmarked ? [190, 150, 230] : mk.remember ? [255, 255, 255] : [210, 190, 250];
			R.line(x - 6, y - 6, x + 6, y + 6, c, 2.5);
			R.line(x - 6, y + 6, x + 6, y - 6, c, 2.5);
			R.text(x + 8, y - 6, mk.id, c, 2);
		} else if (mk.kind === 'npc') {
			R.disc(x, y, 4.5, hex(CAT.npc));
			R.ring(x, y, 5, [40, 30, 10], 1.2);
		} else if (mk.kind === 'sound') {
			R.ring(x, y, (mk.r ?? 12) * S, [169, 199, 230], 1.2, 0.45);
			R.ring(x, y, 5, [169, 199, 230], 2);
			R.text(x + 8, y + 4, mk.id, [190, 214, 240], 2);
		} else if (mk.kind === 'exit') {
			R.poly([[x - 9, y - 9], [x + 11, y], [x - 9, y + 9]], [120, 220, 140]);
			R.text(x + 12, y - 6, mk.id, [150, 240, 170], 2);
		}
	}
	// sleep smoke banks (plan.smoke): the outline at both ends of their travel along the wind + the travel line; the open / choke beats (markers kind 'beat')
	const smokeRgb = [222, 206, 178];
	for (const zn of plan.smoke?.zones ?? []) {
		const [wx, wz] = plan.smoke.wind ?? [1, 0];
		const wl = Math.hypot(wx, wz) || 1;
		const ends = [-1, 1].map((s) => [zn.x + (wx / wl) * zn.drift * s, zn.z + (wz / wl) * zn.drift * s]);
		const rot = ((zn.rot ?? 0) * Math.PI) / 180;
		for (const [cx, cz] of ends) {
			const pts = Array.from({ length: 40 }, (_, i) => {
				const a = (i / 40) * Math.PI * 2;
				const lx = Math.cos(a) * zn.rx;
				const lz = Math.sin(a) * zn.rz;
				return [X(cx + lx * Math.cos(rot) + lz * Math.sin(rot)), Y(cz - lx * Math.sin(rot) + lz * Math.cos(rot))];
			});
			R.outline(pts, smokeRgb, 2, 0.9);
		}
		R.line(X(ends[0][0]), Y(ends[0][1]), X(ends[1][0]), Y(ends[1][1]), smokeRgb, 1.5, 0.9, 5);
		R.text(X(zn.x) - 8, Y(zn.z) - 6, zn.id, smokeRgb, 2);
	}
	for (const mk of W.markers) {
		if (mk.kind !== 'beat') continue;
		const x = X(mk.x);
		const y = Y(mk.z);
		if (mk.beat === 'open') R.ring(x, y, 7, [150, 230, 160], 2.5);
		else R.poly([[x - 7, y - 3], [x + 7, y - 3], [x + 7, y + 3], [x - 7, y + 3]], [240, 160, 80]);
		R.text(x + 9, y + 6, mk.id, mk.beat === 'open' ? [150, 230, 160] : [240, 160, 80], 2);
	}
	for (const s of W.spawns) {
		const x = X(s.x);
		const y = Y(s.z);
		R.poly([[x - 6, y - 6], [x + 6, y - 6], [x + 6, y + 6], [x - 6, y + 6]], cyan);
		R.outline([[x - 6, y - 6], [x + 6, y - 6], [x + 6, y + 6], [x - 6, y + 6]], [10, 40, 50], 1.5);
		R.text(x + 9, y + 3, s.id, cyan, 2);
	}
	// unique structure labels (no repeats): the landmarks of the plan
	const labelled = new Set();
	for (const s of W.structures) {
		if (s.scatter !== undefined || s.deck || s.run !== undefined) continue;
		const key = s.label ?? (['building', 'story'].includes(s.def.category) && W.structures.filter((q) => q.asset === s.asset).length <= 2 ? `${s.asset}` : null);
		if (!key || labelled.has(s.uid)) continue;
		labelled.add(s.uid);
		R.text(X(s.x) - 10, Y(s.z) + 8, s.asset, [250, 246, 232], 1);
	}

	// title, scale bar, legend
	R.text(pad, 12, `ASHLAR ACT I BASE MAP · ${plan.id} · ${plan.label} · ${plan.biome} · ${x1 - x0} x ${z1 - z0} M`, [236, 230, 214], 2);
	const sbx = pad + 10;
	const sby = top + mh - 18;
	R.line(sbx, sby, sbx + 20 * S, sby, [240, 240, 240], 3);
	R.text(sbx, sby - 18, '20 M', [240, 240, 240], 2);
	R.text(pad + mw - 210, top + 8, 'N UP (Z NORTH = UP)', [220, 220, 220], 2);
	let ly = top;
	const lx = pad * 2 + mw;
	const item = (draw, label, rgb = [225, 222, 210]) => {
		draw(lx + 10, ly + 8);
		R.text(lx + 26, ly + 2, label, rgb, 2);
		ly += 20;
	};
	R.text(lx, ly, 'LEGEND', [236, 230, 214], 2);
	ly += 24;
	for (const [k, v] of Object.entries(CAT)) item((x, y) => R.poly([[x - 7, y - 6], [x + 7, y - 6], [x + 7, y + 6], [x - 7, y + 6]], hex(v)), k);
	ly += 6;
	item((x, y) => R.ring(x, y, 6, red, 2), 'ENCOUNTER (R = CAMP)');
	item((x, y) => R.ring(x, y, 6, [240, 240, 228], 2), 'RITE SITE');
	item((x, y) => R.poly([[x, y - 8], [x + 6, y], [x, y + 8], [x - 6, y]], yellow), 'LANDMARK / SIGHTLINE');
	item((x, y) => (R.line(x - 5, y - 5, x + 5, y + 5, [210, 190, 250], 2), R.line(x - 5, y + 5, x + 5, y - 5, [210, 190, 250], 2)), 'VIGNETTE (PURPLE = UNMARKED)');
	item((x, y) => R.disc(x, y, 4.5, hex(CAT.npc)), 'NPC SPOT');
	item((x, y) => R.poly([[x - 7, y - 7], [x + 8, y], [x - 7, y + 7]], [120, 220, 140]), 'EXIT');
	if (W.markers.some((q) => q.kind === 'sound')) item((x, y) => R.ring(x, y, 6, [169, 199, 230], 2), 'SOUND SOURCE (R = HEARD)');
	item((x, y) => R.poly([[x - 5, y - 5], [x + 5, y - 5], [x + 5, y + 5], [x - 5, y + 5]], cyan), 'SPAWN + ROUTE');
	item((x, y) => R.poly([[x - 7, y - 3], [x + 7, y - 3], [x + 7, y + 3], [x - 7, y + 3]], [128, 100, 70]), 'WALKWAY DECK');
	item((x, y) => R.poly([[x - 7, y - 3], [x + 7, y - 3], [x + 7, y + 3], [x - 7, y + 3]], [128, 126, 118]), 'COBBLE LANE');
	if (plan.field) item((x, y) => R.disc(x, y, 3, [196, 40, 44], 0.8), 'POPPY DRIFT (DENSITY)');
	if (plan.smoke) item((x, y) => R.ring(x, y, 6, [222, 206, 178], 2), 'SLEEP SMOKE (BOTH ENDS)');
	if (W.markers.some((m) => m.kind === 'beat')) item((x, y) => (R.ring(x - 4, y, 4, [150, 230, 160], 2), R.poly([[x + 2, y - 2], [x + 9, y - 2], [x + 9, y + 2], [x + 2, y + 2]], [240, 160, 80])), 'BEAT OPEN / CHOKE');
	item((x, y) => R.line(x - 8, y, x + 8, y, [150, 196, 214], 1.5), 'DEEP WATER WALL (0.6 M)');
	ly += 8;
	R.text(lx, ly, 'GROUND LAYERS', [236, 230, 214], 2);
	ly += 22;
	for (const l of W.layers) item((x, y) => R.poly([[x - 7, y - 6], [x + 7, y - 6], [x + 7, y + 6], [x - 7, y + 6]], layerRgb(l.id)), l.id);
	ly += 8;
	const counts = {};
	for (const a of mod.ASSETS) counts[a.status] = (counts[a.status] ?? 0) + 1;
	R.text(lx, ly, 'ASSET IDS BY STATUS', [236, 230, 214], 2);
	ly += 22;
	for (const st of ['glb', 'kit', 'procedural', 'blockout']) {
		R.text(lx + 4, ly, `${st}: ${counts[st] ?? 0}`, [225, 222, 210], 2);
		ly += 18;
	}
	ly += 8;
	R.text(lx, ly, `SPAWNS ${W.spawns.length} · MARKERS ${W.markers.length}`, [225, 222, 210], 2);
	ly += 18;
	R.text(lx, ly, `PLACED ITEMS ${W.structures.length}`, [225, 222, 210], 2);
	return R;
}

const want = process.argv.slice(2);
const files = readdirSync(mapsDir).filter((f) => f.endsWith('.js'));
mkdirSync(outDir, { recursive: true });
let made = 0;
for (const f of files) {
	const id = f.replace(/\.js$/, '');
	if (want.length && !want.includes(id)) continue;
	const mod = await import(pathToFileURL(path.join(mapsDir, f)).href);
	if (mod.PLAN?.engine !== 'outdoor') {
		if (want.includes(id)) console.warn(`${id}: not an outdoor map (PLAN.engine = ${mod.PLAN?.engine}); skipped`);
		continue;
	}
	const t = performance.now();
	const R = draw(mod);
	const file = path.join(outDir, `${id}-plan.png`);
	writeFileSync(file, R.png());
	made++;
	console.log(`${id}: ${R.w} × ${R.h} px → ${path.relative(root, file)} (${Math.round(performance.now() - t)} ms)`);
}
if (!made) console.warn('no outdoor map drawn');

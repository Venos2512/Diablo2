// Contact sheet of generated Lychgate hubs (src/env/planGenHub.js, hub-gen/4: the compact WALLED hub): one card per seed (top-down SVG of the 64 × 64 m
// canvas: ground, fen and pond, the wall ring (stone town wall or wooden palisade, fade-flagged front walls dashed, gates marked), the route
// causeway → main gate → square → lychgate, plank walkways, every mass at its real footprint, doors, NPC points, exits),
// the card title = seed · wall type · ring size; then route length · walk / run seconds · cottages · attempts · checks. Click a card for the large view with layer
// toggles (labels, camera shadows, engine placements, grid). A scale inset compares 64 × 64 m with today's 216 × 160 m map.
// One self-contained HTML file, no external URLs. Open it with #seed=N to go straight to a large view, #sheet for the sheet.
// Usage: node scripts/hub-gen-preview.mjs [--seeds 13-24] [--out docs/hub-gen-preview.html] [--no-layout] [--json tmp.json]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { obbFrom, makeObb } from '../src/env/biomeLayout.js';
import { buildCatalog } from '../src/env/biomeCatalog.js';
import * as Hub from '../src/env/planGenHub.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const out = path.resolve(root, arg('--out', 'docs/hub-gen-preview.html'));
const planOnly = args.includes('--no-layout');
const seeds = parseSeeds(arg('--seeds', '13-24'));

function parseSeeds(spec) {
	const list = [];
	for (const part of String(spec).split(',')) {
		const m = /^(\d+)-(\d+)$/.exec(part.trim());
		if (m) for (let s = Number(m[1]); s <= Number(m[2]); s++) list.push(s);
		else if (part.trim()) list.push(Number(part));
	}
	return list;
}

const catalog = buildCatalog({ sizes: JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8')) });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n1 = (v) => Math.round(v * 10) / 10;
const pts = (list) => list.map((p) => `${n1(p.x)},${n1(p.z)}`).join(' ');
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, Math.max(0, t)))).join(',')})`;
const C = { water: hex('#1f3946'), land: hex('#5d5a3e'), mud: hex('#3d382b'), rock: hex('#7a766a'), hi: hex('#8b8a5c') };

function groundLayer(plan) {
	const b = plan.bounds, cell = 1, rects = [];
	for (let z = b.z0; z < b.z1; z += cell) {
		let run = null;
		for (let x = b.x0; x < b.x1 + cell; x += cell) {
			let colour = null;
			if (x < b.x1) {
				const g = plan.ground(x + 0.5, z + 0.5);
				colour = g.water ? mix(C.water, C.water, 0) : mix(mix(C.land, C.mud, g.wet * 1.1).replace(/[^\d,]/g, '').split(',').map(Number), C.rock, g.rock * 1.6 + (g.height > 0.4 ? Math.min(0.35, (g.height - 0.4) * 0.14) : 0));
			}
			if (run && run.colour === colour) { run.w += cell; continue; }
			if (run) rects.push(`<rect x="${run.x}" y="${z}" width="${run.w}" height="${cell + 0.02}" fill="${run.colour}"/>`);
			run = colour ? { x, w: cell, colour } : null;
		}
	}
	return rects.join('');
}

const FILL = {
	wall: ['#8d887a', '#1c1b17'], palisade: ['#9b7442', '#2a1c0c'], tower: ['#6e6a60', '#14130f'], pier: ['#4a463f', '#0c0b09'], joint: ['#c9b27a', '#14130f'],
	cottage: ['#a07a52', '#2b1d12'], 'A01.1': ['#a07a52', '#2b1d12'], 'A15.2': ['#b3562e', '#2b1d12'], 'A15.5': ['#d6a73e', '#2b1d12'], 'A15.3': ['#d0bb86', '#2b1d12'], 'A15.4': ['#7494b8', '#18222c'],
	'A01.5': ['#8da1ad', '#18222c'], 'A15.6': ['#8f65ba', '#201830'], 'A02.1': ['#d8c27a', '#2b2410'], 'A01.3': ['#767266', '#1c1b17'], 'N01': ['#8d62a0', '#241830'], 'N02': ['#5d5953', '#1c1b17'],
	'A04.2': ['#4f7a3c', '#14240e'], 'A01.6': ['#a07f3a', '#2b2010'], 'A01.4': ['#9d8a5a', '#2b2410'],
};
const SHORT = { 'A02.1x': 'Lychgate', 'A01.1': 'Cottage', 'A15.2': 'Forge', 'A15.5': 'Stall', 'A15.3': 'Name board', 'A15.4': 'Bell', 'A01.5': 'Well', 'A15.6': "Osric's post", 'A02.1': 'Lychgate', 'N01': 'Vault door', 'A01.6': 'Eel rack', 'A04.2': 'Willow' };

function wallSvg(m, type) {
	const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw);
	const key = m.piece === 'module' ? (type === 'palisade' ? 'palisade' : 'wall') : m.piece === 'tower' ? 'tower' : m.piece === 'pier' ? 'pier' : m.piece === 'joint' ? 'joint' : null;
	const [fill, stroke] = key ? FILL[key] : (FILL[m.glb] ?? FILL.wall);
	const fade = m.fade ? ' stroke-dasharray="0.5 0.35"' : '';
	let s = `<polygon points="${pts(fp.pts)}" fill="${fill}" fill-opacity="${m.fade ? 0.5 : 0.95}" stroke="${m.fade ? '#e8d9a0' : stroke}" stroke-width="${m.fade ? 0.2 : 0.16}"${fade}><title>${esc(m.label)} · ${m.glb} · ${m.footprint.w} × ${m.footprint.d} m · h ${m.height} m${m.fade ? ' · fade (front wall)' : ''}</title></polygon>`;
	if (m.piece === 'module' && type === 'palisade') { // stakes along the wall
		const t = { x: Math.cos(m.yaw), z: -Math.sin(m.yaw) }, n = Math.max(2, Math.round(m.footprint.w / 0.9));
		for (let i = 0; i < n; i++) { const u = ((i + 0.5) / n - 0.5) * m.footprint.w; s += `<circle cx="${n1(m.at.x + t.x * u)}" cy="${n1(m.at.z + t.z * u)}" r="0.42" fill="#d2b078" fill-opacity="${m.fade ? 0.5 : 0.95}" stroke="#2a1c0c" stroke-width="0.07"/>`; }
	} else if (m.piece === 'module') {
		const t = { x: Math.cos(m.yaw), z: -Math.sin(m.yaw) }, a = { x: m.at.x - t.x * m.footprint.w / 2, z: m.at.z - t.z * m.footprint.w / 2 }, b = { x: m.at.x + t.x * m.footprint.w / 2, z: m.at.z + t.z * m.footprint.w / 2 };
		s += `<line x1="${n1(a.x)}" y1="${n1(a.z)}" x2="${n1(b.x)}" y2="${n1(b.z)}" stroke="#c9c4b4" stroke-width="0.12" stroke-opacity="0.55"/>`;
	}
	if (m.piece === 'tower') s += `<line x1="${n1(fp.x0)}" y1="${n1(fp.z0)}" x2="${n1(fp.x1)}" y2="${n1(fp.z1)}" stroke="#aaa" stroke-width="0.1"/><line x1="${n1(fp.x0)}" y1="${n1(fp.z1)}" x2="${n1(fp.x1)}" y2="${n1(fp.z0)}" stroke="#aaa" stroke-width="0.1"/>`;
	return s;
}

function massSvg(m, big, type) {
	if (m.tag === 'wall' && !['lychgate', 'vault', 'wing'].includes(m.piece)) return wallSvg(m, type);
	const [fill, stroke] = FILL[m.glb] ?? ['#9a8466', '#2b2010'];
	const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw);
	const f = { x: Math.sin(m.yaw), z: Math.cos(m.yaw) };
	let s = '';
	if (m.glb === 'A04.2') s += `<circle cx="${m.at.x}" cy="${m.at.z}" r="2.5" fill="#4f7a3c" fill-opacity="0.35" stroke="#7fae66" stroke-opacity="0.5" stroke-width="0.12"/>`;
	s += `<polygon points="${pts(fp.pts)}" fill="${fill}" fill-opacity="${m.collision === false ? 0.45 : 0.95}" stroke="${stroke}" stroke-width="0.18"><title>${esc(m.label)} · ${m.glb} · ${m.footprint.w} × ${m.footprint.d} m · h ${m.height} m</title></polygon>`;
	// front mark: a short bar on the +z (front) side
	const fx = m.at.x + f.x * m.footprint.d / 2, fz = m.at.z + f.z * m.footprint.d / 2, rx = f.z * Math.min(m.footprint.w / 2, 1.6), rz = -f.x * Math.min(m.footprint.w / 2, 1.6);
	if (m.footprint.d > 0.9 && m.footprint.w > 0.9) s += `<line x1="${n1(fx - rx)}" y1="${n1(fz - rz)}" x2="${n1(fx + rx)}" y2="${n1(fz + rz)}" stroke="#fff3c4" stroke-width="0.3" stroke-opacity="0.9"/>`;
	if (m.glb === 'A01.5') s += `<circle cx="${m.at.x}" cy="${m.at.z}" r="0.7" fill="#0f1a22"/>`;
	if (m.tag === 'wall' && m.fade) s += `<polygon points="${pts(fp.pts)}" fill="none" stroke="#e8d9a0" stroke-width="0.18" stroke-dasharray="0.5 0.35"/>`;
	return s;
}

function labelSvg(m, big) {
	if (m.tag === 'wall' && !['vault'].includes(m.piece)) return ''; // the gates carry their own tags; the lychgate is labelled by its threshold arrow
	if (['A15.3', 'A15.4'].includes(m.glb)) return ''; // the NPC label of the board and the bell already names them
	const name = SHORT[m.glb] ?? null;
	if (!name || (m.glb === 'A04.2' && !big)) return '';
	if (!big && ['A01.1'].includes(m.glb) && !/Edda/.test(m.label)) return '';
	const text = /Edda/.test(m.label) ? "Edda's house" : name;
	return `<text x="${n1(m.at.x)}" y="${n1(m.at.z + 0.55)}" text-anchor="middle" font-size="${big ? 1.9 : 2.4}" fill="#fff6dc" stroke="#000" stroke-width="${big ? 0.35 : 0.5}" paint-order="stroke">${esc(text)}</text>`;
}

function pathSvg(plan) {
	let s = '';
	const route = plan.paths.find((p) => p.id === 'route');
	const cw = plan.hub.causeway;
	for (const p of plan.paths) {
		if (p.id === 'route') continue;
		const col = p.deck ? '#7a5b36' : '#a6915f';
		s += `<polyline points="${pts(p.points)}" fill="none" stroke="${col}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.95"><title>${esc(p.id)}</title></polyline>`;
		if (p.deck) {
			const a = p.points[0], b = p.points[p.points.length - 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / 4));
			for (let i = 0; i <= n; i++) {
				const t = Math.min(1, (i * 4) / L), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L;
				s += `<line x1="${n1(x - nx * 1.1)}" y1="${n1(z - nz * 1.1)}" x2="${n1(x + nx * 1.1)}" y2="${n1(z + nz * 1.1)}" stroke="#2b1d12" stroke-width="0.18"/>`;
			}
		}
	}
	// the route: causeway part (first causeway.length metres) on stone-and-plank, then the dirt route
	let acc = 0;
	const cwPts = [], dirt = [];
	for (let i = 0; i < route.points.length; i++) {
		if (i) acc += Math.hypot(route.points[i].x - route.points[i - 1].x, route.points[i].z - route.points[i - 1].z);
		(acc <= cw.length + 0.01 ? cwPts : dirt).push(route.points[i]);
	}
	if (cwPts.length && dirt.length) cwPts.push(dirt[0]);
	s += `<polyline points="${pts(dirt)}" fill="none" stroke="#c4aa72" stroke-width="${route.width}" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.9"><title>route</title></polyline>`;
	s += `<polyline points="${pts(cwPts)}" fill="none" stroke="#7d6a50" stroke-width="${route.width * 0.62}" stroke-linecap="butt"><title>fen causeway</title></polyline>`;
	for (let i = 0; i < cw.segments; i++) {
		const t = i / cw.segments, a = plan.hub.causeway.from, b = plan.hub.causeway.to, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, L = Math.hypot(b.x - a.x, b.z - a.z), nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L;
		s += `<line x1="${n1(x - nx * 1.0)}" y1="${n1(z - nz * 1.0)}" x2="${n1(x + nx * 1.0)}" y2="${n1(z + nz * 1.0)}" stroke="#2b2418" stroke-width="0.16"/>`;
	}
	return s;
}

function doorsSvg(plan) {
	return plan.doors.map((d) => {
		const f = { x: Math.sin(d.yaw), z: Math.cos(d.yaw) }, r = { x: f.z, z: -f.x }, w = d.width / 2;
		const x = d.at.x, z = d.at.z, col = d.exit ? '#ff9f3a' : '#f4e3a5';
		let s = `<line x1="${n1(x - r.x * w)}" y1="${n1(z - r.z * w)}" x2="${n1(x + r.x * w)}" y2="${n1(z + r.z * w)}" stroke="${col}" stroke-width="0.5"/>`;
		s += `<polygon points="${n1(x + f.x * 1.5)},${n1(z + f.z * 1.5)} ${n1(x + f.x * 0.5 + r.x * 0.5)},${n1(z + f.z * 0.5 + r.z * 0.5)} ${n1(x + f.x * 0.5 - r.x * 0.5)},${n1(z + f.z * 0.5 - r.z * 0.5)}" fill="${col}" fill-opacity="0.9"><title>${esc(d.id)}${d.exit ? ' → ' + esc(d.exit.to) : ''}</title></polygon>`;
		if (d.poppy) s += `<circle cx="${n1(x + f.x * 0.45)}" cy="${n1(z + f.z * 0.45)}" r="0.32" fill="#d8352b"/>`;
		if (d.exit) s += `<circle cx="${x}" cy="${z}" r="1.5" fill="none" stroke="#ff9f3a" stroke-width="0.3" stroke-dasharray="0.6 0.4"/>`;
		return s;
	}).join('');
}

function npcSvg(plan, big) {
	return plan.interactions.map((i) => `<g><circle cx="${i.at.x}" cy="${i.at.z}" r="${i.radius}" fill="#e3c04a" fill-opacity="0.18" stroke="#e3c04a" stroke-width="0.2" stroke-dasharray="0.5 0.35"/><circle cx="${i.at.x}" cy="${i.at.z}" r="0.35" fill="#ffe28a"/>${big ? `<text x="${i.at.x}" y="${n1(i.at.z - i.radius - 0.4)}" font-size="1.8" text-anchor="middle" fill="#ffe9a8" stroke="#000" stroke-width="0.3" paint-order="stroke">${esc(i.label)}</text>` : ''}<title>${esc(i.label)}</title></g>`).join('');
}

function thresholdSvg(plan) {
	const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
	const mk = (e, text, col) => {
		const [ox, oz] = OUT[e.edge], x = e.at.x + ox * (e.id === 'causeway' ? 0.4 : 2.8), z = e.at.z + oz * (e.id === 'causeway' ? 0.4 : 2.8), tx = -oz, tz = ox;
		const tri = `${n1(x + ox * 1.4)},${n1(z + oz * 1.4)} ${n1(x - ox * 1.0 + tx * 1.2)},${n1(z - oz * 1.0 + tz * 1.2)} ${n1(x - ox * 1.0 - tx * 1.2)},${n1(z - oz * 1.0 - tz * 1.2)}`;
		const anchor = 'middle', lx = ox ? x : x, lz = oz ? z + oz * 3.4 + 0.7 : z + 3.6;
		return `<g><polygon points="${tri}" fill="${col}" stroke="#000" stroke-width="0.2"/><text x="${n1(lx)}" y="${n1(lz)}" font-size="2.2" text-anchor="${anchor}" fill="#fff" stroke="#000" stroke-width="0.4" paint-order="stroke">${text}</text></g>`;
	};
	const g = plan.hub.gates, tag = (p, text, col, dx, dz) => `<text x="${n1(p.x + dx)}" y="${n1(p.z + dz)}" font-size="2" text-anchor="middle" fill="${col}" stroke="#000" stroke-width="0.4" paint-order="stroke">${text}</text>`;
	const out = (e) => ({ N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] })[e];
	const [mx, mz] = out(g.main.edge), [lx, lz] = out(g.lychgate.edge);
	return mk(plan.exits[0], 'causeway', '#7ec57a') + mk(plan.exits[1], 'hill lane → church', '#ffcf5a') + tag(g.main.at, 'MAIN GATE', '#9fe29a', mx * 6.5, mz * 4.2 + 0.7) + tag(g.lychgate.at, 'LYCHGATE', '#ffcf5a', lx * 6.5, lz * 4.2 + 0.7);
}

function shadowsSvg(plan) {
	return plan.masses.filter((m) => m.height >= 2 && m.collision !== false).map((m) => {
		const fp = makeObb(m.at.x, m.at.z, m.footprint.w / 2, m.footprint.d / 2, m.yaw), L = m.height * Hub.HUB_RULES.shadowSlope, k = Math.SQRT1_2 * L;
		const all = [];
		for (const p of fp.pts) { all.push(p, { x: p.x - k, z: p.z - k }); }
		return `<polygon points="${pts(hull(all))}" fill="#9a6ad6" fill-opacity="0.10" stroke="#9a6ad6" stroke-opacity="0.4" stroke-width="0.1"/>`;
	}).join('');
}
function hull(points) {
	const p = points.slice().sort((a, b) => a.x - b.x || a.z - b.z), cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x), lo = [], up = [];
	for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
	for (const q of p.slice().reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
	return lo.slice(0, -1).concat(up.slice(0, -1));
}

function engineSvg(result) {
	if (!result) return '';
	const col = { guide: '#ffb347', mass: '#999', cluster: '#c9a', trace: '#c66', event: '#c66' };
	return result.placements.filter((p) => !p.authored).map((p) => `<polygon points="${pts(obbFrom(p.footprint).pts)}" fill="${col[p.group] ?? '#8fb1a0'}" fill-opacity="0.75" stroke="#000" stroke-width="0.08"><title>${esc(p.id)} (${p.group})</title></polygon>`).join('');
}

function gridSvg(b) {
	let s = '';
	for (let v = Math.ceil(b.x0 / 10) * 10; v <= b.x1; v += 10) s += `<line x1="${v}" y1="${b.z0}" x2="${v}" y2="${b.z1}" stroke="#fff" stroke-opacity="0.14" stroke-width="0.08"/><text x="${v}" y="${b.z0 - 0.6}" font-size="1.6" fill="#9fb4c0" text-anchor="middle">${v}</text>`;
	for (let v = Math.ceil(b.z0 / 10) * 10; v <= b.z1; v += 10) s += `<line x1="${b.x0}" y1="${v}" x2="${b.x1}" y2="${v}" stroke="#fff" stroke-opacity="0.14" stroke-width="0.08"/><text x="${b.x0 - 0.6}" y="${v + 0.5}" font-size="1.6" fill="#9fb4c0" text-anchor="end">${v}</text>`;
	return s;
}

function cardSvg(e, big) {
	const plan = e.plan, b = plan.bounds, sq = plan.square;
	const waterPolys = plan.water.map((w) => `<polygon points="${pts(w.polygon)}" fill="none" stroke="#0e1f28" stroke-width="0.25" stroke-opacity="0.8"/>`).join('');
	const cam = `<g transform="translate(${b.x1 - 9} ${b.z1 - 9})" opacity="0.9"><line x1="6" y1="6" x2="0.8" y2="0.8" stroke="#9fd0ff" stroke-width="0.45"/><path d="M0 0l2.8 0.8l-2 2z" fill="#9fd0ff"/><text x="3" y="9.6" font-size="1.7" fill="#cfe6ff" text-anchor="middle">camera looks NW</text></g>`;
	const compass = `<text x="${b.x0 + 1.2}" y="${b.z0 + 2.4}" font-size="2" fill="#cfe6ff">N ↑</text>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x0 - 11} ${b.z0 - 8} ${b.x1 - b.x0 + 22} ${b.z1 - b.z0 + 16}" preserveAspectRatio="xMidYMid meet">
<rect x="${b.x0 - 12}" y="${b.z0 - 9}" width="${b.x1 - b.x0 + 24}" height="${b.z1 - b.z0 + 18}" fill="#142630"/><rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" fill="#1f3946"/>
<g id="g-ground">${groundLayer(plan)}</g>${waterPolys}
<circle cx="${sq.x}" cy="${sq.z}" r="${sq.r}" fill="#e6d9a8" fill-opacity="0.13" stroke="#e6d9a8" stroke-opacity="0.65" stroke-width="0.25" stroke-dasharray="1 0.6"><title>square r ${sq.r} m</title></circle>
<g id="g-paths">${pathSvg(plan)}</g>
<g id="g-shadows" class="layer-shadows">${shadowsSvg(plan)}</g>
<g id="g-masses">${plan.masses.map((m) => massSvg(m, big, plan.hub.wall?.type)).join('')}</g>
<g id="g-engine" class="layer-engine">${engineSvg(e.map?.result ?? null)}</g>
<g id="g-doors">${doorsSvg(plan)}</g><g id="g-npc">${npcSvg(plan, big)}</g>
<g id="g-labels" class="layer-labels">${plan.masses.map((m) => labelSvg(m, big)).join('')}</g>
<g id="g-thresholds">${thresholdSvg(plan)}</g>
<g id="g-grid" class="layer-grid">${gridSvg(b)}</g>
<rect x="${b.x0}" y="${b.z0}" width="${b.x1 - b.x0}" height="${b.z1 - b.z0}" fill="none" stroke="#e8e0cc" stroke-width="0.25"/>
${compass}${cam}
</svg>`;
}

function scaleInset() {
	const W = 216, H = 160, k = 0.6;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * k + 10}" height="${H * k + 28}" viewBox="-5 -5 ${W + 10} ${H + 40}" style="background:#161b1e;border:1px solid #394147">
<rect x="0" y="0" width="${W}" height="${H}" fill="#2c3a3d" stroke="#8aa" stroke-width="1"/><text x="${W / 2}" y="${H / 2 + 4}" font-size="11" fill="#9db" text-anchor="middle">today act1Lychgate 216 × 160 m</text>
<rect x="8" y="8" width="64" height="64" fill="#a34a38" fill-opacity="0.85" stroke="#fff" stroke-width="1"/><rect x="17.5" y="17.5" width="45" height="45" fill="#d98a3a" fill-opacity="0.9" stroke="#ffe" stroke-width="1" stroke-dasharray="3 2"/><text x="40" y="38" font-size="7.5" fill="#fff" text-anchor="middle">wall ring</text><text x="40" y="47" font-size="7.5" fill="#fff" text-anchor="middle">≈ 45 × 45 m</text><text x="40" y="67" font-size="6" fill="#fdd" text-anchor="middle">canvas 64 × 64</text>
<text x="0" y="${H + 20}" font-size="10" fill="#cde">area ${Math.round((64 * 64) / (216 * 160) * 100)} % of today (4096 vs 34 560 m²)</text></svg>`;
}

// ---- data
const entries = [];
for (const seed of seeds) {
	const t0 = performance.now();
	let map = null, plan, checks = null, attempts = 1;
	if (!planOnly && Hub.generateHubMap) {
		map = Hub.generateHubMap(seed, catalog);
		plan = map.plan; attempts = map.attempts.length;
		checks = map.hubChecks ?? null;
	} else {
		plan = Hub.generateHubPlan(seed);
		if (Hub.checkHubPlan && !plan.failed) checks = Hub.checkHubPlan(plan);
	}
	if (!plan || plan.failed) { // every attempt threw or produced no plan: say so on the sheet instead of dropping the card
		console.log(`seed ${seed}: no plan after ${attempts} attempt(s)`);
		entries.push({ seed, plan: null, map, checks: null, engineChecks: null, attempts, failed: ['no plan'], waived: [], ms: performance.now() - t0 });
		continue;
	}
	const engineChecks = map?.result?.report?.checks ?? null;
	const waivedIds = new Set((map?.waived ?? []).map((w) => w.id));
	const failed = [...(checks ?? []).filter((c) => !c.pass).map((c) => `hub:${c.id}`), ...(engineChecks ?? []).filter((c) => !c.pass && !waivedIds.has(c.id)).map((c) => `engine:${c.id}`)];
	entries.push({ seed, plan, map, checks, engineChecks, attempts, failed, waived: map?.waived ?? [], ms: performance.now() - t0 });
	console.log(`seed ${seed}: ${plan.hub.inEdge}→${plan.hub.gateEdge} route ${plan.meta.route.length} m · ${plan.meta.route.walkS} s walk · cottages ${plan.meta.cottages} · attempts ${attempts} · ${map ? (map.ok ? 'ACCEPTED' : 'REJECTED') : 'plan only'}${failed.length ? ` · failed ${failed.join(', ')}` : ''}`);
}

const cardTitle = (e) => {
	if (!e.plan) return { head: `seed ${e.seed} · NO PLAN`, line: `${e.attempts} attempt(s) produced no plan`, line2: planOnly ? 'plan only: attempt 0 only (--no-layout)' : 'all attempts failed' };
	const m = e.plan.meta.route, h = e.plan.hub;
	const nChecks = (e.checks?.length ?? 0) + (e.engineChecks?.length ?? 0), nPass = nChecks - e.failed.length; // a waived engine check counts as passed (it is named in the large view)
	return { head: `seed ${e.seed} · ${h.wall.type === 'stone' ? 'stone town wall' : 'wooden palisade'} · ${n1(h.ring.W)} × ${n1(h.ring.H)} m`, line: `route ${m.length} m · walk ${Math.round(m.walkS)} s · run ${Math.round(m.runS)} s · ${h.inEdge}→${h.gateEdge}`, line2: `${e.plan.meta.cottages} cottages · ${planOnly ? 'plan only, attempt 0 (no engine)' : `${e.attempts} attempt${e.attempts === 1 ? '' : 's'}${h.familyRound > 0 ? ' (fallback gate pair)' : ''}`} · ${nChecks ? `${nPass}/${nChecks} ${planOnly ? 'hub ' : ''}checks${e.waived.length ? ` (${e.waived.length} waived)` : ''}` : 'no checks'}${e.map ? (e.map.ok ? ' ✓' : ' ✗ REJECTED: best of the attempts shown (fell back)') : ''} · ${e.plan.meta.generator}` };
};

const noCard = (e, t) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 86 80"><rect width="86" height="80" fill="#2a1c1c"/><text x="43" y="38" font-size="6" text-anchor="middle" fill="#ff9f8f">no plan</text><text x="43" y="47" font-size="3.4" text-anchor="middle" fill="#d9b7ae">${esc(t.line)}</text></svg>`;
const data = entries.map((e) => {
	const t = cardTitle(e);
	if (!e.plan) return { seed: e.seed, head: t.head, line: t.line, line2: t.line2, ok: false, small: noCard(e, t), big: noCard(e, t), route: null, hub: null, cottages: 0, attempts: e.attempts, failed: e.failed, checks: [], masses: 0, doors: 0, exits: [], missing: true };
	return {
		seed: e.seed, head: t.head, line: t.line, line2: t.line2, ok: e.failed.length === 0, small: cardSvg(e, false), big: cardSvg(e, true),
		route: e.plan.meta.route, hub: { ...e.plan.hub, dressed: e.plan.hub.dressed }, cottages: e.plan.meta.cottages, attempts: e.attempts, failed: e.failed,
		checks: [...(e.checks ?? []).map((c) => [`hub:${c.id}`, c.pass, c.rule]), ...(e.engineChecks ?? []).map((c) => [`engine:${c.id}${e.waived.some((w) => w.id === c.id) ? ' (waived: ' + e.waived.find((w) => w.id === c.id).why + ')' : ''}`, c.pass || e.waived.some((w) => w.id === c.id), c.rule])],
		masses: e.plan.masses.length, doors: e.plan.doors.length, exits: e.plan.doors.filter((d) => d.exit).map((d) => d.exit.to).concat(e.plan.exits.map((x) => x.to)),
	};
});

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lychgate hub · seed generator (64 × 64 m)</title>
<style>
body{margin:0;background:#12161a;color:#dfe6ea;font:13px/1.45 system-ui,Segoe UI,sans-serif}
header{padding:10px 16px;display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;border-bottom:1px solid #2a3238}
header h1{font-size:17px;margin:0 0 4px}header p{margin:0;color:#9fb0ba;max-width:880px}
#sheet{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:12px 16px}
.card{background:#1a2025;border:1px solid #2c353c;border-radius:6px;cursor:pointer;overflow:hidden}
.card:hover{border-color:#7fa6c4}.card.bad{border-color:#8a3b34}
.card svg{display:block;width:100%;height:auto;aspect-ratio:86/80}
.card .t{padding:5px 8px 7px}.card .t b{font-size:13px}.card .t div{color:#a9b8c2;font-size:12px}
#big{display:none;padding:12px 16px}#big.on{display:block}
#big .row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
#bigsvg{width:min(86vh,720px);flex:none}#bigsvg svg{width:100%;height:auto;display:block;border:1px solid #2c353c}
#info{flex:1;min-width:300px;max-width:560px}#info table{border-collapse:collapse;width:100%}#info td{padding:2px 6px;border-bottom:1px solid #232b31;vertical-align:top}
.pass{color:#7ec57a}.fail{color:#ff7b6b}.toggles label{margin-right:12px;white-space:nowrap}
button{background:#25303a;color:#dfe6ea;border:1px solid #3a4852;border-radius:4px;padding:4px 10px;cursor:pointer}
.legend span{display:inline-block;margin:2px 8px 2px 0}.legend i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:4px;vertical-align:-1px}
.layer-shadows,.layer-engine,.layer-grid{display:none}.show-shadows .layer-shadows,.show-engine .layer-engine,.show-grid .layer-grid{display:inline}
.hide-labels .layer-labels{display:none}
</style></head><body>
<header><div><h1>Lychgate hub · ${Hub.HUB_GEN_VERSION} · ${entries.length} seeds · walled, 64 × 64 m canvas</h1><p>Layout only (2D). The hub sits inside ONE wall ring of 40–48 m per side (stone town wall or wooden palisade); outside the wall is fen water — no dry ground except a small apron at the main gate (where the causeway lands) and the hill lane behind the lychgate, which is the only way to it. 4 stilt cottages incl. Edda's house (a fifth in ≈ 6 % of the seeds). Main gate on a front wall (S / E) where the causeway arrives, Osric's post just inside; lychgate set into a back wall (N / W) with a hill lane to the church; vault door in a back wall. Front walls (S / E, dashed) are fade-flagged: the 3D fades them when the hero is behind (camera looks north-west); back walls stay full height. Hero walks 1.6 m/s, runs 4.0 m/s; main gate → square → lychgate is 35–55 m. Click a card for the large view.</p>
<p class="legend"><span><i style="background:#a07a52"></i>stilt cottage</span><span><i style="background:#b3562e"></i>forge</span><span><i style="background:#d6a73e"></i>stall</span><span><i style="background:#d0bb86"></i>name board</span><span><i style="background:#7494b8"></i>bell frame</span><span><i style="background:#8da1ad"></i>well</span><span><i style="background:#8f65ba"></i>watch post</span><span><i style="background:#d8c27a"></i>lychgate</span><span><i style="background:#8d62a0"></i>vault door</span><span><i style="background:#8d887a"></i>stone wall</span><span><i style="background:#9b7442"></i>palisade</span><span><i style="background:#6e6a60"></i>tower / pier (blockout)</span><span><i style="border:1px dashed #e8d9a0;background:none"></i>fade (front wall)</span><span><i style="background:#ff9f3a"></i>exit door</span><span><i style="background:#e3c04a"></i>NPC point</span></p></div>${scaleInset()}</header>
<div id="sheet"></div>
<div id="big"><p><button id="back">← sheet</button> <span class="toggles"><label><input type="checkbox" id="t-labels" checked> labels</label><label><input type="checkbox" id="t-shadows"> camera shadows</label><label><input type="checkbox" id="t-engine"> engine placements</label><label><input type="checkbox" id="t-grid"> 10 m grid</label></span> <button id="prev">◀</button> <button id="next">▶</button></p><div class="row"><div id="bigsvg"></div><div id="info"></div></div></div>
<script>
const DATA=${JSON.stringify(data)};
const sheet=document.getElementById('sheet'),big=document.getElementById('big'),bigsvg=document.getElementById('bigsvg'),info=document.getElementById('info');
let cur=null;
DATA.forEach(d=>{const c=document.createElement('div');c.className='card'+(d.ok?'':' bad');c.innerHTML=d.small+'<div class="t"><b>'+d.head+'</b><div>'+d.line+'</div><div>'+d.line2+'</div></div>';c.onclick=()=>show(d.seed);sheet.appendChild(c);});
function show(seed){const d=DATA.find(x=>x.seed===seed);if(!d)return;cur=seed;sheet.style.display='none';big.classList.add('on');bigsvg.innerHTML=d.big;location.hash='seed='+seed;
 if(d.missing){info.innerHTML='<h2>'+d.head+'</h2><p class="fail">'+d.line+' — '+d.line2+'</p>';return;}
 const r=d.route,h=d.hub,w=h.wall,fw=d.checks.find(c=>c[0]==='hub:front-wall');
 info.innerHTML='<h2 style="margin:0 0 6px">'+d.head+'</h2><table>'+
 '<tr><td>wall</td><td><b>'+(w.type==='stone'?'stone town wall (flint, N02 4 × 0.73 m, h 2.16)':'wooden palisade (palisade.wall_a 3.76 × 2.24 m, h 3.32)')+'</b><br>ring '+h.ring.W+' × '+h.ring.H+' m · corners '+h.ring.style+' · '+w.total+' pieces ('+Object.entries(w.pieces).map(([k,v])=>v+' '+k).join(', ')+')<br>front-wall policy: <b>fade</b> — '+w.fade+' pieces fade-flagged (dashed), back walls full height</td></tr>'+
 '<tr><td>main route</td><td><b>'+r.length+' m</b> gate → square → lychgate · walk '+r.walkS+' s · run '+r.runS+' s<br>causeway '+r.causeway+' m ('+h.causeway.segments+' segments) · gate → square '+r.toSquare+' m · square → lychgate '+r.squareToGate+' m · from the map edge '+r.total+' m</td></tr>'+
 '<tr><td>gates</td><td>main gate '+h.gates.main.edge+' wall · lychgate '+h.gates.lychgate.edge+' wall · vault door '+h.gates.vault.edge+' wall</td></tr>'+
 '<tr><td>pond / Edda</td><td>'+(h.pond?'pond '+(h.pond.rpa*2).toFixed(1)+' × '+(h.pond.rpb*2).toFixed(1)+' m · walkway '+(h.edda?h.edda.segments:0)+' × 4 m segments':'—')+'</td></tr>'+
 '<tr><td>arrangement</td><td>cottages '+d.cottages+' ('+h.style+') · masses '+d.masses+' · doors '+d.doors+' · attempts '+d.attempts+'</td></tr>'+
 '<tr><td>exits</td><td>'+d.exits.join('<br>')+'</td></tr>'+
 '<tr><td>dressing</td><td>'+Object.entries(h.dressed).map(([k,v])=>k+' '+v).join(' · ')+' · willows '+h.willows+(h.unplaced.length?'<br><span class="fail">unplaced: '+h.unplaced.join(', ')+'</span>':'')+'</td></tr>'+
 '</table><h3 style="margin:10px 0 4px">checks</h3><table>'+d.checks.map(c=>'<tr><td class="'+(c[1]?'pass':'fail')+'">'+(c[1]?'✓':'✗')+'</td><td>'+c[0]+'</td></tr>').join('')+'</table>';
 apply();}
function apply(){const on=id=>document.getElementById(id).checked;const cl=big.classList;cl.toggle('show-shadows',on('t-shadows'));cl.toggle('show-engine',on('t-engine'));cl.toggle('show-grid',on('t-grid'));cl.toggle('hide-labels',!on('t-labels'));}
for(const id of ['t-labels','t-shadows','t-engine','t-grid'])document.getElementById(id).onchange=apply;
document.getElementById('back').onclick=()=>{big.classList.remove('on');sheet.style.display='';location.hash='sheet';};
const step=k=>{const i=DATA.findIndex(x=>x.seed===cur);show(DATA[(i+k+DATA.length)%DATA.length].seed);};
document.getElementById('prev').onclick=()=>step(-1);document.getElementById('next').onclick=()=>step(1);
const m=/seed=(\\d+)/.exec(location.hash);if(m)show(Number(m[1]));
</script></body></html>`;
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
if (arg('--json', null)) writeFileSync(arg('--json'), JSON.stringify(data.map(({ small, big, ...d }) => d), null, 1));
console.log(`wrote ${path.relative(root, out)} (${Math.round(html.length / 1024)} KB, ${entries.length} seeds)`);

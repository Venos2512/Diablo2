// Top-down review sheet of the demo layout: one self-contained HTML + SVG (no external URLs) for reading the result of the
// biome layout engine without the 3D lab: ground, zones, play space, footprints by class, use and occlusion zones,
// decisions, ecology, drops and the report. Layers toggle; wheel zooms, drag pans.
// Usage: npm run preview:layout [-- --seed N] [--out docs/biome-layout-preview.html]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { layoutBiome, obbFrom, toWorld } from '../src/env/biomeLayout.js';
import { DEMO_PLAN, demoGround } from '../src/env/biomeLayoutDemo.js';
import { buildCatalog } from '../src/env/biomeCatalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const out = path.resolve(root, arg('--out', 'docs/biome-layout-preview.html'));
const seed = Number(arg('--seed', DEMO_PLAN.seed));

const sizes = JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8'));
const catalog = buildCatalog({ sizes });
const plan = { ...DEMO_PLAN, seed };
const result = layoutBiome(plan, catalog);
const b = plan.bounds;
const W = b.x1 - b.x0, D = b.z1 - b.z0;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const n = (v) => Math.round(v * 100) / 100;
const pts = (list) => list.map((p) => `${n(p.x)},${n(p.z)}`).join(' ');

const COLOR = { obstacle: '#9a7b57', destructible: '#b9955a', decor: '#7d8a63', interactive: '#e3c04a', hazard: '#c0392b', guide: '#ff9f3a' };
const GROUND = { water: '#27414f', mud: '#463e2f', rock: '#68675f', blood: '#6a2b2b', grass: '#3b4a2c', dirt: '#56493a' };

// ground class on a 2 m grid, horizontal runs merged. Neutral class colours only: the demo's own grass channel is NOT drawn (it is a
// ground input, unrelated to the engine's patch field, and a tint on a 2 m grid reads as a checkerboard); the grass the engine grows
// is the Tufts layer.
function groundLayer() {
	const cell = 2, rects = [];
	for (let z = b.z0; z < b.z1; z += cell) {
		let run = null;
		for (let x = b.x0; x < b.x1 + cell; x += cell) {
			let colour = null;
			if (x < b.x1) {
				const g = demoGround(x + cell / 2, z + cell / 2);
				const cls = g.water ? 'water' : g.wet >= 0.6 ? 'mud' : g.rock >= 0.5 ? 'rock' : g.blood >= 0.35 ? 'blood' : g.grass >= 0.4 ? 'grass' : 'dirt';
				colour = GROUND[cls];
			}
			if (run && run.colour === colour) { run.w += cell; continue; }
			if (run) rects.push(`<rect x="${run.x}" y="${z}" width="${run.w}" height="${cell}" fill="${run.colour}"/>`);
			run = colour ? { x, w: cell, colour } : null;
		}
	}
	return rects.join('');
}

// tufts bucketed by kind / tone / size into single paths of round dots
function tuftLayer() {
	const t = result.ecology.tufts, buckets = new Map();
	const colours = ['#4e7a34', '#7c9a3c', '#a99d4e'], kindColour = { 1: '#d3bd58', 2: '#4f8a72', 3: '#9bc45f', 4: '#86b84f' };
	for (let i = 0; i < t.x.length; i++) {
		const tone = Math.min(2, Math.floor(t.tone[i] * 3)), big = t.h[i] > 0.55 ? 1 : 0;
		const key = `${t.kind[i]}|${t.kind[i] === 0 ? tone : 0}|${big}`;
		let bucket = buckets.get(key);
		if (!bucket) buckets.set(key, (bucket = { colour: t.kind[i] === 0 ? colours[tone] : kindColour[t.kind[i]], r: big ? 0.3 : 0.2, d: [] }));
		bucket.d.push(`M${n(t.x[i])} ${n(t.z[i])}h0.01`);
	}
	return [...buckets.entries()].sort().map(([, v]) => `<path d="${v.d.join('')}" stroke="${v.colour}" stroke-width="${v.r * 2}" stroke-linecap="round" fill="none"/>`).join('');
}

// carpet density as 4 levels, merged runs
function carpetLayer() {
	const c = result.ecology.carpet, rects = [];
	for (let j = 0; j < c.nz; j++) {
		let run = null;
		for (let i = 0; i <= c.nx; i++) {
			const level = i < c.nx ? Math.min(3, Math.floor(c.density[j * c.nx + i] * 4)) : 0;
			if (run && run.level === level) { run.w++; continue; }
			if (run && run.level > 0) rects.push(`<rect x="${c.x0 + run.x * c.cell}" y="${c.z0 + j * c.cell}" width="${run.w * c.cell}" height="${c.cell}" fill="#9ccc4a" fill-opacity="${[0, 0.18, 0.32, 0.5][run.level]}"/>`);
			run = { x: i, w: 1, level };
		}
	}
	return rects.join('');
}

const reservedSvg = result.reserved.map((r) => {
	const s = r.shape, tip = `<title>${esc(r.kind)} · ${esc(r.id)}</title>`;
	if (r.kind === 'path') return `<polyline points="${pts(s.points)}" fill="none" stroke="${r.pathKind === 'animal' ? '#7b6b50' : '#a68f68'}" stroke-opacity="0.55" stroke-width="${s.width}" stroke-linejoin="round" stroke-linecap="round">${tip}</polyline>`;
	if (r.kind === 'water') return s.type === 'polygon' ? `<polygon points="${pts(s.points)}" fill="#35677d" fill-opacity="0.85">${tip}</polygon>` : `<polyline points="${pts(s.points)}" fill="none" stroke="#35677d" stroke-opacity="0.9" stroke-width="${s.width}" stroke-linejoin="round">${tip}</polyline>`;
	if (s.type === 'circle') return `<circle cx="${s.x}" cy="${s.z}" r="${s.r}" fill="${r.kind === 'spawn' ? '#c0392b' : r.kind === 'arena' ? '#d9534f' : '#e3c04a'}" fill-opacity="0.16" stroke="${r.kind === 'spawn' ? '#e06050' : r.kind === 'arena' ? '#e8837f' : '#e3c04a'}" stroke-width="0.12" stroke-dasharray="0.5 0.3">${tip}</circle>`;
	return `<polygon points="${pts(s.points)}" fill="${r.kind === 'arena' ? '#d9534f' : '#58a6d6'}" fill-opacity="0.16" stroke="${r.kind === 'arena' ? '#e8837f' : '#58a6d6'}" stroke-width="0.12" stroke-dasharray="0.5 0.3">${tip}</polygon>`;
}).join('');

const zoneColour = { moor: '#8aa05a', farm: '#d0b060', field: '#e8d070', camp: '#d9604c', den: '#b06ad0', graveyard: '#9fb0c8', bank: '#4fa3c7' };
const zonesSvg = plan.zones.map((z) => {
	const col = zoneColour[z.kind], pl = Array.isArray(z.shape) ? z.shape : z.shape.points;
	const label = z.shape.r !== undefined ? { x: z.shape.x, z: z.shape.z - z.shape.r + 2 } : pl[0];
	const shape = z.shape.r !== undefined ? `<circle cx="${z.shape.x}" cy="${z.shape.z}" r="${z.shape.r}"/>` : `<polygon points="${pts(pl)}"/>`;
	return `<g fill="${col}" fill-opacity="0.05" stroke="${col}" stroke-opacity="0.7" stroke-width="0.18" stroke-dasharray="1.2 0.8"><title>${esc(z.id)} (${z.kind})</title>${shape}</g><text x="${n(label.x)}" y="${n(label.z)}" fill="${col}" font-size="1.7" text-anchor="middle" opacity="0.9">${esc(z.kind)} · ${esc(z.id)}</text>`;
}).join('');

const footprints = [], uses = [], occlusions = [], lights = [], labels = [];
for (const p of result.placements) {
	const fp = obbFrom(p.footprint), colour = p.procedural && p.blocks ? '#5e4b3c' : COLOR[p.class] ?? '#888';
	const front = toWorld(fp.cx, fp.cz, fp.yaw, 0, Math.min(fp.hz, 1.2) + 0.5);
	const tip = `${p.id} · ${p.asset} · ${p.class}/${p.role}${p.part ? ` · ${p.part}` : ''} · h ${p.height ?? ''} m · scale ${p.scale}${p.cluster ? ` · cluster ${p.cluster}` : ''}${p.event ? ` · event ${p.event}` : ''}${p.tries ? ` · ${p.tries} tries` : ''}`;
	footprints.push(`<g class="fp"><polygon points="${pts(fp.pts)}" fill="${colour}" fill-opacity="${p.layer === 'decal' ? 0.55 : 0.88}" stroke="${p.focal ? '#fff' : '#1a1410'}" stroke-width="${p.focal ? 0.22 : 0.08}"><title>${esc(tip)}</title></polygon><line x1="${n(fp.cx)}" y1="${n(fp.cz)}" x2="${n(front.x)}" y2="${n(front.z)}" stroke="#1a1410" stroke-width="0.1" stroke-opacity="0.8"/></g>`);
	if (p.use) uses.push(`<polygon points="${pts(obbFrom(p.use).pts)}" fill="#58a6d6" fill-opacity="0.12" stroke="#58a6d6" stroke-width="0.1" stroke-dasharray="0.4 0.3"/>`);
	if (p.occlusion) occlusions.push(`<polygon points="${pts(p.occlusion)}" fill="#9a6ad6" fill-opacity="0.07" stroke="#9a6ad6" stroke-opacity="0.5" stroke-width="0.07"/>`);
	if (p.light) lights.push(`<circle cx="${p.light.x}" cy="${p.light.z}" r="0.45" fill="#ffd54a" stroke="#fff" stroke-width="0.08"><title>light · ${esc(p.id)}</title></circle>`);
	if (p.label) labels.push(`<text x="${n(fp.cx)}" y="${n(fp.cz - Math.max(fp.hx, fp.hz) - 0.6)}" fill="#f2e6d0" font-size="1.5" text-anchor="middle" stroke="#000" stroke-width="0.25" paint-order="stroke">${esc(p.label)}</text>`);
}
const shrubs = result.ecology.shrubs.map((s) => `<ellipse cx="${s.x}" cy="${s.z}" rx="${n(s.footprint.hx)}" ry="${n(s.footprint.hz)}" transform="rotate(${n((-s.yaw * 180) / Math.PI)} ${s.x} ${s.z})" fill="#5c8a3a" fill-opacity="0.75" stroke="#2b4a1c" stroke-width="0.06"><title>${esc(s.id)} · ${esc(s.asset)}</title></ellipse>`).join('');
const paint = result.groundPaint.map((g) => `<circle cx="${g.x}" cy="${g.z}" r="${g.radius}" fill="${g.layer === 'wet' ? '#1d2a33' : '#3a2e22'}" fill-opacity="${n(0.12 + 0.3 * Math.min(1, g.strength))}"/>`).join('');
const decisions = result.decisions.map((d) => `<g><polygon points="${d.x},${n(d.z - 0.9)} ${n(d.x + 0.9)},${d.z} ${d.x},${n(d.z + 0.9)} ${n(d.x - 0.9)},${d.z}" fill="${d.markers.length ? '#ffd54a' : '#e06050'}" stroke="#000" stroke-width="0.1"><title>${esc(d.id)} · ${d.kind} · ${d.policy} · ${d.markers.length} marker(s)</title></polygon><text x="${d.x}" y="${n(d.z - 1.3)}" fill="#ffe9a0" font-size="1.3" text-anchor="middle" stroke="#000" stroke-width="0.2" paint-order="stroke">${d.kind}</text></g>`).join('');
const drops = result.report.drops.map((d) => `<g><path d="M${n(d.x - 0.5)} ${n(d.z - 0.5)}l1 1m0 -1l-1 1" stroke="#ff5a4a" stroke-width="0.22"/><title>${esc(`${d.item}: ${d.reason} (${d.detail})`)}</title></g>`).join('');
const pathLabels = plan.paths.map((p) => `<text x="${p.points[Math.floor(p.points.length / 2)].x}" y="${p.points[Math.floor(p.points.length / 2)].z - 1.2}" fill="#e8d9b8" font-size="1.5" text-anchor="middle" stroke="#000" stroke-width="0.2" paint-order="stroke">${esc(p.id)}</text>`).join('');
const cam = result.reserved.length ? { x: b.x0 + 8, z: b.z0 + 8 } : { x: 0, z: 0 };
const camSvg = `<g transform="translate(${cam.x} ${cam.z})"><line x1="0" y1="0" x2="-5" y2="-5" stroke="#9fd0ff" stroke-width="0.3" marker-end="url(#arrow)"/><text x="0.8" y="1.8" fill="#9fd0ff" font-size="1.6">camera looks NW (forward)</text></g>`;

// ---- report panel
const rep = result.report;
const byReason = {};
for (const d of rep.drops) (byReason[`${d.step}/${d.group}/${d.reason}`] ??= []).push(`${d.item}${d.detail ? ` (${d.detail})` : ''}`);
const rows = (o) => Object.entries(o).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${typeof v === 'object' ? esc(JSON.stringify(v)) : esc(v)}</td></tr>`).join('');
const panel = `
<h2>Counts</h2>
<table>${rows({ steps: rep.counts.step, groups: rep.counts.group, roles: rep.counts.role, 'auto compositions': rep.counts.compositions, tufts: rep.counts.ecology.tufts, shrubs: rep.counts.ecology.shrubs, 'tuft kinds': rep.counts.ecology.byKind, 'ecology stats': { clusters: rep.counts.ecology.clusters, loners: rep.counts.ecology.loners, rows: rep.counts.ecology.rows, strip: rep.counts.ecology.strip, feet: rep.counts.ecology.feet, bank: rep.counts.ecology.bank, removedByTraces: rep.counts.ecology.removed }, tries: { total: rep.tries.total, budget: rep.tries.budget, maxPerItem: rep.tries.maxPerItem } })}</table>
<h2>Checks (AD 12 §4.12)</h2>
<ul class="checks">${rep.checks.map((c) => `<li class="${c.pass ? 'ok' : 'bad'}"><b>${c.pass ? '✓' : '✗'} ${esc(c.id)}</b> <span>${esc(c.rule)}</span></li>`).join('')}</ul>
<h2>Decisions</h2>
<ul>${result.decisions.map((d) => `<li>${esc(d.id)} — ${d.kind}, ${d.policy}${d.hidden ? ', hidden' : ''}: ${d.markers.length} marker(s)</li>`).join('')}</ul>
<h2>Clusters</h2>
<ul>${result.clusters.map((c) => `<li>${esc(c.id)} (${c.recipe}) — ${c.dropped ? 'dropped' : `${c.placed > c.requested ? `${c.requested} +${c.placed - c.requested} repair` : `${c.placed}/${c.requested}`} members · sizes ${c.sizeMix.large}L/${c.sizeMix.medium}M/${c.sizeMix.small}S`}</li>`).join('')}</ul>
<h2>Events</h2>
<ul>${result.events.map((e) => `<li>${esc(e.id)} (${e.cause}, ${e.age}) — ${e.dropped ? 'dropped whole' : `1 + ${e.secondary.length} secondary + ${e.drag.length} drag`}</li>`).join('')}</ul>
<h2>Drops (${rep.drops.length})</h2>
<ul>${Object.entries(byReason).sort().map(([k, v]) => `<li><b>${esc(k)}</b> ×${v.length}<br><small>${esc(v.join(' · '))}</small></li>`).join('')}</ul>
<h2>Warnings (${rep.warnings.length})</h2>
<ul>${rep.warnings.map((w) => `<li>${esc(w.code)}: ${esc(w.message)}</li>`).join('') || '<li>none</li>'}</ul>`;

const LAYERS = [
	['ground', 'Ground class', true, groundLayer()], ['carpet', 'Carpet density (off: it reads as an even sprinkle)', false, carpetLayer()], ['paint', 'Ground paint', true, paint], ['zones', 'Zones', true, zonesSvg],
	['reserved', 'Play space (paths, water, doors, zones)', true, reservedSvg], ['occlusion', 'Occlusion zones', false, occlusions.join('')], ['use', 'Use zones', true, uses.join('')],
	['tufts', 'Tufts', true, tuftLayer()], ['shrubs', 'Shrubs', true, shrubs], ['footprints', 'Footprints by class', true, footprints.join('')],
	['lights', 'Lights', true, lights.join('')], ['decisions', 'Decisions', true, decisions], ['drops', 'Drops', true, drops], ['labels', 'Labels', true, labels.join('') + pathLabels + camSvg],
];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Biome layout preview · ${esc(plan.id)} · seed ${seed}</title>
<style>
body{margin:0;background:#15130f;color:#e8dfcc;font:13px/1.4 system-ui,sans-serif;display:flex;height:100vh}
#map{flex:1;min-width:0;display:flex;flex-direction:column}#bar{padding:6px 10px;background:#1e1b15;border-bottom:1px solid #3a342a;display:flex;flex-wrap:wrap;gap:4px 14px}
#bar label{white-space:nowrap}#view{flex:1;min-height:0}svg{width:100%;height:100%;background:#0e0d0a;cursor:grab}
aside{width:420px;overflow:auto;padding:8px 14px;background:#1a1712;border-left:1px solid #3a342a}h1{font-size:15px;margin:4px 0}h2{font-size:13px;margin:14px 0 4px;color:#d9b36a}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #2c271f;padding:2px 4px;vertical-align:top;word-break:break-word}ul{margin:0;padding-left:16px}.checks{list-style:none;padding:0}.checks li{margin:2px 0}
.ok b{color:#7ec57a}.bad b{color:#ff6a58}.checks span{color:#a89d86}small{color:#9d927c}
</style></head><body>
<div id="map"><div id="bar">${LAYERS.map(([id, label, on]) => `<label><input type="checkbox" data-layer="${id}"${on ? ' checked' : ''}> ${esc(label)}</label>`).join('')}</div>
<div id="view"><svg id="svg" viewBox="${b.x0} ${b.z0} ${W} ${D}" preserveAspectRatio="xMidYMid meet"><defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0 0L4 2L0 4z" fill="#9fd0ff"/></marker></defs>
${LAYERS.map(([id, , on, svg]) => `<g id="layer-${id}"${on ? '' : ' style="display:none"'}>${svg}</g>`).join('\n')}
</svg></div></div>
<aside><h1>${esc(plan.id)} · seed ${seed}</h1><div>${W} × ${D} m · x east, z south · north up · the camera looks toward the north-west</div>${panel}</aside>
<script>
const svg=document.getElementById('svg');
for(const box of document.querySelectorAll('#bar input'))box.addEventListener('change',()=>{document.getElementById('layer-'+box.dataset.layer).style.display=box.checked?'':'none'});
let vb=svg.viewBox.baseVal;const home=[vb.x,vb.y,vb.width,vb.height];
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),k=e.deltaY<0?0.85:1/0.85,px=vb.x+((e.clientX-r.left)/r.width)*vb.width,pz=vb.y+((e.clientY-r.top)/r.height)*vb.height;vb.x=px-(px-vb.x)*k;vb.y=pz-(pz-vb.y)*k;vb.width*=k;vb.height*=k},{passive:false});
let drag=null;svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,vx:vb.x,vy:vb.y};svg.setPointerCapture(e.pointerId)});
svg.addEventListener('pointermove',e=>{if(!drag)return;const r=svg.getBoundingClientRect();vb.x=drag.vx-((e.clientX-drag.x)/r.width)*vb.width;vb.y=drag.vy-((e.clientY-drag.y)/r.height)*vb.height});
svg.addEventListener('pointerup',()=>{drag=null});svg.addEventListener('dblclick',()=>{[vb.x,vb.y,vb.width,vb.height]=home});
</script></body></html>
`;
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${path.relative(root, out)}: ${(html.length / 1024).toFixed(0)} KB, ${result.placements.length} placements, ${result.ecology.tufts.x.length} tufts, ${result.ecology.shrubs.length} shrubs, ${rep.drops.length} drops, checks ${rep.checks.filter((c) => c.pass).length}/${rep.checks.length}`);

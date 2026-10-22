// Contact sheet of generated maps: one card per seed (top-down SVG of the dressed map: ground class, zones, paths, water, masses,
// placements by class, shrubs, tufts), the card title = seed · zones · attempts · checks. Click a card for the large view with the layer
// toggles of biome-layout-preview.mjs (whose drawing code is reused here, refactored to take a plan and a result instead of the demo).
// One self-contained HTML file, no external URLs. Open it with #seed=N to go straight to a large view, #sheet for the sheet.
// Usage: node scripts/plan-gen-preview.mjs [--seeds 1-12] [--size 128] [--out docs/plan-gen-preview.html] [--tufts 9000] [--no-layout]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { obbFrom, toWorld } from '../src/env/biomeLayout.js';
import { buildCatalog } from '../src/env/biomeCatalog.js';
import { PLAN_GEN_VERSION, checkPlan, generateMap, generatePlan } from '../src/env/planGen.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const out = path.resolve(root, arg('--out', 'docs/plan-gen-preview.html'));
const size = Number(arg('--size', 128));
const maxTufts = Number(arg('--tufts', 9000));
const cardTufts = Number(arg('--card-tufts', 2500));
const planOnly = args.includes('--no-layout');
const seeds = parseSeeds(arg('--seeds', '1-12'));

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
const n2 = (v) => Math.round(v * 100) / 100;
const pts = (list) => list.map((p) => `${n1(p.x)},${n1(p.z)}`).join(' ');

const COLOR = { obstacle: '#9a7b57', destructible: '#b9955a', decor: '#7d8a63', interactive: '#e3c04a', hazard: '#c0392b', guide: '#ff9f3a' };
const GROUND = { water: '#27414f', mud: '#463e2f', rock: '#68675f', blood: '#6a2b2b', grass: '#3b4a2c', dirt: '#56493a' };
const zoneColour = { moor: '#8aa05a', farm: '#d0b060', field: '#e8d070', camp: '#d9604c', den: '#b06ad0', graveyard: '#9fb0c8', bank: '#4fa3c7' };

// ground class on a 2 m grid, horizontal runs merged (neutral class colours: the plan's own grass channel is a ground input, not what the engine grows)
function groundLayer(plan) {
	const b = plan.bounds, cell = 2, rects = [];
	for (let z = b.z0; z < b.z1; z += cell) {
		let run = null;
		for (let x = b.x0; x < b.x1 + cell; x += cell) {
			let colour = null;
			if (x < b.x1) {
				const g = plan.ground(x + cell / 2, z + cell / 2);
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

// tufts bucketed by kind / tone / size into single paths of round dots, thinned to `maxTufts` (every k-th)
function tuftLayer(result, limit = maxTufts) {
	const t = result.ecology.tufts, buckets = new Map(), keep = Math.max(1, Math.ceil(t.x.length / limit));
	const colours = ['#4e7a34', '#7c9a3c', '#a99d4e'], kindColour = { 1: '#d3bd58', 2: '#4f8a72', 3: '#9bc45f', 4: '#86b84f' };
	for (let i = 0; i < t.x.length; i += keep) {
		const tone = Math.min(2, Math.floor(t.tone[i] * 3)), big = t.h[i] > 0.55 ? 1 : 0;
		const key = `${t.kind[i]}|${t.kind[i] === 0 ? tone : 0}|${big}`;
		let bucket = buckets.get(key);
		if (!bucket) buckets.set(key, (bucket = { colour: t.kind[i] === 0 ? colours[tone] : kindColour[t.kind[i]], r: big ? 0.3 : 0.2, d: [] }));
		bucket.d.push(`M${n1(t.x[i])} ${n1(t.z[i])}h0.01`);
	}
	return [...buckets.entries()].sort().map(([, v]) => `<path d="${v.d.join('')}" stroke="${v.colour}" stroke-width="${v.r * 2 * keep ** 0.5}" stroke-linecap="round" fill="none"/>`).join('');
}

function carpetLayer(result) {
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

function reservedLayer(result, titles = true) {
	return result.reserved.map((r) => {
		const s = r.shape, tip = titles ? `<title>${esc(r.kind)} · ${esc(r.id)}</title>` : '';
		if (r.kind === 'path') return `<polyline points="${pts(s.points)}" fill="none" stroke="${r.pathKind === 'animal' ? '#7b6b50' : '#a68f68'}" stroke-opacity="0.55" stroke-width="${s.width}" stroke-linejoin="round" stroke-linecap="round">${tip}</polyline>`;
		if (r.kind === 'water') return s.type === 'polygon' ? `<polygon points="${pts(s.points)}" fill="#35677d" fill-opacity="0.85">${tip}</polygon>` : `<polyline points="${pts(s.points)}" fill="none" stroke="#35677d" stroke-opacity="0.9" stroke-width="${s.width}" stroke-linejoin="round">${tip}</polyline>`;
		if (s.type === 'circle') return `<circle cx="${n1(s.x)}" cy="${n1(s.z)}" r="${n1(s.r)}" fill="${r.kind === 'spawn' ? '#c0392b' : r.kind === 'arena' ? '#d9534f' : '#e3c04a'}" fill-opacity="0.16" stroke="${r.kind === 'spawn' ? '#e06050' : r.kind === 'arena' ? '#e8837f' : '#e3c04a'}" stroke-width="0.25" stroke-dasharray="0.8 0.5">${tip}</circle>`;
		return `<polygon points="${pts(s.points)}" fill="${r.kind === 'arena' ? '#d9534f' : '#58a6d6'}" fill-opacity="0.16" stroke="${r.kind === 'arena' ? '#e8837f' : '#58a6d6'}" stroke-width="0.25" stroke-dasharray="0.8 0.5">${tip}</polygon>`;
	}).join('');
}

function zonesLayer(plan) {
	return plan.zones.map((z) => {
		const col = zoneColour[z.kind], pl = Array.isArray(z.shape) ? z.shape : z.shape.points;
		const label = z.shape.r !== undefined ? { x: z.shape.x, z: z.shape.z - z.shape.r + 2 } : pl[0];
		const shape = z.shape.r !== undefined ? `<circle cx="${z.shape.x}" cy="${z.shape.z}" r="${z.shape.r}"/>` : `<polygon points="${pts(pl)}"/>`;
		return `<g fill="${col}" fill-opacity="0.05" stroke="${col}" stroke-opacity="0.7" stroke-width="0.3" stroke-dasharray="1.6 1"><title>${esc(z.id)} (${z.kind})</title>${shape}</g><text x="${n1(label.x)}" y="${n1(label.z)}" fill="${col}" font-size="2.2" text-anchor="middle" opacity="0.9">${esc(z.kind)} · ${esc(z.id)}</text>`;
	}).join('');
}

function placementLayers(result, titles = true) {
	const footprints = [], uses = [], occlusions = [], lights = [], labels = [];
	for (const p of result.placements) {
		const fp = obbFrom(p.footprint), colour = p.procedural && p.blocks ? '#5e4b3c' : COLOR[p.class] ?? '#888';
		const front = toWorld(fp.cx, fp.cz, fp.yaw, 0, Math.min(fp.hz, 1.2) + 0.5);
		const tip = `${p.id} · ${p.asset} · ${p.class}/${p.role}${p.part ? ` · ${p.part}` : ''} · h ${p.height ?? ''} m${p.cluster ? ` · cluster ${p.cluster}` : ''}${p.event ? ` · event ${p.event}` : ''}`;
		footprints.push(`<g><polygon points="${pts(fp.pts)}" fill="${colour}" fill-opacity="${p.layer === 'decal' ? 0.55 : 0.88}" stroke="${p.focal ? '#fff' : '#1a1410'}" stroke-width="${p.focal ? 0.3 : 0.1}">${titles ? `<title>${esc(tip)}</title>` : ''}</polygon><line x1="${n1(fp.cx)}" y1="${n1(fp.cz)}" x2="${n1(front.x)}" y2="${n1(front.z)}" stroke="#1a1410" stroke-width="0.12" stroke-opacity="0.8"/></g>`);
		if (p.use) uses.push(`<polygon points="${pts(obbFrom(p.use).pts)}" fill="#58a6d6" fill-opacity="0.12" stroke="#58a6d6" stroke-width="0.12" stroke-dasharray="0.5 0.3"/>`);
		if (p.occlusion) occlusions.push(`<polygon points="${pts(p.occlusion)}" fill="#9a6ad6" fill-opacity="0.07" stroke="#9a6ad6" stroke-opacity="0.5" stroke-width="0.1"/>`);
		if (p.light) lights.push(`<circle cx="${n1(p.light.x)}" cy="${n1(p.light.z)}" r="0.55" fill="#ffd54a" stroke="#fff" stroke-width="0.1"/>`);
		if (p.label) labels.push(`<text x="${n1(fp.cx)}" y="${n1(fp.cz - Math.max(fp.hx, fp.hz) - 0.8)}" fill="#f2e6d0" font-size="2" text-anchor="middle" stroke="#000" stroke-width="0.3" paint-order="stroke">${esc(p.label)}</text>`);
	}
	return { footprints: footprints.join(''), uses: uses.join(''), occlusions: occlusions.join(''), lights: lights.join(''), labels: labels.join('') };
}

function otherLayers(plan, result) {
	const shrubs = result.ecology.shrubs.map((s) => `<ellipse cx="${n1(s.x)}" cy="${n1(s.z)}" rx="${n1(s.footprint.hx)}" ry="${n1(s.footprint.hz)}" transform="rotate(${n1((-s.yaw * 180) / Math.PI)} ${n1(s.x)} ${n1(s.z)})" fill="#5c8a3a" fill-opacity="0.75" stroke="#2b4a1c" stroke-width="0.08"/>`).join('');
	const paint = result.groundPaint.map((g) => `<circle cx="${n1(g.x)}" cy="${n1(g.z)}" r="${n1(g.radius)}" fill="${g.layer === 'wet' ? '#1d2a33' : '#3a2e22'}" fill-opacity="${n2(0.12 + 0.3 * Math.min(1, g.strength))}"/>`).join('');
	const decisions = result.decisions.map((d) => `<g><polygon points="${n1(d.x)},${n1(d.z - 1.1)} ${n1(d.x + 1.1)},${n1(d.z)} ${n1(d.x)},${n1(d.z + 1.1)} ${n1(d.x - 1.1)},${n1(d.z)}" fill="${d.markers.length ? '#ffd54a' : '#e06050'}" stroke="#000" stroke-width="0.12"><title>${esc(d.id)} · ${d.kind} · ${d.policy} · ${d.markers.length} marker(s)</title></polygon></g>`).join('');
	const drops = result.report.drops.map((d) => `<g><path d="M${n1(d.x - 0.6)} ${n1(d.z - 0.6)}l1.2 1.2m0 -1.2l-1.2 1.2" stroke="#ff5a4a" stroke-width="0.25"/><title>${esc(`${d.item}: ${d.reason} (${d.detail})`)}</title></g>`).join('');
	const pathLabels = plan.paths.map((p) => { const m = p.points[Math.floor(p.points.length / 2)]; return `<text x="${n1(m.x)}" y="${n1(m.z - 1.5)}" fill="#e8d9b8" font-size="2" text-anchor="middle" stroke="#000" stroke-width="0.25" paint-order="stroke">${esc(p.id)}</text>`; }).join('');
	const starts = `<g><circle cx="${plan.start.x}" cy="${plan.start.z}" r="1.1" fill="#7ec57a" stroke="#000" stroke-width="0.15"><title>start</title></circle>${plan.exits.map((e) => `<rect x="${n1(e.at.x - 1)}" y="${n1(e.at.z - 1)}" width="2" height="2" fill="#9fd0ff" stroke="#000" stroke-width="0.15"><title>${esc(e.id)} (${e.edge})</title></rect>`).join('')}</g>`;
	const cam = `<g transform="translate(${plan.bounds.x1 - 14} ${plan.bounds.z1 - 12})"><line x1="6" y1="6" x2="0" y2="0" stroke="#9fd0ff" stroke-width="0.5"/><path d="M0 0l2.4 0.6l-1.8 1.8z" fill="#9fd0ff"/><text x="7" y="7.5" fill="#9fd0ff" font-size="2.2">camera NW</text></g>`;
	return { shrubs, paint, decisions, drops, pathLabels, starts, cam };
}

function planOnlyLayers(plan) {
	// without the engine: masses as boxes, hosts and events as dots
	const masses = plan.masses.map((m) => {
		const f = m.footprint ?? { w: 3, d: 2 };
		return `<rect x="${n1(m.at.x - f.w / 2)}" y="${n1(m.at.z - f.d / 2)}" width="${f.w}" height="${f.d}" transform="rotate(${n1((-(m.yaw ?? 0) * 180) / Math.PI)} ${m.at.x} ${m.at.z})" fill="#9a7b57" stroke="#1a1410" stroke-width="0.12"><title>${esc(m.id)}</title></rect>`;
	}).join('');
	const hosts = plan.hosts.filter((h) => h.at).map((h) => `<circle cx="${h.at.x}" cy="${h.at.z}" r="1.2" fill="#e3c04a"><title>${esc(h.id)} (${h.recipe})</title></circle>`).join('');
	const events = plan.events.filter((e) => e.at).map((e) => `<circle cx="${e.at.x}" cy="${e.at.z}" r="0.9" fill="#c0392b"><title>${esc(e.id)} (${e.cause})</title></circle>`).join('');
	return masses + hosts + events;
}

function reservedFromPlan(plan) {
	// a plan-only stand-in for result.reserved (paths, water)
	const out = [];
	for (const p of plan.paths) out.push({ kind: 'path', id: p.id, pathKind: p.kind, shape: { type: 'polyline', points: p.points, width: p.width } });
	for (const w of plan.water) out.push({ kind: 'water', id: w.id, shape: w.polygon ? { type: 'polygon', points: w.polygon } : { type: 'polyline', points: w.points, width: w.width } });
	for (const d of plan.doors) { const c = toWorld(d.at.x, d.at.z, d.yaw, 0, (d.depth ?? 3) / 2); out.push({ kind: 'door', id: d.id, shape: { type: 'circle', x: c.x, z: c.z, r: (d.depth ?? 3) / 2 } }); }
	for (const i of plan.interactions) out.push({ kind: 'interaction', id: i.id, shape: { type: 'circle', x: i.at.x, z: i.at.z, r: i.radius } });
	for (const s of plan.spawns) out.push({ kind: 'spawn', id: s.id, shape: { type: 'circle', x: s.at.x, z: s.at.z, r: s.radius } });
	for (const a of plan.arenas) out.push({ kind: 'arena', id: a.id, shape: a.at ? { type: 'circle', x: a.at.x, z: a.at.z, r: a.r } : { type: 'circle', x: a.rect.x ?? (a.rect.x0 + a.rect.x1) / 2, z: a.rect.z ?? (a.rect.z0 + a.rect.z1) / 2, r: 4 } });
	return out;
}

// ---- one map
function mapPanel(r) {
	const { plan, result } = r;
	const rep = result?.report;
	const o = result ? otherLayers(plan, result) : null;
	const layers = [['ground', 'Ground class', true, groundLayer(plan)]];
	if (result) {
		const pl = placementLayers(result);
		layers.push(['carpet', 'Carpet density', false, carpetLayer(result)], ['paint', 'Ground paint', true, o.paint], ['zones', 'Zones', true, zonesLayer(plan)], ['reserved', 'Play space (paths, water, doors, zones)', true, reservedLayer(result)], ['occlusion', 'Occlusion zones', false, pl.occlusions], ['use', 'Use zones', false, pl.uses], ['tufts', 'Tufts', true, tuftLayer(result)], ['shrubs', 'Shrubs', true, o.shrubs], ['footprints', 'Footprints by class', true, pl.footprints], ['lights', 'Lights', true, pl.lights], ['decisions', 'Decisions', false, o.decisions], ['drops', 'Drops', false, o.drops], ['labels', 'Labels', true, pl.labels + o.pathLabels + o.cam], ['marks', 'Start / exits', true, o.starts]);
	} else {
		layers.push(['zones', 'Zones', true, zonesLayer(plan)], ['reserved', 'Paths, water', true, reservedLayer({ reserved: reservedFromPlan(plan) })], ['plan', 'Masses, hosts, events', true, planOnlyLayers(plan)]);
	}
	// the card carries a lighter copy of the default layers (thinner tufts, no tooltips): the large view has everything
	const card = result ? layers.filter((l) => l[2]).map((l) => (l[0] === 'tufts' ? [l[0], l[1], l[2], tuftLayer(result, cardTufts)] : l[0] === 'footprints' ? [l[0], l[1], l[2], placementLayers(result, false).footprints] : l[0] === 'reserved' ? [l[0], l[1], l[2], reservedLayer(result, false)] : l)) : layers;
	return { layers, card, rep };
}

// ---- run
const maps = [];
const t0 = performance.now();
for (const seed of seeds) {
	const t = performance.now();
	let r;
	if (planOnly) {
		const plan = generatePlan(seed, { size });
		const checks = checkPlan(plan, { catalog });
		r = { ok: checks.every((c) => c.pass), seed, plan, result: null, attempts: [{ attempt: 0, failed: checks.filter((c) => !c.pass).map((c) => `plan:${c.id}`) }], attempt: 0, planChecks: checks };
	} else {
		r = generateMap(seed, catalog, { size });
		r.planChecks = checkPlan(r.plan, { catalog });
	}
	r.ms = performance.now() - t;
	maps.push(r);
	console.log(`seed ${seed}: ${r.ok ? 'ok' : 'FAILED'} · attempts ${r.attempts.length} · zones ${r.plan.meta.zones.join(',')} · ${r.ms.toFixed(0)} ms${r.attempts.at(-1).failed.length ? ` · ${r.attempts.at(-1).failed.join(',')}` : ''}`);
}

const b0 = maps[0].plan.bounds;
const W = b0.x1 - b0.x0, D = b0.z1 - b0.z0;
const panels = maps.map((r) => ({ r, ...mapPanel(r) }));

const cardOf = (p) => {
	const { r } = p, rep = p.rep;
	const planOk = r.planChecks.filter((c) => c.pass).length, engOk = rep ? rep.checks.filter((c) => c.pass).length : 0;
	const title = `seed ${r.seed} · ${r.plan.meta.zones.join(' ')} · ${r.attempts.length} attempt${r.attempts.length > 1 ? 's' : ''} · plan ${planOk}/${r.planChecks.length}${rep ? ` · engine ${engOk}/${rep.checks.length}` : ''}`;
	const svg = `<svg viewBox="${b0.x0} ${b0.z0} ${W} ${D}" preserveAspectRatio="xMidYMid meet">${p.card.map(([id, , , body]) => `<g class="L-${id}">${body}</g>`).join('')}</svg>`;
	return `<figure class="card${r.ok ? '' : ' fail'}" data-seed="${r.seed}"><figcaption>${esc(title)}</figcaption>${svg}</figure>`;
};

const detailOf = (p) => {
	const { r } = p, rep = p.rep, plan = r.plan;
	const rows = (o) => Object.entries(o).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${typeof v === 'object' ? esc(JSON.stringify(v)) : esc(v)}</td></tr>`).join('');
	const byReason = {};
	if (rep) for (const d of rep.drops) (byReason[`${d.step}/${d.group}/${d.reason}`] ??= []).push(`${d.item}${d.detail ? ` (${d.detail})` : ''}`);
	const panel = `
<h1>seed ${r.seed} · ${esc(plan.id)}</h1>
<div>${W} × ${D} m · x east, z south · north up · camera NW · ${esc(PLAN_GEN_VERSION)} · ${r.ok ? 'accepted' : '<b class="bad">NOT accepted</b>'} on attempt ${r.attempt} · ${r.ms.toFixed(0)} ms in all</div>
<h2>Attempts</h2><ul>${r.attempts.map((a) => `<li>#${a.attempt}: ${a.failed.length ? `<span class="bad">${a.failed.map(esc).join(', ')}</span>` : '<span class="ok">passed</span>'}${r.timing?.attempts?.[a.attempt] ? ` · ${r.timing.attempts[a.attempt].toFixed(0)} ms` : ''}</li>`).join('')}</ul>
<h2>Plan</h2><ul>${plan.meta.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
<h2>Plan checks</h2><ul class="checks">${r.planChecks.map((c) => `<li class="${c.pass ? 'ok' : 'bad'}"><b>${c.pass ? '✓' : '✗'} ${esc(c.id)}</b> <span>${esc(c.rule)}</span>${c.pass ? '' : `<br><small>${esc(JSON.stringify(c.details)).slice(0, 400)}</small>`}</li>`).join('')}</ul>
${rep ? `<h2>Engine checks (19)</h2><ul class="checks">${rep.checks.map((c) => `<li class="${c.pass ? 'ok' : 'bad'}"><b>${c.pass ? '✓' : '✗'} ${esc(c.id)}</b></li>`).join('')}</ul>
<h2>Counts</h2><table>${rows({ steps: rep.counts.step, groups: rep.counts.group, 'auto compositions': rep.counts.compositions, tufts: rep.counts.ecology.tufts, shrubs: rep.counts.ecology.shrubs, ms: rep.ms })}</table>
<h2>Clusters</h2><ul>${result(r).clusters.map((c) => `<li>${esc(c.id)} (${c.recipe}) — ${c.dropped ? 'dropped' : `${c.placed}/${c.requested}`}</li>`).join('')}</ul>
<h2>Events</h2><ul>${result(r).events.map((e) => `<li>${esc(e.id)} (${e.cause}, ${e.age}) — ${e.dropped ? 'dropped whole' : `1 + ${e.secondary.length} + ${e.drag.length}`}</li>`).join('')}</ul>
<h2>Drops (${rep.drops.length})</h2><ul>${Object.entries(byReason).sort().map(([k, v]) => `<li><b>${esc(k)}</b> ×${v.length}<br><small>${esc(v.join(' · '))}</small></li>`).join('')}</ul>
<h2>Warnings (${rep.warnings.length})</h2><ul>${rep.warnings.map((w) => `<li>${esc(w.code)}: ${esc(w.message)}</li>`).join('') || '<li>none</li>'}</ul>` : ''}
<h2>Rejected zone candidates</h2><table>${rows(plan.meta.rejected ?? {})}</table>`;
	return `<template id="detail-${r.seed}"><div class="layers">${p.layers.map(([id, label, on]) => `<label><input type="checkbox" data-layer="${id}"${on ? ' checked' : ''}> ${esc(label)}</label>`).join('')}</div><svg viewBox="${b0.x0} ${b0.z0} ${W} ${D}" preserveAspectRatio="xMidYMid meet">${p.layers.map(([id, , on, body]) => `<g id="L-${id}"${on ? '' : ' style="display:none"'}>${body}</g>`).join('')}</svg><aside>${panel}</aside></template>`;
};
function result(r) { return r.result; }

// the large view is built from <template>s on demand, so the data of a map appears once for the card and once for the view only when opened
// (cards carry the default layers only; the template carries every layer)
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Plan generator preview · ${esc(PLAN_GEN_VERSION)} · seeds ${seeds[0]}…${seeds.at(-1)}</title>
<style>
body{margin:0;background:#15130f;color:#e8dfcc;font:13px/1.4 system-ui,sans-serif}
header{padding:8px 14px;background:#1e1b15;border-bottom:1px solid #3a342a}header b{color:#d9b36a}
#sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:10px;padding:10px}
.card{margin:0;background:#0e0d0a;border:1px solid #3a342a;cursor:pointer}.card.fail{border-color:#a33}.card figcaption{padding:4px 8px;font-size:12px;background:#1e1b15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card svg{display:block;width:100%;aspect-ratio:1/1}
#view{display:none;height:100vh;flex-direction:row}#view.on{display:flex}#sheet.off,header.off{display:none}
#vmap{flex:1;min-width:0;display:flex;flex-direction:column}.layers{padding:6px 10px;background:#1e1b15;border-bottom:1px solid #3a342a;display:flex;flex-wrap:wrap;gap:4px 14px}.layers label{white-space:nowrap}
#vmap svg{flex:1;min-height:0;width:100%;background:#0e0d0a;cursor:grab}
aside{width:430px;overflow:auto;padding:8px 14px;background:#1a1712;border-left:1px solid #3a342a}h1{font-size:15px;margin:4px 0}h2{font-size:13px;margin:14px 0 4px;color:#d9b36a}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #2c271f;padding:2px 4px;vertical-align:top;word-break:break-word}ul{margin:0;padding-left:16px}.checks{list-style:none;padding:0}.checks li{margin:2px 0}
.ok b,.ok{color:#7ec57a}.bad b,.bad{color:#ff6a58}.checks span{color:#a89d86}small{color:#9d927c}#back{position:fixed;right:12px;top:8px;z-index:3;padding:4px 10px;background:#3a342a;color:#e8dfcc;border:1px solid #6a5f4a;cursor:pointer}
</style></head><body>
<header id="top"><b>Plan generator preview</b> · ${esc(PLAN_GEN_VERSION)} · ${seeds.length} seeds · ${W} × ${D} m · click a card for the large view (layer toggles, wheel zoom, drag pan, double click resets) · camera looks north-west</header>
<div id="sheet">${panels.map(cardOf).join('')}</div>
<div id="view"><button id="back">sheet</button><div id="vmap"></div><aside id="vside"></aside></div>
${panels.map(detailOf).join('\n')}
<script>
const sheet=document.getElementById('sheet'),view=document.getElementById('view'),top_=document.getElementById('top');
function openSeed(seed){
  const t=document.getElementById('detail-'+seed);if(!t)return;
  const f=t.content.cloneNode(true);
  const vmap=document.getElementById('vmap'),vside=document.getElementById('vside');
  vmap.replaceChildren(f.querySelector('.layers'),f.querySelector('svg'));vside.replaceChildren(...f.querySelector('aside').childNodes);
  sheet.classList.add('off');top_.classList.add('off');view.classList.add('on');
  for(const box of vmap.querySelectorAll('.layers input'))box.addEventListener('change',()=>{vmap.querySelector('#L-'+box.dataset.layer).style.display=box.checked?'':'none'});
  const svg=vmap.querySelector('svg');let vb=svg.viewBox.baseVal;const home=[vb.x,vb.y,vb.width,vb.height];
  svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),k=e.deltaY<0?0.85:1/0.85,px=vb.x+((e.clientX-r.left)/r.width)*vb.width,pz=vb.y+((e.clientY-r.top)/r.height)*vb.height;vb.x=px-(px-vb.x)*k;vb.y=pz-(pz-vb.y)*k;vb.width*=k;vb.height*=k},{passive:false});
  let drag=null;svg.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,vx:vb.x,vy:vb.y};svg.setPointerCapture(e.pointerId)});
  svg.addEventListener('pointermove',e=>{if(!drag)return;const r=svg.getBoundingClientRect();vb.x=drag.vx-((e.clientX-drag.x)/r.width)*vb.width;vb.y=drag.vy-((e.clientY-drag.y)/r.height)*vb.height});
  svg.addEventListener('pointerup',()=>{drag=null});svg.addEventListener('dblclick',()=>{[vb.x,vb.y,vb.width,vb.height]=home});
  history.replaceState(null,'','#seed='+seed);
}
function openSheet(){view.classList.remove('on');sheet.classList.remove('off');top_.classList.remove('off');history.replaceState(null,'','#sheet')}
for(const c of document.querySelectorAll('.card'))c.addEventListener('click',()=>openSeed(c.dataset.seed));
document.getElementById('back').addEventListener('click',openSheet);
const m=/seed=(\\d+)/.exec(location.hash);if(m)openSeed(m[1]);
</script></body></html>
`;
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${path.relative(root, out)}: ${(html.length / 1024 / 1024).toFixed(2)} MB, ${maps.length} maps in ${((performance.now() - t0) / 1000).toFixed(1)} s, ${maps.filter((m) => m.ok).length} accepted`);

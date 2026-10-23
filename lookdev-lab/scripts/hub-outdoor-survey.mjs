// ASHLAR · Act I · walled hub → outdoor map: the converter's generality, measured.
//   node scripts/hub-outdoor-survey.mjs [from-to] [--json]     live plans of the CURRENT generator (planGenHub.js, hub-gen/3), seeds from-to (default 1-40):
//                                                              per seed the family, whether it converts, validate(), what the spawn reaches, stray walkable cells
// `checkHub(hub, base)` is also what scripts/hub-outdoor.test.mjs runs on the frozen fixtures (scripts/fixtures/hub/*.json), so the unit test never moves with
// the generator while this survey follows it (the generator may still change after its own review).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluatePlan, pointInPoly } from '../src/env/act1/outdoor.js';
import { hubToOutdoorPlan } from '../src/env/hubOutdoor.js';
import { PLAN as LYCHGATE } from '../src/env/act1/maps/lychgate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const segD = (a, b, x, z) => {
	const dx = b.x - a.x;
	const dz = b.z - a.z;
	const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
	return Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
};
/** An axis-aligned blocker box (what a shut gate is for the walk grid). */
export const shutBox = (c, r) => ({ uid: -1, asset: 'test-shut', pts: [[c.x - r, c.z - r], [c.x + r, c.z - r], [c.x + r, c.z + r], [c.x - r, c.z + r]], y0: -9, y1: 99, x: c.x, z: c.z, r: r * 1.5 });
/** Distance from (x, z) to the ring polygon's outline. */
export const ringDist = (ring, x, z) => Math.min(...ring.map((p, i) => segD({ x: p[0], z: p[1] }, { x: ring[(i + 1) % ring.length][0], z: ring[(i + 1) % ring.length][1] }, x, z)));

/** The family of a hub plan, e.g. "palisade/clipped main E lych W vault N". */
export const familyOf = (hub) => {
	const h = hub.hub;
	return `${h.wall?.type}/${h.ring?.style} main ${h.gates?.main?.edge} lych ${h.gates?.lychgate?.edge} vault ${h.gates?.vault?.edge}`;
};

/**
 * Convert one hub plan and walk it. Returns { family, converts, error?, W?, plan?, validate, unreached, stray, strayEx, leak, leakEx, bypass, lychOpen, wallsWet, cells }.
 * Unreached = the square, every NPC, every door and the causeway exit are not within 1.5 m of a cell the spawn walks to. Stray = walkable cells outside the ring (farther
 * than `sliver` m from its outline, not on the causeway / hill-lane corridors). Leak = inside cells reached from the spawn with both passages shut. Bypass = the
 * lychgate exit reached with the lychgate shut. lychOpen = the lychgate exit reached with it open.
 */
export function checkHub(hub, base = LYCHGATE, { sliver = 0.3 } = {}) {
	const r = { family: familyOf(hub), converts: false, validate: [], unreached: [], stray: 0, strayEx: null, leak: 0, leakEx: null, bypass: null, lychOpen: null, wallsWet: [], cells: 0 };
	let plan;
	try {
		plan = hubToOutdoorPlan(hub, base, { id: 'hubtest', wingScaleY: 1.3 });
	} catch (e) {
		r.error = `convert: ${e.message.split('\n')[0]}`;
		return r;
	}
	r.converts = true;
	let W;
	try {
		W = evaluatePlan(plan);
	} catch (e) {
		r.error = `evaluate: ${e.message.split('\n')[0]}`;
		return r;
	}
	r.plan = plan;
	r.W = W;
	r.validate = W.validate();
	const wallIds = new Set(hub.masses.filter((m) => m.tag === 'wall').map((m) => m.id));
	r.wallsWet = W.structures.filter((s) => wallIds.has(String(s.tag).split(':')[0]) && W.waterDepth(s.x, s.z) > 0.05).map((s) => `${s.tag} ${W.waterDepth(s.x, s.z).toFixed(2)} m`);
	const start = { x: hub.start.x, z: hub.start.z, y: W.spawns[0]?.y };
	const g = W.walkGrid(start, { full: true });
	r.cells = g.cells;
	if (!g.startOk) {
		r.unreached.push('spawn not walkable');
		return r;
	}
	const ring = hub.hub.ring.poly.map((p) => [p.x, p.z]);
	const exitAt = (id) => hub.exits.find((e) => e.id === id).at;
	const must = [['square', hub.square], ...hub.interactions.map((i) => [`npc ${i.id}`, i.at]), ...hub.doors.map((d) => [`door ${d.id}`, d.at]), ['exit causeway', exitAt('causeway')], ['route end', hub.paths.find((p) => p.id === 'route').points.at(-1)]];
	r.unreached = must.filter(([, p]) => !g.reached(p.x, p.z, 1.5)).map(([n, p]) => `${n} (${p.x}, ${p.z})`);
	// stray walkable cells outside the ring
	const cw = hub.hub.causeway;
	const ht = hub.paths.find((p) => p.id === 'hill-trail').points;
	const lych = hub.masses.find((m) => m.id === hub.doors.find((d) => d.id === 'lychgate').mass);
	for (let j = 0; j < g.n; j++) for (let i = 0; i < g.n; i++) {
		if (!g.walk[i + j * g.n]) continue;
		const x = g.ox + (i + 0.5) * g.cell;
		const z = g.oz + (j + 0.5) * g.cell;
		if (pointInPoly(ring, x, z) || ringDist(ring, x, z) < sliver) continue;
		if (segD(cw.from, cw.to, x, z) < 4 || segD(ht[0], ht.at(-1), x, z) < 4 || segD(lych.at, ht[0], x, z) < 4) continue;
		r.stray++;
		r.strayEx ??= [x, z];
	}
	// the passages: shut the main gate and the lychgate → nothing inside is reached; shut only the lychgate → its exit is not reached round the outside
	const gateD = hub.doors.find((d) => d.id === 'main-gate').at;
	const lychD = hub.hub.gates.lychgate.at;
	const exit = exitAt('lychgate');
	r.lychOpen = g.reached(exit.x, exit.z, 2);
	const saved = W.blockers.length;
	try {
		W.blockers.push(shutBox(gateD, 3.2), shutBox(lychD, 2.6), shutBox(lych.at, 2.6));
		const g2 = W.walkGrid(start, { full: true });
		const c = hub.hub.ring.centre;
		for (let x = c.x - 30; x < c.x + 30; x += 1) for (let z = c.z - 30; z < c.z + 30; z += 1) {
			if (!pointInPoly(ring, x, z) || ringDist(ring, x, z) < 2.5) continue;
			if (g2.startOk && g2.reached(x, z, 0.4)) {
				r.leak++;
				r.leakEx ??= [x, z];
			}
		}
		W.blockers.length = saved;
		W.blockers.push(shutBox(lychD, 2.6), shutBox(lych.at, 2.6));
		const g3 = W.walkGrid(start, { full: true });
		r.bypass = g3.reached(exit.x, exit.z, 2);
	} finally {
		W.blockers.length = saved;
	}
	return r;
}

/** One-line verdict of a check: '' = clean. */
export const problems = (r) => {
	if (!r.converts || r.error) return [r.error ?? 'does not convert'];
	const p = [];
	if (r.validate.length) p.push(`validate ${r.validate.length}: ${r.validate.slice(0, 2).join(' | ')}`);
	if (r.unreached.length) p.push(`unreached ${r.unreached.length}: ${r.unreached.slice(0, 3).join(', ')}`);
	if (r.stray) p.push(`${r.stray} stray cells, first ${JSON.stringify(r.strayEx)}`);
	if (r.leak) p.push(`RING LEAK ${r.leak}, first ${JSON.stringify(r.leakEx)}`);
	if (r.bypass) p.push('BYPASS: the lychgate exit is reached with the lychgate shut');
	if (!r.lychOpen) p.push('the lychgate exit is not reached through the lychgate');
	if (r.wallsWet.length) p.push(`${r.wallsWet.length} wall pieces in water: ${r.wallsWet.slice(0, 2).join(', ')}`);
	return p;
};

// ---- CLI: live plans of the current generator --------------------------------------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const [from, to] = (process.argv.find((a, i) => i > 1 && /^\d+(-\d+)?$/.test(a)) ?? '1-40').split('-').map(Number);
	const { buildCatalog } = await import('../src/env/biomeCatalog.js');
	const { generateHubMap } = await import('../src/env/planGenHub.js');
	const catalog = buildCatalog({ sizes: JSON.parse(readFileSync(path.join(root, 'src/env/kitSizes.json'), 'utf8')) });
	const rows = [];
	for (let s = from; s <= (to ?? from); s++) {
		const m = generateHubMap(s, catalog);
		const hub = JSON.parse(JSON.stringify(m.plan, (k, v) => (typeof v === 'function' ? undefined : v)));
		const r = checkHub(hub);
		const p = problems(r);
		rows.push({ seed: s, gen: m.plan.meta?.generator, ok: m.ok, family: r.family, converts: r.converts, validate: r.validate.length, unreached: r.unreached.length, stray: r.stray, leak: r.leak, bypass: r.bypass, lychOpen: r.lychOpen, wallsWet: r.wallsWet.length, problems: p });
		if (!process.argv.includes('--json')) console.log(`${String(s).padStart(2)} ${m.ok ? 'ok ' : 'NOT'} ${r.family.padEnd(44)} ${r.converts ? 'converts' : 'THROWS  '} validate ${r.validate.length} unreached ${r.unreached.length} stray ${r.stray} leak ${r.leak} bypass ${r.bypass} lych ${r.lychOpen}${p.length ? `  <-- ${p.join('; ')}` : ''}`);
	}
	if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
	else console.log(`\n${rows.filter((r) => !r.problems.length).length} / ${rows.length} seeds convert and walk clean; ${rows.filter((r) => !r.converts).length} throw`);
}

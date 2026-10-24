// Acceptance tests of the biome layout engine (src/env/biomeLayout.js) on the demo plan with three seed sets.
// The checkers here are brute force (O(n²), exact geometry, written from the plan data) and do not reuse validateLayout's indexes.
// Usage: npm run test:layout
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
	LAYOUT_RULES, UNITS, hash32, layoutBiome, makeObb, mulberry32, obbFrom, obbGap, obbSeparation, footprintObb, pointInPoly, pointPolySigned,
	segPolyDistance, toWorld, useObb, validateLayout, yawFacing, polyDistance, convexHull, passability, preparePlan, angleDiff, wrapAngle,
	polyGap, polyPenetration, shapeGap, sizeRhythmOk,
} from '../src/env/biomeLayout.js';
import { CLUSTERS, GUIDES, MASS_SETS, SIZE_CLASS, TRACES, ZONE_PROFILES, buildCatalog, catalogProblems, layerClass } from '../src/env/biomeCatalog.js';
import { DEMO_PLAN } from '../src/env/biomeLayoutDemo.js';
import { BIOME_RULES, segmentDistance } from '../src/env/biomePlacement.js';

const sizes = JSON.parse(readFileSync(new URL('../src/env/kitSizes.json', import.meta.url), 'utf8'));
const catalog = buildCatalog({ sizes });
const R = LAYOUT_RULES;
const TOL = 0.006; // output is rounded to the millimetre

const SEED_SETS = [
	{ name: 'A', seed: 20261020, seeds: { mass: 11, cluster: 23, guide: 37, ecology: 53, trace: 71 } },
	{ name: 'B', seed: 7, seeds: { mass: 101, cluster: 202, guide: 303, ecology: 404, trace: 505 } },
	{ name: 'C', seed: 99991, seeds: { mass: 5, cluster: 9, guide: 13, ecology: 17, trace: 21 } },
];

const cache = new Map();
const timings = [];
function run(set, { cat = catalog, plan = DEMO_PLAN, options = {}, tag = '' } = {}) {
	const key = `${set.name}|${tag}|${JSON.stringify(options)}`;
	if (!cache.has(key)) {
		const t0 = performance.now();
		const result = layoutBiome({ ...plan, seed: set.seed }, cat, { seeds: set.seeds, ...options });
		timings.push({ key, ms: performance.now() - t0 });
		cache.set(key, result);
	}
	return cache.get(key);
}
const sets = (fn) => { for (const set of SEED_SETS) fn(set, run(set)); };
const noMs = (r) => ({ ...r, report: { ...r.report, ms: undefined } });
const half = (path) => path.width / 2;
const widthOf = (p) => p.width ?? R.pathWidth[p.kind];

// ---- brute-force checkers (from the plan data)

function doorCorridor(d) {
	const size = R.doorSize[d.kind ?? 'door'], w = d.width ?? size.width, depth = d.depth ?? size.depth, yaw = d.yaw ?? 0;
	// like the engine, the corridor starts 2 cm in front of the wall so a wall that touches it is not "inside"
	const c = toWorld(d.at.x, d.at.z, yaw, 0, 0.02 + (depth - 0.02) / 2);
	return makeObb(c.x, c.z, w / 2, (depth - 0.02) / 2, yaw);
}

/** Gap of a footprint polygon to every element of the play space; < 0 / small values are violations the caller interprets. */
function playGaps(plan, fp) {
	const out = [];
	for (const p of plan.paths) for (let i = 0; i + 1 < p.points.length; i++) out.push({ kind: 'path', id: p.id, gap: segPolyDistance(p.points[i], p.points[i + 1], fp.pts) - widthOf(p) / 2, need: R.pathClear });
	for (const d of plan.doors ?? []) out.push({ kind: 'door', id: d.id, gap: polyDistance(doorCorridor(d).pts, fp.pts), need: R.doorClear });
	for (const i of plan.interactions ?? []) out.push({ kind: 'interaction', id: i.id, gap: Math.max(0, pointPolySigned(fp.pts, i.at.x, i.at.z)) - i.radius, need: R.interactionClear });
	for (const s of plan.spawns ?? []) out.push({ kind: 'spawn', id: s.id, gap: Math.max(0, pointPolySigned(fp.pts, s.at.x, s.at.z)) - s.radius, need: R.spawnClear });
	for (const a of plan.arenas ?? []) {
		const gap = a.rect ? polyDistance([{ x: a.rect.x0, z: a.rect.z0 }, { x: a.rect.x1, z: a.rect.z0 }, { x: a.rect.x1, z: a.rect.z1 }, { x: a.rect.x0, z: a.rect.z1 }], fp.pts) : Math.max(0, pointPolySigned(fp.pts, a.at.x, a.at.z)) - a.r;
		out.push({ kind: 'arena', id: a.id, gap, need: R.arenaClear });
	}
	for (const w of plan.water ?? []) {
		if (w.polygon) out.push({ kind: 'water', id: w.id, gap: polyDistance(w.polygon, fp.pts), need: R.waterClear });
		else for (let i = 0; i + 1 < w.points.length; i++) out.push({ kind: 'water', id: w.id, gap: segPolyDistance(w.points[i], w.points[i + 1], fp.pts) - w.width / 2, need: R.waterClear });
	}
	return out;
}

function playViolations(plan, result) {
	const bad = [];
	for (const p of result.placements) {
		const fp = obbFrom(p.footprint);
		for (const g of playGaps(plan, fp)) {
			if (g.kind === 'arena' && p.layer === 'decal') continue;
			if (p.owns === g.id) continue;
			if (g.gap < (p.authored ? -0.001 : g.need - TOL)) bad.push(`${p.id} vs ${g.kind}:${g.id} gap ${g.gap.toFixed(3)}`);
		}
	}
	return bad;
}

/** Tufts and shrubs: nothing inside corridors (except the low strip of rut roads), water, use zones, door / interaction / spawn zones or footprints. */
function ecologyViolations(plan, result) {
	const bad = [];
	const fps = result.placements.map((p) => ({ p, fp: obbFrom(p.footprint), use: p.use ? obbFrom(p.use) : null }));
	const check = (label, x, z, strip) => {
		for (const path of plan.paths) {
			for (let i = 0; i + 1 < path.points.length; i++) {
				const edge = segmentDistance(x, z, path.points[i], path.points[i + 1]) - widthOf(path) / 2;
				if (edge < -TOL && !strip) bad.push(`${label} inside corridor ${path.id}`);
			}
		}
		for (const w of plan.water ?? []) {
			if (w.polygon ? pointInPoly(w.polygon, x, z) : w.points.some((q, i) => i + 1 < w.points.length && segmentDistance(x, z, q, w.points[i + 1]) < w.width / 2)) bad.push(`${label} in water ${w.id}`);
		}
		for (const d of plan.doors ?? []) if (pointPolySigned(doorCorridor(d).pts, x, z) < -TOL) bad.push(`${label} in door ${d.id}`);
		for (const i of plan.interactions ?? []) if (Math.hypot(x - i.at.x, z - i.at.z) < i.radius - TOL) bad.push(`${label} in interaction ${i.id}`);
		for (const s of plan.spawns ?? []) if (Math.hypot(x - s.at.x, z - s.at.z) < s.radius - TOL) bad.push(`${label} in spawn ${s.id}`);
		for (const { p, fp, use } of fps) {
			if (pointPolySigned(fp.pts, x, z) < -TOL) bad.push(`${label} in footprint ${p.id}`);
			else if (use && p.layer !== 'decal' && pointPolySigned(use.pts, x, z) < -TOL) bad.push(`${label} in use zone of ${p.id}`);
		}
	};
	const t = result.ecology.tufts;
	for (let i = 0; i < t.x.length; i++) {
		const strip = t.kind[i] === t.kinds.strip;
		if (strip) {
			// only on the low strip between the ruts of a cart road
			const rut = plan.paths.find((p) => p.ruts), gap = rut.ruts.gap ?? 1.2, rw = rut.ruts.width ?? 0.3;
			const lat = Math.min(...rut.points.slice(0, -1).map((q, k) => segmentDistance(t.x[i], t.z[i], q, rut.points[k + 1])));
			if (lat > gap / 2 - rw / 2 + TOL) bad.push(`strip tuft ${i} is in a rut`);
		}
		check(`tuft ${i}`, t.x[i], t.z[i], strip);
	}
	for (const s of result.ecology.shrubs) {
		const fp = obbFrom(s.footprint);
		for (const g of playGaps(plan, fp)) if (g.kind !== 'arena' && g.gap < R.pathClear - TOL && g.kind !== 'water') bad.push(`${s.id} vs ${g.kind}:${g.id}`);
		for (const { p, fp: other } of fps) if (p.layer !== 'decal' && obbSeparation(fp, other) < -TOL) bad.push(`${s.id} overlaps ${p.id}`);
	}
	return bad;
}

/** BFS on a 0.25 m grid with the agent radius, written independently of the engine's passability(). */
function reachable(plan, result) {
	const cell = 0.25, ar = R.agentRadius, b = plan.bounds, nx = Math.ceil((b.x1 - b.x0) / cell), nz = Math.ceil((b.z1 - b.z0) / cell);
	const free = new Uint8Array(nx * nz).fill(1);
	for (const p of result.placements) {
		if (!p.blocks) continue;
		const fp = obbFrom(p.footprint);
		for (let j = Math.max(0, Math.floor((fp.z0 - ar - b.z0) / cell)); j < Math.min(nz, Math.ceil((fp.z1 + ar - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((fp.x0 - ar - b.x0) / cell)); i < Math.min(nx, Math.ceil((fp.x1 + ar - b.x0) / cell)); i++) {
				if (pointPolySigned(fp.pts, b.x0 + (i + 0.5) * cell, b.z0 + (j + 0.5) * cell) < ar) free[j * nx + i] = 0;
			}
		}
	}
	const onPath = (x, z) => plan.paths.some((p) => p.kind !== 'animal' && p.points.some((q, i) => i + 1 < p.points.length && segmentDistance(x, z, q, p.points[i + 1]) < widthOf(p) / 2));
	for (const w of plan.water ?? []) {
		const xs = (w.polygon ?? w.points).map((q) => q.x), zs = (w.polygon ?? w.points).map((q) => q.z), pad = (w.width ?? 0) / 2 + 1;
		for (let j = Math.max(0, Math.floor((Math.min(...zs) - pad - b.z0) / cell)); j < Math.min(nz, Math.ceil((Math.max(...zs) + pad - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((Math.min(...xs) - pad - b.x0) / cell)); i < Math.min(nx, Math.ceil((Math.max(...xs) + pad - b.x0) / cell)); i++) {
				const x = b.x0 + (i + 0.5) * cell, z = b.z0 + (j + 0.5) * cell;
				const wet = w.polygon ? pointInPoly(w.polygon, x, z) : w.points.some((q, k) => k + 1 < w.points.length && segmentDistance(x, z, q, w.points[k + 1]) < w.width / 2);
				if (wet && !onPath(x, z)) free[j * nx + i] = 0;
			}
		}
	}
	const start = plan.paths.find((p) => p.kind === 'road').points[0];
	let si = Math.floor((start.x - b.x0) / cell), sj = Math.floor((start.z - b.z0) / cell);
	for (let r = 0; r < 12 && !free[sj * nx + si]; r++) { si += 1; sj += 0; }
	const seen = new Uint8Array(nx * nz), queue = [sj * nx + si];
	seen[queue[0]] = 1;
	for (let h = 0; h < queue.length; h++) {
		const k = queue[h], i = k % nx, j = (k - i) / nx;
		for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
			const ni = i + di, nj = j + dj;
			if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || seen[nj * nx + ni] || !free[nj * nx + ni]) continue;
			seen[nj * nx + ni] = 1;
			queue.push(nj * nx + ni);
		}
	}
	const any = (pred) => {
		for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (seen[j * nx + i] && pred(b.x0 + (i + 0.5) * cell, b.z0 + (j + 0.5) * cell)) return true;
		return false;
	};
	const out = [];
	for (const d of plan.doors ?? []) out.push([`door ${d.id}`, any((x, z) => pointPolySigned(doorCorridor(d).pts, x, z) < 0)]);
	for (const i of plan.interactions ?? []) out.push([`interaction ${i.id}`, any((x, z) => Math.hypot(x - i.at.x, z - i.at.z) < i.radius)]);
	for (const s of plan.spawns ?? []) out.push([`spawn ${s.id}`, any((x, z) => Math.hypot(x - s.at.x, z - s.at.z) < s.radius)]);
	for (const a of plan.arenas ?? []) out.push([`arena ${a.id}`, any((x, z) => (a.rect ? x > a.rect.x0 && x < a.rect.x1 && z > a.rect.z0 && z < a.rect.z1 : Math.hypot(x - a.at.x, z - a.at.z) < a.r))]);
	return out;
}

// ---------------------------------------------------------------------------------------------------------------

test('catalog: every recipe, set and policy refers to declared assets with measured sizes', () => {
	assert.deepEqual(catalogProblems(catalog), []);
	assert.deepEqual(catalog.missing, [], 'kitSizes.json lacks pieces: run npm run measure:kits');
	for (const a of catalog.assets.values()) {
		assert.ok(['ground', 'obstacle', 'interactive', 'hazard', 'guide'].includes(a.role), a.id);
		assert.ok(['decal', 'low', 'tall', 'edge', 'landmark'].includes(a.layer), a.id);
		assert.ok(['large', 'medium', 'small'].includes(a.size), a.id);
		assert.ok(a.footprint.x1 > a.footprint.x0 && a.footprint.z1 > a.footprint.z0, a.id);
	}
	assert.ok(catalog.assets.size > 150, `${catalog.assets.size} declared pieces`);
	// a fallback never changes the collision role or the layer class of what it replaces (AD 12 §4.12 "không đổi vai trò collision")
	let fallbacks = 0;
	for (const a of catalog.assets.values()) {
		for (const id of a.fallback) {
			const b = catalog.get(id);
			fallbacks++;
			assert.equal(b.collision, a.collision, `${a.id} → ${id}: collision`);
			assert.equal(b.role, a.role, `${a.id} → ${id}: role`);
			assert.equal(layerClass(b.layer), layerClass(a.layer), `${a.id} → ${id}: layer class`);
		}
	}
	assert.ok(fallbacks > 30, `${fallbacks} fallbacks declared`);
	// size classes sit on the area quantiles, so a cluster can show 1 large – 2 medium – 3+ small
	const count = { small: 0, medium: 0, large: 0 };
	for (const a of catalog.assets.values()) count[a.size]++;
	const n = catalog.assets.size;
	assert.ok(count.small / n > 0.4 && count.small / n < 0.62 && count.large / n > 0.08 && count.large / n < 0.25 && count.medium / n > 0.2, JSON.stringify(count));
	assert.ok(SIZE_CLASS.small < SIZE_CLASS.large);
	// a recipe entry that faces the host axes may not wobble more than the test (and the validator) allow: worn ≤ axisTol
	for (const [name, recipe] of Object.entries(CLUSTERS)) for (const e of recipe.members) if (e.face === 'axis') assert.ok((e.worn ?? 0) <= R.axisTol, `${name}: ${e.asset} worn ${e.worn} > axisTol ${R.axisTol}`);
	// resolve(): every alternative of the recipe entry first, the fallbacks only after all of them
	const ids = [...catalog.assets.keys()];
	const noFrame = buildCatalog({ sizes, available: new Set(ids.filter((id) => id !== 'tents.a_frame')) });
	assert.deepEqual(noFrame.resolve(['tents.a_frame', 'tents.ridge']).map((a) => a.id), ['tents.ridge', 'tentsB.quartermaster']);
	assert.deepEqual(catalog.resolve(['tents.a_frame', 'tents.ridge']).map((a) => a.id).slice(0, 2), ['tents.a_frame', 'tents.ridge']);
});

test('1 · determinism: the same plan and options give the same layout', () => {
	for (const set of SEED_SETS) {
		const a = layoutBiome({ ...DEMO_PLAN, seed: set.seed }, catalog, { seeds: set.seeds });
		assert.deepStrictEqual(noMs(a), noMs(run(set)));
	}
	assert.equal(hash32(1, 2, 'x'), hash32(1, 2, 'x'));
	assert.notEqual(hash32(1, 2, 'x'), hash32(1, 3, 'x'));
	const r1 = mulberry32(5), r2 = mulberry32(5);
	assert.equal(r1(), r2());
});

test('2 · group independence: a group seed never moves what an earlier step placed', () => {
	for (const set of SEED_SETS.slice(0, 2)) {
		const base = run(set);
		const by = (r, g) => r.placements.filter((p) => g.includes(p.group));
		const with_ = (key) => run(set, { options: { seeds: { ...set.seeds, [key]: set.seeds[key] + 1000 } }, tag: key });
		// ecology: everything before it is identical
		const eco = with_('ecology');
		assert.deepStrictEqual(eco.placements, base.placements);
		assert.deepStrictEqual(eco.decisions, base.decisions);
		assert.deepStrictEqual(eco.clusters, base.clusters);
		assert.deepStrictEqual(eco.events, base.events);
		assert.notDeepEqual(Array.from(eco.ecology.tufts.x.slice(0, 50)), Array.from(base.ecology.tufts.x.slice(0, 50)), 'the ecology seed changes the grass');
		// trace: masses / clusters / guides identical, grass identical except what the traces remove
		const tr = with_('trace');
		assert.deepStrictEqual(by(tr, ['mass', 'cluster', 'guide']), by(base, ['mass', 'cluster', 'guide']));
		assert.notDeepEqual(by(tr, ['trace']).map((p) => [p.x, p.z]), by(base, ['trace']).map((p) => [p.x, p.z]), 'the trace seed changes the traces');
		const discs = [...by(base, ['trace']), ...by(tr, ['trace'])].map((p) => ({ x: p.footprint.cx, z: p.footprint.cz, r: Math.max(p.footprint.hx, p.footprint.hz) + 0.45 }));
		const kept = (r) => {
			const t = r.ecology.tufts, out = [];
			for (let i = 0; i < t.x.length; i++) if (!discs.some((d) => Math.hypot(t.x[i] - d.x, t.z[i] - d.z) < d.r)) out.push(`${t.x[i]},${t.z[i]},${t.h[i]},${t.kind[i]}`);
			return out;
		};
		assert.deepStrictEqual(kept(tr), kept(base));
		const shrubs = (r) => r.ecology.shrubs.filter((s) => !discs.some((d) => Math.hypot(s.x - d.x, s.z - d.z) < d.r + 2)).map((s) => s.id + s.x + s.z);
		assert.deepStrictEqual(shrubs(tr), shrubs(base));
		// guide: masses and clusters identical
		const gd = with_('guide');
		assert.deepStrictEqual(by(gd, ['mass', 'cluster']), by(base, ['mass', 'cluster']));
		// cluster: masses identical; mass: everything may change
		assert.deepStrictEqual(by(with_('cluster'), ['mass']), by(base, ['mass']));
		assert.notDeepEqual(by(with_('mass'), ['mass']).filter((p) => !p.authored).map((p) => [p.x, p.z]), by(base, ['mass']).filter((p) => !p.authored).map((p) => [p.x, p.z]));
	}
});

test('3 · play space: nothing narrows a corridor; ecology keeps out of the play space, water, use zones and footprints', () => {
	sets((set, r) => {
		assert.deepEqual(playViolations(DEMO_PLAN, r), [], set.name);
		assert.deepEqual(ecologyViolations(DEMO_PLAN, r).slice(0, 8), [], set.name);
		assert.ok(r.ecology.tufts.x.length > 1000 && r.ecology.shrubs.length > 10, `${set.name}: ${r.ecology.tufts.x.length} tufts`);
	});
});

test('4 · footprints do not overlap and blockers of different groups leave a pass gap', () => {
	sets((set, r) => {
		const ps = r.placements, fps = ps.map((p) => obbFrom(p.footprint));
		const bad = [];
		for (let i = 0; i < ps.length; i++) {
			for (let j = i + 1; j < ps.length; j++) {
				const a = ps[i], b = ps[j];
				if ((a.layer === 'decal') !== (b.layer === 'decal')) continue;
				if (obbSeparation(fps[i], fps[j]) < -TOL) bad.push(`overlap ${a.id} ${b.id}`);
				if (!a.blocks || !b.blocks || (a.authored && b.authored)) continue;
				const same = (a.owner && a.owner === b.owner) || (a.cluster && a.cluster === b.cluster);
					if (obbGap(fps[i], fps[j]) < (same ? R.clusterGap : R.passGap) - TOL) bad.push(`gap ${a.id} ${b.id} ${obbGap(fps[i], fps[j]).toFixed(2)}`);
			}
		}
		assert.deepEqual(bad.slice(0, 8), [], set.name);
	});
});

test('5 · use zones of hosts and props are free of blockers', () => {
	sets((set, r) => {
		const bad = [];
		for (const p of r.placements) {
			if (!p.use || p.layer === 'decal') continue;
			const use = obbFrom(p.use);
			for (const q of r.placements) {
				if (q === p || q.layer === 'decal') continue;
				if (obbSeparation(use, obbFrom(q.footprint)) < -TOL) bad.push(`${q.id} stands in the use zone of ${p.id}`);
			}
		}
		assert.deepEqual(bad, [], set.name);
		assert.ok(r.placements.filter((p) => p.use).length > 10);
	});
});

test('6 · passability: every door, standing zone, spawn and arena is reachable from the road start', () => {
	sets((set, r) => {
		const failed = reachable(DEMO_PLAN, r).filter(([, ok]) => !ok).map(([n]) => n);
		assert.deepEqual(failed, [], set.name);
		const pas = passability(preparePlan({ ...DEMO_PLAN, seed: set.seed }), r.placements, R);
		assert.ok(pas.seeded && pas.targets.every((t) => t.ok), set.name);
	});
});

test('7 · guides: markers at decisions, on the shoulder, none on animal trails or in dens, spaced, forks mark the continuing route', () => {
	sets((set, r) => {
		const guides = r.placements.filter((p) => p.group === 'guide'), decs = new Map(r.decisions.map((d) => [d.id, d]));
		assert.ok(guides.length >= 6, `${set.name}: ${guides.length} markers`);
		for (const p of guides) {
			const d = decs.get(p.decision);
			assert.ok(d, `${p.id} has no decision`);
			assert.ok(Math.hypot(p.x - d.x, p.z - d.z) <= R.decisionRadius + TOL, `${p.id} outside the decision radius`);
			const fp = obbFrom(p.footprint);
			if (d.door) {
				const door = DEMO_PLAN.doors.find((q) => q.id === d.door), gap = polyDistance(doorCorridor(door).pts, fp.pts);
				assert.ok(gap >= R.doorClear - TOL && gap <= R.shoulderMax + TOL, `${p.id} door shoulder ${gap}`);
			} else {
				const path = DEMO_PLAN.paths.find((q) => q.id === d.path);
				const gap = Math.min(...path.points.slice(0, -1).map((q, i) => segPolyDistance(q, path.points[i + 1], fp.pts))) - widthOf(path) / 2;
				assert.ok(gap >= R.shoulderMin - TOL && gap <= R.shoulderMax + TOL, `${p.id} shoulder ${gap}`);
				assert.notEqual(path.kind, 'animal', 'no markers on animal trails');
			}
			if (p.light) {
				const near = DEMO_PLAN.paths.map((q) => ({ q, d: Math.min(...q.points.slice(0, -1).map((a, i) => segmentDistance(p.x, p.z, a, q.points[i + 1]))) })).sort((a, b) => a.d - b.d)[0];
				assert.notEqual(near.q.kind, 'animal', `${p.id}: a torch on an animal trail`);
				const zone = [...DEMO_PLAN.zones].reverse().find((z) => (z.shape.r !== undefined ? Math.hypot(p.x - z.shape.x, p.z - z.shape.z) <= z.shape.r : pointInPoly(Array.isArray(z.shape) ? z.shape : z.shape.points, p.x, p.z)));
				assert.notEqual(zone?.kind, 'den', `${p.id}: a torch in a den`);
				if (!zone || zone.kind === 'moor') assert.ok(near.q.inhabited || near.q.kind === 'road', `${p.id}: a torch on a path nobody keeps`);
			}
		}
		for (let i = 0; i < guides.length; i++) for (let j = i + 1; j < guides.length; j++) {
			if (guides[i].pair && guides[i].pair === guides[j].pair) continue;
			assert.ok(Math.hypot(guides[i].x - guides[j].x, guides[i].z - guides[j].z) >= BIOME_RULES.torchGap - TOL, `${guides[i].id} / ${guides[j].id} closer than torchGap`);
		}
		// gate pair for the important gate, single for the rest
		assert.equal(guides.filter((p) => p.pair === 'door:camp-gate').length, 2, set.name);
		// forks mark the continuing route: the marker is on the side opposite the branch
		for (const d of r.decisions.filter((x) => x.kind === 'fork' && x.markers.length)) {
			const path = DEMO_PLAN.paths.find((q) => q.id === d.path), branch = DEMO_PLAN.paths.find((q) => q.id === d.branch);
			const segs = path.points.slice(0, -1).map((a, i) => [a, path.points[i + 1]]);
			const seg = segs.reduce((best, [a, b]) => (segmentDistance(d.x, d.z, a, b) < segmentDistance(d.x, d.z, best[0], best[1]) ? [a, b] : best));
			const len = Math.hypot(seg[1].x - seg[0].x, seg[1].z - seg[0].z), tx = (seg[1].x - seg[0].x) / len, tz = (seg[1].z - seg[0].z) / len;
			const other = Math.hypot(branch.points[0].x - d.x, branch.points[0].z - d.z) < Math.hypot(branch.points.at(-1).x - d.x, branch.points.at(-1).z - d.z) ? branch.points.at(-1) : branch.points[0];
			const side = (x, z) => Math.sign(tz * (x - d.x) - tx * (z - d.z));
			const marker = r.placements.find((p) => p.id === d.markers[0]);
			assert.notEqual(side(marker.x, marker.z), side(other.x, other.z), `${d.id}: the fork marker stands on the branch side`);
		}
		assert.ok(r.decisions.some((d) => d.kind === 'bend' && d.markers.length), `${set.name}: a hidden bend gets a marker`);
	});
	// two decisions 3 m apart: the second marker would break torchGap, so it is dropped (not forced) and reported
	const crowded = {
		id: 'crowded', seed: 1, bounds: { x0: -32, z0: -32, x1: 32, z1: 32 }, ground: () => ({ height: 0, grass: 0.5 }), autoMasses: false,
		paths: [{ id: 'road', kind: 'road', points: [{ x: -28, z: 0 }, { x: 28, z: 0 }], width: 4.2, inhabited: true }],
		decisions: [-6, -4, -2, 0, 2].map((x, i) => ({ id: `d${i}`, kind: 'bend', at: { x, z: 0 } })),
	};
	const r = layoutBiome(crowded, catalog);
	const placed = r.placements.filter((p) => p.group === 'guide');
	assert.ok(placed.length >= 1, 'at least the first decision is marked');
	for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) assert.ok(Math.hypot(placed[i].x - placed[j].x, placed[i].z - placed[j].z) >= R.torchGap - TOL);
	assert.ok(r.report.drops.some((d) => d.group === 'guide' && d.reason === 'distribution' && d.detail.startsWith('guide-gap')), JSON.stringify(r.report.drops));
	// markers need a lit policy: the same road through a den gets natural markers only, never a torch
	const den = layoutBiome({ ...crowded, defaultZone: 'den', decisions: [{ id: 'd1', kind: 'bend', at: { x: -4, z: 0 } }], paths: [{ id: 'trail', kind: 'animal', points: [{ x: -28, z: 0 }, { x: 28, z: 0 }], width: 1 }] }, catalog);
	const denMarkers = den.placements.filter((p) => p.group === 'guide');
	assert.ok(denMarkers.length >= 1, `the den road gets a natural marker: ${JSON.stringify(den.report.drops)}`);
	assert.ok(denMarkers.every((p) => !p.light), 'no torch on an animal trail in a den');
	const naturalKit = new Set(Object.values(GUIDES.natural).flat().map((id) => id.split('.')[0]));
	assert.ok(denMarkers.every((p) => naturalKit.has(p.kit)), 'the markers come from the natural policy (rock, dead tree, carcass)');
});

test('8 · traces: 1 main + 2–6 secondary per event, near a host, spaced, leaning; dropped events are reported', () => {
	sets((set, r) => {
		const placed = r.events.filter((e) => !e.dropped);
		assert.ok(placed.length >= 4, `${set.name}: ${placed.length} events placed`);
		for (const ev of r.events) {
			if (ev.dropped) { assert.ok(r.report.drops.some((d) => d.item === ev.id), `${ev.id} dropped silently`); continue; }
			const mine = r.placements.filter((p) => p.event === ev.id), main = mine.filter((p) => p.part === 'main'), sec = mine.filter((p) => p.part === 'secondary');
			assert.equal(main.length, 1);
			assert.ok(sec.length >= 2 && sec.length <= 6, `${ev.id}: ${sec.length} secondary`);
			assert.ok(mine.filter((p) => p.part === 'drag').length <= 2);
			const host = ev.hostPos;
			assert.ok(host && Math.hypot(main[0].x - host.x, main[0].z - host.z) <= R.hostRadius + (host.r0 ?? 0) + TOL, `${ev.id}: no host within hostRadius`);
			const recipe = TRACES[ev.cause];
			if (recipe.pattern !== 'ring') for (const p of sec) assert.ok(angleDiff(Math.atan2(p.z - main[0].z, p.x - main[0].x), ev.lean) <= R.traceLean + 0.06, `${p.id} outside the lean sector`);
			const allowed = new Set([...recipe.main, ...recipe.secondary, ...recipe.drag].map((e) => e.asset));
			for (const p of mine) assert.ok(allowed.has(p.asset), `${p.id} (${p.asset}) is not in the ${ev.cause} recipe`);
		}
		const traces = r.placements.filter((p) => p.group === 'trace');
		for (let i = 0; i < traces.length; i++) for (let j = i + 1; j < traces.length; j++) {
			if (traces[i].event !== traces[j].event) assert.ok(obbGap(obbFrom(traces[i].footprint), obbFrom(traces[j].footprint)) >= R.eventGap - TOL, `${traces[i].id} / ${traces[j].id} closer than eventGap`);
		}
		assert.ok(r.groundPaint.some((g) => g.layer === 'dirt') && r.groundPaint.some((g) => g.layer === 'wet'));
	});
	// an event that cannot place main + 2 secondary is dropped whole and leaves nothing behind
	const walled = { ...DEMO_PLAN, events: [{ id: 'nowhere', cause: 'predation', host: { x: 0, z: 0, kind: 'carcass' }, at: { x: 0, z: 0 } }], paths: [{ id: 'road', kind: 'road', points: [{ x: -40, z: 0 }, { x: 40, z: 0 }], width: 60 }], hosts: [], masses: [], autoMasses: false };
	const r = layoutBiome(walled, catalog, { seeds: SEED_SETS[0].seeds });
	assert.equal(r.events[0].dropped, true);
	assert.equal(r.placements.filter((p) => p.event === 'nowhere').length, 0);
	assert.equal(r.report.drops.filter((d) => d.item === 'nowhere').length, 1);
	// the record of a dropped event names no rolled-back placement: main is null, the drop names a catalog asset
	assert.equal(r.events[0].main, null);
	assert.deepEqual(r.events[0].secondary.concat(r.events[0].drag, r.events[0].placed), []);
	const drop = r.report.drops.find((d) => d.item === 'nowhere');
	assert.ok(catalog.get(drop.asset), `the drop names an asset of the recipe, not a placement id: ${drop.asset}`);
	// an event with no host is reported where the event is, not at the origin
	const hostless = layoutBiome({ ...walled, events: [{ id: 'orphan', cause: 'raid', host: 'nothing', at: { x: 12, z: -9 } }] }, catalog);
	const orphan = hostless.report.drops.find((d) => d.item === 'orphan');
	assert.deepEqual([orphan.x, orphan.z], [12, -9]);
});

test('8a · every demo event leaves a trace on the default seed and nearly always on others, in any host order', () => {
	const traced = (plan) => { const r = layoutBiome(plan, catalog); return DEMO_PLAN.events.filter((e) => r.placements.filter((p) => p.event === e.id).length === 0).map((e) => e.id); };
	assert.deepEqual(traced(DEMO_PLAN), [], 'default seed: an event placed nothing');
	for (const set of SEED_SETS) assert.deepEqual(DEMO_PLAN.events.filter((e) => !run(set).placements.some((p) => p.event === e.id)).map((e) => e.id), [], `set ${set.name}`);
	const orders = [DEMO_PLAN.hosts, [...DEMO_PLAN.hosts].reverse(), DEMO_PLAN.hosts.filter((h) => !h.mass).concat(DEMO_PLAN.hosts.filter((h) => h.mass))];
	const missing = {};
	orders.forEach((hosts, i) => { for (let seed = 1; seed <= (i === 0 ? 12 : 6); seed++) for (const id of traced({ ...DEMO_PLAN, seed, hosts })) missing[id] = (missing[id] ?? 0) + 1; });
	for (const [id, n] of Object.entries(missing)) assert.ok(n <= 1, `${id} placed nothing on ${n} of 24 runs (seeds 1–12 in plan order, 1–6 reversed / mass-hosts last)`);
	assert.equal(layoutBiome(DEMO_PLAN, catalog).report.warnings.filter((w) => w.code === 'event.host').length, 0, 'a demo event found no host');
});

test('8b · traces name their hosts: a cause only attaches to the kinds of host its recipe lists (AD 12 §4.10 phân bố theo vật chủ)', () => {
	const plan = (events) => ({
		id: 'hosts', seed: 3, bounds: { x0: -32, z0: -32, x1: 32, z1: 32 }, ground: () => ({ height: 0, grass: 0.5 }), autoMasses: false, defaultZone: 'moor',
		paths: [{ id: 'road', kind: 'road', points: [{ x: -30, z: 24 }, { x: 30, z: 24 }], width: 4.2 }],
		doors: [{ id: 'cottage-door', at: { x: 0, z: 0 }, yaw: 0, kind: 'door', width: 1.6, depth: 3 }],
		masses: [{ id: 'cottage', kind: 'building', footprint: { w: 7, d: 5 }, height: 3.5, at: { x: 0, z: -3 }, yaw: 0 }, { id: 'carcass', asset: 'corpses.beast', at: { x: -16, z: 10 }, yaw: 0.4 }],
		events,
	});
	const r = layoutBiome(plan([
		{ id: 'wolf-at-door', cause: 'predation', host: 'cottage-door', at: { x: 3, z: 6 } }, // a house door is not a den or a carcass
		{ id: 'wolf-at-carcass', cause: 'predation', host: 'carcass', at: { x: -16, z: 15 } },
		{ id: 'roof-fell', cause: 'collapse', host: 'cottage', at: { x: 8, z: -3 } },
		{ id: 'ritual-at-roof', cause: 'ritual', host: 'cottage', at: { x: 8, z: 6 } }, // a building is not an altar
		{ id: 'free-point', cause: 'raid', host: { x: 14, z: 14 }, at: { x: 14, z: 14 } }, // no kind = the author's word
	]), catalog);
	const state = Object.fromEntries(r.events.map((e) => [e.id, e.dropped ? 'dropped' : 'placed']));
	assert.equal(state['wolf-at-door'], 'dropped');
	assert.equal(state['ritual-at-roof'], 'dropped');
	assert.equal(state['wolf-at-carcass'], 'placed');
	assert.equal(state['roof-fell'], 'placed');
	assert.equal(state['free-point'], 'placed');
	assert.ok(r.report.warnings.some((w) => w.code === 'event.hostKind' && w.id === 'wolf-at-door'));
	assert.ok(r.report.drops.some((d) => d.item === 'wolf-at-door' && d.detail.startsWith('host kind')));
	assert.equal(r.report.checks.find((c) => c.id === 'traces').pass, true);
	// the validator sees it too: an event result whose host kind the cause does not accept is flagged
	const bad = structuredClone(r);
	bad.events.find((e) => e.id === 'wolf-at-carcass').hostKinds = ['door'];
	assert.equal(validateLayout(plan([]), bad, catalog).find((c) => c.id === 'traces').pass, false);
	// bonesMul: the same event leaves more pieces in a den than on a moor (zone profile density)
	const spread = (zone) => {
		let n = 0;
		for (let seed = 1; seed <= 6; seed++) {
			const p = plan([{ id: 'kill', cause: 'predation', host: 'carcass', at: { x: -16, z: 15 } }]);
			const res = layoutBiome({ ...p, seed, defaultZone: zone }, catalog);
			n += res.placements.filter((q) => q.event === 'kill' && q.part === 'secondary').length;
		}
		return n;
	};
	assert.ok(spread('den') > spread('moor'), 'a den is fuller of bones than a moor');
});

test('9 · clusters: members only from the recipe, counts in range, built pieces on the host axes, seats face the rest point, clusters differ', () => {
	sets((set, r) => {
		const live = r.clusters.filter((c) => !c.dropped);
		assert.ok(live.length >= 12, `${set.name}: ${live.length} clusters`);
		const byRecipe = {};
		for (const c of live) {
			const recipe = CLUSTERS[c.recipe];
			(byRecipe[c.recipe] ??= []).push(c);
			assert.ok(c.requested >= recipe.count[0] && c.requested <= recipe.count[1], `${c.id}: ${c.requested} requested, range ${recipe.count}`);
			assert.ok(c.placed <= recipe.count[1]);
			const allowed = new Set(recipe.members.flatMap((m) => m.asset));
				// with every kit loaded there is no fallback allowance: members and hosts are recipe pieces, nothing else
				if (recipe.host && !c.mass) assert.ok(recipe.host.includes(c.host.asset), `${c.host.id}: host ${c.host.asset} is not in the ${c.recipe} recipe`);
				for (const id of c.members) {
					const p = r.placements.find((q) => q.id === id), a = catalog.get(p.asset);
					assert.ok(allowed.has(p.asset), `${id} (${p.asset}) is not in the ${c.recipe} recipe`);
				assert.equal(p.cluster, c.id);
				if (p.orient === 'axis') assert.ok(Math.abs(wrapAngle((p.yaw - c.frame.yaw) * 4)) / 4 <= R.axisTol, `${id} is off the host axes`);
				if (p.orient === 'rest' || p.orient === 'host') assert.ok(angleDiff(p.yaw + a.front, yawFacing(c.rest.x - p.x, c.rest.z - p.z)) <= R.faceTol, `${id} does not face the rest point`);
			}
		}
		for (const [name, list] of Object.entries(byRecipe)) {
			if (list.length > 1) assert.ok(new Set(list.map((c) => `${c.counts}|${Math.round(c.radius * 2)}`)).size > 1, `all ${name} clusters are alike`);
		}
		assert.ok(r.placements.some((p) => p.orient === 'rest') && r.placements.some((p) => p.orient === 'axis'));
		// tents keep a clear zone before the door
		for (const p of r.placements.filter((q) => q.kit === 'tents' && q.part === 'host')) assert.ok(p.use, `${p.id} has no door zone`);
	});
});

test('10 · density: 0 removes the layer, 2 keeps every exclusion', () => {
	const set = SEED_SETS[0];
	const none = run(set, { options: { density: { grass: 0, shrubs: 0 } }, tag: 'zero' });
	assert.equal(none.ecology.tufts.x.length, 0);
	assert.equal(none.ecology.shrubs.length, 0);
	assert.ok(none.ecology.carpet.density.every((v) => v === 0));
	assert.ok(none.placements.length > 100, 'masses, clusters and guides do not depend on grass density');
	const grassOnly = run(set, { options: { density: { grass: 1, shrubs: 0 } }, tag: 'shrubs0' });
	assert.equal(grassOnly.ecology.shrubs.length, 0);
	assert.ok(grassOnly.ecology.tufts.x.length > 1000);
	const base = run(set), dense = run(set, { options: { density: { grass: 2, shrubs: 2 } }, tag: 'double' });
	assert.ok(dense.ecology.tufts.x.length > base.ecology.tufts.x.length && dense.ecology.shrubs.length >= base.ecology.shrubs.length);
	assert.deepEqual(playViolations(DEMO_PLAN, dense), []);
	assert.deepEqual(ecologyViolations(DEMO_PLAN, dense).slice(0, 8), []);
	for (const [key, value] of [['masses', 0], ['traces', 0]]) {
		const r = run(set, { options: { density: { [key]: value } }, tag: `d${key}` });
		assert.equal(r.placements.filter((p) => p.group === (key === 'masses' ? 'mass' : 'trace') && !p.authored).length, 0, key);
	}
});

test('11 · bounded effort: every item inside its own maxTries, placements inside the reach, groups inside their budgets', () => {
	// logTries records every placeItem call: [group, item, tries used, the item's own maxTries]
	for (const set of SEED_SETS) {
		const r = run(set, { options: { logTries: true }, tag: 'tries' }), tr = r.report.tries;
		assert.ok(tr.items.length > 200, `${tr.items.length} items logged`);
		let sum = 0;
		for (const [group, id, used, max] of tr.items) {
			sum += used;
			assert.ok(used >= 1 && used <= max, `${group} ${id}: ${used} tries, its maxTries is ${max}`);
			assert.ok(max <= R.maxTries, `${id}: maxTries ${max}`);
		}
		assert.equal(sum, tr.total, `${set.name}: the items add up to the total`);
		// drops and placements carry the tries they used (shrubs and rolled-back event pieces are only in the log)
		for (const d of r.report.drops) if (d.tries !== undefined) assert.ok(d.tries <= R.maxTries, `${d.item}: ${d.tries}`);
		assert.ok(r.report.drops.some((d) => d.tries > 0), 'drops record their tries');
		assert.ok(r.report.checks.find((c) => c.id === 'bounded').pass);
		// the validator catches a log that overruns an item or does not add up
		const cheat = structuredClone(r);
		cheat.report.tries.items[0][2] = cheat.report.tries.items[0][3] + 1;
		assert.equal(validateLayout({ ...DEMO_PLAN, seed: set.seed }, cheat, catalog).find((c) => c.id === 'bounded').pass, false);
	}
	sets((set, r) => {
		const tr = r.report.tries;
		assert.ok(tr.total > 0 && tr.total <= tr.budget, `${set.name}: ${tr.total} tries, budget ${tr.budget}`);
		assert.ok(tr.maxPerItem <= R.maxTries);
		for (const [g, v] of Object.entries(tr.perGroup)) assert.ok(v.tries <= v.budget, g);
		for (const p of r.placements) if (p.target) assert.ok(Math.hypot(p.x - p.target.x, p.z - p.target.z) <= p.reach + 0.01, `${p.id} is farther than its reach`);
		const bud = r.report.budgets;
		assert.ok(r.report.counts.compositions <= bud.masses);
		assert.ok(r.placements.filter((p) => p.group === 'guide').length <= bud.guides);
		assert.ok(r.ecology.tufts.x.length <= bud.tufts && r.ecology.shrubs.length <= bud.shrubs && r.events.length <= bud.events);
		for (const d of r.report.drops) assert.ok(['play', 'footprint', 'ground', 'distribution', 'unavailable'].includes(d.reason), d.reason);
	});
	// tiny budgets are honoured and the remaining items are simply not placed
	const small = run(SEED_SETS[0], { options: { budgets: { masses: 3, guides: 2, shrubs: 5, tufts: 500, events: 2 } }, tag: 'small' });
	assert.equal(small.report.counts.compositions, 3);
	assert.ok(small.placements.filter((p) => p.group === 'guide').length <= 2 && small.ecology.shrubs.length <= 5 && small.ecology.tufts.x.length <= 500 && small.events.length <= 2);
});

test('12 · occlusion: tall props cover at most 25 % of every screen window; a wall of tall props in front of the path is flagged', () => {
	sets((set, r) => {
		const c = r.report.checks.find((x) => x.id === 'occlusion');
		assert.ok(c.pass && c.details.max <= R.occlusionMax, `${set.name}: ${JSON.stringify(c.details)}`);
	});
	const wall = (n) => ({
		id: 'crafted', seed: 1, bounds: { x0: -32, z0: -32, x1: 32, z1: 32 }, ground: () => ({ height: 0, grass: 0.5 }),
		paths: [{ id: 'road', kind: 'road', points: [{ x: -28, z: 0 }, { x: 28, z: 0 }], width: 4.2 }],
		// south of the road = the camera side: the swept zones fall across the road
		masses: Array.from({ length: n }, (_, i) => ({ id: `w${i}`, asset: 'palisade.wall_c', at: { x: -14 + i * 5.6, z: 4.2 }, yaw: 0 })),
		autoMasses: false,
	});
	const bare = layoutBiome(wall(0), catalog), walled = layoutBiome(wall(6), catalog);
	assert.ok(bare.report.checks.find((x) => x.id === 'occlusion').pass);
	const flagged = walled.report.checks.find((x) => x.id === 'occlusion');
	assert.equal(flagged.pass, false, JSON.stringify(flagged.details));
	assert.ok(flagged.details.max > R.occlusionMax);
	assert.ok(walled.report.warnings.some((w) => w.code === 'check.occlusion'));
	assert.ok(walled.placements.length === 6 && walled.placements.every((p) => p.authored)); // authored masses are the author's word: registered, never refused
	// the same wall placed BY THE ALGORITHM is refused: a grid of tent hosts with a lower share cap drops tents for occlusion-share
	const grid = {
		id: 'tent-grid', seed: 4, bounds: { x0: -32, z0: -32, x1: 32, z1: 32 }, ground: () => ({ height: 0, grass: 0.5 }), defaultZone: 'camp', autoMasses: false,
		zones: [{ id: 'c', kind: 'camp', shape: { x: 0, z: 0, r: 60 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -30, z: 10 }, { x: 30, z: 10 }], width: 4.2 }],
		hosts: Array.from({ length: 33 }, (_, k) => ({ id: `t${k}`, recipe: 'tent', at: { x: -27 + Math.floor(k / 3) * 5.2 + (k % 3 === 1 ? 2.6 : 0), z: [3, -2.5, -8][k % 3] }, yaw: 0, unspaced: true })),
	};
	const tallOf = (r) => r.placements.filter((p) => p.occlusion).length;
	const open = layoutBiome(grid, catalog, { budgets: { members: 400, hosts: 64 } });
	let last = tallOf(open);
	for (const cap of [0.1, 0.05]) {
		const r = layoutBiome(grid, catalog, { budgets: { members: 400, hosts: 64 }, rules: { occlusionMax: cap } });
		const byShare = r.report.drops.filter((d) => d.detail === 'occlusion-share');
		assert.ok(byShare.length >= (cap === 0.1 ? 1 : 5), `cap ${cap}: ${byShare.length} pieces refused for occlusion-share`);
		const check = r.report.checks.find((c) => c.id === 'occlusion');
		assert.ok(check.pass && check.details.raw <= cap + 1e-9, `cap ${cap}: validator max ${check.details.raw}`);
		assert.ok(tallOf(r) < last, 'a lower cap leaves fewer tall pieces');
		last = tallOf(r);
		assert.ok(r.placements.every((p) => !p.authored));
	}
	// …and the same layout judged against a stricter cap is flagged by the validator (the check is not vacuous)
	assert.equal(validateLayout(grid, open, catalog, { rules: { occlusionMax: 0.01 } }).find((c) => c.id === 'occlusion').pass, false);
});

test('13 · fallbacks: a missing kit is replaced by its fallbacks or dropped, and the exclusions still hold', () => {
	const kits = new Set([...catalog.assets.values()].map((a) => a.kit));
	for (const gone of [['tents'], ['rocks', 'mossy'], ['tents', 'tentsB', 'palisade', 'lighting']]) {
		const available = new Set([...kits].filter((k) => !gone.includes(k)));
		const cat = buildCatalog({ sizes, available });
		const r = run(SEED_SETS[1], { cat, tag: `no-${gone.join('+')}` });
		for (const p of r.placements) assert.ok(!gone.includes(p.kit), `${p.id} uses the missing kit ${p.kit}`);
		assert.deepEqual(playViolations(DEMO_PLAN, r), []);
		assert.deepEqual(ecologyViolations(DEMO_PLAN, r).slice(0, 5), []);
		const fb = r.report.checks.filter((c) => !c.pass && ['play-space', 'overlap', 'gaps', 'use-zones', 'ecology-exclusion'].includes(c.id));
		assert.deepEqual(fb.map((c) => c.id), []);
	}
	// with the tents gone the tent hosts take tentsB pieces; with every tent gone they are dropped as unavailable
	const noTents = run(SEED_SETS[1], { cat: buildCatalog({ sizes, available: new Set([...kits].filter((k) => k !== 'tents')) }), tag: 'no-tents' });
	assert.ok(noTents.placements.some((p) => p.kit === 'tentsB' && p.part === 'host'));
	const noTentsAtAll = run(SEED_SETS[1], { cat: buildCatalog({ sizes, available: new Set([...kits].filter((k) => !['tents', 'tentsB', 'palisade', 'lighting'].includes(k))) }), tag: 'no-tents+tentsB+palisade+lighting' });
	assert.ok(noTentsAtAll.report.drops.some((d) => d.reason === 'unavailable'));
	assert.ok(noTentsAtAll.clusters.some((c) => c.dropped), 'dropped clusters are reported');
	assert.equal(buildCatalog({ sizes, available: new Set(['rocks.standard']) }).resolve('rocks.standard').length, 1);
	assert.equal(buildCatalog({ sizes, available: new Set(['shrine']) }).resolve('rocks.standard').length, 0);
});

test('14 · geometry units: footprints after rotation, scale and off-centre pivots; SAT; segment ↔ box; yaw facing; negative coordinates', () => {
	const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
	// off-centre, rotated and scaled: the box [-1,3]×[-0.5,0.5] at (10,-5), yaw 90°, scale 2
	const fp = footprintObb({ x0: -1, x1: 3, z0: -0.5, z1: 0.5 }, 10, -5, Math.PI / 2, 2);
	close(fp.cx, 10); close(fp.cz, -7); close(fp.hx, 4); close(fp.hz, 1);
	const xs = fp.pts.map((p) => p.x).sort((a, b) => a - b), zs = fp.pts.map((p) => p.z).sort((a, b) => a - b);
	close(xs[0], 9); close(xs[3], 11); close(zs[0], -11); close(zs[3], -3);
	// yaw 0 keeps the local box in place; negative coordinates and a half-turn
	const f0 = footprintObb({ x0: -2, x1: 2, z0: 0, z1: 1 }, -3, -4, 0, 1);
	close(f0.cx, -3); close(f0.cz, -3.5);
	const f180 = footprintObb({ x0: -2, x1: 2, z0: 0, z1: 1 }, -3, -4, Math.PI, 1);
	close(f180.cx, -3, 1e-9); close(f180.cz, -4.5, 1e-9);
	// local +z is the front: yaw = yawFacing(dx, dz) turns it toward (dx, dz)
	for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1], [3, -4], [-2, -2]]) {
		const front = toWorld(0, 0, yawFacing(dx, dz), 0, 1), l = Math.hypot(dx, dz);
		close(front.x, dx / l); close(front.z, dz / l);
	}
	// the use zone lies in front of a piece
	const piece = { x0: -1, x1: 1, z0: -1, z1: 1 }, use = useObb(piece, { side: 'front', depth: 1 }, 5, 5, yawFacing(1, 0), 1);
	close(use.cx, 6.5); close(use.cz, 5);
	// SAT: touching, overlapping, separated, rotated
	const sq = (x, z, yaw = 0) => makeObb(x, z, 1, 1, yaw);
	close(obbSeparation(sq(0, 0), sq(2, 0)), 0); close(obbSeparation(sq(0, 0), sq(1.5, 0)), -0.5); close(obbSeparation(sq(0, 0), sq(3, 0)), 1);
	close(obbSeparation(sq(0, 0), sq(2.5, 0, Math.PI / 4)), 2.5 - 1 - Math.SQRT2);
	assert.ok(obbSeparation(sq(-3, -3), sq(-3.5, -3.5, 0.3)) < 0, 'negative coordinates overlap');
	close(obbGap(sq(0, 0), sq(3, 3)), Math.SQRT2); // corner to corner: the SAT bound is 1, the true gap √2
	close(obbGap(sq(0, 0), sq(5, 0)), 3);
	// segment ↔ polygon
	const poly = sq(0, 0).pts;
	close(segPolyDistance({ x: -3, z: 3 }, { x: 3, z: 3 }, poly), 2);
	close(segPolyDistance({ x: -3, z: 0 }, { x: 3, z: 0 }, poly), 0);
	close(segPolyDistance({ x: 0.2, z: 0.2 }, { x: 0.4, z: 0.3 }, poly), 0);
	close(segPolyDistance({ x: 2, z: 0 }, { x: 2, z: 0 }, poly), 1); // zero-length segment = a point
	close(segPolyDistance({ x: -3, z: -3 }, { x: -2, z: -3 }, sq(-5, -5).pts), Math.hypot(1, 1));
	close(polyDistance(sq(0, 0).pts, sq(4, 0).pts), 2);
	assert.equal(pointInPoly(poly, 0.5, -0.5), true);
	close(pointPolySigned(poly, 0, 0), -1); close(pointPolySigned(poly, 3, 0), 2);
	assert.equal(convexHull([{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 1, z: 1 }, { x: 0, z: 1 }, { x: 0.5, z: 0.5 }]).length, 4);
	close(UNITS.SUB, 0.47, 0.005); close(UNITS.H, 1.8);
	close(R.passGap, 2 * UNITS.SUB); close(R.mainPathMin, 3 * UNITS.SUB);
});

test('15 · the existing placement helpers are untouched and the shared numbers agree', () => {
	assert.equal(R.torchGap, BIOME_RULES.torchGap);
	assert.equal(R.rootSpacing, BIOME_RULES.rootSpacing);
	assert.equal(R.bloodMin, BIOME_RULES.maxBlood);
	assert.equal(segmentDistance(3, 4, { x: 0, z: 0 }, { x: 0, z: 0 }), 5);
	assert.deepEqual(Object.keys(ZONE_PROFILES).sort(), ['bank', 'camp', 'den', 'farm', 'field', 'graveyard', 'moor']);
	// every §4.12 check of the validator passes on the demo, and validateLayout can be re-run on a finished result
	sets((set, r) => {
		const failed = r.report.checks.filter((c) => !c.pass).map((c) => c.id);
		assert.deepEqual(failed, [], set.name);
		assert.deepEqual(validateLayout({ ...DEMO_PLAN, seed: set.seed }, r, catalog).map((c) => [c.id, c.pass]), r.report.checks.map((c) => [c.id, c.pass]));
		assert.deepEqual(r.report.warnings.filter((w) => w.code.startsWith('check.')), []);
	});
});

test('15b · the metre table of AD 12 §4.13.4 names every LAYOUT_RULES key; the files §4.13 points to exist', () => {
	const doc = readFileSync(new URL('../../legacy/art-direction/12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md', import.meta.url), 'utf8');
	const a = doc.indexOf('#### 4.13.4'), b = doc.indexOf('#### 4.13.5');
	assert.ok(a > 0 && b > a, '§4.13.4 not found');
	const table = doc.slice(a, b);
	assert.deepEqual(Object.keys(LAYOUT_RULES).filter((k) => !table.includes(k)), [], 'LAYOUT_RULES keys missing from the metre table');
	for (const name of ['SIZE_CLASS', 'DEFAULT_OPTIONS', 'patchField']) assert.ok(table.includes(name), `${name} is not in the metre table`);
	const section = doc.slice(doc.indexOf('### 4.13 '), doc.indexOf('## 5. Công trình'));
	for (const file of ['src/env/biomeLayout.js', 'src/env/biomeCatalog.js', 'src/env/biomeLayoutDemo.js', 'scripts/measure-kits.mjs', 'scripts/biome-layout.test.mjs', 'docs/biome-layout-preview.html']) {
		assert.ok(section.includes(file.split('/').pop()), `§4.13 does not name ${file}`);
		assert.ok(existsSync(new URL(`../${file}`, import.meta.url)) || file.endsWith('.html'), `${file} is missing`);
	}
});

// ---------------------------------------------------------------------------------------------------------------
// Regressions of the review rounds

const flatGround = () => ({ height: 0, grass: 0.5 });

test('16 · the camera shadow of a tall piece never covers a door corridor, standing zone, spawn or arena', () => {
	// primitive: overlapping polygons have a NEGATIVE gap (it used to be 0, which a `< 0` test never sees)
	const sq = [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 2, z: 2 }, { x: 0, z: 2 }], inner = [{ x: 0.5, z: 0.5 }, { x: 1.5, z: 0.5 }, { x: 1.5, z: 1.5 }, { x: 0.5, z: 1.5 }];
	const shifted = sq.map((p) => ({ x: p.x + 1.5, z: p.z }));
	assert.equal(shapeGap({ t: 'poly', pts: sq }, inner), -1);
	assert.ok(Math.abs(polyGap(sq, shifted) + 0.5) < 1e-9 && Math.abs(polyPenetration(sq, shifted) - 0.5) < 1e-9);
	assert.equal(polyGap(sq, sq.map((p) => ({ x: p.x + 2, z: p.z }))), 0); // touching
	assert.equal(polyGap(sq, sq.map((p) => ({ x: p.x + 3, z: p.z }))), 1);
	assert.ok(shapeGap({ t: 'circle', x: 1, z: 1, r: 0.5 }, sq) < 0);

	const base = {
		id: 'occ-zones', seed: 3, bounds: { x0: -20, z0: -20, x1: 20, z1: 20 }, ground: () => ({ height: 0, grass: 0.6 }), autoMasses: false, defaultZone: 'camp',
		zones: [{ id: 'c', kind: 'camp', shape: { x: 0, z: 0, r: 19 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -18, z: 10 }, { x: 18, z: 10 }], width: 4.2 }],
	};
	const tent = (at) => ({ ...base, hosts: [{ id: 'h', recipe: 'tent', at, yaw: 0 }] });
	const hostDrop = (r) => r.report.drops.find((d) => d.item === 'cluster:h:host');
	// a door whose corridor runs north from the wall: the tent's footprint stays clear of it, its shadow (swept north-west) does not
	const door = { doors: [{ id: 'd', at: { x: 0, z: -4 }, yaw: Math.PI, kind: 'door', width: 1.6, depth: 3 }] };
	const control = layoutBiome(tent({ x: 4.2, z: -3.2 }), catalog);
	const tentPiece = control.placements.find((p) => p.id === 'cluster:h:host');
	assert.ok(tentPiece && tentPiece.occlusion, 'without the door the tent is placed');
	const withDoor = layoutBiome({ ...tent({ x: 4.2, z: -3.2 }), ...door }, catalog);
	assert.equal(withDoor.placements.find((p) => p.id === 'cluster:h:host'), undefined, 'the tent whose shadow covers the door corridor is not placed');
	assert.equal(hostDrop(withDoor).reason, 'play');
	assert.equal(hostDrop(withDoor).detail, 'occlusion:door:d');
	// the same for a rectangular arena (a polygon too)
	const arenaPlan = { arenas: [{ id: 'a', rect: { x0: -4, z0: -13, x1: 4, z1: -6.6 } }] };
	const arena = layoutBiome({ ...tent({ x: 0, z: -3.5 }), ...arenaPlan }, catalog);
	assert.equal(arena.placements.find((p) => p.id === 'cluster:h:host'), undefined);
	assert.equal(hostDrop(arena).detail, 'occlusion:arena:a');
	// a standing zone and a spawn (circles) were already refused; they still are
	const spawn = layoutBiome({ ...tent({ x: 4.2, z: -3.2 }), spawns: [{ id: 's', at: { x: 0.5, z: -6.5 }, radius: 1.2 }] }, catalog);
	assert.equal(hostDrop(spawn).detail, 'occlusion:spawn:s');
	// the validator recomputes it from the output: the control layout judged against the door plan is flagged
	const flagged = validateLayout({ ...tent({ x: 4.2, z: -3.2 }), ...door }, control, catalog).find((c) => c.id === 'occlusion-zones');
	assert.equal(flagged.pass, false);
	assert.equal(flagged.details.violations[0].with, 'd');
	// demo: every non-authored tall piece keeps its shadow off every door / arena / interaction / spawn — except a door's own markers
	sets((set, r) => {
		assert.ok(r.report.checks.find((c) => c.id === 'occlusion-zones').pass, set.name);
		const P = preparePlan({ ...DEMO_PLAN, seed: set.seed });
		const decs = new Map(r.decisions.map((d) => [d.id, d]));
		for (const p of r.placements.filter((q) => q.occlusion && !q.authored)) {
			for (const res of P.reserved) {
				if (!['door', 'arena', 'interaction', 'spawn'].includes(res.kind) || res.id === p.owns) continue;
				if (res.kind === 'door' && p.group === 'guide' && decs.get(p.decision)?.door === res.id) continue;
				const overlap = res.t === 'poly' ? polyDistance(res.pts, p.occlusion) === 0 : shapeGap(res, p.occlusion) < 0;
				assert.equal(overlap, false, `${set.name}: ${p.id} shades ${res.kind}:${res.id}`);
			}
		}
	});
});

test('17 · fallbacks stay in the recipe: used only when the recipe has nothing left, never because a piece did not fit', () => {
	const kits = new Set([...catalog.assets.values()].map((a) => a.kit));
	for (const set of SEED_SETS) {
		const r = run(set);
		// everything available: no placement outside the recipe / policy / mass sets, in any cluster, guide or mass
		for (const c of r.clusters) {
			const recipe = CLUSTERS[c.recipe], allowed = new Set([...(recipe.host ?? []), ...recipe.members.flatMap((m) => m.asset)]);
			for (const id of [c.mass ? null : c.host?.id, ...c.members].filter(Boolean)) assert.ok(allowed.has(r.placements.find((p) => p.id === id).asset), `${set.name}: ${id}`);
		}
		const markers = new Set(Object.values(GUIDES).flatMap((g) => Object.values(g).filter(Array.isArray).flat()));
		for (const p of r.placements.filter((q) => q.group === 'guide')) assert.ok(markers.has(p.asset), `${set.name}: ${p.id} (${p.asset})`);
		const massAssets = new Set([...Object.values(MASS_SETS.rock), ...Object.values(MASS_SETS.tree)].flatMap((s) => Object.values(s).flat()).concat(MASS_SETS.landmark));
		for (const p of r.placements.filter((q) => q.group === 'mass' && !q.authored)) assert.ok(massAssets.has(p.asset), `${set.name}: ${p.id} (${p.asset})`);
	}
	// with a kit gone, a member is another alternative of its recipe entry or a same-class fallback of one (a graves "low rock" never becomes a tall mossy rock)
	for (const gone of [['rocks'], ['deadTrees'], ['tents']]) {
		const cat = buildCatalog({ sizes, available: new Set([...kits].filter((k) => !gone.includes(k))) });
		for (const set of SEED_SETS) {
			const r = run(set, { cat, tag: `no-${gone}` });
			for (const p of r.placements.filter((q) => q.group === 'cluster' && q.part === 'member')) {
				const wanted = CLUSTERS[r.clusters.find((c) => c.id === p.cluster).recipe].members.flatMap((m) => m.asset);
				if (wanted.includes(p.asset)) continue;
				const from = wanted.map((id) => catalog.get(id)).find((a) => a.fallback.includes(p.asset));
				assert.ok(from, `${p.id} (${p.asset}) is neither a recipe piece nor a fallback of one`);
				const a = catalog.get(p.asset);
				assert.equal(a.collision, from.collision);
				assert.equal(layerClass(a.layer), layerClass(from.layer));
			}
			// a fallback is scaled by its own range
			for (const p of r.placements.filter((q) => !q.authored && !q.procedural && q.group !== 'trace')) {
				const a = catalog.get(p.asset);
				assert.ok(p.scale >= a.scale[0] - 0.002 && p.scale <= a.scale[1] + 0.002, `${p.id} (${p.asset}) scale ${p.scale}`);
			}
		}
	}
});

test('18 · a landmark never takes the place of a planned cluster or event (cramped plan)', () => {
	const cramped = {
		id: 'cramped', seed: 5, bounds: { x0: -20, z0: -20, x1: 20, z1: 20 }, ground: (x, z) => ({ height: 0.3 * Math.sin(x * 0.1) * Math.cos(z * 0.13), grass: 0.6, wet: 0.2 }), defaultZone: 'camp',
		zones: [{ id: 'camp', kind: 'camp', shape: { x: 0, z: 0, r: 25 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -20, z: 2 }, { x: 0, z: 0 }, { x: 20, z: -3 }], width: 4.2, inhabited: true }],
		hosts: [
			{ id: 'f1', recipe: 'campfire', at: { x: -10, z: -10 }, yaw: 0 }, { id: 't1', recipe: 'tent', at: { x: -14, z: -14 } }, { id: 't2', recipe: 'tent', at: { x: -4, z: -15 } },
			{ id: 'k1', recipe: 'kitchen', at: { x: 5, z: -14 } }, { id: 's1h', recipe: 'storage', at: { x: 14, z: -14 } }, { id: 'sm', recipe: 'smithy', at: { x: 14, z: 8 } },
			{ id: 'ri', recipe: 'ritual', at: { x: -14, z: 12 } }, { id: 'ta', recipe: 'tannery', at: { x: -15, z: 4 } },
		],
		events: [{ id: 'e2', cause: 'ritual', host: 'ri' }],
	};
	for (let seed = 1; seed <= 6; seed++) {
		const r = layoutBiome({ ...cramped, seed }, catalog, { seeds: { mass: seed * 3 } });
		for (const d of r.report.drops.filter((q) => q.group === 'cluster' || q.group === 'trace')) assert.ok(!String(d.detail).includes('landmark'), `${seed}: ${d.item} lost to a landmark (${d.detail})`);
		for (const p of r.placements.filter((q) => q.id.startsWith('mass:landmark'))) {
			for (const h of cramped.hosts) assert.ok(Math.hypot(p.x - h.at.x, p.z - h.at.z) >= R.hostKeepOut - 0.01, `${seed}: ${p.id} is ${Math.hypot(p.x - h.at.x, p.z - h.at.z).toFixed(1)} m from host ${h.id}`);
		}
		assert.ok(r.report.warnings.some((w) => w.code === 'landmark.missing') || r.placements.some((p) => p.id.startsWith('mass:landmark')), 'a missing landmark is reported');
		assert.equal(r.report.checks.filter((c) => !c.pass && c.id !== 'landmark').length, 0, JSON.stringify(r.report.checks.filter((c) => !c.pass && c.id !== 'landmark').map((c) => c.id)));
	}
	// on open ground the landmark rhythm still gets its tall piece: only pieces whose own scale range reaches 2 H, inside that range
	const open = { id: 'open', seed: 5, bounds: { x0: -64, z0: -64, x1: 64, z1: 64 }, ground: () => ({ height: 0, grass: 0.5, wet: 0.1 }), paths: [{ id: 'road', kind: 'road', points: [{ x: -60, z: 0 }, { x: 60, z: 4 }], width: 4.2, inhabited: true }] };
	for (const seed of [5, 6, 7]) {
		const r = layoutBiome({ ...open, seed }, catalog);
		const marks = r.placements.filter((p) => p.id.startsWith('mass:landmark'));
		assert.ok(marks.length >= 1, `${seed}: no landmark inserted`);
		for (const p of marks) {
			const a = catalog.get(p.asset);
			assert.ok(p.height >= R.landmarkHeight - 1e-6, `${p.id}: ${p.height} m`);
			assert.ok(p.scale >= a.scale[0] - 0.002 && p.scale <= a.scale[1] + 0.002, `${p.id}: scale ${p.scale} outside ${a.scale}`);
		}
		assert.ok(r.report.checks.find((c) => c.id === 'landmark').pass);
	}
});

test('19 · budgets: the default tuft and shrub budgets follow the plan area; a cap thins the whole map, never cuts it off in scan order', () => {
	const road = (half) => [{ id: 'road', kind: 'road', points: [{ x: -half + 2, z: 0 }, { x: half - 2, z: 0 }], width: 4.2, inhabited: true }];
	const ground = (x, z) => ({ height: 0.3 * Math.sin(x * 0.1) * Math.cos(z * 0.13), grass: 0.6, wet: 0.2 });
	const plan = (half) => ({ id: 'big', seed: 11, bounds: { x0: -half, z0: -half, x1: half, z1: half }, ground, paths: road(half) });
	const bands = (r, half) => {
		const t = r.ecology.tufts, s = r.ecology.shrubs, tb = Array(8).fill(0), sb = Array(8).fill(0);
		for (let i = 0; i < t.x.length; i++) tb[Math.min(7, Math.floor(((t.z[i] + half) / (2 * half)) * 8))]++;
		for (const q of s) sb[Math.min(7, Math.floor(((q.z + half) / (2 * half)) * 8))]++;
		return { tb, sb };
	};
	// 512 × 512 m, default budgets: every band of the map grows grass and shrubs, nothing is capped
	const big = layoutBiome(plan(256), catalog);
	assert.ok(big.report.budgets.tufts >= 512 * 512 * R.tuftsPerArea * 0.99 && big.report.budgets.shrubs >= 512 * 512 * R.shrubsPerArea * 0.99, JSON.stringify(big.report.budgets));
	assert.deepEqual(big.report.warnings.filter((w) => w.code.startsWith('budget.')), []);
	const { tb, sb } = bands(big, 256), mean = tb.reduce((a, b) => a + b, 0) / 8;
	for (const n of tb) assert.ok(n > 0.5 * mean && n < 1.6 * mean, `tuft bands ${tb}`);
	for (const n of sb) assert.ok(n > 0, `shrub bands ${sb}`);
	// an explicit cap (a fraction of what the plan wants) is honoured and spread over the whole map
	const capped = layoutBiome(plan(128), catalog, { budgets: { tufts: 4000, shrubs: 40 } });
	const c = bands(capped, 128);
	assert.ok(capped.ecology.tufts.x.length <= 4000 && capped.ecology.tufts.x.length >= 1500, `${capped.ecology.tufts.x.length} tufts`);
	assert.ok(capped.ecology.shrubs.length <= 40 && capped.ecology.shrubs.length >= 15, `${capped.ecology.shrubs.length} shrubs`);
	const cm = c.tb.reduce((a, b) => a + b, 0) / 8;
	for (const n of c.tb) assert.ok(n > 0.4 * cm && n < 1.8 * cm, `capped tuft bands ${c.tb}`);
	assert.ok(c.sb.filter((n) => n > 0).length >= 5, `capped shrub bands ${c.sb}`);
	// …and a cap far below that (the hard backstop) still hits random cells, not the south of the map
	const tiny = layoutBiome(plan(128), catalog, { budgets: { tufts: 600, shrubs: 8 } });
	const t = bands(tiny, 128).tb;
	assert.ok(t.filter((n) => n > 0).length >= 6, `tiny cap bands ${t}`);
});

test('20 · open ground between clusters: clusterClear apart, outside other hosts\' bare radius, hosts spaced, sizes mixed', () => {
	sets((set, r) => {
		const pieces = r.placements.filter((p) => p.cluster && p.layer !== 'decal');
		const bad = [];
		for (let i = 0; i < pieces.length; i++) {
			for (let j = i + 1; j < pieces.length; j++) {
				if (pieces[i].cluster === pieces[j].cluster) continue;
				const gap = obbGap(obbFrom(pieces[i].footprint), obbFrom(pieces[j].footprint));
				if (gap < R.clusterClear - TOL) bad.push(`${pieces[i].id} ~ ${pieces[j].id} ${gap.toFixed(2)}`);
			}
		}
		assert.deepEqual(bad, [], set.name);
		for (const c of r.clusters.filter((q) => !q.dropped && q.rest)) {
			const bare = CLUSTERS[c.recipe].bare;
			for (const p of pieces) if (p.cluster !== c.id && bare > 0) assert.ok(pointPolySigned(obbFrom(p.footprint).pts, c.rest.x, c.rest.z) >= bare - TOL, `${p.id} stands in the bare ground of ${c.id}`);
		}
		const hosts = r.clusters.filter((c) => !c.dropped && c.host && !c.mass);
		for (let i = 0; i < hosts.length; i++) for (let j = i + 1; j < hosts.length; j++) assert.ok(Math.hypot(hosts[i].host.x - hosts[j].host.x, hosts[i].host.z - hosts[j].host.z) >= R.clusterSpacing - TOL, `${hosts[i].id} / ${hosts[j].id} closer than clusterSpacing`);
		assert.ok(r.report.checks.find((c) => c.id === 'cluster-clear').pass);
		// the camp keeps open ground round its pieces: over 40 % of the camp disc is farther than 2 m from any piece (it was 39 % with 0.4 m between clusters)
		const camp = { x: 38, z: -39, r: 24 }, inCamp = r.placements.filter((p) => Math.hypot(p.x - camp.x, p.z - camp.z) <= camp.r).map((p) => obbFrom(p.footprint));
		let total = 0, open = 0;
		for (let z = camp.z - camp.r; z <= camp.z + camp.r; z += 0.5) {
			for (let x = camp.x - camp.r; x <= camp.x + camp.r; x += 0.5) {
				if (Math.hypot(x - camp.x, z - camp.z) > camp.r) continue;
				total++;
				if (inCamp.every((f) => Math.abs(f.cx - x) > 7 || Math.abs(f.cz - z) > 7 || pointPolySigned(f.pts, x, z) > 2)) open++;
			}
		}
		assert.ok(open / total >= 0.4, `${set.name}: ${(open / total).toFixed(2)} of the camp is open`);
		// the size rhythm: clusters of 4+ pieces mix sizes (a flat one is reported as a warning)
		const mixed = r.clusters.filter((c) => !c.dropped && c.pieces >= R.sizeMixMin);
		assert.ok(mixed.length >= 8 && mixed.filter((c) => sizeRhythmOk(c.sizeMix)).length / mixed.length >= 0.75, `${set.name}: ${mixed.map((c) => `${c.id}:${c.sizeMix.large}/${c.sizeMix.medium}/${c.sizeMix.small}`)}`);
		for (const c of mixed.filter((q) => !sizeRhythmOk(q.sizeMix))) assert.ok(r.report.warnings.some((w) => w.code === 'cluster.sizeMix' && w.id === c.id), `${c.id} is flat but not reported`);
	});
	// two hosts planted 4 m apart: the second is refused (gap, clusterClear or clusterSpacing, whichever fails first), never crowds the first
	const two = {
		id: 'two', seed: 2, bounds: { x0: -20, z0: -20, x1: 20, z1: 20 }, ground: flatGround, defaultZone: 'camp', autoMasses: false, zones: [{ id: 'c', kind: 'camp', shape: { x: 0, z: 0, r: 30 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -19, z: 17 }, { x: 19, z: 17 }], width: 4.2 }],
		hosts: [{ id: 'a', recipe: 'kitchen', at: { x: -2, z: 0 } }, { id: 'b', recipe: 'storage', at: { x: 2, z: 0 } }],
	};
	const r2 = layoutBiome(two, catalog);
	assert.ok(r2.clusters.find((c) => c.id === 'b').dropped, 'the second host is refused');
	assert.ok(r2.report.drops.some((d) => d.item === 'cluster:b:host' && d.reason === 'distribution'), JSON.stringify(r2.report.drops));
});

test('21 · scales stay in the declared range; secondaries are smaller than their main piece; shrubs are bushes; crowns sweep the canopy', () => {
	sets((set, r) => {
		for (const p of r.placements.concat(r.ecology.shrubs)) {
			if (p.authored || p.procedural || p.group === 'trace') continue;
			const a = catalog.get(p.asset);
			assert.ok(p.scale >= a.scale[0] - 0.002 && p.scale <= a.scale[1] + 0.002, `${set.name}: ${p.id} (${p.asset}) scale ${p.scale}, declared ${a.scale}`);
		}
		// traces carry their own scale range in the recipe (the drag pieces shrink by dragScale per step)
		for (const p of r.placements.filter((q) => q.group === 'trace')) {
			const recipe = TRACES[r.events.find((e) => e.id === p.event).cause], entries = [...recipe.main, ...recipe.secondary, ...recipe.drag].filter((e) => e.asset === p.asset);
			const lo = Math.min(...entries.map((e) => e.scale[0])) * (p.part === 'drag' ? R.dragScale ** R.traceDrag[1] : 1), hi = Math.max(...entries.map((e) => e.scale[1]));
			assert.ok(p.scale >= lo - 0.002 && p.scale <= hi + 0.002, `${p.id}: scale ${p.scale}, recipe ${lo}–${hi}`);
		}
		const big = (p) => { const a = catalog.get(p.asset); return Math.max(a.full.x1 - a.full.x0, a.full.z1 - a.full.z0, a.height) * p.scale; };
		const secondaries = r.placements.filter((q) => q.group === 'mass' && q.part === 'secondary');
		assert.ok(secondaries.length >= 5, `${set.name}: ${secondaries.length} secondaries`);
		for (const p of secondaries) assert.ok(big(p) <= R.massSecondaryMax * big(r.placements.find((q) => q.id === `${p.mass}:main`)) + 0.01, `${p.id} is not smaller than its main piece`);
		for (const s of r.ecology.shrubs) assert.ok(s.height < R.tallMin, `${s.id}: ${s.height} m`);
		// the camera shadow of a tree covers the scaled canopy box, not a fixed 0.5 m ring round the trunk
		for (const p of r.placements.filter((q) => q.occlusion && catalog.get(q.asset)?.crown)) {
			const a = catalog.get(p.asset), box = footprintObb(a.full, p.x, p.z, p.yaw, p.scale);
			for (const c of box.pts) assert.ok(pointPolySigned(p.occlusion, c.x, c.z) <= 0.01, `${p.id}: canopy corner outside the shadow`);
		}
	});
	assert.ok(R.shrubH[1] * UNITS.H <= R.tallMin + 1e-9, 'bushes stay under the 0.5 H tall line (§4.2)');
	// the validator is not vacuous: an out-of-range scale is flagged
	const r = run(SEED_SETS[0]), bad = structuredClone(r);
	const victim = bad.placements.find((p) => !p.authored && !p.procedural && p.group === 'cluster');
	victim.scale = 3;
	assert.equal(validateLayout({ ...DEMO_PLAN, seed: SEED_SETS[0].seed }, bad, catalog).find((c) => c.id === 'scale-range').pass, false);
});

test('22 · the host mass is part of its cluster: members stand against the wall, other clusters keep their distance', () => {
	const yard = (seed, extra = {}) => ({
		id: 'yard', seed, bounds: { x0: -32, z0: -32, x1: 32, z1: 32 }, ground: flatGround, defaultZone: 'farm', autoMasses: false, zones: [{ id: 'f', kind: 'farm', shape: { x: 0, z: 0, r: 60 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -30, z: 24 }, { x: 30, z: 24 }], width: 4.2 }],
		doors: [{ id: 'door', at: { x: 0, z: 2.5 }, yaw: 0, kind: 'door', width: 1.6, depth: 3 }],
		masses: [{ id: 'house', kind: 'building', footprint: { w: 7, d: 5 }, height: 3.9, at: { x: 0, z: 0 }, yaw: 0 }],
		hosts: [{ id: 'yard', recipe: 'farmyard', mass: 'house' }], ...extra,
	});
	let against = 0, members = 0;
	for (let seed = 1; seed <= 12; seed++) {
		const r = layoutBiome(yard(seed), catalog), house = r.placements.find((p) => p.id === 'mass:house');
		assert.equal(house.cluster, 'yard', 'the mass records the cluster it hosts');
		for (const p of r.placements.filter((q) => q.cluster === 'yard' && q.part === 'member')) {
			const gap = obbGap(obbFrom(p.footprint), obbFrom(house.footprint));
			members++;
			if (p.blocks) {
				assert.ok(gap >= R.clusterGap - TOL, `${seed}: ${p.id} ${gap}`);
				if (gap < R.passGap) against++;
			}
		}
		assert.deepEqual(r.report.checks.filter((c) => !c.pass && c.id !== 'landmark').map((c) => c.id), [], `seed ${seed}`); // a bare yard has no landmark in sight
	}
	assert.ok(members > 25 && against >= 3, `${against} of ${members} members stand against the wall (< ${R.passGap.toFixed(2)} m)`);
	// another cluster's piece still keeps passGap / clusterClear from that wall
	const r = layoutBiome(yard(3, { hosts: [{ id: 'yard', recipe: 'farmyard', mass: 'house' }, { id: 'store', recipe: 'storage', at: { x: 8, z: 0 } }] }), catalog);
	const house = r.placements.find((p) => p.id === 'mass:house');
	for (const p of r.placements.filter((q) => q.cluster === 'store' && q.layer !== 'decal')) assert.ok(obbGap(obbFrom(p.footprint), obbFrom(house.footprint)) >= R.clusterClear - TOL, p.id);
	// the same plan in any order of plan.hosts: the mass joins its cluster (and its bare radius counts) before the first cluster is placed
	for (const [label, at] of [['east', { x: 5.8, z: 0 }], ['west', { x: -5.8, z: 0.5 }]]) {
		const hosts = [{ id: 'store', recipe: 'storage', at }, { id: 'yard', recipe: 'farmyard', mass: 'house' }];
		for (const seed of [3, 5, 8]) {
			const q = layoutBiome(yard(seed, { hosts }), catalog), wall = q.placements.find((p) => p.id === 'mass:house');
			assert.equal(wall.cluster, 'yard', `${label} ${seed}: the mass records its cluster when the building is listed last`);
			for (const p of q.placements.filter((m) => m.cluster === 'store' && m.layer !== 'decal')) assert.ok(obbGap(obbFrom(p.footprint), obbFrom(wall.footprint)) >= R.clusterClear - TOL, `${label} ${seed}: ${p.id}`);
			assert.ok(q.report.checks.find((c) => c.id === 'cluster-clear').pass, `${label} ${seed}: cluster-clear`);
		}
	}
});

test('22b · an authored mass may touch a corridor (gap 0) but never enter it', () => {
	const plan = (z) => ({
		id: 'touch', seed: 1, bounds: { x0: -24, z0: -24, x1: 24, z1: 24 }, ground: flatGround, defaultZone: 'farm', autoMasses: false, zones: [{ id: 'f', kind: 'farm', shape: { x: 0, z: 0, r: 60 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -22, z: 0 }, { x: 22, z: 0 }], width: 4.2 }],
		masses: [{ id: 'shed', kind: 'building', footprint: { w: 4, d: 4 }, height: 3, at: { x: 0, z }, yaw: 0 }],
	});
	const touching = layoutBiome(plan(4.1), catalog), inside = layoutBiome(plan(4.05), catalog); // road half width 2.1 + mass half depth 2
	assert.deepEqual(touching.report.warnings.filter((w) => w.code === 'authored.conflict'), [], 'a mass that exactly touches the corridor is not a conflict');
	assert.ok(touching.report.checks.find((c) => c.id === 'play-space').pass);
	assert.equal(inside.report.warnings.filter((w) => w.code === 'authored.conflict').length, 1, 'entering the corridor by 5 cm is');
	assert.equal(inside.report.checks.find((c) => c.id === 'play-space').pass, false);
});

test('22b2 · a rotated authored mass 0.4 mm clear of a corridor passes engine and validator alike', () => {
	for (let i = 1; i <= 40; i++) {
		const yaw = 0.0123 + i * 0.0377, hx = 3.5, hz = 2.5, ext = hx * Math.abs(Math.sin(yaw)) + hz * Math.abs(Math.cos(yaw));
		const r = layoutBiome({
			id: 'touch', seed: 1, bounds: { x0: -24, z0: -24, x1: 24, z1: 24 }, ground: flatGround, defaultZone: 'farm', autoMasses: false, zones: [{ id: 'f', kind: 'farm', shape: { x: 0, z: 0, r: 60 } }],
			paths: [{ id: 'road', kind: 'road', points: [{ x: -22, z: 0 }, { x: 22, z: 0 }], width: 4.2 }],
			masses: [{ id: 'shed', kind: 'building', footprint: { w: 2 * hx, d: 2 * hz }, height: 3, at: { x: 0.3, z: 2.1 + ext + 0.0004 }, yaw }],
		}, catalog);
		assert.deepEqual(r.report.warnings.filter((w) => w.code === 'authored.conflict'), [], `yaw ${yaw}: engine`);
		assert.ok(r.report.checks.find((c) => c.id === 'play-space').pass, `yaw ${yaw}: validator`);
	}
});

test('22d · a walk-through mass (collision: false) is decor: not a blocker, no camera shadow, but nothing stands on it', () => {
	const plan = (collision) => ({
		id: 'walk', seed: 3, bounds: { x0: -24, z0: -24, x1: 24, z1: 24 }, ground: flatGround, defaultZone: 'moor', autoMasses: false, zones: [{ id: 'm', kind: 'moor', shape: { x: 0, z: 0, r: 60 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -22, z: 0 }, { x: 22, z: 0 }], width: 4.2 }],
		masses: [
			{ id: 'rock', kind: 'cliff', footprint: { w: 3, d: 3 }, height: 2, at: { x: 0, z: 10 }, yaw: 0 },
			{ id: 'carcass', kind: 'carcass', footprint: { w: 2.8, d: 1.5 }, height: 0.5, at: { x: 0, z: 13.1 }, yaw: 0.8, ...(collision === undefined ? {} : { collision }) }, // ~0.3 m from the rock: closer than passGap
		],
		hosts: [{ id: 'fire', recipe: 'campfire', at: { x: -10, z: -10 }, yaw: 0 }],
		events: [{ id: 'kill', cause: 'predation', host: 'carcass', at: { x: 4, z: 14 }, dir: 0, age: 'fresh' }],
	});
	const solid = layoutBiome(plan(), catalog), walk = layoutBiome(plan(false), catalog);
	const c = (r) => r.placements.find((p) => p.id === 'mass:carcass');
	assert.equal(c(solid).class, 'obstacle');
	assert.equal(c(solid).blocks, true);
	assert.equal(c(walk).class, 'decor');
	assert.equal(c(walk).blocks, false);
	assert.equal(c(walk).role, 'ground');
	assert.equal(c(walk).occlusion, undefined, 'a walk-through mass casts no camera shadow');
	for (const id of ['overlap', 'gaps', 'play-space', 'passability', 'traces']) assert.ok(walk.report.checks.find((k) => k.id === id)?.pass, `${id} on the walk-through plan`);
	assert.ok(c(walk).footprint && c(walk).authored && c(walk).mass === 'carcass');
	// other pieces keep off its footprint, like off a corpse piece
	const fp = obbFrom(c(walk).footprint);
	for (const p of walk.placements) if (p.id !== 'mass:carcass' && p.layer !== 'decal') assert.ok(obbSeparation(obbFrom(p.footprint), fp) >= -TOL, `${p.id} stands on the carcass`);
	// an event may still name it as host
	assert.ok(walk.placements.some((p) => p.event === 'kill'), 'the kill event attaches to the walk-through carcass');
});

test('22c · the light budget is a placement rule; size rhythm and distinct clusters hold on other seeds, in any host order', () => {
	// kitchens (lit pot hosts) round a gate: the gate pair is designed and always stands, the lit hosts that would push a window past
	// maxLightsPerScreen are refused with a distribution reason, and the lights of different windows do not count against each other
	const camp = {
		id: 'fires', seed: 5, bounds: { x0: -24, z0: -24, x1: 24, z1: 24 }, ground: flatGround, defaultZone: 'camp', autoMasses: false, zones: [{ id: 'c', kind: 'camp', shape: { x: 0, z: 0, r: 60 } }],
		paths: [{ id: 'road', kind: 'road', points: [{ x: -20, z: 0 }, { x: 20, z: 0 }], width: 4.2 }],
		doors: [{ id: 'gate', at: { x: 0, z: 6 }, yaw: Math.PI, kind: 'gate' }],
		hosts: [[-9, -7], [9, -7], [-9, 8], [9, 8], [0, -8], [-14, 0]].map(([x, z], i) => ({ id: `pot${i}`, recipe: 'kitchen', at: { x, z }, unspaced: true })),
	};
	const r = layoutBiome(camp, catalog);
	assert.ok(r.report.checks.find((c) => c.id === 'lights').pass, 'lights check');
	assert.deepEqual(r.report.drops.filter((d) => d.detail === 'light-budget').map((d) => d.group), ['cluster'], 'a lit host was refused for the budget');
	assert.equal(r.placements.filter((p) => p.pair === 'door:gate').length, 2, 'the gate pair stands');
	assert.ok(r.placements.filter((p) => p.light).length > R.maxLightsPerScreen);
	// seeds that used to fail one check each (lights 21, size-rhythm 13/18/19, clusters 1/10/12), plan order and fully reversed
	for (const seed of [1, 10, 12, 13, 18, 19, 21]) {
		for (const hosts of [DEMO_PLAN.hosts, [...DEMO_PLAN.hosts].reverse()]) {
			const q = layoutBiome({ ...DEMO_PLAN, seed, hosts }, catalog);
			assert.deepEqual(q.report.checks.filter((c) => !c.pass).map((c) => c.id), [], `seed ${seed}${hosts === DEMO_PLAN.hosts ? '' : ' reversed'}`);
		}
	}
});

test('23 · odds and ends: a ground() that returns NaN, the validator catches hand-made violations', () => {
	// NaN heights never reach a placement: they fail as `ground`
	const nan = layoutBiome({ id: 'nan', seed: 2, bounds: { x0: -32, z0: -32, x1: 32, z1: 32 }, ground: (x) => ({ height: x > 0 ? NaN : 0, grass: 0.5 }), defaultZone: 'moor', paths: [{ id: 'road', kind: 'road', points: [{ x: -30, z: 20 }, { x: 30, z: 20 }], width: 4.2 }] }, catalog);
	for (const p of nan.placements) assert.ok(Number.isFinite(p.y) && Number.isFinite(p.x), `${p.id} has y ${p.y}`);
	for (const s of nan.ecology.shrubs) assert.ok(Number.isFinite(s.y), s.id);
	assert.ok(nan.placements.length > 0 && nan.placements.every((p) => p.x < 1), 'only the finite half of the map is built');
	// the cluster budget warning appears once, not once per remaining host
	const many = { ...DEMO_PLAN, seed: 4 };
	const capped = layoutBiome(many, catalog, { budgets: { members: 10 } });
	assert.equal(capped.report.warnings.filter((w) => w.code === 'budget.members').length, 1);
	// hand-made violations of the new rules are flagged by the validator
	const r = run(SEED_SETS[1]), plan = { ...DEMO_PLAN, seed: SEED_SETS[1].seed };
	const crowd = structuredClone(r);
	const [a, b] = crowd.placements.filter((p) => p.cluster && p.layer !== 'decal' && p.part === 'member').slice(0, 1).concat(crowd.placements.filter((p) => p.cluster && p.part === 'member' && p.layer !== 'decal').slice(-1));
	assert.notEqual(a.cluster, b.cluster);
	b.footprint = { ...a.footprint, cx: a.footprint.cx + a.footprint.hx + b.footprint.hx + 0.3 };
	assert.equal(validateLayout(plan, crowd, catalog).find((c) => c.id === 'cluster-clear').pass, false);
	const shaded = structuredClone(r);
	const tall = shaded.placements.find((p) => p.occlusion && !p.authored && p.group === 'cluster');
	const door = DEMO_PLAN.doors[0];
	tall.occlusion = [{ x: door.at.x - 1, z: door.at.z + 0.5 }, { x: door.at.x + 1, z: door.at.z + 0.5 }, { x: door.at.x + 1, z: door.at.z + 2 }, { x: door.at.x - 1, z: door.at.z + 2 }];
	assert.equal(validateLayout(plan, shaded, catalog).find((c) => c.id === 'occlusion-zones').pass, false);
	const off = structuredClone(r);
	off.placements.find((p) => p.group === 'cluster' && p.part === 'member').asset = 'rocks.standard';
	assert.equal(validateLayout(plan, off, catalog).find((c) => c.id === 'clusters').pass, false);
});

test('performance: the demo layout stays under a second', () => {
	const t0 = performance.now();
	layoutBiome(DEMO_PLAN, catalog);
	const ms = performance.now() - t0;
	console.log(`# demo layout ${ms.toFixed(0)} ms; layouts run by this suite: ${timings.map((t) => t.ms.toFixed(0)).join(', ')} ms`);
	assert.ok(ms < 1500, `${ms} ms`);
});

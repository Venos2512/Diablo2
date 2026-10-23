// ASHLAR · Act I · the walled Lychgate hub of seed 21 as an outdoor map: env/hubOutdoor.js (frozen hub plan → outdoor PLAN) + maps/lychgateHub.js, and the converter
// on several layout families (frozen fixtures scripts/fixtures/hub/*.json: stone / palisade rings; square, clipped, rounded and irregular corners; the main gate and
// the lychgate on any side; hub-gen/2 and hub-gen/3 plans). The live generator is walked by scripts/hub-outdoor-survey.mjs, which this test shares its checker with.
// node --test scripts/hub-outdoor.test.mjs
// Checks: the frozen JSON (provenance, 75 masses); the converter is pure; every plan piece stands once at the plan's x, z (≤ 0.3 m) and yaw (≤ 5°), the wall
// pieces at the plan length, the same counts; the ring has no visible gap (touching / overlapping pieces) except the main gate and the lychgate passage;
// the outdoor engine's Play-like walk grid: the inside is reachable from the spawn through the main gate, the lychgate passage walks to the N edge, the ring
// is closed with both passages shut (flood fill), every NPC point and door is reachable; ≤ 8 real lights; no monsters; deterministic; the §6b exports; the copied
// light offsets equal the base map's; the palisade log extent equals the GLB's. Per fixture family: validate() clean, the spawn reaches the square / every NPC /
// every door, the lychgate exit only through the lychgate (shut → not reached), no stray walkable cell outside the ring, no gap in the ring, the directions
// (causeway, hill lane, route) follow the plan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluatePlan, pointInPoly, footprint, WADE } from '../src/env/act1/outdoor.js';
import { hubToOutdoorPlan, WALL_A, LOG2, LOG_SPAN, SPOT, LANTERN } from '../src/env/hubOutdoor.js';
import { checkHub, problems, familyOf } from './hub-outdoor-survey.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frozen = JSON.parse(readFileSync(path.join(root, 'src/env/hubPlans/lychgate-s21.json'), 'utf8'));
const map = await import(pathToFileURL(path.join(root, 'src/env/act1/maps/lychgateHub.js')).href);
const { PLAN: LYCHGATE } = await import(pathToFileURL(path.join(root, 'src/env/act1/maps/lychgate.js')).href);
const PLAN = map.PLAN;
const W = evaluatePlan(PLAN);
const DEG = 180 / Math.PI;
const wrap = (a) => ((a + 540) % 360) - 180;
const samples = JSON.parse(readFileSync(path.join(root, 'src/assets/samples.json'), 'utf8'));
const sampleIds = new Set((samples.assets ?? samples).map((s) => s.id));

const byTag = (tag) => W.structures.filter((s) => s.tag === tag);
const ring = frozen.hub.ring.poly;
const rx0 = Math.min(...ring.map((p) => p.x));
const rx1 = Math.max(...ring.map((p) => p.x));
const rz0 = Math.min(...ring.map((p) => p.z));
const rz1 = Math.max(...ring.map((p) => p.z));
const door = (id) => frozen.doors.find((d) => d.id === id);

// ---- the palisade kit piece, measured (review m4): the tall logs of wall_a --------------------------------------------------------------------------
/** POSITION + triangle indices of the FIRST mesh of a GLB (the kit-palisade library: its first mesh is wall_a). */
const glbFirstMesh = (file) => {
	const buf = readFileSync(file);
	const jl = buf.readUInt32LE(12);
	const json = JSON.parse(buf.subarray(20, 20 + jl).toString('utf8'));
	const prim = json.meshes[0].primitives[0];
	const view = (i) => {
		const a = json.accessors[i];
		const v = json.bufferViews[a.bufferView];
		return { a, o: 20 + jl + 8 + (v.byteOffset ?? 0) + (a.byteOffset ?? 0), stride: v.byteStride ?? 12 };
	};
	const p = view(prim.attributes.POSITION);
	const P = new Float32Array(p.a.count * 3);
	for (let i = 0; i < p.a.count; i++) for (let k = 0; k < 3; k++) P[i * 3 + k] = buf.readFloatLE(p.o + i * p.stride + k * 4);
	const ix = view(prim.indices);
	return { name: json.meshes[0].name, P, index: Array.from({ length: ix.a.count }, (_, i) => (ix.a.componentType === 5125 ? buf.readUInt32LE(ix.o + i * 4) : buf.readUInt16LE(ix.o + i * 2))) };
};
/** Surface heights (GLB frame) on a vertical line through (x, z): a ray cast on the triangles. */
const hitsAtOf = ({ P, index }) => {
	const I = index.map((i) => 3 * i);
	return (x, z) => {
		const hits = [];
		for (let t = 0; t < I.length; t += 3) {
			const [a, b, c] = [I[t], I[t + 1], I[t + 2]];
			const d = (P[b + 2] - P[c + 2]) * (P[a] - P[c]) + (P[c] - P[b]) * (P[a + 2] - P[c + 2]);
			if (Math.abs(d) < 1e-12) continue;
			const l1 = ((P[b + 2] - P[c + 2]) * (x - P[c]) + (P[c] - P[b]) * (z - P[c + 2])) / d;
			const l2 = ((P[c + 2] - P[a + 2]) * (x - P[c]) + (P[a] - P[c]) * (z - P[c + 2])) / d;
			if (l1 < 0 || l2 < 0 || l1 + l2 > 1) continue;
			hits.push(l1 * P[a + 1] + l2 * P[b + 1] + (1 - l1 - l2) * P[c + 1]);
		}
		return hits.sort((u, v) => u - v);
	};
};
/** Local x extent [lo, hi] of wall_a's TALL logs (surface above 2 m of its 3.32 m): the braces fill the rest of the 3.76 m box. */
const measureLogs = () => {
	const glb = glbFirstMesh(path.join(root, 'assets', samples.assets.find((s) => s.id === 'kit-palisade').file));
	assert.equal(glb.name, 'palisade_01_wall_a', 'the first mesh of the kit-palisade GLB is wall_a');
	const hitsAt = hitsAtOf(glb);
	const xs = [];
	for (let x = -1.9; x <= 1.9001; x += 0.05) {
		for (let z = -1.1; z <= 1.1001; z += 0.1) if ((hitsAt(x, z).at(-1) ?? 0) > 2) {
			xs.push(+x.toFixed(2));
			break;
		}
	}
	return { lo: xs[0], hi: xs.at(-1), span: +(xs.at(-1) - xs[0]).toFixed(2) };
};
let logs;
const measuredLogs = () => (logs ??= measureLogs());

test('the frozen plan: seed 21, hub-gen/2, provenance, 75 masses, walled', () => {
	assert.equal(frozen.seed, 21);
	assert.equal(frozen.meta.generator, 'hub-gen/2');
	assert.ok(frozen.frozen?.from && frozen.frozen?.at && frozen.frozen?.why, 'provenance in `frozen`');
	assert.equal(frozen.masses.length, 75);
	assert.equal(frozen.hub.layout, 'walled');
	assert.equal(frozen.hub.wall.glb, 'palisade.wall_a');
});

test('the converter is pure (no THREE) and deterministic', () => {
	const src = readFileSync(path.join(root, 'src/env/hubOutdoor.js'), 'utf8');
	assert.ok(!/from\s+['"]three/.test(src), 'hubOutdoor.js imports no THREE');
	const base = JSON.parse(JSON.stringify(frozen));
	const a = hubToOutdoorPlan(frozen, { assets: [...PLAN.assets], layers: PLAN.layers, moods: PLAN.moods, far: undefined }, { id: 'x' });
	const b = hubToOutdoorPlan(frozen, { assets: [...PLAN.assets], layers: PLAN.layers, moods: PLAN.moods, far: undefined }, { id: 'x' });
	assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
	assert.deepEqual(frozen, base, 'the frozen plan is not mutated');
	const W1 = evaluatePlan(PLAN);
	assert.equal(W1.structures.length, W.structures.length);
	assert.deepEqual(Array.from(W1.heights.data.slice(0, 400)), Array.from(W.heights.data.slice(0, 400)));
	assert.deepEqual(W1.structures.map((s) => [s.asset, +s.x.toFixed(3), +s.z.toFixed(3)]), W.structures.map((s) => [s.asset, +s.x.toFixed(3), +s.z.toFixed(3)]));
});

test('every plan mass stands once at the plan x, z (≤ 0.3 m) and yaw (≤ 5°); corners are two crossing wall_a', () => {
	for (const m of frozen.masses) {
		const hits = [m.id, `${m.id}:a`, `${m.id}:b`].flatMap(byTag);
		if (m.glb === 'palisade.wall_angle' || m.glb === 'blockout.gate-post') {
			assert.equal(hits.length, 2, `${m.id}: two crossing / stacked pieces`);
			for (const h of hits) assert.ok(Math.hypot(h.x - m.at.x, h.z - m.at.z) < (m.glb === 'palisade.wall_angle' ? 0.85 : 0.35), `${m.id} corner / jamb position (corner arms stand 0.8 m inward along their wall)`);
			continue;
		}
		assert.equal(hits.length, 1, `${m.id} stands exactly once`);
		const s = hits[0];
		assert.ok(Math.hypot(s.x - m.at.x, s.z - m.at.z) <= 0.3, `${m.id} position (${s.x}, ${s.z}) vs (${m.at.x}, ${m.at.z})`);
		assert.ok(Math.abs(wrap(s.yawDeg - m.yaw * DEG)) <= 5, `${m.id} yaw ${s.yawDeg} vs ${(m.yaw * DEG).toFixed(1)}`);
	}
});

test('same counts as the plan: 41 modules + 4 corners (8 pieces) + 2 jambs; the lychgate, the vault door, the wings, the houses, the dressing', () => {
	const n = (asset) => W.structures.filter((s) => s.asset === asset && !s.scatter).length;
	const planN = (glb) => frozen.masses.filter((m) => m.glb === glb).length;
	assert.equal(planN('palisade.wall_a'), 41);
	assert.equal(planN('palisade.wall_angle'), 4);
	assert.equal(n(WALL_A.id), 41 + 4 * 2);
	assert.equal(n(LOG2.id), planN('blockout.gate-post') * 2, 'each gate jamb = two stacked end-log slices');
	for (const [asset, glb] of [['A02.1', 'A02.1'], ['N01', 'N01'], ['N02', 'N02'], ['A01.1', 'A01.1'], ['A15.2', 'A15.2'], ['A01.5', 'A01.5'], ['A15.4', 'A15.4'], ['A15.3', 'A15.3'], ['A15.5', 'A15.5'], ['A15.6', 'A15.6'], ['A01.6', 'A01.6'], ['A04.2', 'A04.2'], ['A01.4', 'A01.4'], ['N03', 'N03'], ['N04', 'N04'], ['N06', 'N06'], ['N07', 'N07'], ['N12', 'N12'], ['glb:dungeon-prop-bone-pile', 'bone-pile']]) assert.equal(n(asset), planN(glb), `${asset}`);
	assert.equal(n('N05'), frozen.doors.filter((d) => d.poppy).length, 'a door sprig on every cottage door and Edda’s');
	assert.equal(planN('A01.1'), 4, 'three cottages + Edda’s house');
	// the visible (tall) logs of a wall module cover the plan pitch (footprint 3.55 … 3.89 m) + a little overlap; the span comes from the GLB (review m4)
	const { span } = measuredLogs();
	for (const m of frozen.masses.filter((q) => q.glb === 'palisade.wall_a')) {
		const s = byTag(m.id)[0];
		const logsW = (s.size[0] * span) / WALL_A.size[0];
		assert.ok(logsW >= m.footprint.w - 0.1 && logsW <= m.footprint.w + 0.2, `${m.id} log span ${logsW.toFixed(2)} vs pitch ${m.footprint.w}`);
	}
	// the eel rack at ×0.85 and the wings at the plan length; the vault door native
	assert.ok(Math.abs(byTag('eel-rack-1')[0].size[0] - 4) < 0.05);
	assert.ok(Math.abs(byTag('retaining-wall-1')[0].size[0] - 3.91) < 0.01);
	assert.deepEqual(byTag('vault-door-1')[0].scale, [1, 1, 1]);
});

test('the converter’s LOG_SPAN is the measured extent of wall_a’s tall logs (review m4)', () => {
	const m = measuredLogs();
	assert.ok(Math.abs(LOG_SPAN - m.span) <= 0.15, `LOG_SPAN ${LOG_SPAN} vs measured ${m.span} m (x ${m.lo} … ${m.hi})`);
	assert.ok(m.span > 2.7 && m.span < 3.2, `the logs span ${m.span} m of the ${WALL_A.size[0]} m box`);
	// and the walk band (0.35 … 1.7 m) is filled to the box ends by the braces: no see-through between modules overlapping by LOG_OVERLAP + the brace stubs
	assert.ok(Math.abs(m.lo + m.hi) < 0.4, 'the logs sit near the centre of the box');
});

test('the palisade ring has no visible gap: pieces touch or overlap round the ring except the main gate and the lychgate passage', () => {
	const gaps = ringGaps(frozen, W);
	assert.deepEqual(gaps, [], `${gaps.length} uncovered stretches of the ring: ${JSON.stringify(gaps.slice(0, 3))}`);
	// the W wall opening: the two flint wings and the vault door fill it edge to edge (±0.15 m)
	const parts = ['retaining-wall-2', 'vault-door-1', 'retaining-wall-1'].map((t) => byTag(t)[0]).map((s) => [s.z - s.size[0] / 2, s.z + s.size[0] / 2]).sort((a, b) => a[0] - b[0]);
	for (let i = 1; i < parts.length; i++) assert.ok(Math.abs(parts[i][0] - parts[i - 1][1]) < 0.15, 'wing / vault door joint');
});

/**
 * The ring outline (the plan's polygon) is covered by wall pieces: a palisade module / corner arm by its measured tall-log segment (±0.3 m), every other wall piece
 * (stone module, wing, vault door, lychgate, jamb, stake, tower, pier, joint) by its footprint (±0.15 m). Uncovered stretches farther than 2.6 m from the main gate
 * door are returned as [x, z, length m].
 */
function ringGaps(hub, Wd) {
	const { lo, hi } = measuredLogs();
	const wallIds = new Set(hub.masses.filter((m) => m.tag === 'wall').map((m) => m.id));
	const segs = [];
	const boxes = [];
	for (const s of Wd.structures) {
		if (!wallIds.has(String(s.tag).split(':')[0])) continue;
		if (s.asset === WALL_A.id) {
			const sx = s.size[0] / WALL_A.size[0];
			const c = Math.cos(s.yaw);
			const sn = Math.sin(s.yaw);
			segs.push([[s.x + lo * sx * c, s.z - lo * sx * sn], [s.x + hi * sx * c, s.z - hi * sx * sn]]);
		} else boxes.push(s.footprint);
	}
	const segDist = (a, b, x, z) => {
		const dx = b[0] - a[0];
		const dz = b[1] - a[1];
		const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1)));
		return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
	};
	const boxDist = (pts, x, z) => (pointInPoly(pts, x, z) ? 0 : Math.min(...pts.map((p, i) => segDist(p, pts[(i + 1) % pts.length], x, z))));
	const gate = hub.doors.find((d) => d.id === 'main-gate').at;
	const poly = hub.hub.ring.poly.map((p) => [p.x, p.z]);
	const out = [];
	for (let e = 0; e < poly.length; e++) {
		const a = poly[e];
		const b = poly[(e + 1) % poly.length];
		const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
		let run = null;
		for (let d = 0; d <= len + 1e-9; d += 0.1) {
			const x = a[0] + ((b[0] - a[0]) * d) / len;
			const z = a[1] + ((b[1] - a[1]) * d) / len;
			const covered = segs.some(([p, q]) => segDist(p, q, x, z) <= 0.3) || boxes.some((pts) => boxDist(pts, x, z) <= 0.15);
			if (!covered && Math.hypot(x - gate.x, z - gate.z) > 2.6) run = run ? { ...run, end: d } : { x, z, start: d, end: d };
			else if (run) {
				out.push([+run.x.toFixed(2), +run.z.toFixed(2), +(run.end - run.start + 0.1).toFixed(2)]);
				run = null;
			}
		}
		if (run) out.push([+run.x.toFixed(2), +run.z.toFixed(2), +(run.end - run.start + 0.1).toFixed(2)]);
	}
	return out.filter(([, , l]) => l > 0.12);
}

test('no wall piece stands in the water; the pond and the fen are water, the square is dry', () => {
	for (const s of W.structures.filter((q) => /^(palisade|retaining|vault|lychgate|gate-post)/.test(q.tag ?? ''))) {
		assert.ok(W.waterDepth(s.x, s.z) < 0.05, `${s.tag} stands in ${W.waterDepth(s.x, s.z).toFixed(2)} m of water`);
	}
	assert.ok(W.waterDepth(-8.1, 2.18) > 0.4, 'the pond is water');
	assert.ok(W.waterDepth(-28, 0) > WADE.depth && W.waterDepth(30.5, 10) > WADE.depth && W.waterDepth(0, -28) > WADE.depth && W.waterDepth(8, 28) > 0.3, 'fen water on all four sides');
	assert.equal(W.waterDepth(frozen.square.x, frozen.square.z), 0);
});

// ---- the walk grid ------------------------------------------------------------------------------------------------------------------------
const spawn = { x: frozen.start.x, z: frozen.start.z, y: W.spawns[0].y };
const full = W.walkGrid(spawn, { full: true });
const rectPts = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const shut = (...rects) => rects.map(([x0, z0, x1, z1]) => ({ uid: -1, asset: 'test-shut', pts: rectPts(x0, z0, x1, z1), y0: -9, y1: 99, x: (x0 + x1) / 2, z: (z0 + z1) / 2, r: Math.hypot(x1 - x0, z1 - z0) / 2 }));
const GATE = [-3.6, 22.5, 1.4, 24.0]; // the main gate opening (4.8 m between the jambs)
const LYCH = [10.2, -25.0, 13.8, -21.5]; // the lychgate passage

test('the spawn is on walkable ground outside the main gate, on the causeway', () => {
	assert.ok(full.startOk);
	assert.ok(Math.abs(spawn.x - frozen.hub.causeway.from.x) < 0.5);
	assert.ok(spawn.z > rz1 + 2, 'outside the S wall');
	assert.ok(full.cells > 1500, `${full.cells} walkable cells`);
});

test('the inside is reachable from the spawn through the main gate: square, every NPC point and every door; the lychgate passage walks to the N edge', () => {
	const must = [
		['main gate', gate()], ['square', frozen.square], ['lychgate passage', { x: 12, z: -22 }], ['N edge (hill lane)', { x: 12, z: -30.5 }],
		...frozen.interactions.map((i) => [`npc ${i.id}`, i.at]), ...frozen.doors.map((d) => [`door ${d.id}`, d.at]), ['route end', frozen.paths[0].points.at(-1)],
		['causeway start', frozen.start],
	];
	for (const [name, p] of must) assert.ok(full.reached(p.x, p.z, 1.5), `${name} (${p.x}, ${p.z}) reachable`);
	function gate() { return door('main-gate').at; }
	// the route itself, point by point
	for (const p of frozen.paths[0].points) assert.ok(full.reached(p.x, p.z, 1.2), `route point (${p.x}, ${p.z})`);
});

test('the ring is closed: with the main gate and the lychgate passage shut, nothing inside is reachable from outside (and the inside was reachable)', () => {
	const inside = [];
	for (let x = rx0 + 2.5; x < rx1 - 2.5; x += 1) for (let z = rz0 + 2.5; z < rz1 - 2.5; z += 1) if (pointInPoly(ring.map((p) => [p.x, p.z]), x, z)) inside.push([x, z]);
	const open = inside.filter(([x, z]) => full.reached(x, z, 0.4)).length;
	assert.ok(open / inside.length > 0.6, `most of the inside is walkable and reachable (${open} / ${inside.length})`);
	const saved = W.blockers.length;
	W.blockers.push(...shut(GATE, LYCH));
	try {
		for (const from of [spawn, { x: 12, z: -30, y: W.height(12, -30) }]) {
			const g = W.walkGrid(from, { full: true });
			assert.ok(g.startOk, 'the outside start is walkable');
			const leaks = inside.filter(([x, z]) => g.reached(x, z, 0.4));
			assert.equal(leaks.length, 0, `${leaks.length} inside cells reachable from (${from.x}, ${from.z}) with both passages shut, first ${JSON.stringify(leaks[0])}`);
		}
	} finally {
		W.blockers.length = saved;
	}
	// the vault door is a door, not an opening: nothing walkable beyond it on the W side of the wall is reached from the inside (shut passages)
	W.blockers.push(...shut(GATE, LYCH));
	try {
		const g = W.walkGrid({ x: 9.2, z: 9, y: W.height(9.2, 9) }, { full: true });
		assert.ok(g.startOk);
		for (const [x, z] of [[-23.2, 3.9], [-23.2, -10], [27.9, 0], [0, 24.9], [0, -24.9]]) assert.ok(!g.reached(x, z, 0.3), `outside the wall (${x}, ${z}) is not reachable from the square`);
	} finally {
		W.blockers.length = saved;
	}
});

test('nothing outside the ring is walkable: no bank round the wall, the lychgate is the only way to the hill lane (review M1)', () => {
	// the water comes up to the wall: deeper than the wade depth within ≈ 0.5 m of the wall's outer face, on every side
	for (const [x, z] of [[-21.34 - 1.55, -10], [26.6 + 1.55, 10], [10, 23.24 + 1.55], [-10, -23.28 - 1.55], [-21.34 - 1.55, 3.94]]) assert.ok(W.waterDepth(x, z) > WADE.depth, `water ${W.waterDepth(x, z).toFixed(2)} m at (${x.toFixed(1)}, ${z.toFixed(1)})`);
	const causewayX = frozen.hub.causeway.from.x;
	// every walkable cell of the unblocked full grid is inside the ring (wall line + 1.3 m), on the causeway apron or on the hill lane
	const stray = [];
	for (let j = 0; j < full.n; j++) for (let i = 0; i < full.n; i++) {
		if (!full.walk[i + j * full.n]) continue;
		const x = full.ox + (i + 0.5) * full.cell;
		const z = full.oz + (j + 0.5) * full.cell;
		const insideRing = x > rx0 - 1.3 && x < rx1 + 1.3 && z > rz0 - 1.3 && z < rz1 + 1.3;
		const causeway = Math.abs(x - causewayX) < 4 && z > rz1;
		const hill = Math.abs(x - 12) < 4 && z < rz0;
		if (!insideRing && !causeway && !hill) stray.push([x, z]);
	}
	assert.equal(stray.length, 0, `${stray.length} walkable cells outside the ring, first ${JSON.stringify(stray[0])}`);
	// the hill lane and the N exit: unreachable from the spawn with the lychgate passage shut, reachable with it open
	const saved = W.blockers.length;
	W.blockers.push(...shut(LYCH));
	try {
		const g = W.walkGrid(spawn, { full: true });
		for (const z of [-26.5, -28, -30.5]) assert.ok(!g.reached(12, z, 0.4), `hill lane (12, ${z}) is reachable from outside with the lychgate shut`);
		assert.ok(!g.reached(12, -30.5, 2), 'the N exit is not reachable round the outside');
		assert.ok(g.reached(9.2, 9, 0.4), 'the inside is (through the main gate)');
	} finally {
		W.blockers.length = saved;
	}
	for (const z of [-26.5, -28, -30.5]) assert.ok(full.reached(12, z, 0.4), `hill lane (12, ${z}) through the lychgate passage`);
});

test('the causeway: A06.1 pieces on the dike crest from the main gate to the map edge, nothing blocks, every crest cell is walked', () => {
	const pieces = W.structures.filter((s) => s.asset === 'A06.1');
	assert.ok(pieces.length >= 3);
	assert.equal(W.blockers.filter((b) => b.asset === 'A06.1').length, 0);
	for (const p of pieces) assert.ok(full.reached(p.x, p.z, 0), `crest at (${p.x}, ${p.z})`);
	for (let z = 24; z <= 30.75; z += 0.25) assert.ok(full.reached(frozen.hub.causeway.from.x, z, 0), `crest cell z ${z}`);
	for (let z = -25; z >= -30.75; z -= 0.25) assert.ok(full.reached(12, z, 0), `hill lane cell z ${z}`);
	assert.equal((PLAN.runs ?? []).length, 0);
});

test('lights: at most 8 real, the threshold lights are on their models; no monsters; the segments and views are valid', () => {
	assert.ok(W.lights.filter((l) => l.real).length <= 8);
	assert.ok(W.lights.every((l) => Number.isFinite(l.yWorld)));
	for (const id of ['lychgateLamp', 'forge', 'osric', 'edda', 'vault']) assert.ok(W.lights.some((l) => l.id === id), `light ${id}`);
	assert.deepEqual(map.MONSTERS, []);
	assert.ok(!PLAN.markers.some((m) => m.kind === 'encounter'));
	assert.deepEqual(W.validate(), []);
	assert.ok(['hub', 'square'].every((id) => W.segments.some((s) => s.id === id)));
	assert.ok(!W.segments.some((s) => s.id === 'fenroad'), 'no fenroad segment (no shared test needs it; the scene spawns on the causeway from the hub segment)');
	assert.ok(['overview', 'gate', 'square', 'lychgate', 'edda', 'vault'].every((id) => W.views[id]));
	assert.ok(PLAN.markers.some((m) => m.kind === 'exit' && /Night Fens/.test(m.label)) && PLAN.markers.some((m) => m.kind === 'exit' && /Churchyard/.test(m.label)));
	for (const id of ['osric', 'brannoc', 'nell', 'tamsin', 'edda']) assert.ok(PLAN.markers.some((m) => m.kind === 'npc' && m.id === id), `npc ${id}`);
});

test('the copied light offsets equal the base map’s own (review m3): a change in maps/lychgate.js fails here, not on screen', () => {
	// the offset of a base light from the structure it sits on, in that structure's GLB frame
	const local = (s, l) => {
		const yaw = (s.yaw ?? 0) / DEG;
		const dx = l.x - s.x;
		const dz = l.z - s.z;
		return [+(dx * Math.cos(yaw) - dz * Math.sin(yaw)).toFixed(2), +l.y, +(dx * Math.sin(yaw) + dz * Math.cos(yaw)).toFixed(2)];
	};
	const baseLight = (id) => LYCHGATE.lights.find((l) => l.id === id);
	const nearest = (asset, l) => LYCHGATE.structures.filter((s) => s.asset === asset).sort((a, b) => Math.hypot(a.x - l.x, a.z - l.z) - Math.hypot(b.x - l.x, b.z - l.z))[0];
	for (const [id, asset, key] of [['forge', 'A15.2', 'forge'], ['osric', 'A15.6', 'osric'], ['edda', 'A01.1', 'edda']]) {
		const l = baseLight(id);
		assert.deepEqual(local(nearest(asset, l), l), SPOT[key].map((v) => +v.toFixed(2)), `${id} light offset in the ${asset} GLB frame`);
	}
	assert.deepEqual(SPOT.window, SPOT.edda, 'the cottage windows use the same stilt-house window as Edda’s');
	// the lantern: scale, hang height, flame height
	const lantern = LYCHGATE.structures.find((s) => s.asset === 'A16.6-lantern');
	const def = LYCHGATE.assets.find((a) => a.id === 'A16.6-lantern');
	const lamp = baseLight('lychgateLamp');
	assert.equal(lantern.scale, LANTERN.scale);
	assert.ok(Math.abs(lantern.dy + def.size[1] * lantern.scale - LANTERN.top) < 0.002, `lantern top ${lantern.dy + def.size[1] * lantern.scale} vs ${LANTERN.top}`);
	assert.equal(lamp.y, LANTERN.flame);
	// the hub's own lamp: the same lantern, the same flame height over the ground
	const hubLantern = PLAN.structures.find((s) => s.asset === 'A16.6-lantern');
	assert.ok(Math.abs(hubLantern.dy - lantern.dy) < 0.002, 'the hub hangs the lantern where the base map does');
	const hubLamp = PLAN.lights.find((l) => l.id === 'lychgateLamp');
	assert.ok(Math.abs(hubLamp.yOn.ly + hubLantern.dy - lamp.y) < 0.002, 'the hub lamp’s flame is at the base lamp’s height');
});

test('the §6b exports and real models: every GLB / kit def names a sample that exists; counts add up', () => {
	assert.equal(PLAN.engine, 'outdoor');
	assert.ok(Array.isArray(map.ASSETS) && map.ASSETS.length === PLAN.assets.length);
	assert.ok(Array.isArray(map.NPCS) && map.NPCS.length >= 5 && Array.isArray(map.TEXTURES) && Array.isArray(map.VFX));
	for (const a of PLAN.assets.filter((q) => q.status === 'glb')) assert.ok(sampleIds.has(a.model), `${a.id}: sample ${a.model}`);
	for (const a of map.ASSETS) assert.ok(a.count >= 1 || a.placed === false, `${a.id} count ${a.count}`);
	const wall = map.ASSETS.find((a) => a.id === WALL_A.id);
	assert.equal(wall.count, 41 + 8);
	// footprint helper sanity: a wall piece's footprint is its scaled box
	const s = byTag('palisade-1')[0];
	assert.ok(footprint(s.x, s.z, s.size[0], s.size[2], s.yaw).length === 4);
});

// ---- the converter on other layout families (frozen fixtures) ---------------------------------------------------------------------------------------
const fixtureDir = path.join(root, 'scripts/fixtures/hub');
const FIXTURES = [{ name: 'lychgate-s21 (hub-gen/2, the map)', hub: frozen }, ...readdirSync(fixtureDir).filter((f) => f.endsWith('.json')).sort().map((f) => ({ name: f.replace('.json', ''), hub: JSON.parse(readFileSync(path.join(fixtureDir, f), 'utf8')) }))];
const checked = new Map();
const check = (fx) => {
	if (!checked.has(fx.name)) checked.set(fx.name, checkHub(fx.hub, LYCHGATE));
	return checked.get(fx.name);
};

test('the fixtures cover the layout families: stone and palisade, every corner style, the main gate E and S, the lychgate N, W (adjacent to the main gate: S → W)', () => {
	const fam = FIXTURES.map((f) => familyOf(f.hub));
	for (const needle of ['stone', 'palisade', 'square', 'clipped', 'rounded', 'irregular', 'main E', 'main S', 'lych N', 'lych W']) assert.ok(fam.some((f) => f.includes(needle)), `a fixture with "${needle}": ${fam.join(' | ')}`);
	assert.ok(fam.some((f) => f.includes('main S') && f.includes('lych W')), 'an adjacent main S → lychgate W pair');
	assert.ok(FIXTURES.some((f) => f.hub.masses.some((m) => m.piece === 'joint')), 'a hub-gen/3 plan with joint pieces');
	assert.ok(FIXTURES.some((f) => f.hub.hub.wall.type === 'stone' && f.hub.masses.some((m) => m.piece === 'tower')), 'a stone ring with towers');
});

for (const fx of FIXTURES) {
	const { hub } = fx;
	test(`family ${fx.name} [${familyOf(hub)}]: converts, validate() clean, the spawn reaches the square, every NPC and door, the lychgate exit only through the lychgate, no stray cells`, () => {
		const r = check(fx);
		assert.deepEqual(problems(r), []);
		assert.ok(r.cells > 1000, `${r.cells} walkable cells`);
		assert.equal(r.lychOpen, true);
		assert.equal(r.bypass, false);
		assert.equal(r.leak, 0);
		assert.equal(r.stray, 0);
		assert.deepEqual(r.unreached, []);
	});

	test(`family ${fx.name}: every plan mass stands once (corner arms / jambs composed), the ring has no gap, nothing stands in the water`, () => {
		const { W: Wf, plan } = check(fx);
		const stone = hub.hub.wall.type === 'stone';
		const hits = (id) => Wf.structures.filter((s) => s.tag === id || s.tag === `${id}:a` || s.tag === `${id}:b`);
		for (const m of hub.masses) {
			const h = hits(m.id);
			const composed = !stone && (m.piece === 'tower' || m.piece === 'pier');
			assert.equal(h.length, composed ? 2 : 1, `${m.id} (${m.piece ?? m.glb}) stands ${composed ? 'as two pieces' : 'once'}`);
			if (composed) {
				for (const s of h) assert.ok(Math.hypot(s.x - m.at.x, s.z - m.at.z) <= (m.piece === 'tower' ? 0.85 : 0.35), `${m.id} composed piece position`);
			} else {
				assert.ok(Math.hypot(h[0].x - m.at.x, h[0].z - m.at.z) <= 0.3, `${m.id} position`);
				assert.ok(Math.abs(wrap(h[0].yawDeg - m.yaw * DEG)) <= 5, `${m.id} yaw`);
			}
		}
		// roles → assets: the wall type decides
		const wallAssets = new Set(Wf.structures.filter((s) => hub.masses.find((m) => m.id === String(s.tag).split(':')[0])?.piece === 'module').map((s) => s.asset));
		assert.deepEqual([...wallAssets], [stone ? 'N02' : WALL_A.id]);
		if (stone) for (const m of hub.masses.filter((q) => ['tower', 'pier', 'joint'].includes(q.piece))) {
			const def = plan.assets.find((a) => a.id === m.glb);
			assert.ok(def && def.status === 'blockout' && /blockout/.test(def.id), `${m.glb} is a blockout def`);
			const s = hits(m.id)[0];
			assert.ok(Math.abs(s.size[0] - m.footprint.w) < 0.02 && Math.abs(s.size[1] - m.height) < 0.02 && Math.abs(s.size[2] - m.footprint.d) < 0.02, `${m.id} blockout at the plan footprint and height`);
		}
		// hub-gen/2 plans have no joint pieces: their diagonal / irregular ring joints leave ≤ 0.4 m between module ends (the reason hub-gen/3 added the joints);
		// a plan with joint pieces has none
		const gaps = ringGaps(hub, Wf).filter(([, , l]) => l > (hub.masses.some((m) => m.piece === 'joint') ? 0.12 : 0.45));
		assert.deepEqual(gaps, [], `${gaps.length} uncovered stretches of the ring, first ${JSON.stringify(gaps[0])}`);
		assert.deepEqual(check(fx).wallsWet, [], 'no wall piece stands in water');
	});

	test(`family ${fx.name}: the directions follow the plan (causeway, route, hill lane, fen on every side but the lane)`, () => {
		const { W: Wf, plan } = check(fx);
		const gate = hub.doors.find((d) => d.id === 'main-gate').at;
		const cw = hub.hub.causeway;
		const len = Math.hypot(cw.from.x - cw.to.x, cw.from.z - cw.to.z);
		const out = { x: (cw.from.x - cw.to.x) / len, z: (cw.from.z - cw.to.z) / len };
		// causeway planks lie on the line from the gate toward the causeway's far end, in order, the last one inside the bounds
		const planks = Wf.structures.filter((s) => s.asset === 'A06.1');
		assert.ok(planks.length >= 3, 'causeway planks');
		for (const p of planks) {
			const along = (p.x - gate.x) * out.x + (p.z - gate.z) * out.z;
			const lat = Math.abs((p.x - gate.x) * out.z - (p.z - gate.z) * out.x);
			assert.ok(along > 1 && lat < 0.05, `plank ${p.tag}: ${along.toFixed(2)} m out, ${lat.toFixed(2)} m aside`);
			assert.ok(p.x >= hub.bounds.x0 && p.x <= hub.bounds.x1 && p.z >= hub.bounds.z0 && p.z <= hub.bounds.z1, `plank ${p.tag} inside the bounds`);
			// the plank's long axis (local x) lies along the causeway
			assert.ok(Math.abs(Math.cos(p.yaw) * out.x - Math.sin(p.yaw) * out.z) > 0.99, `plank ${p.tag} runs along the causeway`);
		}
		const last = Math.max(...planks.map((p) => (p.x - gate.x) * out.x + (p.z - gate.z) * out.z));
		const edge = out.x ? (out.x > 0 ? hub.bounds.x1 - gate.x : gate.x - hub.bounds.x0) : out.z > 0 ? hub.bounds.z1 - gate.z : gate.z - hub.bounds.z0;
		assert.ok(last + 2 > edge - 0.1, `the planks (last ${last.toFixed(2)} m out, 4 m long) reach the map edge ${edge.toFixed(2)} m out`);
		// the dike road: from beyond the map edge to the gate
		const dike = plan.paths.find((p) => p.id === 'causeway');
		const [a, b] = dike.points;
		assert.ok(Math.abs((b[0] - gate.x) * out.z - (b[1] - gate.z) * out.x) < 0.05 && (b[0] - gate.x) * out.x + (b[1] - gate.z) * out.z > 0 && (b[0] - gate.x) * out.x + (b[1] - gate.z) * out.z < 1, 'the dike ends just outside the gate');
		assert.ok(a[0] < hub.bounds.x0 || a[0] > hub.bounds.x1 || a[1] < hub.bounds.z0 || a[1] > hub.bounds.z1, 'the dike starts beyond the map edge');
		// the route lane starts at the route point nearest the gate door and ends in the lychgate passage
		const route = plan.paths.find((p) => p.id === 'route');
		const rp = hub.paths.find((p) => p.id === 'route').points;
		const near = rp.reduce((best, p) => (Math.hypot(p.x - gate.x, p.z - gate.z) < Math.hypot(best.x - gate.x, best.z - gate.z) ? p : best), rp[0]);
		assert.deepEqual(route.points[0], [near.x, near.z]);
		const lychMass = hub.masses.find((m) => m.id === hub.doors.find((d) => d.id === 'lychgate').mass);
		assert.ok(Math.hypot(route.points.at(-1)[0] - lychMass.at.x, route.points.at(-1)[1] - lychMass.at.z) < 1.3, 'the route ends in the lychgate passage');
		// the hill lane runs from the passage along the hill trail beyond the map edge
		const ht = hub.paths.find((p) => p.id === 'hill-trail').points;
		const hv = { x: ht.at(-1).x - ht[0].x, z: ht.at(-1).z - ht[0].z };
		const hl = Math.hypot(hv.x, hv.z);
		const lane = plan.paths.filter((p) => p.id.startsWith('hill-lane'));
		assert.equal(lane.length, 3);
		for (const p of lane) for (const [x, z] of p.points) assert.ok(Math.abs((x - ht[0].x) * hv.z - (z - ht[0].z) * hv.x) / hl < 0.05, `hill lane point (${x}, ${z}) on the trail line`);
		const outermost = lane[2].points[1];
		assert.ok(outermost[0] < hub.bounds.x0 || outermost[0] > hub.bounds.x1 || outermost[1] < hub.bounds.z0 || outermost[1] > hub.bounds.z1, 'the hill lane leaves the map');
		assert.ok(((lane[0].points[0][0] - ht[0].x) * hv.x + (lane[0].points[0][1] - ht[0].z) * hv.z) / hl < 0, 'the hill lane starts inside the passage');
		// the fen: water 1.7 m outside the wall line all round (1.12 m = the palisade box, + 0.6 m hero clearance: nothing is walkable up to there anyway), except within 5 m of the gate door, the lychgate and the hill lane (the dry land of the lane)
		const poly = hub.hub.ring.poly.map((p) => [p.x, p.z]);
		let checkedN = 0;
		for (let e = 0; e < poly.length; e++) {
			const p = poly[e];
			const q = poly[(e + 1) % poly.length];
			const el = Math.hypot(q[0] - p[0], q[1] - p[1]);
			if (el < 3) continue;
			const n = [(q[1] - p[1]) / el, -(q[0] - p[0]) / el];
			const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
			const o = pointInPoly(poly, mid[0] + n[0] * 0.5, mid[1] + n[1] * 0.5) ? -1 : 1; // outward
			for (let d = 1; d < el - 1; d += 1.5) {
				const x = p[0] + ((q[0] - p[0]) * d) / el + n[0] * o * 1.7;
				const z = p[1] + ((q[1] - p[1]) * d) / el + n[1] * o * 1.7;
				if (Math.hypot(x - gate.x, z - gate.z) < 5 || Math.hypot(x - lychMass.at.x, z - lychMass.at.z) < 5 || Math.abs((x - ht[0].x) * hv.z - (z - ht[0].z) * hv.x) / hl < 4) continue;
				assert.ok(Wf.waterDepth(x, z) > WADE.depth, `edge ${e}: water ${Wf.waterDepth(x, z).toFixed(2)} m at (${x.toFixed(1)}, ${z.toFixed(1)}), 1.7 m outside the wall`);
				checkedN++;
			}
		}
		assert.ok(checkedN > 10, `${checkedN} fen samples`);
	});
}

test('an unknown wall piece role throws a clear error instead of a broken map', () => {
	const bad = JSON.parse(JSON.stringify(frozen));
	bad.masses.find((m) => m.id === 'palisade-1').piece = 'zzz';
	assert.throws(() => hubToOutdoorPlan(bad, LYCHGATE), /unknown role "zzz"/);
});

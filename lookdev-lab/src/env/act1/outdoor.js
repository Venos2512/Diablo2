// ASHLAR · Act I base maps — the OUTDOOR engine, pure part (no THREE; spec tmp/act1-base-maps/SPEC.md, docs HUONG_DAN.md §7l).
// A map plan (src/env/act1/maps/<mapId>.js, plain data) is evaluated into a world: the heightfield (features, water beds, dikes, pads, the edge
// falloff into black water), water bodies and their depth, paths / dikes / raised timber walkways (also over water, with ramps), the ground-layer
// masks of one LayerSplat, structures, wall / fence runs and seeded scatters at real size, walk blockers, lights (the light grammar), markers,
// segments / spawns / views, a Play-like walk grid (1 m cells, 0.6 m step, like gameplay/host.js) and plan validation. The THREE side is
// env/act1/outdoorBuild.js (+ env/act1/blockout.js), the scene scenes/act1Outdoor.js; tests scripts/act1-outdoor.test.mjs, the 2D plan
// scripts/act1-plan-preview.mjs, the asset report scripts/act1-assets-report.mjs. Deterministic (seeded). World metres: x east, z south (toward the
// default camera, which looks north), y up.
//
// ---- HOW TO ADD AN OUTDOOR MAP -------------------------------------------------------------------------------------------------------------
// 1. Write src/env/act1/maps/<mapId>.js exporting PLAN (below) and the §6b contract: ASSETS (= withCounts(PLAN)), MONSTERS, NPCS, TEXTURES, VFX.
// 2. Add ONE line to src/scenes/index.js: `act1<MapId>: { label: 'ASHLAR · Act I · base · <tên>', create: (app) => new Act1OutdoorScene(app, '<mapId>') }`
//    (the scene loads maps/<mapId>.js by itself; its settings key is the scene id `act1<MapId>`).
// 3. `node --test scripts/act1-outdoor.test.mjs` checks every outdoor plan; `node scripts/act1-plan-preview.mjs <mapId>` draws the 2D plan;
//    `node scripts/act1-assets-report.mjs` rewrites docs/act1-base/ASSETS.md from every map file.
//
// ---- PLAN FORMAT (all fields plain data; yaw in DEGREES: the piece's front = local +z faces (sin yaw, cos yaw): 0 south / toward the camera,
// 90 east, 180 north, -90 west; size = [w (local x), h, d (local z)] in metres; an AREA is { poly: [[x, z], …] } | { circle: [x, z, r] } |
// { rect: [x0, z0, x1, z1] } | { obb: [cx, cz, w, d, yaw] } | { ellipse: [cx, cz, rx, rz, rotDeg] }) -------------------------------------------
// PLAN = {
//   id, engine: 'outdoor', label, biome, seed,
//   bounds: [x0, z0, x1, z1] (long side ≤ 256 m), cell: ≤ 1 (heightfield metres), splat: { res, blur? },
//   target: { length, note } (the full-length recommendation; this slice is a first pass),
//   edge: { width, y } (ground falls to y near the bounds: the map is an island in its far water),
//   heights: [ ops in order ] — { kind: 'base', y } · { kind: 'hill', x, z, r | rx + rz, h, rot, flat (0..1 of r), power } · { kind: 'raise', area, dy, soft }
//            · { kind: 'flatten', area, y, soft, strength } · { kind: 'tilt', area, from: [x, z, y], to: [x, z, y], soft } · { kind: 'noise', amp, scale, seed, area? }
//   water: [ { id, label, area (poly), level, shelf: [width, depth], drop: [width, depth], wobble, reach, tint: 'fen' | 'pond' } ]
//            — the bed is cut below `level`: a wadeable shelf, then a drop-off; depth anywhere = level − ground (only within `reach` m of the area). Where the
//            water is deeper than WADE.depth (0.6 m) Play's walk floor has a hole (W.floorField; walkGrid reads the same floor) and a deep-water wall
//            stands at that contour (W.deepWalls: the free walk's collision) — the hero wades, never swims. The far water beyond a map's sunken edge
//            (plan.edge + plan.far) gets the same holes and walls.
//   height pipeline: heights ops → edge falloff → water beds (lower only) → dikes (raise only) → structure pads: beds and dikes keep their shape out to the
//            bounds (a dike leaving the map keeps its crest).
//   paths: [ { id, kind: 'lane' | 'track' | 'dike' | 'walkway', points: [[x, z(, deckY)], …], width, smooth (Chaikin passes), surface: 'stone' | 'packed' | 'wood',
//            ribbon: 'cobble' (a cobble strip mesh), dike: { crest, bank }, deck: y (walkways: absolute deck top; ramps are added at ends that touch lower ground),
//            asset: 'A01.2' (walkway piece id: one per deck segment) } ]
//   layers: [ { id: 'BIO01_peat' | 'DW_grass' | …, tile } ] (2..8, bottom → top; layer 0 is the base),
//   paint: [ { layer: <layer id> | 'wet', kind: 'fill' | 'area' | 'path' | 'water' | 'height' | 'slope' | 'structures' | 'points', …, value, soft, op: 'max' | 'mul' | 'sub',
//            edge: { amp, scale } (noise on the edge, m), patchy: { scale, cover } (keeps only fBm blobs) } ] — soft widths are metres at Độ mịn 0 and grow with it,
//   assets: [ asset defs, the §6b fields + shape / model ] (see ASSET DEFS below),
//   structures: [ { asset, x, z, yaw, y: 'ground' | 'min' | 'max' | 'deck' | number, dy, scale, name, label, tag, collide, pad: { margin, soft, y }, moods } ],
//   runs: [ { asset, points, gaps: [[x, z, r]], y, tag, flip, parapet } ] — walls / fences module by module along a polyline (piece length = local x); on a slope a
//            module stands on its lowest ground and reaches the uphill ground + `parapet` (default 0.6 × its height): never buried, never stepped over,
//   scatters: [ { asset, count, area, spacing, clear: { paths, water, structures, decks }, band: { water: [from, to] }, height: [y0, y1], slope, scale: [a, b],
//            yaw: 'random' | number, seed, tag } ] — seeded rejection sampling; `count` is the design count (the report's), placement may fall short (validate()),
//   lights: [ { id, kind: 'human' | 'perfection' | 'wall', x, z, y (above ground) | yAbs, color, intensity, range, flicker, real, glow, moods, label } ] (≤ 8 real),
//   markers: [ { kind: 'encounter' | 'rite' | 'landmark' | 'sightline' | 'vignette' | 'npc' | 'exit' | 'sound' (a route followed by ear: r = heard radius, drawn with
//            the landmarks), id, x, z, r, label, note, segment, monsters: [{ id, count, standIn }],
//            unmarked, to, from: [x, z, dy], target: [x, z, y] | 'far:<asset id>' } ],
//   segments: [ { id, kind: 'hub' | 'wild', label, spawn: [x, z], view, route: [[x, z], …] } ],
//   views: { overview: { label, target: [x, z], fit: [w, d] }, <id>: { label, target: [x, z] | [x, y, z], dist, pitch, yaw } },
//   far: { level, size, hills: [{ x, z, r, h }], items: [{ asset, x, z, yaw, scale }] } (beyond the bounds: no collision, a silhouette across the water),
//   moods: { <id>: { label, …, stars } } (read by the scene; stars > 0 = a still star dome, outdoorBuild.buildStars), defaultMood,
// }
// ASSET DEFS: { id, name, category: building | structure | vegetation | rock | prop | linen | story, size, status: glb | kit | procedural | blockout, source,
//   segment, note, shape: '<blockout kind>' | { kind, … } (env/act1/blockout.js), model: '<sample id>' | 'kit:<kit>.<piece>' (glb / kit), fit: 'native' | 'size',
//   procedural: '<builder>' (procedural), collide, blockers: [[lx, lz, w, d], …] (walk blockers in the def frame when not the whole footprint: a gate's posts),
//   placed: false + reason (required but not placed in this slice) }.
// Swapping a blockout for its real GLB later is one line per asset: `status: 'glb', model: '<sample id>'` — every placement keeps its id.

import { smoothParams, porosity as biomePorosity, turnMode, normalScale } from '../biomeMix.js';
import { noise, fbm, smoothstep, flicker1f, porosity as dungeonPorosity } from '../dungeon.js';

export { smoothParams, noise, fbm, smoothstep, flicker1f, turnMode, normalScale };

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const DEG = Math.PI / 180;
export const CATEGORIES = ['building', 'structure', 'vegetation', 'rock', 'prop', 'linen', 'story'];
export const STATUSES = ['glb', 'kit', 'procedural', 'blockout'];
/** The Play nav grid (gameplay/host.js): 128 one-metre cells round the spawn, 0.6 m between neighbours, a 0.3 m hero radius in the band 0.35..1.7 m. */
export const PLAY = { grid: 128, cell: 1, step: 0.6, radius: 0.3, band: [0.35, 1.7], run: 5.6 };
/**
 * Never swim (LD: dikes and reeds are the zone limits). Play walks on a floor mesh, the terrain with holes where the water is deeper than `WADE.depth`
 * (W.floorField / W.floorAt; gameplay/host.js buildNav walks a nav cell only where a floor lies under its centre), so no nav cell stands in deeper water.
 * A low barrier also stands at that depth contour for the free walk (deep-water walls, W.deepWalls; an invisible collision mesh), `WADE.thick` thick,
 * reaching `WADE.top` above the water: a hero on a deck or a dike crest stands above it.
 */
export const WADE = { depth: 0.6, thick: 0.5, top: 0.25 };
/** "Far away" in the distance fields: finite, so a bilinear read across a field's edge never makes Infinity · 0 = NaN. */
export const FAR = 1e4;

// ---- texture ids of the ground layers (assets/terrain-biomes, samples.json) ---------------------------------------------------------------
const DW_FILES = { DW_dirt: 'dirt', DW_mud: 'mud', DW_grass: 'grass', DW_dense: 'grass-dense', DW_sparse: 'grass-sparse', DW_damp: 'soil-damp', DW_water: 'water' };
const DG_FILES = { DG_crypt_dust: 'crypt-dust', DG_crypt_damp: 'crypt-damp', DG_crypt_rubble: 'crypt-rubble', DG_cave_floor: 'cave-floor', DG_cave_clay: 'cave-clay', DG_cave_rubble: 'cave-rubble', DG_cave_flowstone: 'cave-flowstone' };
/** Layer id → samples.json id prefix (`<id>`, `-h`, `-n`, `-r`): DW_ = the Dark Wood natural set, DG_ = the dungeon set, else biome-<BIO id>. */
export const textureId = (id) => (id.startsWith('DW_') ? `biome-darkwood-${DW_FILES[id]}` : id.startsWith('DG_') ? `dungeon-${DG_FILES[id]}` : `biome-${id}`);
export const porosity = (id) => (id.startsWith('DG_') ? dungeonPorosity(id) : biomePorosity(id));

/** Seeded PRNG (mulberry32, the same as env/kit.js rng; copied so this module stays free of THREE). */
export function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---- 2D geometry ----------------------------------------------------------------------------------------------------------------------------
/** Even-odd point in polygon ([[x, z], …], any winding, concave allowed). */
export function pointInPoly(pts, x, z) {
	let inside = false;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [xi, zi] = pts[i];
		const [xj, zj] = pts[j];
		if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
	}
	return inside;
}

/** Distance from (x, z) to segment a-b and the segment parameter t. */
export function segment(ax, az, bx, bz, x, z, out = { d: 0, t: 0 }) {
	const dx = bx - ax;
	const dz = bz - az;
	const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
	out.t = t;
	out.d = Math.hypot(x - ax - dx * t, z - az - dz * t);
	return out;
}
const _seg = { d: 0, t: 0 };

/** Distance to a polyline ([[x, z], …]). */
export function polylineDistance(pts, x, z) {
	let best = Infinity;
	for (let i = 1; i < pts.length; i++) best = Math.min(best, segment(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], x, z, _seg).d);
	return pts.length === 1 ? Math.hypot(x - pts[0][0], z - pts[0][1]) : best;
}

/** Signed distance to a polygon's outline (negative inside). */
export function polySigned(pts, x, z) {
	let best = Infinity;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) best = Math.min(best, segment(pts[j][0], pts[j][1], pts[i][0], pts[i][1], x, z, _seg).d);
	return pointInPoly(pts, x, z) ? -best : best;
}

export const polylineLength = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** Point at arc length s along a polyline: [x, z, dirX, dirZ]. */
export function pointAt(pts, s) {
	for (let i = 1; i < pts.length; i++) {
		const [ax, az] = pts[i - 1];
		const [bx, bz] = pts[i];
		const len = Math.hypot(bx - ax, bz - az);
		if (s <= len || i === pts.length - 1) {
			const t = len ? clamp(s / len, 0, 1) : 0;
			return [ax + (bx - ax) * t, az + (bz - az) * t, (bx - ax) / (len || 1), (bz - az) / (len || 1)];
		}
		s -= len;
	}
	return [pts[0][0], pts[0][1], 1, 0];
}

/** Evenly spaced samples along a polyline (every `step` m, both ends kept): [[x, z], …]. */
export function resample(pts, step) {
	const len = polylineLength(pts);
	const n = Math.max(1, Math.ceil(len / step));
	return Array.from({ length: n + 1 }, (_, k) => pointAt(pts, (len * k) / n).slice(0, 2));
}

/** Chaikin corner cutting (`passes` times), ends kept: a hand-drawn polyline becomes a soft curve. Extra coordinates (deck y) are interpolated too. */
export function chaikin(pts, passes = 2) {
	let p = pts.map((q) => q.slice());
	for (let k = 0; k < passes; k++) {
		const out = [p[0]];
		for (let i = 0; i + 1 < p.length; i++) {
			const a = p[i];
			const b = p[i + 1];
			out.push(a.map((v, c) => v * 0.75 + b[c] * 0.25), a.map((v, c) => v * 0.25 + b[c] * 0.75));
		}
		out.push(p[p.length - 1]);
		p = out;
	}
	return p;
}

/** Signed distance to an AREA (negative inside): poly | circle | rect | obb | ellipse (the ellipse's is approximate, exact on the axes). */
export function areaSigned(a, x, z) {
	if (a.poly) return polySigned(a.poly, x, z);
	if (a.circle) return Math.hypot(x - a.circle[0], z - a.circle[1]) - a.circle[2];
	if (a.rect) {
		const [x0, z0, x1, z1] = a.rect;
		const dx = Math.max(x0 - x, x - x1);
		const dz = Math.max(z0 - z, z - z1);
		return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
	}
	if (a.obb) {
		const [cx, cz, w, d, yaw = 0] = a.obb;
		const c = Math.cos(yaw * DEG);
		const s = Math.sin(yaw * DEG);
		const lx = (x - cx) * c - (z - cz) * s; // the inverse of the world = local turned by yaw (see footprint())
		const lz = (x - cx) * s + (z - cz) * c;
		const dx = Math.abs(lx) - w / 2;
		const dz = Math.abs(lz) - d / 2;
		return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
	}
	if (a.ellipse) {
		const [cx, cz, rx, rz, rot = 0] = a.ellipse;
		const c = Math.cos(rot * DEG);
		const s = Math.sin(rot * DEG);
		const lx = (x - cx) * c - (z - cz) * s;
		const lz = (x - cx) * s + (z - cz) * c;
		return (Math.hypot(lx / rx, lz / rz) - 1) * Math.min(rx, rz);
	}
	return Infinity;
}

/** Axis-aligned box of an AREA, padded: [x0, z0, x1, z1]. */
export function areaBox(a, pad = 0) {
	let b;
	if (a.poly) b = a.poly.reduce((r, [x, z]) => [Math.min(r[0], x), Math.min(r[1], z), Math.max(r[2], x), Math.max(r[3], z)], [Infinity, Infinity, -Infinity, -Infinity]);
	else if (a.circle) b = [a.circle[0] - a.circle[2], a.circle[1] - a.circle[2], a.circle[0] + a.circle[2], a.circle[1] + a.circle[2]];
	else if (a.rect) b = a.rect.slice();
	else if (a.obb) {
		const r = Math.hypot(a.obb[2], a.obb[3]) / 2;
		b = [a.obb[0] - r, a.obb[1] - r, a.obb[0] + r, a.obb[1] + r];
	} else if (a.ellipse) {
		const r = Math.max(a.ellipse[2], a.ellipse[3]);
		b = [a.ellipse[0] - r, a.ellipse[1] - r, a.ellipse[0] + r, a.ellipse[1] + r];
	} else b = [-Infinity, -Infinity, Infinity, Infinity];
	return [b[0] - pad, b[1] - pad, b[2] + pad, b[3] + pad];
}

/** World corners of a footprint w × d at (x, z) turned by yaw (radians; THREE's rotation.y: local +x → (cos, −sin), local +z → (sin, cos)). */
export function footprint(x, z, w, d, yaw) {
	const c = Math.cos(yaw);
	const s = Math.sin(yaw);
	return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]);
}

/** Yaw (degrees) that lays a piece's local +x along the direction (dx, dz). */
export const yawAlong = (dx, dz) => Math.atan2(-dz, dx) / DEG;

// ---- grids --------------------------------------------------------------------------------------------------------------------------------
/** A scalar field on a regular grid (vertex-centred: node i at x0 + i · cell), read bilinearly (clamped at the border). */
export class Grid2 {
	constructor(x0, z0, cell, nx, nz, fill = 0) {
		Object.assign(this, { x0, z0, cell, nx, nz });
		this.data = new Float32Array(nx * nz).fill(fill);
	}

	static over(bounds, cell, fill = 0) {
		const [x0, z0, x1, z1] = bounds;
		return new Grid2(x0, z0, cell, Math.round((x1 - x0) / cell) + 1, Math.round((z1 - z0) / cell) + 1, fill);
	}

	at(i, j) {
		return this.data[j * this.nx + i];
	}

	sample(x, z) {
		const fx = clamp((x - this.x0) / this.cell, 0, this.nx - 1.0001);
		const fz = clamp((z - this.z0) / this.cell, 0, this.nz - 1.0001);
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		const tx = fx - i;
		const tz = fz - j;
		const d = this.data;
		const k = j * this.nx + i;
		const a = d[k] + (d[k + 1] - d[k]) * tx;
		const b = d[k + this.nx] + (d[k + this.nx + 1] - d[k + this.nx]) * tx;
		return a + (b - a) * tz;
	}

	/** fn(x, z, index) for every node inside [x0, z0, x1, z1] (the whole grid when no box). */
	forEach(fn, box = null) {
		const i0 = box ? clamp(Math.floor((box[0] - this.x0) / this.cell), 0, this.nx - 1) : 0;
		const i1 = box ? clamp(Math.ceil((box[2] - this.x0) / this.cell), 0, this.nx - 1) : this.nx - 1;
		const j0 = box ? clamp(Math.floor((box[1] - this.z0) / this.cell), 0, this.nz - 1) : 0;
		const j1 = box ? clamp(Math.ceil((box[3] - this.z0) / this.cell), 0, this.nz - 1) : this.nz - 1;
		for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(this.x0 + i * this.cell, this.z0 + j * this.cell, j * this.nx + i);
	}
}

// ---- height ops ----------------------------------------------------------------------------------------------------------------------------
/** A plan height op as (x, z, h) → h, plus its box of influence (null = everywhere). */
function heightOp(f) {
	switch (f.kind) {
		case 'base':
			return { box: null, fn: () => f.y };
		case 'hill': {
			const rx = f.rx ?? f.r;
			const rz = f.rz ?? f.r;
			const c = Math.cos((f.rot ?? 0) * DEG);
			const s = Math.sin((f.rot ?? 0) * DEG);
			const flat = f.flat ?? 0;
			const power = f.power ?? 1;
			const r = Math.max(rx, rz);
			return {
				box: [f.x - r, f.z - r, f.x + r, f.z + r],
				fn: (x, z, h) => {
					const lx = (x - f.x) * c - (z - f.z) * s;
					const lz = (x - f.x) * s + (z - f.z) * c;
					const d = Math.hypot(lx / rx, lz / rz);
					if (d >= 1) return h;
					const t = clamp((d - flat) / (1 - flat), 0, 1);
					return h + f.h * (0.5 + 0.5 * Math.cos(Math.PI * t)) ** power;
				},
			};
		}
		case 'raise':
		case 'flatten':
		case 'tilt': {
			const soft = f.soft ?? 2;
			const strength = f.strength ?? 1;
			let fx = null;
			let fz = null;
			let len2 = 1;
			if (f.kind === 'tilt') {
				fx = f.to[0] - f.from[0];
				fz = f.to[1] - f.from[1];
				len2 = fx * fx + fz * fz || 1;
			}
			return {
				box: areaBox(f.area, soft),
				fn: (x, z, h) => {
					const sd = areaSigned(f.area, x, z);
					if (sd >= soft) return h;
					const w = (1 - smoothstep(0, soft, sd)) * strength; // 1 inside, 0 at `soft` m outside
					if (f.kind === 'raise') return h + f.dy * w;
					if (f.kind === 'flatten') return lerp(h, f.y, w);
					const t = clamp(((x - f.from[0]) * fx + (z - f.from[1]) * fz) / len2, 0, 1);
					return lerp(h, lerp(f.from[2], f.to[2], t), w);
				},
			};
		}
		case 'noise': {
			const seed = f.seed ?? 3.1;
			const box = f.area ? areaBox(f.area, f.soft ?? 0) : null;
			return {
				box,
				fn: (x, z, h) => {
					let w = 1;
					if (f.area) {
						const sd = areaSigned(f.area, x, z);
						w = 1 - smoothstep(0, f.soft ?? 4, sd);
						if (w <= 0) return h;
					}
					return h + (fbm(x / f.scale + seed, z / f.scale + seed * 1.7, 1) - 0.5) * 2 * f.amp * w;
				},
			};
		}
		default:
			throw new Error(`unknown height op "${f.kind}"`);
	}
}

const insideBox = (b, x, z) => !b || (x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3]);

// ---- assets ---------------------------------------------------------------------------------------------------------------------------------
/** Asset def by id from a plan (throws on an unknown id). */
export function assetDef(plan, id) {
	plan._defs ??= new Map(plan.assets.map((a) => [a.id, a]));
	const def = plan._defs.get(id);
	if (!def) throw new Error(`${plan.id}: no asset def "${id}"`);
	return def;
}

/** Modules of a run: [{ x, z, yawDeg, sx, len }] — piece length along the segment, the last one fitted (x scale 0.8..1.25), gaps skipped. */
export function runModules(run, moduleLength) {
	const out = [];
	const pts = run.points;
	for (let i = 1; i < pts.length; i++) {
		const [ax, az] = pts[i - 1];
		const [bx, bz] = pts[i];
		const len = Math.hypot(bx - ax, bz - az);
		if (len < 0.3) continue;
		const n = Math.max(1, Math.round(len / moduleLength));
		const sx = clamp(len / (n * moduleLength), 0.6, 1.4);
		const yawDeg = yawAlong(bx - ax, bz - az) + (run.flip ? 180 : 0);
		for (let k = 0; k < n; k++) {
			const t = (k + 0.5) / n;
			const x = ax + (bx - ax) * t;
			const z = az + (bz - az) * t;
			if ((run.gaps ?? []).some(([gx, gz, r]) => Math.hypot(x - gx, z - gz) < r)) continue;
			out.push({ x, z, yawDeg, sx, len: len / n });
		}
	}
	return out;
}

/** Walkway deck segments of a plan path (no ground needed): [{ ax, az, bx, bz, ya, yb, w }] along its corner points; ramps are added by the world. */
function deckSegments(path) {
	const out = [];
	const pts = path.points;
	for (let i = 1; i < pts.length; i++) {
		const ya = pts[i - 1][2] ?? path.deck;
		const yb = pts[i][2] ?? path.deck;
		out.push({ ax: pts[i - 1][0], az: pts[i - 1][1], bx: pts[i][0], bz: pts[i][1], ya, yb, w: path.width, kind: 'deck', path: path.id });
	}
	return out;
}

/**
 * Design counts per asset id from the plan alone (no heights needed): structures + run modules + walkway deck segments + scatter counts + far items.
 * The §6b ASSETS export of a map is withCounts(PLAN): its defs with `count` filled in (a def's own `count` wins when it has one: procedural fields).
 */
export function assetCounts(plan) {
	const counts = new Map();
	const add = (id, n = 1) => counts.set(id, (counts.get(id) ?? 0) + n);
	for (const s of plan.structures ?? []) add(s.asset);
	for (const r of plan.runs ?? []) add(r.asset, runModules(r, assetDef(plan, r.asset).size[0]).length);
	for (const p of plan.paths ?? []) if (p.kind === 'walkway' && p.asset) add(p.asset, deckSegments(p).length);
	for (const s of plan.scatters ?? []) add(s.asset, s.count);
	for (const f of plan.far?.items ?? []) add(f.asset);
	return counts;
}

/** The §6b ASSETS list: every def of the plan with its design count (and only the contract's fields plus the build fields). */
export function withCounts(plan) {
	const counts = assetCounts(plan);
	return plan.assets.map((a) => ({ ...a, count: a.count ?? counts.get(a.id) ?? 0 }));
}

// ---- the world --------------------------------------------------------------------------------------------------------------------------------
/**
 * Evaluate a plan. Returns the world: { plan, bounds, heights (Grid2), height(x, z), slope(x, z), water, waterDepth(x, z), waterAt(x, z), paths,
 * decks, deckAt(x, z), surfaceY(x, z, from), structures, blockers, lights, markers, segments, spawns, views, far, makeMasks(sp), walkGrid(spawn), validate() }.
 */
export function evaluatePlan(plan) {
	const [bx0, bz0, bx1, bz1] = plan.bounds;
	const cell = plan.cell ?? 1;
	const W = { plan, bounds: plan.bounds, cell, problems: [] };

	// -- paths (smoothed polylines; walkways keep their corners) and their distance fields on a 0.5 m grid (bbox-limited, FAR elsewhere)
	const fieldCell = 0.5;
	W.paths = (plan.paths ?? []).map((p) => {
		const pts = p.kind === 'walkway' ? p.points.map((q) => q.slice()) : chaikin(p.points, p.smooth ?? 2);
		const reach = (p.width ?? 2) / 2 + (p.dike?.bank ?? 0) + 14;
		const box = areaBox({ poly: pts.map((q) => [q[0], q[1]]) }, reach);
		return { ...p, pts, box, length: polylineLength(pts), field: null };
	});
	const pathField = (p) => {
		if (p.field) return p.field;
		const g = Grid2.over(plan.bounds, fieldCell, FAR);
		const flat = p.pts.map((q) => [q[0], q[1]]);
		g.forEach((x, z, k) => (g.data[k] = polylineDistance(flat, x, z)), p.box);
		p.field = g;
		return g;
	};
	W.pathField = (id) => pathField(W.paths.find((p) => p.id === id));
	/** Distance to the nearest path of a filter (all paths when none), from the per-path fields. */
	W.pathDistance = (x, z, filter = null) => {
		let best = FAR;
		for (const p of W.paths) {
			if (filter && !filter(p)) continue;
			if (!insideBox(p.box, x, z)) continue;
			best = Math.min(best, pathField(p).sample(x, z));
		}
		return best;
	};

	// -- water bodies
	W.water = (plan.water ?? []).map((b) => {
		const shelf = b.shelf ?? [3, 0.3];
		const drop = b.drop ?? [1.5, 1.4];
		const reach = b.reach ?? 6;
		const bank = b.bank ?? [6, 0.35]; // outside the edge the ground is capped at level + 0.04 + distance · slope: a natural bank, never a cliff at the outline
		return { ...b, shelf, drop, reach, bank, box: areaBox(b.area, Math.max(reach, bank[0]) + (b.wobble ?? 0)) };
	});
	const wobble = (b, x, z) => (b.wobble ? (fbm(x * 0.09 + 7.7, z * 0.09 + 2.3, 1) - 0.5) * 2 * b.wobble : 0);
	/** Signed distance to a water body's edge (negative = in the water), wobbled. */
	W.waterSigned = (b, x, z) => areaSigned(b.area, x, z) + wobble(b, x, z);
	// one cached signed-distance field per body (0.5 m, clamped to ±40 m, over its box + 16 m) and their minimum: the hot loops (beds, deep walls, waterAt,
	// the water mesh) read a body's field, the painters and scatters the minimum; W.waterSigned stays the exact polygon distance
	const WF = Grid2.over(plan.bounds, fieldCell, 40);
	for (const b of W.water) {
		const F = Grid2.over(plan.bounds, fieldCell, 40);
		F.forEach((x, z, k) => {
			const v = clamp(W.waterSigned(b, x, z), -40, 40);
			F.data[k] = v;
			if (v < WF.data[k]) WF.data[k] = v;
		}, areaBox(b.area, Math.max(16, b.reach + 2, b.bank[0] + 2) + (b.wobble ?? 0)));
		b.field = F;
	}
	/** Signed distance to a body's (wobbled) edge from its cached field: exact at the field's nodes, bilinear between them. */
	W.waterSignedAt = (b, x, z) => b.field.sample(x, z);
	/** Signed distance to the nearest water edge (negative in the water); 40 when there is no water within ~16 m (bands farther out read 40). */
	W.waterDistance = (x, z) => (W.water.length ? WF.sample(x, z) : 40);

	// -- heights: ops → edge falloff → water beds (lower only) → dikes (raise only) → structure pads. The edge comes first so that the beds' drop-offs and the
	// dikes' crests survive near the bounds (an edge applied last would flatten a drop-off into a walkable slope and sink a dike that leaves the map).
	const H = Grid2.over(plan.bounds, cell, 0);
	const ops = (plan.heights ?? []).map(heightOp);
	H.forEach((x, z, k) => {
		let h = 0;
		for (const op of ops) if (insideBox(op.box, x, z)) h = op.fn(x, z, h);
		H.data[k] = h;
	});
	if (plan.edge) {
		const { width, y } = plan.edge;
		H.forEach((x, z, k) => {
			const d = Math.min(x - bx0, bx1 - x, z - bz0, bz1 - z);
			if (d < width) H.data[k] = lerp(y, H.data[k], smoothstep(0, width, d));
		});
	}
	for (const b of W.water) {
		H.forEach((x, z, k) => {
			const inside = -W.waterSignedAt(b, x, z); // > 0 in the water
			if (inside <= -b.bank[0]) return;
			const bed = inside > 0
				? b.level + 0.04 - b.shelf[1] * smoothstep(0, b.shelf[0], inside) - b.drop[1] * smoothstep(b.shelf[0], b.shelf[0] + b.drop[0], inside)
				: b.level + 0.04 - inside * b.bank[1];
			H.data[k] = Math.min(H.data[k], bed);
		}, b.box);
	}
	for (const p of W.paths) {
		if (p.kind !== 'dike' || !p.dike) continue;
		const half = p.width / 2;
		const bank = p.dike.bank ?? 3;
		const f = pathField(p);
		H.forEach((x, z, k) => {
			const d = f.sample(x, z);
			if (d > half + bank) return;
			const crest = p.dike.crest;
			H.data[k] = Math.max(H.data[k], lerp(crest, H.data[k], smoothstep(half, half + bank, d)));
		}, p.box);
	}
	W.heights = H;
	W.height = (x, z) => H.sample(x, z);

	// -- assets, structures, runs (resolved before pads: a pad flattens under its structure)
	W.defs = new Map(plan.assets.map((a) => [a.id, a]));
	const def = (id) => {
		const d = W.defs.get(id);
		if (!d) throw new Error(`${plan.id}: no asset def "${id}"`);
		return d;
	};
	let uid = 0;
	const place = (src, extra = {}) => {
		const d = def(src.asset);
		const sc = Array.isArray(src.scale) ? src.scale : [src.scale ?? 1, src.scale ?? 1, src.scale ?? 1];
		const size = [d.size[0] * sc[0], d.size[1] * sc[1], d.size[2] * sc[2]];
		const yawDeg = src.yaw ?? 0;
		return {
			uid: uid++, asset: src.asset, def: d, x: src.x, z: src.z, yawDeg, yaw: yawDeg * DEG, scale: sc, size, name: src.name ?? d.name, label: src.label ?? null,
			tag: src.tag ?? null, collide: src.collide ?? d.collide ?? true, yMode: src.y ?? d.y ?? 'ground', dy: src.dy ?? 0, pad: src.pad ?? null, moods: src.moods ?? null,
			footprint: footprint(src.x, src.z, size[0], size[2], yawDeg * DEG), ...extra,
		};
	};
	W.structures = (plan.structures ?? []).map((s) => place(s));
	for (const [ri, r] of (plan.runs ?? []).entries()) {
		const d = def(r.asset);
		for (const m of runModules(r, d.size[0])) W.structures.push(place({ asset: r.asset, x: m.x, z: m.z, yaw: m.yawDeg, scale: [m.sx, r.scaleY ?? 1, 1], y: r.y ?? 'min', tag: r.tag }, { run: ri, parapet: r.parapet ?? d.size[1] * 0.6 }));
	}
	// pads: flatten an oriented box (footprint + margin) to the ground at the centre (or pad.y)
	for (const s of W.structures) {
		if (!s.pad) continue;
		const margin = s.pad.margin ?? 1;
		const soft = s.pad.soft ?? 1.5;
		const y = s.pad.y ?? H.sample(s.x, s.z);
		s.padY = y;
		const area = { obb: [s.x, s.z, s.size[0] + 2 * margin, s.size[2] + 2 * margin, s.yawDeg] };
		H.forEach((x, z, k) => {
			const sd = areaSigned(area, x, z);
			if (sd >= soft) return;
			H.data[k] = lerp(H.data[k], y, 1 - smoothstep(0, soft, sd));
		}, areaBox(area, soft));
	}

	// -- slope (gradient magnitude) on the height grid
	const S = Grid2.over(plan.bounds, cell, 0);
	H.forEach((x, z, k) => {
		const gx = (H.sample(x + cell, z) - H.sample(x - cell, z)) / (2 * cell);
		const gz = (H.sample(x, z + cell) - H.sample(x, z - cell)) / (2 * cell);
		S.data[k] = Math.hypot(gx, gz);
	});
	W.slope = (x, z) => S.sample(x, z);

	// -- water depth
	W.waterAt = (x, z) => {
		for (const b of W.water) {
			if (!insideBox(b.box, x, z)) continue;
			if (W.waterSignedAt(b, x, z) > b.reach) continue;
			const depth = b.level - H.sample(x, z);
			if (depth > 0) return { body: b, depth, level: b.level };
		}
		return null;
	};
	W.waterDepth = (x, z) => W.waterAt(x, z)?.depth ?? 0;
	W.inBounds = (x, z) => x >= bx0 && x <= bx1 && z >= bz0 && z <= bz1;

	// -- deep-water walls: the WADE.depth contour of every water body (and of the far water over a sunken edge), as wall segments { ax, az, bx, bz, y0, y1, body }
	W.deepWalls = [];
	for (const b of W.water) {
		const deep = b.level - WADE.depth;
		const value = (x, z, k) => {
			const v = deep - H.data[k];
			if (v < -0.3) return v; // well above the deep line: no need for the (costly) polygon test
			return W.waterSignedAt(b, x, z) <= b.reach ? v : -1;
		};
		for (const [ax, az, bx, bz] of contour(H, b.box, value)) {
			W.deepWalls.push({ ax, az, bx, bz, y0: b.level - 4, y1: b.level + WADE.top, body: b.id });
		}
	}
	if (plan.edge && plan.far) {
		// the far water over a sunken edge that no water body of the plan covers (a body walls its own water)
		const level = plan.far.level ?? 0;
		const reach = plan.edge.width + 2;
		const covered = (x, z) => W.water.some((b) => insideBox(b.box, x, z) && W.waterSignedAt(b, x, z) <= b.reach);
		const value = (x, z, k) => {
			const v = level - WADE.depth - H.data[k];
			return v < -0.3 || covered(x, z) ? Math.min(v, -0.01) : v;
		};
		for (const box of [[bx0, bz0, bx1, bz0 + reach + 1], [bx0, bz1 - reach - 1, bx1, bz1], [bx0, bz0, bx0 + reach + 1, bz1], [bx1 - reach - 1, bz0, bx1, bz1]]) {
			for (const [ax, az, bx, bz] of contour(H, box, value)) W.deepWalls.push({ ax, az, bx, bz, y0: level - 4, y1: level + WADE.top, body: 'far' });
		}
	}

	// -- walkway decks (+ ramps where an end meets lower ground)
	W.decks = [];
	for (const p of W.paths) {
		if (p.kind !== 'walkway') continue;
		const segs = deckSegments(p);
		W.decks.push(...segs);
		if (p.ramps === false) continue;
		for (const end of p.ramps === 'start' ? [0] : p.ramps === 'end' ? [1] : [0, 1]) {
			const seg = end ? segs[segs.length - 1] : segs[0];
			const [ex, ez, ey] = end ? [seg.bx, seg.bz, seg.yb] : [seg.ax, seg.az, seg.ya];
			const len = Math.hypot(seg.bx - seg.ax, seg.bz - seg.az) || 1;
			const dir = end ? [(seg.bx - seg.ax) / len, (seg.bz - seg.az) / len] : [(seg.ax - seg.bx) / len, (seg.az - seg.bz) / len];
			const drop = ey - H.sample(ex + dir[0] * 0.6, ez + dir[1] * 0.6);
			if (drop < 0.08) continue;
			let L = clamp(drop / 0.32, 0.8, 6);
			for (let it = 0; it < 4; it++) L = clamp((ey - H.sample(ex + dir[0] * L, ez + dir[1] * L)) / 0.32, 0.8, 6); // the ramp foot meets the ground
			const fy = H.sample(ex + dir[0] * L, ez + dir[1] * L);
			W.decks.push({ ax: ex, az: ez, bx: ex + dir[0] * L, bz: ez + dir[1] * L, ya: ey, yb: Math.min(ey, fy + 0.02), w: seg.w, kind: 'ramp', path: p.id });
		}
	}
	/** Top of a deck / ramp at (x, z), or null. */
	W.deckAt = (x, z) => {
		let best = null;
		for (const s of W.decks) {
			const r = segment(s.ax, s.az, s.bx, s.bz, x, z, _seg);
			if (r.d > s.w / 2) continue;
			const y = lerp(s.ya, s.yb, r.t);
			if (best === null || y > best) best = y;
		}
		return best;
	};
	/** The walk surface under (x, z) not above `from` (+ step): the highest of the ground and a deck. */
	W.surfaceY = (x, z, from = Infinity) => {
		let y = H.sample(x, z);
		const deck = W.deckAt(x, z);
		if (deck !== null && deck <= from + PLAY.step && deck > y) y = deck;
		return y;
	};

	// -- structure heights (after the pads)
	for (const s of W.structures) {
		const pts = [[s.x, s.z], ...s.footprint];
		const hs = pts.map(([x, z]) => H.sample(x, z));
		let y;
		if (typeof s.yMode === 'number') y = s.yMode;
		else if (s.yMode === 'min') y = Math.min(...hs);
		else if (s.yMode === 'max') y = Math.max(...hs);
		else if (s.yMode === 'deck') y = W.deckAt(s.x, s.z) ?? hs[0];
		else if (s.yMode === 'water') y = W.waterAt(s.x, s.z)?.level ?? hs[0];
		else y = s.padY ?? hs[0];
		s.y = y + s.dy;
		// a wall / fence module on a slope stands on its lowest ground and reaches the uphill ground + a parapet: never buried (so never stepped over)
		if (s.run !== undefined && s.yMode === 'min') {
			const top = Math.max(s.y + s.size[1], Math.max(...hs) + s.parapet);
			const k = (top - s.y) / s.size[1];
			s.scale = [s.scale[0], s.scale[1] * k, s.scale[2]];
			s.size = [s.size[0], top - s.y, s.size[2]];
		}
		s.top = s.y + s.size[1];
	}
	// walkway pieces: one labelled placement per deck segment (the deck mesh itself is built from W.decks)
	for (const p of W.paths) {
		if (p.kind !== 'walkway' || !p.asset) continue;
		for (const s of W.decks.filter((d) => d.path === p.id && d.kind === 'deck')) {
			const len = Math.hypot(s.bx - s.ax, s.bz - s.az);
			const st = place({ asset: p.asset, x: (s.ax + s.bx) / 2, z: (s.az + s.bz) / 2, yaw: yawAlong(s.bx - s.ax, s.bz - s.az), scale: [len / def(p.asset).size[0], 1, s.w / def(p.asset).size[2]] }, { deck: true, collide: false });
			st.y = (s.ya + s.yb) / 2 - def(p.asset).size[1];
			st.top = st.y + st.size[1];
			W.structures.push(st);
		}
	}

	// -- scatters (seeded rejection sampling)
	const solid = () => W.structures.filter((s) => !s.scatter && !s.deck);
	const structureDistance = (x, z, list) => {
		let best = Infinity;
		for (const s of list) {
			if (Math.abs(x - s.x) > s.size[0] + s.size[2] + 12 || Math.abs(z - s.z) > s.size[0] + s.size[2] + 12) continue;
			best = Math.min(best, polySigned(s.footprint, x, z));
		}
		return best;
	};
	W.structureDistance = (x, z, filter = null) => structureDistance(x, z, solid().filter((s) => !filter || filter(s)));
	W.scatterShortfall = [];
	for (const [si, sc] of (plan.scatters ?? []).entries()) {
		const d = def(sc.asset);
		const r = rng((sc.seed ?? 7) * 7919 + si * 104729 + (plan.seed ?? 1));
		const box = areaBox(sc.area);
		const placed = [];
		const fixed = solid();
		const clear = sc.clear ?? {};
		const spacing = sc.spacing ?? Math.max(d.size[0], d.size[2]);
		for (let tries = 0; placed.length < sc.count && tries < sc.count * 80; tries++) {
			const x = lerp(box[0], box[2], r());
			const z = lerp(box[1], box[3], r());
			const yawR = r();
			const scaleR = r();
			if (areaSigned(sc.area, x, z) > 0) continue;
			if (x < bx0 + 1 || x > bx1 - 1 || z < bz0 + 1 || z > bz1 - 1) continue;
			const wd = W.waterDistance(x, z);
			if (sc.band?.water && !(wd >= sc.band.water[0] && wd <= sc.band.water[1])) continue;
			if (clear.water !== undefined && wd < clear.water) continue;
			if (clear.paths !== undefined && W.pathDistance(x, z, (p) => p.kind !== 'walkway') < clear.paths + (0)) continue;
			if (clear.decks !== undefined && W.pathDistance(x, z, (p) => p.kind === 'walkway') < clear.decks) continue;
			if (clear.structures !== undefined && structureDistance(x, z, fixed) < clear.structures) continue;
			const h = H.sample(x, z);
			if (sc.height && (h < sc.height[0] || h > sc.height[1])) continue;
			if (sc.slope !== undefined && S.sample(x, z) > sc.slope) continue;
			if (placed.some((q) => Math.hypot(q.x - x, q.z - z) < spacing)) continue;
			const scale = sc.scale ? lerp(sc.scale[0], sc.scale[1], scaleR) : 1;
			const yaw = sc.yaw === undefined || sc.yaw === 'random' ? yawR * 360 - 180 : sc.yaw;
			const st = place({ asset: sc.asset, x, z, yaw, scale, y: sc.y ?? 'min', tag: sc.tag, collide: sc.collide }, { scatter: si });
			st.y = (sc.y === 'ground' ? h : Math.min(h, ...st.footprint.map(([fx, fz]) => H.sample(fx, fz)))) + (sc.dy ?? 0);
			st.top = st.y + st.size[1];
			placed.push(st);
		}
		if (placed.length < sc.count) W.scatterShortfall.push({ asset: sc.asset, scatter: si, wanted: sc.count, placed: placed.length });
		W.structures.push(...placed);
	}

	// -- blockers (walk): colliding structures' footprints and vertical extent; a def with `blockers` ([[lx, lz, w, d], …] local rects, def metres) blocks only
	// there (a gate's plinths, not its passage)
	W.blockers = W.structures.filter((s) => s.collide && !s.deck).flatMap((s) => {
		if (!s.def.blockers) return [{ uid: s.uid, asset: s.asset, pts: s.footprint, y0: s.y, y1: s.top, x: s.x, z: s.z, r: Math.hypot(s.size[0], s.size[2]) / 2 }];
		const c = Math.cos(s.yaw);
		const sn = Math.sin(s.yaw);
		return s.def.blockers.map(([lx, lz, w, d]) => {
			const ox = lx * s.scale[0];
			const oz = lz * s.scale[2];
			const x = s.x + ox * c + oz * sn;
			const z = s.z - ox * sn + oz * c;
			return { uid: s.uid, asset: s.asset, pts: footprint(x, z, w * s.scale[0], d * s.scale[2], s.yaw), y0: s.y, y1: s.top, x, z, r: Math.hypot(w * s.scale[0], d * s.scale[2]) / 2 };
		});
	});

	// -- the walk floor: Play walks on the terrain with holes (gameplay/host.js buildNav walks a nav cell only where a floor lies under its centre, within
	// PLAY.step of a walkable neighbour's). A signed field per height-grid vertex, W.floorField (< 0 = hole): water deeper than WADE.depth (a body's or the
	// far water's), a walkway or ramp (its planks are the floor there, so the flood never meets the bed under a deck first) and the hero's radius round a
	// colliding structure (Play's nav would slip into thick walls and between thin ones). Read linearly on the triangles of buildTerrain's split, so the
	// floor outdoorBuild cuts (buildWalkFloor) and walkGrid (W.walkY) see the same holes.
	const FF = new Float32Array(H.nx * H.nz);
	const farLevel = plan.far ? (plan.far.level ?? 0) : -Infinity;
	H.forEach((x, z, k) => {
		FF[k] = WADE.depth - Math.max(W.waterDepth(x, z), farLevel - H.data[k]);
	});
	for (const s of W.decks) {
		const m = s.w / 2 + 1;
		H.forEach((x, z, k) => {
			FF[k] = Math.min(FF[k], segment(s.ax, s.az, s.bx, s.bz, x, z, _seg).d - s.w / 2);
		}, [Math.min(s.ax, s.bx) - m, Math.min(s.az, s.bz) - m, Math.max(s.ax, s.bx) + m, Math.max(s.az, s.bz) + m]);
	}
	for (const b of W.blockers) {
		const m = b.r + PLAY.radius + 1;
		H.forEach((x, z, k) => {
			const h = H.data[k];
			if (b.y1 < h + PLAY.band[0] || b.y0 > h + PLAY.band[1]) return;
			FF[k] = Math.min(FF[k], polySigned(b.pts, x, z) - PLAY.radius);
		}, [b.x - m, b.z - m, b.x + m, b.z + m]);
	}
	W.floorField = FF;
	/** Play's walk floor at (x, z) — the height-grid triangle under the point (buildTerrain's split), read linearly: its height, or null in a hole / off the grid. */
	W.floorAt = (x, z) => {
		const fx = (x - H.x0) / H.cell;
		const fz = (z - H.z0) / H.cell;
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		if (i < 0 || j < 0 || i >= H.nx - 1 || j >= H.nz - 1) return null;
		const tx = fx - i;
		const tz = fz - j;
		const k = j * H.nx + i;
		let a = k;
		let b = k + 1;
		let c = k + H.nx;
		let u = tx;
		let v = tz;
		if (tx + tz > 1) {
			a = k + H.nx + 1;
			b = k + H.nx;
			c = k + 1;
			u = 1 - tx;
			v = 1 - tz;
		}
		if (FF[a] + (FF[b] - FF[a]) * u + (FF[c] - FF[a]) * v < 0) return null;
		const D = H.data;
		return D[a] + (D[b] - D[a]) * u + (D[c] - D[a]) * v;
	};
	/** Play's walk surface at (x, z) from height `from` (gameplay/host.js groundAt): the highest of the walk floor and a deck not above from + PLAY.step, or null. */
	W.walkY = (x, z, from = Infinity) => {
		const top = from + PLAY.step;
		let y = W.floorAt(x, z);
		if (y !== null && y > top) y = null;
		const deck = W.deckAt(x, z);
		if (deck !== null && deck <= top && (y === null || deck > y)) y = deck;
		return y;
	};

	// -- lights, markers, segments, spawns, views, far features
	const yAt = (x, z) => W.surfaceY(x, z);
	W.lights = (plan.lights ?? []).map((l) => ({ ...l, yWorld: l.yAbs ?? yAt(l.x, l.z) + (l.y ?? 1.5) }));
	W.markers = (plan.markers ?? []).map((m) => ({ ...m, y: m.y ?? (m.x !== undefined ? yAt(m.x, m.z) : 0) }));
	W.segments = (plan.segments ?? []).map((s) => ({ ...s, spawnY: yAt(s.spawn[0], s.spawn[1]) }));
	W.spawns = W.segments.map((s) => ({ id: s.id, label: s.label, x: s.spawn[0], z: s.spawn[1], y: s.spawnY }));
	if (plan.far) {
		const far = plan.far;
		const hillY = (x, z) => {
			let h = far.level ?? 0;
			for (const hl of far.hills ?? []) {
				const d = Math.hypot(x - hl.x, z - hl.z) / hl.r;
				if (d < 1) h = Math.max(h, (far.level ?? 0) + hl.h * (0.5 + 0.5 * Math.cos(Math.PI * d)) ** 0.8);
			}
			return h;
		};
		W.far = { ...far, hillY, items: (far.items ?? []).map((f) => ({ ...place({ ...f, y: 0 }, { far: true, collide: false }), y: hillY(f.x, f.z) + (f.dy ?? 0) })) };
		for (const it of W.far.items) it.top = it.y + it.size[1];
	} else W.far = null;
	/** A point named in a view / sightline: [x, y, z] as is, [x, z] or [x, ignored, z] on the ground (+ lift), 'far:<asset>' = that far item's upper middle. */
	W.resolvePoint = (p, lift = 0) => {
		if (typeof p === 'string' && p.startsWith('far:')) {
			const it = W.far?.items.find((f) => f.asset === p.slice(4));
			if (!it) throw new Error(`${plan.id}: no far item "${p}"`);
			return [it.x, it.y + it.size[1] * 0.55, it.z];
		}
		if (p.length === 2) return [p[0], yAt(p[0], p[1]) + lift, p[1]];
		return lift || p[1] === 0 ? [p[0], yAt(p[0], p[2]) + lift, p[2]] : p.slice();
	};
	W.views = Object.fromEntries(Object.entries(plan.views ?? {}).map(([id, v]) => {
		if (v.eye) return [id, { ...v, id, eye: W.resolvePoint(v.eye, v.eyeLift ?? 1.7), look: W.resolvePoint(v.look, v.lookLift ?? 0) }];
		return [id, { ...v, id, target: v.target.length === 3 ? v.target : W.resolvePoint(v.target, v.lift ?? 0.5) }];
	}));
	for (const m of W.markers) {
		if (m.kind !== 'sightline') continue;
		m.fromP = W.resolvePoint([m.from[0], m.from[1]], m.from[2] ?? 1.7);
		m.toP = W.resolvePoint(m.target, m.targetLift ?? 0);
	}

	// -- ground masks
	W.layers = plan.layers;
	W.layerIndex = new Map(plan.layers.map((l, i) => [l.id, i]));
	W.makeMasks = (sp) => makeMasks(W, sp);
	W.walkGrid = (spawn, opts) => walkGrid(W, spawn, opts);
	W.validate = () => validate(W);
	return W;
}

// ---- ground masks ---------------------------------------------------------------------------------------------------------------------------
/**
 * The ground masks of a world in LayerSplat.fill's layout: (x, z, out) → out[i − 1] = coverage of layer i (1..7) over the layers below it, out[7] = wetness.
 * Painters run in plan order; each yields v (0..1) that combines into its layer's coverage by `op` (max | mul | sub). Soft widths are metres at Độ mịn 0
 * and grow with the slider (`k`), like env/oldFace.js; edge noise wobbles distance-based edges, `patchy` keeps only fBm blobs.
 */
export function makeMasks(W, sp) {
	const k = 0.5 + (1.5 * sp.blurM) / 0.95;
	const n = W.layers.length;
	const painters = (W.plan.paint ?? []).map((p, i) => compilePainter(W, p, i, k, sp));
	return (x, z, out) => {
		for (let i = 0; i < 8; i++) out[i] = 0;
		for (const p of painters) {
			const inside = !p.box || insideBox(p.box, x, z);
			if (!inside && p.op !== 'mul') continue;
			const v = inside ? p.eval(x, z) : 0;
			const c = p.slot;
			if (p.op === 'max') out[c] = Math.max(out[c], v);
			else if (p.op === 'mul') out[c] *= v;
			else if (p.op === 'sub') out[c] *= 1 - v;
		}
		for (let i = n - 1; i < 7; i++) out[i] = 0; // unused layer slots
		for (let i = 0; i < 8; i++) out[i] = clamp(out[i], 0, 1);
	};
}

/**
 * The masks rasterised in LayerSplat's raw layout (two RGBA8 planes, row 0 = z originZ): evaluated every `step` texels and bilinearly filled in between
 * (the blends are metres wide, so a 2-texel step is invisible and ~4× faster). Returns [raw0 (layers 1..4), raw1 (layers 5..7 + wetness)].
 */
export function maskRaster(masks, { originX, originZ, extent, size, step = 2 }) {
	const k = extent / size;
	const m = Math.ceil((size - 1) / step) + 1; // coarse nodes per side
	const coarse = new Float32Array(m * m * 8);
	const out = new Float32Array(8);
	for (let j = 0; j < m; j++) {
		for (let i = 0; i < m; i++) {
			masks(originX + (Math.min(i * step, size - 1) + 0.5) * k, originZ + (Math.min(j * step, size - 1) + 0.5) * k, out);
			coarse.set(out, (j * m + i) * 8);
		}
	}
	const raw = [new Uint8Array(size * size * 4), new Uint8Array(size * size * 4)];
	for (let j = 0; j < size; j++) {
		const fj = Math.min(j / step, m - 1.0001);
		const j0 = Math.floor(fj);
		const tj = fj - j0;
		for (let i = 0; i < size; i++) {
			const fi = Math.min(i / step, m - 1.0001);
			const i0 = Math.floor(fi);
			const ti = fi - i0;
			const a = (j0 * m + i0) * 8;
			const b = a + 8;
			const c = a + m * 8;
			const d = c + 8;
			const o = (j * size + i) * 4;
			for (let ch = 0; ch < 8; ch++) {
				const v = (coarse[a + ch] * (1 - ti) + coarse[b + ch] * ti) * (1 - tj) + (coarse[c + ch] * (1 - ti) + coarse[d + ch] * ti) * tj;
				raw[ch >> 2][o + (ch & 3)] = Math.round(clamp(v, 0, 1) * 255);
			}
		}
	}
	return raw;
}

function compilePainter(W, p, index, k, sp) {
	const layer = p.layer === 'wet' ? 8 : W.layerIndex.get(p.layer);
	if (layer === undefined) throw new Error(`${W.plan.id}: paint ${index} names layer "${p.layer}" that is not in the plan`);
	if (layer === 0) throw new Error(`${W.plan.id}: paint ${index} paints the base layer (layer 0 is everywhere)`);
	const slot = layer - 1; // LayerSplat.fill: out[0..6] = layers 1..7, out[7] = wetness
	const soft = Math.max(0.05, (p.soft ?? 1) * k);
	const value = p.value ?? 1;
	const seed = (p.seed ?? index * 3.7) + 11.3;
	const edge = p.edge ? (x, z) => (fbm(x / p.edge.scale + seed, z / p.edge.scale - seed, sp.detail) - 0.5) * 2 * p.edge.amp : () => 0;
	const patchy = p.patchy
		? (x, z) => smoothstep(1 - p.patchy.cover - 0.12, 1 - p.patchy.cover + 0.12, fbm((x / p.patchy.scale) * sp.freq + seed * 2, (z / p.patchy.scale) * sp.freq + seed, sp.detail))
		: () => 1;
	const band = (d, from, to) => smoothstep(from - soft / 2, from + soft / 2, d) * (1 - smoothstep(to - soft / 2, to + soft / 2, d));
	let evalFn;
	let box = null;
	switch (p.kind) {
		case 'fill':
			evalFn = (x, z) => value * patchy(x, z);
			break;
		case 'area':
			box = areaBox(p.area, soft + (p.edge?.amp ?? 0));
			evalFn = (x, z) => value * patchy(x, z) * (1 - smoothstep(-soft / 2, soft / 2, areaSigned(p.area, x, z) + edge(x, z)));
			break;
		case 'path': {
			const sel = W.paths.filter((q) => (p.paths ? p.paths.includes(q.id) : p.pathKind ? [].concat(p.pathKind).includes(q.kind) : true));
			if (!sel.length) throw new Error(`${W.plan.id}: paint ${index} selects no path`);
			const extra = p.extra ?? 0; // m beyond the path's half width
			box = sel.reduce((b, q) => [Math.min(b[0], q.box[0]), Math.min(b[1], q.box[1]), Math.max(b[2], q.box[2]), Math.max(b[3], q.box[3])], [Infinity, Infinity, -Infinity, -Infinity]);
			evalFn = (x, z) => {
				let best = FAR;
				for (const q of sel) if (insideBox(q.box, x, z)) best = Math.min(best, W.pathField(q.id).sample(x, z) - (q.width ?? 2) / 2);
				if (best >= FAR / 2) return 0;
				return value * patchy(x, z) * (1 - smoothstep(extra - soft / 2, extra + soft / 2, best + edge(x, z)));
			};
			break;
		}
		case 'water': {
			const [from, to] = p.band;
			evalFn = (x, z) => value * patchy(x, z) * band(W.waterDistance(x, z) + edge(x, z), from, to);
			break;
		}
		case 'height': {
			const [y0, y1] = p.range;
			evalFn = (x, z) => value * patchy(x, z) * band(W.height(x, z) + edge(x, z) * 0.15, y0, y1);
			break;
		}
		case 'slope': {
			const [s0, s1] = p.range;
			const sSoft = (p.softSlope ?? 0.08) * k;
			evalFn = (x, z) => {
				const s = W.slope(x, z);
				return value * patchy(x, z) * smoothstep(s0 - sSoft, s0 + sSoft, s) * (1 - smoothstep(s1 - sSoft, s1 + sSoft, s));
			};
			break;
		}
		case 'structures': {
			const sel = W.structures.filter((s) => !s.scatter && !s.deck && (p.assets ? p.assets.includes(s.asset) : p.categories ? p.categories.includes(s.def.category) : true));
			const margin = p.margin ?? 1;
			const grid = Grid2.over(W.bounds, 0.5, FAR);
			for (const s of sel) {
				const b = areaBox({ poly: s.footprint }, margin + soft + 1);
				grid.forEach((x, z, kk) => (grid.data[kk] = Math.min(grid.data[kk], polySigned(s.footprint, x, z))), b);
			}
			evalFn = (x, z) => {
				const d = grid.sample(x, z);
				if (d > margin + soft) return 0;
				return value * patchy(x, z) * (1 - smoothstep(margin - soft / 2, margin + soft / 2, d + edge(x, z)));
			};
			break;
		}
		case 'points': {
			const pts = p.points; // [[x, z, r], …]
			box = pts.reduce((b, [x, z, r]) => [Math.min(b[0], x - r - soft), Math.min(b[1], z - r - soft), Math.max(b[2], x + r + soft), Math.max(b[3], z + r + soft)], [Infinity, Infinity, -Infinity, -Infinity]);
			evalFn = (x, z) => {
				let v = 0;
				for (const [px, pz, r] of pts) v = Math.max(v, 1 - smoothstep(r - soft / 2, r + soft / 2, Math.hypot(x - px, z - pz) + edge(x, z)));
				return value * patchy(x, z) * v;
			};
			break;
		}
		default:
			throw new Error(`${W.plan.id}: paint ${index} has an unknown kind "${p.kind}"`);
	}
	return { slot, op: p.op ?? 'max', eval: evalFn, box };
}

// ---- contours ----------------------------------------------------------------------------------------------------------------------------------
// Marching squares: the edge pairs of each case, edges 0 (a-b, z0), 1 (b-c, x1), 2 (c-d, z1), 3 (d-a, x0); corners a (x0, z0) = 1, b (x1, z0) = 2,
// c (x1, z1) = 4, d (x0, z1) = 8. The saddles 5 and 10 are resolved by the cell centre.
const MS = [[], [[3, 0]], [[0, 1]], [[3, 1]], [[1, 2]], null, [[0, 2]], [[3, 2]], [[2, 3]], [[0, 2]], null, [[1, 2]], [[1, 3]], [[0, 1]], [[3, 0]], []];

/** Segments [[ax, az, bx, bz], ...] of value(x, z, nodeIndex) = 0 over the grid nodes of `H` inside `box` (value > 0 = inside). */
export function contour(H, box, value) {
	const { x0, z0, cell, nx, nz } = H;
	const i0 = clamp(Math.floor((box[0] - x0) / cell), 0, nx - 1);
	const i1 = clamp(Math.ceil((box[2] - x0) / cell), 0, nx - 1);
	const j0 = clamp(Math.floor((box[1] - z0) / cell), 0, nz - 1);
	const j1 = clamp(Math.ceil((box[3] - z0) / cell), 0, nz - 1);
	const w = i1 - i0 + 1;
	const h = j1 - j0 + 1;
	if (w < 2 || h < 2) return [];
	const V = new Float32Array(w * h);
	for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) V[j * w + i] = value(x0 + (i0 + i) * cell, z0 + (j0 + j) * cell, (j0 + j) * nx + i0 + i);
	const out = [];
	const cut = (xa, za, va, xb, zb, vb) => {
		const t = va / (va - vb);
		return [xa + (xb - xa) * t, za + (zb - za) * t];
	};
	for (let j = 0; j + 1 < h; j++) {
		for (let i = 0; i + 1 < w; i++) {
			const a = V[j * w + i];
			const b = V[j * w + i + 1];
			const c = V[(j + 1) * w + i + 1];
			const d = V[(j + 1) * w + i];
			const code = (a > 0 ? 1 : 0) | (b > 0 ? 2 : 0) | (c > 0 ? 4 : 0) | (d > 0 ? 8 : 0);
			if (code === 0 || code === 15) continue;
			const X0 = x0 + (i0 + i) * cell;
			const Z0 = z0 + (j0 + j) * cell;
			const X1 = X0 + cell;
			const Z1 = Z0 + cell;
			const edge = (e) => (e === 0 ? cut(X0, Z0, a, X1, Z0, b) : e === 1 ? cut(X1, Z0, b, X1, Z1, c) : e === 2 ? cut(X1, Z1, c, X0, Z1, d) : cut(X0, Z1, d, X0, Z0, a));
			const centre = (a + b + c + d) / 4 > 0;
			const pairs = MS[code] ?? (code === 5 ? (centre ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]]) : centre ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]]);
			for (const [e1, e2] of pairs) {
				const [px, pz] = edge(e1);
				const [qx, qz] = edge(e2);
				out.push([px, pz, qx, qz]);
			}
		}
	}
	return out;
}

// ---- the walk grid (a pure stand-in for gameplay/host.js buildNav) ---------------------------------------------------------------------------
/**
 * 1 m cells round the spawn (PLAY.grid; `full: true` = a grid that covers the whole map from the spawn), flood-filled from it like gameplay/host.js buildNav:
 * a cell is walkable when its surface (W.walkY: Play's walk floor — the terrain with holes in water deeper than WADE.depth, under decks and round colliding
 * structures — or a deck) is within PLAY.step of a walkable neighbour's and nothing solid comes within the hero's 0.3 m radius of its centre in the band
 * 0.35..1.7 m above that surface (W.blockers, the deep-water walls W.deepWalls): the hero wades and never swims. Returns { walk, ground, ox, oz, n, cells,
 * reached(x, z, tolerance) }.
 */
export function walkGrid(W, spawn, { size = PLAY.grid, cell = PLAY.cell, step = PLAY.step, radius = PLAY.radius, full = false } = {}) {
	if (full) {
		const [fx0, fz0, fx1, fz1] = W.bounds;
		size = 2 * Math.ceil(Math.max(spawn.x - fx0, fx1 - spawn.x, spawn.z - fz0, fz1 - spawn.z)) + 4;
	}
	const n = Math.round(size / cell);
	const half = n / 2;
	const ox = Math.floor(spawn.x) - half * cell;
	const oz = Math.floor(spawn.z) - half * cell;
	const walk = new Uint8Array(n * n);
	const ground = new Float32Array(n * n).fill(NaN);
	const [bx0, bz0, bx1, bz1] = W.bounds;
	const inBounds = (x, z) => x > bx0 + 0.5 && x < bx1 - 0.5 && z > bz0 + 0.5 && z < bz1 - 0.5;
	// everything solid in 2 m buckets (built per call: tests may add a blocker to W.blockers)
	const BK = 2;
	const buckets = new Map();
	const put = (item, x0b, z0b, x1b, z1b) => {
		for (let i = Math.floor(x0b / BK); i <= Math.floor(x1b / BK); i++) {
			for (let j = Math.floor(z0b / BK); j <= Math.floor(z1b / BK); j++) {
				const key = i * 100003 + j;
				let list = buckets.get(key);
				if (!list) buckets.set(key, (list = []));
				list.push(item);
			}
		}
	};
	const pad = radius + WADE.thick / 2 + 0.05;
	for (const b of W.blockers) put(b, b.x - b.r - pad, b.z - b.r - pad, b.x + b.r + pad, b.z + b.r + pad);
	for (const w of W.deepWalls ?? []) put({ seg: w, y0: w.y0, y1: w.y1 }, Math.min(w.ax, w.bx) - pad, Math.min(w.az, w.bz) - pad, Math.max(w.ax, w.bx) + pad, Math.max(w.az, w.bz) + pad);
	const zone = radius + WADE.thick / 2;
	const blockedAt = (x, z, g) => {
		const list = buckets.get(Math.floor(x / BK) * 100003 + Math.floor(z / BK));
		if (!list) return false;
		for (const b of list) {
			if (b.y1 < g + PLAY.band[0] || b.y0 > g + PLAY.band[1]) continue;
			if (b.seg) {
				if (segment(b.seg.ax, b.seg.az, b.seg.bx, b.seg.bz, x, z, _seg).d < zone) return true;
			} else if (Math.abs(x - b.x) <= b.r + radius + 0.5 && Math.abs(z - b.z) <= b.r + radius + 0.5 && polySigned(b.pts, x, z) < radius) return true;
		}
		return false;
	};
	const surfaceAt = (x, z, from) => {
		if (!inBounds(x, z)) return null;
		return W.walkY(x, z, from);
	};
	const start = Math.floor(half) + Math.floor(half) * n;
	const sx = ox + (Math.floor(half) + 0.5) * cell;
	const sz = oz + (Math.floor(half) + 0.5) * cell;
	const g0 = surfaceAt(sx, sz, (spawn.y ?? Infinity) + 0.5); // Play: groundAt(spawn.y + 0.5)
	if (g0 === null || blockedAt(sx, sz, g0)) return { walk, ground, ox, oz, n, cell, cells: 0, startOk: false, reached: () => false };
	walk[start] = 1;
	ground[start] = g0;
	const queue = [start];
	const D = [1, 0, -1, 0, 0, 1, 0, -1];
	for (let q = 0; q < queue.length; q++) {
		const kk = queue[q];
		const i = kk % n;
		const j = (kk / n) | 0;
		const gk = ground[kk];
		for (let d = 0; d < 8; d += 2) {
			const ni = i + D[d];
			const nj = j + D[d + 1];
			if (ni < 0 || nj < 0 || ni >= n || nj >= n) continue;
			const nk = ni + nj * n;
			if (walk[nk] || ground[nk] === -Infinity) continue;
			const x = ox + (ni + 0.5) * cell;
			const z = oz + (nj + 0.5) * cell;
			const g = surfaceAt(x, z, gk);
			if (g === null || Math.abs(g - gk) > step) continue;
			if (blockedAt(x, z, g)) {
				ground[nk] = -Infinity;
				continue;
			}
			walk[nk] = 1;
			ground[nk] = g;
			queue.push(nk);
		}
	}
	const reached = (x, z, tol = 1) => {
		const ci = Math.floor((x - ox) / cell);
		const cj = Math.floor((z - oz) / cell);
		const r = Math.ceil(tol / cell);
		for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
			const i = ci + di;
			const j = cj + dj;
			if (i >= 0 && j >= 0 && i < n && j < n && walk[i + j * n]) return true;
		}
		return false;
	};
	return { walk, ground, ox, oz, n, cell, cells: queue.length, startOk: true, reached };
}

// ---- validation --------------------------------------------------------------------------------------------------------------------------------
/** Problems of an evaluated plan (strings); [] = valid. Heavy walk checks live in the tests (walkGrid per spawn). */
export function validate(W) {
	const P = [];
	const plan = W.plan;
	const [x0, z0, x1, z1] = plan.bounds;
	const inB = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
	if (Math.max(x1 - x0, z1 - z0) > 256) P.push(`long side ${Math.max(x1 - x0, z1 - z0)} m > 256 m`);
	if (!(W.cell > 0 && W.cell <= 1)) P.push(`terrain cell ${W.cell} m (must be ≤ 1 m)`);
	if (plan.layers.length < 2 || plan.layers.length > 8) P.push(`${plan.layers.length} ground layers (2..8)`);
	if (new Set(plan.layers.map((l) => l.id)).size !== plan.layers.length) P.push('a ground layer is listed twice');
	for (let k = 0; k < W.heights.data.length; k++) if (!Number.isFinite(W.heights.data[k])) {
		P.push(`height NaN / infinite at node ${k}`);
		break;
	}
	const used = new Set(W.structures.map((s) => s.asset).concat(W.far?.items.map((f) => f.asset) ?? []));
	for (const s of plan.scatters ?? []) used.add(s.asset);
	const ids = new Set();
	for (const a of plan.assets) {
		if (ids.has(a.id)) P.push(`asset ${a.id} declared twice`);
		ids.add(a.id);
		for (const f of ['id', 'name', 'category', 'size', 'status', 'source', 'segment']) if (a[f] === undefined) P.push(`asset ${a.id}: no ${f}`);
		if (!CATEGORIES.includes(a.category)) P.push(`asset ${a.id}: category "${a.category}"`);
		if (!STATUSES.includes(a.status)) P.push(`asset ${a.id}: status "${a.status}"`);
		if (!(a.size?.length === 3 && a.size.every((v) => v > 0))) P.push(`asset ${a.id}: size ${JSON.stringify(a.size)}`);
		if ((a.status === 'glb' || a.status === 'kit') && !a.model) P.push(`asset ${a.id}: status ${a.status} without a model`);
		if (a.status === 'kit' && !String(a.model).startsWith('kit:')) P.push(`asset ${a.id}: kit model "${a.model}" is not kit:<kit>.<piece>`);
		if (!used.has(a.id) && !(a.placed === false && a.reason)) P.push(`asset ${a.id} is neither placed nor declared missing with a reason`);
	}
	for (const s of W.structures) if (!inB(s.x, s.z)) P.push(`${s.asset} (${s.name}) outside the bounds at ${s.x.toFixed(1)}, ${s.z.toFixed(1)}`);
	for (const m of W.markers) {
		if (m.kind === 'sightline') continue;
		if (!inB(m.x, m.z)) P.push(`marker ${m.kind} ${m.id ?? m.label} outside the bounds`);
	}
	for (const l of W.lights) if (!inB(l.x, l.z) && !l.far) P.push(`light ${l.id} outside the bounds`);
	if (W.lights.filter((l) => l.real).length > 8) P.push(`${W.lights.filter((l) => l.real).length} real lights (≤ 8)`);
	for (const s of W.segments) if (!inB(...s.spawn)) P.push(`spawn ${s.id} outside the bounds`);
	for (const sf of W.scatterShortfall) if (sf.placed < sf.wanted * 0.8) P.push(`scatter ${sf.scatter} (${sf.asset}) placed ${sf.placed} / ${sf.wanted}`);
	for (const v of Object.values(W.views)) if (!(v.target ?? v.eye.concat(v.look)).every(Number.isFinite)) P.push(`view ${v.id}: target not finite`);
	return P;
}

/** Human light flicker (1/f, per light seed) or 1 for still light: the light grammar (people's light moves, Perfection's does not). */
export const lightLevel = (l, t) => (l.kind === 'human' && (l.flicker ?? 1) > 0 ? 1 + (flicker1f(t, l.seed ?? 0) - 1) * (l.flicker ?? 1) * 1.6 : 1);

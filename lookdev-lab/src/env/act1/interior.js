// ASHLAR · Act I base maps — the INTERIOR engine, pure part (no THREE, no DOM; scene scenes/act1Interior.js, THREE side ./interiorBuild.js + ./interiorBlockout.js).
// A map is a PLAN (plain data, one file per map in ./maps/) compiled here into: rooms and one signed distance field to their walls (a 0.25 m raster, exact
// Euclidean transform), floor heights (levels, sloping floors, stairs, ramps, standing water), wall runs with their openings (doors, arches, windows, gaps),
// the void edges of pseudo-infinite cells (the floor fades into black, no wall), the placements of the map's assets (structures, rows, rings, scatters) with
// their walk blockers, lights with the light grammar (human flicker · Perfection still · Wall shimmer), markers, segments / spawns / views, the ground-layer
// masks of one LayerSplat, the asset counts of the missing-asset report and the plan checks run by scripts/act1-interior.test.mjs. Everything is
// deterministic (seeded mulberry32), every length is in metres, world axes: x east, z south (toward the default camera, which looks north), y up.
//
// ── PLAN FORMAT (what a map file in ./maps/ exports as PLAN; angles in degrees) ───────────────────────────────────────────────────────────────────────
//  engine: 'interior' (the tests pick the maps by it), id, name, label, ld ('11.12'), biome ('BIO-27'), seed, grid (raster cell, default 0.25, ≤ 1),
//  target: { length (m), note } the recommended full-length area (read by scripts/act1-assets-report.mjs), note (the Environment tab's summary, HTML),
//  atmosphere ({ motes: { count, box } }: GPU particles). Ids of assets with no concept yet are map-unique (N-<map>NN, e.g. N-CR01): the report keys by id.
//  bounds: [x0, z0, x1, z1]   the playable slice (≤ 256 m on its long side). The raster adds floor.apron + 2 m round it.
//  floor: { layers: [{ id, tile }]   2..8 ground layers bottom → top (layer-library ids: 'BIO27_cradle', 'DG_crypt_dust', 'DW_grass' …; tile = m per repeat)
//           tone (albedo ×, default 0.8) · ppm (splat texels per metre, default 6) · apron (m of dark floor drawn past the void edges, never walkable)
//           paint: [painter …] }   painter = { layer | wet, kind, amount (0..1, default 1), clear: [layer ids it removes], …kind fields }:
//             'room' rooms: [ids], soft · 'edge' width, noise (inside, along every wall and void edge) · 'void' width (the dark apron) ·
//             'path' points, width, soft · 'disc' at, r, soft · 'rect' rect, soft · 'around' asset, r, soft (round every placement of an asset) ·
//             'noise' scale, lo, hi, rooms
//  rooms: [{ id, name, shape, y, edge, walled, wall, sky, tag }]
//     shape: { rect: [x0, z0, x1, z1] } | { poly: [[x, z] …] } | { circle: [cx, cz, r], segments }
//     y: the floor level, or { base, gx, gz, at: [x, z], noise: [amp, scale] } (a sloping / rolling floor: hill paths, courtyards)
//     edge: where nothing else continues the room: 'wall' (default) | 'void' (floor fades into the black, no wall: pseudo-infinite cells) | 'none'
//           (open, closed by other geometry); or per side { default, n, s, e, w } (side = the edge's outward normal)
//     walled: true = a closed room (walls also where it touches another room; connect with openings). Default false: rooms that touch / overlap merge.
//     wall: { height, thickness, tile (layer-library id of the biome tile), tone, normal (normal-map strength, default 0.9), top (fade to black from this height), module (GLB sample id laid as
//           modules along the run, e.g. 'dungeon-prop-crypt-wall', + moduleSize [w, h, d]) } · wallSides: { n | s | e | w: { …overrides of wall } }
//     sky: { color, intensity } = open air (a courtyard): a soft unshadowed light from above. No ceilings anywhere: the camera wall fade keeps the hero seen.
//  walls: [{ id, a: [x, z], b: [x, z], …wall style }]   explicit partitions, centred on a → b (they cut the floor; doors through `openings`)
//  openings: [{ id, at: [x, z], width, kind: 'gap' | 'door' | 'arch' | 'window', height, sill, glow: { color, intensity, light: { kind, range, intensity } }, pane }]
//     (pane: 'outer' = the emitting pane sits on the wall's outer face instead of its middle: a window model set into the wall from inside)
//     cut into the nearest run (gap = full height · door = lintel above `height` · arch = pointed head · window = sill + lintel + an emitting pane, not
//     walkable; glow.light adds a light 0.6 m inside the room)
//  stairs: [{ id, rect, up: 'n' | 's' | 'e' | 'w', y0, y1, steps }]  `steps` treads inside the rect, rise = (y1 − y0) / (steps + 1); keep rise ≤ 0.2 and
//     rise / run ≤ 0.55 (the Play nav grid steps 0.6 m per 1 m cell) · ramps: [{ id, rect, up, y0, y1 }] (slope ≤ 0.55 too) · water: [{ id, shape, level }]
//  Placements of the map's KIT assets (yaw 0 = the asset's front faces south / +z, 90 = east; `void` = drawn in the dark past the floor, never solid):
//     structures: [{ asset, at: [x, z], yaw, y, scale, void, solid, light, name, tag }]
//     rows: [{ asset, from: [x, z], to: [x, z], count, yaw, except: [[x0, z0, x1, z1] …], void, light ('glow' = no PointLight), realEvery, realOffset
//           (a real light on the lamps k % realEvery === realOffset, glow only on the others), lightGroup, followGroup, jitter }]
//     rings: [{ asset, center: [x, z], r, count, from, to (bearings: 0 = north, clockwise; `to` exclusive), face: 'in' | 'out' | 'along', yaw, skip: [i …] }]
//     scatters: [{ asset, rect | rooms, count, gap, seed, scale: [a, b], keep (clearance from walls and solids) }]
//     A placement is solid (blocks the hero, a nav obstacle) when its asset is solid and its footprint (KIT size w × d, or `foot`) touches the floor.
//  lights: [{ id, kind: 'perfection' | 'human' | 'wall', at: [x, y, z], color, range, intensity, glow (sprite m), pool (floor pool m), group, shadow }]
//     perfection = still, even, identical (Mercy's milk-white) · human = small, warm, 1/f flicker · wall = cold white, slow shimmer. A KIT asset may carry
//     a light (KIT[id].light = { kind, y, color, range, intensity, glow, pool, group }): every placement lights it. lightGroups: { [group]: { label,
//     slider (the Environment-tab label), keepNear: [x, z], ambient (0..1: the scene's own ambient floor and far-view light radius sink to this as
//     the group goes out) } } = a group the scene dims one by one (the slider keeps the n lights nearest keepNear).
//     followGroup: '<group>' (on a plan light, a KIT light or a row / ring) = a light outside the group that dims with it: level = followFloor +
//     (1 − followFloor) · n / N (followFloor default 0.15), e.g. a key light or the far glows of a cell whose night-lights go out. At most one light
//     has shadow: true. The light budget counts the scene's hero light too (heroLight: false in the plan if a map has none): keep ≤ 16.
//  markers: [{ kind, at: [x, z], r, to: [x, z], label, ids, count, note }]  kind: encounter | boss | telegraph | rite | landmark | sightline | vignette |
//     npc | exit | lullaby | note | patrol | escort (overlays: off by default, a small legend on). patrol / escort: + points: [[x, z] …] (at = the first),
//     loop, cone: { range, angle } (a sight cone at every point, facing the next one; one point: facing `yaw`) — the "Tuần tra" overlay (walk-only maps)
//  rain: { dry: [[x0, z0, x1, z1] …], count, box, color }  rain streaks round the focus everywhere except the dry rects (the amount: the mood's `rain`)
//  room.outdoor: true = open air outside the building: KIT `roof: true` blockouts (exterior roofs) show only while the focus is outdoors or off the floor
//  camps: [{ id: 'P07', name, monster (a lab monster type standing in), at: [x, z], count, pack, radius, mlvl, boss }]  → scene.monsterCamps()
//  segments: [{ id, name, spawn: [x, z], yaw, view }]  one Play spawn per segment (the Play nav grid is 128 × 128 m round the spawn; the scene's
//     "Điểm xuất phát" dropdown) · route: [[x, z] …] the main walk (the tests check clearance, width and steps along it)
//  views: { id: { label, target: [x, y, z], dist, pitch, yaw } | { label, target, w, d } }  (pitch 55° = the D2 view; yaw 0 = camera south of the target,
//     90 = east of it) · moods: { id: { label, hemi, sky, ground, env, envI, toneMapping, exposure, lights (× every light), floorTone, background, fog: { … },
//     grade: { … }, lantern: { radius, strength, dim, color } } } — the first mood is the default; the id 'lookdev' is the flat "Soi texture · sáng đều" one
// ── KIT (per map: `export const KIT = { [assetId]: … }`) ──────────────────────────────────────────────────────────────────────────────────────────────
//  { name, short, category, size: [w, h, d], status: 'glb' | 'kit' | 'procedural' | 'blockout', source, segment, note, shape, model, light, solid, round, foot,
//    blockers (walk blockers in the asset frame, e.g. only the posts), openCats (categories drawn walk-through: cloth), fade (false = no camera wall
//    fade), monster (a monster blockout: listed in MONSTERS, hidden in Play while its stand-in camp is on), glowColor, globeGain (a lit globe's
//    brightness, default 2.67 = blooms white; ≤ ~1 keeps a tinted lamp's hue), globe (with a `model`: glow parts in the GLB frame drawn over the model's
//    glass or flame, lit like a blockout globe), cut (with a `model`: boxes [x0, y0, z0, x1, y1, z1] in the GLB frame whose triangles the build drops, see
//    cutTriangles), collider (height of an invisible walk-collision prism over the blockers: low furniture; a GLB with one stays out of Play's collision),
//    unplaced ('why it has no placement'),
//    npc (an NPC stand-in figure: listed in NPCS, not in ASSETS), roof (an exterior roof: hidden while the focus is inside, see room.outdoor) }
//  category: building | structure | vegetation | rock | prop | linen | story | npc | encounter (blockout colours: interiorBlockout.js, SPEC §6b)
//  shape: blockout parts [{ p, at: [x, y, z], size: [w, h, d], rot: [x, y, z], cat, seg }] in the asset frame (pivot bottom centre, front +z); p = box |
//     cyl | cone | sphere | gable | prism | mound | arc | drape | plane | glow (an emitting part: lamp globes)
//  model: a GLB sample id at real size (pivot bottom centre). Swapping a blockout for its final model = set `model` (+ status 'glb'): one line per asset.
//     A GLB standing in for another id keeps status 'kit' (kit tạm). With a `collider` the model stays out of Play's walk collision (the prisms block).
//     light.fadeWithWall: the halo of a light on a wall-mounted model goes with its wall under the camera wall fade (the window panes fade too).
// ── ADDING A MAP ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//  1. src/env/act1/maps/<mapId>.js exports PLAN, KIT, ASSETS (= assetList(KIT, PLAN)), MONSTERS, NPCS, TEXTURES, VFX (SPEC §6b).
//  2. Register it in INTERIOR_MAPS (scenes/act1Interior.js) and add one line to scenes/index.js:
//       act1X: { label: 'ASHLAR · Act I · base · …', create: (app) => new Act1InteriorScene(app, '<mapId>') },
//  3. node --test scripts/act1-interior.test.mjs (every map in INTERIOR_MAPS is checked) · node scripts/act1-interior-preview.mjs <mapId> (2D plan PNG).
import { smoothParams, textureId as mixTextureId, porosity as mixPorosity, turnMode as mixTurnMode } from '../biomeMix.js';
import { noise, fbm, smoothstep, flicker1f, textureId as dungeonTextureId, porosity as dungeonPorosity, turnMode as dungeonTurnMode } from '../dungeon.js';

export { smoothParams, noise, fbm, smoothstep, flicker1f };

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const INF = 1e20;

/** Layer-library helpers for any ground id (DG_ = the dungeon set, DW_ = Dark Wood, BIO = the biome tiles). */
export const textureId = (id) => (id.startsWith('DG_') ? dungeonTextureId(id) : mixTextureId(id));
export const porosity = (id) => (id.startsWith('DG_') || ['BIO08_nave', 'BIO27_vault', 'BIO07_limestone', 'BIO04_ossuary'].includes(id) ? dungeonPorosity(id) : mixPorosity(id));
export const turnMode = (id) => (id.startsWith('DG_') ? dungeonTurnMode(id) : mixTurnMode(id));

/** Seeded PRNG (mulberry32, the same as kit.rng; copied so this module stays free of THREE). */
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
/** A stable 32-bit seed from a string (FNV-1a). */
export function hashSeed(text) {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	return h >>> 0;
}

// ---- 2D geometry ---------------------------------------------------------------------------------------------------------------------------------
export function signedArea(pts) {
	let s = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		s += a[0] * b[1] - b[0] * a[1];
	}
	return s / 2;
}
/** Even-odd point in polygon (any simple polygon). */
export function inPolygon(pts, x, z) {
	let inside = false;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const [xi, zi] = pts[i];
		const [xj, zj] = pts[j];
		if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
	}
	return inside;
}
/** Distance from (px, pz) to segment a-b, and the projection parameter (metres along a → b). */
export function segmentDistance(px, pz, ax, az, bx, bz) {
	const dx = bx - ax;
	const dz = bz - az;
	const len2 = dx * dx + dz * dz;
	const t = len2 > 1e-12 ? clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1) : 0;
	return { d: Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t: t * Math.sqrt(len2) };
}
/** The distance alone, no object (the per-texel ground masks call it millions of times; same maths as segmentDistance). */
function segDist(px, pz, ax, az, bx, bz) {
	const dx = bx - ax;
	const dz = bz - az;
	const len2 = dx * dx + dz * dz;
	const t = len2 > 1e-12 ? clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1) : 0;
	return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}
function polylineDistance(points, x, z) {
	let best = INF;
	for (let i = 0; i + 1 < points.length; i++) best = Math.min(best, segDist(x, z, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]));
	return best;
}
/** Signed distance to a polygon's boundary (positive inside). */
function polygonDistance(pts, x, z) {
	let best = INF;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		best = Math.min(best, segDist(x, z, a[0], a[1], b[0], b[1]));
	}
	return inPolygon(pts, x, z) ? best : -best;
}
const rectNorm = ([x0, z0, x1, z1]) => [Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)];
const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
const rectDistance = (r, x, z) => {
	const dx = Math.max(r[0] - x, 0, x - r[2]);
	const dz = Math.max(r[1] - z, 0, z - r[3]);
	if (dx > 0 || dz > 0) return -Math.hypot(dx, dz);
	return Math.min(x - r[0], r[2] - x, z - r[1], r[3] - z);
};
/** Bearing (degrees: 0 = north / −z, 90 = east / +x) → offset. */
export const bearing = (deg, r) => [Math.sin(deg * DEG) * r, -Math.cos(deg * DEG) * r];

/** The polygon of a room shape, always with positive signed area (outward normal of edge a → b = (dz, −dx)). */
export function shapePolygon(shape) {
	let pts;
	if (shape.rect) {
		const [x0, z0, x1, z1] = rectNorm(shape.rect);
		pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
	} else if (shape.circle) {
		const [cx, cz, r] = shape.circle;
		const n = shape.segments ?? Math.max(16, Math.round((2 * Math.PI * r) / 2.2));
		pts = Array.from({ length: n }, (_, k) => {
			const a = (k / n) * 2 * Math.PI;
			return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
		});
	} else if (shape.poly) pts = shape.poly.map((p) => [p[0], p[1]]);
	else throw new Error('room shape needs rect, circle or poly');
	if (signedArea(pts) < 0) pts.reverse();
	return pts;
}
const sideOf = (nx, nz) => (Math.abs(nz) >= Math.abs(nx) ? (nz < 0 ? 'n' : 's') : nx > 0 ? 'e' : 'w');

// ---- Euclidean distance transform (Felzenszwalb & Huttenlocher), squared distances in cells ------------------------------------------------------
function edt1d(f, n, d, v, zz) {
	let k = 0;
	v[0] = 0;
	zz[0] = -INF;
	zz[1] = INF;
	for (let q = 1; q < n; q++) {
		let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
		while (s <= zz[k]) {
			k--;
			s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
		}
		k++;
		v[k] = q;
		zz[k] = s;
		zz[k + 1] = INF;
	}
	k = 0;
	for (let q = 0; q < n; q++) {
		while (zz[k + 1] < q) k++;
		d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
	}
}
/** Squared distance (cells) of every cell to the nearest cell where feature(i) is true. */
function edt2d(feature, nx, nz) {
	const out = new Float64Array(nx * nz);
	const n = Math.max(nx, nz);
	const f = new Float64Array(n);
	const d = new Float64Array(n);
	const v = new Int32Array(n);
	const zz = new Float64Array(n + 1);
	for (let j = 0; j < nz; j++) {
		for (let i = 0; i < nx; i++) f[i] = feature(j * nx + i) ? 0 : INF;
		edt1d(f, nx, d, v, zz);
		for (let i = 0; i < nx; i++) out[j * nx + i] = d[i];
	}
	for (let i = 0; i < nx; i++) {
		for (let j = 0; j < nz; j++) f[j] = out[j * nx + i];
		edt1d(f, nz, d, v, zz);
		for (let j = 0; j < nz; j++) out[j * nx + i] = d[j];
	}
	return out;
}

// ---- defaults ------------------------------------------------------------------------------------------------------------------------------------
export const WALL_DEFAULTS = { height: 4, thickness: 0.6, tile: 'BIO27_vault', tone: 1, top: null, module: null, moduleSize: null };
const LIGHT_DEFAULTS = {
	perfection: { color: '#f2ecdf', range: 10, intensity: 30 },
	human: { color: '#e0a050', range: 8, intensity: 18 },
	wall: { color: '#dce6f2', range: 12, intensity: 40 },
};
const UP_AXES = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

/** Distance along a rect's up axis as 0..1 (0 = the bottom edge). */
function upFraction(rect, up, x, z) {
	const [x0, z0, x1, z1] = rect;
	if (up === 'e') return (x - x0) / (x1 - x0);
	if (up === 'w') return (x1 - x) / (x1 - x0);
	if (up === 'n') return (z1 - z) / (z1 - z0);
	return (z - z0) / (z1 - z0);
}
const upLength = (rect, up) => (up === 'e' || up === 'w' ? rect[2] - rect[0] : rect[3] - rect[1]);

/** Stair geometry: rise and run of its treads. */
export function stairInfo(s) {
	const rect = rectNorm(s.rect);
	const rise = (s.y1 - s.y0) / (s.steps + 1);
	const run = upLength(rect, s.up) / s.steps;
	return { rect, rise, run };
}

// ---- compile --------------------------------------------------------------------------------------------------------------------------------------
/**
 * Compile a plan (+ the map's KIT) into the evaluated interior: rooms, the distance field, floor heights, wall runs, placements, blockers, lights,
 * markers, segments, views and helpers. Pure and deterministic; the raster build is a few tens of ms for a 100 m map.
 */
export function compile(plan, kit = {}) {
	const cell = plan.grid ?? 0.25;
	const apron = plan.floor?.apron ?? 12;
	const [bx0, bz0, bx1, bz1] = rectNorm(plan.bounds);
	const margin = apron + 2;
	const gx0 = bx0 - margin;
	const gz0 = bz0 - margin;
	const nx = Math.ceil((bx1 - bx0 + 2 * margin) / cell);
	const nz = Math.ceil((bz1 - bz0 + 2 * margin) / cell);

	// rooms
	const rooms = (plan.rooms ?? []).map((r, index) => {
		const pts = shapePolygon(r.shape);
		const xs = pts.map((p) => p[0]);
		const zs = pts.map((p) => p[1]);
		return { ...r, index, pts, bbox: [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)], wall: { ...WALL_DEFAULTS, ...(plan.wall ?? {}), ...(r.wall ?? {}) }, walled: !!r.walled };
	});
	const byId = Object.fromEntries(rooms.map((r) => [r.id, r]));
	const roomIndexAt = (x, z, skip = -1) => {
		for (const r of rooms) {
			if (r.index === skip) continue;
			if (x < r.bbox[0] || x > r.bbox[2] || z < r.bbox[1] || z > r.bbox[3]) continue;
			if (inPolygon(r.pts, x, z)) return r.index;
		}
		return -1;
	};
	const roomAt = (x, z) => {
		const i = roomIndexAt(x, z);
		return i >= 0 ? rooms[i] : null;
	};
	const roomLevel = (r, x, z) => {
		const y = r.y ?? 0;
		if (typeof y === 'number') return y;
		const [ox, oz] = y.at ?? [0, 0];
		let v = (y.base ?? 0) + (y.gx ?? 0) * (x - ox) + (y.gz ?? 0) * (z - oz);
		if (y.noise) v += y.noise[0] * (fbm(x / y.noise[1] + 3.7, z / y.noise[1] + 1.9, 1) - 0.5) * 2;
		return v;
	};
	const nearestRoom = (x, z) => {
		let best = null;
		let bd = INF;
		for (const r of rooms) {
			const d = -polygonDistance(r.pts, x, z);
			if (d < bd) {
				bd = d;
				best = r;
			}
		}
		return best;
	};

	// stairs, ramps, water
	const stairs = (plan.stairs ?? []).map((s) => ({ ...s, ...stairInfo(s) }));
	const ramps = (plan.ramps ?? []).map((r) => ({ ...r, rect: rectNorm(r.rect) }));
	const waters = (plan.water ?? []).map((w) => ({ ...w, pts: shapePolygon(w.shape) }));
	const stairAt = (x, z) => stairs.find((s) => inRect(s.rect, x, z)) ?? null;
	const stairY = (s, x, z) => {
		const t = clamp(upFraction(s.rect, s.up, x, z), 0, 1);
		const k = Math.min(s.steps - 1, Math.floor(t * s.steps));
		return s.y0 + (k + 1) * s.rise;
	};
	/** Floor height (m) at world xz: stairs > ramps > the first room containing the point > (outside) the nearest room's level. */
	const floorY = (x, z) => {
		const s = stairAt(x, z);
		if (s) return stairY(s, x, z);
		for (const r of ramps) if (inRect(r.rect, x, z)) return lerp(r.y0, r.y1, clamp(upFraction(r.rect, r.up, x, z), 0, 1));
		const room = roomAt(x, z) ?? nearestRoom(x, z);
		return room ? roomLevel(room, x, z) : 0;
	};
	for (const w of waters) w.bbox = [Math.min(...w.pts.map((p) => p[0])), Math.min(...w.pts.map((p) => p[1])), Math.max(...w.pts.map((p) => p[0])), Math.max(...w.pts.map((p) => p[1]))];
	const waterAt = (x, z) => waters.find((w) => x >= w.bbox[0] && x <= w.bbox[2] && z >= w.bbox[1] && z <= w.bbox[3] && inPolygon(w.pts, x, z)) ?? null; // bbox first: the masks ask per texel

	// ---- wall runs, void edges --------------------------------------------------------------------------------------------------------------
	const runs = [];
	const voids = [];
	const edgeKind = (room, side) => {
		const e = room.edge ?? 'wall';
		if (typeof e === 'string') return e;
		return e[side] ?? e.default ?? 'wall';
	};
	for (const A of rooms) {
		const pts = A.pts;
		for (let e = 0; e < pts.length; e++) {
			const a = pts[e];
			const b = pts[(e + 1) % pts.length];
			const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
			if (len < 1e-6) continue;
			const dx = (b[0] - a[0]) / len;
			const dz = (b[1] - a[1]) / len;
			const onx = dz;
			const onz = -dx; // outward normal
			const side = sideOf(onx, onz);
			const kind = edgeKind(A, side);
			const steps = Math.max(1, Math.ceil(len / (cell / 2)));
			const pieces = [];
			for (let s = 0; s < steps; s++) {
				const t0 = (len * s) / steps;
				const t1 = (len * (s + 1)) / steps;
				const tm = (t0 + t1) / 2;
				const qx = a[0] + dx * tm + onx * 0.06;
				const qz = a[1] + dz * tm + onz * 0.06;
				const B = roomIndexAt(qx, qz, A.index);
				let cls;
				if (B >= 0) {
					const bw = rooms[B].walled;
					if (A.walled || bw) cls = A.walled && (!bw || A.index < B) ? 'shared' : 'skip';
					else cls = 'open';
				} else cls = kind === 'void' ? 'void' : kind === 'none' ? 'open' : 'wall';
				const last = pieces[pieces.length - 1];
				if (last && last.cls === cls) last.t1 = t1;
				else pieces.push({ cls, t0, t1 });
			}
			for (const p of pieces) {
				if (p.t1 - p.t0 < 0.05) continue;
				const pa = [a[0] + dx * p.t0, a[1] + dz * p.t0];
				const pb = [a[0] + dx * p.t1, a[1] + dz * p.t1];
				if (p.cls === 'wall' || p.cls === 'shared') {
					runs.push({ id: `${A.id}.${e}.${runs.length}`, a: pa, b: pb, inward: [-onx, -onz], kind: p.cls, offset: p.cls === 'shared' ? 'centre' : 'out', room: A.id, side, style: { ...A.wall, ...(A.wallSides?.[side] ?? {}) }, openings: [] });
				} else if (p.cls === 'void') voids.push({ a: pa, b: pb, out: [onx, onz], room: A.id });
			}
		}
	}
	for (const w of plan.walls ?? []) {
		const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
		const style = { ...WALL_DEFAULTS, ...(plan.wall ?? {}), ...w };
		runs.push({ id: w.id ?? `wall.${runs.length}`, a: [...w.a], b: [...w.b], inward: [-(w.b[1] - w.a[1]) / len, (w.b[0] - w.a[0]) / len], kind: 'partition', offset: 'centre', room: null, style, openings: [] });
	}
	for (const r of runs) {
		r.len = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
		r.dir = [(r.b[0] - r.a[0]) / r.len, (r.b[1] - r.a[1]) / r.len];
		r.thickness = r.style.thickness;
	}
	// openings: cut into the nearest run
	const openings = [];
	for (const o of plan.openings ?? []) {
		let best = null;
		let bd = INF;
		for (const r of runs) {
			const { d, t } = segmentDistance(o.at[0], o.at[1], r.a[0], r.a[1], r.b[0], r.b[1]);
			const off = r.offset === 'out' ? r.thickness / 2 : 0;
			const dd = Math.abs(d - off);
			if (dd < bd && t > -0.01 && t < r.len + 0.01) {
				bd = dd;
				best = { r, t };
			}
		}
		const entry = { ...o, kind: o.kind ?? 'gap', width: o.width ?? 1.4 };
		if (!best || bd > best.r.thickness + 0.6) {
			entry.run = null;
			openings.push(entry);
			continue;
		}
		const half = entry.width / 2;
		entry.run = best.r.id;
		entry.t0 = clamp(best.t - half, 0, best.r.len);
		entry.t1 = clamp(best.t + half, 0, best.r.len);
		best.r.openings.push(entry);
		openings.push(entry);
	}
	for (const r of runs) r.openings.sort((p, q) => p.t0 - q.t0);

	// ---- the walkable raster and the signed distance field ----------------------------------------------------------------------------------
	const walk = new Uint8Array(nx * nz);
	const cellX = (i) => gx0 + (i + 0.5) * cell;
	const cellZ = (j) => gz0 + (j + 0.5) * cell;
	for (const r of rooms) {
		const i0 = Math.max(0, Math.floor((r.bbox[0] - gx0) / cell));
		const i1 = Math.min(nx - 1, Math.ceil((r.bbox[2] - gx0) / cell));
		const j0 = Math.max(0, Math.floor((r.bbox[1] - gz0) / cell));
		const j1 = Math.min(nz - 1, Math.ceil((r.bbox[3] - gz0) / cell));
		for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (!walk[j * nx + i] && inPolygon(r.pts, cellX(i), cellZ(j))) walk[j * nx + i] = 1;
	}
	// centred walls (shared, partitions) cut the floor; their passable openings open it again
	const passable = (o) => o.kind !== 'window';
	for (const r of runs) {
		if (r.offset !== 'centre') continue;
		const h = r.thickness / 2;
		const xs = [r.a[0], r.b[0]];
		const zs = [r.a[1], r.b[1]];
		const i0 = Math.max(0, Math.floor((Math.min(...xs) - h - gx0) / cell));
		const i1 = Math.min(nx - 1, Math.ceil((Math.max(...xs) + h - gx0) / cell));
		const j0 = Math.max(0, Math.floor((Math.min(...zs) - h - gz0) / cell));
		const j1 = Math.min(nz - 1, Math.ceil((Math.max(...zs) + h - gz0) / cell));
		for (let j = j0; j <= j1; j++) {
			for (let i = i0; i <= i1; i++) {
				const { d, t } = segmentDistance(cellX(i), cellZ(j), r.a[0], r.a[1], r.b[0], r.b[1]);
				if (d > h) continue;
				if (r.openings.some((o) => passable(o) && t >= o.t0 && t <= o.t1)) continue;
				walk[j * nx + i] = 0;
			}
		}
	}
	const dIn = edt2d((k) => !walk[k], nx, nz);
	const dOut = edt2d((k) => !!walk[k], nx, nz);
	const df = new Float32Array(nx * nz);
	for (let k = 0; k < nx * nz; k++) df[k] = walk[k] ? Math.max(0, Math.sqrt(dIn[k]) * cell - cell / 2) : -Math.max(0, Math.sqrt(dOut[k]) * cell - cell / 2);
	/** Signed distance (m) to the nearest wall or void edge: positive on the floor, negative outside; bilinear on the raster. */
	const wallDistance = (x, z) => {
		const fx = (x - gx0) / cell - 0.5;
		const fz = (z - gz0) / cell - 0.5;
		if (fx < 0 || fz < 0 || fx >= nx - 1 || fz >= nz - 1) return -margin;
		const i = Math.floor(fx);
		const j = Math.floor(fz);
		const tx = fx - i;
		const tz = fz - j;
		const k = j * nx + i;
		return (df[k] * (1 - tx) + df[k + 1] * tx) * (1 - tz) + (df[k + nx] * (1 - tx) + df[k + nx + 1] * tx) * tz;
	};
	const walkable = (x, z) => wallDistance(x, z) > 0;

	// wall heights: base = the lowest floor beside the run, top = the highest floor + the style's height; each opening keeps the floor level at its sill
	const besideY = (r, t) => {
		const px = r.a[0] + r.dir[0] * t;
		const pz = r.a[1] + r.dir[1] * t;
		const offs = r.offset === 'out' ? [0.15] : [r.thickness / 2 + 0.15, -(r.thickness / 2 + 0.15)];
		return offs.map((s) => floorY(px + r.inward[0] * s, pz + r.inward[1] * s));
	};
	for (const r of runs) {
		let lo = INF;
		let hi = -INF;
		for (let k = 0; k <= 8; k++) {
			for (const y of besideY(r, (r.len * k) / 8)) {
				lo = Math.min(lo, y);
				hi = Math.max(hi, y);
			}
		}
		r.y0 = lo - (r.style.sink ?? 0.2); // walls sink a little into the ground (no gap under a run that follows a stair)
		r.y1 = hi + r.style.height;
		for (const o of r.openings) o.floor = Math.min(...besideY(r, (o.t0 + o.t1) / 2));
	}

	// ---- placements -------------------------------------------------------------------------------------------------------------------------
	const placements = expandPlacements(plan, kit, floorY, wallDistance);
	const blockers = [];
	for (const p of placements) {
		const k = kit[p.asset];
		if (!k || p.void || p.solid === false || k.solid === false) continue;
		const feet = footprints(p, k);
		const touches = feet.some((f) => (f.kind === 'disc' ? wallDistance(f.x, f.z) > -f.r : f.pts.some(([x, z]) => wallDistance(x, z) > 0))) || wallDistance(p.x, p.z) > 0;
		if (!touches) continue;
		p.solid = true;
		for (const f of feet) blockers.push({ ...f, asset: p.asset, index: p.index });
	}
	for (const b of blockers) {
		if (b.kind === 'disc') b.bbox = [b.x - b.r, b.z - b.r, b.x + b.r, b.z + b.r];
		else {
			const xs = b.pts.map((q) => q[0]);
			const zs = b.pts.map((q) => q[1]);
			b.bbox = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)];
		}
	}
	const blockerDistance = (b, x, z) => (b.kind === 'disc' ? Math.hypot(x - b.x, z - b.z) - b.r : -polygonDistance(b.pts, x, z));
	/** Distance (m) to the nearest solid thing: wall, void edge or a solid placement (positive = free). */
	const clearance = (x, z, reach = 4) => {
		let d = wallDistance(x, z);
		for (const b of blockers) {
			if (x < b.bbox[0] - reach || x > b.bbox[2] + reach || z < b.bbox[1] - reach || z > b.bbox[3] + reach) continue;
			d = Math.min(d, blockerDistance(b, x, z));
		}
		return d;
	};

	// ---- lights -----------------------------------------------------------------------------------------------------------------------------
	const lights = [];
	for (const l of plan.lights ?? []) {
		const def = LIGHT_DEFAULTS[l.kind] ?? LIGHT_DEFAULTS.perfection;
		lights.push({ ...def, ...l, x: l.at[0], y: l.at[1], z: l.at[2], real: l.real !== false, source: 'plan' });
	}
	// open-air rooms (courtyards): one soft, unshadowed, still light from high above, covering the room
	for (const r of rooms) {
		if (!r.sky) continue;
		const cx = (r.bbox[0] + r.bbox[2]) / 2;
		const cz = (r.bbox[1] + r.bbox[3]) / 2;
		const reach = Math.hypot(r.bbox[2] - r.bbox[0], r.bbox[3] - r.bbox[1]) / 2;
		const h = r.sky.height ?? 16;
		const y = roomLevel(r, cx, cz);
		lights.push({
			id: `sky:${r.id}`, name: `sky over ${r.name ?? r.id}`, kind: r.sky.kind ?? 'perfection', spot: true, x: cx, y: y + h, z: cz, target: [cx, y, cz], angle: Math.min(1.2, Math.atan(reach / h) + 0.2), penumbra: 1,
			color: r.sky.color ?? '#c9d2dc', range: h * 2.5, intensity: r.sky.intensity ?? 90, real: true, source: 'sky',
		});
	}
	// emitting windows may light the room behind them: a light 0.6 m inside, on the run's inner side
	for (const o of openings) {
		const gl = o.glow?.light;
		if (o.kind !== 'window' || !gl || !o.run) continue;
		const r = runs.find((q) => q.id === o.run);
		const t = (o.t0 + o.t1) / 2;
		const def = LIGHT_DEFAULTS[gl.kind ?? 'perfection'] ?? LIGHT_DEFAULTS.perfection;
		lights.push({ ...def, ...gl, id: `window:${o.id ?? lights.length}`, x: r.a[0] + r.dir[0] * t + r.inward[0] * 0.6, y: (o.floor ?? r.y0) + (o.sill ?? 1) + (o.height ?? 1.6) / 2, z: r.a[1] + r.dir[1] * t + r.inward[1] * 0.6, color: gl.color ?? o.glow.color ?? def.color, real: true, source: 'window' });
	}
	for (const p of placements) {
		const L = kit[p.asset]?.light;
		if (!L || p.light === false) continue;
		const def = LIGHT_DEFAULTS[L.kind] ?? LIGHT_DEFAULTS.perfection;
		const off = L.offset ?? [0, 0];
		const c = Math.cos(p.yaw);
		const s = Math.sin(p.yaw);
		lights.push({
			...def, ...L, id: `${p.asset}#${p.index}`, asset: p.asset, placement: p.index, x: p.x + (off[0] * c + off[1] * s) * p.scale, y: p.y + (L.y ?? 2) * p.scale, z: p.z + (off[1] * c - off[0] * s) * p.scale,
			group: p.lightGroup ?? L.group ?? null, followGroup: p.followGroup ?? L.followGroup ?? null, followFloor: p.followFloor ?? L.followFloor, real: p.light !== 'glow' && !p.void, void: !!p.void, source: 'asset',
		});
	}
	lights.forEach((l, i) => (l.index = i));
	// light groups the scene dims one by one: order = distance to keepNear (the last to go out)
	const lightGroups = {};
	for (const [g, def] of Object.entries(plan.lightGroups ?? {})) {
		const list = lights.filter((l) => l.group === g && !l.void);
		const [kx, kz] = def.keepNear ?? [0, 0];
		list.sort((a, b) => Math.hypot(a.x - kx, a.z - kz) - Math.hypot(b.x - kx, b.z - kz) || a.x - b.x);
		list.forEach((l, i) => (l.order = i));
		lightGroups[g] = { ...def, count: list.length, lights: list.map((l) => l.index) };
	}

	// ---- markers, camps, segments -------------------------------------------------------------------------------------------------------------
	const markers = (plan.markers ?? []).map((m, i) => ({ ...m, index: i }));
	const camps = (plan.camps ?? []).map((c) => ({ count: 1, pack: 'normal', radius: 2.5, mlvl: 5, ...c }));
	const segments = (plan.segments ?? []).map((s) => ({ ...s, y: floorY(s.spawn[0], s.spawn[1]) }));

	// ---- connectivity on the raster (4-neighbour flood fill over cells with `margin` clearance; floor steps ≤ maxStep between cells) ----------
	let freeCache = null;
	let freeMargin = -1;
	const freeGrid = (m) => {
		if (freeCache && freeMargin === m) return freeCache;
		const free = new Uint8Array(nx * nz);
		for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
			const k = j * nx + i;
			if (df[k] < m) continue;
			if (clearance(cellX(i), cellZ(j), 1) >= m) free[k] = 1;
		}
		freeCache = free;
		freeMargin = m;
		return free;
	};
	const cellOf = (x, z) => [Math.floor((x - gx0) / cell), Math.floor((z - gz0) / cell)];
	/** Flood fill from (x, z) over free cells; returns a tester reach(x, z) and the cell count. */
	const flood = (x, z, m = 0.35, maxStep = 0.3) => {
		const free = freeGrid(m);
		const seen = new Uint8Array(nx * nz);
		const ys = new Float32Array(nx * nz);
		const [si, sj] = cellOf(x, z);
		const start = sj * nx + si;
		if (si < 0 || sj < 0 || si >= nx || sj >= nz || !free[start]) return { ok: false, cells: 0, reach: () => false };
		const queue = [start];
		seen[start] = 1;
		ys[start] = floorY(cellX(si), cellZ(sj));
		for (let q = 0; q < queue.length; q++) {
			const k = queue[q];
			const i = k % nx;
			const j = (k / nx) | 0;
			for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const ni = i + di;
				const nj = j + dj;
				if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
				const nk = nj * nx + ni;
				if (seen[nk] || !free[nk]) continue;
				const y = floorY(cellX(ni), cellZ(nj));
				if (Math.abs(y - ys[k]) > maxStep) continue;
				seen[nk] = 1;
				ys[nk] = y;
				queue.push(nk);
			}
		}
		return {
			ok: true,
			cells: queue.length,
			reach: (px, pz) => {
				const [i, j] = cellOf(px, pz);
				if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
				for (const [di, dj] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
					const ii = i + di;
					const jj = j + dj;
					if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && seen[jj * nx + ii]) return true;
				}
				return false;
			},
		};
	};
	/** Free width across the direction (dx, dz) at a point: scan both ways until something solid. */
	const freeWidth = (x, z, dx, dz, limit = 12) => {
		const px = -dz;
		const pz = dx;
		const scan = (sign) => {
			let s = 0;
			for (; s < limit; s += 0.05) if (clearance(x + px * sign * s, z + pz * sign * s) < 0) break;
			return s;
		};
		return scan(1) + scan(-1);
	};

	const model = {
		plan, kit, cell, apron, bounds: [bx0, bz0, bx1, bz1], raster: { x0: gx0, z0: gz0, nx, nz, cell, walk, df },
		rooms, byId, runs, voids, openings, stairs, ramps, waters, placements, blockers, lights, lightGroups, markers, camps, segments,
		roomAt, roomIndexAt, floorY, waterAt, wallDistance, walkable, clearance, flood, freeWidth, stairAt,
		/** Water depth (m, 0 = dry) at world xz. */
		waterDepth: (x, z) => {
			const w = waterAt(x, z);
			return w ? Math.max(0, w.level - floorY(x, z)) : 0;
		},
	};
	model.makeMasks = (sp) => makeMasks(model, sp);
	model.splat = splatRect(model);
	model.route = plan.route ?? [];
	model.routeSamples = (step = 0.5) => polylineSamples(model.route, step);
	return model;
}

// ---- placements ----------------------------------------------------------------------------------------------------------------------------------
/**
 * Every placement of the plan as { asset, x, z, y, yaw (rad), scale, void, solid, light, name, tag, src, index }. `floorY` / `wallDistance` may be
 * omitted (the asset counts of the report need no floor): y is then 0 and scatters keep their requested count.
 */
export function expandPlacements(plan, kit = {}, floorY = () => 0, wallDistance = null) {
	const out = [];
	const add = (asset, x, z, yawDeg, extra = {}) => {
		if (extra.except?.some((r) => inRect(rectNorm(r), x, z))) return;
		const scale = extra.scale ?? 1;
		out.push({
			asset, x, z, y: extra.y ?? floorY(x, z), yaw: (yawDeg ?? 0) * DEG, scale, void: !!extra.void, solid: extra.solid, light: extra.light, lightGroup: extra.lightGroup ?? null,
			followGroup: extra.followGroup ?? null, followFloor: extra.followFloor, name: extra.name ?? null, tag: extra.tag ?? null, src: extra.src ?? 'structure', index: out.length,
		});
	};
	for (const s of plan.structures ?? []) add(s.asset, s.at[0], s.at[1], s.yaw, { ...s, src: 'structure' });
	for (const r of plan.rows ?? []) {
		const n = r.count ?? 2;
		const rand = rng(hashSeed(`${plan.id}:${r.asset}:${r.from}:${r.to}`));
		const [jp, jy] = r.jitter ?? [0, 0]; // position (m) and yaw (°) jitter
		for (let k = 0; k < n; k++) {
			const t = n === 1 ? 0.5 : k / (n - 1);
			const ox = (rand() - 0.5) * 2 * jp;
			const oz = (rand() - 0.5) * 2 * jp;
			const oy = (rand() - 0.5) * 2 * jy;
			const light = r.realEvery ? (k % r.realEvery === (r.realOffset ?? 0) % r.realEvery ? r.light : 'glow') : r.light; // a real PointLight every n-th lamp, the others glow only
			add(r.asset, lerp(r.from[0], r.to[0], t) + ox, lerp(r.from[1], r.to[1], t) + oz, (r.yaw ?? 0) + oy, { ...r, light, src: 'row', name: null });
		}
	}
	for (const r of plan.rings ?? []) {
		const n = r.count ?? 8;
		const from = r.from ?? 0;
		const to = r.to ?? from + 360;
		for (let k = 0; k < n; k++) {
			if (r.skip?.includes(k)) continue;
			const b = from + ((to - from) * k) / n;
			const [ox, oz] = bearing(b, r.r);
			const face = r.face ?? 'in';
			const yaw = (face === 'in' ? 180 - b : face === 'out' ? -b : 90 - b) + (r.yaw ?? 0);
			add(r.asset, r.center[0] + ox, r.center[1] + oz, yaw, { ...r, src: 'ring', name: null, bearing: b });
		}
	}
	for (const s of plan.scatters ?? []) {
		const rand = rng(s.seed ?? hashSeed(`${plan.id}:${s.asset}:scatter`));
		const rect = s.rect ? rectNorm(s.rect) : null;
		const want = s.count ?? 10;
		if (!wallDistance) {
			for (let k = 0; k < want; k++) add(s.asset, 0, 0, 0, { src: 'scatter' });
			continue;
		}
		const area = rect ?? rectNorm(plan.bounds);
		const pts = [];
		for (let tries = 0; tries < want * 40 && pts.length < want; tries++) {
			const x = lerp(area[0], area[2], rand());
			const z = lerp(area[1], area[3], rand());
			if (wallDistance(x, z) < (s.keep ?? 0.5)) continue;
			if (pts.some((q) => Math.hypot(q[0] - x, q[1] - z) < (s.gap ?? 1))) continue;
			pts.push([x, z]);
			const [a, b] = s.scale ?? [1, 1];
			add(s.asset, x, z, rand() * 360, { scale: lerp(a, b, rand()), src: 'scatter', solid: s.solid, void: s.void });
		}
	}
	return out;
}

/** Footprint of a placement: an oriented rectangle (or a disc for round assets) from the KIT size × scale, or `foot` [w, d] when the base is smaller. */
export function footprint(p, k) {
	const [w, , d] = k.foot ? [k.foot[0], 0, k.foot[1]] : k.size ?? [1, 1, 1];
	if (k.round) return { kind: 'disc', x: p.x, z: p.z, r: (Math.max(w, d) / 2) * p.scale };
	const c = Math.cos(p.yaw);
	const s = Math.sin(p.yaw);
	const hw = (w / 2) * p.scale;
	const hd = (d / 2) * p.scale;
	const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [p.x + lx * c + lz * s, p.z - lx * s + lz * c]);
	if (signedArea(pts) < 0) pts.reverse();
	return { kind: 'poly', pts };
}

/** The walk blockers of a placement: KIT `blockers` ([{ at: [x, z], r } | { rect: [x0, z0, x1, z1] }] in the asset frame, e.g. only the posts of a curtain pair), else its footprint. */
export function footprints(p, k) {
	if (!k.blockers?.length) return [footprint(p, k)];
	const c = Math.cos(p.yaw);
	const s = Math.sin(p.yaw);
	const at = (lx, lz) => [p.x + lx * p.scale * c + lz * p.scale * s, p.z - lx * p.scale * s + lz * p.scale * c];
	return k.blockers.map((b) => {
		if (b.rect) {
			const [x0, z0, x1, z1] = b.rect;
			const pts = [at(x0, z0), at(x1, z0), at(x1, z1), at(x0, z1)];
			if (signedArea(pts) < 0) pts.reverse();
			return { kind: 'poly', pts };
		}
		const [x, z] = at(b.at[0], b.at[1]);
		return { kind: 'disc', x, z, r: b.r * p.scale };
	});
}

/**
 * The triangles of a GLB mesh that survive its KIT `cut` boxes ([x0, y0, z0, x1, y1, z1] in the asset frame, GLB metres): a triangle whose centroid lies
 * in a box is dropped, e.g. the back and end walls a Tripo cloister bay modelled in that would close the walk behind its arches; so is a zero-area one (it
 * draws nothing, but Play's wall push-out would see its footprint as a wall segment). Pure (the build applies it to the instanced geometry, so the drawn
 * model and Play's collision agree; the tests apply it to the GLB file).
 * @param {ArrayLike<number>} positions xyz per vertex
 * @param {ArrayLike<number> | null} index three vertex indices per triangle (null: non-indexed)
 * @returns {number[]} the kept triangles' vertex indices
 */
export function cutTriangles(positions, index, boxes) {
	const kept = [];
	const n = index ? index.length : positions.length / 3;
	for (let t = 0; t + 2 < n; t += 3) {
		const tri = index ? [index[t], index[t + 1], index[t + 2]] : [t, t + 1, t + 2];
		const [a, b, d] = tri.map((v) => [positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]]);
		const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
		const w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
		if (Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) < 2e-8) continue; // zero area
		const c = [0, 1, 2].map((i) => (a[i] + b[i] + d[i]) / 3);
		if (boxes.some(([x0, y0, z0, x1, y1, z1]) => c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1 && c[2] >= z0 && c[2] <= z1)) continue;
		kept.push(...tri);
	}
	return kept;
}

/** Instance counts per asset id: { [id]: { count, inVoid } } (no floor needed). */
export function countPlacements(plan, kit = {}) {
	const counts = {};
	for (const p of expandPlacements(plan, kit)) {
		const c = (counts[p.asset] ??= { count: 0, inVoid: 0 });
		c.count++;
		if (p.void) c.inVoid++;
	}
	return counts;
}

/** The SPEC §6b ASSETS list of a map: every KIT entry with its placement count (0 = declared, not placed yet: keep the reason in `note`); status 'glb' when
 * it has a `model`, except a GLB standing in for another id (KIT status 'kit': kit tạm). Monster blockouts
 * (KIT `monster: true`) are left out: they are reported in the map's MONSTERS; so are NPC stand-ins (KIT `npc: true`): the map's NPCS. */
export function assetList(kit, plan) {
	const counts = countPlacements(plan, kit);
	return Object.entries(kit).filter(([, k]) => !k.monster && !k.npc).map(([id, k]) => ({
		id, name: k.name, category: k.category, size: k.size, count: counts[id]?.count ?? k.count ?? 0, status: k.model && k.status !== 'kit' ? 'glb' : k.status ?? 'blockout', source: k.source ?? 'LD only, no concept',
		segment: k.segment ?? null, note: [k.note, counts[id]?.inVoid ? `${counts[id].inVoid} of them drawn in the void past the floor` : null].filter(Boolean).join(' · '),
	}));
}

// ---- splat, masks ---------------------------------------------------------------------------------------------------------------------------------
/** The LayerSplat's square: the bounds + the apron, `ppm` texels per metre (capped at 1024). */
function splatRect(model) {
	const [x0, z0, x1, z1] = model.bounds;
	const pad = model.apron;
	const extent = Math.max(x1 - x0, z1 - z0) + 2 * pad;
	const cx = (x0 + x1) / 2;
	const cz = (z0 + z1) / 2;
	const res = Math.min(1024, Math.round((extent * (model.plan.floor?.ppm ?? 6)) / 16) * 16);
	return { originX: cx - extent / 2, originZ: cz - extent / 2, extent, res, cx, cz };
}

/**
 * Ground masks (x, z, out): out[0..6] = coverage of floor layers 1..7 over those below, out[7] = wetness (the LayerSplat.fill contract). `sp` = smoothParams(slider):
 * the soft widths of the painters grow with the smoothness (the user prefers wide, soft blends).
 */
export function makeMasks(model, sp) {
	const layers = model.plan.floor?.layers ?? [];
	const slot = Object.fromEntries(layers.map((l, i) => [l.id, i - 1]));
	const k = 0.5 + (1.5 * sp.blurM) / 0.95;
	const around = new Map();
	const painters = (model.plan.floor?.paint ?? []).map((p) => {
		if (p.kind === 'around' && !around.has(p.asset)) around.set(p.asset, model.placements.filter((q) => q.asset === p.asset && !q.void));
		return { ...p, amount: p.amount ?? 1, target: p.layer ? slot[p.layer] : null, clears: (p.clear ?? []).map((id) => slot[id]).filter((v) => v >= 0), rooms: p.rooms?.map((id) => model.byId[id]).filter(Boolean), nrect: p.rect ? rectNorm(p.rect) : null };
	});
	return (x, z, out) => {
		const d = model.wallDistance(x, z);
		const n1 = fbm(x * 0.31 + 4.1, z * 0.31 + 1.7, sp.detail);
		for (const p of painters) {
			let c = 0;
			switch (p.kind) {
				case 'room': {
					const soft = (p.soft ?? 1.5) * k;
					const reach = soft / 2 + Math.abs(p.noise ?? 0.6) / 2 + 1e-3; // a room farther than this (its bbox already) gives c = 0: skipped, same result
					let best = -INF;
					for (const r of p.rooms ?? []) if (rectDistance(r.bbox, x, z) >= -reach) best = Math.max(best, polygonDistance(r.pts, x, z));
					c = smoothstep(-soft / 2, soft / 2, best + (n1 - 0.5) * (p.noise ?? 0.6));
					break;
				}
				case 'edge':
					c = d < -(p.outside ?? 1) ? 0 : 1 - smoothstep(0, (p.width ?? 1.5) * k, d + (n1 - 0.5) * (p.noise ?? 1.2));
					break;
				case 'void':
					c = smoothstep(-0.2, (p.width ?? 2) * k, -d + (n1 - 0.5) * (p.noise ?? 0.8));
					break;
				case 'path':
					c = 1 - smoothstep((p.width ?? 2) / 2, (p.width ?? 2) / 2 + (p.soft ?? 1) * k, polylineDistance(p.points, x, z) + (n1 - 0.5) * (p.noise ?? 0.5));
					break;
				case 'disc':
					c = 1 - smoothstep(p.r - ((p.soft ?? 1) * k) / 2, p.r + ((p.soft ?? 1) * k) / 2, Math.hypot(x - p.at[0], z - p.at[1]) + (n1 - 0.5) * (p.noise ?? 0.4));
					break;
				case 'rect':
					c = smoothstep(-((p.soft ?? 1) * k) / 2, ((p.soft ?? 1) * k) / 2, rectDistance(p.nrect, x, z) + (n1 - 0.5) * (p.noise ?? 0.4));
					break;
				case 'around': {
					let best = INF;
					for (const q of around.get(p.asset)) best = Math.min(best, Math.hypot(x - q.x, z - q.z));
					c = 1 - smoothstep(p.r - ((p.soft ?? 1.2) * k) / 2, p.r + ((p.soft ?? 1.2) * k) / 2, best + (n1 - 0.5) * (p.noise ?? 0.5));
					break;
				}
				case 'noise': {
					let inside = 1;
					if (p.rooms) {
						let best = -INF;
						for (const r of p.rooms) if (rectDistance(r.bbox, x, z) >= -1) best = Math.max(best, polygonDistance(r.pts, x, z)); // farther rooms give 0: skipped
						inside = smoothstep(-1, 1, best);
					}
					c = inside > 0 ? smoothstep(p.lo ?? 0.55, p.hi ?? 0.7, fbm(x * (p.scale ?? 0.2) + 11.3, z * (p.scale ?? 0.2) + 6.4, sp.detail)) * inside : 0;
					break;
				}
				default:
					c = 0;
			}
			c = clamp(c * p.amount, 0, 1);
			if (!(c > 0)) continue;
			if (p.wet !== undefined) out[7] = Math.max(out[7], c * p.wet);
			else if (p.target >= 0) out[p.target] = Math.max(out[p.target], c);
			for (const t of p.clears) out[t] *= 1 - c;
		}
		const w = model.waterDepth(x, z);
		if (w > 0) out[7] = Math.max(out[7], smoothstep(0, 0.1, w));
	};
}

function polylineSamples(points, step) {
	const out = [];
	let next = 0;
	let start = 0;
	for (let i = 0; i + 1 < points.length; i++) {
		const [ax, az] = points[i];
		const [bx, bz] = points[i + 1];
		const len = Math.hypot(bx - ax, bz - az);
		for (; next < start + len - 1e-9; next += step) {
			const s = next - start;
			out.push([ax + ((bx - ax) * s) / len, az + ((bz - az) * s) / len, i]);
		}
		start += len;
	}
	if (points.length) out.push([...points[points.length - 1], points.length - 2]);
	return out;
}

// ---- wall pieces (shared by the THREE build and the 2D plan) --------------------------------------------------------------------------------------
/**
 * The solid pieces of a run after its openings: [{ t0, t1, y0, y1, kind: 'solid' | 'lintel' | 'sill' | 'arch', opening }] with heights relative to the
 * run's base (y0 of the run). An arch keeps its whole head as one 'arch' piece (the build uses kit.archPanel).
 */
export function runPieces(run) {
	const H = run.y1 - run.y0;
	const pieces = [];
	let t = 0;
	for (const o of run.openings) {
		const jamb = o.kind === 'arch' ? Math.max(0, Math.min(o.jamb ?? 0.35, o.t0 - t, run.len - o.t1)) : 0; // an arch panel carries its own jambs
		const a = o.t0 - jamb;
		const b = o.t1 + jamb;
		if (a > t + 1e-3) pieces.push({ t0: t, t1: a, y0: 0, y1: H, kind: 'solid' });
		const base = Math.max(0, (o.floor ?? run.y0) - run.y0);
		if (o.kind === 'door') pieces.push({ t0: a, t1: b, y0: base + (o.height ?? 2.4), y1: H, kind: 'lintel', opening: o });
		else if (o.kind === 'arch') pieces.push({ t0: a, t1: b, y0: base, y1: H, kind: 'arch', opening: o, openingWidth: o.t1 - o.t0 });
		else if (o.kind === 'window') {
			pieces.push({ t0: a, t1: b, y0: 0, y1: base + (o.sill ?? 1), kind: 'sill', opening: o });
			pieces.push({ t0: a, t1: b, y0: base + (o.sill ?? 1) + (o.height ?? 1.6), y1: H, kind: 'lintel', opening: o });
		}
		if (base > 1e-3 && o.kind !== 'window') pieces.push({ t0: a, t1: b, y0: 0, y1: base, kind: 'sill', opening: o }); // a stair or a raised floor under the opening
		t = Math.max(t, b);
	}
	if (run.len > t + 1e-3) pieces.push({ t0: t, t1: run.len, y0: 0, y1: H, kind: 'solid' });
	return pieces.filter((p) => p.y1 > p.y0 + 1e-3 && p.t1 > p.t0 + 1e-3);
}

/**
 * Target level (0..1) of a compiled light, given the remaining count of the dimmable groups ({ [group]: n }; a missing group = all lit): a group's light
 * is on while its order < n; a light with followGroup dims with that group (followFloor + (1 − followFloor) · n / N, floor default 0.15); others stay 1.
 */
export function lightTarget(model, L, remaining = {}) {
	const g = L.group && model.lightGroups[L.group];
	if (g && L.order !== undefined) return (remaining[L.group] ?? g.count) > L.order ? 1 : 0;
	const f = L.followGroup && model.lightGroups[L.followGroup];
	if (f?.count) {
		const n = clamp(remaining[L.followGroup] ?? f.count, 0, f.count);
		const floor = L.followFloor ?? 0.15;
		return floor + (1 - floor) * (n / f.count);
	}
	return 1;
}

// ---- checks ---------------------------------------------------------------------------------------------------------------------------------------
/** Point / spot lights the scene renders: the plan's real lights + the scene's own hero light (scenes/act1Interior.js) unless plan.heroLight === false. */
export const lightBudget = (model) => model.lights.filter((l) => l.real).length + (model.plan.heroLight === false ? 0 : 1);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
function walkNumbers(value, path, out) {
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) out.push(path);
	} else if (Array.isArray(value)) value.forEach((v, i) => walkNumbers(v, `${path}[${i}]`, out));
	else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walkNumbers(v, `${path}.${k}`, out);
}

/** Plan checks: [{ level: 'error' | 'warn', msg }]. The tests assert there is no error. */
export function validate(model) {
	const issues = [];
	const err = (msg) => issues.push({ level: 'error', msg });
	const warn = (msg) => issues.push({ level: 'warn', msg });
	const { plan, kit } = model;
	const [x0, z0, x1, z1] = model.bounds;
	const inB = (x, z, pad = 0) => x >= x0 - pad && x <= x1 + pad && z >= z0 - pad && z <= z1 + pad;
	const bad = [];
	walkNumbers(plan, 'plan', bad);
	walkNumbers(kit, 'kit', bad);
	for (const b of bad) err(`not a finite number: ${b}`);
	if (Math.max(x1 - x0, z1 - z0) > 256) err(`the plan is ${Math.max(x1 - x0, z1 - z0)} m long (≤ 256 m)`);
	if (!(model.cell > 0 && model.cell <= 1)) err(`grid ${model.cell} m (0 < grid ≤ 1)`);
	const layers = plan.floor?.layers ?? [];
	if (layers.length < 2 || layers.length > 8) err(`${layers.length} floor layers (2..8)`);
	if (new Set(layers.map((l) => l.id)).size !== layers.length) err('a floor layer is listed twice');
	for (const p of plan.floor?.paint ?? []) if (p.layer && !layers.some((l) => l.id === p.layer)) err(`painter ${p.kind} paints ${p.layer}, which is not a floor layer`);
	for (const r of model.rooms) {
		if (r.bbox[0] < x0 - 0.01 || r.bbox[2] > x1 + 0.01 || r.bbox[1] < z0 - 0.01 || r.bbox[3] > z1 + 0.01) err(`room ${r.id} leaves the bounds`);
		if (Math.abs(signedArea(r.pts)) < 1) err(`room ${r.id} has no area`);
	}
	const walled = model.rooms.filter((r) => r.walled);
	for (const a of walled) for (const b of model.rooms) {
		if (a === b) continue;
		const probe = [[(a.bbox[0] + a.bbox[2]) / 2, (a.bbox[1] + a.bbox[3]) / 2], ...a.pts.map(([x, z]) => [lerp(x, (a.bbox[0] + a.bbox[2]) / 2, 0.1), lerp(z, (a.bbox[1] + a.bbox[3]) / 2, 0.1)])];
		if (probe.some(([x, z]) => inPolygon(b.pts, x, z))) err(`walled room ${a.id} overlaps room ${b.id} (walled rooms may only touch)`);
	}
	for (const s of model.stairs) {
		if (s.rise > 0.2 + 1e-6) err(`stair ${s.id}: rise ${s.rise.toFixed(3)} m (≤ 0.2)`);
		if (Math.abs(s.rise) / s.run > 0.55 + 1e-6) err(`stair ${s.id}: rise / run ${(s.rise / s.run).toFixed(2)} (≤ 0.55, the Play nav grid steps 0.6 m per 1 m)`);
	}
	for (const r of model.ramps) {
		const slope = Math.abs(r.y1 - r.y0) / Math.max(1e-6, upLength(r.rect, r.up));
		if (slope > 0.55 + 1e-6) err(`ramp ${r.id}: slope ${slope.toFixed(2)} (≤ 0.55, the Play nav grid steps 0.6 m per 1 m)`);
	}
	for (const o of model.openings) if (!o.run) err(`opening ${o.id ?? o.at} is not on a wall run`);
	const ids = new Set(Object.keys(kit));
	for (const p of model.placements) {
		if (!ids.has(p.asset)) err(`placement of ${p.asset}: not in the map's KIT`);
		if (!finite(p.x) || !finite(p.z) || !finite(p.y)) err(`placement ${p.asset}#${p.index} is not finite`);
		else if (!inB(p.x, p.z, model.apron + 2)) err(`placement ${p.asset}#${p.index} at (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) leaves the bounds + apron`);
	}
	const placed = new Set(model.placements.map((p) => p.asset));
	for (const [id, k] of Object.entries(kit)) {
		if (!k.name || !k.category || !Array.isArray(k.size) || k.size.length !== 3) err(`KIT ${id}: needs name, category and size [w, h, d]`);
		if (!['glb', 'kit', 'procedural', 'blockout'].includes(k.model ? 'glb' : k.status ?? 'blockout')) err(`KIT ${id}: unknown status ${k.status}`);
		if (!placed.has(id) && !k.unplaced) err(`KIT ${id} is declared but never placed (place it, or give unplaced: 'reason')`);
		if (!k.shape && !k.model && (k.status ?? 'blockout') === 'blockout' && placed.has(id)) warn(`KIT ${id}: no blockout shape, a plain box is drawn`);
	}
	if (model.lights.filter((l) => l.shadow).length > 1) err('more than one shadowed light (one shadow map: the WebGPU sampler budget)');
	const budget = lightBudget(model);
	if (budget > 16) warn(`${budget} point / spot lights incl. the scene's hero light (forward shading: keep ≤ 16)`);
	for (const l of model.lights) {
		if (l.followGroup && !model.lightGroups[l.followGroup]) err(`light ${l.id} follows "${l.followGroup}", which is not a light group`);
		if (l.followFloor !== undefined && !(l.followFloor >= 0 && l.followFloor <= 1)) err(`light ${l.id}: followFloor ${l.followFloor} (0..1)`);
	}
	for (const l of model.lights) if (!inB(l.x, l.z, model.apron + 2)) err(`light ${l.id} leaves the bounds`);
	for (const m of model.markers) {
		if (!m.at || !inB(m.at[0], m.at[1])) err(`marker ${m.kind} ${m.label ?? ''} lies outside the bounds`);
		if (m.to && !inB(m.to[0], m.to[1], model.apron)) err(`marker ${m.kind} ${m.label ?? ''}: its 'to' lies outside the bounds`);
		if (m.points?.some(([x, z]) => !inB(x, z))) err(`marker ${m.kind} ${m.label ?? ''}: a route point lies outside the bounds`);
	}
	for (const r of plan.rain?.dry ?? []) if (!Array.isArray(r) || r.length !== 4) err('plan.rain.dry: each dry area is a rect [x0, z0, x1, z1]');
	for (const c of model.camps) if (!model.walkable(c.at[0], c.at[1])) err(`camp ${c.id} at (${c.at}) is not on the floor`);
	if (!model.segments.length) err('no segment (spawn)');
	for (const s of model.segments) {
		if (!inB(s.spawn[0], s.spawn[1])) err(`segment ${s.id}: spawn outside the bounds`);
		if (model.clearance(s.spawn[0], s.spawn[1]) < 0.35) err(`segment ${s.id}: spawn has ${model.clearance(s.spawn[0], s.spawn[1]).toFixed(2)} m clearance (≥ 0.35)`);
	}
	if (plan.lightGroups) for (const [g, def] of Object.entries(model.lightGroups)) if (!def.count) err(`light group ${g} has no light`);
	for (const [g, def] of Object.entries(model.lightGroups)) if (def.ambient !== undefined && !(def.ambient >= 0 && def.ambient <= 1)) err(`light group ${g}: ambient ${def.ambient} (0..1)`);
	return issues;
}

// ---- the 2D plan (scripts/act1-interior-preview.mjs) ------------------------------------------------------------------------------------------------
/** Everything the plan drawing needs, as plain data. */
export function planData(model, { step = 0.5 } = {}) {
	const [x0, z0, x1, z1] = model.bounds;
	const pad = model.apron;
	const cells = [];
	for (let z = z0 - pad; z < z1 + pad; z += step) {
		for (let x = x0 - pad; x < x1 + pad; x += step) {
			const d = model.wallDistance(x + step / 2, z + step / 2);
			if (d > 0) cells.push([x, z, +model.floorY(x + step / 2, z + step / 2).toFixed(2), model.waterDepth(x + step / 2, z + step / 2) > 0 ? 1 : 0]);
			else if (d > -pad) cells.push([x, z, null, 2]);
		}
	}
	return {
		id: model.plan.id, name: model.plan.name, label: model.plan.label, bounds: model.bounds, step, apron: pad, cells,
		rooms: model.rooms.map((r) => ({ id: r.id, name: r.name, pts: r.pts, y: typeof r.y === 'number' ? r.y : r.y?.base ?? 0, edge: r.edge ?? 'wall', walled: r.walled, sky: !!r.sky })),
		runs: model.runs.map((r) => ({ id: r.id, a: r.a, b: r.b, kind: r.kind, offset: r.offset, inward: r.inward, thickness: r.thickness, tile: r.style.tile, openings: r.openings.map((o) => ({ t0: o.t0, t1: o.t1, kind: o.kind })), dir: r.dir, len: r.len })),
		voids: model.voids,
		stairs: model.stairs.map((s) => ({ id: s.id, rect: s.rect, up: s.up, steps: s.steps, y0: s.y0, y1: s.y1 })),
		placements: model.placements.map((p) => {
			const k = model.kit[p.asset] ?? {};
			return { asset: p.asset, name: k.name, category: k.category, x: p.x, z: p.z, yaw: p.yaw, void: p.void, solid: !!p.solid, foot: footprint(p, k), blockers: p.solid ? footprints(p, k) : [], roof: !!k.roof };
		}),
		lights: model.lights.map((l) => ({ id: l.id, kind: l.kind, x: l.x, z: l.z, y: l.y, range: l.range, real: l.real, group: l.group ?? null, order: l.order ?? null, void: !!l.void })),
		markers: model.markers, camps: model.camps, segments: model.segments, route: model.route, views: model.plan.views,
	};
}

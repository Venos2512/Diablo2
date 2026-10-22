// Map modules and the fast-load rules of a generated biome map (art direction 12 §4.14).
//
// A generated map is cut into square modules (16 m) on the plan's grid. Every item the engine placed (a placement, a shrub, a
// grass tuft, a ground-paint disc, a light) belongs to exactly ONE module: the one that contains its footprint centre (or its
// x/z). The modules are loaded in order — ring 0 is the first screen around the hero's start, the rest by distance — so the
// first frame needs only the kits of ring 0 and everything else streams in behind it. MODULE_RULES are the budgets a map has
// to meet to load that way; checkModules() reports them in the same shape as the engine's own checks.
//
// Renderer-free (no three, no DOM, no fs): portable to ashlar/gametest like the engine. The engine itself is not touched; this file
// only reads its result.
import { DEFAULT_OPTIONS, LAYOUT_RULES, obbFrom } from './biomeLayout.js';
import { codeHash, fileHash, hashPair } from './codeHash.js';

/**
 * Bump when the SHAPE of a bake changes (the typed-array encoding, the result's fields the restore expects): every baked / cached
 * map is then unreadable and is generated again. A changed engine or generator CODE no longer needs a bump: the keys hash
 * the source text of the engine / generator files (`codeHash`, passed to `layoutKey` / `genKey` as `code`), so an edit of biomeLayout.js,
 * biomePlacement.js, biomeCatalog.js, biomeLayoutDemo.js (and planGen*.js, mapModules.js for generated maps) gives a new key by itself. AD 12 §4.14.4.
 */
export const MAP_FORMAT_VERSION = 1;

/**
 * The files whose source text goes into the keys (paths from `src/`). `layout`: what a layout result depends on; `generator`: added
 * for generated maps (planSource 'seed'); `splat`: the painter, for the splat key. The scene imports the hash of exactly these files at
 * build time (`?hash`, env/mapCodeText.js) and node scripts hash them from disk (scripts/map-tools.mjs); scripts/map-modules.test.mjs checks the
 * two lists and hashes agree.
 */
export const CODE_FILES = Object.freeze({
	layout: Object.freeze(['env/biomeLayout.js', 'env/biomePlacement.js', 'env/biomeCatalog.js', 'env/biomeLayoutDemo.js']),
	generator: Object.freeze(['env/planGen.js', 'env/planGenZones.js', 'env/mapModules.js']), // mapModules.js: MODULE_RULES, splitModules, loadOrder, checkModules and mapStart decide which attempt is accepted
	splat: Object.freeze(['scenes/biomeLayout.js', 'env/kit.js', 'env/terrain.js']),
});

/** Kit key (as the catalog's assets name it) → library sample id. The scene loads kits by these ids; node scripts read the files. */
export const KIT_SAMPLES = Object.freeze({
	fence: 'kit-wooden-fence', palisade: 'kit-palisade', tents: 'kit-tents', tentsB: 'kit-tents-b', shrubs: 'kit-shrubs',
	kitchen: 'kit-camp-kitchen', storage: 'kit-camp-storage', training: 'kit-camp-training', crafts: 'kit-camp-crafts', lighting: 'kit-camp-lighting',
	banners: 'kit-camp-banners', seating: 'kit-camp-seating', shrine: 'kit-camp-shrine', animals: 'kit-camp-animals', clutter: 'kit-camp-clutter',
	stations: 'kit-camp-stations', rocks: 'kit-moor-rocks', mossy: 'kit-mossy-rocks', corpses: 'kit-buried-corpses', deadTrees: 'kit-dead-trees', burnedTrees: 'kit-burned-trees',
});

/**
 * The fast-load budgets (AD 12 §4.14). Per-module and per-map numbers were calibrated on a 24-seed sweep of the demo plan
 * (seed = plan seed, then 2…24; start = main path + 14 m; 16 m modules; kit sizes = the GLB files): max observed + ~20 %,
 * rounded up. The two start-ring numbers are TARGETS for a fast first frame, not calibrated ones. Sweep numbers are next to each.
 */
export const MODULE_RULES = Object.freeze({
	size: 16, // m. = the scene's instancing cell (`cells: 16`), so a module never splits a cell; ≈ a D2 room of 8 tiles ≈ 18.8 m at 1 Sub ≈ 0.47 m
	startRadius: 20, // m. ring 0 = modules within this of the hero's start: half the screen ground diagonal (≈ 16 m, AD 12 §4.3) + ≈ 4 m of running
	moduleKits: 9, // distinct kits one module needs. sweep 5–7 (max 7) + 20 % = 8.4 → 9
	modulePieces: 18, // placements + shrubs of one module (the StaticBatch / instance work of one build). sweep 9–15 (max 15) + 20 % = 18
	moduleLights: 5, // plan lights (flame + point light) of one module; AD 12 §4.9 has ≤ 4 per screen. sweep 2–4 (max 4) + 20 % = 4.8 → 5
	moduleTufts: 410, // grass tufts of one module (one InstancedMesh). sweep 223–335 (max 335) + 20 % = 402 → 410
	startKits: 12, // kits the first frame waits for (TARGET, of 21 on the demo). sweep 9–12 (max 12): met by every seed
	startMB: 18, // MB of GLB the first frame waits for (TARGET, of 28.6 MB on the demo). sweep 11.1–16.0 MB (max 16.0): met by every seed
	mapKits: 25, // distinct kits one map uses (the palette of the catalog is 21). sweep 20–21 (max 21) + 20 % = 25.2 → 25
	mapMB: 35, // MB of every kit of one map (all 21 = 28.6 MB). sweep 26.1–28.6 (max 28.6) + 20 % = 34.3 → 35
	bakeKB: 560, // size of the baked layout file of a 128 m map (JSON, typed arrays as base64; bigger maps: × modules / 64). sweep 399–459 KB (max 459) + 20 % = 551 → 560
	frameBudgetMs: 4, // ms of module building per frame while streaming (a 60 fps frame is 16.7 ms; the rest is the renderer's)
	kitConcurrency: 4, // GLBs fetched / parsed at the same time (browsers allow 6 per host; 4 leave room for textures and the splat)
});

const round3 = (v) => Math.round(v * 1000) / 1000;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---------------------------------------------------------------------------------------------------------------
// Split

/**
 * Where Play starts: the plan's own `start` (generated plans have one), else `along` m along the plan's main path from its start (the
 * hand-made demo). The scene resolves the free spot near it; the bake checks and the scene read this one function.
 */
export function mapStart(plan, along = 14) {
	if (plan.start && Number.isFinite(plan.start.x) && Number.isFinite(plan.start.z)) return { x: plan.start.x, z: plan.start.z };
	const path = plan.paths.find((p) => p.kind === 'road') ?? plan.paths[0];
	let left = along;
	for (let i = 1; i < path.points.length; i++) {
		const a = path.points[i - 1];
		const b = path.points[i];
		const len = Math.hypot(b.x - a.x, b.z - a.z);
		if (len >= left) return { x: a.x + ((b.x - a.x) * left) / len, z: a.z + ((b.z - a.z) * left) / len };
		left -= len;
	}
	return { ...path.points[path.points.length - 1] };
}

const emptyBox = () => ({ x0: Infinity, z0: Infinity, x1: -Infinity, z1: -Infinity });
function grow(box, x, z) {
	if (x < box.x0) box.x0 = x;
	if (x > box.x1) box.x1 = x;
	if (z < box.z0) box.z0 = z;
	if (z > box.z1) box.z1 = z;
}
const roundBox = (b) => ({ x0: round3(b.x0), z0: round3(b.z0), x1: round3(b.x1), z1: round3(b.z1) });

/**
 * Cut a layout result into modules. Grid origin = plan.bounds x0 / z0; an item belongs to the module that contains its footprint
 * centre (x/z without a footprint), clamped to the grid so an item on the far edge still has an owner. Returns
 * { manifest, modules }: the manifest is JSON-safe and small (what is baked and what the checks read); each module also carries the
 * item index lists (indices into result.placements / ecology.shrubs / groundPaint, the lights as placement indices, the tufts as a
 * Uint32Array). Empty modules are omitted; modules are sorted by (i, j), items keep their original order.
 */
export function splitModules(plan, result, { rules = MODULE_RULES, kitBytes = null } = {}) {
	const b = plan.bounds;
	const size = rules.size;
	const nx = Math.max(1, Math.ceil((b.x1 - b.x0) / size));
	const nz = Math.max(1, Math.ceil((b.z1 - b.z0) / size));
	const mods = new Map();
	const at = (x, z) => {
		const i = clamp(Math.floor((x - b.x0) / size), 0, nx - 1);
		const j = clamp(Math.floor((z - b.z0) / size), 0, nz - 1);
		const key = i * nz + j;
		let m = mods.get(key);
		if (!m) {
			mods.set(key, (m = {
				id: `m${i}_${j}`, i, j,
				cell: { x0: b.x0 + i * size, z0: b.z0 + j * size, x1: b.x0 + (i + 1) * size, z1: b.z0 + (j + 1) * size },
				box: emptyBox(), kitSet: new Set(), placements: [], shrubs: [], groundPaint: [], lights: [], tufts: [],
			}));
		}
		return m;
	};
	const growObb = (m, fp) => {
		for (const q of obbFrom(fp).pts) grow(m.box, q.x, q.z);
	};
	result.placements.forEach((p, k) => {
		const m = p.footprint ? at(p.footprint.cx, p.footprint.cz) : at(p.x, p.z);
		m.placements.push(k);
		if (p.kit) m.kitSet.add(p.kit);
		if (p.footprint) growObb(m, p.footprint);
		else grow(m.box, p.x, p.z);
		if (p.light) {
			m.lights.push(k);
			grow(m.box, p.light.x, p.light.z);
		}
	});
	result.ecology.shrubs.forEach((s, k) => {
		const m = s.footprint ? at(s.footprint.cx, s.footprint.cz) : at(s.x, s.z);
		m.shrubs.push(k);
		m.kitSet.add(s.kit ?? 'shrubs');
		if (s.footprint) growObb(m, s.footprint);
		else grow(m.box, s.x, s.z);
	});
	result.groundPaint.forEach((g, k) => {
		const m = at(g.x, g.z);
		m.groundPaint.push(k);
		grow(m.box, g.x - g.radius, g.z - g.radius);
		grow(m.box, g.x + g.radius, g.z + g.radius);
	});
	const t = result.ecology.tufts;
	for (let k = 0; k < t.x.length; k++) {
		const m = at(t.x[k], t.z[k]);
		m.tufts.push(k);
		grow(m.box, t.x[k], t.z[k]);
	}
	const list = [...mods.values()].sort((a, c) => a.i - c.i || a.j - c.j);
	const modules = [];
	const entries = [];
	const allKits = new Set();
	const owned = { placements: 0, shrubs: 0, tufts: 0, groundPaint: 0, lights: 0 };
	for (const m of list) {
		const kits = [...m.kitSet].sort();
		for (const k of kits) allKits.add(k);
		const bytes = kitBytes ? kits.reduce((n, k) => n + (kitBytes[k] ?? 0), 0) : null;
		const counts = { placements: m.placements.length, shrubs: m.shrubs.length, tufts: m.tufts.length, groundPaint: m.groundPaint.length, lights: m.lights.length, pieces: m.placements.length + m.shrubs.length, kits: kits.length };
		for (const key of Object.keys(owned)) owned[key] += counts[key];
		const entry = { id: m.id, i: m.i, j: m.j, cell: m.cell, bounds: roundBox(m.box), kits, bytes, counts };
		entries.push(entry);
		modules.push({ ...entry, placements: m.placements, shrubs: m.shrubs, groundPaint: m.groundPaint, lights: m.lights, tufts: Uint32Array.from(m.tufts) });
	}
	const kits = [...allKits].sort();
	const items = {
		placements: result.placements.length, shrubs: result.ecology.shrubs.length, tufts: t.x.length, groundPaint: result.groundPaint.length,
		lights: result.placements.reduce((n, p) => n + (p.light ? 1 : 0), 0),
	};
	const manifest = {
		format: MAP_FORMAT_VERSION, size, origin: { x: b.x0, z: b.z0 }, grid: { nx, nz }, modules: entries, kits,
		kitBytes: kitBytes ? Object.fromEntries(kits.map((k) => [k, kitBytes[k] ?? 0])) : null, // bytes of every kit the map uses
		ownership: { items, owned },
	};
	return { manifest, modules };
}

// ---------------------------------------------------------------------------------------------------------------
// Load order

/** Distance (m) from a point to an axis-aligned box (0 inside). */
export function boxDistance(box, x, z) {
	return Math.hypot(Math.max(box.x0 - x, 0, x - box.x1), Math.max(box.z0 - z, 0, z - box.z1));
}

/**
 * The order modules load in. A module's distance = the smaller of its cell's AABB distance and its CONTENT's AABB distance
 * (`bounds`: a big mass, a building or a lamp owned by a module farther away still reaches the first screen, so it is not left
 * for later). Ring 0 = modules within `startRadius` of the start, nearest first; the rest by distance ascending, ties by id. `ring`
 * of the rest = ceil(distance / size), counted from the start in module widths (so with startRadius ≥ size there is no ring 1: the
 * start ring already covers it). -> [{ id, ring, distance }].
 */
export function loadOrder(manifest, start, rules = MODULE_RULES) {
	const dist = (m) => Math.min(boxDistance(m.cell, start.x, start.z), m.bounds && Number.isFinite(m.bounds.x0) ? boxDistance(m.bounds, start.x, start.z) : Infinity);
	const list = manifest.modules.map((m) => ({ id: m.id, distance: round3(dist(m)) }));
	const byId = (a, c) => (a.id < c.id ? -1 : a.id > c.id ? 1 : 0);
	const rank = (a, c) => a.distance - c.distance || byId(a, c);
	const near = list.filter((m) => m.distance <= rules.startRadius).sort(rank).map((m) => ({ ...m, ring: 0 }));
	const far = list.filter((m) => m.distance > rules.startRadius).sort(rank).map((m) => ({ ...m, ring: Math.ceil(m.distance / manifest.size) }));
	return [...near, ...far];
}

// ---------------------------------------------------------------------------------------------------------------
// Checks (the enforced rules)

/**
 * The fast-load rules as report checks ({ id, rule, pass, details }, ids prefixed `module-`), in the shape of the engine's
 * report.checks. `bakeBytes` (optional) is the size of the baked layout file. A map that breaks one is not loaded differently:
 * the check fails in the report; a generator must re-roll or thin, the hand-made demo is fixed by its designer (AD 12 §4.14).
 */
export function checkModules(manifest, order, rules = MODULE_RULES, { bakeBytes = null } = {}) {
	const checks = [];
	const sec = 'AD12 §4.14';
	const over = (field, limit, label, id) => {
		const violations = manifest.modules.filter((m) => m.counts[field] > limit).map((m) => ({ id: m.id, value: m.counts[field] }));
		const max = manifest.modules.reduce((n, m) => Math.max(n, m.counts[field]), 0);
		checks.push({ id, rule: `${sec}: một module ≤ ${limit} ${label}`, pass: violations.length === 0, details: { limit, max, violations } });
	};
	over('kits', rules.moduleKits, 'kit', 'module-kits');
	over('pieces', rules.modulePieces, 'mảnh (placement + bụi)', 'module-pieces');
	over('lights', rules.moduleLights, 'đèn', 'module-lights');
	over('tufts', rules.moduleTufts, 'tuft cỏ', 'module-tufts');
	const ring0 = new Set(order.filter((o) => o.ring === 0).map((o) => o.id));
	const startKits = new Set();
	for (const m of manifest.modules) if (ring0.has(m.id)) for (const k of m.kits) startKits.add(k);
	const startBytes = manifest.kitBytes ? [...startKits].reduce((n, k) => n + (manifest.kitBytes[k] ?? 0), 0) : null;
	checks.push({ id: 'module-start-kits', rule: `${sec}: vòng 0 (≤ ${rules.startRadius} m quanh điểm xuất phát) cần ≤ ${rules.startKits} kit`, pass: startKits.size <= rules.startKits, details: { limit: rules.startKits, value: startKits.size, kits: [...startKits].sort(), modules: ring0.size } });
	const mb = (n) => round3(n / 1e6);
	if (manifest.kitBytes) {
		checks.push({ id: 'module-start-mb', rule: `${sec}: vòng 0 cần ≤ ${rules.startMB} MB kit`, pass: mb(startBytes) <= rules.startMB, details: { limit: rules.startMB, value: mb(startBytes) } });
	} else {
		checks.push({ id: 'module-start-mb', rule: `${sec}: vòng 0 cần ≤ ${rules.startMB} MB kit`, pass: true, details: { limit: rules.startMB, skipped: 'không có kích thước kit (npm run bake:map -- --kits)' } });
	}
	checks.push({ id: 'module-map-kits', rule: `${sec}: cả map dùng ≤ ${rules.mapKits} kit`, pass: manifest.kits.length <= rules.mapKits, details: { limit: rules.mapKits, value: manifest.kits.length } });
	if (manifest.kitBytes) {
		const total = manifest.kits.reduce((n, k) => n + (manifest.kitBytes[k] ?? 0), 0);
		checks.push({ id: 'module-map-mb', rule: `${sec}: kit của cả map ≤ ${rules.mapMB} MB`, pass: mb(total) <= rules.mapMB, details: { limit: rules.mapMB, value: mb(total) } });
	} else {
		checks.push({ id: 'module-map-mb', rule: `${sec}: kit của cả map ≤ ${rules.mapMB} MB`, pass: true, details: { limit: rules.mapMB, skipped: 'không có kích thước kit' } });
	}
	const { items, owned } = manifest.ownership;
	const broken = Object.keys(items).filter((k) => items[k] !== owned[k]).map((k) => ({ id: k, value: `${owned[k]}/${items[k]}` }));
	checks.push({ id: 'module-ownership', rule: `${sec}: mỗi placement, bụi, tuft, vệt đất, đèn thuộc đúng một module`, pass: broken.length === 0, details: { items, owned, violations: broken } });
	if (bakeBytes !== null) {
		// the bake grows with the area: the limit is for the 128 m map (8 × 8 modules), bigger maps get it times their module count / 64
		const scale = Math.max(1, (manifest.grid.nx * manifest.grid.nz) / 64);
		const limit = Math.round(rules.bakeKB * scale);
		checks.push({ id: 'module-bake-size', rule: `${sec}: file bake ≤ ${limit} KB${scale > 1 ? ` (${rules.bakeKB} KB × ${Math.round(scale * 100) / 100} theo diện tích)` : ''}`, pass: bakeBytes / 1024 <= limit, details: { limit, value: Math.round((bakeBytes / 1024) * 10) / 10 } });
	}
	return checks;
}

// ---------------------------------------------------------------------------------------------------------------
// Bake / restore

const TYPED = { Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array };

function toBase64(u8) {
	if (typeof Buffer !== 'undefined') return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('base64');
	let s = '';
	for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
	return btoa(s);
}

function fromBase64(text) {
	if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(text, 'base64')); // a copy: its own ArrayBuffer, aligned for Float32Array
	const s = atob(text);
	const u8 = new Uint8Array(s.length);
	for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
	return u8;
}

/** Value → JSON-safe: typed arrays as { $t, b } (base64), undefined as { $u }, non-finite numbers and -0 as { $n }. Functions, Maps and Sets are not allowed. */
function encode(v) {
	if (v === undefined) return { $u: 1 };
	if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? v : { $n: String(Object.is(v, -0) ? '-0' : v) };
	if (v === null || typeof v !== 'object') {
		if (typeof v === 'function' || typeof v === 'symbol' || typeof v === 'bigint') throw new Error(`bakeLayout: a ${typeof v} cannot be baked`);
		return v;
	}
	if (ArrayBuffer.isView(v)) {
		if (!TYPED[v.constructor.name]) throw new Error(`bakeLayout: ${v.constructor.name} cannot be baked`);
		return { $t: v.constructor.name, b: toBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
	}
	if (Array.isArray(v)) return v.map(encode);
	if (v instanceof Map || v instanceof Set) throw new Error('bakeLayout: a Map / Set cannot be baked');
	const out = {};
	for (const k of Object.keys(v)) out[k] = encode(v[k]);
	return out;
}

function decode(v) {
	if (v === null || typeof v !== 'object') return v;
	if (Array.isArray(v)) return v.map(decode);
	if (v.$u !== undefined) return undefined;
	if (v.$n !== undefined) return v.$n === '-0' ? -0 : Number(v.$n);
	if (v.$t !== undefined) {
		const u8 = fromBase64(v.b);
		return new TYPED[v.$t](u8.buffer, 0, u8.byteLength / TYPED[v.$t].BYTES_PER_ELEMENT);
	}
	const out = {};
	for (const k of Object.keys(v)) out[k] = decode(v[k]);
	return out;
}

/** The engine's result as a JSON-safe object ({ format, meta, result }); `meta` must be JSON-safe (key, plan id, seed …). */
export function bakeLayout(result, meta = {}) {
	return { format: MAP_FORMAT_VERSION, meta, result: encode(result) };
}

/** The result a bake holds, same shape and values as layoutBiome's (typed arrays, undefined keys). Throws when the format version differs. */
export function restoreLayout(baked) {
	if (!baked || baked.format !== MAP_FORMAT_VERSION) throw new Error(`map bake format ${baked?.format} ≠ ${MAP_FORMAT_VERSION}`);
	return decode(baked.result);
}

/** Size in bytes of a bake as the JSON file / cache entry (UTF-8; base64 and the engine's ASCII text make chars = bytes). */
export const bakeBytes = (baked) => JSON.stringify(baked).length;

// ---------------------------------------------------------------------------------------------------------------
// Key

/** JSON text with sorted keys; functions and undefined are skipped, typed arrays as their values. */
export function stableStringify(v) {
	if (v === undefined || typeof v === 'function' || typeof v === 'symbol') return undefined;
	if (v === null || typeof v !== 'object') return typeof v === 'number' && !Number.isFinite(v) ? JSON.stringify(String(v)) : JSON.stringify(v);
	if (ArrayBuffer.isView(v)) return `[${Array.from(v).join(',')}]`;
	if (Array.isArray(v)) return `[${v.map((x) => stableStringify(x) ?? 'null').join(',')}]`;
	if (v instanceof Map) return stableStringify(Object.fromEntries(v));
	if (v instanceof Set) return stableStringify([...v]);
	const parts = [];
	for (const k of Object.keys(v).sort()) {
		const s = stableStringify(v[k]);
		if (s !== undefined) parts.push(`${JSON.stringify(k)}:${s}`);
	}
	return `{${parts.join(',')}}`;
}

/** What plan.ground() returns on a 17 × 17 grid over the bounds: the plan's ground is a function, so its numbers stand in for it. */
function groundFingerprint(plan) {
	if (typeof plan.ground !== 'function') return '';
	const b = plan.bounds;
	const out = [];
	for (let j = 0; j <= 16; j++) {
		for (let i = 0; i <= 16; i++) {
			const g = plan.ground(b.x0 + ((b.x1 - b.x0) * i) / 16, b.z0 + ((b.z1 - b.z0) * j) / 16);
			out.push(stableStringify(Object.fromEntries(Object.entries(g).map(([k, x]) => [k, typeof x === 'number' ? Math.round(x * 1e4) / 1e4 : x]))));
		}
	}
	return out.join('|');
}

/** The catalog as the engine sees it: every asset (data fields), whether it is available, and the recipes / policies. */
function catalogFingerprint(catalog) {
	const assets = [...catalog.assets.values()].sort((a, c) => (a.id < c.id ? -1 : 1)).map((a) => [stableStringify(a), catalog.available(a.id) ? 1 : 0]);
	return stableStringify({ assets, clusters: catalog.clusters, traces: catalog.traces, guides: catalog.guides, zones: catalog.zones, massSets: catalog.massSets, shrubSets: catalog.shrubSets });
}

/** The options as the engine reads them (defaults merged), so `{}` and the explicit defaults give one key. */
function normalizeOptions(options, defaults = DEFAULT_OPTIONS) {
	const explicit = Object.fromEntries(Object.entries(options.budgets ?? {}).filter(([, v]) => v !== null && v !== undefined));
	return {
		seeds: { ...defaults.seeds, ...(options.seeds ?? {}) },
		density: { ...defaults.density, ...(options.density ?? {}) },
		budgets: explicit, // only what the caller set: an unset tufts / shrubs budget scales with the plan area
		rules: { ...LAYOUT_RULES, ...(options.rules ?? {}) },
		logTries: !!options.logTries,
	};
}

export { codeHash, fileHash };

/**
 * Stable hash of the inputs that decide which attempt of a generated map is ACCEPTED besides the generator's own code: the fast-load
 * acceptance (`generateMap(…, { modules: { kitBytes } })`) reads the kit sizes, the rules and functions of this file are covered by the
 * code hash. -> 28 hex digits. Pass the same `kitBytes` the `generateMap` call gets, or null when it gets none.
 */
export const acceptKey = (kitBytes) => hashPair(stableStringify({ modules: kitBytes ?? null }));

/**
 * Stable key of a layout: a hash of the plan (JSON-able fields + its ground sampled on a grid), the normalised options (seeds,
 * density, budgets, rule overrides on top of LAYOUT_RULES), MAP_FORMAT_VERSION, the catalog (assets, availability, recipes) and
 * `code` (the `codeHash` of the engine / generator sources: an edit of the code is a new key, a stale browser-cache entry or baked
 * file is never served). `format` is only for tests (to show the version is part of the key).
 */
export function layoutKey(plan, options, catalog, { format = MAP_FORMAT_VERSION, code = '' } = {}) {
	return hashPair(stableStringify({ format, code, plan, ground: groundFingerprint(plan), options: normalizeOptions(options ?? {}), catalog: catalogFingerprint(catalog) }));
}

/**
 * Key of a generated map BEFORE its plan exists (one seed → the whole map): what the plan is made from (seed, size, biome, the
 * generator's version) + the options, the catalog, the code hash and `accept` (`acceptKey(kitBytes)`: the inputs of the fast-load
 * acceptance that are not code). Its cache entry holds the accepted attempt (and the layout key),
 * so a warm load regenerates the plan with `generatePlan(seed, { attempt })` instead of searching for it with the engine.
 */
export function genKey({ seed, size, biome = 'moor', version }, options, catalog, { format = MAP_FORMAT_VERSION, code = '', accept = '' } = {}) {
	return hashPair(stableStringify({ kind: 'gen', format, code, accept, seed, size, biome, version, options: normalizeOptions(options ?? {}), catalog: catalogFingerprint(catalog) }));
}

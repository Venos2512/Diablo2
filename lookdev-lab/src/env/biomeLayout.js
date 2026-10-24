// Biome layout engine: arranges the assets of a biome in the order of art direction 12 §4.6 and checks the §4.12 rules.
// Renderer-free (no three, no DOM, no Math.random/Date in the algorithm): lock the play space → big masses → functional
// clusters → wayfinding → ecology → traces → validate. Every number lives in UNITS / LAYOUT_RULES with its AD 12 source;
// every group (mass, cluster, guide, ecology, trace) draws from seeded per-item streams, so changing one group's seed
// never moves what an earlier step placed. Placement is checked at the FINAL position in the §4.12 order (play space →
// footprints & use zones → water/slope/step/substrate/corruption → distribution), the first failing class is the drop
// reason, effort is bounded (maxTries inside a fixed reach, never a wider radius) and nothing is forced.
// Plan/asset/result shapes: docs in legacy/art-direction/12 §4.13; data in biomeCatalog.js.
import { BIOME_RULES, PlacementGrid, grassHabitat, segmentDistance } from './biomePlacement.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
	const t = clamp((x - a) / (b - a), 0, 1);
	return t * t * (3 - 2 * t);
};
const now = () => (typeof performance !== 'undefined' ? performance.now() : 0);
const round3 = (v) => Math.round(v * 1000) / 1000;

// ---------------------------------------------------------------------------------------------------------------
// Units and rules

/**
 * AD 12 §0/§4.12: H and Sub are visual / occupancy conventions, NOT 1 Sub = 1 m. The lab's hero is 1.8 m (darkWood.js
 * SCALE). A D2 subtile is a 32×16 px diamond = a ground square of side 32/√2 ≈ 22.6 px; the 75 px hero is 75/cos 30° ≈
 * 86.6 px tall on the ground axis, so 1 Sub ≈ 0.26 H ≈ 0.47 m. Every rule below is stated in metres.
 */
export const UNITS = Object.freeze({
	H: 1.8,
	SUB_PX: 32 / Math.SQRT2,
	HERO_PX: 75,
	SUB: (32 / Math.SQRT2 / (75 / Math.cos(Math.PI / 6))) * 1.8,
	/** Default iso play camera: ortho height 12 m, 16:9, pitch 30° (2:1). Ground depth = 12 / sin 30° = 24 m. */
	CAMERA: Object.freeze({ forward: Object.freeze({ x: -Math.SQRT1_2, z: -Math.SQRT1_2 }), pitch: Math.PI / 6, screen: Object.freeze({ w: (12 * 16) / 9, h: 12 }) }),
});

const SUB = UNITS.SUB;
const H = UNITS.H;

/**
 * Every number the engine uses (metres unless said otherwise); the comment names the AD 12 source. "Tuning" marks values the
 * art direction gives no number for: they are starting points for the camera review, listed in §4.13.
 */
export const LAYOUT_RULES = Object.freeze({
	// §4.6.1 / §4.3 / §4.4 / §5.1: the play space is locked first and never narrowed
	pathClear: 0.3, // a footprint keeps this far off a corridor edge (tuning; ≈ 0.65 Sub)
	doorClear: 0.15, interactionClear: 0.1, spawnClear: 0.1, arenaClear: 0.05, // tuning
	waterClear: 0.5, // §4.4 clear water edge (tuning)
	doorEps: 0.05, // door corridors start this far in front of the wall so the wall itself is not "inside" them
	arenaDecals: true, // §4.2 layer 3 decals (bones) may lie on an arena: walk-through, no telegraph is hidden by them (tuning)
	edgeMargin: 0.5, // footprints stay this far inside the plan bounds
	mainPathMin: 3 * SUB, // §4.3 main path ≥ 3 Sub
	doorMin: 2 * SUB, // §5.1 door ≥ 2 Sub
	arenaMin: 8 * SUB, // §4.3 combat area ≥ 8×8 Sub
	passGap: 2 * SUB, // §4.12 "đi lọt khoảng giữa prop": gap between blockers of different groups (tuning, 2 Sub)
	clusterGap: 0.1, // pieces of one cluster do not touch (tuning)
	agentRadius: 0.35, // hero + companion half width used by the passability check (tuning)
	pathWidth: { road: 4.2, branch: 2.6, trail: 1.4, animal: 1 }, // when the plan gives none (tuning)
	doorSize: { door: { width: 1.4, depth: 2.6 }, gate: { width: 4, depth: 4 }, entrance: { width: 3, depth: 3 } }, // §5.1 (tuning)
	// §4.12 bounded effort
	maxTries: 12, // jittered positions per item
	reach: { mass: 2, host: 1.5, member: 1.2, guide: 1, trace: 1.2, shrub: 0.8, landmark: 3 }, // fixed radius round the target (placeKit reach)
	// §4.6.2 / §4.8 / §4.3 masses
	massSpacing: 12, // centres of two auto masses (buildOutcrops: 12)
	massSecondary: [1, 3], // 1 main + 1–3 secondary of other sizes (§4.8, buildOutcrops)
	massSecondaryScale: [0.35, 0.65], // wanted size of a secondary vs the main piece (buildOutcrops); the scale is clamped to the piece's own range
	massSecondaryMax: 0.85, // …and a secondary whose clamped size still reaches this share of the main piece is not used
	massLean: 0.7, // half angle of the sector the secondary pieces lean into (rad)
	massBudgetPerArea: 16 / (128 * 128), // auto compositions per m² at density 1 (tuning)
	massEdge: 4, // auto masses stay this far inside the bounds
	hostKeepOut: 8, // …and this far from a planned cluster host, so masses do not take the place of a cluster (tuning)
	scoreBack: 0.45, scoreFrame: 0.25, scoreNoise: 0.3, // back-of-screen / framing / noise weights (§4.6.2, tuning)
	frameBest: 7, // distance off the play space edge where framing scores best (tuning)
	landmarkHeight: 2 * H, // §4.2 layer 7 / §4.3: ≥ 2 H
	landmarkWindow: 32, // §4.3 one landmark per 1–2 screens (1.5 × 21.3 m)
	landmarkSee: 18, // visible from the path (tuning, ≈ one screen)
	// §4.3 / §5.2 occlusion
	tallMin: 0.5 * H, // §4.2 layer 5 starts at 0.5 H
	occlusionMax: 0.25, // tall props cover ≤ 25 % of the screen
	occludePathMax: 0.15, // an auto mass may hide at most this much of the nearby path (tuning)
	occludeNear: 12, // path samples within this of a mass count as "near" (tuning)
	occRaster: 0.5, // raster cell of the screen-window coverage check
	windowStep: 8, // screen windows are centred every 8 m along the paths (tuning)
	// §4.6.3 clusters
	clusterSpacing: 7, // hosts of two clusters: clusters are 3–4 m in radius (tuning)
	clusterClear: 2.2, // §4.11 trại địch "đất trống quanh lửa, lều và chỗ tụ tập": pieces of different clusters keep this gap, and stay out of other hosts' `bare` radius (tuning, 2.0–2.5)
	countRerolls: 8, // re-rolls of the member counts while an earlier cluster of the same recipe has exactly these counts
	sizeRepair: 2, // a flat cluster gets up to this many more members of the missing size class (within the recipe's count)
	sizeMixMin: 4, // a cluster of at least this many pieces is judged for the §4.3 size rhythm (1 large – 2 medium – 3+ small)
	slotAngle: { front: 0.6, back: 0.7, side: 0.5 }, // half angle of a slot sector (rad, tuning)
	axisTol: 0.15, faceTol: 0.1, // test tolerances: built pieces follow the host axes, seats face the rest point (rad)
	// §4.6.4 / §4.9 wayfinding
	torchGap: BIOME_RULES.torchGap, // 7 m between markers except gate pairs
	junctionSnap: 3, // a path end this close to another path is a fork (tuning)
	bendAngle: (35 * Math.PI) / 180, // hidden bend: turn > ~35° over ~8 m
	bendSpan: 8,
	decisionRadius: 8, // a marker stands within this of its decision (tuning)
	guideBefore: [2, 4], // 2–4 m before the decision along the approach
	shoulderMin: 0.3, shoulderMax: 1.5, // marker footprint 0.3…1.5 m off the corridor edge (§4.9 "vai đường")
	confirmAfter: 6, // confirmation marker this far after a turn
	confirmGap: (12 * 16) / 9, // …when the next marker is further than one screen width
	maxLightsPerScreen: 4, // §4.9 light budget per screen window (tuning)
	// §4.6.5 / §4.7 ecology
	ecoCell: 4, // seed cell of the tuft clusters
	tuftsPerArea: 60000 / (128 * 128), shrubsPerArea: 260 / (128 * 128), // default budgets at density 1 scale with the plan area (the demo is 128 × 128), see DEFAULT_OPTIONS
	tuftsPerClusterMean: 5.45, bankOther: 0.5, // mean tufts of a cluster incl. loners (budget estimate); damp-bank tuft chance outside bank zones (× bankChance)
	carpetCell: 1,
	clustersPerCell: 6, // expected clusters in a cell of full density (tuning)
	tuftsPerCluster: [3, 7], // §4.7
	clusterAspect: [0.45, 1], // a tuft cluster is an ellipse: short axis / long axis (tuning)
	clusterRadius: [0.35, 1.4], // tuning
	lonerChance: 0.45, lonerReach: 3, // a few small tufts apart from the cluster (§4.7)
	rootSpacing: BIOME_RULES.rootSpacing, // min distance between roots
	minDensity: 0.04, // below this a site grows nothing
	carpetH: [0.08, 0.2], edgeH: [0.2, 0.35], tallH: [0.35, 0.55], // §4.7 heights as fractions of H
	tallChance: 0.3, tallClear: 4, // taller grass only this far from combat/gameplay areas (§4.7)
	shrubH: [0.3, 0.5], // §4.2 layer 4 "prop thấp ≤ 0.5 H — bụi": shrubs stay under the 0.5 H "tall" line, so they never need an occlusion zone
	shrubSpacing: 1.8, shrubQuiet: 2.5, // tuning
	shadowReach: 2.5, shadowBoost: 1.4, // grass just behind walls / big masses (tuning)
	footRing: [0.15, 0.7], footTufts: [3, 6], footBare: 0.5, // §4.7 chân prop: grass outside, a little bare soil at the foot
	bankWidth: 2.4, // damp bank tufts band beyond creekClear (tuning)
	stripMax: 0.2, // low strip between ruts: tufts ≤ carpet height (§4.7)
	// §4.6.6 / §4.10 traces
	traceSecondary: [2, 6], traceDrag: [0, 2], // 1 main + 2–6 secondary, 0–2 further along the drag
	dragStep: [2, 3.4], dragScale: 0.7, traceLean: 0.8, // tuning
	eventGap: 4.5, // clean ground between events (tuning)
	hostRadius: 7, // an event needs a host within this (tuning)
	traceRing: [0.8, 2.6], // distance of secondary pieces from the main one (tuning)
	// shape of the algorithm (tuning: the art direction gives no number for these; they are starting points for the camera review)
	slopeProbe: 0.4, tiltProbe: [0.5, 0.6], // slope = central difference over ±0.4 m (grassSite); tilt probe max(0.5, 0.6 × half size) (placeKit)
	damp: { wet: 0.3, grass: 0.75, water: 9 }, // mossy rocks where damp (buildOutcrops: wet > 0.3 || grass > 0.75 || creek < 9)
	backSide: 0.5, massTall: { rock: 0.6, tree: 0.5 }, burnedChance: 0.2, // back-of-screen share; chance of a tall main piece there; burned trees (always in camps)
	massSpacingTol: 0.9, massGap: [0.2, 0.9], massStep: 0.4, massAttempts: 3, massPathClear: 2, scoreNeutral: 0.5, // reach jitter tolerance; secondary spacing; candidates per budgeted composition; auto masses stay this far off a corridor; score without a path
	landmarkDist: [9, 16], landmarkSpread: 1.6, landmarkScale: 1.03, landmarkTries: 4, landmarkSpacing: 6, landmarkStep: 4, landmarkMinTail: 0.25, // landmark insertion
	memberRadius: 0.75, restJitter: 0.3, // cluster slots: share of a member's half diagonal; seat spread (rad)
	guideExtra: [0, 0.8], gateFront: [0.3, 0.5], bankBefore: 0.8, bendKeep: 1.5, bendProbe: 2, hiddenAhead: 6, branchProbe: 6, decisionSnap: 12, // marker offset beyond the shoulder; gate marker depth (m, share of depth); ford decision before the bank; merge radius of bends (× bendSpan); chord and scan step of a bend; hidden-bend look-ahead; branch direction probe; authored decision snap
	tuftEdge: 0.3, tuftFootClear: 0.18, accessClear: 0.15, quietMargin: 1, shadowMin: 0.15, wallReach: 1.5, // grassSite: a tuft keeps 0.18 off a footprint and 0.15 off door / interaction / spawn; an arena + 1 m is short turf
	tuftThin: 1.6, carpetGain: 1.15, rockFade: [0.3, 0.5], bareRamp: 0.35, yardNear: 1, yardFloor: 0.2, toneBase: 0.2, toneZone: 0.5, // density → acceptance, carpet; grass fades on rock; bare ramp round fires; yard round doors
	edgeShoulder: 3.2, edgeFoot: 1, tallPathClear: 2.5, openH: [0.2, 0.24], openLow: 0.75, // edge grass within the shoulder ramp of grassHabitat (3.2) or 1 m of a footprint; mid-height tufts
	fieldPatch: 0.8, fieldTone: 0.55, fieldToneJitter: 0.1, // cultivated rows
	clusterOffset: 0.6, toneJitter: [0.06, 0.04], // cluster centre off-set (× radius); tone variation per cluster / tuft
	stripStep: 1.5, stripChance: 0.35, stripInset: 0.05, stripTone: 0.35, stripCarpet: 0.4, stripDensity: 0.35, // low strip between ruts
	footSpread: [0.8, 1.6], footStrength: 0.45, // prop feet: angular spread of the ring, bare soil strength
	bankChance: 0.7, bankTufts: [2, 5], bankSpread: 0.9, bankTone: [0.12, 0.24], // damp bank tufts
	shrubRate: 0.3, shrubEdge: [1.7, 0.5], shrubGain: [1.5, 0.2], shrubTall: [0.4, 0.15], shrubPathClear: 0.8, shrubProbe: 0.7, shrubTries: 4, // shrubs per ecology cell; edge / open boost; density gain; tall chance (tall zones / others)
	hostR0: 1.5, hostPad: 0.5, leanJitter: 0.5, mainReach: 0.85, secReach: 0.4, leanTol: 0.05, ringJitter: 0.15, stratJitter: 0.12, dragJitter: 0.15, eventOffset: [1, 2.6], // traces: host outline estimates; lean and spread jitter; distances from the main piece
	wetFresh: 1.4, wetOld: 0.4, dirtDefault: 0.6, paintPad: 0.35, wetShrink: 0.8, paintMin: 0.05, removePad: 0.45, removeGap: 0.1, // ground paint under pieces; grass removed under traces
	occludeMinSamples: 4, pathSample: 1, rutGap: 1.2, rutWidth: 0.3, // path samples needed to judge path occlusion; path sample spacing; default cart ruts
	// ground classes (the engine derives them from ground())
	mudWet: 0.6, rockMin: 0.5, rockSlope: 1, bloodMin: BIOME_RULES.maxBlood, grassMin: 0.4, // rock face ≈ 45° (tuning)
	minSink: 0.03,
});

/** `budgets.tufts` / `shrubs` are minimums: unless the caller gives them, the effective budget is max(default, area × tuftsPerArea | shrubsPerArea). */
export const DEFAULT_OPTIONS = Object.freeze({
	seeds: Object.freeze({ mass: 11, cluster: 23, guide: 37, ecology: 53, trace: 71 }),
	density: Object.freeze({ grass: 1, shrubs: 1, traces: 1, masses: 1 }),
	budgets: Object.freeze({ masses: null, hosts: 32, members: 160, guides: 48, tufts: 60000, shrubs: 260, events: 24 }),
});

// ---------------------------------------------------------------------------------------------------------------
// Seeded streams

/** Same algorithm as kit.rng (mulberry32). */
export function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** FNV-1a over the parts (then a murmur finaliser): hash(plan seed, group seed, item key). */
export function hash32(...parts) {
	let h = 0x811c9dc5;
	for (const part of parts) {
		const s = String(part);
		for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
		h = Math.imul(h ^ 0x1f, 0x01000193);
	}
	h ^= h >>> 16;
	h = Math.imul(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = Math.imul(h, 0xc2b2ae35);
	return (h ^ (h >>> 16)) >>> 0;
}

/** A seeded stream with the draws the engine needs; every draw advances the same mulberry32 state. */
export class Stream {
	constructor(seed) { this.next = mulberry32(seed); }
	range(a, b) { return a + (b - a) * this.next(); }
	int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
	pick(list) { return list[Math.floor(this.next() * list.length)]; }
	chance(p) { return this.next() < p; }
	sign() { return this.next() < 0.5 ? -1 : 1; }
	weighted(list, weight) {
		let total = 0;
		for (const item of list) total += weight(item);
		let t = this.next() * total;
		for (const item of list) {
			t -= weight(item);
			if (t <= 0) return item;
		}
		return list[list.length - 1];
	}
	/** Uniform point in a disc: [dx, dz]. */
	disc(r) {
		const a = this.next() * TAU, d = r * Math.sqrt(this.next());
		return [Math.cos(a) * d, Math.sin(a) * d];
	}
}

// ---------------------------------------------------------------------------------------------------------------
// Geometry (world metres, x east, z south). Yaw = three.js rotation about +y: local (x, z) → (x·cos + z·sin, −x·sin + z·cos),
// so local +z (the front of a camp piece) points to (sin yaw, cos yaw) and yawFacing(dx, dz) = atan2(dx, dz).

/** Yaw that turns a piece's front (+z) toward (dx, dz). */
export const yawFacing = (dx, dz) => Math.atan2(dx, dz);
export const wrapAngle = (a) => {
	a = (a + Math.PI) % TAU;
	if (a < 0) a += TAU;
	return a - Math.PI;
};
export const angleDiff = (a, b) => Math.abs(wrapAngle(a - b));

/** Local point (lx, lz) of a frame at (x, z) turned by yaw → world. */
export function toWorld(x, z, yaw, lx, lz) {
	const c = Math.cos(yaw), s = Math.sin(yaw);
	return { x: x + lx * c + lz * s, z: z - lx * s + lz * c };
}

/** Oriented box: centre, half sizes along its local x / z, yaw; `pts` = corners (−−, +−, ++, −+), bbox x0..z1. */
export function makeObb(cx, cz, hx, hz, yaw) {
	const c = Math.cos(yaw), s = Math.sin(yaw);
	const ax = hx * c, az = -hx * s, bx = hz * s, bz = hz * c;
	const pts = [{ x: cx - ax - bx, z: cz - az - bz }, { x: cx + ax - bx, z: cz + az - bz }, { x: cx + ax + bx, z: cz + az + bz }, { x: cx - ax + bx, z: cz - az + bz }];
	let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
	for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
	return { cx, cz, hx, hz, yaw, pts, x0, x1, z0, z1 };
}
export const obbData = (o) => ({ cx: round3(o.cx), cz: round3(o.cz), hx: round3(o.hx), hz: round3(o.hz), yaw: round3(o.yaw) });
export const obbFrom = (d) => makeObb(d.cx, d.cz, d.hx, d.hz, d.yaw);

/**
 * Footprint of a piece placed at (x, z) with yaw and scale: its local box (pivot may be off-centre) rotated and scaled,
 * centre offset included (AD 12 §4.8 "Footprint phải tính sau xoay và scale").
 */
export function footprintObb(box, x, z, yaw, scale = 1) {
	const c = toWorld(x, z, yaw, ((box.x0 + box.x1) / 2) * scale, ((box.z0 + box.z1) / 2) * scale);
	return makeObb(c.x, c.z, ((box.x1 - box.x0) / 2) * scale, ((box.z1 - box.z0) / 2) * scale, yaw);
}

/** Local box (already scaled) of the use zone next to a footprint box; null for no zone. */
export function useBox(box, use, scale = 1) {
	if (!use) return null;
	const x0 = box.x0 * scale, x1 = box.x1 * scale, z0 = box.z0 * scale, z1 = box.z1 * scale, d = use.depth;
	const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
	const hw = (use.width ?? x1 - x0) / 2, hl = (use.width ?? z1 - z0) / 2;
	switch (use.side) {
		case 'all': return { x0: x0 - d, x1: x1 + d, z0: z0 - d, z1: z1 + d };
		case 'back': return { x0: cx - hw, x1: cx + hw, z0: z0 - d, z1: z0 };
		case 'left': return { x0: x0 - d, x1: x0, z0: cz - hl, z1: cz + hl };
		case 'right': return { x0: x1, x1: x1 + d, z0: cz - hl, z1: cz + hl };
		default: return { x0: cx - hw, x1: cx + hw, z0: z1, z1: z1 + d };
	}
}

/** Use zone OBB in the world (the box is already scaled; same yaw, same pivot). */
export function useObb(box, use, x, z, yaw, scale = 1) {
	const b = useBox(box, use, scale);
	if (!b) return null;
	const c = toWorld(x, z, yaw, (b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
	return makeObb(c.x, c.z, (b.x1 - b.x0) / 2, (b.z1 - b.z0) / 2, yaw);
}

/** Largest separation along the 4 box axes: < 0 = overlapping (by about that depth), > 0 = a gap at least that wide. */
export function obbSeparation(a, b) {
	const ac = Math.cos(a.yaw), as = Math.sin(a.yaw), bc = Math.cos(b.yaw), bs = Math.sin(b.yaw);
	const dx = b.cx - a.cx, dz = b.cz - a.cz;
	let best = -Infinity;
	for (const [nx, nz] of [[ac, -as], [as, ac], [bc, -bs], [bs, bc]]) {
		const ra = a.hx * Math.abs(nx * ac - nz * as) + a.hz * Math.abs(nx * as + nz * ac);
		const rb = b.hx * Math.abs(nx * bc - nz * bs) + b.hz * Math.abs(nx * bs + nz * bc);
		best = Math.max(best, Math.abs(nx * dx + nz * dz) - ra - rb);
	}
	return best;
}
export const obbOverlap = (a, b, eps = 1e-6) => obbSeparation(a, b) < -eps;

const distToSeg = (px, pz, ax, az, bx, bz) => {
	const dx = bx - ax, dz = bz - az;
	const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
	return Math.hypot(px - ax - t * dx, pz - az - t * dz);
};

export function pointInPoly(pts, x, z) {
	let inside = false;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const a = pts[i], b = pts[j];
		if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
	}
	return inside;
}

/** Distance from a point to a polygon outline; negative inside. */
export function pointPolySigned(pts, x, z) {
	let d = Infinity;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) d = Math.min(d, distToSeg(x, z, pts[j].x, pts[j].z, pts[i].x, pts[i].z));
	return pointInPoly(pts, x, z) ? -d : d;
}

const cross = (ax, az, bx, bz) => ax * bz - az * bx;
export function segmentsIntersect(a, b, c, d) {
	const d1 = cross(d.x - c.x, d.z - c.z, a.x - c.x, a.z - c.z), d2 = cross(d.x - c.x, d.z - c.z, b.x - c.x, b.z - c.z);
	const d3 = cross(b.x - a.x, b.z - a.z, c.x - a.x, c.z - a.z), d4 = cross(b.x - a.x, b.z - a.z, d.x - a.x, d.z - a.z);
	if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
	const on = (p, q, r) => Math.min(p.x, q.x) <= r.x && r.x <= Math.max(p.x, q.x) && Math.min(p.z, q.z) <= r.z && r.z <= Math.max(p.z, q.z);
	return (d1 === 0 && on(c, d, a)) || (d2 === 0 && on(c, d, b)) || (d3 === 0 && on(a, b, c)) || (d4 === 0 && on(a, b, d));
}

/** Distance between a segment and a polygon (0 when they touch or the segment is inside). Zero-length segments are points. */
export function segPolyDistance(a, b, pts) {
	if (pointInPoly(pts, a.x, a.z) || pointInPoly(pts, b.x, b.z)) return 0;
	let best = Infinity;
	for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
		const p = pts[j], q = pts[i];
		if (segmentsIntersect(a, b, p, q)) return 0;
		best = Math.min(best, distToSeg(a.x, a.z, p.x, p.z, q.x, q.z), distToSeg(b.x, b.z, p.x, p.z, q.x, q.z), distToSeg(p.x, p.z, a.x, a.z, b.x, b.z), distToSeg(q.x, q.z, a.x, a.z, b.x, b.z));
	}
	return best;
}

/** Distance between two polygons (0 when they overlap). */
export function polyDistance(P, Q) {
	if (pointInPoly(Q, P[0].x, P[0].z) || pointInPoly(P, Q[0].x, Q[0].z)) return 0;
	let best = Infinity;
	for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
		const d = segPolyDistance(P[j], P[i], Q);
		if (d === 0) return 0;
		best = Math.min(best, d);
	}
	return best;
}

/** Distance between two boxes: negative = overlap depth, positive = true gap. */
export function obbGap(a, b) {
	const sep = obbSeparation(a, b);
	return sep <= 0 ? sep : polyDistance(a.pts, b.pts);
}

export function convexHull(points) {
	const p = points.slice().sort((a, b) => a.x - b.x || a.z - b.z);
	const lower = [];
	for (const q of p) {
		while (lower.length >= 2 && cross(lower[lower.length - 1].x - lower[lower.length - 2].x, lower[lower.length - 1].z - lower[lower.length - 2].z, q.x - lower[lower.length - 1].x, q.z - lower[lower.length - 1].z) <= 0) lower.pop();
		lower.push(q);
	}
	const upper = [];
	for (let i = p.length - 1; i >= 0; i--) {
		const q = p[i];
		while (upper.length >= 2 && cross(upper[upper.length - 1].x - upper[upper.length - 2].x, upper[upper.length - 1].z - upper[upper.length - 2].z, q.x - upper[upper.length - 1].x, q.z - upper[upper.length - 1].z) <= 0) upper.pop();
		upper.push(q);
	}
	return lower.slice(0, -1).concat(upper.slice(0, -1));
}

const bboxOf = (pts) => {
	let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
	for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
	return { x0, x1, z0, z1 };
};

/** How deep two overlapping polygons sit in each other: the smallest overlap over the edge normals of both (SAT, exact for convex shapes); 0 when they do not overlap. */
export function polyPenetration(P, Q) {
	let best = Infinity;
	for (const poly of [P, Q]) {
		for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
			const nx = poly[i].z - poly[j].z, nz = poly[j].x - poly[i].x, l = Math.hypot(nx, nz);
			if (!l) continue;
			let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
			for (const p of P) { const d = (p.x * nx + p.z * nz) / l; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
			for (const p of Q) { const d = (p.x * nx + p.z * nz) / l; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
			const overlap = Math.min(a1, b1) - Math.max(a0, b0);
			if (overlap <= 0) return 0;
			best = Math.min(best, overlap);
		}
	}
	return Number.isFinite(best) ? best : 0;
}

/** Signed distance between two polygons: the gap, or minus the penetration depth when they overlap. */
export function polyGap(P, Q) {
	const d = polyDistance(P, Q);
	if (d > 0) return d;
	const depth = polyPenetration(P, Q);
	return depth > 0 ? -depth : 0;
}

/** Gap between a reserved shape (circle | capsule | poly) and a convex polygon; negative = inside / overlapping (by about that depth). */
export function shapeGap(s, poly) {
	switch (s.t) {
		case 'circle': return Math.max(0, pointPolySigned(poly, s.x, s.z)) - s.r;
		case 'capsule': return segPolyDistance(s.a, s.b, poly) - s.r;
		default: return polyGap(s.pts, poly);
	}
}

/** Signed distance from a point to a shape (negative inside). */
export function pointShapeGap(s, x, z) {
	switch (s.t) {
		case 'circle': return Math.hypot(x - s.x, z - s.z) - s.r;
		case 'capsule': return segmentDistance(x, z, s.a, s.b) - s.r;
		default: return pointPolySigned(s.pts, x, z);
	}
}

const shapeBox = (s) => {
	if (s.t === 'circle') return { x0: s.x - s.r, x1: s.x + s.r, z0: s.z - s.r, z1: s.z + s.r };
	if (s.t === 'capsule') return { x0: Math.min(s.a.x, s.b.x) - s.r, x1: Math.max(s.a.x, s.b.x) + s.r, z0: Math.min(s.a.z, s.b.z) - s.r, z1: Math.max(s.a.z, s.b.z) + s.r };
	return bboxOf(s.pts);
};

// ---------------------------------------------------------------------------------------------------------------
// Spatial hash (uniform grid by xz bounds; query visits each record once, early exit on a truthy result)

let gridCount = 0;
export class Grid {
	constructor(cell = 4) {
		this.cell = cell;
		this.cells = new Map();
		this.stampKey = `_g${++gridCount}`;
		this.stamp = 0;
	}

	static key(i, j) { return (i + 8192) * 16384 + (j + 8192); }

	insert(rec, x0, z0, x1, z1) {
		const c = this.cell, keys = [];
		for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) {
			for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) {
				const k = Grid.key(i, j);
				let list = this.cells.get(k);
				if (!list) this.cells.set(k, (list = []));
				list.push(rec);
				keys.push(k);
			}
		}
		rec.cells = keys;
		return rec;
	}

	remove(rec) {
		for (const k of rec.cells ?? []) {
			const list = this.cells.get(k);
			const at = list ? list.indexOf(rec) : -1;
			if (at >= 0) list.splice(at, 1);
		}
		rec.cells = [];
	}

	query(x0, z0, x1, z1, fn) {
		const c = this.cell, stamp = ++this.stamp, key = this.stampKey;
		for (let i = Math.floor(x0 / c); i <= Math.floor(x1 / c); i++) {
			for (let j = Math.floor(z0 / c); j <= Math.floor(z1 / c); j++) {
				const list = this.cells.get(Grid.key(i, j));
				if (!list) continue;
				for (const rec of list) {
					if (rec[key] === stamp) continue;
					rec[key] = stamp;
					const r = fn(rec);
					if (r) return r;
				}
			}
		}
		return null;
	}
}

// ---------------------------------------------------------------------------------------------------------------
// Value noise for the large irregular grass patches (own copy: kit.js pulls in three)

function hash2(ix, iz, seed) {
	let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed | 0, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function vnoise(x, z, seed = 0) {
	const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
	const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
	return lerp(lerp(hash2(ix, iz, seed), hash2(ix + 1, iz, seed), u), lerp(hash2(ix, iz + 1, seed), hash2(ix + 1, iz + 1, seed), u), v);
}
/** Large, irregular, warped patches with soft broken edges and holes; 0..1 (§4.7 mảng lớn không đều, không viền tròn). */
export function patchField(x, z, seed) {
	const wx = x + (vnoise(x * 0.05 + 11.3, z * 0.05, seed + 1) - 0.5) * 22, wz = z + (vnoise(x * 0.05, z * 0.05 + 7.9, seed + 2) - 0.5) * 22;
	let p = 0.55 * vnoise(wx * 0.045, wz * 0.045, seed + 3) + 0.3 * vnoise(wx * 0.11, wz * 0.11, seed + 4) + 0.15 * vnoise(wx * 0.31, wz * 0.31, seed + 5);
	p = clamp((p - 0.5) * 1.9 + 0.55, 0, 1);
	const hole = smooth(0.7, 0.86, vnoise(x * 0.33, z * 0.33, seed + 6));
	return clamp(p * (1 - 0.9 * hole), 0, 1);
}

// ---------------------------------------------------------------------------------------------------------------
// Plan preparation (step 0 and the data of step 1): zones, segment index, reserved play space

const DEFAULT_ZONE_PROFILE = Object.freeze({ grass: 1, shrubs: 1, tall: true, mass: { rock: 1, tree: 1 }, guide: 'natural', lit: false, yard: 0, bonesMul: 1, tone: 0.2 });

function normaliseGround(fn) {
	return (x, z) => {
		const g = fn(x, z) ?? {};
		return { height: g.height ?? 0, wet: g.wet ?? 0, grass: g.grass ?? 0, blood: g.blood ?? 0, rock: g.rock ?? 0, water: typeof g.water === 'number' ? g.water > 0 : !!g.water };
	};
}

const unit = (x, z) => {
	const l = Math.hypot(x, z) || 1;
	return { x: x / l, z: z / l };
};

function shapeFromPlan(s) {
	if (Array.isArray(s)) return { t: 'poly', pts: s.map((p) => ({ x: p.x, z: p.z })) };
	if (s.r !== undefined) return { t: 'circle', x: s.x, z: s.z, r: s.r };
	return { t: 'poly', pts: s.points.map((p) => ({ x: p.x, z: p.z })) };
}

function rectPoly(r) {
	if (r.x0 !== undefined) return [{ x: r.x0, z: r.z0 }, { x: r.x1, z: r.z0 }, { x: r.x1, z: r.z1 }, { x: r.x0, z: r.z1 }];
	return makeObb(r.x, r.z, r.w / 2, r.d / 2, r.yaw ?? 0).pts;
}

/** The plan with everything the algorithm and the validator derive from it (shared by layoutBiome and validateLayout). */
export function preparePlan(plan, rules = LAYOUT_RULES) {
	const bounds = plan.bounds;
	const cam = plan.camera ?? {};
	const forward = unit((cam.forward ?? UNITS.CAMERA.forward).x, (cam.forward ?? UNITS.CAMERA.forward).z);
	const pitch = cam.pitch ?? UNITS.CAMERA.pitch;
	const screen = { ...UNITS.CAMERA.screen, ...(cam.screen ?? {}) };
	const camera = { forward, right: { x: -forward.z, z: forward.x }, pitch, screen, depth: screen.h / Math.sin(pitch), sweepK: 1 / Math.tan(pitch) };
	const P = {
		plan, bounds, camera, rules, ground: normaliseGround(plan.ground ?? (() => ({}))), defaultZone: plan.defaultZone ?? 'moor',
		zones: [], paths: [], water: [], doors: [], interactions: [], spawns: [], arenas: [], warnings: [],
		reserved: [], reservedGrid: new Grid(6), pathGrid: new Grid(4), waterGrid: new Grid(4), pathSamples: new Grid(4), mainPath: null,
	};
	const reserve = (kind, id, shape, clear, extra = {}) => {
		const r = { kind, id, ...shape, clear, ...extra };
		const b = shapeBox(r);
		P.reserved.push(r);
		P.reservedGrid.insert(r, b.x0 - clear, b.z0 - clear, b.x1 + clear, b.z1 + clear);
		return r;
	};

	for (const z of plan.zones ?? []) {
		const shape = shapeFromPlan(z.shape);
		P.zones.push({ id: z.id, kind: z.kind, shape, box: shapeBox(shape), rows: z.rows ?? null });
	}

	// paths: centre line segments with arclength, exact distance by a grid-hashed segment index
	for (const p of plan.paths ?? []) {
		const kind = p.kind ?? 'trail';
		const width = p.width ?? rules.pathWidth[kind] ?? 2.4;
		const path = { id: p.id, kind, width, half: width / 2, points: p.points.map((q) => ({ x: q.x, z: q.z })), segs: [], length: 0, inhabited: p.inhabited ?? (kind === 'road' || kind === 'branch'), walkable: kind !== 'animal', ruts: null };
		for (let i = 0; i + 1 < path.points.length; i++) {
			const a = path.points[i], b = path.points[i + 1];
			const seg = { a, b, len: Math.hypot(b.x - a.x, b.z - a.z), s0: path.length, path };
			path.segs.push(seg);
			path.length += seg.len;
		}
		if (p.ruts) {
			const r = p.ruts === true ? {} : p.ruts;
			const gap = r.gap ?? rules.rutGap, w = r.width ?? rules.rutWidth;
			path.ruts = { s0: r.s0 ?? 0, s1: r.s1 ?? path.length, gap, width: w, stripHalf: gap / 2 - w / 2 };
		}
		P.paths.push(path);
		for (const seg of path.segs) {
			P.pathGrid.insert(seg, Math.min(seg.a.x, seg.b.x) - path.half, Math.min(seg.a.z, seg.b.z) - path.half, Math.max(seg.a.x, seg.b.x) + path.half, Math.max(seg.a.z, seg.b.z) + path.half);
			reserve('path', path.id, { t: 'capsule', a: seg.a, b: seg.b, r: path.half }, rules.pathClear, { pathId: path.id });
		}
		if (path.walkable) {
			for (let s = 0; s <= path.length + 1e-6; s += rules.pathSample) {
				const at = pointAt(path, Math.min(s, path.length));
				P.pathSamples.insert({ x: at.x, z: at.z, path: path.id, s }, at.x, at.z, at.x, at.z);
			}
		}
	}
	P.mainPath = P.paths.filter((p) => p.kind === 'road').sort((a, b) => b.length - a.length)[0] ?? P.paths.filter((p) => p.walkable).sort((a, b) => b.length - a.length)[0] ?? null;

	// water: creeks are polylines with width, ponds polygons
	for (const w of plan.water ?? []) {
		const pts = (w.polygon ?? w.points).map((q) => ({ x: q.x, z: q.z }));
		const entry = { id: w.id, pond: !!w.polygon, width: w.width ?? 0, points: pts, shapes: [] };
		if (entry.pond) entry.shapes.push({ t: 'poly', pts });
		else for (let i = 0; i + 1 < pts.length; i++) entry.shapes.push({ t: 'capsule', a: pts[i], b: pts[i + 1], r: entry.width / 2 });
		for (const s of entry.shapes) {
			const b = shapeBox(s);
			P.waterGrid.insert({ ...s, id: w.id }, b.x0, b.z0, b.x1, b.z1);
			reserve('water', w.id, s, rules.waterClear);
		}
		P.water.push(entry);
	}

	for (const d of plan.doors ?? []) {
		const kind = d.kind ?? 'door';
		const size = rules.doorSize[kind] ?? rules.doorSize.door;
		const door = { id: d.id, at: d.at, yaw: d.yaw ?? 0, width: d.width ?? size.width, depth: d.depth ?? size.depth, kind, important: d.important ?? kind === 'gate' };
		const eps = rules.doorEps;
		const centre = toWorld(door.at.x, door.at.z, door.yaw, 0, eps + (door.depth - eps) / 2);
		door.corridor = makeObb(centre.x, centre.z, door.width / 2, (door.depth - eps) / 2, door.yaw);
		door.front = { x: Math.sin(door.yaw), z: Math.cos(door.yaw) };
		P.doors.push(door);
		reserve('door', door.id, { t: 'poly', pts: door.corridor.pts }, rules.doorClear);
	}
	for (const i of plan.interactions ?? []) {
		P.interactions.push(i);
		reserve('interaction', i.id, { t: 'circle', x: i.at.x, z: i.at.z, r: i.radius }, rules.interactionClear);
	}
	for (const s of plan.spawns ?? []) {
		P.spawns.push(s);
		reserve('spawn', s.id, { t: 'circle', x: s.at.x, z: s.at.z, r: s.radius }, rules.spawnClear);
	}
	for (const a of plan.arenas ?? []) {
		const shape = a.rect ? { t: 'poly', pts: rectPoly(a.rect) } : { t: 'circle', x: a.at.x, z: a.at.z, r: a.r };
		P.arenas.push({ id: a.id, shape });
		reserve('arena', a.id, shape, rules.arenaClear);
	}

	// plan checks (§4.3, §5.1): the numbers the art direction gives for the play space
	for (const p of P.paths) if (p.kind === 'road' && p.width < rules.mainPathMin) P.warnings.push({ code: 'plan.mainPath', id: p.id, message: `main path ${p.width} m < ${round3(rules.mainPathMin)} m (3 Sub)` });
	for (const d of P.doors) if (d.width < rules.doorMin) P.warnings.push({ code: 'plan.door', id: d.id, message: `door ${d.width} m < ${round3(rules.doorMin)} m (2 Sub)` });
	for (const a of P.arenas) {
		const size = a.shape.t === 'circle' ? a.shape.r * 2 : Math.min(bboxOf(a.shape.pts).x1 - bboxOf(a.shape.pts).x0, bboxOf(a.shape.pts).z1 - bboxOf(a.shape.pts).z0);
		if (size < rules.arenaMin) P.warnings.push({ code: 'plan.arena', id: a.id, message: `arena ${round3(size)} m < ${round3(rules.arenaMin)} m (8 Sub)` });
	}
	return P;
}

/** Point on a path at arclength s: { x, z, tx, tz } (unit tangent along the path). */
export function pointAt(path, s) {
	const segs = path.segs;
	if (!segs.length) return { x: path.points[0].x, z: path.points[0].z, tx: 1, tz: 0 };
	let seg = segs[segs.length - 1];
	for (const q of segs) if (s <= q.s0 + q.len) { seg = q; break; }
	const t = seg.len ? clamp((s - seg.s0) / seg.len, 0, 1) : 0;
	const tx = seg.len ? (seg.b.x - seg.a.x) / seg.len : 1, tz = seg.len ? (seg.b.z - seg.a.z) / seg.len : 0;
	return { x: seg.a.x + (seg.b.x - seg.a.x) * t, z: seg.a.z + (seg.b.z - seg.a.z) * t, tx, tz };
}

/** Nearest corridor: { path, seg, d (to the centre line), edge (d − half width, negative inside), s }. */
export function nearestPath(P, x, z, R, pred = null) {
	let best = null;
	P.pathGrid.query(x - R, z - R, x + R, z + R, (seg) => {
		if (pred && !pred(seg.path)) return null;
		const dx = seg.b.x - seg.a.x, dz = seg.b.z - seg.a.z;
		const t = clamp(((x - seg.a.x) * dx + (z - seg.a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
		const d = segmentDistance(x, z, seg.a, seg.b);
		const edge = d - seg.path.half;
		if (!best || edge < best.edge) best = { path: seg.path, seg, d, edge, s: seg.s0 + t * seg.len, t };
		return null;
	});
	return best;
}

/** Signed distance from (x, z) to the nearest water edge within R (negative = in the water); Infinity beyond R. */
export function waterEdge(P, x, z, R = 8) {
	let best = Infinity;
	P.waterGrid.query(x - R, z - R, x + R, z + R, (s) => {
		best = Math.min(best, pointShapeGap(s, x, z));
		return null;
	});
	return best;
}

export function zoneAt(P, x, z) {
	for (let i = P.zones.length - 1; i >= 0; i--) {
		const zn = P.zones[i];
		if (x < zn.box.x0 || x > zn.box.x1 || z < zn.box.z0 || z > zn.box.z1) continue;
		if (zn.shape.t === 'circle' ? Math.hypot(x - zn.shape.x, z - zn.shape.z) <= zn.shape.r : pointInPoly(zn.shape.pts, x, z)) return zn;
	}
	return { id: 'default', kind: P.defaultZone, shape: null, rows: null };
}

/** Occlusion polygon of a tall piece (§5.2, §4.3): its footprint (+ crown) swept along the camera's forward by height / tan(pitch). */
export function occlusionPolygon(P, fp, crown, height) {
	const L = height * P.camera.sweepK, f = P.camera.forward;
	const base = crown ? makeObb(fp.cx, fp.cz, fp.hx + crown, fp.hz + crown, fp.yaw) : fp;
	const pts = [];
	for (const p of base.pts) pts.push(p, { x: p.x + f.x * L, z: p.z + f.z * L });
	return convexHull(pts);
}

/** Screen window centred at (x, z): the ground rectangle the iso camera sees (width across, depth along `forward`). */
export function screenWindow(P, x, z) {
	const c = P.camera;
	return { cx: x, cz: z, hw: c.screen.w / 2, hd: c.depth / 2, poly: makeObb(x, z, c.screen.w / 2, c.depth / 2, Math.atan2(-c.right.z, c.right.x)).pts };
}

/** Ground-cell mask of the union of polygons over `bounds` (cell metres); used for the §4.3 occlusion share. */
export function rasterPolys(bounds, cell, polys) {
	const nx = Math.ceil((bounds.x1 - bounds.x0) / cell), nz = Math.ceil((bounds.z1 - bounds.z0) / cell);
	const mask = new Uint8Array(nx * nz);
	for (const poly of polys) {
		const b = bboxOf(poly);
		for (let j = Math.max(0, Math.floor((b.z0 - bounds.z0) / cell)); j <= Math.min(nz - 1, Math.floor((b.z1 - bounds.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((b.x0 - bounds.x0) / cell)); i <= Math.min(nx - 1, Math.floor((b.x1 - bounds.x0) / cell)); i++) {
				if (!mask[j * nx + i] && pointInPoly(poly, bounds.x0 + (i + 0.5) * cell, bounds.z0 + (j + 0.5) * cell)) mask[j * nx + i] = 1;
			}
		}
	}
	return { mask, nx, nz, cell, bounds };
}

/** Covered share of a screen window by a rasterised mask. */
export function windowCoverage(raster, win) {
	const { mask, nx, nz, cell, bounds } = raster;
	const b = bboxOf(win.poly);
	let inside = 0, covered = 0;
	for (let j = Math.max(0, Math.floor((b.z0 - bounds.z0) / cell)); j <= Math.min(nz - 1, Math.floor((b.z1 - bounds.z0) / cell)); j++) {
		for (let i = Math.max(0, Math.floor((b.x0 - bounds.x0) / cell)); i <= Math.min(nx - 1, Math.floor((b.x1 - bounds.x0) / cell)); i++) {
			if (!pointInPoly(win.poly, bounds.x0 + (i + 0.5) * cell, bounds.z0 + (j + 0.5) * cell)) continue;
			inside++;
			covered += mask[j * nx + i];
		}
	}
	return inside ? covered / inside : 0;
}

/** Window centres every `step` metres along the walkable paths, plus the play-critical points (doors, interactions, arenas). */
export function windowCentres(P, step) {
	const out = [];
	for (const path of P.paths) {
		if (!path.walkable) continue;
		for (let s = 0; s <= path.length + 1e-6; s += step) out.push({ ...pointAt(path, Math.min(s, path.length)), path: path.id, s });
	}
	for (const d of P.doors) out.push({ x: d.at.x + d.front.x * d.depth / 2, z: d.at.z + d.front.z * d.depth / 2, path: d.id, s: 0 });
	for (const i of P.interactions) out.push({ x: i.at.x, z: i.at.z, path: i.id, s: 0 });
	for (const a of P.arenas) out.push({ x: a.shape.t === 'circle' ? a.shape.x : (bboxOf(a.shape.pts).x0 + bboxOf(a.shape.pts).x1) / 2, z: a.shape.t === 'circle' ? a.shape.z : (bboxOf(a.shape.pts).z0 + bboxOf(a.shape.pts).z1) / 2, path: a.id, s: 0 });
	return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Placement classes

export const CHECK_ORDER = Object.freeze(['play', 'footprint', 'ground', 'distribution']);
const EPS = 1e-3;

/** The 9 ground samples of a footprint: centre, corners, edge midpoints. */
function footprintSamples(fp) {
	const p = fp.pts;
	const pts = [{ x: fp.cx, z: fp.cz }, ...p];
	for (let i = 0; i < 4; i++) pts.push({ x: (p[i].x + p[(i + 1) % 4].x) / 2, z: (p[i].z + p[(i + 1) % 4].z) / 2 });
	return pts;
}

const classOfPlacement = (a) => {
	if (a.role === 'guide') return 'guide';
	if (a.role === 'hazard') return 'hazard';
	if (a.role === 'interactive') return 'interactive';
	if (a.collision) return a.destructible ? 'destructible' : 'obstacle';
	return 'decor';
};

// ---------------------------------------------------------------------------------------------------------------
// The engine core: candidates are checked at their final position in the §4.12 order, committed, or dropped with a reason

const PROCEDURAL = Object.freeze({
	id: 'procedural', kit: null, piece: null, zones: [], role: 'obstacle', layer: 'tall', size: 'large', use: null, front: 0, scale: [1, 1],
	substrates: ['water', 'mud', 'rock', 'blood', 'grass', 'dirt'], maxSlope: 99, maxStep: 99, align: 'upright', sink: 0, natural: false, collision: true,
	destructible: false, host: null, crown: 0, light: null, fallback: [], feet: false, procedural: true,
});

/**
 * Pseudo-asset of an authored mass given only by a footprint and a height (a procedural house in the scene). `collision: false` makes it
 * walk-through decor (a carcass, a rug of bones): class decor, role ground, layer low, no camera shadow, not a blocker for the gap and
 * passability checks; other pieces still may not stand on its footprint (it is a solid for the overlap check, like a corpse piece).
 */
export function proceduralAsset(m, rules = LAYOUT_RULES) {
	const w = m.footprint.w, d = m.footprint.d;
	const walk = m.collision === false ? { collision: false, role: 'ground', layer: 'low', occludes: 0 } : null;
	return { ...PROCEDURAL, id: `procedural.${m.kind ?? 'building'}`, kind: m.kind, footprint: { x0: -w / 2, x1: w / 2, z0: -d / 2, z1: d / 2 }, full: { x0: -w / 2, x1: w / 2, z0: -d / 2, z1: d / 2 }, height: m.height, occludes: m.height, layer: m.height >= rules.landmarkHeight ? 'landmark' : 'tall', ...walk };
}

export class Layout {
	constructor(plan, catalog, options = {}) {
		this.plan = plan;
		this.catalog = catalog;
		this.R = { ...LAYOUT_RULES, ...(options.rules ?? {}) };
		this.seeds = { ...DEFAULT_OPTIONS.seeds, ...(options.seeds ?? {}) };
		this.density = { ...DEFAULT_OPTIONS.density, ...(options.density ?? {}) };
		this.budgets = { ...DEFAULT_OPTIONS.budgets, ...(options.budgets ?? {}) };
		this.P = preparePlan(plan, this.R);
		const b = this.P.bounds, area = (b.x1 - b.x0) * (b.z1 - b.z0);
		if (this.budgets.masses == null) this.budgets.masses = Math.max(0, Math.round(area * this.R.massBudgetPerArea * this.density.masses));
		// tufts and shrubs: the default budget grows with the plan area, so a big map is not cut off by a number made for 128 × 128 m
		if (options.budgets?.tufts == null) this.budgets.tufts = Math.max(this.budgets.tufts, Math.round(area * this.R.tuftsPerArea));
		if (options.budgets?.shrubs == null) this.budgets.shrubs = Math.max(this.budgets.shrubs, Math.round(area * this.R.shrubsPerArea));
		this.bounds = b;
		this.solids = new Grid(4);
		this.placements = [];
		this.byId = new Map();
		this.drops = [];
		this.warnings = this.P.warnings.slice();
		this.tries = { total: 0, budget: 0, maxPerItem: 0, perGroup: {} };
		this.tryLog = options.logTries ? [] : null; // [group, item, tries used, item maxTries] per placeItem call (tests; off by default)
		this.bareHosts = []; // rest points of placed cluster hosts with their `bare` radius: other clusters stay out of it
		this.warned = new Set();
		this.counts = { step: {}, group: {}, role: {} };
		this.mains = []; // centres of auto-mass compositions (massSpacing)
		this.clusters = [];
		this.events = [];
		this.decisions = [];
		this.groundPaint = [];
		this.ms = {};
		this.initOcclusion();
	}

	/**
	 * The §4.3 occlusion share kept as a rule, not only checked afterwards: a union mask of every tall piece's occlusion
	 * polygon, and per screen window (along the paths, at doors, interactions, arenas) how much of it is covered.
	 */
	initOcclusion() {
		const P = this.P, R = this.R;
		const cell = R.occRaster, b = P.bounds, nx = Math.ceil((b.x1 - b.x0) / cell), nz = Math.ceil((b.z1 - b.z0) / cell);
		this.occ = { cell, nx, nz, mask: new Uint8Array(nx * nz) };
		this.occWindows = windowCentres(P, R.windowStep).map((c) => {
			const win = screenWindow(P, c.x, c.z), box = bboxOf(win.poly);
			let total = 0;
			for (let j = Math.max(0, Math.floor((box.z0 - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((box.z1 - b.z0) / cell)); j++) {
				for (let i = Math.max(0, Math.floor((box.x0 - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((box.x1 - b.x0) / cell)); i++) if (pointInPoly(win.poly, b.x0 + (i + 0.5) * cell, b.z0 + (j + 0.5) * cell)) total++;
			}
			return { poly: win.poly, box, total, covered: 0 };
		});
	}

	/** Cells a polygon would newly cover: [{ idx, x, z }]. */
	occGain(poly) {
		const { cell, nx, nz, mask } = this.occ, b = this.bounds, pb = bboxOf(poly), out = [];
		for (let j = Math.max(0, Math.floor((pb.z0 - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((pb.z1 - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((pb.x0 - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((pb.x1 - b.x0) / cell)); i++) {
				if (mask[j * nx + i]) continue;
				const x = b.x0 + (i + 0.5) * cell, z = b.z0 + (j + 0.5) * cell;
				if (pointInPoly(poly, x, z)) out.push({ idx: j * nx + i, x, z });
			}
		}
		return out;
	}

	/** The window that would exceed the share if `gain` were added, or null. */
	occOver(gain) {
		if (!gain.length) return null;
		for (const w of this.occWindows) {
			let add = 0;
			for (const g of gain) if (g.x >= w.box.x0 && g.x <= w.box.x1 && g.z >= w.box.z0 && g.z <= w.box.z1 && pointInPoly(w.poly, g.x, g.z)) add++;
			if (add && (w.covered + add) / w.total > this.R.occlusionMax) return w;
		}
		return null;
	}

	occAdd(poly) {
		const gain = this.occGain(poly);
		for (const g of gain) this.occ.mask[g.idx] = 1;
		for (const w of this.occWindows) {
			for (const g of gain) if (g.x >= w.box.x0 && g.x <= w.box.x1 && g.z >= w.box.z0 && g.z <= w.box.z1 && pointInPoly(w.poly, g.x, g.z)) w.covered++;
		}
	}

	stream(group, key) { return new Stream(hash32(this.plan.seed ?? 1, this.seeds[group] ?? 0, key)); }
	sample(x, z) { return this.P.ground(x, z); }
	zoneAt(x, z) { return zoneAt(this.P, x, z); }
	profile(kind) { return this.catalog.zones?.[kind] ?? DEFAULT_ZONE_PROFILE; }

	slopeAt(x, z, e = this.R.slopeProbe) {
		const g = this.P.ground;
		return Math.hypot(g(x + e, z).height - g(x - e, z).height, g(x, z + e).height - g(x, z - e).height) / (2 * e);
	}

	/** Ground class from the painted layers (water | mud | rock | blood | grass | dirt). */
	classOf(g, slope = 0) {
		const R = this.R;
		if (g.water) return 'water';
		if (g.wet >= R.mudWet) return 'mud';
		if (g.rock >= R.rockMin || slope >= R.rockSlope) return 'rock';
		if (g.blood >= R.bloodMin) return 'blood';
		return g.grass >= R.grassMin ? 'grass' : 'dirt';
	}

	candidate(asset, x, z, yaw, scale, extra = {}) {
		const fp = footprintObb(asset.footprint, x, z, yaw, scale);
		return { asset, x, z, yaw, scale, fp, use: asset.use ? useObb(asset.footprint, asset.use, x, z, yaw, scale) : null, ...extra };
	}

	/** Camera occlusion zone: the footprint swept along `forward`; a crowned piece (tree) sweeps its scaled full box, canopy included. */
	occlusionOf(c) {
		if (c.occ) return c.occ;
		const a = c.asset, base = a.crown && a.full ? footprintObb(a.full, c.x, c.z, c.yaw, c.scale) : c.fp;
		return (c.occ = occlusionPolygon(this.P, base, 0, a.occludes * c.scale));
	}

	isTall(c) { return c.asset.occludes * c.scale >= this.R.tallMin; }

	/** The §4.12 check order at the candidate's final position. Returns null when it fits, else { reason: class, detail }. */
	evaluate(c) {
		const R = this.R, a = c.asset, fp = c.fp, b = this.bounds, P = this.P;
		const fail = (reason, detail) => ({ reason, detail });
		// 1 · play space: bounds, then path / door / interaction / spawn / arena / water, then the camera
		if (fp.x0 < b.x0 + R.edgeMargin || fp.x1 > b.x1 - R.edgeMargin || fp.z0 < b.z0 + R.edgeMargin || fp.z1 > b.z1 - R.edgeMargin) return fail('play', 'bounds');
		const hit = P.reservedGrid.query(fp.x0, fp.z0, fp.x1, fp.z1, (r) => {
			if (r.id === c.ownsReserved) return null;
			if (r.kind === 'arena' && a.layer === 'decal' && R.arenaDecals) return null;
			return shapeGap(r, fp.pts) < (c.authored ? -EPS : r.clear) ? r : null; // an authored mass may touch a corridor (gap 0), never enter it
		});
		if (hit) return fail('play', `${hit.kind}:${hit.id}`);
		if (!c.authored && this.isTall(c)) {
			const occ = this.occlusionOf(c), ob = bboxOf(occ);
			const covered = P.reservedGrid.query(ob.x0, ob.z0, ob.x1, ob.z1, (r) => (r.id !== c.ownsReserved && !(r.kind === 'door' && r.id === c.shadeDoor) && (r.kind === 'interaction' || r.kind === 'spawn' || r.kind === 'door' || r.kind === 'arena') && shapeGap(r, occ) < 0 ? r : null));
			if (covered) return fail('play', `occlusion:${covered.kind}:${covered.id}`);
			let near = 0, hidden = 0;
			P.pathSamples.query(fp.cx - R.occludeNear, fp.cz - R.occludeNear, fp.cx + R.occludeNear, fp.cz + R.occludeNear, (s) => {
				if (Math.hypot(s.x - fp.cx, s.z - fp.cz) > R.occludeNear) return null;
				near++;
				if (pointInPoly(occ, s.x, s.z)) hidden++;
				return null;
			});
			if (near >= R.occludeMinSamples && hidden / near > R.occludePathMax) return fail('play', 'occlusion:path');
		}
		// 2 · footprints and use zones
		const decal = a.layer === 'decal';
		const qb = c.use ? { x0: Math.min(fp.x0, c.use.x0), z0: Math.min(fp.z0, c.use.z0), x1: Math.max(fp.x1, c.use.x1), z1: Math.max(fp.z1, c.use.z1) } : fp;
		const overlap = this.solids.query(qb.x0, qb.z0, qb.x1, qb.z1, (s) => {
			if (c.ignore && c.ignore.has(s.id)) return null;
			if ((decal || !s.decal) && obbSeparation(fp, s.fp) < -EPS) return `overlap:${s.id}`;
			if (!decal && !s.decal) {
				if (s.use && obbSeparation(fp, s.use) < -EPS) return `use:${s.id}`;
				if (c.use && obbSeparation(c.use, s.fp) < -EPS) return `use-of-self:${s.id}`;
			}
			return null;
		});
		if (overlap) return fail('footprint', overlap);
		// 3 · water / slope / step / substrate / corruption / zone, at the final position
		const pts = footprintSamples(fp);
		let hMin = Infinity, hMax = -Infinity;
		const classes = [];
		for (let i = 0; i < pts.length; i++) {
			const g = this.sample(pts[i].x, pts[i].z);
			if (!Number.isFinite(g.height)) return fail('ground', 'height');
			if (g.water && !a.substrates.includes('water')) return fail('ground', 'water');
			hMin = Math.min(hMin, g.height);
			hMax = Math.max(hMax, g.height);
			if (i < 5) classes.push(this.classOf(g, i === 0 ? this.slopeAt(fp.cx, fp.cz) : 0));
		}
		if (this.slopeAt(c.x, c.z) > a.maxSlope) return fail('ground', 'slope');
		if (hMax - hMin > a.maxStep) return fail('ground', 'step');
		for (const cls of classes) if (cls !== 'blood' && !a.substrates.includes(cls)) return fail('ground', `substrate:${cls}`);
		if (classes.includes('blood') && !a.substrates.includes('blood')) return fail('ground', 'corruption');
		if (a.zones.length && !c.anyZone) {
			const zn = this.zoneAt(c.x, c.z);
			if (!a.zones.includes(zn.kind)) return fail('ground', `zone:${zn.kind}`);
		}
		c.hMin = hMin;
		// 4 · distribution: gaps between blockers, then the caller's own rules (torch gap, cluster spacing, event gap, lean …)
		if (a.collision && !c.noGap) {
			const pad = R.passGap;
			const tooClose = this.solids.query(fp.x0 - pad, fp.z0 - pad, fp.x1 + pad, fp.z1 + pad, (s) => {
				if (!s.blocks || (c.ignore && c.ignore.has(s.id))) return null;
				const same = (c.owner && s.owner === c.owner) || (c.cluster && s.clusters?.has(c.cluster));
				return obbGap(fp, s.fp) < (same ? R.clusterGap : R.passGap) ? `${same ? 'cluster-gap' : 'gap'}:${s.id}` : null;
			});
			if (tooClose) return fail('distribution', tooClose);
		}
		// §4.11 open ground between clusters: whatever is not a decal keeps clusterClear from another cluster's pieces and
		// stays outside the bare radius round another host (and a host keeps the pieces already there out of its own)
		if (c.cluster && !decal) {
			const clear = R.clusterClear;
			const crowded = this.solids.query(fp.x0 - clear, fp.z0 - clear, fp.x1 + clear, fp.z1 + clear, (s) => {
				if (!s.clusters || s.decal || s.clusters.has(c.cluster) || (c.ignore && c.ignore.has(s.id))) return null;
				return obbGap(fp, s.fp) < clear ? `cluster-clear:${s.id}` : null;
			});
			if (crowded) return fail('distribution', crowded);
			for (const h of this.bareHosts) if (h.cluster !== c.cluster && pointPolySigned(fp.pts, h.x, h.z) < h.r) return fail('distribution', `cluster-bare:${h.cluster}`);
			if (c.hostBare > 0) {
				const r = c.hostBare, x = fp.cx, z = fp.cz;
				const inside = this.solids.query(x - r - 6, z - r - 6, x + r + 6, z + r + 6, (s) => (s.clusters && !s.decal && !s.clusters.has(c.cluster) && pointPolySigned(s.fp.pts, x, z) < r ? `cluster-bare:${s.id}` : null));
				if (inside) return fail('distribution', inside);
			}
		}
		if (!c.authored && !c.noRegister && this.isTall(c)) {
			const w = this.occOver(this.occGain(this.occlusionOf(c)));
			if (w) return fail('distribution', 'occlusion-share');
		}
		// §4.9 light budget kept as a rule: a lit piece never pushes a screen window past maxLightsPerScreen (a gate pair is designed and always stands)
		if (a.light && !c.designed && this.lightOver(toWorld(c.x, c.z, c.yaw, a.light[0] * c.scale, a.light[2] * c.scale))) return fail('distribution', 'light-budget');
		for (const rule of c.rules ?? []) {
			const detail = rule(c);
			if (detail) return fail('distribution', detail);
		}
		return null;
	}

	/** Where the gate pairs (§4.9) will stand: two lights either side of every important door whose guide table has lit pair pieces. */
	pairLights() {
		if (this._pairLights) return this._pairLights;
		const R = this.R, out = this._pairLights = [];
		for (const door of this.P.doors) {
			if (!door.important) continue;
			const table = this.catalog.guides?.[guidePolicy(this, { x: door.at.x, z: door.at.z, path: null }).policy];
			if (!table?.pair?.some((id) => this.catalog.get(id)?.light)) continue;
			const f = Math.max(R.gateFront[0], door.depth * R.gateFront[1] * 0.5), lateral = door.width / 2 + R.doorClear + 0.4;
			for (const side of [1, -1]) out.push({ pair: `door:${door.id}`, side, x: door.at.x + door.front.x * f + door.front.z * lateral * side, z: door.at.z + door.front.z * f - door.front.x * lateral * side });
		}
		return out;
	}

	/** The screen window whose light count would pass maxLightsPerScreen if one more light stood at `pt`, or null. Gate pairs not placed yet count already. */
	lightOver(pt) {
		let lights = null;
		for (const w of this.occWindows) {
			if (pt.x < w.box.x0 || pt.x > w.box.x1 || pt.z < w.box.z0 || pt.z > w.box.z1 || !pointInPoly(w.poly, pt.x, pt.z)) continue;
			lights ??= this.placements.filter((p) => p.light).map((p) => p.light).concat(this.pairLights().filter((r) => !this.placements.some((p) => p.pair === r.pair && p.side === r.side)));
			if (lights.filter((q) => pointInPoly(w.poly, q.x, q.z)).length + 1 > this.R.maxLightsPerScreen) return w;
		}
		return null;
	}

	/** Register a candidate that passed evaluate(): y from the ground under it, tilt for slope-aligned pieces, light, solids. */
	commit(c, meta) {
		const R = this.R, a = c.asset, fp = c.fp;
		const sinkM = a.procedural ? 0 : Math.max(R.minSink, a.sink * a.height * c.scale);
		let y, tilt;
		if (a.align === 'slope') {
			const e = Math.max(R.tiltProbe[0], Math.max(fp.hx, fp.hz) * R.tiltProbe[1]), g = this.P.ground;
			const nx = g(c.x - e, c.z).height - g(c.x + e, c.z).height, nz = g(c.x, c.z - e).height - g(c.x, c.z + e).height, l = Math.hypot(nx, 2 * e, nz);
			tilt = { x: round3(nx / l), y: round3((2 * e) / l), z: round3(nz / l) };
			y = g(c.x, c.z).height - sinkM;
		} else {
			y = (c.hMin ?? this.sample(c.x, c.z).height) - sinkM;
		}
		const p = {
			id: meta.id, asset: a.id, kit: a.kit, piece: a.piece, group: meta.group, step: meta.step, role: meta.role ?? a.role, layer: a.layer, class: classOfPlacement({ ...a, role: meta.role ?? a.role }),
			x: round3(c.x), y: round3(y), z: round3(c.z), yaw: round3(c.yaw), scale: round3(c.scale),
			footprint: obbData(fp), blocks: a.collision,
		};
		if (tilt) p.tilt = tilt;
		if (c.use) p.use = obbData(c.use);
		if (this.isTall(c)) {
			p.occlusion = this.occlusionOf(c).map((q) => ({ x: round3(q.x), z: round3(q.z) }));
			if (!c.noRegister) this.occAdd(this.occlusionOf(c));
		}
		if (a.light) {
			const l = toWorld(c.x, c.z, c.yaw, a.light[0] * c.scale, a.light[2] * c.scale);
			p.light = { x: round3(l.x), y: round3(y + a.light[1] * c.scale), z: round3(l.z) };
		}
		if (a.procedural) { p.procedural = true; p.height = a.height; }
		else p.height = round3(a.height * c.scale);
		if (c.owner) p.owner = c.owner;
		if (c.ownsReserved) p.owns = c.ownsReserved;
		for (const k of ['host', 'cluster', 'event', 'decision', 'label', 'target', 'reach', 'tries', 'orient', 'authored', 'focal', 'pair', 'side', 'lean', 'mass', 'age', 'part']) if (meta[k] !== undefined) p[k] = meta[k];
		const rec = { id: p.id, fp, use: c.use, blocks: a.collision, decal: a.layer === 'decal', owner: c.owner ?? null, clusters: c.cluster ? new Set([c.cluster]) : null, group: meta.group, placement: p, asset: a };
		const qb = c.use ? { x0: Math.min(fp.x0, c.use.x0), z0: Math.min(fp.z0, c.use.z0), x1: Math.max(fp.x1, c.use.x1), z1: Math.max(fp.z1, c.use.z1) } : fp;
		if (!c.noRegister) {
			this.solids.insert(rec, qb.x0, qb.z0, qb.x1, qb.z1);
			this.placements.push(p);
			this.byId.set(p.id, rec);
			this.count(p);
		}
		return p;
	}

	count(p) {
		const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
		bump(this.counts.step, p.step);
		bump(this.counts.group, p.group);
		bump(this.counts.role, p.role);
	}

	/** Undo a transaction (an event that could not reach main + 2 secondary is dropped whole). */
	rollback(list) {
		for (const p of list) {
			const rec = this.byId.get(p.id);
			if (rec) this.solids.remove(rec);
			this.byId.delete(p.id);
			const at = this.placements.indexOf(p);
			if (at >= 0) this.placements.splice(at, 1);
			for (const [o, k] of [[this.counts.step, p.step], [this.counts.group, p.group], [this.counts.role, p.role]]) o[k]--;
		}
	}

	drop(item, reason, detail, at, asset, tries) {
		const d = { step: item.step, group: item.group, item: item.id ?? item.key, asset: asset ?? item.assets?.[0]?.id ?? null, reason, detail: detail ?? '', x: round3(at.x), z: round3(at.z) };
		if (tries !== undefined) d.tries = tries;
		this.drops.push(d);
	}

	/**
	 * Bounded search for one item: `maxTries` jittered positions inside the fixed `reach` of the target (the first one is the
	 * target itself), checked in the §4.12 order. The asset is `item.assets[0]`, the first one of the recipe entry that exists in
	 * the scene (catalog.resolve puts the fallbacks after every recipe alternative), so a fallback only appears when the
	 * recipe's own pieces are missing; a piece that does not fit goes to the next try or is dropped (§4.6 "đặt không vừa thì
	 * bỏ"). Nothing is forced: no fit, no placement, and the item is reported with the most frequent failing class as its reason.
	 */
	placeItem(item) {
		const R = this.R, tries = item.maxTries ?? R.maxTries, rng = item.rng, reach = item.reach;
		const g = (this.tries.perGroup[item.group] ??= { tries: 0, budget: 0, items: 0 });
		let used = 0;
		const log = () => this.tryLog?.push([item.group, item.id ?? item.key, used, tries]);
		const give = (reason, detail) => {
			log();
			if (item.silent) {
				const d = this.eco.stats.shrubDrops;
				d[reason] = (d[reason] ?? 0) + 1;
			} else this.drop(item, reason, detail, item.target, undefined, used);
			return null;
		};
		if (!item.assets.length) return give('unavailable', 'no asset of the recipe exists in this scene');
		g.budget += tries;
		g.items++;
		this.tries.budget += tries;
		const asset = item.assets[0], seen = new Map();
		for (let t = 0; t < tries; t++) {
			let x = item.target.x, z = item.target.z;
			if (t > 0) {
				const [dx, dz] = rng.disc(reach);
				x += dx;
				z += dz;
			}
			used = t + 1;
			g.tries++;
			this.tries.total++;
			this.tries.maxPerItem = Math.max(this.tries.maxPerItem, used);
			const spec = item.make(asset, { x, z }, rng, t);
			const c = this.candidate(asset, x, z, spec.yaw, spec.scale, { ...item.cand, ...spec, rules: item.rules });
			const r = this.evaluate(c);
			if (!r) {
				log();
				return this.commit(c, { ...item.meta, id: item.id, group: item.group, step: item.step, target: { x: round3(item.target.x), z: round3(item.target.z) }, reach, tries: used, ...(spec.meta ?? {}) });
			}
			const e = seen.get(r.reason) ?? { n: 0, detail: r.detail };
			e.n++;
			seen.set(r.reason, e);
		}
		let best = null;
		for (const reason of CHECK_ORDER) if (seen.has(reason) && (!best || seen.get(reason).n > seen.get(best).n)) best = reason;
		return give(best ?? 'play', seen.get(best)?.detail);
	}
}

// ---------------------------------------------------------------------------------------------------------------
// Step 1 · lock the play space (§4.6.1). The reserved shapes are built in preparePlan; this reports them for the scene

function reservedOutput(P) {
	const out = [];
	for (const p of P.paths) out.push({ kind: 'path', id: p.id, shape: { type: 'polyline', points: p.points.map((q) => ({ x: q.x, z: q.z })), width: p.width }, pathKind: p.kind });
	for (const w of P.water) out.push({ kind: 'water', id: w.id, shape: w.pond ? { type: 'polygon', points: w.points } : { type: 'polyline', points: w.points, width: w.width } });
	for (const d of P.doors) out.push({ kind: 'door', id: d.id, shape: { type: 'polygon', points: d.corridor.pts.map((q) => ({ x: round3(q.x), z: round3(q.z) })) }, doorKind: d.kind });
	for (const i of P.interactions) out.push({ kind: 'interaction', id: i.id, shape: { type: 'circle', x: i.at.x, z: i.at.z, r: i.radius } });
	for (const s of P.spawns) out.push({ kind: 'spawn', id: s.id, shape: { type: 'circle', x: s.at.x, z: s.at.z, r: s.radius } });
	for (const a of P.arenas) out.push({ kind: 'arena', id: a.id, shape: a.shape.t === 'circle' ? { type: 'circle', x: a.shape.x, z: a.shape.z, r: a.shape.r } : { type: 'polygon', points: a.shape.pts } });
	return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Step 2 · big masses (§4.6.2, §4.8 rocks/trees, §4.3 landmark rhythm, §5.2 occlusion)

const meanOf = (r) => (r[0] + r[1]) / 2;
/** Largest dimension of a piece at scale 1 (full box or height): the size used to compare a secondary with its main piece. */
const bigOf = (a) => Math.max(a.full.x1 - a.full.x0, a.full.z1 - a.full.z0, a.height);

/** Centres a mass or landmark keeps `hostKeepOut` away from: planned cluster hosts and events, so no mass takes the place of a cluster. */
function keepOutPoints(L) {
	return (L.plan.hosts ?? []).filter((h) => h.at).map((h) => h.at).concat((L.plan.events ?? []).filter((e) => e.at).map((e) => e.at));
}
const isLandmark = (R, p) => p.layer === 'landmark' || (p.blocks && p.height >= R.landmarkHeight);

function placeAuthoredMasses(L) {
	for (const m of L.plan.masses ?? []) {
		const id = `mass:${m.id}`;
		let asset, scale = 1;
		if (m.asset) {
			asset = L.catalog.resolve(m.asset)[0];
			if (!asset) {
				L.drop({ step: 2, group: 'mass', id }, 'unavailable', `${m.asset} and its fallbacks are not in this scene`, m.at, m.asset);
				continue;
			}
			scale = m.scale ?? meanOf(asset.scale);
		} else {
			asset = proceduralAsset(m, L.R);
			if (m.kind === 'cliff') asset = { ...asset, layer: 'edge' };
		}
		const c = L.candidate(asset, m.at.x, m.at.z, m.yaw ?? 0, scale, { authored: true, anyZone: true, owner: id, ownsReserved: m.owns, noGap: true });
		const r = L.evaluate(c);
		if (r) L.warnings.push({ code: 'authored.conflict', id: m.id, message: `${r.reason}: ${r.detail}` });
		L.commit(c, { id, group: 'mass', step: 2, authored: true, mass: m.id, part: 'main', focal: m.focal ? true : undefined, label: m.label, host: m.id });
	}
}

/** Bridson blue noise inside the bounds minus `margin` (radius r, 24 tries per point). One stream, so it never depends on anything placed. */
function poissonPoints(rng, b, r, margin) {
	const x0 = b.x0 + margin, z0 = b.z0 + margin, w = b.x1 - b.x0 - 2 * margin, d = b.z1 - b.z0 - 2 * margin;
	const cell = r / Math.SQRT2, gw = Math.ceil(w / cell), gh = Math.ceil(d / cell);
	const grid = new Int32Array(gw * gh).fill(-1), pts = [], active = [];
	const add = (x, z) => {
		pts.push({ x, z });
		grid[Math.floor((z - z0) / cell) * gw + Math.floor((x - x0) / cell)] = pts.length - 1;
		active.push(pts.length - 1);
	};
	add(x0 + rng.next() * w, z0 + rng.next() * d);
	while (active.length) {
		const at = Math.floor(rng.next() * active.length), p = pts[active[at]];
		let found = false;
		for (let k = 0; k < 24 && !found; k++) {
			const a = rng.next() * TAU, dd = r * (1 + rng.next());
			const x = p.x + Math.cos(a) * dd, z = p.z + Math.sin(a) * dd;
			if (x < x0 || x >= x0 + w || z < z0 || z >= z0 + d) continue;
			const gi = Math.floor((x - x0) / cell), gj = Math.floor((z - z0) / cell);
			let ok = true;
			for (let j = Math.max(0, gj - 2); j <= Math.min(gh - 1, gj + 2) && ok; j++) {
				for (let i = Math.max(0, gi - 2); i <= Math.min(gw - 1, gi + 2); i++) {
					const q = grid[j * gw + i];
					if (q >= 0 && Math.hypot(pts[q].x - x, pts[q].z - z) < r) { ok = false; break; }
				}
			}
			if (ok) { add(x, z); found = true; }
		}
		if (!found) active.splice(at, 1);
	}
	return pts;
}

const quant = (v) => Math.round(v * 2) / 2;

/** One auto mass composition: a main piece and 1–3 secondary of other sizes leaning to one side (§4.8). */
function placeComposition(L, cand) {
	const R = L.R, P = L.P, cat = L.catalog;
	const key = `${quant(cand.x)},${quant(cand.z)}`, owner = `mass:auto:${key}`;
	const rng = L.stream('mass', `comp:${key}`);
	const zone = L.zoneAt(cand.x, cand.z), profile = L.profile(zone.kind);
	const kindRock = (profile.mass?.rock ?? 0), kindTree = (profile.mass?.tree ?? 0);
	const g = L.sample(cand.x, cand.z);
	const kind = rng.next() * (kindRock + kindTree) < kindRock ? 'rock' : 'tree';
	let set, mainIds;
	if (kind === 'rock') {
		const damp = g.wet > R.damp.wet || g.grass > R.damp.grass || waterEdge(P, cand.x, cand.z, R.damp.water) < R.damp.water;
		set = cat.massSets.rock[damp ? 'mossy' : 'bare'];
		mainIds = cand.back >= R.backSide && rng.chance(R.massTall.rock) ? set.tall : set.main;
	} else {
		set = cat.massSets.tree[zone.kind === 'camp' || rng.chance(R.burnedChance) ? 'burned' : 'dead'];
		mainIds = cand.back >= R.backSide && rng.chance(R.massTall.tree) ? set.tall : set.main;
	}
	const list = cat.resolve(rng.pick(mainIds));
	if (!list.length) {
		L.drop({ step: 2, group: 'mass', id: `main:${key}` }, 'unavailable', 'no rock/tree kit loaded', cand);
		return false;
	}
	const scale0 = rng.range(list[0].scale[0], list[0].scale[1]);
	const yaw = rng.next() * TAU;
	const sameSpacing = (c) => (L.mains.some((m) => Math.hypot(c.x - m.x, c.z - m.z) < R.massSpacing * R.massSpacingTol) ? 'mass-spacing' : null);
	const main = L.placeItem({
		group: 'mass', step: 2, id: `${owner}:main`, key: `main:${key}`, target: cand, reach: R.reach.mass, assets: list, rng: L.stream('mass', `main:${key}`),
		cand: { owner }, rules: [sameSpacing], meta: { part: 'main', mass: owner },
		make: () => ({ yaw, scale: scale0 }),
	});
	if (!main) return false;
	L.mains.push({ x: main.x, z: main.z });
	const side = rng.next() * TAU, n = rng.int(R.massSecondary[0], R.massSecondary[1]);
	const mainFp = main.footprint, mainBig = bigOf(cat.get(main.asset)) * main.scale;
	// secondaries of other sizes: of the set's pieces, those whose own scale range can come close to the wanted share of the
	// main piece's size (the scale is clamped to that range, never stretched past it); none that stays too big is used
	const sizes = set.secondary.map((id) => cat.resolve(id)[0]).filter(Boolean);
	for (let k = 0; k < n; k++) {
		const rel = rng.range(R.massSecondaryScale[0], R.massSecondaryScale[1]);
		const fits = sizes.map((asset) => {
			const s = clamp((mainBig * rel) / bigOf(asset), asset.scale[0], asset.scale[1]);
			return { asset, s, ratio: (bigOf(asset) * s) / mainBig };
		}).filter((f) => f.ratio <= R.massSecondaryMax);
		const a = side + (rng.next() - 0.5) * 2 * R.massLean;
		if (!fits.length) continue;
		const fit = rng.pick(fits), s = fit.s, ids = [fit.asset];
		const d = Math.max(mainFp.hx, mainFp.hz) + Math.max(ids[0].footprint.x1 - ids[0].footprint.x0, ids[0].footprint.z1 - ids[0].footprint.z0) * s * 0.5 + rng.range(R.massGap[0], R.massGap[1]) + k * R.massStep;
		const yawK = rng.next() * TAU;
		L.placeItem({
			group: 'mass', step: 2, id: `${owner}:sec${k}`, key: `sec:${key}:${k}`, target: { x: main.x + Math.cos(a) * d, z: main.z + Math.sin(a) * d }, reach: R.reach.member, assets: ids,
			rng: L.stream('mass', `sec:${key}:${k}`), cand: { owner }, meta: { part: 'secondary', mass: owner }, make: () => ({ yaw: yawK, scale: s }),
		});
	}
	return true;
}

function placeAutoMasses(L) {
	const R = L.R, P = L.P, b = L.bounds;
	const budget = L.budgets.masses;
	if (budget <= 0 || L.plan.autoMasses === false) return;
	const pts = poissonPoints(L.stream('mass', 'poisson'), b, R.massSpacing, R.massEdge);
	const scored = [];
	for (const p of pts) {
		const zone = L.zoneAt(p.x, p.z), prof = L.profile(zone.kind);
		if ((prof.mass?.rock ?? 0) + (prof.mass?.tree ?? 0) <= 0) continue;
		const info = nearestPath(P, p.x, p.z, 40, (q) => q.walkable);
		let back = R.scoreNeutral, frame = R.scoreNeutral;
		if (info) {
			if (info.edge < R.massPathClear) continue;
			const at = pointAt(info.path, info.s);
			const l = Math.hypot(p.x - at.x, p.z - at.z) || 1;
			back = clamp(((p.x - at.x) * P.camera.forward.x + (p.z - at.z) * P.camera.forward.z) / l, 0, 1);
			frame = clamp(1 - Math.abs(info.edge - R.frameBest) / R.frameBest, 0, 1);
		}
		const noise = L.stream('mass', `score:${quant(p.x)},${quant(p.z)}`).next();
		scored.push({ x: p.x, z: p.z, back, score: R.scoreBack * back + R.scoreFrame * frame + R.scoreNoise * noise });
	}
	scored.sort((a, b2) => b2.score - a.score || a.x - b2.x || a.z - b2.z);
	const keepOut = keepOutPoints(L);
	let placed = 0, attempts = 0;
	for (const cand of scored) {
		if (placed >= budget || attempts >= budget * R.massAttempts) break;
		if (L.mains.some((m) => Math.hypot(cand.x - m.x, cand.z - m.z) < R.massSpacing * R.massSpacingTol)) continue;
		if (keepOut.some((h) => Math.hypot(cand.x - h.x, cand.z - h.z) < R.hostKeepOut)) continue;
		attempts++;
		if (placeComposition(L, cand)) placed++;
	}
	L.autoCompositions = placed;
}

/** §4.3: one landmark per 1–2 screens along the main path; place one where a window lacks it, else warn. */
function ensureLandmarks(L) {
	const R = L.R, P = L.P, path = P.mainPath;
	if (!path) return;
	const cat = L.catalog;
	const may = L.budgets.masses > 0 && L.plan.autoMasses !== false; // no auto masses = no landmark insertion either: warn only
	const keepOut = keepOutPoints(L);
	// pieces whose own scale range reaches 2 H (height × max scale), so no landmark is stretched past what its kit declares
	const need = R.landmarkHeight * R.landmarkScale;
	const pool = cat.massSets.landmark.map((id) => cat.resolve(id)[0]).filter((a) => a && a.height * a.scale[1] >= need);
	for (let s0 = 0, wi = 0; s0 < path.length - R.landmarkWindow * R.landmarkMinTail; s0 += R.landmarkWindow, wi++) {
		const s1 = Math.min(path.length, s0 + R.landmarkWindow);
		const samples = [];
		for (let s = s0; s <= s1 + 1e-6; s += R.landmarkStep) samples.push(pointAt(path, Math.min(s, path.length)));
		const seen = () => L.placements.some((p) => isLandmark(R, p) && samples.some((q) => Math.hypot(p.x - q.x, p.z - q.z) <= R.landmarkSee));
		if (seen()) continue;
		const mid = pointAt(path, (s0 + s1) / 2), rng = L.stream('mass', `landmark:${wi}`);
		let done = false;
		for (let k = 0; k < R.landmarkTries && !done && may; k++) {
			const a = Math.atan2(P.camera.forward.z, P.camera.forward.x) + (rng.next() - 0.5) * R.landmarkSpread, d = rng.range(R.landmarkDist[0], R.landmarkDist[1]);
			if (!pool.length) break;
			const list = [rng.pick(pool)];
			const scale = clamp(Math.max(meanOf(list[0].scale), need / list[0].height), list[0].scale[0], list[0].scale[1]), yaw = rng.next() * TAU;
			const p = L.placeItem({
				group: 'mass', step: 2, id: `mass:landmark:${wi}:${k}`, key: `landmark:${wi}:${k}`, target: { x: mid.x + Math.cos(a) * d, z: mid.z + Math.sin(a) * d }, reach: R.reach.landmark, assets: list,
				rng: L.stream('mass', `landmark-jitter:${wi}:${k}`), cand: { owner: `mass:landmark:${wi}:${k}` }, meta: { part: 'main', mass: `landmark:${wi}` },
				rules: [
					(c) => (L.mains.some((m) => Math.hypot(c.x - m.x, c.z - m.z) < R.landmarkSpacing) ? 'mass-spacing' : null),
					(c) => (keepOut.some((h) => Math.hypot(c.x - h.x, c.z - h.z) < R.hostKeepOut) ? 'host-keep-out' : null), // a landmark never takes the place of a planned cluster or event
				],
				make: () => ({ yaw, scale }),
			});
			if (p) { L.mains.push({ x: p.x, z: p.z }); done = true; }
		}
		if (!done) L.warnings.push({ code: 'landmark.missing', message: `no landmark within ${R.landmarkSee} m of the main path between s=${Math.round(s0)} and s=${Math.round(s1)}`, s0, s1 });
	}
}

/** One focal per screen: the biggest mass main wins within a screen width (an authored `focal` always counts). */
function markFocals(L) {
	const R = L.R, mains = L.placements.filter((p) => p.step === 2 && p.part === 'main' && p.blocks);
	const size = (p) => p.footprint.hx * p.footprint.hz * (p.height ?? 1);
	const focals = [];
	for (const p of mains.filter((q) => q.focal)) focals.push(p);
	for (const p of mains.filter((q) => !q.focal).sort((a, b) => size(b) - size(a))) {
		if (!focals.some((f) => Math.hypot(f.x - p.x, f.z - p.z) < L.P.camera.screen.w)) { p.focal = true; focals.push(p); }
	}
	for (const p of mains) if (!p.focal) delete p.focal;
}

// ---------------------------------------------------------------------------------------------------------------
// Step 3 · functional clusters (§4.6.3, §4.8): a host and members drawn only from the recipe, in slots of the host's frame

/** Distance along a unit direction from the origin to the edge of a rectangle that contains it. */
function rayExit(rect, lx, lz) {
	let t = Infinity;
	if (lx > 1e-9) t = Math.min(t, rect.x1 / lx);
	else if (lx < -1e-9) t = Math.min(t, rect.x0 / lx);
	if (lz > 1e-9) t = Math.min(t, rect.z1 / lz);
	else if (lz < -1e-9) t = Math.min(t, rect.z0 / lz);
	return t;
}

/** The host's footprint plus its use zone, as a rectangle in the host frame centred on the footprint centre. */
function frameRect(frame) {
	const rect = { x0: -frame.fp.hx, x1: frame.fp.hx, z0: -frame.fp.hz, z1: frame.fp.hz };
	if (frame.use) {
		const c = Math.cos(frame.yaw), s = Math.sin(frame.yaw), dx = frame.use.cx - frame.fp.cx, dz = frame.use.cz - frame.fp.cz;
		const lx = dx * c - dz * s, lz = dx * s + dz * c;
		rect.x0 = Math.min(rect.x0, lx - frame.use.hx); rect.x1 = Math.max(rect.x1, lx + frame.use.hx);
		rect.z0 = Math.min(rect.z0, lz - frame.use.hz); rect.z1 = Math.max(rect.z1, lz + frame.use.hz);
	}
	return rect;
}

/** Counts per recipe entry: drawn from the entry ranges, then trimmed / topped up to the recipe's total range. */
function memberCounts(recipe, rng) {
	const n = recipe.members.map((m) => rng.int(m.n[0], m.n[1]));
	let total = n.reduce((a, b) => a + b, 0);
	for (let i = n.length - 1; i >= 0 && total > recipe.count[1]; i--) {
		const cut = Math.min(n[i], total - recipe.count[1]);
		n[i] -= cut;
		total -= cut;
	}
	for (let i = 0; i < n.length && total < recipe.count[0]; i++) {
		const add = Math.min(recipe.members[i].n[1] - n[i], recipe.count[0] - total);
		if (add > 0) { n[i] += add; total += add; }
	}
	return n;
}

function placeCluster(L, h) {
	const R = L.R, P = L.P, cat = L.catalog;
	const recipe = cat.clusters?.[h.recipe];
	const owner = `cluster:${h.id}`;
	if (!recipe) {
		L.warnings.push({ code: 'cluster.recipe', id: h.id, message: `unknown recipe ${h.recipe}` });
		return;
	}
	const rng = L.stream('cluster', `plan:${h.id}`);
	const record = { id: h.id, recipe: h.recipe, zone: L.zoneAt(h.at?.x ?? 0, h.at?.z ?? 0).kind, host: null, rest: null, requested: 0, placed: 0, members: [], radius: 0, counts: [], dropped: false };

	// the host: authored mass, or a recipe piece near `at`
	let frame;
	if (h.mass) {
		const rec = L.byId.get(`mass:${h.mass}`);
		if (!rec) {
			L.drop({ step: 3, group: 'cluster', id: `${owner}:host` }, 'unavailable', `mass ${h.mass} was not placed`, h.at ?? { x: 0, z: 0 }, h.mass);
			record.dropped = true;
			L.clusters.push(record);
			return;
		}
		frame = { x: rec.placement.x, z: rec.placement.z, yaw: rec.fp.yaw, fp: rec.fp, use: null, id: rec.id, asset: rec.asset };
		// the mass joined its cluster (and its bare radius took effect) in claimMasses(), before any cluster was placed
		record.mass = h.mass;
	} else {
		const pickHost = rng.pick(recipe.host);
		const assets = cat.resolve([pickHost, ...recipe.host.filter((a) => a !== pickHost)]);
		const yaw = h.face ? yawFacing(h.face.x - h.at.x, h.face.z - h.at.z) : (h.yaw ?? rng.next() * TAU);
		const spacing = (c) => (L.clusters.some((q) => q.host && !q.dropped && Math.hypot(c.x - q.host.x, c.z - q.host.z) < R.clusterSpacing) ? 'cluster-spacing' : null);
		const p = L.placeItem({
			group: 'cluster', step: 3, id: `${owner}:host`, key: `host:${h.id}`, target: h.at, reach: recipe.hostReach ?? R.reach.host, assets, rng: L.stream('cluster', `hostj:${h.id}`),
			cand: { owner, cluster: h.id, hostBare: recipe.bare ?? 0, ownsReserved: h.owns }, rules: h.unspaced ? [] : [spacing], meta: { part: 'host', cluster: h.id, host: h.id },
			make: (asset) => ({ yaw: yaw - asset.front, scale: meanOf(asset.scale) }),
		});
		if (!p) {
			record.dropped = true;
			L.clusters.push(record);
			return;
		}
		const rec = L.byId.get(p.id);
		frame = { x: p.x, z: p.z, yaw: p.yaw, fp: rec.fp, use: rec.use, id: p.id, asset: rec.asset };
		record.host = { id: p.id, asset: p.asset, x: p.x, z: p.z, yaw: p.yaw };
	}
	if (!record.host) record.host = { id: frame.id, asset: frame.asset.id, x: frame.x, z: frame.z, yaw: frame.yaw };
	record.rest = { x: round3(frame.fp.cx), z: round3(frame.fp.cz) };
	if (recipe.bare > 0 && !h.mass) L.bareHosts.push({ cluster: h.id, x: record.rest.x, z: record.rest.z, r: recipe.bare });
	const rect = frameRect(frame);
	const zone = h.owns ? P.reserved.find((r) => r.id === h.owns) : null; // the interaction zone this host owns (§4.8 chừa chỗ tiếp cận)
	const restBase = rng.next() * TAU;

	// the members: counts differ from cluster to cluster; each member has its own stream (host id + entry + index)
	let counts = memberCounts(recipe, rng);
	// §4.8 "mỗi cụm một khác": the counts differ from every earlier cluster of the recipe when the recipe allows it (bounded, seeded re-rolls)
	const earlier = L.clusters.filter((q) => q.recipe === h.recipe && !q.dropped && q.counts.length).map((q) => q.counts.join());
	for (let i = 0; i < R.countRerolls && earlier.includes(counts.join()); i++) counts = memberCounts(recipe, rng);
	record.counts = counts;
	record.requested = counts.reduce((a, b) => a + b, 0);
	// one member of entry `ei` (index k of its own stream); false when the member budget is spent
	const placeMember = (entry, ei, k) => {
		if (L.membersPlaced >= L.budgets.members) {
			if (!L.warned.has('members')) L.warnings.push({ code: 'budget.members', message: `cluster members capped at ${L.budgets.members}` });
			L.warned.add('members');
			return false;
		}
		const key = `${h.id}:${ei}.${k}`, mrng = L.stream('cluster', `member:${key}`);
		const pick = mrng.pick(entry.asset);
		const list = cat.resolve([pick, ...entry.asset.filter((a) => a !== pick)]);
		if (!list.length) {
			L.drop({ step: 3, group: 'cluster', id: `${owner}:m${ei}.${k}` }, 'unavailable', `${entry.asset.join('|')} not in this scene`, record.rest, pick);
			return true;
		}
		const first = list[0], scale = mrng.range(first.scale[0], first.scale[1]);
		// direction in the host frame (φ from the front, +z), then world
		let phi;
		if (entry.slot === 'front') phi = mrng.range(-R.slotAngle.front, R.slotAngle.front);
		else if (entry.slot === 'back') phi = Math.PI + mrng.range(-R.slotAngle.back, R.slotAngle.back);
		else if (entry.slot === 'side') phi = mrng.sign() * (Math.PI / 2) + mrng.range(-R.slotAngle.side, R.slotAngle.side);
		else if (entry.slot === 'rest') phi = restBase + (k * TAU) / Math.max(1, counts[ei]) + mrng.range(-R.restJitter, R.restJitter);
		else phi = mrng.next() * TAU;
		const lx = Math.sin(phi), lz = Math.cos(phi);
		const w = toWorld(0, 0, frame.yaw, lx, lz);
		const memberR = Math.hypot((first.footprint.x1 - first.footprint.x0) / 2, (first.footprint.z1 - first.footprint.z0) / 2) * scale * R.memberRadius;
		const facesHost = entry.face === 'rest' || entry.face === 'host';
		let dist = rayExit(rect, lx, lz) + mrng.range(entry.gap[0], entry.gap[1]) + memberR + (facesHost && first.use?.side === 'front' ? first.use.depth : 0);
		// a blocker stands outside the zone its host owns; a walk-through piece (candles) may stand in it
		const owned = zone && !first.collision ? zone : null;
		if (zone && !owned) dist = Math.max(dist, (zone.t === 'circle' ? zone.r : 0) + zone.clear + memberR + Math.hypot(frame.fp.cx - (zone.x ?? frame.fp.cx), frame.fp.cz - (zone.z ?? frame.fp.cz)) + 0.2);
		const target = { x: frame.fp.cx + w.x * dist, z: frame.fp.cz + w.z * dist };
		const flip = mrng.chance(0.5) ? Math.PI : 0, jitter = (mrng.next() - 0.5) * 2 * (entry.worn ?? 0), freeYaw = mrng.next() * TAU;
		const base = (entry.slot === 'side' ? Math.PI / 2 : 0) + flip;
		L.membersPlaced++;
		const p = L.placeItem({
			group: 'cluster', step: 3, id: `${owner}:m${ei}.${k}`, key: `member:${key}`, target, reach: R.reach.member, assets: list, rng: L.stream('cluster', `memberj:${key}`),
			cand: { owner, cluster: h.id, ownsReserved: owned ? h.owns : undefined }, meta: { part: 'member', cluster: h.id, host: h.id, orient: entry.face },
			make: (asset, pos) => {
				let yaw;
				if (entry.face === 'axis') yaw = frame.yaw + base + jitter;
				else if (entry.face === 'free') yaw = freeYaw;
				else {
					const dx = record.rest.x - pos.x, dz = record.rest.z - pos.z;
					yaw = yawFacing(entry.face === 'out' ? -dx : dx, entry.face === 'out' ? -dz : dz) - asset.front;
				}
				return { yaw, scale };
			},
		});
		if (p) {
			record.placed++;
			record.members.push(p.id);
			record.radius = Math.max(record.radius, Math.hypot(p.x - frame.fp.cx, p.z - frame.fp.cz));
		}
		return true;
	};
	let open = true;
	for (const [ei, entry] of recipe.members.entries()) {
		for (let k = 0; open && k < counts[ei]; k++) open = placeMember(entry, ei, k);
	}
	// §4.3 rhythm repair: a cluster of sizeMixMin+ pieces that came out flat (the one bigger / smaller piece did not fit) gets
	// up to sizeRepair more members from the recipe entries that can supply the missing size class, within the recipe's count
	for (let i = 0; i < R.sizeRepair && open && record.placed < recipe.count[1]; i++) {
		const mix = sizeMixOf(L, record);
		if (mix.pieces < R.sizeMixMin || sizeRhythmOk(mix)) break;
		const wants = (id) => { const a = cat.get(id); return !!a && cat.available(id) && (mix.small === 0 ? a.size === 'small' : a.size !== 'small'); };
		const fits = recipe.members.map((e, ei) => [e, ei]).filter(([e]) => e.asset.some(wants));
		if (!fits.length) break;
		const [entry, ei] = fits[i % fits.length];
		open = placeMember({ ...entry, asset: entry.asset.filter(wants) }, ei, counts[ei] + i);
	}
	finishCluster(L, record, frame);
}

/** §4.3 "1 lớn – 2 trung – 3+ nhỏ": the size classes of a cluster's host and members placed so far. */
function sizeMixOf(L, record) {
	const mix = { large: 0, medium: 0, small: 0, pieces: 0 };
	for (const id of [record.host?.id, ...record.members].filter(Boolean)) {
		const a = L.byId.get(id)?.asset;
		if (a) { mix[a.size ?? 'medium']++; mix.pieces++; }
	}
	return mix;
}

function finishCluster(L, record, frame) {
	record.frame = { x: round3(frame.fp.cx), z: round3(frame.fp.cz), yaw: round3(frame.yaw) };
	const { pieces, ...sizeMix } = sizeMixOf(L, record);
	record.sizeMix = sizeMix;
	record.pieces = pieces;
	L.clusters.push(record);
}

/**
 * A mass is part of the cluster it hosts: members may stand against its wall (§4.8 "thùng sát kho/tường"), and every other cluster keeps
 * clusterClear / the recipe's bare radius away from it. That must hold whatever the order of plan.hosts, so all mass hosts claim their mass
 * before the first cluster is placed. A mass hosts one cluster (first claim wins); a second claim is reported and gets no wall privileges.
 */
function claimMasses(L, hosts) {
	for (const [i, h] of hosts.entries()) {
		if (i >= L.budgets.hosts) break;
		const rec = h.mass ? L.byId.get(`mass:${h.mass}`) : null, recipe = h.mass ? L.catalog.clusters?.[h.recipe] : null;
		if (!rec || !recipe) continue; // placeCluster() reports the missing mass / recipe
		if (rec.clusters && !rec.clusters.has(h.id)) {
			L.warnings.push({ code: 'cluster.hostMass', id: h.id, message: `mass ${h.mass} already hosts cluster ${[...rec.clusters].join(',')}` });
			continue;
		}
		if (recipe.bare > 0) L.bareHosts.push({ cluster: h.id, x: round3(rec.fp.cx), z: round3(rec.fp.cz), r: recipe.bare }); // only the winning claim keeps its own members off the building
		(rec.clusters ??= new Set()).add(h.id);
		rec.placement.cluster = h.id;
	}
}

function stepClusters(L) {
	const hosts = L.plan.hosts ?? [];
	L.membersPlaced = 0;
	claimMasses(L, hosts);
	for (const [i, h] of hosts.entries()) {
		if (i >= L.budgets.hosts) { L.warnings.push({ code: 'budget.hosts', message: `hosts capped at ${L.budgets.hosts}` }); break; }
		placeCluster(L, h);
	}
	// a cluster of 4+ pieces should show the size rhythm (something bigger than small, something small); a flat mix is reported
	for (const c of L.clusters) {
		if (c.dropped || c.pieces < L.R.sizeMixMin || sizeRhythmOk(c.sizeMix)) continue;
		L.warnings.push({ code: 'cluster.sizeMix', id: c.id, message: `cluster ${c.id}: ${c.pieces} pieces, ${c.sizeMix.large} large / ${c.sizeMix.medium} medium / ${c.sizeMix.small} small — no 1 large – 2 medium – 3+ small rhythm` });
	}
}

export const sizeRhythmOk = (m) => m.small >= 1 && m.medium + m.large >= 1;

// ---------------------------------------------------------------------------------------------------------------
// Step 4 · wayfinding (§4.6.4, §4.9): decision points first, markers after, spacing last

const PATH_RANK = { road: 3, branch: 2, trail: 1, animal: 0 };
const cross2 = (ax, az, bx, bz) => ax * bz - az * bx;

const headingAt = (path, s, span) => {
	const a = pointAt(path, clamp(s - span, 0, path.length)), b = pointAt(path, clamp(s + span, 0, path.length));
	return { x: b.x - a.x, z: b.z - a.z };
};

/** Decision points: the plan's own, then doors / forks / fords / hidden bends found on the paths (§4.6.4). */
export function detectDecisions(L) {
	const R = L.R, P = L.P, out = [];
	const pathById = new Map(P.paths.map((p) => [p.id, p]));
	for (const d of L.plan.decisions ?? []) {
		const info = nearestPath(P, d.at.x, d.at.z, R.decisionSnap);
		const entry = { id: d.id, kind: d.kind, x: d.at.x, z: d.at.z, important: !!d.important, auto: false, path: info?.path.id ?? null, s: info?.s ?? null, branch: d.branch ?? null, hidden: false };
		// an authored fork names its branch: the marker goes on the other side
		const branch = d.branch ? pathById.get(d.branch) : null;
		if (d.kind === 'fork' && branch) {
			const end = Math.hypot(branch.points[0].x - d.at.x, branch.points[0].z - d.at.z) < Math.hypot(branch.points.at(-1).x - d.at.x, branch.points.at(-1).z - d.at.z) ? 0 : branch.length;
			const inward = pointAt(branch, end === 0 ? Math.min(R.branchProbe, branch.length) : Math.max(0, branch.length - R.branchProbe));
			entry.branchDir = unit(inward.x - d.at.x, inward.z - d.at.z);
		}
		out.push(entry);
	}
	const authored = out.slice();
	const near = (d, kind) => authored.some((a) => a.kind === kind && Math.hypot(a.x - d.x, a.z - d.z) < 6);

	for (const door of P.doors) {
		if (door.kind !== 'gate' && door.kind !== 'entrance' && !door.important) continue;
		const kind = door.kind === 'door' ? 'entrance' : door.kind;
		out.push({ id: `door:${door.id}`, kind, x: door.at.x, z: door.at.z, important: door.important, auto: true, door: door.id, path: null, s: null, hidden: false });
	}

	// junctions: the end of a lower-ranked path that lands on a higher-ranked one is a fork on the higher-ranked one
	for (const b of P.paths) {
		if (b.kind === 'animal') continue;
		for (const end of [0, 1]) {
			const pt = end ? b.points[b.points.length - 1] : b.points[0];
			const info = nearestPath(P, pt.x, pt.z, R.junctionSnap * 2, (p) => p !== b && p.walkable);
			if (!info || info.d > R.junctionSnap) continue;
			const a = info.path;
			if (PATH_RANK[a.kind] < PATH_RANK[b.kind] || (PATH_RANK[a.kind] === PATH_RANK[b.kind] && a.id > b.id)) continue;
			if (info.s < R.junctionSnap || info.s > a.length - R.junctionSnap) continue;
			const at = pointAt(a, info.s);
			const inward = end ? pointAt(b, b.length - R.branchProbe) : pointAt(b, R.branchProbe);
			const d = { id: `fork:${a.id}:${b.id}:${end}`, kind: 'fork', x: at.x, z: at.z, important: false, auto: true, path: a.id, s: info.s, branch: b.id, branchDir: unit(inward.x - at.x, inward.z - at.z), hidden: false };
			if (!near(d, 'fork')) out.push(d);
		}
	}

	// fords / bridges: where a walkable path crosses water
	for (const path of P.paths) {
		if (!path.walkable) continue;
		for (const w of P.water) {
			let found = null;
			for (const seg of path.segs) {
				for (const ws of w.shapes) {
					if (ws.t === 'capsule') {
						if (!segmentsIntersect(seg.a, seg.b, ws.a, ws.b)) continue;
						const sd = { x: seg.b.x - seg.a.x, z: seg.b.z - seg.a.z }, wd = { x: ws.b.x - ws.a.x, z: ws.b.z - ws.a.z };
						const den = cross2(sd.x, sd.z, wd.x, wd.z);
						const t = den ? cross2(ws.a.x - seg.a.x, ws.a.z - seg.a.z, wd.x, wd.z) / den : 0.5;
						found = found ?? { s: seg.s0 + clamp(t, 0, 1) * seg.len, half: w.width / 2 };
					} else {
						let hit = false;
						for (let i = 0, j = ws.pts.length - 1; i < ws.pts.length; j = i++) if (segmentsIntersect(seg.a, seg.b, ws.pts[j], ws.pts[i])) hit = true;
						if (hit) found = found ?? { s: seg.s0 + seg.len / 2, half: 0 };
					}
					if (found) break;
				}
				if (found) break;
			}
			if (!found) continue;
			// the decision is the bank (water half width + clear margin before the crossing), where the traveller sees the ford / bridge
			const sBank = Math.max(0, found.s - found.half - R.waterClear - R.bankBefore);
			const at = pointAt(path, sBank);
			const d = { id: `bridge:${path.id}:${w.id}`, kind: 'bridge', x: at.x, z: at.z, important: false, auto: true, path: path.id, s: sBank, half: found.half, hidden: false };
			if (!near(d, 'bridge')) out.push(d);
		}
	}

	// hidden bends: turn > 35° over ~8 m (strongest in each span), not where a fork / ford already decides
	for (const path of P.paths) {
		if (!path.walkable) continue;
		// the turn between the tangents (2 m chords) 4 m before and 4 m after s: a turn over ~bendSpan metres
		const span = R.bendSpan / 2, found = [];
		for (let s = span + R.bendProbe; s <= path.length - span - R.bendProbe; s += R.bendProbe) {
			const a = headingAt(path, s - span, R.bendProbe), b = headingAt(path, s + span, R.bendProbe);
			const turn = Math.atan2(cross2(a.x, a.z, b.x, b.z), a.x * b.x + a.z * b.z);
			if (Math.abs(turn) > R.bendAngle) found.push({ s, turn });
		}
		const kept = [];
		for (const f of found.sort((p, q) => Math.abs(q.turn) - Math.abs(p.turn))) if (kept.every((k) => Math.abs(k.s - f.s) > R.bendSpan * R.bendKeep)) kept.push(f);
		for (const f of kept.sort((p, q) => p.s - q.s)) {
			const at = pointAt(path, f.s);
			const d = { id: `bend:${path.id}:${Math.round(f.s)}`, kind: 'bend', x: at.x, z: at.z, important: false, auto: true, path: path.id, s: f.s, turn: f.turn, hidden: false };
			if (near(d, 'bend') || out.some((o) => o.path === path.id && o.s !== null && (o.kind === 'fork' || o.kind === 'bridge') && Math.abs(o.s - f.s) < R.bendSpan)) continue;
			out.push(d);
		}
	}
	// a bend is "hidden" when a tall mass already placed hides the road just ahead of it (§4.9 chỗ đường bị khuất)
	for (const d of out) {
		if (d.kind !== 'bend') continue;
		const ahead = pointAt(pathById.get(d.path), Math.min(pathById.get(d.path).length, d.s + R.hiddenAhead));
		d.hidden = L.placements.some((p) => p.occlusion && pointInPoly(p.occlusion, ahead.x, ahead.z));
	}
	return out;
}

function guidePolicy(L, d) {
	const zone = L.zoneAt(d.x, d.z), prof = L.profile(zone.kind);
	const path = d.path ? L.P.paths.find((p) => p.id === d.path) : null;
	let policy = prof.guide;
	if (path?.kind === 'animal') policy = 'natural';
	else if (policy === 'natural' && path?.inhabited && prof.lit) policy = 'torch';
	return { zone: zone.kind, policy };
}

function placeMarker(L, d, mk) {
	const R = L.R, P = L.P, cat = L.catalog;
	const key = `${d.id}:${mk.key}`, owner = `guide:${key}`;
	const rng = L.stream('guide', key);
	const pick = rng.pick(mk.ids);
	const list = cat.resolve([pick, ...mk.ids.filter((i) => i !== pick)]);
	if (!list.length) {
		L.drop({ step: 4, group: 'guide', id: owner }, 'unavailable', `${mk.ids.join('|')} not in this scene`, { x: d.x, z: d.z }, pick);
		return null;
	}
	const first = list[0], scale = rng.range(first.scale[0], first.scale[1]);
	const radius = Math.max(first.footprint.x1 - first.footprint.x0, first.footprint.z1 - first.footprint.z0) * scale * 0.5;
	const extra = rng.range(R.guideExtra[0], R.guideExtra[1]);
	let target, rules = [], yawOf;
	const gapRule = (c) => {
		for (const p of L.placements) if (p.group === 'guide' && !(mk.pair && p.pair === mk.pair) && Math.hypot(c.x - p.x, c.z - p.z) < R.torchGap) return `guide-gap:${p.id}`;
		return null;
	};
	const radiusRule = (c) => (Math.hypot(c.x - d.x, c.z - d.z) > R.decisionRadius ? 'decision-radius' : null);
	if (mk.door) {
		const door = mk.door, lateral = door.width / 2 + R.doorClear + radius + extra, f = rng.range(R.gateFront[0], Math.max(R.gateFront[0] + 0.1, door.depth * R.gateFront[1]));
		const right = { x: Math.cos(door.yaw), z: -Math.sin(door.yaw) };
		target = { x: door.at.x + right.x * mk.side * lateral + door.front.x * f, z: door.at.z + right.z * mk.side * lateral + door.front.z * f };
		rules = [(c) => {
			const gap = polyDistance(door.corridor.pts, c.fp.pts);
			return gap < R.doorClear - 1e-6 || gap > R.shoulderMax + 1e-6 ? `shoulder:${gap.toFixed(2)}` : null;
		}, gapRule, radiusRule];
		yawOf = () => door.yaw;
	} else {
		const path = P.paths.find((p) => p.id === d.path);
		const sApp = clamp(mk.s ?? d.s - rng.range(R.guideBefore[0], R.guideBefore[1]), 0, path.length);
		const at = pointAt(path, sApp);
		const n = { x: at.tz, z: -at.tx };
		const offset = path.half + R.shoulderMin + radius + extra;
		target = { x: at.x + n.x * mk.side * offset, z: at.z + n.z * mk.side * offset };
		rules = [(c) => {
			let gap = Infinity;
			P.pathGrid.query(c.fp.x0 - 4, c.fp.z0 - 4, c.fp.x1 + 4, c.fp.z1 + 4, (seg) => {
				if (seg.path === path) gap = Math.min(gap, segPolyDistance(seg.a, seg.b, c.fp.pts) - path.half);
				return null;
			});
			return gap < R.shoulderMin - 1e-6 || gap > R.shoulderMax + 1e-6 ? `shoulder:${gap.toFixed(2)}` : null;
		}, gapRule, radiusRule];
		// lights face the road; signposts and poles face the oncoming traveller
		yawOf = () => (first.light ? yawFacing(-n.x * mk.side, -n.z * mk.side) : first.natural ? rng.next() * TAU : yawFacing(-at.tx, -at.tz));
	}
	const yaw = yawOf();
	return L.placeItem({
		group: 'guide', step: 4, id: owner, key, target, reach: R.reach.guide, assets: list, rng: L.stream('guide', `${key}:jitter`), cand: { owner, shadeDoor: mk.door?.id, designed: !!mk.pair }, rules,
		meta: { role: 'guide', part: mk.kind, decision: d.id, side: mk.side, pair: mk.pair },
		make: (asset) => ({ yaw: yaw - asset.front, scale }),
	});
}

function stepGuides(L) {
	const R = L.R, P = L.P, cat = L.catalog;
	const order = new Map(P.paths.map((p, i) => [p.id, i]));
	let decisions = detectDecisions(L);
	const authored = decisions.filter((d) => !d.auto);
	const autos = decisions.filter((d) => d.auto).sort((a, b) => (a.door ? -1 : 0) - (b.door ? -1 : 0) || (order.get(a.path) ?? -1) - (order.get(b.path) ?? -1) || (a.s ?? 0) - (b.s ?? 0));
	decisions = authored.concat(autos);
	let placed = 0;
	const sideOf = (d, rng) => {
		const path = P.paths.find((p) => p.id === d.path);
		if (!path || d.s === null) return rng.sign();
		const at = pointAt(path, d.s), n = { x: at.tz, z: -at.tx };
		if (d.kind === 'fork' && d.branchDir) return dotSign(n, d.branchDir) * -1 || 1;
		if (d.kind === 'bend' && d.turn !== undefined) {
			const a = headingAt(path, d.s - R.bendSpan / 2, R.bendProbe), b = headingAt(path, d.s + R.bendSpan / 2, R.bendProbe);
			return -dotSign(n, { x: b.x - a.x, z: b.z - a.z }) || 1;
		}
		return rng.sign();
	};
	for (const d of decisions) {
		const info = guidePolicy(L, d);
		d.zone = info.zone;
		d.policy = info.policy;
		d.markers = [];
	}
	for (const d of decisions) {
		const info = { policy: d.policy };
		const table = cat.guides?.[info.policy];
		const rng = L.stream('guide', `decision:${d.id}`);
		if (!table) continue;
		const kind = d.kind;
		if (placed >= L.budgets.guides) { L.warnings.push({ code: 'budget.guides', message: `guides capped at ${L.budgets.guides}` }); break; }
		if (d.door) {
			const door = P.doors.find((q) => q.id === d.door);
			const pair = d.important && table.pair?.length;
			const sides = pair ? [1, -1] : [rng.sign()];
			for (const side of sides) {
				if (placed >= L.budgets.guides) break;
				const p = placeMarker(L, d, { key: `m${side}`, kind, ids: pair ? table.pair : table[kind] ?? [], door, side, pair: pair ? d.id : undefined });
				if (p) { d.markers.push(p.id); placed++; }
			}
		} else if (table[kind]?.length) {
			const side = sideOf(d, rng);
			d.side = side;
			const p = placeMarker(L, d, { key: 'm', kind, ids: table[kind], side });
			if (p) { d.markers.push(p.id); placed++; }
		}
	}
	// a confirmation marker after a bend when the next marker is more than a screen away
	for (const path of P.paths) {
		if (!path.walkable) continue;
		const along = decisions.filter((d) => d.path === path.id && d.s !== null && d.markers.length).sort((a, b) => a.s - b.s);
		for (const [i, d] of along.entries()) {
			if (d.kind !== 'bend') continue;
			const next = along[i + 1]?.s ?? path.length;
			if (next - d.s <= R.confirmGap) continue;
			const table = cat.guides?.[d.policy];
			if (!table?.confirm?.length) continue;
			const side = L.byId.get(d.markers[0])?.placement.side ?? 1;
			if (placed >= L.budgets.guides) break;
			const p = placeMarker(L, d, { key: 'c', kind: 'confirm', ids: table.confirm, side, s: Math.min(path.length, d.s + R.confirmAfter) });
			if (p) { d.markers.push(p.id); placed++; }
		}
	}
	L.decisions = decisions;
}

const dotSign = (n, v) => Math.sign(n.x * v.x + n.z * v.z);

// ---------------------------------------------------------------------------------------------------------------
// Step 5 · ecology (§4.6.5, §4.7, §4.11): soil → low carpet → tuft clusters → shrubs, by moisture, slope, trampling,
// building shadow, corruption and the zone profile. Every tuft is re-checked at its final position.

const KIND_ID = { grass: 0, row: 1, bank: 2, strip: 3, foot: 4 };

function makeSite(L, patchSeed) {
	const R = L.R, P = L.P, b = L.bounds;
	const shade = unit(P.plan.shade?.x ?? 1, P.plan.shade?.z ?? 1); // shadows fall away from the key light (screen upper-left): toward the south-east
	const bare = L.clusters.filter((c) => c.host && !c.dropped).map((c) => ({ x: c.rest.x, z: c.rest.z, r: L.catalog.clusters?.[c.recipe]?.bare ?? 0 })).filter((h) => h.r > 0);
	const doors = P.doors.map((d) => ({ x: d.at.x, z: d.at.z }));
	return (x, z, o = {}) => {
		if (x < b.x0 + R.tuftEdge || x > b.x1 - R.tuftEdge || z < b.z0 + R.tuftEdge || z > b.z1 - R.tuftEdge) return null;
		const g = L.sample(x, z);
		if (g.water) return null;
		// footprints (a tuft keeps 0.18 m off them), use zones, shadow just behind walls and big masses
		let fpGap = Infinity, inUse = false, boost = 1, wall = 1;
		L.solids.query(x - 3, z - 3, x + 3, z + 3, (s) => {
			const d = pointPolySigned(s.fp.pts, x, z);
			if (d < fpGap) fpGap = d;
			if (s.use && !s.decal && pointInPoly(s.use.pts, x, z)) inUse = true;
			if (!s.decal && s.asset.occludes >= R.tallMin && d > R.shadowMin && d < R.shadowReach && (x - s.fp.cx) * shade.x + (z - s.fp.cz) * shade.z > 0) boost = R.shadowBoost;
			if (s.asset.procedural && s.asset.kind === 'building' && d > R.shadowMin && d < R.wallReach) wall = Math.max(wall, L.profile(L.zoneAt(x, z).kind).wall ?? 1);
			return null;
		});
		if (fpGap < R.tuftFootClear || inUse) return null;
		// corridors: walkable paths trampled, animal trails thinner; the low strip between cart ruts
		let roadE = Infinity, trailE = Infinity, strip = false;
		P.pathGrid.query(x - 5, z - 5, x + 5, z + 5, (seg) => {
			const dx = seg.b.x - seg.a.x, dz = seg.b.z - seg.a.z;
			const t = clamp(((x - seg.a.x) * dx + (z - seg.a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
			const d = Math.hypot(x - seg.a.x - t * dx, z - seg.a.z - t * dz), edge = d - seg.path.half;
			if (seg.path.walkable) {
				if (edge < roadE) roadE = edge;
				const ru = seg.path.ruts, s = seg.s0 + t * seg.len;
				if (ru && s >= ru.s0 && s <= ru.s1 && d <= ru.stripHalf) strip = true;
			} else if (edge < trailE) trailE = edge;
			return null;
		});
		if (roadE < 0 && !(strip && o.allowStrip)) return null;
		// doors, interactions, spawns (no grass at all) and arenas (short, sparse turf); distance to combat for tall grass
		let access = false, quiet = false, combat = Infinity;
		P.reservedGrid.query(x - R.tallClear, z - R.tallClear, x + R.tallClear, z + R.tallClear, (r) => {
			if (r.kind === 'path' || r.kind === 'water') return null;
			const d = pointShapeGap(r, x, z);
			if (r.kind === 'arena') { if (d < R.quietMargin) quiet = true; } else if (d < R.accessClear) access = true;
			if (d < combat) combat = d;
			return null;
		});
		if (access) return null;
		const we = waterEdge(P, x, z, 5);
		const zone = L.zoneAt(x, z), prof = L.profile(zone.kind);
		const slope = L.slopeAt(x, z);
		const patch = o.field ? R.fieldPatch : patchField(x, z, patchSeed);
		const hab = grassHabitat({
			grass: o.field ? 1 : g.grass, wet: o.bank ? Math.min(g.wet, R.mudWet) : g.wet, blood: g.blood,
			road: roadE + BIOME_RULES.roadClear, trail: trailE + BIOME_RULES.trailClear, creek: o.bank ? 99 : we + BIOME_RULES.creekClear,
			slope, blocked: false, access: false, quiet, patch,
		});
		let density = hab.density * (o.field ? 1 : prof.grass) * boost * wall * (1 - smooth(R.rockFade[0], R.rockFade[1], g.rock));
		for (const h of bare) density *= smooth(R.bareRamp * h.r, h.r, Math.hypot(x - h.x, z - h.z));
		if (prof.yard) for (const d of doors) density *= R.yardFloor + (1 - R.yardFloor) * smooth(R.yardNear, prof.yard, Math.hypot(x - d.x, z - d.z));
		if (strip) density = Math.min(density, R.stripCarpet) || R.stripDensity * patch;
		return {
			density: clamp(density, 0, 1), h01: hab.height, dry: hab.dry, tone: clamp(hab.dry + (prof.tone - R.toneBase) * R.toneZone, 0, 1), quiet, strip, we,
			edge: roadE < R.edgeShoulder || fpGap < R.edgeFoot, tallOK: !!prof.tall && combat > R.tallClear && roadE > R.tallPathClear && !quiet, roadE, fpGap, g, zone,
		};
	};
}

function stepEcology(L) {
	const R = L.R, P = L.P, b = L.bounds, cat = L.catalog;
	const patchSeed = hash32(L.plan.seed ?? 1, L.seeds.ecology, 'patch') & 0xffff;
	const site = makeSite(L, patchSeed);
	const tufts = { x: [], z: [], h: [], tone: [], cluster: [], kind: [] };
	const eco = (L.eco = { tufts, shrubs: [], carpet: null, stats: { clusters: 0, loners: 0, rows: 0, strip: 0, feet: 0, bank: 0, shrubDrops: {} } });
	const grassScale = L.density.grass;
	const spacing = new PlacementGrid(R.rootSpacing);
	let nextCluster = 0;

	// low carpet: a coarse density / height field, zero wherever the site is closed or the density option is 0
	const cs = R.carpetCell, cnx = Math.ceil((b.x1 - b.x0) / cs), cnz = Math.ceil((b.z1 - b.z0) / cs);
	const carpet = { cell: cs, n: cnx, nx: cnx, nz: cnz, x0: b.x0, z0: b.z0, density: new Float32Array(cnx * cnz), height: new Float32Array(cnx * cnz) };
	if (grassScale > 0) {
		for (let j = 0; j < cnz; j++) {
			for (let i = 0; i < cnx; i++) {
				const s = site(b.x0 + (i + 0.5) * cs, b.z0 + (j + 0.5) * cs, { allowStrip: true });
				if (!s) continue;
				const d = s.strip ? R.stripCarpet : clamp(s.density * R.carpetGain, 0, 1);
				carpet.density[j * cnx + i] = Math.min(1, d * grassScale);
				carpet.height[j * cnx + i] = lerp(R.carpetH[0], R.carpetH[1], s.quiet ? 0 : s.h01) * H;
			}
		}
	}
	eco.carpet = carpet;

	const heightOf = (s, rng, tall) => {
		const u = rng.next();
		if (s.quiet) return lerp(R.carpetH[0], R.carpetH[1], u) * H; // arenas: short, sparse turf
		if (s.edge) return lerp(R.edgeH[0], R.edgeH[1], u) * H; // edge grass
		if (tall && s.tallOK) return lerp(R.tallH[0], R.tallH[1], u) * H; // taller only away from combat
		return lerp(R.openH[0], R.openH[1], u) * (R.openLow + (1 - R.openLow) * s.h01) * H;
	};
	const push = (x, z, h, tone, cluster, kind) => {
		tufts.x.push(round3(x)); tufts.z.push(round3(z)); tufts.h.push(round3(h)); tufts.tone.push(round3(tone)); tufts.cluster.push(cluster); tufts.kind.push(KIND_ID[kind]);
	};
	const full = () => tufts.x.length >= L.budgets.tufts;
	/** One tuft at its FINAL position: re-checks the whole site, thins with the density (soft broken edges), keeps root spacing. */
	const plant = (x, z, rng, tone, cluster, kind, o = {}) => {
		if (full()) return false;
		const s = site(x, z, o);
		if (!s || s.density < R.minDensity) return false;
		if (rng.next() > Math.min(1, s.density * R.tuftThin)) return false;
		if (!spacing.accept(x, z)) return false;
		push(x, z, o.h ?? heightOf(s, rng, o.tall ?? rng.chance(R.tallChance)), clamp(tone ?? s.tone, 0, 1), cluster, kind);
		return true;
	};

	if (grassScale > 0) {
		// field zones: broken rows (human-planted, but with gaps and missing plants); nowhere else
		for (const zn of P.zones) {
			const prof = L.profile(zn.kind);
			if (!prof.rows) continue;
			const rows = prof.rows;
			const ang = zn.rows?.angle ?? (zn.shape.t === 'poly' ? Math.atan2(zn.shape.pts[1].z - zn.shape.pts[0].z, zn.shape.pts[1].x - zn.shape.pts[0].x) : 0);
			const dir = { x: Math.cos(ang), z: Math.sin(ang) }, perp = { x: -dir.z, z: dir.x };
			const box = zn.box;
			const corners = [[box.x0, box.z0], [box.x1, box.z0], [box.x1, box.z1], [box.x0, box.z1]];
			const proj = (v, p) => corners.map(([cx, cz]) => cx * p.x + cz * p.z).reduce((a, c) => [Math.min(a[0], c), Math.max(a[1], c)], [Infinity, -Infinity]);
			const [u0, u1] = proj(null, perp), [t0, t1] = proj(null, dir);
			for (let k = 0, u = u0 + rows.spacing / 2; u < u1; k++, u += rows.spacing) {
				const rng = L.stream('ecology', `row:${zn.id}:${k}`);
				let gap = 0;
				for (let t = t0; t < t1; t += rows.step) {
					const x = dir.x * t + perp.x * u, z = dir.z * t + perp.z * u;
					const inside = zn.shape.t === 'circle' ? Math.hypot(x - zn.shape.x, z - zn.shape.z) <= zn.shape.r : pointInPoly(zn.shape.pts, x, z);
					if (!inside) continue;
					if (gap > 0) { gap--; continue; }
					if (rng.chance(rows.gapChance)) { gap = rng.int(rows.gapRun[0], rows.gapRun[1]); continue; }
					if (rng.chance(rows.miss)) continue;
					const h = lerp(rows.height[0], rows.height[1], rng.next()) * H;
					if (plant(x, z, rng, R.fieldTone + (rng.next() - 0.5) * R.fieldToneJitter, -1, 'row', { field: true, h, tall: false })) eco.stats.rows++;
				}
			}
		}
		// the low strip between cart ruts: a few low tufts, nothing tall in the ruts
		for (const path of P.paths) {
			const ru = path.ruts;
			if (!ru) continue;
			for (let s = ru.s0 + 1; s < Math.min(ru.s1, path.length); s += R.stripStep) {
				const rng = L.stream('ecology', `strip:${path.id}:${Math.round(s * 10)}`);
				if (!rng.chance(R.stripChance)) continue;
				const at = pointAt(path, s), lat = rng.range(-ru.stripHalf + R.stripInset, ru.stripHalf - R.stripInset);
				const x = at.x + at.tz * lat, z = at.z - at.tx * lat;
				if (plant(x, z, rng, R.stripTone, -1, 'strip', { allowStrip: true, h: lerp(R.carpetH[0], R.stripMax, rng.next()) * H, tall: false })) eco.stats.strip++;
			}
		}
		// prop feet: grass clings in a ring outside rocks / fence bases (never inside the footprint), a little bare soil at the foot
		for (const p of L.placements) {
			const rec = L.byId.get(p.id);
			if (!rec || !rec.asset.feet) continue;
			const rng = L.stream('ecology', `foot:${p.id}`), fp = rec.fp;
			const mul = L.profile(L.zoneAt(p.x, p.z).kind).feet ?? 1;
			const n = Math.round(rng.int(R.footTufts[0], R.footTufts[1]) * mul * Math.min(grassScale, 2));
			const centre = rng.next() * TAU, spread = rng.range(R.footSpread[0], R.footSpread[1]);
			const c = Math.cos(fp.yaw), s = Math.sin(fp.yaw);
			let tone = null;
			for (let k = 0; k < n; k++) {
				const a = centre + (rng.next() - 0.5) * 2 * spread, dx = Math.cos(a), dz = Math.sin(a);
				const lx = dx * c - dz * s, lz = dx * s + dz * c;
				const t = rayExit({ x0: -fp.hx, x1: fp.hx, z0: -fp.hz, z1: fp.hz }, lx, lz) + rng.range(R.footRing[0], R.footRing[1]);
				if (plant(fp.cx + dx * t, fp.cz + dz * t, rng, tone, -1, 'foot', { tall: false })) { eco.stats.feet++; tone ??= tufts.tone[tufts.tone.length - 1]; }
			}
			L.groundPaint.push({ x: round3(fp.cx), z: round3(fp.cz), radius: round3(Math.max(fp.hx, fp.hz) + R.footBare), layer: 'dirt', strength: R.footStrength, source: p.id });
		}
		// tuft clusters per ecology cell: 3–7 tufts round an off-centre point, varying radius, orientation and count; a few loners.
		// A cap must thin the whole map, never cut it off in scan order: the expected cluster count of every cell is planned first,
		// one global factor brings the plan under the budget, and the cells are visited in a seeded shuffled order (the hard cap
		// that remains as a backstop then falls on random cells).
		const ec = R.ecoCell, enx = Math.ceil((b.x1 - b.x0) / ec), enz = Math.ceil((b.z1 - b.z0) / ec);
		const cells = [];
		let expectTotal = 0;
		for (let j = 0; j < enz; j++) {
			for (let i = 0; i < enx; i++) {
				const x0 = b.x0 + i * ec, z0 = b.z0 + j * ec;
				let mean = 0;
				for (const [fx, fz] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) mean += (site(x0 + fx * ec, z0 + fz * ec)?.density ?? 0) / 5;
				const expect = mean * R.clustersPerCell * grassScale;
				cells.push({ i, j, x0, z0, expect });
				expectTotal += expect;
			}
		}
		const factor = Math.min(1, L.budgets.tufts / Math.max(1, expectTotal * R.tuftsPerClusterMean));
		eco.stats.tuftFactor = round3(factor);
		for (const cell of shuffled(cells, L.stream('ecology', 'order:tufts'))) {
			const { i, j, x0, z0 } = cell;
			if (full()) { L.warnings.push({ code: 'budget.tufts', message: `tufts capped at ${L.budgets.tufts}` }); break; }
			const rng = L.stream('ecology', `cell:${i},${j}`);
			const expect = cell.expect * factor, nc = Math.floor(expect) + (rng.next() < expect - Math.floor(expect) ? 1 : 0);
			for (let c = 0; c < nc; c++) {
				const ax = x0 + rng.next() * ec, az = z0 + rng.next() * ec;
				const radius = rng.range(R.clusterRadius[0], R.clusterRadius[1]), aspect = rng.range(R.clusterAspect[0], R.clusterAspect[1]), rot = rng.next() * TAU, n = rng.int(R.tuftsPerCluster[0], R.tuftsPerCluster[1]);
				const sx = (rng.next() - 0.5) * radius * R.clusterOffset, sz = (rng.next() - 0.5) * radius * R.clusterOffset; // off-centre
				const anchor = site(ax, az);
				const tone = anchor ? anchor.tone + (rng.next() - 0.5) * R.toneJitter[0] : null;
				const id = nextCluster;
				let placed = 0;
				const cr = Math.cos(rot), sr = Math.sin(rot);
				for (let t = 0; t < n; t++) {
					const r = radius * Math.pow(rng.next(), 0.7), a = rng.next() * TAU;
					const lx = Math.cos(a) * r, lz = Math.sin(a) * r * aspect;
					if (plant(ax + sx + lx * cr - lz * sr, az + sz + lx * sr + lz * cr, rng, tone === null ? null : tone + (rng.next() - 0.5) * R.toneJitter[1], id, 'grass')) placed++;
				}
				if (placed) { nextCluster++; eco.stats.clusters++; }
				if (rng.chance(R.lonerChance)) {
					const [dx, dz] = rng.disc(R.lonerReach);
					if (plant(ax + dx, az + dz, rng, tone, -1, 'grass', { tall: false })) eco.stats.loners++;
				}
			}
			// damp banks get their own tufts, not the thickest grass at the wettest spot (bank zones fully, other water edges half as often)
			const wc = waterEdge(P, x0 + ec / 2, z0 + ec / 2, 8);
			if (wc < BIOME_RULES.creekClear + R.bankWidth + ec) {
				const brng = L.stream('ecology', `bank:${i},${j}`);
				const bankMul = L.profile(L.zoneAt(x0 + ec / 2, z0 + ec / 2).kind).bank ? 1 : R.bankOther;
				if (brng.chance(R.bankChance * bankMul)) {
					const ax = x0 + brng.next() * ec, az = z0 + brng.next() * ec, n = brng.int(R.bankTufts[0], R.bankTufts[1]);
					for (let t = 0; t < n; t++) {
						const [dx, dz] = brng.disc(R.bankSpread);
						const x = ax + dx, z = az + dz, e = waterEdge(P, x, z, 8);
						if (e < BIOME_RULES.creekClear || e > BIOME_RULES.creekClear + R.bankWidth) continue;
						if (plant(x, z, brng, lerp(R.bankTone[0], R.bankTone[1], brng.next()), -1, 'bank', { bank: true, h: lerp(R.edgeH[0], R.edgeH[1], brng.next()) * H, tall: false })) eco.stats.bank++;
					}
				}
			}
		}
	}

	// shrubs: kit shrubs 0.3–0.5 H (§4.2 "bụi" is a low prop), walk-through, sparse at edges and prop feet, away from combat. Same budget
	// rule as the tufts: plan every cell's expectation, thin by one factor, visit the cells in a seeded shuffled order.
	const sh = L.density.shrubs;
	if (sh > 0) {
		const ec = R.ecoCell, enx = Math.ceil((b.x1 - b.x0) / ec), enz = Math.ceil((b.z1 - b.z0) / ec);
		const shrubGrid = new PlacementGrid(R.shrubSpacing);
		const quietRule = (c) => {
			const d = P.reservedGrid.query(c.fp.x0 - R.shrubQuiet, c.fp.z0 - R.shrubQuiet, c.fp.x1 + R.shrubQuiet, c.fp.z1 + R.shrubQuiet, (r) => {
				if (r.kind === 'path' || r.kind === 'water') return r.kind === 'path' && shapeGap(r, c.fp.pts) < R.shrubPathClear ? 'path-edge' : null;
				return shapeGap(r, c.fp.pts) < R.shrubQuiet ? r.kind : null;
			});
			return d ? `quiet:${d}` : null;
		};
		const cells = [];
		let expectTotal = 0;
		for (let j = 0; j < enz; j++) {
			for (let i = 0; i < enx; i++) {
				const x0 = b.x0 + i * ec, z0 = b.z0 + j * ec, cx = x0 + ec / 2, cz = z0 + ec / 2;
				const here = site(cx, cz, { allowStrip: false }) ?? site(cx + R.shrubProbe, cz + R.shrubProbe);
				if (!here) continue;
				const prof = L.profile(here.zone.kind), edgeF = here.edge ? R.shrubEdge[0] : R.shrubEdge[1];
				const expect = R.shrubRate * (prof.shrubs ?? 1) * sh * edgeF * clamp(here.density * R.shrubGain[0] + R.shrubGain[1], 0, 1);
				cells.push({ i, j, x0, z0, prof, expect });
				expectTotal += expect;
			}
		}
		const factor = Math.min(1, L.budgets.shrubs / Math.max(1, expectTotal));
		for (const cell of shuffled(cells, L.stream('ecology', 'order:shrubs'))) {
			const { i, j, x0, z0, prof } = cell;
			if (eco.shrubs.length >= L.budgets.shrubs) { L.warnings.push({ code: 'budget.shrubs', message: `shrubs capped at ${L.budgets.shrubs}` }); break; }
			const rng = L.stream('ecology', `shrub:${i},${j}`);
			const expect = cell.expect * factor, n = Math.floor(expect) + (rng.next() < expect - Math.floor(expect) ? 1 : 0);
			for (let k = 0; k < n && eco.shrubs.length < L.budgets.shrubs; k++) {
				const x = x0 + rng.next() * ec, z = z0 + rng.next() * ec;
				const ids = rng.chance(prof.tall ? R.shrubTall[0] : R.shrubTall[1]) ? cat.shrubSets.tall : cat.shrubSets.low;
				const list = cat.resolve(rng.pick(ids));
				if (!list.length) continue;
				const target = rng.range(R.shrubH[0], R.shrubH[1]) * H, scale = clamp(target / list[0].height, list[0].scale[0], list[0].scale[1]), yaw = rng.next() * TAU;
				if (list[0].height * scale >= R.tallMin) continue; // a "tall" prop would need an occlusion zone: bushes stay under 0.5 H
				const p = L.placeItem({
					group: 'ecology', step: 5, id: `shrub:${i},${j}:${k}`, key: `shrub:${i},${j}:${k}`, target: { x, z }, reach: R.reach.shrub, maxTries: R.shrubTries, assets: list, rng: L.stream('ecology', `shrubj:${i},${j}:${k}`),
					cand: { noRegister: true, owner: null, noGap: true }, silent: true, meta: { role: 'ground', part: 'shrub' },
					rules: [quietRule, (c) => (site(c.x, c.z)?.density > R.minDensity ? (shrubGrid.accept(c.x, c.z) ? null : 'shrub-spacing') : 'habitat')],
					make: () => ({ yaw, scale }),
				});
				if (p) eco.shrubs.push(p);
			}
		}
	}
}

/** Fisher–Yates over a copy, drawn from a seeded stream. */
function shuffled(list, rng) {
	const out = list.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const k = Math.floor(rng.next() * (i + 1));
		[out[i], out[k]] = [out[k], out[i]];
	}
	return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Step 6 · traces (§4.6.6, §4.10): the cause first, then pieces from that cause only; clean ground between events

/**
 * Where an event's host is and what it is: `kinds` (cart, carcass, den, camp, door, building, altar, shrine, grave …) are
 * checked against TRACES[cause].hosts. A bare point without a `kind` is taken as the author's word (kinds = null).
 */
function hostPoint(L, host) {
	if (!host) return null;
	if (typeof host === 'object') return { id: null, x: host.x, z: host.z, r0: 0, kinds: host.kind ? [host.kind] : null };
	const P = L.P;
	const cluster = L.clusters.find((c) => c.id === host && !c.dropped);
	if (cluster) {
		const rec = L.byId.get(cluster.host.id), recipe = L.catalog.clusters?.[cluster.recipe];
		return { id: host, x: cluster.rest.x, z: cluster.rest.z, r0: rec ? Math.hypot(rec.fp.hx, rec.fp.hz) + (rec.asset.use?.depth ?? 0) : L.R.hostR0, kinds: [...(recipe?.hostKinds ?? []), ...(rec?.asset.hostKinds ?? [])] };
	}
	const mass = L.byId.get(`mass:${host}`);
	if (mass) {
		const m = (L.plan.masses ?? []).find((q) => q.id === host);
		return { id: host, x: mass.fp.cx, z: mass.fp.cz, r0: Math.hypot(mass.fp.hx, mass.fp.hz), kinds: [m?.kind, ...(m?.hostKinds ?? []), ...(mass.asset.hostKinds ?? [])].filter(Boolean) };
	}
	const door = P.doors.find((d) => d.id === host);
	if (door) return { id: host, x: door.at.x + door.front.x, z: door.at.z + door.front.z, r0: Math.max(door.width, door.depth) / 2 + L.R.hostPad, kinds: ['door', door.kind, L.zoneAt(door.at.x, door.at.z).kind] };
	const it = P.interactions.find((i) => i.id === host) ?? P.spawns.find((i) => i.id === host);
	if (it) return { id: host, x: it.at.x, z: it.at.z, r0: it.radius, kinds: [it.kind ?? 'interaction'] };
	const p = L.byId.get(host);
	return p ? { id: host, x: p.fp.cx, z: p.fp.cz, r0: Math.hypot(p.fp.hx, p.fp.hz), kinds: [...p.asset.hostKinds] } : null;
}

const areaOf = (a) => (a.footprint.x1 - a.footprint.x0) * (a.footprint.z1 - a.footprint.z0);

function placeEvent(L, ev) {
	const R = L.R, cat = L.catalog;
	const recipe = cat.traces?.[ev.cause];
	if (!recipe) {
		L.warnings.push({ code: 'event.cause', id: ev.id, message: `unknown cause ${ev.cause}` });
		return;
	}
	const rng = L.stream('trace', `event:${ev.id}`), owner = `event:${ev.id}`, age = ev.age ?? 'old';
	const dropsBefore = L.drops.length;
	let mainAsset = null;
	const record = { id: ev.id, cause: ev.cause, age, host: null, at: null, lean: null, dropped: false, main: null, secondary: [], drag: [], placed: [] };
	const host = hostPoint(L, ev.host);
	if (!host) {
		L.warnings.push({ code: 'event.host', id: ev.id, message: 'an event needs a host (den mouth, carcass, grave, camp, cart, door …): none found' });
		record.dropped = true;
		L.drops.push({ step: 6, group: 'trace', item: ev.id, asset: null, reason: 'play', detail: 'no host', x: round3((ev.at ?? { x: 0 }).x), z: round3((ev.at ?? { z: 0 }).z) });
		L.events.push(record);
		return;
	}
	record.host = host.id ?? { x: host.x, z: host.z };
	record.hostKinds = host.kinds;
	if (host.kinds && !recipe.hosts.some((k) => host.kinds.includes(k))) {
		// the cause names its hosts: a predation event on a house door, a ritual on a cart are not stories (§4.10 phân bố theo vật chủ)
		L.warnings.push({ code: 'event.hostKind', id: ev.id, message: `a ${ev.cause} event needs a host of kind ${recipe.hosts.join('|')}; ${host.id ?? 'the point'} is ${host.kinds.join('/') || 'nothing'}` });
		record.dropped = true;
		L.drops.push({ step: 6, group: 'trace', item: ev.id, asset: null, reason: 'play', detail: `host kind ${host.kinds.join('/') || 'none'} not in ${recipe.hosts.join('|')}`, x: round3((ev.at ?? host).x), z: round3((ev.at ?? host).z) });
		L.events.push(record);
		return;
	}
	const dir = ev.dir === undefined ? rng.next() * TAU : typeof ev.dir === 'number' ? ev.dir : Math.atan2(ev.dir.z, ev.dir.x);
	const lean = dir + (rng.next() - 0.5) * R.leanJitter;
	let at = ev.at;
	if (!at) {
		const a = rng.next() * TAU, d = (host.r0 ?? 0) + rng.range(R.eventOffset[0], R.eventOffset[1]);
		at = { x: host.x + Math.cos(a) * d, z: host.z + Math.sin(a) * d };
	}
	record.at = { x: round3(at.x), z: round3(at.z) };
	record.lean = round3(lean);
	const ok = (e) => e.age === undefined || e.age === 'any' || e.age === age;
	const gapRule = (c) => {
		for (const p of L.placements) {
			if (p.group !== 'trace' || p.event === ev.id) continue;
			if (obbGap(c.fp, obbFrom(p.footprint)) < R.eventGap) return `event-gap:${p.id}`;
		}
		return null;
	};
	// measured from the host's outline, not its centre: a barn is wider than the hostRadius
	const hostRule = (c) => (Math.hypot(c.x - host.x, c.z - host.z) > (recipe.hostRadius ?? R.hostRadius) + (host.r0 ?? 0) ? 'host-radius' : null);
	const piece = (entry, key, target, rules, scaleMul = 1, part = 'secondary') => {
		const list = cat.resolve(entry.asset);
		const prng = L.stream('trace', `${owner}:${key}`);
		const scale = prng.range(entry.scale[0], entry.scale[1]) * scaleMul, yaw = prng.next() * TAU;
		return L.placeItem({
			group: 'trace', step: 6, id: `trace:${ev.id}:${key}`, key: `${ev.id}:${key}`, target, reach: R.reach.trace, assets: list, rng: L.stream('trace', `${owner}:${key}:jitter`),
			cand: { owner }, rules, meta: { part, event: ev.id, age, lean: record.lean },
			make: () => ({ yaw, scale }),
		});
	};
	const fail = () => {
		const mine = L.drops.splice(dropsBefore);
		L.rollback(record.placed);
		const tally = new Map();
		for (const d of mine) tally.set(d.reason, (tally.get(d.reason) ?? 0) + 1);
		let best = 'play';
		for (const reason of CHECK_ORDER) if (tally.has(reason) && (tally.get(reason) > (tally.get(best) ?? 0) || !tally.has(best))) best = reason;
		const first = mine.find((d) => d.reason === best);
		// the drop names the asset of the recipe entry that failed (never the rolled-back placement id), and nothing of the event survives
		L.drops.push({ step: 6, group: 'trace', item: ev.id, asset: first?.asset ?? mainAsset ?? null, reason: first ? best : 'play', detail: `event dropped whole: ${first?.detail || 'no room'}`, x: round3(at.x), z: round3(at.z) });
		record.dropped = true;
		record.main = null;
		record.secondary = [];
		record.drag = [];
		record.placed = [];
		L.events.push(record);
	};

	const mains = recipe.main.filter(ok);
	if (!mains.length) return fail();
	const mainEntry = rng.pick(mains);
	mainAsset = mainEntry.asset;
	const main = piece(mainEntry, 'main', at, [hostRule, gapRule], 1, 'main');
	if (!main) return fail();
	record.main = main.id;
	record.placed.push(main);

	// 2–6 secondary leaning to one side (a deliberate ring for rituals); heavy ones near the main piece, light ones further out
	// the zone profile scales the density of traces (bonesMul: a den is full of bones, a moor path has few), 2–6 at the end
	const bonesMul = L.profile(L.zoneAt(at.x, at.z).kind).bonesMul ?? 1;
	const want = clamp(Math.round(rng.int(R.traceSecondary[0], R.traceSecondary[1]) * L.density.traces * bonesMul), R.traceSecondary[0], R.traceSecondary[1]);
	const pool = recipe.secondary.filter(ok);
	const picks = Array.from({ length: want }, () => rng.weighted(pool, (e) => e.w ?? 1));
	picks.sort((a, b) => (cat.get(b.asset) ? areaOf(cat.get(b.asset)) : 0) - (cat.get(a.asset) ? areaOf(cat.get(a.asset)) : 0));
	const ring = Array.from({ length: want }, () => rng.range(R.traceRing[0], R.traceRing[1])).sort((a, b) => a - b);
	const reachMain = Math.hypot(main.footprint.hx, main.footprint.hz) * R.mainReach;
	const sectorRule = (c) => {
		const ang = Math.atan2(c.z - main.z, c.x - main.x);
		return recipe.pattern === 'ring' || angleDiff(ang, lean) <= R.traceLean + R.leanTol ? null : 'lean-sector';
	};
	for (const [i, entry] of picks.entries()) {
		// stratified over the sector so the pieces do not pile onto one spot
		const a = recipe.pattern === 'ring' ? lean + (i * TAU) / want + rng.range(-R.ringJitter, R.ringJitter) : lean - R.traceLean + ((i + 0.5) / want) * 2 * R.traceLean + rng.range(-R.stratJitter, R.stratJitter);
		const own = cat.resolve(entry.asset)[0];
		const d = reachMain + ring[i] + (own ? Math.max(own.footprint.x1 - own.footprint.x0, own.footprint.z1 - own.footprint.z0) * R.secReach : R.hostPad);
		const p = piece(entry, `s${i}`, { x: main.x + Math.cos(a) * d, z: main.z + Math.sin(a) * d }, [sectorRule, gapRule]);
		if (p) { record.secondary.push(p.id); record.placed.push(p); }
	}
	if (record.secondary.length < R.traceSecondary[0]) return fail();

	// 0–2 further along the drag direction, each smaller
	const dragPool = recipe.drag ?? [];
	if (dragPool.length) {
		const m = rng.int(R.traceDrag[0], R.traceDrag[1]);
		let d = reachMain + ring[ring.length - 1] + rng.range(R.dragStep[0], R.dragStep[1]);
		for (let k = 0; k < m; k++) {
			const a = dir + rng.range(-R.dragJitter, R.dragJitter);
			const p = piece(rng.pick(dragPool), `d${k}`, { x: main.x + Math.cos(a) * d, z: main.z + Math.sin(a) * d }, [gapRule], R.dragScale ** (k + 1), 'drag');
			if (p) { record.drag.push(p.id); record.placed.push(p); }
			d += rng.range(R.dragStep[0], R.dragStep[1]);
		}
	}
	// ground paint under each piece: bare dirt + damp (old events dry out; fresh ones stay wet)
	const wet = (recipe.paint?.wet ?? 0) * (age === 'fresh' ? R.wetFresh : R.wetOld), dirt = recipe.paint?.dirt ?? R.dirtDefault;
	for (const p of record.placed) {
		const radius = round3(Math.max(p.footprint.hx, p.footprint.hz) + R.paintPad);
		L.groundPaint.push({ x: p.footprint.cx, z: p.footprint.cz, radius, layer: 'dirt', strength: round3(dirt), source: p.id });
		if (wet > R.paintMin) L.groundPaint.push({ x: p.footprint.cx, z: p.footprint.cz, radius: round3(radius * R.wetShrink), layer: 'wet', strength: round3(Math.min(1, wet)), source: p.id });
	}
	record.placed = record.placed.map((p) => p.id);
	L.events.push(record);
}

/** Grass and shrubs that fall on a trace's footprint or paint disc are removed afterwards (the rest of the grass is not reshuffled). */
function filterEcology(L) {
	const eco = L.eco, traces = L.placements.filter((p) => p.group === 'trace');
	eco.stats.removed = { tufts: 0, shrubs: 0 };
	if (!traces.length) return;
	const discs = traces.map((p) => ({ x: p.footprint.cx, z: p.footprint.cz, r: Math.max(p.footprint.hx, p.footprint.hz) + L.R.removePad, fp: obbFrom(p.footprint) }));
	const inDisc = (x, z) => discs.some((d) => (x - d.x) ** 2 + (z - d.z) ** 2 < d.r * d.r);
	const t = eco.tufts, keep = [];
	for (let i = 0; i < t.x.length; i++) if (!inDisc(t.x[i], t.z[i])) keep.push(i);
	eco.stats.removed.tufts = t.x.length - keep.length;
	if (keep.length !== t.x.length) for (const k of Object.keys(t)) t[k] = keep.map((i) => t[k][i]);
	const before = eco.shrubs.length;
	eco.shrubs = eco.shrubs.filter((s) => !inDisc(s.x, s.z) && !discs.some((d) => obbGap(obbFrom(s.footprint), d.fp) < L.R.removeGap));
	eco.stats.removed.shrubs = before - eco.shrubs.length;
	const c = eco.carpet;
	for (let j = 0; j < c.nz; j++) for (let i = 0; i < c.nx; i++) if (c.density[j * c.nx + i] && inDisc(c.x0 + (i + 0.5) * c.cell, c.z0 + (j + 0.5) * c.cell)) c.density[j * c.nx + i] = 0;
}

function stepTraces(L) {
	if (L.density.traces > 0) {
		for (const ev of L.plan.events ?? []) {
			if (L.events.length >= L.budgets.events) { L.warnings.push({ code: 'budget.events', message: `events capped at ${L.budgets.events}` }); break; }
			placeEvent(L, ev);
		}
	}
	filterEcology(L);
}

// ---------------------------------------------------------------------------------------------------------------
// Step 7 · validate: the automatable part of the §4.12 checklist, recomputed from the result alone (independent of the
// indexes the algorithm used). Exact geometry; `tol` covers the millimetre rounding of the output.

const TOL = 0.005;
const some = (list, n = 8) => list.slice(0, n);

/** BFS on a 0.25 m grid with the agent radius from the main road's start: does it reach every door, interaction, spawn and arena? */
export function passability(P, placements, R) {
	const cell = 0.25, b = P.bounds, nx = Math.ceil((b.x1 - b.x0) / cell), nz = Math.ceil((b.z1 - b.z0) / cell), ar = R.agentRadius;
	const blocked = new Uint8Array(nx * nz);
	const at = (i, j) => j * nx + i;
	const cx = (i) => b.x0 + (i + 0.5) * cell, cz = (j) => b.z0 + (j + 0.5) * cell;
	for (const p of placements) {
		if (!p.blocks) continue;
		const fp = obbFrom(p.footprint);
		for (let j = Math.max(0, Math.floor((fp.z0 - ar - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((fp.z1 + ar - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((fp.x0 - ar - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((fp.x1 + ar - b.x0) / cell)); i++) {
				if (!blocked[at(i, j)] && pointPolySigned(fp.pts, cx(i), cz(j)) < ar) blocked[at(i, j)] = 1;
			}
		}
	}
	// water blocks, except where a path crosses it (ford / bridge)
	for (const w of P.water) {
		for (const s of w.shapes) {
			const sb = shapeBox(s);
			for (let j = Math.max(0, Math.floor((sb.z0 - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((sb.z1 - b.z0) / cell)); j++) {
				for (let i = Math.max(0, Math.floor((sb.x0 - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((sb.x1 - b.x0) / cell)); i++) {
					if (blocked[at(i, j)] || pointShapeGap(s, cx(i), cz(j)) >= 0) continue;
					const info = nearestPath(P, cx(i), cz(j), 4, (q) => q.walkable);
					if (!info || info.edge >= 0) blocked[at(i, j)] = 1;
				}
			}
		}
	}
	const start = P.mainPath?.points[0];
	const reached = new Uint8Array(nx * nz);
	let seeded = false;
	if (start) {
		let si = Math.floor((start.x - b.x0) / cell), sj = Math.floor((start.z - b.z0) / cell);
		for (let r = 0; r < 12 && !seeded; r++) {
			for (let dj = -r; dj <= r && !seeded; dj++) {
				for (let di = -r; di <= r; di++) {
					const i = si + di, j = sj + dj;
					if (i >= 0 && j >= 0 && i < nx && j < nz && !blocked[at(i, j)]) { si = i; sj = j; seeded = true; break; }
				}
			}
		}
		if (seeded) {
			const queue = new Int32Array(nx * nz);
			let head = 0, tail = 0;
			queue[tail++] = at(si, sj);
			reached[at(si, sj)] = 1;
			while (head < tail) {
				const k = queue[head++], i = k % nx, j = (k - i) / nx;
				for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
					const ni = i + di, nj = j + dj;
					if (ni < 0 || nj < 0 || ni >= nx || nj >= nz || reached[at(ni, nj)] || blocked[at(ni, nj)]) continue;
					if (di && dj && (blocked[at(i + di, j)] || blocked[at(i, j + dj)])) continue;
					reached[at(ni, nj)] = 1;
					queue[tail++] = at(ni, nj);
				}
			}
		}
	}
	const targets = [];
	const probe = (kind, id, shape) => {
		const sb = shapeBox(shape);
		let free = 0, got = 0;
		for (let j = Math.max(0, Math.floor((sb.z0 - b.z0) / cell)); j <= Math.min(nz - 1, Math.floor((sb.z1 - b.z0) / cell)); j++) {
			for (let i = Math.max(0, Math.floor((sb.x0 - b.x0) / cell)); i <= Math.min(nx - 1, Math.floor((sb.x1 - b.x0) / cell)); i++) {
				if (pointShapeGap(shape, cx(i), cz(j)) > 0 || blocked[at(i, j)]) continue;
				free++;
				if (reached[at(i, j)]) got++;
			}
		}
		targets.push({ kind, id, free, reached: got, ok: got > 0 });
	};
	for (const d of P.doors) probe('door', d.id, { t: 'poly', pts: d.corridor.pts });
	for (const i of P.interactions) probe('interaction', i.id, { t: 'circle', x: i.at.x, z: i.at.z, r: i.radius });
	for (const s of P.spawns) probe('spawn', s.id, { t: 'circle', x: s.at.x, z: s.at.z, r: s.radius });
	for (const a of P.arenas) probe('arena', a.id, a.shape);
	return { seeded, targets };
}

/** Occlusion share of every screen window along the paths and play-critical points (§4.3: tall props ≤ 25 %). */
export function occlusionWindows(P, placements, R) {
	const polys = placements.filter((p) => p.occlusion).map((p) => p.occlusion);
	const raster = rasterPolys(P.bounds, R.occRaster, polys);
	let max = 0, at = null;
	const centres = windowCentres(P, R.windowStep);
	for (const c of centres) {
		const v = windowCoverage(raster, screenWindow(P, c.x, c.z));
		if (v > max) { max = v; at = { x: round3(c.x), z: round3(c.z), on: c.path }; }
	}
	return { max: round3(max), raw: max, at, windows: centres.length };
}

export function validateLayout(plan, result, catalog, options = {}) {
	const R = { ...(result.report?.rules ?? LAYOUT_RULES), ...(options.rules ?? {}) };
	const P = preparePlan(plan, R);
	const checks = [];
	const add = (id, rule, pass, details) => checks.push({ id, rule, pass, details });
	const placements = result.placements;
	const fps = new Map(placements.map((p) => [p.id, obbFrom(p.footprint)]));
	const fpGrid = new Grid(4);
	for (const p of placements) {
		const fp = fps.get(p.id), use = p.use ? obbFrom(p.use) : null;
		const qb = use ? { x0: Math.min(fp.x0, use.x0), z0: Math.min(fp.z0, use.z0), x1: Math.max(fp.x1, use.x1), z1: Math.max(fp.z1, use.z1) } : fp;
		fpGrid.insert({ p, fp, use, decal: p.layer === 'decal' }, qb.x0, qb.z0, qb.x1, qb.z1);
	}
	const decById = new Map((result.decisions ?? []).map((d) => [d.id, d]));
	const eventById = new Map((result.events ?? []).map((e) => [e.id, e]));
	// a piece is from the recipe when it is one of the entry's alternatives, or — only if EVERY alternative of the entry is missing
	// from the scene — in the fallback closure of the entry (catalog.resolve: two levels)
	const closure = (ids) => {
		const out = new Set(), walk = (list, depth) => { for (const id of list) for (const f of catalog.assets.get(id)?.fallback ?? []) if (!out.has(f) && depth < 2) { out.add(f); walk([f], depth + 1); } };
		walk(ids, 0);
		return out;
	};
	const fromEntry = (entries, assetId) => entries.some((ids) => ids.includes(assetId) || (ids.every((id) => !catalog.available(id)) && closure(ids).has(assetId)));
	const pairs = (fn, pad = R.passGap + 0.1) => {
		const seen = new Set();
		for (const p of placements) {
			const fp = fps.get(p.id);
			fpGrid.query(fp.x0 - pad, fp.z0 - pad, fp.x1 + pad, fp.z1 + pad, (o) => {
				if (o.p === p) return null;
				const key = p.id < o.p.id ? `${p.id}|${o.p.id}` : `${o.p.id}|${p.id}`;
				if (seen.has(key)) return null;
				seen.add(key);
				fn(p, o.p, fp, o.fp, o);
				return null;
			});
		}
	};

	// plan numbers (§4.3, §5.1)
	add('plan', 'AD12 §4.3 / §5.1: main path ≥ 3 Sub, door ≥ 2 Sub, arena ≥ 8×8 Sub', P.warnings.length === 0, { warnings: P.warnings.map((w) => w.message) });

	// 1 · the play space is never narrowed
	{
		const bad = [];
		for (const p of placements) {
			const fp = fps.get(p.id);
			P.reservedGrid.query(fp.x0, fp.z0, fp.x1, fp.z1, (r) => {
				if (r.id === p.owns || (r.kind === 'arena' && p.layer === 'decal' && R.arenaDecals)) return null;
				const gap = shapeGap(r, fp.pts);
				// authored masses may touch a corridor but never enter it; everything else keeps the clearance
				if (gap < (p.authored ? -EPS - TOL : r.clear - TOL)) bad.push({ id: p.id, kind: r.kind, with: r.id, gap: round3(gap) });
				return null;
			});
		}
		add('play-space', 'AD12 §4.6.1 / §4.12: footprints stay off path corridors (pathClear), doors, interaction and spawn zones, arenas and water', bad.length === 0, { checked: placements.length, violations: some(bad) });
	}
	// 1b · the camera shadow of a tall piece never covers a door corridor, standing zone, spawn or arena (recomputed from the output)
	{
		const bad = [];
		for (const p of placements) {
			if (!p.occlusion || p.authored) continue;
			const ownDoor = p.group === 'guide' ? decById.get(p.decision)?.door : null; // the markers of a door flank that corridor
			const ob = bboxOf(p.occlusion);
			P.reservedGrid.query(ob.x0, ob.z0, ob.x1, ob.z1, (r) => {
				if ((r.kind !== 'door' && r.kind !== 'interaction' && r.kind !== 'spawn' && r.kind !== 'arena') || r.id === p.owns || (r.kind === 'door' && r.id === ownDoor)) return null;
				const gap = shapeGap(r, p.occlusion);
				if (gap < -TOL) bad.push({ id: p.id, kind: r.kind, with: r.id, gap: round3(gap) });
				return null;
			});
		}
		add('occlusion-zones', 'AD12 §4.6.2 / §5.2: the camera shadow (occlusion zone) of a tall piece never covers a door corridor, standing zone, spawn or arena; only the markers of a door may graze that door', bad.length === 0, { checked: placements.filter((p) => p.occlusion && !p.authored).length, violations: some(bad) });
	}
	// 2 · footprints
	{
		const bad = [];
		pairs((a, b, fa, fb) => {
			if (a.layer === 'decal' !== (b.layer === 'decal')) return;
			if (obbSeparation(fa, fb) < -TOL) bad.push({ a: a.id, b: b.id, sep: round3(obbSeparation(fa, fb)) });
		});
		add('overlap', 'AD12 §4.8 / §4.12: no two footprints overlap (decals aside)', bad.length === 0, { violations: some(bad) });
	}
	// 3 · pass gaps between blockers of different groups
	{
		const bad = [];
		pairs((a, b, fa, fb) => {
			if (!a.blocks || !b.blocks || (a.authored && b.authored)) return;
			const same = (a.owner && a.owner === b.owner) || (a.cluster && a.cluster === b.cluster);
			const gap = obbGap(fa, fb);
			if (gap < (same ? R.clusterGap : R.passGap) - TOL) bad.push({ a: a.id, b: b.id, gap: round3(gap) });
		});
		add('gaps', 'AD12 §4.12 / §5.1: blockers of different clusters / masses keep ≥ passGap (2 Sub) apart; one cluster (host mass included) keeps clusterGap', bad.length === 0, { passGap: round3(R.passGap), violations: some(bad) });
	}
	// 3b · open ground between clusters (§4.11 trại địch): pieces of different clusters keep clusterClear, and stay out of other hosts' bare radius
	{
		const bad = [];
		pairs((a, b, fa, fb) => {
			if (!a.cluster || !b.cluster || a.cluster === b.cluster || a.layer === 'decal' || b.layer === 'decal') return;
			const gap = obbGap(fa, fb);
			if (gap < R.clusterClear - TOL) bad.push({ a: a.id, b: b.id, gap: round3(gap) });
		}, R.clusterClear + 0.1);
		for (const c of result.clusters ?? []) {
			const bare = catalog.clusters?.[c.recipe]?.bare ?? 0;
			if (c.dropped || !c.rest || !(bare > 0)) continue;
			for (const p of placements) {
				if (!p.cluster || p.cluster === c.id || p.layer === 'decal') continue;
				const d = pointPolySigned(fps.get(p.id).pts, c.rest.x, c.rest.z);
				if (d < bare - TOL) bad.push({ a: p.id, bare: c.id, gap: round3(d) });
			}
		}
		add('cluster-clear', 'AD12 §4.11 / §4.6: open ground between clusters — pieces of different clusters keep clusterClear apart and outside the bare radius of other hosts', bad.length === 0, { clusterClear: R.clusterClear, violations: some(bad) });
	}
	// 4 · use zones
	{
		const bad = [];
		for (const p of placements) {
			if (!p.use || p.layer === 'decal') continue;
			const use = obbFrom(p.use);
			fpGrid.query(use.x0, use.z0, use.x1, use.z1, (o) => {
				if (o.p === p || o.decal) return null;
				if (obbSeparation(use, o.fp) < -TOL) bad.push({ use: p.id, blocker: o.p.id });
				return null;
			});
		}
		add('use-zones', 'AD12 §4.8: the operating / standing zone of a host or prop stays free', bad.length === 0, { zones: placements.filter((p) => p.use).length, violations: some(bad) });
	}
	// 5 · ecology never grows through the play space, water, footprints or use zones
	{
		const t = result.ecology.tufts, bad = [];
		const checkPoint = (kind, i, x, z) => {
			let edge = Infinity, strip = false;
			P.pathGrid.query(x - 1, z - 1, x + 1, z + 1, (seg) => {
				const dx = seg.b.x - seg.a.x, dz = seg.b.z - seg.a.z, tt = clamp(((x - seg.a.x) * dx + (z - seg.a.z) * dz) / (dx * dx + dz * dz || 1), 0, 1);
				const d = Math.hypot(x - seg.a.x - tt * dx, z - seg.a.z - tt * dz);
				edge = Math.min(edge, d - seg.path.half);
				const ru = seg.path.ruts, s = seg.s0 + tt * seg.len;
				if (ru && s >= ru.s0 && s <= ru.s1 && d <= ru.stripHalf + TOL) strip = true;
				return null;
			});
			if (edge < -TOL && !(strip && (kind === 3 || kind === 'strip'))) return bad.push({ kind, i, why: 'corridor', x, z });
			if (P.ground(x, z).water || waterEdge(P, x, z, 3) < 0) return bad.push({ kind, i, why: 'water', x, z });
			let why = null;
			P.reservedGrid.query(x - 0.5, z - 0.5, x + 0.5, z + 0.5, (r) => {
				if (r.kind === 'door' || r.kind === 'interaction' || r.kind === 'spawn') if (pointShapeGap(r, x, z) < -TOL) why = r.kind;
				return null;
			});
			if (why) return bad.push({ kind, i, why, x, z });
			fpGrid.query(x - 0.5, z - 0.5, x + 0.5, z + 0.5, (o) => {
				if (pointPolySigned(o.fp.pts, x, z) < -TOL) why = `footprint:${o.p.id}`;
				else if (o.use && !o.decal && pointPolySigned(o.use.pts, x, z) < -TOL) why = `use:${o.p.id}`;
				return why ? true : null;
			});
			return why ? bad.push({ kind, i, why, x, z }) : 0;
		};
		for (let i = 0; i < t.x.length; i++) {
			checkPoint(t.kind[i], i, t.x[i], t.z[i]);
			if (t.kind[i] === KIND_ID.row && zoneAt(P, t.x[i], t.z[i]).kind !== 'field') bad.push({ i, why: 'row outside a field zone' });
		}
		for (const s of result.ecology.shrubs) checkPoint('shrub', s.id, s.x, s.z);
		add('ecology-exclusion', 'AD12 §4.7 / §4.12: no tuft or shrub on corridors (except the low strip between ruts), water, footprints or use zones; rows only in fields', bad.length === 0, { tufts: t.x.length, shrubs: result.ecology.shrubs.length, violations: some(bad) });
	}
	// 6 · passability
	{
		const pas = passability(P, placements, R);
		// a plan without a walkable path has no start to walk from: nothing to prove
		add('passability', 'AD12 §4.12: walk through every door, standing zone, spawn and arena from the main road (BFS, 0.25 m grid, agent radius ' + R.agentRadius + ' m)', !P.mainPath || (pas.seeded && pas.targets.every((x) => x.ok)), pas);
	}
	// 7 · guides
	{
		const bad = [], guides = placements.filter((p) => p.group === 'guide'), decs = new Map((result.decisions ?? []).map((d) => [d.id, d]));
		for (const p of guides) {
			const d = decs.get(p.decision);
			if (!d) { bad.push({ id: p.id, why: 'no decision' }); continue; }
			if (Math.hypot(p.x - d.x, p.z - d.z) > R.decisionRadius + TOL) bad.push({ id: p.id, why: 'outside the decision radius' });
			const fp = fps.get(p.id);
			// shoulder band against the corridor it marks
			if (d.door) {
				const door = P.doors.find((q) => q.id === d.door), gap = polyDistance(door.corridor.pts, fp.pts);
				if (gap < R.doorClear - TOL || gap > R.shoulderMax + TOL) bad.push({ id: p.id, why: 'off the door shoulder', gap: round3(gap) });
			} else if (d.path) {
				const path = P.paths.find((q) => q.id === d.path);
				let gap = Infinity;
				for (const seg of path.segs) gap = Math.min(gap, segPolyDistance(seg.a, seg.b, fp.pts) - path.half);
				if (gap < R.shoulderMin - TOL || gap > R.shoulderMax + TOL) bad.push({ id: p.id, why: 'off the shoulder', gap: round3(gap) });
				if (d.kind === 'fork' && d.branchDir && p.part === 'fork') {
					const at = pointAt(path, d.s), n = { x: at.tz, z: -at.tx };
					const mine = Math.sign(n.x * (p.x - at.x) + n.z * (p.z - at.z)), branch = Math.sign(n.x * d.branchDir.x + n.z * d.branchDir.z);
					if (mine === branch) bad.push({ id: p.id, why: 'fork marker on the branch side' });
				}
			}
			// artificial lights only where someone maintains them: never on animal trails, never in a den, on moor paths only if inhabited
			if (p.light) {
				const info = nearestPath(P, p.x, p.z, 12);
				const zn = zoneAt(P, p.x, p.z), prof = catalog.zones?.[zn.kind];
				if (info?.path.kind === 'animal') bad.push({ id: p.id, why: 'light on an animal trail' });
				if (prof && !prof.lit) bad.push({ id: p.id, why: `light in a ${zn.kind} zone` });
				else if (prof && prof.guide === 'natural' && !(info?.path.inhabited)) bad.push({ id: p.id, why: `light on a ${zn.kind} path nobody keeps` });
			}
		}
		for (let i = 0; i < guides.length; i++) {
			for (let j = i + 1; j < guides.length; j++) {
				if (guides[i].pair && guides[i].pair === guides[j].pair) continue;
				if (Math.hypot(guides[i].x - guides[j].x, guides[i].z - guides[j].z) < R.torchGap - TOL) bad.push({ a: guides[i].id, b: guides[j].id, why: 'closer than torchGap' });
			}
		}
		add('guides', 'AD12 §4.9: markers at decisions, on the shoulder, none on animal trails / in dens, ≥ torchGap apart (gate pairs aside), forks mark the continuing route', bad.length === 0, { markers: guides.length, decisions: (result.decisions ?? []).length, violations: some(bad) });
	}
	// 8 · traces
	{
		const bad = [];
		for (const ev of result.events ?? []) {
			if (ev.dropped) {
				if (!result.report.drops.some((d) => d.item === ev.id)) bad.push({ id: ev.id, why: 'dropped but not reported' });
				continue;
			}
			const mine = placements.filter((p) => p.event === ev.id), main = mine.filter((p) => p.part === 'main'), sec = mine.filter((p) => p.part === 'secondary'), drag = mine.filter((p) => p.part === 'drag');
			if (main.length !== 1) bad.push({ id: ev.id, why: `${main.length} main pieces` });
			if (sec.length < R.traceSecondary[0] || sec.length > R.traceSecondary[1]) bad.push({ id: ev.id, why: `${sec.length} secondary pieces` });
			if (drag.length > R.traceDrag[1]) bad.push({ id: ev.id, why: `${drag.length} drag pieces` });
			const rec = catalog.traces?.[ev.cause];
			const entries = [...(rec?.main ?? []), ...(rec?.secondary ?? []), ...(rec?.drag ?? [])].map((e) => [e.asset]);
				for (const p of mine) if (!fromEntry(entries, p.asset)) bad.push({ id: p.id, why: 'piece not in the cause recipe' });
				if (rec && ev.hostKinds && !rec.hosts.some((k) => ev.hostKinds.includes(k))) bad.push({ id: ev.id, why: `host kind ${ev.hostKinds.join('/')} is not one of ${rec.hosts.join('|')}` });
			const host = ev.hostPos ?? null;
			if (host && main[0] && Math.hypot(main[0].x - host.x, main[0].z - host.z) > (rec?.hostRadius ?? R.hostRadius) + (host.r0 ?? 0) + TOL) bad.push({ id: ev.id, why: 'main piece beyond hostRadius' });
			if (rec?.pattern !== 'ring') for (const p of sec) if (angleDiff(Math.atan2(p.z - main[0].z, p.x - main[0].x), ev.lean) > R.traceLean + 0.06) bad.push({ id: p.id, why: 'outside the lean sector' });
		}
		const traces = placements.filter((p) => p.group === 'trace');
		for (let i = 0; i < traces.length; i++) {
			for (let j = i + 1; j < traces.length; j++) {
				if (traces[i].event === traces[j].event) continue;
				if (obbGap(fps.get(traces[i].id), fps.get(traces[j].id)) < R.eventGap - TOL) bad.push({ a: traces[i].id, b: traces[j].id, why: 'closer than eventGap' });
			}
		}
		add('traces', 'AD12 §4.10: 1 main + 2–6 secondary per event inside the lean sector, a host within hostRadius, eventGap between events, dropped events reported', bad.length === 0, { events: (result.events ?? []).length, placed: (result.events ?? []).filter((e) => !e.dropped).length, violations: some(bad) });
	}
	// 9 · clusters
	{
		const bad = [], byRecipe = {};
		for (const c of result.clusters ?? []) {
			if (c.dropped) continue;
			const recipe = catalog.clusters?.[c.recipe];
			if (!recipe) continue;
			(byRecipe[c.recipe] ??= []).push(c);
			if (c.requested < recipe.count[0] || c.requested > recipe.count[1]) bad.push({ id: c.id, why: `requested ${c.requested} outside ${recipe.count}` });
			if (c.placed > recipe.count[1]) bad.push({ id: c.id, why: `placed ${c.placed} > ${recipe.count[1]}` });
			const entries = recipe.members.map((m) => m.asset);
			if (recipe.host && !c.mass && c.host && !fromEntry([recipe.host], c.host.asset)) bad.push({ id: c.host.id, why: 'host not from the recipe' });
			for (const id of c.members) {
				const p = placements.find((q) => q.id === id);
				const a = catalog.assets.get(p.asset);
				if (!fromEntry(entries, p.asset)) bad.push({ id, why: 'not from the recipe' });
				if (p.orient === 'axis') {
					const quarter = Math.abs(wrapAngle((p.yaw - c.frame.yaw) * 4)) / 4; // distance to the nearest multiple of 90°
					if (quarter > R.axisTol) bad.push({ id, why: `not on the host axes (${round3(quarter)} rad off)` });
				}
				if (p.orient === 'rest' || p.orient === 'host') {
					const want = yawFacing(c.rest.x - p.x, c.rest.z - p.z);
					if (angleDiff(p.yaw + a.front, want) > R.faceTol) bad.push({ id, why: 'does not face the rest point' });
				}
			}
		}
		for (const [name, list] of Object.entries(byRecipe)) {
			if (list.length < 2) continue;
			const sig = (c) => `${c.counts.join(',')}|${Math.round(c.radius * 2)}|${c.members.length}`;
			if (new Set(list.map(sig)).size < 2) bad.push({ recipe: name, why: 'all clusters of the recipe are identical' });
		}
		add('clusters', 'AD12 §4.6.3 / §4.8: members only from the recipe, counts in range, built pieces on the host axes, seats face the rest point, clusters differ', bad.length === 0, { clusters: (result.clusters ?? []).length, violations: some(bad) });
	}
	// 10 · camera: occlusion share, landmark rhythm, light budget
	{
		const occ = occlusionWindows(P, placements, R);
		add('occlusion', 'AD12 §4.3 / §5.2: tall props cover ≤ 25 % of every screen window', occ.raw <= R.occlusionMax + 1e-9, occ);
		const path = P.mainPath, miss = [];
		if (path) {
			for (let s0 = 0; s0 < path.length - R.landmarkWindow * 0.25; s0 += R.landmarkWindow) {
				const s1 = Math.min(path.length, s0 + R.landmarkWindow), samples = [];
				for (let s = s0; s <= s1 + 1e-6; s += 4) samples.push(pointAt(path, Math.min(s, path.length)));
				if (!placements.some((p) => isLandmark(R, p) && samples.some((q) => Math.hypot(p.x - q.x, p.z - q.z) <= R.landmarkSee))) miss.push({ s0: Math.round(s0), s1: Math.round(s1) });
			}
		}
		add('landmark', 'AD12 §4.3: a landmark (≥ 2 H) within sight of every 1–2 screens of the main path', miss.length === 0, { missing: miss });
		let worst = 0, where = null;
		const lights = placements.filter((p) => p.light);
		for (const c of windowCentres(P, R.windowStep)) {
			const w = screenWindow(P, c.x, c.z);
			const n = lights.filter((p) => pointInPoly(w.poly, p.light.x, p.light.z)).length;
			if (n > worst) { worst = n; where = { x: round3(c.x), z: round3(c.z) }; }
		}
		add('lights', 'AD12 §4.9: light budget per screen window', worst <= R.maxLightsPerScreen, { max: worst, limit: R.maxLightsPerScreen, at: where });
	}
	// 10b · scales stay in the range the asset declares (trace recipes carry their own scale, shrunk by dragScale along the drag)
	{
		const bad = [];
		const range = (p, a) => {
			if (p.group !== 'trace') return a.scale;
			const rec = catalog.traces?.[eventById.get(p.event)?.cause];
			const es = [...(rec?.main ?? []), ...(rec?.secondary ?? []), ...(rec?.drag ?? [])].filter((e) => e.asset === p.asset);
			if (!es.length) return a.scale;
			return [Math.min(...es.map((e) => e.scale[0])) * (p.part === 'drag' ? R.dragScale ** R.traceDrag[1] : 1), Math.max(...es.map((e) => e.scale[1]))];
		};
		const check = (p) => {
			const a = catalog.assets.get(p.asset);
			if (!a || p.authored || p.procedural) return;
			const [lo, hi] = range(p, a);
			if (p.scale < lo - 0.002 || p.scale > hi + 0.002) bad.push({ id: p.id, asset: p.asset, scale: p.scale, range: [round3(lo), round3(hi)] });
		};
		placements.forEach(check);
		result.ecology.shrubs.forEach(check);
		add('scale-range', 'AD12 §4.6 / §4.8: every placed piece keeps the scale range its asset declares (trace recipes: their own range)', bad.length === 0, { checked: placements.length + result.ecology.shrubs.length, violations: some(bad) });
		const mixes = (result.clusters ?? []).filter((c) => !c.dropped && c.sizeMix && c.pieces >= R.sizeMixMin);
		const flat = mixes.filter((c) => !sizeRhythmOk(c.sizeMix));
		add('size-rhythm', 'AD12 §4.3 / §4.8: a cluster of 4+ pieces mixes sizes (something bigger than small, something small) — "1 lớn – 2 trung – 3+ nhỏ" as a rhythm, three quarters of the clusters', mixes.length === 0 || flat.length <= mixes.length * 0.25, { clusters: mixes.length, flat: flat.map((c) => ({ id: c.id, mix: c.sizeMix })) });
	}
	// 11 · bounded effort and budgets
	{
		const bad = [], tr = result.report.tries;
		if (tr.items) {
			// with options.logTries: every item stayed inside its own maxTries and the items add up to the total
			let sum = 0;
			for (const [group, id, used, max] of tr.items) {
				sum += used;
				if (used > max) bad.push({ id, group, why: `used ${used} tries > its maxTries ${max}` });
			}
			if (sum !== tr.total) bad.push({ why: `items used ${sum} tries, total says ${tr.total}` });
		}
		if (tr.total > tr.budget) bad.push({ why: `tries ${tr.total} > budget ${tr.budget}` });
		if (tr.maxPerItem > R.maxTries) bad.push({ why: `an item used ${tr.maxPerItem} tries > ${R.maxTries}` });
		for (const p of placements) if (p.target && Math.hypot(p.x - p.target.x, p.z - p.target.z) > p.reach + 0.01) bad.push({ id: p.id, why: `farther than reach (${p.reach}) from its target` });
		const bud = result.report.budgets;
		if ((result.report.counts.compositions ?? 0) > bud.masses) bad.push({ why: 'mass budget exceeded' });
		if (placements.filter((p) => p.group === 'guide').length > bud.guides) bad.push({ why: 'guide budget exceeded' });
		if (result.ecology.tufts.x.length > bud.tufts) bad.push({ why: 'tuft budget exceeded' });
		if (result.ecology.shrubs.length > bud.shrubs) bad.push({ why: 'shrub budget exceeded' });
		if ((result.events ?? []).length > bud.events) bad.push({ why: 'event budget exceeded' });
		add('bounded', 'AD12 §4.12: bounded tries inside a fixed reach, budgets per group, nothing forced', bad.length === 0, { tries: tr, violations: some(bad) });
	}
	// 12 · one focal per screen
	{
		const focals = placements.filter((p) => p.focal), bad = [];
		for (let i = 0; i < focals.length; i++) for (let j = i + 1; j < focals.length; j++) if (Math.hypot(focals[i].x - focals[j].x, focals[i].z - focals[j].z) < P.camera.screen.w && !(focals[i].authored && focals[j].authored)) bad.push({ a: focals[i].id, b: focals[j].id });
		add('focal', 'AD12 §4.6.2: one focal point per composition / screen', bad.length === 0, { focals: focals.length, violations: some(bad) });
	}
	return checks;
}

// ---------------------------------------------------------------------------------------------------------------
// Entry point

const typed = (arr, Type) => Type.from(arr);

/**
 * Arranges the assets of a biome. `plan` = bounds + ground + the play-space data, hosts and events (see docs in AD 12 §4.13);
 * `catalog` = buildCatalog(...); `options` = { seeds, density, budgets, rules }. Returns { placements, ecology, groundPaint,
 * reserved, decisions, clusters, events, report }.
 */
export function layoutBiome(plan, catalog, options = {}) {
	const L = new Layout(plan, catalog, options);
	const time = (name, fn) => {
		const t0 = now();
		fn();
		L.ms[name] = round3(now() - t0);
	};
	time('0-prepare', () => {});
	L.ms['1-lock'] = 0;
	time('2-masses', () => { placeAuthoredMasses(L); placeAutoMasses(L); ensureLandmarks(L); markFocals(L); });
	L.compositions = L.autoCompositions ?? 0;
	time('3-clusters', () => stepClusters(L));
	time('4-guides', () => stepGuides(L));
	time('5-ecology', () => stepEcology(L));
	time('6-traces', () => stepTraces(L));
	const t = L.eco.tufts, kindCount = {};
	for (const k of t.kind) kindCount[k] = (kindCount[k] ?? 0) + 1;
	const result = {
		placements: L.placements,
		ecology: {
			tufts: { x: typed(t.x, Float32Array), z: typed(t.z, Float32Array), h: typed(t.h, Float32Array), tone: typed(t.tone, Float32Array), cluster: typed(t.cluster, Int32Array), kind: typed(t.kind, Uint8Array), kinds: KIND_ID },
			shrubs: L.eco.shrubs,
			carpet: L.eco.carpet,
		},
		groundPaint: L.groundPaint,
		reserved: reservedOutput(L.P),
		decisions: L.decisions.map((d) => ({ id: d.id, kind: d.kind, x: round3(d.x), z: round3(d.z), s: d.s === null ? null : round3(d.s), path: d.path, door: d.door, important: d.important, auto: d.auto, hidden: d.hidden, zone: d.zone, policy: d.policy, branch: d.branch ?? undefined, branchDir: d.branchDir ? { x: round3(d.branchDir.x), z: round3(d.branchDir.z) } : undefined, side: d.side, markers: d.markers })),
		clusters: L.clusters,
		events: L.events.map((e) => ({ ...e, hostPos: hostPoint(L, e.host) ?? undefined })),
		report: {
			seeds: { plan: plan.seed ?? 1, ...L.seeds },
			density: L.density,
			budgets: L.budgets,
			rules: L.R,
			counts: { ...L.counts, compositions: L.compositions, ecology: { tufts: t.x.length, shrubs: L.eco.shrubs.length, byKind: kindCount, ...L.eco.stats } },
			drops: L.drops,
			warnings: L.warnings,
			checks: [],
			tries: L.tryLog ? { ...L.tries, items: L.tryLog } : L.tries,
				ms: L.ms,
		},
	};
	const t0 = now();
	result.report.checks = validateLayout(plan, result, catalog);
	for (const c of result.report.checks) if (!c.pass) L.warnings.push({ code: `check.${c.id}`, message: `${c.rule}` });
	L.ms['7-validate'] = round3(now() - t0);
	L.ms.total = round3(Object.values(L.ms).reduce((a, b) => a + b, 0));
	return result;
}

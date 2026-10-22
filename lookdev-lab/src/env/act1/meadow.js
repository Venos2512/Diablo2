// ASHLAR · Act I base maps — the MEADOW, pure part (no THREE): field vegetation, sleep smoke as terrain, the land apron beyond the bounds. Read by
// env/act1/meadowBuild.js (THREE side, hooked into env/act1/outdoorBuild.js) for any outdoor plan that has `field`, `smoke` or `far.apron`; first used by
// maps/poppyReach.js (the Poppy Reach, LD 11.6: "red poppies to the horizon in grey-green grass"; "sleep smoke is terrain"). Deterministic (seeded); tests
// scripts/act1-meadow.test.mjs. World metres as in env/act1/outdoor.js (x east, z south, y up).
//
// ---- PLAN FIELDS (all optional) -------------------------------------------------------------------------------------------------------------------
// field: { seed, density (× all), cell (m, the jitter grid; default 1),
//   poppy: { asset, perM2 (clumps / m² where the density is 1), sprinkle (density 0..1 outside the drifts), height: [a, b] (m) },
//   grass: { asset, perM2 (tufts / m²), base (density 0..1 everywhere), height: [a, b] (m) },
//   drifts: [ { area, value, soft (m), edge: { amp, scale } } ] — where the poppies gather: soft, wobbled outlines,
//   rank: [ { area, value, soft, edge } ] — rank grass without poppies (wall feet, the shore),
//   breathe: { scale, cover, floor } — fBm patches keep breathing room inside a drift (`floor` = density left in the gaps): drifts, not noise,
//   clear: { paths (m beyond a path's half width: the lanes stay quiet), grassPaths, ramp (m), structures (m), water (m), holes: [area …] },
//   slope (max gradient), apron: { reach (m beyond the bounds), density (×) } } — poppies go on beyond the bounds on the apron, thinning out.
// smoke: { color, opacity, wallOpacity, height, soft (m: the edge band), wind: [dx, dz] (the way it drifts), slices: [[height frac, radius frac] …],
//   zones: [ { id, label, x, z, rx, rz, rot (deg), height, drift (m: half the travel along the wind), period (s), phase (0..1), lane: '<path id>' } ] }
//   — soft-edged but clearly bordered, evenly tinted volumes that breathe back and forth along the wind and so close and open the lanes they lie on.
// far.apron: { width (m beyond the bounds), blend (m: the edge height eases into the far land), sink (m below the water where the far land is flat),
//   hills: [ { x, z, r | rx + rz, h, power } ] (the far land above far.level), rings: [offsets (m) …], corner (fan points per corner) }
//   — the land goes on past the bounds (the terrain's own material), so a hillside map has no edge; it falls into the far water where the hills end.
import { Grid2, areaSigned, areaBox, polySigned, fbm, smoothstep, clamp, lerp, rng, FAR, resample } from './outdoor.js';

const TAU = Math.PI * 2;
const inBox = (b, x, z) => x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3];

// ---- field ------------------------------------------------------------------------------------------------------------------------------------
/**
 * The field's density functions on an evaluated world (null when the plan has no `field`): poppy(x, z), grass(x, z) in 0..1 (cleared: quiet lanes,
 * walls, water, holes, steep ground), drift / rank / breathe (raw), lane(x, z) (m beyond the nearest path's half width), structureDistance(x, z).
 */
export function fieldSampler(W) {
	const f = W.plan.field;
	if (!f) return null;
	const clear = f.clear ?? {};
	const seed = f.seed ?? 1;
	const paths = W.paths.filter((p) => p.kind !== 'walkway');
	// solid placements (not scatter items, not procedural placeholders) → a 0.5 m distance grid (clears the feet of walls, houses, gates)
	const S = Grid2.over(W.bounds, 0.5, FAR);
	const reachS = (clear.structures ?? 0.8) + 3;
	for (const s of W.structures) {
		if (s.scatter !== undefined || s.deck || s.def.status === 'procedural') continue;
		S.forEach((x, z, k) => (S.data[k] = Math.min(S.data[k], polySigned(s.footprint, x, z))), areaBox({ poly: s.footprint }, reachS));
	}
	const lane = (x, z) => {
		let best = FAR;
		for (const p of paths) {
			if (!inBox(p.box, x, z)) continue;
			best = Math.min(best, W.pathField(p.id).sample(x, z) - (p.width ?? 2) / 2);
		}
		return best;
	};
	const edgeOf = (d, i) => (d.edge ? (x, z) => (fbm(x / d.edge.scale + seed + i * 3.1, z / d.edge.scale - seed - i * 1.7, 1) - 0.5) * 2 * d.edge.amp : () => 0);
	const prep = (list, k0) => (list ?? []).map((d, i) => ({ ...d, soft: d.soft ?? 6, box: areaBox(d.area, (d.soft ?? 6) + (d.edge?.amp ?? 0)), edgeFn: edgeOf(d, i + k0) }));
	const drifts = prep(f.drifts, 0);
	const rank = prep(f.rank, 50);
	const within = (list, x, z) => {
		let v = 0;
		for (const d of list) {
			if (!inBox(d.box, x, z)) continue;
			const sd = areaSigned(d.area, x, z) + d.edgeFn(x, z);
			v = Math.max(v, (d.value ?? 1) * (1 - smoothstep(-d.soft / 2, d.soft / 2, sd)));
		}
		return v;
	};
	const br = { scale: 9, cover: 0.62, floor: 0.28, ...f.breathe };
	const breathe = (x, z) => lerp(br.floor, 1, smoothstep(1 - br.cover - 0.1, 1 - br.cover + 0.1, fbm(x / br.scale + seed * 1.3, z / br.scale - seed * 0.7, 1)));
	const holes = clear.holes ?? [];
	const [bx0, bz0, bx1, bz1] = W.bounds;
	const inBounds = (x, z) => x >= bx0 && x <= bx1 && z >= bz0 && z <= bz1;
	const ramp = clear.ramp ?? 1.4;
	const clearAt = (x, z, pad) => {
		let c = smoothstep(pad, pad + ramp, lane(x, z));
		if (c <= 0) return 0;
		const cs = clear.structures ?? 0.8;
		c *= smoothstep(cs, cs + 1, S.sample(x, z));
		if (c <= 0) return 0;
		const cw = clear.water ?? 0.8;
		c *= smoothstep(cw, cw + 1.5, W.waterDistance(x, z));
		for (const h of holes) c *= smoothstep(0, 0.6, areaSigned(h, x, z));
		if (f.slope !== undefined) c *= 1 - smoothstep(f.slope - 0.08, f.slope + 0.08, W.slope(x, z));
		return c;
	};
	return {
		drift: (x, z) => within(drifts, x, z),
		rank: (x, z) => within(rank, x, z),
		breathe,
		lane,
		structureDistance: (x, z) => S.sample(x, z),
		/** Poppy clump density 0..1 (the drift × breathing room, a sprinkle outside the drifts; cleared inside the bounds). */
		poppy(x, z) {
			const p = Math.max(f.poppy?.sprinkle ?? 0, within(drifts, x, z) * breathe(x, z));
			if (p <= 0.001) return 0;
			return inBounds(x, z) ? p * clearAt(x, z, clear.paths ?? 0.8) : p;
		},
		/** Meadow grass density 0..1 (the base everywhere, more in the rank drifts and a little in the poppy drifts; lanes keep only a thin verge). */
		grass(x, z) {
			const g = Math.max(f.grass?.base ?? 0.5, within(rank, x, z), 0.75 * within(drifts, x, z));
			return inBounds(x, z) ? g * clearAt(x, z, clear.grassPaths ?? 0.15) : g;
		},
	};
}

/**
 * The field's instances (seeded, a jittered grid of `cell` m; a cell holds ⌊n⌋ or ⌈n⌉ items for an expected n = perM2 · cell² · density):
 * { poppies: Float32Array (stride 7: x, y, z, yaw, height, tint 0..1, variant 0..2), poppyCount, grass: Float32Array (stride 7: x, y, z, yaw, height,
 * width, tone | atlas cell in the integer part ×10), grassCount, apronPoppies (count of the poppies beyond the bounds) }. `apronY` (meadow apronHeight)
 * lets the poppies run on beyond the bounds (field.apron.reach); without it they stop at the bounds. density multiplies every count.
 */
export function fieldInstances(W, { density = 1, apronY = null } = {}) {
	const f = W.plan.field;
	const F = fieldSampler(W);
	if (!F) return null;
	const r = rng((f.seed ?? 1) * 7919 + 17);
	const cell = f.cell ?? 1;
	const [bx0, bz0, bx1, bz1] = W.bounds;
	const reach = apronY ? (f.apron?.reach ?? 0) : 0;
	const level = W.plan.far?.level ?? 0;
	const k = (f.density ?? 1) * density;
	const pPer = (f.poppy?.perM2 ?? 1.5) * cell * cell * k;
	const gPer = (f.grass?.perM2 ?? 1) * cell * cell * k;
	const [ph0, ph1] = f.poppy?.height ?? [0.45, 0.85];
	const [gh0, gh1] = f.grass?.height ?? [0.3, 0.6];
	let pop = new Float32Array(1 << 16);
	let grass = new Float32Array(1 << 16);
	let np = 0;
	let ng = 0;
	let apron = 0;
	const grow = (a, n) => {
		if (n + 7 <= a.length) return a;
		const b = new Float32Array(a.length * 2);
		b.set(a);
		return b;
	};
	const count = (n) => Math.floor(n) + (r() < n - Math.floor(n) ? 1 : 0);
	for (let z = bz0 - reach; z < bz1 + reach; z += cell) {
		for (let x = bx0 - reach; x < bx1 + reach; x += cell) {
			const cx = x + cell / 2;
			const cz = z + cell / 2;
			const out = cx < bx0 || cx > bx1 || cz < bz0 || cz > bz1;
			let kOut = 1;
			if (out) {
				const d = Math.hypot(cx - clamp(cx, bx0, bx1), cz - clamp(cz, bz0, bz1));
				kOut = (f.apron?.density ?? 0.5) * (1 - smoothstep(reach * 0.45, reach, d));
				if (kOut <= 0.002) continue;
			}
			// poppies: drifts with breathing room; beyond the bounds only where the land stands above the far water
			const np0 = count(pPer * F.poppy(cx, cz) * kOut);
			for (let i = 0; i < np0; i++) {
				const px = x + r() * cell;
				const pz = z + r() * cell;
				const yaw = r() * TAU;
				const h = lerp(ph0, ph1, r());
				const tint = r();
				const variant = Math.floor(r() * 3);
				const y = out ? apronY(px, pz) : W.height(px, pz);
				if (out ? y < level + 0.2 : W.waterDepth(px, pz) > 0.02) continue;
				pop = grow(pop, np * 7);
				pop.set([px, y, pz, yaw, h, tint, variant], np * 7);
				np++;
				if (out) apron++;
			}
			if (out) continue; // grass only inside the bounds (the apron's own meadow texture carries it beyond)
			const ng0 = count(gPer * F.grass(cx, cz));
			for (let i = 0; i < ng0; i++) {
				const gx = x + r() * cell;
				const gz = z + r() * cell;
				const yaw = r() * Math.PI;
				const h = lerp(gh0, gh1, r());
				const w = h * (0.9 + r() * 0.5);
				const atlas = Math.floor(r() * 4);
				const tone = 0.62 + r() * 0.33;
				if (W.waterDepth(gx, gz) > 0.02) continue;
				grass = grow(grass, ng * 7);
				grass.set([gx, W.height(gx, gz), gz, yaw, h, w, atlas * 10 + tone], ng * 7);
				ng++;
			}
		}
	}
	return { poppies: pop.subarray(0, np * 7), poppyCount: np, grass: grass.subarray(0, ng * 7), grassCount: ng, apronPoppies: apron };
}

// ---- sleep smoke ----------------------------------------------------------------------------------------------------------------------------------
/** The smoke zones at time t (s, already × the speed slider): each zone breathes along the wind (± drift) with a slow sideways sway; adds cx, cz. */
export function smokeZones(plan, t) {
	const s = plan.smoke;
	if (!s) return [];
	const [wx, wz] = s.wind ?? [1, 0];
	const L = Math.hypot(wx, wz) || 1;
	const dx = wx / L;
	const dz = wz / L;
	return s.zones.map((zn) => {
		const ph = (zn.phase ?? 0) * TAU;
		const w = TAU / (zn.period ?? 80);
		const drift = zn.drift ?? 8;
		const a = Math.sin(t * w + ph) * drift;
		const b = Math.sin(t * w * 0.61 + ph * 1.7) * drift * 0.18;
		return { ...zn, cx: zn.x + dx * a - dz * b, cz: zn.z + dz * a + dx * b, height: zn.height ?? s.height ?? 2.6 };
	});
}

/** 0..1: how deep (x, z) lies inside a moved zone (1 inside, falling to 0 across the `soft` m edge band at the outline). */
export function smokeDensity(zone, x, z, soft = 1.2) {
	const sd = areaSigned({ ellipse: [zone.cx, zone.cz, zone.rx, zone.rz, zone.rot ?? 0] }, x, z);
	return 1 - smoothstep(-soft, 0, sd);
}

/** Metres of a path's centre line (sampled every metre) lying in smoke (density > 0.5) at time t — 0 = the lane is open; ≥ 3 m = closed by a bank. */
export function smokeCover(W, pathId, t, { zone = null } = {}) {
	const p = W.paths.find((q) => q.id === pathId);
	if (!p) throw new Error(`smokeCover: no path "${pathId}"`);
	const zones = smokeZones(W.plan, t).filter((z) => !zone || z.id === zone);
	let n = 0;
	for (const [x, z] of resample(p.pts.map((q) => [q[0], q[1]]), 1)) if (zones.some((zn) => smokeDensity(zn, x, z) > 0.5)) n++;
	return n;
}

// ---- the land apron beyond the bounds -----------------------------------------------------------------------------------------------------------
/**
 * Height of the land beyond the bounds (null without far.apron): the terrain's border height carried outward along its own slope, easing over `blend` m
 * into the far land (far.level + the apron hills; flat far land sinks `sink` m under the water). Inside the bounds it is the terrain itself.
 */
export function apronHeight(W) {
	const a = W.plan.far?.apron;
	if (!a) return null;
	const [bx0, bz0, bx1, bz1] = W.bounds;
	const level = W.plan.far.level ?? 0;
	const blend = a.blend ?? 60;
	const sink = a.sink ?? 0.8;
	const hills = a.hills ?? [];
	const farLand = (x, z) => {
		let h = 0;
		for (const hl of hills) {
			const d = Math.hypot((x - hl.x) / (hl.rx ?? hl.r), (z - hl.z) / (hl.rz ?? hl.r));
			if (d < 1) h = Math.max(h, hl.h * (0.5 + 0.5 * Math.cos(Math.PI * d)) ** (hl.power ?? 0.8));
		}
		return level + h - sink * (1 - smoothstep(0.2, 2.5, h));
	};
	const H = W.heights;
	return (x, z) => {
		const cx = clamp(x, bx0, bx1);
		const cz = clamp(z, bz0, bz1);
		const d = Math.hypot(x - cx, z - cz);
		if (d <= 1e-6) return H.sample(x, z);
		const ux = (x - cx) / d;
		const uz = (z - cz) / d;
		const edge = H.sample(cx, cz);
		const g = clamp((edge - H.sample(cx - ux * 4, cz - uz * 4)) / 4, -0.2, 0.2); // the border's outward slope (a 4 m baseline: small noise stays small)
		const t = smoothstep(0, blend, d);
		return lerp(edge + g * Math.min(d, 8), farLand(x, z), t); // the slope carries on for a few metres only (longer, it would draw ridges)
	};
}

/** Unit normal of the land at (x, z) — the terrain inside the bounds, the apron outside — by central differences (the apron and the terrain border share it). */
export function landNormal(W, apronY, x, z, out = [0, 1, 0], e = W.cell ?? 0.5) {
	const [bx0, bz0, bx1, bz1] = W.bounds;
	const h = (px, pz) => (px >= bx0 && px <= bx1 && pz >= bz0 && pz <= bz1 ? W.heights.sample(px, pz) : apronY(px, pz));
	const gx = (h(x + e, z) - h(x - e, z)) / (2 * e);
	const gz = (h(x, z + e) - h(x, z - e)) / (2 * e);
	const l = Math.hypot(gx, 1, gz);
	out[0] = -gx / l;
	out[1] = 1 / l;
	out[2] = -gz / l;
	return out;
}

/**
 * The apron mesh as plain arrays: rings round the bounds at growing offsets (far.apron.rings), the inner ring exactly on the terrain's border nodes (so
 * the seam is watertight), corners rounded by fans. { position, normal, uv (x / 4, −z / 4 like the terrain), index (Uint32), perRing, rings, border
 * (terrain node indices of the border, for sharing normals) }.
 */
export function apronMesh(W, apronY) {
	const a = W.plan.far.apron;
	const H = W.heights;
	const { nx, nz, x0, z0, cell } = H;
	const x1 = x0 + (nx - 1) * cell;
	const z1 = z0 + (nz - 1) * cell;
	const M = a.corner ?? 6;
	const rings = a.rings ?? [0, 1, 2.5, 5, 9, 15, 24, 36, 52, 74, 104, 145, 200, 270, Math.max(300, a.width ?? 360)];
	// the border loop: north edge west → east, east edge north → south, south edge east → west, west edge south → north; each corner node repeats with
	// fan normals turning from one edge's outward normal to the next
	const loop = []; // [x, z, outward x, outward z, terrain node index]
	const fan = (x, z, k, a0, a1) => {
		for (let m = 0; m <= M + 1; m++) {
			const ang = a0 + ((a1 - a0) * m) / (M + 1);
			loop.push([x, z, Math.cos(ang), Math.sin(ang), k]);
		}
	};
	const node = (i, j) => j * nx + i;
	for (let i = 0; i < nx - 1; i++) loop.push([x0 + i * cell, z0, 0, -1, node(i, 0)]);
	fan(x1, z0, node(nx - 1, 0), -Math.PI / 2, 0); // NE: north → east
	for (let j = 1; j < nz - 1; j++) loop.push([x1, z0 + j * cell, 1, 0, node(nx - 1, j)]);
	fan(x1, z1, node(nx - 1, nz - 1), 0, Math.PI / 2); // SE: east → south
	for (let i = nx - 2; i > 0; i--) loop.push([x0 + i * cell, z1, 0, 1, node(i, nz - 1)]);
	fan(x0, z1, node(0, nz - 1), Math.PI / 2, Math.PI); // SW: south → west
	for (let j = nz - 2; j > 0; j--) loop.push([x0, z0 + j * cell, -1, 0, node(0, j)]);
	fan(x0, z0, node(0, 0), Math.PI, (Math.PI * 3) / 2); // NW: west → north
	const P = loop.length;
	const R = rings.length;
	const position = new Float32Array(P * R * 3);
	const normal = new Float32Array(P * R * 3);
	const uv = new Float32Array(P * R * 2);
	const n3 = [0, 1, 0];
	for (let r = 0; r < R; r++) {
		const o = rings[r];
		for (let p = 0; p < P; p++) {
			const [bx, bz, ox, oz, k] = loop[p];
			const x = bx + ox * o;
			const z = bz + oz * o;
			const y = r === 0 ? H.data[k] : apronY(x, z);
			const v = r * P + p;
			position.set([x, y, z], v * 3);
			landNormal(W, apronY, x, z, n3);
			normal.set(n3, v * 3);
			uv.set([x / 4, -z / 4], v * 2);
		}
	}
	const index = new Uint32Array((R - 1) * P * 6);
	let w = 0;
	for (let r = 0; r + 1 < R; r++) {
		for (let p = 0; p < P; p++) {
			const q = (p + 1) % P;
			const A = r * P + p;
			const B = r * P + q;
			const D = (r + 1) * P + p;
			const E = (r + 1) * P + q;
			index.set([A, B, D, B, E, D], w); // counter-clockwise seen from above (+y) along the clockwise-on-the-map loop
			w += 6;
		}
	}
	const border = [...new Set(loop.map((l) => l[4]))];
	return { position, normal, uv, index, perRing: P, rings: R, border };
}

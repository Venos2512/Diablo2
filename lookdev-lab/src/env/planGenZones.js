// Zone templates of the plan generator (planGen.js): farm, camp, den and graveyard, each the demo's proven arrangement
// (biomeLayoutDemo.js) written relative to a frame, then varied (member counts, optional hosts, ±1–2 m spacing, mirror).
// A frame is a zone centre, a yaw and a mirror flag: local +z is the way the doors / gate / den mouth face, local x is across.
// The yaw is chosen by planGen.js so that every door faces the front half-plane of the camera (normal · (1, 1) > 0): the
// building, the wall or the rock then stands behind the opening as the camera sees it (AD 12 §5.2).
// Pure: no renderer, no randomness except the stream it is given. Metres, x east, z south.
import { makeObb, toWorld, yawFacing } from './biomeLayout.js';

const TAU = Math.PI * 2;
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const pt = (p) => ({ x: r2(p.x), z: r2(p.z) });
const wrap = (a) => {
	a = (a + Math.PI) % TAU;
	if (a < 0) a += TAU;
	return r3(a - Math.PI);
};

/** Numbers of the templates. Source "demo" = read off DEMO_PLAN (biomeLayoutDemo.js) relative to the zone centre; "kit" = measured footprint in kitSizes.json. */
export const ZONE_RULES = Object.freeze({
	farm: Object.freeze({
		r: 24, c0: [3, -3], // demo: farm zone r 26 centred on the yard; r 24 centred between the house, the barn and the pen (their members all fall inside) so that the zones fit a 128 m map
		house: { w: [6.6, 7.4], d: [4.6, 5.4], h: [3.7, 4.2], at: [-14, -7] }, // demo: house 7 × 5 h 4.1 at (−12, −7) from the centre; 2 m further out so that the barn door's screen window (21 m wide) holds only one of the two tall buildings
		barn: { w: [8.4, 9.6], d: [5.6, 6.4], h: [4.0, 4.6], at: [12, -9] }, // demo: barn 9 × 6 h 4.6 at (+10, −9)
		doorHouse: { width: 1.6, depth: 3 }, doorBarn: { width: 3, depth: 3 }, // demo
		yardAhead: 6.5, // lane end this far in front of the doors (demo: lane ends 6.5 m in front of the house door)
		penAfterBarn: 11, // demo: pen centre 12.5 m beyond the barn centre, on the yard row
		field: { w: [14, 18], d: [16, 20], offX: [-5, -5], offZ: [-5, -5] }, // demo: field 16 × 20 m, west of the house (x −18…−2, z +4…+24 from it); here beside the house, level with it (x −21…−5, z −12…+8), so the lane to the road does not have to go round it
		tannery: { along: 13, side: 6.8 }, // demo: tannery ~6 m beside the lane, ~14 m before its end
		pad: 12, // demo: flat pad r 12 round the yard
		jitter: 1.5, // ±1–2 m of spacing (spec)
	}),
	camp: Object.freeze({
		r: 22, c0: [1, -2], // demo: camp zone r 24; r 22 round the fire / hosts (the beacon and the far palisade pieces stand just outside, in moor)
		fire: [0, -3], // demo: fire (38, −42) from the zone centre (38, −39)
		gateZ: 11.5, wallZ: 11.4, // demo: gate z −27.5, palisade z −27.6 from the centre z −39
		wallInner: [5.2, 6.4], wallGap: 0.6, // demo: first wall piece 5.2 m from the gate axis, 0.6 m between pieces
		wallHalf: { c: 2.424, a: 1.69 }, // kit: wall_c / wall_a footprint half length (full box × shrink 0.9)
		beacon: { x: 18, z: 15, scale: [1.3, 1.35] }, // demo: beacon (56, −24), scale 1.3 (≥ 2 H: height 2.779 × scale)
		slots: { tentA: [-11, -3], tentB: [11, -3], kitchen: [7.5, -10.5], storage: [-13, 5], smithy: [17, -11], training: [-18, -6], altar: [0, -13], hunt: [-16, -14] }, // demo, relative to the zone centre
		spawns: [[-5, -5], [5, -6]], // demo spawn-camp-a / b
		yard: { z: 4.5, w: 8, d: 6 }, // demo: camp-yard rect 8 × 6 between the fire and the gate
		pad: 17, // demo: pad r 17 at the fire
		hostSpacing: 7.2, // clusterSpacing 7 + margin
		jitter: 0.8,
	}),
	den: Object.freeze({
		r: 13, c0: [0, 0], // demo: den zone r 13
		mass: { w: 6.4, d: 5.8, h: 2 }, // demo
		mouth: { width: 3, depth: 3 }, // demo: entrance door 3 × 3
		meadow: { r: 8, dist: [12, 22] }, // demo: meadow arena r 8; spec: carcass 15–25 m from the den
		carcass: { w: 2.8, d: 1.5, h: 0.5, dist: [15, 25] },
		rock: 8, pad: 5, // demo: rock disc r 8 round the den, pad r 5
		trailEnd: 8, // the animal trail stops this far from the road centre line (spec: "toward the road")
	}),
	graveyard: Object.freeze({
		r: 12, c0: [1, 3], // demo: graves zone r 13 round the shrine and the graves; r 12 centred between them
		shrine: [4, -4], graves: [[-6, 3], [9, 6], [0, 10]], // demo, relative to the zone centre (the road side is local −z)
		trailStop: 4.7, // demo: the shrine path ends 4.5 m before the shrine (interaction r 3.4 + clearance)
		pad: 7, // demo: pad r 7 at the shrine
		jitter: 1.2,
	}),
});

/** Local → world frame. Mirror flips the local x axis (the yaw of anything that has a handedness flips with it). */
export class Frame {
	constructor(cx, cz, theta, mirror = false) {
		this.cx = cx; this.cz = cz; this.theta = theta; this.mirror = mirror;
	}

	at(lx, lz) {
		const p = toWorld(this.cx, this.cz, this.theta, this.mirror ? -lx : lx, lz);
		return { x: p.x, z: p.z };
	}

	/** World vector of a local direction (no translation). */
	vec(lx, lz) {
		const p = toWorld(0, 0, this.theta, this.mirror ? -lx : lx, lz);
		return { x: p.x, z: p.z };
	}

	/** Yaw of a piece whose local yaw is `local` in the frame. */
	yaw(local = 0) { return wrap(this.theta + (this.mirror ? -local : local)); }

	/** Angle (atan2(dz, dx), the engine's event `dir`) of a local direction. */
	dir(lx, lz) {
		const v = this.vec(lx, lz);
		return r3(Math.atan2(v.z, v.x));
	}

	front() { return { x: Math.sin(this.theta), z: Math.cos(this.theta) }; }
}

/** Convex polygon (clockwise as the engine builds them) of an oriented box. */
export const boxPoly = (cx, cz, hx, hz, yaw) => makeObb(cx, cz, hx, hz, yaw).pts;
/** Regular polygon standing in for a circle: every vertex on the circle (so it is inside the outline `r` describes). */
export const circlePoly = (x, z, r, n = 12) => Array.from({ length: n }, (_, i) => ({ x: x + Math.cos((i / n) * TAU) * r, z: z + Math.sin((i / n) * TAU) * r }));
/** The corridor of a door as the engine builds it (doorEps in front of the wall). */
const doorPoly = (d) => {
	const eps = 0.05, c = toWorld(d.at.x, d.at.z, d.yaw, 0, eps + (d.depth - eps) / 2);
	return boxPoly(c.x, c.z, d.width / 2, (d.depth - eps) / 2, d.yaw);
};

const empty = (kind, id, centre, r) => ({
	kind, id, centre, r, zones: [], masses: [], hosts: [], doors: [], interactions: [], spawns: [], arenas: [], events: [], paths: [],
	solids: [], pads: [], levelPads: [], rocks: [], blood: [], lane: null, busy: false,
});

/** A solid for clearance tests: polygon + a margin that has to stay free round it. `pass` marks ground the zone's own path may enter (door fronts, the gate, the yard, the meadow). */
const solid = (poly, label, margin = 0, pass = false) => ({ poly, label, margin, pass });

/**
 * Host spacing: hosts of different clusters are at least `min` apart (the engine drops a host that is closer than clusterSpacing).
 * Jitter the slots, re-roll a few times and fall back to the unjittered slots.
 */
function spacedSlots(slots, jitter, rng, min) {
	for (let attempt = 0; attempt < 6; attempt++) {
		const j = attempt < 5 ? jitter * (1 - attempt * 0.2) : 0;
		const out = slots.map(([x, z]) => [x + rng.range(-j, j), z + rng.range(-j, j)]);
		let ok = true;
		for (let i = 0; i < out.length && ok; i++) for (let k = i + 1; k < out.length; k++) if (Math.hypot(out[i][0] - out[k][0], out[i][1] - out[k][1]) < min) { ok = false; break; }
		if (ok) return out;
	}
	return slots.map(([x, z]) => [x, z]);
}

// ---------------------------------------------------------------------------------------------------------------
// Farm

/**
 * Abandoned farm: a house (focal) and a barn with their doors toward the yard, a pen, optional tannery by the lane, a field
 * beside the yard on the front side, a raid at the house door, a collapse at the barn. `nm` makes ids unique per instance.
 */
export function buildFarm(F, rng, nm) {
	const R = ZONE_RULES.farm, J = R.jitter;
	const b = empty('farm', nm('farm'), F.at(...R.c0), R.r);
	b.busy = true;
	const hw = rng.range(...R.house.w), hd = rng.range(...R.house.d), hh = rng.range(...R.house.h);
	const bw = rng.range(...R.barn.w), bd = rng.range(...R.barn.d), bh = rng.range(...R.barn.h);
	const hl = [R.house.at[0] + rng.range(-J, J), R.house.at[1] + rng.range(-J, J)];
	const bl = [R.barn.at[0] + rng.range(-J, J), R.barn.at[1] + rng.range(-J, J)];
	const yawH = F.yaw(rng.range(-0.07, 0.07)), yawB = F.yaw(rng.range(-0.07, 0.07));
	const H = F.at(hl[0], hl[1]), B = F.at(bl[0], bl[1]);
	b.zones.push({ id: b.id, kind: 'farm', shape: { x: r2(b.centre.x), z: r2(b.centre.z), r: R.r } });
	b.masses.push({ id: nm('house'), kind: 'building', footprint: { w: r2(hw), d: r2(hd) }, height: r2(hh), at: pt(H), yaw: yawH, focal: true, label: 'Farmhouse' });
	b.masses.push({ id: nm('barn'), kind: 'building', footprint: { w: r2(bw), d: r2(bd) }, height: r2(bh), at: pt(B), yaw: yawB, label: 'Barn' });
	const dH = toWorld(H.x, H.z, yawH, 0, hd / 2), dB = toWorld(B.x, B.z, yawB, 0, bd / 2);
	b.doors.push({ id: nm('house-door'), at: pt(dH), yaw: yawH, kind: 'door', width: R.doorHouse.width, depth: R.doorHouse.depth });
	b.doors.push({ id: nm('barn-door'), at: pt(dB), yaw: yawB, kind: 'door', width: R.doorBarn.width, depth: R.doorBarn.depth });
	b.hosts.push({ id: nm('house-yard'), recipe: 'farmyard', mass: nm('house') }, { id: nm('barn-yard'), recipe: 'farmyard', mass: nm('barn') });
	// the yard: open ground in front of both doors; the lane ends in it
	const frontZ = Math.max(hl[1] + hd / 2, bl[1] + bd / 2);
	const yardL = [(hl[0] + bl[0]) / 2 + rng.range(-J, J), frontZ + R.yardAhead];
	const yard = F.at(yardL[0], yardL[1]);
	b.lane = { end: yard, away: F.front(), id: nm('farm-lane'), kind: 'branch', width: 2.6, inhabited: true };
	const pen = F.at(bl[0] + R.penAfterBarn + rng.range(-1, 1), yardL[1] - 1 + rng.range(-J, J));
	b.hosts.push({ id: nm('goat-pen'), recipe: 'pen', at: pt(pen), yaw: F.yaw(Math.PI / 2 + rng.range(-0.1, 0.1)) });
	// the field: beside the yard on the house's side, on the front half (rows follow the local x axis)
	const fw = rng.range(...R.field.w), fd = rng.range(...R.field.d);
	const fx1 = hl[0] - hw / 2 + R.field.offX[1] + rng.range(-1, 1), fz0 = hl[1] + R.field.offZ[0] + rng.range(-1, 1);
	const fieldL = [[fx1 - fw, fz0], [fx1, fz0], [fx1, fz0 + fd], [fx1 - fw, fz0 + fd]];
	const field = fieldL.map(([x, z]) => pt(F.at(x, z)));
	b.zones.push({ id: nm('barley'), kind: 'field', shape: field, rows: { angle: r3(F.dir(1, 0)) } });
	// events: a raid at the house door (clutter in front of it), a roof collapse beside the barn
	const raidAt = F.at(hl[0] + 3 + rng.range(-0.5, 0.5), hl[1] + hd / 2 + 5.5);
	b.events.push({ id: nm('house-raid'), cause: 'raid', host: nm('house-door'), at: pt(raidAt), dir: F.dir(0, 1), age: 'old' });
	const roofAt = F.at(bl[0] - 9 + rng.range(-0.5, 0.5), bl[1] + rng.range(-1, 1));
	b.events.push({ id: nm('barn-roof'), cause: 'collapse', host: nm('barn'), at: pt(roofAt), dir: F.dir(-1, 0), age: 'old' });
	b.levelPads.push({ x: H.x, z: H.z, r: r2(Math.hypot(hw, hd) / 2 + 0.8) }, { x: B.x, z: B.z, r: r2(Math.hypot(bw, bd) / 2 + 0.8) });
	const padC = F.at((hl[0] + bl[0]) / 2, frontZ - 1.5);
	b.pads.push({ x: padC.x, z: padC.z, r: R.pad });
	// solids (clearance tests): the buildings with their yards, the pen with its members, the field
	b.solids.push(solid(boxPoly(H.x, H.z, hw / 2, hd / 2, yawH), 'house', 1.2), solid(boxPoly(B.x, B.z, bw / 2, bd / 2, yawB), 'barn', 1.2));
	b.solids.push(solid(doorPoly(b.doors[0]), 'house-door', 0.3, true), solid(doorPoly(b.doors[1]), 'barn-door', 0.3, true));
	b.solids.push(solid(circlePoly(pen.x, pen.z, 5), 'pen', 0.8), solid(fieldL.map(([x, z]) => F.at(x, z)), 'field', 1));
	// the tannery goes beside the lane, which does not exist yet: planGen calls this once it has routed the lane
	b.afterLane = (lane, free, rng2) => {
		if (!rng2.chance(0.55)) return;
		const total = lane.length, s = Math.max(total * 0.4, total - R.tannery.along);
		const at = lane.at(s), sign0 = rng2.sign();
		for (const side of [sign0, -sign0]) {
			const p = { x: at.x + at.tz * side * R.tannery.side, z: at.z - at.tx * side * R.tannery.side };
			if (!free(p.x, p.z, 4.6)) continue;
			if (Math.hypot(p.x - pen.x, p.z - pen.z) < 9 || Math.hypot(p.x - H.x, p.z - H.z) < 9) continue;
			const fieldPoly = fieldL.map(([x, z]) => F.at(x, z));
			if (fieldPoly.length && polyHasPoint(fieldPoly, p, 4)) continue;
			b.hosts.push({ id: nm('tannery'), recipe: 'tannery', at: pt(p), yaw: wrap(yawFacing(at.x - p.x, at.z - p.z)) });
			b.solids.push(solid(circlePoly(p.x, p.z, 4.4), 'tannery', 0.5));
			return;
		}
	};
	return b;
}

/** Distance from point p to segment a–b. */
const segDist = (p, a, b) => {
	const dx = b.x - a.x, dz = b.z - a.z, t = Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
	return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz);
};

/** True when `p` is inside the polygon or within `margin` of it. */
function polyHasPoint(poly, p, margin) {
	let inside = false, near = Infinity;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const a = poly[i], c = poly[j];
		if ((a.z > p.z) !== (c.z > p.z) && p.x < ((c.x - a.x) * (p.z - a.z)) / (c.z - a.z) + a.x) inside = !inside;
		const dx = c.x - a.x, dz = c.z - a.z, t = Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
		near = Math.min(near, Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz));
	}
	return inside || near < margin;
}

// ---------------------------------------------------------------------------------------------------------------
// Camp

/**
 * Enemy camp behind the road: a palisade line with a gate on the camp's front, campfire at the centre, tents facing it,
 * kitchen, storage, optional smithy / training / ritual / hunt, a beacon at a front corner, two spawns, a yard arena,
 * a raid outside the gate and a ritual beside the altar.
 */
export function buildCamp(F, rng, nm) {
	const R = ZONE_RULES.camp;
	const b = empty('camp', nm('camp'), F.at(...R.c0), R.r);
	b.busy = true;
	b.zones.push({ id: b.id, kind: 'camp', shape: { x: r2(b.centre.x), z: r2(b.centre.z), r: R.r } });
	const has = { tentB: rng.chance(0.85), smithy: rng.chance(0.65), training: rng.chance(0.55), ritual: rng.chance(0.6), hunt: rng.chance(0.5) };
	const tents = 1 + (has.tentB ? 1 : 0) + (rng.chance(0.45) ? 1 : 0);
	const slotNames = ['tentA', 'kitchen', 'storage'];
	if (has.tentB) slotNames.push('tentB');
	for (const k of ['smithy', 'training', 'hunt']) if (has[k]) slotNames.push(k);
	if (has.ritual) slotNames.push('altar');
	// a third tent takes the first free work slot
	let tentC = null;
	if (tents === 3) tentC = ['smithy', 'training', 'hunt'].find((k) => !has[k]) ?? null;
	if (tentC) slotNames.push(tentC);
	const slotXY = tentC ? { ...R.slots, [tentC]: R.slots[tentC] } : R.slots;
	const placed = spacedSlots(slotNames.map((k) => slotXY[k]), R.jitter, rng, R.hostSpacing);
	const L = Object.fromEntries(slotNames.map((k, i) => [k, placed[i]]));
	const W = (k) => F.at(L[k][0], L[k][1]);
	// the fire
	const fireL = [R.fire[0] + rng.range(-0.8, 0.8), R.fire[1] + rng.range(-0.8, 0.8)];
	const fire = F.at(fireL[0], fireL[1]);
	b.hosts.push({ id: nm('fire'), recipe: 'campfire', at: pt(fire), yaw: r3(rng.range(-1, 1)) });
	const face = pt(fire);
	b.hosts.push({ id: nm('tent-a'), recipe: 'tent', at: pt(W('tentA')), face });
	if (has.tentB) b.hosts.push({ id: nm('tent-b'), recipe: 'tent', at: pt(W('tentB')), face });
	if (tentC) b.hosts.push({ id: nm('tent-c'), recipe: 'tent', at: pt(W(tentC)), face });
	b.hosts.push({ id: nm('cookpot'), recipe: 'kitchen', at: pt(W('kitchen')), yaw: F.yaw(Math.PI) });
	b.hosts.push({ id: nm('stores'), recipe: 'storage', at: pt(W('storage')), yaw: F.yaw(Math.PI / 2) });
	if (has.smithy) b.hosts.push({ id: nm('forge'), recipe: 'smithy', at: pt(W('smithy')), yaw: F.yaw(Math.PI) });
	if (has.training) b.hosts.push({ id: nm('yard'), recipe: 'training', at: pt(W('training')), yaw: F.yaw(Math.PI / 2) });
	if (has.ritual) b.hosts.push({ id: nm('altar'), recipe: 'ritual', at: pt(W('altar')), yaw: F.yaw(rng.range(-0.2, 0.2)) });
	if (has.hunt) b.hosts.push({ id: nm('butchery'), recipe: 'hunt', at: pt(W('hunt')), yaw: F.yaw(Math.PI / 2) });
	for (const h of b.hosts) b.solids.push(solid(circlePoly(h.at.x, h.at.z, 4.6), h.id, 0.4));
	// the palisade line and its gate (the gate is the camp's door: it faces the camp road, i.e. the front half-plane)
	const wallL = R.wallZ + rng.range(-0.4, 0.4), yaw = F.yaw(0);
	const gate = F.at(0, wallL + 0.1);
	b.doors.push({ id: nm('camp-gate'), at: pt(gate), yaw, kind: 'gate', width: 4, depth: 4, important: true });
	b.solids.push(solid(doorPoly(b.doors[0]), 'camp-gate', 0.3, true));
	for (const side of [-1, 1]) {
		let inner = rng.range(...R.wallInner);
		const types = rng.chance(0.5) ? ['c', 'a'] : ['a', 'c']; // spec / demo: 2 wall pieces each side (wall_c and wall_a)
		for (let i = 0; i < 2; i++) {
			const type = types[i], half = R.wallHalf[type];
			const lat = inner + half, at = F.at(side * lat, wallL);
			b.masses.push({ id: nm(`pal-${side < 0 ? 'l' : 'r'}${i + 1}`), asset: `palisade.wall_${type}`, at: pt(at), yaw });
			b.solids.push(solid(boxPoly(at.x, at.z, half, 1.05, yaw), `pal-${side}${i}`, 0.5));
			inner = lat + half + R.wallGap;
		}
	}
	// the beacon at a front corner (a landmark: height 2.779 × 1.3 ≥ 2 H)
	const cs = rng.sign(), bc = F.at(cs * (R.beacon.x + rng.range(-1.5, 1.5)), R.beacon.z + rng.range(-1.5, 1.5));
	const bScale = r2(rng.range(...R.beacon.scale));
	b.masses.push({ id: nm('beacon'), asset: 'lighting.beacon', at: pt(bc), yaw: F.yaw(0), scale: bScale, label: 'Camp beacon' });
	b.solids.push(solid(boxPoly(bc.x, bc.z, 0.72 * bScale, 0.64 * bScale, F.yaw(0)), 'beacon', 0.5));
	// spawns by the tents, the yard arena between the fire and the gate
	R.spawns.forEach(([x, z], i) => {
		const sp = F.at(x + rng.range(-0.8, 0.8), z + rng.range(-0.8, 0.8));
		b.spawns.push({ id: nm(`spawn-camp-${'ab'[i]}`), at: pt(sp), radius: 1.4 });
		b.solids.push(solid(circlePoly(sp.x, sp.z, 1.4), `spawn-${i}`, 0.3, true));
	});
	const yc = F.at(0, R.yard.z + (fireL[1] - R.fire[1])); // the yard follows the fire
	b.arenas.push({ id: nm('camp-yard'), rect: { x: r2(yc.x), z: r2(yc.z), w: R.yard.w, d: R.yard.d, yaw: F.yaw(0) } });
	b.solids.push(solid(boxPoly(yc.x, yc.z, R.yard.w / 2, R.yard.d / 2, F.yaw(0)), 'camp-yard', 0.3, true));
	// events: a raid outside the gate, a ritual on the free (west, away from the kitchen) side of the altar
	const raid = F.at(-6 + rng.range(-1, 1), wallL + 4.1);
	b.events.push({ id: nm('skirmish'), cause: 'raid', host: nm('camp-gate'), at: pt(raid), dir: F.dir(0.36, 0.93), age: 'old' });
	if (has.ritual) {
		const altar = W('altar'), rite = F.at(L.altar[0] - 5, L.altar[1] - 0.5);
		b.events.push({ id: nm('rite'), cause: 'ritual', host: nm('altar'), at: pt(rite), age: 'fresh' });
		b.blood.push({ x: altar.x, z: altar.z, r: 7.5, k: 0.95 });
	}
	b.pads.push({ x: fire.x, z: fire.z, r: R.pad });
	b.lane = { end: pt(F.at(0, wallL + 1.6)), away: F.front(), id: nm('camp-road'), kind: 'branch', width: 2.6, inhabited: true };
	return b;
}

// ---------------------------------------------------------------------------------------------------------------
// Den

/**
 * Beast den: a rock mass with the mouth (entrance door) toward the front, a spawn beside it, a meadow arena 14–22 m away with a
 * carcass at its rim, predation at the mouth and at the carcass, and an animal trail den → meadow → road.
 * `ctx.road(x, z)` = nearest road point { x, z, d }; `ctx.clear(x, z, r)` = a disc of r is clear of road, water, the edge and the zones placed so far.
 * Returns null when no meadow fits.
 */
export function buildDen(F, rng, nm, ctx) {
	const R = ZONE_RULES.den;
	const centre = F.at(...R.c0);
	const b = empty('den', nm('den'), centre, R.r);
	const yaw = F.yaw(0), front = F.front(), right = F.vec(1, 0);
	const mouthL = R.mass.d / 2 + 0.1;
	const mouth = F.at(0, mouthL);
	b.zones.push({ id: b.id, kind: 'den', shape: { x: r2(centre.x), z: r2(centre.z), r: R.r } });
	b.masses.push({ id: nm('den'), kind: 'den', footprint: { w: R.mass.w, d: R.mass.d }, height: R.mass.h, at: pt(centre), yaw, focal: true, label: 'Den' });
	b.doors.push({ id: nm('den-mouth'), at: pt(mouth), yaw, kind: 'entrance', width: R.mouth.width, depth: R.mouth.depth });
	b.solids.push(solid(boxPoly(centre.x, centre.z, R.mass.w / 2, R.mass.d / 2, yaw), 'den', 1.5, true), solid(doorPoly(b.doors[0]), 'den-mouth', 0.3, true));
	// the meadow: toward the road (within the front half-plane of the mouth), off the road corridor, the carcass at its rim
	const road = ctx.road(mouth.x, mouth.z);
	const toRoad = (() => { const dx = road.x - mouth.x, dz = road.z - mouth.z, l = Math.hypot(dx, dz) || 1; return { x: dx / l, z: dz / l }; })();
	let meadow = null, carcass = null, trail = null;
	for (let k = 0; k < 14 && !carcass; k++) {
		const psi = rng.range(-1.5, 1.5), dist = rng.range(...R.meadow.dist);
		const c = Math.cos(psi), s = Math.sin(psi);
		const d = { x: toRoad.x * c - toRoad.z * s, z: toRoad.x * s + toRoad.z * c };
		if (d.x * front.x + d.z * front.z < 0.15) continue;
		const m = { x: mouth.x + d.x * dist, z: mouth.z + d.z * dist };
		if (!ctx.clear(m.x, m.z, R.meadow.r + 1.5)) continue;
		// the trail: mouth → a point in front of it → the meadow → toward the road, stopping `trailEnd` m short of its centre line
		const mr = ctx.road(m.x, m.z), away = { x: m.x - mr.x, z: m.z - mr.z }, al = Math.hypot(away.x, away.z) || 1;
		const turn = rng.sign() * 1.4;
		const line = [
			{ x: mouth.x + front.x * 1, z: mouth.z + front.z * 1 },
			{ x: mouth.x + front.x * 5.5 + right.x * turn, z: mouth.z + front.z * 5.5 + right.z * turn },
			{ x: m.x, z: m.z },
			{ x: mr.x + (away.x / al) * R.trailEnd, z: mr.z + (away.z / al) * R.trailEnd },
		];
		for (let j = 0; j < 4; j++) {
			const a = rng.sign() * rng.range(0.5, 1.3), ca = Math.cos(a), sa = Math.sin(a);
			const cd = { x: d.x * ca - d.z * sa, z: d.x * sa + d.z * ca };
			const cp = { x: m.x + cd.x * (R.meadow.r + 2.8), z: m.z + cd.z * (R.meadow.r + 2.8) };
			const away2 = Math.hypot(cp.x - mouth.x, cp.z - mouth.z);
			if (away2 < R.carcass.dist[0] || away2 > R.carcass.dist[1] || !ctx.clear(cp.x, cp.z, 3)) continue;
			// the carcass stays off the trail (its legs are 1.6 m from the centre, the trail is 1 m wide)
			let off = Infinity;
			for (let i = 0; i + 1 < line.length; i++) off = Math.min(off, segDist(cp, line[i], line[i + 1]));
			if (off < 3.6) continue;
			meadow = { ...m, dir: d }; carcass = { ...cp, dir: cd }; trail = line;
			break;
		}
	}
	if (!carcass) return null;
	b.arenas.push({ id: nm('meadow'), at: pt(meadow), r: R.meadow.r });
	b.masses.push({ id: nm('carcass'), kind: 'carcass', footprint: { w: R.carcass.w, d: R.carcass.d }, height: R.carcass.h, at: pt(carcass), yaw: r3(rng.range(-Math.PI, Math.PI)), collision: false, label: 'Carcass' });
	b.solids.push(solid(circlePoly(meadow.x, meadow.z, R.meadow.r), 'meadow', 1, true), solid(circlePoly(carcass.x, carcass.z, 2.2), 'carcass', 0.6, true));
	// the spawn: beside the mouth, in front
	const lat = rng.sign() * (6 + rng.range(-0.8, 1.2));
	const spawn = { x: mouth.x + front.x * 5 + right.x * lat, z: mouth.z + front.z * 5 + right.z * lat };
	b.spawns.push({ id: nm('spawn-den'), at: pt(spawn), radius: 1.4 });
	b.solids.push(solid(circlePoly(spawn.x, spawn.z, 1.4), 'spawn-den', 0.3, true));
	// events: at the mouth (on the side the trail and the spawn leave free) and by the carcass (away from the meadow and the road):
	// the spot is the best of a few candidates, kept off the trail, the spawn, the meadow and the road
	const off = (x, z) => {
		let d = Infinity;
		for (let i = 0; i + 1 < trail.length; i++) d = Math.min(d, segDist({ x, z }, trail[i], trail[i + 1]) - 0.5);
		d = Math.min(d, Math.hypot(x - spawn.x, z - spawn.z) - 1.4, Math.hypot(x - meadow.x, z - meadow.z) - R.meadow.r - 1);
		return d;
	};
	let kill = null;
	for (const a of [-1.2, -0.8, -0.4, 0.4, 0.8, 1.2]) {
		const c = Math.cos(a), sn = Math.sin(a), d = { x: front.x * c - front.z * sn, z: front.x * sn + front.z * c };
		const at = { x: mouth.x + d.x * 5.5, z: mouth.z + d.z * 5.5 }, score = off(at.x, at.z);
		if (!kill || score > kill.score) kill = { at, score };
	}
	b.events.push({ id: nm('den-kill'), cause: 'predation', host: nm('den-mouth'), at: pt(kill.at), dir: r3(Math.atan2(front.z, front.x)), age: 'old' });
	let meal = null;
	for (const a of [0, -0.6, 0.6, -1.2, 1.2, -1.8, 1.8]) {
		const c = Math.cos(a), sn = Math.sin(a), d = { x: carcass.dir.x * c - carcass.dir.z * sn, z: carcass.dir.x * sn + carcass.dir.z * c };
		const at = { x: carcass.x + d.x * 4.5, z: carcass.z + d.z * 4.5 };
		const score = Math.min(off(at.x, at.z), ctx.clear(at.x, at.z, 3.5) ? 99 : -1);
		if (!meal || score > meal.score) meal = { at, d, score };
	}
	b.events.push({ id: nm('meadow-kill'), cause: 'predation', host: nm('carcass'), at: pt(meal.at), dir: r3(Math.atan2(meal.d.z, meal.d.x)), age: 'fresh' });
	b.trail = { id: nm('wolf-trail'), kind: 'animal', width: 1, points: trail };
	b.rocks.push({ x: centre.x, z: centre.z, r: R.rock, k: 0.8 });
	b.pads.push({ x: centre.x, z: centre.z, r: R.pad });
	b.pads.push({ x: meadow.x, z: meadow.z, r: 7 });
	b.blood.push({ x: carcass.x, z: carcass.z, r: 5, k: 0.4 });
	return b;
}

// ---------------------------------------------------------------------------------------------------------------
// Graveyard

/**
 * Graveyard by a wayside shrine: the shrine host owns its interaction zone, 2–3 graves hosts behind it, a footpath from the road,
 * a dug grave. Local −z is the road side. `toRoad` = unit vector from the zone centre to the nearest road point.
 */
export function buildGraveyard(F, rng, nm, toRoad, ctx) {
	const R = ZONE_RULES.graveyard, J = R.jitter;
	const centre = F.at(...R.c0);
	const b = empty('graveyard', nm('graves'), centre, R.r);
	b.zones.push({ id: b.id, kind: 'graveyard', shape: { x: r2(centre.x), z: r2(centre.z), r: R.r } });
	const shrine = F.at(R.shrine[0] + rng.range(-J, J), R.shrine[1] + rng.range(-J, J));
	const approach = { x: toRoad.x, z: toRoad.z };
	b.interactions.push({ id: nm('wayside-shrine'), at: pt(shrine), radius: 3.4 });
	b.hosts.push({ id: nm('shrine'), recipe: 'wayside', at: pt(shrine), yaw: wrap(yawFacing(approach.x, approach.z)), owns: nm('wayside-shrine') });
	const n = rng.int(2, 3), order = [0, 1, 2].slice(0, n);
	const letters = 'abc';
	const graveAts = order.map((i) => {
		const g = R.graves[i];
		return F.at(g[0] + rng.range(-J, J), g[1] + rng.range(-J, J));
	});
	graveAts.forEach((p, i) => b.hosts.push({ id: nm(`graves-${letters[i]}`), recipe: 'graves', at: pt(p), yaw: r3(rng.range(-0.3, 0.3)) }));
	// the dug grave: beside the first row, off the shrine side, 6.5 m out (its members reach 3–4 m), on dry ground clear of the bank
	const g0 = graveAts[0], ax = g0.x - shrine.x, az = g0.z - shrine.z, a0 = Math.atan2(az, ax);
	let spot = null;
	for (const da of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) {
		const at = { x: g0.x + Math.cos(a0 + da) * 7, z: g0.z + Math.sin(a0 + da) * 7 };
		// outside the zone circle like the demo's (the planks of a dug grave are moor / farm / camp clutter), 7 m from the shrine
		const score = Math.min(ctx.clear(at.x, at.z, 5) ? 99 : -1, ctx.water(at.x, at.z) - 11, Math.hypot(at.x - shrine.x, at.z - shrine.z) - 7, (Math.hypot(at.x - centre.x, at.z - centre.z) - R.r - 0.5) * 2);
		if (!spot || score > spot.score) spot = { at, score, a: a0 + da };
	}
	b.events.push({ id: nm('dug-grave'), cause: 'grave', host: nm('graves-a'), at: pt(spot.at), dir: r3(spot.a), age: 'fresh' });
	b.pads.push({ x: shrine.x, z: shrine.z, r: R.pad });
	b.solids.push(solid(circlePoly(shrine.x, shrine.z, 4.4), 'shrine', 0.5, true));
	for (const p of graveAts) b.solids.push(solid(circlePoly(p.x, p.z, 4.8), 'graves', 0.4));
	b.lane = { end: { x: r2(shrine.x + approach.x * R.trailStop), z: r2(shrine.z + approach.z * R.trailStop) }, away: approach, id: nm('shrine-path'), kind: 'trail', width: 1.6, inhabited: true };
	return b;
}

// ASHLAR · Act I · walled hub plan (planGenHub.js, "hub-gen/2" and "hub-gen/3") → an OUTDOOR map PLAN (env/act1/outdoor.js format). Pure data → data (no THREE).
// The input is a FROZEN hub plan (env/hubPlans/<name>.json: the accepted plan of one seed, with its provenance in `frozen`), never the generator, so the map the
// user picked never moves when the generator changes. A map file is `PLAN = hubToOutdoorPlan(frozen, BASE)` + the §6b exports (maps/lychgateHub.js).
// Conventions: the hub plan is x east, z south, `yaw` in RADIANS with the piece's front = local +z = (sin yaw, cos yaw): the same frame as the outdoor engine (whose
// plan yaw is degrees). Every plan piece becomes ONE structure at the same x, z, yaw (± float) — only the pieces a kit cannot load are composed (see CORNERS below).
// `base` = the biome base plan (asset defs, layers, moods, far) a hub reuses read-only (the Lychgate map's PLAN).
//
// Generic for every walled hub layout (palisade or stone ring; square, clipped, rounded or irregular corners; the main gate, the lychgate and the vault wall on any
// side): every direction comes from the plan (the causeway `from → to`, the `hill-trail` points, the ring polygon), never from "south" or "north". Pieces are
// classified by `m.piece` (module / tower / pier / joint / wing / vault / lychgate) and the wall type (`hub.wall.type`), not by their glb:
//   palisade: module = PAL.wall_a (scaled along x to the plan footprint) · tower (wall_angle) = two PAL.wall_a, one along each ring edge meeting at the corner ·
//             pier (gate-post) = a jamb of two PAL.log2 slices · joint (joint-stake) = a PAL.log2 stake
//   stone:    module = N02 (the flint wall, scaled along x) · tower / pier / joint = labelled BLOCKOUT defs made here (`blockout.tower` …, the plan's footprint and
//             height, status 'blockout') until GLBs exist
//   both:     wing = N02 (wingScaleY tall) · vault = N01 · lychgate = A02.1 + its lamp · everything else keeps its act1 asset id (A01.1 …, N01 …) except bone-pile.

const DEG = 180 / Math.PI;
const r3 = (v) => +v.toFixed(3);

/** World [x, z] of a local offset (lx, lz) of a placement { x, z, yaw (deg) } (front = local +z). */
const at = (p, lx, lz) => [r3(p.x + lx * Math.cos(p.yaw / DEG) + lz * Math.sin(p.yaw / DEG)), r3(p.z - lx * Math.sin(p.yaw / DEG) + lz * Math.cos(p.yaw / DEG))];

/** The ground the hub stands on and the water levels (m): dry wet peat inside the ring, the fen at 0, the inner pond a little over it, plank decks over the pond. */
export const LEVELS = { floor: 0.55, fen: 0.0, pond: 0.2, deck: 0.66, jetty: 0.62, stilt: 0.88 };
/** Palisade kit piece wall_a (kitSizes.json: 3.756 × 3.319 × 2.244, centred, base on y 0). The kit loader of the outdoor builder has no `palisade` key (KIT_IDS), so the
 * piece stands as the first mesh of the `kit-palisade` library GLB (status glb), which is wall_a. */
export const WALL_A = { id: 'PAL.wall_a', name: 'Palisade wall (kit wall_a)', category: 'structure', size: [3.756, 3.319, 2.244], status: 'glb', source: 'kit-palisade piece wall_a (the first mesh of the GLB)', segment: 'hub', model: 'kit-palisade', fit: 'native', shape: 'fence', note: 'Wooden palisade module 3.76 × 3.32 × 2.24 m; scaled along x to the plan pieces (3.55 … 3.89 m); the whole box blocks (the generator\'s footprint). Corners: two of them cross (each ×1.15).' };

/** Two-log slice of wall_a (GLB x −1.62…−0.72: the end logs and their brace stubs; the other triangles are cut), pivot at its bottom centre: a gate jamb is two of them
 * stacked front to back, ×1.2 wide, stretched to 4.2 m; a joint stake is one, stretched to the stake's height and depth. */
const keepBox = ([x0, y0, z0, x1, y1, z1], B = 99) => [[-B, -B, -B, x0, B, B], [x1, -B, -B, B, B, B], [x0, -B, -B, x1, y0, B], [x0, y1, -B, x1, B, B], [x0, y0, -B, x1, y1, z0], [x0, y0, z1, x1, y1, B]];
export const LOG2 = { id: 'PAL.log2', name: 'Palisade end logs (a slice of kit wall_a)', category: 'structure', size: [0.9, 3.319, 0.6], status: 'glb', source: 'kit-palisade piece wall_a (a slice: cut + pivot)', segment: 'hub', model: 'kit-palisade', fit: 'native', cut: keepBox([-1.62, -0.1, -0.7, -0.72, 3.6, 0.5]), pivot: [-1.17, 0, -0.1], shape: 'fence', note: 'The end logs of wall_a (0.9 m wide, 3.3 m tall) drawn on their own; two stacked front to back, ×1.2 wide and ×1.27 tall, are a main-gate jamb (≈ 1.1 × 1.2 × 4.2 m, the plan post of 1.2 m); one, stretched, is a joint stake.' };
/** The tall logs of wall_a (GLB surface above 2 m) span 2.9 m of its 3.76 m box, centred at local x −0.1 (measured with the kit GLB, scripts/hub-outdoor.test.mjs asserts it;
 * braces fill the rest of the 3.55 m walk band): modules are widened to plan pitch + this much so the logs of neighbours overlap. */
export const LOG_SPAN = 3.0;
const LOG_OVERLAP = 0.14;
/** The ground under a palisade module's box is levelled to its base height out to the box's outer face (the fen bank falls away within 0.25 m after it): without it the
 * outer braces and log feet hung over the shelf (review m5; the box reaches 1.12 m outside the wall line, the bank starts dropping at ≈ 0.65 m). */
const FOOTING = { margin: 0, soft: 0.25 };

/** Model-frame offsets (GLB frame, from the Lychgate map) of the light spots: the forge hearth, Osric's fire basket, a stilt-cottage window on its +x wall. The test
 * compares them with the base map's own lights, so a change in maps/lychgate.js fails loudly. */
export const SPOT = { forge: [-0.85, 0.85, -0.6], osric: [-1.0, 2.8, 0.87], window: [2.3, 2.17, -0.12], edda: [2.3, 2.17, -0.12] };
/** The A16.6 lantern under the A02.1 front tie beam (maps/lychgate.js); its height `h` is read from the base map's asset def. */
export const LANTERN = { scale: 0.75, top: 2.32, flame: 2.07 };

/** plan `glb` → [asset id, extra placement fields]. Unlisted ids are used as they are. */
const GLB = { 'bone-pile': ['glb:dungeon-prop-bone-pile'] };
const SCALE = { 'A01.6': 0.85 }; // the eel racks stand at ×0.85 (the plan's footprint already says 4.0 × 1.68 m)

const polyOf = (pts) => pts.map((p) => [p.x, p.z]);
const xz = (p) => [p.x, p.z];

// ---- 2D helpers -------------------------------------------------------------------------------------------------------------------------------
/** Unit vector a → b ({ x, z }). */
const unit = (a, b) => {
	const dx = b.x - a.x;
	const dz = b.z - a.z;
	const l = Math.hypot(dx, dz) || 1;
	return { x: dx / l, z: dz / l };
};
/** Even-odd point in polygon ([[x, z], …]). */
const inPoly = (poly, x, z) => {
	let c = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if ((poly[i][1] > z) !== (poly[j][1] > z) && x < ((poly[j][0] - poly[i][0]) * (z - poly[i][1])) / (poly[j][1] - poly[i][1]) + poly[i][0]) c = !c;
	return c;
};
/** Distance from p along the unit direction u to the edge of the bounds [x0, z0, x1, z1] (p inside). */
const toEdge = (p, u, [x0, z0, x1, z1]) => Math.min(Math.abs(u.x) > 1e-9 ? ((u.x > 0 ? x1 : x0) - p.x) / u.x : Infinity, Math.abs(u.z) > 1e-9 ? ((u.z > 0 ? z1 : z0) - p.z) / u.z : Infinity);
/** Shoelace area of [[x, z], …]: > 0 = clockwise on the plan (x east, z south). */
const shoelace = (poly) => poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
/** The polygon pushed outward by d (mitre joins), in the winding it came in (convex, concave or clipped corners alike). */
const offsetPoly = (poly, d) => {
	const n = poly.length;
	const sgn = shoelace(poly) > 0 ? 1 : -1;
	const normal = (a, b) => {
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		return [(sgn * (b[1] - a[1])) / l, (-sgn * (b[0] - a[0])) / l];
	};
	return poly.map((p, i) => {
		const n0 = normal(poly[(i + n - 1) % n], p);
		const n1 = normal(p, poly[(i + 1) % n]);
		const k = d / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
		return [p[0] + (n0[0] + n1[0]) * k, p[1] + (n0[1] + n1[1]) * k];
	});
};

/**
 * The fen: the map square minus a hole (the ring polygon `hole`) with a slit — the land of the hill lane, ±slit m round the line through `lane` along the outward
 * direction `h` — as ONE simple polygon. Built in a frame where `h` points north (rotation by a multiple of 90°), then turned back.
 */
const fenWithSlit = (bounds, hole, lane, h, slit) => {
	const perp = { x: -h.z, z: h.x };
	const to = ([x, z]) => [x * perp.x + z * perp.z, -(x * h.x + z * h.z)];
	const from = ([a, b]) => [a * perp.x - b * h.x, a * perp.z - b * h.z];
	const [bx0, bz0, bx1, bz1] = bounds;
	const corners = [[bx0, bz0], [bx1, bz0], [bx1, bz1], [bx0, bz1]].map(to);
	const X0 = Math.min(...corners.map((c) => c[0]));
	const X1 = Math.max(...corners.map((c) => c[0]));
	const Z0 = Math.min(...corners.map((c) => c[1]));
	const Z1 = Math.max(...corners.map((c) => c[1]));
	let local = hole.map(to);
	if (shoelace(local) < 0) local = local.reverse(); // the top edges run toward +x
	const n = local.length;
	const lx = to([lane.x, lane.z])[0];
	// the top-most crossing of the vertical line x = X with the hole boundary: [edge index, z]
	const cross = (X) => {
		let best = null;
		for (let i = 0; i < n; i++) {
			const [ax, az] = local[i];
			const [bx, bz] = local[(i + 1) % n];
			if (!(ax < bx) || X < ax || X > bx) continue; // a top edge (runs toward +x) under the line
			const z = az + ((bz - az) * (X - ax)) / (bx - ax);
			if (!best || z < best[1]) best = [i, z];
		}
		if (!best) throw new Error('hubToOutdoorPlan: the hill lane does not meet the ring (fen slit)');
		return best;
	};
	const [i0, z0] = cross(lx - slit);
	const [i1, z1] = cross(lx + slit);
	const around = [];
	for (let k = 0, i = i0; k < ((i0 - (i1 + 1) + 2 * n) % n) + 1; k++, i = (i + n - 1) % n) around.push(local[i]);
	const poly = [[lx + slit, Z0], [X1, Z0], [X1, Z1], [X0, Z1], [X0, Z0], [lx - slit, Z0], [lx - slit, z0], ...around, [lx + slit, z1]];
	return poly.map((p) => from(p).map(r3));
};

/** A blockout def made from the first plan mass of a kind (the plan's footprint and height): a block with a cap slab, labelled by the mass. */
const blockoutDef = (m, name) => {
	const [w, h, d] = [m.footprint.w, m.height, m.footprint.d];
	const cap = Math.min(0.35, h * 0.2);
	return { id: m.glb, name, category: 'structure', size: [w, h, d], status: 'blockout', source: 'hubOutdoor.js (blockout from the plan: footprint and height; no GLB yet)', segment: 'hub', shape: { kind: 'parts', parts: [['box', w, h - cap, d, {}], ['box', w + 0.2, cap, d + 0.2, { y: h - cap, tone: 0.82 }]] }, note: `${name}: ${w} × ${h} × ${d} m from the plan, a labelled blockout until a GLB exists.` };
};

/**
 * hubToOutdoorPlan(hub, base, options) → an outdoor PLAN.
 * options: { id, label, wingScaleY (N02 wings, default 1), stoneScaleY (N02 stone-ring modules, default 1), cell, splat, edge, mood }.
 */
export function hubToOutdoorPlan(hub, base, options = {}) {
	const o = { id: 'hub', label: 'Walled hub', wingScaleY: 1, stoneScaleY: 1, cell: 0.5, splat: 640, ...options };
	const L = LEVELS;
	const b = hub.bounds;
	const bounds = [b.x0, b.z0, b.x1, b.z1];
	const ring = hub.hub.ring.poly;
	const ringPts = polyOf(ring);
	const rx0 = Math.min(...ring.map((p) => p.x));
	const rx1 = Math.max(...ring.map((p) => p.x));
	const rz0 = Math.min(...ring.map((p) => p.z));
	const rz1 = Math.max(...ring.map((p) => p.z));
	const centre = { x: (rx0 + rx1) / 2, z: (rz0 + rz1) / 2 };
	const stone = hub.hub.wall.type === 'stone';
	const mass = (id) => hub.masses.find((m) => m.id === id);
	const door = (id) => hub.doors.find((d) => d.id === id);
	const spot = (id) => hub.interactions.find((i) => i.id === id);
	const P = (id) => hub.paths.find((p) => p.id === id);
	const gate = door('main-gate');
	const lychDoor = door('lychgate');
	const lych = mass(lychDoor.mass);
	const edda = mass(hub.hub.edda.house);
	// the directions, all from the plan: `out` = from the main gate out along the causeway; `hv` = from the lychgate out along the hill trail
	const cw = hub.hub.causeway;
	const out = unit(cw.to, cw.from);
	const hillTrail = P('hill-trail');
	const h0 = hillTrail.points[0];
	const h1 = hillTrail.points.at(-1);
	const hv = unit(h0, h1);
	const inward = (p, t) => [r3(p.x - hv.x * t), r3(p.z - hv.z * t)]; // p moved t m back into the hub, away from the lychgate's outside

	// ---- structures: one per plan mass (palisade towers = two crossing pieces; stone towers / piers / joints = blockout defs) ---------------------------
	const structures = [];
	const lights = [];
	const put = (s) => structures.push(s);
	const blockouts = new Map(); // glb → def
	const lanternH = base.assets.find((a) => a.id === 'A16.6-lantern')?.size[1] ?? 0.541;
	for (const m of hub.masses) {
		const yaw = r3(m.yaw * DEG);
		const x = m.at.x;
		const z = m.at.z;
		const name = m.label;
		const role = m.piece;
		if (role === 'module' && !stone) {
			put({ asset: WALL_A.id, x, z, yaw, scale: [r3((m.footprint.w + LOG_OVERLAP) / LOG_SPAN), 1, 1], y: 'ground', dy: -0.04, pad: FOOTING, name, tag: m.id });
		} else if (role === 'module') {
			put({ asset: 'N02', x, z, yaw, scale: [r3(m.footprint.w / 4), o.stoneScaleY, 1], y: 'min', name, tag: m.id });
		} else if (role === 'tower' && !stone) {
			// the corner kit piece cannot be loaded (see WALL_A): two wall_a, one along each ring edge meeting at the corner, crossing at the corner point, each ×1.15
			let vi = 0;
			ringPts.forEach((p, i) => { if (Math.hypot(p[0] - x, p[1] - z) < Math.hypot(ringPts[vi][0] - x, ringPts[vi][1] - z)) vi = i; });
			const v = ring[vi];
			if (Math.hypot(v.x - x, v.z - z) > 1.5) throw new Error(`hubToOutdoorPlan: palisade corner ${m.id} is not on a ring vertex`);
			const arms = [ring[(vi + 1) % ring.length], ring[(vi + ring.length - 1) % ring.length]].map((w) => {
				const d = unit(v, w);
				const nrm = { x: -d.z, z: d.x };
				const mid = { x: (v.x + w.x) / 2, z: (v.z + w.z) / 2 };
				const sgn = inPoly(ringPts, mid.x + nrm.x * 0.5, mid.z + nrm.z * 0.5) ? 1 : -1; // the wall's inside is the ring's inside
				return { d, face: { x: nrm.x * sgn, z: nrm.z * sgn } };
			}).sort((p, q) => Math.abs(q.d.x) - Math.abs(p.d.x));
			arms.forEach(({ d, face }, k) => {
				// each arm is moved 0.8 m inward along its wall so that its outer end stays on the dry footing (the water comes up to the wall's outer face)
				const axis = Math.abs(d.x) > Math.abs(d.z) ? 'x' : 'z';
				put({ asset: WALL_A.id, x: r3(x + d.x * 0.8), z: r3(z + d.z * 0.8), yaw: Math.abs(r3(Math.atan2(face.x, face.z) * DEG)) === 180 ? 180 : r3(Math.atan2(face.x, face.z) * DEG) || 0, scale: [1.15, 1, 1], y: 'ground', dy: -0.04, pad: FOOTING, name: `${name} (arm along ${axis})`, tag: `${m.id}:${k ? 'b' : 'a'}` });
			});
		} else if (role === 'pier' && !stone) {
			// a gate jamb: two stacked slices of end logs (LOG2), stretched to the plan's 4.2 m post
			for (const [k, lz] of [[0, -0.3], [1, 0.3]]) {
				const [jx, jz] = at({ x, z, yaw }, 0, lz);
				put({ asset: LOG2.id, x: jx, z: jz, yaw, scale: [1.2, r3(m.height / LOG2.size[1]), 1], y: 'ground', dy: -0.04, name: 'Main gate jamb (end logs)', tag: `${m.id}:${k ? 'b' : 'a'}` });
			}
		} else if (role === 'joint' && !stone) {
			// a joint stake: one slice of end logs at the stake's footprint and height
			put({ asset: LOG2.id, x, z, yaw, scale: [r3(m.footprint.w / LOG2.size[0]), r3(m.height / LOG2.size[1]), r3(m.footprint.d / LOG2.size[2])], y: 'ground', dy: -0.04, name, tag: m.id });
		} else if (role === 'tower' || role === 'pier' || role === 'joint') {
			// stone ring: a labelled blockout, the plan's footprint and height (the def is the first mass of its kind, the others scale to theirs)
			if (!blockouts.has(m.glb)) blockouts.set(m.glb, blockoutDef(m, name));
			const def = blockouts.get(m.glb);
			put({ asset: def.id, x, z, yaw, scale: [r3(m.footprint.w / def.size[0]), r3(m.height / def.size[1]), r3(m.footprint.d / def.size[2])], y: 'min', name, tag: m.id });
		} else if (role === 'wing') {
			put({ asset: 'N02', x, z, yaw, scale: [r3(m.footprint.w / 4), o.wingScaleY, 1], y: 'min', name, tag: m.id });
		} else if (role === 'vault') {
			put({ asset: 'N01', x, z, yaw, y: 'min', name, tag: m.id });
		} else if (role === 'lychgate') {
			put({ asset: 'A02.1', x, z, yaw, name: 'The lychgate', tag: m.id });
			const [lx, lz] = at({ x, z, yaw }, 0, 0.97);
			put({ asset: 'A16.6-lantern', x: lx, z: lz, yaw, dy: LANTERN.top - lanternH * LANTERN.scale, scale: LANTERN.scale, name: 'The lychgate lamp' });
			lights.push({ id: 'lychgateLamp', kind: 'human', label: 'Lychgate lamp (the threshold light, in the A16.6 lantern under the front tie beam)', x: lx, z: lz, yOn: { asset: 'A16.6-lantern', ly: LANTERN.flame - (LANTERN.top - lanternH * LANTERN.scale) }, color: '#e0a050', intensity: 9, range: 10, flicker: 1, real: true, glow: 0.3, seed: 1, night: { intensity: 3.2, range: 7, glow: 0.2 } });
		} else if (m.tag === 'wall') {
			throw new Error(`hubToOutdoorPlan: wall piece ${m.id} has the unknown role "${role}" (${m.glb})`);
		} else {
			const asset = GLB[m.glb]?.[0] ?? m.glb;
			const sc = SCALE[m.glb];
			const s = { asset, x, z, yaw, name, tag: m.id };
			if (sc) s.scale = sc;
			if (m.id === edda.id) s.y = r3(L.deck - L.stilt); // on stilts in the pond, its floor flush with the walkway deck
			put(s);
		}
	}

	// the causeway planks on the dike crest: A06.1 pieces at a 3 m module (their 4 m deck overlaps ≈ 0.4 m, top flush with the crest), from the main gate to the
	// map edge (the last piece is pulled in to stand inside the bounds), like the Lychgate map's dike road. Structures, not a `runs` entry: the engine's A06.1 run test assumes a run of > 25 m inside the bounds.
	const cwYaw = r3(Math.atan2(out.z, -out.x) * DEG); // the plank's long axis (local x) lies along the causeway
	const cwLen = toEdge(cw.to, out, bounds);
	for (let k = 0, t = 1.5; t - 1.5 < cwLen; k++, t += 3) put({ asset: 'A06.1', x: r3(cw.to.x + out.x * Math.min(t, cwLen - 0.05)), z: r3(cw.to.z + out.z * Math.min(t, cwLen - 0.05)), yaw: cwYaw, y: 'ground', dy: -0.35, name: 'Causeway plank piece', tag: `causeway-${k}` });

	// door sprigs (the accent): on every cottage door and Edda's, 1.06 m in front of the house (the GLB door face), 1.75 m over the base
	for (const d of hub.doors.filter((q) => q.poppy)) {
		const m = mass(d.mass);
		const yaw = m.yaw;
		const s = { asset: 'N05', x: r3(m.at.x + Math.sin(yaw) * 1.06), z: r3(m.at.z + Math.cos(yaw) * 1.06), yaw: r3(yaw * DEG), tag: 'accent', name: 'Poppy sprig on the door' };
		if (m.id === edda.id) Object.assign(s, { y: r3(L.deck - L.stilt + 1.75) });
		else Object.assign(s, { y: 'ground', dy: 1.75 });
		put(s);
	}

	// ---- lights (≤ 8 real) ----------------------------------------------------------------------------------------------------------------------
	const onModel = (m, key, light) => {
		const [x, z] = at({ x: m.at.x, z: m.at.z, yaw: m.yaw * DEG }, SPOT[key][0], SPOT[key][2]);
		return { ...light, x, z, yOn: { asset: m.glb, ly: SPOT[key][1] } };
	};
	const byGlb = (glb) => hub.masses.filter((m) => m.glb === glb);
	const forge = byGlb('A15.2')[0];
	const osric = byGlb('A15.6')[0];
	const cottages = byGlb('A01.1').filter((m) => m.id !== edda.id);
	const windows = cottages.length > 2 ? [mass('cottage-1') ?? cottages[0], mass('cottage-3') ?? cottages.at(-1)] : cottages;
	lights.push(
		onModel(forge, 'forge', { id: 'forge', kind: 'human', label: "Brannoc's forge (the model hearth)", color: '#e8823a', intensity: 15, range: 9, flicker: 1.2, real: true, glow: 1.6, seed: 2, flag: 'forge' }),
		onModel(osric, 'osric', { id: 'osric', kind: 'human', label: "Osric's fire basket (the threshold light inside the main gate)", color: '#e8903a', intensity: 6, range: 9, flicker: 1.1, real: true, glow: 1.0, seed: 7, moods: ['day', 'lookdev'] }),
		onModel(edda, 'edda', { id: 'edda', kind: 'human', label: "Edda's window (the model window, +x wall)", color: '#e0a050', intensity: 4, range: 7, flicker: 0.6, real: true, glow: 0, seed: 4, moods: ['day', 'lookdev'] }),
	);
	for (const [i, wm] of windows.entries()) {
		lights.push(onModel(wm, 'window', { id: `window-${wm.id}`, kind: 'human', label: `Window of ${wm.label} (${wm.id})`, color: '#e0a050', intensity: 3.2, range: 6, flicker: 0.6, real: true, glow: 0, seed: 11 + i, night: { intensity: 0.7 } }));
	}

	// vault door: candles at its foot, in front of the door (local +z), at the lane's end
	const vault = mass(door('vault-door').mass);
	{
		const [cx, cz] = at({ x: vault.at.x, z: vault.at.z, yaw: vault.yaw * DEG }, 1.55, 1.7);
		put({ asset: 'glb:dungeon-prop-candle-cluster', x: cx, z: cz, yaw: r3(vault.yaw * DEG) + 140, name: 'Candles at the vault door' });
		lights.push({ id: 'vault', kind: 'human', label: 'Candles at the vault door', x: cx, z: cz, y: 0.9, color: '#e8a858', intensity: 3.2, range: 6, flicker: 1, real: true, glow: 0.5, seed: 5, moods: ['day', 'lookdev'] });
	}

	// ---- water: the fen outside the ring and the inner pond -----------------------------------------------------------------------------------------
	// The fen: the map square minus a hole round the ring (the ring polygon pushed out WATER_EDGE m from the wall line, mitre joins: clipped, rounded and irregular
	// rings keep no dry land in their cut corners), with a slit (the land of the hill lane) at the lychgate. The plan's own fen polygon leaves a 1.5 m dry bank outside
	// the wall (a path round the outside past the lychgate, review M1): here the water comes up to the wall and is deeper than the wade depth 0.45 m beyond its edge
	// (shelf 0.3 m, then a steep drop), so nothing outside is walkable. A palisade box reaches 1.12 m outside the wall line, the edge sits under its footing; a stone
	// wall (0.73 m deep) is met at its outer face.
	const WATER_EDGE = stone ? hub.hub.wall.depth / 2 + 0.05 : hub.hub.wall.depth / 2;
	const fenPoly = fenWithSlit(bounds, offsetPoly(ringPts, WATER_EDGE), h0, hv, 2.6);
	const pond = hub.water.find((w) => w.id === 'pond');
	const water = [
		{ id: 'fen', label: 'Black fen water (all four sides)', level: L.fen, tint: 'fen', wobble: 0.04, shelf: [0.3, 0.3], drop: [0.5, 1.5], bank: [0.4, 2.0], area: { poly: fenPoly } },
		{ id: 'pond', label: 'The inner pond', level: L.pond, tint: 'pond', wobble: 0.3, shelf: [0.6, 0.35], drop: [1.2, 1.1], bank: [3, 0.3], area: { poly: polyOf(pond.polygon) } },
		// the pond's reach under Edda's house: the plan's pond lies beside the house, the 3D house stands on stilts over water (a round arm of the pond round its footprint)
		{ id: 'pond-stilts', label: "The pond under Edda's house", level: L.pond, tint: 'pond', wobble: 0.25, shelf: [0.6, 0.35], drop: [1.2, 1.1], bank: [3, 0.3], area: { poly: Array.from({ length: 20 }, (_, k) => [r3(edda.at.x + 0.6 + Math.cos((k / 20) * Math.PI * 2) * 3.4), r3(edda.at.z + 0.6 + Math.sin((k / 20) * Math.PI * 2) * 3.4)]) } },
	];

	// ---- paths ----------------------------------------------------------------------------------------------------------------------------------
	const route = P('route');
	// the route's point at the main gate: the one nearest its door
	const gateIdx = route.points.reduce((best, p, i) => (Math.hypot(p.x - gate.at.x, p.z - gate.at.z) < Math.hypot(route.points[best].x - gate.at.x, route.points[best].z - gate.at.z) ? i : best), 0);
	const lanePts = route.points.slice(gateIdx).map(xz);
	lanePts.push(inward(lych.at, 1.2)); // into the lychgate passage
	const laneIds = ['lane-vault', 'lane-edda', 'lane-jetty'].filter((id) => P(id));
	for (const p of hub.paths) if (/^lane-/.test(p.id) && !laneIds.includes(p.id)) laneIds.push(p.id);
	const trails = laneIds.map((id) => ({ id, kind: 'track', label: `Packed track (${id})`, points: P(id).points.map(xz), width: P(id).width, surface: 'packed', smooth: 1 }));
	const eddaWalk = P('walkway-edda');
	const jetty = P('jetty');
	// the plan's jetty crosses the Edda walkway in an X near its tip: it is re-rooted at the same root as a 0.8 × shorter jetty turned (≤ 180°, nearest the plan's
	// direction first) until its tip is in the pond water and ≥ 1.9 m from the walkway (two 1.8 m decks never touch)
	const jettyPts = (() => {
		const root = jetty.points[0];
		const dir = Math.atan2(jetty.points[1].z - root.z, jetty.points[1].x - root.x);
		const len = Math.hypot(jetty.points[1].x - root.x, jetty.points[1].z - root.z) * 0.8;
		const walk = [...eddaWalk.points.map(xz), [edda.at.x + Math.sin(edda.yaw), edda.at.z + Math.cos(edda.yaw)]];
		const dist = (px, pz) => Math.min(...walk.slice(1).map(([bx, bz], i) => { const [ax, az] = walk[i]; const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2))); return Math.hypot(px - ax - (bx - ax) * t, pz - az - (bz - az) * t); }));
		const ponds = water.filter((w) => w.id.startsWith('pond')).map((w) => w.area.poly);
		for (let k = 0; k <= 36; k++) for (const sgn of k ? [1, -1] : [1]) {
			const a = dir + sgn * k * (Math.PI / 36);
			const tx = root.x + Math.cos(a) * len;
			const tz = root.z + Math.sin(a) * len;
			if (ponds.some((poly) => inPoly(poly, tx, tz)) && dist(tx, tz) >= 1.9) return [xz(root), [r3(tx), r3(tz)]];
		}
		return [xz(root), [r3(root.x + (jetty.points[1].x - root.x) * 0.55), r3(root.z + (jetty.points[1].z - root.z) * 0.55)]];
	})();
	// the hill lane: three overlapping dikes rise a little toward the church hill, along the hill trail's direction `hv` from the lychgate; s = metres from the
	// trail's first point along `hv` (negative = back into the passage)
	const sOf = (p) => (p.x - h0.x) * hv.x + (p.z - h0.z) * hv.z;
	const hillAt = (s) => [r3(h0.x + hv.x * s), r3(h0.z + hv.z * s)];
	const sEnd = toEdge(h0, hv, bounds) + 2;
	const sTrail = sOf(h1);
	const sPass = sOf(lych.at) + 1.5; // inside the passage
	const paths = [
		{ id: 'route', kind: 'lane', label: 'The route: cobble lane, main gate → square → lychgate', points: lanePts, width: route.width, surface: 'stone', ribbon: 'cobble', smooth: 1 },
		// the causeway: a dike across the fen band, from beyond the map edge to the main gate (3 m A06.1 modules on its crest)
		{ id: 'causeway', kind: 'dike', label: 'Causeway (dike road from the Night Fens)', points: [[r3(cw.to.x + out.x * (cwLen + 2)), r3(cw.to.z + out.z * (cwLen + 2))], [r3(cw.to.x + out.x * 0.6), r3(cw.to.z + out.z * 0.6)]], width: 3.4, dike: { crest: r3(L.floor + 0.08), bank: 2.2 }, surface: 'packed', smooth: 0 },
		...[[sPass, 2.2, 0.62], [1.6, sTrail, 0.82], [sTrail - 1.6, sEnd, 1.02]].map(([sa, sb, crest], i) => ({ id: `hill-lane-${i}`, kind: 'dike', label: `Hill lane (dike ${i + 1}/3, rising)`, points: [hillAt(sa), hillAt(sb)], width: 2.6, dike: { crest, bank: 1.6 }, surface: 'packed', smooth: 0 })),
		...trails,
		{ id: 'walkway-edda', kind: 'walkway', label: "Walkway across the pond to Edda's house", asset: 'A01.2', points: [...eddaWalk.points.map((p) => [p.x, p.z, L.deck]), [r3(edda.at.x + Math.sin(edda.yaw) * 1.0), r3(edda.at.z + Math.cos(edda.yaw) * 1.0), L.deck]], width: 1.8, deck: L.deck, surface: 'wood', hidden: true },
		{ id: 'jetty', kind: 'walkway', label: 'Jetty into the pond', asset: 'A01.2', points: jettyPts.map((p) => [p[0], p[1], L.jetty]), width: 1.8, deck: L.jetty, surface: 'wood', ramps: 'start', hidden: true },
	];

	// ---- heights --------------------------------------------------------------------------------------------------------------------------------
	const sq = hub.square;
	const inner = [rx0 + 3, rz0 + 3, rx1 - 3, rz1 - 3];
	const heights = [
		{ kind: 'base', y: L.floor },
		{ kind: 'noise', amp: 0.07, scale: 8, seed: 5.2, area: { rect: inner }, soft: 4 }, // a little relief inside, nothing under the wall footings
		{ kind: 'flatten', area: { circle: [sq.x, sq.z, sq.r] }, y: L.floor, soft: 3 }, // the square
	];

	// ---- ground paint (hub-relevant rules of the base map, retargeted to this layout) ----------------------------------------------------------------
	const paint = [
		{ layer: 'DW_damp', kind: 'height', range: [-3, 0.7], soft: 1.2, value: 0.55, patchy: { scale: 6, cover: 0.55 } },
		{ layer: 'DW_damp', kind: 'water', band: [-4, 3], soft: 1.4, value: 0.95, edge: { amp: 0.8, scale: 4 } },
		{ layer: 'DW_damp', kind: 'structures', assets: ['A01.1', 'A15.2', 'A15.5', 'A15.6'], margin: 2.0, soft: 1.4, value: 0.7, edge: { amp: 0.6, scale: 3 } },
		{ layer: 'DW_grass', kind: 'area', area: { rect: inner }, soft: 3, value: 0.7, patchy: { scale: 7, cover: 0.5 } },
		{ layer: 'DW_grass', kind: 'water', band: [-40, 1.4], soft: 1.2, op: 'sub', value: 1 },
		{ layer: 'DW_dense', kind: 'water', band: [1.0, 7], soft: 1.6, value: 0.7, patchy: { scale: 5, cover: 0.6 } },
		{ layer: 'DW_dirt', kind: 'path', pathKind: ['track', 'dike'], extra: 0.2, soft: 0.9, value: 0.95, edge: { amp: 0.4, scale: 2.5 } },
		{ layer: 'DW_dirt', kind: 'area', area: { circle: [sq.x, sq.z, sq.r - 0.8] }, soft: 2.2, value: 0.55, patchy: { scale: 4, cover: 0.6 } },
		{ layer: 'DW_dirt', kind: 'structures', assets: ['A01.1', 'A15.2', 'A15.5', 'A01.5'], margin: 1.1, soft: 1.2, value: 0.6, patchy: { scale: 3, cover: 0.65 } },
		{ layer: 'BIO03_flint', kind: 'structures', assets: ['A02.1', 'N01', 'N02'], margin: 1.6, soft: 1.3, value: 0.9, edge: { amp: 0.5, scale: 2.5 } },
		{ layer: 'DW_mud', kind: 'path', pathKind: 'lane', extra: 0.7, soft: 1.1, value: 0.75, edge: { amp: 0.6, scale: 3 } },
		{ layer: 'DW_mud', kind: 'water', band: [-6, 1.0], soft: 1.2, value: 0.9, edge: { amp: 0.7, scale: 3 } },
		{ layer: 'DW_mud', kind: 'path', pathKind: 'walkway', extra: 0.4, soft: 1, value: 0.7 },
		{ layer: 'wet', kind: 'fill', value: 0.28 },
		{ layer: 'wet', kind: 'height', range: [-3, 0.65], soft: 1.0, value: 0.7 },
		{ layer: 'wet', kind: 'water', band: [-8, 3.0], soft: 1.4, value: 1 },
		{ layer: 'wet', kind: 'path', pathKind: 'lane', extra: 1.0, soft: 1.1, value: 0.75 },
	];

	// ---- scatters (grass cards inside, reeds / sedge on the shores) -------------------------------------------------------------------------------
	const scatters = [
		{ asset: 'A03.1', count: 260, area: { rect: [rx0 + 1, rz0 + 1, rx1 - 1, rz1 - 1] }, spacing: 1.0, clear: { paths: 0.6, water: 0.6, structures: 0.4, decks: 0.6 }, height: [0.5, 40], scale: [0.7, 1.25], seed: 31 },
		{ asset: 'A03.2', count: 150, area: { rect: bounds }, spacing: 0.8, band: { water: [-1.6, 0.9] }, clear: { decks: 0.5, paths: 0.8 }, scale: [0.75, 1.3], seed: 41 },
		{ asset: 'A03.3', count: 90, area: { rect: bounds }, spacing: 0.9, band: { water: [-0.5, 2.6] }, clear: { decks: 0.5, paths: 0.8 }, scale: [0.7, 1.2], seed: 43 },
	];

	// ---- markers, segments, views ---------------------------------------------------------------------------------------------------------------
	const npc = (id, label, p) => ({ kind: 'npc', id, x: p.x, z: p.z, label, segment: 'hub' });
	const markers = [
		npc('osric', 'Osric (watch post, inside the main gate)', spot('osric').at),
		npc('brannoc', 'Brannoc (the forge)', spot('brannoc').at),
		npc('nell', 'Nell Coppercoin (grave-goods stall)', spot('nell').at),
		npc('tamsin', 'Tamsin (sleeper name board)', spot('name-board').at),
		npc('bell', 'Mourning bell', spot('bell').at),
		{ kind: 'npc', id: 'edda', x: r3(door('edda-door').at.x), z: r3(door('edda-door').at.z), label: "Edda (her stilt house over the pond)", segment: 'hub' },
		{ kind: 'exit', id: 'X1', x: hub.exits.find((e) => e.id === 'causeway').at.x, z: hub.exits.find((e) => e.id === 'causeway').at.z, label: '→ The Night Fens (the dike road)', to: 'fens' },
		{ kind: 'exit', id: 'X2', x: hub.exits.find((e) => e.id === 'lychgate').at.x, z: hub.exits.find((e) => e.id === 'lychgate').at.z, label: '→ Churchyard (the hill lane)', to: 'lychgate' },
		{ kind: 'exit', id: 'X3', x: door('vault-door').at.x + Math.sin(vault.yaw) * 1.2, z: door('vault-door').at.z + Math.cos(vault.yaw) * 1.2, label: '→ Hầm nhà Barrow (One for the Footing)', to: 'barrowVault' },
		{ kind: 'exit', id: 'X4', x: door('edda-door').at.x, z: door('edda-door').at.z, label: "→ Edda's Dream (The Broth)", to: 'eddasDream' },
	];
	const start = hub.start;
	const squareSpawn = route.points.reduce((best, p) => (Math.hypot(p.x - sq.x, p.z - sq.z) < Math.hypot(best.x - sq.x, best.z - sq.z) ? p : best), route.points[0]);
	const segments = [
		{ id: 'hub', kind: 'hub', label: 'Cổng chính · đường đắp (hub có tường)', spawn: [start.x, start.z], view: 'gate', route: route.points.map(xz) },
		{ id: 'square', kind: 'hub', label: 'Quảng trường (giếng, chuông, sạp)', spawn: [r3(squareSpawn.x), r3(squareSpawn.z)], view: 'square', route: [xz(squareSpawn), inward(lych.at, 2)] },
	];
	const views = {
		overview: { label: 'Toàn cảnh (64 × 64 m)', target: [r3(centre.x), r3(centre.z)], fit: [bounds[2] - bounds[0], bounds[3] - bounds[1]] },
		gate: { label: 'Cổng chính (đường đắp, trạm Osric)', target: [r3(gate.at.x - out.x * 2), r3(gate.at.z - out.z * 2)], dist: 22, pitch: 40, lift: 1.2 },
		square: { label: 'Quảng trường (giếng, chuông, sạp, lò rèn)', target: [sq.x, sq.z], dist: 26, pitch: 48 },
		lychgate: { label: 'Cổng lychgate (ngưỡng ánh sáng)', target: inward(lych.at, 1), dist: 16, pitch: 36, lift: 1.2 },
		edda: { label: 'Ao trong tường · lối ván · nhà Edda', target: [hub.hub.pond.c.x - 2, hub.hub.pond.c.z - 1], dist: 18, pitch: 46 },
		vault: { label: 'Cửa hầm Barrow (tường tây)', target: [vault.at.x + 2.2, vault.at.z], dist: 15, pitch: 34, yaw: 55, lift: 1.2 },
	};

	// ---- far: a hill beyond the lychgate side with the church and the ossuary tower (the churchyard the hill lane climbs to), then the base map's far frame --
	const perp = { x: -hv.z, z: hv.x };
	const edge = toEdge(h0, hv, bounds);
	const farAt = (along, side) => [r3(h0.x + hv.x * (edge + along) + perp.x * side), r3(h0.z + hv.z * (edge + along) + perp.z * side)];
	const [hillX, hillZ] = farAt(70, 2);
	const farHills = [{ x: hillX, z: hillZ, r: 62, h: 15 }, ...(base.far?.hills ?? [])];
	const [chX, chZ] = farAt(68, 0);
	const [osX, osZ] = farAt(84, 26);
	const farItems = [
		{ asset: 'A15.1', x: chX, z: chZ, yaw: r3(Math.atan2(-hv.x, -hv.z) * DEG) || 0 },
		{ asset: 'A02.4', x: osX, z: osZ, yaw: r3(Math.atan2(-perp.x, -perp.z) * DEG) || 0, scale: 0.85 },
		...(base.far?.items ?? []),
	];

	const plan = {
		id: o.id,
		engine: 'outdoor',
		label: o.label,
		biome: 'BIO-03',
		seed: hub.seed,
		bounds,
		cell: o.cell,
		splat: { res: o.splat },
		target: { length: 90, note: `Walled hub of ${hub.id} (${hub.frozen?.generator ?? hub.meta?.generator ?? 'hub-gen'}, frozen ${hub.frozen?.at ?? ''}): causeway from the ${hub.hub.gates.main.edge} edge, main gate, square, lychgate in the ${hub.hub.gates.lychgate.edge} wall to the churchyard hill; a hub slice, not a full zone.` },
		edge: { width: 4, y: -1.5 },
		heights,
		water,
		paths,
		layers: base.layers,
		paint,
		assets: [],
		structures,
		runs: [],
		scatters,
		lights,
		markers,
		segments,
		views,
		far: { level: L.fen, size: base.far?.size ?? 2400, hills: farHills, items: farItems },
		defaultMood: base.defaultMood ?? 'day',
		moods: base.moods,
		notes: { hub: `Hub sinh từ ${hub.id} (${hub.frozen?.generator ?? ''}), đóng băng để map không đổi khi generator đổi.` },
	};

	// asset defs: the base map's defs that this plan places, plus the palisade pieces and this plan's stone blockouts
	const used = new Set([...structures.map((s) => s.asset), ...plan.runs.map((r) => r.asset), ...scatters.map((s) => s.asset), ...paths.filter((p) => p.asset).map((p) => p.asset), ...farItems.map((f) => f.asset)]);
	const byId = new Map([...base.assets, WALL_A, LOG2, ...blockouts.values()].map((a) => [a.id, a]));
	for (const id of used) if (!byId.has(id)) throw new Error(`hubToOutdoorPlan: no asset def "${id}" (base map ${base.id})`);
	plan.assets = [...used].map((id) => byId.get(id));
	return plan;
}

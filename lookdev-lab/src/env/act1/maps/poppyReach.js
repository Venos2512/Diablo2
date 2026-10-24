// ASHLAR · Act I · base map 3 `poppyReach`: The Poppy Reach (LD 11.6), BIO-02 (spec tmp/act1-base-maps/SPEC.md §3 map 3; art direction §10.2 item 5).
// One terrain, 200 × 256 m: the south face of the Gentle House hill, climbing gently (≈ 12 %) from the black fen water at the foot — where the causeway
// from Rook's Weir lands — to the hospice terrace on the hilltop. Wild, D3 C3, day under soft overcast light (no sun, a covered sky): red poppies drift to
// the horizon in grey-green grass (the act's strongest accent; instanced clumps from env/act1/meadow*.js, drifts with breathing room, the lanes kept
// quiet); drystone walls make the lanes (field gates between stone posts, a squeeze stile, walled lanes); the abandoned hillside farmhouse (its roof half
// fallen in: three empty beds, each with one clean pillow), hay ricks, poppy-drying racks, the abandoned ox cart still holding bedding; SLEEP SMOKE AS
// TERRAIN (LD proposal): five soft-edged, clearly bordered, slightly warm volumes breathing along the wind across the lanes (they close and open them;
// standing inside slows you, then sleep — marked); the Flint Delvings mine mouth cut into a chalk knoll on the east flank (side exit, BIO-06); four rite
// sites (each a different small scene) and two unmarked vignettes; at the top the hilltop approach steps (A18.6) through the whitewashed boundary wall
// (A18.5: a row of niches with still candles — Perfection's light) under the hospice ward range (A18.4) whose one high window glows warm and still: the
// act image, seen from the foot of the slope. Beyond the bounds the hill goes on (far.apron: the terrain's own meadow, poppies thinning out) and falls
// into the fens.
// Plain data + the §6b exports. Format: env/act1/outdoor.js (header) + env/act1/meadow.js (field, smoke, far.apron). Sizes: concept sheets (H = 1.8 m) —
// A08 (ashlar/art/act-01/_batches/env_A01-A14), A18 (ashlar/art/act-01/_batches/env_A15-A20, perspective_v1e); `N-PR…` = LD only.
import { withCounts, runModules } from '../outdoor.js';

const FEN = 0.0; // the fen at the foot (Rook's Weir lies beyond, south)
/** The Gentle House hill: the Reach is its south face; the same hill carries the land beyond the bounds (far.apron). */
const HILL = { x: 0, z: -175, r: 330, h: 34, power: 0.8 };
/** The Reach itself: a straight climb (≈ 15 %) from the fen foot to the hospice terrace with a shallow bowl in the middle — concave, so from the foot
 * the whole field rises into view up to the warm window (a convex hill would hide the top behind its brow). */
const SLOPE = { from: [0, 104, 0.6], to: [0, -106, 31.6] };
const BOWL = { x: 0, z: 0, rx: 150, rz: 125, h: -3.2 };
const ground = (x, z) => {
	const t = Math.min(1, Math.max(0, (SLOPE.from[1] - z) / (SLOPE.from[1] - SLOPE.to[1])));
	const d = Math.hypot((x - BOWL.x) / BOWL.rx, (z - BOWL.z) / BOWL.rz);
	return SLOPE.from[2] + (SLOPE.to[2] - SLOPE.from[2]) * t + (d < 1 ? BOWL.h * (0.5 + 0.5 * Math.cos(Math.PI * d)) : 0);
};
const r1 = (v) => Math.round(v * 10) / 10;
const APPROACH_Y = r1(ground(0, -99)); // the level ground below the steps
const TERRACE_Y = APPROACH_Y + 2; // the hospice terrace (the steps rise 2 m)
const FARM = { x: -44, z: 10, yaw: 20 }; // the abandoned farmhouse (door to the SSE, toward its yard and the lane)
const MINE = { x: 77.5, z: -34.5, yaw: -90 }; // the Flint Delvings mouth faces west, cut into the chalk knoll
const WARD = { x: 0, z: -117.5 }; // the hospice ward range on the terrace (south face at z = −113)
const FOLD = { x: 62, z: 6, r: 4.5 }; // the empty sheepfold (rite 3), its gap to the west
// the ribbon thorn (rite 4, the A23.2 GLB): its trunk foot (GLB (0.27, 1.39), off the pivot) on the rite marker. As built it leans west (its crown
// sweeps to −x and back); yaw 200 leans the crown east-south-east, downwind of the smoke (1, −0.15) like the blockout, and the game camera sees it
// from just right of its back: trunk, sweep and ribbons in profile (−135, due east, reads as a stack of crown slabs from the south). On the slope it
// stands at its pivot's ground + 0.15 m (no root end floats, the trunk foot 0.10 m in the ground). The sleeper's shoes (A22.1) lie 1.6 m east of the
// foot under the crown (nothing of the model below 2.2 m there, seen from the camera at 30–55° pitch), toes to the trunk.
const THORN = (() => {
	const m = { x: -43, z: -80.5, yaw: 200 };
	const c = Math.cos((m.yaw * Math.PI) / 180);
	const s = Math.sin((m.yaw * Math.PI) / 180);
	return { ...m, x: +(m.x - (0.27 * c + 1.39 * s)).toFixed(3), z: +(m.z - (-0.27 * s + 1.39 * c)).toFixed(3), foot: [m.x, m.z] };
})();
const THORN_SHOES = { x: +(THORN.foot[0] + 1.6 * Math.sin((80 * Math.PI) / 180)).toFixed(3), z: +(THORN.foot[1] + 1.6 * Math.cos((80 * Math.PI) / 180)).toFixed(3), yaw: -100 };
/** World point of a local offset (lx, lz) of a placed piece (x, z, yaw in degrees; the piece's front = local +z). */
const local = (o, lx, lz) => {
	const c = Math.cos((o.yaw * Math.PI) / 180);
	const s = Math.sin((o.yaw * Math.PI) / 180);
	return [r1(o.x + lx * c + lz * s), r1(o.z - lx * s + lz * c)];
};
const WIN = { x: WARD.x + 2.2, y: r1(TERRACE_Y + 5.8), z: WARD.z + 3.95 }; // the one high window, warm and still: the A18.4 model's own lit window (upper row, GLB (2.1–2.3, 5.8, ≈ 4.0))
const DOOR_OUT = local(FARM, -1.2, 3.8);
const DOOR_IN = local(FARM, -1.2, 1.6);
const INSIDE = local(FARM, -1.2, 0.2);
const BEDS = [0.15, 1.5, 2.85].map((lx) => local(FARM, lx, -1.3)); // three A18.2 GLBs at ×0.85 (1.33 × 1.7 m) side by side in the east half, heads to the back wall

// ---- asset defs (the §6b ASSETS rows; count is filled by withCounts unless given) ----------------------------------------------------------------
const A = (id, name, category, size, status, source, segment, extra = {}) => ({ id, name, category, size, status, source, segment, note: '', ...extra });
const DEFS = [
	// the A08 Poppy Reach kit
	A('A08.1', 'Poppy drift clump', 'vegetation', [1.3, 0.9, 1.3], 'procedural', 'concept A08 cell 1', 'all', { procedural: 'poppyField', collide: false, count: 36000, note: 'the field: ≈ 36 000 instanced clumps (6–8 stems, cupped red #B3262A heads, buds) in drifts with breathing room, swaying with the wind; the placed items mark the drift centres. Sheet clump ≈ 0.6 H tall, field clumps 0.42–0.82 m' }),
	A('A08.2', 'Drystone wall (module)', 'structure', [3.2, 0.84, 0.96], 'glb', 'concept A08 cell 2', 'all', { model: 'act1-a08-2-drystone-wall', fit: 'native', shape: 'drystone', module: 2.8, blockers: [[0, 0, 3.2, 0.6]], note: 'GLB 3.2 × 0.84 × 0.96 m (keyed on the 3.2 m module it reads low: top 0.53–0.84 m, 0.96 m deep with the grass at its foot; its stone ends fall 0.02–0.19 m short of the box): every wall run is placed ×1.25 (4 m pieces, 1.05 m tall) at a 2.8 m module (3.5 m apart: the ragged ends overlap, no gaps); blocks on its stone core (0.6 × 1.25 = 0.75 m deep, the blockout was 0.7), the grass foot is walk-through; field walls make the lanes; on a slope each module stands on its lowest ground (stepped walls); also the round sheepfold. Base colour greyed and darkened to ~0.7 in the prep (prepare-act1-kit.py TINT, kit fix 10-23: the pale cream stone read near-white, the brightest thing in every view)' }),
	A('A08.2-stile', 'Squeeze stile in a drystone wall', 'structure', [3.2, 1.3, 0.7], 'blockout', 'concept A08 cell 2 (the stile in the wall)', 'farm', { shape: 'stile', blockers: [[-1.25, 0, 0.7, 0.7], [1.25, 0, 0.7, 0.7]], note: 'blockout kept (kit swap 10-23): the A08.2-stile GLB has no gap (its wall runs through, top 0.6–0.89 m with a dip to 0.61 m); the map needs a 1.8 m walkable gap with a worn sill and step stones (the walk grid passes, the wall stubs block)' }),
	A('A08.3', 'Abandoned hillside farmhouse', 'building', [8, 6.4, 5.4], 'blockout', 'concept A08 cell 3', 'farm', { shape: 'farmhouse', blockers: [[0, -2.45, 8, 0.5], [-3.75, 0, 0.5, 5.4], [3.75, 0, 0.5, 5.4], [-3.05, 2.45, 1.9, 0.5], [1.65, 2.45, 4.7, 0.5]], note: 'blockout kept (kit swap 10-23): walls 2.7 m, ridge 5.4 m, chimney 6.4 m; the east half of the roof has fallen in (bare rafters) so the three empty beds show from above; the door (1.8 m) is walkable (the farm route goes in to V1). The A08.3 GLB is a closed house: its door is shut on the east gable, the roof whole, the inside a hollow shell with no floor; a roofless height cut would still leave no way in (and single-sided walls seen from inside), so the beat waits for a ruined-farmhouse model' }),
	A('A08.4', 'Hay rick', 'prop', [2.99, 3.2, 3.64], 'glb', 'concept A08 cell 4', 'all', { model: 'act1-a08-4-hay-rick', fit: 'native', shape: 'rick', note: 'GLB 3 × 3.2 × 3.6 m (round, a straw skirt makes it 3.6 m deep)' }),
	A('A08.5', 'Field gate between stone posts', 'structure', [4.4, 1.6, 0.7], 'blockout', 'concept A08 cell 5', 'all', { shape: 'fieldgate', blockers: [[-1.9, 0, 0.6, 0.6], [1.9, 0, 0.6, 0.6]], note: 'blockout kept (kit swap 10-23): the gates stand swung open into the field, 3.2 m between the posts (the lanes run through them); the A08.5 GLB\'s five-bar gate is shut across its posts (fine only off the lanes)' }),
	A('A08.6', 'Poppy-drying rack', 'prop', [3.6, 2.93, 1.8], 'glb', 'concept A08 cell 6', 'farm', { model: 'act1-a08-6-poppy-rack', fit: 'native', shape: 'dryingrack', note: 'GLB 3.6 × 2.93 × 1.8 m (red poppy heads hang +z of the bar, a bench at 0.77 m), placed ×0.9 (3.2 × 2.6 m); replaces the kit tạm herb rack' }),
	// the A18 extras (v2 batch)
	A('A18.1', 'Abandoned ox cart with bedding', 'prop', [2.31, 1.85, 4.0], 'glb', 'concept A18 cell 1 (v2 batch)', 'landing', { model: 'act1-a18-1-ox-cart', fit: 'native', shape: 'oxcart', note: 'GLB 2.3 × 1.85 × 4 m; shafts down, quilts, a straw mattress and one clean pillow — as if someone was carried away asleep (vignette)' }),
	A('A18.2', 'Farmhouse bed with one clean pillow', 'prop', [1.57, 0.98, 2.0], 'glb', 'concept A18 cell 2 (v2 batch)', 'farm', { model: 'act1-a18-2-bed-clean-pillow', fit: 'native', shape: 'bed', note: 'GLB 1.57 × 0.98 × 2 m (drooping blanket); three in the farmhouse at ×0.85 (1.33 m wide: three fit side by side in the 3.8 m east half under the fallen roof), empty, each one clean pillow — Mercy\'s linen; one at ×1 dragged out into the poppies (unmarked vignette)' }),
	A('A18.3', 'Flint Delvings mine mouth (chalk-and-flint cut)', 'rock', [4.0, 2.69, 3.77], 'glb', 'concept A18 cell 3 (v2 batch)', 'mine', { model: 'act1-a18-3-delvings-mouth', fit: 'native', shape: 'minecut', blockers: [[0, 0, 3.8, 2.6], [0, 0, 2.6, 3.6]], note: 'GLB 4 × 2.69 × 3.77 m placed ×1.34 (5.4 × 3.6 × 5.0 m, lintel ≈ 2.9 m): a rock knoll with its own timber portal (the old mine-timber GLB is dropped); the portal is a painted recess, not a tunnel, so the whole knoll blocks (two crossed rects ≈ its round footprint); the plain back is turned into the chalk knoll; the side exit to the Flint Delvings (11.8) is a trigger at the face' }),
	A('A18.4', 'Hospice ward range (exterior)', 'building', [30, 13.44, 10.54], 'glb', 'concept A18 cell 4 (v2 batch)', 'top', { model: 'act1-a18-4-hospice-range', fit: 'native', shape: 'ward', note: 'GLB 30 × 13.4 × 10.5 m (walls ±4.1 m, porches to ±5.3 m); brand-new whitewash, not one patch; one high window warm and still (Perfection light, on the model\'s own lit window, upper row): the act image, seen from the foot of the slope' }),
	A('A18.5', 'Hospice boundary wall with niche (still candle)', 'building', [6, 2.95, 0.85], 'glb', 'concept A18 cell 5 (v2 batch)', 'top', { model: 'act1-a18-5-hospice-wall-niche', fit: 'native', shape: 'limewall', note: 'GLB 6 × 2.95 × 0.85 m (end piers let the sections run on; plain whitewash back); every section has its niche and still candle — a row of identical still lights (Perfection grammar, glows on the model candles); the terrace edge, 2 m above the approach' }),
	A('A18.6', 'Hilltop approach steps', 'building', [4.0, 2.61, 4.06], 'glb', 'concept A18 cell 6 (v2 batch)', 'top', { model: 'act1-a18-6-hilltop-steps', fit: 'native', shape: 'steps', blockers: [[-1.68, 0, 0.64, 4.06], [1.68, 0, 0.64, 4.06], [-1.14, -1.165, 0.44, 1.65], [1.14, -1.165, 0.44, 1.65]], note: 'GLB 4 × 2.61 × 4.06 m placed ×1.3 (5.2 × 3.4 × 5.3 m): seven clean treads up to a landing 1.8 m above the approach (the terrace is 0.2 m higher behind it); Play walks the hidden ramp `steps` through the step edges (STEPS_WALK), the terrain runs under every tread and the landing (STEPS_GROUND); the cheeks block, and so do the pillar bases and flower pots flanking the landing (GLB |x| ≥ 0.92, 0.4–1.3 m above it); potted red / cream flowers on the cheeks; the exit to the Gentle House' }),
	// LD only (N-PR…)
	A('N-PR01', 'Abandoned reaping (sheaves, scythe, straw hat)', 'prop', [2.4, 1.1, 2.0], 'blockout', 'concept A23 cell 1 (v3 batch)', 'landing', { shape: 'reaping', note: 'rite 1: beside it a body-shaped hollow pressed into the poppies (field hole). Keeps the blockout: its GLB (act1-a23-1-abandoned-reaping) is a QA redo (the scythe juts out in mid-air with the jug hanging off it, no poppies, hollow sheaves)' }),
	A('N-PR02', "Harvester's cairn with ribbons and a name slate", 'story', [1.2, 1.32, 1.34], 'glb', 'concept A22 cell 4 (v3 batch)', 'farm', { model: 'act1-a22-4-harvester-cairn', fit: 'native', shape: 'cairn', note: 'rite 2, under a drying rack in the farmyard. GLB 1.2 × 1.32 × 1.34 m (replaces the kit rock stand-in): the name slate leans on the front (+z), the ribbon stick on top (1.32 m); blocks as a whole' }),
	A('N-PR03', "Shepherd's crook and folded coat", 'prop', [0.74, 1.6, 0.79], 'glb', 'concept A22 cell 5 (v3 batch)', 'east', { model: 'act1-a22-5-crook-and-coat', fit: 'native', shape: 'crook', blockers: [[0.08, -0.12, 0.3, 0.3]], note: 'rite 3, inside the empty sheepfold (a ring of A08.2). GLB 0.74 × 1.6 × 0.79 m: the 1.6 m crook, the folded coat in front of it (+z); blocks on the crook only (0.3 × 0.3 m at GLB x −0.07…+0.23, z −0.27…+0.03: its shaft leans from (0.15, −0.09) 0.55 m up to (−0.02, −0.15) at 1.2 m, the hook reaches x +0.31 at 1.3–1.6 m; review a2x F-c), the coat stays walk-through' }),
	A('N-PR04', 'Lone hawthorn with ribbons (the ribbon thorn)', 'vegetation', [7.87, 5.5, 3.99], 'glb', 'concept A23 cell 2 (v3 batch)', 'top', { model: 'act1-a23-2-ribbon-thorn', fit: 'native', shape: 'thorn', blockers: [[0.27, 1.39, 0.6, 0.6], [0.65, 0.45, 1.0, 1.0]], note: 'rite 4: wind-bent, ribbons tied in it, a sleeper\'s shoes beneath (A22.1); a landmark of the upper field. GLB 7.87 × 5.5 × 3.99 m: the trunk foot at (+0.27, +1.39) off the pivot, the crown swept to −x and back (−z) over a twisted trunk, the ribbon-rich side +z. Placed by its trunk foot on the rite marker and turned (yaw 200) so the crown leans east-south-east, downwind of the smoke (1, −0.15) like the blockout, seen from just right of its back by the game camera; blocks on the trunk only (its foot, and where it leans back at 0.8 m); ribbons and twigs walk-through' }),
	A('N-PR05', 'Straw doll on a stile step', 'prop', [0.3, 0.32, 0.33], 'glb', 'concept A22 cell 6 (v3 batch)', 'farm', { model: 'act1-a22-6-straw-doll', fit: 'native', shape: 'doll', collide: false, note: 'unmarked vignette. GLB 0.3 × 0.32 × 0.33 m: the doll faces +z, its legs out 0.17 m in front of the pivot' }),
	A('A22.1', 'Worn shoes at the foot of the ribbon thorn', 'prop', [0.45, 0.18, 0.44], 'glb', 'concept A22 cell 1 (v3 batch)', 'top', { model: 'act1-a22-1-worn-shoes', fit: 'native', collide: false, note: 'rite 4: the sleeper\'s pair (the same model as the fens N-FN02), set beside the thorn\'s trunk foot, toes to the trunk' }),
	A('N-PR06', 'Water trough (farmyard)', 'prop', [2.5, 1.0, 1.1], 'kit', 'LD only, no concept', 'farm', { model: 'kit:animals.trough', fit: 'native', note: 'kit tạm (camp trough)' }),
	A('N-PR07', 'Seed sacks', 'prop', [1.9, 1.3, 1.8], 'kit', 'LD only, no concept', 'farm', { model: 'kit:storage.sacks', fit: 'native', note: 'kit tạm' }),
	A('N-PR08', 'Barrow', 'prop', [2.5, 1.0, 1.25], 'kit', 'LD only, no concept', 'farm', { model: 'kit:animals.wheelbarrow', fit: 'native', collide: false, note: 'kit tạm (camp wheelbarrow)' }),
	A('N-PR09', 'Spilled straw', 'prop', [2.4, 0.24, 2.3], 'kit', 'LD only, no concept', 'farm', { model: 'kit:clutter.straw', fit: 'native', collide: false, note: 'kit tạm' }),
	A('N-PR10', 'Bramble / hawthorn scrub at wall ends', 'vegetation', [1.8, 1.1, 1.35], 'kit', 'LD only, no concept', 'all', { model: 'kit:shrubs.shrub_12', fit: 'native', collide: false, note: 'kit tạm (Blood-Moor shrub)' }),
	A('N-PR11', 'Landing posts at the causeway (Rook\'s Weir boats)', 'structure', [2.16, 1.27, 0.36], 'kit', 'LD only, no concept', 'landing', { model: 'kit:fence.broken_pair', fit: 'native', shape: 'posts', collide: false, note: 'kit tạm (broken fence pair at ×1.2 = 2.6 × 1.5 m): posts in a pair at the causeway landing' }),
	A('A04.2', 'Young willow (fen foot)', 'vegetation', [4.94, 6.0, 5.22], 'glb', 'concept A04 cell 2 (E02 willow kit)', 'landing', { model: 'act1-a04-2-young-willow', fit: 'native', shape: { kind: 'tree', crown: 'weeping' }, blockers: [[0.12, 0.54, 1.05, 1.6]], note: 'GLB 4.9 × 6 × 5.2 m; only at the fen shore; only the trunk blocks' }),
	A('A03.1', 'Low grass clump (meadow tufts)', 'vegetation', [0.6, 0.5, 0.6], 'procedural', 'concept A03 cell 1 (E01 fen kit)', 'all', { procedural: 'grass', collide: false, count: 30300, note: 'grey-green meadow tufts: ≈ 30 000 instanced Dark Wood grass cards from the field + 320 scattered clumps' }),
	A('A03.2', 'Tall reeds clump', 'vegetation', [0.8, 1.8, 0.8], 'procedural', 'concept A03 cell 2 (E01 fen kit)', 'landing', { procedural: 'reeds', collide: false, note: 'shore-plant cards along the fen at the foot' }),
	A('A03.3', 'Sedge water clump', 'vegetation', [0.7, 0.9, 0.7], 'procedural', 'concept A03 cell 3 (E01 fen kit)', 'landing', { procedural: 'sedge', collide: false }),
	A('glb:dungeon-prop-flint-boulders', 'Flint boulders', 'rock', [2.0, 1.18, 1.9], 'glb', 'ashlar/3d/common/dungeon_v1/flint_boulders', 'all', { model: 'dungeon-prop-flint-boulders', fit: 'native', note: 'the Delvings spoil and the field-clearance piles at wall corners (flint country)' }),
	A('glb:biome-prop-riverbank-stones', 'Riverbank stones', 'rock', [1.0, 0.35, 1.0], 'glb', 'ashlar/3d/common/clutter_v1/riverbank_stones', 'landing', { model: 'biome-prop-riverbank-stones', fit: 'native', collide: false }),
];

// ---- layout ----------------------------------------------------------------------------------------------------------------------------------------
// Contour walls (west → east), broken only by their gates / the stile; the main lane crosses each one there.
const W1 = { west: [[-100, 82], [-70, 87], [-45, 91], [-20.9, 93.3]], gate: { x: -18.7, z: 93.2, yaw: -3 }, east: [[-16.5, 93.1], [10, 92.5], [40, 89.5], [70, 84.5], [100, 78]] };
const W2 = { west: [[-100, 33], [-70, 40], [-40, 45], [-10, 48.5], [20, 49], [34.2, 47.4]], gate: { x: 36.4, z: 47.2, yaw: 6 }, east: [[38.6, 47.0], [60, 44.5], [80, 40], [100, 35]] };
const W3 = { west: [[-100, -24], [-70, -18.5], [-45, -14.5], [-30.0, -13.1]], stile: { x: -28.4, z: -13.0, yaw: -4.4 }, mid: [[-26.8, -12.9], [0, -11], [25, -12.5], [42.4, -15.6]], gate: { x: 44.6, z: -16.0, yaw: 10.7 }, east: [[46.8, -16.4], [70, -21], [100, -28]] };
const W4 = { west: [[-100, -78], [-60, -70], [-25, -65], [15.8, -63.2]], gate: { x: 18, z: -63.2, yaw: 0 }, east: [[20.2, -63.2], [45, -64.5], [75, -70], [100, -76]] };
// the walled lanes (choke): straight runs 2.8 / 2.7 m either side of the lane
const LANE_A = { from: [30, 39], to: [-12, 20.5], half: 2.8 }; // G2 → the farm
const LANE_B = { from: [17, -66.5], to: [9.5, -80], half: 2.7 }; // G4 → the upper fields
const sideWalls = ({ from, to, half }) => {
	const dx = to[0] - from[0];
	const dz = to[1] - from[1];
	const L = Math.hypot(dx, dz);
	const nx = -dz / L;
	const nz = dx / L;
	return [1, -1].map((s) => [[r1(from[0] + nx * half * s), r1(from[1] + nz * half * s)], [r1(to[0] + nx * half * s), r1(to[1] + nz * half * s)]]);
};
const foldRing = () => {
	const pts = [];
	for (let a = 200; a <= 520; a += 40) pts.push([r1(FOLD.x + Math.cos((a * Math.PI) / 180) * FOLD.r), r1(FOLD.z + Math.sin((a * Math.PI) / 180) * FOLD.r)]);
	return pts; // a 40° gap on the west side (toward the track)
};
// the hospice boundary wall: the terrace edge, broken only by the steps (x −2.1 … 2.1)
const WALL_Z = -105.5;
const FRONT = [[[-45.5, WALL_Z], [-2.1, WALL_Z]], [[2.1, WALL_Z], [45.5, WALL_Z]]];
// the A18.5 candle sits in its niche at GLB (0, 1.5, 0.07); its glow stands 0.15 m in front of the wall face (0.32 m), at the candle's height up its own
// section (yOn: the section's base + 1.5 m × its height scale — the four sections by the steps stand on their lowest ground, stretched ×1.17 to keep the
// parapet over the terrace): seen from the game camera it falls inside the niche opening
const NICHES = FRONT.flatMap((pts) => runModules({ points: pts }, 6).map((m) => [r1(m.x), r1(m.z + 0.47)]));
// the A18.6 steps (GLB ×1.3 at z −103.6 on APPROACH_Y), measured in the model: seven treads ≈ 0.52 m deep, risers 0.2–0.3 m, the step edges at z −100.97
// (+0.23), −101.40 (+0.50), −101.89 (+0.73), −102.40 (+0.95), −102.93 (+1.18), −103.46 (+1.39), −104.00 (+1.61), the landing −104.52 … −106.19 (+1.80);
// the tread sides lie up to 0.12 m further back and 0.07 m lower than their middles. Play walks a hidden ramp through the step edges (from the ground
// 0.35 m before the bottom riser; at most 0.1 m under an edge, at most one riser over a tread; square ends: no floor hole before the bottom step); the terrain
// stays ≥ 0.12 m under every tread and ≥ 0.25 m under the landing (≥ 6 cm at its back corners, where it climbs to the terrace)
const STEPS_WALK = [[0, -100.62, APPROACH_Y], [0, -101.4, APPROACH_Y + 0.5], [0, -104.52, APPROACH_Y + 1.8], [0, -106.19, APPROACH_Y + 1.8]];
const STEPS_GROUND = { from: [0, -101.2, APPROACH_Y], to: [0, -104.6, APPROACH_Y + 1.5] };

export const PLAN = {
	id: 'poppyReach',
	engine: 'outdoor',
	label: 'The Poppy Reach',
	biome: 'BIO-02',
	seed: 1106,
	bounds: [-100, -128, 100, 128],
	cell: 0.5,
	splat: { res: 896 },
	target: {
		length: 520,
		note: 'Full game (28 min, D3 C3): ≈ 520 m of the Reach road over a ≈ 300 × 420 m hillside (≈ 95 s of running, 4–5 open / choke cycles of 40–60 s, 6–8 smoke banks, a second farm, the Delvings mouth on a longer east flank). This slice has ≈ 300 m of road (≈ 55 s) with the cycle compressed to 5–15 s per beat; keep the climb north toward the warm window, the walls as lane makers and the fen at the foot.',
	},
	heights: [
		{ kind: 'base', y: FEN },
		{ kind: 'tilt', area: { rect: [-140, -170, 140, 170] }, from: SLOPE.from, to: SLOPE.to, soft: 0 }, // the climb (the Gentle House hill's south face)
		{ kind: 'hill', ...BOWL }, // the shallow bowl: concave, the top stays in view from the foot
		{ kind: 'raise', area: { rect: [-140, 107, 140, 170] }, dy: -1.6, soft: 7 }, // the foot runs out into the fen
		{ kind: 'noise', amp: 0.55, scale: 26, seed: 2.7, area: { rect: [-90, -100, 90, 100] }, soft: 12 }, // field undulation (quiet at the edges: the apron carries on the hill)
		{ kind: 'noise', amp: 0.1, scale: 5, seed: 6.1 },
		{ kind: 'hill', x: 86, z: -36, rx: 15, rz: 12, rot: -15, h: 5.5, power: 1.2 }, // the chalk knoll of the Flint Delvings
		{ kind: 'flatten', area: { circle: [0, -99, 10] }, y: APPROACH_Y, soft: 6 }, // the level ground below the steps
		{ kind: 'flatten', area: { rect: [-46, -128, 46, WALL_Z] }, y: TERRACE_Y, soft: 0.5 }, // the hospice terrace (2 m up, behind the wall)
		{ kind: 'tilt', area: { rect: [-2.2, -106.05, 2.2, -100.4] }, ...STEPS_GROUND, soft: 0.35 }, // the ground under the A18.6 GLB: under every tread and the landing (Play walks the hidden ramp `steps`), up to the terrace just behind the landing
	],
	water: [
		{
			id: 'fen', label: 'The fen at the foot (toward Rook\'s Weir)', level: FEN, tint: 'fen', wobble: 1.4, shelf: [2.4, 0.3], drop: [1.6, 1.3], bank: [6, 0.3],
			area: { poly: [[-102, 130], [-102, 99], [-80, 100.5], [-55, 104.5], [-32, 108], [-10, 109.5], [15, 108.5], [40, 106], [65, 102], [102, 97], [102, 130]] },
		},
	],
	paths: [
		{ id: 'dike', kind: 'dike', label: 'Causeway from Rook\'s Weir', points: [[-27, 128], [-25.8, 119], [-23.8, 110], [-22, 103]], width: 3.2, dike: { crest: 0.95, bank: 2.4 }, surface: 'packed', smooth: 1 },
		{
			id: 'reach', kind: 'track', label: 'The Reach road (foot → hospice steps)', width: 2.6, surface: 'packed', smooth: 2,
			points: [[-22, 103], [-20.2, 97.5], [W1.gate.x, W1.gate.z], [-15.5, 88], [-4, 79], [12, 69.5], [26, 61], [33.5, 53.5], [W2.gate.x, W2.gate.z + 0.3], [33, 41.5], LANE_A.from, LANE_A.to, [-24, 14], [-29.5, 6.5], [-30, -3], [-28.6, -11.5], [-27.6, -15.5], [-20, -24], [-6, -35], [8, -45], [15.5, -54], [18, -60], [W4.gate.x, W4.gate.z - 0.3], LANE_B.from, LANE_B.to, [5, -89], [2, -95], [0, -99], [0, -101.2]],
		},
		{ id: 'eastTrack', kind: 'track', label: 'Field track east (G3, the fold, the mine)', width: 2.0, surface: 'packed', smooth: 2, points: [[33, 41.5], [40, 33], [45, 18], [45.5, 2], [44.8, -8], [W3.gate.x, W3.gate.z], [45.5, -27], [40, -41], [28, -51.5], [17, -57.5]] },
		{ id: 'mineTrack', kind: 'track', label: 'Track to the Flint Delvings', width: 1.8, surface: 'packed', smooth: 2, points: [[45.5, -27], [55, -30.5], [65, -33.5], [71.5, -34.5]] },
		{ id: 'farmTrack', kind: 'track', label: 'Into the farmyard', width: 2.0, surface: 'packed', smooth: 2, points: [[-24, 14], [-33, 15.5], [-40, 15.5], DOOR_OUT] },
		{ id: 'westTrack', kind: 'track', label: 'Field path to the reaping', width: 1.5, surface: 'packed', smooth: 2, points: [[-15.5, 88], [-30, 81], [-44, 73], [-49.5, 70]] },
		{ id: 'foldTrack', kind: 'track', label: 'Field path to the sheepfold', width: 1.4, surface: 'packed', smooth: 1, points: [[45.4, 6], [52, 6], [57.2, 6]] },
		{ id: 'thornTrack', kind: 'track', label: 'Field path to the ribbon thorn', width: 1.4, surface: 'packed', smooth: 2, points: [[5.5, -88], [-8, -87], [-24, -84.5], [-38, -81.5]] },
		// two hidden walkways, each only as wide as the lane its blockers leave (between the cheeks, then between the pillars): Play's nav finds a blocker by
		// its walls, so no deck may run on inside one; square ends meet without overlap
		{ id: 'steps', kind: 'walkway', label: 'Up the A18.6 steps (hidden ramp through the step edges; the GLB treads are what you see)', points: STEPS_WALK.slice(0, 3), width: 2.96, surface: 'stone', hidden: true, caps: false, ramps: false },
		{ id: 'stepsLanding', kind: 'walkway', label: 'The A18.6 landing (hidden deck between the pillars and flower pots)', points: STEPS_WALK.slice(2), width: 2.4, surface: 'stone', hidden: true, caps: false, ramps: false },
	],
	layers: [
		{ id: 'BIO02_meadow', tile: 4.0 }, // 0 the meadow (the base; it also runs on over the apron)
		{ id: 'DW_sparse', tile: 3.2 }, // 1 thin grass: lane verges, the upper slope, the approach
		{ id: 'DW_dense', tile: 3.2 }, // 2 rank grass: wall feet, the shore band, patches
		{ id: 'DW_dirt', tile: 3.0 }, // 3 lanes and tracks, the farmyard, the approach
		{ id: 'BIO03_flint', tile: 3.5 }, // 4 the farmyard (flint cobbles), gate / stile thresholds
		{ id: 'BIO06_flint_spoil', tile: 3.5 }, // 5 chalk-and-flint spoil at the Delvings mouth
		{ id: 'BIO05_lime', tile: 3.5 }, // 6 the hospice terrace (clean lime)
		{ id: 'DW_mud', tile: 3.2 }, // 7 the fen shore, the causeway
	],
	paint: [
		{ layer: 'DW_sparse', kind: 'path', pathKind: ['track'], extra: 0.3, soft: 1.2, value: 0.4, edge: { amp: 0.5, scale: 3 } },
		{ layer: 'DW_sparse', kind: 'height', range: [24, 40], soft: 3, value: 0.4, patchy: { scale: 12, cover: 0.45 } },
		{ layer: 'DW_sparse', kind: 'area', area: { circle: [0, -99, 12] }, soft: 4, value: 0.6 },
		{ layer: 'DW_dense', kind: 'structures', assets: ['A08.2', 'A08.2-stile', 'A08.5'], margin: 1.3, soft: 1.2, value: 0.75, edge: { amp: 0.6, scale: 2.5 } },
		{ layer: 'DW_dense', kind: 'water', band: [0.6, 8], soft: 2.2, value: 0.85, patchy: { scale: 6, cover: 0.65 } },
		{ layer: 'DW_dense', kind: 'fill', value: 0.4, patchy: { scale: 15, cover: 0.32 } },
		{ layer: 'DW_dirt', kind: 'path', pathKind: ['track', 'dike'], extra: 0, soft: 0.8, value: 0.6, edge: { amp: 0.4, scale: 2.2 } },
		{ layer: 'BIO03_flint', kind: 'path', pathKind: ['track'], extra: -0.3, soft: 0.9, value: 0.8, patchy: { scale: 2.5, cover: 0.8 } }, // crushed flint in the ruts (flint country): the lanes read lighter, still quiet
		{ layer: 'DW_dirt', kind: 'area', area: { circle: [FARM.x + 6, FARM.z + 3, 12] }, soft: 3, value: 0.6, patchy: { scale: 4, cover: 0.6 } },
		{ layer: 'DW_dirt', kind: 'area', area: { circle: [0, -99, 7] }, soft: 2.5, value: 0.55 },
		{ layer: 'BIO03_flint', kind: 'area', area: { obb: [FARM.x + 3, FARM.z + 5, 16, 9, FARM.yaw] }, soft: 2, value: 0.85, edge: { amp: 0.8, scale: 3 } },
		{ layer: 'BIO03_flint', kind: 'structures', assets: ['A08.3'], margin: 1.4, soft: 1.2, value: 0.8 },
		{ layer: 'BIO03_flint', kind: 'structures', assets: ['A08.5', 'A08.2-stile'], margin: 0.7, soft: 0.9, value: 0.65 },
		{ layer: 'BIO06_flint_spoil', kind: 'area', area: { ellipse: [MINE.x - 3, MINE.z, 8, 6.5, 0] }, soft: 3, value: 0.95, edge: { amp: 1.4, scale: 3.5 } },
		{ layer: 'BIO06_flint_spoil', kind: 'structures', assets: ['A18.3'], margin: 1.6, soft: 1.5, value: 0.9 },
		{ layer: 'BIO05_lime', kind: 'area', area: { rect: [-46, -128, 46, WALL_Z - 0.1] }, soft: 0.8, value: 0.92 },
		{ layer: 'DW_mud', kind: 'water', band: [-6, 1.8], soft: 1.6, value: 0.9, edge: { amp: 0.9, scale: 3 } },
		{ layer: 'DW_mud', kind: 'path', paths: ['dike'], extra: 0.6, soft: 1.2, value: 0.7 },
		{ layer: 'wet', kind: 'fill', value: 0.14 },
		{ layer: 'wet', kind: 'water', band: [-8, 3], soft: 1.6, value: 1 },
		{ layer: 'wet', kind: 'height', range: [-3, 1.2], soft: 1.2, value: 0.6 },
		// only the meadow base reaches the bounds: the apron (same material) carries it on beyond them, where the splat clamps to its edge
		...['DW_sparse', 'DW_dense', 'DW_dirt', 'BIO03_flint', 'BIO06_flint_spoil', 'BIO05_lime', 'DW_mud'].map((layer) => ({ layer, kind: 'area', area: { rect: [-95, -123, 95, 123] }, soft: 6, op: 'mul' })),
	],
	assets: DEFS,
	structures: [
		// the hospice edge: the ward range, the steps (the wall runs below)
		{ asset: 'A18.4', x: WARD.x, z: WARD.z, yaw: 0, name: 'The hospice ward range (the warm, still window)', label: 'A18.4 Hospice ward range' },
		{ asset: 'A18.6', x: 0, z: -103.6, yaw: 0, y: APPROACH_Y, scale: 1.3, name: 'Hilltop approach steps' },
		// the gates and the stile
		{ asset: 'A08.5', ...W1.gate, name: 'Field gate G1 (into the Reach)' },
		{ asset: 'A08.5', ...W2.gate, name: 'Field gate G2 (into the walled lane)' },
		{ asset: 'A08.5', ...W3.gate, name: 'Field gate G3 (east track)' },
		{ asset: 'A08.5', ...W4.gate, name: 'Field gate G4 (the upper lane)' },
		{ asset: 'A08.2-stile', ...W3.stile, name: 'Stile S1' },
		// the farm
		{ asset: 'A08.3', x: FARM.x, z: FARM.z, yaw: FARM.yaw, name: 'The abandoned farmhouse', pad: { margin: 4, soft: 4 } },
		...BEDS.map(([x, z], i) => ({ asset: 'A18.2', x, z, yaw: FARM.yaw, scale: 0.85, name: `Empty bed ${i + 1} (one clean pillow)` })),
		{ asset: 'A08.6', x: -34, z: 22, yaw: 15, scale: 0.9, name: 'Poppy-drying rack (the harvester\'s)' },
		{ asset: 'A08.6', x: -31, z: 3, yaw: -70, scale: 0.9, name: 'Poppy-drying rack' },
		{ asset: 'A08.6', x: -56, z: 16, yaw: 40, scale: 0.9, name: 'Poppy-drying rack' },
		{ asset: 'A08.6', x: 8, z: 62, yaw: 30, scale: 0.9, name: 'Poppy-drying rack (lower field)' },
		{ asset: 'N-PR02', x: -33.7, z: 23.9, yaw: 15, name: 'Rite 2 · the harvester\'s cairn', tag: 'rite' },
		{ asset: 'A08.4', x: -56, z: 2, yaw: 0, name: 'Hay rick (farm)' },
		{ asset: 'A08.4', x: -50.5, z: -4.5, yaw: 40, name: 'Hay rick (farm)' },
		{ asset: 'N-PR06', x: -37.5, z: 6.5, yaw: 20, name: 'Water trough' },
		{ asset: 'N-PR07', x: -49.8, z: 14.6, yaw: 10, name: 'Seed sacks' },
		{ asset: 'N-PR08', x: -33.5, z: 10.5, yaw: 60, name: 'Barrow' },
		{ asset: 'N-PR09', x: -39, z: 2.5, yaw: 0, name: 'Spilled straw' },
		// the lower field: the ox cart, hay ricks, the reaping (rite 1)
		{ asset: 'A18.1', x: 19, z: 70, yaw: 115, name: 'The abandoned ox cart (still holding bedding)' },
		{ asset: 'A08.4', x: 56, z: 72, yaw: 10, name: 'Hay rick' },
		{ asset: 'A08.4', x: 66, z: 61, yaw: 50, name: 'Hay rick' },
		{ asset: 'A08.4', x: 47, z: 80, yaw: 80, name: 'Hay rick' },
		{ asset: 'N-PR01', x: -52, z: 68, yaw: 30, name: 'Rite 1 · the abandoned reaping', tag: 'rite' },
		// the sheepfold (rite 3), the ribbon thorn (rite 4), the bed in the poppies (unmarked), the doll on the stile (unmarked)
		{ asset: 'N-PR03', x: FOLD.x - 0.5, z: FOLD.z + 1.2, yaw: 30, name: 'Rite 3 · the shepherd\'s crook in the empty fold', tag: 'rite' },
		{ asset: 'N-PR04', x: THORN.x, z: THORN.z, yaw: THORN.yaw, dy: 0.15, name: 'Rite 4 · the ribbon thorn', tag: 'rite' },
		{ asset: 'A22.1', ...THORN_SHOES, name: 'Rite 4 · the sleeper\'s shoes at the thorn', tag: 'rite' },
		{ asset: 'A18.2', x: 34, z: -91, yaw: 200, name: 'A bed dragged out into the poppies (unmarked)' },
		{ asset: 'N-PR05', x: -28.1, z: -12.35, yaw: 160, y: 'ground', dy: 0.24, name: 'Straw doll on the stile step (unmarked)' },
		{ asset: 'A08.4', x: 54, z: -86, yaw: 20, name: 'Hay rick (upper field)' },
		// the Flint Delvings mouth (side exit)
		{ asset: 'A18.3', x: MINE.x, z: MINE.z, yaw: MINE.yaw, scale: 1.34, name: 'The Flint Delvings mouth', pad: { margin: 1, soft: 3, y: r1(ground(MINE.x, MINE.z) + 0.9) } },
		...[[80.8, -30.4], [72.6, -39.6], [-63, 87.4], [-52, -15.9], [62, -67.6], [-30, -64.2], [88, 62]].map(([x, z], i) => ({ asset: 'glb:dungeon-prop-flint-boulders', x, z, yaw: i * 67, scale: 0.8 + ((i * 3) % 4) * 0.1, name: i < 2 ? 'Flint boulders (Delvings spoil)' : 'Field-clearance flints' })),
		// the foot: the landing, willows, stones
		{ asset: 'N-PR11', x: -24.6, z: 105.6, yaw: 80, scale: 1.2, name: 'Landing posts (Rook\'s Weir boats)' },
		...[[-58, 101.5], [-8, 104], [24, 102.5], [58, 97.5], [-84, 96]].map(([x, z], i) => ({ asset: 'A04.2', x, z, yaw: i * 70, scale: 0.85 + i * 0.06, name: 'Young willow' })),
		...[[-31, 107.2], [-15, 108.2], [8, 107.6], [-40, 106]].map(([x, z], i) => ({ asset: 'glb:biome-prop-riverbank-stones', x, z, yaw: i * 81 })),
		// scrub at wall ends
		...[[-98, 81], [98, 77.6], [-98, 33.4], [98, 35.4], [-98, -23.4], [98, -27.4], [-98, -77.4], [98, -75.4], [-58.4, 89.5], [52, 88], [-22, 46.6], [72, -68.6], [-62, -71.4], [30, -61.6]].map(([x, z], i) => ({ asset: 'N-PR10', x, z, yaw: i * 47, scale: 0.9 + (i % 3) * 0.15 })),
		// the field's drift centres (A08.1, procedural: the field builder fills the drifts)
		...[[-42, 66], [30, 78], [66, 22], [-52, -40], [-50, -92], [46, -94]].map(([x, z]) => ({ asset: 'A08.1', x, z, yaw: 0, y: 'ground', name: 'Poppy drift' })),
	],
	runs: [
		{ asset: 'A08.2', scale: 1.25, points: W1.west, tag: 'W1' },
		{ asset: 'A08.2', scale: 1.25, points: W1.east, tag: 'W1' },
		{ asset: 'A08.2', scale: 1.25, points: W2.west, tag: 'W2' },
		{ asset: 'A08.2', scale: 1.25, points: W2.east, tag: 'W2' },
		{ asset: 'A08.2', scale: 1.25, points: W3.west, tag: 'W3' },
		{ asset: 'A08.2', scale: 1.25, points: W3.mid, tag: 'W3' },
		{ asset: 'A08.2', scale: 1.25, points: W3.east, tag: 'W3' },
		{ asset: 'A08.2', scale: 1.25, points: W4.west, tag: 'W4' },
		{ asset: 'A08.2', scale: 1.25, points: W4.east, tag: 'W4' },
		...sideWalls(LANE_A).map((points) => ({ asset: 'A08.2', scale: 1.25, points, tag: 'laneA' })),
		...sideWalls(LANE_B).map((points) => ({ asset: 'A08.2', scale: 1.25, points, tag: 'laneB' })),
		{ asset: 'A08.2', scale: 1.25, points: [[-62, 88], [-64, 66], [-66, 41.6]], tag: 'field' }, // radial field walls
		{ asset: 'A08.2', scale: 1.25, points: [[-50, -15.2], [-52, -40], [-55, -68.6]], tag: 'field' },
		{ asset: 'A08.2', scale: 1.25, points: foldRing(), tag: 'fold' },
		// the hospice boundary wall: the front (the steps between), the sides back to the bounds
		...FRONT.map((points) => ({ asset: 'A18.5', points, tag: 'hospice' })),
		{ asset: 'A18.5', points: [[-45.5, WALL_Z - 3.2], [-45.5, -127.4]], tag: 'hospice', flip: true },
		{ asset: 'A18.5', points: [[45.5, WALL_Z - 3.2], [45.5, -127.4]], tag: 'hospice' },
	],
	scatters: [
		{ asset: 'A03.1', count: 320, area: { rect: [-96, -100, 96, 100] }, spacing: 1.6, clear: { paths: 0.8, water: 0.8, structures: 0.6 }, scale: [0.8, 1.3], seed: 31 },
		{ asset: 'A03.2', count: 200, area: { rect: [-100, 92, 100, 128] }, spacing: 0.8, band: { water: [-1.6, 0.9] }, clear: { paths: 0.8 }, scale: [0.75, 1.3], seed: 41 },
		{ asset: 'A03.3', count: 140, area: { rect: [-100, 88, 100, 128] }, spacing: 0.9, band: { water: [-0.5, 2.8] }, clear: { paths: 0.6 }, scale: [0.7, 1.2], seed: 43 },
	],
	field: {
		seed: 61,
		cell: 1,
		poppy: { asset: 'A08.1', perM2: 2.2, sprinkle: 0.05, height: [0.42, 0.82] },
		grass: { asset: 'A03.1', perM2: 1.3, base: 0.55, height: [0.28, 0.58] },
		breathe: { scale: 8, cover: 0.62, floor: 0.25 },
		clear: { paths: 0.7, grassPaths: 0.1, ramp: 1.6, structures: 0.7, water: 1.0, holes: [{ ellipse: [-50.4, 66.2, 0.65, 1.15, 30] }, { rect: [-46.5, -140, 46.5, WALL_Z] }] }, // the reaping hollow; the hospice terrace (clean lime, nothing grows)
		slope: 0.9,
		apron: { reach: 60, density: 0.45 },
		drifts: [
			// the lower field
			{ area: { ellipse: [-42, 66, 30, 12, 8] }, value: 1, soft: 8, edge: { amp: 4, scale: 11 } },
			{ area: { ellipse: [30, 78, 26, 9, -10] }, value: 1, soft: 7, edge: { amp: 3.5, scale: 10 } },
			{ area: { ellipse: [66, 60, 22, 10, -25] }, value: 0.95, soft: 7, edge: { amp: 3.5, scale: 9 } },
			{ area: { ellipse: [-4, 58, 18, 7, 12] }, value: 0.85, soft: 6, edge: { amp: 3, scale: 8 } },
			{ area: { ellipse: [-80, 72, 18, 10, 20] }, value: 0.8, soft: 7, edge: { amp: 3, scale: 9 } },
			// between the walled lane and the walls (farm band)
			{ area: { ellipse: [-32, 36, 20, 7, 22] }, value: 0.9, soft: 6, edge: { amp: 3, scale: 8 } },
			{ area: { ellipse: [14, 8, 24, 9, -8] }, value: 0.9, soft: 7, edge: { amp: 3.5, scale: 9 } },
			{ area: { ellipse: [66, 22, 24, 13, -15] }, value: 1, soft: 8, edge: { amp: 4, scale: 10 } },
			{ area: { ellipse: [-76, 14, 20, 15, 25] }, value: 0.9, soft: 8, edge: { amp: 4, scale: 10 } },
			{ area: { ellipse: [80, -2, 14, 8, 0] }, value: 0.8, soft: 6, edge: { amp: 3, scale: 8 } },
			// the middle field (the smoke banks lie over it)
			{ area: { ellipse: [-52, -40, 28, 12, 12] }, value: 1, soft: 8, edge: { amp: 4, scale: 11 } },
			{ area: { ellipse: [10, -24, 20, 7, -10] }, value: 0.8, soft: 6, edge: { amp: 3, scale: 8 } },
			{ area: { ellipse: [72, -52, 20, 9, -20] }, value: 0.9, soft: 7, edge: { amp: 3, scale: 9 } },
			{ area: { ellipse: [-12, -52, 18, 6, 5] }, value: 0.8, soft: 6, edge: { amp: 3, scale: 8 } },
			// the upper fields under the hospice: red to the top of the slope
			{ area: { ellipse: [-50, -92, 34, 9, 4] }, value: 1, soft: 7, edge: { amp: 3.5, scale: 10 } },
			{ area: { ellipse: [46, -94, 34, 8, -4] }, value: 1, soft: 7, edge: { amp: 3.5, scale: 10 } },
			{ area: { ellipse: [-22, -72, 16, 6, 0] }, value: 0.85, soft: 6, edge: { amp: 3, scale: 8 } },
			{ area: { ellipse: [60, -76, 24, 8, -12] }, value: 0.9, soft: 7, edge: { amp: 3, scale: 9 } },
			{ area: { ellipse: [-80, -88, 18, 9, 8] }, value: 0.85, soft: 7, edge: { amp: 3, scale: 9 } },
			// beyond the bounds (the apron): the flanks go on red
			{ area: { ellipse: [-140, -50, 40, 50, 0] }, value: 0.9, soft: 12, edge: { amp: 6, scale: 16 } },
			{ area: { ellipse: [140, -40, 40, 50, 0] }, value: 0.9, soft: 12, edge: { amp: 6, scale: 16 } },
			{ area: { ellipse: [-130, 40, 34, 30, 0] }, value: 0.8, soft: 12, edge: { amp: 6, scale: 16 } },
			{ area: { ellipse: [130, 50, 34, 30, 0] }, value: 0.8, soft: 12, edge: { amp: 6, scale: 16 } },
			{ area: { ellipse: [-120, -125, 30, 20, 0] }, value: 0.8, soft: 10, edge: { amp: 5, scale: 14 } },
			{ area: { ellipse: [120, -125, 30, 20, 0] }, value: 0.8, soft: 10, edge: { amp: 5, scale: 14 } },
		],
		rank: [
			{ area: { rect: [-100, 92, 100, 106] }, value: 1, soft: 6, edge: { amp: 2, scale: 6 } }, // the shore band (rank grass, reeds beyond)
			{ area: { circle: [FARM.x - 8, FARM.z - 6, 9] }, value: 0.9, soft: 4 }, // nettles behind the farmhouse
		],
	},
	smoke: {
		color: '#b9a88f', opacity: 0.055, wallOpacity: 0.16, height: 2.6, wind: [1, -0.15],
		zones: [
			{ id: 'Z1', label: 'Khói ngủ Z1 (ruộng giữa, tây)', x: -21, z: -28.5, rx: 8, rz: 5, rot: 0, height: 2.8, drift: 6.5, period: 76, phase: 0, lane: 'reach' },
			{ id: 'Z2', label: 'Khói ngủ Z2 (ruộng giữa)', x: 2, z: -47, rx: 8, rz: 5.5, rot: -15, height: 2.6, drift: 9, period: 92, phase: 0.37, lane: 'reach' },
			{ id: 'Z3', label: 'Khói ngủ Z3 (lối đông, cổng G3)', x: 38, z: -36, rx: 7, rz: 8, rot: 10, height: 3.0, drift: 7, period: 64, phase: 0.62, lane: 'eastTrack' },
			{ id: 'Z4', label: 'Khói ngủ Z4 (ruộng dưới, xe bò)', x: -14, z: 76, rx: 9, rz: 5.5, rot: -25, height: 2.3, drift: 9, period: 100, phase: 0.15, lane: 'reach' },
			{ id: 'Z5', label: 'Khói ngủ Z5 (ruộng trên, đường chính / lối cây gai)', x: -8, z: -90, rx: 8, rz: 5, rot: 5, height: 2.4, drift: 9, period: 84, phase: 0.8, lane: 'reach' },
		],
	},
	lights: [
		{ id: 'ghWindow', kind: 'perfection', label: 'The hospice window (warm, still: the act image)', x: WIN.x, z: WIN.z + 0.3, yAbs: WIN.y, color: '#f6b468', intensity: 9, range: 14, flicker: 0, real: true, glow: 3.2, flag: 'gentleHouse' },
		{ id: 'nicheReal', kind: 'perfection', label: 'Niche candles by the steps (still)', x: NICHES.find(([x]) => x < 0 && x > -8)?.[0] ?? -5, z: WALL_Z + 0.8, yOn: { asset: 'A18.5', ly: 1.5 }, color: '#f2c27a', intensity: 2.2, range: 6, flicker: 0, real: true, glow: 0 },
		...NICHES.map(([x, z], i) => ({ id: `niche${i + 1}`, kind: 'perfection', label: 'Niche candle (still)', x, z, yOn: { asset: 'A18.5', ly: 1.5 }, color: '#f2c27a', intensity: 0, range: 0, flicker: 0, real: false, glow: 0.3 })),
	],
	markers: [
		// encounters
		{ kind: 'encounter', id: 'E1', x: 2, z: 76, r: 7, segment: 'landing', label: 'E1 · W03 ×4 (Hush-Wolf pack)', monsters: [{ id: 'W03', count: 4, standIn: 'spider' }], note: 'the first fight past the gate, by the ox cart' },
		{ kind: 'encounter', id: 'E2', x: 54, z: 66, r: 6, segment: 'landing', label: 'E2 · P04 ×2 + P03 ×6', monsters: [{ id: 'P04', count: 2, standIn: 'zombie' }, { id: 'P03', count: 6, standIn: 'bat' }], note: 'Hive-Sleepers among the ricks burst into Hush-Moths' },
		{ kind: 'encounter', id: 'E3', x: -16, z: 19, r: 5, segment: 'farm', label: 'E3 · F02 ×1 + W03 ×3', monsters: [{ id: 'F02', count: 1, standIn: 'imp_shaman', single: true }, { id: 'W03', count: 3, standIn: 'spider' }], note: 'the Poppy Nurse sings and heals the wolves (she must not look evil)' },
		{ kind: 'encounter', id: 'E4', x: -4, z: -36, r: 7, segment: 'middle', label: 'E4 · P02 ×1 + P03 ×5 (in the smoke)', monsters: [{ id: 'P02', count: 1, standIn: 'wraith', single: true }, { id: 'P03', count: 5, standIn: 'bat' }], note: 'the Hush-Herald\'s censer feeds the smoke banks' },
		{ kind: 'encounter', id: 'E5', x: 28, z: -34, r: 6, segment: 'east', label: 'E5 · W03 ×4 + F02 ×1', monsters: [{ id: 'W03', count: 4, standIn: 'spider' }, { id: 'F02', count: 1, standIn: 'imp_shaman', single: true }] },
		{ kind: 'encounter', id: 'E6', x: 62, z: -40, r: 5, segment: 'mine', label: 'E6 · P04 ×2 + P03 ×4 (the Delvings path)', monsters: [{ id: 'P04', count: 2, standIn: 'zombie' }, { id: 'P03', count: 4, standIn: 'bat' }] },
		{ kind: 'encounter', id: 'E7', x: -30, z: -92, r: 7, segment: 'top', label: 'E7 · W03 ×5', monsters: [{ id: 'W03', count: 5, standIn: 'spider' }], note: 'the pack hunts the upper field by scent' },
		{ kind: 'encounter', id: 'E8', x: 8, z: -94, r: 6, segment: 'top', label: 'E8 · P02 ×1 + F02 ×1 + P03 ×6 (below the steps)', monsters: [{ id: 'P02', count: 1, standIn: 'wraith', single: true }, { id: 'F02', count: 1, standIn: 'imp_shaman', single: true }, { id: 'P03', count: 6, standIn: 'bat' }], note: 'the sweet last trap under the warm window' },
		// rite sites (each a different small scene)
		{ kind: 'rite', id: 'R1', x: -52, z: 68, label: 'Rite 1 · ruộng gặt bỏ dở (lõm hình người trong hoa)', note: 'sheaves, a scythe, a straw hat; a body-shaped hollow pressed into the poppies' },
		{ kind: 'rite', id: 'R2', x: -33.7, z: 23.9, label: 'Rite 2 · mộ đá người phơi hoa (dưới giá phơi)', note: 'a cairn with ribbons and a name slate under the drying rack' },
		{ kind: 'rite', id: 'R3', x: 61.5, z: 7.2, label: 'Rite 3 · chuồng cừu bỏ trống (gậy + áo gấp)', note: 'a round drystone fold, the gate gap open, the crook leaning, a coat folded' },
		{ kind: 'rite', id: 'R4', x: -43, z: -80.5, label: 'Rite 4 · cây táo gai buộc ruy băng (đôi giày)', note: 'a lone wind-bent thorn; ribbons; a sleeper\'s shoes left beneath' },
		// landmarks + sightlines (the warm window from the foot, the farm, the mine, the thorn)
		{ kind: 'landmark', id: 'L1', x: WIN.x, z: WIN.z, label: 'Cửa sổ ấm Gentle House (A18.4) — đích của act' },
		{ kind: 'landmark', id: 'L2', x: -43, z: -80.5, label: 'Cây táo gai ruy băng' },
		{ kind: 'landmark', id: 'L3', x: FARM.x, z: FARM.z, label: 'Nhà trại mái sập' },
		{ kind: 'landmark', id: 'L4', x: MINE.x, z: MINE.z, label: 'Miệng mỏ Flint Delvings' },
		{ kind: 'sightline', id: 'S1', from: [-24, 86, 1.7], target: [WIN.x, WIN.y, WIN.z], label: 'Chân dốc → cửa sổ ấm trên đỉnh' },
		{ kind: 'sightline', id: 'S2', from: [-36, 12.5, 1.7], target: [WIN.x, WIN.y, WIN.z], label: 'Sân trại → cửa sổ ấm' },
		{ kind: 'sightline', id: 'S3', from: [71.5, -34.5, 1.7], target: [WIN.x, WIN.y, WIN.z], label: 'Miệng mỏ → cửa sổ ấm' },
		{ kind: 'sightline', id: 'S4', from: [-40, -79, 1.7], target: [WIN.x, WIN.y, WIN.z], label: 'Cây gai → cửa sổ ấm' },
		// vignettes (two unmarked) and the Remember beat
		{ kind: 'vignette', id: 'V1', x: INSIDE[0], z: INSIDE[1], label: 'Nhà trại: giường trống, mỗi giường một gối sạch' },
		{ kind: 'vignette', id: 'V2', x: 19, z: 70, label: 'Xe bò bỏ lại còn chăn đệm và một chiếc gối sạch' },
		{ kind: 'vignette', id: 'V3', x: 34, z: -91, unmarked: true, label: 'Chiếc giường kéo ra giữa đồng anh túc (không đánh dấu)' },
		{ kind: 'vignette', id: 'V4', x: -28.1, z: -12.35, unmarked: true, label: 'Búp bê rơm trên bậc stile (không đánh dấu)' },
		{ kind: 'vignette', id: 'V5', x: -24, z: 86, remember: true, label: 'REMEMBER: anh túc đỏ tới chân trời, cửa sổ ấm trên đỉnh dốc' },
		// sleep smoke: the mechanic marker (the volumes themselves are plan.smoke)
		{ kind: 'vignette', id: 'K1', x: -16, z: -28, label: 'Khói ngủ: đứng trong → chậm dần → ngủ thiếp (đề xuất LD)' },
		// exits
		{ kind: 'exit', id: 'X1', x: -26.8, z: 126.5, label: '← Rook\'s Weir (11.5) · đê', to: 'fens' },
		{ kind: 'exit', id: 'X2', x: 74.2, z: -34.5, label: '→ The Flint Delvings (11.8, BIO-06)', to: 'flintDelvings' },
		{ kind: 'exit', id: 'X3', x: 0, z: -108.6, label: '→ The Gentle House (11.9) · cổng', to: 'gentleHouse' },
		// the open / choke rhythm along the Reach road
		{ kind: 'beat', id: 'B1', x: W1.gate.x, z: W1.gate.z, beat: 'choke', label: 'Cổng G1 (vào Reach)' },
		{ kind: 'beat', id: 'B2', x: 8, z: 72, beat: 'open', label: 'Ruộng dưới · anh túc tới chân trời' },
		{ kind: 'beat', id: 'B3', x: 10, z: 29.6, beat: 'choke', label: 'Hẻm tường đá (G2 → trại)' },
		{ kind: 'beat', id: 'B4', x: -30, z: 8, beat: 'open', label: 'Sân trại bỏ hoang' },
		{ kind: 'beat', id: 'B5', x: W3.stile.x, z: W3.stile.z, beat: 'choke', label: 'Stile S1' },
		{ kind: 'beat', id: 'B6', x: -4, z: -36, beat: 'open', label: 'Ruộng giữa · khói ngủ trôi ngang lối' },
		{ kind: 'beat', id: 'B7', x: 14, z: -72, beat: 'choke', label: 'Cổng G4 + hẻm trên' },
		{ kind: 'beat', id: 'B8', x: 4, z: -88, beat: 'open', label: 'Ruộng trên dưới chân hospice' },
		{ kind: 'beat', id: 'B9', x: 0, z: -103.6, beat: 'choke', label: 'Bậc lên đồi A18.6' },
	],
	segments: [
		{
			id: 'landing', kind: 'wild', label: 'Chân dốc · bến đê từ Rook\'s Weir', spawn: [-21.5, 100], view: 'landing',
			route: [[-24.6, 114], [-23.3, 108], [-22, 103], [-21.5, 100], [-20.2, 97.5], [W1.gate.x, W1.gate.z], [-15.5, 88], [-30, 81], [-44, 73], [-49.5, 70.2], [-44, 73], [-30, 81], [-15.5, 88], [-4, 79], [12, 69.5], [26, 61], [33.5, 53.5], [W2.gate.x, W2.gate.z + 0.3], [33, 41.5], [30, 39]],
		},
		{
			id: 'farm', kind: 'wild', label: 'Hẻm tường đá · nhà trại', spawn: [2, 27.5], view: 'farmyard',
			route: [[2, 27.5], [-12, 20.5], [-24, 14], [-33, 15.5], [-40, 15.5], DOOR_OUT, DOOR_IN, INSIDE, DOOR_IN, DOOR_OUT, [-40, 15.5], [-33, 15.5], [-29.5, 6.5], [-30, -3], [-28.6, -11.5], [-27.6, -15.5], [-20, -24]],
		},
		{
			id: 'middle', kind: 'wild', label: 'Ruộng giữa · khói ngủ', spawn: [-8, -34], view: 'smoke',
			route: [[-8, -34], [-20, -24], [-27.6, -15.5], [-20, -24], [-6, -35], [8, -45], [15.5, -54], [18, -60], [W4.gate.x, W4.gate.z - 0.3], LANE_B.from, LANE_B.to],
		},
		{
			id: 'east', kind: 'wild', label: 'Lối đông · chuồng cừu (cổng G3)', spawn: [45.2, -24], view: 'fold',
			route: [[45.2, -24], [W3.gate.x, W3.gate.z], [44.8, -8], [45.5, 2], [52, 6], [57.2, 6], [60.5, 6], [57.2, 6], [52, 6], [45.5, 2], [45, 18], [40, 33], [33, 41.5]],
		},
		{
			id: 'mine', kind: 'wild', label: 'Miệng mỏ Flint Delvings', spawn: [62, -36], view: 'mine',
			route: [[62, -36], [65, -33.5], [71.5, -34.5], [74.2, -34.5], [71.5, -34.5], [65, -33.5], [55, -30.5], [45.5, -27], [40, -41], [28, -51.5], [17, -57.5]], // to the face of the A18.3 GLB (its portal is painted: the exit is the trigger there)
		},
		{
			id: 'top', kind: 'wild', label: 'Ruộng trên · bậc lên Gentle House', spawn: [4, -90], view: 'steps',
			route: [[4, -90], [2, -95], [0, -99], [0, -101.5], [0, -104], [0, -106.5], [0, -109.5], [0, -106.5], [0, -101.5], [2, -95], [5.5, -88], [-8, -87], [-24, -84.5], [-38, -81.5], [-24, -84.5], [-8, -87], [5.5, -88], [20, -90], [31.5, -90.5]],
		},
	],
	views: {
		overview: { label: 'Toàn cảnh (base map)', target: [0, -2], fit: [200, 256] },
		remember: { label: 'REMEMBER · từ chân dốc: anh túc tới chân trời, cửa sổ ấm trên đỉnh', eye: [-24, 0, 86], eyeLift: 2.6, look: [WIN.x, WIN.y - 9, WIN.z], fov: 30 },
		landing: { label: 'Bến đê từ Rook\'s Weir · cổng ruộng G1', target: [-18, 97], dist: 34, pitch: 48 },
		lowerField: { label: 'Ruộng dưới (xe bò, sói, đống rơm)', target: [18, 68], dist: 62, pitch: 52 },
		oxcart: { label: 'Xe bò bỏ lại còn chăn đệm (vignette)', target: [19, 70], dist: 13, pitch: 42, lift: 0.8 },
		lane: { label: 'Hẻm tường đá (G2 → trại) · Poppy Nurse', target: [8, 28], dist: 40, pitch: 55 },
		farmhouse: { label: 'Nhà trại: giường trống, mỗi giường một gối sạch', target: [FARM.x + 0.6, FARM.z - 0.5], dist: 17, pitch: 64, lift: 1 },
		farmyard: { label: 'Sân trại (giá phơi anh túc, rite 2)', target: [-38, 12], dist: 34, pitch: 50 },
		smoke: { label: 'Ruộng giữa · khói ngủ trôi ngang lối (Hush-Herald)', target: [4, -38], dist: 70, pitch: 55 },
		fold: { label: 'Chuồng cừu bỏ trống (rite 3)', target: [60, 5], dist: 20, pitch: 50 },
		mine: { label: 'Miệng mỏ Flint Delvings (lối phụ, BIO-06)', target: [75, -34.5], dist: 22, pitch: 38, yaw: -62, lift: 1.5 },
		thorn: { label: 'Cây táo gai buộc ruy băng (rite 4)', target: [-43, -80.5], dist: 22, pitch: 45, lift: 1.5 },
		upper: { label: 'Ruộng trên · hẻm G4 · lối lên hospice', target: [4, -84], dist: 60, pitch: 52 },
		bed: { label: 'Chiếc giường giữa đồng anh túc (vignette không đánh dấu)', target: [34, -91], dist: 12, pitch: 48, lift: 0.5 },
		steps: { label: 'Bậc lên đồi A18.6 · tường vôi A18.5 · dãy ward A18.4', target: [0, -106], dist: 34, pitch: 30, lift: 3 },
		lookBack: { label: 'Từ sân hospice nhìn xuống cả Reach', eye: [14, 0, -110], eyeLift: 5, look: [-6, 0, 20] },
	},
	far: {
		level: FEN,
		size: 2400,
		hills: [],
		items: [],
		apron: { width: 360, blend: 70, sink: 2.0, hills: [HILL] },
	},
	defaultMood: 'day',
	// Play moods brightened 10-23 (hemi, sun intensity, envI, exposure); the old values are in tmp/act1-base-maps/BRIGHTNESS.md.
	moods: {
		day: {
			label: 'Poppy Reach · ngày u ám', sky: '#b2b9ae', ground: '#4d4232', hemi: 2.6, sun: { elev: 66, az: -160, intensity: 0.36, kelvin: 6600 }, env: 'hdri-overcast', envI: 0.48,
			toneMapping: 'aces', exposure: 0.8, background: '#9ba398',
			fog: { enabled: true, color: '#a2a99f', density: 0.0072, falloff: 0.075, height: 0, start: 20, inscatter: 0 },
			grade: { vignette: 0.28, contrast: 1.06, saturation: 0.96, lift: 0, temperature: 0.005, tint: 0 },
			rain: 0, mist: 0.35, human: 0.7, perfection: 1, windows: 0.5, flags: { accent: true, gentleHouse: true },
		},
		lookdev: {
			label: 'Soi texture · sáng đều', sky: '#c9d4e4', ground: '#3b352e', hemi: 2.4, sun: { elev: 50, az: -135, intensity: 1.1, kelvin: 5600 }, env: 'hdri-overcast', envI: 0.25,
			toneMapping: 'aces', exposure: 0.2, background: '#30353a',
			fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 },
			rain: 0, mist: 0, human: 0.5, perfection: 1, windows: 0.4, flags: { accent: true, gentleHouse: true },
		},
	},
	notes: {
		reach: 'Poppy Reach (11.6, wild, 28 phút, D3 C3, BIO-02): ngày u ám mềm (không nắng, trời phủ mây), anh túc đỏ tới chân trời trong cỏ xám-xanh — accent mạnh nhất của act; leo dần từ bến đê (Rook\'s Weir, nước đen dưới chân) lên đỉnh đồi Gentle House. Tường đá khô làm lối (cổng ruộng giữa hai trụ đá, stile, hẻm tường), nhà trại bỏ hoang mái sập một nửa (ba giường trống, mỗi giường một gối sạch), đống rơm, giá phơi anh túc, xe bò bỏ lại còn chăn đệm, miệng mỏ Flint Delvings trên gò phấn phía đông. Trên đỉnh: bậc lên đồi, tường vôi có hốc nến đứng yên, dãy ward với một cửa sổ ấm đứng yên (ảnh của act).',
		smoke: 'Khói ngủ là địa hình (đề xuất LD): 5 vùng có viền rõ, tint ấm nhẹ, thở qua lại theo gió và đóng / mở lối (Z1, Z2 trên đường chính ở ruộng giữa, Z3 trên lối đông, Z4 ở ruộng dưới, Z5 trên đoạn cuối đường chính và lối cây gai). Đứng trong khói → chậm dần → ngủ thiếp (base map: chỉ đánh dấu). Bật/tắt, tốc độ trôi và nhãn ở mục "Khói ngủ".',
		beats: 'Nhịp mở / hẹp dọc đường chính: cổng G1 → ruộng dưới (mở) → hẻm tường đá (hẹp) → sân trại (mở nhỏ) → stile S1 (hẹp) → ruộng giữa có khói (mở) → cổng G4 + hẻm trên (hẹp) → ruộng trên (mở) → bậc lên đồi (hẹp). Lát cắt nén nhịp còn 10–20 s mỗi đoạn; bản đầy đủ đề xuất 40–60 s (xem target).',
	},
};

export const ASSETS = withCounts(PLAN);

export const MONSTERS = [
	{ id: 'P02', name: 'Hush-Herald', segment: 'middle', count: 2, note: 'E4 (in the smoke), E8 (below the steps) · tall veiled censer-bearer h 1.15–1.30 H: breathes a sleep cloud (slow, drowsy), strengthens nearby Soothed · stand-in `wraith` (single, named)' },
	{ id: 'F02', name: 'Poppy Nurse', segment: 'farm', count: 3, note: 'E3, E5, E8 · caster + healer h 0.95–1.05 H, white wimple embroidered with poppies, a long silver needle; sings and heals the pack — must NOT look evil · stand-in `imp_shaman` (single, named)' },
	{ id: 'P03', name: 'Hush-Moths', segment: 'all', count: 21, note: 'E2 ×6, E4 ×5, E6 ×4, E8 ×6 · pale soft moths in swarms (wing dust: slow) · stand-in `bat`' },
	{ id: 'P04', name: 'Hive-Sleeper', segment: 'landing', count: 4, note: 'E2 ×2, E6 ×2 · bloated crawler L 1.4–1.7 H, bursts into Hush-Moths (larvae reduction option, LD §8.4) · stand-in `zombie`' },
	{ id: 'W03', name: 'Hush-Wolf', segment: 'all', count: 16, note: 'E1 ×4, E3 ×3, E5 ×4, E7 ×5 · gaunt half-man wolf, eyes shut, hunts by scent in packs; its howl is the lullaby · stand-in `spider` (fast pack beast)' },
];

export const NPCS = [];

export const TEXTURES = [
	{ id: 'BIO02_meadow', have: true, note: 'the meadow base everywhere (and on the apron beyond the bounds); stand-in for the poppy meadow soil' },
	{ id: 'DW_sparse (darkwood grass-sparse)', have: true, note: 'lane verges, the thin upper slope, the approach' },
	{ id: 'DW_dense (darkwood grass-dense)', have: true, note: 'rank grass at wall feet, the shore band, field patches' },
	{ id: 'DW_dirt (darkwood dirt)', have: true, note: 'lanes and tracks, the farmyard, the approach' },
	{ id: 'BIO03_flint', have: true, note: 'the farmyard cobbles, gate and stile thresholds' },
	{ id: 'BIO06_flint_spoil', have: true, note: 'chalk-and-flint spoil at the Flint Delvings mouth' },
	{ id: 'BIO05_lime', have: true, note: 'the hospice terrace (clean lime)' },
	{ id: 'DW_mud (darkwood mud)', have: true, note: 'the fen shore, the causeway' },
	{ id: 'biome-darkwood-water-n', have: true, note: 'fen ripple normal' },
	{ id: 'biome-darkwood-grass-cards · biome-shore-plants', have: true, note: 'meadow tufts, reeds, sedge' },
	{ id: 'poppy meadow soil (A05 cell 4)', have: false, note: 'concept only; BIO02_meadow + the instanced clumps stand in' },
	{ id: 'poppy clump card atlas (side + top views, petals)', have: false, note: 'the field is procedural vertex-coloured clumps; a painted atlas would carry it at distance and up close' },
	{ id: 'drystone wall (grey stone, moss, through-stones)', have: false, note: 'walls are flat blockout colour' },
	{ id: 'whitewash (seamless, no patch) + clean slate roof', have: false, note: 'the ward range, the boundary wall, the steps' },
	{ id: 'chalk-and-flint cut face', have: false, note: 'the mine mouth (A18.3)' },
	{ id: 'hay / straw, old slate and thatch (farm)', have: false, note: 'ricks, the farmhouse roof' },
	{ id: 'Mercy linen (clean pillow) + patched bedding', have: false, note: 'beds, the ox cart bedding' },
];

export const VFX = [
	{ id: 'sleep smoke as terrain (drifting banks that close / open lanes)', have: false, note: 'placeholder: 5 zones of stacked soft-rimmed slices + a curtain, slightly warm, breathing along the wind (toggle + speed + labels); needs the real volume shader and the slow → sleep gameplay' },
	{ id: 'poppy and grass sway', have: true, note: 'the lab wind effect on the instanced clumps and tufts (GPU), foot bend near the hero; petal flutter not built' },
	{ id: 'Perfection light: the hospice window + a row of still niche candles', have: false, note: 'placeholder: still glow sprites + 2 still point lights; the window pane is a warm blockout panel' },
	{ id: 'low mist over the fen at the foot', have: false, note: 'placeholder: drifting soft sheets (mist slider) + the post height fog' },
	{ id: 'Hush-Herald censer cloud (feeds the smoke)', have: false, note: 'not built' },
	{ id: 'Hush-Moth swarms over the field', have: false, note: 'not built (monster stand-ins only)' },
	{ id: 'Poppy Nurse song and heal pulse', have: false, note: 'not built' },
	{ id: 'Hive-Sleeper burst', have: false, note: 'not built' },
	{ id: 'drifting petals; after Act I the flowers droop and fall (LD §11.13 proposal)', have: false, note: 'not built' },
	{ id: 'Discarded kiln breath deep in the Flint Delvings mouth', have: false, note: 'not built (the entrance is a dark recess)' },
];

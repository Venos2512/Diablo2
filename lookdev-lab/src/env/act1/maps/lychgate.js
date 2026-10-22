// ASHLAR · Act I · base map 1 `lychgate`: Lychgate hub (LD 11.2) → Churchyard, *Grave Matters* (LD 11.3), BIO-03 (spec tmp/act1-base-maps/SPEC.md §3 map 1).
// One terrain, 216 × 160 m, an island of peat and the only dry hill in black fen water. The village hub sits low on wet peat round a small square and a
// mere (stilt cottages, raised timber walkways over the water, patched flint walls, willow hurdles, the well, eel-trap racks, Brannoc's forge glow, the
// sleeper name board, the mourning bell, Nell's stall, Osric's watch post). The roofed LYCHGATE with its lamp is the hub's one light threshold: the
// churchyard behind it is wild and climbs the hill — low graves, five unquiet graves (rite sites, each a different small scene), mortsafes, the tarred
// gibbet with crows, yews only at the edges, the faceless saint on the path, the flint church; the round ossuary tower stands on the dry summit, with the
// Barrow family vault door in the terrace wall below it (hub side, where the children count skulls in the rain). The dike road leaves west toward the
// Night Fens; far across the black water the Gentle House (N-GH) keeps its warm, still window on a hill.
// Plain data + the §6b exports. Format: env/act1/outdoor.js (header). Sizes: concept sheets (H = 1.8 m) — A01 / A02 (ashlar/art/act-01-environments,
// E03 / E04 kits), A15 / A16 (tmp/act1-base-maps/MISSING_ENV_CONCEPTS.md, v2 batch); `N…` = LD only.
import { withCounts } from '../outdoor.js';
import { GENTLE_HOUSE_FAR } from '../gentleHouseFar.js';

const DEG = Math.PI / 180;
/** World [x, z] of a local offset (lx, lz) of a placement { x, z, yaw (deg) } (front = local +z). */
const at = (p, lx, lz) => [+(p.x + lx * Math.cos(p.yaw * DEG) + lz * Math.sin(p.yaw * DEG)).toFixed(3), +(p.z - lx * Math.sin(p.yaw * DEG) + lz * Math.cos(p.yaw * DEG)).toFixed(3)];
/** The placement that puts the model point (ox, oz) of a GLB (its frame) on (x, z): a gibbet's or a lamp's post off the model's pivot (ACT1_EXTRAS_FIT.md). */
const onPoint = (p, ox, oz) => {
	const [x, z] = at(p, -ox, -oz);
	return { ...p, x, z };
};
/** A human light on a model feature: GLB-frame point (lx, ly, lz) of a placement (y above the ground there). */
const onModel = (p, [lx, ly, lz], light) => {
	const [x, z] = at(p, lx, lz);
	return { ...light, x, z, y: ly };
};

const FEN = 0.0; // the fen's water level (black water round the island)
const MERE = 0.16; // the village mere (inner pond)
const DECK = 0.66; // walkway deck tops over the mere

// ---- asset defs (the §6b ASSETS rows; count is filled by withCounts) ----------------------------------------------------------------------------
const A = (id, name, category, size, status, source, segment, extra = {}) => ({ id, name, category, size, status, source, segment, note: '', ...extra });
const DEFS = [
	// hub (A01 village kit, A15 extras)
	A('A01.1', 'Repaired thatched stilt cottage', 'building', [4.6, 5.2, 4.0], 'blockout', 'concept A01 cell 1 (E03 village kit)', 'hub', { shape: 'stilt-cottage', note: 'body 4.6 × 4.0 m on 0.7 m stilts, ridge 5.2 m (sheet ≈ 3.4–5.3 m tall); amber window, a poppy sprig on the door' }),
	A('A01.2', 'Raised wooden walkway segment', 'structure', [4.0, 1.2, 1.4], 'blockout', 'concept A01 cell 2 (E03 village kit)', 'hub', { shape: 'deck', note: 'built per deck segment from the walkway paths (deck mesh = walk surface); 4 m pieces, posts every corner' }),
	A('A01.3', 'Patched low flint wall', 'structure', [3.4, 1.4, 0.7], 'blockout', 'concept A01 cell 3 (E03 village kit)', 'both', { shape: 'wall', note: 'module 3.4 m; the churchyard boundary (the lychgate is its only gap) and the village west wall' }),
	A('A01.4', 'Willow hurdle fence', 'structure', [3.2, 1.4, 0.18], 'blockout', 'concept A01 cell 4 (E03 village kit)', 'hub', { shape: 'fence' }),
	A('A01.5', 'Village well', 'structure', [2.2, 3.4, 2.0], 'blockout', 'concept A01 cell 5 (E03 village kit)', 'hub', { shape: 'well' }),
	A('A01.6', 'Eel-trap fishing rack', 'structure', [3.96, 1.8, 1.38], 'kit', 'concept A01 cell 6 (E03 village kit)', 'hub', { model: 'kit:crafts.fishing_net', fit: 'native', shape: 'rack', note: 'kit tạm (camp fishing net between poles, native 3.96 × 1.8 × 1.38 m; concept rack 3.4 × 3.0 × 1.6): same class of object, lower; REUSE_CANDIDATES.md' }),
	A('A15.2', "Brannoc's forge (the Mortsmith's smithy)", 'building', [6, 4.05, 4.1], 'glb', 'concept A15 cell 2 (v2 batch)', 'hub', { model: 'act1-a15-2-forge', fit: 'native', shape: 'forge', note: 'GLB 6 × 4.05 × 4.1 m; its −x and −z sides are a plain panel (single-image guess): turned yaw −45 so both face away from the game camera, the open front to the square; hearth glow = a real human light (1/f flicker) on the model hearth' }),
	A('A15.3', 'Sleeper name board', 'story', [2.6, 2.31, 1.24], 'glb', 'concept A15 cell 3 (v2 batch)', 'hub', { model: 'act1-a15-3-name-board', fit: 'native', shape: 'board', blockers: [[0, 0, 2.6, 0.45]], note: 'GLB 2.6 × 2.31 × 1.24 m (roof overhang, garlands); plain back: faces the square and the camera (yaw 0), the back to the lane side; blocks along the board' }),
	A('A15.4', 'Mourning bell frame', 'structure', [3.14, 3.4, 1.98], 'glb', 'concept A15 cell 4 (v2 batch)', 'hub', { model: 'act1-a15-4-bell-frame', fit: 'native', shape: 'bellframe', note: 'GLB 3.14 × 3.4 × 1.98 m (stone plinths, braces, leaning planks: chunkier than the 2.2 m concept)' }),
	A('A15.5', "Nell Coppercoin's grave-goods stall", 'prop', [4.01, 2.3, 1.93], 'glb', 'concept A15 cell 5 (v2 batch)', 'hub', { model: 'act1-a15-5-grave-goods-stall', fit: 'native', shape: 'stall', note: 'GLB 4.0 × 2.3 × 1.93 m with the cart shafts (awning 3 m, centred on the placement point); plain back (−z) turned away from the camera' }),
	A('A15.6', "Osric's watch post", 'structure', [3, 3.89, 3.46], 'glb', 'concept A15 cell 6 (v2 batch)', 'hub', { model: 'act1-a15-6-watch-post', fit: 'native', shape: 'watchpost', note: 'GLB 3 × 3.89 × 3.46 m; deck at 1.65 m (not walkable in the base map), fire basket = human light on the model basket' }),
	A('N01', 'Barrow family vault door (portal in the terrace wall)', 'story', [2.4, 2.8, 0.8], 'blockout', 'LD only, no concept', 'hub', { shape: 'vaultdoor', note: 'side quest One for the Footing; under the ossuary, faces the village' }),
	A('N02', 'Flint retaining wall (vault terrace)', 'structure', [4, 3.2, 0.9], 'blockout', 'LD only, no concept', 'hub', { shape: 'wall', note: 'keeps the hub terrace from the summit: the lychgate stays the only way into the churchyard' }),
	A('N03', 'Rain barrel', 'prop', [0.8, 1.0, 0.8], 'kit', 'LD only, no concept', 'hub', { model: 'kit:kitchen.water_barrel', fit: 'native', note: 'kit tạm: camp kitchen water barrel (2.1 m wide piece)' }),
	A('N04', 'Peat stack', 'prop', [1.6, 1.1, 1.0], 'blockout', 'LD only, no concept', 'hub', { shape: 'peatstack' }),
	A('N05', 'Poppy sprig on a door (the Act I accent)', 'prop', [0.25, 0.4, 0.08], 'procedural', 'LD only, no concept', 'hub', { procedural: 'poppy', note: 'the only accent of the hub; hidden in the Prologue night (no accent)', collide: false }),
	A('N06', 'Washing line', 'prop', [4.1, 2.1, 0.85], 'kit', 'LD only, no concept', 'hub', { model: 'kit:crafts.laundry_line', fit: 'native', collide: false, note: 'kit tạm' }),
	A('N07', 'Drying fish net', 'prop', [4, 1.8, 1.4], 'kit', 'LD only, no concept', 'hub', { model: 'kit:crafts.fishing_net', fit: 'native', collide: false, note: 'kit tạm' }),
	A('N08', 'Village goods (sacks, crates)', 'prop', [1.9, 1.3, 1.8], 'kit', 'LD only, no concept', 'hub', { model: 'kit:storage.sacks', fit: 'native', note: 'kit tạm' }),
	A('N12', 'Peat barrow', 'prop', [1.2, 1.0, 2.4], 'kit', 'LD only, no concept', 'hub', { model: 'kit:animals.wheelbarrow', fit: 'native', collide: false, note: 'kit tạm (camp wheelbarrow)' }),
	A('N09', 'Low shrubs / brambles at the edges', 'vegetation', [1.2, 0.5, 1.1], 'kit', 'LD only, no concept', 'both', { model: 'kit:shrubs.shrub_05', fit: 'native', collide: false, note: 'kit tạm (Blood-Moor shrub)' }),
	A('A04.2', 'Young willow', 'vegetation', [4, 6, 4], 'blockout', 'concept A04 cell 2 (E02 willow kit)', 'hub', { shape: { kind: 'tree', crown: 'weeping' }, note: 'at the mere and fen edge' }),
	A('A03.1', 'Low grass clump', 'vegetation', [0.6, 0.5, 0.6], 'procedural', 'concept A03 cell 1 (E01 fen kit)', 'both', { procedural: 'grass', collide: false, note: 'Dark Wood grass cards on the grass layers' }),
	A('A03.2', 'Tall reeds clump', 'vegetation', [0.8, 1.8, 0.8], 'procedural', 'concept A03 cell 2 (E01 fen kit)', 'both', { procedural: 'reeds', collide: false, note: 'shore-plant cards (biome-shore-plants) along the fen and the mere' }),
	A('A03.3', 'Sedge water clump', 'vegetation', [0.7, 0.9, 0.7], 'procedural', 'concept A03 cell 3 (E01 fen kit)', 'both', { procedural: 'sedge', collide: false }),
	A('glb:biome-prop-stump', 'Mossy stump', 'vegetation', [0.8, 0.5, 0.8], 'glb', 'ashlar/3d/props/clutter_v1/mossy_stump', 'hub', { model: 'biome-prop-stump', fit: 'native' }),
	A('glb:biome-prop-riverbank-stones', 'Riverbank stones', 'rock', [1.0, 0.35, 1.0], 'glb', 'ashlar/3d/props/clutter_v1/riverbank_stones', 'both', { model: 'biome-prop-riverbank-stones', fit: 'native', collide: false }),
	A('glb:dungeon-prop-flint-boulders', 'Flint boulders', 'rock', [2.0, 1.0, 2.0], 'glb', 'ashlar/3d/props/dungeon_v1/flint_boulders', 'churchyard', { model: 'dungeon-prop-flint-boulders', fit: 'native', note: 'flint country: on the hill flanks' }),
	A('glb:dungeon-prop-bone-pile', 'Bone pile (skulls to count)', 'prop', [1.2, 0.6, 1.2], 'glb', 'ashlar/3d/props/dungeon_v1/bone_pile', 'hub', { model: 'dungeon-prop-bone-pile', fit: 'native', note: 'the children count skulls here, under the ossuary' }),
	A('glb:dungeon-prop-candle-cluster', 'Candle cluster', 'prop', [0.8, 0.8, 0.8], 'glb', 'ashlar/3d/props/dungeon_v1/candle_cluster', 'both', { model: 'dungeon-prop-candle-cluster', fit: 'native', collide: false }),
	A('glb:biome-prop-mushrooms', 'Mushroom cluster', 'vegetation', [0.4, 0.3, 0.4], 'glb', 'ashlar/3d/props/clutter_v1/mushroom_cluster', 'churchyard', { model: 'biome-prop-mushrooms', fit: 'native', collide: false }),
	// churchyard (A02 burial kit, A16 extras)
	A('A02.1', 'Lychgate roofed gate (with lamp)', 'structure', [3.4, 3.8, 2.6], 'blockout', 'concept A02 cell 1 (E04 burial kit)', 'both', { shape: 'lychgate', blockers: [[-1.43, -0.9, 0.62, 0.62], [1.43, -0.9, 0.62, 0.62], [-1.43, 0.9, 0.62, 0.62], [1.43, 0.9, 0.62, 0.62]], note: 'THE light threshold hub ↔ churchyard; passage 2.3 m between the flint plinths; lamp under the roof = human light' }),
	A('A02.2', 'Mortsafe grave cage', 'structure', [2.6, 1.2, 1.4], 'blockout', 'concept A02 cell 2 (E04 burial kit)', 'churchyard', { shape: 'mortsafe' }),
	A('A02.3', 'Small mismatched headstone cluster', 'rock', [3.0, 1.6, 2.0], 'blockout', 'concept A02 cell 3 (E04 burial kit)', 'churchyard', { shape: 'headstones' }),
	A('A02.4', 'Round ossuary tower', 'building', [4.8, 7.8, 4.8], 'blockout', 'concept A02 cell 4 (E04 burial kit)', 'churchyard', { shape: 'tower', note: 'landmark on the dry summit (sheet reads 4.6–9 m tall); door faces the church' }),
	A('A02.5', 'Faceless saint statue supporting an arch (the Nameless Saint)', 'story', [2.4, 4.3, 1.2], 'blockout', 'concept A02 cell 5 (E04 burial kit)', 'churchyard', { shape: 'statue', blockers: [[0, 0, 1.45, 1.2]], note: 'ON the path, faces down toward the lychgate (it turns only off-screen); the path parts round its plinth, both lanes under the ends of its arch (only the plinth blocks the hero)' }),
	A('A02.6', 'Funeral hand cart', 'prop', [2.48, 0.97, 1.25], 'kit', 'concept A02 cell 6 (E04 burial kit)', 'churchyard', { model: 'kit:animals.wheelbarrow', fit: 'native', shape: 'cart', note: 'kit tạm (camp wheelbarrow at ×1.2 = 3.0 × 1.16 × 1.5 m; concept hand cart 3.2 × 1.2 × 1.4): the nearest hand cart, worn wood' }),
	A('A15.1', 'Flint parish church', 'building', [16, 9.87, 10.69], 'glb', 'concept A15 cell 1 (v2 batch)', 'churchyard', { model: 'act1-a15-1-flint-church', fit: 'native', shape: 'church', note: 'GLB 16 × 9.87 × 10.69 m (walls ±3.6 m, buttresses to ±5.35 m: the collision box is the full 10.7 m depth); bell-cote 9.9 m on the west gable; door west (−x), down the slope to the lychgate' }),
	A('A16.1', 'Churchyard yew', 'vegetation', [9.44, 9.0, 8.22], 'glb', 'concept A16 cell 1 (v2 batch)', 'churchyard', { model: 'act1-a16-1-yew', fit: 'native', shape: { kind: 'tree', crown: 'yew' }, blockers: [[-0.3, -0.25, 4.4, 4.0]], note: 'GLB 9.4 × 9 × 8.2 m (crown about round); only at the edges; the trunk and its root flare block (4.4 × 4 m), the crown does not' }),
	A('A16.2', 'Tarred gibbet (empty cage)', 'structure', [4.69, 4.6, 2.69], 'glb', 'concept A16 cell 2 (v2 batch)', 'churchyard', { model: 'act1-a16-2-gibbet', fit: 'native', shape: 'gibbet', blockers: [[-0.93, -0.07, 1.2, 1.2]], note: 'GLB 4.7 × 4.6 × 2.7 m (base of stones and grass, arm 2.4 m); no body, no noose; the post (GLB (−0.91, −0.09)) stands on the placement point; only the post and its stones block; crows' }),
	A('A16.3', 'Grave with jar candles', 'story', [1.98, 0.93, 2.2], 'glb', 'concept A16 cell 3 (v2 batch)', 'churchyard', { model: 'act1-a16-3-jar-candle-grave', fit: 'native', shape: 'grave-jars', blockers: [[0, 0, 1.3, 2.0]], anchors: [[-0.26, 0.6, -0.31], [-0.49, 0.45, 0.16], [0.29, 0.39, 0.15]].map((p) => ({ kind: 'jar', p, n: [0, 1, 0], size: 0.07 })), note: 'GLB 2.0 × 0.93 × 2.2 m (jars and grass round the mound; the mound blocks); the model\'s jars are unlit with sooty rims, but the LD keeps them lit by day (Act I) and all out in the Prologue night: three small still-flicker glows sit in three of its jars (flag graveCandles)' }),
	A('A16.4', 'Fresh grave', 'story', [1.77, 0.82, 2.4], 'glb', 'concept A16 cell 4 (v2 batch)', 'churchyard', { model: 'act1-a16-4-fresh-grave', fit: 'native', shape: 'grave-fresh', note: 'GLB 1.77 × 0.82 × 2.4 m (planks and the rope coil on +x, the spade at the foot)' }),
	A('A16.5', 'Unquiet grave (risen, mortsafe bent outward)', 'story', [2.48, 1.15, 2.6], 'glb', 'concept A16 cell 5 (v2 batch)', 'churchyard', { model: 'act1-a16-5-unquiet-grave', fit: 'native', shape: 'grave-risen', note: 'GLB 2.5 × 1.15 × 2.6 m (stone kerb and spoil)' }),
	A('A16.6', "Sexton's lamp post (bowl of milk for the Kind Ones)", 'structure', [1.3, 2.6, 0.8], 'glb', 'concept A16 cell 6 (v2 batch)', 'churchyard', { model: 'act1-a16-6-sexton-lamp', fit: 'native', shape: 'lamppost', blockers: [[-0.29, -0.02, 0.5, 0.5]], note: 'GLB 1.3 × 2.6 × 0.8 m; the post (GLB (−0.29, −0.02)) stands on the placement point, only it blocks; the lamp glow sits on the model lantern (0.71 m out, 1.95 m up)' }),
	A('N10', 'Vigil chair with a folded blanket', 'prop', [0.6, 0.95, 0.6], 'blockout', 'LD only, no concept', 'churchyard', { shape: 'chair', note: 'unmarked vignette: someone still keeps watch at a small grave' }),
	A('N11', 'Crow (ambient; settles after the five rites)', 'story', [0.45, 0.35, 0.25], 'procedural', 'LD only, no concept', 'churchyard', { procedural: 'crow', collide: false }),
	A('A06.1', 'Fen causeway segment (dike revetment posts)', 'structure', [2.31, 0.9, 0.51], 'kit', 'concept A06 cell 1 (Night Fens kit)', 'fenroad', { model: 'kit:fence.run_broken', fit: 'native', shape: 'posts', note: 'kit tạm (Blood-Moor broken fence run, 2.31 m modules) as the dike revetment posts; the dike road out of the village toward the Night Fens' }),
	A('N-GH', 'The Gentle House, far silhouette (gate tower + long ward + high warm still window)', 'story', [46, 20, 30], 'glb', 'act1 GLBs A18.4 ward range + 11 × A18.5 wall-with-niche sections (env/act1/gentleHouseFar.js); A11.4 gate tower still a box', 'far', { ...GENTLE_HOUSE_FAR, shape: 'compound', collide: false, note: 'shared far silhouette of the outdoor maps: the A18.4 range\'s own lit window carries the brightest, stillest light of the act (glow in the VFX layer: it reads through the fog); A11.4 has no model yet (box); if a GLB fails the full compound blockout stands in' }),
];

// ---- layout ----------------------------------------------------------------------------------------------------------------------------------
const LYCHGATE = { x: -24, z: 3 }; // the light threshold; the path runs north-south through it
const CHURCH = { x: 16, z: -30 }; // nave centre; the door is at the west end
const SUMMIT = { x: 42, z: -40 };
const TERRACE = { x: 46, z: -22, w: 16, d: 7, y: 9.0 }; // the vault terrace (hub) under the summit
const GH = { x: -360, z: -170 }; // the Gentle House on its far hill, across the fens (WNW)
// GLB placements with a feature off the model pivot or a plain side to hide (ACT1_EXTRAS_FIT.md; the game camera looks from +z: −z faces never show)
const FORGE = { x: -8.0, z: 33.6, yaw: -45 }; // open front to the square (SW); its plain −x / −z sides face NW / NE, away from the camera
const OSRIC = { x: -62.0, z: 21.0, yaw: 90 };
const STALL = onPoint({ x: -44.5, z: 39.6, yaw: 30 }, 0.32, 0); // the awning (GLB x +0.32) on the old spot; its plain back faces NNW
const GIBBET = onPoint({ x: -47.5, z: -49.5, yaw: 25 }, -0.91, -0.09); // the post on (−47.5, −49.5), the cage reaching +x
const SEXTON = [onPoint({ x: 4.0, z: -31.5, yaw: 90 }, -0.29, -0.02), onPoint({ x: -31.5, z: -21.5, yaw: 30 }, -0.29, -0.02)]; // posts on the old spots

/** A cottage: a stilt house with its rain barrel, peat stack, door sprig (and a window light glow from the blockout). */
const COTTAGES = [
	{ id: 'gennet', name: "Gennet Barrow's cottage", x: -31, z: 14, yaw: 90 },
	{ id: 'c2', x: -47, z: 21, yaw: 0 },
	{ id: 'c3', x: -56, z: 38, yaw: 180 },
	{ id: 'c4', x: -19, z: 44, yaw: -135 },
	{ id: 'c5', x: -4, z: 18, yaw: 0 },
	{ id: 'c6', x: 7, z: 37, yaw: 180 },
	{ id: 'c7', x: 19, z: 33, yaw: -150 },
	{ id: 'c8', x: -60, z: 46, yaw: 90 },
	{ id: 'edda', name: "Edda's house", x: -42, z: 61.5, yaw: 160 },
	{ id: 'c9', name: "Peat cutter's cottage", x: 44, z: 36, yaw: -160 },
	{ id: 'c10', name: "Peat cutter's cottage", x: 68, z: 40, yaw: 170 },
];
/** Peat cuttings east of the village: rectangular pits of standing black water with peat stacks drying beside them. */
const CUTTINGS = [
	{ id: 'cut1', x: 52, z: 22, w: 10, d: 3.2, yaw: 12 },
	{ id: 'cut2', x: 63, z: 13, w: 9, d: 3, yaw: 8 },
	{ id: 'cut3', x: 76, z: 24, w: 11, d: 3.4, yaw: -6 },
];
const obbPoly = ({ x, z, w, d, yaw }) => {
	const c = Math.cos((yaw * Math.PI) / 180);
	const s = Math.sin((yaw * Math.PI) / 180);
	return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]);
};

// The churchyard's boundary (low flint wall): it closes on the lychgate's plinths (the gate's passage is the only gap) and on the vault terrace walls;
// both ends run into the fen. North of it is wild; south of it is the hub.
// The Nameless Saint stands ON the church path, turned down toward the lychgate; the path parts round its plinth (two lanes 1.5 m off its centre, under the
// ends of the arch it holds up) and joins again behind it.
const SAINT = { x: -13.4, z: -11.15 };
const SAINT_D = [0.7526, -0.6585]; // up the path (lychgate → church)
const SAINT_N = [0.6585, 0.7526];
const saintAt = (along, side) => [+(SAINT.x + SAINT_D[0] * along + SAINT_N[0] * side).toFixed(3), +(SAINT.z + SAINT_D[1] * along + SAINT_N[1] * side).toFixed(3)];

const BOUNDARY_W = [[-81, -11], [-70, -8], [-58, -4], [-44, 0], [-30, 3], [LYCHGATE.x - 1.7, 3]];
const BOUNDARY_M = [[LYCHGATE.x + 1.7, 3], [-18, 3], [-4, -1], [10, -6], [24, -12], [34, -18], [37.6, -19.4]];
const BOUNDARY_E = [[54.5, -25.5], [64, -28], [76, -32], [90, -38], [101, -42], [107, -44]];

export const PLAN = {
	id: 'lychgate',
	engine: 'outdoor',
	label: 'Lychgate → Churchyard',
	biome: 'BIO-03',
	seed: 1103,
	bounds: [-108, -84, 108, 76],
	cell: 0.5,
	splat: { res: 864 },
	target: {
		length: 360,
		note: 'Full game: hub crossing ≈ 40 s (≈ 220 m of lane at 5.6 m/s run) — this slice has ≈ 130 m of lane; the churchyard (20 min) would grow north and west to ≈ 180 × 140 m with two more grave terraces; keep the island-in-black-water frame and the lychgate as the only gap.',
	},
	edge: { width: 12, y: -1.8 },
	heights: [
		{ kind: 'base', y: 0.55 },
		{ kind: 'hill', x: 36, z: -34, rx: 68, rz: 54, rot: -15, h: 12.2, power: 1 }, // the only dry hill
		{ kind: 'hill', x: -2, z: -48, rx: 34, rz: 26, rot: 20, h: 3.2 }, // the churchyard's west shoulder (gibbet, bowmen's rise)
		{ kind: 'flatten', area: { circle: [SUMMIT.x, SUMMIT.z, 9] }, y: 12.7, soft: 4 }, // the dry summit
		{ kind: 'flatten', area: { obb: [TERRACE.x, TERRACE.z, TERRACE.w, TERRACE.d, 0] }, y: TERRACE.y, soft: 0.45 }, // the vault terrace cut into the hill
		{ kind: 'tilt', area: { poly: [[30, 9], [37, 4], [44, -18], [39, -19], [31, -2], [25, 7]] }, from: [28, 8, 1.6], to: [43, -18.5, TERRACE.y], soft: 2.5 }, // the hub's ramp up to the terrace
		{ kind: 'flatten', area: { rect: [-44, 28, -26, 42] }, y: 0.62, soft: 4, strength: 0.8 }, // the square
		{ kind: 'noise', amp: 0.18, scale: 9, seed: 4.2 },
		{ kind: 'noise', amp: 0.55, scale: 26, seed: 9.1, area: { circle: [36, -34, 60] }, soft: 12 }, // a little relief on the hill
	],
	water: [
		{
			id: 'fen', label: 'Black fen water (south and west)', level: FEN, tint: 'fen', wobble: 1.6, shelf: [2.2, 0.32], drop: [1.4, 1.5],
			area: { poly: [[-108, 76], [-108, -52], [-96, -42], [-90, -27], [-78, -16], [-73, -2], [-74, 12], [-80, 30], [-79, 46], [-70, 55], [-56, 66], [-30, 69], [-8, 66], [14, 70], [40, 66], [62, 60], [84, 56], [108, 52], [108, 76]] },
		},
		{ id: 'fenNorth', label: 'Black fen water (north)', level: FEN, tint: 'fen', wobble: 1.6, shelf: [2.2, 0.32], drop: [1.4, 1.5], area: { poly: [[-108, -84], [108, -84], [108, -78], [60, -77], [20, -78], [-20, -76], [-60, -72], [-90, -60], [-108, -52]] } },
		{ id: 'fenEast', label: 'Black fen water (east)', level: FEN, tint: 'fen', wobble: 1.6, shelf: [2.2, 0.32], drop: [1.4, 1.5], area: { poly: [[108, -84], [108, 76], [102, 56], [100, 20], [101, -20], [103, -60]] } },
		...CUTTINGS.map((c) => ({ id: c.id, label: `Peat cutting (${c.id})`, level: 0.18, tint: 'fen', wobble: 0.15, shelf: [0.35, 0.3], drop: [0.8, 0.25], bank: [0.9, 0.9], reach: 2, area: { poly: obbPoly(c) } })),
		{ id: 'mere', label: 'The village mere', level: MERE, tint: 'pond', wobble: 0.8, shelf: [1.6, 0.22], drop: [2.5, 0.45], bank: [4, 0.3], area: { poly: [[-53, 48], [-45, 45.5], [-33, 46], [-25, 49], [-24, 54], [-30, 57.5], [-40, 58], [-49, 57], [-55, 53]] } },
	],
	paths: [
		{ id: 'lane', kind: 'lane', label: 'Village lane (cobble)', points: [[-66, 27], [-55, 30], [-43, 33.5], [-32, 33], [-20, 30], [-6, 27.5], [8, 25.5], [22, 21], [28, 9]], width: 3.0, surface: 'stone', ribbon: 'cobble', smooth: 2 },
		{ id: 'gateLane', kind: 'lane', label: 'Lane to the lychgate (cobble)', points: [[-33, 33], [-29.5, 23], [-26, 13], [-24, 7], [-24, 3]], width: 2.8, surface: 'stone', ribbon: 'cobble', smooth: 2 },
		{ id: 'churchPath', kind: 'track', label: 'Churchyard path (lychgate → church door; east lane round the Nameless Saint)', points: [[-24, 3], [-24, -2], [-17, -8], saintAt(-3.4, 0), saintAt(-1.6, 1.5), saintAt(1.6, 1.5), saintAt(3.4, 0), [-9, -15], [-2, -22], [4, -27], [7.2, -30]], width: 2.2, surface: 'packed', smooth: 2 },
		{ id: 'saintLane', kind: 'track', label: 'West lane round the Nameless Saint', points: [saintAt(-3.4, 0), saintAt(-1.6, -1.5), saintAt(1.6, -1.5), saintAt(3.4, 0)], width: 1.8, surface: 'packed', smooth: 2 },
		{ id: 'summitPath', kind: 'track', label: 'Path round the church to the ossuary', points: [[7.2, -30], [6, -36], [14, -38.5], [26, -40], [35, -40.5], [38.6, -40]], width: 1.8, surface: 'packed', smooth: 2 },
		{ id: 'gravePath', kind: 'track', label: 'Grave walk (west)', points: [[-17, -8], [-28, -16], [-38, -24], [-46, -36], [-46, -44]], width: 1.6, surface: 'packed', smooth: 2 },
		{ id: 'peatTrack', kind: 'track', label: 'Peat track (to the cuttings)', points: [[20, 22], [32, 26], [44, 29], [56, 30], [68, 32], [82, 30]], width: 2.0, surface: 'packed', smooth: 2 },
		{ id: 'terraceRamp', kind: 'track', label: 'Ramp to the vault terrace (hub)', points: [[24, 15], [28, 8], [34, -2], [39, -12], [43, -18.5]], width: 2.4, surface: 'packed', smooth: 2 },
		{ id: 'dike', kind: 'dike', label: 'Dike road to the Night Fens', points: [[-66, 27], [-75, 26], [-86, 23.5], [-97, 21.5], [-108, 20.5]], width: 3.6, dike: { crest: 0.92, bank: 2.6 }, surface: 'packed', smooth: 1 },
		{ id: 'w1', kind: 'walkway', label: "Walkway across the mere to Edda's house", asset: 'A01.2', points: [[-37, 43.2], [-38, 49], [-40, 54.5], [-41.2, 58.6]], width: 1.4, deck: DECK, surface: 'wood' },
		{ id: 'w2', kind: 'walkway', label: 'Walkway to the eel racks', asset: 'A01.2', points: [[-23, 46], [-21.5, 52], [-17.5, 58], [-12, 61.5]], width: 1.4, deck: DECK, surface: 'wood', ramps: 'start' },
		{ id: 'w3', kind: 'walkway', label: 'Fishing jetty (west)', asset: 'A01.2', points: [[-63, 49], [-67, 54], [-70.5, 58]], width: 1.4, deck: 0.62, surface: 'wood', ramps: 'start' },
	],
	layers: [
		{ id: 'BIO01_peat', tile: 4.5 }, // 0 wet peat (the base: the village sits on it, the fen edge)
		{ id: 'DW_damp', tile: 3.2 }, // 1 damp soil near water and round the cottages
		{ id: 'DW_grass', tile: 3.2 }, // 2 churchyard turf (the dry hill)
		{ id: 'DW_dense', tile: 3.2 }, // 3 rank grass at the edges and on the flanks
		{ id: 'DW_dirt', tile: 3.2 }, // 4 tracks, grave earth, trodden yards
		{ id: 'BIO03_flint', tile: 3.5 }, // 5 knapped flint: church platform, summit, vault terrace, lychgate threshold
		{ id: 'DW_mud', tile: 3.2 }, // 6 mud: lane edges, puddles, the mere's banks, fresh graves
	],
	paint: [
		// damp soil: low ground near water, cottage yards
		{ layer: 'DW_damp', kind: 'height', range: [-3, 1.3], soft: 1.4, value: 0.55, patchy: { scale: 7, cover: 0.55 } },
		{ layer: 'DW_damp', kind: 'water', band: [-4, 5], soft: 1.6, value: 0.95, edge: { amp: 1.2, scale: 5 } },
		{ layer: 'DW_damp', kind: 'structures', assets: ['A01.1', 'A15.2', 'A15.5', 'A15.6'], margin: 2.4, soft: 1.5, value: 0.7, edge: { amp: 0.8, scale: 3 } },
		// turf on the dry hill (and greens in the village), not at the water
		{ layer: 'DW_grass', kind: 'height', range: [1.1, 40], soft: 1.2, value: 1, edge: { amp: 1.6, scale: 7 } },
		{ layer: 'DW_grass', kind: 'area', area: { poly: [[-66, 10], [-34, 8], [-12, 12], [6, 14], [10, 46], [-10, 50], [-58, 44], [-68, 34]] }, soft: 2, value: 0.75, patchy: { scale: 9, cover: 0.55 } },
		{ layer: 'DW_grass', kind: 'area', area: { poly: [[-76, -10], [-44, 0], [-24, 4], [10, -6], [38, -21], [56, -26], [100, -42], [100, -78], [-76, -70]] }, soft: 2.5, value: 0.85, patchy: { scale: 10, cover: 0.72 } }, // churchyard turf inside the wall
		{ layer: 'DW_grass', kind: 'water', band: [-40, 1.4], soft: 1.4, op: 'sub', value: 1 },
		// rank grass at the edges, on the flanks and round the yews
		{ layer: 'DW_dense', kind: 'slope', range: [0.2, 3], value: 0.55, patchy: { scale: 8, cover: 0.6 } },
		{ layer: 'DW_dense', kind: 'water', band: [1.2, 9], soft: 2, value: 0.7, patchy: { scale: 6, cover: 0.6 } },
		{ layer: 'DW_dense', kind: 'points', points: [[-62, -12, 6], [-58, -34, 6], [-30, -60, 7], [6, -66, 7], [58, -60, 6], [70, -40, 6], [-50, 6, 5]], soft: 2.2, value: 0.85, edge: { amp: 1.4, scale: 4 } },
		// dirt: tracks, grave earth, trodden yards, the square
		{ layer: 'DW_dirt', kind: 'path', pathKind: ['track', 'dike'], extra: 0.2, soft: 1.1, value: 0.95, edge: { amp: 0.45, scale: 2.5 } },
		{ layer: 'DW_dirt', kind: 'structures', assets: ['A16.3', 'A16.4', 'A16.5', 'A02.2', 'A02.3'], margin: 0.35, soft: 0.8, value: 0.85 },
		{ layer: 'DW_dirt', kind: 'structures', assets: ['A01.1', 'A15.2', 'A15.5', 'A01.5'], margin: 1.2, soft: 1.3, value: 0.6, patchy: { scale: 3, cover: 0.65 } },
		{ layer: 'DW_dirt', kind: 'area', area: { rect: [-45, 29, -27, 41] }, soft: 2.5, value: 0.55, patchy: { scale: 4, cover: 0.6 } },
		// knapped flint: the church platform, the summit, the vault terrace, the lychgate threshold, the ossuary door
		{ layer: 'BIO03_flint', kind: 'structures', assets: ['A15.1', 'A02.4', 'A02.1', 'N01'], margin: 1.8, soft: 1.4, value: 0.9, edge: { amp: 0.6, scale: 2.5 } },
		{ layer: 'BIO03_flint', kind: 'area', area: { circle: [SUMMIT.x, SUMMIT.z, 7.5] }, soft: 2.4, value: 0.8, edge: { amp: 1.2, scale: 4 } },
		{ layer: 'BIO03_flint', kind: 'area', area: { obb: [TERRACE.x, TERRACE.z, TERRACE.w - 1, TERRACE.d - 1, 0] }, soft: 1.4, value: 0.85 },
		{ layer: 'BIO03_flint', kind: 'slope', range: [0.55, 4], value: 0.6 }, // steep cut faces show the flint
		// mud: the lane edges, the mere banks, puddly low spots, fresh graves, under the walkways
		{ layer: 'DW_mud', kind: 'path', pathKind: 'lane', extra: 0.9, soft: 1.2, value: 0.8, edge: { amp: 0.7, scale: 3 } },
		{ layer: 'DW_mud', kind: 'water', band: [-6, 1.2], soft: 1.4, value: 0.9, edge: { amp: 0.9, scale: 3 } },
		{ layer: 'DW_mud', kind: 'height', range: [-3, 0.72], soft: 0.6, value: 0.75, patchy: { scale: 5, cover: 0.35 } },
		{ layer: 'DW_mud', kind: 'structures', assets: ['A16.4', 'A16.5'], margin: 0.5, soft: 0.6, value: 0.9 },
		{ layer: 'DW_mud', kind: 'path', pathKind: 'walkway', extra: 0.4, soft: 1, value: 0.7 },
		{ layer: 'DW_mud', kind: 'area', area: { poly: [[46, 16], [84, 16], [84, 30], [46, 30]] }, soft: 2.2, value: 0.45, patchy: { scale: 3, cover: 0.5 } },
		// wetness: drizzle everywhere (low), wet low ground and shores, dry hilltop
		{ layer: 'wet', kind: 'fill', value: 0.28 },
		{ layer: 'wet', kind: 'height', range: [-3, 1.0], soft: 1.2, value: 0.7 },
		{ layer: 'wet', kind: 'water', band: [-8, 3.5], soft: 1.6, value: 1 },
		{ layer: 'wet', kind: 'path', pathKind: 'lane', extra: 1.2, soft: 1.2, value: 0.75 },
	],
	assets: DEFS,
	structures: [
		// the threshold, church, summit, terrace
		{ asset: 'A02.1', x: LYCHGATE.x, z: LYCHGATE.z, yaw: 0, name: 'The lychgate', label: 'A02.1 Lychgate (lamp)', pad: { margin: 1.2, soft: 1.5 } },
		{ asset: 'A15.1', x: CHURCH.x, z: CHURCH.z, yaw: 0, name: 'The flint church', pad: { margin: 2.5, soft: 5 } },
		{ asset: 'A02.4', x: SUMMIT.x, z: SUMMIT.z, yaw: -90, name: 'The ossuary tower', pad: { margin: 1.5, soft: 2 } },
		{ asset: 'A02.5', x: SAINT.x, z: SAINT.z, yaw: -41, name: 'The Nameless Saint (on the path)' }, // on the path, turned toward the lychgate; the path parts round it
		{ asset: 'N01', x: TERRACE.x, z: TERRACE.z - TERRACE.d / 2 - 0.45, yaw: 0, y: TERRACE.y, name: 'Barrow family vault door', collide: true },
		{ asset: 'A16.6', ...SEXTON[0], name: "Sexton's lamp post (church door)" },
		{ asset: 'A16.6', ...SEXTON[1], name: "Sexton's lamp post (fresh grave)" },
		{ asset: 'glb:dungeon-prop-candle-cluster', x: 7.0, z: -32.0, yaw: 20, name: 'Candles at the church door' },
		{ asset: 'glb:dungeon-prop-candle-cluster', x: TERRACE.x + 1.8, z: TERRACE.z - 2.2, y: TERRACE.y, yaw: 140, name: 'Candles at the vault door' },
		{ asset: 'glb:dungeon-prop-candle-cluster', x: SUMMIT.x - 3.4, z: SUMMIT.z + 1.6, yaw: 60, name: 'Candles at the ossuary door' },
		{ asset: 'glb:dungeon-prop-bone-pile', x: TERRACE.x - 2.8, z: TERRACE.z - 1.6, y: TERRACE.y, yaw: 30, name: 'Skulls under the ossuary (the children count them)' },
		{ asset: 'glb:dungeon-prop-bone-pile', x: TERRACE.x - 5.4, z: TERRACE.z - 2.0, y: TERRACE.y, yaw: 200, scale: 0.7 },
		// the village: square, forge, gate, well
		{ asset: 'A01.5', x: -37.5, z: 37.5, yaw: 20, name: 'Village well' },
		{ asset: 'A15.3', x: -27.5, z: 38.6, yaw: 0, name: 'Sleeper name board', label: 'A15.3 Sleeper name board' },
		{ asset: 'A15.4', x: -22.0, z: 36.4, yaw: 200, name: 'Mourning bell' },
		{ asset: 'A15.5', ...STALL, name: "Nell Coppercoin's stall" },
		{ asset: 'A15.2', ...FORGE, name: "Brannoc's forge", pad: { margin: 1, soft: 1.5 } },
		{ asset: 'A15.6', ...OSRIC, name: "Osric's watch post" },
		{ asset: 'N08', x: -46.5, z: 42.2, yaw: 30, name: "Nell's goods" },
		{ asset: 'N08', x: -60.6, z: 25.2, yaw: 110, name: "Osric's stores" },
		{ asset: 'N08', x: -4.6, z: 37.5, yaw: 200, name: 'Forge stock' },
		{ asset: 'N06', x: -51.5, z: 27.5, yaw: 10, name: 'Washing line' },
		{ asset: 'N06', x: 1.5, z: 22.5, yaw: -20, name: 'Washing line' },
		{ asset: 'N07', x: -27.5, z: 60.5, yaw: 15, name: 'Drying net' },
		{ asset: 'N07', x: -66.5, z: 48.0, yaw: 60, name: 'Drying net' },
		{ asset: 'A01.6', x: -14.0, z: 57.8, yaw: 30, name: 'Eel-trap rack' },
		{ asset: 'A01.6', x: -8.0, z: 61.4, yaw: 15, name: 'Eel-trap rack' },
		{ asset: 'A01.6', x: -69.0, z: 41.5, yaw: 80, name: 'Eel-trap rack' },
		// cottages (stilts, door sprig, rain barrel, peat stack)
		...COTTAGES.map((c) => ({ asset: 'A01.1', x: c.x, z: c.z, yaw: c.yaw, name: c.name ?? 'Stilt cottage', tag: c.id, pad: { margin: 0.8, soft: 1.2 } })),
		...COTTAGES.map((c) => {
			const yaw = c.yaw * (Math.PI / 180);
			const off = 2.05; // door face = local +z
			return { asset: 'N05', x: c.x + Math.sin(yaw) * off, z: c.z + Math.cos(yaw) * off, yaw: c.yaw, y: 'ground', dy: 1.5, tag: 'accent', name: 'Poppy sprig on the door' };
		}),
		...COTTAGES.filter((c) => c.id !== 'edda').map((c, i) => {
			const yaw = c.yaw * (Math.PI / 180);
			const side = i % 2 ? 1 : -1;
			return { asset: 'N03', x: c.x + Math.cos(yaw) * 3.2 * side + Math.sin(yaw) * 1.2, z: c.z - Math.sin(yaw) * 3.2 * side + Math.cos(yaw) * 1.2, yaw: c.yaw + 90, name: 'Rain barrel' };
		}),
		...COTTAGES.filter((_, i) => i % 2 === 0).map((c) => {
			const yaw = c.yaw * (Math.PI / 180);
			return { asset: 'N04', x: c.x - Math.sin(yaw) * 3.6, z: c.z - Math.cos(yaw) * 3.6, yaw: c.yaw, name: 'Peat stack' };
		}),
		...CUTTINGS.flatMap((c, i) => [0, 1].map((k) => ({ asset: 'N04', x: c.x + (k ? 3 : -3) + i * 0.5, z: c.z - 3.2 - k * 0.4, yaw: c.yaw + k * 15, name: 'Peat stack (drying)' }))),
		{ asset: 'N12', x: 57.5, z: 18.2, yaw: 40, name: 'Peat barrow' },
		{ asset: 'A01.6', x: 86.0, z: 34.0, yaw: 100, name: 'Eel-trap rack' },
		// the churchyard: rites, graves, mortsafes, the gibbet, the cart, the vigil chair
		{ asset: 'A16.5', x: -4.5, z: -17.5, yaw: -30, name: 'Rite 1 · the risen grave', tag: 'rite' },
		{ asset: 'A16.4', x: -34.5, z: -24.5, yaw: 55, name: 'Rite 2 · the fresh grave', tag: 'rite' },
		{ asset: 'A02.6', x: -37.6, z: -21.6, yaw: 120, scale: 1.2, name: 'Funeral hand cart (Rite 2)' },
		{ asset: 'A16.3', x: -47.0, z: -6.5, yaw: 80, scale: 0.62, name: "Rite 3 · a child's grave", tag: 'rite' },
		{ asset: 'N10', x: -48.6, z: -4.4, yaw: -150, name: 'Vigil chair (unmarked vignette)' },
		{ asset: 'A16.2', ...GIBBET, name: 'The tarred gibbet' },
		{ asset: 'A16.3', x: -44.6, z: -47.2, yaw: 20, name: 'Rite 4 · the grave under the gibbet', tag: 'rite' },
		{ asset: 'A02.3', x: 30.0, z: -57.5, yaw: 10, name: 'Rite 5 · the Mallow family stones', tag: 'rite' },
		{ asset: 'A02.2', x: 26.5, z: -54.0, yaw: 100, name: 'Mortsafe (family plot)' },
		{ asset: 'A02.2', x: -20.5, z: -30.5, yaw: 40, name: 'Mortsafe' },
		{ asset: 'A02.2', x: 18.5, z: -47.5, yaw: 80, name: 'Mortsafe (thieves)' },
		{ asset: 'A02.2', x: -13.5, z: -5.0, yaw: -45, name: 'Mortsafe' },
		{ asset: 'A02.3', x: -27.0, z: -38.5, yaw: 70, name: 'Headstone cluster' },
		{ asset: 'A02.3', x: -6.0, z: -38.0, yaw: -10, name: 'Headstone cluster' },
		{ asset: 'A16.4', x: -1.5, z: -8.5, yaw: 50, name: 'Fresh grave' },
		...[
			[-16, -24, 40], [-12.5, -26.5, 40], [-9, -29, 40], [-22, -16, 50], [-25, -13, 50], [-28.5, -10.5, 50], [-32, -32, 30], [-29, -34.5, 30], [-26, -37, 30],
			[-40, -12, 70], [-41, -16.5, 70], [-36, -7.5, 70], [-10, -42.5, 10], [-14, -44, 10], [-18, -45.5, 10], [-22, -47, 10], [0, -14, 40], [3, -19.5, 40],
			[-36, -42, 20], [-38, -46, 20], [8, -46, 80], [10.5, -50, 80], [34.5, -52, 0], [36.5, -54.5, 0], [-53, -24, 80], [-54, -29, 80],
		].map(([x, z, yaw], i) => ({ asset: 'A16.3', x, z, yaw, scale: 0.9 + 0.2 * ((i * 37) % 7) / 7, name: 'Low grave (jar candles)' })),
		// yews only at the edges
		...[[-62, -14], [-60, -34], [-46, -64], [-24, -66], [4, -68], [32, -70], [58, -58], [72, -42], [-56, 5]].map(([x, z], i) => ({ asset: 'A16.1', x, z, yaw: i * 47, scale: 0.85 + ((i * 13) % 5) * 0.06, name: 'Yew (edge)' })),
		// willows at the mere / fen edge
		...[[-56, 54], [-22, 57], [-70, 34], [10, 52], [58, 48], [92, 44], [84, 10]].map(([x, z], i) => ({ asset: 'A04.2', x, z, yaw: i * 60, scale: 0.9 + i * 0.05, name: 'Young willow' })),
		// flint boulders on the hill flanks, stones and stumps at the water
		...[[54, -10], [62, -24], [22, -64], [-4, -58], [-58, -44], [70, -48], [48, -54]].map(([x, z], i) => ({ asset: 'glb:dungeon-prop-flint-boulders', x, z, yaw: i * 73, scale: 0.8 + ((i * 3) % 4) * 0.12 })),
		...[[-71, 30], [-60, 59], [-30, 62.5], [2, 59], [-82, 21.4]].map(([x, z], i) => ({ asset: 'glb:biome-prop-riverbank-stones', x, z, yaw: i * 81 })),
		...[[-66, 44], [-12, 54], [24, 48]].map(([x, z], i) => ({ asset: 'glb:biome-prop-stump', x, z, yaw: i * 55 })),
		...[[-61, -16.5], [-46.5, -66.5], [56, -61]].map(([x, z], i) => ({ asset: 'glb:biome-prop-mushrooms', x, z, yaw: i * 40 })),
		// ambient crows: on the gibbet arm, the yews, the family stones (settled after the rites; circling before)
		...[[...at(GIBBET, -0.3, -0.09), 4.12], [...at(GIBBET, 0.3, -0.09), 4.17], [...at(GIBBET, -0.55, 0.45), 0.6], [29.4, -57.2, 1.5], [-60.5, -13.0, 0.1], [-13.5, -4.8, 1.2]].map(([x, z, dy], i) => ({ asset: 'N11', x, z, yaw: i * 100, y: 'ground', dy, tag: 'crow', name: 'Crow' })), // two on the gibbet arm, one on its stones
	],
	runs: [
		{ asset: 'A01.3', points: BOUNDARY_W, tag: 'churchyard-wall' },
		{ asset: 'A01.3', points: BOUNDARY_M, tag: 'churchyard-wall' },
		{ asset: 'A01.3', points: BOUNDARY_E, tag: 'churchyard-wall' },
		{ asset: 'A01.3', points: [[-73, 8], [-68, 22]], tag: 'village-wall' },
		{ asset: 'A01.3', points: [[-68, 32], [-73, 44]], tag: 'village-wall' },
		{ asset: 'A01.3', points: [[25, -60.5], [35, -60.5], [35, -51], [31, -51]], tag: 'family-plot' },
		{ asset: 'A01.3', points: [[25, -51], [25, -60.5]], tag: 'family-plot' },
		// the retaining wall on the uphill side, in two runs either side of the vault door portal (N01, 2.4 m wide)
		{ asset: 'N02', points: [[TERRACE.x - TERRACE.w / 2 - 0.45, TERRACE.z - TERRACE.d / 2 - 0.45], [TERRACE.x - 1.2, TERRACE.z - TERRACE.d / 2 - 0.45]], y: 'min', tag: 'terrace', flip: true },
		{ asset: 'N02', points: [[TERRACE.x + 1.2, TERRACE.z - TERRACE.d / 2 - 0.45], [TERRACE.x + TERRACE.w / 2 + 0.45, TERRACE.z - TERRACE.d / 2 - 0.45]], y: 'min', tag: 'terrace', flip: true },
		{ asset: 'N02', points: [[TERRACE.x - TERRACE.w / 2 - 0.45, TERRACE.z + 2.6], [TERRACE.x - TERRACE.w / 2 - 0.45, TERRACE.z - TERRACE.d / 2]], y: 'min', tag: 'terrace' },
		{ asset: 'N02', points: [[TERRACE.x + TERRACE.w / 2 + 0.45, TERRACE.z - TERRACE.d / 2], [TERRACE.x + TERRACE.w / 2 + 0.45, TERRACE.z + 3.5]], y: 'min', tag: 'terrace' },
		{ asset: 'A01.4', points: [[-52, 17], [-42, 16]], tag: 'hurdles' },
		{ asset: 'A01.4', points: [[-61, 33], [-61, 42]], tag: 'hurdles' },
		{ asset: 'A01.4', points: [[2, 41], [12, 42.5]], tag: 'hurdles' },
		{ asset: 'A01.4', points: [[-10, 14], [0, 13]], tag: 'hurdles' },
		{ asset: 'A01.4', points: [[-26, 48], [-16, 50]], tag: 'hurdles' },
		{ asset: 'A01.4', points: [[38, 40], [38, 31], [47, 30.5]], tag: 'hurdles' },
		{ asset: 'A01.4', points: [[62, 45], [74, 45.5]], tag: 'hurdles' },
		{ asset: 'A06.1', points: [[-70, 24.2], [-85, 21.6], [-96, 19.6], [-104, 18.6]], gaps: [[-90, 20.8, 2.5]], tag: 'dike' },
	],
	scatters: [
		{ asset: 'A03.1', count: 900, area: { rect: [-100, -76, 100, 66] }, spacing: 1.1, clear: { paths: 0.6, water: 0.6, structures: 0.4, decks: 0.6 }, height: [0.5, 40], scale: [0.7, 1.25], seed: 31 },
		{ asset: 'A03.2', count: 320, area: { rect: [-108, -84, 108, 76] }, spacing: 0.8, band: { water: [-1.6, 0.9] }, clear: { decks: 0.5 }, scale: [0.75, 1.3], seed: 41 },
		{ asset: 'A03.3', count: 220, area: { rect: [-108, -84, 108, 76] }, spacing: 0.9, band: { water: [-0.5, 2.6] }, clear: { decks: 0.5, paths: 0.6 }, scale: [0.7, 1.2], seed: 43 },
		{ asset: 'N09', count: 30, area: { poly: [[-74, -20], [-60, 6], [-40, 4], [-10, -4], [30, -20], [74, -36], [86, -54], [40, -74], [-30, -70], [-70, -50]] }, spacing: 5, clear: { paths: 2.2, structures: 2.5, water: 1.5 }, slope: 0.6, scale: [0.9, 1.6], seed: 51 },
		{ asset: 'N09', count: 14, area: { poly: [[-74, 12], [-60, 10], [-8, 10], [24, 14], [26, 52], [-8, 56], [-60, 60], [-78, 46]] }, spacing: 6, clear: { paths: 2.5, structures: 2.5, water: 1.2, decks: 1.5 }, scale: [0.8, 1.3], seed: 53 },
	],
	lights: [
		{ id: 'lychgateLamp', kind: 'human', label: 'Lychgate lamp (the threshold light)', x: LYCHGATE.x, z: LYCHGATE.z + 0.2, y: 2.55, color: '#e0a050', intensity: 9, range: 10, flicker: 1, real: true, glow: 0.55, seed: 1, night: { intensity: 3.2, range: 7, glow: 0.3 } }, // Prologue: lit but small and far, the goal seen from the church steps (LD 10.2)
		onModel(FORGE, [-0.85, 0.85, -0.6], { id: 'forge', kind: 'human', label: "Brannoc's forge (the model hearth)", color: '#e8823a', intensity: 15, range: 9, flicker: 1.2, real: true, glow: 1.6, seed: 2, flag: 'forge' }),
		{ id: 'square', kind: 'human', label: 'Windows round the square', x: -40, z: 27, y: 2.4, color: '#e0a050', intensity: 4, range: 9, flicker: 0.6, real: true, glow: 0, seed: 3, night: { intensity: 0.8 } }, // Prologue: the village sleeps, windows ≈ 20 %
		{ id: 'edda', kind: 'human', label: "Edda's window", x: -41.6, z: 59.2, y: 2.2, color: '#e0a050', intensity: 4, range: 7, flicker: 0.6, real: true, glow: 0, seed: 4, moods: ['day', 'lookdev'] },
		{ id: 'vault', kind: 'human', label: 'Candles at the vault door', x: TERRACE.x + 1.6, z: TERRACE.z - 1.9, y: 0.9, color: '#e8a858', intensity: 3.2, range: 6, flicker: 1, real: true, glow: 0.5, seed: 5, moods: ['day', 'lookdev'] },
		{ id: 'churchDoor', kind: 'human', label: "Church door (Prologue: Gennet's lantern, the first warm light)", x: 6.6, z: -30.4, y: 1.7, color: '#e0a050', intensity: 5, range: 9, flicker: 1, real: true, glow: 0.7, seed: 6, night: { intensity: 14, range: 13, glow: 1.15 } },
		onModel(OSRIC, [-1.0, 2.8, 0.87], { id: 'osric', kind: 'human', label: "Osric's fire basket (on the model)", color: '#e8903a', intensity: 6, range: 9, flicker: 1.1, real: true, glow: 1.0, seed: 7, moods: ['day', 'lookdev'] }),
		{ id: 'pipe', kind: 'human', label: "Gennet's pipe ember", x: -28.6, z: 13.4, y: 1.5, color: '#ff7a2a', intensity: 0, range: 0, flicker: 1.4, real: false, glow: 0.18, seed: 8, moods: ['day', 'lookdev'] },
		onModel(SEXTON[0], [0.42, 1.95, 0.08], { id: 'sexton1', kind: 'human', label: "Sexton's lamp (church; the model lantern)", color: '#e0a050', intensity: 0, range: 0, flicker: 1, real: false, glow: 0.45, seed: 9, moods: ['day', 'lookdev'] }),
		onModel(SEXTON[1], [0.42, 1.95, 0.08], { id: 'sexton2', kind: 'human', label: "Sexton's lamp (fresh grave; the model lantern)", color: '#e0a050', intensity: 0, range: 0, flicker: 1, real: false, glow: 0.45, seed: 10, moods: ['day', 'lookdev'] }),
		{ id: 'gentleHouse', kind: 'perfection', label: 'The Gentle House window (still, far)', anchor: 'N-GH', x: GH.x, z: GH.z, far: true, y: 9.2, color: '#f6b468', intensity: 0, range: 0, flicker: 0, real: false, glow: 8, flag: 'gentleHouse' },
	],
	markers: [
		// encounters (the churchyard only; the hub has none)
		{ kind: 'encounter', id: 'E1', x: -16, z: -20, r: 8, segment: 'churchyard', label: 'E1 · U01 ×5', monsters: [{ id: 'U01', count: 5, standIn: 'zombie' }], note: 'first fight past the lychgate, round Rite 1' },
		{ kind: 'encounter', id: 'E2', x: -37, z: -29, r: 6, segment: 'churchyard', label: 'E2 · U02 ×3 + U01 ×2', monsters: [{ id: 'U02', count: 3, standIn: 'skeleton' }, { id: 'U01', count: 2, standIn: 'zombie' }] },
		{ kind: 'encounter', id: 'E3', x: -12, z: -50, r: 4, segment: 'churchyard', label: 'E3 · U03 ×2 (bowmen)', monsters: [{ id: 'U03', count: 2, standIn: 'skeleton_archer' }], note: 'first ranged enemy: on the open west shoulder, clear sightlines down to the church path' },
		{ kind: 'encounter', id: 'E4', x: -55, z: -18, r: 5, segment: 'churchyard', label: 'E4 · U04 ×2 (ghouls)', monsters: [{ id: 'U04', count: 2, standIn: 'spider' }] },
		{ kind: 'encounter', id: 'E5', x: -44, z: -53, r: 6, segment: 'churchyard', label: 'E5 · W02 ×5 (gibbet crows)', monsters: [{ id: 'W02', count: 5, standIn: 'bat' }] },
		{ kind: 'encounter', id: 'E6', x: 21, z: -50, r: 4, segment: 'churchyard', label: 'E6 · F01 ×2 (side: The Mortsafe Thieves)', monsters: [{ id: 'F01', count: 2, standIn: 'imp', single: true }], note: 'side quest; they run when seen' },
		{ kind: 'encounter', id: 'E7', x: 40, z: -50, r: 5, segment: 'churchyard', label: 'E7 · U01 ×3 + U02 ×1', monsters: [{ id: 'U01', count: 3, standIn: 'zombie' }, { id: 'U02', count: 1, standIn: 'skeleton' }] },
		// the five unquiet graves (rite sites, each a different small scene)
		{ kind: 'rite', id: 'R1', x: -4.5, z: -17.5, label: 'Rite 1 · mộ trỗi dậy (mortsafe bẻ ra ngoài)', note: 'by the path above the statue: the cage bent outward from inside' },
		{ kind: 'rite', id: 'R2', x: -34.5, z: -24.5, label: 'Rite 2 · mộ mới, xe tang, đèn cột', note: 'a spade in the earth, the hand cart, the sexton lamp' },
		{ kind: 'rite', id: 'R3', x: -47, z: -6.5, label: 'Rite 3 · mộ trẻ con, nến hũ', note: 'small grave under the edge yews; the vigil chair beside it (unmarked)' },
		{ kind: 'rite', id: 'R4', x: -44.6, z: -47.2, label: 'Rite 4 · mộ dưới giá treo cổ', note: 'tar post, empty cage, crows' },
		{ kind: 'rite', id: 'R5', x: 30, z: -57.5, label: 'Rite 5 · lô mộ gia đình sau tường đá', note: 'mismatched stones inside a low flint plot north of the summit' },
		// landmarks and sightlines
		{ kind: 'landmark', id: 'L1', x: SUMMIT.x, z: SUMMIT.z, label: 'Tháp ossuary (thấy từ gần hết map)' },
		{ kind: 'landmark', id: 'L2', x: LYCHGATE.x, z: LYCHGATE.z, label: 'Đèn lychgate (ngưỡng ánh sáng)' },
		{ kind: 'landmark', id: 'L3', x: CHURCH.x - 7, z: CHURCH.z, label: 'Nhà thờ đá lửa · tháp chuông' },
		{ kind: 'sightline', id: 'S1', from: [SUMMIT.x - 4, SUMMIT.z + 2, 1.7], target: 'far:N-GH', label: 'Đỉnh đồi → Gentle House (đích đến của act)' },
		{ kind: 'sightline', id: 'S2', from: [6.5, -30.5, 1.7], target: [LYCHGATE.x, 0, LYCHGATE.z], targetLift: 2.5, label: 'Bậc nhà thờ → đèn lychgate' },
		{ kind: 'sightline', id: 'S3', from: [-36, 34, 1.7], target: [SUMMIT.x, 0, SUMMIT.z], targetLift: 7.5, label: 'Quảng trường → tháp ossuary' },
		{ kind: 'sightline', id: 'S4', from: [-84, 23.5, 1.7], target: 'far:N-GH', label: 'Đê → Gentle House qua nước đen' },
		// vignettes (one unmarked) and the two Remember beats
		{ kind: 'vignette', id: 'V1', x: -48.6, z: -4.4, unmarked: true, label: 'Ghế canh + chăn gấp bên mộ trẻ con (không đánh dấu)' },
		{ kind: 'vignette', id: 'V2', x: -31.3, z: -21.0, label: 'Bát sữa cho the Kind Ones dưới đèn người đào mộ' },
		{ kind: 'vignette', id: 'V3', x: TERRACE.x - 3.5, z: TERRACE.z - 0.5, remember: true, label: 'REMEMBER (hub): trẻ con nhảy đếm sọ bên ossuary trong mưa' },
		{ kind: 'vignette', id: 'V4', x: -3.6, z: -15.8, remember: true, label: 'REMEMBER (churchyard): quỳ bên mộ trong mưa' },
		// NPC spots (hub) and the Prologue's Gennet
		{ kind: 'npc', id: 'gennet', x: -28.4, z: 13.2, label: 'Gennet Barrow (tẩu đỏ lửa ở cửa)', segment: 'hub' },
		{ kind: 'npc', id: 'brannoc', x: -9.4, z: 30.6, label: 'Brannoc (lò rèn)', segment: 'hub' },
		{ kind: 'npc', id: 'osric', x: -59.8, z: 23.6, label: 'Osric (trạm gác)', segment: 'hub' },
		{ kind: 'npc', id: 'nell', x: -43.2, z: 37.6, label: 'Nell Coppercoin (sạp đồ tang)', segment: 'hub' },
		{ kind: 'npc', id: 'tamsin', x: -27.4, z: 36.2, label: 'Tamsin (bảng tên người ngủ)', segment: 'hub' },
		{ kind: 'npc', id: 'children', x: TERRACE.x - 3.6, z: TERRACE.z + 0.4, label: 'Trẻ con ×3 (đếm sọ)', segment: 'hub' },
		{ kind: 'npc', id: 'edda', x: -40.6, z: 58.4, label: 'Edda (The Broth → Edda\'s Dream)', segment: 'hub' },
		{ kind: 'npc', id: 'gennetVigil', x: 6.2, z: -29.0, label: 'Gennet + đèn lồng (Prologue · đêm)', segment: 'churchyard', moods: ['night'] },
		// exits
		{ kind: 'exit', id: 'X1', x: -104, z: 20.5, label: '→ The Night Fens (11.4) · đê', to: 'fens' },
		{ kind: 'exit', id: 'X2', x: TERRACE.x, z: TERRACE.z - 2.7, label: '→ Hầm nhà Barrow (One for the Footing)', to: 'barrowVault' },
		{ kind: 'exit', id: 'X3', x: -41.8, z: 59.4, label: "→ Edda's Dream (11.10, The Broth)", to: 'eddasDream' },
	],
	segments: [
		{ id: 'hub', kind: 'hub', label: 'Làng · quảng trường (hub)', spawn: [-34.5, 35.5], view: 'hub', route: [[-34.5, 35.5], [-44, 33.5], [-56, 30], [-66, 27], [-80, 25], [-96, 21.6]] },
		{ id: 'mere', kind: 'hub', label: "Làng · bờ hồ, nhà Edda", spawn: [-36.5, 42.5], view: 'mere', route: [[-36.5, 42.5], [-37.6, 46], [-38.6, 51], [-40.5, 56], [-41.2, 58.4]] },
		{ id: 'gate', kind: 'hub', label: 'Cổng lychgate (ngưỡng)', spawn: [-24.5, 9.5], view: 'lychgate', route: [[-24.5, 9.5], [-24, 5], [-24, 0], [-20, -5], saintAt(-3.4, 0), saintAt(0, 1.5), saintAt(3.4, 0), saintAt(0, -1.5), saintAt(-3.4, 0), saintAt(0, 1.5), saintAt(3.4, 0), [-4, -20], [3, -26], [6.5, -29.5]] }, // both lanes round the saint
		{ id: 'churchyard', kind: 'wild', label: 'Sân nhà thờ · giữa dốc', spawn: [-15.5, -10.5], view: 'churchyard', route: [[-15.5, -10.5], [-24, -14], [-34, -20], [-42, -30], [-46, -40], [-46, -44]] },
		{ id: 'summit', kind: 'wild', label: 'Đỉnh đồi · tháp ossuary', spawn: [36.0, -44.0], view: 'summit', route: [[36, -44], [30, -41], [20, -39.4], [10, -37.6], [6.8, -33], [7, -30.2]] },
		{ id: 'terrace', kind: 'hub', label: 'Sân hầm Barrow (hub, dưới ossuary)', spawn: [44.0, -19.5], view: 'vault', route: [[44, -19.5], [41, -14], [36, -5], [30, 5], [25, 14], [18, 22.5], [6, 26]] },
		{ id: 'fenroad', kind: 'wild', label: 'Đê ra Night Fens', spawn: [-78.0, 25.6], view: 'fenroad', route: [[-78, 25.6], [-70, 26.6], [-64, 27.4], [-56, 30], [-46, 33]] },
	],
	views: {
		overview: { label: 'Toàn cảnh (base map)', target: [0, -4], fit: [216, 160] },
		hub: { label: 'Làng Lychgate (hub)', target: [-32, 34], dist: 50, pitch: 52 },
		mere: { label: "Bờ hồ · lối ván · nhà Edda", target: [-38, 52], dist: 30, pitch: 48 },
		lychgate: { label: 'Cổng lychgate (ngưỡng ánh sáng)', target: [-24, 3], dist: 18, pitch: 36, lift: 1.2 },
		churchyard: { label: 'Sân nhà thờ (dốc mộ)', target: [-18, -22], dist: 58, pitch: 52 },
		rites: { label: 'Năm mộ chưa yên (rite)', target: [-12, -32], dist: 92, pitch: 60 },
		church: { label: 'Nhà thờ đá lửa · tượng không mặt', target: [0, -22], dist: 34, pitch: 40, lift: 2 },
		summit: { label: 'Đỉnh đồi · tháp ossuary', target: [38, -40], dist: 34, pitch: 44, lift: 2 },
		vault: { label: 'Sân hầm Barrow · trẻ con đếm sọ', target: [45, -21], dist: 22, pitch: 42, lift: 1 },
		gibbet: { label: 'Giá treo cổ + quạ (Rite 4)', target: [-46, -48], dist: 22, pitch: 44, lift: 1.5 },
		fenroad: { label: 'Đê ra Night Fens', target: [-84, 23], dist: 36, pitch: 46 },
		gentle: { label: 'Từ đỉnh đồi nhìn Gentle House (N-GH)', eye: [SUMMIT.x - 6, 0, SUMMIT.z + 5], eyeLift: 3.4, look: 'far:N-GH', fov: 30 },
		hubGentle: { label: 'Từ làng nhìn qua nước đen tới Gentle House', eye: [-60, 0, 58], eyeLift: 2.6, look: 'far:N-GH', fov: 30 },
	},
	far: {
		level: FEN,
		size: 2400,
		hills: [{ x: GH.x, z: GH.z, r: 115, h: 34 }, { x: -250, z: -320, r: 90, h: 14 }, { x: -470, z: 40, r: 130, h: 18 }, { x: 160, z: -420, r: 140, h: 20 }],
		items: [{ asset: 'N-GH', x: GH.x, z: GH.z, yaw: 72 }],
	},
	defaultMood: 'day',
	moods: {
		day: {
			label: 'Act I · mưa phùn ban ngày', sky: '#a9b1a6', ground: '#4a3526', hemi: 1.75, sun: { elev: 62, az: -150, intensity: 0.5, kelvin: 7000 }, env: 'hdri-overcast', envI: 0.3,
			toneMapping: 'aces', exposure: 0.35, background: '#7d857b',
			fog: { enabled: true, color: '#8c958a', density: 0.016, falloff: 0.11, height: 0, start: 12, inscatter: 0 },
			grade: { vignette: 0.32, contrast: 1.05, saturation: 0.86, lift: 0, temperature: -0.02, tint: 0 },
			rain: 0.4, mist: 0.55, human: 0.7, perfection: 1, windows: 0.55, flags: { accent: true, graveCandles: true, gentleHouse: true, forge: true, gennetLantern: false },
		},
		night: {
			label: 'Prologue · đêm mưa', sky: '#4e5f7a', ground: '#1c241f', hemi: 1.8, sun: { elev: 44, az: 160, intensity: 0.8, kelvin: 9000 }, env: 'hdri-night', envI: 0.1,
			toneMapping: 'aces', exposure: 1.25, background: '#0e1317', rainTone: 0.4,
			fog: { enabled: true, color: '#1a2228', density: 0.016, falloff: 0.1, height: 0, start: 8, inscatter: 0 },
			grade: { vignette: 0.55, contrast: 1.1, saturation: 0.78, lift: 0, temperature: -0.05, tint: 0 },
			rain: 1, mist: 0.75, human: 1.0, perfection: 0, windows: 0.2, flags: { accent: false, graveCandles: false, gentleHouse: false, forge: false, gennetLantern: true }, // Gennet's lantern first; the Gentle House window off
		},
		lookdev: {
			label: 'Soi texture · sáng đều', sky: '#c9d4e4', ground: '#3b352e', hemi: 2.4, sun: { elev: 50, az: -135, intensity: 1.1, kelvin: 5600 }, env: 'hdri-overcast', envI: 0.25,
			toneMapping: 'aces', exposure: 0.2, background: '#30353a',
			fog: { enabled: false }, grade: { vignette: 0.2, contrast: 1.04, saturation: 1.0, lift: 0, temperature: 0, tint: 0 },
			rain: 0, mist: 0, human: 0.5, perfection: 1, windows: 0.4, flags: { accent: true, graveCandles: true, gentleHouse: true, forge: true, gennetLantern: false },
		},
	},
	notes: {
		hub: 'Hub (11.2, an toàn, 15 phút qua nhiều lần ghé): "ấm nhỏ biết giá của nó" — nghèo, ướt, không phải làng fantasy ấm cúng. Nhà sàn trên than bùn ướt, lối ván qua mặt hồ, tường đá lửa vá, rào liễu, giếng, giá lờ lươn, lò rèn Brannoc, bảng tên người ngủ, chuông tang, sạp Nell, trạm gác Osric, hố cắt than bùn (nước đen) ở phía đông; nhánh poppy trên cửa là accent duy nhất.',
		churchyard: 'Churchyard (11.3, wild, 20 phút, D2 C2): dốc từ cửa nhà thờ xuống cổng lychgate; mộ thấp, thủy tùng chỉ ở rìa, mortsafe, cụm bia lệch, xe tang, giá treo cổ hắc ín + quạ, tượng không mặt trên lối đi, nến hũ trên mộ. Năm mộ chưa yên (rite), mỗi chỗ một cảnh. Mưa phùn, ánh sáng xám không bóng; sau 5 rite: sương mỏng đi, quạ đậu lại.',
	},
};

export const ASSETS = withCounts(PLAN);

export const MONSTERS = [
	{ id: 'U01', name: 'Rot-Shambler (Shambler, Act I tier)', segment: 'churchyard', count: 10, note: 'E1 ×5, E2 ×2, E7 ×3 · stand-in `zombie` · h 0.90–1.00 H' },
	{ id: 'U02', name: 'Charnel Dead', segment: 'churchyard', count: 4, note: 'E2 ×3, E7 ×1 · stand-in `skeleton`' },
	{ id: 'U03', name: 'Charnel Bowman', segment: 'churchyard', count: 2, note: 'E3, a pair; the first ranged enemy — open sightlines on the west shoulder · stand-in `skeleton_archer`' },
	{ id: 'U04', name: 'Charnel Ghoul', segment: 'churchyard', count: 2, note: 'E4 by the edge yews · stand-in `spider` (fast, leaping)' },
	{ id: 'W02', name: 'Gibbet-Crow', segment: 'churchyard', count: 5, note: 'E5 at the gibbet · stand-in `bat` (erratic flier)' },
	{ id: 'F01', name: 'Body-snatcher', segment: 'churchyard', count: 2, note: 'E6, side quest The Mortsafe Thieves · stand-in `imp` (flees), spawned as single named uniques' },
];

export const NPCS = [
	{ name: 'Gennet Barrow', segment: 'hub', note: 'the sexton; pipe ember at his door by the lychgate lane. Prologue: his lantern at the church door is the first warm light' },
	{ name: 'Brannoc (the Mortsmith)', segment: 'hub', note: 'forge east of the square; makes the mortsafes' },
	{ name: 'Osric', segment: 'hub', note: 'watch post at the west gate where the dike road leaves for the Night Fens' },
	{ name: 'Nell Coppercoin', segment: 'hub', note: 'grave-goods stall on the square' },
	{ name: 'Tamsin', segment: 'hub', note: 'by the sleeper name board' },
	{ name: 'Children (×3)', segment: 'hub', note: 'skipping and counting skulls under the ossuary, in the rain (Remember)' },
	{ name: 'Edda', segment: 'hub', note: "her stilt house across the mere; side quest The Broth → Edda's Dream" },
	{ name: 'Barrow family vault (door)', segment: 'hub', note: 'side quest One for the Footing; the door in the terrace wall under the ossuary' },
];

export const TEXTURES = [
	{ id: 'BIO01_peat', have: true, note: 'wet peat: the base of the island, the village, the fen edge' },
	{ id: 'BIO03_flint', have: true, note: 'knapped flint: church platform, summit, vault terrace, lychgate threshold, steep cuts' },
	{ id: 'DW_damp (darkwood soil-damp)', have: true, note: 'damp soil near water and round the cottages' },
	{ id: 'DW_grass (darkwood grass)', have: true, note: 'churchyard turf' },
	{ id: 'DW_dense (darkwood grass-dense)', have: true, note: 'rank grass at the edges' },
	{ id: 'DW_dirt (darkwood dirt)', have: true, note: 'tracks, grave earth, yards' },
	{ id: 'DW_mud (darkwood mud)', have: true, note: 'lane edges, mere banks, fresh graves, puddles' },
	{ id: 'darkwood-sty-green-cobble', have: true, note: 'cobble ribbon of the village lane (a Dark Wood stand-in, not BIO-03)' },
	{ id: 'biome-darkwood-water-n', have: true, note: 'ripple normal of the fen and the mere' },
	{ id: 'biome-shore-plants · biome-darkwood-grass-cards', have: true, note: 'reed / sedge and grass card atlases' },
	{ id: 'cobble road with grass verge (BIO-03 lane)', have: false, note: 'A05 cell 3 concept only; needs a periodic tile + verge' },
	{ id: 'churchyard turf and grave earth', have: false, note: 'A05 cell 5 concept only; the base uses darkwood grass + dirt' },
	{ id: 'fen shore mud → water', have: false, note: 'A05 cell 2 concept only; the base uses darkwood mud + soil-damp + the water mesh' },
	{ id: 'peat meadow floor (tile)', have: false, note: 'A05 cell 1 concept only; BIO01_peat stands in' },
	{ id: 'knapped flint wall + lime mortar (walls, church)', have: false, note: 'blockouts are flat-coloured; the wall material does not exist yet' },
	{ id: 'thatch (patched) roof', have: false, note: 'stilt cottages, forge, well roof' },
];

export const VFX = [
	{ id: 'drizzle / rain', have: false, note: 'placeholder: CPU streaks round the camera (rain slider); needs the real drizzle + splashes + water ripples' },
	{ id: 'low mist in the hollows', have: false, note: 'placeholder: drifting soft sheets + the post height fog; thins after the five rites (toggle)' },
	{ id: 'human lights (windows, forge, lamps, candles)', have: false, note: 'placeholder: point lights with 1/f flicker + still glow sprites; needs flames (FlameField), forge sparks' },
	{ id: 'peat smoke from chimneys', have: false, note: 'not built' },
	{ id: "Gennet's pipe ember + smoke", have: false, note: 'placeholder: a tiny flickering glow' },
	{ id: 'jar candle flames on graves', have: false, note: 'placeholder: tiny glows (day), out in the Prologue night' },
	{ id: 'crows (flock, settling after the rites)', have: false, note: 'placeholder: still crow blockouts; circling vs perched by the rites toggle' },
	{ id: 'rite of laying (kneel, "Will you hold?")', have: false, note: 'markers only' },
	{ id: 'Gentle House window (still, warm, far)', have: false, note: 'placeholder: a big still glow in the VFX layer (not fogged) on the far silhouette' },
	{ id: 'unquiet grave: earth heaving before a Shambler', have: false, note: 'not built' },
];

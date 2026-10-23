// ASHLAR · Act I · hub map `lychgateHub`: the WALLED Lychgate hub of seed 21 (hub-gen/2, frozen in env/hubPlans/lychgate-s21.json; the layout the user picked),
// built with the real Lychgate GLBs. A wooden palisade ring 47.9 × 46.5 m on a 64 m canvas in black fen water: the main gate in the S wall (causeway from the
// S edge, Osric's watch post just inside), the lychgate in the N wall (the hill lane climbs to the churchyard, off the map), the Barrow vault door in the W wall
// between two flint wings, Edda's stilt house over the inner pond, the square (well, bell, Nell's stall, the name board), Brannoc's forge, three more cottages.
// The PLAN is generated from the frozen JSON by env/hubOutdoor.js (pure); asset defs, ground layers, moods and the far frame come from the Lychgate map's PLAN
// (read-only). Format: env/act1/outdoor.js (header).
import { withCounts } from '../outdoor.js';
import { hubToOutdoorPlan } from '../../hubOutdoor.js';
import frozen from '../../hubPlans/lychgate-s21.json' with { type: 'json' };
import { PLAN as LYCHGATE } from './lychgate.js';

export const FROZEN = frozen;

export const PLAN = hubToOutdoorPlan(frozen, LYCHGATE, {
	id: 'lychgateHub',
	label: 'Lychgate hub · walled (seed 21)',
	wingScaleY: 1.3, // the N02 wings ×1.3 tall (2.8 m: level with the 2.8 m vault door between them), plan length (3.91 m)
});

export const ASSETS = withCounts(PLAN);

export const MONSTERS = []; // a safe hub

export const NPCS = [
	{ name: 'Osric', segment: 'hub', note: "watch post just inside the main gate (S wall), where the causeway comes in from the Night Fens; his fire basket is the threshold light" },
	{ name: 'Brannoc (the Mortsmith)', segment: 'hub', note: 'the forge on the east side of the square; makes the mortsafes' },
	{ name: 'Nell Coppercoin', segment: 'hub', note: 'grave-goods stall at the east edge of the square' },
	{ name: 'Tamsin', segment: 'hub', note: 'by the sleeper name board on the route between the gate and the square' },
	{ name: 'Edda', segment: 'hub', note: "her stilt house over the inner pond, a plank walkway from the square side; side quest The Broth → Edda's Dream" },
	{ name: 'Barrow family vault (door)', segment: 'hub', note: 'side quest One for the Footing: the door in the W wall between two flint wings (a door, not an opening of the ring)' },
];

export const TEXTURES = [
	{ id: 'BIO01_peat', have: true, note: 'wet peat: the island floor inside the ring' },
	{ id: 'BIO03_flint', have: true, note: 'knapped flint: the lychgate and vault door thresholds' },
	{ id: 'DW_damp (darkwood soil-damp)', have: true, note: 'damp soil near water and round the cottages' },
	{ id: 'DW_grass (darkwood grass)', have: true, note: 'patchy turf inside the ring' },
	{ id: 'DW_dense (darkwood grass-dense)', have: true, note: 'rank grass on the shores' },
	{ id: 'DW_dirt (darkwood dirt)', have: true, note: 'packed tracks, the square, yards' },
	{ id: 'DW_mud (darkwood mud)', have: true, note: 'lane edges, pond and fen banks, under the walkways' },
	{ id: 'darkwood-sty-green-cobble', have: true, note: 'cobble ribbon of the route (a Dark Wood stand-in, not BIO-03)' },
	{ id: 'biome-darkwood-water-n', have: true, note: 'ripple normal of the fen and the pond' },
	{ id: 'biome-shore-plants · biome-darkwood-grass-cards', have: true, note: 'reed / sedge and grass card atlases' },
	{ id: 'kit-palisade (wall_a)', have: true, note: 'the palisade ring: the kit GLB, its first mesh = wall_a (the engine kit loader has no palisade key)' },
	{ id: 'palisade kit pieces other than wall_a (wall_angle, wall_end, wall_tall …)', have: false, note: 'cannot be loaded by the outdoor builder (KIT_IDS has no palisade key): the ring corners are two crossing wall_a, the gate jambs (and joint stakes) are stretched slices of the wall_a end logs (PAL.log2)' },
	{ id: 'cobble road with grass verge (BIO-03 lane)', have: false, note: 'A05 cell 3 concept only; the route uses the Dark Wood cobble ribbon' },
	{ id: 'thatch (patched) roof / flint wall material', have: false, note: 'the GLBs carry their own textures; no tiling material exists yet' },
];

export const VFX = [
	{ id: 'drizzle / rain', have: false, note: 'placeholder: CPU streaks round the camera (rain slider)' },
	{ id: 'low mist', have: false, note: 'placeholder: drifting soft sheets + the post height fog' },
	{ id: 'human lights (fire basket, forge, lamp, windows, vault candles)', have: false, note: 'placeholder: point lights with 1/f flicker + still glow sprites; needs flames (FlameField), forge sparks' },
];

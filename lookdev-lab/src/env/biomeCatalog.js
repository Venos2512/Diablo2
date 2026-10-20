// Data for the biome layout engine (biomeLayout.js): asset declarations for the lab kits, functional cluster recipes,
// trace recipes, wayfinding policies and the sub-zone profiles of art direction 12 §4.11. No renderer, no logic beyond
// deriving sizes/footprints from the measured kits (kitSizes.json, scripts/measure-kits.mjs).
// Piece pivots: bottom centre, length along +x; the front of a camp piece is local +z. Metres, scale 1 unless noted.

export const ZONE_KINDS = Object.freeze(['moor', 'farm', 'field', 'camp', 'den', 'graveyard', 'bank']);

const ALL = ZONE_KINDS;
const WILD = ['moor', 'den', 'graveyard', 'bank', 'farm'];
const SETTLED = ['farm', 'camp'];
const DRY = ['grass', 'dirt'];
const DRY_ROCK = ['grass', 'dirt', 'rock'];
const DAMP = ['grass', 'dirt', 'mud'];

/**
 * Asset declarations: [kit key, defaults for the kit, { piece: overrides }]. Every field of AD 12 §4.6's last paragraph is
 * filled in by buildCatalog (footprint and size come from the measured mesh). Declared pieces with `zones: []` exist for
 * hand placement only (scenes, authored masses) and are never drawn by the algorithm.
 *   zones      sub-zones it may stand in (vùng con)          role   ground | obstacle | interactive | hazard | guide
 *   layer      AD 12 §4.2 layer: decal | low | tall | edge | landmark
 *   use        { side: front|back|left|right|all, depth, width? } operating / standing zone that must stay clear
 *              (front = local +z, back = local −z, left = local −x, right = local +x)
 *   front      yaw of the piece's front relative to local +z   substrates  ground classes it may stand on
 *   maxSlope   gradient (dh/dx)      maxStep  height range under the footprint (m)      sink  fraction of height
 *   align      upright | slope       natural  free yaw (true) or follows the host/building axes (false)
 *   shrink     footprint factor for irregular meshes           crown   m added to the footprint for camera occlusion
 *   from       'base' = footprint from the lowest 15 % of the mesh (trunks), else the full box
 *   feet       grass clings around it with a little bare soil at the foot (§4.7)
 *   light      local [x, y, z] of its flame/lantern (weepingFields.js KIT_LIGHTS, measured on the GLB vertices)
 *   hostKinds  what an event may call the piece when it hosts a trace (TRACES[*].hosts): cart | carcass | altar | shrine | grave
 *   fallback   used ONLY when the piece and every other alternative of its recipe entry are missing from the scene; a fallback
 *              keeps collision, role and layer class (catalog test) and is scaled by its own `scale` range
 */
const DECLS = [
	['rocks', { zones: ['moor', 'den', 'graveyard', 'bank', 'farm', 'camp'], role: 'obstacle', layer: 'tall', natural: true, collision: true, substrates: DRY_ROCK, maxSlope: 0.8, maxStep: 0.9, align: 'slope', sink: 0.15, scale: [0.5, 0.85], shrink: 0.9, feet: true, fallback: ['mossy.standard'] }, {
		standard: {}, standard_front: {}, standard_side: {}, standard_top: { layer: 'low', scale: [0.4, 0.7], fallback: ['mossy.standard_top'] },
		cluster: { scale: [0.4, 0.7] }, tall: { layer: 'edge', scale: [0.55, 0.9] }, ledge: { layer: 'edge', scale: [0.45, 0.75] },
		medium: { layer: 'low', scale: [0.5, 0.9], fallback: ['mossy.medium'] }, low: { layer: 'low', scale: [0.6, 1], fallback: ['mossy.light'] },
	}],
	['mossy', { zones: ['moor', 'den', 'graveyard', 'bank', 'farm'], role: 'obstacle', layer: 'tall', natural: true, collision: true, substrates: DAMP.concat('rock'), maxSlope: 0.8, maxStep: 0.9, align: 'slope', sink: 0.15, scale: [0.5, 0.85], shrink: 0.9, feet: true, fallback: ['rocks.standard'] }, {
		standard: {}, standard_front: {}, standard_side: {}, standard_top: { layer: 'low', scale: [0.4, 0.7], fallback: ['rocks.standard_top'] },
		light: { layer: 'low', scale: [0.5, 0.9], fallback: ['rocks.low'] }, medium: { layer: 'low', scale: [0.5, 0.9], fallback: ['rocks.medium'] },
	}],
	['deadTrees', { zones: WILD, role: 'obstacle', layer: 'tall', natural: true, collision: true, substrates: DAMP, maxSlope: 0.7, maxStep: 0.8, sink: 0.03, scale: [0.9, 1.3], from: 'base', crown: 0.5, fallback: ['burnedTrees.standard'] }, {
		standard: {}, standard_front: {}, standard_side: {}, tall: { scale: [1, 1.35] }, tall_b: {}, hooked: { layer: 'tall' }, uprooted: {}, uprooted_b: { layer: 'low', from: 'full', crown: 0, fallback: ['burnedTrees.collapsed'] },
		sapling: { scale: [0.9, 1.2], collision: false, role: 'ground', fallback: [] },
		stump: { layer: 'low', from: 'full', crown: 0, scale: [0.5, 0.8], fallback: ['burnedTrees.stump'] },
		fallen: { layer: 'low', from: 'full', crown: 0, scale: [0.45, 0.6], fallback: ['burnedTrees.collapsed'] },
		roots: { layer: 'low', from: 'full', crown: 0, collision: false, role: 'ground', scale: [0.5, 0.7], align: 'slope', fallback: [] },
		branches: { layer: 'decal', from: 'full', crown: 0, collision: false, role: 'ground', scale: [0.45, 0.6], align: 'slope', fallback: [] },
		thorn_bush: { layer: 'low', from: 'full', crown: 0, collision: false, role: 'ground', scale: [0.5, 0.7], fallback: [] },
	}],
	['burnedTrees', { zones: ['moor', 'camp', 'farm', 'bank', 'graveyard'], role: 'obstacle', layer: 'tall', natural: true, collision: true, substrates: DRY, maxSlope: 0.7, maxStep: 0.8, sink: 0.03, scale: [0.8, 1.2], from: 'base', crown: 0.5, fallback: ['deadTrees.standard'] }, {
		standard: {}, standard_front: {}, standard_side: {}, reclaimed: {}, charcoal: {}, embers: {},
		stump: { layer: 'low', from: 'full', crown: 0, scale: [0.5, 0.8], fallback: ['deadTrees.stump'] },
		collapsed: { layer: 'low', from: 'full', crown: 0, scale: [0.45, 0.6], fallback: ['deadTrees.fallen'] },
	}],
	['shrubs', { zones: ['moor', 'farm', 'den', 'graveyard', 'bank', 'camp'], role: 'ground', layer: 'low', natural: true, collision: false, substrates: DRY, maxSlope: 0.6, maxStep: 0.5, sink: 0.05, scale: [0.8, 1.8], shrink: 0.8 }, Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`shrub_${String(i + 1).padStart(2, '0')}`, {}]))],
	['fence', { zones: ['farm', 'field', 'camp', 'moor', 'graveyard', 'den'], role: 'obstacle', layer: 'low', natural: false, collision: true, destructible: true, substrates: DRY, maxSlope: 0.6, maxStep: 0.4, sink: 0.03, scale: [0.95, 1.05], feet: true, fallback: ['fence.run2'] }, {
		broken_pair: {}, corner: {}, corner_low: {}, post_lean: { collision: false, role: 'ground', fallback: [] }, post_rails: {}, post_rails_b: {}, post_rails_long: {}, post_short: {},
		post_stubs: { collision: false, role: 'ground', fallback: [] }, rails_post: {}, run2: {}, run_broken: {}, run_end: {}, run_fallen: { collision: false, role: 'ground', fallback: [] }, run_sag: {},
	}],
	['palisade', { zones: ['camp'], role: 'obstacle', layer: 'tall', natural: false, collision: true, substrates: DRY, maxSlope: 0.5, maxStep: 0.5, sink: 0.04, scale: [1, 1], shrink: 0.9, feet: true, fallback: [] }, {
		wall_a: {}, wall_b: {}, wall_c: {}, wall_braced: {}, wall_crossbar: {}, wall_tall: {}, wall_short: {}, wall_slant: {}, wall_lean: {}, wall_broken: {}, wall_end: {},
		wall_angle: {}, wall_angle_b: {}, stake: {}, log_barrier: { layer: 'low', occludes: 0 },
	}],
	['tents', { zones: ['camp'], role: 'obstacle', layer: 'tall', natural: false, collision: true, substrates: DRY, maxSlope: 0.35, maxStep: 0.4, sink: 0.02, scale: [0.9, 1.05], shrink: 0.85, use: { side: 'front', depth: 2.2, width: 1.6 }, fallback: ['tentsB.quartermaster'] }, {
		a_frame: {}, ridge: {}, lean_to: { use: { side: 'front', depth: 1.8, width: 1.6 } }, pup: {}, sagging: {}, tattered: {}, market_stall: { use: { side: 'front', depth: 2.4, width: 2.4 } }, pavilion: { use: { side: 'front', depth: 2.6, width: 2.4 } },
	}],
	['tentsB', { zones: ['camp', 'moor'], role: 'obstacle', layer: 'tall', natural: false, collision: true, substrates: DRY, maxSlope: 0.35, maxStep: 0.4, sink: 0.02, scale: [0.9, 1.05], shrink: 0.85, use: { side: 'front', depth: 2, width: 1.8 }, fallback: ['tents.a_frame'] }, {
		bell: {}, burnt: { zones: ['moor', 'camp', 'farm'], natural: true }, cart_awning: { hostKinds: ['cart'] }, hide_shelter: {}, hospital: {}, quartermaster: {},
	}],
	['kitchen', { zones: SETTLED, role: 'obstacle', layer: 'low', natural: false, collision: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.4, sink: 0.03, scale: [0.95, 1.05], shrink: 0.9 }, {
		hearth: { layer: 'low', use: { side: 'all', depth: 0.8 }, host: 'campfire', fallback: [] },
		pot_tripod: { layer: 'tall', use: { side: 'all', depth: 0.7 }, light: [-0.1, 0.15, -0.05], fallback: [] },
		butcher_block: { layer: 'tall', use: { side: 'front', depth: 1 } },
		chopping_stump: { use: { side: 'front', depth: 0.7 } },
		drying_rack: { layer: 'tall', use: { side: 'front', depth: 0.8 } },
		firewood: { destructible: true }, water_barrel: { destructible: true },
	}],
	['storage', { zones: SETTLED.concat('moor'), role: 'obstacle', layer: 'low', natural: false, collision: true, destructible: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.35, sink: 0.03, scale: [0.95, 1.05], shrink: 0.9 }, {
		barrels: {}, barrel_cradle: {}, crate_stack: { layer: 'tall' }, sacks: {}, strongbox: { role: 'interactive', destructible: false, use: { side: 'front', depth: 1 } },
		spilled_crate: { collision: false, role: 'ground', destructible: false }, tarp_pile: { collision: false, role: 'ground', destructible: false },
	}],
	['training', { zones: ['camp', 'farm'], role: 'obstacle', layer: 'low', natural: false, collision: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.4, sink: 0.03, scale: [0.95, 1.05], shrink: 0.9 }, {
		anvil: { use: { side: 'front', depth: 0.8 } }, archery_butt: { layer: 'tall', use: { side: 'front', depth: 1.2 } },
		dummy: { layer: 'tall', use: { side: 'all', depth: 0.9 } }, grindstone: { use: { side: 'front', depth: 0.7 } },
		shield_rack: { use: { side: 'front', depth: 0.7 } }, weapon_rack: { layer: 'tall', use: { side: 'front', depth: 0.8 } },
	}],
	['crafts', { zones: SETTLED, role: 'obstacle', layer: 'tall', natural: false, collision: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.4, sink: 0.03, scale: [0.95, 1.05], shrink: 0.9 }, {
		fishing_net: { zones: ['bank', 'farm'], layer: 'low', collision: false, role: 'ground', substrates: DAMP }, fletcher_bench: { layer: 'low', use: { side: 'front', depth: 0.8 } },
		herb_rack: { use: { side: 'front', depth: 0.7 } }, hide_frame: { use: { side: 'front', depth: 0.8 } }, laundry_line: { collision: false, role: 'ground', layer: 'low' },
		leather_bench: { layer: 'low', use: { side: 'front', depth: 0.8 } },
	}],
	['lighting', { zones: ALL, role: 'guide', layer: 'tall', natural: false, collision: true, substrates: DRY_ROCK, maxSlope: 0.5, maxStep: 0.35, sink: 0.04, scale: [1, 1], shrink: 0.9, fallback: [] }, {
		torch: { light: [-0.09, 2.02, -0.05], fallback: ['lighting.lantern_post'] }, lantern_post: { light: [-0.56, 1.63, -0.05], fallback: ['lighting.torch'] },
		candles: { role: 'ground', layer: 'low', collision: false, light: [0.26, 1.02, 0.07], scale: [0.6, 0.8], substrates: DRY_ROCK.concat('blood') },
		brazier: { role: 'obstacle', layer: 'low', zones: SETTLED, substrates: DRY_ROCK.concat('blood') }, brazier_cold: { role: 'obstacle', layer: 'low', zones: SETTLED, substrates: DRY_ROCK.concat('blood') },
		beacon: { role: 'obstacle', layer: 'landmark', zones: ['camp'] },
	}],
	['banners', { zones: ['camp', 'farm', 'moor'], role: 'obstacle', layer: 'tall', natural: false, collision: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.35, sink: 0.03, scale: [1, 1], shrink: 0.8 }, {
		signpost: { role: 'guide', zones: ALL }, totem: { role: 'guide', zones: ['camp', 'den'], substrates: DRY.concat('blood') }, warding_pole: { role: 'guide', zones: ['camp'] },
		banner: { substrates: DRY.concat('blood') }, pennant_line: { collision: false, role: 'ground', layer: 'low', zones: ['camp'] }, alarm_bell: { zones: ['camp'] },
	}],
	['seating', { zones: SETTLED, role: 'ground', layer: 'low', natural: false, collision: false, substrates: DRY, maxSlope: 0.3, maxStep: 0.25, sink: 0.02, scale: [0.95, 1.05], shrink: 0.9 }, {
		log_bench: { role: 'obstacle', collision: true, use: { side: 'front', depth: 0.45 } },
		stump_circle: { role: 'obstacle', collision: true }, dice_barrel: { role: 'obstacle', collision: true, zones: ['camp'] },
		dining_table: { role: 'obstacle', collision: true, use: { side: 'all', depth: 0.7 }, zones: ['camp'] },
		bedroll: { layer: 'decal' }, rug: { layer: 'decal', zones: ['camp'] },
	}],
	['shrine', { zones: ['graveyard', 'moor'], role: 'obstacle', layer: 'low', natural: false, collision: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.4, sink: 0.05, scale: [1, 1], shrink: 0.9 }, {
		shrine: { role: 'interactive', layer: 'tall', use: { side: 'front', depth: 1.4 }, hostKinds: ['shrine'] },
		altar: { role: 'interactive', layer: 'tall', zones: ['camp', 'graveyard'], substrates: DRY.concat('blood'), use: { side: 'front', depth: 1.4 }, hostKinds: ['altar'] },
		cairn: { natural: true, layer: 'tall', use: { side: 'front', depth: 0.6 } },
		fresh_grave: { hostKinds: ['grave'] }, grave_row: { use: { side: 'front', depth: 0.7 }, hostKinds: ['grave'] },
		covered_body: { collision: false, role: 'ground', zones: ['graveyard', 'farm', 'moor', 'camp'], substrates: DRY.concat('blood') },
	}],
	['animals', { zones: ['farm'], role: 'obstacle', layer: 'low', natural: false, collision: true, substrates: DRY, maxSlope: 0.4, maxStep: 0.4, sink: 0.03, scale: [0.95, 1.05], shrink: 0.9 }, {
		chicken_coop: { layer: 'tall', use: { side: 'front', depth: 0.8 } }, goat_pen: { use: { side: 'front', depth: 1 } }, haystack: { layer: 'tall', natural: true, destructible: true },
		mule: { zones: ['farm', 'camp'], role: 'ground', collision: false, layer: 'tall' }, trough: { use: { side: 'front', depth: 0.6 } },
		wheelbarrow: { collision: false, role: 'ground', zones: ['farm', 'camp', 'moor'] },
	}],
	['clutter', { zones: ALL, role: 'ground', layer: 'decal', natural: true, collision: false, substrates: DRY.concat('mud', 'blood'), maxSlope: 0.7, maxStep: 0.4, align: 'slope', sink: 0.03, scale: [0.6, 1.1], shrink: 0.9 }, {
		arrows: { layer: 'low' }, bones: { scale: [0.7, 1.1] }, boot_prints: {}, broken_planks: { layer: 'low', zones: ['farm', 'camp', 'moor'] }, helmet_spear: { layer: 'low', zones: ['farm', 'camp', 'moor'] },
		pots: { layer: 'low', zones: SETTLED.concat('moor') }, rope_bucket: { layer: 'low', zones: SETTLED.concat('moor') }, spilled_sack: { layer: 'low', zones: SETTLED.concat('moor') }, straw: {},
	}],
	['stations', { zones: ['camp', 'farm'], role: 'obstacle', layer: 'tall', natural: false, collision: true, substrates: DRY, maxSlope: 0.35, maxStep: 0.4, sink: 0.03, scale: [0.95, 1.05], shrink: 0.9, use: { side: 'front', depth: 1 } }, {
		alchemy_table: { zones: ['camp'] }, cooper: { layer: 'low' }, forge: { use: { side: 'front', depth: 1.2 }, host: 'smithy' }, map_table: { zones: ['camp'] },
		sawhorse: { layer: 'low', zones: ['farm', 'camp'] }, tanning_vats: { host: 'tannery', substrates: DRY.concat('mud') },
	}],
	['corpses', { zones: ['den', 'moor', 'farm', 'camp', 'graveyard', 'bank'], role: 'ground', layer: 'low', natural: true, collision: false, substrates: DAMP.concat('blood'), maxSlope: 0.7, maxStep: 0.5, align: 'slope', sink: 0.12, scale: [0.5, 0.75], shrink: 0.85, hostKinds: ['carcass'] }, {
		beast: {}, crawler: { zones: ['bank', 'moor', 'den', 'farm'] }, imp_half: {}, imp_old: {}, imp_reaching: {}, imp_reaching_b: {},
	}],
];

/** Pieces whose placement ids would clash with a camp kit of the same name never occur: ids are `${kit}.${piece}`. */
export const ASSETS = DECLS.flatMap(([kit, defaults, pieces]) => Object.entries(pieces).map(([piece, over]) => ({ id: `${kit}.${piece}`, kit, piece, ...defaults, ...over })));

/** Auto-mass sets (AD 12 §4.8 "Đá, cây": one main + smaller pieces of other sizes), by what the ground says. */
export const MASS_SETS = Object.freeze({
	rock: {
		bare: { main: ['rocks.standard', 'rocks.standard_front', 'rocks.standard_side', 'rocks.cluster'], tall: ['rocks.tall', 'rocks.ledge', 'rocks.cluster'], secondary: ['rocks.medium', 'rocks.low', 'rocks.standard_top'] },
		mossy: { main: ['mossy.standard', 'mossy.standard_front', 'mossy.standard_side'], tall: ['mossy.standard_front', 'mossy.standard_side'], secondary: ['mossy.light', 'mossy.medium', 'mossy.standard_top'] },
	},
	tree: {
		dead: { main: ['deadTrees.standard', 'deadTrees.standard_front', 'deadTrees.standard_side', 'deadTrees.tall_b', 'deadTrees.hooked', 'deadTrees.uprooted'], tall: ['deadTrees.tall', 'deadTrees.standard_front'], secondary: ['deadTrees.stump', 'deadTrees.branches', 'deadTrees.thorn_bush', 'deadTrees.roots', 'deadTrees.fallen'] },
		burned: { main: ['burnedTrees.standard', 'burnedTrees.reclaimed', 'burnedTrees.charcoal', 'burnedTrees.embers'], tall: ['burnedTrees.standard_front', 'burnedTrees.standard_side'], secondary: ['burnedTrees.stump', 'burnedTrees.collapsed', 'deadTrees.branches'] },
	},
	/** AD 12 §4.3 landmark: ≥ 2 H. Only pieces whose OWN scale range reaches 2 H (height × max scale ≥ 2 H); the engine scales them up inside that range. */
	landmark: ['deadTrees.tall', 'deadTrees.standard_front', 'deadTrees.standard_side', 'burnedTrees.standard_front', 'burnedTrees.standard_side'],
});

/** Small shrubs of the ecology layer (kit shrubs), by the height class the zone wants. */
export const SHRUB_SETS = Object.freeze({
	low: ['shrubs.shrub_01', 'shrubs.shrub_04', 'shrubs.shrub_05', 'shrubs.shrub_10', 'shrubs.shrub_11', 'shrubs.shrub_13', 'shrubs.shrub_14', 'shrubs.shrub_15', 'shrubs.shrub_16', 'shrubs.shrub_17'],
	tall: ['shrubs.shrub_02', 'shrubs.shrub_03', 'shrubs.shrub_06', 'shrubs.shrub_07', 'shrubs.shrub_08', 'shrubs.shrub_09', 'shrubs.shrub_12', 'shrubs.shrub_18'],
});

/**
 * Functional clusters (AD 12 §4.6.3, §4.8): a host and members drawn ONLY from the recipe. Members: asset ids (first =
 * preferred, the rest are alternatives drawn by weight), n = count range, slot = where in the host's frame
 * (front | back | side | ring | near | rest), face = how it turns (axis: host axes ± jitter | rest | host | out | free).
 * `hostKinds` = what an event may call the cluster when it hosts a trace (TRACES[*].hosts).
 * `count` bounds the members; `rest` = the point seats face (host centre).
 */
export const CLUSTERS = Object.freeze({
	campfire: {
		hostKinds: ['camp', 'fire'],
		label: 'Chỗ nghỉ quanh lửa', source: 'AD12 §4.8 (ghế hướng vào chỗ nghỉ), §4.11 trại địch',
		host: ['kitchen.hearth', 'kitchen.pot_tripod'], hostReach: 1.5, count: [4, 9], rest: 'host', bare: 3.5,
		members: [
			{ asset: ['seating.log_bench'], n: [2, 3], slot: 'rest', face: 'rest', gap: [0.2, 0.7] },
			{ asset: ['seating.bedroll'], n: [1, 2], slot: 'rest', face: 'rest', gap: [1.1, 1.8] },
			{ asset: ['kitchen.firewood'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.12, gap: [0.3, 1] },
			{ asset: ['kitchen.water_barrel', 'storage.barrels'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.12, gap: [0.4, 1.2] },
			{ asset: ['clutter.bones', 'clutter.pots'], n: [0, 2], slot: 'near', face: 'free', gap: [0.6, 1.6] },
			{ asset: ['seating.dice_barrel'], n: [0, 1], slot: 'side', face: 'host', gap: [0.2, 0.8] },
		],
	},
	tent: {
		hostKinds: ['camp', 'tent'],
		label: 'Lều và đồ cạnh lều', source: 'AD12 §4.8 lều có vùng trống trước cửa; §4.11 trại địch',
		host: ['tents.a_frame', 'tents.ridge', 'tents.pup', 'tents.tattered', 'tents.lean_to'], hostReach: 1.5, count: [1, 3], rest: 'host', bare: 2,
		members: [
			{ asset: ['storage.barrels', 'storage.sacks'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.12, gap: [0.3, 1] },
			{ asset: ['kitchen.firewood', 'clutter.pots'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.12, gap: [0.3, 1] },
			{ asset: ['seating.bedroll', 'clutter.straw'], n: [0, 1], slot: 'front', face: 'axis', worn: 0.12, gap: [0.1, 0.5] },
		],
	},
	kitchen: {
		hostKinds: ['camp'],
		label: 'Bếp ngoài trời', source: 'AD12 §4.6.3 chỗ làm việc, §4.8 giá đồ cạnh chỗ làm',
		host: ['kitchen.pot_tripod'], hostReach: 1.5, count: [3, 7], rest: 'host', bare: 2.5,
		members: [
			{ asset: ['kitchen.butcher_block'], n: [0, 1], slot: 'side', face: 'host', worn: 0.1, gap: [0.2, 0.7] },
			{ asset: ['kitchen.chopping_stump'], n: [0, 1], slot: 'side', face: 'host', gap: [0.2, 0.7] },
			{ asset: ['kitchen.drying_rack'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.1, gap: [0.3, 0.9] },
			{ asset: ['kitchen.firewood'], n: [1, 1], slot: 'back', face: 'axis', worn: 0.1, gap: [0.2, 0.8] },
			{ asset: ['kitchen.water_barrel', 'storage.barrels'], n: [1, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.4, 1] },
			{ asset: ['clutter.pots'], n: [0, 2], slot: 'near', face: 'free', gap: [0.4, 1.2] },
		],
	},
	hunt: {
		hostKinds: ['camp'],
		label: 'Khu xử lý thịt', source: 'AD12 §4.6.3 săn mồi, §4.10 tập trung cạnh bàn mổ, §4.11 trại địch',
		host: ['kitchen.butcher_block'], hostReach: 1.5, count: [3, 7], rest: 'host', bare: 2.5,
		members: [
			{ asset: ['kitchen.drying_rack'], n: [1, 1], slot: 'side', face: 'axis', worn: 0.14, gap: [0.3, 0.8] },
			{ asset: ['crafts.hide_frame'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.14, gap: [0.3, 1] },
			{ asset: ['kitchen.firewood', 'kitchen.chopping_stump'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.14, gap: [0.3, 0.9] },
			{ asset: ['clutter.bones'], n: [1, 3], slot: 'near', face: 'free', gap: [0.5, 1.4] },
			{ asset: ['storage.spilled_crate', 'clutter.spilled_sack'], n: [0, 1], slot: 'ring', face: 'free', gap: [0.8, 1.8] },
		],
	},
	tannery: {
		hostKinds: ['camp'],
		label: 'Xưởng thuộc da', source: 'AD12 §4.11 trại địch (da, xương cạnh khu xử lý)',
		host: ['stations.tanning_vats'], hostReach: 1.5, count: [3, 6], rest: 'host', bare: 3,
		members: [
			{ asset: ['crafts.hide_frame'], n: [1, 1], slot: 'side', face: 'axis', worn: 0.12, gap: [0.3, 0.8] },
			{ asset: ['crafts.leather_bench'], n: [1, 1], slot: 'front', face: 'host', worn: 0.1, gap: [0.2, 0.8] },
			{ asset: ['kitchen.drying_rack'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.12, gap: [0.3, 0.9] },
			{ asset: ['clutter.bones'], n: [1, 2], slot: 'near', face: 'free', gap: [0.5, 1.5] }, // the small pieces of the rhythm (§4.3)
			{ asset: ['clutter.straw', 'storage.tarp_pile'], n: [0, 1], slot: 'ring', face: 'free', gap: [0.7, 1.6] },
		],
	},
	storage: {
		hostKinds: ['camp'],
		label: 'Kho đồ', source: 'AD12 §4.6.3 tích trữ, §4.8 thùng sát kho/tường',
		host: ['storage.crate_stack'], hostReach: 1.5, count: [2, 6], rest: 'host', bare: 1.5,
		members: [
			{ asset: ['storage.barrels'], n: [1, 2], slot: 'back', face: 'axis', worn: 0.1, gap: [0.2, 0.8] },
			{ asset: ['storage.sacks'], n: [0, 2], slot: 'side', face: 'axis', worn: 0.1, gap: [0.2, 0.8] },
			{ asset: ['storage.barrel_cradle', 'storage.tarp_pile'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.3, 1] },
			{ asset: ['storage.strongbox'], n: [0, 1], slot: 'near', face: 'host', gap: [0.6, 1.4] },
			{ asset: ['storage.spilled_crate', 'clutter.spilled_sack'], n: [0, 1], slot: 'ring', face: 'free', gap: [0.7, 1.6] },
		],
	},
	smithy: {
		hostKinds: ['camp'],
		label: 'Lò rèn dã chiến', source: 'AD12 §4.6.3 chỗ làm việc (smithy), §4.8',
		host: ['stations.forge'], hostReach: 1.5, count: [3, 6], rest: 'host', bare: 3,
		members: [
			{ asset: ['training.anvil'], n: [1, 1], slot: 'front', face: 'host', gap: [0.1, 0.5] },
			{ asset: ['training.grindstone'], n: [0, 1], slot: 'side', face: 'host', worn: 0.1, gap: [0.3, 0.9] },
			{ asset: ['kitchen.firewood'], n: [1, 1], slot: 'back', face: 'axis', worn: 0.1, gap: [0.2, 0.8] },
			{ asset: ['kitchen.water_barrel'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.3, 0.9] },
			{ asset: ['training.weapon_rack'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.1, gap: [0.4, 1.1] },
		],
	},
	training: {
		hostKinds: ['camp'],
		label: 'Bãi tập', source: 'AD12 §4.6.3 chỗ làm việc, §4.8 giá đồ cạnh chỗ làm',
		host: ['training.dummy'], hostReach: 1.5, count: [2, 5], rest: 'host', bare: 4,
		members: [
			{ asset: ['training.weapon_rack'], n: [1, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.8, 1.8] },
			{ asset: ['training.shield_rack'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.8, 1.8] },
			{ asset: ['training.archery_butt'], n: [0, 1], slot: 'back', face: 'host', gap: [2.5, 4] },
			{ asset: ['clutter.arrows'], n: [0, 2], slot: 'ring', face: 'free', gap: [1, 2.5] },
			{ asset: ['crafts.fletcher_bench'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [1, 2] }, // the bigger piece beside the small racks (§4.3)
		],
	},
	ritual: {
		hostKinds: ['altar', 'camp'],
		label: 'Bàn thờ nghi lễ', source: 'AD12 §4.6.3 nghi lễ, §4.10 nghi lễ = bố trí có chủ ý',
		host: ['shrine.altar'], hostReach: 1.5, count: [3, 7], rest: 'host', bare: 3.5,
		members: [
			{ asset: ['lighting.candles'], n: [1, 2], slot: 'front', face: 'host', gap: [0.2, 0.7] },
			{ asset: ['lighting.brazier', 'lighting.brazier_cold'], n: [2, 2], slot: 'side', face: 'axis', gap: [0.6, 1.2] },
			{ asset: ['banners.totem', 'banners.banner'], n: [1, 1], slot: 'back', face: 'axis', gap: [0.4, 1] },
			{ asset: ['clutter.bones', 'clutter.pots'], n: [0, 2], slot: 'near', face: 'free', gap: [0.7, 1.6] },
		],
	},
	pen: {
		hostKinds: ['farm'],
		label: 'Chuồng gia súc', source: 'AD12 §4.8 lều, hàng rào theo nền đất và lối ra vào; §4.11 nông trại',
		host: ['animals.goat_pen'], hostReach: 1.5, count: [3, 6], rest: 'host', bare: 2,
		members: [
			{ asset: ['animals.trough'], n: [1, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.3, 0.9] },
			{ asset: ['animals.haystack'], n: [1, 1], slot: 'back', face: 'axis', worn: 0.14, gap: [0.3, 1] },
			{ asset: ['fence.run2', 'fence.run_end'], n: [1, 2], slot: 'side', face: 'axis', worn: 0.08, gap: [0.2, 0.8] },
			{ asset: ['animals.wheelbarrow', 'clutter.straw'], n: [0, 1], slot: 'near', face: 'free', gap: [0.6, 1.6] },
			{ asset: ['animals.chicken_coop'], n: [0, 1], slot: 'ring', face: 'axis', worn: 0.1, gap: [1, 2.2] },
		],
	},
	farmyard: {
		hostKinds: ['building', 'farm'],
		label: 'Sân nhà nông trại', source: 'AD12 §4.11 nông trại bỏ hoang (đồ nghề cạnh chỗ làm, đồ rơi gần cửa)',
		host: null, hostReach: 0, count: [3, 7], rest: 'host', bare: 0,
		members: [
			{ asset: ['storage.barrels', 'storage.crate_stack'], n: [1, 2], slot: 'side', face: 'axis', worn: 0.12, gap: [0.3, 1.2] },
			{ asset: ['kitchen.water_barrel'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.12, gap: [0.3, 1] },
			{ asset: ['seating.log_bench'], n: [0, 1], slot: 'front', face: 'axis', worn: 0.12, gap: [1.4, 2.2] },
			{ asset: ['kitchen.firewood', 'kitchen.chopping_stump'], n: [1, 1], slot: 'back', face: 'axis', worn: 0.12, gap: [0.3, 1] },
			{ asset: ['crafts.laundry_line', 'crafts.herb_rack'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.1, gap: [0.8, 1.8] },
			{ asset: ['clutter.pots', 'clutter.spilled_sack'], n: [0, 2], slot: 'near', face: 'free', gap: [0.4, 1.2] },
		],
	},
	graves: {
		hostKinds: ['grave'],
		label: 'Hàng mộ', source: 'AD12 §4.11 nghĩa địa (mộ có hướng bố trí văn hóa)',
		host: ['shrine.grave_row'], hostReach: 1.2, count: [2, 6], rest: 'host', bare: 0,
		members: [
			{ asset: ['shrine.fresh_grave'], n: [1, 3], slot: 'side', face: 'axis', worn: 0.06, gap: [0.6, 1.2] },
			{ asset: ['shrine.grave_row'], n: [0, 1], slot: 'back', face: 'axis', worn: 0.06, gap: [1, 1.8] },
			{ asset: ['shrine.cairn'], n: [1, 1], slot: 'ring', face: 'axis', worn: 0.06, gap: [1.5, 2.5] }, // the one bigger mark among the small graves (§4.3 rhythm)
			{ asset: ['deadTrees.sapling', 'rocks.low'], n: [0, 1], slot: 'ring', face: 'free', gap: [1.5, 3] },
		],
	},
	wayside: {
		hostKinds: ['shrine'],
		label: 'Miếu ven đường', source: 'AD12 §4.8 vật tương tác (chừa chỗ tiếp cận), §4.11 nghĩa địa',
		host: ['shrine.shrine'], hostReach: 1, count: [1, 4], rest: 'host', bare: 0,
		members: [
			{ asset: ['lighting.candles'], n: [1, 1], slot: 'front', face: 'host', gap: [0.1, 0.4] },
			{ asset: ['shrine.cairn'], n: [0, 1], slot: 'side', face: 'axis', worn: 0.08, gap: [0.8, 1.6] },
			{ asset: ['clutter.pots', 'clutter.bones'], n: [0, 1], slot: 'near', face: 'free', gap: [0.8, 1.8] },
		],
	},
});

/**
 * Trace recipes (AD 12 §4.10): the cause first, then pieces from that cause only. main = the point of the event,
 * secondary lean to one side, drag = 0–2 smaller pieces further along the drag direction. `age` filters entries
 * (old: dry bone, dark old stains; fresh: wet). `paint` = ground paint requested under each piece (dirt / damp).
 */
export const TRACES = Object.freeze({
	predation: {
		label: 'Thú ăn mồi', source: 'AD12 §4.10.1–3: xương thú, vết kéo, lông; tập trung ở miệng hang/xác',
		hosts: ['den', 'carcass'], pattern: 'lean',
		main: [{ asset: 'corpses.beast', age: 'old', scale: [0.65, 0.8] }, { asset: 'corpses.crawler', age: 'any', scale: [0.6, 0.75] }, { asset: 'clutter.bones', age: 'any', scale: [1, 1.3] }],
		secondary: [{ asset: 'clutter.bones', w: 4, scale: [0.6, 1] }, { asset: 'corpses.imp_old', age: 'old', w: 1, scale: [0.4, 0.55] }, { asset: 'clutter.straw', w: 1, scale: [0.6, 0.9] }],
		drag: [{ asset: 'clutter.bones', scale: [0.5, 0.8] }], paint: { dirt: 1, wet: 0.35 },
	},
	raid: {
		label: 'Cướp trại', source: 'AD12 §4.10.1: đồ cá nhân, vũ khí gãy, xác',
		hosts: ['camp', 'door', 'cart'], pattern: 'lean',
		main: [{ asset: 'clutter.helmet_spear', age: 'any', scale: [0.9, 1.1] }, { asset: 'storage.spilled_crate', age: 'any', scale: [0.9, 1.1] }],
		secondary: [{ asset: 'clutter.arrows', w: 2, scale: [0.8, 1.1] }, { asset: 'clutter.broken_planks', w: 2, scale: [0.6, 0.9] }, { asset: 'clutter.spilled_sack', w: 1, scale: [0.8, 1.1] }, { asset: 'clutter.pots', w: 1, scale: [0.7, 1] }, { asset: 'clutter.bones', age: 'fresh', w: 1, scale: [0.6, 0.9] }],
		drag: [{ asset: 'clutter.arrows', scale: [0.6, 0.9] }], paint: { dirt: 0.7, wet: 0.2 },
	},
	grave: {
		label: 'Mộ bị đào', source: 'AD12 §4.10.1: đất mới, nắp vỡ, hài cốt',
		hosts: ['grave'], pattern: 'lean',
		main: [{ asset: 'shrine.covered_body', age: 'any', scale: [0.9, 1.1] }],
		secondary: [{ asset: 'clutter.bones', w: 3, scale: [0.6, 1] }, { asset: 'clutter.broken_planks', w: 2, scale: [0.5, 0.8] }, { asset: 'clutter.straw', w: 1, scale: [0.7, 1] }],
		drag: [{ asset: 'clutter.bones', scale: [0.5, 0.7] }], paint: { dirt: 1, wet: 0.6 },
	},
	ritual: {
		label: 'Nghi lễ dở dang', source: 'AD12 §4.10.1: nghi lễ = bố trí có chủ ý',
		hosts: ['altar', 'shrine'], pattern: 'ring',
		main: [{ asset: 'lighting.candles', age: 'any', scale: [0.7, 0.8] }],
		secondary: [{ asset: 'clutter.bones', w: 2, scale: [0.6, 0.9] }, { asset: 'clutter.pots', w: 2, scale: [0.6, 0.9] }],
		drag: [], paint: { dirt: 0.5, wet: 0.3 },
	},
	collapse: {
		label: 'Mái sập, đồ đổ vỡ', source: 'AD12 §4.8 đồ đổ vỡ có nguồn: mái sập (vật nặng gần nguồn, mảnh nhẹ xa hơn)',
		hosts: ['building'], pattern: 'lean',
		main: [{ asset: 'clutter.broken_planks', age: 'any', scale: [1, 1.2] }, { asset: 'storage.spilled_crate', age: 'any', scale: [0.9, 1.1] }],
		secondary: [{ asset: 'clutter.broken_planks', w: 3, scale: [0.6, 0.9] }, { asset: 'clutter.pots', w: 1, scale: [0.7, 1] }, { asset: 'clutter.spilled_sack', w: 1, scale: [0.7, 1] }],
		drag: [{ asset: 'clutter.broken_planks', scale: [0.5, 0.7] }], paint: { dirt: 0.6, wet: 0.1 },
	},
	spill: {
		label: 'Xe lật', source: 'AD12 §4.8 đồ đổ vỡ có nguồn: xe lật, bao rách',
		hosts: ['cart'], pattern: 'lean',
		main: [{ asset: 'storage.spilled_crate', age: 'any', scale: [1, 1.2] }],
		secondary: [{ asset: 'storage.sacks', w: 2, scale: [0.8, 1] }, { asset: 'clutter.spilled_sack', w: 2, scale: [0.8, 1.1] }, { asset: 'clutter.rope_bucket', w: 1, scale: [0.8, 1.1] }, { asset: 'clutter.straw', w: 1, scale: [0.8, 1.1] }],
		drag: [{ asset: 'clutter.spilled_sack', scale: [0.5, 0.8] }], paint: { dirt: 0.8, wet: 0.2 },
	},
});

/**
 * Wayfinding policies (AD 12 §4.9): which markers a decision gets, by who maintains the place. torch = inhabited roads,
 * camps, farms; natural = rock / dead tree / carcass only (den, moor, animal trails: no artificial torch to fill the dark).
 * `pair` = gate pair of the same marker (important gates only).
 */
export const GUIDES = Object.freeze({
	torch: {
		label: 'Có người duy trì', source: 'AD12 §4.9: đuốc trước ngã rẽ, cạnh cổng, đầu cầu; biển ở ngã ba',
		fork: ['banners.signpost'], bend: ['lighting.torch'], bridge: ['lighting.torch'], gate: ['lighting.lantern_post', 'lighting.torch'], entrance: ['lighting.torch'], confirm: ['lighting.torch'], pair: ['lighting.torch'],
	},
	camp: {
		label: 'Trại địch', source: 'AD12 §4.11 trại địch: đuốc cổng và lối chính; cột/totem cảnh báo',
		fork: ['banners.totem'], bend: ['banners.warding_pole'], bridge: ['lighting.torch'], gate: ['lighting.torch'], entrance: ['lighting.torch'], confirm: ['banners.warding_pole'], pair: ['lighting.torch'],
	},
	natural: {
		label: 'Mốc tự nhiên', source: 'AD12 §4.9, §4.11 hang thú/đồng hoang: đá, cây, dấu chân, xác; không tự sinh đuốc',
		fork: ['rocks.medium', 'rocks.standard_side'], bend: ['deadTrees.hooked', 'deadTrees.sapling', 'rocks.low'], bridge: ['rocks.medium'], gate: ['rocks.standard_front'], entrance: ['corpses.beast', 'corpses.crawler', 'rocks.low'], confirm: ['rocks.low'], pair: [],
	},
});

/**
 * Sub-zone profiles (AD 12 §4.11). grass/shrubs/tall scale the ecology; mass = auto-mass kind weights; guide = GUIDES
 * policy; lit = an inhabited path may still get torches here (moor yes, den never); bare = ecology keeps this far off the
 * hosts (open ground round fires and tents); yard = trampled radius round doors; rows = broken crop rows (field only);
 * bonesMul scales trace density.
 */
export const ZONE_PROFILES = Object.freeze({
	moor: { label: 'Đồng hoang', source: 'AD12 §4.11 dòng 1', grass: 1, shrubs: 0.7, tall: true, mass: { rock: 1, tree: 0.5 }, guide: 'natural', lit: true, yard: 0, bonesMul: 0.4, tone: 0.1 },
	farm: { label: 'Nông trại bỏ hoang', source: 'AD12 §4.11 dòng 2', grass: 0.6, shrubs: 0.5, tall: true, mass: { rock: 0.2, tree: 0.35 }, guide: 'torch', lit: true, yard: 6, wall: 1.7, bonesMul: 0.6, tone: 0.2 },
	field: { label: 'Ruộng', source: 'AD12 §4.7 quy luật riêng của ruộng', grass: 0.12, shrubs: 0, tall: false, mass: { rock: 0, tree: 0 }, guide: 'torch', lit: true, yard: 0, bonesMul: 0.2, tone: 0.5, rows: { spacing: 0.9, step: 0.55, gapRun: [2, 6], gapChance: 0.1, miss: 0.2, height: [0.16, 0.28] } },
	camp: { label: 'Trại địch', source: 'AD12 §4.11 dòng 3', grass: 0.3, shrubs: 0.1, tall: false, mass: { rock: 0.25, tree: 0.15 }, guide: 'camp', lit: true, yard: 0, bonesMul: 1.2, tone: 0.3 },
	den: { label: 'Hang thú', source: 'AD12 §4.11 dòng 4', grass: 0.7, shrubs: 0.3, tall: false, mass: { rock: 1.2, tree: 0.8 }, guide: 'natural', lit: false, yard: 0, bonesMul: 1.6, tone: 0.25 },
	graveyard: { label: 'Nghĩa địa', source: 'AD12 §4.11 dòng 5', grass: 0.8, shrubs: 0.6, tall: false, mass: { rock: 0.3, tree: 0.6 }, guide: 'torch', lit: true, yard: 0, bonesMul: 0.5, tone: 0.35, feet: 1.6 },
	bank: { label: 'Bờ nước / đất nhiễm huyết', source: 'AD12 §4.11 dòng 6', grass: 0.5, shrubs: 0.8, tall: false, mass: { rock: 0.8, tree: 0.2 }, guide: 'torch', lit: true, yard: 0, bonesMul: 0.3, tone: 0, bank: true },
});

// ---------------------------------------------------------------------------------------------------------------
// Resolving

const mean = (r) => (r[0] + r[1]) / 2;

/**
 * Size classes by footprint area at the mean scale (AD 12 §4.3 "1 lớn – 2 trung – 3+ nhỏ"): the thresholds sit on the area quantiles
 * of the declared pieces (≈ 50 % of them small, ≈ 15 % large), so a cluster can show the rhythm instead of being all "medium".
 */
export const SIZE_CLASS = Object.freeze({ small: 3, large: 8 });

/** Layer class of a fallback check: low = decal | low, tall = tall | edge | landmark (the ones that hide the ground behind them). */
export const layerClass = (layer) => (layer === 'decal' || layer === 'low' ? 'low' : 'tall');

function sizeOf(asset) {
	const s = mean(asset.scale);
	const area = (asset.footprint.x1 - asset.footprint.x0) * (asset.footprint.z1 - asset.footprint.z0) * s * s;
	if (area >= SIZE_CLASS.large) return 'large';
	if (area < SIZE_CLASS.small) return 'small';
	return 'medium';
}

function boxOf(m, from) {
	const b = from === 'base' ? m.base : m;
	return { x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 };
}

function shrinkBox(box, k) {
	const cx = (box.x0 + box.x1) / 2, cz = (box.z0 + box.z1) / 2, hx = ((box.x1 - box.x0) / 2) * k, hz = ((box.z1 - box.z0) / 2) * k;
	return { x0: cx - hx, x1: cx + hx, z0: cz - hz, z1: cz + hz };
}

/**
 * The catalog the engine reads. `sizes` = kitSizes.json; `available` = Set of asset ids and/or kit keys that exist in the
 * scene (null = everything), so a kit that failed to load simply drops out and its fallbacks take over.
 */
export function buildCatalog({ sizes, available = null } = {}) {
	const assets = new Map();
	const missing = [];
	for (const decl of ASSETS) {
		const m = sizes?.[decl.id];
		if (!m) missing.push(decl.id);
		const full = m ? { x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1 } : { x0: -0.5, x1: 0.5, z0: -0.5, z1: 0.5 };
		const height = m?.height ?? 1;
		const base = decl.from === 'base' && m ? boxOf(m, 'base') : full;
		const footprint = shrinkBox(base, decl.shrink ?? 1);
		const asset = {
			id: decl.id, kit: decl.kit, piece: decl.piece, zones: decl.zones ?? [], role: decl.role, layer: decl.layer,
			footprint, full, height, use: decl.use ?? null, front: decl.front ?? 0, scale: decl.scale ?? [1, 1],
			substrates: decl.substrates ?? DRY, maxSlope: decl.maxSlope ?? 0.5, maxStep: decl.maxStep ?? 0.5, align: decl.align ?? 'upright',
			sink: decl.sink ?? 0.03, natural: !!decl.natural, collision: !!decl.collision, destructible: !!decl.destructible,
			host: decl.host ?? null, hostKinds: decl.hostKinds ?? [], crown: decl.crown ?? 0, light: decl.light ?? null, fallback: decl.fallback ?? [], feet: !!decl.feet,
			measured: !!m,
		};
		asset.occludes = decl.occludes ?? (asset.layer === 'tall' || asset.layer === 'edge' || asset.layer === 'landmark' ? height : 0);
		asset.size = decl.size ?? sizeOf(asset);
		assets.set(asset.id, asset);
	}
	const isAvailable = (asset) => !!asset && (available == null || available.has(asset.id) || available.has(asset.kit));
	const catalog = {
		assets, missing, clusters: CLUSTERS, traces: TRACES, guides: GUIDES, zones: ZONE_PROFILES, massSets: MASS_SETS, shrubSets: SHRUB_SETS,
		get: (id) => assets.get(id) ?? null,
		available: (id) => isAvailable(assets.get(id)),
		/**
		 * The assets that exist in this scene: first every alternative of the recipe entry (in the order given), then — only
		 * after all of them — the fallbacks of those alternatives (two levels, breadth first). The engine places list[0], so a
		 * fallback is used only when no alternative of the recipe is in the scene.
		 */
		resolve(ids) {
			const out = [];
			const seen = new Set();
			const first = Array.isArray(ids) ? ids : [ids];
			for (const id of first) {
				const a = assets.get(id);
				if (!a || seen.has(id)) continue;
				seen.add(id);
				if (isAvailable(a)) out.push(a);
			}
			let frontier = first;
			for (let depth = 0; depth < 2; depth++) {
				const next = [];
				for (const id of frontier) {
					for (const f of assets.get(id)?.fallback ?? []) {
						const a = assets.get(f);
						if (!a || seen.has(f)) continue;
						seen.add(f);
						if (isAvailable(a)) out.push(a);
						next.push(f);
					}
				}
				frontier = next;
			}
			return out;
		},
	};
	return catalog;
}

/** Ids referenced by recipes, sets and policies that are not declared, and fallbacks that change the class (the test suite asserts this is empty). */
export function catalogProblems(catalog) {
	const out = [];
	const known = (id, where) => { if (!catalog.assets.has(id)) out.push(`${where}: ${id}`); };
	for (const [name, r] of Object.entries(CLUSTERS)) {
		(r.host ?? []).forEach((id) => known(id, `cluster ${name} host`));
		r.members.forEach((m) => m.asset.forEach((id) => known(id, `cluster ${name}`)));
	}
	for (const [name, t] of Object.entries(TRACES)) for (const k of ['main', 'secondary', 'drag']) t[k].forEach((e) => known(e.asset, `trace ${name}.${k}`));
	for (const [name, g] of Object.entries(GUIDES)) for (const ids of Object.values(g)) if (Array.isArray(ids)) ids.forEach((id) => known(id, `guide ${name}`));
	for (const group of Object.values(MASS_SETS.rock)) for (const ids of Object.values(group)) ids.forEach((id) => known(id, 'mass rock'));
	for (const group of Object.values(MASS_SETS.tree)) for (const ids of Object.values(group)) ids.forEach((id) => known(id, 'mass tree'));
	MASS_SETS.landmark.forEach((id) => known(id, 'landmark'));
	for (const ids of Object.values(SHRUB_SETS)) ids.forEach((id) => known(id, 'shrub'));
	for (const a of catalog.assets.values()) {
		for (const id of a.fallback) {
			known(id, `fallback of ${a.id}`);
			const b = catalog.assets.get(id);
			// a fallback never changes what the piece is to the player: collision, role and layer class (AD 12 §4.12 "không đổi vai trò collision")
			if (b && (b.collision !== a.collision || b.role !== a.role || layerClass(b.layer) !== layerClass(a.layer))) out.push(`fallback ${a.id} → ${id} changes collision, role or layer class`);
		}
		a.zones.forEach((z) => { if (!ZONE_KINDS.includes(z)) out.push(`${a.id}: unknown zone ${z}`); });
	}
	return out;
}

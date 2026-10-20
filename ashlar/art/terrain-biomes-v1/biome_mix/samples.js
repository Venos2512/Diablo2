// Mini-biome sample definitions. Layers go bottom -> top (priority order); the later a layer, the larger its small
// bias in the height blend. role: base (1 everywhere) | patch (warped fBm blobs) | path (band along a curve)
//                                | low (hollows of a low-frequency field) | cell (Voronoi-ish region, BIO27 sample)
// All masks live in METRES in a per-sample local frame centred on the patch: the overview shows the central 12 m
// of the same field that the focus view shows as 32 m. Per layer: tile = metres per texture repeat, ns = normalScale,
// coverage 0..1 (patch/low), width = band width in metres (path), soft = edge softness (metres for path/cell,
// noise-threshold units for patch/low), hBias = height offset for the blend (-0.3..0.3), variation = anti-tiling UV
// offset amount (0..1), rotate = anti-tiling quarter turns. Blend defaults per sample: depth (sharpness of the height
// blend, smaller = harder), over (how much a layer is suppressed under the layers above it), hi = height influence,
// noise = noise frequency (1/m, feature size ~ 1/noise), warp = domain warp (m).

const HIGH_TILT = { BIO09_ash_snow: 0.7, BIO14_blue_ice: 0.7, BIO21_sunken_floor: 0.7, BIO23_course: 0.7, BIO26_dream: 0.7 };
// Anti-tiling by texture character: organic/irregular -> offset + quarter turns; directional organic -> offset only;
// planks and regular blocks with a clear direction -> none.
const OFFSET_ONLY = new Set(['BIO20_wet_sand', 'BIO14_blue_ice']);
const NO_BREAKUP = new Set(['BIO12_dark_planks', 'BIO16_blackwood', 'BIO17_varnished', 'BIO07_limestone', 'BIO08_nave', 'BIO24_keystone', 'BIO22_abbey']);

const L = (id, role, o = {}) => ({
  id, role, tile: 5, ns: HIGH_TILT[id] ?? 1.0, coverage: 0.5, width: 2.6, soft: role === 'path' ? 0.42 : role === 'cell' ? 0.6 : 0.07,
  hBias: 0, visible: true,
  variation: NO_BREAKUP.has(id) ? 0 : 1, rotate: !NO_BREAKUP.has(id) && !OFFSET_ONLY.has(id), ...o,
});

const S = (id, name, layers, o = {}) => ({ id, name, layers, depth: 0.26, over: 0.5, hi: 0.85, noise: 0.375, warp: 2.6, seed: 0, ...o });

export const SAMPLES = [
  S('marsh_village', 'Đầm lầy & làng đá lửa', [
    L('BIO01_peat', 'base'), L('BIO02_meadow', 'patch', { coverage: 0.4 }), L('BIO03_flint', 'path', { width: 3.1 }),
  ], { seed: 1.7 }),
  S('ossuary_garden', 'Hầm xương & vườn đất', [
    L('BIO04_garden', 'base'), L('BIO01_peat', 'low', { coverage: 0.5 }), L('BIO04_ossuary', 'patch', { coverage: 0.45 }),
  ], { seed: 5.3 }),
  S('salt_mine', 'Mỏ muối & spoil', [
    L('BIO06_flint_spoil', 'base'), L('BIO06_salt_mine', 'patch', { coverage: 0.5 }), L('BIO10_salt_crust', 'path', { width: 2.4 }),
  ], { seed: 9.1 }),
  S('cathedral', 'Nhà thờ & thành đá vôi', [
    L('BIO08_nave', 'base'), L('BIO07_limestone', 'patch', { coverage: 0.5 }), L('BIO05_lime', 'path', { width: 2.9 }),
  ], { seed: 13.9 }),
  S('ash_pass', 'Đèo tuyết tro & băng', [
    L('BIO09_ash_snow', 'base'), L('BIO15_pyre_ash', 'patch', { coverage: 0.48 }), L('BIO14_blue_ice', 'low', { coverage: 0.45 }),
  ], { seed: 2.9 }),
  S('white_hulk', 'Hulk trắng', [
    L('BIO11_white_hulk', 'base'), L('BIO13_salt_glass', 'patch', { coverage: 0.5 }), L('BIO12_dark_planks', 'path', { width: 2.6, tile: 4 }),
  ], { seed: 7.7 }),
  S('vesnagrad', 'Vesnagrad & phòng ướp', [
    L('BIO16_blackwood', 'base', { tile: 4 }), L('BIO17_varnished', 'path', { width: 4.8, tile: 4 }), L('BIO14_blue_ice', 'patch', { coverage: 0.28 }),
  ], { seed: 11.3 }),
  S('harbour', 'Cảng Wrackhaven', [
    L('BIO19_coastal_rock', 'base'), L('BIO20_wet_sand', 'low', { coverage: 0.55 }), L('BIO18_wet_slate', 'path', { width: 2.9 }),
  ], { seed: 4.1 }),
  S('tidal_abbey', 'Tu viện thủy triều & tàu chìm', [
    L('BIO22_abbey', 'base'), L('BIO21_sunken_floor', 'low', { coverage: 0.5 }), L('BIO20_wet_sand', 'patch', { coverage: 0.4 }),
  ], { seed: 8.3 }),
  S('the_course', 'The Course & cổng keystone', [
    L('BIO23_course', 'base'), L('BIO24_keystone', 'path', { width: 6.6, soft: 0.36 }),
  ], { seed: 3.3 }),
  S('edda_dream', 'Mộng Edda', [
    L('BIO26_dream', 'base'), L('BIO27_cradle', 'path', { width: 3.6 }),
  ], { seed: 6.1 }),
  S('cell_perfection', 'Cell Perfection', [
    L('BIO27_cradle', 'cell'), L('BIO27_vault', 'cell'), L('BIO27_salt', 'cell'), L('BIO27_deep', 'cell'),
  ], { seed: 10.7, depth: 0.2 }),
];

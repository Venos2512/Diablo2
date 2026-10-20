// Act I · Dark Wood, Diablo II mood: the same landscape, dirt-road path, forest and rocks as the Immortal-mood scene
// (darkWood.js), lit and coloured like the project's D2 look: isometric 2:1 play view on the hero, night,
// ACES, a slightly warm-neutral light radius round the hero, dark forest green / olive / brown with little mist and no blue cast.
// Textures: the stylized Dark Wood tiles recoloured greener (TERRAIN_SETS.darkWoodGreen: the same strokes as the Immortal scene's
// set, recolor_green.py), with their own cobble path ribbon and grass cards. Post settings (tone mapping, exposure, fog, grade) are saved per scene id, so this scene and the
// Immortal one each keep their own.
import { registerDefaults } from '../core/settings.js';
import { DarkWoodScene, DARKWOOD_DEFAULTS } from './darkWood.js';

export const D2_DEFAULTS = {
	...DARKWOOD_DEFAULTS,
	layerSet: 'darkWoodGreen',
	time: 'd2Night',
	rutsOpacity: 1,
	edgeCards: 1.2,
	wind: 0.25,
	shellCoverage: 0.3,
	shellHeight: 0.18,
	shadowStrength: 0.7, // thicker shadows: the moon's gaps between the crowns stay dark, the hero's light radius is the bright patch
	fill: false, // the D2 look: no shadow fill, shadows go dark
	fillColor: '#4c6a5c',
	fillStrength: 1.4,
	fillThreshold: 0.08,
	water: 0.05, // little standing water: its sheen mirrors the hero's light as a bright patch beside the hero
	waterRough: 0.7,
};
registerDefaults('darkWoodD2', D2_DEFAULTS);

export const D2_TIMES = {
	d2Night: {
		label: 'Night · light radius (D2)', moonK: 7800, moon: 1.8, sunElev: 58, sunAz: -70, hemi: 3.0, sky: '#46665a', ground: '#262016',
		env: 'hdri-night', envI: 0.06, bgI: 0, toneMapping: 'aces', exposure: 0.55, sun: 0.1,
		hero: { color: '#dad6c6', intensity: 85, distance: 13, decay: 1.3, height: 3.2 },
		fog: { color: '#232c28', density: 0.03, falloff: 0.3, start: 12, inscatter: 0.1 },
		grade: { vignette: 0.66, contrast: 1.12, saturation: 1.12, lift: -0.006, temperature: -0.02, tint: -0.08 },
	},
	d2Dusk: {
		label: 'Dusk (D2, lighter)', moonK: 6400, moon: 4.6, sunElev: 30, sunAz: -70, hemi: 2.2, sky: '#5a7060', ground: '#2e2618',
		env: 'hdri-night', envI: 0.1, bgI: 0, toneMapping: 'aces', exposure: 0.55, sun: 0.1,
		hero: { color: '#dad6c6', intensity: 20, distance: 12, decay: 1.3, height: 3.2 },
		fog: { color: '#2a332c', density: 0.03, falloff: 0.3, start: 12, inscatter: 0.1 },
		grade: { vignette: 0.5, contrast: 1.08, saturation: 1.08, lift: 0, temperature: 0, tint: -0.05 },
	},
};

export const D2_VARIANT = {
	id: 'darkWoodD2',
	label: 'Act I · Dark Wood (D2 mood)',
	sceneName: 'Dark Wood (D2)',
	set: 'darkWoodGreen',
	time: 'd2Night',
	times: D2_TIMES,
	defaults: D2_DEFAULTS,
	tints: { bark: [0.8, 0.76, 0.64], burned: [0.5, 0.5, 0.46], rock: [0.4, 0.45, 0.4], shrub: [0.55, 0.72, 0.45], cards: [0.55, 0.68, 0.5] },
	path: { name: 'Cobble path (ribbon)', width: 4.4, color: [0.82, 0.84, 0.8] }, // the same road as the Immortal mood (paved 3.2 m, 300 px/m tile: darkWood.js SCALE); width only matters for a set without a roadTile
	iso: true,
	softShadows: true,
	shellTint: [0.6, 0.78, 0.55], // darker, greener shell blades: the pale ones read minty / frosty
	isoHeight: 12,
};

export class DarkWoodD2Scene extends DarkWoodScene {
	constructor(app) {
		super(app, D2_VARIANT);
	}
}

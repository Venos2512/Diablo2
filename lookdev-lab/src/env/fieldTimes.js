// Open-field time-of-day presets shared by the outdoor scenes (Bố trí biome). Each carries its tone mapping; the key light
// comes from screen upper-left (west) for every preset (art-direction/04: one light direction). Night is the Diablo II light
// radius look, Overcast the neutral palette check, Dusk the low sun in fog.
export const FIELD_TIMES = {
	overcast: {
		label: 'Overcast · neutral palette check', sunK: 6500, sun: 1.3, sunElev: 50, sunAz: -90, hemi: 1.0, sky: '#a3aaa4', ground: '#3d362b',
		env: 'hdri-overcast', envI: 0.45, bgI: 0.3, toneMapping: 'agx', exposure: -0.2, fire: 0.25, lanterns: 0.15, fireDistance: 10,
		fog: { color: '#727873', density: 0.016, falloff: 0.22, start: 20, inscatter: 0.1 },
		grade: { vignette: 0.32, contrast: 1, saturation: 1, lift: 0, temperature: 0, tint: 0 },
	},
	dusk: {
		label: 'Dusk · weeping fog', sunK: 2900, sun: 2.4, sunElev: 11, sunAz: -100, hemi: 0.55, sky: '#7d7b74', ground: '#2f2920',
		env: 'hdri-overcast', envI: 0.22, bgI: 0.15, toneMapping: 'agx', exposure: 0.2, fire: 0.85, lanterns: 0.75, fireDistance: 13,
		fog: { color: '#544d45', density: 0.042, falloff: 0.32, start: 9, inscatter: 1.1 },
		grade: { vignette: 0.5, contrast: 1.02, saturation: 0.95, lift: 0, temperature: 0.05, tint: 0 },
	},
	night: {
		label: 'Night · light radius (D2 · default)', sunK: 7800, sun: 3.2, sunElev: 46, sunAz: -70, hemi: 1.4, sky: '#46665a', ground: '#262016',
		env: 'hdri-night', envI: 0.06, bgI: 0, toneMapping: 'aces', exposure: 0.15, fire: 1, lanterns: 1, fireDistance: 14,
		hero: { color: '#cfd8d6', intensity: 28, distance: 12, decay: 1.3, height: 3.2 },
		fog: { color: '#232c28', density: 0.032, falloff: 0.3, start: 12, inscatter: 0.15 },
		grade: { vignette: 0.66, contrast: 1.12, saturation: 1.12, lift: -0.006, temperature: -0.1, tint: -0.08 },
	},
};

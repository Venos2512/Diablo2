// Diablo III Act I moods: lighting, atmosphere and grade presets applied on top of any scene (Lighting tab).
// Each mood has
//   post      grade, bloom, tone mapping and LUT (global, restored when the mood is turned off)
//   live      the parameters the panel exposes (hero light, character rim, weather, air particles)
//   exterior  graveyard-like scenes: moon / sun, sky ambient, HDRI, torches, fog, exposure
//   interior  catacomb-like scenes: torches, ambient bounce, fog, exposure (no weather)
//   studio    the lookdev studio: a small rig built from the mood (moon, ambient, lanterns)
// Values are art-directed by eye from the game's Act I areas; they are a starting point to tweak.

export const MOODS = {
	off: { label: 'Off · scene lighting' },

	tristram: {
		label: 'New Tristram · rainy night',
		summary: 'Cold blue-teal moonlight through rain, wet ground with puddles, warm lanterns and fires, lightning on the horizon.',
		post: {
			toneMapping: 'aces',
			bloom: { enabled: true, strength: 0.55, radius: 0.55, threshold: 0.9 },
			grade: { temperature: -0.1, tint: -0.03, saturation: 1.08, contrast: 1.08, lift: -0.006, gamma: 0.97, gain: 1.03, vignette: 0.42, grain: 0.012, chromatic: 0 },
			lut: { look: 'act1Tristram', intensity: 0.85 },
		},
		live: {
			hero: true, heroIntensity: 7, heroRange: 10, heroHeight: 5, heroToCamera: 1.2, heroKelvin: 4300,
			rim: true, rimColor: '#8fb2ff', rimIntensity: 0.6, rimPower: 3.5, rimBias: 0.6,
			rain: 1, wind: 0.2, splashes: true, wet: 0.25,
			lightning: true, lightningEvery: 12, lightningStrength: 1,
			dust: 0, mist: 0.35,
		},
		exterior: {
			exposure: 1.35,
			moon: { kelvin: 8800, lux: 0.34, elevation: 50, azimuth: -140 },
			sky: { color: '#2b4669', ground: '#0e0c0a', intensity: 0.45 },
			env: { id: 'hdri-night', intensity: 0.3, background: 0.4, blur: 0.1 },
			torches: { kelvin: 1800, scale: 1.1 },
			fog: { color: '#1a2733', density: 0.05, falloff: 0.3, start: 3, inscatter: 0.55, height: 0 },
			sun: 0.18,
		},
		interior: {
			exposure: 1.3,
			ambient: { color: '#22344e', ground: '#090706', intensity: 0.17 },
			env: { intensity: 0.05, background: '#05070b' },
			torches: { kelvin: 2000, scale: 1.0 },
			fog: { color: '#10141b', density: 0.05, falloff: 0, start: 3, inscatter: 0, height: 0 },
		},
		studio: {
			exposure: 1.2,
			moon: { kelvin: 8800, lux: 0.6, position: [-3, 6, -4] },
			sky: { color: '#2b4669', ground: '#0e0c0a', intensity: 0.4 },
			lanterns: [{ name: 'Lantern', kelvin: 1800, cd: 8, position: [-1.8, 1.8, 1.6] }],
			env: { id: 'hdri-night', intensity: 0.25, background: 0.3, blur: 0.45 },
			fog: { color: '#16212b', density: 0.03, falloff: 0.2, start: 3, inscatter: 0.4, height: 0 },
			sun: 0.12,
		},
	},

	hollow: {
		label: 'Weeping Hollow · fog',
		summary: 'Overcast green-grey dusk, thick ground fog drifting through dead trees, muted greens and sallow highlights.',
		post: {
			toneMapping: 'aces',
			bloom: { enabled: true, strength: 0.3, radius: 0.6, threshold: 1.0 },
			grade: { temperature: -0.04, tint: -0.1, saturation: 0.85, contrast: 1.05, lift: 0, gamma: 1.0, gain: 1.0, vignette: 0.45, grain: 0.015, chromatic: 0 },
			lut: { look: 'act1Hollow', intensity: 0.8 },
		},
		live: {
			hero: true, heroIntensity: 5, heroRange: 9, heroHeight: 5, heroToCamera: 1.2, heroKelvin: 5200,
			rim: true, rimColor: '#c6d7b0', rimIntensity: 0.4, rimPower: 3.5, rimBias: 0.5,
			rain: 0, wind: 0.1, splashes: true, wet: 0,
			lightning: false, lightningEvery: 20, lightningStrength: 0.6,
			dust: 0.35, mist: 1,
		},
		exterior: {
			exposure: 0.2,
			moon: { kelvin: 6400, lux: 1.0, elevation: 34, azimuth: -70 },
			sky: { color: '#56685a', ground: '#1c1910', intensity: 0.55 },
			env: { id: 'hdri-overcast', intensity: 0.32, background: 0.3, blur: 0.25 },
			torches: { kelvin: 1900, scale: 0.6 },
			fog: { color: '#4b5849', density: 0.09, falloff: 0.32, start: 2, inscatter: 0.35, height: 0 },
			sun: 0.5,
		},
		interior: {
			exposure: 1.25,
			ambient: { color: '#2b3d33', ground: '#0a0907', intensity: 0.18 },
			env: { intensity: 0.06, background: '#060807' },
			torches: { kelvin: 1900, scale: 0.9 },
			fog: { color: '#151d18', density: 0.06, falloff: 0, start: 2.5, inscatter: 0, height: 0 },
		},
		studio: {
			exposure: 0.2,
			moon: { kelvin: 6400, lux: 1.2, position: [-4, 6, 3] },
			sky: { color: '#56685a', ground: '#1c1910', intensity: 0.45 },
			lanterns: [{ name: 'Lantern', kelvin: 1900, cd: 3, position: [1.9, 1.6, 1.4] }],
			env: { id: 'hdri-overcast', intensity: 0.3, background: 0.3, blur: 0.5 },
			fog: { color: '#3f4a3f', density: 0.05, falloff: 0.25, start: 2.5, inscatter: 0.3, height: 0 },
			sun: 0.4,
		},
	},

	cathedral: {
		label: 'Cathedral · crypt',
		summary: 'Near-black stone and cold shadows, pools of orange torchlight, dust hanging in the air. Outdoors it becomes a moonless, torch-lit night.',
		post: {
			toneMapping: 'aces',
			bloom: { enabled: true, strength: 0.6, radius: 0.5, threshold: 0.85 },
			grade: { temperature: 0, tint: 0, saturation: 0.95, contrast: 1.12, lift: -0.01, gamma: 0.97, gain: 1.03, vignette: 0.5, grain: 0.015, chromatic: 0 },
			lut: { look: 'act1Cathedral', intensity: 0.85 },
		},
		live: {
			hero: true, heroIntensity: 10, heroRange: 9, heroHeight: 4.5, heroToCamera: 1.2, heroKelvin: 4000,
			rim: true, rimColor: '#9db4ff', rimIntensity: 0.5, rimPower: 3.5, rimBias: 0.6,
			rain: 0, wind: 0.1, splashes: true, wet: 0,
			lightning: false, lightningEvery: 16, lightningStrength: 0.7,
			dust: 1, mist: 0,
		},
		exterior: {
			exposure: 1.5,
			moon: { kelvin: 9500, lux: 0.07, elevation: 60, azimuth: -150 },
			sky: { color: '#141b2a', ground: '#0a0806', intensity: 0.14 },
			env: { id: 'hdri-night', intensity: 0.08, background: 0.1, blur: 0.15 },
			torches: { kelvin: 2100, scale: 1.2 },
			fog: { color: '#0d0b0b', density: 0.06, falloff: 0.25, start: 3, inscatter: 0, height: 0 },
			sun: 0,
		},
		interior: {
			exposure: 1.45,
			ambient: { color: '#28324d', ground: '#080605', intensity: 0.15 },
			env: { intensity: 0.04, background: '#030304' },
			torches: { kelvin: 2100, scale: 1.0 },
			fog: { color: '#0d0a09', density: 0.055, falloff: 0, start: 2.5, inscatter: 0, height: 0 },
		},
		studio: {
			exposure: 1.25,
			moon: { kelvin: 9000, lux: 0.12, position: [1.5, 5, -4] },
			sky: { color: '#151c2c', ground: '#080605', intensity: 0.08 },
			lanterns: [
				{ name: 'Torch left', kelvin: 1750, cd: 10, position: [-1.9, 2.0, 1.2], flicker: true, shadow: true },
				{ name: 'Torch right', kelvin: 1750, cd: 6, position: [2.2, 1.7, -1.4], flicker: true },
			],
			env: { id: 'hdri-night', intensity: 0.05, background: null, blur: 0 },
			background: '#040405',
			fog: { color: '#0a0808', density: 0.04, falloff: 0.2, start: 3, inscatter: 0, height: 0 },
			sun: 0,
		},
	},

	// Ported from the v1 game (src/core/renderer.js ENVIRONMENTS): 'moor' outdoors, 'catacomb' indoors.
	// Light intensities are the game's own (same three.js units); exposure is log2 of its linear value,
	// FogExp2 is matched at the game's ~17-20 m camera distance, the "player light" spot (200 cd at
	// 7.5 m) becomes the decay-1 hero light, and the grade is the v1Moor LUT (an exact port). The game's
	// faint chromatic aberration is left out: chromatic > 0 adds a render-to-texture pass that breaks
	// the WebGPU post graph ("Invalid CommandBuffer").
	v1game: {
		label: 'v1 game · Ashen Moor / Catacombs',
		summary: 'The v1 game look: cold blue moonlight and deep blue-black fog over the moor, a warm light radius around the hero, desaturated grade with cool shadows and warm highlights. Indoors: the torch-lit catacombs.',
		post: {
			toneMapping: 'aces',
			bloom: { enabled: true, strength: 0.4, radius: 0.38, threshold: 1.0 },
			grade: { temperature: 0, tint: 0, saturation: 1, contrast: 1, lift: 0, gamma: 1, gain: 1, vignette: 0.55, grain: 0.035, chromatic: 0 },
			lut: { look: 'v1Moor', intensity: 1 },
		},
		live: {
			hero: true, heroIntensity: 29, heroRange: 17, heroHeight: 7.5, heroToCamera: 1.2, heroKelvin: 3500,
			rim: false, rimColor: '#9fb3e8', rimIntensity: 0.4, rimPower: 3.5, rimBias: 0.6,
			rain: 0, wind: 0.15, splashes: true, wet: 0,
			lightning: false, lightningEvery: 16, lightningStrength: 0.7,
			dust: 0.3, mist: 0.4,
		},
		exterior: {
			exposure: 0.38,
			moon: { kelvin: 22000, lux: 3.2, elevation: 61, azimuth: -63 },
			sky: { color: '#3b4c72', ground: '#16110b', intensity: 1.2 },
			env: { id: 'hdri-night', intensity: 0.3, background: 0.12, blur: 0.2 },
			torches: { kelvin: 1900, scale: 1.0 },
			fog: { color: '#0b1018', density: 0.0055, falloff: 0, start: 0, inscatter: 0, height: 0 },
			sun: 0,
		},
		interior: {
			exposure: 0.24,
			ambient: { color: '#2e2722', ground: '#0c0806', intensity: 0.36 },
			env: { intensity: 0.2, background: '#030202' },
			torches: { kelvin: 1900, scale: 1.0 },
			fog: { color: '#050403', density: 0.0115, falloff: 0, start: 0, inscatter: 0, height: 0 },
		},
		studio: {
			exposure: 0.38,
			moon: { kelvin: 22000, lux: 3.2, position: [-2.7, 5.4, 1.35] },
			sky: { color: '#3b4c72', ground: '#16110b', intensity: 1.2 },
			lanterns: [{ name: 'Fill (camera side)', kelvin: 3900, cd: 3.5, position: [0.8, 2.4, 2.2] }],
			env: { id: 'hdri-night', intensity: 0.3, background: null, blur: 0 },
			background: '#06080c',
			fog: { color: '#0b1018', density: 0.0055, falloff: 0, start: 0, inscatter: 0, height: 0 },
			sun: 0,
		},
	},
};

/** Live parameters of a mood with the user's saved tweaks on top. */
export function moodLive(id, tweaks = {}) {
	return { ...(MOODS[id]?.live || {}), ...(tweaks[id] || {}) };
}

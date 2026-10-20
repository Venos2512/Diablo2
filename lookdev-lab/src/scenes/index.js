// Scene registry.
import { StudioScene } from './studio.js';
import { DarkWoodScene } from './darkWood.js';
import { DarkWoodD2Scene } from './darkWoodD2.js';
import { BiomeLayoutScene } from './biomeLayout.js';

export const SCENES = {
	studio: { label: 'Studio · lookdev', create: (app) => new StudioScene(app) },
	darkWood: { label: 'Act I · Dark Wood (Immortal ref)', create: (app) => new DarkWoodScene(app) },
	darkWoodD2: { label: 'Act I · Dark Wood (D2 mood)', create: (app) => new DarkWoodD2Scene(app) },
	biomeLayout: { label: 'Act I · Bố trí biome (thuật toán)', create: (app) => new BiomeLayoutScene(app) },
};

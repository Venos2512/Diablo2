// Scene registry.
import { StudioScene } from './studio.js';
import { GraveyardScene } from './graveyard.js';
import { CatacombsScene } from './catacombs.js';
import { TerrainScene } from './terrain.js';

export const SCENES = {
	studio: { label: 'Studio · lookdev', create: (app) => new StudioScene(app) },
	graveyard: { label: 'Act I · Burial grounds', create: (app) => new GraveyardScene(app) },
	catacombs: { label: 'Act I · Catacombs', create: (app) => new CatacombsScene(app) },
	terrain: { label: 'Act I · Moor terrain', create: (app) => new TerrainScene(app) },
};

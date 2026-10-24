// Scene registry.
import { StudioScene } from './studio.js';
import { DarkWoodScene } from './darkWood.js';
import { DarkWoodD2Scene } from './darkWoodD2.js';
import { BiomeLayoutScene } from './biomeLayout.js';
import { BiomeMixScene } from './biomeMix.js';
import { DungeonScene } from './dungeon.js';
import { OldFaceScene } from './oldFace.js';
import { Act1InteriorScene } from './act1Interior.js';
import { Act1OutdoorScene } from './act1Outdoor.js';
import { ChoiceHandsScene } from './choiceHands.js';

export const SCENES = {
	studio: { label: 'Studio · lookdev', create: (app) => new StudioScene(app) },
	darkWood: { label: 'Act I · Dark Wood (Immortal ref)', create: (app) => new DarkWoodScene(app) },
	darkWoodD2: { label: 'Act I · Dark Wood (D2 mood)', create: (app) => new DarkWoodD2Scene(app) },
	biomeLayout: { label: 'Act I · Bố trí biome (thuật toán)', create: (app) => new BiomeLayoutScene(app) },
	biomeMix: { label: 'ASHLAR · Biome mix (31 texture + cỏ Dark Wood)', create: (app) => new BiomeMixScene(app) },
	dungeon: { label: 'ASHLAR · Hầm mộ & hang động (dungeon)', create: (app) => new DungeonScene(app) },
	oldFace: { label: 'ASHLAR · Prologue · The Old Face (hầm xương)', create: (app) => new OldFaceScene(app) },
	act1Cradle: { label: 'ASHLAR · Act I · base · The Cradle', create: (app) => new Act1InteriorScene(app, 'cradle') },
	act1GentleHouse: { label: 'ASHLAR · Act I · base · Gentle House', create: (app) => new Act1InteriorScene(app, 'gentleHouse') },
	act1GardenOfHush: { label: 'ASHLAR · Act I · base · Garden of Hush', create: (app) => new Act1InteriorScene(app, 'gardenOfHush') },
	act1Lychgate: { label: 'ASHLAR · Act I · base · Lychgate → Churchyard', create: (app) => new Act1OutdoorScene(app, 'lychgate') },
	act1Fens: { label: 'ASHLAR · Act I · base · Night Fens → Rook\'s Weir', create: (app) => new Act1OutdoorScene(app, 'fens') },
	act1PoppyReach: { label: 'ASHLAR · Act I · base · Poppy Reach', create: (app) => new Act1OutdoorScene(app, 'poppyReach') },
	choiceHands: { label: 'ASHLAR · Màn chọn nghề (sáu bàn tay)', create: (app) => new ChoiceHandsScene(app) },
	act1LychgateHub: { label: 'ASHLAR · Act I · hub · Lychgate có tường (seed 21)', create: (app) => new Act1OutdoorScene(app, 'lychgateHub') },
};

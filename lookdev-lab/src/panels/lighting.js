import { createGUI, intro, note } from '../ui/gui.js';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { STUDIO_RIGS } from '../lighting/studioRigs.js';
import { MOODS } from '../lighting/moods.js';
import { clearFolder } from './lookdev.js';

registerDefaults('lighting', { shadowType: 'pcfsoft', shadowMapSize: 2048, shadowBias: -0.0002, shadowNormalBias: 0.02, shadowRadius: 3, helpers: false });

export function applyShadowSettings(app) {
	const l = app.settings.data.lighting;
	app.backend.setShadowType(l.shadowType);
	app.world.scene?.traverse((o) => {
		if (!o.isLight || !o.shadow) return;
		const size = o.isPointLight ? Math.min(l.shadowMapSize, 1024) : l.shadowMapSize;
		if (o.shadow.mapSize.x !== size) {
			o.shadow.mapSize.set(size, size);
			o.shadow.map?.dispose();
			o.shadow.map = null;
		}
		if (!o.userData.labBiasOverride) {
			o.shadow.bias = o.isPointLight ? l.shadowBias * 10 : l.shadowBias;
			o.shadow.normalBias = l.shadowNormalBias;
		}
		o.shadow.radius = l.shadowRadius;
	});
}

export function buildLightingPanel(app, el) {
	const s = app.settings.data;
	intro(el, 'Lighting', '<p>Light rigs, colour temperature in Kelvin, physical intensities (lux / candela / nits), shadows and height fog. Torches and candles flicker on their own. <b>Mood</b> dresses any scene in a Diablo III Act I look.</p>');
	const gui = createGUI(el);
	const changed = (p) => app.settings.changed(p);

	const fMood = gui.addFolder('Mood · Diablo III Act I');
	const fRig = gui.addFolder('Rig');
	const fLights = gui.addFolder('Lights');

	function buildMood() {
		clearFolder(fMood);
		const mood = app.mood;
		if (!mood) return;
		const state = { id: mood.settings.id };
		fMood.add(state, 'id', Object.fromEntries(Object.entries(MOODS).map(([id, m]) => [m.label, id]))).name('Mood').onChange((id) => mood.set(id));
		if (!mood.active) {
			note(fMood, 'Three looks after Diablo III\'s first act — <b>New Tristram</b> (rainy night), <b>Weeping Hollow</b> (fog) and <b>Cathedral</b> (crypt) — plus <b>v1 game</b>, the moor / catacomb look ported from the v1 game\'s renderer. Each sets the scene lights, fog, exposure and grade, and adds a hero light that follows the character, a rim light on the character, and weather or dust. Works in the studio and both Act I scenes; Off restores everything.');
			return;
		}
		const indoors = mood.indoors;
		note(fMood, `${mood.mood.summary}${indoors ? ' <i>Indoors: no rain, lightning or wet ground here.</i>' : ''}`);
		fMood.add(mood.settings, 'post').name('Grade, bloom & tone mapping').onChange(() => mood.applyPost());
		const L = mood.live;
		const set = (key) => (value) => mood.setLive(key, value);

		const fHero = fMood.addFolder('Hero light (follows the character)').close();
		fHero.add(L, 'hero').name('Enabled').onChange(set('hero'));
		fHero.add(L, 'heroIntensity', 0, 40, 0.1).name('Intensity').onChange(set('heroIntensity'));
		fHero.add(L, 'heroRange', 2, 25, 0.1).name('Range m').onChange(set('heroRange'));
		fHero.add(L, 'heroHeight', 0.5, 8, 0.05).name('Height above feet m').onChange(set('heroHeight'));
		fHero.add(L, 'heroToCamera', -3, 3, 0.05).name('Offset to camera m').onChange(set('heroToCamera'));
		fHero.add(L, 'heroKelvin', 1500, 10000, 50).name('Temperature K').onChange(set('heroKelvin'));
		note(fHero, 'The game keeps a soft light around the hero so the character reads at night. Inverse-linear falloff like a game light, no shadows (cheap); toggling it never changes the light count.');

		const fRimF = fMood.addFolder('Character rim').close();
		fRimF.add(L, 'rim').name('Enabled').onChange(set('rim'));
		fRimF.addColor(L, 'rimColor').name('Colour').onChange(set('rimColor'));
		fRimF.add(L, 'rimIntensity', 0, 5, 0.01).name('Intensity').onChange(set('rimIntensity'));
		fRimF.add(L, 'rimPower', 0.5, 8, 0.01).name('Power (thinner →)').onChange(set('rimPower'));
		fRimF.add(L, 'rimBias', 0, 1, 0.01).name('Top bias').onChange(set('rimBias'));
		note(fRimF, 'Fresnel rim on the character and held items (GLSL patch / TSL node patch), weighted to the upper silhouette like moonlight.');

		if (!indoors) {
			const fWeather = fMood.addFolder('Weather').close();
			fWeather.add(L, 'rain', 0, 2, 0.01).name('Rain').onChange(set('rain'));
			fWeather.add(L, 'wind', 0, 1, 0.01).name('Wind').onChange(set('wind'));
			fWeather.add(L, 'splashes').name('Splashes').onChange(set('splashes'));
			fWeather.add(L, 'wet', 0, 1, 0.01).name('Puddles (rain)').onChange(set('wet'));
			fWeather.add(L, 'lightning').name('Lightning').onChange(set('lightning'));
			fWeather.add(L, 'lightningEvery', 3, 60, 0.5).name('Lightning every ~s').onChange(set('lightningEvery'));
			fWeather.add(L, 'lightningStrength', 0, 3, 0.01).name('Lightning strength').onChange(set('lightningStrength'));
			fWeather.add({ strike: () => mood.strikeNow() }, 'strike').name('⚡ Strike now');
			note(fWeather, 'Rain and splashes are CPU particles (one draw each); puddles are the Shaders-tab puddle effect with rain wetness on the ground materials.');
		}

		const fAir = fMood.addFolder('Air').close();
		fAir.add(L, 'dust', 0, 2, 0.01).name('Dust motes').onChange(set('dust'));
		fAir.add(L, 'mist', 0, 2, 0.01).name('Ground mist').onChange(set('mist'));

		fMood.add({ reset: () => mood.resetLive() }, 'reset').name('Reset this mood\'s tweaks');
	}

	function buildRig() {
		clearFolder(fRig);
		const scene = app.current;
		if (app.mood?.active && scene?.mood !== undefined && scene.id === 'studio') {
			note(fRig, `The <b>${app.mood.mood.label}</b> mood drives this scene's rig and environment. Set Mood to Off to use them again.`);
			if (scene.buildLightingControls) scene.buildLightingControls(fRig, () => buildLights());
			return;
		}
		if (scene?.id === 'studio') {
			const st = scene.settings;
			const rigOptions = Object.fromEntries(Object.entries(STUDIO_RIGS).map(([id, r]) => [r.label, id]));
			fRig.add(st, 'rig', rigOptions).name('Studio rig').onChange(() => {
				changed('studio');
				scene.applyRig();
				app.backend.prepareObject(scene.scene);
				applyShadowSettings(app);
				buildLights();
			});
			fRig.add(st, 'rigIntensity', 0, 4, 0.01).name('Rig intensity ×').onChange(() => (changed('studio'), scene.applyRigIntensity()));
			fRig.add(st, 'rigRotation', -180, 180, 1).name('Rig rotation °').onChange(() => (changed('studio'), scene.applyRigIntensity()));
			note(fRig, 'Environment intensity is scaled per rig so the rig stays the key light. Rect area lights (softboxes) do not cast shadows; a dim directional adds contact shadows.');
		} else if (scene?.buildLightingControls) {
			scene.buildLightingControls(fRig, () => buildLights());
		} else {
			note(fRig, 'This scene has no rig presets.');
		}
	}

	function buildLights() {
		clearFolder(fLights);
		const scene = app.current;
		const lights = scene?.lights || [];
		if (!lights.length) {
			note(fLights, 'Environment lighting only.');
			return;
		}
		for (const entry of lights) {
			const light = entry.light;
			const f = fLights.addFolder(entry.name).close();
			f.add(light, 'visible').name('Enabled');
			if (entry.kelvin) {
				f.add(entry, 'kelvin', 1000, 12000, 50).name('Temperature K').onChange((k) => light.color.copy(kelvinToColor(k)));
			}
			const unit = light.isDirectionalLight ? 'lux' : light.isRectAreaLight ? 'nits' : light.isHemisphereLight || light.isAmbientLight ? '' : 'cd';
			const max = light.isDirectionalLight ? 20 : light.isRectAreaLight ? 60 : light.isHemisphereLight || light.isAmbientLight ? 5 : 600;
			f.add(entry, 'base', 0, max, 0.01).name(`Intensity ${unit}`).onChange(() => {
				if (scene.applyRigIntensity) scene.applyRigIntensity();
				else light.intensity = entry.base;
			});
			if (light.shadow && !light.isRectAreaLight) f.add(light, 'castShadow').name('Cast shadow');
			if (light.isSpotLight) {
				f.add(light, 'angle', 0.05, 1.5, 0.01).name('Cone angle');
				f.add(light, 'penumbra', 0, 1, 0.01).name('Penumbra');
			}
			if (light.isPointLight || light.isSpotLight) f.add(light, 'distance', 0, 50, 0.1).name('Range (0 = ∞)');
			if (entry.flicker !== undefined) f.add(entry, 'flickerAmount', 0, 1, 0.01).name('Flicker');
		}
	}

	const l = s.lighting;
	const fShadow = gui.addFolder('Shadows');
	const applyShadows = () => (changed('lighting'), applyShadowSettings(app));
	fShadow.add(l, 'shadowType', { Basic: 'basic', PCF: 'pcf', 'PCF soft': 'pcfsoft', VSM: 'vsm' }).name('Filter').onChange(applyShadows);
	fShadow.add(l, 'shadowMapSize', { 512: 512, 1024: 1024, 2048: 2048, 4096: 4096 }).name('Map size').onChange(applyShadows);
	fShadow.add(l, 'shadowBias', -0.005, 0.005, 0.0001).name('Bias').onChange(applyShadows);
	fShadow.add(l, 'shadowNormalBias', 0, 0.2, 0.001).name('Normal bias').onChange(applyShadows);
	fShadow.add(l, 'shadowRadius', 0, 12, 0.1).name('Blur radius (PCF/VSM)').onChange(applyShadows);
	note(fShadow, 'Point-light shadows render six cube faces — the most expensive light type. Watch the Scene pass time.');

	const fog = s.post.fog;
	const fFog = gui.addFolder('Height fog');
	const applyFog = () => (changed('post'), app.applyPost());
	fFog.add(fog, 'enabled').name('Enabled').onChange(applyFog);
	fFog.add(fog, 'density', 0, 0.3, 0.001).name('Density').onChange(applyFog);
	fFog.add(fog, 'falloff', 0, 2, 0.01).name('Height falloff').onChange(applyFog);
	fFog.add(fog, 'height', -5, 10, 0.05).name('Base height').onChange(applyFog);
	fFog.add(fog, 'start', 0, 30, 0.1).name('Start distance').onChange(applyFog);
	fFog.addColor(fog, 'color').name('Colour').onChange(applyFog);
	fFog.add(fog, 'inscatter', 0, 3, 0.01).name('Sun/moon in-scatter').onChange(applyFog);
	note(fFog, 'Exponential height fog is computed in post from scene depth (identical maths in GLSL and TSL).');

	app.on('scene', () => {
		buildMood();
		buildRig();
		buildLights();
		applyShadowSettings(app);
	});
	app.mood?.onChange(() => {
		buildMood();
		buildRig();
		buildLights();
		applyShadowSettings(app);
	});
	buildMood();
	buildRig();
	buildLights();
	applyShadowSettings(app);
	return { gui, rebuild: () => (buildMood(), buildRig(), buildLights()) };
}

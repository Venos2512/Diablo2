import { createGUI, intro, note } from '../ui/gui.js';
import { registerDefaults } from '../core/settings.js';
import { kelvinToColor } from '../core/grading.js';
import { STUDIO_RIGS } from '../lighting/studioRigs.js';
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
	intro(el, 'Lighting', '<p>Light rigs, colour temperature in Kelvin, physical intensities (lux / candela / nits), shadows and height fog. Torches and candles flicker on their own.</p>');
	const gui = createGUI(el);
	const changed = (p) => app.settings.changed(p);

	const fRig = gui.addFolder('Rig');
	const fLights = gui.addFolder('Lights');

	function buildRig() {
		clearFolder(fRig);
		const scene = app.current;
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
		buildRig();
		buildLights();
		applyShadowSettings(app);
	});
	buildRig();
	buildLights();
	applyShadowSettings(app);
	return { gui, rebuild: () => (buildRig(), buildLights()) };
}

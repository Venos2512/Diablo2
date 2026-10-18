import { createGUI, intro, note } from '../ui/gui.js';
import { TONE_MAPPINGS } from '../core/grading.js';
import { CAMERA_MODES } from '../core/cameraRig.js';
import { toast } from '../ui/toast.js';
import { LOOKS, CHECK_VIEWS, loadCustomLut } from '../core/lut.js';

export function buildPostPanel(app, el) {
	const s = app.settings.data;
	const p = s.post;
	intro(el, 'Post-processing & camera', '<p>Same stages in both renderers: AO → height fog → VFX layer → bloom → grade → tone map → AA. Watch the HUD for each pass cost.</p>');
	const gui = createGUI(el);
	const apply = () => {
		app.settings.changed('post');
		app.applyPost();
		app.updateBadges();
	};

	const fCam = gui.addFolder('Camera');
	const camState = { mode: app.rig.mode };
	fCam.add(camState, 'mode', Object.fromEntries(Object.entries(CAMERA_MODES).map(([id, label]) => [label, id]))).name('Mode').onChange((m) => {
		app.rig.setMode(m);
		s.camera.mode = m;
		app.settings.changed('camera');
		app.emit('scene', app.current);
	});
	fCam.add(s.camera, 'fov', 10, 90, 1).name('Field of view °').onChange((v) => (app.rig.setFov(v), app.settings.changed('camera')));
	fCam.add({ home: () => app.goHome() }, 'home').name('Reset to scene home');
	note(fCam, 'Isometric uses an orthographic camera at 30° elevation (2:1 ground ratio, like the original sprite renders). Game ¾ locks pitch and yaw like an ARPG.');

	const fTone = gui.addFolder('Exposure & tone mapping');
	fTone.add(p, 'exposure', -6, 6, 0.1).name('Exposure (EV)').onChange(apply);
	fTone.add(p, 'toneMapping', Object.fromEntries(Object.entries(TONE_MAPPINGS).map(([id, t]) => [t.label, id]))).name('Tone mapping').onChange(apply);
	const falseColor = fTone.add(p, 'falseColor').name('False colour (X)').onChange(apply);

	const fAA = gui.addFolder('Anti-aliasing');
	const aaOptions = { None: 'none', FXAA: 'fxaa', SMAA: 'smaa', 'MSAA 4×': 'msaa' };
	if (app.backend.kind === 'webgpu') aaOptions['TRAA (WebGPU renderer only)'] = 'traa';
	fAA.add(p, 'aa', aaOptions).name('Method').onChange(apply);
	note(fAA, app.backend.kind === 'webgpu' ? 'TRAA = temporal reprojection (uses velocity MRT). MSAA multisamples the scene pass.' : 'MSAA multisamples the HDR scene target; FXAA/SMAA run after tone mapping.');

	const fBloom = gui.addFolder('Bloom');
	fBloom.add(p.bloom, 'enabled').name('Enabled').onChange(apply);
	fBloom.add(p.bloom, 'strength', 0, 3, 0.01).name('Strength').onChange(apply);
	fBloom.add(p.bloom, 'radius', 0, 1, 0.01).name('Radius').onChange(apply);
	fBloom.add(p.bloom, 'threshold', 0, 8, 0.01).name('Threshold (HDR)').onChange(apply);
	note(fBloom, 'Same algorithm on both sides: UnrealBloomPass (GLSL) vs BloomNode (TSL port). Threshold is in scene-referred units, so emissive > 1 blooms.');

	const fAO = gui.addFolder('Ambient occlusion (GTAO)');
	fAO.add(p.ao, 'enabled').name('Enabled').onChange(apply);
	fAO.add(p.ao, 'intensity', 0, 1.5, 0.01).name('Intensity').onChange(apply);
	fAO.add(p.ao, 'radius', 0.02, 2, 0.01).name('Radius').onChange(apply);
	fAO.add(p.ao, 'distanceExponent', 1, 4, 0.01).name('Distance exponent').onChange(apply);
	fAO.add(p.ao, 'thickness', 0.01, 5, 0.01).name('Thickness').onChange(apply);
	fAO.add(p.ao, 'scale', 0.1, 3, 0.01).name('Scale').onChange(apply);
	fAO.add(p.ao, 'resolution', { Half: 0.5, Full: 1 }).name('Resolution').onChange(apply);
	note(fAO, 'WebGL2 renders an extra normal/depth pass for GTAO; WebGPU reads normals from the scene pass MRT — compare the draw calls.');

	const g = p.grade;
	const fGrade = gui.addFolder('Colour grade').close();
	fGrade.add(g, 'temperature', -1, 1, 0.01).name('Temperature').onChange(apply);
	fGrade.add(g, 'tint', -1, 1, 0.01).name('Tint').onChange(apply);
	fGrade.add(g, 'saturation', 0, 2, 0.01).name('Saturation').onChange(apply);
	fGrade.add(g, 'contrast', 0.5, 1.6, 0.01).name('Contrast (log)').onChange(apply);
	fGrade.add(g, 'lift', -0.2, 0.2, 0.001).name('Lift').onChange(apply);
	fGrade.add(g, 'gamma', 0.5, 2, 0.01).name('Gamma').onChange(apply);
	fGrade.add(g, 'gain', 0.5, 2, 0.01).name('Gain').onChange(apply);
	fGrade.add(g, 'vignette', 0, 1, 0.01).name('Vignette').onChange(apply);
	fGrade.add(g, 'grain', 0, 0.15, 0.001).name('Film grain').onChange(apply);
	fGrade.add(g, 'chromatic', 0, 3, 0.01).name('Chromatic aberration').onChange(apply);
	fGrade.add({ reset: () => {
		Object.assign(g, { temperature: 0, tint: 0, saturation: 1, contrast: 1, lift: 0, gamma: 1, gain: 1, vignette: 0.22, grain: 0, chromatic: 0 });
		fGrade.controllersRecursive().forEach((c) => c.updateDisplay());
		apply();
	} }, 'reset').name('Reset grade');

	const fLut = gui.addFolder('3D LUT (display space)').close();
	const lutOptions = () => {
		const options = Object.fromEntries(Object.entries(LOOKS).map(([id, look]) => [look.label, id]));
		options[app.customLut ? `Your LUT · ${app.customLut.title}` : 'Your .cube (load one)'] = 'custom';
		return options;
	};
	const lutLook = {
		get look() {
			return p.lut.look;
		},
		set look(v) {
			if (v === 'custom' && !app.customLut && !loadCustomLut()) {
				document.getElementById('file-input').click();
				return;
			}
			p.lut.look = v;
			app.settings.changed('post');
			app.applyLut();
		},
	};
	let lutController = fLut.add(lutLook, 'look', lutOptions()).name('Look');
	fLut.add(p.lut, 'intensity', 0, 1, 0.01).name('Intensity').onChange(apply);
	fLut.add({ load: () => document.getElementById('file-input').click() }, 'load').name('Load .cube… (or drop it)');
	note(fLut, 'Applied after tone mapping and sRGB, like LUTs exported from Resolve / Photoshop. The generated looks are 33³ tables computed in JS — the same texture lookup either way, so you can compare the cost in both renderers.');
	app.on('lut', () => {
		const prev = lutController;
		lutController = fLut.add(lutLook, 'look', lutOptions()).name('Look');
		prev.destroy();
		fLut.open();
	});

	const fCheck = gui.addFolder('Readability check · value & colour vision').close();
	fCheck.add(p, 'check', Object.fromEntries(Object.entries(CHECK_VIEWS).map(([id, c]) => [c.label, id]))).name('Check view').onChange(() => {
		app.settings.changed('post');
		app.applyLut();
	}).listen();
	note(fCheck, 'The art checklist asks to judge combat at the real camera in greyscale (value structure) and with the common colour-vision deficiencies — gameplay signals must not rely on hue alone. Baked on top of the LUT look (Machado et al. 2009, full severity); bloom and grain stay as they are.');

	const fRetro = gui.addFolder('Retro preview (readability test)').close();
	fRetro.add(p.retro, 'enabled').name('Enabled').onChange(apply);
	fRetro.add(p.retro, 'height', { '480p (640×480 era)': 480, '600p (800×600 era)': 600, '720p': 720, '360p': 360 }).name('Internal height').onChange(apply);
	fRetro.add(p.retro, 'levels', 4, 64, 1).name('Levels per channel').onChange(apply);
	fRetro.add(p.retro, 'dither', 0, 1, 0.01).name('Ordered dither').onChange(apply);
	note(fRetro, 'Checks whether silhouettes, loot and spell effects still read at the low resolutions the art checklist asks to review at.');

	const fVfx = gui.addFolder('VFX layer').close();
	fVfx.add(p, 'vfxResolution', { Full: 1, Half: 0.5, Quarter: 0.25 }).name('Resolution').onChange(apply);
	note(fVfx, 'Particles render into their own premultiplied buffer, soft-faded against scene depth, then composite before bloom. Half resolution is a common console trade-off.');

	return {
		gui,
		toggleFalseColor() {
			p.falseColor = !p.falseColor;
			falseColor.updateDisplay();
			apply();
			toast(`False colour ${p.falseColor ? 'on' : 'off'}`, 'info', 1000);
		},
		refresh() {
			camState.mode = app.rig.mode;
		},
	};
}

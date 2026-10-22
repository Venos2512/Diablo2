import * as THREE from 'three';
import { createGUI, intro, note, readout, colorProxy, clearFolder } from '../ui/gui.js';
import { VIEWS } from '../lookdev/views.js';
import { SAMPLES } from '../core/assets.js';
import { TONE_MAPPINGS } from '../core/grading.js';
import { STUDIO_ENVS } from '../scenes/studio.js';
import { toast } from '../ui/toast.js';
import { buildTextureEditor } from '../lookdev/textureEditor.js';

export { colorProxy, clearFolder } from '../ui/gui.js';

export function buildLookdevPanel(app, el) {
	const s = app.settings.data;
	intro(el, 'Model lookdev', '<p>Judge materials under neutral light, then in context. Click a mesh to inspect its material; drop a Substance texture set onto the viewport to wire it in.</p>');
	const gui = createGUI(el);
	const changed = (path) => app.settings.changed(path);

	// View --------------------------------------------------------------------------------------
	const fView = gui.addFolder('View');
	const viewOptions = Object.fromEntries(Object.entries(VIEWS).map(([id, v]) => [v.label + (v.webglOnly ? ' (WebGL2)' : ''), id]));
	fView.add(s.view, 'mode', viewOptions).name('View mode (V)').onChange((v) => app.setView(v));
	fView.add(s.post, 'falseColor').name('Exposure false colour (X)').onChange(() => {
		changed('post');
		app.applyPost();
		app.updateBadges();
	});
	fView.add(s.post, 'exposure', -6, 6, 0.1).name('Exposure (EV)').onChange(() => {
		changed('post');
		app.applyPost();
	});
	const toneOptions = Object.fromEntries(Object.entries(TONE_MAPPINGS).map(([id, t]) => [t.label, id]));
	fView.add(s.post, 'toneMapping', toneOptions).name('Tone mapping').onChange(() => {
		changed('post');
		app.applyPost();
	});

	// Model ---------------------------------------------------------------------------------------
	const fModel = gui.addFolder('Model');
	const modelOptions = Object.fromEntries(SAMPLES.filter((a) => a.kind === 'model').map((a) => [a.name, a.id]));
	const sampleController = fModel.add(s.subject, 'sample', modelOptions).name('Sample').onChange((id) => app.loadSample(id));
	fModel.add({ open: () => document.getElementById('file-input').click() }, 'open').name('Open your file… (GLB/FBX/OBJ)');
	const turntable = fModel.add(s.subject, 'turntable').name('Turntable (T)').onChange((v) => {
		app.subject.turntable = v;
		changed('subject');
	});
	fModel.add(s.subject, 'turntableSpeed', -120, 120, 1).name('Turntable °/s').onChange((v) => {
		app.subject.turntableSpeed = v;
		changed('subject');
	});
	fModel.add({ reset: () => app.subject.pivot.rotation.set(0, 0, 0) }, 'reset').name('Reset rotation');
	fModel.add({ frame: () => app.frameSubject() }, 'frame').name('Frame model (F)');
	const stats = readout(fModel);

	// Animation -----------------------------------------------------------------------------------
	const fAnim = gui.addFolder('Animation');
	const animState = { clip: 0, time: 0 };
	function buildAnimation() {
		clearFolder(fAnim);
		const subj = app.subject;
		if (!subj.clips.length) {
			note(fAnim, 'This model has no animation clips. Pick the <b>D2R Sorceress</b>.');
			return;
		}
		const options = Object.fromEntries(subj.clips.map((c, i) => [`${c.name || 'Clip ' + (i + 1)} · ${c.duration.toFixed(2)} s`, i]));
		animState.clip = Math.max(0, subj.clips.indexOf(subj.action?.getClip()));
		fAnim.add(animState, 'clip', options).name('Clip').onChange((i) => subj.play(Number(i)));
		fAnim.add({ get playing() { return subj.playing; }, set playing(v) { subj.setPlaying(v); } }, 'playing').name('Playing');
		fAnim.add(s.subject, 'speed', 0, 3, 0.05).name('Speed').onChange((v) => {
			subj.speed = v;
			changed('subject');
		});
		const timeProxy = {
			get time() {
				return subj.action ? subj.action.time % subj.action.getClip().duration : 0;
			},
			set time(v) {
				subj.seek(v);
			},
		};
		fAnim.add(timeProxy, 'time', 0, subj.action?.getClip().duration || 1, 0.001).name('Time (s)').listen();
	}

	// Studio --------------------------------------------------------------------------------------
	const fStudio = gui.addFolder('Studio environment');
	function buildStudio() {
		clearFolder(fStudio);
		const studio = app.current?.id === 'studio' ? app.current : null;
		if (!studio) {
			note(fStudio, 'Switch the scene to <b>Studio</b> for neutral lookdev. Act I scenes show the model in context.');
			return;
		}
		const st = studio.settings;
		const envOptions = { ...Object.fromEntries(Object.entries(STUDIO_ENVS).map(([id, label]) => [label, id])) };
		if (studio.customEnv) envOptions['Your HDRI'] = 'custom';
		const save = () => changed('studio');
		fStudio.add(st, 'env', envOptions).name('Environment').onChange(async () => {
			save();
			await studio.applyEnvironment();
			app.updateRail();
		});
		fStudio.add(st, 'envIntensity', 0, 3, 0.01).name('Env intensity').onChange(() => (save(), studio.applyEnvIntensity()));
		fStudio.add(st, 'envRotation', -180, 180, 1).name('Env rotation °').onChange(() => (save(), studio.applyEnvIntensity()));
		fStudio.add(st, 'background', { 'Environment (sharp)': 'env', 'Environment (blurred)': 'blur', 'Solid colour': 'color' }).name('Background').onChange(() => (save(), studio.applyBackground()));
		fStudio.add(st, 'bgBlur', 0, 1, 0.01).name('Background blur').onChange(() => (save(), studio.applyBackground()));
		fStudio.add(st, 'bgIntensity', 0, 2, 0.01).name('Background intensity').onChange(() => (save(), studio.applyBackground()));
		fStudio.addColor(st, 'bgColor').name('Background colour').onChange(() => (save(), studio.applyBackground()));
		fStudio.add(st, 'floor', { Dark: 'dark', '18% grey': 'grey', White: 'white', None: 'none' }).name('Floor').onChange(() => (save(), studio.applyLayout()));
		fStudio.add(st, 'showPedestal').name('Pedestal').onChange(() => (save(), studio.applyLayout()));
		fStudio.add(st, 'showBalls').name('Grey + chrome balls').onChange(() => (save(), studio.applyLayout()));
		fStudio.add(st, 'showChecker').name('Colour checker').onChange(() => (save(), studio.applyLayout()));
		note(fStudio, 'Light rigs live in the <b>Lighting</b> tab. Drop an .hdr/.exr to use your own environment.');
	}

	// Selected material ---------------------------------------------------------------------------
	const fMat = gui.addFolder('Selected material');
	function buildMaterial(object) {
		clearFolder(fMat);
		if (!object) {
			note(fMat, 'Click a mesh in the viewport to inspect and edit its material.');
			return;
		}
		const m = Array.isArray(object.material) ? object.material[0] : object.material;
		const maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'bumpMap', 'clearcoatNormalMap', 'transmissionMap', 'thicknessMap']
			.filter((k) => m[k])
			.map((k) => {
				const img = m[k].image;
				return `${k}${img?.width ? ` ${img.width}×${img.height}` : ''}`;
			});
		const g = object.geometry;
		const tris = g ? (g.index ? g.index.count : g.attributes.position.count) / 3 : 0;
		note(fMat, `<b>${object.name || object.type}</b> · ${Math.round(tris).toLocaleString()} tris${object.isSkinnedMesh ? ' · skinned' : ''}<br><b>${m.name || '(unnamed)'}</b> · ${m.type}<br>${maps.length ? maps.join(', ') : 'no texture maps'}`);
		if (m.userData.labViewSwap) {
			note(fMat, 'A swap view (clay / UV / wireframe) is active — switch back to a channel or lit view to edit the real material.');
			return;
		}
		const upd = () => (m.needsUpdate = true);
		if (m.color) fMat.addColor(colorProxy(m.color), 'hex').name('Base colour');
		if (m.isMeshStandardMaterial) {
			fMat.add(m, 'roughness', 0, 1, 0.01).name('Roughness');
			fMat.add(m, 'metalness', 0, 1, 0.01).name('Metalness');
			fMat.add(m, 'envMapIntensity', 0, 4, 0.01).name('Env intensity');
			if (m.normalMap) {
				const n = { strength: Math.abs(m.normalScale.x), directX: m.normalScale.y < 0 };
				const apply = () => m.normalScale.set(n.strength, n.directX ? -n.strength : n.strength);
				fMat.add(n, 'strength', 0, 3, 0.01).name('Normal strength').onChange(apply);
				fMat.add(n, 'directX').name('Normal: DirectX (flip G)').onChange(apply);
			}
			if (m.aoMap) fMat.add(m, 'aoMapIntensity', 0, 2, 0.01).name('AO map intensity');
			fMat.addColor(colorProxy(m.emissive), 'hex').name('Emissive');
			fMat.add(m, 'emissiveIntensity', 0, 50, 0.01).name('Emissive intensity');
		}
		if (m.isMeshPhysicalMaterial) {
			const fp = fMat.addFolder('Physical').close();
			fp.add(m, 'clearcoat', 0, 1, 0.01);
			fp.add(m, 'clearcoatRoughness', 0, 1, 0.01);
			fp.add(m, 'transmission', 0, 1, 0.01);
			fp.add(m, 'thickness', 0, 5, 0.01);
			fp.add(m, 'ior', 1, 2.333, 0.001);
			fp.add(m, 'attenuationDistance', 0.01, 20, 0.01);
			fp.addColor(colorProxy(m.attenuationColor), 'hex').name('attenuationColor');
			fp.add(m, 'sheen', 0, 1, 0.01);
			fp.add(m, 'sheenRoughness', 0, 1, 0.01);
			fp.addColor(colorProxy(m.sheenColor), 'hex').name('sheenColor');
			fp.add(m, 'iridescence', 0, 1, 0.01);
			fp.add(m, 'specularIntensity', 0, 1, 0.01);
			fp.add(m, 'anisotropy', 0, 1, 0.01);
			fp.add(m, 'dispersion', 0, 10, 0.01);
		}
		const fTex = fMat.addFolder('Textures').close();
		buildTextureEditor(fTex, app, () => ({ root: object, mesh: object, label: object.name || object.type }));
		const fr = fMat.addFolder('Render state').close();
		fr.add(m, 'side', { Front: THREE.FrontSide, Back: THREE.BackSide, Double: THREE.DoubleSide }).onChange(upd);
		fr.add(m, 'transparent').onChange(upd);
		fr.add(m, 'opacity', 0, 1, 0.01);
		fr.add(m, 'alphaTest', 0, 1, 0.01).onChange(upd);
		if ('flatShading' in m) fr.add(m, 'flatShading').onChange(upd);
		fr.add(m, 'wireframe');
		fr.add(m, 'depthWrite');
	}

	// Compare -------------------------------------------------------------------------------------
	const fCmp = gui.addFolder('A/B compare');
	note(fCmp, 'Capture <b>A</b>, then change anything — even the renderer (the snapshot survives the reload) — and drag the divider.');
	fCmp.add({ a: () => app.captureA() }, 'a').name('Capture A (current frame)');
	fCmp.add({ get show() { return app.compare.visible; }, set show(v) { app.showCompare(v); } }, 'show').name('Show A/B overlay (C)').listen();
	fCmp.add({ clear: () => app.clearCompare() }, 'clear').name('Clear snapshot');

	function refreshStats() {
		const st = app.subject.stats();
		stats(st ? `${app.subject.name}\n${st.triangles.toLocaleString()} tris · ${st.meshes} meshes${st.skinned ? ` (${st.skinned} skinned, ${st.bones} bones)` : ''}\n${st.materials} materials · ${st.textures} textures ≈ ${st.textureMB.toFixed(1)} MB GPU\n${st.clips} clips · import scale ×${st.scale.toFixed(3)}` : 'No model');
	}

	app.on('subject', () => {
		refreshStats();
		buildAnimation();
		sampleController.updateDisplay();
	});
	app.on('scene', () => buildStudio());
	app.on('select', (object) => buildMaterial(object));
	refreshStats();
	buildAnimation();
	buildStudio();
	buildMaterial(null);
	fMat.open();

	return {
		gui,
		toggleTurntable() {
			s.subject.turntable = !s.subject.turntable;
			app.subject.turntable = s.subject.turntable;
			turntable.updateDisplay();
			changed('subject');
			toast(`Turntable ${s.subject.turntable ? 'on' : 'off'}`, 'info', 1000);
		},
	};
}

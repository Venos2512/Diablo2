// Character tab: preview a character like in the game — controller (movement, camera, animation states
// per weapon stance), equipment and grips, foot-slide check, scale reference lineup and the texture
// editor for the character or the item it holds.
import { createGUI, intro, note, readout, clearFolder } from '../ui/gui.js';
import { SAMPLES } from '../core/assets.js';
import { STATES, STANCES } from '../character/clips.js';
import { CAMERAS } from '../character/controller.js';
import { MARKERS } from '../character/scaleRef.js';
import { buildTextureEditor } from '../lookdev/textureEditor.js';
import { MOODS } from '../lighting/moods.js';
import { toast } from '../ui/toast.js';

export function buildCharacterPanel(app, el) {
	const ctrl = app.character;
	const s = ctrl.settings;
	const save = () => ctrl.save();
	intro(el, 'Character preview', '<p>Play the model like a game character in any scene: <b>WASD</b> or <b>click</b> to move (hold to keep walking), <b>Space</b> attack, <b>E</b> attack 2, <b>Q</b> / right click cast, <b>B</b> block, <b>G</b> get hit, <b>K</b> death / revive, <b>R</b> walk ↔ run, <b>Shift</b> walk. Gamepad: left stick, A / Y attacks, X cast, B block.</p>');
	const gui = createGUI(el);

	// Character ---------------------------------------------------------------------------------------
	const fChar = gui.addFolder('Character');
	const characterSamples = SAMPLES.filter((a) => a.kind === 'model' && a.role === 'character');
	const pick = { get sample() { return app.subject.sourceId || ''; }, set sample(id) { if (id) app.loadSample(id); } };
	const sampleOptions = { '(your file)': '', ...Object.fromEntries(characterSamples.map((a) => [a.name, a.id])) };
	const sampleCtl = fChar.add(pick, 'sample', sampleOptions).name('Character');
	fChar.add({ open: () => document.getElementById('file-input').click() }, 'open').name('Open your character… (GLB/FBX)');
	const play = { get on() { return ctrl.active; }, set on(v) { ctrl.setActive(v); } };
	fChar.add(play, 'on').name('▶ Play (Enter)').listen();
	fChar.add(s, 'camera', Object.fromEntries(Object.entries(CAMERAS).map(([id, label]) => [label, id]))).name('Camera').onChange((v) => ctrl.setCamera(v));
	if (app.mood) {
		// Shortcut to the Lighting tab's Act I moods (hero light, rim, weather and grade are tuned there).
		const mood = { get id() { return app.mood.settings.id; }, set id(v) { app.mood.set(v); } };
		fChar.add(mood, 'id', Object.fromEntries(Object.entries(MOODS).map(([id, m]) => [m.label, id]))).name('Lighting mood (D3 Act I)').listen();
	}
	const live = readout(fChar);

	// Movement ------------------------------------------------------------------------------------------
	const fMove = gui.addFolder('Movement');
	fMove.add(s, 'run').name('Run by default (R)').listen().onChange(save);
	fMove.add(s, 'walkSpeed', 0.3, 4, 0.05).name('Walk speed (m/s)').onChange(save);
	fMove.add(s, 'runSpeed', 1, 10, 0.05).name('Run speed (m/s)').onChange(save);
	fMove.add(s, 'accel', 2, 60, 1).name('Acceleration').onChange(save);
	fMove.add(s, 'turnRate', 90, 2000, 10).name('Turn rate (°/s)').onChange(save);
	fMove.add(s, 'collide').name('Walls & ground collision').onChange(save);
	fMove.add(s, 'cutaway').name('See-through walls around the character').onChange((v) => {
		save();
		if (v && ctrl.active) ctrl.cutaway.prepareScene(app.world.scene, (o) => ctrl.isDynamic(o));
	});
	fMove.add(s, 'gamepad').name('Gamepad').onChange(save);
	fMove.add(s, 'targets').name('Training dummies as targets').onChange((v) => {
		save();
		if (v && ctrl.active && !app.vfxLab.armed) app.vfxLab.arm(true);
	});
	note(fMove, 'Attacks stop the character (like Diablo). A swing hits the dummy in front at the clip’s impact frame — the same blood / sparks as the VFX tab’s “Hit” spell; spells come from the VFX castbar.');

	// Animation states -----------------------------------------------------------------------------------
	const fAnim = gui.addFolder('Animation states');
	function buildAnim() {
		clearFolder(fAnim);
		const clips = app.subject.clips;
		if (!clips.length) {
			note(fAnim, 'This model has no clips. Load a KayKit character, Robot Expressive, or your own animated GLB.');
			return;
		}
		const stanceOptions = { [`Auto from equipment (${STANCES[ctrl.autoStance] || '—'})`]: 'auto', ...Object.fromEntries(Object.entries(STANCES).map(([id, label]) => [label, id])) };
		fAnim.add(s, 'stance', stanceOptions).name('Stance').onChange(() => {
			save();
			ctrl.refreshMap();
			buildAnim();
		});
		fAnim.add(s, 'crossfade', 0, 0.6, 0.01).name('Crossfade (s)').onChange(save);
		const store = ctrl.modelStore();
		const clipNames = clips.filter((c) => c.duration > 0).map((c) => c.name);
		for (const [state, def] of Object.entries(STATES)) {
			const auto = ctrl.map[state];
			const options = { [`Auto · ${auto || 'none'}`]: '' };
			for (const name of clipNames) options[name] = name;
			const proxy = { get clip() { return store.states?.[state] || ''; }, set clip(v) { ctrl.setOverride(state, v); } };
			fAnim.add(proxy, 'clip', options).name(def.label);
		}
		const fTest = fAnim.addFolder('Test (play mode)').close();
		for (const state of ['attack', 'attack2', 'cast', 'hit', 'jump', 'dodge']) fTest.add({ go: () => (ctrl.active ? ctrl.trigger(state) : toast('Start Play first', 'info', 1200)) }, 'go').name(STATES[state].label);
		fTest.add({ go: () => (ctrl.active ? ctrl.toggleDeath() : toast('Start Play first', 'info', 1200)) }, 'go').name('Death / revive');
		fAnim.add({ add: () => pickModelFile((gltf, name) => ctrl.addClips(gltf.animations, name)) }, 'add').name('Add clips from a file… (same rig)');
		note(fAnim, `${clips.length} clips. States are matched by name per stance (KayKit, Mixamo, Quaternius and plain names); pick a clip to override it — saved for this model. Walk / run play in sync and blend by speed; one-shots crossfade over the locomotion.`);
	}

	// Equipment ------------------------------------------------------------------------------------------
	const fEquip = gui.addFolder('Equipment');
	const gizmo = { mode: 'off', side: 'right' };
	function buildEquip() {
		clearFolder(fEquip);
		const eq = ctrl.equipment;
		if (!ctrl.rig || (!eq.bone('right') && !eq.bone('left'))) {
			note(fEquip, 'No hand bones found on this model.');
			return;
		}
		const sides = [
			['right', 'Main hand (right)'],
			['left', 'Off hand (left)'],
		];
		for (const [side, title] of sides) {
			if (!eq.bone(side)) continue;
			const proxy = { get id() { return eq.current(side); }, set id(v) { equip(side, v); } };
			fEquip.add(proxy, 'id', eq.options(side)).name(title);
		}
		fEquip.add({ load: () => pickModelFile((gltf, name) => {
			const id = eq.addCustom(name, gltf.scene);
			equip(gizmo.side, id);
		}) }, 'load').name('Load an item file… (into the gizmo hand)');
		const fGrip = fEquip.addFolder('Grip');
		fGrip.add(gizmo, 'side', { 'Main hand': 'right', 'Off hand': 'left' }).name('Hand').onChange(() => applyGizmo());
		fGrip.add(gizmo, 'mode', { Off: 'off', 'Move (gizmo)': 'translate', 'Rotate (gizmo)': 'rotate' }).name('Gizmo').onChange(() => applyGizmo());
		const slot = eq.slots[gizmo.side];
		if (slot && !slot.builtin) {
			const scale = { get s() { return slot.object.scale.x; }, set s(v) { slot.object.scale.setScalar(v); eq.captureGrip(gizmo.side); } };
			fGrip.add(scale, 's', 0.05, 5, 0.01).name('Scale').listen();
			fGrip.add({ reset: () => eq.resetGrip(gizmo.side) }, 'reset').name('Reset grip');
		} else note(fGrip, slot?.builtin ? 'Built-in item: its placement comes from the model file.' : 'Nothing in this hand.');
		fGrip.add({ copy: () => {
			const json = eq.exportGrips(app.subject.name);
			navigator.clipboard?.writeText(json).then(() => toast('Grips copied as JSON', 'ok', 1500), () => download(json));
		} }, 'copy').name('Copy grips JSON');
		note(fEquip, `Hand bones: <b>${boneName(eq.bone('right'))}</b> / <b>${boneName(eq.bone('left'))}</b>. Props from the KayKit pack sit like the pack’s own weapons on KayKit rigs; on other rigs adjust the grip with the gizmo (saved per model and item).`);
	}
	function equip(side, id) {
		ctrl.equipment.equip(side, id).then(() => {
			ctrl.refreshMap();
			applyGizmo();
			buildAnim();
			buildEquip();
			textures.refresh();
		});
	}
	function applyGizmo() {
		const eq = ctrl.equipment;
		if (gizmo.mode === 'off' || !eq.attachGizmo(gizmo.side, gizmo.mode)) eq.detachGizmo();
		buildEquipLater();
	}
	let equipTimer = null;
	function buildEquipLater() {
		clearTimeout(equipTimer);
		equipTimer = setTimeout(buildEquip, 0);
	}

	// Foot sliding ------------------------------------------------------------------------------------------
	const fFoot = gui.addFolder('Foot sliding');
	fFoot.add(s, 'syncRate').name('Animation follows speed (no sliding)').onChange(save);
	fFoot.add(s, 'footprints').name('Footprints (green holds · red skates)').onChange(save);
	const footOut = readout(fFoot);
	fFoot.add({ match: () => {
		const n = ctrl.animator.natural;
		s.walkSpeed = +n.walk.toFixed(2);
		s.runSpeed = +n.run.toFixed(2);
		save();
		gui.controllersRecursive().forEach((c) => c.updateDisplay());
		toast(`Walk ${s.walkSpeed} m/s · run ${s.runSpeed} m/s (the clips’ own speeds)`, 'ok', 2500);
	} }, 'match').name('Set speeds = animation speeds');
	fFoot.add({ measure: () => {
		ctrl.modelStore().natural = {};
		ctrl.measureNatural();
		toast('Stride measured from the foot plants', 'ok', 1500);
	} }, 'measure').name('Re-measure the clips');
	note(fFoot, 'The natural speed of a walk / run is measured from its planted foot (the speed at which that foot stands still on the ground). With sync off the clips play at their authored rate, so any speed other than the natural one slides — the footprints turn yellow / red.');

	// Scale reference -----------------------------------------------------------------------------------------
	const fScale = gui.addFolder('Scale reference');
	const scaleToggle = { get on() { return s.scale.enabled; }, set on(v) { ctrl.setScaleEnabled(v); } };
	fScale.add(scaleToggle, 'on').name('Show lineup next to the character').listen();
	for (const [kind, def] of Object.entries(MARKERS)) {
		fScale.add(s.scale, kind, 0, kind === 'tree' ? 15 : 8, 0.05).name(`${def.label} (m)`).onFinishChange(() => {
			save();
			if (s.scale.enabled) ctrl.placeScale();
		});
	}
	fScale.add({ place: () => (s.scale.enabled ? ctrl.placeScale() : ctrl.setScaleEnabled(true)) }, 'place').name('Place next to the character');
	const heightProxy = { get h() { return +(ctrl.height || 0).toFixed(2); }, set h(v) { ctrl.applyHeight(v); } };
	fScale.add(heightProxy, 'h', 0.3, 6, 0.01).name('Character height (m)').listen();
	const forward = { get deg() { return ctrl.modelStore().forward || 0; }, set deg(v) { ctrl.setForward(Number(v)); } };
	fScale.add(forward, 'deg', { 'Faces +Z (glTF)': 0, '+90°': 90, '180°': 180, '−90°': -90 }).name('Model forward');
	note(fScale, 'Heights are the game’s scale standard (0 hides a marker). Labels show metres; the grid is 1 m. Character height rescales the model (saved per model).');

	// Textures ---------------------------------------------------------------------------------------------------
	const fTex = gui.addFolder('Textures (selected asset)');
	const texTarget = { which: 'character' };
	const targets = { Character: 'character', 'Main hand item': 'right', 'Off hand item': 'left', 'Clicked mesh': 'selected' };
	fTex.add(texTarget, 'which', targets).name('Asset').onChange(() => textures.refresh());
	const textures = buildTextureEditor(fTex, app, () => {
		const subject = app.subject;
		if (texTarget.which === 'selected') return app.selected ? { root: app.selected, mesh: app.selected, label: app.selected.name || 'Mesh' } : null;
		if (texTarget.which === 'right' || texTarget.which === 'left') {
			const slot = ctrl.equipment.slots[texTarget.which];
			if (!slot) return null;
			let mesh = null;
			slot.object.traverse((o) => (mesh ??= o.isMesh ? o : null));
			return { root: slot.object, mesh, label: slot.object.name || 'Item' };
		}
		if (!subject.model) return null;
		let body = null;
		subject.model.traverse((o) => {
			if (o.isSkinnedMesh && !body) body = o;
		});
		return { root: subject.model, mesh: app.selected && isInside(app.selected, subject.model) ? app.selected : body, label: subject.name };
	});

	// Live readouts ------------------------------------------------------------------------------------------
	const timer = setInterval(() => {
		if (el.hidden) return;
		const st = ctrl.status;
		const top = ctrl.active ? `${st.state} · ${st.speed.toFixed(2)} m/s · anim rate ×${st.rate.toFixed(2)}` : 'Not playing — press ▶ Play';
		const clip = ctrl.active ? ctrl.map[st.state] || '—' : '';
		live(`${top}${clip ? `\nclip ${clip}` : ''}\nstance ${STANCES[ctrl.stance] || ctrl.stance}${ctrl.pad.connected ? ' · gamepad ✓' : ''}`);
		const n = ctrl.natural;
		const f = ctrl.foot.stats;
		const fmt = (r) => (r ? `${r.speed.toFixed(2)} m/s (stride ${r.stride.toFixed(2)} m)` : 'not measured');
		const foot = (side) => (f[side] ? `${(f[side].slip * 100).toFixed(1)} cm/s${f[side].planted ? ' ●' : ''}` : '—');
		footOut(`walk clip ${fmt(n.walk)}\nrun clip  ${fmt(n.run)}\nslip L ${foot('left')} · R ${foot('right')}\naverage ${(f.slip * 100).toFixed(1)} cm/s while planted`);
	}, 250);

	// The controller finishes its model setup (clip map, equipment) asynchronously.
	ctrl.onModel(() => {
		sampleCtl.updateDisplay();
		buildAnim();
		buildEquip();
		textures.refresh();
	});
	app.on('select', () => {
		if (texTarget.which === 'selected' || texTarget.which === 'character') textures.refresh();
	});
	addEventListener('keydown', (e) => {
		if (e.key !== 'Enter' || el.hidden || e.target.closest?.('input, select, textarea, button')) return;
		ctrl.setActive(!ctrl.active);
	});
	buildAnim();
	buildEquip();

	function pickModelFile(onLoaded) {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.glb,.gltf,.fbx';
		input.addEventListener('change', async () => {
			const files = [...(input.files || [])];
			if (!files.length) return;
			const results = await app.loader.loadFiles(files);
			const model = results.find((r) => r.kind === 'model');
			if (!model) return toast('No model in that file', 'error', 2500);
			onLoaded({ scene: model.scene, animations: model.animations }, model.name);
		});
		input.click();
	}

	return {
		gui,
		dispose: () => clearInterval(timer),
		onShow: () => textures.refresh(),
	};
}

const boneName = (b) => (b ? b.userData?.name || b.name : '—');

function isInside(object, root) {
	for (let p = object; p; p = p.parent) if (p === root) return true;
	return false;
}

function download(text) {
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
	a.download = 'grips.json';
	a.click();
}


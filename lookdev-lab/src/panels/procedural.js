// Procedural tab: heroes, monsters and NPCs built in code (src/procedural). Build options, the model's
// own clip player (procedural keyframes + locomotion auto-select), its shader effects and cape wind.
import * as THREE from 'three';
import { createGUI, intro, note, readout, colorProxy, clearFolder } from '../ui/gui.js';
import { PROCEDURAL, ARMOR_KINDS, ELEMENTS, isProcedural, proceduralById, bakedInfo } from '../procedural/catalog.js';
import { SHARED } from '../core/shared.js';
import { toast } from '../ui/toast.js';

const GROUP_LABEL = { hero: 'Hero', monster: 'Monster', npc: 'NPC' };

export function buildProceduralPanel(app, el) {
	intro(el, 'Procedural characters', '<p>Characters generated in code: rig + SDF-sculpted body (baked), keyframed clips computed every frame, verlet cape. Pick one here or in the left rail (<b>Procedural</b> groups). Their shader effects (flash, tint, frozen, rim, ghost) are the game\'s own.</p>');
	const gui = createGUI(el);
	const o = app.settings.data.procedural;
	const save = () => app.settings.changed('procedural');
	const model = () => app.subject.procedural;
	const currentId = () => (isProcedural(app.subject.sourceId) ? app.subject.sourceId : '');
	const rebuild = () => {
		save();
		if (currentId()) app.loadProcedural(currentId(), { frame: false }).catch((e) => toast(String(e?.message || e), 'error', 5000));
	};

	// Character -----------------------------------------------------------------------------------------
	const fChar = gui.addFolder('Character');
	const pick = { get id() { return currentId(); }, set id(v) { if (v) app.loadSample(v); } };
	const options = { '(not procedural)': '' };
	for (const e of PROCEDURAL) options[`${GROUP_LABEL[e.group]} · ${e.name}`] = e.id;
	fChar.add(pick, 'id', options).name('Character').listen();
	const fBuild = fChar.addFolder('Build options');
	const info = readout(fChar);

	function buildOptions() {
		clearFolder(fBuild);
		const entry = proceduralById(currentId());
		if (!entry) {
			note(fBuild, 'Load a procedural character first.');
			return;
		}
		if (entry.group === 'hero') {
			fBuild.add(o, 'armor', ARMOR_KINDS).name('Armor').onChange(rebuild);
			fBuild.add(o, 'tier', 0, 3, 1).name('Armor tier').onFinishChange(rebuild);
			note(fBuild, 'Only the bare hero is baked: an armour variant is sculpted live the first time (a few seconds).');
		}
		if (entry.group === 'monster') {
			fBuild.add(o, 'variant', 0, 3, 1).name('Variant (zombie / skeleton)').onFinishChange(rebuild);
			fBuild.add(o, 'element', ELEMENTS).name('Element (skeleton eyes)').onChange(rebuild);
			fBuild.add(o, 'ally').name('Ally (summon colours)').onChange(rebuild);
			fBuild.add(o, 'champion').name('Champion rim').onChange(rebuild);
			fBuild.add(o, 'unique').name('Unique rim').onChange(rebuild);
		}
		if (entry.group === 'npc' && entry.kind === 'villager') fBuild.add(o, 'variant', 0, 3, 1).name('Villager variant').onFinishChange(rebuild);
		fBuild.add(o, 'seed', 0, 999, 1).name('Seed (idle jitter)').onFinishChange(rebuild);
	}

	// Animation -----------------------------------------------------------------------------------------
	const fAnim = gui.addFolder('Animation');
	const anim = { clip: 'idle', scrub: 0 };
	let lastEvent = '';
	function buildAnim() {
		clearFolder(fAnim);
		const m = model();
		if (!m) {
			note(fAnim, 'No procedural character loaded.');
			return;
		}
		m.onEvent = (name) => (lastEvent = `${name} @ ${m.current}`);
		anim.clip = m.clips.includes('idle') ? 'idle' : m.clips[0];
		fAnim.add(anim, 'clip', m.clips).name('Clip');
		fAnim.add({ go: () => {
			app.subject.setPlaying(true);
			m.play(anim.clip, { restart: true });
		} }, 'go').name('▶ Play clip (one-shots return to idle)');
		const playing = { get on() { return app.subject.playing; }, set on(v) { app.subject.setPlaying(v); } };
		fAnim.add(playing, 'on').name('Playing').listen();
		fAnim.add(app.subject, 'speed', 0, 2, 0.01).name('Playback speed');
		fAnim.add(anim, 'scrub', 0, 1, 0.001).name('Pose at (paused)').onChange((u) => {
			app.subject.setPlaying(false);
			m.pose(anim.clip, u);
		});
		fAnim.add(app.subject, 'locoSpeed', 0, 6, 0.05).name('Locomotion speed (m/s)');
		note(fAnim, 'While idle / walk / run is playing the model picks the locomotion clip from this speed (in place: the root does not move). Playing any other clip leaves locomotion until it ends.');
	}

	// Shader effects ------------------------------------------------------------------------------------
	const fFx = gui.addFolder('Shader effects').close();
	function buildFx() {
		clearFolder(fFx);
		const m = model();
		if (!m) return;
		const u = m.material.userData.u;
		const flash = { color: '#ffffff' };
		fFx.addColor(flash, 'color').name('Flash colour');
		fFx.add({ go: () => m.flash(1, flash.color) }, 'go').name('Flash (hit)');
		fFx.addColor(colorProxy(u.uTint.value), 'hex').name('Tint colour');
		fFx.add(u.uTintAmt, 'value', 0, 1, 0.01).name('Tint amount');
		fFx.add({ get on() { return m.frozen; }, set on(v) { m.setFrozen(v); } }, 'on').name('Frozen');
		fFx.add({ get on() { return u.uHighlight.value > 0; }, set on(v) { m.setHighlight(v); } }, 'on').name('Hover highlight');
		fFx.addColor(colorProxy(u.uRimColor.value), 'hex').name('Rim colour');
		fFx.add(u.uRim, 'value', 0, 2, 0.01).name('Rim strength');
		fFx.add(u.uEmis, 'value', 0, 4, 0.01).name('Emissive (eyes, runes)');
		if (app.backend.kind === 'webgl') fFx.add(u.uCrack, 'value', 0, 2, 0.01).name('Lava cracks');
		fFx.add({ get a() { return m.opacity; }, set a(v) { m.setOpacity(v); } }, 'a', 0, 1, 0.01).name('Opacity');
		if (app.backend.kind !== 'webgl') note(fFx, 'WebGPU: TSL port of the character shader (lava cracks are WebGL only).');
	}

	// Cape wind -----------------------------------------------------------------------------------------
	const fWind = gui.addFolder('Cape wind').close();
	fWind.add(SHARED.uniforms.uWind.value, 'x', -4, 4, 0.05).name('Wind X');
	fWind.add(SHARED.uniforms.uWind.value, 'y', -4, 4, 0.05).name('Wind Z');
	note(fWind, 'Barbarian / necromancer capes are a verlet cloth simulated on the CPU.');

	function rebuildAll() {
		buildOptions();
		buildAnim();
		buildFx();
	}
	app.on('subject', rebuildAll);
	rebuildAll();

	const _v = new THREE.Vector3();
	app.on('update', () => {
		if (el.hidden) return;
		const m = model();
		if (!m) {
			info('—');
			return;
		}
		m.root.getWorldScale(_v);
		const baked = bakedInfo.loaded ? `baked ${bakedInfo.entries} parts${bakedInfo.misses.length ? `, ${bakedInfo.misses.length} sculpted live` : ''}` : bakedInfo.error ? 'baked data failed: ' + bakedInfo.error : 'baked data loading';
		info(`${m.kind} · ${m.boneList.length} bones · ${m.clips.length} clips · ${(m.height * _v.y).toFixed(2)} m\nclip ${m.current} ${m.loco ? '(locomotion)' : ''}${lastEvent ? ` · last event ${lastEvent}` : ''}\n${baked}`);
	});

	return { gui };
}

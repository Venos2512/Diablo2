// VFX tab: spells on a castbar (keys 1–9 / right click), training dummies, play mode, simulation
// controls (slow motion, overdraw), the WebGPU compute particle field and the sources behind them.
import { createGUI, intro, note, readout } from '../ui/gui.js';
import { SPELLS, SPELL_ORDER } from '../vfx/spells.js';
import { SKILLS, SKILL_ORDER, SKILL_KEYS } from '../skills/skills.js';
import { CodeViewer } from '../ui/codeViewer.js';
import { toast } from '../ui/toast.js';
import particleVert from '../shaders/vfx/particle.vert.glsl';
import particleFrag from '../shaders/vfx/particle.frag.glsl';
import tslVfxSource from '../backends/webgpu/vfx.js?raw';
import spellsSource from '../vfx/spells.js?raw';
import particlesSource from '../vfx/particles.js?raw';
import skillsSource from '../skills/skills.js?raw';
import skillFxSource from '../skills/fx.js?raw';
import skillRuntimeSource from '../skills/runtime.js?raw';
import { setOverride, isOverridden } from '../core/shaderOverrides.js';
import { getShader } from '../core/shaderRegistry.js';

function region(source, name) {
	const marker = `// #region ${name}\n`;
	const start = source.indexOf(marker);
	if (start < 0) return source;
	const end = source.indexOf('// #endregion', start);
	const lines = source.slice(start + marker.length, end).replace(/\s+$/, '').split('\n');
	const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\t*/)[0].length));
	return lines.map((l) => l.slice(indent)).join('\n');
}

/** Play a quarks editor export at the VFX cursor (or the character when nothing is under the cursor). */
export function importQuarks(app, json, name) {
	try {
		const entry = app.vfxLab.importQuarks(json, name);
		toast(`three.quarks: ${name} · ${entry.systems.length} system${entry.systems.length > 1 ? 's' : ''}`, 'ok');
	} catch (e) {
		console.error(e);
		toast(`${name}: ${e.message}`, 'error', 6000);
	}
}

export function buildVfxPanel(app, el) {
	const lab = app.vfxLab;
	const s = lab.settings;
	const language = app.backend.language;
	const webgpu = !!app.backend.vfx.createComputeField;
	intro(el, 'VFX lab', `<p>Spells built from one particle material (${language}), pooled lights and decals, cast at training dummies that react with the Shaders-tab surface effects. Keys <b>1–9</b> or <b>right click</b> cast at the cursor; <b>Play mode</b> lets you walk the model around.</p>`);
	const gui = createGUI(el);
	const viewer = new CodeViewer();

	const arm = { get armed() { return lab.armed; }, set armed(v) { lab.arm(v); } };
	gui.add(arm, 'armed').name('VFX lab active').listen();
	note(gui, 'While active, 4 pooled point lights sit in the scene (intensity 0 when idle) so casting never changes the light count — toggling this recompiles lit materials once.');

	// Spells -------------------------------------------------------------------------------------------
	const fSpells = gui.addFolder('Spells');
	const options = Object.fromEntries(SPELL_ORDER.map((n) => [`${SPELLS[n].key} · ${SPELLS[n].label}`, n]));
	const pick = { get spell() { return s.selected; }, set spell(v) { lab.select(v); summary.innerHTML = SPELLS[v].summary; } };
	fSpells.add(pick, 'spell', options).name('Selected (right click)').listen();
	const summary = note(fSpells, SPELLS[s.selected]?.summary || '');
	fSpells.add({ cast: () => (lab.armed ? lab.cast(s.selected) : toast('Activate the VFX lab first', 'info', 1500)) }, 'cast').name('Cast at cursor / nearest dummy');
	fSpells.add({ clear: () => lab.resetEffects() }, 'clear').name('Clear all effects');

	// Play mode ----------------------------------------------------------------------------------------
	const fPlay = gui.addFolder('Play mode');
	const play = { get play() { return !!lab.playing; }, set play(v) { lab.setPlay(v); } };
	fPlay.add(play, 'play').name('Play mode (character controller)').listen();
	fPlay.add({ open: () => app.panels.show('character') }, 'open').name('Character tab (speeds, clips, camera)…');
	note(fPlay, 'Same controller as the <b>Character</b> tab: WASD or left click to walk, click a dummy to attack it, right click or <kbd>1</kbd>–<kbd>9</kbd> casts the selected spell (the character plays its cast clip). Try a <b>KayKit</b> character.');

	// Dummies --------------------------------------------------------------------------------------------
	const fDummies = gui.addFolder('Training dummies');
	fDummies.add(s, 'dummies', 0, 6, 1).name('Count').onFinishChange(() => {
		lab.save();
		if (lab.armed) lab.spawnDummies();
	});
	fDummies.add({ reset: () => lab.dummies.forEach((d) => { d.hp = d.maxHp; d.status.kind = null; if (!d.alive) d.state = 'dead'; }) }, 'reset').name('Heal / respawn all');
	note(fDummies, 'Each dummy carries its own status + rim + dissolve instances (applied once), so hits only change uniforms: frozen / burning / poisoned overlays, a white hit flash, dissolve on death and a reverse dissolve when it is summoned back.');

	// Simulation -------------------------------------------------------------------------------------------
	const fSim = gui.addFolder('Simulation');
	fSim.add(s, 'timeScale', 0.05, 2, 0.01).name('Time scale (slow motion)').onChange(() => lab.save());
	fSim.add(s, 'overdraw').name('Overdraw heat view').onChange((v) => {
		lab.save();
		app.backend.vfx.setOverdraw(v && lab.armed);
	});
	const stats = readout(fSim);

	// Skills (three.quarks) ---------------------------------------------------------------------------------
	const fSkills = gui.addFolder('Skills (three.quarks)');
	if (lab.skillsSupported) {
		const mode = { get skills() { return s.castMode === 'skills'; }, set skills(v) { lab.setCastMode(v ? 'skills' : 'spells'); } };
		fSkills.add(mode, 'skills').name('Castbar shows skills').listen();
		const skillOptions = Object.fromEntries(SKILL_ORDER.map((id, i) => [`${SKILL_KEYS[i]} · ${SKILLS[id].label} (${SKILLS[id].class})`, id]));
		const skillPick = { get skill() { return s.skill; }, set skill(v) { lab.selectSkill(v); skillSummary.innerHTML = describe(v); } };
		const describe = (id) => { const k = SKILLS[id]; return `<b>${k.element}</b> · cast ${k.castTime}s · cooldown ${k.cooldown}s${k.toggle ? ' · toggle' : ''}<br>${k.summary}`; };
		fSkills.add(skillPick, 'skill', skillOptions).name('Selected (right click / Q)').listen();
		const skillSummary = note(fSkills, describe(s.skill));
		fSkills.add({ cast: () => lab.castSkill(s.skill) }, 'cast').name('Cast at cursor');
		fSkills.add(s, 'skillLevel', 1, 4, 0.25).name('Skill level').onChange((v) => lab.setSkillLevel(v));
		fSkills.add({ get soft() { return s.quarksSoft; }, set soft(v) { lab.setQuarksSoft(v); } }, 'soft').name('Soft particles (scene depth)');
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json,application/json';
		input.addEventListener('change', async () => {
			const file = input.files?.[0];
			input.value = '';
			if (file) importQuarks(app, await file.text(), file.name);
		});
		fSkills.add({ load: () => input.click() }, 'load').name('Load quarks editor JSON…');
		fSkills.add({ again: () => (lab.lastImport ? importQuarks(app, lab.lastImport.json, lab.lastImport.name) : toast('Load a quarks JSON first', 'info', 1500)) }, 'again').name('Replay last JSON at cursor');
		note(fSkills, 'With <b>Castbar shows skills</b> on, keys <kbd>1</kbd>–<kbd>9</kbd> <kbd>0</kbd> <kbd>-</kbd> <kbd>=</kbd> cast the 12 skills, right click / <kbd>Q</kbd> the selected one; the buttons show cooldowns. A cast plays a charge effect at the hand for its cast time, then the skill runs: projectiles, a homing spirit, an expanding nova, a chain between targets, ticking areas, an aura that follows the caster. Kills play an elemental death (fire ash, cold shatter, shock, poison, bone). <b>Skill level</b> multiplies damage and scales the effects by √level — same look, bigger.<br>Engine: <a href="https://github.com/Alchemist0823/three.quarks" target="_blank" rel="noopener">three.quarks</a> (MIT) — effects are pooled and every system sharing a material is one draw (see the stats below). Design new effects in the <a href="https://quarks.art" target="_blank" rel="noopener">quarks editor</a> and drop the exported <code>.json</code> on the viewport.');
	} else {
		note(fSkills, 'The skill system runs on <b>three.quarks</b>, which builds GLSL <code>ShaderMaterial</code>s — <code>WebGPURenderer</code> cannot run them. Switch the renderer at the top to <b>WebGL2 · GLSL</b>.');
	}

	// Compute field ------------------------------------------------------------------------------------------
	const fCompute = gui.addFolder('GPU compute particles');
	if (webgpu) {
		const compute = { get on() { return !!lab.compute; }, set on(v) { lab.setCompute(v); } };
		fCompute.add(compute, 'on').name('Soul storm (compute shader)').listen();
		fCompute.add(s, 'computeCount', { '10k': 10000, '50k': 50000, '100k': 100000, '250k': 250000, '500k': 500000, '1M': 1000000 }).name('Particles').onChange(() => {
			lab.save();
			if (lab.compute) lab.setCompute(true);
		});
		const cu = () => lab.compute?.uniforms;
		const proxy = (key, scale = 1) => ({ get v() { return cu() ? cu()[key].value / scale : 0; }, set v(x) { if (cu()) cu()[key].value = x * scale; } });
		fCompute.add(proxy('swirl'), 'v', 0, 4, 0.01).name('Swirl').listen();
		fCompute.add(proxy('size'), 'v', 0.005, 0.12, 0.001).name('Size (m)').listen();
		fCompute.add(proxy('intensity'), 'v', 0, 10, 0.01).name('Intensity').listen();
		note(fCompute, 'Init + update are TSL compute shaders over storage buffers; the sprites read the positions buffer as an instanced attribute — nothing goes back to the CPU. Compare the HUD GPU time with the CPU particle spells.');
	} else {
		note(fCompute, language === 'GLSL'
			? 'Needs the <b>WebGPU · TSL</b> renderer — WebGL2 has no compute shaders (GPGPU there means render-to-texture ping-pong). Switch the renderer at the top to try it.'
			: 'This browser has no WebGPU device, so WebGPURenderer runs on WebGL2: compute shaders are unavailable.');
	}

	// Sources -------------------------------------------------------------------------------------------------
	const fSource = gui.addFolder('Source');
	const glslTab = (entry) => ({
		id: entry.path,
		label: `${entry.path.split('/').pop()}${isOverridden(entry.path) ? ' *' : ''}`,
		text: entry.code,
		editable: true,
		filename: entry.path.split('/').pop(),
		note: `<code>src/${entry.path}</code> — ${language === 'GLSL' ? 'runs now; Apply recompiles the particle material.' : 'runs in WebGL2 mode (edits are kept for it).'}`,
		onApply: (code) => setOverride(entry.path, code),
		onRevert: () => {
			setOverride(entry.path, null);
			return getShader(entry.path)?.original ?? entry.code;
		},
	});
	const open = (active) => viewer.open({
		title: 'VFX sources',
		subtitle: `running ${language}`,
		active,
		tabs: [
			glslTab(particleVert),
			glslTab(particleFrag),
			{ id: 'tsl-particle', label: 'TSL particle', text: region(tslVfxSource, 'particle'), filename: 'particle.tsl.js', note: '<code>src/backends/webgpu/vfx.js</code> — the same particle material as TSL (vertexNode + fragmentNode).' },
			{ id: 'tsl-compute', label: 'TSL compute field', text: region(tslVfxSource, 'compute'), filename: 'compute.tsl.js', note: 'WebGPU-only: compute shaders written in TSL.' },
			{ id: 'spells', label: 'spells.js', text: spellsSource, filename: 'spells.js', note: '<code>src/vfx/spells.js</code> — every preset is data for the emitters below plus a little gameplay glue.' },
			{ id: 'particles', label: 'particles.js', text: particlesSource, filename: 'particles.js', note: '<code>src/vfx/particles.js</code> — CPU simulation, instance attributes, one draw per emitter.' },
			{ id: 'skills', label: 'skills/skills.js', text: skillsSource, filename: 'skills.js', note: '<code>src/skills/skills.js</code> — the 12 skills: numbers + run(ctx).' },
			{ id: 'skill-fx', label: 'skills/fx.js', text: skillFxSource, filename: 'fx.js', note: '<code>src/skills/fx.js</code> — three.quarks effect library (one line per particle system) and the pooled runtime.' },
			{ id: 'skill-runtime', label: 'skills/runtime.js', text: skillRuntimeSource, filename: 'runtime.js', note: '<code>src/skills/runtime.js</code> — cast flow, motions (projectile, nova, area), damage and elemental deaths, host interface.' },
		],
	});
	fSource.add({ o: () => open(particleFrag.path) }, 'o').name('Particle shader (GLSL / TSL)…');
	fSource.add({ o: () => open('spells') }, 'o').name('Spell presets (spells.js)…');
	fSource.add({ o: () => open('skills') }, 'o').name('Skills + three.quarks effects…');
	if (webgpu) fSource.add({ o: () => open('tsl-compute') }, 'o').name('Compute field (TSL)…');
	fSource.close();

	function refreshStats() {
		if (!lab.armed) {
			stats('VFX lab inactive.');
			return;
		}
		const emitters = lab.particles ? lab.particles.emitters.size : 0;
		const lights = lab.lights ? lab.lights.slots.filter((x) => x.light.intensity > 0.01).length : 0;
		const k = lab.skills?.stats;
		const q = k ? `${k.particles.toLocaleString()} quarks particles · ${k.live}/${k.systems} systems live in ${k.batches} batches (draws) · ${k.instances} effects · ${k.bolts} bolts\n` : '';
		stats(`${(lab.particles?.count || 0).toLocaleString()} CPU particles · ${emitters} emitters (draws)\n${q}${lab.compute ? lab.compute.count.toLocaleString() + ' GPU particles · ' : ''}${lights}/4 lights lit · ${lab.actors.size} actors · ${lab.casts} casts`);
	}
	let timer = 0;
	app.on('update', (dt) => {
		timer += dt;
		if (timer > 0.25 && !el.hidden) {
			timer = 0;
			refreshStats();
		}
	});
	lab.onChange(() => gui.controllersRecursive().forEach((c) => c.updateDisplay()));
	refreshStats();

	return {
		gui,
		onShow() {
			if (!lab.armed) lab.arm(true);
		},
		refresh: refreshStats,
	};
}

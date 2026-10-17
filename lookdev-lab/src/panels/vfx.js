// VFX tab: spells on a castbar (keys 1–9 / right click), training dummies, play mode, simulation
// controls (slow motion, overdraw), the WebGPU compute particle field and the sources behind them.
import { createGUI, intro, note, readout } from '../ui/gui.js';
import { SPELLS, SPELL_ORDER } from '../vfx/spells.js';
import { CodeViewer } from '../ui/codeViewer.js';
import { toast } from '../ui/toast.js';
import particleVert from '../shaders/vfx/particle.vert.glsl';
import particleFrag from '../shaders/vfx/particle.frag.glsl';
import tslVfxSource from '../backends/webgpu/vfx.js?raw';
import spellsSource from '../vfx/spells.js?raw';
import particlesSource from '../vfx/particles.js?raw';
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
	fPlay.add(play, 'play').name('Play mode (follow camera)').listen();
	fPlay.add(s, 'moveSpeed', 1, 8, 0.1).name('Move speed (m/s)').onChange(() => lab.save());
	note(fPlay, 'Left click the ground to walk, click a dummy (or right click anywhere) to cast the selected spell. Animated models switch between idle / run / attack clips — try <b>Robot Expressive</b> or <b>Fox</b>.');

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
		],
	});
	fSource.add({ o: () => open(particleFrag.path) }, 'o').name('Particle shader (GLSL / TSL)…');
	fSource.add({ o: () => open('spells') }, 'o').name('Spell presets (spells.js)…');
	if (webgpu) fSource.add({ o: () => open('tsl-compute') }, 'o').name('Compute field (TSL)…');
	fSource.close();

	function refreshStats() {
		if (!lab.armed) {
			stats('VFX lab inactive.');
			return;
		}
		const emitters = lab.particles ? lab.particles.emitters.size : 0;
		const lights = lab.lights ? lab.lights.slots.filter((x) => x.light.intensity > 0.01).length : 0;
		stats(`${(lab.particles?.count || 0).toLocaleString()} CPU particles · ${emitters} emitters (draws)\n${lab.compute ? lab.compute.count.toLocaleString() + ' GPU particles · ' : ''}${lights}/4 lights lit · ${lab.actors.size} actors · ${lab.casts} casts`);
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

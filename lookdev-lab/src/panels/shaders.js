// Shaders tab: pick an effect, apply it to the model or a probe, tune it, read and edit its source
// (GLSL file, GLSL glue, TSL, compiled output) and measure its cost with an off/on A/B benchmark.
import * as THREE from 'three';
import { createGUI, intro, note, readout, relabelOptions } from '../ui/gui.js';
import { clearFolder } from './lookdev.js';
import { EFFECTS } from '../effects/registry.js';
import { TARGETS } from '../effects/lab.js';
import { CodeViewer } from '../ui/codeViewer.js';
import { RENDERER_MODES } from '../core/backend.js';
import { abTest, pushHistory, readHistory, clearHistory } from '../app/bench.js';
import { setOverride, isOverridden } from '../core/shaderOverrides.js';
import { getShader } from '../core/shaderRegistry.js';
import { toast } from '../ui/toast.js';
import glslGlue from '../backends/webgl/effects.js?raw';
import tslSource from '../backends/webgpu/effects.js?raw';
import tslNoise from '../backends/webgpu/tsl/noise.js?raw';
import windGlsl from '../shaders/effects/wind.glsl';
import flameVert from '../shaders/effects/flame.vert.glsl';
import flameFrag from '../shaders/effects/flame.frag.glsl';
import dissolveGlsl from '../shaders/effects/dissolve.glsl';
import statusGlsl from '../shaders/effects/status.glsl';
import rimGlsl from '../shaders/effects/rim.glsl';
import liquidGlsl from '../shaders/effects/liquid.glsl';
import quadVert from '../shaders/effects/vfx_quad.vert.glsl';
import portalFrag from '../shaders/effects/portal.frag.glsl';
import runesFrag from '../shaders/effects/runes.frag.glsl';
import noiseChunk from '../shaders/chunks/noise.glsl';
import surfaceChunk from '../shaders/chunks/surface.glsl';
import vfxChunk from '../shaders/chunks/vfx.glsl';

/** GLSL files of each effect, then the shared chunks it includes. */
const GLSL_FILES = {
	wind: [[windGlsl], [noiseChunk]],
	flame: [[flameVert, flameFrag], [noiseChunk, vfxChunk]],
	dissolve: [[dissolveGlsl], [noiseChunk]],
	status: [[statusGlsl], [noiseChunk, surfaceChunk]],
	rim: [[rimGlsl], [surfaceChunk]],
	liquid: [[liquidGlsl], [noiseChunk]],
	portal: [[quadVert, portalFrag], [noiseChunk, vfxChunk]],
	runes: [[quadVert, runesFrag], [noiseChunk, vfxChunk]],
};

const fileName = (entry) => entry.path.split('/').pop();

/** Text between `// #region name` and the next `// #endregion`, de-indented. */
function region(source, name) {
	const marker = `// #region ${name}\n`;
	const start = source.indexOf(marker);
	if (start < 0) return null;
	const end = source.indexOf('// #endregion', start);
	const lines = source.slice(start + marker.length, end).replace(/\s+$/, '').split('\n');
	const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^\t*/)[0].length));
	return lines.map((l) => l.slice(indent)).join('\n');
}

const ms = (v) => (v === null || v === undefined ? '—' : `${v.toFixed(3)} ms`);
const signed = (v) => (v === null || v === undefined ? '—' : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(3)} ms`);

export function buildShadersPanel(app, el) {
	const lab = app.shaderLab;
	const backend = app.backend;
	const language = backend.language;
	const modeInfo = RENDERER_MODES[app.mode];
	intro(el, 'Shader lab', `<p>Every effect is written twice — <b>GLSL</b> for WebGL2 and <b>TSL</b> for WebGPU — with the same parameters and maths. Running now: <b>${language}</b> (${modeInfo.label}). Switch the renderer at the top to compare look and cost; your effect settings come along.</p>`);
	const gui = createGUI(el);
	const viewer = new CodeViewer();
	const settings = lab.settings;

	// Effect picker ---------------------------------------------------------------------------------
	const pick = { effect: EFFECTS[settings.effect] ? settings.effect : 'dissolve' };
	const effectOptions = () => Object.fromEntries(Object.entries(EFFECTS).map(([id, def]) => [`${lab.isEnabled(id) ? '● ' : ''}${def.label} · ${def.kind === 'vfx' ? 'VFX' : 'surface'}`, id]));
	const effectController = gui.add(pick, 'effect', effectOptions()).name('Effect').onChange((id) => {
		settings.effect = id;
		lab.save();
		buildEffect();
	});

	const fEffect = gui.addFolder('Effect');
	const fParams = gui.addFolder('Parameters');
	const fSource = gui.addFolder('Source');
	const fBench = gui.addFolder('Cost · A/B benchmark');
	const fActive = gui.addFolder('Active effects');

	let enabledController = null;
	let applyInfo = null;

	function buildEffect() {
		const name = pick.effect;
		const def = EFFECTS[name];
		const st = lab.state(name);
		clearFolder(fEffect);
		clearFolder(fParams);
		note(fEffect, def.summary);
		const proxy = {
			get enabled() {
				return lab.isEnabled(name);
			},
			set enabled(v) {
				try {
					lab.setEnabled(name, v);
					reportApply(name);
				} catch (error) {
					console.error(error);
					toast(`${def.label}: ${error.message}`, 'error', 6000);
				}
			},
		};
		enabledController = fEffect.add(proxy, 'enabled').name(`Enabled (${language})`);
		if (def.kind === 'surface') {
			const targetProxy = {
				get target() {
					return lab.state(name).target;
				},
				set target(v) {
					lab.setTarget(name, v);
					reportApply(name);
				},
			};
			fEffect.add(targetProxy, 'target', Object.fromEntries(Object.entries(TARGETS).map(([id, label]) => [label, id]))).name('Apply to');
		} else {
			note(fEffect, 'Rendered in the VFX layer (premultiplied, soft depth fade against the scene), placed next to the model.');
		}
		if (def.animate) {
			fEffect.add({ get animate() { return !!lab.state(name).animate; }, set animate(v) { lab.setAnimate(name, v); } }, 'animate').name(`Animate ${def.params[def.animate.param].label?.toLowerCase() || def.animate.param}`);
		}
		applyInfo = readout(fEffect);
		reportApply(name);

		for (const [key, p] of Object.entries(def.params)) {
			let c;
			if (p.type === 'color') c = fParams.addColor(st.params, key);
			else if (p.type === 'select') c = fParams.add(st.params, key, p.options);
			else c = fParams.add(st.params, key, p.min, p.max, p.step);
			c.name(p.label || key).onChange((v) => lab.setParam(name, key, v));
			if (def.animate?.param === key) c.listen();
		}
		fParams.add({ reset: () => lab.resetParams(name) }, 'reset').name('Reset parameters');
		buildSource(name);
		buildBench(name);
	}

	function reportApply(name) {
		if (!applyInfo) return;
		const def = EFFECTS[name];
		if (!lab.isEnabled(name)) {
			applyInfo('Off');
			return;
		}
		if (def.kind === 'vfx') {
			applyInfo(`On · ${language} material in the VFX layer`);
			return;
		}
		const info = lab.lastApply?.name === name ? lab.lastApply : null;
		const target = TARGETS[lab.applied.get(name) || lab.state(name).target];
		if (!info) applyInfo(`On · ${target}`);
		else applyInfo(`On · ${target}: ${info.meshes - info.skipped}/${info.meshes} meshes${info.skipped ? ` (${info.skipped} skipped: not a MeshStandard/Physical material)` : ''}`);
	}

	// Source ----------------------------------------------------------------------------------------
	function sourceTabs(name) {
		const [files, chunks] = GLSL_FILES[name];
		const glslNote = language === 'GLSL'
			? 'Runs now. <b>Apply</b> recompiles every material using it (like saving the file with <code>npm run dev</code>). Edits are kept in this browser; <b>Download</b> to keep them in the project.'
			: 'Runs in <b>WebGL2 · GLSL</b> mode. You can edit it here; the edit is kept and used next time you switch the renderer to WebGL2.';
		const glslTab = (entry, kind) => ({
			id: entry.path,
			label: `${kind === 'chunk' ? 'chunk · ' : ''}${fileName(entry)}${isOverridden(entry.path) ? ' *' : ''}`,
			text: entry.code,
			editable: true,
			filename: fileName(entry),
			note: `<code>src/${entry.path}</code> — ${glslNote}`,
			onApply(code) {
				setOverride(entry.path, code);
				toast(`${fileName(entry)} applied${language === 'GLSL' ? '' : ' (used in WebGL2 mode)'}`, 'ok', 1600);
			},
			onRevert() {
				setOverride(entry.path, null);
				toast(`${fileName(entry)} reverted to the file`, 'ok', 1600);
				return getShader(entry.path)?.original ?? entry.code;
			},
		});
		const object = lab.representative(name);
		const compiledNote = (stage) => {
			const where = language === 'GLSL' ? 'WebGLRenderer program actually in use' : 'node builder output for a direct render (the scene pass adds MRT outputs)';
			const state = lab.isEnabled(name) ? '' : ' <b>The effect is off</b> — enable it to see its code in the output.';
			return `Final ${stage} shader of <b>${object?.name || '—'}</b>: ${where}.${state}`;
		};
		const compiled = (stage) => async () => {
			if (!object) return '// Enable the effect first (no object to inspect yet).';
			const scene = EFFECTS[name].kind === 'vfx' ? app.world.vfxScene : app.world.scene;
			const src = await backend.shaderSource(object, scene, app.world.camera);
			if (!src) return '// Not compiled yet — let a frame render with the effect visible, then reopen.';
			return `// ${src.language} · material “${src.material}”\n${stage === 'vertex' ? src.vertex : src.fragment}`;
		};
		return [
			...files.map((e) => glslTab(e, 'file')),
			{ id: 'glue', label: 'GLSL glue (JS)', text: region(glslGlue, name) || '// not found', filename: `${name}.glsl-glue.js`, note: '<code>src/backends/webgl/effects.js</code> — how the GLSL is wired in: <code>onBeforeCompile</code> patches anchored on three.js shader chunks (surface effects) or a <code>ShaderMaterial</code> (VFX).' },
			{ id: 'tsl', label: 'TSL', text: region(tslSource, name) || '// not found', filename: `${name}.tsl.js`, note: `<code>src/backends/webgpu/effects.js</code> — the same effect as TSL node graphs (node slots / <code>fragmentNode</code>). ${language === 'TSL' ? 'Runs now.' : 'Runs in the WebGPU modes.'} TSL is JavaScript: edit the file with <code>npm run dev</code> running (the page reloads).` },
			{ id: 'compiled-fragment', label: `Compiled fragment (${language === 'TSL' ? (backend.isWebGPU ? 'WGSL' : 'GLSL') : 'GLSL'})`, load: compiled('fragment'), note: compiledNote('fragment'), filename: `${name}.compiled.frag.txt` },
			{ id: 'compiled-vertex', label: 'Compiled vertex', load: compiled('vertex'), note: compiledNote('vertex'), filename: `${name}.compiled.vert.txt` },
			...chunks.map((e) => glslTab(e, 'chunk')),
			{ id: 'tsl-noise', label: 'TSL · noise.js', text: tslNoise, filename: 'noise.js', note: '<code>src/backends/webgpu/tsl/noise.js</code> — 1:1 port of <code>lab_noise</code> (same hashes and constants) so both languages draw the same pattern.' },
		];
	}

	function openSource(name, active) {
		viewer.open({ title: EFFECTS[name].label, subtitle: `${modeInfo.label} · running ${language}`, tabs: sourceTabs(name), active });
	}

	function buildSource(name) {
		clearFolder(fSource);
		const [files] = GLSL_FILES[name];
		fSource.add({ open: () => openSource(name, files[files.length - 1].path) }, 'open').name('GLSL source (editable)…');
		fSource.add({ open: () => openSource(name, 'tsl') }, 'open').name('TSL source…');
		fSource.add({ open: () => openSource(name, 'compiled-fragment') }, 'open').name(`Compiled shader (${language === 'TSL' && backend.isWebGPU ? 'WGSL' : 'GLSL'})…`);
	}

	// Benchmark -------------------------------------------------------------------------------------
	const benchState = { frames: 60, rounds: 2, frameTarget: true };
	let running = false;
	let benchOut = null;
	let historyOut = null;

	function describe(entry) {
		const gpu = entry.onGpu !== null && entry.offGpu !== null ? ` · GPU ${signed(entry.onGpu - entry.offGpu)}` : '';
		const pct = entry.offWall > 0 ? ` (${(((entry.onWall - entry.offWall) / entry.offWall) * 100).toFixed(1)}%)` : '';
		return `${signed(entry.onWall - entry.offWall)}${pct}${gpu}`;
	}

	function showHistory(name) {
		if (!historyOut) return;
		const latest = new Map();
		for (const e of readHistory()) if (e.kind === 'effect' && e.effect === name) latest.set(e.mode, e);
		if (!latest.size) {
			historyOut('No results yet for this effect.');
			return;
		}
		const rows = [...latest.values()].map((e) => `${(RENDERER_MODES[e.mode]?.short || e.mode).padEnd(14)} ${describe(e)}\n${' '.repeat(15)}off ${ms(e.offWall)} · ${e.resolution} · ${e.date.slice(0, 10)}`);
		historyOut(`Latest per renderer (frame cost added by the effect):\n${rows.join('\n')}`);
	}

	async function runBench(name) {
		if (running) return;
		running = true;
		const def = EFFECTS[name];
		const wasEnabled = lab.isEnabled(name);
		const camera = app.rig.state();
		const turntable = app.subject.turntable;
		try {
			benchOut('Preparing…');
			if (!wasEnabled) lab.setEnabled(name, true, { persist: false });
			const object = lab.representative(name);
			if (benchState.frameTarget && object) {
				const box = new THREE.Box3().setFromObject(object);
				if (!box.isEmpty()) app.rig.frame(box);
			}
			const results = await abTest(app, [
				{ label: 'off', apply: () => lab.setEnabled(name, false, { persist: false }) },
				{ label: 'on', apply: () => lab.setEnabled(name, true, { persist: false }) },
			], {
				frames: Number(benchState.frames),
				rounds: Number(benchState.rounds),
				onProgress: (p, label) => benchOut(`Measuring… ${Math.round(p * 100)}% (effect ${label})`),
			});
			const [off, on] = results;
			const size = app.size;
			const entry = {
				kind: 'effect',
				effect: name,
				mode: app.mode,
				language,
				gpu: backend.caps.gpu,
				resolution: `${Math.round(size.w * size.pr)}×${Math.round(size.h * size.pr)}`,
				target: def.kind === 'surface' ? lab.state(name).target : 'vfx',
				offWall: off.wall,
				onWall: on.wall,
				offGpu: off.gpu,
				onGpu: on.gpu,
			};
			pushHistory(entry);
			benchOut(`Effect off  ${ms(off.wall)}/frame${off.gpu !== null ? ` · GPU ${ms(off.gpu)}` : ''}\nEffect on   ${ms(on.wall)}/frame${on.gpu !== null ? ` · GPU ${ms(on.gpu)}` : ''}\nCost        ${describe(entry)}\n${entry.resolution} · ${modeInfo.short} · ${language}${backend.caps.gpuTimer ? '' : ' · no GPU timer in this browser (burst timing only)'}`);
			showHistory(name);
		} catch (error) {
			console.error(error);
			benchOut(`Benchmark failed: ${error.message}`);
		} finally {
			lab.setEnabled(name, wasEnabled, { persist: false });
			app.subject.turntable = turntable;
			if (benchState.frameTarget) app.rig.restore(camera);
			running = false;
			enabledController?.updateDisplay();
			refreshActive();
		}
	}

	function buildBench(name) {
		clearFolder(fBench);
		note(fBench, 'Renders bursts of frames with the effect <b>off</b> and <b>on</b> (alternating, median of rounds) and reports what it adds per frame. Bring the target close — per-pixel cost scales with screen coverage. Results are kept per renderer so you can switch and compare.');
		fBench.add(benchState, 'frames', [30, 60, 120, 240]).name('Frames per sample');
		fBench.add(benchState, 'rounds', [1, 2, 3, 5]).name('Rounds');
		fBench.add(benchState, 'frameTarget').name('Frame the target first');
		fBench.add({ run: () => runBench(name) }, 'run').name('Measure: effect off vs on');
		benchOut = readout(fBench);
		benchOut('Not measured in this session.');
		historyOut = readout(fBench);
		showHistory(name);
		fBench.add({ clear: () => (clearHistory((e) => e.kind === 'effect' && e.effect === name), showHistory(name)) }, 'clear').name('Clear results for this effect');
	}

	// Active effects ----------------------------------------------------------------------------------
	const activeOut = readout(fActive);
	note(fActive, 'Effects stack: enable several (e.g. Status + Rim + Dissolve on the model). Both languages compose them in the same order: wind → puddle → status → rim → dissolve.');
	fActive.add({ off: () => lab.activeEffects().forEach((n) => lab.setEnabled(n, false)) }, 'off').name('Disable all');

	function refreshActive() {
		const active = lab.activeEffects();
		activeOut(active.length ? active.map((n) => `● ${EFFECTS[n].label}${EFFECTS[n].kind === 'surface' ? ` → ${TARGETS[lab.applied.get(n) || lab.state(n).target]}` : ''}`).join('\n') : 'None');
		relabelOptions(effectController, Object.keys(effectOptions()));
	}

	lab.onChange((name) => {
		refreshActive();
		if (name === pick.effect) {
			enabledController?.updateDisplay();
			fParams.controllersRecursive().forEach((c) => c.updateDisplay());
			reportApply(name);
		}
	});
	app.on('subject', () => reportApply(pick.effect));

	buildEffect();
	refreshActive();
	fSource.close();

	return {
		gui,
		refresh() {
			reportApply(pick.effect);
			refreshActive();
		},
	};
}

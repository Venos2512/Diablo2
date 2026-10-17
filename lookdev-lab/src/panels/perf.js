import { createGUI, intro, note, readout } from '../ui/gui.js';
import { QUALITY_PRESETS, applyQualityPreset } from '../core/quality.js';
import { RENDERER_MODES, switchMode } from '../core/backend.js';
import { applyShadowSettings } from './lighting.js';
import { SCENES } from '../scenes/index.js';
import { runSceneBenchmark, runFeatureCosts, FEATURES } from '../app/benchRunner.js';
import { readHistory, clearHistory } from '../app/bench.js';
import { toast } from '../ui/toast.js';

const ms = (v) => (v === null || v === undefined || !Number.isFinite(v) ? '   —   ' : v.toFixed(2).padStart(6) + ' ms');
const delta = (a, b) => (a === null || b === null || a === undefined || b === undefined ? '—' : `${b - a >= 0 ? '+' : '−'}${Math.abs(b - a).toFixed(2)} ms`);
const modeShort = (id) => RENDERER_MODES[id]?.short || id;

export function buildPerfPanel(app, el) {
	const s = app.settings.data;
	intro(el, 'Performance', '<p>Renderer details, quality presets, live pass timings, scripted benchmarks that compare renderers, stress tests, video capture and presets.</p>');
	const gui = createGUI(el);
	const b = app.backend;

	const fInfo = gui.addFolder('Renderer');
	const info = readout(fInfo);
	info([
		`Mode       ${app.modeInfo.label}`,
		`Backend    ${b.kind === 'webgl' ? 'WebGLRenderer' : 'WebGPURenderer'} → ${b.kind === 'webgl' ? 'WebGL2' : b.isWebGPU ? 'WebGPU' : 'WebGL2 (fallback)'}`,
		`Shaders    ${b.language}${b.kind === 'webgpu' ? (b.isWebGPU ? ' → WGSL' : ' → GLSL ES 3.0') : ''}`,
		`GPU        ${b.caps.gpu || 'unknown'}`,
		`GPU timer  ${b.caps.gpuTimer ? 'yes' : 'no'}   Compute: ${b.caps.compute ? (b.isWebGPU ? 'yes (native)' : b.kind === 'webgpu' ? 'emulated (transform feedback)' : 'no') : 'no'}`,
		`Max aniso  ${b.caps.maxAnisotropy}`,
	].join('\n'));
	const switcher = { mode: app.mode };
	fInfo.add(switcher, 'mode', Object.fromEntries(Object.values(RENDERER_MODES).map((m) => [m.label, m.id]))).name('Switch renderer').onChange((m) => switchMode(m, () => app.saveSession()));
	note(fInfo, 'Switching reloads the page; camera, settings and the A/B snapshot are kept, so you can compare renderers on the same frame.');

	const fQ = gui.addFolder('Quality');
	fQ.add(s, 'quality', Object.fromEntries(Object.entries(QUALITY_PRESETS).map(([id, q]) => [q.label, id]))).name('Preset').onChange((id) => {
		applyQualityPreset(app.settings, id);
		app.applyQuality();
		app.applyPost();
		applyShadowSettings(app);
		app.panels.refresh();
	});
	fQ.add(s.view, 'renderScale', 0.25, 2, 0.05).name('Render scale').onChange(() => {
		app.settings.changed('view');
		app.resize();
	});
	note(fQ, 'Render scale multiplies the device pixel ratio (capped by the preset). Lower it to find where you are GPU-bound.');

	const fPass = gui.addFolder('Live timings');
	const live = readout(fPass);
	const timer = setInterval(() => {
		if (el.hidden) return;
		const d = app.hud.data;
		if (!d.info) return;
		const lines = [
			`FPS ${d.fps.toFixed(1)}   CPU ${d.cpu.toFixed(2)} ms   GPU ${d.gpu == null ? 'n/a' : d.gpu.toFixed(2) + ' ms'}`,
			`Draw calls ${d.info.calls}   Triangles ${d.info.triangles.toLocaleString()}`,
			`Geometries ${d.info.geometries}   Textures ${d.info.textures}${d.info.programs != null ? `   Programs ${d.info.programs}` : ''}`,
			...(d.passes || []).map((p) => `  ${p.label.padEnd(10)} ${p.ms.toFixed(3)} ms`),
		];
		live(lines.join('\n'));
	}, 300);

	// Benchmarks ---------------------------------------------------------------------------------------
	const fBench = gui.addFolder('Benchmark · compare renderers');
	note(fBench, 'Frame cost = burst of frames with no vsync wait, GPU synced (CPU + GPU, whichever bounds); GPU = timer queries when the browser has them. Results are kept per renderer — run, switch renderer, run again, compare below.');
	const benchState = { scenes: 'all', frames: 90 };
	fBench.add(benchState, 'scenes', { 'All scenes': 'all', 'Current scene': 'current' }).name('Scenes');
	fBench.add(benchState, 'frames', [30, 60, 90, 180, 360]).name('Frames per sample');
	const benchOut = readout(fBench);
	benchOut('Idle.');
	let running = false;
	const guard = async (fn) => {
		if (running) return toast('A benchmark is already running', 'info', 1500);
		running = true;
		const t0 = performance.now();
		let status;
		try {
			await fn();
			status = `Done in ${Math.round((performance.now() - t0) / 1000)} s — results below.`;
		} catch (error) {
			console.error(error);
			status = `Failed: ${error.message}`;
		} finally {
			running = false;
			showResults();
			benchOut(status ?? 'Stopped.');
		}
	};
	fBench.add({ run: () => guard(async () => {
		const scenes = benchState.scenes === 'all' ? Object.keys(SCENES) : [app.current.id];
		await runSceneBenchmark(app, { scenes, frames: Number(benchState.frames), onProgress: (p, label) => benchOut(`${Math.round(p * 100)}% · ${label}`) });
	}) }, 'run').name('Run scene benchmark');
	fBench.add({ run: () => guard(async () => {
		const features = Object.keys(FEATURES).filter((f) => f !== 'fog' || app.settings.data.post.fog.enabled || app.current.postDefaults?.fog?.enabled);
		await runFeatureCosts(app, { features, frames: Math.min(120, Number(benchState.frames)), onProgress: (p, label) => benchOut(`${Math.round(p * 100)}% · ${label}`) });
	}) }, 'run').name('Measure feature costs (current scene)');
	const results = readout(fBench);
	fBench.add({ clear: () => (clearHistory((e) => e.kind === 'scene' || e.kind === 'feature'), showResults()) }, 'clear').name('Clear results');

	function showResults() {
		const history = readHistory();
		const latest = new Map();
		for (const e of history) if (e.kind === 'scene' || e.kind === 'feature') latest.set(`${e.kind}|${e.scene}|${e.feature || ''}|${e.mode}`, e);
		const entries = [...latest.values()];
		const modes = [...new Set(entries.map((e) => e.mode))];
		if (!entries.length) {
			results('No results yet.');
			return;
		}
		const lines = [];
		const scenes = [...new Set(entries.filter((e) => e.kind === 'scene').map((e) => e.scene))];
		if (scenes.length) {
			lines.push(`Scene frame cost (GPU)   ${modes.map((m) => modeShort(m).padStart(16)).join('')}`);
			for (const id of scenes) {
				const row = modes.map((m) => {
					const e = latest.get(`scene|${id}||${m}`);
					return (e ? `${e.wall.toFixed(2)}${e.gpu ? ` (${e.gpu.toFixed(2)})` : ''}` : '—').padStart(16);
				});
				lines.push(`${(SCENES[id]?.label || id).slice(0, 24).padEnd(25)}${row.join('')}`);
			}
		}
		const feats = [...new Set(entries.filter((e) => e.kind === 'feature').map((e) => `${e.scene}|${e.feature}`))];
		if (feats.length) {
			lines.push('', `Feature cost (on − off)  ${modes.map((m) => modeShort(m).padStart(16)).join('')}`);
			for (const key of feats) {
				const [scene, feature] = key.split('|');
				const row = modes.map((m) => {
					const e = latest.get(`feature|${scene}|${feature}|${m}`);
					return (e ? delta(e.offWall, e.onWall) : '—').padStart(16);
				});
				lines.push(`${`${FEATURES[feature]?.label || feature}`.slice(0, 17).padEnd(18)}${scene.slice(0, 6).padEnd(7)}${row.join('')}`);
			}
		}
		const sample = entries[entries.length - 1];
		lines.push('', `${sample.resolution} · quality ${sample.quality} · ${sample.gpuName || ''}`.trim());
		results(lines.join('\n'));
	}

	// Stress tests ----------------------------------------------------------------------------------------
	const fStress = gui.addFolder('Stress tests');
	const stress = app.stress;
	const st = { crowd: 0, lights: 0, emitters: 0 };
	fStress.add(st, 'crowd', [0, 9, 25, 49, 100, 225, 400]).name('Model copies (crowd)').onChange((n) => stress.setCrowd(Number(n)));
	fStress.add(st, 'lights', [0, 4, 8, 16, 32, 64]).name('Moving point lights').onChange((n) => stress.setLights(Number(n)));
	fStress.add(st, 'emitters', [0, 4, 10, 20, 40]).name('Fire + smoke emitters').onChange((n) => stress.setEmitters(Number(n)));
	fStress.add({ clear: () => { stress.clear(); Object.assign(st, { crowd: 0, lights: 0, emitters: 0 }); fStress.controllersRecursive().forEach((c) => c.updateDisplay()); } }, 'clear').name('Clear stress objects');
	note(fStress, 'Crowd copies share geometry and materials (draw calls and skinning scale with the count). Each light adds per-pixel cost to every lit material — and changes the shader permutation, so the first frame after a change recompiles. Watch the HUD while you raise them.');

	// Capture & presentation ---------------------------------------------------------------------------------
	const fCap = gui.addFolder('Capture & presentation');
	const rec = app.recorder;
	const capState = { fps: 60, mbps: 16, turntable: 8, orbit: 0.6, cycle: 0 };
	const recLabel = { get label() { return rec.recording ? `● REC ${rec.seconds.toFixed(1)} s` : 'Idle'; } };
	fCap.add({ shot: () => app.screenshot() }, 'shot').name('Screenshot PNG (P)');
	fCap.add(capState, 'fps', [24, 30, 60]).name('Video fps');
	fCap.add(capState, 'mbps', [4, 8, 16, 32]).name('Video Mbit/s');
	fCap.add({ toggle: () => (rec.recording ? rec.stop() : rec.start({ fps: Number(capState.fps), mbps: Number(capState.mbps) })) }, 'toggle').name('Start / stop recording');
	fCap.add(recLabel, 'label').name('Recorder').listen().disable();
	fCap.add(capState, 'turntable', 4, 20, 1).name('Turntable length (s)');
	fCap.add({ go: () => rec.turntable(capState.turntable) }, 'go').name('Record one turntable revolution');
	fCap.add(capState, 'orbit', 0.1, 3, 0.1).name('Presentation orbit speed');
	fCap.add(capState, 'cycle', [0, 15, 30, 60]).name('Cycle scenes every (s)');
	fCap.add({ go: () => app.presentation.start({ orbitSpeed: capState.orbit, cycleSeconds: Number(capState.cycle) }) }, 'go').name('Presentation mode (H / Esc exits)');
	if (!rec.supported) note(fCap, 'Video capture needs MediaRecorder + canvas.captureStream (Chrome, Edge, Firefox).');

	// Presets ---------------------------------------------------------------------------------------------------
	const fPreset = gui.addFolder('Settings presets');
	fPreset.add({ save: () => {
		app.saveSession();
		const blob = new Blob([app.settings.export()], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `lookdev-lab-preset-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 2000);
	} }, 'save').name('Export settings (.json)');
	fPreset.add({ load: () => document.getElementById('file-input').click() }, 'load').name('Import settings… (or drop the .json)');
	let armedReset = false;
	const resetController = fPreset.add({ reset: () => {
		if (!armedReset) {
			armedReset = true;
			resetController.name('Click again to reset everything');
			setTimeout(() => {
				armedReset = false;
				resetController.name('Reset all settings');
			}, 3000);
			return;
		}
		app.settings.reset();
		location.reload();
	} }, 'reset').name('Reset all settings');
	note(fPreset, 'A preset stores every tab: post, lighting, scenes, shader-lab and VFX-lab settings. Share it with someone running the same build to see exactly your setup.');

	showResults();
	return { gui, refresh: showResults, dispose: () => clearInterval(timer) };
}

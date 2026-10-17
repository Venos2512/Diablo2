// Scripted benchmarks for the Performance tab: every scene from its home camera, and the frame cost of
// individual pipeline features on the current scene (A/B, off vs on). Results go to the shared history
// (app/bench.js) tagged with the renderer mode, so switching renderers builds a comparison table.
import { burst, sampleGpu, abTest, pushHistory } from './bench.js';

const resolution = (app) => `${Math.round(app.size.w * app.size.pr)}×${Math.round(app.size.h * app.size.pr)}`;

function baseEntry(app) {
	return {
		mode: app.mode,
		language: app.backend.language,
		gpuName: app.backend.caps.gpu,
		resolution: resolution(app),
		quality: app.settings.data.quality,
	};
}

/** Each scene from its home view: wall ms per frame (burst) and GPU ms when a timer exists. */
export async function runSceneBenchmark(app, { scenes, frames = 90, onProgress } = {}) {
	const startScene = app.current.id;
	const camera = app.rig.state();
	const results = [];
	try {
		for (let i = 0; i < scenes.length; i++) {
			const id = scenes[i];
			onProgress?.(i / scenes.length, `Preparing ${id}…`);
			await app.setScene(id, { keepCamera: false });
			app.goHome();
			await app.nextFrames(40);
			onProgress?.((i + 0.5) / scenes.length, `Measuring ${id}…`);
			const gpu = await sampleGpu(app, 40);
			const wall = await burst(app, frames);
			const info = app.backend.info();
			const entry = { kind: 'scene', scene: id, ...baseEntry(app), wall, gpu, calls: info.calls, triangles: info.triangles };
			pushHistory(entry);
			results.push(entry);
		}
	} finally {
		await app.setScene(startScene);
		app.rig.setMode(camera.mode || 'orbit');
		app.rig.restore(camera);
		onProgress?.(1, 'done');
	}
	return results;
}

/** Pipeline features toggled on the current scene; each returns a restore function. */
export const FEATURES = {
	ao: {
		label: 'Ambient occlusion (GTAO)',
		set(app, on) {
			app.settings.data.post.ao.enabled = on;
			app.applyPost();
		},
		get: (app) => app.settings.data.post.ao.enabled,
	},
	bloom: {
		label: 'Bloom',
		set(app, on) {
			app.settings.data.post.bloom.enabled = on;
			app.applyPost();
		},
		get: (app) => app.settings.data.post.bloom.enabled,
	},
	aa: {
		label: 'SMAA (vs no AA)',
		set(app, on) {
			app.settings.data.post.aa = on ? 'smaa' : 'none';
			app.applyPost();
		},
		get: (app) => app.settings.data.post.aa === 'smaa',
	},
	fog: {
		label: 'Height fog',
		set(app, on) {
			app.settings.data.post.fog.enabled = on;
			app.applyPost();
		},
		get: (app) => app.settings.data.post.fog.enabled,
	},
	shadows: {
		label: 'Shadow maps',
		set(app, on) {
			app.backend.setShadowsEnabled(on);
		},
		get: (app) => app.backend.renderer.shadowMap.enabled,
	},
};

export async function runFeatureCosts(app, { features = Object.keys(FEATURES), frames = 60, rounds = 2, onProgress } = {}) {
	const results = [];
	for (let i = 0; i < features.length; i++) {
		const f = FEATURES[features[i]];
		const original = f.get(app);
		try {
			const [off, on] = await abTest(app, [
				{ label: 'off', apply: () => f.set(app, false) },
				{ label: 'on', apply: () => f.set(app, true) },
			], {
				frames,
				rounds,
				onProgress: (p, label) => onProgress?.((i + p) / features.length, `${f.label}: ${label}`),
			});
			const entry = { kind: 'feature', feature: features[i], scene: app.current.id, ...baseEntry(app), offWall: off.wall, onWall: on.wall, offGpu: off.gpu, onGpu: on.gpu };
			pushHistory(entry);
			results.push(entry);
		} finally {
			f.set(app, original);
		}
	}
	app.settings.changed('post');
	onProgress?.(1, 'done');
	return results;
}

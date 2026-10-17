// A/B frame-cost measurement shared by the Shaders tab and the benchmark runner.
//
// Two numbers per condition:
// - burst: N frames rendered back to back with the loop paused, then a GPU sync (fence / queue
//   done). Wall time / N is the frame cost when nothing waits for vsync — CPU + GPU, whichever bounds.
// - gpu: the backend's GPU timer (timer queries / timestamp queries) sampled while the loop runs
//   normally, when the browser exposes one. Not available everywhere (e.g. Firefox, some Safari).
// Conditions alternate over several rounds and the median is reported, so drift (thermal, other
// tabs) affects both sides equally.

const median = (values) => {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = sorted.length >> 1;
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** Wall-clock ms per frame for a burst of `frames` frames (loop paused, GPU synced on both ends). */
export async function burst(app, frames) {
	const wasRunning = app.loopRunning;
	app.pauseLoop();
	app.backend.setTimestampTracking?.(false);
	try {
		await app.backend.sync();
		const t0 = performance.now();
		for (let i = 0; i < frames; i++) app.frame(performance.now());
		await app.backend.sync();
		return (performance.now() - t0) / frames;
	} finally {
		app.backend.setTimestampTracking?.(true);
		if (wasRunning) app.resumeLoop();
	}
}

/**
 * Median GPU ms per frame from the backend timer over `frames` real-time frames (null when unsupported).
 * Reads the raw per-frame results, not the smoothed HUD value: the smoothing would carry the previous
 * condition into the measurement and shrink A/B differences. Results arrive a few frames late, and the
 * first one after the start may still cover earlier frames, so it is skipped.
 */
export async function sampleGpu(app, frames) {
	if (!app.backend.caps.gpuTimer) return null;
	const samples = [];
	const start = app.backend.timings().serial ?? 0;
	let seen = start;
	const collect = () => {
		const { raw, serial } = app.backend.timings();
		if (serial === seen) return;
		seen = serial;
		if (serial > start + 1 && Number.isFinite(raw) && raw > 0) samples.push(raw);
	};
	if (app.loopRunning) {
		await app.nextFrames(frames, collect);
		for (let i = 0; i < 12 && samples.length < 3; i++) await app.nextFrames(1, collect);
	} else {
		// Loop paused (headless checks): nothing paces the CPU, which can then run so far ahead of a slow
		// GPU that timer results never come back. Wait for the GPU after every frame instead.
		for (let i = 0; i < frames + 12 && (i < frames || samples.length < 3); i++) {
			app.frame(performance.now());
			await app.backend.sync();
			await new Promise((resolve) => setTimeout(resolve, 0));
			collect();
		}
	}
	return samples.length ? median(samples) : null;
}

/**
 * conditions: [{ label, apply: async () => {} }]. Returns [{ label, wall, gpu }] (ms, medians).
 * `warmup` real-time frames after each switch let programs compile and timers settle.
 */
export async function abTest(app, conditions, { frames = 60, rounds = 2, warmup = 24, gpuFrames = 30, onProgress } = {}) {
	const results = conditions.map((c) => ({ label: c.label, wall: [], gpu: [] }));
	const total = rounds * conditions.length;
	let step = 0;
	for (let round = 0; round < rounds; round++) {
		for (let i = 0; i < conditions.length; i++) {
			onProgress?.(step / total, conditions[i].label);
			await conditions[i].apply();
			await app.nextFrames(warmup);
			const gpu = await sampleGpu(app, gpuFrames);
			if (gpu !== null) results[i].gpu.push(gpu);
			results[i].wall.push(await burst(app, frames));
			step++;
		}
	}
	onProgress?.(1, 'done');
	return results.map((r) => ({ label: r.label, wall: median(r.wall), gpu: r.gpu.length ? median(r.gpu) : null }));
}

// -------------------------------------------------------------------------------------------------
// Result history (localStorage) so numbers from different renderer modes can be compared after a reload.

const HISTORY_KEY = 'sanctuary-lookdev-lab:bench:v1';

export function readHistory() {
	try {
		return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
	} catch {
		return [];
	}
}

export function pushHistory(entry) {
	const list = readHistory();
	list.push({ ...entry, date: new Date().toISOString() });
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-80)));
	} catch {
		/* storage full or blocked: keep the in-memory result only */
	}
	return list;
}

export function clearHistory(filter) {
	const keep = filter ? readHistory().filter((e) => !filter(e)) : [];
	try {
		localStorage.setItem(HISTORY_KEY, JSON.stringify(keep));
	} catch {
		/* ignore */
	}
}

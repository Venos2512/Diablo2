// Performance HUD: FPS, CPU frame time, GPU time (total + per pass when the backend exposes it),
// draw calls / triangles / resources, and a rolling frame-time graph.
const fmt = (v, d = 2) => (v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(d));
const big = (n) => (n === null || n === undefined ? '—' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n));

export class PerfHud {
	constructor(el) {
		this.el = el;
		this.samples = new Float32Array(160);
		this.gpuSamples = new Float32Array(160);
		this.cursor = 0;
		this.fps = 0;
		this.cpu = 0;
		this.frameMs = 16.7;
		this.acc = 0;
		this.frames = 0;
		this.lastText = 0;
		this.data = {};
		el.innerHTML = `
			<div class="hud-head"><span data-k="label"></span><span data-k="res"></span></div>
			<dl class="hud-grid">
				<dt>FPS</dt><dd data-k="fps"></dd><dt>CPU</dt><dd data-k="cpu"></dd>
				<dt>GPU</dt><dd data-k="gpu"></dd><dt>Draw</dt><dd data-k="calls"></dd>
				<dt>Tris</dt><dd data-k="tris"></dd><dt>Tex</dt><dd data-k="tex"></dd>
				<dt>Geo</dt><dd data-k="geo"></dd><dt data-k="progLabel">Prog</dt><dd data-k="prog"></dd>
				<dt>FX</dt><dd data-k="fx"></dd><dt>Heap</dt><dd data-k="heap"></dd>
			</dl>
			<canvas width="236" height="34"></canvas>
			<div class="hud-passes" data-k="passes"></div>`;
		this.fields = Object.fromEntries([...el.querySelectorAll('[data-k]')].map((n) => [n.dataset.k, n]));
		this.canvas = el.querySelector('canvas');
		this.ctx = this.canvas.getContext('2d');
	}

	set(field, text) {
		const node = this.fields[field];
		if (node && node.textContent !== text) node.textContent = text;
	}

	setLabel(label, resolution) {
		this.set('label', label);
		this.set('res', resolution);
	}

	/** Called once per frame. */
	frame(frameMs, cpuMs, gpu, info, extra = {}) {
		this.frameMs += (frameMs - this.frameMs) * 0.08;
		this.cpu += (cpuMs - this.cpu) * 0.08;
		this.samples[this.cursor] = frameMs;
		this.gpuSamples[this.cursor] = gpu.total ?? 0;
		this.cursor = (this.cursor + 1) % this.samples.length;
		this.acc += frameMs;
		this.frames++;
		const now = performance.now();
		if (now - this.lastText < 250) return;
		this.lastText = now;
		this.fps = (this.frames * 1000) / Math.max(this.acc, 1);
		this.acc = 0;
		this.frames = 0;
		this.data = { fps: this.fps, cpu: this.cpu, gpu: gpu.total, info, passes: gpu.passes, extra };

		this.set('fps', fmt(this.fps, 1));
		this.set('cpu', fmt(this.cpu) + ' ms');
		this.set('gpu', gpu.total === null ? 'n/a' : fmt(gpu.total) + ' ms');
		this.set('calls', big(info.calls));
		this.set('tris', big(info.triangles));
		this.set('tex', big(info.textures));
		this.set('geo', big(info.geometries));
		this.set('prog', info.programs === null ? '—' : big(info.programs));
		this.set('fx', extra.particles !== undefined ? big(extra.particles) : '0');
		const heap = performance.memory?.usedJSHeapSize;
		this.set('heap', heap ? (heap / 1048576).toFixed(0) + ' MB' : '—');
		this.renderPasses(gpu);
		this.drawGraph();
	}

	/** 'webgl' gets per-pass timer queries; the WebGPU renderer only reports a frame total. */
	setBackend(kind) {
		this.backendKind = kind;
	}

	renderPasses(gpu) {
		const node = this.fields.passes;
		if (!gpu.passes.length) {
			const text = gpu.total === null
				? 'GPU timer unavailable in this browser.'
				: this.backendKind === 'webgl'
					? 'Measuring GPU passes…'
					: 'Per-pass GPU timing needs the WebGL2 renderer; WebGPU reports the frame total.';
			if (node.dataset.note !== text) {
				node.dataset.note = text;
				node.innerHTML = `<div class="hud-note">${text}</div>`;
			}
			return;
		}
		node.dataset.note = '';
		const max = Math.max(0.5, ...gpu.passes.map((p) => p.ms));
		const rows = gpu.passes.map((p) => `<div class="hud-pass"><span>${p.label}</span><span class="hud-bar"><i style="width:${Math.min(100, (p.ms / max) * 100).toFixed(1)}%"></i></span><span>${p.ms.toFixed(2)}</span></div>`).join('');
		node.innerHTML = rows;
	}

	drawGraph() {
		const { ctx, canvas, samples, gpuSamples } = this;
		const w = canvas.width;
		const h = canvas.height;
		ctx.clearRect(0, 0, w, h);
		const scale = h / 33.4; // 0..33 ms (30 fps) fills the graph
		ctx.fillStyle = 'rgba(207,169,100,0.10)';
		ctx.fillRect(0, h - 16.7 * scale, w, 1);
		const n = samples.length;
		const step = w / n;
		const plot = (data, color) => {
			ctx.beginPath();
			for (let i = 0; i < n; i++) {
				const v = data[(this.cursor + i) % n];
				const y = h - Math.min(h, v * scale);
				if (i === 0) ctx.moveTo(0, y);
				else ctx.lineTo(i * step, y);
			}
			ctx.strokeStyle = color;
			ctx.lineWidth = 1;
			ctx.stroke();
		};
		plot(samples, 'rgba(231,226,212,0.75)');
		plot(gpuSamples, 'rgba(207,169,100,0.95)');
	}
}

// Per-pass GPU timing for WebGLRenderer via EXT_disjoint_timer_query_webgl2.
// Queries are sequential (WebGL forbids nesting) and resolved a few frames later.
export class WebGLGpuTimer {
	constructor(gl) {
		this.gl = gl;
		this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
		this.supported = !!this.ext;
		this.enabled = this.supported;
		this.pending = [];
		this.pool = [];
		this.frame = null;
		this.active = null;
		this.smoothed = new Map();
		this.total = 0;
		this.order = [];
		// Latest unsmoothed frame total + a counter, for benchmarks (the HUD uses the smoothed values).
		this.raw = 0;
		this.serial = 0;
	}

	beginFrame() {
		if (!this.enabled) return;
		this.frame = [];
	}

	begin(label) {
		if (!this.frame) return;
		if (this.active) this.end();
		const { gl, ext } = this;
		const query = this.pool.pop() || gl.createQuery();
		gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
		this.active = { label, query };
	}

	end() {
		if (!this.active) return;
		this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
		this.frame.push(this.active);
		this.active = null;
	}

	endFrame() {
		if (!this.frame) return;
		this.end();
		if (this.frame.length) this.pending.push(this.frame);
		this.frame = null;
		this.poll();
	}

	poll() {
		const { gl, ext } = this;
		const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
		while (this.pending.length) {
			const frame = this.pending[0];
			const last = frame[frame.length - 1].query;
			if (!gl.getQueryParameter(last, gl.QUERY_RESULT_AVAILABLE)) break;
			this.pending.shift();
			if (!disjoint) {
				const sums = new Map();
				let total = 0;
				for (const { label, query } of frame) {
					const ms = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
					sums.set(label, (sums.get(label) || 0) + ms);
					total += ms;
				}
				this.order = [...sums.keys()];
				for (const [label, ms] of sums) this.smoothed.set(label, this.ema(this.smoothed.get(label), ms));
				for (const label of this.smoothed.keys()) if (!sums.has(label)) this.smoothed.set(label, this.ema(this.smoothed.get(label), 0));
				this.total = this.ema(this.total, total);
				this.raw = total;
				this.serial++;
			}
			for (const { query } of frame) this.pool.push(query);
		}
		if (this.pending.length > 6) {
			for (const frame of this.pending.splice(0, this.pending.length - 6)) for (const { query } of frame) this.pool.push(query);
		}
	}

	ema(prev, value) {
		return prev === undefined || prev === 0 ? value : prev + (value - prev) * 0.1;
	}

	snapshot() {
		if (!this.supported) return { total: null, passes: [], raw: null, serial: 0 };
		return {
			total: this.total,
			passes: this.order.map((label) => ({ label, ms: this.smoothed.get(label) || 0 })),
			raw: this.raw,
			serial: this.serial,
		};
	}

	dispose() {
		for (const q of this.pool) this.gl.deleteQuery(q);
		this.pool.length = 0;
	}
}

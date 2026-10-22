// Runtime streamer of a map's modules (AD 12 §4.14): loads the kits in load-order priority with a concurrency limit, builds ring 0
// before the first frame, then builds one or more ready modules per frame inside a time budget so the frame never hitches.
//
// Renderer-free and scene-agnostic: everything that touches a renderer is injected —
//   order      [{ id, ring, distance }] from loadOrder()
//   kitsOf     (id) → kit keys the module needs
//   loadKit    (key) → Promise (a kit that rejects is counted as failed; its modules still build, the scene skips what is missing)
//   buildModule(id) → void (synchronous; builds the module's meshes)
//   now        () → ms (performance.now in the browser, a fake in tests)
//   reorder    (point) → order — optional, for reprioritise(): the load order of the map as seen from another focus point
//
// Usage: const stream = new MapStream({ ... }); await stream.start(); /* first frame */ then stream.step() once per frame;
// stream.done resolves when every module is built (or the stream was cancelled). pause() / resume() for a hidden scene, cancel() for good.
import { MODULE_RULES } from './mapModules.js';

export class MapStream {
	constructor({ order, kitsOf, loadKit, buildModule, now = () => performance.now(), rules = MODULE_RULES, holdBackground = false, reorder = null }) {
		this.order = order;
		this.kitsOf = kitsOf;
		this.loadKit = loadKit;
		this.buildModule = buildModule;
		this.now = now;
		this.reorder = reorder;
		this.frameBudgetMs = rules.frameBudgetMs;
		this.concurrency = rules.kitConcurrency;
		this.cancelled = false;
		this.paused = false;
		this.held = holdBackground; // background kits wait for release() (the scene: init finished, the first frame has the bandwidth)
		this.started = false;
		this.ring0Built = false;
		this.t0 = 0;
		this.modules = order.map((o) => ({ ...o, kits: [...kitsOf(o.id)], built: false, readyAt: null, builtAt: null, buildMs: null, kitWaitMs: null, lagMs: null }));
		// kit queue: a kit's priority is the position of the first module that needs it; ring 0's kits go before everything else
		this.kitState = new Map(); // key → { priority, ring0, status: 'queued' | 'loading' | 'loaded' | 'failed', ms }
		this.modules.forEach((m, index) => {
			for (const key of m.kits) {
				let k = this.kitState.get(key);
				if (!k) this.kitState.set(key, (k = { key, priority: index, ring0: false, status: 'queued', startedAt: null, ms: null }));
				if (m.ring === 0) k.ring0 = true;
			}
		});
		this.queue = [...this.kitState.values()].sort((a, b) => a.priority - b.priority);
		this.inflight = 0;
		this.maxInflight = 0;
		this.loadOrderLog = []; // kit keys in the order loadKit was called (tests, report)
		this.kitErrors = [];
		this.waiters = [];
		this.builtCount = 0;
		this.done = new Promise((resolve) => (this.finish = resolve));
		if (!this.modules.length) this.finish(this.stats());
	}

	/** Kits ring 0 needs (distinct, in priority order). */
	ring0Kits() {
		return this.queue.filter((k) => k.ring0).map((k) => k.key);
	}

	/** Starts the kit queue; resolves once ring 0's kits are in and its modules are built (the first frame can be drawn). */
	async start() {
		this.started = true;
		this.t0 = this.now();
		this.pump();
		const ring0 = this.modules.filter((m) => m.ring === 0);
		await Promise.all(this.ring0Kits().map((key) => this.whenKit(key)));
		if (this.cancelled) return this.stats();
		this.markReady();
		for (const m of ring0) this.build(m);
		this.ring0Built = true;
		this.pump(); // ring 0 is in: the rest of the kits may start
		this.checkDone();
		return this.stats();
	}

	/** Promise that settles when the kit is loaded or failed. */
	whenKit(key) {
		const k = this.kitState.get(key);
		if (k.status === 'loaded' || k.status === 'failed') return Promise.resolve();
		return new Promise((resolve) => (k.waiters ??= []).push(resolve));
	}

	/** Starts queued kits while slots are free; the background kits wait until ring 0's are all loaded (the first frame has the bandwidth). */
	pump() {
		if (this.cancelled || this.paused || !this.started) return;
		const ring0Pending = this.queue.some((k) => k.ring0 && k.status !== 'loaded' && k.status !== 'failed');
		for (const k of this.queue) {
			if (this.inflight >= this.concurrency) break;
			if (k.status !== 'queued') continue;
			if (!k.ring0 && (ring0Pending || this.held)) continue;
			this.begin(k);
		}
	}

	/**
	 * The player's focus moved (another view, a run across the map): the modules not built yet and the kits not started yet are sorted by
	 * their distance from `point` (via the injected `reorder`). Ring 0 (the first frame) keeps its place; built modules and loading kits
	 * are left alone. Returns true when the order changed.
	 */
	reprioritise(point) {
		if (this.cancelled || !this.reorder) return false;
		const order = this.reorder(point);
		const rank = new Map(order.map((o, k) => [o.id, k]));
		const before = this.modules.map((m) => m.id).join();
		for (const m of this.modules) m.focusDistance = order[rank.get(m.id)]?.distance ?? null;
		this.modules.sort((a, b) => (b.built ? 1 : 0) - (a.built ? 1 : 0) || (a.built ? 0 : (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)));
		this.kitState.forEach((k) => (k.priority = Infinity));
		this.modules.forEach((m, index) => {
			if (m.built) return;
			for (const key of m.kits) {
				const k = this.kitState.get(key);
				if (k.priority === Infinity) k.priority = index;
			}
		});
		this.queue.sort((a, b) => (b.ring0 ? 1 : 0) - (a.ring0 ? 1 : 0) || a.priority - b.priority);
		this.reprioritised = (this.reprioritised ?? 0) + 1;
		this.pump();
		return before !== this.modules.map((m) => m.id).join();
	}

	/** Lets the background kits start (they may already be waiting for ring 0 only). */
	release() {
		this.held = false;
		this.pump();
	}

	/** Scene hidden: no kit starts, nothing is built; resume() goes on where it stopped (in-flight kits finish and wait). */
	pause() {
		this.paused = true;
	}

	resume() {
		if (!this.paused) return;
		this.paused = false;
		this.markReady();
		this.pump();
	}

	begin(k) {
		k.status = 'loading';
		k.startedAt = this.now();
		this.inflight++;
		this.maxInflight = Math.max(this.maxInflight, this.inflight);
		this.loadOrderLog.push(k.key);
		let promise;
		try {
			promise = Promise.resolve(this.loadKit(k.key));
		} catch (error) {
			promise = Promise.reject(error);
		}
		promise.then(
			() => this.settle(k, 'loaded'),
			(error) => {
				this.kitErrors.push({ key: k.key, error: String(error?.message ?? error) });
				this.settle(k, 'failed');
			},
		);
	}

	settle(k, status) {
		k.status = status;
		k.ms = this.now() - k.startedAt;
		this.inflight--;
		for (const resolve of k.waiters ?? []) resolve();
		k.waiters = null;
		if (this.cancelled) return;
		this.markReady();
		this.pump();
	}

	/** Stamps the time every module whose kits are all in became ready (kit wait = since the stream started). */
	markReady() {
		const t = this.now() - this.t0;
		for (const m of this.modules) {
			if (m.readyAt !== null || m.built) continue;
			if (m.kits.every((key) => ['loaded', 'failed'].includes(this.kitState.get(key).status))) {
				m.readyAt = t;
				m.kitWaitMs = t;
			}
		}
	}

	build(m) {
		const t = this.now();
		this.buildModule(m.id);
		m.buildMs = this.now() - t;
		m.built = true;
		m.builtAt = this.now() - this.t0;
		m.readyAt ??= m.builtAt;
		m.kitWaitMs ??= m.readyAt;
		m.lagMs = m.builtAt - m.readyAt;
		this.builtCount++;
	}

	/**
	 * Once per frame: builds the next ready modules (load order; a module whose kits are not in yet is skipped, not waited for) until
	 * the frame budget (`budgetMs`, default the rules' frameBudgetMs) is used, but at least one when any is ready, so it always progresses.
	 * Returns how many were built.
	 */
	step(budgetMs = this.frameBudgetMs) {
		if (this.cancelled || this.paused || !this.ring0Built || this.builtCount === this.modules.length) return 0;
		const t0 = this.now();
		let n = 0;
		for (const m of this.modules) {
			if (m.built) continue;
			if (!m.kits.every((key) => ['loaded', 'failed'].includes(this.kitState.get(key).status))) continue;
			if (n > 0 && this.now() - t0 >= budgetMs) break;
			this.build(m);
			n++;
		}
		this.checkDone();
		return n;
	}

	checkDone() {
		if (this.builtCount === this.modules.length) this.finish(this.stats());
	}

	/** Scene deactivated / disposed: no more kits are started, results of the ones in flight are dropped, step() does nothing. */
	cancel() {
		if (this.cancelled) return;
		this.cancelled = true;
		for (const k of this.kitState.values()) {
			for (const resolve of k.waiters ?? []) resolve();
			k.waiters = null;
		}
		this.finish(this.stats());
	}

	/** Timings: per module { id, ring, kitWaitMs, buildMs, lagMs, builtAt }, kits { key: ms }, totals. */
	stats() {
		return {
			cancelled: this.cancelled,
			built: this.builtCount,
			total: this.modules.length,
			maxInflight: this.maxInflight,
			kitOrder: [...this.loadOrderLog],
			kitErrors: [...this.kitErrors],
			kitMs: Object.fromEntries([...this.kitState.values()].filter((k) => k.ms !== null).map((k) => [k.key, Math.round(k.ms)])),
			modules: this.modules.map((m) => ({ id: m.id, ring: m.ring, built: m.built, kitWaitMs: m.kitWaitMs, buildMs: m.buildMs, lagMs: m.lagMs, builtAt: m.builtAt })),
			buildMsTotal: this.modules.reduce((n, m) => n + (m.buildMs ?? 0), 0),
			lastBuiltAt: this.modules.reduce((n, m) => Math.max(n, m.builtAt ?? 0), 0),
		};
	}
}

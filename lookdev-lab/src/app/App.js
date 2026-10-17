// Application shell: renderer backend, world (scene + VFX scene + camera), subject model, view modes,
// panels, input, capture and the frame loop.
import * as THREE from 'three';
import { Settings, session, registerDefaults } from '../core/settings.js';
import { RENDERER_MODES, resolveMode, switchMode, createBackend, rememberMode } from '../core/backend.js';
import { AssetLoader, SAMPLES, sampleById, classifyTexture, isDirectXNormal } from '../core/assets.js';
import { CameraRig } from '../core/cameraRig.js';
import { hotUpdateShader } from '../core/shaderRegistry.js';
import { PerfHud } from '../ui/hud.js';
import { ErrorOverlay } from '../ui/errors.js';
import { toast } from '../ui/toast.js';
import { Subject } from './subject.js';
import { ViewModes, VIEWS, VIEW_LEGENDS } from '../lookdev/views.js';
import { SCENES } from '../scenes/index.js';
import { buildPanels } from '../panels/index.js';
import { QUALITY_PRESETS } from '../core/quality.js';
import { ShaderLab } from '../effects/lab.js';
import { VfxLab } from '../vfx/vfxLab.js';
import { importQuarks } from '../panels/vfx.js';
import { CharacterController } from '../character/controller.js';
import { MoodController } from '../lighting/moodController.js';
import { measureHeight } from '../character/rig.js';
import { StressTests } from './stress.js';
import { Recorder, Presentation } from './capture.js';
import * as bench from './bench.js';
import { parseCubeLUT, generateLook, storeCustomLut, loadCustomLut, disposeLut } from '../core/lut.js';
import { applyStoredOverrides, dropOverride } from '../core/shaderOverrides.js';
import { PROCEDURAL, isProcedural, proceduralById, createProcedural, defaultOptions } from '../procedural/catalog.js';
import { useNodeMaterial } from '../procedural/nodeMaterial.js';

/** Grade values that belong to a scene's look (saved and restored per scene with exposure and fog). */
const SCENE_GRADE_KEYS = ['vignette', 'contrast', 'saturation', 'lift', 'temperature', 'tint'];
const SCENE_GRADE_DEFAULTS = { vignette: 0.22, contrast: 1, saturation: 1, lift: 0, temperature: 0, tint: 0 };

registerDefaults('subject', { sample: 'shader-ball', turntable: false, turntableSpeed: 20, speed: 1 });
registerDefaults('view', { mode: 'lit', renderScale: 1 });
registerDefaults('procedural', defaultOptions());

const $ = (id) => document.getElementById(id);

export class App {
	constructor() {
		this.dom = {
			app: $('app'),
			viewport: $('viewport'),
			panel: $('panel'),
			tabs: $('tabs'),
			hud: $('hud'),
			badges: $('badges'),
			legend: $('legend'),
			boot: $('boot'),
			bootStatus: $('boot-status'),
			sceneSelect: $('scene-select'),
			rendererSelect: $('renderer-select'),
			sampleList: $('sample-list'),
			objectList: $('object-list'),
			compare: $('compare'),
			compareImage: $('compare-image'),
			compareHandle: $('compare-handle'),
			dropOverlay: $('drop-overlay'),
			errorOverlay: $('error-overlay'),
			castbar: $('castbar'),
			help: $('help'),
		};
		this.settings = new Settings();
		this.mode = resolveMode();
		this.modeInfo = RENDERER_MODES[this.mode];
		this.world = { scene: null, vfxScene: new THREE.Scene(), camera: null, sun: null };
		this.world.vfxScene.name = 'VFX layer';
		this.subject = new Subject();
		this.views = new ViewModes();
		this.timer = new THREE.Timer();
		this.timer.connect?.(document);
		this.selected = null;
		this.selectionHelper = null;
		this.sceneCache = new Map();
		this.current = null;
		this.listeners = { update: new Set(), scene: new Set(), subject: new Set(), select: new Set(), click: new Set(), key: new Set(), lut: new Set() };
		this.captureRequests = [];
		this.lastFrameTime = 0;
		this.particleCount = 0;
		this.errors = new ErrorOverlay(this.dom.errorOverlay);
		this.compare = { image: null, label: '', split: 50, visible: false };
		window.__LAB__ = {
			app: this,
			saveSession: () => this.saveSession(),
			hotShader: (path, code) => {
				dropOverride(path);
				if (hotUpdateShader(path, code)) {
					this.errors.remove('shader');
					toast(`Shader updated · ${path.split('/').pop()}`, 'ok', 1600);
				}
			},
			buildError: (text) => (text ? this.errors.text('build', 'Build error (fix and save to reload)', text) : this.errors.remove('build')),
			/** Console access to the A/B timing helpers (abTest, burst, sampleGpu, readHistory). */
			bench,
			/** Test hook: render `n` frames now and return the last one as a PNG data URL. */
			renderFrames: (n = 1) => {
				for (let i = 0; i < n; i++) this.frame(performance.now());
				return this.backend.capture().toDataURL('image/png');
			},
		};
	}

	/** Stop / restart the render loop (benchmarks render bursts of frames themselves). */
	pauseLoop() {
		this.loopRunning = false;
		this.backend.renderer.setAnimationLoop(null);
	}

	resumeLoop() {
		if (this.loopStopped || !this.loop) return;
		this.loopRunning = true;
		this.backend.renderer.setAnimationLoop(this.loop);
	}

	/** Resolves after `n` more rendered frames (renders them directly when the loop is not running). */
	async nextFrames(n = 1, onFrame) {
		if (!this.loopRunning) {
			for (let i = 0; i < n; i++) {
				this.frame(performance.now());
				onFrame?.();
				if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0));
			}
			return;
		}
		await new Promise((resolve) => {
			let left = n;
			const off = this.on('update', () => {
				// 'update' fires before rendering; report after the frame was drawn.
				queueMicrotask(() => {
					onFrame?.();
					if (--left <= 0) {
						off();
						resolve();
					}
				});
			});
		});
	}

	on(event, fn) {
		this.listeners[event].add(fn);
		return () => this.listeners[event].delete(fn);
	}

	emit(event, ...args) {
		for (const fn of this.listeners[event]) fn(...args);
	}

	status(text) {
		this.dom.bootStatus.textContent = text;
	}

	async start() {
		this.setupChrome();
		this.status(`Creating ${this.modeInfo.label} renderer…`);
		try {
			this.backend = await createBackend(this.mode, {
				container: this.dom.viewport,
				onShaderError: (error) => this.errors.shader(error),
			});
		} catch (error) {
			console.error(error);
			this.dom.boot.classList.add('error');
			this.status(`Could not start ${this.modeInfo.label}.\n${error.message}\n\nUse the Renderer menu above to pick another mode.`);
			return;
		}
		rememberMode(this.mode);
		const edited = applyStoredOverrides();
		if (edited.length) toast(`Using your in-browser edits of ${edited.map((p) => p.split('/').pop()).join(', ')} (Shaders tab → Revert to restore the file).`, 'info', 6000);
		if (this.mode === 'webgpu' && !this.backend.isWebGPU) toast('WebGPU is not available in this browser — WebGPURenderer fell back to its WebGL2 backend.', 'error', 7000);

		this.loader = new AssetLoader();
		this.loader.bindRenderer(this.backend.renderer);
		this.rig = new CameraRig(this.backend.canvas);
		this.world.camera = this.rig.camera;
		this.hud = new PerfHud(this.dom.hud);
		this.hud.setBackend(this.backend.kind);
		this.applyQuality(false);
		this.observeResize();
		this.setupInput();

		const s = this.settings.data;
		this.status('Building scene…');
		await this.setScene(SCENES[s.scene] ? s.scene : 'studio', { keepCamera: false });
		this.status('Loading sample model…');
		await this.loadSample(s.subject.sample || 'shader-ball', { frame: false }).catch((e) => console.warn(e));

		this.shaderLab = new ShaderLab(this);
		this.shaderLab.init();
		this.vfxLab = new VfxLab(this);
		this.character = new CharacterController(this);
		this.mood = new MoodController(this);
		this.stress = new StressTests(this);
		this.recorder = new Recorder(this);
		this.presentation = new Presentation(this);
		this.panels = buildPanels(this);
		if (this.vfxLab.settings.armed && !this.vfxLab.armed) this.vfxLab.arm(true);
		this.restoreSession();
		this.applyLut();
		await this.mood.init().catch((e) => console.warn('Mood:', e));
		this.setView(s.view.mode, false);
		this.updateBadges();
		// ?frames=N stops the loop after N frames (used by headless screenshot checks).
		const frameLimit = Number(new URLSearchParams(location.search).get('frames')) || Infinity;
		let rendered = 0;
		this.loop = (t) => {
			this.frame(t);
			if (++rendered >= frameLimit) {
				this.pauseLoop();
				this.loopStopped = true;
				window.__LAB_LAST_FRAME__ = this.backend.capture().toDataURL('image/png');
				document.title = `rendered ${rendered}`;
			}
		};
		this.resumeLoop();
		this.dom.boot.hidden = true;
		addEventListener('beforeunload', () => this.saveSession());
	}

	// -------------------------------------------------------------------------------------------
	// Chrome: tabs, selects, buttons

	setupChrome() {
		const { sceneSelect, rendererSelect } = this.dom;
		for (const [id, def] of Object.entries(SCENES)) sceneSelect.add(new Option(def.label, id));
		sceneSelect.value = SCENES[this.settings.data.scene] ? this.settings.data.scene : 'studio';
		sceneSelect.addEventListener('change', () => this.setScene(sceneSelect.value));
		for (const def of Object.values(RENDERER_MODES)) rendererSelect.add(new Option(def.label, def.id));
		rendererSelect.value = this.mode;
		rendererSelect.addEventListener('change', () => switchMode(rendererSelect.value, () => this.saveSession()));

		$('btn-screenshot').addEventListener('click', () => this.screenshot());
		$('btn-compare').addEventListener('click', () => this.toggleCompare());
		$('btn-ui').addEventListener('click', () => this.toggleUI());
		$('btn-help').addEventListener('click', () => this.showHelp());
		$('btn-open-file').addEventListener('click', () => $('file-input').click());
		$('file-input').addEventListener('change', (e) => {
			this.handleFiles(e.target.files);
			e.target.value = '';
		});

		const list = this.dom.sampleList;
		const groups = { lookdev: 'Lookdev', validation: 'Validation', prop: 'Props', character: 'Animated', hdri: 'HDRI (studio env)' };
		for (const [role, title] of Object.entries(groups)) {
			const items = SAMPLES.filter((a) => (a.kind === 'hdri' ? 'hdri' : a.role) === role);
			if (!items.length) continue;
			const head = document.createElement('div');
			head.className = 'sample-group';
			head.textContent = title;
			list.appendChild(head);
			for (const asset of items) {
				const button = document.createElement('button');
				button.className = 'sample-item';
				button.dataset.id = asset.id;
				button.innerHTML = `<span>${asset.name}</span><span class="kind">${asset.license.split(' ')[0]}</span>`;
				button.title = `${asset.credit}\n${asset.license}`;
				button.addEventListener('click', () => (asset.kind === 'hdri' ? this.useStudioEnv(asset.id) : this.loadSample(asset.id)));
				list.appendChild(button);
			}
		}
		// Characters built in code (src/procedural): heroes, monsters, NPCs. Options live in the Procedural tab.
		const groupTitles = { hero: 'Procedural · heroes', monster: 'Procedural · monsters', npc: 'Procedural · NPCs' };
		for (const [group, title] of Object.entries(groupTitles)) {
			const head = document.createElement('div');
			head.className = 'sample-group';
			head.textContent = title;
			list.appendChild(head);
			for (const entry of PROCEDURAL.filter((e) => e.group === group)) {
				const button = document.createElement('button');
				button.className = 'sample-item';
				button.dataset.id = entry.id;
				button.innerHTML = `<span>${entry.name}</span><span class="kind">code</span>`;
				button.title = 'Procedural character (src/procedural) — options in the Procedural tab';
				button.addEventListener('click', () => this.loadSample(entry.id));
				list.appendChild(button);
			}
		}
		this.setupCompareHandle();
	}

	updateRail() {
		for (const b of this.dom.sampleList.querySelectorAll('.sample-item')) {
			const id = b.dataset.id;
			const active = id === this.subject.sourceId || (this.current?.id === 'studio' && this.current.settings.env === id);
			b.classList.toggle('active', active);
		}
		const list = this.dom.objectList;
		list.innerHTML = '';
		if (!this.subject.model) {
			list.innerHTML = '<p class="muted">Nothing yet.</p>';
			return;
		}
		const stats = this.subject.stats();
		const item = document.createElement('button');
		item.className = 'object-item active';
		item.innerHTML = `<span>${this.subject.name}</span><span class="kind">${(stats.triangles / 1000).toFixed(1)}k tris</span>`;
		item.addEventListener('click', () => this.frameSubject());
		list.appendChild(item);
	}

	updateBadges() {
		const b = [];
		const backend = this.backend;
		const label = this.mode === 'webgpu' && backend && !backend.isWebGPU ? 'WebGPU → fell back to WebGL2' : this.modeInfo.label;
		b.push(`<span class="badge ${this.mode === 'webgpu' && backend && !backend.isWebGPU ? 'warn' : ''}"><b>${label}</b></span>`);
		if (this.current) b.push(`<span class="badge">${this.current.label}</span>`);
		const view = this.settings.data.view.mode;
		if (view !== 'lit') b.push(`<span class="badge">View · <b>${VIEWS[view].label}</b></span>`);
		if (this.settings.data.post.falseColor) b.push('<span class="badge">False colour</span>');
		if (this.settings.data.post.retro.enabled) b.push(`<span class="badge">Retro ${this.settings.data.post.retro.height}p</span>`);
		this.dom.badges.innerHTML = b.join('');
		this.updateLegend();
	}

	updateLegend() {
		const s = this.settings.data;
		const key = s.view.mode === 'validate' ? 'validate' : s.post.falseColor && s.view.mode === 'lit' ? 'falsecolor' : null;
		const legend = this.dom.legend;
		if (!key) {
			legend.hidden = true;
			return;
		}
		legend.hidden = false;
		legend.innerHTML = VIEW_LEGENDS[key].map(([c, t]) => `<div class="legend-row"><span class="legend-swatch" style="background:${c}"></span>${t}</div>`).join('');
	}

	toggleUI(force) {
		const hidden = force ?? !this.dom.app.classList.contains('ui-hidden');
		this.dom.app.classList.toggle('ui-hidden', hidden);
		$('btn-ui').classList.toggle('active', hidden);
	}

	showHelp() {
		const dlg = this.dom.help;
		if (!dlg.dataset.built) {
			dlg.dataset.built = '1';
			const credits = SAMPLES.map((a) => `<tr><td>${a.name}</td><td>${a.license}</td><td>${a.credit} · <a href="${a.source}" target="_blank" rel="noopener">source</a></td></tr>`).join('');
			dlg.innerHTML = `<button class="button close" data-close>Close</button><div class="help-body">
				<h2>Sanctuary Lookdev Lab</h2>
				<p class="muted">Three.js r180 test bed for shaders, lighting, VFX, model lookdev and Act I environments — the same scene rendered by WebGL2/GLSL or WebGPU/TSL.</p>
				<h3>Shortcuts</h3>
				<table>
					<tr><td><kbd>H</kbd></td><td>Hide / show interface</td><td><kbd>F</kbd></td><td>Frame model or selection</td></tr>
					<tr><td><kbd>V</kbd></td><td>Next view mode</td><td><kbd>X</kbd></td><td>Exposure false colour</td></tr>
					<tr><td><kbd>T</kbd></td><td>Turntable</td><td><kbd>P</kbd></td><td>Screenshot (PNG)</td></tr>
					<tr><td><kbd>C</kbd></td><td>A/B compare (first press captures A)</td><td><kbd>Esc</kbd></td><td>Clear selection</td></tr>
					<tr><td><kbd>1</kbd>–<kbd>9</kbd></td><td>Cast a spell (VFX lab active)</td><td><kbd>Click</kbd></td><td>Select mesh → material inspector</td></tr>
					<tr><td><kbd>Right click</kbd></td><td>Cast the selected spell at the cursor</td><td><kbd>Click</kbd> (play mode)</td><td>Walk there / attack a dummy</td></tr>
					<tr><td><kbd>Enter</kbd></td><td>Character tab: play on / off</td><td><kbd>W A S D</kbd></td><td>Move (camera-relative), <kbd>Shift</kbd> walk, <kbd>R</kbd> walk ↔ run</td></tr>
					<tr><td><kbd>Space</kbd> <kbd>E</kbd> <kbd>Q</kbd></td><td>Attack, attack 2, cast</td><td><kbd>B</kbd> <kbd>G</kbd> <kbd>K</kbd></td><td>Block (hold), get hit, death / revive</td></tr>
				</table>
				<h3>Workflow</h3>
				<p class="muted">Shaders tab: every effect is written in GLSL and TSL with the same parameters — enable it, open the source viewer (GLSL, glue, TSL, compiled WGSL/GLSL), measure off vs on, then switch the renderer and measure again. Performance tab keeps the results of both renderers side by side.</p>
				<h3>Renderer modes</h3>
				<table>${Object.values(RENDERER_MODES).map((m) => `<tr><td><b>${m.label}</b></td><td>${m.detail}</td></tr>`).join('')}</table>
				<h3>Sample asset credits</h3>
				<table>${credits}</table>
				<p class="muted">Three.js is MIT licensed. Procedural Act I environments, shaders and VFX are original to this project.</p>
			</div>`;
			dlg.addEventListener('click', (e) => {
				if (e.target.matches('[data-close]') || e.target === dlg) dlg.close();
			});
		}
		dlg.showModal();
	}

	// -------------------------------------------------------------------------------------------
	// Scenes and subject

	async setScene(id, { keepCamera = true } = {}) {
		if (!SCENES[id]) id = 'studio';
		this.settings.data.scene = id;
		this.settings.changed('scene');
		this.dom.sceneSelect.value = id;
		const token = (this._sceneToken = (this._sceneToken || 0) + 1);
		let entry = this.sceneCache.get(id);
		if (!entry) {
			entry = SCENES[id].create(this);
			this.sceneCache.set(id, entry);
			await entry.init();
			this.backend.prepareObject(entry.scene);
		}
		if (token !== this._sceneToken) return; // another scene was picked while this one loaded
		if (this.current && this.current !== entry) {
			this.saveScenePost(this.current);
			this.current.deactivate?.();
		}
		this.current = entry;
		entry.activate?.();
		this.world.scene = entry.scene;
		this.world.sun = entry.sun || null;
		entry.anchor.add(this.subject.root);
		this.views.refresh([entry.scene]);
		this.applyBackgroundOverride();
		this.clearSelection();
		if (!keepCamera || !this._sceneVisited?.has(id)) this.goHome();
		(this._sceneVisited ??= new Set()).add(id);
		this.applyScenePost(entry);
		this.updateBadges();
		this.updateRail();
		this.emit('scene', entry);
		await this.holdUntilCompiled(token);
	}

	/**
	 * Keep the previous frame on screen until the current scene's shaders are linked. Program keys include the
	 * light setup, which the mood finishes asynchronously; a program first needed inside a frame is compiled
	 * synchronously (seconds per PBR program on D3D11 with many lights), freezing the tab.
	 */
	async holdUntilCompiled(token) {
		const hold = (async () => {
			let timer = 0;
			await Promise.race([this.mood?.pending, new Promise((resolve) => (timer = setTimeout(resolve, 8000)))]).catch(() => {});
			clearTimeout(timer);
			if (token !== this._sceneToken) return;
			const scenes = [this.world.scene, this.world.vfxScene].filter(Boolean);
			await Promise.all(scenes.map((s) => this.backend.compile(s, this.rig.camera))).catch((error) => console.warn('Shader precompile failed', error));
		})();
		this.renderHold = hold;
		await hold;
		if (this.renderHold === hold) this.renderHold = null;
	}

	/** Exposure, fog and the scene grade (SCENE_GRADE_KEYS) are per scene: remembered when leaving, restored (or defaulted) when entering. */
	saveScenePost(entry) {
		if (this.mood?.active) return; // the mood owns exposure and fog while it is set
		const s = this.settings.data;
		s.scenePost ??= {};
		const grade = Object.fromEntries(SCENE_GRADE_KEYS.map((k) => [k, s.post.grade[k]]));
		s.scenePost[entry.id] = { exposure: s.post.exposure, fog: { ...s.post.fog }, grade };
		this.settings.changed('scenePost');
	}

	applyScenePost(entry, useDefaults = false) {
		const s = this.settings.data;
		const saved = useDefaults ? null : s.scenePost?.[entry.id];
		const source = saved || entry.postDefaults || { exposure: 0, fog: { enabled: false } };
		s.post.exposure = source.exposure ?? 0;
		Object.assign(s.post.fog, source.fog || {});
		// The framing part of the grade (vignette, contrast, lift ...) is per scene too — unless a mood owns the grade.
		if (!this.mood?.active) {
			for (const k of SCENE_GRADE_KEYS) s.post.grade[k] = source.grade?.[k] ?? entry.postDefaults?.grade?.[k] ?? SCENE_GRADE_DEFAULTS[k];
		}
		this.settings.changed('post');
		this.applyPost();
		this.panels?.refresh();
		this.updateBadges();
	}

	goHome() {
		const home = this.current?.home;
		if (!home) return;
		if (this.rig.mode !== 'orbit') this.rig.setMode('orbit');
		this.rig.lookAt(home.position, home.target);
	}

	async loadSample(id, { frame = true } = {}) {
		if (isProcedural(id)) return this.loadProcedural(id, { frame });
		const entry = sampleById(id);
		if (!entry || entry.kind !== 'model') return;
		const gltf = await this.loader.loadSample(id);
		// Characters that share a rig keep their clips in one animation library (see samples.json).
		let animations = gltf.animations;
		if (entry.animations) {
			const library = await this.loader.loadLibrary(entry.animations);
			animations = [...animations, ...library.animations];
		}
		// Characters get a real-world height (the raw files are 0.75 – 4.5 units tall), measured on the
		// body only (weapons held above the head do not count).
		if (entry.height) {
			const h = measureHeight(gltf.scene);
			if (h > 0) gltf.scene.scale.multiplyScalar(entry.height / h);
		}
		this.setSubject(gltf.scene, animations, entry.name, id);
		this.settings.data.subject.sample = id;
		this.settings.changed('subject');
		if (frame) this.frameSubject();
	}

	/** Builds a procedural character with the Procedural tab's options (settings.data.procedural). */
	async loadProcedural(id, { frame = true } = {}) {
		if (!proceduralById(id)) return;
		const started = performance.now();
		const { entry, model } = await createProcedural(id, this.settings.data.procedural);
		// Its shader is an onBeforeCompile patch (GLSL); node materials need the TSL port.
		if (this.backend.kind !== 'webgl') useNodeMaterial(model);
		this.setSubject(model, [], entry.name, id, { procedural: true });
		this.settings.data.subject.sample = id;
		this.settings.changed('subject');
		if (frame) this.frameSubject();
		const ms = performance.now() - started;
		if (ms > 1500) toast(`${entry.name}: sculpted live in ${(ms / 1000).toFixed(1)} s (this variant is not in the baked data)`, 'info', 4000);
	}

	setSubject(object, animations, name, sourceId = null, { procedural = false } = {}) {
		if (procedural) this.subject.setProcedural(object, name, sourceId);
		else this.subject.set(object, animations, name, sourceId);
		this.subject.turntable = this.settings.data.subject.turntable;
		this.subject.turntableSpeed = this.settings.data.subject.turntableSpeed;
		this.subject.speed = this.settings.data.subject.speed;
		this.backend.prepareObject(this.subject.root);
		this.views.refresh([this.world.scene]);
		this.clearSelection();
		this.updateRail();
		this.emit('subject', this.subject);
	}

	frameSubject() {
		const target = this.selected || this.subject.model;
		if (!target) return;
		this.rig.frame(new THREE.Box3().setFromObject(target));
	}

	async useStudioEnv(id) {
		if (this.current?.id !== 'studio') await this.setScene('studio');
		this.current.settings.env = id;
		this.settings.changed('studio');
		await this.current.applyEnvironment();
		this.updateRail();
		this.emit('scene', this.current);
	}

	// -------------------------------------------------------------------------------------------
	// Rendering settings

	applyPost() {
		if (!this.backend) return;
		this.backend.configure(this.settings.data.post);
	}

	/** Display-space LUT from settings.post.lut.look ('none', a generated look id or 'custom'). */
	applyLut() {
		const lutSettings = this.settings.data.post.lut;
		let lut = null;
		if (lutSettings.look === 'custom') {
			lut = this.customLut ??= loadCustomLut();
			if (!lut) lutSettings.look = 'none';
		} else if (lutSettings.look !== 'none') {
			this.lutCache ??= {};
			lut = this.lutCache[lutSettings.look] ??= generateLook(lutSettings.look);
		}
		this.backend.setLut(lut);
		this.applyPost();
	}

	applyQuality(apply = true) {
		const q = QUALITY_PRESETS[this.settings.data.quality] || QUALITY_PRESETS.high;
		this.quality = q;
		if (apply) this.resize();
	}

	pixelRatio() {
		const base = Math.min(devicePixelRatio || 1, this.quality.maxPixelRatio);
		return base * this.settings.data.view.renderScale;
	}

	observeResize() {
		this.resizeObserver = new ResizeObserver(() => this.resize());
		this.resizeObserver.observe(this.dom.viewport);
		this.resize();
	}

	resize() {
		if (!this.backend) return;
		const rect = this.dom.viewport.getBoundingClientRect();
		const w = Math.max(1, Math.floor(rect.width));
		const h = Math.max(1, Math.floor(rect.height));
		const pr = this.pixelRatio();
		this.backend.setSize(w, h, pr);
		this.rig.setAspect(w / h);
		this.size = { w, h, pr };
		this.hud?.setLabel(this.modeInfo.short + ' · ' + this.backend.language, `${Math.round(w * pr)}×${Math.round(h * pr)}`);
	}

	setView(mode, persist = true) {
		if (!VIEWS[mode]) mode = 'lit';
		const def = VIEWS[mode];
		this.settings.data.view.mode = mode;
		if (persist) this.settings.changed('view');
		this.backend.setDebugChannel(def.channel || 0);
		this.views.apply(mode, [this.world.scene]);
		this.backend.prepareObject(this.world.scene);
		this.applyBackgroundOverride();
		if (def.webglOnly && this.backend.kind !== 'webgl') toast(`${def.label}: only available in WebGL2 mode (TSL MRT has no per-material AO slot). Showing white.`, 'error', 5000);
		this.updateBadges();
	}

	/** Channel views read better over a flat dark background than over the environment. */
	applyBackgroundOverride() {
		const channel = VIEWS[this.settings.data.view.mode]?.channel || 0;
		const want = channel > 0 && channel !== 8 ? this.world.scene : null;
		const saved = this._bgSaved;
		if (saved && saved.scene !== want) {
			if (saved.scene.background === saved.override) saved.scene.background = saved.background;
			this._bgSaved = null;
		}
		if (want && !this._bgSaved) {
			const override = new THREE.Color(0x0b0b0b);
			this._bgSaved = { scene: want, background: want.background, override };
			want.background = override;
		}
	}

	// -------------------------------------------------------------------------------------------
	// Frame loop

	frame(timestamp) {
		const t0 = performance.now();
		this.timer.update(timestamp);
		const delta = Math.min(this.timer.getDelta(), 0.1);
		const elapsed = this.timer.getElapsed();
		const frameMs = this.lastFrameTime ? timestamp - this.lastFrameTime : 16.7;
		this.lastFrameTime = timestamp;
		if (this.renderHold) return; // shaders still linking: the canvas keeps the last frame

		this.backend.resetInfo();
		this.rig.update(delta);
		this.world.camera = this.rig.camera;
		this.subject.update(delta);
		this.current.update(delta, elapsed);
		this.emit('update', delta, elapsed);
		if (this.selectionHelper) this.selectionHelper.update();

		try {
			this.backend.render(this.world, delta, elapsed);
		} catch (error) {
			console.error(error);
			this.errors.text('render', 'Render error', String(error?.stack || error));
		}

		if (this.captureRequests.length) {
			const canvas = this.backend.capture();
			for (const { resolve, type, quality } of this.captureRequests.splice(0)) resolve(canvas.toDataURL(type, quality));
		}

		const cpu = performance.now() - t0;
		this.hud.frame(frameMs, cpu, this.backend.timings(), this.backend.info(), { particles: this.particleCount + (this.mood?.particleCount || 0) });
	}

	/** Resolves with a data URL of the next rendered frame. */
	captureFrame(type = 'image/png', quality) {
		return new Promise((resolve) => this.captureRequests.push({ resolve, type, quality }));
	}

	async screenshot() {
		const url = await this.captureFrame('image/png');
		const a = document.createElement('a');
		const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
		a.href = url;
		a.download = `lookdev-${this.current.id}-${this.mode}-${stamp}.png`;
		a.click();
		toast('Screenshot saved', 'ok', 1800);
	}

	// -------------------------------------------------------------------------------------------
	// A/B compare (snapshot A survives a renderer switch through sessionStorage)

	setupCompareHandle() {
		const handle = this.dom.compareHandle;
		let dragging = false;
		const move = (e) => {
			if (!dragging) return;
			const rect = this.dom.viewport.getBoundingClientRect();
			this.compare.split = THREE.MathUtils.clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
			this.dom.compare.style.setProperty('--split', this.compare.split + '%');
		};
		handle.addEventListener('pointerdown', (e) => {
			dragging = true;
			handle.setPointerCapture(e.pointerId);
		});
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', () => (dragging = false));
	}

	async captureA() {
		const url = await this.captureFrame('image/jpeg', 0.92);
		this.compare.image = url;
		this.compare.label = `${this.modeInfo.short} · ${VIEWS[this.settings.data.view.mode].label}`;
		this.dom.compareImage.src = url;
		this.dom.compareHandle.firstElementChild.textContent = 'A · ' + this.modeInfo.short;
		this.showCompare(true);
		toast('Snapshot A captured — change settings or switch renderer, then drag the divider.', 'ok', 4200);
	}

	showCompare(visible) {
		this.compare.visible = visible && !!this.compare.image;
		this.dom.compare.hidden = !this.compare.visible;
		this.dom.compare.style.setProperty('--split', this.compare.split + '%');
		this.dom.compareHandle.lastElementChild.textContent = 'B · ' + this.modeInfo.short;
		$('btn-compare').classList.toggle('active', this.compare.visible);
	}

	toggleCompare() {
		if (!this.compare.image) this.captureA();
		else this.showCompare(!this.compare.visible);
	}

	clearCompare() {
		this.compare.image = null;
		this.showCompare(false);
	}

	// -------------------------------------------------------------------------------------------
	// Input: picking, drag & drop, shortcuts

	setupInput() {
		const canvas = this.backend.canvas;
		let down = null;
		canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY, button: e.button }));
		canvas.addEventListener('pointerup', (e) => {
			if (!down || down.button !== 0) return;
			const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
			down = null;
			if (moved > 5) return;
			// Play mode / VFX targeting may consume the click before mesh picking.
			this.consumedClick = false;
			this.emit('click', e);
			if (this.consumedClick) return;
			this.pick(e);
		});

		const vp = this.dom.viewport;
		let depth = 0;
		vp.addEventListener('dragenter', (e) => {
			e.preventDefault();
			depth++;
			this.dom.dropOverlay.hidden = false;
		});
		vp.addEventListener('dragover', (e) => e.preventDefault());
		vp.addEventListener('dragleave', () => {
			depth = Math.max(0, depth - 1);
			if (!depth) this.dom.dropOverlay.hidden = true;
		});
		vp.addEventListener('drop', (e) => {
			e.preventDefault();
			depth = 0;
			this.dom.dropOverlay.hidden = true;
			if (e.dataTransfer?.files?.length) this.handleFiles(e.dataTransfer.files);
		});

		addEventListener('keydown', (e) => {
			if (e.target.closest?.('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
			const k = e.key.toLowerCase();
			if (k === 'h') this.toggleUI();
			else if (k === 'f') this.frameSubject();
			else if (k === 'p') this.screenshot();
			else if (k === 'c') this.toggleCompare();
			else if (k === 't') this.panels?.lookdev.toggleTurntable();
			else if (k === 'x') this.panels?.post.toggleFalseColor();
			else if (k === 'v') {
				const keys = Object.keys(VIEWS);
				this.setView(keys[(keys.indexOf(this.settings.data.view.mode) + 1) % keys.length]);
				this.panels?.refresh();
			} else if (k === 'escape') this.clearSelection();
			else if (k === '?') this.showHelp();
			else this.emit('key', k, e);
		});
	}

	ndc(event) {
		const rect = this.backend.canvas.getBoundingClientRect();
		return new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
	}

	raycast(event, objects = [this.world.scene]) {
		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(this.ndc(event), this.world.camera);
		const hits = raycaster.intersectObjects(objects, true);
		return hits.filter((h) => h.object.visible && !h.object.userData.labNoPick && !h.object.isLine && !h.object.isPoints && !h.object.isSprite);
	}

	pick(event) {
		const hit = this.raycast(event)[0];
		if (!hit) return this.clearSelection();
		this.select(hit.object);
	}

	select(object) {
		this.clearSelection(false);
		this.selected = object;
		const helper = new THREE.BoxHelper(object, 0xe6c88c);
		helper.userData.labNoPick = true;
		helper.userData.labNoView = true;
		helper.material.depthTest = false;
		helper.renderOrder = 999;
		this.selectionHelper = helper;
		this.world.scene.add(helper);
		this.emit('select', object);
	}

	clearSelection(notify = true) {
		if (this.selectionHelper) {
			this.selectionHelper.removeFromParent();
			this.selectionHelper.geometry.dispose();
			this.selectionHelper.material.dispose();
		}
		this.selectionHelper = null;
		this.selected = null;
		if (notify) this.emit('select', null);
	}

	async handleFiles(fileList) {
		const files = [...fileList];
		if (!files.length) return;
		toast(`Loading ${files.length} file${files.length > 1 ? 's' : ''}…`, 'info', 1500);
		const results = await this.loader.loadFiles(files);
		for (const r of results) {
			if (r.kind === 'model') {
				this.setSubject(r.scene, r.animations, r.name, null);
				this.subject.flipY = /\.(fbx|obj)$/i.test(r.name);
				this.frameSubject();
				toast(`Loaded ${r.name}${r.animations.length ? ` · ${r.animations.length} clips` : ''}`, 'ok');
			} else if (r.kind === 'hdri') {
				if (this.current.id !== 'studio') await this.setScene('studio');
				await this.current.setCustomEnvironment(r.texture);
				this.emit('scene', this.current);
				toast(`Environment: ${r.name}`, 'ok');
			} else if (r.kind === 'textures') {
				this.applyTextureSet(r.textures);
			} else if (r.kind === 'preset' && /"ParticleEmitter"/.test(r.text)) {
				// three.quarks editor export (three.js Object JSON with ParticleEmitter nodes).
				importQuarks(this, r.text, r.name);
			} else if (r.kind === 'preset') {
				try {
					this.settings.import(r.text);
					toast('Preset imported — reloading', 'ok');
					setTimeout(() => location.reload(), 600);
				} catch (e) {
					toast(e.message, 'error');
				}
			} else if (r.kind === 'lut') {
				try {
					const lut = parseCubeLUT(r.text, r.name);
					disposeLut(this.customLut);
					this.customLut = lut;
					const kept = storeCustomLut(r.name, r.text);
					this.settings.data.post.lut.look = 'custom';
					this.settings.changed('post');
					this.applyLut();
					this.panels?.refresh();
					toast(`LUT “${this.customLut.title}” (${this.customLut.size}³)${kept ? '' : ' — too large to remember after a reload'}`, 'ok', 3500);
				} catch (e) {
					toast(`${r.name}: ${e.message}`, 'error', 6000);
				}
				this.emit('lut', r);
			} else if (r.kind === 'error') {
				console.error(r.error);
				toast(`${r.name}: ${r.error.message}`, 'error', 6000);
			} else if (r.kind === 'unsupported') {
				toast(`${r.name}: unsupported file type`, 'error');
			}
		}
	}

	/** Wire a dropped texture set into the selected material (or the subject's single material). */
	applyTextureSet(textures) {
		let material = this.selected?.material;
		if (Array.isArray(material)) material = material[0];
		if (!material && this.subject.model) {
			const mats = new Set();
			this.subject.model.traverse((o) => o.isMesh && mats.add(Array.isArray(o.material) ? o.material[0] : o.material));
			if (mats.size === 1) material = [...mats][0];
		}
		if (!material || !material.isMeshStandardMaterial) {
			toast('Select a mesh (click it) to receive the texture set.', 'error', 5000);
			return;
		}
		const wired = [];
		const flipY = !!this.subject.flipY;
		for (const t of textures) {
			const slot = classifyTexture(t.name);
			t.flipY = flipY;
			t.anisotropy = this.backend.caps.maxAnisotropy;
			t.colorSpace = slot === 'color' || slot === 'emissive' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
			t.wrapS = t.wrapT = THREE.RepeatWrapping;
			t.needsUpdate = true;
			if (slot === 'color') material.map = t;
			else if (slot === 'normal') {
				material.normalMap = t;
				material.normalScale.set(1, isDirectXNormal(t.name) ? -1 : 1);
			} else if (slot === 'roughness') {
				material.roughnessMap = t;
				material.roughness = 1;
			} else if (slot === 'metalness') {
				material.metalnessMap = t;
				material.metalness = 1;
			} else if (slot === 'orm') {
				material.aoMap = material.roughnessMap = material.metalnessMap = t;
				material.roughness = material.metalness = 1;
			} else if (slot === 'ao') material.aoMap = t;
			else if (slot === 'emissive') {
				material.emissiveMap = t;
				if (material.emissive.getHex() === 0) material.emissive.set(0xffffff);
			} else if (slot === 'height') material.bumpMap = t;
			else if (slot === 'opacity') {
				material.alphaMap = t;
				material.transparent = true;
			}
			wired.push(`${t.name} → ${slot}`);
		}
		material.needsUpdate = true;
		this.emit('select', this.selected);
		toast(`Texture set wired into “${material.name || 'material'}”: ${wired.join(', ')}`, 'ok', 6000);
	}

	// -------------------------------------------------------------------------------------------
	// Session

	saveSession() {
		if (!this.rig) return;
		if (this.current) this.saveScenePost(this.current);
		session.write({
			camera: this.rig.state(),
			compare: this.compare.image ? { image: this.compare.image, label: this.compare.label, split: this.compare.split, visible: this.compare.visible } : null,
		});
		this.settings.save();
	}

	restoreSession() {
		const data = session.read();
		if (data.camera) {
			this.rig.setMode(data.camera.mode || 'orbit');
			this.rig.restore(data.camera);
		}
		if (data.compare?.image) {
			Object.assign(this.compare, data.compare);
			this.dom.compareImage.src = data.compare.image;
			this.dom.compareHandle.firstElementChild.textContent = 'A · ' + (data.compare.label?.split(' · ')[0] || 'A');
			this.showCompare(data.compare.visible);
		}
	}
}

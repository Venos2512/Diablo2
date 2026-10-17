// Video capture (MediaRecorder on the canvas stream) and presentation mode (no UI, slow camera orbit,
// optional scene cycling) for showcasing.
import { toast } from '../ui/toast.js';

const MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

export class Recorder {
	constructor(app) {
		this.app = app;
		this.recorder = null;
		this.started = 0;
		this.listeners = new Set();
	}

	get supported() {
		return typeof MediaRecorder !== 'undefined' && !!this.app.backend.canvas.captureStream;
	}

	get recording() {
		return !!this.recorder;
	}

	get seconds() {
		return this.recorder ? (performance.now() - this.started) / 1000 : 0;
	}

	onChange(fn) {
		this.listeners.add(fn);
	}

	notify() {
		for (const fn of this.listeners) fn();
	}

	start({ fps = 60, mbps = 16 } = {}) {
		if (!this.supported) {
			toast('Video capture is not supported in this browser (MediaRecorder / captureStream).', 'error', 5000);
			return false;
		}
		if (this.recorder) return false;
		const mimeType = MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
		const stream = this.app.backend.canvas.captureStream(fps);
		const chunks = [];
		const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: mbps * 1e6 });
		recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
		this.done = new Promise((resolve) => {
			recorder.onstop = () => {
				stream.getTracks().forEach((t) => t.stop());
				resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
			};
		});
		recorder.start(250);
		this.recorder = recorder;
		this.mimeType = mimeType || 'video/webm';
		this.started = performance.now();
		this.notify();
		return true;
	}

	async stop() {
		if (!this.recorder) return null;
		this.recorder.stop();
		this.recorder = null;
		const blob = await this.done;
		this.notify();
		const ext = this.mimeType.includes('mp4') ? 'mp4' : 'webm';
		const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `lookdev-${this.app.current.id}-${this.app.mode}-${stamp}.${ext}`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 4000);
		toast(`Saved ${(blob.size / 1048576).toFixed(1)} MB video`, 'ok', 2500);
		return blob;
	}

	/** Record exactly one turntable revolution of the subject. */
	async turntable(seconds = 8) {
		const subject = this.app.subject;
		const prev = { on: subject.turntable, speed: subject.turntableSpeed };
		subject.pivot.rotation.y = 0;
		subject.turntableSpeed = 360 / seconds;
		subject.turntable = true;
		if (!this.start()) {
			Object.assign(subject, { turntable: prev.on, turntableSpeed: prev.speed });
			return;
		}
		await new Promise((r) => setTimeout(r, seconds * 1000));
		await this.stop();
		subject.turntable = prev.on;
		subject.turntableSpeed = prev.speed;
	}
}

export class Presentation {
	constructor(app) {
		this.app = app;
		this.active = false;
		this.cycle = 0;
		this.timer = 0;
		app.on('update', (dt) => this.update(dt));
		addEventListener('keydown', (e) => {
			if (this.active && (e.key === 'Escape' || e.key.toLowerCase() === 'h')) this.stop();
		});
	}

	/** cycleSeconds > 0 moves through the scenes. */
	start({ orbitSpeed = 0.6, cycleSeconds = 0 } = {}) {
		const app = this.app;
		if (app.rig.mode !== 'orbit') app.rig.setMode('orbit');
		this.active = true;
		this.cycle = cycleSeconds;
		this.timer = 0;
		app.rig.controls.autoRotate = true;
		app.rig.controls.autoRotateSpeed = orbitSpeed;
		app.toggleUI(true);
		toast('Presentation mode — press H or Esc to exit', 'info', 2500);
	}

	stop() {
		if (!this.active) return;
		this.active = false;
		this.app.rig.controls.autoRotate = false;
		this.app.toggleUI(false);
	}

	async update(dt) {
		if (!this.active || !this.cycle) return;
		this.timer += dt;
		if (this.timer < this.cycle || this.switching) return;
		this.timer = 0;
		this.switching = true;
		const ids = [...this.app.dom.sceneSelect.options].map((o) => o.value);
		const next = ids[(ids.indexOf(this.app.current.id) + 1) % ids.length];
		await this.app.setScene(next, { keepCamera: false });
		this.switching = false;
	}
}

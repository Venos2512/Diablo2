// Shader / build error overlay. GLSL errors show the failing lines of the generated source.
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function context(source, log) {
	if (!source || !log) return '';
	const lines = source.split('\n');
	const wanted = new Set();
	for (const m of log.matchAll(/ERROR:\s*\d+:(\d+)/g)) wanted.add(Number(m[1]));
	if (!wanted.size) return '';
	let out = '';
	for (const n of [...wanted].slice(0, 4)) {
		for (let i = Math.max(1, n - 3); i <= Math.min(lines.length, n + 2); i++) {
			const text = `${String(i).padStart(4)}  ${escapeHtml(lines[i - 1])}\n`;
			out += i === n ? `<span class="err-line">${text}</span>` : text;
		}
		out += '\n';
	}
	return out;
}

export class ErrorOverlay {
	constructor(el) {
		this.el = el;
		this.items = new Map();
		el.addEventListener('click', (e) => {
			if (e.target.matches('[data-dismiss]')) this.clear();
		});
	}

	shader(error) {
		let body = '';
		if (error.program) body += escapeHtml(error.program) + '\n\n';
		for (const stage of ['vertex', 'fragment']) {
			const s = error[stage];
			if (s?.log) body += `${stage.toUpperCase()}\n${escapeHtml(s.log)}\n\n${context(s.source, s.log)}`;
		}
		this.set('shader', `Shader compile error (${error.backend})`, body);
	}

	set(key, title, html) {
		this.items.set(key, `<h3>${escapeHtml(title)}</h3>${html}`);
		this.render();
	}

	text(key, title, text) {
		this.set(key, title, escapeHtml(text));
	}

	remove(key) {
		this.items.delete(key);
		this.render();
	}

	clear() {
		this.items.clear();
		this.render();
	}

	render() {
		if (!this.items.size) {
			this.el.hidden = true;
			this.el.innerHTML = '';
			return;
		}
		this.el.hidden = false;
		this.el.innerHTML = `<button class="button" data-dismiss>Dismiss</button>${[...this.items.values()].join('<hr>')}`;
	}
}

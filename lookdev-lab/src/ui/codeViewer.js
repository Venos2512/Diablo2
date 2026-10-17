// Source viewer / editor dialog: tabs of GLSL, TSL and compiled shader code. Editable tabs (GLSL files)
// apply through the shader registry, like the dev server's hot reload.
import { toast } from './toast.js';

const lineCount = (text) => (text ? text.split('\n').length : 0);

function el(tag, className, text) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}

export class CodeViewer {
	constructor() {
		const dlg = (this.dialog = el('dialog', 'code-viewer'));
		dlg.setAttribute('aria-label', 'Shader source');
		const head = el('div', 'cv-head');
		this.titleEl = el('h3', 'cv-title');
		this.subtitleEl = el('span', 'cv-subtitle');
		const close = el('button', 'button cv-close', 'Close');
		close.addEventListener('click', () => this.close());
		const titles = el('div', 'cv-titles');
		titles.append(this.titleEl, this.subtitleEl);
		head.append(titles, close);
		this.tabsEl = el('div', 'cv-tabs');
		this.tabsEl.setAttribute('role', 'tablist');
		this.noteEl = el('div', 'cv-note');
		this.text = el('textarea', 'cv-code');
		this.text.spellcheck = false;
		this.text.wrap = 'off';
		this.text.setAttribute('autocapitalize', 'off');
		this.text.setAttribute('autocomplete', 'off');
		const foot = el('div', 'cv-foot');
		this.statusEl = el('span', 'cv-status');
		this.actions = el('div', 'cv-actions');
		foot.append(this.statusEl, this.actions);
		dlg.append(head, this.tabsEl, this.noteEl, this.text, foot);
		document.body.appendChild(dlg);

		dlg.addEventListener('click', (e) => {
			if (e.target === dlg) this.close();
		});
		this.text.addEventListener('keydown', (e) => {
			if (e.key === 'Tab' && !this.text.readOnly) {
				e.preventDefault();
				this.text.setRangeText('\t', this.text.selectionStart, this.text.selectionEnd, 'end');
			} else if ((e.key === 'Enter' || e.key.toLowerCase() === 's') && (e.ctrlKey || e.metaKey) && this.current?.editable) {
				e.preventDefault();
				this.apply();
			}
		});
		this.text.addEventListener('input', () => this.updateStatus(true));
		this.tabs = [];
		this.current = null;
	}

	/**
	 * tabs: [{ id, label, text?, load?: async () => string, editable?, note?, filename?,
	 *          onApply?(text), onRevert?() -> string }]
	 */
	open({ title, subtitle = '', tabs, active }) {
		this.titleEl.textContent = title;
		this.subtitleEl.textContent = subtitle;
		this.tabs = tabs;
		this.tabsEl.innerHTML = '';
		for (const tab of tabs) {
			const b = el('button', 'cv-tab', tab.label);
			b.setAttribute('role', 'tab');
			b.addEventListener('click', () => this.show(tab.id));
			tab.button = b;
			this.tabsEl.appendChild(b);
		}
		if (!this.dialog.open) this.dialog.showModal();
		this.show(active && tabs.some((t) => t.id === active) ? active : tabs[0]?.id);
	}

	close() {
		if (this.current) this.current.draft = this.current.editable ? this.text.value : undefined;
		this.dialog.close();
	}

	async show(id) {
		if (this.current?.editable) this.current.draft = this.text.value;
		const tab = this.tabs.find((t) => t.id === id);
		if (!tab) return;
		this.current = tab;
		for (const t of this.tabs) t.button.classList.toggle('active', t === tab);
		this.noteEl.innerHTML = tab.note || '';
		this.noteEl.hidden = !tab.note;
		this.text.readOnly = !tab.editable;
		this.text.classList.toggle('editable', !!tab.editable);
		this.renderActions(tab);
		if (tab.text === undefined && tab.load) {
			this.text.value = 'Loading…';
			this.statusEl.textContent = '';
			try {
				tab.text = await tab.load();
			} catch (error) {
				tab.text = `// ${error?.message || error}`;
			}
			if (this.current !== tab) return;
		}
		this.text.value = tab.draft ?? tab.text ?? '';
		this.text.scrollTop = 0;
		this.updateStatus();
	}

	renderActions(tab) {
		this.actions.innerHTML = '';
		const button = (label, fn, primary = false) => {
			const b = el('button', `button${primary ? ' primary' : ''}`, label);
			b.addEventListener('click', fn);
			this.actions.appendChild(b);
		};
		if (tab.editable) {
			button('Revert to file', () => this.revert());
			button('Apply (Ctrl+Enter)', () => this.apply(), true);
		}
		if (tab.filename) button('Download', () => this.download(tab));
		button('Copy', () => this.copy());
	}

	updateStatus(dirty = false) {
		const tab = this.current;
		if (!tab) return;
		const lines = lineCount(this.text.value);
		const parts = [`${lines.toLocaleString()} lines · ${this.text.value.length.toLocaleString()} chars`];
		if (tab.editable && (dirty || (tab.draft !== undefined && tab.draft !== tab.text))) parts.push('unsaved edit');
		if (tab.status) parts.push(tab.status);
		this.statusEl.textContent = parts.join(' · ');
	}

	apply() {
		const tab = this.current;
		if (!tab?.editable) return;
		const code = this.text.value;
		tab.onApply?.(code);
		tab.text = code;
		tab.draft = undefined;
		this.updateStatus();
	}

	revert() {
		const tab = this.current;
		if (!tab?.editable) return;
		const code = tab.onRevert?.();
		if (typeof code === 'string') {
			tab.text = code;
			tab.draft = undefined;
			this.text.value = code;
			this.updateStatus();
		}
	}

	async copy() {
		try {
			await navigator.clipboard.writeText(this.text.value);
			toast('Copied to clipboard', 'ok', 1200);
		} catch {
			this.text.select();
			toast('Select-all done — press Ctrl+C to copy', 'info', 2500);
		}
	}

	download(tab) {
		const blob = new Blob([this.text.value], { type: 'text/plain' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = tab.filename;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	}
}

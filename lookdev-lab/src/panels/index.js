// Workspace tabs. Each panel owns a lil-gui instance mounted in the right column.
import { buildLookdevPanel } from './lookdev.js';
import { buildLightingPanel } from './lighting.js';
import { buildPostPanel } from './post.js';
import { buildShadersPanel } from './shaders.js';
import { buildVfxPanel } from './vfx.js';
import { buildEnvironmentPanel } from './environment.js';
import { buildPerfPanel } from './perf.js';

const TABS = [
	['lookdev', 'Lookdev', buildLookdevPanel],
	['lighting', 'Lighting', buildLightingPanel],
	['post', 'Post & camera', buildPostPanel],
	['shaders', 'Shaders', buildShadersPanel],
	['vfx', 'VFX', buildVfxPanel],
	['environment', 'Environment', buildEnvironmentPanel],
	['perf', 'Performance', buildPerfPanel],
];

export function buildPanels(app) {
	const panels = {};
	const host = app.dom.panel;
	const tabsEl = app.dom.tabs;
	let active = null;

	for (const [id, label, build] of TABS) {
		const el = document.createElement('div');
		el.className = 'panel-page';
		el.hidden = true;
		host.appendChild(el);
		const button = document.createElement('button');
		button.className = 'tab';
		button.textContent = label;
		button.setAttribute('role', 'tab');
		button.addEventListener('click', () => show(id));
		tabsEl.appendChild(button);
		panels[id] = { id, el, button, ...build(app, el) };
	}

	function refresh() {
		const panel = panels[active];
		panel?.gui?.controllersRecursive().forEach((c) => c.updateDisplay());
		panel?.refresh?.();
	}

	function show(id) {
		if (!panels[id]) id = 'lookdev';
		if (active && panels[active]) {
			panels[active].el.hidden = true;
			panels[active].button.classList.remove('active');
			panels[active].onHide?.();
		}
		active = id;
		panels[id].el.hidden = false;
		panels[id].button.classList.add('active');
		app.settings.data.tab = id;
		app.settings.changed('tab');
		panels[id].onShow?.();
		refresh();
	}

	show(app.settings.data.tab);
	return Object.assign(panels, { show, refresh, get active() { return active; } });
}

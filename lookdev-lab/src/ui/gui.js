// lil-gui helpers: one GUI per workspace tab, mounted inside the right panel.
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export function createGUI(container) {
	const gui = new GUI({ container, autoPlace: false, title: '' });
	gui.domElement.classList.add('lab-gui');
	return gui;
}

/** Free-form text row inside a folder (static app strings only). */
export function note(folder, html) {
	const el = document.createElement('div');
	el.className = 'lab-note';
	el.innerHTML = html;
	folder.$children.appendChild(el);
	return el;
}

/** Monospace live readout row; returns a setter. */
export function readout(folder) {
	const el = document.createElement('div');
	el.className = 'lab-readout';
	folder.$children.appendChild(el);
	return (text) => {
		if (el.textContent !== text) el.textContent = text;
	};
}

export function intro(container, title, html) {
	const el = document.createElement('div');
	el.className = 'panel-intro';
	el.innerHTML = `<h3>${title}</h3>${html}`;
	container.appendChild(el);
	return el;
}

/** Change the visible labels of a dropdown without recreating it (lil-gui's options() makes a new controller). */
export function relabelOptions(controller, labels) {
	const select = controller.$select;
	if (!select || select.options.length !== labels.length) return controller;
	labels.forEach((label, i) => (select.options[i].textContent = label));
	if (Array.isArray(controller._names)) controller._names = labels.slice();
	controller.updateDisplay();
	return controller;
}

/** Rebuild the options of a dropdown (returns the NEW controller, appended at the end of its folder). */
export function setOptions(controller, options) {
	controller.options(options);
	return controller;
}

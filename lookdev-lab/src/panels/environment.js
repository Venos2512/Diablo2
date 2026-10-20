import { createGUI, intro, note } from '../ui/gui.js';
import { clearFolder } from './lookdev.js';
import { SCENES } from '../scenes/index.js';
import { RECIPES } from '../env/forge.js';

/** Draw a forged DataTexture (RGBA8, bottom-up rows) into a small canvas thumbnail. */
function thumbnail(texture, size = 96) {
	const { data, width, height } = texture.image;
	const full = document.createElement('canvas');
	full.width = width;
	full.height = height;
	const img = new ImageData(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), width, height);
	full.getContext('2d').putImageData(img, 0, 0);
	const c = document.createElement('canvas');
	c.width = c.height = size;
	const ctx = c.getContext('2d');
	ctx.translate(0, size);
	ctx.scale(1, -1);
	ctx.drawImage(full, 0, 0, size, size);
	return c;
}

export function buildEnvironmentPanel(app, el) {
	intro(el, 'Environment', '<p>Procedural Act I scenes built from a modular kit (walls, gothic arches, pillars, graves, trees) and forged texture sets. Toggle mesh merging to see the draw-call cost of a kit.</p>');
	const gui = createGUI(el);
	const s = app.settings.data;
	const sceneState = { scene: s.scene };
	gui.add(sceneState, 'scene', Object.fromEntries(Object.entries(SCENES).map(([id, d]) => [d.label, id]))).name('Scene').onChange((id) => app.setScene(id));

	const fScene = gui.addFolder('Scene options');
	const fTex = gui.addFolder('Procedural textures (texture forge)');

	function buildScene() {
		sceneState.scene = app.current?.id;
		clearFolder(fScene);
		if (app.current?.buildEnvironmentControls) app.current.buildEnvironmentControls(fScene);
		else note(fScene, 'The studio has no environment options — see the <b>Lookdev</b> tab for backgrounds and references.');
		app.atmosphere?.buildControls(fScene); // GPU particle layers of the scene (env/atmosphere.js)
		buildTextures();
	}

	function buildTextures() {
		clearFolder(fTex);
		fTex.$children.querySelector('.lab-tex-grid')?.remove();
		if (!app.forge) {
			note(fTex, 'Textures are baked when an Act I scene is first opened.');
			return;
		}
		note(fTex, `Baked at ${app.forge.size}×${app.forge.size} on a private WebGL2 context from GLSL recipes in <b>src/shaders/forge</b>, then shared by both renderers. In dev mode, saving a recipe re-bakes it live.`);
		const grid = document.createElement('div');
		grid.className = 'lab-tex-grid';
		grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px 6px 8px;';
		for (const [id, set] of app.forge.sets) {
			const cell = document.createElement('figure');
			cell.style.cssText = 'margin:0;font-size:10px;color:var(--muted);text-align:center;';
			const c = thumbnail(set.map);
			c.style.cssText = 'width:100%;height:auto;border-radius:4px;border:1px solid var(--line-2);display:block;';
			cell.append(c, Object.assign(document.createElement('figcaption'), { textContent: `${RECIPES[id].label} · ${RECIPES[id].tile} m` }));
			grid.appendChild(cell);
		}
		fTex.$children.appendChild(grid);
	}

	app.on('scene', buildScene);
	buildScene();
	return { gui, refresh: () => (sceneState.scene = app.current?.id) };
}

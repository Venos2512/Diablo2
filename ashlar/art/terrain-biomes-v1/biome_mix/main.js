// ASHLAR biome mix viewer: mini-biome patches whose terrain layers blend by height. WebGL2 only. See README.md.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import { SAMPLES } from './samples.js';
import { createTerrainMaterial, GLOBALS } from './terrainMaterial.js';

const params = new URLSearchParams(location.search);
const OVERVIEW_PATCH = 12, FOCUS_PATCH = 32, GAP = 2.6, COLS = 4;
const PITCH = THREE.MathUtils.degToRad(55), FOV = 30;

const dbg = (window.__BIOME_MIX = { ready: false, frames: 0, samples: SAMPLES.map((s) => s.id), loaded: 0, errors: [], frameMs: 0, view: 'overview' });
const pushError = (m) => { m = String(m); if (!dbg.errors.includes(m)) dbg.errors.push(m); };
window.addEventListener('error', (e) => pushError(e.message));
window.addEventListener('unhandledrejection', (e) => pushError(e.reason?.message ?? e.reason));

// ---------- renderer / scene / camera
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
// shader compile/link failures must reach window.__BIOME_MIX.errors (ready stays false)
renderer.debug.onShaderError = (gl, program, vs, fs) => {
  const log = [gl.getProgramInfoLog(program), gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs)].filter(Boolean).join(' | ');
  console.error(log); // keeps the numbered shader source in the console
  pushError('shader error: ' + log.slice(0, 600));
};
const MAX_ANISO = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

const BG = 0x14161a;
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.FogExp2(BG, 0.0018);
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 1, 600);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.minDistance = 5;
controls.maxDistance = 160;
controls.maxPolarAngle = THREE.MathUtils.degToRad(84);

const sun = new THREE.DirectionalLight(0xfff1dc, 3.0);
const hemi = new THREE.HemisphereLight(0xb9c8e0, 0x3a332c, 0.95);
scene.add(sun, sun.target, hemi);
const light = { az: -45, el: 40, sun: 3.0, hemi: 0.95 };
function applyLight() {
  const az = THREE.MathUtils.degToRad(light.az), el = THREE.MathUtils.degToRad(light.el);
  // azimuth 0 = north (-z, screen up), +90 = east (+x, screen right): -45 = upper-left of the screen
  sun.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(120);
  sun.intensity = light.sun;
  hemi.intensity = light.hemi;
}
applyLight();

// ---------- textures
const flat = (r, g, b, a, cs) => {
  const t = new THREE.DataTexture(new Uint8Array([r, g, b, a]), 1, 1, THREE.RGBAFormat);
  t.colorSpace = cs; t.needsUpdate = true; return t;
};
const placeholders = { ah: flat(120, 120, 120, 128, THREE.SRGBColorSpace), n: flat(128, 128, 255, 255, THREE.NoColorSpace) };

const loadImage = (url) => new Promise((res, rej) => {
  const im = new Image();
  im.onload = () => res(im);
  im.onerror = () => rej(new Error('load failed ' + url));
  im.src = url;
});
function tuneTexture(t) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = MAX_ANISO;
  t.needsUpdate = true;
  return t;
}
const pixels = (im) => {
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, 0, 0);
  return g.getImageData(0, 0, c.width, c.height).data;
};
// albedo (sRGB) with the height in ALPHA; rows flipped by hand so the image top is at v = 1 (flipY stays false)
async function buildAlbedoHeight(id) {
  const [a, h] = await Promise.all([loadImage(`../albedo1024/${id}.png`), loadImage(`../height1024/${id}.png`)]);
  const W = a.naturalWidth, H = a.naturalHeight;
  if (h.naturalWidth !== W || h.naturalHeight !== H) throw new Error(`size mismatch albedo/height ${id}`);
  const ap = pixels(a), hp = pixels(h);
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    const src = (H - 1 - y) * W * 4, dst = y * W * 4;
    for (let x = 0; x < W * 4; x += 4) {
      out[dst + x] = ap[src + x]; out[dst + x + 1] = ap[src + x + 1]; out[dst + x + 2] = ap[src + x + 2];
      out[dst + x + 3] = hp[src + x];
    }
  }
  const t = new THREE.DataTexture(out, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false;
  return tuneTexture(t);
}
async function buildNormal(id) {
  const im = await loadImage(`../normal1024/${id}.png`);
  const t = new THREE.Texture(im); // flipY = true (default): image top -> v = 1, same orientation as the albedo/height texture
  t.colorSpace = THREE.NoColorSpace;
  return tuneTexture(t);
}
const texCache = { ah: new Map(), n: new Map() };
function getTexture(kind, id) {
  const c = texCache[kind];
  if (!c.has(id)) {
    const p = (kind === 'ah' ? buildAlbedoHeight(id) : buildNormal(id)).then((t) => { t.userData.ready = true; dbg.loaded++; return t; });
    p.catch((e) => pushError(e.message));
    c.set(id, p);
  }
  return c.get(id);
}

// ---------- samples -> meshes
const patchGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
patchGeo.rotateX(-Math.PI / 2); // u -> +x, v -> -z
const rows = Math.ceil(SAMPLES.length / COLS);
const pitchXZ = OVERVIEW_PATCH + GAP;
const gridW = COLS * OVERVIEW_PATCH + (COLS - 1) * GAP, gridD = rows * OVERVIEW_PATCH + (rows - 1) * GAP;

const overviewGroup = new THREE.Group();
const focusGroup = new THREE.Group();
scene.add(overviewGroup, focusGroup);
const labelHost = document.getElementById('labels');
const info = document.getElementById('info');
const statusEl = document.getElementById('status');

let gui = null, adv = null, viewCtl = null, layerFolder = null, blendFolder = null;

// ---------- smoothness: one slider drives the mask softness, octave detail, edge noise and the height blend together
// 0 = the crisp look (sample/layer defaults in samples.js), 1 = very soft. Individual sliders (Advanced) edit the effective values.
const lerp = (a, b, t) => a + (b - a) * t;
const SOFT_TARGET = { patch: 0.12, low: 0.12, path: 1.4, cell: 1.7 }; // patch/low: noise-threshold units; path/cell: metres
const smooth = { value: THREE.MathUtils.clamp(Number(params.get('smooth') ?? 0.7), 0, 1) };
SAMPLES.forEach((s) => { s.crisp = { depth: s.depth, hi: s.hi, warp: s.warp }; s.layers.forEach((l) => { l.crispSoft = l.soft; }); });
function applySmooth(v) {
  smooth.value = v;
  const G = GLOBALS;
  G.uLin.value = v;
  G.uDetail.value = lerp(1, 0.15, v);
  G.uContrast.value = lerp(2.1, 1.0, v);
  G.uWarpFreq.value = lerp(0.7, 0.4, v);
  G.uEdgeAmp.value = lerp(1.3, 0.5, v);
  G.uEdgeFreq.value = lerp(0.75, 0.4, v);
  for (const s of SAMPLES) {
    s.depth = lerp(s.crisp.depth, 0.45, v);
    s.hi = lerp(s.crisp.hi, 0.45, v);
    s.warp = lerp(s.crisp.warp, 2.2, v);
    s.layers.forEach((l, i) => { if (SOFT_TARGET[l.role]) l.soft = lerp(l.crispSoft, SOFT_TARGET[l.role], v); if (s.uniforms) pUpdate(s, i); });
    if (s.uniforms) { s.uniforms.uDepth.value = s.depth; s.uniforms.uHI.value = s.hi; s.uniforms.uWarp.value = s.warp; }
  }
  if (gui) gui.controllersRecursive().forEach((c) => c.updateDisplay());
}
function pUpdate(s, i) { const l = s.layers[i]; s.uniforms.uP.value[i].set(l.coverage, l.width, l.soft, s.seed + i * 7.31); }
applySmooth(smooth.value);

// URL overrides for automation: ?hi= ?depth= ?over= ?noise= ?warp= (all samples), ?at=0 (anti-tiling off), ?varscale= ?macro=
for (const key of ['hi', 'depth', 'over', 'noise', 'warp']) if (params.has(key)) SAMPLES.forEach((s) => { s[key] = Number(params.get(key)); });
if (params.get('at') === '0') GLOBALS.uAT.value = 0;
if (params.has('varscale')) GLOBALS.uVarScale.value = Number(params.get('varscale'));
if (params.has('macro')) GLOBALS.uMacro.value = Number(params.get('macro'));

SAMPLES.forEach((s, k) => {
  s.material = createTerrainMaterial(s, placeholders);
  s.uniforms = s.material.userData.uniforms;
  s.loadedLayers = 0;
  s.cx = (k % COLS - (COLS - 1) / 2) * pitchXZ;
  s.cz = (Math.floor(k / COLS) - (rows - 1) / 2) * pitchXZ;
  s.mesh = new THREE.Mesh(patchGeo, s.material);
  s.mesh.scale.set(OVERVIEW_PATCH, 1, OVERVIEW_PATCH);
  s.mesh.position.set(s.cx, 0, s.cz);
  s.mesh.userData.sampleId = s.id;
  overviewGroup.add(s.mesh);
  s.focusMesh = new THREE.Mesh(patchGeo, s.material);
  s.focusMesh.scale.set(FOCUS_PATCH, 1, FOCUS_PATCH);
  s.focusMesh.visible = false;
  focusGroup.add(s.focusMesh);
  s.label = document.createElement('div');
  s.label.className = 'lbl';
  s.label.innerHTML = `<b>${s.name}</b><small>${s.layers.map((l) => l.id.replace(/^BIO/, '')).join(' · ')}</small>`;
  labelHost.appendChild(s.label);
  s.texPromise = null;
});

function ensureTextures(s) {
  if (s.texPromise) return s.texPromise;
  s.texPromise = Promise.all(s.layers.map(async (l, i) => {
    const [ah, n] = await Promise.all([getTexture('ah', l.id), getTexture('n', l.id)]);
    s.uniforms[`uAH${i}`].value = ah;
    s.uniforms[`uN${i}`].value = n;
    s.loadedLayers++;
  })).catch((e) => pushError(e.message));
  return s.texPromise;
}

// ---------- view state
const state = { view: 'overview', edit: SAMPLES[0].id };
const byId = (id) => SAMPLES.find((s) => s.id === id);
const visibleSamples = () => (state.view === 'overview' ? SAMPLES : [byId(state.view)]);

function fitDistance(extX, extZ, margin = 1.06) {
  const aspect = camera.aspect, t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const dx = (extX / 2) / (t * aspect), dz = (extZ * Math.sin(PITCH)) / (2 * t) + extZ * Math.cos(PITCH) * 0.5;
  return Math.max(dx, dz) * margin;
}
function placeCamera(dist, target = new THREE.Vector3()) {
  controls.target.copy(target);
  camera.position.set(target.x, target.y + dist * Math.sin(PITCH), target.z + dist * Math.cos(PITCH));
  camera.lookAt(target);
  controls.update();
}

function setView(v) {
  state.view = v;
  dbg.view = v;
  const overview = v === 'overview';
  overviewGroup.visible = overview;
  focusGroup.visible = !overview;
  SAMPLES.forEach((s) => { s.focusMesh.visible = !overview && s.id === v; s.label.style.display = overview ? '' : 'none'; });
  if (overview) {
    SAMPLES.forEach(ensureTextures);
    info.style.display = 'none';
    placeCamera(fitDistance(gridW, gridD, 1.1), new THREE.Vector3(4, 0, 1));
  } else {
    const s = byId(v);
    ensureTextures(s);
    state.edit = v;
    info.style.display = 'block';
    info.innerHTML = `<b>${s.name}</b> <small>${s.layers.map((l) => `${l.id} (${l.role})`).join(' · ')}</small>`;
    placeCamera(fitDistance(FOCUS_PATCH, FOCUS_PATCH, 1.2));
  }
  dbg.ready = false; loadedFrames = 0;
  if (gui) { viewCtl.setValue(v); rebuildEditFolders(); }
}

// ---------- GUI
const display = { normals: params.get('normals') !== '0', weights: params.get('debug') === 'weights', albedoOnly: params.get('unlit') === '1', applyAll: false };
function applyDisplay() {
  SAMPLES.forEach((s) => {
    s.uniforms.uNormalsOn.value = display.normals ? 1 : 0;
    s.uniforms.uDebug.value = display.weights ? 1 : 0;
    s.uniforms.uUnlit.value = display.albedoOnly ? 1 : 0;
  });
}
function setBlend(key, uniform, v) {
  (display.applyAll ? SAMPLES : [byId(state.edit)]).forEach((s) => { s[key] = v; s.uniforms[uniform].value = v; });
}
function rebuildEditFolders() {
  blendFolder?.destroy(); layerFolder?.destroy();
  const s = byId(state.edit);
  blendFolder = adv.addFolder(`Blend – ${s.id}`);
  blendFolder.add(s, 'depth', 0.01, 0.6, 0.005).name('blend depth (độ nét)').onChange((v) => setBlend('depth', 'uDepth', v));
  blendFolder.add(s, 'over', 0, 1, 0.01).name('priority suppress').onChange((v) => setBlend('over', 'uOver', v));
  blendFolder.add(s, 'hi', 0, 1.5, 0.01).name('height influence').onChange((v) => setBlend('hi', 'uHI', v));
  blendFolder.add(s, 'noise', 0.05, 1.5, 0.005).name('noise scale (1/m)').onChange((v) => setBlend('noise', 'uNoise', v));
  blendFolder.add(s, 'warp', 0, 8, 0.05).name('domain warp (m)').onChange((v) => setBlend('warp', 'uWarp', v));
  blendFolder.add(display, 'applyAll').name('áp dụng cho mọi mẫu');
  layerFolder = adv.addFolder(`Layers – ${s.name}`);
  s.layers.forEach((l, i) => {
    const f = layerFolder.addFolder(`${i + 1}. ${l.id} (${l.role})`);
    f.add(l, 'visible').onChange((v) => { s.uniforms.uVis.value[i] = v ? 1 : 0; });
    f.add(l, 'tile', 1, 14, 0.1).name('tile (m)').onChange((v) => { s.uniforms.uTile.value[i] = v; });
    f.add(l, 'ns', 0, 2, 0.01).name('normalScale').onChange((v) => { s.uniforms.uNS.value[i] = v; });
    f.add(l, 'hBias', -0.3, 0.3, 0.005).name('height bias').onChange((v) => { s.uniforms.uHB.value[i] = v; });
    f.add(l, 'variation', 0, 1, 0.01).name('anti-tiling offset').onChange((v) => { s.uniforms.uVar.value[i] = v; });
    f.add(l, 'rotate', { none: 0, 'quarter turns': 1, 'half turns': 2 }).name('anti-tiling turns').onChange((v) => { s.uniforms.uRot.value[i] = Number(v); });
    if (l.role === 'patch' || l.role === 'low') f.add(l, 'coverage', 0, 1, 0.01).onChange(() => pUpdate(s, i));
    if (l.role === 'path') f.add(l, 'width', 0.3, 14, 0.05).name('width (m)').onChange(() => pUpdate(s, i));
    if (l.role === 'path' || l.role === 'cell') f.add(l, 'soft', 0.02, 3, 0.01).name('soft (m)').onChange(() => pUpdate(s, i));
    else if (l.role !== 'base') f.add(l, 'soft', 0.005, 0.2, 0.005).onChange(() => pUpdate(s, i));
    f.close();
  });
}
function buildGui() {
  gui = new GUI({ title: 'Biome mix' });
  const opts = { 'Overview (lưới)': 'overview' };
  SAMPLES.forEach((s) => { opts[s.name] = s.id; });
  viewCtl = gui.add(state, 'view', opts).name('Mẫu').onChange((v) => { if (v !== dbg.view) setView(v); });
  gui.add({ overview: () => setView('overview') }, 'overview').name('◀ Overview');
  gui.add(smooth, 'value', 0, 1, 0.01).name('Độ mịn (smoothness)').onChange(applySmooth);
  const d = gui.addFolder('Hiển thị');
  d.add(display, 'normals').name('normal maps').onChange(applyDisplay);
  d.add(display, 'weights').name('debug: weights').onChange(applyDisplay);
  d.add(display, 'albedoOnly').name('albedo only (unlit)').onChange(applyDisplay);
  const at = gui.addFolder('Anti-tiling');
  at.add({ on: GLOBALS.uAT.value > 0 }, 'on').name('anti-tiling on/off').onChange((v) => { GLOBALS.uAT.value = v ? 1 : 0; });
  at.add(GLOBALS.uVarScale, 'value', 0.03, 0.5, 0.005).name('variation scale (areas/m)');
  at.add(GLOBALS.uMacro, 'value', 0, 0.4, 0.005).name('macro brightness');
  const lf = gui.addFolder('Ánh sáng');
  lf.add(light, 'az', -180, 180, 1).name('azimuth (−45 = trên-trái)').onChange(applyLight);
  lf.add(light, 'el', 5, 85, 1).name('elevation').onChange(applyLight);
  lf.add(light, 'sun', 0, 6, 0.05).name('sun').onChange(applyLight);
  lf.add(light, 'hemi', 0, 3, 0.05).name('hemisphere').onChange(applyLight);
  adv = gui.addFolder('Advanced (giá trị hiệu dụng)');
  adv.close();
  rebuildEditFolders();
}

// ---------- picking
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null;
renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || state.view !== 'overview' || e.button !== 0) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 5) return;
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(overviewGroup.children, false)[0];
  if (hit) setView(hit.object.userData.sampleId);
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- loop
const tmp = new THREE.Vector3();
let loadedFrames = 0, lastT = performance.now();
const dts = [];
function updateLabels() {
  if (state.view !== 'overview') return;
  for (const s of SAMPLES) {
    tmp.set(s.cx, 0, s.cz + OVERVIEW_PATCH / 2 + 0.2).project(camera);
    const behind = tmp.z > 1;
    s.label.style.display = behind ? 'none' : '';
    s.label.style.left = `${(tmp.x * 0.5 + 0.5) * innerWidth}px`;
    s.label.style.top = `${(-tmp.y * 0.5 + 0.5) * innerHeight}px`;
  }
}
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  dts.push(now - lastT); lastT = now;
  if (dts.length > 60) dts.shift();
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
  dbg.frames++;
  const vis = visibleSamples();
  const allLoaded = vis.every((s) => s.loadedLayers === s.layers.length);
  loadedFrames = allLoaded ? loadedFrames + 1 : 0;
  dbg.ready = loadedFrames >= 10 && dbg.errors.length === 0;
  if (dbg.frames % 30 === 0) {
    dbg.frameMs = +(dts.reduce((a, b) => a + b, 0) / dts.length).toFixed(2);
    const m = renderer.info.memory;
    dbg.textures = m.textures; dbg.drawCalls = renderer.info.render.calls;
    statusEl.textContent = `${dbg.frameMs} ms/frame · ${m.textures} textures · ${dbg.loaded} loaded${dbg.errors.length ? ` · ${dbg.errors.length} errors` : ''}`;
  }
}

dbg.api = { THREE, renderer, scene, samples: SAMPLES, globals: GLOBALS, focus: (id) => setView(id), overview: () => setView('overview'), setLight: (o) => { Object.assign(light, o); applyLight(); }, camera, controls, state, display, applyDisplay };
buildGui();
applyDisplay();
const startSample = params.get('sample');
setView(startSample && byId(startSample) ? startSample : 'overview');
animate();

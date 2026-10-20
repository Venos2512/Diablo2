// ===== [ASHLAR] terrain asset loader (part of the single module, see js/manifest.json) =====
// Reads assets/ashlar/terrain/config.json + the images it lists and returns plain pixel arrays.
// No game internals here: the game-side glue (Kh, sg, lg, ug, grass cards) is marked `// [ASHLAR]` in js/game/07-terrain-grass-materials.js.
//
//   ?ashlar=off     nothing is loaded: exactly the original game
//   ?ashlar=ground  ASHLAR ground layers, original blade grass
//   default | ?ashlar=all   ASHLAR ground layers + grass cards
//   ?nmap=off | ?nmap=albedo   town ground normals: the original Kh() Sobel | the NormalMap-Online maps from the albedo (default: from the height maps)
//
// Dev: files are fetched by URL. Build (tools/build.py): `__ASHLAR_INLINE` maps "assets/ashlar/terrain/<file>" to a data URI.
// On any load/decode failure: console.warn('[ashlar] ...') and the game keeps its original terrain (ashlarLoadTerrain() returns null).
// Dev knobs (set before boot, e.g. via the devtools protocol): window.__ASHLAR_TUNE = { strengthMul, meters: { grass: 2.8 }, card: { density: 0.5 }, surface: { specular: 0.2, albedoGain: 1.3 }, look: { exposure: 1.1 } }

const ASHLAR_DIR = 'assets/ashlar/terrain/';
const ASHLAR = (() => {
  const q = new URLSearchParams(location.search).get('ashlar');
  const nm = new URLSearchParams(location.search).get('nmap');
  return { mode: q === 'off' || q === 'ground' ? q : 'all', nmap: nm === 'off' || nm === 'albedo' ? nm : 'height', ready: false, ms: 0, cards: false, source: typeof __ASHLAR_INLINE === 'undefined' ? 'url' : 'inline' };
})();
window.__ASHLAR = ASHLAR;

async function ashlarBlob(file, dir = ASHLAR_DIR) { // dir: also used by js/ashlar-kits.js
  if (ASHLAR.source === 'inline') {
    const uri = __ASHLAR_INLINE[dir + file];
    if (!uri) throw new Error(`inlined asset missing: ${file}`);
    const i = uri.indexOf(',');
    const bin = atob(uri.slice(i + 1)); // no fetch(): data: URIs may be blocked by an embedding page's CSP
    const u = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    return new Blob([u], { type: uri.slice(5, uri.indexOf(';')) });
  }
  const r = await fetch(dir + file);
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return r.blob();
}

// raw sample values: no colour conversion, no alpha premultiplication
function ashlarBitmap(file, extra) {
  return ashlarBlob(file).then((b) => createImageBitmap(b, Object.assign({ colorSpaceConversion: 'none', premultiplyAlpha: 'none' }, extra)));
}

function ashlarPixels(bmp) {
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(bmp, 0, 0);
  return x.getImageData(0, 0, c.width, c.height).data; // opaque images only: no alpha round trip
}

/** NormalMap-Online normal map of one layer (config.json nmap / nmapAlbedo) -> RGBA bytes for the game's normal texture: RGB = the map (slopes scaled by nmapScale), A = the layer height (layer height-blend). null: not configured. */
async function ashlarNormal(name, L, heights, tune) {
  const file = ASHLAR.nmap === 'albedo' ? L.nmapAlbedo : L.nmap;
  if (!file) return null;
  const b = await ashlarBitmap(file), n = L.size;
  if (b.width !== n || b.height !== n) throw new Error(`layer ${name}: ${file} is ${b.width}x${b.height}, config.json says ${n}x${n}`);
  const px = ashlarPixels(b), out = new Uint8Array(n * n * 4), k = (L.nmapScale ?? 1) * (tune.nmapMul ?? 1);
  b.close();
  for (let i = 0, j = 0; i < n * n; i++, j += 4) {
    let x = px[j] / 127.5 - 1, y = px[j + 1] / 127.5 - 1, z = px[j + 2] / 127.5 - 1;
    if (k !== 1) { // scale the slopes (strength) and renormalise
      const zz = Math.max(z, 1e-3), sx = x / zz * k, sy = y / zz * k;
      z = 1 / Math.hypot(sx, sy, 1), x = sx * z, y = sy * z;
    }
    out[j] = Math.round((x * 0.5 + 0.5) * 255), out[j + 1] = Math.round((y * 0.5 + 0.5) * 255), out[j + 2] = Math.round((z * 0.5 + 0.5) * 255), out[j + 3] = Math.round(heights[i] * 255);
  }
  return out;
}

/** One ground layer -> the arguments of the game's Kh(): albedo RGBA (a = roughness), heights 0..1, normal strength. */
async function ashlarLayer(name, L, tune) {
  const [ab, hb, rb] = await Promise.all([ashlarBitmap(L.albedo), ashlarBitmap(L.height), ashlarBitmap(L.rough)]);
  const n = L.size;
  for (const [what, b] of [['albedo', ab], ['height', hb], ['rough', rb]]) {
    if (b.width !== n || b.height !== n) throw new Error(`layer ${name}: ${what} is ${b.width}x${b.height}, config.json says ${n}x${n}`);
  }
  const a = ashlarPixels(ab), h = ashlarPixels(hb), r = ashlarPixels(rb);
  ab.close(); hb.close(); rb.close();
  const albedo = new Uint8Array(n * n * 4), heights = new Float32Array(n * n);
  let sum = 0;
  for (let i = 0, j = 0; i < n * n; i++, j += 4) {
    albedo[j] = a[j]; albedo[j + 1] = a[j + 1]; albedo[j + 2] = a[j + 2]; albedo[j + 3] = r[j];
    heights[i] = h[j] / 255;
    sum += a[j] + a[j + 1] + a[j + 2];
  }
  if (sum / (n * n * 3) < 8) throw new Error(`layer ${name}: decoded albedo is black`);
  let nmap = null;
  if (ASHLAR.nmap !== 'off') {
    try {
      nmap = await ashlarNormal(name, L, heights, tune);
    } catch (e) {
      console.warn(`[ashlar] NormalMap-Online map of "${name}" unavailable, the town keeps the Sobel normals:`, e);
    }
  }
  return { size: n, albedo, heights, strength: L.normalStrength * (tune.strengthMul ?? 1), meters: tune.meters?.[name] ?? L.meters, nmap };
}

/** -> { layers: {name: {size, albedo, heights, strength, meters, nmap}}, themes: {theme: [4 layer names]}, cards: {bitmap, params} | null, surface: {specular, roughnessMin, albedoGain}, look: {exposure} } or null */
async function ashlarLoadTerrain() {
  if (ASHLAR.mode === 'off') return null;
  const t0 = performance.now();
  try {
    const cfg = JSON.parse(await (await ashlarBlob('config.json')).text());
    const tune = window.__ASHLAR_TUNE ?? {};
    const layers = {};
    for (const name of Object.keys(cfg.layers)) layers[name] = await ashlarLayer(name, cfg.layers[name], tune);
    for (const [theme, names] of Object.entries(cfg.themes)) {
      if (names.length !== 4 || names.some((n) => !layers[n])) throw new Error(`config.json: theme ${theme} must list 4 known layers`);
    }
    let cards = null;
    if (ASHLAR.mode === 'all' && cfg.cards) {
      try {
        // flipY here: uploads of an ImageBitmap ignore texture.flipY
        cards = { bitmap: await ashlarBitmap(cfg.cards.atlas, { imageOrientation: 'flipY' }), params: Object.assign({}, cfg.cards.params, tune.card) };
      } catch (e) {
        console.warn('[ashlar] grass cards unavailable, keeping the original blade grass:', e);
      }
    }
    ASHLAR.ms = Math.round(performance.now() - t0);
    // surface: specular scale / roughness floor for the dry ground (config.json "surface"; __ASHLAR_TUNE.surface overrides)
    const surface = Object.assign({ specular: 1, roughnessMin: 0, albedoGain: 1 }, cfg.surface, tune.surface);
    const look = Object.assign({ exposure: 1 }, cfg.look, tune.look); // global look: renderer exposure (config.json "look")
    return { layers, themes: cfg.themes, nmapThemes: cfg.nmapThemes ?? [], cards, surface, look };
  } catch (e) {
    console.warn('[ashlar] could not load the terrain assets, using the original terrain and grass:', e);
    return null;
  }
}

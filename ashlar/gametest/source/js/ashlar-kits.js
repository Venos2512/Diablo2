// ===== [ASHLAR] prop kit loader (part of the single module, see js/manifest.json) =====
// Reads assets/ashlar/kits/config.json, the GLB kits it lists (Tripo camp kits made for the lookdev lab) and returns plain arrays + bitmaps.
// No game internals here (the glue that turns this into three.js objects is marked `// [ASHLAR]` in js/game/07-terrain-grass-materials.js).
//
//   ?ashlar=off   nothing is loaded: exactly the original game
//   ?kits=off     ASHLAR terrain, original props
//
// Dev: files are fetched by URL. Build (tools/build.py): `__ASHLAR_INLINE` maps "assets/ashlar/kits/<file>" to a data URI.
// A kit that fails to load / decode: console.warn('[ashlar] ...') and the kinds that need it keep the original props.
// GLB conventions of the lab kits: glTF 2.0, no extensions, one node + mesh per piece named `<prefix>_<NN>_<name>`, pivot at the piece's
// bottom centre (min y = 0), length along +x, one material per kit (baseColor JPEG, optional normal map), POSITION/NORMAL/TEXCOORD_0 + indices.

const ASHLAR_KITS_DIR = 'assets/ashlar/kits/';
const ASHLAR_KITS = (() => {
  const q = new URLSearchParams(location.search).get('kits');
  return { mode: q === 'off' || ASHLAR.mode === 'off' ? 'off' : 'on', ready: false, ms: 0, kits: {}, failed: [], source: ASHLAR.source };
})();
window.__ASHLAR_KITS = ASHLAR_KITS;

/** GLB container -> { json, bin: ArrayBuffer view } */
function ashlarGlbParse(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(4, true) !== 2) throw new Error('not a GLB 2.0 file');
  let json = null, bin = null;
  for (let o = 12; o + 8 <= dv.byteLength;) {
    const len = dv.getUint32(o, true), type = dv.getUint32(o + 4, true);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, o + 8, len)));
    else if (type === 0x004e4942 && !bin) bin = new Uint8Array(buf, o + 8, len);
    o += 8 + len;
  }
  if (!json || !bin) throw new Error('GLB without JSON / BIN chunk');
  return { json, bin };
}

const ASHLAR_GLB_TYPED = { 5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const ASHLAR_GLB_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3 };

/** Accessor -> tightly packed typed array (handles byteStride and unaligned views) */
function ashlarGlbAccessor(g, index) {
  const a = g.json.accessors[index], view = g.json.bufferViews[a.bufferView], T = ASHLAR_GLB_TYPED[a.componentType], n = ASHLAR_GLB_SIZE[a.type];
  if (!T || !n || a.normalized || a.sparse) throw new Error(`unsupported accessor ${index}`);
  const out = new T(a.count * n), base = g.bin.byteOffset + (view.byteOffset ?? 0) + (a.byteOffset ?? 0), stride = view.byteStride || n * T.BYTES_PER_ELEMENT;
  const dv = new DataView(g.bin.buffer);
  const get = { 5121: 'getUint8', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' }[a.componentType];
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = dv[get](base + i * stride + k * T.BYTES_PER_ELEMENT, true);
  return out;
}

function ashlarGlbPieces(g) {
  const pieces = {};
  for (const node of g.json.nodes ?? []) {
    if (node.mesh === undefined) continue;
    const prim = g.json.meshes[node.mesh].primitives[0], at = prim.attributes;
    if ((prim.mode ?? 4) !== 4 || prim.indices === undefined || at.POSITION === undefined || at.NORMAL === undefined || at.TEXCOORD_0 === undefined) throw new Error(`piece ${node.name}: needs indexed triangles with POSITION/NORMAL/TEXCOORD_0`);
    if (node.matrix || node.translation || node.rotation || node.scale) throw new Error(`piece ${node.name}: node transforms are not supported (bake them into the vertices)`);
    const pos = ashlarGlbAccessor(g, at.POSITION), nrm = ashlarGlbAccessor(g, at.NORMAL), uv = ashlarGlbAccessor(g, at.TEXCOORD_0), idx = ashlarGlbAccessor(g, prim.indices);
    const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], pos[i + k]); max[k] = Math.max(max[k], pos[i + k]); }
    pieces[node.name] = { name: node.name, pos, nrm, uv, idx, min, max };
  }
  return pieces;
}

/** One kit: pieces + decoded images + the material factors of its (single) material */
async function ashlarLoadKit(key, file, maxTexture) {
  const g = ashlarGlbParse(await (await ashlarBlob(file, ASHLAR_KITS_DIR)).arrayBuffer());
  const pieces = ashlarGlbPieces(g);
  const m = g.json.materials?.[0] ?? {}, pbr = m.pbrMetallicRoughness ?? {};
  // raw sample values, no colour conversion / premultiplication (the GLTFLoader does the same); orientation stays top-left = glTF uv (0, 0) with texture.flipY = false
  const image = async (texIndex) => {
    if (texIndex === undefined) return null;
    const im = g.json.images[g.json.textures[texIndex].source], v = g.json.bufferViews[im.bufferView];
    const bytes = g.bin.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength);
    const bmp = await createImageBitmap(new Blob([bytes], { type: im.mimeType }), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    if (!maxTexture || Math.max(bmp.width, bmp.height) <= maxTexture) return bmp;
    const k = maxTexture / Math.max(bmp.width, bmp.height), small = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * k), resizeHeight: Math.round(bmp.height * k), resizeQuality: 'high', colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
    bmp.close();
    return small; // config.json "material.maxTexture": downscale the kit textures (GPU memory / boot time)
  };
  const [base, normal] = await Promise.all([image(pbr.baseColorTexture?.index), image(m.normalTexture?.index)]);
  if (!base) throw new Error(`kit ${key}: no baseColor texture`);
  const c = pbr.baseColorFactor ?? [1, 1, 1, 1];
  return { key, file, pieces, base, normal, color: [c[0], c[1], c[2]], normalScale: m.normalTexture?.scale ?? 1, doubleSided: !!m.doubleSided };
}

/** -> { config, kits: { key: kit } } or null (?ashlar=off, ?kits=off, or nothing loadable: warned) */
async function ashlarLoadKits() {
  if (ASHLAR_KITS.mode === 'off') return null;
  const t0 = performance.now();
  try {
    const config = JSON.parse(await (await ashlarBlob('config.json', ASHLAR_KITS_DIR)).text());
    const kits = {};
    await Promise.all(Object.entries(config.kits).map(async ([key, file]) => {
      try {
        kits[key] = await ashlarLoadKit(key, file, config.material?.maxTexture);
      } catch (e) {
        ASHLAR_KITS.failed.push(key);
        console.warn(`[ashlar] kit "${key}" (${file}) failed to load, its props stay original:`, e);
      }
    }));
    ASHLAR_KITS.ms = Math.round(performance.now() - t0);
    return Object.keys(kits).length ? { config, kits } : null;
  } catch (e) {
    console.warn('[ashlar] could not load the prop kits, using the original props:', e);
    return null;
  }
}

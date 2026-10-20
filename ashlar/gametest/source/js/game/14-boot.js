// ===== game part 14-boot (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var tz, nz, rz = t((() => {
  qR(), ZR(), xL(), tz = null, nz = { engine: () => tz, stats: () => tz?.bank.stats() ?? null, sfxIds: () => bL, sfxBuffers(e4) {
    let t2 = tz;
    if (!t2) return [];
    let n2 = [];
    for (let r2 of t2.bank.sfx.get(e4) ?? []) {
      let e5 = r2?.buffer;
      e5 && n2.push(e5);
    }
    return n2;
  }, encodeWav: YR, metrics: XR };
})), iz = Object.assign({ "../models/index.ts": () => e_(() => Promise.resolve().then(() => (QC(), IC)), void 0, import.meta.url) }), az = Object.assign({ "../ui/index.ts": () => e_(() => Promise.resolve().then(() => (kO(), SO)), void 0, import.meta.url) }), oz = Object.assign({ "../world/props/index.ts": () => e_(() => Promise.resolve().then(() => (MN(), kN)), void 0, import.meta.url) }), sz = Object.assign({ "../audio/index.ts": () => e_(() => Promise.resolve().then(() => (rz(), QR)), void 0, import.meta.url) });
async function cz(e4) {
  let t2 = Object.keys(e4)[0];
  if (!t2) return null;
  try {
    return await e4[t2]();
  } catch (e5) {
    return console.error(`[unhallowed] module failed to load`, t2, e5), null;
  }
}
async function lz() {
  let [e4, t2, n2, r2] = await Promise.all([cz(iz), cz(az), cz(oz), cz(sz)]), i2 = e4?.models ?? (e4?.createHero ? e4 : null), a2 = t2?.ui ?? (t2?.mountUI ? { mountUI: t2.mountUI } : null), o2 = n2?.propProvider ?? null;
  if (!o2 && n2?.buildPropGeometry && n2.getPropMaterial && n2.buildObjectModel) {
    let e5 = n2;
    o2 = { geometry: (t3, n3) => e5.buildPropGeometry(t3, n3), material: () => e5.getPropMaterial(), castsShadow: (t3) => e5.castsShadow(t3), update: (t3) => e5.updatePropMaterial(t3), object: (t3, n3) => e5.buildObjectModel(t3, n3), caveWalls: (t3) => e5.buildCaveWalls(t3) };
  }
  let s2 = null;
  try {
    s2 = r2?.createAudioEngine?.() ?? null;
  } catch (e5) {
    console.error(`[unhallowed] audio init failed`, e5);
  }
  return { models: i2 ?? Jg, props: o2 ?? Xg(), ui: a2 ?? Gg, audio: s2 ?? Wg(), sources: { models: i2 ? `module` : `fallback`, props: o2 ? `module` : `fallback`, ui: a2 ? `module` : `fallback`, audio: s2 ? `module` : `fallback` } };
}
var uz = () => {
}, dz = new Promise((e4) => {
  uz = e4;
});
window.__THREE_GAME_TEST_HOOKS__ || (window.__THREE_GAME_TEST_HOOKS__ = { seed: async (e4) => (await dz).seed(e4), setState: async (e4) => (await dz).setState(e4), setPausedForScreenshot: async (e4) => (await dz).setPausedForScreenshot(e4), setReducedMotion: async (e4) => (await dz).setReducedMotion(e4), hideDebugUi: async (e4) => (await dz).hideDebugUi(e4) });
async function fz(e4) {
  let t2 = document.querySelector(`#game-canvas`), n2 = document.querySelector(`#ui-root`);
  if (!t2 || !n2) throw Error(`Missing #game-canvas or #ui-root.`);
  let r2 = await lz(), i2 = new Ug(t2, n2, r2);
  window.__THREE_GAME_TEST_HOOKS__ && uz(window.__THREE_GAME_TEST_HOOKS__), window.__UNHALLOWED__ = { game: i2, sources: r2.sources }, window.claude?.hot?.snapshot?.(() => {
    try {
      i2.saveNow();
    } catch {
    }
    let e5 = i2.session;
    return e5 ? { resume: e5.ch.id, difficulty: e5.diff } : {};
  }), await i2.boot(), pz();
  let a2 = e4 ?? {};
  typeof a2.resume == `string` && i2.resume(a2.resume, typeof a2.difficulty == `string` ? a2.difficulty : `normal`);
}
function pz() {
  let e4 = false;
  try {
    e4 = matchMedia(`(pointer: coarse)`).matches && !matchMedia(`(pointer: fine)`).matches;
  } catch {
  }
  let t2 = window.innerWidth < 760;
  if (!e4 && !t2) return;
  let n2 = document.createElement(`div`);
  n2.className = `device-notice`, n2.setAttribute(`role`, `note`);
  let r2 = document.createElement(`strong`), i2 = document.createElement(`span`);
  e4 ? (r2.textContent = `Best with mouse and keyboard`, i2.textContent = `gametest is built for a desktop browser. Tapping moves and attacks, but skills, panels and hotkeys are made for a mouse and keyboard.`) : (r2.textContent = `Give the game some room`, i2.textContent = `gametest is laid out for a wide window (1280 px or more). Widen this window or go full screen for a readable interface.`);
  let a2 = document.createElement(`button`);
  a2.type = `button`, a2.textContent = `Continue`, a2.addEventListener(`click`, () => n2.remove()), n2.append(r2, i2, a2), document.body.appendChild(n2);
}
function mz(e4) {
  console.error(e4);
  let t2 = document.createElement(`pre`);
  t2.className = `fatal`, t2.textContent = `GAMETEST failed to start.

${e4 instanceof Error ? e4.stack ?? e4.message : String(e4)}`, document.body.appendChild(t2);
}
// [ASHLAR] decode + install the terrain assets and the prop kits (in parallel) before the game starts (never throw; ?ashlar=off skips both, ?kits=off the kits)
await Promise.all([ashlarInstall(), ashlarKitsInstall()]);
var hz = window.claude?.hot;
hz?.ready ? hz.ready((e4) => void fz(e4).catch(mz)) : fz(hz?.data ?? {}).catch(mz);

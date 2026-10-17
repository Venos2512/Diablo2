// Player heroes: barbarian, sorceress, necromancer. Geometry varies with equipped armor / helm (cached templates).
import * as THREE from 'three';
import { G, T, CharacterModel, cachedTemplate, NOISE } from './rig.js';
import { humanoidRig, standardSockets, addHead, addTorso, addArms, addLegs, setSculpt, HUMANOID_CLIPS, humanoidPost, SKIRT_SPRINGS, HAIR_SPRINGS, clipSet } from './humanoid.js';
import { TAU } from '../core/util.js';

export const P_BARB = { hipY: 1.0, spine: 0.1, chest: 0.21, neck: 0.25, headUp: 0.1, shX: 0.235, shY: 0.2, clavX: 0.06, upper: 0.31, fore: 0.27, thighX: 0.11, thigh: 0.45, shin: 0.43 };
export const P_SORC = { hipY: 0.96, spine: 0.1, chest: 0.19, neck: 0.23, headUp: 0.09, shX: 0.17, shY: 0.18, clavX: 0.045, upper: 0.28, fore: 0.25, thighX: 0.09, thigh: 0.44, shin: 0.41 };
export const P_NECRO = { hipY: 0.98, spine: 0.1, chest: 0.21, neck: 0.24, headUp: 0.1, shX: 0.185, shY: 0.19, clavX: 0.05, upper: 0.3, fore: 0.27, thighX: 0.095, thigh: 0.44, shin: 0.42 };

const STY = {
  barbarian: { hunch: 0.04, knee: 0.14, armOut: 0.2, wide: 0.03, breath: 1.2, walk: { amp: 0.42, knee: 0.75, arm: 0.32, lean: 0.06 }, run: { amp: 0.72, knee: 1.35, arm: 0.55, lean: 0.26 } },
  sorceress: { hunch: 0.0, knee: 0.06, armOut: 0.1, breath: 0.9, walk: { amp: 0.38, knee: 0.7, arm: 0.3, lean: 0.03, sway: 0.05 }, run: { amp: 0.66, knee: 1.25, arm: 0.5, lean: 0.2 } },
  necromancer: { hunch: 0.06, knee: 0.08, armOut: 0.09, breath: 0.8, walk: { amp: 0.4, knee: 0.72, arm: 0.25, lean: 0.07 }, run: { amp: 0.68, knee: 1.3, arm: 0.5, lean: 0.24 } },
};
// locomotion clips with stride-matched move speeds
export function locoClips(P, st, walkDur = 1.0, runDur = 0.66) {
  const L = P.thigh + P.shin;
  return {
    walk: Object.assign({}, HUMANOID_CLIPS.walk, { dur: walkDur, moveSpeed: 4 * L * Math.sin(st.walk.amp) / walkDur }),
    run: Object.assign({}, HUMANOID_CLIPS.run, { dur: runDur, moveSpeed: 4 * L * Math.sin(st.run.amp) * 1.35 / runDur }),
  };
}
const HERO_CLIP_NAMES = ['idle', 'walk', 'run', 'attack1', 'attack2', 'attack3', 'cast', 'cast2', 'hit', 'death', 'block', 'leap', 'whirl', 'howl'];

function flip(g) {
  const idx = g.index.array;
  for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return g;
}
// quarter-lathe skirt piece attached to a skirt bone (axis at the hip center)
function skirtQuarter(r, bone, profile, phiCenter, sr, sy, color, o = {}) {
  const ov = o.overlap ?? 0.18;
  const mk = () => G.lathe(profile, o.seg ?? 6, phiCenter - Math.PI / 4 - ov, Math.PI / 2 + ov * 2);
  const off = { skirtF: [0, -sy, -sr], skirtB: [0, -sy, sr], skirtL: [-sr, -sy, 0], skirtR: [sr, -sy, 0] }[bone];
  r.part(bone, T(mk(), off[0], off[1], off[2]), color, Object.assign({ rough: 0.9, v: 0.08 }, o));
  r.part(bone, T(flip(mk()), off[0], off[1], off[2], 0, 0, 0, 0.97, 1, 0.97), o.inner ?? 0x1a1410, { rough: 0.95, v: 0.05 });
}
function skirt(r, profile, color, o = {}) {
  const sr = o.sr ?? 0.12, sy = o.sy ?? -0.02;
  skirtQuarter(r, 'skirtF', profile, 0, sr, sy, color, o);
  skirtQuarter(r, 'skirtL', profile, Math.PI / 2, sr, sy, color, o);
  skirtQuarter(r, 'skirtB', profile, Math.PI, sr, sy, color, o);
  skirtQuarter(r, 'skirtR', profile, Math.PI * 1.5, sr, sy, color, o);
}
// belt ring around hips
function belt(r, y, rx, rz, color, buckle = null, o = {}) {
  r.part('hips', T(G.torus(1, o.th ?? 0.028, 5, 18), 0, y, 0, Math.PI / 2, 0, 0, rx, rz, 1), color, { rough: 0.7, v: 0.05 });
  if (buckle) r.part('hips', T(G.rbox(0.07, 0.06, 0.03, 0.012), 0, y, rz + 0.01), buckle, { rough: 0.35, metal: 0.85, v: 0 });
}
function hood(r, P, color, o = {}) {
  const hr = (o.hr ?? 0.112) * 1.32, c = 0.075;
  const mk = () => G.shell(hr, Math.PI / 2 + 0.75, TAU - 1.5, 0, 2.15, 14, 9);
  r.part('head', T(mk(), 0, c + 0.02, -0.01, 0, 0, 0, 1, 1.08, 1.12), color, { rough: 0.95, v: 0.1 });
  r.part('head', T(flip(mk()), 0, c + 0.02, -0.01, 0, 0, 0, 0.95, 1.03, 1.07), 0x0a0908, { rough: 1 });
  // drape on shoulders
  r.part('chest', T(G.lathe([[0.23, 0.18], [0.2, 0.3], [0.12, 0.4], [0.08, 0.44]], 12), 0, 0, -0.01).scale(1, 1, 0.75), color, { rough: 0.95, v: 0.1 });
}
function pauldron(r, s, k, color, o = {}) {
  const rad = o.r ?? 0.1;
  r.part('upperArm' + s, T(G.shell(rad, 0, TAU, 0, 1.45, 12, 6), 0, 0.03, 0, 0, 0, -k * 0.35, 1.15, 0.85, 1.05), color, { rough: o.rough ?? 0.45, metal: o.metal ?? 0.7, v: 0.06 });
  if (o.layers) for (let i = 1; i <= o.layers; i++) r.part('upperArm' + s, T(G.shell(rad * (1 - i * 0.08), 0, TAU, 0.9, 0.7, 12, 3), 0, 0.03 - i * 0.05, 0, 0, 0, -k * 0.35, 1.18, 0.9, 1.08), color, { rough: o.rough ?? 0.45, metal: o.metal ?? 0.7 });
  if (o.spikes) for (let i = 0; i < o.spikes; i++) {
    const a = (i / Math.max(1, o.spikes - 1) - 0.5) * 1.2;
    r.part('upperArm' + s, T(G.cone(0.022, o.spikeLen ?? 0.11, 5), k * 0.05 + Math.sin(a) * 0.02, 0.1, Math.sin(a) * 0.07, Math.sin(a) * 0.4, 0, -k * 0.5), o.spikeColor ?? color, { rough: 0.4, metal: 0.6 });
  }
  if (o.trim) r.part('upperArm' + s, T(G.torus(rad * 1.05, 0.011, 4, 16), 0, 0.0, 0, Math.PI / 2, 0, -k * 0.35, 1.12, 1.02, 1), o.trim, { rough: 0.3, metal: 0.9 });
}

// ------------------------------------------------------------------ armor overlays
const ARMOR_DEF = { cloth: 0x6b5a44, leather: 0x6a4428, chain: 0x8a8d92, plate: 0x9ea2a8, robe: 0x40365a };
function armorKey(a) { return a ? `${a.kind}.${a.tier ?? 0}.${(a.color ?? ARMOR_DEF[a.kind] ?? 0).toString(16)}` : 'none'; }
function addArmor(r, P, cls, a, wScale) {
  if (!a) return;
  const tier = a.tier ?? 0, base = a.color ?? ARMOR_DEF[a.kind] ?? 0x888888;
  const trim = tier >= 3 ? 0xc9a24e : tier >= 1 ? 0x9a9a9a : null;
  const w = wScale * 1.06;
  const shellChest = (color, o) => {
    const prof = [[0.16 * w, -0.02], [0.19 * w, 0.1], [0.215 * w, 0.22], [0.205 * w, 0.3], [0.135 * w, 0.37], [0.075, 0.405]];
    const g = G.lathe(prof, 14); g.scale(1, 1, 0.74);
    r.part('chest', g, color, o);
    const sp = G.lathe([[0.15 * w, -0.05], [0.16 * w, 0.06], [0.165 * w, 0.17]], 14); sp.scale(1, 1, 0.82);
    r.part('spine', sp, color, o);
  };
  switch (a.kind) {
    case 'plate': {
      shellChest(base, { rough: 0.38, metal: 0.85, v: 0.04 });
      r.part('chest', T(G.ell(0.13 * w, 0.12, 0.05, 10, 6), 0, 0.2, 0.135), base, { rough: 0.32, metal: 0.9, v: 0.03 }); // breast ridge
      r.part('chest', T(G.cyl(0.085, 0.11, 0.08, 12), 0, 0.395, -0.005), base, { rough: 0.4, metal: 0.85 }); // gorget
      r.sides((s, k) => pauldron(r, s, k, base, { r: 0.12, layers: 2, spikes: tier >= 2 ? 3 : 0, spikeLen: 0.09 + tier * 0.02, trim, rough: 0.38, metal: 0.85 }));
      r.sides((s, k) => r.part('foreArm' + s, T(G.cyl(0.058, 0.05, 0.17, 10), 0, -0.17, 0), base, { rough: 0.4, metal: 0.85 }));
      // tassets
      r.sides((s, k) => r.part('thigh' + s, T(G.shell(0.11, 0, TAU, 0.2, 0.9, 10, 4), 0, 0.02, 0.0, 0, 0, 0, 1.0, 1.6, 1.05), base, { rough: 0.4, metal: 0.85 }));
      if (trim) { r.part('chest', T(G.torus(0.2 * w, 0.012, 4, 20), 0, 0.29, 0, Math.PI / 2, 0, 0, 1, 0.74, 1), trim, { rough: 0.3, metal: 0.9 }); r.part('spine', T(G.torus(0.165 * w, 0.014, 4, 20), 0, -0.04, 0, Math.PI / 2, 0, 0, 1, 0.82, 1), trim, { rough: 0.3, metal: 0.9 }); }
      if (tier >= 4) r.part('chest', T(G.ell(0.03, 0.045, 0.012, 8, 6), 0, 0.2, 0.19), 0xff6a2a, { emis: 3.5, rough: 0.3 });
      break;
    }
    case 'chain': {
      const ring = (x, y, z, c) => { const n = Math.sin(x * 260) * Math.sin(y * 260) * 0.5 + 0.5; c.set(base).multiplyScalar(0.7 + n * 0.45); };
      shellChest(ring, { rough: 0.55, metal: 0.8, v: 0 });
      r.sides((s, k) => r.part('upperArm' + s, T(G.limb(0.08, 0.07, 0.2, 10), 0, 0, 0), ring, { rough: 0.55, metal: 0.8, v: 0 }));
      skirt(r, [[0.25, -0.34], [0.2, -0.12], [0.165, 0.0]], ring, { rough: 0.55, metal: 0.8, v: 0, sr: 0.12 });
      r.part('chest', T(G.cyl(0.09, 0.13, 0.1, 12), 0, 0.39, 0), ring, { rough: 0.55, metal: 0.8 });
      if (trim) r.sides((s, k) => pauldron(r, s, k, 0x6a4a30, { r: 0.1, rough: 0.7, metal: 0.1, trim }));
      break;
    }
    case 'leather': {
      shellChest(base, { rough: 0.7, v: 0.12, grad: [0, 0.4, 0.85, 1.05] });
      r.sides((s, k) => pauldron(r, s, k, base, { r: 0.098, rough: 0.68, metal: 0.05, layers: tier >= 2 ? 1 : 0, trim }));
      r.part('chest', T(G.box(0.05, 0.42, 0.02), 0, 0.18, 0.15, 0, 0, 0.6), 0x2a1a10, { rough: 0.6 }); // strap
      for (let i = 0; i < 3 + tier; i++) r.part('chest', T(G.sphere(0.012, 5, 4), -0.09 + i * 0.05, 0.08 + i * 0.065, 0.15), 0xa0a0a0, { rough: 0.3, metal: 0.9 });
      break;
    }
    case 'cloth': {
      const quilt = (x, y, z, c) => { const n = (Math.sin(y * 70) > 0.6 ? 0.82 : 1); c.set(base).multiplyScalar(n); };
      shellChest(quilt, { rough: 0.95, v: 0.06 });
      break;
    }
    case 'robe': {
      shellChest(base, { rough: 0.9, v: 0.08 });
      skirt(r, [[0.36, -0.92], [0.28, -0.5], [0.2, -0.15], [0.165, 0.0]], base, { rough: 0.9, sr: 0.12, seg: 7 });
      r.sides((s, k) => r.part('foreArm' + s, T(G.lathe([[0.1, -0.24], [0.07, -0.05], [0.06, 0.02]], 10), 0, 0, 0), base, { rough: 0.9 }));
      if (trim) r.part('chest', T(G.box(0.05, 0.38, 0.015), 0, 0.17, 0.142), trim, { rough: 0.4, metal: 0.7 });
      break;
    }
  }
}

// ------------------------------------------------------------------ class builders (sculpted bodies + rigid gear)
const headPt = (r, x, y, z, onJaw) => { const J = onJaw && r.idx.jaw !== undefined ? r.defs[r.idx.jaw].pos : null; return J ? [x - J.x, y - J.y, z - J.z] : [x, y, z]; };
const HC = 0.075; // head center height in head-bone space
function barbarian(r, P, eq) {
  const skin = 0xa8714f, paintC = 0x26355a, fur = 0x8a7357, leather = 0x5a3a22, dark = 0x352215, hair = 0x2a1a10;
  const sk = new THREE.Color(skin), pc = new THREE.Color(paintC);
  const armPaint = (x, y, z, c) => { const st = Math.sin(y * 46 + x * 9); c.copy(st > 0.62 && y > -0.22 ? pc : sk); };
  const chestPaint = (x, y, z, c) => { const t = y - x * 0.7; c.copy(z > 0.02 && Math.abs(t - 0.2) < 0.018 ? pc : sk); };
  addTorso(r, { w: 1.15, d: 1.05, muscle: 1, chest: chestPaint, belly: skin, pelvis: leather, rough: 0.6 });
  addHead(r, { skin, r: 0.12, browH: 1.5, jawW: 1.15, nose: 1.15, neckR: 0.07, brow: 0x986246 });
  const Hh = { group: 'head', rough: 0.95, v: 0.14, f: 40 };
  if (!eq.helm) {
    r.blob('head', { t: 'ell', c: [0, HC + 0.052, -0.03], r: [0.087, 0.07, 0.1] }, new THREE.Color(hair).lerp(sk, 0.3), { ...Hh, group: 'hair', k: 0.008, prio: 1, bump: [0.0012, 220] }); // shaved scalp
    r.blob('head', { t: 'cap', a: [0, 0.19, -0.05], b: [0, 0.29, -0.1], r0: 0.033, r1: 0.016 }, hair, { ...Hh, group: 'hair', k: 0.03, bump: [0.004, 90, 20, 90] }); // topknot
    r.part('head', T(G.torus(0.033, 0.009, 5, 12), 0, 0.205, -0.055, Math.PI / 2 - 0.45, 0, 0), 0x9a7a40, { rough: 0.35, metal: 0.85 });
  }
  // beard (jaw) + moustache
  r.blob('jaw', { t: 'ell', c: headPt(r, 0, HC - 0.088, 0.064, true), r: [0.066, 0.056, 0.052] }, hair, { ...Hh, k: 0.012, prio: 1, bump: [0.003, 70, 25, 70] });
  r.blob('head', { t: 'ell', c: [0, HC - 0.043, 0.108], r: [0.034, 0.009, 0.014], rot: [0, 0, 0] }, hair, { ...Hh, k: 0.006, prio: 2, bump: [0.0015, 120] });
  addArms(r, { t: 1.26, muscle: 1, skin, upper: armPaint, fore: skin, hand: 0x8a5e44, rough: 0.6 });
  r.sides((s, k) => {
    r.blob('foreArm' + s, { t: 'cap', a: [0, -0.1, 0], b: [0, -0.245, 0], r0: 0.059, r1: 0.05 }, leather, { rough: 0.7, v: 0.12, k: 0.008, prio: 2 });
    r.part('foreArm' + s, T(G.torus(0.06, 0.008, 4, 14), 0, -0.105, 0, Math.PI / 2, 0, 0), 0x8a8070, { rough: 0.35, metal: 0.85 });
    r.part('foreArm' + s, T(G.torus(0.052, 0.007, 4, 14), 0, -0.24, 0, Math.PI / 2, 0, 0), 0x8a8070, { rough: 0.35, metal: 0.85 });
  });
  addLegs(r, { t: 1.14, legs: 0x3b2a1b, boot: dark, bootTop: fur, bootTopBump: [0.012, 22] });
  // fur mantle: ring of matted fur over the shoulders + pads over the clavicles
  const furCol = (x, y, z, c) => { c.set(fur).multiplyScalar(0.72 + 0.4 * Math.max(0, Math.min(1, (y - 0.15) * 6))); };
  r.blob('chest', { t: 'tor', c: [0, P.neck - 0.035, -0.012], R: 0.162, r: 0.062, rot: [0.08, 0, 0] }, furCol, { group: 'fur', rough: 0.98, v: 0.22, f: 22, k: 0.03, bump: [0.011, 15, 9, 15] });
  r.sides((s, k) => r.blob('clav' + s, { t: 'ell', c: [k * 0.13, 0.03, -0.012], r: [0.118, 0.072, 0.108] }, furCol, { group: 'fur', rough: 0.98, v: 0.22, f: 22, k: 0.04, bump: [0.011, 15, 9, 15] }));
  // leather harness across the chest
  r.blob('chest', { t: 'box', c: [0.0, 0.17, 0.112], s: [0.026, 0.27, 0.012], r: 0.008, rot: [0.12, 0, -0.62] }, dark, { rough: 0.6, k: 0.012, prio: 2 });
  r.part('chest', T(G.cyl(0.026, 0.026, 0.012, 12), -0.055, 0.22, 0.158, Math.PI / 2 - 0.2, 0, 0), 0x9a8a60, { rough: 0.3, metal: 0.9 });
  belt(r, 0.02, 0.18, 0.15, dark, 0x9a8a60, { th: 0.035 });
  skirt(r, [[0.235, -0.4], [0.205, -0.2], [0.172, 0.0]], (x, y, z, c) => { c.set(Math.sin(Math.atan2(x, z) * 9) > 0.7 ? 0x2a1a10 : leather); }, { rough: 0.8, sr: 0.12, seg: 8, v: 0.1 });
}

function sorceress(r, P, eq) {
  const skin = 0xe2b89c, robe = 0x4c2b7e, robeD = 0x2e1a52, gold = 0xc49a4a, sash = 0x8a1c2a, hair = 0x3c1626;
  const sk = new THREE.Color(skin), rb = new THREE.Color(robe), gd = new THREE.Color(gold);
  const bodice = (x, y, z, c) => {
    const neck = 0.255 + 0.035 * Math.cos(x * 9) - (z < 0 ? 0.03 : 0);
    if (y > neck) { c.copy(sk); return; }
    c.copy(rb).multiplyScalar(0.85 + 0.25 * (y / 0.3));
    if (Math.abs(y - neck + 0.012) < 0.008) c.copy(gd); // gold trim at the neckline
    if (z > 0.06 && Math.abs(x) < 0.006 && y < neck - 0.03) c.copy(gd).multiplyScalar(0.8); // lacing
  };
  addTorso(r, { w: 0.9, d: 0.92, muscle: 0.12, bust: 1.0, chest: bodice, belly: robe, pelvis: robe, rough: 0.75 });
  addHead(r, { skin, r: 0.104, female: true, nose: 0.72, eyeSize: 1.14, jawW: 0.8, neckR: 0.043, socket: new THREE.Color(skin).multiplyScalar(0.84), eyes: 0x2a1c2a, lips: 0xa84a4c, browH: 0.2 });
  const Hh = { group: 'hair', rough: 0.72, v: 0.12, f: 50 };
  if (!eq.helm) {
    r.blob('head', { t: 'ell', c: [0, HC + 0.032, -0.022], r: [0.09, 0.096, 0.108] }, hair, { ...Hh, k: 0.012, prio: 1, bump: [0.0025, 160, 30, 160] }); // hair volume
    r.sides((s, k) => r.blob('head', { t: 'cap', a: [k * 0.075, HC + 0.03, 0.03], b: [k * 0.08, HC - 0.075, 0.035], r0: 0.025, r1: 0.016 }, hair, { ...Hh, k: 0.02, bump: [0.003, 140, 20, 140] })); // side locks
    r.blob('head', { t: 'ell', c: [0, HC + 0.07, 0.065], r: [0.07, 0.03, 0.04], rot: [0.5, 0, 0] }, hair, { ...Hh, k: 0.018, prio: 1, bump: [0.002, 160, 40, 160] }); // swept bangs
    r.part('head', T(G.torus(0.086, 0.0045, 4, 26), 0, HC + 0.045, -0.006, Math.PI / 2 + 0.24, 0, 0, 1, 1.12, 1), gold, { rough: 0.25, metal: 0.95 });
    r.part('head', T(G.ell(0.008, 0.011, 0.006, 8, 6), 0, HC + 0.068, 0.088, 0.24, 0, 0), 0x7cc6ff, { emis: 1.3, rough: 0.2 });
  }
  // long hair fall on spring bones
  r.blob('hair1', { t: 'cap', a: [0, 0.02, 0.0], b: [0, -0.2, -0.01], r0: 0.07, r1: 0.05 }, hair, { group: 'head', rough: 0.72, v: 0.12, f: 50, k: 0.03, bump: [0.004, 150, 15, 150] });
  r.blob('hair2', { t: 'cap', a: [0, 0.0, 0.0], b: [0, -0.2, 0.0], r0: 0.05, r1: 0.022 }, hair, { group: 'head', rough: 0.72, v: 0.12, f: 50, k: 0.03, bump: [0.004, 150, 15, 150] }); // (head group: always present, hangs below helms)
  addArms(r, { t: 0.8, muscle: 0.1, skin, upper: skin, fore: skin, hand: skin, rough: 0.55 });
  r.sides((s, k) => {
    r.part('foreArm' + s, T(G.cyl(0.044, 0.038, 0.11, 12), 0, -0.19, 0), gold, { rough: 0.3, metal: 0.9 });
    r.part('upperArm' + s, T(G.torus(0.054, 0.007, 4, 14), 0, -0.1, 0, Math.PI / 2, 0, 0), gold, { rough: 0.3, metal: 0.9 });
  });
  addLegs(r, { t: 0.84, legs: robeD, boot: 0x2a1a24 });
  // high back collar
  const CL = 3.3; // collar arc length, centered behind the neck
  r.part('chest', T(G.lathe([[0.095, 0.3], [0.125, 0.37], [0.175, 0.43]], 16, Math.PI - CL / 2, CL), 0, 0, -0.03), robeD, { rough: 0.8 });
  r.part('chest', T(flip(G.lathe([[0.091, 0.3], [0.121, 0.37], [0.171, 0.43]], 16, Math.PI - CL / 2, CL)), 0, 0, -0.03), 0x150c22, { rough: 0.9 });
  // flowing skirt + sash
  skirt(r, [[0.3, -0.92], [0.255, -0.62], [0.2, -0.3], [0.158, 0.0]], (x, y, z, c) => { c.set(y < -0.88 ? gold : robe).multiplyScalar(0.78 + 0.22 * (1 + y)); }, { rough: 0.85, sr: 0.12, seg: 8 });
  belt(r, 0.03, 0.158, 0.125, sash, gold, { th: 0.028 });
  r.part('skirtF', T(G.panel(0.06, 0.45, 0.012, 0.01), 0.05, -0.04, 0.035), sash, { rough: 0.7 });
}

function necromancer(r, P, eq) {
  const skin = 0xcfc8ba, tunic = 0x34403a, leather = 0x2a2622, bone = 0xd2cbb2, hoodC = 0x262c29, hair = 0xd8d6cc;
  addTorso(r, { w: 0.96, d: 0.95, muscle: 0.15, chest: tunic, belly: tunic, pelvis: leather, rough: 0.85 });
  // bone ribcage armor + sternum
  for (let i = 0; i < 4; i++) {
    const y = 0.11 + i * 0.055, rr = 0.165 - i * 0.002;
    r.part('chest', T(G.torus(rr, 0.011, 5, 16, Math.PI * 0.78), 0, y, 0.004, Math.PI / 2, 0, Math.PI * 0.11, 1, 0.72, 1), bone, { rough: 0.6, v: 0.1 });
  }
  r.part('chest', T(G.rbox(0.032, 0.25, 0.026, 0.01), 0, 0.19, 0.118), bone, { rough: 0.6 });
  // tall collar
  const NL = 3.6; // collar arc centered behind the neck
  r.part('chest', T(G.lathe([[0.1, 0.31], [0.135, 0.4], [0.185, 0.48]], 16, Math.PI - NL / 2, NL), 0, 0, -0.035), leather, { rough: 0.75, v: 0.1 });
  r.part('chest', T(flip(G.lathe([[0.095, 0.31], [0.13, 0.4], [0.18, 0.48]], 16, Math.PI - NL / 2, NL)), 0, 0, -0.035), 0x0c0d0c, { rough: 1 });
  addHead(r, { skin, r: 0.108, gaunt: 1, browH: 1.2, nose: 1.1, eyes: 0x2f6a46, eyeGlow: 0.5, brow: 0xa9a294 });
  r.part('chest', T(G.ell(0.017, 0.024, 0.01, 8, 6), 0, 0.27, 0.122), 0x5aff8a, { emis: 1.4, rough: 0.2 }); // soul gem
  if (!eq.helm) {
    // sculpted hood (its own layer so the carving never touches the face)
    const Hd = { group: 'hood', rough: 0.95, v: 0.1, f: 12, k: 0.02 };
    r.blob('head', { t: 'ell', c: [0, HC + 0.03, -0.02], r: [0.125, 0.135, 0.14] }, hoodC, Hd);
    r.blob('head', { t: 'cap', a: [0, HC + 0.05, -0.1], b: [0, HC - 0.06, -0.2], r0: 0.07, r1: 0.03 }, hoodC, Hd); // peak drape
    r.blob('neck', { t: 'cap', a: [0, -0.05, -0.02], b: [0, 0.09, -0.01], r0: 0.13, r1: 0.1 }, hoodC, { ...Hd, k: 0.05 }); // cowl
    r.blob('head', { t: 'ell', c: [0, HC + 0.01, 0.0], r: [0.104, 0.118, 0.122] }, 0x0b0c0b, { ...Hd, sub: true, k: 0.01 }); // inner cavity
    r.blob('neck', { t: 'cap', a: [0, -0.1, 0.0], b: [0, 0.1, 0.0], r0: 0.08, r1: 0.07 }, 0x0b0c0b, { ...Hd, sub: true, k: 0.01 });
    r.blob('head', { t: 'ell', c: [0, HC - 0.01, 0.12], r: [0.085, 0.12, 0.08] }, 0x0b0c0b, { ...Hd, sub: true, k: 0.012 }); // face opening
  } else {
    r.blob('head', { t: 'ell', c: [0, HC + 0.04, -0.02], r: [0.088, 0.09, 0.105] }, hair, { group: 'hair', rough: 0.85, v: 0.08, f: 40, k: 0.012, prio: 1, bump: [0.002, 160, 30, 160] });
  }
  addArms(r, { t: 0.92, muscle: 0.15, skin, upper: tunic, fore: tunic, hand: skin, rough: 0.8 });
  r.sides((s, k) => {
    // skull pauldron (own layer: carved eye sockets & teeth)
    const L = { group: 'bone', rough: 0.55, v: 0.1, f: 20, k: 0.012 };
    r.blob('upperArm' + s, { t: 'ell', c: [k * 0.02, 0.035, 0.0], r: [0.085, 0.075, 0.1], rot: [0, 0, -k * 0.35] }, bone, L);
    r.blob('upperArm' + s, { t: 'ell', c: [k * 0.02, -0.015, 0.075], r: [0.05, 0.03, 0.04] }, bone, L); // maxilla
    r.sides((e, j) => r.blob('upperArm' + s, { t: 'ell', c: [k * 0.02 + j * 0.03, 0.03, 0.09], r: [0.02, 0.022, 0.03] }, 0x0b0a08, { ...L, sub: true, k: 0.006 }));
    r.blob('upperArm' + s, { t: 'ell', c: [k * 0.02, 0.005, 0.105], r: [0.008, 0.012, 0.02] }, 0x0b0a08, { ...L, sub: true, k: 0.004 }); // nasal cavity
    for (let i = 0; i < 3; i++) r.part('upperArm' + s, T(G.cone(0.018, 0.12, 5), k * (0.04 + i * 0.012), 0.09 - i * 0.02, -0.03 - i * 0.035, -0.5 - i * 0.2, 0, -k * 0.7), bone, { rough: 0.55 });
    r.blob('foreArm' + s, { t: 'cap', a: [0, -0.09, 0], b: [0, -0.24, 0], r0: 0.052, r1: 0.045 }, leather, { rough: 0.7, v: 0.1, k: 0.008, prio: 2 });
    for (let i = 0; i < 3; i++) r.part('foreArm' + s, T(G.cone(0.012, 0.06, 4), k * 0.05, -0.1 - i * 0.05, -0.02, 0, 0, -k * 1.3), bone, { rough: 0.6 });
  });
  addLegs(r, { t: 0.95, legs: 0x1e2220, boot: leather, bootTop: leather });
  belt(r, 0.02, 0.165, 0.135, leather, null, { th: 0.03 });
  for (let i = 0; i < 3; i++) { const a = -0.7 + i * 0.7; r.part('hips', T(G.ell(0.03, 0.034, 0.032, 8, 6), Math.sin(a) * 0.168, -0.0, Math.cos(a) * 0.142), bone, { rough: 0.6 }); }
  skirt(r, [[0.25, -0.78], [0.21, -0.4], [0.165, 0.0]], (x, y, z, c) => { c.set(tunic).multiplyScalar(0.7 + 0.3 * (1 + y)); if (y < -0.6 && Math.sin(Math.atan2(x, z) * 13) > 0.3) c.multiplyScalar(0.5); }, { rough: 0.95, sr: 0.12, seg: 8 });
}

const CAPES = {
  barbarian: { bone: 'chest', a0: [0.2, 0.36, -0.13], a1: [-0.2, 0.36, -0.13], width: 0.42, length: 0.78, cols: 6, rows: 7, color: 0x4a3b2e, rough: 0.98, taper: -0.2, tatter: true },
  necromancer: { bone: 'chest', a0: [0.17, 0.35, -0.12], a1: [-0.17, 0.35, -0.12], width: 0.36, length: 1.05, cols: 6, rows: 8, color: 0x2a312c, rough: 0.9, taper: -0.45, tatter: true },
};

function buildHero(cls, eq) {
  const P = cls === 'barbarian' ? P_BARB : cls === 'sorceress' ? P_SORC : P_NECRO;
  const r = humanoidRig(P, { jaw: [0.0, 0.03], skirt: { r: 0.12, y: -0.02 }, hair: cls === 'sorceress' ? [0.06, -0.09, 0.26] : null });
  setSculpt(r, { key: `hero:${cls}`, tris: 12000, groups: { head: { voxel: 0.0068, tris: 4200 }, hair: { voxel: 0.007, tris: 2400 }, fur: { voxel: 0.0095, tris: 4200 }, hood: { voxel: 0.01, tris: 2400 }, bone: { voxel: 0.008, tris: 1600 } } });
  standardSockets(r, P);
  if (cls === 'barbarian') barbarian(r, P, eq);
  else if (cls === 'sorceress') sorceress(r, P, eq);
  else necromancer(r, P, eq);
  addArmor(r, P, cls, eq.armor, cls === 'barbarian' ? 1.12 : cls === 'sorceress' ? 0.92 : 0.98);
  const st = STY[cls];
  const clips = clipSet(HERO_CLIP_NAMES, locoClips(P, st));
  const height = P.hipY + P.spine + P.chest + P.neck + P.headUp + 0.2;
  const cape = CAPES[cls] ? Object.assign({ body: [{ bone: 'chest', x: 0, y: 0.18, z: 0.0, r: 0.2 }, { bone: 'hips', x: 0, y: -0.05, z: 0.0, r: 0.2 }, { bone: 'spine', x: 0, y: 0.05, z: 0.0, r: 0.19 }] }, CAPES[cls]) : null;
  return r.template({
    kind: 'hero_' + cls, cls, height, radius: 0.38, P, style: st, clips, runAt: 3.0, post: humanoidPost,
    springs: cls === 'sorceress' ? [...SKIRT_SPRINGS, ...HAIR_SPRINGS] : SKIRT_SPRINGS, cape,
    weaponKind: 'none', variant: (e) => heroTemplate(cls, e),
  });
}
export function heroTemplate(cls, eq = {}) {
  return cachedTemplate(`hero:${cls}:${armorKey(eq.armor)}:${eq.helm ? 'h' : 'n'}`, () => buildHero(cls, eq));
}
export function createHero(cls, opts = {}) {
  if (!['barbarian', 'sorceress', 'necromancer'].includes(cls)) cls = 'barbarian';
  const tpl = heroTemplate(cls, { armor: null, helm: false });
  return new CharacterModel(tpl, opts);
}
export { STY as HERO_STYLES };

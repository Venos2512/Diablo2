// Town NPCs: healer (Mother Ysolde), smith (Bram), sage (Elder Aldous), peddler (Vesk), captain (Merra), villager.
import * as THREE from 'three';
import { G, T, CharacterModel, cachedTemplate, NOISE } from './rig.js';
import { humanoidRig, standardSockets, addHead, addTorso, addArms, addLegs, addHair, addBeard, setSculpt, humanoidPost, clipSet, SKIRT_SPRINGS, HAIR_SPRINGS } from './humanoid.js';
import { locoClips, P_BARB, P_SORC, P_NECRO } from './heroes.js';
import { TAU } from '../core/util.js';

const HAND = [0, -0.065, 0.012, Math.PI / 2 - 0.25, 0, 0];
const inHand = (g) => T(g, HAND[0], HAND[1], HAND[2], HAND[3], 0, 0);
function flip(g) {
  const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); return g;
}
function robe(r, profile, color, o = {}) {
  const sr = 0.12;
  for (const [b, ph] of [['skirtF', 0], ['skirtL', Math.PI / 2], ['skirtB', Math.PI], ['skirtR', Math.PI * 1.5]]) {
    const off = { skirtF: [0, 0.02, -sr], skirtB: [0, 0.02, sr], skirtL: [-sr, 0.02, 0], skirtR: [sr, 0.02, 0] }[b];
    const mk = () => G.lathe(profile, 6, ph - Math.PI / 4 - 0.16, Math.PI / 2 + 0.32);
    r.part(b, T(mk(), ...off), color, Object.assign({ rough: 0.92, v: 0.1 }, o));
    r.part(b, T(flip(mk()), ...off, 0, 0, 0, 0.97, 1, 0.97), 0x1a1410, { rough: 1 });
  }
}
function belt(r, y, rx, rz, color, th = 0.028) { r.part('hips', T(G.torus(1, th, 5, 18), 0, y, 0, Math.PI / 2, 0, 0, rx, rz, 1), color, { rough: 0.7 }); }
function woodStaff(r, top, topEmis = 0) {
  r.part('handR', inHand(T(G.cyl(0.02, 0.026, 1.7, 6), 0, 0.4, 0)), 0x5a3e22, { rough: 0.85, bump: [0.005, 22] });
  if (top) r.part('handR', inHand(T(G.ico(0.045, 0), 0, 1.27, 0)), top, { rough: 0.3, emis: topEmis, flat: true });
}
const NPC_STYLE = (o = {}) => Object.assign({ hunch: 0.04, knee: 0.08, armOut: 0.1, breath: 1, look: 1.4, walk: { amp: 0.38, knee: 0.7, arm: 0.3, lean: 0.04 }, run: { amp: 0.65, knee: 1.25, arm: 0.5, lean: 0.2 } }, o);
const NAMES = ['idle', 'walk', 'run', 'talk', 'work', 'hit', 'cast'];

function build(kind, v) {
  let P = P_NECRO, style = NPC_STYLE(), weaponKind = 'none', cape = null, springs = SKIRT_SPRINGS, extraRig = { jaw: [0, 0.03], skirt: { r: 0.12, y: -0.02 } };
  if (kind === 'healer') { P = P_SORC; style = NPC_STYLE({ hunch: 0.14 }); }
  if (kind === 'smith') { P = P_BARB; style = NPC_STYLE({ hunch: 0.06, armOut: 0.18, knee: 0.12, wide: 0.03 }); }
  if (kind === 'sage') style = NPC_STYLE({ hunch: 0.24 });
  if (kind === 'peddler') style = NPC_STYLE({ hunch: 0.2 });
  if (kind === 'captain') { P = Object.assign({}, P_SORC, { shX: 0.19 }); extraRig.hair = [0.07, -0.1, 0.24]; springs = [...SKIRT_SPRINGS, ...HAIR_SPRINGS]; }
  const r = humanoidRig(P, extraRig);
  setSculpt(r, { key: `npc:${kind}:${v}`, voxel: 0.013, tris: 9000, groups: { head: { voxel: 0.0075, tris: 3200 }, cloth: { voxel: 0.011, tris: 2400 }, hood: { voxel: 0.011, tris: 2000 } } });
  standardSockets(r, P);
  switch (kind) {
    case 'healer': {
      const skin = 0xd0a080, green = 0x4c5c3a, shawl = 0xb8ab8a;
      addTorso(r, { w: 0.95, muscle: 0.1, bust: 0.9, gut: 0.2, chest: green, belly: green, pelvis: green });
      addHead(r, { skin, r: 0.104, female: true, gaunt: 0.3, nose: 0.9, neckR: 0.046, lips: 0x9a5a50 });
      addHair(r, 'bun', 0xb0aca4, { r: 0.104 });
      // knitted shawl draped over the shoulders (soft cloth layer)
      r.blob('chest', { t: 'tor', c: [0, P.neck - 0.045, -0.01], R: 0.15, r: 0.05, rot: [0.15, 0, 0] }, shawl, { group: 'cloth', rough: 0.98, v: 0.12, f: 30, k: 0.04, bump: [0.003, 60, 20, 60] });
      r.sides((sd, k) => r.blob('clav' + sd, { t: 'ell', c: [k * 0.1, 0.0, 0.0], r: [0.1, 0.06, 0.1] }, shawl, { group: 'cloth', rough: 0.98, v: 0.12, f: 30, k: 0.05, bump: [0.003, 60, 20, 60] }));
      r.blob('chest', { t: 'ell', c: [0, 0.2, 0.09], r: [0.06, 0.08, 0.03] }, shawl, { group: 'cloth', rough: 0.98, k: 0.05 }); // shawl front knot
      addArms(r, { t: 0.85, muscle: 0.05, skin, upper: green, fore: shawl, hand: skin });
      addLegs(r, { t: 0.85, legs: green, boot: 0x3a2a1c });
      robe(r, [[0.32, -0.92], [0.27, -0.6], [0.21, -0.28], [0.165, 0.0]], green);
      belt(r, 0.03, 0.17, 0.14, 0x4a3420);
      r.part('hips', T(G.rbox(0.07, 0.08, 0.05, 0.015), 0.15, -0.04, 0.08), 0x5a4028, { rough: 0.8 });
      r.part('hips', T(G.cyl(0.035, 0.04, 0.09, 6), -0.19, -0.12, 0.03), 0x2a2420, { rough: 0.5, metal: 0.7 });
      r.part('hips', T(G.sphere(0.03, 6, 5), -0.19, -0.12, 0.03), 0xffb050, { emis: 2.5, v: 0 });
      woodStaff(r, 0x8ad06a, 0.4); weaponKind = 'staff';
      r.part('handR', inHand(T(G.ell(0.06, 0.08, 0.06, 6, 5), 0, 1.2, 0)), 0x5a7a3a, { rough: 0.9, bump: [0.015, 20] }); // herb bundle
      break;
    }
    case 'smith': {
      const skin = 0xb07a58, shirt = 0x7a7468, apron = 0x5a3a22;
      const soot = (base) => (x, y, z, c) => { c.set(base); if (NOISE.noise3(x * 12, y * 12, z * 12) > 0.45) c.multiplyScalar(0.55); };
      const apronFront = (x, y, z, c) => { if (z > 0.05 && Math.abs(x) < 0.15 + y * 0.12 && y < 0.3) c.set(apron).multiplyScalar(0.9 + NOISE.noise3(x * 20, y * 20, 1) * 0.1); else soot(shirt)(x, y, z, c); };
      addTorso(r, { w: 1.14, d: 1.08, muscle: 0.8, gut: 0.4, chest: apronFront, belly: (x, y, z, c) => { if (z > 0.03) c.set(apron); else soot(shirt)(x, y, z, c); }, pelvis: 0x3a3028 });
      addHead(r, { skin, r: 0.12, browH: 1.3, jawW: 1.1, nose: 1.2, brow: 0x8a5a40, neckR: 0.07 });
      addHair(r, 'fringe', 0x4a2a14, { r: 0.12 });
      addBeard(r, 'full', 0x5a3418, { r: 0.12 });
      addArms(r, { t: 1.2, muscle: 0.9, skin, upper: soot(shirt), fore: skin, hand: 0x8a5a40 });
      r.sides((sd, k) => r.part('upperArm' + sd, T(G.torus(0.068, 0.022, 5, 12), 0, -0.27, 0, Math.PI / 2, 0, 0), shirt, { rough: 0.95 })); // rolled sleeves
      addLegs(r, { t: 1.1, legs: 0x3a3028, boot: 0x2a1c12 });
      r.part('skirtF', T(G.panel(0.34, 0.55, 0.02, 0.05), 0, 0.02, 0.05), apron, { rough: 0.75, v: 0.15 });
      belt(r, 0.03, 0.19, 0.16, 0x2a1a10, 0.03);
      hammerIn(r); weaponKind = '1h';
      break;
    }
    case 'sage': {
      const skin = 0xc89a7a, robeC = 0x3a4a62, trim = 0xb89a5a;
      const robeTrim = (x, y, z, c) => { c.set(z > 0.05 && Math.abs(x) < 0.022 ? trim : robeC); };
      addTorso(r, { w: 0.98, muscle: 0.05, chest: robeTrim, belly: robeTrim, pelvis: robeC });
      addHead(r, { skin, r: 0.11, gaunt: 0.5, browH: 1.2, nose: 1.25, brow: 0xd0d0d0 });
      addHair(r, 'fringe', 0xdcdcd8, { r: 0.11 });
      addBeard(r, 'long', 0xdcdcd8, { r: 0.11 });
      r.blob('head', { t: 'ell', c: [0, 0.075 + 0.05, -0.01], r: [0.085, 0.06, 0.096] }, 0x26324a, { group: 'head', rough: 0.9, k: 0.006, prio: 2 }); // skullcap
      addArms(r, { t: 0.88, muscle: 0.05, skin, upper: robeC, fore: robeC, hand: skin });
      r.sides((sd, k) => r.part('foreArm' + sd, G.lathe([[0.1, -0.25], [0.07, -0.08], [0.06, 0.02]], 10), robeC, { rough: 0.92 }));
      addLegs(r, { t: 0.9, legs: robeC, boot: 0x2a2018 });
      robe(r, [[0.31, -0.93], [0.26, -0.6], [0.2, -0.28], [0.165, 0.0]], (x, y, z, c) => c.set(y < -0.88 ? trim : robeC));
      belt(r, 0.03, 0.17, 0.14, 0x3a2a1c);
      r.part('hips', T(G.rbox(0.12, 0.15, 0.04, 0.01), 0.17, -0.06, 0.05, 0, 0.6, 0), 0x5a2a1a, { rough: 0.7 }); // book
      woodStaff(r, 0x7ac8ff, 1.5); weaponKind = 'staff';
      break;
    }
    case 'peddler': {
      const skin = 0xb8906a, coat = 0x5a4630;
      const patch = (x, y, z, c) => { const n = NOISE.noise3(x * 7, y * 7, z * 7); c.set(n > 0.4 ? 0x6a3a2a : n < -0.45 ? 0x3e4a3a : coat); };
      addTorso(r, { w: 0.95, muscle: 0.1, chest: patch, belly: patch, pelvis: patch });
      addHead(r, { skin, r: 0.105, gaunt: 0.4, nose: 1.35, brow: 0x8a6a4a });
      addBeard(r, 'stubble', 0x4a3a2a, { r: 0.105 });
      // hood layer + scarf
      const Hd = { group: 'hood', rough: 0.95, v: 0.14, f: 14, k: 0.02 };
      r.blob('head', { t: 'ell', c: [0, 0.095, -0.02], r: [0.12, 0.13, 0.135] }, coat, Hd);
      r.blob('neck', { t: 'cap', a: [0, -0.04, -0.02], b: [0, 0.09, -0.01], r0: 0.12, r1: 0.1 }, coat, { ...Hd, k: 0.05 });
      r.blob('head', { t: 'ell', c: [0, 0.08, 0.0], r: [0.1, 0.112, 0.118] }, 0x0e0a08, { ...Hd, sub: true, k: 0.01 });
      r.blob('neck', { t: 'cap', a: [0, -0.1, 0.0], b: [0, 0.1, 0.0], r0: 0.075, r1: 0.068 }, 0x0e0a08, { ...Hd, sub: true, k: 0.01 });
      r.blob('head', { t: 'ell', c: [0, 0.065, 0.12], r: [0.082, 0.115, 0.08] }, 0x0e0a08, { ...Hd, sub: true, k: 0.012 });
      r.blob('chest', { t: 'tor', c: [0, P.neck + 0.0, 0.01], R: 0.085, r: 0.032, rot: [0.2, 0, 0] }, 0x8a2a20, { group: 'cloth', rough: 0.95, v: 0.1, k: 0.03, bump: [0.003, 50] });
      addArms(r, { t: 0.9, muscle: 0.1, skin, upper: patch, fore: patch, hand: skin });
      addLegs(r, { t: 0.9, legs: 0x3a3024, boot: 0x2a1c12 });
      robe(r, [[0.26, -0.62], [0.22, -0.35], [0.165, 0.0]], patch);
      belt(r, 0.03, 0.17, 0.14, 0x2a1a10);
      r.part('chest', T(G.rbox(0.42, 0.6, 0.26, 0.04), 0, 0.2, -0.3), 0x4a3420, { rough: 0.85, v: 0.15 });
      r.part('chest', T(G.cyl(0.08, 0.08, 0.5, 8), 0, 0.55, -0.3, 0, 0, Math.PI / 2), 0x6a2a1a, { rough: 0.95 });
      for (let i = 0; i < 3; i++) r.part('chest', T(G.sphere(0.07 - i * 0.01, 8, 6), -0.15 + i * 0.15, 0.62 + (i % 2) * 0.04, -0.22), [0x8a5a3a, 0x6a6a5a, 0x7a3a2a][i], { rough: 0.5, metal: i === 1 ? 0.6 : 0 });
      r.part('chest', T(G.cyl(0.035, 0.04, 0.09, 6), 0.24, 0.1, -0.3), 0x2a2420, { rough: 0.5, metal: 0.7 });
      r.part('chest', T(G.sphere(0.03, 6, 5), 0.24, 0.1, -0.3), 0xffb050, { emis: 2.5, v: 0 });
      break;
    }
    case 'captain': {
      const skin = 0xc89878, hair = 0x7a2c18, chain = (x, y, z, c) => { const n = Math.sin(x * 240) * Math.sin(y * 240) * 0.5 + 0.5; c.set(0x8a8d92).multiplyScalar(0.7 + n * 0.45); };
      addTorso(r, { w: 1.0, muscle: 0.4, bust: 0.8, chest: chain, belly: chain, pelvis: 0x3a2a1c });
      addHead(r, { skin, r: 0.106, female: true, nose: 0.9, jawW: 0.92, brow: 0xa07050, lips: 0xa05a50 });
      addHair(r, 'long', hair, { r: 0.106 });
      addHair(r, 'short', hair, { r: 0.106 });
      addArms(r, { t: 0.95, muscle: 0.45, skin, upper: chain, fore: 0x4a3422, hand: 0x4a3422 });
      r.sides((sd, k) => {
        r.part('upperArm' + sd, T(G.shell(0.095, 0, TAU, 0, 1.4, 12, 6), 0, 0.03, 0, 0, 0, -k * 0.35, 1.15, 0.85, 1.05), 0x7a7e86, { rough: 0.4, metal: 0.85 });
        r.part('upperArm' + sd, T(G.torus(0.1, 0.01, 4, 16), 0, 0.0, 0, Math.PI / 2, 0, -k * 0.35, 1.12, 1, 1), 0xc9a24e, { rough: 0.3, metal: 0.9 });
      });
      addLegs(r, { t: 0.95, legs: 0x3a2a1c, boot: 0x2a1c12, bootTop: 0x2a1c12 });
      robe(r, [[0.24, -0.42], [0.2, -0.2], [0.165, 0.0]], chain, { rough: 0.55, metal: 0.8 });
      belt(r, 0.03, 0.17, 0.14, 0x2a1a10);
      spearIn(r); weaponKind = 'staff';
      cape = { bone: 'chest', a0: [0.18, 0.34, -0.12], a1: [-0.18, 0.34, -0.12], width: 0.38, length: 1.0, cols: 6, rows: 8, color: 0x6a1418, rough: 0.85, taper: -0.4, body: [{ bone: 'chest', x: 0, y: 0.18, z: 0, r: 0.19 }, { bone: 'hips', x: 0, y: -0.05, z: 0, r: 0.19 }] };
      break;
    }
    default: { // villager
      const tunic = [0x6a5a40, 0x4a5a6a, 0x6a4a4a, 0x5a6a48][v % 4], skin = [0xc89a7a, 0xa8785a, 0xd8b090][v % 3];
      addTorso(r, { w: 1.0, muscle: 0.3, chest: tunic, belly: tunic, pelvis: 0x3a3024 });
      addHead(r, { skin, r: 0.11, nose: 0.9 + (v % 3) * 0.15 });
      addHair(r, ['short', 'wild', 'short', 'fringe'][v % 4], [0x3a2a1a, 0x6a4a2a, 0x2a2420][v % 3], { r: 0.11 });
      if (v % 2) addBeard(r, 'stubble', 0x3a2a1a, { r: 0.11 });
      if (v % 2) r.part('head', T(G.cyl(0.18, 0.18, 0.02, 14), 0, 0.17, 0), 0x8a7a50, { rough: 0.9 });
      addArms(r, { t: 0.95, skin, upper: tunic, fore: skin, hand: skin });
      addLegs(r, { t: 0.95, legs: 0x3a3024, boot: 0x2a1c12 });
      robe(r, [[0.23, -0.3], [0.2, -0.15], [0.165, 0.0]], tunic);
      belt(r, 0.03, 0.17, 0.14, 0x2a1a10);
    }
  }
  const clips = clipSet(NAMES, locoClips(P, style, 1.05, 0.68));
  const height = P.hipY + P.spine + P.chest + P.neck + P.headUp + 0.2;
  return r.template({ kind: 'npc_' + kind, height, radius: 0.36, P, style, clips, runAt: 3.0, post: humanoidPost, weaponKind, cape, springs });
}
function hammerIn(r) {
  r.part('handR', inHand(T(G.cyl(0.018, 0.02, 0.55, 6), 0, 0.15, 0)), 0x4a3420, { rough: 0.85 });
  r.part('handR', inHand(T(G.rbox(0.09, 0.09, 0.2, 0.015), 0, 0.42, 0)), 0x5a5a60, { rough: 0.5, metal: 0.85 });
}
function spearIn(r) {
  r.part('handR', inHand(T(G.cyl(0.018, 0.02, 2.0, 6), 0, 0.5, 0)), 0x4a3420, { rough: 0.85 });
  r.part('handR', inHand(T(G.blade(0.3, 0.075, 0.02, 0.5), 0, 1.5, 0)), 0xb8bcc2, { rough: 0.3, metal: 0.9, flat: true });
  r.part('handR', inHand(T(G.cone(0.03, 0.08, 6), 0, 1.48, 0, Math.PI, 0, 0)), 0x8a2a20, { rough: 0.9 });
}
export const NPC_KINDS = ['healer', 'smith', 'sage', 'peddler', 'captain', 'villager'];
export function createNPC(kind, opts = {}) {
  if (!NPC_KINDS.includes(kind)) kind = 'villager';
  const v = kind === 'villager' ? (opts.variant ?? Math.floor(Math.random() * 4)) : 0;
  const tpl = cachedTemplate(`npc:${kind}:${v}`, () => build(kind, v));
  return new CharacterModel(tpl, opts);
}

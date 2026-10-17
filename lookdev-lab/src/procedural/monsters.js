// Monsters, minions and the Hollow King.
import * as THREE from 'three';
import { Rig, G, T, K, kclip, CharacterModel, cachedTemplate, NOISE } from './rig.js';
import { humanoidRig, standardSockets, addHead, addTorso, addArms, addLegs, addHair, setSculpt, HUMANOID_CLIPS, humanoidPost, clipSet, SKIRT_SPRINGS, standBody } from './humanoid.js';
import { heroTemplate, locoClips, P_BARB } from './heroes.js';
import { TAU, clamp } from '../core/util.js';

const EYE = { monster: 0xff5418, ally: 0x46ffd2, fire: 0xff6a1a, cold: 0x6ad0ff, lightning: 0xdfe8ff };
const HAND_SOCK = [0, -0.065, 0.012, Math.PI / 2 - 0.25, 0, 0];
// place weapon geometry (grip at origin, along +Y) into hand space
const inHand = (g, extraRx = 0) => T(g, HAND_SOCK[0], HAND_SOCK[1], HAND_SOCK[2], HAND_SOCK[3] + extraRx, 0, 0);
function flip(g) {
  const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); return g;
}

// ------------------------------------------------------------------ built-in weapons
function rustySword(r, bone = 'handR', len = 0.78) {
  r.part(bone, inHand(G.blade(len, 0.065, 0.012, 0.2), 0), 0x7a6a58, { rough: 0.55, metal: 0.7, v: 0.25, f: 14, flat: true });
  r.part(bone, inHand(T(G.box(0.2, 0.03, 0.04), 0, 0.02, 0)), 0x4a3a2a, { rough: 0.6, metal: 0.5 });
  r.part(bone, inHand(T(G.cyl(0.016, 0.016, 0.15, 5), 0, -0.07, 0)), 0x3a2a1c, { rough: 0.9 });
}
function buckler(r, P, color = 0x4a3826, rim = 0x6a6258, rad = 0.24) {
  const s = (g) => T(g, 0.075, -P.fore * 0.55, 0, 0, Math.PI / 2, 0);
  r.part('foreArmL', s(T(G.cyl(rad, rad * 0.92, 0.035, 14), 0, 0, 0.02, Math.PI / 2, 0, 0)), color, { rough: 0.85, v: 0.2 });
  r.part('foreArmL', s(T(G.torus(rad, 0.018, 4, 18), 0, 0, 0.035)), rim, { rough: 0.5, metal: 0.7, v: 0.2 });
  r.part('foreArmL', s(T(G.sphere(0.05, 8, 6), 0, 0, 0.04)), rim, { rough: 0.45, metal: 0.8 });
}
function bow(r, P) {
  const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8 - 0.5; pts.push([0, t * 1.0, -Math.cos(t * Math.PI) * 0.16 + 0.16]); }
  const g = G.horn(pts, 0.018, 0.012, 5, 12);
  r.part('handL', inHand(T(g, 0, 0, -0.02, 0, 0, 0), -Math.PI / 2 + 0.25), 0x5a3a20, { rough: 0.7 });
  r.part('handL', inHand(T(G.cyl(0.003, 0.003, 1.0, 3), 0, 0, -0.17), -Math.PI / 2 + 0.25), 0xd8d0b0, { rough: 0.9 });
}
function quiver(r) {
  r.part('chest', T(G.cyl(0.06, 0.05, 0.42, 8), 0.06, 0.22, -0.16, 0.3, 0, -0.35), 0x4a3020, { rough: 0.8 });
  for (let i = 0; i < 4; i++) r.part('chest', T(G.cyl(0.005, 0.005, 0.18, 3), 0.1 + i * 0.012, 0.47 + i * 0.01, -0.21, 0.3, 0, -0.35), 0xc8b890, { rough: 0.9 });
}
function staff(r, top = 0x6ad0ff, emis = 3, len = 1.6, wood = 0x4a3420) {
  r.part('handR', inHand(T(G.cyl(0.018, 0.024, len, 6), 0, len / 2 - 0.45, 0)), wood, { rough: 0.85, bump: [0.004, 30] });
  r.part('handR', inHand(T(G.ico(0.05, 0), 0, len - 0.4, 0)), top, { rough: 0.2, emis, flat: true });
  for (let i = 0; i < 3; i++) r.part('handR', inHand(T(G.cone(0.012, 0.12, 4), Math.sin(i * 2.1) * 0.04, len - 0.48, Math.cos(i * 2.1) * 0.04, Math.cos(i * 2.1) * 0.4, 0, -Math.sin(i * 2.1) * 0.4)), wood, { rough: 0.85 });
}
function crudeBlade(r) {
  const g = G.blade(0.38, 0.085, 0.014, 0.35);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (p.getX(i) > 0.01) p.setX(i, p.getX(i) + Math.sin(y * 60) * 0.012); }
  g.computeVertexNormals();
  r.part('handR', inHand(g), 0x6a5a48, { rough: 0.6, metal: 0.6, v: 0.3, f: 18, flat: true });
  r.part('handR', inHand(T(G.cyl(0.014, 0.014, 0.12, 5), 0, -0.05, 0)), 0x3a2414, { rough: 0.9 });
}
function skullStaff(r, len = 1.15) {
  r.part('handR', inHand(T(G.cyl(0.014, 0.02, len, 5), 0, len / 2 - 0.35, 0)), 0x3a2a18, { rough: 0.9, bump: [0.004, 25] });
  r.part('handR', inHand(T(G.ell(0.055, 0.06, 0.06, 8, 6), 0, len - 0.32, 0)), 0xcfc3a3, { rough: 0.6 });
  r.sides((s, k) => r.part('handR', inHand(T(G.sphere(0.014, 5, 4), k * 0.022, len - 0.315, 0.045)), 0xff7a2a, { emis: 4, v: 0 }));
  for (let i = 0; i < 3; i++) r.part('handR', inHand(T(G.cone(0.01, 0.1, 3), 0, len - 0.4 - i * 0.03, 0, 0.5 + i * 0.3, i * 2, 0.6)), [0xa02020, 0xd0a020, 0x202020][i], { rough: 0.9 });
}
function greatsword(r) {
  r.part('handR', inHand(T(G.blade(2.3, 0.2, 0.035, 0.12), 0, 0.28, 0)), (x, y, z, c) => { c.set(0x3a3a40); if (Math.abs(x) < 0.02 && Math.sin(y * 9) > 0.2) c.set(0xff6a20); }, { rough: 0.4, metal: 0.8, v: 0.15, emis: 0.9, flat: true });
  r.part('handR', inHand(T(G.box(0.62, 0.07, 0.1), 0, 0.26, 0)), 0x4a3a28, { rough: 0.45, metal: 0.8 });
  r.sides((s, k) => r.part('handR', inHand(T(G.cone(0.04, 0.16, 5), k * 0.33, 0.3, 0, 0, 0, -k * 1.9)), 0x4a3a28, { rough: 0.45, metal: 0.8 }));
  r.part('handR', inHand(T(G.cyl(0.035, 0.035, 0.5, 6), 0, -0.02, 0)), 0x2a1a12, { rough: 0.9 });
  r.part('handR', inHand(T(G.ico(0.07, 0), 0, -0.3, 0)), 0xb08a3a, { rough: 0.3, metal: 0.9 });
}
function spear(r) {
  r.part('handR', inHand(T(G.cyl(0.018, 0.02, 2.1, 6), 0, 0.55, 0)), 0x4a3420, { rough: 0.85 });
  r.part('handR', inHand(T(G.blade(0.3, 0.08, 0.02, 0.5), 0, 1.6, 0)), 0xb8bcc2, { rough: 0.3, metal: 0.9, flat: true });
  r.part('handR', inHand(T(G.cone(0.03, 0.08, 6), 0, 1.58, 0, Math.PI, 0, 0)), 0x8a2a20, { rough: 0.9 });
}
function hammer(r) {
  r.part('handR', inHand(T(G.cyl(0.018, 0.02, 0.55, 6), 0, 0.15, 0)), 0x4a3420, { rough: 0.85 });
  r.part('handR', inHand(T(G.rbox(0.09, 0.09, 0.2, 0.015), 0, 0.42, 0)), 0x5a5a60, { rough: 0.5, metal: 0.85 });
}

// ------------------------------------------------------------------ skeleton family
const P_SKEL = { hipY: 0.99, spine: 0.11, chest: 0.21, neck: 0.25, headUp: 0.08, shX: 0.19, shY: 0.2, clavX: 0.05, upper: 0.3, fore: 0.27, thighX: 0.095, thigh: 0.45, shin: 0.43 };
const BONE = 0xcfc4a6;
function skull(r, eye, o = {}) {
  const bc = o.bone ?? BONE;
  r.part('head', T(G.ell(0.098, 0.105, 0.115, 12, 9), 0, 0.085, -0.005), bc, { rough: 0.6, v: 0.14 });
  r.part('head', T(G.ell(0.075, 0.05, 0.07, 10, 6), 0, 0.02, 0.04), bc, { rough: 0.6, v: 0.12 }); // maxilla
  r.sides((s, k) => {
    r.part('head', T(G.sphere(0.032, 7, 6), k * 0.038, 0.072, 0.085), 0x0a0806, { rough: 1, v: 0 });
    r.part('head', T(G.sphere(0.014, 6, 4), k * 0.036, 0.072, 0.098), eye, { emis: o.eyeEmis ?? 5, v: 0, rough: 0.3 });
    r.part('head', T(G.ell(0.02, 0.016, 0.04, 6, 4), k * 0.065, 0.045, 0.06), bc, { rough: 0.6 });
  });
  r.part('head', T(G.cone(0.016, 0.03, 3), 0, 0.035, 0.1, Math.PI, 0, 0), 0x0a0806, { rough: 1, v: 0 });
  // jaw with teeth
  r.part('jaw', T(G.ell(0.062, 0.028, 0.06, 10, 5), 0, -0.03, 0.035), bc, { rough: 0.6, v: 0.12 });
  for (let i = 0; i < 6; i++) r.part('jaw', T(G.box(0.012, 0.018, 0.01), -0.03 + i * 0.012, -0.008, 0.085 - Math.abs(i - 2.5) * 0.006), 0xe0d8c0, { rough: 0.5 });
}
function boneBody(r, P, o = {}) {
  const bc = o.bone ?? BONE, t = o.t ?? 1;
  // pelvis
  r.part('hips', T(G.torus(0.1, 0.028, 5, 12), 0, -0.02, 0, Math.PI / 2 - 0.3, 0, 0, 1.15, 0.85, 1), bc, { rough: 0.6, v: 0.15 });
  r.sides((s, k) => r.part('hips', T(G.ell(0.06, 0.07, 0.03, 8, 5), k * 0.09, 0.03, -0.01, 0, k * 0.5, 0), bc, { rough: 0.6, v: 0.15 }));
  // spine vertebrae
  for (let i = 0; i < 3; i++) r.part('spine', T(G.cyl(0.026, 0.026, 0.045, 6), 0, 0.02 + i * 0.065, -0.04), bc, { rough: 0.6, v: 0.15 });
  for (let i = 0; i < 2; i++) r.part('neck', T(G.cyl(0.022, 0.022, 0.04, 6), 0, 0.02 + i * 0.05, -0.01), bc, { rough: 0.6 });
  // ribcage
  for (let i = 0; i < 5; i++) {
    const y = 0.06 + i * 0.055, rr = (0.12 + Math.sin((i / 4) * Math.PI) * 0.035) * (o.w ?? 1);
    r.part('chest', T(G.torus(rr, 0.012, 4, 14, Math.PI * 1.55), 0, y, 0, Math.PI / 2, 0, Math.PI * 0.225 + Math.PI, 1, 0.75, 1), bc, { rough: 0.6, v: 0.15 });
  }
  r.part('chest', T(G.box(0.03, 0.24, 0.02), 0, 0.18, 0.1), bc, { rough: 0.6 });
  for (let i = 0; i < 4; i++) r.part('chest', T(G.cyl(0.024, 0.024, 0.05, 6), 0, 0.04 + i * 0.075, -0.075), bc, { rough: 0.6 });
  r.sides((s, k) => r.part('chest', T(G.cyl(0.013, 0.013, 0.16, 5), k * 0.08, 0.34, 0.03, 0, 0, k * 1.35), bc, { rough: 0.6 })); // clavicles
  // limbs
  r.sides((s, k) => {
    r.part('upperArm' + s, T(G.sphere(0.038 * t, 7, 5), 0, 0, 0), bc, { rough: 0.6 });
    r.part('upperArm' + s, G.limb(0.024 * t, 0.02 * t, P.upper, 6), bc, { rough: 0.6, v: 0.12 });
    r.part('foreArm' + s, T(G.sphere(0.03 * t, 6, 5), 0, 0, 0), bc, { rough: 0.6 });
    r.part('foreArm' + s, T(G.limb(0.016 * t, 0.014 * t, P.fore, 5), 0.012, 0, 0), bc, { rough: 0.6, v: 0.12 });
    r.part('foreArm' + s, T(G.limb(0.014 * t, 0.012 * t, P.fore, 5), -0.012, 0, 0), bc, { rough: 0.6, v: 0.12 });
    r.part('hand' + s, T(G.box(0.05, 0.045, 0.02), 0, -0.03, 0.005), bc, { rough: 0.6 });
    for (let f = 0; f < 4; f++) r.part('hand' + s, T(G.cyl(0.006, 0.004, 0.06, 3), -0.018 + f * 0.012, -0.075, 0.01, 0.3, 0, 0), bc, { rough: 0.6 });
    r.part('thigh' + s, T(G.sphere(0.04 * t, 7, 5), 0, 0, 0), bc, { rough: 0.6 });
    r.part('thigh' + s, G.limb(0.03 * t, 0.025 * t, P.thigh, 6), bc, { rough: 0.6, v: 0.12 });
    r.part('shin' + s, T(G.sphere(0.036 * t, 7, 5), 0, 0, 0.005), bc, { rough: 0.6 });
    r.part('shin' + s, G.limb(0.024 * t, 0.018 * t, P.shin, 6), bc, { rough: 0.6, v: 0.12 });
    r.part('foot' + s, T(G.box(0.06, 0.035, 0.17), 0, -0.035, 0.045), bc, { rough: 0.6, v: 0.12 });
  });
}
const SKEL_STYLE = { hunch: 0.06, knee: 0.16, armOut: 0.14, jitter: 0.12, breath: 0, walk: { amp: 0.4, knee: 0.7, arm: 0.32, lean: 0.06 }, run: { amp: 0.65, knee: 1.25, arm: 0.5, lean: 0.22 } };
// collapse into a pile of bones
const SKEL_DEATH = kclip({ dur: 1.15, hold: true, ground: false, fade: 0.05 }, {
  base: { x: [[0, 0], [0.1, 0.0], [0.42, -1.52, 3], [0.48, -1.44], [0.54, -1.52], [1, -1.52]], py: [[0, 0], [0.42, 0.05], [0.5, 0.07], [1, 0.07]], y: [[0, 0], [1, 0.3]] },
  hips: { x: [[0, 0], [0.42, -0.15], [1, -0.1]], z: [[0, 0], [0.5, 0.15], [1, 0.22]] },
  spine: { x: [[0, 0], [0.1, 0.2], [0.42, -0.1], [0.6, -0.05], [1, -0.05]], z: [[0, 0], [0.6, -0.25], [1, -0.3]], py: [[0, 0], [0.45, 0], [0.62, -0.05], [1, -0.05]] },
  chest: { x: [[0, 0], [0.1, -0.3], [0.45, 0.0], [1, 0.05]], z: [[0, 0], [0.6, 0.35], [1, 0.4]], py: [[0, 0], [0.45, 0], [0.62, -0.06], [1, -0.06]] },
  head: { px: [[0, 0], [0.45, 0], [0.7, 0.2, 2], [1, 0.24]], py: [[0, 0], [0.45, 0], [0.7, 0.12, 2], [1, 0.14]], pz: [[0, 0], [0.45, 0], [0.7, -0.08], [1, -0.1]], z: [[0, 0], [0.45, 0], [0.85, 1.9], [1, 2.0]], x: [[0, 0], [0.1, -0.4], [0.45, 0.3], [1, 0.5]] },
  jaw: { x: [[0, 0], [0.5, 0.6], [1, 0.4]], py: [[0, 0], [0.5, 0], [0.7, -0.04], [1, -0.05]] },
  upperArmL: { x: [[0, 0], [0.3, -1.0], [0.5, -1.9], [1, -2.0]], z: [[0, 0.1], [0.4, 0.9], [1, 1.25]], px: [[0, 0], [0.45, 0], [0.65, 0.07], [1, 0.08]] },
  upperArmR: { x: [[0, -0.2], [0.3, -0.8], [0.5, -1.4], [1, -1.2]], z: [[0, -0.12], [0.4, -0.9], [1, -1.3]], px: [[0, 0], [0.45, 0], [0.65, -0.07], [1, -0.08]] },
  foreArmL: { x: [[0, -0.3], [0.5, -0.8], [1, -1.4]] }, foreArmR: { x: [[0, -0.6], [0.5, -0.3], [1, -0.9]] },
  thighL: { x: [[0, 0], [0.2, -0.5], [0.45, -0.3], [1, -0.25]], z: [[0, 0.04], [0.5, 0.35], [1, 0.5]] },
  shinL: { x: [[0, 0], [0.2, 0.9], [0.45, 0.4], [1, 0.6]], py: [[0, 0], [0.5, 0], [0.7, -0.05], [1, -0.05]] },
  thighR: { x: [[0, 0], [0.2, -0.2], [0.45, -0.1], [1, -0.4]], z: [[0, -0.04], [0.5, -0.4], [1, -0.55]] },
  shinR: { x: [[0, 0], [0.2, 0.5], [0.45, 0.15], [1, 1.1]], px: [[0, 0], [0.5, 0], [0.7, -0.04], [1, -0.05]] },
  footL: { x: [[0, 0], [1, 0.8]] }, footR: { x: [[0, 0], [1, 0.4]] },
});
function skeletonKind(kind, o) {
  const eye = o.ally ? EYE.ally : o.element ? EYE[o.element] : EYE.monster;
  const key = `mon:${kind}:${o.ally ? 'a' : 'm'}:${o.element || ''}:${o.variant ?? 0}`;
  return cachedTemplate(key, () => {
    const P = P_SKEL;
    const r = humanoidRig(P, { jaw: [0.02, 0.025], skirt: kind === 'skeleton_mage' ? { r: 0.11, y: -0.02 } : null });
    standardSockets(r, P);
    skull(r, eye); boneBody(r, P);
    let weaponKind = '1h', style = SKEL_STYLE;
    if (kind === 'skeleton') {
      rustySword(r); buckler(r, P);
      if ((o.variant ?? 0) % 2 === 0) { // rusty half-helm & shoulder plate
        r.part('head', T(G.shell(0.118, 0, TAU, 0, 1.25, 12, 6), 0, 0.09, -0.01), 0x5a4a3c, { rough: 0.55, metal: 0.7, v: 0.3, f: 12 });
        r.part('head', T(G.box(0.02, 0.07, 0.02), 0, 0.09, 0.11), 0x5a4a3c, { rough: 0.55, metal: 0.7 });
      }
      r.part('upperArmL', T(G.shell(0.07, 0, TAU, 0, 1.3, 8, 5), 0, 0.02, 0, 0, 0, -0.3, 1.2, 0.9, 1.1), 0x5a4a3c, { rough: 0.55, metal: 0.65, v: 0.3, f: 12 });
      r.part('hips', T(G.lathe([[0.15, -0.22], [0.13, -0.05], [0.12, 0.02]], 10), 0, 0, 0), 0x3a2e24, { rough: 0.95, v: 0.25 }); // rag skirt
      style = Object.assign({}, SKEL_STYLE, { shield: true });
    } else if (kind === 'skeleton_archer') {
      bow(r, P); quiver(r); weaponKind = 'bow';
      r.part('head', T(G.shell(0.125, Math.PI / 2 + 0.8, TAU - 1.6, 0, 1.9, 12, 7), 0, 0.09, -0.01, 0, 0, 0, 1, 1.05, 1.1), 0x2e3a2a, { rough: 0.95, v: 0.15 }); // hood
      r.part('chest', T(G.lathe([[0.2, 0.2], [0.16, 0.33], [0.1, 0.4]], 10), 0, 0, -0.01).scale(1, 1, 0.8), 0x2e3a2a, { rough: 0.95 });
    } else { // mage
      const ec = eye; staff(r, ec, 3.5, 1.45, 0x2a2018); weaponKind = 'staff';
      r.part('head', T(G.shell(0.13, Math.PI / 2 + 0.75, TAU - 1.5, 0, 2.0, 12, 7), 0, 0.09, -0.01, 0, 0, 0, 1, 1.08, 1.12), 0x2a1a34, { rough: 0.95, v: 0.15 });
      r.part('head', T(G.cone(0.06, 0.2, 6), 0, 0.16, -0.12, -2.0, 0, 0), 0x2a1a34, { rough: 0.95 });
      r.part('chest', T(G.lathe([[0.21, 0.15], [0.18, 0.32], [0.11, 0.41]], 10), 0, 0, -0.01).scale(1, 1, 0.8), 0x2a1a34, { rough: 0.95 });
      const prof = [[0.22, -0.7], [0.18, -0.35], [0.14, 0.0]];
      for (const [b, ph] of [['skirtF', 0], ['skirtL', Math.PI / 2], ['skirtB', Math.PI], ['skirtR', Math.PI * 1.5]]) {
        const off = { skirtF: [0, 0.02, -0.11], skirtB: [0, 0.02, 0.11], skirtL: [-0.11, 0.02, 0], skirtR: [0.11, 0.02, 0] }[b];
        r.part(b, T(G.lathe(prof, 5, ph - Math.PI / 4 - 0.15, Math.PI / 2 + 0.3), ...off), 0x2a1a34, { rough: 0.95, v: 0.2 });
        r.part(b, T(flip(G.lathe(prof, 5, ph - Math.PI / 4 - 0.15, Math.PI / 2 + 0.3)), ...off), 0x120a16, { rough: 1 });
      }
      r.sides((s, k) => r.part('hand' + s, T(G.sphere(0.035, 6, 5), 0, -0.04, 0.0), ec, { emis: 2.2, v: 0, rough: 0.5 }));
    }
    const clips = clipSet(['idle', 'walk', 'run', 'attack1', 'attack2', 'cast', 'shoot', 'hit', 'death', 'block', 'spawn'], Object.assign(locoClips(P, style, 1.0, 0.7), { death: SKEL_DEATH }));
    return r.template({ kind, height: 1.85, radius: 0.36, P, style, clips, runAt: 3.0, post: humanoidPost, weaponKind, springs: kind === 'skeleton_mage' ? SKIRT_SPRINGS : null, eye });
  });
}

// ------------------------------------------------------------------ zombie
const P_ZOMB = { hipY: 0.97, spine: 0.1, chest: 0.21, neck: 0.23, headUp: 0.09, shX: 0.2, shY: 0.19, clavX: 0.05, upper: 0.31, fore: 0.28, thighX: 0.1, thigh: 0.44, shin: 0.42 };
const ZOMB_STYLE = { hunch: 0.32, armsFwd: 0.85, limp: 0.55, knee: 0.16, jitter: 0.04, breath: 0.4, look: 0.3, sway: 0.03, deathFwd: true, walk: { amp: 0.3, knee: 0.55, arm: 0.1, lean: 0.08, sway: 0.08 }, run: { amp: 0.45, knee: 0.9, arm: 0.2, lean: 0.2 } };
const ZOMB_ATTACK = kclip({ dur: 0.9, impact: 0.5, base: (m) => standBody(m, m.tpl.style) }, {
  upperArmL: { x: [[0, -1.06], [0.35, -2.55, 2], [0.5, -0.65, 3], [0.7, -0.85], [1, -1.06]], z: [[0, 0.05], [0.35, 0.25], [0.5, -0.1], [1, 0.05]] },
  upperArmR: { x: [[0, -0.94], [0.35, -2.45, 2], [0.5, -0.6, 3], [0.7, -0.8], [1, -0.94]], z: [[0, -0.08], [0.35, -0.25], [0.5, 0.1], [1, -0.08]] },
  foreArmL: { x: [[0, -0.3], [0.35, -0.9], [0.5, -0.15], [1, -0.3]] }, foreArmR: { x: [[0, -0.42], [0.35, -0.9], [0.5, -0.15], [1, -0.42]] },
  chest: { x: [[0, 0], [0.35, -0.35], [0.5, 0.35, 3], [0.75, 0.25], [1, 0]] }, head: { x: [[0, 0], [0.35, 0.2], [0.5, -0.2], [1, 0]] },
  jaw: { x: [[0, 0.25], [0.3, 0.6], [0.6, 0.6], [1, 0.25]] },
  thighL: { x: [[0, 0], [0.5, -0.35], [1, 0]] }, shinL: { x: [[0, 0], [0.5, 0.3], [1, 0]] }, thighR: { x: [[0, 0], [0.5, 0.25], [1, 0]] },
});
function zombieTpl(o) {
  const v = (o.variant ?? 0) % 3;
  return cachedTemplate(`mon:zombie:${o.ally ? 'a' : 'm'}:${v}`, () => {
    const P = P_ZOMB;
    const r = humanoidRig(P, { jaw: [0.0, 0.03] });
    setSculpt(r, { key: `zombie:${v}`, voxel: 0.015, tris: 5600, groups: { head: { voxel: 0.0085, tris: 1900 } } });
    standardSockets(r, P);
    const skinC = new THREE.Color([0x7f8a68, 0x8a8470, 0x6f7a6a][v]), shirt = new THREE.Color([0x5a4e3e, 0x4a4436, 0x5e5240][v]), pants = [0x3a3328, 0x2e2a24, 0x3e3426][v];
    const rotC = new THREE.Color(0x4a5238), wound = new THREE.Color(0x6a2420), boneC = new THREE.Color(0xc0b494);
    const skin = (x, y, z, c) => { const n = NOISE.noise3(x * 9, y * 9 + v, z * 9); c.copy(n > 0.35 ? rotC : n < -0.55 ? wound : skinC); };
    const torn = (x, y, z, c) => {
      const n = NOISE.noise3(x * 6 + v * 3, y * 6, z * 6);
      if (n > 0.22) { skin(x, y, z, c); if (z > 0.03 && x > 0.0 && x < 0.13 && y > 0.05 && Math.sin(y * 95) > 0.35 && n > 0.36) c.copy(boneC); }
      else c.copy(shirt).multiplyScalar(0.8 + n * 0.5);
    };
    const eye = o.ally ? EYE.ally : 0xd8c040;
    addTorso(r, { w: 0.95, d: 0.95, muscle: 0.15, chest: torn, belly: torn, pelvis: pants, rough: 0.9 });
    addHead(r, { skin, r: 0.106, gaunt: 0.9, nose: 0.7, jawW: 0.95, eyeSize: 1.12, rigidEyes: true, eyes: eye, eyeGlow: o.ally ? 4 : 1.8, brow: 0x5a6248, socket: 0x16160e, lips: 0x3a2018 });
    addHair(r, 'wild', 0x2a2620, { r: 0.106 });
    addArms(r, { t: 0.86, muscle: 0.1, skin, upper: v === 1 ? torn : skin, fore: skin, hand: skin, rough: 0.8 });
    r.sides((s, k) => { for (let i = 0; i < 4; i++) r.part('hand' + s, T(G.cone(0.006, 0.045, 3), -k * 0.006, -0.11, -0.025 + i * 0.016, 0.3, 0, 0), 0x2a2418, { rough: 0.6 }); });
    addLegs(r, { t: 0.93, legs: pants, boot: v === 2 ? skinC.getHex() : 0x2a2218 });
    const clips = clipSet(['idle', 'walk', 'attack1', 'attack2', 'hit', 'death', 'spawn'], Object.assign(locoClips(P, ZOMB_STYLE, 1.5, 1.0), { attack1: ZOMB_ATTACK }));
    delete clips.run;
    return r.template({ kind: 'zombie', height: 1.72, radius: 0.36, P, style: ZOMB_STYLE, clips, post: humanoidPost, weaponKind: 'none', eye });
  });
}

// ------------------------------------------------------------------ imps (Grovelings)
const P_IMP = { hipY: 0.43, spine: 0.07, chest: 0.12, neck: 0.12, headUp: 0.05, shX: 0.12, shY: 0.11, clavX: 0.03, upper: 0.18, fore: 0.17, thighX: 0.07, thigh: 0.21, shin: 0.2 };
const IMP_STYLE = { hunch: 0.35, knee: 0.42, armOut: 0.3, jitter: 0.28, breath: 1.6, wide: 0.08, walk: { amp: 0.5, knee: 0.9, arm: 0.4, lean: 0.1, sway: 0.06 }, run: { amp: 0.78, knee: 1.4, arm: 0.6, lean: 0.25 } };
function impTpl(kind, o) {
  const shaman = kind === 'imp_shaman';
  return cachedTemplate(`mon:${kind}:${o.ally ? 'a' : 'm'}`, () => {
    const P = P_IMP;
    const r = humanoidRig(P, { jaw: [0.0, 0.04] });
    setSculpt(r, { key: `imp:${shaman ? 's' : 'n'}`, voxel: 0.0085, tris: 3400, apose: { upperArmL: [0, 0, 0.7], upperArmR: [0, 0, -0.7], thighL: [0, 0, 0.12], thighR: [0, 0, -0.12] }, groups: { head: { voxel: 0.006, tris: 2000 } } });
    standardSockets(r, P, { headC: 0.08, over: 0.4 });
    const skinBase = new THREE.Color(shaman ? 0x6a1e30 : 0x8a2a1a), belly = new THREE.Color(shaman ? 0x9a5a5a : 0xb0603a), dark = new THREE.Color(0x3a0e0a);
    const skin = (x, y, z, c) => { c.copy(z > 0.03 && y < 0.16 ? belly : skinBase); };
    const back = (x, y, z, c) => { c.copy(skinBase); if (z < -0.05) c.lerp(dark, 0.45); };
    const eye = o.ally ? EYE.ally : 0xffd23a;
    const B = { rough: 0.55, v: 0.08, f: 22, k: 0.035 };
    // pot-bellied hunched torso
    r.blob('hips', { t: 'ell', c: [0, -0.005, 0.0], r: [0.09, 0.075, 0.08] }, skinBase.getHex(), B);
    r.blob('spine', { t: 'ell', c: [0, 0.045, 0.035], r: [0.1, 0.095, 0.1] }, skin, { ...B, k: 0.04 });
    r.blob('chest', { t: 'ell', c: [0, 0.075, 0.0], r: [0.105, 0.092, 0.08] }, skin, B);
    r.blob('chest', { t: 'ell', c: [0, 0.11, -0.055], r: [0.085, 0.07, 0.06] }, back, { ...B, k: 0.04, bump: [0.004, 30] }); // hunch
    r.sides((s, k) => r.blob('chest', { t: 'cap', a: [k * 0.03, 0.12, -0.01], b: [k * 0.09, 0.11, -0.005], r0: 0.04, r1: 0.032 }, skinBase.getHex(), B));
    r.blob('neck', { t: 'cap', a: [0, -0.03, -0.01], b: [0, 0.08, 0.02], r0: 0.045, r1: 0.04 }, skinBase.getHex(), B);
    // big head with snout, angry brow and huge ears
    const hc = 0.08, H = { group: 'head', rough: 0.5, v: 0.08, f: 30 };
    r.blob('neck', { t: 'cap', a: [0, 0.04, 0.0], b: [0, 0.1, 0.02], r0: 0.04, r1: 0.04 }, skinBase.getHex(), { ...H, k: 0.03 });
    r.blob('head', { t: 'ell', c: [0, hc + 0.01, -0.015], r: [0.105, 0.095, 0.105] }, skinBase.getHex(), { ...H, k: 0.03 });
    r.blob('head', { t: 'ell', c: [0, hc - 0.035, 0.065], r: [0.072, 0.05, 0.07] }, skin, { ...H, k: 0.03 }); // snout
    r.blob('head', { t: 'ell', c: [0, hc - 0.03, 0.128], r: [0.03, 0.022, 0.016] }, dark.getHex(), { ...H, k: 0.01 }); // nose
    r.sides((s, k) => {
      r.blob('head', { t: 'ell', c: [k * 0.042, hc + 0.045, 0.085], r: [0.04, 0.014, 0.022], rot: [0, 0, k * 0.45] }, dark.getHex(), { ...H, k: 0.012, prio: 1 }); // angry brow
      r.blob('head', { t: 'ell', c: [k * 0.045, hc + 0.022, 0.092], r: [0.024, 0.02, 0.018] }, 0x120402, { ...H, sub: true, k: 0.008 }); // socket
      r.part('head', T(G.sphere(0.019, 7, 5), k * 0.045, hc + 0.022, 0.092), eye, { emis: 4, v: 0, rough: 0.3 });
      r.blob('head', { t: 'cap', a: [k * 0.085, hc + 0.03, -0.02], b: [k * 0.24, hc + 0.08, -0.07], r0: 0.038, r1: 0.005 }, skinBase.getHex(), { ...H, k: 0.02 }); // ear
      r.part('head', G.horn([[k * 0.045, hc + 0.075, 0.0], [k * 0.075, hc + 0.14, -0.04], [k * 0.065, hc + 0.19, -0.1]], 0.02, 0.003, 6, 7), 0x2a1a12, { rough: 0.45 });
    });
    r.blob('jaw', { t: 'ell', c: [0, hc - 0.075, 0.05], r: [0.075, 0.03, 0.065] }, skin, { ...H, k: 0.025 });
    r.blob('head', { t: 'ell', c: [0, hc - 0.06, 0.115], r: [0.06, 0.008, 0.03] }, 0x200806, { ...H, sub: true, k: 0.006 }); // grin
    for (let i = 0; i < 6; i++) r.part('jaw', T(G.cone(0.006, 0.02, 3), -0.03 + i * 0.012, hc - 0.072, 0.105 - Math.abs(i - 2.5) * 0.007), 0xe8e0c0, { rough: 0.5 });
    // skinny limbs
    r.sides((s, k) => {
      r.blob('upperArm' + s, { t: 'cap', a: [0, 0, 0], b: [0, -P.upper + 0.01, 0], r0: 0.032, r1: 0.024 }, skinBase.getHex(), B);
      r.blob('foreArm' + s, { t: 'cap', a: [0, -0.005, 0], b: [0, -P.fore + 0.01, 0], r0: 0.027, r1: 0.02 }, skinBase.getHex(), B);
      r.blob('hand' + s, { t: 'ell', c: [0, -0.03, 0.005], r: [0.024, 0.034, 0.028] }, skinBase.getHex(), { ...B, k: 0.015 });
      for (let i = 0; i < 3; i++) r.part('hand' + s, T(G.cone(0.007, 0.05, 3), -k * 0.004, -0.07, -0.015 + i * 0.015, 0.5, 0, 0), 0x1a100a, { rough: 0.5 });
      r.blob('thigh' + s, { t: 'cap', a: [0, 0, 0], b: [0, -P.thigh + 0.01, 0.01], r0: 0.048, r1: 0.032 }, skinBase.getHex(), B);
      r.blob('shin' + s, { t: 'cap', a: [0, -0.005, 0], b: [0, -P.shin + 0.02, 0], r0: 0.034, r1: 0.024 }, skinBase.getHex(), B);
      r.blob('foot' + s, { t: 'ell', c: [0, -0.015, 0.04], r: [0.036, 0.022, 0.07] }, skinBase.getHex(), { ...B, k: 0.02 });
      for (let i = 0; i < 3; i++) r.part('foot' + s, T(G.cone(0.008, 0.04, 3), -0.02 + i * 0.02, -0.02, 0.11, Math.PI / 2, 0, 0), 0x1a100a, { rough: 0.5 });
    });
    for (let i = 0; i < 3; i++) r.part('chest', T(G.cone(0.014, 0.06, 4), 0, 0.07 + i * 0.045, -0.11, -1.0, 0, 0), 0x2a1410, { rough: 0.5 }); // back spikes
    r.part('hips', T(G.lathe([[0.105, -0.12], [0.098, -0.03], [0.092, 0.02]], 10, -0.9, 1.8), 0, 0, 0), 0x4a3422, { rough: 0.95, v: 0.2 }); // loincloth
    r.part('hips', T(G.lathe([[0.105, -0.1], [0.098, -0.03], [0.092, 0.02]], 10, Math.PI - 0.9, 1.8), 0, 0, 0), 0x4a3422, { rough: 0.95, v: 0.2 });
    let weaponKind = '1h';
    if (shaman) {
      skullStaff(r); weaponKind = 'staff';
      for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.3; r.part('head', T(G.cone(0.02, 0.18, 4), Math.sin(a) * 0.08, hc + 0.14, -0.04 + Math.cos(a) * 0.0, -0.35, 0, -a * 0.9), [0xb02020, 0xd8a020, 0x2a2a2a][i % 3], { rough: 0.9 }); }
      r.part('head', T(G.torus(0.095, 0.013, 4, 16), 0, hc + 0.06, -0.015, Math.PI / 2 + 0.25, 0, 0), 0x6a4a2a, { rough: 0.8 });
      for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; r.part('chest', T(G.sphere(0.015, 5, 4), Math.sin(a) * 0.095, 0.14 - Math.cos(a) * 0.02, Math.cos(a) * 0.075 + 0.01), 0xd8ccb0, { rough: 0.6 }); }
      r.part('chest', T(G.panel(0.2, 0.3, 0.01, 0.03), 0, 0.15, -0.12), 0x3a2a3a, { rough: 0.95, v: 0.2 });
    } else crudeBlade(r);
    const style = IMP_STYLE;
    const clips = clipSet(['idle', 'walk', 'run', 'attack1', 'attack2', 'attack3', 'cast', 'revive', 'hit', 'death'], locoClips(P, style, 0.5, 0.36));
    return r.template({ kind, height: shaman ? 1.0 : 0.92, radius: 0.28, P, style, clips, runAt: 1.8, post: humanoidPost, weaponKind, scale: shaman ? 1.12 : 1, eye });
  });
}

// ------------------------------------------------------------------ brute (Pit Fiend)
const P_BRUTE = { hipY: 1.22, spine: 0.16, chest: 0.36, neck: 0.2, headUp: 0.08, shX: 0.4, shY: 0.3, clavX: 0.1, upper: 0.46, fore: 0.44, thighX: 0.17, thigh: 0.55, shin: 0.55 };
const BRUTE_STYLE = { hunch: 0.22, knee: 0.22, armOut: 0.3, breath: 2.2, wide: 0.06, deathFwd: true, look: 0.5, walk: { amp: 0.34, knee: 0.6, arm: 0.25, lean: 0.08, sway: 0.07 }, run: { amp: 0.55, knee: 1.0, arm: 0.45, lean: 0.25 } };
function bruteTpl(o) {
  return cachedTemplate(`mon:brute:${o.ally ? 'a' : 'm'}`, () => {
    const P = P_BRUTE;
    const r = humanoidRig(P, { jaw: [0.0, 0.04] });
    setSculpt(r, { key: 'brute', voxel: 0.021, tris: 7000, apose: { upperArmL: [0, 0, 0.55], upperArmR: [0, 0, -0.55], thighL: [0, 0, 0.06], thighR: [0, 0, -0.06] }, groups: { head: { voxel: 0.012, tris: 2200 } } });
    standardSockets(r, P, { headC: 0.08, over: 0.5 });
    const eye = o.ally ? EYE.ally : 0xff8a20;
    const rock = new THREE.Color(0x2e2220), rock2 = new THREE.Color(0x4a2a22), lava = new THREE.Color(0xff6a1a);
    // obsidian hide with glowing magma fissures (emissive returned from the color fn)
    const hide = (x, y, z, c) => {
      const n = NOISE.noise3(x * 4.2, y * 4.2, z * 4.2), f = Math.abs(NOISE.noise3(x * 7 + 3, y * 7, z * 7 - 2));
      c.copy(n > 0.25 ? rock2 : rock).multiplyScalar(0.9 + f * 0.6);
    };
    const B = { rough: 0.7, v: 0.1, f: 9, k: 0.07 };
    r.blob('hips', { t: 'box', c: [0, 0, -0.02], s: [0.26, 0.17, 0.2], r: 0.15 }, hide, B);
    r.blob('spine', { t: 'box', c: [0, 0.1, 0.02], s: [0.27, 0.19, 0.22], r: 0.16 }, hide, B);
    r.blob('spine', { t: 'ell', c: [0, 0.06, 0.13], r: [0.2, 0.16, 0.12] }, hide, B); // gut
    r.blob('chest', { t: 'box', c: [0, 0.2, 0.0], s: [0.36, 0.24, 0.24], r: 0.18 }, hide, B);
    r.sides((s, k) => {
      r.blob('chest', { t: 'ell', c: [k * 0.17, 0.27, 0.16], r: [0.17, 0.12, 0.09], rot: [0, 0, k * 0.2] }, hide, { ...B, k: 0.05 }); // pecs
      r.blob('chest', { t: 'ell', c: [k * 0.2, 0.42, -0.06], r: [0.2, 0.13, 0.16] }, hide, { ...B, k: 0.06 }); // massive traps
    });
    r.blob('neck', { t: 'cap', a: [0, -0.05, 0.0], b: [0, 0.13, 0.06], r0: 0.15, r1: 0.13 }, hide, B);
    // small brutish head: brow ridge, tusked jaw
    const hc = 0.08, H = { group: 'head', rough: 0.65, v: 0.1, f: 14 };
    r.blob('neck', { t: 'cap', a: [0, 0.05, 0.02], b: [0, 0.14, 0.06], r0: 0.12, r1: 0.12 }, hide, { ...H, k: 0.05 });
    r.blob('head', { t: 'ell', c: [0, hc, 0.07], r: [0.15, 0.135, 0.155] }, hide, { ...H, k: 0.04 });
    r.blob('head', { t: 'ell', c: [0, hc + 0.055, 0.19], r: [0.14, 0.04, 0.06] }, 0x1a1210, { ...H, k: 0.03, prio: 1 }); // brow ridge
    r.sides((s, k) => {
      r.blob('head', { t: 'ell', c: [k * 0.062, hc + 0.025, 0.215], r: [0.03, 0.022, 0.025] }, 0x0a0402, { ...H, sub: true, k: 0.012 });
      r.part('head', T(G.sphere(0.024, 7, 5), k * 0.062, hc + 0.025, 0.205), eye, { emis: 5, v: 0 });
      r.part('head', G.horn([[k * 0.1, hc + 0.08, 0.06], [k * 0.26, hc + 0.18, 0.0], [k * 0.36, hc + 0.36, 0.06], [k * 0.3, hc + 0.54, 0.2]], 0.065, 0.006, 7, 12), 0x1a1614, { rough: 0.45, v: 0.15 });
      r.part('jaw', T(G.cone(0.024, 0.12, 6), k * 0.075, 0.0, 0.17, -0.3, 0, 0), 0xd8c8a0, { rough: 0.4 });
    });
    r.blob('jaw', { t: 'ell', c: [0, -0.045, 0.11], r: [0.13, 0.065, 0.12] }, hide, { ...H, k: 0.04 });
    // huge arms & legs
    r.sides((s, k) => {
      r.blob('upperArm' + s, { t: 'ell', c: [k * 0.02, -0.02, 0], r: [0.19, 0.17, 0.18] }, hide, B); // shoulder boulder
      r.blob('upperArm' + s, { t: 'cap', a: [0, -0.05, 0], b: [0, -P.upper + 0.05, 0], r0: 0.15, r1: 0.12 }, hide, B);
      r.blob('upperArm' + s, { t: 'ell', c: [0, -P.upper * 0.45, 0.06], r: [0.12, 0.16, 0.1] }, hide, { ...B, k: 0.05 });
      r.blob('foreArm' + s, { t: 'cap', a: [0, -0.02, 0], b: [0, -P.fore + 0.04, 0.01], r0: 0.135, r1: 0.12 }, hide, B);
      r.blob('foreArm' + s, { t: 'ell', c: [0, -0.12, 0.03], r: [0.14, 0.14, 0.12] }, hide, { ...B, k: 0.05 });
      r.blob('hand' + s, { t: 'box', c: [0, -0.08, 0.01], s: [0.09, 0.09, 0.085], r: 0.05 }, hide, { ...B, k: 0.04 });
      for (let i = 0; i < 4; i++) r.part('hand' + s, T(G.cone(0.018, 0.08, 5), -k * 0.02, -0.17, -0.05 + i * 0.033, 0.6, 0, 0), 0x1a1210, { rough: 0.45 });
      for (let i = 0; i < 3; i++) r.part('upperArm' + s, T(G.cone(0.045, 0.22 - i * 0.03, 6), k * 0.07, 0.13, -0.06 + i * 0.06, -0.3 + i * 0.3, 0, -k * 0.5), 0x1a1614, { rough: 0.45 });
      r.part('foreArm' + s, T(G.cyl(0.15, 0.14, 0.18, 14), 0, -0.26, 0.01), 0x3a3634, { rough: 0.5, metal: 0.75, v: 0.2 }); // iron bracer
      r.blob('thigh' + s, { t: 'cap', a: [0, 0, 0], b: [0, -P.thigh + 0.05, 0.02], r0: 0.16, r1: 0.11 }, hide, B);
      r.blob('thigh' + s, { t: 'ell', c: [0, -0.2, 0.05], r: [0.14, 0.2, 0.12] }, hide, { ...B, k: 0.05 });
      r.blob('shin' + s, { t: 'cap', a: [0, 0, 0], b: [0, -P.shin + 0.08, 0], r0: 0.12, r1: 0.085 }, hide, B);
      r.blob('shin' + s, { t: 'ell', c: [0, -0.15, -0.05], r: [0.11, 0.15, 0.1] }, hide, { ...B, k: 0.05 });
      r.blob('foot' + s, { t: 'box', c: [0, -0.04, 0.06], s: [0.1, 0.06, 0.15], r: 0.05 }, 0x1a1614, { ...B, rough: 0.55, k: 0.05 }); // hooves
    });
    for (let i = 0; i < 4; i++) r.part('chest', T(G.cone(0.055, 0.24, 6), 0, 0.15 + i * 0.09, -0.28, -1.1, 0, 0), 0x1a1614, { rough: 0.45 });
    r.part('hips', T(G.lathe([[0.32, -0.38], [0.29, -0.1], [0.28, 0.05]], 12, -0.8, 1.6), 0, 0, 0), 0x3a2416, { rough: 0.95, v: 0.25 });
    const clips = clipSet(['idle', 'walk', 'run', 'attack1', 'attack2', 'slam', 'roar', 'hit', 'death'], locoClips(P, BRUTE_STYLE, 1.3, 0.85));
    return r.template({ kind: 'brute', height: 2.6, radius: 0.7, P, style: BRUTE_STYLE, clips, runAt: 3.4, post: humanoidPost, weaponKind: 'none', scale: 1.08, eye, cracks: { strength: 0.85, scale: 3.1 } });
  });
}

// ------------------------------------------------------------------ wraith
const WRAITH_STYLE = { hunch: 0.18, knee: 0.0, armOut: 0.2, float: 0.42, breath: 0.6, jitter: 0.05, walk: { amp: 0.0, knee: 0.0, arm: 0.12, lean: 0.25 }, run: { amp: 0.0, knee: 0.0, arm: 0.2, lean: 0.4 } };
const WRAITH_DEATH = kclip({ dur: 1.4, hold: true, ground: false, fade: 0.05 }, {
  base: { py: [[0, 0], [1, 1.1, 2]] },
  chest: { x: [[0, 0], [0.3, -0.5], [1, -0.6]] }, head: { x: [[0, 0], [0.3, -0.6], [1, -0.7]] },
  upperArmL: { x: [[0, 0], [0.4, -2.4], [1, -2.6]], z: [[0, 0.2], [1, 0.8]] }, upperArmR: { x: [[0, 0], [0.4, -2.4], [1, -2.6]], z: [[0, -0.2], [1, -0.8]] },
});
function wraithTpl(o) {
  return cachedTemplate(`mon:wraith:${o.ally ? 'a' : 'm'}`, () => {
    const P = { hipY: 0.98, spine: 0.1, chest: 0.21, neck: 0.24, headUp: 0.1, shX: 0.19, shY: 0.19, clavX: 0.05, upper: 0.32, fore: 0.3, thighX: 0.1, thigh: 0.44, shin: 0.42 };
    const r = humanoidRig(P, { jaw: [0.0, 0.02], skirt: { r: 0.13, y: -0.02 } });
    setSculpt(r, { key: 'wraith', voxel: 0.016, tris: 4200, groups: { hood: { voxel: 0.012, tris: 2200 } } });
    standardSockets(r, P);
    const cloth = 0x3a4450, dark = 0x050608, eye = o.ally ? EYE.ally : 0x9ffff0;
    const C = { rough: 0.95, v: 0.18, f: 10, k: 0.06, bump: [0.006, 12, 4, 12] };
    // shrouded torso (no body inside)
    r.blob('chest', { t: 'ell', c: [0, 0.16, -0.01], r: [0.2, 0.22, 0.14] }, cloth, C);
    r.blob('spine', { t: 'ell', c: [0, 0.04, 0], r: [0.16, 0.16, 0.12] }, cloth, C);
    r.blob('hips', { t: 'ell', c: [0, -0.02, 0], r: [0.17, 0.12, 0.13] }, cloth, C);
    r.sides((s, k) => {
      r.blob('upperArm' + s, { t: 'cap', a: [0, 0.0, 0], b: [0, -P.upper + 0.02, 0], r0: 0.075, r1: 0.06 }, cloth, C);
      r.blob('foreArm' + s, { t: 'cap', a: [0, -0.02, 0], b: [0, -P.fore + 0.04, 0.01], r0: 0.06, r1: 0.12 }, cloth, C); // bell sleeve
      r.blob('foreArm' + s, { t: 'cap', a: [0, -0.15, 0], b: [0, -P.fore - 0.04, 0.01], r0: 0.04, r1: 0.1 }, dark, { ...C, sub: true, k: 0.02, bump: null }); // hollow cuff
      r.part('hand' + s, T(G.box(0.045, 0.04, 0.02), 0, -0.02, 0), 0xc8ccc0, { rough: 0.6 });
      for (let i = 0; i < 4; i++) r.part('hand' + s, T(G.cone(0.006, 0.13, 3), -0.018 + i * 0.012, -0.1, 0.02, 0.25, 0, 0), 0xc8ccc0, { rough: 0.5 });
    });
    // deep hood with a void face and two cold eyes
    const Hd = { group: 'hood', rough: 0.95, v: 0.15, f: 12, k: 0.03, bump: [0.004, 14] };
    r.blob('head', { t: 'ell', c: [0, 0.09, -0.02], r: [0.15, 0.16, 0.17] }, cloth, Hd);
    r.blob('head', { t: 'cap', a: [0, 0.14, -0.1], b: [0, 0.2, -0.26], r0: 0.08, r1: 0.02 }, cloth, Hd); // peak
    r.blob('neck', { t: 'cap', a: [0, -0.06, -0.02], b: [0, 0.08, -0.01], r0: 0.16, r1: 0.13 }, cloth, { ...Hd, k: 0.06 });
    r.blob('head', { t: 'ell', c: [0, 0.085, 0.02], r: [0.125, 0.135, 0.14] }, dark, { ...Hd, sub: true, k: 0.012, bump: null });
    r.blob('head', { t: 'ell', c: [0, 0.07, 0.16], r: [0.1, 0.12, 0.08] }, dark, { ...Hd, sub: true, k: 0.015, bump: null });
    r.part('head', T(G.ell(0.1, 0.11, 0.08, 10, 8), 0, 0.075, 0.03), dark, { rough: 1, v: 0 }); // void
    r.sides((s, k) => r.part('head', T(G.ell(0.022, 0.012, 0.01, 6, 4), k * 0.04, 0.08, 0.1), eye, { emis: 6, v: 0 }));
    // tattered robe strips on skirt bones
    const prof = [[0.34, -1.05], [0.26, -0.55], [0.17, 0.0]];
    for (const [b, ph] of [['skirtF', 0], ['skirtL', Math.PI / 2], ['skirtB', Math.PI], ['skirtR', Math.PI * 1.5]]) {
      const off = { skirtF: [0, 0.02, -0.13], skirtB: [0, 0.02, 0.13], skirtL: [-0.13, 0.02, 0], skirtR: [0.13, 0.02, 0] }[b];
      const g = G.lathe(prof, 6, ph - Math.PI / 4 - 0.2, Math.PI / 2 + 0.4);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.6) p.setY(i, y - Math.abs(Math.sin(Math.atan2(p.getX(i), p.getZ(i)) * 7)) * 0.25); }
      g.computeVertexNormals();
      r.part(b, T(g, ...off), (x, y, z, c) => c.set(cloth).multiplyScalar(0.5 + 0.5 * Math.min(1, (y + 1.3) / 1.3)), { rough: 0.95, v: 0.2 });
    }
    const clips = clipSet(['idle', 'walk', 'run', 'attack1', 'cast', 'cast2', 'hit', 'death'], { walk: Object.assign({}, HUMANOID_CLIPS.walk, { moveSpeed: 2.0 }), run: Object.assign({}, HUMANOID_CLIPS.run, { moveSpeed: 4.0 }), death: WRAITH_DEATH, attack1: HUMANOID_CLIPS.attack2 });
    return r.template({
      kind: 'wraith', height: 1.95, radius: 0.36, P, style: WRAITH_STYLE, clips, runAt: 3.0, post: humanoidPost, weaponKind: 'none', ghost: true,
      rim: [new THREE.Color(o.ally ? 0x60ffd0 : 0x7fc8ff).multiplyScalar(1.1), 1.0], springs: SKIRT_SPRINGS, eye,
      tick: (m) => { if (m.current === 'death') m.setOpacity(Math.max(0, 1 - m._u * 1.1)); },
    });
  });
}

// ------------------------------------------------------------------ spider
function spiderTpl(o) {
  return cachedTemplate(`mon:spider:${o.ally ? 'a' : 'm'}`, () => {
    const r = new Rig();
    r.bone('base', null, 0, 0, 0);
    r.bone('body', 'base', 0, 0.42, 0);
    r.bone('head', 'body', 0, 0.02, 0.2);
    r.bone('abdomen', 'body', 0, 0.06, -0.14);
    const LZ = [0.13, 0.05, -0.03, -0.11], YAW = [-0.85, -0.3, 0.25, 0.8];
    const FEM = 0.32, TIB = 0.62;
    r.sides((s, k) => {
      for (let i = 0; i < 4; i++) {
        r.bone(`hip${s}${i}`, 'body', k * 0.1, -0.02, LZ[i], 0, k * YAW[i], 0);
        r.bone(`fem${s}${i}`, `hip${s}${i}`, k * 0.05, 0.0, 0, 0, 0, k * 2.27);
        r.bone(`tib${s}${i}`, `fem${s}${i}`, 0, -FEM, 0, 0, 0, -k * 1.95);
      }
    });
    const chit = 0x231a16, eye = o.ally ? EYE.ally : 0xff2a1a;
    r.part('body', T(G.ell(0.15, 0.1, 0.19, 12, 8), 0, 0, 0.04), chit, { rough: 0.38, v: 0.15 });
    r.part('abdomen', T(G.ell(0.21, 0.18, 0.27, 14, 10), 0, 0.05, -0.2), (x, y, z, c) => {
      c.set(0x2a1e18); const m = Math.abs(x) < 0.035 + Math.sin(z * 22) * 0.02 && y > 0.13 ? 1 : 0; if (m) c.set(0x7a140c);
    }, { rough: 0.4, v: 0.12, bump: [0.008, 22], emis: 0.3 });
    r.part('head', T(G.ell(0.1, 0.08, 0.1, 10, 7), 0, 0.0, 0.02), chit, { rough: 0.38 });
    for (let i = 0; i < 6; i++) { const a = (i - 2.5) * 0.28; r.part('head', T(G.sphere(i % 2 ? 0.014 : 0.02, 5, 4), Math.sin(a) * 0.065, 0.05 + (i % 2) * 0.02, 0.085 + Math.cos(a) * 0.01), eye, { emis: 5, v: 0 }); }
    r.sides((s, k) => {
      r.part('head', T(G.cone(0.018, 0.1, 4), k * 0.035, -0.07, 0.1, 2.6, 0, 0), 0xc8b890, { rough: 0.4 }); // fangs
      r.part('head', G.limb(0.014, 0.01, 0.12, 4).rotateX(-1.3).translate(k * 0.06, -0.02, 0.08), chit, { rough: 0.5 }); // palps
      for (let i = 0; i < 4; i++) {
        r.part(`fem${s}${i}`, T(G.sphere(0.028, 6, 4), 0, 0, 0), chit, { rough: 0.4 });
        r.part(`fem${s}${i}`, G.limb(0.024, 0.018, FEM, 6), chit, { rough: 0.4, bump: [0.004, 30] });
        r.part(`tib${s}${i}`, T(G.sphere(0.02, 5, 4), 0, 0, 0), 0x3a2620, { rough: 0.4 });
        r.part(`tib${s}${i}`, G.limb(0.018, 0.006, TIB, 6), chit, { rough: 0.4, bump: [0.003, 30] });
      }
    });
    const legs = (m, fn) => { for (let i = 0; i < 4; i++) { fn(m.B['hipL' + i], m.B['femL' + i], m.B['tibL' + i], 1, i); fn(m.B['hipR' + i], m.B['femR' + i], m.B['tibR' + i], -1, i); } };
    const gait = (m, u, A, L) => legs(m, (h, f, tb, k, i) => {
      const ph = ((i + (k > 0 ? 0 : 1)) % 2) * 0.5; const s = (u + ph) % 1;
      let fwd, lift = 0;
      if (s < 0.5) fwd = A * (1 - 4 * s); else { fwd = A * (-1 + 4 * (s - 0.5)); lift = Math.sin((s - 0.5) * 2 * Math.PI) * L; }
      m.r(h, 0, -k * fwd, 0); m.r(f, 0, 0, k * lift); m.r(tb, 0, 0, -k * lift * 0.6);
    });
    const clips = {
      idle: { dur: 2.6, loop: true, fn(m, u, t) { const b = Math.sin(u * TAU); m.p(m.B.body, 0, b * 0.012, 0); m.r(m.B.abdomen, b * 0.05, 0, 0); m.r(m.B.head, 0, NOISE.noise2(t * 0.8, m.seed) * 0.2, 0); legs(m, (h, f, tb, k, i) => m.r(h, 0, NOISE.noise2(t * 1.3 + i, k + m.seed) * 0.08, 0)); } },
      walk: { dur: 0.7, loop: true, moveSpeed: 1.8, steps: [0, 0.5], fn(m, u) { gait(m, u, 0.28, 0.45); m.p(m.B.body, 0, Math.abs(Math.sin(u * TAU * 2)) * 0.02, 0); m.r(m.B.abdomen, Math.sin(u * TAU * 2) * 0.04, Math.sin(u * TAU) * 0.08, 0); } },
      run: { dur: 0.42, loop: true, moveSpeed: 4.6, steps: [0, 0.5], fn(m, u) { gait(m, u, 0.38, 0.6); m.r(m.B.body, 0.06, 0, 0); m.p(m.B.body, 0, Math.abs(Math.sin(u * TAU * 2)) * 0.03, 0); m.r(m.B.abdomen, Math.sin(u * TAU * 2) * 0.06, Math.sin(u * TAU) * 0.1, 0); } },
      attack1: kclip({ dur: 0.7, impact: 0.5, extra: (m, u) => legs(m, (h, f, tb, k, i) => { if (i === 0) { const a = K(u, [[0, 0], [0.35, 0.8], [0.55, 0.3], [1, 0]]); m.r(f, 0, 0, k * a); m.r(h, 0, -k * a * 0.3, 0); } }) }, {
        body: { x: [[0, 0], [0.35, -0.45, 2], [0.52, 0.15, 3], [1, 0]], pz: [[0, 0], [0.35, -0.08], [0.52, 0.22, 3], [0.7, 0.15], [1, 0]], py: [[0, 0], [0.35, 0.12], [0.52, -0.03], [1, 0]] },
        head: { x: [[0, 0], [0.35, -0.3], [0.52, 0.35, 3], [1, 0]] }, abdomen: { x: [[0, 0], [0.35, 0.35], [0.52, -0.2], [1, 0]] },
      }),
      hit: kclip({ dur: 0.3, fade: 0.05 }, { body: { x: [[0, 0], [0.25, -0.25, 2], [1, 0]], pz: [[0, 0], [0.25, -0.08], [1, 0]] }, abdomen: { x: [[0, 0], [0.25, 0.2], [1, 0]] } }),
      death: kclip({ dur: 1.0, hold: true, ground: false, extra: (m, u) => legs(m, (h, f, tb, k, i) => { const c = K(u, [[0, 0], [0.4, 0.4], [1, 1]]); m.r(f, 0, 0, k * c * 1.0 + Math.sin(u * 40 + i) * (1 - u) * 0.3); m.r(tb, 0, 0, -k * c * 1.6); }) }, {
        base: { z: [[0, 0], [0.25, 0.3], [0.55, Math.PI, 3], [1, Math.PI]], py: [[0, 0], [0.3, 0.35], [0.55, 0.62], [1, 0.62]] },
        abdomen: { x: [[0, 0], [1, 0.3]] },
      }),
    };
    return r.template({ kind: 'spider', height: 0.8, radius: 0.55, clips, runAt: 3.0, P: null, style: {}, eye });
  });
}

// ------------------------------------------------------------------ bat
function batTpl(o) {
  return cachedTemplate(`mon:bat:${o.ally ? 'a' : 'm'}`, () => {
    const r = new Rig();
    r.bone('base', null, 0, 0, 0);
    r.bone('body', 'base', 0, 1.45, 0);
    r.bone('head', 'body', 0, 0.05, 0.1);
    r.sides((s, k) => { r.bone('wing' + s + '1', 'body', k * 0.06, 0.03, 0); r.bone('wing' + s + '2', 'wing' + s + '1', k * 0.2, 0, 0); });
    const fur = 0x3a2a24, mem = 0x4a2a28, eye = o.ally ? EYE.ally : 0xff3020;
    r.part('body', T(G.ell(0.07, 0.065, 0.12, 10, 7), 0, 0, -0.01), fur, { rough: 0.9, bump: [0.006, 30] });
    r.part('head', T(G.ell(0.055, 0.05, 0.06, 8, 6), 0, 0, 0.02), fur, { rough: 0.9 });
    r.sides((s, k) => {
      r.part('head', T(G.cone(0.025, 0.08, 4), k * 0.035, 0.06, 0.0, 0, 0, -k * 0.35), fur, { rough: 0.9 });
      r.part('head', T(G.sphere(0.012, 5, 4), k * 0.022, 0.012, 0.065), eye, { emis: 5, v: 0 });
      r.part('head', T(G.cone(0.006, 0.025, 3), k * 0.012, -0.03, 0.07, Math.PI, 0, 0), 0xe8e0d0, { rough: 0.4 });
      // membranes: triangles fan from shoulder
      const memG = (x0, x1, span) => { const g = new THREE.BufferGeometry(); const v = []; const pts = [[0, 0, 0.04], [k * span, 0.02, 0.02], [k * span * 0.85, 0, -0.1], [k * span * 0.5, 0, -0.16], [k * span * 0.15, 0, -0.13], [0, 0, -0.06]]; for (let i = 1; i < pts.length - 1; i++) v.push(...pts[0], ...(k > 0 ? pts[i + 1] : pts[i]), ...(k > 0 ? pts[i] : pts[i + 1])); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals(); return g; };
      r.part('wing' + s + '1', toIndexed(memG(0, 0.2, 0.2)), mem, { rough: 0.8, v: 0.1 });
      r.part('wing' + s + '1', toIndexed(flipNI(memG(0, 0.2, 0.2))), mem, { rough: 0.8 });
      r.part('wing' + s + '2', toIndexed(memG(0, 0.26, 0.26)), mem, { rough: 0.8, v: 0.1 });
      r.part('wing' + s + '2', toIndexed(flipNI(memG(0, 0.26, 0.26))), mem, { rough: 0.8 });
      r.part('wing' + s + '1', T(G.cyl(0.008, 0.006, 0.2, 4), k * 0.1, 0.0, 0.03, 0, 0, Math.PI / 2), fur, { rough: 0.8 });
      r.part('wing' + s + '2', T(G.cyl(0.006, 0.003, 0.26, 4), k * 0.13, 0.0, 0.02, 0, 0, Math.PI / 2), fur, { rough: 0.8 });
    });
    const flap = (m, u, amp, t) => { const s = Math.sin(u * TAU); m.r(m.B.wingL1, 0, 0, s * amp); m.r(m.B.wingR1, 0, 0, -s * amp); m.r(m.B.wingL2, 0, 0, Math.sin(u * TAU - 0.8) * amp * 0.7); m.r(m.B.wingR2, 0, 0, -Math.sin(u * TAU - 0.8) * amp * 0.7); m.p(m.B.body, 0, -s * 0.05 + NOISE.noise2(t * 1.7, m.seed) * 0.12, 0); m.r(m.B.body, NOISE.noise2(t * 2, m.seed + 3) * 0.2, 0, NOISE.noise2(t * 2.3, m.seed + 7) * 0.25); };
    const fly = { dur: 0.26, loop: true, moveSpeed: 4, steps: [0.5], fn(m, u, t) { flap(m, u, 0.9, t); } };
    const clips = {
      idle: fly, walk: fly, run: fly, fly,
      attack1: kclip({ dur: 0.6, impact: 0.5, extra: (m, u, t) => flap(m, (t / 0.2) % 1, 0.7, t) }, { body: { x: [[0, 0], [0.35, -0.4], [0.5, 0.7, 3], [1, 0]], py: [[0, 0], [0.35, 0.15], [0.5, -0.55, 3], [1, 0]], pz: [[0, 0], [0.5, 0.35, 3], [1, 0]] }, head: { x: [[0, 0], [0.5, 0.4], [1, 0]] } }),
      hit: kclip({ dur: 0.25, fade: 0.04 }, { body: { x: [[0, 0], [0.2, -0.6, 2], [1, 0]], py: [[0, 0], [0.2, 0.15], [1, 0]] } }),
      death: kclip({ dur: 0.8, hold: true, ground: false }, { base: { py: [[0, 0], [0.1, 0.08], [0.7, -1.38, 3], [1, -1.38]] }, body: { z: [[0, 0], [0.7, 2.6], [1, 2.8]], x: [[0, 0], [1, 0.4]] }, wingL1: { z: [[0, 0], [0.5, -1.0], [1, 0.4]] }, wingR1: { z: [[0, 0], [0.5, 1.0], [1, -0.4]] }, wingL2: { z: [[0, 0], [1, -1.4]] }, wingR2: { z: [[0, 0], [1, 1.4]] } }),
    };
    return r.template({ kind: 'bat', height: 1.6, radius: 0.3, clips, runAt: 99, P: null, style: {}, eye, scale: 1.25 });
  });
}
function toIndexed(g) { const n = g.attributes.position.count; const idx = new Uint16Array(n); for (let i = 0; i < n; i++) idx[i] = i; g.setIndex(new THREE.BufferAttribute(idx, 1)); return g; }
function flipNI(g) { const p = g.attributes.position.array; for (let i = 0; i < p.length; i += 9) for (let j = 0; j < 3; j++) { const t = p[i + 3 + j]; p[i + 3 + j] = p[i + 6 + j]; p[i + 6 + j] = t; } g.computeVertexNormals(); return g; }

// ------------------------------------------------------------------ bone golem
const P_GOLEM = { hipY: 1.0, spine: 0.15, chest: 0.33, neck: 0.12, headUp: 0.05, shX: 0.42, shY: 0.26, clavX: 0.12, upper: 0.42, fore: 0.45, thighX: 0.17, thigh: 0.42, shin: 0.42 };
const GOLEM_STYLE = { hunch: 0.25, knee: 0.18, armOut: 0.25, breath: 1.2, wide: 0.05, deathFwd: true, walk: { amp: 0.33, knee: 0.6, arm: 0.2, lean: 0.06, sway: 0.08 }, run: { amp: 0.5, knee: 1.0, arm: 0.4, lean: 0.2 } };
function golemTpl(o) {
  return cachedTemplate('mon:bone_golem', () => {
    const P = P_GOLEM;
    const r = humanoidRig(P, { jaw: [0.0, 0.03] });
    standardSockets(r, P, { headC: 0.07, over: 0.45 });
    const bc = 0xcbbf9e, core = 0x5affa8;
    const bundle = (bone, len, rad, n, seed) => { for (let i = 0; i < n; i++) { const a = i / n * TAU + seed; r.part(bone, T(G.limb(rad, rad * 0.8, len, 5), Math.cos(a) * rad * 1.5, 0, Math.sin(a) * rad * 1.5, Math.sin(a + seed) * 0.08, 0, Math.cos(a) * 0.08), bc, { rough: 0.6, v: 0.18 }); r.part(bone, T(G.sphere(rad * 1.35, 6, 4), Math.cos(a) * rad * 1.5, -len, Math.sin(a) * rad * 1.5), bc, { rough: 0.6 }); } };
    // ribcage torso w/ glowing core
    for (let i = 0; i < 6; i++) r.part('chest', T(G.torus(0.22 + Math.sin(i / 5 * Math.PI) * 0.06, 0.024, 5, 14, Math.PI * 1.6), 0, 0.04 + i * 0.06, 0, Math.PI / 2, 0, Math.PI * 0.2 + Math.PI, 1, 0.78, 1), bc, { rough: 0.6, v: 0.15 });
    r.part('chest', T(G.ico(0.11, 1), 0, 0.17, 0.0), core, { emis: 3.5, rough: 0.3, v: 0 });
    for (let i = 0; i < 5; i++) r.part('chest', T(G.cyl(0.05, 0.05, 0.07, 6), 0, 0.02 + i * 0.07, -0.13), bc, { rough: 0.6 });
    for (let i = 0; i < 5; i++) r.part('chest', T(G.cone(0.03, 0.25, 4), (i - 2) * 0.07, 0.3, -0.18, -0.9 - Math.abs(i - 2) * 0.1, 0, (i - 2) * 0.2), bc, { rough: 0.55 });
    r.part('hips', T(G.torus(0.17, 0.05, 5, 12), 0, 0, 0, Math.PI / 2 - 0.3, 0, 0, 1.1, 0.8, 1), bc, { rough: 0.6 });
    for (let i = 0; i < 3; i++) r.part('spine', T(G.cyl(0.06, 0.06, 0.06, 6), 0, 0.02 + i * 0.06, -0.06), bc, { rough: 0.6 });
    // skull cluster head and shoulders
    const skullAt = (bone, x, y, z, s, ry = 0) => {
      r.part(bone, T(G.ell(0.09 * s, 0.095 * s, 0.1 * s, 9, 7), x, y, z), bc, { rough: 0.6, v: 0.12 });
      r.sides((e, j) => r.part(bone, T(G.sphere(0.026 * s, 5, 4), x + j * 0.035 * s, y - 0.005, z + 0.085 * s), 0x061008, { rough: 1, v: 0 }));
      r.sides((e, j) => r.part(bone, T(G.sphere(0.012 * s, 5, 4), x + j * 0.035 * s, y - 0.005, z + 0.095 * s), core, { emis: 4, v: 0 }));
    };
    skullAt('head', 0, 0.06, 0.02, 1.1);
    r.sides((s, k) => { skullAt('clav' + s, k * 0.25, 0.08, 0.0, 1.0); skullAt('clav' + s, k * 0.33, 0.0, -0.08, 0.85); });
    r.sides((s, k) => {
      bundle('upperArm' + s, P.upper, 0.035, 4, k);
      bundle('foreArm' + s, P.fore, 0.04, 4, k + 1);
      r.part('hand' + s, T(G.ell(0.13, 0.12, 0.12, 9, 7), 0, -0.08, 0.02), bc, { rough: 0.6, bump: [0.02, 10] });
      for (let i = 0; i < 4; i++) r.part('hand' + s, T(G.cone(0.02, 0.09, 4), -0.07 + i * 0.045, -0.18, 0.06, 0.5, 0, 0), bc, { rough: 0.55 });
      bundle('thigh' + s, P.thigh, 0.04, 4, k + 2);
      bundle('shin' + s, P.shin, 0.035, 4, k + 3);
      r.part('foot' + s, T(G.rbox(0.16, 0.08, 0.26, 0.03), 0, -0.03, 0.05), bc, { rough: 0.6 });
    });
    const clips = clipSet(['idle', 'walk', 'run', 'attack1', 'slam', 'hit', 'death', 'spawn'], Object.assign(locoClips(P, GOLEM_STYLE, 1.25, 0.8), { death: SKEL_DEATH, attack2: HUMANOID_CLIPS.slam }));
    return r.template({ kind: 'bone_golem', height: 2.4, radius: 0.6, P, style: GOLEM_STYLE, clips, runAt: 3.2, post: humanoidPost, weaponKind: 'none', scale: 1.1, rim: [new THREE.Color(0x3aff9a), 0.12] });
  });
}

// ------------------------------------------------------------------ Hollow King (act boss)
const P_KING = { hipY: 1.95, spine: 0.26, chest: 0.58, neck: 0.46, headUp: 0.14, shX: 0.55, shY: 0.42, clavX: 0.14, upper: 0.66, fore: 0.6, thighX: 0.25, thigh: 0.92, shin: 0.9 };
const KING_STYLE = { hunch: 0.1, knee: 0.14, armOut: 0.22, breath: 0.9, wide: 0.04, deathFwd: true, walk: { amp: 0.3, knee: 0.55, arm: 0.18, lean: 0.06, sway: 0.04 }, run: { amp: 0.5, knee: 1.0, arm: 0.35, lean: 0.3 } };
const KING_CAST = kclip({ dur: 1.4, impact: 0.6, base: (m) => standBody(m, m.tpl.style) }, {
  upperArmR: { x: [[0, -0.5], [0.42, -3.0, 2], [0.6, -0.9, 3], [0.85, -0.85], [1, -0.5]], z: [[0, -0.06], [0.42, -0.1], [0.6, 0.15], [1, -0.06]] },
  foreArmR: { x: [[0, -0.95], [0.42, -0.2], [0.6, -0.1], [1, -0.95]] }, handR: { x: [[0, 0.35], [0.42, 0.1], [0.6, 1.6, 3], [0.85, 1.5], [1, 0.35]] },
  upperArmL: { x: [[0, -0.55], [0.42, -2.9, 2], [0.6, -0.95, 3], [1, -0.55]], z: [[0, -0.18], [0.42, -0.25], [0.6, -0.45], [1, -0.18]] },
  foreArmL: { x: [[0, -1.05], [0.42, -0.3], [0.6, -0.4], [1, -1.05]] },
  chest: { x: [[0, 0], [0.42, -0.3], [0.6, 0.55, 3], [0.85, 0.5], [1, 0]] }, spine: { x: [[0, 0], [0.6, 0.25, 3], [1, 0]] },
  head: { x: [[0, 0], [0.42, -0.4], [0.6, 0.1], [1, 0]] }, jaw: { x: [[0, 0], [0.4, 0.5], [0.7, 0.3], [1, 0]] },
  thighL: { x: [[0, 0], [0.6, -0.6], [1, 0]] }, shinL: { x: [[0, 0], [0.6, 0.9], [1, 0]] }, thighR: { x: [[0, 0], [0.6, 0.2], [1, 0]] }, shinR: { x: [[0, 0], [0.6, 0.6], [1, 0]] },
  hips: { py: [[0, 0], [0.42, 0.05], [0.6, -0.25, 3], [1, 0]] },
});
const KING_DEATH = kclip({ dur: 2.6, hold: true, ground: false, fade: 0.08, extra: (m, u, t) => { if (u < 0.45) { m.r(m.B.chest, Math.sin(t * 50) * 0.03, 0, 0); } } }, {
  base: { x: [[0, 0], [0.45, 0], [0.75, 1.25, 3], [0.82, 1.15], [0.88, 1.25], [1, 1.25]], py: [[0, 0], [0.3, -1.2, 2], [0.45, -1.15], [0.75, -0.55], [1, -0.55]] },
  thighL: { x: [[0, 0], [0.3, -1.6, 2], [1, -1.4]] }, shinL: { x: [[0, 0], [0.3, 2.4, 2], [1, 2.2]] },
  thighR: { x: [[0, 0], [0.3, -0.5, 2], [1, -0.6]] }, shinR: { x: [[0, 0], [0.3, 2.0, 2], [1, 2.2]] },
  footL: { x: [[0, 0], [0.3, -0.8], [1, -0.8]] }, footR: { x: [[0, 0], [0.3, 0.8], [1, 0.9]] },
  chest: { x: [[0, 0], [0.3, 0.35], [0.45, -0.25], [0.75, 0.3], [1, 0.25]] }, head: { x: [[0, 0], [0.3, 0.4], [0.45, -0.6], [0.8, 0.2], [1, 0.1]], y: [[0, 0], [1, 0.5]] },
  jaw: { x: [[0, 0], [0.4, 0.8], [1, 0.5]] },
  upperArmR: { x: [[0, -0.5], [0.3, -0.4], [0.6, -1.4], [1, -2.4]], z: [[0, -0.06], [1, -0.4]] }, foreArmR: { x: [[0, -0.95], [1, -0.2]] },
  upperArmL: { x: [[0, -0.55], [0.3, 0.0], [0.45, -2.6], [0.75, -2.0], [1, -2.6]], z: [[0, -0.18], [0.45, 0.4], [1, 0.5]] },
});
function kingTpl(o) {
  return cachedTemplate('mon:hollow_king', () => {
    const P = P_KING;
    const r = humanoidRig(P, { jaw: [0.03, 0.05], skirt: { r: 0.26, y: -0.04 } });
    setSculpt(r, { key: 'hollow_king', voxel: 0.028, tris: 7000, apose: { upperArmL: [0, 0, 0.5], upperArmR: [0, 0, -0.5], thighL: [0, 0, 0.05], thighR: [0, 0, -0.05] }, groups: { head: { voxel: 0.016, tris: 3600 }, armor: { voxel: 0.026, tris: 7000 } } });
    standardSockets(r, P, { headC: 0.15, over: 0.9 });
    r.socket('crown', 'head', 0, 0.36, 0);
    const bone = new THREE.Color(0xcfc3a3), boneD = new THREE.Color(0x8a7a5c), gold = 0xb08a3a, fire = 0xff6a1a;
    const iron = new THREE.Color(0x34302e), rustC = new THREE.Color(0x5a3a24);
    const rust = (x, y, z, c) => { const n = NOISE.noise3(x * 4, y * 4, z * 4); c.copy(n > 0.28 ? rustC : iron).multiplyScalar(0.85 + NOISE.noise3(x * 13, y * 13, z * 13) * 0.2); };
    const aged = (x, y, z, c) => { const n = NOISE.noise3(x * 6, y * 6, z * 6); c.copy(bone).lerp(boneD, Math.max(0, n) * 0.8); };
    const Bn = { rough: 0.55, v: 0.1, f: 8, k: 0.05 };
    const A = { group: 'armor', rough: 0.42, metal: 0.82, v: 0.08, f: 6, k: 0.06 };
    // ---- skeleton: pelvis, spine column, limb bones (skinned, smooth joints)
    r.blob('hips', { t: 'ell', c: [0, 0.0, -0.02], r: [0.3, 0.2, 0.22] }, aged, Bn);
    r.sides((s, k) => r.blob('hips', { t: 'ell', c: [k * 0.2, 0.08, -0.03], r: [0.14, 0.16, 0.08], rot: [0, k * 0.5, 0] }, aged, Bn)); // iliac wings
    for (let i = 0; i < 4; i++) r.blob('spine', { t: 'ell', c: [0, 0.03 + i * 0.075, -0.1], r: [0.075, 0.04, 0.07] }, aged, { ...Bn, k: 0.03 });
    for (let i = 0; i < 6; i++) r.blob('chest', { t: 'ell', c: [0, 0.03 + i * 0.09, -0.16], r: [0.08, 0.045, 0.075] }, aged, { ...Bn, k: 0.03 });
    r.blob('neck', { t: 'cap', a: [0, -0.05, -0.04], b: [0, 0.3, 0.0], r0: 0.09, r1: 0.075 }, aged, Bn);
    r.sides((s, k) => {
      r.blob('upperArm' + s, { t: 'cap', a: [0, -0.05, 0], b: [0, -P.upper + 0.05, 0], r0: 0.075, r1: 0.06 }, aged, Bn);
      r.blob('foreArm' + s, { t: 'ell', c: [0, 0, 0], r: [0.1, 0.1, 0.1] }, aged, Bn);
      r.blob('foreArm' + s, { t: 'cap', a: [0.025, -0.05, 0], b: [0.025, -P.fore + 0.05, 0], r0: 0.05, r1: 0.04 }, aged, { ...Bn, k: 0.03 });
      r.blob('foreArm' + s, { t: 'cap', a: [-0.025, -0.05, 0], b: [-0.025, -P.fore + 0.05, 0], r0: 0.045, r1: 0.04 }, aged, { ...Bn, k: 0.03 });
      r.blob('thigh' + s, { t: 'cap', a: [0, -0.04, 0], b: [0, -P.thigh + 0.06, 0], r0: 0.11, r1: 0.085 }, aged, Bn);
      r.blob('shin' + s, { t: 'cap', a: [0, -0.06, 0], b: [0, -P.shin + 0.06, 0], r0: 0.085, r1: 0.07 }, aged, Bn);
    });
    // ---- armor layer: breastplate, gorget, pauldrons, gauntlets, greaves, sabatons
    r.blob('chest', { t: 'ell', c: [0, 0.3, 0.02], r: [0.46, 0.26, 0.32] }, rust, A);
    r.blob('chest', { t: 'ell', c: [0, 0.26, 0.24], r: [0.05, 0.22, 0.1] }, rust, { ...A, k: 0.05 }); // keel ridge
    r.blob('chest', { t: 'cap', a: [0, 0.42, 0.0], b: [0, 0.56, -0.01], r0: 0.23, r1: 0.17 }, rust, { ...A, k: 0.08 }); // gorget
    r.blob('chest', { t: 'box', c: [0, 0.16, -0.12], s: [0.36, 0.14, 0.12], r: 0.1 }, rust, { ...A, k: 0.08 }); // back plate (lower)
    r.sides((s, k) => {
      const U = 'upperArm' + s;
      r.blob(U, { t: 'ell', c: [k * 0.03, 0.07, 0], r: [0.31, 0.24, 0.29], rot: [0, 0, -k * 0.35] }, rust, A);
      r.blob(U, { t: 'ell', c: [k * 0.05, -0.08, 0], r: [0.27, 0.12, 0.26], rot: [0, 0, -k * 0.35] }, rust, { ...A, k: 0.03 });
      r.blob(U, { t: 'ell', c: [k * 0.06, -0.19, 0], r: [0.22, 0.09, 0.22], rot: [0, 0, -k * 0.35] }, rust, { ...A, k: 0.03 });
      r.blob('foreArm' + s, { t: 'cap', a: [0, -0.14, 0], b: [0, -P.fore + 0.02, 0], r0: 0.15, r1: 0.12 }, rust, A); // gauntlet
      r.blob('hand' + s, { t: 'box', c: [0, -0.08, 0.01], s: [0.08, 0.1, 0.085], r: 0.05 }, rust, { ...A, k: 0.05 });
      r.blob('thigh' + s, { t: 'cap', a: [0, -0.15, 0.03], b: [0, -P.thigh + 0.05, 0.03], r0: 0.18, r1: 0.15 }, rust, A); // cuisse
      r.blob('shin' + s, { t: 'ell', c: [0, 0.0, 0.06], r: [0.15, 0.14, 0.14] }, rust, A); // poleyn
      r.blob('shin' + s, { t: 'cap', a: [0, -0.12, 0.02], b: [0, -P.shin + 0.1, 0.02], r0: 0.15, r1: 0.125 }, rust, A); // greave
      r.blob('foot' + s, { t: 'box', c: [0, -0.05, 0.1], s: [0.11, 0.08, 0.22], r: 0.06 }, rust, A); // sabaton
      for (let i = 0; i < 4; i++) r.part(U, T(G.cone(0.05, 0.38 - i * 0.05, 6), k * (0.1 + i * 0.035), 0.25 - i * 0.035, -0.15 + i * 0.1, -0.6 + i * 0.35, 0, -k * 0.6), 0x2a2624, { rough: 0.4, metal: 0.8 });
      r.part(U, T(G.torus(0.3, 0.02, 5, 22), 0, 0.0, 0, Math.PI / 2, 0, -k * 0.35, 1.08, 1.0, 1), gold, { rough: 0.3, metal: 0.9 });
    });
    r.part('chest', T(G.torus(0.44, 0.024, 5, 26), 0, 0.27, 0, Math.PI / 2, 0, 0, 1.06, 0.76, 1), gold, { rough: 0.3, metal: 0.9 });
    r.part('chest', T(G.ell(0.05, 0.07, 0.02, 8, 6), 0, 0.3, 0.335), fire, { emis: 3.5, v: 0 });
    // exposed ribcage over a burning core (rigid rib arcs)
    r.part('spine', T(G.ico(0.13, 1), 0, 0.2, 0.0), fire, { emis: 4, rough: 0.3, v: 0 });
    for (let i = 0; i < 4; i++) r.part('spine', T(G.torus(0.23, 0.026, 5, 14, Math.PI * 1.5), 0, 0.05 + i * 0.07, 0, Math.PI / 2, 0, Math.PI * 0.25 + Math.PI, 1, 0.75, 1), 0xcfc3a3, { rough: 0.6 });
    // pelvis belt + armored skirt (rigid on spring bones)
    r.part('hips', T(G.torus(1, 0.045, 5, 24), 0, 0.06, 0, Math.PI / 2, 0, 0, 0.36, 0.3, 1), gold, { rough: 0.3, metal: 0.9 });
    const tprof = [[0.48, -0.75], [0.4, -0.35], [0.34, 0.02]];
    for (const [b, ph] of [['skirtF', 0], ['skirtL', Math.PI / 2], ['skirtB', Math.PI], ['skirtR', Math.PI * 1.5]]) {
      const off = { skirtF: [0, 0.04, -0.26], skirtB: [0, 0.04, 0.26], skirtL: [-0.26, 0.04, 0], skirtR: [0.26, 0.04, 0] }[b];
      r.part(b, T(G.lathe(tprof, 7, ph - Math.PI / 4 - 0.08, Math.PI / 2 + 0.16), ...off), rust, { rough: 0.5, metal: 0.75 });
      r.part(b, T(flip(G.lathe(tprof, 7, ph - Math.PI / 4 - 0.08, Math.PI / 2 + 0.16)), ...off), 0x120c0a, { rough: 1 });
    }
    // ---- skull: carved sockets, cheekbones, mandible on the jaw bone
    const hc = 0.15, H = { group: 'head', rough: 0.5, v: 0.1, f: 9, k: 0.04 };
    const J = r.defs[r.idx.jaw].pos; const jp = (x, y, z) => [x - J.x, y - J.y, z - J.z];
    r.blob('neck', { t: 'cap', a: [0, 0.12, -0.02], b: [0, 0.32, 0.0], r0: 0.085, r1: 0.08 }, aged, H);
    r.blob('head', { t: 'ell', c: [0, hc + 0.04, -0.03], r: [0.2, 0.22, 0.24] }, aged, H);
    r.blob('head', { t: 'ell', c: [0, hc - 0.08, 0.11], r: [0.15, 0.1, 0.13] }, aged, H);
    r.blob('head', { t: 'ell', c: [0, hc + 0.05, 0.19], r: [0.17, 0.045, 0.06] }, aged, { ...H, k: 0.03 });
    r.sides((s, k) => {
      r.blob('head', { t: 'ell', c: [k * 0.13, hc - 0.05, 0.13], r: [0.065, 0.045, 0.07] }, aged, { ...H, k: 0.03 });
      r.blob('head', { t: 'ell', c: [k * 0.082, hc - 0.005, 0.215], r: [0.062, 0.058, 0.07] }, 0x0a0503, { ...H, sub: true, k: 0.02 });
      r.part('head', T(G.sphere(0.042, 9, 7), k * 0.08, hc - 0.01, 0.2), fire, { emis: 8, v: 0 });
    });
    r.blob('head', { t: 'ell', c: [0, hc - 0.085, 0.235], r: [0.028, 0.045, 0.05] }, 0x0a0503, { ...H, sub: true, k: 0.012 });
    r.blob('jaw', { t: 'ell', c: jp(0, hc - 0.17, 0.1), r: [0.14, 0.05, 0.13] }, aged, H);
    r.blob('jaw', { t: 'ell', c: jp(0, hc - 0.19, 0.2), r: [0.06, 0.04, 0.05] }, aged, { ...H, k: 0.03 });
    for (let i = 0; i < 8; i++) r.part('jaw', T(G.box(0.022, 0.04, 0.02), ...jp(-0.08 + i * 0.023, hc - 0.135, 0.205 - Math.abs(i - 3.5) * 0.012)), 0xe8e0c8, { rough: 0.5 });
    for (let i = 0; i < 8; i++) r.part('head', T(G.box(0.022, 0.035, 0.02), -0.08 + i * 0.023, hc - 0.115, 0.215 - Math.abs(i - 3.5) * 0.012), 0xe8e0c8, { rough: 0.5 });
    // burning crown
    r.part('head', T(G.torus(0.21, 0.035, 6, 24), 0, hc + 0.17, -0.02, Math.PI / 2 + 0.1, 0, 0), gold, { rough: 0.25, metal: 0.95 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      r.part('head', T(G.cone(0.04, 0.22 + (i % 2) * 0.1, 5), Math.sin(a) * 0.21, hc + 0.3 + (i % 2) * 0.05, Math.cos(a) * 0.2 - 0.02, Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25), gold, { rough: 0.3, metal: 0.9 });
      r.part('head', T(G.ico(0.03, 0), Math.sin(a) * 0.23, hc + 0.43 + (i % 2) * 0.1, Math.cos(a) * 0.22 - 0.02), fire, { emis: 6, v: 0, flat: true });
    }
    greatsword(r);
    const clips = clipSet(['idle', 'walk', 'run', 'attack1', 'attack2', 'cast', 'slam', 'summon', 'charge', 'roar', 'hit', 'death'], Object.assign(locoClips(P, KING_STYLE, 1.6, 0.9), { cast: KING_CAST, death: KING_DEATH }));
    const cape = { bone: 'chest', a0: [0.42, 0.56, -0.28], a1: [-0.42, 0.56, -0.28], width: 0.95, length: 2.4, cols: 7, rows: 9, color: 0x4a0c10, rough: 0.85, taper: -0.4, tatter: true, body: [{ bone: 'chest', x: 0, y: 0.3, z: 0, r: 0.5 }, { bone: 'hips', x: 0, y: -0.1, z: 0, r: 0.5 }, { bone: 'spine', x: 0, y: 0.1, z: 0, r: 0.45 }] };
    return r.template({ kind: 'hollow_king', height: 4.2, radius: 1.2, P, style: KING_STYLE, clips, runAt: 4.0, post: humanoidPost, weaponKind: '2h', scale: 1.05, springs: SKIRT_SPRINGS, cape, rim: [new THREE.Color(0xff6a2a), 0.35], cracks: { strength: 0.45, scale: 2.2, color: new THREE.Color(3.4, 1.0, 0.25) } });
  });
}

// ------------------------------------------------------------------ ancestor (spectral barbarian minion)
function spectralAxe() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0x9ad8ff, emissive: 0x4aa8ff, emissiveIntensity: 1.6, transparent: true, opacity: 0.75, roughness: 0.3, metalness: 0.2, depthWrite: false });
  m.userData.wasTransparent = true;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 1.15, 6), m); shaft.position.y = 0.35; g.add(shaft);
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.quadraticCurveTo(0.22, 0.05, 0.3, 0.22); shape.lineTo(0.3, -0.12); shape.quadraticCurveTo(0.2, -0.06, 0, -0.1); shape.lineTo(0, 0);
  const head = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }), m); head.position.set(0.0, 0.82, -0.01); g.add(head);
  return g;
}
function ancestorModel(o) {
  const m = new CharacterModel(heroTemplate('barbarian', { armor: { kind: 'chain', tier: 1, color: 0x9ab8d8 }, helm: false }), Object.assign({}, o, { ghost: true }));
  m.kind = 'ancestor';
  m.setRim(new THREE.Color(0x7ac8ff).multiplyScalar(1.4), 1.0);
  m.setEquipment({ weapon: spectralAxe(), weaponKind: '2h' });
  if (m.cape) { m.cape.mat.transparent = true; m.cape.mat.opacity = 0.35; m.cape.mat.emissive = new THREE.Color(0x2a5a8a); m.cape.mesh.castShadow = false; }
  return m;
}

// ------------------------------------------------------------------ public
export const MONSTER_KINDS = ['zombie', 'skeleton', 'skeleton_archer', 'skeleton_mage', 'imp', 'imp_shaman', 'spider', 'wraith', 'brute', 'bat', 'hollow_king', 'bone_golem', 'ancestor'];
export function createMonster(kind, opts = {}) {
  let tpl;
  switch (kind) {
    case 'skeleton': case 'skeleton_archer': case 'skeleton_mage': tpl = skeletonKind(kind, opts); break;
    case 'zombie': tpl = zombieTpl(opts); break;
    case 'imp': case 'imp_shaman': tpl = impTpl(kind, opts); break;
    case 'brute': tpl = bruteTpl(opts); break;
    case 'wraith': tpl = wraithTpl(opts); break;
    case 'spider': tpl = spiderTpl(opts); break;
    case 'bat': tpl = batTpl(opts); break;
    case 'bone_golem': tpl = golemTpl(opts); break;
    case 'hollow_king': tpl = kingTpl(opts); break;
    case 'ancestor': return ancestorModel(opts);
    default: tpl = skeletonKind('skeleton', opts);
  }
  const m = new CharacterModel(tpl, opts);
  if (opts.ally && kind !== 'bone_golem') m.setRim(new THREE.Color(0x3affc0).multiplyScalar(0.8), 0.5);
  return m;
}

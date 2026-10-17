// Humanoid skeleton, body-part builders, and the shared procedural/keyframed humanoid clip library.
// Conventions (bind pose = identity rotations, arms hanging, model faces +Z, +X = character's LEFT):
//   limb rot.x < 0 swings a hanging limb forward/up; spine/chest rot.x > 0 bends forward;
//   rot.y > 0 twists toward the character's left; left arm abducts with +z, right arm with -z.
import * as THREE from 'three';
import { Rig, G, T, K, kclip, NOISE } from './rig.js';
import { TAU, clamp } from '../core/util.js';

// ------------------------------------------------------------------ skeleton
// p: proportions (hero default 1.8 m)
export const HERO_P = { hipY: 0.98, spine: 0.10, chest: 0.20, neck: 0.24, headUp: 0.1, shX: 0.19, shY: 0.19, clavX: 0.05, upper: 0.30, fore: 0.26, thighX: 0.1, thigh: 0.44, shin: 0.42 };
export function humanoidRig(p = HERO_P, extra = {}) {
  const r = new Rig();
  r.bone('base', null, 0, 0, 0);
  r.bone('hips', 'base', 0, p.hipY, 0);
  r.bone('spine', 'hips', 0, p.spine, 0);
  r.bone('chest', 'spine', 0, p.chest, 0);
  r.bone('neck', 'chest', 0, p.neck, 0);
  r.bone('head', 'neck', 0, p.headUp, 0);
  if (extra.jaw) r.bone('jaw', 'head', 0, extra.jaw[0], extra.jaw[1]);
  r.sides((s, k) => {
    r.bone('clav' + s, 'chest', k * p.clavX, p.shY, 0);
    r.bone('upperArm' + s, 'clav' + s, k * (p.shX - p.clavX), 0, 0);
    r.bone('foreArm' + s, 'upperArm' + s, 0, -p.upper, 0);
    r.bone('hand' + s, 'foreArm' + s, 0, -p.fore, 0);
    r.bone('thigh' + s, 'hips', k * p.thighX, -0.06, 0);
    r.bone('shin' + s, 'thigh' + s, 0, -p.thigh, 0);
    r.bone('foot' + s, 'shin' + s, 0, -p.shin, 0);
  });
  if (extra.skirt) {
    const sy = extra.skirt.y ?? -0.02, sr = extra.skirt.r ?? 0.12;
    r.bone('skirtF', 'hips', 0, sy, sr); r.bone('skirtB', 'hips', 0, sy, -sr);
    r.bone('skirtL', 'hips', sr, sy, 0); r.bone('skirtR', 'hips', -sr, sy, 0);
  }
  if (extra.hair) { r.bone('hair1', 'head', 0, extra.hair[0], extra.hair[1]); r.bone('hair2', 'hair1', 0, -extra.hair[2], 0); }
  r.P = p;
  return r;
}
export function standardSockets(r, p = HERO_P, o = {}) {
  r.socket('handR', 'handR', 0, -0.065, 0.012, Math.PI / 2 - 0.25, 0, 0);
  r.socket('handL', 'handL', 0, -0.065, 0.012, Math.PI / 2 - 0.25, 0, 0);
  r.socket('shield', 'foreArmL', 0.075, -p.fore * 0.55, 0.0, 0, Math.PI / 2, 0);
  r.socket('head', 'head', 0, o.headC ?? 0.075, 0.01);
  r.socket('back', 'chest', 0, 0.16, -0.17);
  r.socket('chest', 'chest', 0, 0.14, 0.13);
  r.socket('overhead', 'head', 0, o.over ?? 0.42, 0);
}

// ------------------------------------------------------------------ body part builders (sculpted)
// All organic volumes are SDF blobs (see sculpt.js): smooth-unioned, AO-baked and smooth-skinned. Rigid parts
// (armor, belts, weapons, jewelry) are still added with r.part() on top. Coordinates are bone-local.
// Sculpt settings default for a hero; monsters pass coarser voxels via setSculpt().
export function setSculpt(r, o = {}) {
  r.sculptOpts = Object.assign({ voxel: 0.012, tris: 11000, groups: { head: { voxel: 0.0072, tris: 3600 }, hair: { voxel: 0.0078, tris: 1800 } } }, r.sculptOpts || {}, o);
  if (o.groups) r.sculptOpts.groups = Object.assign({ hair: { voxel: 0.0078, tris: 1800 } }, o.groups);
  if (o.key) r.sculptKey = o.key;
}
const jawOff = (r) => { const d = r.defs[r.idx.jaw]; return d ? [d.pos.x, d.pos.y, d.pos.z] : null; };
// head + face + neck. o: skin, r (head radius ~0.112), cy, brow (color), eyes, eyeGlow, eyeSize, ears ('pointed'|false),
// neckR, nose (scale), jawW, lips, socket, female, gaunt (0..1), browH (brow heaviness 0..1.5)
export function addHead(r, o = {}) {
  if (!r.sculptOpts) setSculpt(r);
  const s = (o.r ?? 0.112) / 0.112, c = o.cy ?? 0.075, skin = o.skin ?? 0xb08a72;
  const fem = o.female ? 1 : 0, gaunt = o.gaunt ?? 0, bh = o.browH ?? (fem ? 0.4 : 1);
  const H = { group: 'head', rough: o.skinRough ?? 0.6, v: 0.035, f: 16 };
  const J = jawOff(r);
  const jaw = (pt) => J ? [pt[0] - J[0], pt[1] - J[1], pt[2] - J[2]] : pt;
  const jb = J ? 'jaw' : 'head';
  const S = (x, y, z) => [x * s, c + y * s, z * s];
  const R3 = (x, y, z) => [x * s, y * s, z * s];
  const dark = new THREE.Color(skin).multiplyScalar(0.62);
  // skull & face masses
  r.blob('head', { t: 'ell', c: S(0, 0.02, -0.012), r: R3(0.08 - fem * 0.004, 0.094, 0.1) }, skin, { ...H, k: 0.02 });
  r.blob('head', { t: 'ell', c: S(0, -0.032 + fem * 0.006, 0.036), r: R3(0.066 - gaunt * 0.01 + fem * 0.002, 0.068 - fem * 0.006, 0.066) }, skin, { ...H, k: 0.03 });
  r.blob('head', { t: 'ell', c: S(0, 0.03, 0.08), r: R3(0.062, 0.012 + bh * 0.006, 0.016 + bh * 0.008) }, o.brow ?? skin, { ...H, k: 0.014 });
  r.sides((sd, k) => {
    r.blob('head', { t: 'ell', c: S(k * 0.045, -0.014 - fem * 0.006, 0.066 - fem * 0.004), r: R3(0.028 + fem * 0.004, 0.019 + fem * 0.006, 0.024) }, skin, { ...H, k: 0.016 + fem * 0.008 }); // cheekbone
    if (gaunt) r.blob('head', { t: 'ell', c: S(k * 0.05, -0.05, 0.06), r: R3(0.022, 0.026, 0.02) }, dark, { ...H, sub: true, k: 0.02 }); // hollow cheeks
  });
  // nose bridge + tip + nostril wings
  const nz = o.nose ?? 1;
  r.blob('head', { t: 'cap', a: S(0, 0.016, 0.094), b: S(0, -0.028, 0.104 + 0.012 * nz), r0: 0.0075 * s * nz, r1: 0.0115 * s * nz }, skin, { ...H, k: 0.008 });
  r.blob('head', { t: 'ell', c: S(0, -0.034, 0.1), r: R3(0.017 * nz, 0.009, 0.011) }, skin, { ...H, k: 0.008 });
  // jaw & chin on the jaw bone (roars open the mouth)
  const jw = o.jawW ?? (fem ? 0.86 : 1);
  r.blob(jb, { t: 'ell', c: jaw(S(0, -0.074, 0.03)), r: R3(0.058 * jw, 0.036, 0.064) }, skin, { ...H, k: 0.026 });
  r.blob(jb, { t: 'ell', c: jaw(S(0, -0.094, 0.07)), r: R3(0.026 * jw, 0.02, 0.024) }, skin, { ...H, k: 0.018 });
  // lips & mouth slit
  const lip = o.lips ?? new THREE.Color(skin).lerp(new THREE.Color(0x8a3a34), 0.32 + fem * 0.3);
  r.blob('head', { t: 'ell', c: S(0, -0.05, 0.1), r: R3(0.019, 0.0055 + fem * 0.002, 0.008) }, lip, { ...H, k: 0.006, prio: 1 });
  r.blob(jb, { t: 'ell', c: jaw(S(0, -0.061, 0.098)), r: R3(0.017, 0.0065 + fem * 0.002, 0.008) }, lip, { ...H, k: 0.006, prio: 1 });
  r.blob('head', { t: 'ell', c: S(0, -0.0555, 0.106), r: R3(0.02, 0.0026, 0.012) }, 0x2a1210, { ...H, sub: true, k: 0.003, prio: 2 });
  // eye sockets & eyes (dark, slightly glossy; monsters can glow)
  const ec = o.eyes ?? 0x15100c, ee = o.eyeGlow ?? 0, es = o.eyeSize ?? 1;
  r.sides((sd, k) => {
    r.blob('head', { t: 'ell', c: S(k * 0.031, 0.007, 0.096), r: R3(0.021 * es, 0.0125 * es, 0.018) }, o.socket ?? dark, { ...H, sub: true, k: 0.007 });
    if (o.rigidEyes) r.part('head', T(G.sphere(0.0125 * es * s, 8, 6), k * 0.031 * s, c + 0.006 * s, 0.085 * s), ec, { rough: 0.3, emis: ee, v: 0 });
    else r.blob('head', { t: 'ell', c: S(k * 0.031, 0.006, 0.083), r: R3(0.0118 * es, 0.0118 * es, 0.0118 * es) }, ec, { ...H, rough: 0.45, emis: ee, v: 0, k: 0.003, prio: 3 });
    if (o.ears !== false) {
      const pt = o.ears === 'pointed';
      r.blob('head', { t: 'ell', c: S(k * 0.08, -0.008, 0.004), r: R3(0.011, pt ? 0.04 : 0.028, 0.019), rot: [pt ? -0.45 : -0.15, 0, k * (pt ? -0.55 : -0.12)] }, skin, { ...H, k: 0.01 });
    }
  });
  // neck: full column in the body group, a slightly thinner stub inside the head group to seat the head
  const nr = o.neckR ?? 0.055;
  r.blob('neck', { t: 'cap', a: [0, -0.07, -0.008], b: [0, 0.1, 0.012], r0: nr * 1.2, r1: nr }, o.neckColor ?? skin, { rough: 0.62, v: 0.04, k: 0.035 });
  r.blob('neck', { t: 'cap', a: [0, 0.03, 0.0], b: [0, 0.11, 0.012], r0: nr * 0.93, r1: nr * 0.93 }, o.neckColor ?? skin, { ...H, k: 0.03 });
}
// hair styles (head group, strand noise). style: 'short' | 'bun' | 'long' | 'fringe' | 'shaved' | 'topknot' | 'wild'
// o: r (head radius), rough. 'long' needs hair1/hair2 bones (humanoidRig extra.hair)
export function addHair(r, style, color, o = {}) {
  const s = (o.r ?? 0.112) / 0.112, c = 0.075;
  const H = { group: 'hair', rough: o.rough ?? 0.85, v: 0.12, f: 40, prio: 1 };
  const S = (x, y, z) => [x * s, c + y * s, z * s], R3 = (x, y, z) => [x * s, y * s, z * s];
  const strands = [0.0025 * s, 150, 30, 150];
  if (style === 'shaved' || style === 'topknot') r.blob('head', { t: 'ell', c: S(0, 0.045, -0.025), r: R3(0.086, 0.074, 0.101) }, color, { ...H, k: 0.008, bump: [0.0012, 220] });
  if (style === 'short' || style === 'bun' || style === 'long' || style === 'wild') r.blob('head', { t: 'ell', c: S(0, 0.033, -0.021), r: R3(0.088, 0.092, 0.106) }, color, { ...H, k: 0.012, bump: style === 'wild' ? [0.006 * s, 40] : strands });
  if (style === 'fringe') r.blob('head', { t: 'tor', c: S(0, 0.0, -0.025), R: 0.068 * s, r: 0.024 * s, rot: [0.3, 0, 0] }, color, { ...H, k: 0.015, bump: strands });
  if (style === 'bun') r.blob('head', { t: 'ell', c: S(0, 0.085, -0.075), r: R3(0.042, 0.04, 0.042) }, color, { ...H, k: 0.02, bump: strands });
  if (style === 'topknot') r.blob('head', { t: 'cap', a: [0, 0.19 * s, -0.05 * s], b: [0, 0.29 * s, -0.1 * s], r0: 0.033 * s, r1: 0.016 * s }, color, { ...H, k: 0.03, bump: [0.004, 90, 20, 90] });
  if (style === 'long' && r.idx.hair1 !== undefined) {
    r.blob('hair1', { t: 'cap', a: [0, 0.02, 0.0], b: [0, -0.2, -0.01], r0: 0.068 * s, r1: 0.048 * s }, color, { ...H, k: 0.03, bump: [0.004, 150, 15, 150] });
    r.blob('hair2', { t: 'cap', a: [0, 0.0, 0.0], b: [0, -0.2, 0.0], r0: 0.048 * s, r1: 0.02 * s }, color, { ...H, k: 0.03, bump: [0.004, 150, 15, 150] });
  }
}
// beards on the jaw bone (move with the mouth). style: 'full' | 'long' | 'stubble' | 'moustache'
export function addBeard(r, style, color, o = {}) {
  const s = (o.r ?? 0.112) / 0.112, c = 0.075;
  const J = r.idx.jaw !== undefined ? r.defs[r.idx.jaw].pos : new THREE.Vector3();
  const jb = r.idx.jaw !== undefined ? 'jaw' : 'head';
  const P = (x, y, z) => [x * s - J.x, c + y * s - J.y, z * s - J.z];
  const H = { group: 'head', rough: 0.95, v: 0.14, f: 40, prio: 1 };
  if (style === 'full' || style === 'long') r.blob(jb, { t: 'ell', c: P(0, -0.088, 0.062), r: [0.066 * s, 0.056 * s, 0.052 * s] }, color, { ...H, k: 0.012, bump: [0.003, 70, 25, 70] });
  if (style === 'long') r.blob(jb, { t: 'cap', a: P(0, -0.11, 0.07), b: P(0, -0.3, 0.1), r0: 0.052 * s, r1: 0.014 * s }, color, { ...H, k: 0.03, bump: [0.004, 120, 12, 120] });
  if (style === 'stubble') r.blob(jb, { t: 'ell', c: P(0, -0.078, 0.05), r: [0.061 * s, 0.045 * s, 0.05 * s] }, color, { ...H, k: 0.006, bump: [0.001, 250] });
  if (style !== 'stubble') r.blob('head', { t: 'ell', c: [0, c - 0.043 * s, 0.106 * s], r: [0.034 * s, 0.009 * s, 0.014 * s] }, color, { ...H, k: 0.006, prio: 2, bump: [0.0015, 120] });
}
// torso: pelvis, abdomen, ribcage, back & shoulder girdle. o: w, d, chest, belly, pelvis, cloth, rough, muscle (0..1), bust, gut
export function addTorso(r, o = {}) {
  if (!r.sculptOpts) setSculpt(r);
  const w = o.w ?? 1, d = o.d ?? 1, mu = o.muscle ?? 0.5, rough = o.rough ?? 0.85;
  const chest = o.chest ?? o.cloth, belly = o.belly ?? o.cloth, pelvis = o.pelvis ?? o.cloth;
  const B = { rough, v: 0.05, k: 0.05 };
  const P = r.P;
  // cores: rounded slabs per bone, overlapping generously so the waist never pinches
  r.blob('hips', { t: 'box', c: [0, -0.012, -0.016 * d], s: [0.146 * w, 0.1, 0.088 * d], r: 0.08 }, pelvis, B);
  r.blob('spine', { t: 'box', c: [0, 0.06, -0.004], s: [0.13 * w * (1 + (o.gut || 0) * 0.08), 0.12, 0.084 * d * (1 + (o.gut || 0) * 0.3)], r: 0.08 }, belly, B);
  r.blob('chest', { t: 'box', c: [0, 0.135, -0.004], s: [0.152 * w, 0.165, 0.102 * d], r: 0.095 }, chest, B);
  // glutes
  r.sides((sd, k) => r.blob('hips', { t: 'ell', c: [k * 0.064 * w, -0.06, -0.055 * d], r: [0.078 * w, 0.085, 0.064 * d] }, pelvis, { ...B, k: 0.04 }));
  if (o.gut) r.blob('spine', { t: 'ell', c: [0, 0.02, 0.055 * d], r: [0.11 * w, 0.1, 0.07 * d * (1 + o.gut)] }, belly, { ...B, k: 0.05 });
  if (mu > 0.35 && !o.bust) { // abdominals
    r.blob('spine', { t: 'ell', c: [0, 0.085, 0.062 * d], r: [0.064 * w, 0.1, 0.026 * d] }, belly, { ...B, k: 0.03 });
    r.sides((sd, k) => r.blob('spine', { t: 'ell', c: [k * 0.1 * w, 0.06, 0.03 * d], r: [0.045 * w, 0.09, 0.055 * d] }, belly, { ...B, k: 0.035 })); // obliques
  }
  // upper back / lats
  r.sides((sd, k) => r.blob('chest', { t: 'ell', c: [k * 0.085 * w, 0.14, -0.042 * d], r: [0.08 * w * (0.85 + mu * 0.3), 0.15, 0.07 * d] }, chest, { ...B, k: 0.045 }));
  // pecs or bust
  if (o.bust) r.sides((sd, k) => r.blob('chest', { t: 'ell', c: [k * 0.058 * w, 0.178, 0.078 * d], r: [0.054 * w, 0.05, 0.046 * d * o.bust] }, chest, { ...B, k: 0.03 }));
  else r.sides((sd, k) => r.blob('chest', { t: 'ell', c: [k * 0.068 * w, 0.205, 0.068 * d], r: [0.075 * w, 0.055 + mu * 0.008, 0.036 * d + mu * 0.014], rot: [0, 0, k * 0.2] }, chest, { ...B, k: 0.035 }));
  // shoulder girdle / trapezius bridging chest to arms (skinned to chest)
  r.blob('chest', { t: 'ell', c: [0, P.neck - 0.015, -0.03 * d], r: [0.14 * w, 0.055 + mu * 0.012, 0.07 * d] }, chest, { ...B, k: 0.04 });
  r.sides((sd, k) => {
    const cl = r.defs[r.idx['clav' + sd]]; const ux = cl ? cl.pos.x : k * 0.05; const uy = cl ? cl.pos.y : 0.19;
    const sh = r.defs[r.idx['upperArm' + sd]]; const sx = ux + (sh ? sh.pos.x : k * 0.14);
    r.blob('chest', { t: 'cap', a: [ux * 0.3, uy + 0.025, -0.022], b: [sx * 0.84, uy - 0.005, -0.008], r0: 0.055 * (0.9 + mu * 0.3), r1: 0.047 * (0.9 + mu * 0.25) }, chest, { ...B, k: 0.035 });
  });
}
// arms: deltoid, upper arm (biceps/triceps), elbow, forearm, hand (mitten with thumb). o: t, skin, upper, fore, hand, shoulder, muscle
export function addArms(r, o = {}) {
  if (!r.sculptOpts) setSculpt(r);
  const t = o.t ?? 1, p = r.P, mu = o.muscle ?? 0.5;
  const skin = o.skin ?? 0xb08a72, up = o.upper ?? skin, fo = o.fore ?? skin, ha = o.hand ?? skin, sh = o.shoulder ?? up;
  const A = { rough: o.rough ?? 0.66, v: 0.05, k: 0.03 };
  r.sides((s, k) => {
    const U = 'upperArm' + s, F = 'foreArm' + s, Hd = 'hand' + s;
    // deltoid cap
    r.blob(U, { t: 'ell', c: [k * 0.008, -0.04, 0.0], r: [0.066 * t, 0.08 * t, 0.068 * t] }, sh, { ...A, k: 0.03 });
    r.blob(U, { t: 'cap', a: [0, -0.03, 0], b: [0, -p.upper + 0.035, 0], r0: 0.054 * t, r1: 0.042 * t }, up, A);
    r.blob(U, { t: 'ell', c: [0, -p.upper * 0.48, 0.016 * t], r: [0.044 * t, 0.088, 0.038 * t + mu * 0.008] }, up, { ...A, k: 0.025 }); // biceps
    r.blob(U, { t: 'ell', c: [0, -p.upper * 0.42, -0.018 * t], r: [0.044 * t, 0.095, 0.04 * t] }, up, { ...A, k: 0.025 }); // triceps
    // forearm (elbow is the blend between the two bones)
    r.blob(F, { t: 'ell', c: [0, -0.005, -0.012], r: [0.04 * t, 0.045, 0.042 * t] }, fo, { ...A, k: 0.025 });
    r.blob(F, { t: 'cap', a: [0, -0.02, 0], b: [0, -p.fore + 0.02, 0], r0: 0.045 * t, r1: 0.031 * t }, fo, A);
    r.blob(F, { t: 'ell', c: [0, -0.075, 0.006], r: [0.047 * t, 0.085, 0.041 * t] }, fo, { ...A, k: 0.025 });
    // hand: palm block + curled fingers + thumb
    r.blob(Hd, { t: 'box', c: [0, -0.045, 0.004], s: [0.019 * t, 0.045, 0.04 * t], r: 0.016 }, ha, { ...A, k: 0.014 });
    r.blob(Hd, { t: 'ell', c: [-k * 0.006, -0.088, 0.008], r: [0.024 * t, 0.032, 0.042 * t] }, ha, { ...A, k: 0.012 });
    r.blob(Hd, { t: 'cap', a: [-k * 0.01, -0.022, 0.032 * t], b: [-k * 0.022, -0.062, 0.05 * t], r0: 0.013 * t, r1: 0.011 * t }, ha, { ...A, k: 0.01 });
  });
}
// legs: thigh (quads/hamstrings), knee, shin & calf, foot/boot. o: t, legs, thigh, shin, boot, bootTop, bootTopRough, bootTopBump, footL
export function addLegs(r, o = {}) {
  if (!r.sculptOpts) setSculpt(r);
  const t = o.t ?? 1, p = r.P;
  const th = o.thigh ?? o.legs, sh = o.shin ?? o.legs, boot = o.boot ?? sh;
  const L = { rough: o.rough ?? 0.85, v: 0.05, k: 0.03 };
  r.sides((s, k) => {
    const T_ = 'thigh' + s, S = 'shin' + s, Fo = 'foot' + s;
    r.blob(T_, { t: 'cap', a: [0, 0.0, 0], b: [0, -p.thigh + 0.03, 0.005], r0: 0.08 * t, r1: 0.054 * t }, th, { ...L, k: 0.04 });
    r.blob(T_, { t: 'ell', c: [-k * 0.006, -p.thigh * 0.38, 0.024 * t], r: [0.07 * t, 0.15, 0.06 * t] }, th, L); // quads
    r.blob(T_, { t: 'ell', c: [0, -p.thigh * 0.42, -0.022 * t], r: [0.064 * t, 0.15, 0.058 * t] }, th, L); // hamstrings
    r.blob(T_, { t: 'ell', c: [0, -p.thigh + 0.005, 0.02 * t], r: [0.05 * t, 0.05, 0.048 * t] }, th, { ...L, k: 0.025 }); // knee
    r.blob(S, { t: 'cap', a: [0, -0.02, 0], b: [0, -p.shin + 0.05, 0], r0: 0.054 * t, r1: 0.038 * t }, sh, L);
    r.blob(S, { t: 'ell', c: [0, -0.11, -0.026 * t], r: [0.05 * t, 0.1, 0.05 * t] }, sh, { ...L, k: 0.03 }); // calf
    // foot / boot
    const fl = o.footL ?? 1;
    r.blob(Fo, { t: 'box', c: [0, -0.034, 0.052 * fl], s: [0.044 * t, 0.034, 0.112 * fl], r: 0.03 }, boot, { ...L, rough: o.bootRough ?? 0.75, k: 0.02 });
    r.blob(Fo, { t: 'ell', c: [0, -0.012, 0.0], r: [0.046 * t, 0.06, 0.06] }, boot, { ...L, rough: o.bootRough ?? 0.75, k: 0.03 });
    if (o.bootTop) r.blob(S, { t: 'cap', a: [0, -p.shin + 0.19, -0.004], b: [0, -p.shin + 0.05, 0], r0: 0.066 * t, r1: 0.056 * t }, o.bootTop, { rough: o.bootTopRough ?? 0.8, v: 0.1, k: 0.012, prio: 2, bump: o.bootTopBump ? [o.bootTopBump[0] * 0.6, o.bootTopBump[1] * 2.5] : null });
  });
}

// ------------------------------------------------------------------ stance helpers
const HALF_PI = Math.PI / 2;
export function standBody(m, S) {
  const B = m.B, h = S.hunch || 0;
  m.r(B.spine, h * 0.45 + 0.02, 0, 0);
  m.r(B.chest, h * 0.55 + 0.02, 0, 0);
  m.r(B.neck, -h * 0.35, 0, 0);
  m.r(B.head, -h * 0.55, 0, 0);
  const kn = S.knee ?? 0.1;
  m.r(B.thighL, -0.07 - kn * 0.45, 0, 0.05 + (S.wide || 0)); m.r(B.shinL, kn, 0, 0);
  m.r(B.thighR, 0.07 - kn * 0.45, 0, -0.05 - (S.wide || 0)); m.r(B.shinR, kn + 0.04, 0, 0);
}
export function standArms(m, S) {
  const B = m.B, wk = m.weaponKind;
  if (S.armsFwd) {
    const a = S.armsFwd;
    m.r(B.upperArmL, -1.25 * a, 0, 0.05); m.r(B.foreArmL, -0.35 * a, 0, 0);
    m.r(B.upperArmR, -1.1 * a, 0, -0.08); m.r(B.foreArmR, -0.5 * a, 0, 0);
    return;
  }
  const out = S.armOut ?? 0.12;
  // left arm
  if (m.state.shieldGuard || S.shield) { m.r(B.upperArmL, -0.35, 0, 0.12); m.r(B.foreArmL, -1.15, 0, -0.25); }
  else if (wk === '2h') { m.r(B.upperArmL, -0.55, 0, -0.18); m.r(B.foreArmL, -1.05, 0, 0); }
  else if (wk === 'bow') { m.r(B.upperArmL, -0.2, 0, out); m.r(B.foreArmL, -0.3, 0, 0); }
  else { m.r(B.upperArmL, 0.05, 0, out); m.r(B.foreArmL, -0.28, 0, 0); }
  // right arm
  if (wk === 'staff') { m.r(B.upperArmR, -0.08, 0, -0.18); m.r(B.foreArmR, -1.25 + (S.hunch || 0) * 1.1, 0, 0); m.r(B.handR, 0.0, 0, 0); }
  else if (wk === '2h') { m.r(B.upperArmR, -0.5, 0, -0.06); m.r(B.foreArmR, -0.95, 0, 0); m.r(B.handR, 0.35, 0, 0); }
  else if (wk === 'none') { m.r(B.upperArmR, 0.05, 0, -out); m.r(B.foreArmR, -0.28, 0, 0); }
  else { m.r(B.upperArmR, -0.25, 0, -0.14); m.r(B.foreArmR, -0.75, 0, 0); }
}
function jitter(m, S, t, amt) {
  if (!amt) return;
  const B = m.B, s = m.seed * 0.37;
  const n = (a, f) => NOISE.noise2(t * f + s, a) * amt;
  m.r(B.head, n(1.1, 3.1) * 0.6, n(2.2, 2.3), n(3.3, 2.7) * 0.5);
  m.r(B.chest, n(4.4, 1.7) * 0.25, n(5.5, 1.3) * 0.3, 0);
  m.r(B.upperArmL, n(6.6, 2.1) * 0.4, 0, n(7.7, 1.9) * 0.3);
  m.r(B.upperArmR, n(8.8, 2.4) * 0.4, 0, n(9.9, 1.6) * 0.3);
}

// ------------------------------------------------------------------ locomotion
function locomotion(m, u, t, run) {
  const S = m.tpl.style, W = run ? S.run : S.walk, B = m.B;
  const ph = u * TAU, s = Math.sin(ph);
  const amp = W.amp, kn = W.knee, h = S.hunch || 0, limp = S.limp || 0;
  const tl = -amp * s, tr = amp * s * (1 - limp * 0.45);
  const kl = 0.06 + kn * Math.pow(Math.max(0, Math.cos(ph - 0.45)), 2);
  const kr = 0.06 + kn * Math.pow(Math.max(0, Math.cos(ph + Math.PI - 0.45)), 2) * (1 - limp * 0.7);
  const base = (S.knee ?? 0.1) * 0.6;
  m.r(B.thighL, tl - base * 0.5, 0, 0.035 + (S.wide || 0)); m.r(B.shinL, kl + base, 0, 0);
  m.r(B.thighR, tr - base * 0.5, 0, -0.035 - (S.wide || 0)); m.r(B.shinR, kr + base, 0, 0);
  m.r(B.footL, -(tl + kl) * 0.75 + Math.max(0, -s) * 0.25, 0, 0);
  m.r(B.footR, -(tr + kr) * 0.75 + Math.max(0, s) * 0.25, 0, 0);
  // torso
  m.r(B.hips, 0, 0.12 * s * (run ? 1.3 : 1), (W.sway || 0.03) * s);
  m.r(B.spine, W.lean * 0.5 + h * 0.45, 0, 0);
  m.r(B.chest, W.lean * 0.5 + h * 0.55, -0.16 * s, -(W.sway || 0.03) * s * 0.6);
  m.r(B.neck, -h * 0.35, 0, 0);
  m.r(B.head, -(W.lean * 0.7 + h * 0.55), 0.06 * s, 0);
  if (run) m.p(B.hips, 0, 0.045 * Math.max(0, -Math.cos(2 * ph)), 0);
  if (W.bob) m.p(B.hips, 0, W.bob * Math.cos(2 * ph), 0);
  // arms
  const wk = m.weaponKind, arm = W.arm;
  if (S.armsFwd) {
    const a = S.armsFwd;
    m.r(B.upperArmL, -1.25 * a + 0.1 * s, 0, 0.05); m.r(B.foreArmL, -0.35 * a, 0, 0);
    m.r(B.upperArmR, -1.1 * a - 0.1 * s, 0, -0.08); m.r(B.foreArmR, -0.5 * a, 0, 0);
  } else {
    const fb = run ? -1.25 : -0.3;
    if (S.shield || m.state.shieldGuard) { m.r(B.upperArmL, -0.3 + arm * 0.3 * s, 0, 0.12); m.r(B.foreArmL, -1.1, 0, -0.2); }
    else if (wk === '2h') { m.r(B.upperArmL, -0.55 + 0.1 * s, 0, -0.18); m.r(B.foreArmL, -1.05, 0, 0); }
    else { m.r(B.upperArmL, arm * s, 0, S.armOut ?? 0.1); m.r(B.foreArmL, fb + (run ? 0.2 * s : -0.1 * Math.max(0, -s)), 0, 0); }
    if (wk === 'staff') { m.r(B.upperArmR, -0.1 - arm * 0.3 * s, 0, -0.18); m.r(B.foreArmR, -1.2 + (h + W.lean) * 1.1, 0, 0); }
    else if (wk === '2h') { m.r(B.upperArmR, -0.5 - 0.1 * s, 0, -0.06); m.r(B.foreArmR, -0.95, 0, 0); m.r(B.handR, 0.35, 0, 0); }
    else if (wk === 'none' || wk === 'bow') { m.r(B.upperArmR, -arm * s, 0, -(S.armOut ?? 0.1)); m.r(B.foreArmR, fb + (run ? -0.2 * s : -0.1 * Math.max(0, s)), 0, 0); }
    else { m.r(B.upperArmR, -0.2 - arm * 0.6 * s, 0, -0.14); m.r(B.foreArmR, run ? -1.2 : -0.8, 0, 0); }
  }
  jitter(m, S, t, (S.jitter || 0) * 0.5);
}

// ------------------------------------------------------------------ clip library
const bodyBase = (m) => standBody(m, m.tpl.style);
const fullBase = (m) => { standBody(m, m.tpl.style); standArms(m, m.tpl.style); };

function idleFn(m, u, t) {
  const S = m.tpl.style, B = m.B, br = Math.sin(u * TAU);
  standBody(m, S); standArms(m, S);
  const b = (S.breath ?? 1);
  m.r(B.chest, br * 0.022 * b, 0, 0); m.r(B.spine, br * 0.01 * b, 0, 0);
  m.r(B.upperArmL, -br * 0.02 * b, 0, br * 0.015 * b); m.r(B.upperArmR, -br * 0.02 * b, 0, -br * 0.015 * b);
  m.r(B.head, -br * 0.015, Math.sin(u * TAU * 2 + 1) * 0.04 * (S.look ?? 1), 0);
  m.r(B.hips, 0, 0, Math.sin(u * TAU) * 0.018); m.p(B.hips, Math.sin(u * TAU) * 0.012, 0, 0);
  if (S.sway) { m.r(B.chest, 0, 0, Math.sin(u * TAU) * S.sway); m.r(B.head, 0, 0, Math.sin(u * TAU + 0.6) * S.sway * 1.5); }
  jitter(m, S, t, S.jitter || 0);
}

// overhead chop, one-handed (absolute arm values)
const A1_1H = kclip({ dur: 0.6, impact: 0.44, base: bodyBase }, {
  upperArmR: { x: [[0, -0.25], [0.3, -2.75, 2], [0.42, -0.45, 3], [0.48, -0.15, 2], [0.65, -0.25], [1, -0.25]], z: [[0, -0.14], [0.3, -0.3], [0.44, 0.12], [1, -0.14]] },
  foreArmR: { x: [[0, -0.75], [0.3, -1.95, 2], [0.42, -0.3, 3], [0.5, -0.15], [1, -0.75]] },
  handR: { x: [[0, 0], [0.3, 0.45], [0.43, -0.45, 3], [0.6, -0.3], [1, 0]] },
  chest: { x: [[0, 0], [0.3, -0.22], [0.44, 0.34, 3], [0.62, 0.26], [1, 0]], y: [[0, 0], [0.3, -0.35], [0.44, 0.2, 3], [1, 0]] },
  spine: { x: [[0, 0], [0.3, -0.06], [0.44, 0.14, 3], [1, 0]] },
  head: { x: [[0, 0], [0.3, 0.16], [0.44, -0.26], [1, 0]], y: [[0, 0], [0.3, 0.25], [0.44, -0.15], [1, 0]] },
  upperArmL: { x: [[0, 0.05], [0.3, -0.75], [0.44, 0.45, 3], [1, 0.05]], z: [[0, 0.12], [0.3, 0.32], [1, 0.12]] },
  foreArmL: { x: [[0, -0.28], [0.3, -0.9], [0.44, -0.2], [1, -0.28]] },
  thighL: { x: [[0, 0], [0.3, -0.25], [0.44, -0.45, 3], [0.7, -0.35], [1, 0]] },
  shinL: { x: [[0, 0], [0.3, 0.15], [0.44, 0.35], [1, 0]] },
  thighR: { x: [[0, 0], [0.3, 0.1], [0.44, 0.35, 3], [1, 0]] },
  shinR: { x: [[0, 0], [0.44, 0.3], [1, 0]] },
  hips: { y: [[0, 0], [0.3, -0.15], [0.44, 0.15, 3], [1, 0]] },
});
// overhead chop, two-handed: both arms swing together
const A1_2H = kclip({ dur: 0.6, impact: 0.46, base: bodyBase }, {
  upperArmR: { x: [[0, -0.5], [0.32, -2.85, 2], [0.45, -0.55, 3], [0.52, -0.3, 2], [1, -0.5]], z: [[0, -0.06], [0.32, -0.2], [0.46, 0.2], [1, -0.06]] },
  foreArmR: { x: [[0, -0.95], [0.32, -1.7, 2], [0.45, -0.25, 3], [1, -0.95]] },
  handR: { x: [[0, 0.35], [0.32, 0.7], [0.45, -0.3, 3], [1, 0.35]] },
  upperArmL: { x: [[0, -0.55], [0.32, -2.7, 2], [0.45, -0.6, 3], [0.52, -0.4, 2], [1, -0.55]], z: [[0, -0.18], [0.32, -0.32], [0.46, -0.42], [1, -0.18]] },
  foreArmL: { x: [[0, -1.05], [0.32, -1.6, 2], [0.45, -0.4, 3], [1, -1.05]] },
  chest: { x: [[0, 0], [0.32, -0.3], [0.46, 0.45, 3], [0.65, 0.35], [1, 0]], y: [[0, 0], [0.32, -0.2], [0.46, 0.1, 3], [1, 0]] },
  spine: { x: [[0, 0], [0.32, -0.1], [0.46, 0.2, 3], [1, 0]] },
  head: { x: [[0, 0], [0.32, 0.25], [0.46, -0.35], [1, 0]] },
  thighL: { x: [[0, 0], [0.32, -0.3], [0.46, -0.55, 3], [0.7, -0.45], [1, 0]] },
  shinL: { x: [[0, 0], [0.46, 0.5], [1, 0]] },
  thighR: { x: [[0, 0], [0.32, 0.12], [0.46, 0.4, 3], [1, 0]] },
  shinR: { x: [[0, 0], [0.46, 0.4], [1, 0]] },
  hips: { py: [[0, 0], [0.32, 0.03], [0.46, -0.06, 3], [1, 0]] },
});
// punch (no weapon)
const A1_FIST = kclip({ dur: 0.5, impact: 0.4, base: bodyBase }, {
  upperArmR: { x: [[0, 0.05], [0.28, 0.3], [0.4, -1.45, 2], [0.6, -1.3], [1, 0.05]], z: [[0, -0.12], [0.28, -0.35], [0.4, 0.1, 2], [1, -0.12]] },
  foreArmR: { x: [[0, -0.28], [0.28, -1.9], [0.4, -0.1, 2], [0.6, -0.2], [1, -0.28]] },
  chest: { y: [[0, 0], [0.28, -0.45], [0.4, 0.4, 2], [1, 0]], x: [[0, 0], [0.4, 0.2], [1, 0]] },
  upperArmL: { x: [[0, 0.05], [0.28, -0.6], [0.4, 0.3], [1, 0.05]], z: [[0, 0.12], [1, 0.12]] },
  foreArmL: { x: [[0, -0.28], [0.28, -1.6], [1, -0.28]] },
  thighL: { x: [[0, 0], [0.4, -0.5, 2], [1, 0]] }, shinL: { x: [[0, 0], [0.4, 0.4], [1, 0]] },
  thighR: { x: [[0, 0], [0.4, 0.35, 2], [1, 0]] },
});
// side slash right -> left
const A2_1H = kclip({ dur: 0.6, impact: 0.46, base: bodyBase }, {
  upperArmR: { x: [[0, -0.25], [0.3, -1.05], [0.46, -1.3, 3], [0.62, -1.0], [1, -0.25]], z: [[0, -0.14], [0.3, -1.2], [0.46, 0.75, 3], [0.62, 0.85], [1, -0.14]] },
  foreArmR: { x: [[0, -0.75], [0.3, -0.45], [0.46, -0.05, 3], [0.62, -0.15], [1, -0.75]] },
  handR: { y: [[0, 0], [0.3, -1.25], [0.46, -1.45], [0.7, -0.8], [1, 0]], z: [[0, 0], [0.3, 0.4], [0.46, -0.3], [1, 0]] },
  chest: { y: [[0, 0], [0.3, -0.65], [0.46, 0.6, 3], [0.65, 0.5], [1, 0]], x: [[0, 0], [0.46, 0.15], [1, 0]] },
  spine: { y: [[0, 0], [0.3, -0.25], [0.46, 0.25, 3], [1, 0]] },
  hips: { y: [[0, 0], [0.3, -0.2], [0.46, 0.2, 3], [1, 0]] },
  head: { y: [[0, 0], [0.3, 0.55], [0.46, -0.5, 3], [1, 0]] },
  upperArmL: { x: [[0, 0.05], [0.3, -0.4], [0.46, 0.3], [1, 0.05]], z: [[0, 0.12], [0.3, 0.6], [0.46, 0.2], [1, 0.12]] },
  foreArmL: { x: [[0, -0.28], [0.3, -0.8], [1, -0.28]] },
  thighL: { x: [[0, 0], [0.3, -0.2], [0.46, -0.42], [1, 0]], z: [[0, 0], [0.46, 0.1], [1, 0]] },
  thighR: { x: [[0, 0], [0.46, 0.3], [1, 0]], z: [[0, 0], [0.46, -0.1], [1, 0]] },
  shinL: { x: [[0, 0], [0.46, 0.3], [1, 0]] }, shinR: { x: [[0, 0], [0.46, 0.25], [1, 0]] },
});
const A2_2H = kclip({ dur: 0.65, impact: 0.48, base: bodyBase }, {
  upperArmR: { x: [[0, -0.5], [0.32, -1.15], [0.48, -1.25, 3], [0.65, -1.0], [1, -0.5]], z: [[0, -0.06], [0.32, -1.1], [0.48, 0.7, 3], [0.65, 0.8], [1, -0.06]] },
  foreArmR: { x: [[0, -0.95], [0.32, -0.5], [0.48, -0.1, 3], [1, -0.95]] },
  handR: { y: [[0, 0], [0.32, -1.3], [0.48, -1.45], [1, 0]], x: [[0, 0.35], [0.48, 0], [1, 0.35]] },
  upperArmL: { x: [[0, -0.55], [0.32, -1.0], [0.48, -1.2, 3], [1, -0.55]], z: [[0, -0.18], [0.32, -0.9], [0.48, 0.5, 3], [1, -0.18]] },
  foreArmL: { x: [[0, -1.05], [0.32, -0.9], [0.48, -0.5], [1, -1.05]] },
  chest: { y: [[0, 0], [0.32, -0.75], [0.48, 0.7, 3], [0.68, 0.6], [1, 0]], x: [[0, 0], [0.48, 0.2], [1, 0]] },
  spine: { y: [[0, 0], [0.32, -0.3], [0.48, 0.3, 3], [1, 0]] },
  hips: { y: [[0, 0], [0.32, -0.25], [0.48, 0.25, 3], [1, 0]] },
  head: { y: [[0, 0], [0.32, 0.6], [0.48, -0.55, 3], [1, 0]] },
  thighL: { x: [[0, 0], [0.48, -0.45], [1, 0]], z: [[0, 0], [0.48, 0.12], [1, 0]] },
  thighR: { x: [[0, 0], [0.48, 0.35], [1, 0]], z: [[0, 0], [0.48, -0.12], [1, 0]] },
  shinL: { x: [[0, 0], [0.48, 0.4], [1, 0]] }, shinR: { x: [[0, 0], [0.48, 0.3], [1, 0]] },
});
// thrust / bash
const A3_1H = kclip({ dur: 0.55, impact: 0.42, base: bodyBase }, {
  upperArmR: { x: [[0, -0.25], [0.3, 0.3], [0.42, -1.35, 2], [0.6, -1.15], [1, -0.25]], z: [[0, -0.14], [0.3, -0.35], [0.42, 0.0], [1, -0.14]] },
  foreArmR: { x: [[0, -0.75], [0.3, -1.6], [0.42, -0.05, 2], [0.6, -0.1], [1, -0.75]] },
  handR: { x: [[0, 0], [0.3, 0.7], [0.42, 1.3, 2], [0.65, 1.1], [1, 0]] },
  chest: { y: [[0, 0], [0.3, -0.4], [0.42, 0.3, 2], [1, 0]], x: [[0, 0], [0.3, -0.05], [0.42, 0.25], [1, 0]] },
  head: { y: [[0, 0], [0.3, 0.3], [0.42, -0.25], [1, 0]] },
  upperArmL: { x: [[0, 0.05], [0.3, -0.35], [0.42, 0.5], [1, 0.05]], z: [[0, 0.12], [1, 0.12]] },
  foreArmL: { x: [[0, -0.28], [0.3, -0.9], [1, -0.28]] },
  thighL: { x: [[0, 0], [0.3, -0.1], [0.42, -0.65, 2], [0.65, -0.55], [1, 0]] }, shinL: { x: [[0, 0], [0.42, 0.55], [1, 0]] },
  thighR: { x: [[0, 0], [0.42, 0.45, 2], [1, 0]] }, shinR: { x: [[0, 0], [0.42, 0.2], [1, 0]] },
});
const pickAttack = (a1h, a2h, fist) => ({
  dur: a1h.dur, impact: a1h.impact,
  fn(m, u, t) { const wk = m.weaponKind; (wk === '2h' ? a2h : (wk === 'none' && fist) ? fist : a1h).fn(m, u, t); },
});

// forward two-handed push (casters)
const CAST = kclip({ dur: 0.6, impact: 0.45, base: bodyBase }, {
  upperArmR: { x: [[0, -0.2], [0.3, -0.35], [0.45, -1.4, 2], [0.7, -1.25], [1, -0.2]], z: [[0, -0.14], [0.3, -0.38], [0.45, 0.16, 2], [1, -0.14]] },
  upperArmL: { x: [[0, 0.0], [0.3, -0.35], [0.45, -1.4, 2], [0.7, -1.25], [1, 0.0]], z: [[0, 0.12], [0.3, 0.38], [0.45, -0.16, 2], [1, 0.12]] },
  foreArmR: { x: [[0, -0.7], [0.3, -1.6], [0.45, -0.1, 2], [0.7, -0.2], [1, -0.7]] },
  foreArmL: { x: [[0, -0.3], [0.3, -1.6], [0.45, -0.1, 2], [0.7, -0.2], [1, -0.3]] },
  handR: { x: [[0, 0], [0.3, 0.3], [0.45, -0.7], [1, 0]] }, handL: { x: [[0, 0], [0.3, 0.3], [0.45, -0.7], [1, 0]] },
  chest: { x: [[0, 0], [0.3, -0.14], [0.45, 0.2, 2], [1, 0]], y: [[0, 0], [0.3, -0.12], [0.45, 0.06], [1, 0]] },
  head: { x: [[0, 0], [0.3, 0.1], [0.45, -0.12], [1, 0]] },
  thighL: { x: [[0, 0], [0.45, -0.32, 2], [1, 0]] }, shinL: { x: [[0, 0], [0.45, 0.25], [1, 0]] },
  thighR: { x: [[0, 0], [0.45, 0.22, 2], [1, 0]] },
});
// overhead raise (nova / curse / buff)
const CAST2 = kclip({ dur: 0.8, impact: 0.55, base: bodyBase }, {
  upperArmR: { x: [[0, -0.1], [0.4, -2.75, 2], [0.55, -2.95], [0.75, -2.2], [1, -0.1]], z: [[0, -0.12], [0.4, -0.38], [1, -0.12]] },
  upperArmL: { x: [[0, 0.05], [0.4, -2.75, 2], [0.55, -2.95], [0.75, -2.2], [1, 0.05]], z: [[0, 0.12], [0.4, 0.38], [1, 0.12]] },
  foreArmR: { x: [[0, -0.5], [0.4, -0.35], [0.55, -0.1], [1, -0.5]] }, foreArmL: { x: [[0, -0.3], [0.4, -0.35], [0.55, -0.1], [1, -0.3]] },
  handR: { x: [[0, 0], [0.4, -0.5], [1, 0]] }, handL: { x: [[0, 0], [0.4, -0.5], [1, 0]] },
  chest: { x: [[0, 0], [0.4, -0.26], [0.55, -0.15], [1, 0]] }, spine: { x: [[0, 0], [0.4, -0.1], [1, 0]] },
  head: { x: [[0, 0], [0.4, -0.42], [0.6, -0.2], [1, 0]] },
  thighL: { x: [[0, 0], [0.55, -0.15], [1, 0]] }, thighR: { x: [[0, 0], [0.55, 0.1], [1, 0]] },
  shinL: { x: [[0, 0], [0.55, 0.3], [1, 0]] }, shinR: { x: [[0, 0], [0.55, 0.25], [1, 0]] },
  hips: { py: [[0, 0], [0.4, 0.02], [0.55, -0.05], [1, 0]] },
});
const HIT = kclip({ dur: 0.32, fade: 0.05, base: fullBase }, {
  chest: { x: [[0, 0], [0.22, -0.32, 2], [1, 0]], z: [[0, 0], [0.22, 0.12], [1, 0]] },
  spine: { x: [[0, 0], [0.22, -0.12, 2], [1, 0]] },
  head: { x: [[0, 0], [0.18, -0.45, 2], [1, 0]], z: [[0, 0], [0.2, -0.15], [1, 0]] },
  upperArmL: { z: [[0, 0], [0.22, 0.45], [1, 0]], x: [[0, 0], [0.22, 0.3], [1, 0]] },
  upperArmR: { z: [[0, 0], [0.22, -0.35], [1, 0]], x: [[0, 0], [0.22, 0.25], [1, 0]] },
  thighR: { x: [[0, 0], [0.22, 0.25], [1, 0]] }, shinR: { x: [[0, 0], [0.22, 0.2], [1, 0]] },
  hips: { pz: [[0, 0], [0.22, -0.07], [1, 0]] },
});
const DEATH_BACK = kclip({ dur: 1.35, hold: true, ground: false, fade: 0.06 }, {
  base: { x: [[0, 0], [0.16, 0.0], [0.5, -1.5, 3], [0.58, -1.38], [0.66, -1.5], [1, -1.5]], py: [[0, 0], [0.45, 0.04], [0.55, 0.12], [1, 0.12]] },
  hips: { x: [[0, 0], [0.16, 0.12], [0.5, -0.25], [1, -0.12]] },
  spine: { x: [[0, 0], [0.16, 0.15], [0.5, -0.12], [1, -0.04]] },
  chest: { x: [[0, 0], [0.16, -0.35], [0.5, -0.15], [1, 0.02]] },
  head: { x: [[0, 0], [0.16, -0.45], [0.5, 0.3], [0.62, -0.35], [1, -0.18]], y: [[0, 0], [0.66, 0], [1, 0.6]] },
  upperArmL: { x: [[0, 0], [0.3, -1.1], [0.55, -2.0], [1, -2.3]], z: [[0, 0.1], [0.3, 0.7], [1, 0.95]] },
  upperArmR: { x: [[0, -0.2], [0.3, -0.9], [0.55, -1.7], [1, -1.4]], z: [[0, -0.12], [0.3, -0.9], [1, -1.15]] },
  foreArmL: { x: [[0, -0.3], [0.55, -0.6], [1, -0.35]] }, foreArmR: { x: [[0, -0.6], [0.55, -0.25], [1, -0.5]] },
  thighL: { x: [[0, 0], [0.22, -0.55], [0.5, -0.35], [1, -0.28]], z: [[0, 0.04], [1, 0.2]] },
  shinL: { x: [[0, 0], [0.22, 1.0], [0.5, 0.45], [1, 0.4]] },
  thighR: { x: [[0, 0], [0.22, -0.25], [0.5, -0.1], [1, -0.05]], z: [[0, -0.04], [1, -0.14]] },
  shinR: { x: [[0, 0], [0.22, 0.55], [0.5, 0.15], [1, 0.12]] },
  footL: { x: [[0, 0], [1, 0.6]] }, footR: { x: [[0, 0], [1, 0.7]] },
});
const DEATH_FWD = kclip({ dur: 1.35, hold: true, ground: false, fade: 0.06 }, {
  base: { x: [[0, 0], [0.2, 0.0], [0.55, 1.47, 3], [0.62, 1.36], [0.7, 1.47], [1, 1.47]], py: [[0, 0], [0.5, 0.05], [0.6, 0.13], [1, 0.13]] },
  hips: { x: [[0, 0], [0.2, -0.1], [0.55, 0.2], [1, 0.1]] },
  chest: { x: [[0, 0], [0.2, 0.3], [0.55, 0.15], [1, 0.0]] },
  head: { x: [[0, 0], [0.2, 0.3], [0.55, -0.4], [0.65, 0.1], [1, -0.3]], y: [[0, 0], [1, -0.7]] },
  upperArmL: { x: [[0, 0], [0.25, -0.8], [0.55, -2.4], [1, -2.6]], z: [[0, 0.1], [1, 0.55]] },
  upperArmR: { x: [[0, -0.2], [0.25, -0.7], [0.55, -1.2], [1, -0.4]], z: [[0, -0.1], [1, -0.65]] },
  foreArmL: { x: [[0, -0.3], [1, -0.5]] }, foreArmR: { x: [[0, -0.6], [1, -1.2]] },
  thighL: { x: [[0, 0], [0.25, -0.7], [0.55, 0.0], [1, 0.05]], z: [[0, 0], [1, 0.12]] },
  shinL: { x: [[0, 0], [0.25, 1.2], [0.55, 0.3], [1, 0.5]] },
  thighR: { x: [[0, 0], [0.25, -0.3], [0.55, 0.05], [1, 0.1]], z: [[0, 0], [1, -0.1]] },
  shinR: { x: [[0, 0], [0.25, 0.8], [0.55, 0.2], [1, 0.9]] },
  footL: { x: [[0, 0], [1, -0.3]] }, footR: { x: [[0, 0], [1, -0.2]] },
});
const BLOCK = kclip({ dur: 0.4, fade: 0.05, impact: 0.15, base: bodyBase }, {
  upperArmL: { x: [[0, 0.05], [0.18, -1.15, 2], [0.75, -1.05], [1, 0.05]], z: [[0, 0.12], [0.18, -0.3, 2], [0.75, -0.25], [1, 0.12]] },
  foreArmL: { x: [[0, -0.28], [0.18, -1.35, 2], [0.75, -1.25], [1, -0.28]], z: [[0, 0], [0.18, -0.2], [1, 0]] },
  upperArmR: { x: [[0, -0.25], [0.18, 0.1], [1, -0.25]], z: [[0, -0.14], [0.18, -0.35], [1, -0.14]] },
  foreArmR: { x: [[0, -0.75], [0.18, -1.2], [1, -0.75]] },
  chest: { x: [[0, 0], [0.18, -0.12], [1, 0]], y: [[0, 0], [0.18, 0.22], [1, 0]] },
  thighR: { x: [[0, 0], [0.18, 0.3], [1, 0]] }, shinR: { x: [[0, 0], [0.18, 0.25], [1, 0]] },
  thighL: { x: [[0, 0], [0.18, -0.2], [1, 0]] }, shinL: { x: [[0, 0], [0.18, 0.3], [1, 0]] },
});
const LEAP = kclip({ dur: 1.0, impact: 0.86, ground: false, steps: [0.86], base: null }, {
  hips: { py: [[0, 0], [0.18, -0.34], [0.28, 0.15, 2], [0.55, 1.35, 2], [0.8, 0.15, 3], [0.86, -0.36], [0.95, -0.2], [1, 0]], x: [[0, 0], [0.18, 0.2], [0.45, 0.0], [0.86, 0.25], [1, 0]] },
  thighL: { x: [[0, -0.07], [0.18, -0.85], [0.28, 0.05], [0.45, -1.15], [0.75, -0.7], [0.86, -1.0], [1, -0.07]], z: [[0, 0.05], [0.86, 0.15], [1, 0.05]] },
  thighR: { x: [[0, 0.07], [0.18, -0.7], [0.28, 0.2], [0.45, -0.7], [0.75, -0.4], [0.86, -0.6], [1, 0.07]], z: [[0, -0.05], [0.86, -0.15], [1, -0.05]] },
  shinL: { x: [[0, 0.1], [0.18, 1.45], [0.28, 0.2], [0.45, 1.65], [0.75, 0.8], [0.86, 1.6], [1, 0.1]] },
  shinR: { x: [[0, 0.1], [0.18, 1.3], [0.28, 0.25], [0.45, 1.9], [0.75, 0.9], [0.86, 1.2], [1, 0.1]] },
  footL: { x: [[0, 0], [0.18, -0.6], [0.3, 0.4], [0.86, -0.6], [1, 0]] }, footR: { x: [[0, 0], [0.18, -0.6], [0.3, 0.4], [0.86, -0.6], [1, 0]] },
  spine: { x: [[0, 0.02], [0.18, 0.35], [0.28, -0.1], [0.5, 0.1], [0.86, 0.45], [1, 0.02]] },
  chest: { x: [[0, 0], [0.18, 0.2], [0.35, -0.25], [0.75, -0.22], [0.86, 0.42, 3], [1, 0]] },
  head: { x: [[0, 0], [0.18, -0.3], [0.35, 0.1], [0.86, -0.4], [1, 0]] },
  upperArmR: { x: [[0, -0.25], [0.18, 0.55], [0.35, -2.6], [0.75, -2.85], [0.86, -0.35, 3], [1, -0.25]], z: [[0, -0.14], [0.35, -0.3], [1, -0.14]] },
  foreArmR: { x: [[0, -0.75], [0.35, -1.45], [0.75, -1.6], [0.86, -0.2, 3], [1, -0.75]] },
  upperArmL: { x: [[0, 0.05], [0.18, 0.6], [0.35, -2.2], [0.75, -2.4], [0.86, 0.4, 3], [1, 0.05]], z: [[0, 0.12], [0.35, 0.4], [1, 0.12]] },
  foreArmL: { x: [[0, -0.28], [0.35, -0.6], [1, -0.28]] },
});
const WHIRL = kclip({ dur: 0.5, loop: true, impact: 0.5, fade: 0.1, base: null }, {
  base: { y: [[0, 0], [1, TAU, 1]] },
  upperArmR: { x: [[0, -1.45], [1, -1.45]], z: [[0, -1.15], [1, -1.15]] }, foreArmR: { x: [[0, -0.15], [1, -0.15]] },
  handR: { y: [[0, -1.4], [1, -1.4]] },
  upperArmL: { x: [[0, -1.2], [1, -1.2]], z: [[0, 1.0], [1, 1.0]] }, foreArmL: { x: [[0, -0.2], [1, -0.2]] },
  chest: { x: [[0, 0.12], [1, 0.12]] }, spine: { x: [[0, 0.1], [1, 0.1]] }, head: { x: [[0, -0.2], [1, -0.2]] },
  thighL: { x: [[0, -0.25], [1, -0.25]], z: [[0, 0.16], [1, 0.16]] }, thighR: { x: [[0, -0.1], [1, -0.1]], z: [[0, -0.16], [1, -0.16]] },
  shinL: { x: [[0, 0.45], [1, 0.45]] }, shinR: { x: [[0, 0.4], [1, 0.4]] },
});
function shake(m, u, t, a0, a1, amt) {
  if (u < a0 || u > a1) return;
  const k = Math.sin((u - a0) / (a1 - a0) * Math.PI) * amt;
  m.r(m.B.chest, Math.sin(t * 61) * 0.04 * k, Math.sin(t * 47) * 0.05 * k, 0);
  m.r(m.B.head, Math.sin(t * 53 + 1) * 0.06 * k, Math.sin(t * 43) * 0.06 * k, 0);
}
const HOWL = kclip({ dur: 0.9, impact: 0.35, base: bodyBase, extra: (m, u, t) => shake(m, u, t, 0.35, 0.8, 1) }, {
  chest: { x: [[0, 0], [0.2, 0.25], [0.35, -0.38, 2], [0.75, -0.32], [1, 0]] },
  head: { x: [[0, 0], [0.2, 0.3], [0.35, -0.7, 2], [0.75, -0.6], [1, 0]] },
  jaw: { x: [[0, 0], [0.3, 0.5], [0.75, 0.5], [1, 0]] },
  upperArmL: { x: [[0, 0.05], [0.2, -0.4], [0.35, 0.45, 2], [0.75, 0.4], [1, 0.05]], z: [[0, 0.12], [0.2, 0.3], [0.35, 0.95, 2], [0.75, 0.9], [1, 0.12]] },
  upperArmR: { x: [[0, -0.25], [0.2, -0.4], [0.35, 0.45, 2], [0.75, 0.4], [1, -0.25]], z: [[0, -0.14], [0.2, -0.3], [0.35, -0.95, 2], [0.75, -0.9], [1, -0.14]] },
  foreArmL: { x: [[0, -0.28], [0.2, -1.6], [0.35, -0.55], [0.75, -0.6], [1, -0.28]] },
  foreArmR: { x: [[0, -0.75], [0.2, -1.6], [0.35, -0.55], [0.75, -0.6], [1, -0.75]] },
  thighL: { x: [[0, 0], [0.35, -0.3], [0.75, -0.3], [1, 0]], z: [[0, 0], [0.35, 0.1], [1, 0]] },
  thighR: { x: [[0, 0], [0.35, 0.15], [1, 0]], z: [[0, 0], [0.35, -0.1], [1, 0]] },
  shinL: { x: [[0, 0], [0.35, 0.45], [1, 0]] }, shinR: { x: [[0, 0], [0.35, 0.4], [1, 0]] },
});
const SHOOT = kclip({ dur: 1.0, impact: 0.66, base: bodyBase }, {
  upperArmL: { x: [[0, -0.2], [0.25, -1.5, 2], [0.9, -1.45], [1, -0.2]], z: [[0, 0.1], [0.25, -0.05], [1, 0.1]] },
  foreArmL: { x: [[0, -0.3], [0.25, -0.05], [0.9, -0.05], [1, -0.3]] },
  handL: { y: [[0, 0], [0.25, 1.4], [0.9, 1.4], [1, 0]] },
  upperArmR: { x: [[0, 0.05], [0.25, -1.45], [0.6, -1.5], [0.68, -1.25, 2], [1, 0.05]], z: [[0, -0.1], [0.25, 0.2], [0.6, -0.3], [0.68, -0.65, 2], [1, -0.1]] },
  foreArmR: { x: [[0, -0.28], [0.25, -1.1], [0.6, -2.35], [0.68, -1.5, 2], [1, -0.28]] },
  chest: { y: [[0, 0], [0.25, 0.45], [0.9, 0.42], [1, 0]], x: [[0, 0], [0.25, -0.05], [1, 0]] },
  spine: { y: [[0, 0], [0.25, 0.25], [0.9, 0.25], [1, 0]] },
  head: { y: [[0, 0], [0.25, -0.6], [0.9, -0.55], [1, 0]] },
  thighL: { x: [[0, 0], [0.25, -0.25], [0.9, -0.25], [1, 0]] }, thighR: { x: [[0, 0], [0.25, 0.2], [0.9, 0.2], [1, 0]] },
});
const REVIVE = kclip({ dur: 1.4, impact: 0.65, base: bodyBase, extra: (m, u, t) => { shake(m, u, t, 0.3, 0.85, 1.6); if (u > 0.3 && u < 0.85) m.p(m.B.hips, 0, Math.abs(Math.sin(t * 14)) * 0.05, 0); } }, {
  upperArmR: { x: [[0, -0.08], [0.3, -2.8, 2], [0.85, -2.7], [1, -0.08]], z: [[0, -0.18], [0.3, -0.3], [1, -0.18]] },
  foreArmR: { x: [[0, -1.25], [0.3, -0.3], [0.85, -0.35], [1, -1.25]] },
  upperArmL: { x: [[0, 0.05], [0.3, -2.0], [0.85, -1.9], [1, 0.05]], z: [[0, 0.1], [0.3, 0.6], [1, 0.1]] },
  chest: { x: [[0, 0], [0.3, -0.3], [0.85, -0.25], [1, 0]] }, head: { x: [[0, 0], [0.3, -0.5], [0.85, -0.42], [1, 0]] },
});
const SLAM = kclip({ dur: 1.0, impact: 0.55, base: bodyBase }, {
  upperArmR: { x: [[0, -0.1], [0.4, -2.95, 2], [0.55, -0.55, 3], [0.75, -0.5], [1, -0.1]], z: [[0, -0.12], [0.4, -0.22], [0.55, 0.22], [1, -0.12]] },
  upperArmL: { x: [[0, 0.05], [0.4, -2.95, 2], [0.55, -0.55, 3], [0.75, -0.5], [1, 0.05]], z: [[0, 0.12], [0.4, 0.22], [0.55, -0.22], [1, 0.12]] },
  foreArmR: { x: [[0, -0.4], [0.4, -0.6], [0.55, -0.1], [1, -0.4]] }, foreArmL: { x: [[0, -0.3], [0.4, -0.6], [0.55, -0.1], [1, -0.3]] },
  chest: { x: [[0, 0], [0.4, -0.38], [0.55, 0.62, 3], [0.75, 0.55], [1, 0]] }, spine: { x: [[0, 0], [0.4, -0.1], [0.55, 0.3, 3], [1, 0]] },
  head: { x: [[0, 0], [0.4, -0.3], [0.55, 0.2], [1, 0]] }, jaw: { x: [[0, 0], [0.4, 0.4], [0.6, 0.2], [1, 0]] },
  thighL: { x: [[0, 0], [0.4, -0.12], [0.55, -0.55], [1, 0]] }, thighR: { x: [[0, 0], [0.4, 0.05], [0.55, -0.35], [1, 0]] },
  shinL: { x: [[0, 0], [0.55, 0.9], [1, 0]] }, shinR: { x: [[0, 0], [0.55, 0.8], [1, 0]] },
  hips: { py: [[0, 0], [0.4, 0.08], [0.55, -0.1], [1, 0]] },
});
const ROAR = kclip({ dur: 1.3, impact: 0.3, base: bodyBase, extra: (m, u, t) => shake(m, u, t, 0.3, 0.8, 1.4) }, {
  chest: { x: [[0, 0], [0.18, 0.3], [0.3, -0.42, 2], [0.8, -0.38], [1, 0]] }, spine: { x: [[0, 0], [0.3, -0.12], [0.8, -0.1], [1, 0]] },
  head: { x: [[0, 0], [0.18, 0.35], [0.3, -0.62, 2], [0.8, -0.55], [1, 0]] }, jaw: { x: [[0, 0], [0.25, 0.7], [0.8, 0.7], [1, 0]] },
  upperArmL: { x: [[0, 0.05], [0.18, -0.3], [0.3, 0.2], [0.8, 0.15], [1, 0.05]], z: [[0, 0.12], [0.18, 0.2], [0.3, 1.05, 2], [0.8, 1.0], [1, 0.12]] },
  upperArmR: { x: [[0, -0.1], [0.18, -0.3], [0.3, 0.2], [0.8, 0.15], [1, -0.1]], z: [[0, -0.12], [0.18, -0.2], [0.3, -1.05, 2], [0.8, -1.0], [1, -0.12]] },
  foreArmL: { x: [[0, -0.3], [0.3, -1.1], [0.8, -1.0], [1, -0.3]] }, foreArmR: { x: [[0, -0.4], [0.3, -1.1], [0.8, -1.0], [1, -0.4]] },
  thighL: { x: [[0, 0], [0.3, -0.3], [0.8, -0.3], [1, 0]], z: [[0, 0], [0.3, 0.12], [1, 0]] }, thighR: { z: [[0, 0], [0.3, -0.12], [1, 0]] },
  shinL: { x: [[0, 0], [0.3, 0.45], [1, 0]] }, shinR: { x: [[0, 0], [0.3, 0.3], [1, 0]] },
});
const SUMMON = kclip({ dur: 1.2, impact: 0.5, base: bodyBase, extra: (m, u, t) => shake(m, u, t, 0.4, 0.8, 0.6) }, {
  upperArmL: { x: [[0, 0.05], [0.35, -2.85, 2], [0.8, -2.8], [1, 0.05]], z: [[0, 0.12], [0.35, 0.35], [1, 0.12]] },
  foreArmL: { x: [[0, -0.3], [0.35, -0.2], [1, -0.3]] }, handL: { x: [[0, 0], [0.35, -0.6], [1, 0]] },
  upperArmR: { x: [[0, -0.25], [0.35, -0.1], [1, -0.25]], z: [[0, -0.14], [0.35, -0.4], [1, -0.14]] },
  chest: { x: [[0, 0], [0.35, -0.22], [0.8, -0.2], [1, 0]], y: [[0, 0], [0.35, 0.15], [1, 0]] },
  head: { x: [[0, 0], [0.35, -0.45], [0.8, -0.4], [1, 0]] }, jaw: { x: [[0, 0], [0.4, 0.45], [0.8, 0.4], [1, 0]] },
});
const SPAWN = kclip({ dur: 1.6, ground: false, base: null, extra: (m, u, t) => { if (u < 0.8) { m.r(m.B.chest, Math.sin(t * 40) * 0.05, Math.sin(t * 33) * 0.06, 0); m.r(m.B.head, Math.sin(t * 29) * 0.08, 0, 0); } } }, {
  base: { py: [[0, -1.95], [0.12, -1.95], [0.78, -0.02, 3], [1, 0]] },
  upperArmR: { x: [[0, -2.9], [0.45, -2.5], [0.8, -1.0], [1, -0.2]], z: [[0, -0.2], [1, -0.12]] },
  upperArmL: { x: [[0, -2.7], [0.45, -2.3], [0.8, -0.9], [1, 0.0]], z: [[0, 0.25], [1, 0.12]] },
  foreArmR: { x: [[0, -0.2], [0.8, -0.6], [1, -0.5]] }, foreArmL: { x: [[0, -0.2], [0.8, -0.5], [1, -0.3]] },
  chest: { x: [[0, 0.25], [0.78, 0.45], [1, 0.1]] }, spine: { x: [[0, 0.2], [0.78, 0.3], [1, 0.05]] },
  head: { x: [[0, -0.5], [0.78, -0.2], [1, 0]] },
  thighL: { x: [[0, 0], [0.7, -0.6], [1, -0.1]] }, shinL: { x: [[0, 0], [0.7, 1.0], [1, 0.12]] },
  thighR: { x: [[0, 0], [0.75, -0.3], [1, 0.05]] }, shinR: { x: [[0, 0], [0.75, 0.6], [1, 0.12]] },
});
const TALK = kclip({ dur: 3.2, loop: true, base: fullBase }, {
  upperArmR: { x: [[0, 0], [0.15, -0.75], [0.35, -0.55], [0.5, -0.85], [0.7, -0.2], [1, 0]], z: [[0, 0], [0.15, 0.15], [0.5, 0.25], [1, 0]] },
  foreArmR: { x: [[0, 0], [0.15, -0.7], [0.35, -0.9], [0.5, -0.6], [0.7, 0], [1, 0]] },
  handR: { x: [[0, 0], [0.15, -0.4], [0.5, -0.5], [1, 0]], y: [[0, 0], [0.2, 0.8], [0.5, 0.6], [1, 0]] },
  head: { x: [[0, 0], [0.2, 0.08], [0.3, -0.04], [0.45, 0.08], [0.6, 0], [1, 0]], y: [[0, 0], [0.3, 0.15], [0.7, -0.1], [1, 0]] },
  chest: { y: [[0, 0], [0.3, 0.08], [0.7, -0.05], [1, 0]] },
});
const WORK = kclip({ dur: 1.1, loop: true, impact: 0.42, base: bodyBase }, {
  upperArmR: { x: [[0, -0.6], [0.32, -2.4, 2], [0.42, -0.9, 3], [0.6, -0.85], [1, -0.6]], z: [[0, -0.15], [1, -0.15]] },
  foreArmR: { x: [[0, -0.9], [0.32, -1.6], [0.42, -0.6, 3], [1, -0.9]] },
  upperArmL: { x: [[0, -0.7], [1, -0.7]], z: [[0, -0.1], [1, -0.1]] }, foreArmL: { x: [[0, -0.9], [1, -0.9]] },
  chest: { x: [[0, 0.3], [0.32, 0.15], [0.42, 0.38], [1, 0.3]] }, spine: { x: [[0, 0.15], [1, 0.15]] },
  head: { x: [[0, 0.35], [1, 0.35]] },
});
const CHARGE = {
  dur: 0.62, loop: true, steps: [0.25, 0.75],
  fn(m, u, t) {
    locomotion(m, u, t, true);
    const B = m.B;
    // override arms: sword thrust forward
    m.rot[B.upperArmR * 3] = -1.05; m.rot[B.upperArmR * 3 + 2] = -0.05; m.rot[B.foreArmR * 3] = -0.3; m.rot[B.handR * 3] = 1.1;
    m.rot[B.upperArmL * 3] = -0.9; m.rot[B.upperArmL * 3 + 2] = -0.2; m.rot[B.foreArmL * 3] = -0.9;
    m.r(B.spine, 0.15, 0, 0); m.r(B.chest, 0.12, 0, 0); m.r(B.head, -0.25, 0, 0);
  },
};

export const HUMANOID_CLIPS = {
  idle: { dur: 3.2, loop: true, fn: idleFn },
  walk: { dur: 1.0, loop: true, steps: [0.25, 0.75], moveSpeed: 1.5, fn(m, u, t) { locomotion(m, u, t, false); } },
  run: { dur: 0.66, loop: true, steps: [0.25, 0.75], moveSpeed: 4.8, fn(m, u, t) { locomotion(m, u, t, true); } },
  attack1: pickAttack(A1_1H, A1_2H, A1_FIST),
  attack2: pickAttack(A2_1H, A2_2H, A1_FIST),
  attack3: pickAttack(A3_1H, A3_1H, A1_FIST),
  cast: CAST, cast2: CAST2, hit: HIT,
  death: { dur: DEATH_BACK.dur, hold: true, ground: false, fade: 0.06, fn(m, u, t) { (m.tpl.style.deathFwd ? DEATH_FWD : DEATH_BACK).fn(m, u, t); } },
  block: BLOCK, leap: LEAP, whirl: WHIRL, howl: HOWL, shoot: SHOOT, revive: REVIVE, slam: SLAM, roar: ROAR,
  summon: SUMMON, spawn: SPAWN, talk: TALK, work: WORK, charge: CHARGE,
};
// clip subsets per role (ids exposed in model.clips)
export function clipSet(names, overrides = {}) {
  const o = {};
  for (const n of names) o[n] = overrides[n] || HUMANOID_CLIPS[n];
  for (const [k, v] of Object.entries(overrides)) o[k] = v;
  return o;
}
// make a scaled-speed copy of a clip (style-specific locomotion timing)
export function withDur(clip, dur, extra = {}) { return Object.assign({}, clip, { dur }, extra); }

// ------------------------------------------------------------------ post: ground clamp, secondary motion
export function humanoidPost(m, dt, c, u) {
  const B = m.B, rot = m.rot, pos = m.pos, S = m.tpl.style;
  const yr = clamp(m._yawRate, -9, 9);
  if (!c.loop || LOCO_SET[m.current]) { rot[B.chest * 3 + 2] -= yr * 0.022; rot[B.head * 3 + 1] -= yr * 0.045; }
  if (S.float) {
    pos[1] += S.float + Math.sin(m.t * 2.2 + m.seed) * 0.06;
    return;
  }
  if (c.ground !== false && B.thighL !== undefined) {
    const L1 = m.tpl.P.thigh, L2 = m.tpl.P.shin;
    const hx = rot[B.hips * 3] + rot[0];
    const h = Math.max(legH(rot, hx, B.thighL, B.shinL, L1, L2), legH(rot, hx, B.thighR, B.shinR, L1, L2));
    pos[B.hips * 3 + 1] += h - (L1 + L2);
    if (!LOCO_SET[m.current]) {
      rot[B.footL * 3] -= hx + rot[B.thighL * 3] + rot[B.shinL * 3];
      rot[B.footR * 3] -= hx + rot[B.thighR * 3] + rot[B.shinR * 3];
    }
  }
}
const LOCO_SET = { idle: 1, walk: 1, run: 1 };
function legH(rot, hx, ti, si, L1, L2) { const ax = hx + rot[ti * 3], az = rot[ti * 3 + 2]; return Math.cos(az) * (L1 * Math.cos(ax) + L2 * Math.cos(ax + rot[si * 3])); }

// default springs: skirt panels follow legs & lag behind motion, hair swings
export const SKIRT_SPRINGS = [
  { bone: 'skirtF', axis: 0, k: 140, d: 12, target: m => Math.min(0, m.rot[m.B.thighL * 3], m.rot[m.B.thighR * 3]) * 0.85 - m._speed * 0.03 },
  { bone: 'skirtB', axis: 0, k: 140, d: 12, target: m => Math.max(0, m.rot[m.B.thighL * 3], m.rot[m.B.thighR * 3]) * 0.75 + m._speed * 0.06 },
  { bone: 'skirtL', axis: 2, k: 120, d: 10, target: m => Math.max(0, m.rot[m.B.thighL * 3 + 2]) * 0.8 + 0.04 },
  { bone: 'skirtR', axis: 2, k: 120, d: 10, target: m => Math.min(0, m.rot[m.B.thighR * 3 + 2]) * 0.8 - 0.04 },
];
export const HAIR_SPRINGS = [
  { bone: 'hair1', axis: 0, k: 70, d: 7, target: m => -(m.rot[m.B.chest * 3] + m.rot[m.B.head * 3]) * 0.5 + m._speed * 0.07 },
  { bone: 'hair1', axis: 2, k: 60, d: 6, target: m => -m._yawRate * 0.04 },
  { bone: 'hair2', axis: 0, k: 50, d: 5, target: m => m._speed * 0.05 },
];

// standard locomotion/style presets
export const STYLE = {
  hero: { hunch: 0.02, knee: 0.1, armOut: 0.12, breath: 1, walk: { amp: 0.42, knee: 0.75, arm: 0.35, lean: 0.05 }, run: { amp: 0.72, knee: 1.35, arm: 0.6, lean: 0.24 } },
};

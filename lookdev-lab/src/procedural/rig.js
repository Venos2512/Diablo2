// Procedural rigid-skinned characters.
//  - geometry helpers (G, T, paint, mat, bump, flatten)
//  - Rig: bone + part builder -> Template (shared BufferGeometry + bone defs, cached by key)
//  - makeCharMaterial: shared patched MeshStandardMaterial program (vertex color + per-vertex rough/metal/emissive,
//    per-instance flash / tint / frozen / highlight / rim / ghost uniforms)
//  - CharacterModel: runtime (clip player w/ crossfade, events, locomotion auto-select, secondary motion hooks,
//    sockets, equipment, verlet cape)
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Simplex, clamp, lerp, TAU } from '../core/util.js';
import { SHARED } from '../core/shared.js';
import { sculptParts } from './sculpt.js';

export const NOISE = new Simplex(9071);
const _c = new THREE.Color(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _e = new THREE.Euler(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _s = new THREE.Vector3();

// ------------------------------------------------------------------ geometry helpers
function keepPN(g) {
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  if (!g.index) {
    const n = g.attributes.position.count; const idx = new (n > 65535 ? Uint32Array : Uint16Array)(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  g.clearGroups();
  return g;
}
const V2 = (x, y) => new THREE.Vector2(Math.max(1e-4, x), y);
export const G = {
  // tapered capsule hanging from y=0 (radius r0) down to y=-len (radius r1)
  limb(r0, r1, len, rs = 8) {
    const pts = [];
    for (let i = 0; i <= 3; i++) { const a = -Math.PI / 2 + (i / 3) * Math.PI / 2; pts.push(V2(Math.cos(a) * r1, -len + Math.sin(a) * r1)); }
    for (let i = 1; i < 3; i++) { const t = i / 3; pts.push(V2(lerp(r1, r0, t), -len + len * t)); }
    for (let i = 0; i <= 3; i++) { const a = (i / 3) * Math.PI / 2; pts.push(V2(Math.cos(a) * r0, Math.sin(a) * r0)); }
    return keepPN(new THREE.LatheGeometry(pts, rs));
  },
  // lathe from profile [[r,y],...] listed bottom -> top
  lathe(profile, rs = 12, phiStart = 0, phiLen = TAU) { return keepPN(new THREE.LatheGeometry(profile.map(p => V2(p[0], p[1])), rs, phiStart, phiLen)); },
  sphere(r, ws = 12, hs = 8) { return keepPN(new THREE.SphereGeometry(r, ws, hs)); },
  ell(rx, ry, rz, ws = 12, hs = 8) { return keepPN(new THREE.SphereGeometry(1, ws, hs).scale(rx, ry, rz)); },
  box(w, h, d) { return keepPN(new THREE.BoxGeometry(w, h, d)); },
  rbox(w, h, d, r = 0.02, seg = 2) { return keepPN(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4))); },
  cyl(r0, r1, h, s = 8, open = false) { return keepPN(new THREE.CylinderGeometry(r0, r1, h, s, 1, open)); },
  cone(r, h, s = 6) { return keepPN(new THREE.ConeGeometry(r, h, s)); },
  torus(R, r, rs = 6, ts = 16, arc = TAU) { return keepPN(new THREE.TorusGeometry(R, r, rs, ts, arc)); },
  shell(r, phiS, phiL, thS, thL, ws = 12, hs = 8) { return keepPN(new THREE.SphereGeometry(r, ws, hs, phiS, phiL, thS, thL)); },
  ico(r, detail = 0) { return keepPN(new THREE.IcosahedronGeometry(r, detail)); },
  dodeca(r) { return keepPN(new THREE.DodecahedronGeometry(r, 0)); },
  // tapered tube through points [[x,y,z],...] radius r0 -> r1
  horn(points, r0, r1, rs = 6, ts = 10) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
    const g = new THREE.TubeGeometry(curve, ts, 1, rs, false);
    const pos = g.attributes.position;
    for (let i = 0; i <= ts; i++) {
      const t = i / ts; const c = curve.getPointAt(t); const r = Math.max(1e-4, lerp(r0, r1, t));
      for (let j = 0; j <= rs; j++) { const k = i * (rs + 1) + j; _v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c); pos.setXYZ(k, _v.x, _v.y, _v.z); }
    }
    g.computeVertexNormals();
    return keepPN(g);
  },
  // diamond-section blade from y=0 (width w) to tip at y=len; thickness t
  blade(len, w, t, tip = 0.25) {
    const g = G.lathe([[w * 0.5, 0], [w * 0.5, len * (1 - tip)], [w * 0.02, len]], 4, Math.PI / 4);
    g.scale(1, 1, t / w);
    return g;
  },
  // flat panel hanging down from y=0: width w, length len, slight curve (for skirts / capes / strips)
  panel(w, len, thick = 0.015, curve = 0.03, segW = 3, segL = 4) {
    const g = new THREE.BoxGeometry(w, len, thick, segW, segL, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setXYZ(i, x, y - len / 2, p.getZ(i) + curve * (1 - Math.pow(2 * x / w, 2)) + (y - len / 2) * 0.0);
    }
    g.computeVertexNormals();
    return keepPN(g);
  },
};
export function T(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _m.compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz)); g.applyMatrix4(_m); return g;
}
export function bump(g, amp, f = 4, seed = 0) {
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = NOISE.noise3(x * f + seed * 1.7, y * f - seed, z * f + 3.1) * amp;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  g.computeVertexNormals();
  return g;
}
export function flatten(g) { const f = g.toNonIndexed(); f.computeVertexNormals(); return keepPN(f); }
export function merge(list) { const m = mergeGeometries(list.map(keepPN), false); for (const g of list) g.dispose(); return m; }
// paint vertex colors. color: hex | THREE.Color | fn(x,y,z,outColor). o.v noise variation, o.f noise freq,
// o.grad [y0, y1, mul0, mul1] brightness gradient along local y, o.seed
export function paint(g, color, o = {}) {
  const pos = g.attributes.position, n = pos.count, arr = new Float32Array(n * 3);
  const isFn = typeof color === 'function';
  const base = isFn ? null : new THREE.Color(color);
  const v = o.v ?? 0.07, f = o.f ?? 7, seed = (o.seed ?? 0) * 13.7, grad = o.grad;
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (base) _c.copy(base); else color(x, y, z, _c);
    let k = 1 + (v ? NOISE.noise3(x * f + seed, y * f + 11.3, z * f - seed) * v : 0);
    if (grad) k *= lerp(grad[2], grad[3], clamp((y - grad[0]) / (grad[1] - grad[0])));
    arr[i * 3] = _c.r * k; arr[i * 3 + 1] = _c.g * k; arr[i * 3 + 2] = _c.b * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
export function mat(g, rough = 0.8, metal = 0, emis = 0) {
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = rough; a[i * 3 + 1] = metal; a[i * 3 + 2] = emis; }
  g.setAttribute('aMat', new THREE.BufferAttribute(a, 3));
  return g;
}
export const col = (hex) => new THREE.Color(hex);

// ------------------------------------------------------------------ shared character material
const CHAR_KEY = 'ashen-char-v3';
export function makeCharMaterial({ ghost = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0 });
  const u = {
    uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uTint: { value: new THREE.Color(1, 1, 1) }, uTintAmt: { value: 0 },
    uHighlight: { value: 0 }, uFrozen: { value: 0 },
    uRimColor: { value: new THREE.Color(0.42, 0.48, 0.62) }, uRim: { value: 0.16 },
    uGhost: { value: ghost ? 1 : 0 }, uEmis: { value: 1 },
    uCrack: { value: 0 }, uCrackScale: { value: 6 }, uCrackColor: { value: new THREE.Color(3.2, 0.9, 0.2) }, uTime: SHARED.uniforms.uTime,
  };
  m.userData.u = u;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aMat;\nvarying vec3 vMat;\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMat = aMat; vObj = position;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vMat; varying vec3 vObj;
uniform float uFlash, uTintAmt, uHighlight, uFrozen, uRim, uGhost, uEmis, uCrack, uCrackScale, uTime;
uniform vec3 uFlashColor, uTint, uRimColor, uCrackColor;
// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT)
vec3 m289c(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; } vec4 m289c(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permc(vec4 x){ return m289c(((x * 34.0) + 10.0) * x); }
float snoiseC(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = m289c(i);
  vec4 p = permc(permc(permc(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw); vec4 s0 = floor(b0) * 2.0 + 1.0; vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0)); vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = inversesqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0); m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec3 Vd = normalize(vViewPosition);
  float ndv = clamp(dot(normal, Vd), 0.0, 1.0);
  float rim = pow(1.0 - ndv, 2.4);
  roughnessFactor = vMat.x;
  metalnessFactor = vMat.y;
  vec3 baseCol = diffuseColor.rgb;
  totalEmissiveRadiance += baseCol * vMat.z * uEmis;
  if (uCrack > 0.0) {
    vec3 q = vObj * uCrackScale;
    float n1 = abs(snoiseC(q)), n2 = abs(snoiseC(q * 2.3 + 7.1));
    float crack = (1.0 - smoothstep(0.0, 0.07, n1)) + 0.55 * (1.0 - smoothstep(0.0, 0.05, n2)) * smoothstep(0.2, 0.5, n1);
    crack *= 1.0 - smoothstep(0.35, 0.8, vMat.y); // metal plates stay mostly intact
    float pulse = 0.75 + 0.25 * sin(uTime * 2.1 + vObj.y * 3.0);
    diffuseColor.rgb *= 1.0 - crack * 0.6;
    totalEmissiveRadiance += uCrackColor * crack * uCrack * pulse;
  }
  float lum = dot(baseCol, vec3(0.3, 0.55, 0.15));
  diffuseColor.rgb = mix(diffuseColor.rgb, uTint * (0.3 + lum * 1.4), uTintAmt);
  totalEmissiveRadiance += uTint * uTintAmt * (0.04 + rim * 0.35);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.82, 1.0) * (0.5 + lum), uFrozen * 0.75);
  roughnessFactor = mix(roughnessFactor, 0.15, uFrozen);
  metalnessFactor = mix(metalnessFactor, 0.0, uFrozen * 0.6);
  totalEmissiveRadiance += (vec3(0.04, 0.12, 0.26) + vec3(0.35, 0.65, 1.0) * rim * 0.9) * uFrozen;
  totalEmissiveRadiance += uRimColor * rim * uRim;
  totalEmissiveRadiance += uHighlight * (baseCol * 0.25 + vec3(1.0, 0.86, 0.62) * rim * 0.85);
  diffuseColor.rgb = mix(diffuseColor.rgb, uFlashColor, uFlash * 0.6);
  totalEmissiveRadiance += uFlashColor * uFlash * 1.1;
  if (uGhost > 0.5) { totalEmissiveRadiance += uRimColor * (0.18 + rim * 1.5); diffuseColor.a *= (0.22 + rim * 0.78); }
}`);
  };
  m.customProgramCacheKey = () => CHAR_KEY;
  if (ghost) { m.transparent = true; m.depthWrite = true; }
  return m;
}

// ------------------------------------------------------------------ rig / template builder
export class Rig {
  constructor() { this.defs = []; this.idx = {}; this.parts = []; this.sockets = {}; this.blobs = []; this.sculptOpts = null; this.sculptKey = null; }
  bone(name, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    if (parent != null && this.idx[parent] === undefined) throw new Error('rig: missing parent ' + parent);
    this.idx[name] = this.defs.length;
    this.defs.push({ name, parent: parent == null ? -1 : this.idx[parent], pos: new THREE.Vector3(x, y, z), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)) });
    return this;
  }
  has(n) { return this.idx[n] !== undefined; }
  // add a part: geometry in bone-local space. o: rough, metal, emis, v, f, grad, seed, bump:[amp,f], flat, tag
  part(bone, geom, color, o = {}) {
    if (this.idx[bone] === undefined) throw new Error('rig: part on missing bone ' + bone);
    if (o.bump) bump(geom, o.bump[0], o.bump[1], o.seed || 0);
    if (o.flat) geom = flatten(geom);
    paint(geom, color, o);
    mat(geom, o.rough ?? 0.8, o.metal ?? 0, o.emis ?? 0);
    this.parts.push({ bone, geom, tag: o.tag || null });
    return geom;
  }
  // sculpted (SDF) body volume on a bone: shape in bone-local space (see sculpt.js). o: k, sub, rough, metal, emis, v, f, grad, prio, skin, bump, group
  blob(bone, shape, color, o = {}) {
    if (this.idx[bone] === undefined) throw new Error('rig: blob on missing bone ' + bone);
    this.blobs.push({ bone, shape, color, o });
    return this;
  }
  // mirrored helper: f(side, sign) called for 'L' (+1) and 'R' (-1)
  sides(f) { f('L', 1); f('R', -1); }
  socket(name, bone, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { this.sockets[name] = { bone, pos: [x, y, z], rot: [rx, ry, rz] }; }
  bindMats() {
    const mats = [];
    for (let i = 0; i < this.defs.length; i++) {
      const d = this.defs[i];
      const local = new THREE.Matrix4().compose(d.pos, d.quat, new THREE.Vector3(1, 1, 1));
      mats.push(d.parent >= 0 ? mats[d.parent].clone().multiply(local) : local);
    }
    return mats;
  }
  geometry(filter) {
    const mats = this._mats || (this._mats = this.bindMats());
    const list = [];
    let sparts = [];
    if (this.blobs.length) {
      sparts = sculptParts(this, this.sculptOpts || {});
      this.sculptStats = Object.fromEntries(sparts.map(p => [p.name, p.stats]));
    }
    for (const p of this.parts) {
      if (filter && !filter(p.tag)) continue;
      const bi = this.idx[p.bone];
      const g = p.geom.clone(); g.applyMatrix4(mats[bi]);
      const n = g.attributes.position.count;
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = bi; sw[i * 4] = 1; }
      g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
      list.push(g);
    }
    const shared = new Set(sparts.map(p => p.geo));
    for (const p of sparts) list.push(p.geo);
    const m = list.length === 1 && shared.has(list[0]) ? list[0].clone() : mergeGeometries(list, false);
    for (const g of list) if (!shared.has(g)) g.dispose();
    if (!this.sculptKey) for (const g of shared) g.dispose();
    m.computeBoundingSphere();
    return m;
  }
  // meta: { kind, height, radius, style, clips, runAt, scale, ghost, post, springs, cape, extra }
  template(meta, filter) {
    const mats = this._mats || (this._mats = this.bindMats());
    const tpl = Object.assign({ defs: this.defs, idx: this.idx, sockets: this.sockets, inv: mats.map(m => m.clone().invert()) }, meta);
    tpl.geometry = this.geometry(filter);
    tpl.triangles = tpl.geometry.index.count / 3;
    tpl.sculptStats = this.sculptStats || null;
    for (const p of this.parts) p.geom.dispose();
    this.parts = [];
    return tpl;
  }
}

const TEMPLATES = new Map();
export function cachedTemplate(key, build) {
  let t = TEMPLATES.get(key);
  if (!t) { t = build(); t.key = key; TEMPLATES.set(key, t); }
  return t;
}

// ------------------------------------------------------------------ keyframe helper
// keys: [[u, value, ease?], ...]  ease: 0 smooth(default) 1 linear 2 out(fast start) 3 in(slow start) 4 back(overshoot)
const EASE = [
  t => t * t * (3 - 2 * t), t => t, t => 1 - (1 - t) * (1 - t) * (1 - t), t => t * t * t,
  t => { const s = 1.70158, a = t - 1; return 1 + (s + 1) * a * a * a + s * a * a; },
];
export function K(u, keys) {
  const n = keys.length;
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < n; i++) {
    const k = keys[i];
    if (u <= k[0]) { const p = keys[i - 1]; const d = k[0] - p[0]; const t = d > 0 ? (u - p[0]) / d : 1; return p[1] + (k[1] - p[1]) * EASE[k[2] || 0](t); }
  }
  return keys[n - 1][1];
}
// Build a keyframed clip. channels: { boneName: { x:keys, y:keys, z:keys, px:keys, py:keys, pz:keys } }
// opts: dur, loop, impact (fraction), steps, ground, hold, extra(m,u,t)
export function kclip(opts, channels) {
  const list = [];
  for (const [bone, ch] of Object.entries(channels)) for (const [axis, keys] of Object.entries(ch)) {
    const a = { x: 0, y: 1, z: 2, px: 3, py: 4, pz: 5 }[axis]; list.push([bone, a, keys]);
  }
  const extra = opts.extra, base = opts.base;
  return Object.assign({}, opts, {
    fn(m, u, t) {
      if (base) base(m, u, t);
      const B = m.B;
      for (let i = 0; i < list.length; i++) {
        const c = list[i]; const bi = B[c[0]]; if (bi === undefined) continue;
        const v = K(u, c[2]);
        if (c[1] < 3) m.rot[bi * 3 + c[1]] += v; else m.pos[bi * 3 + c[1] - 3] += v;
      }
      if (extra) extra(m, u, t);
    },
  });
}

// ------------------------------------------------------------------ fallbacks for missing clips
const FALLBACK = {
  attack2: 'attack1', attack3: 'attack1', cast2: 'cast', cast: 'attack1', shoot: 'attack1', slam: 'attack1',
  roar: 'cast2', block: 'hit', leap: 'attack1', whirl: 'attack2', howl: 'cast2', spawn: 'idle', revive: 'cast',
  summon: 'cast', charge: 'run', run: 'walk', walk: 'idle', fly: 'walk', talk: 'idle', work: 'idle', hit: 'idle',
  death: 'idle', idle: 'idle',
};
const LOCO = { idle: 1, walk: 1, run: 1 };

// ------------------------------------------------------------------ verlet cape / cloak
export class Cape {
  // o: bone (anchor bone), anchors: [x,y,z] start..end (bone-local, across the back), cols, rows, length,
  //    color, rough, taper (bottom width factor), body: [{bone, x,y,z, r}] collision spheres, tatter
  constructor(model, o) {
    this.model = model; this.o = o;
    const cols = this.cols = o.cols || 6, rows = this.rows = o.rows || 8;
    const n = cols * rows;
    this.cur = new Float32Array(n * 3); this.prev = new Float32Array(n * 3);
    this.anchorBone = model.bones[o.bone];
    this.anchors = []; // local anchor positions
    for (let c = 0; c < cols; c++) { const t = c / (cols - 1); this.anchors.push(new THREE.Vector3().lerpVectors(new THREE.Vector3(...o.a0), new THREE.Vector3(...o.a1), t)); }
    this.restH = o.width / (cols - 1); this.restV = o.length / (rows - 1);
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(n * 3), 3); this.posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.posAttr);
    const colArr = new Float32Array(n * 3); const base = new THREE.Color(o.color || 0x3a2a20);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c; const k = (1 - r / rows * 0.35) * (1 + NOISE.noise2(c * 0.9, r * 0.7) * 0.08);
      colArr[i * 3] = base.r * k; colArr[i * 3 + 1] = base.g * k; colArr[i * 3 + 2] = base.b * k;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    const idx = [];
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      if (o.tatter && r === rows - 2 && NOISE.noise2(c * 3.1, 7.7) > 0.25) continue;
      idx.push(a, d, b, b, d, e);
    }
    geo.setIndex(idx);
    this.geo = geo;
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.rough ?? 0.9, metalness: 0, side: THREE.DoubleSide, transparent: !!o.ghost, opacity: o.ghost ? 0.5 : 1 });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.castShadow = !o.ghost; this.mesh.receiveShadow = true;
    model.root.add(this.mesh);
    this.body = (o.body || []).map(b => ({ bone: model.bones[b.bone], off: new THREE.Vector3(b.x, b.y, b.z), r: b.r, w: new THREE.Vector3() }));
    this._inv = new THREE.Matrix4(); this._init = false; this._last = new THREE.Vector3();
  }
  _anchorWorld(c, out) { return out.copy(this.anchors[c]).applyMatrix4(this.anchorBone.matrixWorld); }
  reset() {
    const { cols, rows } = this;
    for (let c = 0; c < cols; c++) {
      this._anchorWorld(c, _v);
      _v2.set(0, 0, -1).transformDirection(this.anchorBone.matrixWorld).multiplyScalar(0.02);
      for (let r = 0; r < rows; r++) {
        const i = (r * cols + c) * 3;
        this.cur[i] = _v.x + _v2.x * r; this.cur[i + 1] = _v.y - r * this.restV; this.cur[i + 2] = _v.z + _v2.z * r;
        this.prev[i] = this.cur[i]; this.prev[i + 1] = this.cur[i + 1]; this.prev[i + 2] = this.cur[i + 2];
      }
    }
    this._init = true;
  }
  update(dt) {
    const root = this.model.root;
    root.updateMatrixWorld(true);
    if (!this._init) this.reset();
    _v.setFromMatrixPosition(root.matrixWorld);
    if (_v.distanceToSquared(this._last) > 6) this.reset();
    this._last.copy(_v);
    const { cols, rows, cur, prev } = this;
    const steps = 2; const h = Math.min(dt, 1 / 30) / steps;
    const wind = SHARED.uniforms.uWind.value, time = SHARED.uniforms.uTime.value;
    for (const b of this.body) b.w.copy(b.off).applyMatrix4(b.bone.matrixWorld);
    for (let s = 0; s < steps; s++) {
      for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        const gust = 0.6 + 0.4 * Math.sin(time * 2.3 + c * 0.7 + r * 0.4);
        for (let k = 0; k < 3; k++) {
          const x = cur[i + k], v = (x - prev[i + k]) * 0.965;
          prev[i + k] = x;
          const acc = k === 1 ? -9.8 : (k === 0 ? wind.x : wind.y) * 0.8 * gust;
          cur[i + k] = x + v + acc * h * h;
        }
      }
      for (let it = 0; it < 4; it++) {
        for (let c = 0; c < cols; c++) {
          this._anchorWorld(c, _v);
          const i = c * 3; cur[i] = _v.x; cur[i + 1] = _v.y; cur[i + 2] = _v.z;
        }
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c < cols - 1) this._con(i, i + 1, this.restH * (1 - (r / rows) * (this.o.taper ?? 0)), r === 0);
          if (r < rows - 1) this._con(i, i + cols, this.restV, r === 0);
        }
        for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 3;
          for (const b of this.body) {
            const dx = cur[i] - b.w.x, dy = cur[i + 1] - b.w.y, dz = cur[i + 2] - b.w.z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < b.r * b.r && d2 > 1e-8) { const d = Math.sqrt(d2), k = b.r / d; cur[i] = b.w.x + dx * k; cur[i + 1] = b.w.y + dy * k; cur[i + 2] = b.w.z + dz * k; }
          }
          if (cur[i + 1] < 0.02) cur[i + 1] = 0.02;
        }
      }
    }
    this._inv.copy(root.matrixWorld).invert();
    const pa = this.posAttr.array;
    for (let i = 0; i < cols * rows; i++) {
      _v.set(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2]).applyMatrix4(this._inv);
      pa[i * 3] = _v.x; pa[i * 3 + 1] = _v.y; pa[i * 3 + 2] = _v.z;
    }
    this.posAttr.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
  _con(a, b, rest, pinA) {
    const cur = this.cur, ia = a * 3, ib = b * 3;
    const dx = cur[ib] - cur[ia], dy = cur[ib + 1] - cur[ia + 1], dz = cur[ib + 2] - cur[ia + 2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
    const diff = (d - rest) / d;
    if (pinA) { cur[ib] -= dx * diff; cur[ib + 1] -= dy * diff; cur[ib + 2] -= dz * diff; return; }
    const h = diff * 0.5;
    cur[ia] += dx * h; cur[ia + 1] += dy * h; cur[ia + 2] += dz * h;
    cur[ib] -= dx * h; cur[ib + 1] -= dy * h; cur[ib + 2] -= dz * h;
  }
  setOpacity(a) { this.mat.opacity = a * (this.o.ghost ? 0.5 : 1); this.mat.transparent = a < 0.999 || !!this.o.ghost; }
  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mat.dispose(); }
}

// ------------------------------------------------------------------ CharacterModel
export class CharacterModel {
  constructor(tpl, opts = {}) {
    this.tpl = tpl; this.kind = tpl.kind; this.opts = opts;
    this.ghost = !!(opts.ghost || tpl.ghost);
    this.root = new THREE.Group(); this.root.name = 'char:' + tpl.kind;
    const n = this.n = tpl.defs.length;
    const list = [], byName = {};
    for (const d of tpl.defs) { const b = new THREE.Bone(); b.name = d.name; b.position.copy(d.pos); b.quaternion.copy(d.quat); list.push(b); byName[d.name] = b; }
    for (let i = 0; i < n; i++) { const p = tpl.defs[i].parent; if (p >= 0) list[p].add(list[i]); }
    this.boneList = list; this.bones = byName; this.B = tpl.idx;
    this.material = makeCharMaterial({ ghost: this.ghost });
    const mesh = new THREE.SkinnedMesh(tpl.geometry, this.material);
    mesh.add(list[0]);
    mesh.bind(new THREE.Skeleton(list, tpl.inv), new THREE.Matrix4());
    mesh.castShadow = !this.ghost; mesh.receiveShadow = true;
    this.scale = (opts.scale ?? 1) * (tpl.scale ?? 1);
    mesh.scale.setScalar(this.scale);
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, tpl.height * 0.5, 0), tpl.height * 0.8 + 0.5);
    this.mesh = mesh; this.root.add(mesh);
    this.height = tpl.height * this.scale; this.radius = tpl.radius * this.scale;
    // pose buffers
    this.rot = new Float32Array(n * 3); this.pos = new Float32Array(n * 3);
    this.snapQ = new Float32Array(n * 4); this.snapP = new Float32Array(n * 3);
    this.bindQ = new Float32Array(n * 4); this.bindP = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const d = tpl.defs[i]; d.quat.toArray(this.bindQ, i * 4); d.pos.toArray(this.bindP, i * 3); }
    // sockets
    this.sockets = {};
    for (const [name, s] of Object.entries(tpl.sockets)) {
      const o = new THREE.Object3D(); o.name = 'socket:' + name; o.position.set(s.pos[0], s.pos[1], s.pos[2]); o.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
      list[tpl.idx[s.bone]].add(o); this.sockets[name] = o;
    }
    // clips
    this.clipSet = tpl.clips; this.clips = Object.keys(tpl.clips);
    this.clipInfo = {};
    for (const k of this.clips) { const c = tpl.clips[k]; this.clipInfo[k] = { duration: c.dur, impact: c.impact != null ? c.impact * c.dur : undefined, loop: !!c.loop }; }
    this.onEvent = null;
    this.current = ''; this.clip = null; this.t = 0; this.rate = 1; this._u = 0;
    this.fadeT = 0; this.fadeDur = 0; this.loco = true; this.frozen = false;
    this._lastYaw = 0; this._yawRate = 0; this._speed = 0; this._impactFired = false; this._ended = false;
    this.spring = new Float32Array((tpl.springs ? tpl.springs.length : 0) * 2);
    this.state = {}; // scratch for clip-specific state (e.g. jitter seeds)
    this.seed = opts.seed ?? Math.floor(Math.random() * 1000);
    this.weaponKind = opts.weaponKind || tpl.weaponKind || 'none';
    this.equip = { weapon: null, offhand: null, helm: null }; this.armor = null;
    this.opacity = 1;
    if (tpl.rim) { this.material.userData.u.uRimColor.value.set(tpl.rim[0]); this.material.userData.u.uRim.value = tpl.rim[1]; }
    if (tpl.cracks) { const u = this.material.userData.u; u.uCrack.value = tpl.cracks.strength ?? 1; u.uCrackScale.value = tpl.cracks.scale ?? 6; if (tpl.cracks.color) u.uCrackColor.value.copy(tpl.cracks.color); }
    if (opts.tint != null || opts.champion || opts.unique) {
      const c = opts.tint != null ? opts.tint : (opts.unique ? 0xffc060 : 0x6080ff);
      this.setRim(new THREE.Color(c).multiplyScalar(opts.unique ? 1.6 : 1.3), 1.0);
    }
    this.cape = tpl.cape ? new Cape(this, tpl.cape) : null;
    if (tpl.init) tpl.init(this);
    this.play('idle', { fade: 0 });
    this._evaluate(0, 0);
  }
  _emit(name) { if (this.onEvent) this.onEvent(name); }
  _resolve(name) {
    let n = name, guard = 0;
    while (!this.clipSet[n] && guard++ < 8) n = FALLBACK[n] || 'idle';
    return this.clipSet[n] ? n : this.clips[0];
  }
  _snapshot() {
    const L = this.boneList;
    for (let i = 0; i < this.n; i++) { L[i].quaternion.toArray(this.snapQ, i * 4); L[i].position.toArray(this.snapP, i * 3); }
  }
  play(name, o = {}) {
    const n = this._resolve(name);
    const c = this.clipSet[n];
    const speed = o.speed ?? 1;
    if (n === this.current && c.loop && !o.restart) { if (!LOCO[n]) this.rate = speed; this.loco = !!LOCO[n]; return c.dur / speed; }
    this._snapshot();
    const prevU = this._u, wasLoco = !!LOCO[this.current];
    this.current = n; this.clip = c; this.rate = speed;
    this.t = (LOCO[n] && wasLoco) ? prevU * c.dur : 0;
    this._u = (LOCO[n] && wasLoco) ? prevU : 0;
    this.fadeDur = o.fade ?? (c.fade ?? 0.12); this.fadeT = 0;
    this.loco = !!LOCO[n]; this._impactFired = false; this._ended = false;
    if (this.tpl.onPlay) this.tpl.onPlay(this, n);
    return c.dur / speed;
  }
  // debug/tools: freeze a clip at normalized time u (no events)
  pose(name, u = 0) {
    const n = this._resolve(name); this.current = n; this.clip = this.clipSet[n]; this.fadeDur = 0; this.loco = false;
    this._u = u; this.t = u * this.clip.dur; this._evaluate(0, u);
  }
  _chooseLoco(speed) {
    const tpl = this.tpl; let want;
    if (speed < 0.12) want = 'idle';
    else if (!this.clipSet.run) want = 'walk';
    else want = speed > (tpl.runAt || 3.2) * this.scale + (this.current === 'run' ? -0.35 : 0.35) * this.scale ? 'run' : 'walk';
    if (!this.clipSet[want]) want = 'idle';
    if (want !== this.current) this.play(want, { fade: 0.2 });
    const c = this.clip;
    if (want !== 'idle' && c.moveSpeed) this.rate = clamp(speed / (c.moveSpeed * this.scale), 0.45, 2.4);
    else this.rate = 1;
  }
  update(dt, ctx) {
    const u0 = this.material.userData.u;
    if (u0.uFlash.value > 0) u0.uFlash.value = Math.max(0, u0.uFlash.value - dt * 7);
    const speed = ctx && ctx.speed !== undefined ? ctx.speed : 0;
    const yaw = this.root.rotation.y;
    let dy = yaw - this._lastYaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this._lastYaw = yaw;
    const yr = dt > 1e-5 ? clamp(dy / dt, -12, 12) : 0;
    this._yawRate += (yr - this._yawRate) * Math.min(1, dt * 8);
    this._speed += (speed - this._speed) * Math.min(1, dt * 8);
    if (this.frozen) { if (this.cape) this.cape.update(dt * 0.2); return; }
    if (this.loco) this._chooseLoco(speed);
    const c = this.clip;
    this.t += dt * this.rate;
    let u;
    if (c.loop) {
      const pu = this._u; u = (this.t / c.dur) % 1; if (u < 0) u += 1;
      const wrapped = u < pu;
      if (c.steps) for (let i = 0; i < c.steps.length; i++) { const s = c.steps[i]; if (wrapped ? (s > pu || s <= u) : (s > pu && s <= u)) this._emit('footstep'); }
      if (c.impact != null && (wrapped ? (c.impact > pu || c.impact <= u) : (c.impact > pu && c.impact <= u))) this._emit('impact');
    } else {
      u = Math.min(1, this.t / c.dur);
      if (c.impact != null && !this._impactFired && u >= c.impact) { this._impactFired = true; this._emit('impact'); }
      if (c.steps) { const pu = this._u; for (let i = 0; i < c.steps.length; i++) { const s = c.steps[i]; if (s > pu && s <= u) this._emit('footstep'); } }
      if (u >= 1 && !this._ended) {
        this._ended = true;
        const before = this.clip;
        this._emit('end');
        if (this.clip === before && !c.hold) this.play('idle', { fade: 0.18 });
        if (this.clip !== before) { this._u = 0; this._evaluate(dt, 0); return; }
      }
    }
    this._u = u;
    this._evaluate(dt, u);
    if (this.cape) this.cape.update(dt);
    if (this.tpl.tick) this.tpl.tick(this, dt);
  }
  _evaluate(dt, u) {
    this.rot.fill(0); this.pos.fill(0);
    this.clip.fn(this, u, this.t);
    if (this.tpl.post) this.tpl.post(this, dt, this.clip, u);
    if (this.tpl.springs) this._springs(dt);
    this._apply(dt);
  }
  _springs(dt) {
    const S = this.tpl.springs, st = this.spring, h = Math.min(dt, 1 / 30);
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; const bi = this.B[s.bone]; if (bi === undefined) continue;
      const target = s.target(this);
      let a = st[i * 2], v = st[i * 2 + 1];
      v += ((target - a) * (s.k || 90) - v * (s.d || 10)) * h; a += v * h;
      if (!isFinite(a)) { a = 0; v = 0; }
      st[i * 2] = a; st[i * 2 + 1] = v;
      this.rot[bi * 3 + (s.axis || 0)] += a;
    }
  }
  _apply(dt) {
    let w = 1;
    if (this.fadeDur > 0 && this.fadeT < this.fadeDur) { this.fadeT += dt; w = Math.min(1, this.fadeT / this.fadeDur); w = w * w * (3 - 2 * w); }
    const L = this.boneList, rot = this.rot, pos = this.pos, bq = this.bindQ, bp = this.bindP, sq = this.snapQ, sp = this.snapP;
    for (let i = 0; i < this.n; i++) {
      const o3 = i * 3, o4 = i * 4, b = L[i];
      _e.set(rot[o3], rot[o3 + 1], rot[o3 + 2]); _q.setFromEuler(_e);
      _q2.set(bq[o4], bq[o4 + 1], bq[o4 + 2], bq[o4 + 3]).multiply(_q);
      const x = bp[o3] + pos[o3], y = bp[o3 + 1] + pos[o3 + 1], z = bp[o3 + 2] + pos[o3 + 2];
      if (w < 1) {
        b.quaternion.set(sq[o4], sq[o4 + 1], sq[o4 + 2], sq[o4 + 3]).slerp(_q2, w);
        b.position.set(sp[o3] + (x - sp[o3]) * w, sp[o3 + 1] + (y - sp[o3 + 1]) * w, sp[o3 + 2] + (z - sp[o3 + 2]) * w);
      } else { b.quaternion.copy(_q2); b.position.set(x, y, z); }
    }
  }
  // pose writers used by clips (index-based; undefined bones are ignored)
  r(i, x, y, z) { if (i === undefined) return; const o = i * 3; this.rot[o] += x; this.rot[o + 1] += y; this.rot[o + 2] += z; }
  p(i, x, y, z) { if (i === undefined) return; const o = i * 3; this.pos[o] += x; this.pos[o + 1] += y; this.pos[o + 2] += z; }
  // ---------------------------------------------------------------- effects
  flash(strength = 1, color = 0xffffff) { const u = this.material.userData.u; u.uFlash.value = Math.max(u.uFlash.value, strength); u.uFlashColor.value.set(color); }
  setTint(color, amount = 0.5) { const u = this.material.userData.u; if (color == null) u.uTintAmt.value = 0; else { u.uTint.value.set(color); u.uTintAmt.value = amount; } }
  setFrozen(f) { this.frozen = !!f; this.material.userData.u.uFrozen.value = f ? 1 : 0; }
  setHighlight(on) { this.material.userData.u.uHighlight.value = on ? 1 : 0; }
  setRim(color, strength) { const u = this.material.userData.u; if (color != null) u.uRimColor.value.set(color); u.uRim.value = strength; }
  setOpacity(a) {
    this.opacity = a;
    this.material.opacity = a; this.material.transparent = a < 0.999 || this.ghost;
    this.mesh.castShadow = !this.ghost && a > 0.6;
    if (this.cape) this.cape.setOpacity(a);
    for (const k in this.equip) { const o = this.equip[k]; if (o) o.traverse(ch => { if (ch.material) { ch.material.transparent = a < 0.999 || ch.material.userData.wasTransparent; ch.material.opacity = a; } }); }
  }
  setEquipment(eq = {}) {
    if (eq.weapon !== undefined) this._attach('handR', 'weapon', eq.weapon);
    if (eq.weaponKind !== undefined) this.weaponKind = eq.weaponKind || 'none';
    if (eq.offhand !== undefined) { this._attach('shield', 'offhand', eq.offhand); this.state.shieldGuard = !!eq.offhand; }
    if (eq.helm !== undefined) this._attach('head', 'helm', eq.helm);
    if (eq.armor !== undefined) this.armor = eq.armor;
    if (this.tpl.variant && (eq.armor !== undefined || eq.helm !== undefined)) {
      const t2 = this.tpl.variant({ armor: this.armor, helm: !!this.equip.helm });
      if (t2 && t2.geometry !== this.mesh.geometry) this.mesh.geometry = t2.geometry;
    }
  }
  _attach(socketName, slot, obj) {
    const s = this.sockets[socketName] || this.sockets.handR;
    const prev = this.equip[slot];
    if (prev && prev.parent === s) s.remove(prev);
    this.equip[slot] = obj || null;
    if (obj) { s.add(obj); obj.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } }); }
  }
  dispose() {
    this.root.removeFromParent();
    this.material.dispose();
    if (this.cape) this.cape.dispose();
    this.mesh.skeleton.dispose();
  }
}

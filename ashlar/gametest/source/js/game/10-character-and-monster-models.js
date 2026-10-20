// ===== game part 10-character-and-monster-models (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var Zg = `modulepreload`, Qg = function(e4, t2) {
  return new URL(e4, t2).href;
}, $g = {}, e_ = function(e4, t2, n2) {
  let r2 = Promise.resolve();
  if (t2 && t2.length > 0) {
    let o2 = function(e6) {
      return Promise.all(e6.map((e7) => Promise.resolve(e7).then((e8) => ({ status: `fulfilled`, value: e8 }), (e8) => ({ status: `rejected`, reason: e8 }))));
    };
    let e5 = document.getElementsByTagName(`link`), i3 = document.querySelector(`meta[property=csp-nonce]`), a2 = i3?.nonce || i3?.getAttribute(`nonce`);
    r2 = o2(t2.map((t3) => {
      if (t3 = Qg(t3, n2), t3 in $g) return;
      $g[t3] = true;
      let r3 = t3.endsWith(`.css`), i4 = r3 ? `[rel="stylesheet"]` : ``;
      if (n2) for (let n3 = e5.length - 1; n3 >= 0; n3--) {
        let i5 = e5[n3];
        if (i5.href === t3 && (!r3 || i5.rel === `stylesheet`)) return;
      }
      else if (document.querySelector(`link[href="${t3}"]${i4}`)) return;
      let o3 = document.createElement(`link`);
      if (o3.rel = r3 ? `stylesheet` : Zg, r3 || (o3.as = `script`), o3.crossOrigin = ``, o3.href = t3, a2 && o3.setAttribute(`nonce`, a2), document.head.appendChild(o3), r3) return new Promise((e6, n3) => {
        o3.addEventListener(`load`, e6), o3.addEventListener(`error`, () => n3(Error(`Unable to preload CSS for ${t3}`)));
      });
    }));
  }
  function i2(e5) {
    let t3 = new Event(`vite:preloadError`, { cancelable: true });
    if (t3.payload = e5, window.dispatchEvent(t3), !t3.defaultPrevented) throw e5;
  }
  return r2.then((t3) => {
    for (let e5 of t3 || []) e5.status === `rejected` && i2(e5.reason);
    return e4().catch(i2);
  });
};
function t_(e4) {
  let t2 = e4 | 0;
  return t2 = Math.imul(t2 ^ t2 >>> 16, 2146121005), t2 = Math.imul(t2 ^ t2 >>> 15, 2221713035), (t2 ^ t2 >>> 16) >>> 0;
}
function n_(e4) {
  return t_(e4) / 4294967296;
}
function r_(e4, t2, n2) {
  return n_(t_(Math.imul(e4 | 0, 73856093) ^ Math.imul(t2 | 0, 19349663) ^ Math.imul(n2 | 0, 83492791)));
}
function i_(e4) {
  let t2 = (e4 | 0) + 2654435769;
  return () => {
    t2 = t2 + 1831565813 | 0;
    let e5 = t2;
    return e5 = Math.imul(e5 ^ e5 >>> 15, e5 | 1), e5 ^= e5 + Math.imul(e5 ^ e5 >>> 7, e5 | 61), ((e5 ^ e5 >>> 14) >>> 0) / 4294967296;
  };
}
function a_(e4, t2, n2, r2 = 0) {
  let i2 = Math.floor(e4), a2 = Math.floor(t2), o2 = Math.floor(n2), s2 = e4 - i2, c2 = t2 - a2, l2 = n2 - o2, u2 = s2 * s2 * (3 - 2 * s2), d2 = c2 * c2 * (3 - 2 * c2), f2 = l2 * l2 * (3 - 2 * l2), p2 = r2 * 1013, m2 = (e5, t3, n3) => r_(e5 + p2, t3 - p2, n3 + p2 * 7), h2 = R(m2(i2, a2, o2), m2(i2 + 1, a2, o2), u2), g2 = R(m2(i2, a2 + 1, o2), m2(i2 + 1, a2 + 1, o2), u2), _2 = R(m2(i2, a2, o2 + 1), m2(i2 + 1, a2, o2 + 1), u2), v2 = R(m2(i2, a2 + 1, o2 + 1), m2(i2 + 1, a2 + 1, o2 + 1), u2);
  return R(R(h2, g2, d2), R(_2, v2, d2), f2) * 2 - 1;
}
function o_(e4, t2, n2, r2 = 3, i2 = 0) {
  let a2 = 0.5, o2 = 1, s2 = 0, c2 = 0;
  for (let l2 = 0; l2 < r2; l2 += 1) s2 += a2 * a_(e4 * o2, t2 * o2, n2 * o2, i2 + l2 * 17), c2 += a2, a2 *= 0.5, o2 *= 2.03;
  return s2 / c2;
}
function L(e4, t2, n2, r2) {
  let i2 = t2.length;
  if (e4 <= t2[0]) return n2[0];
  if (e4 >= t2[i2 - 1]) return n2[i2 - 1];
  let a2 = 0;
  for (; a2 < i2 - 2 && e4 > t2[a2 + 1]; ) a2 += 1;
  let o2 = t2[a2], s2 = t2[a2 + 1], c2 = (e4 - o2) / Math.max(1e-6, s2 - o2), l2 = r2 && r2[a2] ? r2[a2](c2) : d_(c2);
  return n2[a2] + (n2[a2 + 1] - n2[a2]) * l2;
}
function s_(e4) {
  return e4 - Math.floor(e4);
}
var c_, l_, R, u_, z, d_, f_, p_, m_, h_, g_, __ = t((() => {
  c_ = Math.PI * 2, Math.PI / 180, l_ = (e4, t2, n2) => e4 < t2 ? t2 : e4 > n2 ? n2 : e4, R = (e4, t2, n2) => e4 + (t2 - e4) * n2, u_ = (e4) => e4 < 0 ? 0 : e4 > 1 ? 1 : e4, z = (e4, t2, n2) => {
    let r2 = u_((n2 - e4) / (t2 - e4));
    return r2 * r2 * (3 - 2 * r2);
  }, d_ = (e4) => {
    let t2 = u_(e4);
    return t2 * t2 * (3 - 2 * t2);
  }, f_ = (e4) => 1 - (1 - u_(e4)) ** 3, p_ = (e4) => u_(e4) * u_(e4), m_ = (e4) => 0.5 - 0.5 * Math.cos(Math.PI * u_(e4)), h_ = (e4, t2 = 1.6) => {
    let n2 = u_(e4) - 1;
    return n2 * n2 * ((t2 + 1) * n2 + t2) + 1;
  }, g_ = (e4, t2, n2) => {
    if (n2 <= e4 || n2 >= t2) return 0;
    let r2 = (n2 - e4) / (t2 - e4);
    return Math.sin(r2 * Math.PI);
  };
}));
function v_(e4, t2, n2, r2) {
  let i2 = Math.floor(e4), a2 = Math.floor(t2), o2 = e4 - i2, s2 = t2 - a2, c2 = o2 * o2 * (3 - 2 * o2), l2 = s2 * s2 * (3 - 2 * s2), u2 = (e5) => (e5 % n2 + n2) % n2, d2 = (e5, t3) => r_(u2(e5), u2(t3), r2), f2 = d2(i2, a2), p2 = d2(i2 + 1, a2), m2 = d2(i2, a2 + 1), h2 = d2(i2 + 1, a2 + 1);
  return f2 + (p2 - f2) * c2 + (m2 + (h2 - m2) * c2 - (f2 + (p2 - f2) * c2)) * l2;
}
function y_(e4, t2, n2, r2, i2) {
  let a2 = 0, o2 = 0.5, s2 = 0, c2 = n2;
  for (let n3 = 0; n3 < r2; n3 += 1) a2 += v_(e4 / x_ * c2, t2 / x_ * c2, c2, i2 + n3 * 31) * o2, s2 += o2, o2 *= 0.5, c2 *= 2;
  return a2 / s2;
}
function b_() {
  if (S_) return S_;
  let e4 = new Uint8Array(x_ * x_ * 4), t2 = new Float32Array(x_ * x_), n2 = new Float32Array(x_ * x_), r2 = new Float32Array(x_ * x_), i2 = new Float32Array(x_ * x_);
  for (let e5 = 0; e5 < x_; e5 += 1) for (let n3 = 0; n3 < x_; n3 += 1) {
    let r3 = y_(n3, e5, 24, 3, 11), i3 = v_(n3 / x_ * 64, e5 / x_ * 64, 64, 5);
    t2[e5 * x_ + n3] = r3 * 0.75 + i3 * 0.25;
  }
  for (let e5 = 0; e5 < x_; e5 += 1) for (let t3 = 0; t3 < x_; t3 += 1) {
    let r3 = t3 / x_ * 48, i3 = e5 / x_ * 48, a3 = Math.floor(r3), o3 = Math.floor(i3), s3 = (a3 + o3) % 2 == 0, c3 = r3 - a3 - 0.5, l2 = i3 - o3 - 0.5, u2 = Math.cos(c3 * Math.PI) * (0.75 + 0.25 * Math.cos(l2 * Math.PI * 2)), d2 = Math.cos(l2 * Math.PI) * (0.75 + 0.25 * Math.cos(c3 * Math.PI * 2)), f2 = s3 ? Math.max(u2, d2 * 0.6) : Math.max(d2, u2 * 0.6), p2 = v_(t3 / x_ * 12, e5 / x_ * 96, 12, 21) * 0.25;
    n2[e5 * x_ + t3] = Math.min(1, Math.max(0, f2 * 0.85 + p2));
  }
  let a2 = i_(77);
  for (let e5 = 0; e5 < x_ * x_; e5 += 1) r2[e5] = 0;
  for (let e5 = 0; e5 < 140; e5 += 1) {
    let e6 = a2() * x_, t3 = a2() * x_, n3 = (a2() < 0.6 ? 0.35 : a2() * Math.PI) + (a2() - 0.5) * 0.4, i3 = 10 + a2() * 70, o3 = 0.3 + a2() * 0.7, s3 = Math.cos(n3), c3 = Math.sin(n3);
    for (let n4 = 0; n4 < i3; n4 += 0.5) {
      let a3 = e6 + s3 * n4, l2 = t3 + c3 * n4, u2 = Math.sin(n4 / i3 * Math.PI), d2 = (Math.floor(a3) % x_ + x_) % x_, f2 = (Math.floor(l2) % x_ + x_) % x_ * x_ + d2;
      r2[f2] = Math.max(r2[f2], o3 * u2);
    }
  }
  for (let e5 = 0; e5 < x_; e5 += 1) for (let t3 = 0; t3 < x_; t3 += 1) i2[e5 * x_ + t3] = y_(t3, e5, 3, 4, 41);
  let o2 = 1, s2 = 0;
  for (let e5 = 0; e5 < x_ * x_; e5 += 1) o2 = Math.min(o2, i2[e5]), s2 = Math.max(s2, i2[e5]);
  for (let a3 = 0; a3 < x_ * x_; a3 += 1) e4[a3 * 4] = Math.round(Math.min(1, Math.max(0, t2[a3])) * 255), e4[a3 * 4 + 1] = Math.round(n2[a3] * 255), e4[a3 * 4 + 2] = Math.round(Math.min(1, r2[a3]) * 255), e4[a3 * 4 + 3] = Math.round((i2[a3] - o2) / Math.max(1e-6, s2 - o2) * 255);
  let c2 = new Na(e4, x_, x_, Vt, Et);
  return c2.wrapS = _t, c2.wrapT = _t, c2.magFilter = Ct, c2.minFilter = Tt, c2.generateMipmaps = true, c2.colorSpace = ``, c2.anisotropy = 4, c2.needsUpdate = true, S_ = c2, c2;
}
var x_, S_, C_ = t((() => {
  Ed(), __(), x_ = 256, S_ = null;
}));
function w_() {
  return { uTint: { value: new P(1, 1, 1) }, uTintAmt: { value: 0 }, uFlashColor: { value: new P(1, 1, 1) }, uFlash: { value: 0 }, uRimColor: { value: new P(1, 0.8, 0.3) }, uRimAmt: { value: 0 }, uStatus: { value: new yr(0, 0, 0, 0) }, uStatus2: { value: new M() }, uDissolve: { value: 0 }, uDissolveEdge: { value: new P(`#ff8a3a`) }, uFade: { value: 1 }, uArmorCol: { value: new yr(0, 0, 0, 0) }, uArmorMat: { value: new yr(0.7, 0, 0, 0) }, uGloveCol: { value: new yr(0, 0, 0, 0) }, uGloveMat: { value: new yr(0.7, 0, 0, 0) }, uBootCol: { value: new yr(0, 0, 0, 0) }, uBootMat: { value: new yr(0.7, 0, 0, 0) }, uHairHide: { value: 0 }, uArmorTier: { value: 0 }, uEmitScale: { value: 1 } };
}
function T_(e4) {
  e4.vertexShader = k_ + e4.vertexShader.replace(`#include <begin_vertex>`, `#include <begin_vertex>
${A_}`);
}
function E_(e4) {
  O_.uDetailTex.value || (O_.uDetailTex.value = b_());
  let t2 = new Yo({ vertexColors: true, roughness: 1, metalness: 0, envMapIntensity: 1 });
  t2.name = `unh-model`, t2.onBeforeCompile = (t3) => {
    Object.assign(t3.uniforms, e4, O_), T_(t3);
    let n3 = t3.fragmentShader;
    n3 = n3.replace(`#include <common>`, `#include <common>
${M_}`), n3 = n3.replace(`#include <color_fragment>`, `#include <color_fragment>
${N_}`), n3 = n3.replace(`#include <roughnessmap_fragment>`, `float roughnessFactor = sRough;`), n3 = n3.replace(`#include <metalnessmap_fragment>`, `float metalnessFactor = sMetal;`), n3 = n3.replace(`#include <normal_fragment_maps>`, `#include <normal_fragment_maps>
if (bumpH != 0.0) normal = unhBump(-vViewPosition, normal, bumpH);`), n3 = n3.replace(`#include <emissivemap_fragment>`, `#include <emissivemap_fragment>
${P_}`), n3 = n3.replace(`#include <lights_fragment_maps>`, `#include <lights_fragment_maps>
${F_}`), n3 = n3.replace(`vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;`, `vec3 unhDS = reflectedLight.directSpecular;
      float unhM = max(max(unhDS.r, unhDS.g), unhDS.b);
      if (unhM > 0.6) { float e = unhM - 0.6; unhDS *= (0.6 + e / (1.0 + e / max(0.01, uSpecCap - 0.6))) / unhM; }
      vec3 totalSpecular = unhDS + reflectedLight.indirectSpecular;`), n3 = n3.replace(`#include <aomap_fragment>`, `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= aoV;
reflectedLight.indirectSpecular *= mix(1.0, aoV, 0.85);`), t3.fragmentShader = n3;
  };
  let n2 = I_.coverage;
  return n2 && (t2.alphaToCoverage = true, t2.defines = { UNH_A2C: `` }), t2.customProgramCacheKey = () => n2 ? `unh-model-v3-a2c` : `unh-model-v3`, t2;
}
function D_(e4) {
  let t2 = new Zo({ depthPacking: Bn });
  return t2.onBeforeCompile = (t3) => {
    Object.assign(t3.uniforms, { uHairHide: e4.uHairHide, uArmorTier: e4.uArmorTier, uFade: e4.uFade, uDissolve: e4.uDissolve }), T_(t3), t3.fragmentShader = `varying vec3 vPbr;
varying vec4 vMat;
varying vec3 vRestPos;
varying vec3 vRestNrm;
uniform float uFade;
uniform float uDissolve;
${j_}
` + t3.fragmentShader.replace(`void main() {`, `void main() {
  if (vMat.x < -0.5) discard;
  if (uFade < 0.999) { if (uFade <= unhBayer(gl_FragCoord.xy)) discard; }
  if (uDissolve > 0.001) { float dn = unhNoise(vRestPos * 7.0) * 0.65 + unhNoise(vRestPos * 23.0) * 0.35; if (dn < uDissolve) discard; }`);
  }, t2.customProgramCacheKey = () => `unh-depth-v3`, t2;
}
var O_, k_, A_, j_, M_, N_, P_, F_, I_, L_ = t((() => {
  Ed(), C_(), O_ = { uDetailTex: { value: null }, uTime: { value: 0 }, uFill: { value: 0.085 }, uFakeEnv: { value: 0.45 }, uSpecCap: { value: 1.3 }, uEmissive: { value: 1 }, uDetailScale: { value: 4 } }, k_ = `
attribute vec3 aPbr;
attribute vec4 aMat;
varying vec3 vPbr;
varying vec4 vMat;
varying vec3 vRestPos;
varying vec3 vRestNrm;
uniform float uHairHide;
uniform float uArmorTier;
`, A_ = `
vPbr = aPbr;
vMat = aMat;
vRestPos = position;
vRestNrm = normal;
{
  float zz = aMat.x;
  float hid = 0.0;
  if (zz > 3.5 && zz < 4.5) hid = step(0.75, uHairHide);
  else if (zz > 4.5 && zz < 5.5) hid = 1.0 - step(1.5, uArmorTier);
  else if (zz > 5.5 && zz < 6.5) hid = 1.0 - step(2.5, uArmorTier);
  else if (zz > 6.5 && zz < 7.5) hid = 1.0 - step(3.5, uArmorTier);
  else if (zz > 7.5 && zz < 8.5) hid = step(0.25, uHairHide);
  if (hid > 0.5) { transformed = vec3(0.0); vMat.x = -1.0; }
}
`, j_ = `
float unhHash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float unhNoise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = unhHash(i);
  float b = unhHash(i + vec3(1.0, 0.0, 0.0));
  float c = unhHash(i + vec3(0.0, 1.0, 0.0));
  float d = unhHash(i + vec3(1.0, 1.0, 0.0));
  float e = unhHash(i + vec3(0.0, 0.0, 1.0));
  float g = unhHash(i + vec3(1.0, 0.0, 1.0));
  float h = unhHash(i + vec3(0.0, 1.0, 1.0));
  float k = unhHash(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}
float unhBayer(vec2 fc) {
  vec2 p = mod(floor(fc), 4.0);
  float i = p.x + p.y * 4.0;
  float m = 0.0;
  if (i < 0.5) m = 0.0; else if (i < 1.5) m = 8.0; else if (i < 2.5) m = 2.0; else if (i < 3.5) m = 10.0;
  else if (i < 4.5) m = 12.0; else if (i < 5.5) m = 4.0; else if (i < 6.5) m = 14.0; else if (i < 7.5) m = 6.0;
  else if (i < 8.5) m = 3.0; else if (i < 9.5) m = 11.0; else if (i < 10.5) m = 1.0; else if (i < 11.5) m = 9.0;
  else if (i < 12.5) m = 15.0; else if (i < 13.5) m = 7.0; else if (i < 14.5) m = 13.0; else m = 5.0;
  return (m + 0.5) / 16.0;
}
`, M_ = `
varying vec3 vPbr;
varying vec4 vMat;
varying vec3 vRestPos;
varying vec3 vRestNrm;
uniform sampler2D uDetailTex;
uniform float uTime;
uniform vec3 uTint;
uniform float uTintAmt;
uniform vec3 uFlashColor;
uniform float uFlash;
uniform vec3 uRimColor;
uniform float uRimAmt;
uniform vec4 uStatus;
uniform vec2 uStatus2;
uniform float uDissolve;
uniform vec3 uDissolveEdge;
uniform float uFade;
uniform vec4 uArmorCol;
uniform vec4 uArmorMat;
uniform vec4 uGloveCol;
uniform vec4 uGloveMat;
uniform vec4 uBootCol;
uniform vec4 uBootMat;
uniform float uFill;
uniform float uFakeEnv;
uniform float uSpecCap;
uniform float uEmissive;
uniform float uEmitScale;
uniform float uDetailScale;
${j_}
vec3 unhBump(vec3 surfPos, vec3 surfNorm, float h) {
  vec3 sx = dFdx(surfPos);
  vec3 sy = dFdy(surfPos);
  vec3 r1 = cross(sy, surfNorm);
  vec3 r2 = cross(surfNorm, sx);
  float det = dot(sx, r1);
  vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * surfNorm - grad);
}
float unhChainPlane(vec2 q) {
  vec2 g = vec2(q.x + 0.5 * mod(floor(q.y), 2.0), q.y);
  vec2 f = fract(g) - 0.5;
  float d = length(f * vec2(1.0, 1.4));
  return smoothstep(0.16, 0.02, abs(d - 0.32));
}
float unhQuilt(vec2 q) {
  float a = abs(fract(q.x + q.y) - 0.5);
  float b = abs(fract(q.x - q.y) - 0.5);
  return smoothstep(0.0, 0.08, min(a, b));
}
`, N_ = `
if (vMat.x < -0.5) discard;
#ifdef UNH_A2C
if (uFade < 0.999) { if (uFade < 0.02) discard; diffuseColor.a = uFade; }
#else
if (uFade < 0.999) { if (uFade <= unhBayer(gl_FragCoord.xy)) discard; }
#endif
float dissN = 1.0;
if (uDissolve > 0.001) {
  dissN = unhNoise(vRestPos * 7.0) * 0.65 + unhNoise(vRestPos * 23.0) * 0.35;
  if (dissN < uDissolve) discard;
}
vec3 albedo = diffuseColor.rgb;
vec3 baseAlbedo = albedo;
float sRough = vPbr.x;
float sMetal = vPbr.y;
float sEmit = vPbr.z;
float zone = vMat.x;
float dtype = floor(vMat.y + 0.5);
float aoV = vMat.z;
float wear = vMat.w;

vec3 bw = abs(normalize(vRestNrm));
bw = bw * bw * bw * bw;
bw /= max(1e-4, bw.x + bw.y + bw.z);
vec3 tp = vRestPos * uDetailScale;
vec4 dtl = texture2D(uDetailTex, tp.yz) * bw.x + texture2D(uDetailTex, tp.zx) * bw.y + texture2D(uDetailTex, tp.xy) * bw.z;
vec4 dtl2 = texture2D(uDetailTex, tp.yz * 0.31 + 0.37) * bw.x + texture2D(uDetailTex, tp.zx * 0.31 + 0.37) * bw.y + texture2D(uDetailTex, tp.xy * 0.31 + 0.37) * bw.z;
float texelPx = length(fwidth(tp)) * 256.0;
float lodF = 1.0 - smoothstep(1.5, 6.0, texelPx);
float bumpH = 0.0;
float grime = smoothstep(0.42, 0.9, dtl2.a) * wear;

if (dtype < 0.5) {
  // skin
  albedo *= 0.93 + 0.14 * dtl.r;
  albedo *= 1.0 - grime * 0.25;
  sRough = clamp(sRough + (dtl.r - 0.5) * 0.15, 0.25, 1.0);
  bumpH = dtl.r * 0.0006;
} else if (dtype < 1.5) {
  // cloth
  albedo *= mix(1.0, 0.78 + 0.42 * dtl.g, lodF * 0.8 + 0.2);
  albedo *= 1.0 - grime * 0.4;
  albedo *= 0.92 + 0.16 * dtl2.r;
  sRough = clamp(sRough + 0.1 * (1.0 - dtl.g) + grime * 0.1, 0.45, 1.0);
  bumpH = dtl.g * 0.0011;
} else if (dtype < 2.5) {
  // leather
  albedo *= 0.82 + 0.3 * dtl.r;
  albedo *= 1.0 - grime * 0.35;
  albedo *= 0.9 + 0.2 * dtl2.b;
  sRough = clamp(sRough + (dtl.r - 0.5) * 0.28 + grime * 0.15, 0.3, 1.0);
  bumpH = dtl.r * 0.0010;
} else if (dtype < 3.5) {
  // metal
  float scr = dtl.b;
  albedo *= 0.88 + 0.22 * scr;
  sRough = clamp(sRough - scr * 0.12 + (dtl.r - 0.5) * 0.08, 0.08, 1.0);
  vec3 rust = vec3(0.16, 0.06, 0.025);
  albedo = mix(albedo, rust * (0.6 + 0.8 * dtl.r), grime * 0.85);
  sMetal = mix(sMetal, 0.15, grime * 0.9);
  sRough = mix(sRough, 0.85, grime);
  bumpH = (dtl.r * 0.2 + scr * 0.8) * 0.0005 + grime * dtl.r * 0.0012;
} else if (dtype < 4.5) {
  // bone
  albedo *= 0.84 + 0.28 * dtl.r;
  albedo = mix(albedo, albedo * vec3(0.55, 0.42, 0.28), grime * 0.75);
  sRough = clamp(sRough + (dtl.r - 0.5) * 0.2, 0.3, 1.0);
  bumpH = dtl.r * 0.0012 + dtl.b * 0.0004;
} else if (dtype < 5.5) {
  // hair: strand clumps radiating with the surface azimuth + fine streaks
  vec3 hn = normalize(vRestNrm);
  float az = atan(hn.x, hn.z);
  float el = hn.y;
  float warp = unhNoise(vRestPos * 30.0) * 2.2;
  float clump = sin(az * 46.0 + warp + el * 3.0) * 0.5 + 0.5;
  float fine = sin(az * 170.0 + warp * 2.0) * 0.5 + 0.5;
  float hk = mix(0.5, clump * 0.75 + fine * 0.25, lodF * 0.9 + 0.1);
  albedo *= 0.62 + 0.62 * hk;
  albedo *= 0.9 + 0.2 * dtl.r;
  sRough = clamp(sRough + (0.5 - hk) * 0.22, 0.25, 1.0);
  bumpH = hk * 0.0014;
} else if (dtype < 6.5) {
  // fur
  albedo *= 0.62 + 0.62 * dtl.r;
  albedo *= 0.9 + 0.2 * dtl2.a;
  sRough = 0.95;
  bumpH = dtl.r * 0.003;
} else if (dtype < 7.5) {
  // stone / clay
  albedo *= 0.72 + 0.45 * dtl.r;
  albedo *= 0.85 + 0.3 * dtl2.a;
  albedo = mix(albedo, albedo * 0.45, smoothstep(0.55, 0.9, dtl.b) * 0.6);
  sRough = clamp(sRough + (dtl.r - 0.5) * 0.2, 0.5, 1.0);
  bumpH = dtl.r * 0.004 - dtl.b * 0.0015;
} else if (dtype < 8.5) {
  // wood: streak grain along the longest axis approx (use stretched sampling)
  float grain = texture2D(uDetailTex, vec2(vRestPos.x * 1.5 + vRestPos.z * 1.5, vRestPos.y * 0.25) * 4.0).r;
  float rings = texture2D(uDetailTex, vec2((vRestPos.x - vRestPos.z) * 6.0, vRestPos.y * 0.6)).b;
  albedo *= 0.72 + 0.5 * grain + rings * 0.12;
  albedo *= 1.0 - grime * 0.4;
  sRough = clamp(sRough + (grain - 0.5) * 0.2, 0.35, 1.0);
  bumpH = grain * 0.0008;
} else if (dtype < 9.5) {
  // gem / glass: clean
  sRough = clamp(sRough, 0.02, 1.0);
} else if (dtype > 11.5) {
  // chainmail
  float ch = unhChainPlane(tp.yz * 18.0) * bw.x + unhChainPlane(tp.zx * 18.0) * bw.y + unhChainPlane(tp.xy * 18.0) * bw.z;
  ch = mix(0.55, ch, lodF);
  albedo *= 0.3 + 0.95 * ch;
  sRough = mix(0.85, sRough, ch);
  vec3 rustC = vec3(0.16, 0.06, 0.025);
  albedo = mix(albedo, rustC * (0.6 + 0.8 * dtl.r), grime * 0.8);
  sMetal = mix(sMetal, 0.2, grime * 0.9);
  bumpH = ch * 0.0012;
} else if (dtype < 10.5) {
  // rotting flesh: mottled patches, wet sheen
  float rotP = smoothstep(0.35, 0.8, dtl2.a);
  albedo = mix(albedo, albedo * vec3(0.55, 0.45, 0.6), rotP * 0.7);
  albedo *= 0.8 + 0.35 * dtl.r;
  sRough = clamp(sRough - rotP * 0.25 + (dtl.r - 0.5) * 0.2, 0.25, 1.0);
  bumpH = dtl.r * 0.0016;
}

// equipment tiers on armor / glove / boot zones
{
  vec4 tc = vec4(0.0);
  vec4 tm = vec4(0.0);
  if ((zone > 0.5 && zone < 1.5) || (zone > 4.5 && zone < 7.5)) { tc = uArmorCol; tm = uArmorMat; }
  else if (zone > 1.5 && zone < 2.5) { tc = uGloveCol; tm = uGloveMat; }
  else if (zone > 2.5 && zone < 3.5) { tc = uBootCol; tm = uBootMat; }
  if (tc.a > 0.0) {
    float lumO = dot(baseAlbedo, vec3(0.2126, 0.7152, 0.0722));
    vec3 tAlb = tc.rgb * clamp(0.55 + lumO * 3.2, 0.6, 1.5);
    float tR = tm.x;
    float tM = tm.y;
    float pat = tm.z;
    float tB = 0.0;
    if (pat > 0.5 && pat < 1.5) {
      float ch = unhChainPlane(tp.yz * 18.0) * bw.x + unhChainPlane(tp.zx * 18.0) * bw.y + unhChainPlane(tp.xy * 18.0) * bw.z;
      ch = mix(0.55, ch, lodF);
      tAlb *= 0.35 + 0.95 * ch;
      tR = mix(0.85, tR, ch);
      tB = ch * 0.0012;
    } else if (pat > 1.5 && pat < 2.5) {
      tAlb *= 0.9 + 0.2 * dtl.b;
      tR = clamp(tR + (dtl.b - 0.5) * 0.18 + grime * 0.2, 0.12, 0.8);
      tB = dtl.b * 0.0004;
    } else if (pat > 2.5 && pat < 3.5) {
      tAlb *= 0.78 + 0.4 * dtl.r;
      tR = clamp(tR + (dtl.r - 0.5) * 0.25, 0.3, 1.0);
      tB = dtl.r * 0.001;
    } else if (pat > 3.5 && pat < 4.5) {
      float q = unhQuilt(tp.xy * 2.2) * bw.z + unhQuilt(tp.zx * 2.2) * bw.y + unhQuilt(tp.yz * 2.2) * bw.x;
      tAlb *= 0.7 + 0.35 * q;
      tAlb *= 0.85 + 0.3 * dtl.g;
      tB = q * 0.002;
    } else if (pat > 4.5) {
      tAlb *= 0.7 + 0.45 * dtl.r;
      tAlb *= 0.85 + 0.25 * dtl2.a;
      tR = clamp(tR + (dtl.r - 0.5) * 0.3, 0.4, 1.0);
      tB = dtl.r * 0.0016;
    }
    albedo = mix(albedo, tAlb, tc.a);
    sRough = mix(sRough, tR, tc.a);
    sMetal = mix(sMetal, tM, tc.a);
    bumpH = mix(bumpH, tB, tc.a);
  }
}

// status looks
albedo = mix(albedo, albedo * vec3(0.55, 0.8, 1.3) + vec3(0.01, 0.03, 0.07), uStatus.x * 0.8);
albedo = mix(albedo, vec3(0.5, 0.72, 0.95) * (0.65 + 0.45 * dtl.r), uStatus.y * 0.85);
sRough = mix(sRough, 0.15, uStatus.y);
sMetal = mix(sMetal, 0.0, uStatus.y);
albedo = mix(albedo, albedo * vec3(0.55, 1.15, 0.4), uStatus.z * 0.55);
albedo = mix(albedo, albedo * vec3(0.4, 0.32, 0.28), uStatus.w * 0.6);
float lumA = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
albedo = mix(albedo, vec3(lumA), uStatus2.y * 0.6);
albedo = mix(albedo, uTint * (0.25 + lumA * 2.6), uTintAmt);

diffuseColor.rgb = albedo * mix(1.0, aoV, 0.72);
bumpH *= lodF;
`, P_ = `
{
  vec3 vdirE = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
  float ndv = saturate(dot(normal, vdirE));
  float fres = 1.0 - ndv;
  totalEmissiveRadiance += baseAlbedo * sEmit * uEmissive * uEmitScale * (1.0 - uStatus.y * 0.7);
  totalEmissiveRadiance += diffuseColor.rgb * uFill * (0.3 + 0.7 * ndv);
  if (dtype < 0.5) totalEmissiveRadiance += albedo * vec3(0.5, 0.16, 0.09) * 0.06 * (0.35 + fres);
  totalEmissiveRadiance += uRimColor * pow(fres, 2.2) * uRimAmt;
  totalEmissiveRadiance += uFlashColor * uFlash * (0.45 + 0.55 * fres);
  totalEmissiveRadiance += uTint * uTintAmt * 0.12 * (0.3 + pow(fres, 2.0));
  if (uStatus.w > 0.001) {
    // licking flames: rising, high-contrast noise tongues over charred albedo
    float fl = unhNoise(vRestPos * vec3(6.0, 3.5, 6.0) + vec3(0.0, -uTime * 3.4, uTime * 0.7));
    float fl2 = unhNoise(vRestPos * 14.0 + vec3(uTime * 1.3, -uTime * 6.0, 0.0));
    float fk = smoothstep(0.42, 0.95, fl * 0.7 + fl2 * 0.5);
    totalEmissiveRadiance += vec3(1.0, 0.38, 0.06) * uStatus.w * (0.05 + 1.7 * fk * fk) * (0.55 + fres);
  }
  totalEmissiveRadiance += vec3(0.22, 0.8, 0.08) * uStatus.z * (0.55 + 0.45 * sin(uTime * 5.0)) * pow(fres, 1.5) * 0.9;
  totalEmissiveRadiance += vec3(0.95, 0.06, 0.04) * uStatus2.x * pow(fres, 2.0) * (0.65 + 0.35 * sin(uTime * 3.1)) * 1.4;
  totalEmissiveRadiance += vec3(0.35, 0.62, 1.0) * (uStatus.x * 0.35 + uStatus.y * 0.8) * pow(fres, 2.0);
  if (uDissolve > 0.001) {
    float edge = 1.0 - smoothstep(uDissolve, uDissolve + 0.07, dissN);
    totalEmissiveRadiance += uDissolveEdge * edge * 5.0;
  }
}
`, F_ = `
#if defined( RE_IndirectSpecular )
{
  vec3 vdirF = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
  vec3 rv = reflect(-vdirF, normal);
  vec3 rw = inverseTransformDirection(rv, viewMatrix);
  float up = rw.y;
  vec3 sky = vec3(0.26, 0.32, 0.46);
  vec3 hor = vec3(0.42, 0.36, 0.30);
  vec3 gnd = vec3(0.045, 0.04, 0.035);
  vec3 env = up > 0.0 ? mix(hor, sky, smoothstep(0.0, 0.55, up)) : mix(hor, gnd, smoothstep(0.0, 0.25, -up));
  float lobe = pow(saturate(dot(rw, normalize(vec3(0.35, 0.85, 0.4)))), 20.0);
  env += vec3(1.0, 0.86, 0.68) * lobe * 1.1 * (1.0 - material.roughness);
  env = mix(env, vec3(0.16, 0.16, 0.17), material.roughness * 0.75);
  radiance += env * uFakeEnv;
}
#endif
`, I_ = { coverage: true };
}));
function R_(e4, t2, n2, r2, i2) {
  let a2 = e4.length / 3, o2 = new Float32Array(a2).fill(1);
  if (a2 === 0) return o2;
  let s2 = 1 / 0, c2 = 1 / 0, l2 = 1 / 0, u2 = -1 / 0, d2 = -1 / 0, f2 = -1 / 0;
  for (let t3 = 0; t3 < a2; t3 += 1) {
    let n3 = e4[t3 * 3], r3 = e4[t3 * 3 + 1], i3 = e4[t3 * 3 + 2];
    n3 < s2 && (s2 = n3), r3 < c2 && (c2 = r3), i3 < l2 && (l2 = i3), n3 > u2 && (u2 = n3), r3 > d2 && (d2 = r3), i3 > f2 && (f2 = i3);
  }
  let p2 = Math.max(u2 - s2, d2 - c2, f2 - l2) / i2.res, m2 = i2.dist + p2 * 2;
  s2 -= m2, c2 -= m2, l2 -= m2;
  let h2 = Math.ceil((u2 - s2 + m2) / p2) + 1, g2 = Math.ceil((d2 - c2 + m2) / p2) + 1, _2 = Math.ceil((f2 - l2 + m2) / p2) + 1, v2 = new Uint8Array(h2 * g2 * _2), y2 = (e5, t3, n3) => {
    let r3 = Math.floor((e5 - s2) / p2), i3 = Math.floor((t3 - c2) / p2), a3 = Math.floor((n3 - l2) / p2);
    r3 < 0 || i3 < 0 || a3 < 0 || r3 >= h2 || i3 >= g2 || a3 >= _2 || (v2[(a3 * g2 + i3) * h2 + r3] = 1);
  }, b2 = n2.length / 3;
  for (let t3 = 0; t3 < b2; t3 += 1) {
    if (!r2[t3]) continue;
    let i3 = n2[t3 * 3] * 3, a3 = n2[t3 * 3 + 1] * 3, o3 = n2[t3 * 3 + 2] * 3, s3 = e4[i3], c3 = e4[i3 + 1], l3 = e4[i3 + 2], u3 = e4[a3] - s3, d3 = e4[a3 + 1] - c3, f3 = e4[a3 + 2] - l3, m3 = e4[o3] - s3, h3 = e4[o3 + 1] - c3, g3 = e4[o3 + 2] - l3, _3 = Math.max(Math.hypot(u3, d3, f3), Math.hypot(m3, h3, g3), Math.hypot(m3 - u3, h3 - d3, g3 - f3)), v3 = Math.max(1, Math.ceil(_3 / (p2 * 0.5)));
    for (let e5 = 0; e5 <= v3; e5 += 1) for (let t4 = 0; t4 <= v3 - e5; t4 += 1) {
      let n3 = e5 / v3, r3 = t4 / v3;
      y2(s3 + u3 * n3 + m3 * r3, c3 + d3 * n3 + h3 * r3, l3 + f3 * n3 + g3 * r3);
    }
  }
  let x2 = i2.rays, S2 = [];
  for (let e5 = 0; e5 < x2; e5 += 1) {
    let t3 = (e5 + 0.5) / x2, n3 = Math.sqrt(t3), r3 = e5 * 2.399963229728653;
    S2.push(Math.cos(r3) * n3, Math.sin(r3) * n3, Math.sqrt(1 - t3));
  }
  let C2 = Math.ceil(i2.dist / (p2 * 0.85)), w2 = new N(), T2 = new N(), E2 = new N();
  for (let n3 = 0; n3 < a2; n3 += 1) {
    E2.set(t2[n3 * 3], t2[n3 * 3 + 1], t2[n3 * 3 + 2]), Math.abs(E2.y) < 0.9 ? w2.set(0, 1, 0).cross(E2).normalize() : w2.set(1, 0, 0).cross(E2).normalize(), T2.crossVectors(E2, w2);
    let r3 = e4[n3 * 3] + E2.x * p2 * 1.3, a3 = e4[n3 * 3 + 1] + E2.y * p2 * 1.3, u3 = e4[n3 * 3 + 2] + E2.z * p2 * 1.3, d3 = 0;
    for (let e5 = 0; e5 < x2; e5 += 1) {
      let t3 = w2.x * S2[e5 * 3] + T2.x * S2[e5 * 3 + 1] + E2.x * S2[e5 * 3 + 2], n4 = w2.y * S2[e5 * 3] + T2.y * S2[e5 * 3 + 1] + E2.y * S2[e5 * 3 + 2], o3 = w2.z * S2[e5 * 3] + T2.z * S2[e5 * 3 + 1] + E2.z * S2[e5 * 3 + 2];
      for (let e6 = 1; e6 <= C2; e6 += 1) {
        let f3 = e6 * p2 * 0.85, m3 = r3 + t3 * f3, y3 = a3 + n4 * f3, b3 = u3 + o3 * f3;
        if (i2.ground && y3 < 0) {
          d3 += 1 - f3 / i2.dist * 0.5;
          break;
        }
        let x3 = Math.floor((m3 - s2) / p2), S3 = Math.floor((y3 - c2) / p2), C3 = Math.floor((b3 - l2) / p2);
        if (x3 < 0 || S3 < 0 || C3 < 0 || x3 >= h2 || S3 >= g2 || C3 >= _2) break;
        if (v2[(C3 * g2 + S3) * h2 + x3]) {
          d3 += 1 - f3 / i2.dist * 0.6;
          break;
        }
      }
    }
    o2[n3] = 1 - d3 / x2;
  }
  let D2 = new Float32Array(a2), O2 = new Float32Array(a2);
  for (let e5 = 0; e5 < b2; e5 += 1) {
    let t3 = n2[e5 * 3], r3 = n2[e5 * 3 + 1], i3 = n2[e5 * 3 + 2], a3 = (o2[t3] + o2[r3] + o2[i3]) / 3;
    D2[t3] += a3, D2[r3] += a3, D2[i3] += a3, O2[t3] += 1, O2[r3] += 1, O2[i3] += 1;
  }
  for (let e5 = 0; e5 < a2; e5 += 1) O2[e5] > 0 && (o2[e5] = o2[e5] * 0.5 + D2[e5] / O2[e5] * 0.5);
  return o2;
}
var B, z_, B_, V_, H_, U_ = t((() => {
  Ed(), __(), B = { SKIN: 0, CLOTH: 1, LEATHER: 2, METAL: 3, BONE: 4, HAIR: 5, FUR: 6, STONE: 7, WOOD: 8, GEM: 9, FLESH: 10, EMISSIVE: 11, CHAIN: 12 }, z_ = { BODY: 0, ARMOR: 1, GLOVE: 2, BOOT: 3, HAIR: 4, TIER_LEATHER: 5, TIER_CHAIN: 6, TIER_PLATE: 7, HEADWEAR: 8 }, B_ = new P(), V_ = new P(), H_ = class {
    parts = [];
    add(e4, t2) {
      return e4.vcount === 0 || this.parts.push({ geo: e4, spec: t2 }), this;
    }
    breakdown() {
      let e4 = /* @__PURE__ */ new Map();
      return this.parts.forEach((t2, n2) => {
        let r2 = t2.spec.name ?? `${t2.spec.bone ?? `skin`}#${n2}:${String(t2.spec.color)}`;
        e4.set(r2, (e4.get(r2) ?? 0) + t2.geo.tris);
      }), [...e4.entries()].map(([e5, t2]) => ({ name: e5, tris: t2 })).sort((e5, t2) => t2.tris - e5.tris);
    }
    get triangles() {
      let e4 = 0;
      for (let t2 of this.parts) e4 += t2.geo.tris;
      return e4;
    }
    build(e4) {
      let t2 = 0, n2 = 0;
      for (let e5 of this.parts) t2 += e5.geo.vcount, n2 += e5.geo.idx.length;
      let r2 = new Float32Array(t2 * 3), i2 = new Float32Array(t2 * 3), a2 = new Float32Array(t2 * 3), o2 = new Float32Array(t2 * 3), s2 = new Float32Array(t2 * 4), c2 = e4.skinned ? new Uint16Array(t2 * 4) : null, l2 = e4.skinned ? new Float32Array(t2 * 4) : null, u2 = new Uint32Array(n2), d2 = new Float32Array(t2), f2 = new Uint8Array(n2 / 3), p2 = { p: new N(), n: new N(), u: 0, v: 0, tag: 0 }, m2 = [0, 0, 0], h2 = V_.set(e4.grime?.color ?? `#2a2219`), g2 = 0, _2 = 0, v2 = (t3) => {
        let n3 = e4.boneIndex?.get(t3);
        if (n3 === void 0) throw Error(`MeshBuilder: unknown bone '${t3}'`);
        return n3;
      };
      for (let t3 of this.parts) {
        let { geo: n3, spec: y3 } = t3, b3 = new P(y3.color), x3 = /* @__PURE__ */ new Map();
        if (y3.colors) for (let e5 of Object.keys(y3.colors)) x3.set(Number(e5), new P(y3.colors[Number(e5)]));
        let S3 = e4.skinned && y3.bone ? v2(y3.bone) : 0;
        for (let t4 = 0; t4 < n3.vcount; t4 += 1) {
          let u3 = g2 + t4;
          if (p2.p.set(n3.pos[t4 * 3], n3.pos[t4 * 3 + 1], n3.pos[t4 * 3 + 2]), p2.n.set(n3.nrm[t4 * 3], n3.nrm[t4 * 3 + 1], n3.nrm[t4 * 3 + 2]), p2.u = n3.uv[t4 * 2], p2.v = n3.uv[t4 * 2 + 1], p2.tag = n3.tag[t4], r2[u3 * 3] = p2.p.x, r2[u3 * 3 + 1] = p2.p.y, r2[u3 * 3 + 2] = p2.p.z, i2[u3 * 3] = p2.n.x, i2[u3 * 3 + 1] = p2.n.y, i2[u3 * 3 + 2] = p2.n.z, B_.copy(x3.get(p2.tag) ?? b3), y3.paint && y3.paint(p2, B_), y3.mottle) {
            let t5 = y3.mottleScale ?? 9, n4 = o_(p2.p.x * t5, p2.p.y * t5, p2.p.z * t5, 2, e4.seed ?? 3) * y3.mottle;
            B_.multiplyScalar(1 + n4);
          }
          if (e4.grime && y3.detail !== B.EMISSIVE && !(y3.emit && y3.emit > 0.5)) {
            let t5 = l_(1 - p2.p.y / e4.grime.height, 0, 1), n4 = t5 * t5 * e4.grime.amount;
            B_.lerp(h2, n4 * 0.6).multiplyScalar(1 - n4 * 0.35);
          }
          if (a2[u3 * 3] = Math.max(0, B_.r), a2[u3 * 3 + 1] = Math.max(0, B_.g), a2[u3 * 3 + 2] = Math.max(0, B_.b), m2[0] = y3.rough ?? 0.7, m2[1] = y3.metal ?? 0, m2[2] = y3.emit ?? 0, y3.pbr && y3.pbr(p2, m2), o2[u3 * 3] = m2[0], o2[u3 * 3 + 1] = m2[1], o2[u3 * 3 + 2] = m2[2], s2[u3 * 4] = y3.zone ?? 0, s2[u3 * 4 + 1] = y3.detail ?? B.CLOTH, s2[u3 * 4 + 2] = 1, s2[u3 * 4 + 3] = y3.wear ?? 0.3, d2[u3] = y3.ao ?? (y3.emit && y3.emit > 0.5 ? 0 : 1), c2 && l2) if (y3.skin) {
            let [e5, t5, n4] = y3.skin(p2), r3 = l_(n4, 0, 1);
            c2[u3 * 4] = v2(e5), c2[u3 * 4 + 1] = v2(t5), l2[u3 * 4] = 1 - r3, l2[u3 * 4 + 1] = r3;
          } else c2[u3 * 4] = S3, l2[u3 * 4] = 1;
        }
        let C2 = y3.occluder === false ? 0 : 1;
        for (let e5 = 0; e5 < n3.idx.length; e5 += 1) u2[_2 + e5] = n3.idx[e5] + g2;
        for (let e5 = 0; e5 < n3.idx.length / 3; e5 += 1) f2[_2 / 3 + e5] = C2;
        g2 += n3.vcount, _2 += n3.idx.length;
      }
      let y2 = e4.ao ?? {}, b2 = R_(r2, i2, u2, f2, { res: y2.res ?? 72, dist: y2.dist ?? 0.28, ground: y2.ground ?? true, rays: y2.rays ?? 20 }), x2 = y2.strength ?? 1;
      for (let e5 = 0; e5 < t2; e5 += 1) {
        let t3 = d2[e5] * x2;
        s2[e5 * 4 + 2] = l_(1 - (1 - b2[e5]) * t3, 0.12, 1);
      }
      let S2 = new Qi();
      return S2.setAttribute(`position`, new Li(r2, 3)), S2.setAttribute(`normal`, new Li(i2, 3)), S2.setAttribute(`color`, new Li(a2, 3)), S2.setAttribute(`aPbr`, new Li(o2, 3)), S2.setAttribute(`aMat`, new Li(s2, 4)), c2 && l2 && (S2.setAttribute(`skinIndex`, new Ri(c2, 4)), S2.setAttribute(`skinWeight`, new Li(l2, 4))), S2.setIndex(new Li(u2, 1)), S2.computeBoundingBox(), S2.computeBoundingSphere(), { geometry: S2, triangles: n2 / 3, bounds: S2.boundingBox.clone() };
    }
  };
}));
function W_(e4, t2 = false) {
  let n2 = e4[0].index !== null, r2 = new Set(Object.keys(e4[0].attributes)), i2 = new Set(Object.keys(e4[0].morphAttributes)), a2 = {}, o2 = {}, s2 = e4[0].morphTargetsRelative, c2 = new Qi(), l2 = 0;
  for (let u2 = 0; u2 < e4.length; ++u2) {
    let d2 = e4[u2], f2 = 0;
    if (n2 !== (d2.index !== null)) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ` + u2 + `. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`), null;
    for (let e5 in d2.attributes) {
      if (!r2.has(e5)) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ` + u2 + `. All geometries must have compatible attributes; make sure "` + e5 + `" attribute exists among all geometries, or in none of them.`), null;
      a2[e5] === void 0 && (a2[e5] = []), a2[e5].push(d2.attributes[e5]), f2++;
    }
    if (f2 !== r2.size) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ` + u2 + `. Make sure all geometries have the same number of attributes.`), null;
    if (s2 !== d2.morphTargetsRelative) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ` + u2 + `. .morphTargetsRelative must be consistent throughout all geometries.`), null;
    for (let e5 in d2.morphAttributes) {
      if (!i2.has(e5)) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ` + u2 + `.  .morphAttributes must be consistent throughout all geometries.`), null;
      o2[e5] === void 0 && (o2[e5] = []), o2[e5].push(d2.morphAttributes[e5]);
    }
    if (t2) {
      let e5;
      if (n2) e5 = d2.index.count;
      else if (d2.attributes.position !== void 0) e5 = d2.attributes.position.count;
      else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ` + u2 + `. The geometry must have either an index or a position attribute`), null;
      c2.addGroup(l2, e5, u2), l2 += e5;
    }
  }
  if (n2) {
    let t3 = 0, n3 = [];
    for (let r3 = 0; r3 < e4.length; ++r3) {
      let i3 = e4[r3].index;
      for (let e5 = 0; e5 < i3.count; ++e5) n3.push(i3.getX(e5) + t3);
      t3 += e4[r3].attributes.position.count;
    }
    c2.setIndex(n3);
  }
  for (let e5 in a2) {
    let t3 = G_(a2[e5]);
    if (!t3) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ` + e5 + ` attribute.`), null;
    c2.setAttribute(e5, t3);
  }
  for (let e5 in o2) {
    let t3 = o2[e5][0].length;
    if (t3 !== 0) {
      c2.morphAttributes = c2.morphAttributes || {}, c2.morphAttributes[e5] = [];
      for (let n3 = 0; n3 < t3; ++n3) {
        let t4 = [];
        for (let r4 = 0; r4 < o2[e5].length; ++r4) t4.push(o2[e5][r4][n3]);
        let r3 = G_(t4);
        if (!r3) return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ` + e5 + ` morphAttribute.`), null;
        c2.morphAttributes[e5].push(r3);
      }
    }
  }
  return c2;
}
function G_(e4) {
  let t2, n2, r2, i2 = -1, a2 = 0;
  for (let o3 = 0; o3 < e4.length; ++o3) {
    let s3 = e4[o3];
    if (t2 === void 0 && (t2 = s3.array.constructor), t2 !== s3.array.constructor) return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`), null;
    if (n2 === void 0 && (n2 = s3.itemSize), n2 !== s3.itemSize) return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`), null;
    if (r2 === void 0 && (r2 = s3.normalized), r2 !== s3.normalized) return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`), null;
    if (i2 === -1 && (i2 = s3.gpuType), i2 !== s3.gpuType) return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`), null;
    a2 += s3.count * n2;
  }
  let o2 = new t2(a2), s2 = new Li(o2, n2, r2), c2 = 0;
  for (let t3 = 0; t3 < e4.length; ++t3) {
    let r3 = e4[t3];
    if (r3.isInterleavedBufferAttribute) {
      let e5 = c2 / n2;
      for (let t4 = 0, i3 = r3.count; t4 < i3; t4++) for (let i4 = 0; i4 < n2; i4++) {
        let n3 = r3.getComponent(t4, i4);
        s2.setComponent(t4 + e5, i4, n3);
      }
    } else o2.set(r3.array, c2);
    c2 += r3.count * n2;
  }
  return i2 !== void 0 && (s2.gpuType = i2), s2;
}
function K_(e4, t2 = 1e-4) {
  t2 = Math.max(t2, 2 ** -52);
  let n2 = {}, r2 = e4.getIndex(), i2 = e4.getAttribute(`position`), a2 = r2 ? r2.count : i2.count, o2 = 0, s2 = Object.keys(e4.attributes), c2 = {}, l2 = {}, u2 = [], d2 = [`getX`, `getY`, `getZ`, `getW`], f2 = [`setX`, `setY`, `setZ`, `setW`];
  for (let t3 = 0, n3 = s2.length; t3 < n3; t3++) {
    let n4 = s2[t3], r3 = e4.attributes[n4];
    c2[n4] = new r3.constructor(new r3.array.constructor(r3.count * r3.itemSize), r3.itemSize, r3.normalized);
    let i3 = e4.morphAttributes[n4];
    i3 && (l2[n4] || (l2[n4] = []), i3.forEach((e5, t4) => {
      let r4 = new e5.array.constructor(e5.count * e5.itemSize);
      l2[n4][t4] = new e5.constructor(r4, e5.itemSize, e5.normalized);
    }));
  }
  let p2 = t2 * 0.5, m2 = 10 ** Math.log10(1 / t2), h2 = p2 * m2;
  for (let t3 = 0; t3 < a2; t3++) {
    let i3 = r2 ? r2.getX(t3) : t3, a3 = ``;
    for (let t4 = 0, n3 = s2.length; t4 < n3; t4++) {
      let n4 = s2[t4], r3 = e4.getAttribute(n4), o3 = r3.itemSize;
      for (let e5 = 0; e5 < o3; e5++) a3 += `${~~(r3[d2[e5]](i3) * m2 + h2)},`;
    }
    if (a3 in n2) u2.push(n2[a3]);
    else {
      for (let t4 = 0, n3 = s2.length; t4 < n3; t4++) {
        let n4 = s2[t4], r3 = e4.getAttribute(n4), a4 = e4.morphAttributes[n4], u3 = r3.itemSize, p3 = c2[n4], m3 = l2[n4];
        for (let e5 = 0; e5 < u3; e5++) {
          let t5 = d2[e5], n5 = f2[e5];
          if (p3[n5](o2, r3[t5](i3)), a4) for (let e6 = 0, r4 = a4.length; e6 < r4; e6++) m3[e6][n5](o2, a4[e6][t5](i3));
        }
      }
      n2[a3] = o2, u2.push(o2), o2++;
    }
  }
  let g2 = e4.clone();
  for (let t3 in e4.attributes) {
    let e5 = c2[t3];
    if (g2.setAttribute(t3, new e5.constructor(e5.array.slice(0, o2 * e5.itemSize), e5.itemSize, e5.normalized)), t3 in l2) for (let e6 = 0; e6 < l2[t3].length; e6++) {
      let n3 = l2[t3][e6];
      g2.morphAttributes[t3][e6] = new n3.constructor(n3.array.slice(0, o2 * n3.itemSize), n3.itemSize, n3.normalized);
    }
  }
  return g2.setIndex(u2), g2;
}
function q_(e4, t2 = Math.PI / 3) {
  let n2 = Math.cos(t2), r2 = 1.0000000001 * 100, i2 = [new N(), new N(), new N()], a2 = new N(), o2 = new N(), s2 = new N(), c2 = new N();
  function l2(e5) {
    return `${~~(e5.x * r2)},${~~(e5.y * r2)},${~~(e5.z * r2)}`;
  }
  let u2 = e4.index ? e4.toNonIndexed() : e4, d2 = u2.attributes.position, f2 = {};
  for (let e5 = 0, t3 = d2.count / 3; e5 < t3; e5++) {
    let t4 = 3 * e5, n3 = i2[0].fromBufferAttribute(d2, t4 + 0), r3 = i2[1].fromBufferAttribute(d2, t4 + 1), s3 = i2[2].fromBufferAttribute(d2, t4 + 2);
    a2.subVectors(s3, r3), o2.subVectors(n3, r3);
    let c3 = new N().crossVectors(a2, o2).normalize();
    for (let e6 = 0; e6 < 3; e6++) {
      let t5 = i2[e6], n4 = l2(t5);
      n4 in f2 || (f2[n4] = []), f2[n4].push(c3);
    }
  }
  let p2 = new Li(new Float32Array(d2.count * 3), 3, false);
  for (let e5 = 0, t3 = d2.count / 3; e5 < t3; e5++) {
    let t4 = 3 * e5, r3 = i2[0].fromBufferAttribute(d2, t4 + 0), u3 = i2[1].fromBufferAttribute(d2, t4 + 1), m2 = i2[2].fromBufferAttribute(d2, t4 + 2);
    a2.subVectors(m2, u3), o2.subVectors(r3, u3), s2.crossVectors(a2, o2).normalize();
    for (let e6 = 0; e6 < 3; e6++) {
      let r4 = i2[e6], a3 = f2[l2(r4)];
      c2.set(0, 0, 0);
      for (let e7 = 0, t5 = a3.length; e7 < t5; e7++) {
        let t6 = a3[e7];
        s2.dot(t6) > n2 && c2.add(t6);
      }
      c2.normalize(), p2.setXYZ(t4 + e6, c2.x, c2.y, c2.z);
    }
  }
  return u2.setAttribute(`normal`, p2), u2;
}
var J_ = t((() => {
  Ed();
}));
function Y_(e4, t2 = {}) {
  let n2 = new cv(), r2 = t2.closed !== false, i2 = e4.length, a2 = e4[0].length, o2 = [];
  for (let r3 = 0; r3 < i2; r3 += 1) {
    let s3 = e4[r3], c3 = t2.vParams ? t2.vParams[r3] : r3 / Math.max(1, i2 - 1), l2 = 0;
    for (let e5 = 1; e5 < a2; e5 += 1) l2 = Math.max(l2, Math.abs(s3[e5][0] - s3[0][0]) + Math.abs(s3[e5][1] - s3[0][1]) + Math.abs(s3[e5][2] - s3[0][2]));
    if (l2 < 1e-6) {
      let e5 = n2.vert(s3[0][0], s3[0][1], s3[0][2], 0.5, c3);
      o2.push(Array(a2).fill(e5));
    } else {
      let e5 = [];
      for (let t3 = 0; t3 < a2; t3 += 1) e5.push(n2.vert(s3[t3][0], s3[t3][1], s3[t3][2], t3 / a2, c3));
      o2.push(e5);
    }
  }
  let s2 = r2 ? a2 : a2 - 1;
  for (let e5 = 0; e5 < i2 - 1; e5 += 1) {
    let t3 = o2[e5], r3 = o2[e5 + 1];
    for (let e6 = 0; e6 < s2; e6 += 1) {
      let i3 = (e6 + 1) % a2, o3 = t3[e6], s3 = t3[i3], c3 = r3[i3], l2 = r3[e6];
      o3 === s3 ? c3 !== l2 && n2.tri(o3, c3, l2) : c3 === l2 ? n2.tri(o3, s3, c3) : n2.quad(o3, s3, c3, l2);
    }
  }
  let c2 = (e5, t3) => {
    if (e5[0] === e5[1]) return;
    let r3 = 0, i3 = 0, a3 = 0;
    for (let t4 of e5) r3 += n2.pos[t4 * 3], i3 += n2.pos[t4 * 3 + 1], a3 += n2.pos[t4 * 3 + 2];
    let o3 = e5.length, s3 = e5.map((e6) => n2.vert(n2.pos[e6 * 3], n2.pos[e6 * 3 + 1], n2.pos[e6 * 3 + 2], n2.uv[e6 * 2], n2.uv[e6 * 2 + 1])), c3 = n2.vert(r3 / o3, i3 / o3, a3 / o3, 0.5, +!t3);
    for (let e6 = 0; e6 < o3; e6 += 1) {
      let r4 = s3[e6], i4 = s3[(e6 + 1) % o3];
      t3 ? n2.tri(c3, i4, r4) : n2.tri(c3, r4, i4);
    }
  };
  return t2.capStart && c2(o2[0], true), t2.capEnd && c2(o2[i2 - 1], false), n2.computeNormals(), n2;
}
function X_(e4, t2, n2 = {}) {
  let r2 = n2.sx ?? 1, i2 = n2.sz ?? 1, a2 = n2.phiLen ?? c_, o2 = n2.phi0 ?? 0, s2 = a2 >= c_ - 1e-6, c2 = s2 ? t2 : t2 + 1;
  return Y_(e4.map(([e5, n3]) => {
    let s3 = [];
    for (let l2 = 0; l2 < c2; l2 += 1) {
      let c3 = o2 + l2 / t2 * a2;
      s3.push([Math.sin(c3) * e5 * r2, n3, Math.cos(c3) * e5 * i2]);
    }
    return s3;
  }), { closed: s2, capStart: n2.capStart, capEnd: n2.capEnd });
}
function Z_(e4, t2, n2, r2, i2) {
  let a2 = i2 * i2, o2 = a2 * i2;
  return 0.5 * (2 * t2 + (-e4 + n2) * i2 + (2 * e4 - 5 * t2 + 4 * n2 - r2) * a2 + (-e4 + 3 * t2 - 3 * n2 + r2) * o2);
}
function Q_(e4, t2, n2 = 2, r2 = {}) {
  let i2 = e4.map((e5) => ({ y: e5.y, rx: e5.rx, rzf: e5.rzf, rzb: e5.rzb ?? e5.rzf, cx: e5.cx ?? 0, cz: e5.cz ?? 0, p: e5.p ?? 2 })), a2 = [`y`, `rx`, `rzf`, `rzb`, `cx`, `cz`, `p`], o2 = [];
  for (let e5 = 0; e5 < i2.length - 1; e5 += 1) {
    let t3 = i2[Math.max(0, e5 - 1)], r3 = i2[e5], s2 = i2[e5 + 1], c2 = i2[Math.min(i2.length - 1, e5 + 2)];
    for (let e6 = 0; e6 < n2; e6 += 1) {
      let i3 = e6 / n2, l2 = { ...r3 };
      for (let e7 of a2) l2[e7] = Z_(t3[e7], r3[e7], s2[e7], c2[e7], i3);
      o2.push(l2);
    }
  }
  return o2.push({ ...i2[i2.length - 1] }), Y_(o2.map((e5) => {
    let n3 = [], i3 = 2 / e5.p;
    for (let a3 = 0; a3 < t2; a3 += 1) {
      let o3 = a3 / t2 * c_, s2 = Math.sin(o3), c2 = Math.cos(o3), l2 = r2.shape ? r2.shape(o3, e5.y) : 1, u2 = Math.sign(s2) * Math.abs(s2) ** +i3 * Math.max(0, e5.rx) * l2, d2 = c2 >= 0 ? e5.rzf : e5.rzb, f2 = Math.sign(c2) * Math.abs(c2) ** +i3 * Math.max(0, d2) * l2;
      n3.push([e5.cx + u2, e5.y, e5.cz + f2]);
    }
    return n3;
  }), { closed: true, capStart: r2.capStart, capEnd: r2.capEnd });
}
function V(e4, t2, n2, r2, i2 = {}) {
  let a2 = e4.map((e5) => new N(e5[0], e5[1], e5[2])), o2;
  if (i2.linear || a2.length === 2) {
    let e5 = [0];
    for (let t4 = 1; t4 < a2.length; t4 += 1) e5.push(e5[t4 - 1] + a2[t4].distanceTo(a2[t4 - 1]));
    let t3 = e5[e5.length - 1];
    o2 = [];
    for (let n3 = 0; n3 <= r2; n3 += 1) {
      let i3 = n3 / r2 * t3, s3 = 1;
      for (; s3 < e5.length - 1 && e5[s3] < i3; ) s3 += 1;
      let c3 = (i3 - e5[s3 - 1]) / Math.max(1e-9, e5[s3] - e5[s3 - 1]);
      o2.push(a2[s3 - 1].clone().lerp(a2[s3], c3));
    }
  } else o2 = new xo(a2, false, `centripetal`, i2.tension ?? 0.5).getSpacedPoints(r2);
  let s2 = o2.map((e5, t3) => {
    let n3 = o2[Math.max(0, t3 - 1)];
    return o2[Math.min(o2.length - 1, t3 + 1)].clone().sub(n3).normalize();
  }), c2 = new N(...i2.up ?? [0, 0, 1]), l2 = c2.clone().sub(s2[0].clone().multiplyScalar(c2.dot(s2[0])));
  l2.lengthSq() < 1e-6 && (l2 = new N(1, 0, 0).cross(s2[0])), l2.normalize();
  let u2 = [], d2 = new ir();
  for (let e5 = 0; e5 < o2.length; e5 += 1) {
    e5 > 0 && (d2.setFromUnitVectors(s2[e5 - 1], s2[e5]), l2.applyQuaternion(d2).normalize());
    let r3 = s2[e5], a3 = new N().crossVectors(r3, l2).normalize(), c3 = new N().crossVectors(a3, r3).normalize(), f3 = e5 / (o2.length - 1), p3 = typeof t2 == `number` ? t2 : typeof t2 == `function` ? t2(f3) : t2, m3 = typeof p3 == `number` ? p3 : p3[0], h3 = typeof p3 == `number` ? p3 : p3[1], g3 = (i2.twist ?? 0) * f3, _3 = [];
    for (let t3 = 0; t3 < n2; t3 += 1) {
      let r4 = t3 / n2 * c_ + g3, i3 = Math.cos(r4), s3 = Math.sin(r4), l3 = o2[e5];
      _3.push([l3.x + c3.x * i3 * m3 + a3.x * s3 * h3, l3.y + c3.y * i3 * m3 + a3.y * s3 * h3, l3.z + c3.z * i3 * m3 + a3.z * s3 * h3]);
    }
    u2.push(_3);
  }
  let f2 = Y_(u2, { closed: true, capStart: i2.capStart, capEnd: i2.capEnd }), p2 = o2[Math.floor(o2.length / 2)], m2 = Math.floor(o2.length / 2) * n2, h2 = f2.pos[m2 * 3] - p2.x, g2 = f2.pos[m2 * 3 + 1] - p2.y, _2 = f2.pos[m2 * 3 + 2] - p2.z;
  return h2 * f2.nrm[m2 * 3] + g2 * f2.nrm[m2 * 3 + 1] + _2 * f2.nrm[m2 * 3 + 2] < 0 && (f2.flipWinding(), f2.computeNormals()), f2;
}
function H(e4, t2, n2, r2 = 12, i2 = 8) {
  let a2 = [];
  for (let e5 = 0; e5 <= i2; e5 += 1) {
    let t3 = -Math.PI / 2 + e5 / i2 * Math.PI;
    a2.push([Math.cos(t3), Math.sin(t3)]);
  }
  return a2[0][0] = 0, a2[i2][0] = 0, X_(a2, r2, { sx: e4, sz: n2 }).scale(1, t2, 1).computeNormals();
}
function $_(e4, t2, n2) {
  let r2 = new cv(), i2 = e4 / 2, a2 = t2 / 2, o2 = n2 / 2, s2 = (e5) => {
    let t3 = r2.vert(...e5[0], 0, 0), n3 = r2.vert(...e5[1], 1, 0), i3 = r2.vert(...e5[2], 1, 1), a3 = r2.vert(...e5[3], 0, 1);
    r2.quad(t3, n3, i3, a3);
  };
  return s2([[-i2, -a2, o2], [i2, -a2, o2], [i2, a2, o2], [-i2, a2, o2]]), s2([[i2, -a2, -o2], [-i2, -a2, -o2], [-i2, a2, -o2], [i2, a2, -o2]]), s2([[i2, -a2, o2], [i2, -a2, -o2], [i2, a2, -o2], [i2, a2, o2]]), s2([[-i2, -a2, -o2], [-i2, -a2, o2], [-i2, a2, o2], [-i2, a2, -o2]]), s2([[-i2, a2, o2], [i2, a2, o2], [i2, a2, -o2], [-i2, a2, -o2]]), s2([[-i2, -a2, -o2], [i2, -a2, -o2], [i2, -a2, o2], [-i2, -a2, o2]]), r2.toFlat();
}
function ev(e4, t2, n2, r2, i2 = 12) {
  let a2 = Math.min(r2, e4 / 2, t2 / 2, n2 / 2), o2 = -t2 / 2, s2 = t2 / 2;
  return Q_([{ y: o2, rx: e4 / 2 - a2, rzf: n2 / 2 - a2, p: 5 }, { y: o2 + a2 * 0.3, rx: e4 / 2 - a2 * 0.3, rzf: n2 / 2 - a2 * 0.3, p: 5 }, { y: o2 + a2, rx: e4 / 2, rzf: n2 / 2, p: 5 }, { y: s2 - a2, rx: e4 / 2, rzf: n2 / 2, p: 5 }, { y: s2 - a2 * 0.3, rx: e4 / 2 - a2 * 0.3, rzf: n2 / 2 - a2 * 0.3, p: 5 }, { y: s2, rx: e4 / 2 - a2, rzf: n2 / 2 - a2, p: 5 }], i2, 1, { capStart: true, capEnd: true });
}
function tv(e4, t2, n2 = {}) {
  let r2 = new Mo(e4.map(([e5, t3]) => new M(e5, t3)));
  if (n2.holes) for (let e5 of n2.holes) r2.holes.push(new jo(e5.map(([e6, t3]) => new M(e6, t3))));
  let i2 = n2.bevel ?? 0, a2 = new Fo(r2, { depth: t2, bevelEnabled: i2 > 0, bevelThickness: i2, bevelSize: i2, bevelSegments: n2.bevelSegs ?? 1, curveSegments: n2.curveSegs ?? 6 });
  a2.translate(0, 0, -t2 / 2), a2.deleteAttribute(`uv`);
  let o2 = cv.fromBuffer(a2);
  return a2.dispose(), nv(o2).creased(n2.crease ?? 40);
}
function nv(e4, t2 = 1e-5) {
  let n2 = /* @__PURE__ */ new Map(), r2 = new cv(), i2 = [], a2 = 1 / t2;
  for (let t3 = 0; t3 < e4.vcount; t3 += 1) {
    let o2 = `${Math.round(e4.pos[t3 * 3] * a2)},${Math.round(e4.pos[t3 * 3 + 1] * a2)},${Math.round(e4.pos[t3 * 3 + 2] * a2)}`, s2 = n2.get(o2);
    s2 === void 0 && (s2 = r2.vert(e4.pos[t3 * 3], e4.pos[t3 * 3 + 1], e4.pos[t3 * 3 + 2], e4.uv[t3 * 2], e4.uv[t3 * 2 + 1], e4.tag[t3]), n2.set(o2, s2)), i2.push(s2);
  }
  for (let t3 = 0; t3 < e4.idx.length; t3 += 3) {
    let n3 = i2[e4.idx[t3]], a3 = i2[e4.idx[t3 + 1]], o2 = i2[e4.idx[t3 + 2]];
    n3 !== a3 && a3 !== o2 && n3 !== o2 && r2.tri(n3, a3, o2);
  }
  return r2.computeNormals();
}
function rv(e4, t2, n2, r2, i2, a2 = {}) {
  let o2 = !!a2.closedU, s2 = o2 ? e4 : e4 + 1, c2 = [];
  for (let r3 = 0; r3 <= t2; r3 += 1) {
    let i3 = [];
    for (let a3 = 0; a3 < s2; a3 += 1) i3.push(new N(...n2(a3 / e4, r3 / t2)));
    c2.push(i3);
  }
  let l2 = [];
  for (let e5 = 0; e5 <= t2; e5 += 1) {
    let n3 = [];
    for (let r3 = 0; r3 < s2; r3 += 1) {
      let a3 = o2 ? (r3 - 1 + s2) % s2 : Math.max(0, r3 - 1), l3 = o2 ? (r3 + 1) % s2 : Math.min(s2 - 1, r3 + 1), u3 = Math.max(0, e5 - 1), d3 = Math.min(t2, e5 + 1), f3 = c2[e5][l3].clone().sub(c2[e5][a3]), p3 = c2[d3][r3].clone().sub(c2[u3][r3]), m3 = new N().crossVectors(f3, p3).normalize(), h3 = i2(c2[e5][r3]);
      m3.dot(h3) < 0 && m3.negate(), n3.push(m3);
    }
    l2.push(n3);
  }
  let u2 = new cv(), d2 = [], f2 = [];
  for (let n3 = 0; n3 <= t2; n3 += 1) {
    let i3 = [], o3 = [];
    for (let d3 = 0; d3 < s2; d3 += 1) {
      let s3 = d3 / e4, f3 = n3 / t2, p3 = (a2.thickFn ? a2.thickFn(s3, f3) : 1) * r2 * 0.5, m3 = c2[n3][d3], h3 = l2[n3][d3];
      i3.push(u2.vert(m3.x + h3.x * p3, m3.y + h3.y * p3, m3.z + h3.z * p3, s3, f3, 0)), o3.push(u2.vert(m3.x - h3.x * p3, m3.y - h3.y * p3, m3.z - h3.z * p3, s3, f3, 1));
    }
    d2.push(i3), f2.push(o3);
  }
  let p2 = o2 ? s2 : s2 - 1, m2 = (() => {
    let e5 = c2[0][0], t3 = c2[0][1 % s2], n3 = c2[1][1 % s2];
    return new N().crossVectors(t3.clone().sub(e5), n3.clone().sub(e5)).dot(l2[0][0]) >= 0;
  })();
  for (let e5 = 0; e5 < t2; e5 += 1) for (let t3 = 0; t3 < p2; t3 += 1) {
    let n3 = (t3 + 1) % s2, r3 = d2[e5][t3], i3 = d2[e5][n3], a3 = d2[e5 + 1][n3], o3 = d2[e5 + 1][t3];
    m2 ? u2.quad(r3, i3, a3, o3) : u2.quad(r3, o3, a3, i3);
    let c3 = f2[e5][t3], l3 = f2[e5][n3], p3 = f2[e5 + 1][n3], h3 = f2[e5 + 1][t3];
    m2 ? u2.quad(c3, h3, p3, l3) : u2.quad(c3, l3, p3, h3);
  }
  let h2 = (e5, t3, n3) => {
    let r3 = e5.map((e6) => u2.vert(u2.pos[e6 * 3], u2.pos[e6 * 3 + 1], u2.pos[e6 * 3 + 2], u2.uv[e6 * 2], u2.uv[e6 * 2 + 1], 2)), i3 = t3.map((e6) => u2.vert(u2.pos[e6 * 3], u2.pos[e6 * 3 + 1], u2.pos[e6 * 3 + 2], u2.uv[e6 * 2], u2.uv[e6 * 2 + 1], 2));
    for (let e6 = 0; e6 < r3.length - 1; e6 += 1) n3 ? u2.quad(r3[e6], i3[e6], i3[e6 + 1], r3[e6 + 1]) : u2.quad(r3[e6], r3[e6 + 1], i3[e6 + 1], i3[e6]);
  }, g2 = (e5) => o2 ? [...d2[e5], d2[e5][0]] : d2[e5], _2 = (e5) => o2 ? [...f2[e5], f2[e5][0]] : f2[e5];
  if (h2(g2(t2), _2(t2), !m2), h2(g2(0), _2(0), m2), !o2) {
    let e5 = (e6) => d2.map((t4) => t4[e6]), t3 = (e6) => f2.map((t4) => t4[e6]);
    h2(e5(0), t3(0), !m2), h2(e5(s2 - 1), t3(s2 - 1), m2);
  }
  return u2.computeNormals(), u2;
}
function iv(e4, t2, n2, r2, i2 = 5, a2 = 0) {
  let o2 = X_([[n2, 0], [n2 * 0.82, r2 * 0.3], [n2 * 0.45, r2 * 0.7], [0, r2]], i2, { capStart: true });
  return a2 && o2.deform((e5) => {
    let t3 = e5.y / r2;
    e5.z += a2 * t3 * t3 * r2;
  }), o2.computeNormals(), o2.alignY(t2, e4);
}
function av(e4, t2, n2 = 16, r2 = 6, i2 = t2) {
  let a2 = [];
  for (let o2 = 0; o2 <= n2; o2 += 1) {
    let s2 = o2 / n2 * c_, c2 = [];
    for (let n3 = 0; n3 < r2; n3 += 1) {
      let a3 = n3 / r2 * c_, o3 = e4 + Math.cos(a3) * t2;
      c2.push([Math.sin(s2) * o3, Math.sin(a3) * i2, Math.cos(s2) * o3]);
    }
    a2.push(c2);
  }
  return Y_(a2, { closed: true }).orientOutward();
}
var ov, sv, cv, lv = t((() => {
  Ed(), J_(), __(), ov = new N(), sv = new N(), cv = class e4 {
    pos = [];
    nrm = [];
    idx = [];
    uv = [];
    tag = [];
    get vcount() {
      return this.pos.length / 3;
    }
    get tris() {
      return this.idx.length / 3;
    }
    vert(e5, t2, n2, r2 = 0, i2 = 0, a2 = 0) {
      return this.pos.push(e5, t2, n2), this.nrm.push(0, 1, 0), this.uv.push(r2, i2), this.tag.push(a2), this.pos.length / 3 - 1;
    }
    tri(e5, t2, n2) {
      this.idx.push(e5, t2, n2);
    }
    quad(e5, t2, n2, r2) {
      this.idx.push(e5, t2, n2, e5, n2, r2);
    }
    clone() {
      let t2 = new e4();
      return t2.pos = this.pos.slice(), t2.nrm = this.nrm.slice(), t2.idx = this.idx.slice(), t2.uv = this.uv.slice(), t2.tag = this.tag.slice(), t2;
    }
    merge(...e5) {
      for (let t2 of e5) {
        let e6 = this.vcount;
        for (let e7 = 0; e7 < t2.pos.length; e7 += 1) this.pos.push(t2.pos[e7]);
        for (let e7 = 0; e7 < t2.nrm.length; e7 += 1) this.nrm.push(t2.nrm[e7]);
        for (let e7 = 0; e7 < t2.uv.length; e7 += 1) this.uv.push(t2.uv[e7]);
        for (let e7 = 0; e7 < t2.tag.length; e7 += 1) this.tag.push(t2.tag[e7]);
        for (let n2 = 0; n2 < t2.idx.length; n2 += 1) this.idx.push(t2.idx[n2] + e6);
      }
      return this;
    }
    setTag(e5) {
      for (let t2 = 0; t2 < this.tag.length; t2 += 1) this.tag[t2] = e5;
      return this;
    }
    applyMatrix(e5) {
      let t2 = new sr().getNormalMatrix(e5);
      for (let n2 = 0; n2 < this.pos.length; n2 += 3) ov.set(this.pos[n2], this.pos[n2 + 1], this.pos[n2 + 2]).applyMatrix4(e5), this.pos[n2] = ov.x, this.pos[n2 + 1] = ov.y, this.pos[n2 + 2] = ov.z, sv.set(this.nrm[n2], this.nrm[n2 + 1], this.nrm[n2 + 2]).applyMatrix3(t2).normalize(), this.nrm[n2] = sv.x, this.nrm[n2 + 1] = sv.y, this.nrm[n2 + 2] = sv.z;
      return e5.determinant() < 0 && this.flipWinding(), this;
    }
    translate(e5, t2, n2) {
      for (let r2 = 0; r2 < this.pos.length; r2 += 3) this.pos[r2] += e5, this.pos[r2 + 1] += t2, this.pos[r2 + 2] += n2;
      return this;
    }
    scale(e5, t2 = e5, n2 = e5) {
      return this.applyMatrix(new wr().makeScale(e5, t2, n2));
    }
    rotateX(e5) {
      return this.applyMatrix(new wr().makeRotationX(e5));
    }
    rotateY(e5) {
      return this.applyMatrix(new wr().makeRotationY(e5));
    }
    rotateZ(e5) {
      return this.applyMatrix(new wr().makeRotationZ(e5));
    }
    rotateAt(e5, t2, n2, r2, i2 = `XYZ`) {
      let a2 = new wr().makeTranslation(e5[0], e5[1], e5[2]).multiply(new wr().makeRotationFromEuler(new Pr(t2, n2, r2, i2))).multiply(new wr().makeTranslation(-e5[0], -e5[1], -e5[2]));
      return this.applyMatrix(a2);
    }
    alignY(e5, t2, n2 = 0) {
      let r2 = new N(e5[0], e5[1], e5[2]).normalize(), i2 = new ir().setFromUnitVectors(new N(0, 1, 0), r2);
      n2 && i2.multiply(new ir().setFromAxisAngle(new N(0, 1, 0), n2));
      let a2 = new wr().compose(new N(t2[0], t2[1], t2[2]), i2, new N(1, 1, 1));
      return this.applyMatrix(a2);
    }
    deform(e5) {
      let t2 = new N();
      for (let n2 = 0; n2 < this.vcount; n2 += 1) t2.set(this.pos[n2 * 3], this.pos[n2 * 3 + 1], this.pos[n2 * 3 + 2]), e5(t2, n2, this.uv[n2 * 2], this.uv[n2 * 2 + 1], this.tag[n2]), this.pos[n2 * 3] = t2.x, this.pos[n2 * 3 + 1] = t2.y, this.pos[n2 * 3 + 2] = t2.z;
      return this;
    }
    flipWinding() {
      for (let e5 = 0; e5 < this.idx.length; e5 += 3) {
        let t2 = this.idx[e5 + 1];
        this.idx[e5 + 1] = this.idx[e5 + 2], this.idx[e5 + 2] = t2;
      }
      return this;
    }
    computeNormals() {
      let e5 = new Float64Array(this.pos.length), t2 = this.pos;
      for (let n2 = 0; n2 < this.idx.length; n2 += 3) {
        let r2 = this.idx[n2] * 3, i2 = this.idx[n2 + 1] * 3, a2 = this.idx[n2 + 2] * 3, o2 = t2[i2] - t2[r2], s2 = t2[i2 + 1] - t2[r2 + 1], c2 = t2[i2 + 2] - t2[r2 + 2], l2 = t2[a2] - t2[r2], u2 = t2[a2 + 1] - t2[r2 + 1], d2 = t2[a2 + 2] - t2[r2 + 2], f2 = s2 * d2 - c2 * u2, p2 = c2 * l2 - o2 * d2, m2 = o2 * u2 - s2 * l2;
        e5[r2] += f2, e5[r2 + 1] += p2, e5[r2 + 2] += m2, e5[i2] += f2, e5[i2 + 1] += p2, e5[i2 + 2] += m2, e5[a2] += f2, e5[a2 + 1] += p2, e5[a2 + 2] += m2;
      }
      for (let t3 = 0; t3 < e5.length; t3 += 3) {
        let n2 = Math.hypot(e5[t3], e5[t3 + 1], e5[t3 + 2]) || 1;
        this.nrm[t3] = e5[t3] / n2, this.nrm[t3 + 1] = e5[t3 + 1] / n2, this.nrm[t3 + 2] = e5[t3 + 2] / n2;
      }
      return this;
    }
    signedVolume() {
      let e5 = 0, t2 = this.pos;
      for (let n2 = 0; n2 < this.idx.length; n2 += 3) {
        let r2 = this.idx[n2] * 3, i2 = this.idx[n2 + 1] * 3, a2 = this.idx[n2 + 2] * 3;
        e5 += t2[r2] * (t2[i2 + 1] * t2[a2 + 2] - t2[i2 + 2] * t2[a2 + 1]) - t2[r2 + 1] * (t2[i2] * t2[a2 + 2] - t2[i2 + 2] * t2[a2]) + t2[r2 + 2] * (t2[i2] * t2[a2 + 1] - t2[i2 + 1] * t2[a2]);
      }
      return e5 / 6;
    }
    orientOutward() {
      return this.signedVolume() < 0 && this.flipWinding(), this.computeNormals();
    }
    toFlat() {
      let e5 = [], t2 = [], n2 = [], r2 = [];
      for (let i2 = 0; i2 < this.idx.length; i2 += 1) {
        let a2 = this.idx[i2];
        e5.push(this.pos[a2 * 3], this.pos[a2 * 3 + 1], this.pos[a2 * 3 + 2]), t2.push(this.uv[a2 * 2], this.uv[a2 * 2 + 1]), n2.push(this.tag[a2]), r2.push(i2);
      }
      return this.pos = e5, this.uv = t2, this.tag = n2, this.idx = r2, this.nrm = Array(e5.length).fill(0), this.computeNormals();
    }
    creased(t2 = 35) {
      let n2 = this.toBuffer(), r2 = q_(n2, t2 * Math.PI / 180), i2 = e4.fromBuffer(r2);
      return this.pos = i2.pos, this.nrm = i2.nrm, this.idx = i2.idx, this.uv = i2.uv, this.tag = i2.tag, n2.dispose(), r2.dispose(), this;
    }
    mirrorX() {
      let e5 = this.clone();
      for (let t2 = 0; t2 < e5.pos.length; t2 += 3) e5.pos[t2] = -e5.pos[t2], e5.nrm[t2] = -e5.nrm[t2];
      return e5.flipWinding();
    }
    bulge(e5, t2, n2) {
      let r2 = typeof t2 == `number` ? t2 : t2[0], i2 = typeof t2 == `number` ? t2 : t2[1], a2 = typeof t2 == `number` ? t2 : t2[2];
      for (let t3 = 0; t3 < this.vcount; t3 += 1) {
        let o2 = (this.pos[t3 * 3] - e5[0]) / r2, s2 = (this.pos[t3 * 3 + 1] - e5[1]) / i2, c2 = (this.pos[t3 * 3 + 2] - e5[2]) / a2, l2 = o2 * o2 + s2 * s2 + c2 * c2;
        if (l2 >= 1) continue;
        let u2 = (1 - l2) * (1 - l2);
        this.pos[t3 * 3] += this.nrm[t3 * 3] * n2 * u2, this.pos[t3 * 3 + 1] += this.nrm[t3 * 3 + 1] * n2 * u2, this.pos[t3 * 3 + 2] += this.nrm[t3 * 3 + 2] * n2 * u2;
      }
      return this;
    }
    grab(e5, t2, n2) {
      let r2 = typeof t2 == `number` ? t2 : t2[0], i2 = typeof t2 == `number` ? t2 : t2[1], a2 = typeof t2 == `number` ? t2 : t2[2];
      for (let t3 = 0; t3 < this.vcount; t3 += 1) {
        let o2 = (this.pos[t3 * 3] - e5[0]) / r2, s2 = (this.pos[t3 * 3 + 1] - e5[1]) / i2, c2 = (this.pos[t3 * 3 + 2] - e5[2]) / a2, l2 = o2 * o2 + s2 * s2 + c2 * c2;
        if (l2 >= 1) continue;
        let u2 = (1 - l2) * (1 - l2);
        this.pos[t3 * 3] += n2[0] * u2, this.pos[t3 * 3 + 1] += n2[1] * u2, this.pos[t3 * 3 + 2] += n2[2] * u2;
      }
      return this;
    }
    noise(e5, t2, n2 = 0, r2 = 2) {
      for (let i2 = 0; i2 < this.vcount; i2 += 1) {
        let a2 = this.pos[i2 * 3], o2 = this.pos[i2 * 3 + 1], s2 = this.pos[i2 * 3 + 2], c2 = o_(a2 * t2, o2 * t2, s2 * t2, r2, n2) * e5;
        this.pos[i2 * 3] += this.nrm[i2 * 3] * c2, this.pos[i2 * 3 + 1] += this.nrm[i2 * 3 + 1] * c2, this.pos[i2 * 3 + 2] += this.nrm[i2 * 3 + 2] * c2;
      }
      return this;
    }
    toBuffer() {
      let e5 = new Qi();
      return e5.setAttribute(`position`, new Bi(this.pos, 3)), e5.setAttribute(`normal`, new Bi(this.nrm, 3)), e5.setAttribute(`uv`, new Bi(this.uv, 2)), e5.setAttribute(`tag`, new Bi(this.tag, 1)), e5.setIndex(this.idx), e5;
    }
    static fromBuffer(t2) {
      let n2 = new e4(), r2 = t2.getAttribute(`position`), i2 = t2.getAttribute(`normal`), a2 = t2.getAttribute(`uv`), o2 = t2.getAttribute(`tag`);
      for (let e5 = 0; e5 < r2.count; e5 += 1) n2.pos.push(r2.getX(e5), r2.getY(e5), r2.getZ(e5)), i2 ? n2.nrm.push(i2.getX(e5), i2.getY(e5), i2.getZ(e5)) : n2.nrm.push(0, 1, 0), a2 ? n2.uv.push(a2.getX(e5), a2.getY(e5)) : n2.uv.push(0, 0), n2.tag.push(o2 ? o2.getX(e5) : 0);
      if (t2.index) for (let e5 = 0; e5 < t2.index.count; e5 += 1) n2.idx.push(t2.index.getX(e5));
      else for (let e5 = 0; e5 < r2.count; e5 += 1) n2.idx.push(e5);
      return i2 || n2.computeNormals(), n2;
    }
  };
}));
function U(e4, t2 = {}) {
  return { ...fv[e4], ...t2 };
}
function uv(e4, t2 = 0.45, n2 = {}) {
  return { color: e4, rough: 0.06, metal: 0, emit: t2, detail: B.GEM, wear: 0, ao: 0.4, ...n2 };
}
function dv(e4, t2 = 2.5, n2 = {}) {
  return { color: e4, rough: 0.4, metal: 0, emit: t2, detail: B.EMISSIVE, wear: 0, ao: 0, occluder: false, ...n2 };
}
var fv, pv, mv = t((() => {
  U_(), fv = { steel: { color: `#aab1ba`, rough: 0.3, metal: 1, detail: B.METAL, wear: 0.15 }, brightSteel: { color: `#cfd5dc`, rough: 0.2, metal: 1, detail: B.METAL, wear: 0.05 }, darkSteel: { color: `#4f555d`, rough: 0.38, metal: 1, detail: B.METAL, wear: 0.25 }, iron: { color: `#666a70`, rough: 0.52, metal: 0.92, detail: B.METAL, wear: 0.45 }, rust: { color: `#5e4636`, rough: 0.72, metal: 0.65, detail: B.METAL, wear: 0.95 }, gold: { color: `#d8a446`, rough: 0.26, metal: 1, detail: B.METAL, wear: 0.08 }, bronze: { color: `#9a6838`, rough: 0.36, metal: 1, detail: B.METAL, wear: 0.3 }, silver: { color: `#d6d8dc`, rough: 0.22, metal: 1, detail: B.METAL, wear: 0.1 }, wood: { color: `#6e4a2c`, rough: 0.68, metal: 0, detail: B.WOOD, wear: 0.3 }, darkWood: { color: `#3c281a`, rough: 0.62, metal: 0, detail: B.WOOD, wear: 0.3 }, paleWood: { color: `#9c7a52`, rough: 0.7, metal: 0, detail: B.WOOD, wear: 0.3 }, leather: { color: `#5e3d24`, rough: 0.62, metal: 0, detail: B.LEATHER, wear: 0.35 }, darkLeather: { color: `#352419`, rough: 0.6, metal: 0, detail: B.LEATHER, wear: 0.35 }, redLeather: { color: `#5a1a14`, rough: 0.55, metal: 0, detail: B.LEATHER, wear: 0.3 }, cloth: { color: `#6b5b45`, rough: 0.9, metal: 0, detail: B.CLOTH, wear: 0.4 }, linen: { color: `#b8a888`, rough: 0.88, metal: 0, detail: B.CLOTH, wear: 0.35 }, bone: { color: `#d8ccb0`, rough: 0.55, metal: 0, detail: B.BONE, wear: 0.35 }, oldBone: { color: `#b8a682`, rough: 0.62, metal: 0, detail: B.BONE, wear: 0.7 }, stone: { color: `#4c4c50`, rough: 0.85, metal: 0, detail: B.STONE, wear: 0.4 }, darkStone: { color: `#2b2b30`, rough: 0.7, metal: 0, detail: B.STONE, wear: 0.3 }, parchment: { color: `#d6c49a`, rough: 0.85, metal: 0, detail: B.LEATHER, wear: 0.4 }, skin: { color: `#8a6a58`, rough: 0.6, metal: 0, detail: B.SKIN, wear: 0.4 }, hair: { color: `#2a1d16`, rough: 0.55, metal: 0, detail: B.HAIR, wear: 0 }, fur: { color: `#4a3a2c`, rough: 0.95, metal: 0, detail: B.FUR, wear: 0.2 }, black: { color: `#151517`, rough: 0.5, metal: 0.2, detail: B.METAL, wear: 0.2 } }, pv = class {
    mb = new H_();
    get parts() {
      return this.mb.parts;
    }
    add(e4, t2) {
      return this.mb.add(e4, typeof t2 == `string` ? U(t2) : t2), this;
    }
    build(e4 = 0.06) {
      let t2 = this.mb.build({ skinned: false, ao: { res: 56, dist: e4, ground: false, rays: 14, strength: 0.9 } });
      return { geometry: t2.geometry, triangles: t2.triangles };
    }
  };
}));
function hv(e4) {
  let t2 = e4.stations ?? 14, n2 = [], r2 = e4.y0 ?? 0;
  for (let i3 = 0; i3 <= t2; i3 += 1) {
    let a2 = i3 / t2, o2 = r2 + a2 * e4.length, s2 = Math.max(0, e4.width(a2)), c2 = (typeof e4.thick == `number` ? e4.thick : e4.thick(a2)) * (e4.point === false ? 1 : 1 - z(0.82, 1, a2) * 0.85), l2 = e4.curve ? e4.curve(a2) : 0, u2 = e4.fuller && a2 < e4.fuller ? 0.55 + 0.45 * z(e4.fuller * 0.75, e4.fuller, a2) : 1, d2;
    d2 = i3 === t2 && e4.point !== false ? Array(10).fill(0).map(() => [l2, o2, 0]) : e4.single ? [[l2 + s2, o2, 0], [l2 + s2 * 0.4, o2, c2 * 0.85], [l2 - s2 * 0.35, o2, c2 * u2], [l2 - s2 * 0.92, o2, c2 * 0.95], [l2 - s2, o2, c2 * 0.5], [l2 - s2, o2, -c2 * 0.5], [l2 - s2 * 0.92, o2, -c2 * 0.95], [l2 - s2 * 0.35, o2, -c2 * u2], [l2 + s2 * 0.4, o2, -c2 * 0.85], [l2 + s2 * 0.98, o2, -c2 * 0.05]] : [[l2 + s2, o2, 0], [l2 + s2 * 0.55, o2, c2 * 0.88], [l2 + s2 * 0.18, o2, c2 * u2], [l2 - s2 * 0.18, o2, c2 * u2], [l2 - s2 * 0.55, o2, c2 * 0.88], [l2 - s2, o2, 0], [l2 - s2 * 0.55, o2, -c2 * 0.88], [l2 - s2 * 0.18, o2, -c2 * u2], [l2 + s2 * 0.18, o2, -c2 * u2], [l2 + s2 * 0.55, o2, -c2 * 0.88]], n2.push(d2);
  }
  let i2 = Y_(n2, { closed: true, capStart: true });
  return i2.orientOutward(), i2.creased(32);
}
function gv(e4, t2, n2, r2 = {}) {
  let i2 = r2.y ?? 0, a2 = r2.droop ?? 0, o2 = [];
  for (let t3 = 0; t3 <= 8; t3 += 1) {
    let n3 = t3 / 8, r3 = (n3 - 0.5) * e4;
    o2.push([r3, i2 - a2 * (Math.abs(n3 - 0.5) * 2) ** 2, 0]);
  }
  let s2 = V(o2, (e5) => {
    let r3 = Math.abs(e5 - 0.5) * 2, i3 = 1 + z(0.7, 1, r3) * 0.45;
    return [t2 * 0.5 * i3, n2 * 0.5 * (1 - r3 * 0.2)];
  }, 5, 8, { up: [0, 1, 0], capStart: true, capEnd: true });
  if (r2.knob) for (let t3 of [-1, 1]) {
    let n3 = X_([[0, -r2.knob], [r2.knob * 0.8, -r2.knob * 0.55], [r2.knob, 0], [r2.knob * 0.8, r2.knob * 0.55], [0, r2.knob]], 6);
    n3.translate(t3 * e4 / 2, i2 - a2, 0), s2.merge(n3);
  }
  return s2.creased(40);
}
function _v(e4, t2, n2, r2 = 7, i2 = 6) {
  let a2 = [], o2 = r2 + 3;
  for (let i3 = 0; i3 <= o2; i3 += 1) {
    let s2 = i3 / o2, c2 = 0.88 + 0.12 * Math.abs(Math.sin(s2 * r2 * Math.PI)), l2 = 1 + 0.08 * Math.sin(s2 * Math.PI);
    a2.push([n2 * c2 * l2, R(e4, t2, s2)]);
  }
  return X_(a2, i2, { capStart: true, capEnd: true });
}
function vv(e4, t2, n2 = `ball`) {
  let r2;
  switch (n2) {
    case `disc`:
      return r2 = [[0, e4 - t2 * 0.5], [t2 * 0.7, e4 - t2 * 0.45], [t2, e4 - t2 * 0.2], [t2, e4 + t2 * 0.2], [t2 * 0.55, e4 + t2 * 0.5], [0, e4 + t2 * 0.55]], X_(r2, 12, { sz: 0.55 }).creased(40);
    case `wheel`:
      return r2 = [[0, e4 - t2], [t2 * 0.5, e4 - t2 * 0.9], [t2 * 0.85, e4 - t2 * 0.5], [t2, e4], [t2 * 0.85, e4 + t2 * 0.5], [t2 * 0.5, e4 + t2 * 0.9], [0, e4 + t2]], X_(r2, 12, { sz: 0.45 }).rotateZ(0).creased(30);
    case `drop`:
      return r2 = [[0, e4 - t2 * 1.6], [t2 * 0.55, e4 - t2 * 1.1], [t2, e4 - t2 * 0.2], [t2 * 0.7, e4 + t2 * 0.5], [t2 * 0.4, e4 + t2 * 0.7]], X_(r2, 10);
    case `fang`:
      return X_([[0, e4 - t2 * 2], [t2 * 0.5, e4 - t2 * 1.2], [t2 * 0.8, e4 - t2 * 0.3], [t2 * 0.6, e4 + t2 * 0.4]], 8);
    default:
      return r2 = [[0, e4 - t2], [t2 * 0.7, e4 - t2 * 0.72], [t2, e4], [t2 * 0.7, e4 + t2 * 0.72], [t2 * 0.35, e4 + t2 * 0.95]], X_(r2, 10);
  }
}
function yv(e4, t2, n2, r2, i2 = 8, a2 = 10, o2 = 0) {
  let s2 = [];
  for (let i3 = 0; i3 <= a2; i3 += 1) {
    let o3 = i3 / a2;
    s2.push([R(n2, r2, o3) * (1 + Math.sin(o3 * 17.3) * 0.03), R(e4, t2, o3)]);
  }
  let c2 = X_(s2, i2, { capStart: true, capEnd: true });
  return o2 && c2.deform((n3) => n3.x += Math.sin((n3.y - e4) / (t2 - e4) * Math.PI) * o2), c2.computeNormals();
}
function bv(e4, t2, n2, r2 = 10) {
  return X_([[t2 * 0.92, e4 - n2 / 2], [t2, e4 - n2 * 0.35], [t2, e4 + n2 * 0.35], [t2 * 0.92, e4 + n2 / 2]], r2, { capStart: true, capEnd: true }).creased(40);
}
function xv(e4, t2, n2, r2 = {}) {
  let i2 = tv(e4, t2, { bevel: r2.bevel ?? t2 * 0.18, bevelSegs: 1, holes: r2.holes, crease: 35 });
  return i2.deform((e5) => {
    let t3 = z(n2 * 0.35, n2, e5.x);
    e5.z *= 1 - t3 * 0.85;
  }), i2.computeNormals().creased(35);
}
function Sv(e4, t2, n2, r2 = 6, i2 = 0.012) {
  let a2 = new cv(), o2 = X_([[0, e4 - n2 * 0.55], [t2 * 0.35, e4 - n2 * 0.5], [t2 * 0.42, e4], [t2 * 0.35, e4 + n2 * 0.5], [0, e4 + n2 * 0.58]], 10);
  a2.merge(o2);
  for (let o3 = 0; o3 < r2; o3 += 1) {
    let s2 = o3 / r2 * c_, c2 = tv([[0, -n2 * 0.5], [t2 * 0.75, -n2 * 0.42], [t2, -n2 * 0.1], [t2 * 0.95, n2 * 0.25], [t2 * 0.55, n2 * 0.5], [0, n2 * 0.52]], i2, { bevel: i2 * 0.25, crease: 35 });
    c2.rotateY(-s2 + Math.PI / 2), c2.translate(0, e4, 0), a2.merge(c2);
  }
  return a2;
}
function Cv(e4, t2, n2 = 12, r2 = 0.6, i2 = 1) {
  let a2 = new cv(), o2 = X_(Array.from({ length: 9 }, (e5, n3) => {
    let r3 = -Math.PI / 2 + n3 / 8 * Math.PI;
    return [n3 === 0 || n3 === 8 ? 0 : Math.cos(r3) * t2, Math.sin(r3) * t2];
  }), 12);
  o2.translate(e4[0], e4[1], e4[2]), a2.merge(o2);
  for (let o3 = 0; o3 < n2; o3 += 1) {
    let s2 = (o3 + 0.5) / n2, c2 = Math.acos(1 - 2 * s2), l2 = o3 * 2.39996 + i2, u2 = [Math.sin(c2) * Math.cos(l2), Math.cos(c2), Math.sin(c2) * Math.sin(l2)];
    a2.merge(iv([e4[0] + u2[0] * t2 * 0.85, e4[1] + u2[1] * t2 * 0.85, e4[2] + u2[2] * t2 * 0.85], u2, t2 * 0.24, t2 * r2, 5));
  }
  return a2;
}
function wv(e4, t2, n2, r2) {
  let i2 = new cv(), a2 = new N(...e4), o2 = new N(...t2).clone().sub(a2), s2 = o2.length();
  o2.normalize();
  for (let e5 = 0; e5 < n2; e5 += 1) {
    let t3 = (e5 + 0.5) / n2, c2 = a2.clone().addScaledVector(o2, s2 * t3), l2 = av(r2, r2 * 0.28, 8, 4, r2 * 0.28);
    l2.scale(0.75, 1, 1.25), l2.rotateY(e5 % 2 ? Math.PI / 2 : 0);
    let u2 = new ir().setFromUnitVectors(new N(0, 0, 1), o2);
    l2.applyMatrix(new wr().makeRotationFromQuaternion(u2)), l2.translate(c2.x, c2.y, c2.z), i2.merge(l2);
  }
  return i2;
}
function Tv(e4, t2, n2, r2 = 6, i2 = 3) {
  let a2 = [], o2 = (t3, n3, a3) => {
    let o3 = [];
    for (let s3 = 0; s3 < r2; s3 += 1) {
      let c2 = s3 / r2 * c_ + a3, l2 = 1 + 0.12 * Math.sin(s3 * 2.7 + i2);
      o3.push([e4[0] + Math.sin(c2) * n3 * l2, e4[1] + t3, e4[2] + Math.cos(c2) * n3 * l2]);
    }
    return o3;
  };
  a2.push(o2(-n2 * 0.5, 0, 0)), a2.push(o2(-n2 * 0.22, t2 * 0.85, 0)), a2.push(o2(n2 * 0.1, t2, 0.15)), a2.push(o2(n2 * 0.28, t2 * 0.8, 0.15)), a2.push(o2(n2 * 0.5, 0, 0));
  let s2 = Y_(a2, { closed: true });
  return s2.orientOutward(), s2.toFlat();
}
var Ev = t((() => {
  Ed(), lv(), __();
}));
function Dv(e4, t2) {
  let n2 = t2.gold ? U(`gold`) : U(`darkSteel`, { wear: 0.35 });
  e4.add(_v(t2.grip0, t2.grip1, t2.gripR, t2.wraps ?? 7), U(`darkLeather`, { wear: 0.5 })), e4.add(gv(t2.guardW, 0.022, 0.03, { y: t2.guardY, droop: t2.guardDroop ?? 0, knob: 0.011 }), n2), e4.add(bv(t2.guardY - 0.016, t2.gripR * 1.25, 0.014), n2), e4.add(vv(t2.grip0 - (t2.pommelR ?? 0.02) * 0.9, t2.pommelR ?? 0.02, t2.pommelKind ?? `ball`), n2);
}
var Ov, kv, Av = t((() => {
  U_(), lv(), __(), mv(), Ev(), Ov = (e4) => (t2, n2) => {
    let r2 = Math.min(1, Math.abs(t2.p.x) / Math.max(1e-3, e4));
    n2[0] = R(n2[0] + 0.08, n2[0] - 0.12, z(0.55, 0.95, r2));
  }, kv = { dagger: () => {
    let e4 = new pv(), t2 = 0.27;
    return e4.add(hv({ length: t2, y0: 0.062, width: (e5) => R(0.021, 4e-3, e5 ** 1.2), thick: 45e-4, fuller: 0.55 }), U(`steel`, { pbr: Ov(0.021) })), Dv(e4, { grip0: -0.05, grip1: 0.048, gripR: 0.0115, guardW: 0.085, guardY: 0.055, pommelKind: `ball`, pommelR: 0.015 }), { builder: e4, tip: [0, 0.062 + t2, 0], kind: `dagger`, aoDist: 0.03 };
  }, kris: () => {
    let e4 = new pv();
    e4.add(hv({ length: 0.3, y0: 0.06, width: (e5) => R(0.024, 5e-3, e5), thick: 4e-3, curve: (e5) => Math.sin(e5 * Math.PI * 5) * 9e-3 * (1 - e5 * 0.6), stations: 22 }), U(`steel`, { color: `#8e959e`, wear: 0.25, pbr: Ov(0.024) }));
    let t2 = tv([[-0.03, 0], [0.045, 0], [0.035, 0.018], [-0.02, 0.022]], 0.012, { bevel: 2e-3 });
    t2.translate(0, 0.045, 0), e4.add(t2, U(`gold`));
    let n2 = V([[0, 0.045, 0], [4e-3, 0, 0], [0.012, -0.045, 0], [0.028, -0.07, 0]], (e5) => [0.013 * (1 + 0.25 * Math.sin(e5 * 9)), 0.011], 8, 12, { up: [0, 0, 1], capStart: true, capEnd: true });
    return e4.add(n2, U(`darkWood`)), { builder: e4, tip: [0, 0.36, 0], kind: `dagger`, aoDist: 0.03 };
  }, shortSword: () => {
    let e4 = new pv(), t2 = 0.6;
    return e4.add(hv({ length: t2, y0: 0.07, width: (e5) => 0.026 + Math.sin(e5 * Math.PI) * 6e-3 - z(0.8, 1, e5) * 0.026, thick: 5e-3, fuller: 0.6 }), U(`steel`, { pbr: Ov(0.03) })), Dv(e4, { grip0: -0.055, grip1: 0.06, gripR: 0.0125, guardW: 0.15, guardY: 0.064, pommelKind: `disc`, pommelR: 0.022 }), { builder: e4, tip: [0, 0.07 + t2, 0], kind: `blade` };
  }, scimitar: () => {
    let e4 = new pv(), t2 = 0.68;
    return e4.add(hv({ length: t2, y0: 0.07, width: (e5) => R(0.022, 0.034, z(0, 0.75, e5)) - z(0.82, 1, e5) * 0.034, thick: 55e-4, single: true, curve: (e5) => -0.13 * e5 * e5, stations: 18 }), U(`steel`, { color: `#b9bec4`, pbr: Ov(0.034) })), Dv(e4, { grip0: -0.055, grip1: 0.06, gripR: 0.012, guardW: 0.11, guardY: 0.064, guardDroop: 0.018, pommelKind: `fang`, pommelR: 0.012, gold: true }), { builder: e4, tip: [-0.13, 0.07 + t2, 0], kind: `blade` };
  }, broadSword: () => {
    let e4 = new pv(), t2 = 0.72;
    return e4.add(hv({ length: t2, y0: 0.075, width: (e5) => R(0.04, 0.031, e5) - z(0.86, 1, e5) * 0.031, thick: 65e-4, fuller: 0.72 }), U(`steel`, { pbr: Ov(0.04) })), Dv(e4, { grip0: -0.06, grip1: 0.065, gripR: 0.0135, guardW: 0.24, guardY: 0.07, pommelKind: `wheel`, pommelR: 0.026 }), { builder: e4, tip: [0, 0.075 + t2, 0], kind: `blade` };
  }, longSword: () => {
    let e4 = new pv(), t2 = 0.84;
    return e4.add(hv({ length: t2, y0: 0.08, width: (e5) => R(0.028, 0.019, e5) - z(0.84, 1, e5) * 0.019, thick: 55e-4, fuller: 0.78 }), U(`brightSteel`, { pbr: Ov(0.028) })), Dv(e4, { grip0: -0.1, grip1: 0.07, gripR: 0.0125, guardW: 0.23, guardY: 0.074, guardDroop: 0.012, pommelKind: `wheel`, pommelR: 0.024, wraps: 10 }), { builder: e4, tip: [0, 0.08 + t2, 0], kind: `blade` };
  }, greatSword: () => {
    let e4 = new pv(), t2 = 1.08;
    e4.add(hv({ length: t2, y0: 0.09, width: (e5) => (e5 < 0.08 ? 0.026 : R(0.036, 0.024, e5)) - z(0.86, 1, e5) * 0.024, thick: 7e-3, fuller: 0.68, stations: 18 }), U(`steel`, { pbr: Ov(0.036) })), Dv(e4, { grip0: -0.27, grip1: 0.075, gripR: 0.0145, guardW: 0.36, guardY: 0.082, guardDroop: 0.03, pommelKind: `wheel`, pommelR: 0.03, wraps: 14 });
    for (let t3 of [-1, 1]) e4.add(iv([t3 * 0.026, 0.17, 0], [t3, 0.35, 0], 9e-3, 0.03, 5), U(`darkSteel`));
    return { builder: e4, tip: [0, 0.09 + t2, 0], kind: `blade` };
  }, handAxe: () => {
    let e4 = new pv();
    return e4.add(yv(-0.13, 0.42, 0.0145, 0.013, 8, 10), U(`wood`)), e4.add(_v(-0.11, 0.02, 0.0155, 5), U(`leather`)), e4.add(xv([[-0.03, -0.03], [0.02, -0.025], [0.07, -0.055], [0.1, -0.05], [0.105, 0], [0.1, 0.045], [0.07, 0.04], [0.02, 0.025], [-0.03, 0.03], [-0.045, 0]], 0.026, 0.1).translate(0, 0.37, 0), U(`iron`, { wear: 0.35, pbr: (e5, t2) => t2[0] = e5.p.x > 0.085 ? 0.22 : t2[0] })), { builder: e4, tip: [0.105, 0.37, 0], kind: `axe` };
  }, axe: () => {
    let e4 = new pv();
    return e4.add(yv(-0.16, 0.68, 0.016, 0.0145, 8, 12), U(`wood`)), e4.add(_v(-0.14, 0.04, 0.0172, 6), U(`darkLeather`)), e4.add(bv(0.52, 0.0175, 0.016), U(`iron`)), e4.add(xv([[-0.035, -0.04], [0.03, -0.03], [0.085, -0.085], [0.135, -0.09], [0.15, -0.02], [0.148, 0.04], [0.13, 0.075], [0.085, 0.06], [0.03, 0.035], [-0.035, 0.04], [-0.055, 0]], 0.03, 0.15).translate(0, 0.6, 0), U(`steel`, { color: `#8d939b`, wear: 0.3, pbr: (e5, t2) => t2[0] = e5.p.x > 0.13 ? 0.2 : t2[0] })), { builder: e4, tip: [0.15, 0.6, 0], kind: `axe` };
  }, doubleAxe: () => {
    let e4 = new pv();
    e4.add(yv(-0.2, 0.84, 0.017, 0.015, 8, 12), U(`darkWood`)), e4.add(_v(-0.18, 0.06, 0.0185, 7), U(`leather`));
    let t2 = (e5) => xv([[0, -0.05], [0.06, -0.06], [0.12, -0.12], [0.155, -0.08], [0.165, 0], [0.155, 0.08], [0.12, 0.12], [0.06, 0.06], [0, 0.05]], 0.03, 0.165).scale(e5, 1, 1).translate(0, 0.72, 0), n2 = U(`steel`, { color: `#9aa1a9` });
    e4.add(t2(1), n2);
    let r2 = t2(-1);
    return e4.add(r2, n2), e4.add(bv(0.72, 0.03, 0.12, 10), U(`darkSteel`)), e4.add(iv([0, 0.78, 0], [0, 1, 0], 0.016, 0.09, 6), U(`darkSteel`)), { builder: e4, tip: [0, 0.87, 0], kind: `axe` };
  }, greatAxe: () => {
    let e4 = new pv();
    e4.add(yv(-0.36, 1.05, 0.019, 0.017, 8, 14), U(`darkWood`)), e4.add(_v(-0.34, 0.08, 0.0205, 10), U(`darkLeather`)), e4.add(bv(0.62, 0.021, 0.02), U(`iron`)), e4.add(bv(-0.355, 0.021, 0.02), U(`iron`));
    let t2 = [];
    for (let e5 = 0; e5 <= 12; e5 += 1) {
      let n2 = -1.15 + e5 / 12 * 2.3;
      t2.push([0.13 + Math.cos(n2) * 0.12, Math.sin(n2) * 0.17]);
    }
    return t2.push([0.08, 0.06], [0, 0.05], [-0.03, 0.035], [-0.03, -0.035], [0, -0.05], [0.08, -0.06]), e4.add(xv(t2, 0.034, 0.25).translate(0, 0.9, 0), U(`steel`, { color: `#8f969e`, wear: 0.35, pbr: (e5, t3) => t3[0] = e5.p.x > 0.22 ? 0.18 : t3[0] })), e4.add(iv([-0.03, 0.9, 0], [-1, 0.15, 0], 0.02, 0.11, 6), U(`darkSteel`)), e4.add(iv([0, 1.04, 0], [0, 1, 0], 0.015, 0.08, 6), U(`darkSteel`)), { builder: e4, tip: [0.25, 0.9, 0], kind: `axe` };
  }, club: () => {
    let e4 = new pv(), t2 = [];
    for (let e5 = 0; e5 <= 14; e5 += 1) {
      let n3 = e5 / 14, r2 = R(0.016, 0.045, z(0.15, 0.95, n3)) * (e5 === 14 ? 0.55 : 1);
      t2.push([r2, R(-0.12, 0.62, n3)]);
    }
    t2.push([0, 0.64]), t2.unshift([0, -0.125]);
    let n2 = X_(t2, 10);
    n2.noise(6e-3, 18, 4), n2.computeNormals(), e4.add(n2, U(`wood`, { color: `#5a3c24`, wear: 0.5 })), e4.add(_v(-0.11, 0.06, 0.018, 5), U(`leather`));
    for (let t3 = 0; t3 < 9; t3 += 1) {
      let n3 = t3 * 2.4, r2 = 0.36 + t3 % 3 * 0.08, i2 = R(0.016, 0.045, z(0.15, 0.95, (r2 + 0.12) / 0.74)) * 0.95;
      e4.add(iv([Math.sin(n3) * i2, r2, Math.cos(n3) * i2], [Math.sin(n3), 0.1, Math.cos(n3)], 7e-3, 0.012, 5), U(`iron`));
    }
    return { builder: e4, tip: [0, 0.62, 0], kind: `blunt` };
  }, mace: () => {
    let e4 = new pv();
    return e4.add(yv(-0.13, 0.5, 0.0125, 0.012, 8, 6), U(`darkSteel`)), e4.add(_v(-0.12, 0.05, 0.0145, 6), U(`darkLeather`)), e4.add(bv(0.075, 0.016, 0.02), U(`iron`)), e4.add(Sv(0.56, 0.055, 0.11, 7, 0.011), U(`steel`, { color: `#9da3ab`, wear: 0.3 })), e4.add(iv([0, 0.61, 0], [0, 1, 0], 0.012, 0.04, 6), U(`steel`)), e4.add(vv(-0.135, 0.016, `ball`), U(`iron`)), { builder: e4, tip: [0, 0.64, 0], kind: `blunt` };
  }, morningStar: () => {
    let e4 = new pv();
    return e4.add(yv(-0.14, 0.52, 0.0155, 0.016, 8, 8), U(`wood`)), e4.add(_v(-0.13, 0.05, 0.0172, 6), U(`leather`)), e4.add(bv(0.5, 0.019, 0.04), U(`iron`)), e4.add(Cv([0, 0.6, 0], 0.052, 14, 0.75, 2), U(`iron`, { wear: 0.5 })), { builder: e4, tip: [0, 0.68, 0], kind: `blunt` };
  }, flail: () => {
    let e4 = new pv();
    return e4.add(yv(-0.14, 0.32, 0.015, 0.0145, 8, 6), U(`darkWood`)), e4.add(_v(-0.13, 0.08, 0.0165, 6), U(`darkLeather`)), e4.add(bv(0.31, 0.018, 0.03), U(`iron`)), e4.add(av(0.012, 4e-3, 8, 5).rotateX(Math.PI / 2).translate(0, 0.345, 0), U(`iron`)), e4.add(wv([0, 0.355, 0], [0.12, 0.6, 0], 7, 0.016), U(`iron`)), e4.add(Cv([0.15, 0.65, 0], 0.045, 12, 0.7, 5), U(`darkSteel`, { wear: 0.45 })), { builder: e4, tip: [0.15, 0.65, 0], kind: `blunt` };
  }, wand: () => {
    let e4 = new pv(), t2 = yv(-0.11, 0.28, 9e-3, 5e-3, 8, 8, 4e-3);
    return e4.add(t2, U(`paleWood`)), e4.add(_v(-0.09, 0.04, 0.0105, 4), U(`redLeather`)), e4.add(bv(0.05, 0.0105, 0.01), U(`gold`)), e4.add(bv(0.2, 75e-4, 8e-3), U(`gold`)), e4.add(vv(-0.115, 0.011, `ball`), U(`gold`)), e4.add(Tv([0, 0.3, 0], 0.011, 0.045, 6), uv(`#7fb8ff`, 0.9)), { builder: e4, tip: [0, 0.32, 0], kind: `wand`, aoDist: 0.03 };
  }, boneWand: () => {
    let e4 = new pv(), t2 = X_([[0, -0.13], [0.016, -0.118], [0.014, -0.1], [9e-3, -0.06], [8e-3, 0.1], [95e-4, 0.22], [0.015, 0.25], [0.018, 0.275], [0.012, 0.29], [0, 0.295]], 9);
    t2.bulge([8e-3, 0.27, 0], 0.012, 5e-3).bulge([-8e-3, 0.27, 0], 0.012, 5e-3).computeNormals(), e4.add(t2, U(`bone`, { color: `#d9ccab` })), e4.add(_v(-0.08, 0.03, 0.0112, 4), U(`darkLeather`));
    for (let t3 = 0; t3 < 3; t3 += 1) e4.add(av(0.0105, 22e-4, 10, 4).translate(0, 0.05 + t3 * 0.012, 0), U(`darkLeather`));
    return { builder: e4, tip: [0, 0.3, 0], kind: `wand`, aoDist: 0.03 };
  }, graveWand: () => {
    let e4 = new pv();
    e4.add(yv(-0.12, 0.3, 95e-4, 7e-3, 8, 8, -6e-3), U(`black`, { color: `#1f1b1d`, rough: 0.45, metal: 0.4 })), e4.add(_v(-0.1, 0.03, 0.011, 4), U(`darkLeather`));
    let t2 = H(0.026, 0.028, 0.03, 10, 8);
    t2.translate(0, 0.335, 2e-3), t2.computeNormals();
    for (let e5 of [-1, 1]) t2.bulge([e5 * 0.01, 0.336, 0.028], 0.01, -6e-3);
    t2.bulge([0, 0.317, 0.026], [0.014, 8e-3, 0.01], 4e-3).computeNormals(), e4.add(t2, U(`oldBone`));
    for (let t3 of [-1, 1]) e4.add(H(5e-3, 5e-3, 4e-3, 6, 4).translate(t3 * 0.01, 0.336, 0.022), dv(`#6fff9a`, 3));
    for (let t3 = 0; t3 < 3; t3 += 1) {
      let n2 = t3 / 3 * c_;
      e4.add(iv([Math.sin(n2) * 8e-3, 0.3, Math.cos(n2) * 8e-3], [Math.sin(n2) * 0.6, 1, Math.cos(n2) * 0.6], 4e-3, 0.035, 4), U(`darkSteel`));
    }
    return { builder: e4, tip: [0, 0.36, 0], kind: `wand`, aoDist: 0.03 };
  }, shortStaff: () => {
    let e4 = new pv();
    return e4.add(yv(-0.62, 0.8, 0.018, 0.016, 8, 16, 0.01), U(`wood`, { color: `#6a4a2e` })), e4.add(_v(-0.08, 0.1, 0.0195, 6), U(`leather`)), e4.add(X_([[0.017, 0.78], [0.021, 0.8], [0.02, 0.86], [0.012, 0.89], [0, 0.9]], 8), U(`iron`)), e4.add(X_([[0, -0.66], [0.012, -0.65], [0.019, -0.61], [0.018, -0.58]], 8), U(`iron`)), { builder: e4, tip: [0, 0.9, 0], kind: `staff` };
  }, longStaff: () => {
    let e4 = new pv();
    e4.add(yv(-0.86, 0.86, 0.0175, 0.016, 8, 18), U(`darkWood`, { color: `#3a2618` })), e4.add(_v(-0.07, 0.11, 0.019, 7), U(`redLeather`));
    for (let t3 of [-0.62, -0.1, 0.13, 0.5, 0.82]) e4.add(bv(t3, 0.0195, 0.022), U(`gold`));
    e4.add(X_([[0, -0.9], [0.01, -0.895], [0.018, -0.87], [0.0195, -0.84]], 8), U(`gold`));
    let t2 = [];
    for (let e5 = 0; e5 <= 12; e5 += 1) {
      let n2 = -Math.PI * 0.85 + e5 / 12 * Math.PI * 1.7;
      t2.push([Math.sin(n2) * 0.075, 0.98 - Math.cos(n2) * 0.085, 0]);
    }
    e4.add(V(t2, (e5) => [85e-4 * (1 - Math.abs(e5 - 0.5) * 0.6), 0.011], 6, 20, { up: [0, 0, 1], capStart: true, capEnd: true }), U(`gold`)), e4.add(X_([[0.016, 0.86], [0.024, 0.88], [0.02, 0.9], [8e-3, 0.91]], 8), U(`gold`)), e4.add(Tv([0, 0.99, 0], 0.032, 0.12, 6, 1), uv(`#5fa8ff`, 1.4)), e4.add(H(0.014, 0.03, 0.014, 6, 5).translate(0, 0.99, 0), dv(`#bfe2ff`, 3.5));
    for (let t3 of [-1, 1]) e4.add(iv([t3 * 0.07, 1.05, 0], [t3 * 0.35, 1, 0], 6e-3, 0.04, 5), U(`gold`));
    return { builder: e4, tip: [0, 1.06, 0], kind: `staff` };
  }, gnarledStaff: () => {
    let e4 = new pv(), t2 = [];
    for (let e5 = 0; e5 <= 12; e5 += 1) {
      let n3 = e5 / 12;
      t2.push([Math.sin(n3 * 7.1) * 0.016 + o_(n3 * 3, 1, 1) * 0.02, R(-0.82, 0.82, n3), Math.cos(n3 * 5.3) * 0.012]);
    }
    let n2 = V(t2, (e5) => 0.0185 * (1 - e5 * 0.2) * (1 + 0.15 * Math.sin(e5 * 31)), 8, 30, { capStart: true, capEnd: true, twist: 6 });
    n2.noise(3e-3, 40, 9).computeNormals(), e4.add(n2, U(`darkWood`, { color: `#40301f`, wear: 0.6 }));
    for (let t3 = 0; t3 < 4; t3 += 1) {
      let n3 = t3 / 4 * c_ + 0.4, r2 = [[0, 0.8, 0], [Math.sin(n3) * 0.04, 0.86, Math.cos(n3) * 0.04], [Math.sin(n3) * 0.055, 0.93, Math.cos(n3) * 0.055], [Math.sin(n3) * 0.025, 0.99, Math.cos(n3) * 0.025]];
      e4.add(V(r2, (e5) => 9e-3 * (1 - e5 * 0.75), 5, 8, { capStart: true, capEnd: true }), U(`darkWood`, { color: `#3a2a1b` }));
    }
    return e4.add(H(0.04, 0.04, 0.04, 12, 8).translate(0, 0.92, 0), uv(`#5cff8a`, 1.6, { color: `#3fbf6a` })), e4.add(_v(-0.06, 0.1, 0.0205, 5), U(`cloth`, { color: `#4a3f30` })), e4.add(V([[0.02, 0.78, 0], [0.04, 0.7, 0.01], [0.045, 0.62, 0.012]], (e5) => [3e-3, 0.012 * Math.sin(Math.min(1, e5 * 1.2) * Math.PI)], 4, 6, { up: [0, 0, 1] }), U(`cloth`, { color: `#6a2a20`, detail: B.FUR })), { builder: e4, tip: [0, 0.96, 0], kind: `staff` };
  }, sorceryOrb: () => {
    let e4 = new pv();
    e4.add(yv(-0.06, 0.04, 0.011, 0.012, 8, 4), U(`darkWood`)), e4.add(bv(0.045, 0.016, 0.014), U(`gold`));
    for (let t2 = 0; t2 < 4; t2 += 1) {
      let n2 = t2 / 4 * c_, r2 = [[0, 0.05, 0], [Math.sin(n2) * 0.04, 0.075, Math.cos(n2) * 0.04], [Math.sin(n2) * 0.058, 0.12, Math.cos(n2) * 0.058], [Math.sin(n2) * 0.04, 0.16, Math.cos(n2) * 0.04]];
      e4.add(V(r2, (e5) => 55e-4 * (1 - e5 * 0.6), 5, 8, { capStart: true, capEnd: true }), U(`gold`));
    }
    return e4.add(H(0.056, 0.056, 0.056, 16, 12).translate(0, 0.118, 0), uv(`#7a5cff`, 0.55, { color: `#5a48c8` })), e4.add(H(0.026, 0.026, 0.026, 8, 6).translate(0, 0.118, 0), dv(`#d7c2ff`, 3)), { builder: e4, tip: [0, 0.12, 0], kind: `orb`, aoDist: 0.03 };
  }, bow: () => {
    let e4 = new pv(), t2 = (e5) => {
      let t3 = [];
      for (let n3 = 0; n3 <= 10; n3 += 1) {
        let r3 = n3 / 10, i2 = e5 * (0.07 + r3 * 0.66), a2 = 0.06 * Math.sin(r3 * Math.PI * 0.8) - 0.05 * z(0.75, 1, r3);
        t3.push([a2, i2, 0]);
      }
      return V(t3, (e6) => [0.016 * (1 - e6 * 0.55), 0.011 * (1 - e6 * 0.4)], 6, 14, { up: [0, 0, 1], capStart: true, capEnd: true });
    };
    e4.add(t2(1), U(`darkWood`, { color: `#4a2e1c` })), e4.add(t2(-1), U(`darkWood`, { color: `#4a2e1c` })), e4.add(_v(-0.075, 0.075, 0.017, 6), U(`leather`));
    for (let t3 of [-1, 1]) e4.add(bv(t3 * 0.08, 0.016, 0.012), U(`bronze`));
    let n2 = 0.73, r2 = 0.06 * Math.sin(Math.PI * 0.8) - 0.05;
    return e4.add(V([[r2, n2, 0], [-0.06, 0, 0], [r2, -n2, 0]], 18e-4, 4, 8, { linear: true }), U(`linen`, { color: `#cfc4a8` })), { builder: e4, tip: [0, 0.75, 0], kind: `bow` };
  } };
}));
function jv(e4, t2, n2, r2, i2) {
  let a2 = i2 * i2, o2 = a2 * i2;
  return 0.5 * (2 * t2 + (-e4 + n2) * i2 + (2 * e4 - 5 * t2 + 4 * n2 - r2) * a2 + (-e4 + 3 * t2 - 3 * n2 + r2) * o2);
}
function Mv(e4, t2) {
  let n2 = t2.th0 ?? 0, r2 = t2.th1 ?? c_, i2 = r2 - n2 >= c_ - 1e-4, a2 = i2 ? t2.nu : t2.nu + 1, o2 = [], s2 = new N();
  for (let i3 = 0; i3 <= t2.nv; i3 += 1) {
    let c3 = i3 / t2.nv, l2 = [];
    for (let i4 = 0; i4 < a2; i4 += 1) {
      let a3 = n2 + (r2 - n2) * i4 / t2.nu, o3 = t2.yBot(a3) + (t2.yTop(a3) - t2.yBot(a3)) * c3, u2 = e4.point(a3, o3, t2.off(a3, c3));
      t2.shape ? (s2.set(u2[0], u2[1], u2[2]), t2.shape(s2, a3, c3), l2.push([s2.x, s2.y, s2.z])) : l2.push(u2);
    }
    o2.push(l2);
  }
  let c2 = Y_(o2, { closed: i2 });
  for (let e5 = 0; e5 < c2.vcount; e5 += 1) ;
  return c2;
}
function Nv(e4, t2, n2, r2, i2, a2 = {}) {
  let o2 = a2.offset ?? 0, s2 = [], c2 = [[o2, -n2 / 2], [o2 + r2, -n2 / 2 + r2 * 0.4], [o2 + r2, n2 / 2 - r2 * 0.4], [o2, n2 / 2]];
  for (let [n3, r3] of c2) {
    let o3 = [];
    for (let s3 = 0; s3 < i2; s3 += 1) {
      let c3 = s3 / i2 * c_, l2 = t2 + r3 + (a2.tilt ? a2.tilt(c3) : 0);
      o3.push(e4.point(c3, l2, n3));
    }
    s2.push(o3);
  }
  return Y_(s2, { closed: true }).orientOutward();
}
function Pv(e4, t2, n2, r2) {
  return (i2) => [e4, t2, z(n2, r2, i2.p.y)];
}
function Fv(e4, t2, n2 = 0.5) {
  let r2 = t2.length;
  return (i2) => {
    let a2 = 0, o2 = 0, s2 = 1 / 0;
    for (let e5 = 0; e5 < r2; e5 += 1) {
      let n3 = t2[e5], c3 = e5 + 1 < r2 ? t2[e5 + 1] : [n3[0] + (n3[0] - t2[Math.max(0, e5 - 1)][0]), n3[1] + (n3[1] - t2[Math.max(0, e5 - 1)][1]), n3[2] + (n3[2] - t2[Math.max(0, e5 - 1)][2])], l3 = c3[0] - n3[0], u3 = c3[1] - n3[1], d2 = c3[2] - n3[2], f2 = l3 * l3 + u3 * u3 + d2 * d2 || 1e-9, p2 = l_(((i2.p.x - n3[0]) * l3 + (i2.p.y - n3[1]) * u3 + (i2.p.z - n3[2]) * d2) / f2, 0, 1), m2 = n3[0] + l3 * p2 - i2.p.x, h2 = n3[1] + u3 * p2 - i2.p.y, g2 = n3[2] + d2 * p2 - i2.p.z, _2 = m2 * m2 + h2 * h2 + g2 * g2;
      _2 < s2 && (s2 = _2, a2 = e5, o2 = p2);
    }
    let c2 = a2, l2 = Math.min(r2 - 1, a2 + 1), u2 = c2 === l2 ? 0 : z(1 - n2, 1, o2) * 0.5;
    if (o2 < n2 * 0.5 && a2 > 0) {
      let t3 = z(n2 * 0.5, 0, o2) * 0.5;
      return [e4[a2], e4[a2 - 1], t3];
    }
    return [e4[c2], e4[l2], u2];
  };
}
function Iv(e4, t2, n2, r2, i2, a2) {
  return (o2) => {
    let s2 = o2.p.y;
    return s2 >= i2 ? [e4, t2, z(r2, i2, s2)] : [t2, n2, z(i2, a2, s2)];
  };
}
var Lv, Rv, zv = t((() => {
  Ed(), lv(), __(), Lv = class {
    secs;
    constructor(e4) {
      this.secs = e4.map((e5) => ({ y: e5.y, rx: e5.rx, rzf: e5.rzf, rzb: e5.rzb ?? e5.rzf, cx: e5.cx ?? 0, cz: e5.cz ?? 0, p: e5.p ?? 2.2 })).sort((e5, t2) => e5.y - t2.y);
    }
    get yMin() {
      return this.secs[0].y;
    }
    get yMax() {
      return this.secs[this.secs.length - 1].y;
    }
    at(e4, t2) {
      let n2 = this.secs;
      if (e4 <= n2[0].y) return Object.assign(t2, n2[0], { y: e4 });
      if (e4 >= n2[n2.length - 1].y) return Object.assign(t2, n2[n2.length - 1], { y: e4 });
      let r2 = 0;
      for (; r2 < n2.length - 2 && e4 > n2[r2 + 1].y; ) r2 += 1;
      let i2 = n2[Math.max(0, r2 - 1)], a2 = n2[r2], o2 = n2[r2 + 1], s2 = n2[Math.min(n2.length - 1, r2 + 2)], c2 = (e4 - a2.y) / Math.max(1e-6, o2.y - a2.y);
      return t2.y = e4, t2.rx = jv(i2.rx, a2.rx, o2.rx, s2.rx, c2), t2.rzf = jv(i2.rzf, a2.rzf, o2.rzf, s2.rzf, c2), t2.rzb = jv(i2.rzb, a2.rzb, o2.rzb, s2.rzb, c2), t2.cx = jv(i2.cx, a2.cx, o2.cx, s2.cx, c2), t2.cz = jv(i2.cz, a2.cz, o2.cz, s2.cz, c2), t2.p = jv(i2.p, a2.p, o2.p, s2.p, c2), t2;
    }
    point(e4, t2, n2 = 0) {
      let r2 = this.at(t2, Rv), i2 = 2 / r2.p, a2 = Math.sin(e4), o2 = Math.cos(e4), s2 = o2 >= 0 ? r2.rzf : r2.rzb, c2 = Math.sign(a2) * Math.abs(a2) ** +i2 * (r2.rx + n2), l2 = Math.sign(o2) * Math.abs(o2) ** +i2 * (s2 + n2);
      return [r2.cx + c2, t2, r2.cz + l2];
    }
    loft(e4, t2, n2, r2, i2 = 0, a2 = {}) {
      let o2 = [];
      for (let a3 = 0; a3 <= r2; a3 += 1) {
        let s2 = e4 + (t2 - e4) * a3 / r2, c2 = [];
        for (let e5 = 0; e5 < n2; e5 += 1) c2.push(this.point(e5 / n2 * c_, s2, i2));
        o2.push(c2);
      }
      return Y_(o2, { closed: true, capStart: a2.capStart, capEnd: a2.capEnd });
    }
  }, Rv = { y: 0, rx: 0, rzf: 0, rzb: 0, cx: 0, cz: 0, p: 2 };
}));
function Bv(e4) {
  return rv(e4.nu ?? 20, e4.nv ?? 8, (t2, n2) => {
    let r2 = t2 * c_, i2 = ty(r2, e4), a2 = e4.barrel ? n2 : Math.sin(n2 * Math.PI / 2), o2 = R(i2, e4.top, a2), s2;
    return s2 = e4.barrel ? n2 > 0.92 ? Math.max(0, 1 - (n2 - 0.92) / 0.08) * 0.97 : 1 - Math.max(0, n2 - 0.75) * 0.12 : o2 > 0 ? Math.sqrt(Math.max(0, 1 - (o2 / e4.top) ** 2)) : 1 + (e4.flare ?? 0) * Math.min(1, -o2 / 0.1), [Math.sin(r2) * e4.rx * s2, e4.barrel && n2 > 0.92 ? e4.top : o2, Math.cos(r2) * e4.rz * s2];
  }, e4.thick, (e5) => new N(e5.x, e5.y * 0.5, e5.z).normalize(), { closedU: true });
}
function Vv(e4, t2 = 6e-3) {
  let n2 = new cv();
  for (let r2 of e4) n2.merge(H(t2, t2, t2, 5, 3).translate(r2[0], r2[1], r2[2]));
  return n2;
}
function Hv(e4, t2, n2, r2, i2) {
  let a2 = [];
  for (let o2 = 0; o2 <= r2; o2 += 1) {
    let s2 = o2 / r2 * c_;
    a2.push([Math.sin(s2) * e4, i2 ? i2(s2) : n2, Math.cos(s2) * t2]);
  }
  return a2;
}
function Uv(e4, t2, n2, r2, i2, a2 = 8) {
  let o2 = [];
  for (let s2 = 0; s2 <= a2; s2 += 1) {
    let c2 = R(n2, r2, s2 / a2);
    o2.push([Math.sin(c2) * e4, i2, Math.cos(c2) * t2]);
  }
  return o2;
}
function Wv(e4, t2 = -0.34, n2 = 0.014, r2 = 18, i2 = 8) {
  return rv(r2, i2, (n3, r3) => {
    let i3 = n3 * c_, a2 = R(t2, ay(i3), r3);
    return iy.point(i3, a2, e4);
  }, n2, (e5) => new N(e5.x, 0, e5.z).normalize(), { closedU: true });
}
function Gv(e4, t2 = 0.2, n2 = 0.07) {
  let r2 = new cv();
  for (let i2 of [1, -1]) r2.merge(rv(7, 2, (r3, a2) => {
    let o2 = r3 * c_, s2 = [i2 * 0.17, 0.12, 0], c2 = new N(i2 * 0.55, -0.83, 0).normalize(), l2 = new N(...s2).addScaledVector(c2, a2 * t2), u2 = n2 + e4 + a2 * 0.01, d2 = new N(0, 0, 1), f2 = new N().crossVectors(c2, d2).normalize();
    return [l2.x + f2.x * Math.cos(o2) * u2 + d2.x * Math.sin(o2) * u2, l2.y + f2.y * Math.cos(o2) * u2, l2.z + Math.sin(o2) * u2];
  }, 0.01, (e5) => new N(e5.x - i2 * 0.2, 0, e5.z).normalize(), { closedU: true }));
  return r2;
}
function Kv(e4, t2, n2) {
  let r2 = X_([[t2 * 1.02, -t2 * 0.35], [t2, 0], [t2 * 0.88, t2 * 0.3], [t2 * 0.55, t2 * 0.55], [0, t2 * 0.62]], 10, { sz: 0.95 });
  return r2.rotateZ(-e4 * 0.55).translate(e4 * 0.215, 0.165, 0), { geo: r2, role: n2 };
}
function qv(e4, t2, n2) {
  e4.add(V(Hv(0.172, n2, t2, 20), [8e-3, 0.024], 3, 20, { up: [0, 1, 0] }), U(`darkLeather`)), e4.add(X_([[0, -0.012], [0.016, -0.01], [0.018, 0.01], [0, 0.012]], 8, { sz: 0.4 }).rotateX(Math.PI / 2).translate(0, t2, n2 + 0.012), U(`iron`));
}
function Jv(e4) {
  let t2 = new pv(), n2 = i_(e4.length * 13), r2 = `#1a140e`;
  switch (e4) {
    case `armorQuilted`: {
      let e5 = rv(20, 10, (e6, t3) => {
        let n3 = e6 * c_, r3 = R(-0.37, ay(n3), t3), i2 = Math.round(e6 * 20), a2 = Math.round(t3 * 10), o2 = a2 % 2 == 1 && a2 < 9 ? i2 % 2 == 1 ? 8e-3 : 5e-3 : 0;
        return iy.point(n3, r3, 0.016 + o2);
      }, 0.02, (e6) => new N(e6.x, 0, e6.z).normalize(), { closedU: true });
      t2.add(e5, U(`linen`, { color: `#ae9c70`, colors: { 1: r2 } })), t2.add(Gv(0.02, 0.17, 0.068), U(`linen`, { color: `#9e8c62`, colors: { 1: r2 } })), t2.add(V(Hv(0.164, 0.122, -0.3, 24), [6e-3, 0.02], 3, 26, { up: [0, 1, 0] }), U(`darkLeather`));
      break;
    }
    case `armorLeather`:
    case `armorStudded`: {
      let i2 = e4 === `armorStudded`;
      t2.add(Wv(0.016, -0.34, 0.014, 16, 7), U(i2 ? `darkLeather` : `leather`, { colors: { 1: r2 }, paint: (e5, t3) => {
        let n3 = Math.atan2(e5.p.x, e5.p.z);
        Math.abs(Math.sin(n3 * 3)) < 0.05 && t3.multiplyScalar(0.6), Math.abs(e5.p.y + 0.12) < 6e-3 && t3.multiplyScalar(0.65);
      } }));
      for (let e5 = 0; e5 < 6; e5 += 1) {
        let n3 = -0.24 + e5 * 0.07, r3 = iy.point(0.07, n3, 0.034), i3 = iy.point(-0.07, n3 + 0.035, 0.034);
        t2.add(V([r3, i3], 25e-4, 3, 2, { linear: true }), U(`darkLeather`));
      }
      if (t2.add(Kv(1, 0.08, `leather`).geo, U(`leather`)), t2.add(Kv(-1, 0.08, `leather`).geo, U(`leather`)), i2) {
        let e5 = new cv();
        for (let t3 = 0; t3 < 36; t3 += 1) {
          let r3 = t3 / 36 * c_ * 3 + n2() * 0.2, i3 = R(-0.28, 0.12, t3 * 7 % 36 / 36);
          if (Math.abs(Math.sin(r3)) > 0.92) continue;
          let a2 = iy.point(r3, i3, 0.034);
          e5.merge(H(9e-3, 9e-3, 5e-3, 5, 2).rotateY(r3).translate(a2[0], a2[1], a2[2]));
        }
        t2.add(e5, U(`steel`, { rough: 0.3 }));
      }
      t2.add(V(Hv(0.168, 0.13, -0.3, 24), [8e-3, 0.022], 3, 26, { up: [0, 1, 0] }), U(`darkLeather`));
      break;
    }
    case `armorScale`: {
      t2.add(Wv(0.015, -0.42, 0.012, 14, 6), { color: `#6a5c3e`, colors: { 1: r2 }, rough: 0.5, metal: 0.85, detail: B.METAL, wear: 0.5 }), t2.add(Gv(0.012, 0.2, 0.066), { ...oy, colors: { 1: r2 } });
      let e5 = new cv();
      for (let t3 = 0; t3 < 6; t3 += 1) {
        let n3 = 0.11 - t3 * 0.072;
        for (let r3 = 0; r3 < 7; r3 += 1) {
          let i2 = (r3 + t3 % 2 * 0.5) / 7 * Math.PI * 1.1 - Math.PI * 0.55, a2 = iy.point(i2, n3, 0.03), o2 = tv([[-0.028, 0.022], [0.028, 0.022], [0.026, -0.014], [0, -0.034], [-0.026, -0.014]], 4e-3, { crease: 50 });
          o2.rotateX(-0.15).rotateY(i2).translate(a2[0], a2[1], a2[2]), e5.merge(o2);
        }
      }
      t2.add(e5, U(`bronze`, { color: `#a08048`, wear: 0.4 })), qv(t2, -0.33, 0.13);
      break;
    }
    case `armorRing`:
      t2.add(Wv(0.012, -0.4, 0.01, 16, 7), { ...oy, color: `#6c7076`, colors: { 1: r2 }, wear: 0.55 }), t2.add(Gv(0.01, 0.2, 0.066), { ...oy, color: `#6c7076`, colors: { 1: r2 }, wear: 0.55 });
      for (let e5 of [1, -1]) {
        let n3 = rv(7, 6, (t3, n4) => {
          let r3 = e5 * R(0.1 + n4 * n4 * 0.4, Math.PI * 0.985, t3), i2 = R(-0.31, ay(r3) - 4e-3, n4);
          return iy.point(r3, i2, 0.034);
        }, 0.012, (e6) => new N(e6.x, 0, e6.z).normalize());
        t2.add(n3, U(`leather`, { color: `#6a4628`, colors: { 1: r2, 2: `#3a2416` } }));
      }
      for (let e5 = 0; e5 < 4; e5 += 1) {
        let n3 = -0.2 + e5 * 0.075, r3 = 0.1 + ((n3 + 0.31) / 0.5) ** 2 * 0.4;
        t2.add(V([iy.point(r3, n3, 0.045), iy.point(0, n3 + 0.02, 0.05), iy.point(-r3, n3 + 0.04, 0.045)], 3e-3, 3, 6), U(`darkLeather`));
      }
      qv(t2, -0.3, 0.13);
      break;
    case `armorChain`: {
      t2.add(Wv(0.015, -0.47, 0.012, 18, 9), { ...oy, color: `#a0a6ae`, colors: { 1: r2 } }), t2.add(Gv(0.012, 0.25, 0.066), { ...oy, color: `#a0a6ae`, colors: { 1: r2 } });
      let e5 = av(0.088, 0.024, 18, 6, 0.032);
      e5.scale(1, 1, 0.82).translate(0, 0.228, -6e-3), t2.add(e5, { ...oy, color: `#a0a6ae` }), qv(t2, -0.24, 0.145);
      break;
    }
    case `armorBreast`:
    case `armorSplint`:
    case `armorPlate`: {
      let n3 = e4 === `armorPlate`;
      if (e4 === `armorSplint`) {
        t2.add(Wv(0.014), U(`darkLeather`, { colors: { 1: r2 } }));
        let e5 = new cv();
        for (let t3 = 0; t3 < 14; t3 += 1) {
          let n4 = t3 / 14 * c_;
          if (Math.abs(Math.sin(n4)) > 0.95) continue;
          let r3 = [];
          for (let e6 = 0; e6 <= 4; e6 += 1) r3.push(iy.point(n4, R(-0.3, Math.min(0.12, ay(n4) - 0.04), e6 / 4), 0.032));
          e5.merge(V(r3, [6e-3, 0.028], 3, 5, { up: [0, 0, 1], capStart: true, capEnd: true }));
        }
        t2.add(e5, U(`steel`, { color: `#7d838b`, wear: 0.4 }));
      } else t2.add(Wv(0.02, n3 ? -0.3 : -0.22, 0.012), U(n3 ? `brightSteel` : `steel`, { colors: { 1: r2 }, paint: (e5, t3) => {
        let r3 = Math.atan2(e5.p.x, e5.p.z);
        n3 && e5.tag !== 1 && e5.p.y > ay(r3) - 0.02 && t3.set(`#d8a446`);
      } })), t2.add(V([iy.point(0, -0.2, 0.034), iy.point(0, 0, 0.038), iy.point(0, 0.15, 0.03)], [8e-3, 6e-3], 3, 8), U(n3 ? `brightSteel` : `steel`)), n3 || t2.add(Wv(0.012, -0.36, 0.01, 16, 3).deform((e5) => e5.y = Math.min(e5.y, -0.2)), U(`darkLeather`));
      let i2 = n3 ? 0.1 : 0.085;
      for (let e5 of [1, -1]) {
        let r3 = Kv(e5, i2, n3 ? `brightSteel` : `steel`);
        if (t2.add(r3.geo, U(r3.role)), n3) {
          let n4 = Kv(e5, i2 * 0.82, `brightSteel`);
          n4.geo.translate(e5 * 0.02, -0.05, 0), t2.add(n4.geo, U(`brightSteel`)), t2.add(V(Hv(i2 * 1, i2 * 0.95, 0, 12).map((t3) => [t3[0] + e5 * 0.215, t3[1] + 0.165 - 0.035, t3[2]]), 4e-3, 3, 12), U(`gold`));
        }
      }
      if (n3) {
        for (let e5 = 0; e5 < 3; e5 += 1) {
          let n4 = rv(10, 1, (t3, n5) => {
            let r3 = R(-1.4, 1.4, t3);
            return iy.point(r3, -0.3 - e5 * 0.045 - n5 * 0.04, 0.03 + e5 * 6e-3);
          }, 8e-3, (e6) => new N(e6.x, 0, e6.z).normalize());
          t2.add(n4, U(`brightSteel`, { colors: { 1: r2 } }));
        }
        t2.add(X_([[0, -0.015], [0.02, -0.012], [0.022, 0.012], [0, 0.015]], 8, { sz: 0.35 }).rotateX(Math.PI / 2).translate(0, 0.02, 0.15), uv(`#c8202a`, 0.6));
      }
      break;
    }
    default:
      break;
  }
  return { builder: t2, tip: [0, 0.25, 0], kind: `misc`, aoDist: 0.08 };
}
function Yv(e4, t2, n2, r2 = {}) {
  let i2 = new pv(), a2 = [];
  for (let n3 = 0; n3 <= 8; n3 += 1) {
    let r3 = n3 / 8;
    a2.push([e4 * r3, 0.02 + t2 * (1 - r3 * r3)]);
  }
  a2.push([e4, 6e-3]);
  let o2 = X_(a2.reverse(), 20);
  o2.rotateX(Math.PI / 2);
  let s2 = r2.paint ? new P(r2.paint) : null;
  i2.add(o2, U(n2 === `wood` ? `wood` : n2, { paint: (t3, r3) => {
    if (n2 === `wood` && Math.abs(Math.sin(t3.p.x * 36)) < 0.07 && r3.multiplyScalar(0.55), s2) {
      let n3 = Math.atan2(t3.p.y, t3.p.x);
      Math.sin(n3 * 2) > 0 && Math.hypot(t3.p.x, t3.p.y) > e4 * 0.35 && r3.lerp(s2, 0.8);
    }
  } }));
  let c2 = X_([[0, 0], [e4 * 0.98, 0], [e4, 6e-3]], 20);
  if (c2.rotateX(Math.PI / 2), i2.add(c2, U(`darkWood`)), r2.rim !== false) {
    let t3 = av(e4, 0.011, 24, 4, 0.016);
    t3.rotateX(Math.PI / 2).translate(0, 0, 0.012), i2.add(t3, U(n2 === `wood` ? `iron` : `darkSteel`));
  }
  if (r2.boss !== false) {
    let n3 = X_([[e4 * 0.25, 0.02 + t2 - 4e-3], [e4 * 0.22, 0.02 + t2 + 0.015], [e4 * 0.12, 0.02 + t2 + 0.04], [0, 0.02 + t2 + 0.045]], 12);
    n3.rotateX(Math.PI / 2), i2.add(n3, U(`steel`));
  }
  if (r2.spikes) {
    for (let n3 = 0; n3 < r2.spikes; n3 += 1) {
      let a3 = n3 / r2.spikes * c_;
      i2.add(iv([Math.cos(a3) * e4 * 0.62, Math.sin(a3) * e4 * 0.62, 0.02 + t2 * 0.6], [Math.cos(a3) * 0.3, Math.sin(a3) * 0.3, 1], 0.014, 0.07, 5), U(`darkSteel`));
    }
    i2.add(iv([0, 0, 0.02 + t2 + 0.04], [0, 0, 1], 0.022, 0.11, 6), U(`steel`));
  }
  return i2.add(V([[0, -0.06, -4e-3], [0, 0, -0.03], [0, 0.06, -4e-3]], 8e-3, 5, 6), U(`darkLeather`)), i2;
}
function Xv(e4, t2, n2, r2 = `iron`) {
  let i2 = new pv(), a2 = tv(e4, 0.018, { bevel: 6e-3, bevelSegs: 2, crease: 50 });
  a2.deform((e5) => {
    e5.z += t2 * (1 - Math.min(1, e5.x * e5.x / 0.04));
  }), a2.computeNormals(), i2.add(a2, n2);
  let o2 = e4.map(([e5, n3]) => [e5 * 1, n3 * 1, 0.012 + t2 * (1 - Math.min(1, e5 * e5 / 0.04))]);
  return o2.push(o2[0]), i2.add(V(o2, [0.01, 8e-3], 4, o2.length * 3, { linear: true }), U(r2)), i2.add(V([[0, -0.07, -6e-3], [0, 0, -0.032], [0, 0.07, -6e-3]], 8e-3, 5, 6), U(`darkLeather`)), i2;
}
function Zv(e4, t2, n2, r2, i2 = 8, a2 = 4e-3) {
  let o2 = t2[0] - e4[0], s2 = t2[1] - e4[1], c2 = Math.hypot(o2, s2), l2 = -s2 / c2, u2 = o2 / c2;
  return rv(i2, 1, (i3, o3) => {
    let s3 = R(e4[0], t2[0], i3) + l2 * (o3 - 0.5) * n2;
    return [s3, R(e4[1], t2[1], i3) + u2 * (o3 - 0.5) * n2, r2(s3) + a2 * 0.5];
  }, a2, () => new N(0, 0, 1));
}
function Qv(e4, t2) {
  let n2 = [], r2 = t2 === `heavyGloves` ? 0.05 : t2 === `gauntlets` ? 0.052 : 0.042, i2 = t2 === `gauntlets` ? `brightSteel` : t2 === `heavyGloves` ? `darkLeather` : `leather`, a2 = H(0.048, 0.055, 0.02, 10, 6);
  a2.translate(0, 0.07, 0), n2.push([a2, t2 === `chainGloves` ? `chain` : i2]);
  for (let r3 = 0; r3 < 4; r3 += 1) {
    let a3 = R(-0.033, 0.033, r3 / 3) * e4, o3 = [0.07, 0.085, 0.08, 0.06][r3], s2 = [[a3, 0.11, 0], [a3 * 1.05, 0.11 + o3 * 0.5, 8e-3], [a3 * 1.08, 0.11 + o3, 0.018]];
    n2.push([V(s2, (e5) => [0.0105 * (1 - e5 * 0.2), 95e-4], 6, 5, { capStart: true, capEnd: true }), t2 === `gauntlets` ? `steel` : t2 === `chainGloves` ? `chain` : i2]);
  }
  n2.push([V([[e4 * -0.045, 0.06, 5e-3], [e4 * -0.07, 0.1, 0.02], [e4 * -0.08, 0.13, 0.03]], (e5) => 0.012 * (1 - e5 * 0.2), 6, 4, { capStart: true, capEnd: true }), t2 === `gauntlets` ? `steel` : i2]);
  let o2 = X_([[r2 * 1.12, -0.07], [r2, -0.01], [r2 * 0.85, 0.035]], 12, { sz: 0.6 });
  if (n2.push([o2, t2 === `chainGloves` ? `leather` : t2 === `gauntlets` ? `brightSteel` : i2]), t2 === `gauntlets`) for (let e5 = 0; e5 < 3; e5 += 1) {
    let t3 = H(0.05, 0.016, 0.026, 8, 4);
    t3.translate(0, 0.045 + e5 * 0.026, 8e-3), n2.push([t3, `steel`]);
  }
  return { parts: n2 };
}
function $v(e4, t2) {
  let n2 = [], r2 = t2 === `leatherBoots` ? 0.24 : t2 === `greaves` ? 0.3 : 0.28, i2 = rv(10, 8, (t3, n3) => {
    let r3 = t3 * c_, i3 = R(-0.06, 0.2, n3), a3 = 0.045 * (0.75 + 0.3 * Math.sin(Math.min(1, n3 * 1.2) * Math.PI * 0.5)) * (n3 > 0.85 ? Math.sqrt((1 - n3) / 0.15) * 0.8 + 0.2 : 1), o3 = R(0.1, 0.045, z(0.2, 0.7, n3)) * (n3 > 0.9 ? 0.6 : 1), s2 = Math.cos(r3), c2 = Math.sign(s2) * Math.abs(s2) ** (s2 >= 0 ? 0.9 : 0.3);
    return [e4 * 0 + Math.sin(r3) * a3, o3 * 0.5 + c2 * o3 * 0.5, i3];
  }, 4e-3, (e5) => new N(e5.x, e5.y - 0.04, 0).normalize(), { closedU: true }), a2 = t2 === `greaves` || t2 === `chainBoots` || t2 === `heavyBoots` ? `darkLeather` : `leather`;
  n2.push([i2, a2]);
  let o2 = X_([[0.046, 0.06], [0.044, 0.12], [0.05, r2 - 0.02], [0.056, r2]], 12, { sz: 1.1, capStart: false, capEnd: false });
  if (n2.push([o2, t2 === `chainBoots` ? `chain` : a2]), t2 === `heavyBoots`) {
    let e5 = X_([[0.056, r2 - 0.05], [0.066, r2 - 0.03], [0.064, r2 + 5e-3]], 12, { sz: 1.1 });
    n2.push([e5, `fur`]), n2.push([av(0.05, 5e-3, 12, 4).translate(0, 0.14, 0), `iron`]);
  }
  if (t2 === `greaves`) {
    let e5 = X_([[0.052, 0.1], [0.06, 0.2], [0.056, r2 + 0.02]], 10, { sz: 1.15, phi0: -1.3, phiLen: 2.6, capStart: false, capEnd: false });
    n2.push([e5, `brightSteel`]);
    let t3 = H(0.045, 0.04, 0.03, 8, 5);
    t3.translate(0, r2 + 0.03, 0.04), n2.push([t3, `brightSteel`]);
    for (let e6 = 0; e6 < 3; e6 += 1) {
      let t4 = H(0.05, 0.016, 0.05, 8, 4);
      t4.translate(0, 0.05 + 2e-3 * e6, 0.08 + e6 * 0.035), n2.push([t4, `brightSteel`]);
    }
  }
  return t2 === `chainBoots` && n2.push([av(0.05, 4e-3, 12, 4).translate(0, 0.07, 0), `iron`]), n2;
}
function ey(e4, t2, n2 = 16) {
  return rv(n2, 2, (t3, n3) => {
    let r2 = R(-1.2, 1.2, t3);
    return [Math.sin(r2) * 0.17, R(-e4 / 2, e4 / 2, n3), Math.cos(r2) * 0.12 - 0.12];
  }, t2, (e5) => new N(e5.x, 0, e5.z + 0.12).normalize());
}
var ty, ny, ry, iy, ay, oy, sy = t((() => {
  Ed(), U_(), zv(), lv(), __(), mv(), ty = (e4, t2) => {
    let n2 = Math.abs(((e4 + Math.PI) % c_ + c_) % c_ - Math.PI);
    return n2 < Math.PI / 2 ? R(t2.frontY, t2.sideY, z(0, Math.PI / 2, n2)) : R(t2.sideY, t2.backY, z(Math.PI / 2, Math.PI, n2));
  }, ny = { color: `#050404`, rough: 0.95, metal: 0, detail: B.METAL, wear: 0, ao: 0 }, ry = { cap: () => {
    let e4 = new pv(), t2 = { rx: 0.09, rz: 0.108, top: 0.125, frontY: 0.035, sideY: 0, backY: -0.035, thick: 8e-3, nu: 18, nv: 7 };
    e4.add(Bv(t2), U(`leather`, { color: `#6a4529`, colors: { 1: `#2a1a10` } }));
    for (let n3 = 0; n3 < 4; n3 += 1) {
      let r2 = n3 / 4 * c_ + Math.PI / 4, i2 = ty(r2, t2) + 8e-3, a2 = [];
      for (let e5 = 0; e5 <= 6; e5 += 1) {
        let n4 = R(i2, t2.top, Math.sin(e5 / 6 * Math.PI / 2) * 0.97), o2 = n4 > 0 ? Math.sqrt(Math.max(0, 1 - (n4 / t2.top) ** 2)) : 1;
        a2.push([Math.sin(r2) * (t2.rx * o2 + 4e-3), n4, Math.cos(r2) * (t2.rz * o2 + 4e-3)]);
      }
      e4.add(V(a2, [22e-4, 35e-4], 4, 10, { up: [Math.sin(r2), 0, Math.cos(r2)] }), U(`darkLeather`));
    }
    e4.add(H(0.012, 7e-3, 0.012, 8, 4).translate(0, t2.top + 2e-3, 0), U(`darkLeather`));
    let n2 = V(Hv(0.094, 0.112, 0, 24, (e5) => ty(e5, t2) + 8e-3), [0.011, 8e-3], 5, 26, { up: [0, 1, 0] });
    return e4.add(n2, U(`darkLeather`, { color: `#4a2e1a` })), { builder: e4, tip: [0, 0.13, 0], kind: `helm`, aoDist: 0.04 };
  }, skullCap: () => {
    let e4 = new pv(), t2 = { rx: 0.092, rz: 0.11, top: 0.13, frontY: 0.03, sideY: 5e-3, backY: -0.025, thick: 7e-3, nu: 18, nv: 7 };
    e4.add(Bv(t2), U(`iron`, { colors: { 1: `#2a2420` } })), e4.add(V(Hv(0.095, 0.113, 0, 24, (e5) => ty(e5, t2) + 0.012), [8e-3, 0.016], 4, 26, { up: [0, 1, 0] }), U(`darkSteel`));
    let n2 = [];
    for (let e5 = 0; e5 <= 10; e5 += 1) {
      let t3 = R(-1.4, 1.5, e5 / 10);
      n2.push([0, Math.cos(t3) * 0.134, Math.sin(t3) * 0.113]);
    }
    return e4.add(V(n2, [0.012, 6e-3], 4, 14, { up: [1, 0, 0] }), U(`darkSteel`)), e4.add(Vv(Hv(0.104, 0.122, 0, 10, (e5) => ty(e5, t2) + 0.012).slice(0, 10), 55e-4), U(`bronze`)), { builder: e4, tip: [0, 0.14, 0], kind: `helm`, aoDist: 0.04 };
  }, helm: () => {
    let e4 = new pv(), t2 = { rx: 0.093, rz: 0.112, top: 0.14, frontY: 0.025, sideY: -0.03, backY: -0.05, thick: 8e-3, nu: 20, nv: 8 };
    e4.add(Bv(t2), U(`steel`, { color: `#8e959c`, colors: { 1: `#2a2420` }, wear: 0.35 })), e4.add(V(Hv(0.097, 0.116, 0, 26, (e5) => ty(e5, t2) + 0.014), [7e-3, 0.016], 4, 28, { up: [0, 1, 0] }), U(`darkSteel`)), e4.add(V([[0, 0.05, 0.118], [0, 0, 0.12], [0, -0.055, 0.112]], (e5) => [0.012 * (1 - e5 * 0.3), 5e-3], 4, 6, { up: [0, 0, 1], capStart: true, capEnd: true }), U(`darkSteel`));
    for (let t3 of [1, -1]) {
      let n2 = tv([[-0.03, 0], [0.04, 0], [0.035, -0.09], [0, -0.11], [-0.03, -0.07]], 7e-3, { bevel: 2e-3 });
      n2.rotateY(t3 * 1.25).translate(t3 * 0.09, -0.01, 0.045), e4.add(n2, U(`steel`, { color: `#7e858c`, wear: 0.4 }));
    }
    return e4.add(Vv(Hv(0.104, 0.124, 0, 12, (e5) => ty(e5, t2) + 0.014).slice(0, 12), 5e-3), U(`bronze`)), { builder: e4, tip: [0, 0.15, 0], kind: `helm`, aoDist: 0.04 };
  }, fullHelm: () => {
    let e4 = new pv(), t2 = { rx: 0.096, rz: 0.115, top: 0.14, frontY: -0.1, sideY: -0.09, backY: -0.08, thick: 8e-3, nu: 20, nv: 9, flare: 0.08 };
    e4.add(Bv(t2), U(`steel`, { color: `#9aa0a6`, colors: { 1: `#1a1614` }, wear: 0.3 })), e4.add(V(Uv(t2.rx + 35e-4, t2.rz + 35e-4, -0.62, -0.05, 0), [42e-4, 22e-4], 4, 8, { up: [0, 1, 0], capStart: true, capEnd: true }), ny), e4.add(V(Uv(t2.rx + 35e-4, t2.rz + 35e-4, 0.05, 0.62, 0), [42e-4, 22e-4], 4, 8, { up: [0, 1, 0], capStart: true, capEnd: true }), ny);
    let n2 = new cv();
    for (let e5 of [1, -1]) for (let r2 = 0; r2 < 4; r2 += 1) {
      let i2 = -0.03 - r2 * 0.017, a2 = 1 + 0.08 * Math.min(1, -i2 / 0.1), o2 = e5 * (0.22 + r2 % 2 * 0.06);
      n2.merge(H(32e-4, 32e-4, 18e-4, 6, 3).rotateY(o2).translate(Math.sin(o2) * (t2.rx * a2 + 4e-3), i2, Math.cos(o2) * (t2.rz * a2 + 4e-3)));
    }
    return e4.add(n2, ny), e4.add(V([[0, 0.14, 0.02], [0, 0.11, 0.08], [0, 0.03, 0.12], [0, -0.06, 0.125]], [8e-3, 0.012], 4, 10, { up: [1, 0, 0] }), U(`brightSteel`)), e4.add(V(Hv(0.1, 0.12, 0, 26, (e5) => ty(e5, t2) + 0.012), [8e-3, 0.014], 4, 28, { up: [0, 1, 0] }), U(`darkSteel`)), { builder: e4, tip: [0, 0.15, 0], kind: `helm`, aoDist: 0.04 };
  }, greatHelm: () => {
    let e4 = new pv(), t2 = { rx: 0.1, rz: 0.118, top: 0.15, frontY: -0.13, sideY: -0.13, backY: -0.12, thick: 9e-3, nu: 18, nv: 9, barrel: true };
    e4.add(Bv(t2), U(`steel`, { color: `#a2a8ae`, colors: { 1: `#14100e` }, wear: 0.3 })), e4.add(V(Uv(t2.rx + 4e-3, t2.rz + 4e-3, -0.8, -0.06, 0), [45e-4, 22e-4], 4, 8, { up: [0, 1, 0], capStart: true, capEnd: true }), ny), e4.add(V(Uv(t2.rx + 4e-3, t2.rz + 4e-3, 0.06, 0.8, 0), [45e-4, 22e-4], 4, 8, { up: [0, 1, 0], capStart: true, capEnd: true }), ny);
    let n2 = new cv();
    for (let e5 = 0; e5 < 2; e5 += 1) for (let r2 = 0; r2 < 3; r2 += 1) {
      let i2 = 0.32 + r2 * 0.13, a2 = -0.04 - e5 * 0.024;
      n2.merge(H(36e-4, 36e-4, 18e-4, 5, 2).rotateY(i2).translate(Math.sin(i2) * (t2.rx + 45e-4), a2, Math.cos(i2) * (t2.rz + 45e-4)));
    }
    return e4.add(n2, ny), e4.add(V([[0, 0.15, 0.06], [0, 0.1, 0.12], [0, 0.03, 0.123], [0, -0.1, 0.123]], [6e-3, 0.012], 4, 12, { up: [1, 0, 0] }), U(`gold`)), e4.add(V(Hv(0.104, 0.122, 0.055, 22), [6e-3, 0.01], 4, 22, { up: [0, 1, 0] }), U(`gold`)), e4.add(V(Hv(0.104, 0.122, -0.12, 22), [7e-3, 0.012], 4, 22, { up: [0, 1, 0] }), U(`darkSteel`)), { builder: e4, tip: [0, 0.16, 0], kind: `helm`, aoDist: 0.04 };
  }, mask: () => {
    let e4 = new pv(), t2 = 0.108, n2 = (e5, n3) => {
      let r3 = 1 - (Math.abs(n3 + 0.01) / 0.13) ** 2 * 0.32, i3 = n3 < -0.06 ? (n3 + 0.06) * 0.25 : 0;
      return [Math.sin(e5) * t2 * r3, n3, Math.cos(e5) * t2 * r3 - 0.012 - i3];
    }, r2 = rv(12, 10, (e5, t3) => n2(R(-1.2, 1.2, e5) * (1 - 0.18 * t3 ** 3), R(0.09, -0.12, t3)), 0.01, (e5) => new N(e5.x, 0, e5.z).normalize());
    r2.grab([0, 0.032, 0.1], [0.07, 0.02, 0.04], [0, 4e-3, 0.012]), r2.grab([0, -0.015, 0.1], [0.014, 0.04, 0.04], [0, 0, 0.02]);
    for (let e5 of [1, -1]) r2.grab([e5 * 0.05, -0.045, 0.085], [0.025, 0.03, 0.04], [0, 0, -8e-3]);
    r2.computeNormals(), e4.add(r2, U(`darkWood`, { color: `#5e3c22`, colors: { 1: `#24160c` }, wear: 0.5 }));
    let i2 = { color: `#040302`, rough: 0.95, metal: 0, detail: B.WOOD, wear: 0, ao: 0 };
    for (let t3 of [1, -1]) {
      let r3 = H(0.019, 9e-3, 6e-3, 8, 4);
      r3.rotateZ(t3 * -0.32).rotateY(t3 * 0.38);
      let a3 = n2(t3 * 0.36, 0.012);
      r3.translate(a3[0], a3[1], a3[2] + 3e-3), e4.add(r3, i2);
    }
    let a2 = [];
    for (let e5 = 0; e5 <= 8; e5 += 1) {
      let t3 = R(-0.42, 0.42, e5 / 8), r3 = n2(t3, -0.066 + (Math.abs(t3) / 0.42) ** 2 * 0.014);
      a2.push([r3[0], r3[1], r3[2] + 4e-3]);
    }
    e4.add(V(a2, [6e-3, 3e-3], 4, 12, { up: [0, 1, 0], capStart: true, capEnd: true }), i2);
    for (let [t3, r3] of [[-0.3, -1], [-0.1, -1], [0.1, -1], [0.3, -1], [-0.2, 1], [0.2, 1]]) {
      let i3 = n2(t3, -0.066 - r3 * 9e-3);
      e4.add(iv([i3[0], i3[1], i3[2] + 4e-3], [0, r3, 0.25], 42e-4, 0.012, 4), U(`bone`, { color: `#e6dcc0` }));
    }
    let o2 = { color: `#a21c12`, rough: 0.8, metal: 0, detail: B.CLOTH, wear: 0.2 };
    for (let t3 of [-0.16, 0, 0.16]) {
      let r3 = [];
      for (let e5 = 0; e5 <= 4; e5 += 1) {
        let i3 = n2(t3, R(0.085, 0.045, e5 / 4));
        r3.push([i3[0], i3[1], i3[2] + 68e-4 + (t3 === 0 ? 4e-3 : 0)]);
      }
      e4.add(V(r3, [45e-4, 12e-4], 4, 4, { up: [0, 0, 1], capStart: true, capEnd: true }), o2);
    }
    for (let t3 of [1, -1]) {
      let r3 = [];
      for (let e5 = 0; e5 <= 4; e5 += 1) {
        let i3 = e5 / 4, a3 = n2(t3 * R(0.3, 0.75, i3), R(-0.012, -0.05, i3));
        r3.push([a3[0] * 1.06, a3[1], a3[2] * 1.06]);
      }
      e4.add(V(r3, [12e-4, 5e-3], 4, 6, { up: [Math.sin(t3 * 0.5), 0, Math.cos(t3 * 0.5)], capStart: true, capEnd: true }), o2), e4.add(V([[t3 * 0.05, 0.075, 0.075], [t3 * 0.085, 0.13, 0.05], [t3 * 0.08, 0.175, 0]], (e5) => 0.011 * (1 - e5 * 0.85), 5, 8, { capStart: true, capEnd: true }), U(`oldBone`, { color: `#cbb894` })), e4.add(V([[t3 * 0.1, 0.01, 0.03], [t3 * 0.105, 0.012, -0.04], [t3 * 0.08, 0.014, -0.1]], [3e-3, 0.011], 3, 6, { up: [0, 1, 0] }), U(`darkLeather`));
    }
    return { builder: e4, tip: [0, 0.17, 0.05], kind: `helm`, aoDist: 0.04 };
  }, hornedHelm: () => {
    let e4 = new pv(), t2 = { rx: 0.094, rz: 0.113, top: 0.135, frontY: 0.02, sideY: -0.025, backY: -0.05, thick: 8e-3, nu: 20, nv: 8 };
    e4.add(Bv(t2), U(`iron`, { colors: { 1: `#1a1410` }, wear: 0.5 })), e4.add(V(Hv(0.099, 0.117, 0, 26, (e5) => ty(e5, t2) + 0.014), [8e-3, 0.018], 4, 28, { up: [0, 1, 0] }), U(`bronze`));
    for (let t3 of [1, -1]) {
      let n2 = [[t3 * 0.085, 0.05, 0], [t3 * 0.15, 0.07, -0.01], [t3 * 0.2, 0.13, -0.03], [t3 * 0.21, 0.21, -0.07], [t3 * 0.18, 0.27, -0.1]];
      e4.add(V(n2, (e5) => [0.03 * (1 - e5 * 0.9), 0.026 * (1 - e5 * 0.9)], 7, 14, { capStart: true, capEnd: true }), U(`bone`, { color: `#d8c8a2`, paint: (e5, t4) => t4.lerp(new P(`#3a2a1a`), z(0.08, 0, Math.abs(e5.p.x) - 0.12) * 0 + z(0.2, 0.27, e5.p.y) * 0.7) }));
    }
    return e4.add(V([[0, 0.05, 0.118], [0, -2e-3, 0.121], [0, -0.05, 0.113]], [0.011, 5e-3], 4, 5, { up: [0, 0, 1], capStart: true, capEnd: true }), U(`bronze`)), { builder: e4, tip: [0, 0.27, 0], kind: `helm`, aoDist: 0.05 };
  }, circlet: () => {
    let e4 = new pv(), t2 = [];
    for (let e5 = 0; e5 <= 28; e5 += 1) {
      let n3 = e5 / 28 * c_, r2 = Math.max(0, Math.cos(n3));
      t2.push([Math.sin(n3) * 0.09, 0.02 + (1 - r2) * 0.022 + r2 ** 8 * 8e-3, Math.cos(n3) * 0.108]);
    }
    e4.add(V(t2, [45e-4, 28e-4], 4, 40, { up: [0, 1, 0] }), U(`gold`));
    for (let t3 of [1, -1]) {
      let n3 = [];
      for (let e5 = 0; e5 <= 8; e5 += 1) {
        let r2 = e5 / 8, i2 = t3 * (0.15 + r2 * 0.55);
        n3.push([Math.sin(i2) * 0.093, 0.025 + Math.sin(r2 * Math.PI * 2) * 0.01, Math.cos(i2) * 0.111]);
      }
      e4.add(V(n3, 22e-4, 3, 10), U(`gold`));
    }
    e4.add(X_([[0, -0.012], [0.014, -6e-3], [0.015, 4e-3], [7e-3, 0.013], [0, 0.015]], 8, { sz: 0.5 }).translate(0, 0.03, 0.108), U(`gold`));
    let n2 = X_([[0, -0.01], [9e-3, -3e-3], [8e-3, 4e-3], [0, 9e-3]], 6, { sz: 0.6 });
    return n2.rotateX(Math.PI / 2).translate(0, 0.03, 0.115), e4.add(n2, uv(`#4a8cff`, 1)), { builder: e4, tip: [0, 0.05, 0.11], kind: `helm`, aoDist: 0.03 };
  } }, iy = new Lv([{ y: -0.34, rx: 0.155, rzf: 0.11, rzb: 0.115 }, { y: -0.2, rx: 0.15, rzf: 0.115, rzb: 0.108 }, { y: -0.05, rx: 0.168, rzf: 0.125, rzb: 0.108 }, { y: 0.08, rx: 0.192, rzf: 0.122, rzb: 0.11 }, { y: 0.17, rx: 0.2, rzf: 0.1, rzb: 0.105 }, { y: 0.23, rx: 0.15, rzf: 0.07, rzb: 0.08 }, { y: 0.27, rx: 0.07, rzf: 0.055, rzb: 0.06 }]), ay = (e4) => {
    let t2 = Math.abs(((e4 + Math.PI) % c_ + c_) % c_ - Math.PI), n2 = Math.exp(-(((t2 - Math.PI / 2) / 0.35) ** 2)), r2 = Math.exp(-((t2 / 0.45) ** 2)), i2 = Math.exp(-(((t2 - Math.PI) / 0.5) ** 2));
    return 0.235 - n2 * 0.17 - r2 * 0.07 - i2 * 0.025;
  }, oy = { color: `#8c9096`, rough: 0.45, metal: 0.9, detail: B.CHAIN, wear: 0.4 };
  for (let e4 of [`armorQuilted`, `armorLeather`, `armorStudded`, `armorRing`, `armorScale`, `armorChain`, `armorBreast`, `armorSplint`, `armorPlate`]) ry[e4] = () => Jv(e4);
  ry.buckler = () => ({ builder: Yv(0.16, 0.035, `steel`, {}), tip: [0, 0, 0.1], kind: `shield`, aoDist: 0.05 }), ry.smallShield = () => ({ builder: Yv(0.22, 0.03, `wood`, { paint: `#6a1c18` }), tip: [0, 0, 0.1], kind: `shield`, aoDist: 0.05 }), ry.largeShield = () => {
    let e4 = Yv(0.31, 0.05, `wood`, { paint: `#1c2a5a` });
    for (let t2 of [-0.12, 0.12]) e4.add(V([[-0.3, t2, 0.05], [0, t2, 0.085], [0.3, t2, 0.05]], [6e-3, 0.02], 4, 10, { up: [0, 1, 0] }), U(`iron`));
    return { builder: e4, tip: [0, 0, 0.12], kind: `shield`, aoDist: 0.06 };
  }, ry.kiteShield = () => {
    let e4 = [];
    for (let t3 = 0; t3 <= 10; t3 += 1) {
      let n3 = t3 / 10 * Math.PI;
      e4.push([Math.cos(n3) * 0.2, 0.12 + Math.sin(n3) * 0.1]);
    }
    e4.push([-0.17, -0.1], [-0.08, -0.32], [0, -0.42], [0.08, -0.32], [0.17, -0.1]);
    let t2 = 0.06, n2 = (e5) => 0.015 + t2 * (1 - Math.min(1, e5 * e5 / 0.04)), r2 = Xv(e4, t2, U(`wood`, { color: `#7a1a1e`, wear: 0.35 }), `gold`), i2 = { ...U(`paleWood`), color: `#d8c49a`, wear: 0.4 };
    r2.add(Zv([0, -0.355], [0, 0.205], 0.05, n2, 10), i2), r2.add(Zv([-0.185, 0.06], [0.185, 0.06], 0.05, n2, 10), i2);
    let a2 = new cv();
    for (let [e5, t3] of [[-0.14, 0.17], [0.14, 0.17], [-0.15, -0.06], [0.15, -0.06], [-0.07, -0.25], [0.07, -0.25]]) a2.merge(H(8e-3, 8e-3, 5e-3, 6, 3).translate(e5, t3, n2(e5) + 1e-3));
    return r2.add(a2, U(`gold`)), r2.add(X_([[0.032, n2(0) - 4e-3], [0.03, n2(0) + 8e-3], [0.016, n2(0) + 0.016], [0, n2(0) + 0.018]], 10).deform((e5) => {
      let t3 = e5.y;
      e5.y = e5.z + 0.06, e5.z = t3;
    }).flipWinding().computeNormals(), U(`gold`)), { builder: r2, tip: [0, 0, 0.12], kind: `shield`, aoDist: 0.06 };
  }, ry.towerShield = () => {
    let e4 = new pv(), t2 = (e5) => 0.06 * (1 - Math.min(1, e5 * e5 / 0.07)), n2 = (e5) => 0.38 + 0.08 * Math.cos(e5 / 0.25 * (Math.PI / 2)), r2 = 0.5, i2 = 4e-3;
    for (let a3 = 0; a3 < 5; a3 += 1) {
      let o3 = -r2 / 2 + a3 * r2 / 5 + i2 / 2, s3 = -r2 / 2 + (a3 + 1) * r2 / 5 - i2 / 2, c3 = (o3 + s3) / 2, l3 = tv([[o3, -0.45], [s3, -0.45], [s3, n2(s3)], [c3, n2(c3)], [o3, n2(o3)]], 0.016, { bevel: 3e-3, bevelSegs: 1, crease: 50 }), u2 = (t2(s3) - t2(o3)) / (s3 - o3);
      l3.translate(-c3, 0, 0).rotateY(-Math.atan(u2)).translate(c3, 0, t2(c3)), e4.add(l3, U(`wood`, { color: a3 % 2 ? `#5a3c22` : `#6c482a`, wear: 0.55 }));
    }
    let a2 = (e5) => t2(e5) + 0.011, o2 = new cv(), s2 = new cv();
    for (let e5 of [-0.34, -0.02, 0.3]) {
      o2.merge(Zv([-0.255, e5], [0.255, e5], 0.04, a2, 12, 4e-3));
      for (let t3 = 0; t3 < 5; t3 += 1) {
        let n3 = -r2 / 2 + (t3 + 0.5) * r2 / 5;
        s2.merge(H(7e-3, 7e-3, 4e-3, 6, 3).translate(n3, e5, a2(n3) + 4e-3));
      }
    }
    e4.add(o2, U(`iron`, { wear: 0.55 })), e4.add(s2, U(`darkSteel`));
    let c2 = X_([[0.07, 0], [0.066, 0.012], [0.045, 0.03], [0, 0.038]], 12);
    c2.rotateX(Math.PI / 2).translate(0, 0.14, a2(0)), e4.add(c2, U(`steel`, { wear: 0.4 }));
    let l2 = [[-0.255, -0.455, 0], [0.255, -0.455, 0]];
    for (let e5 = 0; e5 <= 10; e5 += 1) {
      let t3 = R(0.255, -0.255, e5 / 10);
      l2.push([t3, n2(t3) + 4e-3, 0]);
    }
    l2.push([-0.255, -0.455, 0]);
    for (let e5 of l2) e5[2] = t2(e5[0]) + 3e-3;
    return e4.add(V(l2, [0.012, 9e-3], 4, 60, { linear: true }), U(`darkSteel`)), e4.add(V([[0, -0.08, -6e-3], [0, 0, -0.034], [0, 0.08, -6e-3]], 9e-3, 5, 6), U(`darkLeather`)), { builder: e4, tip: [0, 0, 0.13], kind: `shield`, aoDist: 0.07 };
  }, ry.boneShield = () => {
    let e4 = new pv(), t2 = i_(9), n2 = X_([[0.25, 0], [0.24, 0.012], [0.16, 0.03], [0, 0.04]], 16);
    n2.rotateX(Math.PI / 2), e4.add(n2, U(`leather`, { color: `#6a4a34`, wear: 0.6 }));
    let r2 = X_([[0, 0], [0.25, 0]], 16);
    r2.rotateX(Math.PI / 2), e4.add(r2, U(`darkLeather`));
    for (let n3 = 0; n3 < 8; n3 += 1) {
      let r3 = n3 / 8 * c_ + 0.2, i3 = [Math.cos(r3) * 0.06, Math.sin(r3) * 0.06, 0.05], a3 = [Math.cos(r3) * (0.235 + t2() * 0.03), Math.sin(r3) * (0.245 + t2() * 0.03), 0.012];
      e4.add(V([i3, a3], (e5) => 0.016 * (1 + 0.65 * (Math.exp(-((e5 / 0.1) ** 2)) + Math.exp(-(((1 - e5) / 0.1) ** 2)))), 6, 6, { capStart: true, capEnd: true, linear: true }), U(`bone`, { wear: 0.5 }));
    }
    let i2 = av(0.245, 0.011, 20, 4);
    i2.rotateX(Math.PI / 2).translate(0, 0, 6e-3), e4.add(i2, U(`darkWood`));
    let a2 = H(0.07, 0.075, 0.065, 12, 9);
    for (let e5 of [1, -1]) a2.bulge([e5 * 0.025, 0.012, 0.062], 0.02, -0.018);
    a2.computeNormals(), a2.translate(0, 0, 0.075), e4.add(a2, U(`oldBone`));
    let o2 = { color: `#0a0604`, rough: 0.9, metal: 0, detail: B.BONE, wear: 0, ao: 0 };
    for (let t3 of [1, -1]) e4.add(H(0.017, 0.015, 6e-3, 8, 4).translate(t3 * 0.025, 0.012, 0.127), o2);
    e4.add(H(7e-3, 0.011, 5e-3, 6, 4).translate(0, -0.022, 0.136), o2);
    for (let t3 of [1, -1]) e4.add(H(6e-3, 6e-3, 4e-3, 5, 3).translate(t3 * 0.025, 0.012, 0.131), dv(`#6fffaa`, 2.5));
    return e4.add(V([[0, -0.07, -6e-3], [0, 0, -0.03], [0, 0.07, -6e-3]], 8e-3, 5, 6), U(`darkLeather`)), { builder: e4, tip: [0, 0, 0.15], kind: `shield`, aoDist: 0.05 };
  }, ry.spikedShield = () => ({ builder: Yv(0.26, 0.045, `iron`, { spikes: 8 }), tip: [0, 0, 0.18], kind: `shield`, aoDist: 0.06 }), ry.shrunkenHead = () => {
    let e4 = new pv(), t2 = [0, -0.088, 4e-3], n2 = H(0.04, 0.05, 0.045, 14, 11);
    n2.deform((e5) => {
      e5.y < 0 && (e5.x *= 1 - 0.28 * (-e5.y / 0.05));
    }), n2.computeNormals();
    for (let e5 of [1, -1]) n2.bulge([e5 * 0.016, 4e-3, 0.04], [0.014, 0.011, 0.02], -7e-3);
    n2.grab([0, -4e-3, 0.045], [8e-3, 0.014, 0.015], [0, -2e-3, 9e-3]), n2.grab([0, -0.026, 0.04], [0.017, 9e-3, 0.015], [0, 0, 7e-3]);
    for (let e5 of [1, -1]) n2.grab([e5 * 0.03, -0.012, 0.02], [0.012, 0.016, 0.016], [e5 * 5e-3, 0, -8e-3]);
    n2.noise(15e-4, 90, 5).computeNormals(), n2.translate(t2[0], t2[1], t2[2]), e4.add(n2, U(`skin`, { color: `#6e5444`, wear: 0.6 }));
    for (let n3 of [1, -1]) e4.add(H(6e-3, 0.012, 8e-3, 6, 4).rotateY(n3 * 0.3).translate(t2[0] + n3 * 0.037, t2[1] + 0, t2[2] - 4e-3), U(`skin`, { color: `#634a3c` }));
    let r2 = { color: `#0c0806`, rough: 0.9, metal: 0, detail: B.SKIN, wear: 0, ao: 0 }, i2 = { color: `#d8c8a0`, rough: 0.8, metal: 0, detail: B.CLOTH, wear: 0 };
    for (let n3 of [1, -1]) {
      let a3 = t2[0] + n3 * 0.016, o3 = t2[1] + 4e-3, s3 = t2[2] + 0.038;
      e4.add(V([[a3 - 8e-3, o3, s3], [a3, o3 - 1e-3, s3 + 2e-3], [a3 + 8e-3, o3, s3]], [16e-4, 12e-4], 4, 4, { up: [0, 1, 0], capStart: true, capEnd: true }), r2);
      for (let t3 of [-5e-3, 0, 5e-3]) e4.add(V([[a3 + t3, o3 + 4e-3, s3 - 5e-4], [a3 + t3, o3 - 4e-3, s3 + 12e-4]], 7e-4, 3, 1, { linear: true }), i2);
    }
    let a2 = t2[1] - 0.026, o2 = t2[2] + 0.046;
    e4.add(V([[-0.012, a2 + 1e-3, o2 - 4e-3], [0, a2, o2], [0.012, a2 + 1e-3, o2 - 4e-3]], [17e-4, 14e-4], 4, 5, { up: [0, 1, 0], capStart: true, capEnd: true }), r2);
    for (let t3 of [-8e-3, -4e-3, 0, 4e-3, 8e-3]) e4.add(V([[t3, a2 + 5e-3, o2 - 15e-4 - Math.abs(t3) * 0.25], [t3, a2 - 5e-3, o2 - 15e-4 - Math.abs(t3) * 0.25]], 8e-4, 3, 1, { linear: true }), i2);
    let s2 = H(0.044, 0.054, 0.049, 12, 9);
    s2.deform((e5) => {
      let t3 = 0.012 + e5.z * 0.35;
      e5.y < t3 && e5.multiplyScalar(0.86);
    }), s2.computeNormals(), s2.translate(t2[0], t2[1], t2[2] - 2e-3);
    let c2 = U(`hair`, { color: `#15110d` });
    e4.add(s2, c2);
    for (let n3 = 0; n3 < 7; n3 += 1) {
      let r3 = Math.PI + R(-1.5, 1.5, n3 / 6), i3 = Math.sin(r3), a3 = Math.cos(r3);
      e4.add(V([[t2[0] + i3 * 0.03, t2[1] + 0.035, t2[2] + a3 * 0.034], [t2[0] + i3 * 0.046, t2[1] - 0.01, t2[2] + a3 * 0.05], [t2[0] + i3 * 0.044, t2[1] - 0.07, t2[2] + a3 * 0.046], [t2[0] + i3 * 0.04, t2[1] - 0.12 - n3 % 2 * 0.015, t2[2] + a3 * 0.04]], (e5) => [35e-4 * (1 - e5 * 0.5), 0.011 * (1 - e5 * 0.6)], 4, 8, { up: [i3, 0, a3], capStart: true, capEnd: true }), c2);
    }
    return e4.add(V([[0, t2[1] + 0.045, t2[2] - 4e-3], [0, -0.022, 0], [0, 6e-3, 0]], (e5) => 0.012 * (1 - e5 * 0.45), 6, 5, { capStart: true, capEnd: true }), c2), e4.add(av(95e-4, 32e-4, 10, 4).translate(0, -0.012, 0), U(`bone`)), { builder: e4, tip: [0, -0.1, 0.06], kind: `head`, aoDist: 0.04 };
  };
  for (let e4 of [`leatherGloves`, `heavyGloves`, `chainGloves`, `gauntlets`]) ry[e4] = () => {
    let t2 = new pv();
    for (let n2 of [1, -1]) for (let [r2, i2] of Qv(n2, e4).parts) r2.rotateZ(n2 * 0.12).translate(n2 * 0.065, 0, n2 * 0.02), i2 === `chain` ? t2.add(r2, { color: `#8c9096`, rough: 0.45, metal: 0.9, detail: B.CHAIN, wear: 0.4 }) : t2.add(r2, U(i2));
    return { builder: t2, tip: [0, 0.2, 0], kind: `misc`, aoDist: 0.04 };
  };
  for (let e4 of [`leatherBoots`, `heavyBoots`, `chainBoots`, `greaves`]) ry[e4] = () => {
    let t2 = new pv();
    for (let n2 of [1, -1]) for (let [r2, i2] of $v(n2, e4)) r2.rotateY(n2 * 0.25).translate(n2 * 0.07, 0, n2 * -0.03), i2 === `chain` ? t2.add(r2, { color: `#8c9096`, rough: 0.45, metal: 0.9, detail: B.CHAIN, wear: 0.4 }) : t2.add(r2, U(i2));
    return { builder: t2, tip: [0, 0.3, 0], kind: `misc`, aoDist: 0.05 };
  };
  Object.assign(ry, { sash: () => {
    let e4 = new pv();
    e4.add(ey(0.07, 0.01), U(`cloth`, { color: `#8a1c22`, colors: { 1: `#5a1016` } })), e4.add(H(0.035, 0.03, 0.025, 9, 6).translate(0.04, 0, 5e-3), U(`cloth`, { color: `#8a1c22` }));
    for (let t2 of [0, 1]) e4.add(rv(2, 4, (e5, n2) => [0.04 + t2 * 0.015 + (e5 - 0.5) * 0.04, -0.02 - n2 * 0.12, 0.01 + t2 * 6e-3], 6e-3, () => new N(0, 0, 1)), U(`cloth`, { color: `#8a1c22`, colors: { 1: `#5a1016`, 2: `#c8a24a` } }));
    return { builder: e4, tip: [0, 0, 0], kind: `misc`, aoDist: 0.03 };
  }, lightBelt: () => {
    let e4 = new pv();
    return e4.add(ey(0.035, 8e-3), U(`leather`)), e4.add(av(0.016, 4e-3, 10, 4).rotateX(Math.PI / 2).translate(0, 0, 4e-3), U(`bronze`)), { builder: e4, tip: [0, 0, 0], kind: `misc`, aoDist: 0.03 };
  }, belt: () => {
    let e4 = new pv();
    return e4.add(ey(0.05, 0.01), U(`leather`, { paint: (e5, t2) => {
      Math.abs(Math.abs(e5.p.y) - 0.019) < 3e-3 && t2.multiplyScalar(0.6);
    } })), e4.add(tv([[-0.03, -0.035], [0.03, -0.035], [0.03, 0.035], [-0.03, 0.035]], 8e-3, { bevel: 3e-3, holes: [[[-0.018, -0.022], [0.018, -0.022], [0.018, 0.022], [-0.018, 0.022]]] }).translate(0, 0, 8e-3), U(`iron`)), e4.add(H(0.03, 0.035, 0.02, 8, 5).translate(-0.11, -0.01, -0.035), U(`darkLeather`)), { builder: e4, tip: [0, 0, 0], kind: `misc`, aoDist: 0.03 };
  }, heavyBelt: () => {
    let e4 = new pv();
    e4.add(ey(0.075, 0.014), U(`darkLeather`)), e4.add(X_([[0, -0.012], [0.04, -0.01], [0.045, 0], [0.035, 0.012], [0, 0.014]], 12, { sz: 0.3 }).rotateX(Math.PI / 2).translate(0, 0, 0.01), U(`bronze`));
    for (let t2 of [-0.12, 0.12]) e4.add(H(0.035, 0.04, 0.025, 8, 5).translate(t2, -0.015, Math.cos(t2 / 0.17) * 0.12 - 0.12 + 0.01), U(`leather`));
    return { builder: e4, tip: [0, 0, 0], kind: `misc`, aoDist: 0.03 };
  }, platedBelt: () => {
    let e4 = new pv();
    e4.add(ey(0.06, 0.01), U(`darkLeather`));
    for (let t2 = 0; t2 < 7; t2 += 1) {
      let n2 = R(-1, 1, t2 / 6), r2 = tv([[-0.022, -0.035], [0.022, -0.035], [0.025, 0.035], [-0.025, 0.035]], 6e-3, { bevel: 2e-3 });
      r2.rotateY(n2).translate(Math.sin(n2) * 0.178, 0, Math.cos(n2) * 0.128 - 0.12), e4.add(r2, U(`steel`));
    }
    return { builder: e4, tip: [0, 0, 0], kind: `misc`, aoDist: 0.03 };
  } });
}));
function cy(e4) {
  let t2 = new cv(), n2 = e4.sides, r2 = e4.r, i2 = e4.sx ?? 1, a2 = e4.sy ?? 1, o2 = (e4.crown ?? 0.42) * r2, s2 = (e4.pav ?? 0.8) * r2, c2 = e4.table ?? 0.55, l2 = (e4.girdle ?? 0.06) * r2, u2 = i_(e4.seed ?? 7), d2 = e4.jitter ?? 0, f2 = e4.phase ?? 0, p2 = (o3, s3, c3) => {
    let l3 = [];
    for (let p3 = 0; p3 < n2; p3 += 1) {
      let m3 = (p3 + c3 + f2) / n2 * c_, h3 = Math.sin(m3), g3 = -Math.cos(m3), _3 = r2 * o3;
      e4.cushion && (_3 /= (Math.abs(h3) ** 3 + Math.abs(g3) ** 3) ** (1 / 3) * 1.06), _3 *= 1 + d2 * (u2() - 0.5) * 2, l3.push(t2.vert(h3 * _3 * i2, g3 * _3 * a2, s3 + d2 * r2 * 0.35 * (u2() - 0.5)));
    }
    return l3;
  }, m2 = [];
  e4.star && m2.push({ ids: p2(0.56, -s2 * 0.46, 0.5), phase: 0.5 }), m2.push({ ids: p2(1, 0, 0), phase: 0 }), m2.push({ ids: p2(1, l2, 0), phase: 0 }), e4.star && m2.push({ ids: p2((1 + c2) / 2 + 0.05, l2 + o2 * 0.52, 0.5), phase: 0.5 }), m2.push({ ids: p2(c2, l2 + o2, 0), phase: 0 });
  let h2 = t2.vert(0, 0, -s2), g2 = t2.vert(0, 0, l2 + o2), _2 = m2[0].ids;
  for (let e5 = 0; e5 < n2; e5 += 1) t2.tri(_2[e5], h2, _2[(e5 + 1) % n2]);
  for (let e5 = 0; e5 < m2.length - 1; e5 += 1) {
    let r3 = m2[e5], i3 = m2[e5 + 1];
    for (let e6 = 0; e6 < n2; e6 += 1) {
      let a3 = (e6 + 1) % n2;
      r3.phase === i3.phase ? t2.quad(r3.ids[e6], r3.ids[a3], i3.ids[a3], i3.ids[e6]) : i3.phase > r3.phase ? (t2.tri(r3.ids[e6], r3.ids[a3], i3.ids[e6]), t2.tri(i3.ids[e6], r3.ids[a3], i3.ids[a3])) : (t2.tri(r3.ids[e6], r3.ids[a3], i3.ids[a3]), t2.tri(i3.ids[e6], r3.ids[e6], i3.ids[a3]));
    }
  }
  let v2 = m2[m2.length - 1].ids;
  for (let e5 = 0; e5 < n2; e5 += 1) t2.tri(v2[e5], v2[(e5 + 1) % n2], g2);
  return (e4.pear || e4.broken !== void 0) && t2.deform((t3) => {
    if (e4.pear && t3.y > 0) {
      let e5 = Math.min(1, t3.y / (r2 * a2));
      t3.x *= 1 - 0.5 * e5 ** 1.4, t3.y *= 1 + 0.42 * e5 * e5;
    }
    e4.broken !== void 0 && t3.x > e4.broken * r2 * i2 && (t3.x = e4.broken * r2 * i2);
  }), t2.orientOutward(), t2.toFlat();
}
function ly(e4, t2, n2 = {}) {
  let r2 = [new P(`#ff7ac0`), new P(`#6ae8ff`), new P(`#ffe066`)], i2 = new P(`#ffffff`), a2 = new P(`#c8c4bc`), o2 = n2.contrast ?? 1;
  return uv(e4, t2, { rough: n2.rough ?? 0.05, paint: (e5, t3) => {
    let s2 = Ey(e5.n), c2 = R(1, 0.3 + 1.05 * s2 * s2, o2);
    e5.n.z < -0.25 && (c2 *= 0.5), e5.n.z > 0.97 && (c2 *= 1.15), t3.multiplyScalar(c2), n2.fire && s2 > 0.7 && t3.lerp(r2[Math.floor(s2 * 97) % 3], 0.55), n2.cloudy && n_(Math.floor(s2 * 1e3) + (n2.seed ?? 0)) < n2.cloudy && t3.lerp(a2, 0.3), n2.crack && Math.abs(e5.p.x * 0.8 + e5.p.y * 0.6 + (n2.seed ?? 0) * 3e-4) / 15e-4 < n2.crack && t3.multiplyScalar(0.35), s2 > 0.94 && t3.lerp(i2, 0.5);
  }, pbr: (e5, n3) => {
    n3[2] = t2 * (0.35 + 1 * Ey(e5.n)) * (e5.n.z < -0.25 ? 0.6 : 1);
  } });
}
function uy(e4, t2) {
  if (e4 === `skull`) return dy(t2);
  let n2 = new pv(), r2 = [85e-4, 98e-4, 0.011, 0.0125, 0.014][t2], i2 = { sides: [5, 6, 8, 10, 12][t2], r: r2, star: t2 >= 3, table: [0.4, 0.5, 0.55, 0.56, 0.58][t2], crown: [0.55, 0.45, 0.42, 0.42, 0.46][t2], pav: [0.62, 0.7, 0.78, 0.82, 0.86][t2], jitter: [0.2, 0.07, 0, 0, 0][t2], seed: e4.length * 31 + t2, broken: t2 === 0 ? 0.62 : void 0 };
  switch (e4) {
    case `amethyst`:
      i2.sx = 0.8;
      break;
    case `topaz`:
      i2.cushion = t2 >= 2, i2.sy = 0.86, t2 >= 2 && (i2.sides = Math.max(i2.sides, 12));
      break;
    case `emerald`:
      i2.sx = 0.76, i2.sides = t2 === 0 ? 5 : 8, i2.phase = 0.5, i2.table = t2 === 0 ? 0.4 : 0.62, i2.crown = 0.34, i2.star = false;
      break;
    case `ruby`:
      i2.pear = t2 >= 1, i2.sx = 0.9;
      break;
    case `diamond`:
      i2.crown = (i2.crown ?? 0.42) + 0.08;
      break;
    default:
      break;
  }
  let a2 = [0.1, 0.15, 0.22, 0.3, 0.4][t2] * (e4 === `diamond` ? 0.3 : 1);
  return n2.add(cy(i2), ly(Dy[e4], a2, { rough: t2 === 0 ? 0.26 : t2 === 1 ? 0.12 : 0.04, cloudy: t2 === 0 ? 0.45 : t2 === 1 ? 0.2 : 0, crack: t2 === 1 ? 0.5 : 0, fire: e4 === `diamond` && t2 >= 2, seed: t2 * 13, contrast: e4 === `diamond` ? 1.25 : 1 })), Ty(n2, 0.01);
}
function dy(e4) {
  let t2 = new pv(), n2 = [95e-4, 0.0105, 0.0115, 0.0125, 0.0135][e4], r2 = H(n2 * 0.84, n2 * 0.95, n2, 14, 11);
  r2.deform((e5) => {
    if (e5.y < -0.15 * n2) {
      let t3 = Math.min(1, (-e5.y - 0.15 * n2) / (0.8 * n2));
      e5.x *= 1 - 0.3 * t3, e5.z = e5.z > 0 ? e5.z * (1 - 0.05 * t3) : e5.z * (1 - 0.35 * t3);
    }
    e5.y > 0.2 * n2 && e5.z > 0 && (e5.z *= 0.96);
  }), r2.computeNormals();
  let i2 = [[0.33 * n2, -0.12 * n2, 0.86 * n2], [-0.33 * n2, -0.12 * n2, 0.86 * n2]];
  for (let e5 of i2) r2.bulge(e5, [0.28 * n2, 0.25 * n2, 0.4 * n2], -0.24 * n2);
  r2.bulge([0, -0.46 * n2, 0.86 * n2], [0.11 * n2, 0.15 * n2, 0.3 * n2], -0.15 * n2);
  for (let e5 of [1, -1]) r2.bulge([e5 * 0.62 * n2, -0.42 * n2, 0.5 * n2], 0.25 * n2, 0.06 * n2);
  r2.computeNormals();
  let a2 = new P([`#a89878`, `#bcae8e`, `#d2c6aa`, `#e2d8c0`, `#efe7d4`][e4]), o2 = new P(`#120c07`), s2 = (t3, r3) => {
    let a3 = t3.p;
    for (let e5 of i2) {
      let t4 = Math.hypot((a3.x - e5[0]) / (0.23 * n2), (a3.y - e5[1]) / (0.21 * n2));
      t4 < 1 && a3.z > 0.45 * n2 && r3.lerp(o2, z(1, 0.55, t4));
    }
    let s3 = Math.hypot(a3.x / (0.09 * n2), (a3.y + 0.46 * n2) / (0.13 * n2));
    s3 < 1 && a3.z > 0.6 * n2 && r3.lerp(o2, z(1, 0.5, s3)), a3.y < -0.66 * n2 && a3.z > 0.25 * n2 && Math.abs(Math.sin(a3.x / n2 * 22)) < 0.25 && r3.multiplyScalar(0.45), e4 <= 1 && (Math.abs(o_(a3.x * 520, a3.y * 520, a3.z * 520, 2, 3 + e4)) < (e4 === 0 ? 0.05 : 0.03) && r3.multiplyScalar(0.4), r3.multiplyScalar(0.92 + 0.12 * o_(a3.x * 300, a3.y * 300, a3.z * 300, 2, 9)));
  }, c2 = () => ({ color: a2, rough: [0.62, 0.55, 0.45, 0.32, 0.22][e4], metal: 0, emit: e4 === 4 ? 0.06 : 0, detail: B.BONE, wear: [0.7, 0.5, 0.3, 0.15, 0.05][e4], paint: s2 });
  if (t2.add(r2, c2()), e4 >= 1) {
    let e5 = H(n2 * 0.5, n2 * 0.24, n2 * 0.55, 10, 5);
    e5.translate(0, -0.8 * n2, 0.24 * n2), t2.add(e5, c2());
  }
  let l2 = { color: `#0a0604`, rough: 0.9, metal: 0, detail: B.BONE, wear: 0, ao: 0 };
  for (let e5 of i2) t2.add(H(0.2 * n2, 0.17 * n2, 0.08 * n2, 8, 4).translate(e5[0] * 0.98, e5[1], e5[2] - 0.17 * n2), l2);
  if (t2.add(H(0.07 * n2, 0.11 * n2, 0.05 * n2, 6, 4).translate(0, -0.45 * n2, 0.84 * n2), l2), e4 >= 3) for (let r3 of i2) t2.add(H(0.07 * n2, 0.07 * n2, 0.05 * n2, 6, 4).translate(r3[0] * 0.95, r3[1], r3[2] - 0.12 * n2), dv(`#c8ffd4`, e4 === 4 ? 2.4 : 1.4));
  return Ty(t2, 8e-3);
}
function fy(e4) {
  let t2 = new pv(), n2 = i_(e4 * 97 + 5), r2 = 0.017, i2 = 0.0215, a2 = 85e-4, o2 = 28e-4, s2 = [], c2 = 2.2 + e4 % 3 * 0.5;
  for (let e5 = 0; e5 < 11; e5 += 1) {
    let t3 = e5 / 11 * c_ + 0.15, a3 = Math.cos(t3), o3 = Math.sin(t3), l3 = 2 / c2, u3 = 1 + (n2() - 0.5) * 0.16;
    s2.push([Math.sign(a3) * Math.abs(a3) ** +l3 * r2 * u3, Math.sign(o3) * Math.abs(o3) ** +l3 * i2 * u3]);
  }
  let l2 = tv(s2, a2, { bevel: o2, bevelSegs: 2, crease: 55 }), u2 = new P(jy[e4 - 1]);
  t2.add(l2, { color: u2, rough: 0.82, metal: 0, detail: B.STONE, wear: 0.45, paint: (t3, n3) => {
    n3.multiplyScalar(0.85 + 0.3 * o_(t3.p.x * 160, t3.p.y * 160, t3.p.z * 160, 2, e4)), t3.n.z < 0.6 && t3.n.z > -0.6 && n3.multiplyScalar(0.8);
  } }), a2 / 2 + o2, r2 * 0.62, i2 * 0.62;
  let d2 = new cv(), f2 = new cv();
  for (let t3 of Ay[e4]) {
    let e5 = t3.map(([e6, t4]) => [e6 * 0.01054, t4 * 0.013329999999999998, 0.007050000000000001]);
    for (let t4 = 0; t4 < e5.length - 1; t4 += 1) d2.merge(V([e5[t4], e5[t4 + 1]], [5e-4, 26e-4], 4, 1, { up: [0, 0, 1], linear: true, capStart: true, capEnd: true })), f2.merge(V([e5[t4], e5[t4 + 1]], [8e-4, 135e-5], 4, 1, { up: [0, 0, 1], linear: true, capStart: true, capEnd: true }));
    for (let t4 of e5) d2.merge(H(26e-4, 26e-4, 5e-4, 6, 3).translate(t4[0], t4[1], t4[2])), f2.merge(H(135e-5, 135e-5, 8e-4, 6, 3).translate(t4[0], t4[1], t4[2]));
  }
  return d2.translate(0, 0, 1e-4), f2.translate(0, 0, 3e-4), t2.add(d2, { color: `#120a06`, rough: 0.9, metal: 0, detail: B.STONE, wear: 0, emit: 0.25, pbr: (e5, t3) => t3[2] = 0 }), t2.add(f2, dv(`#ff6a10`, 1.45)), Ty(t2, 0.01);
}
function py(e4, t2, n2, r2 = 24) {
  return av(e4, t2, r2, 6, n2).rotateX(Math.PI / 2);
}
function my(e4) {
  return cy(e4).rotateX(-Math.PI / 2);
}
function hy(e4, t2, n2, r2) {
  let i2 = [];
  for (let r3 = 0; r3 <= 30; r3 += 1) {
    let a2 = r3 / 30 * c_;
    i2.push([Math.sin(a2) * t2, e4 + n2 - Math.cos(a2) * n2, -Math.sin(a2 * 2) * 15e-4]);
  }
  return { geo: V(i2, 11e-4, 4, 60, { up: [0, 0, 1] }), spec: U(r2, { paint: (e5, t3) => {
    Math.floor(e5.v * 44) % 2 == 1 && t3.multiplyScalar(0.62);
  } }) };
}
function gy(e4, t2, n2) {
  let r2 = new pv(), i2 = Py[e4], a2 = i2.prof[i2.prof.length - 1][1], o2 = new P(t2.liquid), s2 = o2.clone().multiplyScalar(1.7), c2 = new P(t2.deep), l2 = new P(`#a8bcc6`), u2 = new P(`#ffffff`), d2 = t2.emit * (0.85 + n2 * 0.06), f2 = (e5) => Math.exp(-(((Math.atan2(e5.x, e5.z) + 0.62) / 0.15) ** 2)) * z(4e-3, 0.012, e5.y);
  r2.add(X_(i2.prof, 16), { color: o2, rough: 0.05, metal: 0, detail: B.GEM, wear: 0, ao: 0.5, paint: (e5, t3) => {
    e5.p.y < i2.liquid ? (t3.copy(o2).lerp(c2, z(i2.liquid, 0, e5.p.y) * 0.5), t3.lerp(s2, z(i2.liquid - 5e-3, i2.liquid, e5.p.y) * 0.55)) : t3.copy(l2), t3.lerp(u2, f2(e5.p) * 0.6);
  }, pbr: (e5, t3) => {
    e5.p.y < i2.liquid ? (t3[2] = d2, t3[0] = 0.05) : (t3[2] = 0.04, t3[0] = 0.03), t3[2] += f2(e5.p) * 0.4;
  } });
  let p2 = i2.neck * 0.98;
  r2.add(X_([[0, 0], [p2 * 0.92, 0], [p2, 6e-3], [p2 * 1.1, 0.013], [p2 * 1.02, 0.0175], [0, 0.018]], 10).translate(0, a2 - 7e-3, 0), { color: `#8a6a44`, rough: 0.85, metal: 0, detail: B.WOOD, wear: 0.3 });
  let m2 = i2.prof.find((e5, t3) => t3 > 3 && Math.abs(e5[0] - i2.neck) < 6e-4)?.[1] ?? a2 - 0.012;
  if (n2 >= 2 && r2.add(av(i2.neck + 9e-4, 11e-4, 14, 4).translate(0, m2 + 3e-3, 0), U(`linen`, { color: `#b8a070` })), n2 >= 3) {
    let e5 = H(p2 * 1.3, 42e-4, p2 * 1.3, 12, 5);
    e5.translate(0, a2 + 0.011, 0), r2.add(e5, { color: t2.wax, rough: 0.35, metal: 0, detail: B.GEM, wear: 0 });
    for (let e6 = 0; e6 < 3; e6 += 1) {
      let n3 = e6 / 3 * c_ + 0.4;
      r2.add(H(22e-4, 55e-4, 18e-4, 6, 4).translate(Math.sin(n3) * p2 * 1.15, a2 + 6e-3, Math.cos(n3) * p2 * 1.15), { color: t2.wax, rough: 0.35, metal: 0, detail: B.GEM, wear: 0 });
    }
  }
  if (n2 >= 5) {
    let e5 = i2.prof.filter((e6) => e6[1] > 3e-3 && e6[1] <= m2 + 1e-3);
    for (let t3 = 0; t3 < 4; t3 += 1) {
      let n3 = t3 / 4 * c_ + Math.PI / 4, i3 = e5.map(([e6, t4]) => [Math.sin(n3) * (e6 + 12e-4), t4, Math.cos(n3) * (e6 + 12e-4)]);
      r2.add(V(i3, [8e-4, 18e-4], 4, 12, { up: [Math.sin(n3), 0, Math.cos(n3)] }), U(`gold`));
    }
    r2.add(av(i2.neck + 16e-4, 18e-4, 12, 4).translate(0, m2, 0), U(`gold`)), r2.add(av(0.026, 16e-4, 14, 4).translate(0, 4e-3, 0), U(`gold`));
  }
  return Ty(r2, 0.012);
}
function _y(e4, t2) {
  let n2 = new pv(), r2 = 0.12, i2 = 0.0115, a2 = X_([[0, -r2 / 2], [i2 * 0.9, -r2 / 2], [i2, -r2 / 2 + 3e-3], [i2 * 0.97, 0], [i2, r2 / 2 - 3e-3], [i2 * 0.9, r2 / 2], [0, r2 / 2]], 14);
  n2.add(a2, U(`parchment`, { paint: (e5, t3) => {
    if (Math.abs(e5.p.y) > r2 / 2 - 5e-4) {
      let n3 = Math.hypot(e5.p.x, e5.p.z);
      Math.sin(n3 * 1400) > 0.55 && t3.multiplyScalar(0.62);
    }
    t3.multiplyScalar(0.9 + 0.15 * o_(e5.p.x * 90, e5.p.y * 90, e5.p.z * 90, 2, 4));
  } }));
  let o2 = rv(2, 6, (e5, t3) => {
    let n3 = R(-r2 / 2 + 6e-3, r2 / 2 - 6e-3, e5), a3 = -Math.PI / 2 - t3 * 1.6, o3 = i2 + t3 * 0.016;
    return [Math.sin(a3) * o3 * 1 + 4e-3 * t3, n3, Math.cos(a3) * o3 - 2e-3];
  }, 7e-4, (e5) => new N(e5.x, 0, e5.z).normalize());
  n2.add(o2, U(`parchment`, { colors: { 1: `#b8a478` } })), n2.add(av(i2 + 6e-4, 14e-4, 16, 4, 62e-4), U(`cloth`, { color: e4, colors: {} }));
  let s2 = X_([[0, 0], [62e-4, 0], [72e-4, 12e-4], [66e-4, 26e-4], [0, 3e-3]], 12);
  s2.rotateX(Math.PI / 2).translate(0, 0, i2 + 12e-4), n2.add(s2, { color: t2, rough: 0.35, metal: 0, detail: B.GEM, wear: 0.1, paint: (e5, t3) => {
    let n3 = Math.hypot(e5.p.x, e5.p.y);
    n3 > 28e-4 && n3 < 38e-4 && t3.multiplyScalar(0.6);
  } });
  for (let t3 of [1, -1]) n2.add(rv(1, 4, (e5, n3) => [t3 * 2e-3 + (e5 - 0.5) * 4e-3 + t3 * n3 * 3e-3, -4e-3 - n3 * 0.022, i2 + 18e-4 + n3 * 2e-3], 6e-4, () => new N(0, 0, 1)), U(`cloth`, { color: e4 }));
  for (let e5 of n2.parts) e5.geo.rotateZ(-0.72);
  return Ty(n2, 0.012);
}
function vy(e4, t2) {
  let n2 = new pv(), r2 = 0.1, i2 = 0.14, a2 = 0.042, o2 = 6e-3;
  for (let t3 of [a2 / 2 - o2 / 2, -a2 / 2 + o2 / 2]) n2.add(ev(r2, i2, o2, 25e-4, 8).translate(2e-3, 0, t3), U(`redLeather`, { color: e4, wear: 0.4 }));
  n2.add(ev(0.016, i2 - 2e-3, a2, 7e-3, 10).translate(-r2 / 2 + 6e-3, 0, 0), U(`redLeather`, { color: e4, wear: 0.45 }));
  for (let t3 of [-0.045, 0, 0.045]) n2.add(ev(6e-3, 6e-3, a2 + 2e-3, 25e-4, 6).translate(-r2 / 2 - 1e-3, t3, 0), U(`redLeather`, { color: e4 }));
  let s2 = new cv();
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let t3 = a2 - 2 * o2 - 1e-3, n3 = -t3 / 2 + (e5 + 0.5) * (t3 / 5);
    s2.merge($_(r2 - 8e-3 - e5 % 2 * 15e-4, i2 - 9e-3, t3 / 5 - 4e-4).translate(45e-4 - e5 % 2 * 7e-4, 0, n3));
  }
  n2.add(s2, U(`parchment`, { color: `#d8c8a0`, wear: 0.2 }));
  for (let [e5, t3] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    let o3 = tv([[0, 0], [-0.02 * e5, 0], [0, -0.02 * t3]], 2e-3, { bevel: 6e-4, crease: 50 });
    o3.translate(e5 * (r2 / 2 + 1e-3) + 2e-3, t3 * (i2 / 2 + 5e-4), a2 / 2 + 6e-4), n2.add(o3, U(`bronze`));
  }
  n2.add(V([[r2 / 2 - 0.012, 0, -a2 / 2 - 5e-4], [r2 / 2 + 5e-3, 0, -a2 / 2 + 4e-3], [r2 / 2 + 6e-3, 0, a2 / 2 - 4e-3], [r2 / 2 - 0.016, 0, a2 / 2 + 8e-4]], [11e-4, 7e-3], 4, 12, { up: [1, 0, 0] }), U(`darkLeather`)), n2.add(ev(9e-3, 0.011, 3e-3, 1e-3, 6).translate(r2 / 2 - 0.018, 0, a2 / 2 + 15e-4), U(`bronze`));
  let c2 = a2 / 2 + 12e-4;
  if (t2 === `tp`) {
    n2.add(av(0.021, 22e-4, 24, 5).rotateX(Math.PI / 2).translate(2e-3, 4e-3, c2), dv(`#3c86ff`, 2.2)), n2.add(av(0.027, 14e-4, 24, 4).rotateX(Math.PI / 2).translate(2e-3, 4e-3, c2 - 4e-4), U(`gold`));
    for (let e5 = 0; e5 < 4; e5 += 1) {
      let t3 = e5 / 4 * c_ + Math.PI / 4;
      n2.add(tv([[-28e-4, 0], [28e-4, 0], [0, 0.012]], 16e-4, { crease: 50 }).translate(0, 0.029, 0).rotateZ(t3).translate(2e-3, 4e-3, c2), U(`gold`));
    }
    n2.add(cy({ sides: 10, r: 75e-4, star: true }).translate(2e-3, 4e-3, c2), ly(`#5aa0ff`, 0.9));
  } else {
    let e5 = [];
    for (let t3 = 0; t3 <= 20; t3 += 1) {
      let n3 = t3 / 20 * c_;
      e5.push([2e-3 + Math.cos(n3) * 0.026, 4e-3 + Math.sin(n3) * 0.011 * (1 - 0.15 * Math.cos(n3) * Math.cos(n3)), c2]);
    }
    n2.add(V(e5, [12e-4, 2e-3], 4, 40, { up: [0, 0, 1] }), U(`gold`)), n2.add(cy({ sides: 10, r: 85e-4, star: true, sy: 1 }).translate(2e-3, 4e-3, c2 - 4e-4), ly(`#ff2a24`, 1)), n2.add(H(18e-4, 62e-4, 12e-4, 6, 4).translate(2e-3, 4e-3, c2 + 62e-4), { color: `#0a0204`, rough: 0.2, metal: 0, detail: B.GEM, wear: 0 });
    for (let e6 of [1, -1]) n2.add(iv([2e-3 + e6 * 0.03, 4e-3, c2], [e6, 0, 0], 2e-3, 0.012, 4), U(`gold`));
  }
  return Ty(n2, 0.02);
}
function yy() {
  let e4 = new pv(), t2 = cy({ sides: 9, r: 0.0125, star: true, crown: 0.55, pav: 0.85, table: 0.5 }), n2 = new P();
  e4.add(t2, uv(`#ffffff`, 0.7, { rough: 0.04, paint: (e5, t3) => {
    let r2 = (Math.atan2(e5.n.y, e5.n.x) / c_ + 1 + e5.n.z * 0.15) % 1;
    n2.setHSL(r2, 0.85, 0.52), t3.copy(n2).multiplyScalar(0.75 + 0.5 * Ey(e5.n));
  }, pbr: (e5, t3) => {
    t3[2] = 0.55 + 0.5 * Ey(e5.n);
  } })), e4.add(av(0.0128, 11e-4, 18, 4).rotateX(Math.PI / 2).translate(0, 0, 4e-4), U(`gold`));
  for (let t3 = 0; t3 < 6; t3 += 1) {
    let n3 = t3 / 6 * c_;
    e4.add(V([[Math.cos(n3) * 0.0128, Math.sin(n3) * 0.0128, -2e-3], [Math.cos(n3) * 0.0122, Math.sin(n3) * 0.0122, 3e-3], [Math.cos(n3) * 98e-4, Math.sin(n3) * 98e-4, 55e-4]], 8e-4, 4, 4, { capStart: true, capEnd: true }), U(`gold`));
  }
  return Ty(e4, 0.01);
}
function by(e4, t2, n2, r2) {
  return rv(2, 7, (i2, a2) => {
    let o2 = n2 * Math.sin(Math.PI * a2 ** 0.75) * (a2 < 0.15 ? a2 / 0.15 : 1);
    return [e4[0] + (i2 - 0.5) * o2 + r2 * a2 * a2 * 0.5, e4[1] - a2 * t2, e4[2] + Math.abs(i2 - 0.5) * o2 * 0.35];
  }, 6e-4, () => new N(0, 0, 1));
}
function xy() {
  let e4 = new pv(), t2 = i_(42), n2 = 0.011, r2 = 12e-4, i2 = () => X_([[0, -r2], [n2, -r2], [n2, r2], [0, r2]], 9).creased(40), a2 = new cv(), o2 = [];
  for (let e5 = 0; e5 < 7; e5 += 1) {
    let n3 = e5 / 7 * c_ + t2() * 0.4, i3 = e5 === 0 ? 0 : 0.016 + t2() * 0.01;
    o2.push({ p: [Math.cos(n3) * i3, r2, Math.sin(n3) * i3], rx: (t2() - 0.5) * 0.15, rz: (t2() - 0.5) * 0.15 });
  }
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let n3 = e5 / 5 * c_ + 0.5, r3 = 9e-3 + t2() * 6e-3;
    o2.push({ p: [Math.cos(n3) * r3, 42e-4 + t2() * 1e-3, Math.sin(n3) * r3], rx: (t2() - 0.5) * 0.5, rz: (t2() - 0.5) * 0.5 });
  }
  o2.push({ p: [2e-3, 75e-4, -1e-3], rx: 0.25, rz: -0.2 }), o2.push({ p: [-4e-3, 0.0105, 3e-3], rx: -0.1, rz: 0.3 }), o2.push({ p: [0.018, 0.011, 6e-3], rx: 1.25, rz: 0.2 });
  for (let e5 of o2) {
    let t3 = i2();
    t3.rotateX(e5.rx).rotateZ(e5.rz).translate(e5.p[0], e5.p[1], e5.p[2]), a2.merge(t3);
  }
  return e4.add(a2, U(`gold`, { color: `#e0aa48`, paint: (e5, t3) => {
    let n3 = o_(e5.p.x * 900, e5.p.y * 900, e5.p.z * 900, 1, 2);
    t3.multiplyScalar(0.85 + 0.3 * n3);
  } })), Ty(e4, 0.012);
}
function Sy() {
  let e4 = new pv(), t2 = 0.26, n2 = 0.13, r2 = 0.17;
  e4.add(ev(t2, n2, r2, 8e-3, 10).translate(0, n2 / 2 + 0.012, 0), U(`darkWood`, { paint: (e5, t3) => {
    Math.abs(Math.sin(e5.p.y * 120)) < 0.08 && t3.multiplyScalar(0.6);
  } }));
  let i2 = X_([[0, -t2 / 2], [r2 / 2, -t2 / 2], [r2 / 2, t2 / 2], [0, t2 / 2]], 12, { phi0: 0, phiLen: Math.PI, capStart: true, capEnd: true });
  i2.rotateZ(Math.PI / 2).scale(1, 0.55, 1).translate(0, n2 + 0.012, 0), e4.add(i2, U(`darkWood`));
  for (let t3 of [-0.085, 0.085]) {
    let i3 = [[t3, 0.012, r2 / 2 + 2e-3]];
    i3.push([t3, n2 + 0.012, r2 / 2 + 2e-3]);
    for (let e5 = 0; e5 <= 10; e5 += 1) {
      let a3 = e5 / 10 * Math.PI;
      i3.push([t3, n2 + 0.012 + r2 / 2 * Math.sin(a3) * 0.55 + 2e-3, Math.cos(a3) * (r2 / 2 + 2e-3)]);
    }
    i3.push([t3, 0.012, -r2 / 2 - 2e-3]), e4.add(V(i3, [22e-4, 9e-3], 4, 34, { up: [1, 0, 0], linear: true }), U(`iron`));
  }
  for (let [i3, a3] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) e4.add($_(0.03, 0.03, 0.03).translate(i3 * (t2 / 2 - 0.012), 0.024, a3 * (r2 / 2 - 0.012)), U(`gold`)), e4.add($_(0.03, 0.026, 0.03).translate(i3 * (t2 / 2 - 0.012), n2 + 2e-3, a3 * (r2 / 2 - 0.012)), U(`gold`)), e4.add(H(0.012, 9e-3, 0.012, 6, 4).translate(i3 * (t2 / 2 - 0.02), 6e-3, a3 * (r2 / 2 - 0.02)), U(`gold`));
  let a2 = tv([[-0.022, 0.018], [0.022, 0.018], [0.022, -0.012], [0, -0.03], [-0.022, -0.012]], 5e-3, { bevel: 15e-4, crease: 50 });
  return a2.translate(0, n2 + 6e-3, r2 / 2 + 4e-3), e4.add(a2, U(`gold`)), e4.add($_(5e-3, 0.013, 4e-3).translate(0, n2 + 2e-3, r2 / 2 + 75e-4), U(`black`)), e4.add($_(t2 - 0.01, 35e-4, r2 - 0.01).translate(0, n2 + 0.0125, 0), dv(`#ffb347`, 1.8)), e4.add(V([[-0.04, n2 + 0.012 + r2 * 0.275, 0], [-0.03, n2 + 0.012 + r2 * 0.275 + 0.022, 0], [0.03, n2 + 0.012 + r2 * 0.275 + 0.022, 0], [0.04, n2 + 0.012 + r2 * 0.275, 0]], 35e-4, 6, 12), U(`gold`)), Ty(e4, 0.05);
}
function Cy(e4) {
  let t2 = Vy[e4];
  if (t2) return t2;
  if (e4.startsWith(`gem_`)) {
    let [, t3, n2] = e4.split(`_`);
    if (t3 in Dy || t3 === `skull`) {
      let e5 = Oy[n2];
      if (e5 !== void 0) return () => uy(t3, e5);
    }
  }
  if (e4.startsWith(`rune_`)) {
    let t3 = Number(e4.slice(5));
    if (t3 >= 1 && t3 <= 8) return () => fy(t3);
  }
}
function wy(e4) {
  return e4.startsWith(`gem_`) ? [0.6, 0.68, 0.76, 0.86, 0.96][Oy[e4.split(`_`)[2]] ?? 4] : e4.startsWith(`ring`) ? 0.82 : e4 === `hpPotion1` || e4 === `mpPotion1` ? 0.72 : e4 === `hpPotion2` || e4 === `mpPotion2` || e4 === `rejuvPotion` ? 0.8 : e4 === `hpPotion3` || e4 === `mpPotion3` || e4 === `staminaPotion` ? 0.88 : 1;
}
var Ty, Ey, Dy, Oy, ky, Ay, jy, My, Ny, Py, Fy, Iy, Ly, Ry, zy, By, Vy, Hy = t((() => {
  Ed(), U_(), lv(), __(), mv(), Ty = (e4, t2 = 0.02, n2 = [0, 0, 0]) => ({ builder: e4, tip: n2, kind: `misc`, aoDist: t2 }), Ey = (e4) => n_(Math.round(e4.x * 41) * 73856093 + Math.round(e4.y * 41) * 19349663 + Math.round(e4.z * 41) * 83492791), Dy = { amethyst: `#8a2ee0`, topaz: `#f09a10`, sapphire: `#1c44f0`, emerald: `#0ea844`, ruby: `#e00a22`, diamond: `#d8e2ee` }, Oy = { chipped: 0, flawed: 1, normal: 2, flawless: 3, perfect: 4 }, ky = (e4, t2, n2, r2 = 10) => {
    let i2 = [];
    for (let a2 = 0; a2 <= r2; a2 += 1) i2.push([e4 + Math.cos(a2 / r2 * c_) * n2, t2 + Math.sin(a2 / r2 * c_) * n2]);
    return i2;
  }, Ay = { 1: [[[0, -1], [0, 1]], [[0, 0.32], [0.62, 0.86]], [[0, -0.3], [0.62, 0.24]]], 2: [[[-0.7, 1], [0, -1], [0.7, 1]], [[-0.62, 0.12], [0.62, 0.12]]], 3: [[[-0.72, -0.95], [0, 0.95], [0.72, -0.95]], [[0, -1], [0, 0.25]]], 4: [[[-0.5, -1], [-0.5, 1], [0.5, -1], [0.5, 1]], [[0.5, 1], [0.82, 0.68]]], 5: [ky(0, 0, 0.58), [[-0.75, -1], [0.75, 1]]], 6: [[[-0.7, -0.45], [-0.7, 0.95], [0, 0.2], [0.7, 0.95], [0.7, -0.45]], [[0, -0.7], [0, -1]]], 7: [[[-0.6, 0.55], [-0.6, -0.45], [0, -1], [0.6, -0.45], [0.6, 0.55]], [[-0.8, 0.95], [0.8, 0.95]]], 8: [[[-0.7, 0.9], [0.7, 0.9], [-0.7, -0.9], [0.7, -0.9]], [[-0.45, 0], [0.45, 0]], [[-0.7, 0.9], [-0.7, 0.5]]] }, jy = [`#3e3c3a`, `#353331`, `#45423c`, `#3b3631`, `#323638`, `#3e3935`, `#363330`, `#403c37`], My = { ring1: () => {
    let e4 = new pv(), t2 = 0.0105;
    e4.add(py(t2, 16e-4, 24e-4), U(`gold`));
    for (let n2 of [1, -1]) e4.add(V([[n2 * 45e-4, t2 - 4e-4, 0], [n2 * 26e-4, t2 + 16e-4, 0]], [16e-4, 22e-4], 6, 2, { up: [0, 0, 1], capStart: true, capEnd: true }), U(`gold`));
    e4.add(X_([[0, 0], [42e-4, 0], [52e-4, 16e-4], [54e-4, 3e-3], [46e-4, 36e-4]], 12).translate(0, t2 + 8e-4, 0), U(`gold`));
    for (let n2 = 0; n2 < 4; n2 += 1) {
      let r2 = n2 / 4 * c_ + Math.PI / 4;
      e4.add(V([[Math.sin(r2) * 48e-4, t2 + 34e-4, Math.cos(r2) * 48e-4], [Math.sin(r2) * 44e-4, t2 + 56e-4, Math.cos(r2) * 44e-4]], 6e-4, 4, 1, { capEnd: true, linear: true }), U(`gold`));
    }
    return e4.add(my({ sides: 10, r: 46e-4, star: true, crown: 0.5, pav: 0.6 }).translate(0, t2 + 62e-4, 0), ly(`#e01828`, 0.6)), Ty(e4, 6e-3);
  }, ring2: () => {
    let e4 = new pv(), t2 = 0.0105;
    for (let n2 of [1, -1]) {
      let r2 = [];
      for (let e5 = 0; e5 <= 48; e5 += 1) {
        let i2 = e5 / 48 * c_, a2 = t2 + Math.cos(i2 * 7) * 6e-4 * n2;
        r2.push([Math.sin(i2) * a2, Math.cos(i2) * a2, Math.sin(i2 * 7) * 11e-4 * n2]);
      }
      e4.add(V(r2, 105e-5, 5, 56), U(`silver`));
    }
    return e4.add(X_([[0, -4e-4], [48e-4, -4e-4], [56e-4, 12e-4], [5e-3, 24e-4]], 12, { sx: 1, sz: 0.74 }).translate(0, t2 + 6e-4, 0), U(`silver`)), e4.add(my({ sides: 12, r: 48e-4, sx: 1, sy: 0.74, star: true, crown: 0.55, pav: 0.55 }).translate(0, t2 + 34e-4, 0), ly(`#2c58ff`, 0.65)), Ty(e4, 6e-3);
  }, ring3: () => {
    let e4 = new pv(), t2 = 0.0105, n2 = py(t2, 19e-4, 28e-4, 24);
    n2.deform((e5) => {
      let n3 = z(0.4, 1, e5.y / t2);
      e5.z *= 1 + n3 * 0.7;
    }), n2.computeNormals(), e4.add(n2, U(`bronze`, { wear: 0.5 }));
    let r2 = tv(Array.from({ length: 8 }, (e5, t3) => {
      let n3 = (t3 + 0.5) / 8 * c_;
      return [Math.cos(n3) * 68e-4, Math.sin(n3) * 58e-4];
    }), 22e-4, { bevel: 7e-4, bevelSegs: 1, crease: 50 });
    r2.rotateX(-Math.PI / 2).translate(0, t2 + 24e-4, 0), e4.add(r2, U(`bronze`));
    let i2 = new cv();
    for (let e5 of [[[-0.6, -0.7], [0, 0.8], [0.6, -0.7]], [[-0.7, -0.1], [0.7, -0.1]]]) for (let n3 = 0; n3 < e5.length - 1; n3 += 1) {
      let r3 = [e5[n3][0] * 42e-4, t2 + 47e-4, -e5[n3][1] * 36e-4], a2 = [e5[n3 + 1][0] * 42e-4, t2 + 47e-4, -e5[n3 + 1][1] * 36e-4];
      i2.merge(V([r3, a2], [45e-5, 6e-4], 4, 1, { up: [0, 1, 0], linear: true, capStart: true, capEnd: true }));
    }
    return e4.add(i2, dv(`#ffb048`, 2)), Ty(e4, 6e-3);
  }, ring4: () => {
    let e4 = new pv(), t2 = 0.0105, n2 = py(t2, 18e-4, 26e-4, 24);
    n2.deform((e5) => {
      let t3 = Math.atan2(e5.x, e5.y), n3 = 1 + 0.12 * Math.sin(t3 * 12);
      e5.z *= n3;
    }), n2.computeNormals(), e4.add(n2, U(`bone`, { color: `#d6c8a6`, wear: 0.55 }));
    let r2 = H(42e-4, 46e-4, 44e-4, 10, 8);
    for (let e5 of [1, -1]) r2.bulge([e5 * 15e-4, -3e-4, 41e-4], 13e-4, -11e-4);
    r2.computeNormals(), r2.translate(0, t2 + 36e-4, 6e-4), e4.add(r2, U(`bone`, { color: `#e0d4b6`, paint: (e5, n3) => {
      for (let r3 of [1, -1]) Math.hypot(e5.p.x - r3 * 15e-4, e5.p.y - (t2 + 33e-4)) < 11e-4 && e5.p.z > 3e-3 && n3.set(`#120c08`);
    } }));
    for (let n3 of [1, -1]) e4.add(H(45e-5, 45e-5, 3e-4, 5, 3).translate(n3 * 15e-4, t2 + 33e-4, 43e-4), dv(`#7dffb0`, 3));
    return Ty(e4, 6e-3);
  }, ring5: () => {
    let e4 = new pv(), t2 = 0.0108;
    e4.add(py(t2, 19e-4, 26e-4), U(`black`, { color: `#26262a`, rough: 0.4, metal: 0.9 }));
    for (let t3 of [1, -1]) e4.add(iv([t3 * 98e-4, 46e-4, 0], [t3, 0.25, 0], 11e-4, 42e-4, 5), U(`darkSteel`));
    for (let n2 = 0; n2 < 4; n2 += 1) {
      let r2 = n2 / 4 * c_ + Math.PI / 4, i2 = [[Math.sin(r2) * 24e-4, t2 + 6e-4, Math.cos(r2) * 24e-4], [Math.sin(r2) * 58e-4, t2 + 34e-4, Math.cos(r2) * 58e-4], [Math.sin(r2) * 36e-4, t2 + 72e-4, Math.cos(r2) * 36e-4]];
      e4.add(V(i2, (e5) => 9e-4 * (1 - e5 * 0.6), 4, 5, { capStart: true, capEnd: true }), U(`darkSteel`));
    }
    return e4.add(my({ sides: 8, r: 46e-4, crown: 0.6, pav: 0.9, table: 0.4 }).translate(0, t2 + 5e-3, 0), ly(`#1cbc58`, 0.7)), Ty(e4, 6e-3);
  } }, Ny = { amulet1: () => {
    let e4 = new pv(), t2 = X_([[0, -18e-4], [0.0136, -18e-4], [0.0138, 18e-4], [0.0128, 32e-4], [0.011, 22e-4], [0, 22e-4]], 18);
    t2.rotateX(Math.PI / 2), e4.add(t2, U(`gold`, { paint: (e5, t3) => {
      let n3 = Math.hypot(e5.p.x, e5.p.y);
      n3 < 0.0108 && n3 > 85e-4 && t3.multiplyScalar(0.7);
    } }));
    let n2 = new cv();
    for (let e5 = 0; e5 < 12; e5 += 1) {
      let t3 = e5 / 12 * c_, r3 = tv([[-24e-4, 0], [24e-4, 0], [0, e5 % 2 ? 55e-4 : 85e-4]], 18e-4, { bevel: 4e-4, crease: 50 });
      r3.translate(0, 0.0128, 0).rotateZ(t3), n2.merge(r3);
    }
    e4.add(n2, U(`gold`));
    let r2 = cy({ sides: 10, r: 62e-4, star: true, crown: 0.5, pav: 0.5 });
    r2.translate(0, 0, 24e-4), e4.add(r2, ly(`#ff5a1a`, 0.75)), e4.add(av(26e-4, 7e-4, 10, 4).rotateZ(Math.PI / 2).translate(0, 0.0228, 0), U(`gold`));
    let i2 = hy(0.0245, 0.0105, 0.0125, `gold`);
    return e4.add(i2.geo, i2.spec), Ty(e4, 8e-3);
  }, amulet2: () => {
    let e4 = new pv(), t2 = 0.018, n2 = 0.0145, r2 = [];
    for (let e5 = 0; e5 <= 16; e5 += 1) {
      let n3 = 0.7024 - e5 / 16 * 4.5464;
      r2.push([Math.cos(n3) * t2, Math.sin(n3) * t2]);
    }
    for (let e5 = 1; e5 < 14; e5 += 1) {
      let t3 = 2.816 + e5 / 14 * 3.7925;
      r2.push([Math.cos(t3) * n2, 7e-3 + Math.sin(t3) * n2]);
    }
    let i2 = tv(r2, 26e-4, { bevel: 9e-4, bevelSegs: 2, crease: 60 });
    e4.add(i2, U(`silver`));
    let a2 = cy({ sides: 10, r: 46e-4, pear: true, star: true, crown: 0.5, pav: 0.6, sy: 1.1 });
    a2.rotateZ(Math.PI).translate(0, 8e-4, 6e-4), e4.add(a2, ly(`#3a6cff`, 0.8)), e4.add(V([[0, 46e-4, 4e-4], [0, 92e-4, 4e-4]], 5e-4, 4, 2, { linear: true }), U(`silver`));
    for (let [t3, n3] of [[-9e-3, -6e-3], [95e-4, -55e-4], [0, -0.0135]]) e4.add(H(1e-3, 1e-3, 6e-4, 6, 3).translate(t3, n3, 24e-4), dv(`#bcd8ff`, 1.8));
    e4.add(av(24e-4, 7e-4, 10, 4).rotateZ(Math.PI / 2).translate(0, 0.0165, 0), U(`silver`));
    let o2 = hy(0.0182, 98e-4, 0.012, `silver`);
    return e4.add(o2.geo, o2.spec), Ty(e4, 8e-3);
  }, amulet3: () => {
    let e4 = new pv(), t2 = tv([[-0.0145, 0.011], [0.0145, 0.011], [45e-4, -0.0175], [-45e-4, -0.0175]], 32e-4, { bevel: 11e-4, bevelSegs: 2, crease: 50 });
    e4.add(t2, U(`darkSteel`, { color: `#3a3836`, wear: 0.6 }));
    let n2 = V([[-0.0145, 0.011, 22e-4], [0.0145, 0.011, 22e-4], [45e-4, -0.0175, 22e-4], [-45e-4, -0.0175, 22e-4], [-0.0145, 0.011, 22e-4]], 9e-4, 4, 28, { linear: true });
    e4.add(n2, U(`bone`));
    let r2 = cy({ sides: 10, r: 55e-4, sx: 1.45, sy: 0.6, crown: 0.6, pav: 0.5, table: 0.35 });
    r2.translate(0, 12e-4, 26e-4), e4.add(r2, ly(`#3cff7a`, 1.1)), e4.add(H(11e-4, 28e-4, 8e-4, 6, 4).translate(0, 12e-4, 48e-4), dv(`#06120a`, 0, { color: `#06120a`, emit: 0 }));
    for (let t3 of [-45e-4, 0, 45e-4]) e4.add(iv([t3, -0.016 + Math.abs(t3) * 0.6, 0], [t3 * 30, -1, 0.15], 16e-4, t3 === 0 ? 0.011 : 8e-3, 5, 0.1), U(`bone`, { color: `#e0d2b0` }));
    e4.add(av(24e-4, 7e-4, 10, 4).rotateZ(Math.PI / 2).translate(0, 0.0145, 0), U(`darkSteel`));
    let i2 = hy(0.0162, 98e-4, 0.0118, `darkSteel`);
    return e4.add(i2.geo, i2.spec), Ty(e4, 8e-3);
  } }, Py = { vial: { prof: [[0, 0], [0.012, 0], [0.0155, 3e-3], [0.017, 0.012], [0.0172, 0.036], [0.015, 0.046], [9e-3, 0.052], [72e-4, 0.058], [72e-4, 0.064], [94e-4, 0.066], [94e-4, 0.069], [66e-4, 0.07]], liquid: 0.045, neck: 72e-4 }, small: { prof: [[0, 0], [0.01, 5e-4], [0.019, 6e-3], [0.024, 0.022], [0.023, 0.034], [0.017, 0.046], [85e-4, 0.053], [76e-4, 0.066], [0.01, 0.069], [0.01, 0.072], [7e-3, 0.073]], liquid: 0.041, neck: 76e-4 }, round: { prof: [[0, 0], [0.014, 5e-4], [0.026, 8e-3], [0.032, 0.028], [0.031, 0.043], [0.023, 0.058], [0.011, 0.066], [9e-3, 0.084], [0.0118, 0.087], [0.0118, 0.091], [86e-4, 0.092]], liquid: 0.052, neck: 9e-3 }, tall: { prof: [[0, 0], [0.02, 0], [0.026, 4e-3], [0.027, 0.012], [0.028, 0.06], [0.026, 0.074], [0.016, 0.086], [95e-4, 0.094], [9e-3, 0.108], [0.012, 0.111], [0.012, 0.115], [88e-4, 0.116]], liquid: 0.072, neck: 9e-3 }, grand: { prof: [[0, 0], [0.02, 0], [0.034, 8e-3], [0.04, 0.03], [0.039, 0.052], [0.031, 0.072], [0.018, 0.088], [0.011, 0.098], [0.0105, 0.114], [0.0138, 0.118], [0.0138, 0.123], [98e-4, 0.124]], liquid: 0.074, neck: 0.0105 }, squat: { prof: [[0, 0], [0.016, 0], [0.024, 6e-3], [0.026, 0.016], [0.022, 0.03], [0.012, 0.038], [75e-4, 0.046], [75e-4, 0.054], [96e-4, 0.056], [96e-4, 0.06], [7e-3, 0.061]], liquid: 0.029, neck: 75e-4 }, globe: { prof: [[0, 0], [0.016, 5e-4], [0.03, 9e-3], [0.037, 0.032], [0.036, 0.048], [0.027, 0.064], [0.013, 0.073], [0.0105, 0.09], [0.0132, 0.093], [0.0132, 0.097], [95e-4, 0.098]], liquid: 0.06, neck: 0.0105 }, slender: { prof: [[0, 0], [0.012, 0], [0.016, 4e-3], [0.017, 0.06], [0.015, 0.07], [9e-3, 0.078], [68e-4, 0.088], [86e-4, 0.091], [86e-4, 0.094], [62e-4, 0.095]], liquid: 0.066, neck: 68e-4 } }, Fy = { liquid: `#d0141e`, deep: `#5a0408`, emit: 0.5, wax: `#4a0a0a` }, Iy = { liquid: `#2446ff`, deep: `#081050`, emit: 0.55, wax: `#0c1a4a` }, Ly = { liquid: `#a12cff`, deep: `#300a5a`, emit: 0.62, wax: `#2a0c40` }, Ry = { liquid: `#ecc84a`, deep: `#6a4a08`, emit: 0.42, wax: `#4a3410` }, zy = { hpPotion1: () => gy(`vial`, Fy, 1), hpPotion2: () => gy(`small`, Fy, 2), hpPotion3: () => gy(`round`, Fy, 3), hpPotion4: () => gy(`tall`, Fy, 4), hpPotion5: () => gy(`grand`, Fy, 5), mpPotion1: () => gy(`vial`, Iy, 1), mpPotion2: () => gy(`small`, Iy, 2), mpPotion3: () => gy(`round`, Iy, 3), mpPotion4: () => gy(`tall`, Iy, 4), mpPotion5: () => gy(`grand`, Iy, 5), rejuvPotion: () => gy(`squat`, Ly, 2), fullRejuvPotion: () => gy(`globe`, Ly, 5), staminaPotion: () => gy(`slender`, Ry, 2) }, By = { charmSmall: () => {
    let e4 = new pv(), t2 = 0.016, n2 = 0.02, r2 = 75e-4, i2 = H(t2, n2, r2, 14, 9);
    i2.noise(8e-4, 120, 3).computeNormals(), e4.add(i2, U(`darkStone`, { color: `#34403c`, paint: (e5, t3) => t3.multiplyScalar(0.85 + 0.3 * o_(e5.p.x * 200, e5.p.y * 200, e5.p.z * 200, 2, 5)) }));
    let a2 = [];
    for (let e5 = 0; e5 <= 22; e5 += 1) {
      let i3 = e5 / 22, o2 = i3 * Math.PI * 3.4, s2 = 18e-4 + i3 * 88e-4, c2 = Math.cos(o2) * s2, l2 = Math.sin(o2) * s2 * 1.15 - 1e-3, u2 = r2 * Math.sqrt(Math.max(0, 1 - (c2 / t2) ** 2 - (l2 / n2) ** 2)) - 2e-4;
      a2.push([c2, l2, u2]);
    }
    return e4.add(V(a2, [6e-4, 11e-4], 4, 34, { up: [0, 0, 1], capStart: true, capEnd: true }), dv(`#5cffd8`, 2.2)), e4.add(av(42e-4, 11e-4, 12, 4).rotateZ(Math.PI / 2).translate(0, n2 + 28e-4, 0), U(`redLeather`, { color: `#7a2a18` })), Ty(e4, 0.01);
  }, charmLarge: () => {
    let e4 = new pv();
    e4.add(V([[0, 0.03, 0], [4e-3, 0.012, 1e-3], [9e-3, -8e-3, 2e-3], [8e-3, -0.026, 2e-3], [1e-3, -0.04, 1e-3]], (e5) => [85e-4 * (1 - e5 * 0.92) + 6e-4, 7e-3 * (1 - e5 * 0.92) + 5e-4], 8, 16, { capStart: true, capEnd: true, up: [0, 0, 1] }), U(`bone`, { color: `#e2d6b8`, paint: (e5, t2) => {
      t2.lerp(new P(`#7a5a38`), z(-0.02, -0.04, e5.p.y) * 0.6), t2.lerp(new P(`#9a8a6a`), z(0.02, 0.03, e5.p.y) * 0.5);
    } }));
    for (let t2 of [0.021, 0.016]) e4.add(av(86e-4, 9e-4, 14, 4).translate(12e-4, t2, 2e-4), U(`gold`));
    return e4.add(H(42e-4, 42e-4, 42e-4, 10, 7).translate(0, 0.0345, 0), ly(`#c82020`, 0.35)), e4.add(av(36e-4, 1e-3, 10, 4).rotateZ(Math.PI / 2).translate(0, 0.0408, 0), U(`darkLeather`)), e4.add(by([-6e-3, 0.02, -2e-3], 0.034, 8e-3, -0.01), U(`cloth`, { color: `#3a4a5a`, paint: (e5, t2) => {
      t2.lerp(new P(`#d8d0c0`), z(5e-3, -0.012, e5.p.y)), Math.abs(e5.p.y + 2e-3) < 25e-4 && t2.multiplyScalar(0.4);
    } })), Ty(e4, 0.012);
  }, charmGrand: () => {
    let e4 = new pv(), t2 = V([[0, -0.055, 0], [4e-3, -0.02, 1e-3], [2e-3, 0.015, 2e-3], [-3e-3, 0.045, 1e-3], [-2e-3, 0.06, 0]], (e5) => {
      let t3 = 0.0105 * (1 - e5 * 0.45), n3 = 1 + 0.12 * Math.max(0, Math.sin(e5 * Math.PI * 9));
      return [t3 * n3, t3 * n3 * 0.85];
    }, 9, 30, { capStart: true, capEnd: true, up: [0, 0, 1] });
    e4.add(t2, U(`bone`, { color: `#b49c74`, paint: (e5, t3) => {
      t3.lerp(new P(`#4a3420`), z(-0.03, -0.055, e5.p.y) * 0.7), Math.abs(Math.sin(e5.p.y * 520)) < 0.15 && t3.multiplyScalar(0.7);
    } })), e4.add(V([[0, -0.04, 0], [0, -0.024, 0]], [0.0122, 0.0108], 9, 6, {}), U(`darkLeather`, { paint: (e5, t3) => {
      Math.abs(Math.sin(e5.p.y * 900)) < 0.2 && t3.multiplyScalar(0.55);
    } }));
    let n2 = cy({ sides: 10, r: 55e-4, sx: 1, sy: 1.2, star: true });
    n2.translate(-1e-3, 0.034, 88e-4), e4.add(n2, ly(`#b04cff`, 1)), e4.add(av(6e-3, 11e-4, 14, 4).rotateX(Math.PI / 2).translate(-1e-3, 0.034, 82e-4), U(`gold`));
    for (let t3 of [1, -1]) e4.add(V([[t3 * 95e-4, -0.03, 2e-3], [t3 * 0.014, -0.04, 3e-3], [t3 * 0.015, -0.05, 3e-3]], 6e-4, 3, 5), U(`darkLeather`)), e4.add(by([t3 * 0.015, -0.05, 3e-3], 0.04, 9e-3, t3 * 0.01), U(`cloth`, { color: t3 > 0 ? `#5a2a1a` : `#2a3a2a`, paint: (e5, t4) => {
      t4.lerp(new P(`#e0d8c8`), z(-0.07, -0.09, e5.p.y)), Math.abs(e5.p.y + 0.072) < 3e-3 && t4.multiplyScalar(0.35);
    } })), e4.add(H(24e-4, 24e-4, 24e-4, 6, 4).translate(t3 * 0.0145, -0.048, 3e-3), U(`bronze`));
    return Ty(e4, 0.015);
  } }, Vy = { ...My, ...Ny, ...zy, ...By, tpScroll: () => _y(`#2a50c8`, `#1c2a7a`), idScroll: () => _y(`#b82020`, `#6a0e0e`), tpTome: () => vy(`#1c2a52`, `tp`), idTome: () => vy(`#4e1414`, `id`), jewel: yy, gold: xy, coffer: Sy };
}));
function Uy(e4) {
  return kv[e4] ?? ry[e4] ?? Cy(e4);
}
function Wy(e4) {
  let t2 = Gy.get(e4);
  if (t2) return t2;
  let n2 = Uy(e4);
  if (!n2) return null;
  let r2 = n2(), { geometry: i2, triangles: a2 } = r2.builder.build(r2.aoDist ?? 0.06);
  i2.computeBoundingBox();
  let o2 = i2.boundingBox.clone(), s2 = o2.getSize(new N()), c2 = { geometry: i2, triangles: a2, tip: new N(...r2.tip), kind: r2.kind, bounds: o2, length: Math.max(s2.x, s2.y, s2.z) };
  return Gy.set(e4, c2), c2;
}
var Gy, Ky = t((() => {
  Ed(), Av(), sy(), Hy(), Gy = /* @__PURE__ */ new Map();
}));
function qy(e4) {
  let t2 = Wy(e4);
  return t2 ? { geometry: t2.geometry, tip: t2.tip, kind: t2.kind, length: t2.length } : null;
}
var Jy = t((() => {
  Ky();
}));
function Yy(e4, t2, n2) {
  nb.copy(e4).normalize(), eb.crossVectors(t2, nb), eb.lengthSq() < 1e-10 && (eb.set(1, 0, 0).cross(nb), eb.lengthSq() < 1e-10 && eb.set(0, 1, 0).cross(nb)), eb.normalize(), tb.crossVectors(nb, eb), n2.makeBasis(eb, tb, nb);
}
function Xy(e4, t2, n2, r2, i2) {
  return Yy(e4, t2, Qy), Yy(n2, r2, $y), $y.multiply(Qy.transpose()), i2.setFromRotationMatrix($y);
}
function Zy(e4, t2, n2, r2, i2, a2, o2, s2, c2, l2, u2, d2) {
  rb.subVectors(t2, e4);
  let f2 = rb.length(), p2 = (n2 + r2) * 0.9995, m2 = Math.abs(n2 - r2) + 1e-4;
  f2 < 1e-6 ? (rb.set(0, -1, 0), f2 = m2) : rb.divideScalar(f2);
  let h2 = f2 > p2 ? p2 : f2 < m2 ? m2 : f2, g2 = (n2 * n2 + h2 * h2 - r2 * r2) / (2 * n2 * h2), _2 = Math.sqrt(Math.max(0, 1 - g2 * g2));
  return ib.copy(i2).addScaledVector(rb, -i2.dot(rb)), ib.lengthSq() < 1e-8 && ib.set(0, 0, 1).addScaledVector(rb, -rb.z), ib.normalize(), ab.copy(e4).addScaledVector(rb, n2 * g2).addScaledVector(ib, n2 * _2), cb.copy(e4).addScaledVector(rb, h2), ob.subVectors(ab, e4).normalize(), sb.subVectors(cb, ab).normalize(), Xy(a2, s2, ob, ib, c2), Xy(o2, s2, sb, ib, l2), u2 && u2.copy(ab), d2 && d2.copy(cb), f2 - h2;
}
var Qy, $y, eb, tb, nb, rb, ib, ab, ob, sb, cb, lb, ub = t((() => {
  Ed(), Qy = new wr(), $y = new wr(), eb = new N(), tb = new N(), nb = new N(), rb = new N(), ib = new N(), ab = new N(), ob = new N(), sb = new N(), cb = new N(), lb = class {
    def;
    bones;
    pos;
    quat;
    tmp = new N();
    constructor(e4, t2) {
      this.def = e4, this.bones = t2, this.pos = t2.map(() => new N()), this.quat = t2.map(() => new ir());
    }
    update() {
      let e4 = this.def.parentIndex;
      for (let t2 = 0; t2 < this.bones.length; t2 += 1) {
        let n2 = this.bones[t2], r2 = e4[t2];
        r2 < 0 ? (this.pos[t2].copy(n2.position), this.quat[t2].copy(n2.quaternion)) : (this.tmp.copy(n2.position).applyQuaternion(this.quat[r2]), this.pos[t2].copy(this.pos[r2]).add(this.tmp), this.quat[t2].multiplyQuaternions(this.quat[r2], n2.quaternion));
      }
    }
    updateChain(e4) {
      let t2 = [], n2 = e4;
      for (; n2 >= 0; ) t2.push(n2), n2 = this.def.parentIndex[n2];
      for (let e5 = t2.length - 1; e5 >= 0; --e5) {
        let n3 = t2[e5], r2 = this.bones[n3], i2 = this.def.parentIndex[n3];
        i2 < 0 ? (this.pos[n3].copy(r2.position), this.quat[n3].copy(r2.quaternion)) : (this.tmp.copy(r2.position).applyQuaternion(this.quat[i2]), this.pos[n3].copy(this.pos[i2]).add(this.tmp), this.quat[n3].multiplyQuaternions(this.quat[i2], r2.quaternion));
      }
    }
  };
})), db, fb, pb, mb, hb, gb, _b, vb, yb = t((() => {
  Ed(), __(), db = new N(), fb = new ir(), pb = new N(), mb = new N(), hb = new N(), gb = new N(), _b = new Pr(0, 0, 0, `XZY`), vb = class {
    def;
    bones;
    anchor;
    ax;
    az;
    vx;
    vz;
    prevPos = new N();
    prevVel = new N();
    accS = new N();
    velS = new N();
    initialized = false;
    driveX = 0;
    driveZ = 0;
    gravityScale = 1;
    phase;
    constructor(e4, t2, n2) {
      this.def = { bones: e4.bones, stiffness: e4.stiffness ?? 90, damping: e4.damping ?? 11, gravity: e4.gravity ?? 0.6, inertia: e4.inertia ?? 0.02, drag: e4.drag ?? 0.05, restX: e4.restX ?? 0, restZ: e4.restZ ?? 0, curlX: e4.curlX ?? 0, xMin: e4.xMin ?? -1.2, xMax: e4.xMax ?? 1.2, zMin: e4.zMin ?? -0.9, zMax: e4.zMax ?? 0.9, falloff: e4.falloff ?? 0.8, sway: e4.sway ?? 0.03, swaySpeed: e4.swaySpeed ?? 1.3, id: e4.id ?? e4.bones[0] }, this.bones = e4.bones.map((e5) => {
        let n3 = t2.get(e5);
        if (!n3) throw Error(`spring: no bone ${e5}`);
        return n3;
      }), this.anchor = this.bones[0].parent;
      let r2 = this.bones.length;
      this.ax = new Float32Array(r2), this.az = new Float32Array(r2), this.vx = new Float32Array(r2), this.vz = new Float32Array(r2);
      for (let e5 = 0; e5 < r2; e5 += 1) this.ax[e5] = e5 === 0 ? this.def.restX : this.def.curlX, this.az[e5] = e5 === 0 ? this.def.restZ : 0;
      this.phase = n2 % 1e3 * 0.0137;
    }
    reset() {
      this.initialized = false;
      for (let e4 = 0; e4 < this.bones.length; e4 += 1) this.vx[e4] = 0, this.vz[e4] = 0;
    }
    update(e4, t2) {
      if (e4 <= 0) return;
      let n2 = this.def;
      this.anchor.matrixWorld.decompose(db, fb, pb), this.initialized ||= (this.prevPos.copy(db), this.prevVel.set(0, 0, 0), this.velS.set(0, 0, 0), this.accS.set(0, 0, 0), true);
      let r2 = 1 / Math.max(e4, 1e-3);
      mb.subVectors(db, this.prevPos).multiplyScalar(r2), mb.lengthSq() > 400 && mb.setLength(20), hb.subVectors(mb, this.prevVel).multiplyScalar(r2), hb.lengthSq() > 3600 && hb.setLength(60), this.prevPos.copy(db), this.prevVel.copy(mb);
      let i2 = 1 - Math.exp(-e4 * 18);
      this.velS.lerp(mb, i2), this.accS.lerp(hb, i2), fb.invert(), mb.copy(this.velS).applyQuaternion(fb), hb.copy(this.accS).applyQuaternion(fb), gb.set(0, -1, 0).applyQuaternion(fb);
      let a2 = n2.gravity * this.gravityScale, o2 = Math.atan2(-gb.z, -gb.y), s2 = Math.atan2(gb.x, -gb.y), c2 = l_(hb.z * n2.inertia + mb.z * n2.drag, -1.4, 1.4), l2 = l_(-hb.x * n2.inertia - mb.x * n2.drag, -1, 1), u2 = n2.sway * Math.sin(t2 * n2.swaySpeed + this.phase), d2 = n2.sway * 0.7 * Math.sin(t2 * n2.swaySpeed * 1.37 + this.phase * 2.1), f2 = this.bones.length, p2 = Math.min(4, Math.max(1, Math.ceil(e4 / (1 / 60)))), m2 = e4 / p2;
      for (let e5 = 0; e5 < f2; e5 += 1) {
        let t3 = e5 === 0 ? 0.55 : 0.45 / Math.max(1, f2 - 1), r3, i3;
        e5 === 0 ? (r3 = n2.restX + a2 * o2 + this.driveX, i3 = n2.restZ + a2 * s2 + this.driveZ) : (r3 = n2.curlX, i3 = 0), r3 += c2 * t3 * 1.6 + u2 * (0.4 + e5 * 0.3), i3 += l2 * t3 * 1.6 + d2 * (0.4 + e5 * 0.3);
        let h2 = n2.stiffness * n2.falloff ** +e5, g2 = n2.damping * n2.falloff ** (e5 * 0.5);
        for (let t4 = 0; t4 < p2; t4 += 1) this.vx[e5] += (h2 * (r3 - this.ax[e5]) - g2 * this.vx[e5]) * m2, this.vz[e5] += (h2 * (i3 - this.az[e5]) - g2 * this.vz[e5]) * m2, this.ax[e5] += this.vx[e5] * m2, this.az[e5] += this.vz[e5] * m2;
        let _2 = e5 === 0 ? n2.xMin : n2.xMin * 0.6, v2 = e5 === 0 ? n2.xMax : n2.xMax * 0.6;
        this.ax[e5] < _2 ? (this.ax[e5] = _2, this.vx[e5] *= -0.2) : this.ax[e5] > v2 && (this.ax[e5] = v2, this.vx[e5] *= -0.2);
        let y2 = e5 === 0 ? n2.zMin : n2.zMin * 0.6, b2 = e5 === 0 ? n2.zMax : n2.zMax * 0.6;
        this.az[e5] = l_(this.az[e5], y2, b2), this.bones[e5].quaternion.setFromEuler(_b.set(this.ax[e5], 0, this.az[e5], `XZY`));
      }
      this.driveX = 0, this.driveZ = 0;
    }
    hold() {
      for (let e4 = 0; e4 < this.bones.length; e4 += 1) this.bones[e4].quaternion.setFromEuler(_b.set(this.ax[e4], 0, this.az[e4], `XZY`));
    }
  };
}));
function bb(e4, t2, n2) {
  if (!n2) {
    e4.value.set(0, 0, 0, 0), t2.value.set(0.7, 0, 0, 0);
    return;
  }
  Ab.set(n2.col), e4.value.set(Ab.r, Ab.g, Ab.b, n2.mix), t2.value.set(n2.rough, n2.metal, n2.pattern, 0);
}
var xb, Sb, Cb, wb, Tb, Eb, Db, Ob, kb, Ab, jb, Mb, Nb, Pb = t((() => {
  Ed(), tm(), L_(), __(), Jy(), ub(), yb(), xb = /* @__PURE__ */ new Set([`attack1`, `attack2`, `cast`, `castUp`, `kick`, `hit`, `block`, `leap`, `taunt`, `special`, `death`, `resurrect`]), Sb = /* @__PURE__ */ new Set([`death`, `dead`, `resurrect`]), Cb = 0.15, wb = 0, Tb = new ir().setFromRotationMatrix(new wr().makeBasis(new N(0, -1, 0), new N(0, 0, 1), new N(-1, 0, 0))), Eb = new ir().setFromAxisAngle(new N(0, 1, 0), Math.PI / 2), Db = { armorQuilted: { col: `#7a6c55`, rough: 0.92, metal: 0, pattern: 4, tier: 1, mix: 0.8 }, armorLeather: { col: `#5e3d24`, rough: 0.62, metal: 0, pattern: 3, tier: 2, mix: 0.9 }, armorStudded: { col: `#4a3020`, rough: 0.55, metal: 0.1, pattern: 5, tier: 2, mix: 0.92 }, armorRing: { col: `#7c7f84`, rough: 0.48, metal: 0.9, pattern: 1, tier: 3, mix: 0.95 }, armorScale: { col: `#8a7a58`, rough: 0.42, metal: 0.92, pattern: 1, tier: 3, mix: 0.95 }, armorChain: { col: `#8c9096`, rough: 0.4, metal: 0.95, pattern: 1, tier: 3, mix: 0.97 }, armorBreast: { col: `#9aa0a8`, rough: 0.34, metal: 1, pattern: 2, tier: 4, mix: 0.97 }, armorSplint: { col: `#7d838b`, rough: 0.4, metal: 1, pattern: 2, tier: 4, mix: 0.97 }, armorPlate: { col: `#b6bbc2`, rough: 0.24, metal: 1, pattern: 2, tier: 4, mix: 1 } }, Ob = { leatherGloves: { col: `#5e3d24`, rough: 0.6, metal: 0, pattern: 3, tier: 2, mix: 0.9 }, heavyGloves: { col: `#3c2a1c`, rough: 0.7, metal: 0, pattern: 5, tier: 2, mix: 0.95 }, chainGloves: { col: `#8c9096`, rough: 0.42, metal: 0.95, pattern: 1, tier: 3, mix: 0.97 }, gauntlets: { col: `#aeb3ba`, rough: 0.28, metal: 1, pattern: 2, tier: 4, mix: 1 } }, kb = { leatherBoots: { col: `#5a3a22`, rough: 0.6, metal: 0, pattern: 3, tier: 2, mix: 0.9 }, heavyBoots: { col: `#3a281b`, rough: 0.72, metal: 0, pattern: 5, tier: 2, mix: 0.95 }, chainBoots: { col: `#8c9096`, rough: 0.42, metal: 0.95, pattern: 1, tier: 3, mix: 0.97 }, greaves: { col: `#aeb3ba`, rough: 0.28, metal: 1, pattern: 2, tier: 4, mix: 1 } }, Ab = new P(), jb = new ir(), Mb = new N(), Nb = class {
    root = new Qr();
    mesh;
    bones;
    byName;
    uniforms;
    material;
    depthMaterial;
    height;
    radius;
    template;
    seed;
    space;
    springs;
    springBones = /* @__PURE__ */ new Set();
    equipment = {};
    attached = {};
    _state = `idle`;
    _progress = 1;
    vState = `idle`;
    vTime = 0;
    stateTime = 0;
    duration = 1;
    fadeDur = 0;
    fadeT = 0;
    snapQ;
    snapP;
    sockets = /* @__PURE__ */ new Map();
    animator;
    frozen = false;
    flashT = 1;
    flashI = 0;
    lastTime = 0;
    frame = { state: `idle`, p: 0, t: 0, dt: 0, speed: 0, time: 0, duration: 1 };
    disposed = false;
    constructor(e4) {
      this.template = e4, this.seed = t_(++wb * 7919 + e4.key.length * 131), this.height = e4.height, this.radius = e4.radius, this.uniforms = w_(), this.material = E_(this.uniforms), this.depthMaterial = D_(this.uniforms);
      let { bones: t2, byName: n2 } = e4.def.instantiate();
      this.bones = t2, this.byName = n2;
      let r2 = e4.def.bones.map((e5) => new wr().makeTranslation(-e5.pos[0], -e5.pos[1], -e5.pos[2])), i2 = new Ia(t2, r2), a2 = new ja(e4.geometry, this.material);
      a2.name = e4.key, a2.add(t2[0]), a2.bind(i2, new wr()), a2.castShadow = true, a2.receiveShadow = true, a2.customDepthMaterial = this.depthMaterial, a2.boundingSphere = new Wi(new N(0, e4.height * 0.45, 0), e4.height * 1.05), a2.boundingBox = new bi(new N(-e4.height, -0.1, -e4.height), new N(e4.height, e4.height * 1.3, e4.height)), this.mesh = a2, this.root.add(a2), this.root.name = `rig:${e4.key}`, this.snapQ = t2.map(() => new ir()), this.snapP = t2.map(() => new N()), this.space = new lb(e4.def, t2), this.springs = e4.springs.map((e5, t3) => new vb(e5, n2, this.seed + t3 * 977));
      for (let e5 of this.springs) for (let t3 of e5.bones) this.springBones.add(t3);
      for (let r3 of [`rightHand`, `leftHand`, `head`, `chest`, `castPoint`, `weaponTip`, `mouth`, `back`, `overhead`]) {
        let i3 = e4.sockets[r3], a3 = new Zr();
        if (a3.name = `socket:${r3}`, i3) {
          let t3 = n2.get(i3.bone);
          if (!t3) throw Error(`socket ${r3}: no bone ${i3.bone}`);
          let o2 = e4.def.pos(i3.bone);
          a3.position.set(i3.pos[0] - o2[0], i3.pos[1] - o2[1], i3.pos[2] - o2[2]), t3.add(a3);
        } else r3 === `overhead` ? (a3.position.set(0, e4.height + 0.3, 0), this.root.add(a3)) : (n2.get(`head`) ?? t2[0]).add(a3);
        this.sockets.set(r3, a3);
      }
      this.animator = e4.makeAnimator(this), e4.defaultEquipment && this.setEquipment(e4.defaultEquipment), this.animator.onPlay?.(`idle`), this.evaluate(0, 0, 0);
    }
    get state() {
      return this._state;
    }
    get progress() {
      return this._progress;
    }
    get visualState() {
      return this.vState;
    }
    bone(e4) {
      let t2 = this.byName.get(e4);
      if (!t2) throw Error(`${this.template.key}: no bone ${e4}`);
      return t2;
    }
    hasBone(e4) {
      return this.byName.has(e4);
    }
    play(e4, t2 = {}) {
      let n2 = xb.has(e4);
      if (!(!n2 && e4 === this._state) && !(n2 && e4 === this._state && t2.restart === false && this._progress < 1)) {
        if (e4 === `dead`) {
          this._state = e4, this.vState = e4, this._progress = 1, this.stateTime = 0, this.vTime = 0, this.fadeDur = 0, this.animator.onPlay?.(e4), this.uniforms.uEmitScale.value = this.template.deadEmissive ?? 0.15;
          for (let e5 of this.springs) e5.gravityScale = 0;
          return;
        }
        if (this.snapshot(), this.fadeDur = t2.fade ?? 0.12, this.fadeT = 0, !n2 && this.vState === e4 && (this.fadeDur = 0), this._state = e4, this.vState = e4, this.stateTime = 0, this.vTime = 0, this.duration = n2 ? Math.max(0.05, t2.duration ?? em[e4] ?? 0.8) : 1, this._progress = +!n2, this.uniforms.uEmitScale.value = e4 === `death` ? 1 : this.uniforms.uEmitScale.value, e4 === `resurrect` || !Sb.has(e4)) {
          this.uniforms.uEmitScale.value = 1;
          for (let e5 of this.springs) e5.gravityScale = 1;
        }
        this.animator.onPlay?.(e4);
      }
    }
    snapshot() {
      for (let e4 = 0; e4 < this.bones.length; e4 += 1) this.snapQ[e4].copy(this.bones[e4].quaternion), this.snapP[e4].copy(this.bones[e4].position);
    }
    update(e4, t2) {
      if (this.disposed) return;
      let n2 = Math.min(Math.max(e4, 0), 0.1);
      if (O_.uTime.value = t2.time, this.flashT < Cb) {
        this.flashT += n2;
        let e5 = Math.max(0, 1 - this.flashT / Cb);
        this.uniforms.uFlash.value = this.flashI * e5 * e5;
      } else this.uniforms.uFlash.value = 0;
      if (this.frozen) {
        for (let e5 of this.springs) e5.hold();
        return;
      }
      this.evaluate(n2, t2.speed, t2.time);
    }
    evaluate(e4, t2, n2) {
      this.lastTime = n2, this.stateTime += e4, this.vTime += e4, xb.has(this._state) ? (this._progress = Math.min(1, this.stateTime / this.duration), this._progress >= 1 && this.vState === this._state && this._state !== `death` && (this.snapshot(), this.fadeDur = this._state === `resurrect` ? 0.25 : 0.18, this.fadeT = 0, this.vState = `idle`, this.vTime = 0, this.animator.onPlay?.(`idle`))) : this._progress = 1, this._state === `death` && this._progress >= 1 && (this.uniforms.uEmitScale.value = Math.max(this.template.deadEmissive ?? 0.15, this.uniforms.uEmitScale.value - e4 * 2));
      let r2 = this.frame;
      if (r2.state = this.vState, r2.p = this.vState === this._state && xb.has(this.vState) ? this._progress : +(this.vState === `dead`), r2.t = this.vTime, r2.dt = e4, r2.speed = t2, r2.time = n2, r2.duration = this.duration, this.animator.evaluate(r2), this.fadeT < this.fadeDur) {
        this.fadeT += e4;
        let t3 = d_(this.fadeT / this.fadeDur);
        for (let e5 = 0; e5 < this.bones.length; e5 += 1) {
          let n3 = this.bones[e5];
          this.springBones.has(n3) || (jb.copy(n3.quaternion), n3.quaternion.copy(this.snapQ[e5]).slerp(jb, t3), Mb.copy(n3.position), n3.position.copy(this.snapP[e5]).lerp(Mb, t3));
        }
      }
      if (Sb.has(this.vState) && this.template.contacts.length) {
        this.space.update();
        let e5 = 1 / 0;
        for (let [t3, n3] of this.template.contacts) {
          let r3 = this.template.def.index.get(t3);
          r3 !== void 0 && (e5 = Math.min(e5, this.space.pos[r3].y - n3));
        }
        e5 < 0 && (this.bones[0].position.y -= e5);
      }
      for (let t3 of this.springs) t3.update(e4, n2);
    }
    spring(e4) {
      return this.springs.find((t2) => t2.def.id === e4);
    }
    getSocket(e4) {
      return this.sockets.get(e4);
    }
    setEquipment(e4) {
      let t2 = this.template.equip;
      Object.assign(this.equipment, { mainHand: null, offHand: null, head: null, body: null, gloves: null, boots: null }, e4);
      let n2 = this.uniforms, r2 = e4.body ? Db[e4.body] : void 0;
      if (bb(n2.uArmorCol, n2.uArmorMat, r2), n2.uArmorTier.value = r2 ? r2.tier : 0, bb(n2.uGloveCol, n2.uGloveMat, e4.gloves ? Ob[e4.gloves] : void 0), bb(n2.uBootCol, n2.uBootMat, e4.boots ? kb[e4.boots] : void 0), t2) {
        t2.weapons && this.attach(`main`, e4.mainHand ?? null), t2.offHand && this.attach(`off`, e4.offHand ?? null), t2.helm && this.attach(`head`, e4.head ?? null);
        let r3 = this.attached.head?.visual;
        n2.uHairHide.value = r3 ? r3 === `circlet` || r3 === `mask` ? 0.5 : 1 : 0;
      }
      let i2 = this.sockets.get(`weaponTip`);
      if (i2.removeFromParent(), this.attached.main) this.attached.main.mesh.add(i2), i2.position.copy(this.attached.main.info.tip);
      else {
        let e5 = this.template.sockets.weaponTip;
        if ((e5 ? this.byName.get(e5.bone) : this.byName.get(`hand_R`) ?? this.bones[0]).add(i2), e5) {
          let t3 = this.template.def.pos(e5.bone);
          i2.position.set(e5.pos[0] - t3[0], e5.pos[1] - t3[1], e5.pos[2] - t3[2]);
        } else i2.position.set(0, -0.1, 0.1);
      }
      this.animator.setEquipment?.(this.equipment);
    }
    attach(e4, t2) {
      let n2 = this.attached[e4];
      if (n2 && n2.visual === t2 || (n2 && (n2.mesh.removeFromParent(), n2.mesh.material.dispose(), this.attached[e4] = void 0), !t2)) return;
      let r2 = qy(t2);
      if (!r2) return;
      let i2 = new xa(r2.geometry, E_(this.uniforms));
      if (i2.castShadow = true, i2.receiveShadow = true, i2.customDepthMaterial = this.depthMaterial, i2.name = `attach:${t2}`, e4 === `main`) this.getSocket(`rightHand`).add(i2), i2.quaternion.copy(Tb);
      else if (e4 === `off`) this.getSocket(`leftHand`).add(i2), r2.kind === `shield` ? (i2.quaternion.copy(Eb), i2.position.set(0.035, 0.05, 0)) : r2.kind === `orb` ? i2.position.set(-0.02, -0.035, 0.05) : r2.kind === `head` ? i2.position.set(0, -0.02, 0.02) : i2.quaternion.copy(Tb);
      else {
        let e5 = this.template.equip;
        this.byName.get(`head`).add(i2), i2.position.set(e5.helmOffset[0], e5.helmOffset[1], e5.helmOffset[2]), i2.scale.setScalar(e5.helmScale);
      }
      this.attached[e4] = { visual: t2, mesh: i2, info: r2 };
    }
    setTint(e4, t2 = 1) {
      if (e4 === null) {
        this.uniforms.uTintAmt.value = 0;
        return;
      }
      this.uniforms.uTint.value.set(e4), this.uniforms.uTintAmt.value = Math.min(1, Math.max(0, t2)) * 0.72;
    }
    flash(e4 = `#ffffff`, t2 = 1) {
      this.uniforms.uFlashColor.value.set(e4), this.flashI = t2 * 0.9, this.flashT = 0, this.uniforms.uFlash.value = this.flashI;
    }
    setStatus(e4) {
      let t2 = this.uniforms;
      t2.uStatus.value.set(+!!e4.chilled, +!!e4.frozen, +!!e4.poisoned, +!!e4.burning), t2.uStatus2.value.set(+!!e4.cursed, +!!e4.feared), this.frozen = !!e4.frozen;
    }
    baseRim = null;
    highlighted = false;
    setHighlight(e4) {
      if (e4 === null) {
        this.highlighted = false, this.baseRim ? (this.uniforms.uRimColor.value.copy(this.baseRim.color), this.uniforms.uRimAmt.value = this.baseRim.amt) : this.uniforms.uRimAmt.value = 0;
        return;
      }
      this.highlighted = true, this.uniforms.uRimColor.value.set(e4), this.uniforms.uRimAmt.value = 1.6;
    }
    setBaseRim(e4, t2 = 0.4) {
      this.baseRim = e4 === null ? null : { color: new P(e4), amt: t2 }, this.highlighted || this.setHighlight(null);
    }
    setDissolve(e4, t2) {
      this.uniforms.uDissolve.value = Math.min(1.02, Math.max(0, e4) * 1.02), t2 !== void 0 && this.uniforms.uDissolveEdge.value.set(t2), this.mesh.visible = e4 < 0.999 && this.uniforms.uFade.value > 2e-3;
    }
    setFade(e4) {
      this.uniforms.uFade.value = Math.min(1, Math.max(0, e4));
      let t2 = e4 > 2e-3 && this.uniforms.uDissolve.value < 1;
      this.mesh.visible = t2;
      for (let e5 of Object.values(this.attached)) e5 && (e5.mesh.visible = t2);
    }
    get time() {
      return this.lastTime;
    }
    dispose() {
      if (!this.disposed) {
        this.disposed = true, this.root.removeFromParent();
        for (let e4 of Object.values(this.attached)) e4 && e4.mesh.material.dispose();
        this.material.dispose(), this.depthMaterial.dispose(), this.mesh.skeleton.dispose();
      }
    }
  };
})), Fb, Ib = t((() => {
  Fb = class {
    hx = 0;
    hy = 0;
    hz = 0;
    hrx = 0;
    hry = 0;
    hrz = 0;
    srx = 0;
    sry = 0;
    srz = 0;
    crx = 0;
    cry = 0;
    crz = 0;
    nrx = 0;
    nry = 0;
    nrz = 0;
    hdx = 0;
    hdy = 0;
    hdz = 0;
    jaw = 0;
    clavY = [0, 0];
    clavZ = [0, 0];
    armX = [0, 0];
    armZ = [0, 0];
    armY = [0, 0];
    elbow = [0, 0];
    foreY = [0, 0];
    handX = [0, 0];
    handZ = [0, 0];
    handY = [0, 0];
    fing = [0, 0];
    ik = [1, 1];
    fx = [0, 0];
    fy = [0, 0];
    fz = [0, 0];
    fpitch = [0, 0];
    fyaw = [0, 0];
    froll = [0, 0];
    toe = [0, 0];
    kneeOut = [0, 0];
    thX = [0, 0];
    thZ = [0, 0];
    thY = [0, 0];
    knee = [0, 0];
    ftX = [0, 0];
    lhIK = 0;
    ex = new Float32Array(16);
    reset() {
      this.hx = this.hy = this.hz = 0, this.hrx = this.hry = this.hrz = 0, this.srx = this.sry = this.srz = 0, this.crx = this.cry = this.crz = 0, this.nrx = this.nry = this.nrz = 0, this.hdx = this.hdy = this.hdz = 0, this.jaw = 0;
      for (let e4 = 0; e4 < 2; e4 += 1) this.clavY[e4] = this.clavZ[e4] = 0, this.armX[e4] = this.armZ[e4] = this.armY[e4] = 0, this.elbow[e4] = this.foreY[e4] = 0, this.handX[e4] = this.handZ[e4] = this.handY[e4] = 0, this.fing[e4] = 0, this.ik[e4] = 1, this.fx[e4] = this.fy[e4] = this.fz[e4] = 0, this.fpitch[e4] = this.fyaw[e4] = this.froll[e4] = 0, this.toe[e4] = 0, this.kneeOut[e4] = 0, this.thX[e4] = this.thZ[e4] = this.thY[e4] = 0, this.knee[e4] = this.ftX[e4] = 0;
      this.lhIK = 0, this.ex.fill(0);
    }
    blend(e4, t2) {
      let n2 = (e5, n3) => e5 + (n3 - e5) * t2;
      this.hx = n2(this.hx, e4.hx), this.hy = n2(this.hy, e4.hy), this.hz = n2(this.hz, e4.hz), this.hrx = n2(this.hrx, e4.hrx), this.hry = n2(this.hry, e4.hry), this.hrz = n2(this.hrz, e4.hrz), this.srx = n2(this.srx, e4.srx), this.sry = n2(this.sry, e4.sry), this.srz = n2(this.srz, e4.srz), this.crx = n2(this.crx, e4.crx), this.cry = n2(this.cry, e4.cry), this.crz = n2(this.crz, e4.crz), this.nrx = n2(this.nrx, e4.nrx), this.nry = n2(this.nry, e4.nry), this.nrz = n2(this.nrz, e4.nrz), this.hdx = n2(this.hdx, e4.hdx), this.hdy = n2(this.hdy, e4.hdy), this.hdz = n2(this.hdz, e4.hdz), this.jaw = n2(this.jaw, e4.jaw);
      for (let t3 = 0; t3 < 2; t3 += 1) this.clavY[t3] = n2(this.clavY[t3], e4.clavY[t3]), this.clavZ[t3] = n2(this.clavZ[t3], e4.clavZ[t3]), this.armX[t3] = n2(this.armX[t3], e4.armX[t3]), this.armZ[t3] = n2(this.armZ[t3], e4.armZ[t3]), this.armY[t3] = n2(this.armY[t3], e4.armY[t3]), this.elbow[t3] = n2(this.elbow[t3], e4.elbow[t3]), this.foreY[t3] = n2(this.foreY[t3], e4.foreY[t3]), this.handX[t3] = n2(this.handX[t3], e4.handX[t3]), this.handZ[t3] = n2(this.handZ[t3], e4.handZ[t3]), this.handY[t3] = n2(this.handY[t3], e4.handY[t3]), this.fing[t3] = n2(this.fing[t3], e4.fing[t3]), this.ik[t3] = n2(this.ik[t3], e4.ik[t3]), this.fx[t3] = n2(this.fx[t3], e4.fx[t3]), this.fy[t3] = n2(this.fy[t3], e4.fy[t3]), this.fz[t3] = n2(this.fz[t3], e4.fz[t3]), this.fpitch[t3] = n2(this.fpitch[t3], e4.fpitch[t3]), this.fyaw[t3] = n2(this.fyaw[t3], e4.fyaw[t3]), this.froll[t3] = n2(this.froll[t3], e4.froll[t3]), this.toe[t3] = n2(this.toe[t3], e4.toe[t3]), this.kneeOut[t3] = n2(this.kneeOut[t3], e4.kneeOut[t3]), this.thX[t3] = n2(this.thX[t3], e4.thX[t3]), this.thZ[t3] = n2(this.thZ[t3], e4.thZ[t3]), this.thY[t3] = n2(this.thY[t3], e4.thY[t3]), this.knee[t3] = n2(this.knee[t3], e4.knee[t3]), this.ftX[t3] = n2(this.ftX[t3], e4.ftX[t3]);
      this.lhIK = n2(this.lhIK, e4.lhIK);
      for (let t3 = 0; t3 < this.ex.length; t3 += 1) this.ex[t3] = n2(this.ex[t3], e4.ex[t3]);
    }
    copy(e4) {
      this.reset(), this.blend(e4, 1);
    }
  };
}));
function Lb(e4) {
  if (!e4) return `none`;
  switch (e4) {
    case `dagger`:
    case `kris`:
      return `dagger`;
    case `wand`:
    case `boneWand`:
    case `graveWand`:
      return `wand`;
    case `shortStaff`:
    case `longStaff`:
    case `gnarledStaff`:
      return `staff`;
    case `greatSword`:
    case `greatAxe`:
    case `doubleAxe`:
      return `twoHand`;
    case `bow`:
      return `bow`;
    default:
      return `oneHand`;
  }
}
var Rb, zb, Bb, Vb, Hb, Ub, Wb, Gb, Kb, qb, Jb, Yb, Xb, Zb, Qb, $b, ex, tx, nx, rx, ix, ax = t((() => {
  Ed(), tm(), __(), ub(), Jy(), Ib(), Rb = { kind: `human`, gait: `normal`, walkRef: 4.6, runRef: 7, walkStride: 1.62, runStride: 2.55, walkStance: 0.58, runStance: 0.34, stepH: 0.11, runStepH: 0.2, footSpread: 0.02, crouch: 0.035, runCrouch: 0.08, bob: 0.018, runBob: 0.04, sway: 0.018, pelvisYaw: 0.16, lean: 0.05, runLean: 0.2, armSwing: 0.42, runArmSwing: 0.75, armOut: 0.1, elbow: 0.22, hunch: 0, headDown: 0.04, breath: 1, idleSway: 1, weapon: `none`, offHand: `none`, mass: 1, castStyle: `arcane`, tauntStyle: `weaponRaise`, specialStyle: `slam`, townPose: `none`, deathStyle: `random`, limp: 0, dangleArm: 0, fingersOpen: 0.4 }, zb = [1, -1], Bb = new Pr(), Vb = new ir(), Hb = new ir(), Ub = new ir(), Wb = new ir(), Gb = new ir(), Kb = new ir(), qb = new N(), Jb = new N(), Yb = new N(), Xb = new N(0, 0, 1), Zb = new N(0, 0, -1), Qb = new N(0, -1, 0), $b = new ir().setFromRotationMatrix(new wr().makeBasis(new N(0, -1, 0), new N(0, 0, 1), new N(-1, 0, 0))), ex = (e4) => e4 >= 0 ? e4 * 0.62 : e4 * 1.4, tx = (e4) => f_(e4), nx = (e4) => p_(e4), rx = (e4) => m_(e4), ix = class {
    P = new Fb();
    P2 = new Fb();
    style;
    rig;
    J;
    bones;
    hipsBind = new N();
    hipOff = [new N(), new N()];
    L1;
    L2;
    legDirU = [new N(), new N()];
    legDirL = [new N(), new N()];
    armDirU = [new N(), new N()];
    armDirL = [new N(), new N()];
    aL1;
    aL2;
    ankleY;
    hw;
    ballZ;
    heelZ;
    H;
    phase = 0;
    playIndex = 0;
    deathVariant = 0;
    seedF;
    gripSep = 0.2;
    foot = { z: 0, y: 0, pitch: 0, toe: 0 };
    rightSocket = new N();
    leftSocket = new N();
    idxHandR;
    idxUpperL;
    idxUpperR;
    idxHandL;
    constructor(e4, t2, n2) {
      this.rig = e4, this.J = t2, this.style = { ...Rb, ...n2 };
      let r2 = (t3) => e4.bone(t3), i2 = (t3) => e4.hasBone(t3) ? e4.bone(t3) : void 0;
      this.bones = { hips: r2(`hips`), spine: r2(`spine`), chest: r2(`chest`), neck: r2(`neck`), head: r2(`head`), jaw: i2(`jaw`), shoulder: [r2(`shoulder_L`), r2(`shoulder_R`)], upper: [r2(`upperArm_L`), r2(`upperArm_R`)], fore: [r2(`foreArm_L`), r2(`foreArm_R`)], hand: [r2(`hand_L`), r2(`hand_R`)], fingers: [i2(`fingers_L`), i2(`fingers_R`)], thigh: [r2(`thigh_L`), r2(`thigh_R`)], shin: [r2(`shin_L`), r2(`shin_R`)], foot: [r2(`foot_L`), r2(`foot_R`)], toe: [i2(`toe_L`), i2(`toe_R`)] }, this.hipsBind.set(...t2.hips);
      let a2 = t2.P.height;
      this.H = a2;
      for (let e5 = 0; e5 < 2; e5 += 1) {
        let n3 = zb[e5];
        this.hipOff[e5].set(t2.hipL[0] * n3 - t2.hips[0], t2.hipL[1] - t2.hips[1], t2.hipL[2] - t2.hips[2]), this.legDirU[e5].set(0, t2.kneeL[1] - t2.hipL[1], t2.kneeL[2] - t2.hipL[2]).normalize(), this.legDirL[e5].set(0, t2.ankleL[1] - t2.kneeL[1], t2.ankleL[2] - t2.kneeL[2]).normalize(), this.armDirU[e5].set((t2.elbowL[0] - t2.upperArmL[0]) * n3, t2.elbowL[1] - t2.upperArmL[1], t2.elbowL[2] - t2.upperArmL[2]).normalize(), this.armDirL[e5].set((t2.wristL[0] - t2.elbowL[0]) * n3, t2.wristL[1] - t2.elbowL[1], t2.wristL[2] - t2.elbowL[2]).normalize();
      }
      this.L1 = Math.hypot(t2.kneeL[1] - t2.hipL[1], t2.kneeL[2] - t2.hipL[2]), this.L2 = Math.hypot(t2.ankleL[1] - t2.kneeL[1], t2.ankleL[2] - t2.kneeL[2]), this.aL1 = Math.hypot(t2.elbowL[0] - t2.upperArmL[0], t2.elbowL[1] - t2.upperArmL[1], t2.elbowL[2] - t2.upperArmL[2]), this.aL2 = Math.hypot(t2.wristL[0] - t2.elbowL[0], t2.wristL[1] - t2.elbowL[1], t2.wristL[2] - t2.elbowL[2]), this.ankleY = t2.ankleL[1], this.hw = t2.hipL[0], this.ballZ = t2.P.footLen * 0.62, this.heelZ = t2.P.footLen * 0.24, this.seedF = n_(e4.seed), this.phase = this.seedF;
      let o2 = e4.template.sockets.rightHand;
      if (o2) {
        let t3 = e4.template.def.pos(o2.bone);
        this.rightSocket.set(o2.pos[0] - t3[0], o2.pos[1] - t3[1], o2.pos[2] - t3[2]);
      }
      let s2 = e4.template.sockets.leftHand;
      if (s2) {
        let t3 = e4.template.def.pos(s2.bone);
        this.leftSocket.set(s2.pos[0] - t3[0], s2.pos[1] - t3[1], s2.pos[2] - t3[2]);
      }
      let c2 = e4.template.def.index;
      this.idxHandR = c2.get(`hand_R`), this.idxHandL = c2.get(`hand_L`), this.idxUpperL = c2.get(`upperArm_L`), this.idxUpperR = c2.get(`upperArm_R`);
    }
    setEquipment(e4) {
      if (!this.rig.template.equip) return;
      this.style.weapon = Lb(e4.mainHand ?? null);
      let t2 = e4.offHand ?? null;
      t2 ? t2 === `sorceryOrb` ? this.style.offHand = `orb` : t2 === `shrunkenHead` ? this.style.offHand = `item` : this.style.offHand = `shield` : this.style.offHand = `none`;
      let n2 = e4.mainHand ? qy(e4.mainHand) : null;
      this.gripSep = n2 ? l_(n2.length * 0.14, 0.14, 0.3) : 0.2;
    }
    onPlay(e4) {
      if (this.playIndex += 1, e4 === `death` || e4 === `dead`) {
        let e5 = this.style.deathStyle;
        e5 === `random` ? this.deathVariant = n_(this.rig.seed + this.playIndex * 31) < 0.5 ? 0 : 1 : this.deathVariant = e5 === `back` ? 0 : e5 === `forward` ? 1 : 2;
      }
    }
    evaluate(e4) {
      let t2 = this.P;
      switch (t2.reset(), e4.state) {
        case `idle`:
          this.idle(t2, e4.time, false);
          break;
        case `townIdle`:
          this.idle(t2, e4.time, true);
          break;
        case `walk`:
          this.locomotion(t2, e4, false);
          break;
        case `run`:
          this.locomotion(t2, e4, true);
          break;
        case `attack1`:
          this.attack(t2, e4.p, 0, e4.time);
          break;
        case `attack2`:
          this.attack(t2, e4.p, 1, e4.time);
          break;
        case `cast`:
          this.cast(t2, e4.p, e4.time);
          break;
        case `castUp`:
          this.castUp(t2, e4.p, e4.time);
          break;
        case `kick`:
          this.kick(t2, e4.p, e4.time);
          break;
        case `hit`:
          this.hit(t2, e4.p, e4.time);
          break;
        case `block`:
          this.block(t2, e4.p, e4.time);
          break;
        case `spin`:
          this.spin(t2, e4);
          break;
        case `leap`:
          this.leap(t2, e4.p, e4.time);
          break;
        case `channel`:
          this.channel(t2, e4.time);
          break;
        case `taunt`:
          this.taunt(t2, e4.p, e4.time);
          break;
        case `special`:
          this.special(t2, e4.p, e4.time);
          break;
        case `death`:
          this.death(t2, e4.p, e4.time);
          break;
        case `dead`:
          this.death(t2, 1, e4.time);
          break;
        case `resurrect`:
          this.resurrect(t2, e4.p, e4.time);
          break;
      }
      this.apply(t2, e4), this.post(t2, e4);
    }
    post(e4, t2) {
    }
    stance(e4, t2 = 1, n2 = 0.05, r2 = this.style.crouch, i2 = 0.14) {
      let a2 = this.hw + this.style.footSpread * t2 + (t2 - 1) * 0.06;
      e4.fx[0] = a2, e4.fx[1] = -a2, e4.fy[0] = this.ankleY, e4.fy[1] = this.ankleY, e4.fz[0] = n2, e4.fz[1] = -n2, e4.fyaw[0] = i2, e4.fyaw[1] = -i2, e4.hy = -r2, e4.kneeOut[0] = 0.15, e4.kneeOut[1] = 0.15;
    }
    posture(e4, t2 = 1) {
      let n2 = this.style;
      e4.hrx += n2.hunch * 0.35 * t2, e4.srx += n2.hunch * 0.45 * t2, e4.crx += n2.hunch * 0.5 * t2, e4.nrx += -n2.hunch * 0.3 * t2, e4.hdx += n2.headDown * t2 - n2.hunch * 0.55 * t2, n2.hunch > 0.3 && (e4.hy -= n2.hunch * 0.06 * this.H * t2, e4.hz -= n2.hunch * 0.04 * this.H * t2);
    }
    breathe(e4, t2, n2 = 1) {
      let r2 = this.style, i2 = t2 * 1.55 + this.seedF * 10, a2 = Math.sin(i2) * r2.breath * n2;
      e4.crx += -a2 * 0.018, e4.clavZ[0] += a2 * 0.025, e4.clavZ[1] += a2 * 0.025, e4.hy += a2 * 3e-3, e4.hdx += a2 * 0.012;
    }
    armsRest(e4, t2, n2) {
      let r2 = this.style;
      for (let t3 = 0; t3 < 2; t3 += 1) e4.armZ[t3] = r2.armOut, e4.armX[t3] = 0.04, e4.elbow[t3] = r2.elbow, e4.fing[t3] = r2.fingersOpen, e4.handZ[t3] = 0.12;
      let i2 = r2.weapon;
      if (i2 === `oneHand` || i2 === `cleaver` || i2 === `dagger` || i2 === `wand`) e4.armX[1] = t2 ? 0.08 : 0.2, e4.armZ[1] = t2 ? 0.1 : 0.26, e4.armY[1] = 0.1, e4.elbow[1] = t2 ? 0.55 : i2 === `wand` ? 0.95 : 1, e4.handX[1] = t2 ? -0.6 : i2 === `dagger` ? -0.9 : -0.5, e4.handY[1] = t2 ? 0.2 : 0.5, e4.fing[1] = 1.35;
      else if (i2 === `twoHand`) t2 ? (e4.armX[1] = 0.1, e4.armZ[1] = 0.12, e4.elbow[1] = 0.5, e4.handX[1] = -0.9, e4.fing[1] = 1.35) : (e4.armX[1] = 0.5, e4.armZ[1] = -0.1, e4.armY[1] = 0.25, e4.elbow[1] = 1.2, e4.handX[1] = 0.25, e4.handY[1] = -0.35, e4.fing[1] = 1.35, e4.lhIK = 1, e4.cry -= 0.18, e4.hry -= 0.12);
      else if (i2 === `staff`) e4.armX[1] = 0.14, e4.armZ[1] = 0.2, e4.armY[1] = 0.15, e4.elbow[1] = 1.2, e4.handX[1] = Math.PI / 2 - 0.14 - 1.2 - 0.05, e4.handZ[1] = 0, e4.handY[1] = 0.3, e4.fing[1] = 1.35;
      else if (i2 === `bow`) e4.armX[0] = t2 ? 0.08 : 0.16, e4.armZ[0] = 0.16, e4.elbow[0] = t2 ? 0.9 : 1.05, e4.handX[0] = Math.PI / 2 - e4.armX[0] - e4.elbow[0] - 0.08, e4.handY[0] = 0.28, e4.fing[0] = 1.35, e4.fing[1] = 0.6;
      else if (i2 === `claw`) for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = t2 ? 0.15 : 0.45, e4.armZ[n3] = 0.32, e4.elbow[n3] = 0.85, e4.handZ[n3] = -0.25, e4.fing[n3] = 0.35;
      else if (i2 === `smash`) for (let t3 = 0; t3 < 2; t3 += 1) e4.armX[t3] = 0.35, e4.armZ[t3] = 0.18, e4.elbow[t3] = 0.45, e4.fing[t3] = 0.7;
      r2.offHand === `shield` ? (e4.armX[0] = t2 ? 0.12 : 0.42, e4.armZ[0] = t2 ? 0.2 : 0.3, e4.armY[0] = t2 ? -0.3 : -1.15, e4.elbow[0] = t2 ? 0.6 : 1.3, e4.handY[0] = 0, e4.handX[0] = t2 ? 0 : 0.1, e4.fing[0] = 1.3) : r2.offHand === `orb` ? (e4.armX[0] = 0.35, e4.armZ[0] = 0.22, e4.elbow[0] = 1.3, e4.handY[0] = 0.9, e4.handZ[0] = -0.3, e4.fing[0] = 0.7) : r2.offHand === `item` && (e4.armX[0] = 0.15, e4.armZ[0] = 0.15, e4.elbow[0] = 0.6, e4.fing[0] = 1.2), r2.dangleArm > 0 && (e4.armX[0] = 0.05 + Math.sin(n2 * 1.3) * 0.05, e4.armZ[0] = 0.04, e4.armY[0] = -0.4, e4.elbow[0] = 0.06, e4.clavZ[0] = -0.12, e4.handZ[0] = 0.3, e4.fing[0] = 0.5);
    }
    idle(e4, t2, n2) {
      let r2 = this.style, i2 = this.seedF * 17;
      this.stance(e4, n2 ? 0.9 : 1.15, n2 ? 0.03 : 0.07, n2 ? r2.crouch * 0.5 : r2.crouch, 0.16), this.posture(e4, n2 ? 0.85 : 1), this.breathe(e4, t2);
      let a2 = Math.sin(t2 * 0.45 + i2) * 0.012 * r2.idleSway;
      e4.hx += a2, e4.hrz += a2 * 1.6, e4.crz -= a2 * 1.2, n2 || (e4.hry += 0.12, e4.cry -= 0.08, e4.hdy -= 0.04), e4.hdy += a_(t2 * 0.22, i2, 1) * 0.32 * r2.idleSway, e4.hdx += a_(t2 * 0.17, i2, 5) * 0.06, e4.nry += a_(t2 * 0.22, i2, 1) * 0.08, this.armsRest(e4, n2, t2), e4.armX[0] += Math.sin(t2 * 0.9 + i2) * 0.02, e4.armX[1] += Math.sin(t2 * 0.9 + i2 + 1.3) * 0.02, n2 && this.townPose(e4, t2), r2.gait === `scurry` && (e4.hdy += Math.sin(t2 * 5.3 + i2) * 0.06 * z(0.6, 1, Math.sin(t2 * 0.7 + i2)), e4.hy += Math.sin(t2 * 9) * 4e-3);
    }
    townPose(e4, t2) {
      let n2 = this.style;
      if (n2.townPose === `clasped`) for (let t3 = 0; t3 < 2; t3 += 1) e4.armX[t3] = 0.3, e4.armZ[t3] = -0.12, e4.armY[t3] = 0.35, e4.elbow[t3] = 1.45, e4.handZ[t3] = 0.5, e4.fing[t3] = 1;
      else n2.townPose === `hammer` ? (e4.armX[1] = 0.9, e4.armZ[1] = 0.3, e4.elbow[1] = 2.1, e4.handX[1] = 0.6, e4.handY[1] = 0.4, e4.armX[0] = 0.25, e4.armZ[0] = -0.1, e4.elbow[0] = 1.5, e4.armY[0] = 0.5, e4.fing[0] = 1.2) : n2.townPose === `staffLean` ? (e4.armX[1] = 0.35, e4.armZ[1] = 0.05, e4.elbow[1] = 1.05, e4.handX[1] = Math.PI / 2 - 1.4 - 0.05, e4.armX[0] = 0.4, e4.armZ[0] = -0.25, e4.armY[0] = 0.4, e4.elbow[0] = 1.15, e4.fing[0] = 1.2, e4.srx += 0.06, e4.crx += 0.05) : n2.townPose === `captain` ? (e4.armX[0] = -0.1, e4.armZ[0] = 0.55, e4.armY[0] = -0.4, e4.elbow[0] = 1.8, e4.handZ[0] = 0.4, e4.fing[0] = 1, e4.armX[1] = 0.05, e4.elbow[1] = 0.35, e4.hry += 0.15, e4.crz += 0.03) : n2.townPose === `book` && (e4.armX[0] = 0.75, e4.armZ[0] = 0, e4.armY[0] = 0.6, e4.elbow[0] = 1.6, e4.handY[0] = 1, e4.fing[0] = 0.7, e4.hdx += 0.25 + Math.sin(t2 * 0.6) * 0.05);
    }
    footCycle(e4, t2, n2, r2, i2, a2) {
      let o2 = this.foot;
      if (e4 < t2) {
        let r3 = e4 / t2;
        o2.z = n2 * 0.5 - r3 * n2, o2.y = 0;
        let a3 = i2 ? -0.12 : -0.3, s2 = i2 ? 0.75 : 0.55;
        o2.pitch = a3 * (1 - z(0, 0.2, r3)) + s2 * z(0.55, 1, r3) ** 1.4, o2.toe = Math.max(0, o2.pitch);
      } else {
        let s2 = (e4 - t2) / (1 - t2), c2 = s2 * s2 * (3 - 2 * s2);
        o2.z = -n2 * 0.5 + c2 * n2, o2.y = r2 * Math.sin(Math.PI * s2 ** (i2 ? 0.75 : 0.85)) * (1 - a2 * 0.9);
        let l2 = i2 ? 0.75 : 0.55, u2 = i2 ? -0.12 : -0.3;
        o2.pitch = R(l2, -0.12, z(0, 0.4, s2)) * (1 - z(0.6, 1, s2)) + u2 * z(0.6, 1, s2), a2 > 0 && (o2.pitch = R(o2.pitch, 0.7, a2)), o2.toe = Math.max(0, o2.pitch) * (1 - z(0, 0.35, s2));
      }
      return o2;
    }
    placeFoot(e4, t2, n2, r2, i2, a2) {
      let o2 = this.ankleY, s2, c2;
      if (a2 >= 0) {
        let e5 = r2 + this.ballZ;
        s2 = o2 * Math.cos(a2) + this.ballZ * Math.sin(a2), c2 = e5 + o2 * Math.sin(a2) - this.ballZ * Math.cos(a2);
      } else {
        let e5 = r2 - this.heelZ, t3 = a2;
        s2 = o2 * Math.cos(t3) - this.heelZ * Math.sin(t3), c2 = e5 + o2 * Math.sin(t3) + this.heelZ * Math.cos(t3);
      }
      e4.fx[t2] = n2, e4.fy[t2] = s2 + i2, e4.fz[t2] = c2, e4.fpitch[t2] = a2;
    }
    locomotion(e4, t2, n2) {
      let r2 = this.style, i2 = n2 ? r2.runRef : r2.walkRef, a2 = Math.max(0, t2.speed), o2 = n2 ? r2.runStance : r2.walkStance, s2 = n2 ? r2.runCrouch : r2.crouch * 1.4, c2 = (n2 ? r2.runStride : r2.walkStride) * l_(Math.sqrt(Math.max(a2, 0.05) / i2), 0.45, 1.3), l2 = this.hipsBind.y - s2 - (this.hipsBind.y - this.J.hipL[1]), u2 = (this.L1 + this.L2) * 0.985, d2 = Math.max(0.05, l2 - this.ankleY - (n2 ? r2.runBob : r2.bob)), f2 = Math.sqrt(Math.max(1e-4, u2 * u2 - d2 * d2)) * 2 * 0.92;
      c2 * o2 > f2 && (c2 = f2 / o2);
      let p2 = a2 / Math.max(0.2, c2);
      this.phase = s_(this.phase + t2.dt * p2);
      let m2 = this.phase, h2 = c2 * o2, g2 = (n2 ? r2.runStepH : r2.stepH) * l_(a2 / i2, 0.5, 1.2), _2 = l_(a2 / i2, 0.25, 1.15), v2 = Math.PI * 2, y2 = this.hw + r2.footSpread * (r2.gait === `heavy` || r2.gait === `brute` ? 1.6 : r2.gait === `graceful` ? -0.4 : 1);
      for (let t3 = 0; t3 < 2; t3 += 1) {
        let i3 = s_(m2 + (t3 === 0 ? 0 : 0.5) + (r2.limp && t3 === 1 ? 0.04 : 0)), a3 = r2.limp && t3 === 1 ? r2.limp : 0, s3 = this.footCycle(i3, o2, h2 * (a3 ? 0.8 : 1), g2 * (r2.gait === `march` ? 1.5 : 1), n2, a3), c3 = zb[t3] * y2;
        this.placeFoot(e4, t3, c3, s3.z, s3.y, s3.pitch), e4.toe[t3] = s3.toe, e4.fyaw[t3] = zb[t3] * (r2.gait === `scurry` ? 0.3 : 0.08), e4.kneeOut[t3] = r2.gait === `scurry` || r2.gait === `brute` ? 0.45 : 0.12;
      }
      let b2 = Math.cos(v2 * m2), x2 = Math.sin(v2 * m2);
      n2 ? e4.hy = -s2 - r2.runBob * Math.cos(2 * v2 * (m2 - o2 * 0.5)) * _2 : e4.hy = -s2 - r2.bob * Math.cos(2 * v2 * m2) * _2, e4.hx = r2.sway * x2 * (n2 ? 0.5 : 1) * (r2.gait === `graceful` ? 1.6 : 1), e4.hry = -r2.pelvisYaw * b2 * _2, e4.hrz = (n2 ? 0.03 : 0.05) * x2 * _2 * (r2.gait === `graceful` ? 1.5 : 1), e4.hrx = (n2 ? r2.runLean * 0.45 : r2.lean * 0.4) * _2, this.posture(e4), e4.srx += (n2 ? r2.runLean * 0.35 : r2.lean * 0.35) * _2, e4.crx += (n2 ? r2.runLean * 0.2 : r2.lean * 0.25) * _2 + (n2 ? 0.03 * Math.cos(2 * v2 * m2) : 0), e4.cry = r2.pelvisYaw * 1.35 * b2 * _2, e4.crz = -e4.hrz * 0.8, e4.hdy = -r2.pelvisYaw * 0.5 * b2 * _2, e4.hdx -= (n2 ? r2.runLean * 0.5 : r2.lean * 0.5) * _2;
      let S2 = (n2 ? r2.runArmSwing : r2.armSwing) * _2;
      for (let t3 = 0; t3 < 2; t3 += 1) {
        let i3 = t3 === 0 ? -1 : 1;
        e4.armX[t3] = i3 * S2 * b2 + (n2 ? 0.1 : 0.02), e4.armZ[t3] = r2.armOut + (n2 ? 0.08 : 0.02), e4.elbow[t3] = (n2 ? 1.45 : r2.elbow + 0.15) + Math.max(0, e4.armX[t3]) * (n2 ? 0.5 : 0.6), e4.fing[t3] = n2 ? 1.1 : r2.fingersOpen, e4.handZ[t3] = 0.1;
      }
      let C2 = r2.weapon;
      if (C2 === `oneHand` || C2 === `cleaver` || C2 === `dagger` || C2 === `wand`) e4.armX[1] = e4.armX[1] * 0.6 + 0.2, e4.elbow[1] = n2 ? 1.5 : 1.05, e4.handX[1] = n2 ? -0.5 : -0.3, e4.fing[1] = 1.35;
      else if (C2 === `twoHand`) e4.armX[1] = 0.45 + 0.1 * b2, e4.armZ[1] = -0.05, e4.armY[1] = 0.3, e4.elbow[1] = 1.25, e4.handX[1] = n2 ? 0.5 : 0.3, e4.handY[1] = -0.35, e4.fing[1] = 1.35, e4.lhIK = 1;
      else if (C2 === `staff`) e4.armX[1] = 0.25 + 0.25 * b2 * _2, e4.armZ[1] = 0.16, e4.elbow[1] = 1.25, e4.handX[1] = Math.PI / 2 - e4.armX[1] - 1.25 - 0.2, e4.fing[1] = 1.35;
      else if (C2 === `bow`) e4.armX[0] = e4.armX[0] * 0.5 + 0.2, e4.elbow[0] = 1, e4.fing[0] = 1.35;
      else if (C2 === `claw`) for (let t3 = 0; t3 < 2; t3 += 1) e4.armX[t3] = e4.armX[t3] * 0.7 + 0.35, e4.armZ[t3] = 0.35, e4.elbow[t3] = 0.9, e4.fing[t3] = 0.3;
      switch (r2.offHand === `shield` ? (e4.armX[0] = 0.38 + e4.armX[0] * 0.25, e4.armZ[0] = 0.28, e4.elbow[0] = 1.25, e4.armY[0] = -1.05, e4.handY[0] = 0, e4.fing[0] = 1.3) : r2.offHand === `orb` && (e4.armX[0] = 0.35 + e4.armX[0] * 0.4, e4.elbow[0] = 1.25, e4.handY[0] = 0.9, e4.fing[0] = 0.7), r2.gait) {
        case `scurry`:
          e4.hy -= 0.02;
          for (let t3 = 0; t3 < 2; t3 += 1) e4.armX[t3] = 0.5 + Math.sin(v2 * m2 * 2 + t3 * 2.1) * 0.35, e4.armZ[t3] = 0.5, e4.elbow[t3] = 1.1, e4.fing[t3] = 0.3;
          e4.hdx += Math.sin(2 * v2 * m2) * 0.06, e4.crz += Math.sin(v2 * m2) * 0.08;
          break;
        case `shamble`:
          e4.hrz += 0.09 * x2, e4.crz += -0.14 * x2 + 0.05, e4.cry += 0.1 * b2, e4.hdz += 0.25 + 0.1 * x2, e4.hdx += 0.1, e4.armX[1] = 0.55 + 0.15 * b2, e4.armZ[1] = 0.25, e4.elbow[1] = 0.4, e4.fing[1] = 0.6;
          break;
        case `march`:
          for (let t3 = 0; t3 < 2; t3 += 1) e4.elbow[t3] *= 0.4;
          e4.crz *= 0.3, e4.hrz *= 0.3, e4.hdz += 0.05 * x2;
          break;
        case `heavy`:
        case `brute`:
          e4.crz += -0.07 * x2, e4.hy -= 0.01;
          for (let t3 = 0; t3 < 2; t3 += 1) e4.armZ[t3] += 0.12;
          break;
        case `eerie`:
          for (let t3 = 0; t3 < 2; t3 += 1) e4.armX[t3] *= 0.4, e4.armZ[t3] = 0.06;
          e4.hdx += 0.05;
          break;
        case `old`:
          e4.hdx += 0.05;
          break;
        default:
          break;
      }
      if (r2.dangleArm > 0) {
        let t3 = Math.sin(v2 * m2 + 0.9);
        e4.armX[0] = 0.08 + t3 * 0.18 * _2, e4.armZ[0] = 0.05 + Math.abs(t3) * 0.06, e4.armY[0] = -0.4, e4.elbow[0] = 0.08, e4.clavZ[0] = -0.14, e4.handZ[0] = 0.35, e4.fing[0] = 0.5;
      }
    }
    lungeStance(e4, t2, n2, r2 = 1) {
      let i2 = this.style;
      this.stance(e4, 1.15, 0.07, i2.crouch);
      let a2 = L(t2, [0, 0.12, n2 - 0.08, 0.8, 1], [0, 0, 1, 1, 0], [null, rx, null, rx]), o2 = g_(0.12, n2 - 0.08, t2) + g_(0.8, 1, t2) * 0.6;
      e4.fz[0] = 0.07 + a2 * 0.2 * r2, e4.fy[0] = this.ankleY + o2 * 0.06, e4.fpitch[0] = -o2 * 0.25, e4.fz[1] = -0.07 - a2 * 0.06 * r2, e4.hz = a2 * 0.08 * r2, e4.hy = -i2.crouch - a2 * 0.05 * r2;
    }
    attack(e4, t2, n2, r2) {
      let i2 = this.style, a2 = $p.attack1 ?? 0.55;
      this.posture(e4), this.breathe(e4, r2, 0.3);
      let o2 = i2.weapon, s2 = [0, a2 * 0.55, a2, a2 + 0.17, 1];
      if (this.armsRest(e4, false, r2), o2 === `bow`) {
        this.bowShot(e4, t2, a2, false);
        return;
      }
      if (o2 === `smash`) {
        this.smash(e4, t2, a2);
        return;
      }
      if (o2 === `claw`) {
        this.claw(e4, t2, a2, n2);
        return;
      }
      this.lungeStance(e4, t2, a2, o2 === `twoHand` ? 1.2 : 1);
      let c2 = [rx, nx, tx, rx];
      if (o2 === `twoHand` || o2 === `staff` && n2 === 0) {
        e4.lhIK = +(o2 === `twoHand` || o2 === `staff`), e4.armX[1] = L(t2, s2, [e4.armX[1], 2.75, 1, 0.35, e4.armX[1]], c2), e4.armZ[1] = L(t2, s2, [e4.armZ[1], 0.35, -0.05, -0.35, e4.armZ[1]], c2), e4.armY[1] = L(t2, s2, [e4.armY[1], 0.55, 0.2, 0, e4.armY[1]], c2), e4.elbow[1] = L(t2, s2, [e4.elbow[1], 1.75, 0.2, 0.35, e4.elbow[1]], c2), e4.handX[1] = L(t2, s2, [e4.handX[1], 0.9, -0.25, -0.7, e4.handX[1]], c2), e4.handY[1] = L(t2, s2, [e4.handY[1], -0.4, -0.2, -0.1, e4.handY[1]], c2), e4.cry += L(t2, s2, [-0.12, -0.55, 0.3, 0.5, -0.12], c2), e4.hry += L(t2, s2, [0, -0.25, 0.18, 0.25, 0], c2), e4.crx += L(t2, s2, [0, -0.22, 0.38, 0.45, 0], c2), e4.srx += L(t2, s2, [0, -0.08, 0.18, 0.2, 0], c2), e4.hdx += L(t2, s2, [0, 0.12, -0.2, -0.25, 0], c2), o2 === `staff` && (e4.handX[1] = L(t2, s2, [e4.handX[1], 0.6, -0.4, -0.7, e4.handX[1]], c2));
        return;
      }
      if (o2 === `staff`) {
        e4.lhIK = 1, e4.armX[1] = L(t2, s2, [e4.armX[1], 0.3, 1.35, 1.2, e4.armX[1]], c2), e4.armZ[1] = L(t2, s2, [e4.armZ[1], 0.3, 0.05, 0.05, e4.armZ[1]], c2), e4.elbow[1] = L(t2, s2, [e4.elbow[1], 1.9, 0.2, 0.35, e4.elbow[1]], c2), e4.handX[1] = L(t2, s2, [e4.handX[1], -0.2, -1.4, -1.3, e4.handX[1]], c2), e4.cry += L(t2, s2, [0, -0.45, 0.2, 0.15, 0], c2), e4.crx += L(t2, s2, [0, -0.1, 0.3, 0.25, 0], c2);
        return;
      }
      if (o2 === `dagger` || o2 === `wand` && n2 === 1) {
        e4.armX[1] = L(t2, s2, [e4.armX[1], 0.1, 1.45, 1.25, e4.armX[1]], c2), e4.armZ[1] = L(t2, s2, [e4.armZ[1], 0.45, 0.05, 0.05, e4.armZ[1]], c2), e4.elbow[1] = L(t2, s2, [e4.elbow[1], 2.1, 0.12, 0.3, e4.elbow[1]], c2), e4.handX[1] = L(t2, s2, [e4.handX[1], 0.2, -1.45, -1.35, e4.handX[1]], c2), e4.cry += L(t2, s2, [0, -0.5, 0.35, 0.3, 0], c2), e4.crx += L(t2, s2, [0, -0.05, 0.25, 0.2, 0], c2), e4.armX[0] = L(t2, s2, [e4.armX[0], 0.6, -0.2, -0.1, e4.armX[0]], c2), e4.elbow[0] = L(t2, s2, [e4.elbow[0], 1.2, 0.6, 0.6, e4.elbow[0]], c2);
        return;
      }
      if (n2 === 0) {
        let n3 = o2 === `wand` ? 0.7 : 1;
        e4.armX[1] = L(t2, s2, [e4.armX[1], 2.6 * n3, 1.15, 0.5, e4.armX[1]], c2), e4.armZ[1] = L(t2, s2, [e4.armZ[1], 0.75, 0, -0.55, e4.armZ[1]], c2), e4.armY[1] = L(t2, s2, [e4.armY[1], 0.9, 0.35, -0.1, e4.armY[1]], c2), e4.elbow[1] = L(t2, s2, [e4.elbow[1], 2, 0.18, 0.45, e4.elbow[1]], c2), e4.handX[1] = L(t2, s2, [e4.handX[1], 0.6, -0.55, -0.9, e4.handX[1]], c2), e4.handY[1] = L(t2, s2, [0, -0.3, 0.1, 0.3, 0], c2), e4.cry += L(t2, s2, [0, -0.55 * n3, 0.4, 0.55, 0], c2), e4.hry += L(t2, s2, [0, -0.2, 0.15, 0.2, 0], c2), e4.crx += L(t2, s2, [0, -0.15, 0.3, 0.35, 0], c2), e4.srx += L(t2, s2, [0, -0.05, 0.12, 0.15, 0], c2), e4.hdy += L(t2, s2, [0, 0.35, -0.2, -0.3, 0], c2), e4.armX[0] = L(t2, s2, [e4.armX[0], 0.55, -0.35, -0.4, e4.armX[0]], c2), e4.armZ[0] = L(t2, s2, [e4.armZ[0], 0.25, 0.45, 0.5, e4.armZ[0]], c2), e4.elbow[0] = L(t2, s2, [e4.elbow[0], 1, 0.5, 0.45, e4.elbow[0]], c2);
      } else e4.armX[1] = L(t2, s2, [e4.armX[1], 1.2, 1.45, 1.2, e4.armX[1]], c2), e4.armZ[1] = L(t2, s2, [e4.armZ[1], -0.75, 0.55, 1.15, e4.armZ[1]], c2), e4.armY[1] = L(t2, s2, [e4.armY[1], -0.5, 0.2, 0.6, e4.armY[1]], c2), e4.elbow[1] = L(t2, s2, [e4.elbow[1], 1.9, 0.3, 0.2, e4.elbow[1]], c2), e4.handX[1] = L(t2, s2, [e4.handX[1], 0.1, -0.2, -0.3, e4.handX[1]], c2), e4.handY[1] = L(t2, s2, [0, -1.2, -1, -0.7, 0], c2), e4.cry += L(t2, s2, [0, 0.55, -0.35, -0.6, 0], c2), e4.hry += L(t2, s2, [0, 0.2, -0.15, -0.22, 0], c2), e4.crx += L(t2, s2, [0, 0.05, 0.2, 0.15, 0], c2), e4.hdy += L(t2, s2, [0, -0.3, 0.1, 0.25, 0], c2), e4.armX[0] = L(t2, s2, [e4.armX[0], -0.1, 0.4, 0.35, e4.armX[0]], c2), e4.armZ[0] = L(t2, s2, [e4.armZ[0], 0.6, 0.3, 0.25, e4.armZ[0]], c2);
    }
    bowShot(e4, t2, n2, r2) {
      this.stance(e4, 1.35, 0.1, this.style.crouch * 1.2, 0.35), e4.fz[0] = 0.12, e4.fz[1] = -0.1;
      let i2 = [0, 0.18, n2 - 0.03, n2, n2 + 0.12, 1], a2 = [rx, rx, null, tx, rx], o2 = +!!r2;
      e4.hry += L(t2, i2, [0, -0.35, -0.55, -0.55, -0.5, 0], a2), e4.cry += L(t2, i2, [0, -0.35, -0.55, -0.55, -0.45, 0], a2), e4.hdy += L(t2, i2, [0, 0.4, 0.95, 0.95, 0.9, 0], a2), e4.crx += L(t2, i2, [0, 0.05, -0.05 - o2 * 0.35, -0.05 - o2 * 0.35, 0, 0], a2), e4.hdx += L(t2, i2, [0, 0, -o2 * 0.45, -o2 * 0.45, -o2 * 0.3, 0], a2), e4.armX[0] = L(t2, i2, [e4.armX[0], 1, 1.5 + o2 * 0.8, 1.5 + o2 * 0.8, 1.45 + o2 * 0.7, e4.armX[0]], a2), e4.armZ[0] = L(t2, i2, [e4.armZ[0], 0.35, 0.62, 0.62, 0.6, e4.armZ[0]], a2), e4.armY[0] = L(t2, i2, [e4.armY[0], -0.3, -0.5, -0.5, -0.5, e4.armY[0]], a2), e4.elbow[0] = L(t2, i2, [e4.elbow[0], 0.5, 0.06, 0.06, 0.1, e4.elbow[0]], a2), e4.handX[0] = L(t2, i2, [e4.handX[0], 0.4, 0.05, 0.05, 0.05, e4.handX[0]], a2), e4.handY[0] = L(t2, i2, [e4.handY[0], -0.4, -0.2, -0.2, -0.2, e4.handY[0]], a2), e4.armX[1] = L(t2, i2, [e4.armX[1], 1.4, 1.25 + o2 * 0.75, 1.25 + o2 * 0.75, 1 + o2 * 0.6, e4.armX[1]], a2), e4.armZ[1] = L(t2, i2, [e4.armZ[1], 0.1, 0.78, 0.78, 1.05, e4.armZ[1]], a2), e4.armY[1] = L(t2, i2, [e4.armY[1], 0.2, 0.3, 0.3, 0.3, e4.armY[1]], a2), e4.elbow[1] = L(t2, i2, [e4.elbow[1], 1.3, 2.35, 2.35, 1.6, e4.elbow[1]], a2), e4.handX[1] = L(t2, i2, [0, 0.2, 0, 0, 0.3, 0], a2), e4.fing[1] = L(t2, i2, [0.6, 1.1, 1.2, 1.2, 0.1, 0.6], a2), e4.ex[0] = L(t2, [0, 0.18, n2 - 0.03, n2, n2 + 0.04, 1], [0, 0, 1, 1, -0.15, 0], [null, rx, null, tx, rx]), e4.ex[1] = +(t2 > 0.12 && t2 < n2);
    }
    smash(e4, t2, n2) {
      this.lungeStance(e4, t2, n2, 0.6);
      let r2 = [0, n2 * 0.6, n2, n2 + 0.18, 1], i2 = [rx, nx, tx, rx];
      for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = L(t2, r2, [e4.armX[n3], 2.85, 1, 0.55, e4.armX[n3]], i2), e4.armZ[n3] = L(t2, r2, [e4.armZ[n3], 0.25, 0.05, 0.12, e4.armZ[n3]], i2), e4.elbow[n3] = L(t2, r2, [e4.elbow[n3], 1.3, 0.15, 0.35, e4.elbow[n3]], i2), e4.fing[n3] = L(t2, r2, [0.6, 1.2, 1.3, 1, 0.6], i2);
      e4.crx += L(t2, r2, [0, -0.3, 0.45, 0.55, 0], i2), e4.srx += L(t2, r2, [0, -0.1, 0.25, 0.3, 0], i2), e4.hdx += L(t2, r2, [0, -0.2, 0.15, 0.2, 0], i2), e4.hy += L(t2, r2, [0, 0.02, -0.08, -0.1, 0], i2), e4.jaw = L(t2, r2, [0, 0.4, 0.2, 0.1, 0], i2);
    }
    claw(e4, t2, n2, r2) {
      this.lungeStance(e4, t2, n2, 0.8);
      let i2 = [0, n2 * 0.6, n2, n2 + 0.17, 1], a2 = [rx, nx, tx, rx], o2 = +(r2 === 0), s2 = 1 - o2, c2 = r2 === 0 ? 1 : -1;
      e4.armX[o2] = L(t2, i2, [e4.armX[o2], 1.9, 1.1, 0.5, e4.armX[o2]], a2), e4.armZ[o2] = L(t2, i2, [e4.armZ[o2], 0.9, -0.1, -0.45, e4.armZ[o2]], a2), e4.elbow[o2] = L(t2, i2, [e4.elbow[o2], 1.6, 0.3, 0.5, e4.elbow[o2]], a2), e4.fing[o2] = L(t2, i2, [0.3, -0.2, 1, 0.9, 0.3], a2), e4.armX[s2] = L(t2, i2, [e4.armX[s2], 0.7, 0.2, 0.15, e4.armX[s2]], a2), e4.cry += c2 * L(t2, i2, [0, -0.5, 0.35, 0.45, 0], a2), e4.crx += L(t2, i2, [0, -0.1, 0.3, 0.3, 0], a2), e4.jaw = L(t2, i2, [0, 0.5, 0.3, 0.1, 0], a2);
    }
    cast(e4, t2, n2) {
      let r2 = this.style, i2 = $p.cast ?? 0.55;
      this.stance(e4, 1.15, 0.09, r2.crouch * 1.3), this.posture(e4), this.breathe(e4, n2, 0.3), this.armsRest(e4, false, n2);
      let a2 = [0, i2 * 0.6, i2, i2 + 0.2, 1], o2 = [rx, nx, tx, rx];
      if (e4.hz = L(t2, a2, [0, -0.03, 0.07, 0.06, 0], o2), e4.crx += L(t2, a2, [0, -0.12, 0.22, 0.18, 0], o2), e4.cry += L(t2, a2, [0, -0.3, 0.12, 0.08, 0], o2), e4.hdx += L(t2, a2, [0, 0.1, -0.1, -0.05, 0], o2), r2.castStyle === `staff` || r2.weapon === `staff`) {
        e4.armX[1] = L(t2, a2, [e4.armX[1], 0.7, 0.95, 0.9, e4.armX[1]], o2), e4.elbow[1] = L(t2, a2, [e4.elbow[1], 1.5, 1.2, 1.25, e4.elbow[1]], o2), e4.handX[1] = L(t2, a2, [e4.handX[1], -0.15, -0.35, -0.3, e4.handX[1]], o2);
        let n3 = Math.sin(z(0, i2 * 0.85, t2) * Math.PI * 2) * (1 - z(i2 * 0.7, i2, t2));
        e4.armX[0] = L(t2, a2, [e4.armX[0], 0.9, 1.5, 1.35, e4.armX[0]], o2) + n3 * 0.25, e4.armZ[0] = L(t2, a2, [e4.armZ[0], -0.2, 0.22, 0.25, e4.armZ[0]], o2) + n3 * 0.2, e4.elbow[0] = L(t2, a2, [e4.elbow[0], 2, 0.1, 0.25, e4.elbow[0]], o2), e4.handZ[0] = L(t2, a2, [0.1, 0.4, -0.65, -0.5, 0.1], o2), e4.handY[0] = L(t2, a2, [0, 0.6, 1.4, 1.3, 0], o2), e4.fing[0] = L(t2, a2, [0.4, 1.1, -0.35, -0.2, 0.4], o2);
      } else if (r2.castStyle === `eerie` || r2.weapon === `wand`) e4.armX[1] = L(t2, a2, [e4.armX[1], 0.6, 1.55, 1.45, e4.armX[1]], o2), e4.armZ[1] = L(t2, a2, [e4.armZ[1], 0.45, 0.08, 0.1, e4.armZ[1]], o2), e4.elbow[1] = L(t2, a2, [e4.elbow[1], 1.9, 0.1, 0.2, e4.elbow[1]], o2), e4.handX[1] = L(t2, a2, [e4.handX[1], 0.4, -1.35, -1.3, e4.handX[1]], o2), e4.armX[0] = L(t2, a2, [e4.armX[0], 1, 0.6, 0.55, e4.armX[0]], o2), e4.armZ[0] = L(t2, a2, [e4.armZ[0], -0.05, 0.75, 0.7, e4.armZ[0]], o2), e4.elbow[0] = L(t2, a2, [e4.elbow[0], 1.8, 0.45, 0.5, e4.elbow[0]], o2), e4.handY[0] = L(t2, a2, [0, 0.4, 1.2, 1.1, 0], o2), e4.fing[0] = L(t2, a2, [0.4, 1.2, -0.4, -0.3, 0.4], o2);
      else for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = L(t2, a2, [e4.armX[n3], 0.75, 1.5, 1.4, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], -0.25, 0.1, 0.12, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 2.1, 0.12, 0.25, e4.elbow[n3]], o2), e4.handZ[n3] = L(t2, a2, [0.1, 0.5, -0.7, -0.5, 0.1], o2), e4.handY[n3] = L(t2, a2, [0, 0.4, 1.3, 1.2, 0], o2), e4.fing[n3] = L(t2, a2, [0.4, 1.2, -0.35, -0.2, 0.4], o2);
    }
    castUp(e4, t2, n2) {
      let r2 = this.style, i2 = $p.castUp ?? 0.5;
      this.stance(e4, 1.25, 0.06, r2.crouch), this.posture(e4, L(t2, [0, i2, 0.8, 1], [1, 0.2, 0.2, 1])), this.armsRest(e4, false, n2);
      let a2 = [0, i2 * 0.6, i2, 0.8, 1], o2 = [rx, nx, null, rx];
      e4.hy += L(t2, a2, [0, -0.08, 0.02, 0, 0], o2), e4.crx += L(t2, a2, [0, 0.25, -0.3, -0.25, 0], o2), e4.srx += L(t2, a2, [0, 0.1, -0.12, -0.1, 0], o2), e4.hdx += L(t2, a2, [0, 0.25, -0.45, -0.4, 0], o2), e4.jaw = L(t2, a2, [0, 0.1, 0.9, 0.8, 0], o2);
      let s2 = r2.weapon === `twoHand` || r2.weapon === `staff`;
      for (let n3 = 0; n3 < 2; n3 += 1) {
        if (s2 && n3 === 1) {
          e4.armX[n3] = L(t2, a2, [e4.armX[n3], 0.6, 2.7, 2.6, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], 0.2, 0.25, 0.25, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 1.4, 0.3, 0.35, e4.elbow[n3]], o2);
          continue;
        }
        e4.armX[n3] = L(t2, a2, [e4.armX[n3], 0.2, 2.35, 2.3, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], -0.2, 0.85, 0.8, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 1.7, 0.35, 0.4, e4.elbow[n3]], o2), e4.fing[n3] = L(t2, a2, [e4.fing[n3], 1.3, -0.3, -0.2, e4.fing[n3]], o2);
      }
      e4.lhIK = 0;
    }
    kick(e4, t2, n2) {
      let r2 = $p.kick ?? 0.5;
      this.stance(e4, 1, 0, this.style.crouch), this.posture(e4), this.armsRest(e4, false, n2);
      let i2 = [0, r2 * 0.6, r2, r2 + 0.2, 1], a2 = [rx, nx, tx, rx], o2 = L(t2, [0, 0.12, 0.85, 1], [1, 0, 0, 1]);
      e4.ik[1] = o2, e4.thX[1] = L(t2, i2, [0, 1.25, 1.45, 0.9, 0], a2), e4.knee[1] = L(t2, i2, [0, 2, 0.1, 0.9, 0], a2), e4.ftX[1] = L(t2, i2, [0, 0.4, -0.3, 0.2, 0], a2), e4.hrx += L(t2, i2, [0, -0.1, -0.25, -0.15, 0], a2), e4.crx += L(t2, i2, [0, 0.1, -0.05, 0, 0], a2), e4.hx = L(t2, i2, [0, 0.05, 0.06, 0.05, 0], a2), e4.hz = L(t2, i2, [0, -0.04, -0.06, -0.04, 0], a2), e4.fx[0] = this.hw * 0.7;
      for (let n3 = 0; n3 < 2; n3 += 1) e4.armZ[n3] += L(t2, i2, [0, 0.3, 0.5, 0.4, 0], a2), e4.armX[n3] += L(t2, i2, [0, 0.2, -0.3, -0.1, 0], a2) * (n3 === 0 ? 1 : -0.5);
    }
    hit(e4, t2, n2) {
      let r2 = this.style;
      this.stance(e4, 1.15, 0.06, r2.crouch), this.posture(e4), this.armsRest(e4, false, n2);
      let i2 = L(t2, [0, 0.22, 1], [0, 1, 0], [tx, rx]), a2 = this.playIndex % 2 == 0 ? 1 : -1;
      e4.hz -= 0.06 * i2, e4.hy -= 0.035 * i2, e4.hrx -= 0.08 * i2, e4.crx -= 0.28 * i2, e4.cry += 0.18 * i2 * a2, e4.crz += 0.08 * i2 * a2, e4.hdx -= 0.35 * i2, e4.hdy -= 0.25 * i2 * a2, e4.jaw = 0.35 * i2;
      for (let t3 = 0; t3 < 2; t3 += 1) e4.armZ[t3] += 0.35 * i2, e4.armX[t3] += 0.25 * i2, e4.elbow[t3] += 0.2 * i2;
    }
    block(e4, t2, n2) {
      let r2 = this.style;
      this.stance(e4, 1.25, 0.12, r2.crouch * 1.6), this.posture(e4), this.armsRest(e4, false, n2);
      let i2 = L(t2, [0, $p.block ?? 0.3, 0.72, 1], [0, 1, 1, 0], [tx, null, rx]);
      e4.armX[0] = R(e4.armX[0], 1.05, i2), e4.armZ[0] = R(e4.armZ[0], 0.2, i2), e4.armY[0] = R(e4.armY[0], -1, i2), e4.elbow[0] = R(e4.elbow[0], 1.65, i2), e4.handY[0] = R(e4.handY[0], -0.2, i2), e4.handX[0] = R(e4.handX[0], 0.1, i2), e4.crx += 0.15 * i2, e4.cry += 0.2 * i2, e4.hdx += 0.1 * i2, e4.hz -= 0.03 * i2, e4.hy -= 0.03 * i2;
    }
    spin(e4, t2) {
      let n2 = t2.t, r2 = this.style, i2 = n2 * 2.6 * Math.PI * 2;
      this.stance(e4, 1.2, 0, r2.crouch * 2.2, 0);
      let a2 = Math.abs(Math.sin(i2)) * 0.05;
      for (let t3 = 0; t3 < 2; t3 += 1) {
        let n3 = e4.fx[t3], r3 = e4.fz[t3];
        e4.fx[t3] = n3 * Math.cos(i2) + r3 * Math.sin(i2), e4.fz[t3] = -n3 * Math.sin(i2) + r3 * Math.cos(i2), e4.fyaw[t3] = i2 + zb[t3] * 0.1, e4.fy[t3] = this.ankleY + (t3 === 0 ? a2 : Math.abs(Math.sin(i2 + 1.5)) * 0.05);
      }
      e4.hry = i2, e4.hrz = 0.08, e4.crx += 0.12, e4.cry = 0.25, e4.hdy = -0.3, e4.armX[1] = 1.45, e4.armZ[1] = 0.75, e4.elbow[1] = 0.12, e4.handX[1] = 0.1, e4.handY[1] = -0.9, e4.fing[1] = 1.35, e4.armX[0] = 1.2, e4.armZ[0] = 1.1, e4.elbow[0] = 0.25, e4.fing[0] = r2.offHand === `none` ? 0.6 : 1.3, r2.weapon === `twoHand` && (e4.lhIK = 1, e4.armZ[1] = 0.25, e4.armX[1] = 1.55);
    }
    leap(e4, t2, n2) {
      let r2 = this.style;
      this.stance(e4, 1.1, 0.06, r2.crouch), this.posture(e4), this.armsRest(e4, false, n2);
      let i2 = [0, 0.18, 0.32, 0.55, 0.8, 0.9, 1], a2 = [rx, tx, rx, rx, tx, rx];
      e4.hy = L(t2, i2, [-r2.crouch, -0.24, -0.02, 0.02, -0.02, -0.26, -r2.crouch], a2);
      let o2 = z(0.24, 0.36, t2) * (1 - z(0.76, 0.86, t2));
      e4.ik[0] = 1 - o2, e4.ik[1] = 1 - o2;
      for (let n3 = 0; n3 < 2; n3 += 1) e4.thX[n3] = L(t2, i2, [0, 0.6, 0.2, 1.3 - n3 * 0.3, 0.5, 0.7, 0], a2), e4.knee[n3] = L(t2, i2, [0, 1.2, 0.3, 1.9, 0.5, 1.2, 0], a2), e4.ftX[n3] = L(t2, i2, [0, 0, 0.5, 0.4, 0.2, 0, 0], a2);
      e4.crx += L(t2, i2, [0, 0.45, -0.1, 0.2, 0.15, 0.45, 0], a2), e4.srx += L(t2, i2, [0, 0.15, -0.05, 0.1, 0.05, 0.15, 0], a2), e4.hdx += L(t2, i2, [0, -0.25, 0.05, -0.1, -0.1, -0.2, 0], a2), e4.armX[1] = L(t2, i2, [e4.armX[1], -0.3, 2.4, 2.9, 1, 0.7, e4.armX[1]], a2), e4.armZ[1] = L(t2, i2, [e4.armZ[1], 0.3, 0.3, 0.4, 0, 0.1, e4.armZ[1]], a2), e4.elbow[1] = L(t2, i2, [e4.elbow[1], 0.4, 1.2, 1.8, 0.2, 0.4, e4.elbow[1]], a2), e4.handX[1] = L(t2, i2, [e4.handX[1], 0.2, 0.7, 0.9, -0.6, -0.4, e4.handX[1]], a2), e4.armX[0] = L(t2, i2, [e4.armX[0], -0.4, 1.6, 1.2, 0.3, 0.4, e4.armX[0]], a2), e4.armZ[0] = L(t2, i2, [e4.armZ[0], 0.3, 0.6, 0.7, 0.5, 0.4, e4.armZ[0]], a2), r2.weapon === `twoHand` && (e4.lhIK = 1);
    }
    channel(e4, t2) {
      let n2 = this.style;
      this.stance(e4, 1.3, 0.06, n2.crouch * 1.2), this.posture(e4, 0.4);
      let r2 = Math.sin(t2 * 1.6), i2 = Math.sin(t2 * 0.8 + 0.6);
      e4.hx += r2 * 0.025, e4.hrz += r2 * 0.04, e4.crz -= r2 * 0.07, e4.cry += i2 * 0.12, e4.crx -= 0.12, e4.hdx -= 0.3 + i2 * 0.05, e4.hdz += r2 * 0.08, e4.jaw = 0.3 + Math.sin(t2 * 3.1) * 0.15;
      for (let n3 = 0; n3 < 2; n3 += 1) {
        let r3 = n3 === 0 ? 0 : 1.7;
        e4.armX[n3] = 2.1 + Math.sin(t2 * 1.9 + r3) * 0.15, e4.armZ[n3] = 0.55 + Math.sin(t2 * 1.3 + r3) * 0.1, e4.elbow[n3] = 0.45 + Math.sin(t2 * 2.3 + r3) * 0.15, e4.handY[n3] = 0.8, e4.handZ[n3] = -0.4, e4.fing[n3] = -0.2 + Math.sin(t2 * 4 + r3) * 0.2;
      }
      (n2.weapon === `staff` || n2.weapon === `twoHand`) && (e4.armX[1] = 2.6 + Math.sin(t2 * 1.6) * 0.12, e4.armZ[1] = 0.3, e4.elbow[1] = 0.35, e4.handX[1] = 0.2, e4.fing[1] = 1.35);
    }
    taunt(e4, t2, n2) {
      let r2 = this.style, i2 = $p.taunt ?? 0.45;
      this.stance(e4, 1.2, 0.06, r2.crouch), this.posture(e4), this.breathe(e4, n2), this.armsRest(e4, false, n2);
      let a2 = [0, i2 * 0.6, i2, 0.8, 1], o2 = [rx, rx, rx, rx];
      switch (r2.tauntStyle) {
        case `greet`: {
          let r3 = L(t2, [0, 0.2, 0.8, 1], [0, 1, 1, 0], [rx, null, rx]);
          e4.armX[1] = R(e4.armX[1], 0.6, r3), e4.armZ[1] = R(e4.armZ[1], 0.9, r3), e4.armY[1] = R(e4.armY[1], 0.6, r3), e4.elbow[1] = R(e4.elbow[1], 1.9, r3), e4.foreY[1] = R(0, 0.4, r3) + Math.sin(n2 * 9) * 0.3 * g_(0.25, 0.75, t2), e4.handY[1] = R(e4.handY[1], 1.2, r3), e4.fing[1] = R(e4.fing[1], -0.1, r3), e4.hdx += 0.12 * g_(0.2, 0.55, t2), e4.hdy += 0.1 * r3, e4.crx -= 0.04 * r3;
          break;
        }
        case `jump`: {
          let n3 = Math.abs(Math.sin(t2 * Math.PI * 3)) * (1 - z(0.85, 1, t2));
          e4.hy += n3 * 0.12 - 0.05, e4.fy[0] += n3 * 0.08, e4.fy[1] += n3 * 0.08, e4.armX[1] = 2.5 + Math.sin(t2 * Math.PI * 6) * 0.3, e4.armZ[1] = 0.6, e4.elbow[1] = 0.8 + Math.sin(t2 * Math.PI * 6) * 0.4, e4.armX[0] = 1.6, e4.armZ[0] = 0.9, e4.elbow[0] = 0.9, e4.jaw = 0.6, e4.hdx -= 0.3, e4.crx -= 0.15;
          break;
        }
        case `bowRaise`:
          e4.armX[0] = L(t2, a2, [e4.armX[0], 1.8, 2.9, 2.8, e4.armX[0]], o2), e4.armZ[0] = L(t2, a2, [e4.armZ[0], 0.4, 0.3, 0.3, e4.armZ[0]], o2), e4.elbow[0] = L(t2, a2, [e4.elbow[0], 0.5, 0.15, 0.2, e4.elbow[0]], o2), e4.armX[1] = L(t2, a2, [e4.armX[1], 0.3, 0.2, 0.2, e4.armX[1]], o2), e4.armZ[1] = L(t2, a2, [e4.armZ[1], 0.6, 1, 0.95, e4.armZ[1]], o2), e4.elbow[1] = L(t2, a2, [e4.elbow[1], 0.4, 0.2, 0.25, e4.elbow[1]], o2), e4.fing[1] = L(t2, a2, [0.6, 0, -0.3, -0.3, 0.6], o2), e4.hdx += L(t2, a2, [0, -0.2, -0.5, -0.45, 0], o2), e4.crx += L(t2, a2, [0, -0.1, -0.28, -0.25, 0], o2), e4.jaw = L(t2, a2, [0, 0.2, 0.6, 0.5, 0], o2);
          break;
        case `roar`:
          e4.hy += L(t2, a2, [0, -0.1, -0.06, -0.06, 0], o2), e4.crx += L(t2, a2, [0, 0.3, -0.35, -0.3, 0], o2), e4.hdx += L(t2, a2, [0, 0.3, -0.5, -0.45, 0], o2), e4.jaw = L(t2, a2, [0, 0.2, 1, 0.9, 0], o2);
          for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = L(t2, a2, [e4.armX[n3], 0.3, 0.9, 0.85, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], 0.4, 1.25, 1.2, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 1.5, 1.9, 1.85, e4.elbow[n3]], o2), e4.fing[n3] = L(t2, a2, [e4.fing[n3], 1.3, 1.35, 1.35, e4.fing[n3]], o2);
          break;
        case `cackle`: {
          let r3 = Math.sin(n2 * 22) * g_(0.2, 0.85, t2);
          e4.crx += L(t2, a2, [0, -0.25, -0.3, -0.2, 0], o2) + r3 * 0.04, e4.hdx += L(t2, a2, [0, -0.35, -0.45, -0.3, 0], o2) + r3 * 0.08, e4.jaw = L(t2, a2, [0, 0.6, 0.7, 0.5, 0], o2) + Math.abs(r3) * 0.3;
          for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = L(t2, a2, [e4.armX[n3], 1.2, 1.6, 1.3, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], 0.6, 0.9, 0.8, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 1.5, 1, 1.2, e4.elbow[n3]], o2), e4.fing[n3] = -0.2;
          break;
        }
        default:
          e4.armX[1] = L(t2, a2, [e4.armX[1], 2, 2.9, 2.85, e4.armX[1]], o2), e4.armZ[1] = L(t2, a2, [e4.armZ[1], 0.3, 0.2, 0.2, e4.armZ[1]], o2), e4.elbow[1] = L(t2, a2, [e4.elbow[1], 0.9, 0.25, 0.3, e4.elbow[1]], o2), e4.handX[1] = L(t2, a2, [e4.handX[1], 0.5, 0.9, 0.85, e4.handX[1]], o2), e4.hdx += L(t2, a2, [0, -0.2, -0.35, -0.3, 0], o2), e4.crx += L(t2, a2, [0, -0.1, -0.2, -0.18, 0], o2), e4.jaw = L(t2, a2, [0, 0.3, 0.7, 0.6, 0], o2), e4.lhIK = 0;
      }
    }
    special(e4, t2, n2) {
      let r2 = this.style, i2 = $p.special ?? 0.5;
      switch (r2.specialStyle) {
        case `volley`:
          this.bowShot(e4, t2, i2, true);
          return;
        case `stomp`: {
          this.stance(e4, 1.3, 0.04, r2.crouch), this.posture(e4), this.armsRest(e4, false, n2);
          let a2 = [0, i2 * 0.7, i2, i2 + 0.2, 1], o2 = [rx, nx, tx, rx], s2 = L(t2, [0, 0.1, i2, i2 + 0.02, 1], [1, 0, 0, 1, 1]);
          e4.ik[1] = s2, e4.thX[1] = L(t2, a2, [0, 1.5, 0.05, 0.05, 0], o2), e4.thZ[1] = L(t2, a2, [0, 0.3, 0.1, 0.1, 0], o2), e4.knee[1] = L(t2, a2, [0, 1.6, 0.15, 0.15, 0], o2), e4.hy += L(t2, a2, [0, 0, -0.15, -0.12, 0], o2), e4.hrz += L(t2, a2, [0, 0.12, -0.05, 0, 0], o2), e4.crx += L(t2, a2, [0, -0.2, 0.4, 0.35, 0], o2);
          for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = L(t2, a2, [e4.armX[n3], 2.5, 0.6, 0.6, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], 0.6, 0.3, 0.3, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 1.6, 0.4, 0.5, e4.elbow[n3]], o2), e4.fing[n3] = 1.35;
          return;
        }
        case `roar`:
          this.castUp(e4, t2, n2);
          return;
        case `lunge`: {
          this.lungeStance(e4, t2, i2, 2.2), this.posture(e4);
          let n3 = [0, i2 * 0.6, i2, i2 + 0.2, 1], r3 = [rx, nx, tx, rx];
          for (let i3 = 0; i3 < 2; i3 += 1) e4.armX[i3] = L(t2, n3, [0.3, 0.9, 1.6, 1.4, 0.3], r3), e4.armZ[i3] = L(t2, n3, [0.2, 0.6, 0.15, 0.2, 0.2], r3), e4.elbow[i3] = L(t2, n3, [0.4, 1.4, 0.15, 0.3, 0.4], r3), e4.fing[i3] = L(t2, n3, [0.5, 0, 1.2, 1.2, 0.5], r3);
          e4.crx += L(t2, n3, [0, -0.1, 0.5, 0.45, 0], r3), e4.jaw = L(t2, n3, [0, 0.4, 0.9, 0.6, 0], r3);
          return;
        }
        default: {
          this.lungeStance(e4, t2, i2, 1.2), this.posture(e4), this.armsRest(e4, false, n2);
          let a2 = [0, i2 * 0.6, i2, i2 + 0.2, 1], o2 = [rx, nx, tx, rx];
          for (let n3 = 0; n3 < 2; n3 += 1) e4.armX[n3] = L(t2, a2, [e4.armX[n3], 2.9, 0.9, 0.5, e4.armX[n3]], o2), e4.armZ[n3] = L(t2, a2, [e4.armZ[n3], 0.3, 0, 0.1, e4.armZ[n3]], o2), e4.elbow[n3] = L(t2, a2, [e4.elbow[n3], 1.6, 0.15, 0.3, e4.elbow[n3]], o2);
          e4.crx += L(t2, a2, [0, -0.35, 0.5, 0.55, 0], o2), e4.hy += L(t2, a2, [0, 0.03, -0.12, -0.12, 0], o2), e4.jaw = L(t2, a2, [0, 0.4, 0.8, 0.5, 0], o2), r2.weapon === `twoHand` && (e4.lhIK = 1);
        }
      }
    }
    death(e4, t2, n2) {
      let r2 = this.style, i2 = this.deathVariant;
      this.stance(e4, 1.1, 0.04, r2.crouch), this.posture(e4, 1 - z(0.3, 0.7, t2)), this.armsRest(e4, false, n2);
      let a2 = this.H, o2 = this.hipsBind.y, s2 = 1 - z(0.08, 0.3, t2);
      e4.ik[0] = s2, e4.ik[1] = s2, e4.lhIK = 0;
      let c2 = [0, 0.14, 0.42, 0.78, 0.9, 1], l2 = [tx, rx, nx, (e5) => h_(e5, 2.2), rx];
      if (i2 === 2) {
        let n3 = [0, 0.12, 0.5, 0.82, 1], r3 = [tx, nx, nx, rx];
        e4.hy = L(t2, n3, [0, 0.02, -o2 * 0.55, -o2 * 0.86, -o2 * 0.84], r3), e4.hrx = L(t2, n3, [0, -0.2, 0.3, 0.9, 1], r3), e4.hz = L(t2, n3, [0, -0.02, 0.05, 0.12, 0.12], r3), e4.srx += L(t2, n3, [0, -0.1, 0.4, 0.6, 0.65], r3), e4.crx += L(t2, n3, [0, -0.25, 0.3, 0.5, 0.55], r3), e4.hdx += L(t2, n3, [0, -0.4, 0.5, 0.6, 0.7], r3), e4.hdz += L(t2, n3, [0, 0.1, 0.3, 0.5, 0.55], r3);
        for (let i3 = 0; i3 < 2; i3 += 1) e4.thX[i3] = L(t2, n3, [0, 0.1, 1.2, 1.5, 1.55], r3), e4.thZ[i3] = L(t2, n3, [0, 0, 0.3, 0.5, 0.55], r3), e4.knee[i3] = L(t2, n3, [0, 0.2, 2.2, 2.5, 2.5], r3), e4.ftX[i3] = L(t2, n3, [0, 0, 0.5, 0.6, 0.6], r3), e4.armX[i3] = L(t2, n3, [e4.armX[i3], 0.6, 0.2, -0.1, -0.15], r3), e4.armZ[i3] = L(t2, n3, [e4.armZ[i3], 0.6, 0.4, 0.3, 0.3], r3), e4.elbow[i3] = L(t2, n3, [e4.elbow[i3], 0.4, 0.6, 0.3, 0.3], r3);
        return;
      }
      let u2 = i2 === 0, d2 = u2 ? -1 : 1, f2 = -o2 + a2 * 0.075;
      e4.hy = L(t2, c2, [-r2.crouch, -r2.crouch + 0.01, -o2 * 0.42, f2, f2 + 0.01, f2], l2), e4.hz = L(t2, c2, [0, -0.05 * d2, 0.05 * d2, 0.32 * d2, 0.33 * d2, 0.33 * d2], l2), e4.hrx = L(t2, c2, [0, -0.15, u2 ? -0.35 : 0.45, d2 * 1.42, d2 * 1.38, d2 * 1.4], l2), e4.hry = L(t2, c2, [0, 0.1, 0.25, 0.3, 0.3, 0.3], l2) * (u2 ? 1 : -1), e4.hrz = L(t2, c2, [0, 0.05, 0.1, u2 ? 0.15 : -0.1, 0.12, 0.12], l2), e4.srx += L(t2, c2, [0, -0.15, u2 ? -0.1 : 0.25, u2 ? -0.05 : 0.1, 0, 0], l2), e4.crx += L(t2, c2, [0, -0.35, u2 ? -0.2 : 0.3, u2 ? -0.15 : 0.1, -0.05, -0.08], l2), e4.cry += L(t2, c2, [0, 0.2, 0.3, 0.15, 0.1, 0.1], l2), e4.hdx += L(t2, c2, [0, -0.5, u2 ? -0.2 : 0.4, u2 ? -0.3 : -0.6, -0.25, -0.25], l2), e4.hdy += L(t2, c2, [0, 0.2, 0.3, 0.75, 0.8, 0.8], l2) * (this.seedF < 0.5 ? 1 : -1), e4.jaw = L(t2, c2, [0, 0.6, 0.4, 0.3, 0.35, 0.35], l2);
      for (let n3 = 0; n3 < 2; n3 += 1) {
        let r3 = n3 === 0 ? 1.7 : 1.4;
        e4.thX[n3] = L(t2, c2, [0, 0.1, u2 ? 0.9 : 1.2, u2 ? 0.35 + n3 * 0.3 : -0.1 - n3 * 0.15, 0.3 * n3, u2 ? 0.25 + n3 * 0.25 : -0.05], l2), e4.thZ[n3] = L(t2, c2, [0, 0.05, 0.12, 0.25 + n3 * 0.08, 0.25, 0.25 + n3 * 0.06], l2), e4.knee[n3] = L(t2, c2, [0, 0.3, r3, u2 ? 0.5 + n3 * 0.6 : 0.4 + n3 * 0.4, 0.4, u2 ? 0.45 + n3 * 0.6 : 0.35 + n3 * 0.4], l2), e4.ftX[n3] = L(t2, c2, [0, 0.1, 0.4, 0.6, 0.6, 0.6], l2);
        let i3 = n3 === 0 ? 1 : 0.8;
        e4.armX[n3] = L(t2, c2, [e4.armX[n3], 0.75 * i3, u2 ? 1.2 : 0.4, u2 ? n3 === 0 ? 2.2 : 0.4 : 2.6, u2 ? n3 === 0 ? 2.3 : 0.35 : 2.7, u2 ? n3 === 0 ? 2.3 : 0.35 : 2.7], l2), e4.armZ[n3] = L(t2, c2, [e4.armZ[n3], 0.3, 0.5, u2 ? 0.9 : 0.5, 0.95, u2 ? 0.95 : 0.55], l2), e4.armY[n3] = L(t2, c2, [e4.armY[n3], 0.2, 0.3, 0.4, 0.4, 0.4], l2), e4.elbow[n3] = L(t2, c2, [e4.elbow[n3], 1, 0.9, u2 ? 0.6 + n3 * 0.6 : 0.9, 0.7, u2 ? 0.65 + n3 * 0.6 : 0.9], l2), e4.fing[n3] = L(t2, c2, [e4.fing[n3], -0.2, 0.5, 0.6, 0.6, 0.6], l2);
      }
    }
    resurrect(e4, t2, n2) {
      let r2 = 1 - m_(t2 ** 0.8);
      this.death(e4, r2, n2), t2 > 0.85 && (this.P2.reset(), this.idle(this.P2, n2, false), e4.blend(this.P2, d_((t2 - 0.85) / 0.15)));
    }
    apply(e4, t2) {
      let n2 = this.bones;
      n2.hips.position.set(this.hipsBind.x + e4.hx, this.hipsBind.y + e4.hy, this.hipsBind.z + e4.hz), n2.hips.quaternion.setFromEuler(Bb.set(e4.hrx, e4.hry, e4.hrz, `YXZ`)), n2.spine.quaternion.setFromEuler(Bb.set(e4.srx, e4.sry, e4.srz, `YXZ`)), n2.chest.quaternion.setFromEuler(Bb.set(e4.crx, e4.cry - e4.hry * 0, e4.crz, `YXZ`)), n2.neck.quaternion.setFromEuler(Bb.set(e4.nrx, e4.nry, e4.nrz, `YXZ`)), n2.head.quaternion.setFromEuler(Bb.set(e4.hdx, e4.hdy, e4.hdz, `YXZ`)), n2.jaw && n2.jaw.quaternion.setFromEuler(Bb.set(e4.jaw * 0.45, 0, 0, `XYZ`));
      for (let t3 = 0; t3 < 2; t3 += 1) {
        let r3 = zb[t3];
        n2.shoulder[t3].quaternion.setFromEuler(Bb.set(0, -r3 * e4.clavY[t3], r3 * e4.clavZ[t3], `XYZ`)), n2.upper[t3].quaternion.setFromEuler(Bb.set(-e4.armX[t3], r3 * e4.armY[t3], r3 * e4.armZ[t3], `XZY`)), n2.fore[t3].quaternion.setFromEuler(Bb.set(-e4.elbow[t3], r3 * e4.foreY[t3], 0, `XYZ`)), n2.hand[t3].quaternion.setFromEuler(Bb.set(-e4.handX[t3], r3 * e4.handY[t3], -r3 * e4.handZ[t3], `XZY`));
        let i2 = n2.fingers[t3];
        i2 && i2.quaternion.setFromEuler(Bb.set(0, 0, -r3 * ex(e4.fing[t3]), `XYZ`));
      }
      let r2 = n2.hips.quaternion;
      Kb.copy(r2).invert();
      for (let t3 = 0; t3 < 2; t3 += 1) {
        let i2 = zb[t3], a2 = e4.ik[t3];
        if (Vb.setFromEuler(Bb.set(-e4.thX[t3], i2 * e4.thY[t3], i2 * e4.thZ[t3], `XZY`)), Hb.setFromEuler(Bb.set(e4.knee[t3], 0, 0, `XYZ`)), Ub.setFromEuler(Bb.set(e4.ftX[t3], 0, 0, `XYZ`)), a2 > 1e-3) {
          qb.copy(this.hipOff[t3]).applyQuaternion(r2).add(n2.hips.position), Yb.set(e4.fx[t3], e4.fy[t3], e4.fz[t3]), Jb.set(Math.sin(e4.fyaw[t3]) + i2 * e4.kneeOut[t3], 0, Math.cos(e4.fyaw[t3])), Zy(qb, Yb, this.L1, this.L2, Jb, this.legDirU[t3], this.legDirL[t3], Xb, Wb, Gb);
          let o3 = this.footRig(e4, t3), s2 = this._thL.multiplyQuaternions(Kb, Wb), c2 = this._shL.copy(Wb).invert().multiply(Gb), l2 = this._ftL.copy(Gb).invert().multiply(o3);
          a2 >= 0.999 ? (n2.thigh[t3].quaternion.copy(s2), n2.shin[t3].quaternion.copy(c2), n2.foot[t3].quaternion.copy(l2)) : (n2.thigh[t3].quaternion.copy(Vb).slerp(s2, a2), n2.shin[t3].quaternion.copy(Hb).slerp(c2, a2), n2.foot[t3].quaternion.copy(Ub).slerp(l2, a2));
        } else n2.thigh[t3].quaternion.copy(Vb), n2.shin[t3].quaternion.copy(Hb), n2.foot[t3].quaternion.copy(Ub);
        let o2 = n2.toe[t3];
        o2 && o2.quaternion.setFromEuler(Bb.set(-e4.toe[t3] * a2, 0, 0, `XYZ`));
      }
      e4.lhIK > 1e-3 && this.leftHandGrip(e4.lhIK);
    }
    _footQ = new ir();
    _thL = new ir();
    _shL = new ir();
    _ftL = new ir();
    footRig(e4, t2) {
      return this._footQ.setFromEuler(Bb.set(e4.fpitch[t2], e4.fyaw[t2], e4.froll[t2] * zb[t2], `YXZ`));
    }
    _gp = new N();
    _w = new N();
    _dd = new N();
    _qHL = new ir();
    _qU = new ir();
    _qL = new ir();
    _qp = new ir();
    _wrist = new N();
    _armPole = new N();
    leftHandGrip(e4) {
      let t2 = this.rig.space;
      t2.updateChain(this.idxHandR);
      let n2 = t2.pos[this.idxHandR], r2 = t2.quat[this.idxHandR];
      this._gp.set(0, -this.gripSep, 0).applyQuaternion($b).add(this.rightSocket).applyQuaternion(r2).add(n2), this._w.set(0, 0, 1).applyQuaternion(r2), t2.updateChain(this.idxUpperL);
      let i2 = t2.pos[this.idxUpperL], a2 = t2.quat[this.rig.template.def.parentIndex[this.idxUpperL]];
      this._dd.subVectors(this._gp, i2), this._dd.addScaledVector(this._w, -this._dd.dot(this._w)).normalize(), Xy(Xb, Qb, this._w, this._dd, this._qHL), this._wrist.copy(this.leftSocket).applyQuaternion(this._qHL), this._wrist.subVectors(this._gp, this._wrist), this._armPole.set(0.5, -0.6, -0.55), Zy(i2, this._wrist, this.aL1, this.aL2, this._armPole, this.armDirU[0], this.armDirL[0], Zb, this._qU, this._qL);
      let o2 = this.bones;
      this._qp.copy(a2).invert().multiply(this._qU), o2.upper[0].quaternion.slerp(this._qp, e4), this._qp.copy(this._qU).invert().multiply(this._qL), o2.fore[0].quaternion.slerp(this._qp, e4), this._qp.copy(this._qL).invert().multiply(this._qHL), o2.hand[0].quaternion.slerp(this._qp, e4);
      let s2 = o2.fingers[0];
      s2 && s2.quaternion.setFromEuler(Bb.set(0, 0, -ex(1.35), `XYZ`));
    }
  };
})), ox, sx, cx = t((() => {
  Ed(), ox = new N(), sx = class {
    inner;
    rig;
    drives;
    chains;
    thighs;
    constructor(e4, t2, n2) {
      this.inner = e4, this.rig = t2, this.drives = n2, this.chains = n2.map((e5) => t2.spring(e5.id)), this.thighs = [t2.bone(`thigh_L`), t2.bone(`thigh_R`)];
    }
    evaluate(e4) {
      this.inner.evaluate(e4);
      let t2 = [0, 0], n2 = [0, 0];
      for (let e5 = 0; e5 < 2; e5 += 1) ox.set(0, -1, 0).applyQuaternion(this.thighs[e5].quaternion), t2[e5] = Math.atan2(ox.z, -ox.y), n2[e5] = Math.atan2(ox.x * (e5 === 0 ? 1 : -1), -ox.y);
      let r2 = e4.state === `death` || e4.state === `dead`;
      this.drives.forEach((e5, i2) => {
        let a2 = this.chains[i2];
        if (!a2) return;
        let o2 = (e5.k ?? 0.95) * (r2 ? 0.4 : 1), s2 = e5.side === -1 ? t2[0] > t2[1] ? 0 : 1 : e5.side, c2 = e5.side === -1 ? Math.max(t2[0], t2[1]) : t2[s2];
        e5.mode === `front` ? a2.driveX = -Math.max(0, c2) * o2 : e5.mode === `back` ? a2.driveX = Math.max(0, -(e5.side === -1 ? Math.min(t2[0], t2[1]) : c2)) * o2 : a2.driveZ = (s2 === 0 ? 1 : -1) * Math.max(0, n2[s2]) * o2;
      });
    }
    setEquipment(e4) {
      this.inner.setEquipment?.(e4);
    }
    onPlay(e4) {
      this.inner.onPlay?.(e4);
    }
  };
}));
function lx(e4) {
  let t2 = e4.hunch ?? 0, n2 = e4.armOut;
  return { P: e4, hips: [0, e4.hip + 0.02 * e4.height, 0], spine: [0, e4.spine, t2 * 0.25], chest: [0, e4.chest, t2 * 0.7], neck: [0, e4.neck, t2], head: [0, e4.head, t2 * 1.1], headTop: [0, e4.height, t2 * 1.1], shoulderL: [e4.clavX, e4.shoulderY - 0.015 * e4.height, t2 * 0.85], upperArmL: [e4.shoulderX, e4.shoulderY, t2 * 0.85], elbowL: [e4.shoulderX + n2 * 0.5, e4.elbow, t2 * 0.85 - 0.01], wristL: [e4.shoulderX + n2, e4.wrist, t2 * 0.85], fingersL: [e4.shoulderX + n2 * 1.15, e4.wrist - e4.handLen * 0.42, t2 * 0.85], hipL: [e4.hipWidth, e4.hip, 0], kneeL: [e4.hipWidth, e4.knee, e4.kneeZ ?? 0], ankleL: [e4.hipWidth, e4.ankle, 0], toeL: [e4.hipWidth, e4.ankle * 0.35, e4.footLen * 0.62] };
}
function ux(e4, t2 = []) {
  let n2 = e4.P, r2 = [{ name: `hips`, parent: null, pos: e4.hips }, { name: `spine`, parent: `hips`, pos: e4.spine }, { name: `chest`, parent: `spine`, pos: e4.chest }, { name: `neck`, parent: `chest`, pos: e4.neck }, { name: `head`, parent: `neck`, pos: e4.head }];
  n2.jaw && r2.push({ name: `jaw`, parent: `head`, pos: [0, e4.head[1] + 0.02 * n2.height, e4.head[2] + 0.03 * n2.height] });
  for (let t3 of [`L`, `R`]) {
    let i2 = t3 === `L` ? (e5) => e5 : px;
    r2.push({ name: `shoulder_${t3}`, parent: `chest`, pos: i2(e4.shoulderL) }), r2.push({ name: `upperArm_${t3}`, parent: `shoulder_${t3}`, pos: i2(e4.upperArmL) }), r2.push({ name: `foreArm_${t3}`, parent: `upperArm_${t3}`, pos: i2(e4.elbowL) }), r2.push({ name: `hand_${t3}`, parent: `foreArm_${t3}`, pos: i2(e4.wristL) }), n2.fingers && r2.push({ name: `fingers_${t3}`, parent: `hand_${t3}`, pos: i2(e4.fingersL) });
  }
  for (let t3 of [`L`, `R`]) {
    let i2 = t3 === `L` ? (e5) => e5 : px;
    r2.push({ name: `thigh_${t3}`, parent: `hips`, pos: i2(e4.hipL) }), r2.push({ name: `shin_${t3}`, parent: `thigh_${t3}`, pos: i2(e4.kneeL) }), r2.push({ name: `foot_${t3}`, parent: `shin_${t3}`, pos: i2(e4.ankleL) }), n2.toes && r2.push({ name: `toe_${t3}`, parent: `foot_${t3}`, pos: i2(e4.toeL) });
  }
  return r2.concat(t2);
}
function dx(e4, t2 = {}) {
  let n2 = e4 / 1.85;
  return { height: e4, hip: 0.94 * n2, hipWidth: 0.095 * n2, knee: 0.515 * n2, ankle: 0.085 * n2, spine: 1.08 * n2, chest: 1.3 * n2, neck: 1.53 * n2, head: 1.635 * n2, shoulderY: 1.49 * n2, shoulderX: 0.185 * n2, clavX: 0.035 * n2, elbow: 1.17 * n2, wrist: 0.9 * n2, handLen: 0.18 * n2, armOut: 0.05 * n2, footLen: 0.26 * n2, toes: true, fingers: true, ...t2 };
}
var fx, px, mx = t((() => {
  Ed(), fx = class {
    bones;
    index = /* @__PURE__ */ new Map();
    parentIndex = [];
    local = [];
    constructor(e4) {
      this.bones = e4, e4.forEach((e5, t2) => {
        if (this.index.has(e5.name)) throw Error(`duplicate bone ${e5.name}`);
        this.index.set(e5.name, t2);
      }), e4.forEach((t2) => {
        let n2 = t2.parent === null ? -1 : this.index.get(t2.parent);
        if (n2 === void 0) throw Error(`bone ${t2.name}: unknown parent ${t2.parent}`);
        if (n2 >= this.index.get(t2.name)) throw Error(`bone ${t2.name}: parent must precede child`);
        this.parentIndex.push(n2);
        let r2 = n2 >= 0 ? e4[n2].pos : [0, 0, 0];
        this.local.push(new N(t2.pos[0] - r2[0], t2.pos[1] - r2[1], t2.pos[2] - r2[2]));
      });
    }
    has(e4) {
      return this.index.has(e4);
    }
    pos(e4) {
      let t2 = this.index.get(e4);
      if (t2 === void 0) throw Error(`no bone ${e4}`);
      return this.bones[t2].pos;
    }
    instantiate() {
      let e4 = [], t2 = /* @__PURE__ */ new Map();
      return this.bones.forEach((n2, r2) => {
        let i2 = new Ma();
        i2.name = n2.name, i2.position.copy(this.local[r2]);
        let a2 = this.parentIndex[r2];
        a2 >= 0 && e4[a2].add(i2), e4.push(i2), t2.set(n2.name, i2);
      }), { bones: e4, byName: t2 };
    }
  }, px = (e4) => [-e4[0], e4[1], e4[2]];
}));
function hx(e4) {
  let t2 = e4.mb.build({ skinned: true, boneIndex: e4.def.index, grime: { height: 0.4 * (e4.height / 1.85), amount: 0.55 }, ao: { res: 72, dist: 0.26 * Math.max(0.6, e4.height / 1.85), strength: 1 }, seed: e4.key.length, ...e4.build });
  return { key: e4.key, def: e4.def, geometry: t2.geometry, triangles: t2.triangles, height: e4.height, radius: e4.radius, sockets: e4.sockets, springs: e4.springs ?? [], contacts: e4.contacts ?? [], makeAnimator: e4.animator, equip: e4.equip, defaultEquipment: e4.defaultEquipment, deadEmissive: e4.deadEmissive, breakdown: e4.mb.breakdown() };
}
function gx(e4, t2) {
  let n2 = t2 === 0 ? 1 : -1, r2 = e4.P.height / 1.85, i2 = e4.wristL;
  return [n2 * (i2[0] - 0.021 * r2), i2[1] - 0.078 * r2, i2[2] + 0.012 * r2];
}
function _x(e4, t2 = {}) {
  let n2 = e4.P.height / 1.85;
  return { rightHand: { bone: `hand_R`, pos: gx(e4, 1) }, leftHand: { bone: `hand_L`, pos: gx(e4, 0) }, head: { bone: `head`, pos: [e4.head[0], e4.head[1] + 0.12 * n2, e4.head[2]] }, chest: { bone: `chest`, pos: [0, e4.chest[1] + 0.06 * n2, e4.chest[2] + 0.1 * n2] }, castPoint: { bone: `chest`, pos: [0, e4.chest[1] + 0.02 * n2, e4.chest[2] + (t2.castZ ?? 0.5) * n2] }, weaponTip: { bone: `hand_R`, pos: [gx(e4, 1)[0], gx(e4, 1)[1], gx(e4, 1)[2] + 0.35 * n2] }, mouth: { bone: `head`, pos: [e4.head[0], e4.head[1] + 0.07 * n2, e4.head[2] + (t2.mouthZ ?? 0.1) * n2] }, back: { bone: `chest`, pos: [0, e4.chest[1] + 0.1 * n2, e4.chest[2] - 0.13 * n2] } };
}
function vx(e4 = 1) {
  return [[`hips`, 0.08 * e4], [`spine`, 0.08 * e4], [`chest`, 0.1 * e4], [`head`, 0.1 * e4], [`hand_L`, 0.035 * e4], [`hand_R`, 0.035 * e4], [`foreArm_L`, 0.035 * e4], [`foreArm_R`, 0.035 * e4], [`shin_L`, 0.05 * e4], [`shin_R`, 0.05 * e4], [`foot_L`, 0.04 * e4], [`foot_R`, 0.04 * e4]];
}
function yx(e4, t2, n2 = {}) {
  let r2 = new P(t2), i2 = new P(n2.lip ?? `#9a4a48`), a2 = new P(n2.shadow ?? `#3a2420`), o2 = new P(`#c45a4c`), s2 = e4.s;
  return (t3, c2) => {
    c2.copy(r2);
    let l2 = t3.p;
    for (let t4 of e4.eyes) {
      let e5 = (l2.x - t4[0]) / (0.024 * s2), r3 = (l2.y - t4[1] - 3e-3 * s2) / (0.016 * s2), i3 = l2.z - t4[2], u3 = Math.sqrt(e5 * e5 + r3 * r3);
      i3 > -0.02 * s2 && c2.lerp(a2, l_(1 - u3, 0, 1) * (n2.shadowK ?? 0.55));
      let d3 = (l2.x - t4[0] * 1.15) / (0.026 * s2), f2 = (l2.y - t4[1] + 0.03 * s2) / (0.02 * s2);
      c2.lerp(o2, l_(1 - Math.sqrt(d3 * d3 + f2 * f2), 0, 1) * (n2.blush ?? 0.12));
    }
    let u2 = (l2.x - e4.mouth[0]) / (0.022 * s2), d2 = (l2.y - e4.mouth[1]) / (95e-4 * s2);
    l2.z > e4.mouth[2] - 0.02 * s2 && c2.lerp(i2, z(1.05, 0.55, Math.sqrt(u2 * u2 + d2 * d2)) * (n2.lipK ?? 0.75)), n2.paint && n2.paint(l2, c2);
  };
}
function bx(e4, t2, n2, r2, i2, a2 = 1, o2, s2 = {}) {
  let c2 = new wr().compose(new N(r2[0], r2[1], r2[2]), i2, new N(a2, a2, a2));
  for (let r3 of t2) {
    let t3 = r3.geo.clone().applyMatrix(c2);
    e4.add(t3, { ...r3.spec, ...s2, bone: n2, skin: void 0 });
  }
  if (!o2) return r2;
  let l2 = new N(o2[0], o2[1], o2[2]).applyMatrix4(c2);
  return [l2.x, l2.y, l2.z];
}
function xx(e4 = 0, t2 = 0) {
  return new ir().setFromEuler(new Pr(-e4, t2, 0, `XZY`)).multiply(Sx);
}
var Sx, Cx, wx = t((() => {
  Ed(), U_(), __(), Sx = new ir().setFromRotationMatrix(new wr().makeBasis(new N(0, -1, 0), new N(0, 0, 1), new N(-1, 0, 0))), Cx = new ir().setFromAxisAngle(new N(0, 1, 0), Math.PI / 2);
}));
function Tx(e4) {
  let t2 = e4.scale ?? 1, n2 = e4.width ?? 1, r2 = e4.depth ?? 1, i2 = e4.height ?? 1, a2 = e4.jaw ?? 1, o2 = e4.slope ?? 0, s2 = e4.muzzle ?? 0, c2 = [[0, 0.012, 6e-3, 6e-3, 0.052], [8e-3, 0.026 * a2, 0.018, 0.018, 0.048], [0.022, 0.042 * a2, 0.035, 0.035, 0.035], [0.04, 0.054 * a2, 0.054, 0.055, 0.02], [0.06, 0.06, 0.069, 0.07, 8e-3], [0.08, 0.065, 0.08, 0.082, 0], [0.1, 0.0685, 0.084, 0.093, -3e-3], [0.118, 0.071, 0.085, 0.099, -5e-3], [0.14, 0.0725, 0.084, 0.103, -6e-3 - o2 * 0.01], [0.165, 0.0715, 0.079, 0.104, -8e-3 - o2 * 0.03], [0.19, 0.0655, 0.067, 0.099, -0.01 - o2 * 0.045], [0.21, 0.054, 0.051, 0.085, -0.012 - o2 * 0.05], [0.226, 0.034, 0.03, 0.057, -0.012 - o2 * 0.05], [0.235, 0, 0, 0, -0.012 - o2 * 0.05]].map(([e5, a3, o3, c3, l3]) => ({ y: e5 * t2 * i2, rx: a3 * t2 * n2, rzf: (o3 + (e5 < 0.1 ? s2 * (1 - e5 / 0.1) * 0.05 : 0)) * t2 * r2, rzb: c3 * t2 * r2, cz: l3 * t2 * r2 + (e5 < 0.1 ? s2 * 0.015 * t2 : 0), p: 2.3 })), l2 = Q_(c2, e4.segs ?? 20, Math.round(2 * (e4.ringsMul ?? 1))), u2 = t2, d2 = (e5, t3, a3) => [e5 * u2 * n2, t3 * u2 * i2, a3 * u2 * r2], f2 = (e5) => e5 * u2, p2 = e4.eyeY ?? 0.118, m2 = e4.eyeSpread ?? 1;
  l2.computeNormals();
  for (let t3 of [1, -1]) l2.bulge(d2(0.031 * t3 * m2, p2, 0.079), [f2(0.021), f2(0.015), f2(0.02)], -62e-4 * u2 * (e4.socket ?? 1));
  l2.computeNormals();
  for (let t3 of [1, -1]) l2.bulge(d2(0.03 * t3 * m2, p2 + 0.021, 0.084), [f2(0.03), f2(0.01), f2(0.02)], 3e-3 * u2 * (e4.brow ?? 1)), l2.bulge(d2(0.05 * t3, p2 - 0.02, 0.062), [f2(0.023), f2(0.018), f2(0.022)], 42e-4 * u2 * (e4.cheek ?? 1)), l2.bulge(d2(0.047 * t3, p2 - 0.05, 0.058), [f2(0.022), f2(0.022), f2(0.022)], -65e-4 * u2 * (e4.gaunt ?? 0)), l2.bulge(d2(0.052 * t3 * a2, 0.034, -0.014), [f2(0.022), f2(0.022), f2(0.024)], 35e-4 * u2 * (a2 - 0.75)), l2.bulge(d2(0.068 * t3, p2 + 0.03, 0.03), [f2(0.018), f2(0.022), f2(0.026)], -25e-4 * u2);
  let h2 = e4.nose ?? 1;
  l2.grab(d2(0, p2 - 0.026, 0.087), [f2(0.0105), f2(0.03), f2(0.02)], [0, -15e-4 * u2, 0.0105 * u2 * h2]), l2.grab(d2(0, p2 - 0.046, 0.091), [f2(0.013), f2(0.013), f2(0.016)], [0, 0, 65e-4 * u2 * h2]), l2.computeNormals();
  for (let e5 of [1, -1]) l2.bulge(d2(0.0115 * e5, p2 - 0.049, 0.085), [f2(85e-4), f2(75e-4), f2(0.01)], 28e-4 * u2 * h2);
  let g2 = e4.lips ?? 1;
  l2.bulge(d2(0, 0.046, 0.083), [f2(0.021), f2(95e-4), f2(0.013)], 32e-4 * u2 * g2), l2.bulge(d2(0, 0.0435, 0.087), [f2(0.019), f2(24e-4), f2(0.01)], -18e-4 * u2), l2.bulge(d2(0, 0.012, 0.064), [f2(0.018), f2(0.016), f2(0.018)], 35e-4 * u2 * (e4.chin ?? 1)), l2.computeNormals(), l2.translate(e4.base[0], e4.base[1], e4.base[2]);
  let _2 = 0.0112 * u2, v2 = 0.031 * u2 * n2 * m2;
  return { geo: l2, eyes: [[e4.base[0] + v2, e4.base[1] + p2 * u2 * i2, e4.base[2] + 0.0685 * u2 * r2], [e4.base[0] - v2, e4.base[1] + p2 * u2 * i2, e4.base[2] + 0.0685 * u2 * r2]], eyeR: _2, ears: [[e4.base[0] + 0.07 * u2 * n2, e4.base[1] + (p2 - 0.022) * u2 * i2, e4.base[2] - 0.012 * u2 * r2], [e4.base[0] - 0.07 * u2 * n2, e4.base[1] + (p2 - 0.022) * u2 * i2, e4.base[2] - 0.012 * u2 * r2]], crown: e4.base[1] + 0.235 * u2 * i2, browY: e4.base[1] + (p2 + 0.021) * u2 * i2, center: [e4.base[0], e4.base[1] + 0.13 * u2 * i2, e4.base[2] - 8e-3 * u2 * r2], rx: 0.0725 * u2 * n2, rz: 0.095 * u2 * r2, s: u2, mouth: [e4.base[0], e4.base[1] + 0.045 * u2 * i2, e4.base[2] + 0.087 * u2 * r2], shape: new Lv(c2.map((t3) => ({ y: t3.y + e4.base[1], rx: t3.rx, rzf: t3.rzf, rzb: t3.rzb, cz: (t3.cz ?? 0) + e4.base[2], cx: e4.base[0], p: t3.p }))), base: e4.base };
}
function Ex(e4, t2 = 1) {
  let n2 = new cv(), r2 = new cv(), i2 = e4.eyeR;
  for (let a2 of e4.eyes) {
    let o2 = a2[0] > e4.center[0] ? 1 : -1, s2 = [], c2 = [];
    for (let e5 = 0; e5 <= 8; e5 += 1) {
      let t3 = R(-1.25, 1.25, e5 / 8), n3 = a2[0] + Math.sin(t3) * i2 * 1.02 * o2, r3 = Math.cos(t3);
      s2.push([n3, a2[1] + i2 * (0.32 + 0.32 * r3), a2[2] + i2 * (0.62 + 0.28 * r3)]), c2.push([n3, a2[1] - i2 * (0.38 + 0.2 * r3), a2[2] + i2 * (0.6 + 0.25 * r3)]);
    }
    n2.merge(V(s2, (e5) => [i2 * 0.2 * t2 * (0.55 + 0.45 * Math.sin(e5 * Math.PI)), i2 * 0.16], 4, 7, { up: [0, 1, 0], capStart: true, capEnd: true })), r2.merge(V(c2, (e5) => [i2 * 0.12 * (0.5 + 0.5 * Math.sin(e5 * Math.PI)), i2 * 0.1], 3, 6, { up: [0, 1, 0], capStart: true, capEnd: true }));
  }
  return { upper: n2, lower: r2 };
}
function Dx(e4, t2 = 8) {
  let n2 = new cv();
  for (let r2 of e4.eyes) {
    let i2 = H(e4.eyeR, e4.eyeR, e4.eyeR, t2, 6);
    i2.translate(r2[0], r2[1], r2[2]), n2.merge(i2);
  }
  return n2;
}
function Ox(e4, t2, n2) {
  return (r2, i2) => {
    let a2 = r2.p.x > e4.center[0] ? e4.eyes[0] : e4.eyes[1], o2 = (r2.p.z - a2[2]) / e4.eyeR;
    o2 > 0.8 ? i2.copy(n2).multiplyScalar(0.35) : o2 > 0.58 ? i2.copy(n2) : i2.copy(t2);
  };
}
function kx(e4, t2, n2, r2 = {}) {
  let i2 = (r2.len ?? 1) * 0.03 * n2, a2 = (r2.width ?? 1) * 0.018 * n2, o2 = r2.point ?? 0, s2 = H(6e-3 * n2, i2, a2, 8, 6);
  return s2.deform((e5) => {
    let t3 = (e5.y / i2 + 1) / 2;
    if (e5.z += -Math.abs(e5.y) * 0.1, o2 > 0 && t3 > 0.5) {
      let r3 = (t3 - 0.5) * 2;
      e5.y += r3 * r3 * o2 * 0.06 * n2, e5.z -= r3 * r3 * o2 * 0.035 * n2, e5.x *= 1 - r3 * 0.5;
    }
  }), s2.computeNormals(), s2.rotateY(Hx(t2) * 0.25), s2.rotateX(-(r2.tilt ?? 0.15)), o2 > 0 && s2.rotateZ(-Hx(t2) * o2 * 0.35), s2.translate(e4[0], e4[1], e4[2]), s2;
}
function Ax(e4, t2, n2, r2, i2 = 0.2) {
  let a2 = Hx(t2), o2 = [];
  for (let t3 = 0; t3 <= 5; t3 += 1) {
    let r3 = t3 / 5;
    o2.push([e4[0] + a2 * n2 * r3, e4[1] + n2 * (0.35 * r3 - i2 * r3 * r3), e4[2] - n2 * 0.25 * r3]);
  }
  return V(o2, (e5) => [r2 * (1 - e5 * 0.92) * 1, r2 * 0.32 * (1 - e5 * 0.8)], 5, 6, { up: [0, 1, 0], capStart: true });
}
function jx(e4, t2 = 1, n2 = 1, r2 = 0) {
  let i2 = new cv(), a2 = e4.s;
  for (let o2 of [1, -1]) {
    let s2 = e4.eyes[o2 === 1 ? 0 : 1], c2 = [];
    for (let t3 = 0; t3 <= 4; t3 += 1) {
      let i3 = t3 / 4, l2 = s2[0] + o2 * (-0.016 + i3 * 0.034) * a2, u2 = e4.browY - 2e-3 * a2 + Math.sin(i3 * Math.PI) * 4e-3 * a2 * n2 - r2 * (1 - i3) * 6e-3 * a2, d2 = s2[2] + (0.024 - i3 * 8e-3 - Math.abs(i3 - 0.4) * 4e-3) * a2;
      c2.push([l2, u2, d2]);
    }
    i2.merge(V(c2, (e5) => [28e-4 * a2 * t2 * (1 - e5 * 0.5), 16e-4 * a2], 5, 5, { up: [0, 1, 0], capStart: true, capEnd: true }));
  }
  return i2;
}
function Mx(e4, t2, n2) {
  let r2 = Hx(t2), i2 = Ux(e4.upperArmL, t2), a2 = Ux(e4.elbowL, t2), o2 = Ux(e4.wristL, t2), s2 = [i2[0] - r2 * (n2.topIn ?? 0.03), i2[1] + (n2.topUp ?? 0.035), i2[2]], c2 = Math.hypot(i2[0] - s2[0], i2[1] - s2[1], i2[2] - s2[2]), l2 = Math.hypot(a2[0] - i2[0], a2[1] - i2[1], a2[2] - i2[2]), u2 = Math.hypot(o2[0] - a2[0], o2[1] - a2[1], o2[2] - a2[2]), d2 = c2 + l2 + u2, f2 = (c2 + l2) / d2;
  c2 / d2;
  let p2 = n2.startAt ?? 0, m2 = n2.endAt ?? 1, h2 = [], g2 = (e5) => {
    let t3 = e5 * d2;
    if (t3 <= c2) {
      let e6 = t3 / c2;
      return [R(s2[0], i2[0], e6), R(s2[1], i2[1], e6), R(s2[2], i2[2], e6)];
    }
    if (t3 <= c2 + l2) {
      let e6 = (t3 - c2) / l2;
      return [R(i2[0], a2[0], e6), R(i2[1], a2[1], e6), R(i2[2], a2[2], e6)];
    }
    let n3 = (t3 - c2 - l2) / u2;
    return [R(a2[0], o2[0], n3), R(a2[1], o2[1], n3), R(a2[2], o2[2], n3)];
  };
  for (let e5 = 0; e5 <= 10; e5 += 1) h2.push(g2(R(p2, m2, e5 / 10)));
  let _2 = V(h2, (e5) => n2.radius(R(p2, m2, e5), f2), n2.segs ?? 10, n2.rings ?? 18, { up: [0, 0, 1], linear: false, capStart: true, capEnd: true, tension: 0.2 }), v2 = t2 === 0 ? `L` : `R`, y2 = a2[1], b2 = i2[1];
  return { geo: _2, skin: (e5) => {
    let t3 = e5.p.y;
    if (t3 > b2 - 0.05) {
      let e6 = z(b2 - 0.06, b2 + 0.05, t3) * 0.55;
      return [`upperArm_${v2}`, `shoulder_${v2}`, e6];
    }
    let n3 = z(y2 + 0.035, y2 - 0.035, t3);
    return [`upperArm_${v2}`, `foreArm_${v2}`, n3];
  } };
}
function Nx(e4, t2, n2) {
  let r2 = Ux(e4.hipL, t2), i2 = Ux(e4.kneeL, t2), a2 = Ux(e4.ankleL, t2), o2 = [r2[0], r2[1] + (n2.topUp ?? 0.06), r2[2]], s2 = o2[1] - r2[1], c2 = Math.hypot(i2[1] - r2[1], i2[2] - r2[2]), l2 = Math.hypot(a2[1] - i2[1], a2[2] - i2[2]), u2 = s2 + c2 + l2, d2 = (s2 + c2) / u2, f2 = n2.startAt ?? 0, p2 = n2.endAt ?? 1, m2 = (e5) => {
    let t3 = e5 * u2;
    if (t3 <= s2) return [o2[0], o2[1] - t3, o2[2]];
    if (t3 <= s2 + c2) {
      let e6 = (t3 - s2) / c2;
      return [R(r2[0], i2[0], e6), R(r2[1], i2[1], e6), R(r2[2], i2[2], e6)];
    }
    let n3 = (t3 - s2 - c2) / l2;
    return [R(i2[0], a2[0], n3), R(i2[1], a2[1], n3), R(i2[2], a2[2], n3)];
  }, h2 = [];
  for (let e5 = 0; e5 <= 10; e5 += 1) h2.push(m2(R(f2, p2, e5 / 10)));
  let g2 = V(h2, (e5) => n2.radius(R(f2, p2, e5), d2), n2.segs ?? 10, n2.rings ?? 16, { up: [0, 0, 1], capStart: true, capEnd: true, tension: 0.2 }), _2 = t2 === 0 ? `L` : `R`, v2 = i2[1], y2 = r2[1];
  return { geo: g2, skin: (e5) => {
    let t3 = e5.p.y;
    return t3 > y2 - 0.04 ? [`thigh_${_2}`, `hips`, z(y2 - 0.05, y2 + 0.06, t3) * 0.6] : [`thigh_${_2}`, `shin_${_2}`, z(v2 + 0.04, v2 - 0.04, t3)];
  } };
}
function Px(e4, t2, n2 = {}) {
  let r2 = n2.scale ?? e4.P.height / 1.85, i2 = Hx(t2), a2 = Ux(e4.wristL, t2), o2 = Ux(e4.fingersL, t2), s2 = a2[1] - o2[1], c2 = (n2.palmW ?? 1) * 0.04 * r2, l2 = Q_([{ y: -4e-3 * r2, rx: 0.012 * r2, rzf: c2 * 0.75, p: 3 }, { y: s2 * 0.25, rx: 0.015 * r2, rzf: c2 * 0.92, p: 3 }, { y: s2 * 0.7, rx: 0.0145 * r2, rzf: c2, p: 3 }, { y: s2 * 1.02, rx: 0.012 * r2, rzf: c2 * 0.95, p: 3 }, { y: s2 * 1.08, rx: 6e-3 * r2, rzf: c2 * 0.7, p: 3 }], n2.palmSegs ?? 10, 1, { capStart: true, capEnd: true });
  l2.rotateX(Math.PI), l2.translate(a2[0] - i2 * 2e-3 * r2, a2[1], a2[2] + 4e-3 * r2), l2.bulge([a2[0] + i2 * 0.012 * r2, a2[1] - s2 * 0.5, a2[2]], [0.015 * r2, s2 * 0.5, c2], 2e-3 * r2);
  let u2 = new cv(), d2 = new cv(), f2 = n2.fingers ?? 4, p2 = (n2.fingerLen ?? 1) * 0.078 * r2, m2 = (n2.fingerR ?? 1) * 85e-4 * r2, h2 = n2.curl ?? 0.95;
  for (let e5 = 0; e5 < f2; e5 += 1) {
    let t3 = f2 === 1 ? 0 : e5 / (f2 - 1), s3 = a2[2] + 4e-3 * r2 + R(c2 * 0.66, -c2 * 0.66, t3), l3 = p2 * ([0.95, 1.05, 1, 0.82][Math.min(3, Math.round(t3 * 3))] ?? 1), g2 = [[o2[0], o2[1] + 8e-3 * r2, s3]], _2 = o2[0], v2 = o2[1], y2 = 0, b2 = [0.42, 0.33, 0.25], x2 = [0.32, 0.4, 0.28];
    for (let e6 = 0; e6 < 3; e6 += 1) y2 += h2 * x2[e6], _2 += -i2 * Math.sin(y2) * l3 * b2[e6], v2 += -Math.cos(y2) * l3 * b2[e6], g2.push([_2, v2, s3 * (1 - 0.02 * (e6 + 1))]);
    if (u2.merge(V(g2, (e6) => [m2 * (1 - e6 * 0.28), m2 * 0.92 * (1 - e6 * 0.28)], 5, 3, { up: [1, 0, 0], capStart: true, capEnd: true })), n2.claws) {
      let e6 = g2[g2.length - 1], t4 = V([e6, [e6[0] - i2 * 8e-3 * r2, e6[1] - n2.claws * 0.6, e6[2]], [e6[0] - i2 * 0.02 * r2, e6[1] - n2.claws, e6[2]]], (e7) => m2 * 0.75 * (1 - e7), 4, 2, { capStart: true });
      d2.merge(t4);
    }
  }
  if (n2.thumb !== false) {
    let e5 = [a2[0] - i2 * 8e-3 * r2, a2[1] - s2 * 0.32, a2[2] + c2 * 0.9], t3 = V([e5, [e5[0] - i2 * 0.012 * r2, e5[1] - 0.022 * r2, e5[2] + 0.014 * r2], [e5[0] - i2 * 0.02 * r2, e5[1] - 0.045 * r2, e5[2] + 0.016 * r2]], (e6) => m2 * 1.1 * (1 - e6 * 0.25), 5, 4, { up: [1, 0, 0], capStart: true, capEnd: true });
    l2.merge(t3);
  }
  return { palm: l2, fingers: u2, claws: d2 };
}
function Fx(e4, t2, n2 = {}) {
  let r2 = e4.P.height / 1.85, i2 = Ux(e4.ankleL, t2), a2 = (n2.len ?? 1) * e4.P.footLen, o2 = (n2.heel ?? 1) * 0.055 * r2, s2 = (n2.width ?? 1) * 0.048 * r2, c2 = (n2.height ?? 1) * (i2[1] + 0.035 * r2), l2 = (n2.toeH ?? 1) * 0.045 * r2, u2 = [], d2 = n2.rings ?? 12, f2 = n2.segs ?? 12;
  for (let e5 = 0; e5 <= d2; e5 += 1) {
    let t3 = e5 / d2, r3 = -o2 + t3 * (a2 + o2), p2 = s2 * (0.72 + 0.32 * Math.sin(Math.min(1, t3 * 1.25) * Math.PI * 0.5) - (n2.point ?? 0) * z(0.75, 1, t3) * 0.5), m2 = R(c2, l2, z(0.25, 0.75, t3));
    if (t3 < 0.08) {
      let e6 = Math.sqrt(t3 / 0.08);
      p2 *= 0.55 + 0.45 * e6, m2 *= 0.6 + 0.4 * e6;
    }
    if (t3 > 0.88) {
      let e6 = Math.sqrt(Math.max(0, (1 - t3) / 0.12));
      p2 *= e6, m2 *= 0.35 + 0.65 * e6;
    }
    let h2 = [];
    for (let e6 = 0; e6 < f2; e6 += 1) {
      let t4 = e6 / f2 * c_, n3 = Math.sin(t4), a3 = Math.cos(t4), o3 = a3 >= 0 ? 2.2 : 6, s3 = Math.sign(a3) * Math.abs(a3) ** (2 / o3), c3 = Math.sign(n3) * Math.abs(n3) ** (2 / o3);
      h2.push([i2[0] + c3 * p2, m2 * 0.5 + s3 * m2 * 0.5, i2[2] + r3]);
    }
    u2.push(h2);
  }
  return Y_(u2, { closed: true, capStart: true, capEnd: true }).orientOutward();
}
function Ix(e4, t2, n2, r2, i2, a2 = 0.012, o2 = 12) {
  let s2 = Ux(e4.ankleL, t2), c2 = Ux(e4.kneeL, t2), l2 = s2[1] - 0.03, u2 = X_([[r2 * 1.05, l2], [r2, l2 + 0.04], [R(r2, i2, 0.5) * 1.05, R(l2, n2, 0.5)], [i2, n2 - 0.015], [i2 + a2, n2 - 6e-3], [i2 + a2 * 0.6, n2 + 4e-3]], o2, { sz: 1.08 }), d2 = (e5) => R(s2[2], c2[2], l_((e5 - s2[1]) / (c2[1] - s2[1]), 0, 1));
  return u2.deform((e5) => {
    e5.z += d2(e5.y) - 4e-3;
  }), u2.translate(s2[0], 0, 0), u2.computeNormals();
}
function Lx(e4, t2) {
  if (e4 <= t2[0][0]) return t2[0][1];
  for (let n2 = 0; n2 < t2.length - 1; n2 += 1) {
    let [r2, i2] = t2[n2], [a2, o2] = t2[n2 + 1];
    if (e4 <= a2) {
      let t3 = (e4 - r2) / (a2 - r2), n3 = t3 * t3 * (3 - 2 * t3);
      return i2 + (o2 - i2) * n3;
    }
  }
  return t2[t2.length - 1][1];
}
function Rx(e4, t2 = {}) {
  let n2 = e4.s, r2 = t2.thick ?? 9e-3, i2 = (t2.volume ?? 0.012) * n2, a2 = e4.center, o2 = e4.crown + r2 * 0.6 + i2 * 0.7, s2 = t2.segs ?? 22, c2 = t2.rings ?? 9, l2 = e4.browY, u2 = [[0, l2 + (t2.front ?? 0.042) * n2], [0.5, l2 + (t2.temple ?? 8e-3) * n2], [1.15, l2 + (t2.side ?? -0.03) * n2], [1.45, t2.overEars ? l2 - 0.06 * n2 : l2 - 4e-3 * n2], [1.95, t2.overEars ? a2[1] - 0.07 * n2 : a2[1] - 0.045 * n2], [Math.PI, a2[1] - (t2.nape ?? 0.085) * n2]], d2 = [];
  for (let l3 = 0; l3 <= c2; l3 += 1) {
    let f3 = l3 / c2, p2 = [];
    for (let c3 = 0; c3 < s2; c3 += 1) {
      let l4 = c3 / s2 * c_, d3 = R(Lx(Math.abs((l4 + Math.PI) % c_ - Math.PI), u2), o2, Math.sin(f3 * Math.PI * 0.5)), m2 = l_((d3 - a2[1]) / (o2 - a2[1]), -1, 1), h2 = Math.sqrt(m2 >= 0 ? Math.max(0, 1 - m2 ** 2.15) : Math.max(0.2, 1 - m2 * m2 * 0.35)), g2 = Math.sin(l4), _2 = Math.cos(l4), v2 = i2 * Math.sin(Math.max(0.05, f3) * Math.PI * 0.62) ** 0.6 * (0.55 + 0.45 * Math.abs(g2)) * (_2 < 0 ? 1.1 : 0.85), y2 = e4.rx + r2 + v2, b2 = (_2 > 0 ? e4.rz * 0.93 : e4.rz * 1.02) + r2 + v2, x2 = a2[0] + g2 * y2 * h2, S2 = d3, C2 = a2[2] + _2 * b2 * h2;
      if (t2.part && Math.abs(g2) < 0.18 && _2 > -0.3 && f3 > 0.45) {
        let e5 = (1 - Math.abs(g2) / 0.18) * z(0.45, 0.9, f3);
        x2 -= g2 * 0, S2 -= t2.part * n2 * e5, C2 -= t2.part * n2 * e5 * 0.3 * _2;
      }
      p2.push([x2, S2, C2]);
    }
    d2.push(p2);
  }
  let f2 = Y_(d2, { closed: true });
  return f2.orientOutward(), f2;
}
function zx(e4, t2, n2 = 8, r2 = 7) {
  return V(e4, (e5) => {
    let r3 = 0.75 + 0.25 * Math.abs(Math.sin(e5 * n2 * Math.PI)), i2 = 1 - e5 * 0.55;
    return [t2 * r3 * i2, t2 * 0.85 * r3 * i2];
  }, r2, n2 * 4, { up: [1, 0, 0], capStart: true, capEnd: true, twist: n2 * 0.6 });
}
function Bx(e4, t2, n2, r2 = 5, i2 = 8, a2 = 0.8, o2 = [0, 0, 1]) {
  return V(e4, (e5) => [n2 * (1 - e5 * 0.5), t2 * (1 - e5 * a2)], r2, i2, { up: o2, capStart: true, capEnd: true });
}
var Vx, Hx, Ux, Wx = t((() => {
  lv(), __(), zv(), Vx = (e4) => e4 === 0 ? `L` : `R`, Hx = (e4) => e4 === 0 ? 1 : -1, Ux = (e4, t2) => [e4[0] * Hx(t2), e4[1], e4[2]];
}));
function Gx() {
  let e4 = lx(dx(1.85, { shoulderX: 0.166, hipWidth: 0.087, clavX: 0.03, shoulderY: 1.482, armOut: 0.058, footLen: 0.24, hip: 0.955, knee: 0.52, elbow: 1.165, wrist: 0.905 })), t2 = Tx({ segs: 18, base: [0, 1.611, 0.014], scale: 0.96, jaw: 0.9, chin: 0.9, brow: 0.45, nose: 0.82, cheek: 1.15, lips: 1.2, width: 0.99 }), n2 = [[`FL`, 0.12, 1.42, 0], [`FR`, -1.42, -0.12, 0], [`BL`, 1.6, 3.2, 4e-3], [`BR`, -3.2, -1.6, 0]], r2 = new Lv([{ y: 0.8, rx: 0.15, rzf: 0.1, rzb: 0.118 }, { y: 0.92, rx: 0.16, rzf: 0.106, rzb: 0.126 }, { y: 1, rx: 0.148, rzf: 0.099, rzb: 0.11 }, { y: 1.07, rx: 0.121, rzf: 0.088, rzb: 0.088, cz: 4e-3 }, { y: 1.14, rx: 0.117, rzf: 0.087, rzb: 0.085, cz: 7e-3 }, { y: 1.22, rx: 0.125, rzf: 0.094, rzb: 0.086, cz: 0.01 }, { y: 1.29, rx: 0.133, rzf: 0.106, rzb: 0.088, cz: 0.012 }, { y: 1.35, rx: 0.137, rzf: 0.112, rzb: 0.09, cz: 0.012 }, { y: 1.41, rx: 0.141, rzf: 0.1, rzb: 0.09, cz: 8e-3 }, { y: 1.455, rx: 0.146, rzf: 0.083, rzb: 0.088 }, { y: 1.492, rx: 0.13, rzf: 0.066, rzb: 0.074, cz: -4e-3 }, { y: 1.525, rx: 0.076, rzf: 0.055, rzb: 0.062, cz: -6e-3 }, { y: 1.565, rx: 0.052, rzf: 0.045, rzb: 0.052, cz: -6e-3 }, { y: 1.615, rx: 0.048, rzf: 0.04, rzb: 0.05, cz: -6e-3 }, { y: 1.665, rx: 0.044, rzf: 0.03, rzb: 0.046, cz: -0.012 }]), i2 = (e5) => {
    e5.computeNormals();
    for (let t3 of [1, -1]) e5.grab([t3 * 0.064, 1.345, 0.11], [0.066, 0.06, 0.07], [t3 * 4e-3, 6e-3, 0.02]);
    return e5.computeNormals();
  }, a2 = t2.center[1] - 0.07, o2 = [[0, a2, -0.098], r2.point(Math.PI, 1.5, 0.03), r2.point(Math.PI, 1.38, 0.026), r2.point(Math.PI, 1.24, 0.024), r2.point(Math.PI, 1.12, 0.03)], s2 = [o2[0], o2[1], o2[2], o2[3]], c2 = [{ name: `braid_1`, parent: `head`, pos: s2[0] }, { name: `braid_2`, parent: `braid_1`, pos: s2[1] }, { name: `braid_3`, parent: `braid_2`, pos: s2[2] }, { name: `braid_4`, parent: `braid_3`, pos: s2[3] }, { name: `sash_1`, parent: `hips`, pos: [0.135, 1, 0.07] }, { name: `sash_2`, parent: `sash_1`, pos: [0.15, 0.84, 0.08] }];
  for (let [e5, t3, i3] of n2) {
    let n3 = (t3 + i3) / 2, a3 = r2.point(n3, 1.02, 0.02), o3 = r2.point(n3, 0.84, 0);
    c2.push({ name: `skirt${e5}_1`, parent: `hips`, pos: a3 }), c2.push({ name: `skirt${e5}_2`, parent: `skirt${e5}_1`, pos: [o3[0] * 1.12, 0.58, o3[2] * 1.12] });
  }
  let l2 = new fx(ux(e4, c2)), u2 = new H_();
  u2.add(t2.geo, { bone: `head`, color: Kx.skin, paint: yx(t2, Kx.skin, { lip: Kx.lip, shadow: `#3c2228`, shadowK: 0.58, blush: 0.16 }), rough: 0.5, detail: B.SKIN, wear: 0.08 }), u2.add(Dx(t2, 7), { bone: `head`, color: `#bdb1a8`, paint: Ox(t2, new P(`#bdb1a8`), new P(`#2c4a6a`)), rough: 0.12, detail: B.GEM, ao: 0.5 });
  let d2 = Ex(t2, 1.15);
  u2.add(d2.upper, { bone: `head`, color: `#1a100c`, rough: 0.6, detail: B.HAIR, ao: 0.3 }), u2.add(d2.lower, { bone: `head`, color: `#b98471`, rough: 0.55, detail: B.SKIN }), u2.add(jx(t2, 0.85, 1.25), { bone: `head`, color: Kx.hair, rough: 0.6, detail: B.HAIR });
  for (let e5 = 0; e5 < 2; e5 += 1) u2.add(kx(t2.ears[e5], e5, 0.92), { bone: `head`, color: Kx.skin, rough: 0.55, detail: B.SKIN });
  let f2 = { bone: `head`, color: Kx.hair, rough: 0.4, detail: B.HAIR, zone: z_.HAIR, mottle: 0.1, mottleScale: 34 };
  u2.add(Rx(t2, { thick: 8e-3, front: 0.046, temple: 0.012, side: -0.022, nape: 0.075, volume: 0.016, part: 5e-3, segs: 20, rings: 8 }), f2);
  for (let e5 of [1, -1]) {
    let n3 = [[e5 * (t2.rx - 4e-3), t2.browY + 0.012, t2.center[2] + 0.052], [e5 * (t2.rx + 0.01), t2.browY - 0.018, t2.center[2] + 0], [e5 * (t2.rx + 3e-3), t2.center[1] - 0.045, t2.center[2] - 0.06], [e5 * 0.03, a2 + 5e-3, -0.09]];
    u2.add(Bx(n3, 0.028, 75e-4, 6, 7, 0.35, [e5, 0.3, 0]), f2);
  }
  for (let e5 of [1, -1]) {
    let n3 = [[e5 * 0.026, t2.browY + 0.045, t2.center[2] + t2.rz * 0.88], [e5 * (t2.rx - 4e-3), t2.browY + 2e-3, t2.center[2] + 0.062], [e5 * (t2.rx + 2e-3), t2.browY - 0.05, t2.center[2] + 0.05], [e5 * (t2.rx - 8e-3), t2.browY - 0.098, t2.center[2] + 0.04]];
    u2.add(Bx(n3, 0.011, 45e-4, 4, 7, 0.75, [e5 * 0.6, 0, 0.8]), f2);
  }
  let p2 = H(0.04, 0.036, 0.032, 10, 7);
  p2.translate(0, a2 + 0.012, -0.092), u2.add(p2, { ...f2, zone: z_.BODY, bone: `head` }), u2.add(zx(o2, 0.0185, 6, 5), { ...f2, zone: z_.BODY, bone: void 0, skin: Fv([`braid_1`, `braid_2`, `braid_3`, `braid_4`], s2, 0.6) });
  let m2 = o2[4];
  u2.add(av(0.0145, 42e-4, 10, 4).translate(m2[0], m2[1] + 0.02, m2[2]), { ...qx, bone: `braid_4` }), u2.add(av(0.019, 4e-3, 10, 4).translate(0, a2 - 0.02, -0.1), { ...qx, bone: `braid_1` }), u2.add(X_([[0, -0.09], [4e-3, -0.085], [0.012, -0.065], [0.015, -0.03], [0.012, 0]], 7).translate(m2[0], m2[1] + 0.012, m2[2]), { ...f2, zone: z_.BODY, bone: `braid_4` });
  let h2 = [];
  for (let e5 = 0; e5 <= 22; e5 += 1) {
    let n3 = e5 / 22 * c_, r3 = Math.max(0, Math.cos(n3)), i3 = t2.browY + 0.036 + (1 - r3) * 0.026;
    h2.push([Math.sin(n3) * (t2.rx + 0.02), i3, t2.center[2] + Math.cos(n3) * (t2.rz + 0.014) * (Math.cos(n3) > 0 ? 0.95 : 1)]);
  }
  u2.add(V(h2, [42e-4, 22e-4], 3, 24, { up: [0, 1, 0] }), { ...qx, bone: `head`, zone: z_.HEADWEAR });
  let g2 = [0, t2.browY + 0.036, t2.center[2] + t2.rz * 0.95 + 0.016];
  u2.add(X_([[0, -0.012], [0.012, -6e-3], [0.013, 4e-3], [6e-3, 0.012], [0, 0.014]], 7, { sz: 0.5 }).translate(g2[0], g2[1], g2[2] - 3e-3), { ...qx, bone: `head`, zone: z_.HEADWEAR }), u2.add(Tv(g2, 75e-4, 0.02, 6).rotateAt(g2, Math.PI / 2, 0, 0).translate(0, 0, 4e-3), { bone: `head`, color: Kx.gem, rough: 0.05, emit: 1.1, detail: B.GEM, zone: z_.HEADWEAR, ao: 0 });
  let _2 = i2(r2.loft(1.31, 1.665, 14, 8, 0));
  for (let e5 of [1, -1]) _2.bulge([e5 * 0.06, 1.476, 0.07], [0.05, 8e-3, 0.02], 25e-4);
  _2.computeNormals(), u2.add(_2, { color: Kx.skin, rough: 0.48, detail: B.SKIN, skin: Pv(`neck`, `chest`, 1.575, 1.52), wear: 0.08 }), u2.add(av(0.053, 28e-4, 12, 4).translate(0, 1.55, -4e-3), { ...qx, bone: `neck` }), u2.add(Tv([0, 1.514, 0.06], 8e-3, 0.022, 6).rotateAt([0, 1.514, 0.06], 0.25, 0, 0), { bone: `chest`, color: `#c41f3a`, rough: 0.06, emit: 0.7, detail: B.GEM, ao: 0 });
  let v2 = (e5) => {
    let t3 = Math.abs(((e5 + Math.PI) % c_ + c_) % c_ - Math.PI);
    return t3 < 0.45 ? 1.352 + 0.044 * Math.sin(t3 / 0.45 * Math.PI * 0.5) : t3 < Math.PI / 2 ? 1.396 + 0.026 * ((t3 - 0.45) / (Math.PI / 2 - 0.45)) : 1.422 - 0.04 * ((t3 - Math.PI / 2) / (Math.PI / 2));
  }, y2 = (e5) => 1 - 0.045 * Math.max(0, Math.cos(e5)) ** 6, b2 = Pv(`chest`, `spine`, 1.2, 1.1), x2 = i2(Mv(r2, { nu: 24, nv: 8, yBot: y2, yTop: v2, off: (e5, t3) => 65e-4 + t3 * 2e-3 })), S2 = new P(Kx.bodiceDark);
  u2.add(x2, { color: Kx.bodice, paint: (e5, t3) => {
    let n3 = Math.atan2(e5.p.x, e5.p.z);
    t3.lerp(S2, z(0.72, 1, Math.abs(Math.sin(n3))) * 0.75);
  }, rough: 0.6, detail: B.CLOTH, zone: z_.ARMOR, skin: b2, wear: 0.2 });
  let C2 = (e5, t3, n3) => {
    let i3 = [];
    for (let a3 = 0; a3 <= n3; a3 += 1) {
      let o3 = a3 / n3 * c_;
      i3.push(r2.point(o3, e5(o3), t3));
    }
    return i3;
  }, w2 = i2(V(C2(v2, 0.011, 30), [42e-4, 42e-4], 3, 30, { up: [0, 1, 0] }));
  u2.add(w2, { ...Jx, skin: b2 }), u2.add(V(C2(y2, 0.011, 24), [42e-4, 42e-4], 3, 24, { up: [0, 1, 0] }), { ...Jx, bone: `spine` });
  let T2 = [];
  for (let e5 = 0; e5 <= 6; e5 += 1) T2.push(r2.point(0, R(y2(0) + 0.01, 1.35, e5 / 6), 0.0105));
  u2.add(i2(V(T2, [35e-4, 35e-4], 4, 10, { capStart: true, capEnd: true })), { ...Jx, skin: b2 });
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let t3 = R(1.03, 1.3, e5 / 4);
    u2.add(V([r2.point(0.14, t3, 95e-4), r2.point(-0.14, t3 + 0.012, 95e-4)], 18e-4, 3, 2, { linear: true }), { ...Jx, bone: t3 > 1.18 ? `chest` : `spine` });
  }
  for (let e5 of [1, -1]) {
    let t3 = [];
    for (let n3 = 0; n3 <= 10; n3 += 1) {
      let i3 = n3 / 10;
      t3.push(r2.point(e5 * (0.18 + i3 * 0.55), R(1.06, 1.27, i3) + Math.sin(i3 * Math.PI * 2.2) * 0.02, 95e-4));
    }
    u2.add(V(t3, [22e-4, 22e-4], 3, 14, {}), { ...Jx, skin: b2 });
  }
  let E2 = Nv(r2, 1.015, 0.07, 0.012, 24, { tilt: (e5) => -0.018 * Math.cos(e5 - 1.1), offset: 0.012 });
  u2.add(E2, { bone: `hips`, color: Kx.sash, rough: 0.7, detail: B.CLOTH, wear: 0.25, mottle: 0.08 });
  let D2 = r2.point(1.15, 1.005, 0.03);
  u2.add(H(0.03, 0.026, 0.022, 9, 6).translate(D2[0], D2[1], D2[2]), { bone: `hips`, color: Kx.sash, rough: 0.7, detail: B.CLOTH });
  for (let e5 of [0, 1]) {
    let t3 = D2[0] + 5e-3 + e5 * 0.012, n3 = D2[2] + 0.012 - e5 * 0.022, r3 = rv(2, 7, (r4, i3) => [t3 + 0.01 + i3 * 0.014 + (r4 - 0.5) * 4e-3, D2[1] - 0.01 - i3 * (0.26 - e5 * 0.05), n3 + (r4 - 0.5) * 0.045 * (1 + i3 * 0.3)], 6e-3, (e6) => new N(e6.x, 0, e6.z).normalize());
    u2.add(r3, { color: Kx.sash, colors: { 1: Kx.sashDark, 2: Kx.embroid }, paint: (e6, t4) => {
      e6.v > 0.9 && e6.tag !== 1 && t4.set(Kx.embroid);
    }, rough: 0.72, detail: B.CLOTH, skin: (e6) => [`sash_1`, `sash_2`, z(D2[1] - 0.02, D2[1] - 0.2, e6.p.y)] });
  }
  let O2 = new P(Kx.bodiceDark);
  for (let [e5, t3, i3, a3] of n2) {
    let n3 = rv(6, 8, (e6, n4) => {
      let o3 = R(t3, i3, e6), s3 = R(1.04, 0.1, n4), c3 = Math.sin(e6 * Math.PI * 3 + 0.4) * (6e-3 + 0.014 * n4), l3 = 0.013 + a3 + n4 ** 1.4 * 0.085 + c3, u3 = r2.point(o3, Math.max(s3, 0.8), l3);
      return [u3[0], s3, u3[2]];
    }, 7e-3, (e6) => new N(e6.x, 0, e6.z).normalize());
    u2.add(n3, { color: Kx.skirt, colors: { 1: Kx.lining, 2: Kx.embroid }, paint: (e6, t4) => {
      e6.tag !== 1 && (e6.v > 0.94 || e6.u < 0.03 || e6.u > 0.97 ? t4.set(Kx.embroid) : e6.v > 0.86 ? t4.lerp(O2, 0.65) : t4.lerp(O2, 0.25 * (1 - Math.abs(Math.sin(e6.u * Math.PI * 3 + 0.4)))));
    }, pbr: (e6, t4) => {
      e6.tag !== 1 && (e6.v > 0.94 || e6.u < 0.03 || e6.u > 0.97) && (t4[0] = 0.5, t4[1] = 0.6);
    }, rough: 0.66, detail: B.CLOTH, wear: 0.35, skin: Iv(`hips`, `skirt${e5}_1`, `skirt${e5}_2`, 1, 0.62, 0.22) });
  }
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = Nx(e4, t3, { radius: (e5, t4) => {
      let n4 = R(0.068, 0.046, z(0.05, t4, e5)), r4 = e5 > t4 ? 0.042 + Math.sin((e5 - t4) / (1 - t4) * Math.PI) * 7e-3 - z(0.8, 1, e5) * 0.012 : n4;
      return [r4, r4 * 0.94];
    }, endAt: 0.9, segs: 6, rings: 9 });
    u2.add(r3.geo, { color: Kx.legging, rough: 0.6, detail: B.CLOTH, skin: r3.skin, wear: 0.2 });
    let i3 = Ux(e4.ankleL, t3), a3 = (e5) => e5.p.z > i3[2] + 0.168;
    u2.add(Fx(e4, t3, { width: 0.88, point: 0.3, height: 1, segs: 9, rings: 8 }), { color: Kx.boot, paint: (e5, t4) => {
      a3(e5) && t4.set(Kx.gold);
    }, pbr: (e5, t4) => {
      a3(e5) && (t4[0] = 0.32, t4[1] = 1);
    }, rough: 0.48, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`foot_${n3}`, `toe_${n3}`, z(i3[2] + 0.1, i3[2] + 0.15, e5.p.z)], wear: 0.5 }), u2.add(Ix(e4, t3, 0.45, 0.034, 0.043, 6e-3, 10), { color: Kx.boot, paint: (e5, t4) => {
      e5.p.y > 0.433 && t4.set(Kx.gold);
    }, pbr: (e5, t4) => {
      e5.p.y > 0.433 && (t4[0] = 0.32, t4[1] = 1);
    }, rough: 0.48, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`shin_${n3}`, `foot_${n3}`, z(0.16, 0.1, e5.p.y)], wear: 0.45 });
  }
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = Mx(e4, t3, { radius: (e5, t4) => {
      if (e5 < t4) {
        let n5 = 1 + 0.14 * Math.exp(-(((e5 - 0.08) / 0.08) ** 2)), r5 = 1 + 0.08 * Math.exp(-(((e5 - 0.45) / 0.15) ** 2)), i4 = R(0.034, 0.027, z(0.1, t4, e5)) * n5 * r5;
        return [i4, i4 * 0.95];
      }
      let n4 = (e5 - t4) / (1 - t4), r4 = R(0.029, 0.0205, z(0.15, 1, n4)) * (1 + 0.1 * Math.exp(-(((n4 - 0.2) / 0.15) ** 2)));
      return [r4 * 0.92, r4];
    }, topIn: 0.045, topUp: 0.012, segs: 8, rings: 12 });
    u2.add(r3.geo, { color: Kx.skin, rough: 0.48, detail: B.SKIN, skin: r3.skin, wear: 0.08 });
    let i3 = Px(e4, t3, { scale: 0.88 });
    u2.add(i3.palm, { bone: `hand_${n3}`, color: Kx.skin, rough: 0.5, detail: B.SKIN }), u2.add(i3.fingers, { bone: `fingers_${n3}`, color: Kx.skin, rough: 0.5, detail: B.SKIN });
    let a3 = Ux(e4.elbowL, t3), o3 = Ux(e4.wristL, t3), s3 = [0, 0.33, 0.66, 1].map((e5) => [R(o3[0], a3[0], e5 * 0.55), R(o3[1] - 5e-3, a3[1], e5 * 0.55), R(o3[2], a3[2], e5 * 0.55)]), c3 = (e5) => {
      let t4 = (e5.p.y - (o3[1] - 5e-3)) / ((a3[1] - o3[1]) * 0.55);
      return t4 < 0.1 || t4 > 0.88 || Math.abs(t4 - 0.5) < 0.045;
    };
    u2.add(V(s3, (e5) => {
      let t4 = R(0.025, 0.032, e5) * (e5 < 0.08 || e5 > 0.92 ? 1.1 : 1);
      return [t4, t4 * 1.04];
    }, 8, 6), { bone: `foreArm_${n3}`, color: Kx.bracer, paint: (e5, t4) => {
      c3(e5) && t4.set(Kx.gold);
    }, pbr: (e5, t4) => {
      c3(e5) && (t4[0] = 0.32, t4[1] = 1);
    }, rough: 0.55, detail: B.LEATHER, zone: z_.GLOVE, wear: 0.4 });
    let l3 = Ux(e4.upperArmL, t3);
    u2.add(av(0.033, 4e-3, 12, 4).scale(1, 1, 1.05).translate(R(l3[0], a3[0], 0.35), R(l3[1], a3[1], 0.35), l3[2]), { ...qx, bone: `upperArm_${n3}` });
  }
  let k2 = [{ id: `braid`, bones: [`braid_1`, `braid_2`, `braid_3`, `braid_4`], gravity: 0.55, inertia: 0.025, drag: 0.06, stiffness: 60, damping: 8, restX: 0, xMin: -0.06, xMax: 1.2, zMin: -0.5, zMax: 0.5, falloff: 0.85, sway: 0.015 }, { id: `sash`, bones: [`sash_1`, `sash_2`], gravity: 0.8, inertia: 0.02, drag: 0.05, stiffness: 60, damping: 7, restX: 0.05, xMin: -0.6, xMax: 0.9, sway: 0.04 }, ...n2.map(([e5, t3, n3]) => {
    let r3 = Math.cos((t3 + n3) / 2) > 0;
    return { id: `skirt${e5}`, bones: [`skirt${e5}_1`, `skirt${e5}_2`], gravity: 0.55, inertia: 0.012, drag: 0.035, stiffness: 110, damping: 13, restX: 0, xMin: r3 ? -1 : -0.2, xMax: r3 ? 0.2 : 1, zMin: -0.45, zMax: 0.45, falloff: 0.8, sway: 0.015 };
  })], A2 = [{ id: `skirtFL`, side: 0, mode: `front` }, { id: `skirtFR`, side: 1, mode: `front` }, { id: `skirtBL`, side: 0, mode: `back` }, { id: `skirtBR`, side: 1, mode: `back` }];
  return hx({ key: `hero:sorceress`, def: l2, mb: u2, height: 1.85, radius: 0.32, sockets: _x(e4), springs: k2, contacts: vx(), animator: (t3) => new sx(new ix(t3, e4, { kind: `sorceress`, gait: `graceful`, weapon: `staff`, castStyle: `staff`, armSwing: 0.32, runArmSwing: 0.62, footSpread: -0.012, crouch: 0.03, fingersOpen: 0.15, elbow: 0.34, armOut: 0.09, tauntStyle: `weaponRaise` }), t3, A2), equip: { weapons: true, offHand: true, helm: true, helmScale: 0.97, helmOffset: [t2.center[0] - e4.head[0], t2.center[1] - e4.head[1], t2.center[2] - e4.head[2]] }, defaultEquipment: { mainHand: `longStaff` } });
}
var Kx, qx, Jx, Yx = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), Ev(), wx(), Wx(), Kx = { skin: `#dfa98c`, lip: `#a5474a`, bodice: `#1b2b70`, bodiceDark: `#101a48`, gold: `#d6a443`, embroid: `#c39340`, sash: `#931628`, sashDark: `#5a0c17`, skirt: `#1d2c6e`, lining: `#5c0f1b`, hair: `#1d130d`, boot: `#3a2416`, legging: `#17141d`, bracer: `#2c1d14`, gem: `#3f8cff` }, qx = { color: Kx.gold, rough: 0.32, metal: 1, detail: B.METAL, wear: 0.1 }, Jx = { color: Kx.embroid, rough: 0.5, metal: 0.6, detail: B.METAL, wear: 0.2 };
}));
function Xx() {
  let e4 = lx(dx(1.9, { shoulderX: 0.232, hipWidth: 0.104, clavX: 0.045, shoulderY: 1.515, armOut: 0.095, elbow: 1.2, wrist: 0.93, hip: 0.95, knee: 0.52, footLen: 0.29, chest: 1.33, spine: 1.1, neck: 1.57, head: 1.672 })), t2 = Tx({ segs: 15, base: [0, 1.642, 0.022], scale: 1.02, jaw: 1.28, chin: 1.25, brow: 1.7, nose: 1.15, cheek: 1.05, lips: 0.85, width: 1.06, socket: 1.25 }), n2 = new Lv([{ y: 0.8, rx: 0.17, rzf: 0.12, rzb: 0.13 }, { y: 0.92, rx: 0.18, rzf: 0.125, rzb: 0.14 }, { y: 1, rx: 0.172, rzf: 0.122, rzb: 0.13 }, { y: 1.08, rx: 0.165, rzf: 0.122, rzb: 0.118, cz: 6e-3 }, { y: 1.16, rx: 0.172, rzf: 0.125, rzb: 0.118, cz: 0.01 }, { y: 1.25, rx: 0.192, rzf: 0.128, rzb: 0.122, cz: 0.012 }, { y: 1.33, rx: 0.215, rzf: 0.136, rzb: 0.128, cz: 0.014 }, { y: 1.41, rx: 0.228, rzf: 0.14, rzb: 0.126, cz: 0.012 }, { y: 1.47, rx: 0.232, rzf: 0.122, rzb: 0.122, cz: 4e-3 }, { y: 1.515, rx: 0.205, rzf: 0.1, rzb: 0.108, cz: -6e-3 }, { y: 1.55, rx: 0.13, rzf: 0.076, rzb: 0.09, cz: -0.012 }, { y: 1.6, rx: 0.075, rzf: 0.062, rzb: 0.072, cz: -8e-3 }, { y: 1.66, rx: 0.066, rzf: 0.05, rzb: 0.064, cz: -4e-3 }, { y: 1.7, rx: 0.06, rzf: 0.04, rzb: 0.058, cz: -0.01 }]), r2 = (e5, t3 = 1) => {
    e5.computeNormals();
    for (let n3 of [1, -1]) {
      e5.bulge([n3 * 0.082, 1.395, 0.145], [0.085, 0.058, 0.06], 0.028 * t3), e5.bulge([n3 * 0.16, 1.3, -0.03], [0.085, 0.12, 0.08], 0.014 * t3), e5.bulge([n3 * 0.095, 1.535, -0.04], [0.07, 0.05, 0.06], 0.018 * t3), e5.bulge([n3 * 0.1, 1.38, -0.13], [0.06, 0.06, 0.05], 0.01 * t3), e5.bulge([n3 * 0.14, 1.1, 0.06], [0.05, 0.06, 0.05], 0.01 * t3);
      for (let r3 = 0; r3 < 3; r3 += 1) e5.bulge([n3 * 0.033, 1.13 + r3 * 0.062, 0.13], [0.027, 0.026, 0.03], 0.011 * t3), e5.bulge([n3 * 0.16, 1.21 + r3 * 0.045, 0.07], [0.022, 0.016, 0.03], 5e-3 * t3);
    }
    return e5.bulge([0, 1.25, 0.14], [0.01, 0.18, 0.03], -4e-3 * t3), e5.computeNormals();
  }, i2 = [0, t2.crown + 0.02, t2.center[2] - 0.035], a2 = new fx(ux(e4, [{ name: `hair_1`, parent: `head`, pos: [0, t2.crown + 0.02, t2.center[2] - 0.06] }, { name: `hair_2`, parent: `hair_1`, pos: [0, t2.crown - 0.07, t2.center[2] - 0.15] }, { name: `beard_1`, parent: `head`, pos: [0, t2.base[1] - 0.03, t2.mouth[2] - 0.02] }, { name: `kiltF_1`, parent: `hips`, pos: n2.point(0, 1, 0.02) }, { name: `kiltF_2`, parent: `kiltF_1`, pos: [0, 0.78, n2.point(0, 0.8, 0.07)[2]] }, { name: `kiltB_1`, parent: `hips`, pos: n2.point(Math.PI, 1, 0.02) }, { name: `kiltB_2`, parent: `kiltB_1`, pos: [0, 0.78, n2.point(Math.PI, 0.8, 0.07)[2]] }, { name: `kiltL_1`, parent: `hips`, pos: n2.point(Math.PI / 2, 1, 0.02) }, { name: `kiltR_1`, parent: `hips`, pos: n2.point(-Math.PI / 2, 1, 0.02) }])), o2 = new H_(), s2 = new P(Zx.paint), c2 = yx(t2, Zx.skin, { lip: `#7e4636`, shadow: `#3a2014`, shadowK: 0.5, blush: 0.05, lipK: 0.45, paint: (e5, n3) => {
    let r3 = Math.abs(e5.y - (t2.eyes[0][1] + 2e-3)) < 0.013 && e5.z > t2.center[2] + 0.02, i3 = Math.abs(e5.x - 0.022) < 6e-3 && e5.y < t2.eyes[0][1] && e5.y > t2.mouth[1] && e5.z > t2.center[2] + 0.04;
    (r3 || i3) && n3.lerp(s2, 0.85);
  } });
  o2.add(t2.geo, { bone: `head`, color: Zx.skin, paint: c2, rough: 0.55, detail: B.SKIN, wear: 0.25 }), o2.add(Dx(t2, 6), { bone: `head`, color: `#b0a49a`, paint: Ox(t2, new P(`#b0a49a`), new P(`#5a4a2a`)), rough: 0.12, detail: B.GEM, ao: 0.5 });
  let l2 = Ex(t2, 0.9);
  o2.add(l2.upper, { bone: `head`, color: `#2a170e`, rough: 0.6, detail: B.HAIR }), o2.add(l2.lower, { bone: `head`, color: Zx.skinDark, rough: 0.55, detail: B.SKIN }), o2.add(jx(t2, 1.6, 0.6, 1), { bone: `head`, color: Zx.hair, rough: 0.6, detail: B.HAIR });
  for (let e5 = 0; e5 < 2; e5 += 1) o2.add(kx(t2.ears[e5], e5, 1.05), { bone: `head`, color: Zx.skin, rough: 0.55, detail: B.SKIN });
  let u2 = { bone: `head`, color: Zx.hair, rough: 0.5, detail: B.HAIR, zone: z_.HAIR, mottle: 0.12, mottleScale: 30 };
  o2.add(Rx(t2, { thick: 6e-3, front: 0.05, temple: 0.02, side: -5e-3, nape: 0.06, volume: 6e-3, segs: 16, rings: 6 }), u2);
  let d2 = H(0.042, 0.04, 0.046, 9, 6);
  d2.translate(i2[0], i2[1], i2[2]), o2.add(d2, { ...u2, zone: z_.HAIR }), o2.add(av(0.022, 65e-4, 8, 3).rotateX(0.9).translate(0, i2[1] + 0.012, i2[2] - 0.03), { ...Qx, bone: `head`, zone: z_.HAIR });
  let f2 = [[0, i2[1] + 0.02, i2[2] - 0.035], [0, i2[1] + 0.01, i2[2] - 0.1], [5e-3, i2[1] - 0.07, i2[2] - 0.15], [-0.01, i2[1] - 0.17, i2[2] - 0.16]];
  o2.add(Bx(f2, 0.034, 0.024, 6, 8, 0.6, [0, 0.6, 1]), { ...u2, zone: z_.HAIR, bone: void 0, skin: Fv([`head`, `hair_1`, `hair_2`], [i2, [0, t2.crown + 0.02, t2.center[2] - 0.06], [0, t2.crown - 0.07, t2.center[2] - 0.15]], 0.7) });
  for (let e5 of [1, -1]) {
    let t3 = [[e5 * 0.02, i2[1] + 0.01, i2[2] - 0.02], [e5 * 0.06, i2[1] - 0.04, i2[2] - 0.08], [e5 * 0.07, i2[1] - 0.12, i2[2] - 0.1]];
    o2.add(Bx(t3, 0.02, 8e-3, 4, 5, 0.8, [e5, 0.5, -0.3]), { ...u2, zone: z_.HAIR, bone: void 0, skin: () => [`head`, `hair_1`, 0.6] });
  }
  let p2 = { bone: `head`, color: Zx.hair, rough: 0.55, detail: B.HAIR, mottle: 0.15, mottleScale: 40 }, m2 = t2.eyes[0][1], h2 = Mv(t2.shape, { th0: -1.72, th1: 1.72, nu: 12, nv: 6, yBot: (e5) => R(t2.base[1] + 4e-3, m2 - 0.075, z(0.7, 1.7, Math.abs(e5))), yTop: (e5) => {
    let n3 = Math.abs(e5);
    return n3 < 0.42 ? t2.mouth[1] - 0.012 + n3 * 0.01 : R(t2.mouth[1] - 6e-3, m2 - 0.03, z(0.42, 1.05, n3));
  }, off: (e5, t3) => 3e-3 + (1 - t3) * 0.016 * (1 - 0.5 * z(1.1, 1.72, Math.abs(e5))), shape: (e5, t3, n3) => {
    let r3 = Math.abs(t3);
    if (n3 < 0.45 && r3 < 1) {
      let t4 = (0.45 - n3) / 0.45;
      e5.y -= t4 * t4 * 0.075 * (1 - r3), e5.z += t4 * 0.018 * (1 - r3);
    }
  } });
  h2.noise(3e-3, 70, 9).computeNormals(), o2.add(h2, { ...p2, name: `beard` });
  for (let e5 of [1, -1]) o2.add(Bx([[e5 * 4e-3, t2.mouth[1] + 0.016, t2.mouth[2] + 4e-3], [e5 * 0.026, t2.mouth[1] + 6e-3, t2.mouth[2] - 6e-3], [e5 * 0.036, t2.mouth[1] - 0.02, t2.mouth[2] - 0.016]], 0.012, 6e-3, 4, 5, 0.6, [0, 0.3, 1]), p2);
  let g2 = [0, t2.base[1] - 0.03, t2.mouth[2] - 0.02];
  for (let e5 of [1, -1]) {
    let n3 = [[e5 * 0.014, t2.base[1] - 0.04, t2.mouth[2] - 0.02], [e5 * 0.018, t2.base[1] - 0.085, t2.mouth[2] - 0.022], [e5 * 0.016, t2.base[1] - 0.13, t2.mouth[2] - 0.03]];
    o2.add(zx(n3, 0.011, 4, 4), { ...p2, bone: void 0, skin: (e6) => [`head`, `beard_1`, z(g2[1] + 0.02, g2[1] - 0.04, e6.p.y)] }), o2.add(X_([[8e-3, 0], [0.011, 4e-3], [0.011, 0.014], [8e-3, 0.018]], 6).translate(e5 * 0.016, t2.base[1] - 0.12, t2.mouth[2] - 0.03), { ...$x, bone: `beard_1` });
  }
  let _2 = r2(n2.loft(0.98, 1.7, 18, 12, 0));
  o2.add(_2, { color: Zx.skin, paint: (e5, t3) => {
    let n3 = e5.p.x, r3 = e5.p.y;
    if (e5.p.z > 0.06 && n3 > 0.035 && n3 < 0.15) for (let e6 = 0; e6 < 3; e6 += 1) {
      let i3 = 1.43 - e6 * 0.04 - (n3 - 0.04) * 0.35;
      Math.abs(r3 - i3) < 9e-3 && t3.lerp(s2, 0.85);
    }
    if (e5.p.z > 0.05) {
      let e6 = Math.abs(n3);
      e6 < 0.012 && r3 > 1.06 && r3 < 1.33 && t3.multiplyScalar(0.8), e6 < 0.062 && (Math.abs(r3 - 1.161) < 7e-3 || Math.abs(r3 - 1.223) < 7e-3) && t3.multiplyScalar(0.86);
      let i3 = 1.338 + (e6 - 0.08) * (e6 - 0.08) * 1.6;
      e6 < 0.17 && Math.abs(r3 - i3) < 0.012 && t3.multiplyScalar(0.8), e6 > 0.03 && e6 < 0.15 && r3 > 1.37 && r3 < 1.44 && t3.multiplyScalar(1.07);
    }
    Math.abs(n3) > 0.12 && r3 > 1.06 && r3 < 1.3 && e5.p.z > -0.02 && t3.multiplyScalar(0.9);
  }, rough: 0.48, detail: B.SKIN, skin: (e5) => {
    let t3 = e5.p.y;
    return t3 > 1.58 ? [`neck`, `chest`, z(1.62, 1.58, t3)] : [`chest`, `spine`, z(1.24, 1.12, t3)];
  }, wear: 0.3, mottle: 0.05 });
  let v2 = { color: Zx.leather, rough: 0.6, detail: B.LEATHER, wear: 0.5, zone: z_.ARMOR };
  for (let e5 of [1, -1]) {
    let t3 = [];
    for (let r3 = 0; r3 <= 14; r3 += 1) {
      let i4 = r3 / 14, a4 = R(e5 * 0.95, -e5 * 0.55, i4), o3 = R(1.51, 1.06, i4), s3 = n2.point(a4, o3, 9e-3);
      t3.push(s3);
    }
    let i3 = r2(V(t3, [55e-4, 0.024], 4, 22, { up: [0, 0, 1] }), 1);
    o2.add(i3, { ...v2, skin: (e6) => [`chest`, `spine`, z(1.24, 1.12, e6.p.y)] });
    let a3 = [];
    for (let t4 = 0; t4 <= 10; t4 += 1) {
      let r3 = t4 / 10;
      a3.push(n2.point(R(e5 * 0.95, Math.PI - e5 * 0.6, r3 * 0.5 + 0.5 * r3 * r3), R(1.51, 1.12, r3), 9e-3));
    }
    o2.add(V(a3, [55e-4, 0.024], 4, 14, { up: [0, 0, 1] }), { ...v2, skin: (e6) => [`chest`, `spine`, z(1.24, 1.12, e6.p.y)] });
  }
  let y2 = n2.point(0, 1.29, 0.02);
  o2.add(av(0.024, 6e-3, 8, 3).rotateX(Math.PI / 2).translate(y2[0], y2[1], y2[2] + 4e-3), { ...Qx, bone: `chest` });
  let b2 = { color: Zx.fur, rough: 0.95, detail: B.FUR, zone: z_.BODY, mottle: 0.2, mottleScale: 18 }, x2 = i_(11), S2 = new cv();
  {
    let e5 = [];
    for (let t4 = 0; t4 <= 16; t4 += 1) {
      let r3 = t4 / 16 * c_, i3 = Math.max(0, -Math.cos(r3)), a3 = n2.point(r3, 1.5 - i3 * 0.03 + Math.max(0, Math.cos(r3)) * -0.035, 0.035 + i3 * 0.03);
      e5.push(a3);
    }
    let t3 = V(e5, (e6) => {
      let t4 = e6 * c_, n3 = Math.max(0, -Math.cos(t4)), r3 = Math.abs(Math.sin(t4));
      return [0.042 + n3 * 0.02 + r3 * 0.012, 0.05 + n3 * 0.025 + r3 * 0.01];
    }, 6, 16, { up: [0, 1, 0], tension: 0.5 });
    t3.noise(0.012, 22, 4, 2).computeNormals(), S2.merge(t3);
  }
  for (let e5 = 0; e5 < 9; e5 += 1) {
    let t3 = Math.PI * 0.32 + e5 / 8 * Math.PI * 1.36 + (x2() - 0.5) * 0.12, r3 = Math.max(0, -Math.cos(t3)), i3 = iv(n2.point(t3, 1.47 - r3 * 0.05, 0.06 + r3 * 0.03), [Math.sin(t3) * 0.4, -1, Math.cos(t3) * 0.4], 0.03 + x2() * 0.012, 0.07 + x2() * 0.05 + r3 * 0.06, 4, 0.2);
    i3.noise(5e-3, 60, e5).computeNormals(), S2.merge(i3);
  }
  for (let t3 of [1, -1]) {
    let n3 = Ux(e4.upperArmL, t3 === 1 ? 0 : 1), r3 = H(0.078, 0.04, 0.08, 6, 4);
    r3.deform((e5) => {
      e5.y -= Math.max(0, Math.abs(e5.x) / 0.078 - 0.4) * 0.025;
    }), r3.translate(n3[0] - t3 * 0.01, n3[1] + 0.03, n3[2] - 5e-3), r3.noise(0.01, 30, 3).computeNormals(), S2.merge(r3);
  }
  o2.add(S2, { ...b2, name: `mantle`, skin: (e5) => {
    let t3 = Math.abs(e5.p.x);
    return t3 > 0.16 ? [`chest`, e5.p.x > 0 ? `shoulder_L` : `shoulder_R`, z(0.16, 0.22, t3) * 0.75] : [`chest`, `chest`, 0];
  } });
  let C2 = n2.point(0.35, 1.52, 0.06);
  o2.add(X_([[0, -0.016], [0.016, -0.01], [0.018, 6e-3], [0.01, 0.016], [0, 0.018]], 8, { sz: 0.6 }).rotateX(Math.PI / 2).translate(C2[0], C2[1], C2[2]), { ...$x, bone: `chest` });
  let w2 = Nv(n2, 1.03, 0.085, 0.018, 18, { offset: 0.012 });
  o2.add(w2, { bone: `hips`, color: Zx.leather, rough: 0.55, detail: B.LEATHER, wear: 0.5, zone: z_.ARMOR });
  let T2 = n2.point(0, 1.03, 0.032);
  o2.add(X_([[0, -0.012], [0.036, -0.01], [0.042, 0], [0.034, 0.01], [0, 0.014]], 12, { sz: 0.35 }).rotateX(Math.PI / 2).translate(T2[0], T2[1], T2[2]), { ...$x, bone: `hips` }), o2.add(av(0.02, 45e-4, 10, 4).rotateX(Math.PI / 2).translate(T2[0], T2[1], T2[2] + 8e-3), { ...Qx, bone: `hips` });
  let E2 = [];
  E2.push([-0.34, 0.34, `kiltF_1`, `kiltF_2`, 10]), E2.push([Math.PI - 0.36, Math.PI + 0.36, `kiltB_1`, `kiltB_2`, 11]);
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let t3 = 0.44 + e5 * 0.565;
    E2.push([t3, t3 + 0.5, `kiltL_1`, `kiltL_1`, 12]), E2.push([-t3 - 0.5, -t3, `kiltR_1`, `kiltR_1`, 13]);
  }
  let D2 = new cv(), O2 = (e5) => (t3) => e5 === 10 ? Iv(`hips`, `kiltF_1`, `kiltF_2`, 1, 0.82, 0.62)(t3) : e5 === 11 ? Iv(`hips`, `kiltB_1`, `kiltB_2`, 1, 0.82, 0.62)(t3) : [`hips`, e5 === 12 ? `kiltL_1` : `kiltR_1`, z(1, 0.75, t3.p.y)];
  E2.forEach(([e5, t3, , , r3], i3) => {
    let a3 = 1.02, s3 = r3 === 10 || r3 === 11, c3 = s3 ? 0.57 : 0.63 + i3 % 2 * 0.02, l3 = rv(s3 ? 2 : 1, 4, (r4, i4) => {
      let o3 = R(e5, t3, r4), l4 = R(a3, c3, i4), u4 = 0.024 + i4 * 0.055 + (s3 ? 4e-3 : 0), d3 = n2.point(o3, Math.max(l4, 0.8), u4);
      return [d3[0], l4, d3[2]];
    }, 0.011, (e6) => new N(e6.x, 0, e6.z).normalize());
    l3.setTag(0), o2.add(l3, { name: `kilt`, color: Zx.leather, paint: (e6, t4) => {
      (e6.v > 0.88 || e6.u < 0.08 || e6.u > 0.92) && t4.set(Zx.leatherLight), t4.multiplyScalar(0.9 + i3 * 37 % 10 * 0.025);
    }, rough: 0.6, detail: B.LEATHER, wear: 0.6, zone: z_.ARMOR, skin: O2(r3) });
    let u3 = s3 ? 3 : 1;
    for (let i4 = 0; i4 < u3; i4 += 1) {
      let o3 = (i4 + 0.5) / u3, l4 = s3 ? 0.55 : 0.6, d3 = R(e5, t3, o3), f3 = R(a3, c3, l4), p3 = n2.point(d3, Math.max(f3, 0.8), 0.024 + l4 * 0.055 + 0.011), m3 = H(75e-4, 75e-4, 5e-3, 4, 3);
      m3.rotateY(Math.atan2(p3[0], p3[2])).translate(p3[0], f3, p3[2]), m3.setTag(r3), D2.merge(m3);
    }
  }), o2.add(D2, { ...Qx, name: `studs`, rough: 0.32, zone: z_.ARMOR, skin: (e5) => O2(e5.tag)(e5) }), o2.add(n2.loft(0.78, 1, 10, 2, 6e-3), { bone: `hips`, color: `#2b1e14`, rough: 0.85, detail: B.CLOTH, ao: 0.7 });
  let k2 = (e5, t3, n3) => ({ color: t3, rough: 0.5, metal: e5 === z_.TIER_LEATHER ? 0.1 : 0.9, detail: n3, wear: 0.45, zone: e5 }), A2 = (e5) => [`chest`, `spine`, z(1.24, 1.12, e5.p.y)], ee2 = r2(n2.loft(1.05, 1.5, 14, 6, 0.025), 1);
  o2.add(ee2, { ...k2(z_.TIER_CHAIN, `#7c8086`, B.CHAIN), name: `tierShirt`, skin: A2 });
  let te2 = rv(8, 5, (e5, t3) => {
    let r3 = R(-1.25, 1.25, e5), i3 = R(1.1, 1.48 - (Math.abs(r3) / 1.25) ** 2 * 0.07, t3);
    return n2.point(r3, i3, 0.036);
  }, 9e-3, (e5) => new N(e5.x, 0, e5.z).normalize());
  o2.add(r2(te2, 1), { ...k2(z_.TIER_PLATE, `#9aa0a8`, B.METAL), colors: { 1: `#2a2420`, 2: `#5d6168` }, name: `tierCuirass`, skin: A2 });
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = t3 === 0 ? 1 : -1, i3 = Ux(e4.upperArmL, t3), a3 = t3 === 0 ? z_.TIER_LEATHER : z_.TIER_PLATE;
    for (let e5 = 0; e5 < (t3 === 0 ? 2 : 1); e5 += 1) {
      let s3 = 0.098 - e5 * 0.012, c3 = X_([[s3 * 1.02, -s3 * 0.35], [s3, 0], [s3 * 0.88, s3 * 0.3], [s3 * 0.55, s3 * 0.55], [0, s3 * 0.62]], 10, { sz: 0.95 });
      c3.rotateZ(-r3 * 0.55).translate(i3[0] + r3 * (0.022 + e5 * 0.012), i3[1] + 0.05 - e5 * 0.045, i3[2]), o2.add(c3, { ...k2(a3, t3 === 0 ? Zx.leatherLight : `#9aa0a8`, t3 === 0 ? B.LEATHER : B.METAL), colors: { 1: `#2a1a10` }, name: `tierPauldron`, skin: () => [`shoulder_${n3}`, `upperArm_${n3}`, 0.45] });
    }
  }
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = Nx(e4, t3, { radius: (e5, t4) => {
      let n4 = R(0.092, 0.06, z(0.05, t4, e5)) * (1 + 0.08 * Math.exp(-(((e5 - 0.35) / 0.12) ** 2))), r4 = e5 > t4 ? 0.054 + Math.sin((e5 - t4) / (1 - t4) * Math.PI) * 0.011 - z(0.8, 1, e5) * 0.012 : n4;
      return [r4, r4 * 0.95];
    }, endAt: 0.75, segs: 6, rings: 8 });
    o2.add(r3.geo, { color: Zx.skin, rough: 0.5, detail: B.SKIN, skin: r3.skin, wear: 0.4 });
    let i3 = Ux(e4.ankleL, t3);
    o2.add(Fx(e4, t3, { width: 1.12, height: 1.15, toeH: 1.2, segs: 8, rings: 7 }), { color: Zx.boot, rough: 0.62, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`foot_${n3}`, `toe_${n3}`, z(i3[2] + 0.11, i3[2] + 0.16, e5.p.z)], wear: 0.7 }), o2.add(Ix(e4, t3, 0.4, 0.048, 0.058, 8e-3, 10), { color: Zx.boot, rough: 0.62, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`shin_${n3}`, `foot_${n3}`, z(0.16, 0.1, e5.p.y)], wear: 0.6 });
    let a3 = X_([[0.062, 0.36], [0.078, 0.38], [0.082, 0.41], [0.07, 0.445], [0.05, 0.455]], 8);
    a3.noise(8e-3, 40, 5 + t3).computeNormals(), a3.translate(i3[0], 0, Ux(e4.kneeL, t3)[2] * 0.5), o2.add(a3, { ...b2, bone: `shin_${n3}` }), o2.add(av(0.054, 55e-4, 8, 3).translate(i3[0], 0.2, i3[2]), { ...Qx, bone: `shin_${n3}`, zone: z_.BOOT });
  }
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = Mx(e4, t3, { radius: (e5, t4) => {
      if (e5 < t4) {
        let n5 = 1 + 0.22 * Math.exp(-(((e5 - 0.1) / 0.09) ** 2)), r5 = 1 + 0.16 * Math.exp(-(((e5 - 0.5) / 0.14) ** 2)), i4 = R(0.056, 0.045, z(0.1, t4, e5)) * n5 * r5;
        return [i4, i4 * 0.92];
      }
      let n4 = (e5 - t4) / (1 - t4), r4 = R(0.05, 0.033, z(0.2, 1, n4)) * (1 + 0.14 * Math.exp(-(((n4 - 0.22) / 0.16) ** 2)));
      return [r4 * 0.9, r4];
    }, topIn: 0.055, topUp: 0.02, segs: 8, rings: 11 });
    o2.add(r3.geo, { color: Zx.skin, rough: 0.48, detail: B.SKIN, skin: r3.skin, wear: 0.3 });
    let i3 = Px(e4, t3, { scale: 1.12, fingerR: 1.15, palmW: 1.1 });
    o2.add(i3.palm, { bone: `hand_${n3}`, color: Zx.skin, rough: 0.55, detail: B.SKIN }), o2.add(i3.fingers, { bone: `fingers_${n3}`, color: Zx.skin, rough: 0.55, detail: B.SKIN });
    let a3 = Ux(e4.elbowL, t3), s3 = Ux(e4.wristL, t3), c3 = [0, 0.33, 0.66, 1].map((e5) => [R(s3[0], a3[0], e5 * 0.62), R(s3[1] - 4e-3, a3[1], e5 * 0.62), R(s3[2], a3[2], e5 * 0.62)]);
    o2.add(V(c3, (e5) => {
      let t4 = R(0.038, 0.05, e5);
      return [t4, t4 * 1.05];
    }, 8, 5), { bone: `foreArm_${n3}`, color: Zx.leather, rough: 0.58, detail: B.LEATHER, zone: z_.GLOVE, wear: 0.6 });
    for (let e5 of [0.12, 0.55]) {
      let t4 = [R(s3[0], a3[0], e5 * 0.62), R(s3[1], a3[1], e5 * 0.62), R(s3[2], a3[2], e5 * 0.62)];
      o2.add(av(R(0.04, 0.051, e5), 55e-4, 8, 3).translate(t4[0], t4[1], t4[2]), { ...Qx, bone: `foreArm_${n3}`, zone: z_.GLOVE });
    }
    let l3 = Ux(e4.upperArmL, t3);
    o2.add(av(0.062, 6e-3, 8, 3).translate(R(l3[0], a3[0], 0.45), R(l3[1], a3[1], 0.45), l3[2]), { ...$x, bone: `upperArm_${n3}` });
  }
  let ne2 = [{ id: `topknot`, bones: [`hair_1`, `hair_2`], gravity: 0.6, inertia: 0.03, drag: 0.08, stiffness: 55, damping: 7, xMin: -0.4, xMax: 1.2, sway: 0.03 }, { id: `beard`, bones: [`beard_1`], gravity: 0.7, inertia: 0.02, drag: 0.03, stiffness: 70, damping: 8, xMin: -0.6, xMax: 0.6, sway: 0.02 }, { id: `kiltF`, bones: [`kiltF_1`, `kiltF_2`], gravity: 0.5, inertia: 0.012, drag: 0.03, stiffness: 120, damping: 14, xMin: -1, xMax: 0.15, falloff: 0.8, sway: 0.01 }, { id: `kiltB`, bones: [`kiltB_1`, `kiltB_2`], gravity: 0.5, inertia: 0.012, drag: 0.03, stiffness: 120, damping: 14, xMin: -0.15, xMax: 1, falloff: 0.8, sway: 0.01 }, { id: `kiltL`, bones: [`kiltL_1`], gravity: 0.5, inertia: 0.01, drag: 0.02, stiffness: 140, damping: 15, zMin: -0.1, zMax: 0.6 }, { id: `kiltR`, bones: [`kiltR_1`], gravity: 0.5, inertia: 0.01, drag: 0.02, stiffness: 140, damping: 15, zMin: -0.6, zMax: 0.1 }], re2 = [{ id: `kiltF`, side: -1, mode: `front` }, { id: `kiltB`, side: -1, mode: `back` }, { id: `kiltL`, side: 0, mode: `side` }, { id: `kiltR`, side: 1, mode: `side` }];
  return hx({ key: `hero:barbarian`, def: a2, mb: o2, height: 1.9, radius: 0.38, sockets: _x(e4, { mouthZ: 0.11 }), springs: ne2, contacts: vx(1.15), animator: (t3) => new sx(new ix(t3, e4, { kind: `barbarian`, gait: `heavy`, weapon: `oneHand`, walkStride: 1.7, runStride: 2.7, crouch: 0.05, runCrouch: 0.1, bob: 0.024, runBob: 0.05, footSpread: 0.05, armOut: 0.2, elbow: 0.35, armSwing: 0.4, runArmSwing: 0.7, pelvisYaw: 0.12, lean: 0.07, runLean: 0.24, hunch: 0.08, mass: 1.4, tauntStyle: `roar`, castStyle: `arcane`, specialStyle: `roar`, fingersOpen: 0.5 }), t3, re2), equip: { weapons: true, offHand: true, helm: true, helmScale: 1.08, helmOffset: [t2.center[0] - e4.head[0], t2.center[1] - e4.head[1], t2.center[2] - e4.head[2]] }, defaultEquipment: { mainHand: `axe` } });
}
var Zx, Qx, $x, eS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), wx(), Wx(), Zx = { skin: `#b77c58`, skinDark: `#8e5a3e`, paint: `#24508f`, hair: `#3d1d10`, leather: `#3c2616`, leatherLight: `#5a3a22`, fur: `#4e3b2a`, furTip: `#8a7358`, iron: `#5d6168`, bronze: `#9a6a36`, boot: `#2f1f14` }, Qx = { color: Zx.iron, rough: 0.48, metal: 0.92, detail: B.METAL, wear: 0.45 }, $x = { color: Zx.bronze, rough: 0.36, metal: 1, detail: B.METAL, wear: 0.3 };
}));
function tS(e4, t2, n2, r2, i2 = `hips`, a2 = 1.12) {
  let o2 = [];
  for (let s2 of t2) {
    let t3 = (s2.th0 + s2.th1) / 2, c2 = e4.point(t3, n2 - 0.02, 0.02), l2 = e4.point(t3, Math.max(e4.yMin, Math.min(r2 + 0.25, e4.yMax)), 0);
    o2.push({ name: `${s2.name}_1`, parent: i2, pos: c2 }), o2.push({ name: `${s2.name}_2`, parent: `${s2.name}_1`, pos: [l2[0] * a2, r2, l2[2] * a2] });
  }
  return o2;
}
function nS(e4, t2, n2, r2, i2) {
  let a2 = r2.trim ? new P(r2.trim) : null, o2 = r2.trimV ?? 0.94, s2 = r2.trimU ?? 0.03;
  for (let c2 of n2) {
    let n3 = rv(r2.nu ?? 6, r2.nv ?? 9, (e5, n4) => {
      let i3 = R(c2.th0, c2.th1, e5), a3 = R(r2.yTop, r2.yBot, n4) + (r2.ragged ? (Math.sin(e5 * 23.7 + c2.th0 * 5) * 0.5 + Math.sin(e5 * 61.1) * 0.5) * r2.ragged * z(0.75, 1, n4) : 0), o3 = Math.sin(e5 * Math.PI * (r2.folds ?? 3) + 0.4 + c2.th0) * (5e-3 + (r2.foldAmp ?? 0.013) * n4), s3 = (r2.topOff ?? 0.013) + (c2.extra ?? 0) + n4 ** 1.35 * r2.flare + o3, l3 = t2.point(i3, Math.max(Math.min(a3, t2.yMax), t2.yMin), s3);
      return [l3[0], a3, l3[2]];
    }, r2.thick ?? 7e-3, (e5) => new N(e5.x, 0, e5.z).normalize()), l2 = (e5) => a2 && e5.tag !== 1 && (e5.v > o2 || e5.u < s2 || e5.u > 1 - s2);
    e4.add(n3, { name: r2.name ?? `robe`, color: r2.color, colors: { 1: r2.lining, 2: r2.trim ?? r2.color }, paint: (e5, t3) => {
      l2(e5) ? t3.copy(a2) : r2.paint && r2.paint(e5, t3);
    }, pbr: r2.trim ? (e5, t3) => {
      l2(e5) && (t3[0] = r2.trimPbr?.[0] ?? 0.5, t3[1] = r2.trimPbr?.[1] ?? 0);
    } : void 0, rough: r2.rough ?? 0.7, detail: r2.detail ?? B.CLOTH, wear: r2.wear ?? 0.4, zone: r2.zone ?? 0, skin: Iv(r2.anchor ?? `hips`, `${c2.name}_1`, `${c2.name}_2`, r2.yTop - 0.04, i2 + 0.04, R(i2, r2.yBot, 0.6)) });
  }
}
function rS(e4, t2 = {}) {
  return e4.map((e5) => {
    let n2 = Math.cos((e5.th0 + e5.th1) / 2) > 0.2, r2 = Math.cos((e5.th0 + e5.th1) / 2) < -0.2;
    return { id: e5.name, bones: [`${e5.name}_1`, `${e5.name}_2`], gravity: t2.gravity ?? 0.55, inertia: 0.012, drag: 0.035, stiffness: t2.stiffness ?? 110, damping: t2.damping ?? 13, xMin: n2 ? -1 : r2 ? -0.2 : -0.5, xMax: n2 ? 0.2 : r2 ? 1 : 0.5, zMin: -0.45, zMax: 0.45, falloff: 0.8, sway: t2.sway ?? 0.015 };
  });
}
function iS(e4) {
  return e4.map((e5) => {
    let t2 = (e5.th0 + e5.th1) / 2, n2 = Math.cos(t2), r2 = Math.sin(t2), i2 = Math.abs(r2) < 0.25 ? -1 : r2 > 0 ? 0 : 1;
    return { id: e5.name, side: i2, mode: n2 > 0.2 ? `front` : n2 < -0.2 ? `back` : `side` };
  });
}
var aS = t((() => {
  Ed(), U_(), zv(), lv(), __();
}));
function oS() {
  let e4 = lx(dx(1.92, { shoulderX: 0.188, hipWidth: 0.09, clavX: 0.034, shoulderY: 1.545, armOut: 0.06, elbow: 1.215, wrist: 0.935, hip: 0.99, knee: 0.54, footLen: 0.27, chest: 1.36, spine: 1.12, neck: 1.59, head: 1.69 })), t2 = Tx({ segs: 17, base: [0, 1.672, 0.02], scale: 0.99, jaw: 0.92, chin: 1.15, brow: 1.2, nose: 1.15, cheek: 1.35, gaunt: 1.1, lips: 0.6, width: 0.95, depth: 1.03, height: 1.04, socket: 1.5 }), n2 = new Lv([{ y: 0.8, rx: 0.15, rzf: 0.11, rzb: 0.12 }, { y: 0.95, rx: 0.156, rzf: 0.11, rzb: 0.122 }, { y: 1.05, rx: 0.142, rzf: 0.1, rzb: 0.106 }, { y: 1.15, rx: 0.14, rzf: 0.099, rzb: 0.1, cz: 4e-3 }, { y: 1.27, rx: 0.154, rzf: 0.105, rzb: 0.104, cz: 8e-3 }, { y: 1.38, rx: 0.17, rzf: 0.11, rzb: 0.106, cz: 8e-3 }, { y: 1.47, rx: 0.186, rzf: 0.102, rzb: 0.102, cz: 4e-3 }, { y: 1.535, rx: 0.17, rzf: 0.082, rzb: 0.088, cz: -6e-3 }, { y: 1.575, rx: 0.095, rzf: 0.062, rzb: 0.07, cz: -0.01 }, { y: 1.62, rx: 0.056, rzf: 0.046, rzb: 0.054, cz: -8e-3 }, { y: 1.7, rx: 0.05, rzf: 0.036, rzb: 0.05, cz: -0.012 }]), r2 = [{ name: `robeFL`, th0: 0.06, th1: 1.55 }, { name: `robeFR`, th0: -1.55, th1: -0.06 }, { name: `robeBL`, th0: 1.55, th1: 3.2, extra: 4e-3 }, { name: `robeBR`, th0: -3.2, th1: -1.55 }], i2 = 1.04, a2 = 0.6, o2 = (e5) => [[e5 * (t2.rx + 6e-3), t2.eyes[0][1] - 5e-3, t2.center[2] + 0.02], [e5 * 0.105, 1.5, 0.07], [e5 * 0.11, 1.38, 0.1]], s2 = new fx(ux(e4, [...tS(n2, r2, i2, a2), { name: `lockL_1`, parent: `head`, pos: o2(1)[0] }, { name: `lockL_2`, parent: `lockL_1`, pos: o2(1)[1] }, { name: `lockR_1`, parent: `head`, pos: o2(-1)[0] }, { name: `lockR_2`, parent: `lockR_1`, pos: o2(-1)[1] }])), c2 = new H_(), l2 = new P(sS.teal);
  c2.add(t2.geo, { bone: `head`, color: sS.skin, paint: yx(t2, sS.skin, { lip: `#6a4a58`, shadow: sS.skinShadow, shadowK: 0.78, blush: 0, lipK: 0.6, paint: (e5, n3) => {
    Math.abs(e5.x) < 35e-4 && e5.y > t2.browY + 8e-3 && e5.y < t2.browY + 0.04 && e5.z > t2.center[2] + 0.05 && n3.lerp(l2, 0.9);
    for (let r3 of [1, -1]) {
      let i3 = Math.hypot((e5.x - r3 * 0.05) / 0.025, (e5.y - (t2.eyes[0][1] - 0.05)) / 0.025);
      e5.z > t2.center[2] && n3.multiplyScalar(1 - Math.max(0, 1 - i3) * 0.22);
    }
  } }), rough: 0.55, detail: B.SKIN, wear: 0.12 }), c2.add(Dx(t2, 6), { bone: `head`, color: `#9aa6a4`, paint: Ox(t2, new P(`#9aa6a4`), new P(`#5fe0cc`)), rough: 0.15, emit: 0.55, detail: B.GEM, ao: 0.3 });
  let u2 = Ex(t2, 1);
  c2.add(u2.upper, { bone: `head`, color: `#1a1418`, rough: 0.6, detail: B.HAIR }), c2.add(u2.lower, { bone: `head`, color: `#5a4652`, rough: 0.55, detail: B.SKIN }), c2.add(jx(t2, 0.8, 0.5, 0.6), { bone: `head`, color: `#bdb8b0`, rough: 0.6, detail: B.HAIR });
  for (let e5 = 0; e5 < 2; e5 += 1) c2.add(kx(t2.ears[e5], e5, 1, { point: 0.25 }), { bone: `head`, color: sS.skin, rough: 0.55, detail: B.SKIN });
  let d2 = { bone: `head`, color: sS.hair, rough: 0.38, detail: B.HAIR, zone: z_.HAIR, mottle: 0.08, mottleScale: 30 };
  c2.add(Rx(t2, { thick: 8e-3, front: 0.052, temple: 0.015, side: -0.04, nape: 0.12, volume: 0.012, part: 6e-3, overEars: true, segs: 18, rings: 7 }), d2), c2.add(rv(4, 4, (e5, n3) => {
    let r3 = R(-1.9, 1.9, e5) + Math.PI, i3 = R(t2.center[1], 1.53, n3), a3 = R(t2.rx + 0.012, 0.075, n3);
    return [Math.sin(r3) * a3, i3, t2.center[2] - 0.01 + Math.cos(r3) * R(t2.rz + 0.014, 0.08, n3)];
  }, 8e-3, (e5) => new N(e5.x, 0, e5.z - t2.center[2]).normalize()), { ...d2, zone: z_.HAIR, colors: { 1: `#a9a49a`, 2: sS.hair }, skin: Pv(`head`, `neck`, t2.center[1] - 0.06, 1.56) });
  for (let e5 of [1, -1]) {
    let n3 = e5 === 1 ? `L` : `R`, r3 = o2(e5), i3 = [[e5 * (t2.rx - 4e-3), t2.browY + 0.02, t2.center[2] + 0.045], [e5 * (t2.rx + 0.012), t2.eyes[0][1] - 0.02, t2.center[2] + 0.03], [e5 * 0.1, 1.56, 0.06], [e5 * 0.11, 1.45, 0.09], [e5 * 0.112, 1.34, 0.105]];
    c2.add(Bx(i3, 0.03, 9e-3, 5, 10, 0.55, [e5, 0, 0.35]), { ...d2, zone: z_.BODY, skin: (e6) => {
      let t3 = e6.p.y;
      return t3 > r3[0][1] - 0.02 ? [`head`, `lock${n3}_1`, z(r3[0][1] + 0.03, r3[0][1] - 0.02, t3)] : [`lock${n3}_1`, `lock${n3}_2`, z(r3[1][1] + 0.04, r3[1][1] - 0.05, t3)];
    } });
  }
  let f2 = { color: sS.robe, rough: 0.55, detail: B.CLOTH, wear: 0.35, zone: z_.ARMOR }, p2 = new P(sS.teal), m2 = Mv(n2, { nu: 22, nv: 9, yBot: () => 0.97, yTop: () => 1.6, off: (e5, t3) => 0.01 + (1 - t3) * 4e-3 });
  c2.add(m2, { ...f2, name: `robeUpper`, paint: (e5, t3) => {
    let n3 = Math.atan2(e5.p.x, e5.p.z);
    Math.abs(n3) < 0.05 && e5.p.z > 0 ? t3.copy(p2) : Math.abs(n3) < 0.09 && e5.p.z > 0 && t3.set(sS.robeHi);
  }, skin: (e5) => {
    let t3 = e5.p.y;
    return t3 > 1.57 ? [`chest`, `neck`, z(1.57, 1.6, t3) * 0.5] : [`chest`, `spine`, z(1.24, 1.12, t3)];
  } });
  let h2 = rv(12, 4, (e5, t3) => {
    let r3 = R(0.55, c_ - 0.55, e5), i3 = Math.max(0, -Math.cos(r3)), a3 = R(1.53, 1.69 + i3 * 0.09, t3), o3 = n2.point(r3, Math.min(a3, 1.6), 0.012 + t3 * t3 * (0.07 + i3 * 0.02));
    return [o3[0], a3, o3[2]];
  }, 8e-3, (e5) => new N(e5.x, 0, e5.z + 0.01).normalize());
  c2.add(h2, { ...f2, name: `collar`, colors: { 1: sS.tealDark, 2: sS.teal }, paint: (e5, t3) => {
    e5.tag === 0 && (e5.v > 0.88 || e5.u < 0.05 || e5.u > 0.95) && t3.copy(p2);
  }, zone: z_.BODY, skin: (e5) => [`chest`, `neck`, z(1.56, 1.78, e5.p.y) * 0.35] });
  let g2 = new cv();
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let t3 = 1.43 - e5 * 0.055;
    for (let r3 of [1, -1]) {
      let i3 = [];
      for (let a3 = 0; a3 <= 6; a3 += 1) {
        let o3 = a3 / 6;
        i3.push(n2.point(r3 * R(0.1, 1.35 - e5 * 0.05, o3), t3 - o3 * 0.05 - o3 * o3 * 0.02, 0.022 + Math.sin(o3 * Math.PI) * 6e-3));
      }
      g2.merge(V(i3, (e6) => [85e-4 * (1 - e6 * 0.4), 55e-4], 5, 8, { capStart: true, capEnd: true }));
    }
  }
  let _2 = V([n2.point(0, 1.22, 0.024), n2.point(0, 1.34, 0.03), n2.point(0, 1.46, 0.026)], [0.012, 7e-3], 5, 6, { capStart: true, capEnd: true, up: [1, 0, 0] });
  g2.merge(_2), c2.add(g2, { ...cS, name: `ribs`, skin: (e5) => [`chest`, `spine`, z(1.24, 1.14, e5.p.y)] });
  let v2 = new cv();
  for (let e5 = 0; e5 < 6; e5 += 1) {
    let t3 = 1.5 - e5 * 0.065, r3 = n2.point(Math.PI, t3, 0.02), i3 = H(0.02, 0.016, 0.014, 6, 4);
    i3.translate(r3[0], r3[1], r3[2]), v2.merge(i3), v2.merge(iv([r3[0], r3[1], r3[2] - 0.01], [0, -0.3, -1], 6e-3, 0.025, 4));
  }
  c2.add(v2, { ...cS, name: `spinePlates`, skin: (e5) => [`chest`, `spine`, z(1.24, 1.14, e5.p.y)] });
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = t3 === 0 ? 1 : -1, i3 = Ux(e4.upperArmL, t3), a3 = X_([[0, 0.058], [0.048, 0.052], [0.082, 0.03], [0.1, 0], [0.104, -0.038]], 12, { sz: 0.92 });
    a3.rotateZ(-r3 * 0.45).translate(i3[0] + r3 * 0.01, i3[1] + 0.025, i3[2] - 4e-3), a3.noise(4e-3, 25, t3 + 3).computeNormals();
    let o3 = new cv();
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let t4 = -0.5 + e5 * 0.5;
      o3.merge(iv([i3[0] + r3 * 0.03, i3[1] + 0.07, i3[2] + t4 * 0.06], [r3 * 0.6, 1, t4 * 0.4], 0.01, 0.06 - Math.abs(t4) * 0.015, 5, -0.15));
    }
    c2.add(a3, { ...cS, name: `pauldron`, colors: { 0: sS.bone }, skin: () => [`shoulder_${n3}`, `upperArm_${n3}`, 0.45] }), c2.add(o3, { ...cS, color: sS.boneDark, name: `pauldronSpikes`, skin: () => [`shoulder_${n3}`, `upperArm_${n3}`, 0.45] });
  }
  c2.add(Nv(n2, 1.03, 0.06, 0.014, 18, { offset: 0.012 }), { bone: `hips`, color: sS.leather, rough: 0.6, detail: B.LEATHER, wear: 0.5 });
  let y2 = n2.point(0, 1.03, 0.03), b2 = H(0.026, 0.028, 0.02, 9, 6);
  b2.computeNormals();
  for (let e5 of [1, -1]) b2.bulge([e5 * 9e-3, 4e-3, 0.018], 9e-3, -6e-3);
  b2.computeNormals(), b2.translate(y2[0], y2[1], y2[2]), c2.add(b2, { ...lS, name: `buckle`, bone: `hips` });
  let x2 = n2.point(0.9, 1, 0.03);
  c2.add(V([x2, [x2[0] + 0.01, x2[1] - 0.08, x2[2] + 0.01], [x2[0] + 5e-3, x2[1] - 0.16, x2[2]]], 3e-3, 4, 6), { ...lS, bone: `hips` }), c2.add(X_([[0, -0.02], [0.012, -0.012], [0.01, 0.01], [0, 0.016]], 6).translate(x2[0] + 5e-3, x2[1] - 0.18, x2[2]), { ...cS, bone: `hips` }), nS(c2, n2, r2, { yTop: i2, yBot: 0.07, flare: 0.12, folds: 3, foldAmp: 0.016, nu: 6, nv: 9, color: sS.robe, lining: sS.tealDark, trim: sS.teal, trimPbr: [0.5, 0], trimV: 0.93, trimU: 0.028, rough: 0.55, wear: 0.45, zone: z_.ARMOR, name: `robeSkirt` }, a2);
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = Nx(e4, t3, { radius: (e5, t4) => {
      let n4 = e5 < t4 ? R(0.07, 0.048, e5 / t4) : 0.044 - (e5 - t4) * 0.02;
      return [n4, n4];
    }, endAt: 0.88, segs: 6, rings: 8 });
    c2.add(r3.geo, { color: `#151318`, rough: 0.7, detail: B.CLOTH, skin: r3.skin });
    let i3 = Ux(e4.ankleL, t3);
    c2.add(Fx(e4, t3, { width: 0.92, point: 0.55, segs: 8, rings: 7 }), { color: sS.leather, rough: 0.45, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`foot_${n3}`, `toe_${n3}`, z(i3[2] + 0.1, i3[2] + 0.16, e5.p.z)], wear: 0.5 }), c2.add(Ix(e4, t3, 0.32, 0.036, 0.042, 4e-3, 8), { color: sS.leather, rough: 0.45, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`shin_${n3}`, `foot_${n3}`, z(0.16, 0.1, e5.p.y)] });
  }
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let n3 = Vx(t3), r3 = Ux(e4.wristL, t3), i3 = Mx(e4, t3, { radius: (e5, t4) => {
      if (e5 < t4) {
        let n5 = R(0.054, 0.046, z(0.05, t4, e5));
        return [n5, n5 * 0.95];
      }
      let n4 = R(0.045, 0.062, z(0.45, 1, (e5 - t4) / (1 - t4)));
      return [n4, n4];
    }, topIn: 0.05, topUp: 0.012, endAt: 0.97, segs: 8, rings: 11 });
    c2.add(i3.geo, { ...f2, name: `sleeve`, paint: (e5, t4) => {
      e5.p.y < r3[1] + 0.06 && t4.copy(p2);
    }, skin: i3.skin });
    let a3 = Px(e4, t3, { scale: 0.96, fingerLen: 1.15, fingerR: 0.85 });
    c2.add(a3.palm, { bone: `hand_${n3}`, color: sS.skin, rough: 0.55, detail: B.SKIN }), c2.add(a3.fingers, { bone: `fingers_${n3}`, color: sS.skin, rough: 0.55, detail: B.SKIN });
    let o3 = Ux(e4.fingersL, t3);
    c2.add(av(9e-3, 25e-4, 8, 4).translate(o3[0] - (t3 === 0 ? 2e-3 : -2e-3), o3[1] - 0.012, o3[2] + 0.012), { ...lS, bone: `fingers_${n3}` });
  }
  let S2 = [...rS(r2, { stiffness: 100, damping: 12 }), { id: `lockL`, bones: [`lockL_1`, `lockL_2`], gravity: 0.7, inertia: 0.02, drag: 0.05, stiffness: 60, damping: 8, xMin: -0.6, xMax: 0.5, zMin: -0.2, zMax: 0.5, sway: 0.02 }, { id: `lockR`, bones: [`lockR_1`, `lockR_2`], gravity: 0.7, inertia: 0.02, drag: 0.05, stiffness: 60, damping: 8, xMin: -0.6, xMax: 0.5, zMin: -0.5, zMax: 0.2, sway: 0.02 }];
  return hx({ key: `hero:necromancer`, def: s2, mb: c2, height: 1.92, radius: 0.32, sockets: _x(e4), springs: S2, contacts: vx(), animator: (t3) => new sx(new ix(t3, e4, { kind: `necromancer`, gait: `eerie`, weapon: `wand`, castStyle: `eerie`, armSwing: 0.22, runArmSwing: 0.5, hunch: 0.07, headDown: 0.1, crouch: 0.03, bob: 0.012, elbow: 0.32, armOut: 0.07, fingersOpen: 0.2, tauntStyle: `cackle`, idleSway: 0.7 }), t3, iS(r2)), equip: { weapons: true, offHand: true, helm: true, helmScale: 1, helmOffset: [t2.center[0] - e4.head[0], t2.center[1] - e4.head[1], t2.center[2] - e4.head[2]] }, defaultEquipment: { mainHand: `wand` } });
}
var sS, cS, lS, uS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), wx(), Wx(), aS(), sS = { skin: `#cbbdb4`, skinShadow: `#3a2a3a`, robe: `#1b1820`, robeHi: `#26222c`, teal: `#17625b`, tealDark: `#0e2b29`, bone: `#e2d6b6`, boneDark: `#9c8c68`, hair: `#b4b0a8`, leather: `#241a14`, silver: `#b9bcc2` }, cS = { color: sS.bone, rough: 0.55, detail: B.BONE, wear: 0.55 }, lS = { color: sS.silver, rough: 0.3, metal: 1, detail: B.METAL, wear: 0.2 };
}));
function dS(e4, t2, n2) {
  let r2 = new pv(), i2 = (e5) => {
    let t3 = [];
    for (let n3 = 0; n3 <= 10; n3 += 1) {
      let r3 = n3 / 10, i3 = e5 * (0.07 + r3 * 0.68), a3 = 0.07 * Math.sin(r3 * Math.PI * 0.75) - 0.06 * z(0.7, 1, r3);
      t3.push([a3, i3, 0]);
    }
    return V(t3, (e6) => [0.019 * (1 - e6 * 0.5), 0.013 * (1 - e6 * 0.4)], 4, 8, { up: [0, 0, 1], capStart: true, capEnd: true });
  }, a2 = n2 ? uv(e4, 0.5, { color: e4, rough: 0.35, detail: B.BONE }) : U(`darkWood`, { color: e4, wear: 0.5 });
  if (r2.add(i2(1), a2), r2.add(i2(-1), a2), r2.add(_v(-0.08, 0.08, 0.019, 4), U(`leather`, { color: t2 })), n2) {
    for (let e5 = 0; e5 < 6; e5 += 1) {
      let t3 = e5 < 3 ? 1 : -1, n3 = 0.2 + e5 % 3 * 0.25, i3 = t3 * (0.07 + n3 * 0.68), a3 = 0.07 * Math.sin(n3 * Math.PI * 0.75);
      r2.add(iv([a3 + 0.012, i3, 0], [1, t3 * 0.4, 0], 8e-3, 0.045, 4), U(`black`, { color: `#2a0507` }));
    }
    for (let e5 of [1, -1]) {
      let t3 = [];
      for (let n3 = 0; n3 <= 6; n3 += 1) {
        let r3 = 0.1 + n3 / 6 * 0.8;
        t3.push([0.07 * Math.sin(r3 * Math.PI * 0.75) - 0.06 * z(0.7, 1, r3) + 8e-3, e5 * (0.07 + r3 * 0.68), 8e-3]);
      }
      r2.add(V(t3, 4e-3, 4, 10), dv(`#ff2a2a`, 3.2));
    }
  } else for (let e5 of [-1, 1]) r2.add(bv(e5 * 0.085, 0.018, 0.012, 8), U(`bronze`));
  return { builder: r2, tip: [0.08, 0, 0], kind: `bow` };
}
function fS() {
  let e4 = 0.07 * Math.sin(1 * Math.PI * 0.75) - 0.06;
  return [[e4, 0.75, 0], [e4, -0.75, 0]];
}
var pS, mS = t((() => {
  U_(), lv(), __(), mv(), Ev(), pS = { cleaver: () => {
    let e4 = new pv(), t2 = [[-0.018, 0.045]];
    for (let e5 = 0; e5 <= 9; e5 += 1) {
      let n3 = e5 / 9, r2 = e5 % 3 == 1 ? -0.012 : e5 % 3 == 2 ? 4e-3 : 0;
      t2.push([0.072 + r2 + Math.sin(n3 * 5) * 4e-3, R(0.05, 0.29, n3)]);
    }
    t2.push([0.04, 0.31], [-0.022, 0.29], [-0.024, 0.06]);
    let n2 = tv(t2, 9e-3, { bevel: 15e-4, crease: 40 });
    return n2.deform((e5) => {
      e5.z *= 1 - z(0.02, 0.075, e5.x) * 0.7;
    }), n2.computeNormals().creased(40), e4.add(n2, U(`rust`, { color: `#5a4a3e`, wear: 0.85, pbr: (e5, t3) => t3[0] = e5.p.x > 0.06 ? 0.38 : t3[0] })), e4.add(yv(-0.07, 0.07, 0.013, 0.012, 7, 4), U(`wood`, { color: `#4a3324` })), e4.add(_v(-0.06, 0.03, 0.0145, 4), U(`cloth`, { color: `#5a4a38`, wear: 0.8 })), e4.add(av(0.01, 3e-3, 8, 4).translate(0, 0.25, 0).rotateAt([0, 0.25, 0], Math.PI / 2, 0, 0), U(`rust`)), { builder: e4, tip: [0.06, 0.3, 0], kind: `blade` };
  }, shamanStaff: () => {
    let e4 = new pv(), t2 = [];
    for (let e5 = 0; e5 <= 9; e5 += 1) {
      let n3 = e5 / 9;
      t2.push([Math.sin(n3 * 6.3) * 0.012 + o_(n3 * 3, 2, 2) * 0.012, R(-0.42, 0.52, n3), Math.cos(n3 * 4.7) * 0.01]);
    }
    let n2 = V(t2, (e5) => 0.014 * (1 - e5 * 0.25) * (1 + 0.15 * Math.sin(e5 * 23)), 5, 10, { capStart: true, capEnd: true });
    n2.noise(2e-3, 50, 4).computeNormals(), e4.add(n2, U(`darkWood`, { color: `#3d2c1c`, wear: 0.6 }));
    let r2 = H(0.04, 0.035, 0.045, 8, 5);
    r2.translate(0, 0.575, 0.01).computeNormals();
    for (let e5 of [1, -1]) r2.bulge([e5 * 0.015, 0.582, 0.05], 0.013, -9e-3);
    r2.grab([0, 0.555, 0.04], [0.02, 0.015, 0.03], [0, -8e-3, 0.02]), r2.computeNormals(), e4.add(r2, U(`oldBone`));
    for (let t3 of [1, -1]) e4.add(H(7e-3, 7e-3, 5e-3, 6, 4).translate(t3 * 0.015, 0.582, 0.048), dv(`#ff7a1a`, 3.2)), e4.add(V([[t3 * 0.03, 0.59, 0], [t3 * 0.06, 0.62, -0.02], [t3 * 0.07, 0.67, -0.05], [t3 * 0.055, 0.7, -0.07]], (e5) => 9e-3 * (1 - e5 * 0.85), 4, 6, { capStart: true, capEnd: true }), U(`bone`, { color: `#c8b48c` }));
    for (let t3 = 0; t3 < 3; t3 += 1) {
      let n3 = -0.5 + t3 * 0.5, r3 = [Math.sin(n3) * 0.03, 0.53, Math.cos(n3) * 0.03 - 0.02], i2 = V([r3, [r3[0] + Math.sin(n3) * 0.02, 0.46, r3[2] - 0.01], [r3[0] + Math.sin(n3) * 0.03, 0.38, r3[2] - 0.015]], (e5) => [25e-4, 0.014 * Math.sin(Math.min(1, e5 * 1.15) * Math.PI) + 2e-3], 4, 4, { up: [Math.cos(n3), 0, -Math.sin(n3)], capStart: true, capEnd: true });
      e4.add(i2, U(`cloth`, { color: t3 === 1 ? `#7a1c14` : `#1e1a18`, detail: B.FUR, wear: 0.2 }));
    }
    for (let t3 = 0; t3 < 4; t3 += 1) e4.add(H(8e-3, 8e-3, 8e-3, 4, 3).translate(0.025, 0.49 - t3 * 0.022, 0.01), U(t3 % 2 ? `bone` : `redLeather`));
    return e4.add(_v(-0.08, 0.08, 0.016, 5), U(`cloth`, { color: `#4e3c2a`, wear: 0.8 })), { builder: e4, tip: [0, 0.6, 0.03], kind: `staff` };
  }, rustySword: () => {
    let e4 = new pv(), t2 = 0.74, n2 = hv({ length: t2, y0: 0.075, width: (e5) => R(0.03, 0.022, e5) - z(0.84, 1, e5) * 0.022, thick: 6e-3, fuller: 0.6, stations: 10 });
    return n2.deform((e5) => {
      let n3 = (e5.y - 0.075) / t2, r2 = Math.max(0, Math.sin(n3 * 41) - 0.75) * 0.03 + Math.max(0, Math.sin(n3 * 23 + 1.3) - 0.85) * 0.04;
      Math.abs(e5.x) > 0.012 && (e5.x -= Math.sign(e5.x) * r2);
    }), n2.computeNormals().creased(32), e4.add(n2, U(`rust`, { color: `#6b5444`, wear: 0.95 })), e4.add(_v(-0.06, 0.065, 0.013, 4, 5), U(`darkLeather`, { wear: 0.9 })), e4.add(gv(0.19, 0.02, 0.026, { y: 0.07, droop: 0.01, knob: 0.01 }), U(`rust`)), e4.add(vv(-0.075, 0.02, `disc`), U(`rust`)), { builder: e4, tip: [0, 0.075 + t2, 0], kind: `blade` };
  }, crackedShield: () => {
    let e4 = new pv(), t2 = 0.2;
    for (let n3 of [0, 1]) {
      let r3 = [], i2 = n3 === 0 ? 0.06 : Math.PI + 0.06;
      for (let e5 = 0; e5 <= 9; e5 += 1) {
        let n4 = i2 + e5 / 9 * (Math.PI - 0.12);
        r3.push([Math.sin(n4) * t2, Math.cos(n4) * t2]);
      }
      r3.push([0.012 * (n3 ? 1 : -1), -0.12], [-8e-3 * (n3 ? 1 : -1), -0.03], [0.01 * (n3 ? 1 : -1), 0.06], [-6e-3 * (n3 ? 1 : -1), 0.14]);
      let a2 = tv(r3, 0.022, { bevel: 3e-3, crease: 50 });
      a2.deform((e5) => {
        e5.z += 0.03 - (e5.x * e5.x + e5.y * e5.y) * 0.4 + 0.011;
      }), a2.computeNormals(), e4.add(a2, U(`wood`, { color: `#5a4430`, wear: 0.85, paint: (e5, t3) => {
        Math.abs(Math.sin(e5.p.x * 34)) < 0.08 && t3.multiplyScalar(0.55);
      } }));
    }
    let n2 = av(t2, 0.012, 12, 4, 0.016);
    n2.rotateX(Math.PI / 2).translate(0, 0, 0.03), e4.add(n2, U(`rust`, { wear: 0.9 }));
    let r2 = X_([[0.055, 0.03], [0.05, 0.045], [0.03, 0.06], [0, 0.065]], 8);
    return r2.rotateX(Math.PI / 2).translate(0, 0, 0), e4.add(r2, U(`rust`)), { builder: e4, tip: [0, 0, 0.06], kind: `shield` };
  }, longbow: () => dS(`#3a2618`, `#4a3a2c`, false), bloodBow: () => dS(`#4a0a0e`, `#7a1018`, true), mercBow: () => dS(`#5a3a22`, `#6a4a30`, false), hammer: () => {
    let e4 = new pv();
    e4.add(yv(-0.12, 0.34, 0.014, 0.013, 7, 5), U(`wood`)), e4.add(_v(-0.11, 0.04, 0.0155, 4), U(`leather`));
    let t2 = X_([[0, -0.07], [0.03, -0.07], [0.034, -0.04], [0.032, 0.04], [0.03, 0.07], [0, 0.07]], 8);
    return t2.rotateZ(Math.PI / 2).translate(0, 0.36, 0), e4.add(t2, U(`darkSteel`, { wear: 0.5 })), { builder: e4, tip: [0.07, 0.36, 0], kind: `blunt` };
  }, book: () => {
    let e4 = new pv(), t2 = tv([[-0.08, -0.11], [0.08, -0.11], [0.08, 0.11], [-0.08, 0.11]], 0.045, { bevel: 4e-3 });
    e4.add(t2, U(`redLeather`, { color: `#4a1a14` }));
    let n2 = tv([[-0.074, -0.104], [0.084, -0.104], [0.084, 0.104], [-0.074, 0.104]], 0.036, {});
    return n2.translate(3e-3, 0, 0), e4.add(n2, U(`parchment`)), e4.add(tv([[-0.03, -0.04], [0.03, -0.04], [0.03, 0.04], [-0.03, 0.04]], 0.05, { bevel: 3e-3 }), U(`gold`)), { builder: e4, tip: [0, 0.11, 0], kind: `misc` };
  } };
}));
function hS(e4) {
  return { height: 1.12 * e4, hip: 0.47 * e4, hipWidth: 0.072 * e4, knee: 0.27 * e4, ankle: 0.07 * e4, spine: 0.56 * e4, chest: 0.68 * e4, neck: 0.83 * e4, head: 0.87 * e4, shoulderY: 0.8 * e4, shoulderX: 0.13 * e4, clavX: 0.03 * e4, elbow: 0.6 * e4, wrist: 0.415 * e4, handLen: 0.13 * e4, armOut: 0.05 * e4, hunch: 0.06 * e4, kneeZ: 0.015 * e4, footLen: 0.17 * e4, toes: true, fingers: true, jaw: true };
}
function gS(e4, t2) {
  let n2 = e4 === `shaman`, r2 = n2 ? 1.06 : 1, i2 = n2 ? vS[t2] : _S[t2], a2 = t2 === 2, o2 = hS(r2), s2 = lx(o2), c2 = o2.hunch ?? 0, l2 = Tx({ segs: 12, base: [0, s2.head[1] - 0.012 * r2, s2.head[2] + 4e-3], scale: 0.8 * r2, width: 1.12, depth: 1.05, height: 0.9, jaw: 1.3, chin: 1.6, brow: 2.6, nose: 0.55, cheek: 1.5, muzzle: 0.75, slope: 0.45, socket: 1.5, eyeSpread: 1.12, lips: 0.4, eyeY: 0.122 }), u2 = new Lv([{ y: 0.41 * r2, rx: 0.083 * r2, rzf: 0.068 * r2, rzb: 0.08 * r2, cz: 0 }, { y: 0.5 * r2, rx: 0.088 * r2, rzf: 0.08 * r2, rzb: 0.074 * r2, cz: c2 * 0.1 }, { y: 0.58 * r2, rx: 0.086 * r2, rzf: 0.09 * r2, rzb: 0.066 * r2, cz: c2 * 0.3 }, { y: 0.66 * r2, rx: 0.092 * r2, rzf: 0.078 * r2, rzb: 0.07 * r2, cz: c2 * 0.6 }, { y: 0.74 * r2, rx: 0.104 * r2, rzf: 0.068 * r2, rzb: 0.072 * r2, cz: c2 * 0.8 }, { y: 0.795 * r2, rx: 0.098 * r2, rzf: 0.058 * r2, rzb: 0.066 * r2, cz: c2 * 0.85 }, { y: 0.83 * r2, rx: 0.05 * r2, rzf: 0.04 * r2, rzb: 0.046 * r2, cz: c2 * 0.95 }, { y: 0.9 * r2, rx: 0.04 * r2, rzf: 0.034 * r2, rzb: 0.04 * r2, cz: c2 * 1 }]), d2 = [{ name: `clothF`, th0: -0.55, th1: 0.55 }, { name: `clothB`, th0: Math.PI - 0.6, th1: Math.PI + 0.6 }], f2 = [];
  for (let e5 of d2) {
    let t3 = (e5.th0 + e5.th1) / 2;
    f2.push({ name: `${e5.name}_1`, parent: `hips`, pos: u2.point(t3, 0.47 * r2, 0.02) }), f2.push({ name: `${e5.name}_2`, parent: `${e5.name}_1`, pos: u2.point(t3, 0.36 * r2, 0.05).map((e6, t4) => t4 === 1 ? 0.36 * r2 : e6) });
  }
  let p2 = (e5) => [e5 * (l2.rx + 4e-3), l2.eyes[0][1] + 0.01, l2.center[2] - 0.01];
  f2.push({ name: `ear_L`, parent: `head`, pos: p2(1) }, { name: `ear_R`, parent: `head`, pos: p2(-1) }), n2 && (f2.push({ name: `cape_1`, parent: `chest`, pos: u2.point(Math.PI, 0.79 * r2, 0.03) }), f2.push({ name: `cape_2`, parent: `cape_1`, pos: u2.point(Math.PI, 0.55 * r2, 0.07) }), f2.push({ name: `cape_3`, parent: `cape_2`, pos: u2.point(Math.PI, 0.36 * r2, 0.1).map((e5, t3) => t3 === 1 ? 0.36 * r2 : e5) }));
  let m2 = new fx(ux(s2, f2)), h2 = new H_(), g2 = i_(17 + t2 * 7 + (n2 ? 50 : 0)), _2 = i2.ember ? new P(i2.ember) : null, v2 = (e5) => _2 ? z(0.42, 0.52, Math.abs(o_(e5.x * 18, e5.y * 18, e5.z * 18, 2, 3))) : 0, y2 = (e5) => ({ bone: e5, color: i2.skin, paint: (e6, t3) => {
    let n3 = z(-0.2, 0.9, e6.n.z);
    t3.set(i2.dark).lerp(new P(i2.skin), 0.55 + n3 * 0.45), e6.n.z > 0.5 && e6.p.y < 0.66 * r2 && e6.p.y > 0.45 * r2 && t3.lerp(new P(i2.belly), 0.6);
    let a3 = v2(e6.p);
    a3 > 0 && t3.lerp(_2, a3);
  }, pbr: _2 ? (e6, t3) => {
    t3[2] = v2(e6.p) * 1.6;
  } : void 0, rough: 0.58, detail: B.SKIN, wear: 0.6, mottle: 0.12, mottleScale: 22 }), b2 = l2.mouth[1] + 2e-3, x2 = (e5) => [`head`, `jaw`, e5.p.z > l2.center[2] - 0.01 ? z(b2 + 6e-3, b2 - 8e-3, e5.p.y) : z(b2 - 0.01, b2 - 0.04, e5.p.y) * 0.6];
  h2.add(l2.geo, { ...y2(), name: `head`, skin: x2, paint: (e5, t3) => {
    y2().paint(e5, t3), Math.abs(e5.p.y - b2) < 4e-3 && e5.p.z > l2.mouth[2] - 0.03 && Math.abs(e5.p.x) < 0.04 && t3.set(`#1a0503`), a2 && Math.abs(e5.p.x) < 0.012 && e5.p.y > l2.browY - 0.01 && e5.p.z > l2.center[2] && t3.set(`#e8dccb`);
  } }), h2.add(H(0.034 * r2, 0.012 * r2, 0.025 * r2, 6, 3).translate(0, b2, l2.mouth[2] - 0.022), { bone: `jaw`, color: `#2a0806`, rough: 0.4, detail: B.FLESH, ao: 0 });
  let S2 = new cv(), C2 = new cv();
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let t3 = R(-0.028, 0.028, e5 / 4) * r2, n3 = l2.mouth[2] - 4e-3 - Math.abs(t3) * 0.35, i3 = e5 === 1 || e5 === 3;
    S2.merge(iv([t3, b2 + 4e-3, n3], [0, -1, 0.15], 35e-4 * r2, (i3 ? 0.016 : 9e-3) * r2, 4)), e5 % 2 == 0 && C2.merge(iv([t3 * 0.9, b2 - 6e-3, n3 - 2e-3], [0, 1, 0.1], 3e-3 * r2, 8e-3 * r2, 4));
  }
  h2.add(S2, { bone: `head`, color: `#e3d6a8`, rough: 0.4, detail: B.BONE, wear: 0.4 }), h2.add(C2, { bone: `jaw`, color: `#e3d6a8`, rough: 0.4, detail: B.BONE, wear: 0.4 });
  for (let e5 of l2.eyes) {
    let t3 = H(l2.eyeR * 1.5, l2.eyeR * 1.2, l2.eyeR * 1.1, 6, 4);
    t3.translate(e5[0] * 1.02, e5[1], e5[2] + 2e-3), h2.add(t3, { bone: `head`, color: i2.eye, rough: 0.2, emit: 3.2, detail: B.EMISSIVE, ao: 0, occluder: false }), h2.add(H(l2.eyeR * 0.25, l2.eyeR * 0.95, l2.eyeR * 0.3, 4, 3).translate(e5[0] * 1.02, e5[1], e5[2] + l2.eyeR * 1.05), { bone: `head`, color: `#120402`, rough: 0.3, detail: B.GEM, ao: 0 });
  }
  for (let e5 of [1, -1]) {
    let t3 = [e5 * 0.035 * r2, l2.browY + 0.02, l2.center[2] + l2.rz * 0.7];
    if (a2 || n2) {
      if (a2 && !n2) {
        let n3 = [t3, [t3[0] + e5 * 0.03, t3[1] + 0.06, t3[2] - 0.03], [t3[0] + e5 * 0.07, t3[1] + 0.09, t3[2] - 0.09], [t3[0] + e5 * 0.09, t3[1] + 0.06, t3[2] - 0.13]];
        h2.add(V(n3, (e6) => 0.016 * r2 * (1 - e6 * 0.9), 5, 7, { capStart: true, capEnd: true }), { bone: `head`, color: `#2a1a12`, rough: 0.45, detail: B.BONE, wear: 0.6, paint: (e6, n4) => n4.lerp(new P(`#c8b48c`), z(t3[1] + 0.05, t3[1] + 0.09, e6.p.y)) });
      }
    } else h2.add(iv(t3, [e5 * 0.3, 1, 0.2], 9e-3 * r2, 0.022 * r2, 5), { bone: `head`, color: `#2a120c`, rough: 0.5, detail: B.BONE });
  }
  for (let e5 = 0; e5 < 2; e5 += 1) {
    let t3 = p2(e5 === 0 ? 1 : -1), n3 = Ax(t3, e5, 0.15 * r2, 0.04 * r2, 0.12);
    h2.add(n3, { ...y2(), skin: (n4) => [`head`, `ear_${Vx(e5)}`, z(5e-3, 0.03, Math.abs(n4.p.x - t3[0]))] }), a2 && e5 === 0 && h2.add(av(8e-3, 25e-4, 8, 4).rotateZ(Math.PI / 2).translate(t3[0] + 0.06 * r2, t3[1] + 0.01, t3[2] - 0.012), { bone: `ear_L`, color: `#c8a24a`, rough: 0.3, metal: 1, detail: B.METAL });
  }
  let w2 = u2.loft(0.42 * r2, 0.9 * r2, 12, 8, 0);
  w2.computeNormals();
  for (let e5 of [1, -1]) w2.bulge([e5 * 0.05 * r2, 0.75 * r2, 0.07 * r2 + c2 * 0.8], [0.05, 0.035, 0.04], 7e-3 * r2), w2.bulge([e5 * 0.08 * r2, 0.78 * r2, -0.04 * r2 + c2 * 0.8], [0.04, 0.05, 0.04], 8e-3 * r2);
  for (let e5 = 0; e5 < 5; e5 += 1) w2.bulge([0, 0.5 * r2 + e5 * 0.065 * r2, -0.065 * r2 + c2 * (0.15 + e5 * 0.15)], [0.015, 0.02, 0.02], 6e-3 * r2);
  w2.computeNormals(), h2.add(w2, { ...y2(), name: `torso`, skin: (e5) => {
    let t3 = e5.p.y;
    return t3 > 0.82 * r2 ? [`neck`, `chest`, z(0.86 * r2, 0.82 * r2, t3)] : t3 > 0.6 * r2 ? [`chest`, `spine`, z(0.66 * r2, 0.6 * r2, t3)] : [`spine`, `hips`, z(0.52 * r2, 0.46 * r2, t3)];
  }, paint: (e5, t3) => {
    y2().paint(e5, t3), Math.abs(e5.p.x) > 0.06 * r2 && e5.p.y > 0.62 * r2 && e5.p.y < 0.76 * r2 && Math.abs(Math.sin(e5.p.y * 120)) < 0.25 && t3.multiplyScalar(0.78), a2 && e5.n.z > 0.3 && Math.abs(e5.p.y - 0.7 * r2) < 0.012 && t3.set(`#e8dccb`);
  } }), h2.add(Nv(u2, 0.47 * r2, 0.018, 8e-3, 14, { offset: 6e-3 }), { bone: `hips`, color: `#6a5a40`, rough: 0.9, detail: B.CLOTH, wear: 0.7 });
  for (let e5 of d2) {
    let t3 = rv(3, 3, (t4, n3) => {
      let i3 = R(e5.th0, e5.th1, t4), a3 = R(0.47 * r2, 0.29 * r2, n3), o3 = (Math.sin(t4 * 19 + e5.th0) * 0.5 + Math.sin(t4 * 43) * 0.5) * 0.03 * r2 * z(0.6, 1, n3), s3 = u2.point(i3, Math.max(a3, 0.41 * r2), 0.014 + n3 * 0.03);
      return [s3[0], a3 + o3, s3[2]];
    }, 6e-3, (e6) => new N(e6.x, 0, e6.z).normalize());
    h2.add(t3, { name: `loin`, color: i2.cloth, colors: { 1: `#2a2016`, 2: i2.cloth }, rough: 0.92, detail: B.CLOTH, wear: 0.85, skin: Iv(`hips`, `${e5.name}_1`, `${e5.name}_2`, 0.46 * r2, 0.38 * r2, 0.28 * r2) });
  }
  for (let e5 = 0; e5 < 2; e5 += 1) {
    let t3 = Vx(e5), n3 = Mx(s2, e5, { radius: (e6, t4) => {
      if (e6 < t4) {
        let n5 = R(0.03, 0.019, z(0.05, t4, e6)) * r2 * (1 + 0.2 * Math.exp(-(((e6 - 0.12) / 0.1) ** 2)));
        return [n5, n5];
      }
      let n4 = (e6 - t4) / (1 - t4), i4 = R(0.022, 0.014, n4) * r2 * (1 + 0.18 * Math.exp(-(((n4 - 0.25) / 0.15) ** 2)));
      return [i4, i4];
    }, topIn: 0.03 * r2, topUp: 0.01, segs: 6, rings: 8 });
    h2.add(n3.geo, { ...y2(), skin: n3.skin });
    let i3 = Px(s2, e5, { scale: 0.62 * r2, fingers: 3, fingerLen: 1.55, fingerR: 1.15, claws: 0.022 * r2, palmW: 0.9, curl: 1.1, palmSegs: 7, thumb: false });
    h2.add(i3.palm, { ...y2(`hand_${t3}`) }), h2.add(i3.fingers, { ...y2(`fingers_${t3}`) }), h2.add(i3.claws, { bone: `fingers_${t3}`, color: `#1e1410`, rough: 0.35, detail: B.BONE });
    let a3 = Nx(s2, e5, { radius: (e6, t4) => {
      let n4 = e6 < t4 ? R(0.042, 0.026, z(0, t4, e6)) * (1 + 0.15 * Math.exp(-(((e6 - 0.3) / 0.12) ** 2))) : R(0.03, 0.017, (e6 - t4) / (1 - t4)) * (1 + 0.25 * Math.exp(-((((e6 - t4) / (1 - t4) - 0.25) / 0.15) ** 2)));
      return [n4 * r2, n4 * r2];
    }, topUp: 0.03, segs: 6, rings: 8 });
    h2.add(a3.geo, { ...y2(), skin: a3.skin });
    let o3 = Ux(s2.ankleL, e5), c3 = Fx(s2, e5, { len: 1.05, width: 0.85, height: 0.75, toeH: 0.7, point: 0.2, segs: 6, rings: 6 });
    h2.add(c3, { ...y2(), skin: (e6) => [`foot_${t3}`, `toe_${t3}`, z(o3[2] + 0.06 * r2, o3[2] + 0.1 * r2, e6.p.z)] });
    let l3 = new cv();
    for (let e6 = 0; e6 < 3; e6 += 1) {
      let t4 = o3[0] + (e6 - 1) * 0.022 * r2;
      l3.merge(iv([t4, 0.012 * r2, o3[2] + 0.15 * r2], [0, -0.35, 1], 7e-3 * r2, 0.03 * r2, 3));
    }
    h2.add(l3, { bone: `toe_${t3}`, color: `#1e1410`, rough: 0.35, detail: B.BONE });
  }
  let T2 = [{ id: `clothF`, bones: [`clothF_1`, `clothF_2`], gravity: 0.6, stiffness: 120, damping: 12, xMin: -1, xMax: 0.2, sway: 0.02 }, { id: `clothB`, bones: [`clothB_1`, `clothB_2`], gravity: 0.6, stiffness: 120, damping: 12, xMin: -0.2, xMax: 1, sway: 0.02 }, { id: `earL`, bones: [`ear_L`], gravity: 0.15, inertia: 0.03, drag: 0.04, stiffness: 140, damping: 9, zMin: -0.5, zMax: 0.5, sway: 0.04, swaySpeed: 2.3 }, { id: `earR`, bones: [`ear_R`], gravity: 0.15, inertia: 0.03, drag: 0.04, stiffness: 140, damping: 9, zMin: -0.5, zMax: 0.5, sway: 0.04, swaySpeed: 2.1 }], E2 = [{ id: `clothF`, side: -1, mode: `front` }, { id: `clothB`, side: -1, mode: `back` }], D2 = _x(s2, { mouthZ: 0.08, castZ: 0.35 });
  if (n2) {
    let e5 = pS.shamanStaff();
    D2.weaponTip = { bone: `hand_R`, pos: bx(h2, e5.builder.parts, `hand_R`, gx(s2, 1), xx(), a2 ? 1.2 : 1.08, e5.tip) };
    let n3 = H(l2.rx * 1.08, 0.05 * r2, l2.rz * 1.05, 9, 5);
    n3.deform((e6) => {
      e6.y < 0 && (e6.y *= 0.4), e6.z += Math.max(0, e6.z) * 0.25;
    }), n3.translate(l2.center[0], l2.crown - 0.02 * r2, l2.center[2] + 0.01), n3.computeNormals();
    for (let e6 of [1, -1]) n3.bulge([e6 * 0.03 * r2, l2.crown - 0.025 * r2, l2.center[2] + l2.rz * 0.95], 0.02 * r2, -0.012 * r2);
    n3.computeNormals(), h2.add(n3, { bone: `head`, color: `#cdbb92`, rough: 0.55, detail: B.BONE, wear: 0.7, zone: z_.BODY });
    for (let e6 of [1, -1]) {
      let n4 = [e6 * l2.rx * 0.8, l2.crown + 0, l2.center[2] - 0], i4 = [n4, [n4[0] + e6 * 0.06, n4[1] + 0.05, n4[2] - 0.02], [n4[0] + e6 * 0.1, n4[1] + 0.12, n4[2] - 0.06], [n4[0] + e6 * 0.09, n4[1] + 0.19 + (a2 ? 0.05 : 0), n4[2] - 0.11]];
      h2.add(V(i4, (e7) => 0.018 * r2 * (1 - e7 * 0.85), 5, 7, { capStart: true, capEnd: true }), { bone: `head`, color: `#b8a27a`, rough: 0.5, detail: B.BONE, wear: 0.6 });
      let o4 = a2 ? 2 : 1;
      for (let n5 = 0; n5 < o4; n5 += 1) {
        let i5 = [e6 * (0.03 + n5 * 0.02) * r2, l2.crown - 0.01, l2.center[2] - l2.rz * 0.7], o5 = [i5[0] + e6 * 0.04, i5[1] + 0.14 + n5 * 0.03 + (a2 ? 0.06 : 0), i5[2] - 0.08];
        h2.add(V([i5, [R(i5[0], o5[0], 0.5), R(i5[1], o5[1], 0.5), R(i5[2], o5[2], 0.5) - 0.01], o5], (e7) => [3e-3, 0.016 * Math.sin(Math.min(1, e7 * 1.1 + 0.05) * Math.PI) + 2e-3], 4, 4, { up: [0, 0, 1], capStart: true, capEnd: true }), { bone: `head`, color: n5 % 2 ? `#1a1414` : t2 === 1 ? `#3a6a9a` : `#8a1c12`, rough: 0.7, detail: B.FUR });
      }
    }
    let i3 = [u2.point(Math.PI, 0.79 * r2, 0.03), u2.point(Math.PI, 0.55 * r2, 0.07), u2.point(Math.PI, 0.36 * r2, 0.1)], o3 = rv(4, 4, (e6, t3) => {
      let n4 = Math.PI + R(-1.45, 1.45, e6), i4 = R(0.8 * r2, 0.3 * r2, t3), a3 = (Math.sin(e6 * 17) * 0.5 + Math.sin(e6 * 37 + 1) * 0.5) * 0.035 * z(0.65, 1, t3), o4 = u2.point(n4, Math.max(Math.min(i4, 0.79 * r2), 0.42 * r2), 0.025 + t3 * 0.07);
      return [o4[0] * (1 + t3 * 0.2), i4 + a3, o4[2]];
    }, 8e-3, (e6) => new N(e6.x, 0, e6.z - 0.05).normalize());
    h2.add(o3, { name: `cape`, color: t2 === 1 ? `#6a6a72` : `#7a5a3a`, colors: { 1: `#3a2a1c`, 2: `#5a4630` }, paint: (e6, t3) => {
      e6.tag === 0 && t3.multiplyScalar(0.85 + o_(e6.p.x * 20, e6.p.y * 20, e6.p.z * 20, 2, 5) * 0.3);
    }, rough: 0.85, detail: B.LEATHER, wear: 0.8, skin: Fv([`cape_1`, `cape_2`, `cape_3`], i3, 0.7) });
    let c3 = [];
    for (let e6 = 0; e6 <= 10; e6 += 1) {
      let t3 = R(-1.6, 1.6, e6 / 10);
      c3.push(u2.point(t3, 0.79 * r2 - Math.cos(t3) * 0.035 * r2, 0.012));
    }
    h2.add(V(c3, 4e-3 * r2, 3, 10), { bone: `chest`, color: `#3a2a1c`, rough: 0.8, detail: B.LEATHER });
    for (let e6 = 2; e6 < 10; e6 += 3) h2.add(H(0.01 * r2, 0.012 * r2, 8e-3 * r2, 5, 3).translate(c3[e6][0], c3[e6][1] - 8e-3, c3[e6][2] + 4e-3), { bone: `chest`, color: `#d8c8a0`, rough: 0.5, detail: B.BONE });
    T2.push({ id: `cape`, bones: [`cape_1`, `cape_2`, `cape_3`], gravity: 0.75, inertia: 0.02, drag: 0.07, stiffness: 70, damping: 8, restX: 0.08, xMin: -0.1, xMax: 1.3, falloff: 0.85, sway: 0.025 });
  } else {
    let e5 = pS.cleaver();
    D2.weaponTip = { bone: `hand_R`, pos: bx(h2, e5.builder.parts, `hand_R`, gx(s2, 1), xx(), a2 ? 1.25 : 1.05, e5.tip) };
  }
  if (a2 && !n2) {
    let e5 = [];
    for (let t4 = 0; t4 <= 10; t4 += 1) {
      let n3 = R(-1.7, 1.7, t4 / 10);
      e5.push(u2.point(n3, 0.785 * r2 - Math.cos(n3) * 0.04 * r2, 0.012));
    }
    h2.add(V(e5, 4e-3, 4, 14), { bone: `chest`, color: `#3a2a1c`, rough: 0.8, detail: B.LEATHER });
    for (let t4 = 2; t4 < 9; t4 += 3) {
      let n3 = e5[t4], r3 = H(0.018, 0.02, 0.016, 7, 5);
      r3.translate(n3[0], n3[1] - 0.025, n3[2] + 0.01).computeNormals();
      for (let e6 of [1, -1]) r3.bulge([n3[0] + e6 * 7e-3, n3[1] - 0.022, n3[2] + 0.024], 6e-3, -4e-3);
      r3.computeNormals(), h2.add(r3, { bone: `chest`, color: `#ddd0aa`, rough: 0.5, detail: B.BONE, wear: 0.6 });
    }
    let t3 = [];
    for (let e6 = 0; e6 <= 14; e6 += 1) {
      let n3 = e6 / 14 * Math.PI * 2;
      t3.push([Math.sin(n3) * (l2.rx + 0.01), l2.browY + 0.035 + (Math.cos(n3) < 0 ? 0.015 : 0), l2.center[2] + Math.cos(n3) * (l2.rz + 5e-3)]);
    }
    h2.add(V(t3, 6e-3, 4, 18), { bone: `head`, color: `#3a2a18`, rough: 0.85, detail: B.WOOD });
    for (let e6 = 0; e6 < 7; e6 += 1) {
      let t4 = e6 / 7 * Math.PI * 2 + 0.2, n3 = [Math.sin(t4) * (l2.rx + 0.012), l2.browY + 0.04, l2.center[2] + Math.cos(t4) * (l2.rz + 8e-3)];
      h2.add(iv(n3, [Math.sin(t4) * 0.4, 1, Math.cos(t4) * 0.4], 6e-3, 0.04 + g2() * 0.03, 4), { bone: `head`, color: `#3a2a18`, rough: 0.85, detail: B.WOOD });
    }
  }
  let O2 = n2 ? 1.15 : 1;
  return hx({ key: `monster:${n2 ? `gutterkinShaman` : `gutterkin`}:${t2}`, def: m2, mb: h2, height: O2, radius: n2 ? 0.36 : 0.34, sockets: D2, springs: T2, contacts: vx(0.6), animator: (e5) => new sx(new ix(e5, s2, { kind: n2 ? `gutterkinShaman` : `gutterkin`, gait: `scurry`, weapon: n2 ? `staff` : `cleaver`, walkRef: 3.2, runRef: 5.5, walkStride: 0.95, runStride: 1.45, walkStance: 0.55, runStance: 0.36, stepH: 0.07, runStepH: 0.12, crouch: 0.05, runCrouch: 0.07, bob: 0.015, runBob: 0.03, footSpread: 0.03, hunch: 0.55, headDown: -0.35, armOut: 0.32, elbow: 0.6, armSwing: 0.5, runArmSwing: 0.8, lean: 0.12, runLean: 0.3, tauntStyle: n2 ? `cackle` : `jump`, castStyle: `staff`, specialStyle: `lunge`, fingersOpen: 0.3, idleSway: 1.3 }), e5, E2), deadEmissive: 0.05, build: { grime: { height: 0.25, amount: 0.5 }, ao: { res: 64, dist: 0.14, strength: 1 } } });
}
var _S, vS, yS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), mS(), wx(), Wx(), _S = { 0: { skin: `#9a2c1d`, belly: `#b85a3e`, dark: `#4e130c`, eye: `#ffd23a`, cloth: `#5a4632` }, 1: { skin: `#3a2a26`, belly: `#4e3c34`, dark: `#16100e`, eye: `#ff8a1a`, cloth: `#2c241c`, ember: `#ff5a14` }, 2: { skin: `#8a1f16`, belly: `#a8442e`, dark: `#3a0c08`, eye: `#fff07a`, cloth: `#3a2a1c` } }, vS = { 0: { skin: `#7a2a3a`, belly: `#9a4a52`, dark: `#3a0f1a`, eye: `#ffb02a`, cloth: `#6a5a44` }, 1: { skin: `#4a5468`, belly: `#64708a`, dark: `#1e2230`, eye: `#7ae0ff`, cloth: `#3a3a44` }, 2: { skin: `#6a1f2e`, belly: `#8a3a46`, dark: `#2a0810`, eye: `#ffe06a`, cloth: `#4a3020` } };
}));
function bS(e4, t2, n2, r2 = 1.8, i2 = 4, a2 = 4) {
  return V([e4, t2], (e5) => {
    let t3 = 1 + (r2 - 1) * (Math.exp(-((e5 / 0.09) ** 2)) + Math.exp(-(((1 - e5) / 0.09) ** 2)));
    return [n2 * t3, n2 * t3 * 0.85];
  }, i2, a2, { capStart: true, capEnd: true, linear: true });
}
function xS(e4, t2, n2, r2 = {}) {
  let i2 = t2.P.height / 1.85, a2 = (e5, t3 = {}) => ({ bone: e5, color: n2.bone, rough: 0.58, detail: B.BONE, wear: n2.stain, mottle: 0.12, mottleScale: 25, ...t3 }), o2 = new P(`#120c08`), s2 = Tx({ segs: r2.segsHead ?? 10, base: [0, t2.head[1] - 0.03 * i2, t2.head[2] + 0.012], scale: 0.9 * i2, height: 0.9, jaw: 1.05, chin: 1.3, brow: 1.8, nose: 0, cheek: 2.2, gaunt: 2.8, socket: 3.4, lips: 0, width: 1.04 }), c2 = s2.mouth[1], l2 = 0.019 * i2;
  e4.add(s2.geo, { ...a2(), name: `skull`, paint: (e5, t3) => {
    t3.set(n2.bone);
    for (let n3 of s2.eyes) {
      let r4 = Math.hypot(e5.p.x - n3[0], (e5.p.y - n3[1]) * 1.1);
      r4 < l2 && e5.p.z > s2.center[2] + 0.03 * i2 && t3.lerp(o2, z(l2, l2 * 0.6, r4));
    }
    let r3 = (e5.p.y - (s2.eyes[0][1] - 0.035 * i2)) / (0.02 * i2), a3 = e5.p.x / ((0.011 - r3 * 4e-3) * i2);
    e5.p.z > s2.center[2] + 0.05 * i2 && Math.abs(r3) < 1 && Math.abs(a3) < 1 && t3.lerp(o2, 0.9), Math.abs(e5.p.y - c2) < 6e-3 * i2 && e5.p.z > s2.center[2] + 0.04 * i2 && Math.abs(e5.p.x) < 0.035 * i2 && t3.lerp(o2, 0.85), Math.abs(e5.p.x) < 25e-4 * i2 && e5.p.y > s2.browY + 0.03 * i2 && t3.multiplyScalar(0.7);
  }, skin: (e5) => [`head`, `jaw`, e5.p.z > s2.center[2] - 0.02 * i2 ? z(c2 + 4e-3 * i2, c2 - 8e-3 * i2, e5.p.y) : z(c2 - 0.01 * i2, c2 - 0.04 * i2, e5.p.y) * 0.5] });
  let u2 = new cv(), d2 = new cv();
  for (let e5 = 0; e5 < 6; e5 += 1) {
    let t3 = R(-0.85, 0.85, e5 / 5), n3 = Math.sin(t3) * 0.03 * i2, r3 = s2.mouth[2] - (1 - Math.cos(t3)) * 0.03 * i2 - 4e-3 * i2;
    u2.merge(H(45e-4 * i2, 8e-3 * i2, 4e-3 * i2, 3, 2).translate(n3, c2 + 5e-3 * i2, r3)), d2.merge(H(42e-4 * i2, 7e-3 * i2, 4e-3 * i2, 3, 2).translate(n3 * 0.95, c2 - 6e-3 * i2, r3 - 2e-3 * i2));
  }
  e4.add(u2, a2(`head`, { color: `#e6dcc0`, name: `teeth` })), e4.add(d2, a2(`jaw`, { color: `#e6dcc0`, name: `teeth` }));
  let f2 = [[s2.eyes[0][0], s2.eyes[0][1], s2.eyes[0][2] - 4e-3 * i2], [s2.eyes[1][0], s2.eyes[1][1], s2.eyes[1][2] - 4e-3 * i2]];
  for (let t3 of f2) e4.add(H(65e-4 * i2, 65e-4 * i2, 5e-3 * i2, 5, 3).translate(t3[0], t3[1], t3[2]), { bone: `head`, color: n2.eye, emit: 3.5, rough: 0.3, detail: B.EMISSIVE, ao: 0, occluder: false, name: `eyes` });
  let p2 = [[0, t2.neck[1] - 0.04 * i2, t2.neck[2] - 0.035 * i2], [0, t2.head[1] - 5e-3 * i2, t2.head[2] - 0.025 * i2]];
  e4.add(V(p2, (e5) => 0.019 * i2 * (1 + 0.35 * Math.abs(Math.sin(e5 * Math.PI * 3))), 4, 6, { capStart: true, capEnd: true }), a2(void 0, { name: `neckBones`, skin: Pv(`head`, `neck`, t2.head[1] - 0.01, t2.neck[1] + 0.02) }));
  let m2 = [[0, t2.hips[1] - 0.02 * i2, t2.hips[2] - 0.05 * i2], [0, t2.spine[1], t2.spine[2] - 0.065 * i2], [0, t2.chest[1], t2.chest[2] - 0.085 * i2], [0, t2.neck[1] - 0.03 * i2, t2.neck[2] - 0.05 * i2]];
  e4.add(V(m2, (e5) => 0.02 * i2 * (1 + 0.4 * Math.abs(Math.sin(e5 * Math.PI * 7))), 4, 12, { capStart: true, capEnd: true }), a2(void 0, { name: `spineBones`, skin: (e5) => {
    let n3 = e5.p.y;
    return n3 > t2.chest[1] - 0.05 ? [`chest`, `spine`, z(t2.chest[1] - 0.02, t2.chest[1] - 0.08, n3)] : [`spine`, `hips`, z(t2.spine[1] - 0.02, t2.hips[1] + 0.03, n3)];
  } }));
  let h2 = new Lv([{ y: t2.chest[1] - 0.2 * i2, rx: 0.12 * i2, rzf: 0.09 * i2, rzb: 0.08 * i2, cz: t2.chest[2] }, { y: t2.chest[1] - 0.05 * i2, rx: 0.135 * i2, rzf: 0.1 * i2, rzb: 0.09 * i2, cz: t2.chest[2] }, { y: t2.chest[1] + 0.1 * i2, rx: 0.125 * i2, rzf: 0.095 * i2, rzb: 0.09 * i2, cz: t2.chest[2] }, { y: t2.chest[1] + 0.18 * i2, rx: 0.095 * i2, rzf: 0.07 * i2, rzb: 0.08 * i2, cz: t2.chest[2] - 0.01 * i2 }]), g2 = new cv();
  for (let e5 = 0; e5 < 6; e5 += 1) {
    let n3 = e5 / 5, r3 = R(t2.chest[1] + 0.14 * i2, t2.chest[1] - 0.15 * i2, n3), a3 = R(0.24, 1.05, n3 * n3);
    for (let e6 of [1, -1]) {
      let t3 = [];
      for (let o3 = 0; o3 <= 5; o3 += 1) {
        let s3 = o3 / 5, c3 = e6 * R(Math.PI - 0.14, a3, s3), l3 = r3 + 0.012 * i2 * Math.sin(s3 * Math.PI * 0.6) - s3 * s3 * (0.07 + n3 * 0.03) * i2;
        t3.push(h2.point(c3, l3, 2e-3 * i2 * Math.sin(s3 * Math.PI)));
      }
      g2.merge(V(t3, (e7) => [35e-4 * i2, 0.0105 * i2 * (1 - e7 * 0.35)], 3, 4, { capStart: true, capEnd: true, up: [0, 1, 0] }));
    }
  }
  g2.merge(V([h2.point(0, t2.chest[1] - 0.12 * i2, 4e-3), h2.point(0, t2.chest[1] + 0.13 * i2, 4e-3)], [0.014 * i2, 6e-3 * i2], 4, 4, { capStart: true, capEnd: true, up: [1, 0, 0] }));
  for (let e5 of [1, -1]) {
    let n3 = t2.upperArmL;
    g2.merge(V([h2.point(e5 * 0.25, t2.chest[1] + 0.16 * i2, 5e-3), [e5 * n3[0] * 0.95, n3[1] + 0.01, n3[2] + 0.01]], 75e-4 * i2, 4, 3, { capStart: true, capEnd: true }));
    let r3 = rv(2, 2, (n4, r4) => {
      let a3 = Math.PI + e5 * R(0.35, 1.1, n4), o3 = R(t2.chest[1] + 0.14 * i2, t2.chest[1] - 0.04 * i2, r4) + (1 - n4) * r4 * 0;
      return h2.point(a3, o3, 0.012 * i2);
    }, 8e-3 * i2, (e6) => new N(e6.x, 0, e6.z - t2.chest[2]).normalize());
    g2.merge(r3);
  }
  e4.add(g2, a2(`chest`, { name: `ribcage` }));
  let _2 = new cv();
  for (let e5 of [1, -1]) {
    let n3 = H(0.07 * i2, 0.055 * i2, 0.012 * i2, 6, 4);
    n3.deform((e6) => {
      e6.z += e6.x * e6.x / (0.07 * i2) * 0.6;
    }), n3.computeNormals(), n3.rotateY(e5 * 0.85).rotateZ(-e5 * 0.35).translate(e5 * 0.07 * i2, t2.hips[1] + 0.04 * i2, t2.hips[2] - 0.015 * i2), _2.merge(n3);
  }
  _2.merge(H(0.04 * i2, 0.05 * i2, 0.03 * i2, 6, 4).translate(0, t2.hips[1] - 5e-3 * i2, t2.hips[2] - 0.05 * i2)), _2.merge(V([[0.06 * i2, t2.hips[1] - 0.05 * i2, 0.03 * i2], [0, t2.hips[1] - 0.065 * i2, 0.05 * i2], [-0.06 * i2, t2.hips[1] - 0.05 * i2, 0.03 * i2]], 0.012 * i2, 5, 6, { capStart: true, capEnd: true })), e4.add(_2, a2(`hips`, { name: `pelvis` }));
  for (let n3 = 0; n3 < 2; n3 += 1) {
    let r3 = Vx(n3), o3 = Ux(t2.upperArmL, n3), s3 = Ux(t2.elbowL, n3), c3 = Ux(t2.wristL, n3), l3 = Ux(t2.hipL, n3), u3 = Ux(t2.kneeL, n3), d3 = Ux(t2.ankleL, n3), f3 = n3 === 0 ? 1 : -1;
    e4.add(bS([o3[0], o3[1] + 0.012 * i2, o3[2]], s3, 0.012 * i2, 1.9), a2(`upperArm_${r3}`, { name: `humerus` })), e4.add(bS([s3[0] + f3 * 6e-3 * i2, s3[1] - 0.01 * i2, s3[2] + 6e-3 * i2], [c3[0] + f3 * 6e-3 * i2, c3[1], c3[2] + 6e-3 * i2], 75e-4 * i2, 1.6, 4, 5), a2(`foreArm_${r3}`, { name: `radius` })), e4.add(bS([s3[0] - f3 * 6e-3 * i2, s3[1] - 5e-3 * i2, s3[2] - 8e-3 * i2], [c3[0] - f3 * 6e-3 * i2, c3[1], c3[2] - 6e-3 * i2], 68e-4 * i2, 1.6, 4, 5), a2(`foreArm_${r3}`, { name: `ulna` }));
    let p3 = Ux(t2.fingersL, n3);
    e4.add(H(0.01 * i2, 0.035 * i2, 0.026 * i2, 5, 4).translate(R(c3[0], p3[0], 0.5), R(c3[1], p3[1], 0.5), c3[2] + 3e-3 * i2), a2(`hand_${r3}`, { name: `handBones` }));
    let m3 = new cv();
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let t3 = c3[2] + R(0.02, -0.018, e5 / 2) * i2, n4 = (e5 === 1 ? 0.07 : 0.06) * i2;
      m3.merge(V([[p3[0], p3[1] + 6e-3 * i2, t3], [p3[0] - f3 * 0.012 * i2, p3[1] - n4 * 0.55, t3], [p3[0] - f3 * 0.03 * i2, p3[1] - n4, t3]], 42e-4 * i2, 4, 3, { capStart: true, capEnd: true }));
    }
    e4.add(m3, a2(`fingers_${r3}`, { name: `fingerBones` })), e4.add(V([[c3[0] - f3 * 8e-3 * i2, c3[1] - 0.025 * i2, c3[2] + 0.025 * i2], [c3[0] - f3 * 0.02 * i2, c3[1] - 0.05 * i2, c3[2] + 0.04 * i2]], 45e-4 * i2, 4, 3, { capStart: true, capEnd: true }), a2(`hand_${r3}`, { name: `thumb` })), e4.add(bS([l3[0] * 0.9, l3[1] + 0.02 * i2, l3[2]], u3, 0.015 * i2, 1.8), a2(`thigh_${r3}`, { name: `femur` })), e4.add(H(0.017 * i2, 0.014 * i2, 0.01 * i2, 5, 4).translate(u3[0], u3[1] + 5e-3 * i2, u3[2] + 0.02 * i2), a2(`shin_${r3}`, { name: `kneecap` })), e4.add(bS([u3[0], u3[1] - 0.01 * i2, u3[2]], [d3[0], d3[1] + 0.01 * i2, d3[2]], 0.012 * i2, 1.7), a2(`shin_${r3}`, { name: `tibia` })), e4.add(bS([u3[0] + f3 * 0.02 * i2, u3[1] - 0.03 * i2, u3[2] - 0.012 * i2], [d3[0] + f3 * 0.022 * i2, d3[1] + 0.02 * i2, d3[2] - 0.01 * i2], 6e-3 * i2, 1.5, 4, 4), a2(`shin_${r3}`, { name: `fibula` }));
    let h3 = new cv();
    h3.merge(H(0.022 * i2, 0.022 * i2, 0.035 * i2, 5, 3).translate(d3[0], d3[1] - 0.012 * i2, d3[2] - 5e-3 * i2));
    for (let e5 = 0; e5 < 2; e5 += 1) {
      let t3 = d3[0] + (e5 - 0.5) * 0.022 * i2;
      h3.merge(V([[t3, 0.03 * i2, d3[2] + 0.02 * i2], [t3, 0.012 * i2, d3[2] + 0.11 * i2]], 7e-3 * i2, 4, 2, { capStart: true, capEnd: true }));
    }
    e4.add(h3, a2(void 0, { name: `footBones`, skin: (e5) => [`foot_${r3}`, `toe_${r3}`, z(d3[2] + 0.07 * i2, d3[2] + 0.1 * i2, e5.p.z)] }));
  }
  return { eyes: f2, head: s2 };
}
function SS(e4, t2 = 0) {
  let n2 = e4 !== `bonewretch`, r2 = e4 === `skeletonMage`, i2 = n2 ? 1.85 : 1.9, a2 = lx(dx(i2, { fingers: true, toes: true, jaw: true, shoulderX: i2 / 1.85 * 0.175, armOut: i2 / 1.85 * 0.07 })), o2 = { bonewretch0: { bone: `#c4b08a`, stain: 0.85, eye: `#ff3a1a` }, bonewretch1: { bone: `#6a5e50`, stain: 0.95, eye: `#ff6a1a` }, bonewretch2: { bone: `#d0bc94`, stain: 0.75, eye: `#ff2414` }, skeletonWarrior0: { bone: `#c9bea4`, stain: 0.3, eye: `#7fe0c8` }, skeletonMage0: { bone: `#c4b89c`, stain: 0.35, eye: `#b27aff` } }[`${e4}${n2 ? 0 : t2}`], s2 = r2 ? [{ name: `robeFL`, th0: 0.1, th1: 1.6 }, { name: `robeFR`, th0: -1.6, th1: -0.1 }, { name: `robeB`, th0: 1.5, th1: 4.78 }] : [], c2 = new Lv([{ y: 0.85, rx: 0.13, rzf: 0.09, rzb: 0.1 }, { y: 1, rx: 0.12, rzf: 0.085, rzb: 0.095 }, { y: 1.15, rx: 0.12, rzf: 0.09, rzb: 0.09 }, { y: 1.3, rx: 0.15, rzf: 0.1, rzb: 0.095 }, { y: 1.45, rx: 0.165, rzf: 0.09, rzb: 0.095 }, { y: 1.52, rx: 0.14, rzf: 0.07, rzb: 0.08 }, { y: 1.58, rx: 0.07, rzf: 0.05, rzb: 0.06 }]), l2 = r2 ? tS(c2, s2, 1.02, 0.55) : [];
  !n2 && t2 === 2 && l2.push({ name: `banner_1`, parent: `chest`, pos: [0, 1.55, -0.12] }, { name: `banner_2`, parent: `banner_1`, pos: [0, 1.85, -0.15] });
  let u2 = new fx(ux(a2, l2)), d2 = new H_(), { head: f2 } = xS(d2, a2, o2, { mage: r2 }), p2 = _x(a2), m2 = [];
  if (e4 === `bonewretch`) {
    let e5 = { color: `#6a6660`, rough: 0.55, metal: 0.85, detail: B.CHAIN, wear: 0.85 }, n3 = rv(7, 2, (e6, t3) => {
      let n4 = R(-2.4, 2.1, e6), r4 = (Math.sin(e6 * 31) * 0.5 + Math.sin(e6 * 13) * 0.5) * 0.04 * t3, i4 = c2.point(n4, R(1, 0.8, t3), 0.035 + t3 * 0.03);
      return [i4[0], R(1, 0.78, t3) + r4, i4[2]];
    }, 6e-3, (e6) => new N(e6.x, 0, e6.z).normalize());
    d2.add(n3, { ...e5, name: `mailSkirt`, bone: `hips` });
    let r3 = rv(6, 2, (e6, t3) => {
      let n4 = R(0.9, 2.8, e6);
      return c2.point(n4, R(1.53, 1.36, t3) - Math.sin(e6 * 9) * 0.02 * t3, 0.03 + t3 * 0.02);
    }, 6e-3, (e6) => new N(e6.x, 0.4, e6.z).normalize());
    d2.add(r3, { ...e5, name: `mailMantle`, skin: () => [`chest`, `shoulder_L`, 0.3] });
    let i3 = [];
    for (let e6 = 0; e6 <= 12; e6 += 1) i3.push(c2.point(R(-Math.PI, Math.PI, e6 / 12), 1, 0.03));
    d2.add(V(i3, [6e-3, 0.02], 3, 10, { up: [0, 1, 0] }), { bone: `hips`, color: `#3a2618`, rough: 0.7, detail: B.LEATHER, wear: 0.9 });
    let o3 = pS.rustySword();
    p2.weaponTip = { bone: `hand_R`, pos: bx(d2, o3.builder.parts, `hand_R`, gx(a2, 1), xx(), 1, o3.tip) };
    let s3 = pS.crackedShield(), l3 = gx(a2, 0);
    if (bx(d2, s3.builder.parts, `hand_L`, [l3[0] + 0.035, l3[1] + 0.05, l3[2]], Cx, 1), t2 === 2) {
      let e6 = X_([[0.08, -0.03], [0.082, 0], [0.075, 0.04], [0.05, 0.065], [0, 0.07]], 9);
      e6.translate(f2.center[0], f2.center[1] + 0.03, f2.center[2]), d2.add(e6, { bone: `head`, color: `#4a4440`, rough: 0.45, metal: 0.9, detail: B.METAL, wear: 0.7 });
      for (let e7 of [1, -1]) {
        let t4 = [e7 * 0.07, f2.center[1] + 0.04, f2.center[2]];
        d2.add(V([t4, [e7 * 0.12, f2.center[1] + 0.07, f2.center[2] - 0.01], [e7 * 0.15, f2.center[1] + 0.14, f2.center[2] - 0.04]], (e8) => 0.017 * (1 - e8 * 0.9), 4, 6, { capStart: true, capEnd: true }), { bone: `head`, color: `#d8c8a0`, rough: 0.5, detail: B.BONE });
      }
      let t3 = a2.upperArmL, n4 = X_([[0.085, -0.02], [0.08, 0.02], [0.05, 0.045], [0, 0.05]], 9);
      n4.rotateZ(-0.4).translate(t3[0] + 0.02, t3[1] + 0.03, t3[2]), d2.add(n4, { color: `#4a4440`, rough: 0.45, metal: 0.9, detail: B.METAL, wear: 0.7, skin: () => [`shoulder_L`, `upperArm_L`, 0.5] });
      for (let e7 = 0; e7 < 3; e7 += 1) d2.add(iv([t3[0] + 0.03, t3[1] + 0.07, t3[2] - 0.04 + e7 * 0.04], [0.5, 1, 0], 0.01, 0.07, 4), { color: `#5a524a`, rough: 0.4, metal: 0.9, detail: B.METAL, skin: () => [`shoulder_L`, `upperArm_L`, 0.5] });
      let r4 = V([[0, 1.3, -0.14], [0, 2.05, -0.16]], 9e-3, 4, 2, { capStart: true, capEnd: true });
      d2.add(r4, { color: `#3a2a1c`, rough: 0.7, detail: B.WOOD, skin: (e7) => [`chest`, `banner_1`, z(1.55, 1.7, e7.p.y)] });
      let i4 = rv(2, 3, (e7, t4) => [R(-0.01, 0.2, e7), R(2, 1.66, t4) - e7 * 0.03, -0.16 - e7 * 0.01], 4e-3, () => new N(0, 0, -1));
      d2.add(i4, { color: `#5a1010`, colors: { 1: `#3a0a0a`, 2: `#2a0808` }, rough: 0.85, detail: B.CLOTH, wear: 0.8, skin: (e7) => [`banner_1`, `banner_2`, z(2, 1.7, e7.p.y) * 0.8] }), m2.push({ id: `banner`, bones: [`banner_1`, `banner_2`], gravity: 0.15, inertia: 0.02, drag: 0.05, stiffness: 90, damping: 8, xMin: -0.4, xMax: 0.6, sway: 0.05 });
    }
  } else if (e4 === `skeletonWarrior`) {
    let e5 = [];
    for (let t3 = 0; t3 <= 10; t3 += 1) {
      let n3 = t3 / 10;
      e5.push(c2.point(R(0.9, -2.4, n3), R(1.48, 1.02, n3), 0.03));
    }
    d2.add(V(e5, [4e-3, 0.03], 4, 14, { up: [0, 0, 1] }), { color: `#1f6b62`, rough: 0.85, detail: B.CLOTH, wear: 0.5, skin: (e6) => [`chest`, `spine`, z(1.3, 1.1, e6.p.y)] });
  } else {
    let e5 = `#2a2238`, t3 = rv(12, 6, (e6, t4) => {
      let n4 = R(-Math.PI, Math.PI, e6);
      return c2.point(n4, R(1.56, 1, t4), 0.03 + t4 * 0.01);
    }, 6e-3, (e6) => new N(e6.x, 0, e6.z).normalize(), { closedU: true });
    d2.add(t3, { color: e5, colors: { 1: `#140f1c`, 2: e5 }, rough: 0.8, detail: B.CLOTH, wear: 0.7, skin: (e6) => [`chest`, `spine`, z(1.3, 1.12, e6.p.y)], name: `robeUpper` }), nS(d2, c2, s2, { yTop: 1.02, yBot: 0.1, flare: 0.1, color: e5, lining: `#140f1c`, ragged: 0.06, nu: 5, nv: 6, rough: 0.8, wear: 0.7, name: `robeSkirt` }, 0.55);
    let n3 = rv(10, 5, (e6, t4) => {
      let n4 = R(-2.5, 2.5, e6), r4 = R(f2.crown + 0.03, f2.center[1] - 0.12, t4), i3 = (f2.rx + 0.03) * (1 + t4 * 0.25);
      return [Math.sin(n4) * i3, r4, f2.center[2] - 0.01 + Math.cos(n4) * (f2.rz + 0.035) * (1 + t4 * 0.1) - (1 - t4) * 0];
    }, 8e-3, (e6) => new N(e6.x, 0, e6.z - f2.center[2]).normalize());
    d2.add(n3, { color: e5, colors: { 1: `#0c0810`, 2: `#3a3050` }, rough: 0.8, detail: B.CLOTH, zone: z_.HEADWEAR, skin: Pv(`head`, `neck`, f2.center[1] - 0.05, f2.center[1] - 0.13) });
    for (let t4 = 0; t4 < 2; t4 += 1) {
      let n4 = Vx(t4), r4 = Ux(a2.upperArmL, t4), i3 = Ux(a2.elbowL, t4);
      d2.add(V([[r4[0], r4[1] + 0.02, r4[2]], i3], (e6) => 0.04 + e6 * 0.012, 7, 4, {}), { color: e5, rough: 0.8, detail: B.CLOTH, bone: `upperArm_${n4}` });
    }
    let r3 = gx(a2, 0);
    d2.add(H(0.055, 0.055, 0.055, 10, 8).translate(r3[0] - 0.02, r3[1] - 0.03, r3[2] + 0.05), { bone: `hand_L`, color: `#9a6aff`, emit: 2.6, rough: 0.1, detail: B.GEM, ao: 0, occluder: false, name: `orb` }), d2.add(av(0.05, 4e-3, 14, 4).rotateX(0.6).translate(r3[0] - 0.02, r3[1] - 0.03, r3[2] + 0.05), { bone: `hand_L`, color: `#d8c8ff`, emit: 1.8, rough: 0.3, detail: B.EMISSIVE, ao: 0 }), p2.castPoint = { bone: `hand_L`, pos: [r3[0] - 0.02, r3[1] - 0.03, r3[2] + 0.05] }, m2.push(...rS(s2, { stiffness: 90 }));
  }
  return hx({ key: n2 ? `ally:${e4}` : `monster:bonewretch:${t2}`, def: u2, mb: d2, height: i2, radius: 0.3, sockets: p2, springs: m2, contacts: vx(0.7), animator: (t3) => {
    let i3 = new ix(t3, a2, { kind: e4, gait: `march`, weapon: r2 ? `none` : `oneHand`, offHand: r2 ? `orb` : `shield`, walkRef: n2 ? 3.5 : 2.8, runRef: n2 ? 6 : 4.5, walkStride: 1.35, runStride: 2.1, stepH: 0.13, crouch: 0.03, bob: 0.012, armSwing: 0.35, elbow: 0.2, armOut: 0.12, hunch: n2 ? 0.04 : 0.12, headDown: 0.05, tauntStyle: `weaponRaise`, castStyle: r2 ? `point` : `arcane`, deathStyle: `crumble`, fingersOpen: 0.3 });
    return r2 ? new sx(i3, t3, iS(s2)) : i3;
  }, equip: e4 === `skeletonWarrior` ? { weapons: true, offHand: true, helm: true, helmScale: 0.95, helmOffset: [f2.center[0] - a2.head[0], f2.center[1] - a2.head[1], f2.center[2] - a2.head[2]] } : void 0, defaultEquipment: e4 === `skeletonWarrior` ? { mainHand: `shortSword`, offHand: `buckler` } : void 0, deadEmissive: 0, build: { grime: { height: 0.3, amount: 0.4 }, ao: { res: 72, dist: 0.18, strength: 0.9 } } });
}
var CS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), mS(), wx(), Wx(), aS();
})), wS, TS, ES, DS, OS, kS, AS, jS = t((() => {
  Ed(), ax(), wS = new N(), TS = new N(), ES = new ir(), DS = new ir(), OS = new N(), kS = new N(0, 0, 1), AS = class extends ix {
    stringBone;
    arrowBone;
    stringRest = new N();
    gripL = new N();
    gripR = new N();
    iHandL;
    iHandR;
    constructor(e4, t2, n2, r2, i2) {
      super(e4, t2, n2), e4.hasBone(`bowString`) && (this.stringBone = e4.bone(`bowString`), this.stringRest.copy(this.stringBone.position)), e4.hasBone(`arrow`) && (this.arrowBone = e4.bone(`arrow`)), this.gripL.copy(r2), this.gripR.copy(i2), this.iHandL = e4.template.def.index.get(`hand_L`), this.iHandR = e4.template.def.index.get(`hand_R`);
    }
    post(e4, t2) {
      super.post(e4, t2);
      let n2 = e4.ex[0], r2 = e4.ex[1] > 0.5, i2 = this.rig.space;
      if (!this.stringBone && !this.arrowBone) return;
      i2.update();
      let a2 = i2.pos[this.iHandL], o2 = i2.quat[this.iHandL], s2 = i2.pos[this.iHandR], c2 = i2.quat[this.iHandR];
      if (TS.copy(this.gripR).applyQuaternion(c2).add(s2), this.stringBone && (DS.copy(o2).invert(), wS.subVectors(TS, a2).applyQuaternion(DS), n2 > 0 ? this.stringBone.position.copy(this.stringRest).lerp(wS, Math.min(1, n2)) : this.stringBone.position.copy(this.stringRest).lerp(wS, n2 * 0.6)), this.arrowBone) {
        if (!r2) {
          this.arrowBone.scale.setScalar(1e-4);
          return;
        }
        this.arrowBone.scale.setScalar(1), wS.copy(this.gripL).applyQuaternion(o2).add(a2), OS.subVectors(wS, TS).normalize(), ES.setFromUnitVectors(kS, OS), DS.copy(c2).invert(), this.arrowBone.quaternion.copy(DS.multiply(ES));
      }
    }
  };
}));
function MS(e4, t2 = 0) {
  let n2 = NS[`${e4}${e4 === `hollowArcher` ? t2 : 0}`], r2 = n2.height, i2 = r2 / 1.85, a2 = lx(dx(r2, { shoulderX: 0.172 * i2, hipWidth: 0.088 * i2, clavX: 0.03 * i2, armOut: 0.058 * i2, footLen: 0.24 * i2, hip: 0.955 * i2, knee: 0.52 * i2 })), o2 = e4 === `hollowArcher` ? 1.2 : e4 === `bloodwitch` ? 0.6 : 0, s2 = Tx({ segs: e4 === `hollowArcher` ? 10 : 15, base: [0, a2.head[1] - 0.027 * i2, a2.head[2] + 0.014], scale: 0.95 * i2, jaw: e4 === `captain` ? 0.98 : 0.88, chin: 0.95, brow: 0.6, nose: 0.88, cheek: 1.2, gaunt: o2, lips: e4 === `hollowArcher` ? 0.6 : 1.05, width: 0.98 }), c2 = new Lv([{ y: 0.8 * i2, rx: 0.148 * i2, rzf: 0.1 * i2, rzb: 0.118 * i2 }, { y: 0.92 * i2, rx: 0.158 * i2, rzf: 0.105 * i2, rzb: 0.124 * i2 }, { y: 1 * i2, rx: 0.146 * i2, rzf: 0.098 * i2, rzb: 0.108 * i2 }, { y: 1.08 * i2, rx: 0.122 * i2, rzf: 0.088 * i2, rzb: 0.088 * i2, cz: 4e-3 }, { y: 1.16 * i2, rx: 0.12 * i2, rzf: 0.088 * i2, rzb: 0.086 * i2, cz: 7e-3 }, { y: 1.25 * i2, rx: 0.13 * i2, rzf: 0.1 * i2, rzb: 0.088 * i2, cz: 0.01 }, { y: 1.34 * i2, rx: 0.138 * i2, rzf: 0.11 * i2, rzb: 0.09 * i2, cz: 0.01 }, { y: 1.42 * i2, rx: 0.146 * i2, rzf: 0.096 * i2, rzb: 0.092 * i2, cz: 6e-3 }, { y: 1.47 * i2, rx: 0.152 * i2, rzf: 0.08 * i2, rzb: 0.088 * i2 }, { y: 1.505 * i2, rx: 0.13 * i2, rzf: 0.064 * i2, rzb: 0.074 * i2, cz: -4e-3 }, { y: 1.54 * i2, rx: 0.074 * i2, rzf: 0.052 * i2, rzb: 0.06 * i2, cz: -6e-3 }, { y: 1.58 * i2, rx: 0.052 * i2, rzf: 0.044 * i2, rzb: 0.052 * i2, cz: -6e-3 }, { y: 1.68 * i2, rx: 0.046 * i2, rzf: 0.032 * i2, rzb: 0.046 * i2, cz: -0.012 }]), l2 = i_(91 + t2), u2 = n2.cloak !== null, d2 = e4 === `hollowArcher`, f2 = [], p2 = c2.point(Math.PI, 1.5 * i2, 0.03), m2 = [p2, [0, 1.15 * i2, p2[2] - 0.06], [0, 0.8 * i2, p2[2] - 0.1], [0, 0.45 * i2, p2[2] - 0.13]];
  u2 && f2.push({ name: `cape_1`, parent: `chest`, pos: m2[0] }, { name: `cape_2`, parent: `cape_1`, pos: m2[1] }, { name: `cape_3`, parent: `cape_2`, pos: m2[2] }, { name: `cape_4`, parent: `cape_3`, pos: m2[3] });
  let h2 = [[0, s2.center[1] - 0.04, s2.center[2] - s2.rz], [0, 1.45 * i2, -0.13 * i2], [0, 1.2 * i2, -0.14 * i2]];
  (n2.longHair || e4 === `mercArcher`) && f2.push({ name: `hair_1`, parent: `head`, pos: h2[0] }, { name: `hair_2`, parent: `hair_1`, pos: h2[1] }), f2.push({ name: `tassetF_1`, parent: `hips`, pos: c2.point(0, 1 * i2, 0.02) }, { name: `tassetB_1`, parent: `hips`, pos: c2.point(Math.PI, 1 * i2, 0.02) });
  let g2 = gx(a2, 0), _2 = gx(a2, 1), v2 = xx(), y2 = new wr().compose(new N(...g2), v2, new N(1, 1, 1)), b2 = fS().map((e5) => new N(...e5).applyMatrix4(y2)), x2 = b2[0].clone().add(b2[1]).multiplyScalar(0.5);
  n2.bowOnBack || (f2.push({ name: `bowString`, parent: `hand_L`, pos: [x2.x, x2.y, x2.z] }), f2.push({ name: `arrow`, parent: `hand_R`, pos: _2 }));
  let S2 = new fx(ux(a2, f2)), C2 = new H_(), w2 = n2.veins ? new P(n2.veins) : null, T2 = (e5) => w2 ? z(0.035, 0, Math.abs(o_(e5.x * 22, e5.y * 22, e5.z * 22, 2, 7))) : 0;
  C2.add(s2.geo, { bone: `head`, color: n2.skin, paint: yx(s2, n2.skin, { lip: e4 === `hollowArcher` ? `#5a4448` : e4 === `bloodwitch` ? `#6a0a14` : `#a5504a`, shadow: e4 === `hollowArcher` || e4 === `bloodwitch` ? `#1a1018` : `#3c2626`, shadowK: e4 === `hollowArcher` || e4 === `bloodwitch` ? 0.8 : 0.5, blush: e4 === `mercArcher` || e4 === `captain` ? 0.12 : 0, paint: (e5, t3) => {
    let n3 = T2(e5);
    n3 > 0 && e5.y < s2.eyes[0][1] && t3.lerp(w2, n3 * 0.8);
  } }), rough: 0.52, detail: B.SKIN, wear: 0.15 }), C2.add(Dx(s2, d2 ? 5 : 6), { bone: `head`, color: `#b8b0aa`, paint: Ox(s2, new P(`#b8b0aa`), new P(n2.eye)), rough: 0.15, emit: n2.eyeGlow, detail: B.GEM, ao: 0.4 });
  let E2 = Ex(s2, 1.1);
  if (C2.add(E2.upper, { bone: `head`, color: `#140e0c`, rough: 0.6, detail: B.HAIR }), d2 || C2.add(E2.lower, { bone: `head`, color: `#8a6a60`, rough: 0.55, detail: B.SKIN }), n2.hair && !d2 && C2.add(jx(s2, 0.8, 1.1, e4 === `bloodwitch` ? 0.7 : 0), { bone: `head`, color: n2.hair, rough: 0.6, detail: B.HAIR }), !n2.hood) for (let e5 = 0; e5 < 2; e5 += 1) C2.add(kx(s2.ears[e5], e5, 0.9 * i2), { bone: `head`, color: n2.skin, rough: 0.55, detail: B.SKIN });
  let D2 = { bone: `head`, color: n2.hair ?? `#111`, rough: 0.42, detail: B.HAIR, zone: z_.HAIR, mottle: 0.1, mottleScale: 30 };
  if (n2.hair && !n2.hood && C2.add(Rx(s2, { thick: 8e-3, front: 0.04, temple: 0.01, side: -0.03, nape: 0.1, volume: 0.016, part: 4e-3, overEars: e4 !== `captain`, segs: 16, rings: 7 }), D2), n2.longHair || e4 === `mercArcher`) {
    let e5 = n2.longHair, t3 = rv(5, 6, (t4, n3) => {
      let r3 = Math.PI + R(-1.25, 1.25, t4), a3 = R(s2.center[1] - 0.02, e5 ? 1.08 * i2 : 1.36 * i2, n3), o3 = c2.point(r3, Math.min(a3, 1.56 * i2), 0.03 + n3 * 0.02), l3 = [Math.sin(r3) * (s2.rx + 0.012), a3, s2.center[2] + Math.cos(r3) * (s2.rz + 0.012)], u3 = z(0, 0.35, n3);
      return [R(l3[0], o3[0] * (e5 ? 1 : 0.5), u3) * (e5 ? 1 : 0.6), a3, R(l3[2], o3[2], u3)];
    }, 0.012, (e6) => new N(e6.x * 0.3, 0, -1).normalize());
    C2.add(t3, { ...D2, zone: z_.BODY, colors: { 1: n2.hair, 2: n2.hair }, skin: Fv([`head`, `hair_1`, `hair_2`], [[0, s2.center[1] + 0.05, s2.center[2]], h2[0], h2[1]], 0.7) });
  }
  if (n2.hood) {
    let e5 = s2.crown + 0.045, t3 = s2.center[1] - 0.17, r3 = rv(d2 ? 8 : 10, d2 ? 5 : 6, (n3, r4) => {
      let i3 = 0.72 * z(0.1, 0.32, r4), a3 = Math.PI + R(-(Math.PI - i3), Math.PI - i3, n3), o3 = R(e5, t3, r4), c3 = Math.sin(Math.min(1, (e5 - o3) / 0.1) * (Math.PI / 2)), l3 = Math.max(0, r4 - 0.45), u3 = (s2.rx + 0.03) * (0.06 + 0.94 * c3) * (1 + l3 * 0.7 + (1 - Math.abs(Math.cos(a3))) * 0.05), d3 = (s2.rz + 0.035) * (0.06 + 0.94 * c3) * (1 + l3 * 0.35), f3 = Math.max(0, Math.cos(a3));
      return [Math.sin(a3) * u3, o3, s2.center[2] - 0.012 + Math.cos(a3) * d3 - (1 - c3) * 0.035 + f3 * 0.012 * c3];
    }, 9e-3, (e6) => new N(e6.x, (e6.y - s2.center[1]) * 0.6, e6.z - s2.center[2]).normalize());
    C2.add(r3, { name: `hood`, color: n2.cloak, colors: { 1: n2.cloakLining, 2: n2.armorTrim }, rough: 0.8, detail: B.CLOTH, wear: 0.6, zone: z_.HEADWEAR, skin: Pv(`head`, `neck`, s2.center[1] - 0.06, s2.center[1] - 0.16) });
    for (let e6 of [1, -1]) C2.add(Bx([[e6 * (s2.rx - 0.01), s2.browY + 0.02, s2.center[2] + 0.06], [e6 * (s2.rx + 4e-3), s2.eyes[0][1] - 0.04, s2.center[2] + 0.05], [e6 * (s2.rx - 4e-3), s2.eyes[0][1] - 0.1, s2.center[2] + 0.04]], 0.012, 5e-3, 4, 5, 0.7, [e6, 0, 0.6]), { ...D2, zone: z_.BODY, color: n2.hair ?? `#111` });
  }
  if (n2.crown) {
    let e5 = new cv(), t3 = [];
    for (let e6 = 0; e6 <= 14; e6 += 1) {
      let r4 = e6 / 14 * c_;
      t3.push([Math.sin(r4) * (s2.rx + (n2.hood ? 0.044 : 0.016)), s2.browY + (n2.hood ? 0.045 : 0.03) + (Math.cos(r4) < 0 ? 0.018 : 0), s2.center[2] + Math.cos(r4) * (s2.rz + (n2.hood ? 0.046 : 0.012))]);
    }
    e5.merge(V(t3, 6e-3, d2 ? 3 : 4, d2 ? 14 : 18));
    let r3 = n2.crown === `thorn` ? 11 : 5;
    for (let t4 = 0; t4 < r3; t4 += 1) {
      let i3 = t4 / r3 * c_ + 0.15, a3 = [Math.sin(i3) * (s2.rx + (n2.hood ? 0.046 : 0.018)), s2.browY + (n2.hood ? 0.05 : 0.035), s2.center[2] + Math.cos(i3) * (s2.rz + (n2.hood ? 0.048 : 0.014))], o3 = (n2.crown === `thorn` ? 0.05 + l2() * 0.05 : 0.07) * (Math.cos(i3) > 0.7 ? 1.4 : 1);
      e5.merge(iv(a3, [Math.sin(i3) * 0.35, 1, Math.cos(i3) * 0.35], 6e-3, o3, d2 ? 3 : 4, n2.crown === `thorn` ? 0.25 : 0));
    }
    C2.add(e5, { bone: `head`, color: n2.crown === `thorn` ? `#3a3638` : `#d0c09a`, rough: n2.crown === `thorn` ? 0.42 : 0.55, metal: n2.crown === `thorn` ? 0.85 : 0, detail: n2.crown === `thorn` ? B.METAL : B.BONE, wear: 0.6, zone: z_.HEADWEAR, name: `crown` }), n2.crown === `thorn` && C2.add(H(9e-3, 0.012, 6e-3, 6, 4).translate(0, s2.browY + 0.045, s2.center[2] + s2.rz + 0.02), { bone: `head`, color: `#ff2a2a`, emit: 2.5, rough: 0.1, detail: B.GEM, ao: 0, zone: z_.HEADWEAR });
  }
  C2.add(c2.loft(1.36 * i2, 1.68 * i2, d2 ? 11 : 14, d2 ? 5 : 7, 0), { color: n2.skin, rough: 0.5, detail: B.SKIN, skin: Pv(`neck`, `chest`, 1.6 * i2, 1.53 * i2), paint: (e5, t3) => {
    let n3 = T2(e5.p);
    n3 > 0 && t3.lerp(w2, n3 * 0.85);
  } });
  let O2 = (t3) => {
    let n3 = Math.abs(((t3 + Math.PI) % c_ + c_) % c_ - Math.PI);
    return (e4 === `captain` ? 1.5 : 1.43) * i2 + (n3 > 1.2 ? 0.05 * i2 : 0) - (n3 < 0.5 ? 0.03 * i2 * (1 - n3 / 0.5) : 0);
  }, k2 = n2.armorMetal > 0.5, A2 = Mv(c2, { nu: d2 ? 15 : 20, nv: d2 ? 6 : 8, yBot: () => 0.98 * i2, yTop: O2, off: (e5, t3) => 9e-3 + (k2 ? 8e-3 : 0) + (1 - t3) * 3e-3 });
  C2.add(A2, { name: `cuirass`, color: n2.armor, paint: (e5, t3) => {
    let r3 = Math.atan2(e5.p.x, e5.p.z);
    Math.abs(Math.sin(r3 * 3)) < 0.06 && t3.set(n2.armorTrim), e5.p.y > O2(r3) - 0.015 && t3.set(n2.armorTrim), e5.p.y < 1 * i2 && t3.set(n2.armorTrim);
  }, rough: k2 ? 0.3 : 0.6, metal: n2.armorMetal, detail: k2 ? B.METAL : B.LEATHER, wear: e4 === `hollowArcher` ? 0.8 : 0.4, zone: z_.ARMOR, skin: (e5) => [`chest`, `spine`, z(1.22 * i2, 1.1 * i2, e5.p.y)] }), C2.add(Nv(c2, 1 * i2, 0.05, 0.012, 16, { offset: 0.016 }), { bone: `hips`, color: `#2a1e16`, rough: 0.6, detail: B.LEATHER, wear: 0.5 });
  let ee2 = [], te2 = d2 ? 4 : 7;
  for (let e5 = 0; e5 < te2; e5 += 1) {
    let t3 = -Math.PI + 0.25 + e5 * ((Math.PI * 2 - 0.5) / te2), n3 = (Math.PI * 2 - 0.5) / te2 * 0.84;
    ee2.push([t3, t3 + n3, Math.cos(t3 + n3 / 2) > 0 ? `tassetF_1` : `tassetB_1`]);
  }
  for (let [e5, t3, r3] of ee2) {
    let a3 = (0.3 + l2() * 0.08) * i2, o3 = rv(2, 3, (r4, o4) => {
      let s3 = R(e5, t3, r4), l3 = R(0.99 * i2, 0.99 * i2 - a3, o4), u3 = n2.tattered * Math.sin(r4 * 13 + e5 * 3) * z(0.6, 1, o4), d3 = c2.point(s3, Math.max(l3, 0.8 * i2), 0.02 + o4 * 0.04);
      return [d3[0], l3 + u3, d3[2]];
    }, 8e-3, (e6) => new N(e6.x, 0, e6.z).normalize());
    C2.add(o3, { name: `tassets`, color: n2.armor, colors: { 1: `#140e0a`, 2: n2.armorTrim }, paint: (e6, t4) => {
      e6.tag === 0 && e6.v > 0.85 && t4.set(n2.armorTrim);
    }, rough: k2 ? 0.35 : 0.65, metal: n2.armorMetal * 0.8, detail: k2 ? B.METAL : B.LEATHER, wear: 0.6, zone: z_.ARMOR, skin: (e6) => [`hips`, r3, z(0.98 * i2, 0.8 * i2, e6.p.y)] });
  }
  if (n2.pauldrons) for (let t3 = 0; t3 < 2; t3 += 1) {
    let r3 = Vx(t3), i3 = t3 === 0 ? 1 : -1, o3 = Ux(a2.upperArmL, t3), s3 = X_([[0.08, -0.028], [0.078, 0], [0.068, 0.025], [0.042, 0.045], [0, 0.05]], d2 ? 8 : 10, { sz: 0.95 });
    if (s3.rotateZ(-i3 * 0.5).translate(o3[0] + i3 * 0.012, o3[1] + 0.022, o3[2]), C2.add(s3, { color: n2.pauldrons, rough: k2 ? 0.28 : 0.5, metal: +!!k2, detail: k2 ? B.METAL : B.BONE, wear: 0.4, zone: k2 ? z_.ARMOR : z_.BODY, skin: () => [`shoulder_${r3}`, `upperArm_${r3}`, 0.5], name: `pauldron` }), e4 === `bloodwitch`) for (let e5 = 0; e5 < 2; e5 += 1) C2.add(iv([o3[0] + i3 * 0.03, o3[1] + 0.06, o3[2] - 0.02 + e5 * 0.04], [i3 * 0.5, 1, 0], 8e-3, 0.05, 4), { color: `#2a2224`, rough: 0.4, metal: 0.8, detail: B.METAL, skin: () => [`shoulder_${r3}`, `upperArm_${r3}`, 0.5] });
  }
  let ne2 = [], re2 = [];
  if (u2) {
    let t3 = e4 === `bloodwitch` ? 0.12 : e4 === `captain` ? 0.3 : 0.38, r3 = rv(d2 ? 5 : 8, d2 ? 4 : 7, (e5, r4) => {
      let a3 = Math.PI + R(-1.35, 1.35, e5), o3 = R(1.52 * i2, t3 * i2, r4), s3 = n2.tattered * (Math.sin(e5 * 23) * 0.5 + Math.sin(e5 * 51 + 2) * 0.5) * z(0.7, 1, r4) * 1.6, l3 = Math.sin(e5 * Math.PI * 4) * 0.012 * r4, u3 = c2.point(a3, Math.min(Math.max(o3, 0.8 * i2), 1.5 * i2), 0.03 + r4 * 0.07 + l3);
      return [u3[0] * (1 + r4 * 0.25), o3 + s3, u3[2] - r4 * 0.04];
    }, 8e-3, (e5) => new N(e5.x * 0.3, 0, -1).normalize());
    C2.add(r3, { name: `cape`, color: n2.cloak, colors: { 1: n2.cloakLining, 2: n2.cloakLining }, rough: 0.78, detail: B.CLOTH, wear: 0.5, mottle: 0.06, skin: Fv([`cape_1`, `cape_2`, `cape_3`, `cape_4`], m2, 0.7) });
    for (let t4 of [1, -1]) C2.add(X_([[0, -0.012], [0.014, -8e-3], [0.016, 4e-3], [0, 0.012]], 7, { sz: 0.5 }).rotateX(Math.PI / 2).translate(t4 * 0.1 * i2, 1.48 * i2, 0.07 * i2), { bone: `chest`, color: e4 === `bloodwitch` ? `#8a1420` : `#a08a5a`, rough: 0.3, metal: 1, detail: B.METAL });
    ne2.push({ id: `cape`, bones: [`cape_1`, `cape_2`, `cape_3`, `cape_4`], gravity: 0.8, inertia: 0.02, drag: 0.09, stiffness: 55, damping: 7, restX: 0.06, xMin: -0.05, xMax: 1.3, zMin: -0.5, zMax: 0.5, falloff: 0.88, sway: 0.03 });
  }
  (n2.longHair || e4 === `mercArcher`) && ne2.push({ id: `hair`, bones: [`hair_1`, `hair_2`], gravity: 0.6, inertia: 0.02, drag: 0.05, stiffness: 60, damping: 8, xMin: -0.05, xMax: 1, sway: 0.02 }), ne2.push({ id: `tassetF`, bones: [`tassetF_1`], gravity: 0.5, stiffness: 130, damping: 14, xMin: -0.9, xMax: 0.1 }, { id: `tassetB`, bones: [`tassetB_1`], gravity: 0.5, stiffness: 130, damping: 14, xMin: -0.1, xMax: 0.9 }), re2.push({ id: `tassetF`, side: -1, mode: `front` }, { id: `tassetB`, side: -1, mode: `back` });
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let r3 = Vx(t3), o3 = Mx(a2, t3, { radius: (e5, t4) => {
      if (e5 < t4) {
        let n4 = R(0.036, 0.028, z(0.1, t4, e5)) * i2 * (1 + 0.14 * Math.exp(-(((e5 - 0.08) / 0.08) ** 2)));
        return [n4, n4 * 0.95];
      }
      let n3 = R(0.03, 0.021, z(0.15, 1, (e5 - t4) / (1 - t4))) * i2;
      return [n3 * 0.92, n3];
    }, topIn: 0.045, topUp: 0.012, segs: d2 ? 6 : 7, rings: d2 ? 8 : 10 });
    C2.add(o3.geo, { color: k2 ? `#3a3430` : n2.skin, rough: 0.5, detail: k2 ? B.CLOTH : B.SKIN, skin: o3.skin, paint: (e5, t4) => {
      let n3 = T2(e5.p);
      n3 > 0 && !k2 && t4.lerp(w2, n3 * 0.85);
    } });
    let s3 = Px(a2, t3, { scale: 0.9 * i2, palmSegs: d2 ? 6 : 8, fingers: d2 ? 3 : 4 });
    C2.add(s3.palm, { bone: `hand_${r3}`, color: e4 === `captain` ? `#3a2818` : n2.skin, rough: 0.5, detail: e4 === `captain` ? B.LEATHER : B.SKIN, zone: z_.GLOVE }), C2.add(s3.fingers, { bone: `fingers_${r3}`, color: e4 === `captain` ? `#3a2818` : n2.skin, rough: 0.5, detail: e4 === `captain` ? B.LEATHER : B.SKIN, zone: z_.GLOVE });
    let c3 = Ux(a2.elbowL, t3), l3 = Ux(a2.wristL, t3), u3 = [0, 0.5, 1].map((e5) => [R(l3[0], c3[0], e5 * 0.6), R(l3[1] - 4e-3, c3[1], e5 * 0.6), R(l3[2], c3[2], e5 * 0.6)]);
    C2.add(V(u3, (e5) => [R(0.026, 0.033, e5) * i2, R(0.027, 0.034, e5) * i2], 7, 4), { bone: `foreArm_${r3}`, color: k2 ? n2.armor : `#2a1c14`, rough: k2 ? 0.3 : 0.6, metal: +!!k2, detail: k2 ? B.METAL : B.LEATHER, zone: z_.GLOVE, wear: 0.6 });
    let f3 = Nx(a2, t3, { radius: (e5, t4) => {
      let n3 = e5 < t4 ? R(0.068, 0.047, z(0.05, t4, e5)) : 0.043 + Math.sin((e5 - t4) / (1 - t4) * Math.PI) * 7e-3 - z(0.8, 1, e5) * 0.012;
      return [n3 * i2, n3 * 0.94 * i2];
    }, endAt: 0.9, segs: d2 ? 6 : 7, rings: d2 ? 7 : 9 });
    C2.add(f3.geo, { color: n2.legging, rough: 0.65, detail: B.CLOTH, skin: f3.skin, wear: 0.4 });
    let p3 = Ux(a2.ankleL, t3);
    C2.add(Fx(a2, t3, { width: 0.92, segs: d2 ? 7 : 8, rings: d2 ? 6 : 7 }), { color: n2.boot, rough: 0.55, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`foot_${r3}`, `toe_${r3}`, z(p3[2] + 0.1, p3[2] + 0.15, e5.p.z)], wear: 0.6 }), C2.add(Ix(a2, t3, 0.47 * i2, 0.035 * i2, 0.046 * i2, 8e-3, 8), { color: n2.boot, rough: 0.55, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`shin_${r3}`, `foot_${r3}`, z(0.16, 0.1, e5.p.y)], wear: 0.6 }), k2 && C2.add(X_([[0.05, 0.42 * i2], [0.056, 0.5 * i2], [0.05, 0.58 * i2]], 8, { sz: 1.1, phi0: -1.2, phiLen: 2.4, capStart: false, capEnd: false }).translate(p3[0], 0, Ux(a2.kneeL, t3)[2] + 4e-3), { bone: `shin_${r3}`, color: n2.armor, rough: 0.3, metal: 1, detail: B.METAL, zone: z_.BOOT });
  }
  let ie2 = c2.point(Math.PI + 0.45, 1.3 * i2, 0.05), ae2 = X_([[0, -0.2], [0.035, -0.19], [0.042, -0.05], [0.045, 0.15], [0.04, 0.18]], 8);
  ae2.rotateZ(-0.35).rotateX(0.15).translate(ie2[0], ie2[1], ie2[2] - 0.02), C2.add(ae2, { bone: `chest`, color: `#3a2618`, rough: 0.6, detail: B.LEATHER, wear: 0.6, name: `quiver` });
  for (let t3 = 0; t3 < (d2 ? 2 : 4); t3 += 1) {
    let n3 = new N(ie2[0] - 0.06 + t3 * 0.012, ie2[1] + 0.17, ie2[2] - 0.03 + t3 % 2 * 0.012);
    C2.add(V([[n3.x, n3.y - 0.02, n3.z], [n3.x - 0.03, n3.y + 0.07, n3.z - 0.01]], [6e-3, 0.014], 3, 2, { up: [0, 0, 1], capStart: true, capEnd: true }), { bone: `chest`, color: t3 % 2 ? `#c8c0b0` : e4 === `bloodwitch` ? `#8a1018` : `#5a4a3a`, rough: 0.8, detail: B.FUR });
  }
  let oe2 = _x(a2), se2 = pS[n2.bow]();
  if (n2.bowOnBack) {
    let e5 = c2.point(Math.PI - 0.3, 1.25 * i2, 0.07), t3 = new ir().setFromEuler(new Pr(0, 0, -0.5)).multiply(new ir().setFromEuler(new Pr(0, -Math.PI / 2, 0)));
    bx(C2, se2.builder.parts, `chest`, e5, t3, 1), C2.add(V([c2.point(0.6, 1.47 * i2, 0.012), c2.point(-0.9, 1.05 * i2, 0.014)], [4e-3, 0.014], 3, 8, { up: [0, 0, 1] }), { bone: `chest`, color: `#3a2618`, rough: 0.6, detail: B.LEATHER });
  } else {
    bx(C2, se2.builder.parts, `hand_L`, g2, v2, 1);
    let t3 = b2[0], n3 = b2[1], r3 = n3.clone().sub(t3), i3 = r3.lengthSq(), a3 = V([[t3.x, t3.y, t3.z], [x2.x, x2.y, x2.z], [n3.x, n3.y, n3.z]], 22e-4, 3, 10, { linear: true });
    C2.add(a3, { name: `string`, color: e4 === `bloodwitch` ? `#ff6a6a` : `#d8ccb0`, emit: e4 === `bloodwitch` ? 1.4 : 0, rough: 0.6, detail: B.CLOTH, ao: 0, occluder: false, skin: (e5) => {
      let n4 = e5.p.clone().sub(t3).dot(r3) / i3;
      return [`hand_L`, `bowString`, Math.max(0, 1 - Math.abs(n4 - 0.5) * 2)];
    } });
    let o3 = new cv();
    o3.merge(V([[_2[0], _2[1], _2[2] - 0.04], [_2[0], _2[1], _2[2] + 0.68]], 35e-4, 4, 2, { capStart: true, capEnd: true, linear: true }));
    let s3 = X_([[0, 0], [9e-3, 0.012], [0, 0.05]], 4);
    s3.rotateX(Math.PI / 2).translate(_2[0], _2[1], _2[2] + 0.67);
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let t4 = e5 / 3 * c_;
      o3.merge(V([[_2[0], _2[1], _2[2] - 0.03], [_2[0] + Math.sin(t4) * 0.016, _2[1] + Math.cos(t4) * 0.016, _2[2] + 0.03]], [1e-3, 0.012], 2, 2, { up: [Math.sin(t4), Math.cos(t4), 0], capStart: true, capEnd: true, linear: true }));
    }
    C2.add(o3, { bone: `arrow`, color: `#6a5038`, rough: 0.7, detail: B.WOOD, name: `arrow` }), C2.add(s3, { bone: `arrow`, color: e4 === `bloodwitch` ? `#ff3a3a` : `#9aa0a8`, emit: e4 === `bloodwitch` ? 2 : 0, rough: 0.3, metal: e4 === `bloodwitch` ? 0 : 1, detail: B.METAL }), oe2.weaponTip = { bone: `hand_L`, pos: [g2[0], g2[1] - 0.06, g2[2] + 0.12] }, oe2.castPoint = { bone: `hand_L`, pos: [g2[0], g2[1] - 0.06, g2[2] + 0.12] };
  }
  let ce2 = { kind: e4, gait: e4 === `captain` || e4 === `mercArcher` ? `archer` : `normal`, weapon: n2.bowOnBack ? `none` : `bow`, walkRef: e4 === `bloodwitch` ? 3.5 : 3, runRef: e4 === `bloodwitch` ? 6 : 5, armSwing: 0.32, crouch: 0.035, fingersOpen: 0.25, elbow: 0.3, armOut: 0.09, hunch: e4 === `hollowArcher` ? 0.12 : 0, headDown: e4 === `hollowArcher` ? 0.12 : 0.03, tauntStyle: e4 === `bloodwitch` ? `bowRaise` : e4 === `captain` ? `greet` : `weaponRaise`, specialStyle: `volley`, castStyle: `arcane`, townPose: e4 === `captain` ? `captain` : `none` };
  return hx({ key: e4 === `mercArcher` ? `ally:mercArcher` : e4 === `captain` ? `npc:captain` : `monster:${e4}:${t2}`, def: S2, mb: C2, height: r2, radius: e4 === `bloodwitch` ? 0.4 : 0.3, sockets: oe2, springs: ne2, contacts: vx(i2), animator: (e5) => new sx(n2.bowOnBack ? new ix(e5, a2, ce2) : new AS(e5, a2, ce2, new N(g2[0] - a2.wristL[0], g2[1] - a2.wristL[1], g2[2] - a2.wristL[2]), new N(_2[0] + a2.wristL[0], _2[1] - a2.wristL[1], _2[2] - a2.wristL[2])), e5, re2), equip: e4 === `mercArcher` ? { weapons: false, offHand: false, helm: true, helmScale: 0.98 * i2, helmOffset: [s2.center[0] - a2.head[0], s2.center[1] - a2.head[1], s2.center[2] - a2.head[2]] } : void 0, deadEmissive: 0.05 });
}
var NS, PS = t((() => {
  Ed(), U_(), zv(), lv(), __(), jS(), ax(), cx(), mx(), mS(), wx(), Wx(), NS = { hollowArcher0: { height: 1.8, skin: `#b3aaa5`, veins: `#1a1418`, eye: `#a8c8ff`, eyeGlow: 0.9, hair: `#141012`, armor: `#2c2420`, armorTrim: `#4a3a2c`, armorMetal: 0, legging: `#1a1614`, boot: `#241a14`, cloak: `#211c1c`, cloakLining: `#120e0e`, hood: true, crown: null, bow: `longbow`, tattered: 0.08 }, hollowArcher1: { height: 1.8, skin: `#a69a96`, veins: `#2a0a0e`, eye: `#ff6a5a`, eyeGlow: 1.1, hair: `#2a0e10`, armor: `#3a1a1a`, armorTrim: `#5a2a24`, armorMetal: 0, legging: `#1c1212`, boot: `#2a1814`, cloak: `#3a1416`, cloakLining: `#1a0808`, hood: true, crown: null, bow: `longbow`, tattered: 0.09 }, hollowArcher2: { height: 1.84, skin: `#bab0aa`, veins: `#140c14`, eye: `#b8d0ff`, eyeGlow: 1.2, hair: `#0e0c10`, armor: `#262024`, armorTrim: `#8a7a5a`, armorMetal: 0.4, legging: `#141216`, boot: `#1e1814`, cloak: `#1a1620`, cloakLining: `#0c0a10`, hood: true, crown: `bone`, bow: `longbow`, tattered: 0.07, pauldrons: `#cdbb92` }, bloodwitch0: { height: 2, skin: `#c6b0a8`, veins: `#3a0a10`, eye: `#ff2a2a`, eyeGlow: 2.6, hair: `#3a0a0e`, armor: `#1e1416`, armorTrim: `#8a1420`, armorMetal: 0.2, legging: `#160e10`, boot: `#1e1210`, cloak: `#7a0e16`, cloakLining: `#2a0508`, hood: false, crown: `thorn`, bow: `bloodBow`, tattered: 0.1, longHair: true, pauldrons: `#3a3034` }, mercArcher0: { height: 1.8, skin: `#d4a58a`, eye: `#4a6a3a`, eyeGlow: 0, hair: `#5a3a22`, armor: `#5e4028`, armorTrim: `#8a6a44`, armorMetal: 0, legging: `#3a3428`, boot: `#3a2818`, cloak: `#5a5e62`, cloakLining: `#3a3c40`, hood: false, crown: null, bow: `mercBow`, tattered: 0.02 }, captain0: { height: 1.82, skin: `#d9a88a`, eye: `#3a5a6a`, eyeGlow: 0, hair: `#7a3a1c`, armor: `#8e959e`, armorTrim: `#c8a24a`, armorMetal: 1, legging: `#2e2a26`, boot: `#3a2818`, cloak: `#283246`, cloakLining: `#3a1414`, hood: false, crown: null, bow: `mercBow`, bowOnBack: true, tattered: 0, pauldrons: `#8e959e` } };
}));
function FS(e4) {
  let t2 = e4 === `healer` ? 1.66 : e4 === `smith` ? 1.86 : 1.8, n2 = t2 / 1.85, r2 = e4 === `smith`, i2 = lx(dx(t2, r2 ? { shoulderX: 0.215 * n2, hipWidth: 0.1 * n2, armOut: 0.085 * n2, clavX: 0.042 * n2 } : { shoulderX: (e4 === `healer` ? 0.16 : 0.178) * n2, hipWidth: 0.092 * n2 })), a2 = e4 !== `smith`, o2 = Tx({ segs: 15, base: [0, i2.head[1] - 0.028 * n2, i2.head[2] + 0.016], scale: (e4 === `healer` ? 0.93 : 1) * n2, jaw: e4 === `healer` ? 0.92 : 1.2, chin: e4 === `healer` ? 1 : 1.2, brow: a2 ? 1.2 : 1.5, nose: e4 === `healer` ? 1.1 : 1.25, cheek: a2 ? 0.9 : 1.1, gaunt: a2 ? 0.6 : 0, lips: e4 === `healer` ? 0.7 : 0.8, width: r2 ? 1.08 : 0.98 }), s2 = e4 === `healer` ? `#d0a088` : e4 === `smith` ? `#b47a58` : `#c9a08a`, c2 = r2 ? new Lv([{ y: 0.8 * n2, rx: 0.17, rzf: 0.13, rzb: 0.13 }, { y: 0.95 * n2, rx: 0.178, rzf: 0.14, rzb: 0.135 }, { y: 1.1 * n2, rx: 0.18, rzf: 0.15, rzb: 0.13 }, { y: 1.25 * n2, rx: 0.2, rzf: 0.145, rzb: 0.13 }, { y: 1.4 * n2, rx: 0.22, rzf: 0.135, rzb: 0.125 }, { y: 1.48 * n2, rx: 0.21, rzf: 0.11, rzb: 0.11 }, { y: 1.53 * n2, rx: 0.12, rzf: 0.075, rzb: 0.085, cz: -0.01 }, { y: 1.6 * n2, rx: 0.07, rzf: 0.058, rzb: 0.066, cz: -8e-3 }, { y: 1.68 * n2, rx: 0.062, rzf: 0.045, rzb: 0.058, cz: -0.012 }]) : new Lv([{ y: 0.8 * n2, rx: 0.155, rzf: 0.11, rzb: 0.125 }, { y: 0.95 * n2, rx: 0.16, rzf: 0.112, rzb: 0.125 }, { y: 1.1 * n2, rx: 0.145, rzf: 0.11, rzb: 0.11 }, { y: 1.25 * n2, rx: 0.15, rzf: 0.112, rzb: 0.108 }, { y: 1.38 * n2, rx: 0.158, rzf: 0.108, rzb: 0.105 }, { y: 1.46 * n2, rx: 0.162, rzf: 0.092, rzb: 0.1 }, { y: 1.52 * n2, rx: 0.12, rzf: 0.07, rzb: 0.08, cz: -0.01 }, { y: 1.58 * n2, rx: 0.06, rzf: 0.05, rzb: 0.058, cz: -0.01 }, { y: 1.68 * n2, rx: 0.052, rzf: 0.038, rzb: 0.05, cz: -0.014 }]), l2 = r2 ? [{ name: `apron`, th0: -0.75, th1: 0.75 }] : [{ name: `robeFL`, th0: 0, th1: 1.6 }, { name: `robeFR`, th0: -1.6, th1: 0.02 }, { name: `robeB`, th0: 1.55, th1: 4.73 }], u2 = r2 ? 1.12 * n2 : 1.04 * n2, d2 = r2 ? 0.7 * n2 : 0.55 * n2, f2 = new fx(ux(i2, tS(c2, l2, u2, d2, `hips`))), p2 = new H_(), m2 = new P(`#6a4434`);
  p2.add(o2.geo, { bone: `head`, color: s2, paint: yx(o2, s2, { lip: e4 === `healer` ? `#8a5a52` : `#7a4a3a`, shadow: `#3a241c`, shadowK: a2 ? 0.55 : 0.45, blush: e4 === `healer` ? 0.14 : 0.06, lipK: 0.5, paint: (t3, n3) => {
    if (a2) {
      let e5 = (t3.y - o2.browY - 0.022) / 6e-3;
      t3.z > o2.center[2] + 0.05 && Math.abs(Math.sin(e5 * Math.PI)) < 0.25 && t3.y > o2.browY + 8e-3 && t3.y < o2.browY + 0.05 && n3.lerp(m2, 0.35);
      for (let e6 of o2.eyes) {
        let r3 = Math.abs(t3.x) - Math.abs(e6[0]) - 0.02;
        r3 > 0 && r3 < 0.012 && Math.abs(Math.sin((t3.y - e6[1]) * 600)) < 0.3 && Math.abs(t3.y - e6[1]) < 0.012 && n3.lerp(m2, 0.4);
      }
      for (let e6 of [1, -1]) {
        let r3 = (t3.y - o2.mouth[1]) / 0.04;
        r3 > -0.3 && r3 < 1 && Math.abs(t3.x - e6 * (0.026 + r3 * 6e-3)) < 35e-4 && t3.z > o2.mouth[2] - 0.03 && n3.lerp(m2, 0.45);
      }
    }
    if (e4 === `smith`) {
      let e5 = z(0.1, 0.5, o_(t3.x * 25, t3.y * 25, t3.z * 25, 2, 4));
      n3.lerp(new P(`#2a2420`), e5 * 0.5);
    }
  } }), rough: 0.55, detail: B.SKIN, wear: 0.3 }), p2.add(Dx(o2, 6), { bone: `head`, color: `#b0a8a0`, paint: Ox(o2, new P(`#b0a8a0`), new P(e4 === `sage` ? `#5a6a7a` : `#4a3a2a`)), rough: 0.15, detail: B.GEM, ao: 0.5 });
  let h2 = Ex(o2, 0.9);
  p2.add(h2.upper, { bone: `head`, color: `#2a1a14`, rough: 0.6, detail: B.HAIR }), p2.add(h2.lower, { bone: `head`, color: `#8a6050`, rough: 0.55, detail: B.SKIN });
  let g2 = e4 === `healer` ? `#a8a29a` : e4 === `smith` ? `#3a2416` : `#dedad2`;
  p2.add(jx(o2, e4 === `sage` ? 1.6 : 1.1, 0.8, e4 === `smith` ? 0.8 : 0), { bone: `head`, color: g2, rough: 0.6, detail: B.HAIR });
  for (let e5 = 0; e5 < 2; e5 += 1) p2.add(kx(o2.ears[e5], e5, 1 * n2), { bone: `head`, color: s2, rough: 0.55, detail: B.SKIN });
  let _2 = { bone: `head`, color: g2, rough: 0.5, detail: B.HAIR, zone: z_.HAIR, mottle: 0.08, mottleScale: 30 };
  if (e4 === `healer`) {
    let e5 = Mv(o2.shape, { th0: -2.35, th1: 2.35, nu: 14, nv: 6, yBot: (e6) => R(o2.browY + 0.03, o2.center[1] - 0.12, z(0.6, 2.2, Math.abs(e6))), yTop: () => o2.crown + 1e-3, off: (e6, t3) => 0.012 + (1 - t3) * 0.012 * z(0.8, 2.2, Math.abs(e6)), shape: (e6, t3, n3) => {
      if (n3 < 0.35 && Math.abs(t3) > 1) {
        let t4 = (0.35 - n3) / 0.35;
        e6.y -= t4 * 0.08, e6.x *= 1 + t4 * 0.35, e6.z -= t4 * 0.03;
      }
    } });
    p2.add(e5, { bone: void 0, color: `#c8b896`, rough: 0.85, detail: B.CLOTH, wear: 0.4, zone: z_.HEADWEAR, skin: Pv(`head`, `neck`, o2.center[1] - 0.04, o2.center[1] - 0.12), name: `scarf` });
    for (let e6 of [1, -1]) p2.add(Bx([[e6 * (o2.rx - 0.012), o2.browY + 0.03, o2.center[2] + 0.07], [e6 * (o2.rx - 2e-3), o2.browY - 0.01, o2.center[2] + 0.06], [e6 * (o2.rx - 6e-3), o2.eyes[0][1] - 0.03, o2.center[2] + 0.055]], 0.01, 4e-3, 4, 4, 0.7, [e6, 0, 0.5]), { ..._2, zone: z_.BODY });
  } else if (e4 === `smith`) {
    p2.add(Rx(o2, { thick: 4e-3, front: -0.06, temple: -0.02, side: -0.02, nape: 0.07, volume: 2e-3, segs: 14, rings: 4 }), { ..._2, paint: (e6, t3) => {
      e6.p.y > o2.center[1] + 0.035 && t3.set(s2);
    } });
    let e5 = Mv(o2.shape, { th0: -1.7, th1: 1.7, nu: 12, nv: 5, yBot: (e6) => R(o2.base[1] - 5e-3, o2.eyes[0][1] - 0.07, z(0.7, 1.7, Math.abs(e6))), yTop: (e6) => Math.abs(e6) < 0.42 ? o2.mouth[1] - 0.012 : R(o2.mouth[1] - 6e-3, o2.eyes[0][1] - 0.03, z(0.42, 1.05, Math.abs(e6))), off: (e6, t3) => 4e-3 + (1 - t3) * 0.02 * (1 - 0.5 * z(1.1, 1.7, Math.abs(e6))), shape: (e6, t3, n3) => {
      if (n3 < 0.5 && Math.abs(t3) < 1) {
        let r3 = (0.5 - n3) / 0.5;
        e6.y -= r3 * r3 * 0.1 * (1 - Math.abs(t3)), e6.z += r3 * 0.02 * (1 - Math.abs(t3));
      }
    } });
    e5.noise(3e-3, 70, 2).computeNormals(), p2.add(e5, { bone: `head`, color: g2, rough: 0.6, detail: B.HAIR, mottle: 0.12, name: `beard` }), p2.add(zx([[0, o2.base[1] - 0.06, o2.mouth[2] - 0.015], [0, o2.base[1] - 0.12, o2.mouth[2] - 0.02], [0, o2.base[1] - 0.17, o2.mouth[2] - 0.035]], 0.013, 4, 5), { bone: `head`, color: g2, rough: 0.6, detail: B.HAIR }), p2.add(X_([[0.01, 0], [0.014, 6e-3], [0.014, 0.016], [0.01, 0.02]], 6).translate(0, o2.base[1] - 0.16, o2.mouth[2] - 0.033), { bone: `head`, color: `#8a8a8a`, rough: 0.4, metal: 1, detail: B.METAL });
    for (let e6 of [1, -1]) p2.add(Bx([[e6 * 4e-3, o2.mouth[1] + 0.016, o2.mouth[2] + 4e-3], [e6 * 0.026, o2.mouth[1] + 4e-3, o2.mouth[2] - 6e-3], [e6 * 0.034, o2.mouth[1] - 0.02, o2.mouth[2] - 0.016]], 0.012, 6e-3, 4, 4, 0.6, [0, 0.3, 1]), { bone: `head`, color: g2, rough: 0.6, detail: B.HAIR });
  } else {
    p2.add(Rx(o2, { thick: 8e-3, front: 0.07, temple: 0.02, side: -0.04, nape: 0.12, volume: 0.012, overEars: true, segs: 16, rings: 6 }), _2);
    let e5 = X_([[0.084, -0.01], [0.083, 0], [0.07, 0.03], [0.04, 0.046], [0, 0.05]], 12, { sx: o2.rx / 0.075, sz: o2.rz / 0.09 });
    e5.translate(o2.center[0], o2.crown - 0.045, o2.center[2] - 5e-3), p2.add(e5, { bone: `head`, color: `#3a2a4a`, rough: 0.75, detail: B.CLOTH, zone: z_.HEADWEAR, name: `skullcap` });
    let t3 = Mv(o2.shape, { th0: -1.7, th1: 1.7, nu: 12, nv: 6, yBot: (e6) => R(o2.base[1] - 5e-3, o2.eyes[0][1] - 0.07, z(0.7, 1.7, Math.abs(e6))), yTop: (e6) => Math.abs(e6) < 0.42 ? o2.mouth[1] - 0.012 : R(o2.mouth[1] - 6e-3, o2.eyes[0][1] - 0.03, z(0.42, 1.05, Math.abs(e6))), off: (e6, t4) => 4e-3 + (1 - t4) * 0.018 * (1 - 0.5 * z(1.1, 1.7, Math.abs(e6))), shape: (e6, t4, n3) => {
      if (n3 < 0.6 && Math.abs(t4) < 1.15) {
        let r3 = (0.6 - n3) / 0.6;
        e6.y -= r3 * r3 * 0.3 * (1 - Math.abs(t4) / 1.15), e6.z += r3 * 0.035 * (1 - Math.abs(t4) / 1.15), e6.x *= 1 - r3 * 0.3;
      }
    } });
    t3.noise(3e-3, 60, 3).computeNormals(), p2.add(t3, { color: g2, rough: 0.55, detail: B.HAIR, mottle: 0.08, name: `beard`, skin: (e6) => [`head`, `chest`, z(o2.base[1], o2.base[1] - 0.2, e6.p.y) * 0.4] });
    for (let e6 of [1, -1]) p2.add(Bx([[e6 * 4e-3, o2.mouth[1] + 0.016, o2.mouth[2] + 4e-3], [e6 * 0.028, o2.mouth[1] + 0, o2.mouth[2] - 6e-3], [e6 * 0.03, o2.mouth[1] - 0.05, o2.mouth[2] - 4e-3]], 0.012, 6e-3, 4, 4, 0.6, [0, 0.3, 1]), { bone: `head`, color: g2, rough: 0.55, detail: B.HAIR });
  }
  let v2 = c2.loft(1.45 * n2, 1.68 * n2, 12, 5, 0);
  p2.add(v2, { color: s2, rough: 0.55, detail: B.SKIN, skin: Pv(`neck`, `chest`, 1.6 * n2, 1.53 * n2) });
  let y2 = e4 === `smith` ? `#7a6a52` : e4 === `healer` ? `#5a5a3c` : `#2e2a52`, b2 = Mv(c2, { nu: 18, nv: 8, yBot: () => r2 ? 0.92 * n2 : 0.98 * n2, yTop: (e5) => Math.cos(e5) > 0.6 ? 1.5 * n2 : 1.55 * n2, off: () => 0.01 });
  if (p2.add(b2, { color: y2, rough: 0.85, detail: B.CLOTH, wear: 0.5, zone: z_.ARMOR, skin: (e5) => [`chest`, `spine`, z(1.24 * n2, 1.12 * n2, e5.p.y)], paint: e4 === `sage` ? (e5, t3) => {
    let n3 = Math.atan2(e5.p.x, e5.p.z);
    Math.abs(n3) < 0.06 && e5.p.z > 0 && t3.set(`#b8b8c8`);
  } : void 0, name: `shirt` }), e4 === `healer`) {
    let e5 = rv(14, 4, (e6, t4) => {
      let r4 = R(-2.6, 2.6, e6) + Math.PI, i3 = R(1.53 * n2, 1.28 * n2 - Math.abs(Math.sin(r4)) * 0.05, t4);
      return c2.point(r4, i3, 0.022 + t4 * 0.02);
    }, 0.01, (e6) => new N(e6.x, 0.3, e6.z).normalize());
    p2.add(e5, { color: `#6a3a2c`, colors: { 1: `#4a281e`, 2: `#7a4a38` }, rough: 0.95, detail: B.FUR, wear: 0.3, skin: () => [`chest`, `chest`, 0], name: `shawl` });
    let t3 = c2.point(1.2, 1 * n2, 0.07), r3 = H(0.09, 0.075, 0.04, 9, 6);
    r3.deform((e6) => {
      e6.y > 0.03 && (e6.y = 0.03 + (e6.y - 0.03) * 0.4);
    }), r3.rotateY(1.2).translate(t3[0], t3[1], t3[2]).computeNormals(), p2.add(r3, { bone: `hips`, color: `#5a3a22`, rough: 0.65, detail: B.LEATHER, wear: 0.6, name: `satchel` });
    for (let e6 = 0; e6 < 4; e6 += 1) {
      let n3 = 1.2 + (e6 - 1.5) * 0.12, r4 = [t3[0] + Math.sin(n3) * 0.01, t3[1] + 0.03, t3[2] + Math.cos(n3) * 0.01];
      p2.add(V([r4, [r4[0] + (e6 - 1.5) * 0.02, r4[1] + 0.07 + e6 % 2 * 0.03, r4[2] - 0.01]], (e7) => [4e-3, 0.012 * (1 - e7 * 0.4)], 3, 3, { up: [0, 0, 1], capStart: true, capEnd: true }), { bone: `hips`, color: e6 % 2 ? `#4a6a2a` : `#6a7a3a`, rough: 0.8, detail: B.CLOTH });
    }
    p2.add(V([c2.point(-0.55, 1.5 * n2, 0.025), c2.point(0.3, 1.25 * n2, 0.03), [t3[0], t3[1] + 0.03, t3[2]]], [4e-3, 0.016], 3, 12, { up: [0, 0, 1] }), { color: `#3a2618`, rough: 0.7, detail: B.LEATHER, skin: (e6) => [`chest`, `hips`, z(1.2 * n2, 1.05 * n2, e6.p.y)] });
  }
  if (e4 === `smith`) {
    let e5 = Mv(c2, { th0: -0.7, th1: 0.7, nu: 6, nv: 5, yBot: () => 1.08 * n2, yTop: () => 1.42 * n2, off: () => 0.02 });
    p2.add(e5, { color: `#3a2416`, rough: 0.55, detail: B.LEATHER, wear: 0.8, zone: z_.ARMOR, skin: (e6) => [`chest`, `spine`, z(1.24 * n2, 1.12 * n2, e6.p.y)], name: `apronBib` });
    for (let e6 of [1, -1]) p2.add(V([c2.point(e6 * 0.6, 1.42 * n2, 0.022), c2.point(e6 * 1.2, 1.5 * n2, 0.02), c2.point(e6 * 2.6, 1.3 * n2, 0.02)], [4e-3, 0.014], 3, 8, { up: [0, 0, 1] }), { bone: `chest`, color: `#2a1a10`, rough: 0.6, detail: B.LEATHER });
    let t3 = c2.point(0.35, 1 * n2, 0.04);
    p2.add(V([[t3[0], t3[1] - 0.02, t3[2]], [t3[0] + 0.02, t3[1] + 0.12, t3[2] + 0.01]], 6e-3, 4, 2, { capStart: true, capEnd: true }), { bone: `hips`, color: `#3a3a3a`, rough: 0.5, metal: 0.9, detail: B.METAL });
  }
  p2.add(Nv(c2, (r2 ? 1.06 : 1.02) * n2, 0.045, 0.012, 16, { offset: 0.018 }), { bone: `hips`, color: e4 === `sage` ? `#5a4a2a` : `#3a2618`, rough: 0.6, detail: e4 === `sage` ? B.CLOTH : B.LEATHER }), nS(p2, c2, l2, { yTop: u2, yBot: r2 ? 0.36 * n2 : 0.06, flare: r2 ? 0.05 : 0.12, folds: r2 ? 2 : 3, nu: r2 ? 5 : 6, nv: r2 ? 5 : 8, color: e4 === `smith` ? `#3a2416` : e4 === `healer` ? `#4a4a32` : `#2a264a`, lining: e4 === `smith` ? `#24160c` : `#2a2a1c`, trim: e4 === `sage` ? `#a8a8b8` : e4 === `healer` ? `#8a7a5a` : void 0, trimPbr: e4 === `sage` ? [0.4, 0.6] : [0.8, 0], rough: e4 === `smith` ? 0.55 : 0.85, detail: e4 === `smith` ? B.LEATHER : B.CLOTH, wear: 0.6, zone: z_.ARMOR, name: `robe` }, d2), e4 === `healer` && p2.add(Mv(c2, { nu: 16, nv: 2, yBot: () => 0.05, yTop: () => 0.35, off: (e5, t3) => 0.07 + (1 - t3) * 0.04 }), { color: `#b8a888`, rough: 0.85, detail: B.CLOTH, bone: `hips`, name: `underdress` });
  for (let t3 = 0; t3 < 2; t3 += 1) {
    let a3 = Vx(t3), o3 = Ux(i2.wristL, t3), c3 = Ux(i2.elbowL, t3), l3 = Mx(i2, t3, { radius: (t4, i3) => {
      let a4 = r2 ? 1.35 : 1;
      if (t4 < i3) {
        let e5 = R(0.045, 0.036, z(0.05, i3, t4)) * a4 * n2;
        return [e5, e5 * 0.95];
      }
      let o4 = (t4 - i3) / (1 - i3), s3 = e4 === `smith` ? 0 : z(0.5, 1, o4) * 0.016, c4 = (R(0.036, 0.026, z(0.15, 1, o4)) * a4 + s3) * n2;
      return [c4, c4];
    }, topIn: 0.05, topUp: 0.015, segs: 7, rings: 10 });
    p2.add(l3.geo, { color: y2, paint: (t4, n3) => {
      let r3 = (c3[1] - t4.p.y) / (c3[1] - o3[1]);
      if (e4 === `smith` && t4.p.y < R(c3[1], i2.upperArmL[1], 0.2)) {
        n3.set(s2);
        let e5 = z(0, 0.6, o_(t4.p.x * 20, t4.p.y * 20, t4.p.z * 20, 2, 9));
        n3.lerp(new P(`#1e1a16`), e5 * 0.6 * z(-0.2, 1, r3));
      }
      e4 === `sage` && r3 > 0.8 && n3.set(`#b8b8c8`);
    }, rough: 0.8, detail: e4 === `smith` ? B.SKIN : B.CLOTH, skin: l3.skin });
    let u3 = Px(i2, t3, { scale: (r2 ? 1.15 : 0.92) * n2, palmSegs: 8, fingerR: r2 ? 1.2 : 1 }), d3 = e4 === `smith` && t3 === 0;
    p2.add(u3.palm, { bone: `hand_${a3}`, color: d3 ? `#3a2416` : s2, rough: 0.55, detail: d3 ? B.LEATHER : B.SKIN }), p2.add(u3.fingers, { bone: `fingers_${a3}`, color: d3 ? `#3a2416` : s2, rough: 0.55, detail: d3 ? B.LEATHER : B.SKIN });
    let f3 = Nx(i2, t3, { radius: (e5, t4) => {
      let i3 = (e5 < t4 ? R(0.07, 0.05, e5 / t4) : 0.046 - (e5 - t4) * 0.02) * (r2 ? 1.25 : 1) * n2;
      return [i3, i3];
    }, endAt: 0.88, segs: 6, rings: 7 });
    p2.add(f3.geo, { color: e4 === `smith` ? `#4a3a2a` : `#3a3428`, rough: 0.8, detail: B.CLOTH, skin: f3.skin });
    let m3 = Ux(i2.ankleL, t3);
    p2.add(Fx(i2, t3, { width: r2 ? 1.15 : 0.95, height: r2 ? 1.1 : 0.9, segs: 8, rings: 7 }), { color: `#2e2016`, rough: 0.6, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`foot_${a3}`, `toe_${a3}`, z(m3[2] + 0.1, m3[2] + 0.15, e5.p.z)], wear: 0.7 }), p2.add(Ix(i2, t3, (r2 ? 0.36 : 0.26) * n2, 0.04 * n2 * (r2 ? 1.2 : 1), 0.046 * n2 * (r2 ? 1.2 : 1), 6e-3, 8), { color: `#2e2016`, rough: 0.6, detail: B.LEATHER, zone: z_.BOOT, skin: (e5) => [`shin_${a3}`, `foot_${a3}`, z(0.16, 0.1, e5.p.y)] });
  }
  let x2 = _x(i2);
  if (e4 === `smith`) bx(p2, pS.hammer().builder.parts, `hand_R`, gx(i2, 1), xx(), 1.15);
  else if (e4 === `sage`) {
    bx(p2, kv.shortStaff().builder.parts, `hand_R`, gx(i2, 1), xx(), 1.18);
    let e5 = pS.book(), t3 = gx(i2, 0);
    bx(p2, e5.builder.parts, `hand_L`, [t3[0] - 0.02, t3[1] - 0.04, t3[2] + 0.05], new ir().setFromEuler(new Pr(0.2, Math.PI / 2 - 0.3, 0)), 0.9);
  } else {
    let e5 = gx(i2, 0);
    p2.add(av(0.03, 6e-3, 12, 4).rotateX(Math.PI / 2).translate(e5[0] - 0.01, e5[1] - 0.04, e5[2] + 0.02), { bone: `hand_L`, color: `#6a4a2a`, rough: 0.5, detail: B.WOOD });
  }
  return hx({ key: `npc:${e4}`, def: f2, mb: p2, height: t2, radius: r2 ? 0.38 : 0.32, sockets: x2, springs: rS(l2, { stiffness: 110 }), contacts: vx(n2), animator: (t3) => new sx(new ix(t3, i2, { kind: e4, gait: e4 === `smith` ? `heavy` : `old`, weapon: e4 === `smith` ? `oneHand` : e4 === `sage` ? `staff` : `none`, walkRef: e4 === `smith` ? 2 : 1.5, runRef: 4, walkStride: e4 === `smith` ? 1.3 : 1, crouch: a2 ? 0.05 : 0.04, hunch: e4 === `healer` ? 0.28 : e4 === `sage` ? 0.2 : 0.06, headDown: a2 ? -0.05 : 0.04, armSwing: 0.22, elbow: 0.35, armOut: r2 ? 0.18 : 0.08, tauntStyle: `greet`, townPose: e4 === `healer` ? `clasped` : e4 === `smith` ? `hammer` : `book`, fingersOpen: 0.3, idleSway: 0.6, breath: 1.2 }), t3, iS(l2)) });
}
var IS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), mS(), Av(), wx(), Wx(), aS();
}));
function LS(e4) {
  let t2 = RS[e4], n2 = 1.9, r2 = n2 / 1.85, i2 = lx(dx(n2, { shoulderX: 0.19 * r2, hipWidth: 0.095 * r2, armOut: 0.06 * r2, jaw: true })), a2 = i_(300 + e4), o2 = Tx({ segs: 12, base: [0, i2.head[1] - 0.03 * r2, i2.head[2] + 0.012], scale: 0.98 * r2, jaw: 1.05, chin: 0.9, brow: 1.4, nose: 0.15, cheek: 1.6, gaunt: 2, socket: 2.2, lips: 0.2, width: 1 }), s2 = e4 === 1 ? 1.12 : 1, c2 = new Lv([{ y: 0.82 * r2, rx: 0.15 * s2, rzf: 0.11 * s2, rzb: 0.12 }, { y: 0.95 * r2, rx: 0.155 * s2, rzf: 0.115 * s2, rzb: 0.12 }, { y: 1.1 * r2, rx: 0.14 * s2, rzf: 0.12 * s2 * s2, rzb: 0.1 }, { y: 1.25 * r2, rx: 0.15 * s2, rzf: 0.11 * s2, rzb: 0.1 }, { y: 1.38 * r2, rx: 0.165, rzf: 0.1, rzb: 0.1 }, { y: 1.47 * r2, rx: 0.18, rzf: 0.09, rzb: 0.1 }, { y: 1.52 * r2, rx: 0.13, rzf: 0.07, rzb: 0.085, cz: -0.012 }, { y: 1.58 * r2, rx: 0.06, rzf: 0.048, rzb: 0.058, cz: -0.012 }, { y: 1.68 * r2, rx: 0.05, rzf: 0.036, rzb: 0.05, cz: -0.014 }]), l2 = [c2.point(0.3, 1 * r2, 0.03), [0.06, 0.75 * r2, 0.16], [0.07, 0.5 * r2, 0.17]], u2 = [{ name: `rag_1`, parent: `hips`, pos: l2[0] }, { name: `rag_2`, parent: `rag_1`, pos: l2[1] }];
  e4 === 2 && u2.push({ name: `chain_1`, parent: `neck`, pos: [0.06, 1.52 * r2, 0.09] }, { name: `chain_2`, parent: `chain_1`, pos: [0.08, 1.25 * r2, 0.12] });
  let d2 = new fx(ux(i2, u2)), f2 = new H_(), p2 = new P(t2.rot), m2 = new P(t2.bruise), h2 = (n3, r3 = {}) => ({ bone: n3, color: t2.flesh, paint: (t3, n4) => {
    let r4 = o_(t3.p.x * 9, t3.p.y * 9, t3.p.z * 9, 3, 11 + e4), i3 = o_(t3.p.x * 4, t3.p.y * 4 + 3, t3.p.z * 4, 2, 5);
    n4.lerp(p2, z(0.05, 0.45, r4) * 0.75), n4.lerp(m2, z(0.25, 0.55, i3) * 0.45), Math.abs(o_(t3.p.x * 30, t3.p.y * 30, t3.p.z * 30, 2, 2)) < 0.03 && n4.multiplyScalar(0.7);
  }, rough: 0.48, detail: B.FLESH, wear: 0.7, ...r3 }), g2 = o2.mouth[1], _2 = new P(`#1a0c0a`);
  f2.add(o2.geo, { ...h2(), name: `head`, paint: (e5, t3) => {
    h2().paint(e5, t3);
    let n3 = (e5.p.y - (o2.eyes[0][1] - 0.035)) / 0.018;
    e5.p.z > o2.center[2] + 0.06 && Math.abs(n3) < 1 && Math.abs(e5.p.x) < 0.01 * (1.4 - n3 * 0.3) && t3.lerp(_2, 0.9), Math.abs(e5.p.y - g2) < 8e-3 && e5.p.z > o2.center[2] + 0.04 && Math.abs(e5.p.x) < 0.04 && t3.lerp(_2, 0.9), Math.hypot((e5.p.x - 0.045) / 0.02, (e5.p.y - g2 - 0.01) / 0.014) < 1 && e5.p.z > o2.center[2] && t3.lerp(new P(`#4a1410`), 0.8);
    for (let n4 of o2.eyes) Math.hypot(e5.p.x - n4[0], e5.p.y - n4[1]) < 0.017 && e5.p.z > o2.center[2] + 0.03 && t3.lerp(_2, 0.6);
  }, skin: (e5) => [`head`, `jaw`, e5.p.z > o2.center[2] - 0.01 ? z(g2 + 4e-3, g2 - 0.01, e5.p.y) : z(g2 - 0.01, g2 - 0.04, e5.p.y) * 0.5] });
  for (let e5 of o2.eyes) f2.add(H(7e-3, 6e-3, 5e-3, 5, 3).translate(e5[0], e5[1], e5[2]), { bone: `head`, color: t2.eye, emit: 1.6, rough: 0.3, detail: B.EMISSIVE, ao: 0, occluder: false });
  let v2 = new cv();
  for (let e5 = 0; e5 < 6; e5 += 1) {
    if (e5 === 2) continue;
    let t3 = R(-0.8, 0.8, e5 / 5);
    v2.merge(H(5e-3, 9e-3, 4e-3, 4, 2).translate(Math.sin(t3) * 0.03, g2 + 6e-3, o2.mouth[2] - (1 - Math.cos(t3)) * 0.03 - 4e-3).rotateZ(a2() * 0.2 - 0.1));
  }
  f2.add(v2, { bone: `head`, color: `#b8a878`, rough: 0.5, detail: B.BONE }), f2.add(H(0.03, 0.012, 0.024, 7, 3).translate(0, g2, o2.mouth[2] - 0.022), { bone: `jaw`, color: `#1a0806`, rough: 0.4, detail: B.FLESH, ao: 0 });
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let t3 = 1.6 + e5 * 0.5, n3 = [Math.sin(t3) * o2.rx * 0.9, o2.crown - 0.04, o2.center[2] + Math.cos(t3) * o2.rz * 0.9];
    f2.add(Bx([n3, [n3[0] * 1.15, n3[1] - 0.07, n3[2] * 1.15], [n3[0] * 1.2, n3[1] - 0.15, n3[2] * 1.15 - 0.01]], 8e-3, 3e-3, 3, 4, 0.8, [Math.sin(t3), 0, Math.cos(t3)]), { bone: `head`, color: `#3a3628`, rough: 0.6, detail: B.HAIR });
  }
  let y2 = c2.loft(0.86 * r2, 1.68 * r2, 14, 10, 0);
  y2.computeNormals();
  let b2 = [0.075, 1.28 * r2, 0.1];
  y2.bulge(b2, [0.075, 0.09, 0.06], -0.035);
  for (let e5 of [1, -1]) y2.bulge([e5 * 0.08, 1.46 * r2, -0.04], [0.06, 0.05, 0.05], 0.01);
  y2.computeNormals();
  let x2 = new P(`#3a0e0c`);
  f2.add(y2, { ...h2(), name: `torso`, paint: (e5, t3) => {
    h2().paint(e5, t3);
    let n3 = Math.hypot((e5.p.x - b2[0]) / 0.07, (e5.p.y - b2[1]) / 0.085);
    e5.p.z > 0.02 && n3 < 1 && t3.lerp(x2, z(1, 0.7, n3)), e5.p.x < -0.02 && e5.p.z > 0 && e5.p.y > 1.2 * r2 && e5.p.y < 1.42 * r2 && Math.abs(Math.sin(e5.p.y * 95)) < 0.3 && t3.multiplyScalar(0.75);
  }, skin: (e5) => {
    let t3 = e5.p.y;
    return t3 > 1.58 * r2 ? [`neck`, `chest`, z(1.62 * r2, 1.58 * r2, t3)] : [`chest`, `spine`, z(1.24 * r2, 1.12 * r2, t3)];
  } });
  let S2 = new cv();
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let t3 = b2[1] + 0.06 - e5 * 0.04, n3 = [];
    for (let e6 = 0; e6 <= 4; e6 += 1) {
      let r3 = R(0.05, 0.9, e6 / 4);
      n3.push(c2.point(r3, t3 - e6 * 8e-3, -0.012 + Math.sin(e6 / 4 * Math.PI) * 0.012));
    }
    S2.merge(V(n3, [4e-3, 8e-3], 3, 5, { up: [0, 1, 0], capStart: true, capEnd: true }));
  }
  f2.add(S2, { bone: `chest`, color: `#c8b890`, rough: 0.55, detail: B.BONE, wear: 0.6, name: `ribs` });
  let C2 = { color: t2.rag, rough: 0.9, detail: B.CLOTH, wear: 0.95, mottle: 0.1, name: `rags` };
  for (let e5 = 0; e5 < 3; e5 += 1) {
    let t3 = [];
    for (let n3 = 0; n3 <= 14; n3 += 1) {
      let i3 = n3 / 14, a3 = R(-Math.PI, Math.PI, i3) + e5 * 0.6, o3 = R(1 * r2, 1.16 * r2, i3) + e5 * 0.12 * r2 + Math.sin(a3 * 2 + e5) * 0.015;
      t3.push(c2.point(a3, o3, 0.01));
    }
    f2.add(V(t3, [3e-3, 0.032], 3, 18, { up: [0, 1, 0] }), { ...C2, skin: (e6) => [`chest`, `spine`, z(1.24 * r2, 1.12 * r2, e6.p.y)] });
  }
  f2.add(rv(10, 3, (e5, t3) => {
    let n3 = R(-Math.PI, Math.PI, e5), i3 = (Math.sin(e5 * 37) * 0.5 + Math.sin(e5 * 11) * 0.5) * 0.06 * t3, a3 = c2.point(n3, R(1 * r2, 0.78 * r2, t3), 0.012 + t3 * 0.03);
    return [a3[0], R(1 * r2, 0.74 * r2, t3) + i3, a3[2]];
  }, 6e-3, (e5) => new N(e5.x, 0, e5.z).normalize(), { closedU: true }), { ...C2, bone: `hips` }), f2.add(rv(1, 5, (e5, t3) => {
    let n3 = l2[0];
    return [n3[0] + (e5 - 0.5) * 0.06, R(n3[1], 0.48 * r2, t3), n3[2] + t3 * 0.03];
  }, 5e-3, () => new N(0, 0, 1)), { ...C2, skin: Fv([`hips`, `rag_1`, `rag_2`], [[l2[0][0], l2[0][1] + 0.05, l2[0][2]], l2[0], l2[1]], 0.7) });
  for (let e5 = 0; e5 < 2; e5 += 1) {
    let t3 = Vx(e5), n3 = Mx(i2, e5, { radius: (e6, t4) => {
      let n4 = (e6 < t4 ? R(0.042, 0.03, z(0.05, t4, e6)) : R(0.032, 0.022, (e6 - t4) / (1 - t4))) * r2 * s2;
      return [n4, n4];
    }, topIn: 0.045, topUp: 0.01, segs: 6, rings: 9 });
    f2.add(n3.geo, { ...h2(), skin: n3.skin });
    let a3 = Px(i2, e5, { scale: 0.95 * r2, palmSegs: 6, fingerLen: 1.15, claws: 0.01, curl: 1.2 });
    f2.add(a3.palm, h2(`hand_${t3}`)), f2.add(a3.fingers, h2(`fingers_${t3}`)), f2.add(a3.claws, { bone: `fingers_${t3}`, color: `#2a2418`, rough: 0.4, detail: B.BONE });
    let o3 = Nx(i2, e5, { radius: (e6, t4) => {
      let n4 = (e6 < t4 ? R(0.064, 0.044, e6 / t4) : 0.04 - (e6 - t4) * 0.02) * r2 * s2;
      return [n4, n4];
    }, segs: 6, rings: 8 });
    f2.add(o3.geo, { ...h2(), skin: o3.skin });
    let c3 = Ux(i2.ankleL, e5);
    f2.add(Fx(i2, e5, { width: 1.05 * s2, height: 0.85, segs: 7, rings: 6 }), { ...h2(), skin: (e6) => [`foot_${t3}`, `toe_${t3}`, z(c3[2] + 0.1, c3[2] + 0.15, e6.p.z)] });
    let l3 = Ux(i2.kneeL, e5);
    for (let e6 = 0; e6 < 2; e6 += 1) f2.add(av(0.05 * r2 * s2, 0.01, 10, 3, 0.02).translate(l3[0], R(l3[1], c3[1], 0.3 + e6 * 0.35), R(l3[2], c3[2], 0.4)), { ...C2, bone: `shin_${t3}` });
  }
  let w2 = [{ id: `rag`, bones: [`rag_1`, `rag_2`], gravity: 0.7, stiffness: 70, damping: 8, inertia: 0.02, drag: 0.05, xMin: -0.9, xMax: 0.6, sway: 0.03 }];
  if (e4 === 2) {
    f2.add(av(0.075, 0.016, 14, 5, 0.025).translate(0, 1.55 * r2, -0.01), { bone: `neck`, color: `#4a4440`, rough: 0.5, metal: 0.9, detail: B.METAL, wear: 0.8 });
    let e5 = new cv();
    for (let t4 = 0; t4 < 6; t4 += 1) {
      let n3 = t4 / 6, i3 = [R(0.06, 0.085, n3), R(1.52 * r2, 1.2 * r2, n3), R(0.09, 0.13, n3)];
      e5.merge(av(0.016, 5e-3, 8, 3).rotateY(t4 % 2 ? Math.PI / 2 : 0).translate(i3[0], i3[1], i3[2]));
    }
    f2.add(e5, { color: `#4a4440`, rough: 0.5, metal: 0.9, detail: B.METAL, wear: 0.85, skin: Fv([`neck`, `chain_1`, `chain_2`], [[0.05, 1.55 * r2, 0.08], [0.06, 1.52 * r2, 0.09], [0.08, 1.25 * r2, 0.12]], 0.7) }), w2.push({ id: `chain`, bones: [`chain_1`, `chain_2`], gravity: 0.9, stiffness: 60, damping: 6, inertia: 0.03, drag: 0.02, xMin: -0.6, xMax: 0.8 });
    for (let e6 = 0; e6 < 3; e6 += 1) f2.add(iv(c2.point(2.4 + e6 * 0.25, 1.4 * r2 - e6 * 0.06, 0), [0.4, 0.3, -1], 8e-3, 0.09, 4), { bone: `chest`, color: `#5a4636`, rough: 0.6, metal: 0.7, detail: B.METAL, wear: 0.9 });
    let t3 = V([[0.13, 1 * r2, 0.05], [0.16, 0.92 * r2, 0.06], [0.17, 0.82 * r2, 0.03], [0.15, 0.78 * r2, -0.01], [0.13, 0.81 * r2, -0.02]], 7e-3, 5, 8, { capStart: true, capEnd: true });
    f2.add(t3, { bone: `hips`, color: `#5a4636`, rough: 0.55, metal: 0.8, detail: B.METAL, wear: 0.9 });
  }
  return hx({ key: `monster:rotwalker:${e4}`, def: d2, mb: f2, height: n2, radius: 0.36, sockets: _x(i2, { mouthZ: 0.1 }), springs: w2, contacts: vx(r2), animator: (e5) => new sx(new ix(e5, i2, { kind: `rotwalker`, gait: `shamble`, weapon: `smash`, walkRef: 1.3, runRef: 2, walkStride: 1.15, runStride: 1.5, walkStance: 0.66, stepH: 0.06, crouch: 0.05, hunch: 0.28, headDown: -0.1, limp: 0.85, dangleArm: 1, armSwing: 0.2, armOut: 0.12, elbow: 0.25, tauntStyle: `roar`, specialStyle: `lunge`, deathStyle: `forward`, fingersOpen: 0.5, idleSway: 1.4 }), e5, []), deadEmissive: 0 });
}
var RS, zS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), cx(), mx(), wx(), Wx(), RS = { 0: { flesh: `#6e7a5c`, rot: `#3a4430`, bruise: `#5a3a4a`, rag: `#8a8068`, eye: `#d8c84a` }, 1: { flesh: `#7c8c98`, rot: `#46525e`, bruise: `#3a4a6a`, rag: `#6e7468`, eye: `#9ae0ff` }, 2: { flesh: `#66704e`, rot: `#323a28`, bruise: `#5a2a3a`, rag: `#6a5e48`, eye: `#ffb03a` } };
}));
function BS() {
  let e4 = 2.4, t2 = lx({ height: e4, hip: 0.95, hipWidth: 0.18, knee: 0.5, ankle: 0.12, spine: 1.2, chest: 1.6, neck: 2, head: 2.05, shoulderY: 1.95, shoulderX: 0.42, clavX: 0.12, elbow: 1.42, wrist: 0.95, handLen: 0.3, armOut: 0.12, hunch: 0.12, footLen: 0.38, toes: false, fingers: true, jaw: false }), n2 = new fx(ux(t2)), r2 = new H_(), i2 = i_(77), a2 = new P(`#4a6428`), o2 = new P(`#1a1410`), s2 = new P(`#ffb04a`), c2 = (e5) => e5.y > 1.5 && e5.y < 1.95 && e5.z > 0.15 || Math.abs(e5.x) > 0.45 && e5.y > 1 && e5.y < 1.4 ? +(Math.abs(o_(e5.x * 9, e5.y * 9, e5.z * 9, 1, 21)) < 0.018) : 0, l2 = (e5, t3 = {}) => ({ bone: e5, color: `#7a6a56`, paint: (e6, t4) => {
    let n3 = o_(e6.p.x * 5, e6.p.y * 5, e6.p.z * 5, 3, 3);
    t4.multiplyScalar(0.8 + n3 * 0.4), t4.lerp(new P(`#5e5a52`), z(-0.1, 0.4, o_(e6.p.x * 2, e6.p.y * 2, e6.p.z * 2, 2, 8)) * 0.5), e6.n.y > 0.45 && t4.lerp(a2, z(0.45, 0.85, e6.n.y) * z(-0.05, 0.3, o_(e6.p.x * 6, e6.p.y * 6, e6.p.z * 6, 2, 13)) * 0.85), Math.abs(o_(e6.p.x * 11, e6.p.y * 11, e6.p.z * 11, 2, 5)) < 0.025 && t4.lerp(o2, 0.85), c2(e6.p) && e6.p.z > -0.05 && t4.copy(s2);
  }, pbr: (e6, t4) => {
    c2(e6.p) && e6.p.z > -0.05 && (t4[2] = 1.5);
  }, rough: 0.88, detail: B.STONE, wear: 0.3, ...t3 }), u2 = new Lv([{ y: 0.85, rx: 0.3, rzf: 0.24, rzb: 0.24, p: 2.6 }, { y: 1.05, rx: 0.32, rzf: 0.26, rzb: 0.25, p: 2.6, cz: 0.02 }, { y: 1.35, rx: 0.4, rzf: 0.3, rzb: 0.28, p: 2.8, cz: 0.05 }, { y: 1.65, rx: 0.48, rzf: 0.34, rzb: 0.3, p: 3, cz: 0.08 }, { y: 1.92, rx: 0.46, rzf: 0.3, rzb: 0.3, p: 3, cz: 0.09 }, { y: 2.08, rx: 0.3, rzf: 0.22, rzb: 0.24, p: 2.6, cz: 0.08 }, { y: 2.15, rx: 0.16, rzf: 0.14, rzb: 0.16, cz: 0.1 }]), d2 = u2.loft(0.8, 2.15, 16, 12, 0, { capStart: true, capEnd: true });
  d2.noise(0.035, 3.5, 1, 3), d2.computeNormals(), r2.add(d2, { ...l2(), name: `torso`, skin: (e5) => {
    let t3 = e5.p.y;
    return t3 > 1.5 ? [`chest`, `spine`, z(1.6, 1.45, t3)] : [`spine`, `hips`, z(1.15, 0.95, t3)];
  } });
  let f2 = new cv();
  for (let e5 = 0; e5 < 7; e5 += 1) {
    let t3 = e5 / 7 * Math.PI * 2 + 0.3, n3 = 1.55 + e5 % 3 * 0.15, r3 = u2.point(t3, n3, 0.04), a3 = ev(0.22 + i2() * 0.1, 0.18 + i2() * 0.08, 0.08, 0.035, 8);
    a3.noise(0.02, 6, e5).computeNormals(), a3.rotateY(t3).translate(r3[0], r3[1], r3[2]), f2.merge(a3);
  }
  r2.add(f2, { ...l2(`chest`), name: `plates` });
  let p2 = [0, 2.1, 0.22], m2 = H(0.16, 0.14, 0.15, 10, 7);
  m2.noise(0.025, 7, 4).computeNormals(), m2.translate(...p2), r2.add(m2, { ...l2(`head`), name: `head` });
  for (let e5 of [1, -1]) {
    let t3 = H(0.035, 0.012, 0.02, 6, 3);
    t3.rotateZ(e5 * 0.25).translate(p2[0] + e5 * 0.06, p2[1] + 0.01, p2[2] + 0.135), r2.add(t3, { bone: `head`, color: `#ffc060`, emit: 3.6, rough: 0.3, detail: B.EMISSIVE, ao: 0, occluder: false, name: `eyes` });
  }
  for (let e5 = 0; e5 < 2; e5 += 1) {
    let n3 = Vx(e5), i3 = e5 === 0 ? 1 : -1, a3 = Ux(t2.upperArmL, e5), o3 = Ux(t2.elbowL, e5), s3 = Ux(t2.wristL, e5), c3 = H(0.24, 0.2, 0.22, 10, 7);
    c3.noise(0.04, 5, e5 + 9).computeNormals(), c3.translate(a3[0] + i3 * 0.02, a3[1] + 0.08, a3[2]), r2.add(c3, { ...l2(), skin: () => [`shoulder_${n3}`, `upperArm_${n3}`, 0.6], name: `shoulder` });
    let u3 = V([[a3[0], a3[1] + 0.05, a3[2]], o3], (e6) => 0.15 - e6 * 0.03, 9, 6, { capStart: true, capEnd: true });
    u3.noise(0.025, 6, e5).computeNormals(), r2.add(u3, { ...l2(`upperArm_${n3}`), name: `upperArm` });
    let d3 = V([o3, [s3[0], s3[1] + 0.05, s3[2]]], (e6) => 0.13 + e6 * 0.04, 9, 6, { capStart: true, capEnd: true });
    d3.noise(0.025, 6, e5 + 3).computeNormals(), r2.add(d3, { ...l2(`foreArm_${n3}`), name: `foreArm` });
    let f3 = ev(0.24, 0.26, 0.26, 0.07, 10);
    f3.noise(0.02, 8, e5 + 5).computeNormals(), f3.translate(s3[0] + i3 * 0.01, s3[1] - 0.14, s3[2] + 0.02), r2.add(f3, { ...l2(`hand_${n3}`), name: `fist` });
    let p3 = ev(0.2, 0.08, 0.22, 0.035, 8);
    p3.translate(s3[0] - i3 * 0, s3[1] - 0.28, s3[2] + 0.03), r2.add(p3, { ...l2(`fingers_${n3}`), name: `knuckles` });
    let m3 = Ux(t2.hipL, e5), h2 = Ux(t2.kneeL, e5), g2 = Ux(t2.ankleL, e5), _2 = V([[m3[0], m3[1] + 0.05, m3[2]], h2], (e6) => 0.17 - e6 * 0.02, 9, 5, { capStart: true, capEnd: true });
    _2.noise(0.02, 6, e5 + 11).computeNormals(), r2.add(_2, { ...l2(`thigh_${n3}`), name: `thigh` });
    let v2 = V([h2, [g2[0], g2[1] + 0.05, g2[2]]], (e6) => 0.15 + e6 * 0.03, 9, 5, { capStart: true, capEnd: true });
    v2.noise(0.02, 6, e5 + 13).computeNormals(), r2.add(v2, { ...l2(`shin_${n3}`), name: `shin` });
    let y2 = ev(0.3, 0.16, 0.44, 0.05, 8);
    y2.noise(0.015, 8, e5).computeNormals(), y2.translate(g2[0], 0.08, g2[2] + 0.08), r2.add(y2, { ...l2(`foot_${n3}`), name: `foot` });
  }
  return hx({ key: `ally:earthGolem`, def: n2, mb: r2, height: e4, radius: 0.62, sockets: _x(t2, { castZ: 0.6 }), contacts: vx(2.2), animator: (e5) => new ix(e5, t2, { kind: `earthGolem`, gait: `brute`, weapon: `claw`, walkRef: 3, runRef: 5, walkStride: 2, runStride: 2.8, stepH: 0.16, crouch: 0.06, bob: 0.04, runBob: 0.07, footSpread: 0.06, armOut: 0.22, elbow: 0.5, armSwing: 0.45, hunch: 0.2, headDown: 0, tauntStyle: `roar`, specialStyle: `stomp`, deathStyle: `crumble`, fingersOpen: 0.2, mass: 2.2 }), deadEmissive: 0, build: { grime: { height: 0.5, amount: 0.4 }, ao: { res: 64, dist: 0.35, strength: 1 } } });
}
var VS = t((() => {
  Ed(), U_(), zv(), lv(), __(), ax(), mx(), wx(), Wx();
}));
function HS() {
  let e4 = i_(404), t2 = { hips: [0, 1.9, 0], spine: [0, 2.3, 0], chest: [0, 2.85, 0.03], neck: [0, 3.42, 0.06], head: [0, 3.6, 0.1], shoulder: [0.12, 3.28, 0.02], upperArm: [0.38, 3.3, 0], elbow: [0.5, 2.52, 0.02], wrist: [0.6, 1.78, 0.05], fingers: [0.63, 1.58, 0.05] }, n2 = (e5, t3) => [e5[0] * t3, e5[1], e5[2]], r2 = [{ name: `hips`, parent: null, pos: t2.hips }, { name: `spine`, parent: `hips`, pos: t2.spine }, { name: `chest`, parent: `spine`, pos: t2.chest }, { name: `neck`, parent: `chest`, pos: t2.neck }, { name: `head`, parent: `neck`, pos: t2.head }, { name: `hair_1`, parent: `head`, pos: [0, 3.7, -0.12] }, { name: `hair_2`, parent: `hair_1`, pos: [0, 3.05, -0.28] }];
  for (let e5 of WS) {
    let i3 = e5 === 1 ? `L` : `R`;
    r2.push({ name: `shoulder_${i3}`, parent: `chest`, pos: n2(t2.shoulder, e5) }, { name: `upperArm_${i3}`, parent: `shoulder_${i3}`, pos: n2(t2.upperArm, e5) }, { name: `foreArm_${i3}`, parent: `upperArm_${i3}`, pos: n2(t2.elbow, e5) }, { name: `hand_${i3}`, parent: `foreArm_${i3}`, pos: n2(t2.wrist, e5) }, { name: `fingers_${i3}`, parent: `hand_${i3}`, pos: n2(t2.fingers, e5) });
  }
  let i2 = [[`gownF`, 0], [`gownB`, Math.PI], [`gownL`, Math.PI / 2], [`gownR`, -Math.PI / 2]], a2 = (e5) => [[Math.sin(e5) * 0.22, 1.82, Math.cos(e5) * 0.2], [Math.sin(e5) * 0.42, 1.15, Math.cos(e5) * 0.4], [Math.sin(e5) * 0.62, 0.5, Math.cos(e5) * 0.6]];
  for (let [e5, t3] of i2) {
    let n3 = a2(t3);
    r2.push({ name: `${e5}_1`, parent: `hips`, pos: n3[0] }, { name: `${e5}_2`, parent: `${e5}_1`, pos: n3[1] }, { name: `${e5}_3`, parent: `${e5}_2`, pos: n3[2] });
  }
  let o2 = [[0.9, 4.25, -0.55], [1.25, 3.45, -0.62], [1.05, 2.55, -0.55]], s2 = [[0.12, 3.15, -0.2], [0.13, 2.95, -0.21], [0.11, 2.72, -0.19]];
  for (let e5 of WS) {
    let t3 = e5 === 1 ? `L` : `R`;
    for (let i3 = 0; i3 < 3; i3 += 1) {
      let a3 = n2(s2[i3], e5), c3 = n2(o2[i3], e5), l3 = [R(a3[0], c3[0], 0.5), R(a3[1], c3[1], 0.5) + 0.12, R(a3[2], c3[2], 0.55)];
      r2.push({ name: `wing${t3}${i3}_1`, parent: `chest`, pos: a3 }, { name: `wing${t3}${i3}_2`, parent: `wing${t3}${i3}_1`, pos: l3 });
    }
  }
  let c2 = new fx(r2), l2 = new H_(), u2 = new Lv([{ y: 1.75, rx: 0.2, rzf: 0.17, rzb: 0.18 }, { y: 2, rx: 0.19, rzf: 0.15, rzb: 0.16 }, { y: 2.3, rx: 0.15, rzf: 0.12, rzb: 0.13, cz: 0.01 }, { y: 2.6, rx: 0.17, rzf: 0.14, rzb: 0.13, cz: 0.02 }, { y: 2.9, rx: 0.2, rzf: 0.15, rzb: 0.14, cz: 0.03 }, { y: 3.15, rx: 0.24, rzf: 0.13, rzb: 0.14, cz: 0.02 }, { y: 3.3, rx: 0.2, rzf: 0.1, rzb: 0.12, cz: 0.02 }, { y: 3.38, rx: 0.08, rzf: 0.07, rzb: 0.08, cz: 0.04 }, { y: 3.62, rx: 0.06, rzf: 0.055, rzb: 0.065, cz: 0.07 }]), d2 = u2.loft(1.75, 3.62, 16, 14, 0);
  d2.computeNormals();
  for (let e5 = 0; e5 < 4; e5 += 1) for (let t3 of WS) d2.bulge([t3 * 0.12, 2.75 + e5 * 0.09, 0.12], [0.06, 0.02, 0.04], 0.01);
  d2.computeNormals();
  let f2 = new P(US.poison), p2 = (e5) => {
    let t3 = e5.p.y;
    return t3 > 3.35 ? [`neck`, `chest`, z(3.42, 3.35, t3)] : t3 > 2.6 ? [`chest`, `spine`, z(2.7, 2.55, t3)] : [`spine`, `hips`, z(2.15, 1.95, t3)];
  };
  l2.add(d2, { color: US.skin, paint: (e5, t3) => {
    e5.p.y < 3 + Math.abs(e5.p.x) * 0.6 - (e5.p.z < 0 ? 0.15 : 0) && t3.set(US.gown);
    let n3 = Math.hypot(e5.p.x / 0.05, (e5.p.y - 2.95) / 0.07);
    e5.p.z > 0 && n3 < 1 && Math.abs(Math.sin(n3 * 6)) > 0.6 && t3.copy(f2);
  }, pbr: (e5, t3) => {
    let n3 = Math.hypot(e5.p.x / 0.05, (e5.p.y - 2.95) / 0.07);
    e5.p.z > 0 && n3 < 1 && Math.abs(Math.sin(n3 * 6)) > 0.6 && (t3[2] = 2.4), e5.p.y < 3 + Math.abs(e5.p.x) * 0.6 - (e5.p.z < 0 ? 0.15 : 0) && (t3[0] = 0.55, t3[1] = 0.1);
  }, rough: 0.5, detail: B.SKIN, wear: 0.4, skin: p2, name: `torso` });
  let m2 = new cv();
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let t3 = 2.92 - e5 * 0.11;
    for (let e6 of WS) {
      let n3 = [];
      for (let r3 = 0; r3 <= 5; r3 += 1) n3.push(u2.point(e6 * R(0.15, 1.4, r3 / 5), t3 - r3 * 0.012, 0.016));
      m2.merge(V(n3, [8e-3, 0.016], 3, 6, { up: [0, 1, 0], capStart: true, capEnd: true }));
    }
  }
  l2.add(m2, { color: US.bone, rough: 0.55, detail: B.BONE, wear: 0.6, skin: p2, name: `ribs` });
  let h2 = Tx({ segs: 18, base: [0, 3.52, 0.13], scale: 1.45, jaw: 0.85, chin: 1.2, brow: 1.4, nose: 0.6, cheek: 1.6, gaunt: 1, lips: 0.6, width: 0.92, height: 1.08, socket: 2 }), g2 = new P(US.tear), _2 = (e5) => Math.abs(o_(e5.x * 30, e5.y * 30, e5.z * 30, 2, 41)) < 0.022;
  l2.add(h2.geo, { bone: `head`, color: US.porcelain, paint: (e5, t3) => {
    t3.set(US.porcelain);
    for (let n3 of h2.eyes) {
      let r3 = e5.p.x - n3[0], i3 = Math.hypot(r3, (e5.p.y - n3[1]) * 1.3);
      i3 < 0.03 && e5.p.z > h2.center[2] && t3.lerp(g2, z(0.03, 0.018, i3));
      let a3 = n3[1] - e5.p.y, o3 = 6e-3 + a3 * 0.03;
      a3 > 0 && a3 < 0.22 && Math.abs(r3 + Math.sin(a3 * 30) * 4e-3) < o3 && e5.p.z > h2.center[2] + 0.05 && t3.lerp(g2, 0.92 * (1 - a3 / 0.26));
    }
    _2(e5.p) && t3.copy(f2), Math.abs(e5.p.y - h2.mouth[1]) < 6e-3 && Math.abs(e5.p.x) < 0.04 && e5.p.z > h2.center[2] && t3.set(`#140a0c`);
  }, pbr: (e5, t3) => {
    _2(e5.p) && (t3[2] = 2.2);
  }, rough: 0.14, detail: B.GEM, wear: 0.2, name: `mask` });
  for (let e5 of h2.eyes) l2.add(H(0.014, 0.01, 6e-3, 6, 4).translate(e5[0], e5[1], e5[2] - 4e-3), { bone: `head`, color: US.poison, emit: 4, rough: 0.3, detail: B.EMISSIVE, ao: 0, occluder: false, name: `eyes` });
  let v2 = new cv(), y2 = [];
  for (let e5 = 0; e5 <= 16; e5 += 1) {
    let t3 = e5 / 16 * Math.PI * 2;
    y2.push([Math.sin(t3) * (h2.rx + 0.02), h2.browY + 0.06 + (Math.cos(t3) < 0 ? 0.03 : 0), h2.center[2] + Math.cos(t3) * (h2.rz + 0.015)]);
  }
  v2.merge(V(y2, 0.012, 4, 22));
  for (let t3 = 0; t3 < 13; t3 += 1) {
    let n3 = t3 / 13 * Math.PI * 2, r3 = [Math.sin(n3) * (h2.rx + 0.022), h2.browY + 0.07, h2.center[2] + Math.cos(n3) * (h2.rz + 0.018)], i3 = 0.12 + e4() * 0.12 + (Math.cos(n3) > 0.6 ? 0.1 : 0);
    v2.merge(iv(r3, [Math.sin(n3) * 0.35, 1, Math.cos(n3) * 0.35], 0.012, i3, 4, 0.3));
  }
  l2.add(v2, { bone: `head`, color: US.iron, rough: 0.4, metal: 0.9, detail: B.METAL, wear: 0.5, name: `crown` });
  let b2 = [[0, 3.7, -0.12], [0, 3.05, -0.28], [0, 2.4, -0.35]], x2 = rv(6, 6, (e5, t3) => {
    let n3 = Math.PI + R(-1.4, 1.4, e5), r3 = R(h2.center[1] + 0.05, 2.45, t3), i3 = R(h2.rx + 0.02, 0.28, t3);
    return [Math.sin(n3) * i3, r3, h2.center[2] - 0.02 + Math.cos(n3) * R(h2.rz + 0.02, 0.24, t3) - t3 * 0.1];
  }, 0.02, (e5) => new N(e5.x * 0.4, 0, -1).normalize());
  l2.add(x2, { color: US.hair, colors: { 1: US.hair, 2: US.hair }, rough: 0.45, detail: B.HAIR, skin: Fv([`head`, `hair_1`, `hair_2`], [[0, 3.85, -0.05], b2[0], b2[1]], 0.7), name: `hair` });
  for (let e5 of WS) {
    let r3 = e5 === 1 ? `L` : `R`, i3 = n2(t2.upperArm, e5), a3 = n2(t2.elbow, e5), o3 = n2(t2.wrist, e5), s3 = n2(t2.fingers, e5), c3 = V([[i3[0] - e5 * 0.05, i3[1] + 0.04, i3[2]], i3, a3, o3], (e6) => {
      let t3 = e6 < 0.55 ? R(0.07, 0.048, e6 / 0.55) : R(0.05, 0.036, (e6 - 0.55) / 0.45);
      return [t3, t3 * 0.9];
    }, 8, 16, { capStart: true, capEnd: true, tension: 0.2 });
    l2.add(c3, { color: US.skin, paint: (e6, t3) => {
      Math.abs(o_(e6.p.x * 14, e6.p.y * 14, e6.p.z * 14, 2, 3)) < 0.03 && t3.lerp(new P(`#2a1a2a`), 0.6);
    }, rough: 0.5, detail: B.SKIN, skin: (e6) => {
      let t3 = e6.p.y;
      return t3 > i3[1] - 0.05 ? [`upperArm_${r3}`, `shoulder_${r3}`, z(i3[1] - 0.06, i3[1] + 0.05, t3) * 0.5] : [`upperArm_${r3}`, `foreArm_${r3}`, z(a3[1] + 0.06, a3[1] - 0.06, t3)];
    }, name: `arm` }), l2.add(rv(8, 2, (e6, t3) => {
      let n3 = e6 * Math.PI * 2, r4 = R(a3[1] + 0.25, a3[1] - 0.1, t3) + Math.sin(e6 * 17) * 0.04 * t3, i4 = 0.075 + t3 * 0.05;
      return [a3[0] + Math.sin(n3) * i4, r4, a3[2] + Math.cos(n3) * i4];
    }, 8e-3, (e6) => new N(e6.x - a3[0], 0, e6.z - a3[2]).normalize(), { closedU: true }), { color: US.gown, colors: { 1: US.lining, 2: US.gownHi }, rough: 0.7, detail: B.CLOTH, skin: (e6) => [`upperArm_${r3}`, `foreArm_${r3}`, z(a3[1] + 0.06, a3[1] - 0.06, e6.p.y)], name: `cuff` }), l2.add(H(0.04, 0.1, 0.06, 7, 5).translate(R(o3[0], s3[0], 0.4), R(o3[1], s3[1], 0.4), o3[2]), { bone: `hand_${r3}`, color: US.skin, rough: 0.5, detail: B.SKIN, name: `hand` });
    let u3 = new cv();
    for (let t3 = 0; t3 < 4; t3 += 1) {
      let n3 = o3[2] + R(0.05, -0.045, t3 / 3), r4 = 0.34 + (t3 === 1 ? 0.06 : 0), i4 = [[s3[0], s3[1] + 0.03, n3], [s3[0] - e5 * 0.03, s3[1] - r4 * 0.45, n3 * 1.02], [s3[0] - e5 * 0.1, s3[1] - r4 * 0.85, n3 * 1.04], [s3[0] - e5 * 0.16, s3[1] - r4, n3]];
      u3.merge(V(i4, (e6) => [0.016 * (1 - e6 * 0.85), 0.012 * (1 - e6 * 0.85)], 5, 7, { capStart: true, capEnd: true }));
    }
    l2.add(u3, { bone: `fingers_${r3}`, color: `#2a2024`, paint: (e6, t3) => {
      e6.p.y < s3[1] - 0.22 && t3.lerp(f2, 0.5);
    }, pbr: (e6, t3) => {
      e6.p.y < s3[1] - 0.28 && (t3[2] = 1.4);
    }, rough: 0.3, detail: B.BONE, name: `claws` });
  }
  let S2 = new Lv([{ y: 0, rx: 0.75, rzf: 0.7, rzb: 0.85 }, { y: 0.6, rx: 0.6, rzf: 0.56, rzb: 0.66 }, { y: 1.2, rx: 0.42, rzf: 0.38, rzb: 0.44 }, { y: 1.75, rx: 0.24, rzf: 0.2, rzb: 0.22 }, { y: 2.05, rx: 0.2, rzf: 0.16, rzb: 0.17 }]);
  for (let [, e5, t3, n3] of [[`F`, -0.85, 0.85, `gownF`], [`L`, 0.7, 2.45, `gownL`], [`B`, 2.3, 3.98, `gownB`], [`R`, -2.45, -0.7, `gownR`]]) {
    let r3 = i2.find((e6) => e6[0] === n3)[1], o3 = a2(r3), s3 = rv(9, 10, (n4, r4) => {
      let i3 = R(e5, t3, n4), a3 = R(2, -0.02, r4), o4 = (Math.sin(n4 * 29 + e5 * 4) * 0.5 + Math.sin(n4 * 63 + 1.7) * 0.5) * 0.09 * z(0.7, 1, r4), s4 = Math.sin(n4 * Math.PI * 5 + e5) * (0.01 + 0.05 * r4), c3 = S2.point(i3, Math.max(a3, 0), 0.02 + s4);
      return [c3[0], Math.max(-0.01, a3 + o4 + (r4 > 0.92 ? 0.02 : 0)), c3[2]];
    }, 0.012, (e6) => new N(e6.x, 0, e6.z).normalize());
    l2.add(s3, { color: US.gown, colors: { 1: US.lining, 2: US.gownHi }, paint: (e6, t4) => {
      if (e6.tag !== 0) return;
      t4.lerp(new P(US.gownHi), 0.25 * Math.max(0, Math.sin(e6.u * Math.PI * 5)));
      let n4 = o_(e6.p.x * 3, e6.p.y * 3, e6.p.z * 3, 2, 7);
      t4.multiplyScalar(0.85 + n4 * 0.3), e6.v > 0.88 && t4.multiplyScalar(0.55);
    }, rough: 0.62, detail: B.CLOTH, wear: 0.6, skin: Fv([`hips`, `${n3}_1`, `${n3}_2`, `${n3}_3`], [[o3[0][0] * 0.6, 2.05, o3[0][2] * 0.6], o3[0], o3[1], o3[2]], 0.65), name: `gown` });
  }
  l2.add(Mv(S2, { nu: 18, nv: 2, yBot: () => 1.92, yTop: () => 2.06, off: () => 0.04 }), { bone: `hips`, color: US.iron, rough: 0.4, metal: 0.8, detail: B.METAL, name: `cincture` });
  for (let e5 of WS) {
    let t3 = e5 === 1 ? `L` : `R`;
    for (let r3 = 0; r3 < 3; r3 += 1) {
      let i3 = n2(s2[r3], e5), a3 = n2(o2[r3], e5), c3 = [R(i3[0], a3[0], 0.5), R(i3[1], a3[1], 0.5) + 0.12, R(i3[2], a3[2], 0.55)], u3 = V([i3, [R(i3[0], c3[0], 0.5), R(i3[1], c3[1], 0.5) + 0.04, R(i3[2], c3[2], 0.5)], c3, [R(c3[0], a3[0], 0.5), R(c3[1], a3[1], 0.5) + 0.05, R(c3[2], a3[2], 0.5)], a3], (e6) => {
        let t4 = 1 + 0.5 * Math.exp(-(((e6 - 0.5) / 0.05) ** 2));
        return 0.035 * (1 - e6 * 0.85) * t4;
      }, 6, 14, { capStart: true, capEnd: true });
      for (let t4 = 0; t4 < 3; t4 += 1) {
        let n3 = 0.3 + t4 * 0.2, r4 = [R(i3[0], a3[0], n3), R(i3[1], a3[1], n3) + 0.1 * Math.sin(n3 * Math.PI), R(i3[2], a3[2], n3)];
        u3.merge(iv(r4, [e5 * 0.3, -0.6 - t4 * 0.2, -0.4], 0.012, 0.12 - t4 * 0.02, 4, 0.2));
      }
      l2.add(u3, { color: US.bone, paint: (e6, t4) => {
        let n3 = Math.hypot(e6.p.x - a3[0], e6.p.y - a3[1], e6.p.z - a3[2]);
        t4.lerp(new P(`#2a1a1e`), z(0.6, 0.1, n3) * 0.85);
      }, rough: 0.55, detail: B.BONE, wear: 0.6, skin: Fv([`wing${t3}${r3}_1`, `wing${t3}${r3}_2`], [i3, c3], 0.6), name: `wings` });
    }
    for (let r3 = 0; r3 < 2; r3 += 1) {
      let i3 = n2(o2[r3], e5), a3 = n2(o2[r3 + 1], e5), c3 = n2(s2[r3], e5), u3 = rv(4, 3, (t4, n3) => {
        let o3 = [R(R(c3[0], i3[0], 0.7), R(c3[0], a3[0], 0.7), t4), R(R(c3[1], i3[1], 0.7), R(c3[1], a3[1], 0.7), t4), R(R(c3[2], i3[2], 0.7), R(c3[2], a3[2], 0.7), t4)], s3 = Math.sin(t4 * 13 + r3) * 0.08;
        return [R(o3[0], c3[0] + e5 * 0.15, n3 * 0.6), R(o3[1], c3[1], n3 * 0.6) - s3 * n3, R(o3[2], c3[2], n3 * 0.6)];
      }, 6e-3, () => new N(0, 0, -1));
      l2.add(u3, { color: `#1a0e1c`, colors: { 1: `#120812`, 2: `#2a1830` }, rough: 0.75, detail: B.CLOTH, skin: () => [`wing${t3}${r3}_1`, `wing${t3}${r3 + 1}_1`, 0.5], name: `membrane` });
    }
  }
  return hx({ key: `monster:weepingQueen:0`, def: c2, mb: l2, height: 4.5, radius: 1.1, sockets: { rightHand: { bone: `hand_R`, pos: n2(t2.wrist, -1) }, leftHand: { bone: `hand_L`, pos: t2.wrist }, head: { bone: `head`, pos: [0, 3.75, 0.1] }, chest: { bone: `chest`, pos: [0, 2.95, 0.2] }, castPoint: { bone: `chest`, pos: [0, 2.9, 0.9] }, weaponTip: { bone: `fingers_R`, pos: [-0.75, 1.3, 0.05] }, mouth: { bone: `head`, pos: [0, 3.6, 0.3] }, back: { bone: `chest`, pos: [0, 3, -0.25] } }, springs: [...i2.map(([e5, t3]) => ({ id: e5, bones: [`${e5}_1`, `${e5}_2`, `${e5}_3`], gravity: 0.7, inertia: 0.03, drag: 0.12, stiffness: 45, damping: 6, restX: Math.cos(t3) * -0.02, xMin: -0.9, xMax: 0.9, zMin: -0.7, zMax: 0.7, falloff: 0.85, sway: 0.05, swaySpeed: 0.9 })), { id: `hair`, bones: [`hair_1`, `hair_2`], gravity: 0.6, inertia: 0.03, drag: 0.08, stiffness: 40, damping: 6, xMin: -0.1, xMax: 1.2, sway: 0.04, swaySpeed: 0.8 }], contacts: [[`hips`, 0.3], [`chest`, 0.25], [`head`, 0.2], [`hand_L`, 0.08], [`hand_R`, 0.08], [`foreArm_L`, 0.07], [`foreArm_R`, 0.07]], animator: (e5) => new YS(e5), deadEmissive: 0.1, build: { grime: { height: 0.3, amount: 0.3 }, ao: { res: 80, dist: 0.45, strength: 0.9 } } });
}
var US, WS, GS, KS, qS, JS, YS, XS = t((() => {
  Ed(), tm(), U_(), zv(), lv(), __(), mx(), wx(), Wx(), US = { skin: `#8a7c8e`, gown: `#2a1530`, gownHi: `#4a2a52`, lining: `#140a18`, porcelain: `#ece6dc`, tear: `#0e0a0c`, poison: `#7aff4a`, bone: `#d8ccb0`, iron: `#2e2a2c`, hair: `#0e0a10` }, WS = [1, -1], GS = new Pr(), KS = (e4) => f_(e4), qS = (e4) => p_(e4), JS = (e4) => m_(e4), YS = class {
    b = {};
    hipsBind = new N();
    wings = [];
    seed;
    playIndex = 0;
    constructor(e4) {
      for (let t2 of [`hips`, `spine`, `chest`, `neck`, `head`, `shoulder_L`, `shoulder_R`, `upperArm_L`, `upperArm_R`, `foreArm_L`, `foreArm_R`, `hand_L`, `hand_R`, `fingers_L`, `fingers_R`]) this.b[t2] = e4.bone(t2);
      this.hipsBind.copy(this.b.hips.position);
      for (let [t2, n2] of [[1, `L`], [-1, `R`]]) for (let r2 = 0; r2 < 3; r2 += 1) this.wings.push({ bones: [e4.bone(`wing${n2}${r2}_1`), e4.bone(`wing${n2}${r2}_2`)], side: t2, i: r2 });
      this.seed = e4.seed % 1e3 / 1e3;
    }
    onPlay(e4) {
      this.playIndex += 1;
    }
    evaluate(e4) {
      let t2 = e4.time, n2 = e4.p, r2 = 0, i2 = 0, a2 = 0, o2 = 0, s2 = 0, c2 = 0.08, l2 = 0, u2 = 0, d2 = 0.25, f2 = 0, p2 = 0.12, m2 = [0.25, 0.25], h2 = [0.18, 0.18], g2 = [0.2, 0.2], _2 = [0.35, 0.35], v2 = [0.2, 0.2], y2 = [0.3, 0.3], b2 = 0.25, x2 = 0, S2 = Math.sin(t2 * 1.1 + this.seed * 6) * 0.05;
      r2 += S2 + 0.04, s2 += Math.sin(t2 * 0.7) * 0.02, u2 += Math.sin(t2 * 0.7 + 1) * 0.03, p2 += Math.sin(t2 * 0.5) * 0.06, f2 += a_(t2 * 0.2, this.seed * 9, 1) * 0.25;
      for (let e5 = 0; e5 < 2; e5 += 1) m2[e5] += Math.sin(t2 * 0.9 + e5 * 2) * 0.05, y2[e5] += Math.sin(t2 * 3.1 + e5) * 0.15 * Math.max(0, Math.sin(t2 * 0.6));
      b2 += Math.sin(t2 * 0.8) * 0.05;
      let C2 = (e5) => [0, e5 * 0.6, e5, e5 + 0.18, 1], w2 = [JS, qS, KS, JS];
      switch (e4.state) {
        case `walk`:
        case `run`: {
          let n3 = e4.state === `run` ? 1 : 0.6;
          a2 += 0.12 * n3, c2 += 0.12 * n3, d2 -= 0.12 * n3;
          for (let e5 = 0; e5 < 2; e5 += 1) m2[e5] = -0.25 * n3 + Math.sin(t2 * 2 + e5 * Math.PI) * 0.12, h2[e5] = 0.25, _2[e5] = 0.2;
          b2 = 0.1, r2 += Math.sin(t2 * 3) * 0.03;
          break;
        }
        case `attack1`:
        case `attack2`: {
          let t3 = C2($p.attack1 ?? 0.55), r3 = +(e4.state === `attack1`), a3 = r3 === 1 ? 1 : -1;
          m2[r3] = L(n2, t3, [m2[r3], 2.2, 1, 0.3, m2[r3]], w2), h2[r3] = L(n2, t3, [h2[r3], 1.1, 0, -0.5, h2[r3]], w2), _2[r3] = L(n2, t3, [_2[r3], 1.6, 0.2, 0.4, _2[r3]], w2), y2[r3] = L(n2, t3, [0.3, -0.4, 0.6, 0.5, 0.3], w2), l2 += a3 * L(n2, t3, [0, -0.45, 0.35, 0.45, 0], w2), c2 += L(n2, t3, [0, -0.15, 0.35, 0.35, 0], w2), d2 += L(n2, t3, [0, -0.2, 0.2, 0.2, 0], w2), i2 = L(n2, t3, [0, -0.1, 0.25, 0.2, 0], w2), b2 += L(n2, t3, [0, 0.4, -0.1, 0, 0], w2);
          break;
        }
        case `cast`: {
          let e5 = C2($p.cast ?? 0.55);
          m2[1] = L(n2, e5, [m2[1], 0.9, 1.6, 1.5, m2[1]], w2), h2[1] = L(n2, e5, [h2[1], 0.6, 0.1, 0.15, h2[1]], w2), _2[1] = L(n2, e5, [_2[1], 1.6, 0.1, 0.2, _2[1]], w2), y2[1] = L(n2, e5, [0.3, 0.8, -0.6, -0.4, 0.3], w2), c2 += L(n2, e5, [0, -0.1, 0.2, 0.15, 0], w2), b2 += L(n2, e5, [0, 0.3, 0.6, 0.5, 0], w2);
          break;
        }
        case `castUp`:
        case `channel`:
        case `taunt`: {
          let i3 = e4.state === `channel`, a3 = i3 ? 1 : L(n2, [0, 0.35, 0.75, 1], [0, 1, 1, 0], [JS, null, JS]), o3 = i3 ? Math.sin(t2 * 1.5) : 0;
          for (let e5 = 0; e5 < 2; e5 += 1) m2[e5] = R(m2[e5], 2.4 + o3 * 0.15 * (e5 ? 1 : -1), a3), h2[e5] = R(h2[e5], 0.9, a3), _2[e5] = R(_2[e5], 0.35, a3), y2[e5] = R(y2[e5], -0.5, a3);
          c2 = R(c2, -0.25, a3), d2 = R(d2, -0.5, a3), r2 += 0.15 * a3, b2 = R(b2, 1, a3) + o3 * 0.1, x2 = e4.state === `taunt` ? Math.sin(t2 * 25) * 0.04 * a3 : 0;
          break;
        }
        case `special`: {
          let e5 = C2($p.special ?? 0.5);
          for (let t3 = 0; t3 < 2; t3 += 1) m2[t3] = L(n2, e5, [m2[t3], 0.7, 1.55, 1.5, m2[t3]], w2), h2[t3] = L(n2, e5, [h2[t3], 0.5, 0.2, 0.22, h2[t3]], w2), _2[t3] = L(n2, e5, [_2[t3], 1.8, 0.15, 0.2, _2[t3]], w2), y2[t3] = L(n2, e5, [0.3, 0.9, -0.7, -0.6, 0.3], w2);
          c2 += L(n2, e5, [0, -0.25, 0.4, 0.35, 0], w2), d2 += L(n2, e5, [0, -0.2, 0.3, 0.3, 0], w2), i2 = L(n2, e5, [0, -0.15, 0.3, 0.25, 0], w2), b2 += L(n2, e5, [0, 0.4, 1, 0.9, 0], w2);
          break;
        }
        case `hit`: {
          let e5 = L(n2, [0, 0.25, 1], [0, 1, 0], [KS, JS]);
          c2 -= 0.3 * e5, d2 -= 0.4 * e5, i2 -= 0.12 * e5;
          for (let t3 = 0; t3 < 2; t3 += 1) h2[t3] += 0.5 * e5;
          b2 += 0.3 * e5;
          break;
        }
        case `block`:
        case `kick`: {
          let e5 = L(n2, [0, 0.3, 0.75, 1], [0, 1, 1, 0], [KS, null, JS]);
          for (let t3 = 0; t3 < 2; t3 += 1) m2[t3] = R(m2[t3], 1.5, e5), h2[t3] = R(h2[t3], -0.2, e5), _2[t3] = R(_2[t3], 1.9, e5);
          c2 += 0.2 * e5, b2 = R(b2, -0.2, e5);
          break;
        }
        case `spin`:
          o2 = t2 * Math.PI * 2 * 1.4;
          for (let e5 = 0; e5 < 2; e5 += 1) m2[e5] = 1.4, h2[e5] = 1.2, _2[e5] = 0.1;
          b2 = 0.9;
          break;
        case `leap`:
          r2 += L(n2, [0, 0.2, 0.5, 0.8, 1], [0, -0.3, 0.6, -0.4, 0], [JS, KS, qS, JS]);
          for (let e5 = 0; e5 < 2; e5 += 1) m2[e5] = L(n2, [0, 0.2, 0.5, 0.8, 1], [0.25, -0.3, 2.6, 0.8, 0.25], [JS, KS, KS, JS]);
          b2 = L(n2, [0, 0.2, 0.5, 0.8, 1], [0.25, 0.1, 1, 0.5, 0.25], [JS, KS, KS, JS]);
          break;
        case `death`:
        case `dead`:
        case `resurrect`: {
          let t3 = e4.state === `dead` ? 1 : e4.state === `resurrect` ? 1 - m_(n2) : n2, o3 = [0, 0.15, 0.5, 0.85, 1], s3 = [KS, JS, qS, JS];
          r2 = L(t3, o3, [r2, r2 + 0.15, -0.6, -1.5, -1.52], s3), a2 = L(t3, o3, [0, -0.2, 0.3, 1.25, 1.3], s3), i2 = L(t3, o3, [0, -0.1, 0.1, 0.7, 0.72], s3), c2 = L(t3, o3, [c2, -0.4, 0.3, 0.2, 0.2], s3), d2 = L(t3, o3, [d2, -0.6, 0.4, -0.2, -0.2], s3), f2 += L(t3, o3, [0, 0.2, 0.4, 0.9, 0.9], s3);
          for (let e5 = 0; e5 < 2; e5 += 1) m2[e5] = L(t3, o3, [m2[e5], 1, 0.8, 2.6 + e5 * 0.3, 2.7 + e5 * 0.3], s3), h2[e5] = L(t3, o3, [h2[e5], 1.2, 0.6, 0.5 + e5 * 0.3, 0.55 + e5 * 0.3], s3), _2[e5] = L(t3, o3, [_2[e5], 0.3, 0.6, 0.4, 0.4], s3), y2[e5] = L(t3, o3, [y2[e5], -0.6, 0.4, 0.9, 0.9], s3);
          if (b2 = L(t3, o3, [b2, 1, 0.2, -0.45, -0.5], s3), e4.state === `resurrect` && n2 > 0.85) {
            let e5 = (n2 - 0.85) / 0.15;
            r2 = R(r2, 0.04, e5);
          }
          break;
        }
        default:
          break;
      }
      let T2 = this.b;
      T2.hips.position.set(this.hipsBind.x, this.hipsBind.y + r2, this.hipsBind.z + i2), T2.hips.quaternion.setFromEuler(GS.set(a2, o2, s2, `YXZ`)), T2.spine.quaternion.setFromEuler(GS.set(c2 * 0.4, l2 * 0.4, u2 * 0.5, `YXZ`)), T2.chest.quaternion.setFromEuler(GS.set(c2 * 0.6, l2 * 0.6, u2 * 0.5, `YXZ`)), T2.neck.quaternion.setFromEuler(GS.set(d2 * 0.4, f2 * 0.4, p2 * 0.4, `YXZ`)), T2.head.quaternion.setFromEuler(GS.set(d2 * 0.6, f2 * 0.6, p2 * 0.6, `YXZ`));
      for (let e5 = 0; e5 < 2; e5 += 1) {
        let t3 = e5 === 0 ? 1 : -1, n3 = e5 === 0 ? `L` : `R`;
        T2[`upperArm_${n3}`].quaternion.setFromEuler(GS.set(-m2[e5], t3 * g2[e5], t3 * h2[e5], `XZY`)), T2[`foreArm_${n3}`].quaternion.setFromEuler(GS.set(-_2[e5], 0, 0, `XYZ`)), T2[`hand_${n3}`].quaternion.setFromEuler(GS.set(0, 0, -t3 * v2[e5], `XZY`)), T2[`fingers_${n3}`].quaternion.setFromEuler(GS.set(0, 0, -t3 * y2[e5] * 0.7, `XYZ`));
      }
      for (let e5 of this.wings) {
        let n3 = b2 * (0.55 + e5.i * 0.15), r3 = Math.sin(t2 * 1.7 + e5.i * 0.9) * 0.04 + x2;
        e5.bones[0].quaternion.setFromEuler(GS.set(-n3 * 0.25, e5.side * n3 * 0.5, e5.side * (n3 * 0.35 + r3), `XYZ`)), e5.bones[1].quaternion.setFromEuler(GS.set(0, e5.side * n3 * 0.2, e5.side * (n3 * 0.25 + r3), `XYZ`));
      }
    }
  };
})), ZS, QS, $S, eC, tC, nC, rC, iC, aC, oC, sC, cC, lC, uC = t((() => {
  Ed(), tm(), __(), ub(), ZS = new Pr(), QS = new ir(), $S = new ir(), eC = new ir(), tC = new ir(), nC = new N(), rC = new N(), iC = new N(0, 0, 1), aC = new N(0, 0, -1), oC = (e4) => f_(e4), sC = (e4) => p_(e4), cC = (e4) => m_(e4), lC = class {
    rig;
    style;
    legs = [];
    b = {};
    hipsBind = new N();
    phase = 0;
    playIndex = 0;
    seed;
    constructor(e4, t2) {
      this.rig = e4, this.style = t2;
      let n2 = e4.template.def;
      for (let t3 of [`hips`, `spine`, `chest`, `neck`, `head`, `jaw`, `tail_1`, `quill_1`, `quill_2`, `quill_3`]) this.b[t3] = e4.hasBone(t3) ? e4.bone(t3) : void 0;
      this.hipsBind.copy(this.b.hips.position);
      let r2 = (t3, r3, i2, a2, o2, s2) => {
        let c2 = n2.pos(t3), l2 = n2.pos(r3), u2 = n2.pos(i2), d2 = n2.index.get(t3);
        this.legs.push({ upper: e4.bone(t3), lower: e4.bone(r3), foot: e4.bone(i2), iUpper: d2, iParent: n2.parentIndex[d2], L1: Math.hypot(l2[0] - c2[0], l2[1] - c2[1], l2[2] - c2[2]), L2: Math.hypot(u2[0] - l2[0], u2[1] - l2[1], u2[2] - l2[2]), dirU: new N(l2[0] - c2[0], l2[1] - c2[1], l2[2] - c2[2]).normalize(), dirL: new N(u2[0] - l2[0], u2[1] - l2[1], u2[2] - l2[2]).normalize(), home: new N(u2[0], u2[1], u2[2]), front: a2, phase: s2, side: o2 });
      };
      r2(`upperF_L`, `lowerF_L`, `footF_L`, true, 1, 0), r2(`upperF_R`, `lowerF_R`, `footF_R`, true, -1, 0.5), r2(`upperB_L`, `lowerB_L`, `footB_L`, false, 1, 0.5), r2(`upperB_R`, `lowerB_R`, `footB_R`, false, -1, 0), this.seed = e4.seed % 997 / 997, this.phase = this.seed;
    }
    onPlay(e4) {
      this.playIndex += 1;
    }
    evaluate(e4) {
      let t2 = e4.time, n2 = e4.p, r2 = this.style, i2 = 0, a2 = 0, o2 = 0, s2 = 0, c2 = 0, l2 = 0, u2 = -0.05, d2 = 0.05, f2 = 0, p2 = 0, m2 = 0, h2 = 0, g2 = this.legs.map(() => new N()), _2 = [0, 0, 0, 0], v2 = 1;
      if (f2 += a_(t2 * 0.6, this.seed * 7, 2) * 0.35, d2 += Math.sin(t2 * 7) * 0.03 * z(0.3, 1, Math.sin(t2 * 0.9 + this.seed * 5)), p2 += Math.max(0, Math.sin(t2 * 9)) * 0.05 * z(0.6, 1, Math.sin(t2 * 0.7)), i2 += Math.sin(t2 * 2.3) * 6e-3, m2 += Math.sin(t2 * 2.3) * 0.04, e4.state === `walk` || e4.state === `run`) {
        let t3 = e4.state === `run`, n3 = t3 ? r2.runRef : r2.walkRef, a3 = Math.max(0, e4.speed), s3 = (t3 ? r2.runStride : r2.walkStride) * l_(Math.sqrt(Math.max(0.05, a3) / n3), 0.5, 1.3);
        this.phase = s_(this.phase + e4.dt * a3 / Math.max(0.1, s3));
        let l3 = t3 ? 0.42 : 0.58, u3 = s3 * l3, p3 = (t3 ? r2.stepH * 1.6 : r2.stepH) * l_(a3 / n3, 0.5, 1.2);
        this.legs.forEach((e5, n4) => {
          let r3 = s_(this.phase + e5.phase + (t3 && !e5.front ? 0.08 : 0));
          if (r3 < l3) g2[n4].z = u3 * 0.5 - r3 / l3 * u3;
          else {
            let e6 = (r3 - l3) / (1 - l3);
            g2[n4].z = -u3 * 0.5 + e6 * e6 * (3 - 2 * e6) * u3, _2[n4] = Math.sin(Math.PI * e6) * p3;
          }
        });
        let h3 = this.phase * Math.PI * 2;
        i2 += -Math.abs(Math.sin(h3 * 2)) * (t3 ? 0.03 : 0.015) + 0.01, o2 += Math.sin(h3) * 0.04, c2 += Math.sin(h3 * 2) * (t3 ? 0.08 : 0.03), d2 += Math.sin(h3 * 2 + 1) * 0.06 - (t3 ? 0.1 : 0), m2 += t3 ? -0.15 : -0.05, f2 *= 0.3;
      }
      let y2 = $p[e4.state] ?? 0.5, b2 = [0, y2 * 0.65, y2, y2 + 0.15, 1], x2 = [cC, sC, oC, cC];
      switch (e4.state) {
        case `attack1`:
        case `special`: {
          let t3 = e4.state === `special` ? 1.4 : 1;
          i2 += L(n2, b2, [0, -0.06, 0.03, 0, 0], x2), c2 += L(n2, b2, [0, -0.25 * t3, -0.45 * t3, -0.3, 0], x2), l2 += L(n2, b2, [0, 0.15, 0.25, 0.15, 0], x2), d2 += L(n2, b2, [0, 0.35, 0.5, 0.4, 0], x2), m2 += L(n2, b2, [0, 0.6 * t3, 1.15 * t3, 0.5, 0], x2), s2 += e4.state === `special` ? L(n2, [0, y2, 1], [0, Math.PI * 2, Math.PI * 2], [cC, null]) : 0;
          break;
        }
        case `attack2`:
        case `kick`:
          a2 += L(n2, b2, [0, -0.06, 0.16, 0.12, 0], x2), i2 += L(n2, b2, [0, -0.04, 0.02, 0, 0], x2), u2 += L(n2, b2, [0, 0.2, -0.25, -0.2, 0], x2), d2 += L(n2, b2, [0, 0.25, -0.3, -0.15, 0], x2), p2 = L(n2, b2, [p2, 0.9, 0.2, 0.5, 0], x2), g2[0].z += L(n2, b2, [0, 0, 0.12, 0.1, 0], x2), g2[1].z += L(n2, b2, [0, 0, 0.12, 0.1, 0], x2);
          break;
        case `cast`:
        case `castUp`:
        case `taunt`:
        case `channel`: {
          let r3 = e4.state === `channel` ? 1 : L(n2, [0, 0.3, 0.75, 1], [0, 1, 1, 0], [cC, null, cC]);
          h2 = r3, p2 = Math.max(p2, r3 * (0.4 + 0.3 * Math.abs(Math.sin(t2 * 18)))), m2 += r3 * 0.7;
          break;
        }
        case `hit`: {
          let e5 = L(n2, [0, 0.25, 1], [0, 1, 0], [oC, cC]);
          a2 -= 0.06 * e5, i2 -= 0.03 * e5, d2 -= 0.4 * e5, m2 += 0.6 * e5;
          break;
        }
        case `block`: {
          let e5 = L(n2, [0, 0.3, 0.8, 1], [0, 1, 1, 0], [oC, null, cC]);
          i2 -= 0.12 * e5, c2 -= 0.4 * e5, d2 += 0.6 * e5, m2 += 1 * e5;
          break;
        }
        case `spin`:
          s2 = t2 * Math.PI * 2 * 1.8, m2 += 0.8;
          break;
        case `leap`:
          i2 += L(n2, [0, 0.25, 0.5, 0.8, 1], [0, -0.08, 0.18, -0.05, 0], [cC, oC, sC, cC]), v2 = 1 - z(0.3, 0.4, n2) * (1 - z(0.7, 0.8, n2));
          break;
        case `death`:
        case `dead`:
        case `resurrect`: {
          let t3 = e4.state === `dead` ? 1 : e4.state === `resurrect` ? 1 - m_(n2) : n2, r3 = [0, 0.2, 0.6, 0.85, 1], a3 = [oC, cC, sC, cC];
          o2 = L(t3, r3, [0, -0.2, 0.9, 1.55, 1.5], a3), i2 = L(t3, r3, [0, 0.03, -0.12, -0.27, -0.26], a3), d2 = L(t3, r3, [d2, -0.4, 0.2, 0.3, 0.3], a3), p2 = L(t3, r3, [p2, 0.8, 0.5, 0.6, 0.6], a3), m2 = L(t3, r3, [m2, 1, 0.4, -0.2, -0.2], a3), v2 = 1 - z(0.1, 0.4, t3);
          break;
        }
        default:
          break;
      }
      let S2 = this.b;
      S2.hips.position.set(this.hipsBind.x, this.hipsBind.y + i2 + h2 * 0.08, this.hipsBind.z + a2), S2.hips.quaternion.setFromEuler(ZS.set(0 - h2 * 0.9, s2, o2, `YXZ`)), S2.spine.quaternion.setFromEuler(ZS.set(c2 - h2 * 0.2, 0, 0, `YXZ`)), S2.chest.quaternion.setFromEuler(ZS.set(l2, 0, 0, `YXZ`)), S2.neck.quaternion.setFromEuler(ZS.set(u2 + h2 * 0.6, f2 * 0.4, 0, `YXZ`)), S2.head.quaternion.setFromEuler(ZS.set(d2 + h2 * 0.3, f2 * 0.6, 0, `YXZ`)), S2.jaw && S2.jaw.quaternion.setFromEuler(ZS.set(p2 * 0.6, 0, 0, `XYZ`));
      let C2 = [1, 0.85, 0.7];
      [`quill_1`, `quill_2`, `quill_3`].forEach((e5, t3) => {
        let n3 = S2[e5];
        n3 && n3.quaternion.setFromEuler(ZS.set(m2 * C2[t3] * 0.55, 0, 0, `XYZ`));
      });
      let w2 = this.rig.space;
      w2.update(), this.legs.forEach((t3, n3) => {
        let r3 = h2 > 0 && t3.front;
        nC.copy(t3.home).add(g2[n3]), nC.y += _2[n3], r3 && (nC.y += h2 * 0.35, nC.z += h2 * 0.05);
        let i3 = w2.pos[t3.iUpper], a3 = w2.quat[t3.iParent];
        v2 > 1e-3 && !(e4.state === `death` || e4.state === `dead`) ? (rC.copy(t3.front ? aC : iC).add(new N(t3.side * 0.2, 0, 0)), Zy(i3, nC, t3.L1, t3.L2, rC, t3.dirU, t3.dirL, t3.front ? aC : iC, $S, eC), tC.copy(a3).invert().multiply($S), t3.upper.quaternion.copy(tC), QS.copy($S).invert().multiply(eC), t3.lower.quaternion.copy(QS), QS.copy(eC).invert(), t3.foot.quaternion.copy(QS)) : (t3.upper.quaternion.setFromEuler(ZS.set(t3.front ? -0.5 : 0.5, 0, t3.side * 0.3, `XYZ`)), t3.lower.quaternion.setFromEuler(ZS.set(t3.front ? 0.6 : -0.6, 0, 0, `XYZ`)), t3.foot.quaternion.identity());
      });
    }
  };
}));
function dC(e4) {
  let t2 = fC[e4], n2 = e4 === 2 ? 1.12 : 1, r2 = (e5) => [e5[0] * n2, e5[1] * n2, e5[2] * n2], i2 = i_(500 + e4), a2 = [{ name: `hips`, parent: null, pos: r2([0, 0.42, -0.3]) }, { name: `spine`, parent: `hips`, pos: r2([0, 0.47, -0.08]) }, { name: `chest`, parent: `spine`, pos: r2([0, 0.45, 0.17]) }, { name: `neck`, parent: `chest`, pos: r2([0, 0.43, 0.33]) }, { name: `head`, parent: `neck`, pos: r2([0, 0.4, 0.45]) }, { name: `jaw`, parent: `head`, pos: r2([0, 0.35, 0.5]) }, { name: `tail_1`, parent: `hips`, pos: r2([0, 0.38, -0.5]) }, { name: `tail_2`, parent: `tail_1`, pos: r2([0, 0.3, -0.66]) }, { name: `tail_3`, parent: `tail_2`, pos: r2([0, 0.2, -0.82]) }, { name: `tail_4`, parent: `tail_3`, pos: r2([0, 0.11, -0.97]) }, { name: `quill_1`, parent: `chest`, pos: r2([0, 0.6, 0.12]) }, { name: `quill_2`, parent: `spine`, pos: r2([0, 0.64, -0.1]) }, { name: `quill_3`, parent: `hips`, pos: r2([0, 0.6, -0.3]) }];
  for (let [e5, t3] of [[`L`, 1], [`R`, -1]]) a2.push({ name: `upperF_${e5}`, parent: `chest`, pos: r2([t3 * 0.11, 0.37, 0.22]) }, { name: `lowerF_${e5}`, parent: `upperF_${e5}`, pos: r2([t3 * 0.12, 0.2, 0.19]) }, { name: `footF_${e5}`, parent: `lowerF_${e5}`, pos: r2([t3 * 0.12, 0.045, 0.24]) }, { name: `upperB_${e5}`, parent: `hips`, pos: r2([t3 * 0.13, 0.37, -0.35]) }, { name: `lowerB_${e5}`, parent: `upperB_${e5}`, pos: r2([t3 * 0.14, 0.2, -0.27]) }, { name: `footB_${e5}`, parent: `lowerB_${e5}`, pos: r2([t3 * 0.14, 0.045, -0.38]) });
  let o2 = new fx(a2), s2 = new H_(), c2 = new P(t2.fur), l2 = new P(t2.furDark), u2 = new P(t2.belly), d2 = (e5 = {}) => ({ color: t2.fur, paint: (e6, t3) => {
    t3.copy(c2), t3.lerp(l2, z(0.1, 0.9, e6.n.y) * 0.6), t3.lerp(u2, z(-0.2, -0.8, e6.n.y) * 0.7), t3.multiplyScalar(0.85 + o_(e6.p.x * 20, e6.p.y * 20, e6.p.z * 20, 2, 3) * 0.3);
  }, rough: 0.95, detail: B.FUR, wear: 0.4, ...e5 }), f2 = V([r2([0, 0.36, -0.5]), r2([0, 0.44, -0.32]), r2([0, 0.47, -0.08]), r2([0, 0.45, 0.17]), r2([0, 0.43, 0.32])], (e5) => {
    let t3 = (0.13 + Math.sin(e5 * Math.PI) * 0.07) * n2;
    return [t3 * 1.05, t3 * (e5 < 0.6 ? 1.1 : 0.95)];
  }, 12, 12, { up: [0, 1, 0], capStart: true, capEnd: true });
  f2.noise(0.012, 14, 3).computeNormals(), s2.add(f2, { ...d2(), name: `body`, skin: Fv([`hips`, `spine`, `chest`, `neck`], [r2([0, 0.42, -0.3]), r2([0, 0.47, -0.08]), r2([0, 0.45, 0.17]), r2([0, 0.43, 0.33])], 0.7) });
  let p2 = new cv();
  for (let e5 = 0; e5 < 12; e5 += 1) {
    let t3 = R(-0.42, 0.25, e5 / 11) * n2;
    for (let r3 of [1, -1]) {
      let a3 = (0.36 + Math.sin(e5 / 11 * Math.PI) * 0.04) * n2;
      p2.merge(iv([r3 * 0.17 * n2, a3, t3], [r3 * 0.5, -1, -0.2], 0.03 * n2, (0.08 + i2() * 0.04) * n2, 3, 0.3));
    }
  }
  s2.add(p2, { ...d2(), name: `fringe`, skin: (e5) => e5.p.z > 0.05 ? [`chest`, `spine`, 0.3] : [`spine`, `hips`, z(-0.1, -0.3, e5.p.z)] });
  let m2 = V([r2([0, 0.44, 0.28]), r2([0, 0.43, 0.38]), r2([0, 0.42, 0.46]), r2([0, 0.38, 0.56]), r2([0, 0.34, 0.64])], (e5) => {
    let t3 = R(0.118, 0.03, e5 ** 0.85) * n2;
    return [t3 * 0.95, t3 * 1.05];
  }, 10, 8, { up: [0, 1, 0], capStart: true, capEnd: true });
  m2.computeNormals(), s2.add(m2, { ...d2(), name: `head`, skin: (e5) => e5.p.y < 0.36 * n2 && e5.p.z > 0.47 * n2 ? [`head`, `jaw`, z(0.37 * n2, 0.34 * n2, e5.p.y) * 0.8] : [`head`, `neck`, z(0.42 * n2, 0.36 * n2, e5.p.z) * 0.6] }), s2.add(H(0.02, 0.016, 0.016, 6, 4).translate(...r2([0, 0.345, 0.655])), { bone: `head`, color: `#5a3034`, rough: 0.35, detail: B.SKIN, name: `nose` });
  for (let n3 of [1, -1]) {
    s2.add(H(0.014, 0.014, 0.012, 6, 4).translate(...r2([n3 * 0.06, 0.445, 0.47])), { bone: `head`, color: t2.eye, emit: e4 === 2 ? 3.5 : 2.4, rough: 0.2, detail: B.EMISSIVE, ao: 0, occluder: false, name: `eyes` });
    let i3 = X_([[0, 0], [0.03, 6e-3], [0.034, 0.025], [0.02, 0.04], [0, 0.044]], 7, { sz: 0.45 });
    i3.rotateX(-0.4).rotateZ(-n3 * 0.5).translate(...r2([n3 * 0.07, 0.48, 0.4])), s2.add(i3, { bone: `head`, color: t2.skin, rough: 0.6, detail: B.SKIN, name: `ears` });
    for (let e5 = 0; e5 < 2; e5 += 1) s2.add(V([r2([n3 * 0.025, 0.355 + e5 * 0.012, 0.62]), r2([n3 * 0.13, 0.36 + e5 * 0.03, 0.6])], 12e-4, 3, 2, { linear: true }), { bone: `head`, color: `#d8d0c0`, rough: 0.5, detail: B.HAIR, ao: 0, occluder: false });
  }
  for (let e5 of [1, -1]) s2.add(V([r2([e5 * 8e-3, 0.34, 0.645]), r2([e5 * 8e-3, 0.31, 0.65])], [7e-3, 4e-3], 4, 2, { capStart: true, capEnd: true }), { bone: `head`, color: `#d8b84a`, rough: 0.35, detail: B.BONE, name: `teeth` }), s2.add(V([r2([e5 * 7e-3, 0.32, 0.625]), r2([e5 * 7e-3, 0.34, 0.632])], [6e-3, 35e-4], 4, 2, { capStart: true, capEnd: true }), { bone: `jaw`, color: `#d0ac40`, rough: 0.35, detail: B.BONE, name: `teeth` });
  s2.add(H(0.035, 0.012, 0.05, 6, 3).translate(...r2([0, 0.33, 0.58])), { bone: `jaw`, color: `#4a2020`, rough: 0.4, detail: B.FLESH, ao: 0 });
  let h2 = [[`quill_1`, 0.05, 0.32], [`quill_2`, -0.2, 0.05], [`quill_3`, -0.48, -0.2]], g2 = new P(t2.tip);
  for (let [r3, a3, o3] of h2) {
    let c3 = new cv(), l3 = e4 === 2 ? 20 : 18;
    for (let t3 = 0; t3 < l3; t3 += 1) {
      let t4 = R(a3, o3, i2()) * n2, r4 = (i2() - 0.5) * 2.2, s3 = (t4 / n2 + 0.5) / 0.85, l4 = (0.47 + Math.sin(Math.max(0, Math.min(1, s3)) * Math.PI) * 0.15) * n2, u3 = [Math.sin(r4) * 0.1 * n2, l4 - 0.03 * n2 - Math.abs(r4) * 0.04 * n2, t4], d3 = (0.22 + i2() * 0.16) * n2 * (1 - Math.abs(r4) * 0.25) * (e4 === 2 ? 1.2 : 1), f3 = [Math.sin(r4) * 0.8, 0.9 - Math.abs(r4) * 0.2, -0.75];
      c3.merge(iv(u3, f3, 9e-3 * n2, d3, 3, 0));
    }
    s2.add(c3, { bone: r3, color: t2.quill, paint: (e5, t3) => {
      let r4 = Math.hypot(e5.p.x, e5.p.y - 0.5 * n2);
      t3.lerp(g2, z(0.17 * n2, 0.3 * n2, r4));
    }, rough: 0.4, detail: B.BONE, wear: 0.3, name: `quills` });
  }
  if (e4 === 2) for (let e5 = 0; e5 < 3; e5 += 1) {
    let t3 = H(0.12, 0.03, 0.1, 8, 4);
    t3.translate(0, (0.56 + (e5 === 1 ? 0.04 : 0)) * n2, R(0.2, -0.35, e5 / 2) * n2), s2.add(t3, { bone: e5 === 0 ? `chest` : e5 === 1 ? `spine` : `hips`, color: `#cdbb92`, rough: 0.5, detail: B.BONE, wear: 0.6, name: `plates` });
  }
  for (let [e5, r3] of [[`L`, 1], [`R`, -1]]) for (let r4 of [`F`, `B`]) {
    let i3 = o2.pos(`upper${r4}_${e5}`), a3 = o2.pos(`lower${r4}_${e5}`), c3 = o2.pos(`foot${r4}_${e5}`), l3 = V([[i3[0], i3[1] + 0.05, i3[2]], a3], (e6) => R(r4 === `B` ? 0.085 : 0.068, 0.036, e6) * n2, 6, 4, { capStart: true, capEnd: true });
    l3.noise(6e-3, 30, r4 === `B` ? 3 : 5).computeNormals(), s2.add(l3, { ...d2(), bone: `upper${r4}_${e5}`, name: `legs` });
    let u3 = V([a3, [c3[0], c3[1] + 0.01, c3[2]]], (e6) => R(0.034, 0.022, e6) * n2, 6, 3, { capStart: true, capEnd: true }), f3 = a3[1];
    s2.add(u3, { ...d2(), bone: `lower${r4}_${e5}`, name: `legs`, paint: (e6, r5) => {
      d2().paint(e6, r5), r5.lerp(new P(t2.skin), z(f3 - 0.06 * n2, f3 - 0.14 * n2, e6.p.y));
    } });
    let p3 = new cv();
    p3.merge(H(0.03 * n2, 0.018 * n2, 0.04 * n2, 6, 3).translate(c3[0], 0.02 * n2, c3[2] + 0.015 * n2));
    for (let e6 = 0; e6 < 3; e6 += 1) p3.merge(iv([c3[0] + (e6 - 1) * 0.014 * n2, 0.015 * n2, c3[2] + 0.05 * n2], [0, -0.5, 1], 5e-3 * n2, 0.022 * n2, 3));
    s2.add(p3, { bone: `foot${r4}_${e5}`, color: t2.skin, rough: 0.55, detail: B.SKIN, name: `paws`, paint: (e6, t3) => {
      e6.p.z > c3[2] + 0.045 * n2 && t3.set(`#1e1814`);
    } });
  }
  let _2 = [o2.pos(`tail_1`), o2.pos(`tail_2`), o2.pos(`tail_3`), o2.pos(`tail_4`)], v2 = V([r2([0, 0.4, -0.45]), ..._2, r2([0, 0.06, -1.08])], (e5) => R(0.035, 6e-3, e5 ** 0.8) * n2, 6, 16, { capStart: true, capEnd: true });
  return s2.add(v2, { color: t2.skin, paint: (e5, t3) => {
    Math.abs(Math.sin(e5.p.z * 140)) < 0.22 && t3.multiplyScalar(0.78);
  }, rough: 0.55, detail: B.SKIN, wear: 0.5, skin: Fv([`tail_1`, `tail_2`, `tail_3`, `tail_4`], _2, 0.6), name: `tail` }), hx({ key: `monster:spinehog:${e4}`, def: o2, mb: s2, height: 0.7 * n2, radius: 0.42 * n2, sockets: { rightHand: { bone: `footF_R`, pos: o2.pos(`footF_R`) }, leftHand: { bone: `footF_L`, pos: o2.pos(`footF_L`) }, head: { bone: `head`, pos: r2([0, 0.45, 0.47]) }, chest: { bone: `chest`, pos: r2([0, 0.45, 0.25]) }, castPoint: { bone: `chest`, pos: r2([0, 0.7, 0]) }, weaponTip: { bone: `quill_2`, pos: r2([0, 0.85, -0.25]) }, mouth: { bone: `head`, pos: r2([0, 0.34, 0.66]) }, back: { bone: `spine`, pos: r2([0, 0.66, -0.1]) } }, springs: [{ id: `tail`, bones: [`tail_1`, `tail_2`, `tail_3`, `tail_4`], gravity: 0.25, inertia: 0.03, drag: 0.04, stiffness: 50, damping: 6, restX: 0, xMin: -0.6, xMax: 0.6, zMin: -0.8, zMax: 0.8, falloff: 0.85, sway: 0.09, swaySpeed: 1.6 }], contacts: [[`hips`, 0.14], [`spine`, 0.15], [`chest`, 0.14], [`head`, 0.08]], animator: (e5) => new lC(e5, { walkRef: 3, runRef: 5.5, walkStride: 0.62, runStride: 1.05, stepH: 0.06 }), deadEmissive: 0, build: { grime: { height: 0.2, amount: 0.4 }, ao: { res: 60, dist: 0.12, strength: 1 } } });
}
var fC, pC = t((() => {
  Ed(), U_(), zv(), lv(), __(), uC(), mx(), wx(), fC = { 0: { fur: `#5a4634`, furDark: `#2e241a`, belly: `#7a6450`, skin: `#a07a70`, quill: `#2a221c`, tip: `#e6dcc4`, eye: `#ff3a2a` }, 1: { fur: `#4a4646`, furDark: `#1e1c1c`, belly: `#6a6260`, skin: `#8a7472`, quill: `#1a1616`, tip: `#d83a2a`, eye: `#ff7a2a` }, 2: { fur: `#4e3a2a`, furDark: `#22180e`, belly: `#6a5440`, skin: `#9a706a`, quill: `#201812`, tip: `#f0e6cc`, eye: `#ff1a10` } };
}));
function mC(e4) {
  return new Xo({ color: 0, emissive: 16777215, emissiveIntensity: e4 });
}
var hC, gC = t((() => {
  Ed(), hC = class extends ai {
    constructor() {
      super(), this.name = `RoomEnvironment`, this.position.y = -3.5;
      let e4 = new ao();
      e4.deleteAttribute(`uv`);
      let t2 = new Yo({ side: 1 }), n2 = new Yo(), r2 = new As(16777215, 900, 28, 2);
      r2.position.set(0.418, 16.199, 0.3), this.add(r2);
      let i2 = new xa(e4, t2);
      i2.position.set(-0.757, 13.219, 0.717), i2.scale.set(31.713, 28.305, 28.591), this.add(i2);
      let a2 = new Ga(e4, n2, 6), o2 = new Zr();
      o2.position.set(-10.906, 2.009, 1.846), o2.rotation.set(0, -0.195, 0), o2.scale.set(2.328, 7.905, 4.651), o2.updateMatrix(), a2.setMatrixAt(0, o2.matrix), o2.position.set(-5.607, -0.754, -0.758), o2.rotation.set(0, 0.994, 0), o2.scale.set(1.97, 1.534, 3.955), o2.updateMatrix(), a2.setMatrixAt(1, o2.matrix), o2.position.set(6.167, 0.857, 7.803), o2.rotation.set(0, 0.561, 0), o2.scale.set(3.927, 6.285, 3.687), o2.updateMatrix(), a2.setMatrixAt(2, o2.matrix), o2.position.set(-2.017, 0.018, 6.124), o2.rotation.set(0, 0.333, 0), o2.scale.set(2.002, 4.566, 2.064), o2.updateMatrix(), a2.setMatrixAt(3, o2.matrix), o2.position.set(2.291, -0.756, -2.621), o2.rotation.set(0, -0.286, 0), o2.scale.set(1.546, 1.552, 1.496), o2.updateMatrix(), a2.setMatrixAt(4, o2.matrix), o2.position.set(-2.193, -0.369, -5.547), o2.rotation.set(0, 0.516, 0), o2.scale.set(3.875, 3.487, 2.986), o2.updateMatrix(), a2.setMatrixAt(5, o2.matrix), this.add(a2);
      let s2 = new xa(e4, mC(50));
      s2.position.set(-16.116, 14.37, 8.208), s2.scale.set(0.1, 2.428, 2.739), this.add(s2);
      let c2 = new xa(e4, mC(50));
      c2.position.set(-16.109, 18.021, -8.207), c2.scale.set(0.1, 2.425, 2.751), this.add(c2);
      let l2 = new xa(e4, mC(17));
      l2.position.set(14.904, 12.198, -1.832), l2.scale.set(0.15, 4.265, 6.331), this.add(l2);
      let u2 = new xa(e4, mC(43));
      u2.position.set(-0.462, 8.89, 14.52), u2.scale.set(4.38, 5.441, 0.088), this.add(u2);
      let d2 = new xa(e4, mC(20));
      d2.position.set(3.235, 11.486, -12.541), d2.scale.set(2.5, 2, 0.1), this.add(d2);
      let f2 = new xa(e4, mC(100));
      f2.position.set(0, 20, 0), f2.scale.set(1, 0.1, 1), this.add(f2);
    }
    dispose() {
      let e4 = /* @__PURE__ */ new Set();
      this.traverse((t2) => {
        t2.isMesh && (e4.add(t2.geometry), e4.add(t2.material));
      });
      for (let t2 of e4) t2.dispose();
    }
  };
}));
function _C(e4) {
  TC = e4;
}
function vC(e4) {
  let t2 = e4 == null ? `none` : new P(e4).getHexString(), n2 = EC.get(t2);
  if (!n2) {
    let r2 = w_();
    t2 !== `none` && (r2.uRimColor.value.set(e4), r2.uRimAmt.value = 0.4), n2 = { mat: E_(r2), depth: D_(r2), u: r2 }, EC.set(t2, n2);
  }
  return n2;
}
function yC(e4) {
  let t2 = e4.getSize(new N()), n2 = [{ v: new N(1, 0, 0), s: t2.x }, { v: new N(0, 1, 0), s: t2.y }, { v: new N(0, 0, 1), s: t2.z }].sort((e5, t3) => t3.s - e5.s), r2 = n2[0].v, i2 = n2[1].v.clone(), a2 = n2[2].v, o2 = new wr().set(r2.x, r2.y, r2.z, 0, a2.x, a2.y, a2.z, 0, i2.x, i2.y, i2.z, 0, 0, 0, 0, 1);
  return o2.determinant() < 0 && (i2.negate(), o2.set(r2.x, r2.y, r2.z, 0, a2.x, a2.y, a2.z, 0, i2.x, i2.y, i2.z, 0, 0, 0, 0, 1)), o2;
}
function bC(e4, t2 = {}) {
  let n2 = new Qr();
  n2.name = `item:${e4}`;
  let r2 = Wy(e4);
  if (!r2) {
    let e5 = new xa(new ao(0.2, 0.05, 0.2), new Yo({ color: `#777` }));
    return n2.add(e5), n2;
  }
  let { mat: i2, depth: a2 } = vC(t2.glow), o2 = new xa(r2.geometry, i2);
  o2.castShadow = true, o2.receiveShadow = true, o2.customDepthMaterial = a2;
  let s2 = yC(r2.bounds);
  o2.quaternion.setFromRotationMatrix(s2);
  let c2 = r2.bounds.getCenter(OC).applyMatrix4(s2);
  o2.position.copy(c2).negate(), n2.add(o2);
  let l2 = Math.min(2.2, Math.max(1, 0.09 / Math.max(1e-4, r2.length)));
  o2.scale.setScalar(l2), o2.position.multiplyScalar(l2);
  let u2 = r2.bounds.getSize(new N()).multiplyScalar(l2), d2 = [u2.x, u2.y, u2.z].sort((e5, t3) => t3 - e5);
  return n2.userData.halfExtents = [d2[0] / 2, d2[2] / 2, d2[1] / 2], n2.userData.restHeight = d2[2] / 2, n2;
}
function xC(e4) {
  if (AC) return AC;
  let t2 = new ai(), n2 = new Au(e4), r2 = new hC(), i2 = n2.fromScene(r2, 0.04).texture;
  n2.dispose(), r2.traverse((e5) => {
    let t3 = e5;
    t3.geometry && t3.geometry.dispose();
  }), t2.environment = i2, t2.environmentIntensity = 0.75;
  let a2 = new Ns(`#fff1dc`, 3.2);
  a2.position.set(-1.2, 1.8, 2);
  let o2 = new Ns(`#9fb6ff`, 1);
  o2.position.set(1.6, 0.2, 1);
  let s2 = new Ns(`#ffe2b8`, 2.6);
  s2.position.set(0.6, 1.2, -2);
  let c2 = new gs(`#6a7590`, `#20180f`, 0.7);
  t2.add(a2, o2, s2, c2);
  let l2 = new Qr();
  t2.add(l2);
  let u2 = new js(-1, 1, 1, -1, -20, 20);
  u2.position.set(0, 0, 10), u2.lookAt(0, 0, 0);
  let d2 = E_(w_()), f2 = new qo({ uniforms: { tDiffuse: { value: null }, exposure: { value: 1 } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`, fragmentShader: `
      uniform sampler2D tDiffuse; uniform float exposure; varying vec2 vUv;
      vec3 rrt(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
      vec3 aces(vec3 c){
        const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        c *= exposure / 0.6; c = I * c; c = rrt(c); c = O * c; return clamp(c, 0.0, 1.0);
      }
      vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
      void main(){
        vec4 t = texture2D(tDiffuse, vUv);
        float a = clamp(t.a, 0.0, 1.0);
        vec3 c = a > 0.001 ? t.rgb / a : vec3(0.0);
        gl_FragColor = vec4(srgb(aces(c)), a);
      }`, depthTest: false, depthWrite: false }), p2 = new xa(new Bo(2, 2), f2);
  p2.frustumCulled = false;
  let m2 = new ai();
  return m2.add(p2), AC = { scene: t2, holder: l2, cam: u2, mat: d2, env: i2, quad: p2, quadScene: m2, quadCam: new js(-1, 1, 1, -1, 0, 1), tm: f2 }, AC;
}
function SC(e4, t2) {
  let n2 = e4.kind;
  return n2 === `blade` || n2 === `dagger` || n2 === `axe` || n2 === `blunt` || n2 === `wand` || n2 === `staff` ? new Pr(0.12, -0.38, 0) : n2 === `bow` ? new Pr(0.05, 0.4, 0) : n2 === `shield` ? new Pr(0.1, -0.3, 0) : n2 === `helm` ? new Pr(0.22, -0.55, 0) : n2 === `orb` ? new Pr(0.15, -0.3, 0) : t2.startsWith(`ring`) ? new Pr(0.55, -0.35, 0.1) : t2.startsWith(`gem_`) || t2 === `jewel` ? new Pr(0.35, -0.45, 0) : t2.startsWith(`rune_`) ? new Pr(0.12, -0.28, 0) : t2 === `gold` ? new Pr(0.6, -0.5, 0) : t2 === `sash` || t2 === `belt` || t2.endsWith(`Belt`) ? new Pr(0.62, -0.18, 0) : t2 === `coffer` ? new Pr(0.42, -0.62, 0) : new Pr(0.14, -0.3, 0);
}
function CC(e4, t2, n2, r2 = 48) {
  let i2 = `${e4}|${t2}|${n2}|${r2}`, a2 = kC.get(i2);
  if (a2) return a2;
  let o2 = TC, s2 = Wy(e4);
  if (!o2 || !s2 || typeof document > `u`) return ``;
  let c2 = xC(o2), l2 = Math.max(8, Math.round(t2 * r2)), u2 = Math.max(8, Math.round(n2 * r2)), d2 = l2 * 2, f2 = u2 * 2;
  (!jC || jC.width !== d2 || jC.height !== f2) && (jC?.dispose(), MC?.dispose(), jC = new xr(d2, f2, { type: Nt, samples: 4 }), MC = new xr(d2, f2, { type: Et })), c2.holder.clear();
  let p2 = new xa(s2.geometry, c2.mat), m2 = SC(s2, e4), h2 = s2.bounds.getCenter(new N());
  p2.position.copy(h2).negate();
  let g2 = new Qr();
  g2.add(p2), g2.rotation.copy(m2), c2.holder.add(g2), g2.updateMatrixWorld(true), DC.makeEmpty();
  let _2 = s2.geometry.getAttribute(`position`), v2 = Math.max(1, Math.floor(_2.count / 800));
  for (let e5 = 0; e5 < _2.count; e5 += v2) OC.fromBufferAttribute(_2, e5).applyMatrix4(p2.matrixWorld), DC.expandByPoint(OC);
  let y2 = DC.max.x - DC.min.x, b2 = DC.max.y - DC.min.y, x2 = (DC.max.x + DC.min.x) / 2, S2 = (DC.max.y + DC.min.y) / 2, C2 = l2 / u2, w2 = Math.max(b2, y2 / C2) * 1.12 / (2 * wy(e4));
  w2 = Math.max(w2, 0.01);
  let T2 = w2 * C2;
  c2.cam.left = x2 - T2, c2.cam.right = x2 + T2, c2.cam.top = S2 + w2, c2.cam.bottom = S2 - w2, c2.cam.updateProjectionMatrix();
  let E2 = o2.getRenderTarget();
  o2.getClearColor(NC);
  let D2 = o2.getClearAlpha();
  o2.getViewport(PC);
  let O2 = o2.autoClear, k2 = o2.shadowMap.enabled;
  o2.shadowMap.enabled = false, o2.autoClear = true, o2.setClearColor(0, 0), o2.setRenderTarget(jC), o2.clear(true, true, true), o2.render(c2.scene, c2.cam), c2.tm.uniforms.tDiffuse.value = jC.texture, o2.setRenderTarget(MC), o2.clear(true, true, true), o2.render(c2.quadScene, c2.quadCam);
  let A2 = new Uint8Array(d2 * f2 * 4);
  o2.readRenderTargetPixels(MC, 0, 0, d2, f2, A2), o2.setRenderTarget(E2), o2.setClearColor(NC, D2), o2.setViewport(PC), o2.autoClear = O2, o2.shadowMap.enabled = k2, c2.holder.clear();
  let ee2 = document.createElement(`canvas`);
  ee2.width = d2, ee2.height = f2;
  let te2 = ee2.getContext(`2d`), ne2 = te2.createImageData(d2, f2);
  for (let e5 = 0; e5 < f2; e5 += 1) {
    let t3 = (f2 - 1 - e5) * d2 * 4;
    ne2.data.set(A2.subarray(t3, t3 + d2 * 4), e5 * d2 * 4);
  }
  te2.putImageData(ne2, 0, 0);
  let re2 = document.createElement(`canvas`);
  re2.width = l2, re2.height = u2;
  let ie2 = re2.getContext(`2d`);
  ie2.imageSmoothingEnabled = true, ie2.imageSmoothingQuality = `high`, ie2.save(), ie2.shadowColor = `rgba(0,0,0,0.9)`, ie2.shadowBlur = Math.max(1.5, r2 / 22), ie2.shadowOffsetX = Math.max(1, r2 / 40), ie2.shadowOffsetY = Math.max(1, r2 / 32), ie2.drawImage(ee2, 0, 0, l2, u2), ie2.restore(), ie2.drawImage(ee2, 0, 0, l2, u2);
  let ae2 = re2.toDataURL(`image/png`);
  return kC.set(i2, ae2), ae2;
}
function wC() {
  !TC || typeof document > `u` || (CC(`hpPotion1`, 1, 1, 16), kC.delete(`hpPotion1|1|1|16`));
}
var TC, EC, DC, OC, kC, AC, jC, MC, NC, PC, FC = t((() => {
  Ed(), gC(), L_(), Ky(), Hy(), TC = null, EC = /* @__PURE__ */ new Map(), DC = new bi(), OC = new N(), kC = /* @__PURE__ */ new Map(), AC = null, jC = null, MC = null, NC = new P(), PC = new yr();
})), IC = n({ createAlly: () => VC, createHero: () => zC, createItemModel: () => UC, createMonster: () => BC, createNpc: () => HC, default: () => ZC, getItemIcon: () => WC, isPrepared: () => KC, modelGlobals: () => O_, modelStats: () => GC, models: () => ZC, prepareModels: () => RC });
function LC(e4) {
  let t2 = YC[e4] ?? e4, n2 = JC.get(t2);
  return n2 || (n2 = (qC.get(t2) ?? qC.get(`hero:sorceress`))(), JC.set(t2, n2)), n2;
}
async function RC(e4, t2) {
  _C(e4), b_();
  let n2 = [...qC.keys()];
  for (let e5 = 0; e5 < n2.length; e5 += 1) LC(n2[e5]), t2?.((e5 + 1) / n2.length * 0.95), await new Promise((e6) => setTimeout(e6, 0));
  wC(), t2?.(1), XC = true;
}
function zC(e4) {
  return new Nb(LC(`hero:${e4}`));
}
function BC(e4, t2 = {}) {
  return new Nb(LC(`monster:${e4}:${t2.variant ?? 0}`));
}
function VC(e4) {
  return new Nb(LC(`ally:${e4}`));
}
function HC(e4) {
  return new Nb(LC(`npc:${e4}`));
}
function UC(e4, t2 = {}) {
  return bC(e4, t2);
}
function WC(e4, t2, n2, r2 = 48) {
  return CC(e4, t2, n2, r2);
}
function GC() {
  return [...JC.values()].map((e4) => ({ key: e4.key, triangles: e4.triangles, bones: e4.def.bones.length, breakdown: e4.breakdown }));
}
function KC() {
  return XC;
}
var qC, JC, YC, XC, ZC, QC = t((() => {
  C_(), L_(), Pb(), Yx(), eS(), uS(), yS(), CS(), PS(), IS(), zS(), VS(), XS(), pC(), FC(), qC = /* @__PURE__ */ new Map(), JC = /* @__PURE__ */ new Map(), qC.set(`hero:sorceress`, Gx), qC.set(`hero:barbarian`, Xx), qC.set(`hero:necromancer`, oS);
  for (let e4 of [0, 1, 2]) qC.set(`monster:gutterkin:${e4}`, () => gS(`gutterkin`, e4)), qC.set(`monster:gutterkinShaman:${e4}`, () => gS(`shaman`, e4)), qC.set(`monster:bonewretch:${e4}`, () => SS(`bonewretch`, e4)), qC.set(`monster:rotwalker:${e4}`, () => LS(e4)), qC.set(`monster:spinehog:${e4}`, () => dC(e4));
  qC.set(`monster:weepingQueen:0`, HS), qC.set(`ally:earthGolem`, BS);
  for (let e4 of [0, 1, 2]) qC.set(`monster:hollowArcher:${e4}`, () => MS(`hollowArcher`, e4));
  qC.set(`monster:bloodwitch:0`, () => MS(`bloodwitch`, 0)), qC.set(`ally:mercArcher`, () => MS(`mercArcher`)), qC.set(`npc:captain`, () => MS(`captain`)), qC.set(`npc:healer`, () => FS(`healer`)), qC.set(`npc:smith`, () => FS(`smith`)), qC.set(`npc:sage`, () => FS(`sage`)), qC.set(`ally:skeletonWarrior`, () => SS(`skeletonWarrior`)), qC.set(`ally:skeletonMage`, () => SS(`skeletonMage`)), YC = { "monster:bloodwitch:1": `monster:bloodwitch:0`, "monster:bloodwitch:2": `monster:bloodwitch:0`, "monster:weepingQueen:1": `monster:weepingQueen:0`, "monster:weepingQueen:2": `monster:weepingQueen:0` }, XC = false, ZC = { prepareModels: RC, createHero: zC, createMonster: BC, createAlly: VC, createNpc: HC, createItemModel: UC, getItemIcon: WC, setFadeCoverage(e4) {
    I_.coverage = e4;
  } };
})), $C = t((() => {
})), ew = t((() => {
})), tw = t((() => {
})), nw = t((() => {
})), rw = t((() => {
})), iw = t((() => {
})), aw = t((() => {
})), ow = t((() => {
})), sw = t((() => {
}));
function cw(e4, t2, n2) {
  let r2 = Math.min(t2 / 1080, e4 / 1680) ** 0.82 * (n2 || 1), i2 = t2 / (uw.panelH + uw.margin + uw.orbTop + 8), a2 = (e4 - 16) / (uw.panelW * 2 + uw.margin * 2 + 120), o2 = (e4 - 12) / uw.consoleW;
  return r2 = Math.min(r2, i2, a2, o2), Math.max(0.4, Math.round(r2 * 1e3) / 1e3);
}

// ===== game part 08-area-props-vfx-world-renderers (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var hg = new N(0, 1, 0), gg = class {
  root;
  itemEls = /* @__PURE__ */ new Map();
  floats = [];
  named = /* @__PURE__ */ new Map();
  jitter = 0;
  constructor(e4) {
    let t2 = document.getElementById(`world-labels`);
    t2 || (t2 = document.createElement(`div`), t2.id = `world-labels`, e4.appendChild(t2)), this.root = t2, Object.assign(this.root.style, { position: `absolute`, inset: `0`, pointerEvents: `none`, overflow: `hidden`, zIndex: `5` });
  }
  attachTo(e4) {
    if (e4 === this.root) return;
    let t2 = this.root;
    for (; t2.firstChild; ) e4.appendChild(t2.firstChild);
    t2.parentElement && t2 !== e4 && t2.remove(), this.root = e4;
  }
  scaleK = 1;
  scaleT = 0;
  scale() {
    if (this.scaleT-- <= 0) {
      this.scaleT = 90;
      let e4 = parseFloat(getComputedStyle(this.root).getPropertyValue(`--s`));
      this.scaleK = Number.isFinite(e4) && e4 > 0 ? e4 : 1;
    }
    return this.scaleK;
  }
  blocked = [];
  blockedT = 0;
  refreshBlocked() {
    if (this.blockedT-- > 0) return;
    this.blockedT = 8;
    let e4 = this.root.getBoundingClientRect(), t2 = [];
    for (let n2 of document.querySelectorAll(`.uh-panel.is-open, .uh-console, .uh-orb`)) {
      let r2 = n2.getBoundingClientRect();
      r2.width > 0 && r2.height > 0 && t2.push({ x0: r2.left - e4.left, x1: r2.right - e4.left, y0: r2.top - e4.top, y1: r2.bottom - e4.top });
    }
    this.blocked = t2;
  }
  setItems(e4) {
    let t2 = /* @__PURE__ */ new Set(), n2 = [];
    this.refreshBlocked(), e4.sort((e5, t3) => e5.y - t3.y);
    for (let r2 of e4) {
      t2.add(r2.id);
      let e5 = this.itemEls.get(r2.id);
      e5 || (e5 = document.createElement(`div`), e5.className = r2.gold ? `${Dd.item} ${Dd.gold}` : `${Dd.item} q-${r2.quality}`, e5.textContent = r2.text, e5.style.position = `absolute`, e5.style.pointerEvents = `none`, this.root.appendChild(e5), this.itemEls.set(r2.id, e5));
      let i2 = this.scale(), a2 = Math.max(40, r2.text.length * 8.4 + 16) * i2, o2 = 22 * i2, s2 = r2.y;
      for (let e6 = 0; e6 < 8; e6 += 1) {
        let e7 = n2.find((e8) => r2.x + a2 / 2 > e8.x0 && r2.x - a2 / 2 < e8.x1 && s2 > e8.y0 && s2 - o2 < e8.y1);
        if (!e7) break;
        s2 = e7.y0 - 1;
      }
      let c2 = { x0: r2.x - a2 / 2, x1: r2.x + a2 / 2, y0: s2 - o2, y1: s2 }, l2 = this.blocked.some((e6) => c2.x1 > e6.x0 && c2.x0 < e6.x1 && c2.y1 > e6.y0 && c2.y0 < e6.y1);
      if (e5.style.visibility = l2 ? `hidden` : ``, l2) {
        this.rects.delete(r2.id);
        continue;
      }
      n2.push(c2), this.rects.set(r2.id, c2), e5.style.left = `${r2.x.toFixed(1)}px`, e5.style.top = `${s2.toFixed(1)}px`, e5.classList.toggle(`is-hover`, r2.hover);
    }
    for (let [e5, n3] of this.itemEls) t2.has(e5) || (n3.remove(), this.itemEls.delete(e5), this.rects.delete(e5));
  }
  rects = /* @__PURE__ */ new Map();
  labelAt(e4, t2) {
    let n2 = null;
    for (let [r2, i2] of this.rects) e4 >= i2.x0 && e4 <= i2.x1 && t2 >= i2.y0 && t2 <= i2.y1 && (n2 = r2);
    return n2;
  }
  setNamed(e4, t2, n2, r2 = 0, i2 = 0, a2 = ``) {
    let o2 = this.named.get(e4);
    if (!n2) {
      o2 && (o2.style.display = `none`);
      return;
    }
    o2 || (o2 = document.createElement(`div`), this.root.appendChild(o2), this.named.set(e4, o2)), o2.className = `${t2} ${a2}`.trim(), o2.textContent !== n2 && (o2.textContent = n2), o2.style.display = `block`, o2.style.left = `${r2.toFixed(1)}px`, o2.style.top = `${i2.toFixed(1)}px`;
  }
  hideNamedExcept(e4) {
    for (let [t2, n2] of this.named) e4.has(t2) || (n2.style.display = `none`);
  }
  floatText(e4, t2, n2, r2, i2 = 1.3) {
    let a2 = document.createElement(`div`);
    a2.className = r2, a2.textContent = e4, this.jitter = (this.jitter + 7) % 19, a2.style.left = `${(t2 + (this.jitter - 9)).toFixed(1)}px`, a2.style.top = `${n2.toFixed(1)}px`, this.root.appendChild(a2), this.floats.push({ el: a2, x: t2, y: n2, t: 0, life: Math.max(i2, 1.3), vy: 0 }), this.floats.length > 80 && this.floats.shift()?.el.remove();
  }
  update(e4) {
    for (let t2 = this.floats.length - 1; t2 >= 0; --t2) {
      let n2 = this.floats[t2];
      n2.t += e4, n2.t >= n2.life && (n2.el.remove(), this.floats.splice(t2, 1));
    }
  }
  clear() {
    for (let e4 of this.itemEls.values()) e4.remove();
    this.itemEls.clear(), this.rects.clear();
    for (let e4 of this.floats) e4.el.remove();
    this.floats = [];
    for (let e4 of this.named.values()) e4.style.display = `none`;
  }
};
Ed();
var _g = (function(e4) {
  return e4[e4.Blood = 0] = `Blood`, e4[e4.Scorch = 1] = `Scorch`, e4[e4.Shadow = 2] = `Shadow`, e4[e4.Telegraph = 3] = `Telegraph`, e4[e4.TelegraphCone = 4] = `TelegraphCone`, e4[e4.Frost = 5] = `Frost`, e4[e4.Poison = 6] = `Poison`, e4[e4.Rune = 7] = `Rune`, e4[e4.Ring = 8] = `Ring`, e4[e4.Click = 9] = `Click`, e4[e4.Select = 10] = `Select`, e4[e4.Glow = 11] = `Glow`, e4;
})({}), vg = 20, yg = class {
  max;
  mesh;
  d;
  n = 0;
  aA;
  aB;
  aC;
  aD;
  geo;
  nextId = 1;
  ids;
  constructor(e4, t2, n2) {
    this.max = e4, this.d = new Float32Array(e4 * vg), this.ids = new Int32Array(e4);
    let r2 = new Bo(1, 1);
    r2.rotateX(-Math.PI / 2), this.geo = new Ps(), this.geo.index = r2.index, this.geo.setAttribute(`position`, r2.getAttribute(`position`)), this.geo.setAttribute(`uv`, r2.getAttribute(`uv`));
    let i2 = () => {
      let t3 = new La(new Float32Array(e4 * 4), 4);
      return t3.setUsage(qn), t3;
    };
    this.aA = i2(), this.aB = i2(), this.aC = i2(), this.aD = i2(), this.geo.setAttribute(`iA`, this.aA), this.geo.setAttribute(`iB`, this.aB), this.geo.setAttribute(`iC`, this.aC), this.geo.setAttribute(`iD`, this.aD), this.geo.instanceCount = 0, this.mesh = new xa(this.geo, t2), this.mesh.frustumCulled = false, this.mesh.renderOrder = n2;
  }
  add(e4, t2, n2, r2, i2) {
    this.n >= this.max && this.removeAt(0);
    let a2 = this.n++, o2 = this.d, s2 = a2 * vg;
    o2[s2] = t2, o2[s2 + 1] = n2, o2[s2 + 2] = r2, o2[s2 + 3] = i2.rot ?? 0, o2[s2 + 4] = i2.sx ?? 1, o2[s2 + 5] = i2.sz ?? i2.sx ?? 1, o2[s2 + 6] = e4, o2[s2 + 7] = i2.seed ?? Math.abs(Math.sin(t2 * 12.9 + r2 * 78.2)) * 100, o2[s2 + 8] = i2.r ?? 1, o2[s2 + 9] = i2.g ?? 1, o2[s2 + 10] = i2.b ?? 1, o2[s2 + 11] = i2.a ?? 1, o2[s2 + 12] = 0, o2[s2 + 13] = i2.life ?? 10, o2[s2 + 14] = i2.grow ?? 0, o2[s2 + 15] = i2.fade ?? 1, o2[s2 + 16] = i2.angle ?? 0.6;
    let c2 = this.nextId++;
    return this.ids[a2] = c2, c2;
  }
  set(e4, t2, n2, r2, i2, a2) {
    for (let o2 = 0; o2 < this.n; o2 += 1) {
      if (this.ids[o2] !== e4) continue;
      let s2 = o2 * vg;
      this.d[s2] = t2, this.d[s2 + 1] = n2, this.d[s2 + 2] = r2, this.d[s2 + 17] = i2, a2 !== void 0 && (this.d[s2 + 11] = a2);
      return;
    }
  }
  kill(e4) {
    for (let t2 = 0; t2 < this.n; t2 += 1) if (this.ids[t2] === e4) {
      this.removeAt(t2);
      return;
    }
  }
  removeAt(e4) {
    let t2 = this.n - 1;
    e4 !== t2 && (this.d.copyWithin(e4 * vg, t2 * vg, t2 * vg + vg), this.ids[e4] = this.ids[t2]), this.n = t2;
  }
  update(e4) {
    let t2 = this.d;
    for (let n3 = 0; n3 < this.n; n3 += 1) {
      let r3 = n3 * vg;
      t2[r3 + 12] += e4, t2[r3 + 12] >= t2[r3 + 13] && (this.removeAt(n3), --n3);
    }
    let n2 = this.aA.array, r2 = this.aB.array, i2 = this.aC.array, a2 = this.aD.array;
    for (let e5 = 0; e5 < this.n; e5 += 1) {
      let o2 = e5 * vg, s2 = t2[o2 + 12], c2 = t2[o2 + 13], l2 = t2[o2 + 14] > 0 ? Math.min(1, s2 / t2[o2 + 14]) : 1, u2 = 1 - (1 - l2) ** 3, d2 = t2[o2 + 15] > 0 ? Math.min(1, (c2 - s2) / t2[o2 + 15]) : 1;
      n2[e5 * 4] = t2[o2], n2[e5 * 4 + 1] = t2[o2 + 1], n2[e5 * 4 + 2] = t2[o2 + 2], n2[e5 * 4 + 3] = t2[o2 + 3], r2[e5 * 4] = t2[o2 + 4] * u2, r2[e5 * 4 + 1] = t2[o2 + 5] * u2, r2[e5 * 4 + 2] = t2[o2 + 6], r2[e5 * 4 + 3] = t2[o2 + 7], i2[e5 * 4] = t2[o2 + 8], i2[e5 * 4 + 1] = t2[o2 + 9], i2[e5 * 4 + 2] = t2[o2 + 10], i2[e5 * 4 + 3] = t2[o2 + 11] * Math.max(0, d2), a2[e5 * 4] = t2[o2 + 17], a2[e5 * 4 + 1] = t2[o2 + 16], a2[e5 * 4 + 2] = s2, a2[e5 * 4 + 3] = l2;
    }
    this.geo.instanceCount = this.n;
    for (let e5 of [this.aA, this.aB, this.aC, this.aD]) e5.needsUpdate = true;
  }
  clear() {
    this.n = 0, this.geo.instanceCount = 0;
  }
}, bg = `
  attribute vec4 iA; attribute vec4 iB; attribute vec4 iC; attribute vec4 iD;
  varying vec2 vUv; varying vec4 vCol; varying vec4 vB; varying vec4 vD;
  void main() {
    vUv = uv; vCol = iC; vB = iB; vD = iD;
    float c = cos(iA.w), s = sin(iA.w);
    vec3 p = position;
    p.x *= iB.x; p.z *= iB.y;
    p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
    p += iA.xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`, xg = `
  uniform float uTime;
  varying vec2 vUv; varying vec4 vCol; varying vec4 vB; varying vec4 vD;
  float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
  float fbm(vec2 p){ return n2(p)*0.55 + n2(p*2.1)*0.3 + n2(p*4.3)*0.15; }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float type = vB.z;
    float seed = vB.w;
    float a = 0.0;
    vec3 col = vCol.rgb;
    if (type < 0.5) { // blood: noisy splat with droplets
      float n = fbm(p * 2.2 + seed);
      a = smoothstep(0.75, 0.55, r + (n - 0.5) * 0.6);
      float drops = step(0.86, h21(floor((p + seed) * 7.0))) * smoothstep(1.0, 0.7, r);
      a = max(a, drops * 0.8);
      col *= 0.6 + n * 0.5;
    } else if (type < 1.5) { // scorch
      float n = fbm(p * 2.6 + seed);
      a = smoothstep(0.9, 0.3, r + (n - 0.5) * 0.5) * 0.9;
      col = mix(vec3(0.02), vec3(0.06, 0.04, 0.03), n);
    } else if (type < 2.5) { // contact shadow
      a = pow(clamp(1.0 - r, 0.0, 1.0), 1.6);
      col = vec3(0.0);
    } else if (type < 3.5) { // telegraph circle: rim + filling progress
      float rim = smoothstep(0.035, 0.0, abs(r - 0.94));
      float fill = step(r, vD.x) * 0.28 + step(r, 1.0) * 0.12;
      float pulse = 0.75 + 0.25 * sin(uTime * 14.0);
      a = (rim + fill) * pulse * step(r, 1.0);
    } else if (type < 4.5) { // telegraph cone along +Z
      float ang = atan(p.x, p.y);
      float inside = step(abs(ang), vD.y) * step(r, 1.0);
      float edge = smoothstep(0.04, 0.0, abs(abs(ang) - vD.y)) * step(r, 1.0) + smoothstep(0.03, 0.0, abs(r - 0.97)) * inside;
      float pulse = 0.75 + 0.25 * sin(uTime * 14.0);
      a = (inside * (0.12 + step(r, vD.x) * 0.25) + edge) * pulse;
    } else if (type < 5.5) { // frost crystals
      float n = fbm(p * 3.0 + seed);
      float spokes = pow(abs(cos(atan(p.y, p.x) * 6.0 + n * 3.0)), 8.0) * smoothstep(1.0, 0.2, r);
      a = (smoothstep(1.0, 0.4, r + (n - 0.5) * 0.4) * 0.35 + spokes * 0.6);
    } else if (type < 6.5) { // poison pool
      float n = fbm(p * 2.0 + seed + uTime * 0.2);
      a = smoothstep(0.95, 0.6, r + (n - 0.5) * 0.4) * (0.55 + 0.45 * n);
    } else if (type < 7.5) { // rune circle
      float ring1 = smoothstep(0.03, 0.0, abs(r - 0.92));
      float ring2 = smoothstep(0.02, 0.0, abs(r - 0.72));
      float ang = atan(p.y, p.x) + uTime * 0.6;
      float glyph = step(0.5, fract(ang * 3.8197)) * smoothstep(0.06, 0.0, abs(r - 0.82)) ;
      float star = smoothstep(0.03, 0.0, abs(r * cos(mod(ang, 1.2566) - 0.6283) - 0.55)) * step(r, 0.72);
      a = (ring1 + ring2 + glyph * 0.8 + star * 0.7);
    } else if (type < 8.5) { // expanding ring (shockwave)
      float w = 0.12 * (1.0 - vD.w * 0.6);
      a = smoothstep(w, 0.0, abs(r - 0.85)) * step(r, 1.0);
    } else if (type < 9.5) { // click marker
      float t = clamp(vD.z / 0.45, 0.0, 1.0);
      a = smoothstep(0.08, 0.0, abs(r - mix(0.25, 0.95, t))) * (1.0 - t);
    } else if (type < 10.5) { // selection ring
      float ang = atan(p.y, p.x);
      float dash = step(0.35, fract(ang * 2.546 + uTime * 0.4));
      a = smoothstep(0.06, 0.0, abs(r - 0.88)) * (0.5 + dash * 0.5);
    } else { // soft glow disc
      a = pow(clamp(1.0 - r, 0.0, 1.0), 2.0);
    }
    a *= vCol.a;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`, Sg = class {
  dark;
  glow;
  group = new Qr();
  uniforms = { uTime: { value: 0 } };
  constructor() {
    let e4 = new qo({ uniforms: this.uniforms, vertexShader: bg, fragmentShader: xg, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), t2 = new qo({ uniforms: this.uniforms, vertexShader: bg, fragmentShader: xg.replace(`gl_FragColor = vec4(col, a);`, `gl_FragColor = vec4(col * a, 0.0);`), transparent: true, depthWrite: false, blending: 5, blendSrc: 201, blendDst: 201, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    this.dark = new yg(700, e4, 2), this.glow = new yg(300, t2, 3), this.group.add(this.dark.mesh, this.glow.mesh);
  }
  add(e4, t2, n2, r2, i2 = {}) {
    let a2 = e4 === 0 || e4 === 1 || e4 === 2 ? this.dark : this.glow;
    return { pool: a2, id: a2.add(e4, t2, n2 + 0.03, r2, i2) };
  }
  update(e4, t2) {
    this.uniforms.uTime.value = t2, this.dark.update(e4), this.glow.update(e4);
  }
  clear() {
    this.dark.clear(), this.glow.clear();
  }
};
Ed(), cg();
var Cg = 24, wg = class {
  max;
  mesh;
  data;
  count = 0;
  aPos;
  aCol;
  aMisc;
  aVel;
  geo;
  constructor(e4, t2) {
    this.max = e4, this.data = new Float32Array(e4 * Cg);
    let n2 = new Bo(1, 1);
    this.geo = new Ps(), this.geo.index = n2.index, this.geo.setAttribute(`position`, n2.getAttribute(`position`)), this.geo.setAttribute(`uv`, n2.getAttribute(`uv`)), this.aPos = new La(new Float32Array(e4 * 3), 3), this.aCol = new La(new Float32Array(e4 * 4), 4), this.aMisc = new La(new Float32Array(e4 * 3), 3), this.aVel = new La(new Float32Array(e4 * 3), 3);
    for (let e5 of [this.aPos, this.aCol, this.aMisc, this.aVel]) e5.setUsage(qn);
    this.geo.setAttribute(`iPos`, this.aPos), this.geo.setAttribute(`iCol`, this.aCol), this.geo.setAttribute(`iMisc`, this.aMisc), this.geo.setAttribute(`iVel`, this.aVel), this.geo.instanceCount = 0, this.mesh = new xa(this.geo, t2), this.mesh.frustumCulled = false, this.mesh.renderOrder = 10;
  }
  emit(e4) {
    if (this.count >= this.max) return;
    let t2 = this.data, n2 = this.count * Cg;
    t2[n2] = e4.x, t2[n2 + 1] = e4.y, t2[n2 + 2] = e4.z, t2[n2 + 3] = e4.vx ?? 0, t2[n2 + 4] = e4.vy ?? 0, t2[n2 + 5] = e4.vz ?? 0, t2[n2 + 6] = 0, t2[n2 + 7] = e4.life, t2[n2 + 8] = e4.size, t2[n2 + 9] = e4.size1 ?? e4.size, t2[n2 + 10] = e4.r, t2[n2 + 11] = e4.g, t2[n2 + 12] = e4.b, t2[n2 + 13] = e4.a ?? 1, t2[n2 + 14] = e4.r1 ?? e4.r, t2[n2 + 15] = e4.g1 ?? e4.g, t2[n2 + 16] = e4.b1 ?? e4.b, t2[n2 + 17] = e4.a1 ?? 0, t2[n2 + 18] = e4.gravity ?? 0, t2[n2 + 19] = e4.drag ?? 0, t2[n2 + 20] = e4.rot ?? 0, t2[n2 + 21] = e4.spin ?? 0, t2[n2 + 22] = e4.stretch ?? 0, this.count += 1;
  }
  update(e4) {
    let t2 = this.data, n2 = this.count;
    for (let r3 = 0; r3 < n2; r3 += 1) {
      let i3 = r3 * Cg;
      if (t2[i3 + 6] += e4, t2[i3 + 6] >= t2[i3 + 7]) {
        --n2;
        let e5 = n2 * Cg;
        for (let n3 = 0; n3 < Cg; n3 += 1) t2[i3 + n3] = t2[e5 + n3];
        --r3;
        continue;
      }
      let a3 = Math.exp(-t2[i3 + 19] * e4);
      t2[i3 + 3] *= a3, t2[i3 + 4] = t2[i3 + 4] * a3 - t2[i3 + 18] * e4, t2[i3 + 5] *= a3, t2[i3] += t2[i3 + 3] * e4, t2[i3 + 1] += t2[i3 + 4] * e4, t2[i3 + 2] += t2[i3 + 5] * e4, t2[i3 + 20] += t2[i3 + 21] * e4;
    }
    this.count = n2;
    let r2 = this.aPos.array, i2 = this.aCol.array, a2 = this.aMisc.array, o2 = this.aVel.array;
    for (let e5 = 0; e5 < n2; e5 += 1) {
      let n3 = e5 * Cg, s2 = t2[n3 + 6] / t2[n3 + 7];
      r2[e5 * 3] = t2[n3], r2[e5 * 3 + 1] = t2[n3 + 1], r2[e5 * 3 + 2] = t2[n3 + 2], i2[e5 * 4] = t2[n3 + 10] + (t2[n3 + 14] - t2[n3 + 10]) * s2, i2[e5 * 4 + 1] = t2[n3 + 11] + (t2[n3 + 15] - t2[n3 + 11]) * s2, i2[e5 * 4 + 2] = t2[n3 + 12] + (t2[n3 + 16] - t2[n3 + 12]) * s2;
      let c2 = Math.min(1, s2 * 10);
      i2[e5 * 4 + 3] = (t2[n3 + 13] + (t2[n3 + 17] - t2[n3 + 13]) * s2) * c2, a2[e5 * 3] = t2[n3 + 8] + (t2[n3 + 9] - t2[n3 + 8]) * s2, a2[e5 * 3 + 1] = t2[n3 + 20], a2[e5 * 3 + 2] = t2[n3 + 22], o2[e5 * 3] = t2[n3 + 3], o2[e5 * 3 + 1] = t2[n3 + 4], o2[e5 * 3 + 2] = t2[n3 + 5];
    }
    this.geo.instanceCount = n2, n2 > 0 && (this.aPos.addUpdateRange(0, n2 * 3), this.aCol.addUpdateRange(0, n2 * 4), this.aMisc.addUpdateRange(0, n2 * 3), this.aVel.addUpdateRange(0, n2 * 3), this.aPos.needsUpdate = true, this.aCol.needsUpdate = true, this.aMisc.needsUpdate = true, this.aVel.needsUpdate = true);
  }
  clear() {
    this.count = 0, this.geo.instanceCount = 0;
  }
  get alive() {
    return this.count;
  }
}, Tg = `
  attribute vec3 iPos;
  attribute vec4 iCol;
  attribute vec3 iMisc;
  attribute vec3 iVel;
  varying vec2 vUv;
  varying vec4 vCol;
  void main() {
    vUv = uv;
    vCol = iCol;
    vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
    float size = iMisc.x;
    vec2 corner = position.xy;
    if (iMisc.z > 0.0) {
      vec3 vv = (modelViewMatrix * vec4(iVel, 0.0)).xyz;
      float sp = length(vv.xy);
      vec2 dir = sp > 1e-4 ? vv.xy / sp : vec2(0.0, 1.0);
      vec2 perp = vec2(-dir.y, dir.x);
      float len = size + sp * iMisc.z;
      mv.xy += dir * corner.y * len + perp * corner.x * size;
    } else {
      float c = cos(iMisc.y), s = sin(iMisc.y);
      mv.xy += vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y) * size;
    }
    gl_Position = projectionMatrix * mv;
  }
`, Eg = class {
  additive;
  alpha;
  group = new Qr();
  constructor() {
    let e4 = eg(64, 2.2), t2 = tg(128, 5), n2 = new qo({ uniforms: { uTex: { value: e4 } }, vertexShader: Tg, fragmentShader: `
        uniform sampler2D uTex;
        varying vec2 vUv;
        varying vec4 vCol;
        void main() {
          float a = texture2D(uTex, vUv).a;
          gl_FragColor = vec4(vCol.rgb * a * vCol.a, 0.0);
        }`, transparent: true, depthWrite: false, blending: 5, blendSrc: 201, blendDst: 201, blendEquation: 100 }), r2 = new qo({ uniforms: { uTex: { value: t2 } }, vertexShader: Tg, fragmentShader: `
        uniform sampler2D uTex;
        varying vec2 vUv;
        varying vec4 vCol;
        void main() {
          float a = texture2D(uTex, vUv).a * vCol.a;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vCol.rgb, a);
        }`, transparent: true, depthWrite: false });
    this.additive = new wg(4e3, n2), this.alpha = new wg(2500, r2), this.alpha.mesh.renderOrder = 9, this.group.add(this.alpha.mesh, this.additive.mesh);
  }
  update(e4) {
    this.additive.update(e4), this.alpha.update(e4);
  }
  clear() {
    this.additive.clear(), this.alpha.clear();
  }
  get count() {
    return this.additive.alive + this.alpha.alive;
  }
};
Ed(), Ld();
var Dg = { physical: [1, 0.9, 0.75], fire: [1, 0.45, 0.12], cold: [0.45, 0.8, 1], lightning: [0.75, 0.82, 1], poison: [0.45, 0.95, 0.25], magic: [0.8, 0.45, 1] }, Og = class {
  lights;
  particles = new Eg();
  decals = new Sg();
  group = new Qr();
  rng = new Id(9001);
  transients = [];
  emitters = [];
  missiles = /* @__PURE__ */ new Map();
  bolts = [];
  meteors = [];
  geos = {};
  mats = {};
  heightAt = () => 0;
  rain = 0;
  lightningT = 8;
  onLightning = null;
  reducedMotion = false;
  flames = [];
  ambient = `moor`;
  constructor(e4) {
    this.lights = e4, this.group.add(this.particles.group, this.decals.group), this.geos.shard = new zo(0.16, 0).scale(0.7, 0.7, 2.6), this.geos.orb = new Lo(0.42, 1), this.geos.bone = new lo(0.11, 1.3, 6).rotateX(Math.PI / 2), this.geos.tooth = new lo(0.06, 0.34, 5).rotateX(Math.PI / 2), this.geos.quill = new lo(0.035, 0.6, 4).rotateX(Math.PI / 2), this.geos.arrow = new co(0.02, 0.02, 0.9, 4).rotateX(Math.PI / 2), this.geos.core = new Lo(0.18, 1), this.geos.rock = new fo(0.9, 1), this.mats.ice = new Yo({ color: `#cfefff`, emissive: `#5ab8ff`, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }), this.mats.orb = new Yo({ color: `#e8f8ff`, emissive: `#7fd4ff`, emissiveIntensity: 3.2, roughness: 0.1 }), this.mats.bone = new Yo({ color: `#efe6d0`, emissive: `#d8ffe8`, emissiveIntensity: 0.6, roughness: 0.5 }), this.mats.dark = new Yo({ color: `#2a2018`, roughness: 0.7 }), this.mats.arrow = new Yo({ color: `#5a4630`, roughness: 0.7 }), this.mats.core = new la({ color: new P(4, 2, 0.8) }), this.mats.rock = new Yo({ color: `#2a1a12`, emissive: `#ff5a10`, emissiveIntensity: 1.8, roughness: 0.8 });
  }
  flash(e4, t2, n2, r2, i2, a2, o2) {
    let s2 = this.lights.addEmitter({ x: e4, y: t2, z: n2, color: new P(r2), intensity: i2, distance: a2, flicker: 0, priority: 4 });
    this.transients.push({ e: s2, life: o2, max: o2, base: i2 });
  }
  burst(e4, t2, n2, r2, i2, a2, o2, s2, c2 = {}) {
    let l2 = c2.alpha ? this.particles.alpha : this.particles.additive;
    for (let u2 = 0; u2 < r2; u2 += 1) {
      let r3 = this.rng.range(0, Math.PI * 2), u3 = (c2.up ?? 0.5) + this.rng.range(-0.3, 0.6), d2 = a2 * this.rng.range(0.35, 1);
      l2.emit({ x: e4 + this.rng.range(-0.1, 0.1) * (c2.spread ?? 1), y: t2, z: n2 + this.rng.range(-0.1, 0.1) * (c2.spread ?? 1), vx: Math.cos(r3) * d2, vy: u3 * d2, vz: Math.sin(r3) * d2, life: o2 * this.rng.range(0.6, 1.2), size: s2, size1: s2 * 0.3, r: i2[0], g: i2[1], b: i2[2], a: 1, gravity: c2.gravity ?? 6, drag: 2, stretch: c2.stretch });
    }
  }
  smoke(e4, t2, n2, r2, i2, a2, o2, s2 = 0.55) {
    for (let c2 = 0; c2 < r2; c2 += 1) this.particles.alpha.emit({ x: e4 + this.rng.range(-0.4, 0.4), y: t2 + this.rng.range(0, 0.4), z: n2 + this.rng.range(-0.4, 0.4), vx: this.rng.range(-0.4, 0.4), vy: this.rng.range(0.4, 1.2), vz: this.rng.range(-0.4, 0.4), life: o2 * this.rng.range(0.7, 1.3), size: a2 * 0.6, size1: a2 * 1.6, r: i2[0], g: i2[1], b: i2[2], a: s2, a1: 0, rot: this.rng.range(0, 6.28), spin: this.rng.range(-0.8, 0.8), drag: 1 });
  }
  groundY(e4, t2) {
    return this.heightAt(e4, t2);
  }
  handle(e4) {
    switch (e4.t) {
      case `hit`: {
        let t2 = Dg[e4.element];
        if (e4.element === `physical`) {
          let t3 = new P(e4.blood);
          e4.bone ? this.burst(e4.x, e4.y, e4.z, 8, [0.85, 0.8, 0.7], 4, 0.5, 0.09, { alpha: true, gravity: 12 }) : (this.burst(e4.x, e4.y, e4.z, 10 + Math.round(e4.strength * 8), [t3.r * 0.9, t3.g * 0.5, t3.b * 0.5], 4.5, 0.55, 0.11, { alpha: true, gravity: 14, stretch: 0.03 }), this.rng.chance(0.6) && this.decals.add(_g.Blood, e4.x + this.rng.range(-0.5, 0.5), this.groundY(e4.x, e4.z), e4.z + this.rng.range(-0.5, 0.5), { sx: this.rng.range(0.5, 1.1), rot: this.rng.range(0, 6.28), r: t3.r * 0.7, g: t3.g * 0.4, b: t3.b * 0.4, a: 0.85, life: 40, fade: 6, grow: 0.15 })), this.burst(e4.x, e4.y, e4.z, 4, [1.6, 1.3, 0.9], 6, 0.18, 0.08, { stretch: 0.05, gravity: 4 });
        } else this.burst(e4.x, e4.y, e4.z, 12, [t2[0] * 2.4, t2[1] * 2.4, t2[2] * 2.4], 5, 0.35, 0.14, { stretch: 0.04, gravity: e4.element === `fire` ? -2 : 4 }), this.flash(e4.x, e4.y + 0.6, e4.z, sh[e4.element], 6, 5, 0.16), e4.element === `cold` && this.smoke(e4.x, e4.y - 0.3, e4.z, 3, [0.8, 0.92, 1], 0.6, 0.8, 0.35);
        break;
      }
      case `explode`: {
        let t2 = Dg[e4.element], n2 = this.groundY(e4.x, e4.z), r2 = e4.radius, i2 = e4.element === `fire`;
        this.particles.additive.emit({ x: e4.x, y: n2 + 0.7, z: e4.z, life: 0.12, size: r2 * 0.8, size1: r2 * 0.35, r: 1.9, g: 1.35, b: 0.7, a: 1, r1: t2[0] * 1.2, g1: t2[1] * 1.2, b1: t2[2] * 1.2, a1: 0 });
        let a2 = Math.round(8 + r2 * 3);
        for (let o2 = 0; o2 < a2; o2 += 1) {
          let a3 = this.rng.range(0, Math.PI * 2), o3 = this.rng.range(0.6, 1) * (2.2 + r2 * 1.4);
          this.particles.additive.emit({ x: e4.x + Math.cos(a3) * 0.2, y: n2 + this.rng.range(0.3, 0.9), z: e4.z + Math.sin(a3) * 0.2, vx: Math.cos(a3) * o3, vy: this.rng.range(0.8, 2.6), vz: Math.sin(a3) * o3, life: this.rng.range(0.45, 0.8), size: this.rng.range(0.45, 0.8) * (0.7 + r2 * 0.22), size1: this.rng.range(1, 1.6) * (0.7 + r2 * 0.22), r: i2 ? 1.35 : t2[0] * 1.3, g: i2 ? 0.62 : t2[1] * 1.3, b: i2 ? 0.16 : t2[2] * 1.3, a: 0.6, r1: i2 ? 0.55 : t2[0] * 0.4, g1: i2 ? 0.07 : t2[1] * 0.4, b1: i2 ? 0.02 : t2[2] * 0.4, a1: 0, drag: 3.2, gravity: -1.5, rot: this.rng.range(0, 6.28), spin: this.rng.range(-2, 2) });
        }
        this.burst(e4.x, n2 + 0.5, e4.z, Math.round(12 + r2 * 5), [t2[0] * 2.2, t2[1] * 1.8, t2[2] * 1.2], 9 + r2 * 2.5, 0.55, 0.06, { stretch: 0.05, gravity: 9, up: 0.9 }), i2 && this.smoke(e4.x, n2 + 0.8, e4.z, Math.round(5 + r2 * 3), [0.09, 0.075, 0.07], 1.3 * Math.max(1, r2 * 0.6), 2, 0.55), this.decals.add(_g.Ring, e4.x, n2, e4.z, { sx: r2 * 2, r: t2[0] * 2, g: t2[1] * 1.8, b: t2[2] * 1.6, a: 0.7, life: 0.26, grow: 0.3, fade: 0.18 }), i2 && this.decals.add(_g.Scorch, e4.x, n2, e4.z, { sx: r2 * 1.6, rot: this.rng.range(0, 6.28), a: 0.85, life: 30, fade: 5 }), this.flash(e4.x, n2 + 1.6, e4.z, sh[e4.element], 14 + r2 * 4, 5 + r2 * 2, 0.28);
        break;
      }
      case `nova`: {
        let t2 = Dg[e4.element], n2 = this.groundY(e4.x, e4.z);
        this.decals.add(_g.Ring, e4.x, n2, e4.z, { sx: e4.radius * 2, r: t2[0] * 1.2, g: t2[1] * 1.25, b: t2[2] * 1.4, a: 0.7, life: 0.42, grow: 0.42, fade: 0.2 }), e4.element === `cold` && this.decals.add(_g.Frost, e4.x, n2, e4.z, { sx: e4.radius * 1.6, r: 0.42, g: 0.66, b: 0.95, a: 0.4, life: 3, grow: 0.3, fade: 1.5 });
        let r2 = Math.round(e4.radius * 14);
        for (let i2 = 0; i2 < r2; i2 += 1) {
          let a2 = i2 / r2 * Math.PI * 2, o2 = e4.radius / 0.42;
          this.particles.additive.emit({ x: e4.x, y: n2 + 0.4, z: e4.z, vx: Math.cos(a2) * o2, vy: 0.4, vz: Math.sin(a2) * o2, life: 0.45, size: 0.22, size1: 0.1, r: t2[0] * 1.8, g: t2[1] * 1.8, b: t2[2] * 2, a: 1, drag: 0.5, stretch: 0.02 });
        }
        this.flash(e4.x, n2 + 1.4, e4.z, sh[e4.element], 16, e4.radius + 3, 0.36);
        break;
      }
      case `meteorWarn`: {
        let t2 = this.groundY(e4.x, e4.z);
        this.decals.add(_g.Telegraph, e4.x, t2, e4.z, { sx: e4.radius * 2, r: 2.2, g: 0.7, b: 0.15, a: 0.9, life: e4.delay + 0.05, fade: 0.05 });
        let n2 = new xa(this.geos.rock, this.mats.rock);
        n2.castShadow = false, this.group.add(n2), this.meteors.push({ mesh: n2, t: -Math.max(0, e4.delay - 0.55), dur: 0.55, x: e4.x, z: e4.z });
        break;
      }
      case `meteor`: {
        this.handle({ t: `explode`, x: e4.x, z: e4.z, radius: e4.radius, element: `fire` });
        let t2 = this.groundY(e4.x, e4.z);
        this.burst(e4.x, t2 + 0.5, e4.z, 24, [0.35, 0.22, 0.12], 8, 1.2, 0.18, { alpha: true, gravity: 14, up: 1.2 });
        break;
      }
      case `burnGround`: {
        let t2 = e4.radius;
        this.emitters.push({ x: e4.x, y: this.groundY(e4.x, e4.z), z: e4.z, life: e4.duration, rate: 40 * t2, acc: 0, fn: (e5, n3, r2) => {
          let i2 = this.rng.range(0, Math.PI * 2), a2 = Math.sqrt(this.rng.next()) * t2;
          this.flameParticle(e5 + Math.cos(i2) * a2, n3 + 0.1, r2 + Math.sin(i2) * a2, 0.5);
        } });
        let n2 = this.lights.addEmitter({ x: e4.x, y: 1.2, z: e4.z, color: new P(`#ff7a2a`), intensity: 22, distance: 9, flicker: 2, priority: 3 });
        this.transients.push({ e: n2, life: e4.duration, max: e4.duration, base: 22 });
        break;
      }
      case `teleport`: {
        let t2 = new P(e4.color);
        for (let [n2, r2] of [[e4.x0, e4.z0], [e4.x1, e4.z1]]) {
          let i2 = this.groundY(n2, r2);
          for (let e5 = 0; e5 < 30; e5 += 1) this.particles.additive.emit({ x: n2 + this.rng.range(-0.4, 0.4), y: i2 + this.rng.range(0, 2), z: r2 + this.rng.range(-0.4, 0.4), vx: 0, vy: this.rng.range(1, 4), vz: 0, life: 0.5, size: 0.12, size1: 0.02, r: t2.r * 3, g: t2.g * 3, b: t2.b * 3, a: 1, stretch: 0.05 });
          this.decals.add(_g.Ring, n2, i2, r2, { sx: 2.2, r: t2.r * 2, g: t2.g * 2, b: t2.b * 2, life: 0.4, grow: 0.3 }), this.flash(n2, i2 + 1.4, r2, e4.color, 14, 6, 0.3);
        }
        break;
      }
      case `lightning`: {
        this.spawnBolt(e4.pts, e4.color);
        let t2 = e4.pts[e4.pts.length - 1];
        this.flash(t2.x, t2.y + 0.5, t2.z, e4.color, 16, 7, 0.18);
        break;
      }
      case `cast`: {
        let t2 = Dg[e4.element], n2 = e4.unit, r2 = n2.y + n2.height * 0.6, i2 = n2.x + Math.sin(n2.facing) * 0.5, a2 = n2.z + Math.cos(n2.facing) * 0.5;
        this.burst(i2, r2 + this.groundY(n2.x, n2.z), a2, 10, [t2[0] * 1.8, t2[1] * 1.8, t2[2] * 1.8], 2, 0.35, 0.13, { gravity: -1 }), this.flash(n2.x + Math.sin(n2.facing) * 1.1, r2 + this.groundY(n2.x, n2.z) + 0.6, n2.z + Math.cos(n2.facing) * 1.1, sh[e4.element], 5, 4.5, 0.22);
        break;
      }
      case `shout`: {
        let t2 = this.groundY(e4.x, e4.z), n2 = new P(e4.color);
        this.decals.add(_g.Ring, e4.x, t2, e4.z, { sx: e4.radius * 2, r: n2.r * 1.6, g: n2.g * 1.6, b: n2.b * 1.6, life: 0.55, grow: 0.45, fade: 0.2 }), this.smoke(e4.x, t2 + 0.2, e4.z, 10, [0.35, 0.3, 0.25], 1.2, 0.9, 0.4);
        break;
      }
      case `buff`: {
        let t2 = new P(e4.color), n2 = e4.unit, r2 = this.groundY(n2.x, n2.z);
        for (let e5 = 0; e5 < 26; e5 += 1) {
          let e6 = this.rng.range(0, Math.PI * 2);
          this.particles.additive.emit({ x: n2.x + Math.cos(e6) * 0.7, y: r2 + this.rng.range(0, 0.6), z: n2.z + Math.sin(e6) * 0.7, vx: -Math.cos(e6) * 0.3, vy: this.rng.range(1.5, 3.2), vz: -Math.sin(e6) * 0.3, life: 0.9, size: 0.12, size1: 0.02, r: t2.r * 3, g: t2.g * 3, b: t2.b * 3, a: 1 });
        }
        this.decals.add(_g.Rune, n2.x, r2, n2.z, { sx: 2.4, r: t2.r * 1.5, g: t2.g * 1.5, b: t2.b * 1.5, life: 1, grow: 0.25, fade: 0.5 });
        break;
      }
      case `curse`: {
        let t2 = this.groundY(e4.x, e4.z), n2 = new P(e4.color);
        this.decals.add(_g.Rune, e4.x, t2, e4.z, { sx: e4.radius * 2, r: n2.r * 2, g: n2.g * 2, b: n2.b * 2, life: 1.2, grow: 0.2, fade: 0.6 }), this.smoke(e4.x, t2 + 0.3, e4.z, 8, [n2.r * 0.4, n2.g * 0.1, n2.b * 0.2], 1.4, 1.2, 0.35);
        break;
      }
      case `summon`: {
        let t2 = this.groundY(e4.x, e4.z), n2 = new P(e4.color);
        this.decals.add(_g.Rune, e4.x, t2, e4.z, { sx: 2.2, r: n2.r * 2, g: n2.g * 2, b: n2.b * 2, life: 1.3, grow: 0.3, fade: 0.6 }), this.burst(e4.x, t2 + 0.1, e4.z, 16, [0.75, 0.7, 0.6], 2.5, 0.8, 0.1, { alpha: true, up: 1.5, gravity: 5 });
        for (let r2 = 0; r2 < 16; r2 += 1) this.particles.additive.emit({ x: e4.x + this.rng.range(-0.5, 0.5), y: t2 + 0.1, z: e4.z + this.rng.range(-0.5, 0.5), vy: this.rng.range(1, 3), life: 0.8, size: 0.1, size1: 0.02, r: n2.r * 2.5, g: n2.g * 2.5, b: n2.b * 2.5 });
        this.flash(e4.x, t2 + 1, e4.z, e4.color, 12, 6, 0.6);
        break;
      }
      case `corpseExplode`: {
        let t2 = this.groundY(e4.x, e4.z);
        this.handle({ t: `explode`, x: e4.x, z: e4.z, radius: Math.min(e4.radius, 1.8), element: `fire` }), this.decals.add(_g.Ring, e4.x, t2, e4.z, { sx: e4.radius * 2, r: 1.6, g: 0.35, b: 0.12, a: 0.6, life: 0.3, grow: 0.2, fade: 0.2 }), this.burst(e4.x, t2 + 0.5, e4.z, 34, [0.42, 0.035, 0.03], 7.5, 0.95, 0.17, { alpha: true, gravity: 15, up: 1.2, stretch: 0.02 }), this.burst(e4.x, t2 + 0.5, e4.z, 10, [0.75, 0.68, 0.58], 6, 0.9, 0.09, { alpha: true, gravity: 16, up: 1.3 });
        for (let n2 = 0; n2 < 4; n2 += 1) this.decals.add(_g.Blood, e4.x + this.rng.range(-1.5, 1.5), t2, e4.z + this.rng.range(-1.5, 1.5), { sx: this.rng.range(0.8, 1.6), rot: this.rng.range(0, 6.28), r: 0.35, g: 0.03, b: 0.03, life: 45, fade: 6 });
        break;
      }
      case `death`: {
        let t2 = e4.unit, n2 = this.groundY(t2.x, t2.z), r2 = new P(t2.mdef?.bloodColor ?? `#6d0a0a`);
        e4.style === `shatter` ? (this.burst(t2.x, n2 + t2.height * 0.5, t2.z, 26, [0.75, 0.92, 1.2], 6, 0.9, 0.12, { alpha: false, gravity: 12, up: 0.9 }), this.smoke(t2.x, n2 + 0.6, t2.z, 5, [0.85, 0.95, 1], 0.9, 0.8, 0.4)) : e4.style === `bone` ? this.burst(t2.x, n2 + t2.height * 0.5, t2.z, 20, [0.85, 0.8, 0.68], 4, 0.8, 0.1, { alpha: true, gravity: 14 }) : e4.style === `burn` ? (this.burst(t2.x, n2 + 0.6, t2.z, 24, [2.4, 0.8, 0.2], 2, 1, 0.12, { gravity: -2, up: 1 }), this.smoke(t2.x, n2 + 0.6, t2.z, 5, [0.1, 0.08, 0.07], 1, 1.4, 0.5)) : e4.style === `boss` ? (this.handle({ t: `explode`, x: t2.x, z: t2.z, radius: 3.5, element: `fire` }), this.burst(t2.x, n2 + 1, t2.z, 60, [0.5, 0.03, 0.03], 9, 1.4, 0.2, { alpha: true, gravity: 12, up: 1.2 }), this.flash(t2.x, n2 + 2.5, t2.z, `#ff3030`, 30, 12, 1)) : this.burst(t2.x, n2 + t2.height * 0.5, t2.z, 14, [r2.r, r2.g * 0.6, r2.b * 0.6], 3.5, 0.7, 0.13, { alpha: true, gravity: 14 }), e4.style !== `shatter` && e4.style !== `bone` && this.decals.add(_g.Blood, t2.x + this.rng.range(-0.3, 0.3), n2, t2.z + this.rng.range(-0.3, 0.3), { sx: t2.radius * 3.2 + this.rng.range(0, 0.6), rot: this.rng.range(0, 6.28), r: r2.r * 0.6, g: r2.g * 0.4, b: r2.b * 0.4, a: 0.9, life: 60, fade: 8, grow: 1.2 });
        break;
      }
      case `levelUp`: {
        let t2 = e4.unit, n2 = this.groundY(t2.x, t2.z);
        for (let e5 = 0; e5 < 70; e5 += 1) {
          let e6 = this.rng.range(0, Math.PI * 2), r2 = this.rng.range(0, 0.9);
          this.particles.additive.emit({ x: t2.x + Math.cos(e6) * r2, y: n2 + this.rng.range(0, 0.4), z: t2.z + Math.sin(e6) * r2, vy: this.rng.range(3, 9), life: this.rng.range(0.6, 1.3), size: this.rng.range(0.08, 0.22), size1: 0.02, r: 3, g: 2.3, b: 0.9, a: 1, drag: 1.2, stretch: 0.04 });
        }
        this.decals.add(_g.Ring, t2.x, n2, t2.z, { sx: 5, r: 2.4, g: 1.8, b: 0.6, life: 0.8, grow: 0.6 }), this.decals.add(_g.Rune, t2.x, n2, t2.z, { sx: 3, r: 2, g: 1.5, b: 0.5, life: 1.6, grow: 0.3, fade: 0.8 }), this.flash(t2.x, n2 + 2.6, t2.z, `#ffd27a`, 26, 10, 0.9);
        break;
      }
      case `potion`: {
        let t2 = e4.unit, n2 = e4.kind === `hp` ? [2.2, 0.25, 0.2] : e4.kind === `mp` ? [0.3, 0.6, 2.4] : [1.8, 0.4, 2], r2 = this.groundY(t2.x, t2.z);
        for (let e5 = 0; e5 < 20; e5 += 1) {
          let i2 = e5 / 20 * Math.PI * 4;
          this.particles.additive.emit({ x: t2.x + Math.cos(i2) * 0.55, y: r2 + 0.2 + e5 * 0.07, z: t2.z + Math.sin(i2) * 0.55, vx: -Math.sin(i2) * 0.8, vy: 1.2, vz: Math.cos(i2) * 0.8, life: 0.7, size: 0.1, size1: 0.02, r: n2[0], g: n2[1], b: n2[2], a: 1 });
        }
        break;
      }
      case `telegraph`: {
        let t2 = this.groundY(e4.x, e4.z);
        if (e4.angle !== void 0) {
          let n2 = this.decals.add(_g.TelegraphCone, e4.x, t2, e4.z, { sx: e4.radius * 2, rot: e4.rot ?? 0, angle: e4.angle, r: 2.2, g: 0.2, b: 0.1, life: e4.duration, fade: 0.05 });
          this.animateFill(n2.pool, n2.id, e4.x, t2, e4.z, e4.duration);
        } else {
          let n2 = this.decals.add(_g.Telegraph, e4.x, t2, e4.z, { sx: e4.radius * 2, r: 2.2, g: 0.2, b: 0.1, life: e4.duration, fade: 0.05 });
          this.animateFill(n2.pool, n2.id, e4.x, t2, e4.z, e4.duration);
        }
        break;
      }
      case `resurrect`: {
        let t2 = e4.unit, n2 = this.groundY(t2.x, t2.z);
        for (let e5 = 0; e5 < 30; e5 += 1) this.particles.additive.emit({ x: t2.x + this.rng.range(-0.5, 0.5), y: n2 + 0.1, z: t2.z + this.rng.range(-0.5, 0.5), vy: this.rng.range(1, 3.5), life: 0.9, size: 0.14, size1: 0.02, r: 2.4, g: 0.4, b: 0.2, a: 1 });
        this.decals.add(_g.Rune, t2.x, n2, t2.z, { sx: 1.8, r: 2, g: 0.3, b: 0.1, life: 1.2, grow: 0.2, fade: 0.5 }), this.flash(t2.x, n2 + 1, t2.z, `#ff5a2a`, 14, 6, 0.8);
        break;
      }
      case `leapLand`: {
        let t2 = this.groundY(e4.x, e4.z);
        this.decals.add(_g.Ring, e4.x, t2, e4.z, { sx: e4.radius * 2.4, r: 1.5, g: 1.2, b: 0.8, life: 0.4, grow: 0.3 }), this.decals.add(_g.Scorch, e4.x, t2, e4.z, { sx: e4.radius * 1.2, a: 0.5, life: 12, fade: 3 }), this.smoke(e4.x, t2 + 0.2, e4.z, 14, [0.32, 0.27, 0.22], 1.4, 1.1, 0.5), this.burst(e4.x, t2 + 0.2, e4.z, 18, [0.4, 0.33, 0.25], 6, 0.8, 0.1, { alpha: true, gravity: 14, up: 1 });
        break;
      }
      case `whirl`:
        break;
      case `shrine`: {
        let t2 = new P(e4.color), n2 = this.groundY(e4.x, e4.z);
        for (let r2 = 0; r2 < 50; r2 += 1) this.particles.additive.emit({ x: e4.x + this.rng.range(-0.6, 0.6), y: n2 + 0.5, z: e4.z + this.rng.range(-0.6, 0.6), vy: this.rng.range(2, 6), life: 1.2, size: 0.14, size1: 0.02, r: t2.r * 3, g: t2.g * 3, b: t2.b * 3, a: 1, stretch: 0.03 });
        this.flash(e4.x, n2 + 2.4, e4.z, e4.color, 22, 10, 1);
        break;
      }
      case `block`: {
        let t2 = e4.unit;
        this.burst(t2.x + Math.sin(t2.facing) * 0.4, this.groundY(t2.x, t2.z) + 1.1, t2.z + Math.cos(t2.facing) * 0.4, 10, [2.2, 1.9, 1.4], 5, 0.25, 0.06, { stretch: 0.05 });
        break;
      }
      case `click`: {
        let t2 = new P(e4.color);
        this.decals.add(_g.Click, e4.x, this.groundY(e4.x, e4.z), e4.z, { sx: 0.9, r: t2.r * 1.5, g: t2.g * 1.5, b: t2.b * 1.5, life: 0.45, fade: 0.1 });
        break;
      }
      case `bloodMoon`:
        break;
    }
  }
  fills = [];
  animateFill(e4, t2, n2, r2, i2, a2) {
    this.fills.push({ pool: e4, id: t2, x: n2, y: r2, z: i2, t: 0, dur: a2 });
  }
  flameParticle(e4, t2, n2, r2) {
    let i2 = this.rng.next();
    this.particles.additive.emit({ x: e4, y: t2, z: n2, vx: this.rng.range(-0.15, 0.15), vy: this.rng.range(0.9, 1.8), vz: this.rng.range(-0.15, 0.15), life: this.rng.range(0.35, 0.7), size: r2 * this.rng.range(0.7, 1.2), size1: r2 * 0.2, r: 2.6, g: 0.9 + i2 * 0.6, b: 0.25, a: 0.9, r1: 1.4, g1: 0.25, b1: 0.05, a1: 0, rot: this.rng.range(0, 6.28), spin: this.rng.range(-2, 2), drag: 0.5 });
  }
  spawnBolt(e4, t2) {
    let n2 = new P(t2), r2 = 1e-3;
    for (let t3 = 0; t3 < 2; t3 += 1) for (let i2 = 0; i2 < e4.length - 1; i2 += 1) {
      let a2 = e4[i2], o2 = e4[i2 + 1], s2 = a2.x, c2 = a2.y, l2 = a2.z;
      for (let e5 = 1; e5 <= 7; e5 += 1) {
        let i3 = e5 / 7, u2 = e5 === 7 ? 0 : 0.32, d2 = a2.x + (o2.x - a2.x) * i3 + this.rng.range(-u2, u2), f2 = a2.y + (o2.y - a2.y) * i3 + this.rng.range(-u2, u2), p2 = a2.z + (o2.z - a2.z) * i3 + this.rng.range(-u2, u2), m2 = (s2 + d2) / 2, h2 = (c2 + f2) / 2, g2 = (l2 + p2) / 2, _2 = (d2 - s2) * r2, v2 = (f2 - c2) * r2, y2 = (p2 - l2) * r2, b2 = 0.14 + t3 * 0.08;
        this.particles.additive.emit({ x: m2, y: h2, z: g2, vx: _2, vy: v2, vz: y2, life: b2, size: 0.09, size1: 0.06, r: 2.6, g: 2.9, b: 4, a: 1, stretch: 1.25 / r2 }), this.particles.additive.emit({ x: m2, y: h2, z: g2, vx: _2, vy: v2, vz: y2, life: b2 + 0.06, size: 0.34, size1: 0.24, r: n2.r * 1.1, g: n2.g * 1.2, b: n2.b * 1.8, a: 0.4, stretch: 1.1 / r2 }), s2 = d2, c2 = f2, l2 = p2;
      }
    }
    for (let t3 of e4) this.burst(t3.x, t3.y, t3.z, 4, [1.1, 1.3, 2], 4, 0.22, 0.06, { stretch: 0.04 });
  }
  addMissile(e4) {
    let t2, n2 = null, r2 = e4.visual;
    t2 = r2 === `iceBolt` || r2 === `iceShard` ? new xa(this.geos.shard, this.mats.ice) : r2 === `glacialOrb` ? new xa(this.geos.orb, this.mats.orb) : r2 === `boneSpear` ? new xa(this.geos.bone, this.mats.bone) : r2 === `tooth` ? new xa(this.geos.tooth, this.mats.bone) : r2 === `quill` ? new xa(this.geos.quill, this.mats.dark) : r2 === `arrow` ? new xa(this.geos.arrow, this.mats.arrow) : new Zr(), r2 === `iceShard` && t2.scale.setScalar(0.6), this.group.add(t2);
    let i2 = e4.packet.vfx;
    r2 === `fireBolt` || r2 === `fireball` || r2 === `shamanFire` || r2 === `fireArrow` || r2 === `bloodArrow` ? n2 = this.lights.addEmitter({ x: e4.x, y: e4.y, z: e4.z, color: new P(r2 === `bloodArrow` ? `#ff2a1a` : `#ff7a2a`), intensity: r2 === `fireball` ? 22 : 12, distance: r2 === `fireball` ? 9 : 6, flicker: 1, priority: 2 }) : (r2 === `glacialOrb` || r2 === `chargedBolt` || r2 === `mageBolt`) && (n2 = this.lights.addEmitter({ x: e4.x, y: e4.y, z: e4.z, color: new P(sh[i2]), intensity: 10, distance: 6, flicker: 3, priority: 2 })), this.missiles.set(e4.id, { m: e4, obj: t2, light: n2, acc: 0 });
  }
  removeMissile(e4) {
    let t2 = this.missiles.get(e4.id);
    t2 && (this.group.remove(t2.obj), t2.light && this.lights.removeEmitter(t2.light), this.missiles.delete(e4.id));
  }
  updateMissiles(e4, t2) {
    for (let n2 of this.missiles.values()) {
      let r2 = n2.m, i2 = r2.px + (r2.x - r2.px) * e4, a2 = r2.pz + (r2.z - r2.pz) * e4, o2 = this.groundY(i2, a2) + r2.py + (r2.y - r2.py) * e4;
      n2.obj.position.set(i2, o2, a2);
      let s2 = Math.atan2(r2.vx, r2.vz);
      n2.obj.rotation.set(0, s2, 0), n2.light && (n2.light.x = i2, n2.light.y = o2 + 0.3, n2.light.z = a2), n2.acc += t2;
      let c2 = r2.visual, l2 = 1 / 60;
      for (; n2.acc > l2; ) if (n2.acc -= l2, c2 === `fireBolt` || c2 === `shamanFire`) this.flameParticle(i2 + this.rng.range(-0.05, 0.05), o2, a2 + this.rng.range(-0.05, 0.05), 0.42), this.particles.additive.emit({ x: i2, y: o2, z: a2, life: 0.08, size: 0.5, size1: 0.3, r: 3, g: 1.6, b: 0.6, a: 1 });
      else if (c2 === `fireball`) this.flameParticle(i2 + this.rng.range(-0.1, 0.1), o2, a2 + this.rng.range(-0.1, 0.1), 0.75), this.particles.additive.emit({ x: i2, y: o2, z: a2, life: 0.08, size: 0.9, size1: 0.6, r: 3.2, g: 1.8, b: 0.7, a: 1 }), this.rng.chance(0.3) && this.smoke(i2, o2, a2, 1, [0.1, 0.09, 0.08], 0.7, 0.8, 0.4);
      else if (c2 === `iceBolt` || c2 === `iceShard`) this.particles.additive.emit({ x: i2, y: o2, z: a2, vx: this.rng.range(-0.3, 0.3), vy: this.rng.range(-0.3, 0.3), vz: this.rng.range(-0.3, 0.3), life: 0.3, size: c2 === `iceShard` ? 0.12 : 0.22, size1: 0.02, r: 0.8, g: 1.5, b: 2.4, a: 0.9 });
      else if (c2 === `glacialOrb`) n2.obj.rotation.set(r2.age * 3, r2.age * 4, 0), this.particles.additive.emit({ x: i2 + this.rng.range(-0.3, 0.3), y: o2 + this.rng.range(-0.3, 0.3), z: a2 + this.rng.range(-0.3, 0.3), life: 0.4, size: 0.18, size1: 0.02, r: 0.9, g: 1.6, b: 2.6, a: 1 });
      else if (c2 === `chargedBolt`) this.particles.additive.emit({ x: i2 + this.rng.range(-0.15, 0.15), y: o2 + this.rng.range(-0.15, 0.15), z: a2 + this.rng.range(-0.15, 0.15), vx: this.rng.range(-2, 2), vy: this.rng.range(-2, 2), vz: this.rng.range(-2, 2), life: 0.12, size: 0.07, size1: 0.02, r: 2.4, g: 2.6, b: 3.6, a: 1, stretch: 0.06 }), this.particles.additive.emit({ x: i2, y: o2, z: a2, life: 0.06, size: 0.35, size1: 0.2, r: 1.6, g: 1.8, b: 3, a: 1 });
      else if (c2 === `boneSpear` || c2 === `tooth`) this.rng.chance(0.6) && this.particles.alpha.emit({ x: i2, y: o2, z: a2, vy: 0.2, life: 0.5, size: 0.18, size1: 0.4, r: 0.7, g: 0.75, b: 0.7, a: 0.4, a1: 0 }), this.particles.additive.emit({ x: i2, y: o2, z: a2, life: 0.12, size: 0.2, size1: 0.05, r: 0.8, g: 1.6, b: 1.1, a: 0.6 });
      else if (c2 === `mageBolt`) {
        let e5 = Dg[r2.packet.vfx];
        this.particles.additive.emit({ x: i2, y: o2, z: a2, life: 0.2, size: 0.3, size1: 0.05, r: e5[0] * 2.5, g: e5[1] * 2.5, b: e5[2] * 2.5, a: 1 });
      } else (c2 === `bloodArrow` || c2 === `fireArrow`) && (this.particles.additive.emit({ x: i2, y: o2, z: a2, life: 0.25, size: 0.25, size1: 0.05, r: 3, g: 0.4, b: 0.2, a: 1 }), this.rng.chance(0.5) && this.flameParticle(i2, o2, a2, 0.25));
      if ((c2 === `bloodArrow` || c2 === `fireArrow`) && !n2.obj.isMesh) {
        let e5 = new xa(this.geos.arrow, this.mats.arrow);
        n2.obj.add(e5);
      }
    }
  }
  update(e4, t2, n2, r2) {
    this.updateMissiles(n2, e4);
    let i2 = 0;
    for (let t3 = this.transients.length - 1; t3 >= 0; --t3) {
      let n3 = this.transients[t3];
      if (n3.life -= e4, n3.life <= 0) {
        this.lights.removeEmitter(n3.e), this.transients.splice(t3, 1);
        continue;
      }
      i2 += n3.base * (n3.life / n3.max);
    }
    let a2 = i2 > 70 ? 70 / i2 : 1;
    for (let e5 of this.transients) e5.e.intensity = e5.base * Math.max(0, e5.life / e5.max) * a2;
    for (let t3 = this.emitters.length - 1; t3 >= 0; --t3) {
      let n3 = this.emitters[t3];
      for (n3.life -= e4, n3.acc += n3.rate * e4; n3.acc >= 1; ) --n3.acc, n3.fn(n3.x, n3.y, n3.z);
      n3.life <= 0 && this.emitters.splice(t3, 1);
    }
    for (let t3 = this.bolts.length - 1; t3 >= 0; --t3) {
      let n3 = this.bolts[t3];
      n3.life -= e4, n3.life <= 0 && (this.group.remove(n3.mesh), n3.mesh.geometry.dispose(), n3.mesh.material.dispose(), this.bolts.splice(t3, 1));
    }
    for (let t3 = this.meteors.length - 1; t3 >= 0; --t3) {
      let n3 = this.meteors[t3];
      n3.t += e4;
      let r3 = n3.t / n3.dur;
      if (r3 < 0) {
        n3.mesh.visible = false;
        continue;
      }
      n3.mesh.visible = true;
      let i3 = this.groundY(n3.x, n3.z), a3 = n3.x - 7, o2 = n3.z - 7, s2 = a3 + (n3.x - a3) * r3, c2 = o2 + (n3.z - o2) * r3, l2 = i3 + 18 * (1 - r3);
      n3.mesh.position.set(s2, l2, c2), n3.mesh.rotation.x += e4 * 6;
      for (let e5 = 0; e5 < 4; e5 += 1) this.flameParticle(s2 + this.rng.range(-0.4, 0.4), l2 + this.rng.range(-0.4, 0.4), c2 + this.rng.range(-0.4, 0.4), 1.2);
      this.rng.chance(0.5) && this.smoke(s2, l2, c2, 1, [0.12, 0.1, 0.08], 1.4, 1.2, 0.5), r3 >= 1 && (this.group.remove(n3.mesh), this.meteors.splice(t3, 1));
    }
    for (let t3 = this.fills.length - 1; t3 >= 0; --t3) {
      let n3 = this.fills[t3];
      n3.t += e4, n3.pool.set(n3.id, n3.x, n3.y, n3.z, Math.min(1, n3.t / n3.dur)), n3.t >= n3.dur && this.fills.splice(t3, 1);
    }
    this.ambientUpdate(e4, r2), this.particles.update(e4), this.decals.update(e4, t2);
  }
  ambientUpdate(e4, t2) {
    for (let n3 of this.flames) {
      let r2 = n3.x - t2.x, i2 = n3.z - t2.z;
      if (r2 * r2 + i2 * i2 > 900) continue;
      let a2 = +(this.rng.next() < e4 * 40 * n3.size);
      for (let t3 = 0; t3 < a2 + +(this.rng.next() < e4 * 25 * n3.size); t3 += 1) this.flameParticle(n3.x + this.rng.range(-0.12, 0.12) * n3.size, n3.y, n3.z + this.rng.range(-0.12, 0.12) * n3.size, 0.45 * n3.size);
      n3.size > 1.2 && this.rng.next() < e4 * 6 && this.particles.additive.emit({ x: n3.x, y: n3.y + 0.6, z: n3.z, vx: this.rng.range(-0.4, 0.4), vy: this.rng.range(1.8, 3.6), vz: this.rng.range(-0.4, 0.4), life: this.rng.range(1.2, 2.4), size: 0.05, size1: 0.02, r: 3, g: 1.4, b: 0.4, a: 1, drag: 0.6 }), n3.size > 1.2 && this.rng.next() < e4 * 3 && this.smoke(n3.x, n3.y + 1.2, n3.z, 1, [0.09, 0.08, 0.08], 1.5, 3, 0.35);
    }
    if (this.reducedMotion) return;
    if (this.rain > 0.01 && this.ambient !== `cave`) {
      let n3 = this.rain * 900 * e4;
      for (let e5 = 0; e5 < n3; e5 += 1) {
        let e6 = t2.x + this.rng.range(-18, 18), n4 = t2.z + this.rng.range(-18, 18), r2 = this.groundY(e6, n4);
        this.particles.additive.emit({ x: e6 + 1.2, y: r2 + 9, z: n4 + 1.2, vx: -2.2, vy: -24, vz: -2.2, life: 9 / 24, size: 0.022, r: 0.42, g: 0.5, b: 0.64, a: 0.5, stretch: 0.03 }), this.rng.chance(0.35) && this.particles.additive.emit({ x: e6 + 0.3, y: r2 + 0.05, z: n4 + 0.3, vx: this.rng.range(-0.6, 0.6), vy: this.rng.range(0.6, 1.4), vz: this.rng.range(-0.6, 0.6), life: 0.18, size: 0.03, size1: 0.01, r: 0.35, g: 0.4, b: 0.5, a: 0.6, gravity: 9 });
      }
      this.lightningT -= e4, this.lightningT <= 0 && this.rain > 0.4 && (this.lightningT = this.rng.range(10, 24), this.onLightning?.(this.rng.range(0.5, 1)));
    }
    let n2 = this.ambient === `cave` ? 0.6 : this.ambient === `title` ? 3 : 2;
    if (this.rng.next() < e4 * n2) {
      let e5 = t2.x + this.rng.range(-16, 16), n3 = t2.z + this.rng.range(-16, 16), r2 = this.ambient === `cave` ? [0.25, 0.32, 0.3] : [0.42, 0.48, 0.58];
      this.particles.alpha.emit({ x: e5, y: this.groundY(e5, n3) + this.rng.range(0.2, 0.9), z: n3, vx: this.rng.range(0.15, 0.45), vy: 0.02, vz: this.rng.range(-0.2, 0.2), life: this.rng.range(7, 12), size: this.rng.range(3, 5), size1: this.rng.range(5, 8), r: r2[0], g: r2[1], b: r2[2], a: 0.14, a1: 0, rot: this.rng.range(0, 6.28), spin: this.rng.range(-0.05, 0.05) });
    }
    if ((this.ambient === `cave` || this.ambient === `town`) && this.rng.next() < e4 * 8) {
      let e5 = t2.x + this.rng.range(-6, 6), n3 = t2.z + this.rng.range(-6, 6);
      this.particles.additive.emit({ x: e5, y: this.groundY(e5, n3) + this.rng.range(0.4, 2.6), z: n3, vx: this.rng.range(-0.1, 0.1), vy: this.rng.range(-0.05, 0.1), vz: this.rng.range(-0.1, 0.1), life: this.rng.range(3, 6), size: 0.025, r: 1.1, g: 0.95, b: 0.75, a: 0.8 });
    }
  }
  reset() {
    for (let e4 of this.missiles.values()) this.group.remove(e4.obj), e4.light && this.lights.removeEmitter(e4.light);
    this.missiles.clear();
    for (let e4 of this.transients) this.lights.removeEmitter(e4.e);
    this.transients = [], this.emitters = [];
    for (let e4 of this.bolts) this.group.remove(e4.mesh);
    this.bolts = [];
    for (let e4 of this.meteors) this.group.remove(e4.mesh);
    this.meteors = [], this.fills = [], this.particles.clear(), this.decals.clear();
  }
  whirlTrail(e4, t2, n2, r2) {
    for (let e5 = 0; e5 < 7; e5 += 1) {
      let e6 = this.rng.range(0, Math.PI * 2), i2 = this.rng.range(0.9, 1.5);
      this.particles.additive.emit({ x: t2 + Math.cos(e6) * i2, y: n2 + this.rng.range(0.55, 1.45), z: r2 + Math.sin(e6) * i2, vx: -Math.sin(e6) * 10, vy: 0, vz: Math.cos(e6) * 10, life: 0.2, size: 0.1, size1: 0.02, r: 1.9, g: 1.8, b: 1.55, a: 0.85, r1: 0.6, g1: 0.55, b1: 0.5, a1: 0, stretch: 0.05 });
    }
    if (this.rng.chance(0.7)) {
      let e5 = this.rng.range(0, Math.PI * 2);
      this.particles.alpha.emit({ x: t2 + Math.cos(e5) * 0.8, y: n2 + 0.15, z: r2 + Math.sin(e5) * 0.8, vx: -Math.sin(e5) * 3 + Math.cos(e5) * 1.2, vy: 0.4, vz: Math.cos(e5) * 3 + Math.sin(e5) * 1.2, life: 0.7, size: 0.5, size1: 1.3, r: 0.32, g: 0.27, b: 0.2, a: 0.45, a1: 0, drag: 2.5, rot: this.rng.range(0, 6.28), spin: 3 });
    }
  }
};
Ed(), uh(), Od(), dm();
var kg = { gutterkin: [`#ff6a3a`, 0.35], gutterkinShaman: [`#c77dff`, 0.45], rotwalker: [`#a8ff7a`, 0.38], spinehog: [`#ffbe5a`, 0.42], bonewretch: [`#cfe2ff`, 0.3], hollowArcher: [`#b08cff`, 0.42], bloodwitch: [`#ff2a2a`, 0.65], weepingQueen: [`#ff4ad8`, 0.6] }, Ag = class {
  canvas;
  models;
  props;
  scene = new ai();
  cam = new hh();
  pipeline;
  lights;
  vfx;
  labels;
  world = null;
  areaCache = /* @__PURE__ */ new Map();
  area = null;
  units = /* @__PURE__ */ new Map();
  items = /* @__PURE__ */ new Map();
  objects = /* @__PURE__ */ new Map();
  objectAnims = /* @__PURE__ */ new Map();
  unsub = [];
  focus = new N();
  time = 0;
  hover = null;
  showAllLabels = true;
  altHeld = false;
  damageNumbers = true;
  shadowGeo = new so(1, 20).rotateX(-Math.PI / 2);
  shadowMat = new la({ color: 0, transparent: true, opacity: 0.38, depthWrite: false });
  beamGeo = new co(0.05, 0.17, 5.5, 12, 1, true).translate(0, 2.75, 0);
  beamTime = { value: 0 };
  beamMats = /* @__PURE__ */ new Map();
  tmpV = new N();
  screen = { x: 0, y: 0 };
  titleRigs = [];
  envTex;
  bloodMoon = 0;
  bloodMoonTarget = 0;
  flashT = 0;
  constructor(e4, t2, n2, r2) {
    this.canvas = e4, this.models = t2, this.props = n2, this.pipeline = new zh(e4, this.scene, this.cam.camera), this.lights = new Sh(this.scene), this.envTex = Ch(this.pipeline.renderer), this.scene.environment = this.envTex, this.vfx = new Og(this.lights), this.scene.add(this.vfx.group), this.labels = new gg(r2), this.vfx.onLightning = (e5) => this.lightning(e5);
  }
  get renderer() {
    return this.pipeline.renderer;
  }
  getArea(e4, t2) {
    let n2 = e4.areaId, r2 = this.areaCache.get(n2);
    if (r2 && r2.layout === e4) return r2.view;
    r2 && (r2.view.dispose(), this.areaCache.delete(n2));
    let i2 = mg(e4, this.props, this.lights, t2);
    for (let e5 of i2.emitters) e5.active = false;
    return this.areaCache.set(n2, { view: i2, layout: e4 }), i2;
  }
  clearAreaCache() {
    for (let { view: e4 } of this.areaCache.values()) this.scene.remove(e4.group), e4.dispose();
    this.areaCache.clear(), this.area = null;
  }
  attach(e4, t2) {
    this.detach(), this.world = e4;
    let n2 = this.getArea(e4.layout, t2);
    this.area = n2, this.scene.add(n2.group);
    for (let e5 of n2.emitters) e5.active = true;
    let r2 = bh[e4.def.lighting] ?? bh.moor;
    this.lights.applyPreset(r2), this.vfx.heightAt = (t3, n3) => e4.heightAt(t3, n3), this.vfx.rain = e4.def.rain, this.vfx.ambient = e4.def.theme === `cave` ? `cave` : e4.def.theme === `town` ? `town` : e4.def.theme === `fields` ? `fields` : `moor`, this.props.setEnvironment?.(e4.def.theme, e4.def.rain), this.vfx.flames = [...n2.flames];
    for (let t3 of e4.layout.lights) if (t3.flicker === 1 || t3.flicker === 2) {
      if (n2.flames.some((e5) => Math.abs(e5.x - t3.x) < 1.1 && Math.abs(e5.z - t3.z) < 1.1)) continue;
      this.vfx.flames.push({ x: t3.x, y: um(e4.layout, t3.x, t3.z) + (t3.flicker === 2 ? 0.25 : t3.y - 0.15), z: t3.z, size: t3.flicker === 2 ? t3.intensity > 30 ? 2.2 : 1.5 : 0.6 });
    }
    for (let t3 of e4.units) this.addUnit(t3);
    for (let t3 of e4.items) this.addItem(t3);
    for (let t3 of e4.objects) this.addObject(t3);
    for (let t3 of e4.missiles) this.vfx.addMissile(t3);
    let i2 = e4.events;
    this.unsub.push(i2.on(`unitAdded`, (e5) => this.addUnit(e5)), i2.on(`unitRemoved`, (e5) => this.removeUnit(e5.id)), i2.on(`missileAdded`, (e5) => this.vfx.addMissile(e5)), i2.on(`missileRemoved`, ({ m: e5 }) => this.vfx.removeMissile(e5)), i2.on(`itemDropped`, (e5) => this.addItem(e5)), i2.on(`itemRemoved`, (e5) => this.removeItem(e5.id)), i2.on(`objectAdded`, (e5) => this.addObject(e5)), i2.on(`objectRemoved`, (e5) => this.removeObject(e5.id)), i2.on(`objectState`, (e5) => {
      this.objectAnims.set(e5.id, { state: e5.state, t: 0 }), this.objects.get(e5.id)?.setState(e5.state, 0);
    }), i2.on(`fx`, (e5) => {
      e5.t === `bloodMoon` ? this.bloodMoonTarget = +!!e5.on : this.vfx.handle(e5);
    }), i2.on(`shake`, (e5) => this.cam.addTrauma(e5)), i2.on(`damage`, (e5) => this.onDamage(e5.target, e5.amount, e5.crit, e5.element, e5.miss, e5.blocked))), this.bloodMoon = 0, this.bloodMoonTarget = 0;
  }
  detach() {
    for (let e4 of this.unsub) e4();
    this.unsub = [], this.auraLight &&= (this.lights.removeEmitter(this.auraLight), null);
    for (let e4 of [...this.units.keys()]) this.removeUnit(e4);
    for (let e4 of [...this.items.keys()]) this.removeItem(e4);
    for (let e4 of [...this.objects.keys()]) this.removeObject(e4);
    if (this.area) {
      this.scene.remove(this.area.group);
      for (let e4 of this.area.emitters) e4.active = false;
    }
    this.area = null, this.objectAnims.clear(), this.vfx.reset(), this.labels.clear(), this.world = null;
  }
  makeRig(e4) {
    return e4.kind === `hero` && e4.ch ? this.models.createHero(e4.ch.classId) : e4.kind === `monster` && e4.mkind ? this.models.createMonster(e4.mkind, { variant: e4.tier === `unique` || e4.tier === `boss` ? 2 : 0 }) : e4.kind === `ally` && e4.allyKind ? this.models.createAlly(e4.allyKind) : e4.kind === `npc` && e4.npcKind ? this.models.createNpc(e4.npcKind) : this.models.createMonster(`gutterkin`);
  }
  addUnit(e4) {
    if (this.units.has(e4.id)) return;
    let t2 = this.makeRig(e4);
    if (e4.tier === `champion` ? t2.setTint(lh.champion, 0.35) : e4.tier === `unique` || e4.tier === `boss` ? t2.setTint(lh.unique, 0.18) : e4.tier === `minion` && t2.setTint(`#c8b7a0`, 0.12), e4.kind === `ally` && e4.allyKind !== `mercArcher` && t2.setTint(lh.ally, 0.12), e4.mkind === `gorefather` && t2.root.scale.setScalar(1.3), e4.tier === `unique` && e4.mkind === `rotwalker` && t2.root.scale.setScalar(1.25), e4.kind === `monster` && e4.mkind) {
      let n3 = kg[e4.mkind];
      n3 && t2.setBaseRim?.(n3[0], n3[1] * (e4.tier === `champion` ? 1.3 : e4.tier === `unique` ? 1.4 : 1));
    }
    e4.mkind === `bloodwitch` && t2.root.scale.setScalar(1.2);
    let n2 = new xa(this.shadowGeo, this.shadowMat);
    n2.scale.setScalar(t2.radius * 1.5), n2.renderOrder = 1, this.scene.add(t2.root, n2), e4.dead ? t2.play(`dead`) : t2.play(e4.anim, { duration: e4.animDur || void 0 }), t2.root.position.set(e4.x, this.world?.heightAt(e4.x, e4.z) ?? 0, e4.z), t2.root.rotation.y = e4.facing, this.units.set(e4.id, { unit: e4, rig: t2, seq: e4.animSeq, flashSeq: e4.flashSeq, fade: 1, loco: ``, dissolve: 0, shadow: n2 });
  }
  removeUnit(e4) {
    let t2 = this.units.get(e4);
    t2 && (this.scene.remove(t2.rig.root, t2.shadow), t2.rig.dispose(), this.units.delete(e4));
  }
  setHeroEquipment(e4) {
    let t2 = this.world?.hero;
    t2 && this.units.get(t2.id)?.rig.setEquipment(e4);
  }
  rigOf(e4) {
    return this.units.get(e4.id)?.rig ?? null;
  }
  addItem(e4) {
    if (this.items.has(e4.id)) return;
    let t2 = hf[e4.item.base], n2 = e4.item.quality, r2 = n2 === `unique` || n2 === `set` || n2 === `rare` || t2.cat === `rune` ? ch[n2 === `misc` ? `crafted` : n2] : null, i2 = this.models.createItemModel(t2.visual, { glow: r2 });
    i2.traverse((e5) => {
      e5.isMesh && (e5.castShadow = true);
    }), this.scene.add(i2);
    let a2 = null;
    if (n2 === `unique` || n2 === `set` || t2.cat === `rune`) {
      let e5 = this.beamMaterial(n2 === `set` ? `#3fd43f` : t2.cat === `rune` ? `#ffa53a` : `#e0b450`).clone();
      e5.uniforms.uTime = this.beamTime, e5.uniforms.uFade = { value: 1 }, a2 = new xa(this.beamGeo, e5), a2.renderOrder = 5, a2.frustumCulled = false, this.scene.add(a2);
    }
    this.items.set(e4.id, { gi: e4, obj: i2, spin: e4.id * 2.399 % (Math.PI * 2), beam: a2 });
  }
  beamMaterial(e4) {
    let t2 = this.beamMats.get(e4);
    return t2 || (t2 = new qo({ uniforms: { uColor: { value: new P(e4) }, uTime: this.beamTime, uFade: { value: 1 } }, vertexShader: `
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`, fragmentShader: `
        uniform vec3 uColor; uniform float uTime; uniform float uFade;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          float core = pow(abs(dot(normalize(vN), normalize(vV))), 3.0);
          float h = vUv.y;
          float fade = pow(1.0 - h, 2.2) * smoothstep(0.0, 0.05, h);
          float pulse = 0.8 + 0.2 * sin(uTime * 2.6 - h * 9.0);
          gl_FragColor = vec4(uColor * core * fade * pulse * 1.35 * uFade, 1.0);
        }`, transparent: true, blending: 2, depthWrite: false, side: 2 }), this.beamMats.set(e4, t2), t2);
  }
  removeItem(e4) {
    let t2 = this.items.get(e4);
    t2 && (this.scene.remove(t2.obj), t2.beam && (this.scene.remove(t2.beam), t2.beam.material.dispose()), this.items.delete(e4));
  }
  addObject(e4) {
    if (this.objects.has(e4.id)) return;
    let t2 = e4.kind === `campfire` && e4.tier >= 2 ? 1 : +(e4.kind === `chest` && e4.tier >= 2), n2 = e4.kind === `heroCorpse` ? { root: new Qr(), height: 0.5, pickRadius: 0.9, fx: { fire: [], glow: [] }, setState() {
    }, update() {
    }, dispose() {
    } } : this.props.object(e4.kind, { variant: t2, label: e4.label });
    n2.root.position.set(e4.x, this.world?.heightAt(e4.x, e4.z) ?? 0, e4.z), n2.root.rotation.y = e4.kind === `portal` ? Math.PI / 4 : e4.rot, n2.root.traverse((t3) => {
      t3.isMesh && (t3.castShadow = e4.kind !== `portal` && e4.kind !== `waypoint`, t3.receiveShadow = true);
    }), e4.state !== `idle` && n2.setState(e4.state, 1), e4.kind === `portal` && (n2.setState(`active`, 0), this.objectAnims.set(e4.id, { state: `active`, t: 0 })), this.scene.add(n2.root), this.objects.set(e4.id, n2);
    for (let t3 of n2.fx.fire) {
      let r2 = t3.clone().applyEuler(n2.root.rotation).add(n2.root.position);
      this.vfx.flames.push({ x: r2.x, y: r2.y, z: r2.z, size: e4.kind === `campfire` ? e4.tier >= 2 ? 2.4 : 1.6 : 0.6 });
    }
    if (e4.kind === `heroCorpse` && this.world) {
      let e5 = this.world.hero;
      if (e5?.ch) {
        let t3 = this.models.createHero(e5.ch.classId);
        t3.play(`dead`), n2.root.add(t3.root), t3.root.position.set(0, 0, 0), t3.update(0.01, { speed: 0, time: 0 }), t3.setTint(`#8a96a8`, 0.35), n2.dispose = () => t3.dispose();
      }
    }
  }
  removeObject(e4) {
    let t2 = this.objects.get(e4);
    t2 && (this.scene.remove(t2.root), t2.dispose(), this.objects.delete(e4));
  }
  onDamage(e4, t2, n2, r2, i2, a2) {
    if (!this.damageNumbers || !this.world || !this.units.get(e4.id)) return;
    let o2 = this.tmpV.set(e4.x, this.world.heightAt(e4.x, e4.z) + e4.height + 0.2, e4.z), { width: s2, height: c2 } = this.pipeline.size;
    if (!this.cam.project(o2, s2, c2, this.screen)) return;
    let l2 = Dd.damage;
    if (i2) {
      e4.kind !== `hero` && this.labels.floatText(`Miss`, this.screen.x, this.screen.y, `${l2} miss`, 0.6);
      return;
    }
    if (a2) {
      this.labels.floatText(`Block`, this.screen.x, this.screen.y, `${l2} ${e4.kind === `hero` ? `player` : ``}`, 0.6);
      return;
    }
    if (t2 < 0.5) return;
    let u2 = `${l2} el-${r2}${n2 ? ` crit` : ``}${e4.kind === `hero` ? ` player` : ``}`;
    this.labels.floatText(String(Math.round(t2)), this.screen.x, this.screen.y, u2, n2 ? 1.1 : 0.85);
  }
  floatAtUnit(e4, t2, n2, r2 = 1.4) {
    if (!this.world) return;
    let i2 = this.tmpV.set(e4.x, this.world.heightAt(e4.x, e4.z) + e4.height + 0.6, e4.z), { width: a2, height: o2 } = this.pipeline.size;
    this.cam.project(i2, a2, o2, this.screen) && this.labels.floatText(t2, this.screen.x, this.screen.y, n2, r2);
  }
  lightning(e4) {
    this.vfx.reducedMotion || (this.lights.flash = e4, this.flashT = 0.35), this.onThunder?.(e4);
  }
  onThunder = null;
  pick(e4, t2) {
    let n2 = this.world;
    if (!n2) return null;
    let { width: r2, height: i2 } = this.pipeline.size, a2 = null, o2 = 1 / 0, s2 = i2 / (this.cam.viewHeight * this.cam.zoom);
    for (let c3 of this.units.values()) {
      let l2 = c3.unit;
      if (l2.kind === `hero` || l2.dead || c3.fade < 0.3) continue;
      let u2 = n2.heightAt(l2.x, l2.z) + l2.y;
      if (this.tmpV.set(l2.x, u2 + l2.height * 0.15, l2.z), !this.cam.project(this.tmpV, r2, i2, this.screen)) continue;
      let d2 = this.screen.x, f2 = this.screen.y;
      this.tmpV.set(l2.x, u2 + l2.height * 0.95, l2.z), this.cam.project(this.tmpV, r2, i2, this.screen);
      let p2 = this.screen.x, m2 = this.screen.y, h2 = Math.max(14, l2.radius * s2 * 1.35), g2 = p2 - d2, _2 = m2 - f2, v2 = g2 * g2 + _2 * _2 || 1, y2 = im(((e4 - d2) * g2 + (t2 - f2) * _2) / v2, 0, 1), b2 = Math.hypot(e4 - (d2 + g2 * y2), t2 - (f2 + _2 * y2));
      b2 < h2 && b2 < o2 && (o2 = b2, a2 = { kind: `unit`, unit: l2 });
    }
    if (a2) return a2;
    let c2 = this.labels.labelAt(e4, t2);
    if (c2 !== null) {
      let e5 = n2.items.find((e6) => e6.id === c2);
      if (e5) return { kind: `item`, item: e5 };
    }
    for (let c3 of n2.objects) {
      if (c3.kind === `bossSpawn` || c3.state === `broken` && (c3.kind === `barrel` || c3.kind === `urn`) || (c3.kind === `chest` || c3.kind === `coffin`) && c3.state === `open` || (this.tmpV.set(c3.x, n2.heightAt(c3.x, c3.z) + 0.5, c3.z), !this.cam.project(this.tmpV, r2, i2, this.screen))) continue;
      let l2 = c3.pickRadius * s2 * 0.9, u2 = Math.hypot(e4 - this.screen.x, t2 - this.screen.y);
      u2 < l2 && u2 < o2 && (o2 = u2, a2 = { kind: `object`, object: c3 });
    }
    if (a2) return a2;
    for (let s3 of this.items.values()) {
      if (this.tmpV.set(s3.gi.x, n2.heightAt(s3.gi.x, s3.gi.z) + 0.1, s3.gi.z), !this.cam.project(this.tmpV, r2, i2, this.screen)) continue;
      let c3 = Math.hypot(e4 - this.screen.x, t2 - this.screen.y);
      c3 < 18 && c3 < o2 && (o2 = c3, a2 = { kind: `item`, item: s3.gi });
    }
    return a2;
  }
  groundPoint(e4, t2, n2) {
    let { width: r2, height: i2 } = this.pipeline.size, a2 = this.focus.y;
    for (let o2 = 0; o2 < 3; o2 += 1) {
      if (!this.cam.pickGround(e4, t2, r2, i2, a2, n2)) return false;
      a2 = this.world ? this.world.heightAt(n2.x, n2.z) : 0;
    }
    return true;
  }
  render(e4, t2, n2 = {}) {
    this.time += t2;
    let r2 = this.world, i2 = n2.paused ? 0 : t2, a2 = r2?.hero ?? null;
    if (r2 && a2) {
      let t3 = a2.px + (a2.x - a2.px) * e4, n3 = a2.pz + (a2.z - a2.pz) * e4;
      this.focus.set(t3, r2.heightAt(t3, n3), n3);
    }
    let { width: o2, height: s2 } = this.pipeline.size;
    this.pipeline.resize(), this.cam.setAspect(this.pipeline.size.width / Math.max(1, this.pipeline.size.height)), this.cam.update(t2, this.focus), this.bloodMoon = lm(this.bloodMoon, this.bloodMoonTarget, 1.2, t2), this.flashT > 0 ? (this.flashT -= t2, this.lights.flash = Math.max(0, this.flashT / 0.35) * (0.6 + 0.4 * Math.sin(this.time * 60))) : this.lights.flash = 0;
    let c2 = this.pipeline.gradeUniforms;
    if (c2.uTint.value.set(1.25, 0.55, 0.5), c2.uTintAmt.value = this.bloodMoon * 0.55, c2.uFlash.value = this.lights.flash * 0.045, this.lights.update(this.time, this.focus), r2 && this.area) {
      this.area.update(this.time, this.focus, this.vfx.ambient === `cave` ? 0 : r2.def.rain, this.cam.back), this.updateUnits(r2, e4, i2), this.updateItems(r2, e4, i2);
      for (let [e5, t3] of this.objectAnims) t3.t = Math.min(1, t3.t + i2 / 0.6), this.objects.get(e5)?.setState(t3.state, t3.t), t3.t >= 1 && this.objectAnims.delete(e5);
      for (let e5 of this.objects.values()) e5.update(this.time);
      this.updateLabels(r2, o2, s2);
    } else if (this.area) {
      this.area.update(this.time, this.focus, 0.25);
      for (let e5 of this.objects.values()) e5.update(this.time);
    }
    for (let e5 of this.titleRigs) e5.update(i2, { speed: 0, time: this.time });
    if (this.titleRigs.length && this.cam.cinematic && this.titleFocus) {
      let e5 = this.time;
      this.cam.cinematic.target.set(this.titleFocus.x + Math.sin(e5 * 0.07) * 0.55, this.titleFocus.y, this.titleFocus.z + Math.cos(e5 * 0.053) * 0.4), this.cam.cinematic.viewHeight = 8.5 + Math.sin(e5 * 0.045) * 0.35;
    }
    this.vfx.update(i2, this.time, e4, this.focus), this.labels.update(t2), this.pipeline.render(this.scene, this.cam.camera, this.time);
  }
  auraLight = null;
  auraT = 0;
  auraSeed = 625341585;
  auraRnd() {
    return this.auraSeed = Math.imul(this.auraSeed, 1664525) + 1013904223 >>> 0, this.auraSeed / 4294967296;
  }
  bossAura(e4, t2, n2, r2, i2, a2) {
    if (!(!e4.dead && i2 > 0.05)) {
      this.auraLight &&= (this.lights.removeEmitter(this.auraLight), null);
      return;
    }
    if (this.auraLight ||= this.lights.addEmitter({ x: t2, y: n2 + 1.8, z: r2, color: new P(`#ff2a1e`), intensity: 7, distance: 6.5, flicker: 3, priority: 6 }), this.auraLight.x = t2, this.auraLight.y = n2 + 1.8, this.auraLight.z = r2, this.auraT -= a2, this.auraT > 0) return;
    this.auraT = 0.06;
    let o2 = this.vfx.particles, s2 = this.auraRnd() * Math.PI * 2, c2 = 0.4 + this.auraRnd() * 1.1;
    if (o2.alpha.emit({ x: t2 + Math.cos(s2) * c2, y: n2 + 0.12, z: r2 + Math.sin(s2) * c2, vx: Math.cos(s2) * 0.25, vy: 0.12, vz: Math.sin(s2) * 0.25, life: 1.8, size: 0.55, size1: 1.5, r: 0.32, g: 0.02, b: 0.03, a: 0.32, a1: 0, rot: s2, spin: 0.4, drag: 0.8 }), this.auraRnd() < 0.5) {
      let e5 = this.auraRnd() * Math.PI * 2;
      o2.additive.emit({ x: t2 + Math.cos(e5) * 0.5, y: n2 + 0.4 + this.auraRnd() * 1.4, z: r2 + Math.sin(e5) * 0.5, vx: 0, vy: 0.7 + this.auraRnd() * 0.6, vz: 0, life: 1.1, size: 0.05, size1: 0.01, r: 1.6, g: 0.12, b: 0.08, a: 1, drag: 0.6 });
    }
  }
  updateUnits(e4, t2, n2) {
    let r2 = e4.hero, i2 = (e4.def.kind === `dungeon` ? 13 : 17) * (1 + this.lights.radiusBonus);
    for (let a2 of this.units.values()) {
      let o2 = a2.unit;
      if (r2 && o2 !== r2 && o2.kind !== `npc` && o2.kind !== `ally` && a2.fade < 0.01 && Math.hypot(o2.x - r2.x, o2.z - r2.z) > i2 + 4) {
        a2.rig.root.visible && (a2.rig.root.visible = false, a2.shadow.visible = false);
        continue;
      }
      a2.rig.root.visible || (a2.rig.root.visible = true);
      let s2 = o2.px + (o2.x - o2.px) * t2, c2 = o2.pz + (o2.z - o2.pz) * t2, l2 = o2.py + (o2.y - o2.py) * t2, u2 = e4.heightAt(s2, c2);
      if (a2.rig.root.position.set(s2, u2 + l2, c2), a2.rig.root.rotation.y = sm(o2.pfacing, o2.facing, t2), a2.shadow.position.set(s2, u2 + 0.04, c2), a2.shadow.scale.setScalar(a2.rig.radius * 1.55 * (1 - Math.min(0.6, l2 * 0.25))), o2.mkind === `bloodwitch` && this.bossAura(o2, s2, u2, c2, a2.fade, n2), a2.seq !== o2.animSeq && (a2.seq = o2.animSeq, a2.loco = ``, a2.rig.play(o2.anim, { duration: o2.animDur > 0 ? o2.animDur : void 0 })), !o2.dead && !o2.action && o2.state !== `hit` && o2.state !== `stun` && o2.st.freeze <= 0) {
        let t3 = o2.speed > 0.4 ? o2.running && o2.speed > o2.walk * 1.15 ? `run` : `walk` : o2.kind === `npc` || o2.kind === `hero` && e4.isTown ? `townIdle` : `idle`, n3 = a2.rig.state;
        !(![`idle`, `townIdle`, `walk`, `run`, `spin`, `channel`].includes(n3) && a2.rig.progress < 1) && (a2.loco !== t3 || n3 !== t3) && (a2.loco = t3, a2.rig.play(t3, { fade: 0.15 }));
      }
      a2.flashSeq !== o2.flashSeq && (a2.flashSeq = o2.flashSeq, a2.rig.flash(o2.flashColor, 1.2)), a2.rig.setStatus({ chilled: o2.st.chill > 0, frozen: o2.st.freeze > 0, poisoned: o2.st.poison > 0, burning: o2.st.burn > 0, cursed: o2.st.amp > 0 || o2.st.lifeTap > 0, feared: o2.st.fear > 0 });
      let d2 = 1;
      r2 && o2 !== r2 && o2.kind !== `npc` && (d2 = im(1 - (Math.hypot(o2.x - r2.x, o2.z - r2.z) - i2) / 4, 0, 1), e4.def.kind === `dungeon` && d2 > 0 && !e4.los(r2, o2) && (d2 = 0), o2.kind === `ally` && (d2 = Math.max(d2, 0.6))), a2.fade = lm(a2.fade, d2, 6, n2 || 0.016), a2.rig.setFade(a2.fade), a2.shadow.visible = a2.fade > 0.2 && !(o2.dead && o2.deathT > 1), o2.dead && o2.corpseUsed ? (a2.dissolve = Math.min(1, a2.dissolve + n2 * 3), a2.rig.setDissolve(a2.dissolve, `#ff5a2a`)) : o2.dead && !o2.corpse && o2.deathT > 0.6 && (a2.dissolve = Math.min(1, a2.dissolve + n2 * 1.2), a2.rig.setDissolve(a2.dissolve, `#9fe8ff`));
      let f2 = this.hover?.kind === `unit` && this.hover.unit === o2;
      a2.rig.setHighlight(f2 ? o2.kind === `npc` ? `#ffd27a` : o2.kind === `ally` ? `#7fe0c8` : `#ff3b2a` : null);
      let p2 = o2.speed * (o2.st.chill > 0 ? 0.6 : 1);
      a2.rig.update(n2 * (o2.st.chill > 0 ? 0.6 : 1), { speed: p2, time: this.time }), o2.action?.kind === `spin` && this.vfx.whirlTrail(o2, s2, u2, c2);
    }
    r2 && (this.lights.radiusBonus = (r2.d?.stats.lightRadius ?? 0) * 0.08);
  }
  updateItems(e4, t2, n2) {
    this.beamTime.value = this.time;
    for (let t3 of this.items.values()) {
      let n3 = t3.gi, r2 = im(n3.t / 0.55, 0, 1), i2 = n3.x0 + (n3.x - n3.x0) * r2, a2 = n3.z0 + (n3.z - n3.z0) * r2, o2 = e4.heightAt(i2, a2), s2 = Math.sin(r2 * Math.PI) * 1.4, c2 = typeof t3.obj.userData.restHeight == `number` ? t3.obj.userData.restHeight : 0.06;
      if (t3.obj.position.set(i2, o2 + c2 + s2, a2), r2 < 1 ? t3.obj.rotation.set(r2 * Math.PI * 4, t3.spin, r2 * Math.PI * 2) : t3.obj.rotation.set(0, t3.spin, 0), t3.obj.visible = n3.t >= 0, t3.beam) {
        t3.beam.position.set(n3.x, o2, n3.z), t3.beam.visible = n3.t > 0.4;
        let e5 = this.focus.x - n3.x, r3 = this.focus.z - n3.z, i3 = this.cam.back, a3 = Math.hypot(i3.x, i3.z) || 1, s3 = i3.x / a3, c3 = i3.z / a3, l2 = -(e5 * s3 + r3 * c3), u2 = Math.abs(e5 * c3 - r3 * s3), d2 = Math.min(1, Math.max(0, (Math.hypot(e5, r3) - 0.5) / 1.1)), f2 = l2 > -0.5 && l2 < 9 ? Math.min(1, Math.max(0, (u2 - 0.35) / 0.7)) : 1, p2 = Math.min(d2, f2);
        t3.beam.material.uniforms.uFade.value = 0.12 + 0.88 * p2 * p2 * (3 - 2 * p2);
      }
    }
  }
  updateLabels(e4, t2, n2) {
    let r2 = e4.hero, i2 = this.showAllLabels || this.altHeld, a2 = [];
    if (i2 || this.items.size) for (let o3 of this.items.values()) {
      let s3 = o3.gi;
      if (s3.t < 0.45) continue;
      let c2 = Pf(s3.item), l2 = s3.item.quality === `unique` || s3.item.quality === `set` || s3.item.quality === `rare` || c2.cat === `rune`;
      if (!i2 && !l2 || r2 && Math.hypot(s3.x - r2.x, s3.z - r2.z) > 22 || (this.tmpV.set(s3.x, e4.heightAt(s3.x, s3.z) + 0.35, s3.z), !this.cam.project(this.tmpV, t2, n2, this.screen)) || this.screen.x < -60 || this.screen.x > t2 + 60 || this.screen.y < -20 || this.screen.y > n2 + 20) continue;
      let u2 = c2.cat === `gold`, d2 = u2 ? `${s3.item.qty} Gold` : s3.item.identified || s3.item.quality === `normal` || s3.item.quality === `misc` ? s3.item.name : c2.name;
      a2.push({ id: s3.id, text: d2, quality: s3.item.quality === `misc` ? c2.cat === `rune` ? `crafted` : `normal` : s3.item.quality, gold: u2, x: this.screen.x, y: this.screen.y, hover: this.hover?.kind === `item` && this.hover.item === s3 });
    }
    this.labels.setItems(a2);
    let o2 = /* @__PURE__ */ new Set(), s2 = this.hover;
    if (s2?.kind === `unit` && s2.unit.kind === `npc` && !this.questNpcs.has(s2.unit.npcKind ?? ``)) {
      let r3 = s2.unit;
      this.tmpV.set(r3.x, e4.heightAt(r3.x, r3.z) + r3.height + 0.45, r3.z), this.cam.project(this.tmpV, t2, n2, this.screen) && (this.labels.setNamed(`hover`, Dd.npc, r3.name, this.screen.x, this.screen.y), o2.add(`hover`));
    } else if (s2?.kind === `object`) {
      let r3 = s2.object, i3 = jg(r3);
      i3 && (this.tmpV.set(r3.x, e4.heightAt(r3.x, r3.z) + 1.8, r3.z), this.cam.project(this.tmpV, t2, n2, this.screen) && (this.labels.setNamed(`hover`, Dd.object, i3, this.screen.x, this.screen.y), o2.add(`hover`)));
    }
    for (let r3 of e4.units) {
      if (r3.kind !== `npc` || !this.questNpcs.has(r3.npcKind ?? ``) || (this.tmpV.set(r3.x, e4.heightAt(r3.x, r3.z) + r3.height + 0.2, r3.z), !this.cam.project(this.tmpV, t2, n2, this.screen))) continue;
      let i3 = `q${r3.id}`, a3 = s2?.kind === `unit` && s2.unit === r3;
      this.labels.setNamed(i3, Dd.npc, a3 ? r3.name : `​`, this.screen.x, this.screen.y, `has-quest`), o2.add(i3);
    }
    this.labels.hideNamedExcept(o2);
  }
  questNpcs = /* @__PURE__ */ new Set();
  showTitleScene(e4, t2) {
    this.detach();
    let n2 = this.getArea(e4, 7);
    this.area = n2, this.scene.add(n2.group);
    for (let e5 of n2.emitters) e5.active = true;
    this.props.setEnvironment?.(e4.theme, 0.25), this.lights.applyPreset(bh.title), this.vfx.heightAt = (t3, n3) => um(e4, t3, n3), this.vfx.rain = 0.25, this.vfx.ambient = `title`;
    let r2 = e4.regions.fire;
    this.vfx.flames = [{ x: r2.x, y: um(e4, r2.x, r2.z) + 0.25, z: r2.z, size: 2.4 }, ...n2.flames];
    let i2 = this.props.object(`campfire`, { variant: 1 });
    i2.root.position.set(r2.x, um(e4, r2.x, r2.z), r2.z), this.scene.add(i2.root), this.objects.set(-1, i2);
    for (let e5 of this.titleRigs) this.scene.remove(e5.root), e5.dispose();
    this.titleRigs = [];
    let a2 = [[r2.x + 1.2, r2.z + 3.4, 0.35], [r2.x + 2.7, r2.z + 2.4, 0.75], [r2.x + 3.4, r2.z + 0.9, 1.15]];
    t2.forEach((t3, n3) => {
      let r3 = this.models.createHero(t3), [i3, o2, s2] = a2[n3];
      r3.root.position.set(i3, um(e4, i3, o2), o2), r3.root.rotation.y = s2, r3.play(`townIdle`), this.scene.add(r3.root), this.titleRigs.push(r3);
    }), this.focus.set(r2.x + 1.6, um(e4, r2.x, r2.z) + 0.8, r2.z + 1.5), this.titleFocus = this.focus.clone(), this.cam.cinematic = { target: this.focus.clone(), viewHeight: 8.5 };
  }
  titleFocus = null;
  hideTitleScene() {
    for (let e5 of this.titleRigs) this.scene.remove(e5.root), e5.dispose();
    this.titleRigs = [];
    let e4 = this.objects.get(-1);
    e4 && (this.scene.remove(e4.root), this.objects.delete(-1)), this.area && this.scene.remove(this.area.group), this.area = null, this.cam.cinematic = null, this.titleFocus = null;
  }
  stats() {
    let e4 = this.pipeline.renderer.info;
    return { calls: e4.render.calls, triangles: e4.render.triangles, geometries: e4.memory.geometries, textures: e4.memory.textures, points: e4.render.points, lines: e4.render.lines };
  }
  get areaStats() {
    return this.area?.stats ?? null;
  }
};
function jg(e4) {
  switch (e4.kind) {
    case `waypoint`:
      return `Waypoint`;
    case `stash`:
      return `Stash`;
    case `chest`:
      return `Chest`;
    case `barrel`:
      return `Barrel`;
    case `urn`:
      return `Urn`;
    case `coffin`:
      return `Coffin`;
    case `shrine`:
      return `${String(e4.label).replace(/^\w/, (e5) => e5.toUpperCase())} Shrine`;
    case `exit`:
      return e4.label || `Exit`;
    case `denEntrance`:
      return e4.label || `Cave Entrance`;
    case `portal`:
      return `Town Portal`;
    case `heroCorpse`:
      return `Your Corpse`;
    default:
      return ``;
  }
}
var Mg = Math.SQRT1_2, Ng = class {
  world;
  scale;
  edge;
  fill;
  lineW;
  canvas = document.createElement(`canvas`);
  ctx;
  drawn;
  ox;
  oy;
  constructor(e4, t2, n2, r2, i2) {
    this.world = e4, this.scale = t2, this.edge = n2, this.fill = r2, this.lineW = i2;
    let { w: a2, h: o2 } = e4.nav, s2 = t2;
    this.ox = o2 * Mg * s2 + 4, this.oy = 4, this.canvas.width = Math.ceil((a2 + o2) * Mg * s2 + 8), this.canvas.height = Math.ceil((a2 + o2) * Mg * s2 * 0.5 + 8), this.ctx = this.canvas.getContext(`2d`), this.drawn = new Uint8Array(a2 * o2);
  }
  px(e4, t2) {
    return this.ox + (e4 - t2) * Mg * this.scale;
  }
  py(e4, t2) {
    return this.oy + (e4 + t2) * Mg * this.scale * 0.5;
  }
  sync(e4, t2, n2, r2) {
    let i2 = this.world.nav, { w: a2, h: o2 } = i2, s2 = this.ctx, c2 = [], l2 = [];
    e4 = Math.max(0, e4), t2 = Math.max(0, t2), n2 = Math.min(a2 - 1, n2), r2 = Math.min(o2 - 1, r2);
    for (let o3 = t2; o3 <= r2; o3 += 1) for (let t3 = e4; t3 <= n2; t3 += 1) {
      let e5 = o3 * a2 + t3;
      this.drawn[e5] || !i2.explored[e5] || (this.drawn[e5] = 1, i2.walk[e5] && (c2.push(t3, o3), i2.isWalkable(t3 + 1, o3) || l2.push(t3 + 1, o3, t3 + 1, o3 + 1), i2.isWalkable(t3 - 1, o3) || l2.push(t3, o3, t3, o3 + 1), i2.isWalkable(t3, o3 + 1) || l2.push(t3, o3 + 1, t3 + 1, o3 + 1), i2.isWalkable(t3, o3 - 1) || l2.push(t3, o3, t3 + 1, o3)));
    }
    if (c2.length) {
      s2.fillStyle = this.fill, s2.beginPath();
      for (let e5 = 0; e5 < c2.length; e5 += 2) {
        let t3 = c2[e5], n3 = c2[e5 + 1];
        s2.moveTo(this.px(t3, n3), this.py(t3, n3)), s2.lineTo(this.px(t3 + 1, n3), this.py(t3 + 1, n3)), s2.lineTo(this.px(t3 + 1, n3 + 1), this.py(t3 + 1, n3 + 1)), s2.lineTo(this.px(t3, n3 + 1), this.py(t3, n3 + 1)), s2.closePath();
      }
      s2.fill();
    }
    if (l2.length) {
      s2.strokeStyle = this.edge, s2.lineWidth = this.lineW, s2.lineCap = `round`, s2.beginPath();
      for (let e5 = 0; e5 < l2.length; e5 += 4) s2.moveTo(this.px(l2[e5], l2[e5 + 1]), this.py(l2[e5], l2[e5 + 1])), s2.lineTo(this.px(l2[e5 + 2], l2[e5 + 3]), this.py(l2[e5 + 2], l2[e5 + 3]));
      s2.stroke();
    }
  }
}, Pg = class {
  canvas = document.createElement(`canvas`);
  ctx;
  maps = /* @__PURE__ */ new WeakMap();
  world = null;
  mode = `mini`;
  dpr = 1;
  uiScale = 1;
  uiScaleT = 0;
  constructor(e4) {
    this.canvas.id = `automap`, this.canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2`;
    let t2 = e4.querySelector(`#ui-root`);
    t2 ? e4.insertBefore(this.canvas, t2) : e4.appendChild(this.canvas), this.ctx = this.canvas.getContext(`2d`);
  }
  setWorld(e4) {
    this.world = e4, e4 && !this.maps.has(e4) && this.maps.set(e4, { full: new Ng(e4, 7, `rgba(214,190,140,0.9)`, `rgba(120,96,60,0.16)`, 1.6), mini: new Ng(e4, 2.6, `rgba(214,190,140,0.95)`, `rgba(120,96,60,0.22)`, 1), revealT: 0 }), e4 || this.clear();
  }
  toggle() {
    this.mode = this.mode === `off` ? `full` : this.mode === `full` ? `mini` : `off`;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  resize() {
    let e4 = Math.min(2, window.devicePixelRatio || 1), t2 = Math.max(1, Math.round(this.canvas.clientWidth * e4)), n2 = Math.max(1, Math.round(this.canvas.clientHeight * e4));
    (this.canvas.width !== t2 || this.canvas.height !== n2) && (this.canvas.width = t2, this.canvas.height = n2), this.dpr = e4;
  }
  update(e4, t2, n2 = true) {
    e4 !== this.world && this.setWorld(e4);
    let r2 = this.maps.get(e4), i2 = e4.hero;
    if (!r2 || !i2) return;
    if (r2.revealT -= t2, r2.revealT <= 0) {
      r2.revealT = 0.15;
      let t3 = e4.isTown ? 22 : 15;
      if (e4.nav.reveal(i2.x, i2.z, t3, !e4.isTown)) {
        let e5 = Math.floor(i2.x), n3 = Math.floor(i2.z), a3 = t3 + 2;
        r2.full.sync(e5 - a3, n3 - a3, e5 + a3, n3 + a3), r2.mini.sync(e5 - a3, n3 - a3, e5 + a3, n3 + a3);
      }
    }
    this.resize();
    let a2 = this.ctx;
    if (a2.setTransform(1, 0, 0, 1, 0, 0), a2.clearRect(0, 0, this.canvas.width, this.canvas.height), !n2 || this.mode === `off`) return;
    let o2 = this.dpr, s2 = this.canvas.width / o2, c2 = this.canvas.height / o2;
    if (a2.setTransform(o2, 0, 0, o2, 0, 0), this.mode === `full`) {
      let t3 = r2.full, n3 = s2 / 2, o3 = c2 / 2 - 20;
      a2.globalAlpha = 0.85, a2.drawImage(t3.canvas, n3 - t3.px(i2.x, i2.z), o3 - t3.py(i2.x, i2.z)), a2.globalAlpha = 1, this.drawMarkers(e4, t3, n3 - t3.px(i2.x, i2.z), o3 - t3.py(i2.x, i2.z), 1);
    } else {
      let t3 = r2.mini;
      this.uiScaleT-- <= 0 && (this.uiScaleT = 60, this.uiScale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--ui-scale`)) || 1);
      let n3 = this.uiScale, o3 = Math.min(220, s2 * 0.26) * Math.min(1.2, Math.max(0.8, n3)), c3 = o3 * 0.62, l2 = s2 - o3 - 22, u2 = 124 * Math.min(1.2, Math.max(0.8, n3));
      a2.save(), a2.beginPath(), a2.rect(l2, u2, o3, c3), a2.fillStyle = `rgba(8,6,5,0.58)`, a2.fill(), a2.clip();
      let d2 = l2 + o3 / 2 - t3.px(i2.x, i2.z), f2 = u2 + c3 / 2 - t3.py(i2.x, i2.z);
      a2.drawImage(t3.canvas, d2, f2), this.drawMarkers(e4, t3, d2, f2, 0.7), a2.restore(), a2.strokeStyle = `rgba(120,98,62,0.9)`, a2.lineWidth = 1, a2.strokeRect(l2 + 0.5, u2 + 0.5, o3 - 1, c3 - 1), a2.strokeStyle = `rgba(0,0,0,0.8)`, a2.strokeRect(l2 - 0.5, u2 - 0.5, o3 + 1, c3 + 1);
    }
  }
  drawMarkers(e4, t2, n2, r2, i2) {
    let a2 = this.ctx, o2 = (e5, i3) => [n2 + t2.px(e5, i3), r2 + t2.py(e5, i3)], s2 = e4.nav, c2 = (e5, t3) => {
      let n3 = Math.floor(e5), r3 = Math.floor(t3);
      return s2.inBounds(n3, r3) && s2.explored[r3 * s2.w + n3] === 1;
    };
    a2.textAlign = `center`;
    for (let t3 of e4.objects) {
      if (!c2(t3.x, t3.z)) continue;
      let [e5, n3] = o2(t3.x, t3.z);
      if (t3.kind === `waypoint`) a2.fillStyle = `#6fa8ff`, a2.beginPath(), a2.moveTo(e5, n3 - 5 * i2), a2.lineTo(e5 + 7 * i2, n3), a2.lineTo(e5, n3 + 5 * i2), a2.lineTo(e5 - 7 * i2, n3), a2.closePath(), a2.fill();
      else if (t3.kind === `portal`) a2.strokeStyle = `#5fb0ff`, a2.lineWidth = 2 * i2, a2.beginPath(), a2.ellipse(e5, n3, 5 * i2, 7 * i2, 0, 0, Math.PI * 2), a2.stroke();
      else if (t3.kind === `heroCorpse`) a2.strokeStyle = `#ff5040`, a2.lineWidth = 2, a2.beginPath(), a2.moveTo(e5 - 4, n3 - 4), a2.lineTo(e5 + 4, n3 + 4), a2.moveTo(e5 + 4, n3 - 4), a2.lineTo(e5 - 4, n3 + 4), a2.stroke();
      else if ((t3.kind === `exit` || t3.kind === `denEntrance`) && i2 >= 1) {
        let r3 = t3.label || (t3.to && t3.to in Ep ? Ep[t3.to].name : ``);
        r3 && (a2.font = `600 12px "Cinzel", Georgia, serif`, a2.fillStyle = `#e8d6a8`, a2.shadowColor = `#000`, a2.shadowBlur = 4, a2.fillText(r3, e5, n3 - 6), a2.shadowBlur = 0);
      }
    }
    for (let t3 of e4.units) {
      if (t3.dead) continue;
      let [e5, n3] = o2(t3.x, t3.z);
      t3.kind === `npc` ? (a2.strokeStyle = `#ffd84a`, a2.lineWidth = 2 * i2, a2.beginPath(), a2.moveTo(e5 - 4 * i2, n3), a2.lineTo(e5 + 4 * i2, n3), a2.moveTo(e5, n3 - 4 * i2), a2.lineTo(e5, n3 + 4 * i2), a2.stroke()) : t3.kind === `ally` && (a2.fillStyle = `#5ee08a`, a2.beginPath(), a2.arc(e5, n3, 2.6 * i2, 0, Math.PI * 2), a2.fill());
    }
    let l2 = e4.hero, [u2, d2] = o2(l2.x, l2.z), f2 = Math.sin(l2.facing), p2 = Math.cos(l2.facing), [m2, h2] = o2(l2.x + f2, l2.z + p2), g2 = m2 - u2, _2 = h2 - d2, v2 = Math.hypot(g2, _2) || 1, y2 = g2 / v2, b2 = _2 / v2, x2 = 7 * Math.max(0.75, i2);
    a2.fillStyle = `#ffffff`, a2.strokeStyle = `rgba(0,0,0,0.8)`, a2.lineWidth = 1.5, a2.beginPath(), a2.moveTo(u2 + y2 * x2, d2 + b2 * x2), a2.lineTo(u2 - y2 * x2 * 0.6 - b2 * x2 * 0.55, d2 - b2 * x2 * 0.6 + y2 * x2 * 0.55), a2.lineTo(u2 - y2 * x2 * 0.25, d2 - b2 * x2 * 0.25), a2.lineTo(u2 - y2 * x2 * 0.6 + b2 * x2 * 0.55, d2 - b2 * x2 * 0.6 - y2 * x2 * 0.55), a2.closePath(), a2.stroke(), a2.fill();
  }
}, Fg = `unhallowed.char.`, Ig = `unhallowed.index`, Lg = `unhallowed.options`;
function Rg() {
  try {
    let e4 = window.localStorage, t2 = `unhallowed.__probe`;
    return e4.setItem(t2, `1`), e4.removeItem(t2), e4;
  } catch {
    return null;
  }
}
var zg = class {
  mem = /* @__PURE__ */ new Map();
  ls = Rg();
  get(e4) {
    if (this.ls) try {
      return this.ls.getItem(e4);
    } catch {
    }
    return this.mem.get(e4) ?? null;
  }
  set(e4, t2) {
    if (this.mem.set(e4, t2), this.ls) try {
      this.ls.setItem(e4, t2);
    } catch {
    }
  }
  del(e4) {
    this.mem.delete(e4);
    try {
      this.ls?.removeItem(e4);
    } catch {
    }
  }
  index() {
    try {
      let e4 = this.get(Ig), t2 = e4 ? JSON.parse(e4) : [];
      return Array.isArray(t2) ? t2.filter((e5) => typeof e5 == `string`) : [];
    } catch {
      return [];
    }
  }
  writeIndex(e4) {
    this.set(Ig, JSON.stringify([...new Set(e4)]));
  }
  list() {
    let e4 = [];
    for (let t2 of this.index()) {
      let n2 = this.load(t2);
      n2 && e4.push(n2);
    }
    return e4.sort((e5, t2) => t2.lastPlayed - e5.lastPlayed);
  }
  load(e4) {
    try {
      let t2 = this.get(Fg + e4);
      if (!t2) return null;
      let n2 = JSON.parse(t2);
      return !n2 || typeof n2 != `object` || n2.version !== 1 || typeof n2.name != `string` ? null : n2;
    } catch {
      return null;
    }
  }
  save(e4) {
    e4.lastPlayed = Date.now();
    try {
      this.set(Fg + e4.id, JSON.stringify(e4));
      let t2 = this.index();
      t2.includes(e4.id) || this.writeIndex([...t2, e4.id]);
    } catch {
    }
  }
  remove(e4) {
    this.del(Fg + e4), this.writeIndex(this.index().filter((t2) => t2 !== e4));
  }
  loadOptions() {
    try {
      let e4 = this.get(Lg);
      return e4 ? JSON.parse(e4) : null;
    } catch {
      return null;
    }
  }
  saveOptions(e4) {
    try {
      this.set(Lg, JSON.stringify(e4));
    } catch {
    }
  }
};

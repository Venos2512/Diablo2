// ===== game part 07-terrain-grass-materials (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
Ed(), Ld(), dm();
var Bh = 16;
function Vh() {
  let e4 = new Id(4242), t2 = [], n2 = [], r2 = [], i2 = [];
  for (let a3 = 0; a3 < 9; a3 += 1) {
    let a4 = e4.range(0, Math.PI * 2), o2 = e4.range(0, 0.28), s2 = Math.cos(a4) * o2, c2 = Math.sin(a4) * o2, l2 = e4.range(0.25, 0.55), u2 = e4.range(0.035, 0.06), d2 = e4.range(0, Math.PI * 2), f2 = e4.range(0.1, 0.45), p2 = Math.cos(d2), m2 = Math.sin(d2), h2 = -m2, g2 = p2, _2 = t2.length / 3;
    for (let e5 = 0; e5 <= 3; e5 += 1) {
      let i3 = e5 / 3, a5 = f2 * i3 * i3, o3 = s2 + p2 * a5 * l2, d3 = c2 + m2 * a5 * l2, _3 = l2 * i3, v2 = u2 * (1 - i3 * 0.92);
      t2.push(o3 + h2 * v2, _3, d3 + g2 * v2, o3 - h2 * v2, _3, d3 - g2 * v2), n2.push(p2 * 0.3, 0.95, m2 * 0.3, p2 * 0.3, 0.95, m2 * 0.3);
      let y2 = 0.55 + i3 * 0.55;
      r2.push(y2, y2, y2, y2, y2, y2);
    }
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let t3 = _2 + e5 * 2;
      i2.push(t3, t3 + 1, t3 + 2, t3 + 1, t3 + 3, t3 + 2);
    }
  }
  let a2 = new Qi();
  return a2.setAttribute(`position`, new Bi(t2, 3)), a2.setAttribute(`normal`, new Bi(n2, 3)), a2.setAttribute(`color`, new Bi(r2, 3)), a2.setIndex(i2), a2;
}
function Hh(e4, t2, n2, r2 = 1) {
  let i2 = Vh(), a2 = { uTime: { value: 0 }, uHero: { value: new N(9999, 0, 9999) }, uTip: { value: new P(n2.tip) } }, o2 = new Yo({ color: new P(n2.base), roughness: 0.92, metalness: 0, vertexColors: true, side: 2 });
  o2.onBeforeCompile = (e5) => {
    Object.assign(e5.uniforms, a2), e5.vertexShader = e5.vertexShader.replace(`#include <common>`, `#include <common>
        uniform float uTime;
        uniform vec3 uHero;
        uniform vec3 uTip;
        varying float vTipT;`).replace(`#include <begin_vertex>`, `#include <begin_vertex>
        vec3 ip = instanceMatrix[3].xyz;
        float hgt = position.y;
        vTipT = clamp(hgt / 0.5, 0.0, 1.0);
        float ph = ip.x * 0.21 + ip.z * 0.17;
        float gust = sin(uTime * 0.6 + ip.x * 0.05) * 0.5 + 0.5;
        float wind = (sin(uTime * 2.1 + ph) * 0.6 + sin(uTime * 3.7 + ph * 1.9) * 0.25) * (0.5 + gust);
        transformed.x += wind * hgt * 0.22;
        transformed.z += wind * hgt * 0.12;
        vec2 away = ip.xz - uHero.xz;
        float dd = length(away);
        float push = smoothstep(1.4, 0.2, dd);
        transformed.xz += normalize(away + 1e-4) * push * hgt * 0.8;
        transformed.y -= push * hgt * 0.35;`), e5.fragmentShader = e5.fragmentShader.replace(`#include <common>`, `#include <common>
uniform vec3 uTip;
varying float vTipT;`).replace(`#include <normal_fragment_begin>`, `float faceDirection = 1.0;
        vec3 normal = normalize( vNormal );
        vec3 nonPerturbedNormal = normal;`).replace(`#include <color_fragment>`, `#include <color_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, uTip * vColor.rgb, vTipT * vTipT);`);
  }, o2.customProgramCacheKey = () => `grass-v2`;
  let s2 = new Qr();
  s2.name = `grass`;
  let c2 = new Id(t2 ^ 39509), { w: l2, h: u2 } = e4, d2 = new wr(), f2 = new ir(), p2 = new N(), m2 = new N(), h2 = new P(), g2 = new P(1, 1, 1);
  for (let t3 = 0; t3 < u2; t3 += Bh) for (let n3 = 0; n3 < l2; n3 += Bh) {
    let a3 = [], _2 = [];
    for (let i3 = t3; i3 < Math.min(u2, t3 + Bh); i3 += 1) for (let t4 = n3; t4 < Math.min(l2, n3 + Bh); t4 += 1) {
      let n4 = e4.grass[i3 * l2 + t4] / 255;
      if (n4 <= 0.02) continue;
      let o3 = Math.floor(n4 * 2.4 * r2 + c2.next());
      for (let r3 = 0; r3 < o3; r3 += 1) {
        let r4 = t4 + c2.next(), o4 = i3 + c2.next();
        m2.set(r4, um(e4, r4, o4) - 0.02, o4), f2.setFromAxisAngle(Uh, c2.range(0, Math.PI * 2));
        let s3 = c2.range(0.6, 1.05) * (0.55 + n4 * 0.45);
        p2.set(s3 * 1.15, s3 * c2.range(0.75, 1.15), s3 * 1.15), d2.compose(m2, f2, p2), a3.push(d2.clone());
        let l3 = c2.range(0.82, 1.12);
        h2.copy(g2).multiplyScalar(l3), _2.push(h2.clone());
      }
    }
    if (!a3.length) continue;
    let v2 = new Ga(i2, o2, a3.length);
    for (let e5 = 0; e5 < a3.length; e5 += 1) v2.setMatrixAt(e5, a3[e5]), v2.setColorAt(e5, _2[e5]);
    v2.instanceMatrix.needsUpdate = true, v2.instanceColor && (v2.instanceColor.needsUpdate = true), v2.computeBoundingSphere(), v2.castShadow = false, v2.receiveShadow = true, s2.add(v2);
  }
  return { group: s2, update(e5, t3) {
    a2.uTime.value = e5, a2.uHero.value.copy(t3);
  }, dispose() {
    i2.dispose(), o2.dispose();
    for (let e5 of s2.children) e5.dispose();
  } };
}
// [ASHLAR] grass cards: replaces Hh() for the non-cave themes when js/ashlar-terrain.js loaded the card atlas.
// Same return shape as Hh ({ group, update(t, hero), dispose() }). Three crossed 1 x 1 m quads per tuft sample one cell of the
// 2 x 2 atlas (aCell per instance); wind and hero push as in Hh. Parameters: assets/ashlar/terrain/config.json "cards".
function ashlarGrassCards(layout, seed, palette, density) {
  const T = ashlarCards.params;
  const uni = { uTime: { value: 0 }, uHero: { value: new N(9999, 0, 9999) }, uSpec: { value: T.specular ?? 1 } };
  const mat = new Yo({ map: ashlarCards.tex, color: 0xffffff, roughness: T.roughness, metalness: 0, side: 2, alphaTest: T.alphaTest, alphaToCoverage: true });
  mat.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uni);
    s.vertexShader = s.vertexShader.replace(`#include <common>`, `#include <common>
        attribute float aCell;
        uniform float uTime;
        uniform vec3 uHero;`).replace(`#include <uv_vertex>`, `#include <uv_vertex>
        #ifdef USE_MAP
          vMapUv = vMapUv * 0.5 + vec2(mod(aCell, 2.0) * 0.5, aCell < 1.5 ? 0.5 : 0.0);
        #endif`).replace(`#include <begin_vertex>`, `#include <begin_vertex>
        {
          vec3 ip = instanceMatrix[3].xyz;
          float hgt = clamp(position.y, 0.0, 1.0);
          float bend = hgt * hgt * length(instanceMatrix[1].xyz);
          float ph = ip.x * 0.21 + ip.z * 0.17;
          float gust = sin(uTime * 0.6 + ip.x * 0.05) * 0.5 + 0.5;
          float wind = (sin(uTime * 2.1 + ph) * 0.6 + sin(uTime * 3.7 + ph * 1.9) * 0.25) * (0.5 + gust);
          vec2 d = vec2(wind * 0.22, wind * 0.12) * bend;
          vec2 away = ip.xz - uHero.xz;
          float push = smoothstep(1.4, 0.2, length(away));
          d += normalize(away + 1e-4) * push * bend * 0.8;
          vec3 c0 = instanceMatrix[0].xyz, c2 = instanceMatrix[2].xyz;
          transformed.x += dot(d, c0.xz) / dot(c0, c0);
          transformed.z += dot(d, c2.xz) / dot(c2, c2);
          transformed.y -= push * hgt * 0.3;
        }`);
    s.fragmentShader = s.fragmentShader.replace(`#include <normal_fragment_begin>`, `float faceDirection = 1.0;
        vec3 normal = normalize( vNormal );
        vec3 nonPerturbedNormal = normal;`).replace(`#include <opaque_fragment>`, `outgoingLight -= totalSpecular * (1.0 - uSpec); // matte: the specular scale of config.json cards.params.specular
        #include <opaque_fragment>`).replace(`#include <common>`, `#include <common>
        uniform float uSpec;`);
  };
  mat.customProgramCacheKey = () => `ashlar-cards-v2`;

  // normals point up: a tuft is lit like the ground it grows from
  const pos = [], uv = [], nrm = [], idx = [];
  for (let q = 0; q < 3; q++) {
    const a = (q / 3) * Math.PI, cx = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5, base = pos.length / 3;
    for (const [t, y] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      pos.push(cx * (t * 2 - 1), y - 0.03 * (1 - y), cz * (t * 2 - 1));
      uv.push(t, y);
      nrm.push(0, 1, 0);
    }
    idx.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  }
  const proto = new Qi();
  proto.setAttribute(`position`, new Bi(pos, 3));
  proto.setAttribute(`normal`, new Bi(nrm, 3));
  proto.setAttribute(`uv`, new Bi(uv, 2));
  proto.setIndex(idx);

  const group = new Qr();
  group.name = `grass`;
  const geoms = [proto];
  const rng = new Id(seed ^ 39509), { w, h } = layout, m4 = new wr(), qt = new ir(), p = new N(), s = new N(), col = new P();
  for (let cz = 0; cz < h; cz += Bh) for (let cx = 0; cx < w; cx += Bh) { // one InstancedMesh (= one draw call) per Bh x Bh cell
    const mats = [], cols = [], cells = [];
    for (let y = cz; y < Math.min(h, cz + Bh); y++) for (let x = cx; x < Math.min(w, cx + Bh); x++) {
      const n = layout.grass[y * w + x] / 255;
      if (n <= 0.02) continue;
      const k = Math.floor(n * T.density * density + rng.next());
      for (let i = 0; i < k; i++) {
        const px = x + rng.next(), pz = y + rng.next();
        p.set(px, um(layout, px, pz) - T.sink, pz);
        qt.setFromAxisAngle(Uh, rng.range(0, Math.PI * 2));
        const hh = rng.range(T.hMin, T.hMax) * (T.hBase + n * (1 - T.hBase)), ww = hh * rng.range(T.wMin, T.wMax);
        s.set(ww, hh, ww);
        mats.push(m4.compose(p, qt, s).clone());
        const tone = rng.range(T.toneMin, T.toneMax), tint = rng.next();
        cols.push(col.setRGB(tone * T.rgb[0] * (1 - T.tint + T.tint * 2 * tint), tone * T.rgb[1], tone * T.rgb[2] * (1 + T.tint - T.tint * 2 * tint)).clone());
        cells.push(Math.min(3, Math.floor(rng.next() * 4)));
      }
    }
    if (!mats.length) continue;
    const g = proto.clone();
    g.setAttribute(`aCell`, new La(new Float32Array(cells), 1));
    geoms.push(g);
    const mesh = new Ga(g, mat, mats.length);
    for (let i = 0; i < mats.length; i++) {
      mesh.setMatrixAt(i, mats[i]);
      mesh.setColorAt(i, cols[i]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.name = `ashlar-cards`;
    group.add(mesh);
  }
  return {
    group,
    update(t, hero) {
      uni.uTime.value = t;
      uni.uHero.value.copy(hero);
    },
    dispose() {
      for (const g of geoms) g.dispose();
      mat.dispose();
    },
  };
}
var Uh = new N(0, 1, 0);
function Wh(e4) {
  let t2 = new Qr(), n2 = { uTime: { value: 0 }, uRain: { value: 0 } }, r2 = new Yo({ color: new P(`#0b1214`), roughness: 0.06, metalness: 0.1, envMapIntensity: 1.6 });
  r2.onBeforeCompile = (e5) => {
    Object.assign(e5.uniforms, n2), e5.vertexShader = e5.vertexShader.replace(`#include <common>`, `#include <common>
varying vec3 vWWPos;`).replace(`#include <worldpos_vertex>`, `#include <worldpos_vertex>
vWWPos = (modelMatrix * vec4(transformed,1.0)).xyz;`), e5.fragmentShader = e5.fragmentShader.replace(`#include <common>`, `#include <common>
        uniform float uTime, uRain;
        varying vec3 vWWPos;
        float wh(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        vec2 ripple(vec2 p, float t) {
          vec2 cell = floor(p);
          vec2 acc = vec2(0.0);
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 c = cell + vec2(float(i), float(j));
            float r = wh(c);
            vec2 center = c + vec2(wh(c + 3.1), wh(c + 7.7));
            float ph = fract(t * 0.9 + r);
            vec2 d = p - center;
            float dist = length(d);
            float ring = sin((dist - ph * 1.2) * 28.0) * smoothstep(ph * 1.2 + 0.08, ph * 1.2, dist) * smoothstep(ph * 1.2 - 0.25, ph * 1.2, dist);
            acc += normalize(d + 1e-4) * ring * (1.0 - ph);
          }
          return acc;
        }`).replace(`#include <normal_fragment_maps>`, `{
          vec2 p = vWWPos.xz;
          vec2 sw = vec2(sin(p.x * 1.3 + uTime * 0.7) + sin(p.y * 1.7 - uTime * 0.5), cos(p.x * 1.1 - uTime * 0.6) + cos(p.y * 1.9 + uTime * 0.4)) * 0.035;
          vec2 rp = ripple(p * 1.6, uTime) * 0.35 * uRain;
          vec3 wn = normalize(vec3(sw.x + rp.x, 1.0, sw.y + rp.y));
          normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);
        }`);
  }, r2.customProgramCacheKey = () => `water-v1`;
  for (let n3 of e4.water) {
    let i2 = new so(1, 40);
    i2.rotateX(-Math.PI / 2);
    let a2 = new xa(i2, r2);
    a2.scale.set(n3.rx * 1.08, 1, n3.rz * 1.08), a2.position.set(n3.x, um(e4, n3.x, n3.z) + 0.06, n3.z), a2.receiveShadow = true, t2.add(a2);
  }
  return { group: t2, update(e5, t3) {
    n2.uTime.value = e5, n2.uRain.value = t3;
  }, dispose() {
    r2.dispose();
    for (let e5 of t2.children) e5.geometry.dispose();
  } };
}
function Gh(e4, t2, n2) {
  let r2 = new Na(e4, t2, t2, Vt, Et);
  return r2.wrapS = _t, r2.wrapT = _t, r2.magFilter = Ct, r2.minFilter = Tt, r2.generateMipmaps = true, r2.anisotropy = 8, r2.colorSpace = n2 ? Vn : ``, r2.needsUpdate = true, r2;
}
function Kh(e4, t2, n2, r2) {
  let i2 = new Uint8Array(e4 * e4 * 4), a2 = (n3, r3) => t2[(r3 + e4) % e4 * e4 + (n3 + e4) % e4];
  for (let n3 = 0; n3 < e4; n3 += 1) for (let o2 = 0; o2 < e4; o2 += 1) {
    let s2 = a2(o2 + 1, n3 - 1) + 2 * a2(o2 + 1, n3) + a2(o2 + 1, n3 + 1) - (a2(o2 - 1, n3 - 1) + 2 * a2(o2 - 1, n3) + a2(o2 - 1, n3 + 1)), c2 = a2(o2 - 1, n3 + 1) + 2 * a2(o2, n3 + 1) + a2(o2 + 1, n3 + 1) - (a2(o2 - 1, n3 - 1) + 2 * a2(o2, n3 - 1) + a2(o2 + 1, n3 - 1)), l2 = -s2 * r2, u2 = -c2 * r2, d2 = 1, f2 = Math.hypot(l2, u2, d2);
    l2 /= f2, u2 /= f2, d2 /= f2;
    let p2 = (n3 * e4 + o2) * 4;
    i2[p2] = (l2 * 0.5 + 0.5) * 255, i2[p2 + 1] = (u2 * 0.5 + 0.5) * 255, i2[p2 + 2] = (d2 * 0.5 + 0.5) * 255, i2[p2 + 3] = Math.max(0, Math.min(255, t2[n3 * e4 + o2] * 255));
  }
  return { albedo: Gh(n2, e4, true), normal: Gh(i2, e4, false) };
}
function qh(e4) {
  return Math.max(0, Math.min(255, Math.round(e4 * 255)));
}
function Jh(e4, t2, n2) {
  return [e4[0] + (t2[0] - e4[0]) * n2, e4[1] + (t2[1] - e4[1]) * n2, e4[2] + (t2[2] - e4[2]) * n2];
}
function Yh(e4) {
  let t2 = new P(e4);
  return t2.convertLinearToSRGB(), [t2.r, t2.g, t2.b];
}
function Xh(e4) {
  return e4 < 0 ? 0 : e4 > 1 ? 1 : e4;
}
function Zh(e4, t2 = 512) {
  let n2 = `${e4}:${t2}`, r2 = ag.get(n2);
  if (r2) return r2;
  let i2 = sg[e4](t2);
  return ag.set(n2, i2), i2;
}
function Qh(e4, t2, n2, r2, i2, a2) {
  let o2 = new rg(4, 6, t2), s2 = new rg(64, 2, t2 + 1), c2 = new Float32Array(e4 * e4), l2 = new Uint8Array(e4 * e4 * 4);
  for (let t3 = 0; t3 < e4; t3 += 1) for (let u2 = 0; u2 < e4; u2 += 1) {
    let d2 = u2 / e4, f2 = t3 / e4, p2 = o2.fbm(d2, f2), m2 = s2.fbm(d2, f2), h2 = Xh((0.38 - p2) * 5), g2 = Xh(m2 * 0.7 + p2 * 0.3 - h2 * 0.3);
    c2[t3 * e4 + u2] = g2;
    let _2 = Jh(n2, r2, Xh(m2 * 1.3 - 0.1));
    _2 = Jh(_2, i2, Xh((m2 - 0.7) * 3) * 0.6), _2 = Jh(_2, a2, h2 * 0.85);
    let v2 = (t3 * e4 + u2) * 4;
    l2[v2] = qh(_2[0]), l2[v2 + 1] = qh(_2[1]), l2[v2 + 2] = qh(_2[2]), l2[v2 + 3] = qh(0.9);
  }
  return Kh(e4, c2, l2, 2.2);
}
function $h(e4, t2, n2, r2, i2, a2, o2, s2) {
  let c2 = new ig(t2, n2, s2), l2 = new rg(6, 5, n2 + 1), u2 = new Float32Array(e4 * e4), d2 = new Uint8Array(e4 * e4 * 4);
  for (let n3 = 0; n3 < e4; n3 += 1) for (let s3 = 0; s3 < e4; s3 += 1) {
    let f2 = s3 / e4, p2 = n3 / e4;
    c2.sample(f2, p2, og);
    let m2 = l2.fbm(f2, p2), h2 = og.f2 - og.f1, g2 = Xh((o2 * t2 * 0.1 - h2 + (m2 - 0.5) * 0.05) * 18), _2 = (og.id * 2654435761 >>> 0) / 4294967296, v2 = Xh(h2 * 3);
    u2[n3 * e4 + s3] = Xh((1 - g2) * (0.45 + v2 * 0.4 + m2 * 0.15));
    let y2 = Jh(r2, i2, _2 * 0.6 + m2 * 0.4);
    y2 = Jh(y2, a2, g2);
    let b2 = (n3 * e4 + s3) * 4;
    d2[b2] = qh(y2[0]), d2[b2 + 1] = qh(y2[1]), d2[b2 + 2] = qh(y2[2]), d2[b2 + 3] = qh(0.78 + g2 * 0.15 - _2 * 0.1);
  }
  return Kh(e4, u2, d2, 4);
}
function eg(e4 = 64, t2 = 2) {
  let n2 = new Uint8Array(e4 * e4 * 4);
  for (let r3 = 0; r3 < e4; r3 += 1) for (let i2 = 0; i2 < e4; i2 += 1) {
    let a2 = (i2 + 0.5) / e4 - 0.5, o2 = (r3 + 0.5) / e4 - 0.5, s2 = (1 - Math.min(1, Math.hypot(a2, o2) * 2)) ** t2, c2 = (r3 * e4 + i2) * 4;
    n2[c2] = 255, n2[c2 + 1] = 255, n2[c2 + 2] = 255, n2[c2 + 3] = Math.round(s2 * 255);
  }
  let r2 = new Na(n2, e4, e4);
  return r2.magFilter = Ct, r2.minFilter = Tt, r2.generateMipmaps = true, r2.needsUpdate = true, r2;
}
function tg(e4 = 128, t2 = 5) {
  let n2 = new rg(3, 5, t2), r2 = new Uint8Array(e4 * e4 * 4);
  for (let t3 = 0; t3 < e4; t3 += 1) for (let i3 = 0; i3 < e4; i3 += 1) {
    let a2 = i3 / e4, o2 = t3 / e4, s2 = a2 - 0.5, c2 = o2 - 0.5, l2 = Xh(1 - Math.hypot(s2, c2) * 2), u2 = Xh((n2.fbm(a2, o2) - 0.25) * 1.6) * l2 * l2, d2 = (t3 * e4 + i3) * 4;
    r2[d2] = 255, r2[d2 + 1] = 255, r2[d2 + 2] = 255, r2[d2 + 3] = Math.round(u2 * 255);
  }
  let i2 = new Na(r2, e4, e4);
  return i2.magFilter = Ct, i2.minFilter = Tt, i2.generateMipmaps = true, i2.needsUpdate = true, i2;
}
var ng, rg, ig, ag, og, sg, cg = t((() => {
  Ed(), Ld(), ng = class {
    period;
    v;
    constructor(e4, t2) {
      this.period = e4;
      let n2 = new Id(t2);
      this.v = new Float32Array(e4 * e4);
      for (let e5 = 0; e5 < this.v.length; e5 += 1) this.v[e5] = n2.next();
    }
    sample(e4, t2) {
      let n2 = this.period, r2 = e4 * n2, i2 = t2 * n2, a2 = Math.floor(r2), o2 = Math.floor(i2), s2 = r2 - a2, c2 = i2 - o2, l2 = s2 * s2 * (3 - 2 * s2), u2 = c2 * c2 * (3 - 2 * c2), d2 = (a2 % n2 + n2) % n2, f2 = (o2 % n2 + n2) % n2, p2 = (d2 + 1) % n2, m2 = (f2 + 1) % n2, h2 = this.v[f2 * n2 + d2], g2 = this.v[f2 * n2 + p2], _2 = this.v[m2 * n2 + d2], v2 = this.v[m2 * n2 + p2];
      return h2 + (g2 - h2) * l2 + (_2 - h2) * u2 + (h2 - g2 - _2 + v2) * l2 * u2;
    }
  }, rg = class {
    octs = [];
    constructor(e4, t2, n2) {
      let r2 = e4;
      for (let e5 = 0; e5 < t2; e5 += 1) this.octs.push(new ng(r2, n2 * 7919 + e5 * 104729)), r2 *= 2;
    }
    fbm(e4, t2, n2 = 0.5) {
      let r2 = 1, i2 = 0, a2 = 0;
      for (let o2 of this.octs) i2 += o2.sample(e4, t2) * r2, a2 += r2, r2 *= n2;
      return i2 / a2;
    }
    ridged(e4, t2) {
      let n2 = 1, r2 = 0, i2 = 0;
      for (let a2 of this.octs) {
        let o2 = 1 - Math.abs(a2.sample(e4, t2) * 2 - 1);
        r2 += o2 * o2 * n2, i2 += n2, n2 *= 0.5;
      }
      return r2 / i2;
    }
  }, ig = class {
    cells;
    jitter;
    pts;
    constructor(e4, t2, n2 = 0.9) {
      this.cells = e4, this.jitter = n2;
      let r2 = new Id(t2);
      this.pts = new Float32Array(e4 * e4 * 2);
      for (let t3 = 0; t3 < e4 * e4; t3 += 1) this.pts[t3 * 2] = 0.5 + (r2.next() - 0.5) * n2, this.pts[t3 * 2 + 1] = 0.5 + (r2.next() - 0.5) * n2;
    }
    sample(e4, t2, n2) {
      let r2 = this.cells, i2 = e4 * r2, a2 = t2 * r2, o2 = Math.floor(i2), s2 = Math.floor(a2), c2 = 9, l2 = 9, u2 = 0;
      for (let e5 = -1; e5 <= 1; e5 += 1) for (let t3 = -1; t3 <= 1; t3 += 1) {
        let n3 = o2 + t3, d2 = s2 + e5, f2 = (n3 % r2 + r2) % r2, p2 = (d2 % r2 + r2) % r2 * r2 + f2, m2 = n3 + this.pts[p2 * 2], h2 = d2 + this.pts[p2 * 2 + 1], g2 = Math.hypot(m2 - i2, h2 - a2);
        g2 < c2 ? (l2 = c2, c2 = g2, u2 = p2) : g2 < l2 && (l2 = g2);
      }
      n2.f1 = c2, n2.f2 = l2, n2.id = u2;
    }
  }, ag = /* @__PURE__ */ new Map(), og = { f1: 0, f2: 0, id: 0 }, sg = { grass: (e4) => Qh(e4, 11, Yh(`#29331c`), Yh(`#4a5a2a`), Yh(`#5e6a35`), Yh(`#3a2e1f`)), grassDry: (e4) => Qh(e4, 12, Yh(`#3a3520`), Yh(`#6b6234`), Yh(`#80743f`), Yh(`#3a2e1f`)), dirt: (e4) => {
    let t2 = new rg(4, 6, 21), n2 = new ig(26, 22, 1), r2 = new Float32Array(e4 * e4), i2 = new Uint8Array(e4 * e4 * 4), a2 = Yh(`#3d2f22`), o2 = Yh(`#5e4a35`), s2 = Yh(`#5b5248`);
    for (let c2 = 0; c2 < e4; c2 += 1) for (let l2 = 0; l2 < e4; l2 += 1) {
      let u2 = l2 / e4, d2 = c2 / e4, f2 = t2.fbm(u2, d2);
      n2.sample(u2, d2, og);
      let p2 = Xh((0.08 + (og.id * 0.61803398875 % 1 + 1) % 1 * 0.2 - og.f1 * (0.85 + og.id * 0.37 % 1 * 0.4)) * 7) * +(og.id * 37 % 9 < 2), m2 = f2 * 0.55 + p2 * 0.45;
      r2[c2 * e4 + l2] = m2;
      let h2 = Jh(a2, o2, Xh(f2 * 1.4 - 0.2));
      h2 = Jh(h2, s2, p2 * 0.55);
      let g2 = (c2 * e4 + l2) * 4;
      i2[g2] = qh(h2[0]), i2[g2 + 1] = qh(h2[1]), i2[g2 + 2] = qh(h2[2]), i2[g2 + 3] = qh(0.88 - p2 * 0.2);
    }
    return Kh(e4, r2, i2, 3.2);
  }, mud: (e4) => {
    let t2 = new rg(3, 6, 31), n2 = new rg(8, 4, 32), r2 = new Float32Array(e4 * e4), i2 = new Uint8Array(e4 * e4 * 4), a2 = Yh(`#1e1712`), o2 = Yh(`#3b2c20`);
    for (let s2 = 0; s2 < e4; s2 += 1) for (let c2 = 0; c2 < e4; c2 += 1) {
      let l2 = c2 / e4, u2 = s2 / e4, d2 = t2.fbm(l2, u2), f2 = n2.ridged(l2, u2), p2 = Xh((0.42 - d2) * 8), m2 = d2 * 0.5 + f2 * 0.25 - p2 * 0.2;
      r2[s2 * e4 + c2] = Xh(m2);
      let h2 = Jh(Jh(a2, o2, Xh(f2 * 1.2)), Yh(`#120d09`), p2 * 0.7), g2 = (s2 * e4 + c2) * 4;
      i2[g2] = qh(h2[0]), i2[g2 + 1] = qh(h2[1]), i2[g2 + 2] = qh(h2[2]), i2[g2 + 3] = qh(0.62 - p2 * 0.5 + f2 * 0.12);
    }
    return Kh(e4, r2, i2, 2.4);
  }, cobble: (e4) => $h(e4, 9, 41, Yh(`#4c4a46`), Yh(`#77736a`), Yh(`#1c1915`), 0.06, 0.8), flagstone: (e4) => $h(e4, 4, 51, Yh(`#4a4842`), Yh(`#6c675e`), Yh(`#17140f`), 0.035, 0.6), caveRock: (e4) => {
    let t2 = new rg(4, 6, 61), n2 = new ig(7, 62, 1), r2 = new Float32Array(e4 * e4), i2 = new Uint8Array(e4 * e4 * 4), a2 = Yh(`#26221f`), o2 = Yh(`#4b443c`);
    for (let s2 = 0; s2 < e4; s2 += 1) for (let c2 = 0; c2 < e4; c2 += 1) {
      let l2 = c2 / e4, u2 = s2 / e4, d2 = t2.fbm(l2, u2);
      n2.sample(l2, u2, og);
      let f2 = Xh(1 - (og.f2 - og.f1) * 9), p2 = Xh(d2 * 0.75 + (1 - og.f1) * 0.25 - f2 * 0.4);
      r2[s2 * e4 + c2] = p2;
      let m2 = Jh(Jh(a2, o2, d2), Yh(`#0e0c0a`), f2 * 0.8), h2 = (s2 * e4 + c2) * 4;
      i2[h2] = qh(m2[0]), i2[h2 + 1] = qh(m2[1]), i2[h2 + 2] = qh(m2[2]), i2[h2 + 3] = qh(0.82 + f2 * 0.1);
    }
    return Kh(e4, r2, i2, 3.5);
  }, gravel: (e4) => {
    let t2 = new ig(40, 71, 1), n2 = new rg(4, 5, 72), r2 = new Float32Array(e4 * e4), i2 = new Uint8Array(e4 * e4 * 4);
    for (let a2 = 0; a2 < e4; a2 += 1) for (let o2 = 0; o2 < e4; o2 += 1) {
      let s2 = o2 / e4, c2 = a2 / e4;
      t2.sample(s2, c2, og);
      let l2 = n2.fbm(s2, c2), u2 = Xh((0.42 - og.f1) * 4);
      r2[a2 * e4 + o2] = u2 * 0.8 + l2 * 0.2;
      let d2 = (og.id * 2654435761 >>> 0) / 4294967296, f2 = Jh(Yh(`#2a2520`), Jh(Yh(`#5a544b`), Yh(`#7a7266`), d2), u2), p2 = (a2 * e4 + o2) * 4;
      i2[p2] = qh(f2[0]), i2[p2 + 1] = qh(f2[1]), i2[p2 + 2] = qh(f2[2]), i2[p2 + 3] = qh(0.85);
    }
    return Kh(e4, r2, i2, 3);
  }, moss: (e4) => Qh(e4, 13, Yh(`#1f2a16`), Yh(`#33441f`), Yh(`#47592a`), Yh(`#1e1a12`)), stoneBlocks: (e4) => {
    let t2 = new rg(6, 6, 81), n2 = new rg(2, 4, 82), r2 = new Float32Array(e4 * e4), i2 = new Uint8Array(e4 * e4 * 4);
    for (let a2 = 0; a2 < e4; a2 += 1) for (let o2 = 0; o2 < e4; o2 += 1) {
      let s2 = o2 / e4, c2 = a2 / e4, l2 = Math.floor(c2 * 6), u2 = l2 % 2 * 0.5, d2 = (s2 * 3 + u2) % 3, f2 = Math.floor(d2), p2 = d2 - f2, m2 = c2 * 6 - l2, h2 = Math.min(p2, 1 - p2, m2 * 0.5, (1 - m2) * 0.5) * 2, g2 = t2.fbm(s2, c2), _2 = Xh((0.05 - h2 + (g2 - 0.5) * 0.06) * 30), v2 = ((l2 * 31 + f2 * 17) * 2654435761 >>> 0) / 4294967296, y2 = Xh((n2.fbm(s2, c2) - 0.45) * 2.2) * (0.4 + c2 * 0.6);
      r2[a2 * e4 + o2] = Xh((1 - _2) * (0.7 + g2 * 0.3) - (1 - h2) * 0.05);
      let b2 = Jh(Yh(`#5b5750`), Yh(`#7d776c`), v2 * 0.7 + g2 * 0.3);
      b2 = Jh(b2, Yh(`#2b2722`), y2 * 0.6), b2 = Jh(b2, Yh(`#1b1814`), _2);
      let x2 = (a2 * e4 + o2) * 4;
      i2[x2] = qh(b2[0]), i2[x2 + 1] = qh(b2[1]), i2[x2 + 2] = qh(b2[2]), i2[x2 + 3] = qh(0.84 + _2 * 0.1);
    }
    return Kh(e4, r2, i2, 4);
  }, bark: (e4) => {
    let t2 = new rg(3, 5, 91), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = t2.fbm(o2 * 1, s2 * 0.25 + t2.fbm(o2, s2) * 0.1), l2 = Xh(Math.abs(Math.sin((o2 * 14 + c2 * 3) * Math.PI)) ** 0.35 * 0.7 + c2 * 0.3);
      n2[i2 * e4 + a2] = l2;
      let u2 = Jh(Yh(`#120e0b`), Jh(Yh(`#3a2f26`), Yh(`#564838`), c2), l2), d2 = (i2 * e4 + a2) * 4;
      r2[d2] = qh(u2[0]), r2[d2 + 1] = qh(u2[1]), r2[d2 + 2] = qh(u2[2]), r2[d2 + 3] = qh(0.9);
    }
    return Kh(e4, n2, r2, 5);
  }, wood: (e4) => {
    let t2 = new rg(2, 5, 101), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = Math.floor(o2 * 4), l2 = o2 * 4 - c2, u2 = Xh((0.04 - Math.min(l2, 1 - l2)) * 40), d2 = (c2 * 977 * 2654435761 >>> 0) / 4294967296, f2 = Math.sin((s2 * 40 + t2.fbm(o2 * 0.5, s2) * 12 + c2 * 3.1) * Math.PI) * 0.5 + 0.5, p2 = t2.fbm(o2, s2);
      n2[i2 * e4 + a2] = Xh(0.7 + f2 * 0.15 + p2 * 0.15 - u2 * 0.7);
      let m2 = Jh(Yh(`#3b2a1c`), Yh(`#5f4630`), d2 * 0.6 + f2 * 0.25 + p2 * 0.15);
      m2 = Jh(m2, Yh(`#140d08`), u2);
      let h2 = (i2 * e4 + a2) * 4;
      r2[h2] = qh(m2[0]), r2[h2 + 1] = qh(m2[1]), r2[h2 + 2] = qh(m2[2]), r2[h2 + 3] = qh(0.82);
    }
    return Kh(e4, n2, r2, 2.5);
  }, canvas: (e4) => {
    let t2 = new rg(3, 5, 111), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = Math.sin(o2 * e4 * 0.9) * Math.sin(s2 * e4 * 0.9) * 0.5 + 0.5, l2 = t2.fbm(o2, s2), u2 = Xh((l2 - 0.55) * 3);
      n2[i2 * e4 + a2] = c2 * 0.3 + l2 * 0.2;
      let d2 = Jh(Jh(Yh(`#8a7a5e`), Yh(`#a8977a`), c2 * 0.3 + l2 * 0.4), Yh(`#4a3b2a`), u2 * 0.6), f2 = (i2 * e4 + a2) * 4;
      r2[f2] = qh(d2[0]), r2[f2 + 1] = qh(d2[1]), r2[f2 + 2] = qh(d2[2]), r2[f2 + 3] = qh(0.95);
    }
    return Kh(e4, n2, r2, 1.2);
  }, rock: (e4) => {
    let t2 = new rg(3, 7, 121), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = t2.ridged(o2, s2), l2 = t2.fbm(o2 + 0.3, s2 + 0.7), u2 = Xh((l2 - 0.6) * 4);
      n2[i2 * e4 + a2] = Xh(c2 * 0.8 + l2 * 0.2);
      let d2 = Jh(Yh(`#3e3a35`), Yh(`#6e685e`), c2);
      d2 = Jh(d2, Yh(`#4d5530`), u2 * 0.5);
      let f2 = (i2 * e4 + a2) * 4;
      r2[f2] = qh(d2[0]), r2[f2 + 1] = qh(d2[1]), r2[f2 + 2] = qh(d2[2]), r2[f2 + 3] = qh(0.86);
    }
    return Kh(e4, n2, r2, 4.5);
  }, iron: (e4) => {
    let t2 = new rg(4, 6, 131), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = t2.fbm(o2, s2), l2 = Xh((t2.fbm(o2 * 2 + 0.5, s2 * 2) - 0.52) * 3.5);
      n2[i2 * e4 + a2] = c2 * 0.3 + l2 * 0.3;
      let u2 = Jh(Jh(Yh(`#3c3e42`), Yh(`#5c5f64`), c2), Yh(`#5a3420`), l2), d2 = (i2 * e4 + a2) * 4;
      r2[d2] = qh(u2[0]), r2[d2 + 1] = qh(u2[1]), r2[d2 + 2] = qh(u2[2]), r2[d2 + 3] = qh(0.48 + l2 * 0.45 + c2 * 0.1);
    }
    return Kh(e4, n2, r2, 1.5);
  }, hide: (e4) => {
    let t2 = new rg(5, 5, 141), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = t2.fbm(o2, s2), l2 = Xh((t2.fbm(o2 * 0.5, s2 * 0.5) - 0.55) * 4);
      n2[i2 * e4 + a2] = c2 * 0.4;
      let u2 = Jh(Jh(Yh(`#5c4632`), Yh(`#7c6248`), c2), Yh(`#3a2a1c`), l2), d2 = (i2 * e4 + a2) * 4;
      r2[d2] = qh(u2[0]), r2[d2 + 1] = qh(u2[1]), r2[d2 + 2] = qh(u2[2]), r2[d2 + 3] = qh(0.78);
    }
    return Kh(e4, n2, r2, 1.6);
  }, thatch: (e4) => {
    let t2 = new rg(3, 5, 151), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = Math.abs(Math.sin((o2 * 90 + t2.fbm(o2, s2 * 0.2) * 20) * Math.PI)), l2 = t2.fbm(o2, s2);
      n2[i2 * e4 + a2] = c2 * 0.6 + l2 * 0.4;
      let u2 = Jh(Yh(`#3f3420`), Yh(`#7d6a42`), c2 * 0.6 + l2 * 0.4), d2 = (i2 * e4 + a2) * 4;
      r2[d2] = qh(u2[0]), r2[d2 + 1] = qh(u2[1]), r2[d2 + 2] = qh(u2[2]), r2[d2 + 3] = qh(0.93);
    }
    return Kh(e4, n2, r2, 2.5);
  }, bone: (e4) => {
    let t2 = new rg(6, 5, 161), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = t2.fbm(o2, s2);
      n2[i2 * e4 + a2] = c2 * 0.4;
      let l2 = Jh(Yh(`#9d927a`), Yh(`#d4c9ad`), c2), u2 = (i2 * e4 + a2) * 4;
      r2[u2] = qh(l2[0]), r2[u2 + 1] = qh(l2[1]), r2[u2 + 2] = qh(l2[2]), r2[u2 + 3] = qh(0.6);
    }
    return Kh(e4, n2, r2, 1.2);
  }, plaster: (e4) => {
    let t2 = new rg(3, 6, 171), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = t2.fbm(o2, s2), l2 = Xh((0.04 - Math.abs(t2.fbm(o2 * 2, s2 * 2) - 0.5)) * 30);
      n2[i2 * e4 + a2] = c2 * 0.3 - l2 * 0.3 + 0.3;
      let u2 = Jh(Jh(Yh(`#6d6558`), Yh(`#8a8170`), c2), Yh(`#2a241d`), l2), d2 = (i2 * e4 + a2) * 4;
      r2[d2] = qh(u2[0]), r2[d2 + 1] = qh(u2[1]), r2[d2 + 2] = qh(u2[2]), r2[d2 + 3] = qh(0.9);
    }
    return Kh(e4, n2, r2, 2);
  } };
}));
Ed(), Ld(), cg();
var lg = { town: [`grass`, `dirt`, `mud`, `cobble`], moor: [`grass`, `dirt`, `mud`, `flagstone`], fields: [`grassDry`, `dirt`, `mud`, `flagstone`], cave: [`caveRock`, `gravel`, `mud`, `moss`] }, ug = { town: [5, 4, 5, 3], moor: [5, 4, 5, 4], fields: [5, 4, 5, 4], cave: [4, 3, 5, 3] }, dg = 18;
// [ASHLAR] ground layers: the ASHLAR textures replace the town / moor / fields layers (the cave keeps its own).
// The layer files are decoded by ashlarLoadTerrain() (js/ashlar-terrain.js) and turned into the game's own
// { albedo, normal } DataTextures by Kh(). New sg names are added instead of overwriting the originals (the cave shares `mud`).
// Mapping (assets/ashlar/terrain/config.json "themes"): grass -> grass, grassDry -> grass, dirt -> dirt, mud -> mud, cobble | flagstone -> cobble.
var ashlarCards = null; // { tex, params } while the card grass is active
var ashlarSurface = null; // { specular, roughnessMin, albedoGain } of the ASHLAR ground while it is installed (config.json "surface")
var ashlarLook = null; // { exposure } global look while ASHLAR is installed (config.json "look"); read by the renderer setup (06)
async function ashlarInstall() {
  const A = await ashlarLoadTerrain();
  if (!A) return; // ?ashlar=off, or a load failure (already warned): the original terrain and grass stay
  try {
    const tex = {};
    for (const [name, L] of Object.entries(A.layers)) tex[name] = Kh(L.size, L.heights, L.albedo, L.strength);
    // NormalMap-Online normals for the themes in config.json "nmapThemes" (the town): same albedo texture, other normal texture (RGB = map, A = height)
    const nmo = {};
    for (const [name, L] of Object.entries(A.layers)) if (L.nmap) nmo[name] = { albedo: tex[name].albedo, normal: Gh(L.nmap, L.size, false) };
    let cards = null;
    if (A.cards) {
      const t = new vr(A.cards.bitmap);
      t.colorSpace = Vn, t.flipY = false, t.anisotropy = 4, t.generateMipmaps = true, t.needsUpdate = true;
      cards = { tex: t, params: A.cards.params };
    }
    // everything built: only now repoint the game
    for (const name of Object.keys(tex)) sg[`ashlar_${name}`] = () => tex[name];
    for (const name of Object.keys(nmo)) sg[`ashlar_nmo_${name}`] = () => nmo[name];
    for (const [theme, names] of Object.entries(A.themes)) {
      const nm = A.nmapThemes.includes(theme) && names.every((n) => nmo[n]);
      lg[theme] = names.map((n) => `ashlar_${nm ? `nmo_` : ``}${n}`);
      ug[theme] = names.map((n) => A.layers[n].meters);
    }
    ashlarCards = cards, ashlarSurface = A.surface, ashlarLook = A.look;
    ASHLAR.ready = true, ASHLAR.cards = !!cards, ASHLAR.nmapThemes = A.nmapThemes.filter((t) => A.themes[t]?.every((n) => nmo[n]));
  } catch (e) {
    console.warn(`[ashlar] building the textures failed, using the original terrain and grass:`, e);
  }
}
// [ASHLAR] prop kits: js/ashlar-kits.js decoded the GLB kits, here they become three.js objects (assets/ashlar/kits/config.json).
// Pieces that replace props are merged into one static mesh per (kit, 24 m cell); the props they replace are skipped by mg() (kit.skip).
var ashlarKits = null; // { cfg, mats, kinds: { kind: { entries, pick, nav } }, walls: { palisade } } while the kits are active
function ashlarKitEntry(kits, raw) {
  const [key, name] = raw.piece.split(`/`), kit = kits[key], p = kit?.pieces[name];
  if (!p) return null;
  const d = [p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2]], f = raw.fit ?? {};
  const s = (f.x ? f.x / d[0] : f.y ? f.y / d[1] : f.z ? f.z / d[2] : f.max ? f.max / Math.max(d[0], d[1], d[2]) : 1) * (raw.scale ?? 1);
  return Object.assign({}, raw, { key, kit, p, s, d, yaw: (raw.yaw ?? 0) * Math.PI / 180 });
}
async function ashlarKitsInstall() {
  const K = await ashlarLoadKits();
  if (!K) return; // ?ashlar=off, ?kits=off or nothing loadable (warned): the original props stay
  try {
    const cfg = K.config, mc = cfg.material ?? {}, spec = { value: mc.specular ?? 1 }, mats = {}, kinds = {}, walls = {};
    const tex = (bmp, srgb) => {
      const t = new vr(bmp);
      t.colorSpace = srgb ? Vn : ``, t.flipY = false, t.wrapS = t.wrapT = _t, t.anisotropy = mc.anisotropy ?? 8, t.generateMipmaps = true, t.needsUpdate = true; // glTF: flipY false, repeat
      return t;
    };
    for (const [key, kit] of Object.entries(K.kits)) {
      const m = new Yo({ map: tex(kit.base, true), color: new P().setRGB(kit.color[0], kit.color[1], kit.color[2]), roughness: mc.roughness ?? 0.95, metalness: 0, side: mc.doubleSided?.includes(key) ? 2 : 0 }); // Tripo's metal map is ignored on purpose (matte)
      if (kit.normal) { // glTF without TANGENT -> derivative tangents: GLTFLoader flips normalScale.y, so do we
        const ns = (mc.normalScale ?? 1) * kit.normalScale;
        m.normalMap = tex(kit.normal, false), m.normalScale = new M(ns, -ns);
      }
      m.onBeforeCompile = (s) => {
        s.uniforms.uASpec = spec;
        s.fragmentShader = s.fragmentShader.replace(`#include <common>`, `#include <common>
          uniform float uASpec;`).replace(`#include <opaque_fragment>`, `outgoingLight -= totalSpecular * (1.0 - uASpec);
          #include <opaque_fragment>`);
      };
      m.customProgramCacheKey = () => `ashlar-kit-v1`;
      mats[key] = m;
    }
    for (const [kind, kc] of Object.entries(cfg.kinds)) {
      const entries = kc.entries.map((r) => ashlarKitEntry(K.kits, r)), ok = entries.filter(Boolean);
      if (ok.length !== entries.length) console.warn(`[ashlar] kind "${kind}": some pieces are missing (kit failed to load?), keeping the original props`);
      else {
        const extras = (kc.extras ?? []).map((r) => ashlarKitEntry(K.kits, r)).filter(Boolean).map((e, i) => Object.assign(e, { at: kc.extras[i].at ?? [0, 0] }));
        kinds[kind] = { entries: ok, pick: kc.pick ?? `sequence`, nav: kc.nav ?? 0, extras };
      }
    }
    for (const [name, wc] of Object.entries(cfg.walls ?? {})) {
      const pieces = wc.pieces.map((r) => ashlarKitEntry(K.kits, r)), ok = pieces.filter(Boolean);
      if (ok.length !== pieces.length) console.warn(`[ashlar] wall "${name}": some pieces are missing, keeping the original walls`);
      else walls[name] = Object.assign({}, wc, { pieces: ok.map((e, i) => Object.assign(e, { s: wc.height / e.d[1], zw: wc.pieces[i].zw ?? 0, brace: wc.pieces[i].brace ?? -1 })) });
    }
    ashlarKits = { cfg, mats, kinds, walls };
    ASHLAR_KITS.ready = true, ASHLAR_KITS.kits = Object.keys(K.kits);
  } catch (e) {
    console.warn(`[ashlar] building the kits failed, using the original props:`, e);
  }
}
// kit items of a layout (props -> pieces, wall runs -> pieces, extras), WITHOUT ground height: used by the nav (end of the town generator) and by the build.
// Cached per props array (the generator and the finished layout share it); deterministic (own RNG), so both see the same layout.
const ashlarPlans = new WeakMap();
function ashlarKitPlan(layout) {
  const cached = ashlarPlans.get(layout.props);
  if (cached) return cached;
  const K = ashlarKits, items = [], skip = new Set(), flames = [], counters = {};
  // yaw about +Y: local +x -> (cos, -sin), local +z -> (sin, cos)
  const place = (e, x, z, yaw, sx, sy, sz, yOff, kind) => {
    const it = { e, x, z, yaw, sx, sy, sz, yOff, kind, y: 0 };
    items.push(it);
    return it;
  };
  for (const pr of layout.props) {
    const kc = K.kinds[pr.kind];
    if (!kc) continue;
    const n = counters[pr.kind] = (counters[pr.kind] ?? -1) + 1, e = kc.entries[(kc.pick === `variant` ? pr.variant : n) % kc.entries.length];
    const s = e.s * pr.scale, [ox, oz] = e.off ?? [0, 0], cr = Math.cos(pr.rot), sr = Math.sin(pr.rot);
    const it = place(e, pr.x + ox * cr + oz * sr, pr.z - ox * sr + oz * cr, pr.rot + e.yaw, s, s, s, e.y ?? 0, pr.kind), c = Math.cos(it.yaw), sn = Math.sin(it.yaw);
    for (const [fx, fy, fz] of e.fire ?? []) flames.push({ it, dx: (fx * c + fz * sn) * s, dy: fy * s, dz: (-fx * sn + fz * c) * s, size: e.size ?? 0.55 });
    for (const x of kc.extras ?? []) { // extra pieces at a world offset from the prop (e.g. a post under a layout light)
      const xs = x.s * pr.scale;
      place(x, pr.x + x.at[0], pr.z + x.at[1], x.yaw, xs, xs, xs, x.y ?? 0, pr.kind);
    }
    skip.add(pr);
  }
  const W = K.walls.palisade;
  if (W && layout.runs?.some((r) => r.kind === `palisade`)) {
    const rng = new Id(7919 + layout.w), town = layout.regions.town ?? { x: layout.w / 2, z: layout.h / 2 };
    for (const run of layout.runs) {
      if (run.kind !== `palisade`) continue;
      const dx = run.x1 - run.x0, dz = run.z1 - run.z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, th0 = Math.atan2(-uz, ux);
      const zx = Math.sin(th0), zz = Math.cos(th0), out = ((run.x0 + run.x1) / 2 - town.x) * zx + ((run.z0 + run.z1) / 2 - town.z) * zz > 0 ? 1 : -1; // out * (zx, zz) points away from the town
      const seq = [];
      let total = 0, last = -1;
      for (;;) {
        let i = rng.int(0, W.pieces.length - 1);
        if (i === last) i = (i + 1) % W.pieces.length;
        const w = W.pieces[i].d[0] * W.pieces[i].s - W.overlap;
        if (total + w / 2 > L) break;
        seq.push(i), total += w, last = i;
      }
      const sx = L / total;
      let cum = 0;
      for (const i of seq) {
        const e = W.pieces[i], w = (e.d[0] * e.s - W.overlap) * sx, t = cum + w / 2;
        cum += w;
        // braces (the side of local z given by `brace`) face away from the town ("out") or into it ("in"); the stake plane (local z = zw) sits on the wall line
        const flip = e.brace * out * (W.braces === `in` ? -1 : 1) > 0 ? 0 : Math.PI, th = th0 + flip, zth = flip ? -1 : 1;
        const px = run.x0 + ux * t + out * zx * W.offset - zth * zx * e.zw * e.s, pz = run.z0 + uz * t + out * zz * W.offset - zth * zz * e.zw * e.s;
        place(e, px, pz, th, e.s * sx, e.s, e.s, 0, `palisade`);
      }
    }
    for (const pr of layout.props) if (pr.kind === `palisade`) skip.add(pr);
  }
  const plan = { items, skip, flames };
  ashlarPlans.set(layout.props, plan);
  return plan;
}
// surface area (m2) of a piece below maxY, summed per nav cell: the cells a piece visibly occupies (3D area, so thin posts and braces count as well as walls)
function ashlarKitFootprint(it, maxY, into) {
  const p = it.e.p, c = Math.cos(it.yaw), s = Math.sin(it.yaw), n = p.pos.length / 3, X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = p.pos[i * 3] * it.sx, z = p.pos[i * 3 + 2] * it.sz;
    X[i] = it.x + x * c + z * s, Y[i] = p.pos[i * 3 + 1] * it.sy, Z[i] = it.z - x * s + z * c;
  }
  for (let t = 0; t < p.idx.length; t += 3) {
    const a = p.idx[t], b = p.idx[t + 1], d = p.idx[t + 2];
    if (Math.min(Y[a], Y[b], Y[d]) > maxY) continue;
    const ux = X[b] - X[a], uy = Y[b] - Y[a], uz = Z[b] - Z[a], vx = X[d] - X[a], vy = Y[d] - Y[a], vz = Z[d] - Z[a];
    const area = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2;
    if (area < 1e-6) continue;
    const ext = Math.max(Math.hypot(ux, uz), Math.hypot(vx, vz), Math.hypot(X[d] - X[b], Z[d] - Z[b])), m = Math.max(1, Math.ceil(ext / 0.25)), w = area / ((m + 1) * (m + 2) / 2);
    for (let i = 0; i <= m; i++) for (let j = 0; j <= m - i; j++) {
      const q = 1 - (i + j) / m, u = i / m, v = j / m, k = Math.floor(X[a] * q + X[b] * u + X[d] * v) + `,` + Math.floor(Z[a] * q + Z[b] * u + Z[d] * v);
      into.set(k, (into.get(k) ?? 0) + w);
    }
  }
}
// nav while the kits are active (called at the end of the town generator; ?kits=off / ?ashlar=off keep the original numbers):
// bigger blocks for the props the kit pieces replace + every cell a piece visibly occupies (config.json "footprint")
function ashlarKitNav(layout) {
  if (!ashlarKits || !ashlarKits.cfg.themes.includes(`town`)) return;
  for (const pr of layout.props) {
    const kc = ashlarKits.kinds[pr.kind], op = Op[pr.kind];
    if (kc && kc.nav > op.block) layout.setWalkDisc(pr.x, pr.z, kc.nav * pr.scale, 0, op.los ? 1 : -1);
  }
  const F = ashlarKits.cfg.footprint;
  if (!F) return;
  const area = new Map();
  for (const it of ashlarKitPlan(layout).items) if (!F.skip?.includes(it.kind)) ashlarKitFootprint(it, F.maxY ?? 2, area);
  for (const [k, a] of area) {
    if (a < F.area) continue;
    const [x, z] = k.split(`,`).map(Number);
    layout.nav.inBounds(x, z) && (layout.nav.walk[z * layout.w + x] = 0);
  }
}
// pieces -> one merged BufferGeometry (position yaw about +Y, per-axis scale; normals by the inverse scale)
function ashlarKitMerge(items) {
  let nv = 0, ni = 0;
  for (const it of items) nv += it.e.p.pos.length / 3, ni += it.e.p.idx.length;
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const it of items) {
    const p = it.e.p, c = Math.cos(it.yaw), s = Math.sin(it.yaw), n = p.pos.length / 3;
    for (let i = 0; i < n; i++) {
      const x = p.pos[i * 3] * it.sx, y = p.pos[i * 3 + 1] * it.sy, z = p.pos[i * 3 + 2] * it.sz, o = (vo + i) * 3;
      pos[o] = it.x + x * c + z * s, pos[o + 1] = it.y + y, pos[o + 2] = it.z - x * s + z * c;
      let nx = p.nrm[i * 3] / it.sx, ny = p.nrm[i * 3 + 1] / it.sy, nz = p.nrm[i * 3 + 2] / it.sz;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l, ny /= l, nz /= l;
      nrm[o] = nx * c + nz * s, nrm[o + 1] = ny, nrm[o + 2] = -nx * s + nz * c;
    }
    uv.set(p.uv, vo * 2);
    for (let i = 0; i < p.idx.length; i++) idx[io + i] = p.idx[i] + vo;
    vo += n, io += p.idx.length;
  }
  const g = new Qi();
  g.setAttribute(`position`, new Li(pos, 3)), g.setAttribute(`normal`, new Li(nrm, 3)), g.setAttribute(`uv`, new Li(uv, 2)), g.setIndex(new Li(idx, 1)), g.computeBoundingSphere();
  return g;
}
/** Kit placement for one area layout -> { skip(prop), group, flames, instances, meshes, dispose() } or null */
function ashlarKitsBuild(layout) {
  const K = ashlarKits;
  if (!K.cfg.themes.includes(layout.theme)) return null;
  const { items, skip, flames: fl } = ashlarKitPlan(layout);
  // seat on the lowest ground under the footprint (the lab's kitGround)
  for (const it of items) {
    const hx = it.e.d[0] / 2 * it.sx, hz = it.e.d[2] / 2 * it.sz, c = Math.cos(it.yaw), s = Math.sin(it.yaw);
    let y = um(layout, it.x, it.z);
    for (const [a, b] of [[hx, 0], [-hx, 0], [0, hz], [0, -hz]]) y = Math.min(y, um(layout, it.x + a * c + b * s, it.z - a * s + b * c));
    it.y = y + it.yOff - 0.02;
  }
  const flames = fl.map((f) => ({ x: f.it.x + f.dx, y: f.it.y + f.dy, z: f.it.z + f.dz, size: f.size }));
  const cells = new Map();
  for (const it of items) {
    const key = `${it.e.key}|${Math.floor(it.x / pg)}|${Math.floor(it.z / pg)}`;
    (cells.get(key) ?? cells.set(key, []).get(key)).push(it);
  }
  const group = new Qr(), geoms = [];
  group.name = `ashlar-kits`;
  for (const list of cells.values()) {
    const g = ashlarKitMerge(list), mesh = new xa(g, K.mats[list[0].e.key]);
    mesh.castShadow = true, mesh.receiveShadow = true, mesh.name = `kit-${list[0].e.key}`;
    geoms.push(g), group.add(mesh);
  }
  ASHLAR_KITS.built = { instances: items.length, meshes: cells.size, flames: flames.length }; // for window.__ASHLAR_KITS
  return { skip: (pr) => skip.has(pr), group, flames, instances: items.length, meshes: cells.size, dispose() {
    for (const g of geoms) g.dispose();
  } };
}
function fg(e4) {
  let { w: t2, h: n2, theme: r2 } = e4, i2 = -dg, a2 = -dg, o2 = t2 + dg * 2, s2 = n2 + dg * 2, c2 = o2 + 1, l2 = s2 + 1, u2 = new Float32Array(c2 * l2 * 3), d2 = new Float32Array(c2 * l2 * 3), f2 = t2 + 1, p2 = r2 === `cave`;
  for (let r3 = 0; r3 < l2; r3 += 1) for (let o3 = 0; o3 < c2; o3 += 1) {
    let s3 = i2 + o3, l3 = a2 + r3, m3 = Math.max(0, Math.min(t2, s3)), h3 = Math.max(0, Math.min(n2, l3)), g3 = e4.height[h3 * f2 + m3], _3 = e4.ao[h3 * f2 + m3], v3 = s3 < 0 || l3 < 0 || s3 > t2 || l3 > n2;
    if (v3) {
      let e5 = Math.max(-s3, -l3, s3 - t2, l3 - n2, 0);
      g3 += e5 * 0.12 + (Fd(s3 * 0.08, l3 * 0.08, 3, 99) - 0.5) * 1.5 * Math.min(1, e5 / 6), _3 *= Math.max(0.35, 1 - e5 / 30);
    }
    if (p2) {
      let r4 = Math.floor(Math.min(t2 - 1, Math.max(0, s3))), i3 = Math.floor(Math.min(n2 - 1, Math.max(0, l3))), a3 = false;
      for (let o4 = -1; o4 <= 0 && !a3; o4 += 1) for (let c3 = -1; c3 <= 0; c3 += 1) {
        let u3 = r4 + c3 + (s3 > 0 ? 0 : 1), d3 = i3 + o4 + (l3 > 0 ? 0 : 1);
        if (u3 < 0 || d3 < 0 || u3 >= t2 || d3 >= n2) continue;
        let f3 = d3 * t2 + u3;
        if (e4.nav.walk[f3] || e4.wallHeight && e4.wallHeight[f3] > 0) {
          a3 = true;
          break;
        }
      }
      (!a3 || v3) && (_3 = 0);
    }
    let y3 = (r3 * c2 + o3) * 3;
    u2[y3] = s3, u2[y3 + 1] = g3, u2[y3 + 2] = l3, d2[y3] = _3, d2[y3 + 1] = _3, d2[y3 + 2] = _3;
  }
  let m2 = new Uint32Array(o2 * s2 * 6), h2 = 0;
  for (let e5 = 0; e5 < s2; e5 += 1) for (let t3 = 0; t3 < o2; t3 += 1) {
    let n3 = e5 * c2 + t3, r3 = n3 + 1, i3 = n3 + c2, a3 = i3 + 1;
    (t3 + e5) % 2 == 0 ? (m2[h2++] = n3, m2[h2++] = i3, m2[h2++] = r3, m2[h2++] = r3, m2[h2++] = i3, m2[h2++] = a3) : (m2[h2++] = n3, m2[h2++] = i3, m2[h2++] = a3, m2[h2++] = n3, m2[h2++] = a3, m2[h2++] = r3);
  }
  let g2 = new Qi();
  g2.setAttribute(`position`, new Li(u2, 3)), g2.setAttribute(`color`, new Li(d2, 3)), g2.setIndex(new Li(m2, 1)), g2.computeVertexNormals(), g2.computeBoundingSphere();
  let _2 = new Na(e4.splat, t2, n2, Vt, Et);
  _2.magFilter = Ct, _2.minFilter = Ct, _2.wrapS = vt, _2.wrapT = vt, _2.needsUpdate = true;
  let v2 = lg[r2].map((e5) => Zh(e5, 512)), y2 = ug[r2], ash = ashlarSurface && r2 !== `cave`, b2 = new Yo({ color: 16777215, vertexColors: true, roughness: 1, metalness: 0 }), x2 = { uSplat: { value: _2 }, uSize: { value: new M(t2, n2) }, uScale: { value: new yr(1 / y2[0], 1 / y2[1], 1 / y2[2], 1 / y2[3]) }, tA0: { value: v2[0].albedo }, tA1: { value: v2[1].albedo }, tA2: { value: v2[2].albedo }, tA3: { value: v2[3].albedo }, tN0: { value: v2[0].normal }, tN1: { value: v2[1].normal }, tN2: { value: v2[2].normal }, tN3: { value: v2[3].normal }, uWet: { value: 0 }, uTime: { value: 0 }, uNormalStrength: { value: r2 === `cave` ? 1.1 : 0.9 } };
  ash && (x2.uASpec = { value: ashlarSurface.specular }, x2.uARough = { value: ashlarSurface.roughnessMin }, x2.uAGain = { value: typeof ashlarSurface.albedoGain === `object` ? ashlarSurface.albedoGain[r2] ?? ashlarSurface.albedoGain.default ?? 1 : ashlarSurface.albedoGain }); // [ASHLAR] matte ground (+ diffuse gain): only present (and only compiled in) when the ASHLAR ground is installed
  b2.onBeforeCompile = (e5) => {
    Object.assign(e5.uniforms, x2), e5.fragmentShader = e5.fragmentShader.replace(`#include <opaque_fragment>`, `${ash ? `// [ASHLAR] ground reads matte (rain included): scale the specular (direct + environment); only puddles keep full gloss
      outgoingLight -= totalSpecular * (1.0 - mix(uASpec, 1.0, puddle));
      ` : ``}outgoingLight *= mix(0.22, 1.0, smoothstep(0.0, 0.06, vColor.r));
      #include <opaque_fragment>`), e5.vertexShader = e5.vertexShader.replace(`#include <common>`, `#include <common>
varying vec3 vTWPos;
varying vec3 vTWNrm;`).replace(`#include <worldpos_vertex>`, `#include <worldpos_vertex>
         vTWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vTWNrm = normalize(mat3(modelMatrix) * objectNormal);`), e5.fragmentShader = e5.fragmentShader.replace(`#include <common>`, `#include <common>
        uniform sampler2D uSplat, tA0, tA1, tA2, tA3, tN0, tN1, tN2, tN3;
        uniform vec2 uSize;
        uniform vec4 uScale;
        uniform float uWet, uTime, uNormalStrength;${ash ? `
        uniform float uASpec, uARough, uAGain;` : ``}
        varying vec3 vTWPos;
        varying vec3 vTWNrm;
        float tHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float tNoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(tHash(i), tHash(i+vec2(1,0)), f.x), mix(tHash(i+vec2(0,1)), tHash(i+vec2(1,1)), f.x), f.y); }`).replace(`#include <map_fragment>`, `#include <map_fragment>
        vec2 wxz = vTWPos.xz;
        // break up the splat grid with low-frequency warping
        vec2 warp = vec2(tNoise(wxz * 0.35), tNoise(wxz * 0.35 + 17.3)) - 0.5;
        vec4 sw = texture2D(uSplat, (wxz + warp * 0.9) / uSize);
        // per-layer anti-tiling: rotate/offset second sample and blend by noise
        float tileMix = tNoise(wxz * 0.06);
        vec2 uv0 = wxz * uScale.x; vec2 uv1 = wxz * uScale.y; vec2 uv2 = wxz * uScale.z; vec2 uv3 = wxz * uScale.w;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        vec4 a0 = mix(texture2D(tA0, uv0), texture2D(tA0, rot * uv0 * 0.73 + 0.31), tileMix);
        vec4 a1 = texture2D(tA1, uv1); vec4 a2 = texture2D(tA2, uv2); vec4 a3 = texture2D(tA3, uv3);
        vec4 n0 = mix(texture2D(tN0, uv0), texture2D(tN0, rot * uv0 * 0.73 + 0.31), tileMix);
        vec4 n1 = texture2D(tN1, uv1); vec4 n2 = texture2D(tN2, uv2); vec4 n3 = texture2D(tN3, uv3);
        vec4 hgt = vec4(n0.a, n1.a, n2.a, n3.a);
        vec4 bw = sw * (hgt + 0.5);
        float mx = max(max(bw.x, bw.y), max(bw.z, bw.w));
        bw = max(bw - mx + 0.22, 0.0);
        bw /= (bw.x + bw.y + bw.z + bw.w + 1e-5);
        vec4 alb = a0 * bw.x + a1 * bw.y + a2 * bw.z + a3 * bw.w;
        vec3 tn = (n0.xyz * bw.x + n1.xyz * bw.y + n2.xyz * bw.z + n3.xyz * bw.w) * 2.0 - 1.0;
        float th = dot(hgt, bw);
        // macro variation: large soft patches of tone
        float macro = tNoise(wxz * 0.045) * 0.5 + tNoise(wxz * 0.11) * 0.5;
        alb.rgb *= mix(0.78, 1.12, macro);
        // rain: low spots darken and become glossy puddles
        // (the mask follows low-frequency hollows, not texel height, so puddles are pools
        // with calm surfaces instead of glitter)
        float pm = tNoise(wxz * 0.19);
        float puddle = smoothstep(0.5, 0.26, th * 0.4 + pm * 0.6) * uWet;
        float wetAll = uWet * 0.55;
        alb.rgb *= mix(1.0, 0.62, max(wetAll, puddle));
        float tRough = mix(alb.a, 0.32, puddle);
        tRough = mix(tRough, tRough * 0.7, wetAll);${ash ? `
        tRough = max(tRough, uARough * (1.0 - puddle)); // [ASHLAR] roughness floor outside puddles` : ``}
        diffuseColor.rgb *= alb.rgb${ash ? ` * uAGain` : ``};`).replace(`#include <roughnessmap_fragment>`, `float roughnessFactor = clamp(tRough, 0.05, 1.0);`).replace(`#include <normal_fragment_maps>`, `{
          vec3 gN = normalize(vTWNrm);
          float flat2 = 1.0 - puddle;
          vec3 wN = normalize(gN + vec3(tn.x, 0.0, tn.y) * uNormalStrength * flat2);
          normal = normalize((viewMatrix * vec4(wN, 0.0)).xyz);
        }`);
  }, b2.customProgramCacheKey = () => `terrain-v5-${r2}${ash ? `-ashlar3` : ``}`;
  let S2 = new xa(g2, b2);
  return S2.receiveShadow = true, S2.castShadow = false, S2.name = `terrain`, S2.frustumCulled = false, { mesh: S2, material: b2, setWetness(e5) {
    x2.uWet.value = e5;
  }, update(e5) {
    x2.uTime.value = e5;
  }, dispose() {
    g2.dispose(), b2.dispose(), _2.dispose();
  } };
}
Ed(), dm();
var pg = 24;
function mg(e4, t2, n2, r2) {
  let i2 = new Qr();
  i2.name = `area-${e4.areaId}`;
  let a2 = fg(e4);
  i2.add(a2.mesh);
  let o2 = null, s2 = e4.theme;
  // [ASHLAR] grass cards instead of blade clumps for non-cave themes when loaded (ashlarCards)
  (s2 !== `cave` || e4.grass.some((e5) => e5 > 0)) && (o2 = (ashlarCards && s2 !== `cave` ? ashlarGrassCards : Hh)(e4, r2, s2 === `fields` ? { base: `#5a5530`, tip: `#9a8d55` } : s2 === `cave` ? { base: `#1f3a2c`, tip: `#2f8a6a` } : s2 === `town` ? { base: `#3e4a28`, tip: `#6f7a40` } : { base: `#3a4826`, tip: `#76803f` }, s2 === `cave` ? 0.6 : 1), i2.add(o2.group));
  let c2 = null;
  e4.water.length && (c2 = Wh(e4), i2.add(c2.group));
  let l2 = t2.material(), u2 = /* @__PURE__ */ new Map(), d2 = new ir(), f2 = new N(), p2 = new N();
  let kit = ashlarKits ? ashlarKitsBuild(e4) : null; // [ASHLAR] kit pieces replace the props they cover (kit.skip)
  for (let t3 of e4.props) {
    if (kit?.skip(t3)) continue;
    let n3 = Math.floor(t3.x / pg), r3 = Math.floor(t3.z / pg), i3 = `${t3.kind}|${t3.variant}|${n3}|${r3}`, a3 = u2.get(i3);
    a3 || (a3 = { kind: t3.kind, variant: t3.variant, cx: n3, cz: r3, m: [] }, u2.set(i3, a3)), d2.setFromAxisAngle(hg, t3.rot), f2.setScalar(t3.scale), p2.set(t3.x, (t3.y ?? 0) + um(e4, t3.x, t3.z) - 0.03, t3.z), a3.m.push(new wr().compose(p2, d2, f2));
  }
  let m2 = 0, h2 = 0, g2 = t2.depthMaterial?.() ?? null, _2 = [], v2 = [], y2 = new N();
  for (let e5 of u2.values()) {
    let n3 = t2.geometry(e5.kind, e5.variant), r3 = new Ga(n3, l2, e5.m.length);
    e5.m.forEach((e6, t3) => r3.setMatrixAt(t3, e6)), r3.instanceMatrix.needsUpdate = true, r3.computeBoundingSphere(), r3.castShadow = t2.castsShadow(e5.kind), r3.receiveShadow = true, r3.castShadow && g2 && (r3.customDepthMaterial = g2), r3.name = `prop-${e5.kind}`, i2.add(r3), m2 += e5.m.length, h2 += 1;
    let a3 = t2.fireAnchors?.(e5.kind, e5.variant) ?? [], o3 = t2.glowAnchors?.(e5.kind, e5.variant) ?? [];
    for (let t3 of e5.m) {
      for (let e6 of a3) y2.copy(e6).applyMatrix4(t3), _2.push({ x: y2.x, y: y2.y, z: y2.z, size: 0.55 });
      for (let e6 of o3) v2.push(e6.clone().applyMatrix4(t3));
    }
  }
  kit && (i2.add(kit.group), m2 += kit.instances, h2 += kit.meshes, _2.push(...kit.flames)); // [ASHLAR]
  let b2 = e4.wallHeight ? t2.caveWalls(e4) : [];
  for (let e5 of b2) i2.add(e5);
  let x2 = [];
  for (let e5 of v2) x2.push(n2.addEmitter({ x: e5.x, y: e5.y + 0.3, z: e5.z, color: new P(`#5fd0c0`), intensity: 2.2, distance: 5, flicker: 3, priority: 0.6 }));
  for (let t3 of e4.lights) x2.push(n2.addEmitter({ x: t3.x, y: t3.y + um(e4, t3.x, t3.z), z: t3.z, color: new P(t3.color), intensity: t3.intensity, distance: t3.distance, flicker: t3.flicker, priority: t3.priority }));
  return { group: i2, terrain: a2, grass: o2, water: c2, emitters: x2, walls: b2, flames: _2, stats: { propInstances: m2, propMeshes: h2 }, update(e5, n3, r3, i3) {
    a2.update(e5), a2.setWetness(r3), o2?.update(e5, n3), c2?.update(e5, r3), t2.update(e5), i3 && b2.length && t2.setHero?.(n3, i3);
  }, dispose() {
    a2.dispose(), o2?.dispose(), c2?.dispose(), kit?.dispose();
    for (let e5 of x2) n2.removeEmitter(e5);
    for (let e5 of i2.children) e5.isInstancedMesh && e5.dispose();
    for (let e5 of b2) e5.geometry.dispose();
  } };
}

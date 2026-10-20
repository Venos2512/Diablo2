// One MeshStandardMaterial per sample; onBeforeCompile swaps in a <=4 layer height-blended albedo + tangent normal.
// Layer UVs come from the patch-centred xz in metres (u = x / tile, v = -z / tile), identical for every layer. The mesh uv keeps the
// PlaneGeometry orientation (u -> +x, v -> -z) so three's getTangentFrame(vNormalMapUv) is valid.
// Masks are evaluated in METRES in a patch-centred frame (vLP = world xz - mesh origin), so a bigger mesh shows a bigger
// window of the same field. Anti-tiling = the lab's labTerrainSample (Inigo Quilez, "texture repetition" technique 3).
import * as THREE from 'three';

export const ROLE = { base: 0, patch: 1, path: 2, low: 3, cell: 4 };
const DEBUG_COLORS = ['vec3(0.95,0.15,0.15)', 'vec3(0.15,0.85,0.2)', 'vec3(0.2,0.45,1.0)', 'vec3(1.0,0.85,0.1)'];

// Uniforms shared by every sample material (anti-tiling A/B toggle, variation scale in areas per metre, macro brightness).
export const GLOBALS = { uAT: { value: 1 }, uVarScale: { value: 0.15 }, uMacro: { value: 0.1 } };

const NOISE = /* glsl */`
float bmHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bmNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(bmHash(i), bmHash(i + vec2(1.0, 0.0)), f.x), mix(bmHash(i + vec2(0.0, 1.0)), bmHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float bmFbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int k = 0; k < 4; k++) { s += a * bmNoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s / 0.9375;
}
float bmContrast(float n) { return clamp((n - 0.5) * 2.1 + 0.5, 0.0, 1.0); }
vec2 bmRot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

// role: 0 base, 1 patch, 2 path, 3 low, 4 cell. P = (coverage, width m, soft, seed). lp = patch-centred xz in metres,
// lpw = warped. Spatial widths (path width/soft, cell soft, warp) are metres; patch/low soft is in noise-threshold units.
float bmLayerW(int role, int idx, vec4 P, vec2 lp, vec2 lpw, float noiseF) {
  float seed = P.w;
  if (role == 0) return 1.0;
  if (role == 1) {
    float n = bmContrast(bmFbm(lpw * noiseF + seed));
    float t = 0.5 + (0.5 - P.x) * 0.55;
    return smoothstep(t - P.z, t + P.z, n);
  }
  if (role == 2) {
    float ang = (bmHash(vec2(seed, 1.3)) - 0.5) * 1.2;
    vec2 r = bmRot(lp, ang);
    float c = 1.56 * sin(r.x * 0.433 + seed) + 0.6 * sin(r.x * 0.94 + seed * 2.1);
    float d = abs(r.y - c) + (bmFbm(lp * 0.75 + seed) - 0.5) * 1.3;
    return 1.0 - smoothstep(P.y * 0.5 - P.z, P.y * 0.5 + P.z, d);
  }
  if (role == 3) {
    float n = bmContrast(bmFbm(lpw * noiseF * 0.65 + seed));
    float t = 0.5 - (0.5 - P.x) * 0.55;
    return 1.0 - smoothstep(t - P.z, t + P.z, n);
  }
  vec2 pts[4];
  pts[0] = vec2(-3.6, -1.2); pts[1] = vec2(1.7, -3.8); pts[2] = vec2(-1.4, 3.6); pts[3] = vec2(3.7, 1.9);
  vec2 q = lp + (lpw - lp) * 2.2; // cell borders get a stronger warp than the patch/low masks
  float d[4]; float dmin = 99.0;
  for (int k = 0; k < 4; k++) { d[k] = distance(q, pts[k]); dmin = min(dmin, d[k]); }
  return 1.0 - smoothstep(0.0, P.z, d[idx] - dmin);
}

// ---- anti-tiling (lab: labTerrainTurn / labTerrainSample). vr = offset amount, rt = 1 enables quarter turns.
vec2 bmTurn(vec2 v, float q) {
  float c = cos(q * 1.5707963), s = sin(q * 1.5707963);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}
// One layer: albedo+height (alpha) and tangent normal (xyz, -1..1), both through the SAME uv transform; the normal xy is
// turned back by -q. Gradients turn with the uv (textureGrad) so the jumps cause no mip seams.
void bmLayerTex(sampler2D AH, sampler2D NM, vec2 uv, float k, float vr, float rt, out vec4 ah, out vec3 nt) {
  vec2 dx = dFdx(uv), dy = dFdy(uv);
  if (vr < 0.001 && rt < 0.5) {
    ah = textureGrad(AH, uv, dx, dy);
    nt = textureGrad(NM, uv, dx, dy).xyz * 2.0 - 1.0;
    return;
  }
  float l = k * 8.0, ia = floor(l), f = l - ia;
  vec2 offA = sin(vec2(3.0, 7.0) * ia) * vr, offB = sin(vec2(3.0, 7.0) * (ia + 1.0)) * vr;
  float qA = mod(ia * 3.0, 4.0) * rt, qB = mod((ia + 1.0) * 3.0, 4.0) * rt;
  vec2 uvA = bmTurn(uv, qA) + offA, uvB = bmTurn(uv, qB) + offB;
  vec2 dxA = bmTurn(dx, qA), dyA = bmTurn(dy, qA), dxB = bmTurn(dx, qB), dyB = bmTurn(dy, qB);
  vec4 aA = textureGrad(AH, uvA, dxA, dyA), aB = textureGrad(AH, uvB, dxB, dyB);
  float w = smoothstep(0.2, 0.8, f - 0.1 * dot(aA.rgb - aB.rgb, vec3(1.0)));
  vec3 nA = textureGrad(NM, uvA, dxA, dyA).xyz * 2.0 - 1.0, nB = textureGrad(NM, uvB, dxB, dyB).xyz * 2.0 - 1.0;
  nA.xy = bmTurn(nA.xy, -qA); nB.xy = bmTurn(nB.xy, -qB);
  ah = mix(aA, aB, w);
  nt = mix(nA, nB, w);
}
`;

export function createTerrainMaterial(sample, ph) {
  const n = sample.layers.length;
  const pad = (arr, v) => { while (arr.length < 4) arr.push(v); return arr; };
  const u = {
    uTile: { value: pad(sample.layers.map((l) => l.tile), 5) },
    uNS: { value: pad(sample.layers.map((l) => l.ns), 1) },
    uVis: { value: pad(sample.layers.map((l) => (l.visible ? 1 : 0)), 0) },
    uHB: { value: pad(sample.layers.map((l) => l.hBias), 0) },
    uVar: { value: pad(sample.layers.map((l) => l.variation), 0) },
    uRot: { value: pad(sample.layers.map((l) => (l.rotate ? 1 : 0)), 0) },
    uP: { value: pad(sample.layers.map((l, i) => new THREE.Vector4(l.coverage, l.width, l.soft, sample.seed + i * 7.31)), new THREE.Vector4(0, 0, 0.1, 0)) },
    uDepth: { value: sample.depth }, uOver: { value: sample.over }, uHI: { value: sample.hi }, uNoise: { value: sample.noise }, uWarp: { value: sample.warp },
    uNormalsOn: { value: 1 }, uDebug: { value: 0 }, uUnlit: { value: 0 },
    ...GLOBALS,
  };
  for (let i = 0; i < 4; i++) {
    u[`uAH${i}`] = { value: ph.ah };
    u[`uN${i}`] = { value: ph.n };
  }

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 });
  mat.normalMap = ph.n; // only enables USE_NORMALMAP_TANGENTSPACE + vNormalMapUv; the blended map is sampled in the override
  mat.userData.uniforms = u;
  mat.customProgramCacheKey = () => `bmix2-${n}-${sample.layers.map((l) => ROLE[l.role]).join('')}`;

  const ids = Array.from({ length: n }, (_, i) => i);
  const samplerDecl = ids.map((i) => `uniform sampler2D uAH${i}; uniform sampler2D uN${i};`).join('\n');
  const layerCode = (i) => `
    vec2 uv${i} = stW / uTile[${i}];
    float k${i} = clamp((bmNoise(stW * uVarScale + uP[${i}].w * 13.7) * 0.6 + bmNoise(stW * uVarScale * 2.3 + uP[${i}].w * 5.1 + 7.0) * 0.4 - 0.5) * 2.2 + 0.5, 0.0, 0.999);
    vec4 ah${i}; vec3 nt${i};
    bmLayerTex(uAH${i}, uN${i}, uv${i}, k${i}, uVar[${i}] * uAT, uRot[${i}] * uAT, ah${i}, nt${i});
    float r${i} = bmLayerW(${ROLE[sample.layers[i].role]}, ${i}, uP[${i}], vLP, lpw, uNoise) * uVis[${i}];`;
  // a layer is suppressed where a layer above it has weight, so the top layer keeps its core; the height blend decides at the
  // edges. The height term fades in with the weight (no hard clip at small w); w = 0 never shows.
  const scoreCode = (i) => {
    const above = ids.filter((j) => j > i).map((j) => `r${j}`).reduce((a, b) => `max(${a}, ${b})`, '0.0');
    return `float w${i} = r${i} * (1.0 - uOver * ${above});
      float s${i} = w${i} > 0.0 ? w${i} + ((ah${i}.a + uHB[${i}]) * uHI + ${(0.04 * i).toFixed(2)}) * smoothstep(0.0, 0.1, w${i}) : -9.0;`;
  };
  const maxScore = ids.map((i) => `s${i}`).reduce((a, b) => `max(${a}, ${b})`);
  const maxW = ids.map((i) => `w${i}`).reduce((a, b) => `max(${a}, ${b})`);

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec2 vLP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvLP = vWPos.xz - modelMatrix[3].xz;');
    const mapFrag = `
      vec2 stW = vec2(vLP.x, -vLP.y); // texture frame = patch-centred metres (u = x, v = -z), so overview = centre crop of focus
      vec2 lpw = vLP + (vec2(bmFbm(vLP * uNoise * 0.7 + 3.1), bmFbm(vLP * uNoise * 0.7 + 9.7)) - 0.5) * uWarp;
      ${ids.map(layerCode).join('')}
      ${ids.map(scoreCode).join('\n')}
      float bmM = ${maxScore} - uDepth;
      ${ids.map((i) => `float bw${i} = s${i} > -5.0 ? max(s${i} - bmM, 0.0) : 0.0;`).join('\n')}
      float bwSum = ${ids.map((i) => `bw${i}`).join(' + ')};
      ${ids.map((i) => `bw${i} = bwSum > 1e-5 ? bw${i} / bwSum : 0.0;`).join('\n')}
      float bmCover = smoothstep(0.0, 0.15, clamp(${maxW}, 0.0, 1.0)); // where no visible layer has weight: neutral ground, soft edge
      float bmMacro = 1.0 + uMacro * (bmFbm(stW * 0.06 + 11.0) * 2.0 - 1.0);
      vec3 bmAlbedo = mix(vec3(0.05), (${ids.map((i) => `ah${i}.rgb * bw${i}`).join(' + ')}) * bmMacro, bmCover);
      if (uDebug > 0.5) bmAlbedo = ${ids.map((i) => `${DEBUG_COLORS[i]} * bw${i}`).join(' + ')};
      diffuseColor.rgb *= bmAlbedo;`;
    const normFrag = `
      vec3 bmN = vec3(0.0);
      ${ids.map((i) => `{ vec3 t = nt${i}; t.xy *= uNS[${i}]; bmN += t * bw${i}; }`).join('\n')}
      bmN = mix(vec3(0.0, 0.0, 1.0), bmN, bmCover);
      vec3 mapN = (uNormalsOn > 0.5 && uDebug < 0.5 && dot(bmN, bmN) > 1e-6) ? normalize(bmN) : vec3(0.0, 0.0, 1.0);
      normal = normalize(tbn * mapN);`;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWPos;\nvarying vec2 vLP;
        uniform float uTile[4]; uniform float uNS[4]; uniform float uVis[4]; uniform float uHB[4]; uniform float uVar[4]; uniform float uRot[4]; uniform vec4 uP[4];
        uniform float uDepth, uOver, uHI, uNoise, uWarp, uNormalsOn, uDebug, uUnlit, uAT, uVarScale, uMacro;
        ${samplerDecl}\n${NOISE}`)
      .replace('#include <map_fragment>', mapFrag)
      .replace('#include <normal_fragment_maps>', normFrag)
      .replace('#include <opaque_fragment>', 'if (uUnlit > 0.5 || uDebug > 0.5) outgoingLight = diffuseColor.rgb;\n#include <opaque_fragment>')
      .replace('#include <tonemapping_fragment>', 'if (uUnlit < 0.5 && uDebug < 0.5) {\n#include <tonemapping_fragment>\n}')
      .replace('#include <fog_fragment>', 'if (uUnlit < 0.5 && uDebug < 0.5) {\n#include <fog_fragment>\n}');
  };
  return mat;
}

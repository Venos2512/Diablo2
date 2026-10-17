// Quadric-error mesh decimation (Garland & Heckbert) with half-edge collapses, so per-vertex attributes (colors,
// skin weights, materials) are kept exactly. Attribute-aware: collapsing across color / material / skinning
// boundaries costs extra, which preserves eyes, trims and joint regions. Manifold (link-condition) and
// fold-over checks keep the result clean. Input: indexed BufferGeometry; returns a new compacted geometry.
// Hot paths use typed arrays only (no per-edge allocations).
import * as THREE from 'three';

// o: { colorW, matW, skinW } penalty weights (squared differences, in m^2 equivalent)
export function decimate(geo, targetTris, o = {}) {
  const posA = geo.attributes.position.array, V = posA.length / 3;
  const idx = geo.index.array, T0 = idx.length / 3;
  if (T0 <= targetTris) return geo;
  const P = Float64Array.from(posA);
  const F = Int32Array.from(idx);
  const fAlive = new Uint8Array(T0).fill(1);
  const vAlive = new Uint8Array(V).fill(1);
  const ver = new Int32Array(V);
  // vertex -> faces adjacency as growable typed lists
  const deg = new Int32Array(V);
  for (let i = 0; i < F.length; i++) deg[F[i]]++;
  const vfCap = new Int32Array(V), vfOff = new Int32Array(V);
  let pool = 0;
  for (let i = 0; i < V; i++) { vfOff[i] = pool; vfCap[i] = deg[i] + 4; pool += vfCap[i]; }
  let VF = new Int32Array(pool + 1024);
  const vfLen = new Int32Array(V);
  const vfPush = (v, f) => {
    if (vfLen[v] >= vfCap[v]) { // relocate list to the end of the pool with double capacity
      const cap = vfCap[v] * 2; if (pool + cap > VF.length) { const n = new Int32Array(Math.max(VF.length * 2, pool + cap + 1024)); n.set(VF); VF = n; }
      VF.copyWithin(pool, vfOff[v], vfOff[v] + vfLen[v]); vfOff[v] = pool; vfCap[v] = cap; pool += cap;
    }
    VF[vfOff[v] + vfLen[v]++] = f;
  };
  const vfRemove = (v, f) => { const o0 = vfOff[v], n = vfLen[v]; for (let i = 0; i < n; i++) if (VF[o0 + i] === f) { VF[o0 + i] = VF[o0 + n - 1]; vfLen[v]--; return; } };
  for (let f = 0; f < T0; f++) for (let k = 0; k < 3; k++) vfPush(F[f * 3 + k], f);
  const col = geo.attributes.color?.array, mat = geo.attributes.aMat?.array, skI = geo.attributes.skinIndex?.array, skW = geo.attributes.skinWeight?.array;
  const colorW = o.colorW ?? 3e-5, matW = o.matW ?? 6e-4, skinW = o.skinW ?? 1.5e-5;
  // quadrics (area weighted)
  const Q = new Float64Array(V * 10);
  const nrm = new Float64Array(3);
  const faceN = (f, out) => {
    const a = F[f * 3], b = F[f * 3 + 1], c = F[f * 3 + 2];
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
    const e1x = P[b * 3] - ax, e1y = P[b * 3 + 1] - ay, e1z = P[b * 3 + 2] - az, e2x = P[c * 3] - ax, e2y = P[c * 3 + 1] - ay, e2z = P[c * 3 + 2] - az;
    out[0] = e1y * e2z - e1z * e2y; out[1] = e1z * e2x - e1x * e2z; out[2] = e1x * e2y - e1y * e2x;
  };
  for (let f = 0; f < T0; f++) {
    faceN(f, nrm); const l = Math.hypot(nrm[0], nrm[1], nrm[2]); if (l < 1e-14) continue;
    const a = nrm[0] / l, b = nrm[1] / l, c = nrm[2] / l, v0 = F[f * 3];
    const d = -(a * P[v0 * 3] + b * P[v0 * 3 + 1] + c * P[v0 * 3 + 2]);
    const w = l * 0.5;
    for (let k = 0; k < 3; k++) {
      const q = F[f * 3 + k] * 10;
      Q[q] += a * a * w; Q[q + 1] += a * b * w; Q[q + 2] += a * c * w; Q[q + 3] += a * d * w; Q[q + 4] += b * b * w;
      Q[q + 5] += b * c * w; Q[q + 6] += b * d * w; Q[q + 7] += c * c * w; Q[q + 8] += c * d * w; Q[q + 9] += d * d * w;
    }
  }
  const qErr = (qa, qb, x, y, z) => {
    const q0 = Q[qa] + Q[qb], q1 = Q[qa + 1] + Q[qb + 1], q2 = Q[qa + 2] + Q[qb + 2], q3 = Q[qa + 3] + Q[qb + 3], q4 = Q[qa + 4] + Q[qb + 4];
    const q5 = Q[qa + 5] + Q[qb + 5], q6 = Q[qa + 6] + Q[qb + 6], q7 = Q[qa + 7] + Q[qb + 7], q8 = Q[qa + 8] + Q[qb + 8], q9 = Q[qa + 9] + Q[qb + 9];
    return q0 * x * x + 2 * q1 * x * y + 2 * q2 * x * z + 2 * q3 * x + q4 * y * y + 2 * q5 * y * z + 2 * q6 * y + q7 * z * z + 2 * q8 * z + q9;
  };
  const attrPenalty = (u, v) => {
    let p = 0;
    if (col) { const dr = col[u * 3] - col[v * 3], dg = col[u * 3 + 1] - col[v * 3 + 1], db = col[u * 3 + 2] - col[v * 3 + 2]; p += (dr * dr + dg * dg + db * db) * colorW; }
    if (mat) { const dr = mat[u * 3] - mat[v * 3], dm = mat[u * 3 + 1] - mat[v * 3 + 1], de = mat[u * 3 + 2] - mat[v * 3 + 2]; p += (dr * dr * 0.2 + dm * dm + de * de) * matW; }
    if (skI) {
      let s = 0;
      for (let i = 0; i < 4; i++) { const bu = skI[u * 4 + i], wu = skW[u * 4 + i]; if (!wu) continue; let wv = 0; for (let j = 0; j < 4; j++) if (skI[v * 4 + j] === bu) wv = skW[v * 4 + j]; s += Math.abs(wu - wv); }
      for (let j = 0; j < 4; j++) { const bv = skI[v * 4 + j], wv = skW[v * 4 + j]; if (!wv) continue; let found = false; for (let i = 0; i < 4; i++) if (skI[u * 4 + i] === bv && skW[u * 4 + i] > 0) { found = true; break; } if (!found) s += wv; }
      p += s * s * skinW;
    }
    return p;
  };
  // binary heap on typed arrays
  let cap = 1 << 16, hn = 0;
  let hC = new Float64Array(cap), hU = new Int32Array(cap), hV = new Int32Array(cap), hA = new Int32Array(cap), hB = new Int32Array(cap);
  const hpush = (cost, u, v) => {
    if (hn >= cap) { cap *= 2; const g = (A, T) => { const n = new T(cap); n.set(A); return n; }; hC = g(hC, Float64Array); hU = g(hU, Int32Array); hV = g(hV, Int32Array); hA = g(hA, Int32Array); hB = g(hB, Int32Array); }
    let i = hn++; const a = ver[u], b = ver[v];
    while (i > 0) { const p = (i - 1) >> 1; if (hC[p] <= cost) break; hC[i] = hC[p]; hU[i] = hU[p]; hV[i] = hV[p]; hA[i] = hA[p]; hB[i] = hB[p]; i = p; }
    hC[i] = cost; hU[i] = u; hV[i] = v; hA[i] = a; hB[i] = b;
  };
  let pu = 0, pv = 0, pa = 0, pb = 0;
  const hpop = () => {
    pu = hU[0]; pv = hV[0]; pa = hA[0]; pb = hB[0];
    hn--; if (hn === 0) return;
    const lc = hC[hn], lu = hU[hn], lv = hV[hn], la = hA[hn], lb = hB[hn];
    let i = 0;
    for (;;) { let l = i * 2 + 1; if (l >= hn) break; const r = l + 1; if (r < hn && hC[r] < hC[l]) l = r; if (hC[l] >= lc) break; hC[i] = hC[l]; hU[i] = hU[l]; hV[i] = hV[l]; hA[i] = hA[l]; hB[i] = hB[l]; i = l; }
    hC[i] = lc; hU[i] = lu; hV[i] = lv; hA[i] = la; hB[i] = lb;
  };
  const pushEdge = (a, b) => {
    const dx = P[a * 3] - P[b * 3], dy = P[a * 3 + 1] - P[b * 3 + 1], dz = P[a * 3 + 2] - P[b * 3 + 2], l2 = dx * dx + dy * dy + dz * dz;
    const pen = attrPenalty(a, b) * (1 + l2 * 2000) + l2 * 1e-4;
    const eab = qErr(a * 10, b * 10, P[b * 3], P[b * 3 + 1], P[b * 3 + 2]); // a -> b
    const eba = qErr(a * 10, b * 10, P[a * 3], P[a * 3 + 1], P[a * 3 + 2]); // b -> a
    if (eab <= eba) hpush(Math.max(0, eab) + pen, a, b); else hpush(Math.max(0, eba) + pen, b, a);
  };
  // stamps for neighbor sets
  const stampA = new Int32Array(V), stampB = new Int32Array(V); let stamp = 0;
  const nbuf = new Int32Array(256); let nlen = 0;
  const collectNeighbors = (u, st, mark) => { // marks neighbors of u with st in mark[]; fills nbuf
    nlen = 0; const o0 = vfOff[u], n = vfLen[u];
    for (let i = 0; i < n; i++) { const f = VF[o0 + i]; for (let k = 0; k < 3; k++) { const w = F[f * 3 + k]; if (w !== u && mark[w] !== st) { mark[w] = st; if (nlen < 256) nbuf[nlen++] = w; } } }
  };
  // initial edges (each once: from the lower vertex)
  for (let v = 0; v < V; v++) { stamp++; collectNeighbors(v, stamp, stampA); for (let i = 0; i < nlen; i++) if (nbuf[i] > v) pushEdge(v, nbuf[i]); }
  let T = T0;
  const n0 = new Float64Array(3), n1 = new Float64Array(3);
  while (T > targetTris && hn > 0) {
    hpop();
    const u = pu, v = pv;
    if (!vAlive[u] || !vAlive[v] || ver[u] !== pa || ver[v] !== pb) continue;
    // shared faces must be exactly 2 (manifold edge)
    let shared = 0; const ou = vfOff[u], nu = vfLen[u];
    for (let i = 0; i < nu; i++) { const f = VF[ou + i]; if (F[f * 3] === v || F[f * 3 + 1] === v || F[f * 3 + 2] === v) shared++; }
    if (shared !== 2) continue;
    // link condition: |N(u) ∩ N(v)| == 2
    stamp++; collectNeighbors(u, stamp, stampA);
    stamp++; collectNeighbors(v, stamp, stampB);
    let common = 0; const sA = stamp - 1;
    for (let i = 0; i < nlen; i++) if (stampA[nbuf[i]] === sA) common++;
    if (common !== 2) continue;
    // fold-over check
    let ok = true;
    const vx = P[v * 3], vy = P[v * 3 + 1], vz = P[v * 3 + 2], ux = P[u * 3], uy = P[u * 3 + 1], uz = P[u * 3 + 2];
    for (let i = 0; i < nu && ok; i++) {
      const f = VF[ou + i];
      if (F[f * 3] === v || F[f * 3 + 1] === v || F[f * 3 + 2] === v) continue;
      faceN(f, n0);
      P[u * 3] = vx; P[u * 3 + 1] = vy; P[u * 3 + 2] = vz;
      faceN(f, n1);
      P[u * 3] = ux; P[u * 3 + 1] = uy; P[u * 3 + 2] = uz;
      const l0 = Math.hypot(n0[0], n0[1], n0[2]), l1 = Math.hypot(n1[0], n1[1], n1[2]);
      if (l1 < 1e-12 || (n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2]) < 0.25 * l0 * l1) ok = false;
    }
    if (!ok) continue;
    // collapse u -> v
    for (let i = 0; i < nu; i++) {
      const f = VF[ou + i];
      if (F[f * 3] === v || F[f * 3 + 1] === v || F[f * 3 + 2] === v) {
        if (!fAlive[f]) continue;
        fAlive[f] = 0; T--;
        for (let k = 0; k < 3; k++) { const w = F[f * 3 + k]; if (w !== u) vfRemove(w, f); }
      } else {
        for (let k = 0; k < 3; k++) if (F[f * 3 + k] === u) F[f * 3 + k] = v;
        vfPush(v, f);
      }
    }
    vfLen[u] = 0; vAlive[u] = 0;
    for (let j = 0; j < 10; j++) Q[v * 10 + j] += Q[u * 10 + j];
    ver[v]++;
    stamp++; collectNeighbors(v, stamp, stampA);
    for (let i = 0; i < nlen; i++) pushEdge(v, nbuf[i]);
  }
  // compact
  const remap = new Int32Array(V).fill(-1); let nv = 0;
  const out = [];
  for (let f = 0; f < T0; f++) if (fAlive[f]) for (let k = 0; k < 3; k++) { const w = F[f * 3 + k]; if (remap[w] < 0) remap[w] = nv++; out.push(remap[w]); }
  const g = new THREE.BufferGeometry();
  for (const [name, attr] of Object.entries(geo.attributes)) {
    const isz = attr.itemSize, src = attr.array;
    const dst = new src.constructor(nv * isz);
    for (let i = 0; i < V; i++) { const j = remap[i]; if (j < 0) continue; for (let k = 0; k < isz; k++) dst[j * isz + k] = name === 'position' ? P[i * 3 + k] : src[i * isz + k]; }
    g.setAttribute(name, new THREE.BufferAttribute(dst, isz, attr.normalized));
  }
  g.setIndex(new THREE.BufferAttribute(nv > 65535 ? new Uint32Array(out) : new Uint16Array(out), 1));
  g.userData = Object.assign({}, geo.userData, { decimated: { from: T0, to: out.length / 3 } });
  return g;
}

// SDF "clay" sculpting for procedural characters.
// Blobs (ellipsoids, round cones, rounded boxes, tori) attached to rig bones are smooth-unioned (and optionally
// carved) into watertight surfaces, extracted with surface nets, projected onto the analytic SDF, shaded with
// analytic normals and baked SDF ambient occlusion, colored by the blob that defines the surface at each vertex,
// and smooth-skinned to nearby bones. Sculpting happens in an "A-pose" (arms out, legs apart: no webbing between
// limbs and torso), then vertices are re-posed into the rig's bind pose with the computed skin weights.
// Blobs can be split into groups sculpted at different resolutions (e.g. a fine 'head' group over a coarser body).
//
// Shapes (bone-local coordinates, meters):
//   { t:'ell', c:[x,y,z], r:[rx,ry,rz], rot?:[ax,ay,az] }      ellipsoid
//   { t:'cap', a:[x,y,z], b:[x,y,z], r0, r1 }                  round cone (capsule when r0 == r1)
//   { t:'box', c:[x,y,z], s:[hx,hy,hz], r, rot? }               rounded box (half extents s include rounding r)
//   { t:'tor', c:[x,y,z], R, r, rot? }                          torus around local Y
// Options: k (blend radius, default 0.022), sub (carve), rough, metal, emis, v/f (color noise), grad, prio
//          (color priority: higher wins ties), skin (0 = doesn't influence skin weights), seed,
//          bump: [amplitude, frequency] (noise displacement of the surface), group: 'body' | 'head' | [...]
import * as THREE from 'three';
import { Simplex, clamp, lerp } from '../core/util.js';
import { decimate } from './decimate.js';

const NZ = new Simplex(4127);
const T_ELL = 0, T_CAP = 1, T_BOX = 2, T_TOR = 3;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
const _c = new THREE.Color();

export const DEFAULT_APOSE = { upperArmL: [0, 0, 0.62], upperArmR: [0, 0, -0.62], thighL: [0, 0, 0.07], thighR: [0, 0, -0.07] };

// ------------------------------------------------------------------ compile blobs into world-space evaluators
function compile(blobs, rig, Ma, margin) {
  const out = [];
  for (const b of blobs) {
    const bi = rig.idx[b.bone]; const M = Ma[bi]; const s = b.shape; const o = b.o || {};
    const c = {
      type: 0, bone: bi, sub: !!o.sub, k: Math.max(1e-4, o.k ?? 0.022), prio: o.prio || 0, skin: o.skin ?? 1,
      rough: o.rough ?? 0.8, metal: o.metal ?? 0, emis: o.emis ?? 0,
      color: b.color, isFn: typeof b.color === 'function', base: typeof b.color === 'function' ? null : new THREE.Color(b.color ?? 0x888888),
      v: o.v ?? 0.05, f: o.f ?? 7, grad: o.grad || null, seed: (o.seed ?? 0) * 13.7,
      bumpA: o.bump ? o.bump[0] : 0, bumpF: o.bump ? o.bump[1] : 0, bumpFy: o.bump ? (o.bump[2] ?? o.bump[1]) : 0, bumpFz: o.bump ? (o.bump[3] ?? o.bump[1]) : 0, bumpS: (o.seed ?? 0) * 7.1 + 3.3,
      inv: null, minX: 0, minY: 0, minZ: 0, maxX: 0, maxY: 0, maxZ: 0,
    };
    let cx, cy, cz, R;
    if (s.t === 'cap') {
      c.type = T_CAP;
      const a = new THREE.Vector3(...s.a).applyMatrix4(M), bb = new THREE.Vector3(...s.b).applyMatrix4(M);
      const r0 = s.r0, r1 = s.r1 ?? s.r0;
      c.ax = a.x; c.ay = a.y; c.az = a.z;
      const bax = bb.x - a.x, bay = bb.y - a.y, baz = bb.z - a.z;
      const l2 = Math.max(1e-10, bax * bax + bay * bay + baz * baz);
      const rr = r0 - r1;
      if (l2 - rr * rr <= 1e-8) { // degenerate cone: sphere of the bigger radius at the bigger end
        c.type = T_ELL; const big = r0 >= r1 ? a : bb; const rad = Math.max(r0, r1);
        c.inv = new THREE.Matrix4().makeTranslation(-big.x, -big.y, -big.z).elements.slice(); c.rx = c.ry = c.rz = rad; c.rmin = rad;
        cx = big.x; cy = big.y; cz = big.z; R = rad;
      } else {
        c.bax = bax; c.bay = bay; c.baz = baz; c.l2 = l2; c.rr = rr; c.a2 = l2 - rr * rr; c.il2 = 1 / l2; c.r0 = r0; c.r1 = r1;
        c.minX = Math.min(a.x - r0, bb.x - r1); c.maxX = Math.max(a.x + r0, bb.x + r1);
        c.minY = Math.min(a.y - r0, bb.y - r1); c.maxY = Math.max(a.y + r0, bb.y + r1);
        c.minZ = Math.min(a.z - r0, bb.z - r1); c.maxZ = Math.max(a.z + r0, bb.z + r1);
        R = -1;
      }
    } else {
      _e.set(...(s.rot || [0, 0, 0])); _q.setFromEuler(_e);
      _m.compose(_v.set(...(s.c || [0, 0, 0])), _q, _one);
      const W = M.clone().multiply(_m);
      c.inv = W.clone().invert().elements.slice();
      cx = W.elements[12]; cy = W.elements[13]; cz = W.elements[14];
      if (s.t === 'ell') { c.type = T_ELL; c.rx = s.r[0]; c.ry = s.r[1]; c.rz = s.r[2]; c.rmin = Math.min(...s.r); R = Math.max(...s.r); }
      else if (s.t === 'box') { c.type = T_BOX; c.sx = s.s[0]; c.sy = s.s[1]; c.sz = s.s[2]; c.br = Math.min(s.r ?? 0.01, s.s[0], s.s[1], s.s[2]); R = Math.hypot(s.s[0], s.s[1], s.s[2]); }
      else if (s.t === 'tor') { c.type = T_TOR; c.R = s.R; c.tr = s.r; R = s.R + s.r; }
      else throw new Error('sculpt: unknown shape ' + s.t);
    }
    if (R >= 0) { c.minX = cx - R; c.maxX = cx + R; c.minY = cy - R; c.maxY = cy + R; c.minZ = cz - R; c.maxZ = cz + R; }
    const mg = margin + c.k + c.bumpA;
    c.minX -= mg; c.minY -= mg; c.minZ -= mg; c.maxX += mg; c.maxY += mg; c.maxZ += mg;
    out.push(c);
  }
  // additive first, carving after (stable order within each class)
  return out.filter(c => !c.sub).concat(out.filter(c => c.sub));
}

function blobD(c, x, y, z) {
  let d;
  if (c.type === T_CAP) {
    const pax = x - c.ax, pay = y - c.ay, paz = z - c.az;
    const l2 = c.l2, yy = pax * c.bax + pay * c.bay + paz * c.baz, zz = yy - l2;
    const xvx = pax * l2 - c.bax * yy, xvy = pay * l2 - c.bay * yy, xvz = paz * l2 - c.baz * yy;
    const x2 = xvx * xvx + xvy * xvy + xvz * xvz, y2 = yy * yy * l2, z2 = zz * zz * l2;
    const rr = c.rr, k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * c.a2 * z2 > k) d = Math.sqrt(x2 + z2) * c.il2 - c.r1;
    else if (Math.sign(yy) * c.a2 * y2 < k) d = Math.sqrt(x2 + y2) * c.il2 - c.r0;
    else d = (Math.sqrt(x2 * c.a2 * c.il2) + yy * rr) * c.il2 - c.r0;
  } else {
    const e = c.inv;
    const lx = e[0] * x + e[4] * y + e[8] * z + e[12], ly = e[1] * x + e[5] * y + e[9] * z + e[13], lz = e[2] * x + e[6] * y + e[10] * z + e[14];
    if (c.type === T_ELL) {
      const ax = lx / c.rx, ay = ly / c.ry, az = lz / c.rz;
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      const bx = ax / c.rx, by = ay / c.ry, bz = az / c.rz;
      const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      d = k1 > 1e-12 ? k0 * (k0 - 1) / k1 : -c.rmin;
    } else if (c.type === T_BOX) {
      const r = c.br;
      const qx = Math.abs(lx) - c.sx + r, qy = Math.abs(ly) - c.sy + r, qz = Math.abs(lz) - c.sz + r;
      const mx = Math.max(qx, 0), my = Math.max(qy, 0), mz = Math.max(qz, 0);
      d = Math.sqrt(mx * mx + my * my + mz * mz) + Math.min(Math.max(qx, qy, qz), 0) - r;
    } else {
      const qx = Math.sqrt(lx * lx + lz * lz) - c.R;
      d = Math.sqrt(qx * qx + ly * ly) - c.tr;
    }
  }
  if (c.bumpA && d < c.bumpA * 4 + 0.03) d += NZ.noise3(x * c.bumpF + c.bumpS, y * c.bumpFy, z * c.bumpFz - c.bumpS) * c.bumpA;
  return d;
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
function smax(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; }
const inBox = (c, x, y, z) => x >= c.minX && x <= c.maxX && y >= c.minY && y <= c.maxY && z >= c.minZ && z <= c.maxZ;

// ------------------------------------------------------------------ one group -> geometry (A-pose attributes, then re-posed)
function sculptGroup(C, ctx, h, opts) {
  const { defs, nb, MaInv, D } = ctx;
  const t0 = performance.now();
  let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  for (const c of C) if (!c.sub) { x0 = Math.min(x0, c.minX); y0 = Math.min(y0, c.minY); z0 = Math.min(z0, c.minZ); x1 = Math.max(x1, c.maxX); y1 = Math.max(y1, c.maxY); z1 = Math.max(z1, c.maxZ); }
  if (x0 > x1) return null;
  const nx = Math.ceil((x1 - x0) / h) + 2, ny = Math.ceil((y1 - y0) / h) + 2, nz = Math.ceil((z1 - z0) / h) + 2;
  const sxy = nx * ny;
  const F = new Float32Array(nx * ny * nz).fill(1);
  for (const c of C) {
    const i0 = Math.max(0, Math.floor((c.minX - x0) / h)), i1 = Math.min(nx - 1, Math.ceil((c.maxX - x0) / h));
    const j0 = Math.max(0, Math.floor((c.minY - y0) / h)), j1 = Math.min(ny - 1, Math.ceil((c.maxY - y0) / h));
    const k0 = Math.max(0, Math.floor((c.minZ - z0) / h)), k1 = Math.min(nz - 1, Math.ceil((c.maxZ - z0) / h));
    const sub = c.sub, k = c.k;
    for (let kk = k0; kk <= k1; kk++) {
      const z = z0 + kk * h;
      for (let jj = j0; jj <= j1; jj++) {
        const y = y0 + jj * h; let idx = kk * sxy + jj * nx + i0;
        for (let ii = i0; ii <= i1; ii++, idx++) {
          const d = blobD(c, x0 + ii * h, y, z);
          F[idx] = sub ? smax(F[idx], -d, k) : smin(F[idx], d, k);
        }
      }
    }
  }
  const t1 = performance.now();
  // ---------------------------------------------------------------- surface nets
  const cnx = nx - 1, cny = ny - 1, cnz = nz - 1;
  const cellV = new Int32Array(cnx * cny * cnz).fill(-1);
  let P = new Float32Array(1 << 15), np = 0;
  const corner = new Float32Array(8);
  const EDGES = [];
  for (let a = 0; a < 8; a++) for (let bit = 1; bit <= 4; bit <<= 1) if (!(a & bit)) EDGES.push(a, a | bit);
  for (let kk = 0; kk < cnz; kk++) for (let jj = 0; jj < cny; jj++) for (let ii = 0; ii < cnx; ii++) {
    const base = kk * sxy + jj * nx + ii;
    let mask = 0;
    for (let a = 0; a < 8; a++) {
      const v = F[base + (a & 1) + ((a >> 1) & 1) * nx + ((a >> 2) & 1) * sxy];
      corner[a] = v; if (v < 0) mask |= 1 << a;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (let e = 0; e < 24; e += 2) {
      const a = EDGES[e], b = EDGES[e + 1];
      const fa = corner[a], fb = corner[b];
      if ((fa < 0) === (fb < 0)) continue;
      const t = fa / (fa - fb);
      sx += (a & 1) + (((b & 1) - (a & 1)) * t);
      sy += ((a >> 1) & 1) + ((((b >> 1) & 1) - ((a >> 1) & 1)) * t);
      sz += ((a >> 2) & 1) + ((((b >> 2) & 1) - ((a >> 2) & 1)) * t);
      n++;
    }
    cellV[(kk * cny + jj) * cnx + ii] = np / 3;
    if (np + 3 > P.length) { const g = new Float32Array(P.length * 2); g.set(P); P = g; }
    P[np++] = x0 + (ii + sx / n) * h; P[np++] = y0 + (jj + sy / n) * h; P[np++] = z0 + (kk + sz / n) * h;
  }
  const cell = (i, j, k) => cellV[(k * cny + j) * cnx + i];
  let quads = new Int32Array(1 << 16), nq = 0;
  const q4 = (a, b, c, d) => { if (nq + 4 > quads.length) { const g = new Int32Array(quads.length * 2); g.set(quads); quads = g; } quads[nq++] = a; quads[nq++] = b; quads[nq++] = c; quads[nq++] = d; };
  for (let kk = 0; kk < nz - 1; kk++) for (let jj = 0; jj < ny - 1; jj++) for (let ii = 0; ii < nx - 1; ii++) {
    const idx = kk * sxy + jj * nx + ii; const s0 = F[idx] < 0;
    if (jj > 0 && kk > 0 && s0 !== (F[idx + 1] < 0)) q4(cell(ii, jj - 1, kk - 1), cell(ii, jj, kk - 1), cell(ii, jj, kk), cell(ii, jj - 1, kk));
    if (ii > 0 && kk > 0 && s0 !== (F[idx + nx] < 0)) q4(cell(ii - 1, jj, kk - 1), cell(ii - 1, jj, kk), cell(ii, jj, kk), cell(ii, jj, kk - 1));
    if (ii > 0 && jj > 0 && s0 !== (F[idx + sxy] < 0)) q4(cell(ii - 1, jj - 1, kk), cell(ii, jj - 1, kk), cell(ii, jj, kk), cell(ii - 1, jj, kk));
  }
  const V = np / 3;
  const pos = P.slice(0, np);
  const t2 = performance.now();
  // ---------------------------------------------------------------- project onto the analytic surface, normals, AO
  const nor = new Float32Array(V * 3);
  const dl = h * 0.2, RR = 0.1;
  const cand = new Int32Array(C.length); let nc = 0;
  const gather = (x, y, z) => { nc = 0; for (let i = 0; i < C.length; i++) { const c = C[i]; if (x >= c.minX - RR && x <= c.maxX + RR && y >= c.minY - RR && y <= c.maxY + RR && z >= c.minZ - RR && z <= c.maxZ + RR) cand[nc++] = i; } };
  const ev = (x, y, z) => {
    let f = 1;
    for (let n = 0; n < nc; n++) {
      const c = C[cand[n]]; if (!inBox(c, x, y, z)) continue;
      const d = blobD(c, x, y, z);
      f = c.sub ? smax(f, -d, c.k) : smin(f, d, c.k);
    }
    return f;
  };
  const ao = new Float32Array(V).fill(1);
  const AO_S = [0.012, 0.03, 0.055, 0.09], AO_W = [0.5, 0.3, 0.2, 0.12], aoStr = opts.aoStrength ?? 1.15;
  for (let v = 0; v < V; v++) {
    let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    gather(x, y, z);
    for (let it = 0; it < 2; it++) {
      const f = ev(x, y, z);
      if (Math.abs(f) < h * 0.01) break;
      const gx = (ev(x + dl, y, z) - ev(x - dl, y, z)) / (2 * dl);
      const gy = (ev(x, y + dl, z) - ev(x, y - dl, z)) / (2 * dl);
      const gz = (ev(x, y, z + dl) - ev(x, y, z - dl)) / (2 * dl);
      const g2 = gx * gx + gy * gy + gz * gz;
      if (g2 < 1e-6) break;
      let s = f / g2; const len = Math.abs(s) * Math.sqrt(g2);
      if (len > h) s *= h / len;
      x -= gx * s; y -= gy * s; z -= gz * s;
    }
    pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
    const gx = ev(x + dl, y, z) - ev(x - dl, y, z), gy = ev(x, y + dl, z) - ev(x, y - dl, z), gz = ev(x, y, z + dl) - ev(x, y, z - dl);
    const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    const nx3 = gx / gl, ny3 = gy / gl, nz3 = gz / gl;
    nor[v * 3] = nx3; nor[v * 3 + 1] = ny3; nor[v * 3 + 2] = nz3;
    if (opts.ao !== false) {
      let occ = 0;
      for (let s = 0; s < 4; s++) { const d = AO_S[s]; const f = ev(x + nx3 * d, y + ny3 * d, z + nz3 * d); occ += AO_W[s] * Math.max(0, d - f) / d; }
      ao[v] = clamp(1 - occ * aoStr, 0.28, 1);
    }
  }
  // triangulate quads along the shorter diagonal, oriented along the field gradient
  let idxOut = new Uint32Array(nq * 2 + 16), ni = 0;
  const emit = (a, b, c) => { idxOut[ni++] = a; idxOut[ni++] = b; idxOut[ni++] = c; };
  const d2 = (a, b) => { const dx = pos[a * 3] - pos[b * 3], dy = pos[a * 3 + 1] - pos[b * 3 + 1], dz = pos[a * 3 + 2] - pos[b * 3 + 2]; return dx * dx + dy * dy + dz * dz; };
  const tri = (a, b, c) => {
    const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
    const e1x = pos[b * 3] - ax, e1y = pos[b * 3 + 1] - ay, e1z = pos[b * 3 + 2] - az;
    const e2x = pos[c * 3] - ax, e2y = pos[c * 3 + 1] - ay, e2z = pos[c * 3 + 2] - az;
    const fx = e1y * e2z - e1z * e2y, fy = e1z * e2x - e1x * e2z, fz = e1x * e2y - e1y * e2x;
    if (fx * fx + fy * fy + fz * fz < 1e-16) return;
    const sx = nor[a * 3] + nor[b * 3] + nor[c * 3], sy = nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1], sz = nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2];
    if (fx * sx + fy * sy + fz * sz < 0) emit(a, c, b); else emit(a, b, c);
  };
  for (let q = 0; q < nq; q += 4) {
    const a = quads[q], b = quads[q + 1], c = quads[q + 2], d = quads[q + 3];
    if (a < 0 || b < 0 || c < 0 || d < 0) continue;
    if (d2(a, c) <= d2(b, d)) { tri(a, b, c); tri(a, c, d); } else { tri(a, b, d); tri(b, c, d); }
  }
  const t3 = performance.now();
  // ---------------------------------------------------------------- colors, materials, skin weights
  const col = new Float32Array(V * 3), mat = new Float32Array(V * 3);
  const skI = new Uint16Array(V * 4), skW = new Float32Array(V * 4);
  const parent = defs.map(d => d.parent);
  const near = (a, b) => { // b within 2 hops up/down the hierarchy of a
    if (a === b) return true;
    let p = parent[a]; for (let i = 0; i < 2 && p >= 0; i++, p = parent[p]) if (p === b) return true;
    p = parent[b]; for (let i = 0; i < 2 && p >= 0; i++, p = parent[p]) if (p === a) return true;
    return false;
  };
  const sigC = opts.colorSigma ?? 0.0022, sigS = opts.skinSigma ?? 0.02;
  const dist = new Float32Array(C.length);
  const bw = new Float32Array(nb);
  const touched = [];
  const loc = new THREE.Vector3();
  for (let v = 0; v < V; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
    let emin = 1e9, smn = 1e9, dom = -1;
    for (let i = 0; i < C.length; i++) {
      const c = C[i];
      if (!inBox(c, x, y, z)) { dist[i] = 1e9; continue; }
      const d = blobD(c, x, y, z); dist[i] = d;
      const e = Math.abs(d) - c.prio * 0.0015;
      if (e < emin) emin = e;
      if (!c.sub && c.skin && d < smn) { smn = d; dom = c.bone; }
    }
    let wsum = 0, r = 0, g = 0, b = 0, ro = 0, me = 0, em = 0;
    for (let i = 0; i < C.length; i++) {
      const d = dist[i]; if (d >= 1e8) continue;
      const c = C[i];
      const e = Math.abs(d) - c.prio * 0.0015;
      const w = Math.exp(-(e - emin) / sigC); if (w < 1e-3) continue;
      const needLoc = c.isFn || c.v || c.grad;
      if (needLoc) loc.set(x, y, z).applyMatrix4(MaInv[c.bone]);
      let emv = c.emis;
      if (c.isFn) { const ret = c.color(loc.x, loc.y, loc.z, _c); if (typeof ret === 'number') emv = ret; } else _c.copy(c.base);
      let kk = 1;
      if (c.v) kk += NZ.noise3(loc.x * c.f + c.seed, loc.y * c.f + 11.3, loc.z * c.f - c.seed) * c.v;
      if (c.grad) kk *= lerp(c.grad[2], c.grad[3], clamp((loc.y - c.grad[0]) / (c.grad[1] - c.grad[0])));
      r += _c.r * kk * w; g += _c.g * kk * w; b += _c.b * kk * w;
      ro += c.rough * w; me += c.metal * w; em += emv * w; wsum += w;
    }
    if (wsum <= 0) { wsum = 1; r = g = b = 0.5; ro = 0.8; }
    const a = ao[v];
    col[v * 3] = r / wsum * a; col[v * 3 + 1] = g / wsum * a; col[v * 3 + 2] = b / wsum * a;
    mat[v * 3] = ro / wsum; mat[v * 3 + 1] = me / wsum; mat[v * 3 + 2] = em / wsum;
    touched.length = 0;
    if (dom < 0) dom = 0;
    for (let i = 0; i < C.length; i++) {
      const c = C[i]; const d = dist[i];
      if (c.sub || !c.skin || d >= 1e8) continue;
      if (!near(dom, c.bone)) continue;
      const w = Math.exp(-Math.max(0, d - smn) / sigS) * c.skin; if (w < 1e-3) continue;
      if (bw[c.bone] === 0) touched.push(c.bone);
      bw[c.bone] += w;
    }
    if (!touched.length) { touched.push(dom); bw[dom] = 1; }
    touched.sort((p, q) => bw[q] - bw[p]);
    let tot = 0; const nInf = Math.min(4, touched.length);
    for (let i = 0; i < nInf; i++) tot += bw[touched[i]];
    for (let i = 0; i < 4; i++) {
      if (i < nInf) { skI[v * 4 + i] = touched[i]; skW[v * 4 + i] = bw[touched[i]] / tot; }
      else { skI[v * 4 + i] = 0; skW[v * 4 + i] = 0; }
    }
    for (const bi of touched) bw[bi] = 0;
  }
  // ---------------------------------------------------------------- re-pose A-pose -> bind pose
  for (let v = 0; v < V; v++) {
    const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], nx3 = nor[v * 3], ny3 = nor[v * 3 + 1], nz3 = nor[v * 3 + 2];
    let px = 0, py = 0, pz = 0, qx = 0, qy = 0, qz = 0;
    for (let i = 0; i < 4; i++) {
      const w = skW[v * 4 + i]; if (!w) continue;
      const e = D[skI[v * 4 + i]];
      px += w * (e[0] * x + e[4] * y + e[8] * z + e[12]); py += w * (e[1] * x + e[5] * y + e[9] * z + e[13]); pz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
      qx += w * (e[0] * nx3 + e[4] * ny3 + e[8] * nz3); qy += w * (e[1] * nx3 + e[5] * ny3 + e[9] * nz3); qz += w * (e[2] * nx3 + e[6] * ny3 + e[10] * nz3);
    }
    const ql = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
    pos[v * 3] = px; pos[v * 3 + 1] = py; pos[v * 3 + 2] = pz;
    nor[v * 3] = qx / ql; nor[v * 3 + 1] = qy / ql; nor[v * 3 + 2] = qz / ql;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aMat', new THREE.BufferAttribute(mat, 3));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(skI, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(skW, 4));
  geo.setIndex(new THREE.BufferAttribute(V > 65535 ? idxOut.slice(0, ni) : Uint16Array.from(idxOut.subarray(0, ni)), 1));
  const t4 = performance.now();
  geo.userData.sculptStats = { verts: V, tris: ni / 3, grid: [nx, ny, nz], h, ms: { splat: +(t1 - t0).toFixed(1), nets: +(t2 - t1).toFixed(1), project: +(t3 - t2).toFixed(1), attrs: +(t4 - t3).toFixed(1) } };
  return geo;
}

// ------------------------------------------------------------------ caching & baked data
// Sculpted groups are cached per `${rig.sculptKey}|${group}` with a structural hash of their blobs + settings.
// tools/bake_models.mjs runs every character template in Node at build time and stores the results (quantized,
// gzipped) in baked_data.js; at boot loadBaked() decodes them so the browser never sculpts. Stale or missing
// entries fall back to live sculpting.
export const SCULPT_MEM = new Map();   // key -> { hash, geo }
const BAKED = new Map();               // key -> { hash, geo }
export const bakedInfo = { loaded: false, entries: 0, bytes: 0, error: null, misses: [] };
function fnv(str, h = 2166136261) { for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const r5 = (v) => (typeof v === 'number' ? Math.round(v * 1e5) / 1e5 : Array.isArray(v) ? v.map(r5) : v);
export function groupHash(rig, list, h, target, opts) {
  const parts = [h, target || 0, JSON.stringify(opts.apose ?? null), opts.aoStrength ?? 0, opts.colorSigma ?? 0, opts.skinSigma ?? 0];
  for (const b of list) {
    const o = b.o || {};
    parts.push(b.bone, JSON.stringify(r5(b.shape)), typeof b.color === 'function' ? 'fn' : (b.color?.isColor ? b.color.getHexString() : b.color),
      o.k, o.sub ? 1 : 0, o.rough, o.metal, o.emis, o.v, o.f, o.prio, o.skin, JSON.stringify(r5(o.bump ?? null)), JSON.stringify(o.grad ?? null), o.seed);
  }
  // bone layout matters too (bind pose)
  for (const d of rig.defs) parts.push(d.name, r5(d.pos.x), r5(d.pos.y), r5(d.pos.z));
  return fnv(parts.join('|')).toString(36);
}
// ---- binary format v2: [u32 headerLen][header JSON][payload]; per entry, attribute STREAMS (better gzip):
//   pos: 3 delta-coded u16 streams (bbox-quantized), nor: 3 i8 streams, col: 3 u8 sRGB streams, mat: 3 u8 streams,
//   skI: 4 u8 streams, skW: 4 u8 streams (sum 255), idx: delta-coded zigzag u16
export function encodeBaked(entries) { // entries: [{key, hash, geo}]
  const head = []; const chunks = []; let off = 0;
  const lin2s = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  for (const { key, hash, geo } of entries) {
    const P = geo.attributes.position.array, N = geo.attributes.normal.array, C = geo.attributes.color.array, M = geo.attributes.aMat.array;
    const SI = geo.attributes.skinIndex.array, SW = geo.attributes.skinWeight.array, I = geo.index.array;
    const V = P.length / 3, T = I.length;
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < V; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], P[i * 3 + k]); mx[k] = Math.max(mx[k], P[i * 3 + k]); }
    const sz = mx.map((v, k) => Math.max(1e-6, v - mn[k]));
    let emMax = 0.001; for (let i = 0; i < V; i++) emMax = Math.max(emMax, M[i * 3 + 2]);
    const bytes = V * 2 * 3 + V * (3 + 3 + 3 + 4 + 4) + T * 2;
    const buf = new ArrayBuffer(bytes + (bytes & 1)); const dv = new DataView(buf); let o = 0;
    for (let k = 0; k < 3; k++) { let prev = 0; for (let i = 0; i < V; i++) { const q = Math.round((P[i * 3 + k] - mn[k]) / sz[k] * 65535); dv.setUint16(o, (q - prev) & 0xffff, true); prev = q; o += 2; } }
    for (let k = 0; k < 3; k++) for (let i = 0; i < V; i++) dv.setInt8(o++, Math.max(-127, Math.min(127, Math.round(N[i * 3 + k] * 127))));
    for (let k = 0; k < 3; k++) for (let i = 0; i < V; i++) dv.setUint8(o++, Math.round(Math.max(0, Math.min(1, lin2s(C[i * 3 + k]))) * 255));
    for (let i = 0; i < V; i++) dv.setUint8(o++, Math.round(Math.max(0, Math.min(1, M[i * 3])) * 255));
    for (let i = 0; i < V; i++) dv.setUint8(o++, Math.round(Math.max(0, Math.min(1, M[i * 3 + 1])) * 255));
    for (let i = 0; i < V; i++) dv.setUint8(o++, Math.round(M[i * 3 + 2] / emMax * 255));
    for (let k = 0; k < 4; k++) for (let i = 0; i < V; i++) dv.setUint8(o++, SI[i * 4 + k]);
    const QW = new Uint8Array(V * 4);
    for (let i = 0; i < V; i++) {
      const w = [0, 1, 2, 3].map(k => SW[i * 4 + k] * 255), q = w.map(Math.floor); const rem = 255 - q.reduce((a, b) => a + b, 0);
      const order = [0, 1, 2, 3].sort((a, b) => (w[b] - q[b]) - (w[a] - q[a])); for (let j = 0; j < rem && j < 4; j++) q[order[j]]++;
      for (let k = 0; k < 4; k++) QW[i * 4 + k] = q[k];
    }
    for (let k = 0; k < 4; k++) for (let i = 0; i < V; i++) dv.setUint8(o++, QW[i * 4 + k]);
    { let prev = 0; for (let i = 0; i < T; i++) { const d = I[i] - prev; prev = I[i]; dv.setUint16(o, ((d << 1) ^ (d >> 31)) & 0xffff, true); o += 2; } }
    head.push({ key, hash, V, T, off, mn, sz, emMax });
    chunks.push(new Uint8Array(buf)); off += buf.byteLength;
  }
  const hj = new TextEncoder().encode(JSON.stringify({ v: 2, entries: head }));
  const out = new Uint8Array(4 + hj.length + off); new DataView(out.buffer).setUint32(0, hj.length, true); out.set(hj, 4);
  let p = 4 + hj.length; for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}
export function decodeBaked(u8) {
  const dv0 = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const hl = dv0.getUint32(0, true);
  const H = JSON.parse(new TextDecoder().decode(u8.subarray(4, 4 + hl)));
  if (H.v !== 2) throw new Error('baked format ' + H.v);
  const base = 4 + hl;
  const s2l = new Float32Array(256); for (let i = 0; i < 256; i++) { const c = i / 255; s2l[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  for (const e of H.entries) {
    const { V, T, mn, sz, emMax } = e;
    const dv = new DataView(u8.buffer, u8.byteOffset + base + e.off);
    let o = 0;
    const P = new Float32Array(V * 3), N = new Float32Array(V * 3), C = new Float32Array(V * 3), M = new Float32Array(V * 3), SI = new Uint16Array(V * 4), SW = new Float32Array(V * 4);
    for (let k = 0; k < 3; k++) { let q = 0; for (let i = 0; i < V; i++) { q = (q + dv.getUint16(o, true)) & 0xffff; o += 2; P[i * 3 + k] = mn[k] + q / 65535 * sz[k]; } }
    for (let k = 0; k < 3; k++) for (let i = 0; i < V; i++) N[i * 3 + k] = dv.getInt8(o++) / 127;
    for (let i = 0; i < V; i++) { const x = N[i * 3], y = N[i * 3 + 1], z = N[i * 3 + 2], l = Math.hypot(x, y, z) || 1; N[i * 3] = x / l; N[i * 3 + 1] = y / l; N[i * 3 + 2] = z / l; }
    for (let k = 0; k < 3; k++) for (let i = 0; i < V; i++) C[i * 3 + k] = s2l[dv.getUint8(o++)];
    for (let i = 0; i < V; i++) M[i * 3] = dv.getUint8(o++) / 255;
    for (let i = 0; i < V; i++) M[i * 3 + 1] = dv.getUint8(o++) / 255;
    for (let i = 0; i < V; i++) M[i * 3 + 2] = dv.getUint8(o++) / 255 * emMax;
    for (let k = 0; k < 4; k++) for (let i = 0; i < V; i++) SI[i * 4 + k] = dv.getUint8(o++);
    for (let k = 0; k < 4; k++) for (let i = 0; i < V; i++) SW[i * 4 + k] = dv.getUint8(o++) / 255;
    const I = new Uint16Array(T); { let prev = 0; for (let i = 0; i < T; i++) { const z = dv.getUint16(o, true); o += 2; const d = (z >>> 1) ^ -(z & 1); prev = (prev + d) & 0xffff; I[i] = prev; } }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3)); geo.setAttribute('aMat', new THREE.BufferAttribute(M, 3));
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4));
    geo.setIndex(new THREE.BufferAttribute(I, 1));
    geo.userData.sculptStats = { baked: true, verts: V, tris: T / 3 };
    BAKED.set(e.key, { hash: e.hash, geo });
  }
  bakedInfo.entries = H.entries.length;
  return H.entries.length;
}
// browser: decode the gzipped base64 payload (DecompressionStream); resolves even on failure (falls back to live sculpting)
export async function loadBaked(b64) {
  if (bakedInfo.loaded || !b64) return bakedInfo;
  try {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    bakedInfo.bytes = bin.length;
    const ds = new DecompressionStream('gzip');
    const buf = await new Response(new Blob([bin]).stream().pipeThrough(ds)).arrayBuffer();
    decodeBaked(new Uint8Array(buf));
    bakedInfo.loaded = true;
  } catch (e) { bakedInfo.error = String(e && e.message || e); console.warn('[sculpt] baked data unavailable, sculpting live:', bakedInfo.error); }
  return bakedInfo;
}

// ------------------------------------------------------------------ main
// rig: Rig (defs, idx, blobs, bindMats(), sculptKey). opts: { voxel, tris, groups: { name: { voxel, tris } }, apose, ao, aoStrength, skinSigma, colorSigma }
// returns [{ name, geo, stats }] (geometries are cached/shared: never dispose them)
export function sculptParts(rig, opts = {}) {
  const groups = new Map();
  for (const b of rig.blobs) {
    const gs = Array.isArray(b.o?.group) ? b.o.group : [b.o?.group || 'body'];
    for (const g of gs) { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(b); }
  }
  const out = []; let ctx = null;
  const getCtx = () => {
    if (ctx) return ctx;
    const defs = rig.defs, nb = defs.length;
    const Mb = rig.bindMats();
    const apose = opts.apose ?? DEFAULT_APOSE;
    const Ma = [];
    for (let i = 0; i < nb; i++) {
      const d = defs[i]; const extra = apose[d.name];
      const q = d.quat.clone();
      if (extra) q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(extra[0], extra[1], extra[2])));
      const local = new THREE.Matrix4().compose(d.pos, q, _one);
      Ma.push(d.parent >= 0 ? Ma[d.parent].clone().multiply(local) : local);
    }
    const MaInv = Ma.map(m => m.clone().invert());
    const D = []; for (let i = 0; i < nb; i++) D.push(Mb[i].clone().multiply(MaInv[i]).elements.slice());
    return (ctx = { defs, nb, Ma, MaInv, D });
  };
  for (const [name, list] of groups) {
    const h = opts.groups?.[name]?.voxel ?? opts.voxel ?? 0.012;
    const target = opts.groups?.[name]?.tris ?? opts.tris;
    const key = rig.sculptKey ? `${rig.sculptKey}|${name}` : null;
    const hash = groupHash(rig, list, h, target, opts);
    let hit = key && SCULPT_MEM.get(key);
    if (hit && hit.hash === hash) { out.push({ name, geo: hit.geo, stats: hit.geo.userData.sculptStats }); continue; }
    const bk = key && BAKED.get(key);
    if (bk && bk.hash === hash) { SCULPT_MEM.set(key, bk); out.push({ name, geo: bk.geo, stats: bk.geo.userData.sculptStats }); continue; }
    if (key && bakedInfo.loaded) bakedInfo.misses.push(key + (bk ? ' (stale)' : ''));
    const C = compile(list, rig, getCtx().Ma, 2.5 * h);
    let g = sculptGroup(C, getCtx(), h, opts);
    if (!g) continue;
    const st = g.userData.sculptStats;
    if (target && g.index.count / 3 > target) { const t = performance.now(); const g2 = decimate(g, target, opts.decimate || {}); g.dispose(); g = g2; st.decimated = { tris: g.index.count / 3, ms: +(performance.now() - t).toFixed(1) }; g.userData.sculptStats = st; }
    if (key) SCULPT_MEM.set(key, { hash, geo: g });
    out.push({ name, geo: g, stats: st });
  }
  return out;
}

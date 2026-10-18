// Grid navigation: walkability, circle collision, line of sight, A* paths, flow fields.
export class Nav {
  constructor(level) {
    this.w = level.w; this.h = level.h;
    this.walk = level.walk.slice();            // 1 walkable
    this.block = new Uint8Array(this.w * this.h); // dynamic blockers (objects)
    this.flow = new Float32Array(this.w * this.h).fill(1e9);
    this.flowTarget = { x: -999, z: -999, t: -1 };
    this._heap = new MinHeap(this.w * this.h);
    this._g = new Float32Array(this.w * this.h);
    this._from = new Int32Array(this.w * this.h);
    this._closed = new Uint32Array(this.w * this.h);
    this._stamp = 1;
    this.explored = new Uint8Array(this.w * this.h);
  }
  inb(i, j) { return i >= 0 && j >= 0 && i < this.w && j < this.h; }
  ok(i, j) { if (i < 0 || j < 0 || i >= this.w || j >= this.h) return false; const k = j * this.w + i; return this.walk[k] === 1 && this.block[k] === 0; }
  walkableAt(x, z) { return this.ok(Math.floor(x), Math.floor(z)); }
  setBlocked(x, z, r, on) {
    for (let j = Math.floor(z - r); j <= Math.floor(z + r); j++) for (let i = Math.floor(x - r); i <= Math.floor(x + r); i++) {
      if (!this.inb(i, j)) continue; const dx = i + 0.5 - x, dz = j + 0.5 - z;
      if (dx * dx + dz * dz <= r * r) this.block[j * this.w + i] = on ? 1 : 0;
    }
  }
  nearestWalkable(x, z, maxR = 12) {
    const ci = Math.floor(x), cj = Math.floor(z);
    if (this.ok(ci, cj)) return { x, z };
    let best = null, bd = 1e9;
    for (let r = 1; r <= maxR; r++) {
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (!this.ok(ci + di, cj + dj)) continue;
        const px = ci + di + 0.5, pz = cj + dj + 0.5, d = (px - x) ** 2 + (pz - z) ** 2;
        if (d < bd) { bd = d; best = { x: px, z: pz }; }
      }
      if (best) return best;
    }
    return { x, z };
  }
  // resolve a circle at pos (Vector3-like) against blocked cells; mutates pos
  collide(pos, r) {
    const i0 = Math.floor(pos.x - r), i1 = Math.floor(pos.x + r), j0 = Math.floor(pos.z - r), j1 = Math.floor(pos.z + r);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (this.ok(i, j)) continue;
      const cx = Math.max(i, Math.min(pos.x, i + 1)), cz = Math.max(j, Math.min(pos.z, j + 1));
      let dx = pos.x - cx, dz = pos.z - cz; const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2), push = (r - d) / d; pos.x += dx * push; pos.z += dz * push; }
        else { // center inside block: push out along smallest axis
          const ox = pos.x - (i + 0.5), oz = pos.z - (j + 0.5);
          if (Math.abs(ox) > Math.abs(oz)) pos.x = ox > 0 ? i + 1 + r : i - r; else pos.z = oz > 0 ? j + 1 + r : j - r;
        }
      }
    }
  }
  // grid DDA line of sight between two points
  los(x0, z0, x1, z1) {
    let i = Math.floor(x0), j = Math.floor(z0); const ie = Math.floor(x1), je = Math.floor(z1);
    const dx = x1 - x0, dz = z1 - z0;
    const si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
    const tdx = dx !== 0 ? Math.abs(1 / dx) : 1e9, tdz = dz !== 0 ? Math.abs(1 / dz) : 1e9;
    let tx = dx !== 0 ? (dx > 0 ? (i + 1 - x0) : (x0 - i)) * tdx : 1e9;
    let tz = dz !== 0 ? (dz > 0 ? (j + 1 - z0) : (z0 - j)) * tdz : 1e9;
    for (let n = 0; n < 400; n++) {
      if (!this.losCell(i, j)) return false;
      if (i === ie && j === je) return true;
      if (tx < tz) { tx += tdx; i += si; } else { tz += tdz; j += sj; }
    }
    return true;
  }
  losCell(i, j) { if (!this.inb(i, j)) return false; const k = j * this.w + i; return this.walk[k] === 1 || this.losThrough?.[k] === 1; }
  // walk a ray and return the farthest walkable point (for teleport/leap/charge)
  castWalk(x0, z0, x1, z1, r = 0.3) {
    const d = Math.hypot(x1 - x0, z1 - z0), steps = Math.max(1, Math.ceil(d / 0.25));
    let lx = x0, lz = z0;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      if (!this.walkableAt(x, z) || !this.walkableAt(x + r, z) || !this.walkableAt(x - r, z) || !this.walkableAt(x, z + r) || !this.walkableAt(x, z - r)) break;
      lx = x; lz = z;
    }
    return { x: lx, z: lz };
  }
  // A* (8-dir, no corner cutting). returns array of {x,z} waypoints (smoothed) or null
  path(sx, sz, tx, tz, maxNodes = 6000) {
    const w = this.w;
    let si = Math.floor(sx), sj = Math.floor(sz);
    let t = this.ok(Math.floor(tx), Math.floor(tz)) ? { x: tx, z: tz } : this.nearestWalkable(tx, tz, 8);
    let ti = Math.floor(t.x), tj = Math.floor(t.z);
    if (!this.ok(si, sj)) { const n = this.nearestWalkable(sx, sz, 3); si = Math.floor(n.x); sj = Math.floor(n.z); }
    if (!this.ok(ti, tj) || !this.ok(si, sj)) return null;
    if (si === ti && sj === tj) return [{ x: t.x, z: t.z }];
    if (this.los(sx, sz, t.x, t.z) && this._clearWide(sx, sz, t.x, t.z)) return [{ x: t.x, z: t.z }];
    const stamp = ++this._stamp; if (stamp > 4e9) this._stamp = 1;
    const g = this._g, from = this._from, closed = this._closed, heap = this._heap;
    heap.clear();
    const s = sj * w + si, goal = tj * w + ti;
    g[s] = 0; from[s] = -1; closed[s] = 0;
    const H = (i, j) => { const dx = Math.abs(i - ti), dz = Math.abs(j - tj); return (dx + dz) + (1.4142 - 2) * Math.min(dx, dz); };
    heap.push(s, H(si, sj));
    const seen = this._seen || (this._seen = new Uint32Array(w * this.h)); seen[s] = stamp;
    let expanded = 0, found = false, bestK = s, bestH = H(si, sj);
    while (heap.size) {
      const k = heap.pop();
      if (closed[k] === stamp) continue; closed[k] = stamp;
      if (k === goal) { found = true; break; }
      if (++expanded > maxNodes) break;
      const i = k % w, j = (k / w) | 0;
      const hk = H(i, j); if (hk < bestH) { bestH = hk; bestK = k; }
      for (let d = 0; d < 8; d++) {
        const di = DI[d], dj = DJ[d], ni = i + di, nj = j + dj;
        if (!this.ok(ni, nj)) continue;
        if (di && dj && (!this.ok(i + di, j) || !this.ok(i, j + dj))) continue;
        const nk = nj * w + ni; if (closed[nk] === stamp) continue;
        const ng = g[k] + (di && dj ? 1.4142 : 1);
        if (seen[nk] !== stamp || ng < g[nk]) { seen[nk] = stamp; g[nk] = ng; from[nk] = k; heap.push(nk, ng + H(ni, nj)); }
      }
    }
    let end = found ? goal : bestK;
    const cells = [];
    for (let k = end; k !== -1 && cells.length < 4000; k = from[k]) { cells.push(k); if (k === s) break; }
    cells.reverse();
    const pts = cells.map(k => ({ x: (k % w) + 0.5, z: ((k / w) | 0) + 0.5 }));
    if (found) pts[pts.length - 1] = { x: t.x, z: t.z };
    return this.smooth(sx, sz, pts);
  }
  _clearWide(x0, z0, x1, z1) { // LOS for a body of ~0.35 radius
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * 0.35, nz = dx / l * 0.35;
    return this.los(x0 + nx, z0 + nz, x1 + nx, z1 + nz) && this.los(x0 - nx, z0 - nz, x1 - nx, z1 - nz);
  }
  smooth(sx, sz, pts) {
    if (pts.length <= 2) return pts;
    const out = []; let ax = sx, az = sz, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !(this.los(ax, az, pts[j].x, pts[j].z) && this._clearWide(ax, az, pts[j].x, pts[j].z))) j--;
      out.push(pts[j]); ax = pts[j].x; az = pts[j].z; i = j + 1;
    }
    return out;
  }
  // Dijkstra-ish BFS flow field toward (tx,tz) within radius cells
  buildFlow(tx, tz, radius = 48) {
    const w = this.w, h = this.h, F = this.flow;
    const ti = Math.floor(tx), tj = Math.floor(tz);
    const i0 = Math.max(0, ti - radius), i1 = Math.min(w - 1, ti + radius), j0 = Math.max(0, tj - radius), j1 = Math.min(h - 1, tj + radius);
    for (let j = j0; j <= j1; j++) F.fill(1e9, j * w + i0, j * w + i1 + 1);
    this.flowBox = [i0, i1, j0, j1];
    if (!this.ok(ti, tj)) { const n = this.nearestWalkable(tx, tz, 3); return this.buildFlow(n.x, n.z, radius); }
    const heap = this._heap; heap.clear();
    const s = tj * w + ti; F[s] = 0; heap.push(s, 0);
    while (heap.size) {
      const k = heap.pop(); const i = k % w, j = (k / w) | 0, d = F[k];
      for (let n = 0; n < 8; n++) {
        const di = DI[n], dj = DJ[n], ni = i + di, nj = j + dj;
        if (ni < i0 || ni > i1 || nj < j0 || nj > j1 || !this.ok(ni, nj)) continue;
        if (di && dj && (!this.ok(i + di, j) || !this.ok(i, j + dj))) continue;
        const nk = nj * w + ni, nd = d + (di && dj ? 1.4142 : 1);
        if (nd < F[nk]) { F[nk] = nd; heap.push(nk, nd); }
      }
    }
    this.flowTarget.x = tx; this.flowTarget.z = tz;
  }
  // direction (unit, written to out {x,z}) following the flow field from (x,z); returns false if no flow
  flowDir(x, z, out) {
    const w = this.w, i = Math.floor(x), j = Math.floor(z);
    if (!this.inb(i, j)) return false;
    const F = this.flow; let best = F[j * w + i], bi = -1;
    if (best >= 1e9) { // inside blocked cell: find any neighbour
      best = 1e9;
    }
    for (let n = 0; n < 8; n++) {
      const ni = i + DI[n], nj = j + DJ[n];
      if (!this.ok(ni, nj)) continue;
      if (DI[n] && DJ[n] && (!this.ok(i + DI[n], j) || !this.ok(i, j + DJ[n]))) continue;
      const v = F[nj * w + ni]; if (v < best) { best = v; bi = n; }
    }
    if (bi < 0) return false;
    const cx = i + DI[bi] + 0.5 - x, cz = j + DJ[bi] + 0.5 - z, l = Math.hypot(cx, cz) || 1;
    out.x = cx / l; out.z = cz / l; return true;
  }
  flowDist(x, z) { const i = Math.floor(x), j = Math.floor(z); if (!this.inb(i, j)) return 1e9; return this.flow[j * this.w + i]; }
  reveal(x, z, r) {
    const r2 = r * r;
    for (let j = Math.max(0, Math.floor(z - r)); j <= Math.min(this.h - 1, Math.floor(z + r)); j++)
      for (let i = Math.max(0, Math.floor(x - r)); i <= Math.min(this.w - 1, Math.floor(x + r)); i++)
        if ((i + 0.5 - x) ** 2 + (j + 0.5 - z) ** 2 <= r2) this.explored[j * this.w + i] = 1;
  }
}
const DI = [1, -1, 0, 0, 1, 1, -1, -1], DJ = [0, 0, 1, -1, 1, -1, 1, -1];

class MinHeap {
  constructor(cap) { this.k = new Int32Array(cap * 2 + 16); this.p = new Float32Array(cap * 2 + 16); this.size = 0; }
  clear() { this.size = 0; }
  push(key, pri) {
    if (this.size >= this.k.length) { const nk = new Int32Array(this.k.length * 2), np = new Float32Array(this.p.length * 2); nk.set(this.k); np.set(this.p); this.k = nk; this.p = np; }
    let i = this.size++; const K = this.k, P = this.p;
    while (i > 0) { const pa = (i - 1) >> 1; if (P[pa] <= pri) break; K[i] = K[pa]; P[i] = P[pa]; i = pa; }
    K[i] = key; P[i] = pri;
  }
  pop() {
    const K = this.k, P = this.p; const top = K[0]; const n = --this.size;
    if (n > 0) {
      const key = K[n], pri = P[n]; let i = 0;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && P[c + 1] < P[c]) c++; if (P[c] >= pri) break; K[i] = K[c]; P[i] = P[c]; i = c; }
      K[i] = key; P[i] = pri;
    }
    return top;
  }
}

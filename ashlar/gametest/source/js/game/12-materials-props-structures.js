// ===== game part 12-materials-props-structures (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var J, NO, PO, FO, IO, LO, RO, zO, BO, VO, HO, UO = t((() => {
  Ed(), Ld(), J = { stone: 0, bark: 1, wood: 2, canvas: 3, rock: 4, iron: 5, hide: 6, thatch: 7, bone: 8, plaster: 9, moss: 10, dirt: 11, caveRock: 12, flagstone: 13, deadwood: 14, grain: 15, slate: 16, cloth: 17, GLOSS: 30, FLAT: 31 }, NO = { 0: 0.85, 1: 0.45, 2: 0.35, 3: 0.1, 4: 1, 5: 0, 6: 0.05, 7: 0.35, 8: 0.1, 9: 0.45, 10: 1, 11: 0.6, 12: 0.75, 13: 0.8, 14: 0.4, 15: 0.3, 16: 0.6, 17: 0.05, 30: 0, 31: 0 }, PO = new P(), FO = new N(), IO = new N(), LO = new N(), RO = new ir(), zO = new N(), BO = new wr(), VO = class {
    pos = [];
    nrm = [];
    col = [];
    mat = [];
    tex = [];
    quat = [];
    idx = [];
    flags = [];
    stack = [new wr()];
    rng;
    constructor(e4 = 1) {
      this.rng = new Id(e4 * 7919 + 13);
    }
    get vertexCount() {
      return this.pos.length / 3;
    }
    get triangleCount() {
      return this.idx.length / 3;
    }
    group(e4, t2) {
      this.stack.push(this.stack[this.stack.length - 1].clone().multiply(e4));
      try {
        t2();
      } finally {
        this.stack.pop();
      }
      return this;
    }
    add(e4, t2, n2) {
      let r2 = e4.getAttribute(`position`);
      e4.getAttribute(`normal`) || e4.computeVertexNormals();
      let i2 = e4.getAttribute(`normal`);
      BO.copy(this.stack[this.stack.length - 1]), n2 && BO.multiply(n2), BO.decompose(LO, RO, zO);
      let a2 = zO.x * zO.y * zO.z < 0, o2 = this.pos.length / 3, s2 = PO.set(t2.color ?? `#ffffff`), c2 = t2.vary ?? 0.07, l2 = (1 + (this.rng.next() - 0.5) * 2 * c2) * (t2.gain ?? 1), u2 = (this.rng.next() - 0.5) * c2 * 0.5, d2 = s2.r * l2 * (1 + u2), f2 = s2.g * l2, p2 = s2.b * l2 * (1 - u2), m2 = t2.layer, h2 = t2.emissive ?? 0, g2 = t2.sway ?? 0, _2 = t2.moss ?? NO[m2] ?? 0, v2 = t2.ao ?? h2 === 0, y2 = t2.occlude ?? true, b2 = !!v2 | (y2 ? 2 : 0), x2 = t2.texScale ?? 1, S2 = this.rng.next() * 37, C2 = this.rng.next() * 37, w2 = this.rng.next() * 37, T2 = new P(), E2 = new N(), D2 = new N();
      for (let e5 = 0; e5 < r2.count; e5 += 1) {
        FO.fromBufferAttribute(r2, e5).multiply(zO), this.tex.push(FO.x * x2 + S2, FO.y * x2 + C2, FO.z * x2 + w2), FO.applyQuaternion(RO).add(LO), this.pos.push(FO.x, FO.y, FO.z), IO.fromBufferAttribute(i2, e5), IO.set(IO.x / zO.x, IO.y / zO.y, IO.z / zO.z).normalize().applyQuaternion(RO), this.nrm.push(IO.x, IO.y, IO.z), this.quat.push(RO.x, RO.y, RO.z, RO.w);
        let n3 = d2, a3 = f2, o3 = p2;
        t2.paint && (T2.setRGB(n3, a3, o3), E2.copy(FO), D2.copy(IO), t2.paint(E2, D2, T2), n3 = T2.r, a3 = T2.g, o3 = T2.b), this.col.push(n3, a3, o3);
        let s3 = typeof g2 == `function` ? g2(FO) : g2;
        this.mat.push(m2, h2, s3, _2), this.flags.push(b2);
      }
      if (e4.index) {
        let t3 = e4.index;
        for (let e5 = 0; e5 < t3.count; e5 += 3) {
          let n3 = o2 + t3.getX(e5), r3 = o2 + t3.getX(e5 + 1), i3 = o2 + t3.getX(e5 + 2);
          a2 ? this.idx.push(n3, i3, r3) : this.idx.push(n3, r3, i3);
        }
      } else for (let e5 = 0; e5 < r2.count; e5 += 3) a2 ? this.idx.push(o2 + e5, o2 + e5 + 2, o2 + e5 + 1) : this.idx.push(o2 + e5, o2 + e5 + 1, o2 + e5 + 2);
      return e4.dispose(), this;
    }
    build(e4 = {}) {
      let t2 = this.pos.length / 3, n2 = new Float32Array(this.col), r2 = e4.ao ?? 0.8;
      r2 > 0 && t2 > 0 && AO(this.pos, this.nrm, this.idx, this.flags, n2, r2, e4.aoRadius, e4.ground ?? true, e4.groundY ?? 0);
      let i2 = new Qi();
      return i2.setAttribute(`position`, new Bi(this.pos, 3)), i2.setAttribute(`normal`, new Bi(this.nrm, 3)), i2.setAttribute(`color`, new Bi(n2, 3)), i2.setAttribute(`aMat`, new Bi(this.mat, 4)), i2.setAttribute(`aTex`, new Bi(this.tex, 3)), i2.setAttribute(`aQuat`, new Bi(this.quat, 4)), i2.setIndex(t2 > 65535 ? new zi(this.idx, 1) : new Ri(this.idx, 1)), i2.computeBoundingBox(), i2.computeBoundingSphere(), i2;
    }
  }, HO = (() => {
    let e4 = [], t2 = Math.PI * (3 - Math.sqrt(5));
    for (let n2 = 0; n2 < 14; n2 += 1) {
      let r2 = (n2 + 0.5) / 14, i2 = Math.sqrt(r2), a2 = n2 * t2, o2 = Math.cos(a2) * i2, s2 = Math.sin(a2) * i2;
      e4.push([o2, s2, Math.sqrt(Math.max(0, 1 - r2))]);
    }
    return e4;
  })();
}));
function WO(e4) {
  return e4 * e4 * e4 * (e4 * (e4 * 6 - 15) + 10);
}
function GO(e4, t2, n2, r2) {
  let i2 = e4 & 15, a2 = i2 < 8 ? t2 : n2, o2 = i2 < 4 ? n2 : i2 === 12 || i2 === 14 ? t2 : r2;
  return (i2 & 1 ? -a2 : a2) + (i2 & 2 ? -o2 : o2);
}
function KO(e4, t2, n2, r2 = 0) {
  r2 && (e4 += r2 * 17.13, t2 += r2 * 7.71, n2 += r2 * 11.37);
  let i2 = Math.floor(e4), a2 = Math.floor(t2), o2 = Math.floor(n2), s2 = i2 & 255, c2 = a2 & 255, l2 = o2 & 255;
  e4 -= i2, t2 -= a2, n2 -= o2;
  let u2 = WO(e4), d2 = WO(t2), f2 = WO(n2), p2 = XO[s2] + c2, m2 = XO[p2] + l2, h2 = XO[p2 + 1] + l2, g2 = XO[s2 + 1] + c2, _2 = XO[g2] + l2, v2 = XO[g2 + 1] + l2, y2 = GO(XO[m2], e4, t2, n2) + u2 * (GO(XO[_2], e4 - 1, t2, n2) - GO(XO[m2], e4, t2, n2)), b2 = GO(XO[h2], e4, t2 - 1, n2) + u2 * (GO(XO[v2], e4 - 1, t2 - 1, n2) - GO(XO[h2], e4, t2 - 1, n2)), x2 = GO(XO[m2 + 1], e4, t2, n2 - 1) + u2 * (GO(XO[_2 + 1], e4 - 1, t2, n2 - 1) - GO(XO[m2 + 1], e4, t2, n2 - 1)), S2 = GO(XO[h2 + 1], e4, t2 - 1, n2 - 1) + u2 * (GO(XO[v2 + 1], e4 - 1, t2 - 1, n2 - 1) - GO(XO[h2 + 1], e4, t2 - 1, n2 - 1)), C2 = y2 + d2 * (b2 - y2);
  return (C2 + f2 * (x2 + d2 * (S2 - x2) - C2)) * 0.97;
}
function qO(e4, t2, n2, r2 = 3, i2 = 0, a2 = 2.03, o2 = 0.5) {
  let s2 = 1, c2 = 1, l2 = 0, u2 = 0;
  for (let d2 = 0; d2 < r2; d2 += 1) l2 += KO(e4 * c2, t2 * c2, n2 * c2, i2 + d2 * 3.1) * s2, u2 += s2, s2 *= o2, c2 *= a2;
  return l2 / u2;
}
function JO(e4, t2, n2, r2 = 3, i2 = 0) {
  let a2 = 1, o2 = 1, s2 = 0, c2 = 0;
  for (let l2 = 0; l2 < r2; l2 += 1) {
    let r3 = 1 - Math.abs(KO(e4 * o2, t2 * o2, n2 * o2, i2 + l2 * 5.3));
    s2 += r3 * r3 * a2, c2 += a2, a2 *= 0.5, o2 *= 2.1;
  }
  return s2 / c2;
}
function YO(e4, t2, n2) {
  let r2 = Math.min(1, Math.max(0, (n2 - e4) / (t2 - e4)));
  return r2 * r2 * (3 - 2 * r2);
}
var XO, ZO = t((() => {
  XO = new Uint8Array(512), (() => {
    let e4 = new Uint8Array(256);
    for (let t3 = 0; t3 < 256; t3 += 1) e4[t3] = t3;
    let t2 = 1337;
    for (let n2 = 255; n2 > 0; --n2) {
      t2 = Math.imul(t2, 1103515245) + 12345 >>> 0;
      let r2 = t2 % (n2 + 1), i2 = e4[n2];
      e4[n2] = e4[r2], e4[r2] = i2;
    }
    for (let t3 = 0; t3 < 512; t3 += 1) XO[t3] = e4[t3 & 255];
  })();
})), QO, $O, ek, tk, nk, rk, ik, ak, ok, sk, ck, lk, uk = t((() => {
  Ed(), QO = 0, $O = 1, ek = new N(), tk = new sc(), nk = new Ya(), rk = new N(), ik = new yi(), ak = class {
    constructor() {
      this.tolerance = -1, this.faces = [], this.newFaces = [], this.assigned = new lk(), this.unassigned = new lk(), this.vertices = [];
    }
    setFromPoints(e4) {
      if (e4.length >= 4) {
        this.makeEmpty();
        for (let t2 = 0, n2 = e4.length; t2 < n2; t2++) this.vertices.push(new ck(e4[t2]));
        this._compute();
      }
      return this;
    }
    setFromObject(e4) {
      let t2 = [];
      return e4.updateMatrixWorld(true), e4.traverse(function(e5) {
        let n2 = e5.geometry;
        if (n2 !== void 0) {
          let r2 = n2.attributes.position;
          if (r2 !== void 0) for (let n3 = 0, i2 = r2.count; n3 < i2; n3++) {
            let i3 = new N();
            i3.fromBufferAttribute(r2, n3).applyMatrix4(e5.matrixWorld), t2.push(i3);
          }
        }
      }), this.setFromPoints(t2);
    }
    containsPoint(e4) {
      let t2 = this.faces;
      for (let n2 = 0, r2 = t2.length; n2 < r2; n2++) if (t2[n2].distanceToPoint(e4) > this.tolerance) return false;
      return true;
    }
    intersectRay(e4, t2) {
      let n2 = this.faces, r2 = -1 / 0, i2 = 1 / 0;
      for (let t3 = 0, a2 = n2.length; t3 < a2; t3++) {
        let a3 = n2[t3], o2 = a3.distanceToPoint(e4.origin), s2 = a3.normal.dot(e4.direction);
        if (o2 > 0 && s2 >= 0) return null;
        let c2 = s2 === 0 ? 0 : -o2 / s2;
        if (!(c2 <= 0) && (s2 > 0 ? i2 = Math.min(c2, i2) : r2 = Math.max(c2, r2), r2 > i2)) return null;
      }
      return r2 === -1 / 0 ? e4.at(i2, t2) : e4.at(r2, t2), t2;
    }
    intersectsRay(e4) {
      return this.intersectRay(e4, ek) !== null;
    }
    makeEmpty() {
      return this.faces = [], this.vertices = [], this;
    }
    _addVertexToFace(e4, t2) {
      return e4.face = t2, t2.outside === null ? this.assigned.append(e4) : this.assigned.insertBefore(t2.outside, e4), t2.outside = e4, this;
    }
    _removeVertexFromFace(e4, t2) {
      return e4 === t2.outside && (e4.next !== null && e4.next.face === t2 ? t2.outside = e4.next : t2.outside = null), this.assigned.remove(e4), this;
    }
    _removeAllVerticesFromFace(e4) {
      if (e4.outside !== null) {
        let t2 = e4.outside, n2 = e4.outside;
        for (; n2.next !== null && n2.next.face === e4; ) n2 = n2.next;
        return this.assigned.removeSubList(t2, n2), t2.prev = n2.next = null, e4.outside = null, t2;
      }
    }
    _deleteFaceVertices(e4, t2) {
      let n2 = this._removeAllVerticesFromFace(e4);
      if (n2 !== void 0) if (t2 === void 0) this.unassigned.appendChain(n2);
      else {
        let e5 = n2;
        do {
          let n3 = e5.next;
          t2.distanceToPoint(e5.point) > this.tolerance ? this._addVertexToFace(e5, t2) : this.unassigned.append(e5), e5 = n3;
        } while (e5 !== null);
      }
      return this;
    }
    _resolveUnassignedPoints(e4) {
      if (this.unassigned.isEmpty() === false) {
        let t2 = this.unassigned.first();
        do {
          let n2 = t2.next, r2 = this.tolerance, i2 = null;
          for (let n3 = 0; n3 < e4.length; n3++) {
            let a2 = e4[n3];
            if (a2.mark === QO) {
              let e5 = a2.distanceToPoint(t2.point);
              if (e5 > r2 && (r2 = e5, i2 = a2), r2 > 1e3 * this.tolerance) break;
            }
          }
          i2 !== null && this._addVertexToFace(t2, i2), t2 = n2;
        } while (t2 !== null);
      }
      return this;
    }
    _computeExtremes() {
      let e4 = new N(), t2 = new N(), n2 = [], r2 = [];
      for (let e5 = 0; e5 < 3; e5++) n2[e5] = r2[e5] = this.vertices[0];
      e4.copy(this.vertices[0].point), t2.copy(this.vertices[0].point);
      for (let i2 = 0, a2 = this.vertices.length; i2 < a2; i2++) {
        let a3 = this.vertices[i2], o2 = a3.point;
        for (let t3 = 0; t3 < 3; t3++) o2.getComponent(t3) < e4.getComponent(t3) && (e4.setComponent(t3, o2.getComponent(t3)), n2[t3] = a3);
        for (let e5 = 0; e5 < 3; e5++) o2.getComponent(e5) > t2.getComponent(e5) && (t2.setComponent(e5, o2.getComponent(e5)), r2[e5] = a3);
      }
      return this.tolerance = 3 * 2 ** -52 * (Math.max(Math.abs(e4.x), Math.abs(t2.x)) + Math.max(Math.abs(e4.y), Math.abs(t2.y)) + Math.max(Math.abs(e4.z), Math.abs(t2.z))), { min: n2, max: r2 };
    }
    _computeInitialHull() {
      let e4 = this.vertices, t2 = this._computeExtremes(), n2 = t2.min, r2 = t2.max, i2 = 0, a2 = 0;
      for (let e5 = 0; e5 < 3; e5++) {
        let t3 = r2[e5].point.getComponent(e5) - n2[e5].point.getComponent(e5);
        t3 > i2 && (i2 = t3, a2 = e5);
      }
      let o2 = n2[a2], s2 = r2[a2], c2, l2;
      i2 = 0, tk.set(o2.point, s2.point);
      for (let t3 = 0, n3 = this.vertices.length; t3 < n3; t3++) {
        let n4 = e4[t3];
        if (n4 !== o2 && n4 !== s2) {
          tk.closestPointToPoint(n4.point, true, rk);
          let e5 = rk.distanceToSquared(n4.point);
          e5 > i2 && (i2 = e5, c2 = n4);
        }
      }
      i2 = -1, nk.setFromCoplanarPoints(o2.point, s2.point, c2.point);
      for (let t3 = 0, n3 = this.vertices.length; t3 < n3; t3++) {
        let n4 = e4[t3];
        if (n4 !== o2 && n4 !== s2 && n4 !== c2) {
          let e5 = Math.abs(nk.distanceToPoint(n4.point));
          e5 > i2 && (i2 = e5, l2 = n4);
        }
      }
      let u2 = [];
      if (nk.distanceToPoint(l2.point) < 0) {
        u2.push(ok.create(o2, s2, c2), ok.create(l2, s2, o2), ok.create(l2, c2, s2), ok.create(l2, o2, c2));
        for (let e5 = 0; e5 < 3; e5++) {
          let t3 = (e5 + 1) % 3;
          u2[e5 + 1].getEdge(2).setTwin(u2[0].getEdge(t3)), u2[e5 + 1].getEdge(1).setTwin(u2[t3 + 1].getEdge(0));
        }
      } else {
        u2.push(ok.create(o2, c2, s2), ok.create(l2, o2, s2), ok.create(l2, s2, c2), ok.create(l2, c2, o2));
        for (let e5 = 0; e5 < 3; e5++) {
          let t3 = (e5 + 1) % 3;
          u2[e5 + 1].getEdge(2).setTwin(u2[0].getEdge((3 - e5) % 3)), u2[e5 + 1].getEdge(0).setTwin(u2[t3 + 1].getEdge(1));
        }
      }
      for (let e5 = 0; e5 < 4; e5++) this.faces.push(u2[e5]);
      for (let t3 = 0, n3 = e4.length; t3 < n3; t3++) {
        let n4 = e4[t3];
        if (n4 !== o2 && n4 !== s2 && n4 !== c2 && n4 !== l2) {
          i2 = this.tolerance;
          let e5 = null;
          for (let t4 = 0; t4 < 4; t4++) {
            let r3 = this.faces[t4].distanceToPoint(n4.point);
            r3 > i2 && (i2 = r3, e5 = this.faces[t4]);
          }
          e5 !== null && this._addVertexToFace(n4, e5);
        }
      }
      return this;
    }
    _reindexFaces() {
      let e4 = [];
      for (let t2 = 0; t2 < this.faces.length; t2++) {
        let n2 = this.faces[t2];
        n2.mark === QO && e4.push(n2);
      }
      return this.faces = e4, this;
    }
    _nextVertexToAdd() {
      if (this.assigned.isEmpty() === false) {
        let e4, t2 = 0, n2 = this.assigned.first().face, r2 = n2.outside;
        do {
          let i2 = n2.distanceToPoint(r2.point);
          i2 > t2 && (t2 = i2, e4 = r2), r2 = r2.next;
        } while (r2 !== null && r2.face === n2);
        return e4;
      }
    }
    _computeHorizon(e4, t2, n2, r2) {
      this._deleteFaceVertices(n2), n2.mark = $O;
      let i2;
      i2 = t2 === null ? t2 = n2.getEdge(0) : t2.next;
      do {
        let t3 = i2.twin, n3 = t3.face;
        n3.mark === QO && (n3.distanceToPoint(e4) > this.tolerance ? this._computeHorizon(e4, t3, n3, r2) : r2.push(i2)), i2 = i2.next;
      } while (i2 !== t2);
      return this;
    }
    _addAdjoiningFace(e4, t2) {
      let n2 = ok.create(e4, t2.tail(), t2.head());
      return this.faces.push(n2), n2.getEdge(-1).setTwin(t2.twin), n2.getEdge(0);
    }
    _addNewFaces(e4, t2) {
      this.newFaces = [];
      let n2 = null, r2 = null;
      for (let i2 = 0; i2 < t2.length; i2++) {
        let a2 = t2[i2], o2 = this._addAdjoiningFace(e4, a2);
        n2 === null ? n2 = o2 : o2.next.setTwin(r2), this.newFaces.push(o2.face), r2 = o2;
      }
      return n2.next.setTwin(r2), this;
    }
    _addVertexToHull(e4) {
      let t2 = [];
      return this.unassigned.clear(), this._removeVertexFromFace(e4, e4.face), this._computeHorizon(e4.point, null, e4.face, t2), this._addNewFaces(e4, t2), this._resolveUnassignedPoints(this.newFaces), this;
    }
    _cleanup() {
      return this.assigned.clear(), this.unassigned.clear(), this.newFaces = [], this;
    }
    _compute() {
      let e4;
      for (this._computeInitialHull(); (e4 = this._nextVertexToAdd()) !== void 0; ) this._addVertexToHull(e4);
      return this._reindexFaces(), this._cleanup(), this;
    }
  }, ok = class e4 {
    constructor() {
      this.normal = new N(), this.midpoint = new N(), this.area = 0, this.constant = 0, this.outside = null, this.mark = QO, this.edge = null;
    }
    static create(t2, n2, r2) {
      let i2 = new e4(), a2 = new sk(t2, i2), o2 = new sk(n2, i2), s2 = new sk(r2, i2);
      return a2.next = s2.prev = o2, o2.next = a2.prev = s2, s2.next = o2.prev = a2, i2.edge = a2, i2.compute();
    }
    getEdge(e5) {
      let t2 = this.edge;
      for (; e5 > 0; ) t2 = t2.next, e5--;
      for (; e5 < 0; ) t2 = t2.prev, e5++;
      return t2;
    }
    compute() {
      let e5 = this.edge.tail(), t2 = this.edge.head(), n2 = this.edge.next.head();
      return ik.set(e5.point, t2.point, n2.point), ik.getNormal(this.normal), ik.getMidpoint(this.midpoint), this.area = ik.getArea(), this.constant = this.normal.dot(this.midpoint), this;
    }
    distanceToPoint(e5) {
      return this.normal.dot(e5) - this.constant;
    }
  }, sk = class {
    constructor(e4, t2) {
      this.vertex = e4, this.prev = null, this.next = null, this.twin = null, this.face = t2;
    }
    head() {
      return this.vertex;
    }
    tail() {
      return this.prev ? this.prev.vertex : null;
    }
    length() {
      let e4 = this.head(), t2 = this.tail();
      return t2 === null ? -1 : t2.point.distanceTo(e4.point);
    }
    lengthSquared() {
      let e4 = this.head(), t2 = this.tail();
      return t2 === null ? -1 : t2.point.distanceToSquared(e4.point);
    }
    setTwin(e4) {
      return this.twin = e4, e4.twin = this, this;
    }
  }, ck = class {
    constructor(e4) {
      this.point = e4, this.prev = null, this.next = null, this.face = null;
    }
  }, lk = class {
    constructor() {
      this.head = null, this.tail = null;
    }
    first() {
      return this.head;
    }
    last() {
      return this.tail;
    }
    clear() {
      return this.head = this.tail = null, this;
    }
    insertBefore(e4, t2) {
      return t2.prev = e4.prev, t2.next = e4, t2.prev === null ? this.head = t2 : t2.prev.next = t2, e4.prev = t2, this;
    }
    insertAfter(e4, t2) {
      return t2.prev = e4, t2.next = e4.next, t2.next === null ? this.tail = t2 : t2.next.prev = t2, e4.next = t2, this;
    }
    append(e4) {
      return this.head === null ? this.head = e4 : this.tail.next = e4, e4.prev = this.tail, e4.next = null, this.tail = e4, this;
    }
    appendChain(e4) {
      for (this.head === null ? this.head = e4 : this.tail.next = e4, e4.prev = this.tail; e4.next !== null; ) e4 = e4.next;
      return this.tail = e4, this;
    }
    remove(e4) {
      return e4.prev === null ? this.head = e4.next : e4.prev.next = e4.next, e4.next === null ? this.tail = e4.prev : e4.next.prev = e4.prev, this;
    }
    removeSubList(e4, t2) {
      return e4.prev === null ? this.head = t2.next : e4.prev.next = t2.next, t2.next === null ? this.tail = e4.prev : t2.next.prev = e4.prev, this;
    }
    isEmpty() {
      return this.head === null;
    }
  };
})), dk, fk = t((() => {
  Ed(), uk(), dk = class extends Qi {
    constructor(e4 = []) {
      super();
      let t2 = [], n2 = [], r2 = new ak().setFromPoints(e4).faces;
      for (let e5 = 0; e5 < r2.length; e5++) {
        let i2 = r2[e5], a2 = i2.edge;
        do {
          let e6 = a2.head().point;
          t2.push(e6.x, e6.y, e6.z), n2.push(i2.normal.x, i2.normal.y, i2.normal.z), a2 = a2.next;
        } while (a2 !== i2.edge);
      }
      this.setAttribute(`position`, new Bi(t2, 3)), this.setAttribute(`normal`, new Bi(n2, 3));
    }
  };
}));
function pk(e4) {
  let t2 = new dk(e4);
  return t2.deleteAttribute(`uv`), t2;
}
function mk(e4, t2, n2, r2) {
  let i2 = e4 / 2, a2 = t2 / 2, o2 = n2 / 2, s2 = Math.min(r2, i2 * 0.9), c2 = Math.min(r2, a2 * 0.9), l2 = Math.min(r2, o2 * 0.9), u2 = [];
  for (let e5 of [-1, 1]) for (let t3 of [-1, 1]) for (let n3 of [-1, 1]) u2.push(Ok(e5 * i2, t3 * (a2 - c2), n3 * (o2 - l2))), u2.push(Ok(e5 * (i2 - s2), t3 * a2, n3 * (o2 - l2))), u2.push(Ok(e5 * (i2 - s2), t3 * (a2 - c2), n3 * o2));
  return u2;
}
function Y(e4, t2, n2, r2 = Math.min(e4, t2, n2) * 0.15) {
  return pk(mk(e4, t2, n2, r2));
}
function hk(e4, t2, n2, r2, i2 = 0.3, a2) {
  let o2 = new Id(r2 * 31 + 7), s2 = a2 ?? Math.min(e4, t2, n2) * 0.16, c2 = mk(e4, t2, n2, s2);
  for (let r3 = 0; r3 < c2.length; r3 += 3) {
    let a3 = o2.next() < i2 ? o2.range(0.25, 0.6) * Math.min(e4, t2, n2) : 0;
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let t3 = c2[r3 + e5];
      if (t3.x += (o2.next() - 0.5) * s2 * 0.9, t3.y += (o2.next() - 0.5) * s2 * 0.9, t3.z += (o2.next() - 0.5) * s2 * 0.9, a3 > 0) {
        let e6 = t3.length();
        t3.multiplyScalar(Math.max(0.4, (e6 - a3 * (0.6 + 0.4 * o2.next())) / e6));
      }
    }
  }
  return pk(c2);
}
function gk(e4, t2, n2, r2 = 8, i2 = 1, a2 = false) {
  let o2 = new co(e4, t2, n2, r2, i2, a2);
  return o2.deleteAttribute(`uv`), o2;
}
function _k(e4, t2, n2, r2, i2 = 8, a2 = 1, o2 = false) {
  let s2 = gk(t2, e4, r2 - n2, i2, a2, o2);
  return s2.translate(0, (n2 + r2) / 2, 0), s2;
}
function vk(e4, t2 = 8, n2 = 6) {
  let r2 = new Ho(e4, t2, n2);
  return r2.deleteAttribute(`uv`), r2;
}
function yk(e4, t2, n2 = 6) {
  let r2 = new lo(e4, t2, n2, 1, false);
  return r2.deleteAttribute(`uv`), r2.translate(0, t2 / 2, 0), r2;
}
function bk(e4, t2, n2 = 6, r2 = {}) {
  let i2 = e4.length, a2 = (e5) => {
    let n3 = e5 / (i2 - 1);
    return typeof t2 == `number` ? t2 : typeof t2 == `function` ? t2(n3) : t2[Math.min(t2.length - 1, e5)];
  }, o2 = [];
  for (let t3 = 0; t3 < i2; t3 += 1) {
    let n3 = e4[Math.max(0, t3 - 1)], r3 = e4[Math.min(i2 - 1, t3 + 1)];
    o2.push(r3.clone().sub(n3).normalize());
  }
  let s2 = [], c2 = o2[0], l2 = Math.abs(c2.y) < 0.9 ? Ok(0, 1, 0) : Ok(1, 0, 0);
  s2.push(l2.clone().cross(c2).normalize());
  let u2 = new ir();
  for (let e5 = 1; e5 < i2; e5 += 1) u2.setFromUnitVectors(o2[e5 - 1], o2[e5]), s2.push(s2[e5 - 1].clone().applyQuaternion(u2).normalize());
  let d2 = [], f2 = [], p2 = r2.seed ?? 0, m2 = r2.bumps ?? 0, h2 = r2.bumpFreq ?? 3, g2 = r2.flat ?? 1, _2 = (t3) => {
    let r3 = o2[t3].clone().cross(s2[t3]), i3 = [], c3 = a2(t3);
    for (let a3 = 0; a3 < n2; a3 += 1) {
      let o3 = a3 / n2 * Math.PI * 2, l3 = s2[t3].clone().multiplyScalar(Math.cos(o3) * g2).addScaledVector(r3, Math.sin(o3)), u3 = c3;
      if (m2 > 0) {
        let n3 = e4[t3];
        u3 *= 1 + KO(n3.x * h2 + l3.x, n3.y * h2 + l3.y, n3.z * h2 + l3.z, p2) * m2;
      }
      i3.push(e4[t3].clone().addScaledVector(l3, u3));
    }
    return i3;
  }, v2 = [];
  for (let e5 = 0; e5 < i2; e5 += 1) v2.push(_2(e5));
  for (let e5 of v2) for (let t3 of e5) d2.push(t3.x, t3.y, t3.z);
  for (let e5 = 0; e5 < i2 - 1; e5 += 1) for (let t3 = 0; t3 < n2; t3 += 1) {
    let r3 = e5 * n2 + t3, i3 = e5 * n2 + (t3 + 1) % n2, a3 = (e5 + 1) * n2 + t3, o3 = (e5 + 1) * n2 + (t3 + 1) % n2;
    f2.push(r3, i3, a3, i3, o3, a3);
  }
  let y2 = new Qi();
  y2.setAttribute(`position`, new Bi(d2, 3)), y2.setIndex(f2), y2.computeVertexNormals();
  let b2 = [y2], x2 = (t3, r3, i3) => {
    let a3 = v2[t3], s3 = e4[t3].clone().addScaledVector(o2[t3], r3 ? -i3 : i3), c3 = [], l3 = [];
    c3.push(s3.x, s3.y, s3.z);
    for (let e5 of a3) c3.push(e5.x, e5.y, e5.z);
    for (let e5 = 0; e5 < n2; e5 += 1) {
      let t4 = 1 + e5, i4 = 1 + (e5 + 1) % n2;
      r3 ? l3.push(0, i4, t4) : l3.push(0, t4, i4);
    }
    let u3 = new Qi();
    u3.setAttribute(`position`, new Bi(c3, 3)), u3.setIndex(l3), u3 = u3.toNonIndexed(), u3.computeVertexNormals(), b2.push(u3);
  };
  return (r2.capStart || r2.pointStart) && x2(0, true, r2.pointStart ?? 0), (r2.capEnd || r2.pointEnd) && x2(i2 - 1, false, r2.pointEnd ?? 0), b2.length === 1 ? y2 : xk(b2);
}
function xk(e4) {
  let t2 = [], n2 = [], r2 = [];
  for (let i3 of e4) {
    let e5 = i3.getAttribute(`position`);
    i3.getAttribute(`normal`) || i3.computeVertexNormals();
    let a2 = i3.getAttribute(`normal`), o2 = t2.length / 3;
    for (let r3 = 0; r3 < e5.count; r3 += 1) t2.push(e5.getX(r3), e5.getY(r3), e5.getZ(r3)), n2.push(a2.getX(r3), a2.getY(r3), a2.getZ(r3));
    if (i3.index) for (let e6 = 0; e6 < i3.index.count; e6 += 1) r2.push(o2 + i3.index.getX(e6));
    else for (let t3 = 0; t3 < e5.count; t3 += 1) r2.push(o2 + t3);
    i3.dispose();
  }
  let i2 = new Qi();
  return i2.setAttribute(`position`, new Bi(t2, 3)), i2.setAttribute(`normal`, new Bi(n2, 3)), i2.setIndex(r2), i2;
}
function Sk(e4, t2 = 12, n2 = 0) {
  let r2 = new Ro(e4.map(([e5, t3]) => new M(Math.max(1e-4, e5), t3)), t2, n2);
  return r2.deleteAttribute(`uv`), r2;
}
function Ck(e4, t2, n2, r2 = true, i2 = false) {
  let a2 = [], o2 = [], s2 = i2 ? e4 : e4 + 1;
  for (let r3 = 0; r3 <= t2; r3 += 1) for (let i3 = 0; i3 < s2; i3 += 1) {
    let o3 = n2(i3 / e4, r3 / t2);
    a2.push(o3.x, o3.y, o3.z);
  }
  for (let n3 = 0; n3 < t2; n3 += 1) for (let t3 = 0; t3 < e4; t3 += 1) {
    let e5 = n3 * s2 + t3, r3 = n3 * s2 + (t3 + 1) % s2, i3 = (n3 + 1) * s2 + t3, a3 = (n3 + 1) * s2 + (t3 + 1) % s2;
    o2.push(e5, r3, i3, r3, a3, i3);
  }
  let c2 = new Qi();
  return c2.setAttribute(`position`, new Bi(a2, 3)), c2.setIndex(o2), c2.computeVertexNormals(), r2 ? wk(c2) : c2;
}
function wk(e4, t2 = 4e-3) {
  let n2 = e4.getAttribute(`position`), r2 = e4.getAttribute(`normal`), i2 = e4.index, a2 = [], o2 = [], s2 = [], c2 = n2.count;
  for (let e5 = 0; e5 < c2; e5 += 1) a2.push(n2.getX(e5), n2.getY(e5), n2.getZ(e5)), o2.push(r2.getX(e5), r2.getY(e5), r2.getZ(e5));
  for (let e5 = 0; e5 < c2; e5 += 1) a2.push(n2.getX(e5) - r2.getX(e5) * t2, n2.getY(e5) - r2.getY(e5) * t2, n2.getZ(e5) - r2.getZ(e5) * t2), o2.push(-r2.getX(e5), -r2.getY(e5), -r2.getZ(e5));
  for (let e5 = 0; e5 < i2.count; e5 += 1) s2.push(i2.getX(e5));
  for (let e5 = 0; e5 < i2.count; e5 += 3) s2.push(c2 + i2.getX(e5), c2 + i2.getX(e5 + 2), c2 + i2.getX(e5 + 1));
  let l2 = new Qi();
  return l2.setAttribute(`position`, new Bi(a2, 3)), l2.setAttribute(`normal`, new Bi(o2, 3)), l2.setIndex(s2), e4.dispose(), l2;
}
function Tk(e4, t2, n2, r2, i2 = {}) {
  let a2 = new Id(e4 * 101 + 3), o2 = new Lo(1, i2.detail ?? 2);
  o2.deleteAttribute(`uv`), o2.deleteAttribute(`normal`), o2 = K_(o2);
  let s2 = o2.getAttribute(`position`), c2 = i2.rough ?? 0.28, l2 = i2.ridge ?? 0.12, u2 = [], d2 = i2.cuts ?? 5;
  for (let e5 = 0; e5 < d2; e5 += 1) {
    let e6 = a2.range(0, Math.PI * 2), t3 = a2.range(-0.35, 0.95), n3 = Ok(Math.cos(e6) * Math.cos(t3), Math.sin(t3), Math.sin(e6) * Math.cos(t3)).normalize();
    u2.push({ n: n3, d: a2.range(0.55, 0.85) });
  }
  let f2 = new N(), p2 = e4 * 1.37;
  for (let e5 = 0; e5 < s2.count; e5 += 1) {
    f2.fromBufferAttribute(s2, e5);
    let i3 = qO(f2.x * 1.1 + p2, f2.y * 1.1, f2.z * 1.1 - p2, 3) * c2 + (JO(f2.x * 2.3 - p2, f2.y * 2.3, f2.z * 2.3 + p2, 2) - 0.5) * l2;
    f2.multiplyScalar(1 + i3);
    for (let e6 of u2) {
      let t3 = f2.dot(e6.n) - e6.d;
      t3 > 0 && f2.addScaledVector(e6.n, -t3 * 0.92);
    }
    f2.set(f2.x * t2, f2.y * n2, f2.z * r2), s2.setXYZ(e5, f2.x, f2.y, f2.z);
  }
  let m2 = i2.sink ?? 0.12 * n2;
  if (i2.flatBottom !== false) {
    let e5 = -n2 * 0.3;
    for (let t3 = 0; t3 < s2.count; t3 += 1) {
      let n3 = s2.getY(t3);
      n3 < e5 && (n3 = e5 + (n3 - e5) * 0.12), s2.setY(t3, n3 - e5 - m2);
    }
  }
  o2.computeVertexNormals();
  let h2 = q_(o2, (i2.crease ?? 38) * Math.PI / 180);
  return o2.dispose(), h2;
}
function Ek(e4, t2, n2, r2, i2 = 0.2, a2 = 2, o2 = 1.6) {
  let s2 = new Lo(1, a2);
  s2.deleteAttribute(`uv`), s2.deleteAttribute(`normal`), s2 = K_(s2);
  let c2 = s2.getAttribute(`position`), l2 = new N();
  for (let a3 = 0; a3 < c2.count; a3 += 1) {
    l2.fromBufferAttribute(c2, a3);
    let s3 = qO(l2.x * o2 + e4, l2.y * o2, l2.z * o2 - e4, 3) * i2;
    l2.multiplyScalar(1 + s3), c2.setXYZ(a3, l2.x * t2, l2.y * n2, l2.z * r2);
  }
  return s2.computeVertexNormals(), s2;
}
function Dk(e4, t2, n2 = 0.02, r2 = 6, i2 = 1) {
  let a2 = new Fo(e4, { depth: t2, bevelEnabled: n2 > 0, bevelThickness: n2, bevelSize: n2, bevelSegments: i2, curveSegments: r2 });
  return a2.deleteAttribute(`uv`), a2.translate(0, 0, -t2 / 2), a2;
}
var Ok, kk = t((() => {
  Ed(), fk(), J_(), Ld(), ZO(), Ok = (e4, t2, n2) => new N(e4, t2, n2);
}));
function Ak(e4) {
  return e4 < 0 ? 0 : e4 > 1 ? 1 : e4;
}
function jk(e4) {
  let t2 = new P(e4);
  return t2.convertLinearToSRGB(), [t2.r, t2.g, t2.b];
}
function Mk(e4, t2, n2) {
  return [e4[0] + (t2[0] - e4[0]) * n2, e4[1] + (t2[1] - e4[1]) * n2, e4[2] + (t2[2] - e4[2]) * n2];
}
function Nk(e4, t2, n2, r2) {
  let i2 = new Uint8Array(e4 * e4 * 4), a2 = (n3, r3) => t2[(r3 + e4) % e4 * e4 + (n3 + e4) % e4];
  for (let n3 = 0; n3 < e4; n3 += 1) for (let o2 = 0; o2 < e4; o2 += 1) {
    let s2 = a2(o2 + 1, n3 - 1) + 2 * a2(o2 + 1, n3) + a2(o2 + 1, n3 + 1) - (a2(o2 - 1, n3 - 1) + 2 * a2(o2 - 1, n3) + a2(o2 - 1, n3 + 1)), c2 = a2(o2 - 1, n3 + 1) + 2 * a2(o2, n3 + 1) + a2(o2 + 1, n3 + 1) - (a2(o2 - 1, n3 - 1) + 2 * a2(o2, n3 - 1) + a2(o2 + 1, n3 - 1)), l2 = -s2 * r2, u2 = -c2 * r2, d2 = 1, f2 = Math.hypot(l2, u2, d2);
    l2 /= f2, u2 /= f2, d2 /= f2;
    let p2 = (n3 * e4 + o2) * 4;
    i2[p2] = (l2 * 0.5 + 0.5) * 255, i2[p2 + 1] = (u2 * 0.5 + 0.5) * 255, i2[p2 + 2] = (d2 * 0.5 + 0.5) * 255, i2[p2 + 3] = Ak(t2[n3 * e4 + o2]) * 255;
  }
  return { albedo: n2, normal: i2 };
}
function Pk(e4, t2, n2, r2) {
  e4[t2 * 4] = Math.round(Ak(n2[0]) * 255), e4[t2 * 4 + 1] = Math.round(Ak(n2[1]) * 255), e4[t2 * 4 + 2] = Math.round(Ak(n2[2]) * 255), e4[t2 * 4 + 3] = Math.round(Ak(r2) * 255);
}
function Fk(e4, t2 = 256) {
  let n2 = `${e4}:${t2}`, r2 = zk.get(n2);
  return r2 || (r2 = Rk[e4](t2), zk.set(n2, r2)), r2;
}
var Ik, Lk, Rk, zk, Bk = t((() => {
  Ed(), Ld(), Ik = class {
    px;
    py;
    v;
    constructor(e4, t2, n2) {
      this.px = e4, this.py = t2;
      let r2 = new Id(n2);
      this.v = new Float32Array(e4 * t2);
      for (let e5 = 0; e5 < this.v.length; e5 += 1) this.v[e5] = r2.next();
    }
    sample(e4, t2) {
      let n2 = e4 * this.px, r2 = t2 * this.py, i2 = Math.floor(n2), a2 = Math.floor(r2), o2 = n2 - i2, s2 = r2 - a2, c2 = o2 * o2 * (3 - 2 * o2), l2 = s2 * s2 * (3 - 2 * s2), u2 = (i2 % this.px + this.px) % this.px, d2 = (a2 % this.py + this.py) % this.py, f2 = (u2 + 1) % this.px, p2 = (d2 + 1) % this.py, m2 = this.v[d2 * this.px + u2], h2 = this.v[d2 * this.px + f2], g2 = this.v[p2 * this.px + u2], _2 = this.v[p2 * this.px + f2];
      return m2 + (h2 - m2) * c2 + (g2 - m2) * l2 + (m2 - h2 - g2 + _2) * c2 * l2;
    }
  }, Lk = class {
    o = [];
    constructor(e4, t2, n2, r2) {
      for (let i2 = 0; i2 < n2; i2 += 1) this.o.push(new Ik(e4 << i2, t2 << i2, r2 * 977 + i2 * 131));
    }
    fbm(e4, t2, n2 = 0.5) {
      let r2 = 1, i2 = 0, a2 = 0;
      for (let o2 of this.o) i2 += o2.sample(e4, t2) * r2, a2 += r2, r2 *= n2;
      return i2 / a2;
    }
  }, Rk = { deadwood: (e4) => {
    let t2 = new Lk(3, 1, 4, 11), n2 = new Lk(2, 1, 5, 12), r2 = new Lk(16, 4, 3, 13), i2 = new Lk(5, 5, 4, 14), a2 = new Float32Array(e4 * e4), o2 = new Uint8Array(e4 * e4 * 4), s2 = jk(`#5d574e`), c2 = jk(`#9a9184`), l2 = jk(`#211d19`), u2 = jk(`#7d8461`);
    for (let d2 = 0; d2 < e4; d2 += 1) for (let f2 = 0; f2 < e4; f2 += 1) {
      let p2 = f2 / e4, m2 = d2 / e4, h2 = t2.fbm(p2, m2) * 2.2, g2 = (1 - Math.abs(Math.sin((p2 * 9 + h2) * Math.PI))) ** 6, _2 = Ak(1 - Math.abs(r2.fbm(p2, m2) - 0.5) * 9) ** 3 * 0.6, v2 = n2.fbm(p2, m2), y2 = Ak((i2.fbm(p2, m2) - 0.66) * 6), b2 = Ak(0.8 - g2 * 0.7 - _2 * 0.4 + (r2.fbm(p2, m2) - 0.5) * 0.15);
      a2[d2 * e4 + f2] = b2;
      let x2 = Mk(s2, c2, Ak(v2 * 1.3 - 0.1 + (r2.fbm(p2, m2) - 0.5) * 0.3));
      x2 = Mk(x2, u2, y2 * 0.65), x2 = Mk(x2, l2, Ak(g2 * 1.1 + _2)), Pk(o2, d2 * e4 + f2, x2, 0.8 + g2 * 0.15);
    }
    return Nk(e4, a2, o2, 3.2);
  }, grain: (e4) => {
    let t2 = new Lk(2, 1, 4, 21), n2 = new Lk(3, 1, 4, 22), r2 = new Lk(24, 3, 2, 23), i2 = new Id(24), a2 = [];
    for (let e5 = 0; e5 < 5; e5 += 1) a2.push({ x: i2.next(), y: i2.next(), r: i2.range(0.025, 0.05) });
    let o2 = new Float32Array(e4 * e4), s2 = new Uint8Array(e4 * e4 * 4), c2 = jk(`#4a3a2a`), l2 = jk(`#7f6850`), u2 = jk(`#2c2118`);
    for (let i3 = 0; i3 < e4; i3 += 1) for (let d2 = 0; d2 < e4; d2 += 1) {
      let f2 = d2 / e4, p2 = i3 / e4, m2 = 0, h2 = 0;
      for (let e5 of a2) {
        let t3 = f2 - e5.x, n3 = p2 - e5.y;
        t3 -= Math.round(t3), n3 -= Math.round(n3);
        let r3 = Math.hypot(t3 * 1, n3 * 0.35) / e5.r;
        if (r3 < 3) {
          let e6 = Math.exp(-r3 * r3 * 0.5);
          m2 = Math.max(m2, e6), h2 += (t3 > 0 ? 1 : -1) * e6 * 0.03;
        }
      }
      let g2 = t2.fbm(f2, p2) * 1.6 + h2 * 20, _2 = Math.sin((f2 * 26 + g2) * Math.PI), v2 = Ak(1 - Math.abs(_2)) ** 6, y2 = n2.fbm(f2, p2), b2 = r2.fbm(f2, p2), x2 = Ak((m2 - 0.75) * 6);
      o2[i3 * e4 + d2] = Ak(0.65 - v2 * 0.25 + (b2 - 0.5) * 0.25 - x2 * 0.3 + m2 * 0.1);
      let S2 = Mk(c2, l2, Ak(y2 * 1.2 - 0.05 + (b2 - 0.5) * 0.4));
      S2 = Mk(S2, u2, v2 * 0.55 + x2 * 0.7), Pk(s2, i3 * e4 + d2, S2, 0.78 + v2 * 0.1);
    }
    return Nk(e4, o2, s2, 2.4);
  }, slate: (e4) => {
    let t2 = new Lk(6, 6, 4, 31), n2 = new Id(32), r2 = [];
    for (let e5 = 0; e5 < 80; e5 += 1) r2.push(n2.next());
    let i2 = new Float32Array(e4 * e4), a2 = new Uint8Array(e4 * e4 * 4), o2 = jk(`#2f3236`), s2 = jk(`#4c4f52`), c2 = jk(`#101114`);
    for (let n3 = 0; n3 < e4; n3 += 1) for (let l2 = 0; l2 < e4; l2 += 1) {
      let u2 = l2 / e4, d2 = n3 / e4, f2 = Math.floor(d2 * 8), p2 = d2 * 8 - f2, m2 = f2 % 2 * 0.5, h2 = u2 * 5 + m2, g2 = Math.floor(h2), _2 = h2 - g2, v2 = r2[(f2 * 5 + (g2 % 5 + 5) % 5) % r2.length], y2 = t2.fbm(u2, d2), b2 = Ak((0.035 - Math.min(_2, 1 - _2)) * 40) + Ak((0.06 - (1 - p2)) * 25), x2 = Ak(0.25 + p2 * 0.6 + (y2 - 0.5) * 0.2 - b2 * 0.6);
      i2[n3 * e4 + l2] = x2;
      let S2 = Mk(o2, s2, v2 * 0.7 + y2 * 0.3);
      S2 = Mk(S2, jk(`#5a5f3e`), Ak((y2 - 0.68) * 5) * 0.5), S2 = Mk(S2, c2, Ak(b2)), Pk(a2, n3 * e4 + l2, S2, 0.55 + b2 * 0.3 + y2 * 0.1);
    }
    return Nk(e4, i2, a2, 3.5);
  }, cloth: (e4) => {
    let t2 = new Lk(4, 4, 5, 41), n2 = new Float32Array(e4 * e4), r2 = new Uint8Array(e4 * e4 * 4);
    for (let i2 = 0; i2 < e4; i2 += 1) for (let a2 = 0; a2 < e4; a2 += 1) {
      let o2 = a2 / e4, s2 = i2 / e4, c2 = Math.sin(o2 * e4 * Math.PI * 0.5) * Math.sin(s2 * e4 * Math.PI * 0.5) * 0.5 + 0.5, l2 = t2.fbm(o2, s2), u2 = Ak((l2 - 0.58) * 3);
      n2[i2 * e4 + a2] = c2 * 0.4 + l2 * 0.3;
      let d2 = 0.78 + c2 * 0.12 + (l2 - 0.5) * 0.25, f2 = [d2 * (1 - u2 * 0.4), d2 * (1 - u2 * 0.45), d2 * (1 - u2 * 0.5)];
      Pk(r2, i2 * e4 + a2, f2, 0.92);
    }
    return Nk(e4, n2, r2, 1.4);
  } }, zk = /* @__PURE__ */ new Map();
}));
function Vk(e4) {
  let t2 = $k.length, n2 = new Uint8Array(e4 * e4 * 4 * t2), r2 = new Uint8Array(e4 * e4 * 4 * t2);
  $k.forEach((t3, i3) => {
    if (t3.startsWith(`prop:`)) {
      let a2 = Fk(t3.slice(5), e4);
      n2.set(a2.albedo, i3 * e4 * e4 * 4), r2.set(a2.normal, i3 * e4 * e4 * 4);
    } else {
      let a2 = Zh(t3, e4);
      n2.set(a2.albedo.image.data, i3 * e4 * e4 * 4), r2.set(a2.normal.image.data, i3 * e4 * e4 * 4);
    }
  });
  let i2 = (n3, r3) => {
    let i3 = new Sr(n3, e4, e4, t2);
    return i3.format = Vt, i3.type = Et, i3.wrapS = _t, i3.wrapT = _t, i3.minFilter = Tt, i3.magFilter = Ct, i3.generateMipmaps = true, i3.anisotropy = 4, i3.colorSpace = r3 ? Vn : ``, i3.needsUpdate = true, i3;
  };
  return { albedo: i2(n2, true), normal: i2(r2, false) };
}
function Hk() {
  nA || (nA = Vk(256), tA.uAlbArr.value = nA.albedo, tA.uNrmArr.value = nA.normal);
}
function Uk(e4) {
  Object.assign(e4.uniforms, tA), e4.vertexShader = e4.vertexShader.replace(`#include <common>`, `#include <common>
${oA}`).replace(`#include <begin_vertex>`, cA), e4.fragmentShader = e4.fragmentShader.replace(`#include <common>`, `#include <common>
${lA}`).replace(`#include <map_fragment>`, uA).replace(`#include <roughnessmap_fragment>`, `float roughnessFactor = clamp(pRough, 0.04, 1.0);`).replace(`#include <metalnessmap_fragment>`, `float metalnessFactor = pMetal;`).replace(`#include <normal_fragment_maps>`, `normal = pNrmV;`).replace(`#include <emissivemap_fragment>`, dA);
}
function Wk(e4) {
  Hk();
  let t2 = new Yo({ color: 16777215, roughness: 1, metalness: 0, vertexColors: true });
  return e4 && (t2.defines = fA ? { PROP_FADE: ``, PROP_FADE_A2C: `` } : { PROP_FADE: `` }, t2.alphaToCoverage = fA), t2.onBeforeCompile = Uk, t2.customProgramCacheKey = () => e4 ? t2.alphaToCoverage ? `unhallowed-prop-v2-fade-a2c` : `unhallowed-prop-v2-fade` : `unhallowed-prop-v2`, t2.name = e4 ? `PropMaterialFade` : `PropMaterial`, t2;
}
function Gk() {
  return rA ||= Wk(false), rA;
}
function Kk() {
  return iA ||= Wk(true), iA;
}
function qk(e4) {
  fA = e4;
  let t2 = iA;
  !t2 || t2.alphaToCoverage === e4 || (t2.alphaToCoverage = e4, t2.defines = e4 ? { PROP_FADE: ``, PROP_FADE_A2C: `` } : { PROP_FADE: `` }, t2.needsUpdate = true);
}
function Jk() {
  if (aA) return aA;
  let e4 = new Zo();
  return e4.onBeforeCompile = (e5) => {
    e5.uniforms.uTime = tA.uTime, e5.uniforms.uWind = tA.uWind, e5.vertexShader = e5.vertexShader.replace(`#include <common>`, `#include <common>
        attribute vec4 aMat;
        uniform float uTime;
        uniform vec3 uWind;`).replace(`#include <begin_vertex>`, `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 iPos = instanceMatrix[3].xyz;
          mat3 iRot = mat3(instanceMatrix);
        #else
          vec3 iPos = modelMatrix[3].xyz;
          mat3 iRot = mat3(1.0);
        #endif
        ${sA}`);
  }, e4.customProgramCacheKey = () => `unhallowed-prop-depth-v2`, aA = e4, e4;
}
function Yk(e4) {
  tA.uTime.value = e4;
}
function Xk(e4) {
  if (e4.wet !== void 0 && (tA.uWet.value = e4.wet), e4.moss !== void 0 && (tA.uMoss.value = e4.moss), e4.mossTint !== void 0 && tA.uMossTint.value.set(e4.mossTint), e4.wind !== void 0 && (tA.uWind.value.z = e4.wind), e4.windAngle !== void 0 && tA.uWind.value.set(Math.cos(e4.windAngle), Math.sin(e4.windAngle), tA.uWind.value.z), e4.rim !== void 0 && (tA.uRim.value.w = e4.rim), e4.rimColor !== void 0) {
    let t2 = new P(e4.rimColor);
    tA.uRim.value.set(t2.r, t2.g, t2.b, tA.uRim.value.w);
  }
}
function Zk(e4, t2, n2) {
  tA.uFade.value.set(e4.x, e4.y, e4.z, t2), n2 && tA.uFadeDir.value.copy(n2).normalize();
}
function Qk() {
  return Hk(), nA;
}
var $k, eA, tA, nA, rA, iA, aA, oA, sA, cA, lA, uA, dA, fA, pA = t((() => {
  Ed(), cg(), Bk(), $k = [`stoneBlocks`, `bark`, `wood`, `canvas`, `rock`, `iron`, `hide`, `thatch`, `bone`, `plaster`, `moss`, `dirt`, `caveRock`, `flagstone`, `prop:deadwood`, `prop:grain`, `prop:slate`, `prop:cloth`], eA = $k.length, tA = { uAlbArr: { value: null }, uNrmArr: { value: null }, uTime: { value: 0 }, uLayer: { value: [[0, 2.2, 1, 1.45], [0, 1.5, 0.85, 1.9], [0, 1.7, 0.9, 1.7], [0, 1.6, 1, 1], [0, 2.6, 1, 2.1], [0.82, 1.1, 0.45, 1.9], [0, 1.3, 0.8, 1.3], [0, 1.3, 0.9, 1.35], [0, 0.9, 0.55, 1], [0, 2.2, 1, 1.2], [0, 1.8, 1, 1.7], [0, 2.2, 1, 1.5], [0, 3.2, 1, 2.5], [0, 3, 1, 1.45], [0, 1.6, 0.85, 1], [0, 1.4, 0.9, 1.5], [0, 1.6, 0.8, 1.6], [0, 0.9, 1, 0.62], [0, 1, 0, 1], [0, 1, 0.6, 1]].map(([e4, t2, n2, r2]) => new yr(e4, 1 / t2, n2, r2)) }, uWet: { value: 0.35 }, uMoss: { value: 1 }, uMossTint: { value: new P(`#9aa585`) }, uWind: { value: new N(0.8, 0.6, 1) }, uFade: { value: new yr(0, -1e3, 0, 0) }, uFadeDir: { value: new N(0.6124, 0.5, 0.6124).normalize() }, uRim: { value: new yr(0.55, 0.66, 0.9, 0.55) } }, nA = null, rA = null, iA = null, aA = null, oA = `
  attribute vec4 aMat;
  attribute vec3 aTex;
  attribute vec4 aQuat;
  uniform float uTime;
  uniform vec3 uWind;
  varying vec4 vMat;
  varying vec3 vTex;
  varying vec3 vTexN;
  varying vec3 vP2V0;
  varying vec3 vP2V1;
  varying vec3 vP2V2;
  varying vec3 vWPos;
  varying vec2 vInst;
  vec3 pQrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
`, sA = `
  if (aMat.z > 0.0) {
    vec3 wdir = normalize(vec3(uWind.x, 0.0, uWind.y) + vec3(1e-4));
    vec3 od = transpose(iRot) * wdir;
    od = normalize(vec3(od.x, 0.0, od.z) + vec3(1e-4, 0.0, 0.0));
    float ph = iPos.x * 0.37 + iPos.z * 0.29 + dot(position, vec3(0.7, 0.3, 0.55));
    float gust = 0.6 + 0.4 * sin(uTime * 0.43 + iPos.x * 0.07 + iPos.z * 0.05);
    float mainW = (sin(uTime * 1.55 + ph) + 0.35 * sin(uTime * 2.87 + ph * 1.7)) * gust;
    float flut = sin(uTime * 7.1 + ph * 3.3) * 0.3 + sin(uTime * 11.3 + ph * 5.1) * 0.12;
    float amp = aMat.z * uWind.z;
    vec3 side = vec3(-od.z, 0.0, od.x);
    transformed += od * (mainW * 0.09 + 0.05 * gust + flut * 0.035) * amp;
    transformed += side * (cos(uTime * 1.27 + ph) * 0.035 + flut * 0.02) * amp;
    transformed.y += sin(uTime * 2.3 + ph * 2.0) * 0.015 * amp;
  }
`, cA = `
  #include <begin_vertex>
  vMat = aMat;
  #ifdef USE_INSTANCING
    vec3 iPos = instanceMatrix[3].xyz;
    mat3 iRot = mat3(instanceMatrix);
  #else
    vec3 iPos = modelMatrix[3].xyz;
    mat3 iRot = mat3(1.0);
  #endif
  float ih1 = fract(sin(dot(iPos.xz, vec2(12.9898, 78.233))) * 43758.5453);
  float ih2 = fract(sin(dot(iPos.xz, vec2(39.3468, 11.135))) * 24634.6345);
  vInst = vec2(ih1, ih2);
  vTex = aTex + vec3(ih1, ih2, fract(ih1 * 3.7 + ih2 * 1.3)) * 23.0;
  vTexN = pQrot(vec4(-aQuat.xyz, aQuat.w), objectNormal);
  {
    mat3 im = iRot;
    mat3 inS = mat3(im[0] / dot(im[0], im[0]), im[1] / dot(im[1], im[1]), im[2] / dot(im[2], im[2]));
    mat3 o2v = normalMatrix * inS;
    vP2V0 = o2v * pQrot(aQuat, vec3(1.0, 0.0, 0.0));
    vP2V1 = o2v * pQrot(aQuat, vec3(0.0, 1.0, 0.0));
    vP2V2 = o2v * pQrot(aQuat, vec3(0.0, 0.0, 1.0));
  }
  ${sA}
  {
    vec4 wp = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      wp = instanceMatrix * wp;
    #endif
    wp = modelMatrix * wp;
    vWPos = wp.xyz;
  }
`, lA = `
  uniform highp sampler2DArray uAlbArr;
  uniform highp sampler2DArray uNrmArr;
  uniform vec4 uLayer[${eA + 2}];
  uniform float uTime;
  uniform float uWet;
  uniform float uMoss;
  uniform vec3 uMossTint;
  uniform vec4 uRim;
  varying vec4 vMat;
  varying vec3 vTex;
  varying vec3 vTexN;
  varying vec3 vP2V0;
  varying vec3 vP2V1;
  varying vec3 vP2V2;
  varying vec3 vWPos;
  varying vec2 vInst;
  #ifdef PROP_FADE
    uniform vec4 uFade;
    uniform vec3 uFadeDir;
    float pBayer(vec2 p) {
      ivec2 q = ivec2(mod(p, 4.0));
      int i = q.x + q.y * 4;
      const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
      return (m[i] + 0.5) / 16.0;
    }
  #endif
  vec4 triA(vec3 p, vec3 w, float layer) {
    return texture(uAlbArr, vec3(p.zy, layer)) * w.x
         + texture(uAlbArr, vec3(p.xz, layer)) * w.y
         + texture(uAlbArr, vec3(p.xy, layer)) * w.z;
  }
  vec3 triN(vec3 p, vec3 n, vec3 w, float layer, out float hgt) {
    vec4 sx = texture(uNrmArr, vec3(p.zy, layer));
    vec4 sy = texture(uNrmArr, vec3(p.xz, layer));
    vec4 sz = texture(uNrmArr, vec3(p.xy, layer));
    hgt = sx.a * w.x + sy.a * w.y + sz.a * w.z;
    vec3 tx = sx.xyz * 2.0 - 1.0;
    vec3 ty = sy.xyz * 2.0 - 1.0;
    vec3 tz = sz.xyz * 2.0 - 1.0;
    tx = vec3(tx.xy + n.zy, abs(tx.z) * n.x);
    ty = vec3(ty.xy + n.xz, abs(ty.z) * n.y);
    tz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
    return normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
  }
`, uA = `
  #include <map_fragment>
  #ifdef PROP_FADE
  {
    vec3 fd = vWPos - uFade.xyz;
    float along = dot(fd, uFadeDir);
    float pd = length(fd - uFadeDir * along);
    float fk = smoothstep(uFade.w, uFade.w - 1.1, pd) * smoothstep(0.1, 0.7, along) * smoothstep(uFade.y + 0.15, uFade.y + 0.55, vWPos.y);
    #ifdef PROP_FADE_A2C
      // MSAA alpha-to-coverage: a smooth see-through band instead of a 1-bit stipple
      if (fk > 0.97) discard;
      diffuseColor.a = 1.0 - fk;
    #else
      if (fk > pBayer(gl_FragCoord.xy)) discard;
    #endif
  }
  #endif
  float pLayer = floor(vMat.x + 0.5);
  int li = pLayer < 29.5 ? int(pLayer) : int(pLayer) - ${30 - eA};
  vec4 lp = uLayer[li];
  vec3 nP = normalize(vTexN);
  mat3 P2V = mat3(vP2V0, vP2V1, vP2V2);
  vec3 geoV = normalize(P2V * nP);
  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  float upness = dot(geoV, upV);
  float pRough = 0.85;
  float pMetal = 0.0;
  float pHgt = 0.5;
  vec3 pNrmV = geoV;
  diffuseColor.rgb *= (0.9 + 0.2 * vInst.x) * mix(vec3(1.04, 1.0, 0.95), vec3(0.96, 1.0, 1.05), vInst.y);
  if (pLayer < 29.5) {
    float sc = lp.y;
    vec3 tp = vTex * sc;
    vec3 tw = pow(abs(nP), vec3(4.0));
    tw /= (tw.x + tw.y + tw.z + 1e-5);
    vec4 ta = triA(tp, tw, pLayer);
    diffuseColor.rgb *= ta.rgb * lp.w;
    pRough = ta.a;
    pMetal = lp.x;
    vec3 nPert = triN(tp, nP, tw, pLayer, pHgt);
    pNrmV = normalize(P2V * nPert);
  } else if (pLayer < 30.5) {
    pRough = 0.2;
  }
  float mossAllow = vMat.w * uMoss;
  if (mossAllow > 0.001) {
    float blot = texture(uNrmArr, vec3(vWPos.xz * 0.11 + vInst * 5.0, 4.0)).a;
    float mk = smoothstep(0.3, 0.72, upness * 0.8 + (blot - 0.5) * 1.3 + (pHgt - 0.5) * 0.7) * mossAllow;
    vec4 ma = texture(uAlbArr, vec3(vWPos.xz * 0.55, 10.0));
    diffuseColor.rgb = mix(diffuseColor.rgb, ma.rgb * uMossTint * (0.8 + 0.4 * blot), mk);
    pRough = mix(pRough, 0.93, mk);
    pMetal *= 1.0 - mk;
    pNrmV = normalize(mix(pNrmV, geoV, mk * 0.4));
  }
  {
    float porous = lp.z;
    float streak = texture(uNrmArr, vec3(vWPos.x * 0.8 + vWPos.z * 0.6, vWPos.y * 0.09, 11.0)).a;
    float wet = uWet * porous * clamp(0.5 + 0.5 * upness, 0.0, 1.0) * (0.7 + 0.6 * streak);
    wet = clamp(wet - (pHgt - 0.5) * 0.25 * uWet, 0.0, 1.0);
    diffuseColor.rgb *= 1.0 - 0.36 * wet;
    pRough = mix(pRough, 0.14, wet * 0.85);
  }
`, dA = `
  #include <emissivemap_fragment>
  {
    float emv = vMat.y;
    if (abs(emv) > 0.0001) {
      float e = abs(emv);
      if (emv < 0.0) {
        vec3 cell = floor(vWPos * 6.0);
        float hh = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float fl = 0.55 + 0.45 * (0.5 + 0.5 * sin(uTime * (2.5 + hh * 4.5) + hh * 40.0)) * (0.75 + 0.25 * sin(uTime * 13.0 + hh * 17.0));
        e *= fl * (0.45 + pHgt * 1.1);
      }
      totalEmissiveRadiance += vColor.rgb * e;
    }
    vec3 rimV = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
    float rimF = pow(1.0 - clamp(dot(normal, rimV), 0.0, 1.0), 3.0);
    totalEmissiveRadiance += uRim.rgb * (uRim.a * rimF * (0.55 + 0.45 * max(upness, 0.0))) * diffuseColor.rgb;
  }
`, fA = true;
}));
function mA(e4, t2) {
  let { w: n2, h: r2 } = e4, i2 = e4.nav.walk, a2 = SA, o2 = n2 * a2 + 1, s2 = r2 * a2 + 1, c2 = new Float32Array(o2 * s2), l2 = (e5, t3) => e5 >= 0 && t3 >= 0 && e5 < n2 && t3 < r2 && i2[t3 * n2 + e5] === 1;
  for (let e5 = 0; e5 < s2; e5 += 1) {
    let t3 = e5 / a2;
    for (let i3 = 0; i3 < o2; i3 += 1) {
      let s3 = i3 / a2, u3 = Math.min(n2 - 1, Math.floor(s3)), d3 = Math.min(r2 - 1, Math.floor(t3)), f3 = l2(u3, d3) && (i3 % a2 !== 0 || l2(u3 - 1, d3)) && (e5 % a2 !== 0 || l2(u3, d3 - 1)) && (i3 % a2 !== 0 || e5 % a2 !== 0 || l2(u3 - 1, d3 - 1)), p2 = 4;
      for (let e6 = -4; e6 <= 4; e6 += 1) {
        let n3 = d3 + e6;
        for (let e7 = -4; e7 <= 4; e7 += 1) {
          let r3 = u3 + e7;
          if (!(f3 ? !l2(r3, n3) : l2(r3, n3))) continue;
          let i4 = Math.max(r3 - s3, 0, s3 - (r3 + 1)), a3 = Math.max(n3 - t3, 0, t3 - (n3 + 1)), o3 = Math.hypot(i4, a3);
          o3 < p2 && (p2 = o3);
        }
      }
      c2[e5 * o2 + i3] = f3 ? -p2 : p2;
    }
  }
  let u2 = new Float32Array(c2.length);
  for (let e5 = 0; e5 < 2; e5 += 1) {
    for (let e6 = 0; e6 < s2; e6 += 1) for (let t3 = 0; t3 < o2; t3 += 1) {
      let n3 = 0, r3 = 0;
      for (let i3 = -1; i3 <= 1; i3 += 1) {
        let a3 = e6 + i3;
        if (!(a3 < 0 || a3 >= s2)) for (let e7 = -1; e7 <= 1; e7 += 1) {
          let s3 = t3 + e7;
          if (s3 < 0 || s3 >= o2) continue;
          let l3 = e7 === 0 && i3 === 0 ? 2 : 1;
          n3 += c2[a3 * o2 + s3] * l3, r3 += l3;
        }
      }
      u2[e6 * o2 + t3] = n3 / r3;
    }
    c2.set(u2);
  }
  let d2 = e4.wallHeight ?? new Float32Array(n2 * r2), f2 = new Float32Array(n2 * r2);
  for (let e5 = 0; e5 < r2; e5 += 1) for (let t3 = 0; t3 < n2; t3 += 1) {
    let i3 = 0, a3 = 0, o3 = 0;
    for (let s3 = -2; s3 <= 2; s3 += 1) for (let c3 = -2; c3 <= 2; c3 += 1) {
      let l3 = t3 + c3, u3 = e5 + s3;
      if (l3 < 0 || u3 < 0 || l3 >= n2 || u3 >= r2) continue;
      let f3 = d2[u3 * n2 + l3];
      f3 > 0 && (i3 = Math.max(i3, f3), a3 += f3, o3 += 1);
    }
    f2[e5 * n2 + t3] = o3 ? a3 / o3 * 0.6 + i3 * 0.4 : 3.2;
  }
  return { w: n2, h: r2, sdf: c2, top: f2, layout: e4, seed: t2 };
}
function hA(e4, t2, n2) {
  let r2 = SA, i2 = e4.w * r2 + 1, a2 = e4.h * r2 + 1, o2 = Math.max(0, Math.min(i2 - 1.001, t2 * r2)), s2 = Math.max(0, Math.min(a2 - 1.001, n2 * r2)), c2 = Math.floor(o2), l2 = Math.floor(s2), u2 = o2 - c2, d2 = s2 - l2, f2 = e4.sdf[l2 * i2 + c2], p2 = e4.sdf[l2 * i2 + c2 + 1], m2 = e4.sdf[(l2 + 1) * i2 + c2], h2 = e4.sdf[(l2 + 1) * i2 + c2 + 1], g2 = f2 + (p2 - f2) * u2 + (m2 - f2) * d2 + (f2 - p2 - m2 + h2) * u2 * d2;
  return (t2 < 0 || n2 < 0 || t2 > e4.w || n2 > e4.h) && (g2 = Math.max(g2, 4)), g2;
}
function gA(e4, t2, n2) {
  let r2 = Math.max(0, Math.min(e4.w - 1.001, t2 - 0.5)), i2 = Math.max(0, Math.min(e4.h - 1.001, n2 - 0.5)), a2 = Math.floor(r2), o2 = Math.floor(i2), s2 = r2 - a2, c2 = i2 - o2, l2 = e4.w, u2 = e4.top[o2 * l2 + a2], d2 = e4.top[o2 * l2 + Math.min(l2 - 1, a2 + 1)], f2 = e4.top[Math.min(e4.h - 1, o2 + 1) * l2 + a2], p2 = e4.top[Math.min(e4.h - 1, o2 + 1) * l2 + Math.min(l2 - 1, a2 + 1)];
  return u2 + (d2 - u2) * s2 + (f2 - u2) * c2 + (u2 - d2 - f2 + p2) * s2 * c2;
}
function _A(e4, t2, n2, r2) {
  let i2 = hA(e4, t2, r2);
  if (i2 < -1.6 || i2 > xA + 1.2) return -1;
  let a2 = n2 - um(e4.layout, t2, r2), o2 = e4.seed * 0.37, s2 = qO(t2 * 0.42 + o2, n2 * 0.36, r2 * 0.42 - o2, 3), c2 = KO(t2 * 1.35, n2 * 1.15, r2 * 1.35, e4.seed + 11), l2 = KO(t2 * 2.9, n2 * 2.4, r2 * 2.9, e4.seed + 23), u2 = Math.sin((a2 * 2.1 + s2 * 1.6) * Math.PI), d2 = (u2 > 0 ? u2 ** 3 : 0) * 0.16, f2 = 1 - Math.abs(KO(t2 * 0.95, n2 * 0.22, r2 * 0.95, e4.seed + 31)), p2 = f2 * f2 * 0.42 - 0.18, m2 = gA(e4, t2, r2), h2 = Math.exp(-((a2 - m2 + 0.75) ** 2) * 3) * 0.28, g2 = i2 - 0.12 - Math.max(0, a2) * 0.17 + s2 * 0.4 + c2 * 0.16 + l2 * 0.06 + d2 + h2 + p2 * YO(0.2, 1, a2), _2 = (m2 * (1 - YO(0.5, xA, i2) * 0.8) + s2 * 0.55 + c2 * 0.25 - a2) * 0.9, v2 = (xA + 0.3 - i2) * 0.7 + s2 * 0.25;
  return Math.min(g2, _2, v2);
}
function vA(e4, t2, n2, r2, i2, a2, o2, s2) {
  let c2 = Math.round(r2 / i2), l2 = r2 / c2, u2 = t2 * r2, d2 = n2 * r2, f2 = Math.ceil((s2 - o2) / a2), p2 = (s2 - o2) / f2, m2 = c2 + 3, h2 = f2 + 1, g2 = c2 + 3, _2 = new Float32Array(m2 * h2 * g2), v2 = (e5, t3, n3) => ((n3 + 1) * h2 + t3) * m2 + (e5 + 1), y2 = false;
  for (let t3 = -1; t3 <= c2 + 1; t3 += 1) {
    let n3 = d2 + t3 * l2;
    for (let r3 = -1; r3 <= c2 + 1; r3 += 1) {
      let i3 = u2 + r3 * l2, a3 = hA(e4, i3, n3), s3 = a3 > -1.6 && a3 < xA + 1.2;
      for (let a4 = 0; a4 <= f2; a4 += 1) {
        let c3 = o2 + a4 * p2, l3 = s3 ? _A(e4, i3, c3, n3) : -1;
        _2[v2(r3, a4, t3)] = l3, l3 > 0 && (y2 = true);
      }
    }
  }
  if (!y2) return null;
  let b2 = c2 + 2, x2 = f2, S2 = c2 + 2, C2 = new Int32Array(b2 * x2 * S2).fill(-1), w2 = (e5, t3, n3) => ((n3 + 1) * x2 + t3) * b2 + (e5 + 1), T2 = [], E2 = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]], D2 = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]], O2 = new Float32Array(8);
  for (let e5 = -1; e5 <= c2; e5 += 1) for (let t3 = 0; t3 < f2; t3 += 1) for (let n3 = -1; n3 <= c2; n3 += 1) {
    let r3 = 0;
    for (let i4 = 0; i4 < 8; i4 += 1) {
      let a4 = _2[v2(n3 + E2[i4][0], t3 + E2[i4][1], e5 + E2[i4][2])];
      O2[i4] = a4, a4 > 0 && (r3 |= 1 << i4);
    }
    if (r3 === 0 || r3 === 255) continue;
    let i3 = 0, a3 = 0, s3 = 0, c3 = 0;
    for (let [e6, t4] of D2) {
      let n4 = O2[e6], r4 = O2[t4];
      if (n4 > 0 == r4 > 0) continue;
      let o3 = n4 / (n4 - r4);
      i3 += E2[e6][0] + (E2[t4][0] - E2[e6][0]) * o3, a3 += E2[e6][1] + (E2[t4][1] - E2[e6][1]) * o3, s3 += E2[e6][2] + (E2[t4][2] - E2[e6][2]) * o3, c3 += 1;
    }
    C2[w2(n3, t3, e5)] = T2.length / 3, T2.push(u2 + (n3 + i3 / c3) * l2, o2 + (t3 + a3 / c3) * p2, d2 + (e5 + s3 / c3) * l2);
  }
  let k2 = [], A2 = (e5, t3, n3, r3, i3) => {
    e5 < 0 || t3 < 0 || n3 < 0 || r3 < 0 || ((T2[e5 * 3] - T2[n3 * 3]) ** 2 + (T2[e5 * 3 + 1] - T2[n3 * 3 + 1]) ** 2 + (T2[e5 * 3 + 2] - T2[n3 * 3 + 2]) ** 2 <= (T2[t3 * 3] - T2[r3 * 3]) ** 2 + (T2[t3 * 3 + 1] - T2[r3 * 3 + 1]) ** 2 + (T2[t3 * 3 + 2] - T2[r3 * 3 + 2]) ** 2 ? i3 ? k2.push(e5, n3, t3, e5, r3, n3) : k2.push(e5, t3, n3, e5, n3, r3) : i3 ? k2.push(e5, r3, t3, t3, r3, n3) : k2.push(e5, t3, r3, t3, n3, r3));
  }, ee2 = (e5, t3, n3) => t3 < 0 || t3 >= f2 ? -1 : C2[w2(e5, t3, n3)];
  for (let e5 = 0; e5 < c2; e5 += 1) for (let t3 = 0; t3 <= f2; t3 += 1) for (let n3 = 0; n3 < c2; n3 += 1) {
    let r3 = _2[v2(n3, t3, e5)] > 0;
    r3 !== _2[v2(n3 + 1, t3, e5)] > 0 && A2(ee2(n3, t3 - 1, e5 - 1), ee2(n3, t3, e5 - 1), ee2(n3, t3, e5), ee2(n3, t3 - 1, e5), !r3), t3 < f2 && r3 !== _2[v2(n3, t3 + 1, e5)] > 0 && A2(ee2(n3 - 1, t3, e5 - 1), ee2(n3, t3, e5 - 1), ee2(n3, t3, e5), ee2(n3 - 1, t3, e5), r3), r3 !== _2[v2(n3, t3, e5 + 1)] > 0 && A2(ee2(n3 - 1, t3 - 1, e5), ee2(n3, t3 - 1, e5), ee2(n3, t3, e5), ee2(n3 - 1, t3, e5), !r3);
  }
  if (!k2.length) return null;
  let te2 = new Int32Array(T2.length / 3).fill(-1), ne2 = [];
  for (let e5 = 0; e5 < k2.length; e5 += 1) {
    let t3 = k2[e5];
    te2[t3] < 0 && (te2[t3] = ne2.length / 3, ne2.push(T2[t3 * 3], T2[t3 * 3 + 1], T2[t3 * 3 + 2])), k2[e5] = te2[t3];
  }
  let re2 = [], ie2 = [], ae2 = l2 * 0.5, oe2 = new P(`#b9ab98`), se2 = new P(`#6f7f52`), ce2 = new P(`#c09060`), le2 = new P();
  for (let t3 = 0; t3 < ne2.length; t3 += 3) {
    let n3 = ne2[t3], r3 = ne2[t3 + 1], i3 = ne2[t3 + 2], a3 = _A(e4, n3 + ae2, r3, i3) - _A(e4, n3 - ae2, r3, i3), o3 = _A(e4, n3, r3 + ae2, i3) - _A(e4, n3, r3 - ae2, i3), s3 = _A(e4, n3, r3, i3 + ae2) - _A(e4, n3, r3, i3 - ae2), c3 = Math.hypot(a3, o3, s3) || 1;
    a3 = -a3 / c3, o3 = -o3 / c3, s3 = -s3 / c3, re2.push(a3, o3, s3);
    let l3 = hA(e4, n3, i3), u3 = r3 - um(e4.layout, n3, i3), d3 = Math.max(0, _A(e4, n3 + a3 * 0.35, r3 + o3 * 0.35, i3 + s3 * 0.35)), f3 = Math.max(0, _A(e4, n3 + a3 * 0.8, r3 + o3 * 0.8, i3 + s3 * 0.8)), p3 = Math.max(0.35, 1 - d3 * 1.6 - f3 * 0.8), m3 = 0.42 + 0.58 * YO(-0.1, 1.4, u3), h3 = 1 - YO(1.2, xA - 0.2, l3), g3 = KO(n3 * 0.35, r3 * 0.5, i3 * 0.35, e4.seed + 41);
    le2.copy(oe2).multiplyScalar(0.85 + g3 * 0.25);
    let _3 = YO(0.15, 0.6, KO(n3 * 0.25, 0.5, i3 * 0.25, e4.seed + 51)) * (1 - YO(0.3, 1.6, u3));
    le2.lerp(se2, _3 * 0.7);
    let v3 = YO(0.35, 0.7, KO(n3 * 0.6, r3 * 0.9, i3 * 0.6, e4.seed + 61));
    le2.lerp(ce2, v3 * 0.35);
    let y3 = p3 * m3 * (0.04 + 0.96 * h3);
    ie2.push(le2.r * y3, le2.g * y3, le2.b * y3);
  }
  return { pos: ne2, nrm: re2, col: ie2, idx: k2 };
}
function yA(e4, t2, n2, r2, i2, a2) {
  if (i2 <= 0) return;
  let { w: o2, h: s2 } = e4, c2 = e4.layout.nav.walk, l2 = new Id(e4.seed * 131 + t2 * 7919 + n2 * 104729 >>> 0), u2 = [];
  for (let e5 = 0; e5 < 6; e5 += 1) u2.push(Tk(700 + e5, 1, 0.7, 0.85, { detail: +(e5 < 2), cuts: 3, rough: 0.3, sink: 0.25 }));
  let d2 = new wr(), f2 = new ir(), p2 = new N(), m2 = new N(), h2 = new N(), g2 = new sr();
  for (let _2 = n2 * r2; _2 < Math.min(s2, (n2 + 1) * r2); _2 += 1) for (let n3 = t2 * r2; n3 < Math.min(o2, (t2 + 1) * r2); n3 += 1) {
    if (!c2[_2 * o2 + n3]) continue;
    let t3 = false;
    for (let e5 = -1; e5 <= 1 && !t3; e5 += 1) for (let r4 = -1; r4 <= 1; r4 += 1) {
      let i3 = n3 + r4, a3 = _2 + e5;
      if (i3 < 0 || a3 < 0 || i3 >= o2 || a3 >= s2 || !c2[a3 * o2 + i3]) {
        t3 = true;
        break;
      }
    }
    if (!t3 || l2.next() > 0.22 * i2) continue;
    let r3 = n3 + l2.range(0.1, 0.9), v2 = _2 + l2.range(0.1, 0.9), y2 = hA(e4, r3, v2), b2 = hA(e4, r3 + 0.1, v2) - hA(e4, r3 - 0.1, v2), x2 = hA(e4, r3, v2 + 0.1) - hA(e4, r3, v2 - 0.1), S2 = Math.hypot(b2, x2) || 1, C2 = -0.05 - y2, w2 = r3 + b2 / S2 * C2, T2 = v2 + x2 / S2 * C2, E2 = l2.range(0.18, 0.5) * (l2.next() < 0.15 ? 1.6 : 1), D2 = u2[Math.floor(l2.next() * u2.length)];
    f2.setFromEuler(new Pr(l2.range(-0.3, 0.3), l2.range(0, Math.PI * 2), l2.range(-0.3, 0.3))), d2.compose(m2.set(w2, um(e4.layout, w2, T2), T2), f2, p2.set(E2, E2, E2)), g2.getNormalMatrix(d2);
    let O2 = D2.getAttribute(`position`), k2 = D2.getAttribute(`normal`), A2 = a2.pos.length / 3, ee2 = 0.75 + l2.next() * 0.3;
    for (let e5 = 0; e5 < O2.count; e5 += 1) {
      m2.fromBufferAttribute(O2, e5).applyMatrix4(d2), a2.pos.push(m2.x, m2.y, m2.z), h2.fromBufferAttribute(k2, e5).applyMatrix3(g2).normalize(), a2.nrm.push(h2.x, h2.y, h2.z);
      let t4 = (O2.getY(e5) + 0.25) / 1, n4 = ee2 * (0.45 + 0.55 * Math.min(1, Math.max(0, t4)));
      a2.col.push(0.8 * n4, 0.75 * n4, 0.68 * n4);
    }
    let te2 = D2.index;
    if (te2) for (let e5 = 0; e5 < te2.count; e5 += 1) a2.idx.push(A2 + te2.getX(e5));
    else for (let e5 = 0; e5 < O2.count; e5 += 1) a2.idx.push(A2 + e5);
  }
  for (let e5 of u2) e5.dispose();
}
function bA(e4, t2 = {}) {
  let n2 = t2.chunk ?? 16, r2 = t2.voxel ?? 0.6, i2 = t2.voxelY ?? 0.66, a2 = mA(e4, t2.seed ?? 7), o2 = 1 / 0, s2 = -1 / 0;
  for (let t3 = 0; t3 < e4.height.length; t3 += 1) o2 = Math.min(o2, e4.height[t3]), s2 = Math.max(s2, e4.height[t3]);
  let c2 = 0;
  for (let e5 = 0; e5 < a2.top.length; e5 += 1) c2 = Math.max(c2, a2.top[e5]);
  let l2 = o2 - 0.45, u2 = s2 + c2 + 1.2, d2 = t2.fade === false ? Gk() : Kk(), f2 = [], p2 = Math.ceil(e4.w / n2), m2 = Math.ceil(e4.h / n2);
  for (let e5 = 0; e5 < m2; e5 += 1) for (let o3 = 0; o3 < p2; o3 += 1) {
    let s3 = vA(a2, o3, e5, n2, r2, i2, l2, u2);
    if (!s3) continue;
    yA(a2, o3, e5, n2, t2.rubble ?? 1, s3);
    let c3 = s3.pos.length / 3, p3 = new Float32Array(c3 * 4), m3 = new Float32Array(c3 * 4);
    for (let e6 = 0; e6 < c3; e6 += 1) p3[e6 * 4] = J.rock, p3[e6 * 4 + 3] = 0.55, m3[e6 * 4 + 3] = 1;
    let h2 = new Qi();
    h2.setAttribute(`position`, new Bi(s3.pos, 3)), h2.setAttribute(`normal`, new Bi(s3.nrm, 3)), h2.setAttribute(`color`, new Bi(s3.col, 3)), h2.setAttribute(`aMat`, new Bi(p3, 4)), h2.setAttribute(`aTex`, new Bi(s3.pos, 3)), h2.setAttribute(`aQuat`, new Bi(m3, 4)), h2.setIndex(c3 > 65535 ? new zi(s3.idx, 1) : new Ri(s3.idx, 1)), h2.computeBoundingBox(), h2.computeBoundingSphere();
    let g2 = new xa(h2, d2);
    g2.name = `caveWall_${o3}_${e5}`, g2.castShadow = true, g2.receiveShadow = true, g2.customDepthMaterial = Jk(), g2.userData.chunk = { cx: o3, cz: e5 }, f2.push(g2);
  }
  return f2;
}
var xA, SA, CA = t((() => {
  Ed(), dm(), UO(), ZO(), kk(), Ld(), pA(), xA = 2.45, SA = 4;
}));
function X(e4, t2, n2, r2, i2, a2 = {}) {
  let o2 = t2[0], s2 = t2[t2.length - 1].clone().sub(o2);
  s2.lengthSq() < 1e-8 && s2.set(0, 1, 0), s2.normalize();
  let c2 = new ir().setFromUnitVectors(new N(0, 1, 0), s2), l2 = c2.clone().invert(), u2 = bk(t2.map((e5) => e5.clone().sub(o2).applyQuaternion(l2)), n2, r2, a2);
  e4.add(u2, i2, new wr().compose(o2, c2, new N(1, 1, 1)));
}
function wA(e4, t2, n2, r2, i2 = {}) {
  let a2 = i2.seed ?? 1, o2 = [], s2 = t2.distanceTo(n2);
  for (let e5 = 0; e5 <= 4; e5 += 1) {
    let r3 = e5 / 4, i3 = t2.clone().lerp(n2, r3), c3 = Math.sin(r3 * Math.PI) * s2 * 0.015;
    i3.x += KO(a2, r3 * 2, 0.3) * c3, i3.z += KO(a2 + 4, r3 * 2, 0.7) * c3, o2.push(i3);
  }
  let c2 = i2.radial ?? 7;
  if (X(e4, o2, (e5) => r2 * (1 - e5 * 0.08), c2, { layer: J.bark, color: i2.color ?? HA.bark, ...i2 }, { bumps: 0.07, bumpFreq: 4, seed: a2 }), i2.ends !== false) {
    let a3 = n2.clone().sub(t2).normalize(), o3 = _k(r2 * 0.97, r2 * 0.97, -0.012, 0.012, c2);
    e4.add(o3, { layer: J.wood, color: i2.capColor ?? HA.cutWood, moss: 0, texScale: 2 }, new wr().compose(t2, new ir().setFromUnitVectors(q(0, 1, 0), a3), q(1, 1, 1)));
    let s3 = _k(r2 * 0.9, r2 * 0.9, -0.012, 0.012, c2);
    e4.add(s3, { layer: J.wood, color: i2.capColor ?? HA.cutWood, moss: 0, texScale: 2 }, new wr().compose(n2, new ir().setFromUnitVectors(q(0, 1, 0), a3), q(1, 1, 1)));
  }
}
function TA(e4, t2, n2, r2, i2, a2 = {}) {
  e4.add(Y(r2, n2, i2, Math.min(r2, i2) * 0.25), { layer: J.wood, color: HA.oldWood, ...a2 }, t2);
}
function EA(e4, t2, n2, r2, i2 = r2, a2 = {}, o2 = 0) {
  let s2 = n2.clone().sub(t2), c2 = s2.length();
  s2.normalize();
  let l2 = new ir().setFromUnitVectors(q(0, 1, 0), s2);
  o2 && l2.multiply(new ir().setFromAxisAngle(q(0, 1, 0), o2));
  let u2 = t2.clone().add(n2).multiplyScalar(0.5);
  e4.add(Y(r2, c2, i2, Math.min(r2, i2) * 0.18), { layer: J.wood, color: HA.oldWood, ...a2 }, new wr().compose(u2, l2, q(1, 1, 1)));
}
function DA(e4, t2, n2, r2, i2, a2, o2 = {}) {
  let s2 = o2.seed ?? 3, c2 = o2.lean ?? [0, 0], l2 = [];
  for (let e5 = 0; e5 <= 4; e5 += 1) {
    let o3 = e5 / 4, u3 = r2 + (i2 - r2) * o3;
    l2.push(q(t2 + c2[0] * o3 + KO(s2, o3 * 1.7, 0) * a2 * 0.25, u3, n2 + c2[1] * o3 + KO(s2 + 2, o3 * 1.7, 0) * a2 * 0.25));
  }
  let u2 = o2.point ?? 0;
  X(e4, l2, (e5) => a2 * (1 - e5 * 0.1), o2.radial ?? 7, { layer: J.bark, color: o2.color ?? HA.bark, ...o2 }, { bumps: 0.06, bumpFreq: 4, seed: s2, pointEnd: u2 > 0 ? u2 : void 0, capEnd: u2 > 0 ? void 0 : o2.cut !== false });
}
function OA(e4, t2, n2, r2, i2 = 3, a2 = {}) {
  let o2 = new ir().setFromUnitVectors(q(0, 1, 0), n2.clone().normalize());
  for (let s2 = 0; s2 < i2; s2 += 1) {
    let c2 = new Uo(r2 + 0.012, 0.016, 4, 10);
    c2.deleteAttribute(`uv`), c2.rotateX(Math.PI / 2);
    let l2 = (s2 - (i2 - 1) / 2) * 0.035, u2 = new wr().compose(t2.clone().add(n2.clone().normalize().multiplyScalar(l2)), o2, q(1, 1, 1));
    e4.add(c2, { layer: J.thatch, color: HA.rope, moss: 0.1, vary: 0.03, texScale: 3, ...a2 }, u2);
  }
}
function kA(e4, t2, n2, r2 = 0.05, i2 = 0.012, a2, o2 = HA.iron, s2 = 14) {
  let c2 = Sk([[n2 - 1e-3, -r2 / 2], [n2 + i2, -r2 / 2 + 4e-3], [n2 + i2, r2 / 2 - 4e-3]], s2);
  c2.translate(0, t2, 0), e4.add(c2, { layer: J.iron, color: o2, vary: 0.05 }, a2);
}
function AA(e4, t2, n2, r2 = 0.022, i2 = HA.iron) {
  let a2 = _k(r2, r2 * 1.2, 0, r2 * 0.7, 5), o2 = new ir().setFromUnitVectors(q(0, 1, 0), n2.clone().normalize());
  e4.add(a2, { layer: J.iron, color: i2, vary: 0.1, ao: false }, new wr().compose(t2, o2, q(1, 1, 1)));
}
function jA(e4, t2, n2 = 1, r2 = {}) {
  let i2 = r2.color ?? HA.bone;
  e4.group(t2, () => {
    e4.group(K(0, 0, 0, 0, 0, 0, n2), () => {
      let t3 = vk(0.1, 8, 6), n3 = t3.getAttribute(`position`);
      for (let e5 = 0; e5 < n3.count; e5 += 1) {
        let t4 = n3.getX(e5), r3 = n3.getY(e5), i3 = n3.getZ(e5);
        i3 > 0.02 && (i3 = 0.02 + (i3 - 0.02) * 0.55), t4 *= 0.86 + (r3 > 0 ? 0 : 0.06), r3 < -0.04 && (r3 = -0.04 + (r3 + 0.04) * 0.4), n3.setXYZ(e5, t4, r3, i3 * 1.12);
      }
      t3.computeVertexNormals(), e4.add(t3, { layer: J.bone, color: i2, moss: 0.05 }, K(0, 0.105, -0.02)), e4.add(pk([q(-0.06, 0.05, 0.03), q(0.06, 0.05, 0.03), q(-0.05, 0, 0.07), q(0.05, 0, 0.07), q(-0.04, -0.035, 0.065), q(0.04, -0.035, 0.065), q(-0.065, 0.02, -0.02), q(0.065, 0.02, -0.02), q(-0.03, -0.04, 0.02), q(0.03, -0.04, 0.02)]), { layer: J.bone, color: i2 }, K(0, 0.085, 0.02));
      for (let t4 of [-1, 1]) e4.add(vk(0.026, 5, 3), { layer: J.FLAT, color: `#0b0806`, ao: false, moss: 0 }, K(t4 * 0.034, 0.118, 0.073, 0, 0, t4 * 0.3, 1, 0.85, 0.6));
      if (e4.add(pk([q(-0.012, 0, 0), q(0.012, 0, 0), q(0, 0.03, 0), q(0, 5e-3, -0.01)]), { layer: J.FLAT, color: `#0b0806`, ao: false, moss: 0 }, K(0, 0.072, 0.096)), r2.jaw !== false && (e4.add(pk([q(-0.05, 0, -0.02), q(0.05, 0, -0.02), q(-0.045, -0.03, 0), q(0.045, -0.03, 0), q(-0.03, -0.035, 0.06), q(0.03, -0.035, 0.06), q(-0.032, -0.01, 0.065), q(0.032, -0.01, 0.065)]), { layer: J.bone, color: i2 }, K(0, 0.05, 0)), e4.add(new ao(0.07, 0.016, 0.012).deleteAttribute(`uv`), { layer: J.bone, color: `#f1ead8`, ao: false }, K(0, 0.045, 0.068))), r2.horns) for (let t4 of [-1, 1]) {
        let n4 = [];
        for (let e5 = 0; e5 <= 6; e5 += 1) {
          let r3 = e5 / 6;
          n4.push(q(t4 * (0.07 + r3 * 0.16), 0.17 + Math.sin(r3 * 2.2) * 0.12, -0.03 - r3 * 0.08 + r3 * r3 * 0.12));
        }
        X(e4, n4, (e5) => 0.028 * (1 - e5 * 0.85), 5, { layer: J.bone, color: `#cbbd9c` }, { pointEnd: 0.03 });
      }
    });
  });
}
function MA(e4, t2, n2, r2 = 0.022, i2 = HA.bone) {
  let a2 = n2.clone().sub(t2), o2 = a2.length();
  a2.normalize();
  let s2 = new ir().setFromUnitVectors(q(0, 1, 0), a2), c2 = new wr().compose(t2, s2, q(1, 1, 1));
  e4.group(c2, () => {
    e4.add(_k(r2 * 0.85, r2 * 0.85, o2 * 0.1, o2 * 0.9, 5, 1, true), { layer: J.bone, color: i2 });
    for (let t3 of [o2 * 0.08, o2 * 0.92]) e4.add(vk(r2 * 1.3, 5, 3), { layer: J.bone, color: i2 }, K(0, t3, 0, 0, 0, 0, 1.6, 1, 1));
  });
}
function NA(e4, t2, n2, r2, i2 = 0.012, a2 = HA.bone) {
  let o2 = [];
  for (let e5 = 0; e5 <= 5; e5 += 1) {
    let i3 = e5 / 5;
    o2.push(t2.clone().lerp(n2, i3).addScaledVector(r2, Math.sin(i3 * Math.PI)));
  }
  X(e4, o2, (e5) => i2 * (1 - e5 * 0.4), 4, { layer: J.bone, color: a2 });
}
function PA(e4, t2, n2 = 1, r2 = HA.bone) {
  e4.group(t2, () => {
    e4.group(K(0, 0, 0, 0, 0, 0, n2), () => {
      let t3 = [];
      for (let e5 = 0; e5 <= 6; e5 += 1) t3.push(q(0, 0.05 + Math.sin(e5 * 0.5) * 0.02, -0.3 + e5 * 0.1));
      X(e4, t3, 0.022, 5, { layer: J.bone, color: r2 });
      for (let t4 = 0; t4 < 5; t4 += 1) {
        let n3 = -0.2 + t4 * 0.09;
        for (let i2 of [-1, 1]) NA(e4, q(0, 0.06, n3), q(i2 * 0.12, 0.02, n3 + 0.06), q(i2 * 0.08, 0.13 - t4 * 0.012, 0), 0.011, r2);
      }
    });
  });
}
function FA(e4, t2, n2 = 1, r2 = 0.36, i2 = {}) {
  let a2 = [];
  for (let e5 = 0; e5 <= 8; e5 += 1) {
    let t3 = e5 / 8, i3 = Math.sin(t3 * Math.PI) * 0.11;
    a2.push([r2 * (0.86 + i3), t3 * n2]);
  }
  e4.group(t2, () => {
    let t3 = Sk(a2, 12), o2 = t3.getAttribute(`position`);
    for (let e5 = 0; e5 < o2.count; e5 += 1) {
      let t4 = o2.getX(e5), n3 = o2.getZ(e5), r3 = 1 + Math.cos(Math.atan2(n3, t4) * 12) * 6e-3;
      o2.setXYZ(e5, t4 * r3, o2.getY(e5), n3 * r3);
    }
    t3.computeVertexNormals(), e4.add(t3, { layer: J.wood, color: i2.staveTint ?? HA.oldWood, moss: 0.25 });
    let s2 = i2.open ? n2 - 0.06 : n2 - 0.025;
    e4.add(_k(r2 * 0.85, r2 * 0.85, s2 - 0.02, s2, 12), { layer: J.wood, color: HA.darkWood, texScale: 1.6 }), i2.open && i2.contents && e4.add(_k(r2 * 0.84, r2 * 0.84, s2 + 0, s2 + 0.01, 12), { layer: J.GLOSS, color: i2.contents, moss: 0 });
    for (let t4 of [0.1, 0.32, 0.68, 0.9]) {
      let i3 = r2 * (0.86 + Math.sin(t4 * Math.PI) * 0.11);
      kA(e4, t4 * n2, i3, 0.055, 0.014, void 0, HA.rustIron, 12);
    }
  });
}
function IA(e4, t2, n2 = 0.9, r2 = 1, i2 = {}) {
  let a2 = i2.tint ?? HA.oldWood;
  e4.group(t2, () => {
    e4.add(Y(n2 * 0.94, n2 * 0.94, n2 * 0.94, 0.02), { layer: J.wood, color: a2, texScale: 1.25 }, K(0, n2 / 2, 0));
    let t3 = n2 / 2, o2 = 0.07, s2 = (e5, t4, n3) => new ao(e5, t4, n3).deleteAttribute(`uv`);
    for (let r3 of [-1, 1]) for (let i3 of [-1, 1]) e4.add(s2(o2, n2, o2), { layer: J.wood, color: HA.darkWood }, K(r3 * (t3 - o2 / 2 + 0.01), n2 / 2, i3 * (t3 - o2 / 2 + 0.01)));
    for (let r3 of [0, 1]) for (let i3 of [-1, 1]) e4.add(s2(o2, n2 - 0.1, o2), { layer: J.wood, color: HA.darkWood }, K(0, r3 * (n2 - o2) + o2 / 2, i3 * (t3 - o2 / 2 + 0.01), 0, 0, Math.PI / 2, 1, 1, 1)), e4.add(s2(o2, o2, n2 - 0.1), { layer: J.wood, color: HA.darkWood }, K(i3 * (t3 - o2 / 2 + 0.01), r3 * (n2 - o2) + o2 / 2, 0));
    for (let i3 of [-1, 1]) {
      let o3 = Math.hypot(n2 * 0.8, n2 * 0.8);
      e4.add(s2(0.08, o3, 0.03), { layer: J.wood, color: a2 }, K(0, n2 / 2, i3 * (t3 + 5e-3), 0, 0, Math.PI / 4 * (r2 % 2 ? 1 : -1)));
    }
    for (let r3 of [-1, 1]) for (let i3 of [0.08, n2 - 0.08]) AA(e4, q(r3 * (t3 - 0.035), i3, t3 + 0.025), q(0, 0, 1), 0.012);
    i2.broken && e4.add(hk(0.3, 0.12, 0.25, r2 + 3, 0.5), { layer: J.thatch, color: HA.thatch }, K(n2 * 0.45, 0.06, n2 * 0.45, 0, 0.6));
  });
}
function LA(e4, t2, n2 = 1, r2 = 0.7, i2 = false) {
  e4.group(t2, () => {
    let t3 = [];
    for (let e5 = 0; e5 <= 7; e5 += 1) {
      let n3 = e5 / 7, i3 = n3 < 0.85 ? 0.26 * Math.sin(0.35 + n3 * 2.4) + 0.06 : 0.06 + (n3 - 0.85) * 0.3;
      t3.push([Math.max(0.02, i3), n3 * r2]);
    }
    t3[0][0] = 0.12;
    let a2 = Sk(t3, 10), o2 = a2.getAttribute(`position`);
    for (let e5 = 0; e5 < o2.count; e5 += 1) {
      let t4 = o2.getX(e5), i3 = o2.getY(e5), a3 = o2.getZ(e5), s3 = 1 + KO(t4 * 4 + n2, i3 * 4, a3 * 4) * 0.12, c3 = i3 < r2 * 0.5 ? 1 + (0.5 - i3 / r2) * 0.35 : 1;
      o2.setXYZ(e5, t4 * s3 * c3, i3, a3 * s3 * c3 * 0.8);
    }
    a2.computeVertexNormals();
    let s2 = i2 ? K(0, 0.2, 0, Math.PI / 2 - 0.15, 0, 0) : K();
    e4.add(a2, { layer: J.canvas, color: `#b5a584`, moss: 0.1 }, s2);
    let c2 = new Uo(0.065, 0.015, 4, 8);
    c2.deleteAttribute(`uv`), c2.rotateX(Math.PI / 2), e4.add(c2, { layer: J.thatch, color: HA.rope }, i2 ? s2.clone().multiply(K(0, r2 * 0.86, 0)) : K(0, r2 * 0.86, 0));
  });
}
function RA(e4, t2, n2, r2 = 1, i2 = 14, a2 = 2.2) {
  e4.group(t2, () => {
    for (let t3 = 0; t3 < i2; t3 += 1) {
      let o2 = t3 / i2 * Math.PI * 2 * 2.618 + r2, s2 = Math.sqrt((t3 + 0.5) / i2) * n2, c2 = 0.05 + t3 * 37 % 7 * 8e-3, l2 = t3 % 3 != 0;
      e4.add(Tk(r2 * 13 + t3, c2 * 1.2, c2 * 0.7, c2, { detail: 0, cuts: 2, sink: 0.01 }), { layer: J.FLAT, color: l2 ? HA.ember : `#ff8a2a`, emissive: -(l2 ? a2 : a2 * 0.6), moss: 0, ao: false, occlude: false }, K(Math.cos(o2) * s2, 0.01, Math.sin(o2) * s2, 0, o2));
    }
    e4.add(_k(n2 * 1.05, n2 * 1.1, -0.02, 0.025, 10), { layer: J.dirt, color: `#4a4440`, moss: 0 });
  });
}
function zA(e4, t2, n2 = 1) {
  e4.group(K(t2.x, t2.y, t2.z, 0, 0, 0, n2), () => {
    let t3 = Sk([[0.03, -0.12], [0.065, -0.08], [0.075, 0], [0.07, 0.06], [0.045, 0.1]], 8);
    e4.add(t3, { layer: J.hide, color: `#4b3a2a`, moss: 0 }), e4.add(vk(0.055, 6, 4), { layer: J.FLAT, color: HA.emberHot, emissive: -3.2, ao: false, occlude: false }, K(0, 0.1, 0, 0, 0, 0, 1, 0.7, 1));
    for (let t4 = 0; t4 < 3; t4 += 1) {
      let n3 = t4 / 3 * Math.PI * 2;
      e4.add(vk(0.03, 5, 3), { layer: J.FLAT, color: HA.ember, emissive: -2.4, ao: false, occlude: false }, K(Math.cos(n3) * 0.05, 0.065, Math.sin(n3) * 0.05));
    }
  });
}
function BA(e4, t2, n2 = 0.28, r2 = 1) {
  e4.group(K(t2.x, t2.y, t2.z), () => {
    let t3 = Sk([[0.04, 0], [n2 * 0.55, 0.02], [n2 * 0.9, 0.1], [n2, 0.2], [n2 * 1.08, 0.24], [n2 * 0.95, 0.23], [n2 * 0.84, 0.12]], 12);
    e4.add(t3, { layer: J.iron, color: `#b0a8a0`, moss: 0 });
    for (let t4 = 0; t4 < 6; t4 += 1) {
      let r3 = t4 / 6 * Math.PI * 2;
      e4.add(pk([q(-0.02, 0, -0.012), q(0.02, 0, -0.012), q(0, 0, 0.02), q(0, 0.12, 0)]), { layer: J.iron, color: `#a09890` }, K(Math.cos(r3) * n2, 0.22, Math.sin(r3) * n2, 0, -r3));
    }
    e4.add(_k(n2 * 0.8, n2 * 0.82, 0.15, 0.19, 10), { layer: J.FLAT, color: `#2a1a12`, moss: 0 });
    for (let t4 = 0; t4 < 9; t4 += 1) {
      let i2 = t4 * 2.4 + r2, a2 = Math.sqrt((t4 + 0.5) / 9) * n2 * 0.7;
      e4.add(Tk(r2 * 7 + t4, 0.07, 0.05, 0.06, { detail: 0, cuts: 2, sink: 0 }), { layer: J.FLAT, color: t4 % 3 ? HA.ember : HA.emberHot, emissive: -2.8, ao: false, occlude: false }, K(Math.cos(i2) * a2, 0.19, Math.sin(i2) * a2, 0, i2));
    }
  });
}
function VA(e4, t2, n2, r2, i2, a2 = J.rock, o2 = `#bdb6aa`, s2 = 0.08) {
  e4.group(t2, () => {
    for (let t3 = 0; t3 < r2; t3 += 1) {
      let r3 = KO(i2, t3 * 0.73, 0.1) * 9 + t3 * 2.39, c2 = n2 * (0.35 + 0.65 * ((t3 * 0.618 + i2 * 0.13) % 1)), l2 = s2 * (0.6 + (t3 * 7 + i2) % 5 * 0.18);
      e4.add(Tk(i2 * 31 + t3, l2, l2 * 0.6, l2 * 0.85, { detail: 0, cuts: 3, sink: l2 * 0.25 }), { layer: a2, color: o2, vary: 0.12 }, K(Math.cos(r3) * c2, 0, Math.sin(r3) * c2, 0, r3));
    }
  });
}
var HA, UA = t((() => {
  Ed(), UO(), kk(), ZO(), HA = { deadBark: `#b9b2a6`, bark: `#d2c6b4`, oldWood: `#c9bba6`, darkWood: `#8f7f6c`, freshWood: `#e3cfae`, cutWood: `#d9b98d`, charred: `#3a332d`, stone: `#d8d2c6`, coldStone: `#c9ccce`, warmStone: `#ded2c0`, iron: `#d0d0d0`, rustIron: `#c49a82`, bone: `#e8dfcc`, canvas: `#c9bea6`, dirtyCanvas: `#a89b82`, hide: `#c8b49a`, rope: `#b8a274`, blood: `#4a0606`, ember: `#ff5a14`, emberHot: `#ffb347`, gold: `#e0b860`, thatch: `#c4b48e` };
}));
function WA(e4, t2) {
  let n2 = Mj.get(e4);
  return n2 || (n2 = t2(), n2.name = `object:${e4}`, Mj.set(e4, n2)), n2;
}
function GA(e4, t2 = true) {
  let n2 = new xa(e4, Gk());
  return n2.castShadow = t2, n2.receiveShadow = true, n2.customDepthMaterial = Jk(), n2;
}
function KA(e4) {
  let t2 = new la({ color: e4, toneMapped: true });
  return t2.userData.base = new P(e4), t2;
}
function qA(e4, t2) {
  e4.color.copy(e4.userData.base).multiplyScalar(t2);
}
function JA(e4, t2, n2) {
  return { root: e4, height: t2, pickRadius: n2, fx: { fire: [], glow: [] }, setState() {
  }, update() {
  }, dispose() {
    e4.traverse((e5) => {
      let t3 = e5;
      t3.geometry && !t3.geometry.name.startsWith(`object:`) && t3.geometry.dispose();
      let n3 = t3.material;
      if (!n3) return;
      let r2 = Array.isArray(n3) ? n3 : [n3];
      for (let e6 of r2) e6.userData.perInstance && e6.dispose();
    });
  } };
}
function YA(e4) {
  return 1 - (1 - e4) * (1 - e4) * (1 - e4);
}
function XA() {
  if (Nj) return Nj;
  let e4 = 1024, t2 = document.createElement(`canvas`);
  t2.width = e4, t2.height = 320;
  let n2 = t2.getContext(`2d`);
  n2.fillStyle = `#000`, n2.fillRect(0, 0, e4, 320), n2.strokeStyle = `#fff`, n2.lineCap = `round`, n2.lineJoin = `round`;
  let r2 = new Id(777);
  for (let e5 = 0; e5 < 16; e5 += 1) {
    let t3 = e5 * 64 + 32;
    n2.lineWidth = 5, n2.beginPath(), n2.moveTo(t3, 10), n2.lineTo(t3, 54);
    let i3 = r2.int(1, 3);
    for (let e6 = 0; e6 < i3; e6 += 1) {
      let e7 = r2.range(12, 40), i4 = r2.next() < 0.5 ? -1 : 1, a2 = r2.range(10, 20), o2 = r2.range(-14, 14);
      n2.moveTo(t3, e7), n2.lineTo(t3 + i4 * a2, e7 + o2), r2.next() < 0.4 && n2.lineTo(t3 + i4 * a2 * 0.2, e7 + o2 + r2.range(8, 14));
    }
    r2.next() < 0.35 && (n2.moveTo(t3 - 12, 32), n2.arc(t3, 32, 12, Math.PI, Math.PI * 2)), n2.stroke();
  }
  n2.lineWidth = 5, n2.beginPath(), n2.arc(128, 192, 110, 0, Math.PI * 2), n2.stroke(), n2.lineWidth = 3, n2.beginPath(), n2.arc(128, 192, 96, 0, Math.PI * 2), n2.stroke(), n2.lineWidth = 6, n2.beginPath();
  for (let e5 = 0; e5 <= 7; e5 += 1) {
    let t3 = e5 * 3 * Math.PI * 2 / 7 - Math.PI / 2, r3 = 128 + Math.cos(t3) * 92, i3 = 192 + Math.sin(t3) * 92;
    e5 === 0 ? n2.moveTo(r3, i3) : n2.lineTo(r3, i3);
  }
  n2.stroke(), n2.lineWidth = 5, n2.beginPath(), n2.arc(128, 192, 30, 0, Math.PI * 2), n2.moveTo(128, 134), n2.lineTo(128, 250), n2.stroke();
  let i2 = new to(t2);
  return i2.colorSpace = ``, i2.wrapS = _t, i2.generateMipmaps = true, i2.minFilter = Tt, i2.anisotropy = 4, Nj = i2, i2;
}
function ZA(e4, t2, n2, r2) {
  let i2 = new qo({ uniforms: { uTex: { value: XA() }, uColor: { value: new P(e4) }, uTime: { value: 0 }, uLevel: { value: 0.25 }, uBand: { value: new N(t2 / r2, n2 / r2, 16) } }, vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `, fragmentShader: `
      uniform sampler2D uTex;
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uLevel;
      uniform vec3 uBand;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x);
        float u = a / 6.2831853 + 0.5;
        float m = 0.0;
        // rune band
        float bv = (r - uBand.x) / (uBand.y - uBand.x);
        if (bv > 0.0 && bv < 1.0) {
          float cu = fract(u * uBand.z - uTime * 0.02);
          vec2 tuv = vec2((floor(u * uBand.z - uTime * 0.02) + cu) / 16.0, (1.0 - bv) * (64.0 / 320.0));
          m += texture2D(uTex, vec2(tuv.x, 1.0 - tuv.y)).r;
        }
        // engraved ring lines
        m += smoothstep(0.012, 0.0, abs(r - uBand.y - 0.03)) * 0.9;
        m += smoothstep(0.01, 0.0, abs(r - uBand.x + 0.03)) * 0.8;
        m += smoothstep(0.008, 0.0, abs(r - uBand.x * 0.82)) * 0.5;
        // center sigil (256² square at the strip's lower area)
        float sr = uBand.x * 0.78;
        if (r < sr) {
          vec2 q = p / sr * 0.5 + 0.5;
          vec2 suv = vec2(q.x * (256.0 / 1024.0), (64.0 + (1.0 - q.y) * 256.0) / 320.0);
          m += texture2D(uTex, vec2(suv.x, 1.0 - suv.y)).r * 0.9;
        }
        // traveling pulse + breathing
        float pulse = 0.5 + 0.5 * sin(a * 3.0 - uTime * 2.4);
        float breathe = 0.85 + 0.15 * sin(uTime * 1.7);
        float k = m * uLevel * breathe * (0.7 + 0.6 * pulse);
        float halo = smoothstep(1.0, 0.0, r) * 0.06 * uLevel;
        gl_FragColor = vec4(uColor * (k + halo), 1.0);
      }
    `, transparent: true, depthWrite: false, blending: 2, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  return i2.userData.perInstance = true, i2;
}
function QA(e4) {
  let t2 = new qo({ uniforms: { uColor: { value: new P(e4) }, uTime: { value: 0 }, uLevel: { value: 0 } }, vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `, fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uLevel;
      varying vec2 vUv;
      void main() {
        float fall = pow(1.0 - vUv.y, 2.2);
        float streak = 0.65 + 0.35 * sin(vUv.x * 62.83 * 2.0 + uTime * 1.3) * sin(vUv.x * 62.83 * 0.5 - uTime * 0.7 + vUv.y * 4.0);
        gl_FragColor = vec4(uColor * fall * streak * uLevel, 1.0);
      }
    `, transparent: true, depthWrite: false, side: 2, blending: 2 });
  return t2.userData.perInstance = true, t2;
}
function $A() {
  let e4 = new VO(9e3), t2 = { layer: J.rock, color: `#d2cbbf` }, n2 = (t3, n3, r2, i2, a2, o2, s2) => {
    for (let c2 = 0; c2 < a2; c2 += 1) {
      let l2 = c2 / a2 * Math.PI * 2 + 0.012, u2 = (c2 + 1) / a2 * Math.PI * 2 - 0.012, d2 = [], f2 = new Id(o2 + c2).range(-0.02, 0.02);
      for (let e5 of [l2, (l2 + u2) / 2, u2]) for (let a3 of [t3, n3]) for (let t4 of [r2, i2 + f2]) d2.push(q(Math.cos(e5) * a3, t4, Math.sin(e5) * a3));
      for (let e5 of [l2, u2]) d2.push(q(Math.cos(e5) * (n3 + 0), i2 - 0.05, Math.sin(e5) * (n3 + 0)));
      e4.add(pk(d2), { ...s2, vary: 0.12 });
    }
  };
  n2(1.95, 2.45, -0.2, 0.16, 18, 9001, t2), n2(1.62, 2.02, -0.1, 0.32, 14, 9050, { ...t2, color: `#d8d1c5` }), e4.add(_k(1.66, 1.66, -0.1, 0.29, 28), { layer: J.flagstone, color: `#cfc7b8`, texScale: 1.3 }), e4.add(_k(1.6, 1.6, 0.285, 0.302, 48), { layer: J.iron, color: `#4a4a52`, moss: 0 }), e4.add(_k(1.2, 1.2, 0.286, 0.305, 40), { layer: J.flagstone, color: `#d9d2c4`, texScale: 1.3, moss: 0.3 });
  for (let n3 = 0; n3 < 4; n3 += 1) {
    let r2 = n3 / 4 * Math.PI * 2 + Math.PI / 4, i2 = Math.cos(r2) * 2.18, a2 = Math.sin(r2) * 2.18;
    e4.add(Tk(9100 + n3, 0.3, 0.95, 0.24, { cuts: 6, rough: 0.14, crease: 28, sink: 0.12, flatBottom: true }), { layer: J.rock, color: `#cfc9be` }, K(i2, 0.12, a2, 0, -r2 + Math.PI / 2, 0)), e4.add(Y(0.5, 0.12, 0.42, 0.03), t2, K(i2, 0.17, a2, 0, -r2 + Math.PI / 2, 0));
  }
  return e4.add(hk(1.3, 0.2, 0.45, 9200, 0.2), t2, K(0, -0.02, 2.55)), VA(e4, K(), 3, 10, 9210, J.rock, `#bdb6aa`, 0.09), e4.build({ ao: 0.8, aoRadius: 0.8 });
}
function ej() {
  let e4 = new Qr();
  e4.name = `waypoint`, e4.add(GA(WA(`waypoint`, $A)));
  let t2 = ZA(`#4aa3ff`, 1.24, 1.58, 1.62), n2 = new xa(new so(1.62, 64).rotateX(-Math.PI / 2), t2);
  n2.position.y = 0.307, n2.renderOrder = 2, e4.add(n2);
  let r2 = KA(`#5fb4ff`);
  r2.userData.perInstance = true;
  let i2 = [], a2 = new wr();
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let t3 = e5 / 4 * Math.PI * 2 + Math.PI / 4, n3 = new wr().compose(new N(Math.cos(t3) * 1.98, 0, Math.sin(t3) * 1.98), new ir().setFromAxisAngle(new N(0, 1, 0), -t3 - Math.PI / 2), new N(1, 1, 1));
    for (let e6 = 0; e6 < 4; e6 += 1) {
      let t4 = new ao(e6 % 2 ? 0.12 : 0.05, e6 % 2 ? 0.035 : 0.16, 0.02);
      a2.makeTranslation(e6 % 2 ? 0 : e6 === 0 ? -0.02 : 0.02, 0.55 + e6 * 0.15, 0), t4.applyMatrix4(n3.clone().multiply(a2)), i2.push(t4);
    }
  }
  let o2 = new xa(W_(i2), r2);
  for (let e5 of i2) e5.dispose();
  e4.add(o2);
  let s2 = new xa(new co(1.45, 1.6, 3.2, 32, 1, true).translate(0, 1.9, 0), QA(`#3a8aff`));
  s2.renderOrder = 3, e4.add(s2);
  let c2 = 0.25, l2 = 0.25, u2 = JA(e4, 1.9, 2.3);
  u2.fx.glow = [q(0, 0.6, 0), ...[0, 1, 2, 3].map((e5) => {
    let t3 = e5 / 4 * Math.PI * 2 + Math.PI / 4;
    return q(Math.cos(t3) * 2.18, 1, Math.sin(t3) * 2.18);
  })];
  let d2 = () => {
    t2.uniforms.uLevel.value = c2, qA(r2, 0.25 + c2 * 1.2), s2.material.uniforms.uLevel.value = Math.max(0, c2 - 0.3) * 0.22, s2.visible = c2 > 0.32;
  };
  return u2.setState = (e5, t3) => {
    l2 = e5 === `active` || e5 === `open` ? 0.3 + 2.4 * t3 : 0.3, c2 = l2, d2();
  }, u2.update = (e5) => {
    t2.uniforms.uTime.value = e5, s2.material.uniforms.uTime.value = e5, d2();
  }, d2(), u2;
}
function tj(e4) {
  let t2 = new VO(e4.stash ? 9300 : e4.ornate ? 9310 : 9320), { w: n2, d: r2, h: i2 } = e4, a2 = e4.ornate ? { layer: J.grain, color: `#7a4a32` } : { ...jj, color: `#b49a7a` }, o2 = e4.ornate ? { layer: J.iron, color: `#e8c070`, moss: 0 } : Aj, s2 = e4.stash ? 4 : 3;
  for (let e5 = 0; e5 < s2; e5 += 1) {
    let o3 = 0.06 + (e5 + 0.5) * ((i2 - 0.06) / s2), c3 = (i2 - 0.06) / s2 - 0.012;
    t2.add(Y(n2, c3, 0.05, 0.012), a2, K(0, o3, r2 / 2 - 0.025)), t2.add(Y(n2, c3, 0.05, 0.012), a2, K(0, o3, -r2 / 2 + 0.025)), t2.add(Y(0.05, c3, r2 - 0.08, 0.012), a2, K(n2 / 2 - 0.025, o3, 0)), t2.add(Y(0.05, c3, r2 - 0.08, 0.012), a2, K(-n2 / 2 + 0.025, o3, 0));
  }
  t2.add(Y(n2 - 0.06, 0.06, r2 - 0.06, 0.01), a2, K(0, 0.05, 0)), t2.add(Y(n2 - 0.1, 0.02, r2 - 0.1, 5e-3), { layer: J.FLAT, color: e4.ornate ? `#4a0e12` : `#151009`, moss: 0 }, K(0, i2 - 0.12, 0));
  for (let e5 of [-1, 1]) for (let i3 of [-1, 1]) t2.add(Y(0.1, 0.07, 0.1, 0.02), o2, K(e5 * (n2 / 2 - 0.05), 0, i3 * (r2 / 2 - 0.05)));
  let c2 = e4.stash ? [-n2 * 0.33, 0, n2 * 0.33] : [-n2 * 0.3, n2 * 0.3];
  for (let n3 of c2) {
    t2.add(Y(0.07, i2, 0.012, 4e-3), o2, K(n3, i2 / 2 + 0.01, r2 / 2 + 6e-3)), t2.add(Y(0.07, i2, 0.012, 4e-3), o2, K(n3, i2 / 2 + 0.01, -r2 / 2 - 6e-3));
    for (let a3 of [0.12, i2 - 0.1]) AA(t2, q(n3, a3, r2 / 2 + 0.012), q(0, 0, 1), 0.013, e4.ornate ? `#e8c070` : HA.iron);
  }
  for (let e5 of [-1, 1]) {
    for (let a4 of [-1, 1]) t2.add(Y(0.016, i2 * 0.4, 0.12, 4e-3), o2, K(e5 * (n2 / 2 + 8e-3), i2 * 0.25, a4 * (r2 / 2 - 0.06))), t2.add(Y(0.12, i2 * 0.4, 0.016, 4e-3), o2, K(e5 * (n2 / 2 - 0.06), i2 * 0.25, a4 * (r2 / 2 + 8e-3)));
    let a3 = new Uo(0.07, 0.012, 4, 10);
    a3.deleteAttribute(`uv`), t2.add(a3, o2, K(e5 * (n2 / 2 + 0.03), i2 * 0.62, 0, 0, Math.PI / 2, 0));
  }
  if (t2.add(Y(0.16, 0.2, 0.02, 6e-3), o2, K(0, i2 - 0.13, r2 / 2 + 0.012)), t2.add(Y(0.03, 0.06, 0.01, 3e-3), { layer: J.FLAT, color: `#0a0806`, moss: 0 }, K(0, i2 - 0.15, r2 / 2 + 0.024)), e4.ornate && jA(t2, K(0, i2 * 0.32, r2 / 2 + 5e-3, -Math.PI / 2 + 0.2, 0, 0).multiply(K(0, 0, 0)), 0.55, { color: `#e0b860` }), e4.stash) for (let e5 of [-r2 * 0.3, r2 * 0.3]) EA(t2, q(-n2 / 2 - 0.1, 0, e5), q(n2 / 2 + 0.1, 0, e5), 0.12, 0.08, jj);
  return t2.build({ ao: 0.75, aoRadius: 0.35 });
}
function nj(e4) {
  let t2 = new VO(e4.stash ? 9330 : e4.ornate ? 9340 : 9350), { w: n2, d: r2, lidH: i2 } = e4, a2 = e4.ornate ? { layer: J.grain, color: `#7a4a32` } : { ...jj, color: `#b8a080` }, o2 = e4.ornate ? { layer: J.iron, color: `#e8c070`, moss: 0 } : Aj;
  for (let e5 = 0; e5 < 6; e5 += 1) {
    let o3 = e5 / 6 * Math.PI, s3 = (e5 + 1) / 6 * Math.PI, c2 = (o3 + s3) / 2, l2 = r2 / 2 - Math.cos(c2) * r2 / 2, u2 = Math.sin(c2) * i2, d2 = Math.hypot((Math.cos(s3) - Math.cos(o3)) * r2 / 2, (Math.sin(s3) - Math.sin(o3)) * i2), f2 = Math.atan2((Math.sin(s3) - Math.sin(o3)) * i2, -(Math.cos(s3) - Math.cos(o3)) * r2 / 2);
    t2.add(Y(n2, 0.04, d2 + 0.01, 0.01), a2, K(0, u2, l2, -f2, 0, 0));
  }
  for (let e5 of [-1, 1]) {
    let o3 = new Mo();
    o3.moveTo(0, 0);
    for (let e6 = 0; e6 <= 10; e6 += 1) {
      let t3 = e6 / 10 * Math.PI;
      o3.lineTo(r2 / 2 - Math.cos(t3) * r2 / 2, Math.sin(t3) * i2);
    }
    o3.lineTo(0, 0);
    let s3 = Dk(o3, 0.04, 8e-3, 10);
    t2.add(s3, a2, K(e5 * (n2 / 2 - 0.02) + 0.02, 0, 0, 0, -Math.PI / 2, 0));
  }
  let s2 = e4.stash ? [-n2 * 0.33, 0, n2 * 0.33] : [-n2 * 0.3, n2 * 0.3];
  for (let e5 of s2) {
    let n3 = [];
    for (let t3 = 0; t3 <= 10; t3 += 1) {
      let a3 = t3 / 10 * Math.PI;
      n3.push(q(e5, Math.sin(a3) * (i2 + 0.022), r2 / 2 - Math.cos(a3) * (r2 / 2 + 0.022)));
    }
    X(t2, n3, 0.03, 4, o2, { flat: 0.35 });
  }
  if (t2.add(Y(0.08, 0.14, 0.02, 6e-3), o2, K(0, -0.03, r2 + 0.012)), e4.ornate) {
    let e5 = new Uo(i2 * 0.55, 0.018, 4, 16, Math.PI);
    e5.deleteAttribute(`uv`);
    for (let i3 of [-1, 1]) t2.add(e5.clone(), o2, K(i3 * (n2 / 2 + 2e-3), 0, r2 / 2, 0, Math.PI / 2, 0));
    e5.dispose();
  }
  return t2.build({ ao: 0.6, aoRadius: 0.3, ground: false });
}
function rj(e4, t2) {
  let n2 = new VO(9360), r2 = new Id(9360);
  n2.add(Ek(9361, e4 * 0.42, 0.06, t2 * 0.36, 0.3, 1), { layer: J.FLAT, color: `#e8b040`, emissive: 0.35, moss: 0 }, K(0, 0, 0));
  for (let i2 = 0; i2 < 18; i2 += 1) n2.add(_k(0.035, 0.035, 0, 0.012, 7), { layer: J.iron, color: `#ffd070`, emissive: 0.25, moss: 0 }, K(r2.range(-e4 * 0.38, e4 * 0.38), 0.04 + r2.range(0, 0.04), r2.range(-t2 * 0.3, t2 * 0.3), r2.range(-0.6, 0.6), 0, r2.range(-0.6, 0.6)));
  return n2.add(vk(0.05, 6, 4), { layer: J.GLOSS, color: `#c01020`, emissive: 0.6, moss: 0 }, K(e4 * 0.15, 0.08, 0)), n2.build({ ao: 0, ground: false });
}
function ij(e4, t2) {
  let n2 = e4 === `stash` ? { w: 1.5, d: 0.9, h: 0.72, lidH: 0.3, ornate: false, stash: true } : { w: 1, d: 0.62, h: 0.48, lidH: 0.22, ornate: t2 % 2 == 1, stash: false }, r2 = `${e4}:${+!!n2.ornate}`, i2 = new Qr();
  i2.name = e4, i2.add(GA(WA(`${r2}:body`, () => tj(n2))));
  let a2 = new Qr();
  a2.position.set(0, n2.h, -n2.d / 2);
  let o2 = GA(WA(`${r2}:lid`, () => nj(n2)));
  a2.add(o2), i2.add(a2);
  let s2 = GA(WA(`${e4}:loot`, () => rj(n2.w, n2.d)), false);
  s2.position.set(0, n2.h - 0.14, 0), s2.visible = false, i2.add(s2);
  let c2 = JA(i2, n2.h + n2.lidH, e4 === `stash` ? 1 : 0.7);
  return c2.fx.glow = [q(0, n2.h + 0.1, 0)], c2.setState = (e5, t3) => {
    let n3 = e5 === `open` || e5 === `used` ? YA(Math.min(1, Math.max(0, t3))) : 0;
    a2.rotation.x = -n3 * 1.95, s2.visible = n3 > 0.05 && e5 !== `used`;
  }, c2;
}
function aj(e4, t2, n2) {
  let r2 = new Id(e4), i2 = t2 * r2.range(0.45, 0.9), a2 = r2.range(-0.25, -0.1), o2 = r2.range(0.1, 0.25);
  return Ck(3, 2, (e5, t3) => {
    let r3 = a2 + (o2 - a2) * e5;
    return q(Math.sin(r3) * n2, t3 * i2 - i2 / 2, Math.cos(r3) * n2 - n2 + Math.sin(t3 * Math.PI) * 0.02);
  });
}
function oj() {
  let e4 = new VO(9400), t2 = new Id(9400);
  for (let n2 = 0; n2 < 9; n2 += 1) {
    let r2 = n2 / 9 * Math.PI * 2 + t2.range(-0.3, 0.3), i2 = t2.range(0.35, 1);
    e4.add(aj(9401 + n2, 1, 0.36), { layer: J.grain, color: `#b8a080` }, K(Math.cos(r2) * i2, 0.03, Math.sin(r2) * i2, Math.PI / 2 + t2.range(-0.2, 0.2), r2 + t2.range(-0.6, 0.6), t2.range(-0.3, 0.3)));
  }
  for (let n2 = 0; n2 < 3; n2 += 1) {
    let r2 = new Uo(0.38, 0.013, 3, 16, t2.range(3.5, 6.28));
    r2.deleteAttribute(`uv`), e4.add(r2, Aj, K(t2.range(-0.5, 0.5), 0.02 + n2 * 0.015, t2.range(-0.5, 0.5), Math.PI / 2 + t2.range(-0.15, 0.15), 0, t2.next() * 6));
  }
  return e4.add(_k(0.33, 0.33, 0, 0.05, 12), { layer: J.grain, color: `#9a8466` }, K(0.1, 0, -0.05, 0.08, 0, 0.1)), e4.add(Ek(9420, 0.75, 0.012, 0.55, 0.5, 1), { layer: J.GLOSS, color: `#1a120c`, moss: 0 }, K(0, 0, 0)), e4.build({ ao: 0.6, aoRadius: 0.3 });
}
function sj() {
  return [[1e-3, 0], [0.16, 0], [0.2, 0.06], [0.3, 0.3], [0.32, 0.45], [0.27, 0.62], [0.15, 0.74], [0.13, 0.8], [0.18, 0.86], [0.17, 0.9], [0.12, 0.88]];
}
function cj() {
  return (e4, t2, n2) => {
    (e4.y > 0.42 && e4.y < 0.47 || e4.y > 0.6 && e4.y < 0.63 || e4.y > 0.1 && e4.y < 0.13) && n2.lerp(new P(`#2a1a12`), 0.8), e4.y > 0.48 && e4.y < 0.58 && Math.abs(Math.atan2(e4.z, e4.x) * 6 / Math.PI % 2 - 1) < (e4.y - 0.48) * 10 && n2.lerp(new P(`#2a1a12`), 0.7);
  };
}
function lj() {
  let e4 = new VO(9500);
  e4.add(Sk(sj(), 14), { layer: J.plaster, color: `#c48a62`, moss: 0.2, paint: cj() });
  for (let t2 of [-1, 1]) X(e4, [q(t2 * 0.15, 0.78, 0), q(t2 * 0.3, 0.76, 0), q(t2 * 0.31, 0.6, 0), q(t2 * 0.26, 0.52, 0)], 0.022, 5, { layer: J.plaster, color: `#b87e58` });
  return e4.add(_k(0.12, 0.12, 0.84, 0.86, 10), { layer: J.FLAT, color: `#0d0a08`, moss: 0 }), e4.build({ ao: 0.7, aoRadius: 0.3 });
}
function uj() {
  let e4 = new VO(9510), t2 = new Id(9510), n2 = sj().slice(0, 4);
  n2.push([0.29, 0.22]), e4.add(Sk(n2, 14), { layer: J.plaster, color: `#c48a62`, paint: cj() }), e4.add(_k(0.27, 0.27, 0.15, 0.17, 12), { layer: J.FLAT, color: `#2a2018`, moss: 0 });
  for (let n3 = 0; n3 < 9; n3 += 1) {
    let n4 = t2.range(0, Math.PI * 2), r2 = t2.range(0.35, 0.95), i2 = Ck(2, 2, (e5, n5) => {
      let r3 = (e5 - 0.5) * t2.range(0.6, 1.1);
      return q(Math.sin(r3) * 0.3, (n5 - 0.5) * t2.range(0.12, 0.25), Math.cos(r3) * 0.3 - 0.3);
    });
    e4.add(i2, { layer: J.plaster, color: `#c48a62`, paint: cj() }, K(Math.cos(n4) * r2, 0.03, Math.sin(n4) * r2, Math.PI / 2 + t2.range(-0.4, 0.4), t2.range(0, 6.28), 0));
  }
  return e4.add(Ek(9520, 0.5, 0.02, 0.45, 0.6, 1), { layer: J.dirt, color: `#8a7a64`, moss: 0 }, K(0.1, 0, 0.1)), MA(e4, q(0.3, 0.03, -0.2), q(0.6, 0.03, -0.1), 0.018), e4.build({ ao: 0.6, aoRadius: 0.3 });
}
function dj(e4) {
  let t2 = new Qr();
  t2.name = e4;
  let n2 = GA(WA(`${e4}:intact`, () => {
    if (e4 === `urn`) return lj();
    let t3 = new VO(9450);
    return FA(t3, K(0, -0.02, 0, 0, 0.4, 0)), t3.build({ ao: 0.75, aoRadius: 0.35 });
  })), r2 = GA(WA(`${e4}:debris`, e4 === `urn` ? uj : oj), false);
  r2.visible = false, t2.add(n2, r2);
  let i2 = JA(t2, e4 === `urn` ? 0.9 : 1, 0.5);
  return i2.setState = (e5, t3) => {
    let i3 = e5 === `broken` && t3 > 0;
    if (n2.visible = !i3, r2.visible = i3, i3) {
      let e6 = YA(Math.min(1, t3));
      r2.scale.setScalar(0.55 + 0.45 * e6), r2.position.y = (1 - e6) * 0.35;
    }
  }, i2;
}
function fj() {
  let e4 = new Mo();
  return e4.moveTo(-0.22, -1), e4.lineTo(0.22, -1), e4.lineTo(0.36, 0.45), e4.lineTo(0.26, 1), e4.lineTo(-0.26, 1), e4.lineTo(-0.36, 0.45), e4.lineTo(-0.22, -1), e4;
}
function pj() {
  let e4 = new VO(9600);
  e4.add(hk(0.95, 0.45, 2.3, 9601, 0.2), { layer: J.rock, color: `#cfc8bc` }, K(0, 0.12, 0)), e4.add(Y(1.05, 0.08, 2.4, 0.03), { layer: J.rock, color: `#c8c0b2` }, K(0, 0.38, 0));
  let t2 = fj(), n2 = new jo(fj().getPoints(1).map((e5) => new M(e5.x * 0.86, e5.y * 0.94)).reverse());
  t2.holes.push(n2);
  let r2 = Dk(t2, 0.42, 0.012, 1);
  e4.add(r2, { layer: J.grain, color: `#8a6a50` }, K(0, 0.63, 0, Math.PI / 2, 0, 0)), e4.add(Dk(fj(), 0.04, 5e-3, 1), { layer: J.grain, color: `#6a5040` }, K(0, 0.44, 0, Math.PI / 2, 0, 0)), e4.add(Dk(new Mo(fj().getPoints(1).map((e5) => new M(e5.x * 0.84, e5.y * 0.92))), 0.01, 0, 1), { layer: J.FLAT, color: `#0d0907`, moss: 0 }, K(0, 0.47, 0, Math.PI / 2, 0, 0)), PA(e4, K(0, 0.5, 0.15, 0, Math.PI, 0), 0.9, `#d8ccb0`), jA(e4, K(0, 0.48, 0.7, -1.3, 0, 0), 1);
  for (let t3 of [-1, 1]) MA(e4, q(t3 * 0.08, 0.5, -0.2), q(t3 * 0.1, 0.5, -0.8), 0.02);
  for (let t3 of [-1, 1]) for (let n3 of [-0.5, 0.5]) AA(e4, q(t3 * 0.33, 0.62, n3), q(t3, 0, 0), 0.015);
  return e4.build({ ao: 0.75, aoRadius: 0.4 });
}
function mj() {
  let e4 = new VO(9610);
  return e4.add(Dk(fj(), 0.06, 0.015, 1), { layer: J.grain, color: `#8f6f54` }, K(0, 0.03, 0, Math.PI / 2, 0, 0)), e4.add(Y(0.08, 0.025, 1.1, 8e-3), { layer: J.iron, color: `#b8a070`, moss: 0 }, K(0, 0.075, 0.1)), e4.add(Y(0.42, 0.025, 0.08, 8e-3), { layer: J.iron, color: `#b8a070`, moss: 0 }, K(0, 0.075, 0.42)), e4.build({ ao: 0.5, aoRadius: 0.2, ground: false });
}
function hj() {
  let e4 = new Qr();
  e4.name = `coffin`, e4.add(GA(WA(`coffin:base`, pj)));
  let t2 = new Qr();
  t2.position.set(0.36, 0.63, 0);
  let n2 = GA(WA(`coffin:lid`, mj));
  n2.position.set(-0.36, 0, 0), t2.add(n2), e4.add(t2);
  let r2 = JA(e4, 0.75, 1);
  return r2.setState = (e5, n3) => {
    let r3 = e5 === `open` || e5 === `used` || e5 === `broken` ? YA(Math.min(1, n3)) : 0;
    t2.rotation.z = -r3 * 1.9, t2.position.x = 0.36 + r3 * 0.35, t2.position.y = 0.63 - r3 * 0.25;
  }, r2;
}
function gj() {
  let e4 = new VO(9700), t2 = { layer: J.rock, color: `#d4cdc1` };
  e4.add(hk(2, 0.24, 1.6, 9701, 0.2), t2, K(0, 0, 0)), e4.add(hk(1.6, 0.22, 1.25, 9702, 0.2), t2, K(0, 0.2, 0)), e4.add(Y(1.05, 0.75, 0.75, 0.05), { layer: J.stone, color: `#d8d0c2`, texScale: 1.2 }, K(0, 0.68, 0)), e4.add(Y(0.75, 0.48, 0.03, 0.01), { layer: J.rock, color: `#bdb5a8` }, K(0, 0.68, 0.38)), e4.add(Y(1.2, 0.1, 0.9, 0.03), t2, K(0, 1.08, 0)), e4.add(Sk([[1e-3, 0], [0.18, 0], [0.12, 0.08], [0.12, 0.18], [0.3, 0.28], [0.42, 0.42], [0.44, 0.48], [0.38, 0.48], [0.34, 0.44]], 16), { ...t2, color: `#ded7cb` }, K(0, 1.12, 0));
  for (let n2 of [-1, 1]) e4.add(hk(0.32, 1.25, 0.32, 9710 + n2, 0.15), t2, K(n2 * 0.88, 0.85, -0.35)), e4.add(pk([q(-0.2, 0, -0.2), q(0.2, 0, -0.2), q(-0.2, 0, 0.2), q(0.2, 0, 0.2), q(0, 0.35, 0)]), t2, K(n2 * 0.88, 1.47, -0.35));
  for (let [t3, n2] of [[-0.42, 0.22], [0.45, 0.25], [0.38, -0.25]]) e4.add(_k(0.035, 0.04, 1.13, 1.25 + Math.abs(t3) * 0.1, 6), { layer: J.FLAT, color: `#e8dcc0`, moss: 0 }, K(t3, 0, n2)), e4.add(vk(0.022, 5, 4), { layer: J.FLAT, color: `#ffc86a`, emissive: -3, ao: false, occlude: false }, K(t3, 1.28 + Math.abs(t3) * 0.1, n2, 0, 0, 0, 1, 1.6, 1));
  return VA(e4, K(), 1.6, 7, 9720, J.rock, `#bdb6aa`, 0.08), e4.build({ ao: 0.8, aoRadius: 0.5 });
}
function _j(e4) {
  let t2 = new qo({ uniforms: { uColor: { value: new P(e4) }, uTime: { value: 0 }, uLevel: { value: 1 } }, vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `, fragmentShader: `
      uniform vec3 uColor; uniform float uTime; uniform float uLevel;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float a = atan(p.y, p.x);
        float swirl = sin(a * 3.0 + r * 9.0 - uTime * 1.6) * 0.5 + 0.5;
        float caust = sin(p.x * 13.0 + uTime * 1.1) * sin(p.y * 11.0 - uTime * 0.9) * 0.5 + 0.5;
        float k = mix(0.45, 1.0, swirl * 0.6 + caust * 0.4) * (1.0 - smoothstep(0.75, 1.0, r) * 0.5) + smoothstep(0.3, 0.0, r) * 0.6;
        vec3 col = mix(uColor * 0.5, mix(uColor, vec3(1.0), 0.45), k);
        gl_FragColor = vec4(col * uLevel * (0.6 + 1.6 * k), 1.0);
      }
    ` });
  return t2.userData.perInstance = true, t2;
}
function vj(e4) {
  let t2 = new Qr();
  t2.name = `shrine`, t2.add(GA(WA(`shrine`, gj)));
  let n2 = Pj[e4 ?? ``] ?? `#7fd4ff`, r2 = _j(n2), i2 = new xa(new so(0.36, 32).rotateX(-Math.PI / 2), r2);
  i2.position.y = 1.56, t2.add(i2);
  let a2 = KA(n2);
  a2.userData.perInstance = true;
  let o2 = [];
  for (let e5 = 0; e5 < 3; e5 += 1) {
    let t3 = new ao(e5 === 1 ? 0.3 : 0.04, e5 === 1 ? 0.04 : 0.3, 0.015);
    t3.translate(e5 === 1 ? 0 : e5 === 0 ? -0.1 : 0.1, 0.7, 0.4), o2.push(t3.toNonIndexed()), t3.dispose();
  }
  for (let e5 of [-1, 1]) {
    let t3 = new zo(0.09, 0).scale(1, 1.8, 1);
    t3.translate(e5 * 0.88, 1.92, -0.35), o2.push(t3);
  }
  for (let e5 of o2) e5.deleteAttribute(`uv`);
  let s2 = new xa(W_(o2), a2);
  for (let e5 of o2) e5.dispose();
  t2.add(s2);
  let c2 = JA(t2, 2, 1);
  c2.fx.glow = [q(0, 1.62, 0), q(-0.88, 1.92, -0.35), q(0.88, 1.92, -0.35)];
  let l2 = 1, u2 = () => {
    r2.uniforms.uLevel.value = l2, qA(a2, 0.3 + l2 * 2.2);
  };
  return c2.setState = (e5, t3) => {
    l2 = e5 === `used` ? 1 - 0.88 * Math.min(1, t3) : e5 === `active` ? 1 + 0.6 * t3 : 1, u2();
  }, c2.update = (e5) => {
    r2.uniforms.uTime.value = e5;
  }, u2(), c2;
}
function yj(e4) {
  let t2 = new VO(e4 ? 9810 : 9800), n2 = e4 ? 1.25 : 0.82, r2 = e4 ? 13 : 10;
  for (let i3 = 0; i3 < r2; i3 += 1) {
    let a2 = i3 / r2 * Math.PI * 2, o2 = e4 ? 0.28 : 0.2;
    t2.add(Tk(9801 + i3 + (e4 ? 50 : 0), o2 * 1.2, o2 * 0.8, o2, { detail: 1, cuts: 4 }), { layer: J.rock, color: `#c4bcb0`, paint: (e5, t3, r3) => {
      Math.hypot(e5.x, e5.z) < n2 && r3.lerp(new P(`#2a2420`), 0.6);
    } }, K(Math.cos(a2) * n2, 0, Math.sin(a2) * n2, 0, -a2, 0));
  }
  RA(t2, K(), n2 * 0.72, e4 ? 9820 : 9821, e4 ? 26 : 16, 2.6);
  let i2 = e4 ? 7 : 4;
  for (let r3 = 0; r3 < i2; r3 += 1) {
    let a2 = r3 / i2 * Math.PI * 2 + 0.3, o2 = q(Math.cos(a2) * n2 * 0.85, 0.05, Math.sin(a2) * n2 * 0.85), s2 = e4 ? q(Math.cos(a2) * 0.1, 1.15, Math.sin(a2) * 0.1) : q(-Math.cos(a2) * 0.25, 0.22, -Math.sin(a2) * 0.25);
    wA(t2, o2, s2, e4 ? 0.11 : 0.085, { seed: 9830 + r3, layer: J.deadwood, color: `#3a332e`, capColor: `#ff6a20`, paint: (e5, t3, r4) => {
      let i3 = Math.max(0, 1 - Math.hypot(e5.x, e5.z) / (n2 * 0.8));
      r4.lerp(new P(`#120d0a`), i3 * 0.8);
    } });
    let c2 = o2.clone().lerp(s2, 0.65);
    X(t2, [o2.clone().lerp(s2, 0.35).add(q(0, -0.02, 0)), c2.add(q(0, -0.03, 0))], 0.03, 4, { layer: J.FLAT, color: HA.ember, emissive: -2.4, ao: false, occlude: false });
  }
  if (e4) {
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let r3 = e5 / 3 * Math.PI * 2 + 0.5;
      X(t2, [q(Math.cos(r3) * (n2 + 0.45), -0.05, Math.sin(r3) * (n2 + 0.45)), q(0, 2.3, 0)], 0.03, 4, Aj);
    }
    for (let e5 = 0; e5 < 5; e5 += 1) {
      let n3 = new Uo(0.035, 9e-3, 3, 6);
      n3.deleteAttribute(`uv`), t2.add(n3, Aj, K(0, 2.25 - e5 * 0.06, 0, 0, e5 % 2 * Math.PI / 2, 0, 1, 1.4, 1));
    }
    t2.group(K(0, 1.45, 0), () => {
      t2.add(Sk([[1e-3, 0], [0.22, 0.02], [0.32, 0.15], [0.33, 0.3], [0.3, 0.38], [0.32, 0.4], [0.28, 0.4]], 14), { layer: J.iron, color: `#5a5550`, moss: 0 }), t2.add(_k(0.29, 0.29, 0.34, 0.35, 12), { layer: J.GLOSS, color: `#3a2a12`, moss: 0 }), X(t2, [q(-0.31, 0.38, 0), q(0, 0.75, 0), q(0.31, 0.38, 0)], 0.01, 3, Aj);
    });
    for (let e5 = 0; e5 < 3; e5 += 1) wA(t2, q(n2 + 0.7, 0.12 + e5 * 0, -0.6 + e5 * 0.26), q(n2 + 1.5, 0.12, -0.5 + e5 * 0.26), 0.12, { seed: 9850 + e5, color: `#bcab94`, radial: 6 });
  }
  return t2.build({ ao: 0.7, aoRadius: 0.5 });
}
function bj(e4) {
  let t2 = new Qr();
  t2.name = e4 ? `bonfire` : `campfire`, t2.add(GA(WA(e4 ? `campfire:big` : `campfire`, () => yj(e4)), true));
  let n2 = JA(t2, e4 ? 2.4 : 0.6, e4 ? 1.4 : 0.9);
  return n2.fx.fire = e4 ? [q(0, 0.35, 0), q(0.25, 0.25, 0.15), q(-0.2, 0.25, -0.15), q(0, 0.8, 0)] : [q(0, 0.15, 0), q(0.12, 0.12, -0.08)], n2;
}
function xj() {
  let e4 = new VO(9900), t2 = (t3, n3, r3, i2, a2, o2, s2, c2, l2 = 0) => e4.add(Tk(t3, n3, r3, i2, { cuts: 6, rough: 0.3, crease: 34 }), { layer: J.rock, color: `#c9c2b6` }, K(a2, o2, s2, 0, c2, l2));
  t2(9901, 1.25, 1.9, 1.6, -2.35, -0.1, -0.7, 0.3, 0.08), t2(9902, 1.2, 2, 1.5, 2.35, -0.1, -0.6, -0.4, -0.06), t2(9903, 2.6, 2.3, 1.25, 0, 0.05, -2.75, 0.1), t2(9904, 0.95, 1.05, 1, -2.6, -0.1, 0.9, 0.8), t2(9905, 0.9, 1, 0.9, 2.65, -0.1, 0.85, -0.6), t2(9907, 1.3, 0.8, 1.2, -1.4, 2, -1.6, 0.6), t2(9908, 1.2, 0.75, 1.1, 1.5, 2.1, -1.5, -0.3), e4.add(Tk(9906, 1.9, 0.55, 0.9, { cuts: 6, crease: 30, flatBottom: false }), { layer: J.rock, color: `#cfc8bc` }, K(0.05, 2.45, -0.1, 0.06, 0.05, -0.05));
  let n2 = { layer: J.FLAT, color: `#050404`, moss: 0, ao: false }, r2 = (e5, t3) => q((e5 - 0.5) * 2.2 * (1 - t3 * 0.3), 0.07 - t3 * 0.05, 1 - t3 * 2.7);
  e4.add(Ck(4, 6, r2, false), { ...n2, paint: (e5, t3, n3) => n3.lerp(new P(`#33261a`), Math.max(0, Math.min(1, (e5.z - 0.45) * 1.6)) * 0.7) });
  for (let t3 of [-1, 1]) e4.add(Ck(1, 6, (e5, n3) => {
    let i2 = r2(t3 < 0 ? 0 : 1, n3);
    return q(i2.x, i2.y + e5 * 2.2, i2.z);
  }, true), n2);
  e4.add(Ck(4, 6, (e5, t3) => {
    let n3 = r2(e5, t3);
    return q(n3.x, 2.15 - t3 * 0.35, n3.z);
  }, true), n2), e4.add(Ck(3, 2, (e5, t3) => q((e5 - 0.5) * 1.6, 0.02 + t3 * 1.85, -1.68), true), n2);
  for (let t3 of [-1, 1]) DA(e4, t3 * 1.12, 0.85, -0.2, 2.25, 0.1, { seed: 9910 + t3, layer: J.deadwood, color: `#9a8e7c`, lean: [-t3 * 0.1, 0] });
  wA(e4, q(-1.4, 2.2, 0.88), q(1.4, 2.24, 0.88), 0.11, { seed: 9913, layer: J.deadwood, color: `#9a8e7c`, radial: 6 });
  for (let t3 = 0; t3 < 9; t3 += 1) {
    let n3 = -0.95 + t3 * 0.24, r3 = 0.45 + t3 * 37 % 5 * 0.1, i2 = q(n3, 2.25, 0.98 + t3 % 2 * 0.08);
    X(e4, [i2, i2.clone().add(q(0.05, -r3 * 0.5, 0.03)), i2.clone().add(q(-0.03, -r3, 0))], (e5) => 0.025 * (1 - e5 * 0.8), 3, { layer: J.bark, color: `#8a7a64`, sway: 0.25 });
  }
  jA(e4, K(-0.75, 0, 1.45, -0.2, 0.4, 0.1), 1.1), jA(e4, K(0.85, 0, 1.6, 0.1, -0.5, -0.2), 1, { jaw: false }), jA(e4, K(0.05, 2.92, 0.35, 0.2, 0, 0), 1.6, { horns: true }), MA(e4, q(0.15, 0.03, 1.75), q(0.55, 0.03, 2.05), 0.022), MA(e4, q(-0.3, 0.03, 1.95), q(-0.75, 0.04, 1.75), 0.02), PA(e4, K(1.35, 0, 1.65, 0.2, 0.9, 1.3), 0.9);
  for (let t3 = 0; t3 < 4; t3 += 1) {
    let n3 = 1.9 + t3 * 0.6;
    e4.add(Ek(9930 + t3, 0.5, 0.18, 0.45, 0.45, 1, 2.4), { layer: J.moss, color: `#8a915e`, moss: 0 }, K(Math.cos(n3) * 1.9, 2 - t3 * 0.15, -Math.sin(n3) * 1.3 - 0.7));
  }
  return VA(e4, K(0, 0, 1.5), 2.2, 12, 9940, J.rock, `#bdb6aa`, 0.1), e4.build({ ao: 0.85, aoRadius: 1 });
}
function Sj() {
  let e4 = new Qr();
  e4.name = `denEntrance`, e4.add(GA(WA(`den`, xj)));
  let t2 = new xa(new so(0.6, 24), KA(`#5aff7a`));
  t2.material.userData.perInstance = true, t2.position.set(0, 0.55, -1.6), t2.rotation.x = 0, e4.add(t2);
  let n2 = JA(e4, 3.2, 2.4);
  n2.fx.glow = [q(0, 0.2, -0.6)];
  let r2 = 0;
  return n2.setState = (e5, t3) => {
    r2 = e5 === `active` ? t3 : 0;
  }, n2.update = (e5) => {
    let n3 = 0.18 + 0.08 * Math.sin(e5 * 1.3) + r2 * (0.4 + 0.3 * Math.sin(e5 * 5));
    qA(t2.material, n3);
  }, n2.update(0), n2;
}
function Cj(e4) {
  let t2 = document.createElement(`canvas`);
  t2.width = 512, t2.height = 96;
  let n2 = t2.getContext(`2d`);
  n2.fillStyle = `#ffffff`, n2.fillRect(0, 0, 512, 96), n2.fillStyle = `#2a1a10`, n2.font = `600 46px Cinzel, Georgia, serif`, n2.textAlign = `center`, n2.textBaseline = `middle`;
  let r2 = e4.replace(/^To\s+/i, ``).toUpperCase();
  n2.fillText(r2, 256, 52, 480);
  let i2 = new to(t2);
  return i2.colorSpace = Vn, i2.anisotropy = 4, i2;
}
function wj() {
  let e4 = new VO(9950);
  DA(e4, 0, 0, -0.35, 2.35, 0.08, { seed: 9951, layer: J.deadwood, color: `#c2b8a6`, radial: 7 });
  let t2 = new Mo();
  t2.moveTo(-0.6, -0.14), t2.lineTo(0.55, -0.14), t2.lineTo(0.75, 0), t2.lineTo(0.55, 0.14), t2.lineTo(-0.6, 0.14), t2.lineTo(-0.6, -0.14), e4.add(Dk(t2, 0.05, 0.01, 1), { ...jj, color: `#b8a080` }, K(0.32, 1.72, 0.07, 0, 0, -0.04)), e4.add(Dk(t2, 0.05, 0.01, 1), { ...jj, color: `#a89070` }, K(-0.25, 1.38, -0.07, 0, Math.PI, 0.06));
  for (let t3 of [1.72, 1.38]) AA(e4, q(0, t3, t3 > 1.5 ? 0.11 : -0.11), q(0, 0, t3 > 1.5 ? 1 : -1), 0.016);
  EA(e4, q(0, 2.15, 0), q(-0.62, 2.18, 0), 0.06, 0.05, Fj), e4.add(yk(0.11, 0.1, 6), Aj, K(-0.55, 1.98, 0)), e4.add(_k(0.1, 0.11, 1.68, 1.71, 6), Aj, K(-0.55, 0, 0));
  for (let t3 = 0; t3 < 4; t3 += 1) {
    let n2 = t3 / 4 * Math.PI * 2 + 0.4;
    e4.add(Y(0.014, 0.28, 0.014, 3e-3), Aj, K(-0.55 + Math.cos(n2) * 0.1, 1.84, Math.sin(n2) * 0.1));
  }
  X(e4, [q(-0.55, 2.13, 0), q(-0.55, 2.06, 0)], 8e-3, 3, Aj), e4.add(_k(0.085, 0.085, 1.72, 1.96, 6), { layer: J.FLAT, color: `#ffb35a`, emissive: -2.6, ao: false, occlude: false }, K(-0.55, 0, 0));
  for (let t3 = 0; t3 < 5; t3 += 1) {
    let n2 = t3 / 5 * Math.PI * 2;
    e4.add(Tk(9960 + t3, 0.2, 0.17, 0.18, { detail: 1, cuts: 3 }), { layer: J.rock, color: `#c4bcb0` }, K(Math.cos(n2) * 0.22, 0, Math.sin(n2) * 0.22, 0, n2));
  }
  return e4.build({ ao: 0.75, aoRadius: 0.4 });
}
function Tj(e4) {
  let t2 = new Qr();
  if (t2.name = `exit`, t2.add(GA(WA(`exit`, wj))), e4) {
    let n3 = Cj(e4), r3 = new la({ map: n3, transparent: true, depthWrite: false, blending: 4, premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    r3.userData.perInstance = true, r3.userData.tex = n3;
    let i2 = new xa(new Bo(1.12, 0.21), r3);
    i2.position.set(0.3, 1.72, 0.108), i2.rotation.z = -0.04, t2.add(i2);
  }
  let n2 = JA(t2, 2.4, 0.8);
  n2.fx.glow = [q(-0.55, 1.84, 0)], n2.fx.fire = [q(-0.55, 1.84, 0)];
  let r2 = n2.dispose;
  return n2.dispose = () => {
    t2.traverse((e5) => {
      let t3 = e5.material;
      t3 && t3.userData.tex && t3.userData.tex.dispose();
    }), r2();
  }, n2;
}
function Ej() {
  let e4 = new qo({ uniforms: { uTime: { value: 0 }, uOpen: { value: 1 }, uColA: { value: new P(`#0a1e6a`) }, uColB: { value: new P(`#3aa0ff`) }, uColC: { value: new P(`#d8f0ff`) } }, vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `, fragmentShader: `
      uniform float uTime; uniform float uOpen; uniform vec3 uColA; uniform vec3 uColB; uniform vec3 uColC;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        vec2 p = (vUv - 0.5) * vec2(2.0, 2.0);
        float r = length(p);
        float edge = 1.0 - smoothstep(0.86, 1.0, r);
        if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        float sw = a + r * 4.5 - uTime * 2.2;
        // periodic in angle: sample the noise on circles so there is no seam at atan's wrap
        vec2 ring1 = vec2(cos(sw), sin(sw)) * 1.6 + vec2(r * 5.0 - uTime * 1.2, 3.1);
        vec2 ring2 = vec2(cos(sw * 2.0), sin(sw * 2.0)) * 2.4 + vec2(r * 9.0 + uTime * 0.8, 7.3);
        float bands = n2(ring1) * 0.7 + n2(ring2) * 0.3;
        float core = smoothstep(0.55, 0.0, r);
        float rim = smoothstep(0.7, 0.98, r) * edge;
        vec3 col = mix(uColA, uColB, bands);
        col = mix(col, uColC, core * 0.3 + rim * 0.65);
        float k = (0.45 + 1.1 * bands) * edge + core * 0.7 + rim * 1.8;
        gl_FragColor = vec4(col * k * 0.85 * uOpen, 1.0);
      }
    `, transparent: true, depthWrite: false, side: 2, blending: 2 });
  return e4.userData.perInstance = true, e4;
}
function Dj() {
  let e4 = new Qr();
  e4.name = `portal`;
  let t2 = Ej(), n2 = new xa(new Bo(1.6, 2.7), t2);
  n2.position.y = 1.45, n2.renderOrder = 4, e4.add(n2);
  let r2 = KA(`#7ac8ff`);
  r2.userData.perInstance = true;
  let i2 = new xa(new Uo(1, 0.025, 6, 48), r2);
  i2.scale.set(0.8, 1.35, 1), i2.position.y = 1.45, e4.add(i2);
  let a2 = ZA(`#3aa0ff`, 0.55, 0.78, 1);
  a2.uniforms.uLevel.value = 1.4;
  let o2 = new xa(new so(1, 48).rotateX(-Math.PI / 2), a2);
  o2.position.y = 0.03, e4.add(o2);
  let s2 = JA(e4, 2.9, 0.9);
  s2.fx.portal = q(0, 1.45, 0), s2.fx.glow = [q(0, 1.45, 0)];
  let c2 = 1, l2 = () => {
    let e5 = YA(c2);
    n2.scale.set(Math.max(1e-3, e5), Math.max(1e-3, 0.2 + 0.8 * e5), 1), i2.scale.set(0.8 * Math.max(1e-3, e5), 1.35 * Math.max(1e-3, 0.2 + 0.8 * e5), 1), t2.uniforms.uOpen.value = e5, qA(r2, 1.6 * e5), a2.uniforms.uLevel.value = 1.4 * e5;
  };
  return s2.setState = (e5, t3) => {
    c2 = e5 === `used` ? 1 - Math.min(1, t3) : e5 === `active` || e5 === `open` ? Math.min(1, t3) : 1, l2();
  }, s2.update = (e5) => {
    t2.uniforms.uTime.value = e5, a2.uniforms.uTime.value = e5;
  }, l2(), s2;
}
function Oj(e4, t2 = {}) {
  let n2 = t2.variant ?? 0;
  switch (e4) {
    case `waypoint`:
      return ej();
    case `stash`:
      return ij(`stash`, 0);
    case `chest`:
      return ij(`chest`, n2);
    case `barrel`:
      return dj(`barrel`);
    case `urn`:
      return dj(`urn`);
    case `coffin`:
      return hj();
    case `shrine`:
      return vj(t2.label);
    case `campfire`:
      return bj(n2 % 2 == 1);
    case `denEntrance`:
      return Sj();
    case `exit`:
      return Tj(t2.label);
    case `portal`:
      return Dj();
    default: {
      let t3 = new Qr();
      return t3.name = String(e4), JA(t3, 0, 0.5);
    }
  }
}
function kj() {
  for (let e4 of Mj.values()) e4.dispose();
  Mj.clear();
}
var Aj, jj, Mj, Nj, Pj, Fj, Ij = t((() => {
  Ed(), J_(), UO(), kk(), UA(), pA(), Aj = { layer: J.iron, color: `#a29c95`, moss: 0 }, jj = { layer: J.grain, color: `#d0bc9c` }, Mj = /* @__PURE__ */ new Map(), Nj = null, Pj = { experience: `#ffd36a`, armor: `#9ab8ff`, combat: `#ff7a4a`, mana: `#5a8cff`, health: `#ff4a5a` }, Fj = { layer: J.deadwood, color: `#c2b8a6` };
}));
function Lj(e4, t2, n2) {
  return e4.clone().applyAxisAngle(t2.clone().normalize(), n2);
}
function Rj(e4, t2) {
  let n2 = (Math.abs(e4.y) < 0.9 ? q(0, 1, 0) : q(1, 0, 0)).clone().cross(e4).normalize(), r2 = e4.clone().cross(n2).normalize();
  return n2.multiplyScalar(Math.cos(t2)).addScaledVector(r2, Math.sin(t2));
}
function zj(e4, t2) {
  let n2 = new Id(t2.seed), r2 = t2.height, i2 = (e5) => ({ layer: t2.dead ? J.deadwood : J.bark, color: t2.barkColor, gain: t2.dead ? 1.25 : 1, moss: e5 === 0 ? 0.55 : 0.25, sway: e5 === 0 ? 0 : (t3) => YO(r2 * 0.25, r2, t3.y) * (0.06 + e5 * 0.07), paint: t2.mossSide ? (e6, t3, n3) => {
    let r3 = YO(1.6, 0.2, e6.y) * YO(-0.2, 0.6, -t3.z + KO(e6.x * 3, e6.y * 3, e6.z * 3, 5) * 0.5);
    n3.lerp(new P(`#5d6b3a`), r3 * 0.75);
  } : void 0 }), a2 = t2.snap ? r2 * t2.snap : r2, o2 = [];
  for (let e5 = 0; e5 <= 9; e5 += 1) {
    let n3 = e5 / 9, r3 = -0.25 + (a2 + 0.25) * n3, i3 = t2.gnarl * (0.3 + n3);
    o2.push(q(t2.lean[0] * n3 * n3 + KO(t2.seed, n3 * 2.2, 0.5) * i3, r3, t2.lean[1] * n3 * n3 + KO(t2.seed + 7, n3 * 2.2, 0.5) * i3));
  }
  let s2 = (e5) => {
    let n3 = -0.25 + (a2 + 0.25) * e5, r3 = 1 + t2.flare * Math.max(0, 1 - n3 / 0.9) ** 2;
    return t2.trunkR * r3 * (1 - e5 * (t2.snap ? 0.35 : 0.72));
  };
  X(e4, o2, s2, 10, i2(0), { bumps: 0.1, bumpFreq: 2.5, seed: t2.seed, capEnd: !!t2.snap });
  for (let r3 = 0; r3 < t2.roots; r3 += 1) {
    let a3 = r3 / t2.roots * Math.PI * 2 + n2.range(-0.3, 0.3), o3 = n2.range(0.7, 1.3) * t2.trunkR * 3.2, s3 = [];
    for (let e5 = 0; e5 <= 5; e5 += 1) {
      let n3 = e5 / 5, i3 = t2.trunkR * 0.5 + o3 * n3;
      s3.push(q(Math.cos(a3) * i3 + KO(r3, n3 * 3, 1) * 0.08, 0.28 * (1 - n3) - 0.12 * n3 * n3, Math.sin(a3) * i3 + KO(r3, n3 * 3, 2) * 0.08));
    }
    X(e4, s3, (e5) => t2.trunkR * 0.42 * (1 - e5 * 0.8), 5, { ...i2(0), moss: 0.7 }, { pointEnd: 0.08 });
  }
  let c2 = (r3, a3, o3, s3, l2, u2) => {
    let d2 = l2 === 1 ? 6 : l2 === 2 ? 5 : 3, f2 = [r3.clone()], p2 = a3.clone(), m2 = r3.clone();
    for (let e5 = 1; e5 <= d2; e5 += 1) {
      let n3 = e5 / d2, r4 = t2.gnarl * 1.2;
      p2.x += KO(u2, n3 * 3, 0.3) * r4, p2.z += KO(u2 + 3, n3 * 3, 0.6) * r4, p2.y += KO(u2 + 5, n3 * 3, 0.9) * r4 * 0.5 + t2.rise * 0.18 - (l2 > 1 ? 0.05 : 0), p2 = p2.normalize(), m2 = m2.clone().addScaledVector(p2, o3 / d2), f2.push(m2);
    }
    if (X(e4, f2, (e5) => s3 * (1 - e5 * 0.82), l2 === 1 ? 6 : l2 === 2 ? 5 : 3, i2(l2), { pointEnd: l2 >= 2 ? s3 * 2 : s3 * 1.2 }), t2.onTip && l2 >= 1 && t2.onTip(e4, m2, p2, l2, s3), l2 >= t2.depth) return;
    let h2 = n2.int(t2.childCount[0], t2.childCount[1]);
    for (let e5 = 0; e5 < h2; e5 += 1) {
      let t3 = n2.range(0.35, 0.9), r4 = Math.min(f2.length - 2, Math.floor(t3 * (f2.length - 1))), i3 = f2[r4].clone().lerp(f2[r4 + 1], 0.5), a4 = f2[r4 + 1].clone().sub(f2[r4]).normalize();
      c2(i3, Lj(a4, Rj(a4, n2.range(0, Math.PI * 2)), n2.range(0.45, 0.95)), o3 * n2.range(0.42, 0.62), s3 * (1 - t3 * 0.8) * n2.range(0.55, 0.75), l2 + 1, u2 * 3 + e5 + 11);
    }
  };
  for (let e5 = 0; e5 < t2.limbs; e5 += 1) {
    let r3 = t2.limbStart + (1 - t2.limbStart) * (t2.limbs === 1 ? 0.6 : e5 / (t2.limbs - 1)) * 0.92, i3 = Math.min(o2.length - 2, Math.floor(r3 * (o2.length - 1))), a3 = o2[i3].clone().lerp(o2[i3 + 1], 0.5), l2 = e5 * 2.39996 + t2.seed, u2 = n2.range(t2.limbAngle[0], t2.limbAngle[1]);
    c2(a3, q(Math.cos(l2) * Math.cos(u2), Math.sin(u2), Math.sin(l2) * Math.cos(u2)).normalize(), t2.limbLen * (1.15 - r3 * 0.5) * n2.range(0.8, 1.15), s2(r3) * n2.range(0.5, 0.68), 1, t2.seed * 17 + e5);
  }
  for (let t3 = 0; t3 < 3; t3 += 1) {
    let t4 = n2.range(0.15, 0.6), r3 = o2[Math.floor(t4 * (o2.length - 1))], a3 = n2.range(0, Math.PI * 2), c3 = q(Math.cos(a3), n2.range(-0.1, 0.4), Math.sin(a3)).normalize(), l2 = s2(t4) * 0.35;
    X(e4, [r3.clone().addScaledVector(c3, s2(t4) * 0.5), r3.clone().addScaledVector(c3, s2(t4) * 0.5 + l2 * 2.2)], [l2, l2 * 0.6], 5, i2(0), { capEnd: true });
  }
}
function Bj(e4, t2, n2, r2, i2, a2, o2, s2, c2 = 0.55, l2 = [0.15, 0.26], u2 = 0.42) {
  let d2 = new Id(o2 * 13 + 5), f2 = q(0, 0, 1);
  for (let o3 = 0; o3 < a2; o3 += 1) {
    let a3 = d2.next() * 2 - 1, o4 = d2.next() * Math.PI * 2, u3 = Math.sqrt(1 - a3 * a3), p2 = 0.62 + 0.38 * Math.sqrt(d2.next()), m2 = q(u3 * Math.cos(o4), a3 * 0.9 + 0.1, u3 * Math.sin(o4)), h2 = q(t2.x + m2.x * n2 * p2, t2.y + m2.y * r2 * p2, t2.z + m2.z * i2 * p2), g2 = m2.clone().normalize().add(q(d2.range(-0.5, 0.5), 0.55, d2.range(-0.5, 0.5))).normalize(), _2 = d2.range(l2[0], l2[1]), v2 = _2 * d2.range(0.32, 0.45), y2 = _2 * 0.12, b2 = new Qi();
    b2.setAttribute(`position`, new Bi([0, -_2 * 0.12, 0, -v2 * 0.78, _2 * 0.22, y2 * 0.7, -v2, _2 * 0.52, y2, 0, _2, 0, v2, _2 * 0.52, y2, v2 * 0.78, _2 * 0.22, y2 * 0.7], 3)), b2.setIndex([0, 5, 1, 1, 5, 4, 1, 4, 2, 2, 4, 3]), b2.computeVertexNormals();
    let x2 = new ir().setFromUnitVectors(f2, g2);
    x2.multiply(new ir().setFromAxisAngle(f2, d2.range(0, Math.PI * 2))), e4.add(wk(b2, 2e-3), { layer: J.FLAT, color: s2[Math.floor(d2.next() * s2.length)], moss: 0, vary: 0.18, sway: c2 * (0.6 + 0.4 * p2) }, new wr().compose(h2, x2, q(1, 1, 1)));
  }
  if (u2 > 0) {
    let a3 = new P(s2[0]).multiplyScalar(0.55);
    e4.add(Ek(o2, n2 * u2, r2 * u2 * 0.95, i2 * u2, 0.6, 1, 3.2), { layer: J.FLAT, color: `#${a3.getHexString()}`, vary: 0.12, moss: 0, sway: c2 * 0.4 }, K(t2.x, t2.y - r2 * 0.12, t2.z));
  }
}
function Vj(e4, t2, n2, r2) {
  let i2 = 0.05 + r2 % 3 * 0.015, a2 = Ck(1, 4, (e5, t3) => q((e5 - 0.5) * i2 * (1 - t3 * 0.7), -t3 * n2, Math.sin(t3 * 3 + r2) * 0.05 * t3));
  e4.add(a2, { layer: J.FLAT, color: `#6f7560`, moss: 0, ao: false, sway: (e5) => Math.min(1, Math.max(0.3, (t2.y - e5.y) / n2)) * 0.9 }, K(t2.x, t2.y, t2.z, 0, r2));
}
function Hj(e4) {
  let t2 = new VO(100 + e4), n2 = (e5, t3, n3, r2) => {
    r2 >= 2 && (t3.x * 7 + t3.z * 13) % 1 > 0.85 && Vj(e5, t3, 0.5, Math.floor(t3.y * 10));
  };
  if (e4 === 0) zj(t2, { seed: 11, height: 6.6, trunkR: 0.3, lean: [0.35, 0.2], gnarl: 0.18, limbs: 5, limbStart: 0.45, limbAngle: [0.55, 1.05], limbLen: 2.9, rise: 0.45, depth: 3, childCount: [2, 3], barkColor: `#e6e0d6`, roots: 5, flare: 0.9, mossSide: true, onTip: n2, dead: true });
  else if (e4 === 1) {
    zj(t2, { seed: 23, height: 5.2, trunkR: 0.34, lean: [0.9, -0.3], gnarl: 0.12, limbs: 3, limbStart: 0.35, limbAngle: [0.2, 0.7], limbLen: 1.9, rise: 0.25, depth: 2, childCount: [1, 2], barkColor: `#d6cfc4`, snap: 0.72, roots: 4, flare: 1, mossSide: true, dead: true });
    let e5 = q(0.9 * 0.52, 5.2 * 0.72 - 0.05, -0.3 * 0.52), n3 = new Id(5);
    for (let r2 = 0; r2 < 7; r2 += 1) {
      let i2 = r2 / 7 * Math.PI * 2 + n3.range(-0.2, 0.2), a2 = 0.2, o2 = n3.range(0.25, 0.75);
      t2.add(pk([q(Math.cos(i2 - 0.3) * a2, 0, Math.sin(i2 - 0.3) * a2), q(Math.cos(i2 + 0.3) * a2, 0, Math.sin(i2 + 0.3) * a2), q(Math.cos(i2) * a2 * 0.55, 0, Math.sin(i2) * a2 * 0.55), q(Math.cos(i2) * a2 * 0.85, o2, Math.sin(i2) * a2 * 0.85)]), { layer: J.wood, color: r2 % 2 ? `#d8c4a4` : `#a99a85`, moss: 0 }, K(e5.x, e5.y, e5.z));
    }
    t2.add(_k(0.17, 0.2, -0.02, 0.06, 8), { layer: J.FLAT, color: `#1a120c`, moss: 0 }, K(e5.x, e5.y, e5.z));
  } else if (e4 === 2) {
    let e5 = null;
    zj(t2, { seed: 37, height: 5.4, trunkR: 0.38, lean: [-0.2, 0.25], gnarl: 0.2, limbs: 4, limbStart: 0.5, limbAngle: [0.05, 0.35], limbLen: 3.4, rise: 0.12, depth: 3, childCount: [2, 3], barkColor: `#d2cabe`, roots: 6, flare: 1.1, mossSide: true, dead: true, onTip: (t3, r3, i3, a3) => {
      a3 === 1 && !e5 && r3.y > 3.5 && (e5 = r3.clone().addScaledVector(i3, -0.8)), n2(t3, r3, i3, a3);
    } });
    let r2 = (e5 ?? q(1.8, 4.4, 0.2)).clone(), i2 = r2.clone().add(q(0.05, -1.6, 0.02));
    X(t2, [r2, r2.clone().lerp(i2, 0.5).add(q(0.03, 0, 0)), i2], 0.018, 4, { layer: J.thatch, color: HA.rope, sway: 0.6, moss: 0 });
    let a2 = [];
    for (let e6 = 0; e6 <= 10; e6 += 1) {
      let t3 = e6 / 10 * Math.PI * 2;
      a2.push(i2.clone().add(q(Math.sin(t3) * 0.13, -0.15 - Math.cos(t3) * 0.15, 0)));
    }
    X(t2, a2, 0.018, 4, { layer: J.thatch, color: HA.rope, sway: 0.8, moss: 0 }), t2.add(vk(0.04, 5, 4), { layer: J.thatch, color: HA.rope, sway: 0.6 }, K(i2.x, i2.y + 0.02, i2.z, 0, 0, 0, 1, 1.6, 1));
  } else zj(t2, { seed: 53, height: 7.4, trunkR: 0.26, lean: [0.25, 0.5], gnarl: 0.32, limbs: 4, limbStart: 0.55, limbAngle: [0.7, 1.2], limbLen: 2.3, rise: 0.6, depth: 3, childCount: [1, 3], barkColor: `#5a514a`, roots: 4, flare: 0.8, dead: true }), zj(t2, { seed: 61, height: 5.6, trunkR: 0.22, lean: [-0.8, -0.35], gnarl: 0.3, limbs: 3, limbStart: 0.5, limbAngle: [0.6, 1.1], limbLen: 2, rise: 0.55, depth: 2, childCount: [2, 3], barkColor: `#cfc8bc`, roots: 3, flare: 0.5, mossSide: true, onTip: n2, dead: true });
  return t2.build({ ao: 0.75, aoRadius: 0.9 });
}
function Uj(e4) {
  let t2 = new VO(200 + e4), n2 = [[`#5f6a35`, `#76733a`, `#8a6d38`, `#4d5a2c`, `#6b5530`], [`#2f3d26`, `#3b4a2c`, `#46532f`, `#2a3322`], [`#7a5a2c`, `#8a6a34`, `#6b7038`, `#5a4426`, `#9a7a3c`], [`#55602f`, `#6d6834`, `#7d6233`, `#4a5530`]][e4], r2 = 0, i2 = (t3, i3, a2, o2, s2) => {
    if (r2 += 1, !(e4 === 2 && i3.x < 0)) {
      if (o2 >= 2 || e4 === 1 && o2 >= 1) {
        let o3 = (e4 === 1 ? 0.95 : 0.7 + s2 * 2) * (0.85 + r2 % 3 * 0.12);
        Bj(t3, i3.clone().addScaledVector(a2, 0.12), o3, o3 * 0.62, o3, e4 === 1 ? 54 : 50, Math.floor(i3.x * 13 + i3.z * 7 + r2), n2, 0.55, [0.13, 0.23], 0.5);
      }
      o2 === 2 && r2 % 3 == 0 && Vj(t3, i3.clone().add(q(0, -0.2, 0)), 0.7 + r2 % 4 * 0.15, r2);
    }
  };
  return e4 === 0 ? zj(t2, { seed: 71, height: 5, trunkR: 0.5, lean: [0.2, -0.15], gnarl: 0.22, limbs: 4, limbStart: 0.42, limbAngle: [0.35, 0.8], limbLen: 2.7, rise: 0.35, depth: 2, childCount: [1, 2], barkColor: HA.bark, roots: 6, flare: 1.2, mossSide: true, onTip: i2 }) : e4 === 1 ? (zj(t2, { seed: 83, height: 4.6, trunkR: 0.42, lean: [0, 0.1], gnarl: 0.15, limbs: 6, limbStart: 0.3, limbAngle: [0.5, 0.95], limbLen: 1.6, rise: 0.5, depth: 1, childCount: [0, 0], barkColor: `#b29f8a`, roots: 5, flare: 1.1, mossSide: true, onTip: i2 }), Bj(t2, q(0.05, 4.7, 0.1), 1.1, 0.8, 1.1, 34, 7, n2), Bj(t2, q(-0.2, 3.8, -0.15), 1.35, 0.75, 1.3, 38, 9, n2)) : e4 === 2 ? zj(t2, { seed: 97, height: 5.4, trunkR: 0.46, lean: [0.4, 0.3], gnarl: 0.28, limbs: 5, limbStart: 0.4, limbAngle: [0.25, 0.85], limbLen: 2.8, rise: 0.3, depth: 2, childCount: [1, 2], barkColor: `#b8ac9a`, roots: 6, flare: 1.3, mossSide: true, onTip: i2 }) : (zj(t2, { seed: 109, height: 4.2, trunkR: 0.62, lean: [-0.3, 0.2], gnarl: 0.3, limbs: 3, limbStart: 0.55, limbAngle: [0.3, 0.75], limbLen: 2.3, rise: 0.4, depth: 2, childCount: [1, 2], barkColor: `#9b8e7c`, roots: 7, flare: 1.4, mossSide: true, onTip: i2 }), t2.add(Ek(5, 0.26, 0.5, 0.12, 0.3, 1), { layer: J.FLAT, color: `#0c0907`, moss: 0, ao: false }, K(0.02, 0.75, 0.55)), t2.add(Ek(6, 0.3, 0.55, 0.1, 0.25, 1), { layer: J.bark, color: `#6e6050` }, K(0.02, 0.75, 0.6, 0, 0, 0, 1.15, 1.1, 0.4))), t2.build({ ao: 0.8, aoRadius: 1 });
}
function Wj(e4) {
  let t2 = new VO(300 + e4), n2 = new Id(300 + e4);
  if (e4 === 0) {
    let e5 = [`#6b7438`, `#7d8240`, `#5a6532`, `#8a7a3a`, `#4f5a2c`, `#9a8a48`];
    Bj(t2, q(0, 0.38, 0), 0.62, 0.4, 0.58, 38, 301, e5, 0.45, [0.11, 0.18], 0.5), Bj(t2, q(0.45, 0.28, 0.3), 0.42, 0.3, 0.42, 20, 302, e5, 0.45, [0.1, 0.16], 0.45), Bj(t2, q(-0.4, 0.26, -0.25), 0.4, 0.28, 0.4, 18, 303, e5, 0.45, [0.1, 0.16], 0.45);
    for (let e6 = 0; e6 < 5; e6 += 1) {
      let r2 = e6 / 5 * Math.PI * 2 + n2.range(-0.3, 0.3), i2 = n2.range(0.7, 1), a2 = [];
      for (let e7 = 0; e7 <= 3; e7 += 1) {
        let t3 = e7 / 3;
        a2.push(q(Math.cos(r2) * i2 * t3 * 0.8, Math.sin(t3 * 2.3) * 0.55 * i2 + 0.05, Math.sin(r2) * i2 * t3 * 0.8));
      }
      X(t2, a2, (e7) => 0.022 * (1 - e7 * 0.7), 3, { layer: J.bark, color: `#8a7058`, sway: (e7) => Math.min(1, e7.y * 1.5) * 0.45 }, { pointEnd: 0.04 });
    }
    for (let e6 = 0; e6 < 9; e6 += 1) {
      let r2 = e6 * 2.39, i2 = n2.range(0.15, 0.55);
      t2.add(vk(0.03, 4, 3), { layer: J.FLAT, color: `#c9a83a`, moss: 0, sway: 0.4, ao: false }, K(Math.cos(r2) * i2, 0.62 - i2 * 0.35 + n2.range(0, 0.08), Math.sin(r2) * i2));
    }
  } else if (e4 === 1) {
    for (let e5 = 0; e5 < 34; e5 += 1) {
      let r2 = e5 * 2.39996, i2 = Math.sqrt((e5 + 0.5) / 34) * 0.62, a2 = (0.5 - i2 * 0.45) * n2.range(0.75, 1.15), o2 = Math.cos(r2) * i2, s2 = Math.sin(r2) * i2, c2 = n2.next() < 0.55 ? n2.next() < 0.5 ? `#7a5866` : `#8a6476` : n2.next() < 0.6 ? `#5f6a3a` : `#7a7046`;
      for (let e6 = 0; e6 < 2; e6 += 1) {
        let r3 = n2.range(0, Math.PI) + e6 * Math.PI / 2, i3 = Ck(1, 2, (e7, t3) => q((e7 - 0.5) * 0.13 * (1 - t3 * 0.6), t3 * a2, Math.sin(t3 * 2) * 0.03));
        t2.add(i3, { layer: J.FLAT, color: c2, moss: 0, vary: 0.15, sway: (e7) => Math.min(1, e7.y / 0.5) * 0.4 }, K(o2, -0.02, s2, o2 * 0.5, r3, s2 * 0.5));
      }
    }
    t2.add(Ek(311, 0.55, 0.22, 0.55, 0.35, 1), { layer: J.FLAT, color: `#2a2418`, moss: 0 }, K(0, 0.05, 0));
  } else {
    for (let e5 = 0; e5 < 7; e5 += 1) {
      let r2 = e5 / 7 * Math.PI * 2 + n2.range(-0.3, 0.3), i2 = n2.range(0.6, 1.1), a2 = [];
      for (let t3 = 0; t3 <= 4; t3 += 1) {
        let n3 = t3 / 4;
        a2.push(q(Math.cos(r2) * i2 * n3 * 0.55 + KO(e5, n3 * 3, 0) * 0.06, n3 * i2, Math.sin(r2) * i2 * n3 * 0.55 + KO(e5, n3 * 3, 4) * 0.06));
      }
      X(t2, a2, (e6) => 0.03 * (1 - e6 * 0.75), 3, { layer: J.deadwood, color: `#d0c8ba`, sway: (e6) => Math.min(1, e6.y) * 0.35 }, { pointEnd: 0.05 });
      let o2 = a2[2], s2 = q(Math.cos(r2 + 0.8) * 0.4, 0.5, Math.sin(r2 + 0.8) * 0.4);
      X(t2, [o2, o2.clone().add(s2.multiplyScalar(0.6))], [0.018, 6e-3], 3, { layer: J.deadwood, color: `#d0c8ba`, sway: 0.35 });
    }
    t2.add(Ek(9, 0.3, 0.12, 0.3, 0.3, 1), { layer: J.dirt, color: `#8d8270` }, K(0, 0.02, 0));
  }
  return t2.build({ ao: 0.7, aoRadius: 0.5 });
}
function Gj(e4) {
  let t2 = new VO(400 + e4), n2 = [`#cfc8bc`, `#c4c2bc`, `#d2cabd`, `#bdb8ad`][e4];
  return e4 === 0 ? (t2.add(Tk(41, 0.68, 0.55, 0.6, { cuts: 4, rough: 0.3 }), { layer: J.rock, color: n2 }), VA(t2, K(), 0.75, 3, 4)) : e4 === 1 ? (t2.add(Tk(42, 0.85, 0.32, 0.5, { cuts: 6, rough: 0.2, crease: 30 }), { layer: J.rock, color: n2 }, K(0, 0.05, 0, 0.25, 0.3, 0.12)), VA(t2, K(), 0.8, 4, 5)) : e4 === 2 ? (t2.add(Tk(43, 0.5, 0.46, 0.45, { cuts: 4 }), { layer: J.rock, color: n2 }, K(-0.15, 0, 0)), t2.add(Tk(44, 0.32, 0.28, 0.3, { cuts: 3, detail: 1 }), { layer: J.rock, color: n2 }, K(0.42, 0, 0.2, 0, 1.2)), t2.add(Tk(45, 0.22, 0.18, 0.2, { cuts: 3, detail: 1 }), { layer: J.rock, color: n2 }, K(0.1, 0, -0.42, 0, 2.2))) : (t2.add(Tk(46, 0.42, 0.95, 0.4, { cuts: 5, rough: 0.25, crease: 32 }), { layer: J.rock, color: n2 }, K(0, 0, 0, 0.1, 0, -0.12)), VA(t2, K(), 0.6, 4, 6)), t2.build({ ao: 0.7, aoRadius: 0.45 });
}
function Kj(e4) {
  let t2 = new VO(500 + e4);
  if (e4 === 0) t2.add(Tk(51, 1.45, 1.15, 1.25, { cuts: 6, rough: 0.28 }), { layer: J.rock, color: `#cdc6ba` }), t2.add(Tk(52, 0.42, 0.35, 0.38, { cuts: 4, detail: 1 }), { layer: J.rock, color: `#c8c2b6` }, K(1.25, 0, 0.6, 0, 0.7)), VA(t2, K(), 1.6, 5, 7, J.rock, `#bdb6aa`, 0.1);
  else if (e4 === 1) {
    for (let e5 of [-1, 1]) {
      let n2 = Tk(53 + +(e5 > 0), 0.78, 1.25, 1.2, { cuts: 5, rough: 0.25 }), r2 = n2.getAttribute(`position`);
      for (let t3 = 0; t3 < r2.count; t3 += 1) {
        let n3 = r2.getX(t3) * e5;
        n3 < 0.08 && r2.setX(t3, e5 * (0.08 + (n3 - 0.08) * 0.08));
      }
      n2.computeVertexNormals(), t2.add(n2, { layer: J.rock, color: `#cac3b7` }, K(e5 * 0.12, 0, 0, 0, 0, -e5 * 0.06));
    }
    t2.add(Tk(55, 0.35, 0.3, 0.3, { cuts: 3, detail: 1 }), { layer: J.rock, color: `#c8c2b6` }, K(0.05, 0, 1.05)), VA(t2, K(), 1.5, 5, 8, J.rock, `#bdb6aa`, 0.1);
  } else t2.add(Tk(56, 0.95, 0.75, 0.9, { cuts: 5 }), { layer: J.rock, color: `#c6c0b5` }, K(0.45, 0, 0.2)), t2.add(Tk(57, 0.55, 1.6, 1.05, { cuts: 6, crease: 30, rough: 0.2 }), { layer: J.rock, color: `#d0c9bd` }, K(-0.45, -0.05, -0.1, 0, 0.3, -0.32)), VA(t2, K(), 1.5, 6, 9, J.rock, `#bdb6aa`, 0.11);
  return t2.build({ ao: 0.8, aoRadius: 0.9 });
}
function qj(e4) {
  let t2 = new VO(600 + e4), n2 = new Id(600 + e4), r2 = [24, 18, 28][e4];
  for (let i3 = 0; i3 < r2; i3 += 1) {
    let r3 = n2.range(0, Math.PI * 2), i4 = Math.sqrt(n2.next()) * 0.45, a2 = n2.range(0.7, 1.45) * (e4 === 1 ? 0.8 : 1), o2 = n2.range(0.05, 0.35), s2 = r3 + n2.range(-0.6, 0.6), c2 = n2.range(0.025, 0.04), l2 = Ck(1, 4, (e5, t3) => {
      let n3 = (e5 - 0.5) * c2 * (1 - t3 * 0.85), r4 = t3 * a2, i5 = o2 * t3 * t3;
      return q(n3 + Math.cos(s2) * i5, r4, Math.sin(s2) * i5);
    }), u2 = n2.next() < 0.3 ? `#a19160` : n2.next() < 0.5 ? `#7c8150` : `#8f8a58`;
    t2.add(l2, { layer: J.FLAT, color: u2, moss: 0, ao: false, sway: (e5) => Math.min(1, e5.y / a2) * 0.9 }, K(Math.cos(r3) * i4, -0.05, Math.sin(r3) * i4, 0, n2.range(0, Math.PI)));
  }
  let i2 = [5, 2, 6][e4];
  for (let e5 = 0; e5 < i2; e5 += 1) {
    let e6 = n2.range(0, Math.PI * 2), r3 = n2.range(0.05, 0.35), i3 = n2.range(1.1, 1.6), a2 = Math.cos(e6) * r3, o2 = Math.sin(e6) * r3;
    X(t2, [q(a2, -0.05, o2), q(a2 + 0.04, i3 * 0.5, o2), q(a2 + 0.1, i3, o2 + 0.03)], 0.012, 3, { layer: J.FLAT, color: `#6f7448`, sway: (e7) => Math.min(1, e7.y / i3) * 0.7 }), t2.add(_k(0.03, 0.03, i3 - 0.02, i3 + 0.2, 6), { layer: J.hide, color: `#6a4a33`, sway: 0.75 }, K(a2 + 0.1, 0, o2 + 0.03, 0, 0, -0.06));
  }
  return t2.build({ ao: 0.4, aoRadius: 0.4 });
}
function Jj(e4) {
  let t2 = new VO(700 + e4), n2 = 0.38, r2 = e4 === 0 ? 0.55 : 0.8, i2 = [];
  for (let e5 = 0; e5 <= 4; e5 += 1) i2.push(q(0, -0.2 + (r2 + 0.2) * (e5 / 4), 0));
  if (X(t2, i2, (e5) => n2 * (1 + 0.5 * Math.max(0, 1 - e5 * 2.2) ** 2), 11, { layer: J.bark, color: HA.bark, moss: 0.8 }, { bumps: 0.08, bumpFreq: 3, seed: 7, capEnd: e4 === 0 }), e4 === 0) t2.add(_k(n2 * 0.93, n2 * 0.93, r2 - 0.01, r2 + 0.015, 12), { layer: J.wood, color: `#cfb48c`, moss: 0.3, texScale: 2.5 }, K(0, 0, 0, 0.04, 0, 0.03)), t2.add(Sk([[1e-3, 0], [0.04, 0], [0.08, 2e-3], [0.16, 2e-3], [0.2, 0], [0.26, 2e-3]], 12).translate(0, r2 + 0.016, 0), { layer: J.FLAT, color: `#6d5236`, moss: 0 }, K(0, 0, 0, 0.04, 0, 0.03));
  else {
    let e5 = new Id(9);
    for (let i3 = 0; i3 < 8; i3 += 1) {
      let a2 = i3 / 8 * Math.PI * 2, o2 = e5.range(0.1, 0.45);
      t2.add(pk([q(Math.cos(a2 - 0.35) * n2 * 0.95, 0, Math.sin(a2 - 0.35) * n2 * 0.95), q(Math.cos(a2 + 0.35) * n2 * 0.95, 0, Math.sin(a2 + 0.35) * n2 * 0.95), q(Math.cos(a2) * n2 * 0.5, 0, Math.sin(a2) * n2 * 0.5), q(Math.cos(a2) * n2 * 0.75, o2, Math.sin(a2) * n2 * 0.75)]), { layer: J.wood, color: i3 % 2 ? `#cdb592` : `#9b8a72`, moss: 0.2 }, K(0, r2 - 0.02, 0));
    }
    t2.add(_k(n2 * 0.8, n2 * 0.8, r2 - 0.06, r2 + 0, 10), { layer: J.FLAT, color: `#2a1f16`, moss: 0 });
  }
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let r3 = e5 / 5 * Math.PI * 2 + 0.4, i3 = 0.7 + e5 % 2 * 0.25;
    X(t2, [q(Math.cos(r3) * n2 * 0.6, 0.18, Math.sin(r3) * n2 * 0.6), q(Math.cos(r3) * i3 * 0.7, 0.05, Math.sin(r3) * i3 * 0.7), q(Math.cos(r3) * i3, -0.1, Math.sin(r3) * i3)], (e6) => 0.13 * (1 - e6 * 0.75), 5, { layer: J.bark, color: HA.bark, moss: 0.8 }, { pointEnd: 0.05 });
  }
  for (let e5 = 0; e5 < 3; e5 += 1) {
    let r3 = 1.9 + e5 * 0.5, i3 = 0.15 + e5 * 0.12;
    t2.add(Sk([[1e-3, 0.02], [0.08, 0.015], [0.1, 0], [0.07, -0.015], [1e-3, -0.01]], 8), { layer: J.FLAT, color: `#b49a72`, moss: 0 }, K(Math.cos(r3) * n2 * 1.02, i3, Math.sin(r3) * n2 * 1.02, 0, -r3, 0, 1, 1, 0.6));
  }
  return t2.build({ ao: 0.75, aoRadius: 0.5 });
}
function Yj(e4) {
  let t2 = new VO(800 + e4), n2 = new Id(800 + e4), r2 = e4 === 0 ? 5 : 7;
  for (let i2 = 0; i2 < r2; i2 += 1) {
    let r3 = i2 * 2.39, a2 = i2 === 0 ? 0 : n2.range(0.12, 0.38), o2 = (i2 === 0 ? 0.42 : n2.range(0.12, 0.3)) * (e4 === 1 ? 0.8 : 1), s2 = o2 * (e4 === 0 ? 0.55 : 0.4), c2 = Math.cos(r3) * a2, l2 = Math.sin(r3) * a2, u2 = n2.range(-0.25, 0.25);
    t2.group(K(c2, 0, l2, u2, r3, u2 * 0.5), () => {
      t2.add(Sk([[0.03 * o2 * 4, -0.02], [0.018 * o2 * 4, o2]], 5), { layer: J.FLAT, color: `#d8ccb4`, moss: 0 });
      let n3 = Sk([[1e-3, o2 + s2 * 0.55], [s2 * 0.7, o2 + s2 * 0.4], [s2, o2 + 0.02], [0.02, o2 - 0.01]], 8);
      if (e4 === 0 ? t2.add(n3, { layer: J.hide, color: i2 % 2 ? `#a0452a` : `#8a5a34`, moss: 0 }) : t2.add(n3, { layer: J.FLAT, color: i2 % 2 ? `#7ff0d0` : `#a8ffc8`, emissive: 1.4 + i2 % 3 * 0.4, moss: 0, ao: false }), e4 === 0) for (let e5 = 0; e5 < 3; e5 += 1) {
        let n4 = e5 * 2.1 + i2;
        t2.add(vk(s2 * 0.13, 4, 2), { layer: J.FLAT, color: `#efe6d0`, moss: 0, ao: false }, K(Math.cos(n4) * s2 * 0.45, o2 + s2 * 0.45, Math.sin(n4) * s2 * 0.45));
      }
    });
  }
  return t2.add(Ek(3, 0.45, 0.06, 0.45, 0.3, 1), { layer: J.moss, color: `#7a8452`, moss: 0 }, K(0, 0, 0)), t2.build({ ao: 0.6, aoRadius: 0.3 });
}
function Xj(e4) {
  let t2 = new VO(900 + e4), n2 = (e5, n3, r2, i2, a2) => {
    let o2 = [];
    for (let e6 = 0; e6 <= 9; e6 += 1) {
      let t3 = e6 / 9, n4 = i2 * (1 - t3) ** 0.85 * (1 + Math.sin(t3 * 19 + a2) * 0.06) + 0.012;
      o2.push([n4, -0.2 + (r2 + 0.2) * t3]);
    }
    let s2 = Sk(o2, 9), c2 = s2.getAttribute(`position`);
    for (let e6 = 0; e6 < c2.count; e6 += 1) {
      let t3 = c2.getX(e6), n4 = c2.getY(e6), i3 = c2.getZ(e6), o3 = 1 + KO(t3 * 4 + a2, n4 * 2.2, i3 * 4) * 0.22;
      c2.setXYZ(e6, t3 * o3 + Math.sin(n4 * 0.9 + a2) * 0.06 * (n4 / r2), n4, i3 * o3);
    }
    s2.computeVertexNormals(), t2.add(s2, { layer: J.caveRock, color: `#d9cfbd`, moss: 0.35, paint: (e6, t3, n4) => {
      let r3 = 0.5 + 0.5 * Math.sin(e6.y * 9 + KO(e6.x * 3, e6.y, e6.z * 3, a2) * 2);
      n4.multiplyScalar(0.82 + r3 * 0.3);
    } }, K(e5, 0, n3));
  };
  return e4 === 0 ? (n2(0, 0, 2.1, 0.42, 1), n2(0.45, 0.2, 0.9, 0.22, 2), n2(-0.3, 0.35, 0.55, 0.16, 3)) : e4 === 1 ? (n2(0, 0, 1.3, 0.5, 4), n2(-0.5, -0.1, 1.6, 0.3, 5), n2(0.3, -0.45, 0.6, 0.18, 6), n2(0.2, 0.5, 0.4, 0.14, 7)) : (n2(0, 0, 2.6, 0.36, 8), n2(0.38, -0.3, 1.2, 0.2, 9)), t2.add(Tk(91 + e4, 0.7, 0.25, 0.65, { detail: 1, cuts: 3 }), { layer: J.caveRock, color: `#b8ae9c` }), t2.add(_k(0.55, 0.6, -0.02, 0.012, 12), { layer: J.GLOSS, color: `#14100c`, moss: 0 }, K(0.55, 0, 0.35, 0, 0, 0, 1, 1, 0.7)), t2.build({ ao: 0.75, aoRadius: 0.6 });
}
function Zj(e4) {
  let t2 = new VO(1e3 + e4), n2 = new Id(1e3 + e4), [r2, i2] = $j[e4], a2 = 6 + e4;
  for (let e5 = 0; e5 < a2; e5 += 1) {
    let a3 = e5 * 2.39 + n2.range(-0.3, 0.3), o2 = e5 === 0 ? 0 : n2.range(0.1, 0.42), s2 = e5 === 0 ? 0.62 : n2.range(0.2, 0.5), c2 = s2 * n2.range(0.32, 0.48), l2 = Math.cos(a3) * o2, u2 = Math.sin(a3) * o2, d2 = o2 * 0.9;
    t2.group(K(l2, 0, u2, 0, -a3 + Math.PI / 2, -d2), () => {
      X(t2, [q(0, -0.03, 0), q(0.02, s2 * 0.5, 0), q(0, s2, 0)], (e6) => 0.035 * (1 - e6 * 0.3) * (s2 * 2.2), 4, { layer: J.FLAT, color: `#cfe9df`, moss: 0, emissive: 0.25 });
      let n3 = Sk([[1e-3, s2 + c2 * 0.75], [c2 * 0.6, s2 + c2 * 0.62], [c2, s2 + c2 * 0.05], [c2 * 0.95, s2 - c2 * 0.05]], 8);
      t2.add(n3, { layer: J.FLAT, color: e5 % 2 ? r2 : i2, emissive: 2.2 + e5 % 3 * 0.5, moss: 0, ao: false, occlude: false });
      let a4 = Sk([[c2 * 0.95, s2 - c2 * 0.04], [0.03, s2 + c2 * 0.1]], 8);
      t2.add(a4, { layer: J.FLAT, color: `#1f4a40`, emissive: 0.6, moss: 0, ao: false });
    });
  }
  for (let e5 = 0; e5 < 5; e5 += 1) {
    let e6 = n2.range(0, Math.PI * 2), i3 = n2.range(0.1, 0.6);
    t2.add(vk(0.018, 4, 3), { layer: J.FLAT, color: r2, emissive: 3, moss: 0, ao: false, occlude: false }, K(Math.cos(e6) * i3, n2.range(0, 0.06), Math.sin(e6) * i3));
  }
  return t2.add(Tk(1001 + e4, 0.5, 0.18, 0.45, { detail: 1, cuts: 3 }), { layer: J.caveRock, color: `#9a9488` }), t2.build({ ao: 0.5, aoRadius: 0.3 });
}
function Qj(e4) {
  let t2 = new VO(1100 + e4);
  if (e4 === 0) t2.add(Tk(111, 1.05, 1, 0.95, { cuts: 6, rough: 0.32 }), { layer: J.caveRock, color: `#cbbfae` }), t2.add(Tk(112, 0.45, 0.4, 0.42, { cuts: 4, detail: 1 }), { layer: J.caveRock, color: `#c2b8a6` }, K(0.95, 0, 0.3, 0, 0.5));
  else if (e4 === 1) t2.add(Tk(113, 1.25, 0.75, 0.9, { cuts: 7, crease: 30 }), { layer: J.caveRock, color: `#c7bcaa` }, K(0, 0, 0, 0, 0.4, 0.1)), t2.add(Tk(114, 0.6, 0.9, 0.55, { cuts: 5 }), { layer: J.caveRock, color: `#cfc3b0` }, K(-0.75, 0, -0.35));
  else {
    t2.add(Tk(115, 1, 0.8, 1, { cuts: 6 }), { layer: J.caveRock, color: `#c9bdab` });
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let n2 = e5 * 2.1;
      t2.add(yk(0.12 - e5 * 0.02, 0.55 - e5 * 0.12, 6), { layer: J.caveRock, color: `#d8cdb9` }, K(Math.cos(n2) * 0.35, 0.65, Math.sin(n2) * 0.3));
    }
  }
  return VA(t2, K(), 1.2, 5, 11 + e4, J.caveRock, `#b3a998`, 0.09), t2.build({ ao: 0.8, aoRadius: 0.8 });
}
var $j, eM, tM = t((() => {
  Ed(), UO(), kk(), UA(), ZO(), $j = [[`#5fffd2`, `#2fbf9a`], [`#8dff7a`, `#4fc04a`], [`#7ae8ff`, `#b07aff`]], eM = { deadTree: { variants: 4, build: Hj }, gnarledTree: { variants: 4, build: Uj }, bush: { variants: 3, build: Wj }, rock: { variants: 4, build: Gj }, boulder: { variants: 3, build: Kj }, reeds: { variants: 3, build: qj, shadow: false }, stump: { variants: 2, build: Jj }, mushroom: { variants: 2, build: Yj, shadow: false, glow: (e4) => e4 === 1 ? [q(0, 0.3, 0)] : [] }, stalagmite: { variants: 3, build: Xj }, crystalFungus: { variants: 3, build: Zj, shadow: false, glow: () => [q(0, 0.5, 0)] }, caveRock: { variants: 3, build: Qj } };
}));
function nM(e4, t2) {
  return (n2, r2, i2) => {
    let a2 = KO(n2.x * 1.6, n2.y * 1.3, n2.z * 1.6, t2) * 0.5 + 0.5, o2 = Math.min(0.85, e4 * (0.25 + YO(0.4, 2.6, n2.y) * 0.6) * (0.35 + a2 * 0.95));
    i2.lerp(new P(`#2a2622`), o2);
  };
}
function rM(e4, t2) {
  let n2 = new Id(t2.seed), r2 = t2.len / 2, i2 = t2.burnt ? `#cfc4b4` : bM, a2 = t2.burnt ? nM(0.48, t2.seed) : void 0, o2 = -0.15, s2 = Math.ceil((3.4 - o2) / t2.course), c2 = Array(9).fill(o2);
  for (let l2 = 0; l2 < s2; l2 += 1) {
    let s3 = o2 + l2 * t2.course, u2 = -r2 - (l2 % 2 ? n2.range(0.25, 0.45) : n2.range(0, 0.12));
    for (; u2 < r2; ) {
      let o3 = t2.field ? n2.range(0.5, 0.78) : n2.range(0.58, 1), d2 = Math.min(r2 + 0.06, u2 + o3), f2 = (u2 + d2) / 2, p2 = d2 - u2, m2 = t2.top(f2) + (n2.next() - 0.5) * t2.course * 0.6, h2 = t2.hole ? t2.hole(f2, s3 + t2.course * 0.5) : false;
      if (s3 + t2.course * 0.55 < m2 && !h2 && p2 > 0.12) {
        let o4 = s3 + t2.course * 1.55 > m2, d3 = (n2.next() - 0.5) * 0.05, h3 = t2.course * n2.range(0.9, 0.98), g2 = t2.field ? pk(Array.from({ length: 11 }, (e5, r3) => {
          let i3 = r3 / 11 * Math.PI * 2 * 3.7 + n2.range(0, 1), a3 = n2.range(-1, 1), o5 = Math.sqrt(1 - a3 * a3);
          return q(Math.cos(i3) * o5 * t2.thick * 0.5, a3 * h3 * 0.55, Math.sin(i3) * o5 * p2 * 0.55);
        })) : hk(t2.thick + n2.range(-0.04, 0.02), h3, p2 - 0.025, t2.seed * 100 + l2 * 17 + Math.floor(u2 * 10), o4 ? 0.55 : 0.18);
        e4.add(g2, { layer: J.rock, color: i2, vary: 0.1, texScale: 1.3, paint: a2 }, K(d3, s3 + h3 / 2, f2, (n2.next() - 0.5) * 0.03, 0, (n2.next() - 0.5) * 0.03));
        let _2 = Math.max(0, Math.min(8, Math.floor((f2 + r2) / t2.len * 9)));
        c2[_2] = Math.max(c2[_2], s3 + h3 * (o4 ? 0.6 : 1));
      }
      u2 = d2;
    }
  }
  c2 = c2.map((e5, t3) => Math.max(e5, t3 > 0 ? c2[t3 - 1] * 0 : e5));
  for (let n3 = 0; n3 < 9; n3 += 1) {
    let i3 = c2[n3] - o2 - 0.12;
    if (i3 <= 0.05) continue;
    let s3 = -r2 + (n3 + 0.5) * (t2.len / 9);
    e4.add(new ao(t2.thick * 0.8, i3, t2.len / 9 + 0.02).deleteAttribute(`uv`), { layer: J.plaster, color: t2.burnt ? `#3a342e` : `#6a6258`, vary: 0.04, paint: a2 }, K(0, o2 + i3 / 2, s3));
  }
}
function iM(e4, t2, n2, r2, i2, a2) {
  for (let o2 = 0; o2 < n2; o2 += 1) {
    let n3 = (t2.next() < 0.5 ? -1 : 1) * t2.range(0.45, r2), s2 = t2.range(-1.1, 1.1), c2 = t2.range(0.22, 0.42);
    e4.add(hk(c2 * 1.4, c2, c2 * 1.1, a2 + o2 * 7, 0.6), { layer: J.rock, color: i2 ? `#a99f92` : bM, paint: i2 ? nM(0.5, a2 + o2) : void 0 }, K(n3, c2 * 0.35, s2, t2.range(-0.4, 0.4), t2.range(0, 3), t2.range(-0.5, 0.5)));
  }
}
function aM(e4) {
  let t2 = new VO(1200 + e4), n2 = e4 >= 4, r2 = e4 % 4, i2 = new Id(1200 + e4), a2 = 2.34, o2 = n2 ? 0.4 : 0.45, s2 = n2 ? 0.58 : 0.62, c2 = 1200 + e4 * 13, l2 = (e5) => KO(e5 * 1.3, c2 * 0.1, 0.5) * 0.25, u2, d2;
  if (r2 === 0 ? u2 = (e5) => 2.55 - (e5 + 1.2) * 0.42 + l2(e5) + (e5 > 0.5 ? -0.5 : 0) : r2 === 1 ? u2 = (e5) => 1.05 + Math.sin(e5 * 2.1 + 1) * 0.3 + l2(e5) : r2 === 2 ? (u2 = (e5) => 2.75 + l2(e5) - Math.max(0, e5 - 0.7) * 0.9, d2 = (e5, t3) => Math.abs(e5 + 0.05) < 0.3 && t3 > 0.85 && t3 < 2.15 - Math.abs(e5 + 0.05) * 0.8) : u2 = (e5) => 2.2 + (e5 < -0.3 ? 0.55 : 0) + l2(e5) - Math.max(0, e5 - 0.4) * 1.1, rM(t2, { len: a2, thick: s2, course: o2, top: u2, hole: d2, seed: c2, burnt: n2, field: n2 }), t2.add(hk(s2 + 0.16, 0.28, a2 + 0.02, c2 + 1, 0.3), { layer: J.rock, color: n2 ? `#9d958a` : `#cfc7b9`, paint: n2 ? nM(0.4, c2) : void 0 }, K(0, -0.06, 0)), r2 === 2) {
    for (let e5 of [-1, 1]) t2.add(hk(s2 + 0.04, 0.2, 0.46, c2 + 30 + e5, 0.2), { layer: J.rock, color: bM, paint: n2 ? nM(0.7, c2) : void 0 }, K(0, 2.08, -0.05 + e5 * 0.17, e5 * 0.55, 0, 0));
    t2.add(hk(s2 + 0.06, 0.22, 0.86, c2 + 33, 0.2), { layer: J.rock, color: bM, paint: n2 ? nM(0.7, c2) : void 0 }, K(0, 0.78, -0.05));
  }
  if (r2 === 3) for (let e5 = 0; e5 < 4; e5 += 1) {
    let r3 = 0.62 - e5 * 0.12;
    t2.add(hk(r3, 0.5, 0.62, c2 + 40 + e5, 0.25), { layer: J.rock, color: bM, paint: n2 ? nM(0.7, c2 + e5) : void 0 }, K(-s2 / 2 - r3 / 2 + 0.05, 0.1 + e5 * 0.5, -0.75));
  }
  return n2 && (EA(t2, q(0, 1.25 + r2 * 0.1, -1.25), q(0, 1.4 + r2 * 0.1, 0.4 - r2 * 0.2), 0.22, 0.2, { layer: J.deadwood, color: `#2c2622`, gain: 1, moss: 0 }), EA(t2, q(-0.4, 0.08, 0.3), q(-1.5, 0.12, 1.1), 0.18, 0.16, { layer: J.deadwood, color: `#262120`, gain: 1, moss: 0 }, 0.4), t2.add(Ek(c2, 0.55, 0.035, 0.42, 0.7, 1, 3.4), { layer: J.dirt, color: `#5a524a`, gain: 0.55, texScale: 3.2, moss: 0 }, K(0.75, -0.015, 0.35)), VA(t2, K(0.75, 0, 0.35), 0.45, 5, c2 + 3, J.FLAT, `#1a1715`, 0.06)), iM(t2, i2, r2 === 1 ? 4 : 2, r2 === 1 ? 1.4 : 1.1, n2, c2 + 50), VA(t2, K(), 1.3, 4, c2, J.rock, n2 ? `#8a8279` : `#c2bab0`, 0.08), t2.build({ ao: 0.85, aoRadius: 0.7 });
}
function oM(e4, t2, n2, r2, i2, a2, o2 = 0.012) {
  let s2 = [], c2 = r2 + o2 / t2, l2 = i2 - o2 / t2;
  for (let r3 of [c2, l2]) for (let i3 of [t2, t2 + n2]) for (let t3 of [-a2 / 2, a2 / 2]) s2.push(q(e4.x + Math.cos(r3) * i3, e4.y + Math.sin(r3) * i3, t3));
  return pk(s2);
}
function sM() {
  let e4 = new VO(1300), t2 = 1.25, n2 = 2.5, r2 = 0.46, i2 = 0.68;
  for (let r3 of [-1, 1]) {
    let a3 = -0.15, o3 = 0;
    for (; a3 < n2 - 0.05; ) {
      let s2 = Math.min(0.5, n2 - a3);
      e4.add(hk(0.72, s2 - 0.02, i2 + 0.06, 1300 + o3 + (r3 > 0 ? 20 : 0), 0.15), { layer: J.rock, color: bM, vary: 0.08 }, K(r3 * (t2 + 0.36), a3 + s2 / 2, 0, 0, o3 % 2 * 0.02)), a3 += s2, o3 += 1;
    }
    e4.add(Y(0.92, 0.18, i2 + 0.2, 0.05), { layer: J.rock, color: `#cbc3b5` }, K(r3 * (t2 + 0.36), n2 + 0.06, 0)), e4.add(Y(0.95, 0.3, i2 + 0.24, 0.06), { layer: J.rock, color: `#c7bfb1` }, K(r3 * (t2 + 0.36), 0, 0));
  }
  let a2 = 2 * t2;
  for (let o3 of [-1, 1]) {
    let s2 = { x: -o3 * t2, y: n2 + 0.15 }, c2 = o3 < 0 ? Math.PI : 0, l2 = o3 < 0 ? 2 * Math.PI / 3 + 0.03 : Math.PI / 3 - 0.03;
    for (let n3 = 0; n3 < 5; n3 += 1) {
      let u2 = c2 + (l2 - c2) * n3 / 5, d2 = c2 + (l2 - c2) * (n3 + 1) / 5;
      if (o3 > 0 && n3 === 4) continue;
      let f2 = oM(s2, a2 - t2, r2, Math.min(u2, d2), Math.max(u2, d2), i2);
      e4.add(f2, { layer: J.rock, color: bM, vary: 0.1 });
    }
  }
  let o2 = n2 + 0.15 + Math.sqrt(3) * t2;
  e4.add(pk([q(-0.16, o2 - 0.06, -i2 / 2 - 0.03), q(0.16, o2 - 0.06, -i2 / 2 - 0.03), q(-0.16, o2 - 0.06, i2 / 2 + 0.03), q(0.16, o2 - 0.06, i2 / 2 + 0.03), q(-0.24, o2 + 0.5, -i2 / 2 - 0.03), q(0.24, o2 + 0.5, -i2 / 2 - 0.03), q(-0.24, o2 + 0.5, i2 / 2 + 0.03), q(0.24, o2 + 0.5, i2 / 2 + 0.03)]), { layer: J.rock, color: `#d6cdbd` });
  for (let r3 of [-1, 1]) for (let a3 = 0; a3 < 3; a3 += 1) {
    let o3 = n2 + 0.4 + a3 * 0.42, s2 = r3 * (t2 + 0.55 - a3 * 0.18);
    r3 > 0 && a3 === 2 || e4.add(hk(0.62, 0.4, i2 - 0.04, 1350 + a3 + (r3 > 0 ? 9 : 0), 0.4), { layer: J.rock, color: bM }, K(s2, o3, 0));
  }
  for (let n3 of [-1, 1]) for (let r3 = 0; r3 < 3; r3 += 1) {
    let a3 = 0.42, o3 = n3 > 0 ? 0.8 - r3 * 0.18 : 1.1 - r3 * 0.3;
    o3 < 0.2 || e4.add(hk(o3, a3 - 0.02, i2 - 0.08, 1370 + r3 * 3 + +(n3 > 0), 0.35), { layer: J.rock, color: bM }, K(n3 * (t2 + 0.72 + o3 / 2), -0.15 + a3 * (r3 + 0.5), 0));
  }
  for (let r3 = 0; r3 < 7; r3 += 1) {
    let o3 = -t2 + 0.2 + r3 * 0.18, s2 = n2 + 0.15 + Math.sqrt(Math.max(0, a2 * a2 - (o3 + t2) ** 2)) * 0.98 - 0.2, c2 = 0.6 + r3 * 37 % 5 * 0.18, l2 = Ck(1, 4, (e5, t3) => q((e5 - 0.5) * 0.09, -t3 * c2, Math.sin(t3 * 4 + r3) * 0.03));
    e4.add(l2, { layer: J.FLAT, color: r3 % 2 ? `#3e4a2a` : `#4d5632`, moss: 0, ao: false, sway: (e5) => Math.min(1, (s2 - e5.y) / c2) * 0.6 }, K(o3, s2, i2 / 2 + 0.03));
  }
  return e4.add(oM({ x: 0, y: 0 }, 0.55, r2, 0.2, 0.62, i2), { layer: J.rock, color: bM }, K(1.6, 0.12, 1, 1.2, 0.4, 0.3)), VA(e4, K(), 2.2, 8, 1301, J.rock, `#c2bab0`, 0.1), e4.build({ ao: 0.85, aoRadius: 0.8 });
}
function cM(e4, t2, n2 = 9) {
  let r2 = [];
  for (let n3 = 0; n3 <= 3; n3 += 1) r2.push([e4 * (1 - n3 / 3 * 0.08), n3 / 3 * t2]);
  let i2 = Sk(r2, n2 * 2), a2 = i2.getAttribute(`position`);
  for (let e5 = 0; e5 < a2.count; e5 += 1) {
    let t3 = a2.getX(e5), r3 = a2.getZ(e5), i3 = 1 - 0.05 * Math.max(0, Math.cos(Math.atan2(r3, t3) * n2));
    a2.setXYZ(e5, t3 * i3, a2.getY(e5), r3 * i3);
  }
  return i2.computeVertexNormals(), i2;
}
function lM(e4, t2, n2, r2, i2 = bM) {
  let a2 = new Id(r2);
  for (let r3 = 0; r3 < 6; r3 += 1) {
    let o2 = r3 / 6 * Math.PI * 2 + a2.range(-0.2, 0.2), s2 = a2.range(0.05, 0.38);
    e4.add(pk([q(Math.cos(o2 - 0.6) * n2, 0, Math.sin(o2 - 0.6) * n2), q(Math.cos(o2 + 0.6) * n2, 0, Math.sin(o2 + 0.6) * n2), q(0, 0, 0), q(Math.cos(o2) * n2 * 0.7, s2, Math.sin(o2) * n2 * 0.7), q(Math.cos(o2 - 0.3) * n2 * 0.9, s2 * 0.6, Math.sin(o2 - 0.3) * n2 * 0.9)]), { layer: J.rock, color: i2 }, K(0, t2 - 0.01, 0));
  }
}
function uM(e4) {
  let t2 = new VO(1400 + e4), n2 = () => {
    t2.add(Y(0.95, 0.32, 0.95, 0.06), { layer: J.rock, color: `#cec6b8` }, K(0, 0, 0)), t2.add(Sk([[0.42, 0.16], [0.44, 0.22], [0.38, 0.3], [0.36, 0.34]], 16), { layer: J.rock, color: bM });
  };
  if (e4 === 0) n2(), t2.add(cM(0.32, 2.15), { layer: J.rock, color: bM, texScale: 1.2 }, K(0, 0.33, 0)), lM(t2, 2.42, 0.3, 1401), t2.add(cM(0.3, 0.55), { layer: J.rock, color: bM }, K(0.75, 0.3, 0.4, Math.PI / 2, 0.6, 0));
  else if (e4 === 1) n2(), t2.add(cM(0.32, 0.75), { layer: J.rock, color: bM }, K(0, 0.33, 0)), lM(t2, 1.07, 0.3, 1402), t2.add(cM(0.31, 0.9), { layer: J.rock, color: bM }, K(0.35, 0.31, 0.6, Math.PI / 2, 0.75, 0)), t2.add(cM(0.3, 0.7), { layer: J.rock, color: bM }, K(-0.55, 0.3, -0.75, Math.PI / 2, 2.2, 0)), t2.add(Y(0.8, 0.28, 0.8, 0.06), { layer: J.rock, color: `#cfc7b9` }, K(-0.95, 0.12, 0.3, 0.2, 0.5, 0.15));
  else {
    t2.add(Y(0.9, 0.35, 0.9, 0.06), { layer: J.rock, color: `#cec6b8` }, K(0, 0.02, 0));
    for (let e5 = 0; e5 < 5; e5 += 1) t2.add(hk(0.62, 0.5, 0.62, 1420 + e5, 0.15), { layer: J.rock, color: bM }, K(0, 0.45 + e5 * 0.5, 0, 0, e5 % 2 * 0.03));
    t2.add(Y(0.78, 0.16, 0.78, 0.04), { layer: J.rock, color: `#d2cabb` }, K(0, 2.78, 0)), t2.add(pk([q(-0.3, 0, -0.3), q(0.3, 0, -0.3), q(-0.3, 0, 0.3), q(0.3, 0, 0.3), q(0, 0.95, 0)]), { layer: J.rock, color: bM }, K(0, 2.86, 0));
    for (let [e5, n3] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) t2.add(pk([q(-0.06, 0, -0.06), q(0.06, 0, -0.06), q(-0.06, 0, 0.06), q(0.06, 0, 0.06), q(0, 0.32, 0)]), { layer: J.rock, color: bM }, K(e5 * 0.3, 2.86, n3 * 0.3));
    for (let e5 = 0; e5 < 4; e5 += 1) {
      let n3 = 0.7 + e5 * 0.25, r2 = Ck(1, 4, (t3, r3) => q((t3 - 0.5) * 0.12, -r3 * n3, Math.sin(r3 * 3 + e5) * 0.03));
      t2.add(r2, { layer: J.FLAT, color: `#44502e`, moss: 0, ao: false, sway: 0.4 }, K(-0.15 + e5 * 0.1, 2.7, 0.33));
    }
  }
  return VA(t2, K(), 1.1, 5, 1410 + e4, J.rock, `#c2bab0`, 0.08), t2.build({ ao: 0.8, aoRadius: 0.6 });
}
function dM(e4) {
  let t2 = new VO(1500 + e4), n2 = new Id(1500 + e4), r2 = 7 + e4 * 2;
  for (let i2 = 0; i2 < r2; i2 += 1) {
    let r3 = n2.range(0, Math.PI * 2), a2 = Math.sqrt(n2.next()) * (0.9 + e4 * 0.2), o2 = n2.range(0.18, 0.4);
    t2.add(hk(o2 * n2.range(1, 1.8), o2 * 0.75, o2, 1500 + e4 * 31 + i2, 0.6), { layer: J.rock, color: bM, vary: 0.12 }, K(Math.cos(r3) * a2, o2 * 0.28, Math.sin(r3) * a2, n2.range(-0.3, 0.3), r3, n2.range(-0.4, 0.4)));
  }
  return e4 === 2 && t2.add(cM(0.3, 0.6), { layer: J.rock, color: bM }, K(0.2, 0.28, -0.2, Math.PI / 2, 0.9, 0)), e4 === 1 && t2.add(Tk(1511, 0.85, 0.35, 0.7, { detail: 1, cuts: 3 }), { layer: J.dirt, color: `#bcb2a2` }), VA(t2, K(), 1.3, 10, 1520 + e4, J.rock, `#c2bab0`, 0.07), t2.build({ ao: 0.8, aoRadius: 0.45 });
}
function fM(e4) {
  let t2 = new VO(1600 + e4), n2 = (e5, n3, r2) => {
    X(t2, e5.map((e6) => q(e6.x, e6.y + r2, n3)), 0.022, 4, { layer: J.FLAT, color: `#6fd0ff`, emissive: 0.9, moss: 0, ao: false, occlude: false });
  };
  if (e4 === 0) {
    t2.add(Tk(1601, 0.62, 1.75, 0.42, { cuts: 6, rough: 0.16, crease: 30, sink: 0.25 }), { layer: J.rock, color: `#c9c4ba` });
    let e5 = [];
    for (let t3 = 0; t3 <= 24; t3 += 1) {
      let n3 = t3 / 24, r2 = n3 * Math.PI * 4;
      e5.push(q(Math.cos(r2) * 0.05 + Math.cos(r2) * n3 * 0.17, Math.sin(r2) * n3 * 0.17, 0));
    }
    n2(e5, 0.36, 1.45), n2([q(-0.12, 0, 0), q(0, 0.18, 0), q(0.12, 0, 0)], 0.37, 0.75), n2([q(0, -0.12, 0), q(0, 0.2, 0)], 0.37, 0.75);
  } else e4 === 1 ? (t2.add(Tk(1602, 0.55, 1.45, 0.4, { cuts: 6, rough: 0.2, crease: 32, sink: 0.25 }), { layer: J.rock, color: `#c3beb3` }, K(0, 0, 0, 0.05, 0, 0.22)), t2.add(Tk(1603, 0.35, 0.3, 0.3, { cuts: 4, detail: 1 }), { layer: J.rock, color: `#c3beb3` }, K(0.9, 0, 0.3, 0.3, 0.4, 0.2))) : (t2.add(Tk(1604, 0.45, 1.25, 0.38, { cuts: 5, sink: 0.2 }), { layer: J.rock, color: `#c6c0b6` }, K(-0.5, 0, 0)), t2.add(Tk(1605, 0.42, 1.15, 0.36, { cuts: 5, sink: 0.2 }), { layer: J.rock, color: `#c6c0b6` }, K(0.5, 0, 0.05)), t2.add(Tk(1606, 0.95, 0.3, 0.45, { cuts: 5, flatBottom: false }), { layer: J.rock, color: `#cfc9be` }, K(0, 2.35, 0, 0, 0.1, 0.06)));
  return VA(t2, K(), 1, 5, 1610 + e4, J.rock, `#bdb6aa`, 0.08), t2.build({ ao: 0.8, aoRadius: 0.7 });
}
function pM(e4, t2, n2 = 0.7) {
  e4.add(Ek(t2, 0.42, 0.09, 0.62, 0.3, 1), { layer: J.moss, color: `#c8bc98`, gain: 1.25, moss: 0.3, texScale: 1.6 }, K(0, -0.03, n2 * 0.85));
  for (let r2 = 0; r2 < 3; r2 += 1) e4.add(Tk(t2 * 3 + r2, 0.07, 0.05, 0.06, { detail: 0, cuts: 2 }), { layer: J.rock, color: `#bdb6aa` }, K((r2 - 1) * 0.18, 0.1, n2 + (r2 % 2 ? 0.3 : -0.2)));
}
function mM(e4) {
  let t2 = new VO(1700 + e4), n2 = [`#d6cfc2`, `#c7c2b8`, `#d0c8bb`, `#cbc4b8`][e4], r2 = (e5, n3, r3) => t2.add(Y(n3, 0.025, 0.02, 5e-3), { layer: J.FLAT, color: `#2a2622`, moss: 0, ao: false }, K(0, e5, r3));
  if (e4 === 0) {
    let e5 = new Mo();
    e5.moveTo(-0.28, -0.2), e5.lineTo(0.28, -0.2), e5.lineTo(0.28, 0.55), e5.absarc(0, 0.55, 0.28, 0, Math.PI, false), e5.lineTo(-0.28, -0.2), t2.add(Dk(e5, 0.12, 0.025, 8), { layer: J.rock, color: n2, texScale: 1.5 }, K(0, 0, 0, -0.06, 0, 0.04));
    for (let e6 = 0; e6 < 3; e6 += 1) r2(0.5 - e6 * 0.1, 0.32 - e6 * 0.06, 0.09);
    t2.add(Y(0.08, 0.22, 0.02, 6e-3), { layer: J.FLAT, color: `#2a2622`, moss: 0, ao: false }, K(0, 0.72, 0.085, -0.06)), t2.add(Y(0.16, 0.06, 0.02, 6e-3), { layer: J.FLAT, color: `#2a2622`, moss: 0, ao: false }, K(0, 0.76, 0.083, -0.06)), pM(t2, 1701);
  } else if (e4 === 1) t2.add(pk([q(-0.3, -0.2, -0.07), q(0.3, -0.2, -0.07), q(-0.3, -0.2, 0.07), q(0.3, -0.2, 0.07), q(-0.3, 0.75, -0.07), q(-0.3, 0.75, 0.07), q(0.12, 0.82, -0.07), q(0.12, 0.82, 0.07), q(0.3, 0.5, -0.07), q(0.3, 0.5, 0.07)]), { layer: J.rock, color: n2 }, K(0, 0, 0, -0.28, 0.1, 0.1)), t2.add(hk(0.22, 0.08, 0.14, 1711, 0.6), { layer: J.rock, color: n2 }, K(0.38, 0.03, 0.35, 0.2, 0.7, 0.1)), pM(t2, 1702, 0.75);
  else if (e4 === 2) {
    let e5 = new Mo();
    e5.moveTo(-0.26, -0.2), e5.lineTo(0.26, -0.2), e5.lineTo(0.26, 0.6), e5.quadraticCurveTo(0.26, 0.85, 0, 1.02), e5.quadraticCurveTo(-0.26, 0.85, -0.26, 0.6), e5.lineTo(-0.26, -0.2), t2.add(Dk(e5, 0.13, 0.02, 6), { layer: J.rock, color: n2, texScale: 1.5 }, K(0, 0, 0, 0.05, 0, -0.06)), t2.add(Y(0.06, 0.34, 0.03, 0.01), { layer: J.rock, color: `#e2dbcf` }, K(0, 0.6, 0.095, 0.05, 0, -0.06)), t2.add(Y(0.22, 0.06, 0.03, 0.01), { layer: J.rock, color: `#e2dbcf` }, K(0, 0.68, 0.095, 0.05, 0, -0.06)), t2.add(Y(0.66, 0.16, 0.3, 0.04), { layer: J.rock, color: `#bdb5a8` }, K(0, 0, 0.02)), pM(t2, 1703);
  } else t2.add(Y(0.5, 0.55, 0.12, 0.03), { layer: J.rock, color: n2 }, K(0, 0.22, -0.1, -0.08, 0, 0)), r2(0.36, 0.28, -0.03), r2(0.28, 0.2, -0.03), t2.add(hk(0.62, 0.12, 0.62, 1731, 0.3), { layer: J.rock, color: `#c9c2b6` }, K(0, 0.06, 0.42, 0.05, 0.02, 0.03)), t2.add(hk(0.62, 0.12, 0.52, 1732, 0.4), { layer: J.rock, color: `#c9c2b6` }, K(0.03, 0.1, 1, -0.18, -0.05, 0.08)), t2.add(Y(0.66, 0.08, 1.3, 0.02), { layer: J.FLAT, color: `#141110`, moss: 0 }, K(0, 0, 0.7));
  return t2.build({ ao: 0.8, aoRadius: 0.4 });
}
function hM(e4) {
  let t2 = new VO(1800 + e4), n2 = () => {
    let e5 = new Mo(), t3 = 0.11, n3 = 0.42, r3 = 1.75, i3 = 1.25;
    return e5.moveTo(-t3 * 1.15, -0.1), e5.lineTo(t3 * 1.15, -0.1), e5.lineTo(t3, i3 - t3), e5.lineTo(n3, i3 - t3 * 1.4), e5.lineTo(n3, i3 + t3 * 1.4), e5.lineTo(t3, i3 + t3), e5.lineTo(t3 * 1.3, r3), e5.lineTo(-t3 * 1.3, r3), e5.lineTo(-t3, i3 + t3), e5.lineTo(-n3, i3 + t3 * 1.4), e5.lineTo(-n3, i3 - t3 * 1.4), e5.lineTo(-t3, i3 - t3), e5.lineTo(-t3 * 1.15, -0.1), e5;
  }, r2 = `#d3ccc0`, i2 = (e5, i3) => {
    t2.group(e5, () => {
      t2.add(Dk(n2(), 0.16, 0.022, 4), { layer: J.rock, color: r2, texScale: 1.4 });
      let e6 = new Uo(0.27, 0.045, 5, i3 ? 10 : 16, i3 ? Math.PI * 1.3 : Math.PI * 2);
      e6.deleteAttribute(`uv`), t2.add(e6, { layer: J.rock, color: r2 }, K(0, 1.25, 0, 0, 0, i3 ? 1.2 : 0, 1, 1, 1.6)), t2.add(vk(0.07, 8, 5), { layer: J.rock, color: `#ddd6ca` }, K(0, 1.25, 0.07, 0, 0, 0, 1, 1, 0.5));
    });
  };
  return t2.add(hk(0.62, 0.32, 0.46, 1801, 0.25), { layer: J.rock, color: `#c3bbad` }, K(0, 0.08, 0)), e4 === 0 ? i2(K(0, 0.2, 0), false) : e4 === 1 ? i2(K(0, 0.18, 0, -0.12, 0, 0.18), true) : (t2.add(Y(0.24, 0.8, 0.16, 0.03), { layer: J.rock, color: r2 }, K(0, 0.6, 0)), lM(t2, 1, 0.1, 1811, r2), i2(K(0.35, 0.1, 0.95, -Math.PI / 2 + 0.08, 0.5, 0).multiply(K(0, -1.05, 0)), false)), pM(t2, 1820 + e4, 0.75), t2.build({ ao: 0.8, aoRadius: 0.45 });
}
function gM(e4) {
  let t2 = new VO(1900 + e4);
  t2.add(hk(0.34, 1.25, 0.34, 1901, 0.2), { layer: J.rock, color: bM }, K(0, 0.48, -2 / 2)), t2.add(pk([q(-0.22, 0, -0.22), q(0.22, 0, -0.22), q(-0.22, 0, 0.22), q(0.22, 0, 0.22), q(-0.16, 0.12, -0.16), q(0.16, 0.12, -0.16), q(-0.16, 0.12, 0.16), q(0.16, 0.12, 0.16), q(0, 0.3, 0)]), { layer: J.rock, color: `#d2cabb` }, K(0, 1.1, -2 / 2)), t2.add(Y(0.42, 0.22, 0.42, 0.04), { layer: J.rock, color: `#c7bfb1` }, K(0, -0.04, -2 / 2));
  let n2 = { layer: J.iron, color: `#8a8580`, moss: 0 }, r2 = e4 === 1 ? 0.12 : 0, i2 = (e5, t3) => t3 - r2 * Math.sin((e5 + 2 / 2) / 2 * Math.PI);
  for (let e5 of [0.25, 1.15]) {
    let r3 = [];
    for (let t3 = 0; t3 <= 4; t3 += 1) {
      let n3 = -0.85 + t3 / 4 * 1.85;
      r3.push(q(0, i2(n3, e5), n3));
    }
    X(t2, r3, 0.022, 4, n2, { flat: 0.6 });
  }
  for (let r3 = 0; r3 < 12; r3 += 1) {
    if (e4 === 1 && r3 === 7) continue;
    let a3 = -0.72 + r3 / 11 * 1.6400000000000001, o2 = e4 === 1 && (r3 === 6 || r3 === 8) ? r3 === 6 ? 0.18 : -0.12 : 0, s2 = i2(a3, 1.38) + r3 % 2 * 0.08;
    X(t2, [q(0, -0.1, a3), q(o2 * 0.3, 0.7, a3), q(o2, s2, a3 + o2 * 0.5)], 0.014, 4, n2), t2.add(pk([q(-0.012, 0, -0.035), q(0.012, 0, -0.035), q(-0.012, 0, 0.035), q(0.012, 0, 0.035), q(0, 0.14, 0)]), n2, K(o2, s2, a3 + o2 * 0.5, o2 * 0.3, 0, 0));
  }
  let a2 = [];
  for (let e5 = 0; e5 <= 14; e5 += 1) {
    let t3 = e5 / 14, n3 = t3 * Math.PI * 3;
    a2.push(q(0, 0.7 + Math.sin(n3) * 0.12 * (1 - t3 * 0.6), -0.7 + Math.cos(n3) * 0.12 * (1 - t3 * 0.6) + t3 * 0.05));
  }
  return X(t2, a2, 0.01, 3, n2), VA(t2, K(0, 0, -2 / 2), 0.4, 3, 1910 + e4, J.rock, `#bdb6aa`, 0.06), t2.build({ ao: 0.6, aoRadius: 0.4 });
}
function _M() {
  let e4 = new VO(2e3), t2 = 0.68, n2 = 0.98;
  for (let r2 = 0; r2 < 2; r2 += 1) for (let i2 = 0; i2 < 11; i2 += 1) {
    let a2 = (i2 + r2 * 0.5) / 11 * Math.PI * 2 + 0.02, o2 = (i2 + 1 + r2 * 0.5) / 11 * Math.PI * 2 - 0.02, s2 = -0.1 + r2 * 0.4, c2 = s2 + 0.38, l2 = [];
    for (let e5 of [a2, o2]) for (let r3 of [t2, n2]) for (let t3 of [s2, c2]) l2.push(q(Math.cos(e5) * r3, t3, Math.sin(e5) * r3));
    e4.add(pk(l2), { layer: J.rock, color: bM, vary: 0.12 });
  }
  for (let r2 = 0; r2 < 8; r2 += 1) {
    let i2 = r2 / 8 * Math.PI * 2 + 0.03, a2 = (r2 + 1) / 8 * Math.PI * 2 - 0.03, o2 = [];
    for (let e5 of [i2, a2]) for (let r3 of [t2 - 0.04, n2 + 0.05]) for (let t3 of [0.7, 0.82]) o2.push(q(Math.cos(e5) * r3, t3, Math.sin(e5) * r3));
    e4.add(pk(o2), { layer: J.rock, color: `#d3cbbd`, vary: 0.1 });
  }
  e4.add(_k(t2, t2, -0.4, 0.7, 14, 1, true).scale(-1, 1, 1), { layer: J.rock, color: `#5a544c`, moss: 0.2 }), e4.add(_k(t2 - 0.01, t2 - 0.01, 0.2, 0.22, 14), { layer: J.GLOSS, color: `#0a0d10`, moss: 0 });
  for (let t3 of [-1, 1]) DA(e4, t3 * 0.82, 0, 0.6, 2.25, 0.08, { seed: 2001 + t3, color: HA.deadBark, layer: J.deadwood, gain: 1.3 });
  EA(e4, q(-1, 1.95, 0), q(1.05, 1.95, 0), 0.1, 0.1, { layer: J.grain, color: `#c8b8a0` }), X(e4, [q(1.05, 1.95, 0), q(1.15, 1.95, 0), q(1.17, 1.75, 0.02), q(1.3, 1.72, 0.05)], 0.02, 4, { layer: J.iron, color: `#8a8580` }), e4.add(_k(0.09, 0.09, -0.35, 0.35, 8), { layer: J.grain, color: `#b8a58a` }, K(0, 1.95, 0, 0, 0, Math.PI / 2)), X(e4, [q(0.05, 1.86, 0), q(0.05, 1.2, 0.01), q(0.05, 0.62, 0)], 0.016, 4, { layer: J.thatch, color: HA.rope, moss: 0 }), e4.group(K(0.05, 0.38, 0), () => {
    e4.add(Sk([[1e-3, 0], [0.13, 0], [0.15, 0.22], [0.13, 0.22]], 10), { layer: J.grain, color: `#a8957a` }), e4.add(new Uo(0.15, 0.012, 3, 10).rotateX(Math.PI / 2).translate(0, 0.17, 0).deleteAttribute(`uv`), { layer: J.iron, color: `#8a8580` }), X(e4, [q(-0.14, 0.2, 0), q(0, 0.36, 0), q(0.14, 0.2, 0)], 8e-3, 3, { layer: J.iron, color: `#8a8580` });
  });
  for (let t3 of [-1, 1]) e4.add(Y(0.9, 0.06, 1.55, 0.015), { layer: J.slate, color: `#cfcfcf`, texScale: 2.2 }, K(t3 * 0.36, 2.42, 0, 0, 0, -t3 * 0.7));
  return EA(e4, q(0, 2.62, -0.8), q(0, 2.62, 0.8), 0.09, 0.09, { layer: J.grain, color: `#b8a58a` }), VA(e4, K(), 1.6, 8, 2010, J.rock, `#bdb6aa`, 0.08), e4.build({ ao: 0.85, aoRadius: 0.6 });
}
function vM() {
  let e4 = new VO(2100), t2 = { layer: J.rock, color: `#d6d0c6`, texScale: 1.6, moss: 0.6 };
  return e4.add(Y(1.35, 0.3, 1.35, 0.05), { ...t2, color: `#c4bcae` }, K(0, 0.05, 0)), e4.add(Y(1.05, 0.85, 1.05, 0.06), { ...t2, color: `#ccc4b6` }, K(0, 0.6, 0)), e4.add(Y(1.2, 0.14, 1.2, 0.04), { ...t2, color: `#c4bcae` }, K(0, 1.08, 0)), e4.add(Y(0.5, 0.06, 0.02, 0.01), { layer: J.FLAT, color: `#2a2622`, moss: 0, ao: false }, K(0, 0.7, 0.53)), e4.group(K(0, 1.15, 0), () => {
    let n2 = Sk([[0.42, 0], [0.4, 0.15], [0.33, 0.6], [0.27, 1.05], [0.25, 1.3], [0.22, 1.45], [0.12, 1.52]], 16), r2 = n2.getAttribute(`position`);
    for (let e5 = 0; e5 < r2.count; e5 += 1) {
      let t3 = r2.getX(e5), n3 = r2.getY(e5), i3 = r2.getZ(e5), a2 = 1 + Math.sin(Math.atan2(i3, t3) * 7) * 0.05 * (1 - n3 / 1.6);
      r2.setXYZ(e5, t3 * a2 * 0.95, n3, i3 * a2 * 0.8 + n3 / 1.5 * 0.05);
    }
    n2.computeVertexNormals(), e4.add(n2, t2);
    let i2 = vk(0.21, 10, 8);
    e4.add(i2, t2, K(0, 1.62, 0.1, 0.5, 0, 0, 1, 1.15, 1.1)), e4.add(vk(0.12, 8, 6), { layer: J.FLAT, color: `#1a1714`, moss: 0, ao: false }, K(0, 1.55, 0.25, 0.5, 0, 0, 1, 1, 0.5));
    for (let n3 of [-1, 1]) X(e4, [q(n3 * 0.24, 1.38, 0.02), q(n3 * 0.28, 1.1, 0.16), q(n3 * 0.06, 1, 0.3)], [0.085, 0.075, 0.065], 7, t2);
    e4.add(Y(0.06, 0.95, 0.02, 0.01), t2, K(0, 0.48, 0.34)), e4.add(Y(0.36, 0.05, 0.06, 0.015), t2, K(0, 0.98, 0.33)), e4.add(vk(0.045, 6, 4), t2, K(0, 1.12, 0.33));
    for (let n3 of [-1, 1]) {
      let r3 = new Mo();
      r3.moveTo(0, 0), r3.quadraticCurveTo(0.35, 0.3, 0.32, 1.1), r3.quadraticCurveTo(0.2, 1.5, 0.05, 1.75), r3.quadraticCurveTo(0.12, 1.1, 0.02, 0.6), r3.lineTo(0, 0);
      let i3 = Dk(r3, 0.06, 0.02, 6);
      e4.add(i3, t2, K(n3 * 0.16, 0.25, -0.22, 0.12, n3 * 1.35, -n3 * 0.12, n3 > 0 ? 1 : -1, 1, 1));
      for (let r4 = 0; r4 < 4; r4 += 1) e4.add(Y(0.03, 0.4 - r4 * 0.06, 0.05, 0.01), t2, K(n3 * (0.22 + r4 * 0.05), 0.55 + r4 * 0.28, -0.3 - r4 * 0.02, 0.2, 0, -n3 * 0.15));
    }
  }), VA(e4, K(), 1.2, 6, 2110, J.rock, `#bdb6aa`, 0.08), e4.build({ ao: 0.85, aoRadius: 0.6 });
}
function yM() {
  let e4 = new VO(2200), t2 = 3.9, n2 = 4.3, r2 = { layer: J.stone, color: `#d0c8ba`, texScale: 1.15 }, i2 = { layer: J.rock, color: `#cfc7b8` };
  e4.add(hk(t2 + 1.3, 0.32, n2 + 1.5, 2201, 0.15), i2, K(0, 0, 0.2)), e4.add(hk(t2 + 0.75, 0.3, n2 + 0.85, 2202, 0.15), i2, K(0, 0.28, 0.12));
  for (let t3 = 0; t3 < 2; t3 += 1) e4.add(hk(1.8 - t3 * 0.2, 0.18, 0.42, 2203 + t3, 0.3), i2, K(0, 0.09 + t3 * 0.18, n2 / 2 + 1 - t3 * 0.35));
  let a2 = 0.42;
  for (let i3 of [-1, 1]) e4.add(Y(0.45, 3, n2, 0.05), r2, K(i3 * (t2 / 2 - 0.22), a2 + 3 / 2, 0));
  e4.add(Y(t2 - 0.9, 3, 0.45, 0.05), r2, K(0, a2 + 3 / 2, -n2 / 2 + 0.22));
  let o2 = 1.2;
  for (let i3 of [-1, 1]) {
    let s3 = (t2 - o2) / 2;
    e4.add(Y(s3, 3, 0.5, 0.05), r2, K(i3 * (o2 / 2 + s3 / 2), a2 + 3 / 2, n2 / 2 - 0.25));
  }
  let s2 = a2 + 1.7;
  for (let t3 of [-1, 1]) {
    let r3 = { x: -t3 * o2 / 2, y: s2 }, a3 = t3 < 0 ? Math.PI : 0, c3 = t3 < 0 ? 2 * Math.PI / 3 : Math.PI / 3;
    for (let t4 = 0; t4 < 3; t4 += 1) {
      let s3 = a3 + (c3 - a3) * t4 / 3, l3 = a3 + (c3 - a3) * (t4 + 1) / 3;
      e4.add(oM(r3, o2, 0.24, Math.min(s3, l3), Math.max(s3, l3), 0.58), { ...i2, color: `#d9d1c2` }, K(0, 0, n2 / 2 - 0.22));
    }
  }
  e4.add(Y(o2 + 0.1, 1.25, 0.42, 0.03), r2, K(0, s2 + 1.3 / 2 + 0.25, n2 / 2 - 0.3)), e4.add(Y(o2, 2.6, 0.05, 0.01), { layer: J.FLAT, color: `#050404`, moss: 0, ao: false }, K(0, a2 + 1.1, n2 / 2 - 0.42)), e4.group(K(-o2 / 2 + 0.05, a2, n2 / 2 - 0.12, 0, 0.55, 0), () => {
    let t3 = { layer: J.iron, color: `#7d7872`, moss: 0 };
    for (let n3 = 0; n3 < 6; n3 += 1) {
      let r3 = 0.06 + n3 * 0.1;
      X(e4, [q(r3, 0.05, 0), q(r3, 1.75 + Math.sin(n3 / 5 * Math.PI) * 0.12, 0)], 0.013, 4, t3), e4.add(pk([q(-0.012, 0, -0.03), q(0.012, 0, -0.03), q(-0.012, 0, 0.03), q(0.012, 0, 0.03), q(0, 0.12, 0)]), t3, K(r3, 1.75 + Math.sin(n3 / 5 * Math.PI) * 0.12, 0, 0, Math.PI / 2, 0));
    }
    for (let n3 of [0.15, 0.95, 1.65]) X(e4, [q(0, n3, 0), q(0.6, n3, 0)], 0.016, 4, t3, { flat: 0.6 });
  });
  for (let t3 of [-1, 1]) {
    let r3 = t3 * (o2 / 2 + 0.42);
    e4.add(Y(0.42, 0.22, 0.42, 0.04), i2, K(r3, a2 + 0.11, n2 / 2 + 0.25)), e4.add(cM(0.15, 2.45, 8), { ...i2, color: `#ddd5c7` }, K(r3, a2 + 0.2, n2 / 2 + 0.25)), e4.add(Y(0.44, 0.2, 0.44, 0.04), i2, K(r3, a2 + 2.75, n2 / 2 + 0.25));
  }
  e4.add(Y(t2 + 0.25, 0.26, 0.9, 0.05), i2, K(0, a2 + 3 + 0.05, n2 / 2 - 0.05)), e4.add(Y(t2 + 0.25, 0.22, n2 + 0.25, 0.05), i2, K(0, a2 + 3, 0));
  let c2 = a2 + 3 + 1.55;
  for (let i3 of [n2 / 2 + 0.05, -n2 / 2]) e4.add(pk([q(-t2 / 2 - 0.1, a2 + 3 + 0.12, i3 - 0.22), q(t2 / 2 + 0.1, a2 + 3 + 0.12, i3 - 0.22), q(0, c2, i3 - 0.22), q(-t2 / 2 - 0.1, a2 + 3 + 0.12, i3 + 0.22), q(t2 / 2 + 0.1, a2 + 3 + 0.12, i3 + 0.22), q(0, c2, i3 + 0.22)]), r2);
  let l2 = t2 / 2 + 0.35, u2 = c2 - (a2 + 3 + 0.1), d2 = Math.atan2(u2, l2), f2 = Math.hypot(l2, u2) + 0.1;
  for (let t3 of [-1, 1]) e4.add(Y(f2, 0.14, n2 + 0.75, 0.03), { layer: J.slate, color: `#c9cacb`, texScale: 1, moss: 0.9 }, K(t3 * l2 / 2, a2 + 3 + 0.12 + u2 / 2 + 0.06, 0, 0, 0, -t3 * d2));
  e4.add(_k(0.09, 0.09, -(n2 + 0.8) / 2, (n2 + 0.8) / 2, 6), i2, K(0, c2 + 0.08, 0, Math.PI / 2, 0, 0)), e4.add(Y(0.1, 0.75, 0.1, 0.02), i2, K(0, c2 + 0.4, n2 / 2 + 0.05)), e4.add(Y(0.42, 0.1, 0.1, 0.02), i2, K(0, c2 + 0.55, n2 / 2 + 0.05));
  for (let r3 of [-1, 1]) for (let o3 of [-1, 1]) e4.add(Y(0.5, 3.25, 0.5, 0.05), { ...i2, color: `#c9c1b2` }, K(r3 * (t2 / 2 + 0.02), a2 + 3.25 / 2 - 0.1, o3 * (n2 / 2 + 0.02))), e4.add(pk([q(-0.2, 0, -0.2), q(0.2, 0, -0.2), q(-0.2, 0, 0.2), q(0.2, 0, 0.2), q(0, 0.75, 0)]), i2, K(r3 * (t2 / 2 + 0.02), a2 + 3 + 0.15, o3 * (n2 / 2 + 0.02)));
  for (let r3 of [-1, 1]) e4.add(Sk([[1e-3, 0], [0.16, 0], [0.12, 0.08], [0.2, 0.25], [0.18, 0.4], [0.12, 0.45], [0.15, 0.5], [1e-3, 0.5]], 10), i2, K(r3 * (t2 / 2 + 0.45), 0.43, n2 / 2 + 0.75));
  e4.add(Y(t2 - 0.4, 0.035, 0.02, 8e-3), { layer: J.FLAT, color: `#24201c`, moss: 0, ao: false }, K(0, a2 + 3 - 0.28, n2 / 2 + 0.01)), e4.add(Y(1, 0.03, 0.02, 8e-3), { layer: J.FLAT, color: `#24201c`, moss: 0, ao: false }, K(0, a2 + 3 + 0.08, n2 / 2 + 0.41));
  for (let n3 = 0; n3 < 6; n3 += 1) {
    let r3 = 0.8 + n3 % 3 * 0.45, i3 = Ck(1, 5, (e5, t3) => q((e5 - 0.5) * 0.14, -t3 * r3, Math.sin(t3 * 4 + n3) * 0.04));
    e4.add(i3, { layer: J.FLAT, color: n3 % 2 ? `#3a4628` : `#47522f`, moss: 0, ao: false, sway: 0.35 }, K(-t2 / 2 - 0.27, a2 + 3 - 0.1, -1.2 + n3 * 0.32, 0, -Math.PI / 2));
  }
  return iM(e4, new Id(2290), 4, 2.8, false, 2291), VA(e4, K(0, 0, 0.3), 3.2, 10, 2295, J.rock, `#c2bab0`, 0.1), e4.build({ ao: 0.85, aoRadius: 1 });
}
var bM, xM, SM = t((() => {
  Ed(), UO(), kk(), UA(), ZO(), bM = `#d9d1c3`, xM = { ruinWall: { variants: 8, build: aM }, ruinArch: { variants: 1, build: sM }, ruinPillar: { variants: 3, build: uM }, rubble: { variants: 3, build: dM }, standingStone: { variants: 3, build: fM, glow: (e4) => e4 === 0 ? [q(0, 1.4, 0.45)] : [] }, gravestone: { variants: 4, build: mM }, celticCross: { variants: 3, build: hM }, mausoleum: { variants: 1, build: yM }, ironFence: { variants: 2, build: gM }, well: { variants: 1, build: _M }, statue: { variants: 1, build: vM } };
}));
function CM(e4, t2, n2, r2, i2, a2, o2 = [0, 0]) {
  DA(e4, t2, n2, -0.35, r2, i2, { seed: a2, point: 0.42, lean: o2, radial: 7, layer: J.bark, color: `#c8b8a2`, moss: 0.5 }), e4.add(yk(i2 * 0.98, 0.5, 7), { layer: J.deadwood, color: `#4a3f36`, moss: 0 }, K(t2 + o2[0], r2 - 0.04, n2 + o2[1]));
}
function wM(e4) {
  let t2 = new VO(3e3 + e4), n2 = new Id(3e3 + e4), r2 = [-0.35, 0, 0.35], i2 = [[3.9, 4.15, 3.7], [4.2, 3.75, 4.05], [3.8, 4.1, 2.9]][e4];
  r2.forEach((r3, a2) => CM(t2, n2.range(-0.04, 0.04), r3, i2[a2], n2.range(0.17, 0.2), 3e3 + e4 * 7 + a2, [n2.range(-0.05, 0.05), 0])), e4 === 2 && (t2.add(_k(0.2, 0.2, 2.86, 2.9, 7), { layer: J.wood, color: HA.cutWood }, K(0, 0, 0.35)), TA(t2, K(0.2, 1.6, 0.2, 0, 0, 0.08), 1.6, 0.2, 0.05, { ...ZM }));
  for (let [e5, n3] of [[0.24, 0.95], [-0.24, 2.7]]) {
    EA(t2, q(e5, n3, -0.6), q(e5, n3 + 0.03, 0.6), 0.12, 0.1, { layer: J.bark, color: `#bba893` });
    for (let r3 of [-0.35, 0.35]) {
      let i3 = new Uo(0.2, 0.022, 3, 8);
      i3.deleteAttribute(`uv`), t2.add(i3, { layer: J.thatch, color: HA.rope, moss: 0.1, texScale: 3 }, K(e5 * 0.55, n3, r3, 0, Math.PI / 2, 0.3, 1, 1.35, 1));
    }
  }
  return e4 === 1 && (t2.group(K(0.3, 2.05, 0.18, 0, Math.PI / 2, 0), () => {
    t2.add(_k(0.36, 0.36, -0.03, 0.03, 12).rotateX(Math.PI / 2), { layer: J.wood, color: `#8a4a32` }), t2.add(vk(0.09, 8, 5).scale(1, 1, 0.5), QM, K(0, 0, 0.04));
    let e5 = new Uo(0.36, 0.025, 4, 16);
    e5.deleteAttribute(`uv`), t2.add(e5, QM);
  }), jA(t2, K(0.27, 3.15, -0.16, 0, Math.PI / 2, 0), 1)), VA(t2, K(), 0.7, 3, 3010 + e4, J.rock, `#bdb6aa`, 0.07), t2.build({ ao: 0.8, aoRadius: 0.6 });
}
function TM(e4) {
  let t2 = new VO(3100 + e4), n2 = 1.15, r2 = 3.3, i2 = e4 === 0 ? 5 : 4.6;
  for (let [r3, a3] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) DA(t2, r3 * n2, a3 * n2, -0.4, i2, 0.21, { seed: 3101 + r3 * 3 + a3, layer: J.bark, color: `#c8b8a2`, lean: [-r3 * 0.08, -a3 * 0.08], point: e4 === 1 ? 0.3 : void 0 });
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let i3 = e5 * Math.PI / 2, a3 = Math.cos(i3), o2 = Math.sin(i3), s2 = (e6, t3) => q(a3 * n2 * 0.96 - o2 * e6, t3, o2 * n2 * 0.96 + a3 * e6);
    EA(t2, s2(-n2, 0.4), s2(n2, r2 - 0.2), 0.11, 0.08, { layer: J.bark, color: `#b8a690` }), e5 % 2 == 0 && EA(t2, s2(n2, 0.4), s2(-n2, r2 - 0.2), 0.11, 0.08, { layer: J.bark, color: `#b8a690` }), EA(t2, s2(-n2 - 0.15, r2 - 0.12), s2(n2 + 0.15, r2 - 0.12), 0.16, 0.14, { layer: J.bark, color: `#bba893` });
  }
  for (let e5 = 0; e5 < 9; e5 += 1) TA(t2, K(-1.3 + e5 * 0.325, r2 + 0.04, 0, Math.PI / 2, 0, 0), 2.95, 0.3, 0.07, { ...XM, color: e5 % 3 ? `#cdb99c` : `#bda98d` });
  let a2 = new Id(3150 + e4);
  for (let e5 = 0; e5 < 4; e5 += 1) {
    let n3 = e5 * Math.PI / 2;
    for (let i4 = 0; i4 < 6; i4 += 1) {
      if (e5 === 0 && (i4 === 2 || i4 === 3)) continue;
      let o2 = -1.15 + i4 * 0.46;
      DA(t2, Math.cos(n3) * 1.32 - Math.sin(n3) * o2, Math.sin(n3) * 1.32 + Math.cos(n3) * o2, r2, r2 + a2.range(1, 1.25), 0.09, { seed: 3160 + e5 * 10 + i4, point: 0.18, radial: 5, layer: J.bark, color: `#bfae98` });
    }
    let i3 = (e6, t3) => q(Math.cos(n3) * 1.35 - Math.sin(n3) * e6, t3, Math.sin(n3) * 1.35 + Math.cos(n3) * e6);
    EA(t2, i3(-1.4, r2 + 0.75), i3(1.4, r2 + 0.75), 0.08, 0.06, { layer: J.bark, color: `#b8a690` });
  }
  for (let e5 of [-0.28, 0.28]) EA(t2, q(1.75, -0.1, e5), q(1.32, r2 + 0.9, e5), 0.07, 0.06, ZM);
  for (let e5 = 0; e5 < 8; e5 += 1) {
    let n3 = (e5 + 0.6) / 9, i3 = 1.75 - 0.43 * n3, a3 = -0.1 + (r2 + 1) * n3;
    EA(t2, q(i3, a3, -0.32), q(i3, a3, 0.32), 0.05, 0.04, ZM);
  }
  if (e4 === 0) {
    let e5 = i2 - 0.05, n3 = e5 + 1.25, a3 = [q(-1.55, e5, -1.55), q(1.55, e5, -1.55), q(1.55, e5, 1.55), q(-1.55, e5, 1.55)];
    for (let e6 = 0; e6 < 4; e6 += 1) {
      let r3 = a3[e6], i3 = a3[(e6 + 1) % 4], o2 = Ck(4, 3, (e7, t3) => {
        let a4 = r3.clone().lerp(i3, e7).lerp(q(0, n3, 0), t3);
        return a4.y -= Math.sin(e7 * Math.PI) * (1 - t3) * 0.12, a4;
      });
      t2.add(o2, { layer: J.thatch, color: `#a8966f`, moss: 0.6, texScale: 1.2 });
    }
    t2.add(_k(0.06, 0.04, n3 - 0.1, n3 + 0.6, 5), { layer: J.bark, color: `#a8957d` }), BA(t2, q(-0.7, r2 + 0.08, -0.7), 0.24, 3);
  } else {
    t2.add(_k(0.05, 0.04, i2 - 0.3, i2 + 1.4, 5), { layer: J.bark, color: `#a8957d` }, K(-1.15, 0, -1.15));
    let e5 = Ck(6, 2, (e6, t3) => q(e6 * 1.1, -t3 * 0.4 * (1 - e6 * 0.5) + Math.sin(e6 * 4) * 0.04, Math.sin(e6 * 5 + t3) * 0.08));
    t2.add(e5, { layer: J.cloth, color: `#7a1a18`, moss: 0, sway: (e6) => Math.min(1, Math.max(0, (e6.x + 1.15) / 1.1)) }, K(-1.15, i2 + 1.3, -1.15));
  }
  return VA(t2, K(), 2.2, 8, 3190 + e4, J.rock, `#bdb6aa`, 0.08), t2.build({ ao: 0.85, aoRadius: 0.9 });
}
function EM(e4) {
  let t2 = new VO(3200 + e4);
  if (e4 === 0) {
    let e5 = 2.4;
    for (let n2 of [-1, 1]) DA(t2, n2 * e5, 0, -0.5, 5.4, 0.34, { seed: 3201 + n2, point: 0.5, layer: J.bark, color: `#c4b39c` }), DA(t2, n2 * (e5 + 0.55), -0.05, -0.5, 4.3, 0.24, { seed: 3205 + n2, point: 0.4, layer: J.bark, color: `#bba893` });
    wA(t2, q(-e5 - 0.6, 4.55, 0), q(e5 + 0.6, 4.6, 0), 0.26, { seed: 3210, color: `#c2b19a` }), wA(t2, q(-e5 - 0.3, 4.05, 0.32), q(e5 + 0.3, 4.05, 0.32), 0.16, { seed: 3211, color: `#bba893` });
    for (let n2 of [-1, 1]) OA(t2, q(n2 * e5, 4.55, 0), q(0, 1, 0), 0.36, 3);
    t2.group(K(0, 3.45, 0.36), () => {
      for (let e7 of [-1, 1]) X(t2, [q(e7 * 0.45, 0.6, 0), q(e7 * 0.45, 0.25, 0)], 0.015, 4, QM);
      for (let e7 = 0; e7 < 3; e7 += 1) TA(t2, K(0, 0 + e7 * 0.17 - 0.12, 0, 0, 0, Math.PI / 2), 1.25, 0.16, 0.05, { ...XM, color: `#bfa98a` });
      let e6 = new Uo(0.17, 0.025, 4, 14);
      e6.deleteAttribute(`uv`), t2.add(e6, { layer: J.FLAT, color: `#2a1a12`, moss: 0 }, K(0, 0.05, 0.035)), t2.add(Y(0.04, 0.3, 0.01, 5e-3), { layer: J.FLAT, color: `#2a1a12`, moss: 0 }, K(0, 0.05, 0.035));
    });
    for (let n2 of [-1, 1]) t2.group(K(n2 * (e5 - 0.25), 0, 0.3, 0, n2 * -1.45, 0), () => {
      for (let e6 = 0; e6 < 6; e6 += 1) DA(t2, -n2 * (0.18 + e6 * 0.36), 0, -0.1, 3.3 + e6 % 2 * 0.15, 0.17, { seed: 3220 + e6 + (n2 > 0 ? 10 : 0), point: 0.3, layer: J.bark, color: `#bfae98`, radial: 6 });
      for (let e6 of [0.6, 2.4]) EA(t2, q(-n2 * 0.05, e6, 0.2), q(-n2 * 2.1, e6, 0.2), 0.16, 0.08, { ...XM, color: `#a89276` });
      EA(t2, q(-n2 * 0.1, 0.65, 0.22), q(-n2 * 2, 2.35, 0.22), 0.14, 0.07, { ...XM, color: `#a89276` }), X(t2, [q(0, 0.6, 0.27), q(-n2 * 0.5, 0.6, 0.27)], 0.025, 4, QM, { flat: 0.5 }), X(t2, [q(0, 2.4, 0.27), q(-n2 * 0.5, 2.4, 0.27)], 0.025, 4, QM, { flat: 0.5 });
    });
    VA(t2, K(), 3, 10, 3240, J.rock, `#bdb6aa`, 0.09);
  } else {
    for (let e5 of [-1, 1]) {
      let n2 = e5 * 2;
      for (let r2 = 0; r2 < 4; r2 += 1) {
        let i2 = 0.75 - r2 * 0.12;
        t2.add(hk(i2, 0.42, i2, 3250 + r2 + (e5 > 0 ? 10 : 0), 0.4), { layer: J.rock, color: `#cfc8bc` }, K(n2, 0.05 + r2 * 0.4, 0, 0, r2 * 0.4));
      }
      DA(t2, n2, 0, 0.2, 3.3, 0.12, { seed: 3260 + e5, layer: J.deadwood, color: `#cbc2b3`, gain: 1.1 });
    }
    EA(t2, q(-2.25, 3.05, 0), q(2.25, 3.12, 0), 0.13, 0.11, { ...ZM, gain: 1.05 });
    for (let e5 of [-1, 1]) OA(t2, q(e5 * 2, 3.05, 0), q(0, 1, 0), 0.13, 2);
    t2.group(K(0.7, 2.25, 0), () => {
      X(t2, [q(0, 0.85, 0), q(0, 0.45, 0)], 0.01, 3, QM), t2.add(_k(0.11, 0.13, 0, 0.04, 6), QM), t2.add(_k(0.11, 0.11, 0.3, 0.34, 6), QM), t2.add(yk(0.12, 0.12, 6), QM, K(0, 0.34, 0));
      for (let e5 = 0; e5 < 4; e5 += 1) {
        let n2 = e5 / 4 * Math.PI * 2 + 0.4;
        t2.add(Y(0.015, 0.3, 0.015, 4e-3), QM, K(Math.cos(n2) * 0.11, 0.17, Math.sin(n2) * 0.11));
      }
      t2.add(_k(0.09, 0.09, 0.04, 0.3, 6), { layer: J.FLAT, color: `#ffb35a`, emissive: -2.4, ao: false, occlude: false });
    }), jA(t2, K(-0.6, 2.6, 0.02, 0.2, 0, 0.15), 1.05), X(t2, [q(-0.6, 3, 0), q(-0.6, 2.82, 0)], 0.012, 3, { layer: J.thatch, color: HA.rope }), VA(t2, K(), 2.8, 10, 3270, J.rock, `#bdb6aa`, 0.1);
  }
  return t2.build({ ao: 0.85, aoRadius: 0.9 });
}
function DM(e4, t2 = 0) {
  let n2 = new P(e4);
  return { layer: J.cloth, color: n2, gain: 1, moss: 0.1, texScale: 0.8, sway: t2, vary: 0.04 };
}
function OM(e4) {
  let t2 = new VO(3300 + e4);
  if (e4 === 0) {
    let e5 = 3.1, n2 = 1.55, r2 = 2.45;
    for (let n3 of [-e5 / 2, e5 / 2]) DA(t2, 0, n3, -0.2, r2 + 0.25, 0.06, { seed: 3301 + n3, layer: J.deadwood, color: `#c8bca8` });
    wA(t2, q(0, r2, -e5 / 2 - 0.15), q(0, r2, e5 / 2 + 0.15), 0.05, { seed: 3303, radial: 5, ends: false, color: `#c8b8a0` });
    for (let i2 of [-1, 1]) {
      let a2 = Ck(6, 5, (t3, a3) => {
        let o2 = (t3 - 0.5) * e5, s2 = i2 * n2 * a3, c2 = r2 * (1 - a3), l2 = Math.sin(t3 * Math.PI) * Math.sin(a3 * Math.PI) * 0.1, u2 = KO(o2 * 2, a3 * 3, i2, 3) * 0.03;
        return q(s2 * (1 - l2 * 0.3) + u2, c2 - l2 + 0.02, o2);
      });
      t2.add(a2, DM(`#c4b79c`));
    }
    t2.add(wk((() => {
      let t3 = new Qi();
      return t3.setAttribute(`position`, new Bi([-n2, 0.02, -e5 / 2, n2, 0.02, -e5 / 2, 0, r2, -e5 / 2], 3)), t3.setIndex([0, 2, 1]), t3.computeVertexNormals(), t3;
    })()), DM(`#b9ab8e`));
    for (let i2 of [-1, 1]) {
      let a2 = Ck(3, 4, (t3, a3) => {
        let o2 = r2 * (1 - a3);
        return q(i2 * (n2 * a3 * (0.25 + t3 * 0.75)), o2, e5 / 2 + 0.02 + t3 * a3 * 0.35);
      });
      t2.add(a2, DM(`#b4a586`, 0.15)), X(t2, [q(i2 * n2 * 0.55, r2 * 0.42, e5 / 2 + 0.2), q(i2 * n2 * 0.6, r2 * 0.4, e5 / 2 + 0.25)], 0.03, 4, { layer: J.thatch, color: HA.rope });
    }
    t2.add(Y(n2 * 1.6, 0.03, e5 * 0.9, 0.01), { layer: J.FLAT, color: `#14100c`, moss: 0 }, K(0, 0.01, 0));
    for (let n3 of [-e5 / 2, e5 / 2]) for (let e6 of [-1, 1]) {
      let i2 = q(0, r2 + 0.1, n3), a2 = q(e6 * 0.6, 0, n3 + Math.sign(n3) * 1.1);
      X(t2, [i2, i2.clone().lerp(a2, 0.5).add(q(0, -0.06, 0)), a2], 0.012, 3, { layer: J.thatch, color: HA.rope, moss: 0 }), t2.add(yk(0.03, 0.3, 4), ZM, K(a2.x, -0.1, a2.z));
    }
    for (let e6 of [-1, 0, 1]) for (let r3 of [-1, 1]) t2.add(yk(0.03, 0.25, 4), ZM, K(r3 * (n2 + 0.15), -0.08, e6));
  } else {
    let e5 = 1.6, n2 = 2.75;
    DA(t2, 0, 0, -0.2, n2 + 0.35, 0.065, { seed: 3311, layer: J.deadwood, color: `#c8bca8` });
    let r2 = (e6) => {
      let t3 = e6 - Math.PI / 2;
      return t3 = Math.atan2(Math.sin(t3), Math.cos(t3)), Math.abs(t3) < 0.32;
    }, i2 = Ck(18, 5, (t3, r3) => {
      let i3 = t3 * Math.PI * 2, a3 = e5 * (1 - r3) * (1 + 0.04 * Math.sin(i3 * 9)) + 0.04, o3 = n2 * r3 * (r3 < 0.25 ? 0.9 : 1) + 0, s3 = Math.sin(r3 * Math.PI) * 0.08;
      return q(Math.cos(i3) * (a3 - s3), o3 + 0.02 - (1 - r3) * 0, Math.sin(i3) * (a3 - s3));
    }), a2 = i2.getAttribute(`position`), o2 = i2.index, s2 = [];
    for (let e6 = 0; e6 < o2.count; e6 += 3) {
      let t3 = o2.getX(e6), i3 = o2.getX(e6 + 1), c3 = o2.getX(e6 + 2), l3 = (a2.getX(t3) + a2.getX(i3) + a2.getX(c3)) / 3, u2 = (a2.getZ(t3) + a2.getZ(i3) + a2.getZ(c3)) / 3, d2 = (a2.getY(t3) + a2.getY(i3) + a2.getY(c3)) / 3;
      r2(Math.atan2(u2, l3)) && d2 < n2 * 0.62 || s2.push(t3, i3, c3);
    }
    i2.setIndex(s2), t2.add(i2, DM(`#c2b296`));
    let c2 = Ck(3, 3, (t3, r3) => {
      let i3 = Math.PI / 2 + 0.32 + t3 * 0.45, a3 = e5 * (1 - r3 * 0.62) + 0.06 + t3 * 0.05;
      return q(Math.cos(i3) * a3, n2 * 0.62 * (1 - r3) * 0.98 + 0.02, Math.sin(i3) * a3);
    });
    t2.add(c2, DM(`#ad9e80`, 0.2)), t2.add(_k(e5 * 0.95, e5 * 0.95, 0, 0.025, 14), { layer: J.FLAT, color: `#120e0b`, moss: 0 });
    let l2 = Ck(4, 1, (e6, t3) => q(e6 * 0.55, -t3 * 0.18 * (1 - e6 * 0.8), Math.sin(e6 * 4) * 0.04));
    t2.add(l2, { layer: J.cloth, color: `#6b1715`, moss: 0, sway: (e6) => Math.min(1, Math.max(0, e6.x * 1.6)) }, K(0.04, n2 + 0.3, 0));
    for (let i3 = 0; i3 < 6; i3 += 1) {
      let a3 = i3 / 6 * Math.PI * 2 + 0.3;
      if (r2(a3)) continue;
      let o3 = q(Math.cos(a3) * e5 * 0.75, n2 * 0.28, Math.sin(a3) * e5 * 0.75), s3 = q(Math.cos(a3) * (e5 + 0.85), 0, Math.sin(a3) * (e5 + 0.85));
      X(t2, [o3, o3.clone().lerp(s3, 0.5).add(q(0, -0.04, 0)), s3], 0.011, 3, { layer: J.thatch, color: HA.rope, moss: 0 }), t2.add(yk(0.03, 0.28, 4), ZM, K(s3.x, -0.1, s3.z));
    }
  }
  return VA(t2, K(0, 0, 0.6), 2, 6, 3320 + e4, J.rock, `#bdb6aa`, 0.07), t2.build({ ao: 0.85, aoRadius: 0.9 });
}
function kM() {
  let e4 = new VO(3400), t2 = 4.4, n2 = 2.3, r2 = 3.7, i2 = 1.9;
  for (let n3 of [-t2 / 2, 0, t2 / 2]) DA(e4, 0, n3, -0.3, r2 + 0.45, 0.08, { seed: 3401 + n3, layer: J.deadwood, color: `#c8bca8` });
  for (let r3 of [-t2 / 2, t2 / 2]) for (let t3 of [-1, 1]) DA(e4, t3 * n2, r3, -0.3, i2 + 0.1, 0.06, { seed: 3405 + r3 + t3, layer: J.deadwood, color: `#c8bca8` });
  wA(e4, q(0, r2, -t2 / 2 - 0.2), q(0, r2, t2 / 2 + 0.2), 0.06, { seed: 3409, radial: 5, ends: false, color: `#c8b8a0` });
  let a2 = `#cbbfa6`, o2 = `#7b2a22`;
  for (let s3 of [-1, 1]) {
    let c2 = Ck(8, 4, (e5, a3) => {
      let o3 = (e5 - 0.5) * (t2 + 0.3);
      return q(s3 * n2 * a3 * 1.06, r2 - (r2 - i2) * a3 - (Math.abs(Math.sin(e5 * Math.PI * 2)) * a3 * 0.12 + Math.sin(a3 * Math.PI) * 0.06), o3);
    });
    e4.add(c2, DM(a2));
    let l2 = Ck(16, 1, (e5, r3) => {
      let a3 = (e5 - 0.5) * (t2 + 0.3), o3 = Math.abs(Math.sin(e5 * Math.PI * 8)) * 0.12;
      return q(s3 * n2 * 1.07, i2 - 0.05 - r3 * (0.3 + o3), a3);
    });
    e4.add(l2, DM(o2, 0.12));
    let u2 = Ck(4, 2, (e5, r3) => q(s3 * n2 * (1 + Math.sin(e5 * Math.PI) * 0.03), i2 * (1 - r3) + 0.02, -t2 / 2 + e5 * t2 * 0.5));
    e4.add(u2, DM(`#b8aa8e`)), wA(e4, q(s3 * n2 * 1.02, i2 - 0.15, 0.05), q(s3 * n2 * 1.02, i2 - 0.15, t2 / 2), 0.1, { layer: J.canvas, color: `#b8aa8e`, seed: 3410 + s3, ends: false, radial: 6 });
  }
  for (let s3 of [-t2 / 2 - 0.15, t2 / 2 + 0.15]) {
    let t3 = new Qi();
    t3.setAttribute(`position`, new Bi([-n2 * 1.06, i2, s3, n2 * 1.06, i2, s3, 0, r2, s3], 3)), t3.setIndex([0, 2, 1]), t3.computeVertexNormals(), e4.add(wk(t3), DM(s3 > 0 ? o2 : a2));
  }
  e4.add(Ck(4, 2, (e5, r3) => q((e5 - 0.5) * n2 * 2, i2 * (1 - r3) + 0.02, -t2 / 2 - 0.02)), DM(`#b8aa8e`));
  for (let n3 of [-1, 1]) DA(e4, n3 * 1.2, t2 / 2 + 1.4, -0.3, 2.3, 0.05, { seed: 3420 + n3, layer: J.deadwood, color: `#c8bca8` });
  let s2 = Ck(4, 3, (e5, n3) => q((e5 - 0.5) * 2.6, i2 + 0.25 - n3 * 0.12 - Math.sin(e5 * Math.PI) * 0.08, t2 / 2 + 0.1 + n3 * 1.35));
  e4.add(s2, DM(a2, 0.1));
  for (let n3 of [-1, 1]) X(e4, [q(n3 * 1.2, 2.3, t2 / 2 + 1.4), q(n3 * 1.9, 1, t2 / 2 + 2.3), q(n3 * 2.3, 0, t2 / 2 + 2.8)], 0.012, 3, { layer: J.thatch, color: HA.rope, moss: 0 });
  e4.add(Y(n2 * 1.7, 0.03, t2 * 0.85, 0.01), { layer: J.hide, color: `#7a3a2a`, moss: 0 }, K(0, 0.015, 0)), e4.group(K(-1.1, 0, -0.8), () => {
    e4.add(Y(0.9, 0.06, 1.6, 0.02), XM, K(0, 0.8, 0));
    for (let [t3, n3] of [[-0.35, -0.7], [0.35, -0.7], [-0.35, 0.7], [0.35, 0.7]]) e4.add(Y(0.07, 0.8, 0.07, 0.015), XM, K(t3, 0.4, n3));
    [`#8a1010`, `#2a3f9a`, `#3f7a2a`, `#8a1010`, `#c9a040`].forEach((t3, n3) => {
      e4.add(Sk([[1e-3, 0], [0.06, 0], [0.07, 0.08], [0.03, 0.16], [0.02, 0.22], [0.025, 0.24], [1e-3, 0.24]], 8), { layer: J.GLOSS, color: t3, emissive: 0.25, moss: 0 }, K(-0.1 + n3 % 2 * 0.2, 0.83, -0.6 + n3 * 0.28));
    });
  });
  for (let t3 = 0; t3 < 5; t3 += 1) {
    let n3 = -1.6 + t3 * 0.6;
    X(e4, [q(0.4, r2 - 0.4, n3), q(0.4, r2 - 1, n3 + 0.02)], 4e-3, 3, { layer: J.thatch, color: HA.rope }), e4.add(Ek(3400 + t3, 0.09, 0.22, 0.09, 0.4, 1), { layer: J.FLAT, color: t3 % 2 ? `#5d6a3a` : `#7a6a3a`, moss: 0, sway: 0.15 }, K(0.4, r2 - 1.15, n3));
  }
  return BA(e4, q(1, 0, 0.9), 0.22, 7), X(e4, [q(1, 0, 0.9), q(1, 0.2, 0.9)], 0.04, 4, QM), VA(e4, K(0, 0, 1), 3.2, 8, 3430, J.rock, `#bdb6aa`, 0.08), e4.build({ ao: 0.85, aoRadius: 1.1 });
}
function AM(e4) {
  let t2 = new VO(3500 + e4);
  return e4 === 0 ? FA(t2, K(0, -0.02, 0, 0, 0.3, 0)) : e4 === 1 ? (FA(t2, K(-0.12, -0.02, 0, 0, 0.6, 0), 1, 0.36, { open: true, contents: `#0b0d0e` }), FA(t2, K(0.55, -0.02, 0.32, 0, 1.4, 0), 0.62, 0.25)) : (FA(t2, K(0, 0.36, 0, Math.PI / 2, 0.7, 0).multiply(K(0, -0.5, 0))), t2.add(hk(0.22, 0.14, 0.18, 3511, 0.5), { layer: J.rock, color: `#c8c0b2` }, K(0.3, 0.06, 0.35)), t2.add(_k(0.5, 0.55, -0.01, 6e-3, 10), { layer: J.GLOSS, color: `#14100c`, moss: 0 }, K(-0.55, 0, -0.5, 0, 0, 0, 1.4, 1, 0.8))), t2.build({ ao: 0.8, aoRadius: 0.45 });
}
function jM(e4) {
  let t2 = new VO(3600 + e4);
  return e4 === 0 ? IA(t2, K(0, 0, 0, 0, 0.1, 0), 0.9, 1) : e4 === 1 ? (IA(t2, K(0, 0, 0, 0, 0, 0), 0.9, 2), IA(t2, K(0.05, 0.9, 0.02, 0, 0.45, 0), 0.68, 3, { tint: `#bba78c` })) : (IA(t2, K(0, 0, 0, 0, -0.2, 0), 0.9, 4, { broken: true }), IA(t2, K(0.75, 0, 0.45, 0, 0.6, 0), 0.55, 5), t2.add(Ek(3610, 0.45, 0.08, 0.35, 0.5, 1), { layer: J.thatch, color: HA.thatch, moss: 0 }, K(0.55, 0, -0.4))), t2.build({ ao: 0.8, aoRadius: 0.45 });
}
function MM(e4) {
  let t2 = new VO(3700 + e4);
  if (e4 === 0) LA(t2, K(-0.2, 0, 0, 0, 0.3, 0.06), 1), LA(t2, K(0.32, 0, 0.12, 0, 1.6, -0.05), 2, 0.62), LA(t2, K(0.05, 0.05, 0.5, 0, 2.6, 0), 3, 0.6, true);
  else if (e4 === 1) LA(t2, K(0, 0, 0, 0, 0.2, 0.05), 4, 0.75), LA(t2, K(0.25, 0.05, 0.5, 0, 1.2, 0), 5, 0.65, true);
  else {
    for (let e5 = 0; e5 < 4; e5 += 1) TA(t2, K(-0.35 + e5 * 0.24, 0.08, 0, Math.PI / 2, 0, 0), 1.3, 0.2, 0.05, ZM);
    LA(t2, K(-0.2, 0.1, -0.2, 0, 0.3, 0.05), 6, 0.68), LA(t2, K(0.25, 0.1, -0.25, 0, 1.9, -0.05), 7, 0.62), IA(t2, K(0.05, 0.1, 0.45, 0, 0.3, 0), 0.5, 8);
  }
  return t2.build({ ao: 0.8, aoRadius: 0.4 });
}
function NM(e4) {
  let t2 = new VO(3800 + e4);
  for (let e5 of [-1, 1]) EA(t2, q(e5 * 0.85, 0, -0.35), q(e5 * 0.85, 1.45, 0), 0.08, 0.07, XM), EA(t2, q(e5 * 0.85, 0, 0.35), q(e5 * 0.85, 1.45, 0), 0.08, 0.07, XM);
  if (EA(t2, q(-0.95, 1.38, 0), q(0.95, 1.38, 0), 0.09, 0.08, XM), EA(t2, q(-0.95, 0.35, 0.22), q(0.95, 0.35, 0.22), 0.07, 0.06, XM), e4 === 0) for (let e5 = 0; e5 < 5; e5 += 1) {
    let n2 = -0.7 + e5 * 0.35, r2 = q(n2 + 0.05, 0, 0.55), i2 = q(n2, 2.05 + e5 % 2 * 0.2, -0.2);
    X(t2, [r2, i2], 0.025, 4, { layer: J.grain, color: `#a8916f` });
    let a2 = i2.clone().sub(r2).normalize();
    t2.add(pk([q(-0.045, 0, 0), q(0.045, 0, 0), q(0, 0, 0.012), q(0, 0, -0.012), q(0, 0.3, 0)]), { ...QM, color: `#c8c4be` }, new wr().compose(i2, new ir().setFromUnitVectors(q(0, 1, 0), a2), q(1, 1, 1))), e5 === 2 && t2.add(Dk(new Mo([new M(0, 0), new M(0.28, 0.08), new M(0.3, 0.3), new M(0, 0.22)]), 0.015, 4e-3), { ...QM, color: `#bdb8b0` }, new wr().compose(i2.clone().addScaledVector(a2, -0.15), new ir().setFromUnitVectors(q(0, 1, 0), a2), q(1, 1, 1)));
  }
  else {
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let n2 = -0.5 + e5 * 0.5;
      t2.group(K(n2, 1.38, 0.05, 0, 0, 0), () => {
        t2.add(pk([q(-0.035, 0, -6e-3), q(0.035, 0, -6e-3), q(-0.035, 0, 6e-3), q(0.035, 0, 6e-3), q(0, -0.95, 0)]), { ...QM, color: `#cfcbc4` }, K(0, -0.1, 0)), t2.add(Y(0.22, 0.035, 0.04, 8e-3), { ...QM, color: `#8a7a5a` }, K(0, -0.06, 0)), t2.add(_k(0.018, 0.018, -0.04, 0.12, 5), { layer: J.hide, color: `#4a3424` }), t2.add(vk(0.03, 5, 4), { ...QM, color: `#8a7a5a` }, K(0, 0.14, 0));
      });
    }
    for (let e5 = 0; e5 < 2; e5 += 1) t2.group(K(-0.45 + e5 * 0.9, 0.48, 0.45, -0.25, 0.1 * (e5 ? 1 : -1), 0), () => {
      let n2 = new Mo();
      n2.moveTo(-0.3, 0.35), n2.lineTo(0.3, 0.35), n2.lineTo(0.28, -0.05), n2.quadraticCurveTo(0.2, -0.35, 0, -0.45), n2.quadraticCurveTo(-0.2, -0.35, -0.28, -0.05), n2.lineTo(-0.3, 0.35), t2.add(Dk(n2, 0.05, 0.015), { layer: J.wood, color: e5 ? `#7a2a20` : `#2f3f5a` }), t2.add(Y(0.6, 0.05, 0.07, 0.01), QM, K(0, 0.33, 0)), t2.add(vk(0.06, 6, 4).scale(1, 1, 0.5), QM, K(0, 0, 0.04));
    });
  }
  return t2.build({ ao: 0.8, aoRadius: 0.5 });
}
function PM(e4) {
  let t2 = [];
  if (e4 === 0) {
    let e5 = new Mo();
    e5.absarc(0, 0, 0.24, 0, Math.PI * 2, false);
    let n2 = new jo();
    n2.absarc(0, 0, 0.19, 0, Math.PI * 2, true), e5.holes.push(n2), t2.push(e5);
    let r2 = new Mo();
    r2.moveTo(-0.025, 0.36), r2.lineTo(0.025, 0.36), r2.lineTo(0.025, 0.12), r2.lineTo(0.11, 0.12), r2.lineTo(0.11, 0.08), r2.lineTo(0.025, 0.08), r2.lineTo(0.03, -0.3), r2.lineTo(0, -0.4), r2.lineTo(-0.03, -0.3), r2.lineTo(-0.025, 0.08), r2.lineTo(-0.11, 0.08), r2.lineTo(-0.11, 0.12), r2.lineTo(-0.025, 0.12), r2.lineTo(-0.025, 0.36), t2.push(r2);
  } else {
    let e5 = new Mo();
    e5.moveTo(-0.3, 0), e5.quadraticCurveTo(0, 0.24, 0.3, 0), e5.quadraticCurveTo(0, -0.24, -0.3, 0);
    let n2 = new jo();
    n2.absarc(0, 0, 0.08, 0, Math.PI * 2, true), e5.holes.push(n2), t2.push(e5);
    let r2 = new Mo();
    r2.absarc(0, 0, 0.045, 0, Math.PI * 2, false), t2.push(r2);
    for (let e6 = 0; e6 < 5; e6 += 1) {
      let n3 = Math.PI * 0.2 + e6 / 4 * Math.PI * 0.6, r3 = new Mo(), i2 = Math.cos(n3), a2 = Math.sin(n3);
      r3.moveTo(i2 * 0.2 - a2 * 0.012, a2 * 0.2 + i2 * 0.012), r3.lineTo(i2 * 0.34, a2 * 0.34), r3.lineTo(i2 * 0.2 + a2 * 0.012, a2 * 0.2 - i2 * 0.012), t2.push(r3);
    }
  }
  return t2;
}
function FM(e4) {
  let t2 = new VO(3900 + e4), n2 = e4 === 2, r2 = n2 ? 3.4 : 4.2, i2 = n2 ? 0.28 : 0;
  return t2.group(K(0, 0, 0, 0, 0, i2), () => {
    DA(t2, 0, 0, -0.4, r2, 0.055, { seed: 3901 + e4, layer: J.grain, color: `#9c876b`, radial: 6, cut: false }), t2.add(vk(0.08, 6, 4), { ...QM, color: `#b09a6a` }, K(0, r2 + 0.04, 0)), t2.add(yk(0.05, 0.22, 5), { ...QM, color: `#b09a6a` }, K(0, r2 + 0.08, 0));
    let i3 = r2 - 0.25;
    EA(t2, q(-0.55, i3, 0.05), q(0.55, i3, 0.05), 0.045, 0.045, XM);
    let a2 = n2 ? 1.6 : 2, o2 = [`#6a1412`, `#2c3a52`, `#5a3a1a`][e4], s2 = Ck(6, 10, (e5, t3) => {
      let r3 = (e5 - 0.5) * 1, o3 = i3 - 0.04 - t3 * a2;
      !n2 && t3 > 0.85 && (o3 += Math.abs(e5 - 0.5) < 0.18 ? (t3 - 0.85) * 2.2 : 0);
      let s3 = 0.08 + Math.sin(t3 * 3.2 + e5 * 1.5) * 0.06 * t3 + Math.sin(e5 * Math.PI * 3) * 0.015;
      return q(r3, o3, s3);
    });
    if (n2) {
      let e5 = s2.getAttribute(`position`), t3 = s2.index, n3 = [];
      for (let r3 = 0; r3 < t3.count; r3 += 3) {
        let o3 = t3.getX(r3), s3 = e5.getY(o3), c2 = e5.getX(o3), l2 = KO(c2 * 6, s3 * 4, 1, 7);
        s3 < i3 - a2 * 0.55 && l2 > 0.05 || Math.abs(c2) < 0.15 && Math.abs(s3 - (i3 - 0.9)) < 0.18 || n3.push(o3, t3.getX(r3 + 1), t3.getX(r3 + 2));
      }
      s2.setIndex(n3);
    }
    if (t2.add(s2, { layer: J.cloth, color: o2, moss: 0, sway: (e5) => Math.min(1, Math.max(0, (i3 - e5.y) / a2)) * 0.9, ao: true }), !n2) {
      for (let n3 of [1, -1]) {
        let r3 = PM(e4);
        for (let a3 of r3) {
          let r4 = new Vo(a3, 8);
          r4.deleteAttribute(`uv`), n3 < 0 && r4.scale(-1, 1, 1), t2.add(n3 > 0 ? r4 : r4.scale(1, 1, 1), { layer: J.FLAT, color: e4 === 0 ? `#c9a24a` : `#d8d2c0`, moss: 0, sway: 0.35 }, K(0, i3 - 0.8, 0.12 * (n3 > 0) + (n3 > 0 ? 0 : 0.03), 0, n3 > 0 ? 0 : Math.PI, 0));
        }
      }
      t2.add(Y(1, 0.09, 0.03, 0.01), { layer: J.cloth, color: `#b08a3a`, moss: 0 }, K(0, i3 - 0.12, 0.09));
    }
  }), VA(t2, K(), 0.5, 3, 3920 + e4, J.rock, `#bdb6aa`, 0.07), t2.build({ ao: 0.6, aoRadius: 0.4 });
}
function IM(e4) {
  let t2 = new VO(4e3 + e4);
  if (e4 === 0) DA(t2, 0, 0, -0.3, 2.15, 0.09, { seed: 4001, layer: J.bark, color: `#bcab94`, radial: 7 }), t2.group(K(0, 2.12, 0), () => {
    for (let e6 = 0; e6 < 5; e6 += 1) {
      let n2 = e6 / 5 * Math.PI * 2;
      X(t2, [q(Math.cos(n2) * 0.05, 0, Math.sin(n2) * 0.05), q(Math.cos(n2) * 0.13, 0.2, Math.sin(n2) * 0.13), q(Math.cos(n2) * 0.12, 0.28, Math.sin(n2) * 0.12)], 0.012, 3, QM);
    }
    let e5 = new Uo(0.125, 0.014, 3, 10);
    e5.deleteAttribute(`uv`), t2.add(e5, QM, K(0, 0.22, 0, Math.PI / 2, 0, 0));
  }), zA(t2, q(0, 2.28, 0), 1.25), OA(t2, q(0, 1.9, 0), q(0, 1, 0), 0.09, 2), VA(t2, K(), 0.4, 4, 4002, J.rock, `#bdb6aa`, 0.07);
  else {
    let e5 = 1.15;
    for (let n2 = 0; n2 < 3; n2 += 1) {
      let r2 = n2 / 3 * Math.PI * 2;
      X(t2, [q(Math.cos(r2) * 0.5, -0.05, Math.sin(r2) * 0.5), q(Math.cos(r2) * 0.22, e5 * 0.6, Math.sin(r2) * 0.22), q(Math.cos(r2) * 0.18, e5, Math.sin(r2) * 0.18)], 0.03, 4, QM), t2.add(yk(0.05, 0.08, 4), QM, K(Math.cos(r2) * 0.5, -0.05, Math.sin(r2) * 0.5));
    }
    BA(t2, q(0, e5 - 0.05, 0), 0.32, 5), jA(t2, K(0.35, 0, 0.3, 0, 0.7, 0.3), 1.1), jA(t2, K(-0.4, 0, 0.1, -0.2, -0.9, 0), 0.95), VA(t2, K(), 0.8, 5, 4003, J.rock, `#bdb6aa`, 0.07);
  }
  return t2.build({ ao: 0.7, aoRadius: 0.4 });
}
function LM() {
  let e4 = new VO(4100);
  wA(e4, q(0, -0.15, 0), q(0, 0.55, 0), 0.32, { seed: 4101, color: `#bcab94`, radial: 10 });
  let t2 = pk([q(-0.18, 0, -0.12), q(0.18, 0, -0.12), q(-0.18, 0, 0.12), q(0.18, 0, 0.12), q(-0.1, 0.18, -0.08), q(0.1, 0.18, -0.08), q(-0.1, 0.18, 0.08), q(0.1, 0.18, 0.08)]);
  e4.add(t2, { ...QM, color: `#7f7b78` }, K(0, 0.56, 0));
  let n2 = pk([q(-0.3, 0, -0.12), q(0.28, 0, -0.12), q(-0.3, 0, 0.12), q(0.28, 0, 0.12), q(-0.3, 0.12, -0.12), q(0.28, 0.12, -0.12), q(-0.3, 0.12, 0.12), q(0.28, 0.12, 0.12), q(0.55, 0.11, 0), q(0.45, 0.04, 0), q(-0.38, 0.12, 0.06), q(-0.38, 0.12, -0.06), q(-0.38, 0.05, 0)]);
  return e4.add(n2, { ...QM, color: `#9d9893` }, K(0, 0.74, 0)), e4.add(Y(0.56, 0.012, 0.22, 4e-3), { layer: J.iron, color: `#d8d6d2`, moss: 0 }, K(-0.01, 0.865, 0)), e4.group(K(0.05, 0.875, 0.05, 0, 0.6, 0), () => {
    X(e4, [q(0, 0.02, 0), q(0.42, 0.02, 0)], 0.018, 4, { layer: J.grain, color: `#8a7050` }), e4.add(Y(0.06, 0.06, 0.14, 0.01), QM, K(0, 0.03, 0));
  }), e4.group(K(0, 0, 0.45, 0, -0.4, 0), () => {
    X(e4, [q(-0.05, 0.02, 0), q(0.4, 0.04, 0.02)], 0.01, 3, QM), X(e4, [q(-0.05, 0.02, 0.03), q(0.4, 0.04, -0.01)], 0.01, 3, QM);
  }), e4.group(K(-0.65, 0, 0.3), () => {
    e4.add(Sk([[1e-3, 0], [0.2, 0], [0.24, 0.4], [0.22, 0.4]], 10), { layer: J.grain, color: `#9a8468` }), e4.add(_k(0.22, 0.22, 0.33, 0.34, 10), { layer: J.GLOSS, color: `#0b0c0d`, moss: 0 });
    for (let t3 of [0.08, 0.32]) {
      let n3 = new Uo(0.21 + t3 * 0.1, 0.012, 3, 12);
      n3.deleteAttribute(`uv`), e4.add(n3, QM, K(0, t3, 0, Math.PI / 2, 0, 0));
    }
  }), VA(e4, K(), 0.9, 6, 4110, J.rock, `#8f877c`, 0.06), e4.build({ ao: 0.8, aoRadius: 0.4 });
}
function RM() {
  let e4 = new VO(4200), t2 = { layer: J.rock, color: `#c9c0b2` };
  for (let n2 = 0; n2 < 3; n2 += 1) for (let r2 = 0; r2 < 4; r2 += 1) {
    let i2 = -0.75 + r2 * 0.5;
    e4.add(hk(0.5, 0.32, 1.25, 4201 + n2 * 7 + r2, 0.2), t2, K(i2, -0.05 + n2 * 0.32 + 0.16, 0, 0, 0, 0));
  }
  e4.add(Y(2.1, 0.14, 1.4, 0.04), { ...t2, color: `#b8ae9f` }, K(0, 0.98, 0)), e4.add(Y(1.1, 0.06, 0.8, 0.02), { layer: J.FLAT, color: `#1a120c`, moss: 0 }, K(0, 1.05, 0.05)), RA(e4, K(0, 1.06, 0.05), 0.42, 4210, 22, 3), e4.add(pk([q(-0.95, 0, -0.65), q(0.95, 0, -0.65), q(-0.95, 0, 0.55), q(0.95, 0, 0.55), q(-0.35, 0.95, -0.4), q(0.35, 0.95, -0.4), q(-0.35, 0.95, 0.05), q(0.35, 0.95, 0.05)]), { layer: J.stone, color: `#a89e90`, texScale: 1.2 }, K(0, 1.75, 0));
  for (let n2 of [-1, 1]) e4.add(Y(0.22, 0.8, 0.22, 0.03), t2, K(n2 * 0.9, 1.4, -0.55));
  for (let n2 = 0; n2 < 4; n2 += 1) e4.add(hk(0.72 - n2 * 0.03, 0.42, 0.52, 4220 + n2, 0.15), { ...t2, color: `#b5ab9c` }, K(0, 2.9 + n2 * 0.42, -0.18));
  e4.add(Y(0.8, 0.1, 0.6, 0.02), t2, K(0, 4.6, -0.18)), e4.add(Y(1.6, 0.05, 1, 0.02), { layer: J.FLAT, color: `#0e0b09`, moss: 0 }, K(0, 1.74, 0)), e4.group(K(-1.45, 0.75, 0.1, 0, 0, 0.12), () => {
    e4.add(pk([q(-0.15, 0, -0.35), q(-0.15, 0, 0.35), q(0.5, 0, -0.12), q(0.5, 0, 0.12)]).translate(0, 0.02, 0), XM), e4.add(pk([q(-0.15, 0, -0.35), q(-0.15, 0, 0.35), q(0.5, 0, -0.12), q(0.5, 0, 0.12)]).translate(0, 0.32, 0), XM), e4.add(pk([q(-0.1, 0.03, -0.3), q(-0.1, 0.03, 0.3), q(0.45, 0.03, -0.1), q(0.45, 0.03, 0.1), q(-0.05, 0.3, -0.27), q(-0.05, 0.3, 0.27), q(0.45, 0.3, -0.1), q(0.45, 0.3, 0.1), q(0, 0.17, -0.36), q(0, 0.17, 0.36)]), { layer: J.hide, color: `#7a5a3e` }), X(e4, [q(0.5, 0.17, 0), q(0.75, 0.2, 0)], 0.04, 5, QM), X(e4, [q(-0.15, 0.34, 0), q(-0.6, 0.6, 0)], 0.02, 4, XM);
  }), EA(e4, q(1.15, 1.6, -0.6), q(1.15, 1.6, 0.5), 0.06, 0.05, XM);
  for (let t3 = 0; t3 < 3; t3 += 1) X(e4, [q(1.15, 1.58, -0.4 + t3 * 0.35), q(1.17, 0.9, -0.38 + t3 * 0.35)], 0.012, 3, QM);
  return e4.add(Ek(4230, 0.55, 0.25, 0.45, 0.45, 1, 3), { layer: J.FLAT, color: `#141210`, moss: 0 }, K(1.45, 0.05, 0.75)), VA(e4, K(1.3, 0, 0.6), 0.6, 8, 4231, J.FLAT, `#1a1816`, 0.07), e4.group(K(0.2, 0, 1.15), () => {
    e4.add(Y(1.2, 0.45, 0.45, 0.03), XM, K(0, 0.22, 0)), e4.add(Y(1.08, 0.02, 0.33, 5e-3), { layer: J.GLOSS, color: `#0a0c0d`, moss: 0 }, K(0, 0.4, 0));
  }), e4.build({ ao: 0.85, aoRadius: 0.8 });
}
function zM(e4, t2, n2 = 0.55, r2 = 8, i2 = false) {
  e4.group(t2, () => {
    let t3 = new Uo(n2, 0.055, 4, 14, i2 ? Math.PI * 1.5 : Math.PI * 2);
    t3.deleteAttribute(`uv`), e4.add(t3, { layer: J.grain, color: `#a8916f` });
    let a2 = new Uo(n2 + 0.04, 0.02, 3, 14, i2 ? Math.PI * 1.5 : Math.PI * 2);
    a2.deleteAttribute(`uv`), e4.add(a2, { ...QM, color: `#8a837c` }), e4.add(_k(0.1, 0.1, -0.1, 0.1, 8).rotateX(Math.PI / 2), { layer: J.grain, color: `#9a8466` });
    for (let t4 = 0; t4 < r2; t4 += 1) {
      let a3 = t4 / r2 * Math.PI * 2;
      i2 && a3 > Math.PI * 1.5 || X(e4, [q(Math.cos(a3) * 0.08, Math.sin(a3) * 0.08, 0), q(Math.cos(a3) * (n2 - 0.03), Math.sin(a3) * (n2 - 0.03), 0)], 0.022, 3, { layer: J.grain, color: `#a8916f` });
    }
  });
}
function BM(e4, t2, n2) {
  let r2 = 2.3, i2 = 1.25, a2 = 0.72;
  for (let t3 = 0; t3 < 6; t3 += 1) TA(e4, K(-i2 / 2 + 0.1 + t3 * 0.21, a2, 0, Math.PI / 2, 0, 0), r2, 0.2, 0.05, { ...XM, color: t3 % 2 ? `#c4ad8e` : `#b49c7c` });
  for (let t3 of [-1, 1]) {
    for (let n3 = 0; n3 < 2; n3 += 1) TA(e4, K(t3 * (i2 / 2 + 0.02), a2 + 0.18 + n3 * 0.2, 0, Math.PI / 2, 0, 0), r2, 0.16, 0.04, { ...XM, color: `#b8a07e` });
    for (let n3 of [-r2 / 2 + 0.1, 0, r2 / 2 - 0.1]) e4.add(Y(0.07, 0.55, 0.07, 0.015), XM, K(t3 * (i2 / 2 + 0.05), a2 + 0.22, n3));
  }
  X(e4, [q(-i2 / 2 - 0.3, 0.55, -0.2), q(i2 / 2 + 0.3, 0.55, -0.2)], 0.05, 6, { layer: J.grain, color: `#8f7a5e` });
  for (let t3 of [-1, 1]) zM(e4, K(t3 * (i2 / 2 + 0.25), 0.55, -0.2, 0, Math.PI / 2, 0), 0.55);
  for (let t3 of [-1, 1]) EA(e4, q(t3 * 0.4, a2 - 0.02, r2 / 2 - 0.2), q(t3 * 0.35, 0.05, r2 / 2 + 1.5), 0.08, 0.07, XM);
  if (t2) {
    for (let t4 of [-0.8, 0, 0.8]) {
      let n3 = [];
      for (let e5 = 0; e5 <= 8; e5 += 1) {
        let r3 = e5 / 8 * Math.PI;
        n3.push(q(Math.cos(r3) * i2 * 0.55, a2 + 0.4 + Math.sin(r3) * 0.75, t4));
      }
      X(e4, n3, 0.03, 4, { layer: J.grain, color: `#9a8466` });
    }
    let t3 = Ck(10, 6, (e5, t4) => {
      let n3 = Math.PI * e5, r3 = (t4 - 0.5) * 2, o2 = Math.abs(Math.sin(t4 * Math.PI * 2)) * 0.05;
      return q(Math.cos(n3) * (i2 * 0.57 - o2), a2 + 0.4 + Math.sin(n3) * (0.78 - o2), r3);
    });
    e4.add(t3, DM(`#bfb197`));
  }
  n2 && (LA(e4, K(-0.25, a2 + 0.03, -0.5, 0, 0.3, 0.1), 21, 0.6, true), LA(e4, K(0.3, a2 + 0.03, -0.6, 0, 1.3, 0), 22, 0.6, true), FA(e4, K(0.15, a2 + 0.03, 0.45, 0, 0.5, 0), 0.75, 0.27), IA(e4, K(-0.3, a2 + 0.03, 0.35, 0, 0.2, 0), 0.45, 23));
}
function VM(e4) {
  let t2 = new VO(4300 + e4);
  return BM(t2, e4 === 1, e4 === 0), t2.build({ ao: 0.85, aoRadius: 0.6 });
}
function HM() {
  let e4 = new VO(4400);
  return e4.group(K(0, 0, 0, 0, 0.3, 0.42).multiply(K(0.35, -0.25, 0)), () => {
    let t2 = 2.3, n2 = 1.25, r2 = 0.72;
    for (let i2 = 0; i2 < 6; i2 += 1) i2 !== 4 && TA(e4, K(-n2 / 2 + 0.1 + i2 * 0.21, r2, 0, Math.PI / 2, 0, 0), t2 - (i2 === 5 ? 0.6 : 0), 0.2, 0.05, { ...ZM, color: `#b8ab98` });
    for (let i2 of [-1, 1]) TA(e4, K(i2 * (n2 / 2 + 0.02), r2 + 0.18, 0, Math.PI / 2, 0, 0), t2, 0.16, 0.04, { ...ZM });
    X(e4, [q(-n2 / 2 - 0.3, 0.55, -0.2), q(n2 / 2 + 0.3, 0.55, -0.2)], 0.05, 6, { layer: J.grain, color: `#8f7a5e` }), zM(e4, K(n2 / 2 + 0.25, 0.55, -0.2, 0, Math.PI / 2, 0), 0.55);
  }), zM(e4, K(-1.3, 0.06, 0.6, Math.PI / 2, 0, 0.1), 0.55, 8, true), TA(e4, K(0.9, 0.05, 1.1, Math.PI / 2, 0.8, 0), 1.2, 0.2, 0.05, ZM), TA(e4, K(-0.4, 0.04, 1.4, Math.PI / 2, -0.4, 0.1), 0.9, 0.2, 0.05, ZM), LA(e4, K(1.2, 0, -0.6, 0, 0.8, 0), 31, 0.6, true), IA(e4, K(-0.9, 0, -1, 0.1, 0.5, 0.3), 0.55, 32, { broken: true }), e4.add(Ek(4401, 0.6, 0.06, 0.4, 0.5, 1), { layer: J.thatch, color: HA.thatch, moss: 0 }, K(1, 0, -0.1)), VA(e4, K(), 1.8, 8, 4402, J.rock, `#bdb6aa`, 0.08), e4.build({ ao: 0.85, aoRadius: 0.6 });
}
function UM(e4) {
  let t2 = new VO(4500 + e4), n2 = 2.3, r2 = 0.95;
  t2.add(Y(n2, 0.08, r2, 0.02), XM, K(0, 1, 0));
  for (let e5 = 0; e5 < 6; e5 += 1) TA(t2, K(-n2 / 2 + 0.2 + e5 * 0.38, 0.5, r2 / 2 - 0.02, 0, 0, 0), 1, 0.36, 0.04, { ...XM, color: e5 % 2 ? `#bfa686` : `#ad9475` });
  for (let e5 of [-1, 1]) t2.add(Y(0.06, 1, r2 - 0.05, 0.015), XM, K(e5 * (n2 / 2 - 0.04), 0.5, 0));
  for (let e5 of [-1, 1]) DA(t2, e5 * (n2 / 2 + 0.05), -r2 / 2 - 0.05, -0.2, 2.45, 0.05, { seed: 4501 + e5, layer: J.deadwood, color: `#c8bca8`, radial: 6 }), DA(t2, e5 * (n2 / 2 + 0.05), r2 / 2 + 0.55, -0.2, 2, 0.05, { seed: 4503 + e5, layer: J.deadwood, color: `#c8bca8`, radial: 6 });
  let i2 = Ck(8, 4, (e5, t3) => {
    let i3 = (e5 - 0.5) * (n2 + 0.35), a3 = -r2 / 2 - 0.15 + t3 * (r2 + 0.95);
    return q(i3, 2.45 - t3 * 0.5 - Math.sin(e5 * Math.PI) * Math.sin(t3 * Math.PI) * 0.08, a3);
  });
  t2.add(i2, DM(e4 === 1 ? `#5a2a3a` : `#b0402e`, 0.08));
  let a2 = Ck(12, 1, (e5, t3) => q((e5 - 0.5) * (n2 + 0.35), 1.95 - t3 * (0.22 + Math.abs(Math.sin(e5 * Math.PI * 6)) * 0.06), r2 / 2 + 0.81));
  if (t2.add(a2, DM(`#cbbd9c`, 0.12)), e4 === 0) {
    for (let e5 = 0; e5 < 4; e5 += 1) t2.add(Ek(4510 + e5, 0.16, 0.08, 0.1, 0.25, 1), { layer: J.FLAT, color: `#a87a44`, moss: 0 }, K(-0.8 + e5 * 0.25, 1.09, -0.15));
    for (let e5 = 0; e5 < 2; e5 += 1) t2.add(_k(0.15, 0.15, 0, 0.12, 10), { layer: J.FLAT, color: `#d8b860`, moss: 0 }, K(0.25 + e5 * 0.32, 1.04, 0.1));
    t2.group(K(0.8, 1.04, -0.1), () => {
      t2.add(Sk([[1e-3, 0], [0.16, 0], [0.22, 0.18], [0.2, 0.18]], 10), { layer: J.thatch, color: `#a8925e` });
      for (let e5 = 0; e5 < 7; e5 += 1) t2.add(vk(0.055, 6, 4), { layer: J.GLOSS, color: e5 % 2 ? `#8a2018` : `#a8481a`, moss: 0 }, K(Math.cos(e5 * 2.3) * 0.1, 0.18, Math.sin(e5 * 2.3) * 0.1));
    }), LA(t2, K(-1.45, 0, 0.6, 0, 0.5, 0), 41, 0.65);
  } else {
    [`#9a1010`, `#9a1010`, `#1e3aa8`, `#9a1010`, `#1e3aa8`, `#5a8a20`, `#9a1010`, `#1e3aa8`].forEach((e5, n3) => {
      let r3 = -0.95 + n3 * 0.27, i3 = n3 % 3 == 0, a3 = i3 ? 0.28 : 0.2;
      t2.add(Sk([[1e-3, 0], [i3 ? 0.08 : 0.06, 0], [i3 ? 0.085 : 0.065, a3 * 0.5], [0.03, a3 * 0.8], [0.025, a3], [0.03, a3 + 0.02], [1e-3, a3 + 0.02]], 8), { layer: J.GLOSS, color: e5, emissive: 0.35, moss: 0 }, K(r3, 1.04, -0.1 + n3 % 2 * 0.18)), t2.add(_k(0.022, 0.022, a3, a3 + 0.05, 5), { layer: J.wood, color: `#9a8466` }, K(r3, 1.04, -0.1 + n3 % 2 * 0.18));
    });
    for (let e5 = 0; e5 < 6; e5 += 1) {
      let n3 = -1 + e5 * 0.4;
      X(t2, [q(n3, 2.35, -0.35), q(n3, 1.95, -0.33)], 4e-3, 3, { layer: J.thatch, color: HA.rope }), t2.add(Ek(4520 + e5, 0.07, 0.2, 0.07, 0.4, 1), { layer: J.FLAT, color: e5 % 2 ? `#5a6a38` : `#7b6a3e`, moss: 0, sway: 0.15 }, K(n3, 1.85, -0.33));
    }
    t2.add(Sk([[1e-3, 0], [0.14, 0], [0.18, 0.2], [0.12, 0.32], [0.14, 0.36], [1e-3, 0.36]], 10), { layer: J.plaster, color: `#a8704a` }, K(1.45, 0, 0.45));
  }
  return VA(t2, K(0, 0, 0.5), 1.8, 6, 4530 + e4, J.rock, `#bdb6aa`, 0.07), t2.build({ ao: 0.85, aoRadius: 0.6 });
}
function WM(e4) {
  let t2 = new VO(4600 + e4);
  if (e4 === 0) {
    for (let e6 of [-0.6, 0.6]) wA(t2, q(e6, -0.1, 0), q(e6, 0.32, 0), 0.17, { seed: 4601 + e6, color: `#bcab94`, radial: 8 });
    let e5 = _k(0.2, 0.2, -0.85, 0.85, 9, 1), n2 = e5.getAttribute(`position`);
    for (let e6 = 0; e6 < n2.count; e6 += 1) n2.getZ(e6) > 0.02 && n2.setZ(e6, 0.02);
    e5.computeVertexNormals(), t2.add(e5, { layer: J.bark, color: `#bcab94` }, K(0, 0.36, 0, Math.PI / 2, 0, Math.PI / 2).multiply(K(0, 0, 0))), t2.add(Y(1.7, 0.012, 0.36, 4e-3), { layer: J.grain, color: `#d6c2a2`, texScale: 1.5 }, K(0, 0.385, 0, 0, Math.PI / 2, 0).multiply(K(0, 0, 0, 0, Math.PI / 2, 0)));
  } else {
    TA(t2, K(0, 0.46, 0, 0, 0, Math.PI / 2), 1.8, 0.34, 0.07, XM);
    for (let e5 of [-0.7, 0.7]) {
      for (let n2 of [-0.12, 0.12]) t2.add(Y(0.08, 0.46, 0.08, 0.015), XM, K(e5, 0.21, n2, n2 * 0.6, 0, 0));
      t2.add(Y(0.06, 0.06, 0.32, 0.01), XM, K(e5, 0.15, 0));
    }
    EA(t2, q(-0.7, 0.15, 0), q(0.7, 0.15, 0), 0.05, 0.05, XM);
  }
  return t2.build({ ao: 0.75, aoRadius: 0.35 });
}
function GM(e4) {
  let t2 = new VO(4700 + e4), n2 = { layer: J.thatch, color: `#d8c8a0`, moss: 0.25, texScale: 1.4 };
  if (e4 === 0) {
    t2.add(hk(1.2, 0.55, 0.7, 4701, 0.6, 0.12), n2, K(0, 0.25, 0, 0, 0.1, 0)), t2.add(hk(1.1, 0.5, 0.65, 4702, 0.6, 0.12), n2, K(0.1, 0.77, 0.05, 0, -0.2, 0));
    for (let e5 of [-0.3, 0.3]) {
      let n3 = new Uo(0.42, 0.012, 3, 12);
      n3.deleteAttribute(`uv`), t2.add(n3, { layer: J.thatch, color: HA.rope }, K(e5, 0.25, 0, 0, Math.PI / 2 + 0.1, 0, 1, 0.75, 1));
    }
  } else {
    let e5 = _k(0.62, 0.62, -0.62, 0.62, 14, 3);
    t2.add(e5, n2, K(0, 0.6, 0, 0, 0, Math.PI / 2)), t2.add(Ek(4710, 0.7, 0.1, 0.5, 0.6, 1), n2, K(0.6, 0, 0.6));
  }
  return VA(t2, K(), 1, 8, 4720 + e4, J.thatch, `#cbb88a`, 0.06), t2.build({ ao: 0.8, aoRadius: 0.5 });
}
function KM(e4) {
  let t2 = new VO(4800 + e4);
  t2.add(((e5, t3, n2) => Ck(5, 7, (r2, i2) => {
    let a2 = (r2 - 0.5) * t3, o2 = Math.min(r2, 1 - r2) * 2, s2 = 0.025 + Math.min(1, o2 * 3) * 0.07 + KO(r2 * 3, i2 * 4, n2) * 0.035;
    return q(a2 + Math.sin(i2 * 6 + n2) * 0.02, s2, -e5 / 2 + i2 * e5);
  }, true))(1.8, 0.9, 1), { layer: J.hide, color: e4 === 0 ? `#8a6a50` : `#6a5a48`, moss: 0 }), t2.add(_k(0.17, 0.17, -0.47, 0.47, 9, 1), { layer: J.cloth, color: e4 === 0 ? `#7a3a2a` : `#4a5260`, moss: 0 }, K(0, 0.17, -0.82, 0, 0, Math.PI / 2));
  for (let e5 of [-0.25, 0.25]) {
    let n2 = new Uo(0.175, 0.012, 3, 10);
    n2.deleteAttribute(`uv`), t2.add(n2, { layer: J.thatch, color: HA.rope }, K(e5, 0.17, -0.82, 0, Math.PI / 2, 0));
  }
  return e4 === 0 ? (t2.add(Ck(4, 4, (e5, t3) => q((e5 - 0.5) * 0.85 + KO(e5 * 3, t3 * 3, 3) * 0.04, 0.12 + Math.sin(e5 * Math.PI) * 0.06 + KO(e5 * 4, t3 * 4, 4) * 0.03, 0.05 + t3 * 0.7)), { layer: J.hide, color: `#b8a080`, moss: 0 }, K(0.05, 0, 0, 0, 0.15, 0)), LA(t2, K(0.55, 0, 0.7, 0, 0.8, 0), 51, 0.45)) : (LA(t2, K(-0.6, 0, 0.6, 0, 1.4, 0.1), 52, 0.5, true), t2.add(Sk([[1e-3, 0], [0.08, 0], [0.09, 0.12], [0.05, 0.16], [1e-3, 0.16]], 8), { layer: J.plaster, color: `#8a5a3a` }, K(0.55, 0, 0.75))), t2.build({ ao: 0.6, aoRadius: 0.3 });
}
function qM() {
  let e4 = new VO(4900), t2 = new Id(4900);
  return [4, 3, 2].forEach((n2, r2) => {
    for (let i2 = 0; i2 < n2; i2 += 1) {
      let a2 = (i2 - (n2 - 1) / 2) * 0.38, o2 = 0.17 + r2 * 0.31, s2 = t2.range(1.3, 1.6), c2 = t2.range(-0.1, 0.1);
      wA(e4, q(a2, o2, -s2 / 2 + c2), q(a2 + t2.range(-0.03, 0.03), o2, s2 / 2 + c2), 0.17 + t2.range(-0.02, 0.02), { seed: 4910 + r2 * 7 + i2, color: `#c0ae95`, radial: 7 });
    }
  }), wA(e4, q(1.25, -0.1, 0.4), q(1.25, 0.48, 0.4), 0.3, { seed: 4920, color: `#bcab94`, radial: 10 }), e4.group(K(1.25, 0.5, 0.4, 0, 0.5, -0.5), () => {
    X(e4, [q(0, -0.05, 0), q(0, 0.75, 0)], 0.025, 5, { layer: J.grain, color: `#a8916f` }), e4.add(pk([q(-0.02, -0.06, -0.12), q(0.02, -0.06, -0.12), q(-0.02, 0.06, -0.12), q(0.02, 0.06, -0.12), q(0, -0.13, 0.14), q(0, 0.13, 0.14), q(-3e-3, -0.13, 0.15), q(3e-3, 0.13, 0.15)]), { ...QM, color: `#bdb8b0` }, K(0, 0.02, 0));
  }), VA(e4, K(0.9, 0, 0.6), 0.8, 9, 4930, J.wood, `#d8c09a`, 0.05), e4.build({ ao: 0.85, aoRadius: 0.5 });
}
function JM(e4) {
  let t2 = new VO(5e3 + e4), n2 = 2.2;
  DA(t2, 0, -n2 / 2, -0.3, 1.2, 0.08, { seed: 5001 + e4, layer: J.deadwood, color: `#cdc4b5`, gain: 1.05, lean: e4 === 1 ? [0.12, 0.05] : [0, 0], radial: 6 });
  let r2 = (e5, r3, i2 = n2 / 2 + 0.1) => wA(t2, q(0.04, e5, -n2 / 2 - 0.05), q(0.04, r3, i2), 0.055, { seed: 5010 + e5 * 10, layer: J.deadwood, color: `#c9bfae`, radial: 5, ends: true, capColor: `#d6c4a6` });
  return r2(0.45, 0.42), e4 === 0 ? r2(0.95, 0.98) : (r2(0.95, 0.85, 0), wA(t2, q(0.3, 0.05, 0.3), q(0.6, 0.06, 1.2), 0.05, { seed: 5021, layer: J.deadwood, color: `#c9bfae`, radial: 5 })), OA(t2, q(0.04, 0.95, -n2 / 2), q(0, 1, 0), 0.085, 2), VA(t2, K(0, 0, -n2 / 2), 0.4, 3, 5030 + e4, J.rock, `#bdb6aa`, 0.06), t2.build({ ao: 0.6, aoRadius: 0.35 });
}
function YM(e4) {
  let t2 = new VO(5100 + e4);
  DA(t2, 0, 0, -0.35, 2.15, 0.06, { seed: 5101, layer: J.deadwood, color: `#c9bfae`, radial: 6 }), EA(t2, q(-0.85, 1.6, 0), q(0.85, 1.62, 0), 0.06, 0.06, { ...ZM }), OA(t2, q(0, 1.6, 0), q(1, 0, 0), 0.06, 2);
  let n2 = e4 === 0 ? `#5a4a36` : `#3a3530`, r2 = Ck(10, 6, (t3, n3) => {
    let r3 = t3 * Math.PI * 2, i2 = 0.2 + n3 * 0.08 + KO(t3 * 5, n3 * 3, e4) * 0.03;
    return q(Math.cos(r3) * i2, 1.62 - n3 * 0.95 - (Math.sin(r3 * 3) * 0.05 + 0.05) * n3, Math.sin(r3) * i2 * 0.7);
  }, true, true);
  t2.add(r2, { layer: J.cloth, color: n2, moss: 0, sway: (e5) => Math.max(0, (1.62 - e5.y) / 0.95) * 0.5 });
  for (let e5 of [-1, 1]) {
    let r3 = Ck(6, 4, (t3, n3) => {
      let r4 = t3 * Math.PI * 2, i2 = e5 * (0.15 + n3 * 0.6), a2 = 0.09 + n3 * 0.03;
      return q(i2, 1.6 + Math.cos(r4) * a2 - n3 * 0.04, Math.sin(r4) * a2);
    }, true, true);
    t2.add(r3, { layer: J.cloth, color: n2, moss: 0, sway: 0.3 });
    for (let n3 = 0; n3 < 4; n3 += 1) X(t2, [q(e5 * 0.78, 1.6, (n3 - 1.5) * 0.04), q(e5 * (0.88 + n3 * 0.02), 1.5 - n3 * 0.03, (n3 - 1.5) * 0.06)], 8e-3, 3, { layer: J.thatch, color: `#d8c48e`, moss: 0, sway: 0.5 });
  }
  if (t2.add(Ek(5110 + e4, 0.17, 0.2, 0.16, 0.15, 1), { layer: J.canvas, color: `#b8a682`, moss: 0 }, K(0, 1.88, 0.02)), e4 === 0) {
    for (let e5 of [-1, 1]) t2.add(vk(0.025, 5, 4), { layer: J.FLAT, color: `#0e0b08`, moss: 0, ao: false }, K(e5 * 0.06, 1.92, 0.16));
    X(t2, [q(-0.07, 1.8, 0.15), q(0, 1.78, 0.17), q(0.07, 1.8, 0.15)], 8e-3, 3, { layer: J.FLAT, color: `#1a120c`, moss: 0 }), t2.add(Sk([[1e-3, 0.12], [0.1, 0.1], [0.14, 0.02], [0.3, 0], [0.32, -0.03], [1e-3, -0.02]], 12), { layer: J.hide, color: `#4a3a2a` }, K(0, 2.02, 0, 0.1, 0, 0.15));
  } else {
    t2.add(Ck(8, 4, (e5, t3) => {
      let n3 = (e5 - 0.5) * Math.PI * 1.6 + Math.PI, r3 = 0.22 - t3 * 0.05;
      return q(Math.sin(n3) * r3, 2.12 - t3 * 0.4, -Math.cos(n3) * r3 - 0.02);
    }), { layer: J.cloth, color: `#2a2622`, moss: 0, sway: 0.2 });
    for (let e5 of [-1, 1]) t2.add(vk(0.022, 5, 4), { layer: J.FLAT, color: `#ff7a2a`, emissive: 1.6, moss: 0, ao: false }, K(e5 * 0.055, 1.92, 0.16));
    t2.group(K(0.62, 1.66, 0, 0, -0.8, 0), () => {
      t2.add(Ek(5120, 0.07, 0.07, 0.12, 0.15, 1), { layer: J.FLAT, color: `#0e0e10`, moss: 0 }, K(0, 0.09, 0)), t2.add(vk(0.045, 6, 4), { layer: J.FLAT, color: `#0e0e10`, moss: 0 }, K(0, 0.16, 0.09)), t2.add(yk(0.015, 0.06, 4), { layer: J.FLAT, color: `#3a3020`, moss: 0 }, K(0, 0.16, 0.12, Math.PI / 2, 0, 0)), t2.add(pk([q(-0.04, 0.05, -0.08), q(0.04, 0.05, -0.08), q(0, 0.08, -0.22)]), { layer: J.FLAT, color: `#0e0e10`, moss: 0 });
    });
  }
  return t2.add(Ek(5130 + e4, 0.35, 0.06, 0.35, 0.5, 1), { layer: J.thatch, color: `#cbb88a`, moss: 0 }, K(0, 0, 0)), t2.build({ ao: 0.7, aoRadius: 0.4 });
}
var XM, ZM, QM, $M, eN = t((() => {
  Ed(), UO(), kk(), UA(), ZO(), XM = { layer: J.grain, color: `#d8c6aa` }, ZM = { layer: J.deadwood, color: `#c9bfae` }, QM = { layer: J.iron, color: `#a9a39c`, moss: 0 }, $M = { palisade: { variants: 3, build: wM }, palisadeTower: { variants: 2, build: TM, fire: (e4) => e4 === 0 ? [q(-0.7, 3.55, -0.7)] : [] }, gateArch: { variants: 2, build: EM, fire: (e4) => e4 === 1 ? [q(0.7, 2.42, 0)] : [] }, tent: { variants: 2, build: OM }, bigTent: { variants: 1, build: kM, fire: () => [q(1, 0.25, 0.9)] }, barrelProp: { variants: 3, build: AM }, crate: { variants: 3, build: jM }, sack: { variants: 3, build: MM }, weaponRack: { variants: 2, build: NM }, banner: { variants: 3, build: FM }, torchPost: { variants: 2, build: IM, fire: (e4) => e4 === 0 ? [q(0, 2.42, 0)] : [q(0, 1.3, 0)] }, anvil: { variants: 1, build: LM }, forge: { variants: 1, build: RM, fire: () => [q(0, 1.15, 0.05)] }, cart: { variants: 2, build: VM }, brokenCart: { variants: 1, build: HM }, stall: { variants: 2, build: UM }, bench: { variants: 2, build: WM }, hayBale: { variants: 2, build: GM }, bedroll: { variants: 2, build: KM, shadow: false }, logPile: { variants: 1, build: qM }, woodFence: { variants: 2, build: JM }, scarecrow: { variants: 2, build: YM } };
}));
function tN(e4, t2, n2, r2, i2) {
  let a2 = Ek(i2, r2, 0.02, r2 * 0.7, 0.5, 1, 2.2);
  e4.add(a2, hN, K(t2, 0, n2));
}
function nN(e4, t2, n2, r2, i2, a2) {
  let o2 = Ck(1, 4, (e5, t3) => q((e5 - 0.5) * r2 * (1 - t3 * 0.5), -t3 * n2, Math.sin(t3 * 3 + i2) * 0.04 * t3));
  e4.add(o2, { layer: J.cloth, color: a2, moss: 0, sway: (e5) => Math.min(1, Math.max(0.2, (t2.y - e5.y) / n2)) * 0.8 }, K(t2.x, t2.y, t2.z, 0, i2));
}
function rN(e4) {
  let t2 = new VO(6e3 + e4), n2 = (e5, t3, n3) => {
    let r2 = KO(e5.x * 4, e5.y * 2.5, e5.z * 4, 61);
    r2 > 0.25 && n3.lerp(new P(`#5a0e0a`), Math.min(1, (r2 - 0.25) * 3) * 0.8);
  };
  if (e4 === 0) {
    DA(t2, 0, 0, -0.4, 2.3, 0.17, { seed: 6001, layer: J.deadwood, color: `#b8ac98`, paint: n2, radial: 8 });
    for (let e5 of [0.9, 1.35, 1.8]) {
      let n3 = new Uo(0.175, 0.03, 4, 10);
      n3.deleteAttribute(`uv`), t2.add(n3, { layer: J.deadwood, color: `#8a7e6c` }, K(0, e5, 0, Math.PI / 2, 0, 0));
    }
    jA(t2, K(0, 2.28, 0, -0.1, 0, 0), 2.1, { horns: true }), wA(t2, q(-0.55, 1.95, 0.05), q(0.55, 1.97, 0.05), 0.045, { seed: 6002, layer: J.deadwood, color: `#a89c88`, radial: 5 }), OA(t2, q(0, 1.96, 0.05), q(1, 0, 0), 0.05, 2);
    for (let e5 = 0; e5 < 5; e5 += 1) {
      let n3 = -0.5 + e5 * 0.25, r2 = q(n3, 1.93, 0.05);
      X(t2, [r2, r2.clone().add(q(0, -0.35, 0))], 6e-3, 3, { layer: J.thatch, color: HA.rope, sway: 0.6 }), e5 % 2 == 0 ? MA(t2, q(n3, 1.58, 0.05), q(n3 + 0.02, 1.4, 0.06), 0.012) : nN(t2, q(n3, 1.6, 0.06), 0.4, 0.09, e5, e5 === 1 ? `#5a3a24` : `#3a2a20`);
    }
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let n3 = e5 * 2.1;
      t2.add(Tk(6010 + e5, 0.22, 0.18, 0.2, { detail: 1, cuts: 3 }), { layer: J.rock, color: `#bdb6aa` }, K(Math.cos(n3) * 0.3, 0, Math.sin(n3) * 0.3));
    }
  } else {
    for (let e5 = 0; e5 < 3; e5 += 1) {
      let n3 = e5 / 3 * Math.PI * 2;
      DA(t2, Math.cos(n3) * 0.55, Math.sin(n3) * 0.55, -0.2, 2.5, 0.05, { seed: 6020 + e5, layer: J.deadwood, color: `#b0a490`, lean: [-Math.cos(n3) * 0.62, -Math.sin(n3) * 0.62], point: 0.15, radial: 5 });
    }
    OA(t2, q(0, 2.05, 0), q(0, 1, 0), 0.08, 3), jA(t2, K(0, 2.2, 0.03, 0.2, 0, 0), 2.6, { horns: true, color: `#d8ccb0` });
    for (let e5 = 0; e5 < 4; e5 += 1) {
      let n3 = e5 * 1.7;
      nN(t2, q(Math.cos(n3) * 0.12, 2, Math.sin(n3) * 0.12), 0.7 + e5 * 0.12, 0.1, e5 + 3, e5 % 2 ? `#4a3020` : `#6a2a1a`);
    }
    jA(t2, K(0.1, 0, 0.1, -0.2, 0.7, 0.2), 1.2), t2.add(Ek(6031, 0.5, 0.05, 0.5, 0.4, 1), hN, K(0, 0, 0));
  }
  return t2.build({ ao: 0.75, aoRadius: 0.45 });
}
function iN(e4) {
  let t2 = new VO(6100 + e4), n2 = new Id(6100 + e4), r2 = (t3, n3, r3) => {
    let i2 = KO(t3.x * 1.8, t3.y * 1.8, t3.z * 1.8, 6101 + e4);
    i2 > 0.2 ? r3.multiplyScalar(0.72) : i2 < -0.3 && r3.lerp(new P(`#d8c0a0`), 0.3);
  };
  if (e4 === 0) {
    let e5 = 1.45, i2 = 2.5;
    for (let r3 = 0; r3 < 7; r3 += 1) {
      let a3 = r3 / 7 * Math.PI * 2 + n2.range(-0.1, 0.1), o3 = q(Math.cos(a3) * e5, -0.15, Math.sin(a3) * e5), s3 = q(-Math.cos(a3) * 0.25, i2 + 0.55, -Math.sin(a3) * 0.25);
      X(t2, [o3, o3.clone().lerp(s3, 0.5).add(q(n2.range(-0.05, 0.05), 0, n2.range(-0.05, 0.05))), s3], (e6) => 0.055 * (1 - e6 * 0.5), 5, { layer: J.deadwood, color: `#a89c88` }, { pointEnd: 0.05 });
    }
    let a2 = (e6) => {
      let t3 = e6 + Math.PI / 2;
      return t3 = Math.atan2(Math.sin(t3), Math.cos(t3)), Math.abs(t3) < 0.38;
    }, o2 = Ck(16, 5, (t3, n3) => {
      let r3 = t3 * Math.PI * 2, a3 = e5 * (1 - n3 * 0.86) * (1 + 0.05 * Math.sin(r3 * 7 + n3 * 3)) + 0.03;
      return q(Math.cos(r3) * a3, n3 * i2 * 0.92 + 0.02, Math.sin(r3) * a3);
    }, true, true), s2 = o2.getAttribute(`position`), c2 = o2.index, l2 = [];
    for (let e6 = 0; e6 < c2.count; e6 += 3) {
      let t3 = c2.getX(e6), n3 = c2.getX(e6 + 1), r3 = c2.getX(e6 + 2), i3 = (s2.getX(t3) + s2.getX(n3) + s2.getX(r3)) / 3, o3 = (s2.getZ(t3) + s2.getZ(n3) + s2.getZ(r3)) / 3, u2 = (s2.getY(t3) + s2.getY(n3) + s2.getY(r3)) / 3;
      a2(Math.atan2(o3, i3)) && u2 < 1.25 || l2.push(t3, n3, r3);
    }
    o2.setIndex(l2), t2.add(o2, { ...pN(`#b8987a`), paint: r2 });
    for (let n3 = 0; n3 < 4; n3 += 1) {
      let r3 = n3 / 4 * Math.PI * 2 + 0.9, a3 = [];
      for (let t3 = 0; t3 <= 4; t3 += 1) {
        let n4 = t3 / 4, o3 = e5 * (1 - n4 * 0.86) + 0.05;
        a3.push(q(Math.cos(r3) * o3, n4 * i2 * 0.92 + 0.02, Math.sin(r3) * o3));
      }
      X(t2, a3, 0.012, 3, { layer: J.FLAT, color: `#2a1e14`, moss: 0 });
    }
    t2.add(_k(e5 * 0.9, e5 * 0.92, 0, 0.02, 12), { layer: J.FLAT, color: `#100c09`, moss: 0 }), jA(t2, K(0, 1.5, -e5 * 0.62, 0.2, Math.PI, 0), 1), X(t2, [q(0, 1.85, -e5 * 0.55), q(0, 1.72, -e5 * 0.62)], 8e-3, 3, { layer: J.thatch, color: HA.rope });
  } else {
    let e5 = 2.8, n3 = 1.85, i2 = -0.55;
    for (let r3 of [-e5 / 2, e5 / 2]) X(t2, [q(r3, -0.15, i2 - 0.35), q(r3 * 0.98, n3 + 0.35, i2 + 0.05)], 0.06, 5, { layer: J.deadwood, color: `#a89c88` }, { pointEnd: 0.08 }), X(t2, [q(r3, -0.15, i2 + 0.45), q(r3 * 0.98, n3 + 0.3, i2 - 0.1)], 0.055, 5, { layer: J.deadwood, color: `#a89c88` }, { pointEnd: 0.08 });
    wA(t2, q(-e5 / 2 - 0.25, n3, i2), q(e5 / 2 + 0.25, n3 + 0.05, i2), 0.06, { seed: 6160, layer: J.deadwood, color: `#a89c88`, radial: 5 });
    for (let r3 = 0; r3 < 5; r3 += 1) {
      let a3 = (r3 / 4 - 0.5) * (e5 - 0.2);
      X(t2, [q(a3, n3 + 0.08, i2 - 0.05), q(a3 + 0.05, 0.9, 0.55), q(a3 + 0.08, -0.12, 1.55)], (e6) => 0.045 * (1 - e6 * 0.3), 4, { layer: J.bone, color: `#d6cab0` }, { pointEnd: 0.06 });
    }
    let a2 = Ck(8, 5, (t3, r3) => {
      let a3 = (t3 - 0.5) * (e5 + 0.1), o2 = Math.sin(t3 * Math.PI * 4) * 0.05 + Math.sin(r3 * Math.PI) * 0.12;
      return q(a3, n3 + 0.1 - r3 * (n3 + 0.08) + Math.sin(r3 * Math.PI) * 0.05, i2 + r3 * 2.05 - o2 * 0.2);
    });
    t2.add(a2, { ...pN(`#a88a6a`), paint: r2 });
    for (let a3 of [-1, 1]) t2.add(Ck(3, 3, (t3, r3) => q(a3 * (e5 / 2 + 0.02), (1 - r3) * (n3 - 0.1) * (1 - t3 * 0.95), i2 + t3 * 1.9 * (1 - r3 * 0.3))), { ...pN(`#9a7a5a`), paint: r2 });
    t2.add(Ck(4, 4, (e6, t3) => q((e6 - 0.5) * 1.8, 0.03 + KO(e6 * 3, t3 * 3, 5) * 0.03, 0.9 - t3 * 1.4)), pN(`#6a5038`)), jA(t2, K(0, n3 + 0.05, i2 - 0.12, 0, Math.PI, 0), 1.3, { horns: true }), jA(t2, K(-0.9, 0, -1.2, 0, 2.6, 0.2), 1);
  }
  return VA(t2, K(), 1.8, 7, 6150 + e4, J.rock, `#bdb6aa`, 0.08), t2.build({ ao: 0.85, aoRadius: 0.7 });
}
function aN(e4) {
  let t2 = new VO(6200 + e4);
  return DA(t2, 0, 0, -0.35, e4 === 0 ? 1.9 : 2.2, 0.05, { seed: 6201 + e4, layer: J.deadwood, color: `#b0a490`, point: 0.22, radial: 5, lean: [0.06, -0.04] }), e4 === 0 ? (jA(t2, K(0.05, 1.58, -0.03, 0.15, 0.3, 0.05), 1.15), nN(t2, q(0.04, 1.5, 0), 0.5, 0.12, 2, `#4a3020`), t2.add(Ek(6211, 0.05, 0.25, 0.05, 0.3, 1), hN, K(0.05, 1.3, 0.04))) : (jA(t2, K(0.06, 1.85, -0.02, 0.1, -0.2, 0), 1.1, { horns: true }), jA(t2, K(0.04, 1.42, 0, 0.25, 0.5, 0.05), 0.95), jA(t2, K(0.02, 1.02, 0.01, -0.1, -0.6, 0), 0.9, { jaw: false })), jA(t2, K(0.25, 0, 0.2, -0.4, 1.2, 0.3), 0.9, { jaw: false }), VA(t2, K(), 0.4, 4, 6220 + e4, J.rock, `#bdb6aa`, 0.06), t2.build({ ao: 0.7, aoRadius: 0.35 });
}
function oN(e4) {
  let t2 = new VO(6300 + e4), n2 = new Id(6300 + e4), r2 = e4 === 0 ? 0.7 : 1, i2 = e4 === 0 ? 9 : 11;
  t2.add(Ek(6301 + e4, r2 * 0.8, 0.12, r2 * 0.7, 0.4, 1), { layer: J.dirt, color: `#8a7a64` }, K(0, -0.02, 0));
  for (let e5 = 0; e5 < i2; e5 += 1) {
    let e6 = n2.range(0, Math.PI * 2), i3 = Math.sqrt(n2.next()) * r2, a3 = 0.03 + (1 - i3 / r2) * 0.18 * n2.next(), o2 = n2.range(0, Math.PI * 2), s2 = n2.range(0.3, 0.55), c2 = q(Math.cos(e6) * i3, a3, Math.sin(e6) * i3);
    MA(t2, c2, c2.clone().add(q(Math.cos(o2) * s2, n2.range(-0.05, 0.12), Math.sin(o2) * s2)), n2.range(0.018, 0.026), n2.next() < 0.3 ? `#cdbf9e` : HA.bone);
  }
  let a2 = e4 === 0 ? 3 : 5;
  for (let i3 = 0; i3 < a2; i3 += 1) {
    let a3 = i3 * 2.39 + 0.4, o2 = n2.range(0.1, r2 * 0.8);
    jA(t2, K(Math.cos(a3) * o2, n2.range(0, 0.12), Math.sin(a3) * o2, n2.range(-0.4, 0.3), n2.range(0, 6.28), n2.range(-0.3, 0.3)), n2.range(0.9, 1.15), { jaw: i3 % 2 == 0, horns: e4 === 1 && i3 === 0 });
  }
  return e4 === 1 && (PA(t2, K(0.4, 0.05, -0.3, 0.3, 0.8, 0.4), 1.2), PA(t2, K(-0.5, 0, 0.35, 0, 2.2, 1.4), 1), tN(t2, 0.1, 0.1, 0.9, 6330)), t2.build({ ao: 0.75, aoRadius: 0.35 });
}
function sN(e4, t2, n2) {
  let r2 = n2.skin ?? `#8a7462`;
  e4.group(t2, () => {
    let t3 = Sk([[1e-3, 0], [0.16, 0.02], [0.2, 0.2], [0.19, 0.45], [0.22, 0.55], [0.14, 0.62], [1e-3, 0.64]], 9);
    if (e4.add(t3, { layer: J.cloth, color: n2.cloth, moss: 0 }, K(0, 0.13, -0.05, Math.PI / 2, 0, 0, 1, 1, 0.62)), n2.armor) {
      e4.add(vk(0.21, 9, 6).scale(1, 0.55, 1.25), { ...mN, color: `#9a948c` }, K(0, 0.2, 0.32));
      for (let t4 of [-1, 1]) e4.add(vk(0.1, 6, 4).scale(1.2, 0.6, 1), { ...mN, color: `#9a948c` }, K(t4 * 0.24, 0.17, 0.5));
    }
    n2.helm ? (e4.add(vk(0.115, 8, 6), { ...mN, color: `#8a847c` }, K(0.02, 0.13, 0.72)), e4.add(Y(0.2, 0.03, 0.06, 0.01), { ...mN, color: `#6a645c` }, K(0.02, 0.17, 0.82))) : e4.add(vk(0.1, 8, 6), { layer: J.FLAT, color: r2, moss: 0 }, K(0.02, 0.12, 0.72)), X(e4, [q(-0.22, 0.14, 0.52), q(-0.45, 0.08, 0.3), q(-0.62, 0.05, 0.12)], [0.055, 0.05, 0.045], 6, { layer: J.cloth, color: n2.cloth, moss: 0 }), X(e4, [q(0.22, 0.14, 0.52), q(0.38, 0.1, 0.75), q(0.5, 0.05, 1)], [0.055, 0.05, 0.045], 6, { layer: J.cloth, color: n2.cloth, moss: 0 }), e4.add(vk(0.045, 5, 4), { layer: J.FLAT, color: r2, moss: 0 }, K(-0.65, 0.04, 0.08)), e4.add(vk(0.045, 5, 4), { layer: J.FLAT, color: r2, moss: 0 }, K(0.52, 0.04, 1.04));
    for (let t4 of [-1, 1]) X(e4, [q(t4 * 0.1, 0.12, -0.08), q(t4 * 0.2, 0.09, -0.45), q(t4 * 0.32, 0.07, -0.85)], [0.07, 0.06, 0.05], 6, { layer: J.hide, color: `#4a3a2c`, moss: 0 }), e4.add(Y(0.1, 0.1, 0.2, 0.03), { layer: J.hide, color: `#2e241a`, moss: 0 }, K(t4 * 0.34, 0.06, -0.92, 0, t4 * 0.2, 0));
  });
}
function cN(e4) {
  let t2 = new VO(6400 + e4);
  if (e4 === 0) tN(t2, 0.1, 0.2, 0.75, 6401), sN(t2, K(0, 0, 0, 0, 0.4, 0), { cloth: `#5a3a2a`, armor: true, helm: true }), t2.add(pk([q(-0.03, 0, -5e-3), q(0.03, 0, -5e-3), q(-0.03, 0, 5e-3), q(0.03, 0, 5e-3), q(0, 0.85, 0)]), { ...mN, color: `#c8c4bc` }, K(0.75, 0.03, 0.3, Math.PI / 2, 0.9, 0)), t2.add(Y(0.2, 0.03, 0.04, 0.01), { ...mN, color: `#7a6a4a` }, K(0.75, 0.03, 0.3, 0, 0.9 + Math.PI / 2, 0)), t2.add(_k(0.34, 0.34, 0, 0.05, 12), { layer: J.wood, color: `#7a3a28` }, K(-0.7, 0.05, -0.5, 0.2, 0, 0.1));
  else if (e4 === 1) {
    PA(t2, K(0, 0.1, 0.15, 0, 0, 0), 1), jA(t2, K(0.05, 0.02, 0.62, -1.2, 0.3, 0.2), 1);
    for (let e6 of [-1, 1]) MA(t2, q(e6 * 0.08, 0.04, -0.2), q(e6 * 0.2, 0.04, -0.62), 0.024), MA(t2, q(e6 * 0.2, 0.04, -0.64), q(e6 * 0.28, 0.03, -1), 0.02), MA(t2, q(e6 * 0.15, 0.06, 0.38), q(e6 * 0.45, 0.04, 0.2), 0.018);
    t2.add(Sk([[1e-3, 0], [0.1, 0.02], [0.14, 0.06], [1e-3, 0.08]], 8), { layer: J.bone, color: HA.bone }, K(0, 0.03, -0.18, 0, 0, 0, 1.6, 1, 1));
    let e5 = Ck(4, 4, (e6, t3) => q((e6 - 0.5) * 0.7 + KO(e6 * 3, t3 * 3, 1) * 0.06, 0.05 + KO(e6 * 4, t3 * 4, 2) * 0.04 + Math.sin(e6 * Math.PI) * 0.05, -0.5 + t3 * 0.9));
    t2.add(e5, { layer: J.cloth, color: `#4a4034`, moss: 0 }), t2.add(pk([q(-0.025, 0, -4e-3), q(0.025, 0, -4e-3), q(-0.025, 0, 4e-3), q(0.025, 0, 4e-3), q(0, 0.7, 0)]), { ...mN, color: `#8a5a3a` }, K(-0.5, 0.03, 0.4, Math.PI / 2, -0.6, 0));
  } else {
    tN(t2, -0.1, 0, 0.6, 6421), sN(t2, K(0, 0, 0, 0, -0.8, Math.PI).multiply(K(0, -0.25, 0)), { cloth: `#3a3a42`, armor: false, helm: false });
    let e5 = Ck(5, 5, (e6, t3) => q((e6 - 0.5) * 0.9 + KO(e6 * 3, t3 * 3, 3) * 0.06, 0.12 + Math.sin(e6 * Math.PI) * 0.12 * (1 - t3) + KO(e6 * 4, t3 * 4, 4) * 0.03, 0.55 - t3 * 1));
    t2.add(e5, { layer: J.cloth, color: `#2a3040`, moss: 0 }, K(0, 0, 0, 0, -0.8, 0));
    for (let e6 = 0; e6 < 3; e6 += 1) {
      let n2 = q(-0.1 + e6 * 0.12, 0.2, -0.1 + e6 * 0.15), r2 = q(0.2, 0.9, -0.3 + e6 * 0.2).normalize();
      X(t2, [n2, n2.clone().addScaledVector(r2, 0.6)], 8e-3, 3, { layer: J.grain, color: `#a8916f` }), t2.add(pk([q(-0.04, 0, 0), q(0.04, 0, 0), q(0, 0.1, 5e-3), q(0, 0.1, -5e-3)]), { layer: J.FLAT, color: `#d8d0c0`, moss: 0 }, new wr().compose(n2.clone().addScaledVector(r2, 0.5), new ir().setFromUnitVectors(q(0, 1, 0), r2), q(1, 1, 1)));
    }
  }
  return t2.build({ ao: 0.7, aoRadius: 0.3 });
}
function lN() {
  let e4 = new VO(6500);
  DA(e4, -1, 0, -0.4, 3.4, 0.13, { seed: 6501, layer: J.deadwood, color: `#b0a490`, radial: 7 }), wA(e4, q(-1.15, 3.25, 0), q(0.35, 3.3, 0), 0.1, { seed: 6502, layer: J.deadwood, color: `#b0a490`, radial: 6 }), wA(e4, q(-1, 2.45, 0), q(-0.35, 3.25, 0), 0.06, { seed: 6503, layer: J.deadwood, color: `#a89c88`, radial: 5 });
  for (let t2 = 0; t2 < 6; t2 += 1) {
    let n2 = new Uo(0.045, 0.012, 3, 6);
    n2.deleteAttribute(`uv`), e4.add(n2, mN, K(0.2, 3.2 - t2 * 0.075, 0, 0, t2 % 2 * Math.PI / 2, 0, 1, 1.4, 1));
  }
  return e4.group(K(0.2, 0.45, 0, 0, 0, 0.06), () => {
    let t2 = 0.42, n2 = 1.65;
    for (let r2 of [0, n2 * 0.5, n2]) {
      let n3 = new Uo(t2, 0.022, 3, 14);
      n3.deleteAttribute(`uv`), e4.add(n3, mN, K(0, r2, 0, Math.PI / 2, 0, 0));
    }
    for (let r2 = 0; r2 < 10; r2 += 1) {
      let i2 = r2 / 10 * Math.PI * 2, a2 = [q(Math.cos(i2) * t2, -0.05, Math.sin(i2) * t2), q(Math.cos(i2) * t2, n2, Math.sin(i2) * t2), q(Math.cos(i2) * t2 * 0.5, n2 + 0.28, Math.sin(i2) * t2 * 0.5), q(0, n2 + 0.36, 0)];
      r2 === 3 && (a2[1] = q(Math.cos(i2) * t2 * 1.15, n2 * 0.6, Math.sin(i2) * t2 * 1.15)), X(e4, a2, 0.014, 3, mN);
    }
    e4.add(_k(t2, t2, -0.05, -0.02, 10), mN), PA(e4, K(0, 0.45, 0, -1.2, 0, 0), 0.9), jA(e4, K(0.05, 0.85, 0.12, 0.6, 0.2, 0.2), 1), MA(e4, q(0.1, 0.05, 0), q(0.25, 0.45, 0.15), 0.02), MA(e4, q(-0.1, 0.05, 0.05), q(-0.25, 0.42, 0.18), 0.02);
  }), MA(e4, q(0.7, 0.03, 0.5), q(1.05, 0.03, 0.3), 0.022), jA(e4, K(0.9, 0, -0.4, -0.3, 2.2, 0.4), 1, { jaw: false }), VA(e4, K(), 1.2, 6, 6510, J.rock, `#bdb6aa`, 0.07), e4.build({ ao: 0.7, aoRadius: 0.5 });
}
function uN(e4) {
  let t2 = new VO(6600 + e4), n2 = { layer: J.FLAT, color: `#c9c9c4`, moss: 0, ao: false, occlude: false, emissive: 0.04, sway: 0.08 }, r2 = (e5, r3, i2 = 0.02) => {
    X(t2, [e5, e5.clone().lerp(r3, 0.5).add(q(0, -i2, 0)), r3], 65e-4, 3, n2);
  };
  if (e4 === 0) {
    let e5 = q(0, 0.32, 0), i2 = [];
    for (let e6 = 0; e6 < 8; e6 += 1) {
      let t3 = e6 / 8 * Math.PI * 2 + e6 % 2 * 0.15, n3 = 0.85 + e6 % 3 * 0.2;
      i2.push(q(Math.cos(t3) * n3, e6 % 3 == 0 ? 0.28 : 0.02, Math.sin(t3) * n3));
    }
    for (let t3 of i2) r2(e5, t3, 0.03);
    for (let t3 = 1; t3 <= 3; t3 += 1) {
      let n3 = t3 / 4;
      for (let t4 = 0; t4 < i2.length; t4 += 1) r2(e5.clone().lerp(i2[t4], n3), e5.clone().lerp(i2[(t4 + 1) % i2.length], n3), 0.015);
    }
    for (let e6 = 0; e6 < 3; e6 += 1) {
      let n3 = e6 / 3 * Math.PI * 2;
      t2.add(Tk(6601 + e6, 0.18, 0.28, 0.16, { detail: 1, cuts: 3 }), { layer: J.caveRock, color: `#b8ae9c` }, K(Math.cos(n3) * 0.95, 0, Math.sin(n3) * 0.95));
    }
    jA(t2, K(0.1, 0, 0.1, -0.2, 0.5, 0), 1), t2.add(Ek(6610, 0.12, 0.3, 0.12, 0.25, 1), { ...n2, color: `#bcbab2`, emissive: 0.02 }, K(-0.45, 0.12, 0.35, 0, 0, 1.3));
  } else {
    DA(t2, -0.6, 0, -0.2, 1.7, 0.05, { seed: 6620, layer: J.deadwood, color: `#9a9080`, radial: 5, point: 0.1 }), t2.add(yk(0.22, 1.2, 7), { layer: J.caveRock, color: `#c8bdaa` }, K(0.65, -0.05, 0.1));
    let e5 = q(-0.6, 1.6, 0), n3 = q(0.62, 1.05, 0.1), i2 = [q(-0.5, 0, 0.3), q(0, 0, 0.4), q(0.5, 0, 0.3)], a2 = q(0, 0.8, 0.12);
    for (let t3 of [e5, n3, ...i2]) r2(a2, t3, 0.01);
    for (let t3 = 1; t3 <= 5; t3 += 1) {
      let o2 = t3 / 6, s2 = [e5, n3, i2[2], i2[1], i2[0]];
      for (let e6 = 0; e6 < s2.length; e6 += 1) r2(a2.clone().lerp(s2[e6], o2), a2.clone().lerp(s2[(e6 + 1) % s2.length], o2), 0.01);
    }
    r2(e5, n3, 0.15);
  }
  return t2.build({ ao: 0.4, aoRadius: 0.3 });
}
function dN() {
  let e4 = new VO(6700);
  for (let t2 = 0; t2 < 5; t2 += 1) {
    let n2 = t2 / 5 * Math.PI * 2;
    e4.add(Tk(6701 + t2, 0.2, 0.18, 0.18, { detail: 0, cuts: 3 }), { layer: J.caveRock, color: `#b8ae9c` }, K(Math.cos(n2) * 0.22, 0, Math.sin(n2) * 0.22, 0, n2));
  }
  return e4.add(Tk(6710, 0.16, 0.14, 0.15, { detail: 1, cuts: 3 }), { layer: J.caveRock, color: `#c2b8a6` }, K(0.05, 0.18, 0)), DA(e4, 0, 0, -0.2, 1.95, 0.05, { seed: 6711, layer: J.deadwood, color: `#a89c88`, radial: 6, lean: [0.05, 0.03] }), OA(e4, q(0.04, 1.7, 0.02), q(0, 1, 0), 0.055, 3, { color: `#8a6a44` }), zA(e4, q(0.05, 2.02, 0.03), 1.2), jA(e4, K(-0.2, 0, 0.3, -0.3, 0.6, 0.1), 0.9, { jaw: false }), e4.build({ ao: 0.7, aoRadius: 0.35 });
}
function fN() {
  let e4 = new VO(6800), t2 = new Id(6800);
  e4.add(Ek(6801, 2.4, 0.03, 2.4, 0.35, 2, 1.2), { layer: J.dirt, color: `#4a4038`, moss: 0 }, K(0, -0.015, 0));
  for (let t3 of [-1, 1]) {
    for (let n2 of [-1, 1]) X(e4, [q(t3 * 1.25, -0.1, n2 * 0.35), q(t3 * 1.05, 1.35, 0)], 0.035, 5, { layer: J.deadwood, color: `#9a8e7c` });
    OA(e4, q(t3 * 1.05, 1.3, 0), q(0, 1, 0), 0.05, 2);
  }
  X(e4, [q(-1.35, 1.32, 0), q(1.45, 1.32, 0)], 0.022, 4, { layer: J.deadwood, color: `#6a5e50` }), e4.group(K(0.1, 1.17, 0), () => {
    e4.add(Ek(6810, 0.32, 0.17, 0.2, 0.25, 1), { layer: J.FLAT, color: `#5a2a16`, moss: 0 }, K(0, 0, 0));
    for (let t3 of [-1, 1]) X(e4, [q(t3 * 0.2, -0.05, 0.08), q(t3 * 0.4, -0.18, 0.15)], 0.05, 5, { layer: J.FLAT, color: `#4a2412`, moss: 0 });
    X(e4, [q(-0.3, 0.02, 0), q(-0.42, 0.1, 0)], 0.04, 5, { layer: J.FLAT, color: `#4a2412`, moss: 0 });
  });
  for (let t3 = 0; t3 < 3; t3 += 1) {
    let n2 = t3 / 3 * Math.PI * 2 + 0.6, r2 = q(Math.cos(n2) * 2.4, 0.16, Math.sin(n2) * 2.4), i2 = q(-Math.sin(n2), 0, Math.cos(n2)).multiplyScalar(0.7);
    wA(e4, r2.clone().sub(i2), r2.clone().add(i2), 0.17, { seed: 6820 + t3, color: `#b0a08a`, radial: 7 });
  }
  for (let n2 = 0; n2 < 6; n2 += 1) {
    let n3 = t2.range(0, Math.PI * 2), r2 = t2.range(1.3, 2.6), i2 = q(Math.cos(n3) * r2, 0.03, Math.sin(n3) * r2), a2 = t2.range(0, Math.PI * 2);
    MA(e4, i2, i2.clone().add(q(Math.cos(a2) * 0.35, 0, Math.sin(a2) * 0.35)), 0.02);
  }
  return jA(e4, K(1.6, 0, -1.2, -0.3, 2, 0.2), 1), jA(e4, K(-1.9, 0, 0.6, 0.1, 0.4, -0.3), 0.9, { horns: true }), e4.add(Sk([[1e-3, 0], [0.15, 0], [0.22, 0.15], [0.18, 0.3], [0.13, 0.33], [0.15, 0.36], [0.12, 0.36]], 10), { layer: J.plaster, color: `#8a5a3a` }, K(-1.4, 0, -0.9, 0.1, 0, 0.2)), e4.build({ ao: 0.75, aoRadius: 0.5 });
}
var pN, mN, hN, gN, _N = t((() => {
  Ed(), UO(), kk(), UA(), ZO(), pN = (e4 = `#b49878`) => ({ layer: J.hide, color: e4, moss: 0.05, texScale: 1.2 }), mN = { layer: J.iron, color: `#8f8780`, moss: 0 }, hN = { layer: J.GLOSS, color: `#3a0404`, moss: 0, ao: false }, gN = { totem: { variants: 2, build: rN }, hideTent: { variants: 2, build: iN }, skullPike: { variants: 2, build: aN }, bonePile: { variants: 2, build: oN, shadow: false }, corpseProp: { variants: 3, build: cN, shadow: false }, cage: { variants: 1, build: lN }, webs: { variants: 2, build: uN, shadow: false }, wallTorch: { variants: 1, build: dN, fire: () => [q(0.05, 2.17, 0.03)] }, campfireRing: { variants: 1, build: fN, shadow: false } };
}));
function vN(e4, t2) {
  let n2 = wN[e4].variants;
  return Math.floor(Math.abs(t2 || 0)) % n2;
}
function yN(e4, t2 = 0) {
  let n2 = wN[e4];
  if (!n2) throw Error(`Unknown prop kind: ${e4}`);
  let r2 = vN(e4, t2), i2 = `${e4}:${r2}`, a2 = EN.get(i2);
  return a2 || (a2 = n2.build(r2), a2.name = i2, a2.userData.kind = e4, a2.userData.variant = r2, EN.set(i2, a2)), a2;
}
function bN(e4) {
  return wN[e4]?.shadow ?? true;
}
function xN(e4, t2 = 0) {
  let n2 = wN[e4];
  return n2?.fire ? n2.fire(vN(e4, t2)) : [];
}
function SN(e4, t2 = 0) {
  let n2 = wN[e4];
  return n2?.glow ? n2.glow(vN(e4, t2)) : [];
}
function CN() {
  for (let e4 of EN.values()) e4.dispose();
  EN.clear();
}
var wN, TN, EN, DN, ON = t((() => {
  tM(), SM(), eN(), _N(), wN = { ...eM, ...xM, ...$M, ...gN }, TN = Object.fromEntries(Object.entries(wN).map(([e4, t2]) => [e4, t2.variants])), EN = /* @__PURE__ */ new Map(), DN = Object.keys(wN);
})), kN = n({ ALL_PROP_KINDS: () => DN, LAYER: () => J, PROP_DEFS: () => wN, PROP_VARIANTS: () => TN, PropBuilder: () => VO, THEME_ENV: () => AN, along: () => MO, between: () => jO, buildCaveWalls: () => bA, buildObjectModel: () => Oj, buildPropGeometry: () => yN, castsShadow: () => bN, clearObjectCache: () => kj, clearPropCache: () => CN, getPropDepthMaterial: () => Jk, getPropFadeMaterial: () => Kk, getPropMaterial: () => Gk, getPropTextureArrays: () => Qk, mat: () => K, propFireAnchors: () => xN, propGlowAnchors: () => SN, propProvider: () => jN, setPropEnvironment: () => Xk, setPropFade: () => Zk, updatePropMaterial: () => Yk }), AN, jN, MN = t((() => {
  CA(), pA(), Ij(), ON(), UO(), AN = { moor: { wet: 0.55, moss: 1, mossTint: `#9aa585`, wind: 1, rim: 0.55 }, town: { wet: 0.4, moss: 0.6, mossTint: `#9a9f80`, wind: 0.8, rim: 0.5 }, fields: { wet: 0.35, moss: 0.7, mossTint: `#b0a878`, wind: 1.1, rim: 0.55 }, cave: { wet: 0.5, moss: 0.55, mossTint: `#7f9a86`, wind: 0, rim: 0.35 } }, jN = { geometry(e4, t2) {
    return yN(e4, t2);
  }, material() {
    return Gk();
  }, depthMaterial() {
    return Jk();
  }, fadeMaterial() {
    return Kk();
  }, castsShadow(e4) {
    return bN(e4);
  }, update(e4) {
    Yk(e4);
  }, object(e4, t2) {
    return Oj(e4, t2);
  }, caveWalls(e4, t2) {
    return bA(e4, t2);
  }, setEnvironment(e4, t2 = AN[e4].wet ?? 0.4) {
    Xk({ ...AN[e4], wet: e4 === `cave` ? AN.cave.wet : Math.min(1, 0.2 + t2 * 0.6) });
  }, setHero(e4, t2, n2 = 4.2) {
    Zk(e4, n2, t2);
  }, setFadeCoverage(e4) {
    qk(e4);
  }, fireAnchors: xN, glowAnchors: SN };
}));
function NN(e4) {
  let t2 = 2166136261;
  for (let n2 = 0; n2 < e4.length; n2++) t2 ^= e4.charCodeAt(n2), t2 = Math.imul(t2, 16777619);
  return t2 >>> 0;
}

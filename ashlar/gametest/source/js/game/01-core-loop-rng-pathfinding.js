// ===== game part 01-core-loop-rng-pathfinding (unpacked from Unhallowed.html; part of the single module, see js/manifest.json) =====
var kd = 1 / 25, Ad = class {
  tick;
  render;
  frameId = 0;
  last = 0;
  acc = 0;
  running = false;
  timeScale = 1;
  paused = false;
  constructor(e4, t2) {
    this.tick = e4, this.render = t2;
  }
  start() {
    this.running || (this.running = true, this.last = performance.now(), this.frameId = requestAnimationFrame(this.frame));
  }
  stop() {
    this.running = false, cancelAnimationFrame(this.frameId);
  }
  step(e4) {
    for (let t2 = 0; t2 < e4; t2 += 1) this.tick(kd);
  }
  frame = (e4) => {
    if (!this.running) return;
    let t2 = Math.max(0, Math.min((e4 - this.last) / 1e3, 0.1));
    if (this.last = e4, !this.paused) {
      this.acc += t2 * this.timeScale;
      let e5 = 0;
      for (; this.acc >= 0.04 && e5 < 5; ) this.tick(kd), this.acc -= kd, e5 += 1;
      e5 >= 5 && (this.acc = 0);
    }
    this.render(this.paused ? 1 : this.acc / kd, t2), this.frameId = requestAnimationFrame(this.frame);
  };
}, jd = class {
  canvas;
  pointer = { x: 0, y: 0, inside: false, leftDown: false, rightDown: false, leftPressed: false, rightPressed: false, leftReleased: false, rightReleased: false };
  shift = false;
  ctrl = false;
  alt = false;
  wheel = 0;
  keyQueue = [];
  held = /* @__PURE__ */ new Set();
  onFirstGesture = null;
  gestured = false;
  constructor(e4) {
    this.canvas = e4, e4.addEventListener(`pointerdown`, this.onDown), window.addEventListener(`pointerup`, this.onUp), window.addEventListener(`pointercancel`, this.onCancel), e4.addEventListener(`pointermove`, this.onMove), window.addEventListener(`pointermove`, this.onWindowMove), e4.addEventListener(`pointerleave`, this.onLeave), e4.addEventListener(`pointerenter`, this.onEnter), e4.addEventListener(`contextmenu`, this.prevent), e4.addEventListener(`wheel`, this.onWheel, { passive: false }), window.addEventListener(`keydown`, this.onKeyDown), window.addEventListener(`keyup`, this.onKeyUp), window.addEventListener(`blur`, this.onBlur), document.addEventListener(`visibilitychange`, this.onBlur);
  }
  dispose() {
    let e4 = this.canvas;
    e4.removeEventListener(`pointerdown`, this.onDown), window.removeEventListener(`pointerup`, this.onUp), window.removeEventListener(`pointercancel`, this.onCancel), e4.removeEventListener(`pointermove`, this.onMove), window.removeEventListener(`pointermove`, this.onWindowMove), e4.removeEventListener(`pointerleave`, this.onLeave), e4.removeEventListener(`pointerenter`, this.onEnter), e4.removeEventListener(`contextmenu`, this.prevent), e4.removeEventListener(`wheel`, this.onWheel), window.removeEventListener(`keydown`, this.onKeyDown), window.removeEventListener(`keyup`, this.onKeyUp), window.removeEventListener(`blur`, this.onBlur), document.removeEventListener(`visibilitychange`, this.onBlur);
  }
  isHeld(e4) {
    return this.held.has(e4);
  }
  consumeKeys() {
    let e4 = this.keyQueue;
    return this.keyQueue = [], e4;
  }
  endFrame() {
    this.pointer.leftPressed = false, this.pointer.rightPressed = false, this.pointer.leftReleased = false, this.pointer.rightReleased = false, this.wheel = 0;
  }
  injectPointer(e4, t2) {
    this.pointer.x = e4, this.pointer.y = t2, this.pointer.inside = true;
  }
  gesture() {
    this.gestured || (this.gestured = true, this.onFirstGesture?.());
  }
  prevent = (e4) => e4.preventDefault();
  setPos(e4) {
    let t2 = this.canvas.getBoundingClientRect();
    this.pointer.x = e4.clientX - t2.left, this.pointer.y = e4.clientY - t2.top;
  }
  onDown = (e4) => {
    this.gesture(), this.setPos(e4), this.pointer.inside = true, this.shift = e4.shiftKey, this.ctrl = e4.ctrlKey, e4.button === 0 ? (this.pointer.leftDown = true, this.pointer.leftPressed = true) : e4.button === 2 && (this.pointer.rightDown = true, this.pointer.rightPressed = true);
    try {
      this.canvas.setPointerCapture(e4.pointerId);
    } catch {
    }
    e4.preventDefault();
  };
  onUp = (e4) => {
    e4.button === 0 && this.pointer.leftDown ? (this.pointer.leftDown = false, this.pointer.leftReleased = true) : e4.button === 2 && this.pointer.rightDown && (this.pointer.rightDown = false, this.pointer.rightReleased = true);
  };
  onCancel = () => {
    this.pointer.leftDown = false, this.pointer.rightDown = false;
  };
  onMove = (e4) => {
    this.setPos(e4), this.pointer.inside = true;
  };
  onWindowMove = (e4) => {
    this.setPos(e4), this.shift = e4.shiftKey, this.ctrl = e4.ctrlKey, this.alt = e4.altKey;
  };
  onLeave = () => {
    this.pointer.inside = false;
  };
  onEnter = () => {
    this.pointer.inside = true;
  };
  onWheel = (e4) => {
    this.wheel += Math.sign(e4.deltaY), e4.preventDefault();
  };
  onKeyDown = (e4) => {
    let t2 = document.activeElement;
    t2 && (t2.tagName === `INPUT` || t2.tagName === `TEXTAREA` || t2.isContentEditable) || (this.gesture(), this.shift = e4.shiftKey, this.ctrl = e4.ctrlKey, this.alt = e4.altKey, e4.repeat || this.keyQueue.push(e4.code), this.held.add(e4.code), (e4.code === `Tab` || e4.code.startsWith(`F`) || e4.code === `AltLeft` || e4.code === `AltRight` || e4.code === `Space`) && e4.preventDefault());
  };
  onKeyUp = (e4) => {
    this.shift = e4.shiftKey, this.ctrl = e4.ctrlKey, this.alt = e4.altKey, this.held.delete(e4.code);
  };
  onBlur = () => {
    this.held.clear(), this.pointer.leftDown = false, this.pointer.rightDown = false, this.shift = false, this.ctrl = false, this.alt = false;
  };
};
function Md(e4, t2) {
  let n2 = Math.imul(e4 ^ 2654435769, 2246822507) ^ Math.imul(t2 + 2135587861, 3266489909);
  return n2 ^= n2 >>> 16, n2 = Math.imul(n2, 2146121005), n2 ^= n2 >>> 15, n2 = Math.imul(n2, 2221713035), n2 ^= n2 >>> 16, n2 >>> 0;
}
function Nd(e4, t2, n2 = 0) {
  return Md(Md(e4 | 0, t2 | 0), n2) / 4294967296;
}
function Pd(e4, t2, n2 = 0) {
  let r2 = Math.floor(e4), i2 = Math.floor(t2), a2 = e4 - r2, o2 = t2 - i2, s2 = a2 * a2 * (3 - 2 * a2), c2 = o2 * o2 * (3 - 2 * o2), l2 = Nd(r2, i2, n2), u2 = Nd(r2 + 1, i2, n2), d2 = Nd(r2, i2 + 1, n2), f2 = Nd(r2 + 1, i2 + 1, n2);
  return l2 + (u2 - l2) * s2 + (d2 - l2) * c2 + (l2 - u2 - d2 + f2) * s2 * c2;
}
function Fd(e4, t2, n2 = 4, r2 = 0) {
  let i2 = 0.5, a2 = 1, o2 = 0, s2 = 0;
  for (let c2 = 0; c2 < n2; c2 += 1) o2 += i2 * Pd(e4 * a2, t2 * a2, r2 + c2 * 131), s2 += i2, i2 *= 0.5, a2 *= 2.03;
  return o2 / s2;
}
var Id, Ld = t((() => {
  Id = class e4 {
    state;
    constructor(e5 = 1) {
      this.state = e5 >>> 0;
    }
    reseed(e5) {
      this.state = e5 >>> 0;
    }
    next() {
      this.state = this.state + 1831565813 >>> 0;
      let e5 = this.state;
      return e5 = Math.imul(e5 ^ e5 >>> 15, e5 | 1), e5 ^= e5 + Math.imul(e5 ^ e5 >>> 7, e5 | 61), ((e5 ^ e5 >>> 14) >>> 0) / 4294967296;
    }
    range(e5, t2) {
      return e5 + (t2 - e5) * this.next();
    }
    int(e5, t2) {
      return e5 + Math.floor(this.next() * (t2 - e5 + 1));
    }
    chance(e5) {
      return this.next() < e5;
    }
    pick(e5) {
      return e5[Math.floor(this.next() * e5.length)];
    }
    weighted(e5, t2) {
      let n2 = 0;
      for (let r3 of e5) n2 += Math.max(0, t2(r3));
      let r2 = this.next() * n2;
      for (let n3 of e5) if (r2 -= Math.max(0, t2(n3)), r2 <= 0) return n3;
      return e5[e5.length - 1];
    }
    shuffle(e5) {
      for (let t2 = e5.length - 1; t2 > 0; --t2) {
        let n2 = Math.floor(this.next() * (t2 + 1)), r2 = e5[t2];
        e5[t2] = e5[n2], e5[n2] = r2;
      }
      return e5;
    }
    soft() {
      return this.next() + this.next() + this.next() - 1.5;
    }
    fork(t2) {
      return new e4(Md(this.state, t2));
    }
  };
}));
Ld();
var Rd = Math.SQRT2, zd = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Rd], [1, -1, Rd], [-1, 1, Rd], [-1, -1, Rd]], Bd = class {
  w;
  h;
  walk;
  los;
  explored;
  gScore;
  parent;
  closedStamp;
  openStamp;
  stamp = 1;
  heap;
  heapF;
  heapSize = 0;
  constructor(e4, t2) {
    this.w = e4, this.h = t2;
    let n2 = e4 * t2;
    this.walk = new Uint8Array(n2), this.los = new Uint8Array(n2), this.explored = new Uint8Array(n2), this.gScore = new Float32Array(n2), this.parent = new Int32Array(n2), this.closedStamp = new Uint32Array(n2), this.openStamp = new Uint32Array(n2), this.heap = new Int32Array(n2), this.heapF = new Float32Array(n2);
  }
  inBounds(e4, t2) {
    return e4 >= 0 && t2 >= 0 && e4 < this.w && t2 < this.h;
  }
  idx(e4, t2) {
    return t2 * this.w + e4;
  }
  isWalkable(e4, t2) {
    return this.inBounds(e4, t2) && this.walk[t2 * this.w + e4] === 1;
  }
  walkableAt(e4, t2) {
    return this.isWalkable(Math.floor(e4), Math.floor(t2));
  }
  blocksSight(e4, t2) {
    return !this.inBounds(e4, t2) || this.los[t2 * this.w + e4] === 1;
  }
  lineOfSight(e4, t2, n2, r2) {
    let i2 = Math.floor(e4), a2 = Math.floor(t2), o2 = Math.floor(n2), s2 = Math.floor(r2), c2 = n2 - e4, l2 = r2 - t2, u2 = c2 > 0 ? 1 : -1, d2 = l2 > 0 ? 1 : -1, f2 = c2 === 0 ? 1 / 0 : Math.abs(1 / c2), p2 = l2 === 0 ? 1 / 0 : Math.abs(1 / l2), m2 = c2 === 0 ? 1 / 0 : (c2 > 0 ? i2 + 1 - e4 : e4 - i2) * f2, h2 = l2 === 0 ? 1 / 0 : (l2 > 0 ? a2 + 1 - t2 : t2 - a2) * p2, g2 = 0;
    for (; !(i2 === o2 && a2 === s2) && g2 < 512; ) {
      if (m2 < h2 ? (m2 += f2, i2 += u2) : (h2 += p2, a2 += d2), this.blocksSight(i2, a2)) return false;
      g2 += 1;
    }
    return true;
  }
  walkLine(e4, t2, n2, r2, i2 = 0.3) {
    let a2 = n2 - e4, o2 = r2 - t2, s2 = Math.hypot(a2, o2);
    if (s2 < 1e-4) return this.walkableAt(e4, t2);
    let c2 = -o2 / s2, l2 = a2 / s2, u2 = Math.ceil(s2 / 0.35);
    for (let n3 = 0; n3 <= u2; n3 += 1) {
      let r3 = n3 / u2, s3 = e4 + a2 * r3, d2 = t2 + o2 * r3;
      if (!this.walkableAt(s3, d2) || i2 > 0 && (!this.walkableAt(s3 + c2 * i2, d2 + l2 * i2) || !this.walkableAt(s3 - c2 * i2, d2 - l2 * i2))) return false;
    }
    return true;
  }
  nearestWalkable(e4, t2, n2 = 12) {
    let r2 = Math.floor(e4), i2 = Math.floor(t2);
    if (this.isWalkable(r2, i2)) return { x: e4, z: t2 };
    let a2 = null, o2 = 1 / 0;
    for (let s2 = 1; s2 <= n2; s2 += 1) {
      for (let n3 = -s2; n3 <= s2; n3 += 1) for (let c2 = -s2; c2 <= s2; c2 += 1) {
        if (Math.abs(c2) !== s2 && Math.abs(n3) !== s2) continue;
        let l2 = r2 + c2, u2 = i2 + n3;
        if (!this.isWalkable(l2, u2)) continue;
        let d2 = l2 + 0.5, f2 = u2 + 0.5, p2 = (d2 - e4) ** 2 + (f2 - t2) ** 2;
        p2 < o2 && (o2 = p2, a2 = { x: d2, z: f2 });
      }
      if (a2) return a2;
    }
    return null;
  }
  heapPush(e4, t2) {
    let n2 = this.heapSize++;
    for (this.heap[n2] = e4, this.heapF[n2] = t2; n2 > 0; ) {
      let e5 = n2 - 1 >> 1;
      if (this.heapF[e5] <= this.heapF[n2]) break;
      let t3 = this.heap[e5], r2 = this.heapF[e5];
      this.heap[e5] = this.heap[n2], this.heapF[e5] = this.heapF[n2], this.heap[n2] = t3, this.heapF[n2] = r2, n2 = e5;
    }
  }
  heapPop() {
    let e4 = this.heap[0], t2 = --this.heapSize;
    if (t2 > 0) {
      this.heap[0] = this.heap[t2], this.heapF[0] = this.heapF[t2];
      let e5 = 0;
      for (; ; ) {
        let n2 = e5 * 2 + 1, r2 = n2 + 1, i2 = e5;
        if (n2 < t2 && this.heapF[n2] < this.heapF[i2] && (i2 = n2), r2 < t2 && this.heapF[r2] < this.heapF[i2] && (i2 = r2), i2 === e5) break;
        let a2 = this.heap[i2], o2 = this.heapF[i2];
        this.heap[i2] = this.heap[e5], this.heapF[i2] = this.heapF[e5], this.heap[e5] = a2, this.heapF[e5] = o2, e5 = i2;
      }
    }
    return e4;
  }
  findPath(e4, t2, n2, r2, i2 = 12e3, a2 = true, o2 = 0.3) {
    let s2 = this.w, c2 = Math.floor(e4), l2 = Math.floor(t2);
    if (!this.isWalkable(c2, l2)) {
      let n3 = this.nearestWalkable(e4, t2, 3);
      if (!n3) return null;
      c2 = Math.floor(n3.x), l2 = Math.floor(n3.z);
    }
    let u2 = Math.floor(n2), d2 = Math.floor(r2), f2 = true;
    if (!this.isWalkable(u2, d2)) {
      let e5 = this.nearestWalkable(n2, r2, 8);
      if (!e5) return null;
      u2 = Math.floor(e5.x), d2 = Math.floor(e5.z), f2 = false;
    }
    if (c2 === u2 && l2 === d2) return f2 ? [{ x: n2, z: r2 }] : [];
    this.stamp += 1, this.stamp > 4294967280 && (this.stamp = 1, this.closedStamp.fill(0), this.openStamp.fill(0));
    let p2 = this.stamp;
    this.heapSize = 0;
    let m2 = l2 * s2 + c2, h2 = d2 * s2 + u2;
    this.gScore[m2] = 0, this.parent[m2] = -1, this.openStamp[m2] = p2;
    let g2 = (e5) => {
      let t3 = e5 % s2, n3 = e5 / s2 | 0, r3 = Math.abs(t3 - u2), i3 = Math.abs(n3 - d2);
      return r3 + i3 + (Rd - 2) * Math.min(r3, i3);
    };
    this.heapPush(m2, g2(m2));
    let _2 = m2, v2 = g2(m2), y2 = 0, b2 = false;
    for (; this.heapSize > 0 && y2 < i2; ) {
      let e5 = this.heapPop();
      if (this.closedStamp[e5] === p2) continue;
      if (this.closedStamp[e5] = p2, y2 += 1, e5 === h2) {
        b2 = true;
        break;
      }
      let t3 = g2(e5);
      t3 < v2 && (v2 = t3, _2 = e5);
      let n3 = e5 % s2, r3 = e5 / s2 | 0;
      for (let [t4, i3, a3] of zd) {
        let o3 = n3 + t4, c3 = r3 + i3;
        if (!this.isWalkable(o3, c3) || t4 !== 0 && i3 !== 0 && (!this.isWalkable(n3 + t4, r3) || !this.isWalkable(n3, r3 + i3))) continue;
        let l3 = c3 * s2 + o3;
        if (this.closedStamp[l3] === p2) continue;
        let u3 = this.gScore[e5] + a3;
        (this.openStamp[l3] !== p2 || u3 < this.gScore[l3]) && (this.openStamp[l3] = p2, this.gScore[l3] = u3, this.parent[l3] = e5, this.heapPush(l3, u3 + g2(l3) * 1.001));
      }
    }
    let x2 = h2;
    if (!b2) {
      if (!a2 || _2 === m2) return null;
      x2 = _2, f2 = false;
    }
    let S2 = [];
    for (let e5 = x2; e5 !== -1 && e5 !== m2; e5 = this.parent[e5]) S2.push(e5);
    S2.reverse();
    let C2 = S2.map((e5) => ({ x: e5 % s2 + 0.5, z: (e5 / s2 | 0) + 0.5 }));
    return f2 && C2.length > 0 && (C2[C2.length - 1] = { x: n2, z: r2 }), this.smooth(e4, t2, C2, o2);
  }
  smooth(e4, t2, n2, r2) {
    if (n2.length <= 1) return n2;
    let i2 = [], a2 = e4, o2 = t2, s2 = 0;
    for (; s2 < n2.length; ) {
      let e5 = n2.length - 1;
      for (; e5 > s2 && !this.walkLine(a2, o2, n2[e5].x, n2[e5].z, r2); ) --e5;
      i2.push(n2[e5]), a2 = n2[e5].x, o2 = n2[e5].z, s2 = e5 + 1;
    }
    return i2;
  }
  reveal(e4, t2, n2, r2) {
    let i2 = false, a2 = n2 * n2, o2 = Math.max(0, Math.floor(e4 - n2)), s2 = Math.min(this.w - 1, Math.floor(e4 + n2)), c2 = Math.max(0, Math.floor(t2 - n2)), l2 = Math.min(this.h - 1, Math.floor(t2 + n2));
    for (let n3 = c2; n3 <= l2; n3 += 1) for (let c3 = o2; c3 <= s2; c3 += 1) {
      let o3 = n3 * this.w + c3;
      if (this.explored[o3]) continue;
      let s3 = c3 + 0.5 - e4, l3 = n3 + 0.5 - t2;
      s3 * s3 + l3 * l3 > a2 || r2 && !this.los[o3] && !this.lineOfSight(e4, t2, c3 + 0.5, n3 + 0.5) || r2 && this.los[o3] && !this.lineOfSight(e4, t2, c3 + 0.5 - Math.sign(s3) * 0.9, n3 + 0.5 - Math.sign(l3) * 0.9) || (this.explored[o3] = 1, i2 = true);
    }
    return i2;
  }
}, Vd = class {
  nav;
  dist;
  queue;
  targetCell = -1;
  age = 0;
  constructor(e4) {
    this.nav = e4, this.dist = new Uint16Array(e4.w * e4.h), this.queue = new Int32Array(e4.w * e4.h);
  }
  build(e4, t2, n2 = 48) {
    let r2 = this.nav, i2 = r2.w;
    this.dist.fill(65535);
    let a2 = r2.nearestWalkable(e4, t2, 4);
    a2 ||= { x: e4, z: t2 };
    let o2 = Math.floor(a2.x), s2 = Math.floor(a2.z);
    if (!r2.inBounds(o2, s2)) return;
    let c2 = s2 * i2 + o2;
    this.targetCell = c2;
    let l2 = this.dist;
    l2[c2] = 0;
    let u2 = 0, d2 = 0;
    this.queue[d2++] = c2;
    let f2 = n2 * 10;
    for (; u2 < d2; ) {
      let e5 = this.queue[u2++], t3 = e5 % i2, n3 = e5 / i2 | 0, a3 = l2[e5];
      if (!(a3 > f2)) {
        for (let [e6, o3, s3] of zd) {
          let c3 = t3 + e6, u3 = n3 + o3;
          if (!r2.isWalkable(c3, u3) || e6 !== 0 && o3 !== 0 && (!r2.isWalkable(t3 + e6, n3) || !r2.isWalkable(t3, n3 + o3))) continue;
          let f3 = u3 * i2 + c3, p2 = a3 + (s3 === 1 ? 10 : 14);
          p2 < l2[f3] && (l2[f3] = p2, d2 < this.queue.length && (this.queue[d2++] = f3));
        }
        if (d2 >= this.queue.length - 8) break;
      }
    }
  }
  direction(e4, t2, n2) {
    let r2 = this.nav, i2 = Math.floor(e4), a2 = Math.floor(t2);
    if (!r2.inBounds(i2, a2)) return false;
    let o2 = this.dist[a2 * r2.w + i2];
    if (o2 === 65535) return false;
    let s2 = o2, c2 = 0, l2 = 0;
    for (let [n3, o3] of zd) {
      let u3 = i2 + n3, d2 = a2 + o3;
      if (!r2.isWalkable(u3, d2) || n3 !== 0 && o3 !== 0 && (!r2.isWalkable(i2 + n3, a2) || !r2.isWalkable(i2, a2 + o3))) continue;
      let f2 = this.dist[d2 * r2.w + u3];
      f2 < s2 && (s2 = f2, c2 = u3 + 0.5 - e4, l2 = d2 + 0.5 - t2);
    }
    if (s2 === o2) return false;
    let u2 = Math.hypot(c2, l2) || 1;
    return n2.x = c2 / u2, n2.z = l2 / u2, true;
  }
  distanceAt(e4, t2) {
    let n2 = Math.floor(e4), r2 = Math.floor(t2);
    return this.nav.inBounds(n2, r2) ? this.dist[r2 * this.nav.w + n2] : 65535;
  }
};
